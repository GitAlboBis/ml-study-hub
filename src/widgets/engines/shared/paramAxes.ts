// Logica pura di ParamChart ("grandezza contro parametro"): assi logaritmici sopra le scale lineari del Plot del kit,
// tacche, testo delle tacche, campionamento delle curve teoriche, costruzione punto per punto, dominio automatico.
//
// Il Plot del kit ha solo scale lineari (Plot.tsx): un asse logaritmico si ottiene disegnando log10 dei valori e
// scrivendo sulle tacche i valori veri. Qui le due conversioni (toAxis, fromAxis) e tutto ciò che ne segue.
// Il file non si chiama paramChart.ts: su Windows './ParamChart' troverebbe questo invece del componente.
import { ticks as d3ticks } from 'd3'
import type { ParamAxis } from './ParamChart'
import type { AxisSpec } from './types'

const tidy = (v: number) => Number(v.toPrecision(12))

type Domain = readonly [number, number]
type AxisExtras = { domain?: Domain; format?: (v: number) => string }

/**
 * L'asse di un preset (AxisSpec: it, en, unità, simbolo, estremi, scala) come asse di ParamChart (ParamAxis), così
 * l'`axisX` di un preset passa al grafico senza riscriverlo. Il nome italiano va nel titolo, simbolo e unità nel
 * simbolo come li vuole l'Axis del kit ("x [cm]"). Il termine inglese non ha posto sull'asse (è aria-hidden): il
 * motore lo mostra nella legenda dei termini. `extras` dà o sostituisce estremi e formato.
 */
export function axisFromSpec(spec: AxisSpec & { domain: Domain }, extras?: AxisExtras): ParamAxis & { domain: Domain }
export function axisFromSpec(spec: AxisSpec, extras: AxisExtras & { domain: Domain }): ParamAxis & { domain: Domain }
export function axisFromSpec(spec: AxisSpec, extras?: AxisExtras): ParamAxis
export function axisFromSpec(spec: AxisSpec, extras: AxisExtras = {}): ParamAxis {
  const symbol = [spec.symbol, spec.unit !== undefined && spec.unit !== '' ? `[${spec.unit}]` : undefined].filter((s) => s !== undefined && s !== '').join(' ')
  const out: ParamAxis = { label: spec.it }
  if (symbol !== '') out.symbol = symbol
  const domain = extras.domain ?? spec.domain
  if (domain !== undefined) out.domain = domain
  if (spec.log !== undefined) out.log = spec.log
  if (extras.format !== undefined) out.format = extras.format
  return out
}

/** Dal valore alla coordinata del Plot: log10 in scala log (NaN per i non positivi, che su un asse log non esistono). */
export const toAxis = (v: number, log: boolean): number => (log ? (v > 0 ? Math.log10(v) : Number.NaN) : v)

/** Dalla coordinata del Plot al valore: 10^a in scala log. */
export const fromAxis = (a: number, log: boolean): number => (log ? tidy(10 ** a) : a)

/**
 * Tacche di un asse, nei VALORI (non nelle coordinate). In scala log: 1, 2, 5 per ogni decade se non sono più di
 * 2·count + 1, altrimenti le sole potenze di 10 se non sono più di 2·count − 1, altrimenti una potenza ogni due (o più)
 * decadi; meno di una decade: tacche lineari di d3. `count` è il numero indicativo di tacche (predefinito 5).
 */
export function axisTicks(domain: readonly [number, number], log: boolean, count = 5): number[] {
  const lo = Math.min(domain[0], domain[1])
  const hi = Math.max(domain[0], domain[1])
  if (!log || !(lo > 0)) return d3ticks(lo, hi, count)
  const decades = Math.log10(hi / lo)
  if (decades < 1) return d3ticks(lo, hi, count)
  const inside = (v: number) => v >= lo * (1 - 1e-9) && v <= hi * (1 + 1e-9)
  const e0 = Math.floor(Math.log10(lo))
  const e1 = Math.ceil(Math.log10(hi))
  const dense: number[] = []
  for (let e = e0; e <= e1; e++) for (const m of [1, 2, 5]) dense.push(tidy(m * 10 ** e))
  const withMantissas = dense.filter(inside)
  if (withMantissas.length <= 2 * count + 1) return withMantissas
  const first = Math.ceil(Math.log10(lo) - 1e-9)
  const powers = Math.floor(Math.log10(hi) + 1e-9) - first + 1
  const every = Math.max(1, Math.ceil(powers / Math.max(1, 2 * count - 1)))
  const out: number[] = []
  for (let e = first; e <= e1; e += every) out.push(tidy(10 ** e))
  return out.filter(inside)
}

