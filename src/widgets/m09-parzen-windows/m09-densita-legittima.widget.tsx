// m09-densita-legittima: è davvero una densità? Area 1 e mai negativa (concetti c19 la stima deve essere una densità
// legittima, c20 il kernel deve essere una densità, c21 con V = hⁿ la stima eredita le due proprietà).
// La stima della frequenza cardiaca di 15 pazienti serve a calcolare P(a ≤ bpm ≤ b). Un misuratore integra la curva,
// quattro spie controllano γ ≥ 0, ∫γ = 1, p̂ ≥ 0, ∫p̂ = 1; tre guasti rompono una condizione alla volta; il cambio di
// variabile mostra perché 1/V cancella lo Jacobiano.
//
// STRUTTURA. Logica, dati e testi in legittima.ts (con i test); qui terreno, comandi, formule e sfida.
//
// MOTO. Storyboard: il misuratore si riempie in 1.5 s (una verticale scorre e integra), il cambio di variabile in 2 s
// (la campana si stringe e si alza, area ferma a 1), le spie si riaccendono in sequenza, 200 ms l'una. La scala
// verticale si adatta ai guasti in 200 ms (ease-out). Slider, interruttori e maniglie: nessuna animazione.
import { ticks as d3ticks } from 'd3'
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { kernelValue } from '../../lib/ml/nonparam'
import { linspace, trapz } from '../../lib/ml/stats'
import { easeInOut } from '../engines/density1d/density1d'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { LiveFormula } from '../kit/LiveFormula'
import { NumberField } from '../kit/NumberField'
import { PlayControls } from '../kit/PlayControls'
import { AreaPath } from '../kit/plot/AreaPath'
import { Axis } from '../kit/plot/Axis'
import { Dots } from '../kit/plot/Dots'
import { Grid } from '../kit/plot/Grid'
import { LinePath } from '../kit/plot/LinePath'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { Toggle } from '../kit/Toggle'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import type { WidgetMeta } from '../types'
import {
  AB0,
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  DOMAIN,
  GRID,
  H0,
  H_RANGE,
  H_STEP,
  NO_FAULTS,
  SAMPLES,
  STEP,
  STEPS,
  TEX_DERIVATION,
  TEX_ESTIMATE,
  TEX_JACOBIAN,
  TEX_KERNEL,
  TEX_LIVE,
  captionFor,
  changeWidth,
  estimate,
  faultsOfStep,
  judge,
  kernelArea,
  lampsFor,
  lampsOn,
  negativeRuns,
  probability,
  totalArea,
  volumeFactor,
} from './legittima'
import type { ChallengeVerdict, Faults } from './legittima'
import { useTween } from './parzen-lab-motion'
import { AreaMeter, Lamp, Note, Rug, Verdict } from './parzen-lab-ui'

export const meta: WidgetMeta = {
  id: 'm09-densita-legittima',
  moduleId: 'm09-parzen-windows',
  title: 'È davvero una densità? Area 1 e mai negativa',
  concepts: ['c19', 'c20', 'c21'],
  scenario: 'medicina',
  scenarioNote: 'Frequenza cardiaca a riposo (bpm) di 15 pazienti, per tarare un allarme di tachicardia',
  size: 'M',
}

const f1 = fixed(1)
const f3 = fixed(3)
const f4 = fixed(4)
const n2 = (v: number) => Number(v.toFixed(2))

// --- strati del terreno ---

/** Le zone in cui la stima scende sotto zero: velatura del colore dei valori negativi, con la scritta. */
function NegativeZones({ runs, xs, ys }: { runs: readonly [number, number][]; xs: readonly number[]; ys: readonly number[] }) {
  const { x, y, clipPath } = usePlot()
  if (runs.length === 0) return null
  return (
    <g data-negative="" clipPath={clipPath} pointerEvents="none">
      {runs.map(([a, b], i) => {
        const pts = xs.flatMap((v, j) => (v >= a && v <= b ? [[v, ys[j]]] : []))
        const d = `M${n2(x(a))},${n2(y(0))}L${pts.map((p) => `${n2(x(p[0]))},${n2(y(p[1]))}`).join('L')}L${n2(x(b))},${n2(y(0))}Z`
        return <path key={i} d={d} fill="var(--viz-negative)" fillOpacity={0.45} stroke="var(--viz-negative)" strokeWidth={1} />
      })}
    </g>
  )
}

