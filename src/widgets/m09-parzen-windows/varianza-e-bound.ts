// Logica del widget m09-varianza-e-bound ("Quanto trema la stima? Varianza misurata contro il bound").
// Scenario (inventario m09): un sensore di temperatura in serra, N letture al giorno, stima di Parzen nel punto
// sonda x_0 = 22 °C. Verità sintetica 0.7·N(22, 1.5²) + 0.3·N(27, 1.2²) °C; con n = 2, 3 feature la verità
// diventa una normale isotropa con deviazione standard 1.5 per feature, centrata in (22, …, 22).
// Si simulano 300 giorni (training set indipendenti, a seed): la dispersione dei valori p̂(x_0) è la varianza
// della stima, che la slide p60 limita con sup(γ)·p̄̂(x_0)/(N h_Nⁿ).
import type { Kernel } from '../../lib/ml/nonparam'
import { kernelValue } from '../../lib/ml/nonparam'
import { createRng } from '../../lib/rng'
import { intLogSteps, mixPdf, pointGaussMoments, pointMoments, pointStats, productMoments, sampleMix } from './proprieta/teoria'
import type { Comp, Moments, PointStats } from './proprieta/teoria'

export const SERRA: readonly Comp[] = [
  { w: 0.7, mu: 22, s: 1.5 },
  { w: 0.3, mu: 27, s: 1.2 },
]
/** Verità di ogni feature quando n > 1: normale con media 22 °C e deviazione standard 1.5. */
export const ISO: readonly Comp[] = [{ w: 1, mu: 22, s: 1.5 }]
/** Le coordinate del punto sonda oltre la prima: il centro della normale isotropa. */
export const CENTER = 22

export const DAYS = 300
export const DAY_MS = 30
export const X0_RANGE = [15, 32] as const
export const DOMAIN = [14, 32] as const
export const KERNELS: readonly Kernel[] = ['gaussiano', 'rettangolare', 'triangolare', 'esponenziale', 'cauchy']
export const N_STEPS = intLogSteps(10, 2000)
export const H_RANGE = { min: 0.1, max: 3, step: 0.05 } as const
export const DIMS = [1, 2, 3] as const
export type Dim = (typeof DIMS)[number]

export interface Params {
  x0: number
  N: number
  h: number
  kernel: Kernel
  n: Dim
}

export const INITIAL: Params = { x0: 22, N: 200, h: 0.5, kernel: 'gaussiano', n: 1 }

/** Verità della prima feature: la mistura della serra in 1-D, la normale isotropa in 2-D e 3-D. */
export const truthComps = (n: Dim): readonly Comp[] => (n === 1 ? SERRA : ISO)

/** Cache della quadratura (kernel non gaussiani): lo stesso punto torna a ogni fotogramma. */
const quadCache = new Map<string, Moments>()

/** Momenti di una campana nella coordinata `x` con verità `comps`: forma chiusa per il gaussiano, quadratura altrimenti. */
function moments1d(x: number, comps: readonly Comp[], h: number, kernel: Kernel): Moments {
  if (kernel === 'gaussiano') return pointGaussMoments(x, comps, h)
  const key = `${x}|${h}|${kernel}|${comps.map((c) => `${c.w},${c.mu},${c.s}`).join(';')}`
  const hit = quadCache.get(key)
  if (hit !== undefined) return hit
  const m = pointMoments(x, (t) => mixPdf(t, comps), h, kernel)
  if (quadCache.size > 400) quadCache.clear()
  quadCache.set(key, m)
  return m
}

/** Media, varianza vera e bound nel punto sonda (x_0, 22, …, 22), kernel prodotto in n dimensioni. */
export function theoryAt({ x0, N, h, kernel, n }: Params): PointStats {
  const comps = truthComps(n)
  const list = [moments1d(x0, comps, h, kernel)]
  for (let j = 1; j < n; j++) list.push(moments1d(CENTER, comps, h, kernel))
  return pointStats(productMoments(list), { N, h, n, kernel })
}

/** Densità vera lungo la prima feature, con le altre ferme a 22 (in 1-D: la mistura). */
export function truthSlice(x: number, n: Dim): number {
  const comps = truthComps(n)
  return mixPdf(x, comps) * mixPdf(CENTER, comps) ** (n - 1)
}

/** Quota massima fissa del grafico di sinistra per ogni n: le altezze si confrontano fra N e h diversi. */
export const yMaxFor = (n: Dim): number => 1.8 * truthSlice(22, n)

/** Seme del giorno d: ogni giorno è un training set indipendente, sempre lo stesso per lo stesso seme. */
const daySeed = (seed: number, d: number) => (seed * 7919 + d * 104729 + 17) >>> 0

/** Le letture di un giorno: N punti a n coordinate. */
export function daySamples(p: Params, seed: number, d: number): number[][] {
  const rng = createRng(daySeed(seed, d))
  if (p.n === 1) return sampleMix(rng, p.N, SERRA).map((v) => [v])
  return Array.from({ length: p.N }, () => Array.from({ length: p.n }, () => rng.normal(CENTER, 1.5)))
}

