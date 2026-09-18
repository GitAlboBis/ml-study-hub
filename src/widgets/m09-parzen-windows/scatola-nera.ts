// Logica del widget m09-scatola-nera-non-parametrica: due "macchine" ricevono gli stessi campioni di radiazione
// solare giornaliera. Il modello parametrico gaussiano stima media e varianza a massima verosimiglianza; la black
// box di Parzen non assume nessuna forma e ha una sola ghiera, h. Quattro densità vere (tutte sintetiche, troncate
// a [0, 9] kWh/m² e rinormalizzate) mostrano quando vince l'una e quando l'altra.
import { parzen1d } from '../../lib/ml/nonparam'
import { gammaPdf, linspace, normalPdf, trapz } from '../../lib/ml/stats'
import type { Rng } from '../../content/types'
import { createRng } from '../../lib/rng'
import { gammaOf, kde } from './parzen-lab'

export const DOMAIN: readonly [number, number] = [0, 9]
/** Griglia del terreno e degli errori integrati. */
export const GRID = linspace(DOMAIN[0], DOMAIN[1], 361)
/** Scala di N dello slider (logaritmica, valori tondi): 10 … 1000, predefinito 30. */
export const N_STEPS = [10, 15, 20, 30, 40, 50, 70, 100, 150, 200, 300, 500, 700, 1000] as const
export const N_DEFAULT = 30
export const H_RANGE: readonly [number, number] = [0.1, 3]
export const H_DEFAULT = 0.6
export const SEED_DEFAULT = 1

export type TruthId = 'gaussiana' | 'bimodale' | 'asimmetrica' | 'unitri'

