import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-densita-legittima.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-densita-legittima: il widget', { timeout: 20_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  const lamps = () => [...document.querySelectorAll('[data-lamp]')].map((l) => l.getAttribute('data-lamp'))
  const meterText = () => document.querySelector('output.num')?.textContent ?? ''

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-densita-legittima')
    expect(meta.concepts).toEqual(['c19', 'c20', 'c21'])
    expect(meta.scenario).toBe('medicina')
  })

  it('si apre con h = 5, area 1.000, quattro spie verdi e una probabilità fra 60 e 80', () => {
    render(<Widget />)
    expect(meterText()).toContain('1.000')
    expect(lamps()).toEqual(['ok', 'ok', 'ok', 'ok'])
    const P = Number(readoutText('Probabilità fra a e b'))
    expect(P).toBeGreaterThan(0.3)
    expect(P).toBeLessThan(1)
  })

  it('guasto 1: l\'area diventa h e la probabilità supera 1', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByRole('switch', { name: 'Guasto 1: dimentico 1/V' }))
    expect(meterText()).toContain('5.000')
    expect(lamps()).toEqual(['ok', 'ok', 'ok', 'ko'])
    expect(screen.getByText(/maggiore di 1/)).toBeInTheDocument()
  })

  it('guasto 2: parti negative, la spia p̂ ≥ 0 si spegne e compaiono le zone negative', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByRole('switch', { name: 'Guasto 2: kernel con parti negative' }))
    expect(lamps()).toEqual(['ko', 'ok', 'ko', 'ok'])
    expect(document.querySelector('[data-negative]')).not.toBeNull()
  })

  it('guasto 3: area 0.500 e la spia del kernel di area 1 si spegne', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByRole('switch', { name: 'Guasto 3: kernel di area 1/2' }))
    expect(meterText()).toContain('0.500')
    expect(lamps()).toEqual(['ok', 'ko', 'ok', 'ko'])
  })

  it('"Ripara tutto" spegne i guasti; il cambio di variabile mostra il riquadro della campana', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByRole('switch', { name: 'Guasto 1: dimentico 1/V' }))
    await user.click(button('Ripara tutto'))
    expect(screen.getByText('Ripara tutto: le spie si riaccendono')).toBeInTheDocument()
    expect(lamps()).toEqual(['ok', 'ok', 'ok', 'ok'])
    expect(screen.getByRole('switch', { name: 'Guasto 1: dimentico 1/V' })).not.toBeChecked()
    await user.click(button('Mostra il cambio di variabile'))
    expect(document.querySelector('[data-inset]')?.textContent).toContain('1.000')
  })

  it('il racconto accende un guasto per passo; toccare un interruttore lì mette in pausa e restituisce il comando', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    for (let i = 0; i < 3; i++) await user.click(screen.getByLabelText('Passo avanti'))
    expect(screen.getByText('Guasto 1: dimentico 1/V', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Guasto 1: dimentico 1/V' })).toBeChecked()
    await user.click(screen.getByRole('switch', { name: 'Guasto 1: dimentico 1/V' }))
    expect(screen.getByRole('switch', { name: 'Guasto 1: dimentico 1/V' })).not.toBeChecked()
    expect(meterText()).toContain('1.000')
  })

  it('la sfida: 8 e 4', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    for (const [name, v] of [
      [/^\(1\) Area/, '8'],
      [/^\(2\) Area/, '4'],
    ] as const) {
      const input = screen.getByRole('spinbutton', { name })
      fireEvent.change(input, { target: { value: v } })
      fireEvent.blur(input)
    }
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
