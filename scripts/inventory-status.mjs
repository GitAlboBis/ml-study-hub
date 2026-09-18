// Stato dell'inventario per modulo: quali stadi sono completi (campo "stages" scritto dagli agenti) e se il validatore passa.
// Usage: node scripts/inventory-status.mjs          -> tabella leggibile
//        node scripts/inventory-status.mjs --json   -> stato compatto
//        node scripts/inventory-status.mjs --args   -> oggetto args completo per il workflow di inventario (ripresa tra sessioni)
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const modules = JSON.parse(fs.readFileSync(path.join(root, 'docs/plan/modules.json'), 'utf8'))
const STAGES = ['inventario', 'completezza', 'formule', 'formule2']
const CH2 = new Set(['m03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10'])

const out = modules.map((m) => {
  const file = path.join(root, 'docs/inventory', m.id + '.json')
  const needs = STAGES.filter((s) => s !== 'formule2' || CH2.has(m.id.split('-')[0]))
  if (!fs.existsSync(file)) return { id: m.id, exists: false, pass: false, done: [], needs }
  let inv = null
  try { inv = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { /* JSON rotto: si rifà dal primo stadio */ }
  const pass = spawnSync(process.execPath, [path.join(root, 'scripts/check-inventory.mjs'), m.id], { encoding: 'utf8' }).status === 0
  // uno stadio conta solo se il file è valido: un file rotto o troncato riparte da capo
  const done = inv && pass ? needs.filter((s) => inv.stages?.[s] === 'done') : []
  // gli stadi sono sequenziali: vale solo il prefisso completo
  const prefix = []
  for (const s of needs) { if (done.includes(s)) prefix.push(s); else break }
  return { id: m.id, exists: true, pass, done: prefix, needs, concepts: inv?.concepts?.length ?? 0, widgets: inv?.widgets?.length ?? 0 }
})

if (process.argv.includes('--args')) {
  // oggetto args completo per scripts/workflows/inventory-v2.workflow.js
  const run1Dir = path.join(root, '_sources/inventory-run1')
  const run1 = Object.fromEntries((fs.existsSync(run1Dir) ? fs.readdirSync(run1Dir) : []).filter((f) => f.endsWith('.json')).map((f) => [f.replace('.json', ''), f.startsWith('m03-') ? 'parziale' : 'completa']))
  console.log(JSON.stringify({ done: Object.fromEntries(out.filter((o) => o.done.length).map((o) => [o.id, o.done])), run1, modules }))
} else if (process.argv.includes('--json')) {
  console.log(JSON.stringify(out.map((o) => ({ id: o.id, done: o.done }))))
} else {
  for (const o of out) console.log(`${o.done.length === o.needs.length ? 'OK ' : '.. '} ${o.id.padEnd(34)} ${o.pass ? 'PASS' : o.exists ? 'FAIL' : '----'}  stadi: ${o.done.join(', ') || '-'}  ${o.exists ? `${o.concepts} concetti, ${o.widgets} widget` : ''}`)
  const complete = out.filter((o) => o.done.length === o.needs.length).length
  console.log(`\n${complete}/${out.length} moduli completi`)
}
