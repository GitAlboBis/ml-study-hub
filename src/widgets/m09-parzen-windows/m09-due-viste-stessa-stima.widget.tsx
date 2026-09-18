// m09-due-viste-stessa-stima: conteggio o somma di rettangoli? (concetti c08 stima con la finestra a ipercubo, c09
// simmetria della finestra, c10 collezione di contributi rettangolari, c11 equivalenza con un conteggio).
// Due pannelli sullo stesso asse della luminosità: in alto una finestra centrata in x* conta i salmoni, in basso ogni
// salmone porta un rettangolo di base h e area 1/N. In x* i due numeri sono sempre uguali.
//
// STRUTTURA. Logica, dati e testi in due-viste.ts (con i test); qui i due terreni, i comandi, le formule e la sfida.
//
// MOTO. "Specchia" (1.2 s): la finestra si scompone in N copie che volano ciascuna sul proprio salmone, sfalsate di
// 60 ms, mentre in basso compaiono i rettangoli. "Traccia" (4 s): x* scorre da 0 a 10 e la penna disegna la curva a
// gradini. Sono passi dello storyboard: Pausa, Passo e Velocità li governano. Aggiungere o togliere un salmone
// riscala le altezze a 1/(N·h) in 300 ms (ease-out); h e x* seguono la mano senza animazione.
import { useId, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { M } from '../../components/content/M'
import { clippedPeaks, kernelBands } from '../engines/density1d/density1d'
import { ClippedMarks, KernelBandsLayer, ProbeMarks } from '../engines/density1d/terrain'
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
import { classSymbolPath } from '../kit/plot/marks'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
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
  N_RANGE,
  SAMPLES0,
  STEP,
  STEPS,
  TEX_BOTH,
  TEX_COUNT,
  TEX_RECT,
  TEX_SYMMETRY,
  X0,
  X_STEP,
  captionFor,
  covering,
  ghostAt,
  judge,
  nearestIndex,
  snap,
  staircase,
  sweepAt,
  texContributions,
} from './due-viste'
import type { ChallengeVerdict } from './due-viste'
import { useTween } from './parzen-lab-motion'
import { AreaMeter, JumpMarks, Note, Reveal, SeriesLegend, Verdict } from './parzen-lab-ui'
import { jumpPoints } from './parzen-lab'

export const meta: WidgetMeta = {
  id: 'm09-due-viste-stessa-stima',
  moduleId: 'm09-parzen-windows',
  title: 'Conteggio o somma di rettangoli? Due viste, stesso numero',
  concepts: ['c08', 'c09', 'c10', 'c11'],
  scenario: 'pesce',
  scenarioNote: 'Luminosità di 8 salmoni del training set, sulla scala 0-10 della telecamera',
  size: 'M',
}

const f0 = fixed(0)
const f1 = fixed(1)
const f2 = fixed(2)
const f3 = fixed(3)
const Y_MAX = 0.6
const MARGIN = { top: 10, right: 12, bottom: 6, left: 46 }
const n2 = (v: number) => Number(v.toFixed(2))
const RESCALE_MS = 300

// --- pannello del conteggio ---

