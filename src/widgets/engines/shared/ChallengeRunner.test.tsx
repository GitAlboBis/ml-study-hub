import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../../store/progress'
import { ChallengeRunner } from './ChallengeRunner'
import type { ChallengePick } from './ChallengeRunner'
import type { CommonChallenge } from './types'

interface S {
  errors: number
  peak: number
}

beforeEach(() => useProgress.setState({ challenges: {} }))
afterEach(cleanup)

// niente getByRole('button', { name }) sui pulsanti con MathML (trappola di jsdom, WIDGET_GUIDE §10): per testo
const button = (text: string) => screen.getByText(text, { selector: 'button' })
const statusText = () => screen.getAllByRole('status').map((s) => s.textContent ?? '').join(' ')

function Harness({ ch, onOutcome, onLockChange, withPick }: { ch: CommonChallenge<S>; onOutcome?: (o: unknown) => void; onLockChange?: (l: boolean) => void; withPick?: boolean }) {
  const [s, setS] = useState<S>({ errors: 7, peak: 4.2 })
  const [pick, setPick] = useState<ChallengePick | null>(null)
  return (
    <>
      <button type="button" onClick={() => setS((x) => ({ ...x, errors: x.errors - 1 }))}>
        Meno errori
      </button>
      <button type="button" onClick={() => setPick(3.9)}>
        Clic sul terreno
      </button>
      <output data-testid="pick">{pick === null ? 'nessuno' : String(pick)}</output>
      <ChallengeRunner
        challenge={ch}
        state={s}
        stateKey={String(s.errors)}
        widgetId="prova"
        onOutcome={onOutcome}
        onLockChange={onLockChange}
        pick={withPick ? pick : undefined}
        onPick={withPick ? setPick : undefined}
      />
    </>
  )
}

describe('ChallengeRunner: find', () => {
  const ch: CommonChallenge<S> = { kind: 'find', prompt: 'Porta gli errori a 4.', hint: 'Togline qualcuno.', score: (s) => s.errors, target: () => 4, tolerance: 0 }

  it('non ancora, con i numeri del confronto; cambiare lo stato riapre; lo stato giusto supera e registra', async () => {
    const user = userEvent.setup()
    const onOutcome = vi.fn()
    render(<Harness ch={ch} onOutcome={onOutcome} />)
    expect(screen.getByText('Porta gli errori a 4.')).toBeInTheDocument()
    await user.click(button('Verifica'))
    expect(statusText()).toMatch(/Non ancora/)
    expect(screen.getByText('Il tuo valore')).toBeInTheDocument()
    expect(screen.getByText(/Scarto \(serve ≤ 0\.00\)/, { selector: '.label' })).toBeInTheDocument()
    expect(onOutcome).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'find', passed: false, gap: 3 }))
    await user.click(button('Meno errori'))
    expect(statusText()).not.toMatch(/Non ancora/)
    expect(onOutcome).toHaveBeenLastCalledWith(null)
    await user.click(button('Meno errori'))
    await user.click(button('Meno errori'))
    await user.click(button('Verifica'))
    expect(statusText()).toMatch(/Sfida superata/)
    expect(useProgress.getState().challenges.prova).toBeDefined()
  })
})

