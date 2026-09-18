import { describe, expect, it } from 'vitest'
import { createRng } from '../rng'
import { FISH_FEATURES, fishDataset, fishDensity, fishMeta, fishTruth } from './fish'
import type { FishFeature, FishLabel, FishOptions, FishSample } from './fish'
import {
  ANOMALY_CLASS,
  SENSOR_QUANTITIES,
  sensorsAnomalyBands,
  sensorsAnomalyDataset,
  sensorsDataset,
  sensorsDensity,
  sensorsMeta,
  sensorsMixture,
} from './sensors'
import type { SensorSample, SensorsOptions } from './sensors'
import type { DatasetGenerator, DatasetMeta, Sample } from './types'

// ---------------------------------------------------------------------------------------------
// Attrezzi numerici del test (la libreria src/lib/ml arriva con un altro task: qui non la si usa)
// ---------------------------------------------------------------------------------------------

const linspace = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))
const trapz = (xs: number[], ys: number[]) => {
  let s = 0
  for (let i = 1; i < xs.length; i++) s += ((xs[i] - xs[i - 1]) * (ys[i] + ys[i - 1])) / 2
  return s
}
const integrate = (f: (x: number) => number, a: number, b: number, n = 4001) => {
  const xs = linspace(a, b, n)
  return trapz(xs, xs.map(f))
}
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
const cov = (xs: number[], ys: number[]) => {
  const mx = mean(xs), my = mean(ys)
  return xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.length
}
const column = (rows: { x: number[] }[], j: number) => rows.map((r) => r.x[j])
const ofClass = (rows: FishSample[], label: FishLabel) => rows.filter((r) => r.label === label)

// ---------------------------------------------------------------------------------------------
// pesce: salmone vs spigola
// ---------------------------------------------------------------------------------------------

