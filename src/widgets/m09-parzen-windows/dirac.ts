// Logica del widget m09-h-a-zero-dirac (concetti c43 effetto di h su bias e varianza, c45 non distorsione asintotica se
// h_N → 0, c46 il kernel riscalato tende alla delta di Dirac). Gli stessi intervalli RR del widget m09-media-sfocata:
// l'archivio cresce da 10 a 100 000 battiti e la finestra si stringe con la legge h_N = h_1/√N. La media della stima
// E{p̂(x)} = ∫ γ(u) p(x − h u) du (la convoluzione, con il cambio di variabile u = (x − v)/h) si avvicina a p(x).
import { kernelValue } from '../../lib/ml/nonparam'
import type { Kernel } from '../../lib/ml/nonparam'
import { linspace, mixturePdf } from '../../lib/ml/stats'
import { blurMixture, convolveAt } from './parzen-lab'

export type DKernel = 'gaussiano' | 'triangolare' | 'rettangolare'
export const D_KERNELS: readonly DKernel[] = ['gaussiano', 'triangolare', 'rettangolare']
export const LABEL: Readonly<Record<DKernel, string>> = { gaussiano: 'gaussiano', triangolare: 'triangolare', rettangolare: 'rettangolare' }

export const DOMAIN: readonly [number, number] = [400, 1000]
export const COMPONENTS = [
  { weight: 0.8, mu: 850, sigma: 40 },
  { weight: 0.2, mu: 560, sigma: 30 },
]
export const truth = (x: number): number => mixturePdf(x, COMPONENTS)
/** N da 10 a 100 000, un fattore √10 a passo: 10, 32, 100, 316, … */
export const N_STEPS: readonly number[] = Array.from({ length: 9 }, (_, i) => Math.round(10 ** (1 + i / 2)))
export const H1_DEFAULT = 60
export const H1_RANGE: readonly [number, number] = [20, 200]
export const H1_STEP = 5
/** Sotto questa larghezza (ms) il kernel si disegna come la freccia della delta di Dirac. */
export const DIRAC_BELOW = 1
export const GRID = linspace(DOMAIN[0], DOMAIN[1], 601)

export type Law = 'legge' | 'fisso'

/** h_N con la legge h_1/√N, oppure fisso al valore di N = 10 (h_1/√10). */
export const hOf = (n: number, h1: number, law: Law): number => (law === 'legge' ? h1 / Math.sqrt(n) : h1 / Math.sqrt(N_STEPS[0]))

const SUPPORT: Readonly<Record<DKernel, number>> = { gaussiano: 6, triangolare: 1, rettangolare: 0.5 }

/**
 * ∫ γ(u)^power p(x − h u) du (parzen-lab, convolveAt): power 1 è la media della stima E{p̂(x)}; con power 2 e divisa
 * per h è E{(1/h²) γ²((x − x_k)/h)}, che serve alla varianza. Il cambio di variabile rende il conto esatto per ogni h,
 * anche di un decimo di millisecondo.
 */
export const moment = (x: number, h: number, k: DKernel, power: 1 | 2 = 1, p: (v: number) => number = truth): number =>
  convolveAt(x, p, h, (u) => kernelValue(u, k as Kernel), SUPPORT[k], power)

/** E{p̂(x)} sulla griglia: in forma chiusa per il gaussiano (varianze che si sommano), altrimenti con `moment`. */
export function meanEstimate(h: number, k: DKernel, xs: readonly number[] = GRID): number[] {
  if (k === 'gaussiano') {
    const b = blurMixture(COMPONENTS, h)
    return xs.map((x) => mixturePdf(x, b))
  }
  return xs.map((x) => moment(x, h, k))
}

/** Deviazione standard della stima in ogni punto: Var{p̂(x)} = (E{K_h²} − E{K_h}²)/N. */
export function sdEstimate(n: number, h: number, k: DKernel, mean: readonly number[], xs: readonly number[] = GRID): number[] {
  return xs.map((x, i) => Math.sqrt(Math.max(0, moment(x, h, k, 2) / h - mean[i] ** 2) / n))
}

export const TRUE_ON_GRID = GRID.map(truth)
const TRUE_PEAK = Math.max(...TRUE_ON_GRID)

/** Bias massimo in percentuale del picco vero: max |E{p̂} − p| / max p. */
export const maxBias = (mean: readonly number[]): number => Math.max(...mean.map((v, i) => Math.abs(v - TRUE_ON_GRID[i]))) / TRUE_PEAK

/** Abbassamento del picco principale (attorno a 850 ms): 1 − max E{p̂}/max p. */
export const peakDrop = (mean: readonly number[]): number => 1 - Math.max(...mean) / TRUE_PEAK

/** Il bias massimo per ciascun N della scala, con la legge e h_1 dati (il grafico di destra). */
export const biasCurve = (h1: number, law: Law, k: DKernel): [number, number][] => N_STEPS.map((n) => [n, maxBias(meanEstimate(hOf(n, h1, law), k))])

/**
 * Quanti battiti servono perché, con h_1 = 60 e la legge h_1/√N, il picco principale della media della stima sia
 * abbassato al più dell'1%: si cerca h con la bisezione, poi N = (h_1/h)².
 */
