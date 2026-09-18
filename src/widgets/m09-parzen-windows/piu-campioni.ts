// Logica del widget m09-piu-campioni-h-piu-stretto (concetto c30: al crescere di N, h può diminuire; con pochi
// campioni h va aumentato per evitare buchi nella rappresentazione della densità). Consumo elettrico orario di una
// casa, bimodale: notte attorno a 0.35 kWh, giorno attorno a 1.4 kWh. Per ogni N si cerca l'h che minimizza l'errore
// quadratico integrato; i punti (N, h*) in scala log-log si allineano su una retta di pendenza circa −1/5 (risultato
// di letteratura per il kernel gaussiano, non presente nella fonte).
import { parzen1d } from '../../lib/ml/nonparam'
import { linspace, mixturePdf, trapz } from '../../lib/ml/stats'
import { niceLogSteps } from '../engines/density1d/density1d'
import { binnedGaussKde, mixtureSamples, niceSteps } from './parzen-lab'

export const COMPONENTS = [
  { weight: 0.45, mu: 0.35, sigma: 0.1 },
  { weight: 0.55, mu: 1.4, sigma: 0.35 },
] as const
export const DOMAIN: readonly [number, number] = [0, 2.5]
export const N_STEPS: readonly number[] = niceSteps(10, 5000)
export const N0 = 20
export const H_STEPS: readonly number[] = niceLogSteps(0.01, 1)
export const H0 = 0.03
export const SEED0 = 1
/** Griglia uniforme di tutti i calcoli (serve uniforme alla stima a bin). */
export const GRID = linspace(DOMAIN[0], DOMAIN[1], 1001)

const comps = COMPONENTS.map((c) => ({ ...c }))
export const truth = (x: number): number => mixturePdf(x, comps)
export const TRUTH_ON_GRID = GRID.map(truth)

/** I primi N consumi (kWh, tre decimali) di una serie a seed: aumentare N aggiunge ore, non rimescola. */
export const drawSamples = (seed: number, n: number): number[] => mixtureSamples(seed * 7919 + 17, n, COMPONENTS, DOMAIN, 3)

/** Oltre questo N si usa la stima a bin (stessi numeri a meno di qualche per mille del picco, molto più veloce). */
export const EXACT_MAX = 100

/** La stima gaussiana sulla griglia. */
export function estimateOnGrid(samples: readonly number[], h: number): number[] {
  if (samples.length === 0) return GRID.map(() => 0)
  if (samples.length > EXACT_MAX) return binnedGaussKde(GRID, samples, h)
  return GRID.map((x) => parzen1d(x, samples, h, 'gaussiano'))
}

/** ISE = ∫ (p̂ − p)² dx sul dominio. */
export const iseOf = (est: readonly number[]): number => trapz(GRID, est.map((v, i) => (v - TRUTH_ON_GRID[i]) ** 2))

export interface IseCurve {
  hs: readonly number[]
  ise: number[]
  /** h dello slider con l'errore minimo e il minimo raffinato (sezione aurea in log h) */
  best: number
  hStar: number
  iseStar: number
}

/** L'errore integrato per ogni h dello slider e il suo minimo h*, raffinato con la sezione aurea in log h. */
export function iseCurve(samples: readonly number[]): IseCurve {
  const f = (h: number) => iseOf(estimateOnGrid(samples, h))
  const ise = H_STEPS.map(f)
  let i = 0
  ise.forEach((v, j) => {
    if (v < ise[i]) i = j
  })
  let a = Math.log(H_STEPS[Math.max(0, i - 1)])
  let b = Math.log(H_STEPS[Math.min(H_STEPS.length - 1, i + 1)])
  const g = (Math.sqrt(5) - 1) / 2
  let c = b - g * (b - a)
  let d = a + g * (b - a)
  let fc = f(Math.exp(c))
  let fd = f(Math.exp(d))
  for (let k = 0; k < 18; k++) {
    if (fc < fd) {
      b = d
      d = c
      fd = fc
      c = b - g * (b - a)
      fc = f(Math.exp(c))
    } else {
      a = c
      c = d
      fc = fd
      d = a + g * (b - a)
      fd = f(Math.exp(d))
    }
  }
  const refined = fc < fd ? { h: Math.exp(c), v: fc } : { h: Math.exp(d), v: fd }
  const useRefined = refined.v < ise[i]
  return { hs: H_STEPS, ise, best: H_STEPS[i], hStar: useRefined ? refined.h : H_STEPS[i], iseStar: useRefined ? refined.v : ise[i] }
}

