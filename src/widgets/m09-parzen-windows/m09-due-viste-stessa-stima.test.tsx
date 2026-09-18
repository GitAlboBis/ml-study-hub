import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import { SAMPLES0 } from './due-viste'
import Widget, { meta } from './m09-due-viste-stessa-stima.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-due-viste-stessa-stima: il widget', { timeout: 20_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  const xStar = () => screen.getByRole('slider', { name: /Punto x\*/ })
  const hSlider = () => screen.getByRole('slider', { name: /Larghezza della finestra/ })

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-due-viste-stessa-stima')
    expect(meta.concepts).toEqual(['c08', 'c09', 'c10', 'c11'])
  })

  it('si apre con i numeri dell\'inventario: K = 3, 1/(Nh) = 0.083, le due viste 0.250, area 1.000', () => {
    render(<Widget />)
    expect(readoutText('Salmoni nella finestra')).toBe('3')
    expect(readoutText('Altezza di un rettangolo')).toBe('0.083')
    expect(readoutText('Conteggio')).toBe('0.250')
    expect(readoutText('Somma delle altezze')).toBe('0.250')
    expect(document.querySelectorAll('[data-sample="in"]')).toHaveLength(3)
    expect(document.querySelectorAll('[data-kernel]')).toHaveLength(8)
    expect(screen.getByText('1.000')).toBeInTheDocument()
  })

  it('x* da tastiera: a 3.60 la finestra conta 4 salmoni e le due viste dicono 0.333', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    xStar().focus()
    for (let i = 0; i < 8; i++) await user.keyboard('{ArrowLeft}')
    expect(xStar()).toHaveAttribute('aria-valuetext', 'x = 3.60')
    expect(readoutText('Conteggio')).toBe('0.333')
    expect(readoutText('Somma delle altezze')).toBe('0.333')
  })

  it('h cambia la forma ma non l\'area', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    hSlider().focus()
    await user.keyboard('{End}')
    expect(hSlider()).toHaveAttribute('aria-valuetext', '4.0')
    expect(screen.getByText('1.000')).toBeInTheDocument()
  })

  it('aggiungere e togliere salmoni riscala tutte le altezze a 1/(Nh), con N fra 2 e 15', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button(/Aggiungi in x\*/))
    expect(readoutText('Altezza di un rettangolo')).toBe((1 / (9 * 1.5)).toFixed(3))
    expect(document.querySelectorAll('[data-sample]')).toHaveLength(9)
    await user.click(button('Togli il più vicino a x*'))
    await user.click(button('Togli il più vicino a x*'))
    expect(document.querySelectorAll('[data-sample]')).toHaveLength(7)
  })

  it('Specchia e Traccia sono passi del racconto; con reduced motion mostrano lo stato finale', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Specchia'))
    expect(screen.getByText('Specchia: una finestra diventa N rettangoli')).toBeInTheDocument()
    // a fine volo i fantasmi sono sui salmoni
    expect(document.querySelectorAll('[data-window="ghost"]')).toHaveLength(8)
    await user.click(button('Traccia'))
    expect(screen.getByText('Traccia: la penna disegna la stima')).toBeInTheDocument()
    // a fine traccia x* è a 10: nessun salmone nella finestra
    expect(readoutText('Salmoni nella finestra')).toBe('0')
    await user.click(screen.getByLabelText('Passo avanti'))
    // finita la traccia, x* torna a quello dell'utente
    expect(readoutText('Salmoni nella finestra')).toBe('3')
  })

  it('la sfida: x* con K = 2, i suoi due rettangoli e il gradino massimo la superano', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.queryByText('Sfida superata.')).not.toBeInTheDocument()
    xStar().focus()
    // 4.00 → 5.60: 32 passi da 0.05
    for (let i = 0; i < 32; i++) await user.keyboard('{ArrowRight}')
    expect(xStar()).toHaveAttribute('aria-valuetext', 'x = 5.60')
    await user.click(screen.getByText('5.0', { selector: 'button' }))
    await user.click(screen.getByText('6.2', { selector: 'button' }))
    const set = (name: RegExp, v: string) => {
      const input = screen.getByRole('spinbutton', { name })
      fireEvent.change(input, { target: { value: v } })
      fireEvent.blur(input)
    }
    set(/Gradino massimo: da/, '3.55')
    set(/^a x\*/, '3.65')
    set(/Salmoni contati lì/, '4')
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(SAMPLES0).toHaveLength(8)
  })
})
