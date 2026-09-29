// Test dei segni comuni: Stem, Violin, Ribbon, Sketch, Flight e MatrixGrid.
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { classSymbolPath } from '../../kit/plot/marks'
import { Plot } from '../../kit/plot/Plot'
import { FlightAnchor, FlightBox, FlightLayer, FlightMarks } from './Flight'
import { MatrixGrid } from './MatrixGrid'
import { Ribbon } from './Ribbon'
import { Sketch } from './Sketch'
import { sketchStart, sketchXs } from './sketchScore'
import { Stem } from './Stem'
import { Violin } from './Violin'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const ML = 56
const MT = 24
const IW = 648
const IH = 416

function Frame({ children, cursor }: { children: React.ReactNode; cursor?: 'x' | 'xy' }) {
  return (
    <Plot width={720} height={480} xDomain={[0, 10]} yDomain={[0, 1]} ariaLabel="Terreno di prova" cursor={cursor}>
      {children}
    </Plot>
  )
}

describe('Stem', () => {
  const data = [0, 1, 2, 3, 4].map((n) => ({ x: n * 2, y: 0.1 + n * 0.2, id: `s${n}`, label: `campione n = ${n}` }))

  it('uno stelo per campione, dalla linea di base al valore; count mostra i primi', () => {
    const { container, rerender } = render(
      <Frame>
        <Stem data={data} highlight={['s2']} />
      </Frame>,
    )
    expect(container.querySelectorAll('[data-stem]')).toHaveLength(5)
    const line = container.querySelector('[data-stems] line')!
    expect(Number(line.getAttribute('y1'))).toBeCloseTo(IH, 6)
    expect(Number(line.getAttribute('y2'))).toBeCloseTo((1 - 0.1) * IH, 1)
    expect(container.querySelector('[data-stem="s2"] [data-halo]')).not.toBeNull()
    rerender(
      <Frame>
        <Stem data={data} count={2} hollow />
      </Frame>,
    )
    expect(container.querySelectorAll('[data-stem]')).toHaveLength(2)
  })

  it('il cursore-quota legge lo stelo più vicino', () => {
    render(
      <Frame cursor="x">
        <Stem data={data} />
      </Frame>,
    )
    const cursor = screen.getByRole('slider', { name: /Cursore di lettura/ })
    fireEvent.focus(cursor)
    // Inizio porta il cursore in x = 0, dove sta il primo stelo
    fireEvent.keyDown(cursor, { key: 'Home' })
    expect(cursor.getAttribute('aria-valuetext')).toContain('campione n = 0')
  })

  it('nella descrizione di un grafico statico entrano gli steli con un nome', () => {
    vi.useFakeTimers()
    const { container } = render(
      <Frame>
        <Stem data={data.slice(0, 2)} />
      </Frame>,
    )
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(container.querySelector('desc')?.textContent).toContain('campione n = 1')
  })
})

describe('Violin', () => {
  it('sagoma chiusa, scatola dei quartili e mediana; con valori vuoti niente', () => {
    const { container, rerender } = render(
      <Frame>
        <Violin values={[0.4, 0.45, 0.5, 0.5, 0.55, 0.6]} at={5} label="N = 6" cls={2} />
      </Frame>,
    )
    const path = container.querySelector('[data-violin] path')!
    expect(path.getAttribute('d')).toMatch(/^M.*Z$/)
    expect(container.querySelector('[data-violin] rect')).not.toBeNull()
    expect(container.querySelector('[data-class-mark="2"]')).not.toBeNull()
    rerender(
      <Frame>
        <Violin values={[]} at={5} />
      </Frame>,
    )
    expect(container.querySelector('[data-violin]')).toBeNull()
  })

  it('la stessa densityMax dà la stessa scala: il violino più concentrato è più largo in cima', () => {
    const { container } = render(
      <Frame>
        <Violin values={[0.5, 0.49, 0.51, 0.5]} at={3} bandwidth={0.02} densityMax={20} box={false} />
        <Violin values={[0.2, 0.5, 0.8, 0.35, 0.65]} at={7} bandwidth={0.15} densityMax={20} box={false} />
      </Frame>,
    )
    const widths = [...container.querySelectorAll('[data-violin] path')].map((p) => {
      const xs = [...(p.getAttribute('d') ?? '').matchAll(/[ML]([\d.-]+),/g)].map((m) => Number(m[1]))
      return Math.max(...xs) - Math.min(...xs)
    })
    expect(widths[0]).toBeGreaterThan(widths[1])
  })

  it('il cursore-quota legge il violino sotto di sé', () => {
    render(
      <Frame cursor="x">
        <Violin values={[0.2, 0.4, 0.6]} at={5} label="N = 3" />
      </Frame>,
    )
    const cursor = screen.getByRole('slider', { name: /Cursore di lettura/ })
    fireEvent.focus(cursor)
    expect(cursor.getAttribute('aria-valuetext')).toContain('N = 3 · 3 valori · mediana 0.4')
  })
})

