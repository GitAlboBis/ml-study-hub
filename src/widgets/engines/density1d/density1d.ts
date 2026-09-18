// Logica pura del motore density1d: nessun React, tutto testato in density1d.test.ts.
//
// I valori numerici delle stime vengono SEMPRE dalla libreria (kernelValue, parzen1d, knnDensity1d, ise di
// src/lib/ml): qui si decide solo dove valutarli (la griglia del terreno), come scomporli (le campane, gli
// addendi del punto sonda) e che cosa mostra lo storyboard in ogni istante (sceneAt).
import { ise, kernelValue, knnDensity1d, knnRadius1d } from '../../../lib/ml/nonparam'
import type { Kernel } from '../../../lib/ml/nonparam'
import { linspace } from '../../../lib/ml/stats'
import type { Rich } from '../../../content/types'
import type { StoryboardStep } from '../../kit/useStoryboard'
import { decimalsOf, fixed } from '../../kit/format'
import { KERNEL_INFO } from './kernelInfo'
import type { Density1dCaptionContext, Density1dStep } from './types'

const clamp01 = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// --- curve di moto (le stesse dei token --ease-out e --ease-in-out, in forma polinomiale) ---

/** Uscita morbida: parte veloce e si posa. Per ciò che entra o cresce. */
export const easeOut = (t: number): number => 1 - (1 - clamp01(t)) ** 3
/** Accelera e frena: per ciò che si sposta o cambia forma sullo schermo. */
export const easeInOut = (t: number): number => {
  const c = clamp01(t)
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2
}
/** Caduta con la gravità: parte piano e arriva veloce. Solo per i campioni che cadono sull'asse. */
export const easeIn = (t: number): number => clamp01(t) ** 2

// --- scala dello slider h ---

/**
 * Mantisse "tonde" per decade: passi di al più il 20%, tutti scrivibili con due cifre significative.
 * C'è 1.5 perché 0.15 e 1.5 sono le soglie di sotto e sovra-smoothing dell'inventario m09.
 */
const MANTISSAS = [1, 1.2, 1.4, 1.5, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9]
const tidy = (v: number) => Number(v.toPrecision(10))

/**
 * Valori di h per uno slider in scala logaritmica: i numeri tondi fra min e max, più gli estremi.
 * Lo slider del kit è lineare: scorre sull'indice di questo elenco, così ogni tacca è un h leggibile
 * (0.40, 0.45, 0.50) e la formula viva mostra esattamente il numero usato nel calcolo.
 */
export function niceLogSteps(min: number, max: number): number[] {
  if (!(min > 0) || !(max >= min) || !Number.isFinite(max)) throw new RangeError(`niceLogSteps: serve 0 < min ≤ max (ricevuti ${min}, ${max})`)
  if (max === min) return [min]
  const inside: number[] = []
  for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
    for (const m of MANTISSAS) {
      const v = tidy(m * 10 ** e)
      if (v > min * (1 + 1e-9) && v < max * (1 - 1e-9)) inside.push(v)
    }
  }
  return [min, ...inside, max]
}

