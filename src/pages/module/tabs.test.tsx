import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineModule } from '../../content/types'
import type { ModuleData } from '../../content/types'
import { progressKey, useProgress } from '../../store/progress'
import TabEsercizi from './TabEsercizi'
import TabFlashcard from './TabFlashcard'
import TabOrale from './TabOrale'
import TabQuiz from './TabQuiz'

// Dati finti: il contenuto vero dei fogli lo scrivono altri. Le schede devono funzionare con qualsiasi
// modulo, anche vuoto. Testi che danno il nome a controlli e cornici senza formule: in jsdom 29 il nome
// accessibile di un elemento con KaTeX (MathML) manda in errore dom-accessibility-api.
const ID = 'm09-parzen-windows'

const empty: ModuleData = defineModule({
  id: 'm99-vuoto',
  title: 'Foglio vuoto',
  titleEn: 'Empty sheet',
  course: 'melgani',
  chapter: 'Cap. 2',
  order: 99,
  sources: [],
  prerequisites: [],
  estimatedMinutes: 10,
  summary: '',
  keyPoints: [],
  glossary: [],
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

const data: ModuleData = {
  ...empty,
  id: ID,
  title: 'Finestre di Parzen',
  titleEn: 'Parzen windows',
  flashcards: [
    { id: 'fc1', q: 'Che cosa fissa la stima di Parzen?', a: 'Il volume $V = h^n$.', kind: 'definizione' },
    { id: 'fc2', q: 'Che cosa succede con h troppo grande?', a: 'Over-smoothing.', kind: 'intuizione' },
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mcq',
      q: 'Che cosa controlla h?',
      options: ['Il numero di campioni', 'La larghezza della finestra'],
      answer: 1,
      explanation: 'La finestra ha lato $h$.',
      difficulty: 1,
      concepts: ['c01'],
    },
    { id: 'q2', type: 'tf', q: 'Con h piccolo la stima è liscia.', answer: false, explanation: 'È piena di picchi.', difficulty: 2, concepts: ['c02'] },
  ],
  exam: [
    {
      id: 'e1',
      q: 'Spiega la stima a finestre di Parzen.',
      qEn: 'Explain Parzen window estimation.',
      prof: 'Melgani',
      fromBank: true,
      bankText: 'Parzen windows.',
      answer: 'Si fissa il volume $V$.',
      checklist: ['volume fisso'],
      followUps: [],
    },
    {
      id: 'e2',
      q: 'Confronta Parzen e K-NN.',
      qEn: 'Compare Parzen and K-NN.',
      prof: 'Melgani',
      fromBank: false,
      answer: 'Volume fisso contro conteggio fisso.',
      checklist: [],
      followUps: [],
    },
  ],
  exercises: [
    {
      id: 'ex1',
      title: 'Conta nella finestra',
      difficulty: 1,
      kind: 'numerico',
      concepts: ['c01'],
      generate: (rng) => {
        const k = rng.int(1, 9)
        return { prompt: `Nella finestra cadono ${k} campioni su 10.`, answers: [{ label: 'Rapporto', value: k / 10, tolerance: 0.01 }], solution: 'k/N.' }
      },
    },
    {
      id: 'ex2',
      title: 'Perché integra a 1',
      difficulty: 2,
      kind: 'dimostrazione',
      concepts: ['c02'],
      generate: () => ({ prompt: 'Dimostra che la stima integra a 1.', answers: [], solution: 'Ogni finestra integra a 1.' }),
    },
  ],
}

beforeEach(() => {
  useProgress.getState().reset()
  window.location.hash = ''
})
afterEach(cleanup)

describe('TabFlashcard', () => {
  it('ha il titolo con l\'inglese, i conteggi del mazzo e il mazzo delle carte in scadenza', () => {
    useProgress.setState({ flashcards: { [progressKey(ID, 'fc2')]: { ef: 2.5, interval: 6, reps: 2, due: Date.now() + 86_400_000 } } })
    render(<TabFlashcard data={data} />)
    const h2 = screen.getByRole('heading', { level: 2, name: /flashcard/i })
    expect(within(h2).getByText('flashcards')).toHaveAttribute('lang', 'en')
    expect(screen.getByText('Nel mazzo').parentElement).toHaveTextContent('2')
    expect(screen.getByText('Da ripassare').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Carta 1 di 1')).toBeInTheDocument()
    expect(screen.getByText(/che cosa fissa la stima/i)).toBeInTheDocument()
  })

  it('un foglio senza carte lo dice', () => {
    render(<TabFlashcard data={empty} />)
    expect(screen.getByText(/non ci sono ancora flashcard/i)).toBeInTheDocument()
  })
})

describe('TabQuiz', () => {
  it('si sceglie il modo e si parte; "Cambia prova" riporta alla scelta', async () => {
    const user = userEvent.setup()
    render(<TabQuiz data={data} />)
    expect(screen.getByRole('heading', { level: 2, name: /quiz/i })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /esame a tempo/i }))
    await user.click(screen.getByRole('button', { name: /inizia l'esame/i }))
    expect(screen.getByRole('timer')).toHaveTextContent('2:00')
    expect(screen.getByText('Domanda 1 di 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /consegna ora/i }))
    await user.click(screen.getByRole('button', { name: /cambia prova/i }))
    expect(screen.getByRole('button', { name: /inizia l'esame/i })).toBeInTheDocument()
  })

  it('propone di ripassare solo le domande sbagliate l\'ultima volta', async () => {
    const user = userEvent.setup()
    useProgress.getState().recordQuiz(progressKey(ID, 'q2'), false)
    useProgress.getState().recordQuiz(progressKey(ID, 'q1'), true)
    render(<TabQuiz data={data} />)
    expect(screen.getByText('Accuratezza').parentElement).toHaveTextContent('50%')
    await user.click(screen.getByRole('radio', { name: /sbagliate l'ultima volta/i }))
    await user.click(screen.getByRole('button', { name: /inizia l'allenamento/i }))
    expect(screen.getByText('Domanda 1 di 1')).toBeInTheDocument()
    expect(screen.getByText(/con h piccolo la stima è liscia/i)).toBeInTheDocument()
  })

  it('un foglio senza quiz lo dice', () => {
    render(<TabQuiz data={empty} />)
    expect(screen.getByText(/non ci sono ancora domande/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /inizia/i })).not.toBeInTheDocument()
  })
})

describe('TabEsercizi', () => {
  it('ha un indice e un riquadro per esercizio, con l\'ancora della copertura', () => {
    render(<TabEsercizi data={data} />)
    expect(screen.getByRole('heading', { level: 2, name: /esercizi/i })).toBeInTheDocument()
    const index = screen.getByRole('navigation', { name: /indice degli esercizi/i })
    expect(within(index).getByRole('link', { name: /conta nella finestra/i })).toHaveAttribute('href', '#exercise:ex1')
    expect(document.getElementById('exercise:ex1')).toHaveTextContent(/conta nella finestra/i)
    expect(document.getElementById('exercise:ex2')).toHaveTextContent(/perché integra a 1/i)
  })

  it('un foglio senza esercizi lo dice', () => {
    render(<TabEsercizi data={empty} />)
    expect(screen.getByText(/non ci sono ancora esercizi/i)).toBeInTheDocument()
  })
})

describe('TabOrale', () => {
  it('mostra una domanda alla volta; le tessere numerate e i comandi portano alle altre', async () => {
    const user = userEvent.setup()
    render(<TabOrale data={data} />)
    expect(screen.getByRole('heading', { level: 2, name: /orale/i })).toBeInTheDocument()
    expect(screen.getByText("Domanda d'orale 1 di 2")).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: /domande d'orale del foglio/i })
    expect(within(nav).getByRole('button', { name: /domanda 1/i })).toHaveAttribute('aria-current', 'true')
    await user.click(within(nav).getByRole('button', { name: /domanda 2/i }))
    expect(screen.getByText("Domanda d'orale 2 di 2")).toBeInTheDocument()
    expect(screen.getByText(/confronta parzen e k-nn/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /precedente/i }))
    expect(screen.getByText("Domanda d'orale 1 di 2")).toBeInTheDocument()
  })

  it('la tessera di una domanda già simulata porta l\'ultimo voto', () => {
    useProgress.getState().recordExam({ key: progressKey(ID, 'e2'), score: 2 })
    render(<TabOrale data={data} />)
    const nav = screen.getByRole('navigation', { name: /domande d'orale del foglio/i })
    expect(within(nav).getByRole('button', { name: /domanda 2/i })).toHaveAccessibleName(/ultimo voto 2 su 3/i)
    expect(screen.getByText('Simulate').parentElement).toHaveTextContent('1 su 2')
  })

  it('apre la domanda indicata nell\'indirizzo (#exam:<id>), come fa la pagina Copertura', () => {
    window.location.hash = '#exam:e2'
    render(<TabOrale data={data} />)
    expect(screen.getByText("Domanda d'orale 2 di 2")).toBeInTheDocument()
    expect(document.getElementById('exam:e2')).toBeInTheDocument()
  })

  it('un foglio senza domande d\'orale lo dice', () => {
    render(<TabOrale data={empty} />)
    expect(screen.getByText(/non ci sono ancora domande d'orale/i)).toBeInTheDocument()
  })
})
