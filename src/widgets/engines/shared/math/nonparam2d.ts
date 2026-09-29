// Stima non parametrica della densità nel piano (density2d, classifier2d per le densità di classe, scene3d per la
// superficie K-NN). Tutto parte da p̂(x*) = K/(N·V):
// - finestra fissa (V fisso): si contano i K campioni nella cella di "raggio" r centrata in x*
// - K-NN (K fisso): la cella cresce fino al K-esimo vicino, r = r_K(x*), V = V(r_K)
// La cella ha tre forme, le palle delle tre norme: cerchio (L2, V = πr²), quadrato (L∞, V = (2r)²) e rombo
// (L1, V = 2r²). Parzen gaussiano sferico con σ unica o σ_k adattive (metodo di Specht, m09-m10).
//
// La logica viene da src/lib/ml/nonparam (spechtDensity, adaptiveSigmas, nearestNeighbors, parzen2d) e dai widget
// costruiti di m09 (griglia-normale-2d.ts, sigma-adattiva.ts), copiata qui senza toccarli: qui si aggiungono le
// norme L∞ e L1, le celle con i vicini ordinati e le griglie veloci per le mappe di calore.
// Casi limite come in src/lib/ml: nessun campione → stima 0; K > N → r = +∞ e stima 0; r_K = 0 → raggio minimo.
import { KNN_MIN_RADIUS, adaptiveSigmas, hypersphereVolume, nearestNeighbors, parzen2d, spechtDensity } from '../../../../lib/ml/nonparam'
import type { Neighbor } from '../../../../lib/ml/nonparam'
import { sampleGrid } from './grid'
import type { Grid2d } from './grid'
import type { Vec, Vec2 } from './types'

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)

export type { Neighbor }

/** Forma della cella: 'circle' ipersfera (L2), 'square' ipercubo (L∞), 'rhombus' rombo (L1). */
export type CellShape = 'circle' | 'square' | 'rhombus'
export const CELL_SHAPES: readonly CellShape[] = ['circle', 'square', 'rhombus']

/** Distanza nella norma della forma: L2 per il cerchio, L∞ per il quadrato, L1 per il rombo. */
export function shapeDistance(a: Vec, b: Vec, shape: CellShape): number {
  if (a.length !== b.length) throw err('shapeDistance', `punti di dimensioni diverse (${a.length} e ${b.length})`)
  let s = 0
  for (let j = 0; j < a.length; j++) {
    const d = Math.abs(a[j] - b[j])
    if (shape === 'circle') s += d * d
    else if (shape === 'square') s = Math.max(s, d)
    else s += d
  }
  return shape === 'circle' ? Math.sqrt(s) : s
}

/** Volume della palla di raggio r nella norma della forma, in n dimensioni (2-D: πr², (2r)², 2r²). */
export function cellVolume(r: number, shape: CellShape, n = 2): number {
  if (!(r >= 0)) throw err('cellVolume', `il raggio deve essere ≥ 0 (ricevuto ${r})`)
  if (shape === 'circle') return hypersphereVolume(n, r)
  if (shape === 'square') return (2 * r) ** n
  // palla L1: (2r)ⁿ / n!
  let f = 1
  for (let k = 2; k <= n; k++) f *= k
  return (2 * r) ** n / f
}

/** K: campioni nella cella chiusa di raggio r centrata in x (bordo incluso). */
export function windowCount(x: Vec, samples: readonly Vec[], r: number, shape: CellShape = 'circle'): number {
  let K = 0
  for (const p of samples) if (shapeDistance(x, p, shape) <= r) K++
  return K
}

/** Stima a finestra fissa: K campioni nella cella di raggio r, V della cella, p̂ = K/(N·V). Nessun campione: p̂ = 0. */
export function windowDensity(x: Vec, samples: readonly Vec[], r: number, shape: CellShape = 'circle'): { K: number; V: number; p: number } {
  const K = windowCount(x, samples, r, shape)
  const V = cellVolume(r, shape, x.length)
  return { K, V, p: samples.length === 0 || V === 0 ? 0 : K / (samples.length * V) }
}

/** Oltre questa K si ordina tutto invece di tenere un buffer dei migliori (come in src/lib/ml/nonparam). */
const SELECT_MAX_K = 64

