import { describe, expect, it } from 'vitest'
import { trapz } from '../../lib/ml/stats'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  FACTOR,
  GRID,
  H0,
  N0,
  N_STEPS,
  SEED0,
  STEPS,
  TEX_EST,
  TEX_LIVE,
  TRUTH_ON_GRID,
  captionFor,
  drawSamples,
  estimateOnGrid,
  holes,
  iseCurve,
  iseOf,
  judge,
  searchAt,
  slope,
} from './piu-campioni'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'

describe('piu-campioni: dati e stima', () => {
  it('la densità vera ha area 1 e i due modi a 0.35 e 1.4 kWh', () => {
    // un filo della coda sotto 0 kWh resta fuori dal dominio
    expect(trapz(GRID, TRUTH_ON_GRID)).toBeCloseTo(1, 2)
    const at = (x: number) => TRUTH_ON_GRID[Math.round((x / 2.5) * 1000)]
    expect(at(0.35)).toBeGreaterThan(at(0.8))
    expect(at(1.4)).toBeGreaterThan(at(0.8))
  })

  it('N va da 10 a 5000 su valori tondi; aumentare N aggiunge ore senza rimescolare', () => {
    expect(N_STEPS[0]).toBe(10)
    expect(N_STEPS.at(-1)).toBe(5000)
    expect(drawSamples(SEED0, 50).slice(0, 20)).toEqual(drawSamples(SEED0, 20))
  })

  it('con N = 20 e h = 0.03 la stima ha buchi dove i consumi ci sono', () => {
    expect(holes(estimateOnGrid(drawSamples(SEED0, N0), H0)).length).toBeGreaterThan(0)
  })
})

describe('piu-campioni: h* cala con N', () => {
  const points = [20, 200, 2000].map((n) => [n, iseCurve(drawSamples(SEED0, n)).hStar] as const)

  it('il minimo si sposta a sinistra a ogni aumento di N', () => {
    expect(points[1][1]).toBeLessThan(points[0][1])
    expect(points[2][1]).toBeLessThan(points[1][1])
  })

  it('in log-log la pendenza è negativa, vicina a −1/5', () => {
    const s = slope(points)
    expect(s).toBeLessThan(-0.1)
    expect(s).toBeGreaterThan(-0.4)
  })

  it('il minimo raffinato non è peggiore del miglior h dello slider', () => {
    const s = drawSamples(SEED0, 50)
    const c = iseCurve(s)
    expect(c.iseStar).toBeLessThanOrEqual(Math.min(...c.ise) + 1e-12)
    expect(iseOf(estimateOnGrid(s, c.hStar))).toBeCloseTo(c.iseStar, 10)
  })

  it('"Trova h*" parte da h = 0.01 e arriva a h*', () => {
    const c = iseCurve(drawSamples(SEED0, N0))
    expect(searchAt(0, c)).toBeCloseTo(0.01, 12)
    expect(searchAt(1, c)).toBeCloseTo(c.hStar, 12)
  })
})

describe('piu-campioni: sfida e testi', () => {
  it('annotando gli h* e il fattore 0.63 la sfida è superata; senza annotazioni no', () => {
    const notes = Object.fromEntries([50, 500, 5000].map((n) => [n, iseCurve(drawSamples(SEED0, n)).best]))
    const v = judge(SEED0, notes, 0.63)
    expect(v.rows.every((r) => r.ok)).toBe(true)
    expect(v.ok).toBe(true)
    expect(judge(SEED0, {}, 0.63).ok).toBe(false)
    expect(judge(SEED0, notes, 0.2).ok).toBe(false)
    expect(FACTOR).toBeCloseTo(0.631, 3)
  })

  it('formule e didascalie compilano', () => {
    expectTexCompiles(TEX_EST)
    expectTexCompiles(TEX_LIVE)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { N: 20, h: '0.030', hStar: '0.121', holes: 4 }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
  })
})
