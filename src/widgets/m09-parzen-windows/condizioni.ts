// Logica del widget m09-tre-condizioni-buon-kernel (concetti c22 massimo nell'origine, c23 continuità, c24
// decadimento a zero). Rilevamento di anomalie su un sensore di temperatura: una lettura è anomala se la densità
// stimata lì è sotto una soglia. Tre interruttori "rompono" una condizione alla volta, anche insieme:
// 1. massimo fuori dall'origine: 0.5 γ(u − 1.5) + 0.5 γ(u + 1.5), due gobbe e un avvallamento al centro;
// 2. discontinuo: il rettangolo al posto della gaussiana;
// 3. non decade a zero: 0.8 γ(u) più una coda costante di area 0.2 stesa su tutto l'asse del grafico.
// Ognuno resta una densità (area 1): la stima è legittima ma non sensata.
import { kernelValue } from '../../lib/ml/nonparam'
import { linspace } from '../../lib/ml/stats'
import { mixtureSamples } from './parzen-lab'

export const DOMAIN: readonly [number, number] = [0, 100]
/** Lunghezza dell'asse su cui si stende la coda costante del guasto 3. */
export const AXIS_LENGTH = DOMAIN[1] - DOMAIN[0]
export const OUTLIER0 = 80
export const OUTLIER_RANGE: readonly [number, number] = [50, 100]
export const H0 = 2
export const H_RANGE: readonly [number, number] = [0.5, 10]
export const H_STEP = 0.1
export const THRESHOLD0 = 0.005
export const THRESHOLD_RANGE: readonly [number, number] = [0, 0.05]
export const THRESHOLD_STEP = 0.001
export const SEED = 7

/** 30 letture attorno a 40 °C (deviazione 3 °C), a seed e con un decimale; la trentunesima è la lettura isolata. */
export const CLUSTER: readonly number[] = mixtureSamples(SEED, 30, [{ weight: 1, mu: 40, sigma: 3 }], DOMAIN, 1)
export const samplesWith = (outlier: number): number[] => [...CLUSTER, outlier]

export interface Broken {
  /** 1: massimo fuori dall'origine */
  offCenter: boolean
  /** 2: discontinuo (rettangolo) */
  jumpy: boolean
  /** 3: non decade a zero (coda costante) */
  heavy: boolean
}

export const HEALTHY: Broken = { offCenter: false, jumpy: false, heavy: false }

const TAIL = 0.2
const SHIFT = 1.5

/** La forma di base, gaussiana o (guasto 2) rettangolare, eventualmente spaccata in due gobbe (guasto 1). */
function core(u: number, b: Broken): number {
  const shape = (v: number) => kernelValue(v, b.jumpy ? 'rettangolare' : 'gaussiano')
  return b.offCenter ? 0.5 * shape(u - SHIFT) + 0.5 * shape(u + SHIFT) : shape(u)
}

/**
 * Il kernel γ(u) con i guasti. La coda costante del guasto 3 ha area 0.2 su tutto l'asse del grafico: in u vale
 * 0.2·h/L (L = lunghezza dell'asse in °C), così nella stima ogni lettura aggiunge 0.2/L ovunque.
 */
export const gammaOf = (u: number, b: Broken, h: number): number => (b.heavy ? (1 - TAIL) * core(u, b) + (TAIL * h) / AXIS_LENGTH : core(u, b))

/** p̂(x) = (1/N) Σ (1/h) γ((x − x_k)/h) sul dominio del grafico. */
export function estimateAt(x: number, samples: readonly number[], h: number, b: Broken): number {
  let s = 0
  for (const xk of samples) s += gammaOf((x - xk) / h, b, h)
  return s / (samples.length * h)
}

export const estimateOn = (xs: readonly number[], samples: readonly number[], h: number, b: Broken): number[] => xs.map((x) => estimateAt(x, samples, h, b))

export const GRID = linspace(DOMAIN[0], DOMAIN[1], 801)
export const U_GRID = linspace(-6, 6, 481)

