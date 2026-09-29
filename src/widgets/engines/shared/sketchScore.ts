// Logica di Sketch: una curva disegnata a mano come altezze su punti di controllo equispaziati, il pennello che le
// dipinge, la tastiera, la normalizzazione ad area 1 e il punteggio di somiglianza con una curva bersaglio.
//
// ORIGINE. La modalità "la tua ipotesi" del widget costruito m03-campioni-che-rivelano-la-pdf (campioniPdf.ts:
// HYP_XS, HYP_START, hypothesisArea, normalizeHypothesis, hypothesisPdf) usa 11 punti fissi sulla scala 0-10.
// Qui la stessa logica è COPIATA e generalizzata a un dominio e a un numero di punti qualsiasi; il widget di m03
// non cambia. In più: il pennello a mano libera (paintStroke) e il punteggio (sketchScore).
import { ise } from '../../../lib/ml/nonparam'
import { linspace, trapz } from '../../../lib/ml/stats'
import { tidy } from './handleMath'
import type { Vec2 } from './math/types'

/** Ascisse dei punti di controllo: `count` punti equispaziati sul dominio, estremi compresi. */
export function sketchXs(domain: readonly [number, number], count: number): number[] {
  return linspace(domain[0], domain[1], Math.max(2, Math.round(count))).map(tidy)
}

/** Partenza: la pdf uniforme sul dominio, altezza 1/(b − a), area 1 (come HYP_START di m03). */
export function sketchStart(xs: readonly number[]): number[] {
  const span = xs[xs.length - 1] - xs[0]
  return xs.map(() => tidy(1 / span))
}

/** Area sotto la spezzata (trapezi esatti: la curva è lineare a tratti), come hypothesisArea di m03. */
export function sketchArea(xs: readonly number[], heights: readonly number[]): number {
  let s = 0
  for (let i = 1; i < xs.length; i++) s += ((xs[i] - xs[i - 1]) * ((heights[i] ?? 0) + (heights[i - 1] ?? 0))) / 2
  return s
}

/** Altezze riscalate ad area 1: una pdf deve integrare a 1. Tutta a zero: torna uniforme (normalizeHypothesis di m03). */
export function normalizeSketch(xs: readonly number[], heights: readonly number[]): number[] {
  const area = sketchArea(xs, heights)
  if (!(area > 0)) return sketchStart(xs)
  return heights.map((h) => Number((h / area).toFixed(6)))
}

/**
 * La curva disegnata come funzione: interpolazione lineare fra i punti di controllo, 0 fuori dal dominio. Con
 * `normalize` (predefinito) è rinormalizzata ad area 1, come hypothesisPdf di m03. I punti possono non essere
 * equispaziati: l'intervallo si cerca per bisezione.
 */
export function sketchPdf(xs: readonly number[], heights: readonly number[], normalize = true): (x: number) => number {
  const hs = normalize ? (sketchArea(xs, heights) > 0 ? normalizeSketch(xs, heights) : sketchStart(xs)) : [...heights]
  const lo = xs[0]
  const hi = xs[xs.length - 1]
  return (x) => {
    if (!(x >= lo && x <= hi)) return 0
    let a = 0
    let b = xs.length - 1
    while (b - a > 1) {
      const m = (a + b) >> 1
      if (xs[m] <= x) a = m
      else b = m
    }
    const t = xs[b] > xs[a] ? (x - xs[a]) / (xs[b] - xs[a]) : 0
    return hs[a] + (hs[b] - hs[a]) * t
  }
}

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

/**
 * Il pennello: il puntatore è passato da `from` a `to` (coordinate del dominio). Ogni punto di controllo la cui
 * cella (mezza spaziatura a destra e a sinistra) tocca il tratto prende l'altezza della retta fra i due punti,
 * valutata nella sua ascissa riportata dentro il tratto: un gesto veloce, che salta da x = 1.2 a x = 4.8 in un
 * fotogramma, non lascia buchi. Senza `from` (il primo contatto) si dipinge il punto più vicino. Altezze fra yMin e yMax.
 */
