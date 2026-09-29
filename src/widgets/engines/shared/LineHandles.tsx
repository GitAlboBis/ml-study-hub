// Retta a due maniglie dentro un <Plot>: la retta di separazione del classificatore lineare, la soglia obliqua,
// una direzione da disegnare a mano. Due punti p e q trascinabili (e da tastiera, come cursori a due assi) e, se
// richiesto, una maniglia a metà che trasla la retta intera; la retta prosegue fino alla cornice.
//
// - La forma normale w·x + b = 0 (handleMath.lineThrough) sta nella lettura: w punta a sinistra del verso p → q.
//   `normal` disegna la freccia di w dal punto medio: il lato positivo si vede, non si indovina.
// - `axis` vincola le maniglie: 'y' fa di due maniglie agli estremi una soglia orizzontale inclinabile, 'x' una
//   verticale.
// - Tastiera su ogni maniglia: frecce un passo, Maiusc dieci; Inizio e Fine gli estremi dell'asse x.
// - Moto: nessuno.
import { format } from 'd3'
import { Arrow } from '../../kit/plot/Arrow'
import { roleVar, type VizRole } from '../../kit/plot/colors'
import { classVar } from '../../kit/plot/marks'
import { usePlot } from '../../kit/plot/Plot'
import { DragHandle } from './DragHandle'
import { clipLineToBox, lineThrough, tidy } from './handleMath'
import type { Vec2 } from './math/types'

export interface LineHandlesProps {
  p: Vec2
  q: Vec2
  onChange: (p: Vec2, q: Vec2) => void
  /** nome della retta per chi ascolta: "Retta di separazione" */
  label: string
  /** nomi delle due maniglie; predefiniti "<label>: primo punto" e "secondo punto" */
  names?: readonly [string, string]
  /** la retta intera fino alla cornice (predefinito) o il solo segmento fra p e q */
  extend?: boolean
  /** maniglia a metà che trasla la retta senza ruotarla */
  translate?: boolean
  /** freccia della normale w dal punto medio, lunga `length` (dominio x); `label` accanto alla punta */
  normal?: { length?: number; label?: string }
  /** vincolo delle maniglie; predefinito 'xy' */
  axis?: 'xy' | 'x' | 'y'
  /** passo della tastiera nel dominio, uno o [x, y]; predefinito un cinquantesimo del dominio */
  step?: number | readonly [number, number]
  role?: VizRole
  cls?: number
  format?: (v: number) => string
  onDragState?: (dragging: boolean) => void
  disabled?: boolean
}

const compact = format('.3~g')

