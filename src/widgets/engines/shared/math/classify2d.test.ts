import { describe, expect, it } from 'vitest'
import { createRng } from '../../../../lib/rng'
import { knnClassify } from '../../../../lib/ml/nonparam'
import type { LabeledPoint } from '../../../../lib/ml/nonparam'
import {
  CONTESTED, REJECT, bisector, boxCoverage, boxDecide, boxDistance, circumcenter, classStats, classifier, clipLine, decide,
  evaluate, gaussDecide, lineFromPoints, linearBoundary, lossFromCosts, mdmDecide, predict, regionMap, trainBox, trainGauss,
  trainMdm,
} from './classify2d'
import type { BoxModel, GaussModel, MdmModel, Model2d } from './classify2d'
import { labelFractions } from './grid'
import { clipLineToBox, lineThrough } from '../handleMath'

const twoBlobs = (seed: number, n = 30): LabeledPoint[] => {
  const rng = createRng(seed)
  return Array.from({ length: 2 * n }, (_, i) => {
    const y = i < n ? 0 : 1
    return { x: [rng.normal(y * 3, 0.8), rng.normal(y * 1, 0.5)], y }
  })
}

describe('soglia, retta, perceptron', () => {
  it('soglia su una feature', () => {
    const m: Model2d = { kind: 'threshold', axis: 1, t: 2, below: 0, above: 1 }
    expect(predict(m, [9, 1.9])).toBe(0)
    expect(predict(m, [-9, 2.1])).toBe(1)
  })
  it('retta per due punti: il lato positivo è a sinistra di p → q', () => {
    const l = lineFromPoints([0, 0], [1, 0])
    const m: Model2d = { kind: 'line', w: l.w, b: l.b, positive: 1, negative: 0 }
    expect(predict(m, [0.5, 1])).toBe(1)
    expect(predict(m, [0.5, -1])).toBe(0)
    const d = decide(m, [0.5, 2])
    expect(d.classes).toEqual([0, 1])
    expect(d.scores[1]).toBeCloseTo(2, 14)
  })
  it('perceptron come modello: segno di a₀ + a₁x₁ + a₂x₂', () => {
    const m: Model2d = { kind: 'perceptron', a: [-1, 1, 0], positive: 3, negative: 2 }
    expect(predict(m, [2, 0])).toBe(3)
    expect(predict(m, [0, 0])).toBe(2)
  })
  it('clipLine: il tratto di wᵗx + b = 0 dentro il riquadro', () => {
    const s = clipLine([1, 0], -2, [0, 4], [0, 4])!
    const xs = s.map((p) => p[0])
    const ys = s.map((p) => p[1]).sort()
    expect(xs).toEqual([2, 2])
    expect(ys).toEqual([0, 4])
    expect(clipLine([1, 0], -9, [0, 4], [0, 4])).toBeNull()
    // diagonale
    const d = clipLine([1, 1], -4, [0, 4], [0, 4])!
    expect(d).toHaveLength(2)
    for (const p of d) expect(p[0] + p[1]).toBeCloseTo(4, 14)
  })
  it('una sola geometria della retta: lineFromPoints e clipLine sono lineThrough e clipLineToBox di handleMath', () => {
    const pairs: [[number, number], [number, number]][] = [[[0, 0], [1, 0]], [[1, 2], [-3, 0.5]], [[0.2, -1], [0.2, 4]]]
    for (const [p, q] of pairs) {
      const a = lineFromPoints(p, q)
      const b = lineThrough(p, q)!
      expect(a.w).toEqual(b.w)
      expect(a.b).toBe(b.b)
    }
    // stessa soglia dei punti coincidenti: sotto 1e−12 non c'è una retta (null in handleMath, RangeError qui)
    expect(lineThrough([0, 0], [1e-13, 0])).toBeNull()
    expect(() => lineFromPoints([0, 0], [1e-13, 0])).toThrow(RangeError)
    // clipLine(w, b) ritaglia la stessa retta di clipLineToBox(p, q), anche con w non unitario, nel verso che lascia
    // w a sinistra: w = (2, 0) punta verso x > 2, quindi il verso è verso il basso
    const byW = clipLine([2, 0], -4, [0, 4], [0, 4])!
    const byP = clipLineToBox([2, 3], [2, 1], [0, 4], [0, 4])!
    expect(byW).toEqual(byP)
    expect(byW).toEqual([[2, 4], [2, 0]])
    // una retta che tocca solo uno spigolo non ha un tratto visibile, in tutte e due
    expect(clipLine([1, 1], 0, [0, 4], [0, 4])).toBeNull()
    expect(clipLineToBox([0, 0], [1, -1], [0, 4], [0, 4])).toBeNull()
    expect(clipLine([0, 0], 1, [0, 4], [0, 4])).toBeNull()
  })
})

