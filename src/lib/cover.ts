// La logica della copertina (/): quello che serve per "oggi sul campo", in funzioni pure sui dati dei fogli
// pronti e sui progressi. Nessun componente qui: Home.tsx resta solo componenti e queste si provano da sole.
// Tutto ragiona per giorni di calendario locali, non per blocchi di 24 ore: la domanda del giorno cambia a
// mezzanotte e il cambio dell'ora non sposta niente.
import { manifest } from '../content/manifest'
import type { CourseId, ExamQuestion, ModuleData } from '../content/types'
import { moduleOfKey } from '../store/progress'
import type { ModuleProgress, QuizStat } from '../store/progress'
import { createRng } from './rng'
import type { SrsCard } from './srs'

const DAY = 86_400_000

// ---------------------------------------------------------------------------------------------
// Giorni
// ---------------------------------------------------------------------------------------------

/** Il giorno di calendario locale di un istante, come intero: giorni dal 1° gennaio 1970. */
export function calendarDay(now: number): number {
  const d = new Date(now)
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY)
}

/** L'ultimo istante (ms) del giorno di calendario di `now`. */
const endOfDay = (now: number) => {
  const d = new Date(now)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime() - 1
}

const dayMonth = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long' })

/** Quando è successo, in parole: "oggi", "ieri", "4 giorni fa", oltre la settimana "il 2 settembre". */
export function daysAgoLabel(then: number, now: number): string {
  const days = calendarDay(now) - calendarDay(then)
  if (days <= 0) return 'oggi'
  if (days === 1) return 'ieri'
  if (days < 7) return `${days} giorni fa`
  return `il ${dayMonth.format(then)}`
}

// ---------------------------------------------------------------------------------------------
// Un elemento al giorno
// ---------------------------------------------------------------------------------------------

const roundOrder = (n: number, round: number) => createRng(round + 1).shuffle(Array.from({ length: n }, (_, i) => i))

/**
 * L'elemento del giorno: sempre lo stesso per tutto il giorno, e in ogni giro di n giorni ognuno degli n
 * elementi esce una volta sola, in un ordine rimescolato per giro. Due giorni di fila non danno mai lo
 * stesso elemento, nemmeno a cavallo tra due giri. Quando l'elenco cresce (arriva un foglio) si riparte
 * con un giro nuovo: va bene, la scelta resta stabile nella giornata.
 */
export function pickOfTheDay<T>(items: readonly T[], now: number): T | null {
  const n = items.length
  if (n === 0) return null
  const day = calendarDay(now)
  if (n <= 2) return items[day % n]
  const round = Math.floor(day / n)
  const order = roundOrder(n, round)
  // lo scambio tocca solo i primi due posti, quindi l'ultimo del giro prima è quello del suo ordine rimescolato
  if (order[0] === roundOrder(n, round - 1)[n - 1]) [order[0], order[1]] = [order[1], order[0]]
  return items[order[day % n]]
}

export interface PoolEntry {
  moduleId: string
  question: ExamQuestion
}

/** Tutte le domande d'orale dei fogli pronti, con il foglio di provenienza, nell'ordine dei fogli. */
export const examPool = (sheets: readonly ModuleData[]): PoolEntry[] => sheets.flatMap((m) => m.exam.map((question) => ({ moduleId: m.id, question })))

// ---------------------------------------------------------------------------------------------
// Flashcard
// ---------------------------------------------------------------------------------------------

export interface CardLoad {
  /** carte già viste che scadono entro la fine di oggi (comprese quelle scadute da giorni) */
  due: number
  /** carte mai viste */
  fresh: number
  /** la prima scadenza dopo oggi (ms), o null */
  next: number | null
}

/** Il carico di flashcard di oggi, sulle chiavi delle carte dei fogli pronti: progressKey(moduleId, card.id). */
export function cardsForToday(keys: readonly string[], state: Readonly<Record<string, SrsCard>>, now: number): CardLoad {
  const end = endOfDay(now)
  let due = 0
  let fresh = 0
  let next: number | null = null
  for (const key of keys) {
    const card = state[key]
    if (!card) fresh++
    else if (card.due <= end) due++
    else if (next === null || card.due < next) next = card.due
  }
  return { due, fresh, next }
}

// ---------------------------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------------------------

export interface SheetAccuracy {
  moduleId: string
  /** domande del foglio a cui hai risposto almeno una volta */
  answered: number
  /** di queste, quelle la cui ultima risposta era giusta */
  right: number
  /** right / answered */
  accuracy: number
}

/**
 * Accuratezza nei quiz per foglio, sull'ultima risposta a ciascuna domanda: dice che cosa sai adesso, e
 * risale quando ripassi gli errori (la media di tutti i tentativi terrebbe per sempre gli sbagli di ieri).
 * Fogli nell'ordine della prima domanda incontrata nei progressi.
 */
export function quizAccuracyBySheet(quiz: Readonly<Record<string, QuizStat>>): SheetAccuracy[] {
  const bySheet = new Map<string, { answered: number; right: number }>()
  for (const [key, stat] of Object.entries(quiz)) {
    if (stat.attempts === 0) continue
    const id = moduleOfKey(key)
    const s = bySheet.get(id) ?? { answered: 0, right: 0 }
    s.answered++
    if (stat.lastCorrect) s.right++
    bySheet.set(id, s)
  }
  return [...bySheet].map(([moduleId, s]) => ({ moduleId, ...s, accuracy: s.right / s.answered }))
}

export interface WeakOptions {
  /** risposte minime per giudicare un foglio */
  minAnswered?: number
  /** soglia di accuratezza sotto cui un foglio è debole */
  below?: number
  limit?: number
}

/** I fogli dove sbagli di più: sotto la soglia, con abbastanza risposte, dal più debole. */
export function weakSheets(quiz: Readonly<Record<string, QuizStat>>, { minAnswered = 3, below = 0.7, limit = 3 }: WeakOptions = {}): SheetAccuracy[] {
  return quizAccuracyBySheet(quiz)
    .filter((s) => s.answered >= minAnswered && s.accuracy < below)
    .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered || a.moduleId.localeCompare(b.moduleId))
    .slice(0, limit)
}

// ---------------------------------------------------------------------------------------------
// Regioni
// ---------------------------------------------------------------------------------------------

export interface CourseProgress {
  /** fogli della regione nel manifest */
  total: number
  /** fogli con i contenuti pronti */
  ready: number
  /** fogli rilevati (completato) */
  surveyed: number
  /** fogli rilevati da ripassare */
  toReview: number
  /** fogli con il rilievo in corso */
  inProgress: number
}

/** Lo stato di una regione: quanti fogli ha, quanti sono pronti, a che punto è il tuo rilievo. */
export function courseProgress(course: CourseId, modules: Readonly<Record<string, ModuleProgress>>, isReady: (id: string) => boolean): CourseProgress {
  const sheets = manifest.filter((m) => m.course === course)
  const count = (status: ModuleProgress['status']) => sheets.filter((m) => modules[m.id]?.status === status).length
  return {
    total: sheets.length,
    ready: sheets.filter((m) => isReady(m.id)).length,
    surveyed: count('completato'),
    toReview: count('da-ripassare'),
    inProgress: count('in-corso'),
  }
}
