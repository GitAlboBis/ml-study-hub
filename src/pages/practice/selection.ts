// Logica delle pagine globali di pratica (/flashcard e /quiz): l'ambito (tutti i fogli, una regione, un foglio),
// le carte e le domande che ci stanno dentro, la coda di una sessione di flashcard, l'estrazione a seme delle
// domande di un quiz, gli errori da ripassare e i conti per foglio. Funzioni pure, provate da selection.test.ts;
// i componenti React stanno nei file delle pagine.
//
// Nessun id scritto a mano: la regione di un foglio e il suo numero vengono dal manifest, i fogli pronti da
// src/content/registry.ts. Le chiavi nei progressi si fanno con progressKey(moduleId, itemId).
import { dueQueue } from '../../components/practice/logic'
import type { DeckEntry, QuizEntry } from '../../components/practice/logic'
import { getModuleMeta, manifest } from '../../content/manifest'
import type { ModuleManifestEntry } from '../../content/manifest'
import type { CourseId, ModuleData } from '../../content/types'
import { REGION_ORDER, REGIONS, sheetNumber } from '../../lib/atlas'
import { createRng } from '../../lib/rng'
import type { SrsCard } from '../../lib/srs'
import { moduleOfKey, progressKey } from '../../store/progress'
import type { ModuleProgress, QuizStat } from '../../store/progress'

// ---------------------------------------------------------------------------------------------
// Ambito
// ---------------------------------------------------------------------------------------------

/** Dove pescare carte e domande: tutto l'atlante, una regione (un corso) o un solo foglio. */
export type Scope = { kind: 'tutti' } | { kind: 'regione'; course: CourseId } | { kind: 'foglio'; moduleId: string }

export const ALL_SHEETS: Scope = { kind: 'tutti' }

const isCourse = (v: string): v is CourseId => (REGION_ORDER as readonly string[]).includes(v)

/** L'ambito scritto nell'URL (?foglio=… oppure ?regione=…). Il foglio vince; un valore sconosciuto vale "tutti". */
export function parseScope(params: URLSearchParams): Scope {
  const sheet = params.get('foglio')
  if (sheet !== null && getModuleMeta(sheet)) return { kind: 'foglio', moduleId: sheet }
  const region = params.get('regione')
  if (region !== null && isCourse(region)) return { kind: 'regione', course: region }
  return ALL_SHEETS
}

/** Una copia dei parametri con l'ambito al posto di quello di prima; gli altri parametri restano. */
export function writeScope(params: URLSearchParams, scope: Scope): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete('foglio')
  next.delete('regione')
  if (scope.kind === 'foglio') next.set('foglio', scope.moduleId)
  if (scope.kind === 'regione') next.set('regione', scope.course)
  return next
}

/** Un identificativo stabile dell'ambito, per confronti e chiavi React. */
export const scopeId = (scope: Scope) =>
  scope.kind === 'tutti' ? 'tutti' : scope.kind === 'regione' ? `regione:${scope.course}` : `foglio:${scope.moduleId}`

/** "Foglio 09 · Finestre di Parzen": il nome di un foglio nelle liste che ne mescolano molti. */
export const sheetName = (moduleId: string, title: string) => `Foglio ${sheetNumber(moduleId) ?? '··'} · ${title}`

export function scopeLabel(scope: Scope): string {
  if (scope.kind === 'tutti') return 'Tutti i fogli'
  if (scope.kind === 'regione') return `Regione ${REGIONS[scope.course].name}`
  return sheetName(scope.moduleId, getModuleMeta(scope.moduleId)?.title ?? scope.moduleId)
}

/** L'ambito come complemento di luogo, dentro una frase: "nella regione Melgani". */
export function scopeWhere(scope: Scope): string {
  if (scope.kind === 'tutti') return "in tutto l'atlante"
  if (scope.kind === 'regione') return `nella regione ${REGIONS[scope.course].name}`
  return `nel foglio ${sheetNumber(scope.moduleId) ?? scope.moduleId}`
}

