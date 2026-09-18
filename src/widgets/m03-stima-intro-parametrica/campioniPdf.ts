// Logica del widget "Un campione alla volta: la pdf nascosta dietro il sipario" (m03, concetti c34, c35, c37).
// Niente React qui dentro: le pdf nascoste, il flusso dei pesci sul nastro, l'istogramma normalizzato, la gaussiana
// adattata, la probabilità come area, l'errore quadratico integrato e i tempi dello storyboard. Il widget disegna
// questi numeri e nient'altro: ciò che si vede e ciò che i test controllano sono gli stessi conti.
import type { Rng } from '../../content/types'
import { fishDataset } from '../../lib/datasets/fish'
import { ise } from '../../lib/ml/nonparam'
import { gammaPdf, histogram, linspace, mean, normalCdf, normalPdf, variance } from '../../lib/ml/stats'
import type { HistogramBin } from '../../lib/ml/stats'
import { createRng } from '../../lib/rng'

/** Scala della luminosità misurata dalla telecamera (fishMeta.ranges.luminosita). */
export const DOMAIN: readonly [number, number] = [0, 10]
/** Pesci al massimo sul nastro (inventario: "massimo N = 5000"). */
export const MAX_N = 5000
/** Valori di N offerti dallo slider: fitti dove N è piccolo, radi dove è grande (lo slider è a indici). */
export const N_OPTIONS = [1, 2, 3, 5, 8, 10, 15, 20, 30, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 2000, 3000, MAX_N] as const
export const DEFAULT_N = 200

const SEED = 20260917

// ---------------------------------------------------------------------------------------------
// Le tre pdf nascoste (inventario m03, widget m03-campioni-che-rivelano-la-pdf)
// ---------------------------------------------------------------------------------------------

export const HIDDEN_PDF_IDS = ['unimodale', 'bimodale', 'asimmetrica'] as const
export type HiddenPdfId = (typeof HIDDEN_PDF_IDS)[number]

export interface HiddenPdf {
  id: HiddenPdfId
  label: string
  /** il modello da cui escono i dati, in LaTeX: si mostra solo a sipario alzato */
  tex: string
  /** densità vera sulla scala 0-10 (rinormalizzata: integra a 1 sulla scala, 0 fuori) */
  pdf: (x: number) => number
  /** massimo della densità sulla scala: serve a fissare l'asse verticale */
  peak: number
}

interface Model {
  label: string
  tex: string
  raw: (x: number) => number
  draw: (rng: Rng) => number
}

const MODELS: Record<HiddenPdfId, Model> = {
  unimodale: {
    label: 'Unimodale',
    tex: '\\mathcal{N}(3.1,\\ 1.0^2)',
    raw: (x) => normalPdf(x, 3.1, 1.0),
    draw: (rng) => rng.normal(3.1, 1.0),
  },
  bimodale: {
    label: 'Bimodale',
    tex: '\\tfrac{1}{2}\\,\\mathcal{N}(3.1,\\ 0.8^2) + \\tfrac{1}{2}\\,\\mathcal{N}(6.5,\\ 0.9^2)',
    raw: (x) => 0.5 * normalPdf(x, 3.1, 0.8) + 0.5 * normalPdf(x, 6.5, 0.9),
    draw: (rng) => (rng.next() < 0.5 ? rng.normal(3.1, 0.8) : rng.normal(6.5, 0.9)),
  },
  asimmetrica: {
    label: 'Asimmetrica',
    tex: '\\text{Gamma}(k = 3,\\ \\theta = 1)',
    raw: (x) => gammaPdf(x, 3, 1),
    // Gamma di forma intera: somma di tre esponenziali di scala 1. 1 − u sta in (0, 1]: il logaritmo resta finito
    draw: (rng) => -Math.log((1 - rng.next()) * (1 - rng.next()) * (1 - rng.next())),
  },
}

/** Integrale di f su [a, b] con la regola di Simpson su `intervals` intervalli (pari). */
function simpson(f: (x: number) => number, a: number, b: number, intervals: number): number {
  const m = Math.max(2, intervals + (intervals % 2))
  const h = (b - a) / m
  let s = f(a) + f(b)
  for (let i = 1; i < m; i++) s += (i % 2 === 1 ? 4 : 2) * f(a + i * h)
  return (s * h) / 3
}

