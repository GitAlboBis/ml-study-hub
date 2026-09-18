// m09-piu-campioni-h-piu-stretto: più campioni, finestra più stretta (concetto c30). Il consumo elettrico orario di
// una casa: con poche ore di dati serve una finestra larga per non lasciare buchi, con molte ci si può permettere una
// finestra stretta che rivela i due modi. Sotto, la curva dell'errore integrato in funzione di h (con il minimo h*) e
// il grafico log-log di h* contro N.
//
// STRUTTURA. Logica e testi in piu-campioni.ts (con i test); qui terreno, comandi, formule e sfida. Oltre 100 ore la
// stima si calcola a bin (parzen-lab.ts), così anche con N = 5000 la curva dell'errore resta pronta in qualche decina
// di millisecondi.
//
// MOTO. Storyboard: h si allarga (scala logaritmica, ease-in-out), il cursore di "Trova h*" percorre la curva
// dell'errore e si ferma sul minimo, N passa a 200 e a 2000. Slider e interruttori: nessuna animazione.
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { easeInOut, formatH, nearestIndex } from '../engines/density1d/density1d'
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
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
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
  FACTOR,
  GRID,
  H0,
  H_STEPS,
  N0,
  N_STEPS,
  SEED0,
  STEP,
  STEPS,
  TARGET_NS,
  TEX_EST,
  TEX_LIVE,
  TRUTH_ON_GRID,
  captionFor,
  curveFor,
  drawSamples,
  estimateOnGrid,
  holes,
  iseOf,
  judge,
  searchAt,
  slope,
} from './piu-campioni'
import type { ChallengeVerdict } from './piu-campioni'
import { Note, Rug, SeriesLegend, Verdict } from './parzen-lab-ui'

export const meta: WidgetMeta = {
  id: 'm09-piu-campioni-h-piu-stretto',
  moduleId: 'm09-parzen-windows',
  title: 'Più campioni, finestra più stretta',
  concepts: ['c30'],
  scenario: 'energia',
  scenarioNote: 'Consumo elettrico orario di un’abitazione (kWh): notte e giorno, due modi',
  size: 'M',
}

const f3 = fixed(3)
const f4 = fixed(4)
const Y_MAX = 2.6
const BELT = 0.3
const log10 = Math.log10
const pow10 = (v: number) => 10 ** v
/** Numero tondo per le tacche dei grafici logaritmici: 10^-2 → 0.01. */
const tick = (v: number) => {
  const x = pow10(v)
  return x >= 1 ? String(Math.round(x)) : String(Number(x.toPrecision(1)))
}
const N_START = N_STEPS.indexOf(N0)
const H_START = nearestIndex(H_STEPS, H0)
/** I tre N del racconto: i loro punti compaiono nel log-log dal passo "N = 200" in poi. */
const STORY_NS = [20, 200, 2000] as const

/** I buchi: fasce ocra con la scritta, dove la stima è sotto il 5% della densità vera. */
function HoleBands({ runs }: { runs: readonly [number, number][] }) {
  const { x, y } = usePlot()
  return (
    <g data-holes="" pointerEvents="none">
      {runs.map(([a, b], i) => (
        <g key={i} data-hole="">
          <rect x={x(a)} y={0} width={Math.max(1, x(b) - x(a))} height={y(0)} fill="var(--pin)" fillOpacity={0.3} />
        </g>
      ))}
    </g>
  )
}

/** La retta di riferimento di pendenza −1/5 nel log-log, per il primo punto. */
function SlopeLine({ from }: { from: readonly [number, number] }) {
  const { x, y } = usePlot()
  const [x0, y0] = from
  const x1 = log10(5000)
  const y1 = y0 - (x1 - x0) / 5
  return (
    <g pointerEvents="none">
      <line x1={x(x0)} y1={y(y0)} x2={x(x1)} y2={y(y1)} stroke="var(--text-faint)" strokeWidth={1.25} />
      <text className="num" x={x(x1) - 4} y={y(y1) - 6} textAnchor="end" fontSize={10} fill="var(--text-muted)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
        pendenza −1/5
      </text>
    </g>
  )
}