export function paintStroke(xs: readonly number[], heights: readonly number[], from: Vec2 | null, to: Vec2, yMin = 0, yMax = Number.POSITIVE_INFINITY): number[] {
  const out = [...heights]
  const put = (i: number, y: number) => {
    out[i] = tidy(clamp(y, yMin, yMax))
  }
  if (from === null || Math.abs(to[0] - from[0]) < 1e-12) {
    let best = 0
    for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - to[0]) < Math.abs(xs[best] - to[0])) best = i
    put(best, to[1])
    return out
  }
  const [a, b] = from[0] < to[0] ? [from, to] : [to, from]
  for (let i = 0; i < xs.length; i++) {
    const left = i > 0 ? (xs[i - 1] + xs[i]) / 2 : xs[i]
    const right = i < xs.length - 1 ? (xs[i] + xs[i + 1]) / 2 : xs[i]
    if (right < a[0] || left > b[0]) continue
    const x = clamp(xs[i], a[0], b[0])
    put(i, a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]))
  }
  return out
}

export interface SketchKeyOptions {
  /** passo dell'altezza per le frecce su e giù; Maiusc e Pag = dieci passi */
  step: number
  max: number
  min?: number
}

/**
 * Tastiera del disegno (un solo arresto del Tab): sinistra e destra scelgono il punto di controllo, Inizio e Fine
 * il primo e l'ultimo, su e giù ne cambiano l'altezza. null se il tasto non riguarda il disegno.
 */
export function sketchKey(index: number, heights: readonly number[], key: string, shift: boolean, o: SketchKeyOptions): { index: number; heights: readonly number[] } | null {
  const last = heights.length - 1
  const set = (delta: number) => heights.map((h, i) => (i === index ? tidy(clamp(h + delta, o.min ?? 0, o.max)) : h))
  switch (key) {
    case 'ArrowLeft':
      return { index: Math.max(0, index - 1), heights }
    case 'ArrowRight':
      return { index: Math.min(last, index + 1), heights }
    case 'Home':
      return { index: 0, heights }
    case 'End':
      return { index: last, heights }
    case 'ArrowUp':
      return { index, heights: set((shift ? 10 : 1) * o.step) }
    case 'ArrowDown':
      return { index, heights: set(-(shift ? 10 : 1) * o.step) }
    case 'PageUp':
      return { index, heights: set(10 * o.step) }
    case 'PageDown':
      return { index, heights: set(-10 * o.step) }
    default:
      return null
  }
}

export interface SketchScore {
  /** errore quadratico integrato ∫ (s − t)² dx */
  ise: number
  /** errore assoluto integrato ∫ |s − t| dx */
  l1: number
  /**
   * somiglianza in [0, 1]: 1 − ‖s − t‖₂ / (‖s‖₂ + ‖t‖₂). 1 = la stessa curva, 0 = nessuna sovrapposizione utile
   * (una curva a zero). Non dipende dalle unità dell'asse verticale.
   */
  similarity: number
  /** area sotto la curva disegnata, prima di normalizzare */
  area: number
}

/**
 * Quanto la curva disegnata somiglia al bersaglio, sul dominio dei punti di controllo (griglia di `grid` punti).
 * Con `normalize` (predefinito) la curva è prima portata ad area 1: si confrontano forme di pdf, non scale.
 */
export function sketchScore(xs: readonly number[], heights: readonly number[], target: (x: number) => number, o: { normalize?: boolean; grid?: number } = {}): SketchScore {
  const s = sketchPdf(xs, heights, o.normalize ?? true)
  const g = linspace(xs[0], xs[xs.length - 1], Math.max(2, o.grid ?? 400))
  const sv = g.map(s)
  const tv = g.map(target)
  const e = ise(g, sv, tv)
  const l1 = trapz(g, sv.map((v, i) => Math.abs(v - tv[i])))
  const ns = Math.sqrt(trapz(g, sv.map((v) => v * v)))
  const nt = Math.sqrt(trapz(g, tv.map((v) => v * v)))
  const similarity = ns + nt > 0 ? clamp(1 - Math.sqrt(e) / (ns + nt), 0, 1) : 1
  return { ise: e, l1, similarity, area: sketchArea(xs, heights) }
}
