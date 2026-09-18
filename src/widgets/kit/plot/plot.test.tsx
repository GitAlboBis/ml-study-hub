import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AreaPath } from './AreaPath'
import { Arrow } from './Arrow'
import { Axis } from './Axis'
import { Bars } from './Bars'
import { BoundaryCanvas } from './BoundaryCanvas'
import { Contours } from './Contours'
import { Dots } from './Dots'
import { FieldCanvas } from './FieldCanvas'
import { Grid } from './Grid'
import { Histogram } from './Histogram'
import { LinePath } from './LinePath'
import { Plot, usePlot, type PlotContextValue } from './Plot'
import { bandThresholds, classColor, divColors, fieldColor, packRgba, parseColor, rampLut, roleVar, sampleField, seqColors, useThemeVersion, vizColor } from './colors'
import { classMarker, classSymbolPath } from './marks'

// --- attrezzi ---

const NO_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 }

/** Legge il contesto del grafico da dentro, come fa una primitiva. */
function Probe({ onCtx }: { onCtx: (ctx: PlotContextValue) => void }) {
  onCtx(usePlot())
  return null
}

/** Token di prova: jsdom non carica tokens.css, qui bastano due temi con valori diversi. */
const SEQ_LIGHT = ['#101010', '#202020', '#303030', '#404040', '#505050', '#606060', '#707070']
const SEQ_DARK = ['#a0a0a0', '#a1a1a1', '#a2a2a2', '#a3a3a3', '#a4a4a4', '#a5a5a5', '#a6a6a6']
const DIV = ['#000001', '#000002', '#000003', '#000004', '#000005', '#000006', '#000007']
const FIELDS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']

function installTokens() {
  const css = (vars: Record<string, string>) => Object.entries(vars).map(([k, v]) => `${k}:${v};`).join('')
  const ramp = (prefix: string, colors: string[]) => Object.fromEntries(colors.map((c, i) => [`--${prefix}-${i + 1}`, c]))
  const style = document.createElement('style')
  style.dataset.test = 'tokens'
  style.textContent = `
    :root{${css({ '--viz-estimate': '#ec5258', '--viz-highlight': '#f2b632', '--viz-boundary': '#0b1d3a', ...ramp('viz-class', FIELDS), ...ramp('viz-field', FIELDS), ...ramp('viz-seq', SEQ_LIGHT), ...ramp('viz-div', DIV) })}}
    :root[data-theme='dark']{${css({ '--viz-estimate': '#ff6b7a', ...ramp('viz-seq', SEQ_DARK) })}}
  `
  document.head.append(style)
}

interface FakeCtx {
  createImageData: ReturnType<typeof vi.fn>
  putImageData: ReturnType<typeof vi.fn>
  clearRect: ReturnType<typeof vi.fn>
  beginPath: ReturnType<typeof vi.fn>
  moveTo: ReturnType<typeof vi.fn>
  lineTo: ReturnType<typeof vi.fn>
  stroke: ReturnType<typeof vi.fn>
  strokeStyle: string
  lineWidth: number
}

/** jsdom non disegna: un contesto 2D finto che ricorda che cosa gli è stato chiesto. */
function installFakeCanvas(): FakeCtx {
  const ctx: FakeCtx = {
    createImageData: vi.fn((w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) })),
    putImageData: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ctx) as unknown as HTMLCanvasElement['getContext'])
  return ctx
}

const pixel = (img: { data: Uint8ClampedArray; width: number }, px: number, py: number) => {
  const o = (py * img.width + px) * 4
  return [img.data[o], img.data[o + 1], img.data[o + 2], img.data[o + 3]]
}

function setReducedMotion(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: reduced && query.includes('reduced-motion'), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  )
}

beforeEach(() => {
  installTokens()
})

