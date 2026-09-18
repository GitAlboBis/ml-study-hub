// Segni del terreno condivisi dai widget del foglio m09 su bias, varianza e consistenza, disegnati dentro un
// <Plot> del kit (leggono scale e ritaglio con usePlot). Solo ciò che il kit non ha: la banda fra due curve,
// il pettine di aghi di una stima con h minuscolo, le linee di riferimento con etichetta a inchiostro.
// Colori solo da token (ruoli --viz-*); il tratteggio è riservato alla verità a terra. Nessun moto qui.
import { area, line } from 'd3'
import { usePlot } from '../../kit/plot/Plot'

const n2 = (v: number) => Number(v.toFixed(2))

/** Banda fra lo(x) e hi(x): la velatura della dispersione di una stima (media ± 2 deviazioni standard). */
export function BandPath({ xs, lo, hi, color = 'var(--viz-kernel)', opacity = 0.22 }: { xs: readonly number[]; lo: readonly number[]; hi: readonly number[]; color?: string; opacity?: number }) {
  const { x, y, clipPath } = usePlot()
  const idx = xs.map((_, i) => i).filter((i) => Number.isFinite(lo[i]) && Number.isFinite(hi[i]))
  const d =
    area<number>()
      .x((i) => n2(x(xs[i])))
      .y0((i) => n2(y(lo[i])))
      .y1((i) => n2(y(hi[i])))(idx) ?? ''
  return (
    <g data-band="" clipPath={clipPath} pointerEvents="none">
      <path d={d} fill={color} fillOpacity={opacity} stroke="none" />
    </g>
  )
}

/**
 * Pettine di aghi: la stima quando la finestra è più stretta della distanza fra i campioni. Ogni ago è alto
 * quanto la sua campana; quelli oltre la cornice finiscono con una punta a inchiostro ("fuori scala").
 */
export function Needles({ at, color = 'var(--viz-estimate)', width = 1.5 }: { at: readonly { x: number; h: number }[]; color?: string; width?: number }) {
  const { x, y, clipPath } = usePlot()
  const [lo, hi] = y.domain()
  const top = Math.max(lo, hi)
  let d = ''
  let over = ''
  for (const a of at) {
    const px = n2(x(a.x))
    d += `M${px},${n2(y(0))}V${n2(y(Math.min(a.h, top)))}`
    if (a.h > top) over += `M${px},-1l-4,6h8z`
  }
  return (
    <g data-needles="" pointerEvents="none">
      <g clipPath={clipPath}>
        <path d={d} stroke={color} strokeWidth={width} fill="none" />
      </g>
      {over !== '' ? <path d={over} fill="var(--text)" /> : null}
    </g>
  )
}

export interface RefLineProps {
  /** verticale in x (dominio) */
  x?: number
  /** orizzontale in y (dominio) */
  y?: number
  label?: string
  dashed?: boolean
  color?: string
  width?: number
  /** dove stare l'etichetta rispetto alla linea */
  anchor?: 'start' | 'end'
  /** quota (in px dall'alto) dell'etichetta di una verticale */
  labelY?: number
}

/** Linea di riferimento con etichetta a inchiostro e alone di superficie, come i toponimi. */
export function RefLine({ x: at, y: yAt, label, dashed = false, color = 'var(--viz-boundary)', width = 1.5, anchor = 'start', labelY = 14 }: RefLineProps) {
  const { x, y, innerWidth, innerHeight, clipPath } = usePlot()
  const vertical = at !== undefined
  const p = vertical ? x(at) : y(yAt ?? 0)
  if (!Number.isFinite(p) || p < -1 || p > (vertical ? innerWidth : innerHeight) + 1) return null
  const text = label ? (
    <text
      className="num"
      fontSize={11}
      fontWeight={600}
      x={vertical ? p + (anchor === 'start' ? 5 : -5) : anchor === 'start' ? 6 : innerWidth - 6}
      y={vertical ? labelY : p - 5}
      textAnchor={anchor}
      fill="var(--text)"
      stroke="var(--surface)"
      strokeWidth={3}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {label}
    </text>
  ) : null
  return (
    <g pointerEvents="none">
      <g clipPath={clipPath}>
        {vertical ? (
          <line x1={p} x2={p} y1={0} y2={innerHeight} stroke={color} strokeWidth={width} strokeDasharray={dashed ? '6 4' : undefined} />
        ) : (
          <line x1={0} x2={innerWidth} y1={p} y2={p} stroke={color} strokeWidth={width} strokeDasharray={dashed ? '6 4' : undefined} />
        )}
      </g>
      {text}
    </g>
  )
}

/** Punto su una curva (lettura del valore corrente): anello di superficie, colore del ruolo o della classe. */
export function PointMark({ x: px, y: py, color, r = 4.5 }: { x: number; y: number; color: string; r?: number }) {
  const { x, y } = usePlot()
  const cx = x(px)
  const cy = y(py)
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null
  return <circle cx={n2(cx)} cy={n2(cy)} r={r} fill={color} stroke="var(--surface)" strokeWidth={2} pointerEvents="none" />
}

/** Polilinea libera nel dominio (per le curve che non sono funzioni di x, o per spezzate semplici). */
export function Polyline({ pts, color, width = 2, opacity = 1 }: { pts: readonly (readonly [number, number])[]; color: string; width?: number; opacity?: number }) {
  const { x, y, clipPath } = usePlot()
  const d =
    line<readonly [number, number]>()
      .defined((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
      .x((p) => n2(x(p[0])))
      .y((p) => n2(y(p[1])))([...pts]) ?? ''
  return (
    <g clipPath={clipPath} pointerEvents="none">
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeOpacity={opacity} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  )
}
