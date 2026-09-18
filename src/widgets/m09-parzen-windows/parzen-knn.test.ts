import { describe, expect, it } from 'vitest'
import { parzen1d } from '../../lib/ml/nonparam'
import { INITIAL, TABLE, areaOn, judge, knnAt, parzenAt, pool, slideParams } from './parzen-knn'

describe('m09-parzen-contro-knn: la logica', () => {
  const s16 = pool().slice(0, 16)

  it('K = √N e h = 1/√N come nelle slide: (1, 1), (4, 0.25), (16, 0.0625)', () => {
    expect(slideParams(1)).toEqual({ h: 1, K: 1 })
    expect(slideParams(16)).toEqual({ h: 0.25, K: 4 })
    expect(slideParams(256)).toEqual({ h: 0.0625, K: 16 })
  })

  it('Parzen rettangolare = K/(N h) con K contato; gaussiano = libreria', () => {
    const a = parzenAt(1.5, s16, 0.5, 'rettangolare')
    expect(a.p).toBeCloseTo(a.K / (16 * 0.5), 12)
    expect(parzenAt(1.5, s16, 0.5, 'gaussiano').p).toBeCloseTo(parzen1d(1.5, s16, 0.5, 'gaussiano'), 12)
  })

  it('K-NN: V = 2 r_K e p̂ = K/(N V); dove i campioni sono radi la cella si allarga', () => {
    const dense = knnAt(1.5, s16, 4)
    const sparse = knnAt(2.8, s16, 4)
    expect(dense.p).toBeCloseTo(4 / (16 * dense.V), 12)
    expect(sparse.V).toBeGreaterThan(dense.V)
  })

  it('l’area: Parzen con kernel gaussiano vale circa 1 su un dominio largo; il K-NN supera 1 e cresce allargando il dominio', () => {
    const pa = areaOn((x) => parzenAt(x, s16, INITIAL.h, 'gaussiano').p, [-4, 8])
    expect(pa).toBeCloseTo(1, 2)
    const k4 = areaOn((x) => knnAt(x, s16, 4).p, [0, 4])
    const k8 = areaOn((x) => knnAt(x, s16, 4).p, [-4, 8])
    expect(k4).toBeGreaterThan(1)
    expect(k8).toBeGreaterThan(k4)
  })

  it('la sfida: fra i due modi Parzen rettangolare vale 0, il K-NN no', () => {
    const r = judge(2.75, s16, 0.25, 4, 'rettangolare', 'cresce')
    expect(r.parzen).toBe(0)
    expect(r.knn).toBeGreaterThan(0)
    expect(r.ok).toBe(true)
    expect(judge(2.75, s16, 0.25, 4, 'gaussiano', 'cresce').ok).toBe(false)
    expect(judge(2.75, s16, 0.25, 4, 'rettangolare', 'kernel').ok).toBe(false)
    expect(judge(INITIAL.x, s16, INITIAL.h, INITIAL.K, 'rettangolare', 'cresce').ok).toBe(false)
    expect(TABLE).toHaveLength(8)
  })
})
