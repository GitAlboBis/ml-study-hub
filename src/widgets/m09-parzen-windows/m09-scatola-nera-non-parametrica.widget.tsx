// m09-scatola-nera-non-parametrica: perché e quando si stima una densità senza parametri (concetti c01, c40).
// Due macchine ricevono le stesse giornate di radiazione solare: il modello parametrico gaussiano (due manopole,
// μ e σ², stimate a massima verosimiglianza) e la black box di Parzen (nessuna forma imposta, una sola ghiera h).
// Sul grafico comune escono le due curve, con l'istogramma dei dati e la densità vera tratteggiata; due indicatori
// dicono l'errore quadratico integrato di ciascuna. "Apri la scatola" mostra il meccanismo in tre tempi.
//
// STRUTTURA. Logica, dati e testi in scatola-nera.ts (con i test); qui stato, terreno, comandi e sfida. Il terreno
// riusa gli strati del motore density1d (campane dei kernel, etichette dirette, segni fuori scala).
//
// MOTO. Lo storyboard muove tutto (caduta dei campioni, penna delle curve, coperchio, campane che si impilano): il
// terreno legge sb.progress e ricalcola solo ciò che si muove, le stime stanno in useMemo. Slider, selettori e
// pulsanti non animano nulla: il terreno segue subito la mano. Con reduced motion ogni passo è il suo stato finale.
import { ticks as d3ticks } from 'd3'
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { normalPdf } from '../../lib/ml/stats'
import { clippedPeaks, easeIn, easeInOut, easeOut, flankPoint, formatH, kernelBands, nearestIndex, niceLogSteps, peakPoint } from '../engines/density1d/density1d'
import { ClippedMarks, CurveLabel, KernelBandsLayer } from '../engines/density1d/terrain'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { LiveFormula } from '../kit/LiveFormula'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Grid } from '../kit/plot/Grid'
import { Histogram } from '../kit/plot/Histogram'
import { LinePath } from '../kit/plot/LinePath'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import type { WidgetMeta } from '../types'
import { Note, Reveal, Rug, SeriesLegend, Verdict } from './parzen-lab-ui'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  DOMAIN,
  GRID,
  H_DEFAULT,
  H_RANGE,
  N_DEFAULT,
  N_STEPS,
  SEED_DEFAULT,
  STEP,
  TEX_ISE,
  TEX_KNV,
  TEX_ML,
  TRUTHS,
  captionFor,
  crossover,
  drawSamples,
  dropOf,
  excessZone,
  gaussCurve,
  gaussFit,
  iseOf,
  parzenAt,
  parzenCurve,
  stepsFor,
  truthById,
  truthPdf,
  windowCount,
  winnersAt,
} from './scatola-nera'
import type { Machine, TruthId } from './scatola-nera'

export const meta: WidgetMeta = {
  id: 'm09-scatola-nera-non-parametrica',
  moduleId: 'm09-parzen-windows',
  title: 'La scatola nera di Parzen: campioni dentro, densità fuori',
  concepts: ['c01', 'c40'],
  scenario: 'energia',
  scenarioNote: 'Radiazione solare giornaliera (kWh/m²) misurata da un impianto fotovoltaico',
  size: 'M',
}

const f2 = fixed(2)
const f3 = fixed(3)
const f4 = fixed(4)
const Y_MAX = 0.45
const BELT = Y_MAX * 0.14
const H_STEPS = niceLogSteps(H_RANGE[0], H_RANGE[1])
const H_START = nearestIndex(H_STEPS, H_DEFAULT)
const N_START = N_STEPS.indexOf(N_DEFAULT)
const PROBE_START = 4.3
/** Oltre questo N le campane una per una sarebbero troppe da disegnare (e da distinguere): si vede la pila. */
const BANDS_MAX = 150

// --- le due macchine ---

const needleAngle = (frac: number) => ((-135 + 270 * Math.min(1, Math.max(0, frac))) * Math.PI) / 180

function Knob({ cx, cy, frac, label }: { cx: number; cy: number; frac: number; label: string }) {
  const a = needleAngle(frac)
  const tipX = cx + 7 * Math.sin(a)
  const tipY = cy - 7 * Math.cos(a)
  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={1.5} />
      <line x1={cx} y1={cy} x2={tipX} y2={tipY} stroke="var(--pin-contrast)" strokeWidth={2} />
      <circle cx={tipX} cy={tipY} r={2} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={0.75} />
      <text x={cx} y={cy + 19} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
        {label}
      </text>
    </g>
  )
}

