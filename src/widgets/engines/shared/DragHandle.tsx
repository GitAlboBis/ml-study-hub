// Maniglia di base dentro un <Plot>: il pezzo comune di Threshold, HandleOnCurve, AngleHandle, LineHandles ed
// Ellipse. Trascinamento con il puntatore (senza salti: si conserva la presa, come i Dots del kit) e tastiera
// (role="slider": chi la usa decide che cosa fa ogni tasto). Non tiene la posizione: la riceve in pixel dell'area
// interna e, a ogni mossa, restituisce il punto del dominio sotto il puntatore già corretto della presa.
//
// SCELTE
// - Il segno e il bersaglio li disegna chi la usa (children), attorno a (0, 0): una soglia è una striscia alta
//   quanto il grafico con una linguetta, una maniglia su una curva un anello. Il bersaglio deve dare almeno 40 px.
// - Una sola lettura di geometria per evento (toData), prima delle scritture di React, come in Dots.
// - Cattura del puntatore: il trascinamento continua anche fuori dal bersaglio; il tocco non fa scorrere la
//   pagina mentre si trascina (touch-action: none sul solo bersaglio).
// - Il cartiglio (showTip del Plot) compare al passaggio, al fuoco e durante il trascinamento, e finché la maniglia
//   ha il fuoco o si trascina segue il valore: chi la muove con le frecce legge il numero nuovo, non quello di prima.
// - Moto: nessuno. La maniglia segue la mano; un valore che insegue in ritardo sembra rotto (WIDGET_GUIDE §4).
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { usePlot } from '../../kit/plot/Plot'

export interface DragHandleProps {
  /** posizione del segno, in pixel dell'area interna */
  px: number
  py: number
  /** nome accessibile: che cosa si trascina ("Soglia x*", "Picco della campana") */
  label: string
  /** il valore a parole per chi ascolta ("x* = 4.50") */
  valueText: string
  valueNow: number
  valueMin: number
  valueMax: number
  orientation?: 'horizontal' | 'vertical'
  /** come la chiama un lettore di schermo al posto di "dispositivo di scorrimento" */
  roleDescription?: string
  /** punto del dominio sotto il puntatore, corretto della presa; senza, la maniglia non si trascina */
  onDragTo?: (x: number, y: number) => void
  /** un tasto sulla maniglia: true se l'ha usato (allora niente comportamento del browser) */
  onKey?: (key: string, shift: boolean) => boolean
  /** inizio e fine del trascinamento (per mettere in pausa uno storyboard che impone questo valore) */
  onDragState?: (dragging: boolean) => void
  /** lettura nel cartiglio del Plot */
  tip?: { value: string; label?: string }
  /** attributo dati per trovarla (test, stili): data-handle="…" */
  name?: string
  disabled?: boolean
  children: ReactNode
}

export function DragHandle({
  px,
  py,
  label,
  valueText,
  valueNow,
  valueMin,
  valueMax,
  orientation = 'horizontal',
  roleDescription = 'maniglia trascinabile',
  onDragTo,
  onKey,
  onDragState,
  tip,
  name,
  disabled = false,
  children,
}: DragHandleProps) {
  const { x, y, toData, showTip, registerInteractive } = usePlot()
  const grab = useRef<{ pointerId: number; dx: number; dy: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [focused, setFocused] = useState(false)
  const live = !disabled && (onDragTo !== undefined || onKey !== undefined)

  useEffect(() => (live ? registerInteractive() : undefined), [live, registerInteractive])

  const showReading = () => (tip ? showTip({ x: px, y: py, value: tip.value, label: tip.label }) : undefined)

  const onPointerDown = (e: PointerEvent<SVGGElement>) => {
    if (disabled || onDragTo === undefined || e.button !== 0) return
    const [dx, dy] = toData(e.clientX, e.clientY)
    grab.current = { pointerId: e.pointerId, dx: x(dx) - px, dy: y(dy) - py }
    setDragging(true)
    onDragState?.(true)
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // puntatore già rilasciato: il trascinamento finirà al pointerup
    }
    // il Plot sotto non deve leggere questo gesto come cursore
    e.stopPropagation()
  }
  const onPointerMove = (e: PointerEvent<SVGGElement>) => {
    const g = grab.current
    if (g === null || g.pointerId !== e.pointerId || onDragTo === undefined) return
    const [dx, dy] = toData(e.clientX, e.clientY)
    onDragTo(x.invert(x(dx) - g.dx), y.invert(y(dy) - g.dy))
    e.stopPropagation()
  }
  const endDrag = (e: PointerEvent<SVGGElement>) => {
    if (grab.current?.pointerId !== e.pointerId) return
    grab.current = null
    setDragging(false)
    onDragState?.(false)
  }
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (disabled || onKey === undefined || e.altKey || e.ctrlKey || e.metaKey) return
    if (onKey(e.key, e.shiftKey)) e.preventDefault()
  }

  // il cartiglio segue la maniglia mentre si trascina o ha il fuoco (showTip è stabile: aggiornarlo in un effetto
  // non rifà il Plot)
  const tipValue = tip?.value
  const tipLabel = tip?.label
  useEffect(() => {
    if ((dragging || focused) && tipValue !== undefined) showTip({ x: px, y: py, value: tipValue, label: tipLabel })
  }, [dragging, focused, px, py, tipValue, tipLabel, showTip])

  const n = (v: number) => Number(v.toFixed(2))
  return (
    <g
      data-handle={name ?? ''}
      transform={`translate(${n(px)},${n(py)})`}
      tabIndex={live ? 0 : -1}
      role="slider"
      aria-roledescription={roleDescription}
      aria-label={label}
      aria-orientation={orientation}
      aria-valuemin={valueMin}
      aria-valuemax={valueMax}
      aria-valuenow={valueNow}
      aria-valuetext={valueText}
      aria-disabled={disabled || undefined}
      style={{ cursor: onDragTo === undefined || disabled ? undefined : dragging ? 'grabbing' : 'grab', touchAction: onDragTo === undefined ? undefined : 'none' }}
      onPointerEnter={showReading}
      onPointerLeave={() => (grab.current === null ? showTip(null) : undefined)}
      onFocus={() => {
        setFocused(true)
        showReading()
      }}
      onBlur={() => {
        setFocused(false)
        showTip(null)
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
      {children}
    </g>
  )
}
