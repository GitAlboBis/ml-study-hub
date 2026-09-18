// Teoria delle proprietà della stima di Parzen (Melgani, Cap. 2, slide p60-61; note p42-45), in numeri.
// Logica pura condivisa dai widget del foglio m09 su bias, varianza, consistenza e scelta di h: nessun React.
//
// Che cosa c'è:
// - misture di gaussiane 1-D e la media della stima con il kernel gaussiano in forma chiusa: la convoluzione
//   di N(μ, s²) con N(0, h²) è N(μ, s² + h²), quindi E{p̂(x)} = p(x) * (1/h)γ(x/h) è ancora una mistura;
// - momenti puntuali E{δ(x − X)} ed E{δ(x − X)²} per ogni kernel del corso (in forma chiusa per il gaussiano,
//   con una quadratura negli altri casi): da questi la varianza vera della stima, (E{δ²} − E{δ}²)/N, e il
//   bound della slide p60, sup(γ)·p̄̂(x)/(N hⁿ);
// - errori integrati (bias², varianza, MISE) in forma chiusa con kernel gaussiano e verità a mistura, anche in
//   n dimensioni quando le feature sono indipendenti e con la stessa mistura (tutti gli integrali si fattorizzano);
// - leggi h_N = h_1·N^(−a) e i limiti delle due condizioni di consistenza (slide p61);
// - campionamento a seed (mistura, bimodale triangolo + rettangolo delle slide p62-63, binomiale).
import type { Rng } from '../../../content/types'
import { kernelValue } from '../../../lib/ml/nonparam'
import type { Kernel } from '../../../lib/ml/nonparam'
import { sampleMixture } from '../../../lib/ml/stats'

/** Una componente gaussiana 1-D di una mistura: peso, media, deviazione standard. */
export interface Comp {
  w: number
  mu: number
  s: number
}

const SQRT_2PI = Math.sqrt(2 * Math.PI)
const SQRT_PI = Math.sqrt(Math.PI)

/** Densità di N(0, v) in d, con v varianza (non deviazione standard). */
const gaussVar = (d: number, v: number) => Math.exp((-d * d) / (2 * v)) / Math.sqrt(2 * Math.PI * v)

/** p(x) = Σ w N(x; μ, s²). I pesi si assumono già a somma 1. */
export function mixPdf(x: number, comps: readonly Comp[]): number {
  let p = 0
  for (const c of comps) p += (c.w * Math.exp(-0.5 * ((x - c.mu) / c.s) ** 2)) / (c.s * SQRT_2PI)
  return p
}

/** E{p̂} con kernel gaussiano di larghezza h: ogni componente passa da s² a s² + h². */
export const convolveGauss = (comps: readonly Comp[], h: number): Comp[] => comps.map((c) => ({ ...c, s: Math.sqrt(c.s * c.s + h * h) }))

/** A(extra) = Σ_ij w_i w_j N(μ_i − μ_j; 0, s_i² + s_j² + extra): con extra = 0 è ∫p², con 2h² è ∫(E p̂)². */
export function overlap(comps: readonly Comp[], extra: number): number {
  let a = 0
  for (const ci of comps) for (const cj of comps) a += ci.w * cj.w * gaussVar(ci.mu - cj.mu, ci.s * ci.s + cj.s * cj.s + extra)
  return a
}

export interface Errors {
  /** ∫ (E{p̂(x)} − p(x))² dx */
  bias2: number
  /** ∫ E{(p̂(x) − E{p̂(x)})²} dx */
  variance: number
  /** somma: errore quadratico medio integrato */
  mise: number
}

/**
 * Bias², varianza e MISE integrati, kernel gaussiano (in n dimensioni: quello a simmetria sferica, prodotto di
 * n gaussiane 1-D di larghezza h), verità = prodotto di n copie della mistura `comps` (feature indipendenti).
 * ∫(E p̂ − p)² = A(2h²)ⁿ − 2A(h²)ⁿ + A(0)ⁿ;  ∫Var = [(1/(2√π h))ⁿ − A(2h²)ⁿ] / N.
 */
export function integratedErrors(comps: readonly Comp[], h: number, N: number, n = 1): Errors {
  const a0 = overlap(comps, 0) ** n
  const a1 = overlap(comps, h * h) ** n
  const a2 = overlap(comps, 2 * h * h) ** n
  const bias2 = Math.max(0, a2 - 2 * a1 + a0)
  const variance = Math.max(0, (1 / (2 * SQRT_PI * h)) ** n - a2) / N
  return { bias2, variance, mise: bias2 + variance }
}

/** Momenti di una sola campana δ(x − X) = (1/h)γ((x − X)/h) con X ~ p: la media E{δ} e il secondo momento E{δ²}. */
export interface Moments {
  mean: number
  second: number
}

/** Forma chiusa per kernel gaussiano e verità a mistura: E{δ} = (p * N(0,h²))(x), E{δ²} = (p * N(0,h²/2))(x) / (2√π h). */
export function pointGaussMoments(x: number, comps: readonly Comp[], h: number): Moments {
  return { mean: mixPdf(x, convolveGauss(comps, h)), second: mixPdf(x, convolveGauss(comps, h / Math.SQRT2)) / (2 * SQRT_PI * h) }
}

