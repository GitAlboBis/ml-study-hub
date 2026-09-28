// Logica pura del simulatore dell'orale: quali domande si possono estrarre (banca d'esame e fogli pronti),
// lo storico delle simulazioni già fatte e l'estrazione pesata con seed. Niente React qui dentro: la pagina
// (OralSimulator.tsx) e i suoi pezzi la usano, logic.test.ts la prova da sola.
//
// Una domanda della banca senza foglio pronto diventa comunque una scheda d'orale (ExamCard): il testo
// italiano è textIt, quello inglese textEn (la domanda in seconda persona; il resoconto verbatim dello studente
// resta a parte, come "resoconto originale"), la risposta modello manca e al suo posto la pagina mostra i fogli
// di riferimento. Il voto si registra sotto il foglio principale della domanda (progressKey(moduleIds[0],
// 'banca-<id>')), così resta del foglio anche prima che il foglio sia pronto.
//
// Una domanda della banca può essere coperta da più fogli pronti (mel-03 sta in m03, m09, …): per lo storico
// sono la stessa domanda. Ogni voce porta quindi, fra le sue chiavi, quelle di tutte le schede che coprono le
// sue domande della banca (bankKeys), e un'estrazione non contiene mai due voci con la stessa domanda della
// banca (bankIds).
import { coversBankQuestion, examBank, getBankQuestion } from '../../content/exam-bank'
import type { BankPart, BankQuestion } from '../../content/exam-bank'
import { getModuleMeta } from '../../content/manifest'
import type { CourseId, ExamQuestion, ModuleData, Rich } from '../../content/types'
import { createRng } from '../../lib/rng'
import { moduleOfKey, progressKey } from '../../store/progress'
import type { ExamEntry } from '../../store/progress'
import type { ExamScore } from '../../components/practice/logic'

export type OralPart = CourseId | 'mista'
export type OralMode = 'banca' | 'fogli'

export const PART_ORDER: readonly OralPart[] = ['melgani', 'passerini', 'ricci', 'mista']
export const COURSE_OF_PART: Record<BankPart, CourseId> = { Melgani: 'melgani', Passerini: 'passerini', 'Deep Learning': 'ricci' }

/** Di che cosa parla ogni parte, in poche parole: sotto il nome della regione (Melgani, Passerini, Ricci). */
export const PART_WHAT: Record<OralPart, string> = {
  melgani: 'Stima, feature, classificazione',
  passerini: 'Reti bayesiane, SVM e kernel, RL',
  ricci: 'Deep learning',
  mista: 'Le tre parti insieme',
}

/** Una domanda d'orale di un foglio pronto. */
export interface SheetQuestion {
  moduleId: string
  question: ExamQuestion
}

/** Una voce che si può estrarre. */
export interface OralItem {
  /** 'banca:<id>' oppure 'foglio:<moduleId>:<examId>' */
  id: string
  course: CourseId
  /** la domanda della banca (in modalità fogli: la prima che la domanda del foglio copre) */
  bank?: BankQuestion
  /** la domanda del foglio pronto, con risposta modello e traccia */
  sheet?: SheetQuestion
  /** la domanda che la scheda mostra */
  question: ExamQuestion
  /** foglio sotto cui si registra il voto: la chiave è progressKey(recordModule, question.id) */
  recordModule: string
  /** chiavi dello storico che contano per questa voce: la sua e quelle di ogni copia della stessa domanda della banca */
  keys: string[]
  /** id delle domande della banca che la voce copre (vuoto per una domanda libera di un foglio) */
  bankIds: string[]
}

const BANK_PREFIX = 'banca-'

/** Chiave nei progressi di una domanda della banca provata senza il suo foglio. */
export const bankItemKey = (bank: BankQuestion) => progressKey(bank.moduleIds[0], `${BANK_PREFIX}${bank.id}`)

/** La scheda d'orale di una domanda della banca senza foglio pronto. */
export const bankOnlyQuestion = (bank: BankQuestion): ExamQuestion => ({
  id: `${BANK_PREFIX}${bank.id}`,
  q: bank.textIt,
  qEn: bank.textEn,
  prof: bank.prof,
  fromBank: true,
  bankText: bank.text,
  answer: '',
  checklist: [],
  followUps: [],
})

const inPart = (course: CourseId, part: OralPart) => part === 'mista' || course === part

function sheetQuestions(sheets: readonly ModuleData[]): SheetQuestion[] {
  return sheets.flatMap((s) => s.exam.map((question) => ({ moduleId: s.id, question })))
}

