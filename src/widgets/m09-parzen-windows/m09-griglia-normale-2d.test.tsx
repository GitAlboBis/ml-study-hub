import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-griglia-normale-2d.widget'
import { mathText, stubReducedMotion } from './proprieta/testing'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length
const surfaces = () => document.querySelectorAll('[data-cell] [data-ridges]').length

describe('m09-griglia-normale-2d: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente', () => {
    expect(meta.id).toBe('m09-griglia-normale-2d')
    expect(meta.concepts).toEqual(['c56'])
    expect(meta.scenario).toBe('fonte')
  })

  it('si apre con 12 superfici e la legge della slide: riga N = 100 ad aghi, N·h² = 0.010, spia rossa', () => {
    render(<Widget />)
    expect(surfaces()).toBe(12)
    expect(screen.getAllByText('h_N = 0.010').length).toBeGreaterThan(0)
    expect(screen.getAllByText('h_N = 0.0010').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('[data-spikes]').length).toBeGreaterThan(0)
    expect(screen.getByText('1.000 · 0.250 · 0.010')).toBeInTheDocument()
    expect(mathText()).toContain('0.0100')
    expect(katexErrors()).toBe(0)
  })

  it('la legge con la radice lascia N·h² costante (spia in bilico); la legge a quarta è verde', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getAllByRole('radio', { name: 'h₁/√N (Duda-Hart)' })[0])
    expect(screen.getAllByText('1.000 · 0.250 · 0.010')).toHaveLength(3)
    expect(screen.getByText('in bilico')).toBeInTheDocument()
    await user.click(screen.getAllByRole('radio', { name: 'h₁/N^(1/(2n))' })[0])
    expect(screen.getAllByText('sì')).toHaveLength(2)
  })

  it('i passi dello storyboard impongono le tre leggi e il confronto 1-D / 2-D', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const next = byLabel('Passo avanti')
    for (let i = 0; i < 5; i++) {
      await user.click(next)
      expect(katexErrors()).toBe(0)
    }
    expect(screen.getByText('A parità di N e h: 1-D contro 2-D', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('Nella finestra, 2-D')).toBeInTheDocument()
  })

  it('senza reduced motion il riempimento parte da una superficie', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    expect(surfaces()).toBe(1)
    await act(async () => {})
  })

  it('la superficie del pannello ruota da tastiera', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const s = screen.getByRole('slider', { name: /superficie ingrandita/i })
    const before = Number(s.getAttribute('aria-valuenow'))
    s.focus()
    await user.keyboard('{ArrowRight}')
    expect(Number(s.getAttribute('aria-valuenow'))).toBe(before + 10)
  })

  it('sfida: somiglia h₁/√N, consistente h₁/N^(1/(2n))', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    const radios = screen.getAllByRole('radio', { name: 'h₁/√N (Duda-Hart)' })
    await user.click(radios[1])
    const quarta = screen.getAllByRole('radio', { name: 'h₁/N^(1/(2n))' })
    await user.click(quarta[2])
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-griglia-normale-2d']).toBeDefined()
  })
})
