// @vitest-environment node
// Test del gate G5 (scripts/widget-check.ts): conteggio dei widget implementati rispetto agli inventari, su un
// progetto finto in una cartella temporanea (`--root`), e lettura dell'uscita di scripts/snap.mjs. La parte
// --snap vera ha bisogno del server di sviluppo: qui si prova solo il suo parser.
import { execFile } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { parseSnapOutput } from './widget-check'

const ROOT = path.resolve(import.meta.dirname, '..')
const TSX = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs')
const SCRIPT = path.join(ROOT, 'scripts/widget-check.ts')

const MODULES = [
  { id: 'fa-uno', course: 'melgani', chapter: 'Cap. 1', title: 'Uno', titleEn: 'One', sources: [] },
  { id: 'fb-due', course: 'melgani', chapter: 'Cap. 1', title: 'Due', titleEn: 'Two', sources: [] },
  { id: 'fc-tre', course: 'ricci', chapter: 'Cap. 9', title: 'Tre', titleEn: 'Three', sources: [] },
]

const roots: string[] = []

function makeRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'widget-check-'))
  roots.push(root)
  const write = (rel: string, content: string) => {
    const file = path.join(root, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }
  const widget = 'export default function W() { return null }\n'
  write('docs/plan/modules.json', JSON.stringify(MODULES))
  write('docs/inventory/fa-uno.json', JSON.stringify({ stages: { inventario: 'done' }, widgets: [{ id: 'fa-a' }, { id: 'fa-b' }, { id: 'fa-c' }] }))
  // inventario al primo stadio non chiuso: si conta quello che c'è, ma lo si dice
  write('docs/inventory/fb-due.json', JSON.stringify({ stages: {}, widgets: [{ id: 'fb-a' }] }))
  // fc-tre: nessun inventario
  write('src/widgets/fa-uno/fa-a.widget.tsx', widget)
  write('src/widgets/fa-uno/fa-b.widget.tsx', widget)
  write('src/widgets/fa-uno/fa-b.test.tsx', 'non è un widget')
  // il registry trova i widget per id in qualunque cartella: conta, ma la cartella diversa si segnala
  write('src/widgets/fb-due/fa-c.widget.tsx', widget)
  // file senza voce in nessun inventario
  write('src/widgets/fa-uno/fa-orfano.widget.tsx', widget)
  // privati: non contano mai
  write('src/widgets/_test/prova.widget.tsx', widget)
  write('src/widgets/fa-uno/_bozza.widget.tsx', widget)
  return root
}

const children = new Set<ChildProcess>()

function run(args: string[]): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = execFile(process.execPath, [TSX, SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', windowsHide: true, timeout: 120_000 }, (error, stdout, stderr) => {
      children.delete(child)
      resolve({ code: error ? (typeof error.code === 'number' ? error.code : 1) : 0, out: stdout + stderr })
    })
    children.add(child)
  })
}

afterAll(() => {
  for (const child of children) child.kill()
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
})

describe('widget-check: conteggio', { timeout: 120_000 }, () => {
  it('stampa i widget implementati per modulo e in totale, gli orfani e le cartelle sbagliate', async () => {
    const { code, out } = await run(['--root', makeRoot()])
    expect(out).toMatch(/fa-uno\s+3\/3/)
    expect(out).toMatch(/fb-due\s+0\/1\s+\(inventario al primo stadio\)/)
    expect(out).toContain('Widget implementati: 3/4 (75%)')
    expect(out).toMatch(/Senza inventario: 1 modul/)
    expect(out).toMatch(/File di widget senza voce nell'inventario \(1\)[\s\S]*fa-uno\/fa-orfano\.widget\.tsx/)
    expect(out).toMatch(/fa-c.*cartella fb-due/)
    expect(out).not.toContain('prova')
    expect(out).not.toContain('_bozza')
    expect(code).toBe(1)
  })

  it('con un modulo come argomento mostra solo quello, con l\'elenco dei mancanti', async () => {
    const { out } = await run(['fb', '--root', makeRoot()])
    expect(out).toMatch(/fb-due\s+0\/1/)
    expect(out).toMatch(/manca\s+fb-a/)
    expect(out).not.toMatch(/fa-uno\s+3\/3/)
    expect(out).toContain('Widget implementati: 0/1 (0%)')
  })

  it('--json dà i numeri a chi li deve rileggere', async () => {
    const { out } = await run(['--root', makeRoot(), '--json'])
    const res = JSON.parse(out)
    expect(res.total).toEqual({ implemented: 3, expected: 4 })
    expect(res.modules.find((m: { id: string }) => m.id === 'fa-uno')).toMatchObject({ implemented: 3, expected: 3, missing: [] })
    expect(res.orphans).toEqual(['fa-uno/fa-orfano.widget.tsx'])
  })
})

describe('widget-check: uscita di snap.mjs', () => {
  it('legge errori di console, stato del laboratorio e scorrimento orizzontale', () => {
    const out = [
      'C:/tmp/w.png {"title":"Laboratorio · X","scrollWidth":410,"clientWidth":390,"height":1200}',
      'eval: {"h1":"La scatola nera","alert":null,"loading":false}',
      'errori in console (2):',
      '  TypeError: x is undefined',
      '  Warning: Each child in a list should have a unique "key" prop.',
    ].join('\n')
    expect(parseSnapOutput(out)).toEqual({
      shot: true,
      errors: ['TypeError: x is undefined', 'Warning: Each child in a list should have a unique "key" prop.'],
      lab: { h1: 'La scatola nera', alert: null, loading: false },
      overflow: true,
    })
  })

  it('senza errori e senza scatto lo dice', () => {
    expect(parseSnapOutput('Error: Chrome non risponde sulla porta di debug')).toEqual({ shot: false, errors: [], lab: null, overflow: false })
  })
})
