// Lista da riordinare: i blocchi di una pipeline, i passi di una derivazione, le righe di una dimostrazione, le
// bande in ordine di J. Verticale o orizzontale, con i numeri di posizione se servono.
//
// TRE MODI, stesso esito:
// - trascinare un elemento con il puntatore: segue il dito, una linea ocra mostra dove cadrà, al rilascio scivola
//   al suo posto e gli altri si spostano (FLIP, useFlip). Una lista orizzontale va a capo sui telefoni: lì il posto
//   d'arrivo si legge in ordine di lettura, riga per riga (dragKeyboard.dropIndexFlow);
// - toccarlo per prenderlo, poi i pulsanti "Su"/"Giù" (o "Prima"/"Dopo") che compaiono accanto;
// - da tastiera: Invio o Spazio lo prendono, le frecce del verso della lista lo spostano, Inizio e Fine in cima e in
//   fondo, Invio o Spazio lo posano, Esc rimette l'ordine di prima (dragKeyboard.sortKey). Senza presa le frecce
//   spostano il fuoco: un solo arresto del Tab.
// Ogni passo si annuncia ("Preso X, posizione 2 di 5", "X in posizione 3 di 5").
//
// Il componente non tiene l'ordine: riceve `order` e chiama onChange. L'esito (orderOutcome) lo calcola chi lo usa e
// lo ripassa come `feedback`, con icona e parola.
// Moto: 180 ms di scivolamento, solo transform, per i gesti del puntatore e del dito; da tastiera gli elementi sono
// subito al loro posto (un'azione da tastiera non si anima, WIDGET_GUIDE §4), e così con reduced motion.
import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { Rich } from '../../../components/content/Rich'
import type { Rich as RichText } from '../../../content/types'
import { dropIndex, dropIndexFlow, flowMarkAt, moveInOrder, sortKey, speakable, type FlowBox, type SortHold } from './dragKeyboard'
import { useFlip } from './useFlip'

export interface SortableItem {
  id: string
  label: RichText
  speak?: string
}

export interface SortableProps {
  /** id unico nella pagina */
  id: string
  /** nome della lista: "Metti in ordine i blocchi della pipeline" */
  label: string
  items: readonly SortableItem[]
  /** ordine corrente degli id */
  order: readonly string[]
  onChange: (order: readonly string[]) => void
  orientation?: 'vertical' | 'horizontal'
  /** numeri di posizione 1, 2, 3… davanti agli elementi */
  numbered?: boolean
  feedback?: Readonly<Record<string, 'ok' | 'wrong'>>
  disabled?: boolean
}

interface Drag {
  id: string
  pointerId: number
  x0: number
  y0: number
  d: number
  /** orizzontale: spostamento verticale del dito (in una lista che va a capo si cambia riga) */
  dy: number
  moved: boolean
  /** verticale: centri degli altri elementi lungo l'asse della lista, misurati a inizio gesto */
  mids: number[]
  /** verticale: dove disegnare la linea d'arrivo per ogni indice, in px dall'inizio della lista */
  marks: number[]
  /** orizzontale: rettangoli degli altri elementi rispetto all'angolo della lista (la lista può andare a capo) */
  boxes: FlowBox[]
  /** angolo della lista sullo schermo, a inizio gesto */
  origin: { x: number; y: number }
  index: number
  /** orizzontale: la linea d'arrivo, rispetto all'angolo della lista */
  mark: { x: number; y: number; h: number }
}

const ICON = { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'square', 'aria-hidden': true } as const

