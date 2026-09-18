// Aiuti per i test dei widget del foglio m09 su bias, varianza e consistenza (solo test: l'app non li importa).
import katex from 'katex'
import { vi } from 'vitest'
import { renderRich } from '../../../lib/rich'

/** matchMedia finta: `matches` vale per la sola query di prefers-reduced-motion. */
export function stubReducedMotion(matches: boolean): void {
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

const VAL = /\\val(?:\[\d+\])?\{([^{}]+)\}/g

/** I nomi dei segnaposto \val{…} di una formula viva. */
export const valNames = (tex: string): string[] => [...tex.matchAll(VAL)].map((m) => m[1].trim())

/** La formula viva, con i segnaposto riempiti, compila in KaTeX severo (display). */
export function compileLive(tex: string): void {
  katex.renderToString(tex.replace(VAL, '1.23'), { displayMode: true, throwOnError: true })
}

/** Un testo Markdown con $…$ compila senza errori di KaTeX. */
export function compileRich(text: string): void {
  renderRich(text, { throwOnError: true })
}

/** Testo di tutte le formule KaTeX visibili nel documento. */
export const mathText = (): string => [...document.querySelectorAll('.katex-html')].map((el) => el.textContent ?? '').join(' ')
