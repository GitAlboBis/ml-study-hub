// Gaussiane per i motori: densità in 1-D e n-D, Mahalanobis, campionamento a seme, gaussiana condizionata, livelli
// ed ellissi di probabilità, e le misure di separabilità fra due classi del Cap. 3 di Melgani (m12): divergenza
// (con i termini delle covarianze e delle medie, anche nella variante della slide), Bhattacharyya, Jeffries-Matusita,
// Chernoff μ(s) con s* e bound, errore di Bayes esatto in 1-D con 2 o più classi, combinazione multiclasse
// (media pesata da P_iP_j o caso peggiore), e le stesse misure calcolate su una griglia o su un istogramma.
// Condivise da covariance, twoclass1d, classifier2d, subset-search, scene3d, mixture-em.
//
// Notazione del corso: classi ω_i e ω_j con medie m_i, m_j e covarianze Σ_i, Σ_j; Δ = m_i − m_j.
// - D_ij = ½ Tr{(Σ_i − Σ_j)(Σ_j⁻¹ − Σ_i⁻¹)} + ½ Tr{(Σ_i⁻¹ + Σ_j⁻¹) Δ Δᵗ}  (la slide ha due segni sbagliati: 'slide')
// - B_ij = ⅛ Δᵗ [(Σ_i + Σ_j)/2]⁻¹ Δ + ½ ln(|(Σ_i + Σ_j)/2| / (|Σ_i|^{1/2} |Σ_j|^{1/2}))
// - JM_ij = √(2(1 − e^{−B_ij})) ∈ [0, √2]
// - μ_ij(s) = −ln ∫ p_i^s p_j^{1−s} = s(1−s)/2 Δᵗ[(1 − s)Σ_i + sΣ_j]⁻¹Δ + ½ ln(|(1 − s)Σ_i + sΣ_j| / (|Σ_i|^{1−s}|Σ_j|^s));
//   la formula gaussiana della slide scambia s e 1 − s ('slide': μ^slide(s) = μ(1 − s)), in s = ½ coincidono e danno B
// - ε_u = P_i^s P_j^{1−s} e^{−μ(s)} ≥ P_e; con 'slide' i prior seguono lo stesso scambio (P_i^{1−s} P_j^s), altrimenti
//   con prior diversi il numero può scendere sotto P_e
//
// Una covarianza non definita positiva non ha densità: RangeError (come in src/lib/ml/stats).
import { trapz } from '../../../../lib/ml/stats'
import type { Rng } from '../../../../content/types'
import { cholesky, inverse, logDetSym, matAdd, matMul, matScale, quadForm, trace } from './linalg'
import { chi2Cdf, goldenMax, normCdf, normSf } from './special'
import type { Gaussian, Mat, Vec, WeightedGauss1 } from './types'

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)
const LN_2PI = Math.log(2 * Math.PI)

/** Gaussiana 1-D N(μ, σ²) come `Gaussian` (m = [μ], S = [[σ²]]). `sigma` è la deviazione standard. */
export function gauss1(mu: number, sigma: number): Gaussian {
  if (!(Number.isFinite(sigma) && sigma > 0)) throw err('gauss1', `σ deve essere finita e > 0 (ricevuto ${sigma})`)
  return { m: [mu], S: [[sigma * sigma]] }
}

interface Prepared {
  n: number
  Sinv: number[][]
  logDet: number
}

function prep(fn: string, g: Gaussian): Prepared {
  const n = g.m.length
  if (g.S.length !== n || g.S.some((r) => r.length !== n)) throw err(fn, `media a ${n} componenti e covarianza ${g.S.length} × ${g.S[0]?.length}`)
  const logDet = logDetSym(g.S)
  const Sinv = Number.isNaN(logDet) ? null : inverse(g.S)
  if (Sinv === null) throw err(fn, 'la covarianza non è definita positiva: non esiste la densità')
  return { n, Sinv, logDet }
}

/** Distanza di Mahalanobis al quadrato (x − m)ᵗ Σ⁻¹ (x − m). */
export function mahalanobisSq(x: Vec, m: Vec, S: Mat): number {
  const { Sinv } = prep('mahalanobisSq', { m, S })
  return quadForm(Sinv, x.map((v, i) => v - m[i]))
}

/** ln p(x) di N(m, Σ): −½ (x − m)ᵗΣ⁻¹(x − m) − ½ ln|Σ| − (n/2) ln 2π. */
export function gaussLogPdf(x: Vec, g: Gaussian): number {
  return prepareGauss(g).logPdf(x)
}

