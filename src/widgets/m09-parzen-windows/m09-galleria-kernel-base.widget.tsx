// m09-galleria-kernel-base: rettangolare, triangolare, gaussiano (concetti c33, c34, c35). Tre schede, una per kernel:
// sopra la forma con i valori notevoli della slide p58 e una lista di controllo (area 1, massimo nell'origine,
// continuità, decadimento); sotto la stessa nuvola di 25 cifre "0" stimata con quel kernel, con una lente ×6 che
// mostra salti, spigoli o morbidezza. L'ultima scheda chiede di ricomporre a tessere la formula del gaussiano.
//
// STRUTTURA. Logica, dati e testi in galleria-base.ts (con i test); qui terreno, schede, lente, tessere e sfida.
//
// MOTO. Cambiare scheda è un gesto raro e che spiega: la stima si trasforma nella nuova in 300 ms (ease-in-out) e le
// voci della lista si accendono in sequenza, 300 ms l'una. Nel racconto lo stesso accade a ogni passo; nel passo
// della lente la lente scorre lungo la stima. Slider, lente e tessere: nessuna animazione. Reduced motion: subito.
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { linspace } from '../../lib/ml/stats'
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
  DOMAIN,
  H0,
  H_RANGE,
  H_STEP,
  KERNEL_TEX,
  LENS_HALF,
  NOTABLE,
  SAMPLES,
  SLOTS,
  SNIPPETS,
  SNIPPET_CENTER,
  STEP,
  STEPS,
  TEX_GAUSS_EST,
  TEX_LIVE,
  TILES,
  captionFor,
  checklist,
  estimate,
  estimateArea,
  formulaOk,
  gridFor,
  judge,
  kernelFn,
  smoothness,
  tabOfStep,
} from './galleria-base'
import type { BaseKernel, Slot, Tab } from './galleria-base'
import { gammaOf, jumpPoints, kde, morphGamma } from './parzen-lab'
import { useTween } from './parzen-lab-motion'
import { AreaMeter, JumpMarks, Lamp, Note, Rug, Verdict } from './parzen-lab-ui'

export const meta: WidgetMeta = {
  id: 'm09-galleria-kernel-base',
  moduleId: 'm09-parzen-windows',
  title: 'Galleria dei kernel 1: rettangolare, triangolare, gaussiano',
  concepts: ['c33', 'c34', 'c35'],
  scenario: 'cifre',
  scenarioNote: 'Cifre scritte a mano 8×8: frazione di pixel accesi in 25 immagini della classe "0"',
  size: 'M',
}

const f3 = fixed(3)
const n2 = (v: number) => Number(v.toFixed(2))
const MORPH_MS = 300
const LAMP_MS = 300
const REVEAL_MS = MORPH_MS + 4 * LAMP_MS
const U = linspace(-3, 3, 601)
const LABEL: Readonly<Record<BaseKernel, string>> = { rettangolare: 'rettangolare', triangolare: 'triangolare', gaussiano: 'gaussiano' }
const Y_EST = 9

/** Quanto è avanzata la "rivelazione" di una scheda dopo `ms`: la forma che si trasforma, poi le voci una alla volta. */
const reveal = (ms: number) => ({ mix: easeInOut(Math.min(1, ms / MORPH_MS)), lamps: Math.max(0, Math.min(4, Math.floor((ms - MORPH_MS) / LAMP_MS) + 1)) })

/** Gli spigoli del triangolo (non derivabile): piccoli rombi a inchiostro sul kernel. */
function Kinks({ at }: { at: readonly [number, number][] }) {
  const { x, y } = usePlot()
  return (
    <g data-kinks="" pointerEvents="none">
      {at.map(([u, v], i) => (
        <rect key={i} x={n2(x(u)) - 4} y={n2(y(v)) - 4} width={8} height={8} fill="none" stroke="var(--text)" strokeWidth={1.5} transform={`rotate(45 ${n2(x(u))} ${n2(y(v))})`} />
      ))}
    </g>
  )
}

