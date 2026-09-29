// EM per misture gaussiane in 1-D e 2-D (mixture-em; landscape per il minorante; scene3d per la salita su Q) e
// k-means come limite a σ comune che tende a zero (m10, p11-p13 domani).
//
// Notazione di m10: mistura p(x|θ) = Σ_j P_j p(x|θ_j); responsabilità r_ij = P(j | x_i, θ^(k)).
// - passo E: r_ij = P_j p(x_i|θ_j) / Σ_l P_l p(x_i|θ_l), calcolate in scala logaritmica (niente underflow)
// - passo M: P_j = N_j/N, μ_j = Σ_i r_ij x_i / N_j, Σ_j = Σ_i r_ij (x_i − μ_j)(x_i − μ_j)ᵗ / N_j, con N_j = Σ_i r_ij
// - Q(θ; θ^(k)) = Σ_i Σ_j r_ij [ln P_j + ln p(x_i|θ_j)], e ln L(θ) ≥ Q(θ; θ^(k)) + H_k (H_k = −Σ r ln r), con
//   uguaglianza in θ^(k): il minorante tangente che garantisce la salita
// - dati mancanti (2-D): una coordinata assente si media con la gaussiana condizionata della componente, e nel passo
//   M entra la sua varianza condizionata (l'esempio dei quattro punti della slide 77, θ⁰ → θ¹ = (0.75, 2, 0.938, 2))
// - collasso: una componente con σ = 0 su un campione ha densità infinita lì; ln L = +∞ ed EM si ferma
//   (m10-collasso-sigma-zero). `minSigma`/`minVariance` mettono un pavimento quando il collasso non va mostrato.
import type { Rng } from '../../../../content/types'
import { covarianceMatrix } from '../../../../lib/ml/stats'
import { logSumExp } from './special'
import type { Mat2, Vec, Vec2 } from './types'

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)
const LN_2PI = Math.log(2 * Math.PI)
const HALF_LN_2PI = 0.5 * LN_2PI

/** Componente gaussiana 1-D: peso P_j, media μ_j, deviazione standard σ_j (la stessa forma di MixtureComponent). */
export interface Comp1 {
  weight: number
  mu: number
  sigma: number
}

/** Componente gaussiana 2-D: peso P_j, media μ_j, covarianza Σ_j. */
export interface Comp2 {
  weight: number
  mu: Vec2
  S: Mat2
}

/** Punto 2-D con una coordinata eventualmente mancante (null). Un Vec2 va bene così com'è. */
export type Point2Missing = readonly [number | null, number | null]

export interface EmHistory<C> {
  comps: C[]
  logLik: number
}

export interface EmRun<C> {
  /** θ⁰ con la sua ln L, poi un elemento per iterazione */
  history: EmHistory<C>[]
  iterations: number
  /** |Δ ln L| < ε */
  converged: boolean
  /** una componente è collassata (ln L = +∞) */
  collapsed: boolean
}

// --- 1-D ---

/** ln N(x; μ, σ²); con σ = 0 vale +∞ in x = μ e −∞ altrove (il limite del collasso). */
export function logNormal1(x: number, mu: number, sigma: number): number {
  if (!(sigma >= 0)) throw err('logNormal1', `σ deve essere ≥ 0 (ricevuto ${sigma})`)
  if (sigma === 0) return x === mu ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
  const z = (x - mu) / sigma
  return -0.5 * z * z - Math.log(sigma) - HALF_LN_2PI
}

const logWeight = (w: number) => (w > 0 ? Math.log(w) : Number.NEGATIVE_INFINITY)

/** Normalizza una riga di log-pesi in probabilità; +∞ si prende tutto (a pari merito si divide), tutti −∞: uniforme. */
function normalizeRow(l: readonly number[], hard: boolean): { r: number[]; lse: number } {
  const lse = logSumExp(l)
  const M = l.length
  let r: number[]
  if (lse === Number.POSITIVE_INFINITY) {
    const inf = l.filter((v) => v === Number.POSITIVE_INFINITY).length
    r = l.map((v) => (v === Number.POSITIVE_INFINITY ? 1 / inf : 0))
  } else if (lse === Number.NEGATIVE_INFINITY) r = new Array<number>(M).fill(1 / M)
  else r = l.map((v) => Math.exp(v - lse))
  if (hard) {
    let best = 0
    for (let j = 1; j < M; j++) if (r[j] > r[best]) best = j
    r = r.map((_, j) => (j === best ? 1 : 0))
  }
  return { r, lse }
}

