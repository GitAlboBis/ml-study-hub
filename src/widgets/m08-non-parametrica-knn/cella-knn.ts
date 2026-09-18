// Logica del widget "La cella che si espande fino a K pesci" (m08, slide 47 di Melgani, Cap. 2).
// Niente React qui: dati del nastro, stato della cella K-NN in un punto, tempi dell'espansione animata,
// mappe veloci per il terreno, voto del classificatore, le due sfide e il piano isotropo.
//
// SCELTE
// - Il piano è (larghezza, luminosità) e non il contrario: la cella è un cerchio nello spazio delle feature,
//   quindi i due assi devono avere la stessa scala (px per unità), altrimenti il cerchio diventerebbe
//   un'ellisse e mentirebbe sulla distanza euclidea. Con la larghezza (15 cm utili) in orizzontale e la
//   luminosità (scala 0-10) in verticale il rapporto dei lati è quello di un terreno largo (isoDomains).
// - Il nastro esce da fishDataset con un seed fisso; si tengono i pesci con larghezza dentro
//   l'inquadratura WIDTH_WINDOW (ne cade circa uno su quattrocento), così ogni campione che vota è anche visibile.
// - Le mappe (densità su 64 × 40 punti, regioni di decisione su 80 × 50) non ordinano le N distanze in ogni
//   punto: selezionano i K più vicini con il metodo di Wirth, O(N) in media. Stesso ordine totale di
//   nearestNeighbors (distanza, poi indice), quindi stessi vicini e stessi spareggi di knnVote: lo verificano i test.
import { fishDataset, fishDensity } from '../../lib/datasets/fish'
import { hypersphereVolume, KNN_MIN_RADIUS, knnDensity2d, knnVote, nearestNeighbors } from '../../lib/ml/nonparam'
import { createRng } from '../../lib/rng'
import type { StoryboardStep } from '../kit/useStoryboard'

export type ClassId = 0 | 1
export type Vec2 = readonly [number, number]

/** Un pesce di training: p = [larghezza in cm, luminosità in scala 0-10]. */
export interface Fish {
  id: string
  p: Vec2
  cls: ClassId
}

export const SEED = 8
export const POOL_PER_CLASS = 200
export const N_RANGE = [20, 200] as const
export const N_DEFAULT = 60
export const K_MAX = 40
export const K_DEFAULT = 5
/** Inquadratura della telecamera sulla larghezza: i pesci fuori non entrano nel nastro. */
export const WIDTH_WINDOW = [10.5, 25.5] as const
export const LUM_RANGE = [0, 10] as const
export const CLASS_NAMES = ['salmone', 'spigola'] as const
export const CLASS_NAMES_EN = ['salmon', 'sea bass'] as const
export const FEATURES = ['larghezza', 'luminosita'] as const
/** Posizione iniziale di x*: nella nuvola dei salmoni, verso il bordo. */
export const X_START: Vec2 = [17.5, 4]

// --- il nastro ---

/** Pesci del nastro, POOL_PER_CLASS per classe, nell'ordine di arrivo. Deterministico (seed fisso). */
export function buildPool(seed = SEED): Record<ClassId, Fish[]> {
  // 440 pesci: tolti quelli fuori inquadratura ne restano sempre almeno 200 per classe (lo controlla il test)
  const raw = fishDataset(createRng(seed), { n: 440, features: FEATURES })
  const out: Record<ClassId, Fish[]> = { 0: [], 1: [] }
  for (const f of raw) {
    const [w, l] = f.x
    if (w < WIDTH_WINDOW[0] || w > WIDTH_WINDOW[1]) continue
    const list = out[f.y]
    if (list.length < POOL_PER_CLASS) list.push({ id: `${CLASS_NAMES[f.y]}-${list.length}`, p: [w, l], cls: f.y })
  }
  return out
}

/** Training set: i primi n salmoni e le prime n spigole (prima i salmoni). Crescere n aggiunge pesci, non li cambia. */
export function trainingSet(pool: Record<ClassId, readonly Fish[]>, n: number): Fish[] {
  return [...pool[0].slice(0, n), ...pool[1].slice(0, n)]
}

export const ofClass = (train: readonly Fish[], cls: ClassId): Fish[] => train.filter((f) => f.cls === cls)

