import { describe, expect, it } from 'vitest'
import { createRng } from '../rng'
import {
  betaPdf, covariance, covarianceMatrix, dirichletPdf, erf, gammaPdf, histogram, linspace, logGamma, mean, mixturePdf,
  normalCdf, normalPdf, normalPdf2d, rayleighPdf, sampleMixture, sampleMixtureLabeled, sampleNormal, sampleNormal2d,
  trapz, variance,
} from './stats'

const SQRT_2PI = Math.sqrt(2 * Math.PI)

describe('stats', () => {
  it('la pdf normale integra a 1', () => {
    const xs = linspace(-10, 10, 4001)
    expect(trapz(xs, xs.map((x) => normalPdf(x, 0, 1)))).toBeCloseTo(1, 4)
  })
})

describe('linspace', () => {
  it('divide l\'intervallo in n punti equispaziati, estremi inclusi', () => {
    expect(linspace(0, 1, 5)).toEqual([0, 0.25, 0.5, 0.75, 1])
  })
  it('l\'ultimo punto è esattamente b, senza errore di arrotondamento accumulato', () => {
    expect(linspace(-20, 25, 9001).at(-1)).toBe(25)
    expect(linspace(0, 0.3, 4).at(-1)).toBe(0.3)
    // qui a + (n − 1)·passo sbaglierebbe l'ultima cifra: 0.9999999999999999 e 0.30000000000000004
    expect(linspace(0, 1, 50).at(-1)).toBe(1)
    expect(linspace(0, 0.3, 38).at(-1)).toBe(0.3)
    expect(linspace(0.1, 0.7, 7)).toHaveLength(7)
  })
  it('accetta intervalli decrescenti', () => {
    expect(linspace(1, 0, 3)).toEqual([1, 0.5, 0])
  })
  it('n = 1 dà il solo estremo a, n = 0 una griglia vuota', () => {
    expect(linspace(3, 9, 1)).toEqual([3])
    expect(linspace(3, 9, 0)).toEqual([])
  })
  it('rifiuta n negativo o non intero', () => {
    expect(() => linspace(0, 1, -1)).toThrow(RangeError)
    expect(() => linspace(0, 1, 2.5)).toThrow(RangeError)
    expect(() => linspace(0, 1, Number.NaN)).toThrow(RangeError)
  })
})

describe('trapz', () => {
  it('è esatta sulle funzioni lineari, anche su griglia non uniforme', () => {
    expect(trapz([0, 1, 3], [0, 1, 3])).toBeCloseTo(4.5, 12)
    expect(trapz([0, 0.1, 0.5, 2], [1, 1, 1, 1])).toBeCloseTo(2, 12)
  })
  it('approssima l\'integrale di x² su [0, 1]', () => {
    const xs = linspace(0, 1, 1001)
    expect(trapz(xs, xs.map((x) => x * x))).toBeCloseTo(1 / 3, 6)
  })
  it('con la griglia percorsa al contrario cambia segno', () => {
    expect(trapz([3, 1, 0], [3, 1, 0])).toBeCloseTo(-4.5, 12)
  })
  it('con meno di due punti non c\'è area: 0', () => {
    expect(trapz([], [])).toBe(0)
    expect(trapz([2], [5])).toBe(0)
  })
  it('rifiuta griglia e valori di lunghezza diversa', () => {
    expect(() => trapz([0, 1], [1])).toThrow(RangeError)
  })
})

