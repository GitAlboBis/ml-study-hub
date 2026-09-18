// Logica del widget m09-pnn-rete-probabilistica ("Probabilistic Neural Network: Parzen disegnato come rete"),
// concetti c65 e c66. Slide p65: il metodo di Specht si implementa con le Probabilistic Neural Networks. La fonte
// non descrive l'architettura: qui quella classica di Specht (1990), un approfondimento dichiarato: strato di
// ingresso (le feature), strato dei pattern (un neurone per campione di training, che calcola il kernel
// gaussiano exp(−‖x − x_k‖²/(2σ²))), strato di somma (un neurone per classe: la stima di Parzen p̂(x|ω_i)),
// strato di decisione (regola di Bayes, argmax P(ω_i)·p̂(x|ω_i)). Nessun peso da addestrare: si memorizzano i campioni.
// Scenario: salmone contro spigola, due feature normalizzate (luminosità, larghezza), 20 pesci per classe.
import { createRng } from '../../lib/rng'
import { adaptiveSigmas } from '../../lib/ml/nonparam'
import { niceLogSteps } from '../engines/density1d'

export type Pt = readonly [number, number]
export type Shape = 'gauss' | 'gruppi' | 'banana'
export const SHAPES: Record<Shape, string> = { gauss: 'nuvola gaussiana', gruppi: 'due gruppi separati', banana: 'nuvola a banana' }

export const DOMAIN: readonly [number, number] = [-2.6, 2.6]
export const PER_CLASS = 20
export const SIGMA_STEPS = niceLogSteps(0.05, 2)
export const INITIAL = { sigma: 0.4, prior: 0.5, test: [0.1, 0.1] as Pt }
export const PRIOR = { min: 0.1, max: 0.9, step: 0.05 } as const
export const ADAPTIVE_L = 3
export const PHASE_MS = 600

/** Un pesce di una classe (0 = salmone, 1 = spigola) con la forma scelta per la spigola. */
function draw(rng: ReturnType<typeof createRng>, cls: 0 | 1, shape: Shape): Pt {
  const r2 = (v: number) => Number(v.toFixed(3))
  if (cls === 0) return [r2(rng.normal(0, 0.45)), r2(rng.normal(-0.2, 0.42))]
  if (shape === 'gauss') return [r2(rng.normal(1, 0.5)), r2(rng.normal(0.9, 0.5))]
  // due gruppi ai lati dei salmoni: la media delle spigole cade sui salmoni
  if (shape === 'gruppi') return rng.next() < 0.5 ? [r2(rng.normal(1.45, 0.32)), r2(rng.normal(-0.1, 0.32))] : [r2(rng.normal(-1.45, 0.32)), r2(rng.normal(0.2, 0.32))]
  // arco che avvolge i salmoni dall'alto, da un fianco all'altro
  const t = -0.25 * Math.PI + rng.next() * 1.5 * Math.PI
  const r = 1.45 + rng.normal(0, 0.18)
  return [r2(r * Math.cos(t)), r2(-0.2 + r * Math.sin(t))]
}

export interface Training {
  pts: Pt[]
  cls: (0 | 1)[]
}

/** 20 salmoni e 20 spigole di training (a seme); i salmoni sono gli stessi per ogni forma. */
export function training(shape: Shape, seed = 11): Training {
  const a = createRng(seed)
  const b = createRng(seed * 31 + (shape === 'gauss' ? 1 : shape === 'gruppi' ? 2 : 3))
  const pts: Pt[] = [...Array.from({ length: PER_CLASS }, () => draw(a, 0, shape)), ...Array.from({ length: PER_CLASS }, () => draw(b, 1, shape))]
  return { pts, cls: [...new Array<0>(PER_CLASS).fill(0), ...new Array<1>(PER_CLASS).fill(1)] }
}

/** Il validation set nascosto della sfida: 10 + 10 pesci, altri semi. */
export function validation(shape: Shape): Training {
  const a = createRng(9001)
  const b = createRng(9002 + (shape === 'gauss' ? 1 : shape === 'gruppi' ? 2 : 3))
  return { pts: [...Array.from({ length: 10 }, () => draw(a, 0, shape)), ...Array.from({ length: 10 }, () => draw(b, 1, shape))], cls: [...new Array<0>(10).fill(0), ...new Array<1>(10).fill(1)] }
}

/** σ di ogni neurone: una sola, oppure σ_k adattiva dagli L vicini della stessa classe. */
export function neuronSigmas(t: Training, sigma: number, adaptive: boolean): number[] {
  if (!adaptive) return t.pts.map(() => sigma)
  const out = new Array<number>(t.pts.length)
  for (const c of [0, 1] as const) {
    const idx = t.cls.map((k, i) => (k === c ? i : -1)).filter((i) => i >= 0)
    const s = adaptiveSigmas(idx.map((i) => t.pts[i]), ADAPTIVE_L)
    idx.forEach((i, j) => (out[i] = Math.max(s[j], 1e-3)))
  }
  return out
}

export interface Forward {
  /** attivazione di ogni neurone del pattern: exp(−‖x − x_k‖²/(2σ_k²)) */
  act: number[]
  /** p̂(x|ω_i): media dei kernel normalizzati della classe */
  dens: [number, number]
  /** P(ω_i)·p̂(x|ω_i) */
  joint: [number, number]
  decision: 0 | 1
}

/** Una propagazione in avanti della rete per il punto x. */
export function forward(x: Pt, t: Training, sigmas: readonly number[], prior: number): Forward {
  const act = t.pts.map((p, k) => Math.exp(-((x[0] - p[0]) ** 2 + (x[1] - p[1]) ** 2) / (2 * sigmas[k] ** 2)))
  const sum: [number, number] = [0, 0]
  const cnt: [number, number] = [0, 0]
  act.forEach((a, k) => {
    const c = t.cls[k]
    sum[c] += a / (2 * Math.PI * sigmas[k] ** 2)
    cnt[c]++
  })
  const dens: [number, number] = [sum[0] / Math.max(1, cnt[0]), sum[1] / Math.max(1, cnt[1])]
  const joint: [number, number] = [prior * dens[0], (1 - prior) * dens[1]]
  return { act, dens, joint, decision: joint[0] >= joint[1] ? 0 : 1 }
}

export function accuracy(v: Training, t: Training, sigma: number, prior = 0.5, adaptive = false): number {
  const s = neuronSigmas(t, sigma, adaptive)
  return v.pts.reduce((acc, p, i) => acc + (forward(p, t, s, prior).decision === v.cls[i] ? 1 : 0), 0) / v.pts.length
}

/** La σ della sfida: la più grande dello slider fra quelle con l'accuratezza massima sul validation set. */
export function targetSigma(shape: Shape): { sigma: number; acc: number } {
  const t = training(shape)
  const v = validation(shape)
  const accs = SIGMA_STEPS.map((s) => accuracy(v, t, s))
  const best = Math.max(...accs)
  let sigma = SIGMA_STEPS[0]
  SIGMA_STEPS.forEach((s, i) => {
    if (accs[i] === best) sigma = s
  })
  return { sigma, acc: best }
}
