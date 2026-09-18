import { describe, expect, it } from 'vitest'
import { linspace, trapz } from '../../lib/ml/stats'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  GRID,
  NO_FAULTS,
  SAMPLES,
  STEPS,
  TEX_DERIVATION,
  TEX_ESTIMATE,
  TEX_JACOBIAN,
  TEX_KERNEL,
  TEX_LIVE,
  captionFor,
  changeWidth,
  estimate,
  faultsOfStep,
  judge,
  kernelFor,
  lampsFor,
  lampsOn,
  negativeRuns,
  probability,
  sincPlain,
  theoreticalArea,
  totalArea,
} from './legittima'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'

describe('legittima: i dati', () => {
  it('15 frequenze fra 52 e 96 bpm', () => {
    expect(SAMPLES).toHaveLength(15)
    expect(Math.min(...SAMPLES)).toBe(52)
    expect(Math.max(...SAMPLES)).toBe(96)
  })
})

describe('legittima: area e non negatività', () => {
  it('senza guasti l\'area è 1.000 per ogni h (h = 1, 5, 20)', () => {
    for (const h of [1, 5, 20]) expect(totalArea(h, NO_FAULTS).toFixed(3)).toBe('1.000')
  })

  it('guasto 1: l\'area diventa h (5.000 con h = 5)', () => {
    expect(totalArea(5, { ...NO_FAULTS, noVolume: true }).toFixed(3)).toBe('5.000')
    expect(theoreticalArea(8, { ...NO_FAULTS, noVolume: true })).toBe(8)
  })

  it('guasto 2: il sinc ha area 1 ma la stima va sotto zero', () => {
    const us = linspace(-2000, 2000, 400001)
    expect(trapz(us, us.map(sincPlain))).toBeCloseTo(1, 3)
    const f = { ...NO_FAULTS, negative: true }
    expect(totalArea(5, f)).toBeCloseTo(1, 2)
    const ys = estimate(GRID, 5, f)
    expect(Math.min(...ys)).toBeLessThan(0)
    expect(negativeRuns(GRID, ys).length).toBeGreaterThan(0)
  })

  it('guasto 3: il rettangolo alto 1/2 ha area 1/2 e la stima integra a 0.500', () => {
    const f = { ...NO_FAULTS, halfArea: true }
    expect(kernelFor(f)(0.3)).toBe(0.5)
    expect(kernelFor(f)(0.6)).toBe(0)
    expect(totalArea(5, f).toFixed(3)).toBe('0.500')
  })

  it('le spie: tutte accese senza guasti; ciascun guasto ne spegne quelle giuste', () => {
    const ok = lampsFor(NO_FAULTS, 0, 1)
    expect(Object.values(ok).every(Boolean)).toBe(true)
    expect(lampsFor({ ...NO_FAULTS, noVolume: true }, 0, 5)).toEqual({ gammaNonNeg: true, gammaArea: true, pNonNeg: true, pArea: false })
    expect(lampsFor({ ...NO_FAULTS, negative: true }, -0.001, 1)).toEqual({ gammaNonNeg: false, gammaArea: true, pNonNeg: false, pArea: true })
    expect(lampsFor({ ...NO_FAULTS, halfArea: true }, 0, 0.5)).toEqual({ gammaNonNeg: true, gammaArea: false, pNonNeg: true, pArea: false })
  })

  it('P(60 ≤ x ≤ 80) è una probabilità senza guasti e supera 1 con il guasto 1 e h grande', () => {
    const p = probability(60, 80, 5, NO_FAULTS)
    expect(p).toBeGreaterThan(0)
    expect(p).toBeLessThan(1)
    expect(probability(60, 80, 5, { ...NO_FAULTS, noVolume: true })).toBeGreaterThan(1)
  })
})

describe('legittima: racconto', () => {
  it('il cambio di variabile porta la larghezza da h a 1', () => {
    expect(changeWidth(5, 0)).toBe(5)
    expect(changeWidth(5, 1)).toBe(1)
  })

  it('i passi dei guasti ne accendono uno per volta; "ripara" li spegne e accende le spie in sequenza', () => {
    expect(faultsOfStep(0)).toBeNull()
    expect(faultsOfStep(3)).toEqual({ noVolume: true, negative: false, halfArea: false })
    expect(faultsOfStep(6)).toEqual(NO_FAULTS)
    expect(lampsOn(0)).toBe(0)
    expect(lampsOn(0.2)).toBe(1)
    expect(lampsOn(1)).toBe(4)
  })
})

describe('legittima: sfida e testi', () => {
  it('8 e 4 superano la sfida; 1 e 1 no', () => {
    expect(judge(8, 4).ok).toBe(true)
    expect(judge(1, 1).ok).toBe(false)
    expect(judge(8, 8).ok).toBe(false)
  })

  it('formule e didascalie compilano', () => {
    for (const tex of [TEX_KERNEL, TEX_ESTIMATE, TEX_DERIVATION, TEX_JACOBIAN, TEX_LIVE]) expectTexCompiles(tex)
    expect(TEX_KERNEL).toBe(String.raw`\gamma(\mathbf{x})\ge 0\quad \forall\,\mathbf{x}\in\Re^n,\qquad \int_{\Re^n}\gamma(\mathbf{x})\,d\mathbf{x}=1`)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { h: '5.0', area: '1.000', P: '0.550', N: 15 }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
  })
})
