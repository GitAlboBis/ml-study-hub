// Progressi di studio: un solo store zustand, salvato in localStorage, con export/import JSON.
// Nessun backend: tutto quello che l'utente ha fatto vive qui.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { review } from '../lib/srs'
import type { SrsCard, SrsGrade } from '../lib/srs'

export const PROGRESS_KEY = 'ml-study-progress-v1'
export const PROGRESS_VERSION = 1
/** Simulazioni d'orale conservate nello storico: oltre questo numero escono le più vecchie. */
export const MAX_EXAM_HISTORY = 2000
const BACKUP_APP = 'ml-study-hub'

// ---------------------------------------------------------------------------------------------
// Tipi dello stato
// ---------------------------------------------------------------------------------------------

export const MODULE_STATUSES = ['da-iniziare', 'in-corso', 'completato', 'da-ripassare'] as const
export type ModuleStatus = (typeof MODULE_STATUSES)[number]

export interface ModuleProgress {
  status: ModuleStatus
  /** slug delle sezioni MDX lette, nell'ordine in cui sono state lette, senza ripetizioni */
  sections: string[]
  /** ultima sezione letta, per "Riprendi da dove eri" */
  lastSection: string | null
  /** istante (ms) dell'ultima sezione letta; 0 = mai */
  lastVisited: number
}

export interface QuizStat {
  attempts: number
  correct: number
  lastCorrect: boolean
  /** istante (ms) dell'ultimo tentativo */
  lastAt: number
}

export interface ExamEntry {
  /** chiave della domanda d'orale: progressKey(moduleId, examId) */
  key: string
  /** autovalutazione del simulatore dell'orale */
  score: 0 | 1 | 2 | 3
  /** istante (ms) della simulazione */
  at: number
  /** durata della risposta in secondi, se misurata */
  seconds?: number
}
export type NewExamEntry = Omit<ExamEntry, 'at'>

export interface Streak {
  /** giorni consecutivi di studio fino a lastDay incluso; per mostrarlo usare activeStreak() */
  current: number
  /** serie più lunga di sempre */
  best: number
  /** ultimo giorno di studio, data locale YYYY-MM-DD; null = mai studiato */
  lastDay: string | null
}

/** Destinazione di un segnalibro o di una nota, es. "m09-parzen-windows#scelta-di-h" o "formula:m09-parzen-windows:f01". */
export type ProgressTarget = string

/**
 * La parte serializzabile dello store: è ciò che finisce in localStorage e nei backup.
 * Le chiavi di flashcards, quiz ed exam si costruiscono con progressKey(moduleId, itemId).
 */
export interface ProgressData {
  modules: Record<string, ModuleProgress>
  flashcards: Record<string, SrsCard>
  quiz: Record<string, QuizStat>
  /** storico delle simulazioni d'orale, dalla più vecchia alla più recente */
  exam: ExamEntry[]
  /** widgetId → istante (ms) del primo completamento della sfida */
  challenges: Record<string, number>
  bookmarks: ProgressTarget[]
  notes: Record<ProgressTarget, string>
  streak: Streak
}

/**
 * Le azioni che contano come studio (markSection, gradeCard, recordQuiz, recordExam, completeChallenge)
 * aggiornano lo streak e accettano `now` in ms come ultimo parametro: nell'app si omette
 * (vale Date.now()), nei test si passa per avere date deterministiche.
 */
export interface ProgressActions {
  markSection(moduleId: string, slug: string, now?: number): void
  setModuleStatus(moduleId: string, status: ModuleStatus): void
  gradeCard(key: string, grade: SrsGrade, now?: number): void
  recordQuiz(key: string, correct: boolean, now?: number): void
  recordExam(entry: NewExamEntry, now?: number): void
  completeChallenge(widgetId: string, now?: number): void
  toggleBookmark(target: ProgressTarget): void
  /** Un testo vuoto o di soli spazi cancella la nota. */
  setNote(target: ProgressTarget, text: string): void
  /** Backup leggibile (ProgressBackup) di tutti i progressi. */
  exportJson(now?: number): string
  /**
   * Sostituisce TUTTI i progressi con quelli del backup. L'input è validato per intero prima di
   * toccare lo stato: se non è valido lancia ProgressImportError (messaggio in italiano con il
   * punto dell'errore) e lo stato resta quello di prima. Chi chiama usa try/catch.
   */
  importJson(json: string): void
  reset(): void
}

export type ProgressState = ProgressData & ProgressActions

export interface ProgressBackup {
  app: typeof BACKUP_APP
  version: number
  exportedAt: number
  state: ProgressData
}

export class ProgressImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProgressImportError'
  }
}

// ---------------------------------------------------------------------------------------------
// Funzioni pure
// ---------------------------------------------------------------------------------------------

