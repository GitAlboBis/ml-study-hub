// Monte Carlo per i widget: training set ripetuti, freccette nell'ipercubo, ondate di punti. Le repliche si fanno a
// lotti, un lotto per fotogramma (useAnimationFrame del kit), dentro un budget di tempo: il fotogramma resta
// fluido e la nuvola di stime cresce sotto gli occhi. Si fermano (stop), si sommano (+1, +100, +500) e sono a seme.
//
// SCELTE
// - Ogni replica ha il SUO seme, derivato da (seme, indice) con replicaSeed: il risultato i-esimo non dipende da
//   quante repliche sono state fatte per fotogramma, dalle pause, dalla velocità del PC né da dove è stato calcolato.
//   Così i test sono deterministici e "Nuovo seme" rifà esattamente un altro esperimento.
// - Lo stato vive in uno store fuori da React (createMonteCarlo), letto con useSyncExternalStore: si pubblica una
//   fotografia nuova una volta per fotogramma (count, target, running, version), non una per replica.
//   `results` è lo stesso array che cresce: chi ne calcola aggregati li rifà quando cambia `count`.
// - Con prefers-reduced-motion la nuvola non cresce a vista: il calcolo va avanti a lotti (il fotogramma resta
//   libero) ma si pubblica solo alla fine, uno stato a passi.
// - Una replica sola oltre il budget non si spezza: il fotogramma ne fa comunque una.
// - WEB WORKER (tabella dei pezzi di engines.md: "oltre i 50 ms per lotto"). Con `worker` il motore dà la fabbrica
//   del suo worker e i parametri del modello (vedi monteCarloWorker.ts). In modo 'auto' (predefinito) si calcola sul
//   thread principale finché una replica resta sotto `thresholdMs` (50 ms); la prima che la supera sposta il resto
//   nel worker, che nasce solo allora. In modo 'always' si parte dal worker. Nel worker va un lotto alla volta, di
//   misura adattata perché duri circa `batchMs` (100 ms: la nuvola si aggiorna una decina di volte al secondo); il
//   ciclo di fotogrammi resta quello di sempre (fermo fuori vista) e manda un lotto quando il precedente è tornato.
//   Le risposte arrivate dopo Ferma o Reset si scartano; se il worker fallisce si torna al thread principale.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { Rng } from '../../../content/types'
import { createRng } from '../../../lib/rng'
import { useAnimationFrame } from '../../kit/useAnimationFrame'
import { useReducedMotion } from '../../kit/useReducedMotion'
import { replicaSeed } from './monteCarloWorker'
import type { MonteCarloBatchReply, MonteCarloBatchRequest } from './monteCarloWorker'

/** Il worker visto dal thread principale: un Worker del browser lo è già; nei test lo si finge. */
export interface MonteCarloPort {
  postMessage(message: unknown): void
  terminate(): void
  onmessage: ((ev: MessageEvent) => void) | null
  onerror: ((ev: ErrorEvent) => void) | null
}

export interface MonteCarloWorkerOptions {
  /**
   * Crea il worker del motore: `() => new Worker(new URL('./replica.worker.ts', import.meta.url), { type: 'module' })`.
   * Si chiama al più una volta, quando serve (e di nuovo solo dopo dispose).
   */
  create: () => MonteCarloPort
  /** I parametri del modello, clonabili (niente funzioni): il worker li riceve con ogni lotto. */
  params: unknown
  /** 'auto' (predefinito): passa al worker quando una replica supera thresholdMs; 'always': solo il worker. */
  mode?: 'auto' | 'always'
  /** Soglia di 'auto', in ms per replica; predefinita 50. */
  thresholdMs?: number
  /** Durata cercata di un lotto nel worker, in ms; predefinita 100. */
  batchMs?: number
}

export interface MonteCarloOptions<R> {
  /** Una replica: riceve il generatore a seme della replica e il suo indice (0, 1, 2…). Pura. */
  replicate: (rng: Rng, index: number) => R
  seed: number
  /** Millisecondi di calcolo per fotogramma; predefinito 8 (metà di un fotogramma a 60 Hz). */
  budgetMs?: number
  /** Repliche al più per fotogramma; predefinito nessun limite oltre al budget. */
  maxPerFrame?: number
  /** Tetto al totale delle repliche; predefinito 100 000. */
  maxTotal?: number
  /** Orologio (per i test); predefinito performance.now. Si legge solo dentro step(), cioè in un fotogramma. */
  now?: () => number
  /**
   * Calcolo in un Web Worker per le repliche lente (vedi SCELTE e monteCarloWorker.ts). La replica del worker deve
   * essere la stessa funzione di `replicate` con i parametri passati come dati: i numeri non devono cambiare.
   */
  worker?: MonteCarloWorkerOptions
}

