import { describe, expect, it } from 'vitest'
import { defineModule } from '../content/types'
import type { ModuleData } from '../content/types'
import { initialProgress, progressKey } from '../store/progress'
import type { ProgressData } from '../store/progress'
import {
  accuracy,
  backupFileName,
  backupSummary,
  cardRows,
  challengeRows,
  examSummary,
  isEmptyProgress,
  quizRows,
  sheetsByStatus,
} from './progressSummary'

const DAY = 86_400_000
const NOW = new Date(2026, 8, 24, 12, 0).getTime()

const base = (id: string, course: ModuleData['course']): ModuleData =>
  defineModule({
    id,
    title: id,
    titleEn: id,
    course,
    chapter: 'x',
    order: 1,
    sources: [],
    prerequisites: [],
    estimatedMinutes: 10,
    summary: '',
    keyPoints: [],
    glossary: [],
    formulas: [],
    derivations: [],
    figures: [],
    flashcards: [],
    quiz: [],
    exam: [],
    exercises: [],
    widgets: [],
    connections: [],
    coverage: {},
  })

const m09: ModuleData = {
  ...base('m09-parzen-windows', 'melgani'),
  flashcards: [
    { id: 'a', q: 'A', a: 'a', kind: 'definizione' },
    { id: 'b', q: 'B', a: 'b', kind: 'definizione' },
    { id: 'c', q: 'C', a: 'c', kind: 'definizione' },
  ],
  quiz: [
    { id: 'q1', type: 'tf', q: 'Uno', answer: true, explanation: '', difficulty: 1, concepts: [] },
    { id: 'q2', type: 'tf', q: 'Due', answer: true, explanation: '', difficulty: 1, concepts: [] },
  ],
  widgets: [{ id: 'm09-somma', title: 'La somma dei kernel', concepts: [] }],
}
const loaded = new Map([[m09.id, m09]])

describe('sheetsByStatus', () => {
  it('raggruppa i fogli per stato; i fogli non pronti e mai toccati stanno a parte', () => {
    const modules: ProgressData['modules'] = {
      'm09-parzen-windows': { status: 'completato', sections: [], lastSection: null, lastVisited: 1 },
      'm05-max-likelihood': { status: 'in-corso', sections: ['x'], lastSection: 'x', lastVisited: 2 },
    }
    const { byStatus, preparing } = sheetsByStatus(modules, new Set(['m09-parzen-windows', 'm08-non-parametrica-knn']))
    expect(byStatus.completato.map((m) => m.id)).toEqual(['m09-parzen-windows'])
    // il foglio 05 non è pronto ma lo hai già aperto: conta come in corso
    expect(byStatus['in-corso'].map((m) => m.id)).toEqual(['m05-max-likelihood'])
    expect(byStatus['da-iniziare'].map((m) => m.id)).toEqual(['m08-non-parametrica-knn'])
    expect(preparing).toHaveLength(47)
  })
})

describe('carte e quiz per foglio', () => {
  it('cardRows conta ripassate, in scadenza e mai viste; i fogli non caricati hanno totale ignoto', () => {
    const flashcards: ProgressData['flashcards'] = {
      [progressKey(m09.id, 'a')]: { ef: 2.5, interval: 1, reps: 1, due: NOW - DAY },
      [progressKey(m09.id, 'b')]: { ef: 2.5, interval: 6, reps: 2, due: NOW + 5 * DAY },
      [progressKey('m08-non-parametrica-knn', 'x')]: { ef: 2.5, interval: 1, reps: 1, due: NOW },
    }
    expect(cardRows(flashcards, loaded, NOW)).toEqual([
      { moduleId: 'm08-non-parametrica-knn', total: null, seen: 1, due: 1, fresh: null },
      { moduleId: 'm09-parzen-windows', total: 3, seen: 2, due: 1, fresh: 1 },
    ])
  })

  it('quizRows somma tentativi e risposte giuste; accuracy è null senza tentativi', () => {
    const quiz: ProgressData['quiz'] = {
      [progressKey(m09.id, 'q1')]: { attempts: 3, correct: 2, lastCorrect: false, lastAt: NOW },
      [progressKey(m09.id, 'q2')]: { attempts: 1, correct: 1, lastCorrect: true, lastAt: NOW },
    }
    const rows = quizRows(quiz, loaded)
    expect(rows).toEqual([{ moduleId: m09.id, items: 2, tried: 2, attempts: 4, correct: 3, wrongLast: 1 }])
    expect(accuracy(rows[0])).toBe(0.75)
    expect(accuracy({ ...rows[0], attempts: 0, correct: 0 })).toBeNull()
    // un foglio pronto senza tentativi compare comunque, con le domande da provare
    expect(quizRows({}, loaded)).toEqual([{ moduleId: m09.id, items: 2, tried: 0, attempts: 0, correct: 0, wrongLast: 0 }])
  })

  it('una chiave senza «<foglio>:» non crea un foglio fantasma (regressione: "senzaduepunti" dava il foglio "senzaduepunt")', () => {
    const stat = { attempts: 1, correct: 1, lastCorrect: true, lastAt: NOW }
    expect(quizRows({ senzaduepunti: stat }, loaded).map((r) => r.moduleId)).toEqual([m09.id])
  })
})

describe('orale e sfide', () => {
  it('examSummary: numero, media e distribuzione dei voti', () => {
    const s = examSummary([
      { key: 'm09-parzen-windows:e1', score: 3, at: 1 },
      { key: 'm09-parzen-windows:e2', score: 1, at: 2 },
      { key: 'm05-max-likelihood:e1', score: 2, at: 3 },
    ])
    expect(s).toEqual({ count: 3, average: 2, byScore: [0, 1, 1, 1], sheets: 2 })
    expect(examSummary([]).average).toBeNull()
  })

  it('challengeRows mette prima le più recenti e trova il titolo del widget', () => {
    const rows = challengeRows({ 'm09-somma': 10, 'd01-sconosciuto': 20 }, loaded)
    expect(rows).toEqual([
      { widgetId: 'd01-sconosciuto', title: null, moduleId: null, at: 20 },
      { widgetId: 'm09-somma', title: 'La somma dei kernel', moduleId: m09.id, at: 10 },
    ])
  })
})

describe('backup', () => {
  it('isEmptyProgress e backupSummary leggono lo stato', () => {
    const empty = initialProgress()
    expect(isEmptyProgress(empty)).toBe(true)
    const data: ProgressData = {
      ...empty,
      modules: { a: { status: 'in-corso', sections: [], lastSection: null, lastVisited: 1 } },
      flashcards: { 'a:1': { ef: 2.5, interval: 1, reps: 1, due: 1 } },
      exam: [{ key: 'a:e', score: 2, at: 1 }],
      bookmarks: ['a#x'],
    }
    expect(isEmptyProgress(data)).toBe(false)
    expect(backupSummary(data)).toEqual({ sheets: 1, cards: 1, quiz: 0, exams: 1, challenges: 0, bookmarks: 1, notes: 0 })
  })

  it('backupFileName porta la data del giorno', () => {
    expect(backupFileName(NOW)).toBe('ml-study-hub-progressi-2026-09-24.json')
  })
})