export const initialProgress = (): ProgressData => ({
  modules: {},
  flashcards: {},
  quiz: {},
  exam: [],
  challenges: {},
  bookmarks: [],
  notes: {},
  streak: { current: 0, best: 0, lastDay: null },
})

export const selectProgressData = (s: ProgressData): ProgressData => ({
  modules: s.modules,
  flashcards: s.flashcards,
  quiz: s.quiz,
  exam: s.exam,
  challenges: s.challenges,
  bookmarks: s.bookmarks,
  notes: s.notes,
  streak: s.streak,
})

/** Chiave di una flashcard, di un quiz o di una domanda d'orale: "<moduleId>:<itemId>". */
export const progressKey = (moduleId: string, itemId: string) => `${moduleId}:${itemId}`
/** Il foglio di una chiave; '' se la chiave non ha «:» (mai un foglio inventato tagliando la chiave). */
export const moduleOfKey = (key: string) => {
  const i = key.indexOf(':')
  return i < 0 ? '' : key.slice(0, i)
}

const pad = (n: number) => String(n).padStart(2, '0')
const keyOfDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
/** Giorno di calendario locale di un istante, YYYY-MM-DD. */
export const dayKey = (now: number) => keyOfDate(new Date(now))
// Aritmetica di calendario, non 24 ore in ms: regge i giorni di 23 e 25 ore del cambio dell'ora.
const previousDayKey = (now: number) => {
  const d = new Date(now)
  return keyOfDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))
}

/** Registra un'attività di studio all'istante `now`. Restituisce lo stesso oggetto se la serie non cambia. */
export function touchStreak(streak: Streak, now: number): Streak {
  const today = dayKey(now)
  // Stesso giorno, oppure orologio tornato indietro (fuso orario, ora corretta a mano): nessuna penalità.
  if (streak.lastDay !== null && today <= streak.lastDay) return streak
  const current = streak.lastDay === previousDayKey(now) ? streak.current + 1 : 1
  return { current, best: Math.max(streak.best, current), lastDay: today }
}

/** Serie da mostrare all'istante `now`: vale finché non passa un giorno intero senza studio. */
export function activeStreak(streak: Streak, now: number): number {
  return streak.lastDay === dayKey(now) || streak.lastDay === previousDayKey(now) ? streak.current : 0
}

// ---------------------------------------------------------------------------------------------
// Validazione (import e idratazione)
// ---------------------------------------------------------------------------------------------

type Parser<T> = (v: unknown, path: string) => T

function fail(path: string, expected: string): never {
  throw new ProgressImportError(`Backup non valido: ${path} deve essere ${expected}`)
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

const num: Parser<number> = (v, path) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) fail(path, 'un numero finito non negativo')
  return v
}
const int: Parser<number> = (v, path) => {
  if (!Number.isInteger(v) || (v as number) < 0) fail(path, 'un intero non negativo')
  return v as number
}
const str: Parser<string> = (v, path) => {
  if (typeof v !== 'string') fail(path, 'una stringa')
  return v
}
const bool: Parser<boolean> = (v, path) => {
  if (typeof v !== 'boolean') fail(path, 'true o false')
  return v
}
const obj: Parser<Record<string, unknown>> = (v, path) => {
  if (!isObject(v)) fail(path, 'un oggetto')
  return v
}
const list = <T>(item: Parser<T>): Parser<T[]> => (v, path) => {
  if (!Array.isArray(v)) fail(path, 'un elenco')
  return v.map((x, i) => item(x, `${path}[${i}]`))
}
const record = <T>(item: Parser<T>): Parser<Record<string, T>> => (v, path) =>
  Object.fromEntries(Object.entries(obj(v, path)).map(([k, x]) => [k, item(x, `${path}[${JSON.stringify(k)}]`)]))
const unique = (xs: string[]) => [...new Set(xs)]

/** Una chiave "<foglio>:<voce>", come le scrive progressKey: né foglio né voce vuoti. */
const KEY = /^[^:]+:.+/
const itemKey: Parser<string> = (v, path) => {
  const k = str(v, path)
  if (!KEY.test(k)) fail(path, 'una chiave "<foglio>:<voce>"')
  return k
}
/** Un record con chiavi "<foglio>:<voce>" (flashcard, quiz). */
const keyedRecord = <T>(item: Parser<T>): Parser<Record<string, T>> => (v, path) => {
  const out = record(item)(v, path)
  for (const k of Object.keys(out)) if (!KEY.test(k)) fail(`${path}[${JSON.stringify(k)}]`, 'con una chiave "<foglio>:<voce>"')
  return out
}

/** Un giorno di calendario vero: YYYY-MM-DD che, ricostruito, dà lo stesso testo (niente 2026-13-45 né 31 settembre). */
function isCalendarDay(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  return m !== null && keyOfDate(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) === s
}

