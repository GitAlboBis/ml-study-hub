import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-scatola-nera-non-parametrica.widget'
import { button, expectRichCompiles, expectTexCompiles, readoutText, stubReducedMotion, valNames } from './parzen-lab-testing'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  STEP,
  TEX_ISE,
  TEX_KNV,
  TEX_ML,
  TRUTHS,
  captionFor,
  drawSamples,
  gaussFit,
  machineErrors,
  stepsFor,
} from './scatola-nera'

const VALUES = ['K', 'N', 'h', 'pk', 'x', 'p', 'mu', 's2', 'iseG', 'iseP']

describe('m09-scatola-nera-non-parametrica: contratto e testi', () => {
  it('meta coerente con il file e con l\'inventario', () => {
    expect(meta.id).toBe('m09-scatola-nera-non-parametrica')
    expect(meta.moduleId).toBe('m09-parzen-windows')
    expect(meta.concepts).toEqual(['c01', 'c40'])
    expect(meta.scenario).toBe('energia')
    expect(meta.size).toBe('M')
  })

  it('le formule vive usano solo valori forniti dal widget e compilano; c\'è la formula del docente K/(NV)', () => {
    for (const tex of [TEX_KNV, TEX_ML, TEX_ISE]) {
      for (const name of valNames(tex)) expect(VALUES).toContain(name)
      expectTexCompiles(tex)
    }
    expect(TEX_KNV).toContain(String.raw`\hat{p}(\mathbf{x}^*)&=\frac{K}{NV}`)
    expect(TEX_KNV).toContain(String.raw`\frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\gamma`)
  })

  it('didascalie di ogni passo, sfida e indizio compilano (per ogni densità e per i due vincitori)', () => {
    const steps = stepsFor(30)
    expect(steps).toHaveLength(8)
    for (let i = 0; i < steps.length; i++) {
      for (const t of TRUTHS) for (const winner of ['gauss', 'parzen'] as const) expectRichCompiles(captionFor(i, { n: 30, h: '0.60', truth: t.id, mu: '4.61', winner, K: 3, x: '4.30' }))
    }
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
    // la chiusura cita la slide p41: forma funzionale sconosciuta, training samples
    expect(captionFor(STEP.perche, { n: 30, h: '0.60', truth: 'bimodale', mu: '4.61', winner: 'parzen', K: 3, x: '4.30' })).toMatch(/forma funzionale.*training samples/s)
    // i comandi LaTeX arrivano interi (una barra rovescia persa li trasformerebbe in parole)
    expect(captionFor(STEP.quadro, { n: 30, h: '0.60', truth: 'bimodale', mu: '4.61', winner: 'parzen', K: 3, x: '4.30' })).toContain(String.raw`$\hat\mu$`)
    expect(captionFor(STEP.media, { n: 30, h: '0.60', truth: 'bimodale', mu: '4.61', winner: 'parzen', K: 3, x: '4.30' })).toContain(String.raw`\frac{1}{V(h)}\gamma`)
  })
})

