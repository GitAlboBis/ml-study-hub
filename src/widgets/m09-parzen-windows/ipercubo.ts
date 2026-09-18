// Logica del widget m09-ipercubo-che-conta (concetti c04-c07): l'ipercubo di lato h centrato in x* e la funzione
// finestra γ che trasforma "contare i salmoni nel quadrato" in una somma scritta in formula.
//
//   x_k ∈ R  ⟺  γ((x_k − x*)/h) = 1,     K = Σ_k γ((x_k − x*)/h),     V = hⁿ,     p̂(x*) = K/(NV)
//
// γ è l'indicatrice dell'ipercubo unitario [−1/2, 1/2]ⁿ (Π per componente, kernelValue 'rettangolare'): sottrarre x*
// trasla l'ipercubo nell'origine, dividere per h lo riporta a lato 1. I salmoni sono sintetici e a seed: luminosità,
// larghezza e lunghezza riscalate a 0-10 (unità normalizzate) così che un solo lato h abbia senso su tutti gli assi.
import { kernelValue } from '../../lib/ml/nonparam'
import { createRng } from '../../lib/rng'

export type Point3 = readonly [number, number, number]
export type Dim = 1 | 2 | 3

export const N_SALMON = 40
export const SEED_DEFAULT = 38
export const X_START: readonly [number, number] = [5, 5]
/** La terza coordinata di x* (lunghezza) quando si passa a n = 3. */
export const X3 = 5
export const H_DEFAULT = 1.5
export const H_RANGE: readonly [number, number] = [0.2, 8]
export const H_STEP = 0.1
/** Tempo della scansione: 250 ms a salmone (10 s per 40); il segmento verso x_k cresce nei primi 120 ms. */
export const SCAN_MS_EACH = 250
export const SEGMENT_MS = 120

const clampR = (v: number) => Number(Math.min(9.8, Math.max(0.2, v)).toFixed(1))

/**
 * I 40 salmoni del training set: attorno a (5, 5, 5) con deviazione 1.5 per asse e una correlazione di 0.3 fra
 * luminosità e larghezza (i salmoni più chiari tendono a essere più larghi). Coordinate a un decimale.
 */
export function salmonSet(seed: number, n = N_SALMON): Point3[] {
  const r = createRng(seed)
  const rho = 0.3
  return Array.from({ length: n }, () => {
    const a = r.normal(0, 1)
    const b = r.normal(0, 1)
    const c = r.normal(0, 1)
    return [clampR(5 + 1.5 * a), clampR(5 + 1.5 * (rho * a + Math.sqrt(1 - rho * rho) * b)), clampR(5 + 1.5 * c)] as const
  })
}

/** Il centro x* con n componenti: (lum), (lum, larg), (lum, larg, lung). */
export const centerOf = (x: readonly [number, number], n: Dim): number[] => [x[0], x[1], X3].slice(0, n)

/** u = (x_k − x*)/h sulle prime n componenti: il salmone visto dall'ipercubo unitario. */
export const normalized = (p: Point3, center: readonly number[], h: number): number[] => center.map((c, j) => (p[j] - c) / h)

/** γ(u): 1 se |u_j| ≤ 1/2 per ogni j (dentro l'ipercubo unitario), 0 altrimenti. È il prodotto delle Π di ogni asse. */
export const gammaCube = (u: readonly number[]): 0 | 1 => (u.every((v) => kernelValue(v, 'rettangolare') === 1) ? 1 : 0)

/** γ((x_k − x*)/h) per ogni salmone, nell'ordine del training set: la fila di 0 e 1 della sommatoria. */
export const gammaRow = (points: readonly Point3[], center: readonly number[], h: number): (0 | 1)[] => points.map((p) => gammaCube(normalized(p, center, h)))

/** K = Σ_k γ((x_k − x*)/h). */
export const countK = (points: readonly Point3[], center: readonly number[], h: number): number => gammaRow(points, center, h).reduce<number>((s, g) => s + g, 0)

/** V = hⁿ. */
export const volume = (h: number, n: Dim): number => h ** n

/** p̂(x*) = K / (N V). */
export const estimate = (K: number, N: number, h: number, n: Dim): number => (N > 0 ? K / (N * volume(h, n)) : 0)

/** I valori dello slider di h: 0.2, 0.3, …, 8 (senza il rumore delle somme in virgola mobile). */
export const H_VALUES: readonly number[] = Array.from({ length: Math.round((H_RANGE[1] - H_RANGE[0]) / H_STEP) + 1 }, (_, i) => Number((H_RANGE[0] + i * H_STEP).toFixed(1)))

/** p̂(x*) in funzione di h, per il grafico laterale. */
export const estimateVsH = (points: readonly Point3[], center: readonly number[], n: Dim): [number, number][] =>
  H_VALUES.map((h) => [h, estimate(countK(points, center, h), points.length, h, n)])

/** Gli h dello slider per cui nel quadrato centrato in x* cadono esattamente `target` salmoni (n = 2). */
export const hForK = (points: readonly Point3[], x: readonly [number, number], target: number): number[] => H_VALUES.filter((h) => countK(points, centerOf(x, 2), h) === target)

