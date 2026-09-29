// Aiuti puri sui preset dei motori (types.ts): storyboard, formule, schede, strati, spie, testo semplice.
// Nessun React: li usano i componenti dei motori, quelli comuni (TabStrip, InsightLamps, ParamSlider) e
// presetContract. Tutto testato in presetTools.test.ts.
import type { Rich } from '../../../content/types'
import type { StoryboardStep } from '../../kit/useStoryboard'
import type { EngineFormula, EngineStep, Insight } from './types'

// --- storyboard e formule ---

/** I passi per useStoryboard del kit, con le durate risolte nel contesto corrente (N, h…). */
export function resolveEngineSteps<Phase, Ctx>(steps: readonly EngineStep<Phase, Ctx>[], ctx: Ctx): StoryboardStep[] {
  return steps.map((s) => ({ id: s.id, label: s.label, durationMs: typeof s.durationMs === 'function' ? s.durationMs(ctx) : s.durationMs }))
}

/** La didascalia di un passo nel contesto corrente. */
export function captionOf<Phase, Ctx>(step: EngineStep<Phase, Ctx>, ctx: Ctx): Rich {
  return typeof step.caption === 'function' ? step.caption(ctx) : step.caption
}

/** Il LaTeX di una formula viva nel contesto corrente (una formula può scrivere solo gli addendi che esistono). */
export function formulaTexOf<Ctx>(formula: EngineFormula<Ctx>, ctx: Ctx): string {
  return typeof formula.tex === 'function' ? formula.tex(ctx) : formula.tex
}

/** Segnaposto di LiveFormula: \val{nome} e \val[decimali]{nome}. Globale: usarlo con matchAll o replace. */
export const VAL_PATTERN = /\\val(?:\[(\d+)\])?\{([^{}]+)\}/g

/** I nomi dei valori citati da un LaTeX con segnaposto, nell'ordine, una volta sola. */
export function valNames(tex: string): string[] {
  return [...new Set([...tex.matchAll(VAL_PATTERN)].map((m) => m[2].trim()))]
}

/** Il LaTeX con un numero al posto di ogni segnaposto (fra graffe, come fa LiveFormula): per compilarlo nei test. */
export const fillVals = (tex: string, value = '1.23'): string => tex.replace(VAL_PATTERN, `{${value}}`)

/**
 * Indice della prima formula con segnaposto, -1 se nessuna ne ha: è quella che annuncia i valori ai lettori di
 * schermo (le altre hanno announce={false}, WIDGET_GUIDE §6).
 */
export function firstLiveFormula<Ctx>(formulas: readonly EngineFormula<Ctx>[], ctx: Ctx): number {
  return formulas.findIndex((f) => valNames(formulaTexOf(f, ctx)).length > 0)
}

// --- schede, strati, descrizione, spie ---

interface WithTabs {
  tabs?: readonly { id: string; overrides: object }[]
}

/**
 * Il preset con gli override della scheda `tabId` fusi sopra (fusione di primo livello: un campo della scheda
 * sostituisce quello di base). Le schede restano quelle del preset di base. Id sconosciuto o null: il preset
 * com'è, lo stesso oggetto.
 */
export function applyTab<P extends WithTabs>(preset: P, tabId: string | null | undefined): P {
  const tab = tabId == null ? undefined : preset.tabs?.find((t) => t.id === tabId)
  if (tab === undefined) return preset
  return { ...preset, ...tab.overrides, tabs: preset.tabs }
}

/**
 * Id nel DOM della scheda `tabId` di un TabStrip con id `stripId`: il motore lo usa per il pannello
 * (`<div role="tabpanel" id={panelId} aria-labelledby={tabElementId(stripId, tab)}>`).
 */
export const tabElementId = (stripId: string, tabId: string): string => `${stripId}-tab-${tabId}`

/** Gli strati accesi all'apertura: quelli iniziali che il preset offre davvero, nell'ordine iniziale. */
export function initialLayersOf<Layer extends string>(preset: { layers: readonly Layer[]; initialLayers: readonly Layer[] }): Layer[] {
  return preset.initialLayers.filter((l) => preset.layers.includes(l))
}