/** La verticale che scorre mentre il misuratore integra. */
function Sweep({ at }: { at: number }) {
  const { x, innerHeight } = usePlot()
  return <line data-sweep="" x1={n2(x(at))} x2={n2(x(at))} y1={0} y2={innerHeight} stroke="var(--pin-contrast)" strokeWidth={1.5} strokeDasharray="3 3" pointerEvents="none" />
}

/**
 * Il riquadro del cambio di variabile: una campana (1/w)γ(v/w) con w = h^(1−t) su un asse fisso in v = x − x_k.
 * A t = 0 è la campana della stima (larga h, bassa); a t = 1 è γ(u) (larga 1, alta 0.399). L'area resta 1.
 */
function ChangeInset({ h, t }: { h: number; t: number }) {
  const W = 180
  const H = 110
  const w = changeWidth(h, t)
  const span = 3 * h
  const vs = linspace(-span, span, 161)
  const px = (v: number) => ((v + span) / (2 * span)) * W
  const py = (v: number) => H - 14 - (v / 0.45) * (H - 24)
  const d = vs.map((v, i) => `${i === 0 ? 'M' : 'L'}${n2(px(v))},${n2(py(kernelValue(v / w, 'gaussiano') / w))}`).join('')
  return (
    <figure className="pointer-events-none absolute top-2 right-2 m-0 grid gap-1 border border-border-strong bg-surface p-2 shadow-1" aria-hidden="true" data-inset="">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <path d={`${d}L${px(span)},${py(0)}L${px(-span)},${py(0)}Z`} fill="var(--viz-kernel)" fillOpacity={0.2} />
        <path d={d} fill="none" stroke="var(--viz-kernel)" strokeWidth={1.75} />
        <line x1={0} x2={W} y1={py(0)} y2={py(0)} stroke="var(--viz-axis)" />
        <text className="num" x={W / 2} y={py(0.2)} textAnchor="middle" fontSize={11} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
          area = 1
        </text>
        <text className="num" x={W - 2} y={H - 2} textAnchor="end" fontSize={10} fill="var(--text-muted)">
          {t < 0.5 ? 'x − x_k' : 'u = (x − x_k)/h'}
        </text>
      </svg>
      <figcaption className="label text-[10px]">
        larghezza <span className="num tracking-normal normal-case">{f3(w)}</span> · picco <span className="num tracking-normal normal-case">{f3(kernelValue(0, 'gaussiano') / w)}</span>
      </figcaption>
    </figure>
  )
}

// --- il widget ---

interface Checked {
  key: string
  verdict: ChallengeVerdict
}