const dist = (a: Vec2, b: Vec2) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)

// --- la cella K-NN in un punto ---

export interface Neighbor {
  id: string
  /** posizione del campione nell'array passato */
  index: number
  distance: number
  cls: ClassId
  /** coordinate del campione nel piano */
  p: Vec2
}

const asNeighbor = (samples: readonly Fish[], nb: { index: number; distance: number }): Neighbor => {
  const f = samples[nb.index]
  return { id: f.id, index: nb.index, distance: nb.distance, cls: f.cls, p: f.p }
}

export interface CellState {
  K: number
  N: number
  /** i vicini in ordine di distanza: i primi K e, se c'è, il (K+1)-esimo (serve alla previsione del raggio) */
  neighbors: Neighbor[]
  /** r_K(x*): distanza del K-esimo vicino; +∞ se K > N */
  rK: number
  /** V_K(x*) = π r_K² */
  V: number
  /** p̂(x*) = K / (N·V_K(x*)) */
  p: number
}

export function cellState(x: Vec2, samples: readonly Fish[], K: number): CellState {
  const N = samples.length
  const pts = samples.map((f) => f.p)
  const neighbors = N === 0 ? [] : nearestNeighbors(x, pts, K + 1).map((nb) => asNeighbor(samples, nb))
  const rK = K <= N ? neighbors[K - 1].distance : Number.POSITIVE_INFINITY
  const V = Number.isFinite(rK) ? hypersphereVolume(2, rK) : Number.POSITIVE_INFINITY
  return { K, N, neighbors, rK, V, p: N === 0 ? 0 : knnDensity2d(x, pts, K) }
}

// --- l'espansione animata ---

/** Raggio della cella a una frazione t dell'espansione: velocità costante, da 0 a r_K. */
export const expansionRadius = (t: number, rK: number): number => rK * Math.min(Math.max(t, 0), 1)

/** Frazione dell'espansione in cui la cella tocca un campione a distanza d. */
export const touchTime = (d: number, rK: number): number => (rK > 0 && Number.isFinite(rK) ? Math.min(d / rK, 1) : 0)

/** Quanti dei primi K vicini (ordinati) sono dentro la cella di raggio r. */
export function litCount(neighbors: readonly Neighbor[], r: number, K: number): number {
  const reach = r * (1 + 1e-12) + 1e-15
  let n = 0
  for (let j = 0; j < Math.min(K, neighbors.length); j++) {
    if (neighbors[j].distance > reach) break
    n++
  }
  return n
}

/** Durata dell'espansione a velocità 1: circa 180 ms per vicino, fra 0.9 e 4.2 s. */
export const expansionMs = (K: number): number => Math.min(4200, 700 + 180 * K)

/** Durata dell'impulso emesso da ogni campione toccato dalla cella. */
export const PULSE_MS = 220

export function densitySteps(K: number): StoryboardStep[] {
  return [
    { id: 'punto', label: 'Il punto x* e i campioni', durationMs: 900 },
    { id: 'espansione', label: 'La cella si espande', durationMs: expansionMs(K) },
    { id: 'raggio', label: 'Il raggio e il volume della cella', durationMs: 900 },
    { id: 'stima', label: 'La stima nel punto x*', durationMs: 900 },
    { id: 'mappa', label: 'Ripetuta in ogni punto: la mappa', durationMs: 1100 },
  ]
}

export function classifierSteps(K: number): StoryboardStep[] {
  return [
    { id: 'punto', label: 'Il pesce da classificare', durationMs: 900 },
    { id: 'espansione', label: 'La cella cresce fino a K pesci', durationMs: expansionMs(K) },
    { id: 'voto', label: 'Il voto dei K vicini', durationMs: 1000 },
    { id: 'regioni', label: 'Ripetuto in ogni punto: le regioni di decisione', durationMs: 1100 },
  ]
}

/** Indici dei passi, uguali nei due storyboard fino al terzo. */
export const STEP = { punto: 0, espansione: 1, raggio: 2, voto: 2, stima: 3 } as const

// --- la formula viva ---

type Shown = number | string | undefined