/** Il nastro dei salmoni: un clic sulla striscia aggiunge, un clic su un salmone lo toglie. Dentro la finestra: alone ocra. */
function CountBelt({ samples, inside, onAdd, onRemove }: { samples: readonly number[]; inside: ReadonlySet<number>; onAdd: (x: number) => void; onRemove: (k: number) => void }) {
  const { x, y, innerWidth, toData, showTip } = usePlot()
  const cy = y(0.3)
  const size = Math.PI * 4.5 * 4.5
  return (
    <g data-belt="">
      <rect
        x={0}
        y={y(0.55)}
        width={innerWidth}
        height={y(0.05) - y(0.55)}
        fill="var(--surface-2)"
        style={{ cursor: 'copy' }}
        onClick={(e: MouseEvent<SVGRectElement>) => onAdd(toData(e.clientX, e.clientY)[0])}
      />
      <line x1={0} x2={innerWidth} y1={cy} y2={cy} stroke="var(--viz-axis)" strokeWidth={1} />
      {samples.map((v, k) => (
        <g
          key={`${k}-${v}`}
          data-sample={inside.has(k) ? 'in' : 'out'}
          transform={`translate(${n2(x(v))},${n2(cy)})`}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            showTip(null)
            onRemove(k)
          }}
          onPointerEnter={() => showTip({ x: x(v), y: cy - 10, value: `x = ${f2(v)}`, label: 'salmone · clic per toglierlo' })}
          onPointerLeave={() => showTip(null)}
        >
          <circle r={11} fill="transparent" />
          {inside.has(k) ? <circle r={8} fill="var(--viz-highlight)" stroke="var(--pin-contrast)" strokeWidth={1} /> : null}
          <path d={classSymbolPath(0, size)} fill={inside.has(k) ? 'var(--viz-class-4)' : 'var(--viz-sample)'} stroke="var(--surface)" strokeWidth={2} paintOrder="stroke" />
        </g>
      ))}
    </g>
  )
}

/** Una finestra [c − h/2, c + h/2] nel pannello del conteggio: piena (quella vera) o tratteggiata (un fantasma in volo). */
function WindowRect({ c, h, ghost = false, alpha = 1 }: { c: number; h: number; ghost?: boolean; alpha?: number }) {
  const { x, y } = usePlot()
  const a = x(c - h / 2)
  const w = Math.max(1, x(c + h / 2) - a)
  return (
    <rect
      data-window={ghost ? 'ghost' : 'main'}
      x={n2(a)}
      y={n2(y(0.95))}
      width={n2(w)}
      height={n2(y(0.02) - y(0.95))}
      fill="var(--pin)"
      fillOpacity={ghost ? 0.12 : 0.3}
      stroke="var(--pin-contrast)"
      strokeWidth={ghost ? 1 : 1.5}
      strokeDasharray={ghost ? '4 3' : undefined}
      opacity={alpha}
      pointerEvents="none"
    />
  )
}

// --- pannello dei contributi ---

/** Le aree 1/N scritte sui rettangoli, se c'è posto. */
function AreaLabels({ samples, h, w }: { samples: readonly number[]; h: number; w: number }) {
  const { x, y } = usePlot()
  const width = x(h) - x(0)
  if (width < 38) return null
  // solo dove c'è posto: un'etichetta a meno di 40 px dalla precedente si salta (i rettangoli vicini si sovrappongono)
  const shown: number[] = []
  for (const v of samples) if (shown.length === 0 || x(v) - x(shown[shown.length - 1]) >= 40) shown.push(v)
  return (
    <g pointerEvents="none">
      {shown.map((v) => (
        <text key={v} className="num" x={n2(x(v))} y={n2(y(w / h) + 12)} textAnchor="middle" fontSize={9} fill="var(--text)" stroke="var(--surface)" strokeWidth={2.5} paintOrder="stroke">
          {f3(w)}
        </text>
      ))}
    </g>
  )
}

/** La verticale di x* nel pannello dei contributi. */
function ProbeLine({ at }: { at: number }) {
  const { x, innerHeight } = usePlot()
  return <line x1={n2(x(at))} x2={n2(x(at))} y1={0} y2={innerHeight} stroke="var(--pin-contrast)" strokeWidth={1} strokeDasharray="2 3" pointerEvents="none" />
}

// --- il widget ---

interface Checked {
  key: string
  verdict: ChallengeVerdict
}

