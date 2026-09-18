import { describe, expect, it } from 'vitest'
import { parzen2d } from '../../lib/ml/nonparam'
import { DOMAIN, GRID_N, H1S, ROWS, cellFor, consistentLaw, expectedInWindow, hOf, lawVerdict, nh2, samples2d, truthGrid } from './griglia-normale-2d'
import { blendGrid, needles, project, ridges } from './proprieta/surface'

describe('m09-griglia-normale-2d: la logica', () => {
  it('i numeri della specifica: con la legge della slide h_N = 0.01 a N = 100 e N·h_N² = h₁²/N (1, 0.1, 0.01)', () => {
    expect(hOf('slide', 1, 100)).toBeCloseTo(0.01, 12)
    expect([1, 10, 100].map((N) => nh2('slide', 1, N))).toEqual([1, 0.1, 0.010000000000000002].map((v) => expect.closeTo(v, 12)))
    expect(nh2('radice', 0.5, 100)).toBeCloseTo(0.25, 12)
    expect(hOf('quarta', 1, 10)).toBeCloseTo(0.562, 3)
    expect(hOf('quarta', 1, 100)).toBeCloseTo(0.316, 3)
    expect(nh2('quarta', 1, 10)).toBeCloseTo(Math.sqrt(10), 10)
    expect(nh2('quarta', 1, 100)).toBeCloseTo(10, 10)
  })

  it('le condizioni in 2-D: slide rossa (→ 0), radice in bilico (costante), quarta verde (→ ∞)', () => {
    expect(lawVerdict('slide').nhn).toBe('zero')
    expect(lawVerdict('radice').nhn).toBe('const')
    expect(lawVerdict('quarta').nhn).toBe('inf')
    expect(lawVerdict('slide').h).toBe('zero')
    expect(consistentLaw()).toBe('quarta')
  })

  it('le celle: la superficie è la stima di Parzen 2-D gaussiana; con h piccolo diventa ad aghi; N = ∞ è la verità', () => {
    const pts = samples2d(1)
    const c = cellFor('radice', 1, 10, pts)
    expect(c.spikes).toBe(false)
    const mid = Math.floor(GRID_N / 2)
    // il centro della griglia è (0, 0)
    expect(c.z[mid * GRID_N + mid]).toBeCloseTo(parzen2d([0, 0], pts.slice(0, 10), c.h, 'gaussiano'), 10)
    const s = cellFor('slide', 0.1, 100, pts)
    expect(s.spikes).toBe(true)
    expect(s.peak).toBeCloseTo(1 / (100 * 2 * Math.PI * 1e-6), 3)
    expect(cellFor('slide', 1, ROWS[3], pts).z).toBe(truthGrid())
    expect(truthGrid()[mid * GRID_N + mid]).toBeCloseTo(1 / (2 * Math.PI), 10)
    expect(H1S).toEqual([1, 0.5, 0.1])
  })

  it('il confronto 1-D / 2-D: nella finestra circa 12 campioni contro 1.4', () => {
    expect(expectedInWindow(1)).toBeCloseTo(11.97, 2)
    expect(expectedInWindow(2)).toBeCloseTo(1.43, 2)
  })

  it('la proiezione: la base sta nel riquadro per ogni azimut, le creste vanno dal fondo al davanti', () => {
    const box = { domain: DOMAIN, zMax: 0.25 }
    for (const az of [-3, -1, 0, 0.7, 2]) {
      for (const [x, y] of [
        [-2, -2],
        [2, 2],
        [-2, 2],
      ]) {
        const [sx, sy] = project(x, y, 0, box, { az, el: 0.55 })
        expect(sx).toBeGreaterThanOrEqual(0)
        expect(sx).toBeLessThanOrEqual(1)
        expect(sy).toBeGreaterThanOrEqual(0)
        expect(sy).toBeLessThanOrEqual(1)
      }
    }
    const r = ridges(truthGrid(), GRID_N, box, { az: -0.6, el: 0.55 }, 200, 140)
    expect(r).toHaveLength(GRID_N)
    for (let i = 1; i < r.length; i++) expect(r[i].depth).toBeLessThanOrEqual(r[i - 1].depth)
    const nd = needles([[0, 0]], 10, box, { az: 0, el: 0.55 }, 200, 140)
    expect(nd[0].over).toBe(true)
    expect(blendGrid(new Float64Array([0, 2]), new Float64Array([2, 4]), 0.5)).toEqual(new Float64Array([1, 3]))
  })
})
