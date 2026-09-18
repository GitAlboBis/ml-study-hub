// Logica del widget m09-dilemma-della-regione ("Il dilemma della regione R: grande per contare, piccola per non
// mediare"), concetto c70. Slide p43-44: P_R = ∫_R p ≈ p(x*)·V e P̂_R = K/N danno p̂(x*) = K/(N V); R deve
// essere abbastanza grande perché K/N sia affidabile (legge dei grandi numeri) e abbastanza piccola perché p non
// vari al suo interno. In Parzen R = [x* − h/2, x* + h/2], V = h: il dilemma diventa la scelta di h.
// Scenario: i redditi (k€) dei clienti solvibili del widget m09-bilancia-bias-varianza. Il numero K di campioni
// in R è esattamente Binomiale(N, P_R): le 100 estrazioni del widget campionano K direttamente.
import { createRng } from '../../lib/rng'
import { normalCdf } from '../../lib/ml/stats'
import { niceLogSteps } from '../engines/density1d'
import { BANCA } from './bilancia-bias-varianza'
import { intLogSteps, mixPdf, sampleBinomial, sampleMix } from './proprieta/teoria'

export { BANCA }
export const DOMAIN: readonly [number, number] = [0, 6]
export const X_RANGE: readonly [number, number] = [0.5, 5.5]
export const H_STEPS = niceLogSteps(0.02, 3)
export const N_STEPS = intLogSteps(20, 20000)
export const H1_RANGE = { min: 0.5, max: 3, step: 0.1 } as const
export const INITIAL = { x: 2.4, h: 0.6, N: 50, h1: 3 }
export const DRAWS = 100
export const DRAW_MS = 50

/** Soglie delle due spie (inventario): K atteso 10 / 30; escursione di p in R 10% / 30%. */
export const LLN = { red: 10, green: 30 } as const
export const FLAT = { green: 0.1, red: 0.3 } as const

export const truth = (x: number): number => mixPdf(x, BANCA)
export const cdf = (x: number): number => BANCA.reduce((s, c) => s + c.w * normalCdf(x, c.mu, c.s), 0)

/** P_R = ∫_R p(x) dx con R = [x* − h/2, x* + h/2]. */
export const probR = (x: number, h: number): number => cdf(x + h / 2) - cdf(x - h / 2)

