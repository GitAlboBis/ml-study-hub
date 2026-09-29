// Algebra lineare simmetrica per i motori (covariance, spectrum-nd, projection2d, scene3d, classifier2d, mixture-em):
// operazioni su vettori e matrici n × n, determinante, inversa, Cholesky, la forma chiusa del caso 2 × 2
// (autovalori, angolo dell'asse maggiore, ellisse di livello) e il metodo di Jacobi per autovalori e autovettori
// di una matrice simmetrica fino a n = 200, anche a lotti per fotogramma. Sopra Jacobi: radice quadrata,
// sbiancamento, autovalori generalizzati (S_B w = λ S_W w della LDA), polinomio caratteristico.
//
// Convenzioni:
// - matrici per righe, di sola lettura in ingresso; in uscita array nuovi (number[][]) o tuple per il 2 × 2
// - dimensioni incompatibili o una matrice non simmetrica dove serve simmetrica: RangeError (errore di chi chiama)
// - una matrice singolare NON è un errore (S_W con quattro pixel allineati è uno stato da mostrare): inversa,
//   sistema e sbiancamento restituiscono null, il determinante 0
// - autovalori in ordine decrescente per default; `vectors[k]` è l'autovettore di norma 1 di `values[k]`
import type { Mat, Mat2, Vec, Vec2 } from './types'

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)

const checkSquare = (fn: string, A: Mat): number => {
  const n = A.length
  for (const row of A) if (row.length !== n) throw err(fn, `la matrice deve essere quadrata (${n} righe, una di ${row.length})`)
  return n
}

/** Il più grande |a_ij|: la scala delle tolleranze relative. */
const maxAbs = (A: Mat): number => {
  let m = 0
  for (const row of A) for (const v of row) if (Math.abs(v) > m) m = Math.abs(v)
  return m
}

/** Controlla la simmetria entro una tolleranza relativa alla scala della matrice. */
export function isSymmetric(A: Mat, tol = 1e-10): boolean {
  const n = A.length
  if (A.some((r) => r.length !== n)) return false
  const scale = Math.max(1, maxAbs(A))
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(A[i][j] - A[j][i]) > tol * scale) return false
  return true
}

const checkSym = (fn: string, A: Mat): number => {
  const n = checkSquare(fn, A)
  if (!isSymmetric(A)) throw err(fn, 'la matrice non è simmetrica')
  return n
}

// --- vettori ---

/** Prodotto scalare aᵗb. */
export function dot(a: Vec, b: Vec): number {
  if (a.length !== b.length) throw err('dot', `lunghezze diverse (${a.length} e ${b.length})`)
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

/** Norma euclidea ‖a‖. */
export const vecNorm = (a: Vec): number => Math.sqrt(dot(a, a))

/** a + b, a − b, k·a. */
export const vecAdd = (a: Vec, b: Vec): number[] => {
  if (a.length !== b.length) throw err('vecAdd', `lunghezze diverse (${a.length} e ${b.length})`)
  return a.map((v, i) => v + b[i])
}
export const vecSub = (a: Vec, b: Vec): number[] => {
  if (a.length !== b.length) throw err('vecSub', `lunghezze diverse (${a.length} e ${b.length})`)
  return a.map((v, i) => v - b[i])
}
export const vecScale = (a: Vec, k: number): number[] => a.map((v) => v * k)

/** Prodotto esterno abᵗ: la mini-matrice di ogni punto nella costruzione della covarianza. */
export function outer(a: Vec, b: Vec): number[][] {
  return a.map((ai) => b.map((bj) => ai * bj))
}

// --- matrici ---

export const identity = (n: number): number[][] => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))
export const zeros = (rows: number, cols: number): number[][] => Array.from({ length: rows }, () => new Array<number>(cols).fill(0))

export function transpose(A: Mat): number[][] {
  if (A.length === 0) return []
  return A[0].map((_, j) => A.map((row) => row[j]))
}

