import { describe, expect, it } from 'vitest'
import type { DeckEntry, QuizEntry } from '../../components/practice/logic'
import { manifest } from '../../content/manifest'
import type { CourseId, Flashcard, ModuleData, QuizItem } from '../../content/types'
import type { SrsCard } from '../../lib/srs'
import { moduleOfKey, progressKey } from '../../store/progress'
import type { ModuleProgress, QuizStat } from '../../store/progress'
import {
  cardCounts,
  deckOf,
  drawMistakes,
  drawQuiz,
  entriesIn,
  forecast,
  inScope,
  mistakesOf,
  parseMode,
  parseScope,
  percent,
  pickSize,
  quizOf,
  quizTally,
  quizTallyBySheet,
  sessionQueue,
  sizeChoices,
  sizeLimit,
  soonestFirst,
  startedSheets,
  scopeLabel,
  scopeWhere,
  sheetsOf,
  tallyBySheet,
  writeMode,
  writeScope,
} from './selection'

const DAY = 86_400_000
const NOW = new Date(2026, 8, 24, 10, 0, 0).getTime()

// tre fogli veri del manifest, uno per regione: la logica legge la regione dal manifest
const M09 = 'm09-parzen-windows'
const P03 = 'p03-reti-bayesiane'
const D05 = 'd05-cnn'

const card = (id: string): Flashcard => ({ id, q: `Domanda ${id}`, a: `Risposta ${id}`, kind: 'definizione' })
const item = (id: string): QuizItem => ({ id, type: 'tf', q: `Vero o falso ${id}?`, answer: true, explanation: 'Perché sì.', difficulty: 1, concepts: [] })

function mod(id: string, course: CourseId, cards: number, questions: number): ModuleData {
  return {
    id,
    title: manifest.find((m) => m.id === id)?.title ?? id,
    titleEn: id,
    course,
    chapter: 'Capitolo',
    order: 1,
    sources: [],
    prerequisites: [],
    estimatedMinutes: 30,
    summary: '',
    keyPoints: [],
    glossary: [],
    formulas: [],
    derivations: [],
    figures: [],
    flashcards: Array.from({ length: cards }, (_, i) => card(`fc${i + 1}`)),
    quiz: Array.from({ length: questions }, (_, i) => item(`q${i + 1}`)),
    exam: [],
    exercises: [],
    widgets: [],
    connections: [],
    coverage: {},
  }
}

const modules = [mod(M09, 'melgani', 3, 10), mod(P03, 'passerini', 2, 10), mod(D05, 'ricci', 1, 10)]
const srsCard = (due: number, reps = 1): SrsCard => ({ ef: 2.5, interval: 1, reps, due })
const stat = (attempts: number, correct: number, lastCorrect: boolean, lastAt = NOW): QuizStat => ({ attempts, correct, lastCorrect, lastAt })

// ---------------------------------------------------------------------------------------------
// Ambito
// ---------------------------------------------------------------------------------------------