afterEach(() => {
  cleanup()
  document.head.querySelectorAll('style[data-test]').forEach((s) => s.remove())
  delete document.documentElement.dataset.theme
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// --- Plot ---

describe('Plot', () => {
  it("mappa il dominio sugli estremi dell'area interna", () => {
    let ctx: PlotContextValue | undefined
    render(
      <Plot width={400} height={300} xDomain={[0, 10]} yDomain={[-1, 1]} margin={{ top: 10, right: 20, bottom: 30, left: 40 }} ariaLabel="Prova">
        <Probe onCtx={(c) => (ctx = c)} />
      </Plot>,
    )
    expect(ctx?.innerWidth).toBe(340)
    expect(ctx?.innerHeight).toBe(260)
    expect(ctx?.x(0)).toBe(0)
    expect(ctx?.x(10)).toBe(340)
    expect(ctx?.y(-1)).toBe(260)
    expect(ctx?.y(1)).toBe(0)
  })

  it('è un SVG responsive con viewBox e nome accessibile; senza parti interattive è una immagine', () => {
    render(<Plot width={400} height={300} xDomain={[0, 1]} yDomain={[0, 1]} ariaLabel="Densità stimata" description="Curva con un solo modo" />)
    const svg = screen.getByRole('img', { name: 'Densità stimata' })
    expect(svg).toHaveAttribute('viewBox', '0 0 400 300')
    expect(svg).toHaveAttribute('width', '100%')
    expect(svg).toHaveAccessibleDescription('Curva con un solo modo')
  })

  it('completa un margine parziale con i valori predefiniti', () => {
    let ctx: PlotContextValue | undefined
    render(
      <Plot width={400} height={300} xDomain={[0, 1]} yDomain={[0, 1]} margin={{ left: 100 }} ariaLabel="Prova">
        <Probe onCtx={(c) => (ctx = c)} />
      </Plot>,
    )
    expect(ctx?.margin.left).toBe(100)
    expect(ctx?.margin.bottom).toBeGreaterThan(0)
    expect(ctx?.innerWidth).toBe(400 - 100 - (ctx?.margin.right ?? 0))
  })

  it('segue la larghezza misurata del contenitore, così il testo resta a grandezza vera', () => {
    const observers: { cb: ResizeObserverCallback }[] = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        cb: ResizeObserverCallback
        constructor(cb: ResizeObserverCallback) {
          this.cb = cb
          observers.push(this)
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 300, height: 225, left: 0, top: 0, right: 300, bottom: 225, x: 0, y: 0, toJSON: () => ({}) })
    let ctx: PlotContextValue | undefined
    render(
      <Plot width={400} height={300} xDomain={[0, 1]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova">
        <Probe onCtx={(c) => (ctx = c)} />
      </Plot>,
    )
    expect(screen.getByRole('img', { name: 'Prova' })).toHaveAttribute('viewBox', '0 0 300 225')
    expect(ctx?.x(1)).toBe(300)
    act(() => observers[0].cb([{ contentRect: { width: 200, height: 150 } } as ResizeObserverEntry], observers[0] as unknown as ResizeObserver))
    expect(screen.getByRole('img', { name: 'Prova' })).toHaveAttribute('viewBox', '0 0 200 150')
    expect(ctx?.x(1)).toBe(200)
  })

  it('usePlot fuori da un Plot spiega che cosa manca', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe onCtx={() => {}} />)).toThrow(/Plot/)
    spy.mockRestore()
  })

  it('il cursore-quota si muove da tastiera e legge le coordinate', () => {
    const onCursor = vi.fn()
    render(<Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova" cursor="x" cursorFormat={(x) => `x = ${x.toFixed(2)}`} onCursor={onCursor} />)
    // con una parte interattiva il grafico non può essere una immagine: i figli di role=img spariscono per gli screen reader
    expect(screen.getByRole('group', { name: 'Prova' })).toBeInTheDocument()
    const cursor = screen.getByRole('slider', { name: /cursore/i })
    fireEvent.focus(cursor)
    expect(cursor).toHaveAttribute('aria-valuetext', 'x = 5.00')
    fireEvent.keyDown(cursor, { key: 'ArrowRight' })
    expect(cursor).toHaveAttribute('aria-valuetext', 'x = 5.25')
    expect(onCursor).toHaveBeenLastCalledWith({ x: 5.25, y: 0.5 })
    fireEvent.keyDown(cursor, { key: 'End' })
    expect(cursor).toHaveAttribute('aria-valuetext', 'x = 10.00')
    fireEvent.blur(cursor)
    expect(onCursor).toHaveBeenLastCalledWith(null)
  })

  it('il cursore-quota segue il puntatore e mostra la lettura', () => {
    const { container } = render(<Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova" cursor="xy" />)
    const area = container.querySelector('[data-plot-area]') as SVGGElement
    fireEvent.pointerMove(area, { clientX: 100, clientY: 50 })
    const tip = container.querySelector('[data-plot-tip]')
    expect(tip).toHaveTextContent('x = 2.5')
    expect(tip).toHaveTextContent('y = 0.75')
    expect(container.querySelectorAll('[data-plot-cursor] line')).toHaveLength(2)
    fireEvent.pointerLeave(area)
    expect(container.querySelector('[data-plot-tip]')).toBeNull()
  })
})

// --- cornice: assi e reticolo ---

describe('Axis e Grid', () => {
  it('le tacche portano i valori in .num e il titolo in .label, senza maiuscole sui simboli', () => {
    const { container } = render(
      <Plot width={400} height={300} xDomain={[0, 10]} yDomain={[0, 1]} ariaLabel="Prova">
        <Axis side="bottom" ticks={[0, 5, 10]} label="luminosità" symbol="x" />
        <Axis side="left" ticks={3} format={(v) => v.toFixed(1)} />
      </Plot>,
    )
    const bottom = container.querySelector('[data-axis="bottom"]') as SVGGElement
    expect([...bottom.querySelectorAll('text.num')].map((t) => t.textContent)).toEqual(['0', '5', '10'])
    expect(bottom.querySelectorAll('line[data-tick]')).toHaveLength(3)
    expect(bottom.querySelector('.label')).toHaveTextContent('luminosità')
    expect(bottom.querySelector('[data-axis-symbol]')).toHaveTextContent('x')
    expect(bottom.querySelector('[data-axis-symbol]')).not.toHaveClass('label')
    const left = container.querySelector('[data-axis="left"]') as SVGGElement
    expect([...left.querySelectorAll('text.num')].map((t) => t.textContent)).toContain('0.5')
    // il testo non porta mai il colore di una serie
    for (const t of container.querySelectorAll('[data-axis] text')) expect(t.getAttribute('fill')).toMatch(/--text/)
  })

  it('il reticolo è fatto di linee piene, recessive, una per tacca', () => {
    const { container } = render(
      <Plot width={400} height={300} xDomain={[0, 10]} yDomain={[0, 1]} ariaLabel="Prova">
        <Grid xTicks={[2, 4, 6, 8]} yTicks={[0.5]} />
      </Plot>,
    )
    const lines = [...container.querySelectorAll('[data-grid] line')]
    expect(lines).toHaveLength(5)
    for (const l of lines) {
      expect(l).toHaveAttribute('stroke', 'var(--viz-grid)')
      expect(l).not.toHaveAttribute('stroke-dasharray')
    }
  })
})

// --- segni ---

describe('LinePath e AreaPath', () => {
  it('traccia la curva nelle coordinate del grafico con il colore del ruolo', () => {
    const { container } = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova">
        <LinePath data={[[0, 0], [5, 1], [10, 0.5]]} role="estimate" />
      </Plot>,
    )
    const path = container.querySelector('[data-line] path') as SVGPathElement
    expect(path).toHaveAttribute('d', 'M0,200L200,0L400,100')
    expect(path).toHaveAttribute('stroke', 'var(--viz-estimate)')
    expect(path).toHaveAttribute('stroke-width', '2')
    expect(path).toHaveAttribute('fill', 'none')
    expect(path).not.toHaveAttribute('stroke-dasharray')
  })

  it('la verità a terra è tratteggiata; i valori non finiti spezzano la linea', () => {
    const { container } = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova">
        <LinePath data={[[0, 0], [2, Number.NaN], [5, 1], [10, 1]]} role="truth" />
      </Plot>,
    )
    const path = container.querySelector('[data-line] path') as SVGPathElement
    expect(path).toHaveAttribute('stroke', 'var(--viz-truth)')
    expect(path).toHaveAttribute('stroke-dasharray')
    expect(path.getAttribute('d')).toBe('M0,200ZM200,0L400,0')
  })

  it('una classe colora la curva con il suo token; la linea in evidenza ha il bordino a inchiostro', () => {
    const { container } = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova">
        <LinePath data={[[0, 0], [10, 1]]} cls={1} />
        <LinePath data={[[0, 1], [10, 0]]} role="accent" />
      </Plot>,
    )
    const groups = container.querySelectorAll('[data-line]')
    expect(groups[0].querySelector('path')).toHaveAttribute('stroke', 'var(--viz-class-2)')
    const accent = groups[1].querySelectorAll('path')
    expect(accent).toHaveLength(2)
    expect(accent[1]).toHaveAttribute('stroke', 'var(--viz-highlight)')
  })

  it('con animate il tracciato si disegna con pathLength; con reduced motion è già disegnato', () => {
    setReducedMotion(false)
    const data: [number, number][] = [[0, 0], [10, 1]]
    const first = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 1]} ariaLabel="Prova">
        <LinePath data={data} animate />
      </Plot>,
    )
    expect(first.container.querySelector('[data-line] path')).toHaveAttribute('pathLength', '1')
    first.unmount()

    setReducedMotion(true)
    const second = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 1]} ariaLabel="Prova">
        <LinePath data={data} animate />
      </Plot>,
    )
    expect(second.container.querySelector('[data-line] path')).not.toHaveAttribute('pathLength')
  })

  it("l'area è una velatura chiusa sulla linea di base e si può limitare a un intervallo [a, b]", () => {
    const { container } = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova">
        <AreaPath data={[[0, 0.5], [10, 1]]} role="estimate" xRange={[2.5, 5]} />
      </Plot>,
    )
    const path = container.querySelector('[data-area] path') as SVGPathElement
    expect(path.getAttribute('d')).toBe('M0,100L400,0L400,200L0,200Z')
    expect(path).toHaveAttribute('fill', 'var(--viz-estimate)')
    expect(Number(path.getAttribute('fill-opacity'))).toBeLessThan(0.5)
    const clip = container.querySelector('[data-area] clipPath rect') as SVGRectElement
    expect(clip).toHaveAttribute('x', '100')
    expect(clip).toHaveAttribute('width', '100')
  })
})

