// FLIP (First, Last, Invert, Play) per DragBins e Sortable: quando un elemento cambia posto nella pagina, parte
// da dove si vedeva e scivola nel posto nuovo, invece di saltarci. Serve alla continuità dello spazio: si vede
// dove è andata la carta.
//
// Uso: `capture()` subito PRIMA di cambiare lo stato (misura dove si vedono ora gli elementi [data-flip-id] dentro
// la radice, trasformazioni comprese: una carta trascinata parte da sotto il dito), poi il cambio di stato; dopo il
// render un effetto di layout misura i posti nuovi e anima la differenza con la Web Animations API.
//
// - Solo transform, 180 ms, ease-out (--ease-out dei token): un'animazione di risposta, sotto i 300 ms.
// - Una lettura per elemento prima e una dopo, nessuna scrittura in mezzo: niente letture e scritture alternate.
// - Con prefers-reduced-motion, o dove la Web Animations API manca (jsdom), l'elemento è subito al suo posto.
import { useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useReducedMotion } from '../../kit/useReducedMotion'

const DURATION_MS = 180
const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

export function useFlip(root: RefObject<HTMLElement | null>): () => void {
  const reduced = useReducedMotion()
  const before = useRef<Map<string, DOMRect> | null>(null)

  // una funzione nuova a ogni render va bene: si chiama nei gestori degli eventi, non entra in dipendenze
  const capture = () => {
    const el = root.current
    if (el === null || reduced) return
    const map = new Map<string, DOMRect>()
    for (const node of el.querySelectorAll<HTMLElement>('[data-flip-id]')) map.set(node.dataset.flipId ?? '', node.getBoundingClientRect())
    before.current = map
  }

  // dopo ogni render: se c'è una misura presa prima del cambio, si anima la differenza e la si consuma
  useLayoutEffect(() => {
    const first = before.current
    const el = root.current
    if (first === null || el === null) return
    before.current = null
    const nodes = [...el.querySelectorAll<HTMLElement>('[data-flip-id]')]
    const last = nodes.map((n) => n.getBoundingClientRect())
    nodes.forEach((node, i) => {
      const from = first.get(node.dataset.flipId ?? '')
      if (from === undefined || typeof node.animate !== 'function') return
      const dx = from.left - last[i].left
      const dy = from.top - last[i].top
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
      node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: DURATION_MS, easing: EASE_OUT })
    })
  })

  return capture
}
