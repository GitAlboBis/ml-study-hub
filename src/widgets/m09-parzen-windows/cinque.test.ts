import { describe, expect, it } from 'vitest'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  SAMPLES0,
  STEPS,
  TEX_FIVE,
  TEX_LIVE,
  TEX_SLIDE,
  XD,
  YD,
  captionFor,
  countMaxima,
  drawSet,
  estimate,
  hOfStep,
  intervalOfThree,
  judge,
  needle,
  regimeOf,
} from './cinque'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'
import { volume } from './wireframe'

describe('cinque: la figura della slide p57', () => {
  it('cinque massimi con h = 0.5 e h = 0.2, meno di cinque con h = 1', () => {
    expect(countMaxima(SAMPLES0, 0.5)).toBe(5)
    expect(countMaxima(SAMPLES0, 0.2)).toBe(5)
    expect(countMaxima(SAMPLES0, 1)).toBeLessThan(5)
  })

  it('un ago isolato con h = 0.2 vale (1/5) · 1/(2π · 0.2²) = 0.796', () => {
    expect(needle(0.2).toFixed(3)).toBe('0.796')
    expect(estimate(7.5, 6.5, SAMPLES0, 0.2)).toBeCloseTo(needle(0.2), 3)
  })

  it('la scala della slide è la somma senza 1/N: cinque volte la stima', () => {
    expect(estimate(3, 4, SAMPLES0, 0.5, true)).toBeCloseTo(5 * estimate(3, 4, SAMPLES0, 0.5), 12)
  })

  it('la stima è una densità: volume 1 sul piano (i campioni stanno lontani dai bordi)', () => {
    const f = (x: number, y: number) => estimate(x, y, SAMPLES0, 0.5)
    expect(volume(f, [XD[0] - 3, XD[1] + 3], [YD[0] - 3, YD[1] + 3], 241)).toBeCloseTo(1, 3)
  })

  it('i regimi: aghi sotto 0.3, liscia da 0.8', () => {
    expect(regimeOf(0.2)).toBe('aghi')
    expect(regimeOf(0.5)).toBe('intermedio')
    expect(regimeOf(1)).toBe('liscia')
  })

  it('le estrazioni: cinque pixel a seed, dentro il dominio, diverse fra seed diversi', () => {
    const a = drawSet(1)
    expect(a).toHaveLength(5)
    for (const [x, y] of a) {
      expect(x).toBeGreaterThan(XD[0])
      expect(x).toBeLessThan(XD[1])
      expect(y).toBeGreaterThan(YD[0])
      expect(y).toBeLessThan(YD[1])
    }
    expect(drawSet(1)).toEqual(a)
    expect(drawSet(2)).not.toEqual(a)
  })
})

describe('cinque: racconto e sfida', () => {
  it('i passi portano h a 1, 0.5, 0.2', () => {
    expect(hOfStep(1, 1, 0.5)).toBeCloseTo(1, 12)
    expect(hOfStep(2, 1, 0.5)).toBeCloseTo(0.5, 12)
    expect(hOfStep(3, 1, 0.5)).toBeCloseTo(0.2, 12)
    expect(hOfStep(0, 1, 0.5)).toBeNull()
  })

  it('l\'intervallo del 3: il contatore vale 3 dentro e non appena fuori', () => {
    const t = intervalOfThree(SAMPLES0)
    expect(t).not.toBeNull()
    const [lo, hi] = t!
    expect(countMaxima(SAMPLES0, lo)).toBe(3)
    expect(countMaxima(SAMPLES0, hi)).toBe(3)
    expect(countMaxima(SAMPLES0, Number((lo - 0.01).toFixed(2)))).not.toBe(3)
    expect(lo).toBeGreaterThan(0.5)
    expect(lo).toBeLessThan(1)
  })

  it('la sfida: l\'intervallo giusto e la spiegazione giusta la superano', () => {
    const [lo, hi] = intervalOfThree(SAMPLES0)!
    expect(judge(SAMPLES0, lo, hi, 'lisciare').ok).toBe(true)
    expect(judge(SAMPLES0, lo + 0.02, hi - 0.02, 'lisciare').ok).toBe(true)
    expect(judge(SAMPLES0, 0.2, 0.5, 'lisciare').ok).toBe(false)
    expect(judge(SAMPLES0, lo, hi, 'dati').ok).toBe(false)
  })

  it('formule e didascalie compilano', () => {
    for (const tex of [TEX_FIVE, TEX_SLIDE, TEX_LIVE]) expectTexCompiles(tex)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { h: '0.50', maxima: 5, needle: '0.796' }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
  })
})
