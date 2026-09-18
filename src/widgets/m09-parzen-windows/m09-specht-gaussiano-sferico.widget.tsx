// Widget m09-specht-gaussiano-sferico ("Metodo di Specht: una gaussiana sferica su ogni campione"), concetti c58,
// c59, c61. Slide p65: la stima è la media di N gaussiane n-dimensionali rotonde e identiche (covarianza σ²I),
// una per campione; σ è il parametro di smoothing e, con il kernel sferico, l'unico iperparametro. Sul piano delle
// due bande di 40 pixel di vegetazione: i cerchi di raggio σ, la mappa della stima, la sonda con gli addendi, la
// log-verosimiglianza leave-one-out contro quella sui dati di training, la vista 3-D e il disegno d'esame.
//
// MOTO. Tutto il racconto (σ che scorre, la ricerca leave-one-out, la vista 3-D, il disegno in tre tempi) è nello
// storyboard; con reduced motion ogni passo è subito il suo stato finale. Slider, sonda, clic sui pixel: nessuna
// animazione. La mappa e la superficie si ricalcolano con un render di ritardo (useDeferredValue).
import { useCallback, useDeferredValue, useId, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { M } from '../../components/content/M'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Dots } from '../kit/plot/Dots'
import { FieldCanvas } from '../kit/plot/FieldCanvas'
import { LinePath } from '../kit/plot/LinePath'
import { classSymbolPath, classVar } from '../kit/plot/marks'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { StepCaption } from '../kit/StepCaption'
import { Toggle } from '../kit/Toggle'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { formatH } from '../engines/density1d'
import { RegimeStamp } from '../engines/density1d/panels'
import type { WidgetMeta } from '../types'
import { useNarrow } from './proprieta/hooks'
import { PointMark, RefLine } from './proprieta/marks'
import { sampleGrid } from './proprieta/surface'
import { Surface3D } from './proprieta/Surface3D'
import { FormulaBox, Icon, Legend, LogSlider, OverlayCard, StaticFormula } from './proprieta/ui'
import {
  DENOMINATORS,
  DOMAIN,
  EXPONENTS,
  INITIAL_PROBE,
  INITIAL_SIGMA,
  N_RANGE,
  RIGHT,
  SIGMA_CURVE,
  SIGMA_STEPS,
  addends,
  bananaPixels,
  bestSigma,
  coef2d,
  looLogLik,
  nearest,
  regimeOf,
  specht,
  sweepSigma,
  trainLogLik,
  zoneOf,
} from './specht'
import type { Pt, Zone } from './specht'

export const meta: WidgetMeta = {
  id: 'm09-specht-gaussiano-sferico',
  moduleId: 'm09-parzen-windows',
  title: 'Metodo di Specht: una gaussiana sferica su ogni campione',
  concepts: ['c58', 'c59', 'c61'],
  scenario: 'telerilevamento',
  scenarioNote: 'Immagine multispettrale: 40 pixel di vegetazione nelle bande rosso e vicino infrarosso, normalizzate',
  size: 'L',
}

const f0 = fixed(0)
const f2 = fixed(2)
const f3 = fixed(3)
const f4 = fixed(4)
const TOP = 5

const STEPS = [
  { id: 'quadro', label: 'Il quadro: una gaussiana rotonda per pixel', durationMs: 1500 },
  { id: 'sigma', label: 'σ dal piccolo al grande', durationMs: 3000 },
  { id: 'sonda', label: 'La sonda e i suoi addendi', durationMs: 1500 },
  { id: 'loo', label: 'Un solo iperparametro: σ con leave-one-out', durationMs: 3000 },
  { id: 'vista3d', label: 'La stima come superficie', durationMs: 1800 },
  { id: 'disegno', label: "Il disegno d'esame", durationMs: 2400 },
]
const SWEEP = 1
const LOO = 3
const VIEW3D = 4
const EXAM = 5

