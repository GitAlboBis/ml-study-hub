// @vitest-environment node
// Test del report di copertura globale (Task 6.2): lo lancia come processo (`npx tsx scripts/coverage-report.ts`)
// su un progetto finto in una cartella temporanea, con `--root`. Tre fogli: due pronti (con data.ts) e uno
// in preparazione (solo inventario). Il repo vero non viene mai toccato.
import { execFile } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const ROOT = path.resolve(import.meta.dirname, '..')
const TSX = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs')
const SCRIPT = path.join(ROOT, 'scripts/coverage-report.ts')

const MODULES = [
  { id: 'fa-pronto', course: 'melgani', chapter: 'Cap. 1', title: 'Foglio pronto', titleEn: 'Ready sheet', sources: [] },
  { id: 'fb-vicino', course: 'melgani', chapter: 'Cap. 1', title: 'Foglio vicino', titleEn: 'Neighbour sheet', sources: [] },
  { id: 'fc-in-preparazione', course: 'ricci', chapter: 'Cap. 9', title: 'Foglio in preparazione', titleEn: 'Sheet in progress', sources: [] },
]

const concept = (id: string, name: string, extra: object = {}) => ({ id, name, nameEn: name, kind: 'definizione', sourcePages: [], detail: '', ...extra })

const INVENTORY_A = {
  moduleId: 'fa-pronto',
  stages: { inventario: 'done' },
  concepts: [concept('c01', 'Media campionaria'), concept('c02', 'Formula della media', { kind: 'formula' }), concept('c03', 'Nota storica', { noWidgetReason: 'niente da animare' })],
  widgets: [{ id: 'fa-media' }, { id: 'fa-varianza' }],
}
const INVENTORY_B = { moduleId: 'fb-vicino', stages: { inventario: 'done' }, concepts: [concept('c01', 'Varianza')], widgets: [] }
const INVENTORY_C = { moduleId: 'fc-in-preparazione', stages: { inventario: 'done', completezza: 'done' }, concepts: [concept('c01', 'Uno'), concept('c02', 'Due')], widgets: [] }

const MDX_A = `# Foglio pronto

## Stima della media

Testo.

<Example id="ex01" title="Cinque salmoni">
Conto.
</Example>

## Note storiche

#### Troppo profondo
`
const MDX_B = `## La varianza

Testo.
`

// data.ts finti: il report legge solo gli id degli elementi e la coverage, non il resto del contratto
const dataTs = (id: string, coverage: Record<string, string[]>) => `export default {
  id: '${id}',
  formulas: [{ id: 'f01' }],
  derivations: [{ id: 'der01' }],
  figures: [{ id: 'fig01' }],
  widgets: [{ id: 'fa-media' }, { id: 'fa-varianza' }],
  quiz: [{ id: 'q01' }],
  flashcards: [{ id: 'fc01' }],
  exam: [{ id: 'or01' }],
  exercises: [{ id: 'es01' }],
  coverage: ${JSON.stringify(coverage)},
}
`

const FULL = {
  c01: ['#stima-della-media', 'widget:fa-media', 'quiz:q01'],
  c02: ['formula:f01', 'derivation:der01', 'example:ex01', 'widget:fa-varianza', 'exercise:es01'],
  c03: ['#note-storiche', 'seeAlso:fb-vicino#la-varianza'],
}

const roots: string[] = []

