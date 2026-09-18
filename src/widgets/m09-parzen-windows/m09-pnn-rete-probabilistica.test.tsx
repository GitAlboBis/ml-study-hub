import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-pnn-rete-probabilistica.widget'
import { mathText, stubReducedMotion } from './proprieta/testing'
import { INITIAL, forward, neuronSigmas, training } from './pnn'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length
const sSlider = () => screen.getByRole('slider', { name: /σ dei neuroni/i })

describe('m09-pnn-rete-probabilistica: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente', () => {
    expect(meta.id).toBe('m09-pnn-rete-probabilistica')
    expect(meta.concepts).toEqual(['c65', 'c66'])
    expect(meta.scenario).toBe('pesce')
  })

  it('si apre con 40 neuroni del pattern e le somme della rete nella formula', () => {
    render(<Widget />)
    expect(document.querySelectorAll('[data-neuron]')).toHaveLength(40)
    const t = training('gauss')
    const f = forward(INITIAL.test, t, neuronSigmas(t, INITIAL.sigma, false), INITIAL.prior)
    expect(mathText()).toContain(f.joint[0].toFixed(4))
    expect(katexErrors()).toBe(0)
  })

  it('la rete si esplora da tastiera: le frecce evidenziano un neurone', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const net = screen.getByRole('slider', { name: /Rete PNN/ })
    net.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(net).toHaveAttribute('aria-valuenow', '3')
    expect(net.getAttribute('aria-valuetext')).toMatch(/neurone 3, salmone/)
  })

  it('propagazione: senza reduced motion al primo istante la decisione non c’è ancora; i passi compilano', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    // il nodo di decisione non ha ancora la classe: la sua etichetta è la parola "decisione" (due volte con il nome dello strato)
    expect(screen.getAllByText('decisione', { selector: 'text' })).toHaveLength(2)
    await act(async () => {})
    cleanup()
    stubReducedMotion(true)
    render(<Widget />)
    for (let i = 0; i < 5; i++) {
      await user.click(byLabel('Passo avanti'))
      expect(katexErrors()).toBe(0)
    }
    expect(screen.getByText('Nessun peso da imparare')).toBeInTheDocument()
  })

  it('sfida: con la nuvola gaussiana no; con i due gruppi e σ = 0.90 sì', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'due gruppi separati' }))
    sSlider().focus()
    while (sSlider().getAttribute('aria-valuetext') !== '0.90') await user.keyboard('{ArrowRight}')
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-pnn-rete-probabilistica']).toBeDefined()
    await user.click(button('Indizio'))
    expect(katexErrors()).toBe(0)
  })
})
