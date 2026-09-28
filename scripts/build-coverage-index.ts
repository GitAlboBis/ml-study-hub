// scripts/build-coverage-index.ts
// Indice della copertura: riduce gli inventari (docs/inventory/<id>.json, 150-300 KB l'uno per via dei testi di
// dettaglio) all'essenziale che serve alla pagina /copertura: per ogni concetto id, nome, nome inglese, tipo, pagine
// delle fonti, rilevanza d'orale e l'eventuale motivo per cui non ha un widget; per ogni foglio i titoli degli
// esempi svolti e se l'inventario ha chiuso tutti gli stadi. Scrive src/content/coverage-index.json (un concetto
// per riga, così i diff restano leggibili).
//
// Uso: npx tsx scripts/build-coverage-index.ts            -> riscrive l'indice
//      npx tsx scripts/build-coverage-index.ts --check    -> exit 1 se l'indice non è allineato agli inventari
// Il test scripts/build-coverage-index.test.ts fa lo stesso controllo di --check.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { CoverageIndex, IndexConcept, IndexModule } from '../src/lib/coverage'

export const INDEX_PATH = 'src/content/coverage-index.json'
const STAGES = ['inventario', 'completezza', 'formule'] as const
/** Il Cap. 2 (m03-m10) ha un secondo controllo delle formule: stessa regola di scripts/inventory-status.mjs. */
const CH2 = /^m(0[3-9]|10)-/

export const stagesNeeded = (id: string): string[] => (CH2.test(id) ? [...STAGES, 'formule2'] : [...STAGES])

type Json = Record<string, unknown>
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown) => (typeof v === 'string' ? v : '')

function slimConcept(c: Json): IndexConcept | null {
  const id = text(c.id)
  if (!id) return null
  const pages: [string, number][] = []
  const seen = new Set<string>()
  for (const p of Array.isArray(c.sourcePages) ? c.sourcePages : []) {
    if (!isObject(p) || typeof p.doc !== 'string' || typeof p.page !== 'number') continue
    const key = `${p.doc}:${p.page}`
    if (seen.has(key)) continue
    seen.add(key)
    pages.push([p.doc, p.page])
  }
  const out: IndexConcept = { id, name: text(c.name), nameEn: text(c.nameEn), kind: text(c.kind), pages: pages as IndexConcept['pages'] }
  if (c.examRelevance === 1 || c.examRelevance === 2 || c.examRelevance === 3) out.exam = c.examRelevance
  if (typeof c.noWidgetReason === 'string' && c.noWidgetReason.trim()) out.noWidget = c.noWidgetReason.trim()
  return out
}

function slimModule(id: string, inv: Json): IndexModule {
  const stages = isObject(inv.stages) ? inv.stages : {}
  // gli stadi sono in sequenza: conta solo se sono chiusi tutti
  const complete = stagesNeeded(id).every((s) => stages[s] === 'done')
  const examples: Record<string, string> = {}
  for (const e of Array.isArray(inv.workedExamples) ? inv.workedExamples : []) {
    if (isObject(e) && typeof e.id === 'string' && typeof e.title === 'string') examples[e.id] = e.title
  }
  const concepts = (Array.isArray(inv.concepts) ? inv.concepts : []).flatMap((c) => {
    const slim = isObject(c) ? slimConcept(c) : null
    return slim ? [slim] : []
  })
  return { complete, examples, concepts }
}

/** Legge manifest e inventari sotto `root` e costruisce l'indice, nell'ordine del manifest. Non lancia: gli inventari illeggibili diventano avvisi. */
export function buildCoverageIndex(root: string): { index: CoverageIndex; warnings: string[] } {
  const warnings: string[] = []
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/plan/modules.json'), 'utf8')) as { id: string }[]
  const known = new Set(manifest.map((m) => m.id))
  const dir = path.join(root, 'docs/inventory')
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : []
  for (const f of files) {
    const id = f.slice(0, -'.json'.length)
    if (!known.has(id)) warnings.push(`${f}: il foglio "${id}" non è nel manifest, lo salto`)
  }
  const modules: Record<string, IndexModule> = {}
  for (const { id } of manifest) {
    const file = path.join(dir, `${id}.json`)
    if (!fs.existsSync(file)) continue
    let inv: unknown
    try {
      inv = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (e) {
      // un agente può star scrivendo il file proprio adesso: lo si riprende al prossimo giro
      warnings.push(`${id}.json: JSON illeggibile (${e instanceof Error ? e.message : String(e)}), lo salto`)
      continue
    }
    if (!isObject(inv)) {
      warnings.push(`${id}.json: non è un oggetto, lo salto`)
      continue
    }
    modules[id] = slimModule(id, inv)
  }
  return { index: { version: 1, modules }, warnings }
}

/** JSON stabile: un foglio per blocco, un concetto per riga, a capo finale. */
export function formatCoverageIndex(index: CoverageIndex): string {
  const blocks = Object.entries(index.modules).map(([id, m]) => {
    const concepts = m.concepts.map((c) => `        ${JSON.stringify(c)}`).join(',\n')
    return [
      `    ${JSON.stringify(id)}: {`,
      `      "complete": ${m.complete},`,
      `      "examples": ${JSON.stringify(m.examples)},`,
      concepts ? `      "concepts": [\n${concepts}\n      ]` : '      "concepts": []',
      '    }',
    ].join('\n')
  })
  return `{\n  "version": ${index.version},\n  "modules": {${blocks.length ? `\n${blocks.join(',\n')}\n  ` : ''}}\n}\n`
}

function main() {
  const root = path.resolve(import.meta.dirname, '..')
  const { index, warnings } = buildCoverageIndex(root)
  warnings.forEach((w) => console.log('  ! avviso: ' + w))
  const next = formatCoverageIndex(index)
  const file = path.join(root, INDEX_PATH)
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const modules = Object.values(index.modules)
  const summary = `${modules.length} fogli inventariati, ${modules.reduce((n, m) => n + m.concepts.length, 0)} concetti`
  if (process.argv.includes('--check')) {
    if (current === next) console.log(`OK ${INDEX_PATH} è allineato (${summary})`)
    else {
      console.log(`FAIL ${INDEX_PATH} non è allineato agli inventari: esegui npx tsx scripts/build-coverage-index.ts`)
      process.exitCode = 1
    }
    return
  }
  if (current === next) console.log(`${INDEX_PATH} già aggiornato (${summary})`)
  else {
    fs.writeFileSync(file, next)
    console.log(`Scritto ${INDEX_PATH}: ${summary}, ${(Buffer.byteLength(next) / 1024).toFixed(0)} KB`)
  }
}

// eseguito come script (npx tsx …) e non importato dai test
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main()
