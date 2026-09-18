import { describe, expect, it } from 'vitest'
import { linspace, trapz } from '../../lib/ml/stats'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  CLUSTER,
  GRID,
  HEALTHY,
  OUTLIER0,
  PATIENTS,
  STEPS,
  TEX_CONT,
  TEX_DECAY,
  TEX_LIVE,
  TEX_MAX,
  belowRuns,
  brokenOfStep,
  captionFor,
  conditionsOf,
  estimateAt,
  estimateOn,
  gammaOf,
  judge,
  localMinimaAt,
  outlierOfStep,
  samplesWith,
} from './condizioni'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'

const samples = samplesWith(OUTLIER0)

describe('condizioni: i dati', () => {
  it('30 letture attorno a 40 °C più una a 80 °C', () => {
    expect(CLUSTER).toHaveLength(30)
    const mean = CLUSTER.reduce((a, b) => a + b, 0) / 30
    expect(mean).toBeGreaterThan(38)
    expect(mean).toBeLessThan(42)
    expect(samples).toHaveLength(31)
  })
})

describe('condizioni: ogni guasto lascia una densità (area 1) ma rompe una condizione', () => {
  const us = linspace(-60, 60, 120001)
  it('i quattro kernel hanno area 1 (la coda del guasto 3 conta sull\'asse del grafico)', () => {
    for (const b of [HEALTHY, { ...HEALTHY, offCenter: true }, { ...HEALTHY, jumpy: true }]) expect(trapz(us, us.map((u) => gammaOf(u, b, 2))), JSON.stringify(b)).toBeCloseTo(1, 2)
    // guasto 3: l'area della stima sul dominio del grafico è 1
    const b3 = { ...HEALTHY, heavy: true }
    const xs = linspace(0, 100, 20001)
    expect(trapz(xs, estimateOn(xs, samples, 2, b3))).toBeCloseTo(1, 2)
  })

  it('le spie: sane tutte vere; ogni guasto spegne la sua', () => {
    expect(conditionsOf(HEALTHY, 2)).toEqual({ maxAtOrigin: true, continuous: true, decays: true })
    expect(conditionsOf({ ...HEALTHY, offCenter: true }, 2).maxAtOrigin).toBe(false)
    expect(conditionsOf({ ...HEALTHY, jumpy: true }, 2)).toEqual({ maxAtOrigin: true, continuous: false, decays: true })
    expect(conditionsOf({ ...HEALTHY, heavy: true }, 2)).toEqual({ maxAtOrigin: true, continuous: true, decays: false })
  })
})

describe('condizioni: gli artefatti descritti dall\'inventario', () => {
  it('guasto 1: sulla lettura isolata due gobbe (77 e 83 °C) e un minimo proprio a 80 °C', () => {
    const b = { ...HEALTHY, offCenter: true }
    const near = GRID.filter((x) => x >= 70 && x <= 90)
    const ys = estimateOn(near, samples, 2, b)
    const mins = localMinimaAt(near, ys)
    expect(mins.some((m) => Math.abs(m - 80) < 0.2)).toBe(true)
    expect(estimateAt(77, samples, 2, b)).toBeGreaterThan(estimateAt(80, samples, 2, b))
    expect(estimateAt(83, samples, 2, b)).toBeGreaterThan(estimateAt(80, samples, 2, b))
  })

  it('guasto 1: con h = 2 la collina dei dati non ha buchi, con h grande (5) compare un avvallamento a 40 °C', () => {
    const b = { ...HEALTHY, offCenter: true }
    const hill = GRID.filter((x) => x >= 30 && x <= 50)
    expect(localMinimaAt(hill, estimateOn(hill, samples, 2, b))).toHaveLength(0)
    expect(localMinimaAt(hill, estimateOn(hill, samples, 5, b)).some((m) => Math.abs(m - 40) < 3)).toBe(true)
  })

  it('guasto 3: densità anche a 5 °C (0.2/100) e la collina più bassa del 20% circa', () => {
    const b = { ...HEALTHY, heavy: true }
    expect(estimateAt(5, samples, 2, HEALTHY)).toBeLessThan(1e-12)
    expect(estimateAt(5, samples, 2, b)).toBeCloseTo(0.002, 6)
    const peak = Math.max(...estimateOn(GRID, samples, 2, HEALTHY))
    const peak3 = Math.max(...estimateOn(GRID, samples, 2, b))
    expect(peak3 / peak).toBeGreaterThan(0.79)
    expect(peak3 / peak).toBeLessThan(0.84)
  })

  it('le zone sotto soglia: con il gaussiano fra la collina e la lettura isolata c\'è una zona anomala', () => {
    const runs = belowRuns(GRID, estimateOn(GRID, samples, 2, HEALTHY), 0.005)
    expect(runs.some(([a, b]) => a < 60 && b > 60)).toBe(true)
    // con il guasto 3 la coda alza tutto: sotto una soglia più bassa della coda non resta nulla
    expect(belowRuns(GRID, estimateOn(GRID, samples, 2, { ...HEALTHY, heavy: true }), 0.0015)).toEqual([])
  })
})

describe('condizioni: racconto, sfida, testi', () => {
  it('i passi impongono un guasto per volta; la lettura isolata si sposta e torna', () => {
    expect(brokenOfStep(0)).toBeNull()
    expect(brokenOfStep(1)).toEqual({ ...HEALTHY, offCenter: true })
    expect(brokenOfStep(5)).toEqual(HEALTHY)
    expect(outlierOfStep(0)).toBe(80)
    expect(outlierOfStep(0.5)).toBeCloseTo(60, 9)
    expect(outlierOfStep(1)).toBeCloseTo(80, 9)
  })

  it('la sfida: tre risposte giuste la superano, una sbagliata no', () => {
    const right = Object.fromEntries(PATIENTS.map((p) => [p.id, p.answer])) as Record<'A' | 'B' | 'C', 'massimo' | 'continuita' | 'decadimento'>
    expect(judge(right).ok).toBe(true)
    expect(judge({ ...right, A: 'massimo' }).ok).toBe(false)
    expect(judge({ A: '', B: '', C: '' }).ok).toBe(false)
  })

  it('formule e didascalie compilano', () => {
    for (const tex of [TEX_MAX, TEX_CONT, TEX_DECAY, TEX_LIVE]) expectTexCompiles(tex)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { h: '2.0', alarm: true, x: '60.0' }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
  })
})
