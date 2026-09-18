// Superficie 3-D a creste (surface.ts) in SVG: la base quadrata, le creste riempite del colore della carta dalla
// più lontana alla più vicina, gli aghi dei campioni quando la finestra è più stretta della griglia. Colori solo da
// token: filo a inchiostro, riempimento di carta, aghi del colore della stima, punte "fuori scala" a inchiostro.
// `rotatable`: la superficie ruota trascinando in orizzontale o con le frecce (ruolo slider, passo di 10°).
// Nessun moto proprio: la transizione fra due superfici la fa chi passa le quote (surface.blendGrid).
import { useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { basePath, needles as needlePaths, ridges } from './surface'
import type { Box, View } from './surface'

export interface Surface3DProps {
  z: Float64Array
  n: number
  box: Box
  view: View
  /** campioni da disegnare come aghi (quando la finestra è più stretta della griglia) e la loro altezza */
  spikes?: { samples: readonly (readonly number[])[]; peak: number; opacity?: number }
  width?: number
  height?: number
  ariaLabel: string
  /** colore del filo delle creste */
  stroke?: string
  strokeWidth?: number
  rotatable?: boolean
  onRotate?: (az: number) => void
}

const DEG = Math.PI / 180

export function Surface3D({ z, n, box, view, spikes, width = 200, height = 140, ariaLabel, stroke = 'var(--text)', strokeWidth = 0.8, rotatable = false, onRotate }: Surface3DProps) {
  const drag = useRef<{ x: number; az: number; id: number } | null>(null)
  const rs = ridges(z, n, box, view, width, height)
  const ns = spikes !== undefined ? needlePaths(spikes.samples, spikes.peak, box, view, width, height) : []
  const tips = ns.filter((s) => s.over)

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!rotatable || onRotate === undefined) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onRotate(view.az + 10 * DEG)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onRotate(view.az - 10 * DEG)
    else if (e.key === 'Home') onRotate(-0.6)
    else return
    e.preventDefault()
  }
  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!rotatable) return
    drag.current = { x: e.clientX, az: view.az, id: e.pointerId }
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // già rilasciato
    }
  }
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (d === null || d.id !== e.pointerId || onRotate === undefined) return
    onRotate(d.az + (e.clientX - d.x) * 0.012)
  }
  const onUp = (e: PointerEvent<SVGSVGElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null
  }
  const deg = Math.round(((((view.az / DEG) % 360) + 540) % 360) - 180)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role={rotatable ? 'slider' : 'img'}
      aria-label={ariaLabel}
      aria-valuemin={rotatable ? -180 : undefined}
      aria-valuemax={rotatable ? 180 : undefined}
      aria-valuenow={rotatable ? deg : undefined}
      aria-valuetext={rotatable ? `rotazione ${deg} gradi` : undefined}
      tabIndex={rotatable ? 0 : undefined}
      onKeyDown={onKey}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={rotatable ? { cursor: 'grab', touchAction: 'pan-y' } : undefined}
    >
      <path d={basePath(box, view, width, height)} fill="var(--surface-2)" stroke="var(--viz-axis)" strokeWidth={0.8} />
      <g data-ridges="">
        {rs.map((r, i) => (
          <path key={i} d={r.d} fill="var(--surface)" fillOpacity={0.92} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
        ))}
      </g>
      {ns.length > 0 ? (
        <g data-spikes="" opacity={spikes?.opacity ?? 1}>
          <path d={ns.map((s) => s.d).join('')} stroke="var(--viz-estimate)" strokeWidth={1.2} />
          {tips.length > 0 ? (
            <path
              d={tips
                .map((s) => {
                  const m = /L([\d.-]+),([\d.-]+)$/.exec(s.d)
                  return m ? `M${m[1]},${Number(m[2]) - 1}l-3,5h6z` : ''
                })
                .join('')}
              fill="var(--text)"
            />
          ) : null}
        </g>
      ) : null}
    </svg>
  )
}