describe('mean, variance, covariance', () => {
  const xs = [2, 4, 4, 4, 5, 5, 7, 9]
  it('media aritmetica', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5)
    expect(mean(xs)).toBe(5)
  })
  it('varianza con 1/N (stima ML, distorta) per default e con 1/(N−1) su richiesta', () => {
    expect(variance(xs)).toBeCloseTo(4, 12)
    expect(variance(xs, true)).toBeCloseTo(32 / 7, 12)
    // E{Σ̂_ML} = (N−1)/N · Σ: le due stime stanno nel rapporto (N−1)/N
    expect(variance(xs) / variance(xs, true)).toBeCloseTo(7 / 8, 12)
  })
  it('covarianza tra due serie, nelle due normalizzazioni', () => {
    expect(covariance([1, 2, 3], [2, 4, 6])).toBeCloseTo(4 / 3, 12)
    expect(covariance([1, 2, 3], [2, 4, 6], true)).toBeCloseTo(2, 12)
    expect(covariance([1, 2, 3], [6, 4, 2])).toBeCloseTo(-4 / 3, 12)
    expect(covariance(xs, xs)).toBeCloseTo(variance(xs), 12)
  })
  it('matrice di covarianza di punti n-dimensionali', () => {
    const c = covarianceMatrix([[1, 2], [3, 6], [5, 10]])
    expect(c[0][0]).toBeCloseTo(8 / 3, 12)
    expect(c[1][1]).toBeCloseTo(32 / 3, 12)
    expect(c[0][1]).toBeCloseTo(16 / 3, 12)
    expect(c[1][0]).toBe(c[0][1])
    expect(covarianceMatrix([[1, 2], [3, 6], [5, 10]], true)[0][0]).toBeCloseTo(4, 12)
  })
  it('campione singolo: varianza 0 con 1/N, non definita (NaN) con 1/(N−1)', () => {
    expect(mean([5])).toBe(5)
    expect(variance([5])).toBe(0)
    expect(variance([5], true)).toBeNaN()
    expect(covariance([5], [7], true)).toBeNaN()
  })
  it('campione vuoto: NaN, non un numero inventato', () => {
    expect(mean([])).toBeNaN()
    expect(variance([])).toBeNaN()
    expect(covariance([], [])).toBeNaN()
    expect(covarianceMatrix([])).toEqual([])
  })
  it('rifiuta serie di lunghezza diversa e punti di dimensione diversa', () => {
    expect(() => covariance([1, 2], [1])).toThrow(RangeError)
    expect(() => covarianceMatrix([[1, 2], [3]])).toThrow(RangeError)
  })
})

