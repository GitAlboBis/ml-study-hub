// m09-h-a-zero-dirac: h_N → 0, il kernel diventa una delta e il bias sparisce (concetti c43 effetto di h su bias e
// varianza, c45 non distorsione asintotica se h_N → 0, c46 il kernel riscalato tende alla delta di Dirac). Gli intervalli
// RR dell'ECG del widget m09-media-sfocata: l'archivio dell'ospedale cresce da 10 a 100 000 battiti e la finestra si
// stringe con h_N = h_1/√N. In alto la densità vera e la media della stima, con il bias tratteggiato (e, a richiesta, la
// banda di ±1 deviazione standard); sotto a sinistra il kernel riscalato, a destra il bias massimo in funzione di N.
// Con "h fisso" il kernel non cambia e il bias resta.
//
// STRUTTURA. Logica e testi in dirac.ts (con i test); qui terreno, comandi, formule e sfida.
//
// MOTO. Storyboard: otto passi da 700 ms, uno per ogni fattore √10 di N; dentro ogni passo h_N va dal valore del passo
// prima al nuovo in scala logaritmica (ease-in-out), e il kernel si stringe e si alza. La scala verticale del kernel la
// segue in 200 ms. Slider, interruttori e selettori: nessuna animazione. Con reduced motion ogni passo è già al suo
// valore finale.
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { kernelValue } from '../../lib/ml/nonparam'
import type { Kernel } from '../../lib/ml/nonparam'
import { linspace } from '../../lib/ml/stats'
import { easeInOut } from '../engines/density1d/density1d'
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
  DIRAC_BELOW,
  DOMAIN,
  D_KERNELS,
  GRID,
  H1_DEFAULT,
  H1_RANGE,
  H1_STEP,
  LABEL,
  N_STEPS,
  STEP,
  STEPS,
  TEX_CONV_DIRAC,
  TEX_DIRAC,
  TEX_LIMIT_H,
  TEX_LIVE,
  TRUE_ON_GRID,
  biasCurve,
  captionFor,
  hOf,
  judge,
  maxBias,
  meanEstimate,
  moment,
  nOfStep,
  sdEstimate,
} from './dirac'
import type { DKernel, Law } from './dirac'
import { useTween } from './parzen-lab-motion'
import { BetweenArea, Note, SeriesLegend, Stamp, Verdict } from './parzen-lab-ui'

export const meta: WidgetMeta = {
  id: 'm09-h-a-zero-dirac',
  moduleId: 'm09-parzen-windows',
  title: 'h_N → 0: il kernel diventa una delta e il bias sparisce',
  concepts: ['c43', 'c45', 'c46'],
  scenario: 'medicina',
  scenarioNote: 'Intervalli RR di un ECG: l’archivio dell’ospedale cresce da 10 a 100 000 battiti',
  size: 'L',
}

const f0 = fixed(0)
const f2 = fixed(2)
const f3 = fixed(3)
const f4 = fixed(4)
const pct = (v: number) => `${fixed(1)(100 * v)}%`
const nLabel = (n: number) => n.toLocaleString('it-IT')
const Y_MAX = 0.0105
const K_HALF = 60
const GAUSS_U = linspace(-6, 6, 241)
const LOG_TICK = (v: number) => (v >= 3 ? `${10 ** (v - 3)}k` : String(10 ** v))

/** Il kernel riscalato (1/h) γ(x/h) come polilinea: i salti del rettangolo e la punta del triangolo sono esatti. */
function kernelPoints(h: number, k: DKernel): number[][] {
  const top = kernelValue(0, k as Kernel) / h
  if (k === 'rettangolare')
    return [
      [-K_HALF, 0],
      [-h / 2, 0],
      [-h / 2, top],
      [h / 2, top],
      [h / 2, 0],
      [K_HALF, 0],
    ]
  if (k === 'triangolare')
    return [
      [-K_HALF, 0],
      [-h, 0],
      [0, top],
      [h, 0],
      [K_HALF, 0],
    ]
  return [[-K_HALF, 0], ...GAUSS_U.map((u) => [u * h, kernelValue(u, 'gaussiano') / h]), [K_HALF, 0]]
}

