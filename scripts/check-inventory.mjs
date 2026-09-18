// Validates docs/inventory/<module-id>.json produced by the concept-inventory agents.
// Usage: node scripts/check-inventory.mjs <module-id>   (or no arg = all files)
import fs from 'node:fs'
import path from 'node:path'
import katex from 'katex'

const root = path.resolve(import.meta.dirname, '..')
const modules = JSON.parse(fs.readFileSync(path.join(root, 'docs/plan/modules.json'), 'utf8'))
const ids = process.argv[2] ? [process.argv[2]] : modules.map((m) => m.id).filter((id) => fs.existsSync(path.join(root, 'docs/inventory', id + '.json')))

const KINDS = ['definizione', 'formula', 'teorema', 'proprieta', 'algoritmo', 'procedura', 'esempio', 'confronto', 'osservazione', 'figura', 'applicazione']
let failed = 0

for (const id of ids) {
  const errs = []
  const warn = []
  const file = path.join(root, 'docs/inventory', id + '.json')
  let inv
  try {
    inv = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    console.log(`FAIL ${id}: JSON non valido -> ${e.message}`)
    failed++
    continue
  }
  const walk = (v, where) => {
    if (typeof v === 'string') {
      if (/[\t\f\b\r\v]/.test(v)) errs.push(`${where}: carattere di controllo nella stringa (escape errato? in JSON scrivi \\\\theta, \\\\frac, \\\\beta, \\\\right, \\\\nu)`)
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`))
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${where}.${k}`))
  }
  walk(inv, id)

  if (inv.moduleId !== id) errs.push(`moduleId deve essere "${id}"`)
  for (const k of ['concepts', 'derivations', 'workedExamples', 'figures', 'widgets', 'exercises', 'examQuestions']) {
    if (!Array.isArray(inv[k])) errs.push(`campo "${k}" mancante o non array`)
  }
  const concepts = inv.concepts || []
  const cids = new Set()
  concepts.forEach((c, i) => {
    const w = `concepts[${i}] (${c.id})`
    if (!c.id || cids.has(c.id)) errs.push(`${w}: id mancante o duplicato`)
    cids.add(c.id)
    for (const f of ['name', 'nameEn', 'kind', 'detail']) if (!c[f]) errs.push(`${w}: campo ${f} mancante`)
    if (c.kind && !KINDS.includes(c.kind)) errs.push(`${w}: kind "${c.kind}" non valido (${KINDS.join('|')})`)
    if (!Array.isArray(c.sourcePages) || !c.sourcePages.length) errs.push(`${w}: sourcePages vuoto`)
    if (!Array.isArray(c.latex)) errs.push(`${w}: latex deve essere un array (anche vuoto)`)
    ;(c.latex || []).forEach((tex, j) => {
      try {
        katex.renderToString(tex, { throwOnError: true, displayMode: true, strict: 'ignore' })
      } catch (e) {
        errs.push(`${w}.latex[${j}]: KaTeX -> ${String(e.message).slice(0, 140)}`)
      }
    })
    if (c.kind === 'formula' && !(c.latex || []).length) errs.push(`${w}: kind formula ma nessun latex`)
  })
  const covered = new Set()
  const wids = new Set()
  ;(inv.widgets || []).forEach((wd, i) => {
    const w = `widgets[${i}] (${wd.id})`
    if (!wd.id || wids.has(wd.id)) errs.push(`${w}: id mancante o duplicato`)
    wids.add(wd.id)
    for (const f of ['title', 'realExample', 'scenario', 'storyboard', 'interactions', 'visual', 'aha', 'size']) if (!wd[f] || (Array.isArray(wd[f]) && !wd[f].length)) errs.push(`${w}: campo ${f} mancante`)
    ;(wd.concepts || []).forEach((cid) => {
      if (!cids.has(cid)) errs.push(`${w}: concetto "${cid}" inesistente`)
      covered.add(cid)
    })
    if (!(wd.concepts || []).length) errs.push(`${w}: nessun concetto collegato`)
  })
  concepts.forEach((c) => {
    if (!covered.has(c.id) && !c.noWidgetReason) errs.push(`concetto ${c.id} "${c.name}" non coperto da nessun widget e senza noWidgetReason`)
  })
  // G1 alla fonte: ogni pagina degli intervalli del modulo deve essere citata, oppure dichiarata in emptyPages con un motivo
  const mod = modules.find((m) => m.id === id)
  if (mod) {
    const cited = new Set()
    const cite = (p) => p && cited.add(`${p.doc}:${p.page}`)
    concepts.forEach((c) => (c.sourcePages || []).forEach(cite))
    ;(inv.derivations || []).forEach((d) => (d.sourcePages || []).forEach(cite))
    ;(inv.workedExamples || []).forEach((e) => (e.sourcePages || []).forEach(cite))
    ;(inv.figures || []).forEach((f) => cite({ doc: f.doc, page: f.page }))
    ;(inv.emptyPages || []).forEach((p, i) => {
      if (!p.reason) errs.push(`emptyPages[${i}]: manca reason (perché la pagina ${p.doc}:${p.page} non ha concetti?)`)
      cite(p)
    })
    const missing = []
    for (const s of mod.sources) for (let p = s.pages[0]; p <= s.pages[1]; p++) if (!cited.has(`${s.doc}:${p}`)) missing.push(`${s.doc}:${p}`)
    if (missing.length) errs.push(`pagine dell'intervallo mai citate: ${missing.join(', ')} -> aprile: se hanno contenuto aggiungi i concetti, se sono copertina/indice/solo contenuto del modulo adiacente aggiungile a "emptyPages": [{"doc","page","reason"}]`)
  }

  const excluded = concepts.filter((c) => !covered.has(c.id)).length
  if (concepts.length && excluded / concepts.length > 0.15) warn.push(`${excluded}/${concepts.length} concetti senza widget: l'utente vuole interattività per tutti i concetti, riduci le esclusioni`)
  if (concepts.length < 15) warn.push(`solo ${concepts.length} concetti: sei sicuro di aver scomposto in modo atomico?`)

  if (errs.length) {
    failed++
    console.log(`FAIL ${id}: ${errs.length} errori`)
    errs.slice(0, 60).forEach((e) => console.log('  - ' + e))
  } else {
    console.log(`PASS ${id}: ${concepts.length} concetti, ${(inv.widgets || []).length} widget, ${(inv.figures || []).length} figure, ${(inv.examQuestions || []).length} domande d'esame`)
  }
  warn.forEach((w) => console.log('  ! ' + w))
}
process.exit(failed ? 1 : 0)
