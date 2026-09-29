// Geometria delle maniglie comuni dei motori: angoli della manopola (Knob, AngleHandle), valori agganciati e tasti
// delle soglie (Threshold, HandleOnCurve), confini ordinati, punto più vicino su una curva, retta per due punti
// (LineHandles). Niente React: ciò che i componenti disegnano e ciò che i test controllano sono gli stessi conti.
//
// CONVENZIONI
// - Angoli in gradi, antiorari, 0 = asse x positivo, in coordinate MATEMATICHE (y verso l'alto). Chi parte da
//   pixel dello schermo (y verso il basso) cambia segno a dy prima di chiamare angleFromCenter.
// - Una retta non ha verso: θ e θ + 180° sono la stessa retta. Una manopola "assiale" ha periodo 180°.
// - Tutti i valori escono puliti dal rumore in virgola mobile (tidy): 0.1 + 0.2 torna 0.3, -0 torna 0.
import type { Vec2 } from './math/types'

/** Toglie il rumore dei passi sommati e lo zero con segno. */
export const tidy = (v: number): number => {
  const r = Number(v.toPrecision(12))
  return r === 0 ? 0 : r
}

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, Math.min(a, b)), Math.max(a, b))
const DEG = 180 / Math.PI

/** Riporta un angolo nel periodo [min, min + period): 370 → 10, -30 → 330, con period 180: 200 → 20. */
export function wrapAngle(deg: number, period = 360, min = 0): number {
  let r = (((deg - min) % period) + period) % period
  // 359.9999999999999 è 360, cioè 0: il bordo del periodo non deve restare aperto per un errore di arrotondamento
  if (period - r < 1e-9) r = 0
  return tidy(r + min)
}

/** Distanza angolare più breve, con segno, da a a b: in (-period/2, period/2]. */
export function angleDelta(a: number, b: number, period = 360): number {
  const d = wrapAngle(b - a, period, -period / 2)
  return d === -period / 2 ? period / 2 : d
}

/** Angolo del vettore (dx, dy) in coordinate matematiche (y in su), in [0, 360). */
export function angleFromCenter(dx: number, dy: number): number {
  return wrapAngle(Math.atan2(dy, dx) * DEG)
}

/** Aggancia un angolo (o un valore qualsiasi) alla griglia min + k·step. */
export function snapAngle(v: number, step: number, min = 0): number {
  if (!(step > 0) || !Number.isFinite(step)) return tidy(v)
  return tidy(min + Math.round((v - min) / step) * step)
}

/** Opzioni di una manopola: intervallo, passo e se il giro si richiude (min ≡ max). */
export interface KnobRange {
  min: number
  max: number
  step: number
  /** passo di Maiusc+frecce e Pag su/giù; predefinito il più grande fra step e 15° */
  bigStep?: number
  /** il giro si richiude: dopo l'ultimo valore viene il primo (predefinito true). false: si ferma agli estremi */
  wrap?: boolean
}

/** Un valore dentro la manopola: agganciato al passo e ripiegato nel giro, oppure fermato agli estremi. */
export function knobValue(v: number, r: KnobRange): number {
  const wrap = r.wrap ?? true
  const period = r.max - r.min
  if (wrap && period > 0) return wrapAngle(snapAngle(wrapAngle(v, period, r.min), r.step, r.min), period, r.min)
  return tidy(clamp(snapAngle(v, r.step, r.min), r.min, r.max))
}

/**
 * Nuovo angolo dopo un tasto: frecce destra/su +passo (antiorario), sinistra/giù −passo; Maiusc+frecce e Pag
 * su/giù ± il passo grande; Inizio e Fine gli estremi. null se il tasto non riguarda la manopola.
 */
export function knobKey(value: number, key: string, shift: boolean, r: KnobRange): number | null {
  const wrap = r.wrap ?? true
  const big = r.bigStep ?? Math.max(r.step, 15)
  let next: number
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      next = value + (shift ? big : r.step)
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      next = value - (shift ? big : r.step)
      break
    case 'PageUp':
      next = value + big
      break
    case 'PageDown':
      next = value - big
      break
    case 'Home':
      next = r.min
      break
    case 'End':
      // in un giro che si richiude max è min: l'ultimo valore distinto è un passo prima
      next = wrap ? r.max - r.step : r.max
      break
    default:
      return null
  }
  return knobValue(next, r)
}

/**
 * Il puntatore in (dx, dy) rispetto al centro (coordinate matematiche) → angolo della manopola. In un giro che
 * si richiude l'angolo si ripiega nel periodo (assiale: 315° si legge 135°); in un intervallo limitato un angolo
 * fuori va all'estremo più vicino lungo il cerchio.
 */
