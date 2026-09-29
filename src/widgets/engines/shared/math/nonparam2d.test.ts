import { describe, expect, it } from 'vitest'
import { createRng } from '../../../../lib/rng'
import { adaptiveSigmas, knnDensity2d, knnRadius2d, parzen2d, spechtDensity } from '../../../../lib/ml/nonparam'
import { gridIntegral } from './grid'
import {
  bandwidthLaw, bandwidthLimits, cellVolume, kernelPeak2d, knnCell, knnGrid, minimalL, needleKernels, neighborsOfSample,
  parzenBox2d, parzenGauss, parzenGaussGrid, shapeDistance, standardize, windowCount, windowDensity,
} from './nonparam2d'
import type { Vec2 } from './types'

const cloud = (seed: number, n: number): Vec2[] => {
  const rng = createRng(seed)
  return Array.from({ length: n }, () => [rng.normal(0, 1), rng.normal(0, 0.6)] as const)
}

describe('celle e finestre nelle tre norme', () => {
  it('distanze L2, L∞, L1 e volumi π r², (2r)², 2r²', () => {
    expect(shapeDistance([0, 0], [3, 4], 'circle')).toBe(5)
    expect(shapeDistance([0, 0], [3, 4], 'square')).toBe(4)
    expect(shapeDistance([0, 0], [3, -4], 'rhombus')).toBe(7)
    expect(cellVolume(2, 'circle')).toBeCloseTo(4 * Math.PI, 14)
    expect(cellVolume(2, 'square')).toBe(16)
    expect(cellVolume(2, 'rhombus')).toBe(8)
    expect(cellVolume(1, 'rhombus', 3)).toBeCloseTo(8 / 6, 14)
  })
  it('finestra chiusa di raggio r: chi è dentro dipende dalla forma', () => {
    const pts: Vec2[] = [[0.5, 0.5], [0.9, 0.9], [1, 0], [2, 0]]
    expect(windowCount([0, 0], pts, 1, 'circle')).toBe(2)
    expect(windowCount([0, 0], pts, 1, 'square')).toBe(3)
    expect(windowCount([0, 0], pts, 1, 'rhombus')).toBe(2)
    const w = windowDensity([0, 0], pts, 1, 'square')
    expect(w).toEqual({ K: 3, V: 4, p: 3 / (4 * 4) })
    expect(windowDensity([0, 0], [], 1, 'circle').p).toBe(0)
  })
  it('cella K-NN circolare: stesso raggio e stessa stima di src/lib/ml/nonparam', () => {
    const pts = cloud(3, 60)
    for (const x of [[0, 0], [1.2, -0.3], [-2, 1]] as Vec2[]) {
      const c = knnCell(x, pts, 5)
      expect(c.r).toBeCloseTo(knnRadius2d(x, pts, 5), 14)
      expect(c.p).toBeCloseTo(knnDensity2d(x, pts, 5), 12)
      expect(c.neighbors).toHaveLength(5)
      expect(c.neighbors[4].distance).toBe(c.r)
      for (let k = 1; k < 5; k++) expect(c.neighbors[k].distance).toBeGreaterThanOrEqual(c.neighbors[k - 1].distance)
    }
  })
  it('cella quadrata e a rombo: raggio in L∞ e L1, V = (2r)² e 2r²', () => {
    const pts: Vec2[] = [[1, 0.2], [0.3, 0.3], [-0.5, 0.9]]
    const sq = knnCell([0, 0], pts, 2, 'square')
    expect(sq.r).toBeCloseTo(0.9, 14)
    expect(sq.V).toBeCloseTo(3.24, 14)
    expect(sq.p).toBeCloseTo(2 / (3 * 3.24), 14)
    const rh = knnCell([0, 0], pts, 2, 'rhombus')
    expect(rh.r).toBeCloseTo(1.2, 14)
    expect(rh.neighbors.map((n) => n.index)).toEqual([1, 0])
  })
  it('K > N: raggio infinito e stima 0', () => {
    const c = knnCell([0, 0], [[1, 1]], 3)
    expect(c.r).toBe(Number.POSITIVE_INFINITY)
    expect(c.p).toBe(0)
  })
})

