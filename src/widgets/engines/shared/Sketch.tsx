// Disegno a mano libera di una curva dentro un <Plot>: "disegna la pdf che ti aspetti", "disegna la predittiva
// p(x|X)" prima di vederla. La curva sono le altezze su punti di controllo equispaziati (sketchScore.ts, logica
// copiata e generalizzata dalla modalità "la tua ipotesi" di m03-campioni-che-rivelano-la-pdf); il pennello
// dipinge i punti che il puntatore attraversa, anche con un gesto veloce. Il punteggio lo calcola chi la usa con
// sketchScore (così decide quando: alla verifica, non a ogni tratto).
//
// TASTIERA (un solo arresto del Tab: la tela è un cursore verticale): sinistra e destra scelgono il punto di
// controllo, su e giù ne cambiano l'altezza (Maiusc e Pag dieci passi), Inizio e Fine il primo e l'ultimo punto.
// Il punto scelto ha lo spillo e la sua verticale; chi ascolta sente "x = …: altezza … (punto i di n)".
// Il tocco disegna senza far scorrere la pagina (touch-action: none sulla sola tela).
// Moto: nessuno. La curva segue il pennello.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { format } from 'd3'
import { roleVar, type VizRole } from '../../kit/plot/colors'
import { usePlot } from '../../kit/plot/Plot'
import { paintStroke, sketchKey } from './sketchScore'
import type { Vec2 } from './math/types'

export interface SketchProps {
  /** ascisse dei punti di controllo (sketchXs) */
  xs: readonly number[]
  /** altezze correnti, una per punto */
  heights: readonly number[]
  onChange: (heights: readonly number[]) => void
  /** nome accessibile della tela: "Disegna la predittiva p(x|X)" */
  label: string
  /** quota massima e minima del pennello; predefinita minima 0 */
  yMax: number
  yMin?: number
  /** passo delle frecce su e giù; predefinito un centesimo di yMax − yMin */
  step?: number
  /** colore della curva; predefinito 'kernel' (la tua ipotesi, come in m03) */
  role?: VizRole
  format?: (v: number) => string
  /** inizio e fine di un tratto (per contare i tentativi, per mettere in pausa un racconto) */
  onStroke?: (phase: 'start' | 'end') => void
  disabled?: boolean
}

const compact = format('.3~g')
const n2 = (v: number) => Number(v.toFixed(2))

export function Sketch({ xs, heights, onChange, label, yMax, yMin = 0, step, role = 'kernel', format: fmt = compact, onStroke, disabled = false }: SketchProps) {
  const { x, y, innerWidth, innerHeight, toData, clipPath, registerInteractive } = usePlot()
  const [index, setIndex] = useState(() => Math.floor(xs.length / 2))
  const [focused, setFocused] = useState(false)
  const stroke = useRef<{ pointerId: number; last: Vec2 } | null>(null)
  const i = Math.min(Math.max(index, 0), xs.length - 1)
  const keyStep = step ?? (yMax - yMin) / 100

  useEffect(() => (disabled ? undefined : registerInteractive()), [disabled, registerInteractive])

  // l'ultimo disegno, anche se il genitore non ha ancora ridisegnato: due mosse del puntatore nello stesso
  // fotogramma non si cancellano a vicenda
  const latest = useRef(heights)
  useLayoutEffect(() => {
    latest.current = heights
  }, [heights])
  const paint = (from: Vec2 | null, to: Vec2) => {
    const before = latest.current
    const next = paintStroke(xs, before, from, to, yMin, yMax)
    if (!next.some((h, k) => h !== before[k])) return
    latest.current = next
    onChange(next)
  }
  const onPointerDown = (e: PointerEvent<SVGRectElement>) => {
    if (disabled || e.button !== 0) return
    const [dx, dy] = toData(e.clientX, e.clientY)
    stroke.current = { pointerId: e.pointerId, last: [dx, dy] }
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // puntatore già rilasciato
    }
    onStroke?.('start')
    paint(null, [dx, dy])
    e.stopPropagation()
  }
  const onPointerMove = (e: PointerEvent<SVGRectElement>) => {
    const s = stroke.current
    if (s === null || s.pointerId !== e.pointerId) return
    const [dx, dy] = toData(e.clientX, e.clientY)
    paint(s.last, [dx, dy])
    s.last = [dx, dy]
    e.stopPropagation()
  }
  const end = (e: PointerEvent<SVGRectElement>) => {
    if (stroke.current?.pointerId !== e.pointerId) return
    stroke.current = null
    onStroke?.('end')
  }
  const onKeyDown = (e: KeyboardEvent<SVGRectElement>) => {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return
    const r = sketchKey(i, heights, e.key, e.shiftKey, { step: keyStep, max: yMax, min: yMin })
    if (r === null) return
    e.preventDefault()
    if (r.index !== i) setIndex(r.index)
    if (r.heights !== heights) onChange(r.heights)
  }

  let d = ''
  xs.forEach((xv, k) => (d += `${k === 0 ? 'M' : 'L'}${n2(x(xv))},${n2(y(heights[k] ?? 0))}`))
  const px = x(xs[i])
  const py = y(heights[i] ?? 0)

  return (
    <g data-sketch="">
      <g clipPath={clipPath} pointerEvents="none">
        <path d={d} fill="none" stroke={roleVar(role)} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {xs.map((xv, k) => (
          <circle key={k} cx={n2(x(xv))} cy={n2(y(heights[k] ?? 0))} r={2.5} fill={roleVar(role)} />
        ))}
        {focused ? <line x1={n2(px)} x2={n2(px)} y1={0} y2={innerHeight} stroke="var(--viz-boundary)" strokeOpacity={0.45} strokeWidth={1} shapeRendering="crispEdges" /> : null}
      </g>
      {focused ? <rect x={n2(px) - 5.5} y={n2(py) - 5.5} width={11} height={11} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} transform={`rotate(45 ${n2(px)} ${n2(py)})`} pointerEvents="none" /> : null}
      <rect
        data-sketch-canvas=""
        x={0}
        y={0}
        width={innerWidth}
        height={innerHeight}
        fill="transparent"
        tabIndex={disabled ? -1 : 0}
        role="slider"
        aria-roledescription="tela da disegno"
        aria-label={`${label}. Frecce sinistra e destra: punto; su e giù: altezza`}
        aria-orientation="vertical"
        aria-valuemin={yMin}
        aria-valuemax={yMax}
        aria-valuenow={heights[i] ?? 0}
        aria-valuetext={`x = ${fmt(xs[i])}: altezza ${fmt(heights[i] ?? 0)} (punto ${i + 1} di ${xs.length})`}
        aria-disabled={disabled || undefined}
        style={{ cursor: disabled ? undefined : 'crosshair', touchAction: disabled ? undefined : 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </g>
  )
}
