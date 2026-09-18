import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { review } from '../lib/srs'
import {
  MAX_EXAM_HISTORY,
  PROGRESS_KEY,
  PROGRESS_VERSION,
  ProgressImportError,
  activeStreak,
  dayKey,
  initialProgress,
  migrateProgress,
  moduleOfKey,
  progressKey,
  selectProgressData,
  touchStreak,
  useProgress,
} from './progress'
import type { ProgressBackup, ProgressData } from './progress'

/** Ore locali di un giorno di settembre 2026: i test non dipendono dal fuso orario della macchina. */
const giorno = (d: number, h = 10, min = 0) => new Date(2026, 8, d, h, min).getTime()
const T0 = giorno(14)
const MOD = 'm09-parzen-windows'
const CARD = progressKey(MOD, 'fc01')
const QUIZ = progressKey(MOD, 'q01')
const EXAM = progressKey(MOD, 'ex01')

const azioni = () => useProgress.getState()
const dati = (): ProgressData => selectProgressData(useProgress.getState())

/** Usa tutte le azioni almeno una volta. */
function popola() {
  const a = azioni()
  a.markSection(MOD, 'idea-di-base', giorno(14))
  a.markSection(MOD, 'scelta-di-h', giorno(15))
  a.setModuleStatus('m01-intro', 'completato')
  a.gradeCard(CARD, 4, giorno(15))
  a.gradeCard(progressKey(MOD, 'fc02'), 1, giorno(15))
  a.recordQuiz(QUIZ, true, giorno(15))
  a.recordQuiz(QUIZ, false, giorno(16))
  a.recordExam({ key: EXAM, score: 2, seconds: 95 }, giorno(16))
  a.completeChallenge('parzen-kernel-width', giorno(16))
  a.toggleBookmark(`${MOD}#scelta-di-h`)
  a.setNote(`formula:${MOD}:f01`, 'ricordare il fattore $1/h^d$')
}

