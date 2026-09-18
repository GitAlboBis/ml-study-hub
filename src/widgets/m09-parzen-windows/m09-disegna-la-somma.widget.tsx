// m09-disegna-la-somma: l'esercizio di lavagna con due campioni (concetti c71 disegno d'esame, c10 contributi
// rettangolari, c16 interpolazione). Melgani all'orale: «Graphical representation of how the counting/interpolation
// works with a couple of samples». Fase 1: lo studente posa due mattoncini sui salmoni e disegna la scaletta; fase 2:
// i mattoncini diventano campane e lo studente disegna la curva somma con sette punti. "Verifica il disegno" mostra la
// somma vera e dove il disegno sbaglia; la modalità orale estrae campioni e h a caso e dà 90 secondi.
//
// STRUTTURA. Logica, dati e testi in lavagna.ts (con i test); qui la lavagna, i comandi, le formule e la sfida.
//
// MOTO. Il racconto è lo storyboard: i mattoncini si posano (ease-in-out), cadono e si impilano (ease-in, la
// gravità), la finestra della controprova scorre in 4 s con la penna, i mattoncini diventano campane, h scende a 0.3.
// Trascinare mattoncini, gradini, punti e sonda: nessuna animazione (il mattoncino si aggancia al salmone subito).
// Il cronometro della prova orale usa il tempo dei fotogrammi del kit e si ferma a scheda nascosta.
import { useId, useMemo, useRef, useState } from 'react'
import { M } from '../../components/content/M'
import { linspace, trapz } from '../../lib/ml/stats'
import { easeIn, easeInOut, easeOut, kernelBands } from '../engines/density1d/density1d'
import { KernelBandsLayer } from '../engines/density1d/terrain'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { LiveFormula } from '../kit/LiveFormula'
import { NumberField } from '../kit/NumberField'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Dots } from '../kit/plot/Dots'
import { Grid } from '../kit/plot/Grid'
import { LinePath } from '../kit/plot/LinePath'
import { classVar } from '../kit/plot/marks'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { useAnimationFrame } from '../kit/useAnimationFrame'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import type { WidgetMeta } from '../types'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  DOMAIN,
  GAP_RANGE,
  H1,
  H2,
  H_RANGE,
  H_STEP,
  N,
  ORAL_MS,
  PARKED,
  SAMPLES0,
  SNAP,
  STEP,
  STEPS,
  TEX_COUNT,
  TEX_LIVE,
  TEX_RULES,
  TEX_TWO,
  X_STEP,
  brick,
  captionFor,
  controlXs,
  countK,
  curveError,
  intervals,
  judge,
  levelErrors,
  oneHump,
  oralScore,
  oralSetup,
  quotes,
  stairArea,
  stairError,
  sumAt,
  trueLevels,
} from './lavagna'
import type { ChallengeVerdict, HumpChoice, Phase } from './lavagna'
import { AreaMeter, Note, Reveal, Stamp, Verdict } from './parzen-lab-ui'

export const meta: WidgetMeta = {
  id: 'm09-disegna-la-somma',
  moduleId: 'm09-parzen-windows',
  title: "Disegna tu la somma: l'esercizio di lavagna con due campioni",
  concepts: ['c71', 'c10', 'c16'],
  scenario: 'pesce',
  scenarioNote: "All'apertura del turno l'impianto ha misurato la luminosità di due soli salmoni",
  size: 'M',
}

const f0 = fixed(0)
const f2 = fixed(2)
const f3 = fixed(3)
/** Quota minima dell'asse verticale; con h piccolo si alza per contenere i mattoncini (le altezze 1/(Nh) crescono). */
const Y_MIN_TOP = 0.8
const BELT = 0.12
/** In aria, i mattoncini non posati stanno a questa frazione dell'asse. */
const FLOAT_AT = 0.55
/** Un colore e una forma per salmone: quadrato blu e rombo verde-acqua. */
const CLS = [1, 3] as const
const n2 = (v: number) => Number(v.toFixed(2))
const GRID = linspace(DOMAIN[0], DOMAIN[1], 481)
/** Griglia larga per l'area: le code delle campane escono dalla lavagna. */
const WIDE = linspace(DOMAIN[0] - 6, DOMAIN[1] + 6, 2401)

// --- strati della lavagna ---

