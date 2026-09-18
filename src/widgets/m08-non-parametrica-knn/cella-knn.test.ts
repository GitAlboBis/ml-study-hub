import { describe, expect, it, vi } from 'vitest'
import { createRng } from '../../lib/rng'
import { knnClassify, knnDensity2d } from '../../lib/ml/nonparam'
import {
  CLASS_NAMES,
  K_MAX,
  MYSTERY,
  N_DEFAULT,
  N_RANGE,
  POOL_PER_CLASS,
  WIDTH_WINDOW,
  addToTrail,
  bayesLabel,
  bigK,
  buildPool,
  cellState,
  classifierSteps,
  createFrameChannel,
  densitySteps,
  densityValues,
  expansionMs,
  expansionRadius,
  isoDomains,
  judgeMystery,
  judgePrediction,
  litCount,
  makeClassifier,
  makeDensityField,
  ofClass,
  robustPeak,
  spikeLength,
  touchTime,
  trainingSet,
  voteState,
  voteValues,
} from './cella-knn'
import type { Fish } from './cella-knn'

const pool = buildPool()
const train = trainingSet(pool, N_DEFAULT)
const salmoni = ofClass(train, 0)
// K di partenza del widget: con K = 5 il pesce A è ancora vittima dell'overfitting
const K_DEFAULT_CHECK = 5

describe('il nastro dei pesci', () => {
  it('è deterministico e ha almeno POOL_PER_CLASS pesci per classe, tutti dentro l inquadratura', () => {
    const again = buildPool()
    expect(again[0].map((f) => f.p)).toEqual(pool[0].map((f) => f.p))
    for (const cls of [0, 1] as const) {
      expect(pool[cls]).toHaveLength(POOL_PER_CLASS)
      for (const f of pool[cls]) {
        expect(f.cls).toBe(cls)
        expect(f.p[0]).toBeGreaterThanOrEqual(WIDTH_WINDOW[0])
        expect(f.p[0]).toBeLessThanOrEqual(WIDTH_WINDOW[1])
        expect(f.p[1]).toBeGreaterThanOrEqual(0)
        expect(f.p[1]).toBeLessThanOrEqual(10)
      }
    }
  })

  it('il training set prende i primi N pesci di ogni classe, con id unici e stabili', () => {
    expect(train).toHaveLength(2 * N_DEFAULT)
    expect(ofClass(train, 0)).toHaveLength(N_DEFAULT)
    expect(ofClass(train, 1)).toHaveLength(N_DEFAULT)
    expect(new Set(train.map((f) => f.id)).size).toBe(train.length)
    // crescere N aggiunge pesci senza cambiare quelli che c'erano
    const bigger = trainingSet(pool, N_DEFAULT + 20)
    expect(ofClass(bigger, 0).slice(0, N_DEFAULT)).toEqual(salmoni)
    expect(CLASS_NAMES).toEqual(['salmone', 'spigola'])
  })
})

describe('la cella K-NN in un punto', () => {
  const x = [17.5, 4] as const

  it('r_K è la distanza del K-esimo vicino, V_K = π r_K² e la stima coincide con knnDensity2d', () => {
    for (const K of [1, 5, 12, 40]) {
      const cell = cellState(x, salmoni, K)
      const d = salmoni.map((f) => Math.hypot(f.p[0] - x[0], f.p[1] - x[1])).sort((a, b) => a - b)
      expect(cell.rK).toBeCloseTo(d[K - 1], 12)
      expect(cell.V).toBeCloseTo(Math.PI * d[K - 1] ** 2, 12)
      expect(cell.p).toBeCloseTo(knnDensity2d(x, salmoni.map((f) => f.p), K), 12)
      expect(cell.p).toBeCloseTo(K / (N_DEFAULT * cell.V), 12)
      // i vicini sono ordinati e ce n'è uno in più (il (K+1)-esimo serve alla previsione)
      expect(cell.neighbors).toHaveLength(K + 1)
      for (let j = 1; j < cell.neighbors.length; j++) expect(cell.neighbors[j].distance).toBeGreaterThanOrEqual(cell.neighbors[j - 1].distance)
    }
  })

  it('K maggiore di N: la cella non arriva mai a K campioni, r_K = ∞ e la stima è 0', () => {
    const few = salmoni.slice(0, 3)
    const cell = cellState(x, few, 5)
    expect(cell.rK).toBe(Number.POSITIVE_INFINITY)
    expect(cell.p).toBe(0)
  })
})