export function matMul(A: Mat, B: Mat): number[][] {
  const inner = B.length
  for (const row of A) if (row.length !== inner) throw err('matMul', `colonne di A (${row.length}) ≠ righe di B (${inner})`)
  const cols = inner === 0 ? 0 : B[0].length
  return A.map((row) => {
    const out = new Array<number>(cols).fill(0)
    for (let k = 0; k < inner; k++) {
      const a = row[k]
      if (a === 0) continue
      const bk = B[k]
      for (let j = 0; j < cols; j++) out[j] += a * bk[j]
    }
    return out
  })
}

export function matVec(A: Mat, x: Vec): number[] {
  return A.map((row) => dot(row, x))
}

export function matAdd(A: Mat, B: Mat): number[][] {
  if (A.length !== B.length) throw err('matAdd', 'dimensioni diverse')
  return A.map((row, i) => vecAdd(row, B[i]))
}
export function matSub(A: Mat, B: Mat): number[][] {
  if (A.length !== B.length) throw err('matSub', 'dimensioni diverse')
  return A.map((row, i) => vecSub(row, B[i]))
}
export const matScale = (A: Mat, k: number): number[][] => A.map((row) => row.map((v) => v * k))

export function trace(A: Mat): number {
  const n = checkSquare('trace', A)
  let s = 0
  for (let i = 0; i < n; i++) s += A[i][i]
  return s
}

/** Forma quadratica xᵗ A x (varianza direzionale aᵗΣa, distanza di Mahalanobis con A = Σ⁻¹). */
export function quadForm(A: Mat, x: Vec): number {
  const n = checkSquare('quadForm', A)
  if (x.length !== n) throw err('quadForm', `vettore di ${x.length} componenti per una matrice ${n} × ${n}`)
  let s = 0
  for (let i = 0; i < n; i++) {
    let r = 0
    for (let j = 0; j < n; j++) r += A[i][j] * x[j]
    s += x[i] * r
  }
  return s
}

/** (A + Aᵗ)/2: toglie l'asimmetria dovuta agli arrotondamenti. */
export const symmetrize = (A: Mat): number[][] => A.map((row, i) => row.map((v, j) => (v + A[j][i]) / 2))

/** Pivot sotto questa frazione della scala della matrice: la matrice è singolare. */
const SINGULAR = 1e-12

/** Fattorizzazione LU con pivot parziale (in place su una copia); null se un pivot è nullo rispetto alla scala. */
function lu(A: Mat): { M: number[][]; perm: number[]; sign: number } | null {
  const n = checkSquare('lu', A)
  const M = A.map((r) => [...r])
  const perm = Array.from({ length: n }, (_, i) => i)
  const tol = SINGULAR * Math.max(maxAbs(A), Number.MIN_VALUE)
  let sign = 1
  for (let k = 0; k < n; k++) {
    let p = k
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i
    if (!(Math.abs(M[p][k]) > tol)) return null
    if (p !== k) {
      ;[M[p], M[k]] = [M[k], M[p]]
      ;[perm[p], perm[k]] = [perm[k], perm[p]]
      sign = -sign
    }
    for (let i = k + 1; i < n; i++) {
      const f = M[i][k] / M[k][k]
      M[i][k] = f
      if (f === 0) continue
      for (let j = k + 1; j < n; j++) M[i][j] -= f * M[k][j]
    }
  }
  return { M, perm, sign }
}

/** Determinante |A| (LU con pivot parziale). Una matrice singolare dà 0. Matrice vuota: 1. */
export function det(A: Mat): number {
  const n = checkSquare('det', A)
  if (n === 0) return 1
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0]
  const f = lu(A)
  if (f === null) return 0
  let d = f.sign
  for (let i = 0; i < n; i++) d *= f.M[i][i]
  return d
}

/** Soluzione di A x = b; null se A è singolare. */
export function solve(A: Mat, b: Vec): number[] | null {
  const n = checkSquare('solve', A)
  if (b.length !== n) throw err('solve', `termine noto di ${b.length} componenti per una matrice ${n} × ${n}`)
  const f = lu(A)
  if (f === null) return null
  const y = f.perm.map((p) => b[p])
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) y[i] -= f.M[i][j] * y[j]
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i + 1; j < n; j++) y[i] -= f.M[i][j] * y[j]
    y[i] /= f.M[i][i]
  }
  return y
}