describe('ambito', () => {
  it('si legge dall\'URL: foglio, regione, altrimenti tutti i fogli', () => {
    expect(parseScope(new URLSearchParams())).toEqual({ kind: 'tutti' })
    expect(parseScope(new URLSearchParams('regione=passerini'))).toEqual({ kind: 'regione', course: 'passerini' })
    expect(parseScope(new URLSearchParams(`foglio=${M09}`))).toEqual({ kind: 'foglio', moduleId: M09 })
    // il foglio è più preciso della regione e vince
    expect(parseScope(new URLSearchParams(`regione=ricci&foglio=${M09}`))).toEqual({ kind: 'foglio', moduleId: M09 })
  })

  it('un valore che non esiste vale come tutti i fogli', () => {
    expect(parseScope(new URLSearchParams('regione=atlantide'))).toEqual({ kind: 'tutti' })
    expect(parseScope(new URLSearchParams('foglio=m99-niente'))).toEqual({ kind: 'tutti' })
  })

  it('si scrive nell\'URL senza toccare gli altri parametri', () => {
    const start = new URLSearchParams(`modo=esame&foglio=${M09}`)
    expect(writeScope(start, { kind: 'regione', course: 'ricci' }).toString()).toBe('modo=esame&regione=ricci')
    expect(writeScope(start, { kind: 'tutti' }).toString()).toBe('modo=esame')
    expect(parseScope(writeScope(start, { kind: 'foglio', moduleId: D05 }))).toEqual({ kind: 'foglio', moduleId: D05 })
    // l'originale non cambia
    expect(start.toString()).toBe(`modo=esame&foglio=${M09}`)
  })

  it('ha un nome leggibile', () => {
    expect(scopeLabel({ kind: 'tutti' })).toBe('Tutti i fogli')
    expect(scopeLabel({ kind: 'regione', course: 'passerini' })).toBe('Regione Passerini')
    expect(scopeLabel({ kind: 'foglio', moduleId: M09 })).toBe('Foglio 09 · Finestre di Parzen (kernel density estimation)')
  })

  it('contiene i fogli giusti, con la regione presa dal manifest', () => {
    expect(inScope({ kind: 'tutti' }, D05)).toBe(true)
    expect(inScope({ kind: 'regione', course: 'melgani' }, M09)).toBe(true)
    expect(inScope({ kind: 'regione', course: 'melgani' }, P03)).toBe(false)
    expect(inScope({ kind: 'foglio', moduleId: P03 }, P03)).toBe(true)
    expect(inScope({ kind: 'foglio', moduleId: P03 }, D05)).toBe(false)
    expect(sheetsOf({ kind: 'tutti' })).toHaveLength(manifest.length)
    expect(sheetsOf({ kind: 'regione', course: 'ricci' }).every((m) => m.course === 'ricci')).toBe(true)
    expect(sheetsOf({ kind: 'foglio', moduleId: M09 }).map((m) => m.id)).toEqual([M09])
    const deck = deckOf(modules)
    expect(entriesIn(deck, { kind: 'regione', course: 'passerini' }).map((e) => e.key)).toEqual([progressKey(P03, 'fc1'), progressKey(P03, 'fc2')])
  })
})

// ---------------------------------------------------------------------------------------------
// Flashcard
// ---------------------------------------------------------------------------------------------