describe('MDM', () => {
  it('addestramento: un prototipo per classe, il baricentro', () => {
    const data: LabeledPoint[] = [{ x: [0, 0], y: 0 }, { x: [2, 0], y: 0 }, { x: [4, 4], y: 1 }, { x: [6, 4], y: 1 }]
    const m = trainMdm(data)
    expect(m.prototypes).toEqual([{ m: [1, 0], cls: 0 }, { m: [5, 4], cls: 1 }])
  })
  it('classe del prototipo più vicino; g_i(x) = m_iᵗx − ½ m_iᵗm_i ordina come −d²', () => {
    const m: MdmModel = { kind: 'mdm', prototypes: [{ m: [0, 0], cls: 0 }, { m: [4, 0], cls: 1 }, { m: [0, 4], cls: 2 }] }
    expect(predict(m, [1, 0.5])).toBe(0)
    expect(predict(m, [3.5, 1])).toBe(1)
    const det = mdmDecide(m, [1, 3])
    expect(det.label).toBe(2)
    expect(det.distances[0]).toBeCloseTo(Math.hypot(1, 3), 14)
    // g_i − g_j = ½(d_j² − d_i²)
    expect(det.g[2] - det.g[0]).toBeCloseTo(0.5 * (det.distances[0] ** 2 - det.distances[2] ** 2), 12)
  })
  it('frontiera: asse del segmento; punto triplo nel circocentro', () => {
    const b = bisector([0, 0], [4, 0])
    expect(b.w).toEqual([-4, 0])
    expect(b.x0).toEqual([2, 0])
    expect(circumcenter([0, 0], [4, 0], [0, 4])).toEqual([2, 2])
    expect(circumcenter([0, 0], [1, 1], [2, 2])).toBeNull()
  })
  it('metriche: Mahalanobis cambia la decisione, L1 e L∞ le distanze', () => {
    const base = { kind: 'mdm' as const, prototypes: [{ m: [0, 0] as const, cls: 0 }, { m: [3, 3] as const, cls: 1 }] }
    expect(predict(base, [3, 1])).toBe(1)
    expect(predict({ ...base, metric: 'mahalanobis', Sigma: [[9, 0], [0, 1]] }, [3, 1])).toBe(0)
    expect(mdmDecide({ ...base, metric: 'l1' }, [3, 1]).distances).toEqual([4, 2])
    expect(mdmDecide({ ...base, metric: 'linf' }, [3, 1]).distances).toEqual([3, 2])
  })
  it('più prototipi per classe: vince la classe del prototipo più vicino', () => {
    const m: MdmModel = { kind: 'mdm', prototypes: [{ m: [0, 0], cls: 0 }, { m: [10, 0], cls: 0 }, { m: [5, 0], cls: 1 }] }
    expect(predict(m, [9, 0])).toBe(0)
    expect(predict(m, [6, 0])).toBe(1)
  })
})

describe('Box', () => {
  const box: BoxModel = {
    kind: 'box',
    boxes: [
      { cls: 0, m: [0, 0], sd: [1, 2], alpha: 1, prior: 0.8 },
      { cls: 1, m: [1.5, 0], sd: [1, 1], alpha: 1, prior: 0.2 },
    ],
  }
  it('dentro un solo box: la sua classe', () => {
    expect(predict(box, [-0.5, 1.5])).toBe(0)
    expect(predict(box, [2, 0])).toBe(1)
  })
  it('sovrapposizione: contesa, oppure 1/V maggiore, oppure P/V maggiore', () => {
    expect(predict(box, [0.8, 0])).toBe(CONTESTED)
    const d = boxDecide(box, [0.8, 0])
    expect(d.inside).toEqual([true, true])
    expect(d.volumes).toEqual([8, 4])
    expect(predict({ ...box, overlap: 'density' }, [0.8, 0])).toBe(1)
    expect(predict({ ...box, overlap: 'posterior' }, [0.8, 0])).toBe(0)
  })
  it('fuori da tutti: rifiuto, bordo più vicino, media più vicina o distanza normalizzata', () => {
    expect(predict(box, [5, 0])).toBe(REJECT)
    expect(predict({ ...box, outside: 'nearest-box' }, [5, 0])).toBe(1)
    expect(boxDistance([5, 0], box.boxes[1])).toBeCloseTo(2.5, 14)
    expect(boxDistance([0, 3], box.boxes[1])).toBeCloseTo(Math.sqrt(0.25 + 4), 14)
    expect(predict({ ...box, outside: 'nearest-box' }, [0, 3])).toBe(0)
    expect(predict({ ...box, outside: 'normalized' }, [0, 3])).toBe(0)
    expect(boxDecide(box, [0, 3]).r).toEqual([2.25, 11.25])
    expect(predict({ ...box, outside: 'nearest-mean' }, [5, 0])).toBe(1)
  })
  it('addestramento con α: box m_ij ± α σ_ij (σ con 1/N_i) e copertura erf(α/√2)ⁿ', () => {
    const data: LabeledPoint[] = [{ x: [0, 0], y: 0 }, { x: [2, 4], y: 0 }, { x: [10, 10], y: 1 }, { x: [12, 10], y: 1 }]
    const m = trainBox(data, 2)
    expect(m.boxes[0].m).toEqual([1, 2])
    expect(m.boxes[0].sd).toEqual([1, 2])
    expect(m.boxes[0].alpha).toBe(2)
    expect(m.boxes[1].sd).toEqual([1, 0])
    expect(boxCoverage(1, 1)).toBeCloseTo(0.6826894921370859, 14)
    expect(boxCoverage(1, 2)).toBeCloseTo(0.6826894921370859 ** 2, 14)
    expect(boxCoverage(Math.sqrt(3), 1)).toBeCloseTo(0.9167354833364495, 12)
  })
})

