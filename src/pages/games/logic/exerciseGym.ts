// Palestra esercizi: una serie di dieci esercizi generativi (ogni seed una variante nuova) a livelli, che
// sono le difficoltà 1-3 degli esercizi. Tre risolti di fila fanno salire di livello, due falliti di fila
// fanno scendere; un risolto vale 10 punti per livello più 5 per ogni risolto di fila prima (fino a +20).
// L'esito lo dice chi gioca dopo aver controllato le risposte o letto la soluzione: ExerciseRunner non
// espone il suo controllo, e gli esercizi concettuali non ne hanno uno.
import type { Exercise, Rng } from '../../../content/types'
import type { Tagged } from '../pool'

export type Level = 1 | 2 | 3
export const SERIES = 10
export const LEVEL_UP = 3
export const LEVEL_DOWN = 2

export interface GymPick {
  moduleId: string
  exercise: Exercise
  seed: number
  /** livello a cui è stato dato */
  level: Level
}

export interface GymResult {
  pick: GymPick
  solved: boolean
  points: number
}

export interface GymState {
  level: Level
  /** livello più alto raggiunto */
  top: Level
  current: GymPick | null
  results: GymResult[]
  /** risolti di fila al livello corrente */
  run: number
  /** falliti di fila al livello corrente */
  fails: number
  score: number
  /** ultimo cambio di livello, per annunciarlo */
  event: 'su' | 'giu' | null
}

/** I livelli che hanno almeno un esercizio, in ordine. */
export const levelsOf = (pool: readonly Tagged<Exercise>[]): Level[] => ([1, 2, 3] as const).filter((l) => pool.some((e) => e.item.difficulty === l))

/** Il livello disponibile più vicino a quello chiesto (a parità, il più basso). */
function nearest(pool: readonly Tagged<Exercise>[], level: Level): Level {
  const levels = levelsOf(pool)
  if (levels.length === 0) return level
  return levels.reduce((best, l) => (Math.abs(l - level) < Math.abs(best - level) ? l : best), levels[0])
}

/** Un esercizio del livello, diverso dagli ultimi due se si può, con un seed nuovo. */
function pick(pool: readonly Tagged<Exercise>[], level: Level, rng: Rng, recent: readonly GymResult[]): GymPick | null {
  if (pool.length === 0) return null
  const at = nearest(pool, level)
  const candidates = pool.filter((e) => e.item.difficulty === at)
  const recentKeys = new Set(recent.slice(-2).map((r) => `${r.pick.moduleId}:${r.pick.exercise.id}`))
  const fresh = candidates.filter((e) => !recentKeys.has(`${e.moduleId}:${e.item.id}`))
  const chosen = rng.pick(fresh.length > 0 ? fresh : candidates)
  // il seed è anche il numero della variante che ExerciseRunner mostra: tre cifre si leggono
  return { moduleId: chosen.moduleId, exercise: chosen.item, seed: rng.int(1, 999), level }
}

export function newGym(pool: readonly Tagged<Exercise>[], rng: Rng, start: Level = 1): GymState {
  const level = nearest(pool, start)
  return { level, top: level, current: pick(pool, level, rng, []), results: [], run: 0, fails: 0, score: 0, event: null }
}

export const currentPick = (s: GymState) => s.current

/** Punti di un esercizio risolto al livello `level` con `run` risolti di fila prima. */
export const gymPoints = (level: Level, run: number) => 10 * level + 5 * Math.min(4, run)

/** Registra l'esito dell'esercizio corrente e prepara il prossimo (o chiude la serie). */
export function recordGym(s: GymState, solved: boolean, pool: readonly Tagged<Exercise>[], rng: Rng): GymState {
  if (!s.current) return s
  const points = solved ? gymPoints(s.level, s.run) : 0
  const results = [...s.results, { pick: s.current, solved, points }]
  let run = solved ? s.run + 1 : 0
  let fails = solved ? 0 : s.fails + 1
  let level = s.level
  let event: GymState['event'] = null
  const levels = levelsOf(pool)
  const up = levels.find((l) => l > level)
  const down = [...levels].reverse().find((l) => l < level)
  if (run >= LEVEL_UP && up !== undefined) {
    level = up
    event = 'su'
    run = 0
  } else if (fails >= LEVEL_DOWN && down !== undefined) {
    level = down
    event = 'giu'
    fails = 0
  }
  const over = results.length >= SERIES
  return {
    level,
    top: Math.max(s.top, level) as Level,
    current: over ? null : pick(pool, level, rng, results),
    results,
    run,
    fails,
    score: s.score + points,
    event,
  }
}

export const gymOver = (s: GymState) => s.current === null

/** Una nuova serie dal livello raggiunto. */
export function nextSeries(s: GymState, pool: readonly Tagged<Exercise>[], rng: Rng): GymState {
  return { ...newGym(pool, rng, s.level), top: s.top }
}
