// Tipi della matematica comune dei motori (src/widgets/engines/shared/math). Solo tipi.
//
// Le funzioni generali (n × n) accettano `Vec` e `Mat` di src/lib/ml/stats (array di sola lettura, matrici per
// righe); i tipi a lunghezza fissa qui sotto sono sottotipi di quelli, quindi un `Mat2` passa dove serve un `Mat`.
// Le funzioni a dimensione fissa (2 × 2, piano, spazio) restituiscono i tipi a lunghezza fissa.
import type { Mat, Vec } from '../../../../lib/ml/stats'

export type { Mat, Vec }

/** Punto o vettore del piano delle feature, (x₁, x₂). */
export type Vec2 = readonly [number, number]
/** Punto o vettore dello spazio, (x, y, z). */
export type Vec3 = readonly [number, number, number]
/** Matrice 2 × 2 per righe, es. la covarianza [[σ₁², σ₁₂], [σ₁₂, σ₂²]]. */
export type Mat2 = readonly [Vec2, Vec2]
/** Matrice 3 × 3 per righe. */
export type Mat3 = readonly [Vec3, Vec3, Vec3]

/**
 * Gaussiana n-dimensionale N(m, Σ): `m` è il vettore medio, `S` la matrice di covarianza Σ (non la deviazione
 * standard). In una dimensione m = [μ] e S = [[σ²]]: si costruisce con `gauss1(μ, σ)`.
 */
export interface Gaussian {
  m: Vec
  S: Mat
}

/** Gaussiana 1-D pesata (prior, o prior per costo) per le regioni di decisione su un asse. */
export interface WeightedGauss1 {
  mu: number
  /** deviazione standard σ, non la varianza */
  sigma: number
  /** P(ω_i), oppure λ·P(ω_i) quando il peso tiene conto di un costo; predefinito 1 */
  weight?: number
}
