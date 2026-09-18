// Logica del widget m09-due-viste-stessa-stima (concetti c08-c11): la stessa stima K/(N·h) letta in due modi.
// CONTEGGIO: una finestra di lato h centrata in x* guarda i campioni e ne conta K.
// CONTRIBUTI: su ogni campione è posato un rettangolo di base h e altezza 1/(N·h) (area 1/N); in x* la stima è la
// somma delle altezze dei rettangoli che lo coprono. Per la simmetria γ(u) = γ(−u) sono lo stesso numero.
import { kernelValue } from '../../lib/ml/nonparam'
import { trapz } from '../../lib/ml/stats'
import { easeInOut, evalGrid, weightedKernelSum } from '../engines/density1d/density1d'

export const DOMAIN: readonly [number, number] = [0, 10]
/** Gli 8 salmoni dell'inventario: luminosità 0-10. */
export const SAMPLES0: readonly number[] = [2.1, 2.9, 3.4, 3.9, 4.3, 5.0, 6.2, 7.5]
export const X0 = 4.0
export const X_STEP = 0.05
export const H0 = 1.5
export const H_RANGE: readonly [number, number] = [0.2, 4]
export const H_STEP = 0.1
export const N_RANGE: readonly [number, number] = [2, 15]
/** Stagger della "specchiatura": 60 ms fra un rettangolo e il successivo (su un passo di 1200 ms). */
export const MIRROR_MS = 1200
export const MIRROR_STAGGER = 60
export const TRACE_MS = 4000

/** γ(u) del rettangolo: 1 se |u| ≤ 1/2 (bordo incluso), 0 altrimenti. */
export const gammaRect = (u: number): number => kernelValue(u, 'rettangolare')

/** Gli indici dei campioni nella finestra di lato h centrata in x (quelli i cui rettangoli coprono x). */
export const covering = (x: number, samples: readonly number[], h: number): number[] =>
  samples.flatMap((xk, k) => (gammaRect((xk - x) / h) === 1 ? [k] : []))

/** K = Σ_k γ((x_k − x*)/h). */
export const countK = (x: number, samples: readonly number[], h: number): number => covering(x, samples, h).length

/** p̂(x*) = K/(N·h). */
export const estimateAt = (x: number, samples: readonly number[], h: number): number => (samples.length > 0 ? countK(x, samples, h) / (samples.length * h) : 0)

/** La curva a gradini sulla griglia con i salti esatti (ogni bordo x_k ± h/2 entra con i due lati del salto). */
export function staircase(samples: readonly number[], h: number, weight = 1 / Math.max(1, samples.length)): { xs: number[]; ys: number[] } {
  const xs = evalGrid(DOMAIN, samples, h, 'rettangolare', 401)
  return { xs, ys: weightedKernelSum(xs, samples, h, 'rettangolare', samples.map(() => weight)) }
}

/** Area sotto la curva a gradini (1 se nessun rettangolo esce dal dominio). */
export const staircaseArea = (samples: readonly number[], h: number): number => {
  const { xs, ys } = staircase(samples, h)
  return trapz(xs, ys)
}

export interface Plateau {
  from: number
  to: number
  K: number
}

/** I tratti costanti della curva a gradini: tra due bordi consecutivi K non cambia. Estremi chiusi (finestra chiusa). */
export function plateaus(samples: readonly number[], h: number): Plateau[] {
  const cuts = [...new Set([DOMAIN[0], DOMAIN[1], ...samples.flatMap((x) => [x - h / 2, x + h / 2]).filter((v) => v > DOMAIN[0] && v < DOMAIN[1])].map((v) => Number(v.toFixed(9))))].sort((a, b) => a - b)
  const out: Plateau[] = []
  for (let i = 0; i + 1 < cuts.length; i++) {
    const mid = (cuts[i] + cuts[i + 1]) / 2
    out.push({ from: cuts[i], to: cuts[i + 1], K: countK(mid, samples, h) })
  }
  return out
}

/** Gli intervalli di x* in cui la curva a gradini è massima, fusi se contigui. */
export function maxIntervals(samples: readonly number[], h: number): Plateau[] {
  const ps = plateaus(samples, h)
  const top = Math.max(...ps.map((p) => p.K))
  const out: Plateau[] = []
  for (const p of ps) {
    if (p.K !== top) continue
    const last = out[out.length - 1]
    if (last !== undefined && Math.abs(last.to - p.from) < 1e-9) last.to = p.to
    else out.push({ ...p })
  }
  return out
}