/** Inversa A⁻¹; null se A è singolare (pivot sotto 1e−12 volte la scala della matrice). */
export function inverse(A: Mat): number[][] | null {
  const n = checkSquare('inverse', A)
  if (n === 2) {
    const r = inv2(A)
    return r === null ? null : r.map((row) => [...row])
  }
  const f = lu(A)
  if (f === null) return null
  const cols = Array.from({ length: n }, (_, c) => {
    const y = f.perm.map((p) => (p === c ? 1 : 0))
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) y[i] -= f.M[i][j] * y[j]
    for (let i = n - 1; i >= 0; i--) {
      for (let j = i + 1; j < n; j++) y[i] -= f.M[i][j] * y[j]
      y[i] /= f.M[i][i]
    }
    return y
  })
  return transpose(cols)
}

/**
 * Fattore di Cholesky S = L Lᵗ (L triangolare inferiore) di una matrice simmetrica definita positiva.
 * null se S non è definita positiva: un pivot ≤ `tol` volte il più grande elemento della diagonale.
 */
export function cholesky(S: Mat, tol = SINGULAR): number[][] | null {
  const n = checkSym('cholesky', S)
  let scaleD = 0
  for (let i = 0; i < n; i++) scaleD = Math.max(scaleD, Math.abs(S[i][i]))
  const L = zeros(n, n)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = S[i][j]
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k]
      if (i === j) {
        if (!(s > tol * scaleD)) return null
        L[i][i] = Math.sqrt(s)
      } else L[i][j] = s / L[j][j]
    }
  }
  return L
}

/** ln |S| di una simmetrica definita positiva (da Cholesky, senza traboccare); NaN se S non è definita positiva. */
export function logDetSym(S: Mat): number {
  const L = cholesky(S)
  if (L === null) return Number.NaN
  let s = 0
  for (let i = 0; i < L.length; i++) s += Math.log(L[i][i])
  return 2 * s
}

/** Simmetrica definita positiva (Cholesky riesce con pivot non trascurabili). */
export const isPositiveDefinite = (S: Mat): boolean => isSymmetric(S) && cholesky(S) !== null

/** Simmetrica semidefinita positiva: il più piccolo autovalore non scende sotto −tol volte il più grande in modulo. */
export function isPositiveSemidefinite(S: Mat, tol = 1e-10): boolean {
  if (!isSymmetric(S)) return false
  const { values } = eigSym(S)
  const big = Math.max(...values.map(Math.abs), 0)
  return values.every((v) => v >= -tol * Math.max(big, Number.MIN_VALUE))
}

// --- 2 × 2 in forma chiusa ---

/** |S| di una 2 × 2. */
export const det2 = (S: Mat): number => S[0][0] * S[1][1] - S[0][1] * S[1][0]

/** Inversa di una 2 × 2; null se il determinante è nullo rispetto ai prodotti che lo formano. */
export function inv2(S: Mat): Mat2 | null {
  const [[a, b], [c, d]] = S
  const D = a * d - b * c
  if (D === 0 || Math.abs(D) <= SINGULAR * (Math.abs(a * d) + Math.abs(b * c))) return null
  return [
    [d / D, -b / D],
    [-c / D, a / D],
  ]
}

/** Polinomio caratteristico λ² − tr(S)λ + |S| di una simmetrica 2 × 2, con le radici λ₁ ≥ λ₂. */
export function charPoly2(S: Mat): { tr: number; det: number; coefficients: [number, number, number]; roots: [number, number] } {
  const tr = S[0][0] + S[1][1]
  const d = det2(S)
  const { values } = eig2Sym(S)
  return { tr, det: d, coefficients: [1, -tr, d], roots: [values[0], values[1]] }
}

