import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QuizItem } from '../../content/types'
import { progressKey, useProgress } from '../../store/progress'
import type { QuizEntry } from './logic'
import { QuizRunner } from './QuizRunner'

const MODULE = 'm09-parzen-windows'
const base = { difficulty: 2 as const, concepts: ['c01'] }

const mcq: QuizItem = {
  ...base,
  id: 'q1',
  type: 'mcq',
  q: 'Che cosa controlla $h$ nella stima di Parzen?',
  // niente formule nelle opzioni: jsdom 29 non calcola lo stile degli elementi MathML e il nome accessibile
  // di un radio che contiene KaTeX manda in errore dom-accessibility-api (nel browser va tutto bene)
  options: ['Il numero di campioni', 'La larghezza della finestra', 'La dimensione dello spazio'],
  answer: 1,
  explanation: 'La finestra ha lato $h$ e volume $h^n$.',
}
const multi: QuizItem = {
  ...base,
  id: 'q2',
  type: 'multi',
  q: 'Quali sono funzioni finestra ammesse?',
  options: ['Rettangolare', 'Gaussiana', 'Una funzione che integra a 2'],
  answers: [0, 1],
  explanation: 'Una finestra deve essere non negativa e integrare a 1.',
}
const tf: QuizItem = {
  ...base,
  id: 'q3',
  type: 'tf',
  q: 'Con $h$ molto piccolo la stima è liscia.',
  answer: false,
  explanation: 'Con $h$ piccolo la stima è un arcipelago di picchi.',
}
const numeric: QuizItem = {
  ...base,
  id: 'q4',
  type: 'numeric',
  q: 'Con $N = 4$ e $k = 1$ campione nella finestra di volume $1$, quanto vale $\\hat p$?',
  answer: 0.25,
  tolerance: 0.01,
  explanation: '$k/(NV) = 1/4$.',
}

const entry = (item: QuizItem): QuizEntry => ({ key: progressKey(MODULE, item.id), item })
const stat = (item: QuizItem) => useProgress.getState().quiz[progressKey(MODULE, item.id)]

beforeEach(() => useProgress.getState().reset())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const check = () => screen.getByRole('button', { name: 'Controlla' })
const next = () => screen.getByRole('button', { name: /prossima domanda|vedi il risultato/i })

describe('QuizRunner, allenamento', () => {
  it('scelta singola: feedback immediato con spiegazione e registrazione del tentativo', async () => {
    const user = userEvent.setup()
    render(<QuizRunner entries={[entry(mcq), entry(tf)]} />)
    expect(screen.getByText('Domanda 1 di 2')).toBeInTheDocument()
    expect(screen.queryByText(/volume/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /larghezza della finestra/i }))
    await user.click(check())
    expect(screen.getByRole('status')).toHaveTextContent(/risposta corretta/i)
    expect(screen.getByText(/volume/)).toBeInTheDocument()
    expect(stat(mcq)).toMatchObject({ attempts: 1, correct: 1, lastCorrect: true })
    // lo stesso pulsante ora porta avanti: il fuoco non si perde
    expect(next()).toHaveAccessibleName(/prossima domanda/i)
  })

  it('senza risposta chiede di sceglierne una e non registra nulla', async () => {
    const user = userEvent.setup()
    render(<QuizRunner entries={[entry(mcq)]} />)
    await user.click(check())
    expect(screen.getByRole('status')).toHaveTextContent('Scegli una risposta.')
    expect(stat(mcq)).toBeUndefined()
  })

  it('scelta multipla: servono tutte le risposte giuste; la soluzione è segnata con etichetta', async () => {
    const user = userEvent.setup()
    render(<QuizRunner entries={[entry(multi)]} />)
    expect(screen.getByText(/più risposte possibili/i)).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /rettangolare/i }))
    await user.click(check())
    expect(screen.getByRole('status')).toHaveTextContent(/risposta sbagliata/i)
    expect(screen.getByRole('checkbox', { name: /gaussiana/i }).closest('label')).toHaveTextContent(/giusta/i)
    expect(stat(multi)).toMatchObject({ attempts: 1, correct: 0 })
  })

  it('vero o falso', async () => {
    const user = userEvent.setup()
    render(<QuizRunner entries={[entry(tf)]} />)
    await user.click(screen.getByRole('radio', { name: 'Falso' }))
    await user.click(check())
    expect(screen.getByRole('status')).toHaveTextContent(/risposta corretta/i)
  })

  it('numerica: accetta la virgola e la tolleranza, rifiuta un testo che non è un numero', async () => {
    const user = userEvent.setup()
    render(<QuizRunner entries={[entry(numeric)]} />)
    const input = screen.getByRole('textbox', { name: /la tua risposta/i })
    await user.type(input, 'boh')
    await user.click(check())
    expect(screen.getByRole('status')).toHaveTextContent(/scrivi un numero/i)
    await user.clear(input)
    await user.type(input, '0,255')
    await user.click(check())
    expect(screen.getByRole('status')).toHaveTextContent(/risposta corretta/i)
    expect(screen.getByText(/risposta attesa/i).parentElement).toHaveTextContent('0,25 ± 0,01')
  })

  it('i tasti numerici scelgono le opzioni', async () => {
    const user = userEvent.setup()
    render(<QuizRunner entries={[entry(mcq)]} />)
    act(() => check().focus())
    await user.keyboard('2')
    expect(screen.getByRole('radio', { name: /larghezza della finestra/i })).toBeChecked()
  })

  it('conta la serie di risposte giuste e a fine prova mostra il riepilogo e il ripasso degli errori', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(<QuizRunner entries={[entry(mcq), entry(tf), entry(multi)]} onFinish={onFinish} />)

    await user.click(screen.getByRole('radio', { name: /larghezza della finestra/i }))
    await user.click(check())
    await user.click(next())
    await user.click(screen.getByRole('radio', { name: 'Falso' }))
    await user.click(check())
    expect(screen.getByText('Serie').parentElement).toHaveTextContent('2')
    await user.click(next())
    await user.click(screen.getByRole('checkbox', { name: /integra a 2/i }))
    await user.click(check())
    expect(screen.getByText('Serie').parentElement).toHaveTextContent('0')
    await user.click(next())

    expect(screen.getByRole('heading', { name: /prova finita/i })).toHaveFocus()
    expect(screen.getByText(/2 su 3/)).toBeInTheDocument()
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ total: 3, correct: 2, answered: 3, mode: 'allenamento' }))
    const list = screen.getByRole('list', { name: /le domande/i })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: /ripassa gli errori \(1\)/i }))
    expect(screen.getByText('Domanda 1 di 1')).toBeInTheDocument()
    expect(screen.getByText(/funzioni finestra ammesse/)).toBeInTheDocument()
  })
})

