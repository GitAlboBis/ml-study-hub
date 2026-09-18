// Logica del widget m09-gara-di-consistenza ("La gara delle leggi h_N: chi converge davvero?").
// Scenario (inventario m09): l'impianto misura la luminosità dei salmoni da N = 10 a N = 100 000 pesci. Leggi
// h_N = N^(−a) in gara (h_1 = 1): quella dell'esempio di Melgani, a = 1/(2n) (slide p61), h costante (a = 0) e
// una troppo veloce (a = 1.2/n). Unità normalizzate: la verità è la mistura dei salmoni del widget di
// riferimento, 0.7·N(4, 0.8²) + 0.3·N(6, 0.9²), riportata a media 0 e varianza 1. Bias², varianza e MISE
// integrati sono in forma chiusa (kernel gaussiano, teoria.ts); in n dimensioni le feature sono indipendenti.
import { createRng } from '../../lib/rng'
import { convolveGauss, integratedErrors, intLogSteps, lawLimits, mixPdf, pointGaussMoments, sampleMix } from './proprieta/teoria'
import type { Comp, Errors } from './proprieta/teoria'

/** La mistura dei salmoni (luminosità 0-10) e la sua versione normalizzata. */
const RAW: readonly Comp[] = [
  { w: 0.7, mu: 4, s: 0.8 },
  { w: 0.3, mu: 6, s: 0.9 },
]
const RAW_MEAN = RAW.reduce((s, c) => s + c.w * c.mu, 0)
const RAW_SD = Math.sqrt(RAW.reduce((s, c) => s + c.w * (c.s * c.s + c.mu * c.mu), 0) - RAW_MEAN * RAW_MEAN)
export const PESCE_Z: readonly Comp[] = RAW.map((c) => ({ w: c.w, mu: (c.mu - RAW_MEAN) / RAW_SD, s: c.s / RAW_SD }))
export const DOMAIN: readonly [number, number] = [-3.5, 3.5]
/** Le coordinate oltre la prima, nella fetta del grafico in alto: il modo principale. */
export const SLICE_AT = PESCE_Z[0].mu

export const N_MIN = 10
export const N_MAX = 100_000
export const N_STEPS = intLogSteps(N_MIN, N_MAX)
export const A_RANGE = { min: 0, max: 1.5, step: 0.05 } as const
export const DIMS = [1, 2, 3] as const
export type Dim = (typeof DIMS)[number]

export type LawId = 'melgani' | 'costante' | 'veloce'
/** Le tre leggi della specifica: l'esponente a in funzione di n. */
export const LAWS: Record<LawId, { label: string; a: (n: number) => number }> = {
  melgani: { label: 'Melgani: a = 1/(2n)', a: (n) => 1 / (2 * n) },
  costante: { label: 'h costante: a = 0', a: () => 0 },
  veloce: { label: 'Troppo veloce: a = 1.2/n', a: (n) => 1.2 / n },
}

/** N in scala logaritmica lungo la corsa: da 10 a 100 000. */
export const sweepN = (t: number): number => Math.round(10 ** (1 + 4 * Math.min(1, Math.max(0, t))))

export const hOf = (a: number, N: number): number => N ** -a

/** Errori integrati per la legge a in n dimensioni, a un N. */
export const errorsAt = (a: number, n: number, N: number): Errors => integratedErrors(PESCE_Z, hOf(a, N), N, n)

/** Tracce del grafico log-log: log10 di bias², varianza e MISE su 81 valori di N. */
export function traces(a: number, n: number, points = 81): { logN: number[]; bias2: number[]; variance: number[]; mise: number[] } {
  const logN = Array.from({ length: points }, (_, i) => 1 + (4 * i) / (points - 1))
  const e = logN.map((l) => errorsAt(a, n, 10 ** l))
  const lg = (v: number) => (v > 0 ? Math.log10(v) : Number.NEGATIVE_INFINITY)
  return { logN, bias2: e.map((x) => lg(x.bias2)), variance: e.map((x) => lg(x.variance)), mise: e.map((x) => lg(x.mise)) }
}

