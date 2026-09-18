import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import { H_RANGE, largestTwoModeH } from './sfocata'
import Widget, { meta } from './m09-media-sfocata.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-media-sfocata: il widget', { timeout: 30_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  const hSlider = () => screen.getByRole('slider', { name: /Larghezza della finestra/ })

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-media-sfocata')
    expect(meta.concepts).toEqual(['c41', 'c42', 'c44'])
    expect(meta.size).toBe('L')
  })

  it('si apre con un esame; "Simula 200 esami" porta il fascio e la media', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    expect(readoutText('Esami')).toBe('1')
    await user.click(button('Simula 200 esami'))
    expect(readoutText('Esami')).toBe('200')
    expect(screen.getByText('200 esami: il fascio e la sua media')).toBeInTheDocument()
  })

  it('la curva teorica e il bias compaiono dal passo "La media è la vera, sfocata"; con h = 40 due modi', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByLabelText('Passo avanti'))
    await user.click(screen.getByLabelText('Passo avanti'))
    expect(document.querySelector('[data-between]')).not.toBeNull()
    expect(readoutText('Modi della media')).toBe('2')
  })

  it('"Mostra la convoluzione" (reduced motion: stato finale) e il preset gaussiana su gaussiana: −29.3%', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Mostra la convoluzione'))
    expect(document.querySelector('[data-sliding]')).not.toBeNull()
    await user.click(screen.getByRole('switch', { name: /Preset: gaussiana su gaussiana/ }))
    expect(readoutText('Picco abbassato')).toBe('29.3%')
  })

  it('con h grande i due modi si fondono', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    hSlider().focus()
    await user.keyboard('{End}')
    expect(hSlider()).toHaveAttribute('aria-valuetext', `${H_RANGE[1]} ms`)
    expect(readoutText('Modi della media')).toBe('1')
  })

  it('la sfida: il più grande h con due modi e la spiegazione giusta', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const target = largestTwoModeH()
    hSlider().focus()
    await user.keyboard('{Home}')
    // PagSu salta di un decimo della scala (20 ms): pochi tasti, pochi ricalcoli dei 200 esami
    let at = H_RANGE[0]
    while (at + 20 <= target) {
      await user.keyboard('{PageUp}')
      at += 20
    }
    for (; at < target; at++) await user.keyboard('{ArrowRight}')
    expect(hSlider()).toHaveAttribute('aria-valuetext', `${target} ms`)
    await user.click(within(screen.getByRole('radiogroup', { name: /Aumentare N/ })).getByRole('radio', { name: 'la media della stima non dipende da N' }))
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
