// scripts/build-search-index.ts
// Indice delle sezioni per la ricerca dell'app (palette Ctrl+K, src/lib/search.ts): legge i titoli ## e ### di ogni
// src/content/modules/<id>/index.mdx e scrive src/content/search-sections.json con slug, livello, titolo e titolo
// della sezione che li contiene. A runtime l'MDX arriva già compilato e i titoli non si possono più leggere: per
// questo l'indice si prepara qui.
//
// Uso: npx tsx scripts/build-search-index.ts [--root <cartella>]
// Va rieseguito a mano e dai workflow di produzione dopo ogni modifica a un index.mdx. La ricerca funziona anche
// se il JSON non contiene ancora un foglio: di quel foglio mancano solo le sezioni.
// `--root` fa leggere e scrivere un'altra cartella di progetto: serve ai test, che lavorano su una copia temporanea.
//
// Gli slug sono quelli che l'app genera davvero: lo script compila l'MDX con gli stessi plugin di vite.config.ts
// (rehype-slug usa github-slugger). Se un MDX non compila (un foglio a metà), ripiega sulla lettura riga per riga
// con github-slugger e lo segnala; i test verificano che le due strade diano lo stesso risultato sul foglio vero.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { compile } from '@mdx-js/mdx'
import GithubSlugger from 'github-slugger'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

/** Una sezione della teoria: la stessa forma di SectionEntry in src/lib/search.ts. */
export interface SectionEntry {
  slug: string
  level: 2 | 3
  /** testo del titolo in Markdown con matematica ($…$), senza collegamenti né tag JSX */
  title: string
  /** titolo della sezione ## che contiene questa ###, se c'è */
  parent?: string
}

export const OUTPUT = 'src/content/search-sections.json'

// ---------------------------------------------------------------------------------------------------
// Testo dei titoli
// ---------------------------------------------------------------------------------------------------

