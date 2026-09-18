import { describe, expect, it } from 'vitest'
import { linspace, trapz } from '../../lib/ml/stats'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  GRID,
  H0,
  STEPS,
  TEX_BIASED,
  TEX_CONV,
  TEX_GAUSS,
  TEX_INT,
  TEX_LIVE,
  TEX_PRESET,
  blurred,
  captionFor,
  closedFormFactor,
  examSamples,
  judge,
  largestTwoModeH,
  modes,
  noisySamples,
  peakDrop,
  simulate,
  slidingProduct,
  truthOf,
} from './sfocata'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'

const truth = GRID.map(truthOf(false))

describe('sfocata: la media della stima è la convoluzione', () => {
  it('la media di 200 esami si avvicina alla curva sfocata, non alla vera', () => {
    const { mean } = simulate(30, H0, 'gaussiano', false)
    const conv = blurred(H0, 'gaussiano', false)
    const errConv = trapz(GRID, mean.map((v, i) => Math.abs(v - conv[i])))
    const errTruth = trapz(GRID, mean.map((v, i) => Math.abs(v - truth[i])))
    expect(errConv).toBeLessThan(errTruth / 2)
  })

  it('a h fisso il bias non dipende da N: la curva sfocata è la stessa, il fascio si stringe', () => {
    const small = simulate(10, H0, 'gaussiano', false, 60)
    const big = simulate(300, H0, 'gaussiano', false, 60)
    const spread = (c: number[][]) => {
      const i = GRID.findIndex((x) => x >= 850)
      const vals = c.map((curve) => curve[i])
      const m = vals.reduce((a, b) => a + b, 0) / vals.length
      return Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length)
    }
    expect(spread(big.curves)).toBeLessThan(spread(small.curves) / 3)
  })

  it('con h = 40 il picco principale è abbassato di circa il 29% nel preset (forma chiusa)', () => {
    const t = GRID.map(truthOf(true))
    expect(peakDrop(blurred(40, 'gaussiano', true), t)).toBeCloseTo(1 - closedFormFactor(40), 3)
    expect(1 - closedFormFactor(40)).toBeCloseTo(0.293, 3)
    expect(1 - closedFormFactor(20)).toBeCloseTo(0.106, 3)
    expect(1 - closedFormFactor(4)).toBeCloseTo(0.005, 3)
  })

  it('la convoluzione numerica (rettangolare) ha area 1 e sfoca anche lei', () => {
    const xs = linspace(200, 1200, 1001)
    const conv = blurred(80, 'rettangolare', false, xs)
    expect(trapz(xs, conv)).toBeCloseTo(1, 2)
    expect(Math.max(...conv)).toBeLessThan(Math.max(...xs.map(truthOf(false))))
  })

  it('la curva sfocata ha due modi con h piccolo e uno solo con h grande', () => {
    expect(modes(blurred(20, 'gaussiano', false))).toBe(2)
    expect(modes(blurred(200, 'gaussiano', false))).toBe(1)
    const h = largestTwoModeH()
    expect(modes(blurred(h, 'gaussiano', false))).toBe(2)
    expect(modes(blurred(h + 1, 'gaussiano', false))).toBe(1)
  })

  it('il prodotto che scorre: la sua area è il valore della curva sfocata in x', () => {
    const vs = linspace(0, 1400, 7001)
    const { product } = slidingProduct(820, 60, 'gaussiano', false, vs)
    expect(trapz(vs, product)).toBeCloseTo(blurred(60, 'gaussiano', false, [820])[0], 6)
  })

  it('esami a seed con il prefisso stabile; rumore a seed per il preset', () => {
    expect(examSamples(3, 50, false).slice(0, 10)).toEqual(examSamples(3, 10, false))
    expect(noisySamples(100, 40)).toEqual(noisySamples(100, 40))
  })
})

describe('sfocata: sfida e testi', () => {
  it('il più grande h con due modi e la spiegazione "la media non dipende da N"', () => {
    const h = largestTwoModeH()
    expect(judge(h, 'gaussiano', false, 'media').ok).toBe(true)
    expect(judge(h + 5, 'gaussiano', false, 'media').ok).toBe(false)
    expect(judge(h, 'gaussiano', false, 'varianza').ok).toBe(false)
    expect(judge(H0, 'gaussiano', false, 'media').ok).toBe(false)
  })

  it('formule e didascalie compilano con la notazione del docente', () => {
    for (const tex of [TEX_CONV, TEX_INT, TEX_GAUSS, TEX_BIASED, TEX_LIVE, TEX_PRESET]) expectTexCompiles(tex)
    expect(TEX_CONV).toBe(String.raw`E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})*\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)`)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { N: 30, h: '40', drop: '29%', modes: 2, exams: 200 }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
  })
})
