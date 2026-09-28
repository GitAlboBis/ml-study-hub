// Riordina la dimostrazione: i passaggi di derivations[].steps arrivano mescolati e vanno rimessi in fila.
// Un passaggio è giusto se nella sua posizione c'è lo stesso LaTeX della fonte: due passaggi identici
// valgono l'uno per l'altro. "Controlla" dice quali sono al posto giusto; "Un aiuto" sistema il primo sbagliato.
import type { Derivation, DerivationStep, Rng } from '../../../content/types'
import { texKey } from '../pool'

export interface ProofState {
  steps: DerivationStep[]
  /** order[i] = indice in steps del passaggio mostrato in posizione i */
  order: number[]
  checks: number
  hints: number
  /** esito dell'ultimo controllo, posizione per posizione; null se l'ordine è cambiato dopo */
  verdict: boolean[] | null
  solved: boolean
}

const same = (steps: readonly DerivationStep[], a: number, b: number) => texKey(steps[a].latex) === texKey(steps[b].latex)

const placed = (steps: readonly DerivationStep[], order: readonly number[]) => order.map((step, i) => same(steps, step, i))

export function newProof(derivation: Derivation, rng: Rng): ProofState {
  const steps = derivation.steps
  const identity = steps.map((_, i) => i)
  let order = rng.shuffle(identity)
  // un ordine già giusto non è un gioco; con passaggi tutti uguali ci si arrende dopo qualche tentativo
  for (let tries = 0; tries < 20 && steps.length > 1 && placed(steps, order).every(Boolean); tries++) order = rng.shuffle(identity)
  return { steps, order, checks: 0, hints: 0, verdict: null, solved: false }
}

/** Per ogni posizione: il passaggio che c'è adesso è quello giusto? */
export const inPlace = (s: ProofState): boolean[] => placed(s.steps, s.order)

/** Sposta il passaggio in posizione `from` alla posizione `to`. */
export function moveStep(s: ProofState, from: number, to: number): ProofState {
  const n = s.order.length
  if (s.solved || from === to || from < 0 || to < 0 || from >= n || to >= n) return s
  const order = [...s.order]
  const [step] = order.splice(from, 1)
  order.splice(to, 0, step)
  return { ...s, order, verdict: null }
}

/** Un ordine intero (dal trascinamento). Se non è una permutazione dei passaggi non cambia nulla. */
export function setOrder(s: ProofState, order: readonly number[]): ProofState {
  const n = s.steps.length
  if (s.solved || order.length !== n || new Set(order).size !== n || order.some((i) => !Number.isInteger(i) || i < 0 || i >= n)) return s
  if (order.every((x, i) => x === s.order[i])) return s
  return { ...s, order: [...order], verdict: null }
}

export function checkProof(s: ProofState): ProofState {
  if (s.solved) return s
  const verdict = inPlace(s)
  return { ...s, checks: s.checks + 1, verdict, solved: verdict.every(Boolean) }
}

/** Mette al suo posto il primo passaggio fuori posto (costa punti). */
export function hint(s: ProofState): ProofState {
  if (s.solved) return s
  const at = inPlace(s).indexOf(false)
  if (at === -1) return s
  const from = s.order.findIndex((step, j) => j > at && same(s.steps, step, at))
  if (from === -1) return s
  return { ...moveStep(s, from, at), hints: s.hints + 1 }
}

/** Posizione (da 0) del primo passaggio fuori posto, o -1. */
export const firstWrong = (s: ProofState) => inPlace(s).indexOf(false)

/**
 * Punteggio: 20 a passaggio, meno 10 per ogni controllo oltre il primo e 15 per ogni aiuto;
 * mai sotto 5 a passaggio.
 */
export function proofScore(steps: number, checks: number, hints: number): number {
  return Math.max(steps * 5, steps * 20 - Math.max(0, checks - 1) * 10 - hints * 15)
}