beforeEach(() => {
  localStorage.clear()
  azioni().reset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('stato iniziale e chiavi', () => {
  it('parte vuoto', () => {
    expect(dati()).toEqual({
      modules: {},
      flashcards: {},
      quiz: {},
      exam: [],
      challenges: {},
      bookmarks: [],
      notes: {},
      streak: { current: 0, best: 0, lastDay: null },
    })
  })

  it('initialProgress restituisce ogni volta oggetti nuovi', () => {
    expect(initialProgress()).toEqual(initialProgress())
    expect(initialProgress().modules).not.toBe(initialProgress().modules)
  })

  it('progressKey e moduleOfKey sono inverse sul modulo', () => {
    expect(CARD).toBe('m09-parzen-windows:fc01')
    expect(moduleOfKey(CARD)).toBe(MOD)
  })
})

describe('azioni', () => {
  it('gradeCard aggiorna la carta con review()', () => {
    azioni().gradeCard(CARD, 4, T0)
    const prima = review(undefined, 4, T0)
    expect(dati().flashcards[CARD]).toEqual(prima)

    azioni().gradeCard(CARD, 5, prima.due)
    expect(dati().flashcards[CARD]).toEqual(review(prima, 5, prima.due))
    expect(dati().flashcards[CARD].interval).toBe(6)
  })

  it('gradeCard senza now usa l’ora corrente', () => {
    const prima = Date.now()
    azioni().gradeCard(CARD, 4)
    expect(dati().flashcards[CARD].due).toBeGreaterThanOrEqual(prima + 86_400_000)
  })

  it('markSection segna la sezione una sola volta e porta il modulo in corso', () => {
    azioni().markSection(MOD, 'idea-di-base', giorno(14))
    azioni().markSection(MOD, 'idea-di-base', giorno(14, 11))
    azioni().markSection(MOD, 'scelta-di-h', giorno(14, 12))
    expect(dati().modules[MOD]).toEqual({
      status: 'in-corso',
      sections: ['idea-di-base', 'scelta-di-h'],
      lastSection: 'scelta-di-h',
      lastVisited: giorno(14, 12),
    })
  })

  it('markSection non declassa un modulo completato', () => {
    azioni().setModuleStatus(MOD, 'completato')
    azioni().markSection(MOD, 'idea-di-base', T0)
    expect(dati().modules[MOD].status).toBe('completato')
  })

  it('setModuleStatus crea il modulo se manca e conserva le sezioni lette', () => {
    azioni().setModuleStatus('m01-intro', 'da-ripassare')
    expect(dati().modules['m01-intro']).toEqual({ status: 'da-ripassare', sections: [], lastSection: null, lastVisited: 0 })

    azioni().markSection(MOD, 'idea-di-base', T0)
    azioni().setModuleStatus(MOD, 'completato')
    expect(dati().modules[MOD].sections).toEqual(['idea-di-base'])
    expect(dati().modules[MOD].lastVisited).toBe(T0)
  })

  it('recordQuiz conta tentativi e risposte giuste', () => {
    azioni().recordQuiz(QUIZ, true, giorno(14))
    azioni().recordQuiz(QUIZ, false, giorno(15))
    azioni().recordQuiz(QUIZ, true, giorno(16))
    expect(dati().quiz[QUIZ]).toEqual({ attempts: 3, correct: 2, lastCorrect: true, lastAt: giorno(16) })
  })

  it('recordExam accoda la simulazione con il suo istante', () => {
    azioni().recordExam({ key: EXAM, score: 3, seconds: 120 }, giorno(14))
    azioni().recordExam({ key: EXAM, score: 1 }, giorno(15))
    expect(dati().exam).toEqual([
      { key: EXAM, score: 3, seconds: 120, at: giorno(14) },
      { key: EXAM, score: 1, at: giorno(15) },
    ])
  })

  it('recordExam tiene solo le ultime MAX_EXAM_HISTORY simulazioni', () => {
    const pieno = Array.from({ length: MAX_EXAM_HISTORY }, (_, i) => ({ key: EXAM, score: 0 as const, at: i }))
    useProgress.setState({ exam: pieno })
    azioni().recordExam({ key: EXAM, score: 3 }, T0)
    expect(dati().exam).toHaveLength(MAX_EXAM_HISTORY)
    expect(dati().exam[0].at).toBe(1)
    expect(dati().exam.at(-1)).toEqual({ key: EXAM, score: 3, at: T0 })
  })

  it('completeChallenge conserva la data del primo completamento', () => {
    azioni().completeChallenge('parzen-kernel-width', giorno(14))
    azioni().completeChallenge('parzen-kernel-width', giorno(15))
    expect(dati().challenges).toEqual({ 'parzen-kernel-width': giorno(14) })
  })

  it('toggleBookmark aggiunge e poi toglie', () => {
    azioni().toggleBookmark('a')
    azioni().toggleBookmark('b')
    expect(dati().bookmarks).toEqual(['a', 'b'])
    azioni().toggleBookmark('a')
    expect(dati().bookmarks).toEqual(['b'])
  })

  it('setNote scrive, sovrascrive e con testo vuoto cancella', () => {
    azioni().setNote('t', 'prima')
    azioni().setNote('t', 'seconda')
    expect(dati().notes).toEqual({ t: 'seconda' })
    azioni().setNote('t', '   ')
    expect(dati().notes).toEqual({})
  })

  it('le azioni non modificano gli oggetti dello stato precedente', () => {
    popola()
    const prima = dati()
    const copia = structuredClone(prima)
    popola()
    azioni().toggleBookmark('altro')
    expect(prima).toEqual(copia)
  })

  it('reset svuota tutto', () => {
    popola()
    expect(dati()).not.toEqual(initialProgress())
    azioni().reset()
    expect(dati()).toEqual(initialProgress())
  })
})

describe('streak', () => {
  it('più attività nello stesso giorno contano una volta', () => {
    azioni().gradeCard(CARD, 4, giorno(14, 9))
    azioni().recordQuiz(QUIZ, true, giorno(14, 22))
    expect(dati().streak).toEqual({ current: 1, best: 1, lastDay: '2026-09-14' })
  })

  it('giorni consecutivi allungano la serie, anche a cavallo della mezzanotte', () => {
    azioni().gradeCard(CARD, 4, giorno(14, 23, 50))
    azioni().recordQuiz(QUIZ, true, giorno(15, 0, 10))
    azioni().markSection(MOD, 'idea-di-base', giorno(16))
    expect(dati().streak).toEqual({ current: 3, best: 3, lastDay: '2026-09-16' })
  })

  it('un giorno saltato fa ripartire la serie da 1 e conserva il record', () => {
    azioni().gradeCard(CARD, 4, giorno(14))
    azioni().gradeCard(CARD, 4, giorno(15))
    azioni().gradeCard(CARD, 4, giorno(16))
    azioni().gradeCard(CARD, 4, giorno(18))
    expect(dati().streak).toEqual({ current: 1, best: 3, lastDay: '2026-09-18' })

    azioni().gradeCard(CARD, 4, giorno(19))
    expect(dati().streak).toEqual({ current: 2, best: 3, lastDay: '2026-09-19' })
  })

  it.each<[string, () => void]>([
    ['markSection', () => azioni().markSection(MOD, 's', T0)],
    ['gradeCard', () => azioni().gradeCard(CARD, 3, T0)],
    ['recordQuiz', () => azioni().recordQuiz(QUIZ, false, T0)],
    ['recordExam', () => azioni().recordExam({ key: EXAM, score: 0 }, T0)],
    ['completeChallenge', () => azioni().completeChallenge('w', T0)],
  ])('%s conta come studio', (_, azione) => {
    azione()
    expect(dati().streak).toEqual({ current: 1, best: 1, lastDay: '2026-09-14' })
  })

  it('segnalibri, note e stato del modulo non contano come studio', () => {
    azioni().toggleBookmark('a')
    azioni().setNote('a', 'x')
    azioni().setModuleStatus(MOD, 'completato')
    expect(dati().streak).toEqual({ current: 0, best: 0, lastDay: null })
  })

  it('touchStreak: fine mese e cambio dell’ora non spezzano la serie', () => {
    let s = touchStreak({ current: 0, best: 0, lastDay: null }, new Date(2026, 8, 30, 21).getTime())
    s = touchStreak(s, new Date(2026, 9, 1, 8).getTime())
    expect(s).toEqual({ current: 2, best: 2, lastDay: '2026-10-01' })

    // in Europa l'ora solare torna il 25 ottobre 2026: quel giorno dura 25 ore
    s = touchStreak({ current: 4, best: 4, lastDay: '2026-10-24' }, new Date(2026, 9, 25, 23, 30).getTime())
    s = touchStreak(s, new Date(2026, 9, 26, 0, 15).getTime())
    expect(s).toEqual({ current: 6, best: 6, lastDay: '2026-10-26' })
  })

  it('touchStreak: se l’orologio torna indietro la serie non cambia', () => {
    const s = { current: 3, best: 5, lastDay: '2026-09-16' }
    expect(touchStreak(s, giorno(15))).toBe(s)
    expect(touchStreak(s, giorno(16, 23))).toBe(s)
  })

  it('activeStreak vale oggi e domani, poi scende a 0', () => {
    const s = { current: 3, best: 3, lastDay: dayKey(giorno(16)) }
    expect(activeStreak(s, giorno(16, 23))).toBe(3)
    expect(activeStreak(s, giorno(17, 23))).toBe(3)
    expect(activeStreak(s, giorno(18, 0, 1))).toBe(0)
    expect(activeStreak({ current: 0, best: 0, lastDay: null }, T0)).toBe(0)
  })
})

describe('export e import', () => {
  it('exportJson produce un backup con app, versione e data', () => {
    popola()
    const backup = JSON.parse(azioni().exportJson(T0)) as ProgressBackup
    expect(backup.app).toBe('ml-study-hub')
    expect(backup.version).toBe(PROGRESS_VERSION)
    expect(backup.exportedAt).toBe(T0)
    expect(backup.state).toEqual(dati())
  })

  it('exportJson → reset → importJson ripristina lo stesso stato', () => {
    popola()
    const prima = dati()
    const json = azioni().exportJson()

    azioni().reset()
    expect(dati()).toEqual(initialProgress())

    azioni().importJson(json)
    expect(dati()).toEqual(prima)
  })

  it('importJson sostituisce i progressi correnti, non li fonde', () => {
    azioni().toggleBookmark('solo-nel-backup')
    const json = azioni().exportJson()
    azioni().reset()
    azioni().toggleBookmark('solo-adesso')
    azioni().gradeCard(CARD, 4, T0)

    azioni().importJson(json)
    expect(dati().bookmarks).toEqual(['solo-nel-backup'])
    expect(dati().flashcards).toEqual({})
  })

  it('importJson scarta i campi sconosciuti', () => {
    popola()
    const backup = JSON.parse(azioni().exportJson()) as ProgressBackup
    const json = JSON.stringify({ ...backup, state: { ...backup.state, intruso: 1 } })
    azioni().importJson(json)
    expect(useProgress.getState()).not.toHaveProperty('intruso')
    expect(dati()).toEqual(backup.state)
  })

  it('importJson accetta un backup di una versione precedente passando da migrateProgress', () => {
    popola()
    const backup = JSON.parse(azioni().exportJson()) as ProgressBackup
    azioni().reset()
    azioni().importJson(JSON.stringify({ ...backup, version: 0 }))
    expect(dati()).toEqual(backup.state)
  })

  describe('input non validi', () => {
    const valido = () => JSON.parse(azioni().exportJson(T0)) as ProgressBackup
    const conStato = (patch: Record<string, unknown>) => () => {
      const b = valido()
      return JSON.stringify({ ...b, state: { ...b.state, ...patch } })
    }
    const senza = (chiave: keyof ProgressData) => () => {
      const b = valido()
      const state: Partial<ProgressData> = { ...b.state }
      delete state[chiave]
      return JSON.stringify({ ...b, state })
    }

    it.each<[string, () => string]>([
      ['testo che non è JSON', () => '{"app": "ml-study-hub", "state": {"flash'],
      ['stringa vuota', () => ''],
      ['JSON null', () => 'null'],
      ['JSON array', () => '[]'],
      ['JSON numero', () => '42'],
      ['oggetto di un’altra app', () => JSON.stringify({ ...valido(), app: 'altro' })],
      ['senza version', () => JSON.stringify({ app: 'ml-study-hub', state: valido().state })],
      ['versione più recente di quella supportata', () => JSON.stringify({ ...valido(), version: PROGRESS_VERSION + 1 })],
      ['senza state', () => JSON.stringify({ app: 'ml-study-hub', version: PROGRESS_VERSION })],
      ['state mancante di flashcards', senza('flashcards')],
      ['state mancante di streak', senza('streak')],
      ['modules con stato sconosciuto', conStato({ modules: { [MOD]: { status: 'boh', sections: [], lastSection: null, lastVisited: 0 } } })],
      ['modules con sections non stringhe', conStato({ modules: { [MOD]: { status: 'in-corso', sections: [1], lastSection: null, lastVisited: 0 } } })],
      ['flashcards come array', conStato({ flashcards: [] })],
      ['flashcards con ef stringa', conStato({ flashcards: { [CARD]: { ef: '2.5', interval: 1, reps: 1, due: 1 } } })],
      ['flashcards con campo mancante', conStato({ flashcards: { [CARD]: { ef: 2.5, interval: 1, reps: 1 } } })],
      ['quiz con più giuste che tentativi', conStato({ quiz: { [QUIZ]: { attempts: 1, correct: 2, lastCorrect: true, lastAt: 0 } } })],
      ['quiz con tentativi negativi', conStato({ quiz: { [QUIZ]: { attempts: -1, correct: 0, lastCorrect: false, lastAt: 0 } } })],
      ['exam non array', conStato({ exam: {} })],
      ['exam con voto fuori scala', conStato({ exam: [{ key: EXAM, score: 7, at: 0 }] })],
      ['challenges con data non numerica', conStato({ challenges: { w: 'ieri' } })],
      ['bookmarks non array', conStato({ bookmarks: 'a' })],
      ['notes con testo non stringa', conStato({ notes: { t: 5 } })],
      ['streak con giorno malformato', conStato({ streak: { current: 1, best: 1, lastDay: 'ieri' } })],
      ['streak con record minore della serie', conStato({ streak: { current: 5, best: 1, lastDay: '2026-09-14' } })],
    ])('rifiuta %s senza toccare lo stato', (_, crea) => {
      popola()
      const json = crea()
      const prima = dati()
      const salvato = localStorage.getItem(PROGRESS_KEY)

      expect(() => azioni().importJson(json)).toThrow(ProgressImportError)
      expect(dati()).toEqual(prima)
      expect(localStorage.getItem(PROGRESS_KEY)).toBe(salvato)
    })

    it('il messaggio dice dove sta l’errore', () => {
      popola()
      const json = conStato({ flashcards: { [CARD]: { ef: '2.5', interval: 1, reps: 1, due: 1 } } })()
      expect(() => azioni().importJson(json)).toThrow(/flashcards\["m09-parzen-windows:fc01"\]\.ef/)
    })
  })
})

describe('migrateProgress', () => {
  it('lascia invariato uno stato già alla versione corrente o più vecchio senza passi definiti', () => {
    popola()
    const stato = dati()
    expect(migrateProgress(stato, PROGRESS_VERSION)).toEqual(stato)
    expect(migrateProgress(stato, 0)).toEqual(stato)
  })
})

describe('persistenza', () => {
  it('salva in localStorage solo i dati, con chiave e versione previste', () => {
    expect(PROGRESS_KEY).toBe('ml-study-progress-v1')
    expect(PROGRESS_VERSION).toBe(1)
    popola()
    const salvato = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? 'null') as { state: ProgressData; version: number }
    expect(salvato.version).toBe(1)
    expect(Object.keys(salvato.state).sort()).toEqual(Object.keys(initialProgress()).sort())
    expect(salvato.state).toEqual(dati())
  })

  it('un nuovo avvio ritrova i progressi salvati', async () => {
    popola()
    vi.resetModules()
    const nuovo = await import('./progress')
    expect(nuovo.useProgress).not.toBe(useProgress)
    expect(nuovo.selectProgressData(nuovo.useProgress.getState())).toEqual(dati())
  })

  it('con localStorage illeggibile parte vuoto e completa comunque l’idratazione', async () => {
    localStorage.setItem(PROGRESS_KEY, '{"state": {"flash')
    vi.resetModules()
    const nuovo = await import('./progress')
    expect(nuovo.selectProgressData(nuovo.useProgress.getState())).toEqual(initialProgress())
    expect(nuovo.useProgress.persist.hasHydrated()).toBe(true)
  })

  it('con dati salvati in parte rovinati tiene le parti valide e azzera le altre', async () => {
    popola()
    const buono = dati()
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      version: PROGRESS_VERSION,
      state: { ...buono, flashcards: 'rotto', quiz: { [QUIZ]: { attempts: -1 } }, intruso: true },
    }))
    vi.resetModules()
    const nuovo = await import('./progress')
    expect(nuovo.selectProgressData(nuovo.useProgress.getState())).toEqual({ ...buono, flashcards: {}, quiz: {} })
    expect(nuovo.useProgress.getState()).not.toHaveProperty('intruso')
  })

  it('uno stato salvato con versione diversa passa da migrate e viene riscritto alla versione corrente', async () => {
    popola()
    const buono = dati()
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: 0, state: buono }))
    vi.resetModules()
    const nuovo = await import('./progress')
    expect(nuovo.selectProgressData(nuovo.useProgress.getState())).toEqual(buono)
    expect((JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? 'null') as { version: number }).version).toBe(PROGRESS_VERSION)
  })
})

