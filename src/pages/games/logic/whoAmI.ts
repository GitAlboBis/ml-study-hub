// Chi sono?: una definizione del glossario, e bisogna dire il termine, in italiano o in inglese.
// Gli indizi arrivano uno alla volta e ognuno abbassa il valore del turno: la definizione (100 punti),
// le iniziali del termine italiano (70), il termine inglese (40), quattro nomi fra cui scegliere (20).
// Un tentativo sbagliato apre da solo l'indizio dopo; alle quattro opzioni una scelta sbagliata chiude il turno.
import type { GlossaryEntry, Rich, Rng } from '../../../content/types'
import { normalize } from '../pool'
import type { Tagged } from '../pool'

export const WHO_ROUNDS = 8
/** Servono quattro termini per le quattro opzioni dell'ultimo indizio. */
export const MIN_TERMS = 4
export const HINT_POINTS = [100, 70, 40, 20] as const
export type Stage = 0 | 1 | 2 | 3

export interface WhoRound {
  entry: Tagged<GlossaryEntry>
  options: Tagged<GlossaryEntry>[]
  /** indice della risposta in options */
  answer: number
}

export interface WhoOutcome {
  round: WhoRound
  solved: boolean
  points: number
  /** indizio a cui si è arrivati */
  stage: Stage
}

export interface WhoState {
  rounds: WhoRound[]
  index: number
  stage: Stage
  /** tentativi sbagliati del turno, nell'ordine */
  tries: string[]
  /** esito del turno corrente; null finché è aperto */
  outcome: WhoOutcome | null
  results: WhoOutcome[]
  score: number
}

// ---------------------------------------------------------------------------------------------
// Testo del termine
// ---------------------------------------------------------------------------------------------

/** Le forme del termine scritte nel glossario: italiano, ogni alternativa inglese, senza e con le parentesi. */
function rawVariants(entry: GlossaryEntry): string[] {
  const out: string[] = []
  for (const src of [entry.term, ...entry.en.split(/[,;/]/)]) {
    out.push(src.trim(), src.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim())
    for (const m of src.matchAll(/\(([^)]*)\)/g)) out.push(m[1].trim())
  }
  return [...new Set(out.filter((v) => v !== ''))]
}

/** Distanza di edit (Levenshtein) fra due stringhe corte. */
function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = row
  }
  return prev[b.length]
}

/** Errori di battitura tollerati: nessuno fino a 7 caratteri, poi uno ogni 8, al massimo 3. */
const tolerance = (length: number) => Math.min(3, Math.floor(length / 8))

/** Il testo scritto è il termine? Accenti, maiuscole e punteggiatura non contano; qualche refuso sì, poco. */
export function matchesTerm(text: string, entry: GlossaryEntry): boolean {
  const guess = normalize(text)
  if (guess.length < 2) return false
  return rawVariants(entry)
    .map(normalize)
    .some((v) => v.length >= 2 && (v === guess || distance(v, guess) <= tolerance(v.length)))
}

/** Le iniziali: "Larghezza della finestra" → "L________ d____ f_______". Cifre e simboli restano. */
export const initials = (term: string) =>
  term.replace(/\p{L}+/gu, (word) => {
    const chars = [...word]
    return chars[0] + '_'.repeat(chars.length - 1)
  })

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const MATH = /(\$\$[\s\S]*?\$\$|\$[^$]*\$)/

/** La definizione senza il termine (se per caso lo contiene): ogni forma diventa ▢▢▢, la matematica resta com'è. */
export function maskTerm(def: Rich, entry: GlossaryEntry): Rich {
  const forms = rawVariants(entry)
    .filter((v) => [...v].length >= 4)
    .sort((a, b) => b.length - a.length)
  if (forms.length === 0) return def
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${forms.map(escape).join('|')})(?![\\p{L}\\p{N}])`, 'giu')
  return def
    .split(MATH)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(re, '▢▢▢')))
    .join('')
}

// ---------------------------------------------------------------------------------------------
// Partita
// ---------------------------------------------------------------------------------------------

export function newWho(pool: readonly Tagged<GlossaryEntry>[], rng: Rng, count = WHO_ROUNDS): WhoState {
  const rounds = rng
    .shuffle(pool)
    .slice(0, count)
    .map((entry): WhoRound => {
      const others = rng.shuffle(pool.filter((e) => e !== entry)).slice(0, 3)
      const options = rng.shuffle([entry, ...others])
      return { entry, options, answer: options.indexOf(entry) }
    })
  return { rounds, index: 0, stage: 0, tries: [], outcome: null, results: [], score: 0 }
}

export const currentWhoRound = (s: WhoState): WhoRound | undefined => s.rounds[s.index]

function close(s: WhoState, solved: boolean): WhoState {
  const round = currentWhoRound(s)
  if (!round) return s
  const points = solved ? HINT_POINTS[s.stage] : 0
  const outcome: WhoOutcome = { round, solved, points, stage: s.stage }
  return { ...s, outcome, results: [...s.results, outcome], score: s.score + points }
}

/** Un tentativo scritto. Se è sbagliato si apre l'indizio dopo. */
export function guess(s: WhoState, text: string): WhoState {
  const round = currentWhoRound(s)
  if (!round || s.outcome !== null || text.trim() === '') return s
  if (matchesTerm(text, round.entry.item)) return close(s, true)
  return { ...s, stage: Math.min(3, s.stage + 1) as Stage, tries: [...s.tries, text.trim()] }
}

/** Scelta fra le quattro opzioni (solo all'ultimo indizio): sbagliata chiude il turno a zero. */
export function pickWho(s: WhoState, option: number): WhoState {
  const round = currentWhoRound(s)
  if (!round || s.outcome !== null || s.stage !== 3 || option < 0 || option >= round.options.length) return s
  return close(s, option === round.answer)
}

export const moreHint = (s: WhoState): WhoState => (s.outcome !== null || s.stage === 3 || !currentWhoRound(s) ? s : { ...s, stage: (s.stage + 1) as Stage })

export const giveUp = (s: WhoState): WhoState => (s.outcome !== null ? s : close(s, false))

export const nextWho = (s: WhoState): WhoState => (s.outcome === null ? s : { ...s, index: s.index + 1, stage: 0, tries: [], outcome: null })

export const whoOver = (s: WhoState) => s.index >= s.rounds.length
