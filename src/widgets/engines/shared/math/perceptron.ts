// Perceptron in n dimensioni (classifier2d nel piano, twoclass1d sull'asse con il learner a epoche, p06 domani).
// Vettore aumentato x̃ = (1, x₁, …, x_n) e pesi a = (a₀, a₁, …, a_n): si decide ω₊ se aᵗx̃ > 0, ω₋ altrimenti.
// - regola a campione singolo: se y·aᵗx̃ ≤ 0 (sbagliato, o sul confine) allora a ← a + η y x̃
// - passo batch (discesa del gradiente sul criterio del perceptron J_p(a) = Σ_{sbagliati} −y aᵗx̃):
//   a ← a + η Σ_{sbagliati} y x̃
// Converge in un numero finito di aggiornamenti se le classi sono linearmente separabili; altrimenti si ferma
// a maxEpochs. Lo stato è immutabile: ogni passo restituisce uno stato nuovo, così lo storyboard può tornare indietro.
import type { LabeledPoint } from '../../../../lib/ml/nonparam'
import type { Vec } from './types'

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)

export interface SignedPoint {
  x: Vec
  y: 1 | -1
}

/** Etichette ±1: la classe `positive` diventa +1, tutte le altre −1. */
export const toSigned = (data: readonly LabeledPoint[], positive: number): SignedPoint[] => data.map((d) => ({ x: d.x, y: d.y === positive ? 1 : -1 }))

/** aᵗx̃ = a₀ + Σ a_j x_j. */
export function perceptronValue(a: readonly number[], x: Vec): number {
  if (a.length !== x.length + 1) throw err('perceptronValue', `pesi a ${a.length} componenti per un punto a ${x.length} (servono n + 1)`)
  let s = a[0]
  for (let j = 0; j < x.length; j++) s += a[j + 1] * x[j]
  return s
}

/** +1 se aᵗx̃ > 0, −1 altrimenti (sul confine: −1). */
export const perceptronPredict = (a: readonly number[], x: Vec): 1 | -1 => (perceptronValue(a, x) > 0 ? 1 : -1)

/** Criterio del perceptron J_p(a) = Σ_{y·aᵗx̃ ≤ 0} −y aᵗx̃ ≥ 0: nullo quando nessun campione è dalla parte sbagliata. */
export function perceptronCriterion(a: readonly number[], data: readonly SignedPoint[]): number {
  let J = 0
  for (const d of data) {
    const v = d.y * perceptronValue(a, d.x)
    if (v <= 0) J -= v
  }
  return J === 0 ? 0 : J
}

export interface PerceptronState {
  a: number[]
  /** prossimo campione da visitare */
  index: number
  /** epoche completate */
  epoch: number
  updates: number
  /** errori nell'epoca in corso */
  mistakes: number
  /** campioni consecutivi già classificati bene */
  clean: number
  /** un intero passaggio senza errori */
  converged: boolean
}

/** Stato iniziale: pesi dati o tutti a zero, in dimensione n (a ha n + 1 componenti). */
export function perceptronInit(dim: number, a0?: readonly number[]): PerceptronState {
  const a = a0 ? [...a0] : new Array<number>(dim + 1).fill(0)
  if (a.length !== dim + 1) throw err('perceptronInit', `servono ${dim + 1} pesi, ricevuti ${a.length}`)
  return { a, index: 0, epoch: 0, updates: 0, mistakes: 0, clean: 0, converged: false }
}

/** Un passo della regola a campione singolo sul campione `state.index` (nell'ordine dei dati, ciclico). */
export function perceptronStep(state: PerceptronState, data: readonly SignedPoint[], eta = 1): { state: PerceptronState; sample: number; wasWrong: boolean } {
  if (data.length === 0) throw err('perceptronStep', 'nessun campione')
  const i = state.index % data.length
  const d = data[i]
  const wasWrong = d.y * perceptronValue(state.a, d.x) <= 0
  const a = wasWrong ? state.a.map((w, j) => w + eta * d.y * (j === 0 ? 1 : d.x[j - 1])) : state.a
  const clean = wasWrong ? 0 : state.clean + 1
  const next = i + 1
  const endOfEpoch = next === data.length
  const mistakes = state.mistakes + (wasWrong ? 1 : 0)
  return {
    sample: i,
    wasWrong,
    state: {
      a,
      index: endOfEpoch ? 0 : next,
      epoch: state.epoch + (endOfEpoch ? 1 : 0),
      updates: state.updates + (wasWrong ? 1 : 0),
      mistakes: endOfEpoch ? 0 : mistakes,
      clean,
      converged: clean >= data.length,
    },
  }
}

/** Un passo batch: a + η Σ_{sbagliati} y x̃, con gli indici dei campioni sbagliati prima del passo. */
export function perceptronBatchStep(a: readonly number[], data: readonly SignedPoint[], eta = 1): { a: number[]; misclassified: number[] } {
  const misclassified: number[] = []
  const next = [...a]
  data.forEach((d, i) => {
    if (d.y * perceptronValue(a, d.x) <= 0) {
      misclassified.push(i)
      next[0] += eta * d.y
      for (let j = 0; j < d.x.length; j++) next[j + 1] += eta * d.y * d.x[j]
    }
  })
  return { a: next, misclassified }
}

export interface PerceptronRun {
  a: number[]
  epochs: number
  updates: number
  converged: boolean
  /** pesi iniziali e dopo ogni aggiornamento: la retta che salta */
  history: number[][]
  /** errori commessi in ogni epoca */
  errorsPerEpoch: number[]
}

/** Addestramento completo con la regola a campione singolo, fino a un passaggio pulito o a maxEpochs. */
export function perceptronTrain(data: readonly SignedPoint[], options: { eta?: number; maxEpochs?: number; a0?: readonly number[] } = {}): PerceptronRun {
  if (data.length === 0) throw err('perceptronTrain', 'nessun campione')
  const eta = options.eta ?? 1
  const maxEpochs = options.maxEpochs ?? 100
  let s = perceptronInit(data[0].x.length, options.a0)
  const history = [s.a]
  const errorsPerEpoch: number[] = []
  let mistakes = 0
  while (!s.converged && s.epoch < maxEpochs) {
    const r = perceptronStep(s, data, eta)
    if (r.wasWrong) {
      history.push(r.state.a)
      mistakes++
    }
    if (r.state.epoch !== s.epoch) {
      errorsPerEpoch.push(mistakes)
      mistakes = 0
    }
    s = r.state
  }
  if (s.converged && s.index !== 0) errorsPerEpoch.push(mistakes)
  return { a: s.a, epochs: s.epoch, updates: s.updates, converged: s.converged, history, errorsPerEpoch }
}
