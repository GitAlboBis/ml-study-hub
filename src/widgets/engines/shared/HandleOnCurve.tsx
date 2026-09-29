// Maniglia vincolata a una curva, dentro un <Plot>: il picco e il fianco di una campana (μ e μ + σ), la θ
// candidata sulla verosimiglianza, il punto che scorre su una frontiera. Il segno sta SEMPRE sulla curva; si
// trascina lungo di essa e restituisce il parametro, non il punto.
//
// Due modi:
// - `f`: curva y = f(x). La maniglia scorre in orizzontale e il valore è l'ascissa. Quando la curva cambia (il
//   parametro che la maniglia muove cambia la curva stessa) la maniglia la segue: si ridisegna su f(valore).
// - `at`: curva parametrica t ↦ (x, y) nel dominio, con t in `range`. Il valore è t; trascinando si prende il t
//   del punto della curva più vicino al puntatore, misurato in pixel (handleMath.nearestParam).
// Tastiera: frecce un passo (o al valore d'aggancio successivo), Maiusc e Pag dieci passi, Inizio e Fine gli estremi.
// Moto: nessuno.
import { format } from 'd3'
import { roleVar, type VizRole } from '../../kit/plot/colors'
import { classMarker } from '../../kit/plot/marks'
import { usePlot } from '../../kit/plot/Plot'
import { DragHandle } from './DragHandle'
import { nearestParam, sliderKey, snapValue, tidy } from './handleMath'

export interface HandleOnCurveProps {
  /** ascissa (modo `f`) o parametro t (modo `at`) della maniglia */
  value: number
  onChange: (value: number) => void
  /** nome accessibile: "Picco della campana: media μ" */
  label: string
  /** curva y = f(x) */
  f?: (x: number) => number
  /** curva parametrica t ↦ (x, y) nel dominio; vince su `f` */
  at?: (t: number) => readonly [number, number]
  /** intervallo del valore; predefinito il dominio x (obbligatorio con `at`) */
  range?: readonly [number, number]
  /** passo della tastiera e griglia d'aggancio; predefinito un centesimo dell'intervallo */
  step?: number
  /** valori a cui agganciarsi (quelli della slide) */
  snaps?: readonly number[]
  /** testo del valore per lettura e lettori di schermo; predefinito "x = …" */
  valueText?: (value: number, point: readonly [number, number]) => string
  /** 'pin': lo spillo ocra, per la maniglia principale; 'ring': anello aperto, per quelle secondarie (il fianco) */
  kind?: 'pin' | 'ring'
  /** maniglia di una classe: forma e colore della classe */
  cls?: number
  /** verticale sottile fino all'asse delle ascisse (dove cade il valore) */
  guide?: boolean
  /** colore della guida e dell'anello; predefinito 'boundary' */
  role?: VizRole
  onDragState?: (dragging: boolean) => void
  disabled?: boolean
}

const compact = format('.3~g')

export function HandleOnCurve({ value, onChange, label, f, at, range, step, snaps, valueText, kind = 'pin', cls, guide = false, role = 'boundary', onDragState, disabled = false }: HandleOnCurveProps) {
  const { x, y, innerHeight, clipPath } = usePlot()
  const [xa, xb] = x.domain()
  const lo = range?.[0] ?? Math.min(xa, xb)
  const hi = range?.[1] ?? Math.max(xa, xb)
  const v = Math.min(Math.max(value, lo), hi)
  const point: readonly [number, number] = at !== undefined ? at(v) : [v, f !== undefined ? f(v) : 0]
  const px = x(point[0])
  // una curva che esce dal tetto del grafico (un picco fuori scala) tiene la maniglia sul bordo: resta da prendere
  const py = Math.min(Math.max(y(point[1]), 0), innerHeight)
  const text = valueText?.(v, point) ?? `x = ${compact(point[0])}`

  const settle = (raw: number) => {
    const inside = Math.min(Math.max(raw, lo), hi)
    const snapped = snaps && snaps.length > 0 ? snapValue(inside, { snaps }) : step !== undefined ? snapValue(inside, { step, min: lo }) : tidy(inside)
    return Math.min(Math.max(snapped, lo), hi)
  }
  const onDragTo = (dx: number, dy: number) => {
    let raw: number
    if (at !== undefined) {
      // vicinanza in pixel: una curva nel dominio con assi di unità diverse va misurata sullo schermo
      raw = nearestParam((t) => {
        const p = at(t)
        return [x(p[0]), y(p[1])]
      }, lo, hi, x(dx), y(dy))
    } else raw = dx
    const next = settle(raw)
    if (next !== value) onChange(next)
  }

  const yBase = Math.max(...y.range())
  const mark =
    cls !== undefined ? (
      <path {...classMarker(cls, Math.PI * 7 * 7)} />
    ) : kind === 'pin' ? (
      <rect x={-6} y={-6} width={12} height={12} transform="rotate(45)" fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} />
    ) : (
      <circle r={6} fill="var(--surface)" stroke={roleVar(role)} strokeWidth={2.5} />
    )

  return (
    <g data-handle-on-curve="">
      {guide && Number.isFinite(py) ? (
        <line x1={px} x2={px} y1={py} y2={yBase} stroke={roleVar(role)} strokeOpacity={0.55} strokeWidth={1} shapeRendering="crispEdges" clipPath={clipPath} pointerEvents="none" />
      ) : null}
      {Number.isFinite(px) && Number.isFinite(py) ? (
        <DragHandle
          px={px}
          py={py}
          name="on-curve"
          label={label}
          valueText={text}
          valueNow={v}
          valueMin={lo}
          valueMax={hi}
          disabled={disabled}
          tip={{ value: text, label }}
          onDragState={onDragState}
          onDragTo={onDragTo}
          onKey={(key, shift) => {
            const next = sliderKey(v, key, shift, { min: lo, max: hi, step: step ?? (hi - lo) / 100, snaps })
            if (next === null) return false
            if (next !== value) onChange(next)
            return true
          }}
        >
          <circle r={20} fill="transparent" />
          {mark}
        </DragHandle>
      ) : null}
    </g>
  )
}
