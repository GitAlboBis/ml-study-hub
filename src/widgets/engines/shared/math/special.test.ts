import { describe, expect, it } from 'vitest'
import {
  betaCdf, betaInv, binomialCdf, binomialLogPmf, binomialPmf, binomialSf, bisectRoot, chi2Cdf, erf, erfc, gammaP, goldenMax,
  logChoose, logSumExp, normCdf, normInv, normPdf, normSf, numericGradient, numericHessian,
} from './special'
import { normalPdf } from '../../../../lib/ml/stats'

// Valori di riferimento: tavole di Abramowitz-Stegun e calcoli in precisione estesa (erfc(10) ≈ 2.0885e−45).
const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b)

describe('erf ed erfc', () => {
  it('erf su valori tabulati, a precisione di macchina', () => {
    expect(erf(0)).toBe(0)
    expect(erf(0.5)).toBeCloseTo(0.5204998778130465, 15)
    expect(erf(1)).toBeCloseTo(0.8427007929497149, 15)
    expect(erf(2)).toBeCloseTo(0.9953222650189527, 15)
  })
  it('erf è dispari e va a ±1', () => {
    expect(erf(-1)).toBeCloseTo(-0.8427007929497149, 15)
    expect(erf(8)).toBe(1)
    expect(erf(-8)).toBe(-1)
    expect(erf(Number.POSITIVE_INFINITY)).toBe(1)
    expect(Number.isNaN(erf(Number.NaN))).toBe(true)
  })
  it('erfc nelle code resta preciso in senso relativo, dove 1 − erf perderebbe tutto', () => {
    expect(rel(erfc(3), 2.209049699858544e-5)).toBeLessThan(1e-12)
    expect(rel(erfc(5), 1.5374597944280349e-12)).toBeLessThan(1e-12)
    expect(rel(erfc(10), 2.088487583762545e-45)).toBeLessThan(1e-12)
    expect(erfc(30)).toBe(0)
  })
  it('erfc(−x) = 2 − erfc(x) e erfc(0) = 1', () => {
    expect(erfc(0)).toBe(1)
    expect(erfc(-1)).toBeCloseTo(2 - (1 - 0.8427007929497149), 15)
    expect(erfc(-10)).toBe(2)
  })
  it('è continua dove cambia il metodo di calcolo', () => {
    const a = erfc(2.5 - 1e-12)
    const b = erfc(2.5 + 1e-12)
    expect(rel(a, b)).toBeLessThan(1e-9)
  })
})

describe('cdf normale, coda e inversa', () => {
  it('Φ nei quantili noti', () => {
    expect(normCdf(0)).toBe(0.5)
    expect(normCdf(1.959963984540054)).toBeCloseTo(0.975, 14)
    expect(normCdf(1, 1, 2)).toBe(0.5)
    expect(normCdf(3, 1, 2)).toBeCloseTo(0.8413447460685429, 14)
  })
  it('la coda Q(z) = 1 − Φ(z) è precisa anche lontano', () => {
    expect(rel(normSf(8), 6.22096057427178e-16)).toBeLessThan(1e-10)
    expect(rel(normCdf(-8), 6.22096057427178e-16)).toBeLessThan(1e-10)
    expect(normSf(0)).toBe(0.5)
  })
  it('normInv inverte Φ', () => {
    expect(normInv(0.5)).toBe(0)
    expect(normInv(0.975)).toBeCloseTo(1.959963984540054, 12)
    expect(normInv(0.025)).toBeCloseTo(-1.959963984540054, 12)
    for (const p of [1e-12, 1e-6, 0.01, 0.3, 0.7, 0.99, 1 - 1e-9]) expect(rel(normCdf(normInv(p)), p)).toBeLessThan(1e-11)
    expect(normInv(0)).toBe(Number.NEGATIVE_INFINITY)
    expect(normInv(1)).toBe(Number.POSITIVE_INFINITY)
    expect(() => normInv(1.2)).toThrow(RangeError)
  })
  it('σ ≤ 0 è un errore di chi chiama', () => {
    expect(() => normCdf(0, 0, 0)).toThrow(RangeError)
    expect(() => normPdf(0, 0, 0)).toThrow(RangeError)
  })
  it('densità φ: 1/√(2π) nel picco, 1/(σ√(2π)) e^{−z²/2} altrove, uguale a normalPdf di src/lib/ml', () => {
    expect(normPdf(0)).toBeCloseTo(0.3989422804014327, 15)
    expect(normPdf(1)).toBeCloseTo(0.24197072451914337, 15)
    expect(normPdf(1, 1, 2)).toBeCloseTo(0.3989422804014327 / 2, 15)
    expect(normPdf(-0.3, 1, 0.5)).toBe(normalPdf(-0.3, 1, 0.5))
  })
})

