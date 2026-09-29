// I parametri dei preset (ParamSpec) come valori di uno slider: logica pura, senza React.
//
// Uno slider del kit è lineare e si ferma sulla griglia del suo passo. Per avere anche la scala logaritmica e i
// valori della slide (0.37 su una griglia di 0.05) ParamSlider fa scorrere lo slider sull'INDICE di un elenco
// finito di valori, costruito qui: così ogni tacca è un numero leggibile e la formula viva mostra esattamente il
// numero usato nel calcolo (WIDGET_GUIDE §8). È la generalizzazione di niceLogSteps di density1d, copiata qui
// perché la base comune non dipende da un motore.
import { decimalsOf, fixed } from '../../kit/format'
import type { ParamSpec } from './types'

/**
 * Mantisse "tonde" per decade: passi di al più il 20%, tutti scrivibili con due cifre significative.
 * C'è 1.5 perché 0.15 e 1.5 sono soglie dell'inventario m09 (come in density1d).
 */
const MANTISSAS = [1, 1.2, 1.4, 1.5, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9]
/** Toglie il rumore in virgola mobile (0.1 · 3 = 0.30000000000000004). */
const tidy = (v: number) => Number(v.toPrecision(10))
/** Oltre questo numero di valori lo slider non ha più senso: il passo è troppo fine per l'intervallo. */
const MAX_VALUES = 10001

/**
 * Valori tondi fra min e max in scala logaritmica, estremi compresi (lo stesso elenco di density1d).
 * RangeError se non vale 0 < min ≤ max.
 */
export function niceLogSteps(min: number, max: number): number[] {
  if (!(min > 0) || !(max >= min) || !Number.isFinite(max)) throw new RangeError(`niceLogSteps: serve 0 < min ≤ max (ricevuti ${min}, ${max})`)
  if (max === min) return [min]
  const inside: number[] = []
  for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
    for (const m of MANTISSAS) {
      const v = tidy(m * 10 ** e)
      if (v > min * (1 + 1e-9) && v < max * (1 - 1e-9)) inside.push(v)
    }
  }
  return [min, ...inside, max]
}

