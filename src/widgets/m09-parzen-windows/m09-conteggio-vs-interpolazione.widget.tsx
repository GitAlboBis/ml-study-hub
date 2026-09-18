// m09-conteggio-vs-interpolazione: dal conteggio all'interpolazione, quanto pesa ogni campione (concetti c12 classe
// più generale di finestre, c13 gaussiana, Epanechnikov, triangolare, c14 stime lisce, c16 la finestra interpola).
// Tre letture di un sensore di temperatura: ognuna ha il suo kernel (colore e forma del segno), e dalla lettura al
// punto sonda parte la sua barra di contributo. "Generalizza la finestra" trasforma il rettangolo in triangolo,
// Epanechnikov e gaussiana; a ogni forma la penna ridisegna la stima e il buco fra le letture si riempie.
//
// STRUTTURA. Logica, dati e testi in conteggio-interp.ts (con i test); qui terreno, comandi, formule e sfida.
//
// MOTO. Il morphing è lo storyboard (800 ms di forma che cambia in ease-in-out, 1 s di penna, una breve pausa):
// Pausa, Passo e Velocità lo governano. Trascinare letture e sonda, cambiare kernel o h: nessuna animazione.
// Con reduced motion ogni passo mostra la forma d'arrivo e la stima intera.
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import type { Kernel } from '../../lib/ml/nonparam'
import { clippedPeaks } from '../engines/density1d/density1d'
import { KERNEL_INFO } from '../engines/density1d/kernelInfo'
import { ClippedMarks } from '../engines/density1d/terrain'
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
import { classSymbolPath, classVar } from '../kit/plot/marks'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import type { WidgetMeta } from '../types'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  DOMAIN,
  H0,
  H_RANGE,
  H_STEP,
  PROBE0,
  SAMPLES0,
  SEQUENCE,
  STEP,
  STEPS,
  TEX_EPAN,
  TEX_LIVE,
  X_STEP,
  captionFor,
  gridFor,
  judge,
  sceneAt,
  sceneEstimate,
  shapeAt,
  weightsTable,
  zeroRuns,
} from './conteggio-interp'
import type { ChallengeVerdict } from './conteggio-interp'
import { jumpPoints } from './parzen-lab'
import { JumpMarks, Note, Reveal, Stamp, Verdict } from './parzen-lab-ui'

export const meta: WidgetMeta = {
  id: 'm09-conteggio-vs-interpolazione',
  moduleId: 'm09-parzen-windows',
  title: "Dal conteggio all'interpolazione: quanto pesa ogni campione",
  concepts: ['c12', 'c13', 'c14', 'c16'],
  scenario: 'sensori',
  scenarioNote: 'Tre letture di temperatura di un sensore IoT in una cella frigorifera',
  size: 'M',
}

const f2 = fixed(2)
const f3 = fixed(3)
const Y_MAX = 0.6
const BELT = Y_MAX * 0.2
/** Una classe (colore e forma) per lettura: quadrato blu, triangolo terra, rombo verde-acqua. Mai il rosso della stima. */
const CLS = [1, 2, 3] as const
const n2 = (v: number) => Number(v.toFixed(2))
const KERNEL_LABEL: Record<Kernel, string> = {
  rettangolare: 'rettangolare',
  triangolare: 'triangolare',
  epanechnikov: 'Epanechnikov',
  gaussiano: 'gaussiano',
  esponenziale: 'esponenziale',
  cauchy: 'Cauchy',
  sinc2: 'sinc²',
}

// --- strati del terreno ---

/** Il kernel di ogni lettura, (1/(N h)) γ((x − x_k)/h), nel colore della sua lettura. */
function SampleKernels({ xs, samples, h, gamma }: { xs: readonly number[]; samples: readonly number[]; h: number; gamma: (u: number) => number }) {
  const { x, y, clipPath } = usePlot()
  const n = samples.length
  return (
    <g data-kernels="" clipPath={clipPath} pointerEvents="none">
      {samples.map((s, k) => {
        const pts = xs.map((v) => [n2(x(v)), n2(y(gamma((v - s) / h) / (n * h)))])
        const line = `M${pts.map((p) => p.join(',')).join('L')}`
        return (
          <g key={k} data-kernel={k}>
            <path d={`${line}L${pts[pts.length - 1][0]},${n2(y(0))}L${pts[0][0]},${n2(y(0))}Z`} fill={classVar(CLS[k % 3])} fillOpacity={0.1} />
            <path d={line} fill="none" stroke={classVar(CLS[k % 3])} strokeWidth={1.25} />
          </g>
        )
      })}
    </g>
  )
}

