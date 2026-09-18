// Logica del widget m09-conteggio-vs-interpolazione (concetti c12 classe più generale di finestre, c13 gaussiana,
// Epanechnikov, triangolare, c14 stime lisce, c16 la finestra come interpolatore). Tre letture di temperatura di una
// cella frigorifera: con il rettangolo ogni lettura conta 1 o 0 (conteggio), con i kernel lisci pesa in base alla
// distanza dal punto sonda (interpolazione). Il passaggio da una forma all'altra è una combinazione convessa di
// densità, quindi a ogni istante del morphing la finestra è ancora una densità di area 1.
import { kernelValue } from '../../lib/ml/nonparam'
import type { Kernel } from '../../lib/ml/nonparam'
import { linspace } from '../../lib/ml/stats'
import { easeInOut } from '../engines/density1d/density1d'
import { gammaOf, kde, morphGamma } from './parzen-lab'
import type { Gamma } from './parzen-lab'

export const DOMAIN: readonly [number, number] = [0, 9]
/** Le tre letture dell'inventario, in °C. */
export const SAMPLES0: readonly number[] = [3.2, 4.1, 6.0]
export const PROBE0 = 4.5
export const HOLE_X = 5.05
export const X_STEP = 0.05
export const H0 = 1
export const H_RANGE: readonly [number, number] = [0.3, 3]
export const H_STEP = 0.05
/** La sequenza del morphing: dal conteggio all'interpolazione. */
export const SEQUENCE: readonly Kernel[] = ['rettangolare', 'triangolare', 'epanechnikov', 'gaussiano']
/** Durate di ogni forma: 800 ms di morphing, 1 s di penna, una breve pausa. */
export const MORPH_MS = 800
export const REDRAW_MS = 1000
export const HOLD_MS = 400
export const SHAPE_MS = MORPH_MS + REDRAW_MS + HOLD_MS

/**
 * Griglia del terreno: equispaziata più i punti in cui i kernel cambiano forma (x_k ± h/2 per il rettangolo, con
 * i due lati del salto; x_k ± h e x_k per triangolo ed Epanechnikov), così nessun gradino diventa una rampa.
 */
export function gridFor(samples: readonly number[], h: number, points = 451): number[] {
  const eps = 1e-9
  const xs = linspace(DOMAIN[0], DOMAIN[1], points)
  for (const s of samples) xs.push(s - h / 2 - eps, s - h / 2, s + h / 2, s + h / 2 + eps, s - h, s, s + h)
  const out: number[] = []
  for (const v of xs.filter((v) => v >= DOMAIN[0] && v <= DOMAIN[1]).sort((a, b) => a - b)) if (out.length === 0 || v - out[out.length - 1] > 1e-12) out.push(v)
  return out
}

/** Il kernel mostrato a metà morphing fra `from` e `to` (t da 0 a 1, già con la curva di moto). */
export const shapeAt = (from: Kernel, to: Kernel, t: number): Gamma => morphGamma(gammaOf(from), gammaOf(to), t)

/** Pesi γ((x − x_k)/h) di ogni lettura nel punto x, nell'ordine delle letture. */
export const weightsAt = (x: number, samples: readonly number[], h: number, kernel: Kernel): number[] => samples.map((s) => kernelValue((x - s) / h, kernel))

/** p̂(x) con il kernel dato: (1/(N h)) Σ γ((x − x_k)/h). */
export const estimateAt = (x: number, samples: readonly number[], h: number, kernel: Kernel): number =>
  samples.length === 0 ? 0 : weightsAt(x, samples, h, kernel).reduce((a, b) => a + b, 0) / (samples.length * h)

export interface WeightsRow {
  kernel: Kernel
  weights: number[]
  p: number
}

/** La tabella finale: i pesi delle letture nel punto sonda per i quattro kernel, affiancati. */
export const weightsTable = (x: number, samples: readonly number[], h: number): WeightsRow[] =>
  SEQUENCE.map((kernel) => ({ kernel, weights: weightsAt(x, samples, h, kernel), p: estimateAt(x, samples, h, kernel) }))

/** Tratti fra la prima e l'ultima lettura in cui la curva è (quasi) zero: i "buchi" del conteggio. */
export function zeroRuns(xs: readonly number[], ys: readonly number[], samples: readonly number[], tol = 1e-9): [number, number][] {
  if (samples.length < 2) return []
  const lo = Math.min(...samples)
  const hi = Math.max(...samples)
  const out: [number, number][] = []
  let start: number | null = null
  for (let i = 0; i < xs.length; i++) {
    const inside = xs[i] > lo && xs[i] < hi && ys[i] <= tol
    if (inside && start === null) start = xs[i]
    if (!inside && start !== null) {
      out.push([start, xs[i - 1]])
      start = null
    }
  }
  if (start !== null) out.push([start, xs[xs.length - 1]])
  return out.filter(([a, b]) => b - a > 1e-6)
}