const pdfCache = new Map<HiddenPdfId, HiddenPdf>()

/**
 * La pdf nascosta `id`, ristretta alla scala 0-10 della telecamera: la parte di massa che cadrebbe fuori (meno
 * dell'1%) viene redistribuita rinormalizzando, come fa il campionamento a rigetto di `fishStream`. Così la densità
 * disegnata è davvero quella da cui escono i campioni e l'area sotto di essa sulla scala è 1.
 */
export function hiddenPdf(id: HiddenPdfId): HiddenPdf {
  const hit = pdfCache.get(id)
  if (hit !== undefined) return hit
  const model = MODELS[id]
  const [lo, hi] = DOMAIN
  const mass = simpson(model.raw, lo, hi, 4000)
  const pdf = (x: number) => (x >= lo && x <= hi ? model.raw(x) / mass : 0)
  const peak = linspace(lo, hi, 2001).reduce((m, x) => Math.max(m, pdf(x)), 0)
  const out: HiddenPdf = { id, label: model.label, tex: model.tex, pdf, peak }
  pdfCache.set(id, out)
  return out
}

// ---------------------------------------------------------------------------------------------
// Il nastro: i pesci misurati uno dopo l'altro
// ---------------------------------------------------------------------------------------------

/** Un pesce misurato: il vettore delle feature x = (x₁, x₂, x₃) = (luminosità, larghezza, lunghezza). */
export interface FishReading {
  /** x₁, luminosità sulla scala 0-10: esce dalla pdf nascosta */
  lum: number
  /** x₂, larghezza in cm: dal modello dei salmoni del cast (src/lib/datasets/fish.ts) */
  larghezza: number
  /** x₃, lunghezza in cm: idem */
  lunghezza: number
}

const streamCache = new Map<HiddenPdfId, FishReading[]>()

/**
 * I primi `n` pesci del nastro per la pdf `id`: sempre gli stessi (RNG a seed), e i primi n di un flusso lungo sono il
 * flusso corto, così cambiare N aggiunge o toglie pesci in coda senza rimescolare quelli già caduti. Campioni iid:
 * ogni luminosità è un'estrazione indipendente dalla stessa pdf.
 */
export function fishStream(id: HiddenPdfId, n: number = MAX_N): FishReading[] {
  let stream = streamCache.get(id)
  if (stream === undefined) {
    const index = HIDDEN_PDF_IDS.indexOf(id)
    const rng = createRng(SEED + 101 * (index + 1))
    const model = MODELS[id]
    const [lo, hi] = DOMAIN
    // larghezza e lunghezza vengono dal dataset del cast: salmoni (pSalmone = 1), stesse per le tre pdf
    const sizes = fishDataset(createRng(SEED), { n: MAX_N, pSalmone: 1, features: ['larghezza', 'lunghezza'] })
    stream = sizes.map((s) => {
      // campionamento a rigetto: una lettura fuori scala si ripete
      let lum = model.draw(rng)
      while (!(lum >= lo && lum <= hi)) lum = model.draw(rng)
      return { lum, larghezza: s.x[0], lunghezza: s.x[1] }
    })
    streamCache.set(id, stream)
  }
  return stream.slice(0, Math.max(0, Math.min(n, MAX_N)))
}

// ---------------------------------------------------------------------------------------------
// Istogramma normalizzato: p̂(x) = (K/N) / V, con V = Δ la larghezza del bin
// ---------------------------------------------------------------------------------------------

/**
 * Bin di larghezza `width` a partire da 0, tanti quanti ne servono a coprire la scala. Se 10 non è un multiplo della
 * larghezza l'ultimo bin sborda oltre 10: meglio di un bin più stretto degli altri, che avrebbe un altro V.
 */
export function binLayout(width: number): { bins: number; domain: [number, number] } {
  const [lo, hi] = DOMAIN
  const bins = Math.max(1, Math.ceil((hi - lo) / width - 1e-9))
  return { bins, domain: [lo, lo + bins * width] }
}

