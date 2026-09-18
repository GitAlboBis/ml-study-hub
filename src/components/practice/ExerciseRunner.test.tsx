import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { Exercise } from '../../content/types'
import { createRng } from '../../lib/rng'
import { ExerciseRunner } from './ExerciseRunner'
import { formatNumber } from './logic'

// Le etichette delle risposte sono testo semplice: in jsdom 29 il nome accessibile di un campo la cui
// etichetta contiene KaTeX (MathML) manda in errore dom-accessibility-api. Nel browser vanno bene anche le formule.
const exercise: Exercise = {
  id: 'ex1',
  title: 'Stima con una finestra',
  difficulty: 2,
  kind: 'numerico',
  concepts: ['c01'],
  generate: (rng) => {
    const N = rng.int(10, 500)
    const k = rng.int(1, 9)
    return {
      prompt: `Su N = ${N} campioni, k = ${k} cadono nella finestra di volume $V = 1$. Calcola il rapporto e la differenza.`,
      answers: [
        { label: 'Rapporto k/N', value: k / N, tolerance: 0.001 },
        { label: 'Differenza N meno k', value: N - k, tolerance: 0 },
      ],
      solution: `Passo 1: $\\hat p = k/(NV)$. Il rapporto vale ${k}/${N}.`,
    }
  },
}

const conceptual: Exercise = {
  id: 'ex2',
  title: 'Perché serve il fattore di normalizzazione',
  difficulty: 1,
  kind: 'concettuale',
  concepts: ['c02'],
  generate: () => ({ prompt: 'Spiega perché la stima deve integrare a 1.', answers: [], solution: 'Perché è una densità di probabilità.' }),
}

const broken: Exercise = {
  id: 'ex3',
  title: 'Generatore rotto',
  difficulty: 3,
  kind: 'numerico',
  concepts: [],
  generate: () => {
    throw new Error('boom')
  },
}

const instance = (seed: number) => exercise.generate(createRng(seed))
const promptText = (seed: number) => instance(seed).prompt.split(' cadono')[0]

afterEach(cleanup)

describe('ExerciseRunner', () => {
  it('con lo stesso seed il testo dell\'esercizio è sempre lo stesso', () => {
    const first = render(<ExerciseRunner exercise={exercise} seed={7} />)
    expect(screen.getByText(new RegExp(promptText(7)))).toBeInTheDocument()
    const text = first.container.textContent
    first.unmount()
    const second = render(<ExerciseRunner exercise={exercise} seed={7} />)
    expect(second.container.textContent).toBe(text)
  })

  it('"Nuovo esercizio" passa alla variante dopo, con numeri nuovi', async () => {
    const user = userEvent.setup()
    render(<ExerciseRunner exercise={exercise} seed={1} />)
    expect(screen.getByText('Variante 1')).toBeInTheDocument()
    expect(promptText(1)).not.toBe(promptText(2))
    await user.click(screen.getByRole('button', { name: /nuovo esercizio/i }))
    expect(screen.getByText('Variante 2')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(promptText(2)))).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(promptText(1)))).not.toBeInTheDocument()
  })

  it('controlla ogni risposta numerica con la sua tolleranza', async () => {
    const user = userEvent.setup()
    const { answers } = instance(3)
    render(<ExerciseRunner exercise={exercise} seed={3} />)
    // virgola decimale, dentro la tolleranza
    await user.type(screen.getByRole('textbox', { name: /rapporto/i }), formatNumber(answers[0].value + 0.0004))
    await user.type(screen.getByRole('textbox', { name: /differenza/i }), String(answers[1].value + 1))
    await user.click(screen.getByRole('button', { name: 'Controlla' }))
    expect(screen.getByRole('status')).toHaveTextContent('Giuste 1 su 2')
    expect(screen.getByRole('textbox', { name: /rapporto/i }).closest('li')).toHaveTextContent(/giusta/i)
    expect(screen.getByRole('textbox', { name: /differenza/i }).closest('li')).toHaveTextContent(/da rivedere/i)
    expect(screen.getByRole('textbox', { name: /differenza/i })).toHaveAttribute('aria-invalid', 'true')

    await user.clear(screen.getByRole('textbox', { name: /differenza/i }))
    await user.type(screen.getByRole('textbox', { name: /differenza/i }), String(answers[1].value))
    await user.click(screen.getByRole('button', { name: 'Controlla' }))
    expect(screen.getByRole('status')).toHaveTextContent(/tutte giuste/i)
  })

  it('un campo vuoto o non numerico viene segnalato, non contato come sbagliato', async () => {
    const user = userEvent.setup()
    render(<ExerciseRunner exercise={exercise} seed={3} />)
    await user.type(screen.getByRole('textbox', { name: /rapporto/i }), 'boh')
    await user.click(screen.getByRole('button', { name: 'Controlla' }))
    expect(screen.getByRole('status')).toHaveTextContent(/scrivi un numero/i)
    expect(screen.getByRole('textbox', { name: /rapporto/i }).closest('li')).toHaveTextContent(/manca il numero/i)
  })

  it('"Mostra soluzione" rivela i passaggi e i valori attesi', async () => {
    const user = userEvent.setup()
    const { answers } = instance(3)
    render(<ExerciseRunner exercise={exercise} seed={3} />)
    expect(screen.queryByText(/passo 1/i)).not.toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: /mostra la soluzione/i })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/passo 1/i)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /soluzione/i })).toHaveTextContent(formatNumber(answers[1].value))
    // la variante nuova si apre con la soluzione chiusa
    await user.click(screen.getByRole('button', { name: /nuovo esercizio/i }))
    expect(screen.queryByText(/passo 1/i)).not.toBeInTheDocument()
  })

  it('un esercizio senza risposte numeriche ha solo la soluzione', async () => {
    const user = userEvent.setup()
    render(<ExerciseRunner exercise={conceptual} />)
    expect(screen.queryByRole('button', { name: 'Controlla' })).not.toBeInTheDocument()
    expect(screen.getByText(/prova a rispondere/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /mostra la soluzione/i }))
    expect(screen.getByText(/densità di probabilità/)).toBeInTheDocument()
  })

  it('se il generatore si rompe lo dice senza far cadere la pagina', () => {
    render(<ExerciseRunner exercise={broken} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/non si è generata/i)
    expect(screen.getByRole('button', { name: /nuovo esercizio/i })).toBeInTheDocument()
  })
})
