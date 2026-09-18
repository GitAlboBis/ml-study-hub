// Logica del widget m09-delta-ampiezza-larghezza (concetti c25 la funzione δ(x) = (1/V(h)) γ(x/h), c27 h agisce su
// ampiezza e larghezza ad area costante, c31 la figura delle finestre normali 2-D per h = 1, 0.5, 0.2). Un pixel di
// training della vegetazione nel piano (rosso, vicino infrarosso) di un'immagine da drone, bande in z-score: la
// finestra attorno al pixel è larga e bassa oppure stretta e alta, ma sempre di volume 1.
import { linspace, trapz } from '../../lib/ml/stats'
import { easeInOut } from '../engines/density1d/density1d'
import { volume } from './wireframe'

export type Dim = 1 | 2

export const DOMAIN: readonly [number, number] = [-2, 2]
export const H0 = 1
export const H_RANGE: readonly [number, number] = [0.1, 2]
export const H_STEP = 0.01
export const PRESETS: readonly number[] = [1, 0.5, 0.2]
/** Le scale verticali dei tre grafici della slide p56. */
export const SLIDE_SCALE: Readonly<Record<number, number>> = { 1: 0.15, 0.5: 0.6, 0.2: 4 }
/** Sotto questa larghezza il reticolo non si vede più: si disegna la freccia della delta di Dirac. */
export const DIRAC_BELOW = 0.1

const TWO_PI = 2 * Math.PI

/** γ normale standard in n dimensioni, valutata in (x, y) (per n = 1 conta solo x). */
export const gammaStd = (x: number, y: number, n: Dim): number => (n === 2 ? Math.exp(-(x * x + y * y) / 2) / TWO_PI : Math.exp(-(x * x) / 2) / Math.sqrt(TWO_PI))

/** δ(x) = (1/hⁿ) γ(x/h): la finestra normale riscalata. */
export const deltaAt = (x: number, y: number, h: number, n: Dim): number => gammaStd(x / h, y / h, n) / h ** n

/** δ(0) = γ(0)/hⁿ: 1/(2πh²) in 2-D, 1/(√(2π) h) in 1-D. */
export const peak = (h: number, n: Dim): number => deltaAt(0, 0, h, n)

/** Quota della cima della figura: il picco con un po' d'aria, mai sotto 0.05. */
export const zTopFor = (p: number): number => Math.max(0.05, 1.12 * p)

/** Volume (n = 2) o area (n = 1) sotto δ, integrati numericamente su ±6h: resta 1 per ogni h. */
export function measure(h: number, n: Dim, widthScale = 1, ampScale = 1): number {
  const w = h * widthScale
  const f = (x: number, y: number) => (ampScale * gammaStd(x / w, y / w, n)) / h ** n
  if (n === 2) return volume(f, [-6 * w, 6 * w], [-6 * w, 6 * w])
  const xs = linspace(-6 * w, 6 * w, 1201)
  return trapz(xs, xs.map((x) => f(x, 0)))
}

/**
 * "Scomponi la formula": dalla campana standard γ(x) alla finestra δ(x) = (1/hⁿ) γ(x/h), un effetto alla volta.
 * Nella prima metà l'argomento x/h stira o comprime l'asse orizzontale (larghezza 1 → h, altezza ferma a γ(0));
 * nella seconda il fattore 1/hⁿ dilata o comprime l'asse verticale. Restituisce larghezza e fattore d'ampiezza
 * rispetto alla campana standard, e la funzione da disegnare.
 */
export function decomposition(s: number, h: number, n: Dim): { width: number; amp: number; f: (x: number, y: number) => number } {
  const p = Math.min(1, Math.max(0, s))
  const width = p < 0.5 ? 1 + (h - 1) * easeInOut(p * 2) : h
  const ampTarget = 1 / h ** n
  const amp = p < 0.5 ? 1 : 1 + (ampTarget - 1) * easeInOut(p * 2 - 1)
  return { width, amp, f: (x, y) => amp * gammaStd(x / width, y / width, n) }
}

/** h durante "h → 0": da 1 a 0.05 in scala logaritmica. */
export const hToZero = (p: number): number => Math.exp(Math.log(1) + (Math.log(0.05) - Math.log(1)) * easeInOut(Math.min(1, Math.max(0, p))))

/** h durante un passo che porta da `from` a `to` (in scala logaritmica). */
export const hBetween = (from: number, to: number, p: number): number => Math.exp(Math.log(from) + (Math.log(to) - Math.log(from)) * easeInOut(Math.min(1, Math.max(0, p))))

/** La tabellina dei picchi per h = 1, 0.5, 0.2 in 1-D e in 2-D. */
export const peakTable = (): { h: number; one: number; two: number }[] => PRESETS.map((h) => ({ h, one: peak(h, 1), two: peak(h, 2) }))

// --- racconto ---

export const STEP = { quadro: 0, stringi: 1, ago: 2, scomponi: 3, dirac: 4, dimensioni: 5, torna: 6 } as const