/** Regola di Simpson su [a, b] con n intervalli (n reso pari). */
export function simpson(f: (x: number) => number, a: number, b: number, n: number): number {
  const m = Math.max(2, n + (n % 2))
  const dx = (b - a) / m
  let s = f(a) + f(b)
  for (let i = 1; i < m; i++) s += (i % 2 === 1 ? 4 : 2) * f(a + i * dx)
  return (s * dx) / 3
}

/**
 * Momenti puntuali per qualunque kernel del corso e qualunque verità p (anche discontinua), per quadratura.
 * Con t = x − h·u:  E{δ} = ∫ γ(u) p(x − h u) du,  E{δ²} = (1/h) ∫ γ(u)² p(x − h u) du.
 * Il Cauchy ha code lunghe: lì si integra in θ con u = tan θ, dove γ(u) du = dθ/π.
 */
export function pointMoments(x: number, pdf: (t: number) => number, h: number, kernel: Kernel): Moments {
  const at = (u: number) => pdf(x - h * u)
  if (kernel === 'cauchy') {
    const e = 1e-9
    const lo = -Math.PI / 2 + e
    const hi = Math.PI / 2 - e
    const mean = simpson((th) => at(Math.tan(th)), lo, hi, 4000) / Math.PI
    const second = simpson((th) => (Math.cos(th) ** 2 / Math.PI) * at(Math.tan(th)), lo, hi, 4000) / (Math.PI * h)
    return { mean, second }
  }
  const L = kernel === 'rettangolare' ? 0.5 : kernel === 'triangolare' || kernel === 'epanechnikov' ? 1 : kernel === 'gaussiano' ? 9 : kernel === 'esponenziale' ? 40 : 300
  const steps = kernel === 'sinc2' ? 12000 : kernel === 'esponenziale' ? 4000 : 1200
  // si spezza nello zero: triangolare ed esponenziale hanno lì uno spigolo
  const f1 = (u: number) => kernelValue(u, kernel) * at(u)
  const f2 = (u: number) => kernelValue(u, kernel) ** 2 * at(u)
  const mean = simpson(f1, -L, 0, steps) + simpson(f1, 0, L, steps)
  const second = (simpson(f2, -L, 0, steps) + simpson(f2, 0, L, steps)) / h
  return { mean, second }
}

/** In n dimensioni con kernel prodotto e feature indipendenti i momenti sono prodotti di quelli 1-D. */
export const productMoments = (list: readonly Moments[]): Moments => ({
  mean: list.reduce((a, m) => a * m.mean, 1),
  second: list.reduce((a, m) => a * m.second, 1),
})

/** sup γ(·) = γ(0) per ogni kernel del corso; in n dimensioni con kernel prodotto γ(0)ⁿ. */
export const supGamma = (kernel: Kernel, n = 1): number => kernelValue(0, kernel) ** n

export interface PointStats {
  /** p̄̂(x) = E{p̂(x)} */
  mean: number
  /** E{(p̂(x) − p̄̂(x))²}: la varianza vera della stima */
  variance: number
  /** sup(γ)·p̄̂(x)/(N hⁿ): il bound della slide p60 */
  bound: number
  sup: number
  /** N·hⁿ: il "numero efficace" di campioni che la finestra raccoglie (in unità di densità) */
  nhn: number
}

/** Varianza e bound nel punto, dai momenti di una campana. */
export function pointStats(m: Moments, { N, h, n, kernel }: { N: number; h: number; n: number; kernel: Kernel }): PointStats {
  const nhn = N * h ** n
  const sup = supGamma(kernel, n)
  return { mean: m.mean, variance: Math.max(0, (m.second - m.mean * m.mean) / N), bound: (sup * m.mean) / nhn, sup, nhn }
}

// --- leggi h_N e consistenza (slide p61) ---

export type Limit = 'zero' | 'const' | 'inf'

/** Dove va N^e per N → +∞. */
export const powerLimit = (e: number): Limit => (Math.abs(e) < 1e-12 ? 'const' : e < 0 ? 'zero' : 'inf')

/** h_N = h_1·N^(−a). */
export const lawH = (h1: number, a: number, N: number): number => h1 * N ** -a

/**
 * I due limiti della slide p61 per la legge h_N = h_1·N^(−a) in n dimensioni:
 * h_N → 0 se a > 0; N·h_Nⁿ = h_1ⁿ·N^(1 − n·a) → +∞ se a < 1/n. Consistente solo con entrambi.
 */
export function lawLimits(a: number, n: number): { h: Limit; nhn: Limit; consistent: boolean } {
  const h = powerLimit(-a)
  const nhn = powerLimit(1 - n * a)
  return { h, nhn, consistent: h === 'zero' && nhn === 'inf' }
}

// --- campionamento a seed ---

