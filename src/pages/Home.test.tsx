// Copertina, "oggi sul campo": domanda d'orale del giorno, flashcard di oggi, punti deboli nei quiz, progresso
// per regione, riprendi da dove eri. I fogli pronti sono finti (registry simulato): la pagina deve reggere
// zero fogli, uno e molti, senza id scritti a mano. I test di base della copertina sono in services.test.tsx.
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { manifest } from '../content/manifest'
import type { ExamQuestion, Flashcard, ModuleData, QuizItem } from '../content/types'
import { examPool, pickOfTheDay } from '../lib/cover'
import { progressKey, useProgress } from '../store/progress'
import Home from './Home'

// fail: nessun foglio si apre; broken: solo quei fogli non si aprono (un data.ts a metà mentre un altro lavoro scrive)
const reg = vi.hoisted(() => ({ sheets: [] as ModuleData[], fail: false, broken: [] as string[] }))

vi.mock('../content/registry', () => ({
  hasModule: (id: string) => reg.sheets.some((m) => m.id === id),
  loadModuleData: vi.fn(async (id: string) => {
    if (reg.fail || reg.broken.includes(id)) throw new Error('chunk non caricato')
    const m = reg.sheets.find((s) => s.id === id)
    if (!m) throw new Error(`Modulo non trovato: ${id}`)
    return m
  }),
  loadModuleContent: vi.fn(async () => {
    throw new Error('non serve in questi test')
  }),
  // come quello vero: basta un foglio rotto perché fallisca tutto
  loadAllModuleData: vi.fn(async () => {
    if (reg.fail || reg.broken.length > 0) throw new Error('chunk non caricato')
    return reg.sheets
  }),
}))

const NOW = new Date(2026, 8, 24, 10).getTime()
const DAY = 86_400_000

function sheet(id: string, n: { exam?: number; cards?: number; quiz?: number } = {}): ModuleData {
  const meta = manifest.find((m) => m.id === id)!
  const exam = Array.from({ length: n.exam ?? 2 }, (_, i): ExamQuestion => ({
    id: `or${i + 1}`,
    q: `Domanda ${i + 1} del foglio ${meta.title}?`,
    qEn: `Question ${i + 1} about ${meta.titleEn}?`,
    prof: 'Melgani',
    fromBank: i === 0,
    bankText: i === 0 ? 'Verbatim question' : undefined,
    answer: 'Risposta modello.',
    checklist: [`primo punto ${i + 1}`, `secondo punto ${i + 1}`, `terzo punto ${i + 1}`],
    followUps: [],
  }))
  const flashcards = Array.from({ length: n.cards ?? 3 }, (_, i): Flashcard => ({ id: `fc${i + 1}`, q: 'q', a: 'a', kind: 'definizione' }))
  const quiz = Array.from({ length: n.quiz ?? 5 }, (_, i): QuizItem => ({ id: `q${i + 1}`, type: 'tf', q: 'q', answer: true, explanation: '', difficulty: 1, concepts: [] }))
  return { ...meta, order: 0, prerequisites: [], estimatedMinutes: 60, summary: '', keyPoints: [], glossary: [], formulas: [], derivations: [], figures: [], flashcards, quiz, exam, exercises: [], widgets: [], connections: [], coverage: {} }
}