export interface Conditions {
  /** γ(0) = max γ */
  maxAtOrigin: boolean
  /** γ continua */
  continuous: boolean
  /** γ(u) → 0 per |u| → ∞ */
  decays: boolean
}

/** Le tre spie, misurate sul kernel: il massimo sulla griglia, la continuità dalla forma, la coda lontana. */
export function conditionsOf(b: Broken, h: number): Conditions {
  const g0 = gammaOf(0, b, h)
  const top = Math.max(...U_GRID.map((u) => gammaOf(u, b, h)))
  return { maxAtOrigin: g0 >= top - 1e-12, continuous: !b.jumpy, decays: gammaOf(50, b, h) < 1e-9 }
}

/** Tratti del dominio in cui la stima sta sotto la soglia: le zone "anomalia". */
export function belowRuns(xs: readonly number[], ys: readonly number[], threshold: number): [number, number][] {
  const out: [number, number][] = []
  let start: number | null = null
  ys.forEach((y, i) => {
    const below = y < threshold
    if (below && start === null) start = xs[i]
    if (!below && start !== null) {
      out.push([start, xs[i - 1]])
      start = null
    }
  })
  if (start !== null) out.push([start, xs[xs.length - 1]])
  return out
}

/** Minimi locali della stima (per segnalare il "buco sopra i dati"). */
export function localMinimaAt(xs: readonly number[], ys: readonly number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < ys.length - 1; i++) if (ys[i] < ys[i - 1] - 1e-12 && ys[i] <= ys[i + 1]) out.push(xs[i])
  return out
}

// --- racconto ---

export const STEP = { quadro: 0, gobbe: 1, salti: 2, coda: 3, trascina: 4, ripara: 5 } as const

export const STEPS = [
  { id: 'quadro', label: 'Un buon kernel: tre spie verdi', durationMs: 1500 },
  { id: 'gobbe', label: 'Massimo fuori dall\'origine: un buco sopra i dati', durationMs: 1800 },
  { id: 'salti', label: 'Kernel discontinuo: la stima a gradini', durationMs: 1600 },
  { id: 'coda', label: 'Kernel che non decade: densità dove non c\'è nessun dato', durationMs: 1600 },
  { id: 'trascina', label: 'La lettura isolata si sposta', durationMs: 1800 },
  { id: 'ripara', label: 'Ripara tutto: le motivazioni', durationMs: 1400 },
] as const

/** Durante i passi del racconto i guasti sono imposti: uno alla volta. */
export function brokenOfStep(index: number): Broken | null {
  switch (index) {
    case STEP.gobbe:
      return { ...HEALTHY, offCenter: true }
    case STEP.salti:
      return { ...HEALTHY, jumpy: true }
    case STEP.coda:
      return { ...HEALTHY, heavy: true }
    case STEP.ripara:
      return HEALTHY
    default:
      return null
  }
}

/** Nel passo "trascina" la lettura isolata va da 80 a 60 e torna, per mostrare che la gobba la segue. */
export const outlierOfStep = (p: number): number => OUTLIER0 - 20 * Math.sin(Math.PI * Math.min(1, Math.max(0, p)))