export default function DensitaLegittima() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [h, setH] = useState(H0)
  const [faults, setFaults] = useState<Faults>(NO_FAULTS)
  const [ab, setAb] = useState<[number, number]>([AB0[0], AB0[1]])
  const [takeover, setTakeover] = useState<number | null>(null)
  const [ans1, setAns1] = useState(1)
  const [ans2, setAns2] = useState(1)
  const [checked, setChecked] = useState<Checked | null>(null)

  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const imposed = takeover === at ? null : faultsOfStep(at)
  const raw = imposed ?? faults
  // un oggetto stabile per ogni combinazione di guasti: i calcoli pesanti (l'area del sinc) non si rifanno a ogni fotogramma
  const fKey = `${raw.noVolume}|${raw.negative}|${raw.halfArea}`
  const f = useMemo<Faults>(() => ({ noVolume: fKey.startsWith('true'), negative: fKey.split('|')[1] === 'true', halfArea: fKey.endsWith('true') }), [fKey])

  const ys = useMemo(() => estimate(GRID, h, f), [h, f])
  const area = useMemo(() => totalArea(h, f), [h, f])
  const P = useMemo(() => probability(ab[0], ab[1], h, f), [ab, h, f])
  const minP = Math.min(...ys)
  const negRuns = negativeRuns(GRID, ys)
  const lamps = lampsFor(f, minP, area)
  const on = at === STEP.ripara ? lampsOn(pr) : 4

  // il misuratore: nel passo "misura" integra fino alla verticale che scorre
  const sweepX = at === STEP.misura ? DOMAIN[0] + (DOMAIN[1] - DOMAIN[0]) * easeInOut(pr) : null
  const partial = useMemo(() => {
    if (sweepX === null) return null
    const xs = GRID.filter((v) => v <= sweepX)
    return xs.length < 2 ? 0 : trapz(xs, ys.slice(0, xs.length))
  }, [sweepX, ys])
  const meterValue = partial ?? area

  // scala verticale adattiva (i guasti cambiano l'ordine di grandezza): si adatta in 200 ms
  const top = useTween(Math.max(0.04, 1.15 * Math.max(...ys)), 200)
  const bottom = useTween(Math.min(0, 1.2 * minP), 200)
  const belt = 0.14 * (top - bottom)
  const yTicks = d3ticks(bottom, top, 4)

  // --- azioni ---
  const takeOver = () => {
    if (faultsOfStep(at) !== null && takeover !== at) {
      sb.pause()
      setTakeover(at)
    }
  }
  const setFault = (key: keyof Faults, v: boolean) => {
    takeOver()
    setFaults((cur) => ({ ...(imposed ?? cur), [key]: v }))
  }
  const repair = () => {
    setFaults(NO_FAULTS)
    setTakeover(null)
    sb.goto(STEP.ripara)
    sb.play()
  }
  const showChange = () => {
    setTakeover(null)
    sb.goto(STEP.cambio)
    sb.play()
  }
  const reset = () => {
    sb.reset()
    setH(H0)
    setFaults(NO_FAULTS)
    setAb([AB0[0], AB0[1]])
    setTakeover(null)
    setAns1(1)
    setAns2(1)
    setChecked(null)
  }

  const checkKey = `${ans1}|${ans2}`
  const verify = () => setChecked({ key: checkKey, verdict: judge(ans1, ans2) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  const c = kernelArea(f) * volumeFactor(f, h)
  const values = { N: SAMPLES.length, c, area, a: Math.min(...ab), b: Math.max(...ab), P }
  const pts = GRID.map((v, i) => [v, ys[i]])
  const badP = P > 1 + 1e-9 || P < -1e-9
  const summary = `Stima della frequenza cardiaca con h = ${f1(h)} bpm${f.noVolume ? ', senza 1/V' : ''}${f.negative ? ', kernel con parti negative' : ''}${f.halfArea ? ', kernel di area 1/2' : ''}. Area totale ${f3(area)}; probabilità fra ${f1(values.a)} e ${f1(values.b)} bpm ${f3(P)}.${negRuns.length > 0 ? ' In alcune zone la stima è negativa.' : ''}`

  const terrain = (
    <div className="absolute inset-0">
      <Plot
        width={640}
        height={400}
        fill
        xDomain={DOMAIN}
        yDomain={[bottom - belt, top]}
        margin={{ top: 14, right: 12, bottom: 42, left: 52 }}
        ariaLabel="Stima di Parzen della frequenza cardiaca, con l'area fra a e b e le zone negative"
        description={summary}
      >
        <Grid axis="y" yTicks={yTicks} />
        <AreaPath data={pts} role="accent" xRange={[values.a, values.b]} opacity={0.35} />
        <NegativeZones runs={negRuns} xs={GRID} ys={ys} />
        <LinePath data={pts} role="estimate" width={2.5} />
        {sweepX !== null ? <Sweep at={sweepX} /> : null}
        <Rug items={SAMPLES.map((v) => ({ x: v }))} top={bottom} bottom={bottom - belt} from={top} />
        <Dots
          data={[
            { x: ab[0], y: bottom - belt * 0.35, id: 'a', label: 'Estremo a' },
            { x: ab[1], y: bottom - belt * 0.35, id: 'b', label: 'Estremo b' },
          ]}
          draggable
          pin
          axis="x"
          step={0.5}
          onDrag={(id, v) => setAb((cur) => (id === 'a' ? [Number(v.toFixed(1)), cur[1]] : [cur[0], Number(v.toFixed(1))]))}
          format={f1}
        />
        <Axis side="bottom" label="frequenza cardiaca" symbol="x [bpm]" />
        <Axis side="left" ticks={yTicks} symbol="p̂(x)" format={fixed(3)} />
      </Plot>
      {at === STEP.cambio ? <ChangeInset h={h} t={easeInOut(pr)} /> : null}
    </div>
  )

  const controls = (
    <>
      <Slider id={`${uid}-h`} label="Larghezza della finestra" latex="h" min={H_RANGE[0]} max={H_RANGE[1]} step={H_STEP} value={h} onChange={setH} format={f1} unit="bpm" />
      <div className="grid gap-1">
        <span className="label">Guasti</span>
        <Toggle id={`${uid}-f1`} label="Guasto 1: dimentico 1/V" hint="γ((x − x_k)/h) senza dividere per V = h" checked={f.noVolume} onChange={(v) => setFault('noVolume', v)} />
        <Toggle id={`${uid}-f2`} label="Guasto 2: kernel con parti negative" hint="sin(πu)/(πu), il sinc non al quadrato" checked={f.negative} onChange={(v) => setFault('negative', v)} />
        <Toggle id={`${uid}-f3`} label="Guasto 3: kernel di area 1/2" hint="rettangolo alto 1/2 su [−1/2, 1/2]" checked={f.halfArea} onChange={(v) => setFault('halfArea', v)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={showChange}>Mostra il cambio di variabile</ActionButton>
        <ActionButton onClick={repair}>Ripara tutto</ActionButton>
      </div>
      <ul className="m-0 grid list-none gap-1.5 p-0" aria-label="Spie delle condizioni">
        <Lamp ok={lamps.gammaNonNeg} pending={on < 1} tex="\gamma\ge 0" label="kernel non negativo" en="nonnegative" />
        <Lamp ok={lamps.gammaArea} pending={on < 2} tex="\textstyle\int\gamma=1" label="kernel di area 1" en="integrates to one" />
        <Lamp ok={lamps.pNonNeg} pending={on < 3} tex="\hat p\ge 0" label="stima non negativa" en="non-negativity" />
        <Lamp ok={lamps.pArea} pending={on < 4} tex="\textstyle\int\hat p=1" label="stima di area 1" en="normalization" />
      </ul>
      <AreaMeter value={meterValue} max={meterValue > 1.9 ? Math.ceil(meterValue * 1.2) : 2} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Probabilità fra a e b" latex="P(a\le x\le b)" value={P} format={f3} pinned />
        <Readout label="Minimo della stima" latex="\min\hat p" value={minP} format={f4} />
      </div>
      {badP ? <Verdict ok={false}>Questa "probabilità" è {P > 1 ? 'maggiore di 1' : 'negativa'}: con una stima che non è una densità legittima non ha senso.</Verdict> : null}
      <Note>Gli estremi a e b sono i due spilli sul nastro: si trascinano, oppure si raggiungono con Tab e si spostano con le frecce (mezzo bpm).</Note>
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(sb.index, { h: f1(h), area: f3(area), P: f3(P), N: SAMPLES.length })} />
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">Il misuratore in formula</span>
        <LiveFormula tex={TEX_LIVE} values={values} />
        <span className="label">Condizioni sul kernel · the window function itself a density</span>
        <M tex={TEX_KERNEL} display />
        <span className="label">Condizioni sulla stima · legitimate density function</span>
        <M tex={TEX_ESTIMATE} display />
        <span className="label">Perché valgono con V = hⁿ · it follows at once</span>
        <M tex={TEX_JACOBIAN} display />
        <M tex={TEX_DERIVATION} display />
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField id={`${uid}-a1`} label="(1) Area con il guasto 1, h = 8" min={0} max={40} step={0.1} value={ans1} onChange={setAns1} format={f1} />
        <NumberField id={`${uid}-a2`} label="(2) Area con i guasti 1 e 3, h = 8" min={0} max={40} step={0.1} value={ans2} onChange={setAns2} format={f1} />
      </div>
      {valid !== null ? (
        <div className="grid gap-2">
          <Verdict ok={valid.verdict.first}>(1) Senza 1/V ogni campana ha area h · ∫γ = 8 · 1: l'area totale è 8, cioè hⁿ con n = 1.</Verdict>
          <Verdict ok={valid.verdict.second}>(2) Con il kernel di area 1/2 e senza 1/V: 8 · 1/2 = 4.</Verdict>
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={1.45} onReset={reset} transport={<PlayControls sb={sb} steps={steps} />} caption={caption} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
