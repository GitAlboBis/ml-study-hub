import { describe, expect, it } from 'vitest'
import { axisTips, eig2, ellipsePoints, fromEigen, isPsd, mahalanobis2, massInside, rotateSigma, sigmaForMass, stretchSigma } from './ellipseGeometry'

describe('autovalori e autovettori di Σ 2 × 2', () => {
  it('matrice diagonale: gli assi sono gli assi coordinati', () => {
    const e = eig2([
      [4, 0],
      [0, 1],
    ])
    expect(e.l1).toBe(4)
    expect(e.l2).toBe(1)
    expect(e.phi).toBe(0)
    expect(e.e1[0]).toBeCloseTo(1, 12)
    expect(e.e1[1]).toBeCloseTo(0, 12)
  })

  it('asse maggiore verticale: φ = 90°', () => {
    const e = eig2([
      [1, 0],
      [0, 9],
    ])
    expect(e.l1).toBe(9)
    expect(e.l2).toBe(1)
    expect(e.phi).toBe(90)
  })

  it('[[2, 1], [1, 2]]: λ = 3 e 1, asse maggiore a 45°', () => {
    const e = eig2([
      [2, 1],
      [1, 2],
    ])
    expect(e.l1).toBeCloseTo(3, 12)
    expect(e.l2).toBeCloseTo(1, 12)
    expect(e.phi).toBeCloseTo(45, 10)
    // autovettori ortonormali
    expect(e.e1[0] * e.e2[0] + e.e1[1] * e.e2[1]).toBeCloseTo(0, 12)
    expect(Math.hypot(...e.e2)).toBeCloseTo(1, 12)
  })

  it('correlazione negativa: asse maggiore a 135°', () => {
    const e = eig2([
      [2, -1],
      [-1, 2],
    ])
    expect(e.phi).toBeCloseTo(135, 10)
  })

  it('fromEigen ricostruisce Σ = R diag(λ) Rᵗ', () => {
    const S = fromEigen(3, 1, 45)
    expect(S[0][0]).toBeCloseTo(2, 12)
    expect(S[0][1]).toBeCloseTo(1, 12)
    expect(S[1][0]).toBeCloseTo(1, 12)
    expect(S[1][1]).toBeCloseTo(2, 12)
  })

  it('isPsd: semidefinita sì, indefinita no, singolare sì', () => {
    expect(isPsd([[2, 1], [1, 2]])).toBe(true)
    expect(isPsd([[1, 2], [2, 1]])).toBe(false)
    expect(isPsd([[1, 1], [1, 1]])).toBe(true)
    expect(isPsd([[1, 0], [0.5, 1]])).toBe(false)
  })
})

describe('ellissi di livello', () => {
  it('massa dentro l’ellisse di Mahalanobis k in 2D: 1 − e^{−k²/2}', () => {
    expect(massInside(1)).toBeCloseTo(0.3935, 4)
    expect(massInside(2)).toBeCloseTo(0.8647, 4)
    expect(sigmaForMass(0.95)).toBeCloseTo(2.4477, 4)
    expect(massInside(sigmaForMass(0.5))).toBeCloseTo(0.5, 12)
  })

  it('ogni punto dell’ellisse sta a distanza di Mahalanobis k dalla media', () => {
    const m = [1, -2] as const
    const S = [
      [3, 1.2],
      [1.2, 1],
    ] as const
    for (const k of [1, 2]) {
      const pts = ellipsePoints(m, S, k, 48)
      expect(pts.length).toBe(49)
      for (const p of pts) expect(mahalanobis2(p, m, S)).toBeCloseTo(k * k, 9)
    }
  })

  it('Σ singolare: l’ellisse degenera in un segmento lungo l’autovettore', () => {
    const pts = ellipsePoints([0, 0], [[1, 1], [1, 1]], 1, 16)
    expect(pts.length).toBeGreaterThan(1)
    for (const p of pts) expect(p[0]).toBeCloseTo(p[1], 12)
    const far = Math.max(...pts.map((p) => Math.hypot(p[0], p[1])))
    expect(far).toBeCloseTo(Math.sqrt(2), 9)
  })

  it('Σ non valida: nessuna ellisse', () => {
    expect(ellipsePoints([0, 0], [[1, 2], [2, 1]], 1)).toEqual([])
  })

  it('punte dei semiassi a k√λ lungo gli autovettori', () => {
    const t = axisTips([1, 1], [[4, 0], [0, 1]], 2)
    expect(t.major[0]).toBeCloseTo(5, 12)
    expect(t.major[1]).toBeCloseTo(1, 12)
    expect(t.minor[0]).toBeCloseTo(1, 12)
    expect(t.minor[1]).toBeCloseTo(3, 12)
  })
})

describe('maniglie: ruotare e allungare Σ', () => {
  it('rotateSigma cambia φ e tiene gli autovalori', () => {
    const S = rotateSigma([[4, 0], [0, 1]], 90)
    const e = eig2(S)
    expect(e.l1).toBeCloseTo(4, 12)
    expect(e.l2).toBeCloseTo(1, 12)
    expect(e.phi).toBeCloseTo(90, 10)
  })

  it('stretchSigma porta il semiasse al valore chiesto (in unità del dominio, al livello k)', () => {
    const S = stretchSigma([[4, 0], [0, 1]], 'major', 6, 2)
    // semiasse 6 al livello 2 → √λ1 = 3 → λ1 = 9
    const e = eig2(S)
    expect(e.l1).toBeCloseTo(9, 12)
    expect(e.l2).toBeCloseTo(1, 12)
    // il semiasse minore oltre il maggiore: i ruoli si scambiano, l'ellisse resta quella chiesta
    const T = stretchSigma([[4, 0], [0, 1]], 'minor', 3, 1)
    const f = eig2(T)
    expect(f.l1).toBeCloseTo(9, 12)
    expect(f.l2).toBeCloseTo(4, 12)
    expect(f.phi).toBeCloseTo(90, 10)
    // mai sotto il minimo
    expect(eig2(stretchSigma([[4, 0], [0, 1]], 'minor', 0, 1, 0.01)).l2).toBeCloseTo(0.01, 12)
  })
})