export function LineHandles({ p, q, onChange, label, names, extend = true, translate = false, normal, axis = 'xy', step, role = 'boundary', cls, format: fmt = compact, onDragState, disabled = false }: LineHandlesProps) {
  const { x, y, clipPath } = usePlot()
  const [xa, xb] = x.domain()
  const [ya, yb] = y.domain()
  const xMin = Math.min(xa, xb)
  const xMax = Math.max(xa, xb)
  const yMin = Math.min(ya, yb)
  const yMax = Math.max(ya, yb)
  const [sx, sy] = typeof step === 'number' ? [step, step] : (step ?? [(xMax - xMin) / 50, (yMax - yMin) / 50])
  const color = cls !== undefined ? classVar(cls) : roleVar(role)
  const nf = lineThrough(p, q)
  const seg = extend ? clipLineToBox(p, q, [xMin, xMax], [yMin, yMax]) : ([p, q] as [Vec2, Vec2])
  const mid: Vec2 = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  const say = (v: Vec2) => `(${fmt(v[0])}, ${fmt(v[1])})`
  const lineText = nf === null ? 'i due punti coincidono: nessuna retta' : `w = ${say(nf.w)}, b = ${fmt(nf.b)}, inclinazione ${fmt(nf.angle)}°`

  const inside = (v: Vec2): Vec2 => [tidy(Math.min(Math.max(v[0], xMin), xMax)), tidy(Math.min(Math.max(v[1], yMin), yMax))]
  const constrain = (from: Vec2, to: Vec2): Vec2 => inside([axis === 'y' ? from[0] : to[0], axis === 'x' ? from[1] : to[1]])

  /** Nuova posizione di una maniglia dopo un tasto; null se il tasto non la riguarda. */
  const keyMove = (v: Vec2, key: string, shift: boolean): Vec2 | null => {
    const big = shift ? 10 : 1
    const vertical = key === 'ArrowUp' || key === 'ArrowDown'
    const along = key === 'ArrowRight' || key === 'ArrowUp' ? 1 : key === 'ArrowLeft' || key === 'ArrowDown' ? -1 : 0
    if (along !== 0) {
      // con un solo asse libero ogni freccia muove lungo quello
      if (axis === 'x' || (axis === 'xy' && !vertical)) return constrain(v, [v[0] + along * sx * big, v[1]])
      return constrain(v, [v[0], v[1] + along * sy * big])
    }
    if (key === 'Home') return constrain(v, axis === 'y' ? [v[0], yMin] : [xMin, v[1]])
    if (key === 'End') return constrain(v, axis === 'y' ? [v[0], yMax] : [xMax, v[1]])
    return null
  }

  const handle = (which: 'p' | 'q', at: Vec2, name: string) => (
    <DragHandle
      key={which}
      px={x(at[0])}
      py={y(at[1])}
      name={`line-${which}`}
      label={name}
      valueText={`${say(at)}; ${lineText}`}
      valueNow={axis === 'y' ? at[1] : at[0]}
      valueMin={axis === 'y' ? yMin : xMin}
      valueMax={axis === 'y' ? yMax : xMax}
      orientation={axis === 'y' ? 'vertical' : 'horizontal'}
      disabled={disabled}
      tip={{ value: say(at), label: name }}
      onDragState={onDragState}
      onDragTo={(dx, dy) => {
        const next = constrain(at, [dx, dy])
        if (next[0] === at[0] && next[1] === at[1]) return
        if (which === 'p') onChange(next, q)
        else onChange(p, next)
      }}
      onKey={(key, shift) => {
        const next = keyMove(at, key, shift)
        if (next === null) return false
        if (which === 'p') onChange(next, q)
        else onChange(p, next)
        return true
      }}
    >
      <circle r={20} fill="transparent" />
      <circle r={6.5} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} />
    </DragHandle>
  )

  const shift = (d: Vec2) => {
    // la traslazione si ferma alla cornice per tutti e due i punti insieme: la retta non si deforma sul bordo
    const lo0 = xMin - Math.min(p[0], q[0])
    const hi0 = xMax - Math.max(p[0], q[0])
    const lo1 = yMin - Math.min(p[1], q[1])
    const hi1 = yMax - Math.max(p[1], q[1])
    const dx = axis === 'y' ? 0 : Math.min(Math.max(d[0], lo0), hi0)
    const dy = axis === 'x' ? 0 : Math.min(Math.max(d[1], lo1), hi1)
    if (dx === 0 && dy === 0) return
    onChange([tidy(p[0] + dx), tidy(p[1] + dy)], [tidy(q[0] + dx), tidy(q[1] + dy)])
  }

  const nLen = normal?.length ?? (xMax - xMin) / 8
  return (
    <g data-line-handles="">
      {seg !== null ? (
        <line x1={x(seg[0][0])} y1={y(seg[0][1])} x2={x(seg[1][0])} y2={y(seg[1][1])} stroke={color} strokeWidth={2} strokeLinecap="round" clipPath={clipPath} pointerEvents="none" />
      ) : null}
      {normal !== undefined && nf !== null ? <Arrow from={mid} to={[mid[0] + nf.w[0] * nLen, mid[1] + nf.w[1] * nLen]} role={role} cls={cls} label={normal.label} /> : null}
      {translate ? (
        <DragHandle
          px={x(mid[0])}
          py={y(mid[1])}
          name="line-mid"
          label={`${label}: sposta la retta intera`}
          valueText={`punto medio ${say(mid)}; ${lineText}`}
          valueNow={mid[0]}
          valueMin={xMin}
          valueMax={xMax}
          disabled={disabled}
          tip={{ value: say(mid), label }}
          onDragState={onDragState}
          onDragTo={(dx, dy) => shift([dx - mid[0], dy - mid[1]])}
          onKey={(key, sh) => {
            const next = keyMove(mid, key, sh)
            if (next === null) return false
            shift([next[0] - mid[0], next[1] - mid[1]])
            return true
          }}
        >
          <circle r={20} fill="transparent" />
          <rect x={-5.5} y={-5.5} width={11} height={11} fill="var(--surface)" stroke="var(--pin-contrast)" strokeWidth={2} />
        </DragHandle>
      ) : null}
      {handle('p', p, names?.[0] ?? `${label}: primo punto`)}
      {handle('q', q, names?.[1] ?? `${label}: secondo punto`)}
    </g>
  )
}