/** p(x) = exp{−½ (x − m)ᵗΣ⁻¹(x − m)} / ((2π)^{n/2} |Σ|^{1/2}). */
export function gaussPdf(x: Vec, g: Gaussian): number {
  return Math.exp(gaussLogPdf(x, g))
}

export interface PreparedGauss {
  n: number
  Sinv: number[][]
  logDet: number
  mahal2(x: Vec): number
  logPdf(x: Vec): number
  pdf(x: Vec): number
}

/** Gaussiana "compilata": inversa e determinante calcolati una volta, per valutarla su griglie e campi. */
export function prepareGauss(g: Gaussian): PreparedGauss {
  const { n, Sinv, logDet } = prep('prepareGauss', g)
  const m = g.m
  const d = new Array<number>(n)
  const mahal2 = (x: Vec) => {
    if (x.length !== n) throw err('prepareGauss', `punto a ${x.length} componenti per una gaussiana a ${n}`)
    for (let i = 0; i < n; i++) d[i] = x[i] - m[i]
    let s = 0
    for (let i = 0; i < n; i++) {
      let r = 0
      for (let j = 0; j < n; j++) r += Sinv[i][j] * d[j]
      s += d[i] * r
    }
    return s
  }
  const c = -0.5 * logDet - 0.5 * n * LN_2PI
  const logPdf = (x: Vec) => c - 0.5 * mahal2(x)
  return { n, Sinv, logDet, mahal2, logPdf, pdf: (x) => Math.exp(logPdf(x)) }
}

/** Valore nel picco: 1 / ((2π)^{n/2} |Σ|^{1/2}). */
export function peakDensity(g: Gaussian): number {
  const { n, logDet } = prep('peakDensity', g)
  return Math.exp(-0.5 * logDet - 0.5 * n * LN_2PI)
}

/**
 * Il taglio orizzontale p(x) = livello è l'ellissoide (x − m)ᵗΣ⁻¹(x − m) = r² con r² = −2 ln(livello/picco).
 * null se il livello è sopra il picco o non positivo (il piano non taglia la campana).
 */
export function levelToMahalanobis2(level: number, g: Gaussian): number | null {
  const peak = peakDensity(g)
  if (!(level > 0) || level > peak) return null
  return -2 * Math.log(level / peak)
}

/** Probabilità di cadere dentro l'ellissoide di Mahalanobis r² in n dimensioni: P{χ²_n ≤ r²} (in 2-D 1 − e^{−r²/2}). */
export const ellipsoidMass = (r2: number, n: number): number => chi2Cdf(r2, n)

/** N punti da N(m, Σ) con Cholesky Σ = LLᵗ: x = m + L z, z normale standard dall'Rng a seme. */
export function sampleGauss(rng: Rng, N: number, g: Gaussian): number[][] {
  if (!Number.isInteger(N) || N < 0) throw err('sampleGauss', `N deve essere un intero ≥ 0 (ricevuto ${N})`)
  const L = cholesky(g.S)
  if (L === null) throw err('sampleGauss', 'la covarianza non è definita positiva')
  const n = g.m.length
  return Array.from({ length: N }, () => {
    const z = Array.from({ length: n }, () => rng.normal())
    return g.m.map((mi, i) => {
      let s = mi
      for (let k = 0; k <= i; k++) s += L[i][k] * z[k]
      return s
    })
  })
}

/**
 * Gaussiana delle componenti non osservate date quelle osservate (complemento di Schur):
 * m_{a|b} = m_a + Σ_ab Σ_bb⁻¹ (x_b − m_b), Σ_{a|b} = Σ_aa − Σ_ab Σ_bb⁻¹ Σ_ba.
 * È l'E-step con un valore mancante (x₄₁ dato x₄₂ = 4 nell'esempio di m10). `indices` dice quali componenti restano.
 */