/** Pendenza di discesa del MISE fra N = 10⁴ e 10⁵ (quante decadi scende per decade di N). */
export const decaySlope = (a: number, n: number): number => Math.log10(errorsAt(a, n, 1e4).mise) - Math.log10(errorsAt(a, n, 1e5).mise)

/** Gli esponenti dello slider. */
export const A_GRID = Array.from({ length: Math.round((A_RANGE.max - A_RANGE.min) / A_RANGE.step) + 1 }, (_, i) => Number((A_RANGE.min + i * A_RANGE.step).toFixed(2)))

/** Il miglior esponente dello slider per n (discesa più rapida) e la sua pendenza. */
export function bestA(n: number): { a: number; slope: number } {
  let best = { a: 0, slope: Number.NEGATIVE_INFINITY }
  for (const a of A_GRID) {
    const s = decaySlope(a, n)
    if (s > best.slope) best = { a, slope: s }
  }
  return best
}

/** Tolleranza della sfida: una pendenza almeno il 90% della migliore dello slider. */
export const CHALLENGE_FRACTION = 0.9
export const CHALLENGE_N: Dim = 2

export function judgeA(a: number, n: number): { ok: boolean; slope: number; best: { a: number; slope: number }; valid: boolean } {
  const best = bestA(n)
  const slope = decaySlope(a, n)
  const valid = lawLimits(a, n).consistent
  return { ok: n === CHALLENGE_N && slope >= CHALLENGE_FRACTION * best.slope, slope, best, valid }
}

// --- il grafico in alto: la fetta della stima ---

/** Densità vera lungo la prima feature, con le altre ferme sul modo principale. */
export const truthSlice = (x: number, n: number): number => mixPdf(x, PESCE_Z) * mixPdf(SLICE_AT, PESCE_Z) ** (n - 1)

/** Media e deviazione standard della stima nella fetta (forma chiusa, kernel gaussiano). */
export function meanBand(x: number, n: number, h: number, N: number): { mean: number; sd: number } {
  const m1 = pointGaussMoments(x, PESCE_Z, h)
  const mc = pointGaussMoments(SLICE_AT, PESCE_Z, h)
  const mean = m1.mean * mc.mean ** (n - 1)
  const second = m1.second * mc.second ** (n - 1)
  return { mean, sd: Math.sqrt(Math.max(0, (second - mean * mean) / N)) }
}

/** Quota fissa del grafico in alto per ogni n. */
export const yMaxFor = (n: number): number => 1.6 * truthSlice(PESCE_Z[0].mu, n)

let pool: number[] | null = null
/** I 100 000 salmoni, estratti una volta (seme fisso): la stima con N usa i primi N, come un impianto che continua a misurare. */
export function fishPool(): number[] {
  if (pool === null) pool = sampleMix(createRng(20260918), N_MAX, PESCE_Z)
  return pool
}

/**
 * Conteggi per bin dei primi N salmoni del serbatoio, con bin larghi circa h/10 (fra 300 e 4000 bin): abbastanza
 * stretti perché la stima da bin coincida con quella esatta, abbastanza pochi da ricalcolarla a ogni fotogramma.
 */
export function prefixBins(pool: readonly number[], N: number, h: number): { counts: Float64Array; bins: number } {
  const span = DOMAIN[1] - DOMAIN[0]
  const bins = Math.max(300, Math.min(4000, Math.round(span / (h / 10))))
  const counts = new Float64Array(bins)
  const w = span / bins
  for (let i = 0; i < Math.min(N, pool.length); i++) {
    const b = Math.floor((pool[i] - DOMAIN[0]) / w)
    if (b >= 0 && b < bins) counts[b]++
  }
  return { counts, bins }
}

/** E{p̂} esatta nella fetta 1-D, per confronto nei test. */
export const expected1d = (x: number, h: number): number => mixPdf(x, convolveGauss(PESCE_Z, h))

/** Scrive 10^v con gli apici Unicode, per le tacche dell'asse logaritmico. */
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
export const pow10Label = (v: number): string => `10${String(Math.round(v)).replace(/[-0-9]/g, (c) => SUP[c] ?? c)}`
