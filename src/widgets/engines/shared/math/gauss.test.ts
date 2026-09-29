import { describe, expect, it } from 'vitest'
import { createRng } from '../../../../lib/rng'
import { linspace, normalPdf, normalPdf2d, trapz } from '../../../../lib/ml/stats'
import {
  bayesError1d, bayesRegions1d, bhattacharyyaBound, bhattacharyyaGauss, binnedMeasures, chernoffBound, chernoffMu,
  chernoffOptimum, combinePairs, conditionalGauss, decisionErrors1d, divergenceGauss, gauss1, gaussLogPdf, gaussPdf,
  gridLogMeasures, gridMeasures, intervalProb, jmBound, jmFromB, jmGauss, klGauss, levelToMahalanobis2, mahalanobisSq, ellipsoidMass,
  pairwiseMatrix, peakDensity, prepareGauss, regionsFromThresholds, sampleGauss,
} from './gauss'
import { normCdf } from './special'
import type { Gaussian } from './types'

const G = (m: number[], S: number[][]): Gaussian => ({ m, S })
const XS = linspace(-40, 40, 160001)
const onGrid = (f: (x: number) => number) => trapz(XS, XS.map(f))

describe('densità gaussiane', () => {
  it('1-D e 2-D coincidono con src/lib/ml/stats', () => {
    expect(gaussPdf([1.3], gauss1(0.5, 2))).toBeCloseTo(normalPdf(1.3, 0.5, 2), 15)
    const S = [[2, 0.6], [0.6, 1]]
    expect(gaussPdf([0.4, -1], G([1, 0], S))).toBeCloseTo(normalPdf2d([0.4, -1], [1, 0], S), 15)
    expect(gaussLogPdf([0.4, -1], G([1, 0], S))).toBeCloseTo(Math.log(normalPdf2d([0.4, -1], [1, 0], S)), 13)
  })
  it('in 3-D integra la costante giusta: picco 1/((2π)^{3/2}|Σ|^{1/2})', () => {
    const g = G([0, 0, 0], [[1, 0, 0], [0, 4, 0], [0, 0, 9]])
    expect(peakDensity(g)).toBeCloseTo(1 / ((2 * Math.PI) ** 1.5 * 6), 15)
    expect(gaussPdf([0, 0, 0], g)).toBeCloseTo(peakDensity(g), 15)
  })
  it('distanza di Mahalanobis al quadrato', () => {
    expect(mahalanobisSq([3, 0], [1, 0], [[4, 0], [0, 1]])).toBeCloseTo(1, 15)
    expect(mahalanobisSq([1, 1], [0, 0], [[2, 1], [1, 2]])).toBeCloseTo(2 / 3, 14)
  })
  it('prepareGauss valuta come le funzioni singole', () => {
    const g = G([1, 2], [[2, -0.5], [-0.5, 1]])
    const pg = prepareGauss(g)
    expect(pg.pdf([0.3, 1.1])).toBeCloseTo(gaussPdf([0.3, 1.1], g), 15)
    expect(pg.mahal2([0.3, 1.1])).toBeCloseTo(mahalanobisSq([0.3, 1.1], g.m, g.S), 14)
  })
  it('una covarianza non definita positiva non ha densità: RangeError', () => {
    expect(() => gaussPdf([0, 0], G([0, 0], [[1, 1], [1, 1]]))).toThrow(RangeError)
    expect(() => gauss1(0, 0)).toThrow(RangeError)
  })
  it('livello → ellisse: p(x) = picco·e^{−r²/2} e massa interna 1 − e^{−r²/2}', () => {
    const g = G([0, 0], [[2, 0.5], [0.5, 1]])
    const level = peakDensity(g) * Math.exp(-2)
    expect(levelToMahalanobis2(level, g)).toBeCloseTo(4, 12)
    expect(levelToMahalanobis2(peakDensity(g) * 1.01, g)).toBeNull()
    expect(ellipsoidMass(4, 2)).toBeCloseTo(1 - Math.exp(-2), 12)
  })
  it('campionamento a seme: media e covarianza empiriche vicine a quelle vere', () => {
    const g = G([1, -2, 0], [[2, 0.8, 0], [0.8, 1, 0.3], [0, 0.3, 0.5]])
    const pts = sampleGauss(createRng(7), 20000, g)
    const m = [0, 1, 2].map((j) => pts.reduce((s, p) => s + p[j], 0) / pts.length)
    m.forEach((v, j) => expect(v).toBeCloseTo(g.m[j], 1))
    const c01 = pts.reduce((s, p) => s + (p[0] - m[0]) * (p[1] - m[1]), 0) / pts.length
    expect(c01).toBeCloseTo(0.8, 1)
    expect(sampleGauss(createRng(7), 3, g)).toEqual(sampleGauss(createRng(7), 3, g))
  })
  it('gaussiana condizionata: E{x₁ | x₂} = m₁ + σ₁₂/σ₂₂ (x₂ − m₂), var = σ₁₁ − σ₁₂²/σ₂₂', () => {
    const c = conditionalGauss(G([1, 2], [[2, 0.6], [0.6, 1.5]]), [{ index: 1, value: 4 }])
    expect(c.indices).toEqual([0])
    expect(c.m[0]).toBeCloseTo(1 + (0.6 / 1.5) * 2, 14)
    expect(c.S[0][0]).toBeCloseTo(2 - 0.36 / 1.5, 14)
  })
})

