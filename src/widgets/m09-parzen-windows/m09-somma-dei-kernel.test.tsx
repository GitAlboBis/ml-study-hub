import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import katex from 'katex'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRich } from '../../lib/rich'
import { kernelValue, parzen1d } from '../../lib/ml/nonparam'
import { linspace, trapz } from '../../lib/ml/stats'
import { useProgress } from '../../store/progress'
import { FORMULA_VALUE_NAMES, captionFor, countLocalMaxima, formulaValues, iseAt, niceLogSteps, optimalBandwidth } from '../engines/density1d'
import { weightedKernelSum } from '../engines/density1d/density1d'
import Widget, { meta } from './m09-somma-dei-kernel.widget'
import { preset, scenario } from './m09-somma-dei-kernel.preset'

/** I dodici salmoni dell'inventario, come li elenca la specifica. */
const INVENTORY = [2.6, 3.1, 3.3, 3.8, 4.0, 4.1, 4.4, 4.9, 5.2, 5.6, 6.3, 7.1]
const truth = scenario.truth!
const texOf = (tex: string | ((c: { n: number; kernel: 'gaussiano' }) => string), n: number) => (typeof tex === 'function' ? tex({ n, kernel: 'gaussiano' }) : tex)
const VAL = /\\val(?:\[\d+\])?\{([^{}]+)\}/g

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

describe('m09-somma-dei-kernel: dati e contratto', () => {
  it('meta coerente con il file e con l\'inventario', () => {
    expect(meta.id).toBe('m09-somma-dei-kernel')
    expect(meta.moduleId).toBe('m09-parzen-windows')
    expect(meta.concepts).toEqual(['c15', 'c17', 'c18', 'c26'])
    expect(meta.scenario).toBe('pesce')
    expect(meta.size).toBe('L')
  })

  it('i campioni sono i 12 salmoni dell\'inventario e la verità è la mistura dichiarata', () => {
    expect([...scenario.samples].sort((a, b) => a - b)).toEqual(INVENTORY)
    expect(scenario.truthTex).toBe(String.raw`0.7\,\mathcal{N}(4,\ 0.8^2) + 0.3\,\mathcal{N}(6,\ 0.9^2)`)
    const xs = linspace(0, 10, 2001)
    expect(trapz(xs, xs.map(truth))).toBeCloseTo(1, 4)
  })

  it('i numeri della specifica: con h = 0.5 area 1/N = 0.083 e picco 0.399/(N h) = 0.0665', () => {
    const v = formulaValues({ x: 4.2, samples: scenario.samples, h: 0.5, kernel: 'gaussiano', k: 3 })
    expect(Number(v.area).toFixed(3)).toBe('0.083')
    expect(Number(v.peak).toFixed(4)).toBe('0.0665')
  })

  it('lo slider h va da 0.05 a 3 e contiene 0.5 e le due soglie', () => {
    const hs = niceLogSteps(preset.h.min, preset.h.max)
    expect(hs[0]).toBe(0.05)
    expect(hs.at(-1)).toBe(3)
    for (const v of [0.15, 0.5, 1.5]) expect(hs).toContain(v)
  })

  it('le formule vive usano solo valori che il motore fornisce e KaTeX le compila', () => {
    for (const n of [1, 2, 3, 12, 40]) {
      for (const f of preset.formulas) {
        const tex = texOf(f.tex, n)
        for (const m of tex.matchAll(VAL)) expect(FORMULA_VALUE_NAMES, `${f.id}: ${m[1]}`).toContain(m[1])
        const filled = tex.replace(VAL, '1.23')
        expect(() => katex.renderToString(filled, { displayMode: true, throwOnError: true })).not.toThrow()
      }
    }
  })

  it('didascalie, sfida, termini e note compilano senza errori di KaTeX', () => {
    for (const n of [1, 12]) {
      for (const s of preset.storyboard) {
        expect(() => renderRich(captionFor(s, { n, h: 0.5, kernel: 'gaussiano', invN: (1 / n).toFixed(3) }), { throwOnError: true }), s.id).not.toThrow()
      }
    }
    const ch = preset.challenge!
    for (const r of [ch.prompt, ch.hint ?? '', ...(preset.terms ?? []).map((t) => t.it), ...(preset.notes ?? [])]) expect(() => renderRich(r, { throwOnError: true })).not.toThrow()
    for (const t of preset.terms ?? []) expect(() => katex.renderToString(t.symbol, { throwOnError: true })).not.toThrow()
  })
})

