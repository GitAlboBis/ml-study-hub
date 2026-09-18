import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { RouteObject } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { manifest } from '../../content/manifest'
import { useProgress } from '../../store/progress'
import { AppShell, INDEX_KEY } from './AppShell'

// La shell con due pagine finte: la copertina e un foglio qualsiasi.
const routes: RouteObject[] = [
  {
    path: '/',
    Component: AppShell,
    children: [
      { index: true, handle: { title: 'Copertina' }, element: <main><h1>Copertina di prova</h1></main> },
      { path: 'm/:moduleId/:tab?', handle: { title: 'Foglio' }, element: <main><h1>Foglio di prova</h1></main> },
    ],
  },
]

function renderShell(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

// l'indice ha più di cinquanta collegamenti: in jsdom le query per ruolo sono lente, con i test in parallelo ancora di più
vi.setConfig({ testTimeout: 30_000 })

const index = () => screen.getByRole('navigation', { name: "Indice dell'atlante" })
const sheetLink = (scope: HTMLElement, id: string) => within(scope).getAllByRole('link', { hidden: true }).find((a) => a.getAttribute('href') === `/m/${id}`)!

beforeEach(() => {
  useProgress.getState().reset()
  localStorage.clear()
  // jsdom non implementa lo scorrimento della finestra (lo usa ScrollRestoration)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("indice dell'atlante", () => {
  it('elenca le tre regioni e i 50 fogli, raggruppati per capitolo', () => {
    renderShell()
    const nav = index()
    for (const name of ['Melgani', 'Passerini', 'Ricci']) expect(within(nav).getByRole('button', { name: new RegExp(name) })).toBeInTheDocument()
    const sheets = within(nav).getAllByRole('link', { hidden: true }).filter((a) => a.getAttribute('href')?.startsWith('/m/'))
    expect(sheets.map((a) => a.getAttribute('href'))).toEqual(manifest.map((m) => `/m/${m.id}`))
    // un capitolo è una lista con il suo titolo
    const cap2 = within(nav).getByRole('list', { name: 'Cap. 2 · Statistical Estimation Theory' })
    expect(within(cap2).getAllByRole('link')).toHaveLength(8)
    // il numero del foglio sta nel nome del collegamento
    expect(sheetLink(nav, 'm09-parzen-windows')).toHaveAccessibleName(/^Foglio 09/)
  })

  it('il foglio aperto ha aria-current', () => {
    renderShell('/m/m09-parzen-windows/teoria')
    expect(sheetLink(index(), 'm09-parzen-windows')).toHaveAttribute('aria-current', 'page')
    expect(sheetLink(index(), 'm08-non-parametrica-knn')).not.toHaveAttribute('aria-current')
  })

  it("mostra lo stato del rilievo di ogni foglio e lo spillo dove ti sei fermato", () => {
    renderShell()
    act(() => {
      useProgress.getState().setModuleStatus('m03-stima-intro-parametrica', 'completato')
      useProgress.getState().markSection('m05-max-likelihood', 'verosimiglianza', 1000)
      useProgress.getState().markSection('m04-bonta-stimatori', 'bias', 500)
    })
    const nav = index()
    expect(sheetLink(nav, 'm03-stima-intro-parametrica')).toHaveAccessibleName(/Rilevato/)
    expect(sheetLink(nav, 'm05-max-likelihood')).toHaveAccessibleName(/Rilievo in corso.*ti sei fermato qui/)
    expect(sheetLink(nav, 'm04-bonta-stimatori')).not.toHaveAccessibleName(/ti sei fermato qui/)
    expect(sheetLink(nav, 'm10-em-dati-incompleti')).toHaveAccessibleName(/Da rilevare/)
  })

  it('una regione si comprime e si riapre', async () => {
    const user = userEvent.setup()
    renderShell()
    const button = within(index()).getByRole('button', { name: /Passerini/ })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(sheetLink(index(), 'p08-svm-hard-margin')).not.toBeVisible()
    await user.click(button)
    expect(sheetLink(index(), 'p08-svm-hard-margin')).toBeVisible()
  })
})

describe('barra superiore', () => {
  it("comprime l'indice e se lo ricorda", async () => {
    const user = userEvent.setup()
    renderShell()
    const toggle = screen.getByRole('button', { name: "Comprimi l'indice" })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(toggle)
    expect(screen.queryByRole('navigation', { name: "Indice dell'atlante" })).toBeNull()
    expect(screen.getByRole('button', { name: "Mostra l'indice" })).toHaveAttribute('aria-expanded', 'false')
    expect(localStorage.getItem(INDEX_KEY)).toBe('chiuso')

    cleanup()
    renderShell()
    expect(screen.queryByRole('navigation', { name: "Indice dell'atlante" })).toBeNull()
  })

  it("su schermo stretto apre l'indice in un cassetto, che si chiude con Chiudi e quando scegli un foglio", async () => {
    const user = userEvent.setup()
    const router = renderShell()
    await user.click(screen.getByRole('button', { name: "Apri l'indice" }))
    const drawer = screen.getByRole('dialog', { name: "Indice dell'atlante" })
    await user.click(within(drawer).getByRole('button', { name: "Chiudi l'indice" }))
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: "Apri l'indice" }))
    await user.click(sheetLink(screen.getByRole('dialog'), 'm14-pca'))
    expect(router.state.location.pathname).toBe('/m/m14-pca')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Ctrl+K apre la ricerca con il fuoco nel campo, Esc la chiude', async () => {
    const user = userEvent.setup()
    renderShell()
    await user.keyboard('{Control>}k{/Control}')
    const palette = screen.getByRole('dialog', { name: "Cerca nell'atlante" })
    expect(within(palette).getByRole('searchbox')).toHaveFocus()
    await user.keyboard('parzen')
    expect(within(palette).getByRole('status')).toHaveTextContent(/parzen/)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('anche il campo di ricerca della barra apre la palette', async () => {
    const user = userEvent.setup()
    renderShell()
    const field = screen.getByRole('button', { name: /Cerca nell'atlante/ })
    expect(field).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K')
    await user.click(field)
    expect(screen.getByRole('dialog', { name: "Cerca nell'atlante" })).toBeInTheDocument()
  })

  it('il tema scelto va su <html data-theme> e resta salvato', async () => {
    const user = userEvent.setup()
    renderShell()
    await user.click(screen.getByRole('radio', { name: 'Notte' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('ml-study-theme')).toBe('dark')
    await user.click(screen.getByRole('radio', { name: 'Giorno' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})

describe('shell', () => {
  it('ha il collegamento per saltare al contenuto', () => {
    renderShell()
    const skip = screen.getByRole('link', { name: 'Salta al contenuto' })
    expect(skip).toHaveAttribute('href', '#contenuto')
    expect(document.getElementById('contenuto')).toContainElement(screen.getByRole('heading', { name: 'Copertina di prova' }))
  })

  it('il titolo della finestra viene dalla rotta', () => {
    renderShell('/m/m09-parzen-windows')
    expect(document.title).toBe('Foglio · ML Study Hub')
  })

  it('il marchio riporta alla copertina', () => {
    renderShell('/m/m09-parzen-windows')
    expect(screen.getByRole('link', { name: /ML Study Hub/ })).toHaveAttribute('href', '/')
  })
})
