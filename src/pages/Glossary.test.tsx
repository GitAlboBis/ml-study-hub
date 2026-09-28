import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineModule, md } from '../content/types'
import type { CourseId, GlossaryEntry, ModuleData } from '../content/types'
import Glossary from './Glossary'

const registry = vi.hoisted(() => ({ modules: [] as { id: string }[], broken: [] as string[] }))

vi.mock('../content/registry', () => ({
  hasModule: (id: string) => registry.modules.some((m) => m.id === id) || registry.broken.includes(id),
  loadModuleData: vi.fn(async (id: string) => {
    const found = registry.modules.find((m) => m.id === id)
    if (!found || registry.broken.includes(id)) throw new Error(`non caricato: ${id}`)
    return found
  }),
  loadModuleContent: vi.fn(async () => {
    throw new Error('non serve in questi test')
  }),
  loadAllModuleData: vi.fn(async () => registry.modules),
}))

const sheet = (id: string, course: CourseId, title: string, glossary: GlossaryEntry[]): ModuleData =>
  defineModule({
    id,
    title,
    titleEn: title,
    course,
    chapter: '',
    order: 0,
    sources: [],
    prerequisites: [],
    estimatedMinutes: 0,
    summary: '',
    keyPoints: [],
    glossary,
    formulas: [],
    derivations: [],
    figures: [],
    flashcards: [],
    quiz: [],
    exam: [],
    exercises: [],
    widgets: [],
    connections: [],
    coverage: {},
  })

const knn = sheet('m08-non-parametrica-knn', 'melgani', 'Stima non parametrica e K-NN', [
  { term: 'Sovradattamento', en: 'Overfitting', def: 'Stima che insegue il rumore.' },
  { term: 'Stima non parametrica', en: 'nonparametric estimation', def: 'Senza forma funzionale.' },
])
const parzen = sheet('m09-parzen-windows', 'melgani', 'Finestre di Parzen', [
  { term: 'Finestra di Parzen', en: 'Parzen window', def: md`Il kernel $\gamma$ posato su ogni campione.` },
  { term: 'Sovra-adattamento', en: '  overfitting ', def: 'Finestra troppo stretta.' },
  { term: 'Élite dei kernel', en: 'kernel elite', def: 'Un termine con l\'accento.' },
])
const svm = sheet('p08-svm-hard-margin', 'passerini', 'SVM a margine rigido', [
  { term: 'Margine', en: 'margin', def: 'Distanza dall\'iperpiano.' },
  { term: 'overfitting', en: 'OVERFITTING', def: 'Anche le SVM.' },
  { term: '1-NN', en: 'one nearest neighbour', def: 'Un solo vicino.' },
])

