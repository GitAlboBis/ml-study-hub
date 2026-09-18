// Logica del widget m09-cinque-campioni-tre-h (concetti c28 oversmoothing, c29 stima molto variabile, c32 la figura
// delle tre stime sugli stessi cinque campioni). Cinque pixel etichettati "acqua" in due bande spettrali (telerileva-
// mento: i campioni di training sono pochi perché l'etichettatura a terra costa); si stima p(x | acqua) con finestre
// normali 2-D, come nella slide p57, sul dominio [0, 10] × [0, 8].
import { createRng } from '../../lib/rng'
import { easeInOut } from '../engines/density1d/density1d'

export type P2 = readonly [number, number]

export const XD: readonly [number, number] = [0, 10]
export const YD: readonly [number, number] = [0, 8]
/** Le posizioni indicative dell'inventario: tre ravvicinati a sinistra, uno in fondo a destra, uno davanti a destra. */
export const SAMPLES0: readonly P2[] = [
  [2.0, 4.5],
  [2.8, 3.2],
  [3.6, 4.8],
  [7.5, 6.5],
  [7.0, 2.0],
]
export const H0 = 0.5
export const H_RANGE: readonly [number, number] = [0.1, 2]
export const H_STEP = 0.01
export const PRESETS: readonly number[] = [1, 0.5, 0.2]

interface Blob {
  weight: number
  mu: P2
  sigma: number
}

/** La densità vera da cui "Ricampiona" estrae altri cinque pixel: tre gruppi, come la disposizione della slide. */
export const TRUTH: readonly Blob[] = [
  { weight: 0.6, mu: [2.8, 4.2], sigma: 0.7 },
  { weight: 0.2, mu: [7.5, 6.5], sigma: 0.5 },
  { weight: 0.2, mu: [7.0, 2.0], sigma: 0.5 },
]

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Cinque pixel dalla densità vera, a seed, dentro il dominio e con un decimale. */
export function drawSet(seed: number): P2[] {
  const r = createRng(seed)
  return Array.from({ length: 5 }, () => {
    let u = r.next()
    let c = TRUTH[0]
    for (const comp of TRUTH) {
      if (u < comp.weight) {
        c = comp
        break
      }
      u -= comp.weight
    }
    return [Number(clamp(r.normal(c.mu[0], c.sigma), XD[0] + 0.2, XD[1] - 0.2).toFixed(1)), Number(clamp(r.normal(c.mu[1], c.sigma), YD[0] + 0.2, YD[1] - 0.2).toFixed(1))] as const
  })
}

/**
 * p̂(x) = (1/N) Σ (1/(2πh²)) exp(−‖x − x_k‖²/(2h²)). Con `slideScale` si toglie 1/N: è la somma delle finestre,
 * la scala che si legge sugli assi della slide.
 */
export function estimate(x: number, y: number, samples: readonly P2[], h: number, slideScale = false): number {
  const c = 1 / (2 * Math.PI * h * h)
  let s = 0
  for (const [a, b] of samples) {
    const dx = x - a
    const dy = y - b
    s += Math.exp(-(dx * dx + dy * dy) / (2 * h * h))
  }
  return (c * s) / (slideScale ? 1 : samples.length)
}

/** Un ago isolato: (1/N) · 1/(2πh²) (senza 1/N con la scala della slide). */
export const needle = (h: number, n = 5, slideScale = false): number => 1 / (2 * Math.PI * h * h) / (slideScale ? 1 : n)

/**
 * I massimi locali della stima su una griglia cols × rows (celle più alte delle 8 vicine, bordi esclusi, e più alte
 * di un milionesimo del massimo: le pianure a zero non contano).
 */
export function countMaxima(samples: readonly P2[], h: number, cols = 101, rows = 81): number {
  const v = new Float64Array(cols * rows)
  let top = 0
  for (let j = 0; j < rows; j++) {
    const y = YD[0] + ((YD[1] - YD[0]) * j) / (rows - 1)
    for (let i = 0; i < cols; i++) {
      const x = XD[0] + ((XD[1] - XD[0]) * i) / (cols - 1)
      const e = estimate(x, y, samples, h)
      v[j * cols + i] = e
      if (e > top) top = e
    }
  }
  let count = 0
  for (let j = 1; j < rows - 1; j++) {
    for (let i = 1; i < cols - 1; i++) {
      const c = v[j * cols + i]
      if (c <= top * 1e-6) continue
      let max = true
      for (let dj = -1; dj <= 1 && max; dj++) for (let di = -1; di <= 1; di++) if ((di !== 0 || dj !== 0) && v[(j + dj) * cols + i + di] >= c) max = false
      if (max) count++
    }
  }
  return count
}

