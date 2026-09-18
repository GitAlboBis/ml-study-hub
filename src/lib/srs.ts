// Ripetizione dilazionata in stile SM-2 per le flashcard.

/** Stato di una carta: fattore di facilità, intervallo in giorni, ripetizioni riuscite di fila, scadenza in ms. */
export interface SrsCard { ef: number; interval: number; reps: number; due: number }

/** Voti ammessi: 1 = non la sapevo, 3 = a fatica, 4 = bene, 5 = facile. */
export type SrsGrade = 1 | 3 | 4 | 5

const DAY = 86_400_000

/** Restituisce la carta aggiornata dopo un ripasso fatto all'istante `now` (ms). Non modifica `card`. */
export function review(card: SrsCard | undefined, grade: SrsGrade, now: number): SrsCard {
  const c = card ?? { ef: 2.5, interval: 0, reps: 0, due: now }
  if (grade < 3) return { ef: Math.max(1.3, c.ef - 0.2), interval: 1, reps: 0, due: now + DAY }
  const reps = c.reps + 1
  const interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(c.interval * c.ef)
  const ef = Math.max(1.3, c.ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)))
  return { ef, interval, reps, due: now + interval * DAY }
}

/** Una carta mai vista è sempre in scadenza. */
export const isDue = (card: SrsCard | undefined, now: number) => !card || card.due <= now
