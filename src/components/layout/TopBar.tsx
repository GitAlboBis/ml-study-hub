// Barra superiore della shell: indice (cassetto su schermi stretti, colonna comprimibile da 1024 px),
// marchio che riporta alla copertina, campo di ricerca che apre la palette (Ctrl+K) e interruttore del tema.
// Resta sopra il foglio mentre scorre: è l'unica cosa che si sovrappone, ma la separa un filo d'inchiostro, non un'ombra.
import { Link } from 'react-router'
import { ThemeToggle } from './ThemeToggle'

const ICON_BTN =
  'size-10 cursor-pointer items-center justify-center border border-border-strong text-text ' +
  'transition-[background-color,color] duration-[var(--dur-fast)] ease-out hover:bg-accent hover:text-accent-contrast active:translate-y-px'

// Glifi della barra: stessa mano delle icone del foglio (griglia 24, tratto 2, estremità squadrate)
function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  )
}
const INDEX_GLYPH = 'M4 6h16M4 12h16M4 18h10'
// una colonna chiusa o aperta accanto al foglio
const PANEL_OPEN_GLYPH = 'M3 4h18v16H3zM9 4v16M5.5 8h1.5M5.5 11h1.5'
const PANEL_CLOSED_GLYPH = 'M3 4h18v16H3zM9 4v16M13 12h5M15.5 9.5l2.5 2.5-2.5 2.5'
const SEARCH_GLYPH = 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5L21 21'

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

interface TopBarProps {
  /** id della colonna dell'indice, per aria-controls */
  indexId: string
  indexOpen: boolean
  onToggleIndex: () => void
  onOpenDrawer: () => void
  onOpenSearch: () => void
}

export function TopBar({ indexId, indexOpen, onToggleIndex, onOpenDrawer, onOpenSearch }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border-strong bg-bg">
      <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-[var(--sheet-gutter)] py-2">
        <button type="button" aria-label="Apri l'indice" aria-haspopup="dialog" onClick={onOpenDrawer} className={`inline-flex lg:hidden ${ICON_BTN}`}>
          <Glyph d={INDEX_GLYPH} />
        </button>
        <button
          type="button"
          aria-label={indexOpen ? "Comprimi l'indice" : "Mostra l'indice"}
          title={indexOpen ? "Comprimi l'indice" : "Mostra l'indice"}
          aria-expanded={indexOpen}
          aria-controls={indexId}
          onClick={onToggleIndex}
          className={`hidden lg:inline-flex ${ICON_BTN}`}
        >
          <Glyph d={indexOpen ? PANEL_OPEN_GLYPH : PANEL_CLOSED_GLYPH} />
        </button>

        <Link to="/" className="hidden items-baseline gap-2 text-text no-underline sm:flex">
          <span className="font-display text-[1.6rem] leading-none font-extrabold tracking-wide uppercase">Atlante</span>
          <span className="label">ML Study Hub</span>
        </Link>

        <button
          type="button"
          onClick={onOpenSearch}
          aria-haspopup="dialog"
          aria-keyshortcuts="Control+K Meta+K"
          className="ml-auto flex min-h-10 min-w-10 cursor-pointer items-center justify-center gap-2 border border-border-strong bg-surface px-2.5 text-muted transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2 sm:w-[min(20rem,34vw)] sm:justify-start"
        >
          <Glyph d={SEARCH_GLYPH} />
          <span className="flex-1 text-left max-sm:sr-only">Cerca nell'atlante</span>
          <kbd className="num hidden border border-border px-1.5 text-[length:var(--step--1)] text-muted sm:inline" aria-hidden="true">
            {isMac() ? '⌘ K' : 'Ctrl K'}
          </kbd>
        </button>

        <ThemeToggle />
      </div>
    </header>
  )
}
