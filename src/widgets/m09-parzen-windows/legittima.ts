// Logica del widget m09-densita-legittima (concetti c19 la stima deve essere una densità legittima, c20 il kernel
// deve essere esso stesso una densità, c21 con V = hⁿ la stima eredita non negatività e area 1). Frequenza cardiaca
// a riposo di 15 pazienti: la stima di Parzen serve a calcolare probabilità come P(60 ≤ bpm ≤ 80) integrando la
// curva. Tre guasti mostrano che cosa si rompe: dimenticare 1/V, un kernel con parti negative, un kernel di area 1/2.
import { kernelValue } from '../../lib/ml/nonparam'
import { linspace, trapz } from '../../lib/ml/stats'
import type { Gamma } from './parzen-lab'
import { kde } from './parzen-lab'

export const DOMAIN: readonly [number, number] = [30, 120]
/** Le 15 frequenze cardiache a riposo (bpm), fra 52 e 96. */
export const SAMPLES: readonly number[] = [52, 58, 61, 63, 66, 68, 70, 71, 73, 75, 78, 81, 85, 90, 96]
export const H0 = 5
export const H_RANGE: readonly [number, number] = [1, 20]
export const H_STEP = 0.5
export const AB0: readonly [number, number] = [60, 80]

export interface Faults {
  /** guasto 1: γ((x − x_k)/h) senza dividere per V = h */
  noVolume: boolean
  /** guasto 2: kernel con parti negative, sin(πu)/(πu) */
  negative: boolean
  /** guasto 3: kernel di area 1/2, rettangolo alto 1/2 su [−1/2, 1/2] */
  halfArea: boolean
}

export const NO_FAULTS: Faults = { noVolume: false, negative: false, halfArea: false }

/** sin(πu)/(πu): area 1 ma lobi negativi. Non è una densità. */
export const sincPlain: Gamma = (u) => (u === 0 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u))

/**
 * Il kernel con i guasti accesi. Senza guasti è il gaussiano. Il guasto 2 lo sostituisce con il sinc non al quadrato;
 * il guasto 3 dimezza l'area (da solo è il rettangolo alto 1/2 dell'etichetta della slide p58).
 */
export function kernelFor(f: Faults): Gamma {
  const scale = f.halfArea ? 0.5 : 1
  if (f.negative) return (u) => scale * sincPlain(u)
  if (f.halfArea) return (u) => 0.5 * kernelValue(u, 'rettangolare')
  return (u) => kernelValue(u, 'gaussiano')
}

/** ∫γ(u)du del kernel con i guasti: 1, oppure 1/2 con il guasto 3 (per costruzione, der09). */
export const kernelArea = (f: Faults): number => (f.halfArea ? 0.5 : 1)

/** Il fattore che moltiplica l'area: 1 con V = h, h se si dimentica 1/V (la formula viva lo mostra). */
export const volumeFactor = (f: Faults, h: number): number => (f.noVolume ? h : 1)

/** La stima con i guasti: (1/N) Σ (1/V) γ((x − x_k)/h), con V = h oppure V = 1 (guasto 1). */
export const estimate = (xs: readonly number[], h: number, f: Faults, samples: readonly number[] = SAMPLES): number[] =>
  kde(xs, samples, h, kernelFor(f), { volume: f.noVolume ? 1 : h, support: f.negative ? undefined : 6 })

/**
 * L'area totale sotto la stima, integrata davvero (trapezi su una griglia larga e fitta: il sinc ha code lunghe e
 * oscilla con periodo 2h). È il numero del misuratore.
 */
export function totalArea(h: number, f: Faults, samples: readonly number[] = SAMPLES): number {
  const reach = f.negative ? 400 * h : 8 * h
  const lo = Math.min(...samples) - reach
  const hi = Math.max(...samples) + reach
  const step = Math.min(0.25, h / 10)
  const xs = linspace(lo, hi, Math.ceil((hi - lo) / step) + 1)
  // il rettangolo salta in x_k ± h/2: i due lati di ogni salto entrano nella griglia, così i trapezi sono esatti
  if (f.halfArea && !f.negative) {
    const eps = h * 1e-9
    for (const s of samples) xs.push(s - h / 2 - eps, s - h / 2, s + h / 2, s + h / 2 + eps)
    xs.sort((a, b) => a - b)
  }
  return trapz(xs, estimate(xs, h, f, samples))
}

/** L'area teorica (der02): (1/N) · N · ∫γ · (h/V). */
export const theoreticalArea = (h: number, f: Faults): number => kernelArea(f) * volumeFactor(f, h)

