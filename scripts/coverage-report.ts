// scripts/coverage-report.ts
// Report di copertura globale (Task 6.2, la prova visibile che nulla è stato perso): unisce gli inventari
// (docs/inventory/<id>.json) e la `coverage` dei fogli pronti (quelli con src/content/modules/<id>/data.ts) e
// conta i concetti coperti da teoria, formula, widget e pratica. Chiude anche ciò che il validatore di un
// singolo foglio lascia aperto: i rimandi `seeAlso` verso altri fogli, verificabili solo quando sono pronti.
//
// Uso: npx tsx scripts/coverage-report.ts [--root <cartella>] [--out <file.md>] [--json]
// Stampa una riga per foglio pronto e "Concetti coperti: N/M (P%)"; scrive docs/reports/copertura.md
// (o --out). Esce con 1 se un concetto di un foglio pronto non è coperto, altrimenti con 0.
// `--root` legge docs/plan, docs/inventory, src/content/modules e src/widgets da un'altra cartella (i test).
//
// Un concetto è coperto se la sua voce di coverage porta ad almeno una destinazione che esiste. Un rimando a
// un foglio non ancora pronto resta "in attesa": da solo non copre, perché non si può ancora aprire.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { compile } from '@mdx-js/mdx'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { visit } from 'unist-util-visit'

// ---------------------------------------------------------------------------------------------------
// Tipi e costanti
// ---------------------------------------------------------------------------------------------------

interface ManifestEntry { id: string; title: string; course: string }
interface InvConcept { id: string; name: string; kind?: string; noWidgetReason?: string }
interface Inventory { concepts: InvConcept[]; widgets: { id: string }[]; stages?: Record<string, string> }
/** La parte di data.ts che serve qui: gli id degli elementi e la coverage. */
type DataLike = Record<string, unknown> & { coverage?: Record<string, unknown> }

type Kind = 'teoria' | 'formula' | 'widget' | 'pratica' | 'rimando'
const KINDS: readonly Kind[] = ['teoria', 'formula', 'widget', 'pratica', 'rimando']
const KIND_LABEL: Record<Kind, string> = { teoria: 'teoria', formula: 'formula', widget: 'widget', pratica: 'pratica', rimando: 'rimandi' }

/** Tipo di destinazione → tipo di copertura e lista di data.ts in cui cercare l'id ('example' vive nell'MDX). */
const TARGETS: Record<string, { kind: Kind; list?: string }> = {
  example: { kind: 'teoria' },
  figure: { kind: 'teoria', list: 'figures' },
  formula: { kind: 'formula', list: 'formulas' },
  derivation: { kind: 'formula', list: 'derivations' },
  widget: { kind: 'widget', list: 'widgets' },
  quiz: { kind: 'pratica', list: 'quiz' },
  flashcard: { kind: 'pratica', list: 'flashcards' },
  exam: { kind: 'pratica', list: 'exam' },
  exercise: { kind: 'pratica', list: 'exercises' },
}

interface MdxInfo {
  /** slug → livello del titolo; null se l'MDX manca o non compila */
  headings: Map<string, number> | null
  examples: Set<string>
  error?: string
}

interface Sheet {
  meta: ManifestEntry
  number: string
  inventory: Inventory | null
  inventoryNote: string
  data: DataLike | null
  dataError?: string
  mdx: MdxInfo | null
}

interface ConceptResult {
  concept: InvConcept
  kinds: Set<Kind>
  covered: boolean
  bad: string[]
  pending: string[]
  mapped: boolean
}

