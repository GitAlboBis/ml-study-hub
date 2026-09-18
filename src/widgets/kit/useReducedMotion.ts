// Preferenza di sistema "riduci il movimento" (prefers-reduced-motion), letta in modo reattivo.
// Non si usa useReducedMotion di motion/react: restituisce boolean | null e non fa ri-renderizzare
// il componente quando la preferenza cambia a pagina aperta. Qui la media query è uno store esterno
// letto con useSyncExternalStore: valore giusto dal primo render, aggiornato al cambio, un solo
// ascoltatore per componente tolto allo smontaggio.
//
// La MediaQueryList è una sola per tutta l'app, creata la prima volta che serve: useSyncExternalStore
// legge lo snapshot almeno due volte per render, e crearne una nuova a ogni lettura voleva dire centinaia
// di media query durante un trascinamento. Si ricrea solo se window.matchMedia cambia (i test la sostituiscono).
import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

let source: typeof window.matchMedia | undefined
let cached: MediaQueryList | null = null

/** matchMedia manca in jsdom e in qualche browser vecchio: in quel caso il movimento resta attivo. */
function mediaQuery(): MediaQueryList | null {
  const matchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia : undefined
  if (matchMedia !== source) {
    source = matchMedia
    cached = matchMedia ? matchMedia.call(window, QUERY) : null
  }
  return cached
}

function subscribe(onChange: () => void): () => void {
  const mql = mediaQuery()
  if (mql === null) return () => {}
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = (): boolean => mediaQuery()?.matches ?? false
const getServerSnapshot = (): boolean => false

/** true se l'utente ha chiesto meno movimento: le animazioni vanno sostituite con stati a passi. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
