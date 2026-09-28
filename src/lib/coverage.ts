// La copertura come registro: per ogni concetto dell'inventario (docs/inventory, ridotto dallo script
// scripts/build-coverage-index.ts in src/content/coverage-index.json) le destinazioni che la `coverage` del foglio
// dichiara, ciascuna tradotta in un collegamento con il suo nome. Funzioni pure: la pagina /copertura le monta.
// Dove porta ogni destinazione (la scheda che la contiene di sicuro):
//   "#slug", "example:"   -> scheda Teoria, all'ancora (la scheda scorre all'ancora appena la nota è pronta)
//   "formula:", "derivation:" -> scheda Formule, che le mette tutte in targa
//   "widget:"             -> laboratorio a tutta pagina (/lab/:id)
//   "figure:"             -> scheda Teoria, alla figura
//   "quiz:", "flashcard:" -> la scheda di pratica del foglio
//   "exam:", "exercise:"  -> scheda Orale ed Esercizi, alla domanda o all'esercizio
//   "seeAlso:<id>#<slug>" -> la sezione dell'altro foglio
// Come scripts/coverage-report.ts: una sezione che l'indice delle sezioni del foglio non conosce, un esempio che
// l'inventario non ha, un id che i dati non hanno sono destinazioni rotte; un rimando a un foglio non ancora pronto
// è "in attesa" (si verifica quando il foglio arriva). Né le rotte né quelle in attesa tracciano un concetto.
import { getModuleMeta, manifest } from '../content/manifest'
import type { CourseId, DocId, ModuleData, Rich } from '../content/types'
import { sectionLabel, sheetNumber } from './atlas'

// ---------------------------------------------------------------------------------------------
// Indice (forma di src/content/coverage-index.json)
// ---------------------------------------------------------------------------------------------

export interface IndexConcept {
  id: string
  name: string
  nameEn: string
  /** tipo dell'inventario: definizione, formula, teorema, proprieta, … */
  kind: string
  /** pagine delle fonti, senza doppioni, la prima è la principale */
  pages: [DocId, number][]
  /** rilevanza d'orale dell'inventario, 3 = domanda probabile */
  exam?: 1 | 2 | 3
  /** perché il concetto non ha un widget, quando l'inventario lo dice */
  noWidget?: string
}

export interface IndexModule {
  /** l'inventario ha chiuso tutti i suoi stadi */
  complete: boolean
  /** titoli degli esempi svolti (stanno solo nell'MDX, non in data.ts) */
  examples: Record<string, string>
  concepts: IndexConcept[]
}

export interface CoverageIndex {
  version: 1
  modules: Record<string, IndexModule>
}

// ---------------------------------------------------------------------------------------------
// Destinazioni
// ---------------------------------------------------------------------------------------------

export const TARGET_GROUPS = ['teoria', 'formule', 'widget', 'figure', 'quiz', 'flashcard', 'orale', 'esercizi'] as const
export type TargetGroup = (typeof TARGET_GROUPS)[number]

export const GROUP_LABEL: Record<TargetGroup, string> = {
  teoria: 'Teoria',
  formule: 'Formule',
  widget: 'Widget',
  figure: 'Figure',
  quiz: 'Quiz',
  flashcard: 'Flashcard',
  orale: 'Orale',
  esercizi: 'Esercizi',
}

/** Nome del tipo di concetto dell'inventario, come lo legge lo studente. */
export const KIND_LABEL: Record<string, string> = {
  definizione: 'Definizione',
  formula: 'Formula',
  teorema: 'Teorema',
  proprieta: 'Proprietà',
  algoritmo: 'Algoritmo',
  procedura: 'Procedura',
  esempio: 'Esempio',
  confronto: 'Confronto',
  osservazione: 'Osservazione',
  figura: 'Figura',
  applicazione: 'Applicazione',
}

export interface Destination {
  /** la stringa della coverage, es. "formula:f-c01" */
  target: string
  group: TargetGroup
  href: string
  /** nome della cosa; con `rich` è Markdown con matematica (domande, didascalie) */
  label: string
  rich: boolean
  /** la destinazione non esiste nei dati del foglio: il validatore l'avrebbe fermata, qui si mostra comunque */
  broken: boolean
  /** rimando a un foglio non ancora pronto: non si può verificare, e intanto non traccia il concetto */
  pending?: boolean
}

