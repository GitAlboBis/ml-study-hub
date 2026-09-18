import { describe, expect, it } from 'vitest'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  STEPS,
  TEX_AMP,
  TEX_DELTA,
  TEX_NORMAL2,
  TEX_SPLIT,
  captionFor,
  decomposition,
  deltaAt,
  hBetween,
  hToZero,
  judge,
  measure,
  peak,
  peakTable,
  texPeak,
} from './delta'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'

describe('delta: i numeri della slide p56', () => {
  it('picchi 2-D 0.159, 0.637, 3.98 e 1-D 0.399, 0.798, 1.995 per h = 1, 0.5, 0.2', () => {
    const t = peakTable()
    expect(t.map((r) => r.two.toFixed(3))).toEqual(['0.159', '0.637', '3.979'])
    expect(t.map((r) => r.one.toFixed(3))).toEqual(['0.399', '0.798', '1.995'])
  })

  it('volume (2-D) e area (1-D) restano 1 per ogni h', () => {
    for (const h of [0.1, 0.2, 0.5, 1, 2]) {
      expect(measure(h, 2).toFixed(3)).toBe('1.000')
      expect(measure(h, 1).toFixed(3)).toBe('1.000')
    }
  })

  it('δ è simmetrica e decresce allontanandosi dall\'origine', () => {
    expect(deltaAt(0.3, 0.4, 0.5, 2)).toBeCloseTo(deltaAt(-0.4, 0.3, 0.5, 2), 12)
    expect(deltaAt(1, 0, 0.5, 2)).toBeLessThan(deltaAt(0.5, 0, 0.5, 2))
  })
})

describe('delta: racconto', () => {
  it('la scomposizione: prima la larghezza (volume hⁿ), poi l\'ampiezza (volume di nuovo 1)', () => {
    const h = 0.5
    const mid = decomposition(0.5, h, 2)
    expect(mid.width).toBeCloseTo(0.5, 12)
    expect(mid.amp).toBe(1)
    const end = decomposition(1, h, 2)
    expect(end.amp).toBeCloseTo(4, 12)
    expect(end.f(0, 0)).toBeCloseTo(peak(h, 2), 12)
    // a metà strada il volume è h² = 0.25
    expect(measure(1, 2, mid.width, mid.amp)).toBeCloseTo(0.25, 3)
  })

  it('h → 0 va da 1 a 0.05; i passi di h sono logaritmici', () => {
    expect(hToZero(0)).toBeCloseTo(1, 12)
    expect(hToZero(1)).toBeCloseTo(0.05, 12)
    expect(hBetween(1, 0.25, 0.5)).toBeCloseTo(0.5, 12)
  })
})

describe('delta: sfida e testi', () => {
  it('×25 in 2-D e ×5 in 1-D', () => {
    expect(judge(25, 5).ok).toBe(true)
    expect(judge(5, 25).ok).toBe(false)
  })

  it('formule e didascalie compilano con la notazione del docente', () => {
    for (const tex of [TEX_DELTA, TEX_NORMAL2, TEX_AMP, TEX_SPLIT, texPeak(1), texPeak(2)]) expectTexCompiles(tex)
    expect(TEX_DELTA).toBe(String.raw`\delta(\mathbf{x})=\frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}}{h}\right)`)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { h: '1.00', peak: '0.159', n: 2 }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
  })
})
