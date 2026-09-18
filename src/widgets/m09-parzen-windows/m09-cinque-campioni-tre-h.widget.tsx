// m09-cinque-campioni-tre-h: cinque campioni, tre larghezze (concetti c28 oversmoothing, c29 stima molto variabile,
// c32 la figura delle tre stime di Parzen sugli stessi cinque campioni). Cinque pixel "acqua" in due bande: a sinistra
// la pianta con le tinte e le curve di livello della stima, a destra la superficie a reticolo come nella slide p57.
// Preset h = 1, 0.5, 0.2, contatore dei massimi locali, scala della slide (somma senza 1/N), estrazioni ripetute.
//
// STRUTTURA. Logica e testi in cinque.ts, reticolo in wireframe.ts (con i test); qui terreno, comandi, sfida.
//
// MOTO. Storyboard: h passa a 1, 0.5 e 0.2 in scala logaritmica (ease-in-out) e la superficie lo segue; la scala
// verticale si adatta in 200 ms (ease-out). Trascinare i pixel, ruotare la vista, muovere h: nessuna animazione.
import { useCallback, useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { LiveFormula } from '../kit/LiveFormula'
import { NumberField } from '../kit/NumberField'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Contours } from '../kit/plot/Contours'
import { Dots } from '../kit/plot/Dots'
import { FieldCanvas } from '../kit/plot/FieldCanvas'
import { Plot } from '../kit/plot/Plot'
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
  H0,
  H_RANGE,
  H_STEP,
  PRESETS,
  SAMPLES0,
  STEP,
  STEPS,
  TEX_FIVE,
  TEX_LIVE,
  TEX_SLIDE,
  XD,
  YD,
  captionFor,
  countMaxima,
  drawSet,
  estimate,
  hOfStep,
  judge,
  needle,
  regimeOf,
} from './cinque'
import type { ChallengeVerdict, P2, Why } from './cinque'
import { useTween } from './parzen-lab-motion'
import { Wireframe3d } from './parzen-lab-3d'
import { Note, Stamp, Verdict } from './parzen-lab-ui'

export const meta: WidgetMeta = {
  id: 'm09-cinque-campioni-tre-h',
  moduleId: 'm09-parzen-windows',
  title: 'Cinque campioni, tre larghezze: sfocato o ad aghi',
  concepts: ['c28', 'c29', 'c32'],
  scenario: 'telerilevamento',
  scenarioNote: 'Cinque pixel etichettati "acqua" in due bande spettrali: l’etichettatura a terra costa',
  size: 'L',
}

const f1 = fixed(1)
const f2 = fixed(2)
const f3 = fixed(3)
const f4 = fixed(4)
const REGIME = {
  aghi: { it: 'Stima molto variabile: insegue i singoli campioni', en: 'h small · highly variable estimate' },
  intermedio: { it: 'Intermedio: cinque campane riconoscibili', en: 'h medium' },
  liscia: { it: 'Oversmoothing: i dettagli si perdono', en: 'h large · oversmoothing' },
} as const

type View = 'entrambe' | 'pianta' | 'superficie'

/** Una piccola carta con le curve di livello di cinque estrazioni sovrapposte, con lo stesso h. */
function Draws({ h }: { h: number }) {
  const sets = useMemo(() => [1, 2, 3, 4, 5].map((s) => drawSet(100 + s)), [])
  const fns = useMemo(() => sets.map((set) => (x: number, y: number) => estimate(x, y, set, h)), [sets, h])
  const level = needle(1, 5) * (h <= 0.3 ? 2 : 0.5)
  return (
    <figure className="m-0 grid gap-1">
      <Plot width={260} height={200} xDomain={XD} yDomain={YD} margin={{ top: 6, right: 6, bottom: 24, left: 28 }} ariaLabel={`Cinque estrazioni sovrapposte con h = ${h}`} description={`Curve di livello di cinque stime con h = ${h}, da cinque estrazioni della stessa densità vera.`}>
        {fns.map((fn, i) => (
          <Contours key={i} fn={fn} thresholds={[level]} resolution={48} role="estimate" width={1.5} opacity={0.35 + 0.13 * i} />
        ))}
        <Axis side="bottom" ticks={[0, 5, 10]} />
        <Axis side="left" ticks={[0, 4, 8]} />
      </Plot>
      <figcaption className="label">h = {h}</figcaption>
    </figure>
  )
}