const PREFIX_GROUP: Record<string, TargetGroup> = {
  example: 'teoria',
  seeAlso: 'teoria',
  formula: 'formule',
  derivation: 'formule',
  widget: 'widget',
  figure: 'figure',
  quiz: 'quiz',
  flashcard: 'flashcard',
  exam: 'orale',
  exercise: 'esercizi',
}

/**
 * Titolo vero di una sezione (Markdown con matematica), se l'indice delle sezioni lo conosce. `known` dice se l'indice
 * ha le sezioni di quel foglio: allora uno slug che non c'è è una destinazione rotta; senza, non si sa e si lascia.
 */
export type SectionTitles = ((moduleId: string, slug: string) => string | undefined) & { known?: (moduleId: string) => boolean }

const noTitles: SectionTitles = () => undefined

/** Quali fogli sono pronti (hasModule del registry nella pagina). Senza, ogni foglio del manifest conta pronto. */
export type ReadySheet = (moduleId: string) => boolean

const allReady: ReadySheet = () => true

/** Lo slug è rotto solo se l'indice conosce le sezioni del foglio e non ha quello slug. */
const missingSection = (titles: SectionTitles, moduleId: string, slug: string) =>
  slug === '' || (titles.known?.(moduleId) === true && titles(moduleId, slug) === undefined)

/** I link nel Markdown di una domanda diventerebbero un <a> dentro il collegamento: resta il testo. */
const unlink = (text: Rich) => text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

/**
 * Traduce una destinazione della coverage di `data` in collegamento con nome. `titles` dà il titolo vero delle
 * sezioni; senza, il nome si ricava dallo slug ("scelta-di-h" -> "Scelta di h").
 */
export function destinationOf(data: ModuleData, inventory: IndexModule | undefined, target: string, titles: SectionTitles = noTitles, ready: ReadySheet = allReady): Destination {
  const id = data.id
  const tab = (name: string, anchor?: string) => `/m/${id}/${name}${anchor ? `#${anchor}` : ''}`
  if (target.startsWith('#')) {
    const slug = target.slice(1)
    const title = titles(id, slug)
    return { target, group: 'teoria', href: tab('teoria', slug), label: title ?? sectionLabel(slug), rich: title !== undefined, broken: missingSection(titles, id, slug) }
  }
  const colon = target.indexOf(':')
  const prefix = colon > 0 ? target.slice(0, colon) : ''
  const ref = target.slice(colon + 1)
  const group = PREFIX_GROUP[prefix]
  const found = (label: string | undefined, href: string, rich = false): Destination =>
    label === undefined
      ? { target, group: group ?? 'teoria', href, label: GROUP_LABEL[group ?? 'teoria'], rich: false, broken: true }
      : { target, group, href, label: rich ? unlink(label) : label, rich, broken: false }

  switch (prefix) {
    case 'example':
      // senza inventario non si può verificare; con l'inventario, un esempio che non ha è rotto
      return found(inventory ? inventory.examples[ref] : 'Esempio svolto', tab('teoria', target))
    case 'seeAlso': {
      const [other, slug = ''] = ref.split('#')
      const meta = other === id ? undefined : getModuleMeta(other)
      const section = slug ? (titles(other, slug) ?? sectionLabel(slug)) : ''
      const label = meta ? `Foglio ${sheetNumber(other)} · ${meta.title}${section ? ` · ${section}` : ''}` : undefined
      const d = found(label, slug ? `/m/${other}/teoria#${slug}` : `/m/${other}`, slug !== '' && titles(other, slug) !== undefined)
      if (d.broken) return d
      // foglio non ancora pronto: in attesa, si verifica quando arriva
      if (!ready(other)) return { ...d, pending: true }
      // un rimando a una sezione (non a formule, esempi…) che l'indice del foglio non conosce è rotto
      return slug !== '' && !slug.includes(':') && missingSection(titles, other, slug) ? { ...d, label: GROUP_LABEL.teoria, rich: false, broken: true } : d
    }
    case 'formula':
      return found(data.formulas.find((f) => f.id === ref)?.name, tab('formule', target))
    case 'derivation':
      return found(data.derivations.find((d) => d.id === ref)?.title, tab('formule', target))
    case 'widget':
      return found(data.widgets.find((w) => w.id === ref)?.title, `/lab/${ref}`)
    case 'figure':
      return found(data.figures.find((f) => f.id === ref)?.caption, tab('teoria', target), true)
    case 'quiz':
      return found(data.quiz.find((q) => q.id === ref)?.q, tab('quiz'), true)
    case 'flashcard':
      return found(data.flashcards.find((c) => c.id === ref)?.q, tab('flashcard'), true)
    case 'exam':
      return found(data.exam.find((q) => q.id === ref)?.q, tab('orale', target), true)
    case 'exercise':
      return found(data.exercises.find((e) => e.id === ref)?.title, tab('esercizi', target))
    default:
      return { target, group: 'teoria', href: tab('teoria'), label: target, rich: false, broken: true }
  }
}

