// Il terreno del widget "La cella che si espande": il piano (larghezza, luminosità) con i pesci, la cella che
// cresce da x*, i vicini che si accendono, il righello di r_K, lo spillo della stima, la mappa e le regioni.
//
// RENDER. Gli strati animati (MapCover, CellUnder, CellOver) leggono il tempo dello storyboard dal canale dei
// fotogrammi (createFrameChannel) con useSyncExternalStore: a ogni fotogramma si ridisegnano solo loro, pochi
// segni SVG. I pesci (SampleLayer, memo) e le mappe su canvas cambiano solo con i dati.
//
// MOTO. Tutto è guidato dal progresso del passo, quindi Pausa, Passo e Velocità valgono anche qui:
// - la cella cresce a velocità costante (lineare nel tempo): i vicini si accendono in ordine di distanza;
// - ogni pesce toccato emette un impulso di 220 ms (anello che si allarga e svanisce);
// - al K-esimo la cella si ferma con un colpo sul bordo (lo spessore, non il raggio: un raggio che rimbalza
//   oltre r_K mostrerebbe per un istante un (K+1)-esimo vicino dentro la cella, cioè una bugia);
// - il righello si stende e lo spillo della stima si alza con ease-out; la mappa compare con un cerchio che
//   si apre da x*.
// Con prefers-reduced-motion il progresso vale 1 a ogni passo: ogni passo mostra subito il suo stato finale,
// senza impulsi né colpi.
import { memo, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { Axis } from '../kit/plot/Axis'
import { BoundaryCanvas } from '../kit/plot/BoundaryCanvas'
import { Contours } from '../kit/plot/Contours'
import { Dots } from '../kit/plot/Dots'
import { FieldCanvas } from '../kit/plot/FieldCanvas'
import { Grid } from '../kit/plot/Grid'
import { classSymbolPath, classVar } from '../kit/plot/marks'
import { Plot, usePlot } from '../kit/plot/Plot'
import { CLASS_NAMES, MYSTERY, PULSE_MS, STEP, expansionRadius, isoDomains, litCount, spikeLength, touchTime } from './cella-knn'
import type { CellState, ClassId, Fish, FrameChannel, TrailPoint, Vec2, VoteState } from './cella-knn'

export type Mode = 'densita' | 'classificatore'

const MARGIN = { top: 22, right: 12, bottom: 46, left: 44 }
const MINI_MARGIN = { top: 8, right: 8, bottom: 30, left: 30 }
/** Tetto dello spillo della stima, in px (sui piani bassi scende al 28% dell'altezza). */
const SPIKE_PX = 64

const easeOut = (t: number) => 1 - (1 - Math.min(Math.max(t, 0), 1)) ** 3

/** Misura di un riquadro con ResizeObserver; in jsdom resta la misura di ripiego. */
function useBoxSize(fallback: { w: number; h: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(fallback)
  useLayoutEffect(() => {
    const el = ref.current
    if (el === null || typeof ResizeObserver === 'undefined') return
    const apply = (w: number, h: number) => {
      const rw = Math.round(w)
      const rh = Math.round(h)
      if (rw > 0 && rh > 0) setSize((s) => (s.w === rw && s.h === rh ? s : { w: rw, h: rh }))
    }
    const rect = el.getBoundingClientRect()
    apply(rect.width, rect.height)
    const ro = new ResizeObserver((entries) => {
      const box = entries.at(-1)?.contentRect
      if (box) apply(box.width, box.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

/**
 * Tempo dello storyboard per gli strati animati. Un passo raggiunto a storyboard fermo (Passo avanti, Passo
 * indietro, clic sulla scala dei passi) arriva con progresso 0: lì si mostra lo stato FINALE del passo, come una
 * diapositiva, altrimenti "La cella si espande" mostrerebbe una cella vuota. Una Pausa a metà passo invece
 * congela il punto in cui si era (progresso maggiore di 0).
 */
function useFrame(channel: FrameChannel, playing: boolean) {
  const f = useSyncExternalStore(channel.subscribe, channel.get, channel.get)
  return !playing && f.progress === 0 ? { index: f.index, progress: 1 } : f
}

/** Etichetta a inchiostro con alone di carta, come i toponimi: si legge sopra i campi e le curve. */
function Tag({ x, y, children, anchor = 'start', size = 12 }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; size?: number }) {
  return (
    <text className="num" x={x} y={y} fontSize={size} fontWeight={600} textAnchor={anchor} dy="0.32em" fill="var(--text)" stroke="var(--surface)" strokeWidth={3} strokeLinejoin="round" paintOrder="stroke">
      {children}
    </text>
  )
}

// --- i pesci ---

interface SampleLayerProps {
  /** i pesci che contano (la classe stimata, o tutti nel classificatore) */
  samples: readonly Fish[]
  /** i pesci presenti ma fuori dal conteggio (l'altra classe nella stima della densità): attenuati */
  others: readonly Fish[]
}

const toDots = (fish: readonly Fish[]) => fish.map((f) => ({ x: f.p[0], y: f.p[1], cls: f.cls, id: f.id, label: CLASS_NAMES[f.cls] }))

const SampleLayer = memo(function SampleLayer({ samples, others }: SampleLayerProps) {
  const active = useMemo(() => toDots(samples), [samples])
  const faded = useMemo(() => toDots(others), [others])
  return (
    <>
      {faded.length > 0 ? (
        <g opacity={0.25}>
          <Dots data={faded} r={4} />
        </g>
      ) : null}
      <Dots data={active} />
    </>
  )
})

// --- strati animati ---

interface CellLayerProps {
  channel: FrameChannel
  mode: Mode
  x: Vec2
  cell: CellState
  vote: VoteState | null
  /** durata dell'espansione a velocità 1: serve all'età degli impulsi */
  expandMs: number
  /** vicini accesi a mano ("+1 vicino"), se l'utente sta scorrendo l'espansione un campione alla volta */
  manual: number | null
  reduced: boolean
  /** lo storyboard sta andando: a storyboard fermo un passo appena raggiunto mostra il suo stato finale */
  playing: boolean
}

/** Raggio della cella e vicini accesi in questo fotogramma. */
function cellNow(cell: CellState, index: number, progress: number, manual: number | null) {
  const K = cell.K
  if (!Number.isFinite(cell.rK)) return { r: 0, lit: 0 }
  if (index < STEP.espansione) return { r: 0, lit: 0 }
  if (index > STEP.espansione) return { r: cell.rK, lit: K }
  if (manual !== null) {
    const m = Math.min(manual, K)
    return { r: m === 0 ? 0 : cell.neighbors[m - 1].distance, lit: m }
  }
  const r = expansionRadius(progress, cell.rK)
  return { r, lit: litCount(cell.neighbors, r, K) }
}

/** Sotto i pesci: il velo ocra della cella e gli aloni dei vicini accesi. */
export function CellUnder({ channel, x, cell, manual, playing }: CellLayerProps) {
  const { progress, index } = useFrame(channel, playing)
  const { x: sx, y: sy, clipPath } = usePlot()
  const { r, lit } = cellNow(cell, index, progress, manual)
  const px = sx(x[0])
  const py = sy(x[1])
  const rpx = Math.abs(sx(x[0] + r) - px)
  return (
    <g data-cell-under="" clipPath={clipPath} pointerEvents="none">
      {rpx > 0 ? <circle cx={px} cy={py} r={rpx} fill="var(--viz-highlight)" fillOpacity={0.16} /> : null}
      {cell.neighbors.slice(0, lit).map((nb) => (
        <circle key={nb.id} data-lit={nb.id} cx={sx(nb.p[0])} cy={sy(nb.p[1])} r={9.5} fill="var(--viz-highlight)" stroke="var(--pin-contrast)" strokeWidth={1} />
      ))}
    </g>
  )
}

/** Sopra i pesci: bordo della cella, impulsi, numeri d'ordine, righello, spillo, contatore, voto. */
export function CellOver({ channel, mode, x, cell, vote, expandMs, manual, reduced, playing }: CellLayerProps) {
  const { progress, index } = useFrame(channel, playing)
  const { x: sx, y: sy, clipPath } = usePlot()
  const { r, lit } = cellNow(cell, index, progress, manual)
  const K = cell.K
  const px = sx(x[0])
  const py = sy(x[1])
  const rpx = Math.abs(sx(x[0] + r) - px)
  const moving = !reduced

  // colpo sul bordo quando la cella si ferma: nel passo dopo l'espansione, per il primo 30%
  const stop = moving && index === STEP.espansione + 1 && progress < 0.3 ? Math.sin((Math.PI * progress) / 0.3) : 0

  const kth = lit > 0 ? cell.neighbors[lit - 1] : null
  const kthP = kth !== null ? kth.p : null
  const numbered = K <= 15

  // conteggi del classificatore mentre la cella cresce
  let k1 = 0
  for (const nb of cell.neighbors.slice(0, lit)) if (nb.cls === 0) k1++

  return (
    <g data-cell-over="" pointerEvents="none">
      <g clipPath={clipPath}>
        {/* bordo della cella a inchiostro con un filo di carta attorno: resta leggibile anche sulle bande scure della mappa */}
        {rpx > 0 ? (
          <g data-cell="">
            <circle cx={px} cy={py} r={rpx} fill="none" stroke="var(--surface)" strokeWidth={4.5 + 2.5 * stop} />
            <circle cx={px} cy={py} r={rpx} fill="none" stroke="var(--viz-boundary)" strokeWidth={2 + 2.5 * stop} />
          </g>
        ) : null}

        {/* impulsi dei pesci appena toccati */}
        {moving && index === STEP.espansione && manual === null
          ? cell.neighbors.slice(0, lit).map((nb) => {
              const age = (progress - touchTime(nb.distance, cell.rK)) * expandMs
              if (age < 0 || age >= PULSE_MS) return null
              const f = age / PULSE_MS
              const [nx, ny] = nb.p
              return <circle key={nb.id} cx={sx(nx)} cy={sy(ny)} r={7 + 14 * f} fill="none" stroke="var(--viz-boundary)" strokeWidth={2} strokeOpacity={0.8 * (1 - f)} />
            })
          : null}

        {/* righello di r_K (solo nella stima: è la misura che entra nella formula) */}
        {mode === 'densita' && index >= STEP.raggio && kthP !== null
          ? (() => {
              const t = index === STEP.raggio ? easeOut(progress / 0.6) : 1
              const ex = px + (sx(kthP[0]) - px) * t
              const ey = py + (sy(kthP[1]) - py) * t
              const mx = (px + ex) / 2
              const my = (py + ey) / 2
              const len = Math.hypot(ex - px, ey - py) || 1
              // etichetta di lato al righello, sempre dal lato di sotto: sopra x* si alza lo spillo della stima
              const nx = -(ey - py) / len
              const ny = (ex - px) / len
              const side = ny >= 0 ? 1 : -1
              return (
                <g data-ruler="">
                  <line x1={px} y1={py} x2={ex} y2={ey} stroke="var(--pin-contrast)" strokeWidth={4} strokeLinecap="butt" />
                  <line x1={px} y1={py} x2={ex} y2={ey} stroke="var(--pin)" strokeWidth={2} strokeLinecap="butt" />
                  {t > 0.95 ? (
                    <Tag x={mx + side * nx * 14} y={my + side * ny * 14} anchor="middle">
                      r
                      <tspan baselineShift="sub" fontSize="0.75em">
                        K
                      </tspan>
                    </Tag>
                  ) : null}
                </g>
              )
            })()
          : null}
      </g>

      {/* numeri d'ordine dei vicini; con K oltre 15 i numeri si accavallerebbero: resta solo il K-esimo, marcato K */}
      {cell.neighbors.slice(0, lit).map((nb, j) => {
        if (!numbered && j !== K - 1) return null
        const [nx, ny] = nb.p
        return (
          <Tag key={nb.id} x={sx(nx) + 9} y={sy(ny) - 10} size={11}>
            {numbered ? String(j + 1) : 'K'}
          </Tag>
        )
      })}

      {/* il voto: x* prende la classe vincente */}
      {mode === 'classificatore' && vote !== null && index >= STEP.voto ? (
        <circle data-verdict={vote.label} cx={px} cy={py} r={13} fill="none" stroke={classVar(vote.label)} strokeWidth={3.5} />
      ) : null}

      <Counter mode={mode} lit={lit} K={K} k1={k1} />
    </g>
  )
}

/** Contatore in alto a sinistra: quanti vicini ha raccolto la cella, e di che classe. */
function Counter({ mode, lit, K, k1 }: { mode: Mode; lit: number; K: number; k1: number }) {
  const text = mode === 'densita' ? `k = ${lit} di K = ${K}` : `K₁ = ${k1} · K₂ = ${lit - k1} · ${lit} di ${K}`
  const w = text.length * 7.3 + 14
  return (
    <g data-counter="" transform="translate(6,6)">
      <rect width={w} height={22} fill="var(--surface)" stroke="var(--border-strong)" />
      <text className="num" x={7} y={11} dy="0.32em" fontSize={12} fill="var(--text)">
        {text}
      </text>
    </g>
  )
}

/** Lo spillo della stima in x* e la scia lasciata dalle posizioni precedenti. */
export function EstimateSpikes({ channel, x, cell, trail, peak, reduced, playing }: { channel: FrameChannel; x: Vec2; cell: CellState; trail: readonly TrailPoint[] | null; peak: number; reduced: boolean; playing: boolean }) {
  const { progress, index } = useFrame(channel, playing)
  const { x: sx, y: sy, innerHeight } = usePlot()
  const grow = index < STEP.stima ? 0 : index === STEP.stima && !reduced ? easeOut(progress / 0.5) : 1
  // su un telefono il piano è alto meno di 200 px: lo spillo resta in proporzione
  const maxPx = Math.min(SPIKE_PX, innerHeight * 0.28)
  const spike = (px: number, py: number, p: number, t: number, key: string, faint: boolean) => {
    const len = spikeLength(p, peak, maxPx) * t
    if (len <= 0) return null
    return (
      <g key={key} data-spike={faint ? 'scia' : 'x'} opacity={faint ? 0.5 : 1}>
        <line x1={px} y1={py} x2={px} y2={py - len} stroke="var(--surface)" strokeWidth={faint ? 4 : 5} />
        <line x1={px} y1={py} x2={px} y2={py - len} stroke="var(--viz-estimate)" strokeWidth={faint ? 2 : 3} />
        <circle cx={px} cy={py - len} r={faint ? 2.5 : 3.5} fill="var(--viz-estimate)" stroke="var(--surface)" strokeWidth={1.5} />
      </g>
    )
  }
  return (
    <g data-spikes="" pointerEvents="none">
      {trail?.map((t, i) => spike(sx(t.x), sy(t.y), t.p, 1, `t${i}`, true))}
      {spike(sx(x[0]), sy(x[1]), cell.p, grow, 'x', false)}
    </g>
  )
}

/** Copertura che nasconde la mappa fuori da un cerchio che si apre da x* (ultimo passo dello storyboard). */
export function MapCover({ channel, x, lastStep, active, playing }: { channel: FrameChannel; x: Vec2; lastStep: number; active: boolean; playing: boolean }) {
  const { progress, index } = useFrame(channel, playing)
  const { x: sx, y: sy, innerWidth: w, innerHeight: h } = usePlot()
  if (!active || index !== lastStep || progress >= 1) return null
  const cx = sx(x[0])
  const cy = sy(x[1])
  const far = Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy))
  const R = far * easeOut(progress)
  const d = `M0,0H${w}V${h}H0Z` + (R > 0.5 ? `M${cx + R},${cy}A${R},${R} 0 1,0 ${cx - R},${cy}A${R},${R} 0 1,0 ${cx + R},${cy}Z` : '')
  return <path data-map-cover="" d={d} fill="var(--surface)" fillRule="evenodd" pointerEvents="none" />
}

/** L'anello della cella prevista dall'utente (modalità previsione): sottile, color acqua, con la sua etichetta. */
function GuessRing({ x, r }: { x: Vec2; r: number }) {
  const { x: sx, y: sy, clipPath } = usePlot()
  const px = sx(x[0])
  const py = sy(x[1])
  const rpx = Math.abs(sx(x[0] + r) - px)
  return (
    <g data-guess="" pointerEvents="none">
      <g clipPath={clipPath}>
        <circle cx={px} cy={py} r={rpx} fill="none" stroke="var(--surface)" strokeWidth={4} />
        <circle cx={px} cy={py} r={rpx} fill="none" stroke="var(--viz-kernel)" strokeWidth={2} />
      </g>
      <Tag x={px + rpx * Math.SQRT1_2 + 4} y={py - rpx * Math.SQRT1_2 - 6}>
        r̂
      </Tag>
    </g>
  )
}

/** I pesci misteriosi della sfida: cerchi vuoti con la lettera. Un clic ci porta x*. */
function MysteryMarks({ onPick }: { onPick: (p: Vec2) => void }) {
  const { x: sx, y: sy } = usePlot()
  return (
    <g data-mystery="" aria-hidden="true">
      {MYSTERY.map((m) => {
        const px = sx(m.p[0])
        const py = sy(m.p[1])
        return (
          <g key={m.id} transform={`translate(${px},${py})`} style={{ cursor: 'pointer' }} onClick={() => onPick(m.p)}>
            <circle r={14} fill="transparent" />
            <circle r={8} fill="var(--surface)" stroke="var(--text)" strokeWidth={2} />
            <text className="num" y={0.5} dy="0.32em" textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--text)">
              ?
            </text>
            <Tag x={11} y={-12}>
              {m.id}
            </Tag>
          </g>
        )
      })}
    </g>
  )
}

/** Un clic (non un tocco che scorre la pagina) sul piano porta x* in quel punto. */
function PlaceTarget({ onPlace }: { onPlace: (p: Vec2) => void }) {
  const { innerWidth, innerHeight, toData } = usePlot()
  const onClick = (e: MouseEvent<SVGRectElement>) => {
    const [dx, dy] = toData(e.clientX, e.clientY)
    onPlace([Number(dx.toFixed(2)), Number(dy.toFixed(2))])
  }
  return <rect data-place="" x={0} y={0} width={innerWidth} height={innerHeight} fill="transparent" style={{ cursor: 'crosshair' }} onClick={onClick} />
}

// --- il terreno principale ---

export interface TerrainProps {
  mode: Mode
  channel: FrameChannel
  samples: readonly Fish[]
  others: readonly Fish[]
  x: Vec2
  /** trascinamento e frecce su x* */
  onMove: (p: Vec2) => void
  /** gesti discreti: clic sul piano o su un pesce misterioso */
  onPlace: (p: Vec2) => void
  cell: CellState
  vote: VoteState | null
  expandMs: number
  manual: number | null
  reduced: boolean
  playing: boolean
  /** mappa della densità (con il suo tetto di colore) o regioni di decisione, se visibili */
  field: ((x: number, y: number) => number) | null
  peak: number
  classify: ((x: number, y: number) => number) | null
  /** la mappa è accesa solo dall'ultimo passo: va scoperta con il cerchio che si apre */
  reveal: boolean
  lastStep: number
  trail: readonly TrailPoint[] | null
  guess: number | null
  mystery: boolean
  ariaLabel: string
  description: string
}

export function Terrain(props: TerrainProps) {
  const { mode, channel, samples, others, x, onMove, onPlace, cell, field, peak, classify, reveal, lastStep, trail, guess, mystery, reduced, playing } = props
  const [box, size] = useBoxSize({ w: 640, h: 474 })
  const dom = isoDomains(size.w - MARGIN.left - MARGIN.right, size.h - MARGIN.top - MARGIN.bottom)
  const valueDomain = useMemo(() => [0, peak] as const, [peak])
  const pin = useMemo(() => [{ x: x[0], y: x[1], id: 'x', label: mode === 'densita' ? 'Punto x* in cui stimare la densità' : 'Pesce x* da classificare' }], [x, mode])

  return (
    <div ref={box} className="absolute inset-0">
      <Plot width={size.w} height={size.h} fill xDomain={dom.x} yDomain={dom.y} margin={MARGIN} ariaLabel={props.ariaLabel} description={props.description}>
        {/* i canvas stanno sotto tutto l'SVG; la copertura della rivelazione nasconde mappa e isolinee, non il reticolo */}
        {field !== null ? <FieldCanvas fn={field} valueDomain={valueDomain} /> : null}
        {field !== null ? <Contours fn={field} valueDomain={valueDomain} opacity={0.4} /> : null}
        {classify !== null ? <BoundaryCanvas classify={classify} resolution={80} /> : null}
        <MapCover channel={channel} x={x} lastStep={lastStep} active={reveal && !reduced} playing={playing} />
        <Grid />
        <Axis side="bottom" label="larghezza" symbol="x₁ [cm]" />
        <Axis side="left" label="luminosità" symbol="x₂" />
        <PlaceTarget onPlace={onPlace} />
        <CellUnder {...props} />
        <SampleLayer samples={samples} others={others} />
        {mode === 'densita' ? <EstimateSpikes channel={channel} x={x} cell={cell} trail={trail} peak={peak} reduced={reduced} playing={playing} /> : null}
        <CellOver {...props} />
        {guess !== null ? <GuessRing x={x} r={guess} /> : null}
        {mystery ? <MysteryMarks onPick={onPlace} /> : null}
        <Dots data={pin} draggable pin step={0.2} onDrag={(_id, nx, ny) => onMove([nx, ny])} format={(v) => v.toFixed(2)} />
      </Plot>
    </div>
  )
}

// --- il confronto K = 1 contro K grande ---

export interface MiniMapProps {
  title: ReactNode
  note: ReactNode
  samples: readonly Fish[]
  x: Vec2
  field: ((x: number, y: number) => number) | null
  peak: number
  classify: ((x: number, y: number) => number) | null
  ariaLabel: string
}

export function MiniMap({ title, note, samples, x, field, peak, classify, ariaLabel }: MiniMapProps) {
  const [box, size] = useBoxSize({ w: 320, h: 237 })
  const dom = isoDomains(size.w - MINI_MARGIN.left - MINI_MARGIN.right, size.h - MINI_MARGIN.top - MINI_MARGIN.bottom)
  const dots = useMemo(() => toDots(samples), [samples])
  const pin = useMemo(() => [{ x: x[0], y: x[1], id: 'x', label: 'x*' }], [x])
  const valueDomain = useMemo(() => [0, peak] as const, [peak])
  return (
    <figure className="m-0 grid min-w-0 content-start gap-1.5">
      <figcaption className="grid gap-0.5">
        <span className="font-label font-bold">{title}</span>
        <span className="text-[length:var(--step--1)] text-muted">{note}</span>
      </figcaption>
      <div className="relative border border-border-strong bg-bg" style={{ aspectRatio: '1.35' }}>
        <div ref={box} className="absolute inset-0">
          <Plot width={size.w} height={size.h} fill xDomain={dom.x} yDomain={dom.y} margin={MINI_MARGIN} ariaLabel={ariaLabel}>
            {field !== null ? <FieldCanvas fn={field} valueDomain={valueDomain} /> : null}
            {classify !== null ? <BoundaryCanvas classify={classify} resolution={80} /> : null}
            <Axis side="bottom" ticks={4} />
            <Axis side="left" ticks={3} />
            <Dots data={dots} r={4} />
            <Dots data={pin} pin />
          </Plot>
        </div>
      </div>
    </figure>
  )
}

// --- legenda ---

function Swatch({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="-8 -8 16 16" width={16} height={16} aria-hidden="true" className="shrink-0">
      {children}
    </svg>
  )
}

/** Legenda a tasselli: classi con forma e colore, x*, la cella, i vicini accesi, lo spillo della stima. */
export function Legend({ mode, cls, predict }: { mode: Mode; cls: ClassId; predict: boolean }) {
  const item = 'flex items-center gap-1.5'
  const classItem = (c: ClassId, faded: boolean) => (
    <li key={c} className={item} style={faded ? { opacity: 0.55 } : undefined}>
      <Swatch>
        <path d={classSymbolPath(c, 60)} fill={classVar(c)} />
      </Swatch>
      {CLASS_NAMES[c]}
      {faded ? ' (non conta)' : ''}
    </li>
  )
  return (
    <ul aria-label="Legenda" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[length:var(--step--1)] text-muted">
      {mode === 'densita' ? [classItem(cls, false), classItem(cls === 0 ? 1 : 0, true)] : [classItem(0, false), classItem(1, false)]}
      <li className={item}>
        <Swatch>
          <path d={classSymbolPath(0, 90)} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} />
        </Swatch>
        x*
      </li>
      <li className={item}>
        <Swatch>
          <circle r={6} fill="var(--viz-highlight)" fillOpacity={0.2} stroke="var(--viz-boundary)" strokeWidth={2} />
        </Swatch>
        cella
      </li>
      <li className={item}>
        <Swatch>
          <circle r={6.5} fill="var(--viz-highlight)" stroke="var(--pin-contrast)" strokeWidth={1} />
        </Swatch>
        vicini accesi
      </li>
      {mode === 'densita' ? (
        <li className={item}>
          <Swatch>
            <line x1={0} y1={7} x2={0} y2={-5} stroke="var(--viz-estimate)" strokeWidth={3} />
          </Swatch>
          stima p̂
        </li>
      ) : null}
      {predict ? (
        <li className={item}>
          <Swatch>
            <circle r={6} fill="none" stroke="var(--viz-kernel)" strokeWidth={2} />
          </Swatch>
          la tua cella
        </li>
      ) : null}
    </ul>
  )
}
