import { describe, expect, it } from 'vitest'
import type { Flashcard, QuizItem } from '../../content/types'
import type { SrsCard } from '../../lib/srs'
import {
  checkAnswer,
  correctOptions,
  dueQueue,
  examHistory,
  formatClock,
  formatNumber,
  GRADES,
  gradeForKey,
  intervalLabel,
  judge,
  nextDue,
  parseNumber,
  suggestScore,
} from './logic'
import type { DeckEntry } from './logic'

const DAY = 86_400_000
const NOW = Date.UTC(2026, 8, 18, 10)

const card = (id: string): Flashcard => ({ id, q: `domanda ${id}`, a: `risposta ${id}`, kind: 'definizione' })
const entry = (id: string): DeckEntry => ({ key: `m:${id}`, card: card(id) })
const srs = (due: number): SrsCard => ({ ef: 2.5, interval: 1, reps: 1, due })

describe('dueQueue', () => {
  it('mette prima le carte scadute (dalla più vecchia), poi quelle mai viste nell\'ordine del mazzo', () => {
    const entries = ['a', 'b', 'c', 'd', 'e'].map(entry)
    const state = { 'm:b': srs(NOW - DAY), 'm:d': srs(NOW - 3 * DAY), 'm:e': srs(NOW + DAY) }
    expect(dueQueue(entries, state, NOW).map((e) => e.card.id)).toEqual(['d', 'b', 'a', 'c'])
  })

  it('una carta che scade proprio adesso è in coda', () => {
    expect(dueQueue([entry('a')], { 'm:a': srs(NOW) }, NOW)).toHaveLength(1)
  })

  it('mazzo vuoto → coda vuota', () => {
    expect(dueQueue([], {}, NOW)).toEqual([])
  })
})

describe('nextDue', () => {
  it('restituisce la scadenza futura più vicina, o null se non ce ne sono', () => {
    const entries = ['a', 'b', 'c'].map(entry)
    expect(nextDue(entries, { 'm:a': srs(NOW + 3 * DAY), 'm:b': srs(NOW + DAY) }, NOW)).toBe(NOW + DAY)
    expect(nextDue(entries, {}, NOW)).toBeNull()
    expect(nextDue(entries, { 'm:a': srs(NOW - DAY) }, NOW)).toBeNull()
  })
})

describe('voti delle flashcard', () => {
  it('i tasti 1-4 corrispondono ai voti 1, 3, 4, 5 di review', () => {
    expect(['1', '2', '3', '4'].map(gradeForKey)).toEqual([1, 3, 4, 5])
    expect(GRADES.map((g) => g.grade)).toEqual([1, 3, 4, 5])
  })

  it('gli altri tasti non sono voti', () => {
    expect(gradeForKey('5')).toBeNull()
    expect(gradeForKey('0')).toBeNull()
    expect(gradeForKey(' ')).toBeNull()
  })
})

describe('intervalLabel', () => {
  it('scrive l\'intervallo in parole', () => {
    expect(intervalLabel(0)).toBe('oggi')
    expect(intervalLabel(1)).toBe('domani')
    expect(intervalLabel(6)).toBe('tra 6 giorni')
    expect(intervalLabel(45)).toBe('tra 2 mesi')
    expect(intervalLabel(400)).toBe('tra 1 anno')
    expect(intervalLabel(900)).toBe('tra 2 anni')
  })
})

describe('parseNumber', () => {
  it('accetta la virgola e il punto, spazi intorno, notazione esponenziale', () => {
    expect(parseNumber(' 0,33 ')).toBe(0.33)
    expect(parseNumber('1.5e-3')).toBe(0.0015)
    expect(parseNumber('-2')).toBe(-2)
  })

  it('testo vuoto o non numerico → NaN', () => {
    expect(parseNumber('')).toBeNaN()
    expect(parseNumber('   ')).toBeNaN()
    expect(parseNumber('abc')).toBeNaN()
  })
})

