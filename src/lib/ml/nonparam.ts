import { logGamma, trapz } from './stats'
import type { Vec } from './stats'

// Stima non parametrica della pdf (Melgani, Cap. 2): tutto parte da p̂(x*) = K / (N·V).
// - Parzen fissa la regione (ipercubo di lato h, V = hⁿ) e conta K: p̂(x) = (1/N) Σ_k (1/hⁿ) γ((x − x_k)/h)
// - K-NN fissa K e fa crescere la cella fino al K-esimo vicino: p̂(x*) = K / (N·V_K(x*)), V_K = 2r_K in 1-D, πr_K² in 2-D
//
// Casi limite, decisi una volta per tutte (stesse regole di stats.ts):
// - parametri non validi (h ≤ 0, K non intero o < 1, dimensioni diverse): RangeError
// - nessun campione: le stime di densità valgono 0 (nessuna evidenza, il tracciato resta disegnabile);
//   il classificatore invece non ha niente da votare e lancia RangeError
// - K > N nella stima K-NN: la cella non arriva mai a K campioni, r_K = +∞, V = +∞ e la stima è 0
// - r_K = 0 (x* coincide con almeno K campioni): la formula divergerebbe. Non si restituisce Infinity: il raggio
//   viene fermato a `minRadius` (default KNN_MIN_RADIUS) e il valore resta finito, enorme ma disegnabile.
//   Chi vuole riconoscere il caso degenere controlla knnRadius1d / knnRadius2d === 0.
// - nessuna densità restituisce Infinity, nemmeno con h, σ o minRadius sub-normali: il valore si ferma a Number.MAX_VALUE
// - un campione non finito (NaN, ±Infinity) è un errore di chi chiama: RangeError, in qualunque posizione dell'array.
//   Lo stesso vale per il punto interrogato del K-NN. Nelle stime di Parzen invece un x non finito passa: ±∞ dà 0
//   (il limite vero) e NaN dà NaN, mai un numero inventato.

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)
const positive = (v: number) => Number.isFinite(v) && v > 0
const checkH = (fn: string, h: number) => {
  if (!positive(h)) throw err(fn, `la larghezza h deve essere finita e > 0 (ricevuto ${h})`)
}
const checkK = (fn: string, k: number, name = 'K') => {
  if (!Number.isInteger(k) || k < 1) throw err(fn, `${name} deve essere un intero ≥ 1 (ricevuto ${k})`)
}
const checkDim = (fn: string, p: Vec, n: number) => {
  if (p.length !== n) throw err(fn, `atteso un punto a ${n} dimensioni, ricevuto a ${p.length}`)
}
const checkFinite = (fn: string, v: number, what = 'un campione') => {
  if (!Number.isFinite(v)) throw err(fn, `${what} non è finito (${v}): un valore NaN o infinito è un errore di chi chiama`)
}
/** Dimensione giusta e coordinate tutte finite. */
const checkPoint = (fn: string, p: Vec, n: number) => {
  checkDim(fn, p, n)
  for (let j = 0; j < n; j++) checkFinite(fn, p[j])
}
/** Una densità non restituisce mai Infinity: con larghezze sub-normali si ferma al double più grande. */
const cap = (v: number) => (v > Number.MAX_VALUE ? Number.MAX_VALUE : v)

const euclid = (a: Vec, b: Vec) => {
  let s = 0
  for (let j = 0; j < a.length; j++) s += (a[j] - b[j]) ** 2
  return Math.sqrt(s)
}

// --- funzioni finestra (kernel) ---

/**
 * I kernel del corso. Slide: rettangolare, triangolare, gaussiano, esponenziale, Cauchy, sinc².
 * Note del docente: anche Epanechnikov, citato senza formula (qui nella forma standard di letteratura).
 */
export type Kernel = 'rettangolare' | 'triangolare' | 'gaussiano' | 'epanechnikov' | 'esponenziale' | 'cauchy' | 'sinc2'

