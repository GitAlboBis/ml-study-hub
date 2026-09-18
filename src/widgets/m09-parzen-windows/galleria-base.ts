// Logica del widget m09-galleria-kernel-base (concetti c33 rettangolare, c34 triangolare, c35 gaussiano). Cifre
// scritte a mano 8×8: per la classe "0" una feature scalare, la frazione di pixel accesi, da 25 immagini (fra 0.30 e
// 0.55). La stessa nuvola stimata con i tre kernel di slide p58: la stima eredita il carattere del kernel, gradini
// dal rettangolo, spigoli dal triangolo, morbidezza dalla gaussiana.
import { kernelValue } from '../../lib/ml/nonparam'
import type { Kernel } from '../../lib/ml/nonparam'
import { linspace, trapz } from '../../lib/ml/stats'
import { gammaOf, kde, mixtureSamples } from './parzen-lab'
import type { Gamma } from './parzen-lab'

export type BaseKernel = 'rettangolare' | 'triangolare' | 'gaussiano'
export const BASE_KERNELS: readonly BaseKernel[] = ['rettangolare', 'triangolare', 'gaussiano']

export const DOMAIN: readonly [number, number] = [0.2, 0.65]
export const SAMPLES: readonly number[] = mixtureSamples(8, 25, [{ weight: 1, mu: 0.425, sigma: 0.06 }], [0.3, 0.55], 3)
export const H0 = 0.03
export const H_RANGE: readonly [number, number] = [0.005, 0.1]
export const H_STEP = 0.001
/** La lente ingrandisce 6 volte: mostra un sesto del dominio. */
export const ZOOM = 6
export const LENS_HALF = (DOMAIN[1] - DOMAIN[0]) / ZOOM / 2

/** Il kernel della scheda; con `half` il rettangolo è alto 1/2 (l'etichetta del disegno della slide): area 1/2. */
export const kernelFn = (k: BaseKernel, half = false): Gamma => (k === 'rettangolare' && half ? (u) => 0.5 * kernelValue(u, k) : gammaOf(k))

/** Griglia della stima con i punti dove il kernel cambia forma (salti del rettangolo, spigoli del triangolo). */
export function gridFor(samples: readonly number[], h: number, from = DOMAIN[0], to = DOMAIN[1], points = 601): number[] {
  // i due lati di ogni salto, un soffio dentro e un soffio fuori: sul bordo esatto l'arrotondamento di (x − x_k)/h
  // può cadere da una parte o dall'altra, e i trapezi perderebbero un pezzo di rettangolo
  const eps = h * 1e-7
  const xs = linspace(from, to, points)
  for (const s of samples) xs.push(s - h / 2 - eps, s - h / 2 + eps, s + h / 2 - eps, s + h / 2 + eps, s - h, s, s + h)
  const out: number[] = []
  for (const v of xs.filter((v) => v >= from && v <= to).sort((a, b) => a - b)) if (out.length === 0 || v - out[out.length - 1] > 1e-12) out.push(v)
  return out
}

export const estimate = (xs: readonly number[], h: number, k: BaseKernel, half = false, samples: readonly number[] = SAMPLES): number[] => kde(xs, samples, h, kernelFn(k, half))

/** Area sotto la stima (tutto il supporto: le campane escono appena dal dominio). */
export function estimateArea(h: number, k: BaseKernel, half = false): number {
  const xs = gridFor(SAMPLES, h, DOMAIN[0] - 0.5, DOMAIN[1] + 0.5, 4001)
  return trapz(xs, estimate(xs, h, k, half))
}

export interface Checklist {
  area: number
  maxAtOrigin: boolean
  continuous: boolean
  differentiable: boolean
  decays: boolean
}

/** Le quattro voci della scheda (più la derivabilità, che distingue il triangolo dalla gaussiana). */
export function checklist(k: BaseKernel, half = false): Checklist {
  const g = kernelFn(k, half)
  const us = linspace(-6, 6, 12001)
  // area con i salti esatti del rettangolo
  const edges = k === 'rettangolare' ? [-0.5 - 1e-9, -0.5, 0.5, 0.5 + 1e-9] : []
  const grid = [...us, ...edges].sort((a, b) => a - b)
  const area = trapz(grid, grid.map(g))
  const top = Math.max(...us.map(g))
  return { area, maxAtOrigin: g(0) >= top - 1e-12, continuous: k !== 'rettangolare', differentiable: k === 'gaussiano', decays: g(10) < 1e-9 }
}

