import { describe, expect, it } from 'vitest'
import { covarianceMatrix } from '../../../../lib/ml/stats'
import { dot, matAdd } from './linalg'
import {
  covarianceEstimate, directionalVariance, fisherCriterion, fisherDirection, ldaDirections, meanVector, pca, pcaProject,
  pcaReconstruct, projectedStats, residualError, scatterMatrices, scatterMatrix,
} from './scatter'

// Il cubo del corso (m14 c43-c48, m15 c67): tre vertici per classe
const W1 = [[1, 0, 0], [1, 0, 1], [1, 1, 0]]
const W2 = [[0, 0, 1], [0, 1, 0], [0, 1, 1]]

const close = (A: readonly (readonly number[])[], B: readonly (readonly number[])[], digits = 12) =>
  A.forEach((row, i) => row.forEach((v, j) => expect(v).toBeCloseTo(B[i][j], digits)))

describe('medie, scatter e covarianza', () => {
  it('baricentro e scatter S = Σ (x − m)(x − m)ᵗ', () => {
    expect(meanVector([...W1, ...W2])).toEqual([0.5, 0.5, 0.5])
    const S = scatterMatrix(W1)
    close(S, [[0, 0, 0], [0, 2 / 3, -1 / 3], [0, -1 / 3, 2 / 3]])
    expect(meanVector([])).toEqual([])
  })
  it('covarianza del cubo: Σ = (1/12)[[3, −1, −1], [−1, 3, −1], [−1, −1, 3]] con 1/N', () => {
    const { m, S } = covarianceEstimate([...W1, ...W2])
    expect(m).toEqual([0.5, 0.5, 0.5])
    close(S, [[3, -1, -1], [-1, 3, -1], [-1, -1, 3]].map((r) => r.map((v) => v / 12)))
  })
  it('1/N e 1/(N − 1) coincidono con covarianceMatrix di src/lib/ml', () => {
    const pts = [[1, 2], [3, 1], [0, 0], [2, 5]]
    close(covarianceEstimate(pts, '1/N').S, covarianceMatrix(pts, false))
    close(covarianceEstimate(pts, '1/(N-1)').S, covarianceMatrix(pts, true))
  })
})

describe('matrici di scatter di più classi', () => {
  it('S_W del cubo è quella della slide e ha determinante nullo', () => {
    const sc = scatterMatrices([W1, W2], { between: 'pair' })
    close(sc.means, [[1, 1 / 3, 1 / 3], [0, 2 / 3, 2 / 3]])
    close(sc.SW, [[0, 0, 0], [0, 4 / 3, -2 / 3], [0, -2 / 3, 4 / 3]])
    close(sc.SB, [[1, -1 / 3, -1 / 3], [-1 / 3, 1 / 9, 1 / 9], [-1 / 3, 1 / 9, 1 / 9]])
    expect(sc.counts).toEqual([3, 3])
    expect(fisherDirection(sc.means[0], sc.means[1], sc.SW)).toBeNull()
  })
  it('S_T = S_W + S_B con lo scatter inter-classe pesato da #(X_i)', () => {
    const A = [[0, 0], [1, 1], [2, 0], [1, -1]]
    const B = [[4, 4], [5, 3], [6, 5]]
    const C = [[-2, 5], [-1, 6]]
    const sc = scatterMatrices([A, B, C])
    close(sc.ST, matAdd(sc.SW, sc.SB), 10)
    close(sc.ST, scatterMatrix([...A, ...B, ...C]), 10)
    // 'mean' divide per N
    const mean = scatterMatrices([A, B, C], { normalize: 'mean' })
    close(mean.SW, sc.SW.map((r) => r.map((v) => v / 9)), 12)
  })
})

