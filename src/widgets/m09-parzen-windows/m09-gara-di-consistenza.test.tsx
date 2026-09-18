import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-gara-di-consistenza.widget'
import { mathText, stubReducedMotion } from './proprieta/testing'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length
const aSlider = () => screen.getByRole('slider', { name: /esponente della legge/i })

describe('m09-gara-di-consistenza: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente con il file e con l’inventario', () => {
    expect(meta.id).toBe('m09-gara-di-consistenza')
    expect(meta.moduleId).toBe('m09-parzen-windows')
    expect(meta.concepts).toEqual(['c49', 'c50', 'c53', 'c67'])
    expect(meta.scenario).toBe('pesce')
  })

  it('si apre con la legge di Melgani in 1-D e N = 10: entrambe le spie verdi, N·h = √10', () => {
    render(<Widget />)
    expect(screen.getByRole('heading', { name: meta.title })).toBeInTheDocument()
    expect(aSlider()).toHaveAttribute('aria-valuetext', '0.50')
    expect(screen.getAllByText('sì')).toHaveLength(2)
    expect(mathText()).toContain('3.16')
    expect(katexErrors()).toBe(0)
  })

  it('i passi delle tre leggi mostrano N = 100 000 e le spie giuste (reduced motion)', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const next = byLabel('Passo avanti')
    await user.click(next)
    expect(screen.getByText(/Legge di Melgani/, { selector: 'strong' })).toBeInTheDocument()
    expect(mathText()).toContain('100000')
    expect(mathText()).toContain('316.23')
    await user.click(next)
    // h costante: prima spia rossa
    expect(screen.getAllByText('no')).toHaveLength(1)
    expect(screen.getByText('pavimento: il bias² con h fisso')).toBeInTheDocument()
    await user.click(next)
    // troppo veloce: seconda spia rossa, pettine di aghi
    expect(screen.getAllByText('no')).toHaveLength(1)
    expect(document.querySelector('[data-needles]')).not.toBeNull()
    await user.click(next)
    await user.click(next)
    expect(screen.getAllByText(/Is Parzen a good estimator/, { selector: 'em' }).length).toBeGreaterThan(0)
    expect(document.querySelectorAll('ol li').length).toBeGreaterThanOrEqual(5)
    expect(katexErrors()).toBe(0)
  })

  it('toccare a durante un passo che impone la legge ferma il racconto e restituisce il comando', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    await user.click(byLabel('Passo avanti'))
    expect(aSlider()).toHaveAttribute('aria-valuetext', '0.00')
    aSlider().focus()
    await user.keyboard('{ArrowRight}')
    expect(aSlider()).toHaveAttribute('aria-valuetext', '0.05')
  })

  it('a = 1 in 1-D: la seconda spia è in bilico (N·h costante)', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    aSlider().focus()
    for (let i = 0; i < 10; i++) await user.keyboard('{ArrowRight}')
    expect(aSlider()).toHaveAttribute('aria-valuetext', '1.00')
    expect(screen.getByText('in bilico')).toBeInTheDocument()
  })

  it('sfida: con n = 1 non vale; con n = 2 e a = 0.20 è superata', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'n = 2' }))
    aSlider().focus()
    await user.keyboard('{Home}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(aSlider()).toHaveAttribute('aria-valuetext', '0.20')
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-gara-di-consistenza']).toBeDefined()
    await user.click(button('Indizio'))
    expect(katexErrors()).toBe(0)
  })

  it('senza reduced motion la corsa parte da N = 10', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    expect(screen.getByRole('slider', { name: /salmoni misurati/i })).toHaveAttribute('aria-valuetext', '10')
    await act(async () => {})
  })

  it('Reset riporta legge, dimensione e storyboard all’inizio', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByRole('radio', { name: 'n = 3' }))
    await user.click(byLabel('Passo avanti'))
    await user.click(screen.getByText('Reset').closest('button')!)
    expect(aSlider()).toHaveAttribute('aria-valuetext', '0.50')
    expect(screen.getByText('Il quadro: una legge per h, tre tracce', { selector: 'strong' })).toBeInTheDocument()
  })
})