describe('gaussiano / Bayes', () => {
  const sigma2 = 1.5
  const g = (P0: number): GaussModel => ({
    kind: 'gauss',
    classes: [
      { cls: 0, m: [0, 0], S: [[sigma2, 0], [0, sigma2]], P: P0 },
      { cls: 1, m: [4, 2], S: [[sigma2, 0], [0, sigma2]], P: 1 - P0 },
    ],
  })
  it('prior uguali e Σ = σ²I: coincide con l\'MDM (m16-mdm-come-bayes)', () => {
    const mdm = trainMdm([{ x: [0, 0], y: 0 }, { x: [4, 2], y: 1 }])
    const rng = createRng(2)
    for (let k = 0; k < 200; k++) {
      const x = [rng.float(-3, 7), rng.float(-3, 5)] as const
      expect(predict(g(0.5), x)).toBe(predict(mdm, x))
    }
  })
  it('prior diversi: la frontiera passa per x₀ = ½(m_i + m_j) − σ²/‖m_i − m_j‖² ln(P_i/P_j)(m_i − m_j)', () => {
    const P0 = 0.8
    const lb = linearBoundary([0, 0], [4, 2], [[sigma2, 0], [0, sigma2]], P0, 1 - P0)!
    const d2 = 16 + 4
    const k = (sigma2 / d2) * Math.log(P0 / (1 - P0))
    expect(lb.x0[0]).toBeCloseTo(2 - k * -4, 12)
    expect(lb.x0[1]).toBeCloseTo(1 - k * -2, 12)
    const det = gaussDecide(g(P0), lb.x0)
    expect(det.g[0]).toBeCloseTo(det.g[1], 10)
    // la frontiera si allontana dalla classe più probabile
    expect(predict(g(P0), [2, 1])).toBe(0)
  })
  it('posteriori che sommano a 1; regola ML ignora i prior', () => {
    const d = gaussDecide(g(0.9), [2.5, 1.2])
    expect(d.posteriors[0] + d.posteriors[1]).toBeCloseTo(1, 14)
    expect(gaussDecide({ ...g(0.9), rule: 'ml' }, [2.5, 1.2]).label).toBe(1)
    expect(d.label).toBe(0)
  })
  it('rischio minimo con i costi per classe = MAP con prior pesati dai costi', () => {
    const loss = lossFromCosts([5, 1])
    expect(loss).toEqual([[0, 1], [5, 0]])
    const risky: GaussModel = { ...g(0.5), rule: 'min-risk', loss }
    const weighted = g(5 / 6)
    const rng = createRng(8)
    for (let k = 0; k < 200; k++) {
      const x = [rng.float(-3, 7), rng.float(-3, 5)] as const
      expect(predict(risky, x)).toBe(predict(weighted, x))
    }
    const r = gaussDecide(risky, [2, 1])
    expect(r.risks).toHaveLength(2)
    expect(r.label).toBe(0)
  })
  it('addestramento: medie e covarianze per classe; condivisa, diagonale, sferica', () => {
    const data: LabeledPoint[] = [
      { x: [0, 0], y: 0 }, { x: [2, 2], y: 0 }, { x: [0, 2], y: 0 }, { x: [2, 0], y: 0 },
      { x: [10, 0], y: 1 }, { x: [12, 4], y: 1 },
    ]
    const st = classStats(data)
    expect(st[0].m).toEqual([1, 1])
    expect(st[0].S).toEqual([[1, 0], [0, 1]])
    expect(st[1].S).toEqual([[1, 2], [2, 4]])
    const full = trainGauss(data)
    expect(full.classes[0].P).toBeCloseTo(4 / 6, 14)
    const shared = trainGauss(data, { covariance: 'shared' })
    expect(shared.classes[0].S).toEqual(shared.classes[1].S)
    expect(shared.classes[1].S[1][1]).toBeCloseTo((4 * 1 + 2 * 4) / 6, 14)
    expect(trainGauss(data, { covariance: 'diagonal' }).classes[1].S).toEqual([[1, 0], [0, 4]])
    expect(trainGauss(data, { covariance: 'spherical' }).classes[1].S).toEqual([[2.5, 0], [0, 2.5]])
    expect(trainGauss(data, { priors: 'equal' }).classes[1].P).toBe(0.5)
  })
})