// --- scansione (storyboard) ---

export interface ScanState {
  /** quanti salmoni sono già stati esaminati (0-N) */
  done: number
  /** il salmone in esame (indice), -1 se nessuno */
  current: number
  /** 0-1: quanto è cresciuto il segmento da x* al salmone in esame */
  segment: number
  /** 0-1: avanzamento dentro lo spazio del salmone in esame (per l'impulso) */
  local: number
}

/**
 * Stato della scansione all'avanzamento p (0-1) del passo: ogni salmone ha uno spazio di 1/N; il segmento cresce
 * nei primi SEGMENT_MS/SCAN_MS_EACH del suo spazio. A p = 1 tutti i salmoni sono esaminati.
 */
export function scanAt(p: number, n: number): ScanState {
  if (n <= 0) return { done: 0, current: -1, segment: 0, local: 0 }
  if (p >= 1) return { done: n, current: -1, segment: 1, local: 1 }
  const t = Math.max(0, p) * n
  const current = Math.min(n - 1, Math.floor(t))
  const local = t - current
  return { done: current, current, segment: Math.min(1, local / (SEGMENT_MS / SCAN_MS_EACH)), local }
}

/** Impulso del salmone "dentro": scala 1 → 1.4 → 1 da quando il segmento l'ha raggiunto alla fine del suo spazio. */
export function pulseScale(local: number): number {
  const start = SEGMENT_MS / SCAN_MS_EACH
  const t = (local - start) / (1 - start)
  if (t <= 0 || t >= 1) return 1
  return 1 + 0.4 * Math.sin(Math.PI * t)
}

// --- sfida ---

export interface Spot {
  id: 'A' | 'B' | 'C'
  x: readonly [number, number]
}

/** Le tre posizioni proposte di x* per le previsioni (con h = 1.5 e n = 2). */
export const SPOTS: readonly Spot[] = [
  { id: 'A', x: [4.2, 5.6] },
  { id: 'B', x: [6.5, 4.0] },
  { id: 'C', x: [3.0, 3.0] },
]
export const PREDICTION_H = 1.5
export const PREDICTION_TOLERANCE = 1
/** Seconda parte: x* in (5, 3), esattamente 5 salmoni nel quadrato. */
export const TARGET_X: readonly [number, number] = [5, 3]
export const TARGET_K = 5

export interface ChallengeInput {
  points: readonly Point3[]
  predictions: Record<Spot['id'], number | null>
  x: readonly [number, number]
  h: number
  n: Dim
}

export interface ChallengeVerdict {
  spots: { id: Spot['id']; predicted: number | null; actual: number; ok: boolean }[]
  second: { atTarget: boolean; dimOk: boolean; K: number; ok: boolean; p: number }
  ok: boolean
}

const near = (a: number, b: number) => Math.abs(a - b) < 0.05

// --- racconto e formule (String.raw: le barre rovesciate restano quelle del LaTeX) ---

export const STEP = { quadro: 0, scansione: 1, somma: 2, esplora: 3, uno: 4, tre: 5, torna: 6 } as const

export const stepsFor = (n: number, scanMs = SCAN_MS_EACH): { id: string; label: string; durationMs: number }[] => [
  { id: 'quadro', label: 'Un quadrato di lato h attorno a x*', durationMs: 1500 },
  { id: 'scansione', label: 'Scansione: dentro o fuori?', durationMs: n * scanMs },
  { id: 'somma', label: 'La somma diventa K, poi la stima', durationMs: 1400 },
  { id: 'esplora', label: 'Sposta x*, cambia h', durationMs: 1500 },
  { id: 'uno', label: 'n = 1: il quadrato diventa un intervallo', durationMs: 1600 },
  { id: 'tre', label: 'n = 3: il quadrato diventa un cubo', durationMs: 1600 },
  { id: 'torna', label: 'Di nuovo n a tua scelta', durationMs: 1000 },
]