describe('fishDataset', () => {
  it('è deterministico per seed', () => {
    expect(fishDataset(createRng(42))).toEqual(fishDataset(createRng(42)))
    expect(fishDataset(createRng(42))).not.toEqual(fishDataset(createRng(43)))
  })

  it('ha la forma del contratto: x con le tre feature, y 0/1 coerente con label', () => {
    const data = fishDataset(createRng(1))
    expect(data).toHaveLength(100)
    for (const s of data) {
      expect(s.x).toHaveLength(3)
      expect(s.x.every(Number.isFinite)).toBe(true)
      expect([0, 1]).toContain(s.y)
      expect(s.label).toBe(fishMeta.classNames[s.y])
    }
    expect(fishMeta.classNames).toEqual(['salmone', 'spigola'])
    expect(FISH_FEATURES).toEqual(['luminosita', 'larghezza', 'lunghezza'])
  })

  it('features sceglie e ordina le colonne senza cambiare i pesci estratti', () => {
    const all = fishDataset(createRng(7), { n: 40 })
    const two = fishDataset(createRng(7), { n: 40, features: ['larghezza', 'luminosita'] })
    const one = fishDataset(createRng(7), { n: 40, features: ['lunghezza'] })
    expect(two.map((s) => s.x)).toEqual(all.map((s) => [s.x[1], s.x[0]]))
    expect(one.map((s) => s.x)).toEqual(all.map((s) => [s.x[2]]))
    expect(two.map((s) => s.label)).toEqual(all.map((s) => s.label))
  })

  it('bilancia le classi secondo opts', () => {
    const count = (rows: FishSample[]) => [ofClass(rows, 'salmone').length, ofClass(rows, 'spigola').length]
    expect(count(fishDataset(createRng(3)))).toEqual([50, 50])
    expect(count(fishDataset(createRng(3), { n: 80 }))).toEqual([40, 40])
    // n dispari: il pesce in più è un salmone
    expect(count(fishDataset(createRng(3), { n: 101 }))).toEqual([51, 50])
    // pSalmone è la quota di salmoni (la prior del classificatore bayesiano)
    expect(count(fishDataset(createRng(3), { n: 200, pSalmone: 0.3 }))).toEqual([60, 140])
    expect(count(fishDataset(createRng(3), { n: 10, pSalmone: 1 }))).toEqual([10, 0])
    expect(count(fishDataset(createRng(3), { n: 10, pSalmone: 0 }))).toEqual([0, 10])
    expect(fishDataset(createRng(3), { n: 0 })).toEqual([])
  })

  it('mescola le classi: i pesci arrivano sul nastro in ordine casuale', () => {
    const labels = fishDataset(createRng(5), { n: 60 }).map((s) => s.y)
    const firstHalf = labels.slice(0, 30).reduce((s: number, y) => s + y, 0)
    expect(firstHalf).toBeGreaterThan(5)
    expect(firstHalf).toBeLessThan(25)
  })

  it('rifiuta opzioni senza senso con un errore chiaro', () => {
    expect(() => fishDataset(createRng(1), { n: -1 })).toThrow(/n/)
    expect(() => fishDataset(createRng(1), { n: 2.5 })).toThrow(/n/)
    expect(() => fishDataset(createRng(1), { pSalmone: 1.2 })).toThrow(/pSalmone/)
    expect(() => fishDataset(createRng(1), { features: [] })).toThrow(/feature/)
    expect(() => fishDataset(createRng(1), { features: ['luminosita', 'luminosita'] })).toThrow(/feature/)
    expect(() => fishDataset(createRng(1), { features: ['peso' as never] })).toThrow(/peso/)
  })

  it('resta nelle unità dichiarate: luminosità in [0, 10], misure in cm positive e plausibili', () => {
    const data = fishDataset(createRng(11), { n: 20000 })
    const lum = column(data, 0)
    expect(Math.min(...lum)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...lum)).toBeLessThanOrEqual(10)
    FISH_FEATURES.forEach((f, j) => {
      const [lo, hi] = fishMeta.ranges[f]
      const inside = column(data, j).filter((v) => v >= lo && v <= hi).length
      expect(inside / data.length).toBeGreaterThan(0.999)
    })
    expect(Math.min(...column(data, 1))).toBeGreaterThan(0)
    expect(Math.min(...column(data, 2))).toBeGreaterThan(0)
  })

  it('i parametri veri dichiarati sono quelli dei campioni', () => {
    const data = fishDataset(createRng(13), { n: 40000 })
    const truth = fishTruth()
    for (const label of fishMeta.classNames) {
      const rows = ofClass(data, label)
      const { mean: m, cov: c } = truth[label]
      expect(m).toHaveLength(3)
      expect(c.map((r) => r.length)).toEqual([3, 3, 3])
      for (let i = 0; i < 3; i++) {
        const sd = Math.sqrt(c[i][i])
        expect(Math.abs(mean(column(rows, i)) - m[i])).toBeLessThan(0.04 * sd)
        for (let j = 0; j < 3; j++) {
          expect(c[i][j]).toBeCloseTo(c[j][i], 12)
          const scale = Math.sqrt(c[i][i] * c[j][j])
          expect(Math.abs(cov(column(rows, i), column(rows, j)) - c[i][j])).toBeLessThan(0.04 * scale)
        }
      }
    }
    // la sottoselezione segue l'ordine richiesto
    const sub = fishTruth(['lunghezza', 'luminosita'])
    expect(sub.salmone.mean).toEqual([truth.salmone.mean[2], truth.salmone.mean[0]])
    expect(sub.spigola.cov).toEqual([
      [truth.spigola.cov[2][2], truth.spigola.cov[2][0]],
      [truth.spigola.cov[0][2], truth.spigola.cov[0][0]],
    ])
  })

  it('le classi si sovrappongono in parte, come nelle slide del Cap. 1', () => {
    const data = fishDataset(createRng(17), { n: 20000 })
    const truth = fishTruth()
    // soglia a metà tra le medie: errore di una regola a una feature
    const thresholdError = (j: number) => {
      const t = (truth.salmone.mean[j] + truth.spigola.mean[j]) / 2
      return data.filter((s) => (s.x[j] > t ? 1 : 0) !== s.y).length / data.length
    }
    // la spigola è più chiara, più larga e più lunga del salmone
    for (let j = 0; j < 3; j++) expect(truth.spigola.mean[j]).toBeGreaterThan(truth.salmone.mean[j])
    const errLum = thresholdError(0), errLarg = thresholdError(1), errLung = thresholdError(2)
    // "Looks better but still not enough satisfactory": né separabili né confuse
    expect(errLum).toBeGreaterThan(0.03)
    expect(errLum).toBeLessThan(0.15)
    // "Using length appears not effective!"
    expect(errLung).toBeGreaterThan(0.25)
    expect(errLarg).toBeGreaterThan(errLum)
  })

  it('con la densità vera due feature sbagliano meno di una (slide "2D Feature Space")', () => {
    const data = fishDataset(createRng(19), { n: 20000 })
    const bayesError = (features: FishFeature[]) => {
      const idx = features.map((f) => FISH_FEATURES.indexOf(f))
      const p0 = fishDensity('salmone', features), p1 = fishDensity('spigola', features)
      return data.filter((s) => {
        const x = idx.map((j) => s.x[j])
        return (p1(x) > p0(x) ? 1 : 0) !== s.y
      }).length / data.length
    }
    const e1 = bayesError(['luminosita']), e2 = bayesError(['luminosita', 'larghezza'])
    expect(e2).toBeLessThan(e1)
    expect(e2).toBeGreaterThan(0.02)
  })
})