const moduleProgress: Parser<ModuleProgress> = (v, path) => {
  const o = obj(v, path)
  const status = MODULE_STATUSES.find((s) => s === o.status) ?? fail(`${path}.status`, `uno tra ${MODULE_STATUSES.join(', ')}`)
  return {
    status,
    sections: unique(list(str)(o.sections, `${path}.sections`)),
    lastSection: o.lastSection === null ? null : str(o.lastSection, `${path}.lastSection`),
    lastVisited: num(o.lastVisited, `${path}.lastVisited`),
  }
}

const srsCard: Parser<SrsCard> = (v, path) => {
  const o = obj(v, path)
  return {
    ef: num(o.ef, `${path}.ef`),
    interval: num(o.interval, `${path}.interval`),
    reps: int(o.reps, `${path}.reps`),
    due: num(o.due, `${path}.due`),
  }
}

const quizStat: Parser<QuizStat> = (v, path) => {
  const o = obj(v, path)
  const attempts = int(o.attempts, `${path}.attempts`)
  const correct = int(o.correct, `${path}.correct`)
  if (correct > attempts) fail(`${path}.correct`, 'non maggiore di attempts')
  return { attempts, correct, lastCorrect: bool(o.lastCorrect, `${path}.lastCorrect`), lastAt: num(o.lastAt, `${path}.lastAt`) }
}

const SCORES = [0, 1, 2, 3] as const
const examEntry: Parser<ExamEntry> = (v, path) => {
  const o = obj(v, path)
  const score = SCORES.find((s) => s === o.score) ?? fail(`${path}.score`, 'un voto da 0 a 3')
  const entry: ExamEntry = { key: itemKey(o.key, `${path}.key`), score, at: num(o.at, `${path}.at`) }
  if (o.seconds !== undefined) entry.seconds = num(o.seconds, `${path}.seconds`)
  return entry
}

const streakParser: Parser<Streak> = (v, path) => {
  const o = obj(v, path)
  const current = int(o.current, `${path}.current`)
  const best = int(o.best, `${path}.best`)
  if (best < current) fail(`${path}.best`, 'non minore di current')
  if (o.lastDay !== null && (typeof o.lastDay !== 'string' || !isCalendarDay(o.lastDay))) {
    fail(`${path}.lastDay`, 'una data YYYY-MM-DD esistente oppure null')
  }
  return { current, best, lastDay: o.lastDay }
}

/**
 * Legge ProgressData da un valore sconosciuto e ne restituisce una copia con i soli campi noti.
 * 'strict' (import): il primo errore lancia ProgressImportError.
 * 'salvage' (idratazione da localStorage): ogni parte non valida torna al valore iniziale, le altre si tengono.
 */
function readProgressData(value: unknown, mode: 'strict' | 'salvage'): ProgressData {
  const init = initialProgress()
  if (mode === 'salvage' && !isObject(value)) return init
  const o = obj(value, 'state')
  const part = <K extends keyof ProgressData>(key: K, parse: Parser<ProgressData[K]>): ProgressData[K] => {
    if (mode === 'strict') return parse(o[key], key)
    try {
      return parse(o[key], key)
    } catch {
      return init[key]
    }
  }
  return {
    modules: part('modules', record(moduleProgress)),
    flashcards: part('flashcards', keyedRecord(srsCard)),
    quiz: part('quiz', keyedRecord(quizStat)),
    exam: part('exam', (v, path) => list(examEntry)(v, path).slice(-MAX_EXAM_HISTORY)),
    challenges: part('challenges', record(num)),
    bookmarks: part('bookmarks', (v, path) => unique(list(str)(v, path))),
    notes: part('notes', record(str)),
    streak: part('streak', streakParser),
  }
}

/** Passi di migrazione: MIGRATIONS[n] porta lo stato dalla versione n alla n + 1. La v1 è la prima pubblicata. */
const MIGRATIONS: Record<number, (state: unknown) => unknown> = {}

/** Porta uno stato salvato con la versione `fromVersion` alla forma di PROGRESS_VERSION. */
export function migrateProgress(state: unknown, fromVersion: number): unknown {
  let s = state
  for (let v = Math.max(0, Math.floor(fromVersion)); v < PROGRESS_VERSION; v++) {
    const step = MIGRATIONS[v]
    if (step) s = step(s)
  }
  return s
}