describe('mazzo delle flashcard', () => {
  it('ha le chiavi dei progressi e dice da quale foglio viene ogni carta', () => {
    const deck = deckOf(modules)
    expect(deck).toHaveLength(6)
    expect(deck[0]).toMatchObject({ key: progressKey(M09, 'fc1'), origin: 'Foglio 09 · Finestre di Parzen (kernel density estimation)' })
    expect(deck.map((e) => moduleOfKey(e.key))).toEqual([M09, M09, M09, P03, P03, D05])
  })

  it('conta le carte in scadenza (già viste) e le nuove (mai viste)', () => {
    const deck = deckOf(modules)
    const srs: Record<string, SrsCard> = {
      [progressKey(M09, 'fc1')]: srsCard(NOW - DAY),
      [progressKey(M09, 'fc2')]: srsCard(NOW), // scade adesso: in scadenza
      [progressKey(M09, 'fc3')]: srsCard(NOW + DAY),
    }
    expect(cardCounts(deck, srs, NOW)).toEqual({ total: 6, due: 2, fresh: 3 })
    expect(cardCounts(entriesIn(deck, { kind: 'foglio', moduleId: M09 }), srs, NOW)).toEqual({ total: 3, due: 2, fresh: 0 })
    expect(cardCounts([], srs, NOW)).toEqual({ total: 0, due: 0, fresh: 0 })
  })

  it('la sessione mette prima le scadute dalla più vecchia, poi le nuove dei fogli già aperti, e si ferma al limite', () => {
    const deck = deckOf(modules)
    const srs: Record<string, SrsCard> = {
      [progressKey(P03, 'fc2')]: srsCard(NOW - 1),
      [progressKey(M09, 'fc3')]: srsCard(NOW - 5 * DAY),
      [progressKey(M09, 'fc1')]: srsCard(NOW + DAY), // non ancora
    }
    const keys = (q: DeckEntry[]) => q.map((e) => e.key)
    expect(keys(sessionQueue(deck, srs, NOW, Infinity))).toEqual([
      progressKey(M09, 'fc3'),
      progressKey(P03, 'fc2'),
      progressKey(M09, 'fc2'),
      progressKey(P03, 'fc1'),
      progressKey(D05, 'fc1'),
    ])
    // il foglio di deep learning è già aperto: le sue nuove passano davanti alle altre nuove
    expect(keys(sessionQueue(deck, srs, NOW, Infinity, new Set([D05])))).toEqual([
      progressKey(M09, 'fc3'),
      progressKey(P03, 'fc2'),
      progressKey(D05, 'fc1'),
      progressKey(M09, 'fc2'),
      progressKey(P03, 'fc1'),
    ])
    expect(keys(sessionQueue(deck, srs, NOW, 3))).toEqual([progressKey(M09, 'fc3'), progressKey(P03, 'fc2'), progressKey(M09, 'fc2')])
  })

  it('i fogli già aperti sono quelli con un rilievo cominciato', () => {
    const p = (status: ModuleProgress['status']): ModuleProgress => ({ status, sections: [], lastSection: null, lastVisited: 0 })
    expect(startedSheets({ [M09]: p('in-corso'), [P03]: p('da-iniziare'), [D05]: p('completato') })).toEqual(new Set([M09, D05]))
  })

  it('"ripassa comunque" prende prima le carte che tornano prima', () => {
    const deck = deckOf([modules[0]])
    const srs: Record<string, SrsCard> = {
      [progressKey(M09, 'fc1')]: srsCard(NOW + 9 * DAY),
      [progressKey(M09, 'fc2')]: srsCard(NOW + DAY),
      [progressKey(M09, 'fc3')]: srsCard(NOW + 3 * DAY),
    }
    expect(soonestFirst(deck, srs, 2).map((e) => e.key)).toEqual([progressKey(M09, 'fc2'), progressKey(M09, 'fc3')])
    expect(soonestFirst(deck, srs, Infinity)).toHaveLength(3)
  })

  it('il bilancio per foglio conta le carte ripassate e quelle da rivedere (votate "non la sapevo")', () => {
    const queue = deckOf(modules).filter((e) => moduleOfKey(e.key) !== D05)
    const srs: Record<string, SrsCard> = {
      [progressKey(M09, 'fc1')]: srsCard(NOW + DAY, 0),
      [progressKey(M09, 'fc2')]: srsCard(NOW + DAY, 1),
      [progressKey(M09, 'fc3')]: srsCard(NOW + 6 * DAY, 2),
      [progressKey(P03, 'fc1')]: srsCard(NOW + DAY, 0),
      [progressKey(P03, 'fc2')]: srsCard(NOW + DAY, 0),
    }
    expect(tallyBySheet(queue, srs)).toEqual([
      { moduleId: M09, reviewed: 3, missed: 1 },
      { moduleId: P03, reviewed: 2, missed: 2 },
    ])
  })
})

// ---------------------------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------------------------