/** Fasce sul terreno: i buchi del conteggio (tratteggio a inchiostro) e le zone riempite dall'interpolazione. */
function Zones({ holes, filled }: { holes: readonly [number, number][]; filled: readonly [number, number][] }) {
  const { x, y, innerHeight } = usePlot()
  const id = `${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-hole`
  return (
    <g data-zones="" pointerEvents="none">
      <defs>
        <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={6} stroke="var(--text)" strokeWidth={1} strokeOpacity={0.45} />
        </pattern>
      </defs>
      {holes.map(([a, b], i) => (
        <g key={`h${i}`} data-zone="buco">
          <rect x={n2(x(a))} y={0} width={n2(Math.max(1, x(b) - x(a)))} height={n2(y(0))} fill={`url(#${id})`} />
          <text className="label" x={n2((x(a) + x(b)) / 2)} y={16} textAnchor="middle" fontSize={10} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
            buco
          </text>
        </g>
      ))}
      {filled.map(([a, b], i) => (
        <g key={`f${i}`} data-zone="interpolata">
          <rect x={n2(x(a))} y={0} width={n2(Math.max(1, x(b) - x(a)))} height={n2(innerHeight - (innerHeight - y(0)))} fill="var(--viz-field-2)" fillOpacity={0.55} />
          <text className="label" x={n2((x(a) + x(b)) / 2)} y={16} textAnchor="middle" fontSize={10} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
            interpolata
          </text>
        </g>
      ))}
    </g>
  )
}

/**
 * I contributi nel punto sonda: la colonna impilata dei tre addendi γ(u)/(N h), nei colori delle letture, e da
 * ogni lettura un filo verso il suo tratto di colonna, spesso quanto il suo peso (sparisce se il peso è zero).
 */
function Contributions({ probe, samples, weights, h }: { probe: number; samples: readonly number[]; weights: readonly number[]; h: number }) {
  const { x, y } = usePlot()
  const n = samples.length
  const px = x(probe)
  const beltY = y(-BELT * 0.4)
  const segs: { lo: number; hi: number }[] = []
  for (const g of weights) {
    const lo = segs.length > 0 ? segs[segs.length - 1].hi : 0
    segs.push({ lo, hi: lo + g / (n * h) })
  }
  const acc = segs.length > 0 ? segs[segs.length - 1].hi : 0
  return (
    <g data-contrib="" pointerEvents="none">
      <line x1={n2(px)} x2={n2(px)} y1={n2(y(0))} y2={n2(y(acc))} stroke="var(--viz-boundary)" strokeOpacity={0.5} strokeWidth={1} />
      {samples.map((s, k) => {
        const g = weights[k]
        if (g <= 1e-6) return null
        const mid = y((segs[k].lo + segs[k].hi) / 2)
        const sx = x(s)
        const c = `M${n2(sx)},${n2(beltY)}Q${n2((sx + px) / 2)},${n2(Math.min(beltY, mid) - 30)} ${n2(px - 5)},${n2(mid)}`
        return <path key={`l${k}`} data-link={k} d={c} fill="none" stroke={classVar(CLS[k % 3])} strokeWidth={n2(1 + 4 * Math.min(1, g / 0.4))} strokeOpacity={0.7} strokeLinecap="round" />
      })}
      {segs.map((sg, k) =>
        y(sg.lo) - y(sg.hi) >= 0.5 ? <rect key={`c${k}`} x={n2(px - 5)} y={n2(y(sg.hi))} width={10} height={n2(y(sg.lo) - y(sg.hi))} fill={classVar(CLS[k % 3])} stroke="var(--surface)" strokeWidth={1} /> : null,
      )}
      <rect x={n2(px) - 4.5} y={n2(y(acc)) - 4.5} width={9} height={9} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} transform={`rotate(45 ${n2(px)} ${n2(y(acc))})`} />
    </g>
  )
}

/** Il nastro sotto lo zero su cui stanno letture e sonda. */
function Belt() {
  const { y, innerWidth } = usePlot()
  return (
    <g pointerEvents="none">
      <rect x={0} y={n2(y(0))} width={innerWidth} height={n2(y(-BELT) - y(0))} fill="var(--surface-2)" />
      <line x1={0} x2={innerWidth} y1={n2(y(0))} y2={n2(y(0))} stroke="var(--viz-axis)" />
    </g>
  )
}

