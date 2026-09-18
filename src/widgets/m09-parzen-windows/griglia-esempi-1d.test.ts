import { describe, expect, it } from 'vitest'
import { parzen1d } from '../../lib/ml/nonparam'
import { linspace, trapz } from '../../lib/ml/stats'
import { H1S, TABS, TRIAL_NS, estimate, expected, gridXs, hN, ise, measuredRise, minimalN, mlGaussian, pool, riseWidth } from './griglia-esempi-1d'

describe('m09-griglia-esempi-1d: la logica', () => {
  it('le righe e le colonne della slide; h_N nella riga N = 10: 0.316, 0.158, 0.032', () => {
    expect(TABS.normale.rows.slice(0, 3)).toEqual([1, 10, 100])
    expect(TABS.bimodale.rows.slice(0, 3)).toEqual([1, 16, 256])
    expect(H1S).toEqual([1, 0.5, 0.1])
    expect(H1S.map((h1) => hN(h1, 10).toFixed(3))).toEqual(['0.316', '0.158', '0.032'])
    expect(hN(0.5, 256)).toBeCloseTo(0.03125, 12)
  })

  it('la stima è quella di Parzen gaussiana con i primi N campioni (annidati)', () => {
    const p = pool('normale', 1)
    const xs = [-1, 0, 0.7]
    const e = estimate(xs, p, 10, 0.3)
    xs.forEach((x, i) => expect(e[i]).toBeCloseTo(parzen1d(x, p.slice(0, 10), 0.3), 10))
    expect(pool('normale', 1).slice(0, 10)).toEqual(p.slice(0, 10))
  })

  it('la media della stima: integra a 1 e tende alla verità con h → 0', () => {
    for (const tab of ['normale', 'bimodale'] as const) {
      const xs = linspace(-4, 7, 3001)
      expect(trapz(xs, xs.map((x) => expected(tab, x, 0.3))), tab).toBeCloseTo(1, 3)
    }
    // nel vertice la media perde (2/3)·E|t| = (2/3)·0.798·h
    expect(expected('bimodale', 1.5, 0.01)).toBeCloseTo((2 / 3) * (1 - 0.01 * Math.sqrt(2 / Math.PI)), 5)
    expect(expected('bimodale', 1.5, 0.001)).toBeCloseTo((2 / 3) * (1 - 0.001 * Math.sqrt(2 / Math.PI)), 5)
    // sul bordo del rettangolo la media vale circa metà dell'altezza (limiti destro e sinistro)
    expect(expected('bimodale', 3, 0.05)).toBeCloseTo(1 / 3, 2)
  })

  it('a N grande l’errore integrato scende per h_1 = 0.5; con h_1 = 0.1 a N = 10 resta alto', () => {
    const p = pool('normale', 3)
    const xs = gridXs('normale')
    const e100 = ise('normale', xs, estimate(xs, p, 100, hN(0.5, 100)))
    const e10 = ise('normale', xs, estimate(xs, p, 10, hN(0.1, 10)))
    expect(e100).toBeLessThan(e10)
  })

  it('il modello gaussiano ML ha un solo modo e non esiste con N = 1', () => {
    const p = pool('bimodale', 2)
    expect(mlGaussian(p, 1)).toBeNull()
    const g = mlGaussian(p, 256)!
    expect(g.mu).toBeGreaterThan(1.3)
    expect(g.mu).toBeLessThan(2.3)
  })

  it('la sfida: la salita 10-90% è 2.56·h_N; il minimo N con salita < 0.1 per h_1 = 0.5 è 256 (h_N = 0.031)', () => {
    expect(riseWidth(1)).toBeCloseTo(2.563, 3)
    expect(measuredRise(0.03)).toBeCloseTo(riseWidth(0.03), 4)
    expect(minimalN()).toBe(256)
    expect(TRIAL_NS).toContain(256)
    expect(riseWidth(hN(0.5, 64))).toBeGreaterThan(0.1)
    expect(riseWidth(hN(0.5, 256))).toBeLessThan(0.1)
  })
})
