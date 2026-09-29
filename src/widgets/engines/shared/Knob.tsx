// Manopola angolare: la direzione w della proiezione, l'angolo di rotazione di Σ, l'azimut della camera 3D.
// Due pezzi:
// - `Knob`: il comando nei comandi del widget (fuori dal Plot). Un quadrante con l'ago, il settore dell'angolo
//   letto da 0°, lo spillo ocra sulla punta. Tastiera come uno slider circolare (handleMath.knobKey): frecce
//   destra/su +passo (verso antiorario), sinistra/giù −passo, Maiusc e Pag il passo grande, Inizio e Fine gli
//   estremi; il puntatore trascina l'ago intorno al centro.
// - `AngleHandle`: la stessa cosa dentro il terreno, una maniglia sulla punta di una freccia che ruota attorno a
//   un centro (la punta di w, l'autovettore). L'angolo si misura nel DOMINIO: con assi di unità diverse l'angolo
//   sullo schermo è un altro, ma w = (cos θ, sin θ) resta quello dei dati.
//
// `axial`: una retta non ha verso, θ e θ + 180° sono la stessa direzione. Il periodo diventa 180°, l'ago è un
// diametro (spillo su un capo, anello sull'altro) e il puntatore dall'altra parte legge lo stesso angolo.
// Angoli in gradi, antiorari, 0 = asse x positivo.
//
// Moto: nessuno. La manopola si usa spesso e da tastiera: l'ago segue la mano (WIDGET_GUIDE §4).
import { useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { M } from '../../../components/content/M'
import { typographic } from '../../kit/format'
import { roleVar, type VizRole } from '../../kit/plot/colors'
import { usePlot } from '../../kit/plot/Plot'
import { DragHandle } from './DragHandle'
import { knobKey, knobValue, pointerAngle, tidy, type KnobRange } from './handleMath'
import type { Vec2 } from './math/types'

export interface KnobProps {
  /** id del controllo (unico nella pagina) */
  id: string
  /** nome in parole: "Direzione della retta θ" */
  label: string
  /** simbolo in LaTeX davanti all'etichetta, decorativo: '\\theta' */
  latex?: string
  /** angolo in gradi */
  value: number
  onChange: (deg: number) => void
  /** θ e θ + 180° identici: periodo 180° */
  axial?: boolean
  /** estremi; predefiniti 0 e 360 (180 se assiale) */
  min?: number
  max?: number
  /** passo in gradi; predefinito 1 */
  step?: number
  /** passo di Maiusc e Pag; predefinito il più grande fra step e 15° */
  bigStep?: number
  /** il giro si richiude (predefinito); false: si ferma agli estremi */
  wrap?: boolean
  /** testo del valore; predefinito "45°" */
  format?: (deg: number) => string
  /** lato del quadrante in px; predefinito 88 (mai sotto 64: il bersaglio resta ampio) */
  size?: number
  disabled?: boolean
}

const R2 = (v: number) => Math.round(v * 100) / 100
const rad = (deg: number) => (deg * Math.PI) / 180

export function Knob({ id, label, latex, value, onChange, axial = false, min = 0, max, step = 1, bigStep, wrap = true, format, size = 88, disabled = false }: KnobProps) {
  const range: KnobRange = { min, max: max ?? min + (axial ? 180 : 360), step, bigStep, wrap }
  const v = knobValue(value, range)
  const fmt = format ?? ((d: number) => `${Number.isInteger(d) ? d : d.toFixed(1)}°`)
  const shown = typographic(fmt(v))
  const labelId = `${id}-label`
  const center = useRef<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const side = Math.max(64, size)
  const c = side / 2
  const r = c - 8
  // coordinate dello schermo: y verso il basso, quindi il seno cambia segno
  const tipAt = (deg: number, len: number): Vec2 => [R2(c + len * Math.cos(rad(deg))), R2(c - len * Math.sin(rad(deg)))]
  const tip = tipAt(v, r)
  const tail = axial ? tipAt(v + 180, r) : ([c, c] as Vec2)
  // settore dell'angolo letto da 0°: un arco sottile a metà raggio, come un goniometro (negativo: in senso orario)
  const arcR = r * 0.42
  const sweep = v
  const arcEnd = tipAt(v, arcR)
  const arcStart = tipAt(0, arcR)
  const large = Math.abs(sweep) > 180 ? 1 : 0

  const move = (clientX: number, clientY: number) => {
    const o = center.current
    if (o === null) return
    const next = pointerAngle(clientX - o.x, o.y - clientY, range)
    if (next !== v) onChange(next)
  }
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return
    // una sola lettura di geometria all'inizio del gesto; le mosse usano il centro salvato
    const box = e.currentTarget.getBoundingClientRect()
    center.current = { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    setDragging(true)
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // puntatore già rilasciato
    }
    move(e.clientX, e.clientY)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) move(e.clientX, e.clientY)
  }
  const end = () => {
    center.current = null
    setDragging(false)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return
    const next = knobKey(v, e.key, e.shiftKey, range)
    if (next === null) return
    e.preventDefault()
    if (next !== v) onChange(next)
  }

  const ticks = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <div className="grid justify-items-start gap-1">
      <div className="flex w-full items-baseline justify-between gap-3">
        <span id={labelId} className="flex min-w-0 items-baseline gap-2">
          {latex !== undefined && (
            <span aria-hidden="true" className="text-text">
              <M tex={latex} />
            </span>
          )}
          <span className="label">{label}</span>
        </span>
        <span aria-hidden="true" className="num whitespace-nowrap text-text">
          {shown}
        </span>
      </div>
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={labelId}
        aria-roledescription={axial ? 'manopola di una direzione' : 'manopola'}
        aria-valuemin={range.min}
        aria-valuemax={range.max}
        aria-valuenow={v}
        aria-valuetext={axial ? `${shown}, stessa retta di ${typographic(fmt(v + 180))}` : shown}
        aria-disabled={disabled || undefined}
        data-knob=""
        className={`relative rounded-full select-none ${disabled ? 'cursor-not-allowed opacity-45' : dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ width: side, height: side, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onKeyDown}
      >
        <svg aria-hidden="true" viewBox={`0 0 ${side} ${side}`} width={side} height={side} className="block overflow-visible">
          <circle cx={c} cy={c} r={r} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={1.5} />
          {ticks.map((t) => {
            const major = t % 90 === 0
            const a = tipAt(t, r)
            const b = tipAt(t, r - (major ? 8 : 4))
            return <line key={t} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={major ? 'var(--text)' : 'var(--text-faint)'} strokeWidth={1} />
          })}
          {/* riferimento: la direzione di 0° */}
          <line x1={c} y1={c} x2={R2(c + r)} y2={c} stroke="var(--viz-grid)" strokeWidth={1} />
          {Math.abs(sweep) > 0.01 ? (
            <path d={`M${arcStart[0]},${arcStart[1]}A${R2(arcR)},${R2(arcR)} 0 ${large} ${sweep > 0 ? 0 : 1} ${arcEnd[0]},${arcEnd[1]}`} fill="none" stroke="var(--viz-boundary)" strokeOpacity={0.6} strokeWidth={1.5} />
          ) : null}
          <line x1={tail[0]} y1={tail[1]} x2={tip[0]} y2={tip[1]} stroke="var(--text)" strokeWidth={2.5} strokeLinecap="round" />
          {axial ? <circle cx={tail[0]} cy={tail[1]} r={4.5} fill="var(--surface)" stroke="var(--text)" strokeWidth={2} /> : null}
          <circle cx={c} cy={c} r={3} fill="var(--text)" />
          <circle cx={tip[0]} cy={tip[1]} r={7} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} />
        </svg>
      </div>
    </div>
  )
}

export interface AngleHandleProps {
  /** centro della rotazione, nel dominio (l'origine, la media) */
  center: Vec2
  /** angolo in gradi, misurato nel dominio */
  angle: number
  /** distanza della maniglia dal centro, nel dominio */
  radius: number
  onChange: (deg: number) => void
  /** nome accessibile: "Punta di w" */
  label: string
  axial?: boolean
  min?: number
  max?: number
  step?: number
  bigStep?: number
  wrap?: boolean
  format?: (deg: number) => string
  /** l'orbita della maniglia, un filo sottile, anche da ferma (sempre visibile mentre si trascina) */
  ring?: boolean
  /**
   * La punta si allunga anche (la lunghezza di w, ‖w‖): trascinando cambiano insieme angolo e distanza dal centro,
   * tenuta in `radiusRange`. Solo con il puntatore: da tastiera le frecce ruotano, la lunghezza ha il suo cursore
   * nei comandi del motore (due grandezze su un solo tasto non si scoprono).
   */
  onRadiusChange?: (radius: number) => void
  radiusRange?: readonly [number, number]
  role?: VizRole
  onDragState?: (dragging: boolean) => void
  disabled?: boolean
}

export function AngleHandle({ center, angle, radius, onChange, label, axial = false, min = 0, max, step = 1, bigStep, wrap = true, format, ring = false, onRadiusChange, radiusRange, role = 'boundary', onDragState, disabled = false }: AngleHandleProps) {
  const { x, y, clipPath } = usePlot()
  const uid = useId()
  const [dragging, setDragging] = useState(false)
  const range: KnobRange = { min, max: max ?? min + (axial ? 180 : 360), step, bigStep, wrap }
  const v = knobValue(angle, range)
  const fmt = format ?? ((d: number) => `${Number.isInteger(d) ? d : d.toFixed(1)}°`)
  const shown = typographic(fmt(v))
  const at: Vec2 = [center[0] + radius * Math.cos(rad(v)), center[1] + radius * Math.sin(rad(v))]

  // orbita: nel dominio è un cerchio, sullo schermo un'ellisse se gli assi hanno unità diverse
  const orbit = (() => {
    let d = ''
    for (let i = 0; i <= 72; i++) {
      const t = (2 * Math.PI * i) / 72
      d += `${i === 0 ? 'M' : 'L'}${R2(x(center[0] + radius * Math.cos(t)))},${R2(y(center[1] + radius * Math.sin(t)))}`
    }
    return d
  })()

  return (
    <g data-angle-handle={uid}>
      {ring || dragging ? <path d={orbit} fill="none" stroke={roleVar(role)} strokeOpacity={0.35} strokeWidth={1} clipPath={clipPath} pointerEvents="none" /> : null}
      <DragHandle
        px={x(at[0])}
        py={y(at[1])}
        name="angle"
        label={label}
        valueText={shown}
        valueNow={v}
        valueMin={range.min}
        valueMax={range.max}
        roleDescription={axial ? 'maniglia di una direzione' : 'maniglia angolare'}
        disabled={disabled}
        tip={{ value: shown, label }}
        onDragState={(d) => {
          setDragging(d)
          onDragState?.(d)
        }}
        onDragTo={(dx, dy) => {
          const next = pointerAngle(dx - center[0], dy - center[1], range)
          if (next !== v) onChange(next)
          if (onRadiusChange !== undefined) {
            const [r0, r1] = radiusRange ?? [0, Number.POSITIVE_INFINITY]
            const r = tidy(Math.min(Math.max(Math.hypot(dx - center[0], dy - center[1]), r0), r1))
            if (r !== radius) onRadiusChange(r)
          }
        }}
        onKey={(key, shift) => {
          const next = knobKey(v, key, shift, range)
          if (next === null) return false
          if (next !== v) onChange(next)
          return true
        }}
      >
        <circle r={20} fill="transparent" />
        <circle r={7} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} />
      </DragHandle>
    </g>
  )
}