// --- racconto ---

/** Avanzamento del fantasma k (0-1) nella specchiatura: partenze sfalsate di 60 ms. */
export function ghostAt(p: number, k: number, n: number): number {
  const total = MIRROR_MS
  const flight = total - MIRROR_STAGGER * Math.max(0, n - 1)
  const t = (p * total - MIRROR_STAGGER * k) / flight
  return easeInOut(Math.min(1, Math.max(0, t)))
}

/** x* durante la "traccia": da un estremo all'altro del dominio, a velocità costante (la penna non accelera). */
export const sweepAt = (p: number): number => DOMAIN[0] + (DOMAIN[1] - DOMAIN[0]) * Math.min(1, Math.max(0, p))

/** Un campione aggiunto con un clic: dentro il dominio, arrotondato a 0.05. */
export const snap = (x: number): number => Number((Math.round(Math.min(DOMAIN[1], Math.max(DOMAIN[0], x)) / X_STEP) * X_STEP).toFixed(2))

export const nearestIndex = (samples: readonly number[], x: number): number =>
  samples.reduce((best, v, i) => (best < 0 || Math.abs(v - x) < Math.abs(samples[best] - x) ? i : best), -1)

// --- sfida ---

export interface ChallengeInput {
  samples: readonly number[]
  h: number
  x: number
  chosen: readonly number[]
  from: number
  to: number
  K: number
}

export interface ChallengeVerdict {
  /** la prima parte vale solo sui dati e sull'h dell'inventario */
  setupOk: boolean
  part1: { K: number; p: number; covering: number[]; ok: boolean }
  part2: { target: Plateau | null; ok: boolean }
  ok: boolean
}

const sameSet = (a: readonly number[], b: readonly number[]) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])

export function judge({ samples, h, x, chosen, from, to, K }: ChallengeInput): ChallengeVerdict {
  const setupOk = Math.abs(h - H0) < 1e-9 && samples.length === SAMPLES0.length && samples.every((v, i) => v === SAMPLES0[i])
  const cov = covering(x, samples, h)
  const part1Ok = setupOk && cov.length === 2 && sameSet(cov, chosen)
  const target = setupOk ? (maxIntervals(samples, h)[0] ?? null) : null
  const part2Ok = target !== null && Math.abs(from - target.from) <= 0.051 && Math.abs(to - target.to) <= 0.051 && K === target.K
  return { setupOk, part1: { K: cov.length, p: estimateAt(x, samples, h), covering: cov, ok: part1Ok }, part2: { target, ok: part2Ok }, ok: part1Ok && part2Ok }
}

// --- testi (String.raw: le barre rovesciate restano quelle del LaTeX) ---

export const STEP = { quadro: 0, conteggio: 1, contributi: 2, specchia: 3, traccia: 4, esplora: 5, adesso: 6 } as const

export const STEPS = [
  { id: 'quadro', label: 'Due viste, lo stesso numero', durationMs: 1500 },
  { id: 'conteggio', label: 'Vista conteggio: una finestra guarda i campioni', durationMs: 1500 },
  { id: 'contributi', label: 'Vista contributi: un rettangolo per campione', durationMs: 1500 },
  { id: 'specchia', label: 'Specchia: una finestra diventa N rettangoli', durationMs: MIRROR_MS },
  { id: 'traccia', label: 'Traccia: la penna disegna la stima', durationMs: TRACE_MS },
  { id: 'esplora', label: 'Cambia h, aggiungi o togli salmoni', durationMs: 1500 },
  { id: 'adesso', label: 'E adesso? Una finestra più generale', durationMs: 1500 },
] as const

