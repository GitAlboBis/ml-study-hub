import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { knnDensity1d, parzen1d } from '../../../lib/ml/nonparam'
import { useProgress } from '../../../store/progress'
import type { WidgetMeta } from '../../types'
import { DensityExplorer } from './DensityExplorer'
import { mixtureScenario } from './scenarios'
import type { Density1dPreset } from './types'

const META: WidgetMeta = {
  id: '_prova-density1d',
  moduleId: '_test',
  title: 'Prova del motore density1d',
  concepts: [],
  scenario: 'sensori',
  scenarioNote: 'Cinque letture di un sensore',
  size: 'L',
}

const SAMPLES = [1, 2, 2.5, 4, 6]

const PRESET: Density1dPreset = {
  scenario: mixtureScenario({
    samples: SAMPLES,
    components: [{ weight: 1, mu: 3, sigma: 1.5 }],
    domain: [0, 8],
    axis: { it: 'temperatura', en: 'temperature', unit: '°C' },
    sampleName: { one: 'lettura', many: 'letture' },
  }),
  layers: ['kernels', 'estimate', 'truth', 'histogram', 'knn'],
  initialLayers: ['kernels', 'estimate', 'histogram', 'knn'],
  kernels: ['gaussiano', 'rettangolare', 'triangolare', 'epanechnikov'],
  initial: { h: 0.5, kernel: 'gaussiano', k: 2, bins: 8, probe: 2 },
  h: { min: 0.1, max: 2 },
  k: { min: 1, max: 5 },
  bins: { min: 2, max: 16 },
  samples: { editable: true, min: 2, max: 6 },
  yMax: 1,
  storyboard: [
    { id: 'quadro', label: 'Quadro', phase: { kind: 'overview' }, durationMs: 500, caption: 'Il quadro.' },
    { id: 'cadono', label: 'Cadono', phase: { kind: 'drop' }, durationMs: (n) => n * 100, caption: ({ n }) => `Cadono ${n} letture.` },
    { id: 'esplora', label: 'Esplora', phase: { kind: 'explore' }, durationMs: 0, caption: 'Tocca a te.' },
  ],
  formulas: [{ id: 'p', label: 'Stima', tex: String.raw`\hat p(\val{x}) = \val[4]{p}` }],
  addends: true,
  challenge: { kind: 'custom', prompt: 'Porta $h$ almeno a 1.', check: (s) => s.h >= 1 },
  terms: [
    { target: 'kernels', symbol: String.raw`\gamma(\cdot)`, en: 'kernel', it: 'Il kernel.' },
    { target: 'estimate', symbol: String.raw`\hat p(x)`, en: 'estimate', it: 'La stima.' },
  ],
  ariaLabel: 'Prova',
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' && matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }))
}

const readoutValue = (label: string) => screen.getByText(label, { selector: '.label' }).closest('div')!.parentElement!
const count = () => document.querySelectorAll('[data-sample]').length