describe('histogram', () => {
  const area = (bins: { x0: number; x1: number; density: number }[]) => bins.reduce((s, b) => s + b.density * (b.x1 - b.x0), 0)

  it('10 valori in 5 bin: conteggi, estremi e massimo nell\'ultimo bin', () => {
    const h = histogram([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5)
    expect(h).toHaveLength(5)
    expect(h.map((b) => b.count)).toEqual([2, 2, 2, 2, 2])
    expect(h[0].x0).toBe(0)
    expect(h[4].x1).toBe(9)
    expect(h[1].x0).toBeCloseTo(1.8, 12)
  })
  it('l\'ultimo bin finisce esattamente sul massimo, senza errore di arrotondamento', () => {
    // lo + 37·larghezza darebbe 0.30000000000000004
    expect(histogram([0, 0.3], 37)[36].x1).toBe(0.3)
    expect(histogram([0, 0.3], 37)[36].count).toBe(1)
  })
  it('la normalizzazione a densità K/(N·larghezza) dà area 1', () => {
    const r = createRng(11)
    const h = histogram(sampleNormal(r, 500, 3, 2), 17)
    expect(area(h)).toBeCloseTo(1, 12)
    expect(h.reduce((s, b) => s + b.count, 0)).toBe(500)
  })
  it('con un dominio esplicito i valori esterni non si contano ma restano in N', () => {
    const h = histogram([0.5, 1.5, 99], 2, [0, 2])
    expect(h.map((b) => b.count)).toEqual([1, 1])
    expect(h[0].density).toBeCloseTo(1 / 3, 12)
    // l'area è la frazione di campioni caduta nel dominio, così il confronto con la pdf vera resta onesto
    expect(area(h)).toBeCloseTo(2 / 3, 12)
  })
  it('gli estremi interni appartengono al bin di destra', () => {
    expect(histogram([0, 1, 2], 2, [0, 2]).map((b) => b.count)).toEqual([1, 2])
  })
  it('valori tutti uguali: il dominio si allarga di mezza unità per lato', () => {
    const h = histogram([3, 3, 3], 4)
    expect(h[0].x0).toBe(2.5)
    expect(h[3].x1).toBe(3.5)
    expect(h.reduce((s, b) => s + b.count, 0)).toBe(3)
    expect(area(h)).toBeCloseTo(1, 12)
  })
  it('campione vuoto: nessun bin senza dominio, bin a zero con il dominio', () => {
    expect(histogram([], 5)).toEqual([])
    const h = histogram([], 2, [0, 1])
    expect(h.map((b) => [b.count, b.density])).toEqual([[0, 0], [0, 0]])
  })
  it('ignora i NaN invece di sporcare i conteggi', () => {
    expect(histogram([0, Number.NaN, 1], 2, [0, 1]).map((b) => b.count)).toEqual([1, 1])
  })
  it('rifiuta numero di bin o dominio non validi', () => {
    expect(() => histogram([1, 2], 0)).toThrow(RangeError)
    expect(() => histogram([1, 2], 2.5)).toThrow(RangeError)
    expect(() => histogram([1, 2], 3, [2, 2])).toThrow(RangeError)
    expect(() => histogram([1, 2], 3, [5, 1])).toThrow(RangeError)
  })
  it('con molti campioni converge alla pdf vera', () => {
    const r = createRng(2026)
    const h = histogram(sampleNormal(r, 40000, 0, 1), 32, [-4, 4])
    // deviazione standard della densità nel bin centrale ≈ 0.006: la soglia sta a quasi 5σ
    for (const b of h) expect(Math.abs(b.density - normalPdf((b.x0 + b.x1) / 2))).toBeLessThan(0.03)
  })
})

describe('normalPdf, normalCdf', () => {
  it('valori noti', () => {
    expect(normalPdf(0, 0, 1)).toBeCloseTo(1 / SQRT_2PI, 14)
    expect(normalPdf(1, 1, 2)).toBeCloseTo(1 / (2 * SQRT_2PI), 14)
    expect(normalPdf(1)).toBeCloseTo(Math.exp(-0.5) / SQRT_2PI, 14)
  })
  it('è simmetrica rispetto alla media', () => {
    expect(normalPdf(3.7, 2, 1.5)).toBeCloseTo(normalPdf(0.3, 2, 1.5), 14)
  })
  it('il secondo parametro è la deviazione standard σ, non la varianza', () => {
    const xs = linspace(-30, 30, 6001)
    const ys = xs.map((x) => normalPdf(x, 1, 3))
    expect(trapz(xs, xs.map((x, i) => (x - 1) ** 2 * ys[i]))).toBeCloseTo(9, 4)
  })
  it('rifiuta σ ≤ 0 o non finita', () => {
    expect(() => normalPdf(0, 0, 0)).toThrow(RangeError)
    expect(() => normalPdf(0, 0, -1)).toThrow(RangeError)
    expect(() => normalPdf(0, 0, Number.NaN)).toThrow(RangeError)
  })
  it('erf e cdf normale: valori di tabella (precisione 1.5e-7)', () => {
    expect(erf(0)).toBeCloseTo(0, 6)
    expect(erf(1)).toBeCloseTo(0.8427007929, 6)
    expect(erf(-1)).toBeCloseTo(-0.8427007929, 6)
    expect(normalCdf(0)).toBeCloseTo(0.5, 6)
    expect(normalCdf(1.96)).toBeCloseTo(0.9750021, 6)
    expect(normalCdf(-1)).toBeCloseTo(0.1586553, 6)
    expect(normalCdf(7, 5, 2)).toBeCloseTo(normalCdf(1), 12)
  })
  it('P(a ≤ x ≤ b) dalla cdf coincide con l\'area sotto la pdf', () => {
    const xs = linspace(-0.5, 1.2, 2001)
    expect(normalCdf(1.2, 0.3, 0.8) - normalCdf(-0.5, 0.3, 0.8)).toBeCloseTo(trapz(xs, xs.map((x) => normalPdf(x, 0.3, 0.8))), 6)
  })
})

describe('normalPdf2d', () => {
  it('nella media con covarianza identità vale 1/(2π)', () => {
    expect(normalPdf2d([0, 0], [0, 0], [[1, 0], [0, 1]])).toBeCloseTo(1 / (2 * Math.PI), 14)
  })
  it('con covarianza diagonale è il prodotto di due normali 1-D', () => {
    expect(normalPdf2d([1, 3], [0, 1], [[4, 0], [0, 9]])).toBeCloseTo(normalPdf(1, 0, 2) * normalPdf(3, 1, 3), 14)
  })
  it('con feature correlate usa determinante e inversa della covarianza', () => {
    const cov = [[2, 1.2], [1.2, 1]]
    expect(normalPdf2d([3, 3], [3, 3], cov)).toBeCloseTo(1 / (2 * Math.PI * Math.sqrt(0.56)), 12)
    // (x−m)ᵗ Σ⁻¹ (x−m) con x−m = [1, −2]: (σ₂²·1 − 2σ₁₂·(1)(−2) + σ₁²·4) / |Σ| = (1 + 4.8 + 8) / 0.56
    expect(normalPdf2d([4, 1], [3, 3], cov)).toBeCloseTo(Math.exp(-0.5 * (13.8 / 0.56)) / (2 * Math.PI * Math.sqrt(0.56)), 12)
  })
  it('integra a 1 sul piano', () => {
    const g = linspace(-8, 8, 161)
    const cov = [[1.5, -0.6], [-0.6, 0.8]]
    const rows = g.map((y) => trapz(g, g.map((x) => normalPdf2d([x, y], [0.5, -0.3], cov))))
    expect(trapz(g, rows)).toBeCloseTo(1, 4)
  })
  it('rifiuta covarianze non simmetriche o non definite positive', () => {
    expect(() => normalPdf2d([0, 0], [0, 0], [[1, 0.5], [0.2, 1]])).toThrow(RangeError)
    expect(() => normalPdf2d([0, 0], [0, 0], [[1, 1], [1, 1]])).toThrow(RangeError)
    expect(() => normalPdf2d([0, 0], [0, 0], [[1, 2], [2, 1]])).toThrow(RangeError)
    expect(() => normalPdf2d([0, 0], [0, 0], [[-1, 0], [0, -1]])).toThrow(RangeError)
  })
})

describe('campionamento con Rng', () => {
  it('sampleNormal è deterministico per seed e rispetta media e σ', () => {
    expect(sampleNormal(createRng(5), 10, 1, 2)).toEqual(sampleNormal(createRng(5), 10, 1, 2))
    const xs = sampleNormal(createRng(8), 20000, -2, 0.5)
    expect(xs).toHaveLength(20000)
    expect(mean(xs)).toBeCloseTo(-2, 1)
    expect(Math.sqrt(variance(xs, true))).toBeCloseTo(0.5, 1)
  })
  it('sampleNormal: n = 0 dà un campione vuoto, σ = 0 un campione degenere', () => {
    expect(sampleNormal(createRng(1), 0)).toEqual([])
    expect(sampleNormal(createRng(1), 3, 4, 0)).toEqual([4, 4, 4])
    expect(() => sampleNormal(createRng(1), -1)).toThrow(RangeError)
    expect(() => sampleNormal(createRng(1), 3, 0, -1)).toThrow(RangeError)
  })
  it('sampleMixture rispetta i pesi, anche non normalizzati', () => {
    const comps = [{ weight: 3, mu: -5, sigma: 0.5 }, { weight: 7, mu: 5, sigma: 0.5 }]
    const xs = sampleMixture(createRng(21), 10000, comps)
    expect(xs.filter((x) => x < 0).length / xs.length).toBeCloseTo(0.3, 1)
    expect(sampleMixture(createRng(4), 50, comps)).toEqual(sampleMixture(createRng(4), 50, comps))
  })
  it('sampleMixtureLabeled ricorda il modo che ha generato ogni campione', () => {
    const comps = [{ weight: 0.5, mu: -10, sigma: 0.1 }, { weight: 0.5, mu: 10, sigma: 0.1 }]
    const labeled = sampleMixtureLabeled(createRng(9), 200, comps)
    for (const s of labeled) expect(s.component).toBe(s.x < 0 ? 0 : 1)
    expect(sampleMixture(createRng(9), 200, comps)).toEqual(labeled.map((s) => s.x))
  })
  it('una componente con peso 0 non genera mai campioni', () => {
    const comps = [{ weight: 0, mu: -100, sigma: 1 }, { weight: 1, mu: 0, sigma: 1 }, { weight: 0, mu: 50, sigma: 1 }, { weight: 1, mu: 9, sigma: 1 }, { weight: 0, mu: 100, sigma: 1 }]
    const seen = new Set(sampleMixtureLabeled(createRng(3), 2000, comps).map((s) => s.component))
    expect([...seen].sort()).toEqual([1, 3])
  })
  it('rifiuta misture senza componenti, con pesi negativi o tutti nulli', () => {
    const r = createRng(1)
    expect(() => sampleMixture(r, 5, [])).toThrow(RangeError)
    expect(() => sampleMixture(r, 5, [{ weight: -1, mu: 0, sigma: 1 }])).toThrow(RangeError)
    expect(() => sampleMixture(r, 5, [{ weight: 0, mu: 0, sigma: 1 }])).toThrow(RangeError)
    expect(() => mixturePdf(0, [])).toThrow(RangeError)
  })
  it('mixturePdf è la somma pesata delle componenti e integra a 1', () => {
    const comps = [{ weight: 1, mu: 0, sigma: 1 }, { weight: 3, mu: 4, sigma: 0.5 }]
    expect(mixturePdf(1, comps)).toBeCloseTo(0.25 * normalPdf(1, 0, 1) + 0.75 * normalPdf(1, 4, 0.5), 14)
    const xs = linspace(-10, 12, 4401)
    expect(trapz(xs, xs.map((x) => mixturePdf(x, comps)))).toBeCloseTo(1, 4)
  })
  it('sampleNormal2d riproduce media e covarianza', () => {
    const cov = [[2, 1.2], [1.2, 1]]
    const pts = sampleNormal2d(createRng(77), 30000, [1, -3], cov)
    expect(pts).toHaveLength(30000)
    expect(mean(pts.map((p) => p[0]))).toBeCloseTo(1, 1)
    expect(mean(pts.map((p) => p[1]))).toBeCloseTo(-3, 1)
    const c = covarianceMatrix(pts, true)
    expect(c[0][0]).toBeCloseTo(2, 1)
    expect(c[0][1]).toBeCloseTo(1.2, 1)
    expect(c[1][1]).toBeCloseTo(1, 1)
    expect(sampleNormal2d(createRng(2), 4, [0, 0], cov)).toEqual(sampleNormal2d(createRng(2), 4, [0, 0], cov))
  })
})

describe('logGamma', () => {
  it('valori noti: fattoriali e semi-interi', () => {
    expect(logGamma(1)).toBeCloseTo(0, 12)
    expect(logGamma(2)).toBeCloseTo(0, 12)
    expect(logGamma(5)).toBeCloseTo(Math.log(24), 12)
    expect(logGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 12)
    // Γ(n + 1/2) = (2n)! / (4ⁿ n!) · √π, con n = 10
    let ratio = 1
    for (let i = 11; i <= 20; i++) ratio *= i
    expect(logGamma(10.5)).toBeCloseTo(Math.log((ratio / 4 ** 10) * Math.sqrt(Math.PI)), 10)
    // Γ(1/4) = 3.625609908221908...
    expect(logGamma(0.25)).toBeCloseTo(Math.log(3.625609908221908), 10)
  })
  it('resta precisa vicino a 0, dove Γ(z) ≈ 1/z − γ (γ di Eulero-Mascheroni)', () => {
    expect(logGamma(1e-8)).toBeCloseTo(-Math.log(1e-8) - 0.5772156649015329e-8, 10)
    expect(logGamma(1e-5)).toBeCloseTo(logGamma(1 + 1e-5) - Math.log(1e-5), 11)
  })
  it('è definita solo per argomenti positivi', () => {
    expect(() => logGamma(0)).toThrow(RangeError)
    expect(() => logGamma(-1.5)).toThrow(RangeError)
  })
})

describe('gammaPdf (forma k, scala θ)', () => {
  it('con k = 1 è l\'esponenziale di media θ', () => {
    expect(gammaPdf(2, 1, 2)).toBeCloseTo(0.5 * Math.exp(-1), 12)
  })
  it('valori noti', () => {
    expect(gammaPdf(1, 2, 1)).toBeCloseTo(Math.exp(-1), 12)
    expect(gammaPdf(1, 0.5, 1)).toBeCloseTo(Math.exp(-1) / Math.sqrt(Math.PI), 12)
  })
  it('chi-quadro con k gradi di libertà = Gamma(k/2, θ = 2)', () => {
    expect(gammaPdf(3, 1, 2)).toBeCloseTo(0.5 * Math.exp(-1.5), 12)
    // χ² con 4 gradi di libertà: x e^{−x/2} / 4
    expect(gammaPdf(3, 2, 2)).toBeCloseTo((3 * Math.exp(-1.5)) / 4, 12)
  })
  it('integra a 1, ha media kθ e varianza kθ²', () => {
    for (const [k, theta] of [[2, 2], [5, 1], [9, 0.5]]) {
      const xs = linspace(0, 80, 16001)
      const ys = xs.map((x) => gammaPdf(x, k, theta))
      expect(trapz(xs, ys)).toBeCloseTo(1, 4)
      const m = trapz(xs, xs.map((x, i) => x * ys[i]))
      expect(m).toBeCloseTo(k * theta, 3)
      expect(trapz(xs, xs.map((x, i) => (x - m) ** 2 * ys[i]))).toBeCloseTo(k * theta * theta, 3)
    }
  })
  it('la moda sta in (k − 1)θ', () => {
    const mode = (3 - 1) * 1.5
    expect(gammaPdf(mode, 3, 1.5)).toBeGreaterThan(gammaPdf(mode - 0.05, 3, 1.5))
    expect(gammaPdf(mode, 3, 1.5)).toBeGreaterThan(gammaPdf(mode + 0.05, 3, 1.5))
  })
  it('fuori dal supporto x > 0 vale 0, anche in x = 0 e anche quando il limite destro diverge', () => {
    expect(gammaPdf(-1, 2, 1)).toBe(0)
    expect(gammaPdf(0, 2, 1)).toBe(0)
    expect(gammaPdf(0, 1, 1)).toBe(0)
    expect(gammaPdf(0, 0.5, 1)).toBe(0)
  })
  it('rifiuta k ≤ 0 e θ ≤ 0', () => {
    expect(() => gammaPdf(1, 0, 1)).toThrow(RangeError)
    expect(() => gammaPdf(1, 1, 0)).toThrow(RangeError)
    expect(() => gammaPdf(1, -2, 1)).toThrow(RangeError)
  })
})

describe('rayleighPdf', () => {
  it('ha la moda in σ, dove vale 1/(σ√e)', () => {
    expect(rayleighPdf(2, 2)).toBeCloseTo(1 / (2 * Math.sqrt(Math.E)), 12)
    expect(rayleighPdf(2, 2)).toBeGreaterThan(rayleighPdf(1.95, 2))
    expect(rayleighPdf(2, 2)).toBeGreaterThan(rayleighPdf(2.05, 2))
  })
  it('integra a 1 e ha media σ√(π/2)', () => {
    const xs = linspace(0, 40, 8001)
    const ys = xs.map((x) => rayleighPdf(x, 1.7))
    expect(trapz(xs, ys)).toBeCloseTo(1, 5)
    expect(trapz(xs, xs.map((x, i) => x * ys[i]))).toBeCloseTo(1.7 * Math.sqrt(Math.PI / 2), 4)
  })
  it('vale 0 per x ≤ 0 e rifiuta σ ≤ 0', () => {
    expect(rayleighPdf(0, 1)).toBe(0)
    expect(rayleighPdf(-3, 1)).toBe(0)
    expect(() => rayleighPdf(1, 0)).toThrow(RangeError)
  })
})

describe('betaPdf', () => {
  it('valori noti', () => {
    expect(betaPdf(0.3, 1, 1)).toBeCloseTo(1, 12)
    expect(betaPdf(0.5, 2, 2)).toBeCloseTo(1.5, 12)
    expect(betaPdf(0.2, 2, 5)).toBeCloseTo(30 * 0.2 * 0.8 ** 4, 10)
    expect(betaPdf(0.5, 0.5, 0.5)).toBeCloseTo(2 / Math.PI, 10)
  })
  it('scambiando a e b si specchia attorno a 1/2', () => {
    expect(betaPdf(0.2, 2, 5)).toBeCloseTo(betaPdf(0.8, 5, 2), 12)
  })
  it('integra a 1 e ha media a/(a + b)', () => {
    for (const [a, b] of [[2, 5], [5, 2], [3, 3], [1, 4]]) {
      const xs = linspace(0, 1, 20001)
      const ys = xs.map((x) => betaPdf(x, a, b))
      expect(trapz(xs, ys)).toBeCloseTo(1, 3)
      expect(trapz(xs, xs.map((x, i) => x * ys[i]))).toBeCloseTo(a / (a + b), 3)
    }
  })
  it('fuori dall\'intervallo aperto (0, 1) vale 0 e non diverge mai', () => {
    expect(betaPdf(-0.1, 2, 2)).toBe(0)
    expect(betaPdf(1.1, 2, 2)).toBe(0)
    expect(betaPdf(0, 0.5, 0.5)).toBe(0)
    expect(betaPdf(1, 0.5, 0.5)).toBe(0)
    expect(betaPdf(0, 1, 3)).toBe(0)
  })
  it('rifiuta a ≤ 0 e b ≤ 0', () => {
    expect(() => betaPdf(0.5, 0, 1)).toThrow(RangeError)
    expect(() => betaPdf(0.5, 1, -1)).toThrow(RangeError)
  })
})

describe('dirichletPdf', () => {
  it('con α = (1, 1, 1) è uniforme sul simplesso: Γ(3) = 2', () => {
    expect(dirichletPdf([0.2, 0.3, 0.5], [1, 1, 1])).toBeCloseTo(2, 10)
  })
  it('con due componenti coincide con la Beta', () => {
    expect(dirichletPdf([0.3, 0.7], [2, 3])).toBeCloseTo(betaPdf(0.3, 2, 3), 10)
  })
  it('valore noto con α = (2, 3, 4)', () => {
    // Γ(9) / (Γ(2)Γ(3)Γ(4)) = 40320 / 12 = 3360
    expect(dirichletPdf([0.2, 0.3, 0.5], [2, 3, 4])).toBeCloseTo(3360 * 0.2 * 0.3 ** 2 * 0.5 ** 3, 8)
  })
  it('fuori dal simplesso aperto vale 0', () => {
    expect(dirichletPdf([0.5, 0.6], [2, 2])).toBe(0)
    expect(dirichletPdf([0, 1], [2, 2])).toBe(0)
    expect(dirichletPdf([-0.2, 1.2], [2, 2])).toBe(0)
  })
  it('rifiuta dimensioni incoerenti e α ≤ 0', () => {
    expect(() => dirichletPdf([0.5, 0.5], [1, 1, 1])).toThrow(RangeError)
    expect(() => dirichletPdf([0.5, 0.5], [1, 0])).toThrow(RangeError)
    expect(() => dirichletPdf([1], [1])).toThrow(RangeError)
  })
})

// ---------------------------------------------------------------------------------------------
// Regressioni della revisione del kit (2026-09-18)
// ---------------------------------------------------------------------------------------------

describe('histogram: i valori non finiti non sono campioni', () => {
  const area = (bins: { x0: number; x1: number; density: number }[]) => bins.reduce((s, b) => s + b.density * (b.x1 - b.x0), 0)

  it('con il dominio automatico l\'area è 1 anche se nei dati ci sono NaN e ±Infinity', () => {
    expect(area(histogram([1, 2, 3, Number.NaN, Number.POSITIVE_INFINITY], 2))).toBeCloseTo(1, 12)
    expect(area(histogram([1, 2, 3, Number.NEGATIVE_INFINITY], 3))).toBeCloseTo(1, 12)
  })

  it('con un dominio dato l\'area è la frazione dei valori finiti caduta dentro', () => {
    // 0.5 e 1.5 dentro, 99 fuori ma finito: 2 su 3; il NaN non conta né nei bin né in N
    expect(area(histogram([0.5, 1.5, 99, Number.NaN], 2, [0, 2]))).toBeCloseTo(2 / 3, 12)
  })
})

describe('nessuna densità restituisce Infinity (né NaN), nemmeno ai limiti del double', () => {
  it('parametri accettati dalla validazione ma sub-normali danno un valore finito', () => {
    expect(Number.isFinite(normalPdf(0, 0, 1e-320))).toBe(true)
    expect(Number.isFinite(gammaPdf(5e-324, 0.01, 1))).toBe(true)
    expect(Number.isFinite(betaPdf(5e-324, 0.01, 1))).toBe(true)
    expect(Number.isFinite(betaPdf(1 - 1e-16, 1, 0.01))).toBe(true)
    expect(Number.isFinite(rayleighPdf(1e-300, 1e-200))).toBe(true)
    expect(Number.isFinite(rayleighPdf(1, 1e-310))).toBe(true)
    expect(Number.isFinite(mixturePdf(0, [{ weight: 1, mu: 0, sigma: 1e-320 }, { weight: 1, mu: 0, sigma: 1e-320 }]))).toBe(true)
    expect(Number.isFinite(dirichletPdf([5e-324, 1 - 5e-324], [0.01, 0.01]))).toBe(true)
  })

  it('i valori normali non cambiano', () => {
    expect(normalPdf(0, 0, 1)).toBeCloseTo(1 / SQRT_2PI, 15)
    expect(rayleighPdf(2, 2)).toBeCloseTo((2 * Math.exp(-0.5)) / 4, 15)
  })
})