export const GRID = linspace(DOMAIN[0], DOMAIN[1], 721)

/** P(a ≤ x ≤ b) = ∫_a^b p̂(x) dx. */
export function probability(a: number, b: number, h: number, f: Faults): number {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  if (hi - lo < 1e-9) return 0
  const xs = linspace(lo, hi, Math.max(41, Math.ceil((hi - lo) / Math.min(0.1, h / 10))))
  return trapz(xs, estimate(xs, h, f))
}

/** Tratti del dominio in cui la stima scende sotto zero (per colorarli). */
export function negativeRuns(xs: readonly number[], ys: readonly number[]): [number, number][] {
  const out: [number, number][] = []
  let start: number | null = null
  ys.forEach((y, i) => {
    if (y < -1e-9 && start === null) start = xs[i]
    if (y >= -1e-9 && start !== null) {
      out.push([start, xs[i - 1]])
      start = null
    }
  })
  if (start !== null) out.push([start, xs[xs.length - 1]])
  return out
}

export interface Lamps {
  gammaNonNeg: boolean
  gammaArea: boolean
  pNonNeg: boolean
  pArea: boolean
}

/** Le quattro spie: γ ≥ 0, ∫γ = 1, p̂ ≥ 0, ∫p̂ = 1. */
export function lampsFor(f: Faults, minP: number, area: number): Lamps {
  return { gammaNonNeg: !f.negative, gammaArea: kernelArea(f) === 1, pNonNeg: minP >= -1e-9, pArea: Math.abs(area - 1) < 5e-3 }
}

/** Il cambio di variabile u = (x − x_k)/h, a metà: la campana ha larghezza h_t = h^(1−t) e altezza 1/h_t (area 1). */
export const changeWidth = (h: number, t: number): number => h ** (1 - Math.min(1, Math.max(0, t)))

// --- racconto ---

export const STEP = { quadro: 0, misura: 1, cambio: 2, guasto1: 3, guasto2: 4, guasto3: 5, ripara: 6 } as const

export const STEPS = [
  { id: 'quadro', label: 'Una stima per calcolare probabilità', durationMs: 1500 },
  { id: 'misura', label: 'Il misuratore integra la stima', durationMs: 1500 },
  { id: 'cambio', label: 'Il cambio di variabile', durationMs: 2000 },
  { id: 'guasto1', label: 'Guasto 1: dimentico 1/V', durationMs: 1500 },
  { id: 'guasto2', label: 'Guasto 2: un kernel con parti negative', durationMs: 1500 },
  { id: 'guasto3', label: 'Guasto 3: un kernel di area 1/2', durationMs: 1500 },
  { id: 'ripara', label: 'Ripara tutto: le spie si riaccendono', durationMs: 1200 },
] as const

/** I guasti imposti da un passo del racconto; null = quelli dell'utente. */
export function faultsOfStep(index: number): Faults | null {
  switch (index) {
    case STEP.guasto1:
      return { noVolume: true, negative: false, halfArea: false }
    case STEP.guasto2:
      return { noVolume: false, negative: true, halfArea: false }
    case STEP.guasto3:
      return { noVolume: false, negative: false, halfArea: true }
    case STEP.ripara:
      return NO_FAULTS
    default:
      return null
  }
}

/** Nel passo "ripara" le spie si accendono in sequenza, 200 ms l'una: prima le due del kernel, poi quelle di p̂. */
export const lampsOn = (p: number, durationMs = 1200): number => Math.min(4, Math.floor((p * durationMs) / 200) + (p >= 1 ? 4 : 0))

