// Test di DragBins e Sortable: tastiera completa (Invio prende, frecce scelgono, Invio posa, Esc annulla),
// tocco con "Posa qui" e con i pulsanti, trascinamento con il puntatore, annunci.
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DragBins } from './DragBins'
import type { Placement } from './dragKeyboard'
import { Sortable } from './Sortable'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const ITEMS = [
  { id: 'knn', label: 'Il volume si adatta ai dati' },
  { id: 'parzen', label: 'La finestra ha larghezza $h$ fissa', speak: 'La finestra ha larghezza h fissa' },
  { id: 'both', label: 'Serve $N \\to \\infty$' },
]
const BINS = [
  { id: 'k', label: 'K-NN' },
  { id: 'p', label: 'Parzen' },
]

function LiveBins({ onValue, initial = {}, capacity }: { onValue?: (p: Placement) => void; initial?: Placement; capacity?: number }) {
  const [p, setP] = useState<Placement>(initial)
  return (
    <DragBins
      id="carte"
      label="Smista le carte"
      items={ITEMS}
      bins={capacity === undefined ? BINS : BINS.map((b) => ({ ...b, capacity }))}
      placement={p}
      onChange={(n) => {
        setP(n)
        onValue?.(n)
      }}
      feedback={{ knn: 'ok' }}
    />
  )
}

const chip = (id: string) => document.querySelector(`[data-chip="${id}"]`) as HTMLButtonElement
const status = () => screen.getByRole('status').textContent

/**
 * Layout finto per lo scivolamento (useFlip): ogni elemento con data-flip-id sta nella riga del suo posto nella lista e,
 * nei contenitori, nella fascia del suo contenitore. Così un elemento che cambia posto cambia anche rettangolo.
 */
function mockFlipLayout() {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const li = this.closest('[data-flip-id]')
    if (li === null) return new DOMRect(0, 0, 0, 0)
    const row = [...(li.parentElement?.children ?? [])].indexOf(li)
    const band = [...document.querySelectorAll('[data-bin]')].indexOf(li.closest('[data-bin]') as Element)
    return new DOMRect(0, Math.max(0, band) * 200 + row * 50, 200, 40)
  })
}

/** Web Animations API finta (jsdom non l'ha): restituisce la spia e la funzione che la toglie. */
function stubAnimate() {
  const animate = vi.fn()
  Object.defineProperty(HTMLElement.prototype, 'animate', { value: animate, configurable: true, writable: true })
  return { animate, restore: () => delete (HTMLElement.prototype as { animate?: unknown }).animate }
}