function caption(index: number, n: number, sigma: number, best: number): string {
  switch (index) {
    case 0:
      return String.raw`${n} pixel di vegetazione nelle due bande normalizzate (z-score): rosso e vicino infrarosso. La nuvola è curva, non gaussiana. Su ogni pixel $\mathbf x_k$ una gaussiana a simmetria sferica (*Gaussian kernel with spherical symmetry*) di deviazione standard $\sigma$: il cerchio è la sua curva di livello a una $\sigma$. La mappa è la loro media, $\hat p(\mathbf x)$.`
    case 1:
      return String.raw`$\sigma$ dal piccolo al grande. Sotto 0.1 la mappa è a pois, un punto caldo per pixel (*overfitting*); sopra 1 diventa un'unica macchia tonda che copre anche zone senza pixel (*underfitting*); in mezzo segue la forma curva della nuvola. $\sigma$ è il parametro di smoothing: *its setting should be made carefully*.`
    case 2:
      return String.raw`Trascina la sonda $\mathbf x$: la formula si riempie con $n = 2$, $N = ${n}$, $\sigma = ${formatH(sigma)}$ e il coefficiente $1/(2\pi\sigma^2) = ${f3(1 / (2 * Math.PI * sigma * sigma))}$. I ${TOP} addendi più grandi sono collegati alla sonda da segmenti spessi quanto il loro contributo; la distanza è euclidea, $\|\mathbf x - \mathbf x_k\|$.`
    case 3:
      return String.raw`Il cursore percorre $\sigma$ da 0.05 a 2 e traccia la log-verosimiglianza **leave-one-out**: ogni pixel è valutato con la stima degli altri $N - 1$. Il massimo è in $\sigma^* = ${f3(best)}$. Calcolata sugli stessi dati di training la log-verosimiglianza cresce **senza limite** per $\sigma \to 0$, perché ogni pixel vede il proprio ago: per questo $\sigma$ non si sceglie sui dati di training.`
    case 4:
      return String.raw`La stessa stima come superficie: una somma di campane rotonde tutte uguali, una per pixel, divisa per $N$. Tutta la flessibilità viene dalla posizione dei campioni, tutto il controllo da un solo numero, $\sigma$.`
    default:
      return String.raw`Il disegno da riprodurre all'orale (*gaussian kernel with spherical symmetry with formula and some drawing to represent it*), in tre tempi: tre campioni su un asse con tre campane identiche di larghezza $\sigma$; la loro somma divisa per $N$; in 2-D, cerchi concentrici attorno a ogni campione, con la formula accanto.`
  }
}

const PROMPT = String.raw`Scegli $\sigma$ **a occhio** con lo slider, poi dichiara dove sei rispetto alla $\sigma^*$ della log-verosimiglianza leave-one-out: in zona overfitting, giusta (entro un fattore 1.3) o underfitting. Poi controlla la formula a memoria: l'esponente di $2\pi\sigma^2$ e il denominatore nell'esponenziale.`
const HINT = String.raw`Premi "Trova σ con leave-one-out" per vedere $\sigma^*$. La formula è quella di una normale $n$-dimensionale con covarianza $\sigma^2 I$: il determinante è $\sigma^{2n}$ e la sua radice dà $(2\pi\sigma^2)^{n/2}$; nell'esponente la forma quadratica è $\|\mathbf x - \mathbf x_k\|^2/(2\sigma^2)$.`

const ZONE_WORDS: Record<Zone, string> = { overfitting: 'overfitting (σ troppo piccola)', giusta: 'in zona (entro 1.3)', underfitting: 'underfitting (σ troppo grande)' }

/** I pixel: bersaglio da 20 px, clic per toglierli; i cerchi di raggio σ; i segmenti verso la sonda. */
function PixelLayer({ pixels, sigma, probe, top, circles, onRemove, onAdd }: { pixels: readonly Pt[]; sigma: number; probe: Pt; top: readonly { index: number; term: number }[]; circles: boolean; onRemove: (i: number) => void; onAdd: (p: Pt) => void }) {
  const { x, y, innerWidth, innerHeight, toData, clipPath } = usePlot()
  const r = Math.abs(x(sigma) - x(0))
  const sum = top.reduce((s, t) => s + t.term, 0)
  const add = (e: MouseEvent<SVGRectElement>) => {
    const [dx, dy] = toData(e.clientX, e.clientY)
    onAdd([Number(dx.toFixed(2)), Number(dy.toFixed(2))])
  }
  return (
    <g data-pixels="">
      <rect x={0} y={0} width={innerWidth} height={innerHeight} fill="transparent" style={{ cursor: 'copy' }} onClick={add} />
      <g clipPath={clipPath} pointerEvents="none">
        {circles ? pixels.map((p, i) => <circle key={`c${i}`} cx={x(p[0])} cy={y(p[1])} r={r} fill="none" stroke="var(--text)" strokeOpacity={0.45} strokeWidth={1} />) : null}
        {top.map((t) => {
          const p = pixels[t.index]
          if (p === undefined) return null
          return <line key={`s${t.index}`} data-segment={t.index} x1={x(probe[0])} y1={y(probe[1])} x2={x(p[0])} y2={y(p[1])} stroke="var(--viz-boundary)" strokeWidth={0.75 + 6 * (sum > 0 ? t.term / sum : 0)} strokeLinecap="round" />
        })}
      </g>
      {pixels.map((p, i) => (
        <g
          key={i}
          data-pixel={i}
          transform={`translate(${x(p[0])},${y(p[1])})`}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            onRemove(i)
          }}
        >
          <circle r={10} fill="transparent" />
          <path d={classSymbolPath(0, 50)} fill={classVar(0)} stroke="var(--surface)" strokeWidth={2.5} paintOrder="stroke" />
        </g>
      ))}
    </g>
  )
}

