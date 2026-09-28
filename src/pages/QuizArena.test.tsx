import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { manifest } from '../content/manifest'
import type { CourseId, ModuleData, QuizItem } from '../content/types'
import { moduleOfKey, progressKey, useProgress } from '../store/progress'
import type { QuizStat } from '../store/progress'
import QuizArena from './QuizArena'

// Due fogli "scritti" in due regioni; la terza regione è tutta in preparazione.
const M09 = 'm09-parzen-windows'
const P03 = 'p03-reti-bayesiane'
const NOW = new Date(2026, 8, 24, 10, 0, 0).getTime()

// vero o falso, sempre vero: il testo dice da quale foglio viene la domanda
const tf = (moduleId: string, i: number): QuizItem => ({
  id: `q${i}`,
  type: 'tf',
  q: `Domanda ${i} del foglio ${moduleId}`,
  answer: true,
  explanation: 'Perché sì.',
  difficulty: 1,
  concepts: [],
})

function mod(id: string, course: CourseId, questions: number): ModuleData {
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
    flashcards: [],
    quiz: Array.from({ length: questions }, (_, i) => tf(id, i + 1)),
    exam: [],
    exercises: [],
    widgets: [],
    connections: [],
    coverage: {},
  }
}

const fake = vi.hoisted(() => ({ ready: [] as string[], data: new Map<string, unknown>() }))

vi.mock('../content/registry', () => ({
  hasModule: (id: string) => fake.ready.includes(id),
  loadModuleData: vi.fn(async (id: string) => {
    if (!fake.data.has(id)) throw new Error(`Modulo non trovato: ${id}`)
    return fake.data.get(id)
  }),
  loadModuleContent: vi.fn(async () => {
    throw new Error('non serve in questi test')
  }),
  loadAllModuleData: vi.fn(async () => {
    throw new Error('la pagina carica i fogli uno per uno')
  }),
}))