describe('ChallengeRunner: predict', () => {
  it('numero: senza risposta lo dice; si blocca, poi si verifica e mostra il valore vero', async () => {
    const user = userEvent.setup()
    const onLock = vi.fn()
    const ch: CommonChallenge<S> = { kind: 'predict', prompt: 'Dove sarà il picco?', input: 'number', truth: (s) => s.peak, tolerance: 0.2, points: 'distance' }
    render(<Harness ch={ch} onLockChange={onLock} />)
    await user.click(button('Verifica'))
    expect(statusText()).toMatch(/Manca la tua risposta/)
    const field = screen.getByLabelText('La tua previsione')
    await user.type(field, '4,5')
    await user.click(button('Blocca la previsione'))
    expect(field).toBeDisabled()
    expect(onLock).toHaveBeenLastCalledWith(true)
    expect(screen.getByText(/Previsione bloccata/)).toBeInTheDocument()
    await user.click(button('Verifica'))
    expect(statusText()).toMatch(/Non ancora/)
    expect(screen.getByText('Valore vero')).toBeInTheDocument()
    expect(screen.getByText('Punti')).toBeInTheDocument()
    await user.click(button('Cambia previsione'))
    expect(field).toBeEnabled()
    await user.clear(field)
    await user.type(field, '4.3{Enter}')
    expect(field).toBeDisabled()
    await user.click(button('Verifica'))
    expect(statusText()).toMatch(/Sfida superata/)
  })

  it('clic sul terreno: il segno del motore riempie il campo, il campo scrive il segno', async () => {
    const user = userEvent.setup()
    const ch: CommonChallenge<S> = { kind: 'predict', prompt: 'Clicca sul picco.', input: 'click-x', truth: (s) => s.peak, tolerance: 0.1 }
    render(<Harness ch={ch} withPick />)
    const field = screen.getByLabelText('Previsione di x')
    await user.click(button('Clic sul terreno'))
    expect(field).toHaveValue('3.9')
    await user.clear(field)
    await user.type(field, '4.25')
    expect(screen.getByTestId('pick')).toHaveTextContent('4.25')
    await user.click(button('Verifica'))
    expect(statusText()).toMatch(/Sfida superata/)
  })

  it('opzioni: si sceglie con i radio e si scopre la risposta giusta', async () => {
    const user = userEvent.setup()
    const ch: CommonChallenge<S> = { kind: 'predict', prompt: 'Chi separa meglio?', input: { options: ['PCA', 'LDA'] }, truth: () => 1, tolerance: 0 }
    render(<Harness ch={ch} />)
    const group = screen.getByRole('radiogroup', { name: 'La tua previsione' })
    await user.click(within(group).getByLabelText('PCA'))
    await user.click(button('Verifica'))
    expect(statusText()).toMatch(/Non ancora/)
    expect(screen.getByText('Risposta giusta')).toBeInTheDocument()
  })
})

describe('ChallengeRunner: sort', () => {
  const ch: CommonChallenge<S> = {
    kind: 'sort',
    prompt: 'Smista gli stimatori.',
    items: [
      { id: 'knn', label: 'K-NN' },
      { id: 'gauss', label: 'Gaussiana' },
    ],
    bins: [
      { id: 'np', label: 'Non parametrico' },
      { id: 'p', label: 'Parametrico' },
    ],
    answer: { knn: 'np', gauss: 'p' },
    explain: { gauss: 'La gaussiana ha due parametri, $\\mu$ e $\\sigma$.' },
  }

  it('tastiera: Invio prende, frecce scelgono, Invio posa; poi la verifica spiega i chip sbagliati', async () => {
    const user = userEvent.setup()
    render(<Harness ch={ch} />)
    const knn = () => document.querySelector<HTMLButtonElement>('[data-chip="knn"]')!
    const gauss = () => document.querySelector<HTMLButtonElement>('[data-chip="gauss"]')!
    knn().focus()
    // Invio prende e propone il primo contenitore dopo il vassoio; Invio posa
    await user.keyboard('{Enter}')
    expect(knn()).toHaveAttribute('data-held', 'true')
    await user.keyboard('{Enter}')
    expect(document.querySelector('[data-bin="np"] [data-chip="knn"]')).not.toBeNull()
    expect(knn()).toHaveFocus()
    // Esc annulla la presa
    gauss().focus()
    await user.keyboard('{Enter}{Escape}')
    expect(gauss()).not.toHaveAttribute('data-held')
    // la gaussiana finisce, sbagliando, fra i non parametrici
    await user.keyboard('{Enter}{ArrowRight}{ArrowLeft}{Enter}')
    expect(document.querySelector('[data-bin="np"] [data-chip="gauss"]')).not.toBeNull()
    await user.click(button('Verifica'))
    expect(statusText()).toMatch(/Non ancora/)
    expect(gauss().getAttribute('aria-label')).toMatch(/^Gaussiana, da rivedere/)
    expect(knn().getAttribute('aria-label')).toMatch(/^K-NN, giusto/)
    expect(screen.getByText(/La gaussiana ha due parametri/)).toBeInTheDocument()
    // si riprende con un tocco e si posa con "Posa qui"
    await user.click(gauss())
    await user.click(within(document.querySelector<HTMLElement>('[data-bin="p"]')!).getByText('Posa qui'))
    expect(document.querySelector('[data-bin="p"] [data-chip="gauss"]')).not.toBeNull()
    await user.click(button('Verifica'))
    expect(statusText()).toMatch(/Sfida superata/)
  })
})

