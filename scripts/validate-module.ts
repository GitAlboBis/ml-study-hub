// scripts/validate-module.ts
// Validatore di modulo: gate G2 (ogni concetto dell'inventario ha un posto nell'app), G3 (ogni formula compila),
// G4 (pratica sufficiente), G6 (figure presenti).
//
// Uso: npx tsx scripts/validate-module.ts <moduleId> [--root <cartella>]
// Stampa `PASS <id>: …` (exit 0) oppure `FAIL <id>: N errori` con l'elenco (exit 1).
// `--root` fa leggere docs/plan, docs/inventory, src/content/modules e public da un'altra cartella di progetto:
// serve ai test, che lavorano su una copia temporanea senza toccare il repo.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { compile } from '@mdx-js/mdx'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { visit } from 'unist-util-visit'
import type { ModuleData, PageRef } from '../src/content/types'
import { extractMath, renderTex } from '../src/lib/rich'
import { createRng } from '../src/lib/rng'

// ---------------------------------------------------------------------------------------------------
// Contratto con gli autori
// ---------------------------------------------------------------------------------------------------

/** Componenti MDX ammessi e attributi obbligatori: la stessa tabella del Task 3.10 e di docs/CONTENT_GUIDE.md. */
const COMPONENTS: Record<string, string[]> = {
  Formula: ['id'], Derivation: ['id'], Figure: ['id'], Widget: ['id'], Example: ['id', 'title'], Step: ['title'],
  Callout: ['kind'], Definition: ['term', 'en'], KeyIdea: [], Reveal: ['label'], Proof: ['title'], Check: ['id'],
  SourceRef: ['doc', 'page'], ModLink: ['to'], Term: ['en'], Columns: [], Col: ['title'],
}
const CALLOUT_KINDS = ['intuizione', 'attenzione', 'esame', 'suggerimento', 'nota', 'inglese']
const DOCS = ['part1', 'part2', 'ch1', 'ch2', 'ch3', 'ch4', 'dl', 'examq']
const INVENTORY_LISTS = ['concepts', 'derivations', 'workedExamples', 'figures', 'widgets', 'exercises', 'examQuestions'] as const
const DATA_LISTS = ['sources', 'prerequisites', 'keyPoints', 'glossary', 'formulas', 'derivations', 'figures', 'flashcards', 'quiz', 'exam', 'exercises', 'widgets', 'connections'] as const
const MAX_SHOWN = 120
/** Codici interni che non devono arrivare allo studente: si scrive il nome della cosa, o un rimando [nome](#derivation:der04). */
const ID_LEAK = /\b(der\d{2}|ex\d{2}|fig\d{2}|es\d{2}|f-c\d{2}(?:-\d+)?|chk-\d{2}|c\d{2})\b/g
/** Ancore degli elementi del foglio (targetId in src/components/content/ModuleContext.tsx). */
const TARGET = /^(formula|derivation|figure|widget|example|quiz|exercise|exam|flashcard):(.+)$/
const SEEDS = 20