/** Un mattoncino: base h, alto 1/(Nh), sollevato di `lift` (in aria finché non è posato). */
function Brick({ c, h, lift, cls, landed }: { c: number; h: number; lift: number; cls: number; landed: boolean }) {
  const { x, y, clipPath } = usePlot()
  const top = lift + 1 / (N * h)
  return (
    <g data-brick={landed ? 'posato' : 'in-aria'} clipPath={clipPath} pointerEvents="none">
      <rect x={n2(x(c - h / 2))} y={n2(y(top))} width={n2(x(c + h / 2) - x(c - h / 2))} height={n2(y(lift) - y(top))} fill={classVar(cls)} fillOpacity={landed ? 0.25 : 0.12} stroke={classVar(cls)} strokeWidth={1.5} strokeDasharray={landed ? undefined : '0'} />
      {!landed ? <line x1={n2(x(c))} x2={n2(x(c))} y1={n2(y(lift))} y2={n2(y(0))} stroke={classVar(cls)} strokeWidth={1} strokeOpacity={0.4} /> : null}
    </g>
  )
}

/** Una campana (fase 2) o un mattoncino che la diventa: (1/(Nh)) γ_t((x − x_k)/h). */
function Bell({ xk, h, t, cls }: { xk: number; h: number; t: number; cls: number }) {
  const { x, y, clipPath } = usePlot()
  const pts = GRID.map((v) => {
    const r = brick(v, xk, h, 1)
    const g = brick(v, xk, h, 2)
    return [n2(x(v)), n2(y((1 - t) * r + t * g))]
  })
  const d = `M${pts.map((p) => p.join(',')).join('L')}`
  return (
    <g data-bell="" clipPath={clipPath} pointerEvents="none">
      <path d={`${d}L${pts[pts.length - 1][0]},${n2(y(0))}L${pts[0][0]},${n2(y(0))}Z`} fill={classVar(cls)} fillOpacity={0.15} />
      <path d={d} fill="none" stroke={classVar(cls)} strokeWidth={1.5} />
    </g>
  )
}

/** Il disegno dello studente: tratti di gesso (inchiostro tenue, spessi) e, se verificato, le crocette sui gradini sbagliati. */
function ChalkSteps({ iv, levels, wrong }: { iv: readonly [number, number][]; levels: readonly number[]; wrong: readonly boolean[] | null }) {
  const { x, y } = usePlot()
  return (
    <g data-chalk="" pointerEvents="none">
      {iv.map(([a, b], i) => (
        <g key={i}>
          <line x1={n2(x(a))} x2={n2(x(b))} y1={n2(y(levels[i] ?? 0))} y2={n2(y(levels[i] ?? 0))} stroke="var(--text-muted)" strokeWidth={4} strokeLinecap="butt" strokeOpacity={0.8} />
          {wrong?.[i] ? (
            <g transform={`translate(${n2(x((a + b) / 2))},${n2(y(levels[i] ?? 0) - 14)})`} data-wrong="">
              <circle r={8} fill="var(--warn-bg)" stroke="var(--warn)" strokeWidth={1.5} />
              <path d="M-3.5 -3.5L3.5 3.5M-3.5 3.5L3.5 -3.5" stroke="var(--warn)" strokeWidth={2} />
            </g>
          ) : null}
        </g>
      ))}
    </g>
  )
}

/** La curva disegnata dallo studente per i sette punti. */
function ChalkCurve({ xs, ys }: { xs: readonly number[]; ys: readonly number[] }) {
  const { x, y } = usePlot()
  const d = `M${xs.map((v, i) => `${n2(x(v))},${n2(y(ys[i]))}`).join('L')}`
  return <path data-chalk-curve="" d={d} fill="none" stroke="var(--text-muted)" strokeWidth={3} strokeOpacity={0.8} strokeLinejoin="round" pointerEvents="none" />
}

/** Valori notevoli della somma vera, scritti sopra i punti. */
function Notables({ xs, samples, h }: { xs: readonly number[]; samples: readonly number[]; h: number }) {
  const { x, y } = usePlot()
  return (
    <g data-notables="" pointerEvents="none">
      {xs.map((v, i) =>
        i % 2 === 0 || i === 3 ? (
          <text key={i} className="num" x={n2(x(v))} y={n2(y(sumAt(v, samples, h, 2)) - 10)} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
            {f3(sumAt(v, samples, h, 2))}
          </text>
        ) : null,
      )}
    </g>
  )
}