/**
 * Valori della formula della densità al passo `index`: K e N sono noti da subito, r_K e V_K arrivano con il
 * righello (passo 3), p̂ con la stima (passo 4). In modalità previsione le misure restano "?" finché non si controlla.
 */
export function densityValues(cell: CellState, index: number, hidden: boolean): { K: Shown; N: Shown; r: Shown; V: Shown; p: Shown } {
  const measured = (from: number, v: number): Shown => (hidden ? '?' : index >= from ? v : undefined)
  return { K: cell.K, N: cell.N, r: measured(STEP.raggio, cell.rK), V: measured(STEP.raggio, cell.V), p: measured(STEP.stima, cell.p) }
}

// --- il classificatore ---

export interface VoteState {
  K: number
  /** voti dei salmoni (ω₁) e delle spigole (ω₂) fra i K vicini */
  K1: number
  K2: number
  /** P̂(ω_i | x*) = K_i / K */
  P1: number
  P2: number
  label: ClassId
  tie: boolean
  neighbors: Neighbor[]
}

export function voteState(x: Vec2, train: readonly Fish[], K: number): VoteState {
  const v = knnVote(x, train.map((f) => ({ x: f.p, y: f.cls })), K)
  const neighbors = v.neighbors.map((nb) => asNeighbor(train, nb))
  const K1 = neighbors.filter((nb) => nb.cls === 0).length
  const Kn = neighbors.length
  return { K: Kn, K1, K2: Kn - K1, P1: K1 / Kn, P2: (Kn - K1) / Kn, label: v.label === 0 ? 0 : 1, tie: v.tie, neighbors }
}

/** Valori della formula del voto: i conteggi e le posterior arrivano con il passo del voto. */
export function voteValues(v: VoteState, index: number): { K: Shown; K1: Shown; K2: Shown; P1: Shown; P2: Shown } {
  const after = (x: number): Shown => (index >= STEP.voto ? x : undefined)
  return { K: v.K, K1: after(v.K1), K2: after(v.K2), P1: after(v.P1), P2: after(v.P2) }
}

// --- mappe veloci ---

/**
 * Selezione di Wirth: riordina idx[0..n-1] in modo che i primi k siano i k più vicini (in ordine qualsiasi).
 * L'ordine è quello di nearestNeighbors: distanza, poi indice, quindi totale e senza pari merito.
 */
function selectNearest(idx: Int32Array, d: Float64Array, n: number, k: number): void {
  const kth = k - 1
  let lo = 0
  let hi = n - 1
  while (lo < hi) {
    const pv = idx[kth]
    const pd = d[pv]
    let i = lo
    let j = hi
    do {
      while (d[idx[i]] < pd || (d[idx[i]] === pd && idx[i] < pv)) i++
      while (pd < d[idx[j]] || (pd === d[idx[j]] && pv < idx[j])) j--
      if (i <= j) {
        const t = idx[i]
        idx[i] = idx[j]
        idx[j] = t
        i++
        j--
      }
    } while (i <= j)
    if (j < kth) lo = i
    if (kth < i) hi = j
  }
}

function buffers(samples: readonly Fish[]) {
  const n = samples.length
  const xs = Float64Array.from(samples, (f) => f.p[0])
  const ys = Float64Array.from(samples, (f) => f.p[1])
  const d = new Float64Array(n)
  const idx = new Int32Array(n)
  /** distanze al quadrato da (x, y) e indici in ordine */
  const fill = (x: number, y: number) => {
    for (let i = 0; i < n; i++) {
      d[i] = (x - xs[i]) ** 2 + (y - ys[i]) ** 2
      idx[i] = i
    }
  }
  return { n, d, idx, fill }
}

/** p̂(x) = K/(N·π r_K²) come funzione del piano, per FieldCanvas e Contours. Stessi valori di knnDensity2d. */
export function makeDensityField(samples: readonly Fish[], K: number): (x: number, y: number) => number {
  const { n, d, idx, fill } = buffers(samples)
  return (x, y) => {
    if (n === 0 || K > n) return 0
    fill(x, y)
    selectNearest(idx, d, n, K)
    let r2 = 0
    for (let j = 0; j < K; j++) if (d[idx[j]] > r2) r2 = d[idx[j]]
    const r = Math.sqrt(r2)
    return K / (n * Math.PI * Math.max(r, KNN_MIN_RADIUS) ** 2)
  }
}