// Stessa grammatica di src/lib/rich.ts, che non esporta la regex: codice Markdown | $$display$$ | $inline$.
// Se le due divergono, rich() qui sotto se ne accorge (conta diversa da extractMath) e lo dice.
const MATH = /(```[\s\S]*?```|`[^`\n]+`)|(?<!\\)\$\$((?:\\[\s\S]|[^\\])+?)\$\$|(?<!\\)\$((?:\\[^\n]|[^$\\\n])+?)\$/g

// ---------------------------------------------------------------------------------------------------
// Tipi locali
// ---------------------------------------------------------------------------------------------------

interface InvConcept { id: string; name: string; kind: string; noWidgetReason?: string }
interface Inventory {
  concepts: InvConcept[]
  derivations: { id: string; title: string }[]
  workedExamples: { id: string; title: string }[]
  figures: { id: string; importance: number }[]
  widgets: { id: string }[]
  exercises: { id: string }[]
  examQuestions: { text: string }[]
}
interface ManifestEntry { id: string }
interface HastNode { type: string; position?: { start: { line: number } } }
interface HastElement extends HastNode { tagName: string; properties?: Record<string, unknown> }
interface JsxAttribute { type: string; name?: string; value?: string | null | { value: string } }
interface JsxElement extends HastNode { name: string | null; attributes: JsxAttribute[] }
type AttrValue = string | number | boolean | { expr: string }
type Sink = (message: string) => void

/** Errore che chiude subito la validazione: senza questi pezzi il resto dei controlli non ha senso. */
class Fatal extends Error {}

const text = (e: unknown) => (e instanceof Error ? e.message : String(e))
const short = (s: string, max = 160) => (s.length > max ? s.slice(0, max) + '…' : s)
const squash = (s: string) => s.replace(/\s+/g, ' ').trim()

// ---------------------------------------------------------------------------------------------------
// MDX
// ---------------------------------------------------------------------------------------------------

function attrValue(a: JsxAttribute): AttrValue {
  if (a.value === null || a.value === undefined) return true
  if (typeof a.value === 'string') return a.value
  const src = a.value.value.trim() // attributo con espressione: page={53}, id={"x"}
  if (/^-?\d+(\.\d+)?$/.test(src)) return Number(src)
  if (src === 'true' || src === 'false') return src === 'true'
  const quoted = /^(['"])((?:(?!\1)[^\\])*)\1$/.exec(src)
  return quoted ? quoted[2] : { expr: src }
}

/** Titoli (slug generati da rehype-slug, gli stessi dell'app) di un file MDX; null se non esiste o non compila. */
async function headingsOf(file: string): Promise<Map<string, number> | null> {
  if (!fs.existsSync(file)) return null
  const found = new Map<string, number>()
  const collect = () => (tree: HastNode) => {
    visit(tree as never, 'element', (el: HastElement) => {
      const rank = /^h([1-6])$/.exec(el.tagName)
      if (rank && typeof el.properties?.id === 'string') found.set(el.properties.id, Number(rank[1]))
    })
  }
  try {
    await compile({ value: fs.readFileSync(file, 'utf8'), path: file }, { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeSlug, collect] })
    return found
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------------------------------
// Validazione
// ---------------------------------------------------------------------------------------------------

async function validate(id: string, root: string): Promise<{ errors: string[]; warnings: string[]; summary: string }> {
  const errors: string[] = []
  const warnings: string[] = []
  const err: Sink = (m) => errors.push(m)
  const warn: Sink = (m) => warnings.push(m)
  const rel = (...parts: string[]) => parts.join('/')
  const abs = (...parts: string[]) => path.join(root, ...parts)

  // --- ingressi -----------------------------------------------------------------------------------
  const manifestPath = abs('docs/plan/modules.json')
  if (!fs.existsSync(manifestPath)) throw new Fatal(`manifest non trovato: ${rel('docs/plan/modules.json')}`)
  let manifest: ManifestEntry[]
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    if (!Array.isArray(manifest)) throw new Error('atteso un array di moduli')
  } catch (e) {
    throw new Fatal(`manifest non leggibile (docs/plan/modules.json): ${text(e)}`)
  }
  const moduleIds = new Set(manifest.map((m) => m.id))
  if (!moduleIds.has(id)) warn(`${id} non è in docs/plan/modules.json`)

  const inventoryRel = rel('docs/inventory', `${id}.json`)
  if (!fs.existsSync(abs(inventoryRel))) throw new Fatal(`inventario non trovato: ${inventoryRel}`)
  let rawInventory: Record<string, unknown>
  try {
    rawInventory = JSON.parse(fs.readFileSync(abs(inventoryRel), 'utf8'))
  } catch (e) {
    throw new Fatal(`inventario non leggibile (${inventoryRel}): ${text(e)}`)
  }
  // Un inventario a metà (stadi non chiusi) ha campi mancanti o segnaposto: lo si dice, senza esplodere.
  const inventory = {} as Inventory
  for (const k of INVENTORY_LISTS) {
    const list = rawInventory[k]
    if (!Array.isArray(list)) err(`inventario: campo "${k}" mancante o non array (inventario incompleto? node scripts/check-inventory.mjs ${id})`)
    const items = Array.isArray(list) ? list : []
    const objects = items.filter((x) => x !== null && typeof x === 'object')
    if (objects.length !== items.length) err(`inventario: "${k}" contiene ${items.length - objects.length} voci che non sono oggetti (segnaposto?)`)
    ;(inventory as unknown as Record<string, unknown[]>)[k] = objects
  }

  const dir = rel('src/content/modules', id)
  const dataRel = rel(dir, 'data.ts')
  const mdxRel = rel(dir, 'index.mdx')
  if (!fs.existsSync(abs(dataRel))) throw new Fatal(`modulo non trovato: ${dataRel}`)
  if (!fs.existsSync(abs(mdxRel))) throw new Fatal(`teoria non trovata: ${mdxRel}`)

  // Import dinamico via tsx. Su Windows un percorso assoluto non è uno specifier valido: serve l'URL file://.
  let data: ModuleData
  try {
    data = ((await import(pathToFileURL(abs(dataRel)).href)) as { default?: ModuleData }).default as ModuleData
  } catch (e) {
    throw new Fatal(`data.ts non si carica -> ${short(text(e), 800)}`)
  }
  if (!data || typeof data !== 'object') throw new Fatal(`${dataRel} non ha un export default (export default defineModule({ … }))`)
  for (const k of DATA_LISTS) {
    if (!Array.isArray(data[k])) {
      err(`data.${k} mancante o non array`)
      ;(data as unknown as Record<string, unknown[]>)[k] = []
    }
  }
  if (!data.coverage || typeof data.coverage !== 'object') {
    err('data.coverage mancante')
    data.coverage = {}
  }

  /** Un controllo che esplode (data.ts fuori contratto) diventa un errore leggibile e non ferma gli altri. */
  const section = async (name: string, run: () => void | Promise<void>) => {
    try {
      await run()
    } catch (e) {
      err(`${name}: controllo interrotto da un'eccezione -> ${short(text(e))} (data.ts rispetta ModuleData? npx tsc -p tsconfig.app.json --noEmit)`)
    }
  }

  // --- strumenti ----------------------------------------------------------------------------------
  const tex = (t: string, where: string, display = true, sink: Sink = err) => {
    try {
      renderTex(t, display, true)
    } catch (e) {
      sink(`${where}: KaTeX -> ${short(text(e))}`)
    }
  }
  const richAnchors: { slug: string; where: string }[] = [] // rimandi [testo](#...) scritti nei testi Rich
  const rich = (t: string | undefined, where: string, sink: Sink = err) => {
    if (t === undefined || t === '') return
    if (typeof t !== 'string') return sink(`${where}: atteso un testo, trovato ${typeof t}`)
    const found = extractMath(t)
    for (const s of found) tex(s.tex, where, s.display, sink)
    let count = 0
    const rest = t.replace(MATH, (_whole, code: string | undefined) => {
      if (code === undefined) count++
      return ' '
    })
    if (count !== found.length) sink(`${where}: validatore e src/lib/rich.ts non concordano sulla matematica (${count} contro ${found.length}): riallineare MATH in scripts/validate-module.ts`)
    else if (/(?<!\\)\$/.test(rest)) sink(`${where}: $ spaiato (formula non chiusa, a capo dentro $…$, oppure un dollaro da scrivere \\$)`)
    const visible = rest.replace(/\]\(([^)\s]*)\)/g, (_m, href: string) => {
      if (href.startsWith('#')) richAnchors.push({ slug: decodeURIComponent(href.slice(1)), where })
      return ']'
    })
    const leak = visible.match(ID_LEAK)
    if (leak) sink(`${where}: codice interno visibile allo studente (${[...new Set(leak)].join(', ')}): scrivi il nome della cosa, oppure un rimando [nome](#derivation:der04)`)
  }
  const pageRef = (p: PageRef | undefined, where: string) => {
    if (!p || !DOCS.includes(p.doc) || !Number.isInteger(p.page) || p.page < 1) err(`${where}: pagina sorgente non valida ${JSON.stringify(p)} (doc: ${DOCS.join('|')}, page intero >= 1)`)
  }
  const sources = (list: PageRef[], where: string) => {
    if (!list?.length) err(`${where}: source vuoto, serve almeno una pagina sorgente`)
    else list.forEach((p, i) => pageRef(p, `${where}.source[${i}]`))
  }
  const conceptIds = new Set(inventory.concepts.map((c) => c.id))
  const concepts = (list: string[] | undefined, where: string) => {
    for (const c of list ?? []) if (!conceptIds.has(c)) err(`${where}: concetto inesistente nell'inventario ${c}`)
  }

  // --- 1. identità --------------------------------------------------------------------------------
  if (data.id !== id) err(`data.id deve essere ${id} (trovato ${JSON.stringify(data.id)})`)
  if (rawInventory.moduleId !== undefined && rawInventory.moduleId !== id) err(`inventario: moduleId deve essere ${id}`)
  await section('collegamenti', () => {
    for (const p of data.prerequisites) if (!moduleIds.has(p)) err(`prerequisites: modulo inesistente ${p}`)
    data.connections.forEach((c, i) => {
      if (!moduleIds.has(String(c.to).split('#')[0])) err(`connections[${i}]: modulo inesistente ${c.to}`)
      rich(c.why, `connections[${i}].why`)
    })
  })

  // --- 2. KaTeX su ogni Latex e su ogni $…$ dentro i Rich (G3) --------------------------------------
  await section('testi', () => {
    rich(data.summary, 'summary')
    data.keyPoints.forEach((k, i) => rich(k, `keyPoints[${i}]`))
    data.glossary.forEach((g, i) => rich(g.def, `glossary[${i}]`))
  })
  await section('formule', () => {
    for (const f of data.formulas) {
      const w = `formula ${f.id}`
      tex(f.latex, w)
      rich(f.explain, `${w}.explain`)
      rich(f.whenToUse, `${w}.whenToUse`)
      rich(f.pitfalls, `${w}.pitfalls`)
      f.symbols.forEach((s, i) => {
        tex(s.s, `${w}.symbols[${i}]`, false)
        rich(s.meaning, `${w}.symbols[${i}].meaning`)
      })
      f.blanks.forEach((b, i) => {
        tex(b.masked, `${w}.blanks[${i}].masked`)
        tex(b.answer, `${w}.blanks[${i}].answer`)
        b.distractors.forEach((d, j) => tex(d, `${w}.blanks[${i}].distractors[${j}]`))
        // il gioco "Completa la formula" mostra masked e fa scegliere tra answer e i distrattori
        if (!String(b.masked).includes('\\boxed')) err(`${w}.blanks[${i}].masked: manca \\boxed{\\;?\\;} al posto della risposta`)
        if (b.distractors.length < 2) err(`${w}.blanks[${i}]: servono almeno 2 distrattori`)
        if (b.distractors.some((d) => squash(d) === squash(b.answer))) err(`${w}.blanks[${i}]: un distrattore coincide con la risposta`)
      })
      if (f.importance === 3 && f.blanks.length === 0) err(`${w}: importanza 3 richiede almeno un blank`)
      sources(f.source, w)
    }
  })
  await section('derivazioni', () => {
    for (const d of data.derivations) {
      const w = `derivation ${d.id}`
      rich(d.goal, `${w}.goal`)
      rich(d.assumptions, `${w}.assumptions`)
      rich(d.conclusion, `${w}.conclusion`)
      d.steps.forEach((s, i) => {
        tex(s.latex, `${w}.steps[${i}]`)
        rich(s.why, `${w}.steps[${i}].why`)
      })
      if (d.steps.length < 3) err(`${w}: meno di 3 passaggi`)
      sources(d.source, w)
    }
  })
  await section('flashcard', () => {
    for (const c of data.flashcards) {
      rich(c.q, `flashcard ${c.id}.q`)
      rich(c.a, `flashcard ${c.id}.a`)
    }
  })
  await section('quiz', () => {
    for (const q of data.quiz) {
      const w = `quiz ${q.id}`
      rich(q.q, w)
      rich(q.explanation, `${w}.explanation`)
      concepts(q.concepts, w)
      if (q.type === 'mcq') {
        q.options.forEach((o, i) => rich(o, `${w}.options[${i}]`))
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) err(`${w}: answer fuori range`)
      } else if (q.type === 'multi') {
        q.options.forEach((o, i) => rich(o, `${w}.options[${i}]`))
        if (!q.answers.length || q.answers.some((a) => !Number.isInteger(a) || a < 0 || a >= q.options.length)) err(`${w}: answers non validi`)
      } else if (q.type === 'numeric') {
        if (!Number.isFinite(q.answer)) err(`${w}: answer deve essere un numero finito`)
        if (!(q.tolerance > 0)) err(`${w}: tolerance deve essere > 0`)
      } else if (q.type === 'tf') {
        if (typeof q.answer !== 'boolean') err(`${w}: answer deve essere true o false`)
      } else err(`${w}: type non valido (mcq|multi|tf|numeric)`)
    }
  })
  await section('orale', () => {
    for (const e of data.exam) {
      const w = `exam ${e.id}`
      rich(e.q, w)
      rich(e.answer, `${w}.answer`)
      if (!e.qEn) err(`${w}: manca qEn`)
      if (e.fromBank && !e.bankText) err(`${w}: fromBank è true ma manca bankText (testo verbatim della banca)`)
      if (e.checklist.length < 3) err(`${w}: checklist < 3 punti`)
      e.followUps.forEach((f, i) => {
        rich(f.q, `${w}.followUps[${i}].q`)
        rich(f.a, `${w}.followUps[${i}].a`)
      })
    }
  })

  // --- 3. unicità degli id ------------------------------------------------------------------------
  const lists = { formulas: data.formulas, derivations: data.derivations, figures: data.figures, flashcards: data.flashcards, quiz: data.quiz, exam: data.exam, exercises: data.exercises, widgets: data.widgets }
  await section('id', () => {
    for (const [name, list] of Object.entries(lists)) {
      const seen = new Set<string>()
      for (const x of list as { id: string }[]) {
        if (!x.id) err(`${name}: voce senza id`)
        else if (seen.has(x.id)) err(`${name}: id duplicato ${x.id}`)
        seen.add(x.id)
      }
    }
  })

  // --- 4. esercizi generativi: 20 seed, stesso seed = stessa istanza -------------------------------
  for (const ex of data.exercises) {
    // lo stesso difetto su più seed si dice una volta sola, con i seed che lo mostrano
    const found = new Map<string, number[]>()
    for (let seed = 1; seed <= SEEDS; seed++) {
      const sink: Sink = (m) => found.set(m, [...(found.get(m) ?? []), seed])
      try {
        const inst = ex.generate(createRng(seed))
        rich(inst.prompt, 'prompt', sink)
        rich(inst.solution, 'solution', sink)
        if (!inst.prompt) sink('prompt vuoto')
        if (!inst.answers?.length || inst.answers.some((a) => !Number.isFinite(a.value) || !(a.tolerance > 0))) sink('risposte assenti, non finite o con tolleranza nulla')
        if (JSON.stringify(ex.generate(createRng(seed))) !== JSON.stringify(inst)) sink('stesso seed, istanze diverse: usare solo rng, mai Math.random o Date')
      } catch (e) {
        sink(`eccezione -> ${short(text(e))}`)
      }
    }
    const shown = [...found].slice(0, 4)
    for (const [m, seeds] of shown) err(`exercise ${ex.id} [seed ${seeds.slice(0, 5).join(', ')}${seeds.length > 5 ? ` e altri ${seeds.length - 5}` : ''}]: ${m}`)
    if (found.size > shown.length) err(`exercise ${ex.id}: altri ${found.size - shown.length} difetti diversi sugli stessi seed`)
    concepts(ex.concepts, `exercise ${ex.id}`)
  }

  // --- 5. figure (G6) -----------------------------------------------------------------------------
  await section('figure', () => {
    for (const f of data.figures) {
      const file = rel('public', String(f.file).replace(/^[\\/]+/, ''))
      if (!f.file || !fs.existsSync(abs(file)) || !fs.statSync(abs(file)).isFile()) err(`figure ${f.id}: file mancante ${file}`)
      if (!f.alt) err(`figure ${f.id}: manca alt`)
      rich(f.caption, `figure ${f.id}.caption`)
      pageRef(f.source, `figure ${f.id}.source`)
    }
    const needed = inventory.figures.filter((f) => f.importance >= 2).length
    if (data.figures.length < needed) err(`figure: ${data.figures.length} < ${needed} figure con importanza >= 2 nell'inventario`)
  })
  await section('widget', () => data.widgets.forEach((w) => concepts(w.concepts, `widget ${w.id}`)))

  // --- 6. MDX: compilazione, componenti ammessi, riferimenti, titoli ---------------------------------
  const headings = new Map<string, number>() // slug -> livello del titolo
  const exampleIds = new Set<string>()
  const crossLinks: { to: string; where: string }[] = [] // ancore verso altri moduli, verificate più sotto
  const anchors: { slug: string; where: string }[] = [] // ancore verso questo modulo
  const refs: Record<string, { id: string }[]> = { Formula: data.formulas, Derivation: data.derivations, Figure: data.figures, Widget: data.widgets, Check: data.quiz }

  const link = (to: string, where: string, invalid: () => void) => {
    const [mod, slug] = [to.split('#')[0], to.includes('#') ? to.slice(to.indexOf('#') + 1) : undefined]
    if (mod === id || mod === '') {
      if (slug !== undefined) anchors.push({ slug, where })
    } else if (!moduleIds.has(mod)) invalid()
    else if (slug) crossLinks.push({ to, where })
  }

  const inspect = () => (tree: HastNode) => {
    visit(tree as never, (node: HastNode) => {
      const at = `MDX riga ${node.position?.start.line ?? '?'}`
      if (node.type === 'element') {
        const el = node as HastElement
        const rank = /^h([1-6])$/.exec(el.tagName)
        if (rank && typeof el.properties?.id === 'string') headings.set(el.properties.id, Number(rank[1]))
        const href = el.tagName === 'a' ? el.properties?.href : undefined
        if (typeof href === 'string' && href.startsWith('#')) anchors.push({ slug: decodeURIComponent(href.slice(1)), where: `${at}: link ${href}` })
        return
      }
      if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return
      const n = node as JsxElement
      if (n.name === null) return // frammento <>…</>: non porta contenuto proprio
      const required = COMPONENTS[n.name]
      if (!required) {
        if (/^[a-z]/.test(n.name)) err(`${at}: elemento HTML <${n.name}> non ammesso: usare Markdown o i componenti della guida (${Object.keys(COMPONENTS).join(', ')})`)
        else err(`${at}: componente non ammesso <${n.name}> (ammessi: ${Object.keys(COMPONENTS).join(', ')})`)
        return
      }
      const attrs: Record<string, AttrValue> = {}
      for (const a of n.attributes) if (a.type === 'mdxJsxAttribute' && a.name) attrs[a.name] = attrValue(a)
      for (const r of required) if (attrs[r] === undefined || attrs[r] === '' || attrs[r] === true) err(`${at}: <${n.name}> senza attributo ${r}`)
      for (const r of ['id', 'to', 'doc', 'kind']) if (typeof attrs[r] === 'object') err(`${at}: <${n.name} ${r}={…}> deve essere una stringa letterale, non un'espressione`)

      const list = refs[n.name]
      if (list && typeof attrs.id === 'string' && attrs.id && !list.some((x) => x.id === attrs.id)) err(`${at}: <${n.name} id="${attrs.id}"> non esiste in data.ts`)
      if (n.name === 'Example' && typeof attrs.id === 'string' && attrs.id) {
        if (exampleIds.has(attrs.id)) err(`${at}: <Example id="${attrs.id}"> duplicato`)
        exampleIds.add(attrs.id)
      }
      if (n.name === 'ModLink' && typeof attrs.to === 'string' && attrs.to) link(attrs.to, `${at}: ModLink ${attrs.to}`, () => err(`${at}: ModLink verso modulo inesistente ${attrs.to}`))
      if (n.name === 'Callout' && typeof attrs.kind === 'string' && attrs.kind && !CALLOUT_KINDS.includes(attrs.kind)) err(`${at}: <Callout kind="${attrs.kind}"> non valido (${CALLOUT_KINDS.join('|')})`)
      if (n.name === 'SourceRef') {
        if (typeof attrs.doc === 'string' && attrs.doc && !DOCS.includes(attrs.doc)) err(`${at}: <SourceRef doc="${attrs.doc}"> non valido (${DOCS.join('|')})`)
        const page = typeof attrs.page === 'string' ? Number(attrs.page) : attrs.page
        if (attrs.page !== undefined && attrs.page !== true && (typeof page !== 'number' || !Number.isInteger(page) || page < 1)) err(`${at}: <SourceRef page> deve essere un intero >= 1`)
      }
    })
  }

  // Stessi plugin di vite.config.ts: gli slug raccolti sono quelli che l'app genera davvero.
  let mdxCompiled = false
  try {
    const file = await compile(
      { value: fs.readFileSync(abs(mdxRel), 'utf8'), path: abs(mdxRel) },
      { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeSlug, inspect, [rehypeKatex, { strict: 'ignore' }]] },
    )
    mdxCompiled = true
    for (const m of file.messages) {
      const cause = m.cause instanceof Error ? m.cause.message : undefined
      err(`MDX riga ${m.line ?? '?'}: ${m.source === 'rehype-katex' ? `KaTeX -> ${short(cause ?? m.reason)}` : m.reason}`)
    }
    if (!file.messages.length && String(file).includes('katex-error')) err('MDX: una formula è stata resa come katex-error')
  } catch (e) {
    // per un tag rimasto aperto MDX non dà riga e colonna, ma le scrive in fondo al motivo: "(21:1-21:52)"
    const m = e as { line?: number; column?: number; reason?: string }
    err(`MDX non compila${m.line ? ` (riga ${m.line}, colonna ${m.column ?? '?'})` : ''}: ${short(m.reason ?? text(e), 300)}`)
  }
  // codici interni nel testo dell'MDX (fuori da componenti, matematica e destinazioni dei link)
  {
    const blank = (m: string) => m.replace(/[^\n]/g, ' ')
    const visible = fs.readFileSync(abs(mdxRel), 'utf8').replace(MATH, blank).replace(/<\/?[A-Za-z][^>]*>/g, blank).replace(/\]\([^)]*\)/g, blank)
    visible.split('\n').forEach((line, i) => {
      const leak = line.match(ID_LEAK)
      if (leak) err(`MDX riga ${i + 1}: codice interno visibile allo studente (${[...new Set(leak)].join(', ')}): scrivi il nome della cosa`)
    })
  }
  // ancore: titoli di questo modulo oppure elementi del foglio (formula:f-c05, derivation:der04, ...)
  const targetLists: Record<string, { id: string }[]> = { formula: data.formulas, derivation: data.derivations, figure: data.figures, widget: data.widgets, quiz: data.quiz, exercise: data.exercises, exam: data.exam, flashcard: data.flashcards }
  if (mdxCompiled) for (const a of [...anchors, ...richAnchors]) {
    const t = TARGET.exec(a.slug)
    if (t) {
      if (!(t[1] === 'example' ? exampleIds.has(t[2]) : targetLists[t[1]].some((x) => x.id === t[2]))) err(`${a.where}: rimando a "${a.slug}", che non esiste in questo modulo`)
    } else if (!headings.has(a.slug)) err(`${a.where}: nessun titolo con slug "${a.slug}" in questo modulo`)
  }

  // --- 7. copertura (G2) --------------------------------------------------------------------------
  // Se il MDX non compila, titoli ed esempi non sono noti: si tace su quelle destinazioni invece di dare errori a cascata.
  const has = (list: { id: string }[], ref: string) => list.some((x) => x.id === ref)
  const hints = new Map<string, string>()
  const valid = (t: string): boolean => {
    if (typeof t !== 'string') return false
    if (t.startsWith('#')) {
      const level = headings.get(t.slice(1))
      if (level !== undefined && level > 3) hints.set(t, ' (titolo di livello 4 o più: usare ## o ###)')
      return !mdxCompiled || (level !== undefined && level <= 3)
    }
    const kind = t.slice(0, Math.max(0, t.indexOf(':')))
    const ref = t.slice(t.indexOf(':') + 1)
    switch (kind) {
      case 'example': return !mdxCompiled || exampleIds.has(ref)
      case 'formula': return has(data.formulas, ref)
      case 'derivation': return has(data.derivations, ref)
      case 'widget': return has(data.widgets, ref)
      case 'figure': return has(data.figures, ref)
      case 'quiz': return has(data.quiz, ref)
      case 'flashcard': return has(data.flashcards, ref)
      case 'exam': return has(data.exam, ref)
      case 'exercise': return has(data.exercises, ref)
      case 'seeAlso': {
        const mod = ref.split('#')[0]
        if (mod === id) hints.set(t, ' (seeAlso rimanda a un altro modulo: per questo modulo usare #slug)')
        return mod !== id && moduleIds.has(mod)
      }
      default: return false
    }
  }
  await section('copertura', () => {
    for (const key of Object.keys(data.coverage)) if (!conceptIds.has(key)) err(`copertura: chiave "${key}" non è un concetto dell'inventario`)
    for (const c of inventory.concepts) {
      const targets = data.coverage[c.id]
      if (!Array.isArray(targets) || !targets.length) {
        err(`copertura: concetto ${c.id} "${c.name}" non mappato`)
        continue
      }
      for (const t of targets) {
        if (!valid(t)) err(`copertura: ${c.id} -> destinazione inesistente ${t}${hints.get(t) ?? ''}`)
        else if (t.startsWith('seeAlso:') && t.includes('#')) crossLinks.push({ to: t.slice('seeAlso:'.length), where: `copertura: ${c.id} -> ${t}` })
      }
      const some = (...prefixes: string[]) => targets.some((t) => typeof t === 'string' && prefixes.some((p) => t.startsWith(p)))
      if (!some('#', 'example:', 'seeAlso:')) err(`copertura: ${c.id} "${c.name}" non ha una sezione di teoria`)
      if (!c.noWidgetReason && !some('widget:', 'seeAlso:')) err(`copertura: ${c.id} "${c.name}" non ha un widget`)
      if (c.kind === 'formula' && !some('formula:', 'derivation:', 'seeAlso:')) err(`copertura: formula ${c.id} "${c.name}" senza Formula o Derivation`)
    }
    for (const w of inventory.widgets) if (!has(data.widgets, w.id)) err(`widget dell'inventario assente da data.widgets: ${w.id}`)
    for (const d of inventory.derivations) if (!has(data.derivations, d.id)) err(`derivazione dell'inventario non presente in data.derivations: ${d.id} "${d.title}"`)
    if (mdxCompiled) for (const e of inventory.workedExamples) if (!exampleIds.has(e.id)) err(`esempio svolto dell'inventario senza <Example id="${e.id}">: "${e.title}"`)
  })

  // Ancore verso altri moduli: verificabili solo se l'altro modulo è già scritto. Avviso, non errore:
  // il gate di un modulo non deve dipendere dalle modifiche a un altro (lo chiude il report globale).
  const cache = new Map<string, Map<string, number> | null>()
  for (const l of crossLinks) {
    const [mod, slug] = [l.to.split('#')[0], l.to.slice(l.to.indexOf('#') + 1)]
    if (!cache.has(mod)) cache.set(mod, await headingsOf(abs('src/content/modules', mod, 'index.mdx')))
    const other = cache.get(mod)
    if (other && !other.has(slug)) warn(`${l.where}: il modulo ${mod} non ha un titolo con slug "${slug}"`)
  }

  // --- 8. domande della banca e soglie di pratica (G4) ----------------------------------------------
  await section('pratica', () => {
    for (const q of inventory.examQuestions) {
      const key = squash(String(q.text)).slice(0, 60)
      if (!data.exam.some((e) => e.fromBank && typeof e.bankText === 'string' && squash(e.bankText).startsWith(key))) err(`banca: domanda non inclusa -> "${key}…" (serve un exam con fromBank: true e bankText verbatim)`)
    }
    const n = inventory.concepts.length
    const min = { flashcards: Math.max(15, Math.ceil(n * 0.6)), quiz: Math.max(12, Math.ceil(n * 0.5)), exam: inventory.examQuestions.length + 4, exercises: Math.max(3, inventory.exercises.length), glossary: 10 }
    for (const [k, v] of Object.entries(min)) {
      const have = (data as unknown as Record<string, unknown[]>)[k].length
      if (have < v) err(`pratica: ${k} ${have} < ${v}`)
    }
    if (!data.quiz.some((q) => q.type === 'tf')) err('pratica: serve almeno un quiz vero/falso (gioco Sprint)')
  })

  const summary = `${inventory.concepts.length} concetti coperti, ${data.formulas.length} formule, ${data.derivations.length} derivazioni, ${data.widgets.length} widget, ${data.flashcards.length} flashcard, ${data.quiz.length} quiz, ${data.exam.length} domande, ${data.exercises.length} esercizi`
  return { errors, warnings, summary }
}