export function pointerAngle(dx: number, dy: number, r: KnobRange): number {
  const a = angleFromCenter(dx, dy)
  if (r.wrap ?? true) return knobValue(a, r)
  for (const c of [a, a - 360, a + 360]) if (c >= r.min && c <= r.max) return knobValue(c, r)
  const toMin = Math.abs(angleDelta(a, r.min))
  const toMax = Math.abs(angleDelta(a, r.max))
  return knobValue(toMin < toMax ? r.min : r.max, r)
}

// ---------------------------------------------------------------------------------------------
// Soglie, aggancio ai bordi dei bin, confini ordinati
// ---------------------------------------------------------------------------------------------

/** I bordi di `count` bin larghi `width` a partire da `start`: count + 1 valori. */
export function binEdges(start: number, width: number, count: number): number[] {
  return Array.from({ length: Math.max(0, Math.round(count)) + 1 }, (_, k) => tidy(start + k * width))
}

export interface SnapOptions {
  /** valori a cui agganciarsi (bordi dei bin, valori della slide) */
  snaps?: readonly number[]
  /** con `snaps`: aggancia solo entro questa distanza (magnete); senza, sempre al più vicino */
  radius?: number
  /** senza `snaps`: griglia min + k·step */
  step?: number
  min?: number
}

/** Il valore agganciato: al più vicino degli `snaps` (entro `radius`, se c'è) o alla griglia del passo. */
export function snapValue(v: number, o: SnapOptions): number {
  if (o.snaps !== undefined && o.snaps.length > 0) {
    let best = o.snaps[0]
    for (const s of o.snaps) if (Math.abs(s - v) < Math.abs(best - v)) best = s
    if (o.radius !== undefined && Math.abs(best - v) > o.radius) return tidy(v)
    return tidy(best)
  }
  if (o.step !== undefined && o.step > 0) return snapAngle(v, o.step, o.min ?? 0)
  return tidy(v)
}

export interface SliderKeyOptions {
  min: number
  max: number
  /** passo delle frecce senza `snaps`; Maiusc e Pag = dieci passi */
  step: number
  /** con i bordi le frecce saltano al bordo successivo o precedente; Maiusc e Pag cinque bordi */
  snaps?: readonly number[]
}

const EPS = 1e-9

/**
 * Nuovo valore di una maniglia a una dimensione dopo un tasto (soglia, maniglia su una curva). Con `snaps` le
 * frecce passano al bordo successivo nel verso del tasto: da 0.7 con bordi ogni 0.5 la freccia destra dà 1, non
 * 0.9 riagganciato a 1.0 e poi fermo. null se il tasto non la riguarda.
 */
export function sliderKey(value: number, key: string, shift: boolean, o: SliderKeyOptions): number | null {
  const up = key === 'ArrowRight' || key === 'ArrowUp' || key === 'PageUp'
  const down = key === 'ArrowLeft' || key === 'ArrowDown' || key === 'PageDown'
  const far = shift || key === 'PageUp' || key === 'PageDown'
  const snaps = o.snaps?.filter((s) => s >= Math.min(o.min, o.max) - EPS && s <= Math.max(o.min, o.max) + EPS).sort((a, b) => a - b)
  if (snaps !== undefined && snaps.length > 0) {
    if (key === 'Home') return tidy(snaps[0])
    if (key === 'End') return tidy(snaps[snaps.length - 1])
    if (!up && !down) return null
    const jumps = far ? 5 : 1
    if (up) {
      const ahead = snaps.filter((s) => s > value + EPS)
      return tidy(ahead.length === 0 ? snaps[snaps.length - 1] : ahead[Math.min(jumps, ahead.length) - 1])
    }
    const behind = snaps.filter((s) => s < value - EPS)
    return tidy(behind.length === 0 ? snaps[0] : behind[Math.max(0, behind.length - jumps)])
  }
  if (key === 'Home') return tidy(o.min)
  if (key === 'End') return tidy(o.max)
  if (!up && !down) return null
  const delta = (far ? 10 : 1) * o.step * (up ? 1 : -1)
  return tidy(clamp(snapAngle(value + delta, o.step, o.min), o.min, o.max))
}

/**
 * Confini ordinati (segmentazione di un segnale, soglie multiple): il valore i va in `v`, tenuto fra i vicini a
 * distanza almeno `gap` e dentro [lo, hi]. Restituisce un array nuovo.
 */
