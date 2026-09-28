import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineModule } from '../content/types'
import type { ModuleData } from '../content/types'
import type { CoverageIndex } from '../lib/coverage'
import Coverage from './Coverage'

// ---------------------------------------------------------------------------------------------
// Un foglio pronto finto (09), uno pronto che non si carica (04) e un indice con fogli non pronti:
// la pagina deve reggere 1 foglio come 50, senza id scritti nel codice.
// ---------------------------------------------------------------------------------------------

const data: ModuleData = defineModule({
  id: 'm09-parzen-windows',
  title: 'Finestre di Parzen',
  titleEn: 'Parzen windows',
  course: 'melgani',
  chapter: 'Cap. 2',
  order: 9,
  sources: [{ doc: 'ch2', pages: [51, 66] }],
  prerequisites: [],
  estimatedMinutes: 60,
  summary: '',
  keyPoints: [],
  glossary: [],
  formulas: [{ id: 'f-c01', name: 'Stima di base', nameEn: 'Basic estimate', latex: 'K/(NV)', explain: '', symbols: [], importance: 3, blanks: [], source: [] }],
  derivations: [],
  figures: [],
  flashcards: [],
  quiz: [{ id: 'q-uno', type: 'tf', q: 'Parzen fissa il volume?', answer: true, explanation: '', difficulty: 1, concepts: ['c01'] }],
  exam: [{ id: 'or-1', q: 'Descrivi il metodo di Parzen', qEn: 'Describe Parzen', prof: 'Melgani', fromBank: true, answer: '', checklist: [], followUps: [] }],
  exercises: [],
  widgets: [{ id: 'm09-scatola-nera', title: 'La scatola nera', concepts: ['c01'] }],
  connections: [],
  coverage: {
    c01: ['#panoramica', 'formula:f-c01', 'widget:m09-scatola-nera', 'quiz:q-uno', 'exam:or-1'],
    c02: ['#differenze-con-il-k-nn', 'widget:m09-scatola-nera'],
  },
})

const { index } = vi.hoisted(() => {
  const index: CoverageIndex = {
  version: 1,
  modules: {
    'm09-parzen-windows': {
      complete: true,
      examples: {},
      concepts: [
        { id: 'c01', name: 'Contesto e obiettivo', nameEn: 'Parzen windows estimation', kind: 'definizione', pages: [['ch2', 51], ['part1', 36]], exam: 3 },
        { id: 'c02', name: 'Parzen contro K-NN', nameEn: 'Parzen method vs K-nearest neighbor', kind: 'confronto', pages: [['ch2', 52]] },
        { id: 'c03', name: 'Il dilemma della regione', nameEn: 'The region dilemma', kind: 'osservazione', pages: [['ch2', 41]] },
      ],
    },
    'm04-bonta-stimatori': { complete: true, examples: {}, concepts: [] },
    'm05-max-likelihood': {
      complete: true,
      examples: {},
      concepts: [
        { id: 'c01', name: 'Verosimiglianza', nameEn: 'Likelihood', kind: 'definizione', pages: [['ch2', 20]] },
        { id: 'c02', name: 'Log-verosimiglianza', nameEn: 'Log-likelihood', kind: 'formula', pages: [['ch2', 21]] },
      ],
    },
    'm17-bayes-map-ml': { complete: false, examples: {}, concepts: [{ id: 'c01', name: 'MAP', nameEn: 'MAP', kind: 'definizione', pages: [['ch3', 5]] }] },
    'p01-stima-parametri': { complete: true, examples: {}, concepts: [{ id: 'c01', name: 'Stima', nameEn: 'Estimation', kind: 'definizione', pages: [['part2', 3]] }] },
  },
}
  return { index }
})

vi.mock('../lib/coverageIndex', () => ({
  coverageIndex: index,
  // il titolo vero di una sola sezione: le altre si leggono dallo slug
  sectionTitle: (id: string, slug: string) => (id === 'm09-parzen-windows' && slug === 'panoramica' ? 'Panoramica del foglio' : undefined),
}))

