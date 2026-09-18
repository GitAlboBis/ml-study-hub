// m09-ipercubo-che-conta: l'ipercubo di lato h attorno a x* e la funzione finestra γ che trasforma il conteggio dei
// campioni in una formula (concetti c04 ipotesi e V = hⁿ, c05 γ, c06 test di appartenenza, c07 K = Σ γ).
// 40 salmoni nel piano luminosità × larghezza (unità normalizzate 0-10): x* si trascina, h si regola, la scansione
// esamina un salmone alla volta e scrive la fila di 0 e 1 della sommatoria; n = 1, 2, 3 cambia la dimensione.
//
// STRUTTURA. Logica, dati e testi in ipercubo.ts (con i test); qui il terreno, i comandi, le formule e la sfida.
//
// MOTO. La scansione è lo storyboard (250 ms a salmone, 10 s in tutto, velocità ×1 ×2 ×4): il segmento verso x_k
// cresce in 120 ms, il salmone dentro pulsa (scala 1 → 1.4 → 1). La proiezione su n = 1 segue l'avanzamento del suo
// passo. Trascinare x*, muovere h, scegliere n: nessuna animazione, il terreno segue la mano. "+1 salmone" ferma la
// storia e avanza la scansione a mano. Con reduced motion ogni passo è il suo stato finale.
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { M } from '../../components/content/M'
import { clippedPeaks, easeInOut, easeOut } from '../engines/density1d/density1d'
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
import { Toggle } from '../kit/Toggle'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import type { WidgetMeta } from '../types'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  H_DEFAULT,
  H_RANGE,
  H_STEP,
  N_SALMON,
  SEED_DEFAULT,
  SPOTS,
  STEP,
  TARGET_X,
  TEX_COUNT,
  TEX_GAMMA,
  TEX_MEMBER,
  X_START,
  captionFor,
  centerOf,
  countK,
  estimate,
  estimateVsH,
  gammaCube,
  hForK,
  judge,
  normalized,
  pulseScale,
  salmonSet,
  scanAt,
  stepsFor,
  texSample,
  volume,
} from './ipercubo'
import type { ChallengeVerdict, Dim, Point3, Spot } from './ipercubo'
import { Note, Verdict } from './parzen-lab-ui'

export const meta: WidgetMeta = {
  id: 'm09-ipercubo-che-conta',
  moduleId: 'm09-parzen-windows',
  title: "L'ipercubo che conta i campioni",
  concepts: ['c04', 'c05', 'c06', 'c07'],
  scenario: 'pesce',
  scenarioNote: 'Impianto di confezionamento: 40 salmoni del training set, luminosità e larghezza riscalate a 0-10',
  size: 'M',
}

const f0 = fixed(0)
const f1 = fixed(1)
const f2 = fixed(2)
const f3 = fixed(3)
const f4 = fixed(4)
const SIDE_Y_MAX = 0.25
/** Lato della vista del riquadro dell'ipercubo unitario: [−1.5, 1.5]. */
const INSET_R = 1.5
const n2 = (v: number) => Number(v.toFixed(2))

type Mark = 'neutral' | 'in' | 'out' | 'out3'

// --- strati del terreno ---

/** I salmoni: neutri prima della scansione; dentro = pieni verde-acqua con alone; fuori = cerchio vuoto tenue. */
function SalmonLayer({ points, marks, proj, current, scale }: { points: readonly Point3[]; marks: readonly Mark[]; proj: number; current: number; scale: number }) {
  const { x, y, showTip } = usePlot()
  const size = Math.PI * 4.5 * 4.5
  return (
    <g data-salmon="">
      {points.map((p, k) => {
        const yy = p[1] + (0.4 - p[1]) * proj
        const m = marks[k]
        const s = k === current ? scale : 1
        return (
          <g
            key={k}
            data-point={m}
            transform={`translate(${n2(x(p[0]))},${n2(y(yy))}) scale(${n2(s)})`}
            onPointerEnter={() => showTip({ x: x(p[0]), y: y(yy) - 8, value: `x = (${f1(p[0])}, ${f1(p[1])}, ${f1(p[2])})`, label: `salmone ${k + 1}` })}
            onPointerLeave={() => showTip(null)}
          >
            <circle r={11} fill="transparent" />
            {m === 'in' ? <circle r={8} fill="var(--viz-highlight)" stroke="var(--pin-contrast)" strokeWidth={1} /> : null}
            {m === 'in' ? (
              <path d={classSymbolPath(0, size)} fill={classVar(3)} stroke="var(--surface)" strokeWidth={2} paintOrder="stroke" />
            ) : m === 'neutral' ? (
              <path d={classSymbolPath(0, size)} fill="var(--viz-sample)" stroke="var(--surface)" strokeWidth={2} paintOrder="stroke" />
            ) : (
              <circle r={4} fill="var(--surface)" stroke={m === 'out3' ? 'var(--viz-sample)' : 'var(--text-faint)'} strokeWidth={1.5} strokeDasharray={m === 'out3' ? '2 1.5' : undefined} />
            )}
          </g>
        )
      })}
    </g>
  )
}

