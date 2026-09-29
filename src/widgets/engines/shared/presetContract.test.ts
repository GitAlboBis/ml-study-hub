import { describe, expect, it } from 'vitest'
import { checkPresetContract, presetContract } from './presetContract'
import type { BasePreset, CommonChallenge } from './types'

type Layer = 'densities' | 'errorAreas' | 'roc'
type Phase = { kind: 'overview' } | { kind: 'scan' }
interface Ctx {
  n: number
}
interface State {
  x: number
  pe: number
}
const VALUE_NAMES = ['x', 'pe', 'N'] as const

const good: BasePreset<Layer, Phase, Ctx, State> = {
  layers: ['densities', 'errorAreas', 'roc'],
  initialLayers: ['densities', 'errorAreas'],
  params: [{ id: 'x', label: 'Soglia $x^*$', en: 'threshold', min: 0, max: 10, initial: 5, step: 0.1 }],
  storyboard: [
    { id: 'q', label: 'Il quadro', phase: { kind: 'overview' }, durationMs: 1000, caption: 'Due classi su un asse, $p(x|\\omega_i)$.' },
    { id: 's', label: 'La soglia scorre', phase: { kind: 'scan' }, durationMs: (c) => 200 * c.n, caption: (c) => `La soglia visita ${c.n} posizioni: $P_e$ cambia.` },
  ],
  formulas: [{ id: 'pe', label: 'Errore', tex: (c) => `P_e(\\val{x}) = \\val[3]{pe} \\quad N=\\val[0]{N} \\quad ${c.n}` }],
  challenge: { kind: 'find', prompt: 'Trova la soglia a errore minimo.', hint: 'Dove le curve *pesate* si incrociano.', score: (s) => s.pe, target: () => 0.1, tolerance: 0.005 },
  terms: [{ target: 'densities', symbol: 'p(x|\\omega_i)', it: 'densità di classe', en: 'class-conditional density' }],
  notes: ['Le aree sono $P(\\text{errore})$.'],
  ariaLabel: 'Due densità di classe con la soglia',
  description: (s) => `Soglia in ${s.x}, errore ${s.pe}`,
  tabs: [{ id: 'roc', label: 'Curva $ROC$', en: 'ROC curve', overrides: { initialLayers: ['roc'] } }],
  insights: [{ id: 'min', label: 'Soglia a $P_e$ minimo', when: (s) => s.pe < 0.11, tone: 'ok' }],
}
const opts = { contexts: [{ n: 1 }, { n: 12 }], initialState: { x: 5, pe: 0.2 } }

describe('presetContract', () => {
  it('un preset sano rispetta il contratto', () => {
    expect(checkPresetContract(good, VALUE_NAMES, opts)).toEqual([])
    expect(() => presetContract(good, VALUE_NAMES, opts)).not.toThrow()
  })

  it('un \\val{} che il motore non fornisce', () => {
    const p = { ...good, formulas: [{ id: 'f', tex: '\\val{nessuno}' }] }
    expect(checkPresetContract(p, VALUE_NAMES, opts).join('\n')).toMatch(/nessuno/)
  })

  it('LaTeX che non compila: formula, didascalia, termine, nota, sfida, scheda, spia, testi del motore', () => {
    const broken = '$\\frac{1}{$'
    const p: BasePreset<Layer, Phase, Ctx, State> = {
      ...good,
      formulas: [{ id: 'f', tex: '\\frac{\\val{x}' }],
      storyboard: [{ ...good.storyboard[0], caption: broken }],
      terms: [{ target: 'densities', symbol: '\\hat{', it: 'x', en: 'x' }],
      notes: [broken],
      challenge: { ...(good.challenge as CommonChallenge<State> & { kind: 'find' }), hint: broken },
      tabs: [{ id: 't', label: broken, overrides: {} }],
      insights: [{ id: 'i', label: broken, when: () => false }],
    }
    const problems = checkPresetContract(p, VALUE_NAMES, { ...opts, texts: [broken], tex: ['\\sqrt{'] })
    for (const where of ['formula f', 'passo q', 'termine densities', 'nota 1', 'sfida', 'scheda t', 'spia i', 'testo 1', 'LaTeX 1']) {
      expect(problems.some((m) => m.includes(where)), where).toBe(true)
    }
  })

  it('uno strato iniziale non offerto, un parametro fuori intervallo, id ripetuti', () => {
    const p: BasePreset<Layer, Phase, Ctx, State> = {
      ...good,
      layers: ['densities'],
      params: [{ id: 'x', label: 'x', min: 0, max: 1, initial: 3 }],
      formulas: [
        { id: 'a', tex: 'a' },
        { id: 'a', tex: 'b' },
      ],
      tabs: undefined,
    }
    const text = checkPresetContract(p, VALUE_NAMES, opts).join('\n')
    expect(text).toMatch(/errorAreas/)
    expect(text).toMatch(/iniziale 3/)
    expect(text).toMatch(/ripetut/)
  })

  it('una sfida già superata dallo stato iniziale', () => {
    expect(checkPresetContract(good, VALUE_NAMES, { ...opts, initialState: { x: 5, pe: 0.1 } }).join('\n')).toMatch(/stato iniziale la supera/)
  })

  it('le parti che sono funzioni vogliono dei contesti in cui provarle', () => {
    expect(checkPresetContract(good, VALUE_NAMES, { initialState: opts.initialState }).join('\n')).toMatch(/contexts/)
  })

  it('una scheda viene controllata fusa col preset: i suoi strati iniziali devono essere offerti', () => {
    const p = { ...good, tabs: [{ id: 'z', label: 'Z', overrides: { layers: ['roc'] as Layer[], initialLayers: ['densities'] as Layer[] } }] }
    expect(checkPresetContract(p, VALUE_NAMES, opts).join('\n')).toMatch(/scheda z: .*densities/)
  })

  it('i bersagli della legenda sono strati, "samples" o quelli dichiarati dal motore', () => {
    const p = { ...good, terms: [{ target: 'h', symbol: 'h', it: 'larghezza', en: 'bandwidth' }] } as unknown as typeof good
    expect(checkPresetContract(p, VALUE_NAMES, opts).join('\n')).toMatch(/bersaglio h/)
    expect(checkPresetContract(p, VALUE_NAMES, { ...opts, termTargets: ['h'] })).toEqual([])
  })

  it('presetContract lancia un errore che elenca tutti i problemi', () => {
    const p = { ...good, ariaLabel: ' ', initialLayers: ['roc', 'densities'] as Layer[], layers: ['densities'] as Layer[] }
    expect(() => presetContract(p, VALUE_NAMES, opts)).toThrow(/ariaLabel[\s\S]*roc/)
  })
})
