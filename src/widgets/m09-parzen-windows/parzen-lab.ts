// Logica pura condivisa dai widget del foglio m09 scritti a mano sul kit (lotto "dal conteggio al bias":
// scatola nera, ipercubo, due viste, conteggio e interpolazione, lavagna, densità legittima, tre condizioni,
// δ(x), cinque campioni, più campioni, gallerie dei kernel, media sfocata, h → 0).
//
// Il motore density1d copre la stima con i kernel del corso; qui c'è ciò che serve in più a questi widget:
// la stima con un kernel QUALSIASI (anche "sbagliato": senza 1/V, con parti negative, con il massimo fuori
// dall'origine), le letture delle curve (salti, massimi, intervalli), la media della stima come convoluzione,
// i dati a seed con il prefisso stabile e una stima gaussiana veloce per N fino a qualche migliaio.
// I valori dei kernel del corso vengono sempre da kernelValue (src/lib/ml/nonparam.ts).
import { kernelValue } from '../../lib/ml/nonparam'
import type { Kernel } from '../../lib/ml/nonparam'
import { sampleMixture } from '../../lib/ml/stats'
import type { MixtureComponent } from '../../lib/ml/stats'
import { createRng } from '../../lib/rng'

/** Una funzione finestra γ(u) nella variabile normalizzata u = (x − x_k)/h. */
export type Gamma = (u: number) => number

/** Il kernel del corso come funzione γ(u). */
export const gammaOf = (kernel: Kernel): Gamma => (u) => kernelValue(u, kernel)

export interface KdeOptions {
  /** peso di ogni termine: 1/N se manca (la stima), 1 per la somma senza 1/N */
  weight?: number
  /** oltre questo |u| il kernel vale zero: i termini lontani si saltano (il risultato non cambia) */
  support?: number
  /** V(h) al denominatore; predefinito h (una dimensione). 1 = "ho dimenticato 1/V" */
  volume?: number
}

/**
 * La stima generale Σ_k w · (1/V) γ((x − x_k)/h) su ogni x di `xs`, con w = 1/N e V = h se non detto
 * altrimenti. Con un kernel del corso coincide con parzen1d; con un kernel qualsiasi serve a mostrare che
 * cosa succede quando γ non è una densità, o quando manca 1/V.
 */
export function kde(xs: readonly number[], samples: readonly number[], h: number, gamma: Gamma, opts: KdeOptions = {}): number[] {
  const n = samples.length
  const out = new Array<number>(xs.length).fill(0)
  if (n === 0) return out
  const w = (opts.weight ?? 1 / n) / (opts.volume ?? h)
  const reach = (opts.support ?? Number.POSITIVE_INFINITY) * h
  for (let i = 0; i < xs.length; i++) {
    let s = 0
    for (const xk of samples) {
      const d = xs[i] - xk
      if (Math.abs(d) > reach) continue
      s += gamma(d / h)
    }
    out[i] = w * s
  }
  return out
}

/** Combinazione convessa di due kernel: a t = 0 è `a`, a t = 1 è `b`. Se sono densità, lo è a ogni t. */
export function morphGamma(a: Gamma, b: Gamma, t: number): Gamma {
  if (t <= 0) return a
  if (t >= 1) return b
  return (u) => (1 - t) * a(u) + t * b(u)
}

// --- letture delle curve ---

const tidy = (v: number) => Number(v.toPrecision(12))

/** Dove salta una stima con il kernel rettangolare: x_k ± h/2, ordinati, dentro il dominio, senza doppioni. */
export function jumpPoints(samples: readonly number[], h: number, domain: readonly [number, number]): number[] {
  const pts = samples.flatMap((xk) => [tidy(xk - h / 2), tidy(xk + h / 2)]).filter((p) => p > domain[0] && p < domain[1])
  return [...new Set(pts)].sort((a, b) => a - b)
}

/**
 * Ascisse dei massimi locali di una curva campionata (al centro di un eventuale pianoro). I bordi non
 * contano; valori che differiscono meno di un miliardesimo del massimo sono lo stesso valore, come nel
 * contatore dei massimi del motore density1d.
 */
export function maximaAt(xs: readonly number[], ys: readonly number[]): number[] {
  if (ys.length < 3) return []
  const top = ys.reduce((m, y) => Math.max(m, Math.abs(y)), 0)
  const tol = top * 1e-9
  // tratti di valore costante: [primo indice, ultimo indice, valore]
  const runs: [number, number, number][] = []
  ys.forEach((y, i) => {
    const last = runs[runs.length - 1]
    if (last !== undefined && Math.abs(y - last[2]) <= tol) last[1] = i
    else runs.push([i, i, y])
  })
  const out: number[] = []
  for (let r = 1; r < runs.length - 1; r++) {
    const [a, b, v] = runs[r]
    if (v > runs[r - 1][2] && v > runs[r + 1][2]) out.push(tidy((xs[a] + xs[b]) / 2))
  }
  return out
}

/** L'intervallo contiguo attorno a x0 in cui ys supera la soglia; null se in x0 non la supera. */
export function segmentAbove(xs: readonly number[], ys: readonly number[], threshold: number, x0: number): [number, number] | null {
  if (xs.length === 0) return null
  let i = 0
  for (let j = 1; j < xs.length; j++) if (Math.abs(xs[j] - x0) < Math.abs(xs[i] - x0)) i = j
  if (!(ys[i] > threshold)) return null
  let lo = i
  let hi = i
  while (lo > 0 && ys[lo - 1] > threshold) lo--
  while (hi < xs.length - 1 && ys[hi + 1] > threshold) hi++
  return [xs[lo], xs[hi]]
}