/** L'ipercubo attorno a x*: quadrato (n = 2, 3) o intervallo (n = 1, fascia a tutta altezza). */
function Cube({ c, h, proj }: { c: readonly [number, number]; h: number; proj: number }) {
  const { x, y, innerHeight, clipPath } = usePlot()
  const x0 = x(c[0] - h / 2)
  const w = x(c[0] + h / 2) - x0
  // n = 1: il quadrato si allunga fino a coprire tutta l'altezza
  const top = y(c[1] + h / 2) * (1 - proj)
  const bottom = y(c[1] - h / 2) + (innerHeight - y(c[1] - h / 2)) * proj
  return (
    <g data-cube="" clipPath={clipPath} pointerEvents="none">
      <rect x={n2(x0)} y={n2(top)} width={n2(Math.max(1, w))} height={n2(Math.max(1, bottom - top))} fill="var(--pin)" fillOpacity={0.28} stroke="var(--pin-contrast)" strokeWidth={1.5} />
    </g>
  )
}

/** Il segmento tratteggiato da x* al salmone in esame, lungo quanto è cresciuto, e l'etichetta del suo γ. */
function ScanSegment({ from, to, grow, g, proj }: { from: readonly [number, number]; to: Point3; grow: number; g: 0 | 1; proj: number }) {
  const { x, y } = usePlot()
  const ty = to[1] + (0.4 - to[1]) * proj
  const fx = x(from[0])
  const fy = y(from[1])
  const ex = fx + (x(to[0]) - fx) * grow
  const ey = fy + (y(ty) - fy) * grow
  return (
    <g data-scan="" pointerEvents="none">
      <line x1={n2(fx)} y1={n2(fy)} x2={n2(ex)} y2={n2(ey)} stroke="var(--viz-boundary)" strokeWidth={1.5} strokeDasharray="4 3" />
      {grow >= 1 ? (
        <text className="num" x={n2(x(to[0]) + 10)} y={n2(y(ty) - 8)} fontSize={12} fontWeight={600} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
          γ = {g}
        </text>
      ) : null}
    </g>
  )
}

/** Le tre posizioni della sfida (A, B, C) e il bersaglio (5, 3): croci a inchiostro con la lettera. */
function SpotMarks({ spots }: { spots: readonly { id: string; x: readonly [number, number] }[] }) {
  const { x, y } = usePlot()
  return (
    <g data-spots="" pointerEvents="none">
      {spots.map((s) => (
        <g key={s.id} transform={`translate(${n2(x(s.x[0]))},${n2(y(s.x[1]))})`}>
          <path d="M-5 -5L5 5M-5 5L5 -5" stroke="var(--text)" strokeWidth={1.5} />
          <text className="label" x={7} y={-6} fontSize={11} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
            {s.id}
          </text>
        </g>
      ))}
    </g>
  )
}