/** Classe decisa dal voto dei K vicini in ogni punto del piano, per BoundaryCanvas. Stesse regole di knnVote. */
export function makeClassifier(train: readonly Fish[], K: number): (x: number, y: number) => number {
  const { n, d, idx, fill } = buffers(train)
  const labels = Int8Array.from(train, (f) => f.cls)
  return (x, y) => {
    if (n === 0) return -1
    const k = Math.min(K, n)
    fill(x, y)
    selectNearest(idx, d, n, k)
    let c0 = 0
    let nearest = idx[0]
    for (let j = 0; j < k; j++) {
      const i = idx[j]
      if (labels[i] === 0) c0++
      if (d[i] < d[nearest] || (d[i] === d[nearest] && i < nearest)) nearest = i
    }
    if (2 * c0 > k) return 0
    if (2 * c0 < k) return 1
    // parità: vince la classe del vicino più vicino; a pari distanza l'etichetta più piccola (come knnVote)
    for (let j = 0; j < k; j++) if (d[idx[j]] === d[nearest] && labels[idx[j]] === 0) return 0
    return 1
  }
}

/**
 * Tetto della rampa di colore: il quantile q dei valori del campo su una griglia grossolana. Con K piccolo la stima
 * ha aghi altissimi sui campioni (r_K → 0): usando il massimo, tutto il resto finirebbe nella prima banda.
 */
export function robustPeak(field: (x: number, y: number) => number, xDomain: readonly [number, number], yDomain: readonly [number, number], cols = 48, rows = 32, q = 0.97): number {
  const values: number[] = []
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const v = field(xDomain[0] + ((i + 0.5) * (xDomain[1] - xDomain[0])) / cols, yDomain[0] + ((j + 0.5) * (yDomain[1] - yDomain[0])) / rows)
      if (Number.isFinite(v)) values.push(v)
    }
  }
  values.sort((a, b) => a - b)
  const v = values[Math.floor(q * (values.length - 1))] ?? 0
  return v > 0 ? v : 1e-9
}

/** K "grande" del confronto: metà dei campioni che contano; dispari nel classificatore, per non avere parità. */
export function bigK(mode: 'densita' | 'classificatore', N: number): number {
  if (mode === 'densita') return Math.max(1, Math.round(N / 2))
  return N % 2 === 1 ? N : N - 1
}

/** Lunghezza in px dello spillo della stima in x*: proporzionale a p̂, con un tetto (i picchi oltre il tetto si fermano lì). */
export const spikeLength = (p: number, peak: number, maxPx: number): number => (peak > 0 ? maxPx * Math.min(1, p / peak) : 0)

export interface TrailPoint {
  x: number
  y: number
  p: number
}

/** La scia della stima: un punto nuovo solo se x* si è spostato di almeno minMove; al più max punti, i più recenti. */
export function addToTrail(trail: readonly TrailPoint[], point: TrailPoint, minMove = 0.4, max = 32): TrailPoint[] {
  const last = trail.at(-1)
  if (last !== undefined && Math.hypot(point.x - last.x, point.y - last.y) < minMove) return trail as TrailPoint[]
  return [...trail, point].slice(-max)
}

// --- sfida: i pesci misteriosi ---

/**
 * Due pesci sul nastro, di classe ignota. Posizioni scelte (con N = 60 per classe) perché il K giusto non sia
 * né troppo piccolo né troppo grande: A è circondato da qualche salmone fuori posto e con K piccolo finisce fra
 * i salmoni (overfitting); B è un salmone largo vicino alla nuvola delle spigole e con K grande la cella pesca
 * nelle spigole (oversmoothing). Solo K da 9 a 17 li classifica bene entrambi.
 */
export const MYSTERY: readonly { id: 'A' | 'B'; p: Vec2 }[] = [
  { id: 'A', p: [18.75, 6] },
  { id: 'B', p: [20.75, 4.25] },
]
export const MYSTERY_N = N_DEFAULT

const trueSalmon = fishDensity('salmone', FEATURES)
const trueSeaBass = fishDensity('spigola', FEATURES)

