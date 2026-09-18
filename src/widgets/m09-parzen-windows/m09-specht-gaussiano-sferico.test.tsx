import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-specht-gaussiano-sferico.widget'
import { mathText, stubReducedMotion } from './proprieta/testing'
import { bananaPixels, bestSigma, specht } from './specht'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length
const sSlider = () => screen.getByRole('slider', { name: /deviazione standard del kernel/i })

describe('m09-specht-gaussiano-sferico: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente', () => {
    expect(meta.id).toBe('m09-specht-gaussiano-sferico')
    expect(meta.concepts).toEqual(['c58', 'c59', 'c61'])
    expect(meta.scenario).toBe('telerilevamento')
  })

  it('si apre con 40 pixel, σ = 0.30, coefficiente 1.768 e 2σ² = 0.18 nella formula, 5 segmenti verso la sonda', () => {
    render(<Widget />)
    expect(document.querySelectorAll('[data-pixel]')).toHaveLength(40)
    expect(document.querySelectorAll('[data-segment]')).toHaveLength(5)
    expect(sSlider()).toHaveAttribute('aria-valuetext', '0.30')
    const math = mathText()
    expect(math).toContain('1.768')
    expect(math).toContain('0.1800')
    expect(math).toContain(specht([0.2, -0.9], bananaPixels(), 0.3).toFixed(4))
    expect(katexErrors()).toBe(0)
  })

  it('σ piccola accende il timbro di overfitting, grande quello di underfitting', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    sSlider().focus()
    await user.keyboard('{Home}')
    expect(screen.getByText(/rischio overfitting/)).toBeInTheDocument()
    await user.keyboard('{End}')
    expect(screen.getByText(/rischio underfitting/)).toBeInTheDocument()
  })

  it('clic su un pixel lo toglie, clic sul piano ne aggiunge uno, e i pulsanti fanno lo stesso da tastiera', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    fireEvent.click(document.querySelector('[data-pixel="0"]')!)
    expect(document.querySelectorAll('[data-pixel]')).toHaveLength(39)
    fireEvent.click(document.querySelector('[data-pixels] > rect')!, { clientX: 200, clientY: 200 })
    expect(document.querySelectorAll('[data-pixel]')).toHaveLength(40)
    await user.click(button('Aggiungi nella sonda'))
    expect(screen.getByText('N = 41')).toBeInTheDocument()
    await user.click(button('Togli il più vicino'))
    expect(screen.getByText('N = 40')).toBeInTheDocument()
  })

  it('i passi: vista 3-D e disegno d’esame compaiono, le formule compilano', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const next = byLabel('Passo avanti')
    for (let i = 0; i < 4; i++) {
      await user.click(next)
      expect(katexErrors()).toBe(0)
    }
    expect(document.querySelector('[data-ridges]')).not.toBeNull()
    await user.click(next)
    expect(screen.getByRole('img', { name: /Disegno d'esame/ })).toBeInTheDocument()
    expect(katexErrors()).toBe(0)
  })

  it('senza reduced motion la corsa di σ parte da 0.05', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    expect(sSlider()).toHaveAttribute('aria-valuetext', '0.05')
    await act(async () => {})
  })

  it('sfida: con σ = 0.30 e σ* ≈ 0.40 la zona è overfitting; risposte giuste la superano', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    expect(bestSigma(bananaPixels())).toBeGreaterThan(0.39)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'overfitting' }))
    await user.click(screen.getByRole('radio', { name: 'n/2' }))
    await user.click(screen.getByRole('radio', { name: '2σ²' }))
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-specht-gaussiano-sferico']).toBeDefined()
    await user.click(button('Indizio'))
    expect(katexErrors()).toBe(0)
  })
})
