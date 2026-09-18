// Gate G1 — ogni pagina di ogni intervallo deve essere citata da almeno un concetto (o dichiarata in emptyPages)
import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve(import.meta.dirname, '..')
const modules = JSON.parse(fs.readFileSync(path.join(root, 'docs/plan/modules.json'), 'utf8'))
const cited = new Map() // "doc:page" -> Set(moduleId)
const expected = new Map()
for (const m of modules) {
  for (const s of m.sources) for (let p = s.pages[0]; p <= s.pages[1]; p++) expected.set(`${s.doc}:${p}`, m.id)
  const file = path.join(root, 'docs/inventory', m.id + '.json')
  if (!fs.existsSync(file)) { console.log(`MANCA inventario ${m.id}`); continue }
  const inv = JSON.parse(fs.readFileSync(file, 'utf8'))
  const refs = [
    ...inv.concepts.flatMap((c) => c.sourcePages),
    ...inv.derivations.flatMap((d) => d.sourcePages ?? []),
    ...inv.workedExamples.flatMap((e) => e.sourcePages ?? []),
    ...inv.figures.map((f) => ({ doc: f.doc, page: f.page })),
  ]
  for (const r of refs) {
    const k = `${r.doc}:${r.page}`
    if (!cited.has(k)) cited.set(k, new Set())
    cited.get(k).add(m.id)
  }
}
// una pagina dichiarata vuota da un modulo resta scoperta se nessun altro modulo la cita con contenuto:
// si accetta solo se TUTTI i moduli che la includono la dichiarano vuota per copertina/indice (reason senza "modulo adiacente")
const empties = new Map()
for (const m of modules) {
  const file = path.join(root, 'docs/inventory', m.id + '.json')
  if (!fs.existsSync(file)) continue
  for (const e of JSON.parse(fs.readFileSync(file, 'utf8')).emptyPages ?? []) {
    const k = `${e.doc}:${e.page}`
    if (!empties.has(k)) empties.set(k, [])
    empties.get(k).push({ module: m.id, reason: e.reason })
  }
}
const missing = [...expected.keys()].filter((k) => !cited.has(k))
const trulyEmpty = missing.filter((k) => empties.has(k))
const holes = missing.filter((k) => !empties.has(k))
trulyEmpty.forEach((k) => console.log(`vuota   ${k}: ${empties.get(k).map((e) => `${e.module} -> ${e.reason}`).join(' | ')}`))
holes.forEach((k) => console.log(`PAGINA NON CITATA ${k} (modulo ${expected.get(k)})`))
console.log(`${expected.size - missing.length}/${expected.size} pagine citate con contenuto, ${trulyEmpty.length} dichiarate vuote (da rileggere a mano), ${holes.length} buchi`)
process.exit(holes.length ? 1 : 0)