/** Com'è la stima dentro la lente, in parole (dipende solo dal kernel). */
export const smoothness = (k: BaseKernel): string => (k === 'rettangolare' ? 'discontinua' : k === 'triangolare' ? 'continua ma non derivabile' : 'continua e derivabile')

/** Valori notevoli del grafico della slide p58: estremi del supporto e picco. */
export const NOTABLE: Readonly<Record<BaseKernel, { support: string; peak: string }>> = {
  rettangolare: { support: '−1/2 … 1/2', peak: '1' },
  triangolare: { support: '−1 … 1', peak: '1' },
  gaussiano: { support: 'tutto l’asse', peak: '1/√(2π) = 0.399' },
}

// --- la formula a tessere ---

export type Slot = 'num' | 'den' | 'fn' | 'top' | 'bottom'
export const SLOTS: readonly Slot[] = ['num', 'den', 'fn', 'top', 'bottom']
export const TILES: readonly { id: string; tex: string }[] = [
  { id: 'uno', tex: '1' },
  { id: 'radice', tex: String.raw`\sqrt{2\pi}` },
  { id: 'exp', tex: String.raw`\exp` },
  { id: 'meno', tex: '-x^2' },
  { id: 'due', tex: '2' },
]
/** γ(x) = [1] / [√(2π)] · [exp]( [−x²] / [2] ) */
export const ANSWER: Readonly<Record<Slot, string>> = { num: 'uno', den: 'radice', fn: 'exp', top: 'meno', bottom: 'due' }
export const formulaOk = (placed: Partial<Record<Slot, string>>): boolean => SLOTS.every((s) => placed[s] === ANSWER[s])

// --- sfida: tre tratti ingranditi anonimi ---

export interface Snippet {
  id: 'A' | 'B' | 'C'
  kernel: BaseKernel
}
export const SNIPPETS: readonly Snippet[] = [
  { id: 'A', kernel: 'triangolare' },
  { id: 'B', kernel: 'gaussiano' },
  { id: 'C', kernel: 'rettangolare' },
]
/** Il centro dei tratti ingranditi: la mediana dei campioni, dove la stima è più ricca di dettagli. */
export const SNIPPET_CENTER = [...SAMPLES].sort((a, b) => a - b)[12]

export function judge(answers: Record<Snippet['id'], BaseKernel | ''>, placed: Partial<Record<Slot, string>>): { per: { id: Snippet['id']; ok: boolean; kernel: BaseKernel }[]; formula: boolean; ok: boolean } {
  const per = SNIPPETS.map((s) => ({ id: s.id, ok: answers[s.id] === s.kernel, kernel: s.kernel }))
  const formula = formulaOk(placed)
  return { per, formula, ok: per.every((p) => p.ok) && formula }
}

// --- racconto ---

export type Tab = BaseKernel | 'comune'

export const STEP = { quadro: 0, rett: 1, tri: 2, gauss: 3, lente: 4, meta: 5, comune: 6 } as const

export const STEPS = [
  { id: 'quadro', label: 'Tre kernel, la stessa nuvola', durationMs: 1500 },
  { id: 'rett', label: 'Il rettangolo: area 1, ma salti', durationMs: 1600 },
  { id: 'tri', label: 'Il triangolo: continuo, con gli spigoli', durationMs: 1600 },
  { id: 'gauss', label: 'La gaussiana: liscia', durationMs: 1600 },
  { id: 'lente', label: 'La lente sulla stima', durationMs: 2400 },
  { id: 'meta', label: 'Un rettangolo alto 1/2?', durationMs: 1500 },
  { id: 'comune', label: 'Qual è il kernel più usato?', durationMs: 1500 },
] as const

/** La scheda (kernel) imposta dal passo del racconto; null = quella scelta dall'utente. */
export const tabOfStep = (index: number): Tab | null =>
  index === STEP.rett || index === STEP.meta ? 'rettangolare' : index === STEP.tri ? 'triangolare' : index === STEP.gauss ? 'gaussiano' : index === STEP.comune ? 'comune' : null

