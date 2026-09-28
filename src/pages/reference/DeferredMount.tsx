// Montaggio differito di un blocco lungo (le formule di un foglio, una lettera del glossario): finché è lontano
// dallo schermo resta un segnaposto alto quanto si stima, poi si monta e non si smonta più (filtrare nasconde,
// non smonta: KaTeX non si ricalcola a ogni tasto). Senza IntersectionObserver (jsdom, browser vecchi) monta
// subito; con `force` o con MountAllContext (la stampa) anche.
import { useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { MountAllContext } from './mountAll'

interface DeferredMountProps {
  /** altezza stimata del blocco, in CSS: tiene la barra di scorrimento vicina al vero */
  estimate: string
  /** monta subito: l'ancora dell'indirizzo punta qui dentro */
  force?: boolean
  children: ReactNode
}

export function DeferredMount({ estimate, force = false, children }: DeferredMountProps) {
  const all = useContext(MountAllContext)
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined')
  const placeholder = useRef<HTMLDivElement>(null)
  // una volta montato resta montato, anche quando force o la stampa tornano falsi
  if ((all || force) && !seen) setSeen(true)
  const mounted = seen || all || force

  useEffect(() => {
    if (mounted || !placeholder.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        setSeen(true)
        observer.disconnect()
      },
      // un paio di schermate di anticipo: chi scorre non vede mai il segnaposto
      { rootMargin: '1600px 0px' },
    )
    observer.observe(placeholder.current)
    return () => observer.disconnect()
  }, [mounted])

  if (mounted) return <>{children}</>
  return <div ref={placeholder} aria-hidden="true" style={{ minHeight: estimate }} />
}