function open() {
  const router = createMemoryRouter(
    [
      { path: '/', Component: Home },
      { path: '*', element: <p>Altra pagina</p> },
    ],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  // due fogli di Melgani e uno di Ricci: la copertina li trova dal registry, mai per id scritti nel componente
  reg.sheets = [sheet('m05-max-likelihood'), sheet('m09-parzen-windows', { exam: 3 }), sheet(manifest.find((m) => m.course === 'ricci')!.id, { exam: 1 })]
  reg.fail = false
  reg.broken = []
  useProgress.getState().reset()
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Domanda d\'orale del giorno', () => {
  it('è quella scelta per la data tra le domande dei fogli pronti, in italiano e in inglese, e porta alla sua scheda d\'orale', async () => {
    open()
    const plate = await screen.findByRole('region', { name: "Domanda d'orale del giorno" })
    const expected = pickOfTheDay(examPool(reg.sheets), NOW)!
    expect(await within(plate).findByText(expected.question.q)).toBeInTheDocument()
    expect(within(plate).getByText(expected.question.qEn)).toHaveAttribute('lang', 'en')
    const answer = within(plate).getByRole('link', { name: /Rispondi ad alta voce/ })
    expect(answer).toHaveAttribute('href', `/m/${expected.moduleId}/orale#exam:${expected.question.id}`)
  })

  it('mostra la traccia dei punti da toccare solo a richiesta', async () => {
    const user = userEvent.setup()
    open()
    const plate = await screen.findByRole('region', { name: "Domanda d'orale del giorno" })
    const expected = pickOfTheDay(examPool(reg.sheets), NOW)!
    const toggle = await within(plate).findByRole('button', { name: /Traccia/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(within(plate).queryByText(expected.question.checklist[0])).not.toBeInTheDocument()
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(within(plate).getByText(expected.question.checklist[0])).toBeVisible()
  })

  it('dice l\'ultimo voto se hai già simulato quella domanda', async () => {
    const expected = pickOfTheDay(examPool(reg.sheets), NOW)!
    act(() => useProgress.getState().recordExam({ key: progressKey(expected.moduleId, expected.question.id), score: 2 }, NOW - DAY))
    open()
    const plate = await screen.findByRole('region', { name: "Domanda d'orale del giorno" })
    expect(await within(plate).findByText(/ultimo voto 2 su 3/i)).toBeInTheDocument()
  })

  it('senza fogli pronti lo dice con garbo, senza rompersi', async () => {
    reg.sheets = []
    open()
    const plate = await screen.findByRole('region', { name: "Domanda d'orale del giorno" })
    expect(await within(plate).findByText(/arriva con il primo foglio pronto/)).toBeInTheDocument()
    expect(within(plate).queryByRole('link', { name: /Rispondi/ })).not.toBeInTheDocument()
  })

  it('se i fogli non si aprono lo dice e permette di riprovare', async () => {
    const user = userEvent.setup()
    reg.fail = true
    open()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Non riesco ad aprire i fogli pronti/)
    reg.fail = false
    await user.click(within(alert).getByRole('button', { name: 'Riprova' }))
    expect(await screen.findByRole('link', { name: /Rispondi ad alta voce/ })).toBeInTheDocument()
  })

  it('se un solo foglio non si apre, la copertina usa gli altri e lo dice', async () => {
    reg.broken = [reg.sheets[0].id]
    open()
    expect(await screen.findByRole('link', { name: /Rispondi ad alta voce/ })).toBeInTheDocument()
    expect(screen.getByText(/Foglio 05 non si è caricato/)).toBeInTheDocument()
    expect(screen.queryByText(/Non riesco ad aprire i fogli pronti/)).not.toBeInTheDocument()
  })
})

describe('Flashcard di oggi', () => {
  it('conta le carte in scadenza oggi e quelle nuove dei fogli pronti, e porta alle flashcard', async () => {
    const [m05, m09] = reg.sheets
    act(() => {
      const s = useProgress.getState()
      s.gradeCard(progressKey(m05.id, 'fc1'), 4, NOW - 2 * DAY) // scaduta ieri
      s.gradeCard(progressKey(m09.id, 'fc1'), 4, NOW - DAY + 1000) // scade oggi, più tardi
      s.gradeCard(progressKey(m09.id, 'fc2'), 5, NOW) // scade domani
    })
    open()
    const box = await screen.findByRole('region', { name: 'Flashcard di oggi' })
    const total = reg.sheets.reduce((n, m) => n + m.flashcards.length, 0)
    await waitFor(() => expect(box).toHaveTextContent(`2 carte in scadenza oggi e ${total - 3} nuove da imparare`))
    expect(within(box).getByRole('link', { name: /Ripassa le flashcard/ })).toHaveAttribute('href', '/flashcard')
  })

  it('a carte finite dice quando scade la prossima', async () => {
    reg.sheets = [sheet('m09-parzen-windows', { cards: 1 })]
    act(() => useProgress.getState().gradeCard(progressKey('m09-parzen-windows', 'fc1'), 4, NOW))
    open()
    const box = await screen.findByRole('region', { name: 'Flashcard di oggi' })
    expect(await within(box).findByText(/Nessuna carta da ripassare oggi/)).toBeInTheDocument()
    expect(within(box).getByText(/domani/)).toBeInTheDocument()
  })
})

describe('Punti deboli', () => {
  it('elenca i fogli dove l\'ultima risposta ai quiz è sbagliata più spesso, con il link ai quiz del foglio', async () => {
    const m05 = reg.sheets[0]
    act(() => {
      const s = useProgress.getState()
      s.recordQuiz(progressKey(m05.id, 'q1'), true, NOW)
      for (const q of ['q2', 'q3', 'q4']) s.recordQuiz(progressKey(m05.id, q), false, NOW)
    })
    open()
    const box = await screen.findByRole('region', { name: 'Punti deboli' })
    const link = within(box).getByRole('link', { name: new RegExp(m05.title.replace(/[()]/g, '.')) })
    expect(link).toHaveAttribute('href', `/m/${m05.id}/quiz`)
    expect(link).toHaveAccessibleName(/1 giusta su 4/)
  })

  it('senza quiz fatti spiega che cosa comparirà', async () => {
    open()
    const box = await screen.findByRole('region', { name: 'Punti deboli' })
    expect(within(box).queryByRole('link')).not.toBeInTheDocument()
    expect(within(box).getByText(/fogli dove sbagli di più/)).toBeInTheDocument()
  })
})

describe('Progresso per regione e ripresa', () => {
  it('ogni regione dice quanti fogli sono pronti e quanti hai rilevato', async () => {
    act(() => useProgress.getState().setModuleStatus('m05-max-likelihood', 'completato'))
    open()
    const melgani = (await screen.findByRole('heading', { name: 'Melgani' })).closest('article')!
    expect(melgani).toHaveTextContent(/2 pronti/)
    expect(melgani).toHaveTextContent(/1 rilevato/)
    const passerini = screen.getByRole('heading', { name: 'Passerini' }).closest('article')!
    expect(passerini).toHaveTextContent(/nessun foglio pronto/)
  })

  it('la ripresa dice quando ti sei fermato', async () => {
    act(() => useProgress.getState().markSection('m09-parzen-windows', 'scelta-di-h', NOW - DAY))
    open()
    const resume = await screen.findByRole('region', { name: /Riprendi da dove eri/ })
    expect(resume).toHaveTextContent(/ieri/)
  })
})

describe('Fogli pronti', () => {
  it('il capitolo è in italiano, con l\'inglese delle fonti accanto (regressione: «CAP. 2 · STATISTICAL ESTIMATION THEORY»)', async () => {
    open()
    const list = await screen.findByRole('list', { name: 'Fogli pronti' })
    const parzen = within(list).getByRole('link', { name: /Finestre di Parzen/ })
    expect(within(parzen).getByText('Cap. 2 · Teoria della stima statistica')).toBeInTheDocument()
    expect(within(parzen).getByText('Statistical Estimation Theory')).toHaveAttribute('lang', 'en')
  })
})