export function conditionalGauss(g: Gaussian, known: readonly { index: number; value: number }[]): Gaussian & { indices: number[] } {
  const n = g.m.length
  const b = known.map((k) => k.index)
  const a = Array.from({ length: n }, (_, i) => i).filter((i) => !b.includes(i))
  if (b.length === 0) return { m: [...g.m], S: g.S.map((r) => [...r]), indices: a }
  const Sbb = b.map((i) => b.map((j) => g.S[i][j]))
  const Sbbi = inverse(Sbb)
  if (Sbbi === null) throw err('conditionalGauss', 'la covarianza delle componenti osservate è singolare')
  const Sab = a.map((i) => b.map((j) => g.S[i][j]))
  const K = matMul(Sab, Sbbi)
  const db = known.map((k) => k.value - g.m[k.index])
  const m = a.map((i, r) => g.m[i] + K[r].reduce((s, kv, c) => s + kv * db[c], 0))
  const S = a.map((i, r) => a.map((j, c) => g.S[i][j] - K[r].reduce((s, kv, t) => s + kv * Sab[c][t], 0)))
  return { m, S, indices: a }
}

// --- misure fra due gaussiane ---

const pairDims = (fn: string, a: Gaussian, b: Gaussian) => {
  if (a.m.length !== b.m.length) throw err(fn, `le due gaussiane hanno dimensioni diverse (${a.m.length} e ${b.m.length})`)
}

/** Divergenza di Kullback-Leibler KL(a‖b) = E_a{ln a/b} = ½[tr(Σ_b⁻¹Σ_a) + Δᵗ Σ_b⁻¹ Δ − n + ln(|Σ_b|/|Σ_a|)]: è E{L'_ij}. */
export function klGauss(a: Gaussian, b: Gaussian): number {
  pairDims('klGauss', a, b)
  const pa = prep('klGauss', a)
  const pb = prep('klGauss', b)
  const d = a.m.map((v, i) => v - b.m[i])
  return 0.5 * (trace(matMul(pb.Sinv, a.S)) + quadForm(pb.Sinv, d) - pa.n + pb.logDet - pa.logDet)
}

export interface DivergenceTerms {
  D: number
  /** termine delle covarianze ½ Tr{(Σ_i − Σ_j)(Σ_j⁻¹ − Σ_i⁻¹)} (dispersione) */
  cov: number
  /** termine delle medie ½ Tr{(Σ_i⁻¹ + Σ_j⁻¹)ΔΔᵗ} = ½ Δᵗ(Σ_i⁻¹ + Σ_j⁻¹)Δ (separazione) */
  mean: number
}

/**
 * Divergenza D_ij fra due gaussiane con i suoi due termini. 'correct' (predefinito) è la somma KL(i‖j) + KL(j‖i);
 * 'slide' è la formula come appare su slide e note, con Σ_i⁻¹ − Σ_j⁻¹ in entrambi i termini: dà 0 per Σ_i = Σ_j
 * anche con medie diverse (m12, c19).
 */
export function divergenceGauss(a: Gaussian, b: Gaussian, variant: 'correct' | 'slide' = 'correct'): DivergenceTerms {
  pairDims('divergenceGauss', a, b)
  const Ai = prep('divergenceGauss', a).Sinv
  const Bi = prep('divergenceGauss', b).Sinv
  const dS = matAdd(a.S, matScale(b.S, -1))
  const d = a.m.map((v, i) => v - b.m[i])
  const diffInv = matAdd(Ai, matScale(Bi, -1)) // Σ_i⁻¹ − Σ_j⁻¹
  let cov: number
  let mean: number
  if (variant === 'slide') {
    cov = 0.5 * trace(matMul(dS, diffInv))
    mean = 0.5 * quadForm(diffInv, d)
  } else {
    cov = -0.5 * trace(matMul(dS, diffInv))
    mean = 0.5 * quadForm(matAdd(Ai, Bi), d)
  }
  // le classi identiche danno esattamente 0 (niente −0 né residui di arrotondamento)
  if (dS.every((r) => r.every((v) => v === 0))) cov = 0
  if (d.every((v) => v === 0)) mean = 0
  return { D: cov + mean, cov, mean }
}

export interface ChernoffTerms {
  mu: number
  /** s(1−s)/2 Δᵗ M⁻¹ Δ */
  mean: number
  /** ½ ln(|M| / (|Σ_i|^{1−t}|Σ_j|^t)) */
  cov: number
  /**
   * la covarianza mescolata del conto, M = (1 − t)Σ_i + tΣ_j: con 'correct' t = s, cioè (1 − s)Σ_i + sΣ_j; con 'slide'
   * t = 1 − s, cioè sΣ_i + (1 − s)Σ_j. L'ellisse che accompagna μ(s) va disegnata da questa matrice
   */
  M: Mat
  /** peso di Σ_j in M (s o 1 − s, secondo la variante) */
  t: number
}