/** n campioni dalla mistura (attraverso stats.sampleMixture, stesso generatore del resto dell'app). */
export const sampleMix = (rng: Rng, n: number, comps: readonly Comp[]): number[] =>
  sampleMixture(rng, n, comps.map((c) => ({ weight: c.w, mu: c.mu, sigma: c.s })))

/** Altezza comune di triangolo e rettangolo nella bimodale delle slide p62-63: 2/3 (area 2/3 + 1/3). */
export const BIMODAL_HEIGHT = 2 / 3

/** Bimodale di Duda-Hart: triangolo su [0.5, 2.5] con vertice in 1.5, rettangolo su [3, 3.5]. */
export function bimodalPdf(x: number): number {
  if (x >= 0.5 && x <= 1.5) return BIMODAL_HEIGHT * (x - 0.5)
  if (x > 1.5 && x <= 2.5) return BIMODAL_HEIGHT * (2.5 - x)
  if (x >= 3 && x <= 3.5) return BIMODAL_HEIGHT
  return 0
}

/** Un campione della bimodale: con probabilità 2/3 dal triangolo (somma di due uniformi), altrimenti dal rettangolo. */
export const sampleBimodal = (rng: Rng): number => (rng.next() < 2 / 3 ? 0.5 + rng.next() + rng.next() : 3 + 0.5 * rng.next())

/**
 * K ~ Binomiale(N, p): quanti degli N campioni cadono in una regione di probabilità p. Esatta per N piccoli
 * (somma di Bernoulli) e per medie piccole (inversione della funzione di ripartizione); con N·p·q ≥ 30
 * approssimazione normale arrotondata, indistinguibile a quelle dimensioni.
 */
export function sampleBinomial(rng: Rng, N: number, p: number): number {
  if (!(p > 0) || N <= 0) return 0
  if (p >= 1) return N
  if (p > 0.5) return N - sampleBinomial(rng, N, 1 - p)
  if (N <= 60) {
    let k = 0
    for (let i = 0; i < N; i++) if (rng.next() < p) k++
    return k
  }
  const q = 1 - p
  const m = N * p
  if (m * q < 30) {
    const u = rng.next()
    let pk = Math.exp(N * Math.log(q))
    let cdf = pk
    let k = 0
    while (u > cdf && k < N) {
      pk *= ((N - k) / (k + 1)) * (p / q)
      k++
      cdf += pk
    }
    return k
  }
  const k = Math.round(m + Math.sqrt(m * q) * rng.normal())
  return Math.min(N, Math.max(0, k))
}

// --- stima veloce per N grandi ---

/** Conteggi dei campioni in `bins` intervalli uguali del dominio (quelli fuori non entrano, ma contano in N). */
export function binCounts(samples: readonly number[], domain: readonly [number, number], bins: number): Float64Array {
  const counts = new Float64Array(bins)
  const w = (domain[1] - domain[0]) / bins
  for (const x of samples) {
    const b = Math.floor((x - domain[0]) / w)
    if (b >= 0 && b < bins) counts[b]++
  }
  return counts
}

/**
 * Stima di Parzen gaussiana dai conteggi per bin (ogni campione spostato al centro del suo bin): con bin molto
 * più stretti di h è la stima esatta a meno di un errore invisibile, e costa bin × larghezza invece di N.
 */
export function kdeFromBins(counts: Float64Array, N: number, domain: readonly [number, number], xs: readonly number[], h: number): number[] {
  const bins = counts.length
  const w = (domain[1] - domain[0]) / bins
  const reach = Math.ceil((6 * h) / w) + 1
  return xs.map((x) => {
    const c = Math.floor((x - domain[0]) / w)
    let s = 0
    for (let b = Math.max(0, c - reach); b <= Math.min(bins - 1, c + reach); b++) {
      if (counts[b] === 0) continue
      const u = (x - (domain[0] + (b + 0.5) * w)) / h
      s += counts[b] * Math.exp(-0.5 * u * u)
    }
    return s / (N * h * SQRT_2PI)
  })
}

// --- scale di slider ---

const INT_MANTISSAS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8]

/** Interi "tondi" in scala logaritmica fra min e max, estremi compresi: 10, 12, 15, 20, 25, 30, 40, 50, … */
export function intLogSteps(min: number, max: number): number[] {
  const out = new Set<number>([min])
  for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
    for (const m of INT_MANTISSAS) {
      const v = Math.round(m * 10 ** e)
      if (v > min && v < max) out.add(v)
    }
  }
  out.add(max)
  return [...out].sort((a, b) => a - b)
}

/** Indice del valore più vicino in scala logaritmica. */
export function nearestLogIndex(values: readonly number[], v: number): number {
  let best = 0
  let bestD = Number.POSITIVE_INFINITY
  values.forEach((x, i) => {
    const d = Math.abs(Math.log(x) - Math.log(v))
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

/** Curve di moto dei token (--ease-out, --ease-in-out) in forma polinomiale, per i moti fatti a mano. */
const clamp01 = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t)
export const easeOut = (t: number): number => 1 - (1 - clamp01(t)) ** 3
export const easeInOut = (t: number): number => {
  const c = clamp01(t)
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2
}
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