describe('QuizRunner, esame', () => {
  it('nessun feedback fino alla consegna, poi punteggio, spiegazioni e registrazione', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(<QuizRunner entries={[entry(mcq), entry(tf), entry(numeric)]} mode="esame" onFinish={onFinish} />)
    expect(screen.getByRole('timer')).toHaveTextContent('3:00')

    await user.click(screen.getByRole('radio', { name: /numero di campioni/i }))
    await user.click(screen.getByRole('button', { name: 'Avanti' }))
    expect(screen.queryByText(/risposta (corretta|sbagliata)/i)).not.toBeInTheDocument()
    expect(stat(mcq)).toBeUndefined()

    await user.click(screen.getByRole('radio', { name: 'Falso' }))
    await user.click(screen.getByRole('button', { name: 'Avanti' }))
    // la terza resta senza risposta
    await user.click(screen.getByRole('button', { name: /consegna/i }))

    expect(screen.getByRole('heading', { name: /prova finita/i })).toBeInTheDocument()
    expect(screen.getByText(/1 su 3/)).toBeInTheDocument()
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ total: 3, correct: 1, answered: 2, mode: 'esame' }))
    // si registrano solo le domande a cui si è risposto
    expect(stat(mcq)).toMatchObject({ attempts: 1, correct: 0 })
    expect(stat(tf)).toMatchObject({ attempts: 1, correct: 1 })
    expect(stat(numeric)).toBeUndefined()

    const list = screen.getByRole('list', { name: /le domande/i })
    const items = within(list).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent(/sbagliata/i)
    expect(items[1]).toHaveTextContent(/giusta/i)
    expect(items[2]).toHaveTextContent(/senza risposta/i)
    await user.click(within(items[0]).getByRole('button', { name: /rivedi/i }))
    expect(within(items[0]).getByText(/volume/)).toBeInTheDocument()

    // il ripasso riprende sbagliate e senza risposta, con il feedback subito
    await user.click(screen.getByRole('button', { name: /ripassa gli errori \(2\)/i }))
    expect(screen.getByText('Domanda 1 di 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Controlla' })).toBeInTheDocument()
  })

  it('si può tornare indietro e cambiare risposta prima di consegnare', async () => {
    const user = userEvent.setup()
    render(<QuizRunner entries={[entry(mcq), entry(tf)]} mode="esame" />)
    await user.click(screen.getByRole('radio', { name: /numero di campioni/i }))
    await user.click(screen.getByRole('button', { name: 'Avanti' }))
    await user.click(screen.getByRole('button', { name: 'Indietro' }))
    expect(screen.getByRole('radio', { name: /numero di campioni/i })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: /larghezza della finestra/i }))
    await user.click(screen.getByRole('button', { name: /consegna/i }))
    expect(screen.getByText(/1 su 2/)).toBeInTheDocument()
  })

  it('allo scadere del tempo la prova si consegna da sola', () => {
    vi.useFakeTimers()
    render(<QuizRunner entries={[entry(mcq), entry(tf)]} mode="esame" timeLimit={30} />)
    fireEvent.click(screen.getByRole('radio', { name: /larghezza della finestra/i }))
    act(() => vi.advanceTimersByTime(10_000))
    expect(screen.getByRole('timer')).toHaveTextContent('0:20')
    act(() => vi.advanceTimersByTime(21_000))
    expect(screen.getByRole('heading', { name: /tempo scaduto/i })).toBeInTheDocument()
    expect(screen.getByText(/1 su 2/)).toBeInTheDocument()
    expect(stat(mcq)).toMatchObject({ attempts: 1, correct: 1 })
  })
})

describe('QuizRunner, casi limite', () => {
  it('senza domande lo dice', () => {
    render(<QuizRunner entries={[]} />)
    expect(screen.getByText(/non ci sono ancora domande/i)).toBeInTheDocument()
  })
})
