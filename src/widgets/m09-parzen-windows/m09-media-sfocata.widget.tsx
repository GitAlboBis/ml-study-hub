// m09-media-sfocata: la media della stima è la pdf vera fuori fuoco (concetti c41 convoluzione, c42 versione sfocata,
// c44 Parzen è distorta a h finito). Intervalli RR di un ECG con extrasistoli: 200 esami ripetuti, il fascio delle loro
// stime, la media, e la curva teorica p * (1/h)γ(x/h) a cui la media si sovrappone. Il bias è tratteggiato; "Mostra la
// convoluzione" fa scorrere il kernel e disegna la curva punto per punto; il preset gaussiana su gaussiana la verifica
// in forma chiusa.
//
// STRUTTURA. Logica, dati e testi in sfocata.ts (con i test); qui terreno (il fascio è su canvas: 200 curve in SVG
// peserebbero troppo), comandi, formule e sfida.
//
// MOTO. Storyboard: gli esami si aggiungono in 5 s (25 ms l'uno), il kernel scorre in 6 s, nel preset l'istogramma dei
// valori "sporcati" si riempie in 3 s. Slider e interruttori: nessuna animazione; il fascio si ricalcola in differita
// (useDeferredValue), così lo slider resta fluido.
import { useCallback, useDeferredValue, useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { linspace } from '../../lib/ml/stats'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { LiveFormula } from '../kit/LiveFormula'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { vizColor } from '../kit/plot/colors'
import { CanvasLayer } from '../kit/plot/FieldCanvas'
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
import { BetweenArea, Note, Reveal, SeriesLegend, Verdict } from './parzen-lab-ui'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  DOMAIN,
  EXAMS,
  GRID,
  H0,
  H_RANGE,
  N0,
  N_STEPS,
  RR_KERNELS,
  STEP,
  STEPS,
  TEX_BIASED,
  TEX_CONV,
  TEX_GAUSS,
  TEX_INT,
  TEX_LIVE,
  TEX_PRESET,
  blurred,
  captionFor,
  closedFormFactor,
  judge,
  modes,
  noisySamples,
  peakDrop,
  simulate,
  slidingProduct,
  truthOf,
} from './sfocata'
import type { ChallengeVerdict, RRKernel, Why } from './sfocata'

export const meta: WidgetMeta = {
  id: 'm09-media-sfocata',
  moduleId: 'm09-parzen-windows',
  title: 'La media della stima è la pdf vera fuori fuoco',
  concepts: ['c41', 'c42', 'c44'],
  scenario: 'medicina',
  scenarioNote: 'Intervalli RR di un ECG con extrasistoli: battiti normali e prematuri',
  size: 'L',
}

const f0 = fixed(0)
const f5 = fixed(5)
const pct = (v: number) => `${fixed(1)(100 * v)}%`
const Y_MAX = 0.0115
const N_START = N_STEPS.indexOf(N0)
const LABEL: Readonly<Record<RRKernel, string>> = { gaussiano: 'gaussiano', rettangolare: 'rettangolare', triangolare: 'triangolare' }
const NOISE = 2000
const BINS = linspace(400, 1000, 61)

/** Il fascio delle stime: polilinee sottili a inchiostro trasparente, su canvas. */
function Bundle({ curves, count }: { curves: readonly number[][]; count: number }) {
  const { x, y } = usePlot()
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, ratio: number) => {
      const [x0, x1] = x.domain()
      const [y0, y1] = y.domain()
      const px = (v: number) => ((v - x0) / (x1 - x0)) * width
      const py = (v: number) => height - ((v - y0) / (y1 - y0)) * height
      ctx.strokeStyle = vizColor('sample')
      ctx.globalAlpha = count > 20 ? 0.07 : 0.35
      ctx.lineWidth = Math.max(1, ratio)
      for (let e = 0; e < Math.min(count, curves.length); e++) {
        const c = curves[e]
        ctx.beginPath()
        GRID.forEach((v, i) => (i === 0 ? ctx.moveTo(px(v), py(c[i])) : ctx.lineTo(px(v), py(c[i]))))
        ctx.stroke()
      }
    },
    [curves, count, x, y],
  )
  return <CanvasLayer draw={draw} />
}

