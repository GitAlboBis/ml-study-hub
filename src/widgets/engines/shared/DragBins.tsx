// Chip da smistare in contenitori: le sfide `sort` (carte K-NN o Parzen, continuo o discreto, filtro, wrapper o
// embedded), i blocchi da mettere nelle caselle di uno schema. Un vassoio da cui si parte (facoltativo) e i
// contenitori; ogni chip è un pulsante.
//
// TRE MODI DI SPOSTARE UN CHIP, tutti con lo stesso esito:
// - trascinarlo con il puntatore su un contenitore (la carta segue il dito; al rilascio scivola nel posto nuovo);
// - toccarlo (lo si prende) e poi toccare "Posa qui" sul contenitore: il modo comodo sul telefono;
// - da tastiera: Invio o Spazio lo prendono, le frecce scelgono il contenitore, Invio o Spazio lo posano, Esc
//   annulla (dragKeyboard.binsKey). Senza presa le frecce spostano il fuoco fra i chip: un solo arresto del Tab.
// Ogni passo si annuncia in una regione aria-live; il contenitore scelto ha il bordo ocra E il suo "Posa qui"
// acceso con la freccia (o la scritta "qui", dove non c'è un pulsante: il contenitore da cui il chip parte, il
// contenitore sotto il dito durante un trascinamento). Il contenitore in cui il chip sta già non offre "Posa qui".
//
// Il componente non tiene dove stanno i chip: riceve `placement` e chiama onChange con il nuovo (placeItem, con lo
// scambio nelle caselle a capienza 1). L'esito della sfida lo calcola chi lo usa (sortOutcome) e lo ripassa come
// `feedback`: icona e parola accanto al chip, mai il solo colore.
//
// Moto: il chip posato con il puntatore o con il dito scivola in 180 ms nel posto nuovo (useFlip, solo transform);
// con reduced motion salta. Da tastiera arriva subito: un'azione da tastiera non si anima (WIDGET_GUIDE §4).
import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { Rich } from '../../../components/content/Rich'
import type { Rich as RichText } from '../../../content/types'
import { binContents, binsKey, placeItem, speakable, type BinTarget, type BinsHold, type Placement } from './dragKeyboard'
import { useFlip } from './useFlip'

export interface DragItem {
  id: string
  /** testo del chip: Markdown con $…$ */
  label: RichText
  /** nome per chi ascolta, se l'etichetta ha formule che si leggono male; predefinito speakable(label) */
  speak?: string
}

export interface DragBin {
  id: string
  label: RichText
  speak?: string
  /** quanti chip ci stanno (1 = una casella: posandone un altro si scambiano) */
  capacity?: number
}

export interface DragBinsProps {
  /** id unico nella pagina */
  id: string
  /** nome del gruppo: "Smista le carte" */
  label: string
  items: readonly DragItem[]
  bins: readonly DragBin[]
  placement: Placement
  onChange: (next: Placement) => void
  /** il vassoio da cui si parte; false per non averlo. Predefinito "Da smistare" */
  pool?: { label: RichText; speak?: string } | false
  /** esito per chip dopo la verifica */
  feedback?: Readonly<Record<string, 'ok' | 'wrong'>>
  /** larghezza minima di un contenitore in rem (i contenitori vanno a capo); predefinito 11 */
  minBinRem?: number
  disabled?: boolean
}

interface Drag {
  id: string
  pointerId: number
  x0: number
  y0: number
  dx: number
  dy: number
  moved: boolean
}

const POOL_KEY = '__vassoio__'
const keyOf = (t: BinTarget) => t ?? POOL_KEY

const ICON = { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'square', 'aria-hidden': true } as const