export interface CaptionCtx {
  K: number
  N: number
  h: string
  p: string
  w: string
  x: string
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.quadro:
      return String.raw`La luminosità di $N = ${c.N}$ salmoni, due volte sullo stesso asse. In alto la finestra di lato $h = ${c.h}$ centrata in $x^* = ${c.x}$ conta $K = ${c.K}$ salmoni. In basso ogni salmone porta un rettangolo alto $1/(Nh) = ${c.w}$. In $x^*$ le due viste danno lo **stesso numero**: $\hat p(x^*) = ${c.p}$.`
    case STEP.conteggio:
      return String.raw`Prima lettura: un semplice conteggio (*simple count*, *counting mechanism*) dei salmoni che cadono nell'ipercubo predefinito centrato in $x^*$, qui un intervallo di lunghezza $h$: $\hat p(x^*) = K/(N h^n)$ con $n = 1$, cioè $${c.K}/(${c.N} \cdot ${c.h}) = ${c.p}$.`
    case STEP.contributi:
      return String.raw`Seconda lettura: la stima è una collezione di contributi di funzioni rettangolari (*a collection of contributions coming from rectangular functions*), ognuna associata a un singolo campione, di base $h$ e area $1/N$. In $x^*$ si sommano le altezze dei rettangoli che lo coprono: ${c.K} × ${c.w} = ${c.p}$.`
    case STEP.specchia:
      return String.raw`Perché è lo stesso numero? Il rettangolo è simmetrico, $\gamma(u) = \gamma(-u)$, quindi $\gamma\big(\frac{x_k - x^*}{h}\big) = \gamma\big(\frac{x^* - x_k}{h}\big)$: "$x_k$ sta nella finestra di $x^*$" equivale a "$x^*$ sta nel rettangolo di $x_k$". La finestra si specchia su ogni campione: una finestra che guarda i campioni diventa $N$ finestre posate sui campioni.`
    case STEP.traccia:
      return String.raw`La penna fa scorrere $x^*$ da 0 a 10: la stima diventa una funzione di $x$, costante a tratti. Sale di $1/(Nh)$ in ogni $x_k - h/2$ e scende in ogni $x_k + h/2$ (i triangolini): in alto $K$ cambia negli stessi punti.`
    case STEP.esplora:
      return String.raw`Con lo slider di $h$ i rettangoli si allargano e si abbassano mantenendo l'area $1/N$: i gradini diventano pochi e larghi oppure tanti e stretti, ma l'area sotto la curva resta $1$. Clic sull'asse in alto per aggiungere un salmone, clic su un salmone per toglierlo ($N$ da 2 a 15): le due viste restano uguali.`
    default:
      return String.raw`«This equation suggests a more general approach to estimating density functions. *Rather than limiting ourselves to the hypercube window function, suppose we allow a more general class of window functions.*» Solo la seconda vista si generalizza: basta cambiare la forma del mattoncino. Continua nel widget *Dal conteggio all'interpolazione*.`
  }
}

/** La vista contributi con i numeri: gli addendi che coprono x* (al più sei, poi i puntini). */
export function texContributions(K: number): string {
  const shown = Math.min(K, 6)
  const terms = K === 0 ? '0' : Array.from({ length: shown }, () => String.raw`\val[3]{w}`).join('+') + (K > shown ? String.raw`+\cdots` : '')
  return String.raw`\hat p(x^*)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h}\gamma\left(\frac{x^*-x_k}{h}\right)=${terms}=\val[3]{p}`
}
export const TEX_COUNT = String.raw`\hat p(x^*)=\frac{K}{NV}=\frac{K}{Nh}=\frac{\val[0]{K}}{\val[0]{N}\cdot\val{h}}=\val[3]{p}`
export const TEX_BOTH = String.raw`\hat{p}(x^*)=\frac{K}{NV}=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h}\gamma\left(\frac{x_k-x^*}{h}\right)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h}\gamma\left(\frac{x^*-x_k}{h}\right)`
export const TEX_SYMMETRY = String.raw`\gamma\left(\frac{x_k-x^*}{h}\right)=\gamma\left(\frac{x^*-x_k}{h}\right)`
export const TEX_RECT = String.raw`\hat{p}(x)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h}\,\Pi\left(\frac{x-x_k}{h}\right)\quad (n=1),\qquad \hat{p}(\mathbf{x}^*)=\frac{K}{N h^n}`

export const CHALLENGE_PROMPT = String.raw`Con gli 8 salmoni iniziali e $h = 1.5$: **(1)** porta $x^*$ in un punto in cui la stima vale esattamente $2/(Nh) = 0.167$ e indica quali **due** rettangoli lo coprono; **(2)** trova l'intervallo di $x^*$ in cui la curva a gradini è massima e scrivi quanti salmoni conta lì.`
export const CHALLENGE_HINT = String.raw`Per la (1) cerca un tratto della curva a gradini alto due mattoncini, per esempio fra i salmoni 5.0 e 6.2. Per la (2) il gradino più alto è dove si sovrappongono più rettangoli: guarda dove quattro basi di larghezza 1.5 si toccano tutte.`