/** "Mostra la convoluzione": il kernel centrato in x (contorno) e la parte di p che vede, pesata dal kernel (velatura). */
function Sliding({ at, h, kernel, preset }: { at: number; h: number; kernel: RRKernel; preset: boolean }) {
  const { x, y, clipPath } = usePlot()
  const { kernel: k } = slidingProduct(at, h, kernel, preset)
  const p = GRID.map(truthOf(preset))
  const kMax = Math.max(...k, 1e-12)
  const weighted = GRID.map((v, i) => `${x(v).toFixed(1)},${y(p[i] * (k[i] / kMax)).toFixed(1)}`)
  const scale = (0.5 * Y_MAX) / kMax
  const kPath = GRID.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(v).toFixed(1)},${y(k[i] * scale).toFixed(1)}`).join('')
  return (
    <g data-sliding="" clipPath={clipPath} pointerEvents="none">
      <path d={`M${x(GRID[0]).toFixed(1)},${y(0).toFixed(1)}L${weighted.join('L')}L${x(GRID[GRID.length - 1]).toFixed(1)},${y(0).toFixed(1)}Z`} fill="var(--viz-highlight)" fillOpacity={0.45} />
      <path d={kPath} fill="none" stroke="var(--viz-kernel)" strokeWidth={1.75} />
      <line x1={x(at)} x2={x(at)} y1={y(0)} y2={y(Y_MAX)} stroke="var(--pin-contrast)" strokeWidth={1} strokeDasharray="3 3" />
    </g>
  )
}

/** L'istogramma dei valori veri più il rumore (preset): barre alte quanto i primi `k` valori su `NOISE`. */
function NoiseHistogram({ values, k }: { values: readonly number[]; k: number }) {
  const { x, y } = usePlot()
  const w = BINS[1] - BINS[0]
  const counts = new Array<number>(BINS.length - 1).fill(0)
  for (let i = 0; i < k; i++) {
    const j = Math.floor((values[i] - BINS[0]) / w)
    if (j >= 0 && j < counts.length) counts[j]++
  }
  return (
    <g data-noise="" pointerEvents="none">
      {counts.map((c, j) => {
        const hgt = c / (NOISE * w)
        return c > 0 ? <rect key={j} x={x(BINS[j]) + 0.5} y={y(hgt)} width={Math.max(0, x(BINS[j + 1]) - x(BINS[j]) - 1)} height={y(0) - y(hgt)} fill="var(--viz-sample)" fillOpacity={0.18} /> : null
      })}
    </g>
  )
}

export default function MediaSfocata() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [h, setH] = useState(H0)
  const [nIndex, setNIndex] = useState(N_START)
  const [kernel, setKernel] = useState<RRKernel>('gaussiano')
  const [presetUser, setPresetUser] = useState(false)
  const [theoryOn, setTheoryOn] = useState(false)
  const [simulated, setSimulated] = useState(false)
  const [probe, setProbe] = useState(850)
  const [takeover, setTakeover] = useState<number | null>(null)
  const [why, setWhy] = useState<Why>('')
  const [checked, setChecked] = useState<{ key: string; verdict: ChallengeVerdict } | null>(null)

  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const story = takeover !== at
  const N = N_STEPS[nIndex]
  const preset = presetUser || (story && at === STEP.preset)
  const kShown: RRKernel = story && at === STEP.preset ? 'gaussiano' : kernel

  const dN = useDeferredValue(N)
  const dH = useDeferredValue(h)
  const sim = useMemo(() => simulate(dN, dH, kShown, preset), [dN, dH, kShown, preset])
  const truth = useMemo(() => GRID.map(truthOf(preset)), [preset])
  const conv = useMemo(() => blurred(h, kShown, preset), [h, kShown, preset])
  const exams = at === STEP.simula && story ? Math.max(1, Math.floor(pr * EXAMS)) : at === STEP.quadro && !simulated ? 1 : EXAMS
  const showMean = exams > 1
  const showTheory = theoryOn || (story && at >= STEP.teoria)
  const sliding = story && at === STEP.scorre ? DOMAIN[0] + (DOMAIN[1] - DOMAIN[0]) * pr : null
  const noise = useMemo(() => (preset ? noisySamples(NOISE, h) : []), [preset, h])
  const noiseK = story && at === STEP.preset ? Math.floor(pr * NOISE) : 0

  const nModes = modes(conv)
  const drop = peakDrop(conv, truth)
  const biasMax = Math.max(...conv.map((v, i) => Math.abs(v - truth[i])))
  const iProbe = Math.round(((probe - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * (GRID.length - 1))

  // --- azioni ---
  const takeOver = () => {
    if (at !== STEP.quadro && takeover !== at) {
      sb.pause()
      setTakeover(at)
    }
  }
  const chooseKernel = (v: RRKernel) => {
    takeOver()
    setKernel(v)
  }
  const choosePreset = (v: boolean) => {
    takeOver()
    setPresetUser(v)
  }
  const chooseTheory = (v: boolean) => {
    if (story && at >= STEP.teoria) takeOver()
    setTheoryOn(v)
  }
  const play = (i: number) => {
    setTakeover(null)
    sb.goto(i)
    sb.play()
  }
  const reset = () => {
    sb.reset()
    setH(H0)
    setNIndex(N_START)
    setKernel('gaussiano')
    setPresetUser(false)
    setTheoryOn(false)
    setSimulated(false)
    setProbe(850)
    setTakeover(null)
    setWhy('')
    setChecked(null)
  }

  const checkKey = `${h}|${kernel}|${presetUser}|${why}`
  const verify = () => setChecked({ key: checkKey, verdict: judge(h, kernel, presetUser, why) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  const values = { x: probe, h, e: conv[iProbe] ?? 0, p: truth[iProbe] ?? 0, pk: Math.max(...conv), f: closedFormFactor(h) }
  const pts = (ys: readonly number[]) => GRID.map((v, i) => [v, ys[i]])
  const summary = `${exams} esami da ${N} intervalli, kernel ${LABEL[kShown]}, h = ${f0(h)} ms. La media della stima coincide con la densità vera sfocata: picco principale abbassato del ${pct(drop)}, ${nModes} modi.`

  const terrain = (
    <div className="absolute inset-0">
      <Plot
        width={900}
        height={420}
        fill
        xDomain={DOMAIN}
        yDomain={[0, Y_MAX]}
        margin={{ top: 14, right: 14, bottom: 42, left: 62 }}
        ariaLabel="Intervalli RR: densità vera, fascio delle stime di 200 esami, loro media e densità vera sfocata"
        description={summary}
        cursor="x"
        cursorFormat={(cx) => `x = ${f0(cx)} ms`}
        onCursor={(pt) => {
          if (pt !== null) setProbe(Math.round(pt.x))
        }}
      >
        <Grid axis="y" />
        <Bundle curves={sim.curves} count={exams} />
        {noiseK > 0 ? <NoiseHistogram values={noise} k={noiseK} /> : null}
        {showTheory ? <BetweenArea xs={GRID} a={truth} b={conv} /> : null}
        {sliding !== null ? <Sliding at={sliding} h={h} kernel={kShown} preset={preset} /> : null}
        <LinePath data={pts(truth)} role="truth" width={2} />
        {showMean ? <LinePath data={pts(sim.mean)} role="estimate" width={2.5} /> : null}
        {showTheory || sliding !== null ? (
          sliding !== null ? (
            <Reveal until={sliding}>
              <LinePath data={pts(conv)} role="accent" width={2.5} />
            </Reveal>
          ) : (
            <LinePath data={pts(conv)} role="accent" width={2.5} />
          )
        ) : null}
        <Axis side="bottom" label="intervallo RR" symbol="x [ms]" />
        <Axis side="left" symbol="densità" format={(v) => v.toFixed(3)} />
      </Plot>
    </div>
  )

  const controls = (
    <>
      <Segmented id={`${uid}-k`} label="Kernel" options={RR_KERNELS.map((k) => ({ value: k, label: LABEL[k] }))} value={kShown} onChange={chooseKernel} />
      <Slider id={`${uid}-h`} label="Larghezza della finestra" latex="h" min={H_RANGE[0]} max={H_RANGE[1]} step={1} value={h} onChange={setH} format={f0} unit="ms" />
      <Slider id={`${uid}-n`} label="Intervalli per esame" latex="N" min={0} max={N_STEPS.length - 1} step={1} value={nIndex} onChange={setNIndex} format={(i) => String(N_STEPS[Math.round(i)] ?? N)} />
      <div className="grid gap-1">
        <Toggle id={`${uid}-theory`} label="Densità vera sfocata p * kernel" hint="La curva ocra: la media teorica della stima." checked={showTheory} onChange={chooseTheory} />
        <Toggle id={`${uid}-preset`} label="Preset: gaussiana su gaussiana" hint="Densità vera N(850, 40²): la media della stima è N(850, 40² + h²)." checked={preset} onChange={choosePreset} />
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          onClick={() => {
            setSimulated(true)
            play(STEP.simula)
          }}
        >
          Simula 200 esami
        </ActionButton>
        <ActionButton onClick={() => play(STEP.scorre)}>Mostra la convoluzione</ActionButton>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Esami" value={exams} format={f0} />
        <Readout label="Modi della media" value={nModes} format={f0} pinned />
        <Readout label="Picco abbassato" value={pct(drop)} />
        <Readout label="Bias massimo" latex="\max|E\{\hat p\}-p|" value={biasMax} format={f5} />
      </div>
      <SeriesLegend
        items={[
          { kind: 'line', role: 'truth', label: 'densità vera' },
          { kind: 'line', role: 'estimate', width: 2.5, label: 'media delle stime' },
          { kind: 'line', role: 'accent', width: 2.5, label: 'p * kernel (media teorica)' },
          { kind: 'hatch', label: 'bias' },
        ]}
      />
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(sb.index, { N, h: f0(h), drop: pct(drop), modes: nModes, exams })} />
      <figure className="m-0 grid gap-1 border-2 border-border-strong bg-surface-2 px-3 py-2">
        <figcaption className="label">Slide p60</figcaption>
        <blockquote className="m-0 font-label text-[length:var(--step-1)]" lang="en">
          <em>The estimate mean is a blurred version of the true p(x)!</em>
        </blockquote>
      </figure>
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">Media della stima · bias</span>
        <M tex={TEX_CONV} display />
        <M tex={TEX_INT} display />
        <LiveFormula tex={TEX_LIVE} values={values} />
        <M tex={TEX_BIASED} display />
        <span className="label">Verifica in forma chiusa</span>
        <M tex={TEX_GAUSS} display />
        {preset ? <LiveFormula tex={TEX_PRESET} values={values} announce={false} /> : null}
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <Segmented<Why>
        id={`${uid}-why`}
        label="Aumentare N non lo cambia perché"
        options={[
          { value: 'media', label: 'la media della stima non dipende da N' },
          { value: 'varianza', label: 'la varianza non dipende da N' },
          { value: 'dati', label: 'con più dati h cresce' },
        ]}
        value={why}
        onChange={setWhy}
      />
      {valid !== null ? (
        <div className="grid gap-2">
          <Verdict ok={valid.verdict.hOk}>
            Con il gaussiano i due modi si distinguono fino a <span className="num">h = {valid.verdict.target} ms</span>; tu hai lasciato h = {f0(h)} ms{kernel !== 'gaussiano' ? ' con un altro kernel' : ''}
            {presetUser ? ' e il preset acceso' : ''}.
          </Verdict>
          <Verdict ok={valid.verdict.whyOk}>La curva ocra è p * (1/h)γ(x/h): N non c'è. Più dati stringono il fascio attorno a lei, non la avvicinano alla vera.</Verdict>
        </div>
      ) : null}
      <Note>Il punto delle formule è quello del cursore sul grafico (puntatore, oppure Tab e frecce).</Note>
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={1.9} onReset={reset} transport={<PlayControls sb={sb} steps={steps} />} caption={caption} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
