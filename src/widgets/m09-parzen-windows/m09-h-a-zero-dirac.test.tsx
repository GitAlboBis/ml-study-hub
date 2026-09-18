import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import { nForOnePercent } from './dirac'
import Widget, { meta } from './m09-h-a-zero-dirac.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-h-a-zero-dirac: il widget', { timeout: 30_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  const nSlider = () => screen.getByRole('slider', { name: /Battiti in archivio/ })
  const lawGroup = () => screen.getByRole('radiogroup', { name: /Come cambia h con N/ })
  const goTo = (user: ReturnType<typeof userEvent.setup>, label: RegExp) => user.click(screen.getByRole('button', { name: label }))
  const pctOf = (text: string) => Number(text.replace('%', '').replace('−', '-'))

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-h-a-zero-dirac')
    expect(meta.moduleId).toBe('m09-parzen-windows')
    expect(meta.concepts).toEqual(['c43', 'c45', 'c46'])
    expect(meta.size).toBe('L')
  })

  it('si apre con N = 10: h_N = 60/√10 ≈ 18.97 ms, kernel largo, bias ben visibile', () => {
    render(<Widget />)
    expect(nSlider()).toHaveAttribute('aria-valuetext', '10')
    expect(readoutText('Larghezza')).toBe('18.97 ms')
    expect(readoutText('Area del kernel')).toBe('1.000')
    expect(pctOf(readoutText('Bias massimo'))).toBeGreaterThan(5)
    expect(document.querySelector('[data-dirac]')).toBeNull()
    expect(document.querySelector('[data-between]')).not.toBeNull()
    expect(screen.getByText('Dati sintetici')).toBeInTheDocument()
  })

  it('il Passo avanti fa crescere N di √10 e il bias scende', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const before = pctOf(readoutText('Bias massimo'))
    await user.click(screen.getByLabelText('Passo avanti'))
    expect(nSlider()).toHaveAttribute('aria-valuetext', '32')
    await user.click(screen.getByLabelText('Passo avanti'))
    expect(nSlider()).toHaveAttribute('aria-valuetext', '100')
    expect(readoutText('Larghezza')).toBe('6.00 ms')
    expect(pctOf(readoutText('Bias massimo'))).toBeLessThan(before)
  })

  it('il passo della delta: h_N sotto il millisecondo, la freccia di Dirac, media = vera, area sempre 1', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await goTo(user, /Vai al passo 10: Il kernel diventa una delta/)
    expect(document.querySelector('[data-dirac]')).not.toBeNull()
    expect(screen.getByText('Il kernel è una delta: media = vera')).toBeInTheDocument()
    expect(readoutText('Larghezza')).toBe('0.19 ms')
    expect(pctOf(readoutText('Bias massimo'))).toBeLessThan(0.1)
    expect(readoutText('Area del kernel')).toBe('1.000')
  })

  it('il passo "h fisso": il bias resta quello di N = 10 anche con 100 000 battiti', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const atTen = readoutText('Bias massimo')
    await goTo(user, /Vai al passo 11: Con h fisso il bias resta/)
    expect(within(lawGroup()).getByRole('radio', { name: 'h fisso' })).toBeChecked()
    expect(nSlider()).toHaveAttribute('aria-valuetext', '100.000')
    expect(readoutText('Bias massimo')).toBe(atTen)
    expect(screen.getByText('h fisso: il bias resta')).toBeInTheDocument()
  })

  it('il passo della banda la accende; toccare la legge durante un passo prende il comando da ciò che si vede', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await goTo(user, /Vai al passo 12: Bias contro varianza/)
    expect(screen.getByRole('switch', { name: /Banda ±1 deviazione standard/ })).toBeChecked()
    expect(document.querySelector('[data-band]')).not.toBeNull()
    await goTo(user, /Vai al passo 11: Con h fisso il bias resta/)
    await user.click(within(lawGroup()).getByRole('radio', { name: 'h_N = h₁/√N' }))
    // N resta quello del passo (100 000), la legge ora è quella scelta: kernel stretto, bias quasi nullo
    expect(nSlider()).toHaveAttribute('aria-valuetext', '100.000')
    expect(readoutText('Larghezza')).toBe('0.19 ms')
    expect(document.querySelector('[data-dirac]')).not.toBeNull()
  })

  it('con lo slider di N in fondo e il kernel rettangolare il picco vale 1/h_N e l\'area resta 1', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    nSlider().focus()
    await user.keyboard('{End}')
    expect(nSlider()).toHaveAttribute('aria-valuetext', '100.000')
    await user.click(within(screen.getByRole('radiogroup', { name: /Kernel/ })).getByRole('radio', { name: 'rettangolare' }))
    expect(readoutText('Picco del kernel')).toBe((1 / (60 / Math.sqrt(100000))).toFixed(4))
    expect(readoutText('Area del kernel')).toBe('1.000')
    expect(pctOf(readoutText('Bias massimo'))).toBeLessThan(0.1)
  })

  it('la sfida: N con il picco abbassato al più dell\'1%, entro il 15%', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const input = screen.getByRole('spinbutton', { name: /Battiti necessari/ })
    fireEvent.change(input, { target: { value: '1000' } })
    fireEvent.blur(input)
    await user.click(button('Verifica'))
    expect(screen.queryByText('Sfida superata.')).toBeNull()
    fireEvent.change(input, { target: { value: String(Math.round(nForOnePercent().n)) } })
    fireEvent.blur(input)
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