describe('Histogram e Bars', () => {
  const values = [0.5, 1, 1.5, 2.5, 3, 4.5, 5, 6.5, 8, 9.5]

  it('con 10 valori e 5 bin disegna 5 rettangoli alti quanto i conteggi', () => {
    const { container } = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 4]} margin={NO_MARGIN} ariaLabel="Prova">
        <Histogram values={values} bins={5} />
      </Plot>,
    )
    const rects = [...container.querySelectorAll('rect[data-bin]')]
    expect(rects).toHaveLength(5)
    // bin [0, 2): 0.5, 1, 1.5 -> 3 su un asse 0-4 alto 200 px
    expect(Number(rects[0].getAttribute('height'))).toBeCloseTo(150, 6)
    expect(Number(rects[0].getAttribute('y'))).toBeCloseTo(50, 6)
    // tra due barre che si toccano resta un varco di superficie: niente bordi attorno ai segni
    const w = Number(rects[0].getAttribute('width'))
    expect(w).toBeGreaterThan(70)
    expect(w).toBeLessThan(80)
    for (const r of rects) expect(r).not.toHaveAttribute('stroke')
  })

  it('normalizzato è una densità: altezza = K / (N · larghezza)', () => {
    const { container } = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 0.2]} margin={NO_MARGIN} ariaLabel="Prova">
        <Histogram values={values} bins={5} normalize />
      </Plot>,
    )
    const rects = [...container.querySelectorAll('rect[data-bin]')]
    // 3 / (10 · 2) = 0.15 su un asse 0-0.2 alto 200 px
    expect(Number(rects[0].getAttribute('height'))).toBeCloseTo(150, 6)
  })

  it('al passaggio del puntatore un bin dice intervallo e conteggio', () => {
    const { container } = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 4]} margin={NO_MARGIN} ariaLabel="Prova">
        <Histogram values={values} bins={5} />
      </Plot>,
    )
    fireEvent.pointerEnter(container.querySelector('[data-bin-hit]') as Element)
    expect(container.querySelector('[data-plot-tip]')).toHaveTextContent('3')
    expect(container.querySelector('[data-plot-tip]')).toHaveTextContent('[0, 2)')
  })

  it('le barre partono dalla linea dello zero, sottili, e i valori negativi scendono', () => {
    const { container } = render(
      <Plot width={400} height={200} xDomain={[-0.5, 1.5]} yDomain={[-1, 1]} margin={NO_MARGIN} ariaLabel="Prova">
        <Bars data={[{ x: 0, value: 0.5, cls: 0, label: 'salmone' }, { x: 1, value: -0.5, cls: 1, label: 'spigola' }]} showValues />
      </Plot>,
    )
    const rects = [...container.querySelectorAll('rect[data-bar]')]
    expect(rects).toHaveLength(2)
    expect(Number(rects[0].getAttribute('y'))).toBeCloseTo(50, 6)
    expect(Number(rects[0].getAttribute('height'))).toBeCloseTo(50, 6)
    expect(Number(rects[1].getAttribute('y'))).toBeCloseTo(100, 6)
    expect(Number(rects[1].getAttribute('height'))).toBeCloseTo(50, 6)
    expect(Number(rects[0].getAttribute('width'))).toBeLessThanOrEqual(24)
    expect(rects[0]).toHaveAttribute('fill', 'var(--viz-class-1)')
    expect(rects[1]).toHaveAttribute('fill', 'var(--viz-class-2)')
    const labels = [...container.querySelectorAll('[data-bars] text')]
    expect(labels.map((t) => t.textContent)).toEqual(['0.5', '−0.5'])
    for (const t of labels) expect(t.getAttribute('fill')).toMatch(/--text/)
  })
})