function makeRoot({ coverageA = FULL, ready = true }: { coverageA?: Record<string, string[]>; ready?: boolean } = {}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-report-'))
  roots.push(root)
  const write = (rel: string, content: string) => {
    const file = path.join(root, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }
  write('package.json', JSON.stringify({ type: 'module' }))
  write('docs/plan/modules.json', JSON.stringify(MODULES))
  write('docs/inventory/fa-pronto.json', JSON.stringify(INVENTORY_A))
  write('docs/inventory/fb-vicino.json', JSON.stringify(INVENTORY_B))
  write('docs/inventory/fc-in-preparazione.json', JSON.stringify(INVENTORY_C))
  if (ready) {
    write('src/content/modules/fa-pronto/data.ts', dataTs('fa-pronto', coverageA))
    write('src/content/modules/fa-pronto/index.mdx', MDX_A)
    write('src/content/modules/fb-vicino/data.ts', dataTs('fb-vicino', { c01: ['#la-varianza'] }))
    write('src/content/modules/fb-vicino/index.mdx', MDX_B)
    // un solo widget dei due ha il file
    write('src/widgets/fa-pronto/fa-media.widget.tsx', 'export default function W() { return null }\n')
  }
  return root
}

const children = new Set<ChildProcess>()

function run(root: string, extra: string[] = []): Promise<{ code: number; out: string; report: string }> {
  return new Promise((resolve) => {
    const child = execFile(process.execPath, [TSX, SCRIPT, '--root', root, ...extra], { cwd: ROOT, encoding: 'utf8', windowsHide: true, timeout: 120_000 }, (error, stdout, stderr) => {
      children.delete(child)
      const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0
      const file = path.join(root, 'docs/reports/copertura.md')
      resolve({ code, out: stdout + stderr, report: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '' })
    })
    children.add(child)
  })
}

afterAll(() => {
  for (const child of children) child.kill()
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
})

describe('coverage-report', { timeout: 120_000 }, () => {
  it('con tutto coperto stampa 100%, conta i tipi di destinazione e scrive il report', async () => {
    const { code, out, report } = await run(makeRoot())
    expect(out).toContain('Concetti coperti: 4/4 (100%)')
    expect(out).toMatch(/fa-pronto\s+3\/3 coperti · teoria 3 · formula 1 · widget 2 · pratica 2 · rimandi 1/)
    expect(code).toBe(0)
    expect(report).toContain('Concetti coperti: 4/4 (100%)')
    // i widget citati: uno ha il file, l'altro no
    expect(report).toMatch(/\| 1\/2 \|/)
    // il foglio in preparazione compare con il suo inventario
    expect(report).toMatch(/Foglio in preparazione.*\| 2 \|/)
    expect(report).toContain('Nessun buco')
  })

  it('segnala i buchi: concetti non mappati e destinazioni che non esistono (anche titoli oltre il terzo livello)', async () => {
    const { code, out, report } = await run(makeRoot({ coverageA: { c01: FULL.c01, c02: ['formula:f99', '#troppo-profondo'] } }))
    expect(out).toContain('Concetti coperti: 2/4 (50%)')
    expect(code).toBe(1)
    expect(report).toMatch(/`c02` Formula della media: destinazioni inesistenti `formula:f99`, `#troppo-profondo`/)
    expect(report).toMatch(/`c03` Nota storica: non mappato/)
  })

  it('un rimando a un foglio non pronto resta in attesa e da solo non copre; uno a un titolo che non esiste è un buco', async () => {
    const { out, report } = await run(makeRoot({ coverageA: { ...FULL, c01: ['seeAlso:fc-in-preparazione#uno'], c03: ['seeAlso:fb-vicino#titolo-che-non-c-e'] } }))
    expect(out).toContain('Concetti coperti: 2/4 (50%)')
    expect(report).toMatch(/## Rimandi in attesa[\s\S]*`seeAlso:fc-in-preparazione#uno`/)
    expect(report).toMatch(/`c03` Nota storica: destinazioni inesistenti `seeAlso:fb-vicino#titolo-che-non-c-e`/)
  })

  it('senza fogli pronti non inventa percentuali', async () => {
    const { code, out, report } = await run(makeRoot({ ready: false }))
    expect(out).toContain('Concetti coperti: 0/0 (nessun foglio pronto)')
    expect(code).toBe(0)
    expect(report).toContain('Nessun foglio è ancora pronto')
  })
})