describe('estrazione delle domande', () => {
  const pool = quizOf(modules)
  const keys = (q: QuizEntry[]) => q.map((e) => e.key)

  it('le domande hanno le chiavi dei progressi e il foglio di origine', () => {
    expect(pool).toHaveLength(30)
    expect(pool[10]).toMatchObject({ key: progressKey(P03, 'q1'), origin: 'Foglio 25 · Reti bayesiane: definizione e indipendenze' })
  })

  it('stesso seme, stessa estrazione; semi diversi, estrazioni diverse', () => {
    expect(keys(drawQuiz(pool, 9, 42))).toEqual(keys(drawQuiz(pool, 9, 42)))
    const draws = new Set([1, 2, 3, 4, 5].map((seed) => keys(drawQuiz(pool, 9, seed)).join()))
    expect(draws.size).toBeGreaterThan(1)
  })

  it('estrae il numero chiesto, senza ripetizioni, e al massimo tutte', () => {
    for (const seed of [1, 7, 99]) {
      const draw = drawQuiz(pool, 12, seed)
      expect(draw).toHaveLength(12)
      expect(new Set(keys(draw)).size).toBe(12)
    }
    const all = drawQuiz(pool, Infinity, 3)
    expect(all).toHaveLength(30)
    expect([...keys(all)].sort()).toEqual([...keys(pool)].sort())
    expect(drawQuiz([], 10, 1)).toEqual([])
  })

  it('divide le domande fra i fogli in parti uguali', () => {
    for (const seed of [1, 2, 3, 11, 12345]) {
      const count = (n: number) => {
        const per = new Map<string, number>()
        for (const e of drawQuiz(pool, n, seed)) per.set(moduleOfKey(e.key), (per.get(moduleOfKey(e.key)) ?? 0) + 1)
        return [...per.values()].sort()
      }
      expect(count(6)).toEqual([2, 2, 2])
      expect(count(7)).toEqual([2, 2, 3])
    }
  })

  it('un foglio con poche domande cede il posto agli altri', () => {
    const uneven = quizOf([mod(M09, 'melgani', 0, 1), mod(P03, 'passerini', 0, 10)])
    const draw = drawQuiz(uneven, 5, 8)
    expect(draw.filter((e) => moduleOfKey(e.key) === M09)).toHaveLength(1)
    expect(draw.filter((e) => moduleOfKey(e.key) === P03)).toHaveLength(4)
  })
})

describe('errori da ripassare', () => {
  const pool = quizOf([modules[0]])
  const k = (id: string) => progressKey(M09, id)
  const stats: Record<string, QuizStat> = {
    [k('q1')]: stat(1, 1, true),
    [k('q2')]: stat(4, 1, false, NOW - 2 * DAY), // 25%
    [k('q3')]: stat(2, 1, false, NOW - DAY), // 50%
    [k('q4')]: stat(2, 0, false, NOW - DAY), // 0%
    [k('q5')]: stat(3, 2, true), // sbagliata una volta, poi giusta: non è più un errore
    [k('q6')]: stat(4, 1, false, NOW - 3 * DAY), // 25%, più vecchia di q2
  }

  it('sono le domande sbagliate l\'ultima volta, dalla peggiore; a parità, la più vecchia', () => {
    expect(mistakesOf(pool, stats).map((e) => e.key)).toEqual([k('q4'), k('q6'), k('q2'), k('q3')])
  })

  it('il ripasso prende le peggiori, in un ordine mescolato che dipende dal seme', () => {
    const draw = drawMistakes(mistakesOf(pool, stats), 3, 5)
    expect([...draw.map((e) => e.key)].sort()).toEqual([k('q2'), k('q4'), k('q6')].sort())
    expect(draw.map((e) => e.key)).toEqual(drawMistakes(mistakesOf(pool, stats), 3, 5).map((e) => e.key))
    expect(drawMistakes(mistakesOf(pool, stats), Infinity, 5)).toHaveLength(4)
  })

  it('il bilancio conta domande, provate, tentativi, giuste e errori aperti', () => {
    expect(quizTally(pool, stats)).toEqual({ total: 10, tried: 6, attempts: 16, correct: 6, lastRight: 2, mistakes: 4, lastAt: NOW })
    expect(quizTally([], stats)).toEqual({ total: 0, tried: 0, attempts: 0, correct: 0, lastRight: 0, mistakes: 0, lastAt: 0 })
    const bySheet = quizTallyBySheet(modules, stats)
    expect([...bySheet.keys()]).toEqual([M09, P03, D05])
    expect(bySheet.get(M09)?.mistakes).toBe(4)
    expect(bySheet.get(P03)).toEqual({ total: 10, tried: 0, attempts: 0, correct: 0, lastRight: 0, mistakes: 0, lastAt: 0 })
  })

  it('le percentuali sono intere, e nulle senza tentativi', () => {
    expect(percent(6, 16)).toBe(38)
    expect(percent(0, 0)).toBeNull()
  })
})

