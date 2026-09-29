// Banco di prova privato delle maniglie e dei segni comuni dei motori (src/widgets/engines/shared/): non è un widget
// dell'app. Serve a vederli tutti insieme nel browser, nei due temi e a 390 px (/lab/_maniglie-e-segni), e ai
// revisori della base comune. La cartella comincia con "_": il registry lo carica per id ma non lo elenca.
import { useCallback, useMemo, useRef, useState } from 'react'
import { ActionButton } from '../kit/ActionButton'
import { Arrow } from '../kit/plot/Arrow'
import { Axis } from '../kit/plot/Axis'
import { Dots } from '../kit/plot/Dots'
import { Grid } from '../kit/plot/Grid'
import { Histogram } from '../kit/plot/Histogram'
import { LinePath } from '../kit/plot/LinePath'
import { Plot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { useAnimationFrame } from '../kit/useAnimationFrame'
import { useReducedMotion } from '../kit/useReducedMotion'
import type { WidgetMeta } from '../types'
import { DragBins } from '../engines/shared/DragBins'
import { sortOutcome, type Placement } from '../engines/shared/dragKeyboard'
import { Ellipse } from '../engines/shared/Ellipse'
import { FlightAnchor, FlightLayer, FlightMarks } from '../engines/shared/Flight'
import { staggered } from '../engines/shared/flightPath'
import { binEdges } from '../engines/shared/handleMath'
import { HandleOnCurve } from '../engines/shared/HandleOnCurve'
import { AngleHandle, Knob } from '../engines/shared/Knob'
import { LineHandles } from '../engines/shared/LineHandles'
import { MatrixGrid } from '../engines/shared/MatrixGrid'
import type { Mat2, Vec2 } from '../engines/shared/math/types'
import { Ribbon } from '../engines/shared/Ribbon'
import { Sketch } from '../engines/shared/Sketch'
import { sketchScore, sketchStart, sketchXs } from '../engines/shared/sketchScore'
import { Sortable } from '../engines/shared/Sortable'
import { Stem } from '../engines/shared/Stem'
import { Threshold, ThresholdSet } from '../engines/shared/Threshold'
import { Violin } from '../engines/shared/Violin'
import { normalPdf } from '../../lib/ml/stats'
import { createRng } from '../../lib/rng'

// oxlint-disable-next-line react/only-export-components -- `meta` è parte del contratto dei file *.widget.tsx (src/widgets/types.ts)
export const meta: WidgetMeta = {
  id: '_maniglie-e-segni',
  moduleId: '_base-maniglie',
  title: 'Banco di prova: maniglie e segni dei motori',
  concepts: [],
  scenario: 'pesce',
  scenarioNote: 'Luminosità dei salmoni e piano luminosità × larghezza: dati sintetici per provare i pezzi comuni',
  size: 'L',
}

const f2 = (v: number) => v.toFixed(2)
const PANEL = 'grid min-w-0 content-start gap-3 border border-border-strong bg-surface p-3'
const H2 = 'label m-0 text-[length:var(--step-0)]'

/** Luminosità di 60 salmoni: N(4, 0.8²), a seed. */
const LUMS = (() => {
  const rng = createRng(20260924)
  return Array.from({ length: 60 }, () => rng.normal(4, 0.8))
})()

function OneD() {
  const [mu, setMu] = useState(4)
  const [flank, setFlank] = useState(4.8)
  const [x, setX] = useState(5)
  const [tau, setTau] = useState(0.2)
  const sigma = Math.max(0.2, flank - mu)
  const xs = useMemo(() => Array.from({ length: 201 }, (_, i) => i / 20), [])
  const curve = useMemo(() => xs.map((v) => [v, normalPdf(v, mu, sigma)]), [xs, mu, sigma])
  const band = useMemo(() => xs.map((v) => [v, normalPdf(v, mu, sigma) * 0.7, normalPdf(v, mu, sigma) * 1.3]), [xs, mu, sigma])
  const edges = binEdges(0, 0.5, 20)
  return (
    <section className={PANEL} aria-labelledby="bm-1d">
      <h2 id="bm-1d" className={H2}>
        Soglia, maniglie su una curva, fascia
      </h2>
      <div className="aspect-[16/10] w-full">
        <Plot fill width={640} height={400} xDomain={[0, 10]} yDomain={[0, 0.8]} ariaLabel="Campana della luminosità con soglia" description={`Gaussiana con media ${f2(mu)} e deviazione ${f2(sigma)}; soglia x* = ${f2(x)}`}>
          <Grid axis="y" />
          <Histogram values={LUMS} bins={20} domain={[0, 10]} normalize />
          <Ribbon data={band} role="kernel" edges />
          <LinePath data={curve} role="estimate" />
          <Threshold value={x} onChange={setX} label="Soglia sulla luminosità x*" symbol="x*" snaps={edges} />
          <Threshold value={tau} onChange={setTau} orientation="horizontal" label="Soglia sulla densità τ" symbol="τ" step={0.01} min={0} max={0.8} />
          <HandleOnCurve value={mu} onChange={(v) => { setFlank(v + sigma); setMu(v) }} f={(v) => normalPdf(v, mu, sigma)} label="Picco della campana: media μ" step={0.05} guide valueText={(v) => `μ = ${f2(v)}`} />
          <HandleOnCurve value={flank} onChange={(v) => setFlank(Math.max(mu + 0.2, v))} f={(v) => normalPdf(v, mu, sigma)} range={[mu + 0.2, 10]} label="Fianco della campana: μ + σ" kind="ring" step={0.05} valueText={(v) => `σ = ${f2(v - mu)}`} />
          <Axis side="bottom" label="luminosità" symbol="x" />
          <Axis side="left" symbol="p(x)" />
        </Plot>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Readout label="Media" latex="\mu" value={mu} />
        <Readout label="Deviazione" latex="\sigma" value={sigma} />
        <Readout label="Soglia" latex="x^*" value={x} pinned />
      </div>
    </section>
  )
}

function TwoD() {
  const [m, setM] = useState<Vec2>([4, 3])
  const [S, setS] = useState<Mat2>([
    [1.2, 0.6],
    [0.6, 0.8],
  ])
  const [p, setP] = useState<Vec2>([1, 5.5])
  const [q, setQ] = useState<Vec2>([8, 1])
  const [theta, setTheta] = useState(30)
  const [cell, setCell] = useState<readonly [number, number] | null>(null)
  return (
    <section className={PANEL} aria-labelledby="bm-2d">
      <h2 id="bm-2d" className={H2}>
        Ellisse, retta a due maniglie, manopola e matrice
      </h2>
      <div className="aspect-[16/10] w-full">
        <Plot fill width={640} height={400} xDomain={[0, 8]} yDomain={[0, 6]} ariaLabel="Piano luminosità per larghezza con l'ellisse della covarianza">
          <Grid />
          <Ellipse m={[5.5, 4.2]} Sigma={[[0.5, -0.2], [-0.2, 0.3]]} levels={[1]} role="truth" />
          <Ellipse m={m} Sigma={S} levels={[1, 2]} cls={1} axes center levelLabels label="Ellisse dei salmoni" handles={{ mean: true, rotate: true, axes: true, onChange: (n) => { setM(n.m); setS(n.Sigma) } }} />
          <LineHandles p={p} q={q} onChange={(a, b) => { setP(a); setQ(b) }} label="Retta di separazione" translate normal={{ label: 'w' }} />
          <Arrow from={[1.2, 1.2]} to={[1.2 + Math.cos((theta * Math.PI) / 180), 1.2 + Math.sin((theta * Math.PI) / 180)]} label="w" />
          <AngleHandle center={[1.2, 1.2]} angle={theta} radius={1} onChange={setTheta} label="Direzione w" axial ring />
          <Dots data={[{ x: 1.2, y: 1.2, label: 'origine di w' }]} />
          <Axis side="bottom" label="luminosità" symbol="x₁" />
          <Axis side="left" symbol="x₂" />
        </Plot>
      </div>
      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <Knob id="bm-knob" label="Direzione della retta" latex="\theta" value={theta} onChange={setTheta} axial />
        <div className="grid gap-2">
          <MatrixGrid
            values={S}
            label="Matrice di covarianza Σ"
            symbol="\Sigma ="
            rowLabels={['x_1', 'x_2']}
            colLabels={['x_1', 'x_2']}
            rowSpoken={['x uno', 'x due']}
            colSpoken={['x uno', 'x due']}
            symmetric
            onCellFocus={setCell}
          />
          <p className="m-0 text-[length:var(--step--1)] text-muted" aria-live="polite">
            {cell === null ? 'Passa su una cella: si accende anche la simmetrica.' : `Cella ${cell[0] + 1},${cell[1] + 1}`}
          </p>
        </div>
      </div>
    </section>
  )
}

function Signals() {
  const [cuts, setCuts] = useState<number[]>([2.5, 5.5])
  const stems = useMemo(() => Array.from({ length: 17 }, (_, n) => ({ x: n * 0.5, y: 0.5 + 0.4 * Math.sin(n * 0.6), id: `n${n}`, label: `x[${n}]` })), [])
  const groups = useMemo(() => {
    const rng = createRng(7)
    return [5, 20, 100].map((n) => Array.from({ length: 200 }, () => {
      let s = 0
      for (let k = 0; k < n; k++) s += rng.normal(4, 0.8)
      return s / n
    }))
  }, [])
  return (
    <section className={PANEL} aria-labelledby="bm-sig">
      <h2 id="bm-sig" className={H2}>
        Steli e violini
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="aspect-[4/3] w-full">
          <Plot fill width={400} height={300} xDomain={[0, 8]} yDomain={[0, 1]} ariaLabel="Segnale campionato" cursor="x">
            <Grid axis="y" />
            <Stem data={stems} highlight={['n6']} />
            <ThresholdSet values={cuts} onChange={setCuts} gap={0.5} snaps={stems.map((s) => s.x)} label={(i) => `Confine del segmento ${i + 1}`} symbol={(i) => `t${i + 1}`} />
            <Axis side="bottom" label="tempo" symbol="t" />
            <Axis side="left" symbol="x(t)" />
          </Plot>
        </div>
        <div className="aspect-[4/3] w-full">
          <Plot fill width={400} height={300} xDomain={[-0.5, 2.5]} yDomain={[3, 5]} ariaLabel="Stime della media per N = 5, 20, 100" cursor="x">
            <Grid axis="y" />
            {groups.map((g, i) => (
              <Violin key={i} values={g} at={i} label={`N = ${[5, 20, 100][i]}`} densityMax={5} cls={i} />
            ))}
            <Axis side="bottom" ticks={[0, 1, 2]} format={(i) => String([5, 20, 100][i])} symbol="N" />
            <Axis side="left" symbol="μ̂" />
          </Plot>
        </div>
      </div>
    </section>
  )
}

function Drawing() {
  const xs = useMemo(() => sketchXs([0, 10], 41), [])
  const [h, setH] = useState<readonly number[]>(() => sketchStart(xs))
  const [score, setScore] = useState<number | null>(null)
  const target = useCallback((v: number) => normalPdf(v, 4, 0.8), [])
  return (
    <section className={PANEL} aria-labelledby="bm-sk">
      <h2 id="bm-sk" className={H2}>
        Disegna la pdf della luminosità
      </h2>
      <div className="aspect-[16/10] w-full">
        <Plot fill width={640} height={400} xDomain={[0, 10]} yDomain={[0, 0.6]} ariaLabel="Tela per disegnare la pdf">
          <Grid axis="y" />
          {score !== null ? <LinePath data={xs.map((v) => [v, target(v)])} role="truth" /> : null}
          <Sketch xs={xs} heights={h} onChange={(n) => { setH(n); setScore(null) }} yMax={0.6} label="Disegna la pdf della luminosità" />
          <Axis side="bottom" label="luminosità" symbol="x" />
          <Axis side="left" symbol="p(x)" />
        </Plot>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ActionButton variant="primary" onClick={() => setScore(sketchScore(xs, h, target).similarity)}>
          Verifica
        </ActionButton>
        <ActionButton onClick={() => { setH(sketchStart(xs)); setScore(null) }}>Ricomincia</ActionButton>
        <Readout label="Somiglianza" value={score === null ? '—' : `${Math.round(score * 100)}%`} />
      </div>
    </section>
  )
}

const CARDS = [
  { id: 'c1', label: 'Il volume $V$ si adatta ai dati' },
  { id: 'c2', label: 'La finestra ha larghezza $h$ fissa' },
  { id: 'c3', label: 'Conta $K$ campioni', speak: 'Conta K campioni' },
  { id: 'c4', label: 'Somma di kernel' },
]
const ANSWER = { c1: 'knn', c2: 'parzen', c3: 'knn', c4: 'parzen' }

function Sorting() {
  const [place, setPlace] = useState<Placement>({})
  const [order, setOrder] = useState<readonly string[]>(['cls', 'acq', 'feat', 'pre'])
  const [bands, setBands] = useState<readonly string[]>(['b3', 'b1', 'b5', 'b2', 'b4'])
  const [checked, setChecked] = useState(false)
  const out = sortOutcome(place, CARDS.map((c) => c.id), ANSWER)
  const feedback = checked ? Object.fromEntries([...out.correct.map((c) => [c, 'ok' as const]), ...out.wrong.map((c) => [c, 'wrong' as const])]) : undefined
  return (
    <section className={PANEL} aria-labelledby="bm-dnd">
      <h2 id="bm-dnd" className={H2}>
        Smistare e ordinare
      </h2>
      <DragBins id="bm-bins" label="K-NN o Parzen?" items={CARDS} bins={[{ id: 'knn', label: 'K-NN' }, { id: 'parzen', label: 'Parzen' }]} placement={place} onChange={(n) => { setPlace(n); setChecked(false) }} feedback={feedback} />
      <div className="flex flex-wrap items-center gap-3">
        <ActionButton variant="primary" onClick={() => setChecked(true)}>
          Verifica
        </ActionButton>
        {checked ? <Readout label="Giuste" value={`${out.correct.length} su ${CARDS.length}`} /> : null}
      </div>
      <Sortable
        id="bm-sort"
        label="Metti in ordine la pipeline"
        numbered
        items={[
          { id: 'acq', label: 'Acquisizione' },
          { id: 'pre', label: 'Pre-elaborazione' },
          { id: 'feat', label: 'Estrazione delle feature' },
          { id: 'cls', label: 'Classificazione' },
        ]}
        order={order}
        onChange={setOrder}
      />
      <Sortable
        id="bm-bands"
        label="Bande in ordine di J, dalla migliore"
        orientation="horizontal"
        items={[
          { id: 'b1', label: 'Blu' },
          { id: 'b2', label: 'Verde' },
          { id: 'b3', label: 'Rosso' },
          { id: 'b4', label: 'Infrarosso vicino' },
          { id: 'b5', label: 'Infrarosso medio' },
        ]}
        order={bands}
        onChange={setBands}
      />
    </section>
  )
}

const PIXELS: { id: string; img: Vec2; plane: Vec2; cls: number }[] = Array.from({ length: 24 }, (_, i) => {
  const r = Math.floor(i / 6)
  const c = i % 6
  const cls = (r + c) % 3 === 0 ? 1 : 0
  return { id: `px${i}`, img: [c + 0.5, 3.5 - r], plane: cls === 1 ? [2 + (i % 5) * 0.3, 6 + (i % 4) * 0.4] : [6 + (i % 5) * 0.3, 2 + (i % 4) * 0.4], cls }
})

function Flights() {
  const reduced = useReducedMotion()
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const tRef = useRef(0)
  useAnimationFrame((dt) => {
    const next = Math.min(1, tRef.current + dt / 2400)
    tRef.current = next
    setT(next)
    if (next >= 1) setPlaying(false)
  }, playing)
  const start = () => {
    // con reduced motion lo stato finale subito: i pixel sono già nel piano
    tRef.current = reduced ? 1 : 0
    setT(tRef.current)
    setPlaying(!reduced)
  }
  const landed = PIXELS.filter((_, i) => staggered(i, PIXELS.length, t, 0.6) >= 1)
  return (
    <section className={PANEL} aria-labelledby="bm-fl">
      <h2 id="bm-fl" className={H2}>
        Pixel che volano nel piano delle feature
      </h2>
      <FlightLayer className="grid gap-3 sm:grid-cols-2">
        <div className="aspect-square w-full">
          <Plot fill width={320} height={320} xDomain={[0, 6]} yDomain={[0, 4]} ariaLabel="Immagine di 6 per 4 pixel">
            <FlightAnchor name="img" />
            <Dots data={PIXELS.map((p) => ({ x: p.img[0], y: p.img[1], cls: p.cls, id: p.id }))} />
          </Plot>
        </div>
        <div className="aspect-square w-full">
          <Plot fill width={320} height={320} xDomain={[0, 10]} yDomain={[0, 10]} ariaLabel="Piano rosso per infrarosso vicino">
            <FlightAnchor name="plane" />
            <Grid />
            <Dots data={landed.map((p) => ({ x: p.plane[0], y: p.plane[1], cls: p.cls, id: p.id }))} />
            <Axis side="bottom" symbol="rosso" />
            <Axis side="left" symbol="NIR" />
          </Plot>
        </div>
        <FlightMarks flights={PIXELS.map((p, i) => ({ id: p.id, from: { anchor: 'img', at: p.img }, to: { anchor: 'plane', at: p.plane }, t: staggered(i, PIXELS.length, t, 0.6), cls: p.cls }))} />
      </FlightLayer>
      <div className="flex flex-wrap items-center gap-3">
        <ActionButton variant="primary" onClick={start}>
          Riproduci
        </ActionButton>
        <Readout label="Pixel nel piano" value={`${landed.length} su ${PIXELS.length}`} />
      </div>
      <MatrixGrid
        values={[
          [0.5, 0.25],
          [0.25, { n: 17, d: 48 }],
        ]}
        label="Somma dei prodotti esterni"
        symbol="\Sigma ="
        mode="fraction"
        symmetric
        ghost={{ values: [[0.125, -0.0625], [-0.0625, 0.03125]], t, from: [120, -160] }}
      />
    </section>
  )
}

export default function ManiglieESegni() {
  return (
    <div className="grid gap-4 @4xl:grid-cols-2">
      <OneD />
      <TwoD />
      <Signals />
      <Drawing />
      <Sorting />
      <Flights />
    </div>
  )
}