describe('divergenza', () => {
  const a = gauss1(0, 1)
  const b = gauss1(2, 1.5)
  it('KL 1-D: ln(σ₂/σ₁) + (σ₁² + Δ²)/(2σ₂²) − ½, uguale all\'integrale', () => {
    const kl = Math.log(1.5) + (1 + 4) / (2 * 2.25) - 0.5
    expect(klGauss(a, b)).toBeCloseTo(kl, 14)
    // sulla griglia larga le code valgono 0 e 0·ln(0/0) non è un numero: qui basta [−15, 20]
    const xs = linspace(-15, 20, 70001)
    expect(klGauss(a, b)).toBeCloseTo(trapz(xs, xs.map((x) => normalPdf(x, 0, 1) * Math.log(normalPdf(x, 0, 1) / normalPdf(x, 2, 1.5)))), 8)
  })
  it('D = E{L\'_ij} + E{L\'_ji} con i due termini covarianze e medie', () => {
    const d = divergenceGauss(a, b)
    expect(d.D).toBeCloseTo(klGauss(a, b) + klGauss(b, a), 14)
    expect(d.D).toBeCloseTo(d.cov + d.mean, 14)
    // termine delle medie: ½ Δ² (1/σ_i² + 1/σ_j²)
    expect(d.mean).toBeCloseTo(0.5 * 4 * (1 + 1 / 2.25), 14)
  })
  it('proprietà: identiche → 0, simmetrica, additiva su feature indipendenti', () => {
    expect(divergenceGauss(a, a).D).toBe(0)
    expect(divergenceGauss(b, a).D).toBeCloseTo(divergenceGauss(a, b).D, 14)
    const A2 = G([0, 1], [[1, 0], [0, 2]])
    const B2 = G([2, -1], [[2.25, 0], [0, 0.5]])
    const sum = divergenceGauss(gauss1(0, 1), gauss1(2, 1.5)).D + divergenceGauss(gauss1(1, Math.SQRT2), gauss1(-1, Math.SQRT1_2)).D
    expect(divergenceGauss(A2, B2).D).toBeCloseTo(sum, 12)
  })
  it('variante della slide: con Σ_i = Σ_j dà 0 anche con medie diverse (il segno sbagliato)', () => {
    const S = [[1, 0.2], [0.2, 2]]
    const s = divergenceGauss(G([0, 0], S), G([3, 1], S), 'slide')
    expect(s.D).toBe(0)
    expect(divergenceGauss(G([0, 0], S), G([3, 1], S)).D).toBeGreaterThan(1)
  })
})

