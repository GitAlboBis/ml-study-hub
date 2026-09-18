import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-sigma-adattiva.widget'
import { mathText, stubReducedMotion } from './proprieta/testing'
import { CHALLENGE_K, CHALLENGE_L, readings, sigmasFor } from './sigma-adattiva'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length
const lSlider = () => screen.getByRole('slider', { name: /vicini per/i })

describe('m09-sigma-adattiva: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente', () => {
    expect(meta.id).toBe('m09-sigma-adattiva')
    expect(meta.concepts).toEqual(['c62', 'c63', 'c64'])
    expect(meta.scenario).toBe('sensori')
  })

  it('si apre con due mappe da 60 letture, L = 3, i 3 vicini del campione della sfida e la sua σ_k nella formula', () => {
    render(<Widget />)
    expect(document.querySelectorAll('[data-reading]')).toHaveLength(120)
    expect(lSlider()).toHaveAttribute('aria-valuetext', '3')
    expect(document.querySelectorAll('[data-neighbor]').length).toBe(6)
    expect(mathText()).toContain(sigmasFor(readings(), 3)[CHALLENGE_K].toFixed(3))
    expect(document.querySelectorAll('[data-needle]')).toHaveLength(0)
    expect(katexErrors()).toBe(0)
  })

  it('L = 1 fa comparire gli aghi spuri; clic su un campione lo seleziona', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    lSlider().focus()
    await user.keyboard('{Home}')
    expect(document.querySelectorAll('[data-needle]').length).toBeGreaterThanOrEqual(3)
    fireEvent.click(document.querySelector('[data-reading="3"]')!)
    expect(screen.getByRole('spinbutton', { name: /campione selezionato/i })).toHaveValue(4)
  })

  it('storyboard: il calcolo rivela i cerchi uno alla volta senza reduced motion; i passi compilano', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    expect(document.querySelectorAll('[data-radius]').length).toBeLessThan(70)
    await act(async () => {})
    cleanup()
    stubReducedMotion(true)
    render(<Widget />)
    const next = byLabel('Passo avanti')
    for (let i = 0; i < 5; i++) {
      await user.click(next)
      expect(katexErrors()).toBe(0)
    }
    expect(screen.getByText('Note p45 · adaptiveness')).toBeInTheDocument()
  })

  it('sfida: risposte vuote no; σ_k giusta con L = 2 e L minimo 3 sì', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    const sk = sigmasFor(readings(), CHALLENGE_L)[CHALLENGE_K]
    const sField = screen.getByRole('spinbutton', { name: /con L = 2/ })
    await user.clear(sField)
    await user.type(sField, `${sk.toFixed(2)}{Enter}`)
    const lField = screen.getByRole('spinbutton', { name: /L minimo/ })
    await user.clear(lField)
    await user.type(lField, '3{Enter}')
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-sigma-adattiva']).toBeDefined()
    await user.click(button('Indizio'))
    expect(katexErrors()).toBe(0)
  })
})
