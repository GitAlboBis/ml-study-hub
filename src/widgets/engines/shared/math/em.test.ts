import { describe, expect, it } from 'vitest'
import { createRng } from '../../../../lib/rng'
import { normalPdf, sampleMixture } from '../../../../lib/ml/stats'
import {
  conditional2, emStep1d, emStep2d, entropy, initComponents1d, initComponents2d, kmeansAssign, kmeansPlusPlus, kmeansStep,
  logLikelihood1d, logLikelihood2d, minorant1d, mixtureDensity1d, mStep1d, qFunction1d, qFunction2d, responsibilities1d,
  responsibilities2d, runEm1d, runEm2d, runKmeans,
} from './em'
import type { Comp1, Comp2, Point2Missing } from './em'

const bimodal = (seed: number, n = 150) =>
  sampleMixture(createRng(seed), n, [
    { weight: 0.6, mu: 3, sigma: 0.6 },
    { weight: 0.4, mu: 7, sigma: 0.9 },
  ])

describe('EM 1-D: passo E', () => {
  const comps: Comp1[] = [{ weight: 0.5, mu: 0.5, sigma: 1 }, { weight: 0.5, mu: 4.5, sigma: 1 }]
  const xs = [0, 1, 4, 5, 2.5]
  it('responsabilità r_ij = P_j N(x_i|θ_j) / Σ_l P_l N(x_i|θ_l), a somma 1', () => {
    const { resp, logLik } = responsibilities1d(xs, comps)
    xs.forEach((x, i) => {
      const a = 0.5 * normalPdf(x, 0.5, 1)
      const b = 0.5 * normalPdf(x, 4.5, 1)
      expect(resp[i][0]).toBeCloseTo(a / (a + b), 14)
      expect(resp[i][0] + resp[i][1]).toBeCloseTo(1, 15)
    })
    expect(resp[4][0]).toBeCloseTo(0.5, 14)
    expect(logLik).toBeCloseTo(logLikelihood1d(xs, comps), 12)
    expect(logLik).toBeCloseTo(xs.reduce((s, x) => s + Math.log(mixtureDensity1d(x, comps)), 0), 12)
  })
  it('responsabilità dure (k-means come limite): una sola componente per campione', () => {
    const { resp } = responsibilities1d(xs, comps, { hard: true })
    expect(resp.map((r) => r.indexOf(1))).toEqual([0, 0, 1, 1, 0])
  })
  it('una componente collassata su un campione (σ = 0) si prende tutto e la verosimiglianza è +∞', () => {
    const c: Comp1[] = [{ weight: 0.5, mu: 1, sigma: 0 }, { weight: 0.5, mu: 3, sigma: 1 }]
    const r = responsibilities1d([1, 3], c)
    expect(r.resp[0]).toEqual([1, 0])
    expect(r.resp[1]).toEqual([0, 1])
    expect(r.logLik).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('EM 1-D: passo M e iterazioni', () => {
  it('passo M: medie pesate, varianze pesate, pesi N_j/N', () => {
    const xs = [0, 2, 10]
    const resp = [[1, 0], [0.5, 0.5], [0, 1]]
    const c = mStep1d(xs, resp)
    expect(c[0].weight).toBeCloseTo(0.5, 15)
    expect(c[0].mu).toBeCloseTo(1 / 1.5, 14)
    expect(c[1].mu).toBeCloseTo(11 / 1.5, 14)
    const v0 = (1 * (0 - 2 / 3) ** 2 + 0.5 * (2 - 2 / 3) ** 2) / 1.5
    expect(c[0].sigma).toBeCloseTo(Math.sqrt(v0), 14)
  })
  it('vincoli: σ condivisa, pesi fissi, σ fisse', () => {
    const xs = [0, 2, 10]
    const resp = [[1, 0], [0.5, 0.5], [0, 1]]
    const prev: Comp1[] = [{ weight: 0.3, mu: 0, sigma: 2 }, { weight: 0.7, mu: 9, sigma: 3 }]
    const shared = mStep1d(xs, resp, { sharedSigma: true })
    expect(shared[0].sigma).toBe(shared[1].sigma)
    expect(mStep1d(xs, resp, { fixedWeights: [0.3, 0.7] }).map((c) => c.weight)).toEqual([0.3, 0.7])
    expect(mStep1d(xs, resp, { fixedSigma: true, prev }).map((c) => c.sigma)).toEqual([2, 3])
  })
  it('una sola componente: un passo porta a media e varianza ML (1/N)', () => {
    const xs = [1, 2, 3, 6]
    const r = emStep1d(xs, [{ weight: 1, mu: 0, sigma: 5 }])
    expect(r.comps[0].mu).toBeCloseTo(3, 14)
    expect(r.comps[0].sigma).toBeCloseTo(Math.sqrt((4 + 1 + 0 + 9) / 4), 14)
  })
  it('la log-verosimiglianza non scende mai e i parametri tornano vicini ai veri', () => {
    const xs = bimodal(11)
    const run = runEm1d(xs, [{ weight: 0.5, mu: 2, sigma: 1 }, { weight: 0.5, mu: 5, sigma: 1 }], { maxIter: 300, epsilon: 1e-10 })
    expect(run.converged).toBe(true)
    for (let k = 1; k < run.history.length; k++) expect(run.history[k].logLik).toBeGreaterThanOrEqual(run.history[k - 1].logLik - 1e-9)
    const last = run.history.at(-1)!.comps
    expect(last[0].mu).toBeCloseTo(3, 0)
    expect(last[1].mu).toBeCloseTo(7, 0)
    expect(last[0].weight).toBeCloseTo(0.6, 1)
  })
  it('collasso: una componente su un campione isolato con σ che scende va a +∞ e l\'EM si ferma', () => {
    const xs = [0, 0.3, -0.2, 0.1, 10]
    const run = runEm1d(xs, [{ weight: 0.8, mu: 0, sigma: 1 }, { weight: 0.2, mu: 10, sigma: 0.5 }], { maxIter: 50 })
    expect(run.collapsed).toBe(true)
    expect(run.history.at(-1)!.logLik).toBe(Number.POSITIVE_INFINITY)
    // con un pavimento su σ non collassa
    const safe = runEm1d(xs, [{ weight: 0.8, mu: 0, sigma: 1 }, { weight: 0.2, mu: 10, sigma: 0.5 }], { maxIter: 50, minSigma: 0.05 })
    expect(safe.collapsed).toBe(false)
  })
  it('Q e minorante: Q(θ; θ_k) + H_k sta sotto ln L e la tocca in θ_k', () => {
    const xs = bimodal(4, 60)
    const at: Comp1[] = [{ weight: 0.5, mu: 2.5, sigma: 1 }, { weight: 0.5, mu: 6, sigma: 1.2 }]
    expect(minorant1d(xs, at, at)).toBeCloseTo(logLikelihood1d(xs, at), 9)
    const { resp } = responsibilities1d(xs, at)
    expect(qFunction1d(xs, resp, at) + entropy(resp)).toBeCloseTo(logLikelihood1d(xs, at), 9)
    for (const mu of [1, 3, 4, 7]) {
      const th: Comp1[] = [{ weight: 0.4, mu, sigma: 0.8 }, { weight: 0.6, mu: 6.5, sigma: 1 }]
      expect(minorant1d(xs, th, at)).toBeLessThanOrEqual(logLikelihood1d(xs, th) + 1e-9)
    }
    // il passo M massimizza Q: il nuovo θ ha Q più alto del vecchio
    const next = mStep1d(xs, resp)
    expect(qFunction1d(xs, resp, next)).toBeGreaterThanOrEqual(qFunction1d(xs, resp, at))
  })
  it('inizializzazione a seme: M medie distinte prese dai campioni, pesi 1/M', () => {
    const xs = bimodal(2, 40)
    const a = initComponents1d(createRng(5), xs, 3)
    expect(a).toEqual(initComponents1d(createRng(5), xs, 3))
    expect(a.map((c) => c.weight)).toEqual([1 / 3, 1 / 3, 1 / 3])
    for (const c of a) expect(xs).toContain(c.mu)
    expect(a[0].mu).toBeLessThanOrEqual(a[1].mu)
  })
})

describe('EM 2-D con dati mancanti: l\'esempio dei quattro punti (m10, slide 77)', () => {
  const pts: Point2Missing[] = [[0, 2], [1, 0], [2, 2], [null, 4]]
  const theta0: Comp2[] = [{ weight: 1, mu: [0, 0], S: [[1, 0], [0, 1]] }]
  it('gaussiana condizionata del valore mancante', () => {
    const c = conditional2([1, 2], [[2, 0.6], [0.6, 1.5]], 1, 4)
    expect(c.mean).toBeCloseTo(1 + (0.6 / 1.5) * 2, 14)
    expect(c.variance).toBeCloseTo(2 - 0.36 / 1.5, 14)
  })
  it('θ⁰ = (0, 0, 1, 1) → θ¹ = (0.75, 2, 0.938, 2) → θ² = (0.938, 2, 0.746, 2) → θ³ = (0.984, 2, 0.687, 2)', () => {
    const r1 = emStep2d(pts, theta0, { covariance: 'diagonal' })
    const c1 = r1.comps[0]
    expect(c1.mu[0]).toBeCloseTo(0.75, 14)
    expect(c1.mu[1]).toBeCloseTo(2, 14)
    expect(c1.S[0][0]).toBeCloseTo(0.9375, 14)
    expect(c1.S[1][1]).toBeCloseTo(2, 14)
    expect(c1.S[0][1]).toBe(0)
    const c2 = emStep2d(pts, r1.comps, { covariance: 'diagonal' }).comps[0]
    expect(c2.mu[0]).toBeCloseTo(0.9375, 14)
    expect(c2.S[0][0]).toBeCloseTo(0.74609375, 14)
    const c3 = emStep2d(pts, [c2], { covariance: 'diagonal' }).comps[0]
    expect(c3.mu[0]).toBeCloseTo(0.984375, 14)
    expect(c3.S[0][0]).toBeCloseTo(0.687, 3)
  })
  it('limite: μ = (1, 2), Σ = diag(0.667, 2)', () => {
    // ε = 0: niente arresto su ln L (piatta vicino all'ottimo), 80 iterazioni a velocità 1/4 portano μ₁ al limite
    const run = runEm2d(pts, theta0, { covariance: 'diagonal', maxIter: 80, epsilon: 0 })
    const c = run.history.at(-1)!.comps[0]
    expect(c.mu[0]).toBeCloseTo(1, 8)
    expect(c.mu[1]).toBeCloseTo(2, 12)
    expect(c.S[0][0]).toBeCloseTo(2 / 3, 8)
    expect(c.S[1][1]).toBeCloseTo(2, 12)
    for (let k = 1; k < run.history.length; k++) expect(run.history[k].logLik).toBeGreaterThanOrEqual(run.history[k - 1].logLik - 1e-12)
  })
  it('scartando il punto incompleto: μ₂ = 1.33 e σ₂² = 0.89', () => {
    const c = emStep2d(pts.slice(0, 3), theta0, { covariance: 'diagonal' }).comps[0]
    expect(c.mu[1]).toBeCloseTo(4 / 3, 14)
    expect(c.S[1][1]).toBeCloseTo(8 / 9, 14)
  })
  it('Q(θ; θ⁰) = Σ ln p(x_k|θ) − (1 + μ₁²)/(2σ₁²) − (4 − μ₂)²/(2σ₂²) − ln(2πσ₁σ₂)', () => {
    const e = responsibilities2d(pts, theta0)
    const th: Comp2[] = [{ weight: 1, mu: [0.5, 1.5], S: [[2, 0], [0, 3]] }]
    const lnp = (x: number, y: number) => -Math.log(2 * Math.PI * Math.sqrt(6)) - ((x - 0.5) ** 2 / 2 + (y - 1.5) ** 2 / 3) / 2
    const expected = lnp(0, 2) + lnp(1, 0) + lnp(2, 2) - (1 + 0.25) / 4 - (4 - 1.5) ** 2 / 6 - Math.log(2 * Math.PI * Math.sqrt(6))
    expect(qFunction2d(pts, e, th)).toBeCloseTo(expected, 12)
  })
  it('covarianza piena: il valore mancante si prevede dalla correlazione, la verosimiglianza sale', () => {
    const run = runEm2d(pts, theta0, { covariance: 'full', maxIter: 100 })
    for (let k = 1; k < run.history.length; k++) expect(run.history[k].logLik).toBeGreaterThanOrEqual(run.history[k - 1].logLik - 1e-12)
    const e = responsibilities2d(pts, run.history.at(-1)!.comps)
    const S = run.history.at(-1)!.comps[0].S
    const m = run.history.at(-1)!.comps[0].mu
    expect(e.filled[3][0].x[0]).toBeCloseTo(m[0] + (S[0][1] / S[1][1]) * (4 - m[1]), 12)
  })
})

describe('GMM 2-D e k-means', () => {
  const rng = createRng(21)
  const blobs: Point2Missing[] = [
    ...Array.from({ length: 60 }, () => [rng.normal(0, 0.5), rng.normal(0, 0.5)] as const),
    ...Array.from({ length: 60 }, () => [rng.normal(4, 0.7), rng.normal(3, 0.4)] as const),
  ]
  it('EM su due gruppi: medie recuperate e log-verosimiglianza monotona', () => {
    const init: Comp2[] = [
      { weight: 0.5, mu: [1, 1], S: [[1, 0], [0, 1]] },
      { weight: 0.5, mu: [3, 2], S: [[1, 0], [0, 1]] },
    ]
    const run = runEm2d(blobs, init, { maxIter: 200 })
    for (let k = 1; k < run.history.length; k++) expect(run.history[k].logLik).toBeGreaterThanOrEqual(run.history[k - 1].logLik - 1e-9)
    const c = run.history.at(-1)!.comps
    expect(c[0].mu[0]).toBeCloseTo(0, 0)
    expect(c[1].mu[0]).toBeCloseTo(4, 0)
    expect(c[1].mu[1]).toBeCloseTo(3, 0)
    expect(run.history.at(-1)!.logLik).toBeCloseTo(logLikelihood2d(blobs, c), 9)
  })
  it('covarianza condivisa e sferica', () => {
    const init: Comp2[] = [
      { weight: 0.5, mu: [1, 1], S: [[1, 0], [0, 1]] },
      { weight: 0.5, mu: [3, 2], S: [[1, 0], [0, 1]] },
    ]
    const sh = emStep2d(blobs, init, { covariance: 'shared' }).comps
    expect(sh[0].S).toEqual(sh[1].S)
    const sp = emStep2d(blobs, init, { covariance: 'spherical' }).comps
    expect(sp[0].S[0][0]).toBe(sp[0].S[1][1])
    expect(sp[0].S[0][1]).toBe(0)
  })
  it('k-means: assegnazione alla media più vicina, medie dei gruppi, inerzia che non sale', () => {
    const pts = blobs.map((p) => [p[0]!, p[1]!])
    const init = [[1, 1], [3, 2]]
    const step = kmeansStep(pts, init)
    expect(step.assign).toEqual(kmeansAssign(pts, init))
    const run = runKmeans(pts, init, 50)
    expect(run.converged).toBe(true)
    for (let k = 1; k < run.history.length; k++) expect(run.history[k].inertia).toBeLessThanOrEqual(run.history[k - 1].inertia + 1e-12)
    expect(run.history.at(-1)!.assign.slice(0, 60).every((a) => a === 0)).toBe(true)
  })
  it('EM con σ comune piccolissima e fissa dà le stesse assegnazioni di k-means', () => {
    const pts = blobs.map((p) => [p[0]!, p[1]!] as const)
    const centers = [[1, 1], [3, 2]]
    const tiny: Mat2Like = [[1e-4, 0], [0, 1e-4]]
    const e = responsibilities2d(pts, [
      { weight: 0.5, mu: [1, 1], S: tiny },
      { weight: 0.5, mu: [3, 2], S: tiny },
    ])
    const hard = e.resp.map((r) => (r[0] > r[1] ? 0 : 1))
    expect(hard).toEqual(kmeansAssign(pts, centers))
  })
  it('k-means++ e inizializzazione 2-D a seme', () => {
    const pts = blobs.map((p) => [p[0]!, p[1]!])
    const c = kmeansPlusPlus(createRng(3), pts, 2)
    expect(c).toHaveLength(2)
    expect(c).toEqual(kmeansPlusPlus(createRng(3), pts, 2))
    const init = initComponents2d(createRng(3), pts.map((p) => [p[0], p[1]] as const), 2)
    expect(init).toHaveLength(2)
    expect(init[0].weight).toBe(0.5)
  })
})

type Mat2Like = readonly [readonly [number, number], readonly [number, number]]