export interface MonteCarloSnapshot {
  /** repliche fatte */
  count: number
  /** repliche chieste */
  target: number
  running: boolean
  seed: number
  /** sale a ogni pubblicazione: una dipendenza comoda per gli aggregati */
  version: number
  /** le repliche si calcolano nel worker */
  inWorker: boolean
}

export interface MonteCarloStore<R> {
  /** I risultati, nell'ordine delle repliche. Lo stesso array che cresce: non modificarlo. */
  readonly results: readonly R[]
  snapshot(): MonteCarloSnapshot
  subscribe(listener: () => void): () => void
  /** Chiede altre n repliche (+1, +100, +500). */
  run(n: number): void
  /** Chiede repliche fino a un totale. */
  runTo(total: number): void
  /** Si ferma a ciò che ha. */
  stop(): void
  /** Svuota; con un seme nuovo rifà un altro esperimento. */
  reset(seed?: number): void
  /** Un fotogramma: repliche finché c'è budget (o un lotto al worker). Restituisce quante ne ha fatte qui. */
  step(): number
  /** Aggiorna la replica (a ogni render), budget, modo di pubblicazione e parametri del modello per il worker. */
  configure(next: { replicate?: (rng: Rng, index: number) => R; budgetMs?: number; maxPerFrame?: number; publishAtEnd?: boolean; params?: unknown }): void
  /** Chiude il worker, se c'è (allo smontaggio). Lo store resta usabile: il worker rinasce se serve. */
  dispose(): void
}

const DEFAULT_BUDGET_MS = 8
const DEFAULT_MAX_TOTAL = 100_000
const DEFAULT_WORKER_THRESHOLD_MS = 50
const DEFAULT_WORKER_BATCH_MS = 100
/** Tetto alla misura di un lotto nel worker: una risposta resta un messaggio di dimensioni ragionevoli. */
const MAX_WORKER_BATCH = 10_000
const defaultNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/** Quante repliche fanno un lotto di circa `ms` millisecondi, a `perReplica` ms l'una. */
const batchFor = (ms: number, perReplica: number) => Math.min(MAX_WORKER_BATCH, Math.max(1, Math.round(ms / Math.max(perReplica, 1e-3))))