describe('espansione animata', () => {
  const cell = cellState([16, 3], salmoni, 7)

  it('il raggio cresce a velocità costante da 0 a r_K', () => {
    expect(expansionRadius(0, cell.rK)).toBe(0)
    expect(expansionRadius(0.5, cell.rK)).toBeCloseTo(cell.rK / 2, 12)
    expect(expansionRadius(1, cell.rK)).toBe(cell.rK)
    expect(expansionRadius(2, cell.rK)).toBe(cell.rK)
  })

  it('stato dopo N fotogrammi: i vicini si accendono uno alla volta, in ordine di distanza, fino a K', () => {
    const frames = 90
    let before = 0
    const seen: number[] = []
    for (let f = 0; f <= frames; f++) {
      const t = f / frames
      const n = litCount(cell.neighbors, expansionRadius(t, cell.rK), 7)
      expect(n).toBeGreaterThanOrEqual(before)
      if (n > before) seen.push(f)
      before = n
    }
    expect(before).toBe(7)
    // il j-esimo vicino si accende esattamente quando il raggio lo tocca
    for (let j = 0; j < 7; j++) {
      const tj = touchTime(cell.neighbors[j].distance, cell.rK)
      expect(litCount(cell.neighbors, expansionRadius(tj, cell.rK), 7)).toBeGreaterThanOrEqual(j + 1)
      if (tj > 1e-9) expect(litCount(cell.neighbors, expansionRadius(tj - 1e-6, cell.rK), 7)).toBeLessThanOrEqual(j)
    }
    // il (K+1)-esimo non si accende mai
    expect(litCount(cell.neighbors, cell.rK * 10, 7)).toBe(7)
    expect(seen.length).toBeGreaterThan(0)
  })

  it('la durata dell espansione cresce con K ma resta limitata', () => {
    expect(expansionMs(1)).toBeLessThan(expansionMs(5))
    expect(expansionMs(5)).toBeLessThan(expansionMs(20))
    expect(expansionMs(K_MAX)).toBeLessThanOrEqual(4200)
  })

  it('gli storyboard hanno i passi della metodologia (slide 47) nei due modi', () => {
    expect(densitySteps(5).map((s) => s.id)).toEqual(['punto', 'espansione', 'raggio', 'stima', 'mappa'])
    expect(classifierSteps(5).map((s) => s.id)).toEqual(['punto', 'espansione', 'voto', 'regioni'])
    expect(densitySteps(5)[1].durationMs).toBe(expansionMs(5))
  })
})

describe('formula viva', () => {
  const cell = cellState([17.5, 4], salmoni, 5)

  it('si riempie passo dopo passo: K e N subito, r_K e V_K dal righello, p̂ dalla stima', () => {
    expect(densityValues(cell, 0, false)).toEqual({ K: 5, N: N_DEFAULT, r: undefined, V: undefined, p: undefined })
    expect(densityValues(cell, 1, false).r).toBeUndefined()
    const at2 = densityValues(cell, 2, false)
    expect(at2.r).toBe(cell.rK)
    expect(at2.V).toBe(cell.V)
    expect(at2.p).toBeUndefined()
    const at3 = densityValues(cell, 3, false)
    expect(at3.p).toBe(cell.p)
    // valore della formula: K/(N·V_K)
    expect((at3.K as number) / ((at3.N as number) * (at3.V as number))).toBeCloseTo(at3.p as number, 12)
  })

  it('in modalità previsione i valori misurati restano nascosti', () => {
    const hidden = densityValues(cell, 4, true)
    expect(hidden.K).toBe(5)
    expect(hidden.r).toBe('?')
    expect(hidden.V).toBe('?')
    expect(hidden.p).toBe('?')
  })

  it('classificatore: K_i/K dopo il voto', () => {
    const v = voteState([18, 5], train, 7)
    expect(voteValues(v, 1)).toEqual({ K: 7, K1: undefined, K2: undefined, P1: undefined, P2: undefined })
    const at2 = voteValues(v, 2)
    expect(at2.K1).toBe(v.K1)
    expect(at2.P1).toBeCloseTo(v.K1 / 7, 12)
    expect((at2.P1 as number) + (at2.P2 as number)).toBeCloseTo(1, 12)
  })
})

