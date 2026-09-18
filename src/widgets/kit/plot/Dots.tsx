// Punti nel piano del grafico: campioni, centroidi, il punto x da classificare.
// - La classe dà colore E forma insieme (marks.ts): l'identità non sta mai nel solo colore.
// - Segno di almeno 8 px con un anello di 2 px del colore della superficie: due punti sovrapposti, o un punto
//   sopra una curva, restano leggibili senza disegnare bordi.
// - Il bersaglio è più grande del segno: 24 px per la lettura al passaggio, 40 px per ciò che si trascina.
// - `draggable`: si trascina con il puntatore (senza salti: si conserva il punto di presa) e da tastiera. Ogni
//   punto trascinabile è un cursore a due assi: frecce = un passo, Maiusc+frecce = dieci, Inizio/Fine = estremi
//   dell'asse x, Pag su/giù = dieci passi in y. Con `axis` il moto è vincolato a un asse e tutte le frecce lo seguono.
//   Il componente non tiene la posizione: chiama onDrag(id, x, y) con coordinate nel dominio, già riportate dentro.
//   Durante il trascinamento c'è una sola lettura di geometria per evento (la matrice dell'SVG in toData), sempre
//   prima delle scritture di React: niente letture e scritture alternate nello stesso fotogramma.
// - `pin`: lo spillo ocra con contorno a inchiostro, per ciò che segna una posizione (il punto interrogato, le
//   maniglie a e b). `highlight`: accende alcuni punti (i k vicini) con un alone ocra.
// - Letture senza puntatore: i punti si registrano nel Plot (registerReadable). Il cursore-quota, che si muove anche
//   da tastiera, legge il punto più vicino entro 24 px con nome, classe e coordinate; in un grafico statico i punti
//   con `label` entrano nella descrizione dell'SVG. I punti fermi restano fuori dal giro del Tab.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { format } from 'd3'
import { useSettled } from '../useSettled'
import { roleVar, type VizRole } from './colors'
import { classSymbolPath, classVar, className, CLASS_SYMBOL_NAMES } from './marks'
import { usePlot, type MarkReading } from './Plot'

export interface Dot {
  x: number
  y: number
  /** indice di classe, da 0: colore e forma del marcatore */
  cls?: number
  /** identità stabile; predefinito l'indice nell'elenco */
  id?: string
  /** nome mostrato nella lettura e letto dagli screen reader: "pesce misterioso" */
  label?: string
}

export interface DotsProps {
  data: readonly Dot[]
  draggable?: boolean
  onDrag?: (id: string, x: number, y: number) => void
  /** raggio del segno in px; predefinito 4.5 (6 per lo spillo). Mai sotto 4: il segno deve restare di 8 px */
  r?: number
  /** vincolo del trascinamento; predefinito 'xy' */
  axis?: 'xy' | 'x' | 'y'
  /** passo da tastiera nel dominio, uno o [x, y]; predefinito un cinquantesimo del dominio */
  step?: number | readonly [number, number]
  pin?: boolean
  /** colore dei punti senza classe; predefinito 'sample' */
  role?: VizRole
  /** id dei punti da accendere */
  highlight?: readonly string[]
  /** testo delle coordinate nelle letture; predefinito 3 cifre significative */
  format?: (value: number) => string
}

const HOVER_HIT = 12
const DRAG_HIT = 20
/** Portata del cursore-quota: un punto entro 24 px dal cursore è quello che si legge. */
const READ_REACH = 24
const compact = format('.3~g')
const tidy = (v: number) => Number(v.toPrecision(12))

