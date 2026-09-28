import { describe, expect, it } from 'vitest'
import { manifest } from '../content/manifest'
import type { ExamQuestion, ModuleData } from '../content/types'
import type { SrsCard } from './srs'
import type { ModuleProgress, QuizStat } from '../store/progress'
import { calendarDay, cardsForToday, courseProgress, daysAgoLabel, examPool, pickOfTheDay, quizAccuracyBySheet, weakSheets } from './cover'

// istanti locali: la copertina ragiona per giorni di calendario, non per blocchi di 24 ore
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime()
const DAY = 86_400_000

describe('giorno di calendario', () => {
  it('conta i giorni di calendario locali: mezzanotte separa due giorni, le ore dello stesso giorno no', () => {
    expect(calendarDay(at(2026, 9, 24, 0)) + 1).toBe(calendarDay(at(2026, 9, 25, 0)))
    expect(calendarDay(at(2026, 9, 24, 23))).toBe(calendarDay(at(2026, 9, 24, 1)))
  })

  it('regge il cambio dell\'ora: il giorno di 25 ore resta un giorno solo', () => {
    // in Europa l'ora legale finisce l'ultima domenica di ottobre; ovunque altrove il conto non cambia
    expect(calendarDay(at(2026, 10, 26, 0)) - calendarDay(at(2026, 10, 25, 0))).toBe(1)
  })

  it('dice quanti giorni fa, in parole', () => {
    const now = at(2026, 9, 24, 9)
    expect(daysAgoLabel(at(2026, 9, 24, 1), now)).toBe('oggi')
    expect(daysAgoLabel(at(2026, 9, 23, 23), now)).toBe('ieri')
    expect(daysAgoLabel(at(2026, 9, 20), now)).toBe('4 giorni fa')
    expect(daysAgoLabel(at(2026, 9, 2), now)).toBe('il 2 settembre')
    // orologio indietro o istante futuro: niente "tra 2 giorni fa"
    expect(daysAgoLabel(at(2026, 9, 26), now)).toBe('oggi')
  })
})

describe('un elemento al giorno', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

  it('è sempre lo stesso per tutto il giorno', () => {
    expect(pickOfTheDay(items, at(2026, 9, 24, 0))).toBe(pickOfTheDay(items, at(2026, 9, 24, 23)))
  })

  it('in ogni giro di n giorni mostra tutti gli n elementi, una volta ciascuno', () => {
    const start = calendarDay(at(2026, 1, 1))
    const first = start - (start % items.length) // primo giorno di un giro
    const seen = Array.from({ length: items.length }, (_, i) => pickOfTheDay(items, at(1970, 1, 1 + first + i)))
    expect([...seen].sort()).toEqual(items)
  })

  it('non ripete mai lo stesso elemento due giorni di fila, nemmeno a cavallo tra due giri', () => {
    let prev = pickOfTheDay(items, at(2026, 1, 1))
    for (let d = 1; d < 400; d++) {
      const cur = pickOfTheDay(items, at(2026, 1, 1 + d))
      expect(cur).not.toBe(prev)
      prev = cur
    }
  })

  it('senza elementi non sceglie nulla; con uno solo sceglie quello', () => {
    expect(pickOfTheDay([], at(2026, 9, 24))).toBeNull()
    expect(pickOfTheDay(['solo'], at(2026, 9, 24))).toBe('solo')
  })
})

describe('domande d\'orale dei fogli pronti', () => {
  const question = (id: string): ExamQuestion => ({ id, q: id, qEn: id, prof: 'Melgani', fromBank: false, answer: '', checklist: [], followUps: [] })
  const sheet = (id: string, ids: string[]) => ({ id, exam: ids.map(question) }) as unknown as ModuleData

  it('mette insieme le domande di tutti i fogli, con il foglio di provenienza, nell\'ordine dei fogli', () => {
    const pool = examPool([sheet('m05-max-likelihood', ['a', 'b']), sheet('m09-parzen-windows', ['c'])])
    expect(pool.map((e) => `${e.moduleId}:${e.question.id}`)).toEqual(['m05-max-likelihood:a', 'm05-max-likelihood:b', 'm09-parzen-windows:c'])
  })
})

