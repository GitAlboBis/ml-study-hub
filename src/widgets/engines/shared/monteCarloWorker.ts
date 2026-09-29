// Il lato worker di MonteCarloRunner: il protocollo dei lotti e il seme di ogni replica. Logica pura, senza React:
// il file del worker di un motore importa solo questo, e il suo bundle resta piccolo.
//
// Quando una replica costa più di un fotogramma (oltre i 50 ms: un training set con una matrice grande, una ricerca
// esaustiva ripetuta) il calcolo esce dal thread principale. Il motore scrive un file accanto alla sua logica
//
//   // estimator-lab/replica.worker.ts
//   import { serveMonteCarlo } from '../shared/monteCarloWorker'
//   import { replicaStima } from './estimatorLab'
//   serveMonteCarlo(replicaStima)
//
// e passa a useMonteCarlo `worker: { create: () => new Worker(new URL('./replica.worker.ts', import.meta.url),
// { type: 'module' }), params }`. Vite riconosce il worker solo se `new URL(…)` sta dentro `new Worker(…)` con
// opzioni scritte per esteso (documentazione di Vite 8, "Web Workers"): per questo la riga la scrive il motore.
//
// Nel worker la replica non vede le chiusure del componente: i parametri del modello (N, σ, il kernel) arrivano
// come dati clonabili con ogni lotto. La replica i usa sempre il seme replicaSeed(seme, i), qui come sul thread
// principale: i numeri sono gli stessi dovunque si calcolino, e il test lo controlla.
import type { Rng } from '../../../content/types'
import { createRng } from '../../../lib/rng'

/**
 * Seme della replica `index` dell'esperimento `seed`: un intero senza segno a 32 bit, mescolato (finalizzatore di
 * murmur3) perché semi vicini diano sequenze scorrelate.
 */
export function replicaSeed(seed: number, index: number): number {
  let h = (Math.trunc(seed) ^ Math.imul(Math.trunc(index) + 1, 0x9e3779b1)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return (h ^ (h >>> 16)) >>> 0
}

/** Una replica che può girare in un worker: i parametri del modello arrivano come dati, non per chiusura. */
export type WorkerReplicate<R, P> = (rng: Rng, index: number, params: P) => R

/** Richiesta del thread principale: le repliche da `from` a `from + count − 1` dell'esperimento `seed`. */
export interface MonteCarloBatchRequest<P = unknown> {
  type: 'mc-batch'
  /** numero del lotto: una risposta con un numero vecchio (dopo Ferma o Reset) si scarta */
  job: number
  seed: number
  from: number
  count: number
  params: P
}

/** Risposta del worker: i risultati del lotto e quanto è durato (per la misura del lotto dopo), o l'errore. */
export type MonteCarloBatchReply<R = unknown> =
  | { type: 'mc-batch'; job: number; seed: number; from: number; results: R[]; ms: number }
  | { type: 'mc-error'; job: number; message: string }

const defaultNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/** Calcola un lotto. Un errore della replica diventa una risposta 'mc-error': il worker resta vivo. */
export function runMonteCarloBatch<R, P>(replicate: WorkerReplicate<R, P>, req: MonteCarloBatchRequest<P>, now: () => number = defaultNow): MonteCarloBatchReply<R> {
  const start = now()
  const results: R[] = []
  try {
    for (let i = req.from; i < req.from + req.count; i++) results.push(replicate(createRng(replicaSeed(req.seed, i)), i, req.params))
  } catch (e) {
    return { type: 'mc-error', job: req.job, message: e instanceof Error ? e.message : String(e) }
  }
  return { type: 'mc-batch', job: req.job, seed: req.seed, from: req.from, results, ms: now() - start }
}

/** Ciò che serve del contesto globale di un worker (self): ricevere e mandare messaggi. */
export interface MonteCarloWorkerScope {
  onmessage: ((ev: MessageEvent) => void) | null
  postMessage(message: unknown): void
}

/** Nel file del worker di un motore: risponde a ogni richiesta di lotto con la replica data. */
export function serveMonteCarlo<R, P>(replicate: WorkerReplicate<R, P>, scope: MonteCarloWorkerScope = self as unknown as MonteCarloWorkerScope): void {
  scope.onmessage = (ev) => {
    const req = ev.data as Partial<MonteCarloBatchRequest<P>> | null
    if (req?.type !== 'mc-batch') return
    scope.postMessage(runMonteCarloBatch(replicate, req as MonteCarloBatchRequest<P>))
  }
}