export const KERNELS: readonly Kernel[] = ['rettangolare', 'triangolare', 'gaussiano', 'epanechnikov', 'esponenziale', 'cauchy', 'sinc2']

/**
 * Funzione finestra γ(u) in una dimensione, con u = (x − x_k)/h già normalizzato. Ogni γ è essa stessa una densità
 * (γ ≥ 0, ∫γ = 1), è pari e ha il massimo nell'origine, quindi sup γ = γ(0).
 *
 * - rettangolare  Π(u) = 1 per |u| ≤ 1/2 (bordo incluso), 0 altrove: supporto largo 1, cioè una finestra di lato h.
 *                 Il confronto è esatto: un campione a distanza h/2 può finire dentro o fuori per l'arrotondamento di (x − x_k)/h
 * - triangolare   Λ(u) = 1 − |u| per |u| ≤ 1
 * - gaussiano     exp(−u²/2) / √(2π)
 * - epanechnikov  (3/4)(1 − u²) per |u| ≤ 1
 * - esponenziale  (1/2) exp(−|u|)
 * - cauchy        1 / (π (1 + u²))
 * - sinc2         (1/2π) (sin(u/2) / (u/2))²
 *
 * u = ±∞ vale 0 per ogni kernel (è il limite; anche per sinc², dove sin(∞) darebbe NaN). u = NaN dà NaN per ogni
 * kernel: un confronto come |u| ≤ 1/2 lo trasformerebbe in 0 e il campione sparirebbe dal conteggio senza segnale.
 */
export function kernelValue(u: number, kernel: Kernel): number {
  const a = Math.abs(u)
  let v: number
  switch (kernel) {
    case 'rettangolare': v = a <= 0.5 ? 1 : 0; break
    case 'triangolare': v = a <= 1 ? 1 - a : 0; break
    case 'gaussiano': v = Math.exp(-0.5 * a * a) / Math.sqrt(2 * Math.PI); break
    case 'epanechnikov': v = a <= 1 ? 0.75 * (1 - a * a) : 0; break
    case 'esponenziale': v = 0.5 * Math.exp(-a); break
    case 'cauchy': v = 1 / (Math.PI * (1 + a * a)); break
    case 'sinc2': {
      const t = a / 2
      const s = t === 0 ? 1 : t === Number.POSITIVE_INFINITY ? 0 : Math.sin(t) / t
      v = (s * s) / (2 * Math.PI)
      break
    }
    default: throw err('kernelValue', `kernel sconosciuto: ${String(kernel satisfies never)}`)
  }
  return Number.isNaN(u) ? Number.NaN : v
}

// --- finestre di Parzen ---

/**
 * Stima di Parzen in una dimensione: p̂(x) = (1/N) Σ_k (1/h) γ((x − x_k)/h), con V = h.
 * Con γ = Π coincide con il conteggio K/(N h) dei campioni nella finestra di lato h centrata in x.
 * Integra a 1 per ogni h > 0 perché ogni γ integra a 1. h piccolo dà aghi alti γ(0)/(N h) sui campioni, h grande
 * una stima piatta alta circa γ(0)/h. Nessun campione: 0.
 */
export function parzen1d(x: number, samples: readonly number[], h: number, kernel: Kernel = 'gaussiano'): number {
  checkH('parzen1d', h)
  if (samples.length === 0) return 0
  let s = 0
  for (const xk of samples) {
    checkFinite('parzen1d', xk)
    s += kernelValue((x - xk) / h, kernel)
  }
  // divisioni in fila: con h sub-normale N·h non deve diventare 0 (0/0 = NaN lontano dai campioni)
  return cap(s / samples.length / h)
}

/**
 * Stima di Parzen in due dimensioni con V = h² e finestra prodotto γ(u) = γ(u₁)·γ(u₂), che integra a 1 sul piano.
 * Con 'rettangolare' è l'ipercubo del corso (|u_j| ≤ 1/2 per ogni j, quindi p̂ = K/(N h²)); con 'gaussiano' è la
 * finestra normale a simmetria circolare δ(x) = exp(−‖x‖²/(2h²)) / (2π h²), cioè il metodo di Specht con σ = h.
 */