/** Passo predefinito della scala lineare: un centesimo dell'intervallo, arrotondato a 1, 2 o 5 per una potenza di 10. */
export function defaultLinearStep(min: number, max: number): number {
  const raw = (max - min) / 100
  if (!(raw > 0) || !Number.isFinite(raw)) return 1
  const p = 10 ** Math.floor(Math.log10(raw))
  const m = raw / p
  return tidy((m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p)
}

/** Riporta v sulla griglia min + k·step, senza rumore in virgola mobile. */
const onGrid = (v: number, min: number, step: number) => {
  const digits = Math.min(10, Math.max(decimalsOf(step), decimalsOf(min)))
  return Number((min + Math.round((v - min) / step) * step).toFixed(digits))
}

/** Unione ordinata e senza doppioni (a meno del rumore in virgola mobile) dei valori dentro [min, max]. */
function merge(base: readonly number[], extra: readonly number[], min: number, max: number): number[] {
  const all = [...base, ...extra.filter((v) => Number.isFinite(v) && v >= min && v <= max)].map(tidy).sort((a, b) => a - b)
  return all.filter((v, i) => i === 0 || v !== all[i - 1])
}

/**
 * L'elenco dei valori su cui scorre lo slider del parametro, crescente e senza doppioni:
 * - 'log': i valori tondi di niceLogSteps; con `step` solo i loro multipli del passo (N intero: step 1);
 * - 'int': gli interi da min a max con il passo (predefinito 1);
 * - 'linear' (predefinito): la griglia min + k·step (predefinito defaultLinearStep) e max.
 * In tutti i casi entrano anche gli agganci della slide (`snaps`) e il valore iniziale.
 * RangeError se il parametro non è valido (vedi paramProblems).
 */
export function paramValues(spec: ParamSpec): number[] {
  const problems = paramProblems(spec)
  if (problems.length > 0) throw new RangeError(`paramValues(${spec.id}): ${problems.join('; ')}`)
  const { min, max } = spec
  const extra = [...(spec.snaps ?? []), spec.initial]
  const scale = spec.scale ?? 'linear'
  if (scale === 'log') {
    const nice = niceLogSteps(min, max)
    const step = spec.step
    const base = step === undefined ? nice : nice.map((v) => Math.min(max, Math.max(min, onGrid(v, 0, step))))
    return merge(base, extra, min, max)
  }
  const step = scale === 'int' ? Math.max(1, Math.round(spec.step ?? 1)) : (spec.step ?? defaultLinearStep(min, max))
  const count = Math.floor((max - min) / step + 1e-9)
  const grid = Array.from({ length: count + 1 }, (_, k) => onGrid(min + k * step, min, step))
  if (grid.at(-1)! < max) grid.push(max)
  return merge(grid, extra, min, max)
}

/** Indice del valore dell'elenco più vicino a v; in scala logaritmica per i parametri 'log'. */
export function nearestParamIndex(spec: ParamSpec, values: readonly number[], v: number): number {
  const logScale = spec.scale === 'log' && v > 0
  let best = 0
  let bestD = Number.POSITIVE_INFINITY
  values.forEach((x, i) => {
    const d = logScale ? Math.abs(Math.log(x) - Math.log(v)) : Math.abs(x - v)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

/** Il valore dello slider più vicino a v (un valore imposto da un passo dello storyboard, un preset della slide). */
export function snapParam(spec: ParamSpec, v: number): number {
  const values = paramValues(spec)
  return values[nearestParamIndex(spec, values, v)] ?? spec.initial
}

/**
 * Decimali con cui si scrive il parametro: quelli del passo, degli estremi, degli agganci e del valore iniziale (al
 * più 4). Iniziale e agganci entrano nell'elenco di paramValues anche fuori dalla griglia del passo: se non contassero,
 * 0.25 su un passo di 0.5 si scriverebbe 0.3 e la formula viva mostrerebbe un numero diverso da quello del calcolo.
 */
export function paramDecimals(spec: ParamSpec): number {
  if (spec.scale === 'int') return 0
  const offGrid = [...(spec.snaps ?? []), spec.initial].map(decimalsOf)
  if (spec.scale === 'log') return spec.step !== undefined ? Math.min(4, Math.max(decimalsOf(spec.step), ...offGrid)) : Number.NaN
  const step = spec.step ?? defaultLinearStep(spec.min, spec.max)
  return Math.min(4, Math.max(decimalsOf(step), decimalsOf(spec.min), ...offGrid))
}

/**
 * Testo del valore di un parametro. Decimali fissi in scala lineare e intera; in scala log (senza passo) come h di
 * density1d sotto 10 (almeno due decimali: 0.05, 0.50, 3.00) e senza decimali superflui sopra (250).
 */
export function formatParam(spec: ParamSpec, v: number): string {
  const d = paramDecimals(spec)
  if (!Number.isNaN(d)) return fixed(d)(v)
  const own = Math.min(4, decimalsOf(v))
  return fixed(Math.abs(v) >= 10 ? own : Math.max(2, own))(v)
}

/** Che cosa non va in un parametro, in parole: vuoto se è sano. Lo usano paramValues e presetContract. */
export function paramProblems(spec: ParamSpec): string[] {
  const out: string[] = []
  const { id, min, max, initial, step } = spec
  const scale = spec.scale ?? 'linear'
  if (![min, max, initial].every(Number.isFinite)) return [`${id}: min, max e iniziale devono essere numeri finiti`]
  if (!(min < max)) out.push(`${id}: serve min < max (min ${min}, max ${max})`)
  if (initial < min || initial > max) out.push(`${id}: il valore iniziale ${initial} è fuori da [${min}, ${max}]`)
  if (scale === 'log' && !(min > 0)) out.push(`${id}: la scala log vuole min > 0 (min ${min})`)
  if (scale === 'int' && ![min, max, initial].every(Number.isInteger)) out.push(`${id}: in scala intera min, max e iniziale devono essere interi`)
  if (step !== undefined && !(step > 0 && Number.isFinite(step))) out.push(`${id}: il passo deve essere positivo (passo ${step})`)
  for (const s of spec.snaps ?? []) if (!(s >= min && s <= max)) out.push(`${id}: l'aggancio ${s} è fuori da [${min}, ${max}]`)
  if (out.length === 0 && scale !== 'log') {
    const st = scale === 'int' ? Math.max(1, Math.round(step ?? 1)) : (step ?? defaultLinearStep(min, max))
    if ((max - min) / st + 1 > MAX_VALUES) out.push(`${id}: il passo ${st} dà più di ${MAX_VALUES} valori`)
  }
  return out
}
