// Il glossario unificato dell'atlante: le voci `glossary` di tutti i fogli pronti, fuse per concetto, con i fogli
// in cui compaiono. Due voci sono lo stesso concetto se hanno lo stesso termine inglese a meno di maiuscole,
// accenti, trattini e parentesi ("Maximum Likelihood Estimation (MLE)" = "maximum likelihood (ML) estimation",
// "positive semi-definite" = "positive semidefinite"), oppure lo stesso termine italiano ("Bound di Cramér-Rao"
// per "Cramér-Rao bound" e "Cramér-Rao lower bound"). Nulla si perde: ogni foglio tiene la sua definizione e le
// altre grafie restano nella voce. La stessa chiave (termKey) la usano la ricerca e il gioco "Chi sono?".
// Funzioni pure: la pagina /glossario le usa per ordinare (italiano o inglese), raggruppare per iniziale, cercare
// e filtrare per regione.
import { manifest } from '../content/manifest'
import type { CourseId, ModuleData, Rich } from '../content/types'

export type GlossaryOrder = 'it' | 'en'

/** Una comparsa del termine in un foglio: il termine italiano e la definizione di quel foglio. */
export interface GlossarySighting {
  moduleId: string
  course: CourseId
  term: string
  def: Rich
}

export interface GlossaryTerm {
  /** termine inglese normalizzato della voce (glossaryKey di `en`): unico fra le voci */
  key: string
  /** termine inglese come lo scrive il primo foglio che lo usa */
  en: string
  /** le altre grafie inglesi dello stesso concetto, nell'ordine in cui compaiono */
  enAlt: string[]
  /** termini italiani distinti, nell'ordine in cui compaiono: il primo è la voce */
  it: string[]
  /** una comparsa per foglio, nell'ordine del manifest */
  sightings: GlossarySighting[]
  /** regioni in cui compare, nell'ordine del manifest */
  courses: CourseId[]
}

/** Chiave della fusione: il termine inglese in minuscolo, senza spazi in più. */
export const glossaryKey = (en: string) => en.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ')

/** Testo piegato per confronti e ricerca: senza accenti né maiuscole, con ² → 2. */
export const foldText = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Chiave di un concetto: il termine piegato (senza accenti né maiuscole), senza le parentesi e senza nulla che non
 * sia lettera o cifra. "Maximum Likelihood Estimation (MLE)", "maximum likelihood (ML) estimation" → la stessa;
 * "semi-definite" = "semidefinite". Se le parentesi erano tutto il termine, restano.
 */
export function termKey(text: string): string {
  const squash = (s: string) => foldText(s).replace(/[^\p{L}\p{N}]+/gu, '')
  return squash(text.replace(/\([^)]*\)/g, ' ')) || squash(text)
}

const manifestIndex = new Map(manifest.map((m, i) => [m.id, i]))
const orderOf = (id: string) => manifestIndex.get(id) ?? Number.MAX_SAFE_INTEGER

const tidy = (s: string) => s.trim().replace(/\s+/g, ' ')