export default function DueVisteStessaStima() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [samples, setSamples] = useState<number[]>([...SAMPLES0])
  const [xUser, setXUser] = useState(X0)
  const [h, setH] = useState(H0)
  const [chosen, setChosen] = useState<number[]>([])
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)
  const [kAnswer, setKAnswer] = useState(0)
  const [checked, setChecked] = useState<Checked | null>(null)

  const N = samples.length
  const w = useTween(1 / N, RESCALE_MS)

  // --- storyboard ---
  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const tracing = at === STEP.traccia
  const x = tracing ? Number(sweepAt(pr).toFixed(3)) : xUser
  const topFocus = at === STEP.conteggio ? 1 : at === STEP.contributi ? 0.35 : 1
  const bottomFocus = at === STEP.conteggio ? 0.3 : 1
  const mirror = at === STEP.specchia
  const rectAlpha = (k: number) => (mirror ? ghostAt(pr, k, N) : 1)

  const inside = new Set(covering(x, samples, h))
  const K = inside.size
  const p = N > 0 ? K / (N * h) : 0

  const stair = useMemo(() => staircase(samples, h, w), [samples, h, w])
  const scales = samples.map((_, k) => rectAlpha(k) * w)
  const bands = kernelBands(stair.xs, samples, h, 'rettangolare', scales, 0)
  const jumps = jumpPoints(samples, h, DOMAIN)
  const stairPts = stair.xs.map((v, i) => [v, stair.ys[i]])
  const area = useMemo(() => {
    const s = staircase(samples, h)
    let a = 0
    for (let i = 1; i < s.xs.length; i++) a += ((s.ys[i] + s.ys[i - 1]) / 2) * (s.xs[i] - s.xs[i - 1])
    return a
  }, [samples, h])

  // --- azioni ---
  const add = (v: number) => {
    if (N >= N_RANGE[1]) return
    setSamples((s) => [...s, snap(v)].sort((a, b) => a - b))
  }
  const remove = (k: number) => {
    if (N <= N_RANGE[0]) return
    setSamples((s) => s.filter((_, i) => i !== k))
    setChosen([])
  }
  const play = (i: number) => {
    sb.goto(i)
    sb.play()
  }
  const toggleChosen = (k: number) => setChosen((c) => (c.includes(k) ? c.filter((v) => v !== k) : [...c, k]))
  const reset = () => {
    sb.reset()
    setSamples([...SAMPLES0])
    setXUser(X0)
    setH(H0)
    setChosen([])
    setFrom(0)
    setTo(0)
    setKAnswer(0)
    setChecked(null)
  }

  const checkKey = `${samples.join(',')}|${h}|${xUser}|${[...chosen].sort().join(',')}|${from}|${to}|${kAnswer}`
  const verify = () => setChecked({ key: checkKey, verdict: judge({ samples, h, x: xUser, chosen, from, to, K: kAnswer }) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  const values = { K, N, h, p, w: 1 / (N * h) }
  const ctx = { K, N, h: f1(h), p: f3(p), w: f3(1 / (N * h)), x: f2(x) }
  const summary = `${N} salmoni. x* = ${f2(x)}, h = ${f1(h)}. Nella finestra K = ${K}: stima ${f3(p)}, uguale alla somma delle altezze dei ${K} rettangoli che coprono x*.`

  const terrain = (
    <div className="absolute inset-0 grid grid-rows-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="relative min-h-0 border-b border-border" style={{ opacity: topFocus }}>
        <Plot
          width={640}
          height={150}
          fill
          xDomain={DOMAIN}
          yDomain={[0, 1]}
          margin={MARGIN}
          frame={false}
          ariaLabel="Vista conteggio: la finestra di lato h centrata in x* e i salmoni sul nastro"
          description={summary}
        >
          <CountBelt samples={samples} inside={inside} onAdd={add} onRemove={remove} />
          <WindowRect c={x} h={h} />
          {mirror ? samples.map((v, k) => <WindowRect key={k} c={x + (v - x) * ghostAt(pr, k, N)} h={h} ghost alpha={1 - 0.6 * ghostAt(pr, k, N)} />) : null}
          <Dots data={[{ x, y: 0.78, id: 'x', label: 'Punto x* (centro della finestra)' }]} draggable pin axis="x" step={X_STEP} onDrag={(_id, nx) => setXUser(Number((Math.round(nx / X_STEP) * X_STEP).toFixed(2)))} format={f2} />
        </Plot>
        <p className="label pointer-events-none absolute top-1.5 left-2 m-0 bg-surface px-1.5 py-0.5">
          Conteggio · <span className="num tracking-normal normal-case">K = {K}</span>
        </p>
      </div>
      <div className="relative min-h-0" style={{ opacity: bottomFocus }}>
        <Plot
          width={640}
          height={260}
          fill
          xDomain={DOMAIN}
          yDomain={[0, Y_MAX]}
          margin={{ ...MARGIN, top: 14, bottom: 40 }}
          ariaLabel="Vista contributi: un rettangolo di area 1/N su ogni salmone e la loro somma, la curva a gradini"
          description={`Rettangoli di base ${f1(h)} e altezza ${f3(1 / (N * h))}. In x* se ne sovrappongono ${K}.`}
        >
          <Grid axis="y" yTicks={[0.2, 0.4]} />
          <KernelBandsLayer xs={stair.xs} bands={bands} stack={0} />
          <AreaLabels samples={samples} h={h} w={w} />
          {tracing ? (
            <Reveal until={x}>
              <LinePath data={stairPts} role="estimate" width={2.5} />
            </Reveal>
          ) : at === STEP.specchia || at === STEP.conteggio ? null : (
            <LinePath data={stairPts} role="estimate" width={2.5} />
          )}
          {at !== STEP.conteggio && at !== STEP.specchia ? <JumpMarks at={tracing ? jumps.filter((j) => j <= x) : jumps} /> : null}
          <ProbeLine at={x} />
          <ProbeMarks x0={x} p={p} terms={[...inside].map(() => w / h)} column />
          <ClippedMarks at={clippedPeaks(stair.xs, stair.ys, Y_MAX)} />
          <Axis side="bottom" label="luminosità" symbol="x" />
          <Axis side="left" ticks={[0, 0.2, 0.4, 0.6]} symbol="p̂(x)" />
        </Plot>
        <p className="label pointer-events-none absolute top-1.5 left-2 m-0 bg-surface px-1.5 py-0.5">
          Contributi · <span className="num tracking-normal normal-case">{K > 0 ? `${K} × ${f3(1 / (N * h))} = ${f3(p)}` : '0'}</span>
        </p>
      </div>
    </div>
  )

  const controls = (
    <>
      <Slider id={`${uid}-h`} label="Larghezza della finestra" latex="h" min={H_RANGE[0]} max={H_RANGE[1]} step={H_STEP} value={h} onChange={setH} format={f1} />
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => play(STEP.specchia)}>Specchia</ActionButton>
        <ActionButton onClick={() => play(STEP.traccia)}>Traccia</ActionButton>
      </div>
      <div className="grid gap-2">
        <p className="label m-0">
          Salmoni · <span className="num tracking-normal normal-case">N = {N}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={() => add(xUser)} disabled={N >= N_RANGE[1]}>
            Aggiungi in x* = {f2(xUser)}
          </ActionButton>
          <ActionButton onClick={() => remove(nearestIndex(samples, xUser))} disabled={N <= N_RANGE[0]}>
            Togli il più vicino a x*
          </ActionButton>
        </div>
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          Sul nastro in alto: clic per aggiungere, clic su un salmone per toglierlo. x* si sposta con il puntatore o con le frecce (0.05 alla volta).
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Salmoni nella finestra" latex="K" value={K} format={f0} />
        <Readout label="Altezza di un rettangolo" latex="\tfrac{1}{Nh}" value={1 / (N * h)} format={f3} />
        <Readout label="Conteggio" latex="\tfrac{K}{Nh}" value={p} format={f3} pinned />
        <Readout label="Somma delle altezze" latex="\textstyle\sum" value={p} format={f3} pinned />
      </div>
      <AreaMeter value={area} max={2} />
      <SeriesLegend
        items={[
          { kind: 'window', label: 'finestra centrata in x*' },
          { kind: 'wash', role: 'kernel', label: 'rettangolo di un salmone (area 1/N)' },
          { kind: 'line', role: 'estimate', width: 2.5, label: 'stima a gradini' },
        ]}
      />
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(sb.index, ctx)} />
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">Vista conteggio · simple count</span>
        <LiveFormula tex={TEX_COUNT} values={values} />
        <span className="label">Vista contributi · rectangular functions</span>
        <LiveFormula tex={texContributions(K)} values={values} announce={false} />
        <span className="label">Le due forme della slide e la simmetria che le lega</span>
        <M tex={TEX_BOTH} display />
        <M tex={TEX_SYMMETRY} display />
        <M tex={TEX_RECT} display />
      </div>
    </div>
  )

  const target = valid?.verdict.part2.target
  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <div className="grid gap-2">
        <span className="label">(1) I rettangoli che coprono x*</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Scegli i rettangoli che coprono x*">
          {samples.map((v, k) => (
            <button
              key={`${k}-${v}`}
              type="button"
              aria-pressed={chosen.includes(k)}
              onClick={() => toggleChosen(k)}
              className="num min-h-10 min-w-12 cursor-pointer border border-border-strong bg-surface px-2 text-text hover:bg-surface-2 aria-pressed:bg-accent aria-pressed:text-accent-contrast"
            >
              {f1(v)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField id={`${uid}-from`} label="(2) Gradino massimo: da x* =" min={0} max={10} step={0.05} value={from} onChange={setFrom} format={f2} />
        <NumberField id={`${uid}-to`} label="a x* =" min={0} max={10} step={0.05} value={to} onChange={setTo} format={f2} />
        <NumberField id={`${uid}-k`} label="Salmoni contati lì" latex="K" min={0} max={15} step={1} value={kAnswer} onChange={setKAnswer} format={f0} />
      </div>
      {valid !== null ? (
        <div className="grid gap-2">
          {!valid.verdict.setupOk ? (
            <Verdict ok={false}>La sfida vale con gli 8 salmoni iniziali e h = 1.5: premi Reset o riporta h a 1.5.</Verdict>
          ) : (
            <>
              <Verdict ok={valid.verdict.part1.ok}>
                (1) In x* = {f2(xUser)} la finestra conta <span className="num">K = {valid.verdict.part1.K}</span> (stima <span className="num">{f3(valid.verdict.part1.p)}</span>)
                {valid.verdict.part1.K === 2
                  ? `; i due rettangoli che lo coprono sono quelli di ${valid.verdict.part1.covering.map((k) => f1(samples[k])).join(' e ')}.`
                  : ': serve un punto in cui ne conta esattamente 2.'}
              </Verdict>
              <Verdict ok={valid.verdict.part2.ok}>
                (2) Hai scritto da <span className="num">{f2(from)}</span> a <span className="num">{f2(to)}</span> con <span className="num">K = {kAnswer}</span>.
                {valid.verdict.part2.ok && target !== null && target !== undefined ? ` Giusto: lì p̂ = ${target.K}/(8 · 1.5) = ${f3(target.K / 12)}.` : ' Non ancora: cerca dove si sovrappone il maggior numero di rettangoli.'}
              </Verdict>
            </>
          )}
        </div>
      ) : null}
      <Note>Solo la vista dei contributi si generalizza: cambiando la forma del mattoncino si passa dal conteggio all'interpolazione.</Note>
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={1.25} onReset={reset} transport={<PlayControls sb={sb} steps={steps} />} caption={caption} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
