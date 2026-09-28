import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineModule } from '../content/types'
import type { ModuleData } from '../content/types'
import { dayKey, initialProgress, progressKey, useProgress } from '../store/progress'
import Progress from './Progress'

const ID = 'm09-parzen-windows'
const DAY = 86_400_000

const data: ModuleData = defineModule({
  id: ID,
  title: 'Finestre di Parzen',
  titleEn: 'Parzen windows',
  course: 'melgani',
  chapter: 'Cap. 2',
  order: 9,
  sources: [],
  prerequisites: [],
  estimatedMinutes: 60,
  summary: '',
  keyPoints: [],
  glossary: [],
  formulas: [],
  derivations: [],
  figures: [],
  flashcards: [
    { id: 'a', q: 'A', a: 'a', kind: 'definizione' },
    { id: 'b', q: 'B', a: 'b', kind: 'definizione' },
    { id: 'c', q: 'C', a: 'c', kind: 'definizione' },
  ],
  quiz: [
    { id: 'q1', type: 'tf', q: 'Uno', answer: true, explanation: '', difficulty: 1, concepts: [] },
    { id: 'q2', type: 'tf', q: 'Due', answer: true, explanation: '', difficulty: 1, concepts: [] },
  ],
  exam: [{ id: 'e1', q: 'Descrivi il metodo di Parzen', qEn: 'Describe Parzen', prof: 'Melgani', fromBank: true, answer: '', checklist: [], followUps: [] }],
  exercises: [],
  widgets: [{ id: 'm09-somma', title: 'La somma dei kernel', concepts: [] }],
  connections: [],
  coverage: {},
})

// un secondo foglio pronto, mai toccato: con 50 fogli sono quasi tutti così
const OTHER = 'm08-non-parametrica-knn'
const other: ModuleData = { ...data, id: OTHER, title: 'Stima non parametrica e K-NN', widgets: [] }

vi.mock('../content/registry', () => ({
  hasModule: (id: string) => id === 'm09-parzen-windows' || id === 'm08-non-parametrica-knn',
  loadModuleData: vi.fn(async (id: string) => (id === 'm08-non-parametrica-knn' ? other : data)),
  loadModuleContent: vi.fn(async () => {
    throw new Error('non serve')
  }),
  loadAllModuleData: vi.fn(async () => [other, data]),
}))

