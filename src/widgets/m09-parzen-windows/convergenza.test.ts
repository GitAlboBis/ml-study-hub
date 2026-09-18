import { describe, expect, it } from 'vitest'
import { X_STAR, bridgeH, expected, kOf, knnCell, knnLimits, parzenCell, parzenLimits, pool, trace, truth, volumeOf } from './convergenza'

describe('m09-convergenza-parzen-knn: la logica', () => {
  it('p(x*) = 2.65 e i raggi di Parzen della slide: 0.56, 0.40, 0.33, 0.28, 0.18', () => {
    expect(truth(X_STAR)).toBeCloseTo(2.65, 2)
    const r = [1, 4, 9, 16, 100].map((N) => Math.sqrt(volumeOf('radice', N) / Math.PI).toFixed(2))
    expect(r).toEqual(['0.56', '0.40', '0.33', '0.28', '0.18'])
    expect([1, 4, 9, 16, 100].map((N) => kOf('radice', N))).toEqual([1, 2, 3, 4, 10])
  })

  it('Parzen: K contati nel cerchio di area V; K-NN: il cerchio arriva al K-esimo vicino', () => {
    const s = pool().slice(0, 100)
    const p = parzenCell(X_STAR, s, 0.1)
    expect(p.p).toBeCloseTo(p.K / (100 * 0.1), 12)
    const k = knnCell(X_STAR, s, 10)
    expect(k.neighbors).toHaveLength(10)
    expect(k.V).toBeCloseTo(Math.PI * k.r ** 2, 12)
    expect(k.p).toBeCloseTo(10 / (100 * k.V), 12)
  })

  it('le spie con le leggi del docente sono tutte verdi; le leggi sbagliate violano una condizione ciascuna', () => {
    expect(parzenLimits('radice')).toEqual({ V: 'zero', NV: 'inf' })
    expect(knnLimits('radice')).toEqual({ K: 'inf', KN: 'zero' })
    expect(parzenLimits('costante').V).toBe('const')
    expect(parzenLimits('inverso').NV).toBe('const')
    expect(knnLimits('tre').K).toBe('const')
    expect(knnLimits('meta').KN).toBe('const')
  })

  it('le tracce si avvicinano al valore vero a N = 100 con le leggi della slide', () => {
    const t = trace(X_STAR, pool(), 'radice', 'radice')
    expect(t).toHaveLength(10)
    const last = t[t.length - 1]
    expect(Math.abs(last.knn - 2.65)).toBeLessThan(1.5)
    expect(Math.abs(last.parzen - 2.65)).toBeLessThan(1.5)
  })

  it('la sfida: V = 1/N viola N·V → ∞ (varianza), K = N/2 viola K/N → 0 (bias); il ponte dà V = 1/√N', () => {
    expect(expected()).toEqual({ parzen: 'NV', parzenErr: 'varianza', knn: 'KN', knnErr: 'bias' })
    expect(bridgeH(100) ** 2).toBeCloseTo(1 / Math.sqrt(100), 12)
  })
})