describe('Ribbon', () => {
  it('fascia fra basso e alto; con i bordi due fili in più; per classe il marcatore', () => {
    const data = [0, 2, 4, 6, 8, 10].map((x) => [x, 0.2, 0.4 + x / 50])
    const { container } = render(
      <Frame>
        <Ribbon data={data} edges cls={0} />
      </Frame>,
    )
    const paths = container.querySelectorAll('[data-ribbon] path')
    expect(paths.length).toBeGreaterThanOrEqual(3)
    expect(paths[0].getAttribute('fill-opacity')).toBe('0.16')
    expect(container.querySelector('[data-class-mark="0"]')).not.toBeNull()
  })

  it('la verità ha i bordi tratteggiati', () => {
    const { container } = render(
      <Frame>
        <Ribbon data={[[0, 0.1, 0.2], [10, 0.1, 0.3]]} edges role="truth" />
      </Frame>,
    )
    const rims = [...container.querySelectorAll('[data-ribbon] path')].slice(1)
    for (const r of rims) expect(r).toHaveAttribute('stroke-dasharray', '6 4')
  })
})

describe('Sketch', () => {
  const xs = sketchXs([0, 10], 11)

  function Live({ onValue }: { onValue: (h: readonly number[]) => void }) {
    const [h, setH] = useState<readonly number[]>(sketchStart(xs))
    return (
      <Frame>
        <Sketch
          xs={xs}
          heights={h}
          yMax={1}
          step={0.01}
          label="Disegna la pdf"
          onChange={(n) => {
            setH(n)
            onValue(n)
          }}
        />
      </Frame>
    )
  }

  it('tastiera: destra sceglie il punto, su ne alza l’altezza', () => {
    const onValue = vi.fn()
    render(<Live onValue={onValue} />)
    const canvas = screen.getByRole('slider', { name: /Disegna la pdf/ })
    expect(canvas).toHaveAttribute('aria-valuetext', 'x = 5: altezza 0.1 (punto 6 di 11)')
    fireEvent.keyDown(canvas, { key: 'ArrowRight' })
    fireEvent.keyDown(canvas, { key: 'ArrowUp', shiftKey: true })
    expect(onValue.mock.calls.at(-1)?.[0][6]).toBeCloseTo(0.2, 12)
    expect(canvas).toHaveAttribute('aria-valuetext', 'x = 6: altezza 0.2 (punto 7 di 11)')
  })

  it('il pennello dipinge i punti che attraversa, anche con un gesto veloce', () => {
    const onValue = vi.fn()
    render(<Live onValue={onValue} />)
    const canvas = screen.getByRole('slider', { name: /Disegna la pdf/ })
    const at = (x: number, y: number) => ({ clientX: ML + (x / 10) * IW, clientY: MT + (1 - y) * IH })
    fireEvent.pointerDown(canvas, { ...at(1, 0.5), button: 0, pointerId: 1 })
    fireEvent.pointerMove(canvas, { ...at(5, 0.5), pointerId: 1 })
    fireEvent.pointerUp(canvas, { pointerId: 1 })
    const h = onValue.mock.calls.at(-1)?.[0] as number[]
    for (const k of [1, 2, 3, 4, 5]) expect(h[k]).toBeCloseTo(0.5, 6)
    expect(h[0]).toBeCloseTo(0.1, 12)
    expect(h[7]).toBeCloseTo(0.1, 12)
  })
})

