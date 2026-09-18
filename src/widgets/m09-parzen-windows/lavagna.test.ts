import { describe, expect, it } from 'vitest'
import { linspace, trapz } from '../../lib/ml/stats'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  H1,
  H2,
  SAMPLES0,
  STEPS,
  TEX_COUNT,
  TEX_LIVE,
  TEX_RULES,
  TEX_TWO,
  captionFor,
  controlXs,
  countK,
  curveError,
  drawnAt,
  humps,
  intervals,
  judge,
  levelErrors,
  oneHump,
  oralScore,
  oralSetup,
  quotes,
  stairArea,
  stairError,
  sumAt,
  trueLevels,
} from './lavagna'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'

describe('lavagna: fase 1, la scaletta (h = 2)', () => {
  it('cinque gradini con bordi 1, 2, 3, 4 e quote 0, 0.25, 0.5, 0.25, 0', () => {
    expect(intervals(SAMPLES0, H1)).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 6],
    ])
    expect(trueLevels(SAMPLES0, H1)).toEqual([0, 0.25, 0.5, 0.25, 0])
    expect(quotes(H1)).toEqual([0, 0.25, 0.5])
  })

  it('i gradini sbagliati sono segnati uno per uno', () => {
    expect(levelErrors([0, 0.25, 0.5, 0.25, 0], SAMPLES0, H1)).toEqual([false, false, false, false, false])
    expect(levelErrors([0, 0.5, 0.5, 0, 0], SAMPLES0, H1)).toEqual([false, true, false, true, false])
    expect(stairError([0, 0.25, 0.5, 0.25, 0], SAMPLES0, H1)).toBe(0)
  })

  it('K passa da 0 a 1 a 2 a 1 a 0 lungo l\'asse', () => {
    expect([0.5, 1.5, 2.5, 3.5, 5].map((x) => countK(x, SAMPLES0, H1))).toEqual([0, 1, 2, 1, 0])
  })

  it('l\'area totale è 1 in entrambe le fasi', () => {
    const xs = linspace(-4, 10, 14001)
    expect(trapz(xs, xs.map((x) => sumAt(x, SAMPLES0, H1, 1)))).toBeCloseTo(1, 2)
    expect(stairArea(SAMPLES0, H1)).toBeCloseTo(1, 12)
    expect(stairArea([1.2, 1.9], 3)).toBeCloseTo(1, 12)
    expect(trapz(xs, xs.map((x) => sumAt(x, SAMPLES0, H2, 2)))).toBeCloseTo(1, 6)
  })
})

describe('lavagna: fase 2, la curva liscia (h = 1)', () => {
  it('i valori notevoli dell\'inventario: 0.352 in 2.5, 0.320 in 2 e 3, 0.148 in 1 e 4', () => {
    expect(sumAt(2.5, SAMPLES0, H2, 2).toFixed(3)).toBe('0.352')
    expect(sumAt(2, SAMPLES0, H2, 2).toFixed(3)).toBe('0.320')
    expect(sumAt(3, SAMPLES0, H2, 2).toFixed(3)).toBe('0.320')
    expect(sumAt(1, SAMPLES0, H2, 2).toFixed(3)).toBe('0.148')
    expect(sumAt(4, SAMPLES0, H2, 2).toFixed(3)).toBe('0.148')
  })

  it('i sette punti di controllo sono in 1, 1.5, 2, 2.5, 3, 3.5, 4', () => {
    expect(controlXs(SAMPLES0)).toEqual([1, 1.5, 2, 2.5, 3, 3.5, 4])
  })

  it('due gobbe se e solo se h < 0.5; con h = 0.3 picchi 0.667 e valle 0.332', () => {
    expect(humps(SAMPLES0, 0.55)).toBe(1)
    expect(humps(SAMPLES0, 0.45)).toBe(2)
    expect(oneHump(SAMPLES0, 0.5)).toBe(true)
    expect(oneHump(SAMPLES0, 0.45)).toBe(false)
    expect(sumAt(2, SAMPLES0, 0.3, 2).toFixed(3)).toBe('0.667')
    expect(sumAt(2.5, SAMPLES0, 0.3, 2).toFixed(3)).toBe('0.332')
  })

  it('il disegno è la spezzata dei punti; l\'errore è zero solo sulla curva vera (a meno della spezzata)', () => {
    const cx = controlXs(SAMPLES0)
    const exact = cx.map((x) => sumAt(x, SAMPLES0, H2, 2))
    expect(drawnAt(2.25, cx, exact)).toBeCloseTo((exact[2] + exact[3]) / 2, 12)
    expect(drawnAt(0.5, cx, exact)).toBe(0)
    expect(curveError(exact, SAMPLES0, H2)).toBeLessThan(0.1)
    expect(curveError(cx.map(() => 0), SAMPLES0, H2)).toBeGreaterThan(0.7)
  })
})

describe('lavagna: prova orale e sfida', () => {
  it('il punteggio va da 100 (disegni perfetti) a 0', () => {
    expect(oralScore(0, 0)).toBe(100)
    expect(oralScore(1, 1)).toBe(0)
  })

  it('le prove orali estraggono due campioni a distanza fra 0.5 e 3, dentro la lavagna', () => {
    for (let seed = 1; seed < 50; seed++) {
      const o = oralSetup(seed)
      const gap = o.samples[1] - o.samples[0]
      expect(gap).toBeGreaterThanOrEqual(0.5 - 1e-9)
      expect(gap).toBeLessThanOrEqual(3 + 1e-9)
      expect(o.samples[0]).toBeGreaterThanOrEqual(1)
      expect(o.samples[1]).toBeLessThanOrEqual(5)
    }
  })

  it('la sfida: h < 0.5 e gradino 1 la superano; il resto no', () => {
    expect(judge('lt05', 1).ok).toBe(true)
    expect(judge('lt05', 1).top).toBe(1)
    expect(judge('', 0).ok).toBe(false)
    expect(judge('lt1', 1).ok).toBe(false)
    expect(judge('lt05', 2).ok).toBe(false)
  })

  it('formule e didascalie compilano', () => {
    for (const tex of [TEX_TWO, TEX_LIVE, TEX_COUNT, TEX_RULES]) expectTexCompiles(tex)
    expect(TEX_TWO).toBe(String.raw`\hat{p}(x)=\frac{1}{2}\left[\frac{1}{h}\gamma\left(\frac{x-x_1}{h}\right)+\frac{1}{h}\gamma\left(\frac{x-x_2}{h}\right)\right]`)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { x1: '2', x2: '3', h1: '2.00', h2: '1.00', w1: '0.250', K: 1, pk: '0.250' }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
  })
})
