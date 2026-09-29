import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Axis } from '../../kit/plot/Axis'
import { Plot } from '../../kit/plot/Plot'
import { createLinkedCursorStore, useLinkedCursorStore } from './linked'
import type { LinkedCursorStore, LinkedPoint } from './linked'
import { LinkedCursorMark, LinkedPanels } from './LinkedPanels'
import type { LinkedPanel } from './LinkedPanels'

afterEach(cleanup)

const panel = (id: string, title: string): LinkedPanel => ({
  id,
  title,
  content: ({ onCursor, last }) => (
    <Plot width={400} height={160} xDomain={[0, 10]} yDomain={[0, 1]} ariaLabel={`Pannello ${id}`} cursor="x" onCursor={onCursor}>
      <Axis side="bottom" values={last} />
      <LinkedCursorMark />
    </Plot>
  ),
})

describe('LinkedPanels', () => {
  it('un gruppo con nome e un pannello con nome per titolo; solo l\'ultimo ha le cifre dell\'asse', () => {
    const { container } = render(<LinkedPanels label="Tre pannelli" panels={[panel('a', 'Verosimiglianza $L(\\theta)$'), panel('b', 'Log-verosimiglianza')]} />)
    expect(screen.getByRole('group', { name: 'Tre pannelli' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Verosimiglianza L(θ)' })).toBeInTheDocument()
    const axes = container.querySelectorAll('[data-axis="bottom"]')
    expect(axes[0].querySelectorAll('text.num')).toHaveLength(0)
    expect(axes[1].querySelectorAll('text.num').length).toBeGreaterThan(0)
  })

  it('il cursore mosso da tastiera in un pannello compare in tutti; resta quando esce (sonda persistente)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(<LinkedPanels label="Collegati" onCursorChange={onChange} panels={[panel('a', 'A'), panel('b', 'B'), panel('c', 'C')]} />)
    expect(container.querySelectorAll('[data-linked-cursor]')).toHaveLength(0)
    const cursors = screen.getAllByRole('slider', { name: /Cursore di lettura/ })
    cursors[0].focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith({ x: 5.25 })
    const marks = container.querySelectorAll('[data-linked-cursor] line')
    expect(marks).toHaveLength(3)
    const xs = [...marks].map((l) => l.getAttribute('x1'))
    expect(new Set(xs).size).toBe(1)
    // il fuoco esce: il Plot toglie il suo cursore, quello condiviso resta
    cursors[0].blur()
    expect(container.querySelectorAll('[data-linked-cursor]')).toHaveLength(3)
  })

  it('senza sonda persistente il cursore sparisce quando il puntatore esce', () => {
    const { container } = render(<LinkedPanels label="Collegati" sticky={false} defaultCursor={{ x: 2 }} panels={[panel('a', 'A'), panel('b', 'B')]} />)
    expect(container.querySelectorAll('[data-linked-cursor]')).toHaveLength(2)
    const cursor = screen.getAllByRole('slider', { name: /Cursore di lettura/ })[1]
    fireEvent.focus(cursor)
    fireEvent.blur(cursor)
    expect(container.querySelectorAll('[data-linked-cursor]')).toHaveLength(0)
  })

  it('griglia di piccoli multipli: le classi delle colonne, due in colonna sui telefoni da 4 in su', () => {
    const { container } = render(<LinkedPanels label="N crescente" layout="grid" columns={5} panels={['1', '4', '9', '16', '100'].map((n) => panel(n, `N = ${n}`))} />)
    const grid = container.querySelector('[role="group"] > div')!
    expect(grid.className).toMatch(/grid-cols-2/)
    expect(grid.className).toMatch(/@4xl:grid-cols-5/)
    expect(container.querySelectorAll('[data-panel]')).toHaveLength(5)
  })

  it('fill: i pannelli si dividono l\'altezza del contenitore e il contenuto lo sa (per il fill del suo Plot)', () => {
    const seen: boolean[] = []
    const filled: LinkedPanel = {
      id: 'f',
      title: 'F',
      content: ({ fill, onCursor }) => {
        seen.push(fill)
        return <Plot fill={fill} width={400} height={160} xDomain={[0, 10]} yDomain={[0, 1]} ariaLabel="Pannello f" cursor="x" onCursor={onCursor} />
      },
    }
    const { container } = render(
      <div style={{ height: 400 }}>
        <LinkedPanels label="Nel terreno" fill panels={[filled, { ...filled, id: 'g' }]} />
      </div>,
    )
    const group = screen.getByRole('group', { name: 'Nel terreno' })
    expect(group.className).toMatch(/h-full/)
    // un pavimento per pannello: in un terreno troppo basso i pannelli non si schiacciano, il gruppo scorre
    expect(group.className).toMatch(/overflow-y-auto/)
    expect(group.firstElementChild?.className).toMatch(/auto-rows-\[minmax\(7rem,1fr\)\]/)
    expect(seen.every(Boolean)).toBe(true)
    const section = container.querySelector('[data-panel="f"]')!
    expect(section.className).toMatch(/grid-rows-\[auto_minmax\(0,1fr\)\]/)
    // senza titolo il contenuto prende tutta l'altezza (niente riga del titolo vuota in cui finire schiacciato)
    const { container: bare } = render(<LinkedPanels label="Senza titoli" fill panels={[{ ...filled, id: 'h', title: undefined }]} />)
    expect(bare.querySelector('[data-panel="h"]')?.className).toMatch(/grid-rows-\[minmax\(0,1fr\)\]/)
    render(<LinkedPanels label="Da sé" panels={[filled]} />)
    expect(seen.at(-1)).toBe(false)
  })

  it('un pannello su un altro asse (dati contro parametri) traduce il cursore con la sua mappa, nei due versi', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    // il cursore condiviso è θ; il pannello dei dati mostra x = 2θ (dominio 0-20), quello dei parametri θ (0-10)
    const data: LinkedPanel = {
      id: 'dati',
      title: 'Dati',
      map: { toPanel: (p) => ({ x: 2 * p.x }), toShared: (p) => ({ x: p.x / 2 }) },
      content: ({ onCursor, cursor }) => (
        <>
          <output data-testid="cursore-dati">{cursor === null ? '-' : String(cursor.x)}</output>
          <Plot width={400} height={160} xDomain={[0, 20]} yDomain={[0, 1]} ariaLabel="Pannello dati" cursor="x" onCursor={onCursor}>
            <LinkedCursorMark />
          </Plot>
        </>
      ),
    }
    const { container } = render(<LinkedPanels label="Dati e parametri" defaultCursor={{ x: 3 }} onCursorChange={onChange} panels={[panel('theta', 'Parametro'), data]} />)
    expect(screen.getByTestId('cursore-dati')).toHaveTextContent('6')
    const [inTheta, inData] = [...container.querySelectorAll('[data-linked-cursor] line')].map((l) => Number(l.getAttribute('x1')))
    // stesso punto della carta: 3 su [0, 10] e 6 su [0, 20] cadono alla stessa frazione dell'area interna
    expect(inTheta).toBeCloseTo(inData, 6)
    // il cursore mosso nel pannello dei dati arriva condiviso in θ
    const cursors = screen.getAllByRole('slider', { name: /Cursore di lettura/ })
    cursors[1].focus()
    await user.keyboard('{ArrowRight}')
    const shared = onChange.mock.calls.at(-1)?.[0] as { x: number }
    expect(shared.x).toBeCloseTo(10.5 / 2, 9)
  })
})

// ogni mossa del cursore ridisegna solo ciò che lo legge: i segni del cursore e i pannelli che leggono ctx.cursor
describe('LinkedPanels: costo di una mossa del cursore', () => {
  it('muovere il cursore non ridisegna i contenuti dei pannelli; i segni del cursore si spostano', async () => {
    const user = userEvent.setup()
    const calls: Record<string, number> = { a: 0, b: 0 }
    const counted = (id: string): LinkedPanel => ({
      id,
      title: id,
      content: ({ onCursor }) => {
        calls[id]++
        return (
          <Plot width={400} height={160} xDomain={[0, 10]} yDomain={[0, 1]} ariaLabel={`Pannello ${id}`} cursor="x" onCursor={onCursor}>
            <LinkedCursorMark />
          </Plot>
        )
      },
    })
    const { container } = render(<LinkedPanels label="Collegati" defaultCursor={{ x: 2 }} panels={[counted('a'), counted('b')]} />)
    const before = { ...calls }
    const x1 = () => container.querySelector('[data-panel="b"] [data-linked-cursor] line')?.getAttribute('x1')
    const start = x1()
    const cursors = screen.getAllByRole('slider', { name: /Cursore di lettura/ })
    cursors[0].focus()
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(x1()).not.toBe(start)
    expect(calls).toEqual(before)
  })

  it('un pannello che legge ctx.cursor si aggiorna da solo, gli altri no', async () => {
    const user = userEvent.setup()
    let plain = 0
    const reader: LinkedPanel = {
      id: 'r',
      title: 'Lettura',
      content: ({ cursor, onCursor }) => (
        <>
          <output data-testid="lettura">{cursor === null ? '-' : cursor.x.toFixed(2)}</output>
          <Plot width={400} height={160} xDomain={[0, 10]} yDomain={[0, 1]} ariaLabel="Pannello r" cursor="x" onCursor={onCursor} />
        </>
      ),
    }
    const other: LinkedPanel = {
      id: 'o',
      title: 'Altro',
      content: ({ onCursor }) => {
        plain++
        return <Plot width={400} height={160} xDomain={[0, 10]} yDomain={[0, 1]} ariaLabel="Pannello o" cursor="x" onCursor={onCursor} />
      },
    }
    render(<LinkedPanels label="Collegati" defaultCursor={{ x: 2 }} panels={[reader, other]} />)
    expect(screen.getByTestId('lettura')).toHaveTextContent('2.00')
    const before = plain
    const cursors = screen.getAllByRole('slider', { name: /Cursore di lettura/ })
    cursors[1].focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('lettura')).toHaveTextContent('5.25')
    expect(plain).toBe(before)
  })

  it('il motore tiene il cursore in uno store e lo legge solo dove serve, senza ridisegnarsi', async () => {
    const user = userEvent.setup()
    let engine = 0
    function Reading({ store }: { store: LinkedCursorStore }) {
      const p = useLinkedCursorStore(store)
      return <output data-testid="formula">{p === null ? '-' : p.x.toFixed(2)}</output>
    }
    function Engine() {
      engine++
      const [store] = useState(() => createLinkedCursorStore({ x: 1 }))
      return (
        <>
          <Reading store={store} />
          <LinkedPanels label="Collegati" store={store} panels={[panel('a', 'A'), panel('b', 'B')]} />
        </>
      )
    }
    const { container } = render(<Engine />)
    expect(screen.getByTestId('formula')).toHaveTextContent('1.00')
    expect(container.querySelectorAll('[data-linked-cursor]')).toHaveLength(2)
    const renders = engine
    screen.getAllByRole('slider', { name: /Cursore di lettura/ })[0].focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('formula')).toHaveTextContent('5.25')
    expect(engine).toBe(renders)
  })

  it('cursore controllato: segue la prop, e onCursorChange arriva solo quando il punto cambia', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    function Controlled() {
      const [c, setC] = useState<LinkedPoint | null>({ x: 3 })
      return (
        <>
          <button type="button" onClick={() => setC({ x: 8 })}>
            Porta a 8
          </button>
          <LinkedPanels
            label="Controllato"
            cursor={c}
            onCursorChange={(p) => {
              onChange(p)
              setC(p)
            }}
            panels={[panel('a', 'A'), panel('b', 'B')]}
          />
        </>
      )
    }
    const { container } = render(<Controlled />)
    const x1 = () => Number(container.querySelector('[data-panel="a"] [data-linked-cursor] line')?.getAttribute('x1'))
    const at3 = x1()
    await user.click(screen.getByText('Porta a 8', { selector: 'button' }))
    expect(x1()).toBeGreaterThan(at3)
    const cursors = screen.getAllByRole('slider', { name: /Cursore di lettura/ })
    cursors[0].focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith({ x: 5.25 })
    // Home due volte: il secondo non sposta il punto e il motore non viene disturbato
    await user.keyboard('{Home}{Home}')
    const xs = onChange.mock.calls.map((c) => (c[0] as LinkedPoint | null)?.x)
    expect(xs.at(-1)).toBe(0)
    expect(xs.every((v, i) => i === 0 || v !== xs[i - 1])).toBe(true)
  })
})