export interface CaptionCtx {
  K: number
  N: number
  /** h, V e p̂ già scritti */
  h: string
  V: string
  p: string
  n: Dim
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.quadro:
      return String.raw`Vogliamo $p(\mathbf{x}\mid\text{salmone})$ nel punto $\mathbf{x}^*$ senza assumere una gaussiana. **Ipotesi** (*hypotheses*): la regione $R$ attorno a $\mathbf{x}^*$ è un ipercubo di lato $h$ (*edge*), in $n = 2$ dimensioni un quadrato, di volume $V = h^n$. Contiamo i salmoni che ci cadono dentro: $K = ${c.K}$ su $N = ${c.N}$. Premi Play per la scansione.`
    case STEP.scansione:
      return String.raw`Per ogni $\mathbf{x}_k$ si calcola $\mathbf{u} = (\mathbf{x}_k - \mathbf{x}^*)/h$: sottrarre $\mathbf{x}^*$ porta il quadrato nell'origine, dividere per $h$ lo riduce all'ipercubo unitario (il riquadro). Se $|u_j| \le \frac12$ per ogni $j$, la funzione finestra (*window function*) vale $\gamma = 1$ e il salmone è dentro; altrimenti $\gamma = 0$. Ogni salmone aggiunge un addendo alla somma.`
    case STEP.somma:
      return String.raw`La fila di 0 e 1 si somma: $K = \sum_k \gamma\big(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\big) = ${c.K}$. Il conteggio è diventato una **formula**, funzione di $\mathbf{x}^*$ e di $h$. Con $V = ${c.V}$: $\hat p(\mathbf{x}^*) = K/(NV) = ${c.p}$.`
    case STEP.esplora:
      return String.raw`Trascina $\mathbf{x}^*$ (o usa le frecce su di esso): il quadrato lo segue e $K$ si aggiorna. Con lo slider di $h$ il quadrato si allarga: con $h$ piccolo $K$ vale 0 o 1 e $\hat p$ salta fra 0 e $1/(Nh^2)$; con $h$ grande il quadrato prende quasi tutti i salmoni e $\hat p$ scende verso $N/(N h^2)$. Il grafico piccolo mostra $\hat p(\mathbf{x}^*)$ contro $h$.`
    case STEP.uno:
      return String.raw`Con una sola feature, la luminosità, i salmoni si proiettano sull'asse e il quadrato diventa un intervallo di lunghezza $h$: $V = h$. Lo stesso $h = ${c.h}$ cattura molti più campioni.`
    case STEP.tre:
      return String.raw`Aggiungendo la lunghezza il quadrato diventa un cubo di volume $V = h^3$: un salmone che sta nel quadrato può uscire dal cubo per la terza coordinata (cerchio vuoto). A parità di $h$, al crescere di $n$ il volume cambia e il $K$ catturato cala: la tabella li confronta.`
    default:
      return String.raw`$\gamma$ è solo un interruttore 0/1: traslare e riscalare riportano qualunque ipercubo a quello unitario, così "contare" diventa una somma scritta in formula. Ora $n = ${c.n}$: prova le sfide qui sotto.`
  }
}

export const TEX_COUNT = String.raw`\begin{aligned}V&=h^n=\val{h}^{\val[0]{n}}=\val[3]{V}\\ K&=\sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)=\val[0]{K}\\ \hat{p}(\mathbf{x}^*)&=\frac{K}{NV}=\frac{\val[0]{K}}{\val[0]{N}\cdot\val[3]{V}}=\val[4]{p}\end{aligned}`
export const TEX_GAMMA = String.raw`\gamma(\mathbf{x})=\begin{cases}1, & \text{if } \mathbf{x} \text{ belongs to the hypercube}\\ 0, & \text{otherwise}\end{cases}\qquad \gamma(\mathbf{u})=1 \iff |u_j|\le \tfrac{1}{2},\quad j=1,\dots,n`
export const TEX_MEMBER = String.raw`\mathbf{x}_k\in R\iff\gamma\left[\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right]=1,\qquad \mathbf{x}_k\notin R\iff\gamma\left[\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right]=0`

/** Il salmone in esame: u con i numeri, per n = 1, 2, 3. */
export const texSample = (n: Dim): string => {
  const comps = ['\\val{u1}', '\\val{u2}', '\\val{u3}'].slice(0, n).join(',\\ ')
  return String.raw`\mathbf{u}=\frac{\mathbf{x}_{\val[0]{k}}-\mathbf{x}^*}{h}=(${comps})\ \Rightarrow\ \gamma(\mathbf{u})=\val[0]{g}`
}

export const CHALLENGE_PROMPT = String.raw`**Prima parte.** Per le tre posizioni proposte di $\mathbf{x}^*$ (A, B, C, segnate sul piano) scrivi il $K$ che prevedi con $h = 1.5$ e $n = 2$, prima di portarci $\mathbf{x}^*$: basta sbagliare al più di uno. **Seconda parte.** Porta $\mathbf{x}^*$ in $(5, 3)$ e trova il lato $h$ per cui nel quadrato cadono **esattamente 5** salmoni; leggi la densità stimata $5/(40\,h^2)$.`
export const CHALLENGE_HINT = String.raw`Attiva "Prevedi prima di guardare" per nascondere il conteggio mentre sposti $\mathbf{x}^*$. Per la seconda parte parti da $h = 1.5$ e sali di un decimo alla volta, guardando $K$.`

export function judge({ points, predictions, x, h, n }: ChallengeInput): ChallengeVerdict {
  const spots = SPOTS.map((s) => {
    const actual = countK(points, centerOf(s.x, 2), PREDICTION_H)
    const predicted = predictions[s.id]
    return { id: s.id, predicted, actual, ok: predicted !== null && Math.abs(predicted - actual) <= PREDICTION_TOLERANCE }
  })
  const atTarget = near(x[0], TARGET_X[0]) && near(x[1], TARGET_X[1])
  const K = countK(points, centerOf(x, 2), h)
  const dimOk = n === 2
  const secondOk = atTarget && dimOk && K === TARGET_K
  return { spots, second: { atTarget, dimOk, K, ok: secondOk, p: estimate(K, points.length, h, 2) }, ok: spots.every((s) => s.ok) && secondOk }
}