/** p(x) = Σ_j P_j N(x; μ_j, σ_j²) con i pesi normalizzati; mai Infinity (con σ = 0 si ferma al double più grande). */
export function mixtureDensity1d(x: number, comps: readonly Comp1[]): number {
  const tot = comps.reduce((s, c) => s + c.weight, 0)
  if (!(tot > 0)) throw err('mixtureDensity1d', 'i pesi devono avere somma > 0')
  const v = comps.reduce((s, c) => s + (c.weight / tot) * Math.exp(logNormal1(x, c.mu, c.sigma)), 0)
  return v > Number.MAX_VALUE ? Number.MAX_VALUE : v
}

/** ln L(θ) = Σ_i ln Σ_j P_j N(x_i; μ_j, σ_j²). */
export function logLikelihood1d(xs: readonly number[], comps: readonly Comp1[]): number {
  let s = 0
  for (const x of xs) s += logSumExp(comps.map((c) => logWeight(c.weight) + logNormal1(x, c.mu, c.sigma)))
  return s
}

/** Passo E: responsabilità resp[i][j] e ln L dei parametri correnti. `hard`: una sola componente per campione. */
export function responsibilities1d(xs: readonly number[], comps: readonly Comp1[], options: { hard?: boolean } = {}): { resp: number[][]; logLik: number } {
  if (comps.length === 0) throw err('responsibilities1d', 'nessuna componente')
  let logLik = 0
  const resp = xs.map((x) => {
    const { r, lse } = normalizeRow(
      comps.map((c) => logWeight(c.weight) + logNormal1(x, c.mu, c.sigma)),
      options.hard ?? false,
    )
    logLik += lse
    return r
  })
  return { resp, logLik }
}

export interface MStep1dOptions {
  /** parametri precedenti: per le componenti vuote e per `fixedSigma` */
  prev?: readonly Comp1[]
  /** una σ comune a tutte le componenti (il limite k-means la manda a zero) */
  sharedSigma?: boolean
  /** pesi che non si aggiornano */
  fixedWeights?: readonly number[]
  /** σ che non si aggiornano (servono i `prev`) */
  fixedSigma?: boolean
  /** pavimento sulle σ: impedisce il collasso */
  minSigma?: number
}

/** Passo M in 1-D: pesi N_j/N, medie pesate, deviazioni pesate, con i vincoli richiesti. */
export function mStep1d(xs: readonly number[], resp: readonly (readonly number[])[], options: MStep1dOptions = {}): Comp1[] {
  const N = xs.length
  const M = resp[0]?.length ?? options.prev?.length ?? 0
  const Nj = new Array<number>(M).fill(0)
  const Sx = new Array<number>(M).fill(0)
  resp.forEach((r, i) => r.forEach((v, j) => {
    Nj[j] += v
    Sx[j] += v * xs[i]
  }))
  const mu = Nj.map((n, j) => (n > 0 ? Sx[j] / n : (options.prev?.[j].mu ?? 0)))
  const Sv = new Array<number>(M).fill(0)
  resp.forEach((r, i) => r.forEach((v, j) => {
    if (v > 0) Sv[j] += v * (xs[i] - mu[j]) ** 2
  }))
  const sharedVar = Sv.reduce((s, v) => s + v, 0) / N
  return mu.map((m, j) => {
    let sigma = options.sharedSigma ? Math.sqrt(sharedVar) : Nj[j] > 0 ? Math.sqrt(Sv[j] / Nj[j]) : (options.prev?.[j].sigma ?? 1)
    if (options.fixedSigma) {
      if (!options.prev) throw err('mStep1d', 'fixedSigma richiede i parametri precedenti (prev)')
      sigma = options.prev[j].sigma
    }
    if (options.minSigma !== undefined) sigma = Math.max(sigma, options.minSigma)
    const weight = options.fixedWeights ? options.fixedWeights[j] : N > 0 ? Nj[j] / N : 0
    return { weight, mu: m, sigma }
  })
}

