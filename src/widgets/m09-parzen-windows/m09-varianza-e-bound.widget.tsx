// Widget m09-varianza-e-bound ("Quanto trema la stima? Varianza misurata contro il bound"), concetti c47 e c48.
// La slide p60 limita la varianza della stima di Parzen: E{(p̂(x) − p̄̂(x))²} ≤ sup(γ)·p̄̂(x)/(N h_Nⁿ). Qui la
// varianza non si crede sulla parola: si simulano 300 giorni di letture in serra (training set indipendenti,
// a seed) e i valori p̂(x_0) cadono come mattoncini in un istogramma. La loro dispersione, misurata, sta sempre
// sotto il bound; il bound e la varianza vera (in forma chiusa) si muovono con N, h, il kernel e la dimensione n.
//
// STRUTTURA. Logica pura in varianza-e-bound.ts (con i test), teoria condivisa in proprieta/teoria.ts; qui stato,
// terreno, comandi, formule vive, sfida.
//
// MOTO. Lo storyboard fa scorrere i giorni (30 ms l'uno, 9 s) con il tempo dei fotogrammi del kit: Play, Pausa,
// Passo, Velocità e Reset governano tutto; con reduced motion il passo mostra subito i 300 giorni. Slider,
// selettori e trascinamento del punto sonda: nessuna animazione, il terreno segue subito la mano.
import { useDeferredValue, useId, useMemo, useState } from 'react'
import { ticks as d3ticks } from 'd3'
import { M } from '../../components/content/M'
import { linspace } from '../../lib/ml/stats'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Dots } from '../kit/plot/Dots'
import { Grid } from '../kit/plot/Grid'
import { LinePath } from '../kit/plot/LinePath'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { KERNEL_INFO } from '../engines/density1d'
import { CurveLabel } from '../engines/density1d/terrain'
import type { WidgetMeta } from '../types'
import type { Kernel } from '../../lib/ml/nonparam'
import { useNarrow } from './proprieta/hooks'
import { FormulaBox, Icon, Legend, LogSlider } from './proprieta/ui'
import {
  BRICK_BINS,
  DAYS,
  DAY_MS,
  DIMS,
  DOMAIN,
  FACTORS,
  H_RANGE,
  INITIAL,
  KERNELS,
  N_STEPS,
  X0_RANGE,
  bricks,
  dayCurve,
  daySamples,
  decimalsFor,
  empirical,
  estimateAt,
  expectedPeakBricks,
  histDomain,
  nearestFactor,
  relativeBound,
  requiredFactor,
  simulateDays,
  theoryAt,
  truthSlice,
  yMaxFor,
} from './varianza-e-bound'
import type { Dim, Params } from './varianza-e-bound'

export const meta: WidgetMeta = {
  id: 'm09-varianza-e-bound',
  moduleId: 'm09-parzen-windows',
  title: 'Quanto trema la stima? Varianza misurata contro il bound',
  concepts: ['c47', 'c48'],
  scenario: 'sensori',
  scenarioNote: 'Serra: ogni giorno N letture di temperatura e la stima della loro densità nel punto sonda x₀ = 22 °C',
  size: 'L',
}

const f0 = fixed(0)
const f1 = fixed(1)
const f2 = fixed(2)
const f3 = fixed(3)
const pct = (v: number) => `${Math.round(v * 100)}%`

const STEPS = [
  { id: 'quadro', label: 'Il quadro: un giorno, trecento giorni', durationMs: 1500 },
  { id: 'giorni', label: 'Trecento giorni di letture', durationMs: DAYS * DAY_MS },
  { id: 'barre', label: 'Varianza misurata e bound', durationMs: 1600 },
  { id: 'finestra', label: 'Quanti campioni nella finestra: N·hⁿ', durationMs: 1800 },
  { id: 'kernel', label: 'Il kernel conta con sup γ', durationMs: 1800 },
  { id: 'dimensione', label: 'Più dimensioni, finestra più vuota', durationMs: 2000 },
]

interface CaptionCtx {
  p: Params
  mean: number
  truth: number
}

