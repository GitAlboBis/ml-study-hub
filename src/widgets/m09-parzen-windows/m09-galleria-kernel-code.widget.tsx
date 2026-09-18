// m09-galleria-kernel-code: esponenziale, Cauchy, sinc² e il verdetto (concetti c36, c37, c38, c39). Sopra la forma del
// kernel della scheda con i valori della slide p59, oppure le quattro code sovrapposte (anche in scala logaritmica)
// con un cursore che le legge; sotto la stima sugli importi delle spese con carta e l'importo sospetto trascinabile,
// con il punteggio di anomalia −ln p̂ di ciascun kernel. L'ultima scheda è il verdetto delle note, con il quadro dei
// sei kernel.
//
// STRUTTURA. Logica, dati e testi in galleria-code.ts (con i test); qui terreno, schede, barre e sfida.
//
// MOTO. Il racconto passa da una scheda all'altra (le schede sono istantanee: cambiano forma e stima, nessuna
// transizione), e nel passo delle code il cursore scorre da u = 0 a u = 8. Trascinare l'importo, il cursore, muovere
// h: nessuna animazione.
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { linspace } from '../../lib/ml/stats'
import { easeInOut } from '../engines/density1d/density1d'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { LiveFormula } from '../kit/LiveFormula'
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
import { Toggle } from '../kit/Toggle'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import type { WidgetMeta } from '../types'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  DOMAIN,
  GRID,
  H0,
  H_RANGE,
  H_STEP,
  KERNEL_TEX,
  LABEL,
  PEAK,
  SAMPLES,
  STEP,
  STEPS,
  SUMMARY,
  SUSPECT0,
  SUSPECT_RANGE,
  TAIL_KERNELS,
  TEX_LIVE,
  anomalyScore,
  captionFor,
  estimateAt,
  gamma,
  judge,
  nearest,
  ripples,
  tabOfStep,
} from './galleria-code'
import type { ChallengeVerdict, Effect, Tab, TailKernel } from './galleria-code'
import { Note, Rug, SeriesLegend, Verdict } from './parzen-lab-ui'

export const meta: WidgetMeta = {
  id: 'm09-galleria-kernel-code',
  moduleId: 'm09-parzen-windows',
  title: 'Galleria dei kernel 2: esponenziale, Cauchy, sinc² e il verdetto',
  concepts: ['c36', 'c37', 'c38', 'c39'],
  scenario: 'banca',
  scenarioNote: 'Importi delle spese con carta di un cliente (log₁₀ €) e un importo sospetto da 5000 €',
  size: 'M',
}

const f2 = fixed(2)
const f3 = fixed(3)
const n2 = (v: number) => Number(v.toFixed(2))
/** Colore e forma per kernel nel confronto delle code: mai il rosso della stima. */
const CLS: Readonly<Record<TailKernel, number>> = { esponenziale: 1, cauchy: 2, sinc2: 4, gaussiano: 3 }
const U = linspace(-14, 14, 1121)
const U_POS = linspace(0, 14, 561)
const LOG_FLOOR = -6
const Y_EST = 1.6
const BELT = 0.35

/** Il valore di γ scritto in cifre significative (le code arrivano a 10⁻⁵). */
const sig = (v: number) => (v >= 0.01 ? f3(v) : v >= 1e-4 ? v.toFixed(5) : v.toExponential(1))

/** Etichette dirette delle code, a destra, a inchiostro con alone. */
function TailLabels({ at, log }: { at: number; log: boolean }) {
  const { x, y } = usePlot()
  return (
    <g pointerEvents="none">
      {TAIL_KERNELS.map((k) => {
        const g = gamma(at, k)
        const v = log ? Math.max(LOG_FLOOR, Math.log10(Math.max(g, 1e-12))) : g
        return (
          <text key={k} className="num" x={n2(x(at) + 6)} y={n2(y(v))} dy="0.32em" fontSize={11} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
            {LABEL[k]} {sig(g)}
          </text>
        )
      })}
    </g>
  )
}

/** La verticale dell'importo sospetto nella stima. */
function SuspectLine({ at, top }: { at: number; top: number }) {
  const { x, y } = usePlot()
  return <line x1={n2(x(at))} x2={n2(x(at))} y1={n2(y(top))} y2={n2(y(0))} stroke="var(--pin-contrast)" strokeWidth={1} strokeDasharray="3 3" pointerEvents="none" />
}

type Rank = [TailKernel | '', TailKernel | '', TailKernel | '', TailKernel | '']
const NO_RANK: Rank = ['', '', '', '']

