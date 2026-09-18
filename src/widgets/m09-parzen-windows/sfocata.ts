// Logica del widget m09-media-sfocata (concetti c41 media della stima come convoluzione, c42 la media è la pdf vera
// "sfocata", c44 la stima di Parzen è distorta a h finito). Intervalli RR di un ECG con extrasistoli: battiti normali
// attorno a 850 ms, prematuri attorno a 560 ms. Ripetendo l'esame molte volte e facendo la media delle stime non si
// ottiene la densità vera ma la sua convoluzione con il kernel: E{p̂(x)} = ∫ (1/h) γ((x − v)/h) p(v) dv (der04).
import { kernelValue, parzen1d } from '../../lib/ml/nonparam'
import type { Kernel } from '../../lib/ml/nonparam'
import { linspace, mixturePdf } from '../../lib/ml/stats'
import type { MixtureComponent } from '../../lib/ml/stats'
import { createRng } from '../../lib/rng'
import { binnedGaussKde, blurMixture, convolveAt, gammaOf, maximaAt, mixtureSamples, niceSteps } from './parzen-lab'

export type RRKernel = 'gaussiano' | 'rettangolare' | 'triangolare'
export const RR_KERNELS: readonly RRKernel[] = ['gaussiano', 'rettangolare', 'triangolare']

export const DOMAIN: readonly [number, number] = [400, 1000]
export const BIMODAL: readonly MixtureComponent[] = [
  { weight: 0.8, mu: 850, sigma: 40 },
  { weight: 0.2, mu: 560, sigma: 30 },
]
/** Il preset "gaussiana su gaussiana": un solo modo, σ = 40 ms. */
export const SINGLE: readonly MixtureComponent[] = [{ weight: 1, mu: 850, sigma: 40 }]
export const H0 = 40
export const H_RANGE: readonly [number, number] = [5, 200]
export const N_STEPS: readonly number[] = niceSteps(10, 500)
export const N0 = 30
export const EXAMS = 200
export const GRID = linspace(DOMAIN[0], DOMAIN[1], 301)

export const truthOf = (preset: boolean) => (x: number) => mixturePdf(x, [...(preset ? SINGLE : BIMODAL)])

/** I battiti dell'esame numero `exam` (a seed): i primi N non cambiano quando N cresce. */
export const examSamples = (exam: number, n: number, preset: boolean): number[] => mixtureSamples(1000 + exam * 31 + (preset ? 7 : 0), n, preset ? SINGLE : BIMODAL, [0, 2000], 1)

/** La stima di un esame sulla griglia (a bin per il gaussiano con N grande: stessi numeri, molto più veloce). */
export function examEstimate(samples: readonly number[], h: number, k: RRKernel): number[] {
  if (k === 'gaussiano' && samples.length > 60) return binnedGaussKde(GRID, samples, h)
  return GRID.map((x) => parzen1d(x, samples, h, k))
}

/** Le stime dei primi `count` esami e la loro media punto per punto. */
export function simulate(n: number, h: number, k: RRKernel, preset: boolean, count = EXAMS): { curves: number[][]; mean: number[] } {
  const curves: number[][] = []
  for (let e = 0; e < count; e++) curves.push(examEstimate(examSamples(e, n, preset), h, k))
  const mean = GRID.map((_, i) => curves.reduce((s, c) => s + c[i], 0) / Math.max(1, curves.length))
  return { curves, mean }
}

/** E{p̂(x)} sulla griglia: forma chiusa per gaussiano su misture gaussiane (varianze che si sommano), altrimenti numerica (der04). */
export function blurred(h: number, k: RRKernel, preset: boolean, xs: readonly number[] = GRID): number[] {
  const comps = [...(preset ? SINGLE : BIMODAL)]
  if (k === 'gaussiano') {
    const b = blurMixture(comps, h)
    return xs.map((x) => mixturePdf(x, b))
  }
  // cambio di variabile u = (x − v)/h: il passo segue il kernel, non h (i salti del rettangolo restano esatti)
  const p = truthOf(preset)
  const g = gammaOf(k as Kernel)
  const support = k === 'rettangolare' ? 0.5 : 1
  return xs.map((x) => convolveAt(x, p, h, g, support))
}

