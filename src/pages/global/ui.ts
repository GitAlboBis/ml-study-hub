// Classi condivise dalle pagine globali dell'atlante (copertura, progressi, impostazioni). Solo costanti:
// i file dei componenti restano solo componenti.
import type { CSSProperties } from 'react'

/** Il foglio di una pagina globale: stesso reticolo della copertina e del foglio di modulo. */
export const PAGE = '@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24'

/** Titolo di sezione (h2): condensato, con il filo d'inchiostro spesso sopra, come nella copertina. */
export const H2 = 'm-0 flex flex-wrap items-baseline gap-x-3 border-t-2 border-border-strong pt-3 font-label text-[length:var(--step-2)] leading-tight font-bold'

/** Titolo a etichetta (h3) dentro una sezione. */
export const H3 = 'label m-0 text-text'

// Una sola testata per tutte le pagine globali (copertina, mappa, regioni, flashcard, quiz, orale, giochi,
// formulario, glossario, progressi, copertura, impostazioni): cambiano i contenuti, non le misure.

/** Il nome della pagina nell'h1: maiuscolo extra condensato, la stessa misura in tutte le pagine globali. */
export const PAGE_TITLE = 'block font-display text-[length:var(--step-5)] leading-[0.82] font-extrabold uppercase'

/** La riga italiana sotto il nome, dentro lo stesso h1. */
export const PAGE_SUBTITLE = 'mt-3 block font-label text-[length:var(--step-3)] leading-tight font-bold'

/**
 * Variante compatta dell'orale durante la prova: la testata diventa una riga, perché la domanda deve stare nel primo
 * schermo. È l'unica testata di un'altra misura, e solo finché la prova è in corso.
 */
export const PAGE_TITLE_COMPACT = 'font-display text-[length:var(--step-4)] leading-[0.9] font-extrabold uppercase'

/** Le letture della testata (coordinate e cifre), a destra; sotto il titolo su schermo stretto. */
export const HEAD_READINGS =
  'm-0 grid grid-cols-[auto_minmax(0,1fr)] content-end items-baseline gap-x-4 gap-y-1.5 border-t border-border pt-4 text-[length:var(--step--1)] ' +
  '@3xl:border-t-0 @3xl:border-l @3xl:pt-0 @3xl:pl-6'

/** Squadratura della cornice: tacche corte ogni 16 px e lunghe ogni 64, come sul bordo di una carta. L'unica copia. */
export const TICKS: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(90deg, var(--border-strong) 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, var(--border-strong) 0 1px, transparent 1px 16px)',
  backgroundSize: '100% 100%, 100% 45%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'left bottom',
}

/** Campo di testo e di scelta nativi nel mondo del foglio. */
export const FIELD = 'min-h-10 border border-border-strong bg-surface px-2 text-text'
export const SELECT = `${FIELD} cursor-pointer font-label font-semibold`

/** Tabella da registro: filetti a inchiostro, cifre allineate a destra. */
export const TABLE = 'w-full border-collapse text-left text-[length:var(--step--1)] [&_td]:border-t [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2'
export const TH = 'label border-b-2 border-border-strong align-bottom font-semibold'
export const NUM_CELL = 'num text-right whitespace-nowrap'