describe('DensityExplorer', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('disegna gli strati del preset: campane, istogramma, K-NN, con i comandi relativi', () => {
    render(<DensityExplorer meta={META} preset={PRESET} />)
    expect(document.querySelectorAll('[data-kernel]')).toHaveLength(5)
    expect(document.querySelector('[data-histogram]')).not.toBeNull()
    expect(screen.getAllByRole('radio')).toHaveLength(4 + 3) // 4 kernel + 3 velocità del trasporto
    expect(screen.getByRole('slider', { name: /vicini/i })).toHaveAttribute('aria-valuetext', '2')
    expect(screen.getByRole('slider', { name: /bin/i })).toHaveAttribute('aria-valuetext', '8')
    const pk = knnDensity1d(2, SAMPLES, 2)
    expect(within(readoutValue('Stima K-NN in x')).getAllByText(pk.toFixed(4)).length).toBeGreaterThan(0)
  })

  it('cambiare kernel cambia la stima: il rettangolare conta K / (N h)', async () => {
    const user = userEvent.setup()
    render(<DensityExplorer meta={META} preset={PRESET} />)
    await user.click(screen.getByRole('radio', { name: 'rettangolare' }))
    // in x = 2 con h = 0.5: dentro |x − x_k| ≤ 0.25 c'è solo x = 2 → 1 / (5 · 0.5) = 0.4
    expect(within(readoutValue('Stima nel punto x')).getAllByText('0.4000').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('radio', { name: 'Epanechnikov' }))
    const p = parzen1d(2, SAMPLES, 0.5, 'epanechnikov')
    expect(within(readoutValue('Stima nel punto x')).getAllByText(p.toFixed(4)).length).toBeGreaterThan(0)
  })

  it('rispetta minimo e massimo dei campioni', () => {
    render(<DensityExplorer meta={META} preset={PRESET} />)
    const strip = document.querySelector('[data-belt-strip]')!
    fireEvent.click(strip, { clientX: 200, clientY: 440 })
    expect(count()).toBe(6)
    fireEvent.click(strip, { clientX: 300, clientY: 440 })
    expect(count()).toBe(6)
    for (let i = 0; i < 5; i++) fireEvent.click(document.querySelector('[data-sample]')!)
    expect(count()).toBe(2)
  })

  it('i pulsanti aggiungono nel punto sonda e tolgono il campione più vicino', () => {
    render(<DensityExplorer meta={META} preset={PRESET} />)
    fireEvent.click(screen.getByText(/Aggiungi in x = 2/, { selector: 'button' }))
    expect(count()).toBe(6)
    fireEvent.click(screen.getByText(/Togli il più vicino/, { selector: 'button' }))
    fireEvent.click(screen.getByText(/Togli il più vicino/, { selector: 'button' }))
    expect(count()).toBe(4)
    // tolti i due campioni in x = 2: il più vicino ora è 2.5
    expect(screen.getByText(/Togli il più vicino \(2\.5\)/, { selector: 'button' })).toBeInTheDocument()
  })

  it('la sfida personalizzata decide con lo stato corrente', async () => {
    const user = userEvent.setup()
    render(<DensityExplorer meta={META} preset={PRESET} />)
    await user.click(screen.getByText('Verifica', { selector: 'button' }))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    screen.getByRole('slider', { name: /larghezza/i }).focus()
    await user.keyboard('{End}')
    await user.click(screen.getByText('Verifica', { selector: 'button' }))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })

  it('la legenda viva: un clic fissa la voce (aria-pressed), il secondo la libera', async () => {
    const user = userEvent.setup()
    render(<DensityExplorer meta={META} preset={PRESET} />)
    const entry = screen.getByText('Il kernel.').closest('button')!
    await user.click(entry)
    expect(entry).toHaveAttribute('aria-pressed', 'true')
    // le altre voci del terreno si attenuano
    expect(document.querySelector('[data-kernels]')).toHaveAttribute('opacity', '1')
    await user.click(entry)
    expect(entry).toHaveAttribute('aria-pressed', 'false')
  })

  it('la tabella degli addendi somma a p̂(x)', () => {
    render(<DensityExplorer meta={META} preset={PRESET} />)
    const table = screen.getByRole('table')
    const p = parzen1d(2, SAMPLES, 0.5, 'gaussiano')
    expect(within(table).getByText(p.toFixed(4))).toBeInTheDocument()
    expect(within(table).getAllByRole('row')).toHaveLength(1 + 5 + 1)
  })

  it('senza reduced motion un campione nuovo nasce con il ciclo dei fotogrammi, che poi si ferma', async () => {
    stubReducedMotion(false)
    // fotogrammi a mano: requestAnimationFrame li mette in coda, cancelAnimationFrame li toglie
    const frames = new Map<number, FrameRequestCallback>()
    let nextId = 1
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.set(nextId, cb)
      return nextId++
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
    render(<DensityExplorer meta={META} preset={PRESET} />)
    fireEvent.click(document.querySelector('[data-belt-strip]')!, { clientX: 200, clientY: 440 })
    expect(count()).toBe(6)
    // prima del primo fotogramma la campana nuova non è ancora nata
    expect(document.querySelectorAll('[data-kernel]')).toHaveLength(5)
    let t = 0
    for (let i = 0; i < 60 && frames.size > 0; i++) {
      const pending = [...frames.values()]
      frames.clear()
      t += 16
      await act(async () => pending.forEach((cb) => cb(t)))
    }
    expect(document.querySelectorAll('[data-kernel]')).toHaveLength(6)
    // a moto finito il ciclo si è fermato: nessun fotogramma in attesa
    expect(frames.size).toBe(0)
  })
})