export default function PiuCampioniHPiuStretto() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [nIndex, setNIndex] = useState(N_START)
  const [hIndex, setHIndex] = useState(H_START)
  const [seed, setSeed] = useState(SEED0)
  const [truthOn, setTruthOn] = useState(true)
  const [visited, setVisited] = useState<number[]>([N0])
  const [takeover, setTakeover] = useState<number | null>(null)
  const [notes, setNotes] = useState<Record<number, number>>({})
  const [factor, setFactor] = useState(1)
  const [checked, setChecked] = useState<{ key: string; verdict: ChallengeVerdict } | null>(null)

  const steps = useMemo(() => STEPS.map((s) => ({ ...s })), [])
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const story = takeover !== at
  const userN = N_STEPS[nIndex]
  const userH = H_STEPS[hIndex]
  const N = story && at === STEP.n200 ? 200 : story && at === STEP.n2000 ? 2000 : userN
  const curve = useMemo(() => curveFor(seed, N), [seed, N])
  const h =
    story && at === STEP.allarga
      ? Math.exp(Math.log(userH) + (Math.log(0.6) - Math.log(userH)) * easeInOut(pr))
      : story && at === STEP.trova
        ? searchAt(easeInOut(pr), curve)
        : story && (at === STEP.n200 || at === STEP.n2000)
          ? curve.hStar
          : userH
  const showTruth = truthOn || (story && at >= STEP.allarga && at <= STEP.n2000)

  const samples = useMemo(() => drawSamples(seed, N), [seed, N])
  const est = useMemo(() => estimateOnGrid(samples, h), [samples, h])
  const ise = iseOf(est)
  const gaps = holes(est)
  const estPts = GRID.map((x, i) => [x, est[i]])
  const truthPts = GRID.map((x, i) => [x, TRUTH_ON_GRID[i]])
  const isePts = curve.hs.map((hh, i) => [log10(hh), log10(curve.ise[i])])
  const iseLo = Math.min(...isePts.map((p) => p[1])) - 0.3
  const iseHi = Math.max(...isePts.map((p) => p[1])) + 0.2

  const logPoints = useMemo(() => {
    const ns = new Set<number>(visited)
    if (at >= STEP.n200) for (const n of STORY_NS) ns.add(n)
    return [...ns].sort((a, b) => a - b).map((n) => [n, curveFor(seed, n).hStar] as const)
  }, [visited, at, seed])
  const s = logPoints.length >= 2 ? slope(logPoints) : Number.NaN

  // --- azioni ---
  const takeOver = () => {
    if (at !== STEP.quadro && at !== STEP.chiusura && at !== STEP.loglog && takeover !== at) {
      sb.pause()
      setTakeover(at)
    }
  }
  const chooseN = (i: number) => {
    takeOver()
    setNIndex(i)
    setVisited((v) => (v.includes(N_STEPS[i]) ? v : [...v, N_STEPS[i]]))
  }
  const chooseH = (i: number) => {
    takeOver()
    setHIndex(i)
  }
  const findHStar = () => {
    setTakeover(null)
    sb.goto(STEP.trova)
    sb.play()
  }
  const resample = () => {
    setSeed((v) => v + 1)
    setVisited([userN])
    setNotes({})
  }
  const note = () => setNotes((nt) => ({ ...nt, [userN]: userH }))
  const reset = () => {
    sb.reset()
    setNIndex(N_START)
    setHIndex(H_START)
    setSeed(SEED0)
    setTruthOn(true)
    setVisited([N0])
    setTakeover(null)
    setNotes({})
    setFactor(1)
    setChecked(null)
  }

  const checkKey = `${seed}|${TARGET_NS.map((n) => notes[n] ?? '-').join(',')}|${factor}`
  const verify = () => setChecked({ key: checkKey, verdict: judge(seed, notes, factor) })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  const values = { N, h, ise, hs: curve.hStar, iseS: curve.iseStar }
  const summary = `${N} ore di consumo, h = ${f3(h)} kWh: errore integrato ${f4(ise)}. Il minimo è h* = ${f3(curve.hStar)} con errore ${f4(curve.iseStar)}. ${gaps.length} buchi.`

  const terrain = (
    <div className="absolute inset-0 grid grid-rows-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="relative min-h-0 border-b border-border">
        <Plot width={600} height={280} fill xDomain={DOMAIN} yDomain={[-BELT, Y_MAX]} margin={{ top: 10, right: 12, bottom: 38, left: 46 }} ariaLabel="Stima del consumo orario, densità vera e buchi" description={summary}>
          <Grid axis="y" yTicks={[1, 2]} />
          <HoleBands runs={gaps} />
          {showTruth ? <LinePath data={truthPts} role="truth" /> : null}
          <LinePath data={estPts} role="estimate" width={2} />
          {N <= 300 ? <Rug items={samples.map((x) => ({ x }))} bottom={-BELT} from={Y_MAX} /> : null}
          <Axis side="bottom" label="consumo orario" symbol="x [kWh]" />
          <Axis side="left" ticks={[0, 1, 2]} symbol="p̂(x)" />
        </Plot>
      </div>
      <div className="grid min-h-0 grid-cols-2">
        <div className="relative min-h-0 border-r border-border">
          <Plot
            width={300}
            height={190}
            fill
            xDomain={[log10(H_STEPS[0]), log10(H_STEPS[H_STEPS.length - 1])]}
            yDomain={[iseLo, iseHi]}
            margin={{ top: 10, right: 8, bottom: 34, left: 44 }}
            ariaLabel="Errore integrato in funzione di h, in scala logaritmica"
            description={`Minimo in h* = ${f3(curve.hStar)}.`}
          >
            <LinePath data={isePts} role="boundary" width={1.5} />
            <Dots data={[{ x: log10(curve.hStar), y: log10(curve.iseStar), label: 'minimo h*' }]} role="boundary" />
            <Dots data={[{ x: log10(h), y: log10(ise), label: 'h corrente' }]} pin />
            <Axis side="bottom" ticks={[-2, -1, 0]} format={tick} symbol="h" />
            <Axis side="left" ticks={[Math.ceil(iseLo), Math.floor(iseHi)].filter((v, i, a) => a.indexOf(v) === i)} format={tick} symbol="ISE" />
          </Plot>
        </div>
        <div className="relative min-h-0">
          <Plot
            width={300}
            height={190}
            fill
            xDomain={[1, log10(5000)]}
            yDomain={[log10(0.01), log10(0.5)]}
            margin={{ top: 10, right: 8, bottom: 34, left: 44 }}
            ariaLabel="h* contro N in scala log-log"
            description={`${logPoints.length} punti; pendenza ${Number.isFinite(s) ? f3(s) : 'non ancora calcolabile'}.`}
          >
            {logPoints.length > 0 ? <SlopeLine from={[log10(logPoints[0][0]), log10(logPoints[0][1])]} /> : null}
            <Dots data={logPoints.map(([n, hs]) => ({ x: log10(n), y: log10(hs), label: `N = ${n}: h* = ${f3(hs)}` }))} role="estimate" />
            <Axis side="bottom" ticks={[1, 2, 3]} format={tick} symbol="N" />
            <Axis side="left" ticks={[-2, -1]} format={tick} symbol="h*" />
          </Plot>
        </div>
      </div>
    </div>
  )

  const controls = (
    <>
      <Slider id={`${uid}-n`} label="Ore di dati" latex="N" min={0} max={N_STEPS.length - 1} step={1} value={nIndex} onChange={chooseN} format={(i) => String(N_STEPS[Math.round(i)] ?? userN)} />
      <Slider id={`${uid}-h`} label="Larghezza della finestra" latex="h" min={0} max={H_STEPS.length - 1} step={1} value={hIndex} onChange={chooseH} format={(i) => formatH(H_STEPS[Math.round(i)] ?? userH)} unit="kWh" />
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={findHStar}>Trova h*</ActionButton>
        <ActionButton onClick={resample}>Ricampiona</ActionButton>
      </div>
      <Toggle id={`${uid}-truth`} label="Densità vera" hint="Tratteggiata: la mistura che ha generato i consumi." checked={truthOn} onChange={setTruthOn} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Errore integrato" latex="\mathrm{ISE}" value={ise} format={f4} pinned />
        <Readout label="Errore minimo" latex="\mathrm{ISE}(h^*)" value={curve.iseStar} format={f4} />
        <Readout label="h ottimo" latex="h^*" value={curve.hStar} format={f3} unit="kWh" />
        <Readout label="Pendenza log-log" value={Number.isFinite(s) ? s : '—'} format={f3} />
      </div>
      <SeriesLegend
        items={[
          { kind: 'line', role: 'estimate', label: <>stima <M tex="\hat p(x)" /></> },
          { kind: 'line', role: 'truth', label: 'densità vera' },
          { kind: 'window', label: 'buco: stima sotto il 5% della vera' },
        ]}
      />
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(sb.index, { N, h: f3(h), hStar: f3(curve.hStar), holes: gaps.length })} />
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <M tex={TEX_EST} display />
        <LiveFormula tex={TEX_LIVE} values={values} />
      </div>
    </div>
  )

  const noteable = TARGET_NS.includes(userN)
  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <div className="flex flex-wrap items-center gap-2">
        <ActionButton onClick={note} disabled={!noteable}>
          Annota h = {formatH(userH)} per N = {userN}
        </ActionButton>
        {!noteable ? <span className="text-[length:var(--step--1)] text-muted">Porta N a 50, 500 o 5000.</span> : null}
      </div>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Le h annotate">
        <table className="num w-full border-collapse text-right text-[length:var(--step--1)]">
          <thead>
            <tr className="border-b border-border-strong text-muted">
              <th scope="col" className="py-1 pr-2 text-left font-normal">
                N
              </th>
              <th scope="col" className="px-2 py-1 font-normal">
                il tuo h
              </th>
              <th scope="col" className="py-1 pl-2 font-normal">
                ISE / ISE(h*)
              </th>
            </tr>
          </thead>
          <tbody>
            {TARGET_NS.map((n) => {
              const row = valid?.verdict.rows.find((r) => r.n === n)
              return (
                <tr key={n} className="border-b border-border">
                  <th scope="row" className="py-0.5 pr-2 text-left font-normal">
                    {n}
                  </th>
                  <td className="px-2 py-0.5">{notes[n] !== undefined ? formatH(notes[n]) : '—'}</td>
                  <td className="py-0.5 pl-2">{row?.ratio !== null && row?.ratio !== undefined ? fixed(2)(row.ratio) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <NumberField id={`${uid}-factor`} label="N × 10 moltiplica h* per" min={0} max={2} step={0.01} value={factor} onChange={setFactor} format={fixed(2)} />
      {valid !== null ? (
        <div className="grid gap-2">
          {valid.verdict.rows.map((r) => (
            <Verdict key={r.n} ok={r.ok}>
              N = {r.n}: {r.h === null ? 'nessun h annotato' : `errore ${fixed(2)(r.ratio ?? 0)} volte il minimo`}
              {r.ok ? '.' : ' (serve al più 1.15).'}
            </Verdict>
          ))}
          <Verdict ok={valid.verdict.factorOk}>
            Il fattore atteso è circa <span className="num">{fixed(2)(FACTOR)}</span> = 10<sup>−1/5</sup> (risultato di letteratura per il kernel gaussiano); hai scritto <span className="num">{fixed(2)(factor)}</span>.
          </Verdict>
        </div>
      ) : null}
      <Note>La pendenza −1/5 non è nelle slide: le note dicono solo che, con più campioni, h può diminuire.</Note>
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={1.2} onReset={reset} transport={<PlayControls sb={sb} steps={steps} />} caption={caption} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
