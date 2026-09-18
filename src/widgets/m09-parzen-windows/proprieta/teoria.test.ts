import { describe, expect, it } from 'vitest'
import { createRng } from '../../../lib/rng'
import { kernelValue, parzen1d } from '../../../lib/ml/nonparam'
import { linspace, mean, trapz, variance } from '../../../lib/ml/stats'
import {
  binCounts,
  bimodalPdf,
  convolveGauss,
  integratedErrors,
  intLogSteps,
  kdeFromBins,
  lawLimits,
  mixPdf,
  overlap,
  pointGaussMoments,
  pointMoments,
  pointStats,
  powerLimit,
  sampleBimodal,
  sampleBinomial,
  sampleMix,
  simpson,
  supGamma,
} from './teoria'
import type { Comp } from './teoria'

const SERRA: Comp[] = [
  { w: 0.7, mu: 22, s: 1.5 },
  { w: 0.3, mu: 27, s: 1.2 },
]

describe('mistura e convoluzione con il kernel gaussiano', () => {
  it('la mistura integra a 1 e la media della stima è la mistura con s² + h²', () => {
    const xs = linspace(10, 40, 3001)
    expect(trapz(xs, xs.map((x) => mixPdf(x, SERRA)))).toBeCloseTo(1, 5)
    const sm = convolveGauss(SERRA, 0.5)
    expect(sm[0].s).toBeCloseTo(Math.sqrt(2.25 + 0.25), 12)
    // E{p̂(22)} della specifica: circa 0.177
    expect(mixPdf(22, sm)).toBeCloseTo(0.1766, 3)
  })

  it('overlap(0) è ∫p² calcolato a mano', () => {
    const xs = linspace(10, 40, 6001)
    expect(overlap(SERRA, 0)).toBeCloseTo(trapz(xs, xs.map((x) => mixPdf(x, SERRA) ** 2)), 6)
  })

  it('momenti puntuali gaussiani in forma chiusa = quadratura numerica', () => {
    const closed = pointGaussMoments(22, SERRA, 0.5)
    const num = pointMoments(22, (t) => mixPdf(t, SERRA), 0.5, 'gaussiano')
    expect(num.mean).toBeCloseTo(closed.mean, 6)
    expect(num.second).toBeCloseTo(closed.second, 6)
  })

  it('i numeri della specifica m09-varianza-e-bound: varianza ≈ 0.00036, bound 0.399·0.177/(200·0.5) ≈ 0.00071', () => {
    const st = pointStats(pointGaussMoments(22, SERRA, 0.5), { N: 200, h: 0.5, n: 1, kernel: 'gaussiano' })
    expect(st.variance).toBeCloseTo(0.000355, 5)
    expect(st.bound).toBeCloseTo(0.000705, 5)
    expect(st.variance).toBeLessThan(st.bound)
  })

  it('con il gaussiano e h piccolo il bound è circa √2 = 1.41 volte la varianza', () => {
    const st = pointStats(pointGaussMoments(22, SERRA, 0.02), { N: 200, h: 0.02, n: 1, kernel: 'gaussiano' })
    expect(st.bound / st.variance).toBeGreaterThan(1.38)
    expect(st.bound / st.variance).toBeLessThan(1.45)
  })

  it('il bound vale per ogni kernel del selettore (γ ≥ 0 e limitato)', () => {
    for (const k of ['gaussiano', 'rettangolare', 'triangolare', 'esponenziale', 'cauchy'] as const) {
      for (const h of [0.1, 0.5, 2]) {
        const st = pointStats(pointMoments(22, (t) => mixPdf(t, SERRA), h, k), { N: 200, h, n: 1, kernel: k })
        expect(st.variance, `${k} h=${h}`).toBeGreaterThan(0)
        expect(st.variance, `${k} h=${h}`).toBeLessThanOrEqual(st.bound * (1 + 1e-9))
      }
    }
  })

  it('la media numerica per ogni kernel è la stima di Parzen mediata su tanti training set', () => {
    const rng = createRng(7)
    const vals = Array.from({ length: 1500 }, () => parzen1d(22, sampleMix(rng, 200, SERRA), 0.5, 'triangolare'))
    const m = pointMoments(22, (t) => mixPdf(t, SERRA), 0.5, 'triangolare')
    expect(mean(vals)).toBeCloseTo(m.mean, 2)
    const st = pointStats(m, { N: 200, h: 0.5, n: 1, kernel: 'triangolare' })
    expect(variance(vals) / st.variance).toBeGreaterThan(0.85)
    expect(variance(vals) / st.variance).toBeLessThan(1.15)
  })

  it('sup γ = γ(0) per i kernel del corso', () => {
    expect(supGamma('gaussiano')).toBeCloseTo(0.3989, 4)
    expect(supGamma('rettangolare')).toBe(1)
    expect(supGamma('triangolare')).toBe(1)
    expect(supGamma('esponenziale')).toBe(0.5)
    expect(supGamma('cauchy')).toBeCloseTo(0.3183, 4)
    expect(supGamma('gaussiano', 2)).toBeCloseTo(1 / (2 * Math.PI), 10)
  })
})

