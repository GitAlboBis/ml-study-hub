// Lettura della nota illustrativa: i titoli che fanno da indice del foglio e la sezione in lettura.
// Sta fuori da Toc.tsx perché i file dei componenti esportano solo componenti.
import { useEffect, useRef, useState } from 'react'

export interface TocHeading {
  /** slug di rehype-slug: l'id del titolo */
  id: string
  text: string
  level: 2 | 3
}

/** I titoli h2 e h3 con id dentro la nota illustrativa, nell'ordine del documento. */
export function collectHeadings(root: ParentNode): TocHeading[] {
  return Array.from(root.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]')).map((h) => ({
    id: h.id,
    text: (h.textContent ?? '').trim(),
    level: h.tagName === 'H2' ? 2 : 3,
  }))
}

/**
 * La sezione in lettura: l'ultimo titolo entrato nella fascia alta della finestra (il 40% sotto il bordo).
 * Se il titolo in lettura esce dalla fascia verso il basso (stai tornando su) vale quello prima.
 * Senza IntersectionObserver non evidenzia nulla.
 */
export function useReadingSection(ids: readonly string[], onRead?: (id: string) => void): string | null {
  const [active, setActive] = useState<string | null>(null)
  const activeRef = useRef<string | null>(null)
  const onReadRef = useRef(onRead)
  useEffect(() => {
    onReadRef.current = onRead
  })
  const key = ids.join('\n')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const els = key
      .split('\n')
      .map((id) => (id ? document.getElementById(id) : null))
      .filter((el): el is HTMLElement => el !== null)
    if (els.length === 0) return
    const order = new Map<Element, number>(els.map((el, i) => [el, i]))
    const observer = new IntersectionObserver(
      (entries) => {
        let next: string | null = null
        for (const e of entries) {
          const i = order.get(e.target) ?? -1
          if (e.isIntersecting) next = e.target.id
          else if (e.target.id === activeRef.current && e.rootBounds && e.boundingClientRect.top >= e.rootBounds.bottom && i > 0) next = els[i - 1].id
        }
        if (next && next !== activeRef.current) {
          activeRef.current = next
          setActive(next)
          onReadRef.current?.(next)
        }
      },
      { rootMargin: '0px 0px -60% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [key])

  return active
}