describe('fishDensity', () => {
  it('ogni densità marginale vera integra a 1', () => {
    for (const label of fishMeta.classNames) {
      for (const f of FISH_FEATURES) {
        const p = fishDensity(label, [f])
        const [lo, hi] = fishMeta.ranges[f]
        // oltre l'intervallo utile degli assi resta solo la coda gaussiana
        const pad = f === 'luminosita' ? 0 : hi - lo
        expect(integrate((x) => p([x]), lo - pad, hi + pad, 8001)).toBeCloseTo(1, 5)
      }
    }
  })

  it('media e varianza di fishTruth sono i momenti di fishDensity (troncamento compreso)', () => {
    for (const label of fishMeta.classNames) {
      FISH_FEATURES.forEach((f, j) => {
        const p = fishDensity(label, [f])
        const [lo, hi] = fishMeta.ranges[f]
        const pad = f === 'luminosita' ? 0 : hi - lo
        const m = integrate((x) => x * p([x]), lo - pad, hi + pad, 8001)
        const v = integrate((x) => (x - m) ** 2 * p([x]), lo - pad, hi + pad, 8001)
        expect(fishTruth()[label].mean[j]).toBeCloseTo(m, 5)
        expect(fishTruth()[label].cov[j][j]).toBeCloseTo(v, 5)
      })
    }
    // la scala finita taglia le code: la media vera dei salmoni è un po' sopra quella della gaussiana intera
    const gaussianMode = linspace(0, 10, 10001).reduce((best, x) => {
      const p = fishDensity('salmone', ['luminosita'])
      return p([x]) > p([best]) ? x : best
    }, 0)
    expect(fishTruth().salmone.mean[0]).toBeGreaterThan(gaussianMode + 0.01)
  })

  it('la luminosità vive solo sulla scala 0-10', () => {
    const p = fishDensity('salmone', ['luminosita'])
    expect(p([-0.01])).toBe(0)
    expect(p([10.01])).toBe(0)
    expect(p([0])).toBeGreaterThan(0)
    expect(p([3])).toBeGreaterThan(p([8]))
    expect(fishDensity('spigola', ['luminosita'])([8])).toBeGreaterThan(p([8]))
  })

  it('la densità congiunta integra a 1 in 2D e in 3D e rispetta l\'ordine delle feature', () => {
    const grid = (f: FishFeature, n: number) => {
      const [lo, hi] = fishMeta.ranges[f]
      const pad = f === 'luminosita' ? 0 : (hi - lo) / 2
      return linspace(lo - pad, hi + pad, n)
    }
    const p2 = fishDensity('spigola', ['luminosita', 'larghezza'])
    const xs = grid('luminosita', 201), ys = grid('larghezza', 201)
    expect(trapz(xs, xs.map((x) => trapz(ys, ys.map((y) => p2([x, y])))))).toBeCloseTo(1, 4)

    const p3 = fishDensity('salmone')
    const as = grid('luminosita', 61), bs = grid('larghezza', 81), cs = grid('lunghezza', 81)
    const total = trapz(as, as.map((a) => trapz(bs, bs.map((b) => trapz(cs, cs.map((c) => p3([a, b, c])))))))
    expect(total).toBeCloseTo(1, 3)

    // larghezza e lunghezza sono correlate: la congiunta non è il prodotto delle marginali
    const pWl = fishDensity('salmone', ['larghezza', 'lunghezza'])
    const pLw = fishDensity('salmone', ['lunghezza', 'larghezza'])
    const pW = fishDensity('salmone', ['larghezza']), pL = fishDensity('salmone', ['lunghezza'])
    expect(pWl([19, 72])).toBeCloseTo(pLw([72, 19]), 12)
    expect(pWl([19, 72])).toBeGreaterThan(pW([19]) * pL([72]))
    // la luminosità invece è indipendente dalla taglia
    const pLumW = fishDensity('salmone', ['luminosita', 'larghezza'])
    expect(pLumW([4, 18])).toBeCloseTo(fishDensity('salmone', ['luminosita'])([4]) * pW([18]), 12)
  })

  it('è la densità da cui escono i campioni: le frequenze seguono gli integrali', () => {
    const data = fishDataset(createRng(23), { n: 40000 })
    for (const label of fishMeta.classNames) {
      const rows = ofClass(data, label)
      FISH_FEATURES.forEach((f, j) => {
        const p = fishDensity(label, [f])
        const m = fishTruth()[label].mean[j], sd = Math.sqrt(fishTruth()[label].cov[j][j])
        for (const [a, b] of [[m - 2 * sd, m - sd], [m - sd / 2, m + sd / 2], [m + sd, m + 3 * sd]]) {
          const freq = rows.filter((s) => s.x[j] >= a && s.x[j] <= b).length / rows.length
          expect(Math.abs(freq - integrate((x) => p([x]), a, b, 801))).toBeLessThan(0.012)
        }
      })
    }
  })
})