/** p̂ nel punto (x, 22, …, 22) con kernel prodotto: (1/(N hⁿ)) Σ_k Π_j γ((x_j − x_kj)/h). */
export function estimateAt(x: number, pts: readonly (readonly number[])[], h: number, kernel: Kernel, n: Dim): number {
  let s = 0
  for (const pt of pts) {
    let g = kernelValue((x - pt[0]) / h, kernel)
    for (let j = 1; j < n && g > 0; j++) g *= kernelValue((CENTER - pt[j]) / h, kernel)
    s += g
  }
  return s / pts.length / h ** n
}

/** La curva del giorno lungo la prima feature: i pesi delle altre coordinate si calcolano una volta sola. */
export function dayCurve(xs: readonly number[], pts: readonly (readonly number[])[], h: number, kernel: Kernel, n: Dim): number[] {
  const w = pts.map((pt) => {
    let g = 1
    for (let j = 1; j < n; j++) g *= kernelValue((CENTER - pt[j]) / h, kernel)
    return g
  })
  const live = pts.map((pt, k) => [pt[0], w[k]] as const).filter(([, wk]) => wk > 0)
  const norm = pts.length * h ** n
  return xs.map((x) => {
    let s = 0
    for (const [xk, wk] of live) s += wk * kernelValue((x - xk) / h, kernel)
    return s / norm
  })
}

/** I valori p̂(x_0) dei 300 giorni. */
export function simulateDays(p: Params, seed: number, days = DAYS): number[] {
  return Array.from({ length: days }, (_, d) => estimateAt(p.x0, daySamples(p, seed, d), p.h, p.kernel, p.n))
}

/** Media e varianza (dividendo per il numero di giorni) dei primi `count` valori. */
export function empirical(values: readonly number[], count: number): { mean: number; variance: number } {
  const m = Math.max(0, Math.min(count, values.length))
  if (m === 0) return { mean: Number.NaN, variance: Number.NaN }
  let s = 0
  for (let i = 0; i < m; i++) s += values[i]
  const mean = s / m
  let v = 0
  for (let i = 0; i < m; i++) v += (values[i] - mean) ** 2
  return { mean, variance: v / m }
}

/** Bin dell'istogramma dei giorni: il dominio sta attorno a p̄̂ con 4 volte la radice del bound per lato. */
export const BRICK_BINS = 25

export function histDomain(st: PointStats): [number, number] {
  const r = 4 * Math.sqrt(st.bound)
  return [Math.max(0, st.mean - r), st.mean + r]
}

/** Posizione di ogni mattoncino: bin e piano della pila, nell'ordine dei giorni. */
export function bricks(values: readonly number[], count: number, domain: readonly [number, number], bins = BRICK_BINS): { bin: number; level: number }[] {
  const heights = new Array<number>(bins).fill(0)
  const w = (domain[1] - domain[0]) / bins
  const out: { bin: number; level: number }[] = []
  for (let i = 0; i < Math.min(count, values.length); i++) {
    const b = Math.min(bins - 1, Math.max(0, Math.floor((values[i] - domain[0]) / w)))
    out.push({ bin: b, level: heights[b]++ })
  }
  return out
}

/** Pila attesa più alta, per fissare la quota dell'istogramma: giorni × larghezza del bin × picco della normale. */
export function expectedPeakBricks(st: PointStats, domain: readonly [number, number], days = DAYS, bins = BRICK_BINS): number {
  const w = (domain[1] - domain[0]) / bins
  const sd = Math.sqrt(Math.max(st.variance, 1e-18))
  return (days * w) / (sd * Math.sqrt(2 * Math.PI))
}

// --- la sfida: h dimezzato, di quanto deve crescere N? ---

export const FACTORS = [1, 2, 4, 8, 16] as const

/**
 * Fattore per N che riporta il bound al valore di prima quando h passa da hOld a hNew, nello scenario di
 * riferimento (x_0 = 22 °C, kernel gaussiano): bound ∝ p̄̂/(N hⁿ), quindi N' / N = (hOld/hNew)ⁿ · p̄̂(hNew)/p̄̂(hOld).
 */
export function requiredFactor(n: Dim, hOld = 0.5, hNew = 0.25): number {
  const at = (h: number) => theoryAt({ ...INITIAL, n, h, N: 1 })
  const before = at(hOld)
  const after = at(hNew)
  return after.bound / before.bound
}

/** La scelta giusta fra i fattori offerti: la potenza di 2 più vicina in scala logaritmica. */
export function nearestFactor(f: number): (typeof FACTORS)[number] {
  let best: (typeof FACTORS)[number] = FACTORS[0]
  for (const c of FACTORS) if (Math.abs(Math.log2(c) - Math.log2(f)) < Math.abs(Math.log2(best) - Math.log2(f))) best = c
  return best
}

/** Bound relativo √bound / p̄̂ nello scenario isotropo, per n = 1, 2, 3 (la tabella della specifica: 13%, 22%, 40%). */
export const relativeBound = (n: Dim, N = 200, h = 0.5): number => {
  const st = pointStats(productMoments(Array.from({ length: n }, () => pointGaussMoments(CENTER, ISO, h))), { N, h, n, kernel: 'gaussiano' })
  return Math.sqrt(st.bound) / st.mean
}

/** Decimali con cui scrivere un numero piccolo con tre cifre significative (0.000705 → 6). */
export const decimalsFor = (v: number): number => (v > 0 && Number.isFinite(v) ? Math.min(9, Math.max(3, -Math.floor(Math.log10(v)) + 2)) : 3)
