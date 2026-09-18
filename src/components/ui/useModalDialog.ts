// Dialoghi modali con l'elemento nativo <dialog> aperto da showModal(): il fuoco resta dentro, il resto della
// pagina diventa inerte, Esc chiude e il dialogo sta nel top layer senza z-index. Alla chiusura il browser
// riporta il fuoco a chi l'aveva prima. Lo usano il cassetto dell'indice e la palette di ricerca.
// jsdom non ha showModal né close: lì basta l'attributo open e la chiusura richiama subito onClose.
import { useEffect } from 'react'
import type { RefObject } from 'react'

/** Apre come modale il <dialog> appena montato. */
export function useModalDialog(ref: RefObject<HTMLDialogElement | null>): void {
  useEffect(() => {
    const el = ref.current
    if (!el || el.open) return
    if (typeof el.showModal === 'function') el.showModal()
    else el.setAttribute('open', '')
  }, [ref])
}

/** Chiude il dialogo: dove esiste close() lo fa il browser, che poi emette l'evento close (e quindi onClose). */
export function closeDialog(el: HTMLDialogElement | null, onClose: () => void): void {
  if (el && el.open && typeof el.close === 'function' && typeof el.showModal === 'function') el.close()
  else onClose()
}
