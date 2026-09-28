// Rotte dell'app (React Router 7, data router).
//
// Ogni rotta con pagina la carica con page(...): una pagina è un modulo con `export default` del componente
// e diventa un chunk separato del bundle.
// L'AppShell è il `Component` della rotta radice e rende <Outlet />. Gli errori e i 404 delle pagine
// si fermano alla rotta interna senza path, quindi vengono resi dentro la shell; quelli della shell stessa
// si fermano alla radice.
import type { ComponentType } from 'react'
import { createBrowserRouter, data, type LoaderFunctionArgs, type RouteObject } from 'react-router'
import { AppShell } from './components/layout/AppShell'
import { RouteError } from './components/layout/RouteError'
import { getModuleMeta, manifest } from './content/manifest'

/** Schede della pagina modulo, nell'ordine in cui compaiono: /m/:moduleId/:tab? */
export const MODULE_TABS = ['riassunto', 'teoria', 'formule', 'laboratorio', 'esercizi', 'flashcard', 'quiz', 'orale', 'fonti'] as const
export type ModuleTab = (typeof MODULE_TABS)[number]
export const isModuleTab = (tab: string): tab is ModuleTab => (MODULE_TABS as readonly string[]).includes(tab)

/** `handle` di ogni rotta con pagina: si legge con useMatches(). */
export interface RouteHandle { title: string }

type PageModule = { default: ComponentType }
const page = (load: () => Promise<PageModule>) => async () => ({ Component: (await load()).default })

// I parametri che si possono controllare con il solo manifest si controllano qui, così le pagine ricevono
// sempre un corso, un modulo e una scheda che esistono. Tutto il resto (pagina della fonte, widget, gioco)
// lo verifica la pagina, che ha i dati per farlo.
const notFound = (): never => { throw data(null, { status: 404 }) }
const courses = new Set<string>(manifest.map((m) => m.course))
const courseLoader = ({ params }: LoaderFunctionArgs) => (courses.has(params.course ?? '') ? null : notFound())
const moduleLoader = ({ params }: LoaderFunctionArgs) =>
  getModuleMeta(params.moduleId ?? '') && (params.tab === undefined || isModuleTab(params.tab)) ? null : notFound()

const pages: RouteObject[] = [
  { index: true, handle: { title: 'Copertina' }, lazy: page(() => import('./pages/Home')) },
  { path: 'mappa', handle: { title: 'Mappa del corso' }, lazy: page(() => import('./pages/CourseMap')) },
  { path: 'corso/:course', loader: courseLoader, handle: { title: 'Corso' }, lazy: page(() => import('./pages/CoursePage')) },
  { path: 'm/:moduleId/:tab?', loader: moduleLoader, handle: { title: 'Foglio' }, lazy: page(() => import('./pages/ModulePage')) },
  { path: 'formulario', handle: { title: 'Formulario' }, lazy: page(() => import('./pages/Formulario')) },
  { path: 'flashcard', handle: { title: 'Flashcard' }, lazy: page(() => import('./pages/Flashcards')) },
  { path: 'quiz', handle: { title: 'Quiz' }, lazy: page(() => import('./pages/QuizArena')) },
  { path: 'orale', handle: { title: 'Simulatore dell\'orale' }, lazy: page(() => import('./pages/OralSimulator')) },
  { path: 'giochi', handle: { title: 'Giochi' }, lazy: page(() => import('./pages/games/GamesHub')) },
  // un gioco sconosciuto lo dice la pagina stessa ("Questo gioco non esiste"), con il ritorno ai giochi
  { path: 'giochi/:game', handle: { title: 'Gioco' }, lazy: page(() => import('./pages/games/Game')) },
  { path: 'glossario', handle: { title: 'Glossario' }, lazy: page(() => import('./pages/Glossary')) },
  { path: 'fonti/:doc/:page', handle: { title: 'Fonti' }, lazy: page(() => import('./pages/SourceViewer')) },
  { path: 'lab/_tavola', handle: { title: 'Tavola dei segni convenzionali' }, lazy: page(() => import('./pages/TokenSpecimen')) },
  { path: 'lab/:widgetId', handle: { title: 'Laboratorio dei widget' }, lazy: page(() => import('./pages/WidgetLab')) }, // anche /lab/_kit (Task 4.4)
  { path: 'progressi', handle: { title: 'Progressi' }, lazy: page(() => import('./pages/Progress')) },
  { path: 'copertura', handle: { title: 'Copertura' }, lazy: page(() => import('./pages/Coverage')) },
  { path: 'impostazioni', handle: { title: 'Impostazioni' }, lazy: page(() => import('./pages/Settings')) },
  // Il loader lancia sempre, quindi questa rotta non rende mai nulla: `element: null` serve solo a evitare
  // l'avviso di React Router sulle rotte foglia senza elemento.
  { path: '*', loader: notFound, element: null },
]

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: AppShell,
    ErrorBoundary: RouteError,
    // Le rotte sono lazy: senza un fallback React Router avvisa in console al primo caricamento.
    hydrateFallbackElement: (
      <p role="status" className="label m-0 p-6">
        Apro l'atlante…
      </p>
    ),
    children: [{ ErrorBoundary: RouteError, children: pages }],
  },
]

/** Il router si crea qui e non all'import, così i test possono usare `routes` con createMemoryRouter. */
export const createAppRouter = () => createBrowserRouter(routes)