/**
 * Distanza di Chernoff μ_ij(s) = −ln ∫ p_i^s p_j^{1−s} fra due gaussiane, s ∈ [0, 1], con i termini delle medie e
 * delle covarianze e la covarianza mescolata M del conto. 'slide' usa la formula della slide, con s e 1 − s
 * scambiati: vale μ(1 − s) = −ln ∫ p_i^{1−s} p_j^s.
 */
export function chernoffMu(a: Gaussian, b: Gaussian, s: number, variant: 'correct' | 'slide' = 'correct'): ChernoffTerms {
  pairDims('chernoffMu', a, b)
  if (!(s >= 0 && s <= 1)) throw err('chernoffMu', `s deve stare in [0, 1] (ricevuto ${s})`)
  const t = variant === 'slide' ? 1 - s : s
  const la = logDetSym(a.S)
  const lb = logDetSym(b.S)
  if (Number.isNaN(la) || Number.isNaN(lb)) throw err('chernoffMu', 'una covarianza non è definita positiva')
  // peso di Σ_i: 1 − t, peso di Σ_j: t
  const M = matAdd(matScale(a.S, 1 - t), matScale(b.S, t))
  const Mi = inverse(M)
  const lm = logDetSym(M)
  if (Mi === null || Number.isNaN(lm)) throw err('chernoffMu', 'la covarianza mescolata non è definita positiva')
  const d = a.m.map((v, i) => v - b.m[i])
  const mean = ((t * (1 - t)) / 2) * quadForm(Mi, d)
  const cov = 0.5 * (lm - (1 - t) * la - t * lb)
  return { mu: mean + cov, mean, cov, M, t }
}

/** Distanza di Bhattacharyya B_ij = μ_ij(½), con i due termini e il coefficiente ρ = ∫√(p_i p_j) = e^{−B}. */
export function bhattacharyyaGauss(a: Gaussian, b: Gaussian): { B: number; mean: number; cov: number; rho: number } {
  const r = chernoffMu(a, b, 0.5)
  const d = a.m.map((v, i) => v - b.m[i])
  const same = d.every((v) => v === 0) && a.S.every((row, i) => row.every((v, j) => v === b.S[i][j]))
  const B = same ? 0 : r.mu
  return { B, mean: same ? 0 : r.mean, cov: same ? 0 : r.cov, rho: Math.exp(-B) }
}

/** Jeffries-Matusita dalla distanza di Bhattacharyya: JM = √(2(1 − e^{−B})), satura a √2. */
export const jmFromB = (B: number): number => Math.sqrt(2 * -Math.expm1(-B))

/** JM_ij fra due gaussiane. */
export const jmGauss = (a: Gaussian, b: Gaussian): number => jmFromB(bhattacharyyaGauss(a, b).B)

/**
 * Il fattore dei prior del Chernoff bound, accoppiato all'esponente che la variante dà alle densità: P_i^s P_j^{1−s}
 * con 'correct'; con 'slide', dove μ^slide(s) = −ln ∫ p_i^{1−s} p_j^s, P_i^{1−s} P_j^s. Solo così ε_u maggiora P_e:
 * con P_i^s P_j^{1−s} e μ^slide, per σ_i = 2, σ_j = 0.5, Δ = 1, P_i = 0.8 e s = 0.1 verrebbe 0.155 contro P_e = 0.193.
 */
const priorFactor = (s: number, Pi: number, Pj: number, variant: 'correct' | 'slide') => (variant === 'slide' ? Pi ** (1 - s) * Pj ** s : Pi ** s * Pj ** (1 - s))

/**
 * Chernoff bound ε_u = P_i^s P_j^{1−s} e^{−μ_ij(s)} ≥ P_e. Con 'slide' μ è il numero della slide e i prior seguono lo
 * scambio (P_i^{1−s} P_j^s): è lo stesso bound letto in 1 − s, e resta ≥ P_e anche con prior diversi.
 */
export function chernoffBound(a: Gaussian, b: Gaussian, s: number, Pi: number, Pj: number, variant: 'correct' | 'slide' = 'correct'): number {
  return priorFactor(s, Pi, Pj, variant) * Math.exp(-chernoffMu(a, b, s, variant).mu)
}

