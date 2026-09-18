import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-varianza-e-bound.widget'
import { mathText, stubReducedMotion } from './proprieta/testing'
import { DAYS, INITIAL, theoryAt } from './varianza-e-bound'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length

describe('m09-varianza-e-bound: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente con il file e con l’inventario', () => {
    expect(meta.id).toBe('m09-varianza-e-bound')
    expect(meta.moduleId).toBe('m09-parzen-windows')
    expect(meta.concepts).toEqual(['c47', 'c48'])
    expect(meta.scenario).toBe('sensori')
    expect(meta.size).toBe('L')
  })

  it('si apre con il quadro completo: 300 mattoncini e il bound con i numeri sostituiti', () => {
    render(<Widget />)
    expect(screen.getByRole('heading', { name: meta.title })).toBeInTheDocument()
    expect(screen.getByText('Dati sintetici')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-brick]')).toHaveLength(DAYS)
    const st = theoryAt(INITIAL)
    const math = mathText()
    expect(math).toContain(st.bound.toFixed(6))
    expect(math).toContain('0.399')
    expect(math).toContain('0.177')
    expect(math).toContain('200')
    expect(katexErrors()).toBe(0)
  })

  it('ogni passo dello storyboard compila le sue formule e, con reduced motion, mostra lo stato finale', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const next = byLabel('Passo avanti')
    await user.click(next)
    expect(screen.getByText('Trecento giorni di letture', { selector: 'strong' })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-brick]')).toHaveLength(DAYS)
    for (let i = 0; i < 4; i++) {
      await user.click(next)
      expect(katexErrors()).toBe(0)
    }
    expect(screen.getByText('Più dimensioni, finestra più vuota', { selector: 'strong' })).toBeInTheDocument()
  })

  it('senza reduced motion il passo dei giorni parte da un solo mattoncino', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    expect(document.querySelectorAll('[data-brick]')).toHaveLength(1)
    await act(async () => {})
  })

  it('N al massimo (2000): il bound scende di 10 volte', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const n = screen.getByRole('slider', { name: /letture al giorno/i })
    n.focus()
    await user.keyboard('{End}')
    expect(n).toHaveAttribute('aria-valuetext', '2000')
    expect(mathText()).toContain(theoryAt({ ...INITIAL, N: 2000 }).bound.toFixed(7))
  })

  it('il punto sonda si sposta da tastiera', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const probe = screen.getByRole('slider', { name: 'Punto sonda x₀' })
    probe.focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByRole('slider', { name: /punto sonda$/i })).toHaveAttribute('aria-valuetext', '22.2 °C')
  })

  it('sfida: ×1 e ×1 non bastano; ×2 in 1-D e ×8 in 3-D la superano', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    await user.click(screen.getAllByText('×2')[0])
    await user.click(screen.getAllByText('×8')[1])
    expect(screen.queryByText('Non ancora.')).not.toBeInTheDocument()
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-varianza-e-bound']).toBeDefined()
    await user.click(button('Indizio'))
    expect(katexErrors()).toBe(0)
  })

  it('Reset riporta N, h e lo storyboard all’inizio', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const h = screen.getByRole('slider', { name: /larghezza della finestra/i })
    h.focus()
    await user.keyboard('{End}')
    await user.click(byLabel('Passo avanti'))
    await user.click(screen.getByText('Reset').closest('button')!)
    expect(screen.getByRole('slider', { name: /larghezza della finestra/i })).toHaveAttribute('aria-valuetext', '0.50 °C')
    expect(screen.getByText('Il quadro: un giorno, trecento giorni', { selector: 'strong' })).toBeInTheDocument()
  })
})
