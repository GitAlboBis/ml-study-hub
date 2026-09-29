import { describe, expect, it } from 'vitest'
import { cellText, divStep, gridMove, seqStep, toFraction } from './matrixCells'

describe('frazioni esatte', () => {
  it('riconosce le frazioni con denominatore piccolo', () => {
    expect(toFraction(0.75)).toEqual({ n: 3, d: 4 })
    expect(toFraction(-1 / 3)).toEqual({ n: -1, d: 3 })
    expect(toFraction(0.1)).toEqual({ n: 1, d: 10 })
    expect(toFraction(2)).toEqual({ n: 2, d: 1 })
    expect(toFraction(0)).toEqual({ n: 0, d: 1 })
    expect(toFraction(17 / 48)).toEqual({ n: 17, d: 48 })
  })

  it('un numero che non è una frazione piccola resta decimale', () => {
    expect(toFraction(Math.PI)).toBeNull()
    expect(toFraction(Math.SQRT2)).toBeNull()
    expect(toFraction(1 / 97, 64)).toBeNull()
    expect(toFraction(Number.NaN)).toBeNull()
  })
})

describe('testo delle celle', () => {
  it('decimali fissi con il meno tipografico, parlato con "meno"', () => {
    expect(cellText(-0.5, { mode: 'decimal', decimals: 2 })).toEqual({ text: '−0.50', spoken: 'meno 0.50' })
    expect(cellText(1.234, { mode: 'decimal', decimals: 1 })).toEqual({ text: '1.2', spoken: '1.2' })
    // -0.001 a due decimali è zero, senza segno
    expect(cellText(-0.001, { mode: 'decimal', decimals: 2 }).text).toBe('0.00')
  })

  it('frazioni: la parte da impilare e il parlato "su"', () => {
    const c = cellText(-0.75, { mode: 'fraction' })
    expect(c.frac).toEqual({ n: -3, d: 4 })
    expect(c.text).toBe('−3/4')
    expect(c.spoken).toBe('meno 3 su 4')
    // un intero non si scrive come frazione
    expect(cellText(3, { mode: 'fraction' }).frac).toBeUndefined()
    expect(cellText(3, { mode: 'fraction' }).text).toBe('3')
    // auto: frazione se esatta, altrimenti decimale
    expect(cellText(Math.PI, { mode: 'auto', decimals: 3 }).text).toBe('3.142')
    expect(cellText(0.5, { mode: 'auto' }).frac).toEqual({ n: 1, d: 2 })
  })

  it('frazione data a mano, anche non ridotta, e cella celata', () => {
    expect(cellText({ n: 2, d: 4 }, { mode: 'decimal' }).frac).toEqual({ n: 1, d: 2 })
    expect(cellText({ n: 6, d: -3 }, { mode: 'decimal' }).text).toBe('−2')
    expect(cellText(null, { mode: 'decimal' })).toEqual({ text: '?', spoken: 'non ancora calcolata' })
  })
})

describe('colormap', () => {
  it('divergente simmetrica attorno allo zero: 7 passi, il grigio al centro', () => {
    expect(divStep(0, 1)).toBe(4)
    expect(divStep(1, 1)).toBe(7)
    expect(divStep(-1, 1)).toBe(1)
    expect(divStep(0.5, 1)).toBe(6)
    expect(divStep(-0.2, 1)).toBe(3)
    expect(divStep(5, 1)).toBe(7)
    expect(divStep(Number.NaN, 1)).toBeNull()
    expect(divStep(0.3, 0)).toBe(4)
  })

  it('sequenziale da poco a tanto', () => {
    expect(seqStep(0, 0, 1)).toBe(1)
    expect(seqStep(1, 0, 1)).toBe(7)
    expect(seqStep(0.5, 0, 1)).toBe(4)
    expect(seqStep(2, 0, 1)).toBe(7)
  })
})

describe('tastiera della griglia', () => {
  it('frecce, Inizio e Fine della riga, Ctrl+Inizio e Ctrl+Fine della matrice', () => {
    expect(gridMove([0, 0], 'ArrowRight', false, 3, 3)).toEqual([0, 1])
    expect(gridMove([0, 2], 'ArrowRight', false, 3, 3)).toEqual([0, 2])
    expect(gridMove([1, 1], 'ArrowUp', false, 3, 3)).toEqual([0, 1])
    expect(gridMove([2, 1], 'ArrowDown', false, 3, 3)).toEqual([2, 1])
    expect(gridMove([1, 1], 'Home', false, 3, 3)).toEqual([1, 0])
    expect(gridMove([1, 1], 'End', false, 3, 3)).toEqual([1, 2])
    expect(gridMove([1, 1], 'Home', true, 3, 3)).toEqual([0, 0])
    expect(gridMove([1, 1], 'End', true, 3, 3)).toEqual([2, 2])
    expect(gridMove([1, 1], 'x', false, 3, 3)).toBeNull()
  })
})
