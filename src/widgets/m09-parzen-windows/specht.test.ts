import { describe, expect, it } from 'vitest'
import { addends, bananaPixels, bestSigma, coef2d, looLogLik, nearest, regimeOf, specht, SIGMA_STEPS, sweepSigma, trainLogLik, zoneOf } from './specht'

describe('m09-specht-gaussiano-sferico: la logica', () => {
  const px = bananaPixels()

  it('40 pixel a z-score: media 0 e deviazione standard 1 per banda', () => {
    expect(px).toHaveLength(40)
    for (const j of [0, 1]) {
      const m = px.reduce((s, p) => s + p[j], 0) / 40
      const sd = Math.sqrt(px.reduce((s, p) => s + (p[j] - m) ** 2, 0) / 40)
      expect(Math.abs(m)).toBeLessThan(0.01)
      expect(sd).toBeCloseTo(1, 2)
    }
  })

  it('il coefficiente della specifica: 1/(2π·0.3²) = 1.768, 2σ² = 0.18', () => {
    expect(coef2d(0.3)).toBeCloseTo(1.768, 3)
    expect(2 * 0.3 ** 2).toBeCloseTo(0.18, 12)
  })

  it('la somma degli addendi è la stima di Specht', () => {
    const x = [0.2, -0.9] as const
    const a = addends(x, px, 0.3)
    expect(a.reduce((s, t) => s + t.term, 0)).toBeCloseTo(specht(x, px, 0.3), 12)
    for (let i = 1; i < a.length; i++) expect(a[i].term).toBeLessThanOrEqual(a[i - 1].term)
  })

  it('la verosimiglianza sui dati di training cresce senza limite per σ → 0, la LOO no', () => {
    expect(trainLogLik(px, 0.01)).toBeGreaterThan(trainLogLik(px, 0.1))
    expect(looLogLik(px, 0.01)).toBeLessThan(looLogLik(px, 0.3))
    const s = bestSigma(px)
    expect(s).toBeGreaterThan(0.1)
    expect(s).toBeLessThan(1)
    expect(looLogLik(px, s)).toBeGreaterThanOrEqual(looLogLik(px, s * 1.3))
    expect(looLogLik(px, s)).toBeGreaterThanOrEqual(looLogLik(px, s / 1.3))
  })

  it('zone e timbri', () => {
    expect(zoneOf(0.05, 0.3)).toBe('overfitting')
    expect(zoneOf(1.2, 0.3)).toBe('underfitting')
    expect(zoneOf(0.32, 0.3)).toBe('giusta')
    expect(regimeOf(0.08)).toBe('over')
    expect(regimeOf(1.2)).toBe('under')
    expect(regimeOf(0.3)).toBeNull()
    expect(SIGMA_STEPS[0]).toBe(0.05)
    expect(SIGMA_STEPS.at(-1)).toBe(2)
    expect(SIGMA_STEPS).toContain(0.3)
    expect(sweepSigma(0)).toBeCloseTo(0.05, 12)
    expect(sweepSigma(1)).toBeCloseTo(2, 12)
    expect(nearest([10, 10], [[0, 0], [9, 9]])).toBe(1)
  })
})
