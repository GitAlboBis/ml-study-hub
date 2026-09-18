import { describe, expect, it } from 'vitest'
import { linspace, trapz } from '../../lib/ml/stats'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  H0,
  KERNEL_TEX,
  PEAK,
  SAMPLES,
  STEPS,
  SUSPECT0,
  TAIL_KERNELS,
  TEX_LIVE,
  U_READ,
  captionFor,
  estimateOn,
  gamma,
  judge,
  nearest,
  severityOrder,
  tabOfStep,
} from './galleria-code'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'

describe('galleria-code: dati e kernel', () => {
  it('40 importi fra 1 e 2.3 (10-200 €); il sospetto a 3.7 dista 4 larghezze dal più vicino', () => {
    expect(SAMPLES).toHaveLength(40)
    expect(Math.min(...SAMPLES)).toBeGreaterThanOrEqual(1)
    expect(Math.max(...SAMPLES)).toBe(2.3)
    expect(nearest(SUSPECT0, H0).u).toBeCloseTo(4, 9)
  })

  it('i picchi della slide p59: 1/2, 1/π, 1/(2π), e la gaussiana 0.399', () => {
    for (const k of TAIL_KERNELS) expect(gamma(0, k)).toBeCloseTo(PEAK[k].value, 12)
  })

  it('le code in u = 4: 0.00013, 0.0092, 0.019, 0.033', () => {
    expect(gamma(U_READ, 'gaussiano').toFixed(5)).toBe('0.00013')
    expect(gamma(U_READ, 'esponenziale').toFixed(4)).toBe('0.0092')
    expect(gamma(U_READ, 'cauchy').toFixed(3)).toBe('0.019')
    expect(gamma(U_READ, 'sinc2').toFixed(3)).toBe('0.033')
  })

  it('il sinc² tocca zero in ±2π', () => {
    expect(gamma(2 * Math.PI, 'sinc2')).toBeLessThan(1e-30)
    expect(gamma(4 * Math.PI, 'sinc2')).toBeLessThan(1e-30)
  })

  it('ogni kernel è una densità (area 1, con le code lunghe di Cauchy e sinc² su un intervallo ampio)', () => {
    const us = linspace(-4000, 4000, 800001)
    for (const k of TAIL_KERNELS) expect(trapz(us, us.map((u) => gamma(u, k))), k).toBeCloseTo(1, 3)
  })

  it('la stima esiste per ogni kernel sul dominio', () => {
    for (const k of TAIL_KERNELS) expect(Math.max(...estimateOn(H0, k))).toBeGreaterThan(0.3)
  })
})

describe('galleria-code: sfida', () => {
  it('il gaussiano è il più severo; Cauchy, con la coda pesante sommata su tutti i campioni, il più indulgente', () => {
    const order = severityOrder(SUSPECT0, H0)
    expect(order[0]).toBe('gaussiano')
    expect(order[1]).toBe('esponenziale')
    expect(order[3]).toBe('cauchy')
  })

  it('ordine giusto, importo a u = 2π e l\'effetto "zero del lobo" la superano', () => {
    const order = severityOrder(SUSPECT0, H0)
    const x = 2.3 + 2 * Math.PI * H0
    expect(judge(order, x, H0, 'zero').ok).toBe(true)
    expect(judge(order, SUSPECT0, H0, 'zero').ok).toBe(false)
    expect(judge([...order].reverse(), x, H0, 'zero').ok).toBe(false)
    expect(judge(order, x, H0, 'max').ok).toBe(false)
  })

  it('il racconto impone le schede; formule e didascalie compilano', () => {
    expect(tabOfStep(2)).toBe('esponenziale')
    expect(tabOfStep(6)).toBe('verdetto')
    for (const tex of [...Object.values(KERNEL_TEX), TEX_LIVE]) expectTexCompiles(tex)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { h: '0.35', score: '11.12', k: 'gaussiano' }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
  })
})