/** La finestra della controprova: lato h centrata nel punto che scorre. */
function SweepWindow({ c, h, top }: { c: number; h: number; top: number }) {
  const { x, y } = usePlot()
  return <rect data-sweep="" x={n2(x(c - h / 2))} y={n2(y(top))} width={n2(x(c + h / 2) - x(c - h / 2))} height={n2(y(0) - y(top))} fill="var(--pin)" fillOpacity={0.22} stroke="var(--pin-contrast)" strokeWidth={1.25} pointerEvents="none" />
}

function BeltStrip({ depth }: { depth: number }) {
  const { y, innerWidth } = usePlot()
  return (
    <g pointerEvents="none">
      <rect x={0} y={n2(y(0))} width={innerWidth} height={n2(y(-depth) - y(0))} fill="var(--surface-2)" />
      <line x1={0} x2={innerWidth} y1={n2(y(0))} y2={n2(y(0))} stroke="var(--viz-axis)" />
    </g>
  )
}

// --- il widget ---

interface Oral {
  seed: number
  elapsed: number
  done: boolean
  score: number | null
}

interface Checked {
  key: string
  verdict: ChallengeVerdict
}

const levelKey = (s: readonly number[], h: number) => `${s[0]},${s[1]},${h}`

export default function DisegnaLaSomma() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [samples, setSamples] = useState<[number, number]>([SAMPLES0[0], SAMPLES0[1]])
  const [phase, setPhase] = useState<Phase>(1)
  const [h1, setH1] = useState(H1)
  const [h2, setH2] = useState(H2)
  const [bricks, setBricks] = useState<[number, number]>([PARKED[0], PARKED[1]])
  const [levels, setLevels] = useState<{ key: string; values: number[] }>({ key: '', values: [] })
  const [curve, setCurve] = useState<number[]>(() => new Array<number>(7).fill(0))
  const [revealed, setRevealed] = useState<{ 1: string | null; 2: string | null }>({ 1: null, 2: null })
  const [probe, setProbe] = useState(2.5)
  const [takeover, setTakeover] = useState<number | null>(null)
  const [oral, setOral] = useState<Oral | null>(null)
  const [choice, setChoice] = useState<HumpChoice>('')
  const [stepAnswer, setStepAnswer] = useState(0)
  const [checked, setChecked] = useState<Checked | null>(null)

  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const demo = at >= STEP.posa && at <= STEP.gobbe && takeover !== at

  // --- stato dell'utente ---
  const iv = intervals(samples, h1)
  const lk = levelKey(samples, h1)
  const userLevels = levels.key === lk ? levels.values : iv.map(() => 0)
  const landed = bricks.map((b) => samples.some((s) => Math.abs(b - s) < 1e-9))
  const bothLanded = landed[0] && landed[1] && Math.abs(bricks[0] - bricks[1]) > 1e-9
  const cxs = controlXs(samples)
  const shown1 = revealed[1] === lk
  const shown2 = revealed[2] === `${lk}|${h2}`

  // --- scena: il racconto o le mani dell'utente ---
  const view: Phase = demo ? (at >= STEP.campane ? 2 : 1) : phase
  const morph = demo && at === STEP.campane ? easeInOut(pr) : view === 2 ? 1 : 0
  const hView = demo ? (at === STEP.campane ? h1 + (h2 - h1) * easeInOut(pr) : at === STEP.gobbe ? Math.exp(Math.log(h2) + (Math.log(0.3) - Math.log(h2)) * easeInOut(pr)) : view === 1 ? h1 : h2) : view === 1 ? h1 : h2
  const demoBricks: [number, number] = at === STEP.posa ? [PARKED[0] + (samples[0] - PARKED[0]) * easeInOut(pr), PARKED[1] + (samples[1] - PARKED[1]) * easeInOut(pr)] : [samples[0], samples[1]]
  const brickPos = demo ? demoBricks : bricks
  const brickLanded = demo ? [at !== STEP.posa || pr >= 1, at !== STEP.posa || pr >= 1] : landed
  const stackT = demo ? (at === STEP.pila ? easeIn(pr) : at >= STEP.controprova ? 1 : 0) : shown1 ? 1 : 0
  const sweep = demo && at === STEP.controprova ? DOMAIN[0] + (DOMAIN[1] - DOMAIN[0]) * pr : null
  const showStair = view === 1 && (demo ? at >= STEP.pila : shown1)
  const showSum = view === 2 && (demo ? at >= STEP.somma : shown2)
  const sumReveal = demo && at === STEP.somma ? DOMAIN[0] + (DOMAIN[1] - DOMAIN[0]) * easeOut(pr) : DOMAIN[1]

  const trueStair = GRID.map((v) => [v, sumAt(v, samples, hView, 1)])
  const trueSum = GRID.map((v) => [v, sumAt(v, samples, hView, 2)])
  const bands = view === 1 && morph === 0 && brickLanded[0] && brickLanded[1] && stackT > 0 ? kernelBands(GRID, [...brickPos], hView, 'rettangolare', [1 / N, 1 / N], stackT) : []
  const K = sweep !== null ? countK(sweep, samples, hView) : countK(probe, samples, hView)

  // valori nel punto sonda (e durante la controprova, nel punto che scorre)
  const at0 = sweep ?? probe
  const a1 = brick(at0, samples[0], hView, view)
  const a2 = brick(at0, samples[1], hView, view)
  const values = { x: at0, h: hView, u1: (at0 - samples[0]) / hView, u2: (at0 - samples[1]) / hView, a1: a1 * N, a2: a2 * N, p: a1 + a2, K, pk: K / (N * hView) }
  const area = view === 1 ? stairArea(samples, hView) : trapz(WIDE, WIDE.map((v) => sumAt(v, samples, hView, 2)))
  // l'asse verticale contiene sempre i due mattoncini impilati (o il picco delle campane) e i mattoncini in aria
  const brickH = 1 / (N * hView)
  // un mattoncino in aria sta fra FLOAT_AT·yTop e FLOAT_AT·yTop + brickH: serve yTop ≥ brickH / (1 − FLOAT_AT)
  const yTop = view === 1 ? Math.max(Y_MIN_TOP, 1.15 * 2 * brickH, (1.05 * brickH) / (1 - FLOAT_AT)) : Math.max(Y_MIN_TOP, 1.15 * Math.max(...trueSum.map((p) => p[1])))
  const floatY = FLOAT_AT * yTop
  const yTicks = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5].filter((t) => t < yTop)

  // --- cronometro della prova orale ---
  const oralRunning = oral !== null && !oral.done
  // il tempo scorre nel ref a ogni fotogramma; lo stato (e il ridisegno) cambia solo quando cambia il secondo mostrato
  const oralClock = useRef(0)
  useAnimationFrame((dt) => {
    oralClock.current += dt
    const elapsed = Math.min(ORAL_MS, oralClock.current)
    setOral((o) => {
      if (o === null || o.done) return o
      if (elapsed >= ORAL_MS) return { ...o, elapsed: ORAL_MS, done: true }
      return Math.floor(elapsed / 1000) === Math.floor(o.elapsed / 1000) ? o : { ...o, elapsed }
    })
  }, oralRunning)
  const oralLeft = oral === null ? ORAL_MS : Math.max(0, ORAL_MS - oral.elapsed)
  const oralScoreNow = oral !== null && oral.done ? oralScore(stairError(userLevels, samples, h1), curveError(curve, samples, h2)) : null
  const oralFinished = oral !== null && oral.done

  // --- azioni ---
  const takeOver = () => {
    if (demo) {
      sb.pause()
      setTakeover(at)
    }
  }
  const moveBrick = (id: string, v: number) => {
    takeOver()
    const k = id === 'b0' ? 0 : 1
    const near = samples.find((s) => Math.abs(s - v) < SNAP)
    setBricks((b) => (k === 0 ? [near ?? v, b[1]] : [b[0], near ?? v]))
  }
  const moveSample = (id: string, v: number) => {
    takeOver()
    const k = id === 's0' ? 0 : 1
    const snapped = Number((Math.round(v / X_STEP) * X_STEP).toFixed(2))
    setSamples((s) => {
      const next: [number, number] = k === 0 ? [snapped, s[1]] : [s[0], snapped]
      const gap = Math.abs(next[1] - next[0])
      return gap < GAP_RANGE[0] - 1e-9 || gap > GAP_RANGE[1] + 1e-9 ? s : next
    })
  }
  const setLevel = (i: number, v: number) => {
    const q = quotes(h1)
    const nearest = q.reduce((best, c) => (Math.abs(c - v) < Math.abs(best - v) ? c : best), q[0])
    setLevels({ key: lk, values: userLevels.map((old, j) => (j === i ? nearest : old)) })
  }
  const setCurvePoint = (i: number, v: number) => setCurve((c) => c.map((old, j) => (j === i ? Math.max(0, Number(v.toFixed(2))) : old)))
  const verifyDrawing = () => {
    if (phase === 1) {
      setRevealed((r) => ({ ...r, 1: lk }))
      // controprova del conteggio, automatica
      setTakeover(null)
      sb.goto(STEP.controprova)
      sb.play()
    } else {
      setRevealed((r) => ({ ...r, 2: `${lk}|${h2}` }))
    }
  }
  const choosePhase = (p: Phase) => {
    takeOver()
    setPhase(p)
  }
  const startOral = () => {
    const seed = (oral?.seed ?? 0) + 1
    const o = oralSetup(seed)
    sb.pause()
    sb.goto(STEP.tocca)
    setTakeover(null)
    setSamples(o.samples)
    setH1(o.h1)
    setH2(o.h2)
    setPhase(1)
    setBricks([o.samples[0], o.samples[1]])
    setLevels({ key: '', values: [] })
    setCurve(new Array<number>(7).fill(0))
    setRevealed({ 1: null, 2: null })
    oralClock.current = 0
    setOral({ seed, elapsed: 0, done: false, score: null })
  }
  const submitOral = () => {
    setOral((o) => (o === null ? o : { ...o, done: true }))
    setRevealed({ 1: lk, 2: `${lk}|${h2}` })
  }
  const reset = () => {
    sb.reset()
    setSamples([SAMPLES0[0], SAMPLES0[1]])
    setPhase(1)
    setH1(H1)
    setH2(H2)
    setBricks([PARKED[0], PARKED[1]])
    setLevels({ key: '', values: [] })
    setCurve(new Array<number>(7).fill(0))
    setRevealed({ 1: null, 2: null })
    setProbe(2.5)
    setTakeover(null)
    setOral(null)
    setChoice('')
    setStepAnswer(0)
    setChecked(null)
  }

  const checkKey = `${choice}|${stepAnswer}`
  const verify = () => setChecked({ key: checkKey, verdict: judge(choice, stepAnswer) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  const wrong = shown1 ? levelErrors(userLevels, samples, h1) : null
  const humpsNow = oneHump(samples, hView) ? 1 : 2
  const hLabel = view === 1 ? 'fase 1' : 'fase 2'
  const summary = `Due salmoni in ${f2(samples[0])} e ${f2(samples[1])}. ${view === 1 ? `Conteggio con h = ${f2(hView)}: mattoncini alti ${f3(1 / (N * hView))}.` : `Interpolazione con h = ${f2(hView)}: ${humpsNow === 1 ? 'una sola gobba' : 'due gobbe'}.`} Nel punto ${f2(at0)} la stima vale ${f3(a1 + a2)}.`

  const terrain = (
    <div className="absolute inset-0">
      <Plot
        width={600}
        height={420}
        fill
        xDomain={DOMAIN}
        yDomain={[-BELT * yTop, yTop]}
        margin={{ top: 14, right: 12, bottom: 42, left: 46 }}
        ariaLabel="La lavagna: due salmoni, i loro mattoncini o le loro campane, il disegno e la somma vera"
        description={summary}
      >
        <Grid axis="y" yTicks={yTicks} />
        {sweep !== null ? <SweepWindow c={sweep} h={hView} top={yTop} /> : null}
        {view === 1 && morph === 0 ? (
          bands.length > 0 ? (
            <KernelBandsLayer xs={GRID} bands={bands} stack={stackT} />
          ) : (
            brickPos.map((c, k) => <Brick key={k} c={c} h={hView} lift={brickLanded[k] ? 0 : floatY} cls={CLS[k]} landed={brickLanded[k]} />)
          )
        ) : (
          samples.map((s, k) => <Bell key={k} xk={s} h={hView} t={morph} cls={CLS[k]} />)
        )}
        {view === 1 && !demo && bothLanded ? <ChalkSteps iv={iv} levels={userLevels} wrong={wrong} /> : null}
        {view === 2 && !demo ? <ChalkCurve xs={cxs} ys={curve} /> : null}
        {showStair ? (
          sweep !== null ? (
            <Reveal until={sweep}>
              <LinePath data={trueStair} role="estimate" width={2.5} />
            </Reveal>
          ) : (
            <LinePath data={trueStair} role="estimate" width={2.5} />
          )
        ) : null}
        {showSum ? (
          <Reveal until={sumReveal}>
            <LinePath data={trueSum} role="estimate" width={2.5} />
          </Reveal>
        ) : null}
        {showSum && sumReveal >= DOMAIN[1] ? <Notables xs={controlXs(samples)} samples={samples} h={hView} /> : null}
        <BeltStrip depth={BELT * yTop} />
        <Dots
          data={samples.map((s, k) => ({ x: s, y: -BELT * yTop * 0.4, cls: CLS[k], id: `s${k}`, label: `Salmone ${k + 1}` }))}
          draggable
          axis="x"
          step={X_STEP}
          onDrag={(id, v) => moveSample(id, v)}
          format={f2}
        />
        {view === 1 && !demo ? (
          <Dots
            data={bricks.map((b, k) => ({ x: b, y: (landed[k] ? 0 : floatY) + 1 / (N * h1), cls: CLS[k], id: `b${k}`, label: `Mattoncino ${k + 1}` }))}
            draggable
            axis="x"
            step={0.1}
            onDrag={(id, v) => moveBrick(id, v)}
            format={f2}
          />
        ) : null}
        {view === 1 && !demo && bothLanded ? (
          <Dots
            data={iv.map(([a, b], i) => ({ x: (a + b) / 2, y: userLevels[i] ?? 0, id: `l${i}`, label: `Gradino ${i + 1}` }))}
            draggable
            axis="y"
            step={[0.1, 1 / (N * h1)]}
            onDrag={(id, _x, v) => setLevel(Number(id.slice(1)), v)}
            format={f3}
          />
        ) : null}
        {view === 2 && !demo ? (
          <Dots data={cxs.map((v, i) => ({ x: v, y: curve[i], id: `c${i}`, label: `Punto ${i + 1} della curva` }))} draggable axis="y" step={[0.1, 0.01]} onDrag={(id, _x, v) => setCurvePoint(Number(id.slice(1)), v)} format={f3} />
        ) : null}
        <Dots data={[{ x: probe, y: -BELT * yTop * 0.82, id: 'probe', label: 'Punto sonda x' }]} draggable pin axis="x" step={X_STEP} onDrag={(_id, v) => setProbe(Number((Math.round(v / X_STEP) * X_STEP).toFixed(2)))} format={f2} />
        <Axis side="bottom" label="luminosità" symbol="x" />
        <Axis side="left" ticks={[0, ...yTicks]} symbol="p̂(x)" format={f2} />
      </Plot>
      {view === 2 ? <Stamp it={humpsNow === 1 ? 'Una sola gobba' : 'Due gobbe'} en={`|x₁ − x₂| ${humpsNow === 1 ? '≤' : '>'} 2h`} /> : null}
    </div>
  )

  const controls = (
    <>
      <Segmented
        id={`${uid}-phase`}
        label="Fase del disegno"
        options={[
          { value: '1', label: '1 · conteggio' },
          { value: '2', label: '2 · interpolazione' },
        ]}
        value={String(phase) as '1' | '2'}
        onChange={(v) => choosePhase(v === '1' ? 1 : 2)}
      />
      <Slider id={`${uid}-h`} label={`Larghezza della finestra, ${hLabel}`} latex="h" min={H_RANGE[0]} max={H_RANGE[1]} step={H_STEP} value={phase === 1 ? h1 : h2} onChange={phase === 1 ? setH1 : setH2} format={f2} />
      <div className="grid gap-2">
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          {phase === 1
            ? bothLanded
              ? 'Ora sposta in su o in giù i cinque gradini di gesso (frecce su e giù): ogni gradino può valere 0, uno o due mattoncini.'
              : 'Trascina i due mattoncini sui salmoni (o raggiungili con Tab e usa le frecce): si agganciano quando sono centrati.'
            : 'Sposta in su o in giù i sette punti di gesso (frecce su e giù) per disegnare la curva somma.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionButton variant="primary" onClick={verifyDrawing} disabled={phase === 1 && !bothLanded}>
            Verifica il disegno
          </ActionButton>
          <ActionButton onClick={startOral}>Modalità orale (90 s)</ActionButton>
          {oralRunning ? <ActionButton onClick={submitOral}>Consegna</ActionButton> : null}
        </div>
      </div>
      {oral !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border border-border-strong bg-surface-2 p-3">
          <Readout label="Tempo rimasto" value={`${f0(Math.floor(oralLeft / 60000))}:${String(Math.floor((oralLeft % 60000) / 1000)).padStart(2, '0')}`} pinned />
          <Readout label="Punteggio" value={oralScoreNow === null ? '—' : `${oralScoreNow}/100`} />
          {oralFinished ? (
            <p className="col-span-2 m-0 text-[length:var(--step--1)]">
              Da dire a voce: ogni campione porta area <M tex="1/N" />; nel conteggio pesa 1 o 0, nell'interpolazione in base alla distanza; con la gaussiana niente salti.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Salmone 1 in x" latex="\tfrac{1}{Nh}\gamma(u_1)" value={a1} format={f3} />
        <Readout label="Salmone 2 in x" latex="\tfrac{1}{Nh}\gamma(u_2)" value={a2} format={f3} />
        <Readout label="Stima nel punto" latex="\hat p(x)" value={a1 + a2} format={f3} pinned />
        <Readout label="Finestra di x" latex="K" value={K} format={f0} />
      </div>
      <div aria-hidden="true" className="grid gap-1.5">
        {[a1, a2].map((a, k) => (
          <div key={k} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
            <span className="label">salmone {k + 1}</span>
            <span className="relative h-3 border border-border bg-surface-2">
              <span className="absolute inset-y-0 left-0" style={{ width: `${Math.min(1, a / yTop) * 100}%`, background: classVar(CLS[k]) }} />
            </span>
          </div>
        ))}
      </div>
      <AreaMeter value={area} max={2} />
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption
        index={sb.index}
        total={steps.length}
        label={sb.step.label}
        text={captionFor(sb.index, { x1: f2(samples[0]), x2: f2(samples[1]), h1: f2(h1), h2: f2(h2), w1: f3(1 / (N * h1)), K, pk: f3(K / (N * hView)) })}
      />
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">Due campioni · a couple of samples</span>
        <M tex={TEX_TWO} display />
        <LiveFormula tex={TEX_LIVE} values={values} />
        <span className="label">Il conteggio e le due regole del disegno</span>
        <LiveFormula tex={TEX_COUNT} values={values} announce={false} />
        <M tex={TEX_RULES} display />
      </div>
      {wrong !== null && phase === 1 ? (
        <Verdict ok={wrong.every((w) => !w)}>
          {wrong.every((w) => !w)
            ? 'Scaletta giusta: 0, un mattoncino, due mattoncini, un mattoncino, 0.'
            : `Gradini da correggere: ${wrong.flatMap((w, i) => (w ? [String(i + 1)] : [])).join(', ')} (le quote vere sono ${trueLevels(samples, h1).map(f2).join(', ')}).`}
        </Verdict>
      ) : null}
      {shown2 && phase === 2 ? (
        <Verdict ok={curveError(curve, samples, h2) < 0.08}>
          Errore integrato fra la tua curva e la somma vera: <span className="num">{f3(curveError(curve, samples, h2))}</span>
          {curveError(curve, samples, h2) < 0.08 ? '. Ben disegnata.' : '. Confronta i valori notevoli scritti sulla curva.'}
        </Verdict>
      ) : null}
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <Segmented<HumpChoice>
        id={`${uid}-humps`}
        label="Due gobbe quando"
        options={[
          { value: 'lt05', label: 'h < 0.5' },
          { value: 'gt05', label: 'h > 0.5' },
          { value: 'lt1', label: 'h < 1' },
          { value: 'gt1', label: 'h > 1' },
        ]}
        value={choice}
        onChange={setChoice}
      />
      <NumberField id={`${uid}-top`} label="Gradino più alto con h = 0.5" min={0} max={4} step={0.05} value={stepAnswer} onChange={setStepAnswer} format={f2} />
      {valid !== null ? (
        <div className="grid gap-2">
          <Verdict ok={valid.verdict.ruleOk}>Due gobbe quando i salmoni distano più di 2h: con distanza 1, per h &lt; 0.5.</Verdict>
          <Verdict ok={valid.verdict.stepOk}>
            Con h = 0.5 i rettangoli [1.75, 2.25] e [2.75, 3.25] non si sovrappongono: il gradino più alto è un mattoncino solo, <span className="num">1/(N·h) = {f2(valid.verdict.top)}</span>.
          </Verdict>
        </div>
      ) : null}
      <Note>La sfida si risolve a mente: la lavagna serve dopo, per controllare.</Note>
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={1.35} onReset={reset} transport={<PlayControls sb={sb} steps={steps} />} caption={caption} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
