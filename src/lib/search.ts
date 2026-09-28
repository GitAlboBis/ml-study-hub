// Ricerca nell'atlante (palette Ctrl+K): un indice minisearch costruito pigramente, alla prima apertura della
// palette, con i fogli pronti del registro. Tipi di documento: pagine dell'app, fogli (anche quelli in
// preparazione, di cui si conosce già il titolo dal manifest), sezioni della teoria (titoli ## e ### letti da
// src/content/search-sections.json, che prepara scripts/build-search-index.ts), formule (nome IT/EN e simboli),
// voci di glossario (una per concetto, come nella pagina /glossario: mergeGlossary), flashcard, domande d'orale
// e widget. Le sigle con il trattino si trovano anche scritte unite ("knn" trova "K-NN", "estep" trova "E-step").
//
// Pesi: i titoli contano più delle formule e le formule più del resto, sia per campo (titolo > inglese > simboli
// > testo) sia per tipo di documento. Ricerca con prefisso, fuzzy leggero sulle parole lunghe, accenti e maiuscole
// ignorati, lettere greche scritte o per nome (σ = sigma). I risultati tornano raggruppati per tipo, ognuno con il
// suo foglio. La logica è pura (buildSearchIndex, searchAtlas) e si prova con dati finti; loadSearchIndex la
// collega al registro.
import MiniSearch from 'minisearch'
import { manifest } from '../content/manifest'
import type { ModuleManifestEntry } from '../content/manifest'
import type { CourseId, FlashcardKind, ModuleData } from '../content/types'
import { REGIONS } from './atlas'
import { mergeGlossary, termAnchor } from './glossary'
import { loadReadySheets } from './readySheets'

// ---------------------------------------------------------------------------------------------
// Tipi
// ---------------------------------------------------------------------------------------------

export type ResultType = 'pagina' | 'foglio' | 'sezione' | 'formula' | 'glossario' | 'widget' | 'flashcard' | 'orale'

export const TYPE_LABEL: Record<ResultType, string> = {
  pagina: "Pagine dell'atlante",
  foglio: 'Fogli',
  sezione: 'Sezioni della teoria',
  formula: 'Formule',
  glossario: 'Glossario',
  widget: 'Laboratorio',
  flashcard: 'Flashcard',
  orale: "Domande d'orale",
}

/** Una sezione della teoria in src/content/search-sections.json (la scrive scripts/build-search-index.ts). */
export interface SectionEntry {
  slug: string
  level: 2 | 3
  /** Markdown con matematica */
  title: string
  /** titolo della sezione ## che la contiene */
  parent?: string
}
export interface SectionsFile {
  version: 1
  modules: Record<string, SectionEntry[]>
}

/** Il foglio a cui appartiene un risultato. */
export interface SheetRef {
  id: string
  /** numero del foglio nel manifest, "09" */
  number: string
  title: string
  course: CourseId
  /** false: il foglio è in preparazione e se ne conosce solo il titolo */
  ready: boolean
}

export interface SearchEntry {
  id: string
  type: ResultType
  sheet: SheetRef | null
  /** altri fogli con la stessa voce (glossario) */
  alsoIn?: string[]
  title: string
  /** true: il titolo è testo semplice e si può evidenziare; false: Markdown con matematica */
  plain: boolean
  /** riga secondaria (Markdown con matematica) */
  detail?: string
  /** la riga secondaria è in inglese: si scrive in corsivo */
  detailEn?: boolean
  /** anteprima della formula */
  latex?: string
  href: string
}

export interface SearchSources {
  /** tutti i fogli, nell'ordine dell'atlante (il manifest) */
  sheets: ModuleManifestEntry[]
  /** i fogli pronti */
  modules: ModuleData[]
  /** titoli delle sezioni per foglio; può mancare un foglio */
  sections: Record<string, SectionEntry[]>
}

export interface IndexStats {
  readySheets: number
  totalSheets: number
  entries: number
  /** fogli pronti che non si sono caricati: l'indice li ritenta alla prossima apertura */
  failedSheets: number
}

interface IndexDoc {
  id: string
  title: string
  titleEn: string
  symbols: string
  text: string
}

