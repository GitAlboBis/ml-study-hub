import { describe, expect, it } from 'vitest'
import { spechtDensity } from '../../lib/ml/nonparam'
import { INITIAL, PER_CLASS, SIGMA_STEPS, accuracy, forward, neuronSigmas, targetSigma, training, validation } from './pnn'

describe('m09-pnn-rete-probabilistica: la logica', () => {
  it('20 pesci per classe, i salmoni uguali per ogni forma della spigola', () => {
    const a = training('gauss')
    const b = training('banana')
    expect(a.pts).toHaveLength(2 * PER_CLASS)
    expect(a.pts.slice(0, PER_CLASS)).toEqual(b.pts.slice(0, PER_CLASS))
    expect(a.cls.filter((c) => c === 1)).toHaveLength(PER_CLASS)
  })

  it('lo strato di somma è la stima di Specht di ogni classe; la decisione è la regola di Bayes', () => {
    const t = training('gruppi')
    const s = neuronSigmas(t, 0.4, false)
    const f = forward([0.3, 0.2], t, s, 0.5)
    expect(f.dens[0]).toBeCloseTo(spechtDensity([0.3, 0.2], t.pts.slice(0, PER_CLASS), 0.4), 12)
    expect(f.dens[1]).toBeCloseTo(spechtDensity([0.3, 0.2], t.pts.slice(PER_CLASS), 0.4), 12)
    expect(f.decision).toBe(f.joint[0] >= f.joint[1] ? 0 : 1)
    // un prior estremo sposta la decisione
    const g = forward([0.6, 0.3], t, s, 0.9)
    const h = forward([0.6, 0.3], t, s, 0.1)
    expect(g.joint[0] / g.joint[1]).toBeGreaterThan(h.joint[0] / h.joint[1])
    expect(f.act.every((a) => a > 0 && a <= 1)).toBe(true)
  })

  it('σ adattiva: σ_k dai 3 vicini della stessa classe', () => {
    const t = training('gauss')
    const s = neuronSigmas(t, 0.4, true)
    expect(new Set(s).size).toBeGreaterThan(10)
  })

  it('la sfida è tarata: con i due gruppi la σ vincente è 0.9, con la banana 0.5; lo stato iniziale non basta', () => {
    expect(targetSigma('gruppi')).toEqual({ sigma: 0.9, acc: 1 })
    expect(targetSigma('banana')).toEqual({ sigma: 0.5, acc: 1 })
    expect(accuracy(validation('gruppi'), training('gruppi'), INITIAL.sigma)).toBeLessThan(1)
    // σ grande: il confine diventa quasi rettilineo e sbaglia i gruppi laterali
    expect(accuracy(validation('gruppi'), training('gruppi'), 2)).toBeLessThan(0.7)
    expect(SIGMA_STEPS).toContain(0.9)
  })
})