/** Una macchina: corpo a inchiostro, tramoggia, manopole con l'ago sul valore stimato; la black box ha il coperchio. */
function MachineCard({ kind, fed, n, lid, mu, s2, h }: { kind: Machine; fed: number; n: number; lid: number; mu: number; s2: number; h: number }) {
  const parzen = kind === 'parzen'
  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-2 border-border-strong bg-surface px-2 py-1.5" data-machine={kind} data-lid={parzen ? lid.toFixed(2) : undefined}>
      <svg viewBox="0 0 112 64" className="h-12 w-auto sm:h-14" aria-hidden="true">
        <path d="M14 2h26l-7 12H21z" fill="var(--surface-2)" stroke="var(--border-strong)" strokeWidth={1.5} />
        <rect x={6} y={14} width={100} height={42} fill="var(--surface-2)" stroke="var(--border-strong)" strokeWidth={2} />
        {parzen ? (
          <>
            {/* dentro la scatola: le campane, visibili solo a coperchio aperto */}
            <path d="M44 50c5 0 6-14 10-14s5 14 10 14M60 50c5 0 6-10 10-10s5 10 10 10" fill="none" stroke="var(--viz-kernel)" strokeWidth={1.5} opacity={lid} />
            <rect x={42} y={9} width={64} height={6} fill="var(--border-strong)" transform={`rotate(${-38 * lid} 42 14)`} />
            <Knob cx={25} cy={32} frac={Math.log(h / H_RANGE[0]) / Math.log(H_RANGE[1] / H_RANGE[0])} label="h" />
          </>
        ) : (
          <>
            <Knob cx={34} cy={32} frac={mu / 9} label="μ" />
            <Knob cx={74} cy={32} frac={s2 / 9} label="σ²" />
          </>
        )}
        {/* bocca d'uscita: il colore della curva che esce */}
        <path d="M100 56v6h8" fill="none" stroke={parzen ? 'var(--viz-estimate)' : 'var(--viz-class-2)'} strokeWidth={2.5} />
      </svg>
      <div className="grid min-w-0 gap-0.5 leading-tight">
        <span className="label truncate">{parzen ? 'Black box di Parzen' : 'Modello parametrico'}</span>
        <span className="num truncate text-[length:var(--step--1)] text-muted">{parzen ? `h = ${formatH(h)}` : `μ̂ ${f2(mu)} · σ̂² ${f2(s2)}`}</span>
        <span className="num text-[length:var(--step--1)] text-faint">
          {fed}/{n} giornate
        </span>
      </div>
    </div>
  )
}

/** Due barre dell'errore integrato: la più corta vince. Le cifre stanno nei Readout. */
function ErrorBars({ gauss, parzen }: { gauss: number; parzen: number }) {
  const top = Math.max(gauss, parzen, 1e-12)
  const rows = [
    { key: 'gauss', label: 'gaussiana ML', v: gauss, color: 'var(--viz-class-2)' },
    { key: 'parzen', label: 'Parzen', v: parzen, color: 'var(--viz-estimate)' },
  ]
  return (
    <div aria-hidden="true" className="grid gap-1.5">
      {rows.map((r) => (
        <div key={r.key} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-2">
          <span className="label">{r.label}</span>
          <span className="relative h-3 border border-border bg-surface-2">
            <span className="absolute inset-y-0 left-0" style={{ width: `${(r.v / top) * 100}%`, background: r.color }} />
          </span>
        </div>
      ))}
    </div>
  )
}

// --- segni del terreno ---

/** Una fascia verticale fra `from` e `to`: velatura ocra (evidenza) con bordo a inchiostro e, se c'è, la scritta. */
function Band({ from, to, alpha, label, strong = false }: { from: number; to: number; alpha: number; label?: string; strong?: boolean }) {
  const { x, innerHeight } = usePlot()
  const x0 = x(from)
  const w = Math.max(1, x(to) - x0)
  return (
    <g data-band={label ?? ''} opacity={alpha} pointerEvents="none">
      <rect x={x0} y={0} width={w} height={innerHeight} fill="var(--pin)" fillOpacity={strong ? 0.3 : 0.2} stroke="var(--pin-contrast)" strokeWidth={1} strokeDasharray={strong ? undefined : '3 3'} />
      {label !== undefined ? (
        <text className="label" x={x0 + w / 2} y={14} textAnchor="middle" fontSize={10} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
          {label}
        </text>
      ) : null}
    </g>
  )
}

// --- sfida ---

type Predictions = Record<TruthId, Machine | ''>
const NO_PREDICTIONS: Predictions = { gaussiana: '', bimodale: '', asimmetrica: '', unitri: '' }