const covers = (sq: SheetQuestion, bank: BankQuestion) =>
  sq.question.fromBank && typeof sq.question.bankText === 'string' && coversBankQuestion(sq.question.bankText, bank)

/**
 * Per ogni domanda della banca, le domande dei fogli pronti che la coprono, nell'ordine dei fogli. Si calcola una
 * volta per pool: il confronto dei testi costa, e con cinquanta fogli le domande d'orale sono centinaia.
 */
type Coverage = Map<string, SheetQuestion[]>

function coverageOf(sheets: readonly ModuleData[]): Coverage {
  const out: Coverage = new Map()
  for (const sq of sheetQuestions(sheets)) {
    if (!sq.question.fromBank || typeof sq.question.bankText !== 'string') continue
    for (const bank of examBank) {
      if (!covers(sq, bank)) continue
      const list = out.get(bank.id)
      if (list) list.push(sq)
      else out.set(bank.id, [sq])
    }
  }
  return out
}

function sheetIn(bank: BankQuestion, coverage: Coverage): SheetQuestion | undefined {
  const all = coverage.get(bank.id) ?? []
  for (const id of bank.moduleIds) {
    const hit = all.find((sq) => sq.moduleId === id)
    if (hit) return hit
  }
  return all[0]
}

/**
 * La domanda di un foglio pronto che copre una domanda della banca: prima nei fogli indicati dalla banca,
 * nel loro ordine (il principale per primo), poi in qualunque altro foglio pronto.
 */
export const sheetFor = (bank: BankQuestion, sheets: readonly ModuleData[]): SheetQuestion | undefined => sheetIn(bank, coverageOf(sheets))

const keysIn = (bank: BankQuestion, coverage: Coverage): string[] => [
  bankItemKey(bank),
  ...(coverage.get(bank.id) ?? []).map((sq) => progressKey(sq.moduleId, sq.question.id)),
]

/**
 * Tutte le chiavi dello storico di una domanda della banca: quella della prova senza foglio e quelle di ogni
 * domanda dei fogli pronti che la copre, nell'ordine dei fogli.
 */
export const bankKeys = (bank: BankQuestion, sheets: readonly ModuleData[]): string[] => keysIn(bank, coverageOf(sheets))

const unique = (xs: readonly string[]) => [...new Set(xs)]

/** Le domande estraibili per una modalità e una parte, nell'ordine della banca o dei fogli. */
export function buildPool(mode: OralMode, part: OralPart, sheets: readonly ModuleData[]): OralItem[] {
  const coverage = coverageOf(sheets)
  if (mode === 'banca') {
    return examBank
      .filter((b) => inPart(COURSE_OF_PART[b.part], part))
      .map((bank): OralItem => {
        const sheet = sheetIn(bank, coverage)
        const course = COURSE_OF_PART[bank.part]
        if (sheet) {
          return {
            id: `banca:${bank.id}`,
            course,
            bank,
            sheet,
            question: sheet.question,
            recordModule: sheet.moduleId,
            keys: keysIn(bank, coverage),
            bankIds: [bank.id],
          }
        }
        return { id: `banca:${bank.id}`, course, bank, question: bankOnlyQuestion(bank), recordModule: bank.moduleIds[0], keys: [bankItemKey(bank)], bankIds: [bank.id] }
      })
  }
  return sheets
    .filter((s) => inPart(s.course, part))
    .flatMap((s) =>
      s.exam.map((question): OralItem => {
        const sq = { moduleId: s.id, question }
        const banks = examBank.filter((b) => (coverage.get(b.id) ?? []).some((c) => c.moduleId === s.id && c.question.id === question.id))
        return {
          id: `foglio:${s.id}:${question.id}`,
          course: s.course,
          bank: banks[0],
          sheet: sq,
          question,
          recordModule: s.id,
          keys: unique([progressKey(s.id, question.id), ...banks.flatMap((b) => keysIn(b, coverage))]),
          bankIds: banks.map((b) => b.id),
        }
      }),
    )
}

/** Quante domande ha un pool, per i tasselli della scelta. */
export function poolSize(mode: OralMode, part: OralPart, sheets: readonly ModuleData[]): number {
  if (mode === 'banca') return examBank.filter((b) => inPart(COURSE_OF_PART[b.part], part)).length
  return sheets.filter((s) => inPart(s.course, part)).reduce((n, s) => n + s.exam.length, 0)
}