function caption(index: number, { p, mean, truth }: CaptionCtx): string {
  switch (index) {
    case 0:
      return String.raw`Ogni giorno la serra registra $N = ${p.N}$ letture di temperatura e se ne stima la densità con Parzen. A sinistra la stima di **un** giorno, con il punto sonda $x_0 = ${f1(p.x0)}$ °C (trascinalo). A destra un mattoncino per giorno, nella posizione del suo valore $\hat p(x_0)$: la loro dispersione è la **varianza** della stima (*estimate variance*), cioè quanto la stima fluttua perché cambiano i campioni. Premi Play per ripetere i ${DAYS} giorni.`
    case 1:
      return String.raw`${DAYS} giorni, ${DAY_MS} ms l'uno: cambiano le letture (*training set*), la curva si ridisegna e il valore in $x_0$ trema. La linea continua a destra è la media dei mattoncini: si posa su $\bar{\hat p}(x_0) = E\{\hat p(x_0)\} = ${f3(mean)}$, non sulla densità vera $p(x_0) = ${f3(truth)}$ (tratteggiata). Quella distanza è il bias a $h$ finito; la larghezza della pila è la varianza.`
    case 2:
      return String.raw`Sotto l'istogramma, la varianza **misurata** sui giorni e il **bound** della slide: $E\{(\hat p(\mathbf x) - \bar{\hat p}(\mathbf x))^2\} \le \sup(\gamma(\cdot))\,\bar{\hat p}(\mathbf x)/(N h_N^n)$. Vale per ogni $N$ finito: servono solo campioni indipendenti e un kernel $\gamma \ge 0$ limitato, perché la dimostrazione usa $\gamma^2 \le \sup(\gamma)\,\gamma$. A destra c'è la media della stima $\bar{\hat p}$, non $p$ vera.`
    case 3:
      return String.raw`La varianza è inversamente proporzionale a $N$ e al volume della finestra $h_N^n$ (*inversely proportional to N and to the kernel volume*). $N h_N^n = ${f2(p.N * p.h ** p.n)}$ è il numero efficace di campioni che la finestra raccoglie: raddoppia $N$ e le due barre si dimezzano; dimezza $h$ e circa raddoppiano. Le cornici vuote ricordano il riferimento $N = 200$, $h = 0.5$.`
    case 4:
      return String.raw`$\sup(\gamma(\cdot))$ dice quanto un solo campione può spostare la stima: 1 per il rettangolare e il triangolare, 0.399 per il gaussiano, 0.5 per l'esponenziale, 0.318 per il Cauchy. Cambia il kernel e il bound si sposta. Con il gaussiano e $h$ piccolo il bound è circa 1.4 volte la varianza vera: il rapporto tende a $\sup\gamma/\int\gamma^2 = 0.399/0.282 = \sqrt 2$.`
    default:
      return String.raw`In $n$ dimensioni la finestra ha volume $h^n$: con $h = 0.5$ vale 0.5, 0.25, 0.125 per $n = 1, 2, 3$. A parità di $N = 200$ la finestra si svuota e il bound relativo (deviazione standard massima divisa per la media) sale dal 13% al 22% al 40%: è la maledizione della dimensionalità vista da Parzen. Prova il selettore $n$ (verità: normale isotropa con deviazione standard 1.5 per feature).`
  }
}

const PROMPT = String.raw`Hai dimezzato $h$ (da 0.5 a 0.25 °C) per vedere più dettaglio. Di quanto devi moltiplicare $N$ per riportare il **bound** della varianza al valore di prima, in 1-D? E in 3-D? Scegli i due fattori e premi Verifica: il widget li confronta con il rapporto calcolato dal bound nel punto $x_0 = 22$ °C.`
const HINT = String.raw`Il bound è proporzionale a $1/(N h_N^n)$: dimezzare $h$ divide $h^n$ per $2^n$. Per tenere fermo il prodotto $N h^n$, $N$ deve crescere dello stesso fattore. (La media $\bar{\hat p}$ cambia appena: il fattore esatto è un po' più grande della potenza di 2.)`

/** Mattoncini dei giorni: uno per giorno, impilati nel bin del loro valore; l'ultimo porta lo spillo. */
function BrickLayer({ values, count, domain, top }: { values: readonly number[]; count: number; domain: readonly [number, number]; top: number }) {
  const { x, y, clipPath } = usePlot()
  const list = bricks(values, count, domain)
  const w = (domain[1] - domain[0]) / BRICK_BINS
  const bh = Math.max(1, y(0) - y(1))
  return (
    <g data-bricks="" clipPath={clipPath} pointerEvents="none">
      {list.map((b, i) => {
        if (b.level >= top) return null
        const x0 = x(domain[0] + b.bin * w)
        const x1 = x(domain[0] + (b.bin + 1) * w)
        const last = i === list.length - 1
        return (
          <rect
            key={i}
            data-brick={i}
            x={x0 + 1}
            y={y(b.level + 1) + 0.5}
            width={Math.max(1, x1 - x0 - 2)}
            height={Math.max(0.5, bh - 1)}
            fill={last ? 'var(--pin)' : 'var(--viz-kernel)'}
            fillOpacity={last ? 1 : 0.55}
            stroke={last ? 'var(--pin-contrast)' : 'none'}
          />
        )
      })}
    </g>
  )
}