export interface CaptionCtx {
  h: string
  area: string
  P: string
  N: number
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.quadro:
      return String.raw`La frequenza cardiaca a riposo di $N = ${c.N}$ pazienti, stimata con Parzen (kernel gaussiano, $h = ${c.h}$ bpm). Integrando la curva si calcolano probabilità: qui $P(a \le x \le b) = ${c.P}$, per esempio per tarare un allarme di tachicardia. Ha senso solo se $\hat p$ è una **densità legittima** (*legitimate density function*): mai negativa e con area 1.`
    case STEP.misura:
      return String.raw`Il misuratore integra la stima da sinistra a destra: $\int \hat p(x)\,dx = ${c.area}$. Cambia $h$: la forma cambia moltissimo, l'area no.`
    case STEP.cambio:
      return String.raw`Perché l'area resta 1 per ogni $h$? Si isola una campana $\frac1h\gamma\big(\frac{x - x_k}{h}\big)$ e si pone $u = (x - x_k)/h$: l'asse si comprime di $h$ e l'altezza si dilata di $h$, perché $dx = h\,du$ (lo Jacobiano) cancella $1/h$. Resta $\int\gamma(u)\,du = 1$. Poi le $N$ aree unitarie si sommano e $1/N$ riporta il totale a 1.`
    case STEP.guasto1:
      return String.raw`Guasto 1: si usa $\gamma\big(\frac{x - x_k}{h}\big)$ senza dividere per $V = h$. Lo Jacobiano $h$ non è più cancellato e l'area diventa $h = ${c.area}$: il misuratore sfora e $P(a \le x \le b) = ${c.P}$ può superare 1. Il fattore $1/V = 1/h^n$ non è un dettaglio.`
    case STEP.guasto2:
      return String.raw`Guasto 2: il kernel $\sin(\pi u)/(\pi u)$ (il sinc **non** al quadrato) ha area 1 ma lobi negativi. L'area della stima resta 1, eppure in alcune zone $\hat p(x) < 0$ (in blu): una "probabilità" negativa. La non negatività è violata.`
    case STEP.guasto3:
      return String.raw`Guasto 3: un rettangolo alto $1/2$ su $[-\frac12, \frac12]$, come l'etichetta del disegno della slide p58: è non negativo ma ha area $1/2$, e la stima integra a ${c.area}. La vera $\Pi$ è alta 1.`
    default:
      return String.raw`Si ripara tutto: le due condizioni sul kernel ($\gamma \ge 0$, $\int\gamma = 1$) si riaccendono, e di conseguenza anche le due sulla stima: «*it follows at once*». Se il kernel è una densità e si tiene $V = h^n$, la stima è una densità.`
  }
}

export const TEX_KERNEL = String.raw`\gamma(\mathbf{x})\ge 0\quad \forall\,\mathbf{x}\in\Re^n,\qquad \int_{\Re^n}\gamma(\mathbf{x})\,d\mathbf{x}=1`
export const TEX_ESTIMATE = String.raw`\hat{p}(x)\ge 0\quad \forall x,\qquad \int_{-\infty}^{+\infty}\hat{p}(x)\,dx=1`
export const TEX_DERIVATION = String.raw`\int\hat{p}(x)\,dx=\frac{1}{N}\sum_{k=1}^{N}\int\frac{1}{h}\gamma\left(\frac{x-x_k}{h}\right)dx=\frac{1}{N}\sum_{k=1}^{N}\int\gamma(u)\,du=1`
export const TEX_JACOBIAN = String.raw`\mathbf{u}=\frac{\mathbf{x}-\mathbf{x}_k}{h}\ \Rightarrow\ d\mathbf{x}=h^n\,d\mathbf{u},\qquad \int_{\Re^n}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)d\mathbf{x}=\int_{\Re^n}\gamma(\mathbf{u})\,d\mathbf{u}=1`
export const TEX_LIVE = String.raw`\int\hat{p}(x)\,dx=\frac{1}{\val[0]{N}}\cdot\val[0]{N}\cdot\val{c}=\val[3]{area},\qquad P(\val[0]{a}\le x\le\val[0]{b})=\int_{\val[0]{a}}^{\val[0]{b}}\hat p(x)\,dx=\val[3]{P}`

export const CHALLENGE_PROMPT = String.raw`Prevedi prima di guardare il misuratore. **(1)** Con il guasto "dimentico 1/V" acceso e $h = 8$ bpm, quanto vale l'area totale sotto la stima? **(2)** E con il guasto 3 (kernel di area 1/2) acceso insieme al guasto 1, sempre con $h = 8$?`
export const CHALLENGE_HINT = String.raw`Rifai la derivazione con il cambio di variabile: senza $1/V$ ogni campana ha area $h\int\gamma(u)\,du$, e la media di $N$ campane uguali ha la stessa area. Con $n = 1$, $V = h$.`

export interface ChallengeVerdict {
  first: boolean
  second: boolean
  ok: boolean
}

/** Risposte: 8 (cioè hⁿ con n = 1) e 4 (1/2 · 8). */
export function judge(a1: number, a2: number): ChallengeVerdict {
  const t1 = theoreticalArea(8, { noVolume: true, negative: false, halfArea: false })
  const t2 = theoreticalArea(8, { noVolume: true, negative: false, halfArea: true })
  const first = Math.abs(a1 - t1) <= 0.05
  const second = Math.abs(a2 - t2) <= 0.05
  return { first, second, ok: first && second }
}