// --- media della stima ---

/** Mistura di gaussiane convoluta con il kernel gaussiano di larghezza h: ogni modo diventa N(μ, σ² + h²) (der11). */
export function blurMixture(components: readonly MixtureComponent[], h: number): MixtureComponent[] {
  return components.map((c) => ({ weight: c.weight, mu: c.mu, sigma: Math.sqrt(c.sigma ** 2 + h ** 2) }))
}

/**
 * E{p̂(x)} = ∫ (1/h) γ((x − v)/h) p(v) dv su ogni x di `xs`, con la regola del punto medio sulle celle della
 * griglia `vs` (der04): la media della stima è la densità vera convoluta con il kernel riscalato. Non dipende da
 * N. Il punto medio e non i trapezi: con il rettangolare i bordi della finestra cadono sui nodi e i trapezi
 * conterebbero mezza cella in più per bordo.
 */
export function expectedEstimate(xs: readonly number[], p: (v: number) => number, h: number, gamma: Gamma, vs: readonly number[]): number[] {
  const mids: number[] = []
  const widths: number[] = []
  for (let j = 1; j < vs.length; j++) {
    mids.push((vs[j - 1] + vs[j]) / 2)
    widths.push(vs[j] - vs[j - 1])
  }
  const pw = mids.map((v, j) => (p(v) * widths[j]) / h)
  return xs.map((x) => {
    let s = 0
    for (let j = 0; j < mids.length; j++) if (pw[j] !== 0) s += gamma((x - mids[j]) / h) * pw[j]
    return s
  })
}

/**
 * Lo stesso integrale con il cambio di variabile u = (x − v)/h: ∫ γ(u)^power p(x − h u) du, con il punto medio su
 * [−support, support]. Il passo segue il kernel e non h, quindi il conto resta esatto anche con h di un decimo e con i
 * salti del rettangolo. Con power 2 (e diviso per h) dà E{(1/h²) γ²}, che serve alla varianza.
 */
export function convolveAt(x: number, p: (v: number) => number, h: number, gamma: Gamma, support: number, power: 1 | 2 = 1, points = 161): number {
  const du = (2 * support) / points
  let s = 0
  for (let i = 0; i < points; i++) {
    const u = -support + (i + 0.5) * du
    const g = gamma(u)
    if (g === 0) continue
    s += g ** power * p(x - h * u)
  }
  return s * du
}

// --- dati sintetici a seed ---

/**
 * n campioni dalla mistura, a seed, dentro il dominio (un valore fuori si scarta e si ri-estrae) e arrotondati a
 * `decimals` se dato. Si estraggono uno alla volta: i primi n non cambiano quando n cresce, così uno slider di N
 * aggiunge campioni invece di rimescolarli.
 */
export function mixtureSamples(seed: number, n: number, components: readonly MixtureComponent[], domain: readonly [number, number], decimals?: number): number[] {
  const rng = createRng(seed)
  const out: number[] = []
  for (let guard = 0; out.length < n && guard < n * 1000; guard++) {
    const raw = sampleMixture(rng, 1, components)[0]
    const v = decimals === undefined ? raw : Number(raw.toFixed(decimals))
    if (v >= domain[0] && v <= domain[1]) out.push(v)
  }
  return out
}

// --- stima gaussiana veloce ---

/**
 * La stima gaussiana su una griglia UNIFORME, per N grandi (fino a qualche migliaio): i campioni si ripartiscono
 * sui due nodi vicini (binning lineare) e la griglia dei conteggi si convolve con il kernel campionato, troncato
 * a 5h. Il costo non dipende più da N ma dai nodi. Con nodi fitti rispetto a h l'errore è sotto il millesimo del
 * picco (vedi il test).
 */
export function binnedGaussKde(grid: readonly number[], samples: readonly number[], h: number): number[] {
  const m = grid.length
  const out = new Array<number>(m).fill(0)
  if (m < 2 || samples.length === 0) return out
  const g0 = grid[0]
  const step = (grid[m - 1] - g0) / (m - 1)
  const counts = new Float64Array(m)
  for (const s of samples) {
    const t = (s - g0) / step
    const j = Math.floor(t)
    const f = t - j
    if (j >= 0 && j < m) counts[j] += 1 - f
    if (j + 1 >= 0 && j + 1 < m) counts[j + 1] += f
  }
  const reach = Math.min(m - 1, Math.ceil((5 * h) / step))
  const w = new Float64Array(reach + 1)
  const norm = 1 / (samples.length * h * Math.sqrt(2 * Math.PI))
  for (let k = 0; k <= reach; k++) w[k] = Math.exp(-0.5 * ((k * step) / h) ** 2) * norm
  for (let j = 0; j < m; j++) {
    const c = counts[j]
    if (c === 0) continue
    const lo = Math.max(0, j - reach)
    const hi = Math.min(m - 1, j + reach)
    for (let i = lo; i <= hi; i++) out[i] += c * w[Math.abs(i - j)]
  }
  return out
}

// --- scale ---

const NICE = [1, 1.5, 2, 3, 5, 7]

/** Valori tondi (1, 1.5, 2, 3, 5, 7 per decade) fra min e max, estremi compresi: per gli slider di N. */
export function niceSteps(min: number, max: number): number[] {
  const out: number[] = [min]
  for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
    for (const m of NICE) {
      const v = tidy(m * 10 ** e)
      if (v > min && v < max) out.push(v)
    }
  }
  out.push(max)
  return [...new Set(out)].sort((a, b) => a - b)
}