describe('Dots', () => {
  it('la classe dà colore e forma insieme, con un anello di superficie attorno al segno', () => {
    const { container } = render(
      <Plot width={400} height={300} xDomain={[0, 10]} yDomain={[0, 10]} margin={NO_MARGIN} ariaLabel="Prova">
        <Dots data={[{ x: 1, y: 1, cls: 0 }, { x: 2, y: 2, cls: 2 }, { x: 3, y: 3 }]} r={5} />
      </Plot>,
    )
    const marks = [...container.querySelectorAll('[data-dot] path[data-mark]')]
    expect(marks).toHaveLength(3)
    expect(marks[0]).toHaveAttribute('fill', 'var(--viz-class-1)')
    expect(marks[1]).toHaveAttribute('fill', 'var(--viz-class-3)')
    expect(marks[1]).toHaveAttribute('d', classSymbolPath(2, Math.PI * 25))
    expect(marks[2]).toHaveAttribute('fill', 'var(--viz-sample)')
    for (const m of marks) expect(m).toHaveAttribute('stroke', 'var(--surface)')
    expect(container.querySelector('[data-dot]')).toHaveAttribute('transform', 'translate(40,270)')
    // i punti fermi non sono tappe di tabulazione
    expect(screen.queryAllByRole('slider')).toHaveLength(0)
    expect(screen.getByRole('img', { name: 'Prova' })).toBeInTheDocument()
  })

  it('trascinabile: chiama onDrag con coordinate nel dominio, senza far saltare il punto sotto il dito', () => {
    const onDrag = vi.fn()
    render(
      <Plot width={440} height={310} xDomain={[0, 10]} yDomain={[0, 10]} margin={{ top: 10, right: 0, bottom: 0, left: 40 }} ariaLabel="Prova">
        <Dots data={[{ id: 'q', x: 5, y: 5, label: 'pesce misterioso' }]} draggable onDrag={onDrag} />
      </Plot>,
    )
    const handle = screen.getByRole('slider', { name: 'pesce misterioso' })
    // il punto è a (240, 160) sullo schermo: lo si afferra 4 px più a destra e 3 più in basso
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 244, clientY: 163 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 344, clientY: 88 })
    expect(onDrag).toHaveBeenLastCalledWith('q', 7.5, 7.5)
    // oltre il bordo resta nel dominio
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 2000, clientY: -500 })
    expect(onDrag).toHaveBeenLastCalledWith('q', 10, 10)
    fireEvent.pointerUp(handle, { pointerId: 1 })
    onDrag.mockClear()
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100, clientY: 100 })
    expect(onDrag).not.toHaveBeenCalled()
  })

  it('trascinabile da tastiera: frecce con passo, Maiusc per il passo lungo, Inizio e Fine', () => {
    const onDrag = vi.fn()
    render(
      <Plot width={400} height={300} xDomain={[0, 10]} yDomain={[0, 10]} ariaLabel="Prova">
        <Dots data={[{ id: 'q', x: 5, y: 5 }, { id: 'bordo', x: 10, y: 5 }]} draggable onDrag={onDrag} step={0.5} />
      </Plot>,
    )
    expect(screen.getByRole('group', { name: 'Prova' })).toBeInTheDocument()
    const [handle, edge] = screen.getAllByRole('slider')
    expect(handle).toHaveAttribute('tabindex', '0')
    expect(handle).toHaveAttribute('aria-valuetext', 'x = 5, y = 5')
    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(onDrag).toHaveBeenLastCalledWith('q', 5.5, 5)
    fireEvent.keyDown(handle, { key: 'ArrowUp' })
    expect(onDrag).toHaveBeenLastCalledWith('q', 5, 5.5)
    fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true })
    expect(onDrag).toHaveBeenLastCalledWith('q', 0, 5)
    fireEvent.keyDown(handle, { key: 'End' })
    expect(onDrag).toHaveBeenLastCalledWith('q', 10, 5)
    onDrag.mockClear()
    fireEvent.keyDown(edge, { key: 'ArrowRight' })
    expect(onDrag).not.toHaveBeenCalled()
    fireEvent.keyDown(handle, { key: 'a' })
    expect(onDrag).not.toHaveBeenCalled()
  })

  it('un punto fuori dal dominio non si disegna; tolti i punti trascinabili il grafico torna una immagine', () => {
    const tree = (draggable: boolean) => (
      <Plot width={400} height={300} xDomain={[0, 10]} yDomain={[0, 10]} ariaLabel="Prova">
        <Dots data={[{ x: 5, y: 5 }, { x: 11, y: 5 }, { x: 5, y: Number.NaN }]} draggable={draggable} />
      </Plot>
    )
    const { container, rerender } = render(tree(true))
    expect(container.querySelectorAll('[data-dot]')).toHaveLength(1)
    expect(screen.getByRole('group', { name: 'Prova' })).toBeInTheDocument()
    rerender(tree(false))
    expect(screen.getByRole('img', { name: 'Prova' })).toBeInTheDocument()
  })

  it('i punti accesi portano un alone ocra; al passaggio il punto dice coordinate e classe', () => {
    const { container } = render(
      <Plot width={400} height={300} xDomain={[0, 10]} yDomain={[0, 10]} margin={NO_MARGIN} ariaLabel="Prova">
        <Dots data={[{ id: 'a', x: 2, y: 4, cls: 1 }, { id: 'b', x: 6, y: 6, cls: 0 }]} highlight={['b']} />
      </Plot>,
    )
    expect(container.querySelectorAll('[data-halo]')).toHaveLength(1)
    expect(container.querySelector('[data-dot="b"] [data-halo]')).toHaveAttribute('fill', 'var(--viz-highlight)')
    fireEvent.pointerEnter(container.querySelector('[data-dot="a"]') as Element)
    const tip = container.querySelector('[data-plot-tip]')
    expect(tip).toHaveTextContent('x = 2, y = 4')
    expect(tip).toHaveTextContent('classe 2 · quadrato')
    fireEvent.pointerLeave(container.querySelector('[data-dot="a"]') as Element)
    expect(container.querySelector('[data-plot-tip]')).toBeNull()
  })

  it('vincolato a un asse, ogni freccia muove lungo quello', () => {
    const onDrag = vi.fn()
    render(
      <Plot width={400} height={300} xDomain={[0, 10]} yDomain={[0, 10]} margin={NO_MARGIN} ariaLabel="Prova">
        <Dots data={[{ id: 'a', x: 5, y: 0 }]} draggable axis="x" onDrag={onDrag} step={1} pin />
      </Plot>,
    )
    const handle = screen.getByRole('slider')
    fireEvent.keyDown(handle, { key: 'ArrowUp' })
    expect(onDrag).toHaveBeenLastCalledWith('a', 6, 0)
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 200, clientY: 300 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100, clientY: 20 })
    expect(onDrag).toHaveBeenLastCalledWith('a', 2.5, 0)
    // lo spillo è ocra con il contorno a inchiostro
    expect(handle.querySelector('[data-mark]')).toHaveAttribute('fill', 'var(--pin)')
  })
})

