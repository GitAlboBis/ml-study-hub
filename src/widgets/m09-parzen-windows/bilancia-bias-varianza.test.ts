import { describe, expect, it } from 'vitest'
import { parzen1d } from '../../lib/ml/nonparam'
import { linspace } from '../../lib/ml/stats'
import { createRng } from '../../lib/rng'
import { sampleMix } from './proprieta/teoria'
import {
  BANCA,
  H_STEPS,
  INITIAL,
  N_STEPS,
  binnedKde,
  bundle,
  equilibrium,
  errorsAt,
  judge,
  lawH,
  lawRatio,
  optimum,
  sideOf,
  sweepN,
  tiltDeg,
  uCurves,
} from './bilancia-bias-varianza'

describe('m09-bilancia-bias-varianza: la logica', () => {
  it('la U: bias² cresce con h, varianza scende, il MISE ha un minimo interno', () => {
    const u = uCurves(100)
    expect(u.bias2.at(-1)!).toBeGreaterThan(u.bias2[0])
    expect(u.variance.at(-1)!).toBeLessThan(u.variance[0])
    const iMin = u.mise.indexOf(Math.min(...u.mise))
    expect(iMin).toBeGreaterThan(5)
    expect(iMin).toBeLessThan(u.mise.length - 5)
  })

  it('il minimo scende e scorre a sinistra quando N cresce; N·h al minimo cresce', () => {
    const a = optimum(100)
    const b = optimum(1000)
    const c = optimum(10000)
    expect(b.h).toBeLessThan(a.h)
    expect(c.h).toBeLessThan(b.h)
    expect(c.errors.mise).toBeLessThan(b.errors.mise)
    expect(1000 * b.h).toBeGreaterThan(100 * a.h)
    expect(10000 * c.h).toBeGreaterThan(1000 * b.h)
    // l'equilibrio bias² = varianza è vicino al minimo (poco più a destra)
    const eq = equilibrium(100)
    expect(eq).toBeGreaterThan(a.h)
    expect(eq / a.h).toBeLessThan(1.5)
  })

  it('la bilancia: pende a destra con h piccolo (varianza), a sinistra con h grande (bias), piatta all’equilibrio', () => {
    expect(tiltDeg(errorsAt(0.05, 100))).toBeGreaterThan(10)
    expect(tiltDeg(errorsAt(1, 100))).toBeLessThan(-10)
    expect(Math.abs(tiltDeg(errorsAt(equilibrium(100), 100)))).toBeLessThan(0.01)
    expect(sideOf(errorsAt(0.05, 100))).toBe('varianza')
    expect(sideOf(errorsAt(1, 100))).toBe('bias')
  })

  it('le leggi della dimostrazione: partono insieme, poi la veloce finisce sulla varianza e la lenta sul bias', () => {
    expect(lawH('veloce', 20)).toBeCloseTo(lawH('lenta', 20), 12)
    expect(lawH('radice', 20)).toBeCloseTo(optimum(20).h, 6)
    expect(sideOf(errorsAt(lawH('veloce', 10000), 10000))).toBe('varianza')
    expect(sideOf(errorsAt(lawH('lenta', 10000), 10000))).toBe('bias')
    // h₁/√N resta la più vicina al minimo
    expect(lawRatio('radice', 10000)).toBeLessThan(lawRatio('lenta', 10000))
    expect(lawRatio('radice', 10000)).toBeLessThan(lawRatio('veloce', 10000))
    expect(sweepN(0)).toBe(20)
    expect(sweepN(1)).toBe(10000)
  })

  it('il fascio: 20 stime, e la stima da bin coincide con quella esatta', () => {
    const xs = linspace(0, 6, 31)
    const s = sampleMix(createRng(4), 150, BANCA)
    const est = binnedKde(s, xs, 0.25)
    // errore relativo sotto l'1%: invisibile sul grafico
    xs.forEach((x, i) => expect(Math.abs(est[i] - parzen1d(x, s, 0.25))).toBeLessThan(0.01 * Math.max(0.05, parzen1d(x, s, 0.25))))
    const b = bundle(100, 0.3, 1, xs)
    expect(b).toHaveLength(20)
    expect(b[0]).toHaveLength(31)
  })

  it('la sfida è tarata: lo stato iniziale non basta; un h dello slider dà equilibrio e la previsione giusta è "bias"', () => {
    expect(judge(INITIAL.h, 'bias').ok).toBe(false)
    const passing = H_STEPS.filter((h) => judge(h, 'bias').balanced)
    expect(passing.length).toBeGreaterThan(0)
    for (const h of passing) {
      expect(judge(h, 'bias').ok).toBe(true)
      expect(judge(h, 'varianza').ok).toBe(false)
    }
    expect(N_STEPS).toContain(100)
    expect(N_STEPS).toContain(10000)
  })
})