const text = (e: unknown) => (e instanceof Error ? e.message : String(e))
const short = (s: string, max = 200) => (s.length > max ? s.slice(0, max) + '…' : s)
const ids = (v: unknown): Set<string> => new Set(Array.isArray(v) ? v.flatMap((x) => (x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string' ? [(x as { id: string }).id] : [])) : [])
const pct = (n: number, d: number) => (d === 0 ? 100 : n === d ? 100 : Math.floor((100 * n) / d))

// ---------------------------------------------------------------------------------------------------
// Lettura
// ---------------------------------------------------------------------------------------------------

function readInventory(file: string): { inventory: Inventory | null; note: string } {
  if (!fs.existsSync(file)) return { inventory: null, note: 'assente' }
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return { inventory: null, note: 'illeggibile (in scrittura?)' }
  }
  const list = <T>(v: unknown): T[] => (Array.isArray(v) ? v.filter((x) => x !== null && typeof x === 'object') : []) as T[]
  const stages = raw.stages && typeof raw.stages === 'object' ? (raw.stages as Record<string, string>) : {}
  const done = Object.entries(stages).filter(([, v]) => v === 'done').map(([k]) => k)
  return {
    inventory: { concepts: list<InvConcept>(raw.concepts), widgets: list<{ id: string }>(raw.widgets), stages },
    note: done.length ? `stadi: ${done.join(', ')}` : 'primo stadio in corso',
  }
}

/** Titoli (slug di rehype-slug, gli stessi dell'app) ed esempi di un index.mdx. Stessi plugin del validatore. */
async function readMdx(file: string): Promise<MdxInfo> {
  const examples = new Set<string>()
  if (!fs.existsSync(file)) return { headings: null, examples, error: 'index.mdx mancante' }
  const headings = new Map<string, number>()
  const collect = () => (tree: unknown) => {
    visit(tree as never, (node: { type: string; tagName?: string; properties?: Record<string, unknown>; name?: string | null; attributes?: { type: string; name?: string; value?: unknown }[] }) => {
      if (node.type === 'element') {
        const rank = /^h([1-6])$/.exec(node.tagName ?? '')
        if (rank && typeof node.properties?.id === 'string') headings.set(node.properties.id, Number(rank[1]))
      } else if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === 'Example') {
        const id = node.attributes?.find((a) => a.type === 'mdxJsxAttribute' && a.name === 'id')?.value
        if (typeof id === 'string') examples.add(id)
      }
    })
  }
  try {
    await compile({ value: fs.readFileSync(file, 'utf8'), path: file }, { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeSlug, collect] })
    return { headings, examples }
  } catch (e) {
    return { headings: null, examples, error: `index.mdx non compila: ${short(text(e))}` }
  }
}

/** I file dei widget: id → cartella. I privati ("_" davanti alla cartella o al nome) non contano, come nel registry. */
function widgetFiles(root: string): Map<string, string> {
  const dir = path.join(root, 'src/widgets')
  const found = new Map<string, string>()
  if (!fs.existsSync(dir)) return found
  for (const folder of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!folder.isDirectory() || folder.name.startsWith('_')) continue
    for (const f of fs.readdirSync(path.join(dir, folder.name))) {
      if (f.endsWith('.widget.tsx') && !f.startsWith('_')) found.set(f.slice(0, -'.widget.tsx'.length), folder.name)
    }
  }
  return found
}

// ---------------------------------------------------------------------------------------------------
// Copertura
// ---------------------------------------------------------------------------------------------------

type Verdict = { ok: true; kind: Kind } | { ok: false; pending: boolean }

function resolveTarget(t: unknown, sheet: Sheet, sheets: Map<string, Sheet>, manifestIds: Set<string>): Verdict {
  if (typeof t !== 'string') return { ok: false, pending: false }
  const data = sheet.data ?? {}
  const mdx = sheet.mdx
  if (t.startsWith('#')) {
    const level = mdx?.headings?.get(t.slice(1))
    // come nel validatore: solo titoli ## e ### (l'indice del foglio segue quei due livelli)
    return level !== undefined && level <= 3 ? { ok: true, kind: 'teoria' } : { ok: false, pending: false }
  }
  const colon = t.indexOf(':')
  const type = colon > 0 ? t.slice(0, colon) : ''
  const ref = t.slice(colon + 1)
  if (type === 'seeAlso') {
    const [mod, slug] = ref.includes('#') ? [ref.slice(0, ref.indexOf('#')), ref.slice(ref.indexOf('#') + 1)] : [ref, '']
    if (mod === sheet.meta.id || !manifestIds.has(mod)) return { ok: false, pending: false }
    const other = sheets.get(mod)
    if (!other) return { ok: false, pending: true } // foglio non ancora pronto: si verifica quando arriva
    if (!slug) return { ok: true, kind: 'rimando' }
    const inner = /^(\w+):(.+)$/.exec(slug)
    if (inner && TARGETS[inner[1]]) {
      const spec = TARGETS[inner[1]]
      const found = spec.list ? ids(other.data?.[spec.list]).has(inner[2]) : (other.mdx?.examples.has(inner[2]) ?? false)
      return found ? { ok: true, kind: 'rimando' } : { ok: false, pending: false }
    }
    return other.mdx?.headings?.has(slug) ? { ok: true, kind: 'rimando' } : { ok: false, pending: false }
  }
  const spec = TARGETS[type]
  if (!spec) return { ok: false, pending: false }
  const found = spec.list ? ids(data[spec.list]).has(ref) : (mdx?.examples.has(ref) ?? false)
  return found ? { ok: true, kind: spec.kind } : { ok: false, pending: false }
}