export function DragBins({ id, label, items, bins, placement, onChange, pool = { label: 'Da smistare' }, feedback, minBinRem = 11, disabled = false }: DragBinsProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const helpId = `${uid}-help`
  const labelId = `${uid}-label`
  const rootRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef(new Map<string, HTMLButtonElement>())
  const binRefs = useRef(new Map<string, HTMLElement>())
  const rects = useRef(new Map<string, DOMRect>())
  const pendingFocus = useRef<string | null>(null)
  const suppressClick = useRef(false)
  const flip = useFlip(rootRef)

  const [hold, setHold] = useState<BinsHold | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [said, setSaid] = useState('')

  const ids = items.map((i) => i.id)
  const hasPool = pool !== false
  const targets: BinTarget[] = [...(hasPool ? [null] : []), ...bins.map((b) => b.id)]
  const capacity = Object.fromEntries(bins.filter((b) => b.capacity !== undefined).map((b) => [b.id, b.capacity as number]))
  const itemName = (itemId: string) => {
    const it = items.find((i) => i.id === itemId)
    return it ? (it.speak ?? speakable(it.label)) : itemId
  }
  const targetName = (t: BinTarget) => {
    if (t === null) return pool === false ? 'vassoio' : (pool.speak ?? speakable(pool.label))
    const b = bins.find((x) => x.id === t)
    return b ? (b.speak ?? speakable(b.label)) : t
  }
  // ordine di lettura dei chip: vassoio, poi i contenitori nell'ordine dato
  const reading = targets.flatMap((t) => binContents(ids, placement, t))
  const current = focusId !== null && reading.includes(focusId) ? focusId : (reading[0] ?? null)

  // il chip posato cambia genitore e viene rimontato: il fuoco lo segue
  useLayoutEffect(() => {
    const want = pendingFocus.current
    if (want === null) return
    pendingFocus.current = null
    chipRefs.current.get(want)?.focus({ preventScroll: true })
  })

  /** Posa il chip; `slide` solo per i gesti del puntatore e del dito. */
  const commit = (item: string, target: BinTarget, slide: boolean) => {
    const from = placement[item] ?? null
    if (slide) flip()
    if (from !== target) onChange(placeItem(placement, item, target, capacity))
    pendingFocus.current = item
    setFocusId(item)
    setSaid(from === target ? `${itemName(item)} resta in ${targetName(target)}` : `${itemName(item)} posato in ${targetName(target)}`)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, itemId: string) => {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return
    const r = binsKey(hold, e.key, itemId, placement, targets)
    if (r !== null) {
      e.preventDefault()
      setHold(r.hold)
      if (r.drop) commit(r.drop.item, r.drop.target, false)
      else if (r.cancel) setSaid(`Annullato: ${itemName(itemId)} resta dov'era`)
      else if (r.hold) setSaid(hold === null ? `Preso ${itemName(itemId)}. Frecce: scegli il contenitore, ora ${targetName(r.hold.target)}. Invio: posa. Esc: annulla` : `Contenitore: ${targetName(r.hold.target)}`)
      return
    }
    if (hold !== null) return
    // senza presa: le frecce spostano il fuoco fra i chip, in ordine di lettura
    const i = reading.indexOf(itemId)
    const to =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? reading[Math.min(reading.length - 1, i + 1)] : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? reading[Math.max(0, i - 1)] : e.key === 'Home' ? reading[0] : e.key === 'End' ? reading[reading.length - 1] : undefined
    if (to === undefined) return
    e.preventDefault()
    setFocusId(to)
    chipRefs.current.get(to)?.focus()
  }

  // --- puntatore ---
  const targetAt = (cx: number, cy: number): string | null => {
    for (const [k, r] of rects.current) if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return k
    return null
  }
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, itemId: string) => {
    if (disabled || e.button !== 0) return
    setDrag({ id: itemId, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, moved: false })
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // puntatore già rilasciato
    }
  }
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag === null || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.x0
    const dy = e.clientY - drag.y0
    if (!drag.moved && Math.hypot(dx, dy) < 5) return
    if (!drag.moved) {
      // una sola misura dei contenitori all'inizio del gesto: le mosse leggono le misure salvate
      rects.current = new Map([...binRefs.current].map(([k, el]) => [k, el.getBoundingClientRect()]))
      setHold(null)
    }
    setDrag({ ...drag, dx, dy, moved: true })
    setHover(targetAt(e.clientX, e.clientY))
  }
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag === null || drag.pointerId !== e.pointerId) return
    if (drag.moved) {
      suppressClick.current = true
      const over = targetAt(e.clientX, e.clientY)
      // la misura per lo scivolamento si prende con la carta ancora sotto il dito (commit la prende da sé)
      if (over !== null) commit(drag.id, over === POOL_KEY ? null : over, true)
      else {
        flip()
        setSaid(`${itemName(drag.id)} torna al suo posto`)
      }
    }
    setDrag(null)
    setHover(null)
  }
  const onClick = (itemId: string) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (disabled) return
    // tocco o clic: prende il chip (poi "Posa qui"); un secondo tocco lo lascia
    if (hold?.item === itemId) {
      setHold(null)
      setSaid(`Annullato: ${itemName(itemId)} resta dov'era`)
      return
    }
    const r = binsKey(null, 'Enter', itemId, placement, targets)
    if (r?.hold) {
      setHold(r.hold)
      setFocusId(itemId)
      setSaid(`Preso ${itemName(itemId)}: scegli "Posa qui" su un contenitore, o usa le frecce`)
    }
  }

  const chip = (it: DragItem) => {
    const held = hold?.item === it.id
    const dragging = drag?.moved === true && drag.id === it.id
    const fb = feedback?.[it.id]
    return (
      <li key={it.id} data-flip-id={it.id} className="m-0 list-none" style={dragging ? { transform: `translate(${drag.dx}px, ${drag.dy}px)`, position: 'relative', zIndex: 20 } : undefined}>
        <button
          type="button"
          ref={(el) => {
            if (el) chipRefs.current.set(it.id, el)
            else chipRefs.current.delete(it.id)
          }}
          data-chip={it.id}
          data-held={held || undefined}
          tabIndex={it.id === current ? 0 : -1}
          aria-label={`${it.speak ?? speakable(it.label)}${fb === 'ok' ? ', giusto' : fb === 'wrong' ? ', da rivedere' : ''}${held ? ', preso' : ''}`}
          aria-describedby={helpId}
          aria-disabled={disabled || undefined}
          className={`inline-flex min-h-10 cursor-grab touch-none items-center gap-2 border px-3 py-1.5 text-left select-none active:cursor-grabbing ${held ? 'border-pin-contrast bg-pin text-pin-contrast' : 'border-border-strong bg-surface text-text hover:bg-surface-2'} ${dragging ? 'shadow-1' : ''} ${fb === 'wrong' ? 'border-warn' : ''}`}
          onFocus={() => setFocusId(it.id)}
          onKeyDown={(e) => onKeyDown(e, it.id)}
          onPointerDown={(e) => onPointerDown(e, it.id)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            setDrag(null)
            setHover(null)
          }}
          onClick={() => onClick(it.id)}
        >
          {fb === 'ok' ? (
            <svg {...ICON} className="shrink-0 text-ok">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          ) : fb === 'wrong' ? (
            <svg {...ICON} className="shrink-0 text-warn">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : null}
          <span aria-hidden="true">
            <Rich text={it.label} inline />
          </span>
        </button>
      </li>
    )
  }

  const zone = (t: BinTarget, title: RichText, extra: string) => {
    const k = keyOf(t)
    const inside = binContents(ids, placement, t)
    const lit = hold?.target === t || hover === k
    const cap = t === null ? undefined : capacity[t]
    // il contenitore in cui il chip preso sta già: posarlo lì non è una mossa, quindi niente "Posa qui"
    const home = hold !== null && (placement[hold.item] ?? null) === t
    const offer = hold !== null && !disabled && !home
    return (
      <section
        key={k}
        ref={(el) => {
          if (el) binRefs.current.set(k, el)
          else binRefs.current.delete(k)
        }}
        data-bin={k}
        data-target={lit || undefined}
        role="group"
        aria-label={`${targetName(t)}: ${inside.length} ${inside.length === 1 ? 'elemento' : 'elementi'}${lit ? ', scelto come destinazione' : ''}`}
        className={`grid min-w-0 content-start gap-2 p-2 ${lit ? 'border-2 border-pin-contrast bg-surface-2 outline-2 -outline-offset-4 outline-pin' : 'border border-border-strong bg-surface'} ${extra}`}
      >
        <header className="flex min-h-8 flex-wrap items-center justify-between gap-2">
          <span className="label flex items-center gap-2" aria-hidden="true">
            <Rich text={title} inline />
            <span className="num text-faint">{cap !== undefined ? `${inside.length}/${cap}` : inside.length}</span>
          </span>
          {lit && !offer ? (
            // dove non c'è un pulsante da accendere (sotto il dito, o il contenitore di partenza) resta la scritta
            <span data-here="" className="label flex items-center gap-1 bg-pin px-1.5 text-pin-contrast" aria-hidden="true">
              <svg {...ICON} width={12} height={12}>
                <path d="M12 4v14M6 12l6 6 6-6" />
              </svg>
              qui
            </span>
          ) : null}
          {offer ? (
            <button
              type="button"
              data-lit={lit || undefined}
              className={`label inline-flex min-h-10 items-center gap-1 border px-2 ${lit ? 'border-pin-contrast bg-pin text-pin-contrast' : 'border-border-strong bg-surface hover:bg-surface-2'}`}
              onClick={(e) => {
                const item = hold.item
                setHold(null)
                // detail 0: Invio o Spazio sul pulsante, cioè tastiera; un clic o un tocco veri scivolano
                commit(item, t, e.detail > 0)
              }}
            >
              {lit ? (
                <svg {...ICON} width={12} height={12}>
                  <path d="M12 4v14M6 12l6 6 6-6" />
                </svg>
              ) : null}
              Posa qui<span className="visually-hidden">: {itemName(hold.item)} in {targetName(t)}</span>
            </button>
          ) : null}
        </header>
        <ul role="list" className="m-0 flex min-h-12 flex-wrap content-start gap-2 p-0">
          {inside.map((itemId) => {
            const it = items.find((i) => i.id === itemId)
            return it ? chip(it) : null
          })}
        </ul>
      </section>
    )
  }

  return (
    <div ref={rootRef} role="group" aria-labelledby={labelId} data-drag-bins={id} className="grid gap-3">
      <p id={labelId} className="label m-0">
        {label}
      </p>
      <p id={helpId} className="m-0 text-[length:var(--step--1)] text-muted">
        Trascina un elemento in un contenitore, oppure toccalo e scegli «Posa qui». Da tastiera: Invio per prendere, frecce per scegliere il contenitore, Invio per posare, Esc per annullare.
      </p>
      {hasPool ? zone(null, pool.label, '') : null}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minBinRem}rem), 1fr))` }}>
        {bins.map((b) => zone(b.id, b.label, ''))}
      </div>
      <p role="status" className="visually-hidden">
        {said}
      </p>
    </div>
  )
}