/** I k più vicini fra `count` campioni, dati dalla loro distanza; a pari distanza passa l'indice minore. */
function selectNearest(count: number, distanceOf: (i: number) => number, k: number): Neighbor[] {
  const m = Math.min(k, count)
  if (m === 0) return []
  if (k > SELECT_MAX_K) {
    const all = Array.from({ length: count }, (_, i) => ({ index: i, distance: distanceOf(i) }))
    all.sort((p, q) => p.distance - q.distance || p.index - q.index)
    return all.slice(0, m)
  }
  const idx = new Int32Array(m)
  const dist = new Float64Array(m)
  let size = 0
  for (let i = 0; i < count; i++) {
    const d = distanceOf(i)
    if (size === m) {
      if (!(d < dist[m - 1])) continue
      size--
    }
    let j = size
    while (j > 0 && dist[j - 1] > d) {
      dist[j] = dist[j - 1]
      idx[j] = idx[j - 1]
      j--
    }
    dist[j] = d
    idx[j] = i
    size++
  }
  return Array.from({ length: size }, (_, j) => ({ index: idx[j], distance: dist[j] }))
}

export interface KnnCell {
  /** r_K(x*): distanza del K-esimo vicino nella norma della forma; +∞ se K > N */
  r: number
  /** volume della cella V(r_K) */
  V: number
  /** p̂(x*) = K/(N·V); 0 se K > N */
  p: number
  /** i K vicini dal più vicino, con l'indice nell'array dei campioni: si accendono 1…K mentre la cella cresce */
  neighbors: Neighbor[]
}

/**
 * La cella K-NN centrata in x*, che cresce fino al K-esimo vicino. Con 'circle' coincide con knnRadius2d e
 * knnDensity2d di src/lib/ml/nonparam. r_K = 0 (x* sopra K campioni): nel volume il raggio si ferma a `minRadius`.
 */
export function knnCell(x: Vec, samples: readonly Vec[], k: number, shape: CellShape = 'circle', minRadius = KNN_MIN_RADIUS): KnnCell {
  if (!Number.isInteger(k) || k < 1) throw err('knnCell', `K deve essere un intero ≥ 1 (ricevuto ${k})`)
  const neighbors = selectNearest(samples.length, (i) => shapeDistance(x, samples[i], shape), k)
  if (k > samples.length) return { r: Number.POSITIVE_INFINITY, V: Number.POSITIVE_INFINITY, p: 0, neighbors }
  const r = neighbors[k - 1].distance
  const V = cellVolume(Math.max(r, minRadius), shape, x.length)
  return { r, V, p: k / samples.length / V, neighbors }
}

/** Parzen gaussiano a simmetria sferica (Specht): σ unica o una σ_k per campione. Uguale a spechtDensity. */
export const parzenGauss = (x: Vec, samples: readonly Vec[], sigma: number | readonly number[]): number => spechtDensity(x, samples, sigma)

/** Parzen con finestra quadrata di lato h (l'ipercubo del corso): p̂ = K/(N h²). */
export const parzenBox2d = (x: Vec2, samples: readonly Vec[], h: number): number => parzen2d(x, samples, h, 'rettangolare')

/**
 * Parzen gaussiano sferico sui nodi di una griglia, veloce per le mappe di calore: termini con esponente oltre 40
 * (e^{−40} ≈ 4e−18 del picco del kernel) saltati.
 */
export function parzenGaussGrid(
  samples: readonly Vec[],
  sigma: number | readonly number[],
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
  nx: number,
  ny = nx,
): Grid2d {
  const N = samples.length
  const sig = typeof sigma === 'number' ? new Array<number>(N).fill(sigma) : [...sigma]
  if (sig.length !== N) throw err('parzenGaussGrid', `servono ${N} valori di σ_k, ricevuti ${sig.length}`)
  if (sig.some((s) => !(Number.isFinite(s) && s > 0))) throw err('parzenGaussGrid', 'ogni σ deve essere finita e > 0')
  const px = samples.map((p) => p[0])
  const py = samples.map((p) => p[1])
  const inv2 = sig.map((s) => 1 / (2 * s * s))
  const coef = sig.map((s) => 1 / (N * 2 * Math.PI * s * s))
  return sampleGrid(
    (x, y) => {
      let s = 0
      for (let k = 0; k < N; k++) {
        const e = ((x - px[k]) ** 2 + (y - py[k]) ** 2) * inv2[k]
        if (e < 40) s += coef[k] * Math.exp(-e)
      }
      return s
    },
    xDomain,
    yDomain,
    nx,
    ny,
  )
}

/** Stima K-NN sui nodi di una griglia (mappa di calore, superficie K-NN di scene3d). */
export function knnGrid(
  samples: readonly Vec[],
  k: number,
  shape: CellShape,
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
  nx: number,
  ny = nx,
): Grid2d {
  return sampleGrid((x, y) => knnCell([x, y], samples, k, shape).p, xDomain, yDomain, nx, ny)
}

