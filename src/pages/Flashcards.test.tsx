import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { manifest } from '../content/manifest'
import type { CourseId, ModuleData } from '../content/types'
import { progressKey, useProgress } from '../store/progress'
import Flashcards from './Flashcards'

// Due fogli "scritti" in due regioni diverse; la terza regione è tutta in preparazione.
// La pagina non deve conoscere nessun id: li prende dal registry (qui finto) e dal manifest.
const M09 = 'm09-parzen-windows'
const P03 = 'p03-reti-bayesiane'
const DAY = 86_400_000
const NOW = new Date(2026, 8, 24, 10, 0, 0).getTime()

function mod(id: string, course: CourseId, cards: number): ModuleData {
  return {
    id,
    title: manifest.find((m) => m.id === id)?.title ?? id,
    titleEn: id,
    course,
    chapter: 'Capitolo',
    order: 1,
    sources: [],
    prerequisites: [],
    estimatedMinutes: 30,
    summary: '',
    keyPoints: [],
    glossary: [],
    formulas: [],
    derivations: [],
    figures: [],
    flashcards: Array.from({ length: cards }, (_, i) => ({ id: `fc${i + 1}`, q: `Domanda ${id} ${i + 1}`, a: `Risposta ${id} ${i + 1}`, kind: 'definizione' as const })),
    quiz: [],
    exam: [],
    exercises: [],
    widgets: [],
    connections: [],
    coverage: {},
  }
}

const fake = vi.hoisted(() => ({ ready: [] as string[], data: new Map<string, unknown>(), broken: new Set<string>() }))

vi.mock('../content/registry', () => ({
  hasModule: (id: string) => fake.ready.includes(id),
  loadModuleData: vi.fn(async (id: string) => {
    if (fake.broken.has(id) || !fake.data.has(id)) throw new Error(`Modulo non trovato: ${id}`)
    return fake.data.get(id)
  }),
  loadModuleContent: vi.fn(async () => {
    throw new Error('non serve in questi test')
  }),
  loadAllModuleData: vi.fn(async () => {
    throw new Error('la pagina carica i fogli uno per uno')
  }),
}))

