import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Flashcard } from '../../content/types'
import { progressKey, useProgress } from '../../store/progress'
import { FlashcardDeck } from './FlashcardDeck'
import type { DeckEntry } from './logic'

const MODULE = 'm09-parzen-windows'
const DAY = 86_400_000
const NOW = new Date(2026, 8, 18, 10, 0, 0).getTime()

const cards: Flashcard[] = [
  { id: 'fc1', q: 'Che cos\'è la funzione finestra $\\gamma$?', a: 'Vale 1 dentro l\'ipercubo e 0 fuori.', kind: 'definizione' },
  { id: 'fc2', q: 'Che cosa succede se $h$ è troppo piccolo?', a: 'La stima diventa un arcipelago di picchi.', kind: 'intuizione' },
  { id: 'fc3', q: 'Scrivi la stima di Parzen.', a: '$\\hat p(x) = \\frac{1}{N}\\sum_k \\frac{1}{h}\\gamma(\\cdot)$', kind: 'formula' },
]
const entries: DeckEntry[] = cards.map((card) => ({ key: progressKey(MODULE, card.id), card }))
const key = (id: string) => progressKey(MODULE, id)

beforeEach(() => {
  // solo Date è finto: i timer restano veri, così user-event funziona senza configurazioni
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  useProgress.getState().reset()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const flipButton = () => screen.getByRole('button', { name: /mostra la risposta|torna alla domanda/i })

describe('FlashcardDeck', () => {
  it('mostra la prima carta in scadenza; la risposta non esiste finché non si gira la carta', () => {
    render(<FlashcardDeck entries={entries} />)
    expect(screen.getByText(/funzione finestra/)).toBeInTheDocument()
    expect(screen.queryByText(/ipercubo/)).not.toBeInTheDocument()
    expect(screen.getByText('Carta 1 di 3')).toBeInTheDocument()
  })

  it('Spazio gira la carta e la rigira', async () => {
    const user = userEvent.setup()
    render(<FlashcardDeck entries={entries} />)
    act(() => flipButton().focus())
    await user.keyboard(' ')
    expect(screen.getByText(/ipercubo/)).toBeInTheDocument()
    expect(flipButton()).toHaveAccessibleName(/torna alla domanda/i)
    await user.keyboard(' ')
    expect(flipButton()).toHaveAccessibleName(/mostra la risposta/i)
  })

  it('con il fuoco sul mazzo (clic sulla carta) Spazio gira la carta', async () => {
    const user = userEvent.setup()
    render(<FlashcardDeck entries={entries} />)
    await user.click(screen.getByText(/funzione finestra/))
    expect(screen.getByText(/ipercubo/)).toBeInTheDocument()
    const deck = screen.getByRole('region', { name: /flashcard/i })
    act(() => deck.focus())
    await user.keyboard(' ')
    expect(flipButton()).toHaveAccessibleName(/mostra la risposta/i)
  })

  it('i voti 1-4 da tastiera vanno a review come 1, 3, 4, 5', async () => {
    const user = userEvent.setup()
    const four = [...entries, { key: key('fc4'), card: { id: 'fc4', q: 'Quarta', a: 'Risposta quarta', kind: 'procedura' as const } }]
    render(<FlashcardDeck entries={four} />)
    for (const digit of ['1', '2', '3', '4']) {
      act(() => flipButton().focus())
      await user.keyboard(' ')
      await user.keyboard(digit)
    }
    const s = useProgress.getState().flashcards
    // voto 1: si ricomincia domani con facilità ridotta
    expect(s[key('fc1')]).toMatchObject({ reps: 0, interval: 1, due: NOW + DAY })
    expect(s[key('fc1')].ef).toBeCloseTo(2.3)
    // voti 3, 4, 5: prima ripetizione riuscita, facilità che dipende dal voto
    expect(s[key('fc2')].ef).toBeCloseTo(2.36)
    expect(s[key('fc3')].ef).toBeCloseTo(2.5)
    expect(s[key('fc4')].ef).toBeCloseTo(2.6)
    expect(s[key('fc4')].reps).toBe(1)
  })

  it('prima di girare la carta i voti da tastiera non contano', async () => {
    const user = userEvent.setup()
    render(<FlashcardDeck entries={entries} />)
    act(() => flipButton().focus())
    await user.keyboard('3')
    expect(useProgress.getState().flashcards).toEqual({})
    expect(screen.getByText('Carta 1 di 3')).toBeInTheDocument()
  })

  it('i timbri dei voti si premono anche con il mouse e mostrano quando tornerà la carta', async () => {
    const user = userEvent.setup()
    render(<FlashcardDeck entries={entries} />)
    await user.click(flipButton())
    const good = screen.getByRole('button', { name: /bene/i })
    expect(good).toHaveTextContent(/domani/)
    await user.click(good)
    expect(useProgress.getState().flashcards[key('fc1')].reps).toBe(1)
    expect(screen.getByText('Carta 2 di 3')).toBeInTheDocument()
    // dopo il voto il fuoco torna sul comando che gira la carta
    expect(flipButton()).toHaveFocus()
  })

  it('in coda vanno solo le carte in scadenza', () => {
    useProgress.setState({
      flashcards: {
        [key('fc2')]: { ef: 2.5, interval: 6, reps: 2, due: NOW + 3 * DAY },
        [key('fc3')]: { ef: 2.5, interval: 1, reps: 1, due: NOW - DAY },
      },
    })
    render(<FlashcardDeck entries={entries} />)
    // la scaduta viene prima di quella mai vista, la futura resta fuori
    expect(screen.getByText('Carta 1 di 2')).toBeInTheDocument()
    expect(screen.getByText(/scrivi la stima di parzen/i)).toBeInTheDocument()
  })

  it('a fine sessione mostra il riepilogo e permette di ripassare le carte sbagliate', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(<FlashcardDeck entries={entries} onFinish={onFinish} />)
    for (const digit of ['1', '4', '3']) {
      act(() => flipButton().focus())
      await user.keyboard(' ')
      await user.keyboard(digit)
    }
    const summary = screen.getByRole('heading', { name: /sessione finita/i })
    expect(summary).toHaveFocus()
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ reviewed: 3, missed: 1 }))
    const tally = screen.getByRole('list', { name: /voti della sessione/i })
    expect(within(tally).getByText('Non la sapevo').closest('li')).toHaveTextContent('1')
    expect(within(tally).getByText('A fatica').closest('li')).toHaveTextContent('0')

    await user.click(screen.getByRole('button', { name: /ripassa la carta che non sapevi/i }))
    expect(screen.getByText('Carta 1 di 1')).toBeInTheDocument()
    expect(screen.getByText(/funzione finestra/)).toBeInTheDocument()
  })

  it('se nessuna carta è in scadenza lo dice e permette di ripassare comunque tutto il mazzo', async () => {
    const user = userEvent.setup()
    useProgress.setState({
      flashcards: Object.fromEntries(cards.map((c, i) => [key(c.id), { ef: 2.5, interval: 6, reps: 2, due: NOW + (i + 1) * DAY }])),
    })
    render(<FlashcardDeck entries={entries} />)
    expect(screen.getByText(/nessuna carta in scadenza/i)).toBeInTheDocument()
    expect(screen.getByText(/la prossima torna domani/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /ripassa comunque tutte le 3 carte/i }))
    expect(screen.getByText('Carta 1 di 3')).toBeInTheDocument()
  })

  it('un mazzo vuoto non si rompe', () => {
    render(<FlashcardDeck entries={[]} />)
    expect(screen.getByText(/non ci sono ancora flashcard/i)).toBeInTheDocument()
  })
})