/** Valida un backup prodotto da exportJson. Lancia ProgressImportError se non è valido. */
export function parseBackup(json: string): ProgressData {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new ProgressImportError('Backup non valido: il testo non è JSON')
  }
  if (!isObject(raw) || raw.app !== BACKUP_APP) {
    throw new ProgressImportError('Backup non valido: non è un file esportato da ML Study Hub')
  }
  const version = int(raw.version, 'version')
  if (version > PROGRESS_VERSION) {
    throw new ProgressImportError(`Backup non valido: la versione ${version} è più recente di quella supportata (${PROGRESS_VERSION})`)
  }
  const data = readProgressData(migrateProgress(raw.state, version), 'strict')
  // una serie "studiata" dopo il giorno dell'esportazione non esiste: con un giorno di margine per i fusi orari
  const last = data.streak.lastDay
  if (last !== null && typeof raw.exportedAt === 'number' && Number.isFinite(raw.exportedAt) && last > dayKey(raw.exportedAt + 86_400_000)) {
    fail('streak.lastDay', "un giorno non successivo all'esportazione del backup")
  }
  return data
}

// ---------------------------------------------------------------------------------------------
// Storage e store
// ---------------------------------------------------------------------------------------------

/**
 * localStorage che non lancia mai. Se manca, è bloccato (cookie disattivati, navigazione privata)
 * o pieno, letture e scritture diventano no-op e i progressi restano nello store in memoria.
 * Anche un contenuto che non è JSON vale come "niente di salvato".
 */
const safeStorage: PersistStorage<ProgressData> = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name)
      return raw === null ? null : (JSON.parse(raw) as StorageValue<ProgressData> | null)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value))
    } catch {
      // storage non disponibile o pieno: lo stato resta in memoria
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // idem
    }
  },
}

const emptyModule: ModuleProgress = { status: 'da-iniziare', sections: [], lastSection: null, lastVisited: 0 }

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialProgress(),

      markSection: (moduleId, slug, now = Date.now()) =>
        set((s) => {
          const prev = s.modules[moduleId] ?? emptyModule
          const next: ModuleProgress = {
            status: prev.status === 'da-iniziare' ? 'in-corso' : prev.status,
            sections: prev.sections.includes(slug) ? prev.sections : [...prev.sections, slug],
            lastSection: slug,
            lastVisited: now,
          }
          return { modules: { ...s.modules, [moduleId]: next }, streak: touchStreak(s.streak, now) }
        }),

      setModuleStatus: (moduleId, status) =>
        set((s) => ({ modules: { ...s.modules, [moduleId]: { ...(s.modules[moduleId] ?? emptyModule), status } } })),

      gradeCard: (key, grade, now = Date.now()) =>
        set((s) => ({
          flashcards: { ...s.flashcards, [key]: review(s.flashcards[key], grade, now) },
          streak: touchStreak(s.streak, now),
        })),

      recordQuiz: (key, correct, now = Date.now()) =>
        set((s) => {
          const prev = s.quiz[key]
          const stat: QuizStat = {
            attempts: (prev?.attempts ?? 0) + 1,
            correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
            lastCorrect: correct,
            lastAt: now,
          }
          return { quiz: { ...s.quiz, [key]: stat }, streak: touchStreak(s.streak, now) }
        }),

      recordExam: (entry, now = Date.now()) =>
        set((s) => ({
          exam: [...s.exam, { ...entry, at: now }].slice(-MAX_EXAM_HISTORY),
          streak: touchStreak(s.streak, now),
        })),

      completeChallenge: (widgetId, now = Date.now()) =>
        set((s) => ({
          challenges: { ...s.challenges, [widgetId]: s.challenges[widgetId] ?? now },
          streak: touchStreak(s.streak, now),
        })),

      toggleBookmark: (target) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(target) ? s.bookmarks.filter((t) => t !== target) : [...s.bookmarks, target],
        })),

      setNote: (target, text) =>
        set((s) => {
          const notes = { ...s.notes }
          if (text.trim() === '') delete notes[target]
          else notes[target] = text
          return { notes }
        }),

      exportJson: (now = Date.now()) => {
        const backup: ProgressBackup = {
          app: BACKUP_APP,
          version: PROGRESS_VERSION,
          exportedAt: now,
          state: selectProgressData(get()),
        }
        return JSON.stringify(backup, null, 2)
      },

      importJson: (json) => set(parseBackup(json)),

      reset: () => set(initialProgress()),
    }),
    {
      name: PROGRESS_KEY,
      version: PROGRESS_VERSION,
      storage: safeStorage,
      // In forma di arrow: passando la funzione direttamente TypeScript deduce lo stato dal suo parametro (ProgressData).
      partialize: (s) => selectProgressData(s),
      // La forma la controlla merge subito dopo: qui si cambia solo versione.
      migrate: (persisted, version) => migrateProgress(persisted, version) as ProgressData,
      merge: (persisted, current) =>
        persisted === undefined || persisted === null ? current : { ...current, ...readProgressData(persisted, 'salvage') },
    },
  ),
)