function open(path = '/flashcard') {
  const router = createMemoryRouter(
    [
      { path: '/flashcard', Component: Flashcards },
      { path: '/', element: <p>Copertina</p> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const ambito = () => screen.getByRole('group', { name: 'Ambito' })
const radio = (name: RegExp) => within(ambito()).getByRole('radio', { name })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  useProgress.getState().reset()
  localStorage.clear()
  fake.ready = [M09, P03]
  fake.data = new Map<string, unknown>([
    [M09, mod(M09, 'melgani', 12)],
    [P03, mod(P03, 'passerini', 3)],
  ])
  fake.broken = new Set()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('pagina Flashcard', () => {
  it('ha il titolo e le letture di tutto l\'atlante', async () => {
    useProgress.setState({ flashcards: { [progressKey(M09, 'fc1')]: { ef: 2.5, interval: 1, reps: 1, due: NOW - DAY } } })
    open()
    expect(await screen.findByRole('heading', { level: 1, name: /Flashcard/ })).toBeInTheDocument()
    const header = screen.getByRole('heading', { level: 1 }).closest('header') as HTMLElement
    await waitFor(() => expect(within(header).getByText('In scadenza').nextElementSibling).toHaveTextContent('1'))
    expect(within(header).getByText('Nuove').nextElementSibling).toHaveTextContent('14')
    expect(within(header).getByText('Fogli pronti').nextElementSibling).toHaveTextContent(`2 di ${manifest.length}`)
  })

  it('la legenda dell\'ambito conta carte in scadenza e nuove per regione; la regione senza fogli pronti è in preparazione', async () => {
    useProgress.setState({ flashcards: { [progressKey(P03, 'fc2')]: { ef: 2.5, interval: 1, reps: 1, due: NOW - DAY } } })
    open()
    await screen.findByRole('group', { name: 'Ambito' })
    expect(radio(/^Tutte le regioni/)).toBeChecked()
    expect(radio(/^Tutte le regioni/)).toHaveAccessibleName(/2 di 50 fogli pronti.*1 in scadenza.*14 nuove/)
    expect(radio(/^Melgani/)).toHaveAccessibleName(/1 di 22 fogli pronti.*0 in scadenza.*12 nuove/)
    expect(radio(/^Passerini/)).toHaveAccessibleName(/1 di 14 fogli pronti.*1 in scadenza.*2 nuove/)
    expect(radio(/^Ricci/)).toHaveAccessibleName(/0 di 14 fogli pronti.*In preparazione/)
    // i fogli non pronti ci sono nell'elenco, ma non si scelgono
    const select = within(ambito()).getByRole('combobox', { name: 'Foglio' })
    expect(within(select).getAllByRole('option')).toHaveLength(manifest.length)
    expect(within(select).getByRole('option', { name: /^09 · Finestre di Parzen/ })).toBeEnabled()
    expect(within(select).getByRole('option', { name: /^10 · .*\(in preparazione\)$/ })).toBeDisabled()
  })

  it('l\'ambito scelto va nell\'URL, e dall\'URL si apre già scelto', async () => {
    const user = userEvent.setup()
    const router = open(`/flashcard?regione=passerini`)
    await screen.findByRole('group', { name: 'Ambito' })
    expect(radio(/^Passerini/)).toBeChecked()
    await user.click(radio(/^Melgani/))
    expect(router.state.location.search).toBe('?regione=melgani')
    await user.selectOptions(within(ambito()).getByRole('combobox', { name: 'Foglio' }), P03)
    expect(router.state.location.search).toBe(`?foglio=${P03}`)
    expect(radio(/^Un foglio/)).toBeChecked()
  })

  it('una sessione su un foglio: le carte del foglio, poi il bilancio e le prossime', async () => {
    const user = userEvent.setup()
    open(`/flashcard?foglio=${P03}`)
    const start = await screen.findByRole('button', { name: /Inizia la sessione/ })
    expect(start).toHaveAccessibleName(/3 carte/)
    await user.click(start)

    const deck = screen.getByRole('region', { name: /^Flashcard: Foglio 25/ })
    // il fuoco va sul mazzo: Spazio gira subito la carta
    expect(deck).toHaveFocus()
    expect(within(deck).getByText('Carta 1 di 3')).toBeInTheDocument()
    expect(within(deck).getByText('Domanda p03-reti-bayesiane 1')).toBeInTheDocument()

    for (let i = 0; i < 3; i++) {
      await user.click(within(deck).getByRole('button', { name: /Mostra la risposta/ }))
      await user.click(within(deck).getByRole('button', { name: i === 0 ? /^Non la sapevo/ : /^Bene/ }))
    }
    expect(within(deck).getByRole('heading', { name: 'Sessione finita' })).toBeInTheDocument()
    expect(useProgress.getState().flashcards[progressKey(P03, 'fc1')]?.reps).toBe(0)
    expect(useProgress.getState().flashcards[progressKey(P03, 'fc2')]?.reps).toBe(1)

    const report = screen.getByRole('region', { name: 'Dopo la sessione' })
    expect(within(report).getByText(/Per oggi hai finito le carte nel foglio 25/)).toBeInTheDocument()
    await user.click(within(report).getByRole('button', { name: 'Cambia ambito' }))
    expect(screen.getByRole('heading', { name: 'Prepara la sessione' })).toHaveFocus()
    // le carte votate non sono più in scadenza
    expect(radio(/^Un foglio/)).toHaveAccessibleName('Un foglio')
    expect(screen.getByText(/Nessuna carta in scadenza nel foglio 25/)).toBeInTheDocument()
  })

  it('su più fogli il bilancio è per foglio, e si sceglie quante carte fare', async () => {
    const user = userEvent.setup()
    // il foglio di Passerini è già aperto: le sue carte nuove vengono prima
    useProgress.getState().setModuleStatus(P03, 'in-corso')
    open()
    const size = await screen.findByRole('radiogroup', { name: 'Carte in questa sessione' })
    await user.click(within(size).getByRole('radio', { name: '10' }))
    expect(screen.getByRole('button', { name: /Inizia la sessione/ })).toHaveAccessibleName(/10 carte/)
    expect(screen.getByText(/10 carte nuove, a partire dai fogli che hai già aperto/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Inizia la sessione/ }))

    const deck = screen.getByRole('region', { name: 'Flashcard: Tutti i fogli' })
    expect(within(deck).getByText('Carta 1 di 10')).toBeInTheDocument()
    expect(within(deck).getByText('Foglio 25 · Reti bayesiane: definizione e indipendenze')).toBeInTheDocument()
    for (let i = 0; i < 10; i++) {
      await user.click(within(deck).getByRole('button', { name: /Mostra la risposta/ }))
      await user.click(within(deck).getByRole('button', { name: /^Facile/ }))
    }
    const report = screen.getByRole('region', { name: 'Dopo la sessione' })
    const rows = within(within(report).getByRole('table', { name: 'Bilancio per foglio' })).getAllByRole('row')
    expect(rows.map((r) => r.textContent)).toEqual([expect.stringMatching(/Foglio/), expect.stringMatching(/^Foglio 09.*7.*0/), expect.stringMatching(/^Foglio 25.*3.*0/)])
    expect(within(report).getByText(/in tutto l'atlante restano 5 carte nuove/i)).toBeInTheDocument()
    await user.click(within(report).getByRole('button', { name: /Continua con altre 5 carte/ }))
    expect(within(screen.getByRole('region', { name: 'Flashcard: Tutti i fogli' })).getByText('Carta 1 di 5')).toBeInTheDocument()
  })

  it('la scelta dell\'ambito dice «Tutte le regioni» come le altre pagine e si segna a inchiostro, non a spillo (regressione)', async () => {
    open()
    const all = await within(await screen.findByRole('group', { name: 'Ambito' })).findByRole('radio', { name: /^Tutte le regioni/ })
    expect(all).toBeChecked()
    const mark = all.closest('label')!.querySelector('[aria-hidden="true"]')!
    expect(mark.className).toContain('group-has-[input:checked]:bg-accent')
    expect(mark.className).not.toContain('bg-pin')
  })

  it('a una carta dalla fine il pulsante dice «l\'ultima carta», non «altre 1 carta» (regressione)', async () => {
    const user = userEvent.setup()
    fake.ready = [M09]
    fake.data = new Map<string, unknown>([[M09, mod(M09, 'melgani', 11)]])
    open()
    const size = await screen.findByRole('radiogroup', { name: 'Carte in questa sessione' })
    await user.click(within(size).getByRole('radio', { name: '10' }))
    await user.click(screen.getByRole('button', { name: /Inizia la sessione/ }))
    const deck = screen.getByRole('region', { name: /^Flashcard:/ })
    for (let i = 0; i < 10; i++) {
      await user.click(within(deck).getByRole('button', { name: /Mostra la risposta/ }))
      await user.click(within(deck).getByRole('button', { name: /^Facile/ }))
    }
    const report = screen.getByRole('region', { name: 'Dopo la sessione' })
    expect(within(report).getByRole('button', { name: "Continua con l'ultima carta" })).toBeInTheDocument()
    expect(within(report).queryByText(/altre 1/)).toBeNull()
  })

  it('senza carte in scadenza propone il ripasso delle carte che tornano prima', async () => {
    const user = userEvent.setup()
    const flashcards = Object.fromEntries([1, 2, 3].map((i) => [progressKey(P03, `fc${i}`), { ef: 2.5, interval: 6, reps: 2, due: NOW + i * DAY }]))
    useProgress.setState({ flashcards })
    open(`/flashcard?foglio=${P03}`)
    expect(await screen.findByText(/Nessuna carta in scadenza nel foglio 25/)).toBeInTheDocument()
    expect(screen.getByText(/La prossima torna domani/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Ripassa comunque 3 carte/ }))
    expect(within(screen.getByRole('region', { name: /^Flashcard: Foglio 25/ })).getByText('Carta 1 di 3')).toBeInTheDocument()
  })

  it('una regione senza fogli pronti lo dice e riporta a tutti i fogli', async () => {
    const user = userEvent.setup()
    const router = open('/flashcard?regione=ricci')
    expect(await screen.findByText(/Nessuno dei 14 fogli della regione Ricci è ancora pronto/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Inizia la sessione/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Scegli tutti i fogli pronti' }))
    expect(router.state.location.search).toBe('')
    expect(screen.getByRole('button', { name: /Inizia la sessione/ })).toBeInTheDocument()
  })

  it('senza fogli pronti non c\'è niente da ripassare, e lo dice', async () => {
    fake.ready = []
    open()
    expect(await screen.findByText(/Nessun foglio è ancora pronto/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Torna alla copertina' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('group', { name: 'Ambito' })).not.toBeInTheDocument()
  })

  it('un foglio che non si carica non ferma la pagina', async () => {
    fake.broken = new Set([M09])
    open()
    expect(await screen.findByText(/Foglio 09 non si è caricato/)).toBeInTheDocument()
    expect(radio(/^Tutte le regioni/)).toHaveAccessibleName(/3 nuove/)
    fake.broken = new Set()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Riprova' }))
    await waitFor(() => expect(radio(/^Tutte le regioni/)).toHaveAccessibleName(/15 nuove/))
    expect(screen.queryByText(/non si è caricato/)).not.toBeInTheDocument()
  })

  it('mostra le carte che tornano nei prossimi giorni', async () => {
    useProgress.setState({
      flashcards: {
        [progressKey(M09, 'fc1')]: { ef: 2.5, interval: 1, reps: 1, due: NOW + DAY },
        [progressKey(M09, 'fc2')]: { ef: 2.5, interval: 1, reps: 1, due: NOW + DAY },
      },
    })
    open()
    const list = await screen.findByRole('list', { name: 'Carte che tornano nei prossimi 7 giorni' })
    const days = within(list).getAllByRole('listitem')
    expect(days).toHaveLength(7)
    expect(days[1]).toHaveTextContent(/domani.*2/)
    act(() => {})
  })
})
