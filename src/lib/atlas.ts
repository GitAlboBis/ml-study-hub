// Il lessico dell'atlante, condiviso da indice, copertina, testata del foglio e viewer delle fonti:
// numero del foglio, regioni (i tre corsi), capitoli, spillo "ti sei fermato qui", documenti delle fonti.
// Funzioni pure sul manifest: nessun componente qui, così i file dei componenti restano solo componenti.
import { manifest } from '../content/manifest'
import type { ModuleManifestEntry } from '../content/manifest'
import type { CourseId, DocId, SourceRange } from '../content/types'
import type { ModuleProgress, ModuleStatus } from '../store/progress'

// ---------------------------------------------------------------------------------------------
// Fogli e regioni
// ---------------------------------------------------------------------------------------------

const indexById = new Map(manifest.map((m, i) => [m.id, i]))

/** Numero del foglio: il posto del modulo nel manifest, da "01" (lo stesso di ModLink). null se il modulo non esiste. */
export function sheetNumber(moduleId: string): string | null {
  const i = indexById.get(moduleId)
  return i === undefined ? null : String(i + 1).padStart(2, '0')
}

export interface Region {
  id: CourseId
  name: string
  /** di che cosa parla la regione, in una riga */
  what: string
  /** campo pieno della regione con il suo inchiostro leggibile (classi Tailwind statiche) */
  field: string
  /** solo il campo, per le tinte che salgono nei tasselli */
  fill: string
  /** inchiostro leggibile sul campo */
  ink: string
}

export const REGION_ORDER: readonly CourseId[] = ['melgani', 'passerini', 'ricci']

export const REGIONS: Record<CourseId, Region> = {
  melgani: {
    id: 'melgani',
    name: 'Melgani',
    what: 'Stima statistica, riduzione delle feature, classificazione supervisionata',
    field: 'bg-melgani text-melgani-ink',
    fill: 'bg-melgani',
    ink: 'text-melgani-ink',
  },
  passerini: {
    id: 'passerini',
    name: 'Passerini',
    what: 'Stima bayesiana, reti bayesiane, SVM e kernel, clustering, apprendimento per rinforzo',
    field: 'bg-passerini text-passerini-ink',
    fill: 'bg-passerini',
    ink: 'text-passerini-ink',
  },
  ricci: {
    id: 'ricci',
    name: 'Ricci',
    what: 'Deep learning: reti, CNN, RNN, transformer, modelli generativi e multimodali',
    field: 'bg-ricci text-ricci-ink',
    fill: 'bg-ricci',
    ink: 'text-ricci-ink',
  },
}

export interface Sheet {
  meta: ModuleManifestEntry
  number: string
}

export interface Chapter {
  chapter: string
  sheets: Sheet[]
}

/** I titoli italiani dei capitoli: il manifest li scrive in inglese, come le fonti. */
const CHAPTER_IT: Record<string, string> = {
  Introduction: 'Introduzione',
  'Statistical Estimation Theory': 'Teoria della stima statistica',
  'Feature Reduction': 'Riduzione delle feature',
  'Supervised Classification': 'Classificazione supervisionata',
  'ML & Bayesian Parameter Estimation': 'Stima dei parametri ML e bayesiana',
  'Bayesian Networks': 'Reti bayesiane',
  'Linear Discriminant Functions': 'Funzioni discriminanti lineari',
  'Support Vector Machines': 'Macchine a vettori di supporto',
  'Kernel Machines': 'Macchine kernel',
  'Unsupervised Learning': 'Apprendimento non supervisionato',
  'Reinforcement Learning': 'Apprendimento per rinforzo',
  'Feedforward Neural Networks': 'Reti neurali feedforward',
  Backpropagation: 'Retropropagazione',
  Optimization: 'Ottimizzazione',
  Regularization: 'Regolarizzazione',
  'Convolutional Neural Networks': 'Reti neurali convoluzionali',
  'Recurrent Neural Networks': 'Reti neurali ricorrenti',
  'Sequence Models': 'Modelli per sequenze',
  Transformers: 'Transformer',
  'Generative Models': 'Modelli generativi',
  'Diffusion Models': 'Modelli di diffusione',
  'Large Multi-Modal Models': 'Grandi modelli multimodali',
}

export interface ChapterName {
  /** la sigla del capitolo ("Cap. 2", "DL 7"); null per i capitoli di Passerini, che non ne hanno */
  prefix: string | null
  it: string
  en: string
}

/**
 * Il nome di un capitolo nelle due lingue: "Cap. 2 · Statistical Estimation Theory" diventa sigla "Cap. 2",
 * "Teoria della stima statistica" e, accanto in corsivo, l'inglese. Un capitolo senza traduzione resta com'è.
 */
export function chapterName(chapter: string): ChapterName {
  const cut = chapter.indexOf(' · ')
  const prefix = cut < 0 ? null : chapter.slice(0, cut)
  const en = cut < 0 ? chapter : chapter.slice(cut + 3)
  return { prefix, it: CHAPTER_IT[en] ?? en, en }
}