/** Il foglio sta nell'ambito? La regione si legge dal manifest. */
export function inScope(scope: Scope, moduleId: string): boolean {
  if (scope.kind === 'tutti') return true
  if (scope.kind === 'foglio') return moduleId === scope.moduleId
  return getModuleMeta(moduleId)?.course === scope.course
}

/** I fogli dell'ambito secondo il manifest, pronti o no, nell'ordine di studio. */
export const sheetsOf = (scope: Scope): ModuleManifestEntry[] => manifest.filter((m) => inScope(scope, m.id))

/** Le carte o le domande (qualsiasi cosa con una chiave dei progressi) che stanno nell'ambito. */
export const entriesIn = <T extends { key: string }>(entries: readonly T[], scope: Scope): T[] =>
  scope.kind === 'tutti' ? [...entries] : entries.filter((e) => inScope(scope, moduleOfKey(e.key)))

// ---------------------------------------------------------------------------------------------
// Flashcard
// ---------------------------------------------------------------------------------------------

/** Tutte le carte dei fogli, nell'ordine dei fogli e poi del mazzo di ciascuno, con la chiave e l'origine. */
export const deckOf = (modules: readonly ModuleData[]): DeckEntry[] =>
  modules.flatMap((m) => m.flashcards.map((card) => ({ key: progressKey(m.id, card.id), card, origin: sheetName(m.id, m.title) })))

export interface CardCounts {
  total: number
  /** già studiate e scadute adesso */
  due: number
  /** mai viste */
  fresh: number
}

export function cardCounts(entries: readonly DeckEntry[], srs: Readonly<Record<string, SrsCard>>, now: number): CardCounts {
  let due = 0
  let fresh = 0
  for (const e of entries) {
    const s = srs[e.key]
    if (!s) fresh++
    else if (s.due <= now) due++
  }
  return { total: entries.length, due, fresh }
}

/** I fogli su cui il rilievo è cominciato (letti, finiti o da ripassare). */
export const startedSheets = (modules: Readonly<Record<string, ModuleProgress>>): Set<string> =>
  new Set(Object.entries(modules).filter(([, p]) => p.status !== 'da-iniziare').map(([id]) => id))

/**
 * La coda di una sessione: prima le carte scadute, dalla più vecchia; poi le nuove, prima quelle dei fogli
 * già aperti (le altre riguardano teoria non ancora letta), ognuna nell'ordine del mazzo. Al massimo `limit`.
 */
export function sessionQueue(
  entries: readonly DeckEntry[],
  srs: Readonly<Record<string, SrsCard>>,
  now: number,
  limit: number,
  started: ReadonlySet<string> = new Set(),
): DeckEntry[] {
  const queue = dueQueue(entries, srs, now)
  const seen = queue.filter((e) => srs[e.key])
  const fresh = queue.filter((e) => !srs[e.key])
  const opened = fresh.filter((e) => started.has(moduleOfKey(e.key)))
  const others = fresh.filter((e) => !started.has(moduleOfKey(e.key)))
  return [...seen, ...opened, ...others].slice(0, limit)
}

/** Per "ripassa comunque" quando nulla è in scadenza: prima le carte che tornerebbero prima. */
export function soonestFirst(entries: readonly DeckEntry[], srs: Readonly<Record<string, SrsCard>>, limit: number): DeckEntry[] {
  const due = (e: DeckEntry) => srs[e.key]?.due ?? Number.NEGATIVE_INFINITY
  // sort è stabile: a parità di scadenza resta l'ordine del mazzo
  return [...entries].sort((a, b) => due(a) - due(b)).slice(0, limit)
}

export interface DayLoad {
  /** inizio del giorno di calendario locale (ms) */
  start: number
  count: number
}

