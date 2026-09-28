// Le rotte globali montano le pagine vere, non il segnaposto della Fase 3: ogni percorso apre la sua
// pagina (riconosciuta dal titolo h1) e nessuna dice più "Pagina in costruzione".
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { routes } from './router'
import { useProgress } from './store/progress'

// Nessun foglio pronto: ogni pagina deve reggersi anche così, e il test resta veloce.
vi.mock('./content/registry', () => ({
  hasModule: () => false,
  loadModuleData: vi.fn(async () => {
    throw new Error('non serve in questi test')
  }),
  loadModuleContent: vi.fn(async () => {
    throw new Error('non serve in questi test')
  }),
  loadAllModuleData: vi.fn(async () => []),
}))

// le pagine sono chunk lazy: con molti test in parallelo il primo caricamento è lento
const SLOW = { timeout: 30_000 }
vi.setConfig({ testTimeout: 60_000 })

function open(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  useProgress.getState().reset()
  localStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// percorso → titolo h1 della pagina che ci deve stare
const GLOBAL_PAGES: [path: string, heading: RegExp][] = [
  ['/mappa', /Quadro d'unione/],
  ['/corso/melgani', /Regione\s*Melgani/],
  ['/formulario', /Formulario/],
  ['/glossario', /Glossario/],
  ['/flashcard', /Flashcard/],
  ['/quiz', /Quiz/],
  ['/orale', /Orale/],
  ['/giochi', /Giochi/],
  ['/giochi/formula-match', /./],
  ['/progressi', /Progressi/],
  ['/copertura', /Copertura/],
  ['/impostazioni', /Impostazioni/],
]

describe('rotte globali', () => {
  it.each(GLOBAL_PAGES)('%s monta la sua pagina', async (path, heading) => {
    open(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading }, SLOW)).toBeInTheDocument()
    expect(screen.queryByText(/Pagina in costruzione/)).toBeNull()
  })

  it('un gioco che non esiste lo dice dentro la pagina dei giochi', async () => {
    open('/giochi/non-esiste')
    expect(await screen.findByRole('heading', { level: 1, name: 'Questo gioco non esiste' }, SLOW)).toBeInTheDocument()
  })

  it('una regione che non esiste è un 404', async () => {
    open('/corso/nessuna')
    expect(await screen.findByRole('heading', { name: /non trovata/i }, SLOW)).toBeInTheDocument()
  })
})
