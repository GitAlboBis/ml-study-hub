import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyThemeChoice } from '../lib/theme'
import { usePreferences } from '../store/preferences'
import Settings from './Settings'

vi.mock('../content/registry', () => ({
  hasModule: (id: string) => id === 'm09-parzen-windows',
  loadModuleData: vi.fn(async () => {
    throw new Error('non serve')
  }),
  loadModuleContent: vi.fn(async () => {
    throw new Error('non serve')
  }),
  loadAllModuleData: vi.fn(async () => []),
}))

const html = document.documentElement
let systemReduce = false

function stubMatchMedia() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce') ? systemReduce : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))
}

function open() {
  const router = createMemoryRouter(
    [
      { path: '/impostazioni', Component: Settings },
      { path: '*', element: <p>altrove</p> },
    ],
    { initialEntries: ['/impostazioni'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  systemReduce = false
  stubMatchMedia()
  localStorage.clear()
  applyThemeChoice('system')
  usePreferences.getState().resetPreferences()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Impostazioni', () => {
  it('cambia il tema e resta allineata a chi lo cambia altrove', async () => {
    const user = userEvent.setup()
    open()
    expect(screen.getByRole('heading', { level: 1, name: 'Impostazioni' })).toBeInTheDocument()
    const theme = screen.getByRole('radiogroup', { name: 'Tema' })
    expect(within(theme).getByRole('radio', { name: 'Sistema' })).toBeChecked()
    await user.click(within(theme).getByRole('radio', { name: 'Notte' }))
    expect(html.dataset.theme).toBe('dark')
    expect(localStorage.getItem('ml-study-theme')).toBe('dark')
    // l'interruttore della barra in alto usa la stessa API: la pagina lo segue
    act(() => applyThemeChoice('light'))
    expect(await within(theme).findByRole('radio', { name: 'Giorno' })).toBeChecked()
  })

  it('la dimensione del testo scala tutta l\'app', async () => {
    const user = userEvent.setup()
    open()
    const size = screen.getByRole('radiogroup', { name: 'Dimensione del testo' })
    expect(within(size).getByRole('radio', { name: 'Normale' })).toBeChecked()
    await user.click(within(size).getByRole('radio', { name: 'Grande' }))
    expect(html.style.fontSize).toBe('112.5%')
    expect(usePreferences.getState().textSize).toBe('grande')
    // l'anteprima usa il testo vero del foglio, con una formula
    expect(screen.getByRole('region', { name: /Anteprima/ })).toHaveTextContent(/stima di Parzen/)
  })

  it('riduci movimento si somma alla preferenza del sistema', async () => {
    const user = userEvent.setup()
    open()
    const box = screen.getByRole('checkbox', { name: /Riduci il movimento/ })
    expect(box).not.toBeChecked()
    await user.click(box)
    expect(box).toBeChecked()
    expect(html.dataset.motion).toBe('ridotto')
    expect(screen.queryByText(/Il sistema chiede già meno movimento/)).toBeNull()
    await user.click(box)
    expect(html.dataset.motion).toBeUndefined()

    cleanup()
    systemReduce = true
    stubMatchMedia()
    open()
    expect(screen.getByText(/Il sistema chiede già meno movimento/)).toBeInTheDocument()
  })

  it('ripristina i valori predefiniti con un tasto e lo annuncia', async () => {
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole('radio', { name: 'Notte' }))
    await user.click(screen.getByRole('radio', { name: 'Molto grande' }))
    await user.click(screen.getByRole('checkbox', { name: /Riduci il movimento/ }))
    await user.click(screen.getByRole('button', { name: 'Ripristina le impostazioni predefinite' }))
    expect(usePreferences.getState()).toMatchObject({ reduceMotion: false, textSize: 'normale' })
    expect(localStorage.getItem('ml-study-theme')).toBeNull()
    expect(screen.getByRole('radio', { name: 'Sistema' })).toBeChecked()
    expect(screen.getByRole('status')).toHaveTextContent(/predefinite/)
  })

  it('le informazioni dicono quanti fogli sono pronti, dove stanno i dati e portano alle fonti', () => {
    open()
    const about = screen.getByRole('region', { name: /Informazioni/ })
    expect(about).toHaveTextContent(/1 di 50/)
    expect(within(about).getByRole('link', { name: /Copertura/ })).toHaveAttribute('href', '/copertura')
    expect(within(about).getByRole('link', { name: /Progressi/ })).toHaveAttribute('href', '/progressi')
    expect(within(about).getByRole('link', { name: /Slide del Capitolo 2/ })).toHaveAttribute('href', '/fonti/ch2/1')
    expect(about).toHaveTextContent(/in questo browser/)
  })

  it('i collegamenti alle fonti, uno sotto l’altro, sono bersagli alti almeno 40 px (regressione: 22 px con 4 px fra l’uno e l’altro)', () => {
    open()
    const about = screen.getByRole('region', { name: /Informazioni/ })
    for (const name of [/Slide del Capitolo 1/, /Banca delle domande/]) {
      expect(within(about).getByRole('link', { name })).toHaveClass('inline-flex', 'min-h-10', 'items-center')
    }
  })
})
