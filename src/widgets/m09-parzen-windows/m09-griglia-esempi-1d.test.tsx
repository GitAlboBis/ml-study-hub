import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-griglia-esempi-1d.widget'
import { mathText, stubReducedMotion } from './proprieta/testing'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length
const plotsInCells = () => document.querySelectorAll('[data-cell] svg[role="img"]').length

describe('m09-griglia-esempi-1d: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente', () => {
    expect(meta.id).toBe('m09-griglia-esempi-1d')
    expect(meta.concepts).toEqual(['c54', 'c55', 'c57'])
    expect(meta.scenario).toBe('fonte')
  })

  it('si apre con la griglia 4 × 3 della normale piena e i valori di h_N (0.316, 0.158, 0.032 nella riga N = 10)', () => {
    render(<Widget />)
    expect(document.querySelectorAll('[data-cell]')).toHaveLength(12)
    expect(plotsInCells()).toBe(12)
    for (const v of ['h_N = 0.316', 'h_N = 0.158', 'h_N = 0.032']) expect(screen.getByText(v)).toBeInTheDocument()
    expect(katexErrors()).toBe(0)
  })

  it('clic su una cella: il pannello mostra quella cella con la formula', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByLabelText(/Cella N = 100, h1 = 0.1/))
    expect(screen.getByText(/h₁ = 0.1, N = 100/)).toBeInTheDocument()
    expect(mathText()).toContain('0.0100')
  })

  it('storyboard: senza reduced motion il riempimento parte da una cella; il passo bimodale cambia scheda', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    expect(plotsInCells()).toBe(1)
    await user.click(byLabel('Passo avanti'))
    expect(screen.getByText('h_N = 0.125')).toBeInTheDocument()
    await act(async () => {})
  })

  it('i passi compilano e l’ultimo evidenzia la riga N = ∞', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Che cosa dimostra?'))
    expect(screen.getByText('Che cosa dimostra la griglia', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('→ prezzo di h₁')).toBeInTheDocument()
    for (let i = 0; i < 5; i++) {
      await user.click(byLabel('Passo indietro'))
      expect(katexErrors()).toBe(0)
    }
  })

  it('colonna di prova e modello gaussiano ML nella bimodale', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByRole('switch', { name: /colonna di prova/i }))
    expect(document.querySelectorAll('[data-cell]')).toHaveLength(16)
    await user.click(screen.getByRole('radio', { name: 'Bimodale' }))
    await user.click(screen.getByRole('switch', { name: /modello gaussiano/i }))
    expect(screen.getByText('modello gaussiano ML')).toBeInTheDocument()
  })

  it('sfida: N = 16 no, N = 256 sì', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'N = 256' }))
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-griglia-esempi-1d']).toBeDefined()
    await user.click(button('Indizio'))
    expect(katexErrors()).toBe(0)
  })
})