describe('m09-somma-dei-kernel: la sfida è tarata', () => {
  const tol = preset.challenge?.kind === 'min-ise' ? preset.challenge.tolerance : Number.NaN
  const hs = niceLogSteps(preset.h.min, preset.h.max)

  it('l\'h predefinito (0.5) NON basta: bisogna davvero cercare', () => {
    const best = optimalBandwidth(scenario.samples, 'gaussiano', truth, scenario.domain, [preset.h.min, preset.h.max])
    expect(iseAt(scenario.samples, 0.5, 'gaussiano', truth, scenario.domain) / best.ise).toBeGreaterThan(tol)
  })

  it('per ogni kernel del selettore almeno un h dello slider supera la sfida', () => {
    for (const kernel of preset.kernels) {
      const best = optimalBandwidth(scenario.samples, kernel, truth, scenario.domain, [preset.h.min, preset.h.max])
      const passing = hs.filter((h) => iseAt(scenario.samples, h, kernel, truth, scenario.domain) / best.ise <= tol)
      expect(passing.length, kernel).toBeGreaterThan(0)
    }
  })

  it("l'indizio funziona: il più piccolo h con un solo massimo locale (gaussiano) supera la sfida", () => {
    const xs = linspace(0, 10, 801)
    const w = scenario.samples.map(() => 1 / scenario.samples.length)
    const h = hs.find((v) => countLocalMaxima(weightedKernelSum(xs, scenario.samples, v, 'gaussiano', w)) === 1)!
    const best = optimalBandwidth(scenario.samples, 'gaussiano', truth, scenario.domain, [preset.h.min, preset.h.max])
    expect(iseAt(scenario.samples, h, 'gaussiano', truth, scenario.domain) / best.ise).toBeLessThanOrEqual(tol)
  })
})