export const STEPS = [
  { id: 'quadro', label: 'La finestra attorno a un pixel', durationMs: 1500 },
  { id: 'stringi', label: 'h = 0.5: più stretta, più alta', durationMs: 1600 },
  { id: 'ago', label: 'h = 0.2: un ago', durationMs: 1600 },
  { id: 'scomponi', label: 'Scomponi la formula', durationMs: 1500 },
  { id: 'dirac', label: 'h → 0: la delta di Dirac', durationMs: 3000 },
  { id: 'dimensioni', label: 'In 1-D il picco cresce come 1/h', durationMs: 1600 },
  { id: 'torna', label: 'Di nuovo h a tua scelta', durationMs: 1000 },
] as const

export interface CaptionCtx {
  h: string
  peak: string
  n: Dim
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.quadro:
      return String.raw`Un pixel di training della vegetazione nel piano (riflettanza nel rosso, nel vicino infrarosso), bande in z-score. Per studiare l'effetto di $h$ (*the effect that the window width h has*) si definisce $\delta(\mathbf{x}) = \frac{1}{V(h)}\gamma(\mathbf{x}/h)$: qui la finestra normale 2-D, con $h = ${c.h}$ e picco $${c.peak}$. Il volume sotto la superficie è 1. Trascina la vista per ruotarla.`
    case STEP.stringi:
      return String.raw`Con $h = 0.5$ la campana si restringe e si alza: il picco $1/(2\pi h^2)$ passa da $0.159$ a $0.637$. $h$ agisce **insieme** su ampiezza (il fattore $1/h^n$) e larghezza (l'argomento $\mathbf{x}/h$), e il volume resta 1.`
    case STEP.ago:
      return String.raw`Con $h = 0.2$ è un ago alto $3.98$: le scale verticali delle tre figure della slide sono $0.15$, $0.6$ e $4$. Riducendo $h$ di 5 volte il picco cresce di $5^2 = 25$ volte ($n = 2$).`
    case STEP.scomponi:
      return String.raw`Si parte dalla campana standard $\gamma(\mathbf{x})$. Prima l'argomento $\mathbf{x}/h$ **stira o comprime l'asse orizzontale** (il volume diventa $h^n$), poi il fattore $1/h^n$ **dilata o comprime l'asse verticale** e lo riporta a 1: ecco perché $\delta$ ha sempre volume 1.`
    case STEP.dirac:
      return String.raw`$h$ scende da 1 a 0.05: l'ago si assottiglia e si alza senza limite, sempre con volume 1. Nel limite diventa la **delta di Dirac** (la freccia). Attenzione: è lo stesso simbolo $\delta$, ma qui ha il significato di limite (slide p60); a $h$ finito $\delta(\mathbf{x})$ è solo la finestra riscalata.`
    case STEP.dimensioni:
      return String.raw`In una dimensione $\delta(x) = \frac1h\gamma(x/h)$ e il picco cresce come $1/h$; in due come $1/h^2$. La tabellina confronta i picchi per $h = 1, 0.5, 0.2$: in 1-D $0.399, 0.798, 1.995$, in 2-D $0.159, 0.637, 3.98$.`
    default:
      return String.raw`$h$ non cambia quanta probabilità porta un campione (sempre $1/N$ nella stima): decide solo se concentrarla in un ago o spalmarla in una collina. Ora $n = ${c.n}$ e $h = ${c.h}$.`
  }
}

export const TEX_DELTA = String.raw`\delta(\mathbf{x})=\frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}}{h}\right)`
export const TEX_NORMAL2 = String.raw`\delta(\mathbf{x})=\frac{1}{2\pi h^2}\exp\left(-\frac{\|\mathbf{x}\|^2}{2h^2}\right)\quad (n=2)`
export const TEX_AMP = String.raw`\delta(\mathbf{0})=\frac{1}{h^n}\gamma(\mathbf{0}),\qquad \int_{\Re^n}\delta(\mathbf{x})\,d\mathbf{x}=1\quad \forall h>0`
export const TEX_SPLIT = String.raw`\delta(\mathbf{x})=\underbrace{\frac{1}{h^n}}_{\text{ampiezza}}\ \gamma\Big(\underbrace{\frac{\mathbf{x}}{h}}_{\text{larghezza}}\Big)`
export const texPeak = (n: Dim): string =>
  n === 2
    ? String.raw`\delta(\mathbf{0})=\frac{1}{2\pi h^2}=\frac{1}{2\pi\cdot\val{h}^2}=\val[3]{peak},\qquad \text{volume}=\val[3]{vol}`
    : String.raw`\delta(0)=\frac{1}{\sqrt{2\pi}\,h}=\frac{1}{\sqrt{2\pi}\cdot\val{h}}=\val[3]{peak},\qquad \text{area}=\val[3]{vol}`

export const CHALLENGE_PROMPT = String.raw`Senza muovere lo slider: di quanto cresce il picco di $\delta$ passando da $h = 1$ a $h = 0.2$ in **2-D**? E in **1-D**? Scrivi i due fattori, poi verifica con i preset.`
export const CHALLENGE_HINT = String.raw`Il picco è $\gamma(\mathbf{0})/h^n$: dividere $h$ per 5 moltiplica il picco per $5^n$.`

export function judge(two: number, one: number): { two: boolean; one: boolean; ok: boolean } {
  const t2 = peak(0.2, 2) / peak(1, 2)
  const t1 = peak(0.2, 1) / peak(1, 1)
  const a = Math.abs(two - t2) < 0.05
  const b = Math.abs(one - t1) < 0.05
  return { two: a, one: b, ok: a && b }
}
