import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-disegna-la-somma.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-disegna-la-somma: il widget', { timeout: 20_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  const slider = (name: string | RegExp) => screen.getByRole('slider', { name })

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-disegna-la-somma')
    expect(meta.concepts).toEqual(['c71', 'c10', 'c16'])
  })

  it('si apre con due salmoni e i mattoncini in aria; l\'area è 1.000', () => {
    render(<Widget />)
    expect(document.querySelectorAll('[data-brick="in-aria"]')).toHaveLength(2)
    expect(screen.getByText('1.000')).toBeInTheDocument()
    expect(button('Verifica il disegno')).toBeDisabled()
  })

  it('i mattoncini si agganciano ai salmoni; poi si disegna la scaletta e la verifica segna i gradini sbagliati', { timeout: 15_000 }, async () => {
    const user = userEvent.setup()
    render(<Widget />)
    // mattoncino 1 da 1.1 a 2 (nove passi da 0.1), mattoncino 2 da 4.9 a 3 (aggancio entro 0.2)
    slider('Mattoncino 1').focus()
    for (let i = 0; i < 8; i++) await user.keyboard('{ArrowRight}')
    expect(document.querySelectorAll('[data-brick="posato"]')).toHaveLength(1)
    slider('Mattoncino 2').focus()
    // Maiusc + freccia: dieci passi alla volta (4.9 → 3.9), poi uno alla volta finché si aggancia a 3
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    for (let i = 0; i < 8; i++) await user.keyboard('{ArrowLeft}')
    expect(document.querySelectorAll('[data-brick="posato"]')).toHaveLength(2)
    expect(button('Verifica il disegno')).toBeEnabled()
    // gradini: 0, 0.25, 0.5, 0.25, 0; ne disegno solo il secondo
    slider('Gradino 2').focus()
    await user.keyboard('{ArrowUp}')
    await user.click(button('Verifica il disegno'))
    expect(screen.getByText(/Gradini da correggere: 3, 4/)).toBeInTheDocument()
    // la controprova parte da sola ed è mostrata a fine passo (reduced motion)
    expect(screen.getByText('Controprova: una finestra che conta')).toBeInTheDocument()
  })

  it('fase 2: campane, sette punti di gesso e, verificando, i valori notevoli della somma', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(screen.getByRole('radiogroup', { name: 'Fase del disegno' })).getByRole('radio', { name: '2 · interpolazione' }))
    expect(document.querySelectorAll('[data-bell]')).toHaveLength(2)
    expect(screen.getByText('Una sola gobba')).toBeInTheDocument()
    slider('Punto 4 della curva').focus()
    for (let i = 0; i < 35; i++) await user.keyboard('{ArrowUp}')
    await user.click(button('Verifica il disegno'))
    expect(document.querySelector('[data-notables]')?.textContent).toContain('0.352')
    expect(document.querySelector('[data-notables]')?.textContent).toContain('0.320')
  })

  it('in fase 2 con h sotto 0.5 la somma ha due gobbe', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(screen.getByRole('radiogroup', { name: 'Fase del disegno' })).getByRole('radio', { name: '2 · interpolazione' }))
    slider(/Larghezza della finestra, fase 2/).focus()
    for (let i = 0; i < 11; i++) await user.keyboard('{ArrowLeft}')
    expect(slider(/Larghezza della finestra, fase 2/)).toHaveAttribute('aria-valuetext', '0.45')
    expect(screen.getByText('Due gobbe')).toBeInTheDocument()
  })

  it('la sonda legge i due contributi: in 2.5 con h = 2 ciascuno vale 0.25', async () => {
    render(<Widget />)
    expect(readoutText('Salmone 1 in x')).toBe('0.250')
    expect(readoutText('Stima nel punto')).toBe('0.500')
  })

  it('modalità orale: nuovi campioni, cronometro e, alla consegna, un punteggio', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Modalità orale (90 s)'))
    expect(readoutText('Tempo rimasto')).toBe('1:30')
    await user.click(button('Consegna'))
    expect(readoutText('Punteggio')).toMatch(/^\d+\/100$/)
  })

  it('la sfida: h < 0.5 e gradino 1', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(screen.getByRole('radiogroup', { name: 'Due gobbe quando' })).getByRole('radio', { name: 'h < 0.5' }))
    const input = screen.getByRole('spinbutton', { name: /Gradino più alto/ })
    fireEvent.change(input, { target: { value: '1' } })
    fireEvent.blur(input)
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