export function nForOnePercent(h1 = H1_DEFAULT, k: DKernel = 'gaussiano'): { h: number; n: number } {
  let lo = 0.01
  let hi = h1
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (peakDrop(meanEstimate(mid, k)) <= 0.01) lo = mid
    else hi = mid
  }
  return { h: lo, n: (h1 / lo) ** 2 }
}

// --- racconto ---

export const STEP = { quadro: 0, dirac: 9, fisso: 10, banda: 11 } as const

export const STEPS = [
  { id: 'n10', label: 'N = 10: kernel largo, media sfocata', durationMs: 1500 },
  ...N_STEPS.slice(1).map((n) => ({ id: `n${n}`, label: `N = ${n.toLocaleString('it-IT')}`, durationMs: 700 })),
  { id: 'dirac', label: 'Il kernel diventa una delta', durationMs: 1600 },
  { id: 'fisso', label: 'Con h fisso il bias resta', durationMs: 1600 },
  { id: 'banda', label: 'Bias contro varianza', durationMs: 1600 },
]

/** N imposto da un passo del racconto (i primi nove passi percorrono la scala), altrimenti null. */
export const nOfStep = (index: number): number | null => (index >= 0 && index < N_STEPS.length ? N_STEPS[index] : index === STEP.dirac ? N_STEPS[N_STEPS.length - 1] : null)

export interface CaptionCtx {
  N: string
  hN: string
  bias: string
  h1: string
}

export function captionFor(index: number, c: CaptionCtx): string {
  if (index === 0)
    return String.raw`Tre pannelli: a sinistra il kernel riscalato $\frac{1}{h_N}\gamma(x/h_N)$, al centro la densità vera (tratteggiata) e la media della stima (ocra) con il bias, a destra il bias massimo in funzione di $N$. Con $N = 10$ e la legge $h_N = h_1/\sqrt N$, $h_1 = ${c.h1}$ ms: $h_N = ${c.hN}$ ms. Premi Play: l'archivio dell'ospedale cresce.`
  if (index > 0 && index < N_STEPS.length)
    return String.raw`$N = ${c.N}$: $h_N = ${c.hN}$ ms. Il kernel si stringe e si alza mantenendo area 1, la media della stima recupera i picchi e riapre la valle; il bias massimo scende a ${c.bias} del picco vero. La larghezza diventa una **successione** $h_N$ che dipende da $N$.`
  switch (index) {
    case STEP.dirac:
      return String.raw`Da $N = 10\,000$ in poi $h_N < 1$ ms: il kernel è la freccia della **delta di Dirac** e la media coincide con la vera. È l'implicazione della slide p60: se $h_N \to 0$, $\frac{1}{h_N^n}\gamma(\mathbf{x}/h_N) \to \delta(\mathbf{x})$ e quindi $\lim E\{\hat p(\mathbf{x})\} = p(\mathbf{x})$, perché $p * \delta = p$ (nei punti in cui $p$ è continua). La stima è **asintoticamente non distorta** (*asymptotically unbiased*).`
    case STEP.fisso:
      return String.raw`Con $h$ fisso il kernel non cambia al crescere di $N$: la media resta sfocata per qualunque $N$ e il grafico di destra è una retta orizzontale. «*Parzen estimate is thus biased*»: non è $N$ a togliere il bias, è $h$ che va a zero.`
    default:
      return String.raw`La banda è la media $\pm$ una deviazione standard della stima. Con un kernel stretto e $N$ piccolo è larghissima: kernel più stretti riducono il bias ma **aumentano la varianza**, soprattutto con pochi campioni (note p42). Con un kernel largo è sottile, ma lontana dalla vera (più bias).`
  }
}

export const TEX_LIMIT_H = String.raw`\lim_{N\to+\infty}h_N=0`
export const TEX_DIRAC = String.raw`\lim_{N\to+\infty}\left\{\frac{1}{h_N^n}\gamma\left(\frac{\mathbf{x}}{h_N}\right)\right\}=\delta(\mathbf{x})\ \Longrightarrow\ \lim_{N\to+\infty}E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})`
export const TEX_CONV_DIRAC = String.raw`p(\mathbf{x})*\delta(\mathbf{x})=p(\mathbf{x})`
export const TEX_LIVE = String.raw`h_N=\frac{h_1}{\sqrt{N}}=\frac{\val[0]{h1}}{\sqrt{\val[0]{N}}}=\val{hN}\ \text{ms},\qquad \frac{1}{h_N}\gamma(0)=\val[4]{pk},\qquad \text{bias massimo}=\val[1]{bias}\%`

export const CHALLENGE_PROMPT = String.raw`Con $h_1 = 60$ ms e la legge $h_N = h_1/\sqrt N$ (kernel gaussiano): quanti battiti servono perché il picco principale della media della stima sia abbassato **al più dell'1%**? Stima, scrivi $N$, poi verifica con il Play. Tolleranza: il 15%.`
export const CHALLENGE_HINT = String.raw`Nel preset gaussiana su gaussiana del widget precedente il picco si abbassa del fattore $\sigma/\sqrt{\sigma^2 + h^2}$ con $\sigma = 40$ ms: serve $h_N \approx 5.7$ ms. Poi $N = (h_1/h_N)^2$.`

export function judge(n: number): { target: number; h: number; ok: boolean } {
  const { h, n: target } = nForOnePercent()
  return { target, h, ok: Math.abs(n - target) / target <= 0.15 }
}
