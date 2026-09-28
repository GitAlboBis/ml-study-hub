// Le pagine globali dell'atlante come le mostrano l'indice (Sidebar) e la barra superiore (TopBar).
// I nomi sono quelli delle testate delle pagine e della palette di ricerca (PAGES in src/lib/search.ts).
// I glifi sono tracciati della stessa mano delle icone del foglio: griglia 24, tratto 2, estremità squadrate;
// li disegna NavGlyph di marks.tsx.

/** Gruppi dell'indice: il rilievo sul campo, i volumi da consultare, il registro di chi studia. */
export type DestinationGroup = 'atlante' | 'campo' | 'consultazione' | 'registro'

export interface Destination {
  to: string
  /** nome nell'indice */
  label: string
  /** nome corto nella barra superiore; senza, la pagina non ci sta */
  short?: string
  group: DestinationGroup
  /** attributo d del tracciato SVG */
  glyph: string
}

export const DESTINATIONS: readonly Destination[] = [
  // quadro d'unione: la carta divisa nei suoi fogli
  { to: '/mappa', label: 'Mappa del corso', short: 'Mappa', group: 'atlante', glyph: 'M3 5h18v14H3zM9 5v14M15 5v14M3 12h18' },
  // due carte una sull'altra
  { to: '/flashcard', label: 'Flashcard', short: 'Flashcard', group: 'campo', glyph: 'M3 9h13v11H3zM7 9V5h14v11h-5' },
  // una lista di voci spuntate
  { to: '/quiz', label: 'Quiz', short: 'Quiz', group: 'campo', glyph: 'M4 7l2 2 3.5-3.5M13 7.5h7M4 16l2 2 3.5-3.5M13 16.5h7' },
  // microfono: si risponde ad alta voce
  { to: '/orale', label: 'Orale', short: 'Orale', group: 'campo', glyph: 'M9 3h6v10H9zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8' },
  // un dado
  { to: '/giochi', label: 'Giochi', short: 'Giochi', group: 'campo', glyph: 'M4 4h16v16H4zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01' },
  // sommatoria: le formule
  { to: '/formulario', label: 'Formulario', short: 'Formulario', group: 'consultazione', glyph: 'M18 5H6l6 7-6 7h12' },
  // volume aperto: i termini
  { to: '/glossario', label: 'Glossario', short: 'Glossario', group: 'consultazione', glyph: 'M3 5h7l2 2 2-2h7v14h-7l-2 2-2-2H3zM12 7v14' },
  // profilo altimetrico: quanto hai rilevato
  { to: '/progressi', label: 'Progressi', group: 'registro', glyph: 'M3 20h18M3 16l5-6 4 4 4-7 5 6' },
  // pagina spuntata: ogni concetto delle fonti ha il suo posto
  { to: '/copertura', label: 'Copertura', group: 'registro', glyph: 'M6 3h9l4 4v14H6zM15 3v4h4M9 14l2 2 4-4' },
  // cursori
  { to: '/impostazioni', label: 'Impostazioni', group: 'registro', glyph: 'M4 7h8M16 7h4M14 4v6M4 17h4M12 17h8M10 14v6' },
]

export const GROUP_LABEL: Record<Exclude<DestinationGroup, 'atlante'>, string> = {
  campo: 'Sul campo',
  consultazione: 'Consultazione',
  registro: 'Registro',
}

export const inGroup = (group: DestinationGroup) => DESTINATIONS.filter((d) => d.group === group)

/** La barra superiore: prima ciò che si consulta, poi il lavoro sul campo. */
export const BAR_GROUPS: readonly Destination[][] = [
  ['/mappa', '/formulario', '/glossario'],
  ['/flashcard', '/quiz', '/orale', '/giochi'],
].map((paths) => paths.map((p) => DESTINATIONS.find((d) => d.to === p)!))
