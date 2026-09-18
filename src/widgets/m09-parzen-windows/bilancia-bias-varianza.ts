// Logica del widget m09-bilancia-bias-varianza ("La bilancia bias-varianza al variare di h").
// Scenario (inventario m09): credit scoring, densità del reddito mensile (k€) dei clienti solvibili stimata da N
// pratiche. Verità sintetica 0.6·N(1.8, 0.4²) + 0.4·N(3.2, 0.7²); bias² e varianza integrati in forma chiusa con
// kernel gaussiano (teoria.ts). Note p43: h_N che si restringe troppo in fretta dà alta varianza, troppo
// lentamente una stima distorta; "the goal is to minimize variance without introducing excessive bias".
import { createRng } from '../../lib/rng'
import { niceLogSteps } from '../engines/density1d'
import { integratedErrors, intLogSteps, sampleMix } from './proprieta/teoria'
import type { Comp, Errors } from './proprieta/teoria'

export const BANCA: readonly Comp[] = [
  { w: 0.6, mu: 1.8, s: 0.4 },
  { w: 0.4, mu: 3.2, s: 0.7 },
]
export const DOMAIN: readonly [number, number] = [0, 6]
export const H_MIN = 0.02
export const H_MAX = 2
export const H_STEPS = niceLogSteps(H_MIN, H_MAX)
export const N_STEPS = intLogSteps(20, 10000)
export const INITIAL = { h: 0.1, N: 100 }

export const errorsAt = (h: number, N: number): Errors => integratedErrors(BANCA, h, N, 1)

/** La U: log10 di bias², varianza e MISE su una griglia logaritmica di h (log10 h da −1.7 a 0.3). */
export function uCurves(N: number, points = 121): { logH: number[]; bias2: number[]; variance: number[]; mise: number[] } {
  const logH = Array.from({ length: points }, (_, i) => Math.log10(H_MIN) + ((Math.log10(H_MAX) - Math.log10(H_MIN)) * i) / (points - 1))
  const e = logH.map((l) => errorsAt(10 ** l, N))
  return { logH, bias2: e.map((x) => Math.log10(x.bias2)), variance: e.map((x) => Math.log10(x.variance)), mise: e.map((x) => Math.log10(x.mise)) }
}

/** h che minimizza il MISE a N fissato (sezione aurea in log h, su un intervallo più largo dello slider). */
export function optimum(N: number): { h: number; errors: Errors } {
  let lo = Math.log(0.002)
  let hi = Math.log(5)
  const f = (l: number) => errorsAt(Math.exp(l), N).mise
  for (let i = 0; i < 90; i++) {
    const a = lo + (hi - lo) * 0.381966
    const b = lo + (hi - lo) * 0.618034
    if (f(a) < f(b)) hi = b
    else lo = a
  }
  const h = Math.exp((lo + hi) / 2)
  return { h, errors: errorsAt(h, N) }
}

/** h in cui bias² e varianza si equivalgono: la bilancia in equilibrio (bisezione in log h). */
export function equilibrium(N: number): number {
  let lo = Math.log(0.002)
  let hi = Math.log(5)
  for (let i = 0; i < 90; i++) {
    const m = (lo + hi) / 2
    const e = errorsAt(Math.exp(m), N)
    if (e.bias2 < e.variance) lo = m
    else hi = m
  }
  return Math.exp((lo + hi) / 2)
}

/** Inclinazione della bilancia in gradi: positiva se pende a destra (varianza più pesante), 0 in equilibrio. */
export const tiltDeg = (e: Errors, maxDeg = 22): number => maxDeg * Math.tanh(Math.log10(e.variance / e.bias2))

export type Side = 'bias' | 'varianza' | 'equilibrio'
/** Da che parte pende: in equilibrio se bias² e varianza stanno entro un fattore 1.25. */
export function sideOf(e: Errors, tol = 1.25): Side {
  const r = e.bias2 / e.variance
  if (r > tol) return 'bias'
  if (r < 1 / tol) return 'varianza'
  return 'equilibrio'
}

