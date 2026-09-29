// Il contratto dei preset (docs/plan/engines.md, regola 8): il test generico che ogni preset di ogni motore chiama.
//
//   presetContract(preset, VALUE_NAMES, { contexts: [{ n: 1, … }, { n: 12, … }], initialState })
//
// controlla che
// - ogni \val{nome} delle formule vive esista fra i valori che il motore calcola (VALUE_NAMES);
// - ogni testo compili con KaTeX in modalità severa (throwOnError): formule con i segnaposto riempiti, didascalie,
//   etichette dei parametri, sfida, legenda, note, schede, spie, più i testi propri del motore (`texts`, `tex`);
// - ogni strato iniziale sia offerto e ogni parametro iniziale stia nel suo intervallo (paramProblems);
// - la sfida non sia superata dallo stato iniziale (challengeProblems) e sia ben formata;
// - id di passi, formule, parametri, schede e spie non si ripetano; ogni scheda, fusa col preset, rispetti a sua
//   volta il contratto.
//
// Le parti che sono funzioni del contesto (durate, didascalie, formule) si provano in ogni contesto di `contexts`:
// scegline almeno due, uno piccolo (N = 1) e quello dello scenario. Niente vitest qui dentro: il file sta in src e
// finirebbe nel bundle. checkPresetContract restituisce i problemi (expect(…).toEqual([]) mostra la differenza),
// presetContract lancia un Error che li elenca tutti.
import katex from 'katex'
import type { Rich } from '../../../content/types'
import { renderRich } from '../../../lib/rich'
import { challengeProblems, isCommonChallenge } from './challenges'
import { paramProblems } from './params'
import { applyTab, fillVals, valNames } from './presetTools'
import type { BasePreset, CommonChallenge } from './types'

export interface PresetContractOptions<Ctx, State> {
  /** Contesti in cui provare durate, didascalie e formule che sono funzioni (almeno N piccolo e quello dello scenario). */
  contexts?: readonly Ctx[]
  /** Lo stato all'apertura: la sfida non deve essere superata qui; descrizione e spie lo leggono senza errori. */
  initialState?: State
  /** Altri testi Rich del motore (Markdown con $…$): nomi degli assi, pulsanti che raccontano il caso, opzioni. */
  texts?: readonly Rich[]
  /** Altro LaTeX puro del motore (senza $): simboli, formule della slide. */
  tex?: readonly string[]
  /** Bersagli della legenda oltre agli strati e a 'samples' (density1d: 'h'). */
  termTargets?: readonly string[]
  /** Controlla anche ogni scheda fusa col preset (predefinito true). */
  tabs?: boolean
}

const texError = (tex: string, display: boolean): string | null => {
  try {
    katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'ignore' })
    return null
  } catch (e) {
    return e instanceof Error ? e.message.split('\n')[0] : String(e)
  }
}

const richError = (rich: Rich): string | null => {
  try {
    renderRich(rich, { throwOnError: true })
    return null
  } catch (e) {
    return e instanceof Error ? e.message.split('\n')[0] : String(e)
  }
}

const repeated = (ids: readonly string[]): string[] => [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]