export interface CaptionCtx {
  h: string
  alarm: boolean
  x: string
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.quadro:
      return String.raw`31 letture di un sensore industriale: 30 attorno a 40 °C e una isolata a 80 °C. Una lettura è **anomala** se la densità stimata lì è sotto la soglia (zone ocra). Essere una densità ($\gamma \ge 0$, $\int\gamma = 1$) rende la stima legittima; per una stima **buona** Melgani aggiunge tre condizioni (*additional conditions to get a good estimate*). Con il gaussiano, $h = ${c.h}$, valgono tutte.`
    case STEP.gobbe:
      return String.raw`Si sposta il massimo del kernel fuori dall'origine: $0.5\,\gamma(u - 1.5) + 0.5\,\gamma(u + 1.5)$. La stima si abbassa **proprio sopra i dati** e sale ai lati: sulla lettura isolata compaiono due gobbe e un minimo esattamente a 80 °C, dove il dato c'è. Con $h$ oltre 3.3 °C circa l'avvallamento compare anche nella collina, e da 4 °C in su cade proprio a 40 °C, nel punto più popolato: alzando la soglia il centro dei dati diventa "anomalo" prima dei suoi fianchi.`
    case STEP.salti:
      return String.raw`Un kernel discontinuo (il rettangolo) dà una stima a gradini: spostando di un decimo di grado una lettura vicino a un bordo, $\hat p$ nel punto sonda salta e l'allarme si accende e si spegne a scatti. La pdf da stimare è continua: conviene che lo sia anche il kernel.`
    case STEP.coda:
      return String.raw`Un kernel che non decade a zero: $0.8\,\gamma(u)$ più una coda costante di area $0.2$ stesa su tutto l'asse. Ogni lettura alza la densità **ovunque**, anche a 5 °C dove non c'è nessun dato, e la collina principale si abbassa del 20%. I punti lontani devono avere un'influenza trascurabile.`
    case STEP.trascina:
      return String.raw`La lettura isolata si sposta: con il gaussiano la gobba la segue e il resto della stima non cambia. Con il guasto 3 acceso, invece, tutto l'asse si alzerebbe o abbasserebbe insieme. Trascinala tu (da 50 a 100 °C).`
    default:
      return String.raw`Ritorno al gaussiano. Le tre motivazioni delle note: i punti vicini al campione contribuiscono di più (massimo nell'origine); la pdf da stimare è continua (kernel continuo); i punti lontani devono avere influenza trascurabile (decadimento a zero). Nel punto sonda ${c.x} °C: ${c.alarm ? 'allarme acceso' : 'nessun allarme'}.`
  }
}

export const TEX_MAX = String.raw`\gamma(\mathbf{0})=\max_{\mathbf{x}}\gamma(\mathbf{x}),\qquad \mathbf{x}_k\in\arg\max_{\mathbf{x}}\ \gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)`
export const TEX_CONT = String.raw`\gamma(\cdot)\ \text{is continuous}`
export const TEX_DECAY = String.raw`\gamma(\mathbf{x})\to 0\ \text{ as }\ \mathbf{x}\to+\infty,\qquad \lim_{\|\mathbf{x}\|\to+\infty}\gamma(\mathbf{x})=0`
export const TEX_LIVE = String.raw`\hat p(\val{x})=\val[4]{p}\ \val{cmp}\ \text{soglia}=\val[3]{t}\qquad \gamma(0)=\val[3]{g0},\quad \max_u\gamma(u)=\val[3]{gmax}`

// --- sfida: tre stime "malate" anonime ---

export type Cond = 'massimo' | 'continuita' | 'decadimento'

export interface Patient {
  id: 'A' | 'B' | 'C'
  broken: Broken
  answer: Cond
}

/** Le tre stime anonime: una condizione violata ciascuna, in un ordine che non è quello delle spie. */
export const PATIENTS: readonly Patient[] = [
  { id: 'A', broken: { ...HEALTHY, heavy: true }, answer: 'decadimento' },
  { id: 'B', broken: { ...HEALTHY, offCenter: true }, answer: 'massimo' },
  { id: 'C', broken: { ...HEALTHY, jumpy: true }, answer: 'continuita' },
]

export function judge(answers: Record<Patient['id'], Cond | ''>): { per: { id: Patient['id']; ok: boolean; answer: Cond }[]; ok: boolean } {
  const per = PATIENTS.map((p) => ({ id: p.id, ok: answers[p.id] === p.answer, answer: p.answer }))
  return { per, ok: per.every((p) => p.ok) }
}

export const CHALLENGE_PROMPT = String.raw`Tre stime "malate" anonime, ottenute sugli stessi dati con $h = 2$: ognuna viola **una** delle tre condizioni. Per ciascuna indovina quale, **prima** di accendere le spie. Servono tre risposte giuste su tre.`
export const CHALLENGE_HINT = String.raw`Cerca il sintomo: gradini e salti vengono da un kernel discontinuo; densità che non va a zero lontano dai dati da un kernel che non decade; un avvallamento proprio sopra un dato isolato da un kernel con il massimo fuori dall'origine.`
