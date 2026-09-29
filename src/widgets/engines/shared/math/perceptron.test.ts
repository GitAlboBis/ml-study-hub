import { describe, expect, it } from 'vitest'
import { createRng } from '../../../../lib/rng'
import {
  perceptronBatchStep, perceptronCriterion, perceptronInit, perceptronPredict, perceptronStep, perceptronTrain, perceptronValue, toSigned,
} from './perceptron'

describe('perceptron (regola a campione singolo)', () => {
  it('esempio a mano in 1-D: un aggiornamento, poi un passaggio pulito', () => {
    const data = [
      { x: [2], y: 1 as const },
      { x: [-1], y: -1 as const },
    ]
    let s = perceptronInit(1)
    expect(s.a).toEqual([0, 0])
    const r1 = perceptronStep(s, data, 1)
    expect(r1.sample).toBe(0)
    expect(r1.wasWrong).toBe(true)
    expect(r1.state.a).toEqual([1, 2])
    s = r1.state
    const r2 = perceptronStep(s, data, 1)
    expect(r2.wasWrong).toBe(false)
    const r3 = perceptronStep(r2.state, data, 1)
    expect(r3.state.converged).toBe(true)
    expect(r3.state.updates).toBe(1)
  })
  it('valore e segno: aᵗx̃ con x̃ = (1, x); sul confine conta come errore', () => {
    expect(perceptronValue([1, 2, -1], [3, 4])).toBe(3)
    expect(perceptronPredict([1, 2, -1], [3, 4])).toBe(1)
    expect(perceptronPredict([0, 0, 0], [3, 4])).toBe(-1)
  })
  it('dati separabili in 2-D: converge e classifica tutto; J_p = 0', () => {
    const rng = createRng(4)
    const data = Array.from({ length: 40 }, (_, i) => {
      const y = i % 2 === 0 ? 1 : -1
      return { x: [rng.normal(y * 2, 0.6), rng.normal(y * 1.5, 0.6)], y: y as 1 | -1 }
    })
    const r = perceptronTrain(data, { eta: 0.5, maxEpochs: 200 })
    expect(r.converged).toBe(true)
    for (const d of data) expect(perceptronPredict(r.a, d.x)).toBe(d.y)
    expect(perceptronCriterion(r.a, data)).toBe(0)
    expect(r.history.length).toBe(r.updates + 1)
    expect(r.errorsPerEpoch.at(-1)).toBe(0)
  })
  it('dati non separabili: si ferma a maxEpochs senza convergere', () => {
    const data = [
      { x: [0, 0], y: 1 as const },
      { x: [1, 1], y: 1 as const },
      { x: [0, 1], y: -1 as const },
      { x: [1, 0], y: -1 as const },
    ]
    const r = perceptronTrain(data, { maxEpochs: 30 })
    expect(r.converged).toBe(false)
    expect(r.epochs).toBe(30)
  })
  it('passo batch: a += η Σ_{sbagliati} y x̃ e il criterio scende', () => {
    const data = [
      { x: [1, 1], y: 1 as const },
      { x: [-1, -2], y: -1 as const },
    ]
    const r = perceptronBatchStep([0, 0, 0], data, 1)
    expect(r.misclassified).toEqual([0, 1])
    expect(r.a).toEqual([0, 2, 3])
    expect(perceptronCriterion([0, 0, 0], data)).toBe(0)
    expect(perceptronCriterion([0, -1, 0], data)).toBe(2)
  })
  it('toSigned: la classe positiva diventa +1, tutte le altre −1', () => {
    expect(toSigned([{ x: [0], y: 2 }, { x: [1], y: 0 }], 2).map((d) => d.y)).toEqual([1, -1])
  })
})
