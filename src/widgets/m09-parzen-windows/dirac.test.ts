import { describe, expect, it } from 'vitest'
import { linspace, trapz } from '../../lib/ml/stats'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  GRID,
  H1_DEFAULT,
  N_STEPS,
  STEPS,
  TEX_CONV_DIRAC,
  TEX_DIRAC,
  TEX_LIMIT_H,
  TEX_LIVE,
  TRUE_ON_GRID,
  biasCurve,
  captionFor,
  hOf,
  judge,
  maxBias,
  meanEstimate,
  moment,
  nForOnePercent,
  nOfStep,
  sdEstimate,
  truth,
} from './dirac'
import { blurred } from './sfocata'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'

describe('dirac: la scala e la legge', () => {
  it('N da 10 a 100 000 in nove passi √10; con h_1 = 60: h_10 ≈ 19 ms, h_100 = 6 ms', () => {
    expect(N_STEPS).toEqual([10, 32, 100, 316, 1000, 3162, 10000, 31623, 100000])
    expect(hOf(10, 60, 'legge').toFixed(0)).toBe('19')
    expect(hOf(100, 60, 'legge')).toBeCloseTo(6, 12)
    expect(hOf(100000, 60, 'fisso')).toBeCloseTo(hOf(10, 60, 'legge'), 12)
  })
})

describe('dirac: la media della stima', () => {
  it('il cambio di variabile dà la convoluzione giusta (rettangolare e triangolare), come il widget precedente a meno dell\'1%', () => {
    const xs = [560, 700, 850]
    const h = 40
    for (const k of ['rettangolare', 'triangolare'] as const) {
      const a = meanEstimate(h, k, xs)
      const b = blurred(h, k, false, xs)
      xs.forEach((x, i) => {
        // riferimento: l'integrale sul solo supporto del kernel, con trapezi fittissimi
        const half = k === 'rettangolare' ? h / 2 : h
        const vs = linspace(x - half, x + half, 20001)
        const ref = trapz(vs, vs.map((v) => (k === 'rettangolare' ? 1 : 1 - Math.abs((x - v) / h)) * truth(v) / h))
        expect(a[i]).toBeCloseTo(ref, 6)
        expect(Math.abs(a[i] - b[i]) / ref).toBeLessThan(0.01)
      })
    }
  })

  it('con la legge h_N = h_1/√N il bias massimo scende verso zero; con h fisso resta costante', () => {
    const law = biasCurve(H1_DEFAULT, 'legge', 'gaussiano')
    for (let i = 1; i < law.length; i++) expect(law[i][1]).toBeLessThan(law[i - 1][1])
    expect(law.at(-1)![1]).toBeLessThan(0.001)
    const fixed = biasCurve(H1_DEFAULT, 'fisso', 'gaussiano')
    for (const [, b] of fixed) expect(b).toBeCloseTo(fixed[0][1], 12)
  })

  it('con h_N sotto il millisecondo la media coincide con la vera (anche con il rettangolare)', () => {
    expect(maxBias(meanEstimate(0.6, 'rettangolare'))).toBeLessThan(0.001)
    expect(trapz(GRID, meanEstimate(0.6, 'rettangolare'))).toBeCloseTo(trapz(GRID, TRUE_ON_GRID), 4)
  })

  it('il kernel riscalato ha area 1 per ogni h_N (la stessa integrazione del momento, con p = 1)', () => {
    for (const k of ['gaussiano', 'triangolare', 'rettangolare'] as const) expect(moment(0, 3, k, 1, () => 1)).toBeCloseTo(1, 3)
  })

  it('varianza: con kernel stretto e N piccolo la banda è larga, con N grande si stringe', () => {
    const h = 6
    const mean = meanEstimate(h, 'gaussiano')
    const small = Math.max(...sdEstimate(10, h, 'gaussiano', mean))
    const big = Math.max(...sdEstimate(1000, h, 'gaussiano', mean))
    expect(big).toBeCloseTo(small / 10, 8)
    // stesso N, kernel più largo: banda più sottile
    const wide = meanEstimate(60, 'gaussiano')
    expect(Math.max(...sdEstimate(10, 60, 'gaussiano', wide))).toBeLessThan(small)
  })
})

describe('dirac: sfida e testi', () => {
  it('servono h_N ≈ 5.7 ms, cioè N ≈ 110 battiti', () => {
    const { h, n } = nForOnePercent()
    expect(h).toBeGreaterThan(5)
    expect(h).toBeLessThan(6.5)
    expect(n).toBeGreaterThan(85)
    expect(n).toBeLessThan(145)
    expect(judge(Math.round(n)).ok).toBe(true)
    expect(judge(1000).ok).toBe(false)
    expect(judge(10).ok).toBe(false)
  })

  it('i passi del racconto: nove N, poi Dirac, h fisso, banda; formule e didascalie compilano', () => {
    expect(STEPS).toHaveLength(12)
    expect(nOfStep(0)).toBe(10)
    expect(nOfStep(8)).toBe(100000)
    expect(nOfStep(10)).toBeNull()
    for (const tex of [TEX_LIMIT_H, TEX_DIRAC, TEX_CONV_DIRAC, TEX_LIVE]) expectTexCompiles(tex)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { N: '100', hN: '6.00', bias: '4.1%', h1: '60' }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
    expect(linspace(0, 1, 2)).toEqual([0, 1])
  })
})