/** La banda media ± una deviazione standard, velatura piena a bordo sottile (sotto lo zero si taglia). */
function BandArea({ lo, hi }: { lo: readonly number[]; hi: readonly number[] }) {
  const { x, y, clipPath } = usePlot()
  const top = GRID.map((v, i) => `${x(v).toFixed(1)},${y(hi[i]).toFixed(1)}`)
  const bottom = GRID.map((v, i) => `${x(v).toFixed(1)},${y(Math.max(0, lo[i])).toFixed(1)}`).reverse()
  return (
    <g data-band="" clipPath={clipPath} pointerEvents="none">
      <path d={`M${top.join('L')}L${bottom.join('L')}Z`} fill="var(--viz-kernel)" fillOpacity={0.18} stroke="var(--viz-kernel)" strokeWidth={0.75} />
    </g>
  )
}

/** La delta di Dirac: la freccia verticale nell'origine, con il suo nome (altezza "infinita", area 1). */
function DiracArrow() {
  const { x, y } = usePlot()
  const cx = x(0)
  return (
    <g data-dirac="" pointerEvents="none">
      <line x1={cx} x2={cx} y1={y(0)} y2={14} stroke="var(--text)" strokeWidth={2.5} />
      <path d={`M${cx},2l-6,13h12z`} fill="var(--text)" />
      <text className="label" x={cx + 10} y={22} fontSize={12} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
        δ(x)
      </text>
    </g>
  )
}