export interface EigenSym2 {
  /** λ₁ ≥ λ₂ */
  values: Vec2
  /** e₁ = (cos φ, sin φ), e₂ = (−sin φ, cos φ) */
  vectors: readonly [Vec2, Vec2]
  /** angolo φ dell'autovettore principale con l'asse x₁, in radianti, in (−π/2, π/2] */
  angle: number
}

/**
 * Autovalori e autovettori di una simmetrica 2 × 2 in forma chiusa:
 * λ₁,₂ = tr/2 ± √(((s₁₁ − s₂₂)/2)² + s₁₂²), φ = ½·atan2(2 s₁₂, s₁₁ − s₂₂).
 * L'autovettore principale ha la prima componente ≥ 0 (angolo in (−π/2, π/2]): stesso verso a ogni fotogramma.
 */
export function eig2Sym(S: Mat): EigenSym2 {
  const a = S[0][0]
  const b = (S[0][1] + S[1][0]) / 2
  const d = S[1][1]
  const m = (a + d) / 2
  const r = Math.hypot((a - d) / 2, b)
  let angle = 0.5 * Math.atan2(2 * b, a - d)
  if (angle <= -Math.PI / 2) angle += Math.PI
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return {
    values: [m + r, m - r],
    vectors: [
      [c, s],
      [-s, c],
    ],
    angle,
  }
}

/** Σ = [[σ₁², ρσ₁σ₂], [ρσ₁σ₂, σ₂²]] dagli slider σ₁, σ₂, ρ. */
export const covFromSigmas = (s1: number, s2: number, rho: number): Mat2 => [
  [s1 * s1, rho * s1 * s2],
  [rho * s1 * s2, s2 * s2],
]

/** Σ = R(φ) diag(λ₁, λ₂) R(φ)ᵗ: la covarianza che corrisponde alle maniglie sugli assi dell'ellisse. */
export function covFromAxes(l1: number, l2: number, angle: number): Mat2 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const off = (l1 - l2) * c * s
  return [
    [l1 * c * c + l2 * s * s, off],
    [off, l1 * s * s + l2 * c * c],
  ]
}

/** Coefficiente di correlazione ρ = σ₁₂ / (σ₁σ₂) di una covarianza 2 × 2 (NaN se una varianza è nulla). */
export const corr2 = (S: Mat): number => S[0][1] / Math.sqrt(S[0][0] * S[1][1])

/**
 * Ellisse di livello (x − m)ᵗ Σ⁻¹ (x − m) = k²: semiassi rx = k√λ₁ (lungo e₁) e ry = k√λ₂, rotazione φ in radianti.
 * Autovalori negativi oltre l'arrotondamento: Σ non è una covarianza, RangeError.
 */
export function ellipse2(S: Mat, k = 1): { rx: number; ry: number; angle: number } {
  const e = eig2Sym(S)
  const tol = 1e-12 * Math.max(Math.abs(e.values[0]), Number.MIN_VALUE)
  if (e.values[1] < -tol) throw err('ellipse2', 'la matrice non è semidefinita positiva: non è una covarianza')
  return { rx: k * Math.sqrt(Math.max(0, e.values[0])), ry: k * Math.sqrt(Math.max(0, e.values[1])), angle: e.angle }
}

/** n punti dell'ellisse di livello k attorno a m (poligono chiuso implicitamente), da t = 0 lungo e₁. */
export function ellipsePolygon(m: Vec, S: Mat, k = 1, n = 64): Vec2[] {
  const { rx, ry, angle } = ellipse2(S, k)
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return Array.from({ length: n }, (_, i) => {
    const t = (2 * Math.PI * i) / n
    const u = rx * Math.cos(t)
    const v = ry * Math.sin(t)
    return [m[0] + u * c - v * s, m[1] + u * s + v * c] as const
  })
}

// --- Jacobi ---

export interface EigenResult {
  values: number[]
  /** vectors[k]: autovettore di norma 1 di values[k] */
  vectors: number[][]
  /** passate complete sulla matrice */
  sweeps: number
  /** rotazioni di Jacobi applicate */
  rotations: number
  converged: boolean
}

