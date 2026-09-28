// Formula Match: memory con le formule. Ogni coppia è una tessera con il nome della formula e una con il
// suo LaTeX; si girano due tessere alla volta. Logica pura: il componente tiene lo stato e il cronometro.
import type { Formula, Rng } from '../../../content/types'
import { normalize, texKey } from '../pool'
import type { Tagged } from '../pool'

/** Coppie di una partita: 12 tessere stanno in una griglia 4 × 3 (2 × 6 sul telefono). */
export const MAX_PAIRS = 6
/** Sotto le tre coppie non c'è memoria da allenare. */
export const MIN_PAIRS = 3

/**
 * Le formule che possono fare coppia: una sola per LaTeX e una sola per nome, così ogni tessera ha una
 * sola compagna possibile (nei fogli la stessa formula compare a volte con due nomi, per due concetti).
 */
export function matchable(formulas: readonly Tagged<Formula>[]): Tagged<Formula>[] {
  const tex = new Set<string>()
  const names = new Set<string>()
  return formulas.filter(({ item }) => {
    const t = texKey(item.latex)
    const n = normalize(item.name)
    if (t === '' || n === '' || tex.has(t) || names.has(n)) return false
    tex.add(t)
    names.add(n)
    return true
  })
}

export interface MemoryCard {
  /** chiave stabile per React */
  key: string
  /** indice della coppia in MatchState.pairs */
  pair: number
  face: 'name' | 'formula'
}

export interface MatchPair {
  moduleId: string
  formula: Formula
}

export interface MatchState {
  pairs: MatchPair[]
  cards: MemoryCard[]
  /** tessere scoperte e non ancora accoppiate: una, oppure due sbagliate in attesa di richiudersi */
  open: number[]
  /** coppie trovate, nell'ordine in cui sono state trovate */
  matched: number[]
  /** una mossa è il giro della seconda tessera */
  moves: number
  misses: number
}

/** Una partita: prima le formule da sapere a memoria (importanza 3), a parità in ordine casuale. */
export function newMatch(pool: readonly Tagged<Formula>[], rng: Rng, size = MAX_PAIRS): MatchState {
  // sort è stabile: dentro ogni importanza resta l'ordine mescolato
  const chosen = rng
    .shuffle(matchable(pool))
    .sort((a, b) => b.item.importance - a.item.importance)
    .slice(0, size)
  const pairs = chosen.map(({ moduleId, item }) => ({ moduleId, formula: item }))
  const cards = rng.shuffle(
    pairs.flatMap((_, pair): MemoryCard[] => [
      { key: `${pair}n`, pair, face: 'name' },
      { key: `${pair}f`, pair, face: 'formula' },
    ]),
  )
  return { pairs, cards, open: [], matched: [], moves: 0, misses: 0 }
}

export type FlipResult = 'ignored' | 'opened' | 'match' | 'miss'

/** Gira la tessera `index`. Due tessere sbagliate ancora scoperte si richiudono appena se ne gira una terza. */
export function flip(s: MatchState, index: number): { state: MatchState; result: FlipResult } {
  const card = s.cards[index]
  if (!card || s.matched.includes(card.pair) || s.open.includes(index)) return { state: s, result: 'ignored' }
  const open = s.open.length >= 2 ? [] : s.open
  if (open.length === 0) return { state: { ...s, open: [index] }, result: 'opened' }
  const moves = s.moves + 1
  if (s.cards[open[0]].pair === card.pair) {
    return { state: { ...s, open: [], matched: [...s.matched, card.pair], moves }, result: 'match' }
  }
  return { state: { ...s, open: [open[0], index], moves, misses: s.misses + 1 }, result: 'miss' }
}

/** Richiude le due tessere sbagliate (dopo la pausa per guardarle). */
export const closeMiss = (s: MatchState): MatchState => (s.open.length === 2 ? { ...s, open: [] } : s)

export const isFaceUp = (s: MatchState, index: number) => s.open.includes(index) || s.matched.includes(s.cards[index]?.pair ?? -1)

export const isWon = (s: MatchState) => s.pairs.length > 0 && s.matched.length === s.pairs.length

/** Il numero della coppia trovata (da 1), per il cartellino sulle due tessere; null se non è ancora trovata. */
export function pairNumber(s: MatchState, index: number): number | null {
  const at = s.matched.indexOf(s.cards[index]?.pair ?? -1)
  return at === -1 ? null : at + 1
}

/**
 * Punteggio: 100 a coppia, meno 20 per ogni mossa oltre il minimo (una a coppia) e 1 per ogni secondo
 * oltre i 15 a coppia; mai sotto 10 a coppia, perché finire conta.
 */
export function matchScore(pairs: number, moves: number, seconds: number): number {
  const extra = Math.max(0, moves - pairs)
  const slow = Math.max(0, Math.floor(seconds) - pairs * 15)
  return Math.max(pairs * 10, pairs * 100 - extra * 20 - slow)
}
