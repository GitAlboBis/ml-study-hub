// Args per i workflow di produzione (contenuti e widget) a partire dagli inventari e dai marcatori di stadio.
//
// Uso: node scripts/production-args.mjs <id|prefisso> [...]      es. m03 m04 m05, oppure tutti i moduli con "all"
//      node scripts/production-args.mjs --status                  tabella dello stato di produzione di tutti i moduli
//
// Marcatori: docs/production/<moduleId>/<stadio>.done (li scrivono gli agenti alla fine di uno stadio verificato).
// Stadi dei contenuti: teoria, formule-a, formule-b, derivazioni-a, derivazioni-b, figure, pratica-1, pratica-2,
// integrazione, revisione-1, revisione-2, revisione-3. Stadi dei widget: widget-<lotto>, widget-revisione.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/plan/modules.json'), 'utf8'))
const doneOf = (id) => {
  const dir = path.join(ROOT, 'docs/production', id)
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.done')).map((f) => f.slice(0, -5)) : []
}
const invOf = (id) => {
  const f = path.join(ROOT, 'docs/inventory', `${id}.json`)
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null
}
const complete = (inv, id) => {
  if (!inv) return false
  const need = ['inventario', 'completezza', 'formule', ...(/^m(0[3-9]|10)-/.test(id) ? ['formule2'] : [])]
  return need.every((s) => inv.stages?.[s] === 'done')
}
const built = (id) => {
  const dir = path.join(ROOT, 'src/widgets', id)
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.widget.tsx')).map((f) => f.slice(0, -11)) : []
}

const describe = (m) => {
  const inv = invOf(m.id)
  if (!inv) return { id: m.id, ready: false }
  const c = inv.concepts
  const half = Math.ceil(c.length / 2)
  const der = inv.derivations.length
  const derHalf = Math.ceil(der / 2)
  const widgetIds = inv.widgets.map((w) => w.id)
  return {
    id: m.id,
    title: m.title,
    titleEn: m.titleEn,
    course: m.course,
    chapter: m.chapter,
    sources: m.sources,
    ready: complete(inv, m.id),
    n: {
      concepts: c.length,
      latex: c.reduce((s, x) => s + (x.latex || []).length, 0),
      derivations: der,
      examples: inv.workedExamples.length,
      figures: inv.figures.length,
      figuresImp2: inv.figures.filter((f) => (f.importance ?? 0) >= 2).length,
      widgets: inv.widgets.length,
      exercises: inv.exercises.length,
      bank: inv.examQuestions.length,
    },
    // concetti per i due autori delle formule e derivazioni per i due autori delle dimostrazioni (per posizione)
    formulasA: [c[0]?.id, c[half - 1]?.id],
    formulasB: [c[half]?.id, c[c.length - 1]?.id],
    splitDerivations: der > 12,
    derivationsA: der > 12 ? inv.derivations.slice(0, derHalf).map((d) => d.id) : inv.derivations.map((d) => d.id),
    derivationsB: der > 12 ? inv.derivations.slice(derHalf).map((d) => d.id) : [],
    widgetIds,
    widgetsBuilt: built(m.id).filter((w) => widgetIds.includes(w)),
    done: doneOf(m.id),
  }
}

const argv = process.argv.slice(2)
if (argv.includes('--status')) {
  for (const m of manifest) {
    const d = describe(m)
    if (!d.n) { console.log(`..  ${m.id.padEnd(34)} inventario assente`); continue }
    const content = fs.existsSync(path.join(ROOT, 'src/content/modules', m.id, 'data.ts')) ? 'data.ts' : '-'
    console.log(`${d.ready ? 'OK' : '..'}  ${m.id.padEnd(34)} contenuti: ${content.padEnd(8)} widget ${String(d.widgetsBuilt.length).padStart(2)}/${String(d.n.widgets).padEnd(3)} stadi: ${d.done.join(', ') || '-'}`)
  }
  process.exit(0)
}
const pick = argv.includes('all') ? manifest : manifest.filter((m) => argv.some((a) => m.id === a || m.id.startsWith(`${a}-`)))

// --widgets: args per widgets-production (motore di ogni widget da docs/plan/widget-map.json; senza voce = su misura)
if (argv.includes('--widgets')) {
  const mapFile = path.join(ROOT, 'docs/plan/widget-map.json')
  const map = fs.existsSync(mapFile) ? JSON.parse(fs.readFileSync(mapFile, 'utf8')) : { engines: {} }
  const engineOf = new Map()
  for (const [name, e] of Object.entries(map.engines || {})) for (const w of e.widgets || []) engineOf.set(w, name)
  const enginesBuilt = new Set(fs.existsSync(path.join(ROOT, 'src/widgets/engines')) ? fs.readdirSync(path.join(ROOT, 'src/widgets/engines')) : [])
  const mods = pick.map(describe).filter((d) => d.n).map((d) => ({
    id: d.id,
    title: d.title,
    built: d.widgetsBuilt,
    done: d.done,
    // un widget va sul motore solo se il motore esiste davvero
    widgets: d.widgetIds.map((w) => ({ id: w, engine: enginesBuilt.has(engineOf.get(w)) ? engineOf.get(w) : null })),
  }))
  console.log(JSON.stringify({ modules: mods }))
} else {
  console.log(JSON.stringify({ modules: pick.map(describe) }))
}