describe('judge', () => {
  const base = { id: 'q', q: 'domanda', explanation: 'perché', difficulty: 1 as const, concepts: [] }
  const mcq: QuizItem = { ...base, type: 'mcq', options: ['a', 'b', 'c'], answer: 1 }
  const multi: QuizItem = { ...base, type: 'multi', options: ['a', 'b', 'c'], answers: [0, 2] }
  const tf: QuizItem = { ...base, type: 'tf', answer: false }
  const numeric: QuizItem = { ...base, type: 'numeric', answer: 0.25, tolerance: 0.01 }

  it('scelta singola', () => {
    expect(judge(mcq, { picked: [1], text: '' })).toEqual({ ok: true, correct: true })
    expect(judge(mcq, { picked: [0], text: '' })).toEqual({ ok: true, correct: false })
  })

  it('scelta multipla: servono esattamente le risposte giuste, in qualsiasi ordine', () => {
    expect(judge(multi, { picked: [2, 0], text: '' })).toEqual({ ok: true, correct: true })
    expect(judge(multi, { picked: [0], text: '' })).toEqual({ ok: true, correct: false })
    expect(judge(multi, { picked: [0, 1, 2], text: '' })).toEqual({ ok: true, correct: false })
  })

  it('vero o falso: 0 = Vero, 1 = Falso', () => {
    expect(correctOptions(tf)).toEqual([1])
    expect(judge(tf, { picked: [1], text: '' })).toEqual({ ok: true, correct: true })
    expect(judge(tf, { picked: [0], text: '' })).toEqual({ ok: true, correct: false })
  })

  it('numerica con tolleranza, estremi compresi', () => {
    expect(judge(numeric, { picked: [], text: '0,26' })).toEqual({ ok: true, correct: true })
    expect(judge(numeric, { picked: [], text: '0.24' })).toEqual({ ok: true, correct: true })
    expect(judge(numeric, { picked: [], text: '0.27' })).toEqual({ ok: true, correct: false })
  })

  it('senza risposta chiede di rispondere invece di dare un esito', () => {
    expect(judge(mcq, { picked: [], text: '' })).toEqual({ ok: false, hint: 'Scegli una risposta.' })
    expect(judge(multi, { picked: [], text: '' })).toEqual({ ok: false, hint: 'Scegli almeno una risposta.' })
    expect(judge(numeric, { picked: [], text: 'boh' })).toEqual({ ok: false, hint: 'Scrivi un numero, ad esempio 0,33.' })
  })
})

describe('checkAnswer', () => {
  const answer = { label: 'x', value: 2, tolerance: 0.05 }
  it('vero dentro la tolleranza, falso fuori, null se non è un numero', () => {
    expect(checkAnswer(answer, '2,04')).toBe(true)
    expect(checkAnswer(answer, '2.1')).toBe(false)
    expect(checkAnswer(answer, '')).toBeNull()
  })

  it('tolleranza zero: vale il valore esatto, al netto dell\'errore di virgola mobile', () => {
    expect(checkAnswer({ label: 'x', value: 0.3, tolerance: 0 }, String(0.1 + 0.2))).toBe(true)
  })
})

describe('formatClock', () => {
  it('minuti e secondi, ore solo se servono', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(5)).toBe('0:05')
    expect(formatClock(754)).toBe('12:34')
    expect(formatClock(3723)).toBe('1:02:03')
    expect(formatClock(-3)).toBe('0:00')
  })
})

describe('formatNumber', () => {
  it('scrive i numeri all\'italiana', () => {
    expect(formatNumber(0.25)).toBe('0,25')
    expect(formatNumber(1 / 3)).toBe('0,333333')
  })
})

describe('suggestScore', () => {
  it('proporziona i punti spuntati sulla traccia a un voto da 0 a 3', () => {
    expect(suggestScore(0, 4)).toBe(0)
    expect(suggestScore(2, 4)).toBe(2)
    expect(suggestScore(3, 4)).toBe(2)
    expect(suggestScore(4, 4)).toBe(3)
    expect(suggestScore(1, 3)).toBe(1)
  })

  it('senza traccia non suggerisce nulla', () => {
    expect(suggestScore(0, 0)).toBeNull()
  })
})

describe('examHistory', () => {
  it('conta i tentativi di una domanda, con l\'ultimo e il migliore voto', () => {
    const entries = [
      { key: 'm:e1', score: 1 as const, at: 1 },
      { key: 'm:e2', score: 3 as const, at: 2 },
      { key: 'm:e1', score: 3 as const, at: 3 },
      { key: 'm:e1', score: 2 as const, at: 4 },
    ]
    expect(examHistory(entries, 'm:e1')).toEqual({ attempts: 3, last: 2, best: 3 })
    expect(examHistory(entries, 'm:x')).toEqual({ attempts: 0, last: null, best: null })
  })
})