/** Istogramma normalizzato dei valori: stessa funzione (`histogram`) e stessi bin della primitiva Histogram. */
export function histogramCells(values: readonly number[], width: number): HistogramBin[] {
  const { bins, domain } = binLayout(width)
  return histogram(values, bins, domain)
}

/** p̂(x) dell'istogramma: la densità del bin che contiene x, 0 fuori dai bin. */
export function cellsDensityAt(cells: readonly HistogramBin[], x: number): number {
  if (cells.length === 0) return 0
  const lo = cells[0].x0
  const hi = cells[cells.length - 1].x1
  if (!(x >= lo && x <= hi)) return 0
  const w = (hi - lo) / cells.length
  return cells[Math.min(cells.length - 1, Math.floor((x - lo) / w))].density
}

/** ∫ₐᵇ p̂(x) dx dell'istogramma, esatto: somma delle densità per la parte di ogni bin che cade in [a, b]. */
export function cellsIntegral(cells: readonly HistogramBin[], a: number, b: number): number {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  let s = 0
  for (const c of cells) {
    const overlap = Math.min(hi, c.x1) - Math.max(lo, c.x0)
    if (overlap > 0) s += c.density * overlap
  }
  return s
}

/** Contorno a gradini dell'istogramma, [x, p̂] da unire con segmenti: serve all'area colorata fra a e b. */
export function cellsCurve(cells: readonly HistogramBin[]): [number, number][] {
  if (cells.length === 0) return []
  const out: [number, number][] = [[cells[0].x0, 0]]
  for (const c of cells) out.push([c.x0, c.density], [c.x1, c.density])
  out.push([cells[cells.length - 1].x1, 0])
  return out
}

// ---------------------------------------------------------------------------------------------
// Gaussiana adattata: la stima parametrica p(x | θ̂), θ̂ = (μ̂, σ̂²)
// ---------------------------------------------------------------------------------------------

export interface GaussFit {
  mu: number
  sigma: number
}

/**
 * Media e deviazione standard campionarie, con 1/N (la stima a massima verosimiglianza che si vedrà nel modulo m05).
 * Con meno di due campioni, o tutti uguali, la gaussiana non esiste (σ̂ = 0): null.
 */
export function fitGaussian(values: readonly number[]): GaussFit | null {
  if (values.length < 2) return null
  const sigma = Math.sqrt(variance(values))
  if (!(sigma > 1e-9)) return null
  return { mu: mean(values), sigma }
}

/** ∫ₐᵇ p(x | θ̂) dx con la cdf normale. */
export function gaussIntegral(fit: GaussFit, a: number, b: number): number {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return normalCdf(hi, fit.mu, fit.sigma) - normalCdf(lo, fit.mu, fit.sigma)
}

// ---------------------------------------------------------------------------------------------
// Probabilità come area: P{a ≤ x ≤ b} = ∫ₐᵇ p(x) dx
// ---------------------------------------------------------------------------------------------

/** ∫ₐᵇ p(x) dx con Simpson (passo al più 0.0125): errore ben sotto il millesimo mostrato. a > b: stesso valore. */
export function intervalProbability(pdf: (x: number) => number, a: number, b: number): number {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  if (!(hi > lo)) return 0
  return simpson(pdf, lo, hi, 2 * Math.ceil((hi - lo) / 0.025))
}

/** K_ab: quanti campioni cadono in [a, b], estremi compresi. */
export function countInside(values: readonly number[], a: number, b: number): number {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  let k = 0
  for (const v of values) if (v >= lo && v <= hi) k++
  return k
}

// ---------------------------------------------------------------------------------------------
// Quanto la stima è vicina alla pdf vera: ISE = ∫ (p̂(x) − p(x))² dx
// ---------------------------------------------------------------------------------------------

/** Griglia dell'errore: 400 punti sulla scala (inventario). */
export const ISE_GRID: readonly number[] = linspace(DOMAIN[0], DOMAIN[1], 400)

export function iseOf(estimate: (x: number) => number, pdf: (x: number) => number): number {
  return ise(ISE_GRID, ISE_GRID.map(estimate), ISE_GRID.map(pdf))
}