describe('errori integrati (bias², varianza, MISE) in forma chiusa', () => {
  const PESCE: Comp[] = [
    { w: 0.7, mu: 0, s: 0.6 },
    { w: 0.3, mu: 1.5, s: 0.7 },
  ]

  it('coincidono con l’integrazione numerica dei valori puntuali', () => {
    const h = 0.3
    const N = 50
    const xs = linspace(-5, 7, 4001)
    const b2 = trapz(xs, xs.map((x) => (mixPdf(x, convolveGauss(PESCE, h)) - mixPdf(x, PESCE)) ** 2))
    const v = trapz(xs, xs.map((x) => pointStats(pointGaussMoments(x, PESCE, h), { N, h, n: 1, kernel: 'gaussiano' }).variance))
    const e = integratedErrors(PESCE, h, N, 1)
    expect(e.bias2).toBeCloseTo(b2, 7)
    expect(e.variance).toBeCloseTo(v, 7)
    expect(e.mise).toBeCloseTo(b2 + v, 7)
  })

  it('h costante: il bias² non dipende da N, la varianza scende come 1/N', () => {
    const a = integratedErrors(PESCE, 0.4, 100, 1)
    const b = integratedErrors(PESCE, 0.4, 10000, 1)
    expect(b.bias2).toBeCloseTo(a.bias2, 12)
    expect(a.variance / b.variance).toBeCloseTo(100, 6)
  })

  it('in n dimensioni (feature indipendenti) la varianza a parità di N e h cresce con n', () => {
    const e1 = integratedErrors(PESCE, 0.3, 1000, 1)
    const e3 = integratedErrors(PESCE, 0.3, 1000, 3)
    expect(e3.variance).toBeGreaterThan(e1.variance)
  })
})

describe('leggi h_N = h_1·N^(−a) e condizioni di consistenza', () => {
  it('powerLimit dice dove va N^e', () => {
    expect(powerLimit(-0.5)).toBe('zero')
    expect(powerLimit(0)).toBe('const')
    expect(powerLimit(0.5)).toBe('inf')
  })

  it('Melgani a = 1/(2n) soddisfa entrambe le condizioni; a = 0 e a = 1.2/n no', () => {
    for (const n of [1, 2, 3]) {
      expect(lawLimits(1 / (2 * n), n)).toEqual({ h: 'zero', nhn: 'inf', consistent: true })
      expect(lawLimits(0, n)).toEqual({ h: 'const', nhn: 'inf', consistent: false })
      expect(lawLimits(1.2 / n, n)).toEqual({ h: 'zero', nhn: 'zero', consistent: false })
      expect(lawLimits(1 / n, n).nhn).toBe('const')
    }
  })
})

describe('campionamento', () => {
  it('binomiale: media N·p e varianza N·p·q, per N piccoli e grandi', () => {
    for (const [N, p] of [
      [50, 0.19],
      [20000, 0.004],
      [20000, 0.3],
      [5, 0.97],
    ] as const) {
      const rng = createRng(3)
      const ks = Array.from({ length: 4000 }, () => sampleBinomial(rng, N, p))
      expect(ks.every((k) => Number.isInteger(k) && k >= 0 && k <= N)).toBe(true)
      expect(mean(ks) / (N * p)).toBeCloseTo(1, 1)
      expect(variance(ks) / (N * p * (1 - p))).toBeGreaterThan(0.85)
      expect(variance(ks) / (N * p * (1 - p))).toBeLessThan(1.15)
    }
  })

  it('la bimodale triangolo + rettangolo integra a 1, alta 2/3, e i campioni le somigliano', () => {
    const xs = linspace(0, 4, 4001)
    expect(trapz(xs, xs.map(bimodalPdf))).toBeCloseTo(1, 2)
    expect(bimodalPdf(1.5)).toBeCloseTo(2 / 3, 10)
    expect(bimodalPdf(3.25)).toBeCloseTo(2 / 3, 10)
    expect(bimodalPdf(2.75)).toBe(0)
    const rng = createRng(5)
    const s = Array.from({ length: 6000 }, () => sampleBimodal(rng))
    const inRect = s.filter((v) => v >= 3 && v <= 3.5).length / s.length
    expect(inRect).toBeCloseTo(1 / 3, 1)
  })
})

describe('strumenti numerici', () => {
  it('simpson integra un polinomio di terzo grado esattamente', () => {
    expect(simpson((x) => x ** 3 - 2 * x + 1, -1, 2, 10)).toBeCloseTo(0.25 * 16 - 0.25 - (4 - 1) + 3, 10)
  })

  it('la stima da conteggi per bin approssima la stima esatta quando i bin sono stretti', () => {
    const rng = createRng(11)
    const samples = sampleMix(rng, 500, SERRA)
    const counts = binCounts(samples, [10, 40], 3000)
    const xs = linspace(15, 32, 50)
    const approx = kdeFromBins(counts, samples.length, [10, 40], xs, 0.5)
    xs.forEach((x, i) => expect(approx[i]).toBeCloseTo(parzen1d(x, samples, 0.5, 'gaussiano'), 3))
    expect(kernelValue(0, 'gaussiano')).toBeCloseTo(0.3989, 4)
  })

  it('intLogSteps dà interi tondi crescenti fra gli estremi', () => {
    const s = intLogSteps(10, 2000)
    expect(s[0]).toBe(10)
    expect(s.at(-1)).toBe(2000)
    expect(s).toContain(200)
    expect(s).toContain(400)
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThan(s[i - 1])
  })
})
