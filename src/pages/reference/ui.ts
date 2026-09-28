// Classi e costanti delle pagine di consultazione (formulario, glossario). Solo costanti: i file dei componenti
// restano solo componenti.
import type { Importance } from '../../lib/formulario'

/** Il foglio della pagina: stessa larghezza e stessi margini della copertina. */
export const PAGE = '@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24'

/** La squadratura della cornice: una sola, quella delle pagine globali. */
export { TICKS } from '../global/ui'

/** Campo di ricerca: bordo a inchiostro, spazio a sinistra per la lente, niente crocetta nativa (c'è la nostra). */
export const SEARCH_INPUT =
  'min-h-11 w-full border border-border-strong bg-surface py-2 pr-12 pl-10 text-text placeholder:text-faint ' +
  '[&::-webkit-search-cancel-button]:appearance-none'

/** Etichetta di un gruppo di filtri, sulla stessa riga dei pulsanti. */
export const FILTER_LABEL = 'label m-0 min-w-24'

/** Collegamento "nel foglio": un tassello d'inchiostro che al passaggio si inverte, come le azioni. */
export const SHEET_LINK =
  'label inline-flex min-h-10 items-center gap-2 border border-border-strong bg-surface-2 px-3 text-text no-underline ' +
  'transition-[background-color,color] duration-[var(--dur-fast)] ease-out hover:bg-accent hover:text-accent-contrast'

/** Lo stesso, appeso sotto una cornice come una linguetta: senza filo sopra, attaccato al bordo della cornice. */
export const HANGING_TAB = `${SHEET_LINK} border-t-0`

/** Importanza di una formula: 3 è l'unica definita dal contratto dei contenuti (da scrivere a memoria all'orale). */
export const IMPORTANCE_INFO: Record<Importance, { short: string; long: string }> = {
  3: { short: 'A memoria', long: "Importanza 3 su 3: da saper scrivere a memoria all'orale" },
  2: { short: 'Importanti', long: 'Importanza 2 su 3' },
  1: { short: 'Di contorno', long: 'Importanza 1 su 3: formule di supporto' },
}
