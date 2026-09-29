// Statistiche del secondo ordine su nuvole di punti n-dimensionali: vettore medio, matrice di scatter, covarianza
// stimata con 1/N o 1/(N − 1), matrici di scatter di più classi (S_i, S_W, S_B, S_T), direzione e criterio di
// Fisher, LDA a C classi, PCA con proiezione, ricostruzione ed errore J_m. Servono a covariance, projection2d,
// spectrum-nd, classifier2d e scene3d (il cubo del corso).
//
// Notazione del corso (m14-m15): S_i = Σ_{x∈X_i} (x − m_i)(x − m_i)ᵗ, S_W = Σ_i S_i,
// S_B = (m₁ − m₂)(m₁ − m₂)ᵗ con due classi oppure Σ_i #(X_i) (m_i − m)(m_i − m)ᵗ con C classi, S_T = S_W + S_B.
import { covarianceMatrix } from '../../../../lib/ml/stats'
import { dot, eigSym, generalizedEigSym, matAdd, matVec, outer, quadForm, solve, zeros } from './linalg'
import type { EigenResult } from './linalg'
import type { Mat, Vec } from './types'

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)

const dimOf = (fn: string, points: readonly Vec[]): number => {
  const n = points[0].length
  if (points.some((p) => p.length !== n)) throw err(fn, 'i punti non hanno tutti la stessa dimensione')
  return n
}

/** Vettore medio m = (1/N) Σ x_k. Nessun punto: []. */
export function meanVector(points: readonly Vec[]): number[] {
  if (points.length === 0) return []
  const n = dimOf('meanVector', points)
  const m = new Array<number>(n).fill(0)
  for (const p of points) for (let j = 0; j < n; j++) m[j] += p[j]
  return m.map((v) => v / points.length)
}

