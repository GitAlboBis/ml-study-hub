// Letture dei progressi per la pagina /progressi: fogli per stato, carte e quiz per foglio, simulazioni
// d'orale, sfide dei widget, riassunto di un backup. Funzioni pure sullo store (src/store/progress.ts) e sui
// dati dei fogli caricati: i fogli non ancora caricati (o non più presenti) contano con quello che c'è nello store.
import { manifest } from '../content/manifest'
import type { ModuleManifestEntry } from '../content/manifest'
import type { ModuleData } from '../content/types'
import { dayKey, MODULE_STATUSES, moduleOfKey, progressKey } from '../store/progress'
import type { ExamEntry, ModuleStatus, ProgressData, QuizStat } from '../store/progress'
import type { SrsCard } from './srs'

const order = new Map(manifest.map((m, i) => [m.id, i]))
const byManifest = (a: string, b: string) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity) || a.localeCompare(b)

/** I fogli che compaiono nei dati caricati o nelle chiavi dello store, nell'ordine del manifest. */
function sheetIds(loaded: ReadonlyMap<string, ModuleData>, keys: Iterable<string>): string[] {
  const ids = new Set(loaded.keys())
  for (const k of keys) {
    // una chiave senza "<foglio>:" non appartiene a nessun foglio
    const id = moduleOfKey(k)
    if (id) ids.add(id)
  }
  return [...ids].sort(byManifest)
}

// ---------------------------------------------------------------------------------------------
// Fogli
// ---------------------------------------------------------------------------------------------

export interface SheetsByStatus {
  byStatus: Record<ModuleStatus, ModuleManifestEntry[]>
  /** fogli non ancora pronti che non hai mai aperto */
  preparing: ModuleManifestEntry[]
}

export function sheetsByStatus(modules: ProgressData['modules'], ready: ReadonlySet<string>): SheetsByStatus {
  const byStatus = Object.fromEntries(MODULE_STATUSES.map((s) => [s, [] as ModuleManifestEntry[]])) as Record<ModuleStatus, ModuleManifestEntry[]>
  const preparing: ModuleManifestEntry[] = []
  for (const meta of manifest) {
    const status = modules[meta.id]?.status ?? 'da-iniziare'
    if (status === 'da-iniziare' && !ready.has(meta.id)) preparing.push(meta)
    else byStatus[status].push(meta)
  }
  return { byStatus, preparing }
}

// ---------------------------------------------------------------------------------------------
// Carte e quiz
// ---------------------------------------------------------------------------------------------

export interface CardRow {
  moduleId: string
  /** carte del foglio; null se il foglio non è caricato */
  total: number | null
  /** carte ripassate almeno una volta */
  seen: number
  /** carte ripassate la cui scadenza è arrivata */
  due: number
  /** carte mai viste; null se il foglio non è caricato */
  fresh: number | null
}

export function cardRows(flashcards: Readonly<Record<string, SrsCard>>, loaded: ReadonlyMap<string, ModuleData>, now: number): CardRow[] {
  return sheetIds(loaded, Object.keys(flashcards)).flatMap((id): CardRow[] => {
    const data = loaded.get(id)
    // di un foglio caricato contano solo le sue carte di adesso; le altre chiavi sono carte tolte o rinominate
    const cards = data
      ? data.flashcards.flatMap((c) => flashcards[progressKey(id, c.id)] ?? [])
      : Object.entries(flashcards).flatMap(([k, c]) => (moduleOfKey(k) === id ? [c] : []))
    const total = data ? data.flashcards.length : null
    if (!total && cards.length === 0) return []
    const due = cards.filter((c) => c.due <= now).length
    return [{ moduleId: id, total, seen: cards.length, due, fresh: total === null ? null : total - cards.length }]
  })
}

export interface QuizRow {
  moduleId: string
  /** domande del foglio; null se il foglio non è caricato */
  items: number | null
  /** domande provate almeno una volta */
  tried: number
  attempts: number
  correct: number
  /** domande sbagliate l'ultima volta */
  wrongLast: number
}