/** Il bias nel punto: E{p̂(x)} − p(x). */
export const biasOn = (conv: readonly number[], truth: readonly number[]): number[] => conv.map((v, i) => v - truth[i])

/** Quanto è abbassato il picco principale: 1 − max E{p̂}/max p (0.29 con h = σ nel preset). */
export const peakDrop = (conv: readonly number[], truth: readonly number[]): number => 1 - Math.max(...conv) / Math.max(...truth)

/** Fattore di abbassamento del picco in forma chiusa (preset): σ/√(σ² + h²). */
export const closedFormFactor = (h: number, sigma = 40): number => sigma / Math.sqrt(sigma * sigma + h * h)

/** Massimi locali della curva della media (quanti modi si distinguono ancora). */
export const modes = (conv: readonly number[]): number => maximaAt(GRID, conv).length

/** Il più grande h dello slider (a passi di 1 ms) per cui la media della stima ha ancora due modi. */
export function largestTwoModeH(k: RRKernel = 'gaussiano'): number {
  let last = H_RANGE[0]
  for (let h = H_RANGE[0]; h <= H_RANGE[1]; h++) {
    if (modes(blurred(h, k, false)) >= 2) last = h
    else break
  }
  return last
}

/** Per "Mostra la convoluzione": il kernel centrato in x come funzione di v, e il prodotto con p(v). */
export function slidingProduct(x: number, h: number, k: RRKernel, preset: boolean, vs: readonly number[] = GRID): { kernel: number[]; product: number[] } {
  const p = truthOf(preset)
  const kernel = vs.map((v) => kernelValue((x - v) / h, k as Kernel) / h)
  return { kernel, product: kernel.map((g, i) => g * p(vs[i])) }
}

/** Per l'animazione del preset: valori veri più un rumore di scala h (gaussiano), a seed. */
export function noisySamples(count: number, h: number): number[] {
  const r = createRng(4242)
  return Array.from({ length: count }, () => r.normal(850, 40) + h * r.normal(0, 1))
}

// --- racconto ---

export const STEP = { quadro: 0, simula: 1, teoria: 2, scorre: 3, larghezza: 4, campioni: 5, preset: 6 } as const

export const STEPS = [
  { id: 'quadro', label: 'Un esame, una stima', durationMs: 1500 },
  { id: 'simula', label: '200 esami: il fascio e la sua media', durationMs: 5000 },
  { id: 'teoria', label: 'La media è la vera, sfocata', durationMs: 1600 },
  { id: 'scorre', label: 'Mostra la convoluzione', durationMs: 6000 },
  { id: 'larghezza', label: 'h decide quanto sfocare', durationMs: 1600 },
  { id: 'campioni', label: 'Più dati non tolgono la sfocatura', durationMs: 1600 },
  { id: 'preset', label: 'Gaussiana su gaussiana: la forma chiusa', durationMs: 3000 },
] as const