describe('Flight', () => {
  it('il segno in volo sta fra il punto del primo grafico e quello del secondo; fermo, non c’è', () => {
    const view = (t: number) => (
      <FlightLayer>
        <Plot width={400} height={300} xDomain={[0, 1]} yDomain={[0, 1]} ariaLabel="Immagine">
          <FlightAnchor name="a" />
        </Plot>
        <Plot width={400} height={300} xDomain={[0, 1]} yDomain={[0, 1]} ariaLabel="Piano">
          <FlightAnchor name="b" />
        </Plot>
        <FlightMarks arc={0} flights={[{ id: 'p1', from: { anchor: 'a', at: [0, 0] }, to: { anchor: 'b', at: [1, 1] }, t, cls: 1 }]} />
      </FlightLayer>
    )
    const { container, rerender } = render(view(0.5))
    // in jsdom i due grafici stanno entrambi in (0, 0) dello strato: il segno va da (56, 260) a (384, 24), a metà (220, 142)
    const mark = container.querySelector('[data-flight="p1"]')
    expect(mark).not.toBeNull()
    expect(mark!.getAttribute('transform')).toBe('translate(220,142)')
    expect(container.querySelector('[data-flight-marks]')).toHaveAttribute('aria-hidden', 'true')
    rerender(view(1))
    expect(container.querySelector('[data-flight="p1"]')).toBeNull()
  })

  it('in modo canvas disegna su un canvas nascosto ai lettori di schermo', () => {
    const ctx = { setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), fillStyle: '' }
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ctx) as unknown as HTMLCanvasElement['getContext'])
    const { container } = render(
      <FlightLayer>
        <Plot width={400} height={300} xDomain={[0, 1]} yDomain={[0, 1]} ariaLabel="A">
          <FlightAnchor name="a" />
        </Plot>
        <FlightMarks mode="canvas" flights={[{ id: 'p', from: { anchor: 'a', at: [0, 0] }, to: { anchor: 'a', at: [1, 1] }, t: 0.5 }]} />
      </FlightLayer>,
    )
    expect(container.querySelector('[data-flight-canvas]')).toHaveAttribute('aria-hidden', 'true')
    expect(ctx.arc).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('in modo canvas ogni classe ha la sua forma, e i colori si leggono una volta per tema, non per segno', () => {
    // Path2D non esiste in jsdom: una finta che ricorda il tracciato
    class FakePath2D {
      d: string
      constructor(d: string) {
        this.d = d
      }
    }
    vi.stubGlobal('Path2D', FakePath2D)
    const ctx = {
      setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
      fillStyle: '', strokeStyle: '', lineWidth: 1,
    }
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ctx) as unknown as HTMLCanvasElement['getContext'])
    const gcs = vi.spyOn(window, 'getComputedStyle')
    const reads = () => gcs.mock.calls.filter((c) => c[0] === document.documentElement).length
    const flights = (t: number) => [
      ...[0, 1, 2].map((k) => ({ id: `a${k}`, from: { anchor: 'a', at: [0, k / 10] as [number, number] }, to: { anchor: 'a', at: [1, 1] as [number, number] }, t, cls: 1 })),
      ...[0, 1].map((k) => ({ id: `b${k}`, from: { anchor: 'a', at: [k / 10, 0] as [number, number] }, to: { anchor: 'a', at: [1, 0] as [number, number] }, t, cls: 2 })),
    ]
    const view = (t: number) => (
      <FlightLayer>
        <Plot width={400} height={300} xDomain={[0, 1]} yDomain={[0, 1]} ariaLabel="A">
          <FlightAnchor name="a" />
        </Plot>
        <FlightMarks mode="canvas" flights={flights(t)} />
      </FlightLayer>
    )
    const { rerender } = render(view(0.3))
    // due classi più l'anello di superficie: tre letture, non una per segno
    expect(reads()).toBeLessThanOrEqual(3)
    const area = Math.PI * 4.5 * 4.5
    const drawn = ctx.fill.mock.calls.map((c) => (c[0] as FakePath2D | undefined)?.d)
    expect(drawn).toContain(classSymbolPath(1, area))
    expect(drawn).toContain(classSymbolPath(2, area))
    expect(ctx.arc).not.toHaveBeenCalled()
    // ogni segno si sposta sul suo punto e ha l'anello di superficie (tratto sotto il riempimento)
    expect(ctx.translate).toHaveBeenCalledTimes(5)
    expect(ctx.stroke).toHaveBeenCalledTimes(5)
    // un fotogramma nuovo dello stesso tema non rilegge i colori
    const before = reads()
    ctx.fill.mockClear()
    rerender(view(0.6))
    expect(ctx.fill).toHaveBeenCalledTimes(5)
    expect(reads()).toBe(before)
    gcs.mockRestore()
    spy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('una sorgente che non è un Plot entra con FlightBox e la sua proiezione', () => {
    const { container } = render(
      <FlightLayer>
        <FlightBox name="scena" project={(at) => [at[0] * 10, at[1] * 10]} />
        <Plot width={400} height={300} xDomain={[0, 1]} yDomain={[0, 1]} ariaLabel="Piano">
          <FlightAnchor name="piano" />
        </Plot>
        <FlightMarks arc={0} flights={[{ id: 'q', from: { anchor: 'scena', at: [2, 4] }, to: { anchor: 'piano', at: [0, 1] }, t: 0.5 }]} />
      </FlightLayer>,
    )
    // da (20, 40) nel riquadro a (56, 24) nel piano: a metà (38, 32)
    expect(container.querySelector('[data-flight="q"]')?.getAttribute('transform')).toBe('translate(38,32)')
  })

  it('FlightAnchor fuori da un FlightLayer è un errore chiaro', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() =>
      render(
        <Plot width={400} height={300} xDomain={[0, 1]} yDomain={[0, 1]} ariaLabel="A">
          <FlightAnchor name="a" />
        </Plot>,
      ),
    ).toThrow(/FlightLayer/)
    quiet.mockRestore()
  })
})

