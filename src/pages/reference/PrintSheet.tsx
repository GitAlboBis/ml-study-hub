// Stampa pulita delle pagine di consultazione (formulario, glossario). Finché la pagina è montata:
// - un foglio di stile per la stampa toglie la shell (barra, indice, salto al contenuto) e stampa i campi di
//   colore delle regioni anche con "grafica di sfondo" spenta;
// - prima di stampare il documento passa al tema giorno (i token notte darebbero testo chiaro su carta bianca)
//   e dopo torna com'era; `onBeforePrint` serve a montare i blocchi ancora differiti.
// La shell non si tocca: il foglio di stile la riconosce dalla struttura attorno a #contenuto.
import { useEffect, useRef } from 'react'

const PRINT_CSS = `
@media print {
  @page { margin: 14mm 12mm; }
  div:has(> div > #contenuto) > :not(:has(#contenuto)),
  div:has(> #contenuto) > :not(#contenuto) { display: none !important; }
  main[data-print-page] {
    max-width: none !important;
    padding: 0 !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}`

export function PrintSheet({ onBeforePrint }: { onBeforePrint?: () => void }) {
  const before = useRef(onBeforePrint)
  useEffect(() => {
    before.current = onBeforePrint
  })

  useEffect(() => {
    const root = document.documentElement
    let previous: string | null = null
    let switched = false
    const onBefore = () => {
      if (!switched) {
        previous = root.getAttribute('data-theme')
        switched = true
      }
      root.setAttribute('data-theme', 'light')
      before.current?.()
    }
    const onAfter = () => {
      if (!switched) return
      if (previous === null) root.removeAttribute('data-theme')
      else root.setAttribute('data-theme', previous)
      switched = false
    }
    window.addEventListener('beforeprint', onBefore)
    window.addEventListener('afterprint', onAfter)
    return () => {
      window.removeEventListener('beforeprint', onBefore)
      window.removeEventListener('afterprint', onAfter)
      onAfter()
    }
  }, [])

  return <style data-print-sheet="">{PRINT_CSS}</style>
}