/** Verticale con etichetta a inchiostro: media dei giorni (continua) o densità vera (tratteggiata). */
function VLine({ at, dashed = false, label, side = 'right' }: { at: number; dashed?: boolean; label: string; side?: 'left' | 'right' }) {
  const { x, innerHeight, innerWidth } = usePlot()
  const px = x(at)
  if (!Number.isFinite(px) || px < 0 || px > innerWidth) return null
  return (
    <g pointerEvents="none">
      <line x1={px} x2={px} y1={0} y2={innerHeight} stroke={dashed ? 'var(--viz-truth)' : 'var(--viz-boundary)'} strokeWidth={dashed ? 1.75 : 2} strokeDasharray={dashed ? '6 4' : undefined} />
      <text
        className="num"
        fontSize={11}
        fontWeight={600}
        x={px + (side === 'right' ? 5 : -5)}
        y={dashed ? 14 : 30}
        textAnchor={side === 'right' ? 'start' : 'end'}
        fill="var(--text)"
        stroke="var(--surface)"
        strokeWidth={3}
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  )
}

interface BarRowProps {
  label: string
  value: number
  refValue: number
  max: number
  color: string
  decimals: number
  showRef: boolean
}

/** Barra orizzontale di una grandezza, con la cornice vuota del riferimento. Cambia subito: è una misura. */
function BarRow({ label, value, refValue, max, color, decimals, showRef }: BarRowProps) {
  const w = max > 0 ? Math.min(1, value / max) : 0
  const r = max > 0 ? Math.min(1, refValue / max) : 0
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-center gap-2">
      <span className="label truncate text-[length:var(--step--1)]">{label}</span>
      <span className="relative block h-4 border border-border bg-surface-2">
        <span className="absolute inset-y-0 left-0 origin-left" style={{ width: '100%', transform: `scaleX(${w})`, background: color }} />
        {showRef ? <span aria-hidden="true" className="absolute inset-y-[-3px] border-2 border-border-strong" style={{ left: 0, width: `${r * 100}%` }} /> : null}
        <span className="num absolute inset-y-0 right-1 flex items-center text-[11px] text-text [text-shadow:0_0_3px_var(--surface)]">{fixed(decimals)(value)}</span>
      </span>
    </div>
  )
}

