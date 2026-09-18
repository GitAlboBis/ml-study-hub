// m09-delta-ampiezza-larghezza: δ(x), più stretta vuol dire più alta (concetti c25 δ(x) = (1/V(h)) γ(x/h), c27 h
// agisce su ampiezza e larghezza ad area costante, c31 la figura delle finestre normali 2-D, h = 1, 0.5, 0.2).
// La finestra attorno a un pixel di vegetazione (rosso × vicino infrarosso, in z-score) come superficie a reticolo,
// con la sezione lungo la banda del rosso, il contatore del volume e le miniature della slide p56.
//
// STRUTTURA. Logica e testi in delta.ts, geometria del reticolo in wireframe.ts (con i test); qui il terreno, i
// comandi, le formule e la sfida.
//
// MOTO. Storyboard: h scende a 0.5 e a 0.2 (scala logaritmica, ease-in-out), la formula si scompone in due effetti
// (prima la larghezza, poi l'ampiezza), h → 0 in 3 s fino alla freccia della delta di Dirac. La scala verticale si
// adatta al picco in 200 ms (ease-out). Slider, preset, rotazione della vista: nessuna animazione.
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { linspace } from '../../lib/ml/stats'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { LiveFormula } from '../kit/LiveFormula'
import { NumberField } from '../kit/NumberField'
import { PlayControls } from '../kit/PlayControls'
import { AreaPath } from '../kit/plot/AreaPath'
import { Axis } from '../kit/plot/Axis'
import { Grid } from '../kit/plot/Grid'
import { LinePath } from '../kit/plot/LinePath'
import { Plot } from '../kit/plot/Plot'
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
  DIRAC_BELOW,
  DOMAIN,
  H0,
  H_RANGE,
  H_STEP,
  PRESETS,
  SLIDE_SCALE,
  STEP,
  STEPS,
  TEX_AMP,
  TEX_DELTA,
  TEX_NORMAL2,
  TEX_SPLIT,
  captionFor,
  decomposition,
  deltaAt,
  hBetween,
  hToZero,
  judge,
  measure,
  peak,
  peakTable,
  texPeak,
  zTopFor,
} from './delta'
import type { Dim } from './delta'
import { useTween } from './parzen-lab-motion'
import { Wireframe3d } from './parzen-lab-3d'
import { Note, Stamp, Verdict } from './parzen-lab-ui'
import { mesh } from './wireframe'

export const meta: WidgetMeta = {
  id: 'm09-delta-ampiezza-larghezza',
  moduleId: 'm09-parzen-windows',
  title: 'δ(x): più stretta vuol dire più alta',
  concepts: ['c25', 'c27', 'c31'],
  scenario: 'telerilevamento',
  scenarioNote: 'Un pixel di vegetazione nel piano rosso × vicino infrarosso di un’immagine da drone',
  size: 'M',
}

const f2 = fixed(2)
const f3 = fixed(3)
/** Il picco con tre cifre significative: 0.159, 0.637, 3.98, 63.7. */
const sig3 = (v: number) => (v >= 100 ? fixed(0)(v) : v >= 10 ? fixed(1)(v) : v >= 1 ? fixed(2)(v) : fixed(3)(v))
const SECTION = linspace(DOMAIN[0], DOMAIN[1], 401)

/** Miniatura statica della slide: la finestra con uno dei tre h e la sua scala verticale. */
function MiniSurface({ h, current }: { h: number; current: boolean }) {
  const W = 120
  const H = 80
  const top = SLIDE_SCALE[h] ?? 1
  const m = useMemo(() => mesh((x, y) => deltaAt(x, y, h, 2), DOMAIN, DOMAIN, top, { azimuth: 30, elevation: 28 }, { width: W, height: H, pad: 4 }, 13, 25), [h, top])
  const path = (pts: [number, number][]) => `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}`
  return (
    <figure className={`m-0 grid gap-0.5 border p-1 ${current ? 'border-2 border-border-strong bg-surface-2' : 'border-border bg-surface'}`} data-mini={current ? 'corrente' : ''}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true">
        <path d={`${path(m.base)}Z`} fill="var(--surface-2)" stroke="var(--viz-axis)" strokeWidth={0.75} />
        <g fill="none" stroke="var(--text-muted)" strokeWidth={0.6}>
          {m.lines.map((l, i) => (
            <path key={i} d={path(l)} />
          ))}
        </g>
      </svg>
      <figcaption className="num flex items-center justify-between gap-1 text-[length:var(--step--1)]">
        <span>h = {h}</span>
        <span className="text-muted">scala {top}</span>
        {current ? <span aria-hidden="true" className="size-2.5 border border-border-strong bg-pin" /> : null}
      </figcaption>
    </figure>
  )
}