describe('Arrow', () => {
  it('disegna asta e punta nelle coordinate del grafico, con etichetta a inchiostro', () => {
    const { container } = render(
      <Plot width={400} height={400} xDomain={[0, 10]} yDomain={[0, 10]} margin={NO_MARGIN} ariaLabel="Prova">
        <Arrow from={[0, 0]} to={[10, 0]} role="boundary" label="w" />
      </Plot>,
    )
    const arrow = container.querySelector('[data-arrow]') as SVGGElement
    const shaft = arrow.querySelector('line') as SVGLineElement
    expect(shaft).toHaveAttribute('x1', '0')
    expect(shaft).toHaveAttribute('y1', '400')
    expect(Number(shaft.getAttribute('x2'))).toBeLessThan(400)
    expect(shaft).toHaveAttribute('stroke', 'var(--viz-boundary)')
    const head = arrow.querySelector('path[data-head]') as SVGPathElement
    expect(head.getAttribute('d')).toMatch(/^M400,400/)
    expect(arrow.querySelector('text')).toHaveTextContent('w')
    expect(arrow.querySelector('text')?.getAttribute('fill')).toMatch(/--text/)
  })

  it('una freccia di lunghezza nulla non disegna nulla', () => {
    const { container } = render(
      <Plot width={400} height={400} xDomain={[0, 10]} yDomain={[0, 10]} ariaLabel="Prova">
        <Arrow from={[1, 1]} to={[1, 1]} />
      </Plot>,
    )
    expect(container.querySelector('[data-arrow]')).toBeNull()
  })
})

// --- colori ---