// ---------------------------------------------------------------------------------------------
// sensori: letture 1D di un sensore IoT
// ---------------------------------------------------------------------------------------------

describe('sensorsMixture', () => {
  it('ha 3 modi di default, 2 su richiesta, pesi che sommano a 1', () => {
    for (const quantity of SENSOR_QUANTITIES) {
      expect(sensorsMixture({ quantity })).toHaveLength(3)
      expect(sensorsMixture({ quantity, modes: 2 })).toHaveLength(2)
      for (const modes of [2, 3] as const) {
        const mix = sensorsMixture({ quantity, modes })
        expect(mix.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(1, 12)
        expect(mix.every((c) => c.weight > 0 && c.sd > 0)).toBe(true)
        // modi ordinati e distinti: tra due medie consecutive c'è una valle
        const p = sensorsDensity({ quantity, modes })
        for (let i = 1; i < mix.length; i++) {
          expect(mix[i].mean).toBeGreaterThan(mix[i - 1].mean)
          const valley = Math.min(...linspace(mix[i - 1].mean, mix[i].mean, 200).map(p))
          expect(valley).toBeLessThan(0.6 * Math.min(p(mix[i - 1].mean), p(mix[i].mean)))
        }
      }
    }
    expect(sensorsMixture()).toEqual(sensorsMixture({ quantity: 'temperatura', modes: 3 }))
  })
})

describe('sensorsDataset', () => {
  it('è deterministico per seed', () => {
    expect(sensorsDataset(createRng(42))).toEqual(sensorsDataset(createRng(42)))
    expect(sensorsDataset(createRng(42))).not.toEqual(sensorsDataset(createRng(43)))
    expect(sensorsAnomalyDataset(createRng(42))).toEqual(sensorsAnomalyDataset(createRng(42)))
  })

  it('ha la forma del contratto: letture 1D con il regime che le ha generate', () => {
    for (const quantity of SENSOR_QUANTITIES) {
      for (const modes of [2, 3] as const) {
        const mix = sensorsMixture({ quantity, modes })
        const data = sensorsDataset(createRng(2), { quantity, modes })
        expect(data).toHaveLength(200)
        for (const s of data) {
          expect(s.x).toHaveLength(1)
          expect(Number.isFinite(s.x[0])).toBe(true)
          expect(s.anomaly).toBe(false)
          expect(s.y).toBeGreaterThanOrEqual(0)
          expect(s.y).toBeLessThan(modes)
          expect(s.label).toBe(mix[s.y].label)
        }
      }
    }
    expect(sensorsDataset(createRng(2), { n: 17 })).toHaveLength(17)
    expect(sensorsDataset(createRng(2), { n: 0 })).toEqual([])
  })

  it('estrae i regimi con le frequenze della mistura (campioni i.i.d.)', () => {
    for (const quantity of SENSOR_QUANTITIES) {
      for (const modes of [2, 3] as const) {
        const mix = sensorsMixture({ quantity, modes })
        const data = sensorsDataset(createRng(29), { n: 20000, quantity, modes })
        mix.forEach((c, k) => {
          const rows = data.filter((s) => s.y === k)
          expect(Math.abs(rows.length / data.length - c.weight)).toBeLessThan(0.015)
          expect(Math.abs(mean(column(rows, 0)) - c.mean)).toBeLessThan(0.05 * c.sd)
        })
      }
    }
  })

  it('le vibrazioni non sono mai negative e le letture normali stanno nell\'intervallo degli assi', () => {
    for (const quantity of SENSOR_QUANTITIES) {
      const xs = column(sensorsDataset(createRng(31), { n: 20000, quantity }), 0)
      const [lo, hi] = sensorsMeta.ranges[quantity]
      expect(Math.min(...xs)).toBeGreaterThan(lo)
      expect(Math.max(...xs)).toBeLessThan(hi)
      expect(lo).toBeGreaterThanOrEqual(0)
    }
  })

  it('rifiuta opzioni senza senso con un errore chiaro', () => {
    expect(() => sensorsDataset(createRng(1), { n: -3 })).toThrow(/n/)
    expect(() => sensorsDataset(createRng(1), { modes: 4 as never })).toThrow(/modes/)
    expect(() => sensorsDataset(createRng(1), { quantity: 'pressione' as never })).toThrow(/pressione/)
    expect(() => sensorsDataset(createRng(1), { anomalyRate: 1.5 })).toThrow(/anomalyRate/)
    expect(() => sensorsDensity({ anomalyRate: -0.1 })).toThrow(/anomalyRate/)
  })
})

describe('sensorsAnomalyDataset', () => {
  it('contiene esattamente round(n * anomalyRate) anomalie, marcate e fuori dai regimi normali', () => {
    for (const quantity of SENSOR_QUANTITIES) {
      const bands = sensorsAnomalyBands(quantity)
      const [lo, hi] = sensorsMeta.ranges[quantity]
      expect(bands.low[1]).toBeLessThanOrEqual(lo)
      expect(bands.high[0]).toBeGreaterThanOrEqual(hi)
      const data = sensorsAnomalyDataset(createRng(37), { n: 400, quantity })
      const anomalies = data.filter((s) => s.anomaly)
      expect(data).toHaveLength(400)
      expect(anomalies).toHaveLength(20) // default 5%
      for (const s of anomalies) {
        expect(s.label).toBe('anomalia')
        expect(s.y).toBe(ANOMALY_CLASS)
        const v = s.x[0]
        const inLow = v >= bands.low[0] && v <= bands.low[1], inHigh = v >= bands.high[0] && v <= bands.high[1]
        expect(inLow || inHigh).toBe(true)
      }
      for (const s of data.filter((r) => !r.anomaly)) expect(s.label).not.toBe('anomalia')
    }
    const custom = sensorsAnomalyDataset(createRng(37), { n: 200, modes: 2, anomalyRate: 0.1 })
    expect(custom.filter((s) => s.anomaly)).toHaveLength(20)
    // anche con 2 modi l'indice di classe resta quello di sensorsMeta.classNames
    expect(ANOMALY_CLASS).toBe(3)
    for (const s of custom) expect(s.label).toBe(sensorsMeta.classNames[s.y])
    expect(new Set(custom.map((s) => s.y))).toEqual(new Set([0, 1, ANOMALY_CLASS]))
    expect(sensorsAnomalyDataset(createRng(37), { anomalyRate: 0 }).some((s) => s.anomaly)).toBe(false)
  })

  it('su entrambi i lati: surriscaldamenti sopra, letture spurie sotto', () => {
    const data = sensorsAnomalyDataset(createRng(41), { n: 4000, anomalyRate: 0.2 })
    const bands = sensorsAnomalyBands('temperatura')
    const anomalies = data.filter((s) => s.anomaly)
    const high = anomalies.filter((s) => s.x[0] >= bands.high[0]).length / anomalies.length
    expect(Math.abs(high - bands.pHigh)).toBeLessThan(0.06)
    expect(bands.pHigh).toBeGreaterThan(0)
    expect(bands.pHigh).toBeLessThan(1)
  })

  it('sparge le anomalie tra le letture senza toccare quelle normali', () => {
    const data = sensorsAnomalyDataset(createRng(43), { n: 200, anomalyRate: 0.1 })
    const positions = data.flatMap((s, i) => (s.anomaly ? [i] : []))
    expect(Math.min(...positions)).toBeLessThan(100)
    expect(Math.max(...positions)).toBeGreaterThan(100)
    // tolte le anomalie restano, nello stesso ordine, le letture del dataset pulito con lo stesso seed
    expect(data.filter((s) => !s.anomaly)).toEqual(sensorsDataset(createRng(43), { n: 180 }))
    // sensorsDataset con anomalyRate è la stessa variante
    expect(sensorsDataset(createRng(43), { n: 200, anomalyRate: 0.1 })).toEqual(data)
  })
})

describe('sensorsDensity', () => {
  it('la densità vera integra a 1, con e senza anomalie', () => {
    for (const quantity of SENSOR_QUANTITIES) {
      const bands = sensorsAnomalyBands(quantity)
      const [lo, hi] = sensorsMeta.ranges[quantity]
      for (const modes of [2, 3] as const) {
        expect(integrate(sensorsDensity({ quantity, modes }), lo, hi, 8001)).toBeCloseTo(1, 4)
        for (const anomalyRate of [0.05, 0.2]) {
          const p = sensorsDensity({ quantity, modes, anomalyRate })
          const pad = (bands.high[1] - bands.low[0]) * 0.05
          expect(integrate(p, bands.low[0] - pad, bands.high[1] + pad, 40001)).toBeCloseTo(1, 3)
        }
      }
    }
  })

  it('è la somma pesata delle gaussiane dei regimi', () => {
    const mix = sensorsMixture({ modes: 3 })
    const p = sensorsDensity({ modes: 3 })
    const x = mix[1].mean + 0.7 * mix[1].sd
    const byHand = mix.reduce((s, c) => s + (c.weight * Math.exp(-0.5 * ((x - c.mean) / c.sd) ** 2)) / (c.sd * Math.sqrt(2 * Math.PI)), 0)
    expect(p(x)).toBeCloseTo(byHand, 12)
    // con le anomalie i regimi pesano (1 - eps) e le bande aggiungono un plateau
    const bands = sensorsAnomalyBands('temperatura')
    const q = sensorsDensity({ modes: 3, anomalyRate: 0.1 })
    const mid = (bands.high[0] + bands.high[1]) / 2
    expect(q(x)).toBeCloseTo(0.9 * byHand, 12)
    expect(q(mid)).toBeCloseTo((0.1 * bands.pHigh) / (bands.high[1] - bands.high[0]) + 0.9 * p(mid), 12)
  })

  it('è la densità da cui escono le letture: le frequenze seguono gli integrali', () => {
    for (const quantity of SENSOR_QUANTITIES) {
      const bands = sensorsAnomalyBands(quantity)
      const start = bands.low[0] - 1
      for (const anomalyRate of [0, 0.1]) {
        const data = sensorsDataset(createRng(47), { n: 20000, quantity, anomalyRate })
        const xs = column(data, 0)
        const p = sensorsDensity({ quantity, anomalyRate })
        const qs = [...xs].sort((a, b) => a - b)
        // si confronta la funzione di ripartizione empirica con quella vera in nove quantili
        for (let k = 1; k <= 9; k++) {
          const t = qs[Math.floor((k / 10) * qs.length)]
          const empirical = xs.filter((v) => v <= t).length / xs.length
          expect(Math.abs(empirical - integrate(p, start, t, 20001))).toBeLessThan(0.015)
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------------------------
// metadati condivisi
// ---------------------------------------------------------------------------------------------

describe('metadati dei dataset', () => {
  it('i generatori rispettano la forma comune (rng, opts) => campioni', () => {
    // controllo a tempo di compilazione: se una firma cambia, tsc si ferma qui
    const fish: DatasetGenerator<FishSample, FishOptions> = fishDataset
    const sensors: DatasetGenerator<SensorSample, SensorsOptions> = sensorsDataset
    const anomalies: DatasetGenerator<SensorSample, SensorsOptions> = sensorsAnomalyDataset
    const samples: Sample[] = [...fish(createRng(1), { n: 2 }), ...sensors(createRng(1), { n: 2 }), ...anomalies(createRng(1), { n: 2 })]
    expect(samples).toHaveLength(6)
    // il generatore consuma l'rng: la seconda estrazione dallo stesso rng è diversa dalla prima
    const rng = createRng(9)
    expect(fishDataset(rng, { n: 5 })).not.toEqual(fishDataset(rng, { n: 5 }))
  })

  it('dichiarano feature, unità, classi, descrizione e che i dati sono sintetici', () => {
    const metas: DatasetMeta[] = [fishMeta, sensorsMeta]
    for (const meta of metas) {
      expect(meta.synthetic).toBe(true)
      expect(meta.description).toMatch(/sintetic/i)
      expect(meta.featureNames.length).toBeGreaterThan(0)
      expect(meta.classNames.length).toBeGreaterThan(1)
      for (const f of meta.featureNames) {
        expect(meta.units[f]).toBeTruthy()
        expect(meta.featureLabels[f].it).toBeTruthy()
        expect(meta.featureLabels[f].en).toBeTruthy()
        expect(meta.ranges[f][1]).toBeGreaterThan(meta.ranges[f][0])
      }
      for (const c of meta.classNames) {
        expect(meta.classLabels[c].it).toBeTruthy()
        expect(meta.classLabels[c].en).toBeTruthy()
      }
    }
    expect(fishMeta.scenario).toBe('pesce')
    expect(sensorsMeta.scenario).toBe('sensori')
    expect(fishMeta.units).toEqual({ luminosita: 'scala 0-10', larghezza: 'cm', lunghezza: 'cm' })
    expect(sensorsMeta.units).toEqual({ temperatura: '°C', vibrazione: 'mm/s' })
    expect(sensorsMeta.classNames).toEqual(['fermo', 'marcia', 'pieno carico', 'anomalia'])
    expect(fishMeta.featureLabels.luminosita).toEqual({ it: 'luminosità', en: 'lightness' })
  })
})
