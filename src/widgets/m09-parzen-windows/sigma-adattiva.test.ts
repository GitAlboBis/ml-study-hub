import { describe, expect, it } from 'vitest'
import { CHALLENGE_K, CHALLENGE_L, densityAdaptive, judge, minimalL, neighborsOf, peakOf, readings, sigmasFor, spurious } from './sigma-adattiva'

describe('m09-sigma-adattiva: la logica', () => {
  const pts = readings()

  it('60 letture: 50 nell’ammasso (con la terna quasi coincidente) e 10 sparse', () => {
    expect(pts).toHaveLength(60)
  })

  it('σ_k è la media delle distanze dagli L vicini (esclusi se stessi)', () => {
    const nb = neighborsOf(pts, 10, 3)
    expect(nb).toHaveLength(3)
    expect(nb.every((n) => n.index !== 10)).toBe(true)
    const mean = nb.reduce((s, n) => s + n.distance, 0) / 3
    expect(sigmasFor(pts, 3)[10]).toBeCloseTo(mean, 12)
  })

  it('σ piccola nell’ammasso, grande sui punti sparsi', () => {
    const s = sigmasFor(pts, 3)
    const cluster = s.slice(0, 50).reduce((a, b) => a + b, 0) / 50
    const sparse = s.slice(50).reduce((a, b) => a + b, 0) / 10
    expect(sparse).toBeGreaterThan(cluster * 4)
  })

  it('con L = 1 la terna dà aghi spuri; il più piccolo L che li toglie è 3', () => {
    expect(spurious(sigmasFor(pts, 1)).length).toBeGreaterThanOrEqual(3)
    expect(spurious(sigmasFor(pts, 2)).length).toBeGreaterThan(0)
    expect(minimalL(pts)).toBe(3)
    expect(peakOf(0.003, 60)).toBeGreaterThan(100)
  })

  it('la stima adattiva integra a circa 1 sul piano', () => {
    const s = sigmasFor(pts, 3)
    let sum = 0
    const n = 120
    const a = -4
    const b = 4
    const d = (b - a) / n
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) sum += densityAdaptive([a + (i + 0.5) * d, a + (j + 0.5) * d], pts, s) * d * d
    expect(sum).toBeGreaterThan(0.9)
    expect(sum).toBeLessThan(1.02)
  })

  it('la sfida: σ_k del campione evidenziato con L = 2 e L minimo', () => {
    const t = sigmasFor(pts, CHALLENGE_L)[CHALLENGE_K]
    expect(judge(pts, t, 3).ok).toBe(true)
    expect(judge(pts, t + 0.05, 3).ok).toBe(false)
    expect(judge(pts, t, 1).ok).toBe(false)
    expect(judge(pts, 0, 1).ok).toBe(false)
  })
})
