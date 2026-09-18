// src/content/types.ts
export type CourseId = 'melgani' | 'passerini' | 'ricci'
export type DocId = 'part1' | 'part2' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'dl' | 'examq'
export type Prof = 'Melgani' | 'Passerini' | 'Ricci' | 'Assistant'
/** Markdown con matematica KaTeX: $inline$ e $$display$$. */
export type Rich = string
/** LaTeX puro, senza delimitatori $. */
export type Latex = string

export interface PageRef { doc: DocId; page: number }
export interface SourceRange { doc: DocId; pages: [number, number] }

export interface GlossaryEntry { term: string; en: string; def: Rich }
export interface SymbolDef { s: Latex; meaning: Rich }

/** Variante "completa la formula": masked contiene \boxed{\;?\;} al posto di answer. */
export interface FormulaBlank { masked: Latex; answer: Latex; distractors: Latex[] }

export interface Formula {
  id: string
  name: string
  nameEn: string
  latex: Latex
  explain: Rich
  symbols: SymbolDef[]
  whenToUse?: Rich
  pitfalls?: Rich
  /** 3 = da saper scrivere a memoria all'orale */
  importance: 1 | 2 | 3
  blanks: FormulaBlank[]
  source: PageRef[]
}

export interface DerivationStep { latex: Latex; why: Rich }
export interface Derivation {
  id: string
  title: string
  goal: Rich
  assumptions?: Rich
  steps: DerivationStep[]
  conclusion: Rich
  source: PageRef[]
}

export interface Figure { id: string; file: string; caption: Rich; alt: string; source: PageRef }

interface QuizBase { id: string; q: Rich; explanation: Rich; difficulty: 1 | 2 | 3; concepts: string[] }
export type QuizItem =
  | (QuizBase & { type: 'mcq'; options: Rich[]; answer: number })
  | (QuizBase & { type: 'multi'; options: Rich[]; answers: number[] })
  | (QuizBase & { type: 'tf'; answer: boolean })
  | (QuizBase & { type: 'numeric'; answer: number; tolerance: number; unit?: string })

export type FlashcardKind = 'definizione' | 'formula' | 'intuizione' | 'confronto' | 'proprieta' | 'procedura'
export interface Flashcard { id: string; q: Rich; a: Rich; kind: FlashcardKind }

export interface ExamQuestion {
  id: string
  q: Rich
  qEn: string
  prof: Prof
  fromBank: boolean
  /** testo verbatim della banca domande quando fromBank è true */
  bankText?: string
  answer: Rich
  checklist: string[]
  followUps: { q: Rich; a: Rich }[]
}

export interface Rng {
  next(): number
  int(min: number, max: number): number
  float(min: number, max: number, decimals?: number): number
  normal(mu?: number, sigma?: number): number
  pick<T>(xs: readonly T[]): T
  shuffle<T>(xs: readonly T[]): T[]
}
export interface ExerciseAnswer { label: string; value: number; tolerance: number }
export interface ExerciseInstance { prompt: Rich; answers: ExerciseAnswer[]; solution: Rich }
export interface Exercise {
  id: string
  title: string
  difficulty: 1 | 2 | 3
  kind: 'numerico' | 'concettuale' | 'dimostrazione'
  concepts: string[]
  generate: (rng: Rng) => ExerciseInstance
}

export interface WidgetRef { id: string; title: string; concepts: string[] }

/**
 * Destinazioni di copertura:
 * "#slug-titolo" (sezione MDX), "example:<id>", "formula:<id>", "derivation:<id>", "widget:<id>",
 * "figure:<id>", "quiz:<id>", "flashcard:<id>", "exam:<id>", "exercise:<id>", "seeAlso:<moduleId>#<slug>"
 */
export type CoverageTarget = string

export interface ModuleData {
  id: string
  title: string
  titleEn: string
  course: CourseId
  chapter: string
  order: number
  sources: SourceRange[]
  prerequisites: string[]
  estimatedMinutes: number
  summary: Rich
  keyPoints: Rich[]
  glossary: GlossaryEntry[]
  formulas: Formula[]
  derivations: Derivation[]
  figures: Figure[]
  flashcards: Flashcard[]
  quiz: QuizItem[]
  exam: ExamQuestion[]
  exercises: Exercise[]
  widgets: WidgetRef[]
  connections: { to: string; why: Rich }[]
  /** chiave = id del concetto nell'inventario (c01…) */
  coverage: Record<string, CoverageTarget[]>
}

export const defineModule = (m: ModuleData): ModuleData => m
/** Tag per scrivere LaTeX senza raddoppiare i backslash: md`\hat{\mu} = \frac{1}{N}` */
export const md = String.raw