/** Il riquadro dell'ipercubo unitario: i salmoni visti come u = (x_k − x*)/h; dentro solo quelli con |u_j| ≤ 1/2. */
function UnitInset({ us, marks, current, n }: { us: readonly number[][]; marks: readonly Mark[]; current: number; n: Dim }) {
  const S = 112
  const px = (u: number) => ((u + INSET_R) / (2 * INSET_R)) * S
  const half = px(0.5) - px(0)
  return (
    <figure className="pointer-events-none absolute top-2 right-2 m-0 grid gap-0.5 border border-border-strong bg-surface p-1.5 shadow-1" aria-hidden="true">
      <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S}>
        <line x1={px(0)} x2={px(0)} y1={0} y2={S} stroke="var(--viz-grid)" />
        <line x1={0} x2={S} y1={px(0)} y2={px(0)} stroke="var(--viz-grid)" />
        {n === 1 ? (
          <rect x={px(-0.5)} y={0} width={2 * half} height={S} fill="var(--pin)" fillOpacity={0.3} stroke="var(--pin-contrast)" />
        ) : (
          <rect x={px(-0.5)} y={px(-0.5)} width={2 * half} height={2 * half} fill="var(--pin)" fillOpacity={0.3} stroke="var(--pin-contrast)" />
        )}
        {us.map((u, k) => {
          const ux = u[0]
          const uy = n === 1 ? 0 : u[1]
          if (Math.abs(ux) > INSET_R || Math.abs(uy) > INSET_R || marks[k] === 'neutral') return null
          const cx = px(ux)
          const cy = S - px(uy)
          return k === current ? (
            <rect key={k} x={cx - 4} y={cy - 4} width={8} height={8} fill="var(--pin)" stroke="var(--pin-contrast)" transform={`rotate(45 ${cx} ${cy})`} />
          ) : marks[k] === 'in' ? (
            <circle key={k} cx={cx} cy={cy} r={2.5} fill={classVar(3)} />
          ) : (
            <circle key={k} cx={cx} cy={cy} r={2.2} fill="none" stroke="var(--text-faint)" />
          )
        })}
      </svg>
      <figcaption className="label text-center text-[10px]">ipercubo unitario</figcaption>
    </figure>
  )
}

/** Il grafico piccolo: p̂(x*) in funzione di h, con lo spillo sul valore corrente. */
function EstimateVsH({ curve, h, p }: { curve: readonly (readonly [number, number])[]; h: number; p: number }) {
  return (
    <div className="grid gap-1">
      <span className="label">Stima in x* al variare di h</span>
      <Plot
        width={300}
        height={170}
        xDomain={H_RANGE}
        yDomain={[0, SIDE_Y_MAX]}
        margin={{ top: 10, right: 10, bottom: 34, left: 44 }}
        ariaLabel="Stima in x* in funzione del lato h"
        description={`Con h = ${f1(h)} la stima vale ${f4(p)}. Con h piccolo salta fra 0 e valori alti, con h grande scende lentamente.`}
      >
        <Grid axis="y" yTicks={[0.1, 0.2]} />
        <LinePath data={curve} role="estimate" width={1.5} />
        <ClippedMarks at={clippedPeaks(curve.map((c) => c[0]), curve.map((c) => c[1]), SIDE_Y_MAX)} />
        <Dots data={[{ x: h, y: Math.min(p, SIDE_Y_MAX), label: 'valore corrente' }]} pin />
        <Axis side="bottom" symbol="h" ticks={[0.2, 2, 4, 6, 8]} />
        <Axis side="left" ticks={[0, 0.1, 0.2]} symbol="p̂" />
      </Plot>
    </div>
  )
}

// --- il widget ---

interface Checked {
  key: string
  verdict: ChallengeVerdict
  noTarget: boolean
}

type Preds = Record<Spot['id'], number>
const PREDS0: Preds = { A: 0, B: 0, C: 0 }