const curveCache = new Map<string, IseCurve>()

/** La curva dell'errore dei primi N consumi del seme dato, calcolata una volta sola (serve al grafico log-log). */
export function curveFor(seed: number, n: number): IseCurve {
  const key = `${seed}|${n}`
  let c = curveCache.get(key)
  if (c === undefined) {
    c = iseCurve(drawSamples(seed, n))
    curveCache.set(key, c)
  }
  return c
}

/**
 * I "buchi": tratti in cui la stima è sotto il 5% della densità vera, dove questa non è trascurabile (sopra il 2%
 * del suo massimo). Con pochi campioni e h piccolo la stima lascia vuoti dove i dati ci sarebbero.
 */
export function holes(est: readonly number[]): [number, number][] {
  const top = Math.max(...TRUTH_ON_GRID)
  const out: [number, number][] = []
  let start: number | null = null
  GRID.forEach((x, i) => {
    const hole = TRUTH_ON_GRID[i] > 0.02 * top && est[i] < 0.05 * TRUTH_ON_GRID[i]
    if (hole && start === null) start = x
    if (!hole && start !== null) {
      out.push([start, GRID[i - 1]])
      start = null
    }
  })
  if (start !== null) out.push([start, GRID[GRID.length - 1]])
  return out
}

/** Pendenza della retta dei minimi quadrati di log h* contro log N. */
export function slope(points: readonly (readonly [number, number])[]): number {
  const xs = points.map((p) => Math.log10(p[0]))
  const ys = points.map((p) => Math.log10(p[1]))
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length
  const my = ys.reduce((a, b) => a + b, 0) / ys.length
  let num = 0
  let den = 0
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i] - my)
    den += (x - mx) ** 2
  })
  return den === 0 ? Number.NaN : num / den
}

/** Il cursore di "Trova h*": percorre la curva da sinistra (h = 0.01) e si ferma sul minimo. */
export function searchAt(p: number, curve: IseCurve): number {
  const t = Math.min(1, Math.max(0, p))
  const lo = Math.log(H_STEPS[0])
  const target = Math.log(curve.hStar)
  return Math.exp(lo + (target - lo) * t)
}

// --- racconto ---

export const STEP = { quadro: 0, allarga: 1, trova: 2, n200: 3, n2000: 4, loglog: 5, chiusura: 6 } as const

export const STEPS = [
  { id: 'quadro', label: 'Venti ore, finestra stretta: buchi', durationMs: 1500 },
  { id: 'allarga', label: 'Allarga h: i buchi si chiudono', durationMs: 2000 },
  { id: 'trova', label: 'Trova h*', durationMs: 2000 },
  { id: 'n200', label: 'N = 200: h* si sposta a sinistra', durationMs: 1600 },
  { id: 'n2000', label: 'N = 2000: ancora più a sinistra', durationMs: 1600 },
  { id: 'loglog', label: 'h* contro N: una retta', durationMs: 1600 },
  { id: 'chiusura', label: 'Più campioni, h più piccolo', durationMs: 1500 },
] as const