// ---------------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------------

// process.exitCode e non process.exit(): su Windows l'uscita immediata può troncare l'output scritto su una pipe.
async function main(): Promise<void> {
  let id: string | undefined
  let root = path.resolve(import.meta.dirname, '..')
  try {
    const { values, positionals } = parseArgs({ options: { root: { type: 'string' } }, allowPositionals: true })
    id = positionals[0]
    if (values.root) root = path.resolve(values.root)
    if (positionals.length !== 1 || !/^[\w.-]+$/.test(id)) throw new Error('id mancante o non valido')
  } catch {
    console.log('Uso: npx tsx scripts/validate-module.ts <moduleId> [--root <cartella>]   (es. m09-parzen-windows)')
    process.exitCode = 1
    return
  }
  try {
    const { errors, warnings, summary } = await validate(id, root)
    if (errors.length) {
      console.log(`FAIL ${id}: ${errors.length} errori`)
      errors.slice(0, MAX_SHOWN).forEach((e) => console.log('  - ' + e))
      if (errors.length > MAX_SHOWN) console.log(`  … e altri ${errors.length - MAX_SHOWN} errori`)
      process.exitCode = 1
    } else console.log(`PASS ${id}: ${summary}`)
    warnings.forEach((w) => console.log('  ! avviso: ' + w))
  } catch (e) {
    console.log(`FAIL ${id}: ${e instanceof Fatal ? e.message : `errore inatteso del validatore -> ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`}`)
    process.exitCode = 1
  }
}

await main()