describe('storage non disponibile', () => {
  function senzaRumore() {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    return () => {
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    }
  }

  /** Esegue fn con un localStorage globale sostituito, poi rimette quello di jsdom. */
  async function conLocalStorage(descrittore: PropertyDescriptor, fn: () => Promise<void>) {
    const originale = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, ...descrittore })
    try {
      await fn()
    } finally {
      if (originale) Object.defineProperty(globalThis, 'localStorage', originale)
      else delete (globalThis as { localStorage?: Storage }).localStorage
    }
  }

  async function storeNuovoFunziona() {
    const verifica = senzaRumore()
    vi.resetModules()
    const nuovo = await import('./progress')
    const s = nuovo.useProgress.getState()
    s.gradeCard(CARD, 4, T0)
    s.toggleBookmark('a')
    const json = s.exportJson(T0)
    s.reset()
    s.importJson(json)
    expect(nuovo.useProgress.getState().flashcards[CARD]).toEqual(review(undefined, 4, T0))
    expect(nuovo.useProgress.getState().bookmarks).toEqual(['a'])
    verifica()
  }

  it('se la scrittura lancia (quota piena) le azioni riescono e lo stato resta in memoria', () => {
    const verifica = senzaRumore()
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota piena', 'QuotaExceededError')
    })
    expect(() => popola()).not.toThrow()
    expect(setItem).toHaveBeenCalled()
    expect(dati().flashcards[CARD]).toEqual(review(undefined, 4, giorno(15)))
    expect(() => azioni().reset()).not.toThrow()
    expect(dati()).toEqual(initialProgress())
    verifica()
  })

  it('se la lettura lancia lo store nasce vuoto e funziona', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('negato', 'SecurityError')
    })
    await storeNuovoFunziona()
  })

  it('se accedere a localStorage lancia (cookie bloccati) lo store lavora in memoria', async () => {
    await conLocalStorage({ get() { throw new DOMException('negato', 'SecurityError') } }, storeNuovoFunziona)
  })

  it('se localStorage non esiste lo store lavora in memoria', async () => {
    await conLocalStorage({ value: undefined }, storeNuovoFunziona)
  })
})