/** Il disegno d'esame in tre tempi: campane 1-D, la loro somma / N, cerchi concentrici in 2-D. */
function ExamDrawing({ phase, sigma }: { phase: number; sigma: number }) {
  const W = 320
  const H = 150
  const base = 118
  const xs = Array.from({ length: 121 }, (_, i) => i)
  const centers = [38, 62, 104]
  const s = 10 + 14 * Math.min(1, sigma / 0.6)
  const bell = (c: number) => (x: number) => Math.exp(-0.5 * ((x - c) / s) ** 2)
  const path = (f: (x: number) => number, k: number) => `M${xs.map((x) => `${10 + x * 1.2},${base - k * f(x)}`).join('L')}`
  const sum = (x: number) => centers.reduce((a, c) => a + bell(c)(x), 0) / 3
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Disegno d'esame: tre campane identiche, la loro somma divisa per N, cerchi concentrici in 2-D">
      <line x1={8} x2={160} y1={base} y2={base} stroke="var(--viz-axis)" />
      {centers.map((c) => (
        <circle key={c} cx={10 + c * 1.2} cy={base} r={3} fill="var(--viz-sample)" />
      ))}
      {phase >= 1 ? centers.map((c) => <path key={`b${c}`} d={path(bell(c), 60)} fill="none" stroke="var(--viz-kernel)" strokeWidth={1.5} />) : null}
      {phase >= 2 ? <path d={path(sum, 60)} fill="none" stroke="var(--viz-estimate)" strokeWidth={2.5} /> : null}
      {phase >= 2 ? (
        <text x={12} y={16} className="num" fontSize={11} fill="var(--text)">
          somma / N
        </text>
      ) : null}
      {phase >= 3 ? (
        <g>
          <rect x={176} y={18} width={134} height={112} fill="none" stroke="var(--viz-axis)" />
          {[
            [206, 58],
            [236, 92],
            [280, 50],
          ].map(([cx, cy]) => (
            <g key={`${cx}`}>
              {[1, 2, 3].map((k) => (
                <circle key={k} cx={cx} cy={cy} r={k * s * 0.55} fill="none" stroke="var(--viz-kernel)" strokeOpacity={1 - k * 0.22} />
              ))}
              <circle cx={cx} cy={cy} r={2.5} fill="var(--viz-sample)" />
            </g>
          ))}
          <text x={180} y={144} className="num" fontSize={10} fill="var(--text-muted)">
            curve di livello a σ, 2σ, 3σ
          </text>
        </g>
      ) : null}
    </svg>
  )
}