export default function M09VarianzaEBound() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [params, setParams] = useState<Params>(INITIAL)
  const [seed, setSeed] = useState(1)
  const [answer1, setAnswer1] = useState<string>('1')
  const [answer3, setAnswer3] = useState<string>('1')
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [terrainRef, narrow] = useNarrow(620)

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const set = (patch: Partial<Params>) => setParams((p) => ({ ...p, ...patch }))

  // la simulazione dei giorni costa (fino a 300 × 2000 × 3 valori): segue i comandi con un render di ritardo
  const deferred = useDeferredValue(params)
  const deferredSeed = useDeferredValue(seed)
  const values = useMemo(() => simulateDays(deferred, deferredSeed), [deferred, deferredSeed])

  const st = theoryAt(params)
  const ref = theoryAt({ ...INITIAL, x0: params.x0, kernel: params.kernel, n: params.n })
  const days = sb.index === 1 ? Math.max(1, Math.min(DAYS, Math.floor(progress * DAYS) + 1)) : DAYS
  const emp = empirical(values, days)
  const dayIdx = days - 1
  const dayPts = useMemo(() => daySamples(params, seed, dayIdx), [params, seed, dayIdx])
  const xs = useMemo(() => linspace(DOMAIN[0], DOMAIN[1], 241), [])
  const curve = dayCurve(xs, dayPts, params.h, params.kernel, params.n)
  const today = estimateAt(params.x0, dayPts, params.h, params.kernel, params.n)
  const truthPts = useMemo(() => xs.map((x) => [x, truthSlice(x, params.n)]), [xs, params.n])
  const truthX0 = truthSlice(params.x0, params.n)
  const yMax = yMaxFor(params.n)

  const hd = histDomain(st)
  const top = Math.max(8, Math.ceil(expectedPeakBricks(st, hd) * 1.3))
  const barMax = Math.max(st.bound, ref.bound, Number.isFinite(emp.variance) ? emp.variance : 0) * 1.08
  const isRef = params.N === INITIAL.N && params.h === INITIAL.h
  const dVar = decimalsFor(st.bound)
  const dMean = decimalsFor(st.mean)
  const dSup = decimalsFor(st.sup)

  const values2 = {
    varEmp: emp.variance,
    varTrue: st.variance,
    bound: st.bound,
    sup: st.sup,
    mean: st.mean,
    N: params.N,
    h: params.h,
    n: params.n,
    nhn: st.nhn,
    days,
  }
  const texBound = String.raw`\begin{aligned}E\left\{\left(\hat{p}(\mathbf{x})-\bar{\hat{p}}(\mathbf{x})\right)^2\right\}&\le\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}\\ \underbrace{\val[${dVar}]{varEmp}}_{\text{misurata}}\approx\underbrace{\val[${dVar}]{varTrue}}_{\text{vera}}&\le\frac{\val[${dSup}]{sup}\cdot\val[${dMean}]{mean}}{\val[0]{N}\cdot\val{h}^{\val[0]{n}}}=\val[${dVar}]{bound}\end{aligned}`
  const texNhn = String.raw`N h_N^n=\val[0]{N}\cdot\val{h}^{\val[0]{n}}=\val{nhn}\qquad \operatorname{var}\{\hat{p}(\mathbf{x})\}\ \propto\ \frac{1}{N h_N^n}`

  // --- sfida ---
  const need1 = requiredFactor(1)
  const need3 = requiredFactor(3)
  const checkKey = `${answer1}|${answer3}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'
  const check = () => setChecked({ key: checkKey, ok: Number(answer1) === nearestFactor(need1) && Number(answer3) === nearestFactor(need3) })

  const reset = () => {
    sb.reset()
    setParams(INITIAL)
    setSeed(1)
    setAnswer1('1')
    setAnswer3('1')
    setChecked(null)
  }

  const info = KERNEL_INFO[params.kernel]
  const summary = `Giorno ${days} di ${DAYS}: stima in x0 = ${f1(params.x0)} °C pari a ${today.toFixed(4)}. Varianza misurata ${emp.variance.toExponential(2)}, varianza vera ${st.variance.toExponential(2)}, bound ${st.bound.toExponential(2)}.`

  const leftPlot = (
    <Plot
      width={420}
      height={360}
      fill
      xDomain={DOMAIN}
      yDomain={[0, yMax]}
      margin={{ top: 24, right: 10, bottom: 40, left: 50 }}
      ariaLabel="La stima di Parzen di un giorno, con il punto sonda x₀"
      description={`Asse orizzontale: temperatura da 14 a 32 °C. Tratteggiata la densità vera, continua la stima del giorno. ${summary}`}
    >
      <Grid axis="y" yTicks={d3ticks(0, yMax, 4)} />
      <LinePath data={truthPts} role="truth" />
      <LinePath data={xs.map((x, i) => [x, curve[i]])} role="estimate" width={2.5} />
      <ProbeLine x0={params.x0} p={today} />
      <Dots
        data={[{ x: params.x0, y: 0, id: 'x0', label: 'Punto sonda x₀' }]}
        draggable
        pin
        axis="x"
        step={0.1}
        format={(v) => `${f1(v)} °C`}
        onDrag={(_id, nx) => set({ x0: Math.min(X0_RANGE[1], Math.max(X0_RANGE[0], Math.round(nx * 10) / 10)) })}
      />
      <CurveLabel at={[params.x0 + 1.2, Math.min(yMax * 0.92, today)]} text="p̂ del giorno" />
      <Axis side="bottom" label="temperatura" symbol={params.n === 1 ? 'x [°C]' : 'x₁ [°C]'} />
      <Axis side="left" ticks={d3ticks(0, yMax, 4)} symbol="p̂(x)" />
    </Plot>
  )

  const histPlot = (
    <Plot
      width={380}
      height={260}
      fill
      xDomain={hd}
      yDomain={[0, top]}
      margin={{ top: 24, right: 12, bottom: 40, left: 40 }}
      ariaLabel="Istogramma dei valori p̂(x₀) dei giorni simulati"
      description={`Un mattoncino per giorno. Media dei giorni ${f3(emp.mean)}, media teorica della stima ${f3(st.mean)}, densità vera in x0 ${f3(truthX0)}.`}
    >
      <BrickLayer values={values} count={days} domain={hd} top={top} />
      {truthX0 >= hd[0] && truthX0 <= hd[1] ? <VLine at={truthX0} dashed label="p(x₀) vera" side={truthX0 > emp.mean ? 'right' : 'left'} /> : null}
      <VLine at={emp.mean} label="media dei giorni" side={truthX0 > emp.mean ? 'left' : 'right'} />
      <Axis side="bottom" ticks={3} format={(v) => v.toFixed(decimalsFor(st.mean))} label="p̂(x₀) del giorno" />
      <Axis side="left" ticks={3} symbol="giorni" />
    </Plot>
  )

  const bars = (
    <div className="grid gap-1.5 px-2 pt-1 pb-2">
      <BarRow label="varianza misurata" value={emp.variance} refValue={ref.variance} max={barMax} color="var(--viz-kernel)" decimals={dVar} showRef={false} />
      <BarRow label="bound" value={st.bound} refValue={ref.bound} max={barMax} color="var(--viz-boundary)" decimals={dVar} showRef={!isRef} />
      <Legend
        className="text-muted"
        items={[
          { kind: 'bar', color: 'var(--viz-kernel)', label: 'misurata sui giorni' },
          { kind: 'bar', color: 'var(--viz-boundary)', label: 'sup γ · p̄̂ / (N hⁿ)' },
          ...(!isRef ? [{ kind: 'band' as const, color: 'var(--border-strong)', label: 'riferimento N = 200, h = 0.5' }] : []),
        ]}
      />
    </div>
  )

  const terrain = (
    <div ref={terrainRef} className={`absolute inset-0 grid ${narrow ? 'grid-rows-[1fr_1fr_auto]' : 'grid-cols-[1.1fr_1fr]'}`}>
      <div className="relative min-h-0 min-w-0">{leftPlot}</div>
      {narrow ? (
        <>
          <div className="relative min-h-0 min-w-0">{histPlot}</div>
          {bars}
        </>
      ) : (
        <div className="grid min-h-0 min-w-0 grid-rows-[1fr_auto]">
          <div className="relative min-h-0">{histPlot}</div>
          {bars}
        </div>
      )}
    </div>
  )

  const controls = (
    <>
      <Segmented
        id={`${uid}-kernel`}
        label="Kernel γ"
        options={KERNELS.map((k) => ({ value: k, label: KERNEL_INFO[k].it }))}
        value={params.kernel}
        onChange={(k: Kernel) => set({ kernel: k })}
      />
      <LogSlider id={`${uid}-N`} label="Letture al giorno" latex="N" values={N_STEPS} value={params.N} onChange={(v) => set({ N: v })} format={(v) => f0(v)} />
      <Slider id={`${uid}-h`} label="Larghezza della finestra" latex="h" min={H_RANGE.min} max={H_RANGE.max} step={H_RANGE.step} value={params.h} onChange={(v) => set({ h: v })} unit="°C" />
      <Segmented
        id={`${uid}-n`}
        label="Dimensione dello spazio (feature)"
        options={DIMS.map((d) => ({ value: String(d), label: `n = ${d}` }))}
        value={String(params.n)}
        onChange={(v) => set({ n: Number(v) as Dim })}
      />
      <Slider id={`${uid}-x0`} label="Punto sonda" latex="x_0" min={X0_RANGE[0]} max={X0_RANGE[1]} step={0.1} value={params.x0} onChange={(v) => set({ x0: v })} unit="°C" />
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => setSeed((s) => s + 1)}>
          <Icon d="M5 12a7 7 0 1 0 2-4.9M5 4v4h4" />
          Altri {DAYS} giorni
        </ActionButton>
      </div>
      <p className="m-0 text-[length:var(--step--1)] text-muted">
        Il punto sonda si trascina sul grafico di sinistra (o con le frecce, a fuoco sullo spillo). Kernel {info.it}: <span className="num">sup γ = γ(0) = {f3(st.sup ** (1 / params.n))}</span>
        {params.n > 1 ? <span className="num">, in {params.n}-D γ(0)ⁿ = {st.sup.toFixed(dSup)}</span> : null}.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Bound" value={st.bound} format={fixed(dVar)} pinned />
        <Readout label="Varianza misurata" value={emp.variance} format={fixed(dVar)} />
        <Readout label="Varianza vera" value={st.variance} format={fixed(dVar)} />
        <Readout label="Bound / varianza" value={st.bound / st.variance} format={f2} />
        <Readout label="Media della stima" latex="\bar{\hat p}(x_0)" value={st.mean} format={fixed(dMean)} />
        <Readout label="Campioni efficaci" latex="N h^n" value={st.nhn} format={f2} />
        <Readout label="Giorni simulati" value={days} format={f0} />
        <Readout label="Stima del giorno" latex="\hat p(x_0)" value={today} format={fixed(dMean)} />
      </div>
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index, { p: params, mean: st.mean, truth: truthX0 })} />
      <div className="grid gap-4 border-t border-border pt-3">
        <FormulaBox label="Bound sulla varianza · estimate variance is bounded by" tex={texBound} values={values2} announce />
        <FormulaBox label="Il numero efficace di campioni nella finestra" tex={texNhn} values={values2} />
        <div className="grid gap-1.5">
          <span className="label">
            Bound relativo <span className="num tracking-normal normal-case">√bound / p̄̂</span> con N = 200, h = 0.5, verità normale isotropa
          </span>
          {DIMS.map((d) => {
            const r = relativeBound(d)
            return (
              <div key={d} className="grid grid-cols-[4.5rem_minmax(0,1fr)_3rem] items-center gap-2 text-[length:var(--step--1)]">
                <span className="num">
                  n = {d} · V = {(0.5 ** d).toFixed(3)}
                </span>
                <span className="relative block h-3 border border-border bg-surface-2">
                  <span className="absolute inset-y-0 left-0 origin-left" style={{ width: '100%', transform: `scaleX(${Math.min(1, r / 0.5)})`, background: d === params.n ? 'var(--pin)' : 'var(--viz-boundary)' }} />
                </span>
                <span className="num text-right">{pct(r)}</span>
              </div>
            )
          })}
        </div>
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          Lettura della slide: <M tex="\bar{\hat p}(\mathbf x) = E\{\hat p(\mathbf x)\}" /> è la media della stima; <M tex="\sup(\gamma(\cdot))" /> l'estremo superiore del kernel. La slide dà
          solo il risultato (<em lang="en">it can be shown</em>); la dimostrazione di Duda-Hart somma le varianze di <M tex="N" /> termini indipendenti e usa{' '}
          <M tex="\gamma^2 \le \sup(\gamma)\,\gamma" />, lecito perché <M tex="\gamma \ge 0" />. Per <M tex="h_N \to 0" /> a <M tex="N" /> fisso il bound esplode; per{' '}
          <M tex="N \to +\infty" /> a <M tex="h" /> fisso si annulla, ma resta il bias.
        </p>
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Segmented id={`${uid}-a1`} label="In 1-D, N va moltiplicato per" options={FACTORS.map((f) => ({ value: String(f), label: `×${f}` }))} value={answer1} onChange={setAnswer1} />
        <Segmented id={`${uid}-a3`} label="In 3-D, N va moltiplicato per" options={FACTORS.map((f) => ({ value: String(f), label: `×${f}` }))} value={answer3} onChange={setAnswer3} />
      </div>
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={check} />
      {checkedValid !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Readout label="Fattore esatto in 1-D" value={need1} format={f2} pinned />
          <Readout label="Fattore esatto in 3-D" value={need3} format={f2} pinned />
          <Readout label="La potenza di 2 (1-D)" value={`×${nearestFactor(need1)}`} />
          <Readout label="La potenza di 2 (3-D)" value={`×${nearestFactor(need3)}`} />
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame
      meta={meta}
      aspect={narrow ? 0.62 : 2}
      onReset={reset}
      transport={<PlayControls sb={sb} steps={STEPS} />}
      caption={captionBlock}
      controls={controls}
      challenge={challenge}
    >
      {terrain}
    </WidgetFrame>
  )
}

/** La verticale del punto sonda fino alla stima del giorno, con lo spillo sulla curva. */
function ProbeLine({ x0, p }: { x0: number; p: number }) {
  const { x, y, clipPath, innerHeight } = usePlot()
  const px = x(x0)
  const py = Math.max(0, y(p))
  return (
    <g pointerEvents="none">
      <g clipPath={clipPath}>
        <line x1={px} x2={px} y1={innerHeight} y2={py} stroke="var(--viz-boundary)" strokeOpacity={0.6} strokeWidth={1} />
      </g>
      <rect x={px - 4.5} y={py - 4.5} width={9} height={9} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} transform={`rotate(45 ${px} ${py})`} />
    </g>
  )
}
