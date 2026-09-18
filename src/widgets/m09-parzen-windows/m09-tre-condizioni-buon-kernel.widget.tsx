// m09-tre-condizioni-buon-kernel: le tre condizioni per un "buon" kernel (concetti c22 massimo nell'origine, c23
// continuità, c24 decadimento a zero). Sopra la forma del kernel con le tre spie, sotto la stima sulle letture di un
// sensore con la soglia di anomalia. Tre interruttori rompono una condizione alla volta (anche insieme) e mostrano
// l'artefatto che ne nasce: un buco sopra i dati, i gradini e gli allarmi a scatti, densità dove non c'è nessun dato.
//
// STRUTTURA. Logica, dati e testi in condizioni.ts (con i test); qui i due terreni, i comandi, le spie e la sfida.
//
// MOTO. Storyboard: a ogni passo il kernel si trasforma nella forma guasta (700 ms, ease-in-out) e la stima lo
// segue; nel passo "trascina" la lettura isolata va a 60 °C e torna. Interruttori, slider, maniglie: nessuna
// animazione, il terreno segue subito la mano. Con reduced motion ogni passo mostra la forma d'arrivo.
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { easeInOut } from '../engines/density1d/density1d'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { LiveFormula } from '../kit/LiveFormula'
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
import { Toggle } from '../kit/Toggle'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import type { WidgetMeta } from '../types'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  CLUSTER,
  DOMAIN,
  GRID,
  H0,
  HEALTHY,
  H_RANGE,
  H_STEP,
  OUTLIER0,
  OUTLIER_RANGE,
  PATIENTS,
  STEP,
  STEPS,
  TEX_CONT,
  TEX_DECAY,
  TEX_LIVE,
  TEX_MAX,
  THRESHOLD0,
  THRESHOLD_RANGE,
  THRESHOLD_STEP,
  U_GRID,
  belowRuns,
  brokenOfStep,
  captionFor,
  conditionsOf,
  estimateAt,
  gammaOf,
  judge,
  localMinimaAt,
  outlierOfStep,
  samplesWith,
} from './condizioni'
import type { Broken, Cond } from './condizioni'
import { jumpPoints } from './parzen-lab'
import { JumpMarks, Lamp, Note, Rug, Verdict } from './parzen-lab-ui'

export const meta: WidgetMeta = {
  id: 'm09-tre-condizioni-buon-kernel',
  moduleId: 'm09-parzen-windows',
  title: 'Le tre condizioni per un «buon» kernel',
  concepts: ['c22', 'c23', 'c24'],
  scenario: 'sensori',
  scenarioNote: 'Rilevamento di anomalie su un sensore di temperatura industriale: 31 letture',
  size: 'M',
}

const f1 = fixed(1)
const f3 = fixed(3)
const f4 = fixed(4)
const n2 = (v: number) => Number(v.toFixed(2))
const MORPH_MS = 700
const K_TOP = 0.45

/** Il kernel a metà strada fra due configurazioni di guasti (combinazione convessa: a ogni istante area 1). */
const mixGamma = (a: Broken, b: Broken, t: number, h: number) => (u: number) => (1 - t) * gammaOf(u, a, h) + t * gammaOf(u, b, h)

// --- segni dei terreni ---

/** La soglia di anomalia: una linea ocra con bordino a inchiostro e la scritta. */
function Threshold({ t }: { t: number }) {
  const { y, innerWidth } = usePlot()
  return (
    <g data-threshold="" pointerEvents="none">
      <line x1={0} x2={innerWidth} y1={n2(y(t))} y2={n2(y(t))} stroke="var(--pin-contrast)" strokeWidth={3} />
      <line x1={0} x2={innerWidth} y1={n2(y(t))} y2={n2(y(t))} stroke="var(--pin)" strokeWidth={1.5} />
      <text className="label" x={innerWidth - 4} y={n2(y(t) - 5)} textAnchor="end" fontSize={10} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
        soglia
      </text>
    </g>
  )
}

/** Le zone sotto soglia (anomalie): velatura ocra chiara a tutta altezza. */
function AnomalyZones({ runs }: { runs: readonly [number, number][] }) {
  const { x, y } = usePlot()
  return (
    <g data-anomalies="" pointerEvents="none">
      {runs.map(([a, b], i) => (
        <rect key={i} data-anomaly="" x={n2(x(a))} y={0} width={n2(Math.max(1, x(b) - x(a)))} height={n2(y(0))} fill="var(--pin)" fillOpacity={0.14} />
      ))}
    </g>
  )
}

