// Logica del widget m09-parzen-contro-knn ("Parzen contro K-NN: chi tiene fermo che cosa"), concetti c02 e c03.
// Stessa formula p̂(x*) = K/(N V), scelta opposta: Parzen fissa il volume V = h e conta K; il K-NN fissa K e
// misura il volume V_K(x*) = 2·r_K, la cella che si allarga fino al K-esimo vicino. Scenario (inventario): tempi di
// risposta (0-4 s) di un sensore IoT che a volte risponde subito e a volte dopo un ritardo fisso: la bimodale
// triangolo + rettangolo delle slide p62-63 e p50. Dati sintetici a seme, annidati (N = 16 ⊂ N = 256).
import { createRng } from '../../lib/rng'
import { kernelValue, knnDensity1d, knnRadius1d } from '../../lib/ml/nonparam'
import { linspace, trapz } from '../../lib/ml/stats'
import { bimodalPdf, sampleBimodal } from './proprieta/teoria'

export type Win = 'rettangolare' | 'gaussiano'
export const DOMAIN: readonly [number, number] = [0, 4]
export const N_OPTIONS = [1, 16, 256, Number.POSITIVE_INFINITY] as const
export const INITIAL = { N: 16, h: 0.5, K: 4, x: 1.5 }
export const H_RANGE = { min: 0.05, max: 2, step: 0.05 } as const
export const K_RANGE = { min: 1, max: 30 } as const
export const POOL = 256
export const Y_MAX = 1.6

export const truth = bimodalPdf

/** K = √N e h = 1/√N come nelle figure della slide p50 (K-NN) e p63 (Parzen, prima colonna). */
export const slideParams = (N: number): { h: number; K: number } => (Number.isFinite(N) ? { h: 1 / Math.sqrt(N), K: Math.max(1, Math.round(Math.sqrt(N))) } : { h: 0, K: 0 })

export function pool(seed = 1): number[] {
  const rng = createRng(seed * 131 + 17)
  return Array.from({ length: POOL }, () => Number(sampleBimodal(rng).toFixed(3)))
}

/** Parzen in x*: K contati nella finestra di lato h (rettangolare) oppure la somma gaussiana. */
export function parzenAt(x: number, samples: readonly number[], h: number, win: Win): { K: number; S: number; p: number } {
  let K = 0
  let S = 0
  for (const s of samples) {
    const g = kernelValue((x - s) / h, win)
    S += g
    if (Math.abs(x - s) <= h / 2) K++
  }
  return { K, S, p: samples.length === 0 ? 0 : S / (samples.length * h) }
}

/** K-NN in x*: raggio r_K del K-esimo vicino, volume V_K = 2 r_K, stima K/(N V_K). */
export function knnAt(x: number, samples: readonly number[], K: number): { r: number; V: number; p: number } {
  if (samples.length === 0 || K > samples.length) return { r: Number.POSITIVE_INFINITY, V: Number.POSITIVE_INFINITY, p: 0 }
  const r = knnRadius1d(x, samples, K)
  return { r, V: 2 * r, p: knnDensity1d(x, samples, K) }
}

export const grid = (points = 401): number[] => linspace(DOMAIN[0], DOMAIN[1], points)

export const parzenCurve = (xs: readonly number[], samples: readonly number[], h: number, win: Win): number[] => xs.map((x) => parzenAt(x, samples, h, win).p)
export const knnCurve = (xs: readonly number[], samples: readonly number[], K: number): number[] => xs.map((x) => knnAt(x, samples, K).p)

/** Area sotto la curva della stima su un intervallo: Parzen con kernel-densità resta ≤ 1, il K-NN no. */
export function areaOn(f: (x: number) => number, domain: readonly [number, number], points = 4001): number {
  const xs = linspace(domain[0], domain[1], points)
  return trapz(xs, xs.map(f))
}

/** La corsa del cursore nel passo "traccia la curva": da 0 a 4 s. */
export const sweepX = (t: number): number => DOMAIN[0] + (DOMAIN[1] - DOMAIN[0]) * Math.min(1, Math.max(0, t))
/** Il passo "da una zona densa a una rada": x* da 1.5 (il picco del triangolo) a 2.8 (fra i due modi). */
export const dragX = (t: number): number => 1.5 + 1.3 * Math.min(1, Math.max(0, t))

export type Reason = 'cresce' | 'kernel' | 'area'
export const REASONS: Record<Reason, string> = {
  cresce: 'la cella si allarga finché contiene K campioni: V resta finito e K > 0',
  kernel: 'il K-NN usa un kernel gaussiano, che non vale mai zero',
  area: 'la stima K-NN ha area 1 e quindi non può annullarsi',
}

/** La sfida: con la finestra rettangolare, un x* dove Parzen vale 0 e il K-NN no, e la ragione giusta. */
export function judge(x: number, samples: readonly number[], h: number, K: number, win: Win, reason: Reason): { ok: boolean; parzen: number; knn: number } {
  const parzen = parzenAt(x, samples, h, win).p
  const knn = knnAt(x, samples, K).p
  return { ok: win === 'rettangolare' && parzen === 0 && knn > 0 && reason === 'cresce', parzen, knn }
}

/** La tabella comparativa (note p32 e slide p45-47), una riga per volta nello storyboard. */
export const TABLE: readonly { what: string; parzen: string; knn: string }[] = [
  { what: 'Che cosa è fissato', parzen: 'il volume V = hⁿ della regione', knn: 'il numero K di campioni' },
  { what: 'Che cosa si calcola', parzen: 'K, i campioni nella finestra', knn: 'V_K(x*), la cella fino al K-esimo vicino' },
  { what: 'Parametro da scegliere', parzen: 'h (larghezza della finestra)', knn: 'K (numero di vicini)' },
  { what: 'Regolarità della stima', parzen: 'liscia con un kernel liscio', knn: 'appuntita, con code lente (≈ 1/|x|)' },
  { what: 'Area unitaria', parzen: 'sì, con un kernel-densità', knn: 'no: l’integrale diverge' },
  { what: 'Dove non ci sono campioni', parzen: 'può valere zero (finestra a supporto limitato)', knn: 'mai zero' },
  { what: 'Adattività locale', parzen: 'no: la finestra è la stessa ovunque', knn: 'sì: la cella segue la densità locale' },
  { what: 'Sensibilità al rumore', parzen: 'minore (note p32)', knn: 'maggiore, dipende molto da K' },
]
