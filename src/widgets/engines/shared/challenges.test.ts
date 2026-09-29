import { describe, expect, it } from 'vitest'
import { challengeProblems, evaluateChallenge, isCommonChallenge, predictPoints } from './challenges'
import { sortOutcome } from './dragKeyboard'
import type { CommonChallenge } from './types'

interface S {
  h: number
  errors: number
  peak: number
  probe: readonly [number, number]
}
const s: S = { h: 0.5, errors: 7, peak: 4.2, probe: [1, 2] }

describe('evaluateChallenge: custom e find', () => {
  it('custom: decide check', () => {
    const ch: CommonChallenge<S> = { kind: 'custom', prompt: 'p', check: (x) => x.errors < 5 }
    expect(evaluateChallenge(ch, s)).toEqual({ kind: 'custom', passed: false })
    expect(evaluateChallenge(ch, { ...s, errors: 2 }).passed).toBe(true)
  })

  it('find: superata quando |score − target| ≤ tolleranza, con lo scarto', () => {
    const ch: CommonChallenge<S> = { kind: 'find', prompt: 'p', score: (x) => x.errors, target: () => 3, tolerance: 1 }
    const o = evaluateChallenge(ch, s)
    expect(o).toMatchObject({ kind: 'find', passed: false, score: 7, target: 3, gap: 4 })
    expect(evaluateChallenge(ch, { ...s, errors: 4 }).passed).toBe(true)
    expect(evaluateChallenge(ch, { ...s, errors: Number.NaN }).passed).toBe(false)
  })
})

describe('evaluateChallenge: predict', () => {
  const num: CommonChallenge<S> = { kind: 'predict', prompt: 'p', input: 'number', truth: (x) => x.peak, tolerance: 0.2, points: 'distance' }
  it('senza risposta non è superata e lo dice', () => {
    expect(evaluateChallenge(num, s)).toMatchObject({ kind: 'predict', passed: false, answered: false })
  })
  it('numero: distanza dalla verità entro la tolleranza, punti che scendono con lo scarto', () => {
    expect(evaluateChallenge(num, s, { kind: 'number', value: 4.3 })).toMatchObject({ passed: true, points: 1 })
    const far = evaluateChallenge(num, s, { kind: 'number', value: 4.6 })
    expect(far).toMatchObject({ passed: false, answered: true })
    if (far.kind === 'predict') {
      expect(far.distance).toBeCloseTo(0.4, 10)
      expect(far.points).toBeCloseTo(0.5, 10)
    }
  })
  it('clic nel piano: distanza euclidea', () => {
    const xy: CommonChallenge<S> = { kind: 'predict', prompt: 'p', input: 'click-xy', truth: (x) => x.probe, tolerance: 0.5 }
    const o = evaluateChallenge(xy, s, { kind: 'point', value: [1.3, 2.4] })
    expect(o.passed).toBe(true)
    if (o.kind === 'predict') expect(o.distance).toBeCloseTo(0.5, 10)
    expect(evaluateChallenge(xy, s, { kind: 'point', value: [2, 2] }).passed).toBe(false)
  })
  it('opzioni: la stessa opzione', () => {
    const opt: CommonChallenge<S> = { kind: 'predict', prompt: 'p', input: { options: ['PCA', 'LDA'] }, truth: () => 1, tolerance: 0 }
    expect(evaluateChallenge(opt, s, { kind: 'option', index: 1 }).passed).toBe(true)
    expect(evaluateChallenge(opt, s, { kind: 'option', index: 0 }).passed).toBe(false)
  })
  it('punti: pieni entro la tolleranza, zero a tre tolleranze, "exact" giusto o sbagliato', () => {
    expect(predictPoints(0.1, 0.2, 'distance')).toBe(1)
    expect(predictPoints(0.6, 0.2, 'distance')).toBe(0)
    expect(predictPoints(0.3, 0.2, 'exact')).toBe(0)
    expect(predictPoints(0.2, 0.2, 'exact')).toBe(1)
  })
})

