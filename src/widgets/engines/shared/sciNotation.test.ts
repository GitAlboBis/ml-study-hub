import { describe, expect, it } from 'vitest'
import { sciParts, spokenSci } from './sciNotation'

describe('sciParts', () => {
  it('notazione scientifica con le cifre significative chieste', () => {
    expect(sciParts({ value: 123456789 }, 3)).toEqual({ kind: 'sci', sign: '', mantissa: '1.23', exponent: 8, plain: '' })
    expect(sciParts({ value: -0.000456 }, 2)).toMatchObject({ kind: 'sci', sign: '−', mantissa: '4.6', exponent: -4 })
  })

  it('il riporto dell\'arrotondamento sale di un esponente (9.996e4 → 1.00e5)', () => {
    expect(sciParts({ value: 99960 }, 3, 'sci')).toMatchObject({ mantissa: '1.00', exponent: 5 })
  })

  it('dal logaritmo: numeri che un double non contiene (10^500) e la sottrazione di underflow (10^-400)', () => {
    expect(sciParts({ log10: 500.30103 }, 3)).toMatchObject({ kind: 'sci', mantissa: '2.00', exponent: 500 })
    expect(sciParts({ log10: -400 }, 3)).toMatchObject({ kind: 'sci', mantissa: '1.00', exponent: -400 })
  })

  it('in automatico gli interi sotto il milione restano per esteso, con gli spazi fini fra le migliaia', () => {
    expect(sciParts({ value: 3628800 }, 3)).toMatchObject({ kind: 'sci', mantissa: '3.63', exponent: 6 })
    expect(sciParts({ value: 45 }, 3)).toEqual({ kind: 'plain', sign: '', mantissa: '', exponent: 0, plain: '45' })
    expect(sciParts({ value: 252000 }, 3).plain).toBe('252 000')
    expect(sciParts({ value: 1234.5 }, 3, 'plain').plain).toBe('1 235')
  })

  it('zero, non numeri, infiniti', () => {
    expect(sciParts({ value: 0 }, 3)).toMatchObject({ kind: 'plain', plain: '0' })
    expect(sciParts({ value: 0 }, 3, 'sci')).toMatchObject({ kind: 'sci', mantissa: '0.00', exponent: 0 })
    expect(sciParts({ value: Number.NaN }).kind).toBe('nan')
    expect(sciParts({ value: Number.POSITIVE_INFINITY }).kind).toBe('inf')
  })
})

describe('spokenSci', () => {
  it('come si legge a voce', () => {
    expect(spokenSci(sciParts({ value: 123456789 }, 3))).toBe('1.23 per 10 alla 8')
    expect(spokenSci(sciParts({ value: -0.000456 }, 2))).toBe('meno 4.6 per 10 alla meno 4')
    expect(spokenSci(sciParts({ value: 252000 }, 3))).toBe('252000')
    expect(spokenSci(sciParts({ value: Number.NaN }))).toBe('non definito')
  })
})