describe('K-NN e Parzen come classificatori', () => {
  const data = twoBlobs(5)
  it('K-NN: stessa etichetta di knnClassify di src/lib/ml', () => {
    const rng = createRng(1)
    for (let k = 0; k < 50; k++) {
      const x = [rng.float(-2, 5), rng.float(-2, 3)]
      expect(predict({ kind: 'knn', data, k: 5 }, [x[0], x[1]])).toBe(knnClassify(x, data, 5))
    }
    expect(decide({ kind: 'knn', data, k: 5 }, [0, 0]).scores.reduce((s, v) => s + v, 0)).toBe(5)
  })
  it('Parzen: argmax P_i p̂_i(x); con finestra quadrata vuota il punto resta non classificato', () => {
    const tiny: LabeledPoint[] = [{ x: [0, 0], y: 0 }, { x: [2, 0], y: 1 }]
    expect(predict({ kind: 'parzen', data: tiny, h: 0.5 }, [0.9, 0])).toBe(0)
    expect(predict({ kind: 'parzen', data: tiny, h: 0.5 }, [1.1, 0])).toBe(1)
    expect(predict({ kind: 'parzen', data: tiny, h: 0.5, window: 'box' }, [1, 0])).toBe(REJECT)
    expect(predict({ kind: 'parzen', data: tiny, h: 0.5, window: 'box' }, [0.2, 0.1])).toBe(0)
  })
})

describe('carte e valutazione', () => {
  it('regioni su griglia: MDM simmetrico divide il riquadro a metà', () => {
    const m = trainMdm([{ x: [-1, 0], y: 0 }, { x: [1, 0], y: 1 }])
    const map = regionMap(m, [-2, 2], [-1, 1], 40, 20)
    const f = labelFractions(map.labels)
    expect(f.get(0)).toBeCloseTo(0.5, 14)
    expect(f.get(1)).toBeCloseTo(0.5, 14)
  })
  it('classifier(model) compilato dà le stesse etichette di predict', () => {
    const data = twoBlobs(3)
    const models: Model2d[] = [trainGauss(data), trainBox(data, 2), trainMdm(data), { kind: 'knn', data, k: 3 }, { kind: 'parzen', data, h: 0.6 }]
    const rng = createRng(6)
    for (const m of models) {
      const f = classifier(m)
      for (let k = 0; k < 40; k++) {
        const x = rng.float(-2, 5)
        const y = rng.float(-2, 3)
        expect(f(x, y)).toBe(predict(m, [x, y]))
      }
    }
  })
  it('valutazione: errori, rifiuti, tasso e matrice di confusione', () => {
    const data: LabeledPoint[] = [{ x: [0, 0], y: 0 }, { x: [0.5, 0], y: 0 }, { x: [3, 0], y: 0 }, { x: [4, 0], y: 1 }, { x: [9, 9], y: 1 }]
    const m: Model2d = { kind: 'box', boxes: [{ cls: 0, m: [0, 0], sd: [1, 1], alpha: 1 }, { cls: 1, m: [3.5, 0], sd: [1, 1], alpha: 1 }] }
    const e = evaluate(m, data)
    expect(e.n).toBe(5)
    expect(e.errors).toBe(1)
    expect(e.wrong).toEqual([2])
    expect(e.rejected).toBe(1)
    expect(e.rate).toBeCloseTo(0.2, 14)
    expect(e.classes).toEqual([0, 1])
    expect(e.confusion).toEqual([[2, 1], [0, 1]])
  })
})