function open(path = '/quiz') {
  const router = createMemoryRouter(
    [
      { path: '/quiz', Component: QuizArena },
      { path: '/m/:moduleId/:tab?', element: <p>Foglio</p> },
      { path: '/', element: <p>Copertina</p> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const stat = (attempts: number, correct: number, lastCorrect: boolean): QuizStat => ({ attempts, correct, lastCorrect, lastAt: NOW })
const modes = () => screen.getByRole('radiogroup', { name: 'Modo' })
// la cornice della domanda ha per nome il testo della domanda: la si trova dalla sua etichetta "Domanda i di n"
const frame = (i: number, n: number) => screen.getByText(`Domanda ${i} di ${n}`).closest('section') as HTMLElement

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  useProgress.getState().reset()
  localStorage.clear()
  fake.ready = [M09, P03]
  fake.data = new Map<string, unknown>([
    [M09, mod(M09, 'melgani', 12)],
    [P03, mod(P03, 'passerini', 4)],
  ])
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('arena dei quiz', () => {
  it('ha il titolo, le letture di tutto l\'atlante e la legenda dell\'ambito con domande ed errori per regione', async () => {
    useProgress.setState({ quiz: { [progressKey(P03, 'q1')]: stat(2, 1, false), [progressKey(M09, 'q2')]: stat(1, 1, true) } })
    open()
    const h1 = await screen.findByRole('heading', { level: 1, name: /Quiz/ })
    const header = h1.closest('header') as HTMLElement
    await waitFor(() => expect(within(header).getByText('Domande').nextElementSibling).toHaveTextContent('16'))
    expect(within(header).getByText('Provate').nextElementSibling).toHaveTextContent('2 di 16')
    expect(within(header).getByText('Accuratezza').nextElementSibling).toHaveTextContent('67%')
    expect(within(header).getByText('Errori aperti').nextElementSibling).toHaveTextContent('1')
    const scope = screen.getByRole('group', { name: 'Ambito' })
    expect(within(scope).getByRole('radio', { name: /^Passerini/ })).toHaveAccessibleName(/1 di 14 fogli pronti.*4 domande.*1 da ripassare/)
    expect(within(scope).getByRole('radio', { name: /^Ricci/ })).toHaveAccessibleName(/In preparazione/)
  })

  it('il modo sta nell\'URL', async () => {
    const user = userEvent.setup()
    const router = open('/quiz?modo=esame&regione=melgani')
    await screen.findByRole('radiogroup', { name: 'Modo' })
    expect(within(modes()).getByRole('radio', { name: 'Esame a tempo' })).toBeChecked()
    await user.click(within(modes()).getByRole('radio', { name: 'Allenamento' }))
    expect(router.state.location.search).toBe('?regione=melgani')
    await user.click(within(modes()).getByRole('radio', { name: /Ripasso degli errori/ }))
    expect(router.state.location.search).toBe('?regione=melgani&modo=errori')
  })

  it('allenamento: estrae il numero di domande scelto, dà l\'esito subito e lo registra nei progressi', async () => {
    const user = userEvent.setup()
    open()
    const count = await screen.findByRole('radiogroup', { name: 'Domande' })
    await user.click(within(count).getByRole('radio', { name: '5' }))
    const start = screen.getByRole('button', { name: /Inizia l'allenamento/ })
    expect(start).toHaveAccessibleName(/5 domande/)
    await user.click(start)

    const question = frame(1, 5)
    // il fuoco va sul testo della domanda: i tasti 1-9 scelgono subito
    expect(within(question).getByText(/^Domanda \d+ del foglio/).closest('[tabindex="-1"]')).toHaveFocus()
    await user.keyboard('1')
    await user.click(within(question).getByRole('button', { name: 'Controlla' }))
    expect(within(question).getByText('Risposta corretta')).toBeInTheDocument()
    const recorded = Object.keys(useProgress.getState().quiz)
    expect(recorded).toHaveLength(1)
    expect([M09, P03]).toContain(moduleOfKey(recorded[0]))

    await user.click(screen.getByRole('button', { name: 'Esci dalla prova' }))
    expect(screen.getByRole('heading', { name: 'Prepara la prova' })).toHaveFocus()
  })

  it('esame a tempo: niente esito fino alla consegna, tempo di un minuto a domanda', async () => {
    const user = userEvent.setup()
    open('/quiz?modo=esame')
    const count = await screen.findByRole('radiogroup', { name: 'Domande' })
    await user.click(within(count).getByRole('radio', { name: '10' }))
    const start = screen.getByRole('button', { name: /Inizia l'esame/ })
    expect(start).toHaveAccessibleName(/10 domande.*10 min/)
    await user.click(start)
    expect(screen.getByRole('timer', { name: 'Tempo rimasto' })).toHaveTextContent('10:00')
    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Avanti' }))
    expect(screen.queryByText('Risposta corretta')).not.toBeInTheDocument()
    expect(useProgress.getState().quiz).toEqual({})
    await user.click(screen.getByRole('button', { name: /Consegna ora/ }))
    expect(screen.getByRole('heading', { name: 'Prova finita' })).toBeInTheDocument()
    expect(Object.keys(useProgress.getState().quiz)).toHaveLength(1)
  })

  it('ripasso degli errori: solo le domande sbagliate l\'ultima volta, nell\'ambito scelto', async () => {
    const user = userEvent.setup()
    useProgress.setState({
      quiz: {
        [progressKey(M09, 'q3')]: stat(2, 0, false),
        [progressKey(M09, 'q7')]: stat(1, 0, false),
        [progressKey(M09, 'q1')]: stat(1, 1, true),
        [progressKey(P03, 'q2')]: stat(1, 0, false),
      },
    })
    open(`/quiz?modo=errori&foglio=${M09}`)
    await screen.findByRole('radiogroup', { name: 'Modo' })
    expect(within(modes()).getByRole('radio', { name: /Ripasso degli errori · 2/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /Inizia il ripasso/ }))
    const texts: string[] = []
    for (let i = 0; i < 2; i++) {
      const question = frame(i + 1, 2)
      texts.push(within(question).getByText(/^Domanda \d+ del foglio/).textContent ?? '')
      await user.keyboard('1')
      await user.click(within(question).getByRole('button', { name: 'Controlla' }))
      await user.click(within(question).getByRole('button', { name: /Prossima domanda|Vedi il risultato/ }))
    }
    expect(texts.sort()).toEqual([`Domanda 3 del foglio ${M09}`, `Domanda 7 del foglio ${M09}`])
  })

  it('senza errori aperti il ripasso lo dice e riporta all\'allenamento', async () => {
    const user = userEvent.setup()
    const router = open('/quiz?modo=errori')
    expect(await screen.findByText(/Nessun errore aperto in tutto l'atlante/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: "Passa all'allenamento" }))
    expect(router.state.location.search).toBe('')
    expect(screen.getByRole('button', { name: /Inizia l'allenamento/ })).toBeInTheDocument()
  })

  it('lo storico dà per ogni foglio pronto provate, accuratezza e errori aperti, e i fogli in preparazione per regione', async () => {
    const user = userEvent.setup()
    useProgress.setState({ quiz: { [progressKey(M09, 'q1')]: stat(3, 0, false), [progressKey(M09, 'q2')]: stat(1, 1, true) } })
    const router = open()
    const table = await screen.findByRole('table', { name: "Storico dell'accuratezza per foglio" })
    // i fogli mai provati si aprono a richiesta
    await user.click(screen.getByRole('button', { name: /Mostra tutti i fogli/ }))
    const m09 = within(table).getByRole('row', { name: /Foglio 09/ })
    expect(m09).toHaveTextContent(/2 di 12 provate/)
    expect(m09).toHaveTextContent(/50% ora/) // ultimo tentativo: 1 giusta su 2 provate
    expect(m09).toHaveTextContent(/25% in tutto, su 4 tentativi/)
    expect(within(m09).getByRole('link', { name: /Foglio 09/ })).toHaveAttribute('href', `/m/${M09}/quiz`)
    const p03 = within(table).getByRole('row', { name: /Foglio 25/ })
    expect(p03).toHaveTextContent(/4 domande, mai provate/)
    expect(within(table).getByText(/14 fogli in preparazione/)).toBeInTheDocument()
    expect(within(table).getByText(/21 fogli in preparazione/)).toBeInTheDocument()

    // dal foglio si va dritti al ripasso dei suoi errori
    await user.click(within(m09).getByRole('button', { name: 'Ripassa gli errori del foglio 09' }))
    expect(router.state.location.search).toBe(`?foglio=${M09}&modo=errori`)
    expect(screen.getByRole('heading', { name: 'Prepara la prova' })).toHaveFocus()
    expect(screen.getByRole('button', { name: /Inizia il ripasso/ })).toHaveAccessibleName(/1 domanda/)
  })

  it('storico senza tentativi: una frase e da dove partire, niente tabella piena di zeri (regressione)', async () => {
    const user = userEvent.setup()
    const router = open()
    const history = await screen.findByRole('region', { name: "Storico dell'accuratezza" })
    expect(within(history).getByText(/Non hai ancora risposto a nessun quiz/)).toBeInTheDocument()
    expect(within(history).queryByRole('table')).toBeNull()
    await user.click(within(history).getByRole('button', { name: 'Allenati sul foglio 09' }))
    expect(router.state.location.search).toBe(`?foglio=${M09}`)
    expect(screen.getByRole('heading', { name: 'Prepara la prova' })).toHaveFocus()
  })

  it('storico: prima solo i fogli provati, gli altri con «Mostra tutti i fogli» (regressione)', async () => {
    const user = userEvent.setup()
    useProgress.setState({ quiz: { [progressKey(M09, 'q1')]: stat(1, 1, true) } })
    open()
    const table = await screen.findByRole('table', { name: "Storico dell'accuratezza per foglio" })
    expect(within(table).getByRole('row', { name: /Foglio 09/ })).toBeInTheDocument()
    expect(within(table).queryByRole('row', { name: /Foglio 25/ })).toBeNull()
    const more = screen.getByRole('button', { name: /Mostra tutti i fogli \(1 altro\)/ })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await user.click(more)
    expect(within(table).getByRole('row', { name: /Foglio 25/ })).toBeInTheDocument()
  })

  it('con un solo foglio pronto non promette «parti uguali fra i fogli» (regressione)', async () => {
    const user = userEvent.setup()
    fake.ready = [M09]
    open()
    await screen.findByRole('button', { name: /Inizia l'allenamento/ })
    expect(screen.queryByText(/parti uguali/)).toBeNull()
    await user.click(within(screen.getByRole('radiogroup', { name: 'Domande' })).getByRole('radio', { name: '5' }))
    await user.click(screen.getByRole('button', { name: /Inizia l'allenamento/ }))
    expect(screen.getByText('5 domande estratte a caso dal foglio 09')).toBeInTheDocument()
    expect(screen.queryByText(/parti uguali/)).toBeNull()
  })

  it('con più fogli pronti dice fra quanti fogli divide le domande', async () => {
    const user = userEvent.setup()
    open()
    await user.click(within(await screen.findByRole('radiogroup', { name: 'Domande' })).getByRole('radio', { name: '5' }))
    await user.click(screen.getByRole('button', { name: /Inizia l'allenamento/ }))
    expect(screen.getByText('5 domande estratte a caso, in parti uguali fra i 2 fogli')).toBeInTheDocument()
  })

  it('senza fogli pronti lo dice', async () => {
    fake.ready = []
    open()
    expect(await screen.findByText(/Nessun foglio è ancora pronto/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
