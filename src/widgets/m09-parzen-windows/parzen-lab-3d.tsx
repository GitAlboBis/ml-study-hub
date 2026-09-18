// La superficie a reticolo in assonometria per i widget 2-D del foglio m09 (δ(x) e le tre stime sui cinque campioni):
// la figura delle slide p56-p57, in scala di grigi come nella slide, in SVG perché erediti i token e il tema.
//
// ROTAZIONE. La vista ruota attorno all'asse verticale trascinando con il puntatore, oppure da tastiera con le
// frecce (15° a pressione): la figura è un role="slider" sull'azimut, con il valore letto a voce. Nessuna animazione:
// la vista segue la mano. La geometria (proiezione, reticolo) è in wireframe.ts, con i test.
import { useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { fit, mesh, project, rotate } from './wireframe'
import type { View } from './wireframe'

const n2 = (v: number) => Number(v.toFixed(1))

export interface SurfaceMark {
  x: number
  y: number
  z: number
  label: string
  /** spillo ocra (il picco, il punto sotto il cursore) invece del puntino a inchiostro */
  pin?: boolean
}

export interface Wireframe3dProps {
  f: (x: number, y: number) => number
  xDomain: readonly [number, number]
  yDomain: readonly [number, number]
  /** quota della cima della figura: ciò che la supera si ferma lì */
  zTop: number
  azimuth: number
  onRotate: (azimuth: number) => void
  elevation?: number
  width?: number
  height?: number
  /** linee del reticolo per direzione */
  lines?: number
  label: string
  description?: string
  /** nomi degli assi della base */
  xLabel?: string
  yLabel?: string
  marks?: readonly SurfaceMark[]
  /** al posto della superficie, la freccia verticale della delta di Dirac nell'origine */
  dirac?: boolean
}

export function Wireframe3d({ f, xDomain, yDomain, zTop, azimuth, onRotate, elevation = 28, width = 420, height = 300, lines = 25, label, description, xLabel, yLabel, marks = [], dirac = false }: Wireframe3dProps) {
  const view: View = { azimuth, elevation }
  const box = { width, height, pad: 14 }
  const m = mesh(f, xDomain, yDomain, zTop, view, box, lines, 2 * lines - 1)
  const place = fit(view, box)
  const toU = (x: number) => (2 * (x - xDomain[0])) / (xDomain[1] - xDomain[0]) - 1
  const toV = (y: number) => (2 * (y - yDomain[0])) / (yDomain[1] - yDomain[0]) - 1
  const P = (x: number, y: number, z: number) => place(project(toU(x), toV(y), Math.min(1, Math.max(0, z / zTop)), view))
  const drag = useRef<{ id: number; x: number; az: number } | null>(null)

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onRotate(rotate(azimuth, -15))
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onRotate(rotate(azimuth, 15))
    else if (e.key === 'Home') onRotate(0)
    else return
    e.preventDefault()
  }
  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    drag.current = { id: e.pointerId, x: e.clientX, az: azimuth }
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // puntatore già rilasciato
    }
  }
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (d === null || d.id !== e.pointerId) return
    onRotate(rotate(d.az, (e.clientX - d.x) * 0.6))
  }
  const onUp = () => {
    drag.current = null
  }

  const path = (pts: [number, number][]) => `M${pts.map((p) => `${n2(p[0])},${n2(p[1])}`).join('L')}`
  const [b0, b1, , b3] = m.base
  const origin = P((xDomain[0] + xDomain[1]) / 2, (yDomain[0] + yDomain[1]) / 2, 0)
  const originTop = P((xDomain[0] + xDomain[1]) / 2, (yDomain[0] + yDomain[1]) / 2, zTop)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block h-full w-full touch-none select-none"
      tabIndex={0}
      role="slider"
      aria-label={label}
      aria-roledescription="vista 3-D ruotabile"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={Math.round(azimuth)}
      aria-valuetext={`rotazione ${Math.round(azimuth)} gradi`}
      style={{ cursor: 'grab' }}
      onKeyDown={onKey}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {description !== undefined ? <desc>{description}</desc> : null}
      <path d={`${path(m.base)}Z`} fill="var(--surface-2)" stroke="var(--viz-axis)" strokeWidth={1} />
      {dirac ? (
        <g data-dirac="">
          <line x1={n2(origin[0])} y1={n2(origin[1])} x2={n2(originTop[0])} y2={n2(originTop[1] + 10)} stroke="var(--text)" strokeWidth={2.5} />
          <path d={`M${n2(originTop[0])},${n2(originTop[1])}l-6,12h12z`} fill="var(--text)" />
        </g>
      ) : (
        <g data-mesh="" fill="none" stroke="var(--text-muted)" strokeWidth={0.8} strokeOpacity={0.85} strokeLinejoin="round">
          {m.lines.map((l, i) => (
            <path key={i} d={path(l)} />
          ))}
        </g>
      )}
      {xLabel !== undefined ? (
        <text className="num" x={n2((b0[0] + b1[0]) / 2)} y={n2((b0[1] + b1[1]) / 2 + 14)} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
          {xLabel}
        </text>
      ) : null}
      {yLabel !== undefined ? (
        <text className="num" x={n2((b0[0] + b3[0]) / 2 - 6)} y={n2((b0[1] + b3[1]) / 2 + 12)} textAnchor="end" fontSize={11} fill="var(--text-muted)">
          {yLabel}
        </text>
      ) : null}
      {marks.map((mk, i) => {
        const [px, py] = P(mk.x, mk.y, mk.z)
        return (
          <g key={i} data-surface-mark="">
            {mk.pin ? (
              <rect x={n2(px) - 4.5} y={n2(py) - 4.5} width={9} height={9} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.25} transform={`rotate(45 ${n2(px)} ${n2(py)})`} />
            ) : (
              <circle cx={n2(px)} cy={n2(py)} r={3} fill="var(--viz-sample)" stroke="var(--surface)" strokeWidth={1.5} />
            )}
            {mk.label !== '' ? (
              <text className="num" x={n2(px + 8)} y={n2(py - 6)} fontSize={12} fontWeight={600} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
                {mk.label}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