export function parzen2d(x: Vec, samples: readonly Vec[], h: number, kernel: Kernel = 'gaussiano'): number {
  checkH('parzen2d', h)
  checkDim('parzen2d', x, 2)
  let s = 0
  for (const xk of samples) {
    checkPoint('parzen2d', xk, 2)
    s += kernelValue((x[0] - xk[0]) / h, kernel) * kernelValue((x[1] - xk[1]) / h, kernel)
  }
  // come in parzen1d: h² sub-normale diventerebbe 0, quindi si divide un fattore alla volta
  return samples.length === 0 ? 0 : cap(s / samples.length / h / h)
}

/** K = Σ_k γ((x_k − x*)/h) con γ indicatrice dell'ipercubo unitario: quanti campioni cadono nell'ipercubo di lato h centrato in x*. */
export function hypercubeCount(x: Vec, samples: readonly Vec[], h: number): number {
  checkH('hypercubeCount', h)
  let K = 0
  for (const xk of samples) {
    checkPoint('hypercubeCount', xk, x.length)
    if (xk.every((v, j) => kernelValue((v - x[j]) / h, 'rettangolare') === 1)) K++
  }
  return K
}

/**
 * Kernel gaussiano a simmetria sferica in n dimensioni (metodo di Specht):
 * p̂(x) = (1/N) Σ_k exp(−‖x − x_k‖² / (2σ_k²)) / (2π σ_k²)^{n/2}.
 * `sigma` è un numero (una sola σ per tutti) oppure un array con una σ_k per campione (σ adattiva, vedi `adaptiveSigmas`).
 * Nessun campione: 0. Una σ ≤ 0 (per esempio da campioni duplicati) è rifiutata invece di dividere per zero.
 */
export function spechtDensity(x: Vec, samples: readonly Vec[], sigma: number | readonly number[]): number {
  if (typeof sigma !== 'number' && sigma.length !== samples.length) {
    throw err('spechtDensity', `servono ${samples.length} valori di σ_k, ricevuti ${sigma.length}`)
  }
  let sum = 0
  samples.forEach((xk, k) => {
    checkPoint('spechtDensity', xk, x.length)
    const s = typeof sigma === 'number' ? sigma : sigma[k]
    if (!positive(s)) throw err('spechtDensity', `σ deve essere finita e > 0 (ricevuto ${s})`)
    const d = euclid(x, xk)
    let term = Math.exp((-d * d) / (2 * s * s)) / (2 * Math.PI * s * s) ** (x.length / 2)
    // σ sub-normale: σ² diventa 0 e la formula dà 0/0. In scala logaritmica il termine resta definito (0 o enorme)
    if (!Number.isFinite(term)) term = Math.exp(-0.5 * (d / s) ** 2 - x.length * Math.log(Math.sqrt(2 * Math.PI) * s))
    sum += term
  })
  return samples.length === 0 ? 0 : cap(sum / samples.length)
}

/**
 * σ adattiva: σ_k = (1/L) Σ_l ‖x_k − y_l‖, distanza euclidea media di x_k dai suoi L campioni più vicini (sé escluso).
 * Piccola dove i campioni sono densi, grande dove sono radi. L oltre N − 1 usa tutti gli altri campioni.
 * Nessun campione: []. Un solo campione non ha vicini: RangeError. Campioni duplicati possono dare σ_k = 0.
 */
export function adaptiveSigmas(samples: readonly Vec[], L: number): number[] {
  checkK('adaptiveSigmas', L, 'L')
  if (samples.length === 0) return []
  if (samples.length === 1) throw err('adaptiveSigmas', 'con un solo campione non esistono vicini')
  const l = Math.min(L, samples.length - 1)
  return samples.map((xk, k) => {
    const others = samples.filter((_, i) => i !== k)
    return nearestNeighbors(xk, others, l).reduce((s, nb) => s + nb.distance, 0) / l
  })
}