export const ESTIMATE_KINDS = ['istogramma', 'gaussiana'] as const
export type EstimateKind = (typeof ESTIMATE_KINDS)[number]

/** La stima p̂(x) costruita sui campioni: istogramma normalizzato o gaussiana adattata. null se non esiste ancora. */
export function estimator(values: readonly number[], kind: EstimateKind, width: number): ((x: number) => number) | null {
  if (values.length === 0) return null
  if (kind === 'istogramma') {
    const cells = histogramCells(values, width)
    return (x) => cellsDensityAt(cells, x)
  }
  const fit = fitGaussian(values)
  return fit === null ? null : (x) => normalPdf(x, fit.mu, fit.sigma)
}

/** ISE della stima costruita sui primi n campioni, per ogni n: la curva "errore in funzione di N". NaN se la stima non esiste. */
export function iseCurve(lums: readonly number[], pdf: (x: number) => number, kind: EstimateKind, width: number, ns: readonly number[]): { n: number; ise: number }[] {
  return ns.map((n) => {
    const est = estimator(lums.slice(0, n), kind, width)
    return { n, ise: est === null ? Number.NaN : iseOf(est, pdf) }
  })
}

// ---------------------------------------------------------------------------------------------
// La tua ipotesi: una pdf disegnata a mano con 11 punti di controllo (inventario, "modalità disegno")
// ---------------------------------------------------------------------------------------------

/** Ascisse dei punti di controllo: uno per ogni unità della scala. */
export const HYP_XS: readonly number[] = linspace(DOMAIN[0], DOMAIN[1], 11)
/** Partenza: la pdf uniforme sulla scala, altezza 1/10, area 1. */
export const HYP_START: readonly number[] = HYP_XS.map(() => 0.1)

/** Area sotto la spezzata dei punti di controllo (trapezi esatti: la curva è lineare a tratti). */
export function hypothesisArea(heights: readonly number[]): number {
  let s = 0
  for (let i = 1; i < HYP_XS.length; i++) s += ((HYP_XS[i] - HYP_XS[i - 1]) * ((heights[i] ?? 0) + (heights[i - 1] ?? 0))) / 2
  return s
}

/** Altezze riscalate perché l'area sia 1: una pdf deve integrare a 1. Tutta a zero: torna uniforme. */
export function normalizeHypothesis(heights: readonly number[]): number[] {
  const area = hypothesisArea(heights)
  if (!(area > 0)) return [...HYP_START]
  return heights.map((h) => Number((h / area).toFixed(6)))
}

/** La pdf dell'ipotesi: la spezzata, già rinormalizzata ad area 1; 0 fuori dalla scala. */
export function hypothesisPdf(heights: readonly number[]): (x: number) => number {
  const norm = hypothesisArea(heights) > 0 ? normalizeHypothesis(heights) : [...HYP_START]
  const [lo, hi] = DOMAIN
  const step = (hi - lo) / (HYP_XS.length - 1)
  return (x) => {
    if (!(x >= lo && x <= hi)) return 0
    const i = Math.min(HYP_XS.length - 2, Math.floor((x - lo) / step))
    const t = (x - HYP_XS[i]) / step
    return norm[i] + (norm[i + 1] - norm[i]) * t
  }
}

// ---------------------------------------------------------------------------------------------
// Storyboard: i passi e il ritmo con cui cadono i campioni
// ---------------------------------------------------------------------------------------------

export const STEP = { sipario: 0, primo: 1, campione: 2, svela: 3, area: 4 } as const

/**
 * Il primo pesce, in frazioni del suo passo: arriva sotto la telecamera, viene misurato (la scheda mostra x₁),
 * la lettura scorre sulla scala fino alla sua luminosità e cade nel suo bin.
 */
export const FIRST = { arrive: 0.3, measure: 0.38, slideStart: 0.42, fallStart: 0.62, land: 0.9 } as const

/** Pochi pesci arrivano a ritmo costante e si seguono uno per uno; da 10 in su è una raffica di al più 5.2 s. */
export function streamDurationMs(n: number): number {
  return Math.min(Math.max(600 * (n - 1), 800), 5200)
}