/**
 * Le carte già viste che tornano nei prossimi `days` giorni di calendario, giorno per giorno; il primo giorno
 * (oggi) comprende anche quelle già scadute. Le carte nuove non contano: non hanno una scadenza.
 */
export function forecast(entries: readonly DeckEntry[], srs: Readonly<Record<string, SrsCard>>, now: number, days = 7): DayLoad[] {
  const d = new Date(now)
  // aritmetica di calendario, non 24 ore in ms: regge i giorni di 23 e 25 ore del cambio dell'ora
  const startOf = (i: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + i).getTime()
  const loads: DayLoad[] = Array.from({ length: days }, (_, i) => ({ start: startOf(i), count: 0 }))
  const end = startOf(days)
  for (const e of entries) {
    const due = srs[e.key]?.due
    if (due === undefined || due >= end) continue
    let i = days - 1
    while (i > 0 && due < loads[i].start) i--
    loads[i].count++
  }
  return loads
}

export interface SheetTally {
  moduleId: string
  reviewed: number
  /** carte il cui ultimo voto è "Non la sapevo" (SM-2 azzera le ripetizioni): tornano domani */
  missed: number
}

const sheetOrder = new Map(manifest.map((m, i) => [m.id, i]))

/** Il bilancio di una sessione finita, foglio per foglio nell'ordine dell'atlante, letto dallo stato delle carte dopo i voti. */
export function tallyBySheet(queue: readonly DeckEntry[], srs: Readonly<Record<string, SrsCard>>): SheetTally[] {
  const bySheet = new Map<string, SheetTally>()
  for (const e of queue) {
    const moduleId = moduleOfKey(e.key)
    const t = bySheet.get(moduleId) ?? { moduleId, reviewed: 0, missed: 0 }
    t.reviewed++
    if (srs[e.key]?.reps === 0) t.missed++
    bySheet.set(moduleId, t)
  }
  return [...bySheet.values()].sort((a, b) => (sheetOrder.get(a.moduleId) ?? 0) - (sheetOrder.get(b.moduleId) ?? 0))
}

// ---------------------------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------------------------

/** Tutte le domande dei fogli, con la chiave e l'origine. */
export const quizOf = (modules: readonly ModuleData[]): QuizEntry[] =>
  modules.flatMap((m) => m.quiz.map((item) => ({ key: progressKey(m.id, item.id), item, origin: sheetName(m.id, m.title) })))

/** Un errore aperto: la domanda è stata sbagliata l'ultima volta che l'hai provata. */
export const isMistake = (stat: QuizStat | undefined) => stat !== undefined && !stat.lastCorrect

const accuracy = (s: QuizStat) => (s.attempts > 0 ? s.correct / s.attempts : 0)

/** Gli errori aperti, dalla domanda peggiore (accuratezza più bassa); a parità, dall'errore più vecchio. */
export function mistakesOf(entries: readonly QuizEntry[], stats: Readonly<Record<string, QuizStat>>): QuizEntry[] {
  return entries
    .filter((e) => isMistake(stats[e.key]))
    .sort((a, b) => {
      const sa = stats[a.key]
      const sb = stats[b.key]
      return accuracy(sa) - accuracy(sb) || sa.lastAt - sb.lastAt
    })
}

/**
 * Estrazione a seme di `count` domande: i fogli si dividono i posti in parti uguali (a turno, finché un foglio
 * ha domande), dentro ogni foglio le domande sono mescolate, e l'ordine finale è mescolato di nuovo.
 * Stesso seme, stessa estrazione.
 */
export function drawQuiz(entries: readonly QuizEntry[], count: number, seed: number): QuizEntry[] {
  const rng = createRng(seed)
  const n = Math.min(count, entries.length)
  const groups = new Map<string, QuizEntry[]>()
  for (const e of entries) {
    const id = moduleOfKey(e.key)
    const group = groups.get(id)
    if (group) group.push(e)
    else groups.set(id, [e])
  }
  const queues = rng.shuffle([...groups.values()].map((g) => rng.shuffle(g)))
  const picked: QuizEntry[] = []
  for (let round = 0; picked.length < n; round++) {
    for (const q of queues) {
      if (picked.length >= n) break
      if (round < q.length) picked.push(q[round])
    }
  }
  return rng.shuffle(picked)
}