// --- K-NN: stima della densità ---

/** Raggio minimo della cella K-NN: evita la divisione per zero quando x* coincide con K campioni. */
export const KNN_MIN_RADIUS = 1e-9

const checkMinRadius = (fn: string, minRadius: number) => {
  if (!positive(minRadius)) throw err(fn, `minRadius deve essere finito e > 0 (ricevuto ${minRadius})`)
}

// --- selezione dei K più vicini ---
//
// Una carta K-NN interroga migliaia di punti (BoundaryCanvas: 120 × 75 celle) e a ogni interrogazione servono solo
// i K campioni più vicini. Ordinare tutti gli N campioni (map + sort + slice) costava O(N log N) più un oggetto per
// campione: circa mezzo secondo per carta con N = 200. Qui i K migliori stanno in un buffer ordinato e un campione
// entra solo se batte l'ultimo: O(N·K) nel caso peggiore, quasi O(N) in pratica, nessuna allocazione per campione.
// Si confrontano le distanze vere e non i quadrati: sqrt può rendere uguali due quadrati diversi, e lo spareggio del
// contratto ("a parità di distanza passa l'indice minore") parla della distanza restituita.

/** Oltre questa K il buffer costerebbe più di un ordinamento completo: si ordina tutto. */
const SELECT_MAX_K = 64

interface Selection {
  /** indici dei campioni scelti, dal più vicino */
  index: Int32Array
  distance: Float64Array
  /** quanti sono: min(K, N) */
  size: number
}

/** I `k` più vicini tra `count` campioni; `distanceOf(i)` controlla il campione i e ne dà la distanza. */
function selectNearest(count: number, distanceOf: (i: number) => number, k: number): Selection {
  const m = Math.min(k, count)
  const index = new Int32Array(m)
  const distance = new Float64Array(m)
  if (m === 0) return { index, distance, size: 0 }
  if (k > SELECT_MAX_K) {
    const all = new Float64Array(count)
    for (let i = 0; i < count; i++) all[i] = distanceOf(i)
    const order = Array.from({ length: count }, (_, i) => i).sort((p, q) => all[p] - all[q] || p - q)
    for (let j = 0; j < m; j++) {
      index[j] = order[j]
      distance[j] = all[order[j]]
    }
    return { index, distance, size: m }
  }
  let size = 0
  for (let i = 0; i < count; i++) {
    const d = distanceOf(i)
    if (size === m) {
      // pari merito con l'ultimo: resta quello già dentro, che ha l'indice minore (si scorre in ordine di indice)
      if (!(d < distance[m - 1])) continue
      size--
    }
    // inserimento ordinato; a parità di distanza il nuovo va dopo, quindi l'indice minore resta davanti
    let j = size
    while (j > 0 && distance[j - 1] > d) {
      distance[j] = distance[j - 1]
      index[j] = index[j - 1]
      j--
    }
    distance[j] = d
    index[j] = i
    size++
  }
  return { index, distance, size }
}

/** Il punto interrogato del K-NN deve essere finito: con un NaN ogni confronto è falso e l'esito sarebbe arbitrario. */
const checkQuery = (fn: string, x: Vec) => {
  for (let j = 0; j < x.length; j++) checkFinite(fn, x[j], 'il punto interrogato')
}

/** Distanza euclidea da x al campione p (la stessa formula di `euclid`), con i controlli sul campione. */
function distanceTo(fn: string, x: Vec, p: Vec): number {
  checkDim(fn, p, x.length)
  let s = 0
  for (let j = 0; j < x.length; j++) s += (x[j] - p[j]) ** 2
  // NaN o trabocco: solo allora si guardano le coordinate, così il caso normale non paga controlli in più
  if (!(s < Number.POSITIVE_INFINITY)) for (let j = 0; j < p.length; j++) checkFinite(fn, p[j])
  return Math.sqrt(s)
}

const toNeighbors = (sel: Selection): Neighbor[] => Array.from({ length: sel.size }, (_, j) => ({ index: sel.index[j], distance: sel.distance[j] }))