/** Il titolo come si mostra: collegamenti ridotti al loro testo, immagini e tag JSX tolti, spazi compattati. */
export function displayTitle(raw: string): string {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<\/?[A-Za-z][^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Regola degli span di codice (CommonMark), che remark-math applica anche a $…$: uno spazio per lato si toglie
// solo se ci sono tutti e due e il contenuto non è fatto solo di spazi.
const unpad = (s: string) => (s.length > 2 && s.startsWith(' ') && s.endsWith(' ') && s.trim() ? s.slice(1, -1) : s)

/**
 * Il testo del titolo come lo legge rehype-slug (il testo dei nodi hast): la matematica in linea resta come
 * sorgente TeX, codice e collegamenti come testo, l'enfasi perde i marcatori, gli escape il backslash.
 */
export function headingText(raw: string): string {
  const kept: string[] = []
  // segnaposto in caratteri a uso privato, che non compaiono nei testi (come in src/lib/rich.ts)
  const keep = (s: string) => `${kept.push(s) - 1}`
  let s = raw
    // codice in linea e matematica in linea sono letterali: escono prima di tutto il resto
    .replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_m, _t, code: string) => keep(unpad(code)))
    .replace(/(?<!\\)(\$+)((?:\\[\s\S]|[^\\$])+?)\1/g, (_m, _d, tex: string) => keep(unpad(tex)))
  s = displayTitle(s)
    .replace(/\\([!-/:-@[-`{-~])/g, (_m, c: string) => keep(c))
    .replace(/(\*+|~~)/g, '')
    .replace(/(^|[^\p{L}\p{N}])_+|_+(?=$|[^\p{L}\p{N}])/gu, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  return s.replace(/(\d+)/g, (_m, i: string) => kept[Number(i)])
}

// ---------------------------------------------------------------------------------------------------
// Estrazione con la pipeline MDX (la strada principale)
// ---------------------------------------------------------------------------------------------------

interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
  position?: { start: { offset?: number }; end: { offset?: number } }
}

const textOf = (node: HastNode): string => (node.children ? node.children.map(textOf).join('') : (node.value ?? ''))

/** Il testo sorgente di un titolo ATX ("## Titolo ##") senza i segni #. */
const stripHashes = (line: string) => line.replace(/^ {0,3}#{1,6}(?=[ \t]|$)/, '').replace(/[ \t]+#+[ \t]*$/, '').replace(/^[ \t]+#+[ \t]*$/, '').trim()

function pushSection(out: SectionEntry[], parent: { title?: string }, level: number, slug: string, title: string) {
  if (level === 2) {
    parent.title = title
    out.push({ slug, level: 2, title })
  } else if (level === 3) {
    out.push(parent.title === undefined ? { slug, level: 3, title } : { slug, level: 3, title, parent: parent.title })
  }
}

/** Titoli ## e ### di un file MDX con gli slug di rehype-slug. Lancia se l'MDX non compila. */
export async function extractSections(source: string): Promise<SectionEntry[]> {
  const out: SectionEntry[] = []
  const parent: { title?: string } = {}
  const collect = () => (tree: HastNode) => {
    const walk = (node: HastNode) => {
      const rank = node.type === 'element' ? /^h([1-6])$/.exec(node.tagName ?? '') : null
      const id = node.properties?.id
      if (rank && typeof id === 'string') {
        const { start, end } = node.position ?? { start: {}, end: {} }
        const src = start.offset !== undefined && end.offset !== undefined ? stripHashes(source.slice(start.offset, end.offset)) : ''
        // un titolo che non è una riga ATX semplice (setext, JSX dentro) si mostra con il suo testo
        const title = src && !src.includes('\n') ? displayTitle(src) : textOf(node).trim()
        pushSection(out, parent, Number(rank[1]), id, title)
        return
      }
      node.children?.forEach(walk)
    }
    walk(tree)
  }
  // Stessi plugin di vite.config.ts fino a rehype-slug: gli slug raccolti sono quelli dell'app
  await compile(source, { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeSlug, collect] })
  return out
}

// ---------------------------------------------------------------------------------------------------
// Estrazione riga per riga (ripiego per un MDX che non compila)
// ---------------------------------------------------------------------------------------------------

/** Titoli ## e ### letti riga per riga, saltando blocchi di codice, blocchi $$ e commenti JSX. */
export function extractSectionsByLines(source: string): SectionEntry[] {
  const slugger = new GithubSlugger()
  const out: SectionEntry[] = []
  const parent: { title?: string } = {}
  let fence: string | null = null
  let math = false
  let comment = false
  for (const line of source.split(/\r?\n/)) {
    if (fence) {
      if (new RegExp(`^ {0,3}${fence[0]}{${fence.length},}\\s*$`).test(line)) fence = null
      continue
    }
    if (comment) {
      if (line.includes('*/}')) comment = false
      continue
    }
    const open = /^ {0,3}(`{3,}|~{3,})/.exec(line)
    if (open) {
      fence = open[1]
      continue
    }
    if (math) {
      if (/\$\$\s*$/.test(line)) math = false
      continue
    }
    const t = line.trim()
    if (t.startsWith('$$')) {
      // "$$ … $$" sulla stessa riga è un blocco chiuso; "$$" da solo o "$$ …" senza chiusura lo apre
      if (t === '$$' || !(t.length > 4 && t.endsWith('$$'))) math = true
      continue
    }
    if (line.trimStart().startsWith('{/*')) {
      if (!line.includes('*/}')) comment = true
      continue
    }
    const heading = /^ {0,3}(#{1,6})(?=[ \t]|$)(.*)$/.exec(line)
    if (!heading) continue
    const raw = stripHashes(line)
    // ogni titolo, di qualsiasi livello, consuma uno slug: i duplicati si numerano sull'intero file
    const slug = slugger.slug(headingText(raw))
    pushSection(out, parent, heading[1].length, slug, displayTitle(raw))
  }
  return out
}

// ---------------------------------------------------------------------------------------------------
// Scrittura del JSON
// ---------------------------------------------------------------------------------------------------

/** Un JSON leggibile nei diff: una riga per sezione. */
function serialize(modules: Record<string, SectionEntry[]>): string {
  const ids = Object.keys(modules)
  const body = ids.map((id, i) => {
    const rows = modules[id].map((s) => `      ${JSON.stringify(s)}`).join(',\n')
    return `    ${JSON.stringify(id)}: [${rows ? `\n${rows}\n    ` : ''}]${i < ids.length - 1 ? ',' : ''}`
  })
  return `{\n  "version": 1,\n  "modules": {\n${body.join('\n')}\n  }\n}\n`
}

export async function buildSectionsIndex(root: string): Promise<{ modules: Record<string, SectionEntry[]>; warnings: string[] }> {
  const modulesDir = path.join(root, 'src/content/modules')
  const planFile = path.join(root, 'docs/plan/modules.json')
  const order: string[] = fs.existsSync(planFile) ? (JSON.parse(fs.readFileSync(planFile, 'utf8')) as { id: string }[]).map((m) => m.id) : []
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  const ids = (fs.existsSync(modulesDir) ? fs.readdirSync(modulesDir) : [])
    .filter((id) => fs.existsSync(path.join(modulesDir, id, 'index.mdx')))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))

  const modules: Record<string, SectionEntry[]> = {}
  const warnings: string[] = []
  for (const id of ids) {
    const source = fs.readFileSync(path.join(modulesDir, id, 'index.mdx'), 'utf8')
    try {
      modules[id] = await extractSections(source)
    } catch (e) {
      const reason = e instanceof Error ? e.message.split('\n')[0] : String(e)
      warnings.push(`${id}: l'MDX non compila (${reason.slice(0, 160)}), titoli letti riga per riga`)
      modules[id] = extractSectionsByLines(source)
    }
  }
  return { modules, warnings }
}

// process.exitCode e non process.exit(): su Windows l'uscita immediata può troncare l'output scritto su una pipe.
async function main(): Promise<void> {
  let root = path.resolve(import.meta.dirname, '..')
  try {
    const { values } = parseArgs({ options: { root: { type: 'string' } } })
    if (values.root) root = path.resolve(values.root)
  } catch {
    console.log('Uso: npx tsx scripts/build-search-index.ts [--root <cartella>]')
    process.exitCode = 1
    return
  }
  try {
    const { modules, warnings } = await buildSectionsIndex(root)
    const file = path.join(root, OUTPUT)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, serialize(modules))
    const count = Object.values(modules).reduce((n, list) => n + list.length, 0)
    const sheets = Object.keys(modules).length
    console.log(`Indice delle sezioni: ${sheets} ${sheets === 1 ? 'foglio' : 'fogli'}, ${count} titoli -> ${OUTPUT}`)
    warnings.forEach((w) => console.log('  ! avviso: ' + w))
  } catch (e) {
    console.log(`Errore: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`)
    process.exitCode = 1
  }
}

// gira solo se lanciato come script, non quando lo importano i test
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main()