// --- le leggi della dimostrazione (note p43) ---

export type LawId = 'veloce' | 'lenta' | 'radice'
export const LAW_N_START = 20
export const LAW_N_END = 10000
/** Le tre leggi partono insieme dal minimo della U a N = 20: h_N = h_1/N, h_1·N^(−0.05), h_1/√N. */
export const LAWS: Record<LawId, { label: string; tex: string; exponent: number }> = {
  veloce: { label: 'troppo veloce', tex: 'h_1/N', exponent: 1 },
  lenta: { label: 'troppo lenta', tex: 'h_1 N^{-0.05}', exponent: 0.05 },
  radice: { label: 'h₁/√N', tex: 'h_1/\\sqrt{N}', exponent: 0.5 },
}
let h20: number | null = null
/** h_N della legge, con h_1 scelto perché a N = 20 tutte valgano l'h ottimo di N = 20. */
export function lawH(id: LawId, N: number): number {
  if (h20 === null) h20 = optimum(LAW_N_START).h
  return h20 * (N / LAW_N_START) ** -LAWS[id].exponent
}
/** N lungo la corsa della dimostrazione, in scala logaritmica da 20 a 10 000. */
export const sweepN = (t: number): number => Math.round(LAW_N_START * (LAW_N_END / LAW_N_START) ** Math.min(1, Math.max(0, t)))
/** Quanto la legge sta sopra il minimo: MISE(h_legge)/MISE(h*). */
export const lawRatio = (id: LawId, N: number): number => errorsAt(lawH(id, N), N).mise / optimum(N).errors.mise

// --- il fascio di stime ricampionate ---

export const BUNDLE = 20

/** Stima gaussiana su una griglia a partire dai campioni, con bin larghi h/10 (esatta a occhio, veloce anche con N = 10 000). */
export function binnedKde(samples: readonly number[], xs: readonly number[], h: number): number[] {
  const span = DOMAIN[1] - DOMAIN[0]
  const bins = Math.max(300, Math.min(4000, Math.round(span / (h / 10))))
  const w = span / bins
  const counts = new Float64Array(bins)
  for (const s of samples) {
    const b = Math.floor((s - DOMAIN[0]) / w)
    if (b >= 0 && b < bins) counts[b]++
  }
  const reach = Math.ceil((5 * h) / w) + 1
  const norm = samples.length * h * Math.sqrt(2 * Math.PI)
  return xs.map((x) => {
    const c = Math.floor((x - DOMAIN[0]) / w)
    let s = 0
    for (let b = Math.max(0, c - reach); b <= Math.min(bins - 1, c + reach); b++) {
      if (counts[b] === 0) continue
      const u = (x - (DOMAIN[0] + (b + 0.5) * w)) / h
      s += counts[b] * Math.exp(-0.5 * u * u)
    }
    return s / norm
  })
}

/** Le 20 stime del fascio: 20 portafogli di N pratiche, a seme. */
export function bundle(N: number, h: number, seed: number, xs: readonly number[]): number[][] {
  return Array.from({ length: BUNDLE }, (_, i) => binnedKde(sampleMix(createRng(seed * 101 + i * 7 + 3), N, BANCA), xs, h))
}

// --- la sfida ---

export const CHALLENGE_N = 100
export const PREDICT_N = 10000
/** Equilibrio a N = 100 (bias² e varianza entro un fattore 1.25) e previsione giusta per N = 10 000 con lo stesso h. */
export function judge(h: number, prediction: Side): { ok: boolean; ratio: number; balanced: boolean; after: Side } {
  const e = errorsAt(h, CHALLENGE_N)
  const balanced = sideOf(e) === 'equilibrio'
  const after = sideOf(errorsAt(h, PREDICT_N))
  return { ok: balanced && prediction === after, ratio: e.bias2 / e.variance, balanced, after }
}