describe('Bhattacharyya, Jeffries-Matusita, Chernoff', () => {
  const a = gauss1(0, 1)
  const b = gauss1(2, 1.5)
  it('B 1-D: Δ²/(4(σ_i² + σ_j²)) + ½ ln((σ_i² + σ_j²)/(2σ_iσ_j)) = −ln ∫√(p_i p_j)', () => {
    const B = 4 / (4 * 3.25) + 0.5 * Math.log(3.25 / 3)
    const r = bhattacharyyaGauss(a, b)
    expect(r.B).toBeCloseTo(B, 14)
    expect(r.B).toBeCloseTo(r.mean + r.cov, 14)
    expect(r.B).toBeCloseTo(-Math.log(onGrid((x) => Math.sqrt(normalPdf(x, 0, 1) * normalPdf(x, 2, 1.5)))), 9)
    expect(r.rho).toBeCloseTo(Math.exp(-B), 14)
  })
  it('con Σ uguali B = D/8', () => {
    const S = [[1, 0.3], [0.3, 0.7]]
    const x = G([0, 0], S)
    const y = G([1, 2], S)
    expect(bhattacharyyaGauss(x, y).B).toBeCloseTo(divergenceGauss(x, y).D / 8, 13)
  })
  it('JM = √(2(1 − e^{−B})) satura a √2 ed è la radice di ∫(√p_i − √p_j)²', () => {
    expect(jmFromB(0)).toBe(0)
    expect(jmFromB(50)).toBeCloseTo(Math.SQRT2, 14)
    const jm = onGrid((x) => (Math.sqrt(normalPdf(x, 0, 1)) - Math.sqrt(normalPdf(x, 2, 1.5))) ** 2)
    expect(jmGauss(a, b)).toBeCloseTo(Math.sqrt(jm), 8)
    // σ uguali: JM = √(2(1 − e^{−d²/(8σ²)}))
    expect(jmGauss(gauss1(0, 2), gauss1(3, 2))).toBeCloseTo(Math.sqrt(2 * (1 - Math.exp(-9 / 32))), 14)
  })
  it('μ(s) = −ln ∫ p_i^s p_j^{1−s}: la forma gaussiana corretta usa (1 − s)Σ_i + sΣ_j', () => {
    for (const s of [0.1, 0.3, 0.5, 0.8]) {
      const direct = -Math.log(onGrid((x) => normalPdf(x, 0, 1) ** s * normalPdf(x, 2, 1.5) ** (1 - s)))
      expect(chernoffMu(a, b, s).mu).toBeCloseTo(direct, 8)
    }
    // slide: s e 1 − s scambiati, μ^slide(s) = μ(1 − s); coincidono in s = 1/2 e lì valgono B
    expect(chernoffMu(a, b, 0.2, 'slide').mu).toBeCloseTo(chernoffMu(a, b, 0.8).mu, 14)
    expect(chernoffMu(a, b, 0.5, 'slide').mu).toBeCloseTo(bhattacharyyaGauss(a, b).B, 14)
    expect(chernoffMu(a, b, 0).mu).toBeCloseTo(0, 14)
    expect(chernoffMu(a, b, 1).mu).toBeCloseTo(0, 14)
  })
  it('s* massimizza μ(s); con i prior minimizza ε_u, che resta sopra l\'errore di Bayes', () => {
    const opt = chernoffOptimum(a, b)
    for (let s = 0.05; s < 1; s += 0.05) expect(chernoffMu(a, b, s).mu).toBeLessThanOrEqual(opt.mu + 1e-12)
    const P1 = 0.7
    const P2 = 0.3
    const withPriors = chernoffOptimum(a, b, { Pi: P1, Pj: P2 })
    for (let s = 0.05; s < 1; s += 0.05) expect(chernoffBound(a, b, s, P1, P2)).toBeGreaterThanOrEqual(withPriors.eu - 1e-12)
    const pe = bayesError1d([{ mu: 0, sigma: 1, weight: P1 }, { mu: 2, sigma: 1.5, weight: P2 }]).pe
    expect(withPriors.eu).toBeGreaterThanOrEqual(pe)
    expect(bhattacharyyaBound(bhattacharyyaGauss(a, b).B, P1, P2)).toBeCloseTo(chernoffBound(a, b, 0.5, P1, P2), 14)
    expect(jmBound(jmGauss(a, b), P1, P2)).toBeCloseTo(chernoffBound(a, b, 0.5, P1, P2), 13)
  })
  it('variante della slide con prior diversi: ε_u resta un bound (prior accoppiati all\'esponente scambiato)', () => {
    // il caso del rilievo: σ_i = 2, σ_j = 0.5, Δ = 1, P_i = 0.8. Con P_i^s P_j^{1−s} e μ^slide(s) in s = 0.1 veniva
    // 0.1553, sotto l'errore di Bayes 0.1931
    const x = gauss1(0, 2)
    const y = gauss1(1, 0.5)
    const [Pi, Pj] = [0.8, 0.2]
    const pe = bayesError1d([{ mu: 0, sigma: 2, weight: Pi }, { mu: 1, sigma: 0.5, weight: Pj }]).pe
    expect(pe).toBeCloseTo(0.1931, 4)
    for (let k = 1; k < 50; k++) {
      const s = k / 50
      expect(chernoffBound(x, y, s, Pi, Pj, 'correct')).toBeGreaterThanOrEqual(pe)
      expect(chernoffBound(x, y, s, Pi, Pj, 'slide')).toBeGreaterThanOrEqual(pe)
      // la slide scambia s e 1 − s in μ e nei prior insieme: è lo stesso bound letto in 1 − s
      expect(chernoffBound(x, y, s, Pi, Pj, 'slide')).toBeCloseTo(chernoffBound(x, y, 1 - s, Pi, Pj, 'correct'), 13)
    }
    // l'ottimo della variante slide è lo stesso bound, in s* speculare
    const c = chernoffOptimum(x, y, { Pi, Pj })
    const sl = chernoffOptimum(x, y, { Pi, Pj, variant: 'slide' })
    expect(sl.eu).toBeCloseTo(c.eu, 12)
    expect(sl.s).toBeCloseTo(1 - c.s, 6)
    expect(sl.eu).toBeGreaterThanOrEqual(pe)
  })
  it('la covarianza mescolata M e il peso t usati nel conto escono con μ(s), nelle due varianti', () => {
    const Si = [[2, 0.4], [0.4, 1]]
    const Sj = [[0.6, -0.1], [-0.1, 1.5]]
    const x = G([0, 0], Si)
    const y = G([1, 2], Sj)
    const mix = (w: number) => Si.map((row, r) => row.map((v, c) => (1 - w) * v + w * Sj[r][c]))
    const correct = chernoffMu(x, y, 0.3)
    expect(correct.t).toBe(0.3)
    correct.M.forEach((row, r) => row.forEach((v, c) => expect(v).toBeCloseTo(mix(0.3)[r][c], 14)))
    // slide: M = sΣ_i + (1 − s)Σ_j, la matrice che dà il numero della slide
    const slide = chernoffMu(x, y, 0.3, 'slide')
    expect(slide.t).toBeCloseTo(0.7, 14)
    slide.M.forEach((row, r) => row.forEach((v, c) => expect(v).toBeCloseTo(0.3 * Si[r][c] + 0.7 * Sj[r][c], 14)))
  })
})