// ---------------------------------------------------------------------------------------------
// Storico e pesi
// ---------------------------------------------------------------------------------------------

export interface ItemHistory {
  attempts: number
  /** voto dell'ultima simulazione */
  last: ExamScore | null
  /** istante (ms) dell'ultima simulazione; 0 = mai */
  lastAt: number
}

/** Le simulazioni registrate sotto una qualunque delle chiavi (lo storico è dalla più vecchia alla più recente). */
export function historyOf(entries: readonly ExamEntry[], keys: readonly string[]): ItemHistory {
  const set = new Set(keys)
  let attempts = 0
  let last: ExamScore | null = null
  let lastAt = 0
  for (const e of entries) {
    if (!set.has(e.key)) continue
    attempts++
    if (e.at >= lastAt) {
      last = e.score
      lastAt = e.at
    }
  }
  return { attempts, last, lastAt }
}

const DAY = 86_400_000

/**
 * Peso nell'estrazione. Mai provata: 4. Già provata: (4 − ultimo voto) / (1 + tentativi), quindi un voto basso
 * pesa di più e ogni ripasso in più abbassa il peso; poi il peso cresce con i giorni passati dall'ultima volta,
 * fino al triplo dopo due settimane.
 */
export function weightOf(h: ItemHistory, now: number): number {
  if (h.attempts === 0 || h.last === null) return 4
  const base = (4 - h.last) / (1 + h.attempts)
  const days = Math.max(0, (now - h.lastAt) / DAY)
  return base * (1 + Math.min(days, 14) / 7)
}

/**
 * Estrazione pesata senza ripetizioni, deterministica per un dato seed e un dato storico: nessuna voce due volte,
 * e nemmeno due voci con la stessa domanda della banca (due fogli che coprono mel-03 sono una domanda sola).
 * Con `entries` vuoto i pesi sono tutti uguali: è l'estrazione ripetibile di ?seme=.
 */
export function drawSession(pool: readonly OralItem[], entries: readonly ExamEntry[], count: number, seed: number, now: number): OralItem[] {
  const rng = createRng(seed)
  const left = pool.map((item) => ({ item, w: weightOf(historyOf(entries, item.keys), now) }))
  const out: OralItem[] = []
  while (out.length < count && left.length > 0) {
    const total = left.reduce((s, x) => s + x.w, 0)
    let r = rng.next() * total
    let i = 0
    while (i < left.length - 1 && r >= left[i].w) {
      r -= left[i].w
      i++
    }
    const picked = left[i].item
    out.push(picked)
    left.splice(i, 1)
    // via anche le copie della stessa domanda della banca
    for (let j = left.length - 1; j >= 0; j--) if (left[j].item.bankIds.some((b) => picked.bankIds.includes(b))) left.splice(j, 1)
  }
  return out
}

/** Lo storico di ogni domanda della banca (per id), contando anche le simulazioni fatte dal suo foglio. */
export function bankStats(pool: readonly OralItem[], entries: readonly ExamEntry[]): Map<string, ItemHistory> {
  const out = new Map<string, ItemHistory>()
  for (const item of pool) if (item.bank) out.set(item.bank.id, historyOf(entries, item.keys))
  return out
}

// ---------------------------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------------------------

export type KeyDescription =
  | { kind: 'banca'; course: CourseId; moduleId: string; bank: BankQuestion; text: Rich }
  | { kind: 'foglio'; course: CourseId; moduleId: string; question: ExamQuestion; text: Rich }
  | { kind: 'sconosciuta'; course: CourseId | null; moduleId: string; text: string }

/** Che cosa c'è dietro una chiave dello storico: una domanda della banca, di un foglio, o una non più trovata. */
export function describeKey(key: string, sheets: readonly ModuleData[]): KeyDescription {
  const moduleId = moduleOfKey(key)
  const itemId = key.slice(moduleId.length + 1)
  const bank = itemId.startsWith(BANK_PREFIX) ? getBankQuestion(itemId.slice(BANK_PREFIX.length)) : undefined
  if (bank) return { kind: 'banca', course: COURSE_OF_PART[bank.part], moduleId, bank, text: bank.textIt }
  const sheet = sheets.find((s) => s.id === moduleId)
  const question = sheet?.exam.find((q) => q.id === itemId)
  if (sheet && question) return { kind: 'foglio', course: sheet.course, moduleId, question, text: question.q }
  return { kind: 'sconosciuta', course: getModuleMeta(moduleId)?.course ?? null, moduleId, text: `Domanda ${itemId}` }
}
