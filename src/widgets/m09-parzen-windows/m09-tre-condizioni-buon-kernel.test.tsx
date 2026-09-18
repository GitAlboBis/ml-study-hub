import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-tre-condizioni-buon-kernel.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-tre-condizioni-buon-kernel: il widget', { timeout: 20_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  const lamps = () => [...document.querySelectorAll('[data-lamp]')].map((l) => l.getAttribute('data-lamp'))
  const toggle = (name: RegExp) => screen.getByRole('switch', { name })

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-tre-condizioni-buon-kernel')
    expect(meta.concepts).toEqual(['c22', 'c23', 'c24'])
  })

  it('si apre con il gaussiano: tre spie verdi, γ(0) = 0.399, sonda a 60 °C in allarme', () => {
    render(<Widget />)
    expect(lamps()).toEqual(['ok', 'ok', 'ok'])
    expect(readoutText('Kernel nell\'origine')).toBe('0.399')
    expect(readoutText('Allarme')).toBe('anomalia')
    expect(document.querySelectorAll('[data-anomaly]').length).toBeGreaterThan(0)
  })

  it('guasto 1: il massimo lascia l\'origine e compare il buco sopra la lettura isolata', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(toggle(/Massimo fuori dall'origine/))
    expect(lamps()).toEqual(['ko', 'ok', 'ok'])
    expect(document.querySelector('[data-holes]')?.textContent).toContain('buco sopra il dato')
  })

  it('guasto 2: gradini con i salti marcati; guasto 3: niente più zone a zero lontano dai dati', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(toggle(/Kernel discontinuo/))
    expect(lamps()).toEqual(['ok', 'ko', 'ok'])
    expect(document.querySelector('[data-jumps]')).not.toBeNull()
    await user.click(toggle(/Kernel discontinuo/))
    await user.click(toggle(/Non decade a zero/))
    expect(lamps()).toEqual(['ok', 'ok', 'ko'])
  })

  it('il racconto rompe una condizione per passo; "Ripara tutto" torna al gaussiano con le motivazioni', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByLabelText('Passo avanti'))
    expect(toggle(/Massimo fuori dall'origine/)).toBeChecked()
    await user.click(screen.getByLabelText('Passo avanti'))
    expect(toggle(/Kernel discontinuo/)).toBeChecked()
    expect(toggle(/Massimo fuori dall'origine/)).not.toBeChecked()
    await user.click(button('Ripara tutto'))
    expect(lamps()).toEqual(['ok', 'ok', 'ok'])
    expect(screen.getByText('I punti lontani devono avere influenza trascurabile.')).toBeInTheDocument()
  })

  it('la lettura isolata si trascina da tastiera', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const o = screen.getByRole('slider', { name: 'Lettura isolata' })
    o.focus()
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    expect(o).toHaveAttribute('aria-valuetext', 'x = 79.0')
  })

  it('la sfida: le tre stime malate riconosciute', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const pick = async (id: string, label: string) => user.click(within(screen.getByRole('radiogroup', { name: `Stima ${id}: viola` })).getByRole('radio', { name: label }))
    await pick('A', 'decadimento')
    await pick('B', 'massimo')
    await pick('C', 'continuità')
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