/** (max − min di p dentro R) / p(x*): quanto p varia nella regione. */
export function excursion(x: number, h: number, points = 101): number {
  let lo = Number.POSITIVE_INFINITY
  let hi = Number.NEGATIVE_INFINITY
  for (let i = 0; i < points; i++) {
    const v = truth(x - h / 2 + (h * i) / (points - 1))
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  return (hi - lo) / truth(x)
}

export type Level = 'ok' | 'warn' | 'ko'
export const llnLevel = (kExpected: number): Level => (kExpected >= LLN.green ? 'ok' : kExpected >= LLN.red ? 'warn' : 'ko')
export const flatLevel = (exc: number): Level => (exc < FLAT.green ? 'ok' : exc <= FLAT.red ? 'warn' : 'ko')

export interface RegionStats {
  pR: number
  p: number
  /** P_R / V: la media di p dentro R, cioè il valore atteso di K/(N h) */
  avg: number
  kExpected: number
  exc: number
  /** varianza di K/(N h): P_R(1 − P_R)/(N h²) */
  variance: number
  bias: number
  mse: number
}

export function regionStats(x: number, h: number, N: number): RegionStats {
  const pR = probR(x, h)
  const p = truth(x)
  const avg = pR / h
  const variance = (pR * (1 - pR)) / (N * h * h)
  const bias = avg - p
  return { pR, p, avg, kExpected: N * pR, exc: excursion(x, h), variance, bias, mse: bias * bias + variance }
}

/** Le 100 stime K/(N h) di 100 training set indipendenti (K ~ Binomiale(N, P_R)), a seme. */
export function drawEstimates(x: number, h: number, N: number, seed: number, count = DRAWS): { k: number; phat: number }[] {
  const rng = createRng((seed * 2654435761) >>> 0)
  const pR = probR(x, h)
  return Array.from({ length: count }, () => {
    const k = sampleBinomial(rng, N, pR)
    return { k, phat: k / (N * h) }
  })
}

/** Il training set disegnato sull'asse (le tacche) e il K che vi si conta davvero. */
export const trainingSet = (N: number, seed: number): number[] => sampleMix(createRng(seed * 31 + 7), N, BANCA)
export const countIn = (samples: readonly number[], x: number, h: number): number => samples.reduce((k, s) => k + (Math.abs(s - x) <= h / 2 ? 1 : 0), 0)

/** Per ogni h dello slider: la spia dei grandi numeri è verde? quella di p costante? entrambe? */
export function greenBands(x: number, N: number): { h: number; lln: boolean; flat: boolean }[] {
  return H_STEPS.map((h) => ({ h, lln: llnLevel(N * probR(x, h)) === 'ok', flat: flatLevel(excursion(x, h, 41)) === 'ok' }))
}

/** Intervallo [min, max] degli h in cui vale `pick`, oppure null. */
export function bandRange(bands: readonly { h: number; lln: boolean; flat: boolean }[], pick: (b: { lln: boolean; flat: boolean }) => boolean): [number, number] | null {
  const hs = bands.filter(pick).map((b) => b.h)
  return hs.length === 0 ? null : [hs[0], hs[hs.length - 1]]
}

/** La legge della corsa finale: h_N = h_1/√N, con N da 50 a 20 000 in scala logaritmica. */
export const sweepN = (t: number): number => Math.round(50 * (20000 / 50) ** Math.min(1, Math.max(0, t)))
export const lawH = (h1: number, N: number): number => h1 / Math.sqrt(N)

// --- la sfida ---

export const CHALLENGE_N = 50
export const MSE_TOLERANCE = 1.1
export const TARGET_K = 30
export const TARGET_H = 0.2
/**
 * La prima parte della sfida si fa sul picco dei redditi, x* = 1.8 k€. In x* = 2.4 p è quasi lineare: una
 * finestra simmetrica non ha quasi bias (la media di una retta è il suo valore al centro) e l'MSE scende fino al
 * bordo dello slider, un minimo di comodo che non insegna nulla. Sul picco la curvatura dà il bias vero e l'MSE
 * ha un minimo interno (h = 0.7). La seconda parte resta nel punto della specifica, x* = 2.4.
 */
export const CHALLENGE_X = 1.8
export const SPEC_X = 2.4

/** L'h dello slider con l'MSE minimo di K/(N h) in x* per N = 50. */
export function bestH(x: number, N = CHALLENGE_N): { h: number; mse: number } {
  let best = { h: H_STEPS[0], mse: Number.POSITIVE_INFINITY }
  for (const h of H_STEPS) {
    const m = regionStats(x, h, N).mse
    if (m < best.mse) best = { h, mse: m }
  }
  return best
}

/** N che porta il K atteso a 30 con h = 0.2: N ≥ 30/P_R (≈ 30/(p(x*)·0.2) come nella specifica). */
export const neededN = (x: number): number => TARGET_K / probR(x, TARGET_H)

export interface Judgement {
  ok: boolean
  atPeak: boolean
  ratio: number
  best: { h: number; mse: number }
  need: number
  nOk: boolean
}

/** Sfida: x* sul picco (±0.05), MSE entro il 10% del migliore dello slider a N = 50, N per K atteso 30 entro il 6%. */
export function judge(x: number, h: number, nAnswer: number): Judgement {
  const atPeak = Math.abs(x - CHALLENGE_X) <= 0.05
  const best = bestH(x)
  const ratio = regionStats(x, h, CHALLENGE_N).mse / best.mse
  const need = neededN(SPEC_X)
  const nOk = Math.abs(nAnswer - need) / need <= 0.06
  return { ok: atPeak && ratio <= MSE_TOLERANCE && nOk, atPeak, ratio, best, need, nOk }
}
