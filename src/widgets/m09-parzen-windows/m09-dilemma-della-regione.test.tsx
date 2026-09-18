import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-dilemma-della-regione.widget'
import { mathText, stubReducedMotion } from './proprieta/testing'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length
const hSlider = () => screen.getByRole('slider', { name: /larghezza della regione/i })

describe('m09-dilemma-della-regione: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente', () => {
    expect(meta.id).toBe('m09-dilemma-della-regione')
    expect(meta.concepts).toEqual(['c70'])
    expect(meta.scenario).toBe('banca')
  })

  it('si apre con x* = 2.4, h = 0.6, N = 50: formule con p(x*)·V = 0.313 · 0.6 = 0.188 e intersezione vuota', () => {
    render(<Widget />)
    expect(hSlider()).toHaveAttribute('aria-valuetext', '0.60 k€')
    const math = mathText()
    expect(math).toContain('0.313')
    expect(math).toContain('0.1878')
    expect(screen.getByText(/Intersezione vuota/)).toBeInTheDocument()
    expect(document.querySelectorAll('[data-hbin]').length).toBeGreaterThan(2)
    expect(katexErrors()).toBe(0)
  })

  it('i passi: h grande spia di p rossa; h piccolo compaiono stime nulle; N = 5000 apre l’intersezione', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const next = byLabel('Passo avanti')
    await user.click(next)
    await user.click(next)
    expect(hSlider()).toHaveAttribute('aria-valuetext', '1.50 k€')
    expect(screen.getByText(/p quasi costante in R: rossa/)).toBeInTheDocument()
    await user.click(next)
    expect(hSlider()).toHaveAttribute('aria-valuetext', '0.05 k€')
    expect(screen.getByText(/legge dei grandi numeri: rossa/)).toBeInTheDocument()
    await user.click(next)
    expect(screen.getByText(/^Intersezione: h da/)).toBeInTheDocument()
    await user.click(next)
    // corsa di N con h_N = h₁/√N, a fine passo N = 20 000: entrambe verdi
    expect(screen.getByText(/legge dei grandi numeri: verde/)).toBeInTheDocument()
    expect(screen.getByText(/p quasi costante in R: verde/)).toBeInTheDocument()
    await user.click(next)
    expect(screen.getByText('Slide p44 ↔ slide p61')).toBeInTheDocument()
    expect(katexErrors()).toBe(0)
  })

  it('toccare h in un passo che lo impone ferma il racconto', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    await user.click(byLabel('Passo avanti'))
    hSlider().focus()
    await user.keyboard('{ArrowRight}')
    expect(hSlider()).toHaveAttribute('aria-valuetext', '1.60 k€')
  })

  it('senza reduced motion le estrazioni partono da una', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    expect(document.querySelectorAll('[data-hbin]')).toHaveLength(1)
    await act(async () => {})
  })

  it('sfida: stato iniziale no; x* sul picco, h = 0.7 e N = 480 sì', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    const xs = screen.getByRole('slider', { name: /punto della stima/i })
    xs.focus()
    for (let i = 0; i < 12; i++) await user.keyboard('{ArrowLeft}')
    expect(xs).toHaveAttribute('aria-valuetext', '1.80 k€')
    hSlider().focus()
    while (hSlider().getAttribute('aria-valuetext') !== '0.70 k€') await user.keyboard('{ArrowRight}')
    const field = screen.getByRole('spinbutton')
    await user.clear(field)
    await user.type(field, '480{Enter}')
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-dilemma-della-regione']).toBeDefined()
    await user.click(button('Indizio'))
    expect(katexErrors()).toBe(0)
  })

  it('Reset', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    hSlider().focus()
    await user.keyboard('{End}')
    await user.click(screen.getByText('Reset').closest('button')!)
    expect(hSlider()).toHaveAttribute('aria-valuetext', '0.60 k€')
  })
})