/** Testo compatto di una tacca o di una lettura: niente zeri inutili, esponente sotto 10⁻³ e da 10⁵, segno meno vero. */
export function formatTick(v: number): string {
  if (!Number.isFinite(v)) return Number.isNaN(v) ? '—' : v > 0 ? '∞' : '−∞'
  if (v === 0) return '0'
  const a = Math.abs(v)
  let text: string
  if (a >= 1e5 || a < 1e-3) {
    const e = Math.floor(Math.log10(a))
    const m = Number((v / 10 ** e).toPrecision(3))
    text = `${m}e${e}`
  } else {
    text = String(Number(v.toPrecision(6)))
  }
  return text.replace(/-/g, '−')
}

/**
 * Testo di una lettura (cursore, punti, ottimi): 3 cifre significative, senza mai tagliare le cifre intere (1234.5 →
 * 1235), esponente sotto 10⁻³ e da 10⁵ come formatTick, segno meno vero. Le tacche restano a formatTick: sono valori
 * tondi e lì 6 cifre non si vedono mai; il cursore invece cade ovunque, e "N = 31.6228" è rumore da leggere.
 */
export function formatReading(v: number): string {
  if (!Number.isFinite(v)) return Number.isNaN(v) ? '—' : v > 0 ? '∞' : '−∞'
  if (v === 0) return '0'
  const a = Math.abs(v)
  let text: string
  if (a >= 1e5 || a < 1e-3) {
    let e = Math.floor(Math.log10(a))
    let m = Number((v / 10 ** e).toPrecision(3))
    // 9.9999e−4 arrotonda a 10.0e−4: si scrive 1e−3
    if (Math.abs(m) >= 10) {
      m = Number((m / 10).toPrecision(3))
      e += 1
    }
    text = `${m}e${e}`
  } else if (a >= 100) {
    text = String(Math.round(v))
  } else {
    text = String(Number(v.toPrecision(3)))
  }
  return text.replace(/-/g, '−')
}

/** `n` punti [x, f(x)] equispaziati nello spazio dell'asse (in scala log: equispaziati in log10 x), estremi esatti. */
export function sampleCurve(f: (x: number) => number, domain: readonly [number, number], log: boolean, n = 161): [number, number][] {
  const [a, b] = [toAxis(domain[0], log), toAxis(domain[1], log)]
  if (!Number.isFinite(a) || !Number.isFinite(b) || n < 1) return []
  return Array.from({ length: n }, (_, i) => {
    const x = i === 0 ? domain[0] : i === n - 1 ? domain[1] : fromAxis(a + ((b - a) * i) / (n - 1), log)
    return [x, f(x)]
  })
}

/**
 * Costruzione punto per punto: i punti con x ≤ upTo e, se la curva prosegue, il punto interpolato esattamente in upTo
 * (nello spazio dell'asse), così la curva avanza con continuità mentre il racconto fa crescere upTo.
 */
export function clipUpTo(pts: readonly (readonly [number, number])[], upTo: number, log: boolean): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i]
    if (x <= upTo) {
      out.push([x, y])
      continue
    }
    const prev = pts[i - 1]
    if (prev !== undefined && prev[0] < upTo) {
      const t = (toAxis(upTo, log) - toAxis(prev[0], log)) / (toAxis(x, log) - toAxis(prev[0], log))
      out.push([upTo, prev[1] + t * (y - prev[1])])
    }
    break
  }
  return out
}

/** Dominio che contiene i valori con un margine del 5% (moltiplicativo in scala log); un valore solo si allarga. */
export function autoDomain(values: readonly number[], log: boolean, pad = 0.05): [number, number] {
  const vs = values.filter((v) => Number.isFinite(v) && (!log || v > 0))
  if (vs.length === 0) return log ? [1, 10] : [0, 1]
  const lo = Math.min(...vs)
  const hi = Math.max(...vs)
  if (lo === hi) return log ? [lo / 10, hi * 10] : [lo - 1, hi + 1]
  if (log) {
    const [a, b] = [Math.log10(lo), Math.log10(hi)]
    const d = (b - a) * pad
    return [10 ** (a - d), 10 ** (b + d)]
  }
  const d = (hi - lo) * pad
  return [lo - d, hi + d]
}