describe('grandezza della sessione', () => {
  it('offre solo i passi più piccoli di ciò che c\'è, più "tutte"', () => {
    expect(sizeChoices([10, 20, 50], 35)).toEqual(['10', '20', 'tutte'])
    expect(sizeChoices([10, 20, 50], 10)).toEqual(['tutte'])
    expect(sizeChoices([5, 10], 0)).toEqual(['tutte'])
  })

  it('la scelta preferita resta se c\'è, altrimenti diventa "tutte"', () => {
    expect(pickSize('20', ['10', '20', 'tutte'])).toBe('20')
    expect(pickSize('50', ['10', '20', 'tutte'])).toBe('tutte')
    expect(sizeLimit('20')).toBe(20)
    expect(sizeLimit('tutte')).toBe(Infinity)
  })
})

describe('modo della prova', () => {
  it("si legge dall'URL; senza o sconosciuto è l'allenamento", () => {
    expect(parseMode(new URLSearchParams())).toBe('allenamento')
    expect(parseMode(new URLSearchParams('modo=esame'))).toBe('esame')
    expect(parseMode(new URLSearchParams('modo=errori'))).toBe('errori')
    expect(parseMode(new URLSearchParams('modo=torneo'))).toBe('allenamento')
  })

  it("si scrive nell'URL; l'allenamento, che è il modo predefinito, non si scrive", () => {
    const start = new URLSearchParams('regione=ricci')
    expect(writeMode(start, 'esame').toString()).toBe('regione=ricci&modo=esame')
    expect(writeMode(new URLSearchParams('modo=esame&regione=ricci'), 'allenamento').toString()).toBe('regione=ricci')
  })
})

describe('dove, in una frase', () => {
  it('dice l\'ambito come complemento di luogo', () => {
    expect(scopeWhere({ kind: 'tutti' })).toBe("in tutto l'atlante")
    expect(scopeWhere({ kind: 'regione', course: 'ricci' })).toBe('nella regione Ricci')
    expect(scopeWhere({ kind: 'foglio', moduleId: M09 })).toBe('nel foglio 09')
  })
})

describe('carte in arrivo', () => {
  it('conta per giorno di calendario le carte già viste che tornano; oggi comprende le scadute', () => {
    const deck = deckOf([mod(M09, 'melgani', 6, 0)])
    const at = (d: number, h: number) => new Date(2026, 8, 24 + d, h, 0, 0).getTime()
    const srs: Record<string, SrsCard> = {
      [progressKey(M09, 'fc1')]: srsCard(at(-1, 9)), // ieri: oggi
      [progressKey(M09, 'fc2')]: srsCard(at(0, 23)), // stasera: oggi
      [progressKey(M09, 'fc3')]: srsCard(at(1, 8)), // domani
      [progressKey(M09, 'fc4')]: srsCard(at(6, 12)), // fra sei giorni
      [progressKey(M09, 'fc5')]: srsCard(at(8, 12)), // oltre la settimana
      // fc6 mai vista: è nuova, non torna
    }
    const days = forecast(deck, srs, NOW)
    expect(days.map((d) => d.count)).toEqual([2, 1, 0, 0, 0, 0, 1])
    expect(days[0].start).toBe(new Date(2026, 8, 24).getTime())
    expect(days[6].start).toBe(new Date(2026, 8, 30).getTime())
    expect(forecast(deck, srs, NOW, 3).map((d) => d.count)).toEqual([2, 1, 0])
  })
})