export function quizRows(quiz: Readonly<Record<string, QuizStat>>, loaded: ReadonlyMap<string, ModuleData>): QuizRow[] {
  return sheetIds(loaded, Object.keys(quiz)).flatMap((id): QuizRow[] => {
    const data = loaded.get(id)
    const stats = data
      ? data.quiz.flatMap((q) => quiz[progressKey(id, q.id)] ?? [])
      : Object.entries(quiz).flatMap(([k, s]) => (moduleOfKey(k) === id ? [s] : []))
    const items = data ? data.quiz.length : null
    if (!items && stats.length === 0) return []
    return [
      {
        moduleId: id,
        items,
        tried: stats.length,
        attempts: stats.reduce((n, s) => n + s.attempts, 0),
        correct: stats.reduce((n, s) => n + s.correct, 0),
        wrongLast: stats.filter((s) => !s.lastCorrect).length,
      },
    ]
  })
}

/** Risposte giuste sui tentativi, da 0 a 1; null se non hai ancora provato. */
export const accuracy = (r: Pick<QuizRow, 'attempts' | 'correct'>): number | null => (r.attempts > 0 ? r.correct / r.attempts : null)

// ---------------------------------------------------------------------------------------------
// Orale e sfide
// ---------------------------------------------------------------------------------------------

export interface ExamSummary {
  count: number
  /** media dei voti da 0 a 3; null senza simulazioni */
  average: number | null
  /** quante simulazioni per voto: indice = voto */
  byScore: [number, number, number, number]
  /** fogli con almeno una simulazione */
  sheets: number
}

export function examSummary(exam: readonly ExamEntry[]): ExamSummary {
  const byScore: [number, number, number, number] = [0, 0, 0, 0]
  for (const e of exam) byScore[e.score]++
  const total = exam.reduce((n, e) => n + e.score, 0)
  return { count: exam.length, average: exam.length ? total / exam.length : null, byScore, sheets: new Set(exam.map((e) => moduleOfKey(e.key))).size }
}

export interface ChallengeRow {
  widgetId: string
  /** titolo del widget; null se il suo foglio non è caricato */
  title: string | null
  moduleId: string | null
  /** istante (ms) del primo completamento */
  at: number
}

export function challengeRows(challenges: Readonly<Record<string, number>>, loaded: ReadonlyMap<string, ModuleData>): ChallengeRow[] {
  const owner = new Map<string, { title: string; moduleId: string }>()
  for (const data of loaded.values()) for (const w of data.widgets) owner.set(w.id, { title: w.title, moduleId: data.id })
  return Object.entries(challenges)
    .map(([widgetId, at]) => ({ widgetId, title: owner.get(widgetId)?.title ?? null, moduleId: owner.get(widgetId)?.moduleId ?? null, at }))
    .sort((a, b) => b.at - a.at || a.widgetId.localeCompare(b.widgetId))
}

// ---------------------------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------------------------

export interface BackupSummary {
  sheets: number
  cards: number
  quiz: number
  exams: number
  challenges: number
  bookmarks: number
  notes: number
}

export function backupSummary(data: ProgressData): BackupSummary {
  return {
    sheets: Object.keys(data.modules).length,
    cards: Object.keys(data.flashcards).length,
    quiz: Object.keys(data.quiz).length,
    exams: data.exam.length,
    challenges: Object.keys(data.challenges).length,
    bookmarks: data.bookmarks.length,
    notes: Object.keys(data.notes).length,
  }
}

export const isEmptyProgress = (data: ProgressData) => Object.values(backupSummary(data)).every((n) => n === 0) && data.streak.lastDay === null

/** Nome del file di backup: "ml-study-hub-progressi-2026-09-24.json". */
export const backupFileName = (now: number) => `ml-study-hub-progressi-${dayKey(now)}.json`

/** "24 settembre 2026"; senza anno se è quello in corso. */
export function formatDay(ms: number, now = Date.now()): string {
  const d = new Date(ms)
  const sameYear = d.getFullYear() === new Date(now).getFullYear()
  return d.toLocaleDateString('it-IT', sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' })
}
