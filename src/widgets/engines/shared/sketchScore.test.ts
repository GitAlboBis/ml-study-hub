import { describe, expect, it } from 'vitest'
import { normalPdf } from '../../../lib/ml/stats'
import { normalizeSketch, paintStroke, sketchArea, sketchKey, sketchPdf, sketchScore, sketchStart, sketchXs } from './sketchScore'

const DOMAIN = [0, 10] as const
const XS = sketchXs(DOMAIN, 11)

describe('la curva disegnata (logica copiata da m03-campioni-che-rivelano-la-pdf, generalizzata)', () => {
  it('punti di controllo equispaziati e partenza uniforme ad area 1', () => {
    expect(XS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    const h = sketchStart(XS)
    expect(h.every((v) => v === 0.1)).toBe(true)
    expect(sketchArea(XS, h)).toBeCloseTo(1, 12)
  })

  it('normalizeSketch porta l’area a 1; tutta a zero torna uniforme', () => {
    const h = XS.map((x) => (x === 5 ? 2 : 0))
    expect(sketchArea(XS, h)).toBeCloseTo(2, 12)
    const n = normalizeSketch(XS, h)
    expect(sketchArea(XS, n)).toBeCloseTo(1, 6)
    expect(normalizeSketch(XS, XS.map(() => 0))).toEqual(sketchStart(XS))
  })

  it('sketchPdf interpola a tratti lineari ed è 0 fuori dal dominio', () => {
    const xs = [0, 1, 2]
    const p = sketchPdf(xs, [0, 1, 0])
    expect(p(0.5)).toBeCloseTo(0.5, 12)
    expect(p(1)).toBeCloseTo(1, 12)
    expect(p(-0.1)).toBe(0)
    expect(p(2.1)).toBe(0)
    // senza normalizzare resta l'altezza disegnata
    expect(sketchPdf(xs, [0, 2, 0], false)(1)).toBe(2)
    expect(sketchPdf(xs, [0, 2, 0])(1)).toBeCloseTo(1, 12)
  })

  it('paintStroke riempie i punti fra due posizioni del puntatore: un tratto veloce non lascia buchi', () => {
    const h = paintStroke(XS, sketchStart(XS), [1.2, 0.5], [4.8, 0.2])
    // x = 1 … 5 toccati (celle di mezza spaziatura attorno ai punti), altezze sulla retta fra i due punti
    expect(h[0]).toBe(0.1)
    expect(h[1]).toBeCloseTo(0.5, 12)
    expect(h[2]).toBeCloseTo(0.5 - (0.3 * 0.8) / 3.6, 12)
    expect(h[4]).toBeCloseTo(0.5 - (0.3 * 2.8) / 3.6, 12)
    expect(h[5]).toBeCloseTo(0.2, 12)
    expect(h[6]).toBe(0.1)
    // un solo punto del puntatore: il punto di controllo più vicino; l'altezza resta fra i limiti
    const one = paintStroke(XS, sketchStart(XS), null, [6.6, 9], 0, 0.8)
    expect(one[7]).toBe(0.8)
    expect(one[6]).toBe(0.1)
    expect(paintStroke(XS, sketchStart(XS), null, [3, -1])[3]).toBe(0)
  })

  it('sketchKey: su e giù cambiano l’altezza del punto scelto, sinistra e destra scelgono il punto', () => {
    const h = sketchStart(XS)
    expect(sketchKey(3, h, 'ArrowUp', false, { step: 0.01, max: 1 })).toEqual({ index: 3, heights: h.map((v, i) => (i === 3 ? 0.11 : v)) })
    expect(sketchKey(3, h, 'ArrowDown', true, { step: 0.01, max: 1 })!.heights[3]).toBe(0)
    expect(sketchKey(3, h, 'ArrowRight', false, { step: 0.01, max: 1 })).toEqual({ index: 4, heights: h })
    expect(sketchKey(0, h, 'ArrowLeft', false, { step: 0.01, max: 1 })!.index).toBe(0)
    expect(sketchKey(0, h, 'End', false, { step: 0.01, max: 1 })!.index).toBe(10)
    expect(sketchKey(5, h, 'PageUp', false, { step: 0.01, max: 0.15 })!.heights[5]).toBe(0.15)
    expect(sketchKey(5, h, 'x', false, { step: 0.01, max: 1 })).toBeNull()
  })
})

describe('punteggio di somiglianza', () => {
  const xs = sketchXs(DOMAIN, 41)
  const target = (x: number) => normalPdf(x, 4, 1)

  it('la curva uguale al bersaglio ha somiglianza 1 ed errore 0', () => {
    const s = sketchScore(xs, xs.map(target), target, { normalize: false })
    expect(s.similarity).toBeGreaterThan(0.995)
    expect(s.ise).toBeLessThan(1e-4)
  })

  it('una curva tutta a zero (senza normalizzare) ha somiglianza 0', () => {
    const s = sketchScore(xs, xs.map(() => 0), target, { normalize: false })
    expect(s.similarity).toBeCloseTo(0, 12)
    expect(s.area).toBe(0)
  })

  it('più la curva è lontana, più il punteggio scende', () => {
    const near = sketchScore(xs, xs.map((x) => normalPdf(x, 4.5, 1)), target)
    const far = sketchScore(xs, xs.map((x) => normalPdf(x, 7, 1)), target)
    expect(near.similarity).toBeGreaterThan(far.similarity)
    expect(near.ise).toBeLessThan(far.ise)
    expect(near.l1).toBeLessThan(far.l1)
    expect(far.similarity).toBeGreaterThanOrEqual(0)
    expect(near.similarity).toBeLessThanOrEqual(1)
  })

  it('con normalize il punteggio non dipende dalla scala della curva', () => {
    const a = sketchScore(xs, xs.map((x) => normalPdf(x, 4.5, 1)), target)
    const b = sketchScore(xs, xs.map((x) => 3 * normalPdf(x, 4.5, 1)), target)
    expect(a.similarity).toBeCloseTo(b.similarity, 6)
    expect(b.area).toBeCloseTo(3, 2)
  })
})