/** Un'iterazione E + M: nuovi parametri, responsabilità usate, ln L prima e dopo. */
export function emStep1d(xs: readonly number[], comps: readonly Comp1[], options: MStep1dOptions & { hard?: boolean } = {}): { comps: Comp1[]; resp: number[][]; logLikBefore: number; logLik: number } {
  const e = responsibilities1d(xs, comps, { hard: options.hard })
  const next = mStep1d(xs, e.resp, { ...options, prev: comps })
  return { comps: next, resp: e.resp, logLikBefore: e.logLik, logLik: logLikelihood1d(xs, next) }
}

/** EM fino a |Δ ln L| < ε (predefinito 1e−6), a maxIter (predefinito 500) o al collasso. */
export function runEm1d(xs: readonly number[], init: readonly Comp1[], options: MStep1dOptions & { hard?: boolean; maxIter?: number; epsilon?: number } = {}): EmRun<Comp1> {
  const maxIter = options.maxIter ?? 500
  const eps = options.epsilon ?? 1e-6
  let comps = init.map((c) => ({ ...c }))
  const history: EmHistory<Comp1>[] = [{ comps, logLik: logLikelihood1d(xs, comps) }]
  let converged = false
  let collapsed = history[0].logLik === Number.POSITIVE_INFINITY
  let it = 0
  while (!collapsed && !converged && it < maxIter) {
    const step = emStep1d(xs, comps, options)
    it++
    comps = step.comps
    history.push({ comps, logLik: step.logLik })
    if (step.logLik === Number.POSITIVE_INFINITY || comps.some((c) => c.sigma === 0)) collapsed = true
    else if (Math.abs(step.logLik - history[history.length - 2].logLik) < eps) converged = true
  }
  return { history, iterations: it, converged, collapsed }
}

/** Q(θ; θ^(k)) = Σ_i Σ_j r_ij [ln P_j + ln N(x_i; μ_j, σ_j²)] con le responsabilità di θ^(k). */
export function qFunction1d(xs: readonly number[], resp: readonly (readonly number[])[], comps: readonly Comp1[]): number {
  let q = 0
  resp.forEach((r, i) => r.forEach((v, j) => {
    if (v > 0) q += v * (logWeight(comps[j].weight) + logNormal1(xs[i], comps[j].mu, comps[j].sigma))
  }))
  return q
}

/** Entropia delle responsabilità H = −Σ_i Σ_j r_ij ln r_ij. */
export function entropy(resp: readonly (readonly number[])[]): number {
  let h = 0
  for (const r of resp) for (const v of r) if (v > 0) h -= v * Math.log(v)
  return h
}

/** Minorante tangente in θ^(k) = `at`: Q(θ; θ^(k)) + H_k ≤ ln L(θ), uguale in θ = θ^(k). */
export function minorant1d(xs: readonly number[], comps: readonly Comp1[], at: readonly Comp1[]): number {
  const { resp } = responsibilities1d(xs, at)
  return qFunction1d(xs, resp, comps) + entropy(resp)
}

/** θ⁰ a seme: M medie distinte prese fra i campioni (in ordine crescente), σ di tutto il campione, pesi 1/M. */
export function initComponents1d(rng: Rng, xs: readonly number[], M: number): Comp1[] {
  if (!Number.isInteger(M) || M < 1 || M > xs.length) throw err('initComponents1d', `M deve stare fra 1 e N (ricevuto ${M})`)
  const mus = rng.shuffle(xs.map((_, i) => i)).slice(0, M).map((i) => xs[i]).sort((a, b) => a - b)
  const m = xs.reduce((s, x) => s + x, 0) / xs.length
  const sd = Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length) || 1
  return mus.map((mu) => ({ weight: 1 / M, mu, sigma: sd }))
}

// --- 2-D con dati mancanti ---

/** Media e varianza della coordinata non osservata data l'altra: μ_c + Σ_co/Σ_oo (x_o − μ_o), Σ_cc − Σ_co²/Σ_oo. */
export function conditional2(mu: Vec2, S: Mat2, knownAxis: 0 | 1, value: number): { mean: number; variance: number } {
  const o = knownAxis
  const c = o === 0 ? 1 : 0
  if (!(S[o][o] > 0)) throw err('conditional2', 'la varianza della coordinata osservata deve essere > 0')
  return { mean: mu[c] + (S[c][o] / S[o][o]) * (value - mu[o]), variance: S[c][c] - (S[c][o] * S[o][c]) / S[o][o] }
}

