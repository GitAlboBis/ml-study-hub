import { describe, expect, it } from 'vitest'
import { linspace, mean, trapz, variance } from '../../lib/ml/stats'
import {
  H_STEPS,
  INITIAL,
  bandRange,
  bestH,
  countIn,
  drawEstimates,
  excursion,
  flatLevel,
  greenBands,
  judge,
  lawH,
  llnLevel,
  neededN,
  probR,
  regionStats,
  sweepN,
  trainingSet,
  truth,
} from './dilemma-della-regione'

describe('m09-dilemma-della-regione: la logica', () => {
  it('i numeri della specifica: p(2.4) = 0.313, p·V = 0.188, K atteso ≈ 9 (spia rossa)', () => {
    expect(truth(2.4)).toBeCloseTo(0.313, 3)
    expect(truth(2.4) * 0.6).toBeCloseTo(0.188, 3)
    // la specifica approssima con N·p(x*)·h = 9.4 (spia rossa); il K atteso esatto N·P_R è 10.0, proprio sul
    // confine fra rosso e giallo: in ogni caso lontano dai 30 che servono
    expect(50 * truth(2.4) * 0.6).toBeCloseTo(9.39, 2)
    const s = regionStats(2.4, 0.6, 50)
    expect(s.kExpected).toBeGreaterThan(9)
    expect(s.kExpected).toBeLessThan(10.5)
    expect(llnLevel(s.kExpected)).not.toBe('ok')
    expect(llnLevel(50 * truth(2.4) * 0.6)).toBe('ko')
  })

  it('P_R è l’integrale di p su R', () => {
    const xs = linspace(2.1, 2.7, 2001)
    expect(probR(2.4, 0.6)).toBeCloseTo(trapz(xs, xs.map(truth)), 6)
  })

  it('le estrazioni: la media di K/(N h) si posa su P_R/V, non su p(x*); la varianza è P_R(1−P_R)/(N h²)', () => {
    const d = drawEstimates(2.4, 0.6, 50, 1, 4000).map((e) => e.phat)
    const s = regionStats(2.4, 0.6, 50)
    expect(mean(d)).toBeCloseTo(s.avg, 2)
    expect(variance(d) / s.variance).toBeGreaterThan(0.9)
    expect(variance(d) / s.variance).toBeLessThan(1.1)
    // il bias: P_R/V lontano da p(x*) con h grande, vicino con h piccolo
    expect(Math.abs(regionStats(2.4, 2, 50).bias)).toBeGreaterThan(Math.abs(regionStats(2.4, 0.1, 50).bias) * 5)
  })

  it('h piccolo: compaiono estrazioni con K = 0 e p̂ = 0', () => {
    const d = drawEstimates(2.4, 0.03, 50, 2)
    expect(d.some((e) => e.k === 0 && e.phat === 0)).toBe(true)
  })

  it('le spie: escursione di p in R cresce con h; soglie 10% e 30%', () => {
    expect(excursion(2.4, 0.05)).toBeLessThan(excursion(2.4, 0.6))
    expect(flatLevel(0.05)).toBe('ok')
    expect(flatLevel(0.2)).toBe('warn')
    expect(flatLevel(0.5)).toBe('ko')
    expect(llnLevel(35)).toBe('ok')
    expect(llnLevel(20)).toBe('warn')
  })

  it('le strisce: con N = 50 l’intersezione è vuota, con N = 5000 si apre fra circa 0.02 e 0.06', () => {
    const b50 = greenBands(2.4, 50)
    expect(bandRange(b50, (b) => b.lln && b.flat)).toBeNull()
    const b5000 = greenBands(2.4, 5000)
    const r = bandRange(b5000, (b) => b.lln && b.flat)
    expect(r).not.toBeNull()
    expect(r![0]).toBeGreaterThanOrEqual(0.02)
    expect(r![0]).toBeLessThanOrEqual(0.03)
    expect(r![1]).toBeGreaterThanOrEqual(0.05)
    expect(r![1]).toBeLessThanOrEqual(0.08)
  })

  it('la corsa finale h_N = h_1/√N: alla fine entrambe le spie verdi', () => {
    expect(sweepN(0)).toBe(50)
    expect(sweepN(1)).toBe(20000)
    const N = 20000
    const s = regionStats(2.4, lawH(INITIAL.h1, N), N)
    expect(llnLevel(s.kExpected)).toBe('ok')
    expect(flatLevel(s.exc)).toBe('ok')
  })

  it('il training set: K contato nella regione', () => {
    const t = trainingSet(50, 1)
    expect(t).toHaveLength(50)
    expect(countIn([2.1, 2.4, 2.69, 2.71], 2.4, 0.6)).toBe(3)
  })

  it('la sfida è tarata: N ≈ 480 per K atteso 30 con h = 0.2; l’h iniziale non basta; il migliore dello slider sì', () => {
    expect(neededN(2.4)).toBeGreaterThan(460)
    expect(neededN(2.4)).toBeLessThan(500)
    expect(30 / (0.313 * 0.2)).toBeCloseTo(479, 0)
    const best = bestH(1.8)
    expect(best.h).toBe(0.7)
    // sul picco, all'h migliore, la spia di p costante resta rossa e quella dei grandi numeri gialla
    const s = regionStats(1.8, best.h, 50)
    expect(flatLevel(s.exc)).toBe('ko')
    expect(llnLevel(s.kExpected)).toBe('warn')
    expect(judge(INITIAL.x, INITIAL.h, 480).ok).toBe(false)
    expect(judge(1.8, INITIAL.h, 480).ok).toBe(true)
    expect(judge(1.8, 0.7, 480).ok).toBe(true)
    expect(judge(1.8, 0.3, 480).ok).toBe(false)
    expect(judge(1.8, 0.7, 300).ok).toBe(false)
    // in 2.4 p è quasi lineare: il minimo "di comodo" sta sul bordo dello slider
    expect(bestH(2.4).h).toBe(H_STEPS.at(-1))
  })
})