describe('ChallengeRunner: compute e custom', () => {
  it('compute: Invio nel campo verifica; troppo alta, poi il valore esatto', async () => {
    const user = userEvent.setup()
    const ch: CommonChallenge<S> = { kind: 'compute', prompt: 'Quanto vale 1/N con N = 8?', answer: () => 0.125, tolerance: 0.001, unit: 'u' }
    render(<Harness ch={ch} />)
    const field = screen.getByLabelText('La tua risposta')
    await user.type(field, '0.2{Enter}')
    expect(statusText()).toMatch(/Non ancora/)
    expect(screen.getByText('troppo alta')).toBeInTheDocument()
    await user.clear(field)
    await user.type(field, '0.125{Enter}')
    expect(statusText()).toMatch(/Sfida superata/)
    expect(screen.getByText('Valore esatto')).toBeInTheDocument()
  })

  it('custom: dopo il successo mostra il perché', async () => {
    const user = userEvent.setup()
    const ch: CommonChallenge<S> = { kind: 'custom', prompt: 'Scendi sotto 7 errori.', check: (s) => s.errors < 7, reveal: 'Meno errori, meno *rischio*.' }
    render(<Harness ch={ch} />)
    await user.click(button('Verifica'))
    expect(screen.queryByText('Perché')).not.toBeInTheDocument()
    await user.click(button('Meno errori'))
    await user.click(button('Verifica'))
    expect(screen.getByText('Perché')).toBeInTheDocument()
  })

  it('l\'avviso "manca la risposta" sparisce appena la risposta c\'è', async () => {
    const user = userEvent.setup()
    const ch: CommonChallenge<S> = { kind: 'compute', prompt: 'Quanto vale 1/N con N = 8?', answer: () => 0.125, tolerance: 0.001 }
    render(<Harness ch={ch} />)
    await user.click(button('Verifica'))
    expect(statusText()).toMatch(/Manca la tua risposta/)
    await user.type(screen.getByLabelText('La tua risposta'), '0.1')
    expect(statusText()).not.toMatch(/Manca la tua risposta/)
  })

  it('una sfida nuova (la scheda cambia sfida) riparte da capo: risposta, blocco ed esito', async () => {
    const user = userEvent.setup()
    const a: CommonChallenge<S> = { kind: 'predict', prompt: 'Dove sarà il picco?', input: 'number', truth: (s) => s.peak, tolerance: 0.2 }
    const b: CommonChallenge<S> = { kind: 'compute', prompt: 'Quanto vale 1/N con N = 8?', answer: () => 0.125, tolerance: 0.001 }
    const onLock = vi.fn()
    const { rerender } = render(<ChallengeRunner challenge={a} state={{ errors: 7, peak: 4.2 }} stateKey="" widgetId="prova" onLockChange={onLock} />)
    await user.type(screen.getByLabelText('La tua previsione'), '4.2{Enter}')
    await user.click(button('Verifica'))
    expect(statusText()).toMatch(/Sfida superata/)
    expect(onLock).toHaveBeenLastCalledWith(true)
    rerender(<ChallengeRunner challenge={b} state={{ errors: 7, peak: 4.2 }} stateKey="" widgetId="prova" onLockChange={onLock} />)
    expect(screen.getByLabelText('La tua risposta')).toHaveValue('')
    expect(statusText()).not.toMatch(/Sfida superata/)
    expect(onLock).toHaveBeenLastCalledWith(false)
  })
})

