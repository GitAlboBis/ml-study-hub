// Widget di riferimento n. 1 (Task 4.7): "Un campione alla volta: la pdf nascosta dietro il sipario".
// Foglio m03, concetti c34 (vettore delle feature x con pdf incognita p(x)), c35 (insieme di training X di N campioni
// iid), c37 (obiettivo: una stima p̂(x) il più vicina possibile a p(x)); in più la probabilità come area,
// P{a ≤ x ≤ b} = ∫ₐᵇ p(x) dx, chiesta dalla specifica del piano.
//
//   ┌ margine alto: il nastro ───────────────────────────────────────────────┐
//   │ [telecamera]                                       x₃₇ = (3.42, 17.2, 41.0) │
//   │ ○══ pesci che scorrono ══════════════════════════════════════════○ │
//   │ ─┬──┬──┬──┬── scala della luminosità: la lettura scorre fin qui, poi cade    │
//   ├ terreno ───────────────────────────────────────────────────────────┤
//   │ sipario tratteggiato (p(x) incognita) dietro a tutto                         │
//   │ istogramma normalizzato p̂(x) = (K/N)/V, campioni che cadono, tappeto dei x_k │
//   │ area ocra fra le maniglie a e b, pdf vera tratteggiata quando il sipario sale │
//   └───────────────────────────────────────────────────────────────────┘
//
// MOTO. Lo storyboard (Play, Pausa, Passo, Velocità, Reset) fa scorrere il tempo; il terreno lo legge da uno store
// dei fotogrammi (campioniPdf.ts) invece che da sb.progress, così a ogni fotogramma si ridisegnano solo terreno,
// formule e letture, non i comandi. Durate: pesce sul nastro e lettura 2.6 s (una volta sola, è la spiegazione);
// caduta di un campione 420 ms con accelerazione di gravità (ease-in: è fisica, non interfaccia); sipario 800 ms
// ease-in-out (si muove sullo schermo). Nessuna animazione sui comandi, che si usano spesso e da tastiera. Con
// prefers-reduced-motion ogni passo mostra subito il suo stato finale: niente cadute, il sipario è su o giù.
//
// COLORI. Solo token: ruoli --viz-* per i segni, spillo ocra per a, b e l'area evidenziata, inchiostro per i campioni.
// La tinta dei pesci è un color-mix di due token scelti per tema, perché un pesce chiaro deve sembrare chiaro anche
// di notte.
import { createContext, memo, useCallback, useContext, useId, useMemo, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { M } from '../../components/content/M'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { LiveFormula } from '../kit/LiveFormula'
import { PlayControls } from '../kit/PlayControls'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { Toggle } from '../kit/Toggle'
import { useReducedMotion } from '../kit/useReducedMotion'
import { useSettled } from '../kit/useSettled'
import { useStoryboard } from '../kit/useStoryboard'
import type { StoryboardStep } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { AreaPath } from '../kit/plot/AreaPath'
import { Axis } from '../kit/plot/Axis'
import { useThemeVersion } from '../kit/plot/colors'
import { Dots } from '../kit/plot/Dots'
import { Grid } from '../kit/plot/Grid'
import { Histogram } from '../kit/plot/Histogram'
import { LinePath } from '../kit/plot/LinePath'
import { Plot, usePlot } from '../kit/plot/Plot'
import { linspace, normalPdf } from '../../lib/ml/stats'
import type { HistogramBin } from '../../lib/ml/stats'
import type { WidgetMeta } from '../types'
import {
  binLayout,
  cellsCurve,
  cellsDensityAt,
  cellsIntegral,
  challengeMet,
  countInside,
  createFrameStore,
  DEFAULT_N,
  DOMAIN,
  FIRST,
  fishStream,
  fitGaussian,
  flightsAt,
  gaussIntegral,
  hiddenPdf,
  HIDDEN_PDF_IDS,
  histogramCells,
  HYP_START,
  HYP_XS,
  hypothesisArea,
  hypothesisPdf,
  normalizeHypothesis,
  intervalProbability,
  iseCurve,
  iseOf,
  landedAt,
  moveHandle,
  N_OPTIONS,
  STEP,
  streamDurationMs,
} from './campioniPdf'
import type { EstimateKind, FishReading, FrameStore, GaussFit, HiddenPdf, HiddenPdfId } from './campioniPdf'

// oxlint-disable-next-line react/only-export-components -- `meta` è parte del contratto dei file *.widget.tsx (src/widgets/types.ts)
export const meta: WidgetMeta = {
  id: 'm03-campioni-che-rivelano-la-pdf',
  moduleId: 'm03-stima-intro-parametrica',
  title: 'Un campione alla volta: la pdf nascosta dietro il sipario',
  concepts: ['c34', 'c35', 'c37'],
  scenario: 'pesce',
  scenarioNote: 'Salmoni sul nastro: la telecamera ne misura la luminosità',
  size: 'L',
}

// ---------------------------------------------------------------------------------------------
// Storyboard
// ---------------------------------------------------------------------------------------------

const STEP_TEXT: readonly { id: string; label: string; text: string }[] = [
  {
    id: 'sipario',
    label: 'La pdf è nascosta',
    text: 'La luminosità dei salmoni ha una pdf vera $p(\\mathbf{x})$ che nessuno conosce (*unknown pdf*): sta dietro il sipario. Possiamo solo misurare i pesci che passano sul nastro. Premi Play.',
  },
  {
    id: 'primo',
    label: 'Un pesce, un vettore di feature',
    text: 'La telecamera misura il pesce: ogni osservazione è un vettore di $n$ feature $\\mathbf{x} = (x_1, x_2, \\dots, x_n)$ (*feature vector*): luminosità, larghezza, lunghezza. La stima qui usa solo $x_1$, la luminosità: il valore scorre sulla scala e cade nel suo bin.',
  },
  {
    id: 'campione',
    label: 'N campioni iid',
    text: 'Arrivano gli altri pesci: $\\mathbf{X} = \\{\\mathbf{x}_1, \\dots, \\mathbf{x}_N\\}$ sono $N$ campioni indipendenti e identicamente distribuiti (*iid*), i campioni di training (*training samples*). Attenzione agli indici: $n$ conta le feature, $N$ i campioni. L’istogramma è normalizzato, $\\hat p(x) = \\frac{K/N}{V}$ con $V$ la larghezza del bin: la sua area resta 1, quindi con $N$ grande le barre si assestano invece di crescere.',
  },
  {
    id: 'svela',
    label: 'Si alza il sipario',
    text: 'La curva tratteggiata è la pdf vera $p(x)$. L’obiettivo (*objective*) è una stima $\\hat p(\\mathbf{x})$ costruita sui soli campioni $\\mathbf{X}$ e il più vicina possibile (*as close as possible*) a $p(\\mathbf{x})$. È una funzione dei campioni, $\\hat p(\\mathbf{x}) = \\hat p(\\mathbf{x};\\,\\mathbf{X})$: con un altro giorno di pesca cambia.',
  },
  {
    id: 'area',
    label: 'La probabilità è un’area',
    text: 'La probabilità che la luminosità di un salmone cada fra $a$ e $b$ è l’area sotto la pdf: $P\\{a \\le x \\le b\\} = \\int_a^b p(x)\\,dx$, e sulla scala intera vale 1. Senza la pdf vera la stimi dai dati: $\\int_a^b \\hat p(x)\\,dx \\approx K_{ab}/N$, la frazione di campioni caduti fra $a$ e $b$. Trascina le maniglie.',
  },
]

const FIXED_MS = [1400, 2600, 0, 1600, 1800] as const

function stepsFor(n: number): StoryboardStep[] {
  return STEP_TEXT.map((s, i) => ({ id: s.id, label: s.label, durationMs: i === STEP.campione ? streamDurationMs(n) : FIXED_MS[i] }))
}

/** Caduta di un campione nella raffica (ms): si vede il gesto anche a 2×. */
const FALL_MS = 420

// ---------------------------------------------------------------------------------------------
// Stato vivo condiviso: calcolato una volta per fotogramma, letto da terreno, formule e letture
// ---------------------------------------------------------------------------------------------

interface Config {
  pdfId: HiddenPdfId
  n: number
  binW: number
  kind: EstimateKind
  nFeat: number
  a: number
  b: number
  revealed: boolean
  /** modalità "la tua ipotesi": 11 punti di controllo da trascinare */
  drawing: boolean
  hyp: readonly number[]
}

interface Live extends Config {
  index: number
  progress: number
  /** campioni atterrati: sono in X e nell'istogramma */
  landed: number
  stream: readonly FishReading[]
  lums: readonly number[]
  truth: HiddenPdf
  cells: HistogramBin[]
  fit: GaussFit | null
  /** p̂(x) scelta (istogramma o gaussiana adattata); null se non esiste ancora */
  estimate: ((x: number) => number) | null
  /** P{a ≤ x ≤ b} = ∫ₐᵇ p(x) dx sotto la pdf vera */
  pTrue: number
  /** ∫ₐᵇ p̂(x) dx sotto la stima */
  pHat: number
  /** K_ab, campioni dentro [a, b] */
  kIn: number
  /** errore quadratico integrato della stima */
  iseValue: number
  /** area sotto la spezzata disegnata (prima di rinormalizzare) */
  hypArea: number
  /** ISE dell'ipotesi rinormalizzata ad area 1 */
  hypIse: number
}

const LiveCtx = createContext<Live | null>(null)

function useLive(): Live {
  const live = useContext(LiveCtx)
  if (live === null) throw new Error('useLive: fuori dal LiveProvider del widget')
  return live
}

/**
 * Si iscrive allo store dei fotogrammi e calcola i numeri del fotogramma. I figli (il WidgetFrame intero) arrivano
 * dal genitore come elemento già fatto: a ogni fotogramma React non li ridisegna, aggiorna solo chi legge LiveCtx.
 */
function LiveProvider({ frames, cfg, children }: { frames: FrameStore; cfg: Config; children: ReactNode }) {
  const { index, progress } = useSyncExternalStore(frames.subscribe, frames.get, frames.get)
  const { pdfId, n, binW, kind, a, b } = cfg
  const landed = landedAt(index, progress, n)
  const stream = useMemo(() => fishStream(pdfId), [pdfId])
  const lums = useMemo(() => stream.slice(0, landed).map((f) => f.lum), [stream, landed])
  const truth = hiddenPdf(pdfId)
  const cells = useMemo(() => histogramCells(lums, binW), [lums, binW])
  const fit = useMemo(() => fitGaussian(lums), [lums])
  const estimate = useMemo<((x: number) => number) | null>(() => {
    if (lums.length === 0) return null
    if (kind === 'istogramma') return (x) => cellsDensityAt(cells, x)
    return fit === null ? null : (x) => normalPdf(x, fit.mu, fit.sigma)
  }, [lums, kind, cells, fit])
  const pTrue = useMemo(() => intervalProbability(truth.pdf, a, b), [truth, a, b])
  const pHat = estimate === null ? Number.NaN : kind === 'istogramma' ? cellsIntegral(cells, a, b) : fit === null ? Number.NaN : gaussIntegral(fit, a, b)
  const kIn = useMemo(() => countInside(lums, a, b), [lums, a, b])
  const iseValue = useMemo(() => (estimate === null ? Number.NaN : iseOf(estimate, truth.pdf)), [estimate, truth])
  const { hyp } = cfg
  const hypArea = useMemo(() => hypothesisArea(hyp), [hyp])
  const hypIse = useMemo(() => iseOf(hypothesisPdf(hyp), truth.pdf), [hyp, truth])

  const value = useMemo<Live>(
    () => ({ ...cfg, index, progress, landed, stream, lums, truth, cells, fit, estimate, pTrue, pHat, kIn, iseValue, hypArea, hypIse }),
    [cfg, index, progress, landed, stream, lums, truth, cells, fit, estimate, pTrue, pHat, kIn, iseValue, hypArea, hypIse],
  )
  return <LiveCtx.Provider value={value}>{children}</LiveCtx.Provider>
}

// ---------------------------------------------------------------------------------------------
// Piccoli attrezzi
// ---------------------------------------------------------------------------------------------

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  )
}

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** come --ease-out dei token */
const easeOut = (t: number) => 1 - (1 - t) ** 3
/** come --ease-in-out dei token: ciò che si sposta sullo schermo parte e arriva piano */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
/** caduta libera: la quota scende con il quadrato del tempo */
const gravity = (t: number) => t * t