describe('MatrixGrid', () => {
  const values = [
    [0.75, -0.25],
    [-0.25, { n: 17, d: 48 }],
  ] as const

  it('frazioni esatte impilate e parlate; la colormap divergente sta dietro la cifra', () => {
    const { container } = render(<MatrixGrid values={values} label="Σ alla lavagna" mode="fraction" cellName={(i, j) => `sigma ${i + 1} ${j + 1}`} />)
    expect(screen.getByRole('grid', { name: 'Σ alla lavagna' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'sigma 1 2: meno 1 su 4' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'sigma 2 2: 17 su 48' })).toBeInTheDocument()
    // il più forte (0.75) ha il passo 7 della rampa, lo zero sarebbe 4
    const fill = container.querySelector('[data-cell="0-0"] > span') as HTMLElement
    expect(fill.style.background).toBe('var(--viz-div-7)')
  })

  it('tastiera: un solo arresto del Tab, le frecce spostano il fuoco; la simmetrica si accende', () => {
    const onCellFocus = vi.fn()
    render(<MatrixGrid values={values} label="Σ" symmetric onCellFocus={onCellFocus} />)
    const cells = screen.getAllByRole('gridcell')
    expect(cells.filter((c) => c.tabIndex === 0)).toHaveLength(1)
    act(() => cells[0].focus())
    fireEvent.keyDown(cells[0], { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cells[1])
    expect(onCellFocus).toHaveBeenLastCalledWith([0, 1])
    // la simmetrica (1, 0) è in evidenza e lo dice
    expect(cells[2]).toHaveAttribute('data-lit', 'true')
    expect(cells[2].getAttribute('aria-label')).toContain('simmetrica')
    fireEvent.keyDown(cells[1], { key: 'End', ctrlKey: true })
    expect(document.activeElement).toBe(cells[3])
  })

  it('il fantasma vola verso le celle e si posa: solo transform, poi sparisce', () => {
    const ghost = { values: [[0.1, -0.05], [-0.05, 0.2]], from: [-200, 40] as const }
    const { container, rerender } = render(<MatrixGrid values={values} label="Σ" ghost={{ ...ghost, t: 0.5 }} />)
    const g = container.querySelector('[data-cell="0-0"] [data-ghost]') as HTMLElement
    expect(g.style.transform).toBe('translate(-100.0px, 20.0px)')
    expect(g.textContent).toBe('+0.10')
    // un contributo negativo ha il solo segno meno, non "+−"
    expect(container.querySelector('[data-cell="0-1"] [data-ghost]')?.textContent).toBe('−0.05')
    rerender(<MatrixGrid values={values} label="Σ" ghost={{ ...ghost, t: 0.95 }} />)
    expect(container.querySelector('[data-cell="1-1"]')).toHaveAttribute('data-lit', 'true')
    rerender(<MatrixGrid values={values} label="Σ" ghost={{ ...ghost, t: 1 }} />)
    expect(container.querySelector('[data-ghost]')).toBeNull()
  })
})