describe('DragBins', () => {
  it('un solo arresto del Tab; le frecce senza presa spostano il fuoco fra i chip', () => {
    render(<LiveBins />)
    const all = ITEMS.map((i) => chip(i.id))
    expect(all.filter((c) => c.tabIndex === 0)).toHaveLength(1)
    act(() => all[0].focus())
    fireEvent.keyDown(all[0], { key: 'ArrowRight' })
    expect(document.activeElement).toBe(all[1])
    fireEvent.keyDown(all[1], { key: 'End' })
    expect(document.activeElement).toBe(all[2])
  })

  it('tastiera: Invio prende, le frecce scelgono il contenitore, Invio posa; il fuoco segue il chip', () => {
    const onValue = vi.fn()
    render(<LiveBins onValue={onValue} />)
    act(() => chip('parzen').focus())
    fireEvent.keyDown(chip('parzen'), { key: 'Enter' })
    expect(status()).toMatch(/Preso La finestra ha larghezza h fissa/)
    // dal vassoio il primo bersaglio proposto è il primo contenitore
    expect(document.querySelector('[data-bin="k"]')).toHaveAttribute('data-target', 'true')
    fireEvent.keyDown(chip('parzen'), { key: 'ArrowRight' })
    expect(document.querySelector('[data-bin="p"]')).toHaveAttribute('data-target', 'true')
    expect(status()).toBe('Contenitore: Parzen')
    fireEvent.keyDown(chip('parzen'), { key: ' ' })
    expect(onValue).toHaveBeenLastCalledWith({ parzen: 'p' })
    expect(document.querySelector('[data-bin="p"] [data-chip="parzen"]')).not.toBeNull()
    expect(document.activeElement).toBe(chip('parzen'))
    expect(status()).toBe('La finestra ha larghezza h fissa posato in Parzen')
  })

  it('Esc annulla la presa senza spostare nulla', () => {
    const onValue = vi.fn()
    render(<LiveBins onValue={onValue} />)
    act(() => chip('knn').focus())
    fireEvent.keyDown(chip('knn'), { key: 'Enter' })
    fireEvent.keyDown(chip('knn'), { key: 'Escape' })
    expect(onValue).not.toHaveBeenCalled()
    expect(status()).toMatch(/Annullato/)
    expect(document.querySelector('[data-target]')).toBeNull()
  })

  it('tocco: il chip si prende con un clic e si posa con "Posa qui"', () => {
    const onValue = vi.fn()
    render(<LiveBins onValue={onValue} />)
    expect(screen.queryByRole('button', { name: /^Posa qui/ })).toBeNull()
    fireEvent.click(chip('both'))
    expect(chip('both')).toHaveAttribute('data-held', 'true')
    // un "Posa qui" per ogni contenitore, tranne quello in cui il chip sta già (qui il vassoio)
    expect(screen.getAllByText('Posa qui', { selector: 'button', exact: false, ignore: 'span' })).toHaveLength(2)
    expect(document.querySelector('[data-bin="__vassoio__"] header button')).toBeNull()
    const buttons = [...document.querySelectorAll('[data-bin="p"] header button')] as HTMLButtonElement[]
    fireEvent.click(buttons[0])
    expect(onValue).toHaveBeenLastCalledWith({ both: 'p' })
  })

  it('caselle a capienza 1: posando un secondo chip i due si scambiano', () => {
    const onValue = vi.fn()
    render(<LiveBins onValue={onValue} initial={{ knn: 'k' }} capacity={1} />)
    act(() => chip('parzen').focus())
    fireEvent.keyDown(chip('parzen'), { key: 'Enter' })
    fireEvent.keyDown(chip('parzen'), { key: 'Enter' })
    expect(onValue).toHaveBeenLastCalledWith({ knn: null, parzen: 'k' })
  })

  it('il puntatore trascina il chip su un contenitore', () => {
    // jsdom non fa layout: rettangoli finti per i contenitori
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const bin = this.dataset.bin
      const at = bin === '__vassoio__' ? 0 : bin === 'k' ? 200 : bin === 'p' ? 400 : -1
      return at < 0 ? new DOMRect(0, 0, 0, 0) : new DOMRect(0, at, 300, 150)
    })
    const onValue = vi.fn()
    render(<LiveBins onValue={onValue} />)
    const c = chip('knn')
    fireEvent.pointerDown(c, { clientX: 20, clientY: 20, button: 0, pointerId: 1 })
    fireEvent.pointerMove(c, { clientX: 40, clientY: 450, pointerId: 1 })
    expect(document.querySelector('[data-bin="p"]')).toHaveAttribute('data-target', 'true')
    // durante il gesto il chip segue il dito con transform
    expect((c.parentElement as HTMLElement).style.transform).toBe('translate(20px, 430px)')
    fireEvent.pointerUp(c, { clientX: 40, clientY: 450, pointerId: 1 })
    expect(onValue).toHaveBeenLastCalledWith({ knn: 'p' })
    // il clic che segue il rilascio non prende il chip
    fireEvent.click(chip('knn'))
    expect(chip('knn')).not.toHaveAttribute('data-held')
  })

  it('scivola solo ciò che muove il puntatore: il chip posato da tastiera arriva subito', () => {
    mockFlipLayout()
    const { animate, restore } = stubAnimate()
    try {
      render(<LiveBins />)
      act(() => chip('parzen').focus())
      fireEvent.keyDown(chip('parzen'), { key: 'Enter' })
      fireEvent.keyDown(chip('parzen'), { key: 'Enter' })
      expect(document.querySelector('[data-bin="k"] [data-chip="parzen"]')).not.toBeNull()
      expect(animate).not.toHaveBeenCalled()
      // tocco: presa e "Posa qui" con il dito (detail 1: un clic vero, non Invio su un pulsante)
      fireEvent.click(chip('both'), { detail: 1 })
      fireEvent.click(document.querySelector('[data-bin="p"] header button') as HTMLButtonElement, { detail: 1 })
      expect(document.querySelector('[data-bin="p"] [data-chip="both"]')).not.toBeNull()
      expect(animate).toHaveBeenCalled()
    } finally {
      restore()
    }
  })

  it('il contenitore scelto da tastiera ha il suo "Posa qui" acceso, con la freccia e la parola', () => {
    render(<LiveBins />)
    act(() => chip('knn').focus())
    fireEvent.keyDown(chip('knn'), { key: 'Enter' })
    const lit = document.querySelector('[data-bin="k"] header button') as HTMLButtonElement
    expect(lit).toHaveAttribute('data-lit', 'true')
    expect(document.querySelector('[data-bin="p"] header button')).not.toHaveAttribute('data-lit')
    // un solo segno "qui" per contenitore: il pulsante acceso, non anche un cartellino accanto
    expect(document.querySelectorAll('[data-bin="k"] [data-here]')).toHaveLength(0)
  })

  it('l’esito sta nel nome e nell’icona, non nel solo colore', () => {
    render(<LiveBins initial={{ knn: 'k' }} />)
    expect(chip('knn').getAttribute('aria-label')).toBe('Il volume si adatta ai dati, giusto')
    expect(chip('knn').querySelector('svg')).not.toBeNull()
  })
})