export default function DeltaAmpiezzaLarghezza() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [hUser, setHUser] = useState(H0)
  const [nUser, setNUser] = useState<Dim>(2)
  const [azimuth, setAzimuth] = useState(35)
  const [takeover, setTakeover] = useState<number | null>(null)
  const [two, setTwo] = useState(1)
  const [one, setOne] = useState(1)
  const [checked, setChecked] = useState<{ key: string; verdict: ReturnType<typeof judge> } | null>(null)

  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const story = takeover !== at
  // h e n che si vedono: imposti dal racconto nei suoi passi, altrimenti quelli dei comandi
  let h = hUser
  if (story && at === STEP.stringi) h = hBetween(hUser, 0.5, pr)
  else if (story && at === STEP.ago) h = hBetween(0.5, 0.2, pr)
  else if (story && at === STEP.scomponi) h = 0.5
  else if (story && at === STEP.dirac) h = hToZero(pr)
  const n: Dim = story && at === STEP.dimensioni ? 1 : nUser
  const split = story && at === STEP.scomponi ? decomposition(pr, h, n) : null
  const f = split !== null ? split.f : (x: number, y: number) => deltaAt(x, y, h, n)
  const pk = split !== null ? split.f(0, 0) : peak(h, n)
  const vol = split !== null ? measure(1, n, split.width, split.amp) : measure(h, n)
  const dirac = story && at === STEP.dirac && h < DIRAC_BELOW

  const tweened = useTween(zTopFor(pk), 200)
  const zTop = story && at === STEP.dirac ? 4 : tweened

  // --- azioni ---
  const takeOver = () => {
    if (at !== STEP.quadro && at !== STEP.torna && takeover !== at) {
      sb.pause()
      setTakeover(at)
    }
  }
  const chooseH = (v: number) => {
    takeOver()
    setHUser(v)
  }
  const chooseN = (v: Dim) => {
    takeOver()
    setNUser(v)
  }
  const play = (i: number) => {
    setTakeover(null)
    sb.goto(i)
    sb.play()
  }
  const reset = () => {
    sb.reset()
    setHUser(H0)
    setNUser(2)
    setAzimuth(35)
    setTakeover(null)
    setTwo(1)
    setOne(1)
    setChecked(null)
  }

  const checkKey = `${two}|${one}`
  const verify = () => setChecked({ key: checkKey, verdict: judge(two, one) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  const values = { h, peak: pk, vol }
  const sectionPts = SECTION.map((x) => [x, f(x, 0)])
  const summary = `${n === 2 ? 'Finestra normale in due dimensioni' : 'Finestra normale in una dimensione'} con h = ${f2(h)}: picco ${sig3(pk)}, ${n === 2 ? 'volume' : 'area'} ${f3(vol)}.${dirac ? ' Disegnata come delta di Dirac.' : ''}`

  const terrain = (
    <div className="absolute inset-0 grid grid-rows-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="relative min-h-0 border-b border-border bg-surface">
        {n === 2 ? (
          <Wireframe3d
            f={f}
            xDomain={DOMAIN}
            yDomain={DOMAIN}
            zTop={zTop}
            azimuth={azimuth}
            onRotate={setAzimuth}
            label="Vista 3-D della finestra δ(x): frecce per ruotarla"
            description={summary}
            xLabel="rosso"
            yLabel="NIR"
            marks={[{ x: 0, y: 0, z: pk, label: `δ(0) = ${sig3(pk)}`, pin: true }]}
            dirac={dirac}
          />
        ) : (
          <Plot width={560} height={260} fill xDomain={DOMAIN} yDomain={[0, zTop]} margin={{ top: 14, right: 12, bottom: 34, left: 52 }} ariaLabel="La finestra δ(x) in una dimensione" description={summary}>
            <Grid axis="y" />
            <AreaPath data={sectionPts} role="kernel" opacity={0.18} />
            <LinePath data={sectionPts} role="kernel" width={2.5} />
            <Axis side="bottom" symbol="x" />
            <Axis side="left" symbol="δ(x)" format={sig3} />
          </Plot>
        )}
        {dirac ? <Stamp side="left" it="Delta di Dirac: stesso simbolo δ, significato limite" en="slide p60" /> : null}
      </div>
      <div className="relative min-h-0">
        <Plot
          width={560}
          height={170}
          fill
          xDomain={DOMAIN}
          yDomain={[0, zTop]}
          margin={{ top: 12, right: 12, bottom: 34, left: 52 }}
          ariaLabel={n === 2 ? 'Sezione della finestra lungo la banda del rosso' : 'La finestra in una dimensione'}
          description={`Picco ${sig3(pk)} in x = 0.`}
        >
          <Grid axis="y" />
          <LinePath data={sectionPts} role="kernel" width={2} />
          <Axis side="bottom" label={n === 2 ? 'sezione lungo il rosso' : undefined} symbol="x₁" />
          <Axis side="left" symbol="δ" format={sig3} />
        </Plot>
      </div>
    </div>
  )

  const controls = (
    <>
      <Segmented
        id={`${uid}-n`}
        label="Dimensione"
        options={[
          { value: '1', label: 'n = 1' },
          { value: '2', label: 'n = 2' },
        ]}
        value={String(nUser) as '1' | '2'}
        onChange={(v) => chooseN(v === '1' ? 1 : 2)}
      />
      <Slider id={`${uid}-h`} label="Larghezza della finestra" latex="h" min={H_RANGE[0]} max={H_RANGE[1]} step={H_STEP} value={hUser} onChange={chooseH} format={f2} />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Valori di h della slide">
        {PRESETS.map((p) => (
          <ActionButton key={p} onClick={() => chooseH(p)} aria-pressed={Math.abs(hUser - p) < 1e-9}>
            h = {p}
          </ActionButton>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => play(STEP.scomponi)}>Scomponi la formula</ActionButton>
        <ActionButton onClick={() => play(STEP.dirac)}>h → 0</ActionButton>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Picco" latex="\delta(\mathbf{0})" value={sig3(pk)} pinned />
        <Readout label={n === 2 ? 'Volume' : 'Area'} latex="\textstyle\int\delta" value={vol} format={f3} />
        {split !== null ? (
          <>
            <Readout label="Larghezza" latex="\mathbf{x}/h" value={split.width} format={f2} />
            <Readout label="Fattore d'ampiezza" latex="1/h^n" value={split.amp} format={f2} />
          </>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <span className="label">Le tre figure della slide p56</span>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <MiniSurface key={p} h={p} current={Math.abs(h - p) < 0.005 && n === 2} />
          ))}
        </div>
      </div>
      <Note>La vista 3-D si ruota trascinandola, oppure con le frecce dopo averla raggiunta con Tab (15° a pressione).</Note>
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(sb.index, { h: f2(h), peak: sig3(pk), n })} />
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">Il picco con h sostituito</span>
        <LiveFormula tex={texPeak(n)} values={values} format={(v, name) => (name === 'peak' ? sig3(v) : f2(v))} />
        <span className="label">La finestra riscalata · window width effect</span>
        <M tex={TEX_DELTA} display />
        <M tex={TEX_SPLIT} display />
        <M tex={TEX_AMP} display />
        <M tex={TEX_NORMAL2} display />
      </div>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Picchi in una e due dimensioni">
        <table className="num w-full border-collapse text-right text-[length:var(--step--1)]">
          <caption className="label pb-1 text-left">Il picco δ(0) in una e due dimensioni</caption>
          <thead>
            <tr className="border-b border-border-strong text-muted">
              <th scope="col" className="py-1 pr-2 text-left font-normal">
                h
              </th>
              <th scope="col" className="px-2 py-1 font-normal">
                1-D: 1/(√(2π) h)
              </th>
              <th scope="col" className="py-1 pl-2 font-normal">
                2-D: 1/(2π h²)
              </th>
            </tr>
          </thead>
          <tbody>
            {peakTable().map((r) => (
              <tr key={r.h} className="border-b border-border">
                <th scope="row" className="py-0.5 pr-2 text-left font-normal">
                  {r.h}
                </th>
                <td className="px-2 py-0.5">{sig3(r.one)}</td>
                <td className="py-0.5 pl-2">{sig3(r.two)}</td>
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
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField id={`${uid}-two`} label="Fattore in 2-D" latex="\times" min={0} max={100} step={0.1} value={two} onChange={setTwo} format={fixed(1)} />
        <NumberField id={`${uid}-one`} label="Fattore in 1-D" latex="\times" min={0} max={100} step={0.1} value={one} onChange={setOne} format={fixed(1)} />
      </div>
      {valid !== null ? (
        <div className="grid gap-2">
          <Verdict ok={valid.verdict.two}>In 2-D il picco va da 0.159 a 3.98: ×25, cioè 5².</Verdict>
          <Verdict ok={valid.verdict.one}>In 1-D va da 0.399 a 1.995: ×5.</Verdict>
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={1.05} onReset={reset} transport={<PlayControls sb={sb} steps={steps} />} caption={caption} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