/** La descrizione del terreno per lo stato corrente (stringa vuota se il preset non ne ha). */
export function descriptionOf<State>(preset: { description?: string | ((s: State) => string) }, state: State): string {
  const d = preset.description
  return d === undefined ? '' : typeof d === 'function' ? d(state) : d
}

/** Le spie accese per lo stato corrente, nell'ordine del preset. */
export function litInsights<State>(insights: readonly Insight<State>[], state: State): Insight<State>[] {
  return insights.filter((i) => i.when(state))
}

// --- testo semplice ---

const GREEK: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ',
  iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ',
  phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
}
const SYMBOLS: Record<string, string> = {
  le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', sim: '~', cdot: '·', times: '×', infty: '∞', to: '→',
  rightarrow: '→', leftarrow: '←', pm: '±', in: '∈', sum: 'Σ', prod: 'Π', int: '∫', partial: '∂', nabla: '∇', propto: '∝',
  ldots: '…', cdots: '…', dots: '…', mid: '|',
}
/** Comandi il cui argomento resta com'è: \mathrm{Bayes} → Bayes. */
const WRAPPERS = /\\(?:mathrm|mathbf|mathcal|mathit|mathsf|boldsymbol|text|textrm|textit|operatorname|mathbb)\s*\{([^{}]*)\}/g

/** Da LaTeX a testo leggibile, per annunci e nomi accessibili: approssimato, non un convertitore completo. */
function texToPlain(tex: string): string {
  let s = tex
  let before = ''
  // dall'interno verso l'esterno: \frac{\hat{p}}{N} ha graffe annidate
  while (s !== before) {
    before = s
    s = s
      .replace(WRAPPERS, '$1')
      .replace(/\\hat\s*\{([^{}]*)\}/g, '$1̂')
      .replace(/\\hat\s*([A-Za-z])/g, '$1̂')
      .replace(/\\(?:bar|overline)\s*\{([^{}]*)\}/g, '$1̄')
      .replace(/\\tilde\s*\{([^{}]*)\}/g, '$1̃')
      .replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2')
      .replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)')
      .replace(/([_^])\{([^{}]*)\}/g, '$1$2')
  }
  return s
    .replace(/\\left|\\right|\\big|\\Big|\\!/g, '')
    .replace(/\\[,;:> ]|~/g, ' ')
    .replace(/\\([A-Za-z]+)/g, (_m, name: string) => GREEK[name] ?? SYMBOLS[name] ?? '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Matematica fra $$…$$ o $…$ (non un "\$" letterale). */
const MATH = /(?<!\\)\$\$([\s\S]+?)\$\$|(?<!\\)\$((?:\\.|[^$\\])+?)\$/g

/**
 * Da Rich (Markdown con $…$) a testo semplice: per le regioni aria-live e i nomi accessibili, dove la matematica
 * di KaTeX non si può mettere. "$\hat p(x)$ con **h**" → "p̂(x) con h".
 */
export function richToPlain(rich: Rich): string {
  return rich
    .replace(MATH, (_m, display: string | undefined, inline: string | undefined) => texToPlain(display ?? inline ?? ''))
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_(?=\S)|`)/g, (m, _g, offset: number, all: string) => (m === '_' && /\w/.test(all[offset - 1] ?? '') ? m : ''))
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Un'etichetta Rich divisa per gli slider del kit, che vogliono parole (`label`) e simbolo (`latex`) separati:
 * se l'etichetta FINISCE con una formula, quella è il simbolo e le parole sono il resto; altrimenti tutto è parole.
 */
export function splitRichLabel(rich: Rich): { text: string; tex?: string } {
  const m = /(?<!\\)\$((?:\\.|[^$\\])+?)\$\s*$/.exec(rich)
  if (m === null) return { text: richToPlain(rich) }
  const text = richToPlain(rich.slice(0, m.index))
  return text === '' ? { text: richToPlain(rich), tex: m[1].trim() } : { text, tex: m[1].trim() }
}
