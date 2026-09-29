import { describe, expect, it } from 'vitest'
import { arcPath, arcPoint, meterPosition } from './meters'

describe('meterPosition', () => {
  it('scala lineare: frazione, fondo scala oltre gli estremi', () => {
    expect(meterPosition(5, 0, 10)).toEqual({ t: 0.5, over: false, under: false })
    expect(meterPosition(12, 0, 10)).toEqual({ t: 1, over: true, under: false })
    expect(meterPosition(-1, 0, 10)).toEqual({ t: 0, over: false, under: true })
  })
  it('scala logaritmica: 10 a metà fra 1 e 100; i non positivi vanno a zero', () => {
    expect(meterPosition(10, 1, 100, true).t).toBeCloseTo(0.5, 12)
    expect(meterPosition(0, 1, 100, true)).toEqual({ t: 0, over: false, under: true })
  })
  it('valori o scale non validi: t non è un numero', () => {
    expect(Number.isNaN(meterPosition(Number.NaN, 0, 1).t)).toBe(true)
    expect(Number.isNaN(meterPosition(1, 2, 1).t)).toBe(true)
    expect(Number.isNaN(meterPosition(1, 0, 10, true).t)).toBe(true)
  })
})

describe('arco del quadrante', () => {
  it('estremi a sinistra e a destra, metà in alto', () => {
    expect(arcPoint(100, 100, 80, 0)).toEqual([20, 100])
    expect(arcPoint(100, 100, 80, 1)).toEqual([180, 100])
    expect(arcPoint(100, 100, 80, 0.5)).toEqual([100, 20])
  })
  it('arco in senso orario fra due frazioni; vuoto se nullo', () => {
    expect(arcPath(100, 100, 80, 0, 0.5)).toBe('M20,100A80,80 0 0 1 100,20')
    expect(arcPath(100, 100, 80, 0.3, 0.3)).toBe('')
  })
})