export interface CaptionCtx {
  N: number
  h: string
  drop: string
  modes: number
  exams: number
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.quadro:
      return String.raw`Gli intervalli RR di un ECG (millisecondi fra due battiti): battiti normali attorno a 850 ms, prematuri (extrasistoli) attorno a 560 ms. Tratteggiata la densità vera $p(x)$ (dati sintetici), in grigio la stima di Parzen di **un** esame con $N = ${c.N}$ intervalli e $h = ${c.h}$ ms.`
    case STEP.simula:
      return String.raw`Si ripete l'esame: ogni stima si aggiunge al fascio grigio e la loro media (in rosso) si stabilizza. Esami: ${c.exams}. I campioni $\mathbf{x}_i$ sono i.i.d. secondo la densità incognita $p(\mathbf{x})$.`
    case STEP.teoria:
      return String.raw`La media si sovrappone alla curva ocra $p(x) * \frac1h\gamma(x/h)$, **non** alla densità vera: «*The estimate mean is a blurred version of the true p(x)!*». La differenza (tratteggio) è il **bias**: il picco principale è abbassato del ${c.drop} e la valle è riempita.`
    case STEP.scorre:
      return String.raw`La convoluzione, punto per punto: il kernel $\frac1h\gamma\big(\frac{x - v}{h}\big)$ scorre lungo l'asse; in ogni posizione $x$ si moltiplica per $p(v)$ e l'area del prodotto (velatura) è il valore della curva ocra in $x$. È una media pesata dei valori di $p$ attorno a $x$.`
    case STEP.larghezza:
      return String.raw`Con $h$ grande la curva ocra è molto più piatta della vera e i due modi tendono a fondersi (massimi locali: ${c.modes}); con $h$ piccolo quasi coincidono, ma il fascio grigio diventa larghissimo. Il kernel agisce come un filtro di sfocatura (*blurring filter*).`
    case STEP.campioni:
      return String.raw`Aumentando $N$ il fascio si stringe, ma la media resta sulla curva ocra: a $h$ fisso il bias **non dipende da $N$**. Più dati producono una stima sempre più stabile... della cosa sbagliata. La stima di Parzen è distorta (*biased*) per ogni $h$ finito.`
    default:
      return String.raw`Verifica in forma chiusa: densità vera $\mathcal N(850, 40^2)$ e kernel gaussiano. La media della stima è esattamente $\mathcal N(850, 40^2 + h^2)$: il picco si abbassa del fattore $\sigma/\sqrt{\sigma^2 + h^2}$ ($-29\%$ con $h = \sigma$, $-10.6\%$ con $h = \sigma/2$, $-0.5\%$ con $h = \sigma/10$). È come sommare a ogni intervallo vero un rumore di scala $h$: l'istogramma dei valori "sporcati" riempie la curva ocra.`
  }
}

export const TEX_CONV = String.raw`E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})*\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)`
export const TEX_INT = String.raw`E\{\hat{p}(x)\}=\int\frac{1}{h}\gamma\left(\frac{x-v}{h}\right)p(v)\,dv`
export const TEX_GAUSS = String.raw`\mathcal{N}(x;\mu,\sigma^2)*\mathcal{N}(x;0,h^2)=\mathcal{N}(x;\mu,\sigma^2+h^2)`
export const TEX_BIASED = String.raw`E\{\hat{p}(\mathbf{x})\}\neq p(\mathbf{x})\quad (h>0\ \text{finito})`
export const TEX_LIVE = String.raw`E\{\hat p(\val[0]{x})\}=\int\frac{1}{\val[0]{h}}\gamma\left(\frac{\val[0]{x}-v}{\val[0]{h}}\right)p(v)\,dv=\val[5]{e},\qquad p(\val[0]{x})=\val[5]{p}`
export const TEX_PRESET = String.raw`\text{picco}=0.00997\cdot\frac{40}{\sqrt{40^2+\val[0]{h}^2}}=\val[5]{pk}\quad(\text{fattore }\val[3]{f})`

export type Why = '' | 'media' | 'varianza' | 'dati'

export const CHALLENGE_PROMPT = String.raw`Con il kernel gaussiano trova il **più grande** $h$ per cui nella media della stima (la curva ocra) si distinguono ancora i due modi dei battiti: usa il contatore dei massimi locali e lascia lo slider su quel valore. Poi scegli perché aumentare $N$ non lo cambia.`
export const CHALLENGE_HINT = String.raw`Sali con $h$ un millisecondo alla volta finché il contatore passa da 2 a 1, poi torna indietro di uno. La curva ocra è $p * \frac1h\gamma(x/h)$: nella formula $N$ non compare.`

export interface ChallengeVerdict {
  target: number
  hOk: boolean
  whyOk: boolean
  ok: boolean
}

export function judge(h: number, k: RRKernel, preset: boolean, why: Why): ChallengeVerdict {
  const target = largestTwoModeH('gaussiano')
  const hOk = k === 'gaussiano' && !preset && Math.abs(h - target) < 0.5
  const whyOk = why === 'media'
  return { target, hOk, whyOk, ok: hOk && whyOk }
}