/** Le barre dei pesi γ(u) delle tre letture, da 0 a 1, con il segno della lettura. Le cifre stanno accanto. */
function WeightBars({ samples, weights }: { samples: readonly number[]; weights: readonly number[] }) {
  return (
    <div className="grid gap-1.5">
      <span className="label">Peso di ogni lettura nel punto sonda</span>
      {samples.map((s, k) => (
        <div key={k} className="grid grid-cols-[4.5rem_minmax(0,1fr)_3rem] items-center gap-2">
          <span className="flex items-center gap-1.5">
            <svg viewBox="-8 -8 16 16" width={14} height={14} aria-hidden="true">
              <path d={classSymbolPath(CLS[k % 3], 60)} fill={classVar(CLS[k % 3])} />
            </svg>
            <span className="num text-[length:var(--step--1)]">{f2(s)} °C</span>
          </span>
          <span aria-hidden="true" className="relative h-3 border border-border bg-surface-2">
            <span className="absolute inset-y-0 left-0" style={{ width: `${Math.min(1, weights[k]) * 100}%`, background: classVar(CLS[k % 3]) }} />
          </span>
          <span className="num text-right text-[length:var(--step--1)]">{f3(weights[k])}</span>
        </div>
      ))}
    </div>
  )
}

// --- il widget ---

interface Checked {
  key: string
  verdict: ChallengeVerdict
}