describe('flashcard di oggi', () => {
  const card = (due: number): SrsCard => ({ ef: 2.5, interval: 1, reps: 1, due })
  const now = at(2026, 9, 24, 10)

  it('conta le carte che scadono entro la fine di oggi e, a parte, quelle mai viste', () => {
    const keys = ['m:1', 'm:2', 'm:3', 'm:4', 'm:5']
    const state = {
      'm:1': card(now - 3 * DAY), // scaduta da giorni
      'm:2': card(at(2026, 9, 24, 22)), // scade stasera
      'm:3': card(at(2026, 9, 26, 8)), // scade dopodomani
      'altro:9': card(0), // di un foglio che non c'è più: non conta
    }
    expect(cardsForToday(keys, state, now)).toEqual({ due: 2, fresh: 2, next: at(2026, 9, 26, 8) })
  })

  it('senza carte in scadenza dice quando scade la prossima', () => {
    expect(cardsForToday(['m:1'], { 'm:1': card(at(2026, 9, 25, 9)) }, now)).toEqual({ due: 0, fresh: 0, next: at(2026, 9, 25, 9) })
    expect(cardsForToday([], {}, now)).toEqual({ due: 0, fresh: 0, next: null })
  })
})

describe('punti deboli nei quiz', () => {
  const stat = (lastCorrect: boolean, attempts = 1): QuizStat => ({ attempts, correct: lastCorrect ? 1 : 0, lastCorrect, lastAt: 1 })

  it('misura ogni foglio sull\'ultima risposta a ciascuna domanda', () => {
    const quiz = {
      'm05-max-likelihood:q1': stat(true),
      'm05-max-likelihood:q2': stat(false, 3),
      'm09-parzen-windows:q1': stat(true),
    }
    expect(quizAccuracyBySheet(quiz)).toEqual([
      { moduleId: 'm05-max-likelihood', answered: 2, right: 1, accuracy: 0.5 },
      { moduleId: 'm09-parzen-windows', answered: 1, right: 1, accuracy: 1 },
    ])
  })

  it('sono i fogli sotto la soglia con abbastanza risposte, dal più debole, al massimo tre', () => {
    const quiz: Record<string, QuizStat> = {}
    const put = (mod: string, right: number, wrong: number) => {
      for (let i = 0; i < right; i++) quiz[`${mod}:ok${i}`] = stat(true)
      for (let i = 0; i < wrong; i++) quiz[`${mod}:ko${i}`] = stat(false)
    }
    put('m03-stima-intro-parametrica', 1, 4) // 20%
    put('m04-bonta-stimatori', 3, 2) // 60%
    put('m05-max-likelihood', 2, 3) // 40%
    put('m06-modelli-pdf-gaussiana', 4, 1) // 80%: sopra la soglia
    put('m07-stima-bayesiana', 0, 2) // 0% ma solo 2 risposte: troppo poche per dirlo
    put('m08-non-parametrica-knn', 1, 3) // 25%
    expect(weakSheets(quiz).map((w) => w.moduleId)).toEqual(['m03-stima-intro-parametrica', 'm08-non-parametrica-knn', 'm05-max-likelihood'])
    expect(weakSheets(quiz, { limit: 10 }).map((w) => w.moduleId)).toHaveLength(4)
    expect(weakSheets({})).toEqual([])
  })
})

describe('progresso per corso', () => {
  it('conta fogli, pronti e stati del rilievo della regione', () => {
    const melgani = manifest.filter((m) => m.course === 'melgani')
    const p = (status: ModuleProgress['status']): ModuleProgress => ({ status, sections: [], lastSection: null, lastVisited: 0 })
    const modules = {
      [melgani[0].id]: p('completato'),
      [melgani[1].id]: p('da-ripassare'),
      [melgani[2].id]: p('in-corso'),
      [melgani[3].id]: p('da-iniziare'),
      [manifest.find((m) => m.course === 'ricci')!.id]: p('completato'), // di un'altra regione
    }
    const ready = new Set([melgani[0].id, melgani[8].id])
    expect(courseProgress('melgani', modules, (id) => ready.has(id))).toEqual({ total: melgani.length, ready: 2, surveyed: 1, toReview: 1, inProgress: 1 })
  })
})