export default function IpercuboCheConta() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [seed, setSeed] = useState(SEED_DEFAULT)
  const [x, setX] = useState<readonly [number, number]>(X_START)
  const [h, setH] = useState(H_DEFAULT)
  const [nUser, setNUser] = useState<Dim>(2)
  const [hide, setHide] = useState(false)
  const [insetOn, setInsetOn] = useState(true)
  /** scansione a mano ("+1 salmone"): quanti salmoni sono stati esaminati; null = decide lo storyboard */
  const [manual, setManual] = useState<number | null>(null)
  /** passo in cui l'utente ha preso in mano n: lì la n imposta dal racconto non vale più */
  const [takeover, setTakeover] = useState<number | null>(null)
  const [preds, setPreds] = useState<Preds>(PREDS0)
  const [checked, setChecked] = useState<Checked | null>(null)

  const points = useMemo(() => salmonSet(seed), [seed])
  const N = points.length

  // --- storyboard ---
  const steps = stepsFor(N)
  const sb = useStoryboard(steps)
  const at = sb.index
  const pr = sb.progress
  const imposed: Dim | null = at === STEP.uno ? 1 : at === STEP.tre ? 3 : null
  const n: Dim = imposed !== null && takeover !== at ? imposed : nUser
  const proj = n === 1 ? (at === STEP.uno && takeover !== at ? easeInOut(pr) : 1) : 0
  const depth = at === STEP.tre && takeover !== at ? easeOut(pr / 0.5) : 1

  const center = centerOf(x, n)
  const row = points.map((p) => gammaCube(normalized(p, center, h)))
  const K = row.reduce<number>((s, g) => s + g, 0)
  const V = volume(h, n)
  const p = estimate(K, N, h, n)
  const us = points.map((pt) => normalized(pt, centerOf(x, n === 1 ? 1 : 2), h))

  // scansione: dallo storyboard, oppure a mano
  const scanning = at === STEP.scansione || manual !== null
  const scan = manual !== null ? { done: manual, current: manual > 0 ? manual - 1 : -1, segment: 1, local: 1 } : at === STEP.scansione ? scanAt(pr, N) : null
  const examined = (k: number) => scan === null || k < scan.done || (k === scan.current && scan.segment >= 1)
  // in n = 2 un salmone del quadrato fuori per la lunghezza (n = 3) è un cerchio tratteggiato
  const inSquare = (k: number) => gammaCube(normalized(points[k], centerOf(x, 2), h)) === 1
  const marks: Mark[] = points.map((_, k) => {
    if (hide || !examined(k)) return 'neutral'
    if (row[k] === 1) return 'in'
    return n === 3 && inSquare(k) && depth > 0.5 ? 'out3' : 'out'
  })
  const current = scan?.current ?? -1
  const pulse = scan !== null && current >= 0 && row[current] === 1 ? pulseScale(scan.local) : 1
  const shownDigits = scan === null ? N : Math.min(N, scan.done + (scan.segment >= 1 && scan.current >= 0 ? 1 : 0))
  const collapsed = !scanning && at !== STEP.quadro

  // la fila della somma scorre da sola verso l'ultimo addendo
  const rowRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = rowRef.current
    if (el !== null && scanning) el.scrollLeft = el.scrollWidth
  }, [shownDigits, scanning])

  const curve = useMemo(() => estimateVsH(points, centerOf(x, n), n), [points, x, n])
  const table = ([1, 2, 3] as const).map((d) => {
    const k = countK(points, centerOf(x, d), h)
    return { d, V: volume(h, d), K: k, p: estimate(k, N, h, d) }
  })

  // --- azioni ---
  const moveX = (_id: string, nx: number, ny: number) => setX([Number(nx.toFixed(1)), Number(ny.toFixed(1))])
  const chooseN = (v: Dim) => {
    if (imposed !== null && takeover !== at) {
      sb.pause()
      setTakeover(at)
    }
    setNUser(v)
  }
  const plusOne = () => {
    sb.pause()
    if (at !== STEP.scansione) sb.goto(STEP.scansione)
    setManual((m) => {
      const next = (m ?? (at === STEP.scansione && scan !== null ? scan.done : 0)) + 1
      return next > N ? null : next
    })
  }
  const clearManual = () => setManual(null)
  const reset = () => {
    sb.reset()
    setSeed(SEED_DEFAULT)
    setX(X_START)
    setH(H_DEFAULT)
    setNUser(2)
    setHide(false)
    setInsetOn(true)
    setManual(null)
    setTakeover(null)
    setPreds(PREDS0)
    setChecked(null)
  }

  const checkKey = `${seed}|${x[0]},${x[1]}|${h}|${n}|${preds.A},${preds.B},${preds.C}`
  const verify = () => setChecked({ key: checkKey, verdict: judge({ points, predictions: preds, x, h, n }), noTarget: hForK(points, TARGET_X, 5).length === 0 })
  const valid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.verdict.ok ? 'ok' : 'ko'

  // --- valori delle formule ---
  const kIdx = current >= 0 ? current : 0
  const uCur = normalized(points[kIdx], center, h)
  const values = {
    h,
    n,
    V,
    K: hide ? '?' : K,
    N,
    p: hide ? '?' : p,
    k: kIdx + 1,
    u1: uCur[0],
    u2: uCur[1],
    u3: uCur[2],
    g: row[kIdx],
  }
  const digits = row.slice(0, shownDigits)

  const summary = `${N} salmoni nel piano luminosità-larghezza. x* = (${f1(x[0])}, ${f1(x[1])}), lato h = ${f1(h)}, n = ${n}, volume V = ${f3(V)}.` + (hide ? ' Conteggio nascosto per la previsione.' : ` Dentro l'ipercubo K = ${K} salmoni: la stima vale ${f4(p)}.`)

  const terrain = (
    <div className="absolute inset-0">
      <Plot
        width={520}
        height={460}
        fill
        xDomain={[0, 10]}
        yDomain={[0, 10]}
        margin={{ top: 12, right: 12, bottom: 42, left: 46 }}
        ariaLabel="Piano luminosità-larghezza dei salmoni con l'ipercubo di lato h centrato in x*"
        description={summary}
      >
        <Grid />
        <Cube c={x} h={h} proj={proj} />
        <SpotMarks spots={[...SPOTS, { id: '(5, 3)', x: TARGET_X }]} />
        <SalmonLayer points={points} marks={marks} proj={proj} current={current} scale={pulse} />
        {scan !== null && current >= 0 ? <ScanSegment from={x} to={points[current]} grow={scan.segment} g={row[current]} proj={proj} /> : null}
        <Dots data={[{ x: x[0], y: x[1], id: 'x', label: 'Punto x* (dove si stima la densità)' }]} draggable pin onDrag={moveX} step={0.1} format={f1} />
        <Axis side="bottom" label="luminosità" symbol="x₁" />
        <Axis side="left" label={n === 1 ? undefined : 'larghezza'} symbol="x₂" />
      </Plot>
      {insetOn ? <UnitInset us={us} marks={marks} current={current} n={n} /> : null}
    </div>
  )

  const controls = (
    <>
      <Segmented
        id={`${uid}-n`}
        label="Dimensione dello spazio delle feature"
        options={[
          { value: '1', label: 'n = 1' },
          { value: '2', label: 'n = 2' },
          { value: '3', label: 'n = 3' },
        ]}
        value={String(n) as '1' | '2' | '3'}
        onChange={(v) => chooseN(Number(v) as Dim)}
      />
      <Slider id={`${uid}-h`} label="Lato dell'ipercubo (edge)" latex="h" min={H_RANGE[0]} max={H_RANGE[1]} step={H_STEP} value={h} onChange={setH} format={f1} />
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={plusOne} title="Ferma la storia ed esamina il prossimo salmone">
            +1 salmone
          </ActionButton>
          <ActionButton onClick={() => setSeed((s) => s + 1)}>Nuovi salmoni</ActionButton>
        </div>
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          x* si trascina con il puntatore oppure con le frecce (un decimo; Maiusc: un'unità) dopo averlo raggiunto con Tab.
        </p>
      </div>
      <div className="grid gap-1">
        <Toggle id={`${uid}-hide`} label="Prevedi prima di guardare" hint="Nasconde colori e conteggio: sposta x*, prevedi K, poi riaccendi." checked={hide} onChange={setHide} />
        <Toggle id={`${uid}-inset`} label="Riquadro dell'ipercubo unitario" hint="I salmoni visti come u = (x_k − x*)/h." checked={insetOn} onChange={setInsetOn} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Dentro l'ipercubo" latex="K" value={hide ? '?' : K} format={f0} pinned />
        <Readout label="Salmoni" latex="N" value={N} format={f0} />
        <Readout label="Volume" latex="V=h^n" value={V} format={f3} />
        <Readout label="Stima in x*" latex="\hat p(\mathbf{x}^*)" value={hide ? '?' : p} format={f4} />
      </div>
      <EstimateVsH curve={curve} h={h} p={hide ? 0 : p} />
    </>
  )

  const caption = (
    <div className="grid grid-cols-1 gap-4">
      <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(sb.index, { K, N, h: f1(h), V: f3(V), p: f3(p), n })} />
      <div className="grid gap-1.5">
        <span className="label">Sommatoria · number of samples in the hypercube</span>
        <div ref={rowRef} className="overflow-x-auto border border-border bg-surface-2 px-2 py-1.5" tabIndex={0} role="region" aria-label="Addendi della sommatoria di K">
          <p className="num m-0 whitespace-nowrap">
            K ={' '}
            {collapsed || hide ? (
              <strong>{hide ? '?' : K}</strong>
            ) : (
              <>
                {digits.map((g, k) => (
                  <span key={k} className={k === current ? 'bg-pin px-0.5 text-pin-contrast' : g === 1 ? 'font-bold' : 'text-faint'}>
                    {k > 0 ? ' + ' : ''}
                    {g}
                  </span>
                ))}
                {shownDigits < N ? <span className="text-faint"> + …</span> : <strong> = {K}</strong>}
              </>
            )}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 border-t border-border pt-3">
        <span className="label">Ipotesi, funzione finestra e test di appartenenza · window function</span>
        <M tex={TEX_GAMMA} display />
        <M tex={TEX_MEMBER} display />
        <span className="label">Il conteggio in formula · p̂(x*) = K / (NV)</span>
        <LiveFormula tex={TEX_COUNT} values={values} />
        {scan !== null && current >= 0 ? (
          <>
            <span className="label">Il salmone in esame</span>
            <LiveFormula tex={texSample(n)} values={values} announce={false} />
          </>
        ) : null}
      </div>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Confronto fra n = 1, 2, 3 a parità di h">
        <table className="num w-full border-collapse text-right text-[length:var(--step--1)]">
          <caption className="label pb-1 text-left">
            Stesso lato <span className="num tracking-normal normal-case">h = {f1(h)}</span>, tre dimensioni
          </caption>
          <thead>
            <tr className="border-b border-border-strong text-muted">
              <th scope="col" className="py-1 pr-2 text-left font-normal">
                dimensione
              </th>
              <th scope="col" className="px-2 py-1 font-normal">
                <M tex="V=h^n" />
              </th>
              <th scope="col" className="px-2 py-1 font-normal">
                <M tex="K" />
              </th>
              <th scope="col" className="py-1 pl-2 font-normal">
                <M tex="\hat p(\mathbf{x}^*)" />
              </th>
            </tr>
          </thead>
          <tbody>
            {table.map((r) => (
              <tr key={r.d} className={`border-b border-border ${r.d === n ? 'bg-surface-2 font-semibold' : ''}`}>
                <th scope="row" className="py-0.5 pr-2 text-left font-normal">
                  n = {r.d} {r.d === 1 ? '(intervallo)' : r.d === 2 ? '(quadrato)' : '(cubo)'}
                </th>
                <td className="px-2 py-0.5">{f3(r.V)}</td>
                <td className="px-2 py-0.5">{hide ? '?' : r.K}</td>
                <td className="py-0.5 pl-2">{hide ? '?' : f4(r.p)}</td>
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
      <div className="grid gap-3 sm:grid-cols-3">
        {SPOTS.map((s) => (
          <NumberField
            key={s.id}
            id={`${uid}-pred-${s.id}`}
            label={`K previsto in ${s.id} (${f1(s.x[0])}, ${f1(s.x[1])})`}
            min={0}
            max={N_SALMON}
            step={1}
            value={preds[s.id]}
            onChange={(v) => setPreds((cur) => ({ ...cur, [s.id]: v }))}
            format={f0}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {SPOTS.map((s) => (
          <ActionButton key={s.id} onClick={() => setX(s.x)}>
            Porta x* in {s.id}
          </ActionButton>
        ))}
        <ActionButton onClick={() => setX(TARGET_X)}>Porta x* in (5, 3)</ActionButton>
      </div>
      {valid !== null ? (
        <div className="grid gap-2">
          {valid.verdict.spots.map((s) => (
            <Verdict key={s.id} ok={s.ok}>
              <strong>{s.id}</strong>: hai previsto <span className="num">K = {s.predicted ?? '—'}</span>; con h = 1.5 nel quadrato cadono <span className="num">{s.actual}</span> salmoni.
            </Verdict>
          ))}
          <Verdict ok={valid.verdict.second.ok}>
            {valid.noTarget
              ? 'Con questi salmoni nessun lato dello slider dà esattamente 5: torna ai salmoni iniziali con Reset.'
              : !valid.verdict.second.atTarget
                ? 'Seconda parte: porta x* in (5, 3).'
                : !valid.verdict.second.dimOk
                  ? 'Seconda parte: torna a n = 2 (il quadrato).'
                  : valid.verdict.second.ok
                    ? `Seconda parte: con h = ${f1(h)} nel quadrato ci sono esattamente 5 salmoni, e p̂ = 5/(40 · ${f2(h * h)}) = ${f4(valid.verdict.second.p)}.`
                    : `Seconda parte: con h = ${f1(h)} i salmoni nel quadrato sono ${valid.verdict.second.K}, non 5.`}
          </Verdict>
        </div>
      ) : null}
      <Note>Con un lato più grande il quadrato raccoglie più salmoni ma divide per un volume più grande: la stima cambia molto meno del conteggio.</Note>
    </div>
  )

  return (
    <WidgetFrame
      meta={meta}
      aspect={1.12}
      onReset={reset}
      transport={
        <div onClickCapture={clearManual} onKeyDownCapture={clearManual}>
          <PlayControls sb={sb} steps={steps} speeds={[1, 2, 4]} />
        </div>
      }
      caption={caption}
      controls={controls}
      challenge={challenge}
    >
      {terrain}
    </WidgetFrame>
  )
}