describe('m09-scatola-nera-non-parametrica: il widget', { timeout: 20_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
  })

  it('si apre con il quadro completo: bimodale, N = 30, h = 0.60, due macchine e i due errori', () => {
    render(<Widget />)
    expect(screen.getByRole('heading', { name: meta.title })).toBeInTheDocument()
    expect(screen.getByText('Dati sintetici')).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /Giornate misurate/ })).toHaveAttribute('aria-valuetext', '30')
    expect(screen.getByRole('slider', { name: /Ghiera della black box/ })).toHaveAttribute('aria-valuetext', '0.60 kWh/m²')
    expect(document.querySelectorAll('[data-machine]')).toHaveLength(2)
    expect(document.querySelectorAll('[data-rug-sample]')).toHaveLength(30)
    const s = drawSamples('bimodale', 1, 30)
    const e = machineErrors(s, 0.6, 'bimodale')
    expect(readoutText('Errore gaussiana')).toBe(e.gauss.toFixed(4))
    expect(readoutText('Errore Parzen')).toBe(e.parzen.toFixed(4))
    expect(readoutText('Media stimata')).toContain(gaussFit(s).mu.toFixed(2))
    expect(screen.getByText(/Vince la black box di Parzen:/)).toBeInTheDocument()
  })

  it('"Apri la scatola" porta al primo tempo del meccanismo e apre il coperchio (reduced motion: subito)', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button(/Apri la scatola/))
    expect(screen.getByText('Apri la scatola: una finestra su ogni dato')).toBeInTheDocument()
    expect(document.querySelector('[data-machine="parzen"]')).toHaveAttribute('data-lid', '1.00')
    // una campana per ogni giornata
    expect(document.querySelectorAll('[data-kernel]')).toHaveLength(30)
    await user.click(screen.getByLabelText('Passo avanti'))
    expect(screen.getByText('La proporzione di punti nella finestra')).toBeInTheDocument()
    expect(document.querySelector('[data-band]')).not.toBeNull()
  })

  it('passo dopo passo il racconto arriva alla chiusura, e Reset torna al quadro', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    for (let i = 0; i < 7; i++) await user.click(screen.getByLabelText('Passo avanti'))
    expect(screen.getByText('Quando serve la stima non parametrica')).toBeInTheDocument()
    await user.click(button(/Reset/))
    expect(screen.getByText('Due macchine, gli stessi dati')).toBeInTheDocument()
  })

  it('cambiare densità vera e N ricalcola le curve; con la gaussiana vera e 30 giornate vince il modello parametrico', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(screen.getByRole('radiogroup', { name: /Densità vera/ })).getByRole('radio', { name: 'gaussiana' }))
    expect(screen.getByText(/Vince il modello parametrico:/)).toBeInTheDocument()
    const nSlider = screen.getByRole('slider', { name: /Giornate misurate/ })
    nSlider.focus()
    await user.keyboard('{End}')
    expect(nSlider).toHaveAttribute('aria-valuetext', '1000')
    expect(document.querySelectorAll('[data-rug-sample]')).toHaveLength(1000)
  })

  it('la sfida: previsioni giuste e N = 150 sull\'asimmetrica la superano; prima no', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const predict = async (truth: string, choice: 'Gaussiana' | 'Parzen') =>
      user.click(within(screen.getByRole('radiogroup', { name: new RegExp(`N = 30, ${truth}: vince`) })).getByRole('radio', { name: choice }))
    await predict('gaussiana', 'Gaussiana')
    await predict('bimodale', 'Parzen')
    await predict('asimmetrica', 'Gaussiana')
    await predict('uniforme \\+ triangolo', 'Parzen')
    // densità ancora bimodale: la parte 2 non c'è
    await user.click(button('Verifica'))
    expect(screen.getByText(/Parte 2: scegli la densità asimmetrica/)).toBeInTheDocument()
    expect(screen.queryByText('Sfida superata.')).not.toBeInTheDocument()

    await user.click(within(screen.getByRole('radiogroup', { name: /Densità vera/ })).getByRole('radio', { name: 'asimmetrica' }))
    const nSlider = screen.getByRole('slider', { name: /Giornate misurate/ })
    nSlider.focus()
    // 30 → 150: cinque tacche (40, 50, 70, 100, 150)
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(nSlider).toHaveAttribute('aria-valuetext', '150')
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges[meta.id]).toBeDefined()
  })

  it('una previsione sbagliata non supera la sfida e l\'esito lo dice per quella densità', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(within(screen.getByRole('radiogroup', { name: /N = 30, gaussiana: vince/ })).getByRole('radio', { name: 'Parzen' }))
    await user.click(button('Verifica'))
    expect(screen.getByText(/hai previsto Parzen; con N = 30 vince la gaussiana/)).toBeInTheDocument()
    expect(screen.queryByText('Sfida superata.')).not.toBeInTheDocument()
  })
})
