import { describe, expect, it } from 'vitest'
import { kernelValue, parzen1d } from '../../lib/ml/nonparam'
import { linspace, mixturePdf, normalPdf, trapz } from '../../lib/ml/stats'
import {
  binnedGaussKde,
  blurMixture,
  expectedEstimate,
  gammaOf,
  jumpPoints,
  kde,
  maximaAt,
  mixtureSamples,
  morphGamma,
  niceSteps,
  segmentAbove,
} from './parzen-lab'

describe('parzen-lab: stima generale con un kernel qualsiasi', () => {
  const samples = [3.2, 4.1, 6.0]

  it('con un kernel del corso coincide con parzen1d', () => {
    const xs = linspace(0, 9, 91)
    for (const k of ['rettangolare', 'triangolare', 'gaussiano', 'epanechnikov'] as const) {
      const ys = kde(xs, samples, 1, gammaOf(k))
      xs.forEach((x, i) => expect(ys[i]).toBeCloseTo(parzen1d(x, samples, 1, k), 12))
    }
  })

  it('il peso si può cambiare (la somma senza 1/N) e un kernel a supporto compatto non conta fuori', () => {
    const xs = [4.5]
    expect(kde(xs, samples, 1, gammaOf('rettangolare'), { weight: 1 })[0]).toBe(1)
    expect(kde(xs, samples, 1, gammaOf('gaussiano'), { support: 4.3 })[0]).toBeCloseTo(parzen1d(4.5, samples, 1, 'gaussiano'), 6)
  })

  it('nessun campione: zero ovunque', () => {
    expect(kde([1, 2], [], 1, gammaOf('gaussiano'))).toEqual([0, 0])
  })
})

describe('parzen-lab: letture delle curve', () => {
  it('i salti del rettangolare sono x_k ± h/2, ordinati e senza doppioni', () => {
    expect(jumpPoints([2, 3], 2, [0, 6])).toEqual([1, 2, 3, 4])
    expect(jumpPoints([2, 3], 1, [0, 6])).toEqual([1.5, 2.5, 3.5])
    expect(jumpPoints([0.2], 1, [0, 6])).toEqual([0.7])
  })

  it('i massimi locali sono le ascisse dei picchi (al centro dei pianori)', () => {
    const xs = linspace(0, 6, 601)
    const two = xs.map((x) => normalPdf(x, 2, 0.3) + normalPdf(x, 4, 0.3))
    const at = maximaAt(xs, two)
    expect(at).toHaveLength(2)
    expect(at[0]).toBeCloseTo(2, 2)
    expect(at[1]).toBeCloseTo(4, 2)
    // pianoro: un solo massimo al centro
    const flat = [0, 1, 2, 2, 2, 1, 0]
    expect(maximaAt([0, 1, 2, 3, 4, 5, 6], flat)).toEqual([3])
  })

  it('segmentAbove trova l\'intervallo contiguo attorno a un punto in cui una curva supera la soglia', () => {
    const xs = linspace(0, 10, 101)
    const ys = xs.map((x) => (x > 3 && x < 6 ? 1 : 0))
    const seg = segmentAbove(xs, ys, 0.5, 4.5)
    expect(seg).not.toBeNull()
    expect(seg![0]).toBeCloseTo(3.1, 6)
    expect(seg![1]).toBeCloseTo(5.9, 6)
    expect(segmentAbove(xs, ys, 0.5, 8)).toBeNull()
  })
})

