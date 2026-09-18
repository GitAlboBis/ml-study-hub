import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-convergenza-parzen-knn.widget'
import { mathText, stubReducedMotion } from './proprieta/testing'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length
const circles = () => document.querySelectorAll('[data-cell-circle]').length

describe('m09-convergenza-parzen-knn: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente', () => {
    expect(meta.id).toBe('m09-convergenza-parzen-knn')
    expect(meta.concepts).toEqual(['c69'])
    expect(meta.scenario).toBe('telerilevamento')
  })

  it('si apre con le due file di cinque riquadri, le leggi della slide e quattro spie verdi', () => {
    render(<Widget />)
    expect(circles()).toBe(10)
    expect(screen.getAllByText('sì')).toHaveLength(4)
    expect(screen.getByRole('img', { name: /Parzen, N = 1: K = \d+, V = 1.000/ })).toBeInTheDocument()
    expect(mathText()).toContain('100')
    expect(katexErrors()).toBe(0)
  })

  it('le leggi sbagliate: due spie rosse per passo', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const next = byLabel('Passo avanti')
    await user.click(next)
    await user.click(next)
    await user.click(next)
    expect(screen.getAllByText('no')).toHaveLength(2)
    await user.click(next)
    expect(screen.getAllByText('no')).toHaveLength(2)
    await user.click(next)
    expect(screen.getByText('Il ponte fra Parzen e K-NN')).toBeInTheDocument()
    expect(katexErrors()).toBe(0)
  })

  it('senza reduced motion la corsa parte da N = 1: un solo riquadro per fila', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    expect(circles()).toBe(2)
    await act(async () => {})
  })

  it('sfida: le risposte iniziali no; N·V → +∞ con varianza e K/N → 0 con bias sì', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'N·V → +∞' }))
    const pe = screen.getByRole('radiogroup', { name: /Con V = 1\/N l'errore/ })
    await user.click(within(pe).getByRole('radio', { name: 'varianza' }))
    await user.click(screen.getByRole('radio', { name: 'K/N → 0' }))
    const ke = screen.getByRole('radiogroup', { name: /Con K = N\/2 l'errore/ })
    await user.click(within(ke).getByRole('radio', { name: 'bias' }))
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-convergenza-parzen-knn']).toBeDefined()
    await user.click(button('Indizio'))
    expect(katexErrors()).toBe(0)
  })
})