export default function GalleriaKernelCode() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [tab, setTab] = useState<Tab>('esponenziale')
  const [h, setH] = useState(H0)
  const [suspect, setSuspect] = useState(SUSPECT0)
  const [compare, setCompare] = useState(false)
  const [logScale, setLogScale] = useState(true)
  const [cursorU, setCursorU] = useState(4)
  const [takeover, setTakeover] = useState<number | null>(null)
  const [rank, setRank] = useState<Rank>(NO_RANK)
  const [effect, setEffect] = useState<Effect>('')
  const [checked, setChecked] = useState<{ key: string; verdict: ChallengeVerdict } | null>(null)

  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const story = takeover !== at
  const shownTab: Tab = (story ? tabOfStep(at) : null) ?? tab
  const kernel: TailKernel = shownTab === 'verdetto' ? 'gaussiano' : shownTab
  const comparing = compare || (story && at === STEP.code)
  const logShown = logScale || (story && at === STEP.code)
  const uShown = story && at === STEP.code ? 8 * easeInOut(pr) : cursorU

  const est = useMemo(() => GRID.map((x) => estimateAt(x, h, kernel)), [h, kernel])
  const scores = useMemo(() => TAIL_KERNELS.map((k) => ({ k, s: anomalyScore(suspect, h, k) })), [suspect, h])
  const maxScore = Math.max(...scores.map((s) => s.s))
  const near = nearest(suspect, h)
  const rip = useMemo(() => ripples(h, kernel), [h, kernel])
  const pSuspect = estimateAt(suspect, h, kernel)

  // --- azioni ---
  const takeOver = () => {
    if (tabOfStep(at) !== null || at === STEP.code) {
      if (takeover !== at) {
        sb.pause()
        setTakeover(at)
      }
    }
  }
  const chooseTab = (t: Tab) => {
    takeOver()
    setTab(t)
  }
  const toggleCompare = (v: boolean) => {
    takeOver()
    setCompare(v)
  }
  const toggleLog = (v: boolean) => {
    takeOver()
    setLogScale(v)
  }
  const reset = () => {
    sb.reset()
    setTab('esponenziale')
    setH(H0)
    setSuspect(SUSPECT0)
    setCompare(false)
    setLogScale(true)
    setCursorU(4)
    setTakeover(null)
    setRank(NO_RANK)
    setEffect('')
    setChecked(null)
  }

  const checkKey = `${rank.join(',')}|${suspect}|${h}|${effect}`
  const verify = () => setChecked({ key: checkKey, verdict: judge(rank, suspect, h, effect) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  const values = { x: suspect, xk: near.xk, h, u: near.u, g: gamma(near.u, kernel), score: anomalyScore(suspect, h, kernel) }
  const estPts = GRID.map((x, i) => [x, est[i]])
  const summary = `Kernel ${LABEL[kernel]}, h = ${f2(h)}. Importo sospetto ${f2(suspect)} (log₁₀ €), a u = ${f2(near.u)} dal campione più vicino: densità ${sig(pSuspect)}, punteggio di anomalia ${f2(values.score)}.`

  const kernelPanel = comparing ? (
    <Plot
      width={560}
      height={180}
      fill
      xDomain={[0, 14]}
      yDomain={logShown ? [LOG_FLOOR, 0] : [0, 0.55]}
      margin={{ top: 10, right: 112, bottom: 30, left: 48 }}
      ariaLabel={`Le code dei quattro kernel${logShown ? ' in scala logaritmica' : ''}`}
      description={`In u = ${f2(uShown)}: ${TAIL_KERNELS.map((k) => `${LABEL[k]} ${sig(gamma(uShown, k))}`).join(', ')}.`}
    >
      <Grid axis="y" />
      {TAIL_KERNELS.map((k) => (
        <LinePath key={k} data={U_POS.map((u) => [u, logShown ? Math.max(LOG_FLOOR, Math.log10(Math.max(gamma(u, k), 1e-12))) : gamma(u, k)])} cls={CLS[k]} width={k === kernel ? 2.5 : 1.5} />
      ))}
      <TailLabels at={uShown} log={logShown} />
      <Dots data={[{ x: uShown, y: logShown ? -0.3 : 0.52, id: 'u', label: 'Cursore di lettura delle code' }]} draggable pin axis="x" step={0.25} onDrag={(_id, v) => setCursorU(Number(v.toFixed(2)))} format={f2} />
      <Axis side="bottom" symbol="u" ticks={[0, 2, 4, 6.283, 8, 12.566, 14]} format={(v) => (Math.abs(v - 6.283) < 0.01 ? '2π' : Math.abs(v - 12.566) < 0.01 ? '4π' : String(v))} />
      <Axis side="left" ticks={logShown ? [-6, -4, -2, 0] : [0, 0.25, 0.5]} format={logShown ? (v) => `1e${v}` : (v) => String(v)} symbol="γ(u)" />
    </Plot>
  ) : (
    <Plot width={560} height={180} fill xDomain={[-14, 14]} yDomain={[0, 0.55]} margin={{ top: 10, right: 12, bottom: 30, left: 48 }} ariaLabel={`La forma del kernel ${LABEL[kernel]}`} description={`Picco ${f3(PEAK[kernel].value)}.`}>
      <Grid axis="y" />
      <LinePath data={U.map((u) => [u, gamma(u, kernel)])} role="kernel" width={2.5} />
      <Axis side="bottom" symbol="u" ticks={[-12.566, -6.283, 0, 6.283, 12.566]} format={(v) => (v === 0 ? '0' : `${v < 0 ? '−' : ''}${Math.abs(v) < 7 ? '2π' : '4π'}`)} />
      <Axis side="left" ticks={[0, PEAK[kernel].value, 0.5]} format={(v) => f3(v)} symbol="γ(u)" />
    </Plot>
  )

  const terrain = (
    <div className="absolute inset-0 grid grid-rows-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="relative min-h-0 border-b border-border">{kernelPanel}</div>
      <div className="relative min-h-0">
        <Plot width={560} height={260} fill xDomain={DOMAIN} yDomain={[-BELT, Y_EST]} margin={{ top: 12, right: 12, bottom: 38, left: 48 }} ariaLabel="Stima della densità degli importi con l'importo sospetto" description={summary}>
          <Grid axis="y" />
          <LinePath data={estPts} role="estimate" width={2.5} />
          <SuspectLine at={suspect} top={Y_EST} />
          <Rug items={SAMPLES.map((v) => ({ x: v }))} bottom={-BELT} from={Y_EST} />
          <Dots data={[{ x: suspect, y: -BELT * 0.5, id: 's', label: 'Importo sospetto', cls: 5 }]} draggable axis="x" step={0.01} onDrag={(_id, v) => setSuspect(Number(Math.min(SUSPECT_RANGE[1], Math.max(SUSPECT_RANGE[0], v)).toFixed(2)))} format={f2} />
          <Axis side="bottom" label="importo" symbol="log₁₀ €" ticks={[1, 2, 3, 4]} format={(v) => `${v} (${10 ** v >= 1000 ? `${10 ** (v - 3)}k` : 10 ** v} €)`} />
          <Axis side="left" symbol="p̂(x)" />
        </Plot>
      </div>
    </div>
  )

  const controls = (
    <>
      <Segmented
        id={`${uid}-tab`}
        label="Scheda"
        options={[...TAIL_KERNELS.map((k) => ({ value: k as Tab, label: LABEL[k] })), { value: 'verdetto' as Tab, label: 'verdetto' }]}
        value={shownTab}
        onChange={chooseTab}
      />
      <div className="grid gap-1">
        <Toggle id={`${uid}-cmp`} label="Confronta le code" hint="I quattro kernel sovrapposti, con un cursore che li legge." checked={comparing} onChange={toggleCompare} />
        {comparing ? <Toggle id={`${uid}-log`} label="Scala verticale logaritmica" checked={logShown} onChange={toggleLog} /> : null}
      </div>
      <Slider id={`${uid}-h`} label="Larghezza della finestra" latex="h" min={H_RANGE[0]} max={H_RANGE[1]} step={H_STEP} value={h} onChange={setH} format={f2} unit="log₁₀ €" />
      <div className="grid gap-1.5">
        <span className="label">Punteggio di anomalia −ln p̂ dell'importo sospetto</span>
        {scores.map(({ k, s }) => (
          <div key={k} className="grid grid-cols-[6rem_minmax(0,1fr)_3rem] items-center gap-2" data-score={k}>
            <span className={`label ${k === kernel ? 'text-text' : 'text-muted'}`}>
              {k === kernel ? <span aria-hidden="true" className="mr-1 inline-block size-2.5 border border-border-strong bg-pin align-middle" /> : null}
              {LABEL[k]}
            </span>
            <span aria-hidden="true" className="relative h-3 border border-border bg-surface-2">
              <span className="absolute inset-y-0 left-0" style={{ width: `${(s / maxScore) * 100}%`, background: classVar(CLS[k]) }} />
            </span>
            <span className="num text-right text-[length:var(--step--1)]">{f2(s)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Densità nell'importo" latex="\hat p(x)" value={sig(pSuspect)} pinned />
        <Readout label="Distanza dal più vicino" latex="u" value={near.u} format={f2} />
        <Readout label="Massimi locali della stima" value={rip} format={fixed(0)} />
        <Readout label="Picco del kernel" latex="\gamma(0)" value={PEAK[kernel].value} format={f3} />
      </div>
      <Note>L'importo sospetto (il segno sul nastro) si trascina fra 2.5 e 4.5, cioè fra circa 300 € e 30 000 €; con Tab e le frecce si sposta di un centesimo.</Note>
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(sb.index, { h: f2(h), score: f2(values.score), k: LABEL[kernel] })} />
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">Il kernel della scheda · {LABEL[kernel]} kernel</span>
        <M tex={KERNEL_TEX[kernel]} display />
        <span className="label">Il campione più vicino all'importo sospetto</span>
        <LiveFormula tex={TEX_LIVE} values={values} />
        <SeriesLegend items={TAIL_KERNELS.map((k) => ({ kind: 'line' as const, cls: CLS[k], label: LABEL[k] }))} />
      </div>
      {shownTab === 'verdetto' ? (
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="I sei kernel delle slide a confronto">
          <table className="w-full border-collapse text-left text-[length:var(--step--1)]">
            <caption className="label pb-1 text-left">I sei kernel delle slide p58-59</caption>
            <thead>
              <tr className="border-b border-border-strong text-muted">
                <th scope="col" className="py-1 pr-2 font-normal">
                  kernel
                </th>
                <th scope="col" className="px-2 py-1 font-normal">
                  continuo?
                </th>
                <th scope="col" className="px-2 py-1 font-normal">
                  derivabile?
                </th>
                <th scope="col" className="py-1 pl-2 font-normal">
                  coda
                </th>
              </tr>
            </thead>
            <tbody>
              {SUMMARY.map((r) => (
                <tr key={r.k} className={`border-b border-border ${r.k === 'gaussiano' ? 'bg-surface-2 font-semibold' : ''}`}>
                  <th scope="row" className="py-0.5 pr-2 font-normal">
                    {r.k}
                  </th>
                  <td className="px-2 py-0.5">{r.continuous}</td>
                  <td className="px-2 py-0.5">{r.derivable}</td>
                  <td className="py-0.5 pl-2">{r.tail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )

  const options = TAIL_KERNELS.map((k) => ({ value: k as TailKernel | '', label: LABEL[k] }))
  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <div className="grid gap-3 sm:grid-cols-2">
        {rank.map((r, i) => (
          <Segmented<TailKernel | ''>
            key={i}
            id={`${uid}-rank-${i}`}
            label={`${i + 1}° posto (${i === 0 ? 'il più severo' : i === 3 ? 'il più indulgente' : 'in mezzo'})`}
            options={options}
            value={r}
            onChange={(v) => setRank((cur) => cur.map((old, j) => (j === i ? v : old)) as Rank)}
          />
        ))}
      </div>
      <Segmented<Effect>
        id={`${uid}-effect`}
        label="Con u = 2π, il sinc² del campione più vicino"
        options={[
          { value: 'zero', label: 'si annulla' },
          { value: 'max', label: 'è massimo' },
          { value: 'neg', label: 'diventa negativo' },
        ]}
        value={effect}
        onChange={setEffect}
      />
      {valid !== null ? (
        <div className="grid gap-2">
          <Verdict ok={valid.verdict.orderOk}>
            Con h = 0.35 e l'importo a 3.7: {valid.verdict.order.map((k) => LABEL[k]).join(', ')}, dal più severo al più indulgente.
          </Verdict>
          <Verdict ok={valid.verdict.atTwoPi}>
            {valid.verdict.atTwoPi ? 'L’importo è a u = 2π dal campione più vicino.' : `Adesso u = ${f2(valid.verdict.uNow)}: porta l'importo a u = 2π ≈ 6.28 (con h = 0.35).`}
          </Verdict>
          <Verdict ok={valid.verdict.effectOk}>
            In u = 2π il lobo del sinc² tocca zero: il campione più vicino non contribuisce affatto, mentre campioni più lontani sì. È un difetto: la vicinanza non si traduce più in peso.
          </Verdict>
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
