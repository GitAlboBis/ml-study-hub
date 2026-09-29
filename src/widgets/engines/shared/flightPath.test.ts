import { scaleLinear } from 'd3'
import { describe, expect, it } from 'vitest'
import { easeInOut, flightPoint, fromLayer, staggered, toLayer, type PlotPlacement } from './flightPath'

describe('traiettoria di un segno in volo', () => {
  it('parte, arriva e senza arco passa per il punto medio', () => {
    expect(flightPoint([0, 0], [100, 40], 0)).toEqual([0, 0])
    expect(flightPoint([0, 0], [100, 40], 1)).toEqual([100, 40])
    const m = flightPoint([0, 0], [100, 40], 0.5)
    expect(m[0]).toBeCloseTo(50, 12)
    expect(m[1]).toBeCloseTo(20, 12)
  })

  it('con l’arco si solleva (y dello schermo verso l’alto) di arco·distanza/2 a metà', () => {
    const m = flightPoint([0, 100], [200, 100], 0.5, 0.25)
    expect(m[0]).toBeCloseTo(100, 12)
    expect(m[1]).toBeCloseTo(100 - 0.25 * 200 * 0.5, 12)
  })

  it('easeInOut parte e arriva piano, simmetrica', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 12)
    expect(easeInOut(0.1)).toBeLessThan(0.1)
    expect(easeInOut(0.9)).toBeGreaterThan(0.9)
    expect(easeInOut(-1)).toBe(0)
    expect(easeInOut(2)).toBe(1)
  })

  it('staggered: i segni partono uno dopo l’altro e arrivano tutti entro la fine', () => {
    expect(staggered(0, 5, 0, 0.5)).toBe(0)
    expect(staggered(4, 5, 0.4, 0.5)).toBe(0)
    expect(staggered(0, 5, 0.5, 0.5)).toBe(1)
    expect(staggered(4, 5, 1, 0.5)).toBe(1)
    expect(staggered(2, 5, 0.5, 0.5)).toBeCloseTo(0.5, 12)
    expect(staggered(0, 1, 0.3, 0.5)).toBeCloseTo(0.3, 12)
  })
})

describe('dal dominio di un grafico allo strato comune e ritorno', () => {
  const place: PlotPlacement = {
    left: 30,
    top: 200,
    scale: 0.5,
    margin: { left: 56, top: 24 },
    x: scaleLinear().domain([0, 10]).range([0, 400]),
    y: scaleLinear().domain([0, 1]).range([300, 0]),
  }

  it('toLayer: margini e scale del grafico, poi posizione e scala del suo SVG nello strato', () => {
    expect(toLayer(place, [5, 0.5])).toEqual([30 + (56 + 200) * 0.5, 200 + (24 + 150) * 0.5])
    expect(toLayer(place, [0, 0])).toEqual([30 + 56 * 0.5, 200 + 324 * 0.5])
  })

  it('fromLayer è l’inversa', () => {
    const [x, y] = fromLayer(place, toLayer(place, [7.3, 0.21]))
    expect(x).toBeCloseTo(7.3, 12)
    expect(y).toBeCloseTo(0.21, 12)
  })
})