/** Il ripasso: le `count` domande peggiori fra gli errori (già in ordine da mistakesOf), mescolate a seme. */
export const drawMistakes = (mistakes: readonly QuizEntry[], count: number, seed: number): QuizEntry[] =>
  createRng(seed).shuffle(mistakes.slice(0, count))

export interface QuizTally {
  total: number
  /** domande provate almeno una volta */
  tried: number
  attempts: number
  correct: number
  /** domande giuste l'ultima volta che le hai provate */
  lastRight: number
  /** errori aperti */
  mistakes: number
  /** ultimo tentativo (ms), 0 = mai */
  lastAt: number
}

export function quizTally(entries: readonly QuizEntry[], stats: Readonly<Record<string, QuizStat>>): QuizTally {
  const t: QuizTally = { total: entries.length, tried: 0, attempts: 0, correct: 0, lastRight: 0, mistakes: 0, lastAt: 0 }
  for (const e of entries) {
    const s = stats[e.key]
    if (!s) continue
    t.tried++
    t.attempts += s.attempts
    t.correct += s.correct
    if (s.lastCorrect) t.lastRight++
    else t.mistakes++
    t.lastAt = Math.max(t.lastAt, s.lastAt)
  }
  return t
}

/** Il bilancio di ogni foglio pronto, nell'ordine dei fogli. */
export function quizTallyBySheet(modules: readonly ModuleData[], stats: Readonly<Record<string, QuizStat>>): Map<string, QuizTally> {
  return new Map(modules.map((m) => [m.id, quizTally(quizOf([m]), stats)]))
}

/** Percentuale intera; null se non c'è niente su cui calcolarla. */
export const percent = (part: number, whole: number): number | null => (whole > 0 ? Math.round((100 * part) / whole) : null)

// ---------------------------------------------------------------------------------------------
// Grandezza della sessione
// ---------------------------------------------------------------------------------------------

/** "10", "20", … oppure "tutte": i valori dei tasselli di scelta. */
export type SizeChoice = string

/** I passi più piccoli di ciò che c'è (un passo uguale o più grande sarebbe "tutte"), più "tutte". */
export const sizeChoices = (steps: readonly number[], available: number): SizeChoice[] => [
  ...steps.filter((s) => s < available).map(String),
  'tutte',
]

export const pickSize = (preferred: SizeChoice, choices: readonly SizeChoice[]): SizeChoice => (choices.includes(preferred) ? preferred : 'tutte')

export const sizeLimit = (size: SizeChoice): number => (size === 'tutte' ? Number.POSITIVE_INFINITY : Number(size))

// ---------------------------------------------------------------------------------------------
// Modo della prova (arena dei quiz)
// ---------------------------------------------------------------------------------------------

/** allenamento: esito subito; esame: a tempo, esito alla consegna; errori: ripasso degli errori aperti, esito subito. */
export const ARENA_MODES = ['allenamento', 'esame', 'errori'] as const
export type ArenaMode = (typeof ARENA_MODES)[number]

export function parseMode(params: URLSearchParams): ArenaMode {
  const mode = params.get('modo')
  return ARENA_MODES.find((m) => m === mode) ?? 'allenamento'
}

/** Una copia dei parametri con il modo; l'allenamento è il modo predefinito e non si scrive. */
export function writeMode(params: URLSearchParams, mode: ArenaMode): URLSearchParams {
  const next = new URLSearchParams(params)
  if (mode === 'allenamento') next.delete('modo')
  else next.set('modo', mode)
  return next
}