function open(path = '/glossario') {
  const router = createMemoryRouter(
    [
      { path: '/glossario', element: <Glossary /> },
      { path: '/m/:moduleId/:tab?', element: <p>Foglio aperto</p> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const status = () => screen.getByRole('status', { name: 'Risultati' })
const index = () => screen.getByRole('navigation', { name: 'Indice alfabetico' })
/** Le voci in vista, nell'ordine della pagina: il termine principale di ciascuna. */
const shownTerms = () =>
  [...document.querySelectorAll<HTMLElement>('[data-term]')].filter((el) => !el.closest('[hidden]')).map((el) => el.querySelector('dt [data-headword]')?.textContent)

const scrollIntoView = Element.prototype.scrollIntoView

beforeEach(() => {
  registry.modules = [svm, parzen, knn]
  registry.broken = []
  localStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  Element.prototype.scrollIntoView = scrollIntoView
})

describe('glossario', () => {
  it('unisce le voci di tutti i fogli per termine inglese, con i fogli in cui compaiono', async () => {
    open()
    expect(await screen.findByRole('heading', { level: 1, name: /Glossario/ })).toBeInTheDocument()
    await waitFor(() => expect(status()).toHaveTextContent('6 termini su 6'))
    const overfitting = document.getElementById('termine:overfitting')!
    expect(within(overfitting).getByText('Sovradattamento')).toBeInTheDocument()
    expect(within(overfitting).getByText('Overfitting')).toHaveAttribute('lang', 'en')
    expect(overfitting).toHaveTextContent(/anche: Sovra-adattamento, overfitting/)
    // una definizione per foglio, ciascuna con il suo foglio
    expect(within(overfitting).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '/m/m08-non-parametrica-knn/riassunto',
      '/m/m09-parzen-windows/riassunto',
      '/m/p08-svm-hard-margin/riassunto',
    ])
    expect(within(overfitting).getByRole('link', { name: /Foglio 09 · Finestre di Parzen/ })).toBeInTheDocument()
    expect(overfitting).toHaveTextContent('Finestra troppo stretta.')
    // le definizioni sono testo ricco: la matematica passa da KaTeX
    expect(document.getElementById('termine:parzen-window')!.querySelector('.katex')).not.toBeNull()
    await waitFor(() => expect(document.title).toMatch(/^Glossario/))
  })

  it('ha un indice alfabetico: le lettere con voci portano alla loro sezione, le altre no', async () => {
    open()
    await waitFor(() => expect(status()).toHaveTextContent('6 termini'))
    expect(shownTerms()).toEqual(['Élite dei kernel', 'Finestra di Parzen', 'Margine', 'Sovradattamento', 'Stima non parametrica', '1-NN'])
    const links = within(index()).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#lettera-E', '#lettera-F', '#lettera-M', '#lettera-S', '#lettera-altri'])
    expect(within(index()).getByRole('link', { name: /Cifre e simboli/ })).toBeInTheDocument()
    expect(within(index()).queryByRole('link', { name: 'A' })).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'S' }).closest('section')).toHaveAttribute('id', 'lettera-S')
  })

  it('alterna l\'ordine italiano e inglese: cambiano la voce principale e l\'indice', async () => {
    const user = userEvent.setup()
    open()
    await waitFor(() => expect(status()).toHaveTextContent('6 termini'))
    const english = screen.getByRole('button', { name: /English/ })
    await user.click(english)
    expect(english).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Italiano/ })).toHaveAttribute('aria-pressed', 'false')
    expect(shownTerms()).toEqual(['kernel elite', 'margin', 'nonparametric estimation', 'one nearest neighbour', 'Overfitting', 'Parzen window'])
    expect(within(index()).getAllByRole('link').map((a) => a.textContent)).toEqual(['K', 'M', 'N', 'O', 'P'])
    const overfitting = document.getElementById('termine:overfitting')!
    expect(overfitting.querySelector('dt [data-headword]')).toHaveAttribute('lang', 'en')
  })

  it('cerca in italiano e in inglese e filtra per regione', async () => {
    const user = userEvent.setup()
    open()
    const search = await screen.findByRole('searchbox', { name: 'Cerca un termine' })
    await user.type(search, 'elite')
    expect(shownTerms()).toEqual(['Élite dei kernel'])
    await waitFor(() => expect(status()).toHaveTextContent('1 termine su 6'))
    await user.clear(search)
    await user.type(search, 'window')
    expect(shownTerms()).toEqual(['Finestra di Parzen'])
    await user.click(screen.getByRole('button', { name: 'Svuota la ricerca' }))
    await user.click(screen.getByRole('radio', { name: /^Passerini/ }))
    expect(shownTerms()).toEqual(['Margine', 'Sovradattamento', '1-NN'])
    expect(within(index()).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['#lettera-M', '#lettera-S', '#lettera-altri'])
  })

  it('senza risultati lo dice e permette di azzerare', async () => {
    const user = userEvent.setup()
    open()
    const search = await screen.findByRole('searchbox', { name: 'Cerca un termine' })
    await user.type(search, 'zzz')
    expect(shownTerms()).toEqual([])
    expect(screen.getByText(/Nessun termine risponde a «zzz»/)).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Azzera i filtri' })[0])
    expect(shownTerms()).toHaveLength(6)
  })

  it('porta alla voce indicata nell\'ancora dell\'indirizzo', async () => {
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    open('/glossario#termine:margin')
    await waitFor(() => expect(scroll).toHaveBeenCalled())
    expect(scroll.mock.contexts.at(-1)).toHaveAttribute('id', 'termine:margin')
  })

  it('senza fogli pronti spiega che il glossario cresce con i fogli', async () => {
    registry.modules = []
    open()
    expect(await screen.findByText(/nessun foglio pronto ha ancora un glossario/i)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Indice alfabetico' })).toBeNull()
  })

  it('«Azzera i filtri» sparisce premendolo: il fuoco torna nel campo di ricerca', async () => {
    const user = userEvent.setup()
    open()
    const search = await screen.findByRole('searchbox', { name: 'Cerca un termine' })
    await user.type(search, 'elite')
    await user.click(screen.getByRole('button', { name: 'Azzera i filtri' }))
    expect(search).toHaveFocus()
    // anche quello del riquadro "nessun risultato"
    await user.type(search, 'zzz')
    const buttons = screen.getAllByRole('button', { name: 'Azzera i filtri' })
    await user.click(buttons.at(-1)!)
    expect(search).toHaveFocus()
  })

  it('il conteggio si annuncia una volta, a scrittura ferma, non una per lettera', async () => {
    const user = userEvent.setup()
    open()
    const search = await screen.findByRole('searchbox', { name: 'Cerca un termine' })
    const live = status()
    const seen: string[] = []
    const observer = new MutationObserver(() => {
      const text = live.textContent ?? ''
      if (seen.at(-1) !== text) seen.push(text)
    })
    observer.observe(live, { childList: true, subtree: true, characterData: true })
    await user.type(search, 'finestra')
    await waitFor(() => expect(live).toHaveTextContent('1 termine su 6'))
    observer.disconnect()
    expect(seen).toEqual(['1 termine su 6'])
  })

  it('?q= dall\'indirizzo filtra subito (la ricerca dell\'atlante porta qui)', async () => {
    open('/glossario?q=window')
    const search = await screen.findByRole('searchbox', { name: 'Cerca un termine' })
    expect(search).toHaveValue('window')
    await waitFor(() => expect(shownTerms()).toEqual(['Finestra di Parzen']))
  })

  it('il filtro per regione è quello di tutte le pagine: radio, "Tutte le regioni", scelta a inchiostro', async () => {
    const user = userEvent.setup()
    open()
    await screen.findByRole('searchbox', { name: 'Cerca un termine' })
    const group = screen.getByRole('radiogroup', { name: 'Regione' })
    expect(within(group).getByRole('radio', { name: /^Tutte le regioni 6$/ })).toBeChecked()
    await user.click(within(group).getByRole('radio', { name: /^Passerini/ }))
    expect(shownTerms()).toEqual(['Margine', 'Sovradattamento', '1-NN'])
  })

  it('le altre grafie inglesi dello stesso concetto restano nella voce', async () => {
    registry.modules = [
      sheet('m05-max-likelihood', 'melgani', 'Stima ML', [{ term: 'Bound di Cramér-Rao', en: 'Cramér-Rao bound', def: 'Da m05.' }]),
      sheet('m07-stima-bayesiana', 'melgani', 'Stima bayesiana', [{ term: 'Bound di Cramér-Rao', en: 'Cramér-Rao lower bound', def: 'Da m07.' }]),
    ]
    open()
    await waitFor(() => expect(shownTerms()).toEqual(['Bound di Cramér-Rao']))
    const entry = document.getElementById('termine:cramer-rao-bound')!
    expect(within(entry).getByText('Cramér-Rao lower bound')).toHaveAttribute('lang', 'en')
    expect(entry).toHaveTextContent('Da m05.')
    expect(entry).toHaveTextContent('Da m07.')
  })

  it('un foglio che non si carica non ferma gli altri', async () => {
    registry.broken = ['m09-parzen-windows']
    open()
    expect(await screen.findByRole('alert')).toHaveTextContent(/Foglio 09.*non si è caricato/)
    await waitFor(() => expect(status()).toHaveTextContent('4 termini su 4'))
  })
})
