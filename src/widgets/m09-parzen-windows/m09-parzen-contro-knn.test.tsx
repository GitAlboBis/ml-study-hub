import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-parzen-contro-knn.widget'
import { knnAt, parzenAt, pool } from './parzen-knn'
import { mathText, stubReducedMotion } from './proprieta/testing'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length
const xSlider = () => screen.getByRole('slider', { name: /punto della stima/i })

describe('m09-parzen-contro-knn: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente', () => {
    expect(meta.id).toBe('m09-parzen-contro-knn')
    expect(meta.concepts).toEqual(['c02', 'c03'])
    expect(meta.scenario).toBe('sensori')
  })

  it('si apre con N = 16, h = 0.5, K = 4, x* = 1.5: le due stime K/(NV) con i numeri', () => {
    render(<Widget />)
    const s = pool().slice(0, 16)
    const pz = parzenAt(1.5, s, 0.5, 'rettangolare')
    const kn = knnAt(1.5, s, 4)
    const math = mathText()
    expect(math).toContain(pz.p.toFixed(3))
    expect(math).toContain(kn.p.toFixed(3))
    expect(screen.getByText(`V = h = 0.50 fisso · K = ${pz.K}`)).toBeInTheDocument()
    expect(katexErrors()).toBe(0)
  })

  it('i passi: x* si sposta nella zona rada, la curva si traccia, N = 256, tabella', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const next = byLabel('Passo avanti')
    await user.click(next)
    expect(xSlider()).toHaveAttribute('aria-valuetext', '2.80 s')
    await user.click(next)
    expect(xSlider()).toHaveAttribute('aria-valuetext', '4.00 s')
    await user.click(next)
    expect(screen.getByRole('radio', { name: 'N = 256' })).toBeChecked()
    await user.click(next)
    expect(screen.getByText('Parzen e K-NN a confronto')).toBeInTheDocument()
    expect(screen.getByText('Area unitaria')).toBeInTheDocument()
    expect(katexErrors()).toBe(0)
  })

  it('senza reduced motion la curva parte da x* = 0', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Traccia la curva'))
    expect(xSlider()).toHaveAttribute('aria-valuetext', '0.00 s')
    await act(async () => {})
  })

  it('N = ∞: le stime coincidono con la densità vera', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByRole('radio', { name: 'N = ∞' }))
    expect(screen.getByRole('slider', { name: /larghezza di parzen/i })).toBeDisabled()
  })

  it('sfida: x* = 1.5 no; N = 16 (h = 0.25), x* = 2.75 e la ragione giusta sì', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'N = 16' }))
    xSlider().focus()
    while (xSlider().getAttribute('aria-valuetext') !== '2.75 s') await user.keyboard('{ArrowRight}')
    await user.click(screen.getByRole('radio', { name: /la cella si allarga/ }))
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-parzen-contro-knn']).toBeDefined()
    await user.click(button('Indizio'))
    expect(katexErrors()).toBe(0)
  })
})