export interface CaptionCtx {
  h: string
  k: string
  lens: string
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.quadro:
      return String.raw`Per la classe "0" delle cifre 8×8 si misura la frazione di pixel accesi di 25 immagini. Sopra, la forma del kernel della scheda (qui ${c.k}) con i valori notevoli della slide p58; sotto, la stima della densità di classe con $h = ${c.h}$. Ogni scheda accende una lista di controllo: area 1, massimo nell'origine, continuità, decadimento.`
    case STEP.rett:
      return String.raw`$\gamma(x) = \Pi(x)$: 1 fra $-\frac12$ e $\frac12$, 0 altrove (*rectangular kernel*). Peso uguale a tutti i punti dentro la finestra, zero a quelli fuori: semplice ma rozzo (*crude*). È una densità, ma i due salti in $\pm\frac12$ la rendono **discontinua**, e la stima è a gradini.`
    case STEP.tri:
      return String.raw`$\gamma(x) = \Lambda(x)$: $1 - |x|$ fra $-1$ e $1$, picco 1, area $\frac12 \cdot 2 \cdot 1 = 1$ (*triangular kernel*). Il peso cala linearmente (*linear tapering*): la stima è **continua**, una spezzata, ma negli spigoli **non derivabile**.`
    case STEP.gauss:
      return String.raw`$\gamma(x) = \frac{1}{\sqrt{2\pi}}\exp(-x^2/2)$, picco $1/\sqrt{2\pi} = 0.399$ (*Gaussian kernel*): la stima è continua e derivabile, con un'influenza che decresce esponenzialmente con la distanza.`
    case STEP.lente:
      return String.raw`La lente ingrandisce 6 volte un tratto della stima: ${c.lens}. La stima eredita il carattere del kernel: salti dal rettangolo, spigoli dal triangolo, morbidezza dalla gaussiana. Trascina la lente.`
    case STEP.meta:
      return String.raw`Nel disegno della slide l'altezza del rettangolo è etichettata $\frac12$: con supporto $[-\frac12, \frac12]$ un rettangolo alto $\frac12$ avrebbe area $\frac12$, e la stima integrerebbe a $0.5$. La $\Pi$ standard ha altezza **1**: è l'unica che dà area 1.`
    default:
      return String.raw`«*Which is the most common window function (write the formula)?*»: il gaussiano. Ricomponi la sua formula con le tessere. In $n$ dimensioni diventa il kernel a simmetria sferica di slide p65.`
  }
}

export const TEX_RECT = String.raw`\gamma(x)=\Pi(x)=\begin{cases}1, & |x|\le \tfrac{1}{2}\\ 0, & \text{altrove}\end{cases}`
export const TEX_TRI = String.raw`\gamma(x)=\Lambda(x)=\begin{cases}1-|x|, & |x|\le 1\\ 0, & \text{altrove}\end{cases}`
export const TEX_GAUSS = String.raw`\gamma(x)=\frac{1}{\sqrt{2\pi}}\exp\left(-\frac{x^2}{2}\right)`
export const TEX_GAUSS_EST = String.raw`\hat{p}(x)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{\sqrt{2\pi}\,h}\exp\left(-\frac{(x-x_k)^2}{2h^2}\right)\quad (n=1)`
export const TEX_LIVE = String.raw`\hat p(\val[3]{x})=\frac{1}{\val[0]{N}\cdot\val[3]{h}}\sum_{k=1}^{\val[0]{N}}\gamma\!\left(\frac{\val[3]{x}-x_k}{\val[3]{h}}\right)=\val[3]{p},\qquad \int\hat p\,dx=\val[3]{area}`
export const KERNEL_TEX: Readonly<Record<BaseKernel, string>> = { rettangolare: TEX_RECT, triangolare: TEX_TRI, gaussiano: TEX_GAUSS }

export const CHALLENGE_PROMPT = String.raw`Tre tratti ingranditi di stime anonime (sotto): riconosci quale kernel ha prodotto ciascuno, tre su tre. Poi, nella scheda "Il più comune", scrivi a memoria la formula del kernel gaussiano componendo le tessere.`
export const CHALLENGE_HINT = String.raw`Gradini verticali: rettangolo. Spezzata con spigoli: triangolo. Curva liscia: gaussiana. Nella formula il fattore di normalizzazione è $1/\sqrt{2\pi}$ e nell'esponente c'è $-x^2/2$.`

export const kernelLabel = (k: Kernel): string => (k === 'rettangolare' ? 'rettangolare' : k === 'triangolare' ? 'triangolare' : 'gaussiano')