describe('classificatore K-NN', () => {
  it('voteState conta i voti K_1 + K_2 = K e le posterior K_i/K sommano a 1', () => {
    for (const K of [1, 4, 7, 20]) {
      const v = voteState([18.5, 5.5], train, K)
      expect(v.K1 + v.K2).toBe(K)
      expect(v.P1 + v.P2).toBeCloseTo(1, 12)
      expect(v.label).toBe(knnClassify([18.5, 5.5], train.map((f) => ({ x: f.p, y: f.cls })), K))
      expect(v.neighbors).toHaveLength(K)
    }
  })
})

describe('mappe veloci (selezione del K-esimo invece dell ordinamento)', () => {
  const rng = createRng(4)
  const points: [number, number][] = Array.from({ length: 300 }, () => [rng.float(10.5, 25.5), rng.float(0, 10)])

  it('la mappa della densità coincide con knnDensity2d', () => {
    for (const K of [1, 2, 5, 17, 60]) {
      const field = makeDensityField(salmoni, K)
      for (const [x, y] of points.slice(0, 80)) {
        const ref = knnDensity2d([x, y], salmoni.map((f) => f.p), K)
        expect(field(x, y)).toBeCloseTo(ref, 10)
      }
    }
  })

  it('le regioni di decisione coincidono con knnClassify, anche con K pari e parità', () => {
    const data = train.map((f) => ({ x: f.p, y: f.cls }))
    for (const K of [1, 2, 4, 5, 8, 39, 120]) {
      const classify = makeClassifier(train, K)
      for (const [x, y] of points) expect(classify(x, y)).toBe(knnClassify([x, y], data, K))
    }
  })

  it('robustPeak taglia i picchi isolati: resta positivo e non supera il massimo', () => {
    const field = makeDensityField(salmoni, 1)
    const peak = robustPeak(field, [10.5, 25.5], [0, 10])
    expect(peak).toBeGreaterThan(0)
    let max = 0
    for (let i = 0; i < 48; i++) for (let j = 0; j < 32; j++) max = Math.max(max, field(10.5 + ((i + 0.5) * 15) / 48, ((j + 0.5) * 10) / 32))
    expect(peak).toBeLessThanOrEqual(max)
  })

  it('K grande per il confronto: metà dei campioni, dispari nel classificatore', () => {
    expect(bigK('densita', 60)).toBe(30)
    expect(bigK('classificatore', 60)).toBe(59)
    expect(bigK('classificatore', 61) % 2).toBe(1)
    expect(bigK('densita', 20)).toBe(10)
  })
})

describe('sfida: i pesci misteriosi', () => {
  it('con N = 60 per classe K = 1 sbaglia (overfitting) e K grande sbaglia (oversmoothing)', () => {
    expect(judgeMystery(train, 1).ok).toBe(false)
    expect(judgeMystery(train, K_DEFAULT_CHECK).ok).toBe(false)
    expect(judgeMystery(train, 30).ok).toBe(false)
  })

  it('esiste una banda di K che classifica bene entrambi: [9, 17]', () => {
    const good = Array.from({ length: K_MAX }, (_, i) => i + 1).filter((K) => judgeMystery(train, K).ok)
    expect(good).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17])
  })

  it('la classe giusta è quella della regola di Bayes con le densità vere del modello', () => {
    expect(MYSTERY.map((m) => bayesLabel(m.p))).toEqual([1, 0])
    const v = judgeMystery(train, 12).verdicts
    expect(v.map((d) => d.correct)).toEqual([true, true])
    expect(v.map((d) => d.truth)).toEqual([1, 0])
  })
})