/** Bhattacharyya bound P_e ≤ √(P_i P_j) e^{−B}. */
export const bhattacharyyaBound = (B: number, Pi: number, Pj: number): number => Math.sqrt(Pi * Pj) * Math.exp(-B)

/** Lo stesso bound scritto con JM: P_e ≤ √(P_i P_j)(1 − JM²/2). */
export const jmBound = (JM: number, Pi: number, Pj: number): number => Math.sqrt(Pi * Pj) * (1 - (JM * JM) / 2)

/**
 * s* del Chernoff bound. Senza prior: s* = argmax μ(s). Con i prior: minimizza ε_u, cioè massimizza
 * μ(s) − s ln P_i − (1 − s) ln P_j (con 'slide' μ^slide(s) − (1 − s) ln P_i − s ln P_j: s* speculare, stesso ε_u).
 * μ(s) è concava in s: basta la sezione aurea.
 */
export function chernoffOptimum(
  a: Gaussian,
  b: Gaussian,
  options: { Pi?: number; Pj?: number; variant?: 'correct' | 'slide' } = {},
): { s: number; mu: number; eu: number } {
  const variant = options.variant ?? 'correct'
  const withPriors = options.Pi !== undefined && options.Pj !== undefined
  const Pi = options.Pi ?? 0.5
  const Pj = options.Pj ?? 0.5
  const obj = (s: number) => chernoffMu(a, b, s, variant).mu + (withPriors ? -Math.log(priorFactor(s, Pi, Pj, variant)) : 0)
  const { x } = goldenMax(obj, 0, 1, 1e-12)
  const mu = chernoffMu(a, b, x, variant).mu
  return { s: x, mu, eu: priorFactor(x, Pi, Pj, variant) * Math.exp(-mu) }
}

// --- più classi ---

/** Matrice C × C simmetrica di una misura a coppie: calcola solo i < j (C(C − 1)/2 volte), diagonale 0. */
export function pairwiseMatrix(C: number, f: (i: number, j: number) => number): number[][] {
  const M = Array.from({ length: C }, () => new Array<number>(C).fill(0))
  for (let i = 0; i < C; i++) for (let j = i + 1; j < C; j++) M[i][j] = M[j][i] = f(i, j)
  return M
}

/**
 * Misura multiclasse da una matrice di coppie:
 * - 'ave' Σ_{i<j} P(ω_i)P(ω_j) M_ij (D_ave, B_ave, JM_ave della slide; prior uguali se mancano)
 * - 'simple' la media semplice 2/(C(C − 1)) Σ_{i<j} M_ij (citata a parole nelle note)
 * - 'min' il caso peggiore min_{i<j} M_ij
 */
export function combinePairs(M: Mat, options: { mode: 'ave' | 'simple' | 'min'; priors?: readonly number[] }): number {
  const C = M.length
  if (C < 2) throw err('combinePairs', 'servono almeno due classi')
  const P = options.priors ?? new Array<number>(C).fill(1 / C)
  let acc = options.mode === 'min' ? Number.POSITIVE_INFINITY : 0
  for (let i = 0; i < C; i++) {
    for (let j = i + 1; j < C; j++) {
      if (options.mode === 'min') acc = Math.min(acc, M[i][j])
      else if (options.mode === 'simple') acc += M[i][j]
      else acc += P[i] * P[j] * M[i][j]
    }
  }
  return options.mode === 'simple' ? (2 * acc) / (C * (C - 1)) : acc
}

// --- errore di Bayes esatto in 1-D ---

/** P(a < X ≤ b) per X ~ N(μ, σ²), dalla coda giusta (preciso anche lontano dalla media). */
export function intervalProb(a: number, b: number, mu: number, sigma: number): number {
  if (!(b > a)) return 0
  if (a >= mu) return normSf(a, mu, sigma) - normSf(b, mu, sigma)
  if (b <= mu) return normCdf(b, mu, sigma) - normCdf(a, mu, sigma)
  return 1 - normCdf(a, mu, sigma) - normSf(b, mu, sigma)
}

/** Un tratto dell'asse con la classe decisa. */
export interface Region1d {
  from: number
  to: number
  /** indice della classe decisa nel tratto */
  winner: number
}

