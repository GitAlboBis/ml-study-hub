import { describe, expect, it } from 'vitest'
import { createRng } from '../../../../lib/rng'
import {
  charPoly, charPoly2, cholesky, conditionNumber, covFromAxes, covFromSigmas, createJacobi, det, det2, dot, eig2Sym, eigSym,
  ellipse2, ellipsePolygon, generalizedEigSym, identity, inv2, inverse, isPositiveDefinite, isPositiveSemidefinite, logDetSym,
  matMul, matVec, outer, quadForm, rankFromEigen, solve, sqrtSym, trace, transpose, whiteningMatrix,
} from './linalg'

const close = (A: readonly (readonly number[])[], B: readonly (readonly number[])[], digits = 10) => {
  expect(A.length).toBe(B.length)
  A.forEach((row, i) => row.forEach((v, j) => expect(v).toBeCloseTo(B[i][j], digits)))
}

/** Matrice simmetrica casuale n × n a seme. */
const randomSym = (n: number, seed: number) => {
  const rng = createRng(seed)
  const A = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) A[i][j] = A[j][i] = rng.normal()
  return A
}

describe('vettori e matrici', () => {
  it('prodotti, trasposta, traccia, forma quadratica', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32)
    expect(outer([1, 2], [3, 4])).toEqual([[3, 4], [6, 8]])
    expect(matMul([[1, 2], [3, 4]], [[5, 6], [7, 8]])).toEqual([[19, 22], [43, 50]])
    expect(matVec([[1, 2], [3, 4]], [1, 1])).toEqual([3, 7])
    expect(transpose([[1, 2, 3], [4, 5, 6]])).toEqual([[1, 4], [2, 5], [3, 6]])
    expect(trace([[1, 2], [3, 4]])).toBe(5)
    // xᵗAx con A = [[2, 1], [1, 3]], x = (1, 2): 2 + 4 + 12 = 18
    expect(quadForm([[2, 1], [1, 3]], [1, 2])).toBe(18)
    expect(identity(2)).toEqual([[1, 0], [0, 1]])
  })
  it('dimensioni incompatibili: RangeError', () => {
    expect(() => matMul([[1, 2]], [[1, 2]])).toThrow(RangeError)
    expect(() => dot([1], [1, 2])).toThrow(RangeError)
  })
  it('determinante, inversa e sistema lineare', () => {
    expect(det([[4, 7], [2, 6]])).toBeCloseTo(10, 12)
    // sviluppo sulla prima riga: 2·(3 − 2) − 0 + 1·(1 − 3) = 0
    expect(det([[2, 0, 1], [1, 3, 2], [1, 1, 1]])).toBeCloseTo(0, 12)
    expect(det([[2, 0, 1], [1, 3, 2], [1, 1, 2]])).toBeCloseTo(2 * (6 - 2) + 1 * (1 - 3), 12)
    close(inverse([[4, 7], [2, 6]])!, [[0.6, -0.7], [-0.2, 0.4]], 12)
    const A = randomSym(6, 3)
    close(matMul(A, inverse(A)!), identity(6), 9)
    expect(solve([[2, 1], [1, 3]], [3, 5])!.map((v) => Number(v.toFixed(12)))).toEqual([0.8, 1.4])
  })
  it('matrice singolare: det 0, inversa e sistema null', () => {
    expect(det([[1, 2], [2, 4]])).toBe(0)
    expect(inverse([[1, 2], [2, 4]])).toBeNull()
    expect(solve([[1, 2], [2, 4]], [1, 1])).toBeNull()
    expect(inverse([[1, 1, 1], [1, 1, 1], [0, 0, 1]])).toBeNull()
  })
  it('Cholesky e log-determinante', () => {
    const L = cholesky([[4, 2], [2, 3]])!
    close(L, [[2, 0], [1, Math.SQRT2]], 12)
    expect(logDetSym([[4, 2], [2, 3]])).toBeCloseTo(Math.log(8), 12)
    expect(cholesky([[1, 2], [2, 1]])).toBeNull()
    expect(isPositiveDefinite([[1, 2], [2, 1]])).toBe(false)
    expect(isPositiveDefinite([[2, 0], [0, 1e-3]])).toBe(true)
    // semidefinita ma non definita: 4 pixel allineati danno uno scatter singolare
    expect(isPositiveDefinite([[1, 1], [1, 1]])).toBe(false)
    expect(isPositiveSemidefinite([[1, 1], [1, 1]])).toBe(true)
    expect(isPositiveSemidefinite([[1, 2], [2, 1]])).toBe(false)
    expect(Number.isNaN(logDetSym([[1, 2], [2, 1]]))).toBe(true)
  })
})

