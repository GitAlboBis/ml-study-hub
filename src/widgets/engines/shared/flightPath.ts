// Logica di Flight: segni che volano da un grafico a un altro (un pixel dell'immagine che cade nel piano delle
// feature, una stima che scende nell'istogramma, un fattore che entra nel prodotto). Ogni grafico ha le sue scale;
// il volo avviene in uno strato comune che li contiene tutti: dominio del grafico A → pixel dello strato → dominio
// del grafico B. Qui le mappe e la traiettoria; nessun React, nessuna lettura del DOM.
import type { Vec2 } from './math/types'

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)

/** Curva di moto per ciò che si sposta sullo schermo (WIDGET_GUIDE §4): parte e arriva piano. */
export function easeInOut(t: number): number {
  const u = clamp01(t)
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2
}

/**
 * Posizione di un segno in volo all'avanzamento t (già con la curva di moto) da `from` a `to`, in pixel dello
 * schermo (y verso il basso). `arc` > 0 incurva il volo verso l'alto dello schermo, rispetto al verso di marcia:
 * una Bézier quadratica con il punto di controllo spostato di arc·distanza dal punto medio, così a metà il segno
 * è sollevato di arc·distanza/2. arc = 0: linea retta.
 */
export function flightPoint(from: Vec2, to: Vec2, t: number, arc = 0): Vec2 {
  const u = clamp01(t)
  if (u === 0) return [from[0], from[1]]
  if (u === 1) return [to[0], to[1]]
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dist = Math.hypot(dx, dy)
  // perpendicolare a sinistra del verso di marcia in coordinate dello schermo: per un volo verso destra, in alto
  const nx = dist > 0 ? dy / dist : 0
  const ny = dist > 0 ? -dx / dist : 0
  const cx = (from[0] + to[0]) / 2 + nx * arc * dist
  const cy = (from[1] + to[1]) / 2 + ny * arc * dist
  const a = (1 - u) * (1 - u)
  const b = 2 * (1 - u) * u
  const c = u * u
  return [a * from[0] + b * cx + c * to[0], a * from[1] + b * cy + c * to[1]]
}

/**
 * Avanzamento del segno i di n quando partono uno dopo l'altro: il primo parte a t = 0, l'ultimo a t = spread,
 * e tutti arrivano entro t = 1 (ognuno vola per 1 − spread del tempo). Con un solo segno è t stesso.
 */
export function staggered(i: number, n: number, t: number, spread = 0.5): number {
  if (n <= 1 || !(spread > 0)) return clamp01(t)
  const s = Math.min(spread, 0.95)
  const start = (s * i) / (n - 1)
  return clamp01((t - start) / (1 - s))
}

/** Una scala lineare del grafico: da dominio a pixel dell'area interna e ritorno (una ScaleLinear di d3 lo è). */
export interface PlotScale {
  (v: number): number
  invert(v: number): number
}

/**
 * Dove sta un grafico nello strato comune: posizione del suo SVG (angolo in alto a sinistra) nello strato, scala
 * fra unità del viewBox e pixel CSS (1 dopo la misura del Plot; diversa dove il viewBox scala come un'immagine),
 * margini e scale del grafico.
 */
export interface PlotPlacement {
  left: number
  top: number
  scale: number
  margin: { left: number; top: number }
  x: PlotScale
  y: PlotScale
}

/** Punto del dominio del grafico → pixel dello strato comune. */
export function toLayer(p: PlotPlacement, at: Vec2): Vec2 {
  return [p.left + (p.margin.left + p.x(at[0])) * p.scale, p.top + (p.margin.top + p.y(at[1])) * p.scale]
}

/** Pixel dello strato comune → punto del dominio del grafico (senza ritaglio). */
export function fromLayer(p: PlotPlacement, at: Vec2): Vec2 {
  const s = p.scale > 0 ? p.scale : 1
  return [p.x.invert((at[0] - p.left) / s - p.margin.left), p.y.invert((at[1] - p.top) / s - p.margin.top)]
}
