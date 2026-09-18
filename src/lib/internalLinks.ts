import type { MouseEvent } from 'react'
import type { NavigateFunction } from 'react-router'

/**
 * Rimandi interni scritti nel Markdown dei contenuti:
 * - `[testo](#derivation:der04)` punta a un elemento del foglio (le ancore sono quelle di targetId). Se l'elemento è
 *   sulla scheda aperta ci si scorre; altrimenti si apre la scheda Teoria dello stesso foglio con l'ancora.
 * - `[testo](/m/m08-non-parametrica-knn/teoria#...)` è un percorso dell'app e passa dal router, senza ricaricare.
 */
export function followInternalLink(event: MouseEvent<HTMLElement>, navigate: NavigateFunction) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const anchor = (event.target as HTMLElement).closest?.('a')
  const href = anchor?.getAttribute('href')
  if (!anchor || !href || anchor.target === '_blank') return
  if (href.startsWith('#')) {
    const target = document.getElementById(decodeURIComponent(href.slice(1)))
    event.preventDefault()
    if (target) {
      target.scrollIntoView?.({ block: 'start' })
      if (target.tabIndex >= 0 || target.hasAttribute('tabindex')) target.focus({ preventScroll: true })
      return
    }
    const module = /^\/m\/([^/]+)/.exec(window.location.pathname)?.[1]
    if (module) navigate(`/m/${module}/teoria${href}`)
    return
  }
  if (href.startsWith('/')) {
    event.preventDefault()
    navigate(href)
  }
}
