// Completa la formula: la formula con un pezzo coperto (formulas[].blanks), il nome come indizio e le
// scelte fra risposta e distrattori. Una risposta giusta vale 100 più 20 per ogni giusta di fila prima
// (fino a +80); una sbagliata azzera la serie e finisce fra le formule da ripassare.
import type { Formula, Latex, Rng } from '../../../content/types'
import { texKey } from '../pool'
import type { BlankEntry } from '../pool'

export const FILL_ROUNDS = 8
/** Con meno di due varianti non c'è una partita, solo una domanda. */
export const MIN_BLANKS = 2

export interface FillRound {
  moduleId: string
  formula: Formula
  masked: Latex
  options: Latex[]
  /** indice della risposta giusta in options */
  answer: number
}

export interface FillMiss {
  round: FillRound
  picked: number
}

export interface FillState {
  rounds: FillRound[]
  index: number
  /** scelta fatta sulla domanda corrente; null finché non si risponde */
  picked: number | null
  score: number
  streak: number
  bestStreak: number
  correct: number
  misses: FillMiss[]
}

/** Risposta e distrattori senza doppioni (a meno degli spazi): un distrattore uguale alla risposta sparisce. */
function optionsOf(answer: Latex, distractors: readonly Latex[]): Latex[] {
  const seen = new Set<string>()
  return [answer, ...distractors].filter((o) => {
    const k = texKey(o)
    if (k === '' || seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function newFill(pool: readonly BlankEntry[], rng: Rng, count = FILL_ROUNDS): FillState {
  const rounds = rng
    .shuffle(pool)
    .slice(0, count)
    .map(({ moduleId, formula, blank }): FillRound => {
      const options = rng.shuffle(optionsOf(blank.answer, blank.distractors))
      return { moduleId, formula, masked: blank.masked, options, answer: options.findIndex((o) => texKey(o) === texKey(blank.answer)) }
    })
  return { rounds, index: 0, picked: null, score: 0, streak: 0, bestStreak: 0, correct: 0, misses: [] }
}

export const currentRound = (s: FillState): FillRound | undefined => s.rounds[s.index]

/** Punti di una risposta giusta con `streak` giuste di fila prima. */
export const fillPoints = (streak: number) => 100 + 20 * Math.min(4, streak)

/** Sceglie l'opzione `option` della domanda corrente. Una seconda scelta sulla stessa domanda non conta. */
export function pickOption(s: FillState, option: number): FillState {
  const round = currentRound(s)
  if (!round || s.picked !== null || option < 0 || option >= round.options.length) return s
  if (option === round.answer) {
    const streak = s.streak + 1
    return { ...s, picked: option, score: s.score + fillPoints(s.streak), streak, bestStreak: Math.max(s.bestStreak, streak), correct: s.correct + 1 }
  }
  return { ...s, picked: option, streak: 0, misses: [...s.misses, { round, picked: option }] }
}

/** Passa alla domanda dopo (solo dopo aver risposto). */
export const nextRound = (s: FillState): FillState => (s.picked === null ? s : { ...s, index: s.index + 1, picked: null })

export const fillOver = (s: FillState) => s.index >= s.rounds.length
