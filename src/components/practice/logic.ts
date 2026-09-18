// Logica pura della pratica (flashcard, quiz, esercizi, orale): niente React qui dentro, così i file dei
// componenti esportano solo componenti e queste funzioni si provano da sole (logic.test.ts).
import type { ExerciseAnswer, Flashcard, FlashcardKind, QuizItem, Rich } from '../../content/types'
import type { SrsCard, SrsGrade } from '../../lib/srs'
import type { ExamEntry } from '../../store/progress'

// ---------------------------------------------------------------------------------------------
// Flashcard
// ---------------------------------------------------------------------------------------------

/** Una carta del mazzo con la sua chiave nei progressi: progressKey(moduleId, card.id). */
export interface DeckEntry {
  key: string
  card: Flashcard
  /** da dove viene la carta (il titolo del modulo), per i mazzi che mescolano più fogli */
  origin?: string
}

/**
 * Le carte da ripassare adesso: prima le scadute, dalla più vecchia, poi quelle mai viste nell'ordine
 * del mazzo (che è l'ordine in cui il foglio le presenta). Le carte che scadono più avanti restano fuori.
 */
export function dueQueue(entries: readonly DeckEntry[], state: Readonly<Record<string, SrsCard>>, now: number): DeckEntry[] {
  const overdue: DeckEntry[] = []
  const fresh: DeckEntry[] = []
  for (const e of entries) {
    const s = state[e.key]
    if (!s) fresh.push(e)
    else if (s.due <= now) overdue.push(e)
  }
  // sort è stabile: a parità di scadenza resta l'ordine del mazzo
  overdue.sort((a, b) => state[a.key].due - state[b.key].due)
  return [...overdue, ...fresh]
}

/** La prossima scadenza futura del mazzo (ms), o null se nessuna carta ne ha una. */
export function nextDue(entries: readonly DeckEntry[], state: Readonly<Record<string, SrsCard>>, now: number): number | null {
  let best: number | null = null
  for (const e of entries) {
    const due = state[e.key]?.due
    if (due !== undefined && due > now && (best === null || due < best)) best = due
  }
  return best
}

export interface GradeOption {
  /** tasto della tastiera */
  key: '1' | '2' | '3' | '4'
  /** voto passato a review (lib/srs) */
  grade: SrsGrade
  label: string
}

/** I quattro voti di una carta: il tasto è la posizione, il voto è quello di SM-2 (1, 3, 4, 5). */
export const GRADES: readonly GradeOption[] = [
  { key: '1', grade: 1, label: 'Non la sapevo' },
  { key: '2', grade: 3, label: 'A fatica' },
  { key: '3', grade: 4, label: 'Bene' },
  { key: '4', grade: 5, label: 'Facile' },
]

export const gradeForKey = (key: string): SrsGrade | null => GRADES.find((g) => g.key === key)?.grade ?? null

export const KIND_LABEL: Record<FlashcardKind, string> = {
  definizione: 'Definizione',
  formula: 'Formula',
  intuizione: 'Intuizione',
  confronto: 'Confronto',
  proprieta: 'Proprietà',
  procedura: 'Procedura',
}

/** Un intervallo di ripasso in giorni, in parole: "domani", "tra 6 giorni", "tra 2 mesi". */
export function intervalLabel(days: number): string {
  const d = Math.max(0, Math.round(days))
  if (d === 0) return 'oggi'
  if (d === 1) return 'domani'
  if (d < 30) return `tra ${d} giorni`
  if (d < 365) {
    const m = Math.round(d / 30)
    return m === 1 ? 'tra 1 mese' : `tra ${m} mesi`
  }
  const y = Math.round(d / 365)
  return y === 1 ? 'tra 1 anno' : `tra ${y} anni`
}

// ---------------------------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------------------------

/** Una domanda con la sua chiave nei progressi: progressKey(moduleId, item.id). */
export interface QuizEntry {
  key: string
  item: QuizItem
  origin?: string
}

/** La risposta data: le opzioni scelte (scelta singola, multipla, vero/falso) o il testo (numerica). */
export interface QuizResponse {
  picked: number[]
  text: string
}