/** Stima a finestra fissa sui nodi di una griglia. */
export function windowGrid(
  samples: readonly Vec[],
  r: number,
  shape: CellShape,
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
  nx: number,
  ny = nx,
): Grid2d {
  return sampleGrid((x, y) => windowDensity([x, y], samples, r, shape).p, xDomain, yDomain, nx, ny)
}

/** σ_k = (1/L) Σ_l ‖x_k − y_l‖ sui suoi L vicini (sé escluso): è adaptiveSigmas di src/lib/ml. */
export const adaptiveSigmas2d = (samples: readonly Vec[], L: number): number[] => adaptiveSigmas(samples, L)

/** Gli L vicini del campione k fra gli altri, con le distanze: i segmenti del calcolo di σ_k. Indici nell'array originale. */
export function neighborsOfSample(samples: readonly Vec[], k: number, L: number): Neighbor[] {
  const others = samples.map((p, i) => ({ p, i })).filter((o) => o.i !== k)
  if (others.length === 0) return []
  return nearestNeighbors(samples[k], others.map((o) => o.p), Math.min(L, others.length)).map((nb) => ({ index: others[nb.index].i, distance: nb.distance }))
}

/** Legge della larghezza con N: h_N = h₁ / N^a (a = ½ la radice, a = 1/(2n) quella consistente in n dimensioni). */
export const bandwidthLaw = (h1: number, N: number, exponent: number): number => h1 * N ** -exponent

/** Dove va una potenza N^e per N → +∞: a zero (e < 0), costante (e = 0), a +∞ (e > 0). */
export type PowerLimit = 'zero' | 'const' | 'inf'

const powerLimit = (e: number): PowerLimit => (Math.abs(e) < 1e-12 ? 'const' : e < 0 ? 'zero' : 'inf')

/**
 * Le due condizioni di consistenza della slide p61 per la legge h_N = h₁ N^{−a} in n dimensioni (dalla logica di
 * m09-griglia-normale-2d): h_N → 0 se a > 0, N·h_Nⁿ = h₁ⁿ N^{1 − na} → +∞ se a < 1/n; consistente solo con entrambe.
 * In 2-D: h₁/N le viola (N h² → 0), h₁/√N tiene N h² costante, h₁/N^{1/4} le soddisfa.
 */
export function bandwidthLimits(a: number, n: number): { h: PowerLimit; nhn: PowerLimit; consistent: boolean } {
  const h = powerLimit(-a)
  const nhn = powerLimit(1 - n * a)
  return { h, nhn, consistent: h === 'zero' && nhn === 'inf' }
}

/** Altezza del picco di un kernel gaussiano sferico 2-D di peso 1/N: 1/(N·2πσ²) (l'ago di un σ_k piccolissimo). */
export const kernelPeak2d = (sigma: number, N: number): number => 1 / (N * 2 * Math.PI * sigma * sigma)

/** Indici dei kernel che diventano aghi spuri: σ_k sotto la soglia (campioni quasi coincidenti con L piccolo). */
export const needleKernels = (sigmas: readonly number[], threshold: number): number[] =>
  sigmas.flatMap((s, i) => (s < threshold ? [i] : []))

/**
 * Il più piccolo L in [Lmin, Lmax] per cui nessuna σ_k adattiva scende sotto la soglia (dalla sfida di
 * m09-sigma-adattiva). Lmax predefinito N − 1 (tutti gli altri campioni). null se nessun L dell'intervallo basta.
 */
export function minimalL(samples: readonly Vec[], threshold: number, Lmax = samples.length - 1, Lmin = 1): number | null {
  if (samples.length < 2) throw err('minimalL', 'servono almeno due campioni')
  for (let L = Math.max(1, Lmin); L <= Math.min(Lmax, samples.length - 1); L++) {
    if (needleKernels(adaptiveSigmas(samples, L), threshold).length === 0) return L
  }
  return null
}

/** Normalizzazione delle feature z_j = (x_j − m_j)/σ_j (σ con 1/N): i punti, le medie e le deviazioni per tornare indietro. */
export function standardize(points: readonly Vec2[]): { points: Vec2[]; mean: Vec2; sd: Vec2 } {
  const N = points.length
  if (N === 0) return { points: [], mean: [0, 0], sd: [1, 1] }
  const m0 = points.reduce((s, p) => s + p[0], 0) / N
  const m1 = points.reduce((s, p) => s + p[1], 0) / N
  const s0 = Math.sqrt(points.reduce((s, p) => s + (p[0] - m0) ** 2, 0) / N) || 1
  const s1 = Math.sqrt(points.reduce((s, p) => s + (p[1] - m1) ** 2, 0) / N) || 1
  return { points: points.map((p) => [(p[0] - m0) / s0, (p[1] - m1) / s1] as const), mean: [m0, m1], sd: [s0, s1] }
}
