import { describe, expect, it } from 'vitest'
import { SIGMA_NORM, SIGMA_ORIG, apply, averageShare, bestSigma, decompose, dominantInMeters, params, salmons, stats, transformAt } from './normalizza'

describe('m09-normalizza-le-feature: la logica', () => {
  const fish = salmons()
  const st = stats(fish)

  it('30 salmoni con le due coppie della specifica e medie/deviazioni esatte', () => {
    expect(fish).toHaveLength(30)
    expect(fish[0]).toEqual([4.2, 520])
    expect(fish[1]).toEqual([5.1, 610])
    expect(st.mean[0]).toBeCloseTo(4.6, 3)
    expect(st.sd[0]).toBeCloseTo(1.2, 3)
    expect(st.mean[1]).toBeCloseTo(600, 1)
    expect(st.sd[1]).toBeCloseTo(110, 1)
    expect(st.min[0]).toBeGreaterThan(0)
    expect(st.max[0]).toBeLessThan(10)
  })

  it('i numeri della specifica: 0.81 + 8100 (99.99% lunghezza), poi 0.56 contro 0.67 (46% e 54%)', () => {
    const d = decompose(fish[0], fish[1])
    expect(d.parts[0]).toBeCloseTo(0.81, 10)
    expect(d.parts[1]).toBeCloseTo(8100, 8)
    expect(d.share[1]).toBeGreaterThan(0.9998)
    const p = params(st, 'zscore')
    const tr = transformAt(1, p)
    const z = decompose(apply(fish[0], tr), apply(fish[1], tr))
    expect(z.parts[0]).toBeCloseTo(0.5625, 2)
    expect(z.parts[1]).toBeCloseTo(0.6694, 2)
    expect(Math.round(z.share[0] * 100)).toBe(46)
    expect(Math.round(z.share[1] * 100)).toBe(54)
  })

  it('la trasformazione animata: prima centra, poi scala; a metà strada è già centrata', () => {
    const p = params(st, 'zscore')
    const t0 = transformAt(0, p)
    expect(apply(fish[0], t0)).toEqual(fish[0])
    const tc = transformAt(0.4, p)
    expect(tc.center).toBe(1)
    expect(tc.scale).toBe(0)
    const t1 = transformAt(1, p)
    const z = fish.map((f) => apply(f, t1))
    const zs = stats(z)
    expect(zs.mean[0]).toBeCloseTo(0, 6)
    expect(zs.sd[1]).toBeCloseTo(1, 6)
    const mm = fish.map((f) => apply(f, transformAt(1, params(st, 'minmax'))))
    expect(Math.min(...mm.map((f) => f[0]))).toBeCloseTo(0, 10)
    expect(Math.max(...mm.map((f) => f[1]))).toBeCloseTo(1, 10)
  })

  it('in media la lunghezza domina nelle unità originali, dopo la z-score le due feature pesano uguale', () => {
    expect(averageShare(fish)[1]).toBeGreaterThan(0.999)
    const z = fish.map((f) => apply(f, transformAt(1, params(st, 'zscore'))))
    expect(averageShare(z)[0]).toBeCloseTo(0.5, 6)
  })

  it('la sfida: in metri dominerebbe la luminosità; nelle unità normalizzate la leave-one-out ha un massimo interno', () => {
    expect(dominantInMeters(st)).toBe('luminosita')
    const z = fish.map((f) => apply(f, transformAt(1, params(st, 'zscore'))))
    const s = bestSigma(z, SIGMA_NORM)
    expect(s).toBeGreaterThan(SIGMA_NORM[0])
    expect(s).toBeLessThan(SIGMA_NORM.at(-1)!)
    expect(SIGMA_ORIG).toContain(20)
    expect(SIGMA_NORM).toContain(0.4)
  })
})