describe('colors', () => {
  it('legge i token dalle variabili CSS', () => {
    expect(vizColor('estimate')).toBe('#ec5258')
    expect(vizColor('accent')).toBe('#f2b632')
    expect(classColor(1)).toBe(FIELDS[1])
    expect(classColor(7)).toBe(FIELDS[1])
    expect(fieldColor(0)).toBe(FIELDS[0])
    expect(seqColors()).toEqual(SEQ_LIGHT)
    expect(divColors()).toEqual(DIV)
    expect(roleVar('truth')).toBe('var(--viz-truth)')
    expect(roleVar('accent')).toBe('var(--viz-highlight)')
  })

  it('al cambio di data-theme i colori letti cambiano e useThemeVersion fa ridisegnare', async () => {
    const seen: number[] = []
    function Watcher() {
      const v = useThemeVersion()
      seen.push(v)
      return <output>{vizColor('estimate')}</output>
    }
    render(<Watcher />)
    expect(screen.getByRole('status')).toHaveTextContent('#ec5258')
    document.documentElement.dataset.theme = 'dark'
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('#ff6b7a'))
    expect(seqColors()).toEqual(SEQ_DARK)
    expect(seen.at(-1)).toBeGreaterThan(seen[0])
  })

  it("l'osservatore del tema è uno solo e si spegne con l'ultimo iscritto", () => {
    const observe = vi.spyOn(MutationObserver.prototype, 'observe')
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
    function Watcher() {
      return <output>{useThemeVersion()}</output>
    }
    const a = render(<Watcher />)
    const b = render(<Watcher />)
    expect(observe).toHaveBeenCalledTimes(1)
    a.unmount()
    expect(disconnect).not.toHaveBeenCalled()
    b.unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it('rampLut: a bande un colore pieno per passo, con smooth una sfumatura tra i passi', () => {
    const bands = rampLut(['#000000', '#ffffff'])
    expect(bands[0]).toBe(packRgba([0, 0, 0, 255]))
    expect(bands[bands.length / 2 - 1]).toBe(packRgba([0, 0, 0, 255]))
    expect(bands[bands.length / 2]).toBe(packRgba([255, 255, 255, 255]))
    const smooth = rampLut(['#000000', '#ffffff'], true)
    expect(smooth[0]).toBe(packRgba([0, 0, 0, 255]))
    expect(smooth[smooth.length - 1]).toBe(packRgba([255, 255, 255, 255]))
    const mid = new Uint8Array(new Uint32Array([smooth[Math.floor(smooth.length / 2)]]).buffer)
    expect(mid[0]).toBeGreaterThan(100)
    expect(mid[0]).toBeLessThan(160)
  })

  it('parseColor capisce esadecimali e rgb(); ciò che non capisce è trasparente', () => {
    expect(parseColor('#ec5258')).toEqual([236, 82, 88, 255])
    expect(parseColor(' rgb(1, 2, 3) ')).toEqual([1, 2, 3, 255])
    expect(parseColor('')).toEqual([0, 0, 0, 0])
  })

  it('sampleField valuta la funzione al centro delle celle, prima riga in alto', () => {
    const grid = sampleField((x, y) => x + 10 * y, [0, 4], [0, 2], 4, 2)
    expect([...grid.values]).toEqual([15.5, 16.5, 17.5, 18.5, 5.5, 6.5, 7.5, 8.5])
    expect(grid.min).toBe(5.5)
    expect(grid.max).toBe(18.5)
  })

  it('bandThresholds dà i confini interni delle bande', () => {
    expect(bandThresholds(0, 7, 7)).toEqual([1, 2, 3, 4, 5, 6])
  })
})

// --- canvas ---

describe('FieldCanvas', () => {
  const field = (x: number) => x

  it('dipinge il campo a bande con la rampa sequenziale, nitido alla densità dello schermo', () => {
    const ctx = installFakeCanvas()
    vi.stubGlobal('devicePixelRatio', 2)
    const { container } = render(
      <Plot width={280} height={140} xDomain={[0, 7]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova">
        <FieldCanvas fn={field} resolution={70} />
      </Plot>,
    )
    const canvas = container.querySelector('canvas') as HTMLCanvasElement
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
    expect(canvas.width).toBe(560)
    expect(canvas.height).toBe(280)
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
    const img = ctx.putImageData.mock.calls[0][0] as { data: Uint8ClampedArray; width: number }
    expect(pixel(img, 2, 10)).toEqual([0x10, 0x10, 0x10, 255])
    expect(pixel(img, 280, 10)).toEqual([0x40, 0x40, 0x40, 255])
    expect(pixel(img, 557, 10)).toEqual([0x70, 0x70, 0x70, 255])
  })

  it('ridisegna solo quando cambiano dati, dimensioni o tema', async () => {
    const ctx = installFakeCanvas()
    const tree = (fn: (x: number, y: number) => number, note: string) => (
      <Plot width={280} height={140} xDomain={[0, 7]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel={note}>
        <FieldCanvas fn={fn} resolution={14} />
      </Plot>
    )
    const { rerender } = render(tree(field, 'uno'))
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
    rerender(tree(field, 'due'))
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
    rerender(tree((x) => -x, 'due'))
    expect(ctx.putImageData).toHaveBeenCalledTimes(2)
    document.documentElement.dataset.theme = 'dark'
    await waitFor(() => expect(ctx.putImageData).toHaveBeenCalledTimes(3))
    const img = ctx.putImageData.mock.calls[2][0] as { data: Uint8ClampedArray; width: number }
    expect(pixel(img, 279, 5)).toEqual([0xa0, 0xa0, 0xa0, 255])
  })

  it('dove il campo non è finito si vede la carta; un campo piatto prende il primo passo della rampa', () => {
    const ctx = installFakeCanvas()
    const holed = (x: number) => (x < 3.5 ? Number.NaN : 1)
    render(
      <Plot width={280} height={140} xDomain={[0, 7]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova">
        <FieldCanvas fn={holed} resolution={14} />
      </Plot>,
    )
    const img = ctx.putImageData.mock.calls[0][0] as { data: Uint8ClampedArray; width: number }
    expect(pixel(img, 10, 5)).toEqual([0, 0, 0, 0])
    expect(pixel(img, 270, 5)).toEqual([0x10, 0x10, 0x10, 255])
  })

  it('con un dominio proprio copre solo quel rettangolo del grafico', () => {
    installFakeCanvas()
    const { container } = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 10]} margin={NO_MARGIN} ariaLabel="Prova">
        <FieldCanvas fn={field} xDomain={[5, 10]} yDomain={[5, 10]} resolution={10} />
      </Plot>,
    )
    const canvas = container.querySelector('canvas') as HTMLCanvasElement
    expect(canvas.style.left).toBe('50%')
    expect(canvas.style.top).toBe('0%')
    expect(canvas.style.width).toBe('50%')
    expect(canvas.style.height).toBe('50%')
    expect(canvas.width).toBe(200)
    expect(canvas.height).toBe(100)
  })

  it('la rampa divergente è simmetrica attorno allo zero', () => {
    const ctx = installFakeCanvas()
    render(
      <Plot width={280} height={140} xDomain={[-1, 3]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova">
        <FieldCanvas fn={field} resolution={70} colormap="diverging" />
      </Plot>,
    )
    const img = ctx.putImageData.mock.calls[0][0] as { data: Uint8ClampedArray; width: number }
    // x = 0 cade a un quarto della larghezza: lì c'è il grigio neutro, la banda centrale
    expect(pixel(img, 70, 5)).toEqual([0, 0, 4, 255])
    expect(pixel(img, 279, 5)).toEqual([0, 0, 7, 255])
  })
})

describe('BoundaryCanvas', () => {
  it('riempie le regioni con i campi delle classi e ripassa il confine a inchiostro', () => {
    const ctx = installFakeCanvas()
    render(
      <Plot width={200} height={100} xDomain={[0, 10]} yDomain={[0, 5]} margin={NO_MARGIN} ariaLabel="Prova">
        <BoundaryCanvas classify={(x) => (x < 5 ? 0 : 2)} resolution={20} />
      </Plot>,
    )
    const img = ctx.putImageData.mock.calls[0][0] as { data: Uint8ClampedArray; width: number }
    expect(pixel(img, 10, 50)).toEqual([255, 0, 0, 255])
    expect(pixel(img, 190, 50)).toEqual([0, 0, 255, 255])
    expect(ctx.stroke).toHaveBeenCalledTimes(1)
    expect(ctx.strokeStyle).toBe('#0b1d3a')
    // il confine è la verticale x = 5, cioè 100 px
    expect(ctx.moveTo.mock.calls.every(([px]) => px === 100)).toBe(true)
    expect(ctx.moveTo.mock.calls.length).toBeGreaterThan(0)
  })

  it('una classe non valida lascia vedere la carta', () => {
    const ctx = installFakeCanvas()
    render(
      <Plot width={200} height={100} xDomain={[0, 10]} yDomain={[0, 5]} margin={NO_MARGIN} ariaLabel="Prova">
        <BoundaryCanvas classify={() => -1} resolution={10} outline={false} />
      </Plot>,
    )
    const img = ctx.putImageData.mock.calls[0][0] as { data: Uint8ClampedArray; width: number }
    expect(pixel(img, 50, 50)).toEqual([0, 0, 0, 0])
    expect(ctx.stroke).not.toHaveBeenCalled()
  })
})

describe('Contours', () => {
  it("un'isolinea per soglia, sottile e senza riempimento, nelle coordinate del grafico", () => {
    const { container } = render(
      <Plot width={400} height={400} xDomain={[-2, 2]} yDomain={[-2, 2]} margin={NO_MARGIN} ariaLabel="Prova">
        <Contours fn={(x, y) => x * x + y * y} thresholds={[1, 2.25]} resolution={80} />
      </Plot>,
    )
    const paths = [...container.querySelectorAll('[data-contours] path')]
    expect(paths).toHaveLength(2)
    for (const p of paths) {
      expect(p).toHaveAttribute('fill', 'none')
      expect(Number(p.getAttribute('stroke-width'))).toBeLessThanOrEqual(1)
    }
    // x² + y² = 1 è un cerchio di raggio 1: nel grafico va da 100 a 300 px
    const xs = [...(paths[0].getAttribute('d') ?? '').matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map((m) => Number(m[1]))
    expect(Math.min(...xs)).toBeGreaterThan(95)
    expect(Math.min(...xs)).toBeLessThan(105)
    expect(Math.max(...xs)).toBeGreaterThan(295)
    expect(Math.max(...xs)).toBeLessThan(305)
  })

  it('senza soglie esplicite usa i confini delle bande del campo', () => {
    const { container } = render(
      <Plot width={400} height={400} xDomain={[-2, 2]} yDomain={[-2, 2]} ariaLabel="Prova">
        <Contours fn={(x, y) => x * x + y * y} />
      </Plot>,
    )
    expect(container.querySelectorAll('[data-contours] path')).toHaveLength(6)
  })
})

// ---------------------------------------------------------------------------------------------
// Regressioni della revisione del kit (2026-09-18)
// ---------------------------------------------------------------------------------------------

describe('identità di classe mai solo con il colore, anche fuori dai Dots', () => {
  const marksIn = (root: ParentNode, selector: string) => [...root.querySelectorAll(`${selector} [data-class-mark]`)]

  it('una curva per classe porta il marcatore della sua classe sul suo punto più alto', () => {
    const { container } = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova">
        <LinePath data={[[0, 0], [5, 0.8], [10, 0]]} cls={1} />
        <LinePath data={[[0, 0], [3, 0.5], [10, 0]]} cls={4} />
        <LinePath data={[[0, 1], [10, 0]]} role="estimate" />
      </Plot>,
    )
    const marks = marksIn(container, '[data-line]')
    expect(marks).toHaveLength(2)
    expect(marks[0]).toHaveAttribute('d', classMarker(1).d)
    expect(marks[1]).toHaveAttribute('d', classMarker(4).d)
    expect(marks[0].getAttribute('d')).not.toBe(marks[1].getAttribute('d'))
    expect(marks[0]).toHaveAttribute('fill', 'var(--viz-class-2)')
    expect(marks[0]).toHaveAttribute('stroke', 'var(--surface)')
    // sul picco: x = 5 → 200 px, y = 0.8 → 40 px
    expect(marks[0].closest('[transform]')).toHaveAttribute('transform', 'translate(200,40)')
  })

  it('aree, frecce, barre e istogrammi per classe portano la forma della classe', () => {
    const { container } = render(
      <Plot width={400} height={200} xDomain={[-0.5, 9.5]} yDomain={[0, 4]} margin={NO_MARGIN} ariaLabel="Prova">
        <AreaPath data={[[0, 0], [5, 2], [9, 0]]} cls={1} />
        <Arrow from={[0, 1]} to={[4, 3]} cls={4} />
        <Bars data={[{ x: 0, value: 1, cls: 1 }, { x: 1, value: 2, cls: 4 }]} />
        <Histogram values={[1, 1.5, 2, 6]} bins={4} domain={[0, 8]} cls={4} />
      </Plot>,
    )
    expect(marksIn(container, '[data-area]').map((m) => m.getAttribute('d'))).toEqual([classMarker(1).d])
    expect(marksIn(container, '[data-arrow]').map((m) => m.getAttribute('d'))).toEqual([classMarker(4).d])
    expect(marksIn(container, '[data-bars]').map((m) => m.getAttribute('d'))).toEqual([classMarker(1).d, classMarker(4).d])
    expect(marksIn(container, '[data-histogram]').map((m) => m.getAttribute('d'))).toEqual([classMarker(4).d])
    // senza classe nessun marcatore: il ruolo ha già il suo segno
    const plain = render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 4]} margin={NO_MARGIN} ariaLabel="Senza classe">
        <Bars data={[{ x: 1, value: 1 }]} />
        <Histogram values={[1, 2]} bins={2} />
      </Plot>,
    )
    expect(plain.container.querySelectorAll('[data-class-mark]')).toHaveLength(0)
  })
})

