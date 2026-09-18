// Logica del widget m09-disegna-la-somma (concetti c71 disegno d'esame con una coppia di campioni, c10 contributi
// rettangolari, c16 interpolazione). Due salmoni, x_1 = 2 e x_2 = 3: nella fase 1 (conteggio, h = 2) su ciascuno si
// posa un mattoncino di base h e altezza 1/(Nh) e la stima è una scaletta; nella fase 2 (interpolazione, h = 1) i
// mattoncini diventano campane gaussiane di area 1/2 e la stima è la loro somma. Lo studente disegna prima, poi
// il widget mostra la somma vera e misura quanto il disegno se ne discosta.
import { kernelValue } from '../../lib/ml/nonparam'
import { linspace, trapz } from '../../lib/ml/stats'
import { createRng } from '../../lib/rng'
import { maximaAt } from './parzen-lab'

export const DOMAIN: readonly [number, number] = [0, 6]
export const SAMPLES0: readonly [number, number] = [2, 3]
export const N = 2
export const H1 = 2
export const H2 = 1
export const H_RANGE: readonly [number, number] = [0.2, 3]
export const H_STEP = 0.05
export const X_STEP = 0.05
export const GAP_RANGE: readonly [number, number] = [0.5, 3]
/** Un mattoncino a meno di questo dal centro di un campione ci si aggancia. */
export const SNAP = 0.2
/** Durata della prova orale. */
export const ORAL_MS = 90_000
/** Dove aspettano i mattoncini prima di essere posati: in alto, ai due lati. */
export const PARKED: readonly [number, number] = [1.1, 4.9]

export type Phase = 1 | 2

/** Il contributo di un campione: (1/(N h)) γ((x − x_k)/h), rettangolare o gaussiano. */
export const brick = (x: number, xk: number, h: number, phase: Phase): number => kernelValue((x - xk) / h, phase === 1 ? 'rettangolare' : 'gaussiano') / (N * h)

/** La stima vera: la somma dei due contributi. */
export const sumAt = (x: number, samples: readonly number[], h: number, phase: Phase): number => samples.reduce((s, xk) => s + brick(x, xk, h, phase), 0)

/** K nella finestra di lato h centrata in x (conteggio chiuso). */
export const countK = (x: number, samples: readonly number[], h: number): number => samples.filter((xk) => kernelValue((xk - x) / h, 'rettangolare') === 1).length

// --- fase 1: la scaletta ---

/** I bordi della scaletta dentro il dominio: x_k ± h/2, ordinati e senza doppioni. */
export function breakpoints(samples: readonly number[], h: number): number[] {
  const b = samples.flatMap((s) => [s - h / 2, s + h / 2]).map((v) => Number(v.toFixed(9))).filter((v) => v > DOMAIN[0] && v < DOMAIN[1])
  return [...new Set(b)].sort((a, c) => a - c)
}

/** Gli intervalli della scaletta: fra un bordo e il successivo la stima è costante. */
export function intervals(samples: readonly number[], h: number): [number, number][] {
  const cuts = [DOMAIN[0], ...breakpoints(samples, h), DOMAIN[1]]
  return cuts.slice(1).map((c, i) => [cuts[i], c] as [number, number])
}

/** Area esatta sotto la scaletta, anche dove esce dalla lavagna: Σ quota × larghezza fra bordi consecutivi. */
export function stairArea(samples: readonly number[], h: number): number {
  const cuts = [...new Set(samples.flatMap((s) => [s - h / 2, s + h / 2]).map((v) => Number(v.toFixed(9))))].sort((a, c) => a - c)
  let area = 0
  for (let i = 1; i < cuts.length; i++) area += (countK((cuts[i - 1] + cuts[i]) / 2, samples, h) / (N * h)) * (cuts[i] - cuts[i - 1])
  return area
}

/** Le quote possibili di un gradino: 0, 1/(Nh), 2/(Nh). */
export const quotes = (h: number): number[] => [0, 1 / (N * h), 2 / (N * h)]

/** La quota vera di ogni gradino (K/(Nh) a metà intervallo). */
export const trueLevels = (samples: readonly number[], h: number): number[] =>
  intervals(samples, h).map(([a, b]) => countK((a + b) / 2, samples, h) / (N * h))

/** I gradini disegnati giusti (confronto sull'indice della quota). */
export const levelErrors = (levels: readonly number[], samples: readonly number[], h: number): boolean[] => {
  const truth = trueLevels(samples, h)
  return truth.map((t, i) => Math.abs((levels[i] ?? -1) - t) > 1e-9)
}

// --- fase 2: la curva liscia ---