/** Classe giusta: la regola di Bayes con le densità vere del modello e prior uguali (N uguali per classe). */
export const bayesLabel = (p: Vec2): ClassId => (trueSalmon([p[0], p[1]]) >= trueSeaBass([p[0], p[1]]) ? 0 : 1)

export interface MysteryVerdict {
  id: 'A' | 'B'
  truth: ClassId
  label: ClassId
  tie: boolean
  correct: boolean
  K1: number
  K2: number
}

export function judgeMystery(train: readonly Fish[], K: number): { ok: boolean; verdicts: MysteryVerdict[] } {
  const verdicts = MYSTERY.map((m) => {
    const truth = bayesLabel(m.p)
    const v = voteState(m.p, train, K)
    return { id: m.id, truth, label: v.label, tie: v.tie, correct: v.label === truth && !v.tie, K1: v.K1, K2: v.K2 }
  })
  return { ok: verdicts.every((v) => v.correct), verdicts }
}

// --- la previsione del raggio ---

export const PREDICTION_TOLERANCE = 0.2
export const STREAK_TARGET = 3
/** Una previsione conta per la serie solo se x* si è spostato almeno di tanto dalla precedente riuscita. */
export const STREAK_MIN_MOVE = 0.75

export interface PredictionVerdict {
  /** pesci dentro la cella prevista di raggio r̂ */
  inside: number
  /** stima con la cella prevista: K / (N π r̂²) */
  pGuess: number
  /** stima vera K / (N·V_K) */
  p: number
  relErr: number
  /** la cella prevista contiene esattamente K pesci e la stima cade entro il 20% */
  ok: boolean
}

export function judgePrediction(x: Vec2, samples: readonly Fish[], K: number, rGuess: number): PredictionVerdict {
  const N = samples.length
  let inside = 0
  for (const f of samples) if (dist(x, f.p) <= rGuess) inside++
  const { p } = cellState(x, samples, K)
  const pGuess = rGuess > 0 && N > 0 ? K / (N * Math.PI * rGuess ** 2) : Number.POSITIVE_INFINITY
  const relErr = p > 0 ? Math.abs(pGuess - p) / p : Number.POSITIVE_INFINITY
  return { inside, pGuess, p, relErr, ok: inside === K && relErr <= PREDICTION_TOLERANCE }
}

// --- il piano isotropo ---

/**
 * Domini del piano per un'area interna di innerW × innerH px con la stessa scala sui due assi: tutta la
 * luminosità (0-10) e tutta l'inquadratura della larghezza restano visibili, lo spazio in più va ai margini.
 */
export function isoDomains(innerW: number, innerH: number): { x: [number, number]; y: [number, number] } {
  const ratio = innerW > 0 && innerH > 0 ? innerW / innerH : 1.5
  const minX = WIDTH_WINDOW[1] - WIDTH_WINDOW[0]
  const minY = LUM_RANGE[1] - LUM_RANGE[0]
  let xSpan = minY * ratio
  let ySpan = minY
  if (xSpan < minX) {
    xSpan = minX
    ySpan = minX / ratio
  }
  const cx = (WIDTH_WINDOW[0] + WIDTH_WINDOW[1]) / 2
  const cy = (LUM_RANGE[0] + LUM_RANGE[1]) / 2
  return { x: [cx - xSpan / 2, cx + xSpan / 2], y: [cy - ySpan / 2, cy + ySpan / 2] }
}

// --- il canale dei fotogrammi ---

export interface FrameSnapshot {
  progress: number
  index: number
}

export interface FrameChannel {
  get(): FrameSnapshot
  set(progress: number, index: number): void
  subscribe(listener: () => void): () => void
}

/**
 * Il tempo dello storyboard per i soli strati animati: useStoryboard lo consegna con onFrame, fuori da React,
 * e qui lo leggono con useSyncExternalStore solo i componenti che disegnano la cella. Così a ogni fotogramma si
 * ridisegnano loro, non il widget intero con i suoi controlli e le mappe.
 */
export function createFrameChannel(initial: FrameSnapshot = { progress: 0, index: 0 }): FrameChannel {
  let snap = initial
  const listeners = new Set<() => void>()
  return {
    get: () => snap,
    set(progress, index) {
      if (snap.progress === progress && snap.index === index) return
      snap = { progress, index }
      for (const listener of [...listeners]) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