export function Sortable({ id, label, items, order, onChange, orientation = 'vertical', numbered = false, feedback, disabled = false }: SortableProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const helpId = `${uid}-help`
  const labelId = `${uid}-label`
  const vertical = orientation === 'vertical'
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const pendingFocus = useRef<string | null>(null)
  const suppressClick = useRef(false)
  const flip = useFlip(rootRef)
  const [hold, setHold] = useState<SortHold | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [said, setSaid] = useState('')

  const current = focusId !== null && order.includes(focusId) ? focusId : (order[0] ?? null)
  const name = (itemId: string) => {
    const it = items.find((i) => i.id === itemId)
    return it ? (it.speak ?? speakable(it.label)) : itemId
  }
  const where = (o: readonly string[], itemId: string) => `posizione ${o.indexOf(itemId) + 1} di ${o.length}`

  useLayoutEffect(() => {
    const want = pendingFocus.current
    if (want === null) return
    pendingFocus.current = null
    refs.current.get(want)?.focus({ preventScroll: true })
  })

  /** Nuovo ordine; `slide` solo per i gesti del puntatore e del dito. */
  const apply = (next: readonly string[], item: string, slide: boolean) => {
    if (slide) flip()
    onChange(next)
    pendingFocus.current = item
    setFocusId(item)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, itemId: string) => {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return
    const r = sortKey(hold, e.key, itemId, order, orientation)
    if (r === null) return
    e.preventDefault()
    if (r.focus !== undefined) {
      setFocusId(r.focus)
      refs.current.get(r.focus)?.focus()
      return
    }
    setHold(r.hold)
    const moved = r.order.some((o, i) => o !== order[i])
    if (moved) apply(r.order, itemId, false)
    if (r.cancel) setSaid(`Annullato: ${name(itemId)} torna in ${where(r.order, itemId)}`)
    else if (r.dropped) setSaid(`${name(itemId)} posato in ${where(r.order, itemId)}`)
    else if (hold === null && r.hold) setSaid(`Preso ${name(itemId)}, ${where(order, itemId)}. Frecce per spostarlo, Invio per posarlo, Esc per annullare`)
    else if (moved) setSaid(`${name(itemId)} in ${where(r.order, itemId)}`)
  }

  const step = (itemId: string, delta: number, slide: boolean) => {
    const i = order.indexOf(itemId)
    const next = moveInOrder(order, itemId, i + delta)
    if (next.some((o, k) => o !== order[k])) {
      apply(next, itemId, slide)
      setSaid(`${name(itemId)} in ${where(next, itemId)}`)
    }
  }

  // --- puntatore ---
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, itemId: string) => {
    if (disabled || e.button !== 0) return
    setDrag({ id: itemId, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, d: 0, dy: 0, moved: false, mids: [], marks: [], boxes: [], origin: { x: 0, y: 0 }, index: order.indexOf(itemId), mark: { x: 0, y: 0, h: 0 } })
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // puntatore già rilasciato
    }
  }
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag === null || drag.pointerId !== e.pointerId) return
    const d = vertical ? e.clientY - drag.y0 : e.clientX - drag.x0
    if (!drag.moved && Math.abs(d) < 5 && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 5) return
    let { mids, marks, boxes, origin } = drag
    if (!drag.moved) {
      // una sola misura all'inizio del gesto: rettangoli degli altri elementi e posizioni della linea d'arrivo
      const list = listRef.current?.getBoundingClientRect()
      origin = { x: list?.left ?? 0, y: list?.top ?? 0 }
      const rects = order.map((o) => refs.current.get(o)?.getBoundingClientRect())
      const others = order.map((o, k) => ({ o, b: rects[k] })).filter((x) => x.o !== drag.id && x.b !== undefined) as { o: string; b: DOMRect }[]
      mids = others.map(({ b }) => b.top + b.height / 2)
      marks = others.map(({ b }) => b.top - origin.y - 4)
      const last = others[others.length - 1]?.b
      marks.push(last ? last.bottom - origin.y + 4 : 0)
      boxes = others.map(({ b }) => ({ left: b.left - origin.x, top: b.top - origin.y, right: b.right - origin.x, bottom: b.bottom - origin.y }))
    }
    if (vertical) {
      setDrag({ ...drag, d, moved: true, mids, marks, boxes, origin, index: dropIndex(mids, e.clientY) })
      return
    }
    const px = e.clientX - origin.x
    const py = e.clientY - origin.y
    const index = dropIndexFlow(boxes, px, py)
    setDrag({ ...drag, d, dy: e.clientY - drag.y0, moved: true, mids, marks, boxes, origin, index, mark: flowMarkAt(boxes, index, py) })
  }
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag === null || drag.pointerId !== e.pointerId) return
    if (drag.moved) {
      suppressClick.current = true
      const next = moveInOrder(order, drag.id, drag.index)
      // la misura per lo scivolamento si prende con l'elemento ancora sotto il dito
      flip()
      if (next.some((o, k) => o !== order[k])) {
        onChange(next)
        setSaid(`${name(drag.id)} posato in ${where(next, drag.id)}`)
      }
      pendingFocus.current = drag.id
      setFocusId(drag.id)
    }
    setDrag(null)
  }
  const onClick = (itemId: string) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (disabled) return
    if (hold?.item === itemId) {
      setHold(null)
      setSaid(`${name(itemId)} posato in ${where(order, itemId)}`)
    } else {
      setHold({ item: itemId, origin: order })
      setFocusId(itemId)
      setSaid(`Preso ${name(itemId)}, ${where(order, itemId)}: usa i pulsanti accanto o le frecce`)
    }
  }

  const prevLabel = vertical ? 'Su' : 'Prima'
  const nextLabel = vertical ? 'Giù' : 'Dopo'

  return (
    <div ref={rootRef} role="group" aria-labelledby={labelId} data-sortable={id} className="grid gap-2">
      <p id={labelId} className="label m-0">
        {label}
      </p>
      <p id={helpId} className="m-0 text-[length:var(--step--1)] text-muted">
        Trascina un elemento, oppure toccalo e usa i pulsanti. Da tastiera: Invio per prendere, frecce per spostare, Invio per posare, Esc per annullare.
      </p>
      <ol ref={listRef} role="list" className={`relative m-0 flex gap-2 p-0 ${vertical ? 'flex-col' : 'flex-row flex-wrap'}`}>
        {order.map((itemId, k) => {
          const it = items.find((i) => i.id === itemId)
          if (it === undefined) return null
          const held = hold?.item === itemId
          const dragging = drag?.moved === true && drag.id === itemId
          const fb = feedback?.[itemId]
          return (
            <li
              key={itemId}
              data-flip-id={itemId}
              className="m-0 flex list-none items-stretch gap-1"
              style={dragging ? { transform: vertical ? `translateY(${drag.d}px)` : `translate(${drag.d}px, ${drag.dy}px)`, position: 'relative', zIndex: 20 } : undefined}
            >
              {numbered ? (
                <span aria-hidden="true" className="num grid min-w-8 place-items-center border border-border bg-surface-2 text-muted">
                  {k + 1}
                </span>
              ) : null}
              <button
                type="button"
                ref={(el) => {
                  if (el) refs.current.set(itemId, el)
                  else refs.current.delete(itemId)
                }}
                data-item={itemId}
                data-held={held || undefined}
                tabIndex={itemId === current ? 0 : -1}
                aria-label={`${name(itemId)}, ${where(order, itemId)}${fb === 'ok' ? ', giusto' : fb === 'wrong' ? ', fuori posto' : ''}${held ? ', preso' : ''}`}
                aria-describedby={helpId}
                aria-disabled={disabled || undefined}
                className={`flex min-h-10 flex-1 cursor-grab touch-none items-center gap-2 border px-3 py-1.5 text-left select-none active:cursor-grabbing ${held ? 'border-pin-contrast bg-pin text-pin-contrast' : 'border-border-strong bg-surface text-text hover:bg-surface-2'} ${dragging ? 'shadow-1' : ''} ${fb === 'wrong' ? 'border-warn' : ''}`}
                onFocus={() => setFocusId(itemId)}
                onKeyDown={(e) => onKeyDown(e, itemId)}
                onPointerDown={(e) => onPointerDown(e, itemId)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => setDrag(null)}
                onClick={() => onClick(itemId)}
              >
                {/* la presa: tre filetti, il segno che si può trascinare */}
                <svg {...ICON} strokeWidth={2} className="shrink-0 text-faint">
                  <path d="M6 8h12M6 12h12M6 16h12" />
                </svg>
                {fb === 'ok' ? (
                  <svg {...ICON} className="shrink-0 text-ok">
                    <path d="M4 12.5l5 5L20 6.5" />
                  </svg>
                ) : fb === 'wrong' ? (
                  <svg {...ICON} className="shrink-0 text-warn">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                ) : null}
                <span aria-hidden="true" className="min-w-0">
                  <Rich text={it.label} inline />
                </span>
              </button>
              {held && !disabled ? (
                <span className="flex gap-1">
                  <button type="button" className="label min-h-10 min-w-10 border border-border-strong bg-surface px-2 hover:bg-surface-2 disabled:opacity-45" disabled={k === 0} onClick={(e) => step(itemId, -1, e.detail > 0)}>
                    {prevLabel}
                    <span className="visually-hidden">: {name(itemId)}</span>
                  </button>
                  <button type="button" className="label min-h-10 min-w-10 border border-border-strong bg-surface px-2 hover:bg-surface-2 disabled:opacity-45" disabled={k === order.length - 1} onClick={(e) => step(itemId, 1, e.detail > 0)}>
                    {nextLabel}
                    <span className="visually-hidden">: {name(itemId)}</span>
                  </button>
                </span>
              ) : null}
            </li>
          )
        })}
        {drag?.moved ? (
          // la linea d'arrivo: dove cadrà l'elemento. Si muove con transform, non con top o left
          <li
            aria-hidden="true"
            data-drop-line=""
            className={`pointer-events-none absolute m-0 list-none bg-pin ${vertical ? 'left-0 right-0 top-0 h-1' : 'top-0 left-0 w-1'}`}
            style={
              vertical
                ? { transform: `translateY(${drag.marks[drag.index] ?? 0}px)`, outline: '1px solid var(--pin-contrast)' }
                : // si sposta con transform; l'altezza è quella della riga e cambia solo al cambio di riga
                  { transform: `translate(${Math.round(drag.mark.x)}px, ${Math.round(drag.mark.y)}px)`, height: `${Math.round(drag.mark.h)}px`, outline: '1px solid var(--pin-contrast)' }
            }
          />
        ) : null}
      </ol>
      <p role="status" className="visually-hidden">
        {said}
      </p>
    </div>
  )
}