export interface CaptionCtx {
  N: number
  h: string
  hStar: string
  holes: number
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.quadro:
      return String.raw`Il consumo elettrico orario di una casa (dati sintetici): notte attorno a 0.35 kWh, giorno attorno a 1.4 kWh. Con $N = ${c.N}$ ore e $h = ${c.h}$ kWh la stima è una fila di picchi: nelle zone ocra ${c.holes > 0 ? `(${c.holes})` : ''} $\hat p$ è sotto il 5% della densità vera, eppure lì i consumi ci sono. Sono i **buchi** (*gaps in the density representation*).`
    case STEP.allarga:
      return String.raw`Allargando $h$ i buchi si chiudono e l'errore quadratico integrato scende fino a un minimo; allargando ancora i picchi si abbassano, l'errore risale e oltre $h \approx 0.5$ kWh i due modi si fondono in una collina sola. Sotto, la curva dell'errore in funzione di $h$.`
    case STEP.trova:
      return String.raw`"Trova $h^*$": il cursore percorre la curva dell'errore e si ferma sul minimo, $h^* = ${c.hStar}$ kWh con $N = ${c.N}$. La stima in alto segue il cursore.`
    case STEP.n200:
      return String.raw`Con $N = 200$ la curva dell'errore si abbassa e il minimo si sposta a sinistra: con più dati ci si può permettere una finestra più stretta, e i due modi si vedono più nitidi.`
    case STEP.n2000:
      return String.raw`Con $N = 2000$ il minimo si sposta ancora a sinistra. L'$h$ giusto non è una proprietà dei dati ma della coppia (dati, $N$).`
    case STEP.loglog:
      return String.raw`Ogni $N$ lascia un punto $(N, h^*)$ nel grafico log-log: i punti si allineano su una retta decrescente di pendenza circa $-1/5$. Questo è un risultato di letteratura per il kernel gaussiano, **non presente nella fonte**: la fonte dice solo che $h$ può diminuire.`
    default:
      return String.raw`Note p39: «*as the number of training samples N increases, h can be decreased*»: con più campioni finestre più strette danno stime accurate senza overfitting. Con pochi campioni, invece, $h$ va **aumentato** per lisciare la stima ed evitare buchi (*gaps*) nella rappresentazione della densità.`
  }
}

export const TEX_EST = String.raw`\hat{p}(x)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h}\gamma\left(\frac{x-x_k}{h}\right)`
export const TEX_LIVE = String.raw`N=\val[0]{N},\quad h=\val[3]{h}:\quad \int\big(\hat p(x)-p(x)\big)^2dx=\val[4]{ise},\qquad h^*=\val[3]{hs},\quad \mathrm{ISE}(h^*)=\val[4]{iseS}`

export const CHALLENGE_PROMPT = String.raw`Per $N = 50$, $500$ e $5000$ trova **a mano** l'$h$ che minimizza l'errore (con la densità vera accesa e la curva dell'errore sotto) e annotalo con il pulsante. Poi scrivi di quanto si riduce $h^*$ quando $N$ cresce di 10 volte. Ogni $h$ annotato deve avere un errore al più del 15% sopra il minimo.`
export const CHALLENGE_HINT = String.raw`Muovi $h$ finché il punto sulla curva dell'errore sta nel fondo della valle. Per il fattore: se $h^* \propto N^{-1/5}$, moltiplicare $N$ per 10 moltiplica $h^*$ per $10^{-1/5}$.`

export const TARGET_NS: readonly number[] = [50, 500, 5000]
export const FACTOR = 10 ** (-1 / 5)

export interface ChallengeVerdict {
  rows: { n: number; h: number | null; ratio: number | null; ok: boolean }[]
  factorOk: boolean
  ok: boolean
}

/** Verifica le h annotate (una per N) sui dati del seme dato e il fattore scritto (0.63 ± 0.15). */
export function judge(seed: number, notes: Readonly<Record<number, number>>, factor: number): ChallengeVerdict {
  const rows = TARGET_NS.map((n) => {
    const h = notes[n]
    if (h === undefined) return { n, h: null, ratio: null, ok: false }
    const s = drawSamples(seed, n)
    const c = iseCurve(s)
    const ratio = iseOf(estimateOnGrid(s, h)) / c.iseStar
    return { n, h, ratio, ok: ratio <= 1.15 }
  })
  const factorOk = Math.abs(factor - FACTOR) <= 0.15
  return { rows, factorOk, ok: rows.every((r) => r.ok) && factorOk }
}
