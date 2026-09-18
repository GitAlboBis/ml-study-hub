import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-normalizza-le-feature.widget'
import { mathText, stubReducedMotion } from './proprieta/testing'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length

describe('m09-normalizza-le-feature: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente', () => {
    expect(meta.id).toBe('m09-normalizza-le-feature')
    expect(meta.concepts).toEqual(['c60'])
    expect(meta.scenario).toBe('pesce')
    expect(meta.size).toBe('M')
  })

  it('si apre nelle unità originali: 0.81 + 8100, la lunghezza pesa il 99.99%', () => {
    render(<Widget />)
    expect(document.querySelectorAll('[data-salmon]')).toHaveLength(30)
    const math = mathText()
    expect(math).toContain('0.81')
    expect(math).toContain('8100')
    expect(screen.getByRole('img', { name: /lunghezza 99.99%/ })).toBeInTheDocument()
    expect(katexErrors()).toBe(0)
  })

  it('Normalizza (reduced motion: subito): la coppia vale 46% e 54%; il pulsante diventa "Torna alle unità originali"', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Normalizza'))
    expect(screen.getByRole('img', { name: 'Luminosità 46%, lunghezza 54%' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /feature normalizzate/i })).toHaveAttribute('aria-valuetext', '0.40')
    await user.click(button('Torna alle unità originali'))
    expect(screen.getByRole('img', { name: /lunghezza 99.99%/ })).toBeInTheDocument()
  })

  it('clic su due salmoni cambia la coppia', () => {
    render(<Widget />)
    fireEvent.click(document.querySelector('[data-salmon="5"]')!)
    expect(screen.getByText('‖x − x_k‖² fra i salmoni 6 e 1')).toBeInTheDocument()
  })

  it('i passi dello storyboard normalizzano dal quarto in poi e compilano', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const next = byLabel('Passo avanti')
    for (let i = 0; i < 5; i++) {
      await user.click(next)
      expect(katexErrors()).toBe(0)
    }
    expect(screen.getByRole('img', { name: 'Luminosità 46%, lunghezza 54%' })).toBeInTheDocument()
  })

  it('sfida: non normalizzato no; normalizzato con σ vicino a σ* e "la luminosità" sì', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByRole('radio', { name: 'la luminosità' }))
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    await user.click(button('Normalizza'))
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-normalizza-le-feature']).toBeDefined()
    await user.click(button('Indizio'))
    expect(katexErrors()).toBe(0)
  })
})