const f2 = fixed(2)
const f3 = fixed(3)
const f4 = fixed(4)
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const
const CURTAIN_S = 0.8

/** Tetto dell'asse verticale: la gobba più alta con un margine per l'istogramma che oscilla. */
const yMaxFor = (pdf: HiddenPdf) => Math.ceil((pdf.peak * 1.55) / 0.05) * 0.05

/** Luminosità (0-10) → tinta del pesce: chiaro è chiaro in tutti e due i temi. Solo token. */
function fishFill(lum: number, night: boolean): string {
  const light = Math.round(clamp01(lum / 10) * 100)
  return night ? `color-mix(in oklab, var(--text) ${light}%, var(--bg))` : `color-mix(in oklab, var(--surface) ${light}%, var(--text))`
}

/** Pesce di profilo, testa a destra, lungo 26 px: corpo a fuso e coda a V. */
const FISH_PATH = 'M-7,0C-3,-6 7,-6 13,0C7,6 -3,6 -7,0ZM-7,0L-13,-5L-13,5Z'

// ---------------------------------------------------------------------------------------------
// Il nastro (margine alto del grafico)
// ---------------------------------------------------------------------------------------------

interface BeltGeometry {
  x0: number
  x1: number
  beltY: number
  railY: number
  sensorX: number
  cardY: number
}

