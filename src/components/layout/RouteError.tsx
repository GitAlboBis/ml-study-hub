// ErrorBoundary delle rotte (src/router.tsx): i 404 lanciati dai loader e gli errori di rendering delle pagine.
// Sulla rotta interna viene reso dentro la shell; su quella radice, se si rompe la shell stessa, da solo.
// Prima stava in pages/Placeholder.tsx, che ne conserva una copia finché la pagina segnaposto esiste.
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { HATCH } from '../content/shared'

export function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  const title = notFound ? 'Pagina non trovata' : 'Qualcosa è andato storto'
  useDocumentTitle(title)

  return (
    <main className="mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] py-12">
      <div className="border-2 border-border-strong bg-surface">
        <div className={`grid min-h-40 content-end border-b-2 border-border-strong p-5 ${HATCH}`}>
          <p aria-hidden="true" className="m-0 justify-self-start bg-surface px-2 font-display text-[length:var(--step-5)] leading-[0.85] font-extrabold uppercase">
            {notFound ? 'Fuori carta' : 'Rilievo interrotto'}
          </p>
        </div>
        <div className="grid gap-3 p-5 md:p-8">
          <h1 className="font-label text-[length:var(--step-3)] font-bold">{title}</h1>
          <p className="m-0 max-w-[var(--measure)] text-muted">
            {notFound
              ? "Questo indirizzo non corrisponde a nessun foglio dell'atlante. Forse il collegamento è vecchio o c'è un errore di battitura."
              : error instanceof Error
                ? `La pagina si è fermata per un errore: ${error.message}. Ricarica la pagina; se non basta, torna alla home.`
                : 'La pagina si è fermata durante il caricamento. Ricarica la pagina; se non basta, torna alla home.'}
          </p>
          <p className="m-0">
            <Link to="/">Torna alla home</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