interface CheckResult {
  key: string
  ok: boolean
  part1: { id: TruthId; predicted: Machine | ''; actual: Machine; ratio: number }[]
  part2: { truthOk: boolean; target: number | null; chosen: number; ok: boolean }
}

export default function ScatolaNeraNonParametrica() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [truth, setTruth] = useState<TruthId>('bimodale')
  const [nIndex, setNIndex] = useState(N_START)
  const [hIndex, setHIndex] = useState(H_START)
  const [seed, setSeed] = useState(SEED_DEFAULT)
  const [probe, setProbe] = useState(PROBE_START)
  const [predictions, setPredictions] = useState<Predictions>(NO_PREDICTIONS)
  const [checked, setChecked] = useState<CheckResult | null>(null)

  const n = N_STEPS[nIndex]
  const h = H_STEPS[hIndex]
  const samples = useMemo(() => drawSamples(truth, seed, n), [truth, seed, n])
  const p = useMemo(() => truthPdf(truth), [truth])
  const fit = useMemo(() => gaussFit(samples), [samples])
  const gCurve = useMemo(() => gaussCurve(fit), [fit])
  const pCurve = useMemo(() => parzenCurve(samples, h), [samples, h])
  const tCurve = useMemo(() => GRID.map(p), [p])
  const iseG = useMemo(() => iseOf(GRID, gCurve, p), [gCurve, p])
  const iseP = useMemo(() => iseOf(GRID, pCurve, p), [pCurve, p])
  const winner: Machine = iseP < iseG ? 'parzen' : 'gauss'
  const zone = useMemo(() => excessZone(GRID, gCurve, tCurve), [gCurve, tCurve])

  // --- storyboard: che cosa si vede in questo istante ---
  const steps = stepsFor(n)
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const dropping = at === STEP.nastro
  const curvesUntil = dropping ? DOMAIN[0] : at === STEP.curve ? DOMAIN[0] + (DOMAIN[1] - DOMAIN[0]) * easeInOut(pr) : DOMAIN[1]
  const zoneAlpha = at === STEP.valle ? easeOut(pr / 0.4) : 0
  const lid = at === STEP.finestre ? easeOut(pr / 0.4) : at === STEP.conta || at === STEP.media ? 1 : 0
  const inBox = at === STEP.finestre || at === STEP.conta || at === STEP.media
  const growth = at === STEP.finestre ? easeOut((pr - 0.25) / 0.6) : 1
  const stack = at === STEP.media ? easeInOut(pr / 0.7) : 0
  const windowAlpha = at === STEP.conta ? easeOut(pr / 0.3) : 0
  const bands = inBox && n <= BANDS_MAX ? kernelBands(GRID, samples, h, 'gaussiano', samples.map(() => growth / n), stack) : []

  const fed = dropping ? samples.filter((_, k) => dropOf(pr, k, n) >= 1).length : n
  const K = windowCount(probe, samples, h)
  const values = { K, N: n, h, pk: K / (n * h), x: probe, p: parzenAt(probe, samples, h), mu: fit.mu, s2: fit.s2, iseG, iseP }

  // --- azioni ---
  const openBox = () => {
    sb.goto(STEP.finestre)
    sb.play()
  }
  const reset = () => {
    sb.reset()
    setTruth('bimodale')
    setNIndex(N_START)
    setHIndex(H_START)
    setSeed(SEED_DEFAULT)
    setProbe(PROBE_START)
    setPredictions(NO_PREDICTIONS)
    setChecked(null)
  }

  // la verifica vale per lo stato verificato: previsioni, densità, N, h e dati
  const checkKey = `${truth}|${n}|${h}|${seed}|${TRUTHS.map((t) => predictions[t.id]).join(',')}`
  const verify = () => {
    const w = winnersAt(N_DEFAULT, h, seed)
    const part1 = TRUTHS.map((t) => ({ id: t.id, predicted: predictions[t.id], actual: w[t.id].winner, ratio: w[t.id].errors.parzen / w[t.id].errors.gauss }))
    const target = crossover('asimmetrica', h, seed).n
    const ti = target === null ? -99 : N_STEPS.findIndex((v) => v === target)
    const truthOk = truth === 'asimmetrica'
    const ok2 = truthOk && target !== null && Math.abs(nIndex - ti) <= 1
    const ok1 = part1.every((r) => r.predicted === r.actual)
    setChecked({ key: checkKey, ok: ok1 && ok2, part1, part2: { truthOk, target, chosen: n, ok: ok2 } })
  }
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.ok ? 'ok' : 'ko'

  // --- terreno ---
  const t = truthById(truth)
  const yTicks = d3ticks(0, Y_MAX, 4)
  const gPts = GRID.map((x, i) => [x, gCurve[i]])
  const pPts = GRID.map((x, i) => [x, pCurve[i]])
  const tPts = GRID.map((x, i) => [x, tCurve[i]])
  const curvesOn = curvesUntil > DOMAIN[0]
  const labels = curvesUntil >= DOMAIN[1] && !inBox
  const summary = `${n} giornate dalla densità ${t.it}. Modello gaussiano: media ${f2(fit.mu)}, varianza ${f2(fit.s2)}, errore integrato ${f4(iseG)}. Black box di Parzen con h = ${formatH(h)}: errore integrato ${f4(iseP)}. Vince ${winner === 'parzen' ? 'la black box di Parzen' : 'il modello parametrico'}.`

  const terrain = (
    <div className="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)]">
      <div className="grid grid-cols-2 gap-2 border-b border-border-strong bg-bg p-2">
        <MachineCard kind="gauss" fed={fed} n={n} lid={0} mu={fit.mu} s2={fit.s2} h={h} />
        <MachineCard kind="parzen" fed={fed} n={n} lid={lid} mu={fit.mu} s2={fit.s2} h={h} />
      </div>
      <div className="relative min-h-0">
        <Plot
          width={640}
          height={360}
          fill
          xDomain={DOMAIN}
          yDomain={[-BELT, Y_MAX]}
          margin={{ top: 12, right: 12, bottom: 40, left: 46 }}
          ariaLabel="Radiazione solare: istogramma dei dati, curva del modello gaussiano, stima di Parzen e densità vera"
          description={summary}
          cursor="x"
          cursorFormat={(cx) => `x = ${f2(cx)} · gauss ${f3(normalPdf(cx, fit.mu, Math.sqrt(fit.s2)))} · Parzen ${f3(parzenAt(cx, samples, h))}`}
          onCursor={(pt) => {
            if (pt !== null) setProbe(Number(Math.min(Math.max(pt.x, DOMAIN[0]), DOMAIN[1]).toFixed(2)))
          }}
        >
          <Grid axis="y" yTicks={yTicks} />
          {zoneAlpha > 0 && zone !== null ? <Band from={zone[0]} to={zone[1]} alpha={zoneAlpha} label="qui i dati sono pochi" /> : null}
          {windowAlpha > 0 ? <Band from={probe - h / 2} to={probe + h / 2} alpha={windowAlpha} strong /> : null}
          {!dropping ? <Histogram values={samples} bins={18} domain={DOMAIN} normalize role="sample" /> : null}
          <KernelBandsLayer xs={GRID} bands={bands} stack={stack} />
          <LinePath data={tPts} role="truth" />
          {curvesOn ? (
            <Reveal until={curvesUntil}>
              <LinePath data={gPts} cls={1} width={2} />
              <g opacity={inBox && at !== STEP.media ? 0.25 : 1}>
                <LinePath data={pPts} role="estimate" width={2.5} />
              </g>
            </Reveal>
          ) : null}
          <Rug
            items={samples.map((x, k) => ({ x, drop: dropping ? easeIn(dropOf(pr, k, n)) : 1, lit: windowAlpha > 0 && Math.abs(x - probe) <= h / 2 }))}
            bottom={-BELT}
            from={Y_MAX}
          />
          <ClippedMarks at={curvesOn ? clippedPeaks(GRID, pCurve, Y_MAX) : []} />
          {labels ? <CurveLabel at={peakPoint(pPts)} text="Parzen" anchor="end" /> : null}
          {labels ? <CurveLabel at={flankPoint(gPts, 'right', 0.5)} text="gaussiana" above={false} /> : null}
          <Axis side="bottom" label="radiazione giornaliera" symbol="x [kWh/m²]" />
          <Axis side="left" ticks={yTicks} symbol="p(x)" />
        </Plot>
      </div>
    </div>
  )

  const controls = (
    <>
      <Segmented id={`${uid}-truth`} label="Densità vera (le macchine non la vedono)" options={TRUTHS.map((tr) => ({ value: tr.id, label: tr.it }))} value={truth} onChange={setTruth} />
      <Slider id={`${uid}-n`} label="Giornate misurate" latex="N" min={0} max={N_STEPS.length - 1} step={1} value={nIndex} onChange={setNIndex} format={(i) => String(N_STEPS[Math.round(i)] ?? n)} />
      <Slider
        id={`${uid}-h`}
        label="Ghiera della black box (bandwidth)"
        latex="h"
        min={0}
        max={H_STEPS.length - 1}
        step={1}
        value={hIndex}
        onChange={setHIndex}
        format={(i) => formatH(H_STEPS[Math.round(i)] ?? h)}
        unit="kWh/m²"
      />
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={openBox}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
            <path d="M3 11h18v10H3zM3 11l3-6h12" />
          </svg>
          Apri la scatola
        </ActionButton>
        <ActionButton onClick={() => setSeed((s) => s + 1)}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
            <path d="M4 7h11l-3-3M20 17H9l3 3" />
          </svg>
          Ricampiona
        </ActionButton>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Media stimata" latex="\hat\mu" value={fit.mu} format={f2} unit="kWh/m²" />
        <Readout label="Varianza stimata" latex="\hat\sigma^2" value={fit.s2} format={f2} />
        <Readout label="Errore gaussiana" latex="\mathrm{ISE}_g" value={iseG} format={f4} pinned={winner === 'gauss'} />
        <Readout label="Errore Parzen" latex="\mathrm{ISE}_P" value={iseP} format={f4} pinned={winner === 'parzen'} />
      </div>
      <ErrorBars gauss={iseG} parzen={iseP} />
      <p className="m-0 text-[length:var(--step--1)] text-muted">
        Vince {winner === 'parzen' ? 'la black box di Parzen' : 'il modello parametrico'}: la barra più corta è l'errore più basso.
      </p>
      <SeriesLegend
        items={[
          { kind: 'line', cls: 1, label: 'modello gaussiano (ML)' },
          {
            kind: 'line',
            role: 'estimate',
            width: 2.5,
            label: (
              <>
                stima di Parzen <M tex="\hat p(x)" />
              </>
            ),
          },
          { kind: 'line', role: 'truth', label: 'densità vera' },
          { kind: 'wash', role: 'sample', label: 'istogramma dei dati' },
        ]}
      />
      <Note>
        Dati sintetici: densità vera <M tex={t.tex} />, troncata a [0, 9] kWh/m². Sul grafico, frecce o puntatore spostano il punto <M tex="x^*" /> delle formule.
      </Note>
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption
        index={sb.index}
        total={steps.length}
        label={sb.step.label}
        text={captionFor(sb.index, { n, h: formatH(h), truth, mu: f2(fit.mu), winner, K, x: f2(probe) })}
      />
      <div className="grid grid-cols-1 gap-3 border-t border-border pt-3">
        <span className="label">Dentro la black box · Parzen windows estimation</span>
        <LiveFormula tex={TEX_KNV} values={values} />
        <span className="label">Dentro il modello parametrico · maximum likelihood</span>
        <LiveFormula tex={TEX_ML} values={values} announce={false} />
        <span className="label">Errore quadratico integrato · integrated squared error</span>
        <LiveFormula tex={TEX_ISE} values={values} announce={false} />
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={CHALLENGE_PROMPT} hint={CHALLENGE_HINT} status={status} onCheck={verify} />
      <div className="grid gap-3 sm:grid-cols-2">
        {TRUTHS.map((tr) => (
          <Segmented<Machine | ''>
            key={tr.id}
            id={`${uid}-pred-${tr.id}`}
            label={`N = 30, ${tr.it}: vince`}
            options={[
              { value: 'gauss', label: 'Gaussiana' },
              { value: 'parzen', label: 'Parzen' },
            ]}
            value={predictions[tr.id]}
            onChange={(v) => setPredictions((cur) => ({ ...cur, [tr.id]: v }))}
          />
        ))}
      </div>
      {valid !== null ? (
        <div className="grid gap-2">
          {valid.part1.map((r) => (
            <Verdict key={r.id} ok={r.predicted === r.actual}>
              <strong>{truthById(r.id).it}</strong>: {r.predicted === '' ? 'nessuna previsione' : `hai previsto ${r.predicted === 'gauss' ? 'la gaussiana' : 'Parzen'}`}; con N = 30 vince{' '}
              {r.actual === 'gauss' ? 'la gaussiana' : 'Parzen'} (errore di Parzen diviso errore della gaussiana: <span className="num">{f2(r.ratio)}</span>).
            </Verdict>
          ))}
          <Verdict ok={valid.part2.ok}>
            {!valid.part2.truthOk
              ? 'Parte 2: scegli la densità asimmetrica.'
              : valid.part2.target === null
                ? `Parte 2: con h = ${formatH(h)} la black box non batte stabilmente la gaussiana su questi dati: stringi h.`
                : `Parte 2: con questi dati e h = ${formatH(h)} Parzen vince per ogni N da ${valid.part2.target} in su; tu hai scelto N = ${valid.part2.chosen}.`}
          </Verdict>
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={1.1} onReset={reset} transport={<PlayControls sb={sb} steps={steps} />} caption={caption} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