describe('gamma incompleta e chi-quadro', () => {
  it('P(1, x) = 1 − e^{−x}', () => {
    for (const x of [0.1, 1, 2, 7.5]) expect(gammaP(1, x)).toBeCloseTo(1 - Math.exp(-x), 14)
    expect(gammaP(2, 0)).toBe(0)
    expect(gammaP(3, Number.POSITIVE_INFINITY)).toBe(1)
  })
  it('quantili del 95% della chi-quadro a 1 e 2 gradi', () => {
    expect(chi2Cdf(3.841458820694124, 1)).toBeCloseTo(0.95, 12)
    expect(chi2Cdf(5.991464547107979, 2)).toBeCloseTo(0.95, 12)
  })
  it('in 2-D la massa dentro l\'ellisse di Mahalanobis r è 1 − e^{−r²/2}', () => {
    for (const r of [0.5, 1, 2, 3]) expect(chi2Cdf(r * r, 2)).toBeCloseTo(1 - Math.exp(-r * r / 2), 13)
  })
  it('argomenti fuori dominio', () => {
    expect(() => gammaP(0, 1)).toThrow(RangeError)
    expect(chi2Cdf(-1, 3)).toBe(0)
  })
})

describe('utilità numeriche', () => {
  it('logSumExp non trabocca', () => {
    expect(logSumExp([1000, 1000])).toBeCloseTo(1000 + Math.LN2, 12)
    expect(logSumExp([-1000, -1000])).toBeCloseTo(-1000 + Math.LN2, 12)
    expect(logSumExp([])).toBe(Number.NEGATIVE_INFINITY)
    expect(logSumExp([Number.NEGATIVE_INFINITY, 0])).toBe(0)
    expect(logSumExp([Number.POSITIVE_INFINITY, 0])).toBe(Number.POSITIVE_INFINITY)
  })
  it('goldenMax trova il massimo di una funzione unimodale', () => {
    const r = goldenMax((x) => -((x - 0.3) ** 2) + 2, 0, 1)
    expect(r.x).toBeCloseTo(0.3, 7)
    expect(r.fx).toBeCloseTo(2, 12)
    // massimo sul bordo
    expect(goldenMax((x) => x, 0, 1).x).toBeCloseTo(1, 7)
  })
  it('bisectRoot trova la radice con segni opposti agli estremi', () => {
    expect(bisectRoot((x) => x ** 3 - 2, 0, 2)).toBeCloseTo(2 ** (1 / 3), 12)
    expect(() => bisectRoot((x) => x * x + 1, -1, 1)).toThrow(RangeError)
  })
  it('gradiente ed Hessiana numerici di x² + 3xy in (1, 2)', () => {
    const f = (t: readonly number[]) => t[0] ** 2 + 3 * t[0] * t[1]
    const g = numericGradient(f, [1, 2])
    expect(g[0]).toBeCloseTo(8, 6)
    expect(g[1]).toBeCloseTo(3, 6)
    const H = numericHessian(f, [1, 2])
    expect(H[0][0]).toBeCloseTo(2, 4)
    expect(H[0][1]).toBeCloseTo(3, 4)
    expect(H[1][0]).toBeCloseTo(3, 4)
    expect(H[1][1]).toBeCloseTo(0, 4)
  })
})