export interface AtlasIndex {
  mini: MiniSearch<IndexDoc>
  entries: Map<string, SearchEntry>
  stats: IndexStats
}

export interface Hit {
  entry: SearchEntry
  score: number
  /** termini dell'indice trovati nel documento, per l'evidenziazione */
  terms: string[]
}

export interface ResultGroup {
  type: ResultType
  label: string
  /** i primi risultati del gruppo */
  items: Hit[]
  /** quanti risultati ha il gruppo in tutto */
  total: number
}

export interface SearchResults {
  query: string
  /** ordinati per il miglior risultato di ciascun gruppo */
  groups: ResultGroup[]
  total: number
}

// ---------------------------------------------------------------------------------------------
// Pagine dell'app
// ---------------------------------------------------------------------------------------------

export interface AppPage {
  path: string
  title: string
  en: string
  /** a che cosa serve, in una riga */
  what: string
  keywords: string
}

export const PAGES: readonly AppPage[] = [
  { path: '/', title: 'Copertina', en: 'Cover', what: "Il quadro d'insieme dei fogli dell'atlante", keywords: 'home inizio indice' },
  { path: '/mappa', title: 'Mappa del corso', en: 'Course map', what: 'I fogli e i loro prerequisiti', keywords: 'grafo prerequisiti percorso' },
  { path: '/formulario', title: 'Formulario', en: 'Formula sheet', what: 'Tutte le formule di tutti i fogli', keywords: 'formule ripasso' },
  { path: '/glossario', title: 'Glossario', en: 'Glossary', what: 'I termini in italiano e in inglese', keywords: 'termini vocabolario dizionario' },
  { path: '/flashcard', title: 'Flashcard', en: 'Flashcards', what: 'Il ripasso a intervalli delle carte', keywords: 'carte ripasso spaced repetition' },
  { path: '/quiz', title: 'Quiz', en: 'Quiz', what: 'Le domande a risposta chiusa di tutti i fogli', keywords: 'test verifica' },
  { path: '/orale', title: "Simulatore dell'orale", en: 'Oral exam simulator', what: "Le domande d'orale, da ripetere ad alta voce", keywords: 'esame interrogazione' },
  { path: '/giochi', title: 'Giochi', en: 'Games', what: 'Formule, dimostrazioni e concetti da allenare giocando', keywords: 'gioco sfida' },
  { path: '/progressi', title: 'Progressi', en: 'Progress', what: 'Fogli rilevati, carte, quiz e simulazioni', keywords: 'statistiche risultati' },
  { path: '/copertura', title: 'Copertura', en: 'Coverage', what: 'Ogni concetto delle fonti e dove lo trovi', keywords: 'concetti fonti' },
  { path: '/impostazioni', title: 'Impostazioni', en: 'Settings', what: 'Tema, dati e preferenze', keywords: 'tema preferenze' },
]

/** Le pagine proposte dalla palette quando il campo è vuoto. */
export const QUICK_PAGES: readonly AppPage[] = ['/mappa', '/formulario', '/glossario', '/orale', '/progressi'].map((p) => PAGES.find((x) => x.path === p)!)

// ---------------------------------------------------------------------------------------------
// Testo per l'indice
// ---------------------------------------------------------------------------------------------

const GREEK: Record<string, string> = {
  α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'epsilon', ϵ: 'epsilon', ζ: 'zeta', η: 'eta', θ: 'theta', ϑ: 'theta', ι: 'iota',
  κ: 'kappa', λ: 'lambda', μ: 'mu', ν: 'nu', ξ: 'xi', π: 'pi', ρ: 'rho', σ: 'sigma', ς: 'sigma', τ: 'tau', υ: 'upsilon',
  φ: 'phi', ϕ: 'phi', χ: 'chi', ψ: 'psi', ω: 'omega',
}

/** Minuscole, lettere greche per nome, niente accenti ("Densità" -> "densita", "²" -> "2", "Σ" -> "sigma"). */
export function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[Ͱ-Ͽ]/g, (c) => GREEK[c] ?? c)
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
}

const HYPHENS = /[-\u2010\u2011\u2013]/g
const COMPOUND = /[\p{L}\p{N}\p{M}]+(?:[-\u2010\u2011\u2013][\p{L}\p{N}\p{M}]+)+/gu

