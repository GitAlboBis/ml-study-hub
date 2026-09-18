// La shell dell'app: collegamento per saltare al contenuto, barra superiore, indice dell'atlante (colonna
// comprimibile da 1024 px, cassetto modale sotto), palette di ricerca con Ctrl+K e l'<Outlet /> delle pagine.
// È il Component della rotta radice (src/router.tsx). Le pagine rendono il proprio <main>: la shell le avvolge
// in #contenuto, il bersaglio del collegamento "Salta al contenuto".
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation, useMatches } from 'react-router'
import type { RouteHandle } from '../../router'
import { documentTitle } from '../../lib/useDocumentTitle'
import { CommandPalette } from '../ui/CommandPalette'
import { closeDialog, useModalDialog } from '../ui/useModalDialog'
import { BTN_SECONDARY, Icon } from '../content/shared'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/** Chiave in localStorage: "chiuso" se l'indice è stato compresso sugli schermi larghi. */
export const INDEX_KEY = 'ml-study-index'

function readIndexOpen(): boolean {
  try {
    return localStorage.getItem(INDEX_KEY) !== 'chiuso'
  } catch {
    return true
  }
}

function saveIndexOpen(open: boolean) {
  try {
    if (open) localStorage.removeItem(INDEX_KEY)
    else localStorage.setItem(INDEX_KEY, 'chiuso')
  } catch {
    // storage non disponibile: la scelta vale per questa sessione
  }
}

/** Il cassetto dell'indice sugli schermi stretti: entra da sinistra, si chiude con Esc, col fondale o scegliendo un foglio. */
function IndexDrawer({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useModalDialog(dialog)
  const requestClose = () => closeDialog(dialog.current, onClose)

  return (
    <dialog
      ref={dialog}
      aria-label="Indice dell'atlante"
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        e.preventDefault()
        requestClose()
      }}
      onClick={(e) => e.target === e.currentTarget && requestClose()}
      className="m-0 h-dvh max-h-none w-[min(22rem,calc(100vw-3rem))] max-w-none overflow-y-auto overscroll-contain border-r border-border-strong bg-surface p-0 text-text shadow-2 transition-[translate] duration-[var(--dur-base)] ease-[var(--ease-out)] backdrop:bg-bg/75 motion-safe:starting:-translate-x-full"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border-strong bg-surface px-4 py-2">
        <p className="m-0 flex items-baseline gap-2">
          <span className="font-display text-[1.5rem] leading-none font-extrabold tracking-wide uppercase">Atlante</span>
          <span className="label">ML Study Hub</span>
        </p>
        <button type="button" aria-label="Chiudi l'indice" onClick={requestClose} className={`${BTN_SECONDARY} min-h-10 px-3`}>
          <Icon name="cross" size={18} />
          Chiudi
        </button>
      </div>
      <Sidebar onNavigate={requestClose} />
    </dialog>
  )
}

export function AppShell() {
  const indexId = useId()
  const [indexOpen, setIndexOpen] = useState(readIndexOpen)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { pathname } = useLocation()

  // cambiando pagina (anche con Indietro del browser) il cassetto non resta aperto sul foglio nuovo
  const [seenPath, setSeenPath] = useState(pathname)
  if (seenPath !== pathname) {
    setSeenPath(pathname)
    setDrawerOpen(false)
  }

  // Ctrl+K (⌘K sul Mac) apre la ricerca da qualsiasi punto, anche da dentro un campo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 'k') return
      e.preventDefault()
      setPaletteOpen(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // titolo della rotta; le pagine che ne sanno di più lo sovrascrivono (useDocumentTitle gira dopo)
  const matches = useMatches()
  const routeTitle = matches.map((m) => (m.handle as RouteHandle | undefined)?.title).filter(Boolean).at(-1)
  useLayoutEffect(() => {
    document.title = documentTitle(routeTitle)
  }, [routeTitle, pathname])

  return (
    <div className="min-h-dvh bg-bg text-text">
      <a
        href="#contenuto"
        className="label sr-only z-50 bg-accent px-4 py-3 text-accent-contrast no-underline focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Salta al contenuto
      </a>
      <TopBar
        indexId={indexId}
        indexOpen={indexOpen}
        onToggleIndex={() => {
          setIndexOpen(!indexOpen)
          saveIndexOpen(!indexOpen)
        }}
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenSearch={() => setPaletteOpen(true)}
      />
      <div className="flex items-start">
        <aside
          id={indexId}
          hidden={!indexOpen}
          className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-80 shrink-0 overflow-y-auto overscroll-contain border-r border-border-strong bg-surface lg:block"
        >
          <Sidebar />
        </aside>
        <div id="contenuto" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none focus-visible:outline-none">
          <Outlet />
        </div>
      </div>
      {drawerOpen && <IndexDrawer onClose={() => setDrawerOpen(false)} />}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <ScrollRestoration />
    </div>
  )
}
