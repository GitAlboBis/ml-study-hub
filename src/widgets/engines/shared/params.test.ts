import { describe, expect, it } from 'vitest'
import { formatParam, nearestParamIndex, niceLogSteps, paramProblems, paramValues, snapParam } from './params'
import type { ParamSpec } from './types'

const spec = (over: Partial<ParamSpec>): ParamSpec => ({ id: 'p', label: 'Parametro $p$', min: 0, max: 1, initial: 0.5, ...over })

describe('niceLogSteps', () => {
  it('valori tondi fra gli estremi, estremi compresi (come h in density1d)', () => {
    const hs = niceLogSteps(0.05, 3)
    expect(hs[0]).toBe(0.05)
    expect(hs.at(-1)).toBe(3)
    for (const v of [0.1, 0.15, 0.5, 1, 1.5, 2.5]) expect(hs).toContain(v)
    // crescente, passi di al più il 25%
    for (let i = 1; i < hs.length; i++) {
      expect(hs[i]).toBeGreaterThan(hs[i - 1])
      expect(hs[i] / hs[i - 1]).toBeLessThanOrEqual(1.26)
    }
  })

  it('rifiuta estremi non validi', () => {
    expect(() => niceLogSteps(0, 1)).toThrow(RangeError)
    expect(() => niceLogSteps(2, 1)).toThrow(RangeError)
    expect(niceLogSteps(4, 4)).toEqual([4])
  })
})

describe('paramValues', () => {
  it('scala logaritmica: valori tondi più gli agganci e il valore iniziale', () => {
    const vs = paramValues(spec({ scale: 'log', min: 0.05, max: 3, initial: 0.37, snaps: [0.33] }))
    expect(vs).toContain(0.37)
    expect(vs).toContain(0.33)
    expect(vs).toEqual([...vs].sort((a, b) => a - b))
    expect(new Set(vs).size).toBe(vs.length)
  })

  it('scala logaritmica con step: solo multipli del passo (N intero da 2 a 5000)', () => {
    const vs = paramValues(spec({ scale: 'log', min: 2, max: 5000, initial: 12, step: 1 }))
    expect(vs.every(Number.isInteger)).toBe(true)
    expect(vs[0]).toBe(2)
    expect(vs.at(-1)).toBe(5000)
    for (const v of [10, 12, 100, 1000]) expect(vs).toContain(v)
    expect(new Set(vs).size).toBe(vs.length)
  })

  it('scala intera: tutti gli interi con il passo, a partire dal minimo', () => {
    expect(paramValues(spec({ scale: 'int', min: 1, max: 9, initial: 3, step: 2 }))).toEqual([1, 3, 5, 7, 9])
    expect(paramValues(spec({ scale: 'int', min: 1, max: 5, initial: 2 }))).toEqual([1, 2, 3, 4, 5])
  })

  it('scala lineare: la griglia del passo senza rumore in virgola mobile, più gli agganci della slide', () => {
    const vs = paramValues(spec({ min: 0, max: 1, step: 0.1, initial: 0.3, snaps: [0.37] }))
    expect(vs).toEqual([0, 0.1, 0.2, 0.3, 0.37, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
  })

  it('scala lineare senza passo: un centesimo dell\'intervallo, arrotondato a 1, 2 o 5', () => {
    const vs = paramValues(spec({ min: 0, max: 10, initial: 5 }))
    expect(vs[1]).toBe(0.1)
    expect(vs.at(-1)).toBe(10)
    expect(vs).toHaveLength(101)
  })

  it('il massimo entra sempre, anche se non cade sulla griglia', () => {
    expect(paramValues(spec({ min: 0, max: 1, step: 0.3, initial: 0 }))).toEqual([0, 0.3, 0.6, 0.9, 1])
  })
})

describe('snapParam e nearestParamIndex', () => {
  it('il valore dell\'elenco più vicino, in scala logaritmica per la scala log', () => {
    const s = spec({ scale: 'log', min: 1, max: 100, initial: 10 })
    const vs = paramValues(s)
    expect(snapParam(s, 9.9)).toBe(10)
    expect(vs[nearestParamIndex(s, vs, 1000)]).toBe(100)
    expect(snapParam(spec({ min: 0, max: 1, step: 0.25, initial: 0 }), 0.6)).toBe(0.5)
  })
})

describe('formatParam', () => {
  it('decimali fissi dal passo in scala lineare, nessuno per gli interi', () => {
    expect(formatParam(spec({ step: 0.05 }), 0.5)).toBe('0.50')
    expect(formatParam(spec({ scale: 'int', min: 1, max: 10, initial: 1 }), 7)).toBe('7')
  })
  it('scala log: come h di density1d sotto 10 (0.05, 0.50, 3.00), interi senza decimali sopra', () => {
    const s = spec({ scale: 'log', min: 0.05, max: 300, initial: 1 })
    expect(formatParam(s, 0.05)).toBe('0.05')
    expect(formatParam(s, 0.5)).toBe('0.50')
    expect(formatParam(s, 3)).toBe('3.00')
    expect(formatParam(s, 250)).toBe('250')
    expect(formatParam(spec({ scale: 'log', min: 2, max: 5000, step: 1, initial: 2 }), 12)).toBe('12')
  })
  it('i decimali del valore iniziale contano come quelli degli agganci: la formula mostra il numero del calcolo', () => {
    // 0.25 entra nell'elenco dei valori (paramValues) e va scritto 0.25, non 0.3
    const lin = spec({ min: 0, max: 10, step: 0.5, initial: 0.25 })
    expect(paramValues(lin)).toContain(0.25)
    expect(formatParam(lin, 0.25)).toBe('0.25')
    expect(formatParam(lin, 3)).toBe('3.00')
    // lo stesso in scala log con passo
    const log = spec({ scale: 'log', min: 0.5, max: 50, step: 0.5, initial: 0.75 })
    expect(paramValues(log)).toContain(0.75)
    expect(formatParam(log, 0.75)).toBe('0.75')
    // sempre al più 4 decimali
    expect(formatParam(spec({ min: 0, max: 1, step: 0.1, initial: 0.1234567 }), 0.1234567)).toBe('0.1235')
  })
})

describe('paramProblems', () => {
  it('un parametro sano non ha problemi', () => {
    expect(paramProblems(spec({ step: 0.1 }))).toEqual([])
  })
  it('valore iniziale fuori intervallo, estremi rovesciati, log con minimo non positivo, agganci fuori', () => {
    expect(paramProblems(spec({ initial: 2 })).join(' ')).toMatch(/iniziale/)
    expect(paramProblems(spec({ min: 1, max: 0, initial: 0.5 })).join(' ')).toMatch(/min/)
    expect(paramProblems(spec({ scale: 'log', min: 0, max: 1, initial: 0.5 })).join(' ')).toMatch(/log/)
    expect(paramProblems(spec({ snaps: [1.5] })).join(' ')).toMatch(/aggancio/)
    expect(paramProblems(spec({ scale: 'int', min: 0, max: 10, initial: 2.5 })).join(' ')).toMatch(/interi/)
    expect(paramProblems(spec({ step: 0 })).join(' ')).toMatch(/passo/)
  })
})