describe('evaluateChallenge: sort e compute', () => {
  const sort: CommonChallenge<S> = {
    kind: 'sort',
    prompt: 'p',
    items: [
      { id: 'knn', label: 'K-NN' },
      { id: 'parzen', label: 'Parzen' },
      { id: 'gauss', label: 'Gaussiana' },
    ],
    bins: [
      { id: 'np', label: 'Non parametrico' },
      { id: 'p', label: 'Parametrico' },
    ],
    answer: { knn: 'np', parzen: 'np', gauss: 'p' },
  }
  it('sort: ogni chip nel suo contenitore; elenca quelli sbagliati e quelli mancanti', () => {
    expect(evaluateChallenge(sort, s, { kind: 'placement', bins: { knn: 'np', parzen: 'np', gauss: 'p' } }).passed).toBe(true)
    expect(evaluateChallenge(sort, s, { kind: 'placement', bins: { knn: 'p', parzen: 'np' } })).toMatchObject({ passed: false, wrong: ['knn'], missing: ['gauss'], placed: 2 })
  })
  it('sort: lo decide sortOutcome di DragBins, e un chip tornato nel vassoio (null) manca, non è sbagliato', () => {
    const bins = { knn: 'np', parzen: null, gauss: 'np' }
    const o = evaluateChallenge(sort, s, { kind: 'placement', bins })
    expect(o).toMatchObject({ passed: false, wrong: ['gauss'], missing: ['parzen'], placed: 2 })
    const so = sortOutcome(bins, sort.kind === 'sort' ? sort.items.map((i) => i.id) : [], sort.kind === 'sort' ? sort.answer : {})
    expect(o.kind === 'sort' && o.wrong).toEqual(so.wrong)
    expect(o.kind === 'sort' && o.missing).toEqual(so.missing)
  })
  it('compute: entro la tolleranza, altrimenti dice se è troppo alta o troppo bassa', () => {
    const c: CommonChallenge<S> = { kind: 'compute', prompt: 'p', answer: (x) => 1 / x.h, tolerance: 0.01 }
    expect(evaluateChallenge(c, s, { kind: 'number', value: 2 })).toMatchObject({ passed: true, expected: 2, direction: 'ok' })
    expect(evaluateChallenge(c, s, { kind: 'number', value: 2.5 })).toMatchObject({ passed: false, direction: 'high' })
    expect(evaluateChallenge(c, s, { kind: 'number', value: 1 })).toMatchObject({ passed: false, direction: 'low' })
    expect(evaluateChallenge(c, s)).toMatchObject({ passed: false, answered: false })
  })
})

describe('isCommonChallenge e challengeProblems', () => {
  it('riconosce le sfide comuni fra quelle di un motore', () => {
    expect(isCommonChallenge({ kind: 'find' })).toBe(true)
    expect(isCommonChallenge({ kind: 'min-ise' })).toBe(false)
  })
  it('una sfida superata dallo stato iniziale è un problema', () => {
    const ch: CommonChallenge<S> = { kind: 'custom', prompt: 'p', check: () => true }
    expect(challengeProblems(ch, s).join(' ')).toMatch(/stato iniziale/)
    const find: CommonChallenge<S> = { kind: 'find', prompt: 'p', score: (x) => x.errors, target: () => 7, tolerance: 0 }
    expect(challengeProblems(find, s).join(' ')).toMatch(/stato iniziale/)
  })
  it('predict a opzioni con una verità fuori dalle opzioni, sort incompleto, compute non finito', () => {
    expect(challengeProblems({ kind: 'predict', prompt: 'p', input: { options: ['a', 'b'] }, truth: () => 2, tolerance: 0 }, s).join(' ')).toMatch(/opzion/)
    expect(
      challengeProblems({ kind: 'sort', prompt: 'p', items: [{ id: 'a', label: 'A' }], bins: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }], answer: { a: 'z' } }, s).join(' '),
    ).toMatch(/contenitore/)
    expect(challengeProblems({ kind: 'compute', prompt: 'p', answer: () => Number.NaN, tolerance: 0.1 }, s).join(' ')).toMatch(/finit/)
  })
  it('una sfida sana non ha problemi; senza stato iniziale custom e find non si possono controllare', () => {
    const find: CommonChallenge<S> = { kind: 'find', prompt: 'p', score: (x) => x.errors, target: () => 2, tolerance: 1 }
    expect(challengeProblems(find, s)).toEqual([])
    expect(challengeProblems(find, undefined).join(' ')).toMatch(/stato iniziale/)
  })
})
