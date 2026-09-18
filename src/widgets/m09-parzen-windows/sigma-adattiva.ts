// Logica del widget m09-sigma-adattiva ("σ adattiva: una larghezza per ogni campione"), concetti c62, c63, c64.
// Slide p65: si può associare a ogni x_k la sua σ_k, per esempio la distanza euclidea media dai suoi L vicini più
// prossimi y_1, …, y_L (fra gli altri campioni). Note p45: σ piccola dove i campioni sono fitti, grande dove sono
// radi. Scenario (inventario): 60 letture (temperatura, umidità) di una serra in unità normalizzate, 50 in un
// ammasso fittissimo (condizioni normali) e 10 sparse (guasti). Nell'ammasso c'è una terna quasi coincidente:
// con L piccolo dà σ_k ≈ 0, un ago altissimo e spurio.
import { createRng } from '../../lib/rng'
import { adaptiveSigmas, nearestNeighbors, spechtDensity } from '../../lib/ml/nonparam'
import { niceLogSteps } from '../engines/density1d'

export type Pt = readonly [number, number]

export const DOMAIN: readonly [number, number] = [-2.5, 2.5]
export const L_RANGE = { min: 1, max: 15, initial: 3 } as const
export const SIGMA_FIXED = niceLogSteps(0.02, 2)
export const INITIAL_FIXED = 0.3
/** Sotto questa σ_k un kernel è un ago: alto 1/(N·2π σ_k²), più di cento volte l'ammasso. */
export const NEEDLE_SIGMA = 0.02
export const CALC_MS = 80
/** Il campione evidenziato della sfida (uno dei dieci sparsi) e la L con cui calcolarne σ_k a mano. */
export const CHALLENGE_K = 55
export const CHALLENGE_L = 2

/** Le 60 letture: 47 nell'ammasso, una terna quasi coincidente, 10 sparse. */
export function readings(seed = 5): Pt[] {
  const rng = createRng(seed)
  const r2 = (v: number) => Number(v.toFixed(3))
  const cluster = Array.from({ length: 47 }, () => [r2(-0.4 + rng.normal(0, 0.25)), r2(-0.3 + rng.normal(0, 0.25))] as const)
  const triple: Pt[] = [
    [-0.55, -0.1],
    [-0.546, -0.103],
    [-0.552, -0.105],
  ]
  const sparse = Array.from({ length: 10 }, (_, i) => {
    const a = (2 * Math.PI * i) / 10 + rng.next() * 0.4
    const r = 1.1 + rng.next() * 0.9
    return [r2(-0.2 + r * Math.cos(a)), r2(-0.1 + r * Math.sin(a))] as const
  })
  return [...cluster, ...triple, ...sparse]
}

export const sigmasFor = (pts: readonly Pt[], L: number): number[] => adaptiveSigmas(pts, L)

/** I L vicini di x_k fra gli altri campioni, con le distanze: le frecce del calcolo di σ_k. */
export function neighborsOf(pts: readonly Pt[], k: number, L: number): { index: number; distance: number }[] {
  const others = pts.map((p, i) => ({ p, i })).filter((o) => o.i !== k)
  return nearestNeighbors(pts[k], others.map((o) => o.p), Math.min(L, others.length)).map((nb) => ({ index: others[nb.index].i, distance: nb.distance }))
}

export const densityFixed = (x: Pt, pts: readonly Pt[], sigma: number): number => spechtDensity(x, pts, sigma)
export const densityAdaptive = (x: Pt, pts: readonly Pt[], sigmas: readonly number[]): number => spechtDensity(x, pts, sigmas.map((s) => Math.max(s, 1e-6)))

/** I campioni che con questa L diventano aghi spuri (σ_k sotto la soglia). */
export const spurious = (sigmas: readonly number[]): number[] => sigmas.map((s, i) => (s < NEEDLE_SIGMA ? i : -1)).filter((i) => i >= 0)

/** Il più piccolo L che toglie tutti gli aghi spuri. */
export function minimalL(pts: readonly Pt[]): number {
  for (let L = L_RANGE.min; L <= L_RANGE.max; L++) if (spurious(sigmasFor(pts, L)).length === 0) return L
  return L_RANGE.max
}

/** Altezza del picco di un kernel adattivo in 2-D: (1/N)·1/(2π σ_k²). */
export const peakOf = (sigma: number, n: number): number => 1 / (n * 2 * Math.PI * sigma * sigma)

export function judge(pts: readonly Pt[], sigmaAnswer: number, lAnswer: number): { ok: boolean; sigmaTrue: number; lTrue: number; sigmaOk: boolean; lOk: boolean } {
  const sigmaTrue = sigmasFor(pts, CHALLENGE_L)[CHALLENGE_K]
  const lTrue = minimalL(pts)
  const sigmaOk = Math.abs(sigmaAnswer - sigmaTrue) <= 0.01
  const lOk = lAnswer === lTrue
  return { ok: sigmaOk && lOk, sigmaTrue, lTrue, sigmaOk, lOk }
}
