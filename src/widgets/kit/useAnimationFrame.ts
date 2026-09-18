// Ciclo di requestAnimationFrame per le animazioni dei widget, con tre garanzie:
// 1. ha sempre una condizione di arresto: gira solo con `active` vero, a scheda visibile e con il
//    widget in vista (un modulo ha 20-34 widget: quelli fuori schermo o in un pannello chiuso non
//    devono consumare fotogrammi);
// 2. il callback vive in un ref: chi lo cambia a ogni render non fa ripartire il ciclo e non resta
//    mai attaccato a una chiusura vecchia;
// 3. il tempo non salta: il primo fotogramma dopo ogni (ri)partenza fa solo da riferimento (dt = 0)
//    e un fotogramma in ritardo conta al massimo MAX_DT_MS.
//
// VISTA. L'elemento da guardare è `target` oppure, se manca, quello del contesto WidgetElementContext:
// il riquadro di <Widget> nel foglio o la sezione del WidgetFrame. Un solo IntersectionObserver per
// tutta l'app; un elemento nascosto (hidden, display: none) non interseca mai, quindi un widget dentro
// un Reveal chiuso resta fermo. Dove IntersectionObserver manca (jsdom) si considera tutto in vista.
import { useContext, useEffect, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { WidgetElementContext } from './widgetContext'

/**
 * Tetto al dt di un fotogramma. Se il thread resta bloccato (calcolo pesante, debugger) il fotogramma
 * dopo arriva con secondi di ritardo: contarli tutti farebbe saltare un passo della spiegazione o
 * esplodere una simulazione. Oltre questa soglia l'animazione rallenta invece di saltare.
 */
const MAX_DT_MS = 100

/** Margine attorno alla finestra: l'animazione riparte poco prima che il widget rientri in vista. */
const VIEW_MARGIN = '200px 0px'

// --- un solo IntersectionObserver per tutti i cicli ---

type VisibilityListener = (visible: boolean) => void
interface Watched {
  visible: boolean
  listeners: Set<VisibilityListener>
}

let observer: IntersectionObserver | null = null
const watched = new Map<Element, Watched>()

/** Avvisa `listener` quando `el` entra o esce dalla vista; subito, se è già noto che è fuori. */
function watchVisibility(el: Element, listener: VisibilityListener): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {}
  let entry = watched.get(el)
  if (entry === undefined) {
    entry = { visible: true, listeners: new Set() }
    watched.set(el, entry)
    observer ??= new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const w = watched.get(e.target)
          if (w === undefined || w.visible === e.isIntersecting) continue
          w.visible = e.isIntersecting
          for (const l of [...w.listeners]) l(w.visible)
        }
      },
      { rootMargin: VIEW_MARGIN },
    )
    observer.observe(el)
  }
  const current = entry
  current.listeners.add(listener)
  if (!current.visible) listener(false)
  return () => {
    current.listeners.delete(listener)
    if (current.listeners.size > 0) return
    watched.delete(el)
    observer?.unobserve?.(el)
    if (watched.size === 0) {
      observer?.disconnect()
      observer = null
    }
  }
}

/**
 * Chiama `cb(dtMs, tMs)` a ogni fotogramma finché `active` è vero.
 * - `dtMs`: millisecondi dal fotogramma precedente, tra 0 e 100.
 * - `tMs`: tempo attivo accumulato dal montaggio (somma dei dt): non conta le pause né il tempo
 *   passato a scheda nascosta o fuori dalla vista, e non si azzera quando `active` torna vero.
 * - `target`: l'elemento la cui visibilità ferma e fa ripartire il ciclo; predefinito quello del widget
 *   (WidgetElementContext). A scheda nascosta (visibilitychange) o con l'elemento fuori dalla vista il
 *   ciclo si ferma e riparte da solo quando torna visibile.
 */
export function useAnimationFrame(cb: (dtMs: number, tMs: number) => void, active: boolean, target?: RefObject<Element | null>): void {
  const cbRef = useRef(cb)
  // Effetto di layout senza dipendenze: il ref è aggiornato prima che possa scattare un fotogramma.
  useLayoutEffect(() => {
    cbRef.current = cb
  })

  const elapsedRef = useRef(0)
  const frame = useContext(WidgetElementContext)
  const view = target ?? frame

  useEffect(() => {
    if (!active) return
    let raf = 0 // 0 = nessun fotogramma richiesto (gli id veri sono sempre positivi)
    let last: number | null = null
    let inView = true

    const tick = (now: number) => {
      const dt = last === null ? 0 : Math.min(Math.max(now - last, 0), MAX_DT_MS)
      last = now
      elapsedRef.current += dt
      // Si prenota prima di chiamare il callback: se il callback porta a fermare il ciclo,
      // l'id da annullare è già quello giusto.
      raf = requestAnimationFrame(tick)
      cbRef.current(dt, elapsedRef.current)
    }
    const start = () => {
      if (raf !== 0 || document.hidden || !inView) return
      last = null
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      if (raf !== 0) cancelAnimationFrame(raf)
      raf = 0
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    document.addEventListener('visibilitychange', onVisibility)
    const el = view?.current ?? null
    const unwatch =
      el === null
        ? () => {}
        : watchVisibility(el, (visible) => {
            inView = visible
            if (visible) start()
            else stop()
          })
    start()
    return () => {
      unwatch()
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
    }
  }, [active, view])
}
