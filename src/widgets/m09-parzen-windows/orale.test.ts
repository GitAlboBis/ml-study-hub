import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { linspace, mean, trapz, variance } from '../../lib/ml/stats'
import { ORDER, PALETTE, PIECES, TILES, TRICKS, VALLEY, breaks, chainDone, chainReducer, initialChain, lawH, meanEstimate, resampled, tileTex, truth, varianceAt } from './orale'
import type { ChainState, TileId } from './orale'

const play = (s: ChainState, tile: TileId, slot: number) => {
  let t = chainReducer(s, { type: 'select', tile })
  t = chainReducer(t, { type: 'piece', piece: TILES[tile].piece })
  return chainReducer(t, { type: 'place', slot })
}

describe('m09-orale-buon-stimatore: la catena', () => {
  it('le formule compilano vuote e complete; i pezzi della tavolozza anche', () => {
    for (const id of ORDER) {
      expect(() => katex.renderToString(tileTex(id, false), { throwOnError: true })).not.toThrow()
      expect(() => katex.renderToString(tileTex(id, true), { throwOnError: true })).not.toThrow()
    }
    for (const p of PALETTE) expect(() => katex.renderToString(PIECES[p].tex, { throwOnError: true })).not.toThrow()
    expect(new Set(PALETTE)).toEqual(new Set(Object.keys(PIECES)))
  })

  it('la catena giusta, senza errori', () => {
    let s = initialChain()
    ORDER.forEach((id, i) => (s = play(s, id, i)))
    expect(chainDone(s)).toBe(true)
    expect(s.errors).toBe(0)
    expect(s.pool).toHaveLength(0)
  })

  it('un pezzo sbagliato e un anello sbagliato contano come errori; la tessera fuori posto torna nel mucchio', () => {
    let s = chainReducer(initialChain(), { type: 'select', tile: 'bound' })
    s = chainReducer(s, { type: 'piece', piece: 'inf' })
    expect(s.errors).toBe(1)
    expect(s.complete.bound).toBeUndefined()
    s = chainReducer(s, { type: 'place', slot: 2 })
    expect(s.last?.kind).toBe('incomplete')
    s = chainReducer(s, { type: 'piece', piece: 'sup' })
    s = chainReducer(s, { type: 'place', slot: 0 })
    expect(s.errors).toBe(2)
    expect(s.last?.kind).toBe('wrongSlot')
    expect(s.pool).toContain('bound')
    expect(s.selected).toBeNull()
    s = chainReducer(s, { type: 'select', tile: 'bound' })
    s = chainReducer(s, { type: 'place', slot: 2 })
    expect(s.slots[2]).toBe('bound')
  })

  it('le domande trabocchetto: h fisso spezza il secondo anello (h_N), h_N = 1/N e il salto a 3-D il quarto (N h_Nⁿ)', () => {
    expect(breaks(TRICKS[0])).toEqual({ ring: 1, quantity: 'h' })
    expect(breaks(TRICKS[1])).toEqual({ ring: 3, quantity: 'nhn' })
    expect(breaks(TRICKS[2])).toEqual({ ring: 3, quantity: 'nhn' })
  })
})

describe('m09-orale-buon-stimatore: le mini-simulazioni', () => {
  it('la verità integra a 1 e ha una valle fra i due modi; la media della stima la riempie', () => {
    const xs = linspace(0, 0.9, 3001)
    expect(trapz(xs, xs.map(truth))).toBeCloseTo(1, 4)
    expect(truth(VALLEY)).toBeLessThan(truth(0.48))
    expect(meanEstimate(VALLEY, 0.06)).toBeGreaterThan(truth(VALLEY) * 1.3)
    // con h_N che si restringe la media torna sulla verità
    expect(Math.abs(meanEstimate(VALLEY, lawH(0.08, 20000)) - truth(VALLEY))).toBeLessThan(0.05)
  })

  it('la varianza dei ricampionamenti sta sotto il bound', () => {
    const v = resampled(0.48, 0.03, 200, 200, 1)
    const st = varianceAt(0.48, 0.03, 200)
    expect(mean(v)).toBeCloseTo(st.mean, 0)
    expect(variance(v)).toBeLessThan(st.bound)
    expect(variance(v) / st.variance).toBeGreaterThan(0.7)
  })
})