// Valori di riferimento: scipy.stats 1.17 (binom, beta) e mpmath a 40 cifre per le code.
describe('binomiale (estimator-lab: K in R, frequenza relativa)', () => {
  it('pmf, cdf e coda su un caso da tavola: B(10, 0.3) in k = 3', () => {
    expect(binomialPmf(3, 10, 0.3)).toBeCloseTo(0.2668279319999998, 15)
    expect(binomialCdf(3, 10, 0.3)).toBeCloseTo(0.6496107184000001, 14)
    expect(binomialSf(3, 10, 0.3)).toBeCloseTo(0.35038928159999994, 14)
    expect(binomialCdf(3, 10, 0.3) + binomialSf(3, 10, 0.3)).toBeCloseTo(1, 14)
    // somma delle pmf = cdf
    let acc = 0
    for (let k = 0; k <= 3; k++) acc += binomialPmf(k, 10, 0.3)
    expect(acc).toBeCloseTo(binomialCdf(3, 10, 0.3), 14)
  })
  it('in scala logaritmica: n = 1000 non trabocca e le code restano precise', () => {
    expect(binomialLogPmf(500, 1000, 0.5)).toBeCloseTo(-3.679918992094258, 11)
    expect(rel(binomialPmf(500, 1000, 0.5), 0.025225018178360824)).toBeLessThan(1e-11)
    expect(rel(binomialCdf(5, 1000, 0.5), 7.738505306294352e-289)).toBeLessThan(1e-9)
    expect(rel(binomialSf(990, 1000, 0.5), 2.5033196038827973e-280)).toBeLessThan(1e-9)
    expect(binomialCdf(40, 100, 0.5)).toBeCloseTo(0.028443966820490395, 13)
    expect(logChoose(1000, 500)).toBeCloseTo(-3.679918992094258 + 1000 * Math.LN2, 9)
  })
  it('casi limite: k fuori da [0, n], p = 0 e p = 1, k non intero nella cdf', () => {
    expect(binomialPmf(-1, 10, 0.3)).toBe(0)
    expect(binomialPmf(11, 10, 0.3)).toBe(0)
    expect(binomialPmf(2.5, 10, 0.3)).toBe(0)
    expect(binomialPmf(0, 10, 0)).toBe(1)
    expect(binomialPmf(3, 10, 0)).toBe(0)
    expect(binomialPmf(10, 10, 1)).toBe(1)
    expect(binomialPmf(0, 0, 0.4)).toBe(1)
    expect(binomialCdf(-1, 10, 0.3)).toBe(0)
    expect(binomialCdf(10, 10, 0.3)).toBe(1)
    expect(binomialCdf(3.7, 10, 0.3)).toBe(binomialCdf(3, 10, 0.3))
    expect(binomialCdf(0, 10, 0)).toBe(1)
    expect(binomialCdf(9, 10, 1)).toBe(0)
    expect(binomialSf(9, 10, 1)).toBe(1)
    expect(() => binomialPmf(1, 10, 1.2)).toThrow(RangeError)
    expect(() => binomialPmf(1, 3.5, 0.2)).toThrow(RangeError)
    expect(() => binomialCdf(1, -2, 0.2)).toThrow(RangeError)
  })
})

describe('Beta: cdf e quantili (cella K-NN, intervalli bayesiani)', () => {
  it('cdf I_x(a, b) contro scipy', () => {
    expect(betaCdf(0.3, 2, 5)).toBeCloseTo(0.579825, 14)
    expect(betaCdf(0.9, 0.5, 0.5)).toBeCloseTo(0.7951672353008665, 13)
    expect(betaCdf(0.01, 0.5, 0.5)).toBeCloseTo(0.06376856085851985, 13)
    expect(betaCdf(0.2, 10, 30)).toBeCloseTo(0.2413594512807924, 13)
    // contenuto di probabilità della cella del 5° vicino su N = 100: Beta(K, N − K + 1)
    expect(betaCdf(0.05, 5, 96)).toBeCloseTo(0.5640186993142883, 13)
    expect(betaCdf(0, 2, 3)).toBe(0)
    expect(betaCdf(1, 2, 3)).toBe(1)
    expect(betaCdf(-0.5, 2, 3)).toBe(0)
    expect(betaCdf(1.5, 2, 3)).toBe(1)
    expect(() => betaCdf(0.5, 0, 3)).toThrow(RangeError)
  })
  it('simmetria I_x(a, b) = 1 − I_{1−x}(b, a) e legame con la binomiale', () => {
    expect(betaCdf(0.37, 3, 8)).toBeCloseTo(1 - betaCdf(0.63, 8, 3), 14)
    // P{K ≤ k} = I_{1−p}(n − k, k + 1)
    expect(binomialCdf(4, 12, 0.35)).toBeCloseTo(betaCdf(0.65, 8, 5), 14)
  })
  it('quantili: intervallo al 95% di Beta(3, 9) e una coda estrema', () => {
    expect(betaInv(0.025, 3, 9)).toBeCloseTo(0.06021773417290665, 12)
    expect(betaInv(0.975, 3, 9)).toBeCloseTo(0.5177558523601726, 12)
    expect(rel(betaInv(1e-6, 2, 50), 2.8018420335858742e-5)).toBeLessThan(1e-9)
    expect(betaInv(0, 2, 3)).toBe(0)
    expect(betaInv(1, 2, 3)).toBe(1)
    for (const p of [0.1, 0.5, 0.9]) expect(betaCdf(betaInv(p, 0.5, 0.5), 0.5, 0.5)).toBeCloseTo(p, 13)
    expect(() => betaInv(1.1, 2, 3)).toThrow(RangeError)
  })
})