function beltGeometry(marginTop: number, marginLeft: number, marginRight: number, innerWidth: number, narrow: boolean): BeltGeometry {
  const x0 = -marginLeft + 2
  const x1 = innerWidth + marginRight - 2
  const beltY = -marginTop + (narrow ? 38 : 46)
  return { x0, x1, beltY, railY: beltY + 7 + (narrow ? 11 : 14), sensorX: x0 + (x1 - x0) * 0.2, cardY: -marginTop + 14 }
}

interface BeltProps {
  geo: BeltGeometry
  fish: readonly { x: number; lum: number; key: string }[]
  beam: number
  tread: number
  card: { k: number; reading: FishReading | null }
  nFeat: number
  narrow: boolean
  night: boolean
}

function Belt({ geo, fish, beam, tread, card, nFeat, narrow, night }: BeltProps) {
  const { x0, x1, beltY, sensorX, cardY } = geo
  const { innerWidth, x } = usePlot()
  const r = card.reading
  const parts = r === null ? [] : [f2(r.lum), r.larghezza.toFixed(1), r.lunghezza.toFixed(1)].slice(0, nFeat)
  return (
    <g data-belt="" aria-hidden="true" pointerEvents="none">
      {/* scala della luminosità su cui scorre la lettura: le stesse tacche intere dell'asse sotto */}
      <line x1={0} x2={innerWidth} y1={geo.railY} y2={geo.railY} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
      {linspace(DOMAIN[0], DOMAIN[1], 11).map((t) => (
        <line key={t} x1={x(t)} x2={x(t)} y1={geo.railY} y2={geo.railY + (t % 5 === 0 ? 5 : 3)} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
      ))}

      {/* nastro: due rulli, due fili, il battistrada che scorre con i pesci */}
      <line x1={x0 + 6} x2={x1 - 6} y1={beltY} y2={beltY} stroke="var(--border-strong)" strokeWidth={1.5} />
      <line x1={x0 + 6} x2={x1 - 6} y1={beltY + 7} y2={beltY + 7} stroke="var(--border-strong)" strokeWidth={1.5} />
      <line x1={x0 + 6} x2={x1 - 6} y1={beltY + 3.5} y2={beltY + 3.5} stroke="var(--border)" strokeWidth={3} strokeDasharray="2 10" strokeDashoffset={-tread} />
      {[x0 + 6, x1 - 6].map((cx) => (
        <circle key={cx} cx={cx} cy={beltY + 3.5} r={4.5} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={1.5} />
      ))}

      {fish.map((f) => (
        <path key={f.key} d={FISH_PATH} transform={`translate(${f.x},${beltY - 6.5})`} fill={fishFill(f.lum, night)} stroke="var(--border-strong)" strokeWidth={1} strokeLinejoin="round" />
      ))}

      {/* telecamera con il fascio che misura */}
      <line x1={sensorX} x2={sensorX} y1={beltY - 20} y2={beltY - 1} stroke="var(--viz-boundary)" strokeWidth={1.5} strokeDasharray="2 2" opacity={beam} />
      <rect x={sensorX - 11} y={beltY - 34} width={22} height={11} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={1.5} />
      <rect x={sensorX - 4} y={beltY - 23} width={8} height={3} fill="var(--border-strong)" />
      {!narrow && (
        <text x={sensorX + 17} y={beltY - 25} className="label" fontSize={11} fill="var(--text-muted)">
          telecamera
        </text>
      )}

      {/* scheda del pesce misurato: il vettore delle feature */}
      <text x={x1 - 2} y={cardY} textAnchor="end" className="num" fontSize={13} fill="var(--text)">
        <tspan fontWeight={700}>x</tspan>
        {card.k > 0 && (
          <tspan fontSize={10} dy={3}>
            {card.k}
          </tspan>
        )}
        <tspan dy={card.k > 0 ? -3 : 0}>{r === null ? ' = ( · )' : ` = (${parts.join(', ')})`}</tspan>
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------------------------
// Il terreno
// ---------------------------------------------------------------------------------------------

interface TerrainProps {
  onHandle: (id: string, x: number) => void
  onProbe: (x: number | null) => void
  onHyp: (id: string, y: number) => void
}

const Terrain = memo(function Terrain({ onHandle, onProbe, onHyp }: TerrainProps) {
  const live = useLive()
  const narrow = !useMediaQuery('(min-width: 40rem)')
  const margin = narrow ? { top: 66, right: 10, bottom: 40, left: 42 } : { top: 80, right: 16, bottom: 44, left: 50 }
  const yMax = yMaxFor(live.truth)
  const description =
    `Istogramma normalizzato della luminosità di ${live.landed} salmoni sulla scala da 0 a 10` +
    (live.revealed ? `, con la pdf vera ${live.truth.label.toLowerCase()} tratteggiata` : ', con la pdf vera nascosta dietro il sipario') +
    `. Intervallo evidenziato da a = ${f2(live.a)} a b = ${f2(live.b)}: ${live.kIn} campioni dentro.`

  const cursorFormat = (x: number) => {
    const est = live.estimate === null ? '—' : f3(live.estimate(x))
    return `x = ${f2(x)} · p̂ = ${est}${live.revealed ? ` · p = ${f3(live.truth.pdf(x))}` : ''}`
  }

  return (
    <div className="absolute inset-0">
      <Plot
        fill
        width={narrow ? 320 : 800}
        height={narrow ? 320 : 500}
        xDomain={DOMAIN}
        yDomain={[0, yMax]}
        margin={margin}
        ariaLabel="Nastro dei salmoni e istogramma della luminosità misurata"
        description={description}
        cursor="x"
        cursorFormat={cursorFormat}
        onCursor={(pt) => onProbe(pt === null ? null : pt.x)}
      >
        <TerrainMarks live={live} yMax={yMax} narrow={narrow} onHandle={onHandle} onHyp={onHyp} />
      </Plot>
    </div>
  )
})

function TerrainMarks({ live, yMax, narrow, onHandle, onHyp }: { live: Live; yMax: number; narrow: boolean } & Pick<TerrainProps, 'onHandle' | 'onHyp'>) {
  const { x, y, innerWidth, innerHeight, margin, clipPath } = usePlot()
  const reduced = useReducedMotion()
  useThemeVersion()
  const night = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const { index, progress, landed, stream, lums, cells, truth, a, b, kind, revealed, n } = live
  const geo = beltGeometry(margin.top, margin.left, margin.right, innerWidth, narrow)
  const layout = binLayout(live.binW)

  // --- curve ---
  const grid = useMemo(() => linspace(DOMAIN[0], DOMAIN[1], 401), [])
  const truthCurve = useMemo(() => grid.map((v) => [v, truth.pdf(v)]), [grid, truth])
  const fit = live.fit
  const gaussCurve = useMemo(() => (fit === null ? null : grid.map((v) => [v, normalPdf(v, fit.mu, fit.sigma)])), [grid, fit])
  const stepCurve = useMemo(() => cellsCurve(cells), [cells])
  const areaCurve = revealed ? truthCurve : kind === 'gaussiana' ? gaussCurve : lums.length > 0 ? stepCurve : null
  // al passo 5 l'area si stende da a verso b; negli altri passi è già stesa
  const sweep = index === STEP.area ? easeInOut(clamp01(progress / 0.7)) : 1
  const rug = useMemo(() => {
    let d = ''
    for (const v of lums) d += `M${x(v).toFixed(1)},${innerHeight}v-7`
    return d
  }, [lums, x, innerHeight])

  // --- il nastro ---
  const durStream = streamDurationMs(n)
  const fishList: { x: number; lum: number; key: string }[] = []
  let beam = 0.25
  let tread = 0
  let cardK = 0
  const start = geo.x0 + 16
  if (index === STEP.sipario) {
    fishList.push({ x: start, lum: stream[0].lum, key: 'f0' })
  } else if (index === STEP.primo) {
    const p = reduced ? FIRST.measure : progress
    const fx =
      p < FIRST.arrive
        ? lerp(start, geo.sensorX, easeOut(p / FIRST.arrive))
        : p < FIRST.fallStart
          ? geo.sensorX
          : lerp(geo.sensorX, geo.x1 + 30, easeInOut((p - FIRST.fallStart) / (1 - FIRST.fallStart)))
    fishList.push({ x: fx, lum: stream[0].lum, key: 'f0' })
    tread = fx - start
    if (p >= FIRST.arrive && p < FIRST.measure + 0.1) beam = 1
    if (reduced || progress >= FIRST.measure) cardK = 1
  } else {
    // una fila di pesci entra da sinistra; la raffica lunga percorre il nastro più di una volta
    const pp = index === STEP.campione ? progress : 1
    const travel = pp * (geo.x1 - geo.x0) * 1.4 * (durStream / 5200)
    const spacing = 44
    for (let j = 0; j * spacing <= travel + 40; j++) {
      const fx = geo.x0 - 20 + travel - j * spacing
      if (fx > geo.x1 + 20) continue
      fishList.push({ x: fx, lum: stream[(j + 1) % stream.length].lum, key: `t${j}` })
      if (index === STEP.campione && pp < 1 && Math.abs(fx - geo.sensorX) < 7) beam = 1
    }
    tread = travel + geo.x1 + 30 - start
    cardK = index === STEP.campione ? Math.max(1, landed) : n
  }
  const card = { k: cardK, reading: cardK > 0 ? stream[cardK - 1] : null }

  // --- letture in volo ---
  const landY = (lum: number) => y(Math.min(cellsDensityAt(cells, lum), yMax))
  const flying: { key: string; cx: number; cy: number; opacity: number; label?: string }[] = []
  if (!reduced && index === STEP.primo && progress >= FIRST.slideStart && progress < FIRST.land) {
    const lum = stream[0].lum
    if (progress < FIRST.fallStart) {
      const t = easeInOut((progress - FIRST.slideStart) / (FIRST.fallStart - FIRST.slideStart))
      flying.push({ key: 'r1', cx: lerp(geo.sensorX, x(lum), t), cy: geo.railY, opacity: 1, label: f2(lum) })
    } else {
      const t = gravity((progress - FIRST.fallStart) / (FIRST.land - FIRST.fallStart))
      flying.push({ key: 'r1', cx: x(lum), cy: lerp(geo.railY, landY(lum), t), opacity: 1, label: f2(lum) })
    }
  }
  if (!reduced && index === STEP.campione) {
    for (const f of flightsAt(progress, n, Math.min(0.4, FALL_MS / durStream))) {
      const lum = stream[f.k - 1].lum
      flying.push({ key: `k${f.k}`, cx: x(lum), cy: lerp(geo.railY, landY(lum), gravity(f.t)), opacity: Math.min(1, 0.25 + f.t / 0.12) })
    }
  }

  // bin che escono dal tetto dell'asse (N piccolo, bin stretti): una punta di freccia dice "continua"
  const overflow = cells.filter((c) => c.density > yMax)

  const curtainY = revealed ? -innerHeight - 4 : 0
  const curtainTransition = { duration: reduced ? 0 : CURTAIN_S, ease: EASE_IN_OUT }
  const hatchId = `${uid}-hatch`
  const revealId = `${uid}-reveal`

  return (
    <>
      <Belt geo={geo} fish={fishList} beam={beam} tread={tread} card={card} nFeat={live.nFeat} narrow={narrow} night={night} />
      <Grid axis="y" />

      {/* il sipario: un telo tratteggiato dietro i dati; alzandosi scopre la pdf vera */}
      <g clipPath={clipPath} aria-hidden="true" pointerEvents="none">
        <defs>
          <pattern id={hatchId} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={8} stroke="var(--border)" strokeWidth={1.5} />
          </pattern>
        </defs>
        <motion.g initial={false} animate={{ y: curtainY }} transition={curtainTransition}>
          <rect x={0} y={0} width={innerWidth} height={innerHeight} fill="var(--surface-2)" />
          <rect x={0} y={0} width={innerWidth} height={innerHeight} fill={`url(#${hatchId})`} />
          <line x1={0} x2={innerWidth} y1={innerHeight - 1.5} y2={innerHeight - 1.5} stroke="var(--border-strong)" strokeWidth={3} />
          {/* il simbolo fuori dal maiuscolo della .label: p(x) non deve diventare P(X) */}
          <text x={innerWidth / 2} y={Math.max(28, innerHeight * 0.2)} textAnchor="middle" fill="var(--text-muted)">
            <tspan className="num" fontSize={14}>
              p(x)
            </tspan>
            <tspan className="label" dx={6}>
              incognita
            </tspan>
          </text>
          <text x={innerWidth / 2} y={Math.max(28, innerHeight * 0.2) + 16} textAnchor="middle" fontStyle="italic" fontSize={13} fill="var(--text-muted)">
            unknown pdf
          </text>
        </motion.g>
      </g>

      <Histogram values={lums} bins={layout.bins} domain={layout.domain} normalize role={kind === 'istogramma' ? 'estimate' : 'sample'} tone="wash" format={(v) => f3(v)} />

      {areaCurve !== null && <AreaPath data={areaCurve} role="highlight" opacity={0.42} xRange={[a, lerp(a, b, sweep)]} />}
      {kind === 'gaussiana' && gaussCurve !== null && <LinePath data={gaussCurve} role="estimate" />}

      {/* la pdf vera, scoperta dal basso verso l'alto insieme al telo che sale */}
      <defs>
        <clipPath id={revealId}>
          <motion.rect x={0} width={innerWidth} height={innerHeight + 4} initial={false} animate={{ attrY: revealed ? 0 : innerHeight + 4 }} transition={curtainTransition} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${revealId})`}>
        <LinePath data={truthCurve} role="truth" width={2.5} />
      </g>

      {overflow.map((c) => {
        const cx = x((c.x0 + Math.min(c.x1, DOMAIN[1])) / 2)
        return <path key={c.x0} d={`M${cx - 4},9L${cx},3L${cx + 4},9Z`} fill="var(--viz-estimate)" stroke="var(--surface)" strokeWidth={1} pointerEvents="none" />
      })}

      {/* estremi dell'intervallo */}
      {[
        { id: 'a', v: a },
        { id: 'b', v: b },
      ].map((h) => (
        <g key={h.id} pointerEvents="none" aria-hidden="true">
          <line x1={x(h.v)} x2={x(h.v)} y1={0} y2={innerHeight} stroke="var(--viz-boundary)" strokeWidth={1.5} />
          <text x={x(h.v)} y={14} dx={h.id === 'a' ? -5 : 5} textAnchor={h.id === 'a' ? 'end' : 'start'} className="num" fontSize={13} fontWeight={700} fill="var(--text)" stroke="var(--bg)" strokeWidth={3} paintOrder="stroke">
            {h.id}
          </text>
        </g>
      ))}

      {/* tappeto dei campioni atterrati: un filo per x_k */}
      <path d={rug} stroke="var(--viz-sample)" strokeOpacity={0.45} strokeWidth={1} fill="none" clipPath={clipPath} pointerEvents="none" aria-hidden="true" />

      <g data-flying="" pointerEvents="none" aria-hidden="true">
        {flying.map((f) => (
          <g key={f.key} opacity={f.opacity}>
            <circle cx={f.cx} cy={f.cy} r={4} fill="var(--viz-sample)" stroke="var(--surface)" strokeWidth={2} paintOrder="stroke" />
            {f.label !== undefined && (
              <text x={f.cx} y={f.cy - 8} textAnchor="middle" className="num" fontSize={11} fill="var(--text)" stroke="var(--bg)" strokeWidth={3} paintOrder="stroke">
                {f.label}
              </text>
            )}
          </g>
        ))}
      </g>

      {/* la tua ipotesi: la spezzata che trascini, punto per punto (anche da tastiera: ogni punto è un cursore) */}
      {live.drawing && (
        <>
          <LinePath data={HYP_XS.map((hx, i) => [hx, live.hyp[i]])} role="kernel" />
          <Dots
            data={HYP_XS.map((hx, i) => ({ id: `h${i}`, x: hx, y: live.hyp[i], label: `Ipotesi in x = ${hx}` }))}
            draggable
            axis="y"
            role="kernel"
            step={[1, 0.01]}
            format={f3}
            onDrag={(id, _nx, ny) => onHyp(id, ny)}
          />
        </>
      )}

      <Dots
        data={[
          { id: 'a', x: a, y: 0, label: 'Estremo a' },
          { id: 'b', x: b, y: 0, label: 'Estremo b' },
        ]}
        draggable
        axis="x"
        pin
        step={0.05}
        format={f2}
        onDrag={(id, nx) => onHandle(id, nx)}
      />

      <Axis side="bottom" label="luminosità" symbol="x₁" ticks={narrow ? [0, 2, 4, 6, 8, 10] : 10} />
      <Axis side="left" symbol="p(x)" />
    </>
  )
}

// ---------------------------------------------------------------------------------------------
// Formule vive (sotto il terreno) e letture (nei comandi)
// ---------------------------------------------------------------------------------------------

/** L'insieme X scritto per esteso finché si può, poi con i puntini. */
function trainingSetTex(n: number): string {
  if (n === 0) return '\\mathbf{X} = \\{\\ \\} \\qquad N = \\val[0]{N}'
  if (n === 1) return '\\mathbf{X} = \\{\\mathbf{x}_1\\} \\qquad N = \\val[0]{N}'
  if (n === 2) return '\\mathbf{X} = \\{\\mathbf{x}_1, \\mathbf{x}_2\\} \\qquad N = \\val[0]{N}'
  return '\\mathbf{X} = \\{\\mathbf{x}_1, \\mathbf{x}_2, \\dots, \\mathbf{x}_{\\val[0]{N}}\\} \\qquad N = \\val[0]{N}'
}

const VECTOR_TEX = [
  '\\mathbf{x}_{\\val[0]{k}} = (x_1) = (\\val{x1})',
  '\\mathbf{x}_{\\val[0]{k}} = (x_1, x_2) = (\\val{x1},\\ \\val[1]{x2})',
  '\\mathbf{x}_{\\val[0]{k}} = (x_1, x_2, x_3) = (\\val{x1},\\ \\val[1]{x2},\\ \\val[1]{x3})',
] as const

function FormulaRow({ label, en, children }: { label: string; en: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-0.5">
      <p className="m-0 flex flex-wrap items-baseline gap-x-2">
        <span className="label">{label}</span>
        <span className="text-[length:var(--step--1)] text-faint italic">{en}</span>
      </p>
      {children}
    </div>
  )
}

const FORMULA = 'min-w-0 [&_.katex-display]:my-1'

function Formulas({ probe }: { probe: number | null }) {
  const live = useLive()
  const { landed, stream, nFeat, a, b, revealed, kind, cells, fit, binW } = live
  const lastK = live.index === STEP.primo ? (live.progress >= FIRST.measure ? 1 : 0) : landed
  const r = lastK > 0 ? stream[lastK - 1] : null
  const px = probe ?? (a + b) / 2
  const cell = cells.find((c, i) => px >= c.x0 && (px < c.x1 || i === cells.length - 1))
  return (
    <div className="grid gap-x-6 gap-y-3 @2xl:grid-cols-2">
      <FormulaRow label="Insieme di training" en="training set, N campioni iid">
        <LiveFormula className={FORMULA} announce={false} tex={trainingSetTex(landed)} values={{ N: landed }} />
      </FormulaRow>
      <FormulaRow label="Vettore delle feature" en="feature vector: luminosità, larghezza [cm], lunghezza [cm]">
        <LiveFormula
          className={FORMULA}
          announce={false}
          tex={VECTOR_TEX[Math.min(Math.max(nFeat, 1), 3) - 1]}
          values={{ k: lastK > 0 ? lastK : '—', x1: r?.lum ?? '—', x2: r?.larghezza ?? '—', x3: r?.lunghezza ?? '—' }}
        />
      </FormulaRow>
      <FormulaRow label="Probabilità vera" en="area under the true pdf">
        <LiveFormula
          className={FORMULA}
          announce={false}
          tex="P\{a \le x \le b\} = \int_{\val{a}}^{\val{b}} p(x)\,dx = \val[3]{P}"
          values={{ a, b, P: revealed ? live.pTrue : '?' }}
        />
      </FormulaRow>
      <FormulaRow label="Probabilità stimata dai campioni" en="estimate from the samples">
        <LiveFormula
          className={FORMULA}
          announce={false}
          tex="\int_{\val{a}}^{\val{b}} \hat p(x)\,dx = \val[3]{Ph} \qquad \frac{K_{ab}}{N} = \frac{\val[0]{K}}{\val[0]{N}} = \val[3]{F}"
          values={{ a, b, Ph: live.pHat, K: live.kIn, N: landed, F: landed > 0 ? live.kIn / landed : Number.NaN }}
        />
      </FormulaRow>
      {kind === 'istogramma' ? (
        <FormulaRow label="Istogramma in un punto" en="normalized histogram, al cursore o a metà fra a e b">
          <LiveFormula
            className={FORMULA}
            announce={false}
            tex="\hat p(\val{x}) = \frac{K/N}{V} = \frac{\val[0]{K} / \val[0]{N}}{\val{V}} = \val[3]{p}"
            values={{ x: px, K: cell?.count ?? 0, N: landed, V: binW, p: landed > 0 ? (cell?.density ?? 0) : Number.NaN }}
          />
        </FormulaRow>
      ) : (
        <FormulaRow label="Gaussiana adattata" en="parametric estimate">
          <LiveFormula
            className={FORMULA}
            announce={false}
            tex="\hat p(x) = p(x \mid \hat{\boldsymbol\theta}), \quad \hat{\boldsymbol\theta} = (\hat\mu, \hat\sigma^2) = (\val{mu},\ \val{s2})"
            values={{ mu: fit?.mu ?? Number.NaN, s2: fit === null ? Number.NaN : fit.sigma ** 2 }}
          />
        </FormulaRow>
      )}
      <FormulaRow label="Distanza dalla pdf vera" en="integrated squared error">
        <LiveFormula
          className={FORMULA}
          announce={false}
          tex="\text{ISE} = \int \big(\hat p(x) - p(x)\big)^2\,dx = \val[4]{ise}"
          values={{ ise: revealed ? live.iseValue : '?' }}
        />
      </FormulaRow>
    </div>
  )
}

function LiveReadouts() {
  const live = useLive()
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      <Readout label="Campioni N" latex="N" value={live.landed} format={fixed(0)} />
      <Readout label="Campioni nell’intervallo" latex="K_{ab}" value={live.kIn} format={fixed(0)} />
      <Readout label="P vera" latex="P\{a \le x \le b\}" value={live.revealed ? live.pTrue : 'nascosta'} format={f3} pinned />
      <Readout label="Stima dai campioni" latex="\int_a^b \hat p" value={live.pHat} format={f3} />
      <Readout label="Errore ISE" latex="\text{ISE}" value={live.revealed ? live.iseValue : 'nascosto'} format={f4} />
      {live.revealed && <Readout label="pdf vera" value={live.truth.label} />}
    </div>
  )
}

const CHECK_ICON = { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'square', 'aria-hidden': true } as const

/** Letture della modalità "la tua ipotesi": area da rinormalizzare, errore, confronto con la stima automatica. */
function HypothesisPanel({ onNormalize }: { onNormalize: () => void }) {
  const live = useLive()
  const both = live.drawing && live.revealed && Number.isFinite(live.hypIse) && Number.isFinite(live.iseValue)
  const wins = both && live.hypIse < live.iseValue
  const verdict = !both
    ? ''
    : wins
      ? `La tua ipotesi è più vicina alla pdf vera della stima automatica (${f4(live.hypIse)} contro ${f4(live.iseValue)}).`
      : `La stima automatica è più vicina (${f4(live.iseValue)} contro ${f4(live.hypIse)}): sposta i punti e riprova.`
  // durante la raffica l'errore della stima cambia a ogni fotogramma: chi ascolta sente solo il verdetto fermo
  const spoken = useSettled(verdict)
  if (!live.drawing) return null
  return (
    <div className="grid gap-3 border-t border-border pt-4">
      <p className="m-0 text-[length:var(--step--1)] text-muted">
        Trascina i punti verdi-acqua (o selezionali con Tab e usa le frecce). L’errore si calcola sulla curva rinormalizzata ad area 1: una pdf deve integrare a 1.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Area della tua curva" latex="\int h(x)\,dx" value={live.hypArea} format={f2} />
        <Readout label="ISE della tua ipotesi" latex="\text{ISE}_h" value={live.revealed ? live.hypIse : 'nascosto'} format={f4} pinned={wins} />
      </div>
      <div>
        <ActionButton onClick={onNormalize} disabled={Math.abs(live.hypArea - 1) < 5e-4}>
          Rinormalizza ad area 1
        </ActionButton>
      </div>
      {both && (
        <p className={`m-0 flex items-center gap-2 border border-border p-2 text-[length:var(--step--1)] ${wins ? 'bg-ok-bg' : 'bg-warn-bg'}`}>
          <svg {...CHECK_ICON} className={`shrink-0 ${wins ? 'text-ok' : 'text-warn'}`}>
            {wins ? <path d="M4 12.5l5 5L20 6.5" /> : <path d="M12 4v10M12 18.5v.5" />}
          </svg>
          <span aria-hidden="true">{verdict}</span>
        </p>
      )}
      <p role="status" className="visually-hidden">
        {spoken}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// L'errore in funzione di N
// ---------------------------------------------------------------------------------------------

const ISE_NS = [2, 3, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000] as const
const SUPERSCRIPT: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
const pow10 = (v: number) => (v === 0 ? '1' : `10${String(v).replace(/[-0-9]/g, (c) => SUPERSCRIPT[c] ?? c)}`)

function IseChart() {
  const live = useLive()
  const { stream, truth, kind, binW, landed, iseValue, revealed } = live
  const all = useMemo(() => stream.map((f) => f.lum), [stream])
  const curve = useMemo(
    () =>
      iseCurve(all, truth.pdf, kind, binW, ISE_NS)
        .filter((r) => r.ise > 0 && Number.isFinite(r.ise))
        .map((r) => [Math.log10(r.n), Math.log10(r.ise)]),
    [all, truth, kind, binW],
  )
  if (!revealed) {
    return (
      <p className="m-0 border border-dashed border-border px-3 py-2 text-[length:var(--step--1)] text-muted">
        L’errore <M tex="\text{ISE}" /> in funzione di <M tex="N" /> si legge solo a sipario alzato: per misurare la distanza serve la pdf vera, che nella realtà non si conosce.
      </p>
    )
  }
  const now = landed >= 1 && iseValue > 0 && Number.isFinite(iseValue) ? [Math.log10(landed), Math.log10(iseValue)] : null
  const ys = [...curve.map((p) => p[1]), ...(now ? [now[1]] : [])]
  const yLo = Math.floor(Math.min(...ys, -1))
  const yHi = Math.ceil(Math.max(...ys, 0))
  return (
    <figure className="m-0 grid gap-1">
      <figcaption className="flex flex-wrap items-baseline gap-x-2">
        <span className="label">Errore contro N</span>
        <span className="text-[length:var(--step--1)] text-faint italic">ISE vs N, scale logaritmiche</span>
      </figcaption>
      <Plot
        width={320}
        height={170}
        xDomain={[0, Math.log10(5000)]}
        yDomain={[yLo, yHi]}
        margin={{ top: 12, right: 12, bottom: 36, left: 44 }}
        ariaLabel={`Errore quadratico integrato della stima (${kind}) in funzione del numero di campioni N, in scala logaritmica: scende al crescere di N`}
      >
        <Grid axis="y" yTicks={linspace(yLo, yHi, yHi - yLo + 1)} />
        <LinePath data={curve} role="estimate" />
        {now !== null && <Dots data={[{ id: 'ora', x: now[0], y: now[1], label: `N = ${landed}` }]} pin format={(v) => f2(v)} />}
        <Axis side="bottom" ticks={[0, 1, 2, 3]} format={(v) => String(10 ** v)} symbol="N" />
        <Axis side="left" ticks={linspace(yLo, yHi, yHi - yLo + 1)} format={pow10} symbol="ISE" />
      </Plot>
    </figure>
  )
}

// ---------------------------------------------------------------------------------------------
// Legenda
// ---------------------------------------------------------------------------------------------

const SWATCH = { width: 28, height: 14, viewBox: '0 0 28 14', 'aria-hidden': true } as const

function Legend({ kind, drawing }: { kind: EstimateKind; drawing: boolean }) {
  const items: { key: string; label: ReactNode; swatch: ReactNode }[] = [
    {
      key: 'hist',
      label: kind === 'istogramma' ? <>Istogramma <M tex="\hat p(x)" /></> : 'Istogramma dei campioni',
      swatch: (
        <svg {...SWATCH}>
          <rect x={4} y={3} width={20} height={11} fill={kind === 'istogramma' ? 'var(--viz-estimate)' : 'var(--viz-sample)'} fillOpacity={0.28} />
          <rect x={4} y={3} width={20} height={2} fill={kind === 'istogramma' ? 'var(--viz-estimate)' : 'var(--viz-sample)'} />
        </svg>
      ),
    },
    ...(kind === 'gaussiana'
      ? [
          {
            key: 'gauss',
            label: (
              <>
                Gaussiana adattata <M tex="p(x \mid \hat{\boldsymbol\theta})" />
              </>
            ),
            swatch: (
              <svg {...SWATCH}>
                <path d="M2,12 C9,12 10,2 14,2 C18,2 19,12 26,12" fill="none" stroke="var(--viz-estimate)" strokeWidth={2} />
              </svg>
            ),
          },
        ]
      : []),
    {
      key: 'truth',
      label: (
        <>
          pdf vera <M tex="p(x)" />
        </>
      ),
      swatch: (
        <svg {...SWATCH}>
          <line x1={2} x2={26} y1={7} y2={7} stroke="var(--viz-truth)" strokeWidth={2.5} strokeDasharray="6 4" />
        </svg>
      ),
    },
    {
      key: 'sample',
      label: (
        <>
          Campione <M tex="x_k" /> e tappeto
        </>
      ),
      swatch: (
        <svg {...SWATCH}>
          <circle cx={9} cy={7} r={4} fill="var(--viz-sample)" />
          <path d="M18,13v-7M21,13v-7M24,13v-7" stroke="var(--viz-sample)" strokeOpacity={0.6} />
        </svg>
      ),
    },
    ...(drawing
      ? [
          {
            key: 'hyp',
            label: (
              <>
                La tua ipotesi <M tex="h(x)" />
              </>
            ),
            swatch: (
              <svg {...SWATCH}>
                <path d="M2,12 L9,4 L16,9 L26,6" fill="none" stroke="var(--viz-kernel)" strokeWidth={2} />
                <circle cx={9} cy={4} r={2.5} fill="var(--viz-kernel)" />
              </svg>
            ),
          },
        ]
      : []),
    {
      key: 'area',
      label: (
        <>
          Area <M tex="P\{a \le x \le b\}" />
        </>
      ),
      swatch: (
        <svg {...SWATCH}>
          <rect x={4} y={2} width={20} height={12} fill="var(--viz-highlight)" fillOpacity={0.42} />
          <path d="M4,2v12M24,2v12" stroke="var(--viz-boundary)" strokeWidth={1.5} />
        </svg>
      ),
    },
  ]
  return (
    <div className="grid gap-1.5">
      <h5 className="label m-0">Legenda</h5>
      <ul className="m-0 grid list-none gap-x-4 gap-y-1 p-0 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.key} className="flex min-h-7 items-center gap-2 text-[length:var(--step--1)] text-text">
            <span className="shrink-0">{it.swatch}</span>
            <span className="min-w-0">{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Il widget
// ---------------------------------------------------------------------------------------------

const PDF_OPTIONS = HIDDEN_PDF_IDS.map((id) => ({ value: id, label: hiddenPdf(id).label }))
const KIND_OPTIONS = [
  { value: 'istogramma' as const, label: 'Istogramma' },
  { value: 'gaussiana' as const, label: 'Gaussiana' },
]
const FEAT_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
] as const
const DEFAULT_N_INDEX = N_OPTIONS.indexOf(DEFAULT_N)
const DEFAULT_AB = { a: 2, b: 4 }

const CHALLENGE_PROMPT =
  'Sposta le maniglie $a$ e $b$ finché $P\\{a \\le x \\le b\\} = 0.50$, con tolleranza $\\pm 0.01$: metà dei salmoni deve avere la luminosità nell’intervallo. Si può fare con il sipario chiuso, guidandosi con i soli campioni.'
const CHALLENGE_HINT =
  'Con il sipario chiuso guarda $K_{ab}/N$: con molti campioni vale circa $P\\{a \\le x \\le b\\}$. Un intervallo sulla gobba basta corto, uno nelle code deve essere molto più largo. Da tastiera: frecce 0.05, Maiusc + frecce 0.5.'

export default function CampioniCheRivelanoLaPdf() {
  const [pdfId, setPdfId] = useState<HiddenPdfId>('unimodale')
  const [nIndex, setNIndex] = useState(DEFAULT_N_INDEX)
  const [binW, setBinW] = useState(0.5)
  const [kind, setKind] = useState<EstimateKind>('istogramma')
  const [nFeat, setNFeat] = useState(3)
  const [ab, setAb] = useState(DEFAULT_AB)
  /** scelta manuale del sipario, valida solo nel passo in cui è stata fatta: il passo successivo torna alla regola */
  const [curtain, setCurtain] = useState<{ index: number; open: boolean } | null>(null)
  const [status, setStatus] = useState<ChallengeStatus>('idle')
  const [probe, setProbe] = useState<number | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [hyp, setHyp] = useState<readonly number[]>(HYP_START)
  const [frames] = useState(createFrameStore)
  const reduced = useReducedMotion()
  const aspectWide = useMediaQuery('(min-width: 40rem)')

  const n = N_OPTIONS[nIndex]
  const steps = useMemo(() => stepsFor(n), [n])
  const sb = useStoryboard(steps, { onFrame: frames.set })
  const revealed = curtain !== null && curtain.index === sb.index ? curtain.open : sb.index >= STEP.svela

  const cfg = useMemo<Config>(
    () => ({ pdfId, n, binW, kind, nFeat, a: ab.a, b: ab.b, revealed, drawing, hyp }),
    [pdfId, n, binW, kind, nFeat, ab, revealed, drawing, hyp],
  )

  const unsettle = () => setStatus((s) => (s === 'idle' ? s : 'idle'))
  const onHandle = useCallback((id: string, value: number) => {
    setAb((cur) => moveHandle(id === 'a' ? 'a' : 'b', value, cur.a, cur.b))
    setStatus((s) => (s === 'idle' ? s : 'idle'))
  }, [])
  const onHyp = useCallback((hid: string, value: number) => {
    const i = Number(hid.slice(1))
    setHyp((cur) => cur.map((h, j) => (j === i ? Math.max(0, value) : h)))
  }, [])

  const choosePdf = (id: HiddenPdfId) => {
    // un'altra pdf nascosta: il sipario si richiude, i campioni si azzerano e l'esperimento riparte
    setPdfId(id)
    setCurtain(null)
    sb.reset()
    unsettle()
  }
  const chooseN = (i: number) => {
    setNIndex(i)
    // prima della pesca lo slider porta subito alla raffica, altrimenti non si vedrebbe nulla cambiare
    if (sb.index < STEP.campione) {
      sb.goto(STEP.campione)
      if (!reduced) sb.play()
    }
  }
  const reset = () => {
    sb.reset()
    setPdfId('unimodale')
    setNIndex(DEFAULT_N_INDEX)
    setBinW(0.5)
    setKind('istogramma')
    setNFeat(3)
    setAb(DEFAULT_AB)
    setCurtain(null)
    setStatus('idle')
    setProbe(null)
    setDrawing(false)
    setHyp(HYP_START)
  }
  const check = () => setStatus(challengeMet(intervalProbability(hiddenPdf(pdfId).pdf, ab.a, ab.b)) ? 'ok' : 'ko')

  const current = STEP_TEXT[sb.index] ?? STEP_TEXT[0]
  const id = useId()

  const frame = (
    <WidgetFrame
      meta={meta}
      aspect={aspectWide ? 1.6 : 1}
      onReset={reset}
      transport={<PlayControls sb={sb} steps={steps} />}
      caption={
        <div className="grid gap-4">
          <StepCaption index={sb.index} total={steps.length} label={current.label} text={current.text} />
          <Formulas probe={probe} />
        </div>
      }
      controls={
        <>
          <Legend kind={kind} drawing={drawing} />
          <Segmented id={`${id}-pdf`} label="pdf nascosta" options={PDF_OPTIONS} value={pdfId} onChange={choosePdf} />
          <Slider
            id={`${id}-n`}
            label="Numero di campioni"
            latex="N"
            min={0}
            max={N_OPTIONS.length - 1}
            step={1}
            value={nIndex}
            onChange={chooseN}
            format={(i) => String(N_OPTIONS[Math.round(i)] ?? '')}
          />
          <Slider id={`${id}-bin`} label="Larghezza del bin" latex="V = \Delta" min={0.1} max={2.5} step={0.1} value={binW} onChange={setBinW} />
          <Segmented id={`${id}-kind`} label="Tipo di stima" options={KIND_OPTIONS} value={kind} onChange={(v) => setKind(v)} />
          <Toggle
            id={`${id}-curtain`}
            label="Alza il sipario"
            checked={revealed}
            onChange={(open) => setCurtain({ index: sb.index, open })}
            hint="Mostra la pdf vera p(x) (true pdf): nella realtà nessuno la conosce."
          />
          <Segmented
            id={`${id}-feat`}
            label="Feature misurate per pesce"
            options={FEAT_OPTIONS}
            value={String(nFeat) as '1' | '2' | '3'}
            onChange={(v) => setNFeat(Number(v))}
          />
          <LiveReadouts />
          <IseChart />
          {revealed && (
            <p className="m-0 text-[length:var(--step--1)] text-muted">
              I dati escono da <M tex={hiddenPdf(pdfId).tex} />, ristretta alla scala 0-10.
            </p>
          )}
          <Toggle
            id={`${id}-draw`}
            label="Disegna la tua ipotesi"
            checked={drawing}
            onChange={setDrawing}
            hint="Con pochi campioni (prova N = 15) traccia la pdf che immagini dietro il sipario, poi alzalo e confronta il tuo errore con quello della stima automatica."
          />
          <HypothesisPanel onNormalize={() => setHyp((cur) => normalizeHypothesis(cur))} />
        </>
      }
      challenge={<Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={check} />}
    >
      <Terrain onHandle={onHandle} onProbe={setProbe} onHyp={onHyp} />
    </WidgetFrame>
  )

  return (
    <LiveProvider frames={frames} cfg={cfg}>
      {frame}
    </LiveProvider>
  )
}