/** ln N₂(x; μ, Σ); Σ degenere (det ≤ 0): +∞ sulla media, −∞ altrove. */
function logNormal2(x0: number, x1: number, mu: Vec2, S: Mat2): number {
  const a = S[0][0]
  const b = S[0][1]
  const d = S[1][1]
  const det = a * d - b * b
  if (!(det > 0) || !(a > 0)) return x0 === mu[0] && x1 === mu[1] ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
  const dx = x0 - mu[0]
  const dy = x1 - mu[1]
  return -0.5 * ((d * dx * dx - 2 * b * dx * dy + a * dy * dy) / det) - LN_2PI - 0.5 * Math.log(det)
}

/** ln della densità delle coordinate osservate di un punto (marginale se una manca). */
function logObserved(p: Point2Missing, c: Comp2): number {
  const [x0, x1] = p
  if (x0 !== null && x1 !== null) return logNormal2(x0, x1, c.mu, c.S)
  if (x0 !== null) return c.S[0][0] > 0 ? logNormal1(x0, c.mu[0], Math.sqrt(c.S[0][0])) : logNormal1(x0, c.mu[0], 0)
  if (x1 !== null) return c.S[1][1] > 0 ? logNormal1(x1, c.mu[1], Math.sqrt(c.S[1][1])) : logNormal1(x1, c.mu[1], 0)
  return 0
}

/** Il punto completato con la componente: coordinate attese x̂ e covarianza condizionata C (0 per le osservate). */
export interface Filled2 {
  x: Vec2
  C: Mat2
}

function fill(p: Point2Missing, c: Comp2): Filled2 {
  const [x0, x1] = p
  if (x0 !== null && x1 !== null) return { x: [x0, x1], C: [[0, 0], [0, 0]] }
  if (x0 !== null) {
    const k = c.S[0][0] > 0 ? conditional2(c.mu, c.S, 0, x0) : { mean: c.mu[1], variance: c.S[1][1] }
    return { x: [x0, k.mean], C: [[0, 0], [0, k.variance]] }
  }
  if (x1 !== null) {
    const k = c.S[1][1] > 0 ? conditional2(c.mu, c.S, 1, x1) : { mean: c.mu[0], variance: c.S[0][0] }
    return { x: [k.mean, x1], C: [[k.variance, 0], [0, 0]] }
  }
  return { x: c.mu, C: c.S }
}

/** I punti con almeno una coordinata osservata (quelli del tutto vuoti non portano informazione). */
const usable = (points: readonly Point2Missing[]) => points.filter((p) => p[0] !== null || p[1] !== null)

export interface EStep2d {
  /** resp[i][j] sui punti utilizzabili, nell'ordine */
  resp: number[][]
  logLik: number
  /** filled[i][j]: il punto i completato con la componente j (x̂ e covarianza condizionata) */
  filled: Filled2[][]
}

/** ln L(θ) sulle coordinate osservate. */
export function logLikelihood2d(points: readonly Point2Missing[], comps: readonly Comp2[]): number {
  let s = 0
  for (const p of usable(points)) s += logSumExp(comps.map((c) => logWeight(c.weight) + logObserved(p, c)))
  return s
}

/** Passo E in 2-D: responsabilità dalle coordinate osservate e, per ogni componente, il punto completato. */
export function responsibilities2d(points: readonly Point2Missing[], comps: readonly Comp2[], options: { hard?: boolean } = {}): EStep2d {
  if (comps.length === 0) throw err('responsibilities2d', 'nessuna componente')
  const pts = usable(points)
  let logLik = 0
  const resp: number[][] = []
  const filled: Filled2[][] = []
  for (const p of pts) {
    const { r, lse } = normalizeRow(
      comps.map((c) => logWeight(c.weight) + logObserved(p, c)),
      options.hard ?? false,
    )
    logLik += lse
    resp.push(r)
    filled.push(comps.map((c) => fill(p, c)))
  }
  return { resp, logLik, filled }
}

