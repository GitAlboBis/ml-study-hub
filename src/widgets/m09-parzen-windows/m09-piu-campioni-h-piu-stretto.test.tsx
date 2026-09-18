import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import { H_STEPS, N_STEPS, SEED0, curveFor, drawSamples, estimateOnGrid, iseOf } from './piu-campioni'
import Widget, { meta } from './m09-piu-campioni-h-piu-stretto.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-piu-campioni-h-piu-stretto: il widget', { timeout: 30_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  const nSlider = () => screen.getByRole('slider', { name: /Ore di dati/ })
  const hSlider = () => screen.getByRole('slider', { name: /Larghezza della finestra/ })

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-piu-campioni-h-piu-stretto')
    expect(meta.concepts).toEqual(['c30'])
  })

  it('si apre con N = 20 e h = 0.03: la stima ha buchi, l\'errore è lontano dal minimo', () => {
    render(<Widget />)
    expect(nSlider()).toHaveAttribute('aria-valuetext', '20')
    expect(hSlider()).toHaveAttribute('aria-valuetext', '0.03 kWh')
    expect(document.querySelectorAll('[data-hole]').length).toBeGreaterThan(0)
    const ise = iseOf(estimateOnGrid(drawSamples(SEED0, 20), 0.03))
    expect(readoutText('Errore integrato')).toBe(ise.toFixed(4))
    expect(ise).toBeGreaterThan(curveFor(SEED0, 20).iseStar)
  })

  it('"Trova h*" porta h al minimo (reduced motion: subito) e i buchi spariscono', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Trova h*'))
    expect(screen.getByText('Trova h*', { selector: 'strong' })).toBeInTheDocument()
    expect(readoutText('Errore integrato')).toBe(readoutText('Errore minimo'))
    expect(document.querySelectorAll('[data-hole]')).toHaveLength(0)
  })

  it('i passi N = 200 e N = 2000 spostano h* a sinistra e aggiungono i punti del log-log', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    for (let i = 0; i < 3; i++) await user.click(screen.getByLabelText('Passo avanti'))
    const h200 = Number(readoutText('h ottimo').split(' ')[0])
    await user.click(screen.getByLabelText('Passo avanti'))
    const h2000 = Number(readoutText('h ottimo').split(' ')[0])
    expect(h2000).toBeLessThan(h200)
    // il meno tipografico (U+2212) torna un meno ASCII per Number
    expect(Number(readoutText('Pendenza log-log').replace('−', '-'))).toBeLessThan(0)
  })

  it('la sfida: annotare gli h* a N = 50, 500, 5000 e il fattore 0.63', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const goTo = async (n: number) => {
      const target = N_STEPS.indexOf(n)
      nSlider().focus()
      await user.keyboard('{Home}')
      for (let i = 0; i < target; i++) await user.keyboard('{ArrowRight}')
      const best = curveFor(SEED0, n).best
      hSlider().focus()
      await user.keyboard('{Home}')
      for (let i = 0; i < H_STEPS.indexOf(best); i++) await user.keyboard('{ArrowRight}')
      await user.click(button(/^Annota h/))
    }
    await goTo(50)
    await goTo(500)
    await goTo(5000)
    const input = screen.getByRole('spinbutton', { name: /moltiplica h\*/ })
    fireEvent.change(input, { target: { value: '0.63' } })
    fireEvent.blur(input)
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