describe('2 × 2 in forma chiusa', () => {
  it('det2, inv2, polinomio caratteristico', () => {
    expect(det2([[3, 1], [1, 2]])).toBe(5)
    close(inv2([[3, 1], [1, 2]])!, [[0.4, -0.2], [-0.2, 0.6]], 14)
    expect(inv2([[1, 2], [2, 4]])).toBeNull()
    const cp = charPoly2([[3, 1], [1, 2]])
    expect(cp.tr).toBe(5)
    expect(cp.det).toBe(5)
    expect(cp.coefficients).toEqual([1, -5, 5])
    expect(cp.roots[0]).toBeCloseTo((5 + Math.sqrt(5)) / 2, 14)
    expect(cp.roots[1]).toBeCloseTo((5 - Math.sqrt(5)) / 2, 14)
  })
  it('eig2Sym: autovalori ordinati, primo autovettore con angolo in (−90°, 90°]', () => {
    const e = eig2Sym([[2, 1], [1, 2]])
    expect(e.values[0]).toBeCloseTo(3, 14)
    expect(e.values[1]).toBeCloseTo(1, 14)
    expect(e.angle).toBeCloseTo(Math.PI / 4, 14)
    expect(e.vectors[0][0]).toBeCloseTo(Math.SQRT1_2, 14)
    expect(e.vectors[0][1]).toBeCloseTo(Math.SQRT1_2, 14)
    expect(dot(e.vectors[0], e.vectors[1])).toBeCloseTo(0, 14)
    // asse maggiore verticale
    const v = eig2Sym([[1, 0], [0, 4]])
    expect(v.values).toEqual([4, 1])
    expect(v.angle).toBeCloseTo(Math.PI / 2, 14)
    // correlazione negativa: asse maggiore a −45°
    expect(eig2Sym([[2, -1], [-1, 2]]).angle).toBeCloseTo(-Math.PI / 4, 14)
  })
  it('covarianza da σ₁, σ₂, ρ e dagli assi dell\'ellisse, che si invertono', () => {
    expect(covFromSigmas(2, 3, 0.5)).toEqual([[4, 3], [3, 9]])
    const S = covFromAxes(5, 2, 0.3)
    const e = eig2Sym(S)
    expect(e.values[0]).toBeCloseTo(5, 12)
    expect(e.values[1]).toBeCloseTo(2, 12)
    expect(e.angle).toBeCloseTo(0.3, 12)
  })
  it('ellisse di livello: semiassi k√λ e punti a distanza di Mahalanobis k', () => {
    const S = [[4, 0], [0, 1]] as const
    const el = ellipse2(S, 2)
    expect(el.rx).toBeCloseTo(4, 14)
    expect(el.ry).toBeCloseTo(2, 14)
    const Si = inv2(covFromSigmas(2, 1, 0.6))!
    const pts = ellipsePolygon([1, -1], covFromSigmas(2, 1, 0.6), 1.5, 24)
    expect(pts).toHaveLength(24)
    for (const p of pts) expect(quadForm(Si, [p[0] - 1, p[1] + 1])).toBeCloseTo(2.25, 10)
    expect(() => ellipse2([[1, 2], [2, 1]])).toThrow(RangeError)
  })
})

