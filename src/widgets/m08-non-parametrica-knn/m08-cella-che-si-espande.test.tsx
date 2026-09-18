import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fixed } from '../kit/format'
import { K_DEFAULT, N_DEFAULT, X_START, buildPool, cellState, ofClass, trainingSet, voteState } from './cella-knn'
import Widget, { meta } from './m08-cella-che-si-espande.widget'

const f4 = fixed(4)
const salmoni = ofClass(trainingSet(buildPool(), N_DEFAULT), 0)

beforeEach(() => {
  // jsdom non disegna: il canvas delle mappe non ha contesto e lo strato non fa nulla
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => null) as unknown as HTMLCanvasElement['getContext'])
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const stepForward = (times: number) => {
  const next = screen.getByRole('button', { name: 'Passo avanti' })
  for (let i = 0; i < times; i++) fireEvent.click(next)
}

describe('widget m08-cella-che-si-espande', () => {
  it('rispetta il contratto: meta.id uguale al nome del file, modulo m08, scenario pesce', () => {
    expect(meta.id).toBe('m08-cella-che-si-espande')
    expect(meta.moduleId).toBe('m08-non-parametrica-knn')
    expect(meta.scenario).toBe('pesce')
    expect(meta.concepts).toEqual(expect.arrayContaining(['c37', 'c38', 'c39']))
  })

  it('parte al primo passo con il badge dei dati sintetici e la formula che conosce solo K e N', () => {
    const { container } = render(<Widget />)
    expect(screen.getByRole('heading', { name: meta.title })).toBeInTheDocument()
    expect(screen.getByText('Dati sintetici')).toBeInTheDocument()
    const formula = container.querySelector('.katex-html')
    expect(formula).not.toBeNull()
    expect(container.querySelector('[data-counter]')).toHaveTextContent(`k = 0 di K = ${K_DEFAULT}`)
    // nessuna cella prima dell'espansione
    expect(container.querySelector('[data-cell]')).toBeNull()
  })

  it('a passi: la cella si espande fino a K, poi il righello e la stima riempiono la formula', () => {
    const { container } = render(<Widget />)
    const cell = cellState(X_START, salmoni, K_DEFAULT)
    stepForward(2)
    expect(container.querySelectorAll('[data-lit]')).toHaveLength(K_DEFAULT)
    expect(container.querySelector('[data-cell]')).not.toBeNull()
    expect(container.querySelector('[data-ruler]')).not.toBeNull()
    stepForward(1)
    expect(container.querySelector('[data-spike="x"]')).not.toBeNull()
    expect(container.textContent).toContain(f4(cell.p))
    stepForward(1)
    expect(screen.getByText('Ripetuta in ogni punto: la mappa')).toBeInTheDocument()
  })

  it('"+1 vicino" accende i vicini uno alla volta, in ordine', () => {
    const { container } = render(<Widget />)
    const plus = screen.getByRole('button', { name: '+1 vicino' })
    fireEvent.click(plus)
    expect(container.querySelector('[data-counter]')).toHaveTextContent('k = 1 di K = 5')
    fireEvent.click(plus)
    fireEvent.click(plus)
    expect(container.querySelector('[data-counter]')).toHaveTextContent('k = 3 di K = 5')
    const first = cellState(X_START, salmoni, K_DEFAULT).neighbors.slice(0, 3).map((n) => n.id)
    expect([...container.querySelectorAll('[data-lit]')].map((e) => e.getAttribute('data-lit'))).toEqual(first)
  })

  it('x* si sposta da tastiera e la posizione si aggiorna', () => {
    render(<Widget />)
    const pin = screen.getByRole('slider', { name: 'Punto x* in cui stimare la densità' })
    fireEvent.keyDown(pin, { key: 'ArrowRight' })
    expect(screen.getAllByText('(17.7, 4.00)').length).toBeGreaterThan(0)
  })

  it('modalità classificatore: dopo il voto le posterior K_i/K sono nelle letture', () => {
    render(<Widget />)
    fireEvent.click(screen.getByRole('radio', { name: 'Classifica' }))
    expect(screen.getByText('Voti salmone')).toBeInTheDocument()
    stepForward(2)
    const v = voteState(X_START, trainingSet(buildPool(), N_DEFAULT), K_DEFAULT)
    expect(screen.getAllByText(v.label === 0 ? 'salmone' : 'spigola').length).toBeGreaterThan(0)
    expect(screen.getAllByText(fixed(2)(v.P1)).length).toBeGreaterThan(0)
  })

  it('sfida: con K = 5 non basta, con K = 12 i due pesci misteriosi sono classificati bene', () => {
    render(<Widget />)
    fireEvent.click(screen.getByRole('button', { name: 'Porta x* sul pesce A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
    const k = screen.getByRole('slider', { name: 'Vicini' })
    for (let i = 0; i < 7; i++) fireEvent.keyDown(k, { key: 'ArrowRight' })
    fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(screen.getByText(/Funziona ogni K da/)).toHaveTextContent('Funziona ogni K da 9 a 17')
  })

  it('previsione: le misure restano nascoste finché non si controlla', () => {
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
    const { container } = render(<Widget />)
    fireEvent.click(screen.getByRole('switch', { name: 'Prevedi prima di guardare' }))
    stepForward(3)
    expect(container.textContent).not.toContain(f4(cellState(X_START, salmoni, K_DEFAULT).p))
    const cell = cellState(X_START, salmoni, K_DEFAULT)
    const r = screen.getByRole('slider', { name: 'Il tuo raggio' })
    fireEvent.change(r, { target: { value: String(Math.ceil(cell.rK * 100) / 100) } })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Controlla la previsione' }))
    })
    const status = screen.getByText(/Previsioni giuste di fila/).closest('[role="status"]') as HTMLElement
    expect(within(status).getByText(/La tua cella contiene/)).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('il confronto disegna due carte: K = 1 e K grande', () => {
    render(<Widget />)
    fireEvent.click(screen.getByRole('switch', { name: 'Confronto K = 1 e K grande' }))
    expect(screen.getByRole('img', { name: 'Carta del confronto con K uguale a 1' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Carta del confronto con K uguale a 30' })).toBeInTheDocument()
  })

  it('in riproduzione la cella cresce fotogramma dopo fotogramma e i vicini si accendono in ordine', () => {
    // orologio dei fotogrammi a mano: ogni "fotogramma" dura 16 ms
    let queue: FrameRequestCallback[] = []
    let now = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      queue.push(cb)
      return queue.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
    const advance = (ms: number) => {
      for (let t = 0; t < ms; t += 16) {
        now += 16
        const q = queue
        queue = []
        act(() => q.forEach((cb) => cb(now)))
      }
    }
    const { container } = render(<Widget />)
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    const cell = cellState(X_START, salmoni, K_DEFAULT)
    const radius = () => Number(container.querySelector('[data-cell] circle')?.getAttribute('r') ?? 0)
    // primo passo (900 ms): ancora nessuna cella
    advance(600)
    expect(container.querySelector('[data-cell]')).toBeNull()
    // a metà dell'espansione: qualche vicino acceso, non tutti, e il raggio cresce
    advance(300 + 800)
    const lit = container.querySelectorAll('[data-lit]').length
    const r1 = radius()
    expect(r1).toBeGreaterThan(0)
    expect(lit).toBeLessThan(K_DEFAULT)
    advance(200)
    expect(radius()).toBeGreaterThan(r1)
    // i vicini accesi sono sempre i primi, in ordine di distanza
    const ids = [...container.querySelectorAll('[data-lit]')].map((e) => e.getAttribute('data-lit'))
    expect(ids).toEqual(cell.neighbors.slice(0, ids.length).map((n) => n.id))
    // fine dell'espansione: tutti e K, poi il righello
    advance(1000)
    expect(container.querySelectorAll('[data-lit]')).toHaveLength(K_DEFAULT)
    expect(container.querySelector('[data-ruler]')).not.toBeNull()
    vi.unstubAllGlobals()
  })

  it('Reset riporta tutto allo stato iniziale', () => {
    const { container } = render(<Widget />)
    fireEvent.click(screen.getByRole('radio', { name: 'Classifica' }))
    stepForward(2)
    fireEvent.click(screen.getByRole('button', { name: /Reset/ }))
    expect(screen.getByRole('radio', { name: 'Stima la densità' })).toBeChecked()
    expect(container.querySelector('[data-counter]')).toHaveTextContent(`k = 0 di K = ${K_DEFAULT}`)
  })
})