export interface MStep2dOptions {
  /** 'full' (predefinito), 'diagonal', 'spherical' (σ²I), 'shared' (una Σ piena comune) */
  covariance?: 'full' | 'diagonal' | 'spherical' | 'shared'
  fixedWeights?: readonly number[]
  /** covarianze che non si aggiornano (servono i `prev`) */
  fixedCovariance?: boolean
  /** pavimento sulle varianze; se Σ resta singolare si aggiunge minVariance·I. Predefinito 0 (il collasso si vede) */
  minVariance?: number
  prev?: readonly Comp2[]
}

/** Passo M in 2-D con i punti completati: Σ_j = Σ_i r_ij [(x̂ − μ_j)(x̂ − μ_j)ᵗ + C_ij] / N_j. */
export function mStep2d(e: EStep2d, options: MStep2dOptions = {}): Comp2[] {
  const N = e.resp.length
  const M = e.resp[0]?.length ?? options.prev?.length ?? 0
  const kind = options.covariance ?? 'full'
  const Nj = new Array<number>(M).fill(0)
  const mu = Array.from({ length: M }, () => [0, 0])
  e.resp.forEach((r, i) => r.forEach((v, j) => {
    if (v === 0) return
    Nj[j] += v
    mu[j][0] += v * e.filled[i][j].x[0]
    mu[j][1] += v * e.filled[i][j].x[1]
  }))
  for (let j = 0; j < M; j++) {
    if (Nj[j] > 0) {
      mu[j][0] /= Nj[j]
      mu[j][1] /= Nj[j]
    } else if (options.prev) {
      mu[j] = [...options.prev[j].mu]
    }
  }
  const S = Array.from({ length: M }, () => [0, 0, 0]) // s00, s01, s11
  e.resp.forEach((r, i) => r.forEach((v, j) => {
    if (v === 0) return
    const f = e.filled[i][j]
    const d0 = f.x[0] - mu[j][0]
    const d1 = f.x[1] - mu[j][1]
    S[j][0] += v * (d0 * d0 + f.C[0][0])
    S[j][1] += v * (d0 * d1 + f.C[0][1])
    S[j][2] += v * (d1 * d1 + f.C[1][1])
  }))
  let cov: Mat2[] = S.map((s, j) => {
    if (Nj[j] > 0) return [[s[0] / Nj[j], s[1] / Nj[j]], [s[1] / Nj[j], s[2] / Nj[j]]]
    return options.prev ? options.prev[j].S : [[1, 0], [0, 1]]
  })
  if (kind === 'shared') {
    const tot = Nj.reduce((a, b) => a + b, 0)
    const p = [0, 0, 0]
    S.forEach((s) => s.forEach((v, k) => (p[k] += v / tot)))
    const pooled: Mat2 = [[p[0], p[1]], [p[1], p[2]]]
    cov = cov.map(() => pooled)
  } else if (kind === 'diagonal') cov = cov.map((c) => [[c[0][0], 0], [0, c[1][1]]])
  else if (kind === 'spherical') cov = cov.map((c) => {
    const v = (c[0][0] + c[1][1]) / 2
    return [[v, 0], [0, v]]
  })
  if (options.fixedCovariance) {
    if (!options.prev) throw err('mStep2d', 'fixedCovariance richiede i parametri precedenti (prev)')
    cov = options.prev.map((c) => c.S)
  }
  const mv = options.minVariance ?? 0
  if (mv > 0) {
    cov = cov.map((c) => {
      let a = Math.max(c[0][0], mv)
      let d = Math.max(c[1][1], mv)
      const b = c[0][1]
      if (a * d - b * b <= mv * mv) {
        a += mv
        d += mv
      }
      return [[a, b], [b, d]]
    })
  }
  return cov.map((S2, j) => ({ weight: options.fixedWeights ? options.fixedWeights[j] : N > 0 ? Nj[j] / N : 0, mu: [mu[j][0], mu[j][1]] as const, S: S2 }))
}