export default function M09SpechtGaussianoSferico() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [pixels, setPixels] = useState<Pt[]>(() => bananaPixels())
  const [sigmaUser, setSigmaUser] = useState(INITIAL_SIGMA)
  const [probe, setProbe] = useState<Pt>(INITIAL_PROBE)
  const [showCircles, setShowCircles] = useState(true)
  const [showMap, setShowMap] = useState(true)
  const [view3d, setView3d] = useState(false)
  const [zone, setZone] = useState<Zone>('giusta')
  const [exponent, setExponent] = useState<string>('n')
  const [denominator, setDenominator] = useState<string>('\\sigma^2')
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [terrainRef, narrow] = useNarrow(600)

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const sweeping = sb.index === SWEEP && takeoverAt !== SWEEP
  const sigma = sweeping ? sweepSigma(progress) : sigmaUser
  const onSigma = (v: number) => {
    if (sweeping) {
      sb.pause()
      setTakeoverAt(SWEEP)
    }
    setSigmaUser(v)
  }
  const show3d = view3d || sb.index === VIEW3D
  const n = pixels.length

  const deferred = useDeferredValue(useMemo(() => ({ pixels, sigma }), [pixels, sigma]))
  const field = useCallback((x: number, y: number) => specht([x, y], deferred.pixels, deferred.sigma), [deferred])
  const surf = useMemo(() => (show3d ? sampleGrid((x, y) => specht([x, y], deferred.pixels, deferred.sigma), DOMAIN, 41) : null), [show3d, deferred])
  const zMax = surf !== null ? Math.max(0.05, ...surf) * 1.05 : 1

  const curves = useMemo(() => SIGMA_CURVE.map((s) => ({ s, loo: looLogLik(pixels, s), train: trainLogLik(pixels, s) })), [pixels])
  const best = useMemo(() => bestSigma(pixels), [pixels])
  const looShown = sb.index === LOO ? Math.max(1, Math.ceil(progress * curves.length)) : curves.length
  const looCursor = sb.index === LOO && progress < 1 ? curves[looShown - 1].s : sigma
  // la LOO precipita per σ → 0: la scala si ferma 250 punti sotto il massimo, così la zona che conta si legge
  const looMax = Math.max(...curves.map((c) => c.loo))
  const yLo = Math.max(Math.min(...curves.map((c) => c.loo)) - 5, looMax - 250)
  const yHi = Math.max(...curves.map((c) => c.train), looMax) + 5

  const terms = addends(probe, pixels, sigma)
  const top = terms.slice(0, TOP)
  const p = terms.reduce((s, t) => s + t.term, 0)
  const values = { N: n, sigma, coef: coef2d(sigma), twoS2: 2 * sigma * sigma, p, x1: probe[0], x2: probe[1] }
  const regime = regimeOf(sigma)
  const examPhase = sb.index === EXAM ? Math.min(3, Math.floor(progress * 3) + 1) : 0

  const addPixel = (pt: Pt) => {
    if (n >= N_RANGE.max) return
    setPixels((ps) => [...ps, pt])
  }
  const removePixel = (i: number) => {
    if (n <= N_RANGE.min) return
    setPixels((ps) => ps.filter((_, j) => j !== i))
  }

  const checkKey = `${sigmaUser}|${zone}|${exponent}|${denominator}|${n}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'
  const check = () => setChecked({ key: checkKey, ok: zone === zoneOf(sigmaUser, best) && exponent === RIGHT.exponent && denominator === RIGHT.denominator })

  const reset = () => {
    sb.reset()
    setPixels(bananaPixels())
    setSigmaUser(INITIAL_SIGMA)
    setProbe(INITIAL_PROBE)
    setShowCircles(true)
    setShowMap(true)
    setView3d(false)
    setZone('giusta')
    setExponent('n')
    setDenominator('\\sigma^2')
    setTakeoverAt(null)
    setChecked(null)
  }

  const plane = (
    <div className="relative h-full">
      <Plot
        width={420}
        height={420}
        fill
        xDomain={DOMAIN}
        yDomain={DOMAIN}
        margin={{ top: 22, right: 10, bottom: 36, left: 40 }}
        ariaLabel="Piano delle due bande con i pixel di vegetazione, i cerchi di raggio sigma e la mappa della stima"
        description={`${n} pixel, sigma = ${formatH(sigma)}. Stima nella sonda (${f2(probe[0])}, ${f2(probe[1])}): ${f4(p)}.`}
      >
        {showMap ? <FieldCanvas fn={field} resolution={72} opacity={0.85} /> : null}
        <PixelLayer pixels={pixels} sigma={sigma} probe={probe} top={top} circles={showCircles} onRemove={removePixel} onAdd={addPixel} />
        <Dots
          data={[{ x: probe[0], y: probe[1], id: 'sonda', label: 'Sonda x' }]}
          draggable
          pin
          step={0.1}
          onDrag={(_id, nx, ny) => setProbe([Number(nx.toFixed(2)), Number(ny.toFixed(2))])}
        />
        <Axis side="bottom" ticks={[-3, -2, -1, 0, 1, 2, 3]} label="rosso" symbol="x₁ (z)" />
        <Axis side="left" ticks={[-3, -2, -1, 0, 1, 2, 3]} symbol="NIR x₂ (z)" />
      </Plot>
      {regime !== null ? <RegimeStamp regime={regime === 'over' ? 'sensitive' : 'smooth'} /> : null}
    </div>
  )

  const surface =
    surf !== null ? (
      <div key="s3d" className="h-full p-2 transition-opacity duration-200 ease-out starting:opacity-0">
        <Surface3D z={surf} n={41} box={{ domain: DOMAIN, zMax }} view={{ az: -0.6, el: 0.6 }} width={420} height={360} strokeWidth={0.7} ariaLabel={`Stima di Specht come superficie, sigma = ${formatH(sigma)}`} />
      </div>
    ) : null

  const looPlot = (
    <Plot
      width={380}
      height={260}
      fill
      xDomain={[Math.log10(0.05), Math.log10(2)]}
      yDomain={[yLo, yHi]}
      margin={{ top: 22, right: 12, bottom: 36, left: 46 }}
      ariaLabel="Log-verosimiglianza leave-one-out e sui dati di training in funzione di sigma"
      description={`Massimo della leave-one-out in sigma* = ${f3(best)}.`}
    >
      <LinePath data={curves.slice(0, looShown).map((c) => [Math.log10(c.s), c.train])} role="boundary" width={1.5} />
      <LinePath data={curves.slice(0, looShown).map((c) => [Math.log10(c.s), c.loo])} role="estimate" width={2.5} />
      <RefLine x={Math.log10(looCursor)} color="var(--viz-boundary)" width={1} label={`σ = ${formatH(Number(looCursor.toFixed(3)))}`} anchor={looCursor > 0.6 ? 'end' : 'start'} />
      {looShown === curves.length ? <PointMark x={Math.log10(best)} y={looLogLik(pixels, best)} color="var(--pin)" r={6} /> : null}
      <Axis side="bottom" ticks={[0.05, 0.1, 0.2, 0.5, 1, 2].map(Math.log10)} format={(v) => String(Number((10 ** v).toPrecision(2)))} symbol="σ" />
      <Axis side="left" ticks={3} format={(v) => f0(v)} symbol="log-verosimiglianza" />
    </Plot>
  )

  const terrain = (
    <div ref={terrainRef} className={`absolute inset-0 grid ${narrow ? 'grid-rows-[1.35fr_1fr]' : 'grid-cols-[1.15fr_1fr]'}`}>
      <div className="relative min-h-0 min-w-0">{show3d ? surface : plane}</div>
      <div className={`relative min-h-0 min-w-0 ${narrow ? 'border-t' : 'border-l'} border-border`}>{looPlot}</div>
      {examPhase > 0 ? (
        <OverlayCard title="Disegno d'esame" className={narrow ? 'inset-x-2 top-2' : 'top-3 left-3 w-[min(30rem,70%)]'}>
          <ExamDrawing phase={examPhase} sigma={sigma} />
          {examPhase >= 3 ? <M tex={String.raw`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\|\mathbf{x}-\mathbf{x}_k\|^2}{2\sigma^2}\right)`} display /> : null}
        </OverlayCard>
      ) : null}
    </div>
  )

  const controls = (
    <>
      <LogSlider id={`${uid}-s`} label="Deviazione standard del kernel" latex="\sigma" values={SIGMA_STEPS} value={sigma} onChange={onSigma} format={formatH} />
      <div className="grid gap-1">
        <Toggle id={`${uid}-circ`} label="Cerchi di raggio σ" checked={showCircles} onChange={setShowCircles} />
        <Toggle id={`${uid}-map`} label="Mappa di calore della stima" checked={showMap} onChange={setShowMap} />
        <Toggle id={`${uid}-3d`} label="Vista 3-D" checked={show3d} onChange={setView3d} />
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          onClick={() => {
            sb.goto(LOO)
            sb.play()
          }}
        >
          Trova σ con leave-one-out
        </ActionButton>
        <ActionButton onClick={() => sb.goto(EXAM)}>Disegno d'esame</ActionButton>
      </div>
      <div className="grid gap-2">
        <p className="label m-0">
          Pixel · <span className="num tracking-normal normal-case">N = {n}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={() => addPixel([probe[0], probe[1]])} disabled={n >= N_RANGE.max}>
            <Icon d="M5 12h14M12 5v14" />
            Aggiungi nella sonda
          </ActionButton>
          <ActionButton onClick={() => removePixel(nearest(probe, pixels))} disabled={n <= N_RANGE.min}>
            <Icon d="M5 12h14" />
            Togli il più vicino
          </ActionButton>
        </div>
        <p className="m-0 text-[length:var(--step--1)] text-muted">Sul piano: clic per aggiungere un pixel, clic su un pixel per toglierlo (N da {N_RANGE.min} a {N_RANGE.max}). La sonda si trascina o si sposta con le frecce.</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Stima nella sonda" latex="\hat p(\mathbf x)" value={p} format={f4} pinned />
        <Readout label="Coefficiente" latex="1/(2\pi\sigma^2)" value={coef2d(sigma)} format={f3} />
        <Readout label="σ della leave-one-out" latex="\sigma^*" value={best} format={f3} />
        <Readout label="Iperparametri" value="uno solo: σ" />
      </div>
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index, n, sigma, best)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <Legend
          items={[
            { kind: 'dot', color: classVar(0), label: 'pixel di vegetazione x_k' },
            { kind: 'line', color: 'var(--text)', label: 'curva di livello a una σ' },
            { kind: 'thick', color: 'var(--viz-estimate)', label: 'log-verosimiglianza leave-one-out' },
            { kind: 'line', color: 'var(--viz-boundary)', label: 'log-verosimiglianza sui dati di training' },
          ]}
        />
        <StaticFormula
          label="Slide p65 · Gaussian kernel with spherical symmetry (Specht method)"
          tex={String.raw`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\|\mathbf{x}-\mathbf{x}_k\|^2}{2\sigma^2}\right)`}
        />
        <FormulaBox
          label="Nella sonda, con n = 2 e i numeri"
          tex={String.raw`\hat{p}(\val{x1},\val{x2})=\frac{1}{\val[0]{N}}\cdot\val[3]{coef}\cdot\sum_{k=1}^{\val[0]{N}}\exp\left(-\frac{\|\mathbf{x}-\mathbf{x}_k\|^2}{\val[4]{twoS2}}\right)=\val[4]{p}`}
          values={values}
          announce
        />
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="I cinque addendi più grandi nella sonda">
          <table className="num w-full border-collapse text-right text-[length:var(--step--1)]">
            <caption className="label pb-1 text-left">I {TOP} addendi più grandi</caption>
            <thead>
              <tr className="border-b border-border-strong text-muted">
                <th scope="col" className="py-1 text-left font-normal">
                  pixel
                </th>
                <th scope="col" className="py-1 font-normal">
                  ‖x − x_k‖
                </th>
                <th scope="col" className="py-1 font-normal">
                  exp(−d²/2σ²)
                </th>
                <th scope="col" className="py-1 font-normal">
                  addendo
                </th>
              </tr>
            </thead>
            <tbody>
              {top.map((t) => (
                <tr key={t.index} className="border-b border-border">
                  <td className="py-0.5 text-left text-muted">{t.index + 1}</td>
                  <td className="py-0.5">{f3(t.dist)}</td>
                  <td className="py-0.5">{f4(t.e)}</td>
                  <td className="py-0.5">{f4(t.term)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          È la formula generale con <M tex="\gamma" /> normale standard n-dimensionale, <M tex="h = \sigma" /> e <M tex="V(h) = \sigma^n" />. Casi limite: <M tex="\sigma \to 0" /> riduce la stima a N impulsi
          sui campioni (overfitting estremo), <M tex="\sigma \to +\infty" /> la spalma su tutto il piano, piatta e sempre più bassa (underfitting estremo). Le feature vanno normalizzate prima (widget
          «Normalizza prima di stimare»): la stessa σ vale lungo tutte.
        </p>
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Segmented id={`${uid}-zone`} label="La tua σ è" options={(['overfitting', 'giusta', 'underfitting'] as const).map((z) => ({ value: z, label: z === 'giusta' ? 'in zona' : z }))} value={zone} onChange={setZone} />
        <Segmented id={`${uid}-exp`} label="Esponente di 2πσ²" options={EXPONENTS.map((e) => ({ value: e, label: e }))} value={exponent} onChange={setExponent} />
        <Segmented id={`${uid}-den`} label="Denominatore nell'esponenziale" options={DENOMINATORS.map((d) => ({ value: d, label: d === '\\sigma^2' ? 'σ²' : d === '2\\sigma^2' ? '2σ²' : 'σ/2' }))} value={denominator} onChange={setDenominator} />
      </div>
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={check} />
      {checkedValid !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Readout label="La tua σ" value={sigmaUser} format={formatH} />
          <Readout label="σ* leave-one-out" value={best} format={f3} pinned />
          <Readout label="Eri" value={ZONE_WORDS[zoneOf(sigmaUser, best)]} />
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={narrow ? 0.72 : 1.75} onReset={reset} transport={<PlayControls sb={sb} steps={STEPS} />} caption={captionBlock} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