/** I buchi sopra i dati: un minimo della stima a meno di un grado da una lettura. */
function Holes({ at }: { at: readonly number[] }) {
  const { x, y } = usePlot()
  return (
    <g data-holes="" pointerEvents="none">
      {at.map((v, i) => (
        <g key={i} transform={`translate(${n2(x(v))},${n2(y(0) - 22)})`}>
          <path d="M0 0v14" stroke="var(--text)" strokeWidth={1.25} />
          <path d="M-4 9l4 6 4-6" fill="none" stroke="var(--text)" strokeWidth={1.25} />
          <text className="label" y={-4} textAnchor="middle" fontSize={10} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
            buco sopra il dato
          </text>
        </g>
      ))}
    </g>
  )
}

/** Il valore di γ(0) e il massimo del kernel, come spilli sulla forma. */
function KernelMarks({ g0, maxU, gmax }: { g0: number; maxU: number; gmax: number }) {
  const { x, y } = usePlot()
  return (
    <g pointerEvents="none">
      <rect x={n2(x(0)) - 4} y={n2(y(Math.min(g0, K_TOP))) - 4} width={8} height={8} fill="var(--pin)" stroke="var(--pin-contrast)" transform={`rotate(45 ${n2(x(0))} ${n2(y(Math.min(g0, K_TOP)))})`} />
      {Math.abs(maxU) > 1e-6 ? (
        <g>
          <circle cx={n2(x(maxU))} cy={n2(y(Math.min(gmax, K_TOP)))} r={5} fill="none" stroke="var(--text)" strokeWidth={1.5} />
          <text className="label" x={n2(x(maxU) + 8)} y={n2(y(Math.min(gmax, K_TOP)) - 6)} fontSize={10} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
            massimo
          </text>
        </g>
      ) : null}
    </g>
  )
}

/** Miniatura di una stima "malata" per la sfida: solo la curva, stessa scala per le tre. */
function MiniEstimate({ broken, label }: { broken: Broken; label: string }) {
  const W = 220
  const H = 70
  // la miniatura non cambia mai: si calcola una volta sola, non a ogni fotogramma del racconto
  const d = useMemo(() => {
    const s = samplesWith(OUTLIER0)
    const xs = GRID.filter((_, i) => i % 2 === 0)
    const top = 0.1
    return xs.map((v, i) => `${i === 0 ? 'M' : 'L'}${n2((v / 100) * W)},${n2(H - 4 - (Math.min(estimateAt(v, s, H0, broken), top) / top) * (H - 10))}`).join('')
  }, [broken])
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full border border-border bg-surface" role="img" aria-label={label}>
      <line x1={0} x2={W} y1={H - 4} y2={H - 4} stroke="var(--viz-axis)" />
      <path d={d} fill="none" stroke="var(--viz-estimate)" strokeWidth={2} />
    </svg>
  )
}

// --- il widget ---

type Answers = Record<'A' | 'B' | 'C', Cond | ''>
const NO_ANSWERS: Answers = { A: '', B: '', C: '' }
const WHY = {
  max: 'I punti vicini al campione contribuiscono di più.',
  cont: 'La pdf da stimare è continua.',
  decay: 'I punti lontani devono avere influenza trascurabile.',
}