/** "Cap. 2 · Teoria della stima statistica": il nome italiano con la sigla, per le etichette di una riga. */
export function chapterLabel(chapter: string): string {
  const { prefix, it } = chapterName(chapter)
  return prefix ? `${prefix} · ${it}` : it
}

/** I fogli di una regione raggruppati per capitolo, nell'ordine del manifest. */
export function chaptersOf(course: CourseId): Chapter[] {
  const chapters: Chapter[] = []
  manifest.forEach((meta, i) => {
    if (meta.course !== course) return
    const sheet = { meta, number: String(i + 1).padStart(2, '0') }
    const last = chapters.at(-1)
    if (last && last.chapter === meta.chapter) last.sheets.push(sheet)
    else chapters.push({ chapter: meta.chapter, sheets: [sheet] })
  })
  return chapters
}

// ---------------------------------------------------------------------------------------------
// Stato del rilievo e spillo
// ---------------------------------------------------------------------------------------------

/** Stato di studio di un foglio nel lessico dell'atlante: il rilievo sul campo. */
export const STATUS_LABEL: Record<ModuleStatus, string> = {
  'da-iniziare': 'Da rilevare',
  'in-corso': 'Rilievo in corso',
  completato: 'Rilevato',
  'da-ripassare': 'Da ripassare',
}

export interface Stop {
  moduleId: string
  section: string | null
  /** istante (ms) della lettura */
  at: number
}

/** Lo spillo: il foglio letto per ultimo e la sua ultima sezione. null se non hai ancora letto nulla. */
export function lastStop(modules: Record<string, ModuleProgress>): Stop | null {
  let best: Stop | null = null
  for (const [moduleId, p] of Object.entries(modules)) {
    if (p.lastVisited > 0 && (best === null || p.lastVisited > best.at)) best = { moduleId, section: p.lastSection, at: p.lastVisited }
  }
  return best
}

/** Uno slug di sezione ("scelta-di-h") in una forma leggibile ("Scelta di h"). */
export function sectionLabel(slug: string): string {
  const text = slug.replace(/-+/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// ---------------------------------------------------------------------------------------------
// Documenti delle fonti (pagine in public/sources/<doc>/pNNN.webp)
// ---------------------------------------------------------------------------------------------

export interface DocInfo {
  /** sigla nei tasselli */
  short: string
  /** nome completo */
  long: string
  /** le slide si citano per numero di slide, le note per pagina */
  slides: boolean
  /** pagine in public/sources/<doc> */
  pages: number
}

// Sigle e nomi sono gli stessi di SourceRef (components/content), che ne tiene una copia privata.
// Il numero di pagine è quello dei WebP generati da scripts/build-source-pages.py.
export const DOCS: Record<DocId, DocInfo> = {
  ch1: { short: 'Cap. 1', long: 'Slide del Capitolo 1 (Melgani)', slides: true, pages: 43 },
  ch2: { short: 'Cap. 2', long: 'Slide del Capitolo 2 (Melgani)', slides: true, pages: 77 },
  ch3: { short: 'Cap. 3', long: 'Slide del Capitolo 3 (Melgani)', slides: true, pages: 60 },
  ch4: { short: 'Cap. 4', long: 'Slide del Capitolo 4 (Melgani)', slides: true, pages: 79 },
  part1: { short: 'Note 1', long: 'Machine Learning I, Part 1: note del corso (Melgani)', slides: false, pages: 109 },
  part2: { short: 'Note 2', long: 'Machine Learning I, Part 2: note del corso (Passerini)', slides: false, pages: 101 },
  dl: { short: 'Note DL', long: 'Deep Learning, Full Notes (Ricci)', slides: false, pages: 126 },
  examq: { short: 'Banca', long: "Banca delle domande d'orale", slides: false, pages: 6 },
}

export const isDocId = (doc: string): doc is DocId => Object.hasOwn(DOCS, doc)

/** URL del WebP di una pagina, servito dalla base dell'app. */
export const sourcePageUrl = (doc: DocId, page: number) => `${import.meta.env.BASE_URL}sources/${doc}/p${String(page).padStart(3, '0')}.webp`

/** "Cap. 2 · slide 51–66", "Note 1 · pp. 36–45", "Note 1 · p. 36". */
export function formatRange({ doc, pages: [from, to] }: SourceRange): string {
  const info = DOCS[doc]
  if (info.slides) return `${info.short} · slide ${from === to ? from : `${from}–${to}`}`
  return `${info.short} · ${from === to ? `p. ${from}` : `pp. ${from}–${to}`}`
}

/** "slide 53" oppure "p. 53". */
export const pageLabel = (doc: DocId, page: number) => `${DOCS[doc].slides ? 'slide' : 'p.'} ${page}`

/** I fogli il cui intervallo di fonti contiene la pagina, nell'ordine del manifest. */
export const modulesCitingPage = (doc: DocId, page: number): ModuleManifestEntry[] =>
  manifest.filter((m) => m.sources.some((s) => s.doc === doc && page >= s.pages[0] && page <= s.pages[1]))

/** Le pagine di un intervallo, dalla prima all'ultima. */
export const pagesOf = ({ pages: [from, to] }: SourceRange): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i)