function evaluate(sheet: Sheet, sheets: Map<string, Sheet>, manifestIds: Set<string>): ConceptResult[] {
  const coverage = (sheet.data?.coverage ?? {}) as Record<string, unknown>
  return (sheet.inventory?.concepts ?? []).map((concept) => {
    const targets = coverage[concept.id]
    const list = Array.isArray(targets) ? targets : []
    const kinds = new Set<Kind>()
    const bad: string[] = []
    const pending: string[] = []
    for (const t of list) {
      const v = resolveTarget(t, sheet, sheets, manifestIds)
      if (v.ok) kinds.add(v.kind)
      else if (v.pending) pending.push(String(t))
      else bad.push(String(t))
    }
    return { concept, kinds, covered: kinds.size > 0, bad, pending, mapped: list.length > 0 }
  })
}

// ---------------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------------

interface SheetReport {
  sheet: Sheet
  results: ConceptResult[]
  counts: Record<Kind, number>
  covered: number
  widgetsCited: number
  widgetsWithFile: number
  extraKeys: string[]
}

const cell = (s: string) => s.replace(/\|/g, '\\|')
const sheetName = (s: Sheet) => `${s.number} · ${cell(s.meta.title)} (\`${s.meta.id}\`)`

function why(r: ConceptResult): string {
  if (!r.mapped) return 'non mappato'
  const parts: string[] = []
  if (r.bad.length) parts.push(`destinazioni inesistenti ${r.bad.map((t) => `\`${t}\``).join(', ')}`)
  if (r.pending.length) parts.push(`solo rimandi a fogli non pronti ${r.pending.map((t) => `\`${t}\``).join(', ')}`)
  return parts.join('; ') || 'nessuna destinazione valida'
}

function markdown(reports: SheetReport[], waiting: Sheet[], total: number, covered: number, manifestSize: number, now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} alle ${pad(now.getHours())}:${pad(now.getMinutes())}`
  const holes = reports.flatMap((r) => r.results.filter((c) => !c.covered).map((c) => ({ r, c })))
  const pendingAll = reports.flatMap((r) => r.results.flatMap((c) => c.pending.map((t) => ({ r, c, t }))))
  const L: string[] = []
  L.push('# Copertura dei concetti', '')
  L.push(`Generato da \`npx tsx scripts/coverage-report.ts\` il ${stamp}. Non si modifica a mano: si rigenera.`, '')
  if (reports.length === 0) {
    L.push(`**Concetti coperti: 0/0.** Nessun foglio è ancora pronto (0 di ${manifestSize}): il report si riempie man mano che arrivano i fogli.`, '')
  } else {
    L.push(`**Concetti coperti: ${covered}/${total} (${pct(covered, total)}%)** su ${reports.length} ${reports.length === 1 ? 'foglio pronto' : 'fogli pronti'} di ${manifestSize}. Buchi: ${holes.length}. Rimandi in attesa: ${pendingAll.length}.`, '')
    L.push(
      'Un concetto dell\'inventario è coperto se la sua voce di `coverage` porta ad almeno una destinazione che esiste. ' +
        'Le colonne contano i concetti con almeno una destinazione di quel tipo: **teoria** (sezione ## o ###, esempio svolto, figura), ' +
        '**formula** (formula o dimostrazione), **widget**, **pratica** (quiz, flashcard, domanda d\'orale, esercizio), **rimandi** (`seeAlso` verso un foglio pronto). ' +
        '"Widget con il file" conta i widget del foglio (`data.widgets`) che hanno già il loro `src/widgets/<cartella>/<id>.widget.tsx`.',
      '',
    )
    L.push('## Fogli pronti', '')
    L.push('| Foglio | Concetti | Coperti | Teoria | Formula | Widget | Pratica | Rimandi | Widget con il file |')
    L.push('|---|---|---|---|---|---|---|---|---|')
    for (const r of reports) {
      const n = r.results.length
      L.push(`| ${sheetName(r.sheet)} | ${n} | ${r.covered} (${pct(r.covered, n)}%) | ${KINDS.map((k) => r.counts[k]).join(' | ')} | ${r.widgetsWithFile}/${r.widgetsCited} |`)
    }
    const sum = (k: Kind) => reports.reduce((a, r) => a + r.counts[k], 0)
    const wf = reports.reduce((a, r) => a + r.widgetsWithFile, 0)
    const wc = reports.reduce((a, r) => a + r.widgetsCited, 0)
    L.push(`| **Totale** | ${total} | ${covered} (${pct(covered, total)}%) | ${KINDS.map(sum).join(' | ')} | ${wf}/${wc} |`, '')

    L.push('## Buchi', '')
    if (holes.length === 0) L.push('Nessun buco: ogni concetto dei fogli pronti ha almeno una destinazione che esiste.', '')
    else {
      for (const r of reports) {
        const mine = r.results.filter((c) => !c.covered)
        if (!mine.length) continue
        L.push(`### ${sheetName(r.sheet)}`, '')
        if (r.sheet.dataError) L.push(`- data.ts non si carica: ${r.sheet.dataError}`)
        if (r.sheet.mdx?.error) L.push(`- ${r.sheet.mdx.error}`)
        for (const c of mine) L.push(`- \`${c.concept.id}\` ${c.concept.name}: ${why(c)}`)
        L.push('')
      }
    }
    const broken = reports.flatMap((r) => r.results.filter((c) => c.covered && c.bad.length).map((c) => ({ r, c })))
    if (broken.length) {
      L.push('## Destinazioni rotte in concetti coperti', '', 'Il concetto resta coperto dalle altre destinazioni, ma queste non portano da nessuna parte.', '')
      for (const { r, c } of broken) L.push(`- ${sheetName(r.sheet)} · \`${c.concept.id}\` ${c.concept.name}: ${c.bad.map((t) => `\`${t}\``).join(', ')}`)
      L.push('')
    }
    const extra = reports.filter((r) => r.extraKeys.length)
    if (extra.length) {
      L.push('## Chiavi di coverage senza concetto', '')
      for (const r of extra) L.push(`- ${sheetName(r.sheet)}: ${r.extraKeys.map((k) => `\`${k}\``).join(', ')}`)
      L.push('')
    }

    L.push('## Rimandi in attesa', '')
    if (pendingAll.length === 0) L.push('Nessuno: tutti i rimandi `seeAlso` portano a fogli pronti.', '')
    else {
      L.push('Rimandi `seeAlso` verso fogli non ancora pronti: si verificano quando il foglio arriva.', '')
      for (const { r, c, t } of pendingAll) L.push(`- ${sheetName(r.sheet)} · \`${c.concept.id}\` ${c.concept.name} → \`${t}\``)
      L.push('')
    }

    L.push('## Concetti senza widget', '', 'Ammessi solo con un motivo scritto nell\'inventario (`noWidgetReason`).', '')
    let none = true
    for (const r of reports) {
      const mine = r.results.filter((c) => !c.kinds.has('widget') && !c.kinds.has('rimando'))
      if (!mine.length) continue
      none = false
      L.push(`### ${sheetName(r.sheet)}`, '')
      for (const c of mine) L.push(`- \`${c.concept.id}\` ${c.concept.name}: ${c.concept.noWidgetReason ? `motivo: ${c.concept.noWidgetReason}` : '**nessun motivo scritto**'}`)
      L.push('')
    }
    if (none) L.push('Nessuno.', '')
  }

  L.push('## Fogli in preparazione', '')
  if (waiting.length === 0) L.push('Nessuno: tutti i fogli sono pronti.', '')
  else {
    L.push('| Foglio | Inventario | Concetti | Widget |', '|---|---|---|---|')
    for (const s of waiting) L.push(`| ${sheetName(s)} | ${s.inventoryNote} | ${s.inventory ? s.inventory.concepts.length : '—'} | ${s.inventory ? s.inventory.widgets.length : '—'} |`)
    L.push('')
  }
  return L.join('\n')
}

