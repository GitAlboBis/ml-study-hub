// Geometria pura di Gauge e Thermometer: dal valore alla frazione della scala (lineare o logaritmica), punti e archi
// del quadrante. Nessun React; testata in meters.test.ts.

export interface MeterPosition {
  /** frazione della scala, fra 0 e 1 (NaN se il valore non è un numero) */
  t: number
  /** il valore sta oltre il massimo o sotto il minimo: l'ago si ferma sul fondo scala */
  over: boolean
  under: boolean
}

/** Dove cade un valore sulla scala [min, max], in scala lineare o logaritmica (min > 0). */
export function meterPosition(v: number, min: number, max: number, log = false): MeterPosition {
  if (Number.isNaN(v) || !(max > min)) return { t: Number.NaN, over: false, under: false }
  const over = v > max
  const under = v < min
  let t: number
  if (log) {
    if (!(min > 0)) return { t: Number.NaN, over: false, under: false }
    t = v <= 0 ? 0 : (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min))
  } else {
    t = (v - min) / (max - min)
  }
  return { t: Math.min(Math.max(t, 0), 1), over, under }
}

/** Punto del quadrante a semicerchio: t = 0 a sinistra, 1 a destra, passando per l'alto (coordinate SVG). */
export function arcPoint(cx: number, cy: number, r: number, t: number): [number, number] {
  const a = Math.PI * (1 - t)
  const n = (v: number) => Number(v.toFixed(3))
  return [n(cx + r * Math.cos(a)), n(cy - r * Math.sin(a))]
}

/** Arco del quadrante da t0 a t1 (0 ≤ t0 ≤ t1 ≤ 1), in senso orario sullo schermo. Vuoto se l'intervallo è nullo. */
export function arcPath(cx: number, cy: number, r: number, t0: number, t1: number): string {
  const a = Math.min(Math.max(Math.min(t0, t1), 0), 1)
  const b = Math.min(Math.max(Math.max(t0, t1), 0), 1)
  if (!(b > a)) return ''
  const [x0, y0] = arcPoint(cx, cy, r, a)
  const [x1, y1] = arcPoint(cx, cy, r, b)
  return `M${x0},${y0}A${r},${r} 0 0 1 ${x1},${y1}`
}