/** Matrice di scatter S = Σ (x_k − m)(x_k − m)ᵗ, attorno a `m` (predefinito il vettore medio). Nessun punto: []. */
export function scatterMatrix(points: readonly Vec[], m: Vec = meanVector(points)): number[][] {
  if (points.length === 0) return []
  const n = dimOf('scatterMatrix', points)
  const S = zeros(n, n)
  for (const p of points) {
    for (let i = 0; i < n; i++) {
      const di = p[i] - m[i]
      for (let j = i; j < n; j++) S[i][j] += di * (p[j] - m[j])
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) S[i][j] = S[j][i]
  return S
}

export type Normalization = '1/N' | '1/(N-1)'

/**
 * Media e covarianza stimate: Σ̂ = S/N (massima verosimiglianza, distorta) o S/(N − 1). Con 1/N è il Σ_{X'} del
 * cubo di m14. Stessa aritmetica di `covarianceMatrix` di src/lib/ml/stats.
 */
export function covarianceEstimate(points: readonly Vec[], normalization: Normalization = '1/N'): { m: number[]; S: number[][] } {
  return { m: meanVector(points), S: covarianceMatrix(points, normalization === '1/(N-1)') }
}

export interface ClassScatter {
  /** m_i di ogni classe */
  means: number[][]
  /** #(X_i) */
  counts: number[]
  /** media globale m */
  m: number[]
  /** S_i di ogni classe */
  Si: number[][][]
  SW: number[][]
  SB: number[][]
  ST: number[][]
}

/**
 * Matrici di scatter di C classi.
 * - `between: 'weighted'` (predefinito) S_B = Σ_i #(X_i)(m_i − m)(m_i − m)ᵗ, così S_T = S_W + S_B;
 *   `'pair'` (solo due classi) S_B = (m₁ − m₂)(m₁ − m₂)ᵗ come nel criterio di Fisher a due classi
 * - `normalize: 'mean'` divide S_i, S_W, S_B e S_T per N (covarianze invece di somme); predefinito 'sum'
 * Una classe vuota è un errore di chi chiama.
 */
export function scatterMatrices(
  classes: readonly (readonly Vec[])[],
  options: { between?: 'weighted' | 'pair'; normalize?: 'sum' | 'mean' } = {},
): ClassScatter {
  if (classes.length === 0 || classes.some((c) => c.length === 0)) throw err('scatterMatrices', 'ogni classe deve avere almeno un punto')
  const all = classes.flat()
  const n = dimOf('scatterMatrices', all)
  const N = all.length
  const means = classes.map((c) => meanVector(c))
  const counts = classes.map((c) => c.length)
  const m = meanVector(all)
  let Si = classes.map((c, i) => scatterMatrix(c, means[i]))
  let SW = Si.reduce((acc, S) => matAdd(acc, S), zeros(n, n))
  let SB: number[][]
  if (options.between === 'pair') {
    if (classes.length !== 2) throw err('scatterMatrices', "between: 'pair' vale solo con due classi")
    SB = outer(
      means[0].map((v, j) => v - means[1][j]),
      means[0].map((v, j) => v - means[1][j]),
    )
  } else {
    SB = means.reduce((acc, mi, i) => {
      const d = mi.map((v, j) => v - m[j])
      return matAdd(acc, outer(d, d).map((r) => r.map((v) => v * counts[i])))
    }, zeros(n, n))
  }
  let ST = scatterMatrix(all, m)
  if (options.normalize === 'mean') {
    const k = (A: number[][]) => A.map((r) => r.map((v) => v / N))
    Si = Si.map(k)
    SW = k(SW)
    SB = k(SB)
    ST = k(ST)
  }
  return { means, counts, m, Si, SW, SB, ST }
}

/** Direzione di Fisher w = S_W⁻¹(m₁ − m₂); null se S_W è singolare (il cubo del corso, pochi campioni per classe). */
export function fisherDirection(m1: Vec, m2: Vec, SW: Mat): number[] | null {
  return solve(SW, m1.map((v, j) => v - m2[j]))
}

/** Criterio di Fisher J(w) = wᵗS_Bw / wᵗS_Ww (quoziente di Rayleigh generalizzato): invariante per w → αw. */
export function fisherCriterion(w: Vec, SB: Mat, SW: Mat): number {
  return quadForm(SB, w) / quadForm(SW, w)
}

/**
 * Statistiche delle proiezioni y = wᵗx di ogni classe: medie m̃_i, scatter s̃_i² = Σ (y − m̃_i)², e con due classi
 * J = (m̃₁ − m̃₂)² / (s̃₁² + s̃₂²) (NaN con più di due classi).
 */
export function projectedStats(classes: readonly (readonly Vec[])[], w: Vec): { projections: number[][]; means: number[]; scatters: number[]; J: number } {
  const projections = classes.map((c) => c.map((x) => dot(w, x)))
  const means = projections.map((ys) => ys.reduce((s, y) => s + y, 0) / ys.length)
  const scatters = projections.map((ys, i) => ys.reduce((s, y) => s + (y - means[i]) ** 2, 0))
  const J = classes.length === 2 ? (means[0] - means[1]) ** 2 / (scatters[0] + scatters[1]) : Number.NaN
  return { projections, means, scatters, J }
}

/**
 * LDA a C classi: autovettori di S_W⁻¹S_B (problema generalizzato S_B w = λ S_W w) in ordine decrescente di λ;
 * al più C − 1 autovalori sono non nulli. I w hanno norma 1 e values[k] = J(w_k). null se S_W è singolare.
 */
export function ldaDirections(classes: readonly (readonly Vec[])[]): EigenResult | null {
  const sc = scatterMatrices(classes)
  return generalizedEigSym(sc.SB, sc.SW)
}

export interface PcaResult {
  m: number[]
  S: number[][]
  /** autovalori λ₁ ≥ λ₂ ≥ … della covarianza */
  values: number[]
  /** φ_k: autovettori di norma 1 (la componente più grande in modulo è positiva) */
  vectors: number[][]
  /** λ_k / Σλ */
  explained: number[]
  /** Σ_{j≤k} λ_j / Σλ */
  cumulative: number[]
}

/** PCA: covarianza (1/N predefinito) e sua decomposizione con Jacobi. */
export function pca(points: readonly Vec[], normalization: Normalization = '1/N'): PcaResult {
  const { m, S } = covarianceEstimate(points, normalization)
  const { values, vectors } = eigSym(S)
  const total = values.reduce((s, v) => s + v, 0)
  const explained = values.map((v) => (total > 0 ? v / total : 0))
  let acc = 0
  const cumulative = explained.map((e) => (acc += e))
  return { m, S, values, vectors, explained, cumulative }
}

/** Coordinate nelle prime k componenti: y_j = φ_jᵗ(x − m), j = 1…k. */
export function pcaProject(x: Vec, m: Vec, vectors: readonly Vec[], k: number): number[] {
  const c = x.map((v, j) => v - m[j])
  return vectors.slice(0, k).map((phi) => dot(phi, c))
}

/** Ricostruzione x̂ = m + Σ_j y_j φ_j con le componenti di cui si danno le coordinate. */
export function pcaReconstruct(y: readonly number[], m: Vec, vectors: readonly Vec[]): number[] {
  const out = [...m]
  y.forEach((yj, j) => vectors[j].forEach((v, i) => (out[i] += yj * v)))
  return out
}

/** Errore di ricostruzione con le prime k componenti: J_k = Σ_{j>k} λ_j (medio con la covarianza, totale con lo scatter). */
export const residualError = (values: readonly number[], k: number): number => values.slice(k).reduce((s, v) => s + v, 0)

/** Varianza della proiezione sulla direzione a (resa di norma 1): aᵗΣa / aᵗa. */
export function directionalVariance(S: Mat, a: Vec): number {
  return quadForm(S, a) / dot(a, a)
}

/** Proiezione y = Wᵗx con W = [w₁ … w_m] data per colonne come elenco di vettori. */
export const projectOnto = (x: Vec, ws: readonly Vec[]): number[] => ws.map((w) => dot(w, x))

/** Media di un vettore trasformato: W m (utile per le medie proiettate). */
export const transformMean = (W: Mat, m: Vec): number[] => matVec(W, m)