/** r_K(x): distanza da x al K-esimo campione più vicino, in 1-D. +∞ se K > N. 0 se x coincide con almeno K campioni. */
export function knnRadius1d(x: number, samples: readonly number[], k: number): number {
  checkK('knnRadius1d', k)
  checkFinite('knnRadius1d', x, 'il punto interrogato')
  const sel = selectNearest(
    samples.length,
    (i) => {
      checkFinite('knnRadius1d', samples[i])
      return Math.abs(samples[i] - x)
    },
    k,
  )
  return k > samples.length ? Number.POSITIVE_INFINITY : sel.distance[k - 1]
}

/** r_K(x*): distanza euclidea da x* al K-esimo campione più vicino, in 2-D. +∞ se K > N. */
export function knnRadius2d(x: Vec, samples: readonly Vec[], k: number): number {
  checkK('knnRadius2d', k)
  checkDim('knnRadius2d', x, 2)
  checkQuery('knnRadius2d', x)
  const sel = selectNearest(samples.length, (i) => distanceTo('knnRadius2d', x, samples[i]), k)
  return k > samples.length ? Number.POSITIVE_INFINITY : sel.distance[k - 1]
}

/** Volume dell'ipersfera di raggio r in n dimensioni: π^{n/2} rⁿ / Γ(n/2 + 1), cioè 2r, πr², (4/3)πr³... */
export function hypersphereVolume(n: number, r: number): number {
  checkK('hypersphereVolume', n, 'la dimensione n')
  if (!(r >= 0)) throw err('hypersphereVolume', `il raggio deve essere ≥ 0 (ricevuto ${r})`)
  if (n === 1) return 2 * r
  if (n === 2) return Math.PI * r * r
  if (n === 3) return (4 / 3) * Math.PI * r ** 3
  return Math.exp((n / 2) * Math.log(Math.PI) - logGamma(n / 2 + 1)) * r ** n
}

/**
 * Stima K-NN in una dimensione: p̂(x) = K / (N·V_K(x)) con V_K = 2 r_K(x), cioè K / (2 N r_K(x)).
 * Se più campioni sono alla stessa distanza r_K la cella chiusa ne contiene più di K, ma al numeratore resta K come
 * nella formula del corso. Non è una densità legittima: le code decadono come K/(2N|x|) e l'area è infinita.
 * K > N oppure nessun campione: 0. r_K = 0: il raggio viene fermato a `minRadius`, mai Infinity.
 */
export function knnDensity1d(x: number, samples: readonly number[], k: number, minRadius = KNN_MIN_RADIUS): number {
  checkMinRadius('knnDensity1d', minRadius)
  const r = knnRadius1d(x, samples, k)
  return r === Number.POSITIVE_INFINITY ? 0 : cap(k / samples.length / 2 / Math.max(r, minRadius))
}

/** Stima K-NN in due dimensioni con cella circolare: p̂(x*) = K / (N·π r_K²(x*)). Casi limite come `knnDensity1d`. */
export function knnDensity2d(x: Vec, samples: readonly Vec[], k: number, minRadius = KNN_MIN_RADIUS): number {
  checkMinRadius('knnDensity2d', minRadius)
  const r = knnRadius2d(x, samples, k)
  const rr = Math.max(r, minRadius)
  return r === Number.POSITIVE_INFINITY ? 0 : cap(k / samples.length / Math.PI / rr / rr)
}

// --- K-NN: vicini e classificatore ---

export interface Neighbor {
  /** posizione del campione nell'array passato */
  index: number
  /** distanza euclidea dal punto interrogato */
  distance: number
}

/**
 * I K campioni più vicini a `x` (in qualsiasi dimensione), in ordine di distanza euclidea crescente.
 * A parità di distanza passa prima il campione con indice minore: vale anche al confine, quando il K-esimo e il
 * (K+1)-esimo sono equidistanti entra quello che viene prima nell'array. K > N restituisce tutti gli N campioni.
 */
