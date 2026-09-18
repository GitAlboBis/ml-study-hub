// Logica del widget m09-convergenza-parzen-knn ("V = 1/√N contro K = √N: convergono entrambi?"), concetto c69.
// Slide p46: nel punto x*, Parzen fissa la regione con V_N = 1/√N (la cella si restringe qualunque siano i dati),
// il K-NN fissa K_N = √N (la cella si adatta ai dati). Slide p61 e p47: consistenza se V_N → 0 e N·V_N → +∞
// (Parzen), se K_N → +∞ e K_N/N → 0 (K-NN). Scenario (inventario): pixel di "suolo nudo" nel piano di due bande
// normalizzate in [0, 1]², verità gaussiana 2-D centrata in (0.35, 0.60) con deviazione standard 0.2, punto
// x* = (0.5, 0.5), p(x*) = 2.65. I campioni fuori dal riquadro non si disegnano ma contano in N.
import { createRng } from '../../lib/rng'
import { powerLimit } from './proprieta/teoria'
import type { Limit } from './proprieta/teoria'

export type Pt = readonly [number, number]
export const CENTER: Pt = [0.35, 0.6]
export const SD = 0.2
export const X_STAR: Pt = [0.5, 0.5]
export const BOXES = [1, 4, 9, 16, 100] as const
export const WALK = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100] as const
export const WALK_MS = 600
export const POOL = 100

export const truth = (x: Pt): number => Math.exp(-((x[0] - CENTER[0]) ** 2 + (x[1] - CENTER[1]) ** 2) / (2 * SD * SD)) / (2 * Math.PI * SD * SD)

/** Seme iniziale: un training set tipico, in cui a N = 64-100 le due stime stanno vicine al valore vero. */
export const SEED = 8

export function pool(seed = SEED): Pt[] {
  const rng = createRng(seed * 4099 + 3)
  return Array.from({ length: POOL }, () => [rng.normal(CENTER[0], SD), rng.normal(CENTER[1], SD)] as const)
}

export type ParzenLaw = 'radice' | 'costante' | 'inverso'
export type KnnLaw = 'radice' | 'tre' | 'meta'
export const PARZEN_LAWS: Record<ParzenLaw, { label: string; tex: string }> = {
  radice: { label: 'V = 1/√N (slide)', tex: 'V=\\frac{1}{\\sqrt{N}}' },
  costante: { label: 'V costante = 0.3', tex: 'V=0.3' },
  inverso: { label: 'V = 1/N', tex: 'V=\\frac{1}{N}' },
}
export const KNN_LAWS: Record<KnnLaw, { label: string; tex: string }> = {
  radice: { label: 'K = √N (slide)', tex: 'K=\\sqrt{N}' },
  tre: { label: 'K = 3 costante', tex: 'K=3' },
  meta: { label: 'K = N/2', tex: 'K=\\frac{N}{2}' },
}

export const volumeOf = (law: ParzenLaw, N: number): number => (law === 'radice' ? 1 / Math.sqrt(N) : law === 'costante' ? 0.3 : 1 / N)
export const kOf = (law: KnnLaw, N: number): number => Math.max(1, Math.min(N, law === 'radice' ? Math.round(Math.sqrt(N)) : law === 'tre' ? 3 : Math.round(N / 2)))

/** Limiti per N → ∞ delle due condizioni di ciascun metodo, con la legge scelta. */
export function parzenLimits(law: ParzenLaw): { V: Limit; NV: Limit } {
  const e = law === 'radice' ? -0.5 : law === 'costante' ? 0 : -1
  return { V: powerLimit(e), NV: powerLimit(1 + e) }
}
export function knnLimits(law: KnnLaw): { K: Limit; KN: Limit } {
  const e = law === 'radice' ? 0.5 : law === 'tre' ? 0 : 1
  return { K: powerLimit(e), KN: powerLimit(e - 1) }
}

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])

export interface ParzenCell {
  V: number
  r: number
  K: number
  p: number
}
/** Parzen in x*: cerchio di area V centrato in x*, raggio √(V/π); K contati; p̂ = K/(N V). */
export function parzenCell(x: Pt, samples: readonly Pt[], V: number): ParzenCell {
  const r = Math.sqrt(V / Math.PI)
  const K = samples.reduce((k, s) => k + (dist(s, x) <= r ? 1 : 0), 0)
  return { V, r, K, p: K / (samples.length * V) }
}

export interface KnnCell {
  K: number
  r: number
  V: number
  p: number
  neighbors: number[]
}
/** K-NN in x*: cerchio fino al K-esimo vicino, V = π r_K², p̂ = K/(N V). */
export function knnCell(x: Pt, samples: readonly Pt[], K: number): KnnCell {
  const order = samples.map((s, i) => ({ i, d: dist(s, x) })).sort((a, b) => a.d - b.d || a.i - b.i)
  const r = Math.max(order[K - 1]?.d ?? 0, 1e-9)
  const V = Math.PI * r * r
  return { K, r, V, p: K / (samples.length * V), neighbors: order.slice(0, K).map((o) => o.i) }
}

/** La traccia: p̂(x*) contro N per i quadrati perfetti da 1 a 100, per i due metodi. */
export function trace(x: Pt, samples: readonly Pt[], pl: ParzenLaw, kl: KnnLaw): { N: number; parzen: number; knn: number }[] {
  return WALK.map((N) => {
    const s = samples.slice(0, N)
    return { N, parzen: parzenCell(x, s, volumeOf(pl, N)).p, knn: knnCell(x, s, kOf(kl, N)).p }
  })
}

// --- la sfida: prevedere quale spia diventa rossa e che errore resta ---

export type ParzenCond = 'V' | 'NV'
export type KnnCond = 'K' | 'KN'
export type ErrKind = 'bias' | 'varianza'

/** Con V = 1/N si viola N·V_N → ∞ (resta varianza); con K = N/2 si viola K_N/N → 0 (resta bias). */
export function expected(): { parzen: ParzenCond; parzenErr: ErrKind; knn: KnnCond; knnErr: ErrKind } {
  const p = parzenLimits('inverso')
  const k = knnLimits('meta')
  const parzen: ParzenCond = p.NV !== 'inf' ? 'NV' : 'V'
  const knn: KnnCond = k.KN !== 'zero' ? 'KN' : 'K'
  // restringere la regione toglie il bias, riempirla di campioni toglie la varianza
  return { parzen, parzenErr: parzen === 'V' ? 'bias' : 'varianza', knn, knnErr: knn === 'KN' ? 'bias' : 'varianza' }
}

/** Legge del ponte con Parzen: h_N = 1/N^(1/(2n)) in n = 2 dà V_N = h_N² = 1/√N. */
export const bridgeH = (N: number, n = 2): number => N ** (-1 / (2 * n))
