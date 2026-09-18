import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import { H0, LABEL, SUSPECT0, anomalyScore, severityOrder } from './galleria-code'
import Widget, { meta } from './m09-galleria-kernel-code.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-galleria-kernel-code: il widget', { timeout: 30_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  const tabs = () => screen.getByRole('radiogroup', { name: 'Scheda' })

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-galleria-kernel-code')
    expect(meta.concepts).toEqual(['c36', 'c37', 'c38', 'c39'])
    expect(meta.scenario).toBe('banca')
  })

  it('si apre sull\'esponenziale: picco 0.500, importo sospetto a u = 4, quattro barre di anomalia', () => {
    render(<Widget />)
    expect(readoutText('Picco del kernel')).toBe('0.500')
    expect(readoutText('Distanza dal più vicino')).toBe('4.00')
    expect(document.querySelectorAll('[data-score]')).toHaveLength(4)
    expect(document.querySelector('[data-score="gaussiano"]')?.textContent).toContain(anomalyScore(SUSPECT0, H0, 'gaussiano').toFixed(2))
  })

  it('"Confronta le code": il cursore in u = 4 legge 0.00013, 0.0092 (0.00916), 0.019, 0.033', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByRole('switch', { name: 'Confronta le code' }))
    const text = document.body.textContent ?? ''
    expect(text).toContain('0.00013')
    expect(text).toContain('0.00916')
    expect(text).toContain('0.019')
    expect(text).toContain('0.033')
  })

  it('le schede cambiano il kernel; il verdetto mostra il quadro dei sei kernel', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(tabs()).getByRole('radio', { name: 'Cauchy' }))
    expect(readoutText('Picco del kernel')).toBe('0.318')
    await user.click(within(tabs()).getByRole('radio', { name: 'verdetto' }))
    expect(screen.getByRole('region', { name: /I sei kernel/ })).toBeInTheDocument()
  })

  it('la sfida: ordine calcolato e importo a u = 2π', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const order = severityOrder(SUSPECT0, H0)
    for (let i = 0; i < 4; i++) await user.click(within(screen.getByRole('radiogroup', { name: new RegExp(`^${i + 1}° posto`) })).getByRole('radio', { name: LABEL[order[i]] }))
    await user.click(within(screen.getByRole('radiogroup', { name: /Con u = 2π/ })).getByRole('radio', { name: 'si annulla' }))
    const s = screen.getByRole('slider', { name: 'Importo sospetto' })
    s.focus()
    await user.keyboard('{End}')
    expect(readoutText('Distanza dal più vicino')).toBe('6.29')
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