export default function TreCondizioniBuonKernel() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [broken, setBroken] = useState<Broken>(HEALTHY)
  const [h, setH] = useState(H0)
  const [threshold, setThreshold] = useState(THRESHOLD0)
  const [outlier, setOutlier] = useState(OUTLIER0)
  const [probe, setProbe] = useState(60)
  const [takeover, setTakeover] = useState<number | null>(null)
  const [showWhy, setShowWhy] = useState(false)
  const [answers, setAnswers] = useState<Answers>(NO_ANSWERS)
  const [checked, setChecked] = useState<{ key: string; verdict: ReturnType<typeof judge> } | null>(null)

  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const free = takeover === at
  const imposed = free ? null : brokenOfStep(at)
  const target = imposed ?? broken
  // il passo precedente del racconto: da lì parte il morphing del kernel
  const from = imposed !== null && at > 0 ? (brokenOfStep(at - 1) ?? HEALTHY) : target
  const t = imposed !== null ? easeInOut(Math.min(1, (pr * steps[at].durationMs) / MORPH_MS)) : 1
  const gamma = mixGamma(from, target, t, h)
  const shownOutlier = at === STEP.trascina && !free ? outlierOfStep(pr) : outlier

  const samples = useMemo(() => samplesWith(shownOutlier), [shownOutlier])
  const ys = GRID.map((x) => samples.reduce((s, xk) => s + gamma((x - xk) / h), 0) / (samples.length * h))
  const pHere = samples.reduce((s, xk) => s + gamma((probe - xk) / h), 0) / (samples.length * h)
  const alarm = pHere < threshold
  const runs = belowRuns(GRID, ys, threshold)
  const cond = conditionsOf(target, h)
  const kPts = U_GRID.map((u) => [u, gamma(u)])
  const g0 = gamma(0)
  let maxU = 0
  let gmax = g0
  for (const u of U_GRID) {
    const v = gamma(u)
    if (v > gmax + 1e-12) {
      gmax = v
      maxU = u
    }
  }
  const holes = target.offCenter ? localMinimaAt(GRID, ys).filter((m) => samples.some((s) => Math.abs(s - m) < 1) && m > 55) : []
  const yTop = Math.max(0.06, 1.15 * Math.max(...ys))
  const belt = 0.14 * yTop

  // --- azioni ---
  const setFault = (key: keyof Broken, v: boolean) => {
    if (imposed !== null) {
      sb.pause()
      setTakeover(at)
      setBroken({ ...target, [key]: v })
    } else setBroken((b) => ({ ...b, [key]: v }))
  }
  const repair = () => {
    setBroken(HEALTHY)
    setShowWhy(true)
    setTakeover(null)
    sb.goto(STEP.ripara)
    sb.play()
  }
  const moveOutlier = (v: number) => {
    if (at === STEP.trascina && !free) {
      sb.pause()
      setTakeover(at)
    }
    setOutlier(Number(Math.min(OUTLIER_RANGE[1], Math.max(OUTLIER_RANGE[0], v)).toFixed(1)))
  }
  const reset = () => {
    sb.reset()
    setBroken(HEALTHY)
    setH(H0)
    setThreshold(THRESHOLD0)
    setOutlier(OUTLIER0)
    setProbe(60)
    setTakeover(null)
    setShowWhy(false)
    setAnswers(NO_ANSWERS)
    setChecked(null)
  }

  const checkKey = `${answers.A}|${answers.B}|${answers.C}`
  const verify = () => setChecked({ key: checkKey, verdict: judge(answers) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'
  const why = showWhy || at === STEP.ripara

  const values = { x: probe, p: pHere, cmp: alarm ? '<' : '≥', t: threshold, g0, gmax }
  const pts = GRID.map((x, i) => [x, ys[i]])
  const summary = `31 letture, kernel${target.offCenter ? ' con il massimo fuori dall’origine' : ''}${target.jumpy ? ' discontinuo' : ''}${target.heavy ? ' che non decade a zero' : ''}${!target.offCenter && !target.jumpy && !target.heavy ? ' gaussiano' : ''}, h = ${f1(h)}. Nel punto sonda ${f1(probe)} °C la stima vale ${f4(pHere)}: ${alarm ? 'allarme' : 'nessun allarme'}. ${runs.length} zone sotto soglia.`

  const terrain = (
    <div className="absolute inset-0 grid grid-rows-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="relative min-h-0 border-b border-border">
        <Plot
          width={640}
          height={150}
          fill
          xDomain={[-6, 6]}
          yDomain={[0, K_TOP]}
          margin={{ top: 10, right: 12, bottom: 30, left: 46 }}
          ariaLabel="La forma del kernel γ(u)"
          description={`γ(0) = ${f3(g0)}, massimo ${f3(gmax)} in u = ${f1(maxU)}. ${cond.continuous ? 'Continuo' : 'Discontinuo'}, ${cond.decays ? 'decade a zero' : 'non decade a zero'}.`}
        >
          <Grid axis="y" yTicks={[0.2, 0.4]} />
          <LinePath data={U_GRID.map((u) => [u, gammaOf(u, HEALTHY, h)])} role="grid" width={1.5} />
          <LinePath data={kPts} role="kernel" width={2.5} />
          <KernelMarks g0={g0} maxU={maxU} gmax={gmax} />
          <Axis side="bottom" symbol="u" ticks={[-6, -3, 0, 3, 6]} />
          <Axis side="left" ticks={[0, 0.2, 0.4]} symbol="γ(u)" />
        </Plot>
      </div>
      <div className="relative min-h-0">
        <Plot
          width={640}
          height={300}
          fill
          xDomain={DOMAIN}
          yDomain={[-belt, yTop]}
          margin={{ top: 12, right: 12, bottom: 40, left: 52 }}
          ariaLabel="Stima sulle letture del sensore, con la soglia e le zone di anomalia"
          description={summary}
        >
          <Grid axis="y" />
          <AnomalyZones runs={runs} />
          <LinePath data={pts} role="estimate" width={2.5} />
          {target.jumpy && t >= 1 ? <JumpMarks at={jumpPoints(samples, h, DOMAIN)} /> : null}
          <Holes at={holes} />
          <Threshold t={threshold} />
          <Rug items={CLUSTER.map((v) => ({ x: v }))} bottom={-belt} from={yTop} />
          <Dots data={[{ x: shownOutlier, y: -belt * 0.45, id: 'o', label: 'Lettura isolata' }]} draggable axis="x" step={0.1} onDrag={(_id, v) => moveOutlier(v)} format={f1} />
          <Dots data={[{ x: probe, y: yTop * 0.92, id: 'p', label: 'Punto sonda' }]} draggable pin axis="x" step={0.5} onDrag={(_id, v) => setProbe(Number(v.toFixed(1)))} format={f1} />
          <Axis side="bottom" label="temperatura" symbol="x [°C]" />
          <Axis side="left" symbol="p̂(x)" format={fixed(3)} />
        </Plot>
      </div>
    </div>
  )

  const controls = (
    <>
      <div className="grid gap-1">
        <span className="label">Rompi una condizione</span>
        <Toggle id={`${uid}-b1`} label="1 · Massimo fuori dall'origine" hint="0.5 γ(u − 1.5) + 0.5 γ(u + 1.5)" checked={target.offCenter} onChange={(v) => setFault('offCenter', v)} />
        <Toggle id={`${uid}-b2`} label="2 · Kernel discontinuo" hint="il rettangolo al posto della gaussiana" checked={target.jumpy} onChange={(v) => setFault('jumpy', v)} />
        <Toggle id={`${uid}-b3`} label="3 · Non decade a zero" hint="0.8 γ(u) più una coda costante di area 0.2 su tutto l'asse" checked={target.heavy} onChange={(v) => setFault('heavy', v)} />
      </div>
      <ActionButton onClick={repair}>Ripara tutto</ActionButton>
      <ul className="m-0 grid list-none gap-1.5 p-0" aria-label="Spie delle tre condizioni">
        <Lamp ok={cond.maxAtOrigin} tex="\gamma(\mathbf{0})=\max\gamma" label="massimo nell'origine" en="maximal value at the origin" why={why ? WHY.max : undefined} />
        <Lamp ok={cond.continuous} tex="\gamma\ \text{continua}" label="continuo" en="continuous" why={why ? WHY.cont : undefined} />
        <Lamp ok={cond.decays} tex="\gamma(\mathbf{x})\to 0" label="decade a zero" en="γ(x) → 0 as x → +∞" why={why ? WHY.decay : undefined} />
      </ul>
      <Slider id={`${uid}-h`} label="Larghezza della finestra" latex="h" min={H_RANGE[0]} max={H_RANGE[1]} step={H_STEP} value={h} onChange={setH} format={f1} unit="°C" />
      <Slider id={`${uid}-t`} label="Soglia di anomalia" min={THRESHOLD_RANGE[0]} max={THRESHOLD_RANGE[1]} step={THRESHOLD_STEP} value={threshold} onChange={setThreshold} format={f3} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Stima nel punto sonda" latex="\hat p(x)" value={pHere} format={f4} pinned />
        <Readout label="Allarme" value={alarm ? 'anomalia' : 'normale'} />
        <Readout label="Kernel nell'origine" latex="\gamma(0)" value={g0} format={f3} />
        <Readout label="Massimo del kernel" latex="\max\gamma" value={gmax} format={f3} />
      </div>
      <Note>La lettura isolata (sul nastro) e il punto sonda (in alto) si trascinano, oppure si raggiungono con Tab e si spostano con le frecce.</Note>
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(sb.index, { h: f1(h), alarm, x: f1(probe) })} />
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">Nel punto sonda · anomaly threshold</span>
        <LiveFormula tex={TEX_LIVE} values={values} />
        <span className="label">Le tre condizioni aggiuntive · additional conditions to get a good estimate</span>
        <M tex={TEX_MAX} display />
        <M tex={TEX_CONT} display />
        <M tex={TEX_DECAY} display />
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <div className="grid gap-4 sm:grid-cols-3">
        {PATIENTS.map((p) => (
          <div key={p.id} className="grid gap-2">
            <MiniEstimate broken={p.broken} label={`Stima malata ${p.id}`} />
            <Segmented<Cond | ''>
              id={`${uid}-ans-${p.id}`}
              label={`Stima ${p.id}: viola`}
              options={[
                { value: 'massimo', label: 'massimo' },
                { value: 'continuita', label: 'continuità' },
                { value: 'decadimento', label: 'decadimento' },
              ]}
              value={answers[p.id]}
              onChange={(v) => setAnswers((a) => ({ ...a, [p.id]: v }))}
            />
          </div>
        ))}
      </div>
      {valid !== null ? (
        <div className="grid gap-2">
          {valid.verdict.per.map((r) => (
            <Verdict key={r.id} ok={r.ok}>
              Stima {r.id}: viola la condizione {r.answer === 'massimo' ? 'del massimo nell\'origine' : r.answer === 'continuita' ? 'di continuità' : 'di decadimento a zero'}.
            </Verdict>
          ))}
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={1.2} onReset={reset} transport={<PlayControls sb={sb} steps={steps} />} caption={caption} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
