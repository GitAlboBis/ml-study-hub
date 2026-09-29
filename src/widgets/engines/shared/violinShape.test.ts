import { describe, expect, it } from 'vitest'
import { normalPdf } from '../../../lib/ml/stats'
import { quantile, silverman, violinProfile } from './violinShape'

describe('forma di un violino', () => {
  it('quantile con interpolazione lineare (tipo 7, come R e numpy)', () => {
    const v = [3, 1, 2, 5, 4]
    expect(quantile(v, 0.5)).toBe(3)
    expect(quantile(v, 0)).toBe(1)
    expect(quantile(v, 1)).toBe(5)
    expect(quantile(v, 0.25)).toBe(2)
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5)
    expect(quantile([], 0.5)).toBeNaN()
  })

  it('silverman: 0.9·min(σ, IQR/1.34)·N^(−1/5)', () => {
    const v = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const sd = Math.sqrt(v.reduce((s, x) => s + (x - 5.5) ** 2, 0) / 9)
    const iqr = quantile(v, 0.75) - quantile(v, 0.25)
    expect(silverman(v)).toBeCloseTo(0.9 * Math.min(sd, iqr / 1.34) * 10 ** -0.2, 12)
    // campione degenere: una larghezza piccola ma non nulla
    expect(silverman([2, 2, 2])).toBeGreaterThan(0)
  })

  it('violinProfile è la stima di Parzen gaussiana dei valori sulla griglia', () => {
    const v = [0, 1]
    const grid = [-1, 0, 0.5, 2]
    const p = violinProfile(v, grid, 0.5)
    for (let i = 0; i < grid.length; i++) expect(p[i]).toBeCloseTo((normalPdf(grid[i], 0, 0.5) + normalPdf(grid[i], 1, 0.5)) / 2, 12)
    expect(violinProfile([], grid, 0.5)).toEqual([0, 0, 0, 0])
  })
})