export function nearestNeighbors(x: Vec, samples: readonly Vec[], k: number): Neighbor[] {
  checkK('nearestNeighbors', k)
  checkQuery('nearestNeighbors', x)
  return toNeighbors(selectNearest(samples.length, (i) => distanceTo('nearestNeighbors', x, samples[i]), k))
}

export interface LabeledPoint { x: Vec; y: number }

export interface KnnVote {
  /** classe assegnata a x */
  label: number
  /** K_i (voti) e posteriore stimata P̂(ω_i | x) = K_i / K per ogni classe presente tra i vicini, per etichetta crescente */
  votes: { label: number; count: number; posterior: number }[]
  /** i vicini che hanno votato, dal più vicino al più lontano; `index` si riferisce a `data` */
  neighbors: Neighbor[]
  /** true se il massimo dei voti era condiviso ed è servito lo spareggio */
  tie: boolean
}

/**
 * Classificatore K-NN con il dettaglio del voto. Dalla stima K-NN: p̂(x|ω_i) = K_i/(N_i V), P̂(ω_i) = N_i/N, quindi
 * P̂(ω_i|x) = K_i/K e la regola MAP assegna x alla classe più rappresentata tra i K vicini.
 *
 * Pareggi, in quest'ordine:
 * 1. tra le sole classi con il massimo dei voti vince quella che possiede il vicino più vicino a x;
 * 2. se anche quella distanza coincide, vince l'etichetta numericamente più piccola (l'esito non dipende dall'ordine dei dati).
 * K ≥ N fa votare tutti i campioni: vince la classe più numerosa, cioè il prior. Training set vuoto: RangeError.
 */
export function knnVote(x: Vec, data: readonly LabeledPoint[], k: number): KnnVote {
  checkK('knnVote', k)
  if (data.length === 0) throw err('knnVote', 'nessun campione di training: non c\'è niente da votare')
  checkQuery('knnVote', x)
  // i punti si leggono sul posto: ricopiarli (data.map) a ogni cella di una carta di decisione costava quanto il voto
  const neighbors = toNeighbors(selectNearest(data.length, (i) => distanceTo('knnVote', x, data[i].x), k))
  const counts = new Map<number, number>()
  for (const nb of neighbors) counts.set(data[nb.index].y, (counts.get(data[nb.index].y) ?? 0) + 1)
  const votes = [...counts].sort((p, q) => p[0] - q[0]).map(([label, count]) => ({ label, count, posterior: count / neighbors.length }))
  const best = Math.max(...votes.map((v) => v.count))
  const tied = votes.filter((v) => v.count === best).map((v) => v.label)
  if (tied.length === 1) return { label: tied[0], votes, neighbors, tie: false }
  // i vicini sono già ordinati per distanza: il primo di una classe in parità fissa la distanza dello spareggio
  const contenders = neighbors.filter((nb) => tied.includes(data[nb.index].y))
  const closest = contenders.filter((nb) => nb.distance === contenders[0].distance).map((nb) => data[nb.index].y)
  return { label: Math.min(...closest), votes, neighbors, tie: true }
}

/** Classe assegnata a `x` dal voto dei K vicini; regole dei pareggi in `knnVote`. */
export function knnClassify(x: Vec, data: readonly LabeledPoint[], k: number): number {
  return knnVote(x, data, k).label
}

// --- errore tra due densità ---

/**
 * Errore quadratico integrato (Integrated Squared Error) ISE = ∫ (p(x) − q(x))² dx, con i trapezi sulla griglia `xs`
 * dove `p` e `q` sono già valutate. Serve a misurare quanto una stima dista dalla densità vera. Meno di due punti: 0.
 */
export function ise(xs: readonly number[], p: readonly number[], q: readonly number[]): number {
  if (p.length !== xs.length || q.length !== xs.length) {
    throw err('ise', `griglia (${xs.length}) e densità (${p.length}, ${q.length}) hanno lunghezze diverse`)
  }
  return trapz(xs, p.map((v, i) => (v - q[i]) ** 2))
}