export default function HAZeroDirac() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [nIndex, setNIndex] = useState(0)
  const [h1, setH1] = useState(H1_DEFAULT)
  const [lawUser, setLawUser] = useState<Law>('legge')
  const [bandUser, setBandUser] = useState(false)
  const [kernel, setKernel] = useState<DKernel>('gaussiano')
  const [takeover, setTakeover] = useState<number | null>(null)
  const [guess, setGuess] = useState(10)
  const [checked, setChecked] = useState<{ key: string; verdict: ReturnType<typeof judge> } | null>(null)

  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const story = takeover !== at
  // il racconto impone N nei primi dieci passi, "h fisso" con l'archivio pieno al passo 10, la banda all'11
  const law: Law = story && at === STEP.fisso ? 'fisso' : lawUser
  const band = bandUser || (story && at === STEP.banda)
  const storyN = story ? (nOfStep(at) ?? (at === STEP.fisso ? N_STEPS[N_STEPS.length - 1] : null)) : null
  const N = storyN ?? N_STEPS[nIndex]
  // dentro un passo della scala h_N va dal valore del passo prima al nuovo, in scala logaritmica
  const hTarget = hOf(N, h1, law)
  const hFrom = story && at > 0 && at < N_STEPS.length ? hOf(N_STEPS[at - 1], h1, law) : hTarget
  const h = hFrom === hTarget ? hTarget : Math.exp(Math.log(hFrom) + (Math.log(hTarget) - Math.log(hFrom)) * easeInOut(pr))

  const mean = useMemo(() => meanEstimate(h, kernel), [h, kernel])
  const sd = useMemo(() => (band ? sdEstimate(N, h, kernel, mean) : null), [band, N, h, kernel, mean])
  const bias = maxBias(mean)
  const curve = useMemo(() => biasCurve(h1, law, kernel), [h1, law, kernel])
  const curveTop = Math.max(0.05, 1.1 * Math.max(...curve.map((c) => c[1])))
  const peak = kernelValue(0, kernel as Kernel) / h
  const kTop = useTween(Math.max(0.02, 1.15 * peak), 200)
  const dirac = h < DIRAC_BELOW
  const area = useMemo(() => moment(0, h, kernel, 1, () => 1), [h, kernel])

  // --- azioni ---
  // toccare ciò che il racconto impone (N, legge, banda) mette in pausa e restituisce il comando, partendo da ciò che
  // si vede: i valori imposti dal passo diventano quelli dei comandi, poi vale la modifica appena fatta
  const takeOver = () => {
    if (takeover !== at) {
      sb.pause()
      setTakeover(at)
      setNIndex(N_STEPS.indexOf(N))
      setLawUser(law)
      setBandUser(band)
    }
  }
  const chooseN = (i: number) => {
    takeOver()
    setNIndex(i)
  }
  const chooseLaw = (v: Law) => {
    takeOver()
    setLawUser(v)
  }
  const chooseBand = (v: boolean) => {
    takeOver()
    setBandUser(v)
  }
  const reset = () => {
    sb.reset()
    setNIndex(0)
    setH1(H1_DEFAULT)
    setLawUser('legge')
    setBandUser(false)
    setKernel('gaussiano')
    setTakeover(null)
    setGuess(10)
    setChecked(null)
  }

  const checkKey = String(guess)
  const verify = () => setChecked({ key: checkKey, verdict: judge(guess) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  const values = { h1, N, hN: h, pk: peak, bias: 100 * bias }
  const pts = (ys: readonly number[]) => GRID.map((v, i) => [v, ys[i]])
  const kPts = kernelPoints(h, kernel)
  const lawText = law === 'legge' ? 'legge h_N = h_1/√N' : 'h fisso'
  const summary = `N = ${nLabel(N)} battiti, h_N = ${f2(h)} ms (${lawText}), kernel ${LABEL[kernel]}. Bias massimo ${pct(bias)} del picco vero.${band ? ' Banda di ±1 deviazione standard visibile.' : ''}`
  const curveText = curve.map(([n, b]) => `N = ${nLabel(n)}: ${pct(b)}`).join('; ')

  const terrain = (
    <div className="absolute inset-0 grid grid-rows-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="relative min-h-0 border-b border-border">
        <Plot width={640} height={280} fill xDomain={DOMAIN} yDomain={[0, Y_MAX]} margin={{ top: 12, right: 14, bottom: 38, left: 58 }} ariaLabel="Intervalli RR: densità vera e media della stima, con il bias" description={summary}>
          <Grid axis="y" />
          {sd !== null ? <BandArea lo={mean.map((m, i) => m - sd[i])} hi={mean.map((m, i) => m + sd[i])} /> : null}
          <BetweenArea xs={GRID} a={TRUE_ON_GRID} b={mean} />
          <LinePath data={pts(TRUE_ON_GRID)} role="truth" width={2} />
          <LinePath data={pts(mean)} role="accent" width={2.5} />
          <Axis side="bottom" label="intervallo RR" symbol="x [ms]" />
          <Axis side="left" symbol="densità" format={(v) => v.toFixed(3)} />
        </Plot>
        {law === 'fisso' ? <Stamp side="left" it="h fisso: il bias resta" en="Parzen estimate is thus biased" /> : null}
        {law === 'legge' && dirac ? <Stamp side="left" it="Il kernel è una delta: media = vera" en="asymptotically unbiased" /> : null}
      </div>
      <div className="grid min-h-0 grid-cols-2">
        <div className="relative min-h-0 border-r border-border">
          <Plot
            width={320}
            height={190}
            fill
            xDomain={[-K_HALF, K_HALF]}
            yDomain={[0, kTop]}
            margin={{ top: 10, right: 10, bottom: 34, left: 48 }}
            ariaLabel="Il kernel riscalato (1/h_N) γ(x/h_N)"
            description={dirac ? `h_N = ${f2(h)} ms: il kernel è disegnato come la delta di Dirac. Area ${f3(area)}.` : `Picco ${f4(peak)}, larghezza h_N = ${f2(h)} ms, area ${f3(area)}.`}
          >
            <Grid axis="y" />
            {dirac ? (
              <DiracArrow />
            ) : (
              <>
                <AreaPath data={kPts} role="kernel" opacity={0.2} />
                <LinePath data={kPts} role="kernel" width={2} />
              </>
            )}
            <Axis side="bottom" symbol="x [ms]" ticks={[-60, -30, 0, 30, 60]} />
            <Axis side="left" ticks={3} symbol="kernel" format={(v) => v.toFixed(kTop < 0.1 ? 3 : kTop < 1 ? 2 : 1)} />
          </Plot>
        </div>
        <div className="relative min-h-0">
          <Plot
            width={320}
            height={190}
            fill
            xDomain={[1, 5]}
            yDomain={[0, curveTop]}
            margin={{ top: 10, right: 12, bottom: 34, left: 48 }}
            ariaLabel="Bias massimo in funzione di N, scala logaritmica"
            description={`${law === 'legge' ? 'Legge h_1/√N' : 'h fisso'}: ${curveText}.`}
          >
            <Grid axis="y" />
            <LinePath data={curve.map(([n, b]) => [Math.log10(n), b])} role="boundary" width={1.5} />
            <Dots data={curve.map(([n, b]) => ({ x: Math.log10(n), y: b }))} role="boundary" />
            <Dots data={[{ x: Math.log10(N), y: bias, label: `N = ${nLabel(N)}, bias ${pct(bias)}` }]} pin />
            <Axis side="bottom" symbol="N" ticks={[1, 2, 3, 4, 5]} format={LOG_TICK} />
            <Axis side="left" ticks={3} symbol="bias" format={(v) => `${Math.round(100 * v)}%`} />
          </Plot>
        </div>
      </div>
    </div>
  )

  const controls = (
    <>
      <Slider id={`${uid}-n`} label="Battiti in archivio" latex="N" min={0} max={N_STEPS.length - 1} step={1} value={N_STEPS.indexOf(N)} onChange={chooseN} format={(i) => nLabel(N_STEPS[Math.round(i)] ?? N)} />
      <Slider id={`${uid}-h1`} label="Larghezza con N = 1" latex="h_1" min={H1_RANGE[0]} max={H1_RANGE[1]} step={H1_STEP} value={h1} onChange={setH1} format={f0} unit="ms" />
      <Segmented<Law>
        id={`${uid}-law`}
        label="Come cambia h con N"
        options={[
          { value: 'legge', label: 'h_N = h₁/√N' },
          { value: 'fisso', label: 'h fisso' },
        ]}
        value={law}
        onChange={chooseLaw}
      />
      <Segmented<DKernel> id={`${uid}-k`} label="Kernel" options={D_KERNELS.map((k) => ({ value: k, label: LABEL[k] }))} value={kernel} onChange={setKernel} />
      <Toggle id={`${uid}-band`} label="Banda ±1 deviazione standard" hint="Quanto cambia la stima da un archivio all'altro, con questi N e h_N." checked={band} onChange={chooseBand} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Larghezza" latex="h_N" value={h} format={f2} unit="ms" />
        <Readout label="Picco del kernel" latex="\gamma(0)/h_N" value={peak} format={f4} />
        <Readout label="Bias massimo" value={pct(bias)} pinned />
        <Readout label="Area del kernel" value={area} format={f3} />
      </div>
      <SeriesLegend
        items={[
          { kind: 'line', role: 'truth', label: 'densità vera' },
          { kind: 'line', role: 'accent', width: 2.5, label: 'media della stima' },
          { kind: 'hatch', label: 'bias' },
          { kind: 'wash', role: 'kernel', label: 'kernel · ±1 dev. standard' },
        ]}
      />
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(sb.index, { N: nLabel(N), hN: f2(h), bias: pct(bias), h1: f0(h1) })} />
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">La successione h_N e il kernel riscalato</span>
        <LiveFormula tex={TEX_LIVE} values={values} />
        <span className="label">Non distorsione asintotica · asymptotically unbiased</span>
        <M tex={TEX_LIMIT_H} display />
        <M tex={TEX_DIRAC} display />
        <M tex={TEX_CONV_DIRAC} display />
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <NumberField id={`${uid}-guess`} label="Battiti necessari" latex="N" min={1} max={100000} step={1} value={guess} onChange={setGuess} format={f0} />
      {valid !== null ? (
        <Verdict ok={valid.verdict.ok}>
          Serve h_N ≈ <span className="num">{f2(valid.verdict.h)} ms</span>, cioè N = (60/{f2(valid.verdict.h)})² ≈ <span className="num">{f0(valid.verdict.target)}</span> battiti; tu hai scritto {f0(guess)}
          {valid.verdict.ok ? ', dentro il 15%.' : '.'}
        </Verdict>
      ) : null}
      <Note>Il Play percorre la scala a fattori √10: con h_1 = 60 ms, 100 battiti danno h_N = 6 ms, 316 già 3.4 ms. Il numero giusto sta fra i due.</Note>
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={1.2} onReset={reset} transport={<PlayControls sb={sb} steps={steps} />} caption={caption} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
