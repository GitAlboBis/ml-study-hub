// Pagina segnaposto della Fase 3: ogni rotta di src/router.tsx la carica finché la Fase 5 non monta la
// pagina vera. Mostra il titolo della rotta e i parametri letti dall'URL, e permette di girare tra le rotte.
// Da eliminare a fine Fase 5; RouteError va allora spostato accanto all'AppShell.
import { isRouteErrorResponse, Link, useLocation, useMatches, useParams, useRouteError } from 'react-router'
import type { RouteHandle } from '../router'

const LINKS: [to: string, label: string][] = [
  ['/', 'Home'],
  ['/mappa', 'Mappa'],
  ['/corso/melgani', 'Corso'],
  ['/m/m09-parzen-windows', 'Modulo'],
  ['/m/m09-parzen-windows/formule', 'Modulo, scheda formule'],
  ['/formulario', 'Formulario'],
  ['/flashcard', 'Flashcard'],
  ['/quiz', 'Quiz'],
  ['/orale', 'Orale'],
  ['/giochi', 'Giochi'],
  ['/giochi/formula-match', 'Un gioco'],
  ['/glossario', 'Glossario'],
  ['/fonti/ch2/12', 'Fonti'],
  ['/lab/parzen-kernel', 'Laboratorio'],
  ['/progressi', 'Progressi'],
  ['/copertura', 'Copertura'],
  ['/impostazioni', 'Impostazioni'],
]

export default function Placeholder() {
  const { pathname } = useLocation()
  const params = Object.entries(useParams()).filter(([name]) => name !== '*')
  const title = (useMatches().at(-1)?.handle as RouteHandle | undefined)?.title ?? pathname

  return (
    <main>
      <h1>{title}</h1>
      <p>
        Pagina in costruzione. Percorso: <code>{pathname}</code>
      </p>
      {params.length > 0 && (
        <ul aria-label="Parametri della rotta">
          {params.map(([name, value]) => (
            <li key={name}>
              <code>{name}</code> = <code>{value ?? '(assente)'}</code>
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="Rotte dell'app">
        <ul>
          {LINKS.map(([to, label]) => (
            <li key={to}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  )
}

/** ErrorBoundary delle rotte: 404 lanciati dai loader ed errori di rendering delle pagine. */
export function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <main>
      <h1>{notFound ? 'Pagina non trovata' : 'Qualcosa è andato storto'}</h1>
      <p>
        {notFound
          ? 'Questo indirizzo non corrisponde a nessuna pagina dell\'app.'
          : error instanceof Error
            ? error.message
            : 'Errore imprevisto durante il caricamento della pagina.'}
      </p>
      <p>
        <Link to="/">Torna alla home</Link>
      </p>
    </main>
  )
}