export function Dots({ data, draggable = false, onDrag, r, axis = 'xy', step, pin = false, role = 'sample', highlight, format: fmt = compact }: DotsProps) {
  const { x, y, toData, showTip, registerInteractive, registerReadable } = usePlot()
  const radius = Math.max(4, r ?? (pin ? 6 : 4.5))
  const size = Math.PI * radius * radius
  const [xa, xb] = x.domain()
  const [ya, yb] = y.domain()
  const xMin = Math.min(xa, xb)
  const xMax = Math.max(xa, xb)
  const yMin = Math.min(ya, yb)
  const yMax = Math.max(ya, yb)
  const [sx, sy] = typeof step === 'number' ? [step, step] : (step ?? [(xMax - xMin) / 50, (yMax - yMin) / 50])

  // presa in pixel tra il puntatore e il centro del punto: senza, il punto salterebbe sotto il dito
  const grab = useRef<{ id: string; pointerId: number; dx: number; dy: number } | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  useEffect(() => (draggable ? registerInteractive() : undefined), [draggable, registerInteractive])

  const readout = (d: Dot) => (axis === 'x' ? `x = ${fmt(d.x)}` : axis === 'y' ? `y = ${fmt(d.y)}` : `x = ${fmt(d.x)}, y = ${fmt(d.y)}`)
  const name = (d: Dot) => d.label ?? (d.cls !== undefined ? `classe ${d.cls + 1} · ${CLASS_SYMBOL_NAMES[d.cls % 6]}` : undefined)
  const tipFor = (d: Dot) => showTip({ x: x(d.x), y: y(d.y) - radius, value: readout(d), label: name(d) })

  // --- letture per il cursore-quota e per la descrizione del grafico ---
  const visible = (d: Dot) => Number.isFinite(d.x) && Number.isFinite(d.y) && d.x >= xMin && d.x <= xMax && d.y >= yMin && d.y <= yMax
  const spoken = (d: Dot) => [d.label, d.cls !== undefined ? className(d.cls) : undefined].filter((s) => s !== undefined).join(' · ')
  // i dati dell'ultimo render, letti quando il cursore si muove: cambiarli non richiede di registrarsi di nuovo
  const latest = useRef({ data, x, y, visible, spoken, readout })
  useLayoutEffect(() => {
    latest.current = { data, x, y, visible, spoken, readout }
  })
  // i punti trascinabili hanno già nome e valore da slider: nella descrizione vanno solo quelli fermi con un nome.
  // La descrizione si aggiorna quando i nomi smettono di cambiare: un'animazione non rifà il Plot a ogni fotogramma
  const named = useSettled(
    draggable
      ? ''
      : data
          .filter((d) => d.label !== undefined && visible(d))
          .map((d) => `${spoken(d)} (${readout(d)})`)
          .join('; '),
  )
  useEffect(
    () =>
      registerReadable({
        named,
        nearest(px, py, mode) {
          const { data: points, x: sx, y: sy, visible: shown, spoken: say, readout: coords } = latest.current
          let best: MarkReading | null = null
          for (const d of points) {
            if (!shown(d)) continue
            const dx = sx(d.x) - px
            const distance = mode === 'x' ? Math.abs(dx) : Math.hypot(dx, sy(d.y) - py)
            if (distance <= READ_REACH && (best === null || distance < best.distance)) best = { distance, text: [say(d) || 'punto', coords(d)].join(' · ') }
          }
          return best
        },
      }),
    [registerReadable, named],
  )

  const emit = (d: Dot, id: string, nx: number, ny: number) => {
    const cx = axis === 'y' ? d.x : tidy(Math.min(Math.max(nx, xMin), xMax))
    const cy = axis === 'x' ? d.y : tidy(Math.min(Math.max(ny, yMin), yMax))
    if (cx === d.x && cy === d.y) return
    onDrag?.(id, cx, cy)
    showTip({ x: x(cx), y: y(cy) - radius, value: readout({ ...d, x: cx, y: cy }), label: name(d) })
  }

  const onPointerDown = (e: PointerEvent<SVGGElement>, d: Dot, id: string) => {
    if (e.button !== 0) return
    const [px, py] = toData(e.clientX, e.clientY)
    grab.current = { id, pointerId: e.pointerId, dx: x(px) - x(d.x), dy: y(py) - y(d.y) }
    setDragging(id)
    // cattura: il trascinamento continua anche se il puntatore esce dal bersaglio (jsdom non la conosce)
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // puntatore già rilasciato: il trascinamento finirà al pointerup
    }
    e.stopPropagation()
  }
  const onPointerMove = (e: PointerEvent<SVGGElement>, d: Dot, id: string) => {
    const g = grab.current
    if (g === null || g.id !== id || g.pointerId !== e.pointerId) return
    const [px, py] = toData(e.clientX, e.clientY)
    emit(d, id, x.invert(x(px) - g.dx), y.invert(y(py) - g.dy))
    e.stopPropagation()
  }
  const endDrag = (e: PointerEvent<SVGGElement>) => {
    if (grab.current?.pointerId !== e.pointerId) return
    grab.current = null
    setDragging(null)
  }

  const onKeyDown = (e: KeyboardEvent<SVGGElement>, d: Dot, id: string) => {
    const big = e.shiftKey ? 10 : 1
    // verso della freccia: +1 avanti, -1 indietro, lungo l'asse "naturale" del tasto
    const along = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
    const vertical = e.key === 'ArrowUp' || e.key === 'ArrowDown'
    let nx = d.x
    let ny = d.y
    if (along !== 0) {
      // con un solo asse libero ogni freccia muove lungo quello, come in un cursore a scorrimento
      if (axis === 'x' || (axis === 'xy' && !vertical)) nx += along * sx * big
      else ny += along * sy * big
    } else if (e.key === 'Home') {
      if (axis === 'y') ny = yMin
      else nx = xMin
    } else if (e.key === 'End') {
      if (axis === 'y') ny = yMax
      else nx = xMax
    } else if (e.key === 'PageUp') {
      if (axis === 'x') nx += sx * 10
      else ny += sy * 10
    } else if (e.key === 'PageDown') {
      if (axis === 'x') nx -= sx * 10
      else ny -= sy * 10
    } else return
    e.preventDefault()
    emit(d, id, nx, ny)
  }

  return (
    <g data-dots="">
      {data.map((d, i) => {
        if (!Number.isFinite(d.x) || !Number.isFinite(d.y) || d.x < xMin || d.x > xMax || d.y < yMin || d.y > yMax) return null
        const id = d.id ?? String(i)
        const lit = highlight?.includes(id) ?? false
        const mark = pin ? (
          <>
            <path data-mark="" d={classSymbolPath(0, size)} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} />
            <circle r={1.5} fill="var(--pin-contrast)" />
          </>
        ) : (
          <path
            data-mark=""
            d={classSymbolPath(d.cls ?? 0, size)}
            fill={d.cls !== undefined ? classVar(d.cls) : roleVar(role)}
            stroke="var(--surface)"
            strokeWidth={4}
            strokeLinejoin="round"
            paintOrder="stroke"
          />
        )
        const halo = lit ? <circle data-halo="" r={radius + 5} fill="var(--viz-highlight)" stroke="var(--pin-contrast)" strokeWidth={1} /> : null
        const hover = { onPointerEnter: () => tipFor(d), onPointerLeave: () => (grab.current === null ? showTip(null) : undefined) }

        if (!draggable) {
          return (
            <g key={id} data-dot={id} transform={`translate(${x(d.x)},${y(d.y)})`} {...hover}>
              <circle r={HOVER_HIT} fill="transparent" />
              {halo}
              {mark}
            </g>
          )
        }
        return (
          <g
            key={id}
            data-dot={id}
            transform={`translate(${x(d.x)},${y(d.y)})`}
            tabIndex={0}
            role="slider"
            aria-roledescription="punto trascinabile"
            aria-label={d.label ?? `Punto ${id}`}
            aria-orientation={axis === 'y' ? 'vertical' : 'horizontal'}
            aria-valuemin={axis === 'y' ? yMin : xMin}
            aria-valuemax={axis === 'y' ? yMax : xMax}
            aria-valuenow={axis === 'y' ? d.y : d.x}
            aria-valuetext={readout(d)}
            style={{ cursor: dragging === id ? 'grabbing' : 'grab', touchAction: 'none' }}
            {...hover}
            onFocus={() => tipFor(d)}
            onBlur={() => showTip(null)}
            onPointerDown={(e) => onPointerDown(e, d, id)}
            onPointerMove={(e) => onPointerMove(e, d, id)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={(e) => onKeyDown(e, d, id)}
          >
            <circle r={DRAG_HIT} fill="transparent" />
            {halo}
            {mark}
          </g>
        )
      })}
    </g>
  )
}
