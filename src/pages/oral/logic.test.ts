import { describe, expect, it } from 'vitest'
import { examBank, getBankQuestion } from '../../content/exam-bank'
import type { ExamQuestion, ModuleData } from '../../content/types'
import { progressKey } from '../../store/progress'
import type { ExamEntry } from '../../store/progress'
import { bankItemKey, bankStats, buildPool, describeKey, drawSession, historyOf, poolSize, sheetFor, weightOf } from './logic'
import type { OralItem } from './logic'

const q = (id: string, extra: Partial<ExamQuestion> = {}): ExamQuestion => ({
  id,
  q: `Domanda ${id}`,
  qEn: `Question ${id}`,
  prof: 'Melgani',
  fromBank: false,
  answer: 'Risposta',
  checklist: [],
  followUps: [],
  ...extra,
})

/** Solo i campi che il simulatore legge; il resto del foglio non serve qui. */
const sheet = (id: string, course: ModuleData['course'], exam: ExamQuestion[]) => ({ id, course, title: `Foglio ${id}`, exam }) as unknown as ModuleData

const PARZEN = sheet('m09-parzen-windows', 'melgani', [
  q('or-banca-1', { fromBank: true, bankText: getBankQuestion('mel-03')!.text }),
  q('or-libera'),
])
const SVM = sheet('p09-svm-soft-margin', 'passerini', [q('svm-1', { prof: 'Passerini' })])
const SHEETS = [PARZEN, SVM]

const DAY = 86_400_000
const NOW = 100 * DAY

describe('pool delle domande', () => {
  it('in modalità banca prende le domande della parte e le collega alla domanda del foglio pronto', () => {
    const pool = buildPool('banca', 'melgani', SHEETS)
    expect(pool).toHaveLength(examBank.filter((b) => b.part === 'Melgani').length)
    const parzen = pool.find((i) => i.bank?.id === 'mel-03')!
    expect(parzen.sheet?.moduleId).toBe('m09-parzen-windows')
    expect(parzen.sheet?.question.id).toBe('or-banca-1')
    expect(parzen.recordModule).toBe('m09-parzen-windows')
    expect(parzen.keys).toEqual([bankItemKey(getBankQuestion('mel-03')!), progressKey('m09-parzen-windows', 'or-banca-1')])
    const other = pool.find((i) => i.bank?.id === 'mel-01')!
    expect(other.sheet).toBeUndefined()
    expect(other.recordModule).toBe('m21-errore-generalizzazione')
    expect(other.question.id).toBe('banca-mel-01')
    expect(other.question.qEn).toBe(getBankQuestion('mel-01')!.textEn)
  })

  it('in modalità fogli prende tutte le domande dei fogli pronti della parte', () => {
    expect(buildPool('fogli', 'melgani', SHEETS).map((i) => i.id)).toEqual(['foglio:m09-parzen-windows:or-banca-1', 'foglio:m09-parzen-windows:or-libera'])
    expect(buildPool('fogli', 'passerini', SHEETS)).toHaveLength(1)
    expect(buildPool('fogli', 'ricci', SHEETS)).toHaveLength(0)
    expect(buildPool('fogli', 'mista', SHEETS)).toHaveLength(3)
    const fromBank = buildPool('fogli', 'melgani', SHEETS)[0]
    expect(fromBank.bank?.id).toBe('mel-03')
    expect(fromBank.keys).toContain(bankItemKey(getBankQuestion('mel-03')!))
  })

  it('la banca mista ha tutte le 88 domande; poolSize conta senza costruire le schede', () => {
    expect(buildPool('banca', 'mista', [])).toHaveLength(examBank.length)
    expect(poolSize('banca', 'ricci', SHEETS)).toBe(41)
    expect(poolSize('fogli', 'melgani', SHEETS)).toBe(2)
  })

  it('sheetFor preferisce i fogli indicati dalla banca, nell\'ordine', () => {
    const copy = sheet('m08-non-parametrica-knn', 'melgani', [q('knn-b', { fromBank: true, bankText: getBankQuestion('mel-03')!.text })])
    // mel-03 indica prima m09 e poi m08
    expect(sheetFor(getBankQuestion('mel-03')!, [copy, PARZEN])?.moduleId).toBe('m09-parzen-windows')
    expect(sheetFor(getBankQuestion('mel-01')!, SHEETS)).toBeUndefined()
  })
})

