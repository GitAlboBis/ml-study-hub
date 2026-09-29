// Test dei componenti delle maniglie: Threshold, HandleOnCurve, LineHandles, Knob, AngleHandle, Ellipse.
// jsdom non ha ResizeObserver: il Plot resta sul viewBox dato (720 × 480, margini 24/16/40/56), quindi l'area interna
// è 648 × 416 e un clientX vale margin.left + x(valore). getScreenCTM manca: toData usa il rettangolo (0 in jsdom).
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Plot } from '../../kit/plot/Plot'
import { eig2 } from './ellipseGeometry'
import { Ellipse } from './Ellipse'
import { HandleOnCurve } from './HandleOnCurve'
import { AngleHandle, Knob } from './Knob'
import { LineHandles } from './LineHandles'
import type { Mat2, Vec2 } from './math/types'
import { Threshold, ThresholdSet } from './Threshold'

afterEach(cleanup)

const W = 720
const H = 480
const IW = 648
const IH = 416
const ML = 56
const MT = 24

function Frame({ children, x = [0, 10], y = [0, 1] }: { children: React.ReactNode; x?: [number, number]; y?: [number, number] }) {
  return (
    <Plot width={W} height={H} xDomain={x} yDomain={y} ariaLabel="Terreno di prova">
      {children}
    </Plot>
  )
}

/** clientX e clientY del punto (vx, vy) di un dominio [x0, x1] × [y0, y1]. */
const client = (vx: number, vy: number, x: [number, number] = [0, 10], y: [number, number] = [0, 1]) => ({
  clientX: ML + ((vx - x[0]) / (x[1] - x[0])) * IW,
  clientY: MT + (1 - (vy - y[0]) / (y[1] - y[0])) * IH,
})