describe('più classi', () => {
  it('matrice simmetrica delle coppie e media pesata P_iP_j dell\'esempio d\'esame (JM_ave = 0.341)', () => {
    const vals: Record<string, number> = { '0-1': 1.161, '0-2': 1.311, '1-2': 0.596 }
    let calls = 0
    const M = pairwiseMatrix(3, (i, j) => {
      calls++
      return vals[`${i}-${j}`]
    })
    expect(calls).toBe(3)
    expect(M[2][1]).toBe(0.596)
    expect(M[1][1]).toBe(0)
    expect(combinePairs(M, { mode: 'ave', priors: [0.5, 0.3, 0.2] })).toBeCloseTo(0.341, 3)
    expect(combinePairs(M, { mode: 'min' })).toBe(0.596)
    expect(combinePairs(M, { mode: 'simple' })).toBeCloseTo((1.161 + 1.311 + 0.596) / 3, 14)
  })
})

describe('errore di Bayes esatto in 1-D', () => {
  it('σ uguali e prior uguali: soglia a metà, P_e = Φ(−d/2σ), P_c = Φ(d/2σ)', () => {
    const r = bayesError1d([{ mu: -1, sigma: 1, weight: 0.5 }, { mu: 1, sigma: 1, weight: 0.5 }])
    expect(r.cuts).toHaveLength(1)
    expect(r.cuts[0]).toBeCloseTo(0, 14)
    expect(r.pe).toBeCloseTo(normCdf(-1), 14)
    expect(r.pc).toBeCloseTo(normCdf(1), 14)
    expect(r.regions.map((q) => q.winner)).toEqual([0, 1])
  })
  it('prior diversi: x₀ = (μ₁ + μ₂)/2 + σ² ln(P₁/P₂)/(μ₂ − μ₁)', () => {
    const r = bayesError1d([{ mu: 0, sigma: 1.5, weight: 0.8 }, { mu: 3, sigma: 1.5, weight: 0.2 }])
    expect(r.cuts[0]).toBeCloseTo(1.5 + (2.25 * Math.log(4)) / 3, 13)
  })
  it('σ diverse: due soglie; P_e = ∫ min(P₁p₁, P₂p₂) come l\'integrale numerico', () => {
    const cls = [{ mu: 0, sigma: 1, weight: 0.6 }, { mu: 1.5, sigma: 3, weight: 0.4 }]
    const r = bayesError1d(cls)
    expect(r.cuts).toHaveLength(2)
    expect(r.regions.map((q) => q.winner)).toEqual([1, 0, 1])
    const num = onGrid((x) => Math.min(0.6 * normalPdf(x, 0, 1), 0.4 * normalPdf(x, 1.5, 3)))
    // i trapezi sbagliano di ~1e−9 sugli spigoli del minimo: la forma chiusa è quella esatta
    expect(r.pe).toBeCloseTo(num, 7)
  })
  it('tre classi: P_e = 1 − ∫ max P_i p_i', () => {
    const cls = [{ mu: 0, sigma: 1, weight: 0.5 }, { mu: 2, sigma: 0.7, weight: 0.3 }, { mu: 4, sigma: 1.2, weight: 0.2 }]
    const r = bayesError1d(cls)
    const num = 1 - onGrid((x) => Math.max(...cls.map((c) => c.weight * normalPdf(x, c.mu, c.sigma))))
    expect(r.pe).toBeCloseTo(num, 7)
    expect(r.perClass).toHaveLength(3)
  })
  it('nelle code resta preciso: classi lontane 20σ', () => {
    const r = bayesError1d([{ mu: -10, sigma: 1, weight: 0.5 }, { mu: 10, sigma: 1, weight: 0.5 }])
    expect(r.pe / normCdf(-10)).toBeCloseTo(1, 10)
  })
  it('soglie trascinate: errori per classe con regioni date dall\'utente', () => {
    const regions = regionsFromThresholds([0.5], [0, 1])
    const e = decisionErrors1d([{ mu: -1, sigma: 1, prior: 0.5 }, { mu: 1, sigma: 1, prior: 0.5 }], regions)
    expect(e.perClass[0]).toBeCloseTo(1 - normCdf(1.5), 14)
    expect(e.perClass[1]).toBeCloseTo(normCdf(-0.5), 14)
    expect(e.pe).toBeCloseTo(0.5 * (e.perClass[0] + e.perClass[1]), 14)
    expect(intervalProb(-1, 1, 0, 1)).toBeCloseTo(normCdf(1) - normCdf(-1), 14)
    expect(intervalProb(8, Number.POSITIVE_INFINITY, 0, 1)).toBeCloseTo(6.22096057427178e-16, 25)
  })
  it('costi: le regioni si calcolano con i pesi λ·P e gli errori con i soli prior', () => {
    const regions = bayesRegions1d([{ mu: 0, sigma: 1, weight: 0.5 * 5 }, { mu: 2, sigma: 1, weight: 0.5 }]).regions
    const e = decisionErrors1d([{ mu: 0, sigma: 1, prior: 0.5 }, { mu: 2, sigma: 1, prior: 0.5 }], regions)
    const bayes = bayesError1d([{ mu: 0, sigma: 1, weight: 0.5 }, { mu: 2, sigma: 1, weight: 0.5 }])
    expect(e.pe).toBeGreaterThan(bayes.pe)
    expect(e.perClass[0]).toBeLessThan(bayes.perClass[0])
  })
})