describe('storico e pesi', () => {
  const entries: ExamEntry[] = [
    { key: 'a', score: 1, at: NOW - 3 * DAY },
    { key: 'b', score: 3, at: NOW - 2 * DAY },
    { key: 'a', score: 2, at: NOW - DAY },
  ]

  it('unisce lo storico di più chiavi, dall\'ultima simulazione', () => {
    expect(historyOf(entries, ['a'])).toEqual({ attempts: 2, last: 2, lastAt: NOW - DAY })
    expect(historyOf(entries, ['a', 'b'])).toEqual({ attempts: 3, last: 2, lastAt: NOW - DAY })
    expect(historyOf(entries, ['z'])).toEqual({ attempts: 0, last: null, lastAt: 0 })
  })

  it('pesa di più le domande mai provate, poi quelle andate peggio, e riporta su quelle lasciate da tempo', () => {
    const never = weightOf({ attempts: 0, last: null, lastAt: 0 }, NOW)
    const bad = weightOf({ attempts: 1, last: 0, lastAt: NOW }, NOW)
    const good = weightOf({ attempts: 1, last: 3, lastAt: NOW }, NOW)
    const goodOld = weightOf({ attempts: 1, last: 3, lastAt: NOW - 20 * DAY }, NOW)
    const goodMany = weightOf({ attempts: 4, last: 3, lastAt: NOW }, NOW)
    expect(never).toBeGreaterThan(bad)
    expect(bad).toBeGreaterThan(good)
    expect(goodOld).toBeGreaterThan(good)
    expect(good).toBeGreaterThan(goodMany)
    expect(goodMany).toBeGreaterThan(0)
  })
})

describe('estrazione con seed', () => {
  const pool = buildPool('banca', 'mista', SHEETS)

  it('stesso seed, stesse domande, nello stesso ordine; seed diverso, estrazione diversa', () => {
    const a = drawSession(pool, [], 5, 42, NOW).map((i) => i.id)
    const b = drawSession(pool, [], 5, 42, NOW).map((i) => i.id)
    const c = drawSession(pool, [], 5, 7, NOW).map((i) => i.id)
    expect(a).toHaveLength(5)
    expect(new Set(a).size).toBe(5)
    expect(a).toEqual(b)
    expect(c).not.toEqual(a)
  })

  it('non estrae più domande di quante ce ne siano, e con un pool vuoto non estrae nulla', () => {
    const two: OralItem[] = pool.slice(0, 2)
    expect(drawSession(two, [], 5, 1, NOW)).toHaveLength(2)
    expect(drawSession([], [], 3, 1, NOW)).toEqual([])
  })

  it('preferisce le domande meno ripassate', () => {
    const [x, y] = pool.slice(0, 2)
    // x è stata ripassata tre volte con il massimo, y mai
    const entries: ExamEntry[] = [1, 2, 3].map((n) => ({ key: x.keys[0], score: 3, at: NOW - n }))
    let firstY = 0
    for (let seed = 1; seed <= 400; seed++) if (drawSession([x, y], entries, 1, seed, NOW)[0].id === y.id) firstY++
    expect(firstY).toBeGreaterThan(300)
  })
})