export default function CinqueCampioniTreH() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [samples, setSamples] = useState<P2[]>([...SAMPLES0])
  const [hUser, setHUser] = useState(H0)
  const [slide, setSlide] = useState(false)
  const [view, setView] = useState<View>('entrambe')
  const [azimuth, setAzimuth] = useState(30)
  const [seed, setSeed] = useState(0)
  const [cursor, setCursor] = useState<P2>([2.8, 4.2])
  const [takeover, setTakeover] = useState<number | null>(null)
  const [lo, setLo] = useState(0.1)
  const [hi, setHi] = useState(0.1)
  const [why, setWhy] = useState<Why>('')
  const [checked, setChecked] = useState<{ key: string; verdict: ChallengeVerdict } | null>(null)

  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const story = takeover !== at
  const h = (story ? hOfStep(at, pr, hUser) : null) ?? hUser
  const slideShown = slide || (story && at === STEP.scala)

  const fn = useCallback((x: number, y: number) => estimate(x, y, samples, h, slideShown), [samples, h, slideShown])
  const maxima = useMemo(() => countMaxima(samples, h), [samples, h])
  const peak = useMemo(() => {
    let m = 0
    for (const [a, b] of samples) m = Math.max(m, estimate(a, b, samples, h, slideShown))
    return m
  }, [samples, h, slideShown])
  const zTop = useTween(Math.max(0.02, 1.12 * peak), 200)
  const regime = regimeOf(h)
  const pCursor = estimate(cursor[0], cursor[1], samples, h, slideShown)

  // --- azioni ---
  const takeOver = () => {
    if (hOfStep(at, 1, hUser) !== null && takeover !== at) {
      sb.pause()
      setTakeover(at)
    }
  }
  const chooseH = (v: number) => {
    takeOver()
    setHUser(v)
  }
  const moveSample = (id: string, x: number, y: number) => setSamples((s) => s.map((p, i) => (`s${i}` === id ? ([Number(x.toFixed(1)), Number(y.toFixed(1))] as const) : p)))
  const resample = () => {
    const next = seed + 1
    setSeed(next)
    setSamples(drawSet(next))
  }
  const reset = () => {
    sb.reset()
    setSamples([...SAMPLES0])
    setHUser(H0)
    setSlide(false)
    setView('entrambe')
    setAzimuth(30)
    setSeed(0)
    setCursor([2.8, 4.2])
    setTakeover(null)
    setLo(0.1)
    setHi(0.1)
    setWhy('')
    setChecked(null)
  }

  const checkKey = `${samples.map((p) => p.join(',')).join(';')}|${lo}|${hi}|${why}`
  const verify = () => setChecked({ key: checkKey, verdict: judge(samples, lo, hi, why) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  const values = { h, x1: cursor[0], x2: cursor[1], p: pCursor, needle: needle(h, samples.length, slideShown) }
  const summary = `Cinque pixel; h = ${f2(h)}; ${maxima} massimi locali; picco ${f3(peak)}${slideShown ? ' (somma senza 1/N, scala della slide)' : ''}. Nel punto (${f1(cursor[0])}, ${f1(cursor[1])}) la stima vale ${f4(pCursor)}.`
  const showPlan = view !== 'superficie'
  const showSurface = view !== 'pianta'

  const terrain = (
    <div className={`absolute inset-0 grid ${showPlan && showSurface ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {showPlan ? (
        <div className={`relative min-h-0 min-w-0 ${showSurface ? 'border-r border-border' : ''}`}>
          <Plot
            width={440}
            height={380}
            fill
            xDomain={XD}
            yDomain={YD}
            margin={{ top: 10, right: 10, bottom: 38, left: 40 }}
            ariaLabel="Pianta: tinte e curve di livello della stima, con i cinque pixel"
            description={summary}
            cursor="xy"
            cursorFormat={(x, y) => `p̂(${f1(x)}, ${f1(y)}) = ${f4(estimate(x, y, samples, h, slideShown))}`}
            onCursor={(pt) => {
              if (pt !== null) setCursor([Number(pt.x.toFixed(1)), Number(pt.y.toFixed(1))])
            }}
          >
            <FieldCanvas fn={fn} resolution={72} valueDomain={[0, peak]} />
            <Contours fn={fn} resolution={72} valueDomain={[0, peak]} thresholds={6} />
            <Dots data={samples.map((p, i) => ({ x: p[0], y: p[1], id: `s${i}`, label: `Pixel ${i + 1}` }))} draggable step={0.1} onDrag={moveSample} format={f1} />
            <Axis side="bottom" label="banda 1" symbol="x₁" />
            <Axis side="left" label="banda 2" symbol="x₂" />
          </Plot>
        </div>
      ) : null}
      {showSurface ? (
        <div className="relative min-h-0 min-w-0 bg-surface">
          <Wireframe3d
            f={(x, y) => estimate(x, y, samples, h, slideShown)}
            xDomain={XD}
            yDomain={YD}
            zTop={zTop}
            azimuth={azimuth}
            onRotate={setAzimuth}
            width={420}
            height={380}
            lines={29}
            label="Superficie della stima: frecce per ruotarla"
            description={`Superficie della stima con h = ${f2(h)}, scala verticale fino a ${f3(zTop)}.`}
            xLabel="banda 1"
            yLabel="banda 2"
            marks={[{ x: cursor[0], y: cursor[1], z: pCursor, label: '', pin: true }]}
          />
          <p className="num pointer-events-none absolute bottom-1 left-2 m-0 text-[length:var(--step--1)] text-muted">scala verticale: {f3(zTop)}</p>
        </div>
      ) : null}
      <Stamp side="right" it={REGIME[regime].it} en={REGIME[regime].en} />
    </div>
  )

  const controls = (
    <>
      <Slider id={`${uid}-h`} label="Larghezza della finestra" latex="h" min={H_RANGE[0]} max={H_RANGE[1]} step={H_STEP} value={hUser} onChange={chooseH} format={f2} />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Le tre h della slide">
        {PRESETS.map((p) => (
          <ActionButton key={p} onClick={() => chooseH(p)} aria-pressed={Math.abs(hUser - p) < 1e-9}>
            h = {p}
          </ActionButton>
        ))}
        <ActionButton onClick={resample}>Ricampiona</ActionButton>
      </div>
      <Toggle id={`${uid}-slide`} label="Scala come nella slide" hint="La somma delle finestre, senza 1/N: cinque volte la stima vera." checked={slide} onChange={setSlide} />
      <Segmented
        id={`${uid}-view`}
        label="Vista"
        options={[
          { value: 'entrambe', label: 'entrambe' },
          { value: 'pianta', label: 'pianta' },
          { value: 'superficie', label: 'superficie' },
        ]}
        value={view}
        onChange={setView}
      />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Massimi locali" value={maxima} format={fixed(0)} pinned />
        <Readout label="Stima nel punto" latex="\hat p(\mathbf{x})" value={pCursor} format={f4} />
        <Readout label="Un ago isolato" latex="\tfrac{1}{N}\tfrac{1}{2\pi h^2}" value={needle(h, samples.length, slideShown)} format={f3} />
        <Readout label="Picco della superficie" value={peak} format={f3} />
      </div>
      <Note>I pixel si trascinano nella pianta, oppure si raggiungono con Tab e si spostano con le frecce. Il punto letto è quello del cursore sulla pianta (frecce, dopo averlo raggiunto con Tab).</Note>
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(sb.index, { h: f2(h), maxima, needle: f3(needle(h)) })} />
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">La stima dei cinque pixel · Parzen window density estimates</span>
        <M tex={TEX_FIVE} display />
        <LiveFormula tex={TEX_LIVE} values={values} />
        <M tex={TEX_SLIDE} display />
      </div>
      <div className="grid gap-2 border-t border-border pt-3">
        <span className="label">Cinque estrazioni dalla stessa densità vera: varianza contro bias</span>
        <div className="grid grid-cols-2 gap-3">
          <Draws h={0.2} />
          <Draws h={1} />
        </div>
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          Con h = 0.2 le curve di livello delle cinque estrazioni non si somigliano (varianza); con h = 1 quasi coincidono ma sono larghe e sfocate (bias).
        </p>
      </div>
    </div>
  )

  const target = valid?.verdict.target
  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField id={`${uid}-lo`} label="Il contatore vale 3 da h =" min={0.1} max={2} step={0.01} value={lo} onChange={setLo} format={f2} />
        <NumberField id={`${uid}-hi`} label="fino a h =" min={0.1} max={2} step={0.01} value={hi} onChange={setHi} format={f2} />
      </div>
      <Segmented<Why>
        id={`${uid}-why`}
        label="Fuori da quell'intervallo la storia cambia perché"
        options={[
          { value: 'lisciare', label: 'h decide quanto lisciare' },
          { value: 'dati', label: 'i dati cambiano con h' },
          { value: 'volume', label: 'il volume cambia con h' },
        ]}
        value={why}
        onChange={setWhy}
      />
      {valid !== null ? (
        <div className="grid gap-2">
          <Verdict ok={valid.verdict.rangeOk}>
            {target === null || target === undefined
              ? 'Con questi pixel il contatore non vale mai 3: premi Reset.'
              : `Il contatore vale 3 per h da ${f2(target[0])} a ${f2(target[1])}; tu hai scritto da ${f2(lo)} a ${f2(hi)}.`}
          </Verdict>
          <Verdict ok={valid.verdict.whyOk}>
            I dati sono sempre gli stessi e il volume è sempre 1: cambia solo quanto la stima liscia. Con h piccolo vede i singoli pixel, con h grande fonde anche i gruppi lontani.
          </Verdict>
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={2} onReset={reset} transport={<PlayControls sb={sb} steps={steps} />} caption={caption} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