export interface JacobiOptions {
  /** 'desc' (predefinito), 'asc', 'none' (ordine della diagonale) */
  order?: 'desc' | 'asc' | 'none'
  /** passate massime prima di arrendersi; predefinito 60 */
  maxSweeps?: number
}

export interface JacobiRun {
  readonly n: number
  /**
   * Esegue fino a `budget` visite di coppie (p, q) (predefinito: fino alla fine) e dice se ha finito.
   * Una visita costa O(n) quando ruota: con n = 200 una passata sono 19 900 visite. A lotti per fotogramma
   * si sceglie il budget che sta nel tempo del fotogramma.
   */
  step(budget?: number): boolean
  readonly done: boolean
  readonly sweeps: number
  readonly rotations: number
  /** Σ_{p<q} |a_pq|: scende a 0 alla convergenza */
  offNorm(): number
  /** autovalori (la diagonale corrente) e autovettori allo stato attuale */
  result(order?: 'desc' | 'asc' | 'none'): EigenResult
}

/**
 * Metodo di Jacobi ciclico con soglia per una matrice simmetrica n × n: rotazioni piane che azzerano un elemento fuori
 * diagonale alla volta, accumulate in V. Le prime tre passate saltano gli elementi sotto una soglia (0.2·off/n²),
 * dopo la quarta un elemento trascurabile rispetto alla diagonale si azzera senza ruotare: la convergenza è
 * quadratica e finisce quando la somma fuori diagonale è esattamente 0. Tipicamente 6-10 passate.
 */
export function createJacobi(S: Mat, options: JacobiOptions = {}): JacobiRun {
  const n = checkSym('createJacobi', S)
  const maxSweeps = options.maxSweeps ?? 60
  const a = new Float64Array(n * n)
  const v = new Float64Array(n * n)
  const d = new Float64Array(n)
  const bAcc = new Float64Array(n)
  const z = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) a[i * n + j] = S[i][j]
    v[i * n + i] = 1
    d[i] = bAcc[i] = S[i][i]
  }
  let sweeps = 0
  let rotations = 0
  let done = n < 2
  let converged = done
  // posizione nella passata corrente; p = −1: la passata non è ancora cominciata
  let p = -1
  let q = 0
  let tresh = 0

  const offNorm = () => {
    let sm = 0
    for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) sm += Math.abs(a[i * n + j])
    return sm
  }

  const beginSweep = (): boolean => {
    const sm = offNorm()
    if (sm === 0) {
      done = converged = true
      return false
    }
    if (sweeps >= maxSweeps) {
      done = true
      return false
    }
    sweeps++
    tresh = sweeps < 4 ? (0.2 * sm) / (n * n) : 0
    p = 0
    q = 1
    return true
  }

  const endSweep = () => {
    for (let i = 0; i < n; i++) {
      bAcc[i] += z[i]
      d[i] = bAcc[i]
      z[i] = 0
    }
    p = -1
  }

  /** Visita la coppia (p, q): azzera a_pq se trascurabile, altrimenti ruota. */
  const visit = (pp: number, qq: number) => {
    const apq = a[pp * n + qq]
    const g = 100 * Math.abs(apq)
    if (sweeps > 4 && Math.abs(d[pp]) + g === Math.abs(d[pp]) && Math.abs(d[qq]) + g === Math.abs(d[qq])) {
      a[pp * n + qq] = 0
      return
    }
    if (!(Math.abs(apq) > tresh)) return
    const h0 = d[qq] - d[pp]
    let t: number
    if (Math.abs(h0) + g === Math.abs(h0)) t = apq / h0
    else {
      const theta = (0.5 * h0) / apq
      t = 1 / (Math.abs(theta) + Math.sqrt(1 + theta * theta))
      if (theta < 0) t = -t
    }
    const c = 1 / Math.sqrt(1 + t * t)
    const s = t * c
    const tau = s / (1 + c)
    const h = t * apq
    z[pp] -= h
    z[qq] += h
    d[pp] -= h
    d[qq] += h
    a[pp * n + qq] = 0
    // si aggiorna solo il triangolo superiore: tre tratti a seconda di dove sta j rispetto a p e q
    for (let j = 0; j < pp; j++) {
      const x = a[j * n + pp]
      const y = a[j * n + qq]
      a[j * n + pp] = x - s * (y + x * tau)
      a[j * n + qq] = y + s * (x - y * tau)
    }
    for (let j = pp + 1; j < qq; j++) {
      const x = a[pp * n + j]
      const y = a[j * n + qq]
      a[pp * n + j] = x - s * (y + x * tau)
      a[j * n + qq] = y + s * (x - y * tau)
    }
    for (let j = qq + 1; j < n; j++) {
      const x = a[pp * n + j]
      const y = a[qq * n + j]
      a[pp * n + j] = x - s * (y + x * tau)
      a[qq * n + j] = y + s * (x - y * tau)
    }
    for (let j = 0; j < n; j++) {
      const x = v[j * n + pp]
      const y = v[j * n + qq]
      v[j * n + pp] = x - s * (y + x * tau)
      v[j * n + qq] = y + s * (x - y * tau)
    }
    rotations++
  }

  const step = (budget = Number.POSITIVE_INFINITY): boolean => {
    let left = budget
    while (!done && left > 0) {
      if (p < 0 && !beginSweep()) break
      visit(p, q)
      left--
      q++
      if (q >= n) {
        p++
        q = p + 1
        if (p >= n - 1) endSweep()
      }
    }
    return done
  }

  const result = (order: 'desc' | 'asc' | 'none' = options.order ?? 'desc'): EigenResult => {
    const idx = Array.from({ length: n }, (_, i) => i)
    if (order === 'desc') idx.sort((i, j) => d[j] - d[i])
    else if (order === 'asc') idx.sort((i, j) => d[i] - d[j])
    const vectors = idx.map((k) => {
      const col = Array.from({ length: n }, (_, r) => v[r * n + k])
      // verso deterministico: la componente più grande in modulo è positiva
      let big = 0
      for (let r = 1; r < n; r++) if (Math.abs(col[r]) > Math.abs(col[big]) + 1e-12) big = r
      return col[big] < 0 ? col.map((x) => (x === 0 ? 0 : -x)) : col
    })
    return { values: idx.map((k) => d[k]), vectors, sweeps, rotations, converged }
  }

  return {
    n,
    step,
    get done() {
      return done
    },
    get sweeps() {
      return sweeps
    },
    get rotations() {
      return rotations
    },
    offNorm,
    result,
  }
}