const load = vi.hoisted(() => ({ fail: new Set<string>() }))
vi.mock('../content/registry', () => ({
  hasModule: (id: string) => id === 'm09-parzen-windows' || id === 'm04-bonta-stimatori',
  loadModuleData: vi.fn(async (id: string) => {
    if (id === 'm09-parzen-windows' && !load.fail.has(id)) return data
    throw new Error(`non si carica: ${id}`)
  }),
  loadModuleContent: vi.fn(async () => {
    throw new Error('non serve')
  }),
  loadAllModuleData: vi.fn(async () => [data]),
}))

function open() {
  const router = createMemoryRouter(
    [
      { path: '/copertura', Component: Coverage },
      { path: '*', element: <p>altrove</p> },
    ],
    { initialEntries: ['/copertura'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

afterEach(() => {
  cleanup()
  load.fail.clear()
})

describe('Copertura', () => {
  it('ha la testata e i totali per regione', async () => {
    open()
    expect(screen.getByRole('heading', { level: 1, name: 'Copertura' })).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: /per regione/i })
    const melgani = within(table).getByRole('row', { name: /Melgani/ })
    // 2 fogli pronti su 22, 6 concetti inventariati (3 + 0 + 2 + 1), 2 tracciati su 3 nei fogli pronti
    const [ready, inventoried, tracked] = within(melgani).getAllByRole('cell')
    expect(ready).toHaveTextContent('2 di 22')
    // 4 fogli della regione su 22 hanno un inventario
    expect(inventoried).toHaveTextContent(/^6\s*4 di 22 fogli$/)
    expect(tracked).toHaveTextContent('2 di 3')
    const ricci = within(table).getByRole('row', { name: /Ricci/ })
    expect(ricci).toHaveTextContent(/0 di 14/)
  })

  it('dice subito se qualche concetto non ha destinazioni e lo mostra con un clic', async () => {
    const user = userEvent.setup()
    open()
    const alert = await screen.findByText(/1 concetto dei fogli pronti non ha destinazioni/)
    await user.click(within(alert.closest('div') as HTMLElement).getByRole('button', { name: /Mostralo/ }))
    expect(screen.getByRole('combobox', { name: 'Mostra' })).toHaveValue('non-tracciati')
    const register = screen.getByRole('region', { name: /Registro dei fogli pronti/ })
    expect(within(register).getByRole('heading', { name: 'Il dilemma della regione' })).toBeInTheDocument()
    expect(within(register).queryByRole('heading', { name: 'Contesto e obiettivo' })).toBeNull()
    expect(within(register).getByText(/non è ancora nell'atlante/)).toBeInTheDocument()
  })

  it('apre il foglio pronto e porta ogni destinazione alla scheda giusta', async () => {
    const user = userEvent.setup()
    open()
    const toggle = await screen.findByRole('button', { name: /Foglio 09.*Finestre di Parzen/ })
    expect(toggle).toHaveTextContent(/3 concetti · 2 tracciati · 7 destinazioni/)
    // senza filtri i fogli partono chiusi: il registro di un foglio è lungo
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('heading', { name: 'Contesto e obiettivo' })).toBeNull()
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const item = screen.getByRole('heading', { name: 'Contesto e obiettivo' }).closest('li') as HTMLElement
    expect(within(item).getByRole('link', { name: 'Panoramica del foglio' })).toHaveAttribute('href', '/m/m09-parzen-windows/teoria#panoramica')
    expect(within(item).getByRole('link', { name: 'Stima di base' })).toHaveAttribute('href', '/m/m09-parzen-windows/formule#formula:f-c01')
    expect(within(item).getByRole('link', { name: 'La scatola nera' })).toHaveAttribute('href', '/lab/m09-scatola-nera')
    expect(within(item).getByRole('link', { name: /Parzen fissa il volume/ })).toHaveAttribute('href', '/m/m09-parzen-windows/quiz')
    expect(within(item).getByRole('link', { name: /Descrivi il metodo/ })).toHaveAttribute('href', '/m/m09-parzen-windows/orale#exam:or-1')
    // le pagine delle fonti del concetto
    expect(within(item).getByRole('link', { name: 'Cap. 2 · slide 51' })).toHaveAttribute('href', '/fonti/ch2/51')
    expect(within(item).getByRole('link', { name: 'Note 1 · p. 36' })).toHaveAttribute('href', '/fonti/part1/36')
    expect(within(item).getByText(/Da orale/)).toBeInTheDocument()
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('filtra per destinazione mancante e per nome, con il conteggio annunciato', async () => {
    const user = userEvent.setup()
    open()
    await screen.findByRole('button', { name: /Foglio 09/ })
    const status = screen.getByRole('status')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Mostra' }), 'orale')
    await waitFor(() => expect(status).toHaveTextContent(/2 concetti su 3/))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Mostra' }), 'tutti')
    await user.type(screen.getByRole('searchbox', { name: /Cerca un concetto/ }), 'k-nearest')
    await waitFor(() => expect(status).toHaveTextContent(/1 concetto su 3/))
    expect(screen.getByRole('heading', { name: 'Parzen contro K-NN' })).toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox', { name: /Cerca un concetto/ }))
    await user.type(screen.getByRole('searchbox', { name: /Cerca un concetto/ }), 'nessuno così')
    await waitFor(() => expect(status).toHaveTextContent(/Nessun concetto/))
  })

  it('il conteggio si annuncia una volta, a scrittura ferma; il filtro per regione è quello comune', async () => {
    const user = userEvent.setup()
    open()
    await screen.findByRole('button', { name: /Foglio 09/ })
    expect(screen.getByRole('radio', { name: 'Tutte le regioni' })).toBeChecked()
    const status = screen.getByRole('status')
    const seen: string[] = []
    const observer = new MutationObserver(() => {
      const text = status.textContent ?? ''
      if (seen.at(-1) !== text) seen.push(text)
    })
    observer.observe(status, { childList: true, subtree: true, characterData: true })
    await user.type(screen.getByRole('searchbox', { name: /Cerca un concetto/ }), 'k-nearest')
    await waitFor(() => expect(status).toHaveTextContent(/1 concetto su 3/))
    observer.disconnect()
    expect(seen).toHaveLength(1)
  })

  it('mostra i fogli non pronti con i concetti già inventariati e filtra per regione', async () => {
    const user = userEvent.setup()
    open()
    const preparing = await screen.findByRole('region', { name: /Fogli in preparazione/ })
    expect(within(preparing).getByRole('link', { name: /Foglio 05/ }).closest('li')).toHaveTextContent(/2 concetti inventariati/)
    expect(within(preparing).getByRole('link', { name: /Foglio 17/ }).closest('li')).toHaveTextContent(/Inventario in corso · 1 concetto finora/)
    expect(within(preparing).getByRole('link', { name: /Foglio 18/ }).closest('li')).toHaveTextContent(/Inventario da fare/)
    await user.click(screen.getByRole('radio', { name: 'Passerini' }))
    expect(within(preparing).queryByRole('link', { name: /Foglio 05/ })).toBeNull()
    expect(within(preparing).getByRole('link', { name: /Foglio 23/ })).toHaveAttribute('href', '/m/p01-stima-parametri')
    expect(screen.queryByRole('button', { name: /Foglio 09/ })).toBeNull()
  })

  it('un foglio pronto che non si carica resta nel registro con Riprova', async () => {
    const user = userEvent.setup()
    open()
    const register = await screen.findByRole('region', { name: /Registro dei fogli pronti/ })
    const failed = await within(register).findByText(/Foglio 04.*non si sono caricati/)
    load.fail.add('m09-parzen-windows')
    await user.click(within(failed.closest('div') as HTMLElement).getByRole('button', { name: /Riprova/ }))
    // al secondo giro non si carica neanche il 09: la pagina non si rompe
    expect(await within(register).findByText(/Foglio 09.*non si sono caricati/)).toBeInTheDocument()
  })
})