describe('letture dei segni raggiungibili senza il puntatore', () => {
  it('con il cursore-quota la lettura si aggancia al punto più vicino e ne dice nome e classe', () => {
    render(
      <Plot width={400} height={400} xDomain={[0, 4]} yDomain={[0, 8]} margin={NO_MARGIN} ariaLabel="Prova" cursor="xy">
        <Dots data={[{ x: 2, y: 4, label: 'salmone 1', cls: 0 }, { x: 0.5, y: 1, cls: 1 }]} />
      </Plot>,
    )
    const cursor = screen.getByRole('slider', { name: /cursore/i })
    fireEvent.focus(cursor)
    expect(cursor.getAttribute('aria-valuetext')).toMatch(/salmone 1/)
    expect(document.querySelector('[data-plot-tip]')).toHaveTextContent('salmone 1')
    fireEvent.keyDown(cursor, { key: 'Home' })
    expect(cursor.getAttribute('aria-valuetext')).not.toMatch(/salmone/)
  })

  it('con il cursore x Bars e Histogram leggono la barra o il bin che stanno sotto', () => {
    const bars = render(
      <Plot width={400} height={200} xDomain={[-0.5, 1.5]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Barre" cursor="x">
        <Bars data={[{ x: 0, value: 0.25, label: 'salmone' }, { x: 1, value: 0.75, label: 'spigola' }]} />
      </Plot>,
    )
    const c1 = screen.getByRole('slider', { name: /cursore/i })
    fireEvent.focus(c1)
    fireEvent.keyDown(c1, { key: 'End' })
    expect(c1.getAttribute('aria-valuetext')).toMatch(/spigola/)
    expect(c1.getAttribute('aria-valuetext')).toMatch(/0\.75/)
    bars.unmount()

    render(
      <Plot width={400} height={200} xDomain={[0, 10]} yDomain={[0, 4]} margin={NO_MARGIN} ariaLabel="Istogramma" cursor="x">
        <Histogram values={[0.5, 1, 1.5, 2.5, 3, 4.5, 5, 6.5, 8, 9.5]} bins={5} />
      </Plot>,
    )
    const c2 = screen.getByRole('slider', { name: /cursore/i })
    fireEvent.focus(c2)
    fireEvent.keyDown(c2, { key: 'Home' })
    expect(c2.getAttribute('aria-valuetext')).toMatch(/\[0, 2\)/)
    expect(c2.getAttribute('aria-valuetext')).toMatch(/K = 3/)
  })

  it('un grafico statico con punti che hanno un nome li elenca nella sua descrizione', () => {
    render(
      <Plot width={400} height={300} xDomain={[0, 10]} yDomain={[0, 10]} ariaLabel="Prova">
        <Dots data={[{ x: 2, y: 4, label: 'salmone 1' }, { x: 3, y: 3 }]} />
      </Plot>,
    )
    const svg = screen.getByRole('img', { name: 'Prova' })
    expect(svg).toHaveAccessibleDescription(/salmone 1/)
  })
})

describe('Contours animate', () => {
  it('al cambio del campo le isolinee restano montate: cambia solo il tracciato, niente ritracciamento da zero', () => {
    setReducedMotion(false)
    const bump = (h: number) => (x: number, y: number) => Math.exp(-(x * x + y * y) / (2 * h * h))
    const tree = (fn: (x: number, y: number) => number) => (
      <Plot width={400} height={400} xDomain={[-2, 2]} yDomain={[-2, 2]} margin={NO_MARGIN} ariaLabel="Prova">
        <Contours fn={fn} animate />
      </Plot>
    )
    const { container, rerender } = render(tree(bump(0.5)))
    const before = [...container.querySelectorAll('[data-contours] path')]
    expect(before.length).toBeGreaterThan(0)
    rerender(tree(bump(0.55)))
    const after = [...container.querySelectorAll('[data-contours] path')]
    expect(after).toHaveLength(before.length)
    after.forEach((p, i) => expect(p).toBe(before[i]))
  })
})

describe('campi su canvas: costo per fotogramma', () => {
  it('FieldCanvas e Contours sullo stesso campo lo valutano una volta sola', () => {
    installFakeCanvas()
    const fn = vi.fn((x: number, y: number) => x * x + y * y)
    render(
      <Plot width={400} height={400} xDomain={[-2, 2]} yDomain={[-2, 2]} margin={NO_MARGIN} ariaLabel="Prova">
        <FieldCanvas fn={fn} resolution={32} />
        <Contours fn={fn} resolution={32} />
      </Plot>,
    )
    expect(fn).toHaveBeenCalledTimes(32 * 32)
  })

  it("riusa l'ImageData e la tabella dei colori da un disegno all'altro", () => {
    const ctx = installFakeCanvas()
    const tree = (fn: (x: number, y: number) => number) => (
      <Plot width={280} height={140} xDomain={[0, 7]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova">
        <FieldCanvas fn={fn} resolution={14} />
      </Plot>
    )
    const { rerender } = render(tree((x) => x))
    expect(ctx.createImageData).toHaveBeenCalledTimes(1)
    const style = vi.spyOn(globalThis, 'getComputedStyle')
    rerender(tree((x) => -x))
    expect(ctx.putImageData).toHaveBeenCalledTimes(2)
    expect(ctx.createImageData).toHaveBeenCalledTimes(1)
    expect(style).not.toHaveBeenCalled()
  })

  it('ridisegni ravvicinati di un campo grande usano meno pixel, e a riposo torna la piena densità', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      installFakeCanvas()
      vi.stubGlobal('devicePixelRatio', 2)
      let now = 0
      vi.spyOn(performance, 'now').mockImplementation(() => now)
      const fns = [(x: number) => x, (x: number) => 2 * x, (x: number) => 3 * x]
      const tree = (k: number) => (
        <Plot width={800} height={500} xDomain={[0, 1]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova">
          <FieldCanvas fn={fns[k]} resolution={16} />
        </Plot>
      )
      const { container, rerender } = render(tree(0))
      const canvas = container.querySelector('canvas') as HTMLCanvasElement
      expect(canvas.width).toBe(1600)
      // un cambio isolato (un passo da tastiera) resta a piena densità
      now = 1000
      rerender(tree(1))
      expect(canvas.width).toBe(1600)
      // il secondo cambio a 30 ms dal primo è un trascinamento: meno pixel
      now = 1030
      rerender(tree(2))
      expect(canvas.width).toBeLessThan(1600)
      expect(canvas.width * canvas.height).toBeLessThanOrEqual(600_000)
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(canvas.width).toBe(1600)
      expect(canvas.height).toBe(1000)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('Plot: cartiglio', () => {
  it('si sposta con transform, senza riscrivere left e top a ogni mossa del puntatore', () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    const box = { width: 400, height: 300, left: 0, top: 0, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) }
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(box)
    vi.spyOn(SVGElement.prototype, 'getBoundingClientRect').mockReturnValue(box)
    const { container } = render(<Plot width={400} height={300} xDomain={[0, 10]} yDomain={[0, 1]} margin={NO_MARGIN} ariaLabel="Prova" cursor="xy" />)
    const area = container.querySelector('[data-plot-area]') as SVGGElement
    fireEvent.pointerMove(area, { clientX: 50, clientY: 150 })
    const tip = container.querySelector('[data-plot-tip]') as HTMLElement
    const { left, top } = tip.style
    fireEvent.pointerMove(area, { clientX: 120, clientY: 150 })
    fireEvent.pointerMove(area, { clientX: 200, clientY: 150 })
    expect(container.querySelector('[data-plot-tip]')).toBe(tip)
    expect(tip.style.left).toBe(left)
    expect(tip.style.top).toBe(top)
    expect(tip.style.transform).toMatch(/translate\(200px, 150px\)/)
  })
})
