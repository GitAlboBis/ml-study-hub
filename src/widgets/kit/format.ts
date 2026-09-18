// Numeri dei controlli e delle letture del kit: formato e griglia dei passi. Niente React qui dentro:
// i file dei componenti esportano solo componenti (regola react/only-export-components), quindi le
// funzioni condivise da Slider, NumberField, Readout e LiveFormula stanno in questo file.

export type NumberFormat = (value: number) => string

/** Testo dei valori che non sono numeri finiti. Il meno è quello ASCII: lo ingentilisce `typographic`. */
function nonFinite(value: number): string {
  if (Number.isNaN(value)) return '—'
  return value > 0 ? '∞' : '-∞'
}

/**
 * Formato a decimali fissi con il punto, come nelle slide del corso: fixed(2)(0.5) === '0.50'.
 * Decimali fissi e non "quanti ne servono": un numero che cambia sotto il cursore non deve cambiare
 * di lunghezza (1, 1.05, 1.1 farebbe ballare la riga). Per i conteggi si usa fixed(0).
 */
export function fixed(digits: number): NumberFormat {
  return (value) => {
    if (!Number.isFinite(value)) return nonFinite(value)
    const text = value.toFixed(digits)
    // -0.001 a due decimali darebbe "-0.00": uno zero non ha segno
    return Number(text) === 0 ? text.replace('-', '') : text
  }
}

const DEFAULT_FORMAT = fixed(2)

/** Testo di una lettura: i numeri passano dal formato (due decimali se manca), le stringhe restano come sono. */
export function formatValue(value: number | string, format: NumberFormat = DEFAULT_FORMAT): string {
  if (typeof value === 'string') return value
  return Number.isFinite(value) ? format(value) : nonFinite(value)
}

/**
 * Per lo schermo e per chi ascolta: il trattino che apre un numero diventa il segno meno vero (U+2212).
 * Solo a inizio testo o dopo spazio, parentesi o uguale: il trattino di "classe-2" resta un trattino.
 */
export const typographic = (text: string): string => text.replace(/(^|[\s(=])-(?=[\d.∞])/g, '$1−')

/** Decimali che servono per scrivere n senza perdere cifre (0.05 → 2, 1e-3 → 3), al più 10. */
export function decimalsOf(n: number): number {
  if (!Number.isFinite(n)) return 0
  const text = Math.abs(n).toFixed(10).replace(/0+$/, '')
  return text.length - text.indexOf('.') - 1
}

export const clamp = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), max)

/**
 * Riporta v dentro [min, max] sul valore più vicino della griglia min + k·step e toglie il rumore
 * in virgola mobile (0.1 + 0.2 torna 0.3). Se max non cade sulla griglia l'ultimo valore è quello
 * sotto max, come in un input range del browser.
 */
export function snapToStep(v: number, min: number, max: number, step: number): number {
  if (Number.isNaN(v)) return min
  const inside = clamp(v, min, max)
  if (!(step > 0) || !Number.isFinite(step)) return inside
  let k = Math.round((inside - min) / step)
  if (min + k * step > max + step * 1e-9) k -= 1
  const digits = Math.min(10, Math.max(decimalsOf(step), decimalsOf(min)))
  return Number((min + k * step).toFixed(digits))
}

/** Salto di PageUp e PageDown: un decimo della scala, arrotondato a passi interi, almeno un passo. */
export function pageStep(min: number, max: number, step: number): number {
  if (!(step > 0)) return (max - min) / 10
  return Math.max(1, Math.round((max - min) / step / 10)) * step
}

/** Formato che mostra tutti i decimali del passo: step 0.05 → due decimali, step 5 → nessuno. */
export const formatForStep = (min: number, step: number): NumberFormat =>
  fixed(Math.min(10, Math.max(decimalsOf(step), decimalsOf(min))))
