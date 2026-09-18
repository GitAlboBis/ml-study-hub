import { describe, expect, it } from 'vitest'
import { parzen1d } from '../../lib/ml/nonparam'
import {
  DAYS,
  INITIAL,
  N_STEPS,
  bricks,
  dayCurve,
  daySamples,
  decimalsFor,
  empirical,
  estimateAt,
  histDomain,
  nearestFactor,
  relativeBound,
  requiredFactor,
  simulateDays,
  theoryAt,
  truthSlice,
} from './varianza-e-bound'

describe('m09-varianza-e-bound: i numeri della specifica', () => {
  it('stato iniziale: p̄̂(22) ≈ 0.177, varianza ≈ 0.00036, bound 0.399·0.177/(200·0.5) ≈ 0.00071, N·h = 100', () => {
    const st = theoryAt(INITIAL)
    expect(st.mean).toBeCloseTo(0.177, 3)
    expect(st.variance).toBeCloseTo(0.00036, 5)
    expect(st.bound).toBeCloseTo(0.000705, 5)
    expect(st.sup).toBeCloseTo(0.399, 3)
    expect(st.nhn).toBe(100)
  })

  it('i 300 giorni simulati danno media e varianza vicine alla teoria, sotto il bound', () => {
    const vals = simulateDays(INITIAL, 1)
    expect(vals).toHaveLength(DAYS)
    const e = empirical(vals, DAYS)
    const st = theoryAt(INITIAL)
    expect(e.mean).toBeCloseTo(st.mean, 2)
    expect(e.variance / st.variance).toBeGreaterThan(0.75)
    expect(e.variance / st.variance).toBeLessThan(1.3)
    expect(e.variance).toBeLessThan(st.bound)
  })

  it('raddoppiare N dimezza varianza e bound; dimezzare h li raddoppia circa', () => {
    const a = theoryAt(INITIAL)
    const b = theoryAt({ ...INITIAL, N: 400 })
    expect(a.bound / b.bound).toBeCloseTo(2, 10)
    expect(a.variance / b.variance).toBeCloseTo(2, 10)
    const c = theoryAt({ ...INITIAL, h: 0.25 })
    expect(c.bound / a.bound).toBeGreaterThan(1.9)
    expect(c.bound / a.bound).toBeLessThan(2.2)
  })

  it('il kernel cambia sup γ: 1 rettangolare e triangolare, 0.399 gaussiano, 0.5 esponenziale, 0.318 Cauchy', () => {
    expect(theoryAt({ ...INITIAL, kernel: 'rettangolare' }).sup).toBe(1)
    expect(theoryAt({ ...INITIAL, kernel: 'triangolare' }).sup).toBe(1)
    expect(theoryAt({ ...INITIAL, kernel: 'esponenziale' }).sup).toBe(0.5)
    expect(theoryAt({ ...INITIAL, kernel: 'cauchy' }).sup).toBeCloseTo(0.318, 3)
    for (const kernel of ['rettangolare', 'triangolare', 'esponenziale', 'cauchy'] as const) {
      const st = theoryAt({ ...INITIAL, kernel })
      expect(st.variance, kernel).toBeLessThan(st.bound)
    }
  })

  it('bound relativo in 1, 2, 3 dimensioni: 13%, 22%, 40%', () => {
    expect(Math.round(relativeBound(1) * 100)).toBe(13)
    expect(Math.round(relativeBound(2) * 100)).toBe(22)
    expect(Math.round(relativeBound(3) * 100)).toBe(40)
  })

  it('in n dimensioni la stima nel punto usa il kernel prodotto e il volume hⁿ', () => {
    const p = { ...INITIAL, n: 2 as const }
    const pts = daySamples(p, 3, 0)
    expect(pts[0]).toHaveLength(2)
    const direct = pts.reduce((s, pt) => s + Math.exp(-0.5 * (((22 - pt[0]) / 0.5) ** 2 + ((22 - pt[1]) / 0.5) ** 2)) / (2 * Math.PI), 0) / (pts.length * 0.25)
    expect(estimateAt(22, pts, 0.5, 'gaussiano', 2)).toBeCloseTo(direct, 10)
    expect(dayCurve([22], pts, 0.5, 'gaussiano', 2)[0]).toBeCloseTo(direct, 10)
    const st = theoryAt(p)
    expect(st.mean).toBeLessThan(truthSlice(22, 2) * 1.01)
  })

  it('in 1-D la curva del giorno è la stima di Parzen della libreria', () => {
    const pts = daySamples(INITIAL, 2, 5)
    const xs = [18, 22, 26.5]
    const c = dayCurve(xs, pts, 0.5, 'triangolare', 1)
    xs.forEach((x, i) => expect(c[i]).toBeCloseTo(parzen1d(x, pts.map((p) => p[0]), 0.5, 'triangolare'), 12))
  })

  it('i mattoncini si impilano nel loro bin', () => {
    const b = bricks([0.15, 0.15, 0.35, 0.15], 4, [0, 0.4], 4)
    expect(b).toEqual([
      { bin: 1, level: 0 },
      { bin: 1, level: 1 },
      { bin: 3, level: 0 },
      { bin: 1, level: 2 },
    ])
    const d = histDomain(theoryAt(INITIAL))
    expect(d[0]).toBeLessThan(0.177)
    expect(d[1]).toBeGreaterThan(0.177)
  })

  it('la sfida: con h dimezzato N va moltiplicato per 2 in 1-D e per 8 in 3-D', () => {
    expect(nearestFactor(requiredFactor(1))).toBe(2)
    expect(nearestFactor(requiredFactor(3))).toBe(8)
    expect(nearestFactor(requiredFactor(2))).toBe(4)
  })

  it('scala di N e decimali delle formule', () => {
    expect(N_STEPS[0]).toBe(10)
    expect(N_STEPS).toContain(200)
    expect(N_STEPS.at(-1)).toBe(2000)
    expect(decimalsFor(0.000705)).toBe(6)
    expect(decimalsFor(0.177)).toBe(3)
  })
})
