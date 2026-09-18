import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExamQuestion } from '../../content/types'
import { progressKey, useProgress } from '../../store/progress'
import { ExamCard } from './ExamCard'

const MODULE = 'm09-parzen-windows'

// Domanda, traccia e approfondimenti in testo semplice: danno il nome a cornice e controlli, e in jsdom 29
// il nome accessibile di un elemento che contiene KaTeX (MathML) manda in errore dom-accessibility-api.
// Nel browser vanno bene anche le formule; qui le formule stanno nella risposta.
const question: ExamQuestion = {
  id: 'e1',
  q: 'Spiega la stima a finestre di Parzen e il ruolo della larghezza h.',
  qEn: 'Explain Parzen window estimation and the role of h.',
  prof: 'Melgani',
  fromBank: true,
  bankText: 'Parzen windows: definition, role of the window width.',
  answer: 'Si fissa il volume $V = h^n$ e si contano i campioni: $\\hat p(\\mathbf x) = \\frac{k/N}{V}$.',
  checklist: ['Volume fisso della finestra', 'Formula con la funzione finestra', 'Effetto di h piccolo', 'Effetto di h grande'],
  followUps: [{ q: 'Che cosa succede quando N tende a infinito?', a: 'La stima converge se $h \\to 0$ e $N h^n \\to \\infty$.' }],
}

const exams = () => useProgress.getState().exam

beforeEach(() => useProgress.getState().reset())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('ExamCard', () => {
  it('mostra la domanda in italiano e in inglese, il docente e la provenienza dalla banca', async () => {
    const user = userEvent.setup()
    render(<ExamCard question={question} moduleId={MODULE} number={1} total={3} />)
    expect(screen.getByText(/spiega la stima a finestre di parzen/i)).toBeInTheDocument()
    const en = screen.getByText(question.qEn)
    expect(en).toHaveAttribute('lang', 'en')
    expect(screen.getByText('Melgani')).toBeInTheDocument()
    expect(screen.getByText(/dalla banca domande/i)).toBeInTheDocument()
    expect(screen.getByText("Domanda d'orale 1 di 3")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /testo originale della banca/i }))
    expect(screen.getByText(question.bankText as string)).toBeInTheDocument()
  })

  it('la traccia e la risposta modello restano nascoste finché non si rivelano', async () => {
    const user = userEvent.setup()
    render(<ExamCard question={question} moduleId={MODULE} />)
    expect(screen.queryByText(/volume fisso/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/si fissa il volume/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /come è andata/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /rivela traccia e risposta/i }))
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
    expect(screen.getByText(/si fissa il volume/i)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /come è andata/i })).toBeInTheDocument()
  })

  it('il cronometro parte, si ferma e si ferma da solo quando si rivela la risposta', () => {
    vi.useFakeTimers()
    render(<ExamCard question={question} moduleId={MODULE} />)
    const timer = screen.getByRole('timer')
    expect(timer).toHaveTextContent('0:00')
    fireEvent.click(screen.getByRole('button', { name: /avvia il cronometro/i }))
    act(() => vi.advanceTimersByTime(5_000))
    expect(timer).toHaveTextContent('0:05')
    fireEvent.click(screen.getByRole('button', { name: /pausa/i }))
    act(() => vi.advanceTimersByTime(5_000))
    expect(timer).toHaveTextContent('0:05')
    fireEvent.click(screen.getByRole('button', { name: /riprendi/i }))
    act(() => vi.advanceTimersByTime(3_000))
    fireEvent.click(screen.getByRole('button', { name: /rivela traccia e risposta/i }))
    act(() => vi.advanceTimersByTime(10_000))
    expect(timer).toHaveTextContent('0:08')
  })

  it('la traccia spuntata suggerisce un voto; il voto scelto finisce nei progressi con il tempo', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const user = userEvent.setup()
    render(<ExamCard question={question} moduleId={MODULE} />)
    await user.click(screen.getByRole('button', { name: /avvia il cronometro/i }))
    vi.setSystemTime(Date.now() + 42_000)
    await user.click(screen.getByRole('button', { name: /rivela traccia e risposta/i }))
    await user.click(screen.getByRole('checkbox', { name: /volume fisso/i }))
    await user.click(screen.getByRole('checkbox', { name: /formula con la funzione/i }))
    const scores = screen.getByRole('group', { name: /come è andata/i })
    expect(within(scores).getByRole('button', { name: /buona/i })).toHaveAccessibleDescription(/suggerito dalla traccia/i)

    await user.click(within(scores).getByRole('button', { name: /buona/i }))
    expect(exams()).toHaveLength(1)
    expect(exams()[0]).toMatchObject({ key: progressKey(MODULE, 'e1'), score: 2, seconds: 42 })
    expect(screen.getByText(/voto 2 su 3/i)).toBeInTheDocument()
    expect(screen.getByText('Tentativi').parentElement).toHaveTextContent('1')
  })

  it('"Rifai la domanda" riparte da capo e tiene lo storico', async () => {
    const user = userEvent.setup()
    render(<ExamCard question={question} moduleId={MODULE} />)
    await user.click(screen.getByRole('button', { name: /rivela traccia e risposta/i }))
    await user.click(screen.getByRole('button', { name: /completa/i }))
    await user.click(screen.getByRole('button', { name: /rifai la domanda/i }))
    expect(screen.queryByText(/si fissa il volume/i)).not.toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('0:00')
    expect(screen.getByText('Tentativi').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Migliore').parentElement).toHaveTextContent('3 su 3')
  })

  it('le domande di approfondimento hanno la risposta a scomparsa', async () => {
    const user = userEvent.setup()
    render(<ExamCard question={question} moduleId={MODULE} />)
    expect(screen.queryByText(/la stima converge/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /n tende a infinito/i }))
    expect(screen.getByText(/la stima converge/i)).toBeInTheDocument()
  })

  it('una domanda non della banca, senza traccia né approfondimenti, funziona lo stesso', async () => {
    const user = userEvent.setup()
    render(
      <ExamCard
        question={{ ...question, fromBank: false, bankText: undefined, prof: 'Assistant', checklist: [], followUps: [] }}
        moduleId={MODULE}
      />,
    )
    expect(screen.queryByText(/dalla banca domande/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/approfondimento/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /rivela traccia e risposta/i }))
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    expect(screen.getByText(/si fissa il volume/i)).toBeInTheDocument()
  })
})