export function mergeGlossary(modules: readonly ModuleData[]): GlossaryTerm[] {
  const sorted = [...modules].sort((a, b) => orderOf(a.id) - orderOf(b.id))
  const entries = sorted.flatMap((data) => data.glossary.filter((e) => glossaryKey(e.en) !== '').map((entry) => ({ data, entry })))

  // gruppi di voci con la stessa chiave inglese o la stessa chiave italiana (union-find): la radice è sempre la
  // voce comparsa per prima, così la voce prende il nome dal primo foglio che la usa
  const parent = entries.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const union = (a: number, b: number) => {
    const [ra, rb] = [find(a), find(b)]
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb)
  }
  const firstBy = new Map<string, number>()
  entries.forEach(({ entry }, i) => {
    for (const k of [`en:${termKey(entry.en)}`, `it:${termKey(entry.term)}`]) {
      if (k.endsWith(':')) continue
      const j = firstBy.get(k)
      if (j === undefined) firstBy.set(k, i)
      else union(j, i)
    }
  })

  const byRoot = new Map<number, GlossaryTerm>()
  entries.forEach(({ data, entry }, i) => {
    const root = find(i)
    let term = byRoot.get(root)
    if (!term) {
      const en = tidy(entries[root].entry.en)
      term = { key: glossaryKey(en), en, enAlt: [], it: [], sightings: [], courses: [] }
      byRoot.set(root, term)
    }
    const en = tidy(entry.en)
    if (glossaryKey(en) !== term.key && !term.enAlt.some((e) => glossaryKey(e) === glossaryKey(en))) term.enAlt.push(en)
    // lo stesso foglio non si conta due volte
    if (term.sightings.some((s) => s.moduleId === data.id)) return
    const it = tidy(entry.term)
    if (it && !term.it.some((t) => foldText(t) === foldText(it))) term.it.push(it)
    term.sightings.push({ moduleId: data.id, course: data.course, term: it, def: entry.def })
    if (!term.courses.includes(data.course)) term.courses.push(data.course)
  })
  return [...byRoot.values()]
}

/** La voce sotto cui un termine sta nell'ordine scelto. */
export const headword = (term: GlossaryTerm, order: GlossaryOrder) => (order === 'it' ? (term.it[0] ?? term.en) : term.en)

const COLLATORS: Record<GlossaryOrder, Intl.Collator> = {
  it: new Intl.Collator('it', { sensitivity: 'base', numeric: true }),
  en: new Intl.Collator('en', { sensitivity: 'base', numeric: true }),
}

export function sortGlossary(terms: readonly GlossaryTerm[], order: GlossaryOrder): GlossaryTerm[] {
  const collator = COLLATORS[order]
  return [...terms].sort((a, b) => collator.compare(headword(a, order), headword(b, order)) || a.key.localeCompare(b.key))
}

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
/** Sezione dei termini che non cominciano con una lettera latina (cifre, simboli, lettere greche). */
export const OTHER_INITIAL = '#'

/** L'iniziale di una voce: la prima lettera senza accenti, oppure # . */
export function initialOf(word: string): string {
  const first = foldText(word).charAt(0).toUpperCase()
  return ALPHABET.includes(first) ? first : OTHER_INITIAL
}

export interface GlossarySection {
  letter: string
  terms: GlossaryTerm[]
}

/** Sezioni per iniziale di termini già ordinati: le lettere in ordine alfabetico, # in fondo. */
export function sectionsByInitial(sorted: readonly GlossaryTerm[], order: GlossaryOrder): GlossarySection[] {
  const byLetter = new Map<string, GlossaryTerm[]>()
  for (const term of sorted) {
    const letter = initialOf(headword(term, order))
    const list = byLetter.get(letter)
    if (list) list.push(term)
    else byLetter.set(letter, [term])
  }
  return [...ALPHABET, OTHER_INITIAL].filter((l) => byLetter.has(l)).map((letter) => ({ letter, terms: byLetter.get(letter)! }))
}

export interface GlossaryFilters {
  query: string
  course: CourseId | null
}

/** Ricerca nei termini italiani e inglesi (ogni parola deve comparire) e filtro per regione. */
export function filterGlossary(terms: readonly GlossaryTerm[], { query, course }: GlossaryFilters): GlossaryTerm[] {
  const words = foldText(query).split(' ').filter(Boolean)
  return terms.filter((term) => {
    if (course && !term.courses.includes(course)) return false
    if (words.length === 0) return true
    const haystack = foldText([term.en, ...term.enAlt, ...term.it].join(' | '))
    return words.every((w) => haystack.includes(w))
  })
}

/** Id DOM di una voce: la ricerca può puntare a /glossario#termine:<slug>. */
export const termAnchor = (en: string) =>
  `termine:${foldText(glossaryKey(en))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`
