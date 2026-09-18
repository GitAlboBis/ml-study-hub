// Classi condivise dalle schede della pagina modulo. Solo costanti: i file dei componenti restano solo componenti.

/** Titolo di sezione di una scheda (h2): condensato, con il filo d'inchiostro sopra come le sezioni della nota. */
export const TAB_H2 = 'm-0 border-t border-border-strong pt-3 font-label text-[length:var(--step-2)] leading-tight font-bold'

/** Sottotitolo a etichetta (h3) dentro una sezione. */
export const TAB_H3 = 'label m-0 mt-5 mb-2'

/** Colonne della scheda con il margine a destra: prosa + apparato, da 1024 px di contenitore. */
export const WITH_MARGIN = 'grid gap-10 @5xl:grid-cols-[minmax(0,1fr)_16rem] @5xl:gap-12'

/** Campo di scelta nativo (select) nel mondo del foglio. */
export const SELECT = 'min-h-10 cursor-pointer border border-border-strong bg-surface px-2 font-label font-semibold text-text'