describe('m09-somma-dei-kernel: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  const hSlider = () => screen.getByRole('slider', { name: /larghezza della finestra/i })
  // Niente getByRole('button', { name }) qui: calcolare il nome di TUTTI i pulsanti entra nel MathML delle voci
  // di legenda, e il getComputedStyle di jsdom si rompe sugli elementi MathML (nei browser veri va tutto bene).
  const button = (text: string) => screen.getByText(text, { selector: 'button' })
  const byLabel = (label: string) => screen.getByLabelText(label)
  const readout = (label: RegExp) => screen.getByText(label, { selector: '.label' }).closest('div')!.parentElement!

  it('si apre con il quadro completo: 12 salmoni, h = 0.50, p̂(4.20) nella lettura', () => {
    render(<Widget />)
    expect(screen.getByRole('heading', { name: meta.title })).toBeInTheDocument()
    expect(screen.getByText('Dati sintetici')).toBeInTheDocument()
    expect(hSlider()).toHaveAttribute('aria-valuetext', '0.50')
    expect(document.querySelectorAll('[data-sample]')).toHaveLength(12)
    expect(document.querySelectorAll('[data-kernel]')).toHaveLength(12)
    const p = parzen1d(4.2, scenario.samples, 0.5, 'gaussiano')
    expect(within(readout(/Stima nel punto x/)).getAllByText(p.toFixed(4)).length).toBeGreaterThan(0)
    // la densità vera parte nascosta: niente ISE
    expect(screen.queryByText('Errore integrato')).not.toBeInTheDocument()
  })

  it('h piccolo accende il timbro "sensibile", h grande quello "liscia"', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    hSlider().focus()
    await user.keyboard('{Home}')
    expect(hSlider()).toHaveAttribute('aria-valuetext', '0.05')
    expect(screen.getByText(/Stima sensibile/)).toBeInTheDocument()
    await user.keyboard('{End}')
    expect(hSlider()).toHaveAttribute('aria-valuetext', '3.00')
    expect(screen.getByText(/Stima liscia/)).toBeInTheDocument()
  })

  it('clic sul nastro aggiunge un salmone, clic su un salmone lo toglie', () => {
    render(<Widget />)
    const strip = document.querySelector('[data-belt-strip]')!
    // senza misura (jsdom) il viewBox è 720 × 480: x = 5 cade a 48 + 329 px
    fireEvent.click(strip, { clientX: 48 + 329, clientY: 440 })
    expect(document.querySelectorAll('[data-sample]')).toHaveLength(13)
    expect(screen.getByText('N = 13')).toBeInTheDocument()
    fireEvent.click(document.querySelector('[data-sample]')!)
    expect(document.querySelectorAll('[data-sample]')).toHaveLength(12)
  })

  it('da tastiera, sul cursore di lettura: Invio aggiunge, Canc toglie il più vicino', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const cursor = screen.getByRole('slider', { name: /cursore di lettura/i })
    cursor.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('N = 13')).toBeInTheDocument()
    await user.keyboard('{Delete}{Delete}')
    expect(screen.getByText('N = 11')).toBeInTheDocument()
  })

  it('sfida: con h = 0.5 "non ancora" e la verità si rivela; con h = 0.40 superata', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    expect(screen.getByText('Errore integrato')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /densità vera/i })).toBeChecked()
    // 0.50 → 0.45 → 0.40
    hSlider().focus()
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(hSlider()).toHaveAttribute('aria-valuetext', '0.40')
    expect(screen.queryByText('Non ancora.')).not.toBeInTheDocument()
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-somma-dei-kernel']).toBeDefined()
  })

  it('storyboard a passi con reduced motion: ogni passo mostra subito il suo stato finale', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const next = byLabel('Passo avanti')
    await user.click(next)
    expect(screen.getByText('I campioni cadono sul nastro', { selector: 'strong' })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-sample]')).toHaveLength(12)
    expect(document.querySelectorAll('[data-kernel]')).toHaveLength(0)
    await user.click(next)
    // nascono: kernel interi, picco γ(0)/h
    expect(document.querySelectorAll('[data-kernel]')).toHaveLength(12)
    await user.click(next)
    await user.click(next)
    expect(screen.getByText(/ecco p̂\(x\)/, { selector: 'strong' })).toBeInTheDocument()
    await user.click(next)
    // verità: la densità vera compare anche con l'interruttore spento
    expect(screen.getByText('Errore integrato')).toBeInTheDocument()
  })

  it('un passo che impone h si ferma se si muove lo slider: comanda l\'utente', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const next = byLabel('Passo avanti')
    for (let i = 0; i < 6; i++) await user.click(next)
    expect(screen.getByText('h piccolo: un ago per salmone', { selector: 'strong' })).toBeInTheDocument()
    // il passo mostra h = 0.10: la lettura segue h del passo
    const pShown = parzen1d(4.2, scenario.samples, 0.1, 'gaussiano')
    expect(within(readout(/Stima nel punto x/)).getAllByText(pShown.toFixed(4)).length).toBeGreaterThan(0)
    hSlider().focus()
    await user.keyboard('{ArrowRight}')
    const pUser = parzen1d(4.2, scenario.samples, 0.6, 'gaussiano')
    expect(within(readout(/Stima nel punto x/)).getAllByText(pUser.toFixed(4)).length).toBeGreaterThan(0)
  })

  it('Reset riporta salmoni, h e storyboard all\'inizio', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    hSlider().focus()
    await user.keyboard('{End}')
    fireEvent.click(document.querySelector('[data-belt-strip]')!, { clientX: 100, clientY: 440 })
    await user.click(byLabel('Passo avanti'))
    await user.click(screen.getByText('Reset').closest('button')!)
    expect(hSlider()).toHaveAttribute('aria-valuetext', '0.50')
    expect(document.querySelectorAll('[data-sample]')).toHaveLength(12)
    expect(screen.getByText('Il quadro: i salmoni e la loro stima', { selector: 'strong' })).toBeInTheDocument()
  })

  it('la formula viva mostra i numeri del punto sonda', () => {
    render(<Widget />)
    const p = parzen1d(4.2, scenario.samples, 0.5, 'gaussiano')
    const S = scenario.samples.reduce((s, xk) => s + kernelValue((4.2 - xk) / 0.5, 'gaussiano'), 0)
    const math = [...document.querySelectorAll('.katex-html')].map((el) => el.textContent ?? '').join(' ')
    expect(math).toContain(p.toFixed(4))
    expect(math).toContain(S.toFixed(3))
    expect(math).toContain('6.00')
  })

  it('senza reduced motion, al primo passo della caduta i salmoni non sono ancora arrivati', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(byLabel('Passo avanti'))
    expect(document.querySelectorAll('[data-sample]')).toHaveLength(0)
    await act(async () => {})
  })
})