/** Le sette ascisse dei punti di controllo: x_1 − 1, x_1 − 0.5, x_1, il punto di mezzo, x_2, x_2 + 0.5, x_2 + 1. */
export function controlXs(samples: readonly number[]): number[] {
  const [a, b] = [Math.min(...samples), Math.max(...samples)]
  return [a - 1, a - 0.5, a, (a + b) / 2, b, b + 0.5, b + 1].map((v) => Number(v.toFixed(4)))
}

/** Il disegno dello studente come spezzata per i punti di controllo; fuori dal primo e dall'ultimo vale 0. */
export function drawnAt(x: number, xs: readonly number[], ys: readonly number[]): number {
  if (x < xs[0] || x > xs[xs.length - 1]) return 0
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) {
      const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1] || 1)
      return ys[i - 1] + (ys[i] - ys[i - 1]) * t
    }
  }
  return ys[ys.length - 1]
}

/** Quante gobbe ha la somma di due campane: la regola |x_1 − x_2| ≤ 2h ⇒ una sola. */
export const humps = (samples: readonly number[], h: number): number => {
  const xs = linspace(DOMAIN[0] - 2, DOMAIN[1] + 2, 1601)
  return maximaAt(xs, xs.map((x) => sumAt(x, samples, h, 2))).length
}
export const oneHump = (samples: readonly number[], h: number): boolean => Math.abs(samples[0] - samples[1]) <= 2 * h

// --- errori del disegno ---

/** ∫ |disegno − vero| dx per la scaletta (fase 1). */
export const stairError = (levels: readonly number[], samples: readonly number[], h: number): number => {
  const iv = intervals(samples, h)
  return iv.reduce((s, [a, b], i) => s + Math.abs((levels[i] ?? 0) - countK((a + b) / 2, samples, h) / (N * h)) * (b - a), 0)
}

/** ∫ |disegno − vero| dx per la curva liscia (fase 2), dove lo studente disegna: fra il primo e l'ultimo punto. */
export const curveError = (ys: readonly number[], samples: readonly number[], h: number): number => {
  const cx = controlXs(samples)
  const xs = linspace(cx[0], cx[cx.length - 1], 601)
  return trapz(xs, xs.map((x) => Math.abs(drawnAt(x, cx, ys) - sumAt(x, samples, h, 2))))
}

/** Punteggio della prova orale da 0 a 100: 100 senza errore, 0 con un errore integrato pari a tutta l'area (1). */
export const oralScore = (stairErr: number, curveErr: number): number => Math.round(100 * Math.max(0, 1 - (stairErr + curveErr) / 2))

// --- prova orale ---

export interface OralSetup {
  samples: [number, number]
  h1: number
  h2: number
}

/** Due campioni e le due h estratti a caso (a seed): distanza fra 0.5 e 3, tutto dentro la lavagna. */
export function oralSetup(seed: number): OralSetup {
  const r = createRng(seed)
  const gap = Number((0.5 + r.next() * 2.5).toFixed(1))
  const a = Number((1.2 + r.next() * (DOMAIN[1] - 2.4 - gap)).toFixed(1))
  const h1 = Number((0.6 + r.next() * 1.8).toFixed(1))
  const h2 = Number((0.3 + r.next() * 0.9).toFixed(1))
  return { samples: [a, Number((a + gap).toFixed(1))], h1, h2 }
}

// --- il racconto ---

export const STEP = { lavagna: 0, posa: 1, pila: 2, controprova: 3, campane: 4, somma: 5, gobbe: 6, tocca: 7 } as const

export const STEPS = [
  { id: 'lavagna', label: 'La lavagna: due salmoni', durationMs: 1500 },
  { id: 'posa', label: 'Un mattoncino su ogni salmone', durationMs: 900 },
  { id: 'pila', label: 'I mattoncini si impilano: la scaletta', durationMs: 900 },
  { id: 'controprova', label: 'Controprova: una finestra che conta', durationMs: 4000 },
  { id: 'campane', label: 'I mattoncini diventano campane', durationMs: 900 },
  { id: 'somma', label: 'La somma delle campane', durationMs: 1300 },
  { id: 'gobbe', label: 'h piccolo: due gobbe', durationMs: 1600 },
  { id: 'tocca', label: 'Tocca a te: disegna', durationMs: 1000 },
] as const