/** Ascisse in cui w_i N(x; μ_i, σ_i²) = w_j N(x; μ_j, σ_j²): radici di A x² + B x + C = 0 (0, 1 o 2). */
export function crossings1d(p: WeightedGauss1, q: WeightedGauss1): number[] {
  const wi = p.weight ?? 1
  const wj = q.weight ?? 1
  if (!(wi > 0) || !(wj > 0)) return []
  const vi = p.sigma * p.sigma
  const vj = q.sigma * q.sigma
  const A = 1 / (2 * vj) - 1 / (2 * vi)
  const B = p.mu / vi - q.mu / vj
  const C = (q.mu * q.mu) / (2 * vj) - (p.mu * p.mu) / (2 * vi) + Math.log((wi * q.sigma) / (wj * p.sigma))
  const scaleA = 1 / (2 * vi) + 1 / (2 * vj)
  if (Math.abs(A) <= 1e-14 * scaleA) {
    return Math.abs(B) <= 1e-14 * (Math.abs(p.mu / vi) + Math.abs(q.mu / vj) + scaleA) ? [] : [-C / B]
  }
  const disc = B * B - 4 * A * C
  if (disc < 0) return []
  const sq = Math.sqrt(disc)
  const qq = -0.5 * (B + (B >= 0 ? sq : -sq))
  const roots = qq === 0 ? [0] : [qq / A, C / qq]
  return roots.filter((r) => Number.isFinite(r)).sort((x, y) => x - y)
}

const logWeighted = (g: WeightedGauss1, x: number) => {
  const w = g.weight ?? 1
  if (!(w > 0)) return Number.NEGATIVE_INFINITY
  const z = (x - g.mu) / g.sigma
  return Math.log(w) - Math.log(g.sigma) - 0.5 * z * z
}

/**
 * Regioni di decisione 1-D per argmax_i w_i N(x; μ_i, σ_i²), con 2 o più classi (w = prior, o costo × prior per il
 * rischio minimo). Tagli candidati: tutte le intersezioni a coppie; fra due tagli vince sempre la stessa classe;
 * tratti contigui con la stessa classe si fondono. Il primo tratto parte da −∞, l'ultimo arriva a +∞.
 */
export function bayesRegions1d(classes: readonly WeightedGauss1[]): { cuts: number[]; regions: Region1d[] } {
  if (classes.length < 1) throw err('bayesRegions1d', 'serve almeno una classe')
  for (const c of classes) if (!(Number.isFinite(c.sigma) && c.sigma > 0)) throw err('bayesRegions1d', `σ deve essere > 0 (ricevuto ${c.sigma})`)
  const cand: number[] = []
  for (let i = 0; i < classes.length; i++) for (let j = i + 1; j < classes.length; j++) cand.push(...crossings1d(classes[i], classes[j]))
  cand.sort((a, b) => a - b)
  const cuts0 = cand.filter((c, k) => k === 0 || c - cand[k - 1] > 1e-12 * Math.max(1, Math.abs(c)))
  const bounds = [Number.NEGATIVE_INFINITY, ...cuts0, Number.POSITIVE_INFINITY]
  const winnerAt = (x: number) => {
    let best = 0
    let bv = Number.NEGATIVE_INFINITY
    classes.forEach((g, i) => {
      const v = logWeighted(g, x)
      if (v > bv) {
        bv = v
        best = i
      }
    })
    return best
  }
  const regions: Region1d[] = []
  for (let k = 0; k < bounds.length - 1; k++) {
    const a = bounds[k]
    const b = bounds[k + 1]
    const x = !Number.isFinite(a) && !Number.isFinite(b) ? 0 : !Number.isFinite(a) ? b - 1 - Math.abs(b) : !Number.isFinite(b) ? a + 1 + Math.abs(a) : (a + b) / 2
    const winner = winnerAt(x)
    const last = regions[regions.length - 1]
    if (last && last.winner === winner) last.to = b
    else regions.push({ from: a, to: b, winner })
  }
  return { cuts: regions.slice(1).map((r) => r.from), regions }
}

/** Regioni da soglie scelte a mano (ordinate) e dalla classe decisa in ciascun tratto (una in più delle soglie). */
export function regionsFromThresholds(thresholds: readonly number[], labels: readonly number[]): Region1d[] {
  if (labels.length !== thresholds.length + 1) throw err('regionsFromThresholds', `servono ${thresholds.length + 1} etichette, ricevute ${labels.length}`)
  const t = [...thresholds].sort((a, b) => a - b)
  const bounds = [Number.NEGATIVE_INFINITY, ...t, Number.POSITIVE_INFINITY]
  return labels.map((winner, k) => ({ from: bounds[k], to: bounds[k + 1], winner }))
}