export interface Truth {
  id: TruthId
  it: string
  en: string
  /** la densità in LaTeX, prima del troncamento */
  tex: string
  /** un valore dalla densità NON troncata; il troncamento lo fa drawSamples scartando */
  draw: (rng: Rng) => number
  /** densità non normalizzata sul dominio */
  raw: (x: number) => number
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

/** Triangolare su [a, c] con moda b: inversa della funzione di ripartizione. */
function drawTriangle(rng: Rng, a: number, b: number, c: number): number {
  const u = rng.next()
  const f = (b - a) / (c - a)
  return u < f ? a + Math.sqrt(u * (c - a) * (b - a)) : c - Math.sqrt((1 - u) * (c - a) * (c - b))
}
const triPdf = (x: number, a: number, b: number, c: number) =>
  x < a || x > c ? 0 : x <= b ? (2 * (x - a)) / ((c - a) * (b - a)) : (2 * (c - x)) / ((c - a) * (c - b))

const GAMMA_K = 8
const GAMMA_THETA = 0.55

export const TRUTHS: readonly Truth[] = [
  {
    id: 'gaussiana',
    it: 'gaussiana',
    en: 'Gaussian',
    tex: String.raw`\mathcal N(4.5,\ 1.3^2)`,
    draw: (rng) => rng.normal(4.5, 1.3),
    raw: (x) => normalPdf(x, 4.5, 1.3),
  },
  {
    id: 'bimodale',
    it: 'bimodale',
    en: 'bimodal',
    tex: String.raw`0.4\,\mathcal N(2,\ 0.6^2)+0.6\,\mathcal N(6.5,\ 0.8^2)`,
    draw: (rng) => (rng.next() < 0.4 ? rng.normal(2, 0.6) : rng.normal(6.5, 0.8)),
    raw: (x) => 0.4 * normalPdf(x, 2, 0.6) + 0.6 * normalPdf(x, 6.5, 0.8),
  },
  {
    id: 'asimmetrica',
    it: 'asimmetrica',
    en: 'skewed',
    tex: String.raw`\mathrm{Gamma}(k=8,\ \theta=0.55)`,
    // somma di k esponenziali: una Gamma di forma intera
    draw: (rng) => {
      let v = 0
      for (let i = 0; i < GAMMA_K; i++) v += -GAMMA_THETA * Math.log(1 - rng.next())
      return v
    },
    raw: (x) => gammaPdf(x, GAMMA_K, GAMMA_THETA),
  },
  {
    id: 'unitri',
    it: 'uniforme + triangolo',
    en: 'uniform + triangle',
    tex: String.raw`0.5\,\mathcal U(1,\ 3.5)+0.5\,\mathrm{Tri}(4.5,\ 6.5,\ 8.5)`,
    draw: (rng) => (rng.next() < 0.5 ? 1 + 2.5 * rng.next() : drawTriangle(rng, 4.5, 6.5, 8.5)),
    raw: (x) => 0.5 * (x >= 1 && x <= 3.5 ? 1 / 2.5 : 0) + 0.5 * triPdf(x, 4.5, 6.5, 8.5),
  },
]

export const truthById = (id: TruthId): Truth => TRUTHS.find((t) => t.id === id) ?? TRUTHS[0]

const FINE = linspace(DOMAIN[0], DOMAIN[1], 3601)
const norms = new Map<TruthId, number>()

/** La densità vera sul dominio: troncata a [0, 9] e rinormalizzata (area 1 sul dominio). */
export function truthPdf(id: TruthId): (x: number) => number {
  const t = truthById(id)
  let z = norms.get(id)
  if (z === undefined) {
    z = trapz(FINE, FINE.map(t.raw))
    norms.set(id, z)
  }
  const zz = z
  return (x) => (x < DOMAIN[0] || x > DOMAIN[1] ? 0 : t.raw(x) / zz)
}

/** Semi diversi per densità diverse, a partire dal seme dei dati (Ricampiona lo aumenta di uno). */
const seedFor = (id: TruthId, seed: number) => seed * 7919 + TRUTHS.findIndex((t) => t.id === id) * 104729

/**
 * n misure di radiazione a seed, dentro [0, 9] (un valore fuori si scarta), con due decimali. Estratte una alla
 * volta: i primi n non cambiano quando n cresce, così lo slider di N aggiunge giornate invece di rimescolarle.
 */
export function drawSamples(id: TruthId, seed: number, n: number): number[] {
  const t = truthById(id)
  const rng = createRng(seedFor(id, seed))
  const out: number[] = []
  for (let guard = 0; out.length < n && guard < n * 100; guard++) {
    const v = Number(t.draw(rng).toFixed(2))
    if (v >= DOMAIN[0] && v <= DOMAIN[1]) out.push(v)
  }
  return out
}

export interface GaussFit {
  mu: number
  /** varianza a massima verosimiglianza, con 1/N */
  s2: number
}

/** Le due manopole del modello parametrico: μ̂ e σ̂² a massima verosimiglianza. */
export function gaussFit(samples: readonly number[]): GaussFit {
  const n = samples.length
  const mu = samples.reduce((s, v) => s + v, 0) / n
  const s2 = samples.reduce((s, v) => s + (v - mu) ** 2, 0) / n
  return { mu, s2 }
}

export const gaussCurve = (fit: GaussFit, xs: readonly number[] = GRID): number[] => xs.map((x) => normalPdf(x, fit.mu, Math.sqrt(fit.s2)))

/** La stima di Parzen (kernel gaussiano) sulla griglia. */
export const parzenCurve = (samples: readonly number[], h: number, xs: readonly number[] = GRID): number[] => kde(xs, samples, h, gammaOf('gaussiano'), { support: 6 })

export const iseOf = (xs: readonly number[], est: readonly number[], truth: (x: number) => number): number => trapz(xs, est.map((v, i) => (v - truth(xs[i])) ** 2))

export interface Errors {
  gauss: number
  parzen: number
}

/** Errore quadratico integrato delle due macchine sugli stessi campioni. */
export function machineErrors(samples: readonly number[], h: number, id: TruthId, xs: readonly number[] = GRID): Errors {
  const p = truthPdf(id)
  return { gauss: iseOf(xs, gaussCurve(gaussFit(samples), xs), p), parzen: iseOf(xs, parzenCurve(samples, h, xs), p) }
}

export type Machine = 'gauss' | 'parzen'
export const winnerOf = (e: Errors): Machine => (e.parzen < e.gauss ? 'parzen' : 'gauss')

/** La sfida si verifica sulla stessa griglia delle letture: ciò che si vede è ciò che conta. */
const CHECK_GRID = GRID

/** Per ogni densità vera: chi vince con N campioni, la h data e i dati del seme dato. */
export function winnersAt(n: number, h: number, seed: number): Record<TruthId, { errors: Errors; winner: Machine }> {
  const out = {} as Record<TruthId, { errors: Errors; winner: Machine }>
  for (const t of TRUTHS) {
    const errors = machineErrors(drawSamples(t.id, seed, n), h, t.id, CHECK_GRID)
    out[t.id] = { errors, winner: winnerOf(errors) }
  }
  return out
}

export interface Crossover {
  /** errori per ogni N dello slider */
  table: { n: number; errors: Errors }[]
  /** il più piccolo N dello slider da cui in poi Parzen ha SEMPRE l'errore minore; null se non succede mai */
  n: number | null
}

/**
 * Con questi dati (il seme) e questa h: da quale N in poi la black box batte il modello gaussiano per ogni N più
 * grande? Poiché lo slider aggiunge giornate senza rimescolarle, è esattamente ciò che si vede facendolo scorrere.
 */
export function crossover(id: TruthId, h: number, seed: number): Crossover {
  const all = drawSamples(id, seed, N_STEPS[N_STEPS.length - 1])
  const table = N_STEPS.map((n) => ({ n, errors: machineErrors(all.slice(0, n), h, id, CHECK_GRID) }))
  let from: number | null = null
  for (let i = table.length - 1; i >= 0; i--) {
    if (table[i].errors.parzen < table[i].errors.gauss) from = table[i].n
    else break
  }
  return { table, n: from }
}

/**
 * La zona in cui la gaussiana mette densità che i dati non hanno: l'intervallo contiguo attorno al punto di
 * massimo eccesso g(x) − p(x), finché l'eccesso resta sopra un quarto del massimo. null se l'eccesso è piccolo
 * (la densità vera è davvero gaussiana).
 */
export function excessZone(xs: readonly number[], g: readonly number[], p: readonly number[]): [number, number] | null {
  const diff = g.map((v, i) => v - p[i])
  let best = 0
  diff.forEach((d, i) => {
    if (d > diff[best]) best = i
  })
  const peak = Math.max(...g)
  if (!(diff[best] > 0.12 * peak)) return null
  const thr = diff[best] / 4
  let lo = best
  let hi = best
  while (lo > 0 && diff[lo - 1] > thr) lo--
  while (hi < xs.length - 1 && diff[hi + 1] > thr) hi++
  return [xs[lo], xs[hi]]
}

/** Quanto dura la caduta dei campioni sul nastro: 60 ms l'uno, fra 0.6 e 2 s. */
export const dropMs = (n: number): number => Math.min(2000, Math.max(600, n * 60))

/** Avanzamento della caduta del campione k su n, dato l'avanzamento p del passo (0-1). */
export const dropOf = (p: number, k: number, n: number): number => clamp01(p * (n + 3) - k)

/** Conteggio nella finestra di lato h centrata in x (quello della formula K/(NV)). */
export const windowCount = (x: number, samples: readonly number[], h: number): number => samples.filter((v) => Math.abs(v - x) <= h / 2).length

/** La stima di Parzen in un punto, per le letture. */
export const parzenAt = (x: number, samples: readonly number[], h: number): number => parzen1d(x, samples, h, 'gaussiano')

// --- racconto e formule (testi del widget: stanno qui perché il file .widget.tsx esporta solo meta e componente) ---

export const STEP = { quadro: 0, nastro: 1, curve: 2, valle: 3, finestre: 4, conta: 5, media: 6, perche: 7 } as const

export function stepsFor(n: number): { id: string; label: string; durationMs: number }[] {
  return [
    { id: 'quadro', label: 'Due macchine, gli stessi dati', durationMs: 1500 },
    { id: 'nastro', label: 'Le giornate entrano nelle macchine', durationMs: dropMs(n) },
    { id: 'curve', label: 'Da ciascuna esce una densità', durationMs: 1400 },
    { id: 'valle', label: 'Chi sbaglia di più, e dove', durationMs: 1600 },
    { id: 'finestre', label: 'Apri la scatola: una finestra su ogni dato', durationMs: 1600 },
    { id: 'conta', label: 'La proporzione di punti nella finestra', durationMs: 1600 },
    { id: 'media', label: 'La media dei kernel è la stima', durationMs: 1800 },
    { id: 'perche', label: 'Quando serve la stima non parametrica', durationMs: 1500 },
  ]
}

export interface CaptionCtx {
  n: number
  /** h già scritto come nello slider (0.60) */
  h: string
  truth: TruthId
  /** μ̂ già scritto */
  mu: string
  winner: Machine
  K: number
  /** x* già scritto */
  x: string
}

// I testi con matematica sono String.raw: una barra rovescia è una barra rovescia, come nel LaTeX delle slide.
export function captionFor(index: number, c: CaptionCtx): string {
  const t = truthById(c.truth)
  switch (index) {
    case STEP.quadro:
      return String.raw`Le stesse $N = ${c.n}$ giornate di radiazione solare entrano in due macchine. A sinistra il **modello parametrico**: la forma è decisa prima (una gaussiana) e dai dati si stimano solo due manopole, $\hat\mu$ e $\hat\sigma^2$. A destra la **black box di Parzen**: nessuna forma imposta, una sola ghiera $h$. Sotto, l'istogramma dei dati, le due curve e, tratteggiata, la densità vera (dati sintetici). Premi Play.`
    case STEP.nastro:
      return String.raw`Le misure $x_1, \dots, x_N$ scendono sul nastro: sono i campioni di addestramento (*training samples*). Entrambe le macchine vedono **solo loro**: nessuna delle due conosce la densità vera, qui ${t.it} (*${t.en}*).`
    case STEP.curve:
      return String.raw`Da ciascuna macchina esce una curva di densità. La gaussiana è sempre una campana sola, larga $\hat\sigma$ e centrata in $\hat\mu$: la forma l'ha scelta chi ha costruito la macchina. La black box disegna la forma che i dati suggeriscono.`
    case STEP.valle:
      return c.winner === 'parzen'
        ? String.raw`La campana gaussiana mette densità dove i dati sono pochi (la zona evidenziata) e non vede la forma vera: il suo errore quadratico integrato $\int(\hat p - p)^2dx$ è più grande. Quando la forma funzionale (*functional form*) imposta è sbagliata, stimare bene $\hat\mu = ${c.mu}$ e $\hat\sigma^2$ non basta.`
        : String.raw`Qui vince il modello parametrico: la sua forma è giusta (o quasi) e con pochi dati due numeri si stimano meglio di una curva intera. La black box paga la sua libertà con più varianza. Cambia densità vera, oppure aumenta $N$.`
    case STEP.finestre:
      return String.raw`Si apre il coperchio. Primo tempo: attorno a ogni dato si posa una finestra (*window* o *kernel*) di larghezza $h = ${c.h}$, con area $1/N$. Nessuna ipotesi sulla forma: solo "quanto conta un dato per i punti vicini".`
    case STEP.conta:
      return String.raw`Secondo tempo: in un punto $x^* = ${c.x}$ la densità dipende da **quanti** punti cadono nella finestra rispetto al totale, $\hat p(x^*) = K/(NV)$: qui $K = ${c.K}$ su $N = ${c.n}$, con $V = h$. Sposta $x^*$ con il puntatore o con le frecce sul grafico.`
    case STEP.media:
      return String.raw`Terzo tempo: la stima è la media delle $N$ finestre posate sui dati, $\hat p(x) = \frac1N\sum_k \frac{1}{V(h)}\gamma\big(\frac{x - x_k}{h}\big)$. Le campane si impilano e la cima della pila è la curva che esce dalla scatola. Il meccanismo è approfondito nei widget sull'ipercubo che conta e sulla somma dei kernel.`
    default:
      return String.raw`Si ricorre alla stima **non parametrica** quando non c'è conoscenza a priori sulla forma funzionale della pdf, oppure quando i modelli parametrici non la approssimano bene: per questo la si applica **direttamente ai training samples**. Non parametrico non vuol dire senza parametri, ma senza una forma imposta: resta da scegliere quanto lisciare, cioè $h$, e tutto il resto lo dicono i dati. Proprio perché è una scatola nera ci si chiede quanto sia buona la stima: bias, varianza, consistenza.`
  }
}

export const TEX_KNV = String.raw`\begin{aligned}\hat{p}(\mathbf{x}^*)&=\frac{K}{NV}=\frac{\val[0]{K}}{\val[0]{N}\cdot\val{h}}=\val[4]{pk}\\ \hat{p}(\mathbf{x})&=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\gamma\!\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right),\qquad \hat p(\val{x})=\val[4]{p}\end{aligned}`
export const TEX_ML = String.raw`\hat\mu=\frac{1}{N}\sum_{k=1}^{N}x_k=\val{mu},\qquad \hat\sigma^2=\frac{1}{N}\sum_{k=1}^{N}(x_k-\hat\mu)^2=\val{s2}`
export const TEX_ISE = String.raw`\mathrm{ISE}=\int\big(\hat p(x)-p(x)\big)^2dx:\qquad \mathrm{ISE}_{\text{gauss}}=\val[4]{iseG},\qquad \mathrm{ISE}_{\text{Parzen}}=\val[4]{iseP}`

export const CHALLENGE_PROMPT =
  "**Parte 1.** Per ciascuna delle quattro densità vere prevedi quale macchina avrà l'errore integrato più basso con $N = 30$ (con i dati di adesso e la $h$ della ghiera). **Parte 2.** Scegli la densità *asimmetrica*, quasi gaussiana, e porta $N$ al valore oltre il quale la black box ha **sempre** l'errore minore. Verifica controlla le due parti insieme; nella seconda basta arrivare a una tacca di distanza."
export const CHALLENGE_HINT =
  "Parte 2: con la densità asimmetrica fai scorrere $N$ e guarda le due barre dell'errore. Con pochi dati vince la gaussiana (due numeri si stimano meglio di una curva intera); da un certo $N$ in poi la barra di Parzen resta sempre la più corta."