function open() {
  const router = createMemoryRouter(
    [
      { path: '/progressi', Component: Progress },
      { path: '*', element: <p>altrove</p> },
    ],
    { initialEntries: ['/progressi'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

/** Uno studio vero: foglio rilevato, carte, quiz, due simulazioni, una sfida, tre giorni di fila fino a oggi. */
function seed() {
  const now = Date.now()
  act(() =>
    useProgress.setState({
      modules: { [ID]: { status: 'completato', sections: ['panoramica'], lastSection: 'panoramica', lastVisited: now } },
      flashcards: {
        [progressKey(ID, 'a')]: { ef: 2.5, interval: 1, reps: 1, due: now - DAY },
        [progressKey(ID, 'b')]: { ef: 2.5, interval: 6, reps: 2, due: now + 5 * DAY },
      },
      quiz: {
        [progressKey(ID, 'q1')]: { attempts: 3, correct: 2, lastCorrect: false, lastAt: now },
        [progressKey(ID, 'q2')]: { attempts: 1, correct: 1, lastCorrect: true, lastAt: now },
      },
      exam: [
        { key: progressKey(ID, 'e1'), score: 1, at: now - 2 * DAY, seconds: 95 },
        { key: progressKey(ID, 'e1'), score: 3, at: now - DAY, seconds: 130 },
      ],
      challenges: { 'm09-somma': now - DAY },
      streak: { current: 3, best: 5, lastDay: dayKey(now) },
    }),
  )
}

beforeEach(() => {
  useProgress.getState().reset()
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Progressi: letture', () => {
  it('senza progressi lo dice e propone da dove partire, senza tabelle piene di zeri', async () => {
    open()
    expect(screen.getByRole('heading', { level: 1, name: 'Progressi' })).toBeInTheDocument()
    expect(screen.getByText(/Non hai ancora progressi/)).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Comincia dalle flashcard' })).toHaveAttribute('href', '/flashcard')
    expect(screen.getByRole('link', { name: 'Comincia dai quiz' })).toHaveAttribute('href', '/quiz')
    expect(screen.queryByRole('table', { name: /Flashcard per foglio/ })).toBeNull()
    expect(screen.queryByRole('table', { name: /Quiz per foglio/ })).toBeNull()
    expect(screen.getByText(/Nessuna simulazione/)).toBeInTheDocument()
  })

  it('le tabelle mostrano i fogli toccati; gli altri si aprono con «Mostra tutti i fogli»', async () => {
    seed()
    const user = userEvent.setup()
    open()
    const cards = await screen.findByRole('table', { name: /Flashcard per foglio/ })
    expect(within(cards).queryByRole('row', { name: /K-NN/ })).toBeNull()
    await user.click(within(screen.getByRole('region', { name: /^Flashcard\s+Flashcards/ })).getByRole('button', { name: /Mostra tutti i fogli/ }))
    expect(within(screen.getByRole('table', { name: /Flashcard per foglio/ })).getByRole('row', { name: /K-NN/ })).toBeInTheDocument()
  })

  it('i nomi dei fogli sono bersagli alti almeno 40 px', async () => {
    seed()
    open()
    const sheets = screen.getByRole('region', { name: /^Fogli/ })
    const link = within(within(sheets).getByRole('list', { name: /Rilevato/ })).getByRole('link', { name: /Finestre di Parzen/ })
    expect(link).toHaveClass('min-h-10', 'items-center')
  })

  it('mostra fogli per stato, carte, accuratezza dei quiz, simulazioni con voti, sfide e serie', async () => {
    seed()
    open()
    const sheets = screen.getByRole('region', { name: /^Fogli/ })
    expect(within(within(sheets).getByRole('list', { name: /Rilevato/ })).getByRole('link', { name: /Finestre di Parzen/ })).toHaveAttribute('href', `/m/${ID}`)
    expect(screen.getByText('3 giorni')).toBeInTheDocument()
    expect(screen.getByText(/record 5/)).toBeInTheDocument()

    const quiz = await screen.findByRole('table', { name: /Quiz per foglio/ })
    const qrow = within(quiz).getByRole('row', { name: /Finestre di Parzen/ })
    expect(qrow).toHaveTextContent('75%')
    expect(within(qrow).getByRole('link', { name: /Rifai i quiz/ })).toHaveAttribute('href', `/m/${ID}/quiz`)

    const cards = screen.getByRole('table', { name: /Flashcard per foglio/ })
    const crow = within(cards).getByRole('row', { name: /Finestre di Parzen/ })
    // 3 carte, 2 ripassate, 1 in scadenza, 1 mai vista
    expect(within(crow).getAllByRole('cell').slice(0, 4).map((c) => c.textContent)).toEqual(['3', '2', '1', '1'])

    const oral = screen.getByRole('region', { name: /Simulazioni d'orale/ })
    expect(oral).toHaveTextContent(/2 simulazioni/)
    expect(oral).toHaveTextContent(/media 2,0 su 3/)
    const recent = within(oral).getByRole('list', { name: /Ultime simulazioni/ })
    const items = within(recent).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent(/Descrivi il metodo di Parzen/)
    expect(items[0]).toHaveTextContent(/Completa/)
    expect(items[0]).toHaveTextContent('2:10')

    const challenges = screen.getByRole('region', { name: /Sfide dei widget/ })
    expect(within(challenges).getByRole('link', { name: /La somma dei kernel/ })).toHaveAttribute('href', '/lab/m09-somma')
  })
})

describe('Progressi: salva e ripristina', () => {
  it('scarica il backup come file JSON con la data nel nome', async () => {
    seed()
    const user = userEvent.setup()
    const created: Blob[] = []
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn((b: Blob) => (created.push(b), 'blob:backup')), revokeObjectURL: vi.fn() }))
    const downloads: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download)
    })
    open()
    await user.click(screen.getByRole('button', { name: /Scarica il backup/ }))
    expect(downloads).toEqual([`ml-study-hub-progressi-${dayKey(Date.now())}.json`])
    const text = await created[0].text()
    expect(JSON.parse(text)).toMatchObject({ app: 'ml-study-hub', state: { streak: { best: 5 } } })
    expect(screen.getByText(/Backup scaricato/)).toBeInTheDocument()
  })

  it('un file che non è un backup dà un errore chiaro e non tocca i progressi', async () => {
    seed()
    const user = userEvent.setup()
    open()
    await user.upload(screen.getByLabelText(/Scegli il file del backup/), new File(['ciao'], 'appunti.json', { type: 'application/json' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/appunti\.json/)
    expect(alert).toHaveTextContent(/il testo non è JSON/)
    expect(useProgress.getState().streak.best).toBe(5)
  })

  it('un backup valido si guarda prima e sostituisce i progressi solo dopo la conferma', async () => {
    const user = userEvent.setup()
    open()
    const backup = { app: 'ml-study-hub', version: 1, exportedAt: new Date(2026, 8, 20).getTime(), state: { ...initialProgress(), exam: [{ key: 'm09-parzen-windows:e1', score: 2, at: 1 }] } }
    await user.upload(screen.getByLabelText(/Scegli il file del backup/), new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' }))
    const preview = await screen.findByRole('group', { name: /Backup del 20 settembre/ })
    expect(preview).toHaveTextContent(/1 simulazione/)
    expect(useProgress.getState().exam).toHaveLength(0)
    await user.click(within(preview).getByRole('button', { name: 'Sostituisci i progressi' }))
    expect(useProgress.getState().exam).toHaveLength(1)
    expect(screen.getByText(/Progressi ripristinati dal backup/)).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /Backup del/ })).toBeNull()
    // l'anteprima sparisce: il fuoco va sul messaggio che dice com'è andata
    // il fuoco si sposta al fotogramma successivo (requestAnimationFrame), dopo che l'anteprima è sparita
    await waitFor(() => expect(screen.getByText(/Progressi ripristinati dal backup/).closest('[tabindex="-1"]')).toHaveFocus())
  })

  it('«Annulla» sull\'anteprima riporta il fuoco alla scelta del file', async () => {
    const user = userEvent.setup()
    open()
    const backup = { app: 'ml-study-hub', version: 1, exportedAt: new Date(2026, 8, 20).getTime(), state: initialProgress() }
    const input = screen.getByLabelText(/Scegli il file del backup/)
    await user.upload(input, new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' }))
    const preview = await screen.findByRole('group', { name: /Backup del 20 settembre/ })
    await user.click(within(preview).getByRole('button', { name: 'Annulla' }))
    expect(input).toHaveFocus()
  })

  it('azzerare chiede una seconda conferma; Annulla non tocca nulla', async () => {
    seed()
    const user = userEvent.setup()
    open()
    const trigger = screen.getByRole('button', { name: /Azzera i progressi/ })
    await user.click(trigger)
    const confirm = screen.getByRole('group', { name: /Azzerare tutti i progressi/ })
    expect(within(confirm).getByRole('button', { name: 'Annulla' })).toHaveFocus()
    await user.click(within(confirm).getByRole('button', { name: 'Annulla' }))
    expect(screen.queryByRole('group', { name: /Azzerare tutti i progressi/ })).toBeNull()
    expect(trigger).toHaveFocus()
    expect(useProgress.getState().streak.best).toBe(5)

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Sì, azzera tutto' }))
    expect(useProgress.getState().streak.best).toBe(0)
    expect(useProgress.getState().exam).toEqual([])
    expect(screen.getByText(/Progressi azzerati/)).toBeInTheDocument()
  })
})
