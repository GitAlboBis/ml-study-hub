import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import { errorsAt } from './bilancia-bias-varianza'
import Widget, { meta } from './m09-bilancia-bias-varianza.widget'
import { mathText, stubReducedMotion } from './proprieta/testing'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length
const hSlider = () => screen.getByRole('slider', { name: /larghezza della finestra/i })

describe('m09-bilancia-bias-varianza: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente con il file e con l’inventario', () => {
    expect(meta.id).toBe('m09-bilancia-bias-varianza')
    expect(meta.concepts).toEqual(['c51', 'c52'])
    expect(meta.scenario).toBe('banca')
    expect(meta.size).toBe('M')
  })

  it('si apre con N = 100, h = 0.10: la bilancia pende sulla varianza, il MISE ha i numeri sostituiti', () => {
    render(<Widget />)
    expect(hSlider()).toHaveAttribute('aria-valuetext', '0.10 k€')
    expect(screen.getByRole('img', { name: /pende dalla parte della varianza/ })).toBeInTheDocument()
    const e = errorsAt(0.1, 100)
    expect(mathText()).toContain(e.mise.toFixed(5))
    expect(katexErrors()).toBe(0)
  })

  it('h grande: la bilancia pende sul bias', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    hSlider().focus()
    await user.keyboard('{End}')
    expect(screen.getByRole('img', { name: /pende dalla parte del bias/ })).toBeInTheDocument()
  })

  it('i passi dello storyboard compilano; la dimostrazione delle leggi mostra tre cursori fantasma', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const next = byLabel('Passo avanti')
    for (let i = 0; i < 4; i++) {
      await user.click(next)
      expect(katexErrors()).toBe(0)
    }
    expect(screen.getByText('Troppo veloce, troppo lenta', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText(/^troppo veloce ×/)).toBeInTheDocument()
    expect(screen.getByText(/^troppo lenta ×/)).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /pratiche/i })).toHaveAttribute('aria-valuetext', '10000')
    await user.click(next)
    expect(screen.getByText('Il punto più basso della U')).toBeInTheDocument()
  })

  it('sfida: stato iniziale no; h = 0.28 in equilibrio e previsione "sul bias" sì', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    hSlider().focus()
    while (hSlider().getAttribute('aria-valuetext') !== '0.28 k€') await user.keyboard('{ArrowRight}')
    await user.click(screen.getByRole('radio', { name: 'sul bias' }))
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-bilancia-bias-varianza']).toBeDefined()
    await user.click(button('Indizio'))
    expect(katexErrors()).toBe(0)
  })

  it('Reset riporta h, N e lo storyboard', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    hSlider().focus()
    await user.keyboard('{End}')
    await user.click(byLabel('Passo avanti'))
    await user.click(screen.getByText('Reset').closest('button')!)
    expect(hSlider()).toHaveAttribute('aria-valuetext', '0.10 k€')
    expect(screen.getByText('Il quadro: la U, la bilancia, la stima', { selector: 'strong' })).toBeInTheDocument()
  })
})