describe('previsione del raggio (sfida dell inventario)', () => {
  const x = [16.5, 3.5] as const
  const cell = cellState(x, salmoni, 5)
  const r6 = cell.neighbors[5].distance

  it('con r̂ = r_K la cella prevista contiene esattamente K pesci e la stima è esatta', () => {
    const j = judgePrediction(x, salmoni, 5, cell.rK)
    expect(j.inside).toBe(5)
    expect(j.relErr).toBeCloseTo(0, 12)
    expect(j.ok).toBe(true)
  })

  it('troppo piccola o troppo grande: il conteggio non è K e la previsione non passa', () => {
    expect(judgePrediction(x, salmoni, 5, cell.rK * 0.999).inside).toBe(4)
    expect(judgePrediction(x, salmoni, 5, cell.rK * 0.999).ok).toBe(false)
    expect(judgePrediction(x, salmoni, 5, r6).inside).toBe(6)
    expect(judgePrediction(x, salmoni, 5, r6).ok).toBe(false)
  })

  it('lo scarto relativo è |p̂_tua − p̂| / p̂ e la tolleranza è il 20%', () => {
    const r = Math.min(cell.rK * 1.04, (cell.rK + r6) / 2)
    const j = judgePrediction(x, salmoni, 5, r)
    expect(j.pGuess).toBeCloseTo(5 / (N_DEFAULT * Math.PI * r * r), 12)
    expect(j.relErr).toBeCloseTo(Math.abs(j.pGuess - cell.p) / cell.p, 12)
    expect(j.ok).toBe(j.relErr <= 0.2)
  })
})

describe('piano isotropo', () => {
  it('stessa scala sui due assi: la cella circolare resta un cerchio sullo schermo', () => {
    for (const [w, h] of [
      [700, 480],
      [250, 180],
      [1200, 500],
      [300, 300],
    ]) {
      const d = isoDomains(w, h)
      expect(w / (d.x[1] - d.x[0])).toBeCloseTo(h / (d.y[1] - d.y[0]), 9)
      // tutto il nastro è inquadrato
      expect(d.x[0]).toBeLessThanOrEqual(WIDTH_WINDOW[0])
      expect(d.x[1]).toBeGreaterThanOrEqual(WIDTH_WINDOW[1])
      expect(d.y[0]).toBeLessThanOrEqual(0)
      expect(d.y[1]).toBeGreaterThanOrEqual(10)
    }
  })
})

describe('canale dei fotogrammi', () => {
  it('pubblica solo i cambi e tiene lo stesso snapshot finché nulla cambia', () => {
    const ch = createFrameChannel()
    const listener = vi.fn()
    const off = ch.subscribe(listener)
    const first = ch.get()
    ch.set(first.progress, first.index)
    expect(listener).not.toHaveBeenCalled()
    expect(ch.get()).toBe(first)
    ch.set(0.5, 1)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(ch.get()).toEqual({ progress: 0.5, index: 1 })
    off()
    ch.set(1, 2)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('limiti dei comandi', () => {
  it('N va da 20 a 200 e K al più 40', () => {
    expect(N_RANGE).toEqual([20, 200])
    expect(K_MAX).toBe(40)
  })

  it('i pesci del training set hanno la forma attesa', () => {
    const f: Fish = train[0]
    expect(f.p).toHaveLength(2)
  })
})

describe('scia e spillo della stima', () => {
  it('la scia aggiunge un punto solo quando x* si sposta abbastanza e tiene gli ultimi', () => {
    let trail = addToTrail([], { x: 15, y: 3, p: 0.05 })
    expect(trail).toHaveLength(1)
    const same = addToTrail(trail, { x: 15.1, y: 3.1, p: 0.05 })
    expect(same).toBe(trail)
    for (let i = 1; i <= 40; i++) trail = addToTrail(trail, { x: 15 + i, y: 3, p: 0.01 * i }, 0.4, 32)
    expect(trail).toHaveLength(32)
    expect(trail.at(-1)?.x).toBe(55)
  })

  it('lo spillo è proporzionale a p̂ fino al tetto', () => {
    expect(spikeLength(0.02, 0.08, 64)).toBeCloseTo(16, 12)
    expect(spikeLength(0.5, 0.08, 64)).toBe(64)
    expect(spikeLength(0.02, 0, 64)).toBe(0)
  })
})