export interface CaptionCtx {
  x1: string
  x2: string
  h1: string
  h2: string
  w1: string
  K: number
  pk: string
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.lavagna:
      return String.raw`È il disegno che Melgani chiede alla lavagna: «*Graphical representation of how the counting/interpolation works with a couple of samples*». Due salmoni, $x_1 = ${c.x1}$ e $x_2 = ${c.x2}$ ($N = 2$). Nella fase 1 (conteggio, $h = ${c.h1}$) posa i due mattoncini sui salmoni trascinandoli; poi prevedi la somma. Oppure premi Play.`
    case STEP.posa:
      return String.raw`Su ogni campione si posa un rettangolo di base $h = ${c.h1}$ e altezza $1/(Nh) = ${c.w1}$: la sua area è $1/N = 0.5$, la metà della massa totale.`
    case STEP.pila:
      return String.raw`Dove i mattoncini si sovrappongono si impilano: la stima è una scaletta con le quote $0$, $\frac{1}{2h}$ e $\frac{1}{h}$, cioè $0$, un mattoncino, due mattoncini. I salti sono in $x_k \pm h/2$.`
    case STEP.controprova:
      return String.raw`La stessa scaletta, contando: una finestra di lato $h$ scorre lungo l'asse, il contatore $K$ passa da 0 a 1 a 2 a 1 a 0 e la penna traccia $K/(Nh)$. Adesso $K = ${c.K}$ e $\hat p = ${c.pk}$. **Una finestra che conta = due rettangoli che si sommano.**`
    case STEP.campane:
      return String.raw`Fase 2, interpolazione ($h = ${c.h2}$): ogni mattoncino diventa una campana gaussiana, ancora di area $1/2$. Il contributo di un salmone non è più "dentro o fuori": è graduato con la distanza.`
    case STEP.somma:
      return String.raw`La somma delle due campane è una curva liscia, senza salti. Con $h = 1$ i valori notevoli sono $0.352$ a metà strada, $0.320$ sui due salmoni e $0.148$ un'unità più in là.`
    case STEP.gobbe:
      return String.raw`Con $h = 0.3$ i salmoni distano più di $2h$: la gobba unica si spacca in due, con i picchi attorno a $0.667$ e una valle a $0.332$ in mezzo. La regola: una sola gobba se $|x_1 - x_2| \le 2h$.`
    default:
      return String.raw`Tocca a te: posa i mattoncini, prevedi la scaletta, poi passa alla fase 2 e disegna la curva con i sette punti; "Verifica il disegno" confronta con la somma vera. Il commento da dire a voce: ogni campione porta area $1/N$; il contributo dipende dalla distanza; con la gaussiana niente salti.`
  }
}

export const TEX_TWO = String.raw`\hat{p}(x)=\frac{1}{2}\left[\frac{1}{h}\gamma\left(\frac{x-x_1}{h}\right)+\frac{1}{h}\gamma\left(\frac{x-x_2}{h}\right)\right]`
export const TEX_LIVE = String.raw`\hat p(\val{x})=\frac{1}{2}\Big[\frac{\gamma(\val{u1})}{\val{h}}+\frac{\gamma(\val{u2})}{\val{h}}\Big]=\frac{1}{2}\big[\val[3]{a1}+\val[3]{a2}\big]=\val[3]{p}`
export const TEX_COUNT = String.raw`\hat{p}(x^*)=\frac{K}{N h},\qquad K\in\{0,1,2\}:\qquad \frac{\val[0]{K}}{2\cdot\val{h}}=\val[3]{pk}`
export const TEX_RULES = String.raw`\gamma=\Pi:\ \hat{p}(x)\in\left\{0,\ \frac{1}{2h},\ \frac{1}{h}\right\},\qquad \gamma\ \text{gaussiano}:\ |x_1-x_2|\le 2h\ \Rightarrow\ \text{una sola gobba}`

export const CHALLENGE_PROMPT = String.raw`Senza muovere lo slider: con i campioni in 2 e in 3, per quali $h$ la somma di due campane gaussiane ha **due gobbe**? E quanto vale il gradino **più alto** della scaletta se $h = 0.5$?`
export const CHALLENGE_HINT = String.raw`Due gobbe quando le campane sono abbastanza strette da non fondersi: la regola confronta $|x_1 - x_2|$ con $2h$. Per la scaletta: con $h = 0.5$ i due mattoncini si toccano appena, quindi il gradino più alto è un mattoncino solo, alto $1/(Nh)$.`

export type HumpChoice = '' | 'lt05' | 'gt05' | 'lt1' | 'gt1'

export interface ChallengeVerdict {
  ruleOk: boolean
  stepOk: boolean
  top: number
  ok: boolean
}

/** La sfida: due gobbe per h < 0.5; con h = 0.5 i rettangoli non si sovrappongono e il gradino più alto vale 1. */
export function judge(choice: HumpChoice, step: number): ChallengeVerdict {
  const top = Math.max(...trueLevels(SAMPLES0, 0.5))
  const ruleOk = choice === 'lt05'
  const stepOk = Math.abs(step - top) < 0.01
  return { ruleOk, stepOk, top, ok: ruleOk && stepOk }
}
