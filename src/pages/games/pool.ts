// Il materiale dei giochi: quali fogli sono in gioco (il campo, filtrato per corso e foglio e letto
// dall'URL) e i mazzi che ogni gioco ricava dai loro dati. Funzioni pure sui ModuleData già caricati:
// con un solo foglio pronto o con cinquanta si comportano allo stesso modo, e nessun id è scritto a mano.
import { getModuleMeta } from '../../content/manifest'
import type { CourseId, Derivation, Exercise, Formula, FormulaBlank, GlossaryEntry, ModuleData, QuizItem } from '../../content/types'
import { REGION_ORDER, REGIONS, sheetNumber } from '../../lib/atlas'
import { termKey } from '../../lib/glossary'

// ---------------------------------------------------------------------------------------------
// Il campo di gioco
// ---------------------------------------------------------------------------------------------

export type CourseFilter = CourseId | 'tutti'

/** Dove si gioca: tutto l'atlante, una regione (corso) o un solo foglio. */
export interface GameScope {
  course: CourseFilter
  moduleId: string | null
}

export const ALL_SCOPE: GameScope = { course: 'tutti', moduleId: null }

const isCourse = (v: string | null): v is CourseId => v !== null && (REGION_ORDER as readonly string[]).includes(v)

/** Il campo letto dai parametri dell'URL (?corso=melgani&foglio=m09-…). Un foglio vale più del corso: ne porta il suo. */
export function parseScope(params: URLSearchParams): GameScope {
  const meta = getModuleMeta(params.get('foglio') ?? '')
  if (meta) return { course: meta.course, moduleId: meta.id }
  const course = params.get('corso')
  return { course: isCourse(course) ? course : 'tutti', moduleId: null }
}

/** La query string del campo, "" per tutto l'atlante: si aggiunge ai collegamenti fra hub e giochi. */
export function scopeSearch(scope: GameScope): string {
  const p = new URLSearchParams()
  if (scope.course !== 'tutti') p.set('corso', scope.course)
  if (scope.moduleId) p.set('foglio', scope.moduleId)
  const s = p.toString()
  return s ? `?${s}` : ''
}

/** Chiave stabile del campo: cambiandolo, la partita ricomincia. */
export const scopeKey = (scope: GameScope) => `${scope.course}/${scope.moduleId ?? '*'}`

/** I fogli del campo, nell'ordine in cui arrivano (quello del manifest). */
export function inScope(modules: readonly ModuleData[], scope: GameScope): ModuleData[] {
  if (scope.moduleId) return modules.filter((m) => m.id === scope.moduleId)
  if (scope.course !== 'tutti') return modules.filter((m) => m.course === scope.course)
  return [...modules]
}

/** Il campo in parole: "Tutto l'atlante", "Regione Melgani", "Foglio 09 · Finestre di Parzen…". */
export function scopeLabel(scope: GameScope): string {
  if (scope.moduleId) {
    const meta = getModuleMeta(scope.moduleId)
    return meta ? `Foglio ${sheetNumber(meta.id)} · ${meta.title}` : 'Foglio sconosciuto'
  }
  if (scope.course !== 'tutti') return `Regione ${REGIONS[scope.course].name}`
  return "Tutto l'atlante"
}

// ---------------------------------------------------------------------------------------------
// Testo
// ---------------------------------------------------------------------------------------------

/** Minuscole, senza accenti né punteggiatura, spazi singoli: per confrontare nomi e termini. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** Un LaTeX senza spazi: due formule scritte con spaziature diverse sono la stessa. */
export const texKey = (tex: string) => tex.replace(/\s+/g, '')

// ---------------------------------------------------------------------------------------------
// Mazzi
// ---------------------------------------------------------------------------------------------

/** Un elemento con il foglio da cui viene (per la chiave nei progressi e per dire da dove arriva). */
export interface Tagged<T> {
  moduleId: string
  item: T
}

const tag = <T>(m: ModuleData, xs: readonly T[]): Tagged<T>[] => xs.map((item) => ({ moduleId: m.id, item }))

export const formulasOf = (modules: readonly ModuleData[]): Tagged<Formula>[] => modules.flatMap((m) => tag(m, m.formulas))

/** Una variante "completa la formula" con la formula da cui viene. */
export interface BlankEntry {
  moduleId: string
  formula: Formula
  blank: FormulaBlank
}

/** Le varianti giocabili: risposta non vuota e almeno un distrattore diverso dalla risposta. */
export const blanksOf = (modules: readonly ModuleData[]): BlankEntry[] =>
  modules.flatMap((m) =>
    m.formulas.flatMap((formula) =>
      formula.blanks
        .filter((b) => texKey(b.answer) !== '' && b.distractors.some((d) => texKey(d) !== '' && texKey(d) !== texKey(b.answer)))
        .map((blank) => ({ moduleId: m.id, formula, blank })),
    ),
  )

/** Meno di tre passaggi non si riordinano: con due c'è una sola mossa possibile. */
export const MIN_PROOF_STEPS = 3

export const derivationsOf = (modules: readonly ModuleData[]): Tagged<Derivation>[] =>
  modules.flatMap((m) => tag(m, m.derivations.filter((d) => d.steps.length >= MIN_PROOF_STEPS)))

export type TfItem = Extract<QuizItem, { type: 'tf' }>

export const tfOf = (modules: readonly ModuleData[]): Tagged<TfItem>[] =>
  modules.flatMap((m) => tag(m, m.quiz.filter((q): q is TfItem => q.type === 'tf')))

/**
 * Il glossario del campo, senza doppioni: un concetto vale una volta anche se due fogli lo scrivono in modo diverso.
 * La chiave è quella del glossario (termKey): stesso inglese a meno di parentesi e trattini, oppure stesso italiano.
 * Così fra le quattro opzioni di "Chi sono?" non finisce mai un sinonimo della risposta.
 */
export function glossaryOf(modules: readonly ModuleData[]): Tagged<GlossaryEntry>[] {
  const seen = new Set<string>()
  return modules.flatMap((m) =>
    tag(m, m.glossary).filter(({ item }) => {
      if (normalize(item.term) === '') return false
      const keys = [`en:${termKey(item.en)}`, `it:${termKey(item.term)}`].filter((k) => !k.endsWith(':'))
      if (keys.some((k) => seen.has(k))) return false
      for (const k of keys) seen.add(k)
      return true
    }),
  )
}

export const exercisesOf = (modules: readonly ModuleData[]): Tagged<Exercise>[] => modules.flatMap((m) => tag(m, m.exercises))