/**
 * Parole: sequenze di lettere e cifre (gli accenti restano attaccati alla loro lettera). Le parole unite da un
 * trattino ("K-NN", "E-step", "k-fold") valgono anche intere e senza trattino ("knn"): la banca e chi cerca le
 * scrivono spesso così, e "k" e "nn" da soli non portano a "knn" (il fuzzy parte da cinque lettere).
 */
const tokenize = (text: string): string[] => {
  const words = text.split(/[^\p{L}\p{N}\p{M}]+/u).filter(Boolean)
  const compounds = text.match(COMPOUND)
  return compounds ? [...words, ...compounds.map((c) => c.replace(HYPHENS, ''))] : words
}

// Parole vuote, già normalizzate: si tolgono dall'indice del testo, non dai simboli (dove "e" è l'esponenziale)
const STOP = new Set(
  (
    'a ad al alla alle allo ai agli c che chi ci col come con cui da dal dalla dalle dallo dai dagli dei del della delle dello degli ' +
    'di e ed gli ha hanno ho i il in l la le lo ma ne nei nel nella nelle nello negli o per piu poi quale quali quando se si sia sono ' +
    'su sul sulla sulle sullo sui sugli tra fra un una uno cosa perche questo questa questi queste quello quella ' +
    'an and are as at be by for from has have how if is it its of on or that the this to was were what when which why with does do can'
  ).split(' '),
)

// Comandi LaTeX di struttura: non sono simboli che qualcuno cerca
const STRUCTURAL = new Set(
  (
    'frac dfrac tfrac left right mathbf mathrm mathit mathcal mathbb mathsf mathscr boldsymbol bm text textbf textit textrm operatorname ' +
    'displaystyle textstyle cdot cdots ldots dots vdots ddots quad qquad big bigl bigr Big Bigl Bigr bigg biggl biggr Bigg Biggl Biggr ' +
    'begin end limits nolimits hat bar tilde vec dot ddot overline underline widehat widetilde overbrace underbrace mid vert lvert rvert ' +
    'Vert lVert rVert langle rangle le leq ge geq neq approx sim to in notin subset subseteq cup cap times pm mp ne lt gt ' +
    'hspace vspace phantom color mathop mathrel underset overset stackrel substack'
  ).split(' '),
)

