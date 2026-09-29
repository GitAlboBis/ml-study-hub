import { describe, expect, it } from 'vitest'
import { binContents, binsKey, dropIndex, dropIndexFlow, flowMarkAt, moveInOrder, orderOutcome, placeItem, sortKey, sortOutcome, speakable } from './dragKeyboard'

const ITEMS = ['a', 'b', 'c', 'd']

describe('chip nei contenitori', () => {
  it('placeItem sposta un chip; binContents li elenca nell’ordine degli elementi', () => {
    let p = placeItem({}, 'c', 'x')
    p = placeItem(p, 'a', 'x')
    expect(binContents(ITEMS, p, 'x')).toEqual(['a', 'c'])
    // chi non è posato sta nel vassoio (null)
    expect(binContents(ITEMS, p, null)).toEqual(['b', 'd'])
    p = placeItem(p, 'a', null)
    expect(binContents(ITEMS, p, 'x')).toEqual(['c'])
  })

  it('un contenitore pieno scambia: chi c’era va dove stava il chip che arriva', () => {
    const cap = { s1: 1, s2: 1 }
    let p = placeItem({}, 'a', 's1', cap)
    p = placeItem(p, 'b', 's2', cap)
    p = placeItem(p, 'a', 's2', cap)
    expect(p).toEqual({ a: 's2', b: 's1' })
    // dal vassoio in una casella piena: l'occupante torna nel vassoio
    p = placeItem(p, 'c', 's1', cap)
    expect(p).toEqual({ a: 's2', b: null, c: 's1' })
  })

  it('sortOutcome: giusti, sbagliati, ancora da posare', () => {
    const answer = { a: 'x', b: 'y', c: 'x', d: 'y' }
    const o = sortOutcome({ a: 'x', b: 'x', c: 'x' }, ITEMS, answer)
    expect(o.correct).toEqual(['a', 'c'])
    expect(o.wrong).toEqual(['b'])
    expect(o.missing).toEqual(['d'])
    expect(o.done).toBe(false)
    expect(o.allCorrect).toBe(false)
    expect(sortOutcome(answer, ITEMS, answer).allCorrect).toBe(true)
  })

  it('binsKey: Invio prende, le frecce scelgono il contenitore, Invio posa, Esc annulla', () => {
    const targets = [null, 'x', 'y']
    const place = { a: 'x' }
    // prendere: il primo bersaglio proposto è quello dopo il posto attuale
    let r = binsKey(null, 'Enter', 'a', place, targets)
    expect(r).toEqual({ hold: { item: 'a', target: 'y' } })
    r = binsKey(r!.hold, 'ArrowRight', 'a', place, targets)
    expect(r!.hold!.target).toBe(null)
    r = binsKey(r!.hold, 'ArrowRight', 'a', place, targets)
    expect(r!.hold!.target).toBe('x')
    r = binsKey(r!.hold, 'ArrowLeft', 'a', place, targets)
    expect(r!.hold!.target).toBe(null)
    const drop = binsKey(r!.hold, ' ', 'a', place, targets)
    expect(drop).toEqual({ hold: null, drop: { item: 'a', target: null } })
    const cancel = binsKey({ item: 'a', target: 'y' }, 'Escape', 'a', place, targets)
    expect(cancel).toEqual({ hold: null, cancel: true })
    // senza presa le frecce non riguardano il contenitore (spostano il fuoco: lo decide il componente)
    expect(binsKey(null, 'ArrowRight', 'a', place, targets)).toBeNull()
    expect(binsKey(null, 'Escape', 'a', place, targets)).toBeNull()
  })
})

