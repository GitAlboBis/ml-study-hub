import { describe, expect, it } from 'vitest'
import type { WidgetMeta } from '../../types'
import { stableKey, twinsDiffer } from './twins'

const meta = (over: Partial<WidgetMeta> = {}): WidgetMeta => ({
  id: 'm03-x',
  moduleId: 'm03-stima-intro-parametrica',
  title: 'T',
  concepts: [],
  scenario: 'pesce',
  scenarioNote: 'Salmoni sul nastro',
  size: 'L',
  ...over,
})

const base = {
  data: { samples: [1, 2, 3], truth: (x: number) => x * 2 },
  layers: ['data', 'likelihood'],
  initialLayers: ['data'],
  challenge: { kind: 'find', prompt: 'Trova il massimo', score: (s: { l: number }) => s.l, target: () => 0, tolerance: 0.05 },
}

describe('stableKey', () => {
  it('ordine delle chiavi irrilevante, funzioni per sorgente, undefined ignorato', () => {
    expect(stableKey({ a: 1, b: [2, { c: 3 }] })).toBe(stableKey({ b: [2, { c: 3 }], a: 1, z: undefined }))
    expect(stableKey({ f: (x: number) => x + 1 })).not.toBe(stableKey({ f: (x: number) => x + 2 }))
  })
})

describe('twinsDiffer', () => {
  it('due gemelli appiattiti sullo stesso preset: mancano scenario, sfida e pannello', () => {
    const r = twinsDiffer({ meta: meta(), preset: base }, { meta: meta({ id: 'm07-x', scenarioNote: 'Altra frase' }), preset: { ...base } })
    expect(r.ok).toBe(false)
    expect(r.missing).toEqual(['scenario', 'sfida', 'pannello o strato'])
  })

  it('gemelli veri: dati, meccanica della sfida e strati diversi', () => {
    const other = {
      ...base,
      data: { samples: [4, 5], truth: (x: number) => x * 2 },
      layers: ['data', 'likelihood', 'posterior'],
      challenge: { kind: 'predict', prompt: 'Trova il massimo', input: 'click-x', truth: () => 1, tolerance: 0.1 },
    }
    const r = twinsDiffer({ meta: meta(), preset: base }, { meta: meta({ id: 'm07-x' }), preset: other })
    expect(r).toMatchObject({ ok: true, scenario: true, challenge: true, panelOrLayer: true, missing: [] })
  })

  it('cambiare solo le parole della sfida non basta; cambiare la chiave dello scenario del cast sì', () => {
    const reworded = { ...base, challenge: { ...base.challenge, prompt: 'Cerca il picco', hint: 'Guarda la curva' } }
    const r = twinsDiffer({ meta: meta(), preset: base }, { meta: meta({ scenario: 'spam' }), preset: { ...reworded, initialLayers: ['likelihood'] } })
    expect(r.scenario).toBe(true)
    expect(r.challenge).toBe(false)
    expect(r.panelOrLayer).toBe(true)
    expect(r.missing).toEqual(['sfida'])
  })

  it('i campi dello scenario e dei pannelli si possono dichiarare per il motore', () => {
    const a = { ...base, generator: 'a' }
    const b = { ...base, generator: 'b', challenge: { ...base.challenge, tolerance: 0.1 }, sidePanels: ['roc'] }
    const r = twinsDiffer({ meta: meta(), preset: a }, { meta: meta(), preset: b }, { scenarioKeys: ['generator'] })
    expect(r.ok).toBe(true)
  })
})
