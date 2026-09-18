// Rotte dell'app (React Router 7, data router).
//
// Fase 5: per montare una pagina vera basta cambiare l'import dentro page(...) della sua rotta; il nome
// della pagina prevista è nel commento a fine riga. Una pagina è un modulo con `export default` del componente.
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
  { path: 'mappa', handle: { title: 'Mappa del corso' }, lazy: page(() => import('./pages/Placeholder')) }, // CourseMap
  { path: 'corso/:course', loader: courseLoader, handle: { title: 'Corso' }, lazy: page(() => import('./pages/Placeholder')) }, // CoursePage
  { path: 'm/:moduleId/:tab?', loader: moduleLoader, handle: { title: 'Foglio' }, lazy: page(() => import('./pages/ModulePage')) },
  { path: 'formulario', handle: { title: 'Formulario' }, lazy: page(() => import('./pages/Placeholder')) }, // Formulario
  { path: 'flashcard', handle: { title: 'Flashcard' }, lazy: page(() => import('./pages/Placeholder')) }, // Flashcards
  { path: 'quiz', handle: { title: 'Quiz' }, lazy: page(() => import('./pages/Placeholder')) }, // QuizArena
  { path: 'orale', handle: { title: 'Simulatore dell\'orale' }, lazy: page(() => import('./pages/Placeholder')) }, // OralSimulator
  { path: 'giochi', handle: { title: 'Giochi' }, lazy: page(() => import('./pages/Placeholder')) }, // Games
  { path: 'giochi/:game', handle: { title: 'Gioco' }, lazy: page(() => import('./pages/Placeholder')) }, // Games/<gioco> (Fase 8)
  { path: 'glossario', handle: { title: 'Glossario' }, lazy: page(() => import('./pages/Placeholder')) }, // Glossary
  { path: 'fonti/:doc/:page', handle: { title: 'Fonti' }, lazy: page(() => import('./pages/SourceViewer')) },
  { path: 'lab/_tavola', handle: { title: 'Tavola dei segni convenzionali' }, lazy: page(() => import('./pages/TokenSpecimen')) },
  { path: 'lab/:widgetId', handle: { title: 'Laboratorio dei widget' }, lazy: page(() => import('./pages/WidgetLab')) }, // anche /lab/_kit (Task 4.4)
  { path: 'progressi', handle: { title: 'Progressi' }, lazy: page(() => import('./pages/Placeholder')) }, // Progress
  { path: 'copertura', handle: { title: 'Copertura' }, lazy: page(() => import('./pages/Placeholder')) }, // Coverage
  { path: 'impostazioni', handle: { title: 'Impostazioni' }, lazy: page(() => import('./pages/Placeholder')) }, // Settings
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
