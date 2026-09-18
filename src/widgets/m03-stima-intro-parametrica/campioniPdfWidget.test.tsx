import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import CampioniPdf, { meta } from './m03-campioni-che-rivelano-la-pdf.widget'

// Con prefers-reduced-motion ogni passo mostra subito il suo stato finale (progress = 1): lo stato "dopo N passi" si
// controlla senza orologi finti, premendo Passo avanti come farebbe chi usa la tastiera.
function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? reduced : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }))
}

/** Il testo di una lettura (Readout) trovata per etichetta: la cifra che si vede. */
function readout(label: string): string {
  const name = screen.getAllByText(label, { selector: '.label' })[0]
  const box = name.closest('div.grid') as HTMLElement
  return within(box).getByText((_, el) => el?.tagName === 'SPAN' && el.getAttribute('aria-hidden') === 'true' && el.classList.contains('num')).textContent ?? ''
}

/** requestAnimationFrame simulato: i fotogrammi scattano quando il test li chiede (come in useStoryboard.test.ts). */
function stubFrames() {
  let now = 1000
  let nextId = 1
  const pending = new Map<number, FrameRequestCallback>()
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    pending.set(nextId, cb)
    return nextId++
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => void pending.delete(id))
  return {
    advance(ms: number, frameMs = 100) {
      for (let t = 0; t < ms; t += frameMs) {
        now += frameMs
        const due = [...pending.values()]
        pending.clear()
        act(() => {
          for (const cb of due) cb(now)
        })
      }
    },
  }
}

const stepForward = () => fireEvent.click(screen.getByRole('button', { name: 'Passo avanti' }))

