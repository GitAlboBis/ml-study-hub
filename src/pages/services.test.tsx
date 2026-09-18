import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { manifest } from '../content/manifest'
import { routes } from '../router'
import { useProgress } from '../store/progress'

// Solo il foglio 09 "è scritto": la copertina lo deve mettere in evidenza, qualunque sia il suo contenuto.
vi.mock('../content/registry', () => ({
  hasModule: (id: string) => id === 'm09-parzen-windows',
  loadModuleData: vi.fn(async () => {
    throw new Error('non serve in questi test')
  }),
  loadModuleContent: vi.fn(async () => {
    throw new Error('non serve in questi test')
  }),
  loadAllModuleData: vi.fn(async () => []),
}))

// le pagine sono chunk lazy: con molti test in parallelo il primo caricamento è lento
const SLOW = { timeout: 20_000 }
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

describe('Copertina', () => {
  it('ha il titolo dell\'atlante, le tre regioni e il quadro d\'unione dei 50 fogli', async () => {
    open('/')
    expect(await screen.findByRole('heading', { level: 1 }, SLOW)).toHaveTextContent(/Atlante/i)
    const main = screen.getByRole('main')
    for (const name of ['Melgani', 'Passerini', 'Ricci']) expect(within(main).getByRole('heading', { name: new RegExp(`^${name}`) })).toBeInTheDocument()
    const grid = within(main).getByRole('list', { name: "Quadro d'unione" })
    const tiles = within(grid).getAllByRole('link')
    expect(tiles.map((a) => a.getAttribute('href'))).toEqual(manifest.map((m) => `/m/${m.id}`))
    expect(tiles[8]).toHaveAccessibleName(/Foglio 09.*Finestre di Parzen.*pronto/)
    expect(tiles[9]).toHaveAccessibleName(/Foglio 10.*in preparazione/)
  })

  it('mette in evidenza i fogli pronti', async () => {
    open('/')
    const ready = await screen.findByRole('list', { name: 'Fogli pronti' }, SLOW)
    const links = within(ready).getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/m/m09-parzen-windows')
  })

  it('senza letture propone di cominciare dal primo foglio pronto', async () => {
    open('/')
    const resume = await screen.findByRole('region', { name: /Da dove partire/ }, SLOW)
    expect(within(resume).getByRole('link', { name: /Finestre di Parzen/ })).toHaveAttribute('href', '/m/m09-parzen-windows')
  })

  it('con lo spillo propone di riprendere da dove eri, alla sezione giusta', async () => {
    act(() => useProgress.getState().markSection('m05-max-likelihood', 'stima-di-massima-verosimiglianza', 1000))
    open('/')
    const resume = await screen.findByRole('region', { name: /Riprendi da dove eri/ }, SLOW)
    const link = within(resume).getByRole('link', { name: /Stima di massima verosimiglianza/ })
    expect(link).toHaveAttribute('href', '/m/m05-max-likelihood/teoria#stima-di-massima-verosimiglianza')
    expect(within(screen.getByRole('list', { name: "Quadro d'unione" })).getAllByRole('link')[4]).toHaveAccessibleName(/ti sei fermato qui/)
  })
})

describe('Viewer delle fonti', () => {
  it('mostra la pagina, sfoglia avanti e indietro e dice quali fogli la citano', async () => {
    open('/fonti/ch2/12')
    expect(await screen.findByRole('heading', { level: 1, name: 'Slide del Capitolo 2 (Melgani)' }, SLOW)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /slide 12/ })).toHaveAttribute('src', '/sources/ch2/p012.webp')
    expect(screen.getByRole('link', { name: /Precedente/ })).toHaveAttribute('href', '/fonti/ch2/11')
    expect(screen.getByRole('link', { name: /Successiva/ })).toHaveAttribute('href', '/fonti/ch2/13')
    const citing = screen.getByRole('region', { name: /Citata nei fogli/ })
    expect(within(citing).getByRole('link', { name: /Foglio 04/ })).toHaveAttribute('href', '/m/m04-bonta-stimatori/fonti')
  })

  it('le frecce della tastiera sfogliano le pagine', async () => {
    const user = userEvent.setup()
    const router = open('/fonti/ch2/12')
    await screen.findByRole('heading', { level: 1 }, SLOW)
    await user.keyboard('{ArrowRight}')
    expect(router.state.location.pathname).toBe('/fonti/ch2/13')
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(router.state.location.pathname).toBe('/fonti/ch2/11')
  })

  it('va a una pagina scelta e non va oltre i bordi del documento', async () => {
    const user = userEvent.setup()
    const router = open('/fonti/ch2/1')
    await screen.findByRole('heading', { level: 1 }, SLOW)
    expect(screen.queryByRole('link', { name: /Precedente/ })).toBeNull()
    await user.keyboard('{ArrowLeft}')
    expect(router.state.location.pathname).toBe('/fonti/ch2/1')
    const field = screen.getByRole('spinbutton', { name: 'Vai alla pagina' })
    await user.clear(field)
    await user.type(field, '40{Enter}')
    expect(router.state.location.pathname).toBe('/fonti/ch2/40')
  })

  it('un documento o una pagina che non esistono hanno un messaggio chiaro', async () => {
    open('/fonti/boh/3')
    expect(await screen.findByRole('heading', { level: 1, name: 'Pagina della fonte non trovata' })).toBeInTheDocument()
    cleanup()
    open('/fonti/ch2/999')
    expect(await screen.findByRole('heading', { level: 1, name: 'Pagina della fonte non trovata' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Slide del Capitolo 2/ })).toHaveAttribute('href', '/fonti/ch2/1')
  })
})

describe('Laboratorio dei widget', () => {
  it('mostra un widget a tutta pagina con i suoi metadati', async () => {
    open('/lab/prova')
    expect(await screen.findByRole('heading', { level: 1, name: 'Widget di prova' }, SLOW)).toBeInTheDocument()
    expect(screen.getByText('Nessuno scenario: serve ai test del registry')).toBeInTheDocument()
    // il widget vero, reso dentro la pagina
    expect(screen.getByText('prova', { selector: 'p' })).toBeInTheDocument()
  })

  it('un widget che non esiste ha un messaggio chiaro', async () => {
    open('/lab/non-esiste')
    expect(await screen.findByRole('heading', { level: 1, name: 'Widget non trovato' }, SLOW)).toBeInTheDocument()
    expect(screen.getByText(/non-esiste/)).toBeInTheDocument()
  })
})