/**
 * Errori di una regola 1-D data per regioni: P(errore | ω_i) = Σ dei tratti assegnati ad altre classi (somma di code,
 * precisa anche quando è minuscola), P_e = Σ_i P(ω_i) P(errore | ω_i), P_c = 1 − P_e.
 */
export function decisionErrors1d(
  classes: readonly { mu: number; sigma: number; prior: number }[],
  regions: readonly Region1d[],
): { perClass: number[]; pe: number; pc: number } {
  const perClass = classes.map((c, i) => regions.reduce((s, r) => (r.winner === i ? s : s + intervalProb(r.from, r.to, c.mu, c.sigma)), 0))
  const pe = classes.reduce((s, c, i) => s + c.prior * perClass[i], 0)
  return { perClass, pe, pc: 1 - pe }
}

/**
 * Errore del classificatore di Bayes in 1-D, esatto: P_e = ∫ min[P(ω_i)p(x|ω_i), P(ω_j)p(x|ω_j)] dx con due classi,
 * 1 − ∫ max_i P(ω_i)p(x|ω_i) con più classi. `weight` è il prior P(ω_i) (predefinito 1/C).
 */
export function bayesError1d(classes: readonly WeightedGauss1[]): { pe: number; pc: number; perClass: number[]; cuts: number[]; regions: Region1d[] } {
  const C = classes.length
  const withW = classes.map((c) => ({ ...c, weight: c.weight ?? 1 / C }))
  const { cuts, regions } = bayesRegions1d(withW)
  const e = decisionErrors1d(withW.map((c) => ({ mu: c.mu, sigma: c.sigma, prior: c.weight })), regions)
  return { ...e, cuts, regions }
}

// --- misure su una griglia o su un istogramma ---

export interface GridMeasures {
  /** E{L'_ij} = ∫ p ln(p/q) */
  Dij: number
  /** E{L'_ji} = ∫ q ln(q/p) */
  Dji: number
  D: number
  /** coefficiente di Bhattacharyya ∫ √(pq) */
  rho: number
  B: number
  /** √(∫(√p − √q)²) */
  JM: number
  /** ∫ min(P₁p, P₂q) */
  pe: number
  /** −ln ∫ p^s q^{1−s}, se si dà s */
  mu_s?: number
}

/** p ln(p/q) con le convenzioni 0 ln 0 = 0 e p ln(p/0) = +∞. */
const plogpq = (p: number, q: number) => (p <= 0 ? 0 : q <= 0 ? Number.POSITIVE_INFINITY : p * Math.log(p / q))

function measuresWith(integrate: (f: (k: number) => number) => number, p: readonly number[], q: readonly number[], options: { P1?: number; P2?: number; s?: number }): GridMeasures {
  if (p.length !== q.length) throw err('gridMeasures', `densità di lunghezze diverse (${p.length} e ${q.length})`)
  const P1 = options.P1 ?? 0.5
  const P2 = options.P2 ?? 0.5
  const Dij = integrate((k) => plogpq(p[k], q[k]))
  const Dji = integrate((k) => plogpq(q[k], p[k]))
  const rho = integrate((k) => Math.sqrt(Math.max(0, p[k]) * Math.max(0, q[k])))
  const JM = Math.sqrt(integrate((k) => (Math.sqrt(Math.max(0, p[k])) - Math.sqrt(Math.max(0, q[k]))) ** 2))
  const pe = integrate((k) => Math.min(P1 * p[k], P2 * q[k]))
  const out: GridMeasures = { Dij, Dji, D: Dij + Dji, rho, B: -Math.log(rho), JM, pe }
  if (options.s !== undefined) {
    const s = options.s
    out.mu_s = -Math.log(integrate((k) => (p[k] <= 0 && s > 0) || (q[k] <= 0 && s < 1) ? 0 : Math.max(0, p[k]) ** s * Math.max(0, q[k]) ** (1 - s)))
  }
  return out
}

/** Integrale con i trapezi sulla griglia `xs`; un integrando +∞ in un nodo rende +∞ l'integrale. */
const trapzOn = (xs: readonly number[]) => (f: (k: number) => number) => {
  const ys = xs.map((_, k) => f(k))
  if (ys.some((y) => y === Number.POSITIVE_INFINITY)) return Number.POSITIVE_INFINITY
  return trapz(xs, ys)
}

