import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-galleria-kernel-base.widget'
import { button, readoutText, stubReducedMotion } from './parzen-lab-testing'

describe('m09-galleria-kernel-base: il widget', { timeout: 30_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  const lamps = () => [...document.querySelectorAll('[data-lamp]')].map((l) => l.getAttribute('data-lamp'))
  const tabs = () => screen.getByRole('radiogroup', { name: 'Scheda' })

  it('meta coerente con l\'inventario', () => {
    expect(meta.id).toBe('m09-galleria-kernel-base')
    expect(meta.concepts).toEqual(['c33', 'c34', 'c35'])
    expect(meta.scenario).toBe('cifre')
  })

  it('si apre sul gaussiano: picco 0.399, quattro spie verdi, stima continua e derivabile nella lente', () => {
    render(<Widget />)
    expect(readoutText('Picco del kernel')).toBe('0.399')
    expect(lamps()).toEqual(['ok', 'ok', 'ok', 'ok'])
    expect(document.querySelector('[data-lens]')?.textContent).toContain('continua e derivabile')
  })

  it('la scheda del rettangolo: la continuità è violata, i salti marcati, la lente dice "discontinua"', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(tabs()).getByRole('radio', { name: 'rettangolare' }))
    expect(lamps()).toEqual(['ok', 'ok', 'ko', 'ok'])
    expect(document.querySelectorAll('[data-jumps]').length).toBeGreaterThan(0)
    expect(document.querySelector('[data-lens]')?.textContent).toContain('discontinua')
  })

  it('il rettangolo alto 1/2: area 0.500 e la spia dell\'area si spegne', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(tabs()).getByRole('radio', { name: 'rettangolare' }))
    await user.click(screen.getByRole('switch', { name: /Altezza 1\/2/ }))
    expect(lamps()[0]).toBe('ko')
    expect(document.body.textContent).toContain('0.500')
  })

  it('il triangolo: continuo ma non derivabile', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(tabs()).getByRole('radio', { name: 'triangolare' }))
    expect(lamps()).toEqual(['ok', 'ok', 'ok', 'ok'])
    expect(screen.getByText('continua, non derivabile')).toBeInTheDocument()
    expect(document.querySelector('[data-kinks]')).not.toBeNull()
  })

  it('la lente si sposta da tastiera', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const lens = screen.getByRole('slider', { name: 'Lente di ingrandimento' })
    const before = lens.getAttribute('aria-valuenow')
    lens.focus()
    await user.keyboard('{ArrowRight}')
    expect(lens.getAttribute('aria-valuenow')).not.toBe(before)
  })

  it('la sfida: tre tratti riconosciuti e la formula del gaussiano composta a tessere', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const pick = async (id: string, label: string) => user.click(within(screen.getByRole('radiogroup', { name: `Tratto ${id}: kernel` })).getByRole('radio', { name: label }))
    await pick('A', 'triang.')
    await pick('B', 'gauss.')
    await pick('C', 'rett.')
    await user.click(button('Vai alla scheda delle tessere'))
    const order = ['uno', 'radice', 'exp', 'meno', 'due']
    for (let i = 0; i < order.length; i++) {
      await user.click(screen.getByRole('button', { name: `Tessera ${order[i]}` }))
      await user.click(screen.getByRole('button', { name: new RegExp(`^Casella ${i + 1}`) }))
    }
    expect(screen.getByText(/Giusta: γ\(x\)/)).toBeInTheDocument()
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
