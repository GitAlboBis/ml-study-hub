// Logica del widget m09-griglia-esempi-1d ("Le griglie di Melgani in 1-D: normale e bimodale"), concetti c54,
// c55, c57. Le figure delle slide p62-63 (da Duda-Hart): stime di Parzen con kernel gaussiano e h_N = h_1/√N,
// colonne h_1 = 1, 0.5, 0.1, righe N = 1, 10, 100, ∞ (normale standard) e N = 1, 16, 256, ∞ (bimodale
// triangolo + rettangolo). I campioni sono annidati (la riga N = 100 contiene i 10 della riga sopra), a seme.
import { createRng } from '../../lib/rng'
import { linspace, normalCdf, normalPdf, trapz } from '../../lib/ml/stats'
import { BIMODAL_HEIGHT, bimodalPdf, sampleBimodal, simpson } from './proprieta/teoria'

export type Tab = 'normale' | 'bimodale'

export interface TabSpec {
  label: string
  domain: readonly [number, number]
  yMax: number
  /** le righe della figura; Infinity è la riga N = ∞ */
  rows: readonly number[]
  truth: (x: number) => number
}

export const TABS: Record<Tab, TabSpec> = {
  normale: { label: 'Normale', domain: [-2, 2], yMax: 1.2, rows: [1, 10, 100, Number.POSITIVE_INFINITY], truth: (x) => normalPdf(x) },
  bimodale: { label: 'Bimodale', domain: [0, 4], yMax: 1, rows: [1, 16, 256, Number.POSITIVE_INFINITY], truth: bimodalPdf },
}

export const H1S = [1, 0.5, 0.1] as const
export const TRIAL_H1 = { min: 0.05, max: 2, step: 0.05, initial: 0.3 } as const
export const TRIAL_NS = [16, 64, 256, 1024] as const
export const POOL = 1024
export const CELL_MS = 300

/** h_N = h_1/√N (per N = ∞ la larghezza tende a 0: si restituisce 0). */
export const hN = (h1: number, N: number): number => (Number.isFinite(N) ? h1 / Math.sqrt(N) : 0)

/** I campioni della scheda, annidati: la stima con N usa i primi N. */
export function pool(tab: Tab, seed: number, size = POOL): number[] {
  const rng = createRng(seed * 977 + (tab === 'normale' ? 1 : 2))
  return Array.from({ length: size }, () => (tab === 'normale' ? rng.normal() : sampleBimodal(rng)))
}

/** Stima di Parzen gaussiana con i primi N campioni, su una griglia. */
export function estimate(xs: readonly number[], samples: readonly number[], N: number, h: number): number[] {
  const s = samples.slice(0, N)
  const c = 1 / (N * h * Math.sqrt(2 * Math.PI))
  return xs.map((x) => {
    let v = 0
    for (const xk of s) {
      const u = (x - xk) / h
      if (u * u < 80) v += Math.exp(-0.5 * u * u)
    }
    return v * c
  })
}

/** E{p̂(x)} = p * N(0, h²): per la normale in forma chiusa (N(0, 1 + h²)), per la bimodale per quadratura. */
export function expected(tab: Tab, x: number, h: number): number {
  if (h <= 0) return TABS[tab].truth(x)
  if (tab === 'normale') return normalPdf(x, 0, Math.sqrt(1 + h * h))
  // rettangolo in forma chiusa, triangolo per quadratura sul suo supporto
  const rect = BIMODAL_HEIGHT * (normalCdf((x - 3) / h) - normalCdf((x - 3.5) / h))
  // si integra solo dove la gaussiana pesa (±7h), spezzando nel vertice del triangolo
  const a = Math.max(0.5, x - 7 * h)
  const b = Math.min(2.5, x + 7 * h)
  if (b <= a) return rect
  const f = (t: number) => bimodalPdf(t) * normalPdf(x - t, 0, h)
  const tri = a < 1.5 && b > 1.5 ? simpson(f, a, 1.5, 200) + simpson(f, 1.5, b, 200) : simpson(f, a, b, 200)
  return rect + tri
}

/** Errore quadratico integrato della stima rispetto alla verità, sul dominio della scheda. */
export function ise(tab: Tab, xs: readonly number[], est: readonly number[]): number {
  const t = TABS[tab].truth
  return trapz(xs, xs.map((x, i) => (est[i] - t(x)) ** 2))
}

/** Il modello parametrico gaussiano a massima verosimiglianza: media e deviazione standard (divisa per N). */
export function mlGaussian(samples: readonly number[], N: number): { mu: number; sigma: number } | null {
  if (N < 2) return null
  const s = samples.slice(0, N)
  const mu = s.reduce((a, b) => a + b, 0) / N
  const sigma = Math.sqrt(s.reduce((a, b) => a + (b - mu) ** 2, 0) / N)
  return sigma > 0 ? { mu, sigma } : null
}

// --- la sfida: il bordo verticale del rettangolo ---

/** Salita dal 10% al 90% di un gradino smussato da una gaussiana di larghezza h: 2·z₀.₉·h = 2.563·h. */
export const riseWidth = (h: number): number => 2 * 1.2815515655446004 * h
export const RISE_LIMIT = 0.1

/** Salita misurata sulla media della stima attorno al bordo sinistro del rettangolo (x = 3). */
export function measuredRise(h: number): number {
  const f = (x: number) => BIMODAL_HEIGHT * (normalCdf((x - 3) / h) - normalCdf((x - 3.5) / h))
  const at = (level: number) => {
    let lo = 2.6
    let hi = 3.25
    for (let i = 0; i < 80; i++) {
      const m = (lo + hi) / 2
      if (f(m) < level * BIMODAL_HEIGHT) lo = m
      else hi = m
    }
    return (lo + hi) / 2
  }
  return at(0.9) - at(0.1)
}

/** Il più piccolo N fra quelli offerti per cui h_1 = 0.5 mostra il bordo: salita sotto 0.1. */
export function minimalN(h1 = 0.5): number {
  return TRIAL_NS.find((N) => riseWidth(hN(h1, N)) < RISE_LIMIT) ?? TRIAL_NS[TRIAL_NS.length - 1]
}

export const gridXs = (tab: Tab, points = 161): number[] => linspace(TABS[tab].domain[0], TABS[tab].domain[1], points)