export const emptyResponse = (): QuizResponse => ({ picked: [], text: '' })

/** "0,33", "1.5e-3", " 2 " → numero; qualsiasi altra cosa → NaN. */
export function parseNumber(text: string): number {
  const clean = text.trim().replace(',', '.')
  return clean === '' ? Number.NaN : Number(clean)
}

/** Confronto con tolleranza: estremi compresi, più un margine per l'errore di virgola mobile. */
export const withinTolerance = (value: number, target: number, tolerance: number) =>
  Math.abs(value - target) <= tolerance + 1e-9 * Math.max(1, Math.abs(target))

/** Le opzioni mostrate: per vero/falso sono fisse, 0 = Vero e 1 = Falso. */
export const optionsOf = (item: QuizItem): Rich[] => (item.type === 'tf' ? ['Vero', 'Falso'] : item.type === 'numeric' ? [] : item.options)

export function correctOptions(item: QuizItem): number[] {
  if (item.type === 'mcq') return [item.answer]
  if (item.type === 'multi') return item.answers
  if (item.type === 'tf') return [item.answer ? 0 : 1]
  return []
}

const sameSet = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x) => b.includes(x))

export type Judgement = { ok: true; correct: boolean } | { ok: false; hint: string }

/** Esito di una risposta; se la risposta manca o non è un numero, un suggerimento al posto dell'esito. */
export function judge(item: QuizItem, response: QuizResponse): Judgement {
  if (item.type === 'numeric') {
    const value = parseNumber(response.text)
    if (!Number.isFinite(value)) return { ok: false, hint: 'Scrivi un numero, ad esempio 0,33.' }
    return { ok: true, correct: withinTolerance(value, item.answer, item.tolerance) }
  }
  if (response.picked.length === 0) {
    return { ok: false, hint: item.type === 'multi' ? 'Scegli almeno una risposta.' : 'Scegli una risposta.' }
  }
  return { ok: true, correct: sameSet(response.picked, correctOptions(item)) }
}

/** true se non è stata data nessuna risposta (né scelte né testo). */
export const isBlank = (r: QuizResponse) => r.picked.length === 0 && r.text.trim() === ''

// ---------------------------------------------------------------------------------------------
// Esercizi
// ---------------------------------------------------------------------------------------------

/** Esito di una risposta numerica di un esercizio: null se il testo non è un numero. */
export function checkAnswer(answer: ExerciseAnswer, text: string): boolean | null {
  const value = parseNumber(text)
  if (!Number.isFinite(value)) return null
  return withinTolerance(value, answer.value, answer.tolerance)
}

// ---------------------------------------------------------------------------------------------
// Orale
// ---------------------------------------------------------------------------------------------

export type ExamScore = 0 | 1 | 2 | 3

export const SCORE_LABEL: Record<ExamScore, string> = {
  0: 'Non la so',
  1: 'Parziale',
  2: 'Buona',
  3: 'Completa',
}

/** Voto suggerito dai punti della traccia che si è detto di aver toccato. */
export function suggestScore(ticked: number, total: number): ExamScore | null {
  if (total <= 0) return null
  return Math.round((3 * Math.min(ticked, total)) / total) as ExamScore
}

export interface ExamHistory {
  attempts: number
  last: ExamScore | null
  best: ExamScore | null
}

/** Le simulazioni di una domanda d'orale già registrate. */
export function examHistory(entries: readonly ExamEntry[], key: string): ExamHistory {
  let attempts = 0
  let last: ExamScore | null = null
  let best: ExamScore | null = null
  for (const e of entries) {
    if (e.key !== key) continue
    attempts++
    last = e.score
    if (best === null || e.score > best) best = e.score
  }
  return { attempts, last, best }
}

// ---------------------------------------------------------------------------------------------
// Formati
// ---------------------------------------------------------------------------------------------

/** Secondi come orologio: "0:05", "12:34", "1:02:03". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
}

/** Numero all'italiana, fino a sei decimali: 0,25. */
export const formatNumber = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: 6 })
