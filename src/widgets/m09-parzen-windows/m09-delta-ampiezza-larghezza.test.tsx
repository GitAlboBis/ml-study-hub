import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-delta-ampiezza-larghezza.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-delta-ampiezza-larghezza: il widget', { timeout: 20_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-delta-ampiezza-larghezza')
    expect(meta.concepts).toEqual(['c25', 'c27', 'c31'])
    expect(meta.scenario).toBe('telerilevamento')
  })

  it('si apre con h = 1: picco 0.159, volume 1.000, reticolo e miniatura corrente', () => {
    render(<Widget />)
    expect(readoutText('Picco')).toBe('0.159')
    expect(readoutText('Volume')).toBe('1.000')
    expect(document.querySelector('[data-mesh]')).not.toBeNull()
    expect(document.querySelector('[data-mini="corrente"]')?.textContent).toContain('h = 1')
  })

  it('i preset della slide: 0.5 → 0.637, 0.2 → 3.98, e il volume resta 1', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('h = 0.5'))
    expect(readoutText('Picco')).toBe('0.637')
    await user.click(button('h = 0.2'))
    expect(readoutText('Picco')).toBe('3.98')
    expect(readoutText('Volume')).toBe('1.000')
  })

  it('n = 1: il picco è 1/(√(2π) h) e l\'area resta 1', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(screen.getByRole('radiogroup', { name: 'Dimensione' })).getByRole('radio', { name: 'n = 1' }))
    expect(readoutText('Picco')).toBe('0.399')
    expect(readoutText('Area')).toBe('1.000')
  })

  it('la vista 3-D ruota da tastiera di 15°', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const view = screen.getByRole('slider', { name: /Vista 3-D/ })
    view.focus()
    await user.keyboard('{ArrowRight}')
    expect(view).toHaveAttribute('aria-valuenow', '50')
  })

  it('"Scomponi la formula" e "h → 0" sono passi del racconto; alla fine di h → 0 c\'è la delta di Dirac', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Scomponi la formula'))
    expect(screen.getByText('Scomponi la formula', { selector: 'strong' })).toBeInTheDocument()
    expect(readoutText('Fattore d\'ampiezza')).toBe('4.00')
    await user.click(button('h → 0'))
    expect(document.querySelector('[data-dirac]')).not.toBeNull()
    expect(screen.getByText(/Delta di Dirac: stesso simbolo/)).toBeInTheDocument()
  })

  it('la sfida: ×25 in 2-D e ×5 in 1-D', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    for (const [name, v] of [
      [/^Fattore in 2-D/, '25'],
      [/^Fattore in 1-D/, '5'],
    ] as const) {
      const input = screen.getByRole('spinbutton', { name })
      fireEvent.change(input, { target: { value: v } })
      fireEvent.blur(input)
    }
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