/** Un'iterazione E + M in 2-D. */
export function emStep2d(points: readonly Point2Missing[], comps: readonly Comp2[], options: MStep2dOptions & { hard?: boolean } = {}): { comps: Comp2[]; estep: EStep2d; logLikBefore: number; logLik: number } {
  const estep = responsibilities2d(points, comps, { hard: options.hard })
  const next = mStep2d(estep, { ...options, prev: comps })
  return { comps: next, estep, logLikBefore: estep.logLik, logLik: logLikelihood2d(points, next) }
}

const degenerate = (c: Comp2) => !(c.S[0][0] * c.S[1][1] - c.S[0][1] * c.S[1][0] > 0)

/** EM in 2-D fino a |Δ ln L| < ε (predefinito 1e−6), a maxIter (predefinito 500) o al collasso. */
export function runEm2d(points: readonly Point2Missing[], init: readonly Comp2[], options: MStep2dOptions & { hard?: boolean; maxIter?: number; epsilon?: number } = {}): EmRun<Comp2> {
  const maxIter = options.maxIter ?? 500
  const eps = options.epsilon ?? 1e-6
  let comps = init.map((c) => ({ ...c }))
  const history: EmHistory<Comp2>[] = [{ comps, logLik: logLikelihood2d(points, comps) }]
  let converged = false
  let collapsed = history[0].logLik === Number.POSITIVE_INFINITY
  let it = 0
  while (!collapsed && !converged && it < maxIter) {
    const step = emStep2d(points, comps, options)
    it++
    comps = step.comps
    history.push({ comps, logLik: step.logLik })
    if (step.logLik === Number.POSITIVE_INFINITY || comps.some(degenerate)) collapsed = true
    else if (Math.abs(step.logLik - history[history.length - 2].logLik) < eps) converged = true
  }
  return { history, iterations: it, converged, collapsed }
}

/**
 * Q(θ; θ^(k)) in 2-D con i punti completati di θ^(k): Σ_i Σ_j r_ij E{ln P_j p(x_i|θ_j)}, dove per una coordinata
 * mancante E{(x − μ)ᵗΣ⁻¹(x − μ)} = (x̂ − μ)ᵗΣ⁻¹(x̂ − μ) + tr(Σ⁻¹C). Con un punto (∗, 4) e θ⁰ = (0, 0, 1, 1) è la
 * formula della slide: Σ ln p(x_k|θ) − (1 + μ₁²)/(2σ₁²) − (4 − μ₂)²/(2σ₂²) − ln(2πσ₁σ₂).
 */
export function qFunction2d(points: readonly Point2Missing[], e: EStep2d, comps: readonly Comp2[]): number {
  if (e.resp.length !== usable(points).length) throw err('qFunction2d', 'il passo E non corrisponde ai punti')
  let q = 0
  e.resp.forEach((r, i) => r.forEach((v, j) => {
    if (v === 0) return
    const c = comps[j]
    const a = c.S[0][0]
    const b = c.S[0][1]
    const d = c.S[1][1]
    const det = a * d - b * b
    if (!(det > 0)) throw err('qFunction2d', 'una covarianza è singolare')
    const i00 = d / det
    const i01 = -b / det
    const i11 = a / det
    const f = e.filled[i][j]
    const d0 = f.x[0] - c.mu[0]
    const d1 = f.x[1] - c.mu[1]
    const quad = i00 * d0 * d0 + 2 * i01 * d0 * d1 + i11 * d1 * d1 + i00 * f.C[0][0] + 2 * i01 * f.C[0][1] + i11 * f.C[1][1]
    q += v * (logWeight(c.weight) - LN_2PI - 0.5 * Math.log(det) - 0.5 * quad)
  }))
  return q
}

/** θ⁰ a seme in 2-D: M medie prese fra i punti, la covarianza di tutti i punti (1/N), pesi 1/M. */
export function initComponents2d(rng: Rng, points: readonly Vec2[], M: number): Comp2[] {
  if (!Number.isInteger(M) || M < 1 || M > points.length) throw err('initComponents2d', `M deve stare fra 1 e N (ricevuto ${M})`)
  const idx = rng.shuffle(points.map((_, i) => i)).slice(0, M)
  const C = covarianceMatrix(points)
  let S: Mat2 = [[C[0][0], C[0][1]], [C[1][0], C[1][1]]]
  const det = S[0][0] * S[1][1] - S[0][1] * S[1][0]
  if (!(det > 0)) {
    const r = Math.max(1e-6, (S[0][0] + S[1][1]) * 1e-3)
    S = [[S[0][0] + r, S[0][1]], [S[1][0], S[1][1] + r]]
  }
  return idx.map((i) => ({ weight: 1 / M, mu: points[i], S }))
}