/** Autovalori e autovettori di una simmetrica con Jacobi, in un colpo solo. Per n grandi e fotogrammi: `createJacobi`. */
export function eigSym(S: Mat, options: JacobiOptions = {}): EigenResult {
  const run = createJacobi(S, options)
  run.step()
  return run.result(options.order ?? 'desc')
}

/** Rango numerico: autovalori oltre `tol` volte il più grande in modulo. */
export function rankFromEigen(values: readonly number[], tol = 1e-10): number {
  const big = Math.max(0, ...values.map(Math.abs))
  if (big === 0) return 0
  return values.filter((v) => Math.abs(v) > tol * big).length
}

/** Numero di condizionamento λ_max/λ_min di una simmetrica semidefinita; +∞ se λ_min è nullo (entro 1e−12 · λ_max). */
export function conditionNumber(values: readonly number[]): number {
  const hi = Math.max(...values)
  const lo = Math.min(...values)
  return lo <= 1e-12 * Math.abs(hi) ? Number.POSITIVE_INFINITY : hi / lo
}

/** Φ f(Λ) Φᵗ; null se f restituisce un valore non finito. */
function spectralMap(S: Mat, f: (lambda: number) => number): number[][] | null {
  const n = S.length
  const { values, vectors } = eigSym(S)
  const fl = values.map(f)
  if (fl.some((x) => !Number.isFinite(x))) return null
  const out = zeros(n, n)
  for (let k = 0; k < n; k++) {
    const e = vectors[k]
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out[i][j] += fl[k] * e[i] * e[j]
  }
  return out
}

