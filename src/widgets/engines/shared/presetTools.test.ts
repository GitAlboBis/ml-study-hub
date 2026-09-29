import { describe, expect, it } from 'vitest'
import {
  applyTab,
  captionOf,
  descriptionOf,
  fillVals,
  firstLiveFormula,
  formulaTexOf,
  initialLayersOf,
  litInsights,
  resolveEngineSteps,
  richToPlain,
  splitRichLabel,
  valNames,
} from './presetTools'
import type { BasePreset, EngineStep } from './types'

type Phase = { kind: 'overview' } | { kind: 'drop' }
interface Ctx {
  n: number
}
interface State {
  errors: number
}
type Layer = 'points' | 'boundary' | 'regions'

const steps: EngineStep<Phase, Ctx>[] = [
  { id: 'a', label: 'Il quadro', phase: { kind: 'overview' }, durationMs: 1200, caption: 'Tutto insieme.' },
  { id: 'b', label: 'Cadono', phase: { kind: 'drop' }, durationMs: (c) => c.n * 300, caption: (c) => `Cadono $N = ${c.n}$ campioni.` },
]

const preset: BasePreset<Layer, Phase, Ctx, State> = {
  layers: ['points', 'boundary'],
  initialLayers: ['points', 'regions'],
  storyboard: steps,
  formulas: [
    { id: 'f0', tex: 'P_e = \\int p(x)\\,dx' },
    { id: 'f1', tex: (c) => `\\hat p = \\val{p} \\quad N = \\val[0]{N} \\quad ${c.n}` },
  ],
  ariaLabel: 'Piano',
  description: (s) => `${s.errors} errori`,
  tabs: [{ id: 'k', label: 'K fisso', overrides: { initialLayers: ['boundary'], extra: 3 } }],
  insights: [
    { id: 'zero', label: 'Nessun errore', when: (s) => s.errors === 0, tone: 'ok' },
    { id: 'many', label: 'Molti errori', when: (s) => s.errors > 5 },
  ],
}

describe('storyboard', () => {
  it('passi per useStoryboard con le durate risolte nel contesto', () => {
    expect(resolveEngineSteps(steps, { n: 4 })).toEqual([
      { id: 'a', label: 'Il quadro', durationMs: 1200 },
      { id: 'b', label: 'Cadono', durationMs: 1200 },
    ])
  })
  it('didascalie e formule risolte nel contesto', () => {
    expect(captionOf(steps[1], { n: 7 })).toBe('Cadono $N = 7$ campioni.')
    expect(captionOf(steps[0], { n: 7 })).toBe('Tutto insieme.')
    expect(formulaTexOf(preset.formulas[1], { n: 2 })).toContain('\\quad 2')
  })
  it('la prima formula con segnaposto è quella che annuncia', () => {
    expect(firstLiveFormula(preset.formulas, { n: 1 })).toBe(1)
    expect(firstLiveFormula([preset.formulas[0]], { n: 1 })).toBe(-1)
  })
})

describe('segnaposto \\val', () => {
  it('nomi usati, anche con i decimali espliciti, una volta sola', () => {
    expect(valNames('\\val{p} + \\val[3]{ q } = \\val{p}')).toEqual(['p', 'q'])
  })
  it('fillVals mette un numero al posto di ogni segnaposto', () => {
    expect(fillVals('a = \\val{p} + \\val[0]{N}')).toBe('a = {1.23} + {1.23}')
  })
})

describe('schede, strati, descrizione, spie', () => {
  it('applyTab fonde gli override della scheda sul preset di base; id sconosciuto o null: il preset com\'è', () => {
    const merged = applyTab(preset, 'k')
    expect(merged.initialLayers).toEqual(['boundary'])
    expect((merged as unknown as { extra: number }).extra).toBe(3)
    expect(merged.layers).toBe(preset.layers)
    expect(merged.tabs).toBe(preset.tabs)
    expect(applyTab(preset, 'nessuna')).toBe(preset)
    expect(applyTab(preset, null)).toBe(preset)
  })
  it('gli strati iniziali sono solo quelli offerti', () => {
    expect(initialLayersOf(preset)).toEqual(['points'])
  })
  it('descrizione: stringa o funzione dello stato', () => {
    expect(descriptionOf(preset, { errors: 3 })).toBe('3 errori')
    expect(descriptionOf({ ...preset, description: 'fisso' }, { errors: 3 })).toBe('fisso')
    expect(descriptionOf({ ...preset, description: undefined }, { errors: 3 })).toBe('')
  })
  it('spie accese per lo stato', () => {
    expect(litInsights(preset.insights ?? [], { errors: 0 }).map((i) => i.id)).toEqual(['zero'])
    expect(litInsights(preset.insights ?? [], { errors: 9 }).map((i) => i.id)).toEqual(['many'])
  })
})

describe('testo semplice da Markdown con matematica', () => {
  it('toglie enfasi e delimitatori, traduce i comandi comuni', () => {
    expect(richToPlain('**Stima** di $\\hat p(x)$ con $\\sigma^2$')).toBe('Stima di p̂(x) con σ^2')
    expect(richToPlain('$S_W$ singolare')).toBe('S_W singolare')
    expect(richToPlain('$P_{FA} \\le \\alpha$ e $\\frac{1}{N}$')).toBe('P_FA ≤ α e 1/N')
    expect(richToPlain('$\\mathcal{N}(\\mu,\\ \\sigma^2)$')).toBe('N(μ, σ^2)')
    expect(richToPlain('[vedi](/m09) *qui*')).toBe('vedi qui')
  })
  it('splitRichLabel separa il simbolo finale dalle parole', () => {
    expect(splitRichLabel('Numero di campioni $N$')).toEqual({ text: 'Numero di campioni', tex: 'N' })
    expect(splitRichLabel('Larghezza $h$ della finestra')).toEqual({ text: 'Larghezza h della finestra' })
    expect(splitRichLabel('Varianza $\\sigma^2$')).toEqual({ text: 'Varianza', tex: '\\sigma^2' })
  })
})