export function clampOrdered(values: readonly number[], i: number, v: number, gap: number, lo: number, hi: number): number[] {
  const lower = i > 0 ? values[i - 1] + gap : lo
  const upper = i < values.length - 1 ? values[i + 1] - gap : hi
  const out = [...values]
  out[i] = tidy(Math.min(Math.max(v, lower), upper))
  return out
}

// ---------------------------------------------------------------------------------------------
// Curve e rette
// ---------------------------------------------------------------------------------------------

/**
 * Parametro t in [t0, t1] del punto della curva `at(t)` più vicino a (px, py): prima una ricerca su `samples`
 * punti, poi la sezione aurea attorno al migliore. Le coordinate sono quelle in cui si misura la vicinanza: per
 * una maniglia, i pixel (una curva nel dominio si passa già trasformata con le scale).
 */
export function nearestParam(at: (t: number) => readonly [number, number], t0: number, t1: number, px: number, py: number, samples = 128): number {
  const d2 = (t: number) => {
    const [x, y] = at(t)
    return (x - px) ** 2 + (y - py) ** 2
  }
  const n = Math.max(2, Math.round(samples))
  const h = (t1 - t0) / n
  let best = 0
  let bestD = Number.POSITIVE_INFINITY
  for (let i = 0; i <= n; i++) {
    const d = d2(t0 + i * h)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  let a = t0 + Math.max(0, best - 1) * h
  let b = t0 + Math.min(n, best + 1) * h
  const g = (Math.sqrt(5) - 1) / 2
  let c = b - g * (b - a)
  let d = a + g * (b - a)
  for (let k = 0; k < 60; k++) {
    if (d2(c) < d2(d)) b = d
    else a = c
    c = b - g * (b - a)
    d = a + g * (b - a)
  }
  const t = (a + b) / 2
  // la sezione aurea non torna mai peggio del campione da cui è partita
  return d2(t) <= bestD ? t : t0 + best * h
}

export interface LineNormalForm {
  /** normale unitaria: punta a sinistra della direzione p → q */
  w: Vec2
  /** termine noto: w·x + b = 0 sulla retta, > 0 dal lato a cui punta w */
  b: number
  /** angolo della retta in [0, 180): una retta non ha verso */
  angle: number
}

/**
 * La retta per p e q in forma normale; null se i due punti coincidono (distano meno di 1e−12). È l'unica
 * implementazione della base comune: lineFromPoints di math/classify2d la richiama (e lancia un RangeError al posto
 * di null). Niente zeri con segno in w e b: [0, 1], non [−0, 1].
 */
export function lineThrough(p: Vec2, q: Vec2): LineNormalForm | null {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  const len = Math.hypot(dx, dy)
  if (!(len > 1e-12)) return null
  const w: Vec2 = [-dy / len + 0, dx / len + 0]
  return { w, b: -(w[0] * p[0] + w[1] * p[1]) + 0, angle: wrapAngle(Math.atan2(dy, dx) * DEG, 180) }
}

/**
 * La retta intera per p e q ritagliata sul rettangolo xDomain × yDomain (Liang-Barsky con t illimitato): i due
 * estremi del tratto visibile, nel verso p → q, oppure null se la retta non attraversa il rettangolo (anche se lo
 * tocca in un solo spigolo). clipLine di math/classify2d, per una retta data come wᵗx + b = 0, passa di qui.
 */
export function clipLineToBox(p: Vec2, q: Vec2, xDomain: readonly [number, number], yDomain: readonly [number, number]): [Vec2, Vec2] | null {
  const d = [q[0] - p[0], q[1] - p[1]]
  if (!(Math.hypot(d[0], d[1]) > 1e-12)) return null
  let lo = Number.NEGATIVE_INFINITY
  let hi = Number.POSITIVE_INFINITY
  const boxes = [
    [Math.min(...xDomain), Math.max(...xDomain)],
    [Math.min(...yDomain), Math.max(...yDomain)],
  ]
  for (let k = 0; k < 2; k++) {
    const [a, b] = boxes[k]
    if (Math.abs(d[k]) < 1e-15) {
      if (p[k] < a || p[k] > b) return null
      continue
    }
    const ta = (a - p[k]) / d[k]
    const tb = (b - p[k]) / d[k]
    lo = Math.max(lo, Math.min(ta, tb))
    hi = Math.min(hi, Math.max(ta, tb))
  }
  // lo = hi: la retta sfiora uno spigolo, non c'è un tratto da disegnare
  if (!(lo < hi)) return null
  const at = (t: number): Vec2 => [tidy(p[0] + t * d[0]), tidy(p[1] + t * d[1])]
  return [at(lo), at(hi)]
}
