// Aiuti per i test dei widget del foglio m09 scritti a mano (lotto "dal conteggio al bias"). Solo per i test:
// nessun file dell'app lo importa.
import katex from 'katex'
import { screen } from '@testing-library/react'
import { vi } from 'vitest'
import { renderRich } from '../../lib/rich'

/** matchMedia finto: con `matches` vero la preferenza di moto ridotto è attiva e i passi sono istantanei. */
export function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' && matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }))
}

/** Un pulsante per il suo testo (senza calcolare il nome di tutti i pulsanti: il MathML rompe jsdom). */
export const button = (text: string | RegExp) => screen.getByText(text, { selector: 'button' })

export const VAL = /\\val(?:\[\d+\])?\{([^{}]+)\}/g

/** I nomi dei segnaposto \val{…} di una formula viva. */
export const valNames = (tex: string): string[] => [...tex.matchAll(VAL)].map((m) => m[1])

/** La formula viva compila con KaTeX in modalità severa, con i segnaposto riempiti. */
export function expectTexCompiles(tex: string): void {
  katex.renderToString(tex.replace(VAL, '1.23'), { displayMode: true, throwOnError: true })
}

/** Un testo Markdown con matematica compila senza errori di KaTeX. */
export function expectRichCompiles(text: string): void {
  renderRich(text, { throwOnError: true })
}

/** La lettura di un Readout (il numero mostrato), cercata per etichetta. */
export function readoutText(label: RegExp | string): string {
  const root = screen.getByText(label, { selector: '.label' }).closest('div')
  return root?.querySelector('output > span[aria-hidden="true"]')?.textContent ?? ''
}
