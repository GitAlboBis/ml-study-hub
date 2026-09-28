// @vitest-environment node
// Test dell'indice delle sezioni per la ricerca (scripts/build-search-index.ts): gli slug devono essere quelli
// che l'app genera davvero con rehype-slug, anche quando l'MDX non compila e lo script ripiega sulla lettura riga per riga.
// Lo script completo gira come processo su una cartella temporanea (--root): il repo vero non viene toccato.
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { extractSections, extractSectionsByLines } from './build-search-index'

const ROOT = path.resolve(import.meta.dirname, '..')
const TSX = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs')
const SCRIPT = path.join(ROOT, 'scripts/build-search-index.ts')

const MDX = `## Panoramica

Testo con $x$ in linea.

## L'ipercubo e la funzione finestra

### Il ruolo di $h$ in breve

\`\`\`text
## Questo non è un titolo
\`\`\`

#### Un titolo di quarto livello

### Esempio

<Example id="ex01" title="Due campioni">

### Esempio

Dentro un componente il titolo Markdown resta un titolo.

</Example>

## Scelta di $\\sigma$ e **normalizzazione** [delle feature](#panoramica)

### Densità legittima ##
`

const EXPECTED = [
  { slug: 'panoramica', level: 2, title: 'Panoramica' },
  { slug: 'lipercubo-e-la-funzione-finestra', level: 2, title: "L'ipercubo e la funzione finestra" },
  { slug: 'il-ruolo-di-h-in-breve', level: 3, title: 'Il ruolo di $h$ in breve', parent: "L'ipercubo e la funzione finestra" },
  { slug: 'esempio', level: 3, title: 'Esempio', parent: "L'ipercubo e la funzione finestra" },
  { slug: 'esempio-1', level: 3, title: 'Esempio', parent: "L'ipercubo e la funzione finestra" },
  { slug: 'scelta-di-sigma-e-normalizzazione-delle-feature', level: 2, title: 'Scelta di $\\sigma$ e **normalizzazione** delle feature' },
  { slug: 'densità-legittima', level: 3, title: 'Densità legittima', parent: 'Scelta di $\\sigma$ e **normalizzazione** delle feature' },
]

describe('estrazione dei titoli', () => {
  it('con la pipeline MDX: titoli ## e ### con gli slug di rehype-slug, i duplicati numerati, niente codice', async () => {
    expect(await extractSections(MDX)).toEqual(EXPECTED)
  })

  it('la lettura riga per riga dà lo stesso risultato', () => {
    expect(extractSectionsByLines(MDX)).toEqual(EXPECTED)
  })

  it("sul foglio vero (m09) la lettura riga per riga coincide con la pipeline MDX", async () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/content/modules/m09-parzen-windows/index.mdx'), 'utf8')
    const compiled = await extractSections(src)
    expect(compiled.length).toBeGreaterThan(40)
    expect(extractSectionsByLines(src)).toEqual(compiled)
  })
})

// ---------------------------------------------------------------------------------------------------
// Lo script come processo
// ---------------------------------------------------------------------------------------------------

const roots: string[] = []

function makeRoot(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'search-index-'))
  roots.push(root)
  for (const [rel, text] of Object.entries(files)) {
    const abs = path.join(root, rel)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, text)
  }
  return root
}

function run(root: string): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    execFile(process.execPath, [TSX, SCRIPT, '--root', root], { cwd: ROOT, encoding: 'utf8', windowsHide: true, timeout: 120_000 }, (error, stdout, stderr) => {
      resolve({ code: error ? (typeof error.code === 'number' ? error.code : 1) : 0, out: stdout + stderr })
    })
  })
}

afterAll(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
})

describe('script', () => {
  it('scrive src/content/search-sections.json con i fogli nell\'ordine del manifest, anche se un MDX non compila', async () => {
    const root = makeRoot({
      'docs/plan/modules.json': JSON.stringify([{ id: 'b-secondo' }, { id: 'a-primo' }]),
      'src/content/modules/a-primo/index.mdx': '## Primo titolo\n\n### Sotto\n',
      // tag aperto: MDX non compila, lo script ripiega sulla lettura riga per riga e lo dice
      'src/content/modules/b-secondo/index.mdx': '## Secondo titolo\n\n<Callout kind="nota">\n\ntesto\n',
      'src/content/modules/c-senza-mdx/data.ts': 'export default {}\n',
    })
    const { code, out } = await run(root)
    expect(code).toBe(0)
    expect(out).toMatch(/b-secondo.*riga per riga/)
    const json = JSON.parse(fs.readFileSync(path.join(root, 'src/content/search-sections.json'), 'utf8'))
    expect(json.version).toBe(1)
    expect(Object.keys(json.modules)).toEqual(['b-secondo', 'a-primo'])
    expect(json.modules['a-primo']).toEqual([
      { slug: 'primo-titolo', level: 2, title: 'Primo titolo' },
      { slug: 'sotto', level: 3, title: 'Sotto', parent: 'Primo titolo' },
    ])
    expect(json.modules['b-secondo']).toEqual([{ slug: 'secondo-titolo', level: 2, title: 'Secondo titolo' }])
  })
})