describe('Fisher e LDA', () => {
  const X1 = [[1, 2], [2, 3], [3, 3], [4, 5], [5, 5]]
  const X2 = [[1, 0], [2, 1], [3, 1], [3, 2], [5, 3], [6, 5]]
  it('w = S_W⁻¹(m₁ − m₂) massimizza J(w) = wᵗS_Bw / wᵗS_Ww, invariante di scala', () => {
    const sc = scatterMatrices([X1, X2], { between: 'pair' })
    const w = fisherDirection(sc.means[0], sc.means[1], sc.SW)!
    const J = fisherCriterion(w, sc.SB, sc.SW)
    expect(fisherCriterion(w.map((v) => -3 * v), sc.SB, sc.SW)).toBeCloseTo(J, 12)
    for (let t = 0; t < Math.PI; t += 0.1) expect(fisherCriterion([Math.cos(t), Math.sin(t)], sc.SB, sc.SW)).toBeLessThanOrEqual(J + 1e-12)
    // J* = (m₁ − m₂)ᵗ S_W⁻¹ (m₁ − m₂)
    const d = [sc.means[0][0] - sc.means[1][0], sc.means[0][1] - sc.means[1][1]]
    expect(J).toBeCloseTo(dot(d, w), 12)
  })
  it('statistiche proiettate: m̃_i, s̃_i² e J uguali alla forma matriciale', () => {
    const sc = scatterMatrices([X1, X2], { between: 'pair' })
    const w = [0.6, 0.8]
    const ps = projectedStats([X1, X2], w)
    expect(ps.means[0]).toBeCloseTo(dot(w, sc.means[0]), 12)
    expect(ps.scatters[0] + ps.scatters[1]).toBeCloseTo(fisherCriterion(w, sc.SW, [[1, 0], [0, 1]]) , 10)
    expect(ps.J).toBeCloseTo(fisherCriterion(w, sc.SB, sc.SW), 12)
  })
  it('LDA a tre classi: al più C − 1 = 2 autovalori non nulli, il primo è J del primo asse', () => {
    const A = [[0, 0, 0], [1, 0, 1], [0, 1, 0], [1, 1, 2]]
    const B = [[4, 1, 0], [5, 2, 1], [4, 0, 1], [6, 1, 1]]
    const C = [[1, 5, 3], [2, 6, 2], [0, 5, 4], [1, 7, 3]]
    const r = ldaDirections([A, B, C])!
    expect(r.values).toHaveLength(3)
    expect(Math.abs(r.values[2])).toBeLessThan(1e-9)
    const sc = scatterMatrices([A, B, C])
    expect(fisherCriterion(r.vectors[0], sc.SB, sc.SW)).toBeCloseTo(r.values[0], 9)
  })
})

describe('PCA', () => {
  it('cubo del corso: λ = 1/3, 1/3, 1/12 e φ₃ = (1, 1, 1)/√3', () => {
    const p = pca([...W1, ...W2])
    expect(p.values[0]).toBeCloseTo(1 / 3, 12)
    expect(p.values[1]).toBeCloseTo(1 / 3, 12)
    expect(p.values[2]).toBeCloseTo(1 / 12, 12)
    p.vectors[2].forEach((v) => expect(v).toBeCloseTo(1 / Math.sqrt(3), 12))
    expect(p.explained[0] + p.explained[1] + p.explained[2]).toBeCloseTo(1, 12)
    expect(p.cumulative[1]).toBeCloseTo(8 / 9, 12)
  })
  it('proiezione e ricostruzione: con tutte le componenti si torna al punto, J_m è la somma degli scartati', () => {
    const pts = [[2, 1, 0], [3, 2, 1], [1, 0, 1], [4, 4, 2], [0, 1, 1]]
    const p = pca(pts, '1/N')
    const x = pts[3]
    const y = pcaProject(x, p.m, p.vectors, 3)
    pcaReconstruct(y, p.m, p.vectors).forEach((v, i) => expect(v).toBeCloseTo(x[i], 12))
    // errore quadratico medio di ricostruzione con m = 1 = λ₂ + λ₃
    const mse = pts.reduce((s, q) => {
      const r = pcaReconstruct(pcaProject(q, p.m, p.vectors, 1), p.m, p.vectors)
      return s + r.reduce((t, v, i) => t + (v - q[i]) ** 2, 0)
    }, 0) / pts.length
    expect(mse).toBeCloseTo(residualError(p.values, 1), 10)
  })
  it('varianza direzionale aᵗΣa lungo una direzione (normalizzata)', () => {
    expect(directionalVariance([[4, 0], [0, 1]], [0, 2])).toBeCloseTo(1, 14)
    expect(directionalVariance([[4, 0], [0, 1]], [1, 1])).toBeCloseTo(2.5, 14)
  })
})
