import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import { SAMPLES0, intervalOfThree } from './cinque'
import Widget, { meta } from './m09-cinque-campioni-tre-h.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-cinque-campioni-tre-h: il widget', { timeout: 30_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-cinque-campioni-tre-h')
    expect(meta.concepts).toEqual(['c28', 'c29', 'c32'])
    expect(meta.size).toBe('L')
  })

  it('si apre con h = 0.5: cinque massimi, pianta e superficie', () => {
    render(<Widget />)
    expect(readoutText('Massimi locali')).toBe('5')
    expect(screen.getByText(/Intermedio/)).toBeInTheDocument()
    expect(document.querySelector('[data-mesh]')).not.toBeNull()
    expect(screen.getAllByRole('slider', { name: /Pixel/ })).toHaveLength(5)
  })

  it('i preset: h = 1 fonde i tre pixel vicini (oversmoothing), h = 0.2 fa gli aghi (0.796)', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('h = 1'))
    expect(Number(readoutText('Massimi locali'))).toBeLessThan(5)
    expect(screen.getByText(/Oversmoothing/)).toBeInTheDocument()
    await user.click(button('h = 0.2'))
    expect(readoutText('Massimi locali')).toBe('5')
    expect(readoutText('Un ago isolato')).toBe('0.796')
    expect(screen.getByText(/Stima molto variabile/)).toBeInTheDocument()
  })

  it('la scala della slide moltiplica per N = 5', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('h = 0.2'))
    await user.click(screen.getByRole('switch', { name: 'Scala come nella slide' }))
    expect(readoutText('Un ago isolato')).toBe('3.979')
  })

  it('la vista si sceglie: solo pianta toglie il reticolo', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(screen.getByRole('radiogroup', { name: 'Vista' })).getByRole('radio', { name: 'pianta' }))
    expect(document.querySelector('[data-mesh]')).toBeNull()
  })

  it('Ricampiona cambia i pixel', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const before = screen.getAllByRole('slider', { name: /Pixel/ }).map((s) => s.getAttribute('aria-valuetext'))
    await user.click(button('Ricampiona'))
    const after = screen.getAllByRole('slider', { name: /Pixel/ }).map((s) => s.getAttribute('aria-valuetext'))
    expect(after).not.toEqual(before)
  })

  it('la sfida: l\'intervallo del 3 e la spiegazione', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const [lo, hi] = intervalOfThree(SAMPLES0)!
    for (const [name, v] of [
      [/^Il contatore vale 3 da/, lo.toFixed(2)],
      [/^fino a h/, hi.toFixed(2)],
    ] as const) {
      const input = screen.getByRole('spinbutton', { name })
      fireEvent.change(input, { target: { value: v } })
      fireEvent.blur(input)
    }
    await user.click(within(screen.getByRole('radiogroup', { name: /Fuori da quell'intervallo/ })).getByRole('radio', { name: 'h decide quanto lisciare' }))
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
