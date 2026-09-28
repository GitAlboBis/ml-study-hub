// @vitest-environment node
// Test dell'indice della copertura: la funzione pura che riduce gli inventari all'essenziale (id, nomi, tipo,
// pagine) e il controllo che src/content/coverage-index.json sia allineato a docs/inventory.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { buildCoverageIndex, formatCoverageIndex, INDEX_PATH, stagesNeeded } from './build-coverage-index'

const ROOT = path.resolve(import.meta.dirname, '..')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-index-'))
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }))

function fixture(files: Record<string, unknown>) {
  const dir = fs.mkdtempSync(path.join(tmp, 'p-'))
  fs.mkdirSync(path.join(dir, 'docs/plan'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'docs/inventory'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'docs/plan/modules.json'),
    JSON.stringify([
      { id: 'm03-stima', course: 'melgani' },
      { id: 'm20-altro', course: 'melgani' },
      { id: 'p01-primo', course: 'passerini' },
    ]),
  )
  for (const [name, body] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, 'docs/inventory', name), typeof body === 'string' ? body : JSON.stringify(body))
  }
  return dir
}

const concept = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: `Concetto ${id}`,
  nameEn: `Concept ${id}`,
  kind: 'definizione',
  sourcePages: [
    { doc: 'ch2', page: 3 },
    { doc: 'part1', page: 12 },
    { doc: 'ch2', page: 3 },
  ],
  detail: 'Un testo lungo che nell\'indice non deve finire.',
  latex: ['x^2'],
  symbols: [],
  examRelevance: 2,
  ...extra,
})

describe('buildCoverageIndex', () => {
  it('tiene solo id, nomi, tipo, pagine (senza doppioni), rilevanza d\'orale e motivo del widget mancante', () => {
    const root = fixture({
      'm03-stima.json': {
        moduleId: 'm03-stima',
        stages: { inventario: 'done', completezza: 'done', formule: 'done', formule2: 'done' },
        concepts: [concept('c01', { examRelevance: 3 }), concept('c02', { noWidgetReason: 'Nota redazionale' })],
        workedExamples: [{ id: 'ex01', title: 'Media di tre misure', description: 'lungo' }],
      },
    })
    const { index, warnings } = buildCoverageIndex(root)
    expect(warnings).toEqual([])
    expect(Object.keys(index.modules)).toEqual(['m03-stima'])
    const mod = index.modules['m03-stima']
    expect(mod.complete).toBe(true)
    expect(mod.examples).toEqual({ ex01: 'Media di tre misure' })
    expect(mod.concepts[0]).toEqual({
      id: 'c01',
      name: 'Concetto c01',
      nameEn: 'Concept c01',
      kind: 'definizione',
      pages: [
        ['ch2', 3],
        ['part1', 12],
      ],
      exam: 3,
    })
    expect(mod.concepts[1].noWidget).toBe('Nota redazionale')
    expect(JSON.stringify(mod)).not.toContain('Un testo lungo')
  })

  it('segue l\'ordine del manifest e segnala gli inventari ancora in corso', () => {
    const root = fixture({
      'p01-primo.json': { stages: { inventario: 'done', completezza: 'done', formule: 'done' }, concepts: [concept('c01')] },
      'm03-stima.json': { stages: { inventario: 'done', completezza: 'done', formule: 'done' }, concepts: [concept('c01')] },
    })
    const { index } = buildCoverageIndex(root)
    expect(Object.keys(index.modules)).toEqual(['m03-stima', 'p01-primo'])
    // m03 è del Cap. 2: gli manca il secondo controllo delle formule
    expect(index.modules['m03-stima'].complete).toBe(false)
    expect(index.modules['p01-primo'].complete).toBe(true)
  })

  it('salta con un avviso un inventario rotto o fuori dal manifest, senza fermarsi', () => {
    const root = fixture({
      'm03-stima.json': '{ "concepts": [',
      'z99-orfano.json': { concepts: [concept('c01')] },
      'm20-altro.json': { stages: {}, concepts: [concept('c01')] },
    })
    const { index, warnings } = buildCoverageIndex(root)
    expect(Object.keys(index.modules)).toEqual(['m20-altro'])
    expect(warnings.join('\n')).toMatch(/m03-stima\.json/)
    expect(warnings.join('\n')).toMatch(/z99-orfano/)
  })

  it('stagesNeeded chiede il doppio controllo delle formule solo ai fogli del Cap. 2', () => {
    expect(stagesNeeded('m05-max-likelihood')).toContain('formule2')
    expect(stagesNeeded('m10-em-dati-incompleti')).toContain('formule2')
    expect(stagesNeeded('m11-hughes-feature-selection')).not.toContain('formule2')
    expect(stagesNeeded('d01-intro')).not.toContain('formule2')
  })

  it('formatCoverageIndex scrive un concetto per riga e rilegge lo stesso indice', () => {
    const root = fixture({ 'm03-stima.json': { stages: {}, concepts: [concept('c01'), concept('c02')] } })
    const { index } = buildCoverageIndex(root)
    const text = formatCoverageIndex(index)
    expect(JSON.parse(text)).toEqual(index)
    expect(text.split('\n').filter((l) => l.includes('"id":"c0'))).toHaveLength(2)
    expect(text.endsWith('\n')).toBe(true)
  })
})

describe('src/content/coverage-index.json', () => {
  it('è allineato a docs/inventory (se fallisce: npx tsx scripts/build-coverage-index.ts)', () => {
    const { index } = buildCoverageIndex(ROOT)
    const saved = fs.readFileSync(path.join(ROOT, INDEX_PATH), 'utf8')
    expect(saved === formatCoverageIndex(index), 'coverage-index.json non è aggiornato: esegui npx tsx scripts/build-coverage-index.ts').toBe(true)
  })
})