/** Il LaTeX in parole cercabili: nomi dei simboli (sigma, gamma, sum), lettere e numeri; via i comandi di struttura. */
export function latexWords(tex: string): string {
  return tex
    .replace(/\\([a-zA-Z]+)/g, (_m, cmd: string) => (STRUCTURAL.has(cmd) ? ' ' : ` ${cmd} `))
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

const MATH = /(?<!\\)\$\$([\s\S]+?)\$\$|(?<!\\)\$((?:\\[^\n]|[^$\\\n])+?)\$/g

/** Markdown con matematica in testo semplice: collegamenti ridotti al testo, formule in parole, via i marcatori. */
export function toPlain(rich: string): string {
  return rich
    .replace(MATH, (_m, display: string | undefined, inline: string | undefined) => ` ${latexWords(display ?? inline ?? '')} `)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/[*_`~#>|\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Un testo senza Markdown né matematica si può mostrare ed evidenziare così com'è. Il trattino basso conta come
 * Markdown solo a inizio o fine parola: dentro una parola ("σ_k", "h_N") non è enfasi.
 */
export const isPlainText = (s: string) => !/[$*`[\]\\<]|(?:^|[^\p{L}\p{N}])_|_(?:$|[^\p{L}\p{N}])/u.test(s)
const isPlain = isPlainText

/** Le parole della ricerca: normalizzate, senza parole vuote tranne l'ultima (la si sta ancora scrivendo). */
export function queryTerms(query: string): string[] {
  const terms = tokenize(query).map(normalizeTerm).filter(Boolean)
  return terms.filter((t, i) => i === terms.length - 1 || !STOP.has(t))
}

/** Intervalli [inizio, fine) del testo originale dove comincia una parola che inizia con uno dei termini. */
export function highlightRanges(text: string, terms: readonly string[]): [number, number][] {
  // testo normalizzato con, per ogni suo carattere, la posizione del carattere originale da cui viene
  const starts: number[] = []
  const ends: number[] = []
  let norm = ''
  let i = 0
  for (const ch of text) {
    const n = normalizeTerm(ch)
    for (let k = 0; k < n.length; k++) {
      starts.push(i)
      ends.push(i + ch.length)
    }
    norm += n
    i += ch.length
  }
  const found: [number, number][] = []
  for (const term of terms) {
    if (!term) continue
    for (let at = norm.indexOf(term); at !== -1; at = norm.indexOf(term, at + term.length)) {
      if (at === 0 || !/[\p{L}\p{N}]/u.test(norm[at - 1])) found.push([starts[at], ends[at + term.length - 1]])
    }
  }
  found.sort((a, b) => a[0] - b[0] || b[1] - a[1])
  const merged: [number, number][] = []
  for (const r of found) {
    const last = merged.at(-1)
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([r[0], r[1]])
  }
  return merged
}

// ---------------------------------------------------------------------------------------------
// Costruzione dell'indice
// ---------------------------------------------------------------------------------------------

const KIND_LABEL: Record<FlashcardKind, string> = {
  definizione: 'Definizione',
  formula: 'Formula',
  intuizione: 'Intuizione',
  confronto: 'Confronto',
  proprieta: 'Proprietà',
  procedura: 'Procedura',
}

/**
 * Peso di ogni tipo di documento: titoli di fogli e sezioni, poi formule, poi il resto. I fogli pesano molto perché
 * sono pochi e hanno titoli lunghi: senza, cercando "parzen" le decine di formule dai nomi brevi che ripetono la
 * parola passerebbero davanti al foglio che si chiama così.
 */
const TYPE_BOOST: Record<ResultType, number> = {
  foglio: 3,
  pagina: 2.5,
  sezione: 1.6,
  formula: 1.3,
  glossario: 1.15,
  widget: 1.1,
  flashcard: 1,
  orale: 1,
}
/** Un foglio in preparazione si trova, ma dopo quelli che si possono già studiare. */
const NOT_READY = 0.6

function createMini(entries: Map<string, SearchEntry>): MiniSearch<IndexDoc> {
  return new MiniSearch<IndexDoc>({
    fields: ['title', 'titleEn', 'symbols', 'text'],
    storeFields: [],
    tokenize,
    processTerm: (term, field) => {
      const n = normalizeTerm(term)
      if (!n || /^\d$/.test(n)) return null
      return field !== 'symbols' && STOP.has(n) ? null : n
    },
    searchOptions: {
      tokenize,
      processTerm: normalizeTerm,
      boost: { title: 4, titleEn: 3, symbols: 2, text: 1 },
      prefix: (term) => term.length >= 2,
      fuzzy: (term) => (term.length >= 5 ? 0.2 : false),
      maxFuzzy: 2,
      boostDocument: (id) => {
        const entry = entries.get(String(id))
        if (!entry) return 1
        return TYPE_BOOST[entry.type] * (entry.type === 'foglio' && entry.sheet && !entry.sheet.ready ? NOT_READY : 1)
      },
    },
  })
}

/** Voci da mostrare e documenti da indicizzare, dai dati dei fogli. */
function prepare({ sheets, modules, sections }: SearchSources): { entries: Map<string, SearchEntry>; docs: IndexDoc[]; stats: IndexStats } {
  const readyIds = new Set(modules.map((m) => m.id))
  const refs = new Map<string, SheetRef>(
    sheets.map((s, i) => [s.id, { id: s.id, number: String(i + 1).padStart(2, '0'), title: s.title, course: s.course, ready: readyIds.has(s.id) }]),
  )
  const entries = new Map<string, SearchEntry>()
  const docs = new Map<string, IndexDoc>()
  const add = (entry: SearchEntry, fields: Omit<IndexDoc, 'id'>) => {
    if (entries.has(entry.id)) return
    entries.set(entry.id, entry)
    docs.set(entry.id, { id: entry.id, ...fields })
  }
  const none = { title: '', titleEn: '', symbols: '', text: '' }

  for (const p of PAGES) {
    add({ id: `pagina:${p.path}`, type: 'pagina', sheet: null, title: p.title, plain: true, detail: p.what, href: p.path }, { ...none, title: p.title, titleEn: p.en, text: `${p.what} ${p.keywords}` })
  }

  for (const s of sheets) {
    const sheet = refs.get(s.id)!
    add(
      { id: `foglio:${s.id}`, type: 'foglio', sheet, title: s.title, plain: isPlain(s.title), detail: s.titleEn, detailEn: true, href: `/m/${s.id}` },
      { ...none, title: toPlain(s.title), titleEn: toPlain(s.titleEn), text: `${s.chapter} foglio ${sheet.number} ${s.id} ${REGIONS[s.course]?.name ?? ''}` },
    )
  }

  // il glossario come nella pagina /glossario: una voce per concetto, anche se i fogli lo scrivono in modo diverso,
  // che porta alla sua ancora (#termine:…), la stessa che la pagina monta subito
  const moduleById = new Map(modules.map((m) => [m.id, m]))
  for (const term of mergeGlossary(modules.filter((m) => Array.isArray(m.glossary)))) {
    const first = term.sightings[0]
    const m = moduleById.get(first.moduleId)
    const sheet = refs.get(first.moduleId) ?? { id: first.moduleId, number: '', title: m?.title ?? first.moduleId, course: first.course, ready: true }
    const title = term.it[0] ?? term.en
    const alsoIn = term.sightings.slice(1).map((s) => s.moduleId)
    add(
      { id: `glossario:${term.key}`, type: 'glossario', sheet, ...(alsoIn.length > 0 ? { alsoIn } : {}), title, plain: isPlain(title), detail: term.en, detailEn: true, href: `/glossario#${termAnchor(term.en)}` },
      { ...none, title: toPlain(term.it.join(' ')), titleEn: toPlain([term.en, ...term.enAlt].join(' ')), text: term.sightings.map((s) => toPlain(s.def)).join(' ') },
    )
  }

  for (const m of modules) {
    const sheet = refs.get(m.id) ?? { id: m.id, number: '', title: m.title, course: m.course, ready: true }
    const at = (kind: string, id: string) => `${kind}:${m.id}:${id}`

    for (const s of sections[m.id] ?? []) {
      if (typeof s?.slug !== 'string' || typeof s.title !== 'string') continue
      add(
        { id: `sezione:${m.id}#${s.slug}`, type: 'sezione', sheet, title: s.title, plain: isPlain(s.title), detail: s.parent, href: `/m/${m.id}/teoria#${s.slug}` },
        { ...none, title: toPlain(s.title), text: s.parent ? toPlain(s.parent) : '' },
      )
    }

    for (const f of m.formulas ?? []) {
      add(
        { id: at('formula', f.id), type: 'formula', sheet, title: f.name, plain: isPlain(f.name), detail: f.nameEn, detailEn: true, latex: f.latex, href: `/m/${m.id}/formule#formula:${f.id}` },
        {
          title: toPlain(f.name),
          titleEn: toPlain(f.nameEn ?? ''),
          symbols: latexWords([f.latex, ...(f.symbols ?? []).map((x) => x.s)].join(' ')),
          text: (f.symbols ?? []).map((x) => toPlain(x.meaning)).join(' '),
        },
      )
    }

    for (const w of m.widgets ?? []) {
      add({ id: at('widget', w.id), type: 'widget', sheet, title: w.title, plain: isPlain(w.title), href: `/lab/${w.id}` }, { ...none, title: toPlain(w.title) })
    }

    // flashcard e domande d'orale sono "il resto": tutto il loro testo pesa come testo
    for (const c of m.flashcards ?? []) {
      add(
        { id: at('flashcard', c.id), type: 'flashcard', sheet, title: c.q, plain: isPlain(c.q), detail: KIND_LABEL[c.kind], href: `/m/${m.id}/flashcard` },
        { ...none, text: `${toPlain(c.q)} ${toPlain(c.a)}` },
      )
    }

    for (const q of m.exam ?? []) {
      add(
        { id: at('orale', q.id), type: 'orale', sheet, title: q.q, plain: isPlain(q.q), detail: q.qEn, detailEn: true, href: `/m/${m.id}/orale#exam:${q.id}` },
        { ...none, text: [toPlain(q.q), q.qEn, q.bankText ?? '', ...(q.checklist ?? [])].join(' ') },
      )
    }
  }

  const stats = { readySheets: modules.filter((m) => refs.has(m.id)).length, totalSheets: sheets.length, entries: entries.size, failedSheets: 0 }
  return { entries, docs: [...docs.values()], stats }
}

/** L'indice, costruito in un colpo solo (test, pochi fogli). */
export function buildSearchIndex(sources: SearchSources): AtlasIndex {
  const { entries, docs, stats } = prepare(sources)
  const mini = createMini(entries)
  mini.addAll(docs)
  return { mini, entries, stats }
}

/** L'indice, costruito a blocchi per non bloccare la pagina mentre si apre la palette. */
export async function buildSearchIndexAsync(sources: SearchSources): Promise<AtlasIndex> {
  const { entries, docs, stats } = prepare(sources)
  const mini = createMini(entries)
  await mini.addAllAsync(docs, { chunkSize: 400 })
  return { mini, entries, stats }
}

// ---------------------------------------------------------------------------------------------
// Ricerca
// ---------------------------------------------------------------------------------------------

/** Cerca: con più parole vuole tutte le parole, e se nessun risultato le ha tutte ne basta una. */
export function searchAtlas(index: AtlasIndex, query: string, { perGroup = 5 }: { perGroup?: number } = {}): SearchResults {
  const q = query.trim()
  const terms = queryTerms(q)
  if (terms.length === 0) return { query: q, groups: [], total: 0 }
  const text = terms.join(' ')
  let results = index.mini.search(text, { combineWith: 'AND' })
  if (results.length === 0 && terms.length > 1) results = index.mini.search(text, { combineWith: 'OR' })

  // i risultati arrivano in ordine di punteggio: il primo di ogni tipo fissa l'ordine dei gruppi
  const byType = new Map<ResultType, Hit[]>()
  for (const r of results) {
    const entry = index.entries.get(String(r.id))
    if (!entry) continue
    const list = byType.get(entry.type) ?? []
    list.push({ entry, score: r.score, terms: r.terms })
    byType.set(entry.type, list)
  }
  // fra i fogli, quelli pronti prima di quelli in preparazione (sort è stabile: dentro ognuno resta il punteggio)
  byType.get('foglio')?.sort((a, b) => Number(b.entry.sheet?.ready ?? false) - Number(a.entry.sheet?.ready ?? false))
  const groups = [...byType].map(([type, hits]) => ({ type, label: TYPE_LABEL[type], items: hits.slice(0, perGroup), total: hits.length }))
  return { query: q, groups, total: groups.reduce((n, g) => n + g.total, 0) }
}

// ---------------------------------------------------------------------------------------------
// Indice dell'app
// ---------------------------------------------------------------------------------------------

// Il JSON delle sezioni si carica con un glob: se non esiste ancora il glob è vuoto e la ricerca va avanti senza
const sectionFiles = import.meta.glob<SectionsFile>('../content/search-sections.json', { import: 'default' })

async function loadSections(): Promise<Record<string, SectionEntry[]>> {
  const load = Object.values(sectionFiles)[0]
  if (!load) return {}
  try {
    const file = await load()
    const modules = file?.modules ?? {}
    return Object.fromEntries(Object.entries(modules).filter(([, list]) => Array.isArray(list)))
  } catch {
    return {}
  }
}

let cached: Promise<AtlasIndex> | null = null

/**
 * L'indice dei fogli pronti, costruito alla prima richiesta e poi tenuto per la sessione. Un foglio che non si
 * carica (per esempio mentre lo si sta scrivendo) resta fuori dall'indice senza fermare gli altri, e l'indice
 * così incompleto non si tiene: alla prossima apertura della palette si ritenta (stats.failedSheets dice quanti).
 */
export function loadSearchIndex(): Promise<AtlasIndex> {
  cached ??= (async () => {
    const { modules, failed } = await loadReadySheets({ lists: [] })
    const index = await buildSearchIndexAsync({ sheets: manifest, modules, sections: await loadSections() })
    index.stats.failedSheets = failed.length
    return index
  })().then(
    (index) => {
      if (index.stats.failedSheets > 0) cached = null
      return index
    },
    (e: unknown) => {
      cached = null
      throw e
    },
  )
  return cached
}