/** I valori dello slider di h: 0.10, 0.11, …, 2.00. */
export const H_VALUES: readonly number[] = Array.from({ length: Math.round((H_RANGE[1] - H_RANGE[0]) / H_STEP) + 1 }, (_, i) => Number((H_RANGE[0] + i * H_STEP).toFixed(2)))

/**
 * L'intervallo di h dello slider in cui, salendo, il contatore passa per la prima volta a 3 e ci resta: i tre pixel
 * vicini fusi in un rilievo, gli altri due separati. null se il contatore non vale mai 3.
 */
export function intervalOfThree(samples: readonly P2[]): [number, number] | null {
  // prima una griglia rada su tutti gli h (veloce), poi i due bordi rifiniti con la griglia del contatore mostrato
  let lo = -1
  let hi = -1
  for (let i = 0; i < H_VALUES.length; i++) {
    const c = countMaxima(samples, H_VALUES[i], 61, 49)
    if (c === 3) {
      if (lo < 0) lo = i
      hi = i
    } else if (lo >= 0) break
  }
  if (lo < 0) return null
  const fine = (i: number) => countMaxima(samples, H_VALUES[i]) === 3
  const from = Math.max(0, lo - 6)
  let a = lo
  for (let i = from; i <= Math.min(H_VALUES.length - 1, lo + 6); i++) {
    if (fine(i)) {
      a = i
      break
    }
  }
  let b = hi
  for (let i = Math.min(H_VALUES.length - 1, hi + 6); i >= Math.max(a, hi - 6); i--) {
    if (fine(i)) {
      b = i
      break
    }
  }
  return [H_VALUES[a], H_VALUES[b]]
}

export type Regime = 'aghi' | 'intermedio' | 'liscia'

/** Il timbro del regime: aghi sotto 0.3, liscia (oversmoothing) da 0.8 in su. */
export const regimeOf = (h: number): Regime => (h <= 0.3 ? 'aghi' : h >= 0.8 ? 'liscia' : 'intermedio')

// --- racconto ---

export const STEP = { quadro: 0, liscia: 1, campane: 2, aghi: 3, scala: 4, estrazioni: 5, trascina: 6 } as const

export const STEPS = [
  { id: 'quadro', label: 'Cinque pixel, una stima', durationMs: 1500 },
  { id: 'liscia', label: 'h = 1: i dettagli si perdono', durationMs: 1500 },
  { id: 'campane', label: 'h = 0.5: cinque campane', durationMs: 1500 },
  { id: 'aghi', label: 'h = 0.2: cinque aghi', durationMs: 1500 },
  { id: 'scala', label: 'La scala della slide', durationMs: 1500 },
  { id: 'estrazioni', label: 'Altri cinque pixel: varianza e bias', durationMs: 1600 },
  { id: 'trascina', label: 'Sposta un pixel', durationMs: 1200 },
] as const

/** h imposto da un passo (in scala logaritmica dall'h precedente); null = quello dello slider. */
export function hOfStep(index: number, p: number, userH: number): number | null {
  const between = (a: number, b: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * easeInOut(Math.min(1, Math.max(0, p))))
  switch (index) {
    case STEP.liscia:
      return between(userH, 1)
    case STEP.campane:
      return between(1, 0.5)
    case STEP.aghi:
      return between(0.5, 0.2)
    case STEP.scala:
      return 0.2
    default:
      return null
  }
}

