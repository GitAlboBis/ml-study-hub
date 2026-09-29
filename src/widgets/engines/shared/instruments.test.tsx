import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fixed } from '../../kit/format'
import { Gauge } from './Gauge'
import { SciCounter } from './SciCounter'
import { Thermometer } from './Thermometer'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Gauge', () => {
  it('un meter con nome, estremi, valore e testo che dice obiettivo e fuori scala', () => {
    const { container, rerender } = render(<Gauge label="Varianza / bound" value={1.4} min={0.5} max={4} log target={[0.9, 1.1]} format={fixed(2)} />)
    const meter = screen.getByRole('meter', { name: 'Varianza / bound' })
    expect(meter).toHaveAttribute('aria-valuenow', '1.4')
    expect(meter).toHaveAttribute('aria-valuetext', '1.40, obiettivo fra 0.90 e 1.10')
    expect(container.querySelector('[data-target-zone]')).not.toBeNull()
    rerender(<Gauge label="Varianza / bound" value={9} min={0.5} max={4} log target={1} />)
    expect(meter).toHaveAttribute('aria-valuenow', '4')
    expect(meter.getAttribute('aria-valuetext')).toMatch(/oltre il fondo scala/)
    expect(screen.getByText('fuori scala')).toBeInTheDocument()
    expect(container.querySelector('[data-target]')).not.toBeNull()
  })

  it('la lancetta punta dove sta il valore: a metà scala, in alto', () => {
    const { container } = render(<Gauge label="g" value={5} min={0} max={10} />)
    const needle = container.querySelector('[data-needle]')!
    expect(Number(needle.getAttribute('x2'))).toBeCloseTo(100, 6)
    expect(Number(needle.getAttribute('y2'))).toBeLessThan(100)
  })

  it('le cifre delle tacche sono testo HTML sopra il quadrante: grandezza fissa anche se il quadrante si stringe', () => {
    const { container } = render(<Gauge label="g" value={5} min={0} max={10} ticks={[0, 5, 10]} />)
    const labels = [...container.querySelectorAll<HTMLElement>('[data-tick-label]')]
    expect(labels.map((l) => l.textContent)).toEqual(['0', '5', '10'])
    expect(labels.every((l) => l instanceof HTMLElement && !(l instanceof SVGElement))).toBe(true)
    expect(container.querySelectorAll('svg text')).toHaveLength(0)
    // la tacca di metà scala sta in cima, al centro del quadrante
    expect(labels[1].style.left).toBe('50%')
    expect(Number.parseFloat(labels[0].style.left)).toBeLessThan(20)
    expect(Number.parseFloat(labels[2].style.left)).toBeGreaterThan(80)
  })

  it('senza un valore (NaN) niente lancetta e un trattino', () => {
    const { container } = render(<Gauge label="g" value={Number.NaN} min={0} max={10} />)
    expect(container.querySelector('[data-needle]')).toBeNull()
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '—')
  })

  it('annuncia il valore quando si ferma', () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<Gauge label="Bias" value={0.2} min={0} max={1} />)
    const live = container.querySelector('[aria-live="polite"]')!
    rerender(<Gauge label="Bias" value={0.1} min={0} max={1} />)
    expect(live).toHaveTextContent('Bias: 0.20')
    act(() => vi.advanceTimersByTime(600))
    expect(live).toHaveTextContent('Bias: 0.10')
  })
})

describe('Thermometer', () => {
  it('la colonna si riempie fino al valore; i riferimenti superati entrano nel testo; oltre il fondo scala la freccia', () => {
    const { container, rerender } = render(<Thermometer label="JM" latex="JM" value={1} min={0} max={2} markers={[{ value: Math.SQRT2, label: '√2' }]} />)
    const meter = screen.getByRole('meter', { name: 'JM' })
    expect(meter).toHaveAttribute('aria-valuetext', '1.00')
    const fill = container.querySelector('[data-fill]')!
    const h1 = Number(fill.getAttribute('height'))
    rerender(<Thermometer label="JM" value={1.5} min={0} max={2} markers={[{ value: Math.SQRT2, label: '√2' }]} />)
    expect(Number(fill.getAttribute('height'))).toBeGreaterThan(h1)
    expect(meter).toHaveAttribute('aria-valuetext', '1.50, sopra √2')
    expect(container.querySelector('[data-overflow]')).toBeNull()
    rerender(<Thermometer label="D" value={40} min={0} max={10} />)
    expect(container.querySelector('[data-overflow]')).not.toBeNull()
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '40.00, oltre il fondo scala')
  })
})

describe('SciCounter', () => {
  it('rulli sulle cifre della mantissa e dell\'esponente; a parole per chi ascolta', () => {
    const { container } = render(<SciCounter label="Combinazioni" latex="\\binom{n}{m}" value={9.05485e58} />)
    const reels = [...container.querySelectorAll('[data-reel]')].map((r) => r.getAttribute('data-reel'))
    expect(reels).toEqual(['9', '0', '5', '5', '8'])
    expect(container.querySelector('output .visually-hidden')).toHaveTextContent('Combinazioni: 9.05 per 10 alla 58')
    // la striscia del rullo è spostata sulla cifra
    expect(container.querySelector<HTMLElement>('[data-reel="5"] > span')!.style.transform).toBe('translateY(-5em)')
  })

  it('dal logaritmo per i numeri oltre il double, per esteso i piccoli interi', () => {
    const { container, rerender } = render(<SciCounter label="Prodotto" log10={-400} />)
    expect([...container.querySelectorAll('[data-reel]')].map((r) => r.getAttribute('data-reel')).join('')).toBe('100400')
    expect(container.querySelector('sup')).toHaveTextContent(/^−/)
    expect(container.querySelector('output .visually-hidden')).toHaveTextContent('1.00 per 10 alla meno 400')
    rerender(<SciCounter label="Valutazioni" value={252} />)
    expect(container.querySelector('[data-sci]')).toHaveAttribute('data-sci', 'plain')
    expect([...container.querySelectorAll('[data-reel]')].map((r) => r.getAttribute('data-reel'))).toEqual(['2', '5', '2'])
  })
})