/** Il riquadro della lente sulla stima: bordo a inchiostro, velatura ocra. */
function LensBox({ c, top }: { c: number; top: number }) {
  const { x, y } = usePlot()
  return <rect data-lens-box="" x={n2(x(c - LENS_HALF))} y={n2(y(top))} width={n2(x(c + LENS_HALF) - x(c - LENS_HALF))} height={n2(y(0) - y(top))} fill="var(--pin)" fillOpacity={0.12} stroke="var(--pin-contrast)" strokeWidth={1.25} pointerEvents="none" />
}

/** Miniatura di un tratto ingrandito (sfida): la stima nel tratto, senza assi. */
function MiniZoom({ kernel, label }: { kernel: BaseKernel; label: string }) {
  const W = 200
  const H = 80
  const d = useMemo(() => {
    const xs = gridFor(SAMPLES, H0, SNIPPET_CENTER - LENS_HALF, SNIPPET_CENTER + LENS_HALF, 241)
    const ys = estimate(xs, H0, kernel)
    const top = Math.max(...ys) * 1.1
    return xs.map((v, i) => `${i === 0 ? 'M' : 'L'}${n2(((v - xs[0]) / (xs[xs.length - 1] - xs[0])) * W)},${n2(H - 4 - (ys[i] / top) * (H - 10))}`).join('')
  }, [kernel])
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full border border-border bg-surface" role="img" aria-label={label}>
      <path d={d} fill="none" stroke="var(--viz-estimate)" strokeWidth={2} />
    </svg>
  )
}

type Answers = Record<'A' | 'B' | 'C', BaseKernel | ''>
const NO_ANSWERS: Answers = { A: '', B: '', C: '' }