export interface CaptionCtx {
  h: string
  maxima: number
  needle: string
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.quadro:
      return String.raw`Cinque pixel etichettati "acqua" in due bande spettrali: in telerilevamento i campioni di training sono spesso pochissimi, perché l'etichettatura a terra costa. A sinistra la pianta con le curve di livello della stima, a destra la superficie come nella slide. Con $h = ${c.h}$ il contatore dei massimi locali segna ${c.maxima}.`
    case STEP.liscia:
      return String.raw`Con $h = 1$ la superficie è liscia e i rilievi si fondono: i tre pixel vicini non si distinguono più. È l'**oversmoothing**: aumentando $h$ la stima si liscia ma i dettagli (*sharply peaked features*) si perdono.`
    case STEP.campane:
      return String.raw`Con $h = 0.5$ si riconoscono cinque campane, le tre vicine parzialmente sovrapposte: cinque massimi locali.`
    case STEP.aghi:
      return String.raw`Con $h = 0.2$ restano cinque aghi isolati, con densità quasi nulla fra l'uno e l'altro: la stima è **molto variabile** e insegue i singoli campioni (*overfitting to the specific samples*), catturando il rumore invece della distribuzione. Un ago isolato vale $\frac15\cdot\frac{1}{2\pi\cdot 0.2^2} = ${c.needle}$.`
    case STEP.scala:
      return String.raw`Le scale verticali della slide (circa 0.2, 0.6, 3) sono quelle della **somma** delle finestre, senza il fattore $1/N$: con "Scala come nella slide" gli assi passano ai valori della somma. La stima vera, con $1/N$, è cinque volte più bassa.`
    case STEP.estrazioni:
      return String.raw`Cinque estrazioni diverse dalla stessa densità vera. Con $h = 0.2$ la superficie cambia completamente da un'estrazione all'altra (**varianza**); con $h = 1$ cambia poco ma resta sfocata (**bias**). Con pochi campioni nessun $h$ è "giusto": è un compromesso.`
    default:
      return String.raw`Trascina un pixel nella pianta: con $h$ piccolo il suo ago lo segue senza toccare il resto; con $h$ grande tutta la superficie si deforma dolcemente. Ora $h = ${c.h}$, massimi locali: ${c.maxima}.`
  }
}

export const TEX_FIVE = String.raw`\hat{p}(\mathbf{x})=\frac{1}{5}\sum_{k=1}^{5}\frac{1}{2\pi h^2}\exp\left(-\frac{\|\mathbf{x}-\mathbf{x}_k\|^2}{2h^2}\right)`
export const TEX_SLIDE = String.raw`\hat{p}(\mathbf{x})=\frac{1}{5}\sum_{k=1}^{5}\delta(\mathbf{x}-\mathbf{x}_k),\qquad \delta(\mathbf{x})=\frac{1}{2\pi h^2}\exp\left(-\frac{\|\mathbf{x}\|^2}{2h^2}\right),\qquad h\in\{1,\ 0.5,\ 0.2\}`
export const TEX_LIVE = String.raw`h=\val{h}:\quad \hat p(\val[1]{x1},\ \val[1]{x2})=\val[4]{p},\qquad \text{ago isolato}\ \frac{1}{5}\cdot\frac{1}{2\pi\cdot\val{h}^2}=\val[3]{needle}`

export const CHALLENGE_PROMPT = String.raw`Muovi $h$ finché il contatore dei massimi locali passa da 5 a **3** (i tre pixel vicini fusi in un solo rilievo, gli altri due separati) e annota **l'intervallo di $h$** in cui resta 3. Poi scegli perché, fuori da quell'intervallo, la stima racconta una storia diversa sugli stessi dati.`
export const CHALLENGE_HINT = String.raw`Parti da $h = 0.5$ (cinque massimi) e sali di un centesimo alla volta con le frecce: annota il primo $h$ con 3 massimi, poi continua finché il contatore cambia di nuovo (o finisce lo slider). Tolleranza: tre centesimi.`

export type Why = '' | 'lisciare' | 'dati' | 'volume'

export interface ChallengeVerdict {
  target: [number, number] | null
  rangeOk: boolean
  whyOk: boolean
  ok: boolean
}

export function judge(samples: readonly P2[], lo: number, hi: number, why: Why): ChallengeVerdict {
  const target = intervalOfThree(samples)
  const rangeOk = target !== null && Math.abs(lo - target[0]) <= 0.031 && Math.abs(hi - target[1]) <= 0.031
  const whyOk = why === 'lisciare'
  return { target, rangeOk, whyOk, ok: rangeOk && whyOk }
}