/**
 * Misure di separabilità di due densità qualsiasi già valutate sulla griglia `xs` (trapezi): D, B, JM, P_e, μ(s).
 * Per le classi di conteggi della slide e per le densità stimate.
 *
 * Limite: dove q vale 0 e p no, la convenzione p ln(p/0) = +∞ dà D = ∞. È la matematica giusta per un istogramma
 * con un bin vuoto, ma su una curva analitica campionata su un dominio largo lo zero può essere solo numerico: N(0, 1)
 * contro N(1.5, 2²) dà D = 2.53125 su [−15, 15] e D = ∞ su [−40, 40], perché φ(x) va in underflow nelle code.
 * Per le densità che si sanno scrivere in forma logaritmica si usa `gridLogMeasures`.
 */
export function gridMeasures(xs: readonly number[], p: readonly number[], q: readonly number[], options: { P1?: number; P2?: number; s?: number } = {}): GridMeasures {
  if (xs.length !== p.length) throw err('gridMeasures', `griglia (${xs.length}) e densità (${p.length}) di lunghezze diverse`)
  return measuresWith(trapzOn(xs), p, q, options)
}

/**
 * Le misure di `gridMeasures` a partire da ln p e ln q sulla griglia `xs` (per esempio da `gaussLogPdf`): i termini
 * della divergenza si calcolano come p·(ln p − ln q), quindi un'underflow di q nelle code non diventa un ∞. Resta ∞
 * solo un vero buco nel supporto: ln q = −∞ dove p > 0. Tutti gli altri termini (√(pq), (√p − √q)², min, p^s q^{1−s})
 * passano per gli esponenziali delle somme dei logaritmi.
 */
export function gridLogMeasures(xs: readonly number[], lp: readonly number[], lq: readonly number[], options: { P1?: number; P2?: number; s?: number } = {}): GridMeasures {
  if (xs.length !== lp.length || lp.length !== lq.length) throw err('gridLogMeasures', `griglia (${xs.length}) e log-densità (${lp.length}, ${lq.length}) di lunghezze diverse`)
  if ([...lp, ...lq].some((v) => Number.isNaN(v) || v === Number.POSITIVE_INFINITY)) throw err('gridLogMeasures', 'le log-densità devono essere numeri < +∞ (−∞ vuol dire densità 0)')
  const integrate = trapzOn(xs)
  const P1 = options.P1 ?? 0.5
  const P2 = options.P2 ?? 0.5
  // p ln(p/q) con i logaritmi: 0 se p = 0, +∞ se q = 0 e p > 0
  const kl = (a: number, b: number) => (a === Number.NEGATIVE_INFINITY ? 0 : b === Number.NEGATIVE_INFINITY ? Number.POSITIVE_INFINITY : Math.exp(a) * (a - b))
  const Dij = integrate((k) => kl(lp[k], lq[k]))
  const Dji = integrate((k) => kl(lq[k], lp[k]))
  const rho = integrate((k) => Math.exp(0.5 * (lp[k] + lq[k])))
  const JM = Math.sqrt(integrate((k) => (Math.exp(0.5 * lp[k]) - Math.exp(0.5 * lq[k])) ** 2))
  const pe = integrate((k) => Math.exp(Math.min(Math.log(P1) + lp[k], Math.log(P2) + lq[k])))
  const out: GridMeasures = { Dij, Dji, D: Dij + Dji, rho, B: -Math.log(rho), JM, pe }
  if (options.s !== undefined) {
    const s = options.s
    // 0 · (−∞) = 0: con s = 0 conta solo q, con s = 1 solo p
    const term = (a: number, w: number) => (w === 0 ? 0 : w * a)
    out.mu_s = -Math.log(integrate((k) => Math.exp(term(lp[k], s) + term(lq[k], 1 - s))))
  }
  return out
}

/** Le stesse misure su due istogrammi a densità (K/(N·larghezza)) con bin di pari larghezza: somme di Riemann esatte. */
export function binnedMeasures(width: number, p: readonly number[], q: readonly number[], options: { P1?: number; P2?: number; s?: number } = {}): GridMeasures {
  if (!(width > 0)) throw err('binnedMeasures', `la larghezza dei bin deve essere > 0 (ricevuto ${width})`)
  const integrate = (f: (k: number) => number) => {
    let s = 0
    for (let k = 0; k < p.length; k++) s += f(k)
    return s * width
  }
  return measuresWith(integrate, p, q, options)
}
