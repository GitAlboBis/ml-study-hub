// Logica del widget m09-specht-gaussiano-sferico ("Metodo di Specht: una gaussiana sferica su ogni campione"),
// concetti c58, c59, c61. Slide p65: p̂(x) = (1/N) Σ_k (2πσ²)^(−n/2) exp(−‖x − x_k‖²/(2σ²)), una mistura di N
// gaussiane rotonde identiche; σ è l'unico iperparametro (note p45). Scenario (inventario): 40 pixel di
// vegetazione in due bande normalizzate (rosso, vicino infrarosso), una nuvola curva "a banana", dati sintetici.
// σ si sceglie con la log-verosimiglianza leave-one-out: quella sui dati di training cresce senza limite per σ → 0.
import { createRng } from '../../lib/rng'
import { spechtDensity } from '../../lib/ml/nonparam'
import { niceLogSteps } from '../engines/density1d'

export type Pt = readonly [number, number]

export const DOMAIN: readonly [number, number] = [-3, 3]
export const N_RANGE = { min: 5, max: 80 } as const
export const SIGMA_STEPS = niceLogSteps(0.05, 2)
export const INITIAL_SIGMA = 0.3
export const INITIAL_PROBE: Pt = [0.2, -0.9]
/** Soglie dei timbri (inventario): σ < 0.1 overfitting, σ > 1 underfitting. */
export const REGIMES = { over: 0.1, under: 1 } as const

/** 40 pixel su un arco (la nuvola curva della vegetazione), poi riportati a z-score banda per banda. */
export function bananaPixels(seed = 3, n = 40): Pt[] {
  const rng = createRng(seed)
  const raw = Array.from({ length: n }, () => {
    const t = Math.PI + 0.45 + rng.next() * (Math.PI - 0.9)
    const r = 2 + rng.normal(0, 0.22)
    return [r * Math.cos(t), 1.2 + r * Math.sin(t)] as const
  })
  const mean = [0, 1].map((j) => raw.reduce((s, p) => s + p[j], 0) / n)
  const sd = [0, 1].map((j) => Math.sqrt(raw.reduce((s, p) => s + (p[j] - mean[j]) ** 2, 0) / n))
  return raw.map((p) => [Number(((p[0] - mean[0]) / sd[0]).toFixed(3)), Number(((p[1] - mean[1]) / sd[1]).toFixed(3))] as const)
}

export const specht = (x: Pt, samples: readonly Pt[], sigma: number): number => spechtDensity(x, samples, sigma)

/** Coefficiente di normalizzazione in 2-D: 1/(2πσ²). */
export const coef2d = (sigma: number): number => 1 / (2 * Math.PI * sigma * sigma)

export interface Addend {
  index: number
  dist: number
  /** exp(−‖x − x_k‖²/(2σ²)) */
  e: number
  /** l'addendo (1/N)·coef·e */
  term: number
}

/** Gli addendi del punto sonda, dal più grande. */
export function addends(x: Pt, samples: readonly Pt[], sigma: number): Addend[] {
  const c = coef2d(sigma) / samples.length
  return samples
    .map((p, index) => {
      const dist = Math.hypot(x[0] - p[0], x[1] - p[1])
      const e = Math.exp((-dist * dist) / (2 * sigma * sigma))
      return { index, dist, e, term: c * e }
    })
    .sort((a, b) => b.term - a.term)
}

/** Log-verosimiglianza leave-one-out: ogni pixel valutato con la stima fatta dagli altri N − 1. */
export function looLogLik(samples: readonly Pt[], sigma: number): number {
  let s = 0
  samples.forEach((p, k) => {
    const others = samples.filter((_, j) => j !== k)
    s += Math.log(Math.max(1e-300, specht(p, others, sigma)))
  })
  return s
}

/** Log-verosimiglianza sui dati di training (ogni pixel conta anche se stesso): cresce senza limite per σ → 0. */
export function trainLogLik(samples: readonly Pt[], sigma: number): number {
  return samples.reduce((s, p) => s + Math.log(Math.max(1e-300, specht(p, samples, sigma))), 0)
}

/** Griglia logaritmica di σ per le curve del pannello "un solo iperparametro". */
export const SIGMA_CURVE = Array.from({ length: 49 }, (_, i) => 0.05 * (2 / 0.05) ** (i / 48))

/** σ che massimizza la LOO: griglia, poi sezione aurea in log σ attorno al migliore. */
export function bestSigma(samples: readonly Pt[]): number {
  let bi = 0
  let bv = Number.NEGATIVE_INFINITY
  SIGMA_CURVE.forEach((s, i) => {
    const v = looLogLik(samples, s)
    if (v > bv) {
      bv = v
      bi = i
    }
  })
  let lo = Math.log(SIGMA_CURVE[Math.max(0, bi - 1)])
  let hi = Math.log(SIGMA_CURVE[Math.min(SIGMA_CURVE.length - 1, bi + 1)])
  for (let i = 0; i < 40; i++) {
    const a = lo + (hi - lo) * 0.381966
    const b = lo + (hi - lo) * 0.618034
    if (looLogLik(samples, Math.exp(a)) > looLogLik(samples, Math.exp(b))) hi = b
    else lo = a
  }
  return Math.exp((lo + hi) / 2)
}

export type Zone = 'overfitting' | 'giusta' | 'underfitting'
/** Dove sta σ rispetto a σ*: entro un fattore 1.3 è "giusta". */
export function zoneOf(sigma: number, best: number, tol = 1.3): Zone {
  if (sigma < best / tol) return 'overfitting'
  if (sigma > best * tol) return 'underfitting'
  return 'giusta'
}

export const regimeOf = (sigma: number): 'over' | 'under' | null => (sigma < REGIMES.over ? 'over' : sigma > REGIMES.under ? 'under' : null)

/** Le risposte del disegno d'esame: esponente n/2 e denominatore 2σ². */
export const EXPONENTS = ['n', 'n/2', '2n'] as const
export const DENOMINATORS = ['\\sigma^2', '2\\sigma^2', '\\sigma/2'] as const
export const RIGHT = { exponent: 'n/2', denominator: '2\\sigma^2' } as const

/** Indice del campione più vicino a x. */
export function nearest(x: Pt, samples: readonly Pt[]): number {
  let bi = -1
  let bd = Number.POSITIVE_INFINITY
  samples.forEach((p, i) => {
    const d = Math.hypot(p[0] - x[0], p[1] - x[1])
    if (d < bd) {
      bd = d
      bi = i
    }
  })
  return bi
}

/** σ sulla corsa del passo "σ dal piccolo al grande": da 0.05 a 2 in scala logaritmica. */
export const sweepSigma = (t: number): number => 0.05 * 40 ** Math.min(1, Math.max(0, t))