// ---------------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------------

// process.exitCode e non process.exit(): su Windows l'uscita immediata può troncare l'output scritto su una pipe.
async function main(): Promise<void> {
  let root = path.resolve(import.meta.dirname, '..')
  let out: string | undefined
  let json = false
  try {
    const { values } = parseArgs({ options: { root: { type: 'string' }, out: { type: 'string' }, json: { type: 'boolean' } } })
    if (values.root) root = path.resolve(values.root)
    out = values.out
    json = values.json ?? false
  } catch {
    console.log('Uso: npx tsx scripts/coverage-report.ts [--root <cartella>] [--out <file.md>] [--json]')
    process.exitCode = 2
    return
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/plan/modules.json'), 'utf8')) as ManifestEntry[]
  const manifestIds = new Set(manifest.map((m) => m.id))
  const files = widgetFiles(root)

  // tutti i fogli pronti prima di valutare: i rimandi seeAlso guardano dentro gli altri fogli
  const ready = new Map<string, Sheet>()
  const waiting: Sheet[] = []
  for (const [i, meta] of manifest.entries()) {
    const { inventory, note } = readInventory(path.join(root, 'docs/inventory', `${meta.id}.json`))
    const sheet: Sheet = { meta, number: String(i + 1).padStart(2, '0'), inventory, inventoryNote: note, data: null, mdx: null }
    const dataFile = path.join(root, 'src/content/modules', meta.id, 'data.ts')
    if (!fs.existsSync(dataFile)) {
      waiting.push(sheet)
      continue
    }
    try {
      // Su Windows un percorso assoluto non è uno specifier valido: serve l'URL file://.
      sheet.data = ((await import(pathToFileURL(dataFile).href)) as { default?: DataLike }).default ?? null
      if (!sheet.data) sheet.dataError = 'nessun export default'
    } catch (e) {
      sheet.dataError = short(text(e), 400)
    }
    sheet.mdx = await readMdx(path.join(root, 'src/content/modules', meta.id, 'index.mdx'))
    ready.set(meta.id, sheet)
  }

  const reports: SheetReport[] = [...ready.values()].map((sheet) => {
    const results = evaluate(sheet, ready, manifestIds)
    const counts = Object.fromEntries(KINDS.map((k) => [k, results.filter((r) => r.kinds.has(k)).length])) as Record<Kind, number>
    const cited = [...ids(sheet.data?.widgets)]
    const conceptIds = new Set(sheet.inventory?.concepts.map((c) => c.id) ?? [])
    return {
      sheet,
      results,
      counts,
      covered: results.filter((r) => r.covered).length,
      widgetsCited: cited.length,
      widgetsWithFile: cited.filter((id) => files.has(id)).length,
      extraKeys: Object.keys(sheet.data?.coverage ?? {}).filter((k) => !conceptIds.has(k)),
    }
  })

  const total = reports.reduce((a, r) => a + r.results.length, 0)
  const covered = reports.reduce((a, r) => a + r.covered, 0)
  const noInventory = reports.filter((r) => !r.sheet.inventory)

  const report = markdown(reports, waiting, total, covered, manifest.length, new Date())
  const target = out ? path.resolve(out) : path.join(root, 'docs/reports/copertura.md')
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, report)

  if (json) {
    console.log(JSON.stringify({
      ready: reports.length,
      sheets: manifest.length,
      concepts: total,
      covered,
      bySheet: reports.map((r) => ({ id: r.sheet.meta.id, concepts: r.results.length, covered: r.covered, ...r.counts, widgetsWithFile: r.widgetsWithFile, widgetsCited: r.widgetsCited })),
      holes: reports.flatMap((r) => r.results.filter((c) => !c.covered).map((c) => ({ sheet: r.sheet.meta.id, concept: c.concept.id, why: why(c) }))),
    }, null, 2))
  } else {
    console.log(`Fogli pronti: ${reports.length} di ${manifest.length}`)
    const width = Math.max(0, ...reports.map((r) => r.sheet.meta.id.length))
    for (const r of reports) {
      const n = r.results.length
      console.log(`  ${r.sheet.meta.id.padEnd(width)}  ${r.covered}/${n} coperti · ${KINDS.map((k) => `${KIND_LABEL[k]} ${r.counts[k]}`).join(' · ')}${r.sheet.inventory ? '' : ' · INVENTARIO ASSENTE'}${r.sheet.dataError ? ' · data.ts non si carica' : ''}`)
      for (const c of r.results.filter((x) => !x.covered).slice(0, 10)) console.log(`      buco ${c.concept.id} ${c.concept.name}: ${why(c)}`)
    }
    console.log(reports.length === 0 ? 'Concetti coperti: 0/0 (nessun foglio pronto)' : `Concetti coperti: ${covered}/${total} (${pct(covered, total)}%)`)
    console.log(`Report: ${path.relative(process.cwd(), target) || target}`)
  }
  if (covered < total || noInventory.length > 0) process.exitCode = 1
}

await main()
