// Vero/Falso Sprint: 60 secondi per rispondere a più affermazioni possibili (quiz di tipo tf).
// Ogni risposta giusta vale 10 punti per il moltiplicatore della combo (sale di uno ogni tre giuste di
// fila, fino a ×4); una sbagliata azzera la combo e finisce fra gli errori da ripassare. Se le domande
// finiscono prima del tempo, ogni secondo rimasto vale 2 punti. Il tempo si misura con gli istanti
// passati alle funzioni (ms), non contando i tick; in pausa (scheda nascosta) si ferma.
import type { Rng } from '../../../content/types'
import type { Tagged, TfItem } from '../pool'

export const SPRINT_SECONDS = 60
/** Con meno di cinque affermazioni lo sprint finisce prima di cominciare. */
export const MIN_TF = 5
export const TIME_BONUS = 2

export interface SprintAnswer {
  entry: Tagged<TfItem>
  given: boolean
  correct: boolean
  points: number
}

export interface SprintState {
  queue: Tagged<TfItem>[]
  index: number
  /** istante del via, spostato in avanti dopo ogni pausa; null prima del via */
  startedAt: number | null
  pausedAt: number | null
  endedAt: number | null
  score: number
  /** giuste di fila fino adesso */
  combo: number
  bestCombo: number
  answers: SprintAnswer[]
  timeBonus: number
  reason: 'tempo' | 'domande' | null
}

export function newSprint(pool: readonly Tagged<TfItem>[], rng: Rng): SprintState {
  return {
    queue: rng.shuffle(pool),
    index: 0,
    startedAt: null,
    pausedAt: null,
    endedAt: null,
    score: 0,
    combo: 0,
    bestCombo: 0,
    answers: [],
    timeBonus: 0,
    reason: null,
  }
}

/** Moltiplicatore della prossima risposta giusta con `combo` giuste di fila alle spalle. */
export const multiplier = (combo: number) => Math.min(4, 1 + Math.floor(combo / 3))

/** Secondi di gioco trascorsi all'istante `now` (le pause non contano). */
export function elapsed(s: SprintState, now: number): number {
  if (s.startedAt === null) return 0
  const until = s.pausedAt ?? s.endedAt ?? now
  return Math.max(0, (until - s.startedAt) / 1000)
}

export const remaining = (s: SprintState, now: number) => Math.max(0, SPRINT_SECONDS - elapsed(s, now))

export const isRunning = (s: SprintState) => s.startedAt !== null && s.endedAt === null

export const startSprint = (s: SprintState, now: number): SprintState => (s.startedAt === null ? { ...s, startedAt: now } : s)

function finish(s: SprintState, now: number, reason: 'tempo' | 'domande'): SprintState {
  const left = reason === 'domande' ? Math.ceil(remaining(s, now)) : 0
  const timeBonus = left * TIME_BONUS
  return { ...s, endedAt: now, reason, timeBonus, score: s.score + timeBonus }
}

/** Da chiamare a ogni tick: chiude lo sprint allo scadere del tempo. */
export function tickSprint(s: SprintState, now: number): SprintState {
  if (!isRunning(s) || s.pausedAt !== null) return s
  return remaining(s, now) <= 0 ? finish(s, now, 'tempo') : s
}

export function answerSprint(s: SprintState, given: boolean, now: number): SprintState {
  if (!isRunning(s) || s.pausedAt !== null) return s
  if (remaining(s, now) <= 0) return finish(s, now, 'tempo')
  const entry = s.queue[s.index]
  if (!entry) return finish(s, now, 'domande')
  const correct = entry.item.answer === given
  const points = correct ? 10 * multiplier(s.combo) : 0
  const combo = correct ? s.combo + 1 : 0
  const next: SprintState = {
    ...s,
    index: s.index + 1,
    score: s.score + points,
    combo,
    bestCombo: Math.max(s.bestCombo, combo),
    answers: [...s.answers, { entry, given, correct, points }],
  }
  return next.index >= next.queue.length ? finish(next, now, 'domande') : next
}

export const pauseSprint = (s: SprintState, now: number): SprintState => (isRunning(s) && s.pausedAt === null ? { ...s, pausedAt: now } : s)

export function resumeSprint(s: SprintState, now: number): SprintState {
  if (s.pausedAt === null || s.startedAt === null) return s
  return { ...s, startedAt: s.startedAt + Math.max(0, now - s.pausedAt), pausedAt: null }
}

export const sprintMistakes = (s: SprintState) => s.answers.filter((a) => !a.correct)