/** I problemi del preset rispetto al contratto, in parole: vuoto se lo rispetta. */
export function checkPresetContract<Layer extends string, Phase, Ctx, State, Ch extends { kind: string }, TermTarget extends string>(
  preset: BasePreset<Layer, Phase, Ctx, State, Ch, TermTarget>,
  valueNames: readonly string[],
  options: PresetContractOptions<Ctx, State> = {},
): string[] {
  const out: string[] = []
  const { contexts = [], initialState } = options
  const rich = (where: string, text: Rich | undefined) => {
    if (text === undefined) return
    const e = richError(text)
    if (e !== null) out.push(`${where}: il testo non compila (${e})`)
  }
  const tex = (where: string, src: string, display = true) => {
    const e = texError(src, display)
    if (e !== null) out.push(`${where}: il LaTeX non compila (${e})`)
  }
  /** valuta una parte che può essere una funzione del contesto, in ogni contesto */
  const perContext = <T>(where: string, part: T | ((ctx: Ctx) => T), visit: (value: T, label: string) => void) => {
    if (typeof part !== 'function') {
      visit(part, where)
      return
    }
    if (contexts.length === 0) {
      out.push(`${where}: è una funzione del contesto, passa \`contexts\` per provarla`)
      return
    }
    contexts.forEach((ctx, i) => {
      try {
        visit((part as (c: Ctx) => T)(ctx), contexts.length > 1 ? `${where} (contesto ${i + 1})` : where)
      } catch (e) {
        out.push(`${where}: errore nel contesto ${i + 1} (${e instanceof Error ? e.message : String(e)})`)
      }
    })
  }

  // --- nome, strati, parametri ---
  if (preset.ariaLabel.trim() === '') out.push('ariaLabel vuoto: il terreno non ha un nome accessibile')
  for (const id of repeated(preset.layers)) out.push(`strato ripetuto: ${id}`)
  for (const l of preset.initialLayers) if (!preset.layers.includes(l)) out.push(`lo strato iniziale ${l} non è fra quelli offerti`)
  if (preset.aspect !== undefined && !(preset.aspect > 0)) out.push(`aspect non valido (${preset.aspect})`)
  if (preset.seed !== undefined && !Number.isInteger(preset.seed)) out.push(`seed non intero (${preset.seed})`)
  for (const id of repeated((preset.params ?? []).map((p) => p.id))) out.push(`parametro ripetuto: ${id}`)
  for (const p of preset.params ?? []) {
    out.push(...paramProblems(p).map((m) => `parametro ${m}`))
    rich(`parametro ${p.id}`, p.label)
  }

  // --- storyboard ---
  if (preset.storyboard.length === 0) out.push('storyboard vuoto: serve almeno il passo del quadro completo')
  for (const id of repeated(preset.storyboard.map((s) => s.id))) out.push(`passo ripetuto: ${id}`)
  for (const step of preset.storyboard) {
    if (step.label.trim() === '') out.push(`passo ${step.id}: titolo vuoto`)
    perContext(`passo ${step.id} (durata)`, step.durationMs, (d, where) => {
      if (!(d >= 0 && Number.isFinite(d))) out.push(`${where}: durata non valida (${d})`)
    })
    perContext(`passo ${step.id}`, step.caption, (c, where) => rich(where, c))
  }

  // --- formule vive ---
  const names = new Set(valueNames)
  for (const id of repeated(preset.formulas.map((f) => f.id))) out.push(`formula ripetuta: ${id}`)
  for (const f of preset.formulas) {
    perContext(`formula ${f.id}`, f.tex, (src, where) => {
      for (const name of valNames(src)) if (!names.has(name)) out.push(`${where}: \\val{${name}} non è fra i valori del motore`)
      tex(where, fillVals(src))
    })
  }

  // --- sfida ---
  const ch = preset.challenge
  if (ch !== undefined) {
    if (isCommonChallenge<State>(ch)) {
      out.push(...challengeProblems(ch as CommonChallenge<State>, initialState))
      const c = ch as CommonChallenge<State>
      rich('sfida (consegna)', c.prompt)
      if ('hint' in c) rich('sfida (indizio)', c.hint)
      if (c.kind === 'custom') rich('sfida (rivelazione)', c.reveal)
      if (c.kind === 'predict' && typeof c.input === 'object') c.input.options.forEach((o, i) => rich(`sfida (opzione ${i + 1})`, o))
      if (c.kind === 'sort') {
        for (const item of c.items) rich(`sfida (chip ${item.id})`, item.label)
        for (const bin of c.bins) rich(`sfida (contenitore ${bin.id})`, bin.label)
        for (const [id, e] of Object.entries(c.explain ?? {})) rich(`sfida (spiegazione ${id})`, e)
      }
    } else {
      // una sfida del motore: se ha consegna e indizio li si compila comunque
      const extra = ch as { prompt?: unknown; hint?: unknown }
      if (typeof extra.prompt === 'string') rich('sfida (consegna)', extra.prompt)
      if (typeof extra.hint === 'string') rich('sfida (indizio)', extra.hint)
    }
  }

  // --- legenda, note, descrizione ---
  const targets = new Set<string>([...preset.layers, 'samples', ...(options.termTargets ?? [])])
  for (const t of preset.terms ?? []) {
    if (!targets.has(t.target)) out.push(`termine ${t.target}: il bersaglio ${t.target} non è uno strato offerto`)
    if (t.en.trim() === '') out.push(`termine ${t.target}: manca il termine inglese`)
    tex(`termine ${t.target} (simbolo)`, t.symbol, false)
    rich(`termine ${t.target}`, t.it)
  }
  ;(preset.notes ?? []).forEach((n, i) => rich(`nota ${i + 1}`, n))
  if (typeof preset.description === 'function' && initialState !== undefined) {
    try {
      preset.description(initialState)
    } catch (e) {
      out.push(`descrizione: errore sullo stato iniziale (${e instanceof Error ? e.message : String(e)})`)
    }
  }

  // --- spie ---
  for (const id of repeated((preset.insights ?? []).map((i) => i.id))) out.push(`spia ripetuta: ${id}`)
  for (const ins of preset.insights ?? []) {
    rich(`spia ${ins.id}`, ins.label)
    if (initialState !== undefined) {
      try {
        ins.when(initialState)
      } catch (e) {
        out.push(`spia ${ins.id}: errore sullo stato iniziale (${e instanceof Error ? e.message : String(e)})`)
      }
    }
  }

  // --- testi propri del motore ---
  ;(options.texts ?? []).forEach((t, i) => rich(`testo ${i + 1}`, t))
  ;(options.tex ?? []).forEach((t, i) => tex(`LaTeX ${i + 1}`, t))

  // --- schede: ognuna, fusa col preset, rispetta a sua volta il contratto ---
  for (const id of repeated((preset.tabs ?? []).map((t) => t.id))) out.push(`scheda ripetuta: ${id}`)
  for (const tab of preset.tabs ?? []) {
    rich(`scheda ${tab.id}`, tab.label)
    if (options.tabs === false) continue
    const merged = applyTab(preset, tab.id)
    const inner = checkPresetContract({ ...merged, tabs: undefined }, valueNames, { ...options, texts: [], tex: [] })
    out.push(...inner.map((m) => `scheda ${tab.id}: ${m}`))
  }
  return [...new Set(out)]
}

/** Lancia un Error che elenca tutti i problemi del preset; non fa nulla se il preset rispetta il contratto. */
export function presetContract<Layer extends string, Phase, Ctx, State, Ch extends { kind: string }, TermTarget extends string>(
  preset: BasePreset<Layer, Phase, Ctx, State, Ch, TermTarget>,
  valueNames: readonly string[],
  options: PresetContractOptions<Ctx, State> = {},
): void {
  const problems = checkPresetContract(preset, valueNames, options)
  if (problems.length > 0) throw new Error(`Il preset non rispetta il contratto (${problems.length}):\n- ${problems.join('\n- ')}`)
}
