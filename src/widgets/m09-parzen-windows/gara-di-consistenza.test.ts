import { describe, expect, it } from 'vitest'
import { parzen1d } from '../../lib/ml/nonparam'
import { linspace, trapz } from '../../lib/ml/stats'
import { binCounts, kdeFromBins, lawLimits } from './proprieta/teoria'
import {
  A_GRID,
  LAWS,
  PESCE_Z,
  bestA,
  decaySlope,
  errorsAt,
  expected1d,
  fishPool,
  hOf,
  judgeA,
  meanBand,
  pow10Label,
  prefixBins,
  sweepN,
  traces,
  truthSlice,
} from './gara-di-consistenza'

describe('m09-gara-di-consistenza: la logica', () => {
  it('la verità normalizzata ha media 0 e varianza 1', () => {
    const xs = linspace(-6, 6, 4001)
    const p = xs.map((x) => truthSlice(x, 1))
    expect(trapz(xs, p)).toBeCloseTo(1, 5)
    expect(trapz(xs, xs.map((x, i) => x * p[i]))).toBeCloseTo(0, 5)
    expect(trapz(xs, xs.map((x, i) => x * x * p[i]))).toBeCloseTo(1, 4)
    expect(PESCE_Z[0].w).toBe(0.7)
  })

  it('i numeri della specifica: con la legge di Melgani N·h_N = √N va da 3.2 a 316; n = 2, N = 10 000: h = 0.1, N h² = 100', () => {
    const a = LAWS.melgani.a(1)
    expect(10 * hOf(a, 10)).toBeCloseTo(3.162, 3)
    expect(1e5 * hOf(a, 1e5)).toBeCloseTo(316.2, 1)
    const a2 = LAWS.melgani.a(2)
    expect(hOf(a2, 10000)).toBeCloseTo(0.1, 12)
    expect(10000 * hOf(a2, 10000) ** 2).toBeCloseTo(100, 8)
  })

  it('h costante: il bias² resta su un pavimento, la varianza scende', () => {
    const e1 = errorsAt(0, 1, 100)
    const e2 = errorsAt(0, 1, 100000)
    expect(e2.bias2).toBeCloseTo(e1.bias2, 12)
    expect(e2.variance).toBeLessThan(e1.variance / 500)
    expect(lawLimits(0, 1).h).toBe('const')
  })

  it('legge troppo veloce: il bias crolla ma la varianza cresce con N', () => {
    const a = LAWS.veloce.a(1)
    expect(errorsAt(a, 1, 1e5).variance).toBeGreaterThan(errorsAt(a, 1, 100).variance)
    expect(errorsAt(a, 1, 1e5).bias2).toBeLessThan(errorsAt(a, 1, 100).bias2)
    expect(lawLimits(a, 1).nhn).toBe('zero')
  })

  it('con la legge di Melgani tutte e tre le tracce scendono', () => {
    for (const n of [1, 2, 3]) {
      const t = traces(LAWS.melgani.a(n), n)
      expect(t.mise.at(-1)!, `n = ${n}`).toBeLessThan(t.mise[0])
      expect(t.bias2.at(-1)!).toBeLessThan(t.bias2[0])
      expect(t.variance.at(-1)!).toBeLessThan(t.variance[0])
    }
  })

  it('la sfida: per n = 2 il miglior esponente dello slider è 0.20 (teoria 1/(n+4) = 0.167), dentro la zona valida', () => {
    const best = bestA(2)
    expect(best.a).toBe(0.2)
    expect(judgeA(0.2, 2).ok).toBe(true)
    expect(judgeA(0.15, 2).ok).toBe(true)
    // l'esempio di Melgani è valido ma non il più veloce; lo stato iniziale non basta
    expect(judgeA(0.25, 2).ok).toBe(false)
    expect(judgeA(0.25, 2).valid).toBe(true)
    expect(judgeA(0.5, 1).ok).toBe(false)
    // con un altro n la sfida non vale
    expect(judgeA(0.2, 1).ok).toBe(false)
    expect(decaySlope(0.2, 2)).toBeGreaterThan(decaySlope(0.25, 2))
    expect(A_GRID).toContain(0.2)
    expect(A_GRID.at(-1)).toBe(1.5)
  })

  it('media e banda nella fetta 1-D: media = verità convoluta; la banda si stringe con N', () => {
    const b = meanBand(0.3, 1, 0.4, 100)
    expect(b.mean).toBeCloseTo(expected1d(0.3, 0.4), 12)
    expect(meanBand(0.3, 1, 0.4, 10000).sd).toBeCloseTo(b.sd / 10, 10)
  })

  it('la stima da bin coincide con quella esatta sui primi N salmoni', () => {
    const pool = fishPool()
    expect(pool).toHaveLength(100000)
    const s = pool.slice(0, 300)
    const counts = binCounts(s, [-3.5, 3.5], 4000)
    const est = kdeFromBins(counts, 300, [-3.5, 3.5], [-0.5, 0.2, 1.1], 0.3)
    ;[-0.5, 0.2, 1.1].forEach((x, i) => expect(est[i]).toBeCloseTo(parzen1d(x, s, 0.3), 3))
    // i bin del widget (larghi h/10) bastano anche con h grande
    for (const h of [0.08, 0.3, 1]) {
      const pb = prefixBins(pool, 300, h)
      const e2 = kdeFromBins(pb.counts, 300, [-3.5, 3.5], [-0.5, 0.2, 1.1], h)
      ;[-0.5, 0.2, 1.1].forEach((x, i) => expect(e2[i], `h = ${h}`).toBeCloseTo(parzen1d(x, s, h), 2))
    }
  })

  it('corsa di N ed etichette logaritmiche', () => {
    expect(sweepN(0)).toBe(10)
    expect(sweepN(1)).toBe(100000)
    expect(sweepN(0.5)).toBe(1000)
    expect(pow10Label(4)).toBe('10⁴')
    expect(pow10Label(-8)).toBe('10⁻⁸')
  })
})