describe('Threshold', () => {
  it('è un cursore con nome e valore; le frecce saltano al bordo successivo dei bin', () => {
    const onChange = vi.fn()
    render(
      <Frame>
        <Threshold value={4} onChange={onChange} label="Soglia x*" symbol="x*" snaps={[0, 2, 4, 6, 8, 10]} />
      </Frame>,
    )
    const s = screen.getByRole('slider', { name: 'Soglia x*' })
    expect(s).toHaveAttribute('aria-valuenow', '4')
    expect(s).toHaveAttribute('aria-valuetext', 'x* = 4')
    fireEvent.keyDown(s, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(6)
    fireEvent.keyDown(s, { key: 'ArrowLeft', shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(s, { key: 'x' })
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('trascinata segue il puntatore senza salti e si aggancia al bordo più vicino', () => {
    const onChange = vi.fn()
    render(
      <Frame>
        <Threshold value={4} onChange={onChange} label="Soglia" snaps={[0, 2, 4, 6, 8, 10]} />
      </Frame>,
    )
    const s = screen.getByRole('slider', { name: 'Soglia' })
    // presa un po' a destra della linea: la soglia non salta sotto il puntatore
    fireEvent.pointerDown(s, { ...client(4.2, 0.5), button: 0, pointerId: 1 })
    fireEvent.pointerMove(s, { ...client(7.1, 0.5), pointerId: 1 })
    // 7.1 − 0.2 di presa = 6.9 → bordo 6
    expect(onChange).toHaveBeenLastCalledWith(6)
    fireEvent.pointerUp(s, { pointerId: 1 })
    fireEvent.pointerMove(s, { ...client(9, 0.5), pointerId: 1 })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('con il fuoco la lettura del cartiglio segue i tasti, non resta sul valore di prima', () => {
    function Live() {
      const [v, setV] = useState(4)
      return (
        <Frame>
          <Threshold value={v} onChange={setV} label="Soglia x*" symbol="x*" snaps={[0, 2, 4, 6, 8, 10]} />
        </Frame>
      )
    }
    render(<Live />)
    const s = screen.getByRole('slider', { name: 'Soglia x*' })
    act(() => s.focus())
    expect(document.querySelector('[data-plot-tip]')).toHaveTextContent('x* = 4')
    fireEvent.keyDown(s, { key: 'ArrowRight' })
    expect(document.querySelector('[data-plot-tip]')).toHaveTextContent('x* = 6')
    act(() => s.blur())
    expect(document.querySelector('[data-plot-tip]')).toBeNull()
  })

  it('senza bordi usa il passo; orizzontale legge la y; senza onChange è solo disegno', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Frame>
        <Threshold value={0.5} onChange={onChange} orientation="horizontal" label="Soglia sulla densità" step={0.05} />
      </Frame>,
    )
    const s = screen.getByRole('slider', { name: 'Soglia sulla densità' })
    expect(s).toHaveAttribute('aria-orientation', 'vertical')
    fireEvent.keyDown(s, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(0.55)
    fireEvent.keyDown(s, { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith(1)
    rerender(
      <Frame>
        <Threshold value={0.5} orientation="horizontal" label="Soglia ferma" />
      </Frame>,
    )
    expect(screen.queryByRole('slider')).toBeNull()
    expect(document.querySelector('[data-threshold]')).not.toBeNull()
  })
})

describe('ThresholdSet', () => {
  it('confini ordinati: ognuno resta fra i vicini a distanza almeno gap, da tastiera e trascinato', () => {
    const onChange = vi.fn()
    render(
      <Frame>
        <ThresholdSet values={[2, 5, 8]} onChange={onChange} gap={0.5} step={0.1} label={(i) => `Confine ${i + 1}`} symbol={(i) => `t${i + 1}`} />
      </Frame>,
    )
    expect(screen.getAllByRole('slider')).toHaveLength(3)
    const second = screen.getByRole('slider', { name: 'Confine 2' })
    expect(second).toHaveAttribute('aria-valuemin', '2.5')
    expect(second).toHaveAttribute('aria-valuemax', '7.5')
    expect(second).toHaveAttribute('aria-valuetext', 't2 = 5')
    fireEvent.keyDown(second, { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith([2, 7.5, 8])
    fireEvent.keyDown(second, { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith([2, 4.9, 8])
    // trascinato oltre il vicino si ferma a gap da lui
    fireEvent.pointerDown(second, { ...client(5, 0.5), button: 0, pointerId: 1 })
    fireEvent.pointerMove(second, { ...client(1, 0.5), pointerId: 1 })
    expect(onChange).toHaveBeenLastCalledWith([2, 2.5, 8])
    // il primo e l'ultimo hanno per estremi il dominio (o min e max)
    expect(screen.getByRole('slider', { name: 'Confine 1' })).toHaveAttribute('aria-valuemin', '0')
    expect(screen.getByRole('slider', { name: 'Confine 3' })).toHaveAttribute('aria-valuemax', '10')
  })
})

describe('HandleOnCurve', () => {
  it('sta sulla curva y = f(x) e scorre in orizzontale; frecce di un passo', () => {
    const onChange = vi.fn()
    const f = (v: number) => v / 10
    render(
      <Frame>
        <HandleOnCurve value={3} onChange={onChange} f={f} label="Picco" step={0.5} valueText={(v, p) => `μ = ${v}, p = ${p[1]}`} />
      </Frame>,
    )
    const h = screen.getByRole('slider', { name: 'Picco' })
    expect(h).toHaveAttribute('aria-valuetext', 'μ = 3, p = 0.3')
    // la maniglia è disegnata sul punto (3, 0.3)
    expect(h.getAttribute('transform')).toBe(`translate(${(3 / 10) * IW},${(1 - 0.3) * IH})`)
    fireEvent.keyDown(h, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(3.5)
    fireEvent.pointerDown(h, { ...client(3, 0.3), button: 0, pointerId: 2 })
    fireEvent.pointerMove(h, { ...client(7.26, 0.9), pointerId: 2 })
    // solo l'ascissa conta, agganciata al passo 0.5
    expect(onChange).toHaveBeenLastCalledWith(7.5)
  })

  it('su una curva parametrica prende il t del punto più vicino al puntatore', () => {
    const onChange = vi.fn()
    const at = (t: number) => [Math.cos((t * Math.PI) / 180), Math.sin((t * Math.PI) / 180)] as const
    render(
      <Frame x={[-2, 2]} y={[-2, 2]}>
        <HandleOnCurve value={0} onChange={onChange} at={at} range={[0, 360]} step={1} label="Punto sul cerchio" />
      </Frame>,
    )
    const h = screen.getByRole('slider', { name: 'Punto sul cerchio' })
    fireEvent.pointerDown(h, { ...client(1, 0, [-2, 2], [-2, 2]), button: 0, pointerId: 3 })
    fireEvent.pointerMove(h, { ...client(0, 1.5, [-2, 2], [-2, 2]), pointerId: 3 })
    expect(onChange).toHaveBeenLastCalledWith(90)
  })
})

describe('LineHandles', () => {
  it('due maniglie da tastiera e la maniglia a metà che trasla la retta intera', () => {
    const onChange = vi.fn()
    render(
      <Frame>
        <LineHandles p={[2, 0.2]} q={[8, 0.8]} onChange={onChange} label="Retta" translate normal={{ label: 'w' }} step={[0.5, 0.05]} />
      </Frame>,
    )
    const p = screen.getByRole('slider', { name: 'Retta: primo punto' })
    expect(p.getAttribute('aria-valuetext')).toMatch(/w = /)
    fireEvent.keyDown(p, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith([2.5, 0.2], [8, 0.8])
    const q = screen.getByRole('slider', { name: 'Retta: secondo punto' })
    fireEvent.keyDown(q, { key: 'ArrowDown' })
    expect(onChange).toHaveBeenLastCalledWith([2, 0.2], [8, 0.75])
    const mid = screen.getByRole('slider', { name: 'Retta: sposta la retta intera' })
    fireEvent.keyDown(mid, { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith([1.5, 0.2], [7.5, 0.8])
    // la traslazione si ferma alla cornice per tutti e due i punti
    fireEvent.keyDown(mid, { key: 'ArrowUp', shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith([2, 0.4], [8, 1])
    // la freccia della normale c'è
    expect(document.querySelector('[data-arrow]')).not.toBeNull()
  })

  it('con axis "y" le maniglie si muovono solo in verticale: una soglia orizzontale inclinabile', () => {
    const onChange = vi.fn()
    render(
      <Frame>
        <LineHandles p={[0, 0.3]} q={[10, 0.3]} onChange={onChange} label="Soglia" axis="y" step={0.1} />
      </Frame>,
    )
    const p = screen.getByRole('slider', { name: 'Soglia: primo punto' })
    fireEvent.keyDown(p, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith([0, 0.4], [10, 0.3])
  })
})

describe('Knob', () => {
  function Controlled(props: { axial?: boolean; initial: number; onValue: (v: number) => void }) {
    const [v, setV] = useState(props.initial)
    return (
      <Knob
        id="k"
        label="Direzione"
        value={v}
        axial={props.axial}
        onChange={(n) => {
          setV(n)
          props.onValue(n)
        }}
      />
    )
  }

  it('slider circolare: frecce, Maiusc, giro che si richiude; il nome viene dall’etichetta', () => {
    const onValue = vi.fn()
    render(<Controlled initial={359} onValue={onValue} />)
    const k = screen.getByRole('slider', { name: 'Direzione' })
    expect(k).toHaveAttribute('aria-valuetext', '359°')
    fireEvent.keyDown(k, { key: 'ArrowRight' })
    expect(onValue).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(k, { key: 'ArrowLeft', shiftKey: true })
    expect(onValue).toHaveBeenLastCalledWith(345)
  })

  it('assiale: il valore resta in [0, 180) e il testo dice la stessa retta', () => {
    const onValue = vi.fn()
    render(<Controlled axial initial={170} onValue={onValue} />)
    const k = screen.getByRole('slider', { name: 'Direzione' })
    expect(k).toHaveAttribute('aria-valuetext', '170°, stessa retta di 350°')
    fireEvent.keyDown(k, { key: 'ArrowRight', shiftKey: true })
    expect(onValue).toHaveBeenLastCalledWith(5)
  })

  it('il puntatore trascina l’ago attorno al centro (in jsdom il centro è in 0, 0)', () => {
    const onValue = vi.fn()
    render(<Controlled initial={0} onValue={onValue} />)
    const k = screen.getByRole('slider', { name: 'Direzione' })
    fireEvent.pointerDown(k, { clientX: -10, clientY: -10, button: 0, pointerId: 1 })
    expect(onValue).toHaveBeenLastCalledWith(135)
    fireEvent.pointerMove(k, { clientX: 10, clientY: 0, pointerId: 1 })
    expect(onValue).toHaveBeenLastCalledWith(0)
    fireEvent.pointerUp(k, { pointerId: 1 })
    fireEvent.pointerMove(k, { clientX: 0, clientY: 10, pointerId: 1 })
    expect(onValue).toHaveBeenCalledTimes(2)
  })
})

describe('AngleHandle', () => {
  it('ruota attorno al centro misurando l’angolo nel dominio; tastiera come la manopola', () => {
    const onChange = vi.fn()
    render(
      <Frame x={[-2, 2]} y={[-2, 2]}>
        <AngleHandle center={[0, 0]} angle={30} radius={1.5} onChange={onChange} label="Punta di w" axial ring />
      </Frame>,
    )
    const h = screen.getByRole('slider', { name: 'Punta di w' })
    fireEvent.keyDown(h, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(31)
    fireEvent.pointerDown(h, { ...client(1.5 * Math.cos(Math.PI / 6), 1.5 * Math.sin(Math.PI / 6), [-2, 2], [-2, 2]), button: 0, pointerId: 4 })
    // il puntatore dall'altra parte (225°): assiale, si legge 45°
    fireEvent.pointerMove(h, { ...client(-1, -1, [-2, 2], [-2, 2]), pointerId: 4 })
    expect(onChange).toHaveBeenLastCalledWith(45)
  })

  it('con onRadiusChange la punta si allunga anche, dentro radiusRange', () => {
    const onChange = vi.fn()
    const onRadius = vi.fn()
    render(
      <Frame x={[-2, 2]} y={[-2, 2]}>
        <AngleHandle center={[0, 0]} angle={0} radius={1} onChange={onChange} onRadiusChange={onRadius} radiusRange={[0.5, 1.8]} label="Punta di w" />
      </Frame>,
    )
    const h = screen.getByRole('slider', { name: 'Punta di w' })
    fireEvent.pointerDown(h, { ...client(1, 0, [-2, 2], [-2, 2]), button: 0, pointerId: 5 })
    fireEvent.pointerMove(h, { ...client(0, 1.5, [-2, 2], [-2, 2]), pointerId: 5 })
    expect(onChange).toHaveBeenLastCalledWith(90)
    expect(onRadius).toHaveBeenLastCalledWith(1.5)
    fireEvent.pointerMove(h, { ...client(0, 1.95, [-2, 2], [-2, 2]), pointerId: 5 })
    expect(onRadius).toHaveBeenLastCalledWith(1.8)
    // da tastiera solo l'angolo
    fireEvent.keyDown(h, { key: 'ArrowUp' })
    expect(onRadius).toHaveBeenCalledTimes(2)
  })
})

describe('Ellipse', () => {
  const S: Mat2 = [
    [4, 0],
    [0, 1],
  ]

  it('disegna un livello per σ, niente se Σ non è valida', () => {
    const { container, rerender } = render(
      <Frame x={[-6, 6]} y={[-6, 6]}>
        <Ellipse m={[0, 0]} Sigma={S} levels={[1, 2, 3]} axes center levelLabels massLabels cls={1} />
      </Frame>,
    )
    expect(container.querySelectorAll('[data-level]')).toHaveLength(3)
    expect(container.textContent).toContain('2σ · 86%')
    expect(container.querySelector('[data-class-mark="1"]')).not.toBeNull()
    rerender(
      <Frame x={[-6, 6]} y={[-6, 6]}>
        <Ellipse m={[0, 0]} Sigma={[[1, 2], [2, 1]]} />
      </Frame>,
    )
    expect(container.querySelector('[data-ellipse]')).toBeNull()
  })

  it('la verità è tratteggiata, la stima no', () => {
    const { container } = render(
      <Frame x={[-6, 6]} y={[-6, 6]}>
        <Ellipse m={[0, 0]} Sigma={S} levels={[1]} role="truth" />
        <Ellipse m={[1, 1]} Sigma={S} levels={[1]} />
      </Frame>,
    )
    const levels = container.querySelectorAll('[data-level]')
    expect(levels[0]).toHaveAttribute('stroke-dasharray', '6 4')
    expect(levels[1]).not.toHaveAttribute('stroke-dasharray')
  })

  it('maniglie: media con le frecce, rotazione di 1° tenendo λ, asse minore che si allunga del 5%', () => {
    const onChange = vi.fn()
    function Live() {
      const [st, setSt] = useState<{ m: Vec2; Sigma: Mat2 }>({ m: [0, 0], Sigma: S })
      return (
        <Frame x={[-6, 6]} y={[-6, 6]}>
          <Ellipse
            m={st.m}
            Sigma={st.Sigma}
            label="Ellisse"
            handles={{
              mean: true,
              rotate: true,
              axes: true,
              moveStep: 0.5,
              onChange: (n) => {
                setSt(n)
                onChange(n)
              },
            }}
          />
        </Frame>
      )
    }
    render(<Live />)
    const mean = screen.getByRole('slider', { name: 'Ellisse: media' })
    fireEvent.keyDown(mean, { key: 'ArrowRight' })
    expect(onChange.mock.calls.at(-1)?.[0].m).toEqual([0.5, 0])
    const major = screen.getByRole('slider', { name: /Ellisse: asse maggiore/ })
    fireEvent.keyDown(major, { key: 'ArrowRight' })
    const rotated = eig2(onChange.mock.calls.at(-1)?.[0].Sigma)
    expect(rotated.phi).toBeCloseTo(1, 9)
    expect(rotated.l1).toBeCloseTo(4, 9)
    expect(rotated.l2).toBeCloseTo(1, 9)
    const minor = screen.getByRole('slider', { name: /Ellisse: asse minore/ })
    fireEvent.keyDown(minor, { key: 'ArrowUp' })
    const grown = eig2(onChange.mock.calls.at(-1)?.[0].Sigma)
    expect(grown.l2).toBeCloseTo(1.05 ** 2, 9)
    expect(grown.l1).toBeCloseTo(4, 9)
  })

  it('trascinando la punta maggiore la Σ ruota e si allunga fino al puntatore', () => {
    const onChange = vi.fn()
    render(
      <Frame x={[-6, 6]} y={[-6, 6]}>
        <Ellipse m={[0, 0]} Sigma={S} levels={[1]} label="E" handles={{ rotate: true, axes: true, onChange }} />
      </Frame>,
    )
    const major = screen.getByRole('slider', { name: /E: asse maggiore/ })
    act(() => {
      fireEvent.pointerDown(major, { ...client(2, 0, [-6, 6], [-6, 6]), button: 0, pointerId: 7 })
      fireEvent.pointerMove(major, { ...client(0, 3, [-6, 6], [-6, 6]), pointerId: 7 })
    })
    const e = eig2(onChange.mock.calls.at(-1)?.[0].Sigma)
    expect(e.phi).toBeCloseTo(90, 6)
    expect(e.l1).toBeCloseTo(9, 6)
    expect(e.l2).toBeCloseTo(1, 9)
  })
})