const accelerates = (n: number) => n > 10
/** Frazione dei campioni (dopo il primo) atterrati al progresso p: lineare per pochi pesci, poi accelera. */
const share = (p: number, n: number) => (accelerates(n) ? p ** 1.5 : p)

/** Progresso del passo 3 in cui atterra il campione i (da 1): il primo è già atterrato al passo 2. */
export function landingProgress(i: number, n: number): number {
  if (i <= 1 || n <= 1) return 0
  const u = Math.min(1, (i - 1) / (n - 1))
  return accelerates(n) ? u ** (2 / 3) : u
}

/** Quanti campioni sono atterrati (sono in X e nell'istogramma) al passo `index` con progresso `progress`. */
export function landedAt(index: number, progress: number, n: number): number {
  if (n <= 0 || index <= STEP.sipario) return 0
  if (index === STEP.primo) return progress >= FIRST.land ? 1 : 0
  if (index >= STEP.svela) return n
  if (n === 1) return 1
  return Math.min(n, 1 + Math.floor((n - 1) * share(Math.min(Math.max(progress, 0), 1), n) + 1e-9))
}

/** Un campione in caduta: k è il suo indice (da 1), t il tempo della caduta da 0 (parte) a 1 (atterra). */
export interface Flight {
  k: number
  t: number
}

/**
 * I campioni in volo al progresso p del passo 3: quelli che atterreranno entro `fallP` (durata della caduta, in
 * frazioni del passo). Se sono più di `max` se ne disegna uno ogni tanti: nella raffica conta il gesto, non il conto.
 */
export function flightsAt(p: number, n: number, fallP: number, max = 80): Flight[] {
  if (p >= 1 || n <= 1 || !(fallP > 0)) return []
  const landed = landedAt(STEP.campione, p, n)
  const last = landedAt(STEP.campione, Math.min(1, p + fallP), n)
  const count = last - landed
  if (count <= 0) return []
  const stride = Math.ceil(count / max)
  const out: Flight[] = []
  for (let k = landed + 1; k <= last; k += stride) {
    const t = 1 - (landingProgress(k, n) - p) / fallP
    out.push({ k, t: Math.min(Math.max(t, 0), 0.999) })
  }
  return out
}

// ---------------------------------------------------------------------------------------------
// Maniglie a, b e sfida
// ---------------------------------------------------------------------------------------------

/** Distanza minima fra a e b: l'intervallo non si chiude mai del tutto (è anche il passo da tastiera). */
export const HANDLE_GAP = 0.05

const tidy = (v: number) => Number(v.toFixed(10))

/** Nuovi estremi dopo aver spostato la maniglia `which` in `value`: dentro la scala e con a < b. */
export function moveHandle(which: 'a' | 'b', value: number, a: number, b: number): { a: number; b: number } {
  const [lo, hi] = DOMAIN
  if (which === 'a') return { a: tidy(Math.min(Math.max(value, lo), b - HANDLE_GAP)), b }
  return { a, b: tidy(Math.max(Math.min(value, hi), a + HANDLE_GAP)) }
}

/** Sfida: P{a ≤ x ≤ b} = 0.50 con tolleranza 0.01. */
export const CHALLENGE = { target: 0.5, tolerance: 0.01 } as const

export function challengeMet(p: number): boolean {
  return Number.isFinite(p) && Math.abs(p - CHALLENGE.target) <= CHALLENGE.tolerance + 1e-9
}

// ---------------------------------------------------------------------------------------------
// Store dei fotogrammi
// ---------------------------------------------------------------------------------------------

export interface FrameState {
  index: number
  progress: number
}

/**
 * Il canale fra lo storyboard (onFrame, fuori da React) e le sole parti del widget che si muovono a ogni fotogramma
 * (terreno, formule, letture). I comandi non lo leggono e non si ridisegnano durante la riproduzione.
 */
export function createFrameStore() {
  let state: FrameState = { index: 0, progress: 0 }
  const listeners = new Set<() => void>()
  return {
    set(progress: number, index: number) {
      if (state.progress === progress && state.index === index) return
      state = { index, progress }
      for (const listener of [...listeners]) listener()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    get: (): FrameState => state,
  }
}
export type FrameStore = ReturnType<typeof createFrameStore>