function LiveList({ onValue, orientation = 'vertical' }: { onValue: (o: readonly string[]) => void; orientation?: 'vertical' | 'horizontal' }) {
  const [o, setO] = useState<readonly string[]>(['a', 'b', 'c'])
  return (
    <Sortable
      id="passi"
      label="Metti in ordine"
      orientation={orientation}
      numbered
      items={[
        { id: 'a', label: 'Acquisizione' },
        { id: 'b', label: 'Estrazione delle feature' },
        { id: 'c', label: 'Classificazione' },
      ]}
      order={o}
      onChange={(n) => {
        setO(n)
        onValue(n)
      }}
    />
  )
}

const item = (id: string) => document.querySelector(`[data-item="${id}"]`) as HTMLButtonElement

describe('Sortable', () => {
  it('Invio prende, le frecce spostano, Invio posa; gli annunci dicono la posizione', () => {
    const onValue = vi.fn()
    render(<LiveList onValue={onValue} />)
    act(() => item('a').focus())
    fireEvent.keyDown(item('a'), { key: 'Enter' })
    expect(status()).toMatch(/Preso Acquisizione, posizione 1 di 3/)
    fireEvent.keyDown(item('a'), { key: 'ArrowDown' })
    expect(onValue).toHaveBeenLastCalledWith(['b', 'a', 'c'])
    expect(status()).toBe('Acquisizione in posizione 2 di 3')
    expect(document.activeElement).toBe(item('a'))
    fireEvent.keyDown(item('a'), { key: 'End' })
    expect(onValue).toHaveBeenLastCalledWith(['b', 'c', 'a'])
    fireEvent.keyDown(item('a'), { key: 'Enter' })
    expect(status()).toBe('Acquisizione posato in posizione 3 di 3')
  })

  it('Esc rimette l’ordine di prima della presa', () => {
    const onValue = vi.fn()
    render(<LiveList onValue={onValue} />)
    act(() => item('c').focus())
    fireEvent.keyDown(item('c'), { key: ' ' })
    fireEvent.keyDown(item('c'), { key: 'Home' })
    expect(onValue).toHaveBeenLastCalledWith(['c', 'a', 'b'])
    fireEvent.keyDown(item('c'), { key: 'Escape' })
    expect(onValue).toHaveBeenLastCalledWith(['a', 'b', 'c'])
    expect(status()).toMatch(/Annullato/)
  })

  it('orizzontale: sinistra e destra; senza presa le frecce spostano il fuoco', () => {
    const onValue = vi.fn()
    render(<LiveList onValue={onValue} orientation="horizontal" />)
    act(() => item('a').focus())
    fireEvent.keyDown(item('a'), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(item('b'))
    expect(onValue).not.toHaveBeenCalled()
    fireEvent.keyDown(item('b'), { key: 'Enter' })
    fireEvent.keyDown(item('b'), { key: 'ArrowLeft' })
    expect(onValue).toHaveBeenLastCalledWith(['b', 'a', 'c'])
  })

  it('tocco: un clic prende, i pulsanti Su e Giù spostano', () => {
    const onValue = vi.fn()
    render(<LiveList onValue={onValue} />)
    fireEvent.click(item('b'))
    expect(item('b')).toHaveAttribute('data-held', 'true')
    fireEvent.click(screen.getByText('Giù', { selector: 'button', exact: false, ignore: 'span' }))
    expect(onValue).toHaveBeenLastCalledWith(['a', 'c', 'b'])
  })

  it('scivola solo ciò che muove il puntatore: le mosse da tastiera arrivano subito', () => {
    mockFlipLayout()
    const { animate, restore } = stubAnimate()
    try {
      const onValue = vi.fn()
      render(<LiveList onValue={onValue} />)
      act(() => item('a').focus())
      fireEvent.keyDown(item('a'), { key: 'Enter' })
      fireEvent.keyDown(item('a'), { key: 'ArrowDown' })
      fireEvent.keyDown(item('a'), { key: 'Enter' })
      expect(onValue).toHaveBeenLastCalledWith(['b', 'a', 'c'])
      expect(animate).not.toHaveBeenCalled()
      fireEvent.click(item('c'), { detail: 1 })
      fireEvent.click(screen.getByText('Su', { selector: 'button', exact: false, ignore: 'span' }), { detail: 1 })
      expect(onValue).toHaveBeenLastCalledWith(['b', 'c', 'a'])
      expect(animate).toHaveBeenCalled()
    } finally {
      restore()
    }
  })

  it('orizzontale che va a capo: il puntatore sceglie il posto in ordine di lettura', () => {
    // a e b sulla prima riga, c sotto a sinistra; la lista parte in (0, 0)
    const BOX: Record<string, [number, number]> = { a: [0, 0], b: [110, 0], c: [0, 50] }
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const at = this.dataset.item !== undefined ? BOX[this.dataset.item] : undefined
      return at !== undefined ? new DOMRect(at[0], at[1], 100, 40) : new DOMRect(0, 0, 210, 90)
    })
    const onValue = vi.fn()
    render(<LiveList onValue={onValue} orientation="horizontal" />)
    fireEvent.pointerDown(item('a'), { clientX: 50, clientY: 20, button: 0, pointerId: 1 })
    // sulla seconda riga, a destra del centro di c: dopo b e dopo c
    fireEvent.pointerMove(item('a'), { clientX: 80, clientY: 70, pointerId: 1 })
    const line = document.querySelector('[data-drop-line]') as HTMLElement
    expect(line.style.transform).toBe('translate(104px, 50px)')
    expect(line.style.height).toBe('40px')
    fireEvent.pointerUp(item('a'), { clientX: 80, clientY: 70, pointerId: 1 })
    expect(onValue).toHaveBeenLastCalledWith(['b', 'c', 'a'])
  })

  it('il puntatore trascina un elemento e lo posa dove indica la linea d’arrivo', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const id = this.dataset.item
      const i = id === undefined ? -1 : ['a', 'b', 'c'].indexOf(id)
      return i < 0 ? new DOMRect(0, 0, 300, 150) : new DOMRect(0, i * 50, 300, 40)
    })
    const onValue = vi.fn()
    render(<LiveList onValue={onValue} />)
    fireEvent.pointerDown(item('a'), { clientX: 10, clientY: 20, button: 0, pointerId: 1 })
    fireEvent.pointerMove(item('a'), { clientX: 10, clientY: 130, pointerId: 1 })
    expect(document.querySelector('[data-drop-line]')).not.toBeNull()
    fireEvent.pointerUp(item('a'), { clientX: 10, clientY: 130, pointerId: 1 })
    expect(onValue).toHaveBeenLastCalledWith(['b', 'c', 'a'])
  })
})
