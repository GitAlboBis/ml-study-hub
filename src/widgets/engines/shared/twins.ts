// I gemelli (docs/plan/engines.md, regola 13): moduli che si sovrappongono (m03-m08 sulle stesse slide, m11-m12,
// m01-m02, m09-m10) hanno widget quasi omonimi sullo stesso motore. Le loro specifiche differiscono per scenario,
// dati, sfida e pannelli: il preset li deve rendere tutti, e un test per coppia controlla che due gemelli non siano
// stati appiattiti sullo stesso preset:
//
//   expect(twinsDiffer({ meta: metaA, preset: presetA }, { meta: metaB, preset: presetB }).missing).toEqual([])
//
// Che cosa conta come differenza:
// - scenario: la chiave del cast (meta.scenario) oppure i dati del preset (i campi di `scenarioKeys`: data, source,
//   model, seed…). La sola frase dello scenario (scenarioNote) non basta: descrive, non cambia i dati;
// - sfida: la sua meccanica (tipo, funzioni, tolleranze, opzioni, chip e risposta), non le parole: una consegna
//   riscritta sulla stessa sfida non fa due widget;
// - pannello o strato: strati offerti o iniziali, pannelli, viste, schede, spie, parametri (i campi di `panelKeys`).
// Le funzioni si confrontano per sorgente: due funzioni scritte uguali sono la stessa funzione.
import type { WidgetMeta } from '../../types'

export interface TwinWidget {
  meta: WidgetMeta
  preset: object
}

export interface TwinsOptions {
  /** campi del preset che fanno lo scenario, oltre a quelli predefiniti */
  scenarioKeys?: readonly string[]
  /** campi del preset che fanno pannelli e strati, oltre a quelli predefiniti */
  panelKeys?: readonly string[]
}

export interface TwinsReport {
  /** vero se i due gemelli differiscono per scenario, sfida e almeno un pannello o strato */
  ok: boolean
  scenario: boolean
  challenge: boolean
  panelOrLayer: boolean
  /** ciò che manca, in parole: 'scenario', 'sfida', 'pannello o strato' */
  missing: string[]
}

/** Campi dei preset dei venti motori che portano i dati dello scenario. */
export const SCENARIO_KEYS: readonly string[] = [
  'scenario', 'data', 'source', 'model', 'models', 'signal', 'scene', 'classes', 'features', 'criterion', 'task', 'seed',
  'estimators', 'objective', 'nodes', 'edges', 'decks', 'samples', 'generator', 'prior', 'families', 'init', 'axis', 'axisX', 'domain',
]
/** Campi dei preset dei venti motori che portano pannelli, viste e strati. */
export const PANEL_KEYS: readonly string[] = [
  'layers', 'initialLayers', 'panels', 'sidePanels', 'views', 'view', 'layout', 'preview', 'curves', 'panes', 'linked', 'counters',
  'insights', 'tabs', 'params', 'objects', 'mode', 'probe', 'measures', 'criteria', 'methods', 'algorithms', 'matrix', 'spectrum',
]
/** Le parole di una sfida: cambiarle non cambia la sfida. */
const PROSE_KEYS = new Set(['prompt', 'hint', 'reveal', 'explain', 'label', 'en', 'it'])

/**
 * Chiave testuale stabile di un valore: chiavi degli oggetti in ordine, funzioni per sorgente, undefined ignorato.
 * `skip` toglie dei campi a ogni livello (le parole di una sfida).
 */
export function stableKey(value: unknown, skip: ReadonlySet<string> = new Set()): string {
  const seen = new WeakSet<object>()
  const walk = (v: unknown): string => {
    if (typeof v === 'function') return `fn:${v.toString()}`
    if (v === null || typeof v !== 'object') return typeof v === 'string' ? JSON.stringify(v) : String(v)
    if (seen.has(v)) return '[ciclo]'
    seen.add(v)
    const text = Array.isArray(v)
      ? `[${v.map(walk).join(',')}]`
      : `{${Object.keys(v)
          .filter((k) => !skip.has(k) && (v as Record<string, unknown>)[k] !== undefined)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${walk((v as Record<string, unknown>)[k])}`)
          .join(',')}}`
    seen.delete(v)
    return text
  }
  return walk(value)
}

const pick = (preset: object, keys: readonly string[]) => Object.fromEntries(keys.map((k) => [k, (preset as Record<string, unknown>)[k]]))

/** Confronta due gemelli sullo stesso motore: scenario, meccanica della sfida, pannelli e strati. */
export function twinsDiffer(a: TwinWidget, b: TwinWidget, options: TwinsOptions = {}): TwinsReport {
  const scenarioKeys = [...SCENARIO_KEYS, ...(options.scenarioKeys ?? [])]
  const panelKeys = [...PANEL_KEYS, ...(options.panelKeys ?? [])]
  const scenario = a.meta.scenario !== b.meta.scenario || stableKey(pick(a.preset, scenarioKeys)) !== stableKey(pick(b.preset, scenarioKeys))
  const challengeOf = (p: object) => (p as { challenge?: unknown }).challenge
  const challenge = stableKey(challengeOf(a.preset), PROSE_KEYS) !== stableKey(challengeOf(b.preset), PROSE_KEYS)
  const panelOrLayer = stableKey(pick(a.preset, panelKeys)) !== stableKey(pick(b.preset, panelKeys))
  const missing = [...(scenario ? [] : ['scenario']), ...(challenge ? [] : ['sfida']), ...(panelOrLayer ? [] : ['pannello o strato'])]
  return { ok: missing.length === 0, scenario, challenge, panelOrLayer, missing }
}