describe('descrizione delle chiavi dello storico', () => {
  it('riconosce le domande della banca, quelle dei fogli e quelle sconosciute', () => {
    expect(describeKey(bankItemKey(getBankQuestion('dl-29')!), SHEETS)).toMatchObject({ kind: 'banca', course: 'ricci', bank: { id: 'dl-29' } })
    expect(describeKey(progressKey('m09-parzen-windows', 'or-libera'), SHEETS)).toMatchObject({ kind: 'foglio', course: 'melgani', text: 'Domanda or-libera' })
    expect(describeKey(progressKey('m05-max-likelihood', 'boh'), SHEETS)).toMatchObject({ kind: 'sconosciuta', course: 'melgani' })
  })

  it('bankStats conta le domande della banca già simulate, direttamente o dal loro foglio', () => {
    const entries: ExamEntry[] = [
      { key: progressKey('m09-parzen-windows', 'or-banca-1'), score: 2, at: NOW },
      { key: bankItemKey(getBankQuestion('dl-01')!), score: 1, at: NOW },
    ]
    const stats = bankStats(buildPool('banca', 'mista', SHEETS), entries)
    expect(stats.get('mel-03')).toMatchObject({ attempts: 1, last: 2 })
    expect(stats.get('dl-01')).toMatchObject({ attempts: 1, last: 1 })
    expect(stats.get('mel-01')).toMatchObject({ attempts: 0 })
  })
})

// ---------------------------------------------------------------------------------------------
// Regressioni dalla revisione
// ---------------------------------------------------------------------------------------------

describe('regressioni: domanda inglese, doppioni e storico condiviso', () => {
  // la stessa domanda della banca (mel-03) coperta da due fogli pronti, come m09 e m03 nei dati veri
  const M03 = sheet('m03-stima-intro-parametrica', 'melgani', [q('or-banca-4', { fromBank: true, bankText: getBankQuestion('mel-03')!.text }), q('or-m03-libera')])
  const BOTH = [M03, PARZEN]

  it('una domanda della banca senza foglio pronto mostra la domanda inglese, e il resoconto verbatim a parte', () => {
    const bank = getBankQuestion('mel-01')!
    const item = buildPool('banca', 'melgani', []).find((i) => i.bank?.id === 'mel-01')!
    expect(item.question.qEn).toBe(bank.textEn)
    expect(item.question.qEn).not.toMatch(/I told him/)
    expect(item.question.bankText).toBe(bank.text)
  })

  it('in modalità fogli nessuna estrazione ha due volte la stessa domanda della banca', () => {
    const pool = buildPool('fogli', 'melgani', BOTH)
    expect(pool.filter((i) => i.bankIds.includes('mel-03'))).toHaveLength(2)
    for (let seed = 1; seed <= 200; seed++) {
      const drawn = drawSession(pool, [], 4, seed, NOW)
      const banks = drawn.flatMap((i) => i.bankIds)
      expect(new Set(banks).size, `seme ${seed}`).toBe(banks.length)
    }
  })

  it('il voto dato da un foglio non principale conta per la domanda della banca e per tutte le sue copie', () => {
    const entries: ExamEntry[] = [{ key: progressKey('m03-stima-intro-parametrica', 'or-banca-4'), score: 3, at: NOW }]
    // quadro della banca (modalità banca): mel-03 risulta provata
    expect(bankStats(buildPool('banca', 'mista', BOTH), entries).get('mel-03')).toMatchObject({ attempts: 1, last: 3 })
    // modalità fogli: anche la copia in m09 conta la simulazione fatta da m03
    const copy = buildPool('fogli', 'melgani', BOTH).find((i) => i.id === 'foglio:m09-parzen-windows:or-banca-1')!
    expect(historyOf(entries, copy.keys)).toMatchObject({ attempts: 1, last: 3 })
    // e il voto dato dalla banca senza foglio conta per le domande dei fogli che la coprono
    const fromBank: ExamEntry[] = [{ key: bankItemKey(getBankQuestion('mel-03')!), score: 1, at: NOW }]
    expect(historyOf(fromBank, copy.keys)).toMatchObject({ attempts: 1, last: 1 })
  })
})