describe('Jacobi simmetrico', () => {
  it('matrice tridiagonale 3 × 3 con autovalori 2 − √2, 2, 2 + √2', () => {
    const r = eigSym([[2, -1, 0], [-1, 2, -1], [0, -1, 2]])
    expect(r.converged).toBe(true)
    expect(r.values[0]).toBeCloseTo(2 + Math.SQRT2, 13)
    expect(r.values[1]).toBeCloseTo(2, 13)
    expect(r.values[2]).toBeCloseTo(2 - Math.SQRT2, 13)
    // autovettore di 2 + √2: (1, −√2, 1)/2, con la componente più grande in modulo positiva → (−1, √2, −1)/2
    expect(r.vectors[0][1]).toBeCloseTo(Math.SQRT1_2, 13)
    expect(r.vectors[0][0]).toBeCloseTo(-0.5, 13)
  })
  it('ordine crescente e matrice già diagonale', () => {
    const r = eigSym([[1, 0, 0], [0, 3, 0], [0, 0, 2]], { order: 'asc' })
    expect(r.values).toEqual([1, 2, 3])
    expect(r.vectors[2]).toEqual([0, 1, 0])
    expect(r.sweeps).toBeLessThanOrEqual(1)
  })
  it('matrice casuale 40 × 40: A v = λ v, V ortonormale, somma degli autovalori = traccia', () => {
    const A = randomSym(40, 11)
    const r = eigSym(A)
    expect(r.converged).toBe(true)
    r.vectors.forEach((v, k) => {
      const Av = matVec(A, v)
      Av.forEach((x, i) => expect(x).toBeCloseTo(r.values[k] * v[i], 9))
    })
    for (let i = 0; i < 40; i += 7) for (let j = 0; j < 40; j += 5) expect(dot(r.vectors[i], r.vectors[j])).toBeCloseTo(i === j ? 1 : 0, 10)
    expect(r.values.reduce((s, v) => s + v, 0)).toBeCloseTo(trace(A), 9)
    for (let k = 1; k < 40; k++) expect(r.values[k]).toBeLessThanOrEqual(r.values[k - 1])
  })
  it('Toeplitz ρ^|i−j| con n = 200 (spectrum-nd): converge, traccia n, residuo piccolo', () => {
    const n = 200
    const rho = 0.9
    const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => rho ** Math.abs(i - j)))
    const t0 = performance.now()
    const r = eigSym(A)
    const ms = performance.now() - t0
    expect(r.converged).toBe(true)
    expect(r.values.reduce((s, v) => s + v, 0)).toBeCloseTo(n, 8)
    // autovalori di una Toeplitz di Kac-Murdock-Szegő: tutti in ((1−ρ)/(1+ρ), (1+ρ)/(1−ρ))
    expect(r.values[0]).toBeLessThan((1 + rho) / (1 - rho))
    expect(r.values[n - 1]).toBeGreaterThan((1 - rho) / (1 + rho))
    const v = r.vectors[0]
    const Av = matVec(A, v)
    let res = 0
    for (let i = 0; i < n; i++) res = Math.max(res, Math.abs(Av[i] - r.values[0] * v[i]))
    expect(res).toBeLessThan(1e-9)
    // al clic, non a ogni render: resta comunque sotto qualche secondo anche su una macchina lenta
    expect(ms).toBeLessThan(5000)
  })
  it('una covarianza di rango 1 ha un solo autovalore non nullo', () => {
    const u = [1, 2, 2]
    const r = eigSym(outer(u, u))
    expect(r.values[0]).toBeCloseTo(9, 12)
    expect(Math.abs(r.values[1])).toBeLessThan(1e-12)
    expect(rankFromEigen(r.values)).toBe(1)
    expect(conditionNumber(r.values)).toBe(Number.POSITIVE_INFINITY)
    expect(conditionNumber([4, 2])).toBe(2)
  })
  it('a lotti: step(budget) avanza a pezzi e arriva allo stesso risultato', () => {
    const A = randomSym(25, 5)
    const run = createJacobi(A)
    let calls = 0
    const off0 = run.offNorm()
    while (!run.step(40)) calls++
    expect(calls).toBeGreaterThan(5)
    expect(run.done).toBe(true)
    expect(run.offNorm()).toBeLessThan(off0 * 1e-12)
    const a = run.result()
    const b = eigSym(A)
    a.values.forEach((v, i) => expect(v).toBeCloseTo(b.values[i], 11))
  })
  it('una matrice non simmetrica o non quadrata è un errore', () => {
    expect(() => eigSym([[1, 2], [3, 4]])).toThrow(RangeError)
    expect(() => eigSym([[1, 2, 3]])).toThrow(RangeError)
  })
})

describe('polinomio caratteristico, radice quadrata, sbiancamento, autovalori generalizzati', () => {
  it('Faddeev-LeVerrier: det(λI − A) della tridiagonale è λ³ − 6λ² + 10λ − 4', () => {
    const c = charPoly([[2, -1, 0], [-1, 2, -1], [0, -1, 2]])
    ;[1, -6, 10, -4].forEach((v, i) => expect(c[i]).toBeCloseTo(v, 12))
    expect(charPoly([[3, 1], [1, 2]]).map((v) => Number(v.toFixed(12)))).toEqual([1, -5, 5])
  })
  it('radice quadrata simmetrica: R·R = S', () => {
    const S = [[4, 1, 0], [1, 3, 0.5], [0, 0.5, 2]]
    const R = sqrtSym(S)!
    close(matMul(R, R), S, 12)
    expect(sqrtSym([[1, 2], [2, 1]])).toBeNull()
  })
  it('sbiancamento PCA e ZCA: W Σ Wᵗ = I', () => {
    const S = [[4, 1.2], [1.2, 1]]
    for (const mode of ['pca', 'zca'] as const) {
      const W = whiteningMatrix(S, mode)!
      close(matMul(matMul(W, S), transpose(W)), identity(2), 12)
    }
    // ZCA è simmetrica, PCA no in generale
    const Z = whiteningMatrix(S, 'zca')!
    expect(Z[0][1]).toBeCloseTo(Z[1][0], 14)
    expect(whiteningMatrix([[1, 1], [1, 1]])).toBeNull()
  })
  it('S_B w = λ S_W w: la direzione di Fisher S_W⁻¹(m₁ − m₂) con λ = dᵗ S_W⁻¹ d', () => {
    const Sw = [[2, 0.5], [0.5, 1]]
    const d = [1, -1]
    const Sb = outer(d, d)
    const r = generalizedEigSym(Sb, Sw)!
    const w = solve(Sw, d)!
    const nw = Math.hypot(w[0], w[1])
    expect(Math.abs(dot(r.vectors[0], [w[0] / nw, w[1] / nw]))).toBeCloseTo(1, 12)
    expect(r.values[0]).toBeCloseTo(dot(d, w), 12)
    expect(Math.abs(r.values[1])).toBeLessThan(1e-12)
    expect(generalizedEigSym(Sb, [[1, 1], [1, 1]])).toBeNull()
  })
})