export default function GalleriaKernelBase() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [tab, setTab] = useState<Tab>('gaussiano')
  const [prev, setPrev] = useState<BaseKernel>('gaussiano')
  const [version, setVersion] = useState(0)
  const [h, setH] = useState(H0)
  const [half, setHalf] = useState(false)
  const [lensUser, setLensUser] = useState(Number(SNIPPET_CENTER.toFixed(3)))
  const [probe, setProbe] = useState(0.43)
  const [takeover, setTakeover] = useState<number | null>(null)
  const [placed, setPlaced] = useState<Partial<Record<Slot, string>>>({})
  const [picked, setPicked] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Answers>(NO_ANSWERS)
  const [checked, setChecked] = useState<{ key: string; verdict: ReturnType<typeof judge> } | null>(null)

  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const story = takeover !== at
  const imposedTab = story ? tabOfStep(at) : null
  const shownTab: Tab = imposedTab ?? tab
  const kernel: BaseKernel = shownTab === 'comune' ? 'gaussiano' : shownTab
  const halfShown = kernel === 'rettangolare' && (half || (story && at === STEP.meta))

  // rivelazione: nel racconto la guida il passo, altrimenti il tween dell'ultimo cambio di scheda
  const tweened = useTween(version, REVEAL_MS)
  const userProgress = Math.min(1, Math.max(0, 1 - (version - tweened)))
  const storyRevealing = imposedTab !== null && imposedTab !== 'comune' && at !== STEP.meta
  const r = storyRevealing ? reveal(pr * steps[at].durationMs) : reveal(userProgress * REVEAL_MS)
  const from: BaseKernel = storyRevealing ? (at === STEP.rett ? 'gaussiano' : at === STEP.tri ? 'rettangolare' : 'triangolare') : prev
  const gamma = r.mix >= 1 ? kernelFn(kernel, halfShown) : morphGamma(gammaOf(from), kernelFn(kernel, halfShown), r.mix)

  const lensC = story && at === STEP.lente ? 0.3 + (0.55 - 0.3) * easeInOut(pr) : lensUser
  const xs = useMemo(() => gridFor(SAMPLES, h), [h])
  const est = kde(xs, SAMPLES, h, gamma)
  const lensXs = gridFor(SAMPLES, h, lensC - LENS_HALF, lensC + LENS_HALF, 241)
  const lensYs = kde(lensXs, SAMPLES, h, gamma)
  const lensTop = Math.max(1e-6, ...lensYs) * 1.15
  const kPts = U.map((u) => [u, gamma(u)])
  const cl = checklist(kernel, halfShown)
  const area = useMemo(() => estimateArea(h, kernel, halfShown), [h, kernel, halfShown])
  const pProbe = kde([probe], SAMPLES, h, gamma)[0]

  // --- azioni ---
  const chooseTab = (t: Tab) => {
    if (imposedTab !== null) {
      sb.pause()
      setTakeover(at)
    }
    setPrev(kernel)
    setTab(t)
    setVersion((v) => v + 1)
  }
  const moveLens = (v: number) => {
    if (story && at === STEP.lente) {
      sb.pause()
      setTakeover(at)
    }
    setLensUser(Number(v.toFixed(3)))
  }
  const place = (slot: Slot) => {
    if (picked === null) {
      setPlaced((p) => ({ ...p, [slot]: undefined }))
      return
    }
    setPlaced((p) => {
      const next: Partial<Record<Slot, string>> = {}
      for (const s of SLOTS) if (p[s] !== picked) next[s] = p[s]
      next[slot] = picked
      return next
    })
    setPicked(null)
  }
  const reset = () => {
    sb.reset()
    setTab('gaussiano')
    setPrev('gaussiano')
    setVersion(0)
    setH(H0)
    setHalf(false)
    setLensUser(Number(SNIPPET_CENTER.toFixed(3)))
    setProbe(0.43)
    setTakeover(null)
    setPlaced({})
    setPicked(null)
    setAnswers(NO_ANSWERS)
    setChecked(null)
  }

  const checkKey = `${answers.A}|${answers.B}|${answers.C}|${SLOTS.map((s) => placed[s] ?? '').join(',')}`
  const verify = () => setChecked({ key: checkKey, verdict: judge(answers, placed) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  const values = { x: probe, N: SAMPLES.length, h, p: pProbe, area }
  const estPts = xs.map((v, i) => [v, est[i]])
  const lensPts = lensXs.map((v, i) => [v, lensYs[i]])
  const summary = `Kernel ${LABEL[kernel]}${halfShown ? ' alto 1/2' : ''}, h = ${f3(h)}. La stima ${smoothness(kernel)}; area ${f3(area)}. Nel punto ${f3(probe)} vale ${f3(pProbe)}.`
  const tile = (id: string | undefined) => TILES.find((t) => t.id === id)

  const terrain = (
    <div className="absolute inset-0 grid grid-rows-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="relative min-h-0 border-b border-border">
        <Plot width={560} height={170} fill xDomain={[-3, 3]} yDomain={[0, 1.15]} margin={{ top: 10, right: 12, bottom: 30, left: 44 }} ariaLabel={`La forma del kernel ${LABEL[kernel]}`} description={`Supporto ${NOTABLE[kernel].support}, picco ${halfShown ? '1/2' : NOTABLE[kernel].peak}.`}>
          <Grid axis="y" yTicks={[0.5, 1]} />
          <LinePath data={kPts} role="kernel" width={2.5} />
          {kernel === 'rettangolare' && r.mix >= 1 ? <JumpMarks at={[-0.5, 0.5]} /> : null}
          {kernel === 'triangolare' && r.mix >= 1 ? <Kinks at={[[-1, 0], [0, 1], [1, 0]]} /> : null}
          <Axis side="bottom" ticks={[-3, -1, -0.5, 0, 0.5, 1, 3]} format={(v) => (v === 0.5 ? '½' : v === -0.5 ? '−½' : String(v))} symbol="u" />
          <Axis side="left" ticks={kernel === 'gaussiano' ? [0, 0.399, 1] : [0, 0.5, 1]} format={(v) => (v === 0.399 ? '.399' : String(v))} symbol="γ" />
        </Plot>
      </div>
      <div className="relative min-h-0">
        <Plot
          width={560}
          height={260}
          fill
          xDomain={DOMAIN}
          yDomain={[-1.4, Y_EST]}
          margin={{ top: 12, right: 12, bottom: 38, left: 44 }}
          ariaLabel="Stima della densità di classe sulle 25 cifre, con la lente"
          description={summary}
          cursor="x"
          cursorFormat={(cx) => `x = ${f3(cx)}`}
          onCursor={(pt) => {
            if (pt !== null) setProbe(Number(pt.x.toFixed(3)))
          }}
        >
          <Grid axis="y" yTicks={[2, 4, 6, 8]} />
          <LensBox c={lensC} top={Y_EST} />
          <LinePath data={estPts} role="estimate" width={2} />
          {kernel === 'rettangolare' && r.mix >= 1 ? <JumpMarks at={jumpPoints(SAMPLES, h, DOMAIN)} /> : null}
          <Rug items={SAMPLES.map((v) => ({ x: v }))} bottom={-1.4} from={Y_EST} />
          <Dots data={[{ x: lensC, y: Y_EST * 0.94, id: 'lente', label: 'Lente di ingrandimento' }]} draggable pin axis="x" step={0.005} onDrag={(_id, v) => moveLens(v)} format={f3} />
          <Axis side="bottom" label="frazione di pixel accesi" symbol="x" />
          <Axis side="left" ticks={[0, 2, 4, 6, 8]} symbol="p̂(x)" />
        </Plot>
        <figure className="pointer-events-none absolute top-2 right-2 m-0 grid gap-1 border border-border-strong bg-surface p-1.5 shadow-1" data-lens="">
          <div className="h-[92px] w-[168px]">
            <Plot width={168} height={92} fill xDomain={[lensC - LENS_HALF, lensC + LENS_HALF]} yDomain={[0, lensTop]} margin={{ top: 4, right: 4, bottom: 4, left: 4 }} ariaLabel="La stima ingrandita 6 volte">
              <LinePath data={lensPts} role="estimate" width={2} />
            </Plot>
          </div>
          <figcaption className="label text-[10px]">×6 · {smoothness(kernel)}</figcaption>
        </figure>
      </div>
    </div>
  )

  const lamps = r.lamps
  const controls = (
    <>
      <Segmented
        id={`${uid}-tab`}
        label="Scheda"
        options={[
          { value: 'rettangolare', label: 'rettangolare' },
          { value: 'triangolare', label: 'triangolare' },
          { value: 'gaussiano', label: 'gaussiano' },
          { value: 'comune', label: 'il più comune' },
        ]}
        value={shownTab}
        onChange={chooseTab}
      />
      <ul className="m-0 grid list-none gap-1.5 p-0" aria-label="Lista di controllo del kernel">
        <Lamp ok={Math.abs(cl.area - 1) < 5e-3} pending={lamps < 1} tex="\textstyle\int\gamma=1" label={`area ${f3(cl.area)}`} en="a density" />
        <Lamp ok={cl.maxAtOrigin} pending={lamps < 2} tex="\gamma(0)=\max\gamma" label="massimo nell'origine" en="maximal value at the origin" />
        <Lamp ok={cl.continuous} pending={lamps < 3} tex="\gamma\ \text{continua}" label={cl.continuous ? (cl.differentiable ? 'continua e derivabile' : 'continua, non derivabile') : 'discontinua (salti in ±½)'} en="continuous" />
        <Lamp ok={cl.decays} pending={lamps < 4} tex="\gamma(x)\to 0" label="decade a zero" en="γ(x) → 0 as x → ∞" />
      </ul>
      <Slider id={`${uid}-h`} label="Larghezza della finestra" latex="h" min={H_RANGE[0]} max={H_RANGE[1]} step={H_STEP} value={h} onChange={setH} format={f3} />
      {kernel === 'rettangolare' ? (
        <Toggle id={`${uid}-half`} label="Altezza 1/2 (come l'etichetta della slide)" hint="La Π standard è alta 1 su [−½, ½]: alta ½ avrebbe area ½." checked={halfShown} onChange={setHalf} />
      ) : null}
      <AreaMeter value={area} max={2} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Stima nel punto" latex="\hat p(x)" value={pProbe} format={f3} pinned />
        <Readout label="Picco del kernel" latex="\gamma(0)" value={gamma(0)} format={f3} />
      </div>
      {shownTab === 'comune' ? (
        <div className="grid gap-2 border border-border-strong bg-surface-2 p-3" data-tiles="">
          <p className="m-0 label">Which is the most common window function? Ricomponi la formula</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tessere">
            {TILES.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={picked === t.id}
                aria-label={`Tessera ${t.id}`}
                onClick={() => setPicked((p) => (p === t.id ? null : t.id))}
                className="min-h-10 min-w-10 cursor-pointer border border-border-strong bg-surface px-2 text-text hover:bg-surface-2 aria-pressed:bg-pin aria-pressed:text-pin-contrast"
              >
                <M tex={t.tex} />
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Formula da comporre">
            <M tex="\gamma(x)=" />
            {SLOTS.map((s, i) => (
              <span key={s} className="flex items-center gap-1">
                {i === 1 ? <span aria-hidden="true">/</span> : null}
                {i === 2 ? <span aria-hidden="true">·</span> : null}
                {i === 3 ? <span aria-hidden="true">(</span> : null}
                {i === 4 ? <span aria-hidden="true">/</span> : null}
                <button
                  type="button"
                  aria-label={`Casella ${i + 1}${tile(placed[s]) !== undefined ? `: ${tile(placed[s])?.id}` : ', vuota'}`}
                  onClick={() => place(s)}
                  className="min-h-10 min-w-12 cursor-pointer border border-dashed border-border-strong bg-surface px-2 text-text hover:bg-surface-2"
                >
                  {tile(placed[s]) !== undefined ? <M tex={tile(placed[s])?.tex ?? ''} /> : <span className="text-faint">?</span>}
                </button>
                {i === 4 ? <span aria-hidden="true">)</span> : null}
              </span>
            ))}
          </div>
          <p className="m-0 text-[length:var(--step--1)] text-muted">Scegli una tessera, poi la casella in cui metterla. Una casella senza tessera scelta si svuota.</p>
          {SLOTS.every((s) => placed[s] !== undefined) ? (
            <Verdict ok={formulaOk(placed)}>{formulaOk(placed) ? 'Giusta: γ(x) = 1/√(2π) · exp(−x²/2).' : 'Non ancora: controlla la costante di normalizzazione e l’esponente.'}</Verdict>
          ) : null}
        </div>
      ) : null}
      <Note>La lente si trascina sulla stima, oppure si raggiunge con Tab e si sposta con le frecce.</Note>
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(sb.index, { h: f3(h), k: LABEL[kernel], lens: smoothness(kernel) })} />
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">Il kernel della scheda · {LABEL[kernel]} kernel</span>
        <M tex={KERNEL_TEX[kernel]} display />
        {kernel === 'gaussiano' ? <M tex={TEX_GAUSS_EST} display /> : null}
        <span className="label">Nel punto sotto il cursore</span>
        <LiveFormula tex={TEX_LIVE} values={values} />
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <div className="grid gap-4 sm:grid-cols-3">
        {SNIPPETS.map((s) => (
          <div key={s.id} className="grid gap-2">
            <MiniZoom kernel={s.kernel} label={`Tratto ingrandito ${s.id}`} />
            <Segmented<BaseKernel | ''>
              id={`${uid}-snip-${s.id}`}
              label={`Tratto ${s.id}: kernel`}
              options={[
                { value: 'rettangolare', label: 'rett.' },
                { value: 'triangolare', label: 'triang.' },
                { value: 'gaussiano', label: 'gauss.' },
              ]}
              value={answers[s.id]}
              onChange={(v) => setAnswers((a) => ({ ...a, [s.id]: v }))}
            />
          </div>
        ))}
      </div>
      <ActionButton onClick={() => chooseTab('comune')}>Vai alla scheda delle tessere</ActionButton>
      {valid !== null ? (
        <div className="grid gap-2">
          {valid.verdict.per.map((p) => (
            <Verdict key={p.id} ok={p.ok}>
              Tratto {p.id}: kernel {LABEL[p.kernel]} ({smoothness(p.kernel)}).
            </Verdict>
          ))}
          <Verdict ok={valid.verdict.formula}>{valid.verdict.formula ? 'Formula del gaussiano composta.' : 'Formula del gaussiano: ancora da comporre nella scheda "il più comune".'}</Verdict>
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