export interface Scene {
  /** kernel di partenza e di arrivo del morphing e avanzamento (0 = from, 1 = to) */
  from: Kernel
  to: Kernel
  t: number
  /** fin dove la penna ha ridisegnato la stima (dominio); Infinity = tutta */
  until: number
  /** il punto sonda è imposto dal passo (il buco fra 4.1 e 6.0) */
  probe: number | null
  label: 'conteggio' | 'interpolazione'
}

export const STEP = { quadro: 0, buco: 1, tri: 2, epan: 3, gauss: 4, riempito: 5, tabella: 6 } as const

export const STEPS = [
  { id: 'quadro', label: 'Conteggio: dentro o fuori', durationMs: 1500 },
  { id: 'buco', label: 'Salti e buchi del rettangolo', durationMs: 1600 },
  { id: 'tri', label: 'Generalizza: la finestra triangolare', durationMs: SHAPE_MS },
  { id: 'epan', label: 'La finestra di Epanechnikov', durationMs: SHAPE_MS },
  { id: 'gauss', label: 'La finestra gaussiana', durationMs: SHAPE_MS },
  { id: 'riempito', label: 'Il buco si riempie', durationMs: 1600 },
  { id: 'tabella', label: 'I pesi dei quattro kernel, affiancati', durationMs: 1500 },
] as const

/**
 * Che cosa mostra il terreno al passo `index` con avanzamento `p`. Nei passi del morphing il kernel passa dal
 * precedente al successivo in MORPH_MS (ease-in-out), poi la penna ridisegna la stima da sinistra in REDRAW_MS.
 * Nell'ultimo passo il kernel torna quello del selettore (`userKernel`).
 */
export function sceneAt(index: number, p: number, userKernel: Kernel): Scene {
  const whole = { until: Number.POSITIVE_INFINITY, probe: null }
  const shape = (k: number): Scene => {
    const ms = p * SHAPE_MS
    const t = easeInOut(Math.min(1, ms / MORPH_MS))
    const until = ms < MORPH_MS ? DOMAIN[0] : DOMAIN[0] + (DOMAIN[1] - DOMAIN[0]) * Math.min(1, (ms - MORPH_MS) / REDRAW_MS)
    return { from: SEQUENCE[k - 1], to: SEQUENCE[k], t, until: p >= 1 ? Number.POSITIVE_INFINITY : until, probe: null, label: 'interpolazione' }
  }
  switch (index) {
    case STEP.quadro:
      // il quadro è quello dei comandi: all'apertura il rettangolo del conteggio
      return { ...whole, from: userKernel, to: userKernel, t: 1, label: userKernel === 'rettangolare' ? 'conteggio' : 'interpolazione' }
    case STEP.buco:
      return { from: 'rettangolare', to: 'rettangolare', t: 1, until: Number.POSITIVE_INFINITY, probe: HOLE_X, label: 'conteggio' }
    case STEP.tri:
      return shape(1)
    case STEP.epan:
      return shape(2)
    case STEP.gauss:
      return shape(3)
    case STEP.riempito:
      return { from: 'gaussiano', to: 'gaussiano', t: 1, until: Number.POSITIVE_INFINITY, probe: HOLE_X, label: 'interpolazione' }
    default:
      return { ...whole, from: userKernel, to: userKernel, t: 1, label: userKernel === 'rettangolare' ? 'conteggio' : 'interpolazione' }
  }
}

/** La stima con il kernel della scena, su una griglia. */
export const sceneEstimate = (xs: readonly number[], samples: readonly number[], h: number, s: Scene): number[] => kde(xs, samples, h, shapeAt(s.from, s.to, s.t))

// --- sfida ---

export const CHALLENGE_X = 5
export const CHALLENGE_TOL = 0.02

export interface ChallengeAnswer {
  heaviest: number | null
  gamma: number
  p: number
}

export interface ChallengeVerdict {
  weights: number[]
  heaviest: number
  p: number
  choiceOk: boolean
  gammaOk: boolean
  pOk: boolean
  ok: boolean
}