describe('parzen-lab: la media della stima (convoluzione)', () => {
  const comps = [
    { weight: 0.8, mu: 850, sigma: 40 },
    { weight: 0.2, mu: 560, sigma: 30 },
  ]

  it('gaussiana su gaussiana: le varianze si sommano (der11)', () => {
    const blurred = blurMixture(comps, 40)
    expect(blurred[0].sigma).toBeCloseTo(Math.sqrt(40 ** 2 + 40 ** 2), 12)
    expect(blurred[1].weight).toBe(0.2)
  })

  it('la convoluzione numerica con il gaussiano torna con la forma chiusa', () => {
    const xs = linspace(400, 1000, 61)
    const vs = linspace(300, 1100, 1601)
    const num = expectedEstimate(xs, (v) => mixturePdf(v, comps), 40, gammaOf('gaussiano'), vs)
    const closed = xs.map((x) => mixturePdf(x, blurMixture(comps, 40)))
    xs.forEach((_, i) => expect(num[i]).toBeCloseTo(closed[i], 6))
  })

  it('la media della stima ha area 1 anche con il rettangolare', () => {
    const vs = linspace(200, 1200, 2001)
    const xs = linspace(300, 1100, 801)
    const e = expectedEstimate(xs, (v) => mixturePdf(v, comps), 60, gammaOf('rettangolare'), vs)
    expect(trapz(xs, e)).toBeCloseTo(1, 3)
  })
})

describe('parzen-lab: dati a seed', () => {
  const comps = [{ weight: 1, mu: 4, sigma: 3 }]

  it('stesso seed, stessi campioni; tutti dentro il dominio e arrotondati', () => {
    const a = mixtureSamples(7, 50, comps, [0, 8], 1)
    const b = mixtureSamples(7, 50, comps, [0, 8], 1)
    expect(a).toEqual(b)
    expect(a).toHaveLength(50)
    for (const v of a) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(8)
      expect(Number(v.toFixed(1))).toBe(v)
    }
    expect(mixtureSamples(8, 50, comps, [0, 8], 1)).not.toEqual(a)
  })

  it('i primi n campioni non cambiano quando n cresce (lo slider di N aggiunge, non rimescola)', () => {
    const small = mixtureSamples(3, 20, comps, [0, 8])
    const big = mixtureSamples(3, 200, comps, [0, 8])
    expect(big.slice(0, 20)).toEqual(small)
  })
})

describe('parzen-lab: stima gaussiana a bin per N grandi', () => {
  it('su una griglia fine coincide con la stima esatta a meno di un millesimo del picco', () => {
    const samples = mixtureSamples(11, 400, [{ weight: 0.45, mu: 0.35, sigma: 0.1 }, { weight: 0.55, mu: 1.4, sigma: 0.35 }], [0, 2.5], 4)
    const grid = linspace(0, 2.5, 1001)
    for (const h of [0.02, 0.1, 0.5]) {
      const fast = binnedGaussKde(grid, samples, h)
      const exact = grid.map((x) => parzen1d(x, samples, h, 'gaussiano'))
      const peak = Math.max(...exact)
      grid.forEach((_, i) => expect(Math.abs(fast[i] - exact[i])).toBeLessThan(peak * 2e-3))
    }
  })
})

describe('parzen-lab: morphing fra kernel', () => {
  it('ogni fase del morphing è ancora una densità (combinazione convessa di densità)', () => {
    const us = linspace(-8, 8, 16001)
    for (const t of [0, 0.3, 0.7, 1]) {
      const g = morphGamma(gammaOf('rettangolare'), gammaOf('gaussiano'), t)
      // i trapezi contano mezzo nodo in più su ognuno dei due salti del rettangolare
      expect(trapz(us, us.map(g))).toBeCloseTo(1, 2)
    }
    expect(morphGamma(gammaOf('rettangolare'), gammaOf('gaussiano'), 0)(0.4)).toBe(kernelValue(0.4, 'rettangolare'))
    expect(morphGamma(gammaOf('rettangolare'), gammaOf('gaussiano'), 1)(0.4)).toBe(kernelValue(0.4, 'gaussiano'))
  })
})

describe('parzen-lab: scale a valori tondi', () => {
  it('niceSteps restituisce valori tondi crescenti fra gli estremi, estremi compresi', () => {
    const s = niceSteps(10, 5000)
    expect(s[0]).toBe(10)
    expect(s.at(-1)).toBe(5000)
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThan(s[i - 1])
    for (const v of [20, 50, 100, 200, 500, 1000, 2000]) expect(s).toContain(v)
  })
})