describe('Parzen 2-D', () => {
  const pts = cloud(9, 40)
  it('gaussiano sferico: uguale a spechtDensity, con σ unica o σ_k adattive', () => {
    expect(parzenGauss([0.2, 0.1], pts, 0.4)).toBeCloseTo(spechtDensity([0.2, 0.1], pts, 0.4), 14)
    const s = adaptiveSigmas(pts, 3)
    expect(parzenGauss([0.2, 0.1], pts, s)).toBeCloseTo(spechtDensity([0.2, 0.1], pts, s), 14)
  })
  it('finestra quadrata di lato h: K/(N h²) come parzen2d rettangolare', () => {
    expect(parzenBox2d([0, 0], pts, 0.8)).toBeCloseTo(parzen2d([0, 0], pts, 0.8, 'rettangolare'), 14)
  })
  it('sulla griglia: stessi valori dei punti singoli e integrale ≈ 1', () => {
    const g = parzenGaussGrid(pts, 0.35, [-6, 6], [-5, 5], 121, 101)
    expect(g.values[50 * 121 + 60]).toBeCloseTo(parzenGauss([0, 0], pts, 0.35), 12)
    expect(gridIntegral(g)).toBeCloseTo(1, 3)
    const s = adaptiveSigmas(pts, 4)
    const ga = parzenGaussGrid(pts, s, [-6, 6], [-5, 5], 121, 101)
    expect(ga.values[50 * 121 + 60]).toBeCloseTo(parzenGauss([0, 0], pts, s), 12)
  })
  it('griglia K-NN: stessi valori della cella', () => {
    const g = knnGrid(pts, 5, 'square', [-2, 2], [-2, 2], 5)
    expect(g.values[2 * 5 + 2]).toBeCloseTo(knnCell([0, 0], pts, 5, 'square').p, 14)
  })
})

describe('σ adattiva, leggi e normalizzazione', () => {
  it('i vicini di un campione (sé escluso) danno σ_k come media delle distanze', () => {
    const pts: Vec2[] = [[0, 0], [1, 0], [0, 2], [5, 5]]
    const nb = neighborsOfSample(pts, 0, 2)
    expect(nb.map((n) => n.index)).toEqual([1, 2])
    expect((nb[0].distance + nb[1].distance) / 2).toBeCloseTo(adaptiveSigmas(pts, 2)[0], 14)
  })
  it('h_N = h₁ / N^a', () => {
    expect(bandwidthLaw(1, 100, 0.5)).toBeCloseTo(0.1, 14)
    expect(bandwidthLaw(0.5, 16, 0.25)).toBeCloseTo(0.25, 14)
  })
  it('le due condizioni della slide p61: h_N → 0 e N·h_Nⁿ = h₁ⁿ N^{1 − na} → +∞', () => {
    // in 2-D: h₁/N dà N h² → 0, h₁/√N lo tiene costante, solo h₁/N^{1/4} = h₁/N^{1/(2n)} lo manda a +∞
    expect(bandwidthLimits(1, 2)).toEqual({ h: 'zero', nhn: 'zero', consistent: false })
    expect(bandwidthLimits(0.5, 2)).toEqual({ h: 'zero', nhn: 'const', consistent: false })
    expect(bandwidthLimits(0.25, 2)).toEqual({ h: 'zero', nhn: 'inf', consistent: true })
    // in 1-D la radice basta; h fissa (a = 0) non va a zero
    expect(bandwidthLimits(0.5, 1)).toEqual({ h: 'zero', nhn: 'inf', consistent: true })
    expect(bandwidthLimits(0, 2)).toEqual({ h: 'const', nhn: 'inf', consistent: false })
  })
  it('picco di un kernel gaussiano sferico 2-D di peso 1/N: 1/(N·2πσ²)', () => {
    expect(kernelPeak2d(0.5, 10)).toBeCloseTo(1 / (5 * Math.PI), 15)
    expect(kernelPeak2d(0.3, 1)).toBeCloseTo(parzenGauss([2, -1], [[2, -1]], 0.3), 15)
  })
  it('aghi spuri: σ_k sotto la soglia e il più piccolo L che li toglie tutti', () => {
    // una terna quasi coincidente e tre campioni radi: con L = 1, 2 la terna ha σ_k ≈ 0.001
    const pts: Vec2[] = [[0, 0], [0.001, 0], [0.002, 0], [1, 0], [2, 0], [3, 0]]
    expect(needleKernels(adaptiveSigmas(pts, 1), 0.02)).toEqual([0, 1, 2])
    expect(needleKernels(adaptiveSigmas(pts, 2), 0.02)).toEqual([0, 1, 2])
    expect(needleKernels(adaptiveSigmas(pts, 3), 0.02)).toEqual([])
    expect(minimalL(pts, 0.02)).toBe(3)
    // quattro campioni coincidenti: servono tutti gli altri (L = 4); con L ≤ 3 non basta nessuna
    const dup: Vec2[] = [[0, 0], [0, 0], [0, 0], [0, 0], [5, 5]]
    expect(minimalL(dup, 0.02)).toBe(4)
    expect(minimalL(dup, 0.02, 3)).toBeNull()
  })
  it('standardizzazione: media 0 e deviazione 1 per ogni feature, invertibile', () => {
    const pts: Vec2[] = [[170, 4], [180, 6], [175, 5], [165, 3]]
    const s = standardize(pts)
    const m0 = s.points.reduce((a, p) => a + p[0], 0) / 4
    const v1 = s.points.reduce((a, p) => a + p[1] ** 2, 0) / 4
    expect(m0).toBeCloseTo(0, 14)
    expect(v1).toBeCloseTo(1, 14)
    expect(s.points[1][0] * s.sd[0] + s.mean[0]).toBeCloseTo(180, 12)
  })
})