beforeEach(() => {
  stubMatchMedia(true)
  useProgress.setState({ challenges: {} })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('widget m03-campioni-che-rivelano-la-pdf', () => {
  it('rispetta il contratto: id uguale al nome del file, modulo m03, scenario pesce', () => {
    expect(meta.id).toBe('m03-campioni-che-rivelano-la-pdf')
    expect(meta.moduleId).toBe('m03-stima-intro-parametrica')
    expect(meta.scenario).toBe('pesce')
    expect(meta.concepts).toEqual(['c34', 'c35', 'c37'])
  })

  it('parte a sipario chiuso, senza campioni, con il badge dei dati sintetici', () => {
    render(<CampioniPdf />)
    expect(screen.getByRole('heading', { name: meta.title })).toBeInTheDocument()
    expect(screen.getByText('Dati sintetici')).toBeInTheDocument()
    expect(readout('Campioni N')).toBe('0')
    expect(readout('P vera')).toBe('nascosta')
    expect(screen.getByRole('switch', { name: 'Alza il sipario' })).not.toBeChecked()
  })

  it('stato dopo i passi: 1 campione al passo 2, N = 200 al passo 3, sipario alzato al passo 4', () => {
    render(<CampioniPdf />)
    stepForward()
    expect(readout('Campioni N')).toBe('1')
    stepForward()
    expect(readout('Campioni N')).toBe('200')
    expect(readout('P vera')).toBe('nascosta')
    stepForward()
    expect(screen.getByRole('switch', { name: 'Alza il sipario' })).toBeChecked()
    // unimodale N(3.1, 1²) fra a = 2 e b = 4
    expect(readout('P vera')).toBe('0.681')
  })

  it('la formula viva mostra i valori sostituiti', () => {
    const { container } = render(<CampioniPdf />)
    stepForward()
    stepForward()
    // P vera nascosta: nella formula c'è il punto di domanda, i limiti di integrazione sono a e b
    const vals = [...container.querySelectorAll('.katex-html [data-val]')].map((el) => el.textContent)
    expect(vals).toContain('200')
    expect(vals).toContain('2.00')
    expect(vals).toContain('4.00')
    expect(vals).toContain('?')
  })

  it('lo slider di N cambia i campioni senza rimescolarli', () => {
    render(<CampioniPdf />)
    stepForward()
    stepForward()
    const slider = screen.getByRole('slider', { name: 'Numero di campioni' })
    fireEvent.keyDown(slider, { key: 'End' })
    expect(readout('Campioni N')).toBe('5000')
    fireEvent.keyDown(slider, { key: 'Home' })
    expect(readout('Campioni N')).toBe('1')
  })

  it('le maniglie a e b si muovono da tastiera e la sfida si vince con P = 0.50', () => {
    render(<CampioniPdf />)
    fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()

    const a = screen.getByRole('slider', { name: 'Estremo a' })
    const b = screen.getByRole('slider', { name: 'Estremo b' })
    // un evento alla volta, ognuno con il suo render: come i tasti veri
    for (let i = 0; i < 8; i++) fireEvent.keyDown(a, { key: 'ArrowRight' })
    for (let i = 0; i < 5; i++) fireEvent.keyDown(b, { key: 'ArrowLeft' })
    expect(a).toHaveAttribute('aria-valuenow', '2.4')
    expect(b).toHaveAttribute('aria-valuenow', '3.75')
    fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges[meta.id]).toBeDefined()
  })

  it('a non supera mai b', () => {
    render(<CampioniPdf />)
    const a = screen.getByRole('slider', { name: 'Estremo a' })
    for (let i = 0; i < 20; i++) fireEvent.keyDown(a, { key: 'ArrowRight', shiftKey: true })
    expect(Number(a.getAttribute('aria-valuenow'))).toBeCloseTo(3.95, 10)
  })

  it('cambiare pdf nascosta richiude il sipario e riparte da zero', () => {
    render(<CampioniPdf />)
    stepForward()
    stepForward()
    stepForward()
    expect(readout('Campioni N')).toBe('200')
    fireEvent.click(screen.getByRole('radio', { name: 'Bimodale' }))
    expect(readout('Campioni N')).toBe('0')
    expect(screen.getByRole('switch', { name: 'Alza il sipario' })).not.toBeChecked()
  })

  it('la tua ipotesi: 11 punti da tastiera, area da rinormalizzare, confronto con la stima a sipario alzato', () => {
    render(<CampioniPdf />)
    expect(screen.queryByRole('slider', { name: 'Ipotesi in x = 3' })).toBeNull()
    fireEvent.click(screen.getByRole('switch', { name: 'Disegna la tua ipotesi' }))
    expect(screen.getAllByRole('slider', { name: /^Ipotesi in x = / })).toHaveLength(11)
    expect(readout('Area della tua curva')).toBe('1.00')

    const peak = screen.getByRole('slider', { name: 'Ipotesi in x = 3' })
    for (let i = 0; i < 3; i++) fireEvent.keyDown(peak, { key: 'ArrowUp', shiftKey: true })
    expect(peak).toHaveAttribute('aria-valuenow', '0.4')
    // il punto in x = 3 è salito di 0.3: la spezzata guadagna 0.3 · 1 di area
    expect(readout('Area della tua curva')).toBe('1.30')
    expect(readout('ISE della tua ipotesi')).toBe('nascosto')

    fireEvent.click(screen.getByRole('button', { name: 'Rinormalizza ad area 1' }))
    expect(readout('Area della tua curva')).toBe('1.00')
    expect(screen.getByRole('button', { name: 'Rinormalizza ad area 1' })).toBeDisabled()

    // a sipario alzato il confronto con la stima automatica si legge in parole
    stepForward()
    stepForward()
    fireEvent.click(screen.getByRole('switch', { name: 'Alza il sipario' }))
    expect(readout('ISE della tua ipotesi')).not.toBe('nascosto')
    expect(screen.getByText(/è più vicina/)).toBeInTheDocument()
  })

  it('in riproduzione: la lettura del primo pesce scorre sulla scala con il suo valore, poi atterra', () => {
    stubMatchMedia(false)
    const frames = stubFrames()
    const { container } = render(<CampioniPdf />)
    const flying = () => container.querySelectorAll('[data-flying] circle').length
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    // passo 1 (1.4 s) e metà del passo 2 (2.6 s): la lettura è in volo e porta la luminosità del pesce
    frames.advance(1400 + 1300)
    expect(flying()).toBe(1)
    expect(container.querySelector('[data-flying] text')?.textContent).toBe('3.40')
    expect(readout('Campioni N')).toBe('0')
    frames.advance(1300)
    expect(readout('Campioni N')).toBe('1')
    expect(flying()).toBe(0)
  }, 60_000)

  it('in riproduzione: la raffica riempie X un campione alla volta fino a N, con i campioni in caduta', () => {
    stubMatchMedia(false)
    const frames = stubFrames()
    const { container } = render(<CampioniPdf />)
    const flying = () => container.querySelectorAll('[data-flying] circle').length
    // N = 5 prima della pesca: lo slider porta alla raffica e la fa partire
    const slider = screen.getByRole('slider', { name: 'Numero di campioni' })
    fireEvent.keyDown(slider, { key: 'Home' })
    for (let i = 0; i < 3; i++) fireEvent.keyDown(slider, { key: 'ArrowRight' })
    const seen: number[] = []
    let maxFlying = 0
    for (let i = 0; i < 28; i++) {
      frames.advance(100)
      seen.push(Number(readout('Campioni N')))
      maxFlying = Math.max(maxFlying, flying())
    }
    expect(seen[0]).toBe(1)
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1])
    expect(new Set(seen)).toEqual(new Set([1, 2, 3, 4, 5]))
    expect(maxFlying).toBeGreaterThan(0)
    expect(flying()).toBe(0)
  }, 60_000)

  it('Reset riporta tutto allo stato iniziale', () => {
    render(<CampioniPdf />)
    stepForward()
    stepForward()
    fireEvent.click(screen.getByRole('radio', { name: 'Gaussiana' }))
    fireEvent.click(screen.getByRole('button', { name: /Reset/ }))
    expect(readout('Campioni N')).toBe('0')
    expect(screen.getByRole('radio', { name: 'Istogramma' })).toBeChecked()
  })
})