/** Radice quadrata simmetrica S^{1/2} = Φ Λ^{1/2} Φᵗ di una semidefinita positiva; null se un autovalore è negativo. */
export function sqrtSym(S: Mat): number[][] | null {
  checkSym('sqrtSym', S)
  const big = Math.max(maxAbs(S), Number.MIN_VALUE)
  return spectralMap(S, (l) => (l >= -1e-12 * big ? Math.sqrt(Math.max(0, l)) : Number.NaN))
}

/**
 * Matrice di sbiancamento W con W Σ Wᵗ = I:
 * - 'pca' (predefinito) W = Λ^{−1/2} Φᵗ: ruota sugli autovettori e divide per √λ (le righe sono φ_k/√λ_k)
 * - 'zca' W = Σ^{−1/2} = Φ Λ^{−1/2} Φᵗ, simmetrica (la z = S_W^{−1/2} x della LDA)
 * null se Σ non è definita positiva.
 */
export function whiteningMatrix(S: Mat, mode: 'pca' | 'zca' = 'pca'): number[][] | null {
  checkSym('whiteningMatrix', S)
  if (!isPositiveDefinite(S)) return null
  if (mode === 'zca') return spectralMap(S, (l) => 1 / Math.sqrt(l))
  const { values, vectors } = eigSym(S)
  return vectors.map((e, k) => e.map((x) => x / Math.sqrt(values[k])))
}

/**
 * Problema generalizzato A w = λ B w con A simmetrica e B simmetrica definita positiva (S_B w = λ S_W w della LDA):
 * con B = L Lᵗ si risolve C y = λ y, C = L⁻¹ A L⁻ᵗ, e w = L⁻ᵗ y. I w restituiti hanno norma euclidea 1 (il
 * criterio è invariante di scala) e values[k] = wᵗAw / wᵗBw. null se B non è definita positiva (S_W singolare).
 */
export function generalizedEigSym(A: Mat, B: Mat): EigenResult | null {
  const n = checkSym('generalizedEigSym', A)
  if (checkSym('generalizedEigSym', B) !== n) throw err('generalizedEigSym', 'A e B hanno dimensioni diverse')
  const L = cholesky(B)
  if (L === null) return null
  // L⁻¹ triangolare inferiore per sostituzione in avanti
  const Li = zeros(n, n)
  for (let c = 0; c < n; c++) {
    for (let i = c; i < n; i++) {
      let s = i === c ? 1 : 0
      for (let k = c; k < i; k++) s -= L[i][k] * Li[k][c]
      Li[i][c] = s / L[i][i]
    }
  }
  const C = symmetrize(matMul(matMul(Li, A), transpose(Li)))
  const r = eigSym(C)
  const LiT = transpose(Li)
  const vectors = r.vectors.map((y) => {
    const w = matVec(LiT, y)
    const nw = vecNorm(w)
    const u = w.map((x) => x / nw)
    let big = 0
    for (let i = 1; i < n; i++) if (Math.abs(u[i]) > Math.abs(u[big]) + 1e-12) big = i
    return u[big] < 0 ? u.map((x) => -x) : u
  })
  return { ...r, vectors }
}

/**
 * Coefficienti del polinomio caratteristico det(λI − A) = λⁿ + c₁λⁿ⁻¹ + … + cₙ, dal grado più alto (Faddeev-LeVerrier).
 * Esatto nell'aritmetica, ma instabile per n grandi: pensato per n ≤ 10 (la cubica di m14, la parabola del 2 × 2).
 */
export function charPoly(A: Mat): number[] {
  const n = checkSquare('charPoly', A)
  const coeffs = [1]
  let M = zeros(n, n)
  let c = 1
  for (let k = 1; k <= n; k++) {
    // M_k = A M_{k−1} + c_{k−1} I, c_k = −tr(A M_k)/k
    const AM = matMul(A, M)
    M = AM.map((row, i) => row.map((x, j) => (i === j ? x + c : x)))
    c = -trace(matMul(A, M)) / k
    coeffs.push(c)
  }
  return coeffs
}