/** Con il gaussiano e h = 1, in x = 5 °C: quale lettura pesa di più e quanto, e quanto vale p̂(5). Letture dell'inventario. */
export function judge(a: ChallengeAnswer): ChallengeVerdict {
  const weights = weightsAt(CHALLENGE_X, SAMPLES0, 1, 'gaussiano')
  const heaviest = weights.indexOf(Math.max(...weights))
  const p = estimateAt(CHALLENGE_X, SAMPLES0, 1, 'gaussiano')
  const choiceOk = a.heaviest === heaviest
  const gammaOk = Math.abs(a.gamma - weights[heaviest]) <= CHALLENGE_TOL
  const pOk = Math.abs(a.p - p) <= CHALLENGE_TOL
  return { weights, heaviest, p, choiceOk, gammaOk, pOk, ok: choiceOk && gammaOk && pOk }
}

// --- testi (String.raw) ---

export interface CaptionCtx {
  x: string
  h: string
  p: string
  pRect: string
  kernel: string
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.quadro:
      return String.raw`Tre letture di temperatura della cella frigorifera e il punto sonda $x = ${c.x}$ °C. Con la finestra rettangolare ogni lettura **conta**: pesa 1 se dista al più $h/2$ da $x$, 0 altrimenti. Le barre dalle letture alla sonda sono i loro contributi: qui $\hat p(${c.x}) = ${c.p}$. Trascina la sonda e le letture.`
    case STEP.buco:
      return String.raw`Dentro o fuori, senza gradazioni: $\hat p(x)$ salta in ogni $x_k \pm h/2$ (i triangolini) e dove nessuna lettura è nella finestra vale **zero**. In $x = ${c.x}$, a metà fra 4.1 e 6.0 °C, c'è un buco: $\hat p = ${c.p}$ anche se lì una temperatura è plausibilissima.`
    case STEP.tri:
      return String.raw`«*Rather than limiting ourselves to the hypercube window function, suppose we allow a more general class of window functions.*» Il rettangolo diventa un triangolo, $\Lambda$: il peso cala **linearmente** con la distanza (*linear tapering*). La stima è una spezzata: niente salti, ma spigoli.`
    case STEP.epan:
      return String.raw`La finestra di Epanechnikov (*Epanechnikov kernel*), citata nelle note senza formula: qui nella forma di letteratura $\gamma(u) = \frac34(1 - u^2)$ per $|u| \le 1$. Minimizza l'errore quadratico medio integrato (*mean integrated squared error*). Archi di parabola.`
    case STEP.gauss:
      return String.raw`La finestra gaussiana (*Gaussian window*): una somma di gaussiane (*summation of gaussians*), liscia e derivabile, senza spigoli né discontinuità (*sharp edges and discontinuities*). Ogni lettura contribuisce ovunque, sempre meno man mano che ci si allontana.`
    case STEP.riempito:
      return String.raw`Nel buco di prima, in $x = ${c.x}$, le code delle due letture vicine riempiono la stima: $\hat p = ${c.p}$ invece di ${c.pRect}. È l'**interpolazione**: «*each sample contributing to the estimate in accordance with its distance from x*».`
    default:
      return String.raw`La tabella mette a confronto i pesi $\gamma((x - x_k)/h)$ delle tre letture per i quattro kernel. Il rettangolo chiede "sei dentro o fuori?", i kernel lisci chiedono "quanto sei vicino?". Ora il kernel è quello del selettore (${c.kernel}): prova a cambiarlo, e cambia $h$.`
  }
}

export const TEX_LIVE = String.raw`\begin{aligned}\hat{p}(x)&=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h}\gamma\left(\frac{x-x_k}{h}\right)\\ \hat p(\val{x})&=\frac{1}{\val[0]{N}\cdot\val{h}}\Big[\gamma(\val{u1})+\gamma(\val{u2})+\gamma(\val{u3})\Big]\\ &=\frac{\val[3]{g1}+\val[3]{g2}+\val[3]{g3}}{\val{Nh}}=\val[3]{p}\end{aligned}`
export const TEX_EPAN = String.raw`\gamma(u)=\tfrac{3}{4}(1-u^2)\ \text{per } |u|\le 1\quad \text{(Epanechnikov, forma di letteratura)}`

export const CHALLENGE_PROMPT = String.raw`Con il kernel gaussiano e $h = 1$, stima a occhio quale delle tre letture dell'inventario (3.2, 4.1 e 6.0 °C) **pesa di più** nel punto $x = 5$ °C e quanto vale il suo peso $\gamma((5 - x_k)/h)$; poi stima $\hat p(5)$. Tolleranza: due centesimi.`
export const CHALLENGE_HINT = String.raw`Il peso gaussiano dipende solo dalla distanza: $\gamma(u) = \frac{1}{\sqrt{2\pi}}e^{-u^2/2}$ con $u = 5 - x_k$. La lettura più vicina a 5 vince. Porta la sonda a 5 °C e leggi la tabella dei pesi.`