// --- k-means (n-D) ---

const dist2 = (a: Vec, b: Vec) => {
  let s = 0
  for (let j = 0; j < a.length; j++) s += (a[j] - b[j]) ** 2
  return s
}

/** Indice del centro più vicino a ogni punto (a pari distanza il primo). */
export function kmeansAssign(points: readonly Vec[], centers: readonly Vec[]): number[] {
  if (centers.length === 0) throw err('kmeansAssign', 'nessun centro')
  return points.map((p) => {
    let best = 0
    let bd = dist2(p, centers[0])
    for (let k = 1; k < centers.length; k++) {
      const d = dist2(p, centers[k])
      if (d < bd) {
        bd = d
        best = k
      }
    }
    return best
  })
}

/** Nuovi centri: media dei punti assegnati; un gruppo vuoto tiene il centro di prima. */
export function kmeansUpdate(points: readonly Vec[], assign: readonly number[], centers: readonly Vec[]): number[][] {
  const n = centers[0]?.length ?? 0
  const sums = centers.map(() => new Array<number>(n).fill(0))
  const counts = new Array<number>(centers.length).fill(0)
  points.forEach((p, i) => {
    counts[assign[i]]++
    for (let j = 0; j < n; j++) sums[assign[i]][j] += p[j]
  })
  return sums.map((s, k) => (counts[k] > 0 ? s.map((v) => v / counts[k]) : [...centers[k]]))
}

/** Inerzia Σ_i ‖x_i − c_{a(i)}‖². */
export const kmeansInertia = (points: readonly Vec[], assign: readonly number[], centers: readonly Vec[]): number =>
  points.reduce((s, p, i) => s + dist2(p, centers[assign[i]]), 0)

/** Un passo di k-means: assegnazione, poi medie; l'inerzia è quella dei nuovi centri con questa assegnazione. */
export function kmeansStep(points: readonly Vec[], centers: readonly Vec[]): { assign: number[]; centers: number[][]; inertia: number } {
  const assign = kmeansAssign(points, centers)
  const next = kmeansUpdate(points, assign, centers)
  return { assign, centers: next, inertia: kmeansInertia(points, assign, next) }
}

/** k-means fino a un'assegnazione che non cambia più (o maxIter). history[0] sono i centri iniziali. */
export function runKmeans(points: readonly Vec[], init: readonly Vec[], maxIter = 100): { history: { centers: number[][]; assign: number[]; inertia: number }[]; iterations: number; converged: boolean } {
  let centers = init.map((c) => [...c])
  const a0 = kmeansAssign(points, centers)
  const history = [{ centers, assign: a0, inertia: kmeansInertia(points, a0, centers) }]
  let converged = false
  let it = 0
  while (!converged && it < maxIter) {
    const s = kmeansStep(points, centers)
    it++
    const prev = history[history.length - 1].assign
    history.push(s)
    centers = s.centers
    if (it > 1 && s.assign.every((a, i) => a === prev[i])) converged = true
  }
  return { history, iterations: it, converged }
}

/** Centri iniziali k-means++ a seme: il primo a caso, gli altri con probabilità proporzionale a D(x)². */
export function kmeansPlusPlus(rng: Rng, points: readonly Vec[], k: number): number[][] {
  if (!Number.isInteger(k) || k < 1 || k > points.length) throw err('kmeansPlusPlus', `k deve stare fra 1 e N (ricevuto ${k})`)
  const centers: number[][] = [[...points[rng.int(0, points.length - 1)]]]
  while (centers.length < k) {
    const d = points.map((p) => Math.min(...centers.map((c) => dist2(p, c))))
    const tot = d.reduce((s, v) => s + v, 0)
    let pick = rng.int(0, points.length - 1)
    if (tot > 0) {
      let u = rng.next() * tot
      for (let i = 0; i < d.length; i++) {
        u -= d[i]
        if (u <= 0) {
          pick = i
          break
        }
      }
    }
    centers.push([...points[pick]])
  }
  return centers
}
