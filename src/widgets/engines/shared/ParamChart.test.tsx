import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ParamChart } from './ParamChart'
import type { ParamChartProps } from './ParamChart'

afterEach(cleanup)

// varianza della media di N letture contro N in scala log: il pavimento σ²/N e le stime Monte Carlo con barre d'errore
const props: ParamChartProps = {
  x: { label: 'campioni', symbol: 'N', domain: [1, 1000], log: true },
  y: { label: 'varianza', symbol: 'var', domain: [1e-3, 10], log: true },
  curves: [{ id: 'bound', label: 'Pavimento di Cramér-Rao', latex: '\\sigma^2/N', role: 'truth', f: (n) => 4 / n }],
  points: [
    {
      id: 'mean',
      label: 'Media campionaria',
      cls: 1,
      data: [
        { x: 2, y: 2.1, lo: 1.5, hi: 2.8 },
        { x: 20, y: 0.19, lo: 0.15, hi: 0.24 },
        { x: 200, y: 0.021, lo: 0.017, hi: 0.025 },
      ],
    },
  ],
  current: { value: 20 },
  markers: [{ id: 'opt', x: 200, y: 0.02, label: 'N*' }],
  refLines: [{ y: 1, label: 'quota 1' }],
  ariaLabel: 'Varianza contro N',
}

describe('ParamChart', () => {
  it('disegna curve, punti con barre d\'errore, valore corrente, ottimi, riferimenti e legenda', () => {
    const { container } = render(<ParamChart {...props} />)
    expect(screen.getByRole('group', { name: 'Varianza contro N' })).toBeInTheDocument()
    expect(container.querySelectorAll('[data-curve="bound"] path').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('[data-point]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-errorbar]')).toHaveLength(3)
    expect(container.querySelector('[data-current]')).toHaveTextContent('N = 20')
    expect(container.querySelector('[data-marker]')).toHaveTextContent('N*')
    expect(container.querySelector('[data-refline]')).toHaveTextContent('quota 1')
    const legend = screen.getByRole('list', { name: 'Legenda' })
    expect(legend).toHaveTextContent('Pavimento di Cramér-Rao')
    expect(legend).toHaveTextContent('Media campionaria')
    // la descrizione riassume per chi non vede il grafico
    expect(container.querySelector('desc')?.textContent).toMatch(/Media campionaria \(3\)/)
  })

  it('asse logaritmico: tacche sui valori veri', () => {
    const { container } = render(<ParamChart {...props} />)
    const xTicks = [...container.querySelectorAll('[data-axis="bottom"] text.num')].map((t) => t.textContent)
    expect(xTicks).toEqual(expect.arrayContaining(['1', '10', '100', '1000']))
    const yTicks = [...container.querySelectorAll('[data-axis="left"] text.num')].map((t) => t.textContent)
    expect(yTicks).toEqual(expect.arrayContaining(['0.01', '1']))
  })

  it('costruzione punto per punto: upTo nasconde i punti oltre e accorcia la curva', () => {
    const { container, rerender } = render(<ParamChart {...props} upTo={20} />)
    expect(container.querySelectorAll('[data-point]')).toHaveLength(2)
    const long = container.querySelector('[data-curve="bound"] path')?.getAttribute('d') ?? ''
    rerender(<ParamChart {...props} upTo={3} />)
    expect(container.querySelectorAll('[data-point]')).toHaveLength(1)
    const short = container.querySelector('[data-curve="bound"] path')?.getAttribute('d') ?? ''
    expect(short.length).toBeLessThan(long.length)
  })

  it('fill: riempie il contenitore (il grafico prende l\'altezza che resta, la legenda la sua)', () => {
    const { container } = render(
      <div style={{ height: 300 }}>
        <ParamChart {...props} fill />
      </div>,
    )
    const root = container.querySelector('[data-param-chart]')!
    expect(root.className).toMatch(/h-full/)
    // un pavimento per il grafico: in un terreno troppo basso non si schiaccia, il resto scorre
    expect(root.className).toMatch(/grid-rows-\[minmax\(8rem,1fr\)_auto\]/)
    expect(root.className).toMatch(/overflow-y-auto/)
    // il Plot riempie invece di tenere il rapporto width / height
    const wrap = container.querySelector('svg')!.parentElement!
    expect(wrap.style.height).toBe('100%')
    expect(wrap.style.aspectRatio).toBe('')
  })

  it('una serie sola: niente legenda', () => {
    render(<ParamChart {...props} points={[]} />)
    expect(screen.queryByRole('list', { name: 'Legenda' })).not.toBeInTheDocument()
  })

  it('il cursore di lettura legge il punto più vicino da tastiera; Invio porta il parametro lì', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<ParamChart {...props} onPick={onPick} />)
    const cursor = screen.getByRole('slider', { name: /Cursore di lettura/ })
    cursor.focus()
    // al fuoco il cursore sta a metà del dominio (log10 N = 1.5); 12 passi a sinistra lo portano su log10 N ≈ 1.2 (N ≈ 16)
    await user.keyboard('{ArrowLeft>6}')
    expect(cursor.getAttribute('aria-valuetext')).toMatch(/N = /)
    expect(cursor.getAttribute('aria-valuetext')).toMatch(/Pavimento di Cramér-Rao/)
    await user.keyboard('{Enter}')
    expect(onPick).toHaveBeenCalledTimes(1)
    const picked = onPick.mock.calls[0][0] as number
    expect(picked).toBeGreaterThan(1)
    expect(picked).toBeLessThan(1000)
  })

  it('la lettura del cursore ha 3 cifre significative (cartiglio e lettore di schermo), non le 6 delle tacche', () => {
    render(<ParamChart {...props} />)
    const cursor = screen.getByRole('slider', { name: /Cursore di lettura/ })
    cursor.focus()
    // al fuoco il cursore sta a metà del dominio: log10 N = 1.5, N = 31.6228, 4/N = 0.126491
    expect(cursor.getAttribute('aria-valuetext')).toBe('N = 31.6 · Pavimento di Cramér-Rao 0.126')
  })

  it('snap: cursore, Invio e clic portano il parametro su un valore dello slider', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    const { container } = render(<ParamChart {...props} onPick={onPick} snap={(n) => Math.round(n)} />)
    const cursor = screen.getByRole('slider', { name: /Cursore di lettura/ })
    cursor.focus()
    // la lettura è quella del valore agganciato: N = 32 e 4/32 = 0.125
    expect(cursor.getAttribute('aria-valuetext')).toBe('N = 32 · Pavimento di Cramér-Rao 0.125')
    await user.keyboard('{Enter}')
    expect(onPick).toHaveBeenLastCalledWith(32)
    const innerWidth = 480 - 54 - 18
    fireEvent.click(container.querySelector('[data-pick]')!, { clientX: 54 + innerWidth / 2, clientY: 100 })
    expect(onPick).toHaveBeenLastCalledWith(32)
  })

  it('clic sul grafico: il parametro va dove si è cliccato (in scala log)', () => {
    const onPick = vi.fn()
    const { container } = render(<ParamChart {...props} onPick={onPick} />)
    const surface = container.querySelector('[data-pick]')!
    // senza ResizeObserver il Plot resta sul viewBox dato: metà dell'area interna = metà del dominio in log10
    const innerWidth = 480 - 54 - 18
    fireEvent.click(surface, { clientX: 54 + innerWidth / 2, clientY: 100 })
    expect(onPick.mock.calls[0][0]).toBeCloseTo(10 ** 1.5, 6)
  })
})