export default function ConteggioVsInterpolazione() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [samples, setSamples] = useState<number[]>([...SAMPLES0])
  const [probeUser, setProbeUser] = useState(PROBE0)
  const [h, setH] = useState(H0)
  const [kernel, setKernel] = useState<Kernel>('rettangolare')
  /** passo in cui l'utente ha preso in mano kernel o sonda: lì il racconto non li impone più */
  const [takeover, setTakeover] = useState<number | null>(null)
  const [heaviest, setHeaviest] = useState<'' | '0' | '1' | '2'>('')
  const [gAnswer, setGAnswer] = useState(0)
  const [pAnswer, setPAnswer] = useState(0)
  const [checked, setChecked] = useState<Checked | null>(null)

  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const story = sceneAt(at, sb.progress, kernel)
  const free = takeover === at || at === STEP.tabella
  const scene = free ? { from: kernel, to: kernel, t: 1, until: Number.POSITIVE_INFINITY, probe: null, label: kernel === 'rettangolare' ? ('conteggio' as const) : ('interpolazione' as const) } : story
  const probe = scene.probe ?? probeUser
  const shown: Kernel = scene.t >= 1 ? scene.to : scene.from
  const gamma = shapeAt(scene.from, scene.to, scene.t)

  const xs = useMemo(() => gridFor(samples, h), [samples, h])
  const est = sceneEstimate(xs, samples, h, scene)
  const rectEst = useMemo(() => sceneEstimate(xs, samples, h, { from: 'rettangolare', to: 'rettangolare', t: 1, until: Infinity, probe: null, label: 'conteggio' }), [xs, samples, h])
  const holes = zeroRuns(xs, est, samples)
  const filled = scene.from === 'rettangolare' && scene.to === 'rettangolare' ? [] : zeroRuns(xs, rectEst, samples).filter(() => holes.length === 0)
  const weights = samples.map((s) => gamma((probe - s) / h))
  const p = weights.reduce((a, b) => a + b, 0) / (samples.length * h)
  const isRect = scene.t >= 1 ? scene.to === 'rettangolare' : scene.t <= 0 && scene.from === 'rettangolare'
  const table = weightsTable(probe, samples, h)
  const pRectHere = table[0].p

  // --- azioni ---
  const takeOver = () => {
    if (!free && at !== STEP.quadro) {
      sb.pause()
      setTakeover(at)
    }
  }
  const chooseKernel = (k: Kernel) => {
    takeOver()
    setKernel(k)
  }
  const moveProbe = (v: number) => {
    if (scene.probe !== null) takeOver()
    setProbeUser(Number((Math.round(v / X_STEP) * X_STEP).toFixed(2)))
  }
  const moveSample = (id: string, v: number) => {
    const k = Number(id.slice(1))
    setSamples((s) => s.map((old, i) => (i === k ? Number((Math.round(v / X_STEP) * X_STEP).toFixed(2)) : old)))
  }
  const generalize = () => {
    setTakeover(null)
    sb.goto(STEP.tri)
    sb.play()
  }
  const reset = () => {
    sb.reset()
    setSamples([...SAMPLES0])
    setProbeUser(PROBE0)
    setH(H0)
    setKernel('rettangolare')
    setTakeover(null)
    setHeaviest('')
    setGAnswer(0)
    setPAnswer(0)
    setChecked(null)
  }

  const checkKey = `${heaviest}|${gAnswer}|${pAnswer}`
  const verify = () => setChecked({ key: checkKey, verdict: judge({ heaviest: heaviest === '' ? null : Number(heaviest), gamma: gAnswer, p: pAnswer }) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  const values = { x: probe, N: samples.length, h, Nh: samples.length * h, u1: (probe - samples[0]) / h, u2: (probe - samples[1]) / h, u3: (probe - samples[2]) / h, g1: weights[0], g2: weights[1], g3: weights[2], p }
  const estPts = xs.map((v, i) => [v, est[i]])
  const summary = `Letture ${samples.map((s) => `${f2(s)} °C`).join(', ')}; kernel ${KERNEL_LABEL[shown]}, h = ${f2(h)}. Nel punto sonda ${f2(probe)} °C i pesi sono ${weights.map(f3).join(', ')} e la stima vale ${f3(p)}.${holes.length > 0 ? ' Fra le letture c\'è un tratto a densità zero.' : ''}`

  const terrain = (
    <div className="absolute inset-0">
      <Plot
        width={640}
        height={430}
        fill
        xDomain={DOMAIN}
        yDomain={[-BELT, Y_MAX]}
        margin={{ top: 14, right: 12, bottom: 42, left: 46 }}
        ariaLabel="Tre letture di temperatura, i loro kernel, la stima e i contributi nel punto sonda"
        description={summary}
      >
        <Grid axis="y" yTicks={[0.2, 0.4, 0.6]} />
        <Zones holes={holes} filled={filled} />
        <SampleKernels xs={xs} samples={samples} h={h} gamma={gamma} />
        {Number.isFinite(scene.until) ? (
          <Reveal until={scene.until}>
            <LinePath data={estPts} role="estimate" width={2.5} />
          </Reveal>
        ) : (
          <LinePath data={estPts} role="estimate" width={2.5} />
        )}
        {isRect ? <JumpMarks at={jumpPoints(samples, h, DOMAIN)} /> : null}
        <ClippedMarks at={clippedPeaks(xs, est, Y_MAX)} />
        <Belt />
        <Contributions probe={probe} samples={samples} weights={weights} h={h} />
        <Dots
          data={samples.map((s, k) => ({ x: s, y: -BELT * 0.4, cls: CLS[k % 3], id: `s${k}`, label: `Lettura ${k + 1}` }))}
          draggable
          axis="x"
          step={X_STEP}
          onDrag={(id, v) => moveSample(id, v)}
          format={f2}
        />
        <Dots data={[{ x: probe, y: -BELT * 0.82, id: 'probe', label: 'Punto sonda x' }]} draggable pin axis="x" step={X_STEP} onDrag={(_id, v) => moveProbe(v)} format={f2} />
        <Axis side="bottom" label="temperatura" symbol="x [°C]" />
        <Axis side="left" ticks={[0, 0.2, 0.4, 0.6]} symbol="p̂(x)" />
      </Plot>
      <Stamp side="right" it={scene.label === 'conteggio' ? 'Conteggio' : 'Interpolazione'} en={scene.label === 'conteggio' ? 'counting' : 'interpolation'} />
    </div>
  )

  const controls = (
    <>
      <Segmented id={`${uid}-kernel`} label="Funzione finestra (window function)" options={SEQUENCE.map((k) => ({ value: k, label: KERNEL_LABEL[k] }))} value={kernel} onChange={chooseKernel} />
      <Slider id={`${uid}-h`} label="Larghezza della finestra" latex="h" min={H_RANGE[0]} max={H_RANGE[1]} step={H_STEP} value={h} onChange={setH} format={f2} unit="°C" />
      <ActionButton onClick={generalize}>Generalizza la finestra</ActionButton>
      <p className="m-0 text-[length:var(--step--1)] text-muted">
        Trascina le tre letture e la sonda sul nastro, oppure raggiungile con Tab e usa le frecce (0.05 °C alla volta).
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Punto sonda" latex="x" value={probe} format={f2} unit="°C" />
        <Readout label="Stima nel punto" latex="\hat p(x)" value={p} format={f3} pinned />
      </div>
      <WeightBars samples={samples} weights={weights} />
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption
        index={sb.index}
        total={steps.length}
        label={sb.step.label}
        text={captionFor(sb.index, { x: f2(probe), h: f2(h), p: f3(p), pRect: f3(pRectHere), kernel: KERNEL_LABEL[kernel] })}
      />
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">Formula viva nel punto sonda · Parzen estimate</span>
        <LiveFormula tex={TEX_LIVE} values={values} />
        <span className="label">
          Kernel {scene.t > 0 && scene.t < 1 ? `in trasformazione: da ${KERNEL_LABEL[scene.from]} a ${KERNEL_LABEL[scene.to]}` : KERNEL_LABEL[shown]}
        </span>
        <M tex={KERNEL_INFO[shown].tex} display />
        {shown === 'epanechnikov' ? <M tex={TEX_EPAN} display /> : null}
      </div>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Pesi delle tre letture nel punto sonda per i quattro kernel">
        <table className="num w-full border-collapse text-right text-[length:var(--step--1)]">
          <caption className="label pb-1 text-left">
            Pesi <M tex="\gamma((x - x_k)/h)" /> in <span className="num tracking-normal normal-case">x = {f2(probe)} °C</span>, h = {f2(h)}
          </caption>
          <thead>
            <tr className="border-b border-border-strong text-muted">
              <th scope="col" className="py-1 pr-2 text-left font-normal">
                kernel
              </th>
              {samples.map((s, k) => (
                <th key={k} scope="col" className="px-2 py-1 font-normal">
                  {f2(s)} °C
                </th>
              ))}
              <th scope="col" className="py-1 pl-2 font-normal">
                <M tex="\hat p(x)" />
              </th>
            </tr>
          </thead>
          <tbody>
            {table.map((r) => (
              <tr key={r.kernel} className={`border-b border-border ${r.kernel === shown ? 'bg-surface-2 font-semibold' : ''}`}>
                <th scope="row" className="py-0.5 pr-2 text-left font-normal">
                  {KERNEL_LABEL[r.kernel]}
                </th>
                {r.weights.map((g, k) => (
                  <td key={k} className="px-2 py-0.5">
                    {f3(g)}
                  </td>
                ))}
                <td className="py-0.5 pl-2">{f3(r.p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <Segmented<'' | '0' | '1' | '2'>
        id={`${uid}-heaviest`}
        label="In x = 5 °C pesa di più la lettura"
        options={SAMPLES0.map((s, k) => ({ value: String(k) as '0' | '1' | '2', label: `${f2(s)} °C` }))}
        value={heaviest}
        onChange={setHeaviest}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField id={`${uid}-g`} label="Il suo peso" latex="\gamma" min={0} max={1} step={0.001} value={gAnswer} onChange={setGAnswer} format={f3} />
        <NumberField id={`${uid}-p`} label="La stima in 5 °C" latex="\hat p(5)" min={0} max={2} step={0.001} value={pAnswer} onChange={setPAnswer} format={f3} />
      </div>
      {valid !== null ? (
        <div className="grid gap-2">
          <Verdict ok={valid.verdict.choiceOk && valid.verdict.gammaOk}>
            Pesa di più la lettura a <span className="num">{f2(SAMPLES0[valid.verdict.heaviest])} °C</span>, con <span className="num">γ = {f3(valid.verdict.weights[valid.verdict.heaviest])}</span>; le altre{' '}
            {valid.verdict.weights
              .map((g, k) => ({ g, k }))
              .filter((w) => w.k !== valid.verdict.heaviest)
              .map((w) => `${f2(SAMPLES0[w.k])} °C: ${f3(w.g)}`)
              .join(', ')}
            .
          </Verdict>
          <Verdict ok={valid.verdict.pOk}>
            La stima in 5 °C è <span className="num">p̂(5) = {f3(valid.verdict.p)}</span>; hai scritto <span className="num">{f3(pAnswer)}</span>.
          </Verdict>
        </div>
      ) : null}
      <Note>La sfida usa le tre letture dell'inventario, anche se le hai spostate sul nastro.</Note>
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={1.35} onReset={reset} transport={<PlayControls sb={sb} steps={steps} />} caption={caption} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