// ---------------------------------------------------------------------------------------------
// Righe del registro
// ---------------------------------------------------------------------------------------------

export interface ConceptRow {
  concept: IndexConcept
  destinations: Destination[]
  /** gruppi con almeno una destinazione valida */
  groups: Set<TargetGroup>
  /** almeno una destinazione valida: il concetto non è perso */
  tracked: boolean
  /** destinazioni che non esistono nei dati del foglio */
  broken: number
  /** rimandi a fogli non ancora pronti: in attesa, non contano come copertura */
  pending: number
}

/** Le righe di un foglio pronto: una per concetto dell'inventario, nell'ordine dell'inventario. */
export function conceptRows(data: ModuleData, inventory: IndexModule, titles: SectionTitles = noTitles, ready: ReadySheet = allReady): ConceptRow[] {
  return inventory.concepts.map((concept) => {
    const destinations = (data.coverage[concept.id] ?? []).map((t) => destinationOf(data, inventory, t, titles, ready))
    const valid = destinations.filter((d) => !d.broken && !d.pending)
    const broken = destinations.filter((d) => d.broken).length
    return { concept, destinations, groups: new Set(valid.map((d) => d.group)), tracked: valid.length > 0, broken, pending: destinations.length - valid.length - broken }
  })
}

/** Che cosa mostrare: tutti, i concetti senza destinazioni, quelli con destinazioni rotte, o quelli senza un gruppo. */
export type CoverageView = 'tutti' | 'non-tracciati' | 'rotte' | TargetGroup

export function matchesView(row: ConceptRow, view: CoverageView): boolean {
  if (view === 'tutti') return true
  if (view === 'non-tracciati') return !row.tracked
  if (view === 'rotte') return row.broken > 0
  // un concetto senza widget per scelta dichiarata nell'inventario non è una lacuna
  if (view === 'widget' && row.concept.noWidget) return false
  return !row.groups.has(view)
}

/** Minuscole e senza accenti: "Perché" si trova scrivendo "perche". */
export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export function matchesQuery(row: ConceptRow, query: string): boolean {
  const q = fold(query.trim())
  if (!q) return true
  const { id, name, nameEn } = row.concept
  return fold(`${id} ${name} ${nameEn}`).includes(q)
}

// ---------------------------------------------------------------------------------------------
// Totali
// ---------------------------------------------------------------------------------------------

export interface SheetTotals {
  concepts: number
  tracked: number
  destinations: number
}

export function sheetTotals(rows: readonly ConceptRow[]): SheetTotals {
  return {
    concepts: rows.length,
    tracked: rows.filter((r) => r.tracked).length,
    destinations: rows.reduce((n, r) => n + r.destinations.length, 0),
  }
}

export interface RegionTotals extends Omit<SheetTotals, 'concepts'> {
  course: CourseId
  /** fogli della regione nel manifest */
  sheets: number
  /** fogli pronti (con le righe del registro) */
  ready: number
  /** fogli con un inventario */
  withInventory: number
  /** concetti inventariati in tutti i fogli della regione, pronti o no */
  inventoried: number
  /** concetti inventariati nei fogli pronti */
  readyConcepts: number
}

/** Totali di una regione: `rows` ha le righe dei soli fogli pronti. */
export function regionTotals(course: CourseId, index: CoverageIndex, rows: ReadonlyMap<string, readonly ConceptRow[]>): RegionTotals {
  const t: RegionTotals = { course, sheets: 0, ready: 0, withInventory: 0, inventoried: 0, readyConcepts: 0, tracked: 0, destinations: 0 }
  for (const meta of manifest) {
    if (meta.course !== course) continue
    t.sheets++
    const inv = index.modules[meta.id]
    if (inv) {
      t.withInventory++
      t.inventoried += inv.concepts.length
    }
    const sheet = rows.get(meta.id)
    if (sheet) {
      const s = sheetTotals(sheet)
      t.ready++
      t.readyConcepts += s.concepts
      t.tracked += s.tracked
      t.destinations += s.destinations
    }
  }
  return t
}
