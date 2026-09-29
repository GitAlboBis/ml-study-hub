// Logica delle celle di MatrixGrid: frazioni esatte (le matrici "alla lavagna" con 4 punti hanno entrate come
// 17/48, e scriverle 0.354 toglierebbe allo studente il conto a mano), testo e parlato di una cella, passo della
// rampa divergente o sequenziale, spostamento da tastiera nella griglia. Niente React.
import { fixed, typographic } from '../../kit/format'

/** Una frazione n/d con d > 0. */
export interface Fraction {
  n: number
  d: number
}

/** Valore di una cella: un numero, una frazione data a mano, oppure null (cella ancora da calcolare: "?"). */
export type MatrixCell = number | Fraction | null

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))

/** Riduce la frazione e porta il segno al numeratore. */
function reduce(f: Fraction): Fraction {
  if (f.d === 0) return { n: f.n >= 0 ? 1 : -1, d: 0 }
  const g = gcd(Math.round(f.n), Math.round(f.d)) || 1
  const s = f.d < 0 ? -1 : 1
  const n = (s * Math.round(f.n)) / g
  return { n: n === 0 ? 0 : n, d: Math.abs(Math.round(f.d)) / g }
}

/**
 * La frazione n/d con d ≤ maxDen uguale a x (a meno dell'arrotondamento dei double), per frazioni continue;
 * null se x non è una frazione così piccola (π, √2, 1/97 con maxDen 64).
 */
export function toFraction(x: number, maxDen = 64): Fraction | null {
  if (!Number.isFinite(x)) return null
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const tol = 1e-9 * Math.max(1, ax)
  let h0 = 0
  let h1 = 1
  let k0 = 1
  let k1 = 0
  let b = ax
  for (let i = 0; i < 64; i++) {
    const a = Math.floor(b)
    const h2 = a * h1 + h0
    const k2 = a * k1 + k0
    if (k2 > maxDen) break
    if (Math.abs(ax - h2 / k2) <= tol) return { n: h2 === 0 ? 0 : sign * h2, d: k2 }
    h0 = h1
    h1 = h2
    k0 = k1
    k1 = k2
    const frac = b - a
    if (frac < 1e-15) break
    b = 1 / frac
  }
  return null
}

export interface CellTextOptions {
  /** 'decimal': decimali fissi; 'fraction': frazione se esatta (d ≤ maxDen); 'auto': frazione solo se piccola (d ≤ 12) */
  mode: 'decimal' | 'fraction' | 'auto'
  /** decimali fissi (predefinito 2): una cifra che cambia sotto il cursore non cambia lunghezza */
  decimals?: number
  maxDen?: number
}

export interface CellText {
  /** testo mostrato, con il meno tipografico: "−0.50", "−3/4" */
  text: string
  /** testo per chi ascolta: "meno 0.50", "meno 3 su 4" */
  spoken: string
  /** la frazione da impilare (numeratore sopra, denominatore sotto), se la cella è una frazione non intera */
  frac?: Fraction
}

const speak = (text: string) => text.replace(/^−/, 'meno ')

function fractionText(f: Fraction): CellText {
  const r = reduce(f)
  if (r.d === 1) {
    const text = typographic(String(r.n))
    return { text, spoken: speak(text) }
  }
  const text = typographic(`${r.n}/${r.d}`)
  return { text, spoken: `${r.n < 0 ? 'meno ' : ''}${Math.abs(r.n)} su ${r.d}`, frac: r }
}

/** Testo, parlato ed eventuale frazione di una cella. */
export function cellText(v: MatrixCell, o: CellTextOptions): CellText {
  if (v === null) return { text: '?', spoken: 'non ancora calcolata' }
  if (typeof v === 'object') return fractionText(v)
  if (o.mode !== 'decimal') {
    const f = toFraction(v, o.mode === 'auto' ? Math.min(12, o.maxDen ?? 12) : (o.maxDen ?? 64))
    if (f !== null) return fractionText(f)
  }
  const text = typographic(fixed(o.decimals ?? 2)(v))
  return { text, spoken: speak(text) }
}

/** Valore numerico di una cella (NaN se celata): serve alla colormap. */
export const cellNumber = (v: MatrixCell): number => (v === null ? Number.NaN : typeof v === 'number' ? v : v.n / v.d)

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

/** Passo 1-7 della rampa divergente --viz-div-*: 4 è lo zero (grigio), 1 il negativo più forte, 7 il positivo. */
export function divStep(v: number, range: number): number | null {
  if (!Number.isFinite(v)) return null
  if (!(range > 0)) return 4
  const t = clamp(v / range, -1, 1)
  return Math.round(((t + 1) / 2) * 6) + 1
}

/** Passo 1-7 della rampa sequenziale --viz-seq-*, da lo (poco) a hi (tanto). */
export function seqStep(v: number, lo: number, hi: number): number | null {
  if (!Number.isFinite(v)) return null
  if (!(hi > lo)) return 1
  return Math.round(clamp((v - lo) / (hi - lo), 0, 1) * 6) + 1
}

/**
 * Cella attiva dopo un tasto: frecce di una cella, Inizio/Fine a capo e in coda della riga, con Ctrl la prima e
 * l'ultima cella della matrice, Pag su/giù la prima e l'ultima riga. null se il tasto non riguarda la griglia.
 */
export function gridMove(at: readonly [number, number], key: string, ctrl: boolean, rows: number, cols: number): [number, number] | null {
  const [i, j] = at
  switch (key) {
    case 'ArrowRight':
      return [i, Math.min(cols - 1, j + 1)]
    case 'ArrowLeft':
      return [i, Math.max(0, j - 1)]
    case 'ArrowDown':
      return [Math.min(rows - 1, i + 1), j]
    case 'ArrowUp':
      return [Math.max(0, i - 1), j]
    case 'Home':
      return ctrl ? [0, 0] : [i, 0]
    case 'End':
      return ctrl ? [rows - 1, cols - 1] : [i, cols - 1]
    case 'PageUp':
      return [0, j]
    case 'PageDown':
      return [rows - 1, j]
    default:
      return null
  }
}