describe('liste riordinabili', () => {
  it('moveInOrder porta un elemento in una posizione', () => {
    expect(moveInOrder(ITEMS, 'a', 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveInOrder(ITEMS, 'd', 0)).toEqual(['d', 'a', 'b', 'c'])
    expect(moveInOrder(ITEMS, 'b', 99)).toEqual(['a', 'c', 'd', 'b'])
    expect(moveInOrder(ITEMS, 'z', 1)).toEqual(ITEMS)
  })

  it('dropIndex: posizione d’arrivo dal puntatore, contando i centri degli altri elementi', () => {
    const mids = [10, 30, 50]
    expect(dropIndex(mids, 5)).toBe(0)
    expect(dropIndex(mids, 31)).toBe(2)
    expect(dropIndex(mids, 99)).toBe(3)
  })

  // una lista orizzontale che va a capo: due elementi sulla prima riga, uno sulla seconda
  const FLOW = [
    { left: 0, top: 0, right: 100, bottom: 40 },
    { left: 110, top: 0, right: 210, bottom: 40 },
    { left: 0, top: 50, right: 100, bottom: 90 },
  ]

  it('dropIndexFlow: in una lista che va a capo contano gli elementi prima del puntatore in ordine di lettura', () => {
    expect(dropIndexFlow(FLOW, 20, 20)).toBe(0)
    expect(dropIndexFlow(FLOW, 80, 20)).toBe(1)
    // in fondo alla prima riga: dopo i due della riga, non dopo quello sotto
    expect(dropIndexFlow(FLOW, 300, 20)).toBe(2)
    expect(dropIndexFlow(FLOW, 20, 70)).toBe(2)
    expect(dropIndexFlow(FLOW, 80, 70)).toBe(3)
    // fra le due righe: la prima riga intera sta prima
    expect(dropIndexFlow(FLOW, 80, 45)).toBe(2)
    expect(dropIndexFlow(FLOW, 80, -10)).toBe(0)
  })

  it('flowMarkAt: la linea d’arrivo sta in fondo alla riga del puntatore o in testa alla riga dopo', () => {
    expect(flowMarkAt(FLOW, 2, 20)).toEqual({ x: 214, y: 0, h: 40 })
    expect(flowMarkAt(FLOW, 2, 70)).toEqual({ x: -4, y: 50, h: 40 })
    expect(flowMarkAt(FLOW, 0, 20)).toEqual({ x: -4, y: 0, h: 40 })
    expect(flowMarkAt(FLOW, 3, 70)).toEqual({ x: 104, y: 50, h: 40 })
    expect(flowMarkAt([], 0, 0)).toEqual({ x: 0, y: 0, h: 0 })
  })

  it('sortKey: Invio prende, frecce spostano, Invio posa, Esc rimette com’era', () => {
    let r = sortKey(null, 'Enter', 'b', ITEMS, 'vertical')
    expect(r).toEqual({ hold: { item: 'b', origin: ITEMS }, order: ITEMS })
    r = sortKey(r!.hold, 'ArrowDown', 'b', r!.order, 'vertical')
    expect(r!.order).toEqual(['a', 'c', 'b', 'd'])
    r = sortKey(r!.hold, 'ArrowDown', 'b', r!.order, 'vertical')
    expect(r!.order).toEqual(['a', 'c', 'd', 'b'])
    // in fondo resta in fondo
    r = sortKey(r!.hold, 'ArrowDown', 'b', r!.order, 'vertical')
    expect(r!.order).toEqual(['a', 'c', 'd', 'b'])
    r = sortKey(r!.hold, 'Home', 'b', r!.order, 'vertical')
    expect(r!.order).toEqual(['b', 'a', 'c', 'd'])
    const esc = sortKey(r!.hold, 'Escape', 'b', r!.order, 'vertical')
    expect(esc).toEqual({ hold: null, order: ITEMS, cancel: true })
    const drop = sortKey(r!.hold, 'Enter', 'b', r!.order, 'vertical')
    expect(drop).toEqual({ hold: null, order: ['b', 'a', 'c', 'd'], dropped: 'b' })
  })

  it('sortKey orizzontale usa sinistra e destra; senza presa le frecce spostano il fuoco', () => {
    const r = sortKey({ item: 'a', origin: ITEMS }, 'ArrowRight', 'a', ITEMS, 'horizontal')
    expect(r!.order).toEqual(['b', 'a', 'c', 'd'])
    expect(sortKey(null, 'ArrowDown', 'b', ITEMS, 'vertical')).toEqual({ hold: null, order: ITEMS, focus: 'c' })
    expect(sortKey(null, 'ArrowUp', 'a', ITEMS, 'vertical')).toEqual({ hold: null, order: ITEMS, focus: 'a' })
    expect(sortKey(null, 'End', 'a', ITEMS, 'vertical')).toEqual({ hold: null, order: ITEMS, focus: 'd' })
    expect(sortKey(null, 'x', 'a', ITEMS, 'vertical')).toBeNull()
  })

  it('orderOutcome conta le posizioni giuste', () => {
    expect(orderOutcome(['a', 'c', 'b', 'd'], ITEMS)).toEqual({ correct: 2, total: 4, allCorrect: false, wrong: ['c', 'b'] })
    expect(orderOutcome(ITEMS, ITEMS).allCorrect).toBe(true)
  })
})

describe('nomi parlati', () => {
  it('speakable toglie la marcatura TeX da un testo con formule', () => {
    expect(speakable('Stima $\\hat{\\theta}_{ML}$')).toBe('Stima theta ML')
    expect(speakable('**Parzen** con $h$')).toBe('Parzen con h')
    expect(speakable('K-NN')).toBe('K-NN')
  })
})