/** Indice del valore dell'elenco più vicino a v (in scala logaritmica se tutti positivi). */
export function nearestIndex(values: readonly number[], v: number): number {
  let best = 0
  let bestD = Number.POSITIVE_INFINITY
  const logScale = v > 0 && values.every((x) => x > 0)
  values.forEach((x, i) => {
    const d = logScale ? Math.abs(Math.log(x) - Math.log(v)) : Math.abs(x - v)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

/** Testo di h: almeno due decimali, di più se h ne ha (0.05, 0.50, 2.50). */
export const formatH = (h: number): string => fixed(Math.max(2, Math.min(4, decimalsOf(h))))(h)

// --- griglia e stime ---

/** Punti di non derivabilità (o di salto) di una campana centrata in xk: servono esatti sulla griglia. */
function breakpoints(xk: number, h: number, kernel: Kernel): number[] {
  switch (kernel) {
    case 'rettangolare': return [xk - h / 2, xk + h / 2]
    case 'triangolare': return [xk - h, xk, xk + h]
    case 'epanechnikov': return [xk - h, xk + h]
    case 'esponenziale': return [xk]
    default: return []
  }
}

/**
 * Ascisse su cui disegnare le curve: `points` punti equispaziati sul dominio più i punti speciali delle
 * campane. Per il rettangolare ogni bordo entra tre volte (appena prima, sul bordo, appena dopo), così il
 * salto da 0 a 1/(Nh) è un tratto verticale e non una rampa inventata dall'interpolazione.
 */
export function evalGrid(domain: readonly [number, number], samples: readonly number[], h: number, kernel: Kernel, points = 401): number[] {
  const [a, b] = domain
  const span = b - a
  const eps = span * 1e-9
  const xs = linspace(a, b, points)
  for (const xk of samples) {
    for (const p of breakpoints(xk, h, kernel)) {
      if (kernel === 'rettangolare') xs.push(p - eps, p, p + eps)
      else xs.push(p)
    }
  }
  const sorted = xs.filter((x) => x >= a && x <= b).sort((p, q) => p - q)
  const out: number[] = []
  for (const x of sorted) if (out.length === 0 || x - out[out.length - 1] > span * 1e-12) out.push(x)
  return out
}

/** Primo indice di xs (crescente) con xs[i] ≥ v. */
function lowerBound(xs: readonly number[], v: number): number {
  let lo = 0
  let hi = xs.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (xs[mid] < v) lo = mid + 1
    else hi = mid
  }
  return lo
}

const compact = (kernel: Kernel) => kernel === 'rettangolare' || kernel === 'triangolare' || kernel === 'epanechnikov'

/**
 * Σ_k scale_k · (1/h) γ((x − x_k)/h) su ogni x della griglia. Con scale_k = 1/N è la stima di Parzen p̂(x);
 * nello storyboard scale_k = crescita_k · peso mostra i kernel che nascono e si normalizzano.
 * I kernel a supporto compatto si sommano solo dove non sono zero (il risultato è identico).
 */
export function weightedKernelSum(xs: readonly number[], samples: readonly number[], h: number, kernel: Kernel, scales: readonly number[]): number[] {
  const out = new Array<number>(xs.length).fill(0)
  const r = KERNEL_INFO[kernel].support * h
  samples.forEach((xk, k) => {
    const s = (scales[k] ?? 0) / h
    if (s === 0) return
    const from = compact(kernel) ? lowerBound(xs, xk - r) : 0
    for (let i = from; i < xs.length; i++) {
      if (compact(kernel) && xs[i] > xk + r) break
      out[i] += s * kernelValue((xs[i] - xk) / h, kernel)
    }
  })
  return out
}

export interface KernelBand {
  /** indice del campione */
  k: number
  /** primo e ultimo indice della griglia coperti dalla campana */
  from: number
  to: number
  /** base e cima della campana su xs[from..to] (stessa lunghezza, to − from + 1) */
  lower: number[]
  upper: number[]
}

/**
 * Le campane dei singoli campioni, pronte da disegnare come aree: separate (stack = 0, ognuna poggia sullo
 * zero) o impilate (stack = 1, ognuna poggia sulle precedenti e la cima dell'ultima è la somma). In mezzo
 * le basi salgono insieme: è l'animazione della somma. Una campana con scala 0 (non ancora nata) non c'è.
 * Ogni campana si ritaglia dove vale più di un decimillesimo del suo picco, più un punto per lato.
 */
export function kernelBands(xs: readonly number[], samples: readonly number[], h: number, kernel: Kernel, scales: readonly number[], stack: number): KernelBand[] {
  const cum = new Array<number>(xs.length).fill(0)
  const bands: KernelBand[] = []
  const peak = kernelValue(0, kernel)
  samples.forEach((xk, k) => {
    const s = (scales[k] ?? 0) / h
    if (s === 0) return
    const values = xs.map((x) => s * kernelValue((x - xk) / h, kernel))
    const threshold = s * peak * 1e-4
    let from = values.findIndex((v) => v > threshold)
    let to = values.length - 1 - [...values].reverse().findIndex((v) => v > threshold)
    if (from < 0) {
      // la campana esce dal dominio: si aggiorna solo la pila
      for (let i = 0; i < xs.length; i++) cum[i] += values[i]
      return
    }
    from = Math.max(0, from - 1)
    to = Math.min(xs.length - 1, to + 1)
    const lower: number[] = []
    const upper: number[] = []
    for (let i = from; i <= to; i++) {
      const base = stack * cum[i]
      lower.push(base)
      upper.push(base + values[i])
    }
    for (let i = 0; i < xs.length; i++) cum[i] += values[i]
    bands.push({ k, from, to, lower, upper })
  })
  return bands
}

// --- il punto sonda ---

export interface Contribution {
  /** indice del campione */
  index: number
  /** il campione x_k */
  x: number
  /** u = (x − x_k)/h */
  u: number
  /** γ(u) */
  gamma: number
  /** l'addendo (1/(N h)) γ(u) */
  term: number
}

/**
 * Gli N addendi di p̂(x) = (1/N) Σ_k (1/h) γ((x − x_k)/h), dal più grande. A parità di contributo passa
 * prima il campione più vicino (poi l'indice): il primo della lista è sempre il campione più vicino a x.
 */
export function contributions(x: number, samples: readonly number[], h: number, kernel: Kernel): Contribution[] {
  const n = samples.length
  return samples
    .map((xk, index) => {
      const u = (x - xk) / h
      const gamma = kernelValue(u, kernel)
      return { index, x: xk, u, gamma, term: gamma / (n * h) }
    })
    .sort((p, q) => q.term - p.term || (Math.abs(Math.abs(p.u) - Math.abs(q.u)) > 1e-9 ? Math.abs(p.u) - Math.abs(q.u) : p.index - q.index))
}

/** K: quanti campioni cadono nella finestra di lato h centrata in x (|x − x_k| ≤ h/2). */
export function windowCount(x: number, samples: readonly number[], h: number): number {
  return samples.reduce((K, xk) => K + kernelValue((x - xk) / h, 'rettangolare'), 0)
}

// --- letture del terreno ---

/**
 * Massimi locali di una curva campionata: i tratti (anche piatti) più alti dei due vicini. I bordi non
 * contano. Valori che differiscono meno di un miliardesimo del massimo sono lo stesso valore: il rumore
 * in virgola mobile su un pianoro non inventa né toglie massimi.
 */
export function countLocalMaxima(ys: readonly number[]): number {
  if (ys.length < 3) return 0
  const top = ys.reduce((m, y) => Math.max(m, Math.abs(y)), 0)
  const tol = top * 1e-9
  const runs: number[] = []
  for (const y of ys) if (runs.length === 0 || Math.abs(y - runs[runs.length - 1]) > tol) runs.push(y)
  let count = 0
  for (let i = 1; i < runs.length - 1; i++) if (runs[i] > runs[i - 1] && runs[i] > runs[i + 1]) count++
  return count
}

/** Ascisse dei picchi che escono dalla cornice (y > yMax): una per tratto, nel suo punto più alto. */
export function clippedPeaks(xs: readonly number[], ys: readonly number[], yMax: number): number[] {
  const out: number[] = []
  let best = -1
  for (let i = 0; i <= ys.length; i++) {
    const over = i < ys.length && ys[i] > yMax
    if (over && (best < 0 || ys[i] > ys[best])) best = i
    if (!over && best >= 0) {
      out.push(xs[best])
      best = -1
    }
  }
  return out
}

/** Il punto più alto di una curva [x, y][]; [NaN, NaN] se è vuota. */
export function peakPoint(pts: readonly (readonly number[])[]): [number, number] {
  let best: [number, number] = [Number.NaN, Number.NaN]
  for (const p of pts) if (!(p[1] <= best[1])) best = [p[0], p[1]]
  return best
}

/**
 * Dove appoggiare l'etichetta diretta di una curva senza scontrarsi con le altre sul picco comune: il primo
 * punto sul fianco destro (o sinistro) del massimo in cui la curva scende a `frac` della sua altezza.
 */
export function flankPoint(pts: readonly (readonly number[])[], side: 'left' | 'right', frac: number): [number, number] {
  if (pts.length === 0) return [Number.NaN, Number.NaN]
  let i = pts.findIndex((p) => p[1] === peakPoint(pts)[1])
  const stop = pts[i][1] * frac
  const step = side === 'right' ? 1 : -1
  while (i + step >= 0 && i + step < pts.length && pts[i][1] > stop) i += step
  return [pts[i][0], pts[i][1]]
}

export type Regime = 'sensitive' | 'balanced' | 'smooth'

/** Sensibile (h piccolo, rischio overfitting), liscia (h grande, underfitting), in equilibrio fra le soglie. */
export function regimeOf(h: number, regimes?: { sensitiveBelow: number; smoothAbove: number }): Regime {
  if (regimes === undefined) return 'balanced'
  if (h < regimes.sensitiveBelow) return 'sensitive'
  if (h > regimes.smoothAbove) return 'smooth'
  return 'balanced'
}

// --- errore integrato ---

/** ISE = ∫ (p̂(x) − p(x))² dx sul dominio, con la stima di Parzen dei campioni (trapezi su `points` punti). */
export function iseAt(samples: readonly number[], h: number, kernel: Kernel, truth: (x: number) => number, domain: readonly [number, number], points = 801): number {
  const xs = linspace(domain[0], domain[1], points)
  const n = samples.length
  const est = weightedKernelSum(xs, samples, h, kernel, samples.map(() => 1 / Math.max(n, 1)))
  return ise(xs, est, xs.map(truth))
}

/**
 * L'h che minimizza l'ISE nell'intervallo `range`, per quei campioni e quel kernel: prima una griglia
 * logaritmica (più i valori tondi dello slider), poi la sezione aurea in log h attorno al migliore.
 * L'ISE del rettangolare è a scalini e può avere più minimi: il risultato è il migliore fra quelli visti.
 */
export function optimalBandwidth(samples: readonly number[], kernel: Kernel, truth: (x: number) => number, domain: readonly [number, number], range: readonly [number, number]): { h: number; ise: number } {
  const [lo, hi] = range
  const f = (h: number) => iseAt(samples, h, kernel, truth, domain)
  const coarse = [...linspace(Math.log(lo), Math.log(hi), 61).map(Math.exp), ...niceLogSteps(lo, hi)].sort((p, q) => p - q)
  const values = coarse.map(f)
  let i = values.indexOf(Math.min(...values))
  let best = { h: coarse[i], ise: values[i] }
  // sezione aurea fra i due vicini del migliore, in log h
  let a = Math.log(coarse[Math.max(0, i - 1)])
  let b = Math.log(coarse[Math.min(coarse.length - 1, i + 1)])
  const g = (Math.sqrt(5) - 1) / 2
  let c = b - g * (b - a)
  let d = a + g * (b - a)
  let fc = f(Math.exp(c))
  let fd = f(Math.exp(d))
  for (i = 0; i < 24; i++) {
    if (fc < fd) {
      b = d
      d = c
      fd = fc
      c = b - g * (b - a)
      fc = f(Math.exp(c))
    } else {
      a = c
      c = d
      fc = fd
      d = a + g * (b - a)
      fd = f(Math.exp(d))
    }
  }
  const refined = fc < fd ? { h: Math.exp(c), ise: fc } : { h: Math.exp(d), ise: fd }
  if (refined.ise < best.ise) best = refined
  return best
}

// --- storyboard ---

/** Che cosa mostra il terreno in un istante dello storyboard. */
export interface Scene {
  /** per campione: 0 = ancora sopra la cornice, 1 = a terra (lineare: l'accelerazione la mette chi disegna) */
  fall: number[]
  /** per campione: altezza della campana, da 0 (non nata) a 1 */
  growth: number[]
  /** peso di ogni campana: 1 = δ(x − x_k) intera (area 1), 1/N = δ(x − x_k)/N (area 1/N) */
  weight: number
  /** 0 = campane separate, 1 = impilate */
  stack: number
  /** opacità della stima p̂(x) */
  estimate: number
  /** 'user': come l'interruttore; un numero: opacità imposta dal passo (vince se l'interruttore è spento) */
  truth: number | 'user'
  /** campane: come l'interruttore, sempre visibili, oppure nascoste */
  kernels: 'user' | 'force' | 'hide'
  /** h con cui si disegna */
  h: number
  /** true se h è imposto dal passo: uno slider mosso adesso non si vedrebbe */
  hOverride: boolean
}

/** Frazione del passo "nascono" in cui cresce un singolo kernel; gli inizi si spalmano sul resto. */
const GROW_EACH = 0.35

/**
 * Lo stato del terreno al passo `index` con avanzamento `progress` (0-1). Ogni fase è uno stato
 * completo; a progress = 1 è lo stato finale del passo, quello che si vede con reduced motion.
 */
export function sceneAt(steps: readonly Density1dStep[], index: number, progress: number, ctx: { n: number; userH: number }): Scene {
  const { n, userH } = ctx
  const w = 1 / Math.max(n, 1)
  const ones = () => new Array<number>(n).fill(1)
  const full: Scene = { fall: ones(), growth: ones(), weight: w, stack: 0, estimate: 1, truth: 'user', kernels: 'user', h: userH, hOverride: false }
  const i = Math.min(Math.max(Math.trunc(index), 0), steps.length - 1)
  const phase = steps[i]?.phase
  const p = clamp01(progress)
  if (phase === undefined) return full

  switch (phase.kind) {
    case 'overview':
    case 'explore':
      return full
    case 'drop':
      return { ...full, fall: Array.from({ length: n }, (_, k) => clamp01(p * n - k)), growth: new Array<number>(n).fill(0), weight: 1, estimate: 0, kernels: 'hide' }
    case 'grow':
      return {
        ...full,
        growth: Array.from({ length: n }, (_, k) => {
          const start = n > 1 ? (k / (n - 1)) * (1 - GROW_EACH) : 0
          return easeOut((p - start) / GROW_EACH)
        }),
        weight: 1,
        estimate: 0,
        kernels: 'force',
      }
    case 'normalize':
      return { ...full, weight: p >= 1 ? w : lerp(1, w, easeInOut(p)), estimate: 0, kernels: 'force' }
    case 'stack':
      return { ...full, stack: easeInOut(p / 0.7), estimate: clamp01((p - 0.45) / 0.45), kernels: 'force' }
    case 'truth':
      return { ...full, stack: 1 - easeInOut(p / 0.45), truth: clamp01((p - 0.3) / 0.6), kernels: 'force' }
    case 'bandwidth': {
      const before = steps[i - 1]?.phase
      const hStart = before?.kind === 'bandwidth' && before.h !== 'user' ? before.h : userH
      const target = phase.h === 'user' ? userH : phase.h
      const e = easeInOut(p)
      const h = e <= 0 ? hStart : e >= 1 ? target : Math.exp(lerp(Math.log(hStart), Math.log(target), e))
      return { ...full, h, hOverride: !(phase.h === 'user' && p >= 1), truth: phase.truth === true ? 1 : 'user' }
    }
    default:
      return full
  }
}

/** I passi per useStoryboard, con le durate risolte per N campioni. */
export function resolveSteps(steps: readonly Density1dStep[], n: number): StoryboardStep[] {
  return steps.map((s) => ({ id: s.id, label: s.label, durationMs: typeof s.durationMs === 'function' ? s.durationMs(n) : s.durationMs }))
}

export function captionFor(step: Density1dStep, ctx: Density1dCaptionContext): Rich {
  return typeof step.caption === 'function' ? step.caption(ctx) : step.caption
}

// --- moti brevi fuori dallo storyboard (un campione aggiunto o tolto) ---

/** Crescita di un kernel appena nato, 0-1 in ease-out. Senza durata (reduced motion) è subito 1. */
export const birthGrowth = (elapsedMs: number, durationMs: number): number => (durationMs <= 0 ? 1 : easeOut(elapsedMs / durationMs))

/** Valore in transizione (il peso 1/N che diventa 1/(N+1)), in ease-out; esatto all'arrivo. */
export function tweenValue(from: number, to: number, elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return to
  const t = clamp01(elapsedMs / durationMs)
  return t >= 1 ? to : lerp(from, to, easeOut(t))
}

// --- campioni ---

/** Un campione aggiunto con un clic: dentro il dominio e arrotondato ai decimali dello scenario. */
export function snapSample(x: number, domain: readonly [number, number], decimals = 1): number {
  const inside = Math.min(Math.max(x, domain[0]), domain[1])
  const rounded = Number(inside.toFixed(decimals))
  return Math.min(Math.max(rounded, domain[0]), domain[1])
}

/** Indice del campione più vicino a x (il primo, a parità); -1 senza campioni. */
export function nearestSampleIndex(samples: readonly number[], x: number): number {
  let best = -1
  let bestD = Number.POSITIVE_INFINITY
  samples.forEach((s, i) => {
    const d = Math.abs(s - x)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

/** K predefinito della stima K-NN: √N arrotondato, almeno 1 (la regola K = √N del corso). */
export const defaultK = (n: number): number => Math.max(1, Math.round(Math.sqrt(n)))

// --- formule vive ---

/**
 * Nomi disponibili nei segnaposto \val{nome} delle formule di un preset (vedi formulaValues):
 * x, N, h, V (= V(h) = h), Nh, S (= Σ γ(u_k)), p (= p̂(x)), d0 (= δ(0) = γ(0)/h), peak (= γ(0)/(Nh)),
 * area (= 1/N), K (campioni nella finestra di lato h), rest (= N − 3),
 * g1…g6, t1…t6, xk1…xk6, u1…u6 (i primi sei addendi per contributo: γ(u), addendo, x_k, u),
 * k, r (= r_K), VK (= 2 r_K), pk (stima K-NN), ptrue (densità vera in x), ise, hopt (h*).
 */
export const FORMULA_VALUE_NAMES: readonly string[] = [
  'x', 'N', 'h', 'V', 'Nh', 'S', 'p', 'd0', 'peak', 'area', 'K', 'rest',
  ...[1, 2, 3, 4, 5, 6].flatMap((i) => [`g${i}`, `t${i}`, `xk${i}`, `u${i}`]),
  'k', 'r', 'VK', 'pk', 'ptrue', 'ise', 'hopt',
]

export type Density1dValues = Record<string, number | undefined>

export interface FormulaInput {
  x: number
  samples: readonly number[]
  h: number
  kernel: Kernel
  k: number
  truth?: (x: number) => number
  hOpt?: number
  ise?: number
}

/** I valori delle formule vive nel punto sonda x. Un addendo che non esiste resta undefined (un trattino). */
export function formulaValues({ x, samples, h, kernel, k, truth, hOpt, ise: iseValue }: FormulaInput): Density1dValues {
  const n = samples.length
  const c = contributions(x, samples, h, kernel)
  const S = c.reduce((s, t) => s + t.gamma, 0)
  const g0 = kernelValue(0, kernel)
  const v: Density1dValues = {
    x,
    N: n,
    h,
    V: h,
    Nh: n * h,
    S,
    p: n > 0 ? S / (n * h) : 0,
    d0: g0 / h,
    peak: n > 0 ? g0 / (n * h) : undefined,
    area: n > 0 ? 1 / n : undefined,
    K: windowCount(x, samples, h),
    rest: Math.max(0, n - 3),
    ptrue: truth?.(x),
    hopt: hOpt,
    ise: iseValue,
  }
  for (let i = 1; i <= 6; i++) {
    const t = c[i - 1]
    v[`g${i}`] = t?.gamma
    v[`t${i}`] = t?.term
    v[`xk${i}`] = t?.x
    v[`u${i}`] = t?.u
  }
  if (Number.isInteger(k) && k >= 1) {
    const r = knnRadius1d(x, samples, k)
    v.k = k
    v.r = r
    v.VK = 2 * r
    v.pk = knnDensity1d(x, samples, k)
  }
  return v
}