// la risposta sta fra la consegna e Verifica (nella pagina e nel Tab), come si legge un esercizio: prima la domanda,
// poi la risposta, poi il controllo e il suo esito
describe('ChallengeRunner: ordine e accessibilità della risposta', () => {
  const after = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
  const compute: CommonChallenge<S> = { kind: 'compute', prompt: 'Quanto vale 1/N con N = 8?', hint: 'Dividi 1 per 8.', answer: () => 0.125, tolerance: 0.001 }

  it('compute: consegna, campo, Verifica, esito, anche nell\'ordine del Tab', async () => {
    const user = userEvent.setup()
    render(<ChallengeRunner challenge={compute} state={{ errors: 7, peak: 4.2 }} stateKey="" widgetId="prova" />)
    const prompt = screen.getByText('Quanto vale 1/N con N = 8?')
    const field = screen.getByLabelText('La tua risposta')
    const verify = button('Verifica')
    expect(after(prompt, field)).toBe(true)
    expect(after(field, verify)).toBe(true)
    await user.tab()
    expect(field).toHaveFocus()
    await user.tab()
    expect(verify).toHaveFocus()
    await user.type(field, '0.2{Enter}')
    expect(after(field, screen.getByText('Non ancora.'))).toBe(true)
  })

  it('manca la risposta: il campo è aria-invalid e il messaggio lo descrive, finché non si scrive', async () => {
    const user = userEvent.setup()
    render(<ChallengeRunner challenge={compute} state={{ errors: 7, peak: 4.2 }} stateKey="" widgetId="prova" />)
    const field = screen.getByLabelText('La tua risposta')
    expect(field).not.toHaveAttribute('aria-invalid')
    await user.click(button('Verifica'))
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription(/Manca la tua risposta/)
    await user.type(field, '0.1')
    expect(field).not.toHaveAttribute('aria-invalid')
    expect(field).not.toHaveAccessibleDescription(/Manca la tua risposta/)
  })

  it('predict: "Blocca la previsione" spento dice perché; il motivo sparisce quando la previsione c\'è', async () => {
    const user = userEvent.setup()
    const ch: CommonChallenge<S> = { kind: 'predict', prompt: 'Dove sarà il picco?', input: 'number', truth: (s) => s.peak, tolerance: 0.2 }
    render(<ChallengeRunner challenge={ch} state={{ errors: 7, peak: 4.2 }} stateKey="" widgetId="prova" />)
    const lock = button('Blocca la previsione')
    expect(lock).toBeDisabled()
    expect(lock).toHaveAccessibleDescription('Scrivi prima la previsione.')
    expect(screen.getByText('Scrivi prima la previsione.')).toBeVisible()
    await user.type(screen.getByLabelText('La tua previsione'), '4.2')
    expect(lock).toBeEnabled()
    expect(screen.queryByText('Scrivi prima la previsione.')).not.toBeInTheDocument()
    // campo e blocco vengono prima di Verifica
    expect(after(lock, button('Verifica'))).toBe(true)
  })

  it('predict a opzioni: il motivo dice di sceglierne una; sort: i chip vengono prima di Verifica', () => {
    const opt: CommonChallenge<S> = { kind: 'predict', prompt: 'Chi separa meglio?', input: { options: ['PCA', 'LDA'] }, truth: () => 1, tolerance: 0 }
    const { unmount } = render(<ChallengeRunner challenge={opt} state={{ errors: 7, peak: 4.2 }} stateKey="" widgetId="prova" />)
    expect(button('Blocca la previsione')).toHaveAccessibleDescription('Scegli prima una risposta.')
    expect(after(screen.getByRole('radiogroup', { name: 'La tua previsione' }), button('Verifica'))).toBe(true)
    unmount()
    const sort: CommonChallenge<S> = {
      kind: 'sort',
      prompt: 'Smista gli stimatori.',
      items: [{ id: 'knn', label: 'K-NN' }, { id: 'gauss', label: 'Gaussiana' }],
      bins: [{ id: 'np', label: 'Non parametrico' }, { id: 'p', label: 'Parametrico' }],
      answer: { knn: 'np', gauss: 'p' },
    }
    render(<ChallengeRunner challenge={sort} state={{ errors: 7, peak: 4.2 }} stateKey="" widgetId="prova" />)
    expect(after(screen.getByText('Smista gli stimatori.'), document.querySelector('[data-chip="knn"]')!)).toBe(true)
    expect(after(document.querySelector('[data-chip="knn"]')!, button('Verifica'))).toBe(true)
  })
})
