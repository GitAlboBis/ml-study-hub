import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-conteggio-vs-interpolazione.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-conteggio-vs-interpolazione: il widget', { timeout: 20_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  const probe = () => screen.getByRole('slider', { name: 'Punto sonda x' })
  const kernelGroup = () => screen.getByRole('radiogroup', { name: /Funzione finestra/ })

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-conteggio-vs-interpolazione')
    expect(meta.concepts).toEqual(['c12', 'c13', 'c14', 'c16'])
    expect(meta.scenario).toBe('sensori')
  })

  it('si apre nel conteggio: rettangolo, h = 1, x = 4.5, p̂ = 0.333, solo 4.1 °C contribuisce', () => {
    render(<Widget />)
    expect(readoutText('Stima nel punto')).toBe('0.333')
    expect(screen.getByText('Conteggio')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-link]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-kernel]')).toHaveLength(3)
    // salti e buco fra 4.1 e 6.0
    expect(document.querySelector('[data-jumps]')).not.toBeNull()
    expect(document.querySelector('[data-zone="buco"]')).not.toBeNull()
  })

  it('con il gaussiano tutte e tre le letture contribuiscono: 0.223 in 4.5, e il buco è riempito', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(kernelGroup()).getByRole('radio', { name: 'gaussiano' }))
    expect(readoutText('Stima nel punto')).toBe('0.223')
    expect(document.querySelectorAll('[data-link]')).toHaveLength(3)
    expect(document.querySelector('[data-zone="buco"]')).toBeNull()
    expect(document.querySelector('[data-zone="interpolata"]')).not.toBeNull()
    expect(document.querySelector('[data-jumps]')).toBeNull()
    expect(screen.getByText('Interpolazione')).toBeInTheDocument()
  })

  it('"Generalizza la finestra" (reduced motion): triangolo, Epanechnikov, gaussiana, poi il buco riempito a 5.05', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Generalizza la finestra'))
    expect(screen.getByText('Generalizza: la finestra triangolare')).toBeInTheDocument()
    expect(readoutText('Stima nel punto')).toBe('0.200')
    await user.click(screen.getByLabelText('Passo avanti'))
    expect(readoutText('Stima nel punto')).toBe('0.210')
    await user.click(screen.getByLabelText('Passo avanti'))
    expect(readoutText('Stima nel punto')).toBe('0.223')
    await user.click(screen.getByLabelText('Passo avanti'))
    expect(screen.getByText('Il buco si riempie')).toBeInTheDocument()
    expect(readoutText('Punto sonda')).toContain('5.05')
    expect(readoutText('Stima nel punto')).toBe('0.193')
  })

  it('sonda e letture si trascinano da tastiera', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    probe().focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(probe()).toHaveAttribute('aria-valuetext', 'x = 4.60')
    const first = screen.getByRole('slider', { name: 'Lettura 1' })
    first.focus()
    await user.keyboard('{ArrowRight}')
    expect(first).toHaveAttribute('aria-valuetext', 'x = 3.25')
  })

  it('la sfida: 4.1 °C, γ = 0.266, p̂(5) = 0.196', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.queryByText('Sfida superata.')).not.toBeInTheDocument()
    await user.click(within(screen.getByRole('radiogroup', { name: /pesa di più/ })).getByRole('radio', { name: '4.10 °C' }))
    for (const [name, v] of [
      [/^Il suo peso/, '0.266'],
      [/^La stima in 5/, '0.196'],
    ] as const) {
      const input = screen.getByRole('spinbutton', { name })
      fireEvent.change(input, { target: { value: v } })
      fireEvent.blur(input)
    }
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