/** Lo store di un esperimento Monte Carlo, fuori da React. */
export function createMonteCarlo<R>(options: MonteCarloOptions<R>): MonteCarloStore<R> {
  let replicate = options.replicate
  let budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS
  let maxPerFrame = options.maxPerFrame ?? Number.POSITIVE_INFINITY
  let publishAtEnd = false
  const maxTotal = options.maxTotal ?? DEFAULT_MAX_TOTAL
  const now = options.now ?? defaultNow
  let seed = options.seed
  const results: R[] = []
  let target = 0
  let version = 0
  const listeners = new Set<() => void>()

  // --- worker ---
  const worker = options.worker
  const batchMs = worker?.batchMs ?? DEFAULT_WORKER_BATCH_MS
  let params = worker?.params
  let port: MonteCarloPort | null = null
  /** le repliche vanno nel worker: dall'inizio con 'always', dalla prima lenta con 'auto' */
  let inWorker = worker?.mode === 'always'
  /** il worker ha fallito: da qui in poi solo il thread principale, anche con repliche lente */
  let failed = false
  /** numero dell'ultimo lotto mandato e di quello in volo (0: nessuno) */
  let jobs = 0
  let inFlight = 0
  let batch = 1

  let snap: MonteCarloSnapshot = { count: 0, target: 0, running: false, seed, version, inWorker }

  const publish = () => {
    version++
    snap = { count: results.length, target, running: results.length < target, seed, version, inWorker }
    for (const l of [...listeners]) l()
  }

  const closePort = () => {
    port?.terminate()
    port = null
    inFlight = 0
  }

  /** Il worker non si carica o una replica fallisce lì: da qui in poi solo il thread principale. */
  const fail = () => {
    failed = true
    inWorker = false
    closePort()
    publish()
  }

  const receive = (ev: MessageEvent) => {
    const msg = ev.data as MonteCarloBatchReply<R>
    // una risposta vecchia: dopo Ferma o Reset, o di un lotto già scartato
    if (msg.job !== inFlight) return
    inFlight = 0
    if (msg.type === 'mc-error') {
      fail()
      return
    }
    if (msg.seed !== seed || msg.from !== results.length) return
    const room = Math.max(0, target - results.length)
    for (const r of msg.results.slice(0, room)) results.push(r)
    batch = batchFor(batchMs, msg.ms / Math.max(1, msg.results.length))
    if (!publishAtEnd || results.length >= target) publish()
  }

  /** Manda il prossimo lotto al worker, se nessuno è in volo. */
  const dispatch = () => {
    if (worker === undefined || inFlight !== 0) return
    if (port === null) {
      port = worker.create()
      port.onmessage = receive
      port.onerror = fail
    }
    jobs++
    inFlight = jobs
    const req: MonteCarloBatchRequest = { type: 'mc-batch', job: inFlight, seed, from: results.length, count: Math.max(1, Math.min(batch, target - results.length)), params }
    port.postMessage(req)
  }

  return {
    get results() {
      return results
    },
    snapshot: () => snap,
    subscribe(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    run(n) {
      if (!(n > 0)) return
      target = Math.min(maxTotal, target + Math.floor(n))
      publish()
    },
    runTo(total) {
      target = Math.min(maxTotal, Math.max(results.length, Math.floor(total)))
      publish()
    },
    stop() {
      target = results.length
      inFlight = 0
      publish()
    },
    reset(next) {
      if (next !== undefined) seed = next
      results.length = 0
      target = 0
      inFlight = 0
      publish()
    },
    step() {
      if (results.length >= target) return 0
      if (inWorker) {
        dispatch()
        return 0
      }
      const start = now()
      let done = 0
      // almeno una replica per fotogramma, poi finché restano budget e repliche da fare
      do {
        const i = results.length
        results.push(replicate(createRng(replicaSeed(seed, i)), i))
        done++
      } while (results.length < target && done < maxPerFrame && now() - start < budgetMs)
      // repliche più lente della soglia: il resto va nel worker, e la misura del primo lotto parte da qui
      const perReplica = (now() - start) / done
      const slow = worker !== undefined && !failed && perReplica > (worker.thresholdMs ?? DEFAULT_WORKER_THRESHOLD_MS)
      if (slow) {
        inWorker = true
        batch = batchFor(batchMs, perReplica)
      }
      if (!publishAtEnd || results.length >= target || slow) publish()
      return done
    },
    configure(next) {
      if (next.replicate !== undefined) replicate = next.replicate
      if (next.budgetMs !== undefined) budgetMs = next.budgetMs
      if (next.maxPerFrame !== undefined) maxPerFrame = next.maxPerFrame
      if (next.publishAtEnd !== undefined) publishAtEnd = next.publishAtEnd
      if ('params' in next) params = next.params
    },
    dispose: closePort,
  }
}

/** Media, varianza corretta (1/(n−1)), deviazione standard, errore standard e intervallo al 95% della media. */
export function summarize(values: readonly number[]): { n: number; mean: number; variance: number; std: number; sem: number; lo: number; hi: number } {
  const n = values.length
  if (n === 0) return { n, mean: Number.NaN, variance: Number.NaN, std: Number.NaN, sem: Number.NaN, lo: Number.NaN, hi: Number.NaN }
  let mean = 0
  for (const v of values) mean += v
  mean /= n
  let ss = 0
  for (const v of values) ss += (v - mean) ** 2
  const variance = n > 1 ? ss / (n - 1) : Number.NaN
  const std = Math.sqrt(variance)
  const sem = std / Math.sqrt(n)
  return { n, mean, variance, std, sem, lo: mean - 1.96 * sem, hi: mean + 1.96 * sem }
}

export interface MonteCarlo<R> extends MonteCarloSnapshot {
  results: readonly R[]
  run(n: number): void
  runTo(total: number): void
  stop(): void
  reset(seed?: number): void
}

/**
 * Un esperimento Monte Carlo in un componente. `replicate` può cambiare a ogni render (si usa sempre l'ultima), ma i
 * risultati già fatti restano: quando cambiano i parametri del modello cambia `resetKey` (o il seme) e l'esperimento
 * riparte da capo. Il ciclo di fotogrammi gira solo mentre ci sono repliche da fare e il widget è in vista.
 */
export function useMonteCarlo<R>(options: MonteCarloOptions<R> & { resetKey?: string }): MonteCarlo<R> {
  const reduced = useReducedMotion()
  const [store] = useState(() => createMonteCarlo(options))
  useLayoutEffect(() => {
    store.configure({ replicate: options.replicate, budgetMs: options.budgetMs, maxPerFrame: options.maxPerFrame, publishAtEnd: reduced, params: options.worker?.params })
  })
  // allo smontaggio il worker si chiude (rinasce da solo se il componente torna, come in StrictMode)
  useEffect(() => () => store.dispose(), [store])

  const snap = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
  useAnimationFrame(() => {
    store.step()
  }, snap.running)

  // parametri nuovi o seme nuovo: un altro esperimento
  const { resetKey, seed } = options
  const last = useRef({ resetKey, seed })
  useEffect(() => {
    if (last.current.resetKey === resetKey && last.current.seed === seed) return
    last.current = { resetKey, seed }
    store.reset(seed)
  }, [store, resetKey, seed])

  return useMemo(
    () => ({ ...snap, results: store.results, run: store.run, runTo: store.runTo, stop: store.stop, reset: store.reset }),
    [snap, store],
  )
}
