// Geometria delle ellissi di una gaussiana 2D (Ellipse.tsx): autovalori e autovettori di Σ 2 × 2 in forma chiusa,
// punti dell'ellisse di Mahalanobis k, massa di probabilità dentro, punte dei semiassi e le due operazioni delle
// maniglie (ruotare Σ tenendo λ, allungare un semiasse tenendo φ).
//
// Tutto nel DOMINIO dei dati: un'ellisse si traccia qui e solo dopo passa per le scale del grafico, così resta
// giusta anche se gli assi hanno unità diverse (e sullo schermo sembra ruotata di un altro angolo).
// La decomposizione n × n (Jacobi) sta in math/: qui basta la formula del 2 × 2, esatta e senza iterazioni.
import { tidy, wrapAngle } from './handleMath'
import type { Mat2, Vec2 } from './math/types'

const DEG = 180 / Math.PI

export interface Eigen2 {
  /** autovalore maggiore, varianza lungo l'asse maggiore */
  l1: number
  /** autovalore minore */
  l2: number
  /** angolo dell'asse maggiore in gradi, in [0, 180) */
  phi: number
  /** autovettore di λ1, unitario: (cos φ, sin φ) */
  e1: Vec2
  /** autovettore di λ2, unitario: e1 ruotato di 90° */
  e2: Vec2
}

/**
 * Autovalori e autovettori di una Σ 2 × 2 simmetrica (se non lo è si usa la parte simmetrica):
 * λ = (a + d)/2 ± √(((a − d)/2)² + b²), φ = ½·atan2(2b, a − d). Con λ1 = λ2 (cerchio) φ = 0.
 */
export function eig2(S: Mat2): Eigen2 {
  const a = S[0][0]
  const d = S[1][1]
  const b = (S[0][1] + S[1][0]) / 2
  const mid = (a + d) / 2
  const r = Math.hypot((a - d) / 2, b)
  const phi = r < 1e-15 ? 0 : wrapAngle(0.5 * Math.atan2(2 * b, a - d) * DEG, 180)
  const rad = phi / DEG
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return { l1: tidy(mid + r), l2: tidy(mid - r), phi, e1: [c, s], e2: [-s, c] }
}

/** Σ = R(φ) diag(λ1, λ2) R(φ)ᵗ: la matrice con quegli autovalori e l'asse di λ1 all'angolo φ (gradi). */
export function fromEigen(l1: number, l2: number, phiDeg: number): Mat2 {
  const rad = phiDeg / DEG
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  const off = tidy((l1 - l2) * c * s)
  return [
    [tidy(l1 * c * c + l2 * s * s), off],
    [off, tidy(l1 * s * s + l2 * c * c)],
  ]
}

/** Σ è una covarianza valida: simmetrica e semidefinita positiva (λ2 ≥ 0, a meno dell'arrotondamento). */
export function isPsd(S: Mat2, tol = 1e-9): boolean {
  const scale = Math.max(1, Math.abs(S[0][0]), Math.abs(S[1][1]), Math.abs(S[0][1]))
  if (Math.abs(S[0][1] - S[1][0]) > tol * scale) return false
  return eig2(S).l2 >= -tol * scale
}

/** (x − m)ᵗ Σ⁻¹ (x − m): il quadrato della distanza di Mahalanobis. Infinito se Σ è singolare. */
export function mahalanobis2(x: Vec2, m: Vec2, S: Mat2): number {
  const det = S[0][0] * S[1][1] - S[0][1] * S[1][0]
  if (Math.abs(det) < 1e-300) return Number.POSITIVE_INFINITY
  const dx = x[0] - m[0]
  const dy = x[1] - m[1]
  return (S[1][1] * dx * dx - (S[0][1] + S[1][0]) * dx * dy + S[0][0] * dy * dy) / det
}

/** Probabilità che un campione di N(m, Σ) in 2D cada dentro l'ellisse di Mahalanobis k: 1 − e^{−k²/2} (χ² a 2 gradi). */
export const massInside = (k: number): number => 1 - Math.exp((-k * k) / 2)

/** Il k dell'ellisse che contiene la probabilità p: √(−2 ln(1 − p)). 0.95 → 2.448. */
export const sigmaForMass = (p: number): number => Math.sqrt(-2 * Math.log(1 - p))

/**
 * I punti dell'ellisse di livello k (x − m)ᵗΣ⁻¹(x − m) = k², chiusa (il primo punto torna in coda): n + 1 punti.
 * Σ singolare (λ2 = 0): il segmento lungo l'autovettore, percorso andata e ritorno. Σ non valida: nessun punto.
 */
export function ellipsePoints(m: Vec2, S: Mat2, k: number, n = 96): Vec2[] {
  if (!isPsd(S)) return []
  const e = eig2(S)
  const a = k * Math.sqrt(Math.max(e.l1, 0))
  const b = k * Math.sqrt(Math.max(e.l2, 0))
  const out: Vec2[] = []
  for (let i = 0; i <= n; i++) {
    const t = (2 * Math.PI * i) / n
    const u = a * Math.cos(t)
    const v = b * Math.sin(t)
    out.push([m[0] + u * e.e1[0] + v * e.e2[0], m[1] + u * e.e1[1] + v * e.e2[1]])
  }
  return out
}

/** Le punte dei due semiassi dell'ellisse di livello k: m + k√λ1·e1 e m + k√λ2·e2. */
export function axisTips(m: Vec2, S: Mat2, k: number): { major: Vec2; minor: Vec2 } {
  const e = eig2(S)
  const a = k * Math.sqrt(Math.max(e.l1, 0))
  const b = k * Math.sqrt(Math.max(e.l2, 0))
  return {
    major: [m[0] + a * e.e1[0], m[1] + a * e.e1[1]],
    minor: [m[0] + b * e.e2[0], m[1] + b * e.e2[1]],
  }
}

/** La stessa ellisse ruotata: gli autovalori restano, l'asse maggiore va all'angolo φ (gradi). */
export function rotateSigma(S: Mat2, phiDeg: number): Mat2 {
  const e = eig2(S)
  return fromEigen(e.l1, e.l2, phiDeg)
}

/**
 * Un semiasse portato alla lunghezza `semi` (nel dominio) sull'ellisse di livello k: λ = (semi/k)², mai sotto
 * `minLambda`. L'altro autovalore e la direzione restano: se il minore supera il maggiore i ruoli si scambiano.
 */
export function stretchSigma(S: Mat2, which: 'major' | 'minor', semi: number, k: number, minLambda = 1e-6): Mat2 {
  const e = eig2(S)
  const lambda = Math.max((semi / k) ** 2, minLambda)
  return which === 'major' ? fromEigen(lambda, e.l2, e.phi) : fromEigen(e.l1, lambda, e.phi)
}