describe('misure su una griglia (densità qualsiasi, istogrammi)', () => {
  it('sulle gaussiane ritrova D, B, JM, μ(s) e P_e in forma chiusa', () => {
    const xs = linspace(-15, 20, 20001)
    const p = xs.map((x) => normalPdf(x, 0, 1))
    const q = xs.map((x) => normalPdf(x, 2, 1.5))
    const m = gridMeasures(xs, p, q, { P1: 0.6, P2: 0.4, s: 0.3 })
    const a = gauss1(0, 1)
    const b = gauss1(2, 1.5)
    expect(m.D).toBeCloseTo(divergenceGauss(a, b).D, 6)
    expect(m.Dij).toBeCloseTo(klGauss(a, b), 6)
    expect(m.B).toBeCloseTo(bhattacharyyaGauss(a, b).B, 6)
    expect(m.JM).toBeCloseTo(jmGauss(a, b), 6)
    expect(m.mu_s).toBeCloseTo(chernoffMu(a, b, 0.3).mu, 6)
    expect(m.pe).toBeCloseTo(bayesError1d([{ mu: 0, sigma: 1, weight: 0.6 }, { mu: 2, sigma: 1.5, weight: 0.4 }]).pe, 6)
  })
  it('istogrammi: dove una densità è 0 e l\'altra no la divergenza è infinita, B e JM restano finiti', () => {
    const m = binnedMeasures(0.5, [0.4, 0.8, 0.8, 0], [0, 0.6, 0.8, 0.6])
    expect(m.D).toBe(Number.POSITIVE_INFINITY)
    expect(Number.isFinite(m.B)).toBe(true)
    expect(m.JM).toBeLessThan(Math.SQRT2)
    const same = binnedMeasures(0.5, [0.5, 1, 0.5], [0.5, 1, 0.5])
    expect(same.D).toBe(0)
    expect(same.B).toBeCloseTo(0, 14)
    expect(same.pe).toBeCloseTo(0.5, 14)
  })
  it('curve campionate su un dominio largo: le code che vanno a 0 per underflow non fanno D = ∞ se si passano i logaritmi', () => {
    // N(0, 1) contro N(1.5, 2²): D esatta 2.53125. Su [−40, 40] φ(x) va a 0 prima dell'altra densità e la
    // convenzione p ln(p/0) = ∞, giusta per i bin vuoti, scatta su uno zero numerico
    const a = gauss1(0, 1)
    const b = gauss1(1.5, 2)
    const xs = linspace(-40, 40, 40001)
    const wide = gridMeasures(xs, xs.map((x) => normalPdf(x, 0, 1)), xs.map((x) => normalPdf(x, 1.5, 2)))
    expect(wide.D).toBe(Number.POSITIVE_INFINITY)
    const lp = xs.map((x) => gaussLogPdf([x], a))
    const lq = xs.map((x) => gaussLogPdf([x], b))
    const m = gridLogMeasures(xs, lp, lq, { P1: 0.7, P2: 0.3, s: 0.35 })
    expect(divergenceGauss(a, b).D).toBeCloseTo(2.53125, 12)
    expect(m.D).toBeCloseTo(2.53125, 6)
    expect(m.Dij).toBeCloseTo(klGauss(a, b), 6)
    expect(m.B).toBeCloseTo(bhattacharyyaGauss(a, b).B, 6)
    expect(m.JM).toBeCloseTo(jmGauss(a, b), 6)
    expect(m.mu_s).toBeCloseTo(chernoffMu(a, b, 0.35).mu, 6)
    expect(m.pe).toBeCloseTo(bayesError1d([{ mu: 0, sigma: 1, weight: 0.7 }, { mu: 1.5, sigma: 2, weight: 0.3 }]).pe, 6)
    // un vero buco nel supporto (ln q = −∞ dove p > 0) resta una divergenza infinita
    const hole = lq.map((v, k) => (Math.abs(xs[k]) < 0.5 ? Number.NEGATIVE_INFINITY : v))
    expect(gridLogMeasures(xs, lp, hole).Dij).toBe(Number.POSITIVE_INFINITY)
    // e sulle stesse densità le due strade danno gli stessi numeri dove non c'è underflow
    const narrow = linspace(-15, 20, 20001)
    const lin = gridMeasures(narrow, narrow.map((x) => normalPdf(x, 0, 1)), narrow.map((x) => normalPdf(x, 1.5, 2)), { s: 0.35 })
    const log = gridLogMeasures(narrow, narrow.map((x) => gaussLogPdf([x], a)), narrow.map((x) => gaussLogPdf([x], b)), { s: 0.35 })
    for (const k of ['Dij', 'Dji', 'B', 'JM', 'pe', 'mu_s'] as const) expect(log[k]).toBeCloseTo(lin[k] as number, 9)
  })
})
