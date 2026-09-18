import { describe, expect, it, vi } from 'vitest'
import { createRng } from '../rng'
import {
  KERNELS, KNN_MIN_RADIUS, adaptiveSigmas, hypercubeCount, hypersphereVolume, ise, kernelValue, knnClassify, knnDensity1d,
  knnDensity2d, knnRadius1d, knnRadius2d, knnVote, nearestNeighbors, parzen1d, parzen2d, spechtDensity,
} from './nonparam'
import type { Kernel } from './nonparam'
import { linspace, normalPdf, normalPdf2d, sampleNormal, trapz } from './stats'

const COMPATTI: Kernel[] = ['rettangolare', 'triangolare', 'epanechnikov']
const CODE_PESANTI: Kernel[] = ['cauchy', 'sinc2']

describe('nonparam', () => {
  it('Parzen gaussiano integra a 1 per ogni h', () => {
    const samples = [0, 1, 1.5, 4]
    const xs = linspace(-20, 25, 9001)
    for (const h of [0.1, 0.5, 2]) expect(trapz(xs, xs.map((x) => parzen1d(x, samples, h, 'gaussiano')))).toBeCloseTo(1, 3)
  })
  it('K-NN: p(x) = k / (N V) con V = 2 r_k in 1D', () => {
    expect(knnDensity1d(0, [-1, 1, 3, 10], 2)).toBeCloseTo(2 / (4 * 2), 6)
  })
})

describe('kernelValue: la funzione finestra γ(u)', () => {
  it('elenca i sette kernel del corso', () => {
    expect([...KERNELS].sort()).toEqual(['cauchy', 'epanechnikov', 'esponenziale', 'gaussiano', 'rettangolare', 'sinc2', 'triangolare'])
  })
  it('valore nell\'origine, che è anche sup γ nel bound sulla varianza', () => {
    expect(kernelValue(0, 'rettangolare')).toBe(1)
    expect(kernelValue(0, 'triangolare')).toBe(1)
    expect(kernelValue(0, 'gaussiano')).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 14)
    expect(kernelValue(0, 'epanechnikov')).toBe(0.75)
    expect(kernelValue(0, 'esponenziale')).toBe(0.5)
    expect(kernelValue(0, 'cauchy')).toBeCloseTo(1 / Math.PI, 14)
    expect(kernelValue(0, 'sinc2')).toBeCloseTo(1 / (2 * Math.PI), 14)
  })
  it('rettangolare Π(u): 1 per |u| ≤ 1/2 con il bordo incluso, 0 altrove', () => {
    expect(kernelValue(0.5, 'rettangolare')).toBe(1)
    expect(kernelValue(-0.5, 'rettangolare')).toBe(1)
    expect(kernelValue(0.5000001, 'rettangolare')).toBe(0)
  })
  it('triangolare Λ(u) = 1 − |u| per |u| ≤ 1', () => {
    expect(kernelValue(0.5, 'triangolare')).toBe(0.5)
    expect(kernelValue(-0.25, 'triangolare')).toBe(0.75)
    expect(kernelValue(1, 'triangolare')).toBe(0)
    expect(kernelValue(1.3, 'triangolare')).toBe(0)
  })
  it('Epanechnikov (3/4)(1 − u²) per |u| ≤ 1', () => {
    expect(kernelValue(0.5, 'epanechnikov')).toBeCloseTo(0.5625, 14)
    expect(kernelValue(1, 'epanechnikov')).toBe(0)
    expect(kernelValue(-2, 'epanechnikov')).toBe(0)
  })
  it('esponenziale, Cauchy e sinc²: valori noti', () => {
    expect(kernelValue(1, 'esponenziale')).toBeCloseTo(0.5 * Math.exp(-1), 14)
    expect(kernelValue(-1, 'cauchy')).toBeCloseTo(1 / (2 * Math.PI), 14)
    // γ(π) = (1/2π) (sin(π/2) / (π/2))² = 2/π³, γ(2π) = 0
    expect(kernelValue(Math.PI, 'sinc2')).toBeCloseTo(2 / Math.PI ** 3, 14)
    expect(kernelValue(2 * Math.PI, 'sinc2')).toBeCloseTo(0, 14)
  })
  it('ogni kernel è pari, non negativo e massimo nell\'origine', () => {
    for (const k of KERNELS) {
      for (const u of linspace(0, 12, 481)) {
        expect(kernelValue(u, k)).toBe(kernelValue(-u, k))
        expect(kernelValue(u, k)).toBeGreaterThanOrEqual(0)
        expect(kernelValue(u, k)).toBeLessThanOrEqual(kernelValue(0, k))
      }
    }
  })
  it('ogni kernel integra a 1: è esso stesso una densità', () => {
    const fine = linspace(-2, 2, 40001)
    for (const k of COMPATTI) expect(trapz(fine, fine.map((u) => kernelValue(u, k)))).toBeCloseTo(1, 3)
    const wide = linspace(-40, 40, 80001)
    for (const k of ['gaussiano', 'esponenziale'] as const) expect(trapz(wide, wide.map((u) => kernelValue(u, k)))).toBeCloseTo(1, 5)
    // code che decadono come 1/u²: su [−L, L] manca una massa di circa 2/(πL)
    const huge = linspace(-1000, 1000, 400001)
    expect(trapz(huge, huge.map((u) => kernelValue(u, 'cauchy')))).toBeCloseTo((2 / Math.PI) * Math.atan(1000), 6)
    for (const k of CODE_PESANTI) expect(trapz(huge, huge.map((u) => kernelValue(u, k)))).toBeCloseTo(1, 2)
  })
  it('rifiuta un kernel sconosciuto', () => {
    expect(() => kernelValue(0, 'boxcar' as Kernel)).toThrow(RangeError)
  })
})

describe('parzen1d', () => {
  const samples = [0, 1, 1.5, 4]

  it('integra a 1 con ogni kernel', () => {
    // supporto compatto: griglia fitta, perché ogni salto del rettangolo costa al trapezio fino a (1/Nh)·dx/2
    const fine = linspace(-3, 7, 100001)
    for (const k of COMPATTI) expect(trapz(fine, fine.map((x) => parzen1d(x, samples, 0.8, k)))).toBeCloseTo(1, 3)
    const xs = linspace(-30, 35, 65001)
    for (const k of ['gaussiano', 'esponenziale'] as const) expect(trapz(xs, xs.map((x) => parzen1d(x, samples, 0.8, k)))).toBeCloseTo(1, 4)
    const wide = linspace(-2000, 2000, 400001)
    for (const k of CODE_PESANTI) expect(trapz(wide, wide.map((x) => parzen1d(x, samples, 0.8, k)))).toBeCloseTo(1, 2)
  })
  it('non è mai negativa', () => {
    for (const k of KERNELS) for (const x of linspace(-5, 9, 141)) expect(parzen1d(x, samples, 0.7, k)).toBeGreaterThanOrEqual(0)
  })
  it('con la finestra rettangolare è un conteggio: K / (N h)', () => {
    // la finestra di lato 1.2 centrata in 1.2 copre [0.6, 1.8]: ci cadono 1 e 1.5
    expect(parzen1d(1.2, samples, 1.2, 'rettangolare')).toBeCloseTo(2 / (4 * 1.2), 12)
    expect(parzen1d(2.7, samples, 1.2, 'rettangolare')).toBe(0)
  })
  it('disegno d\'esame con due campioni e γ = Π: la stima vale 0, 1/(2h) oppure 1/h', () => {
    const two = [0, 1]
    expect(parzen1d(0.5, two, 2, 'rettangolare')).toBeCloseTo(1 / 2, 12)
    expect(parzen1d(-0.8, two, 2, 'rettangolare')).toBeCloseTo(1 / 4, 12)
    expect(parzen1d(5, two, 2, 'rettangolare')).toBe(0)
  })
  it('due campioni e kernel gaussiano: una gobba se |x₁ − x₂| ≤ 2h, due se è maggiore', () => {
    const two = [0, 1]
    expect(parzen1d(0.5, two, 0.6)).toBeGreaterThan(parzen1d(0.4, two, 0.6))
    expect(parzen1d(0.5, two, 0.6)).toBeGreaterThan(parzen1d(0, two, 0.6))
    expect(parzen1d(0.5, two, 0.4)).toBeLessThan(parzen1d(0.1, two, 0.4))
  })
  it('il kernel predefinito è il gaussiano', () => {
    expect(parzen1d(0.3, samples, 0.5)).toBe(parzen1d(0.3, samples, 0.5, 'gaussiano'))
  })
  it('campione singolo: la stima è il kernel riscalato δ(x − x₁) = (1/h) γ((x − x₁)/h)', () => {
    expect(parzen1d(2.6, [2], 0.7)).toBeCloseTo(normalPdf(2.6, 2, 0.7), 14)
    for (const k of KERNELS) expect(parzen1d(2, [2], 0.25, k)).toBeCloseTo(kernelValue(0, k) / 0.25, 12)
  })
  it('la finestra è simmetrica: centrata su x* o sul campione dà lo stesso valore', () => {
    for (const k of KERNELS) expect(parzen1d(1.3, [0.4], 0.9, k)).toBe(parzen1d(0.4, [1.3], 0.9, k))
  })
  it('campioni coincidenti: N copie dello stesso punto equivalgono a un campione solo', () => {
    expect(parzen1d(1.4, [1, 1, 1], 0.5)).toBeCloseTo(parzen1d(1.4, [1], 0.5), 14)
  })
  it('h piccolo: aghi alti γ(0)/(N h) sui campioni isolati e zero in mezzo', () => {
    const h = 1e-3
    expect(parzen1d(4, samples, h)).toBeCloseTo(kernelValue(0, 'gaussiano') / (4 * h), 6)
    expect(parzen1d(2.5, samples, h)).toBe(0)
    expect(Number.isFinite(parzen1d(4, samples, 1e-12))).toBe(true)
  })
  it('h grande: stima quasi piatta, alta γ(0)/h', () => {
    const h = 1e4
    expect(parzen1d(0, samples, h)).toBeCloseTo(kernelValue(0, 'gaussiano') / h, 10)
    expect(Math.abs(parzen1d(0, samples, h) - parzen1d(4, samples, h)) / parzen1d(0, samples, h)).toBeLessThan(1e-6)
  })
  it('senza campioni la stima è 0 ovunque', () => {
    for (const k of KERNELS) expect(parzen1d(0.3, [], 1, k)).toBe(0)
  })
  it('rifiuta h ≤ 0 o non finito', () => {
    for (const h of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => parzen1d(0, samples, h)).toThrow(RangeError)
  })
})

describe('parzen2d e hypercubeCount', () => {
  it('finestre normali 2-D a simmetria circolare: δ(0) = 1/(2π h²) ≈ 0.159, 0.637, 3.98', () => {
    expect(parzen2d([0, 0], [[0, 0]], 1)).toBeCloseTo(0.159, 3)
    expect(parzen2d([0, 0], [[0, 0]], 0.5)).toBeCloseTo(0.637, 3)
    expect(parzen2d([0, 0], [[0, 0]], 0.2)).toBeCloseTo(3.98, 2)
  })
  it('con un campione e kernel gaussiano è la normale 2-D di covarianza h² I', () => {
    expect(parzen2d([1.2, -0.4], [[1, 0]], 0.6)).toBeCloseTo(normalPdf2d([1.2, -0.4], [1, 0], [[0.36, 0], [0, 0.36]]), 14)
  })
  it('con la finestra a ipercubo è K / (N h²), con K contato da γ', () => {
    const pts = [[0, 0], [0.4, 0.4], [0.6, 0], [2, 2]]
    expect(hypercubeCount([0, 0], pts, 1)).toBe(2)
    expect(parzen2d([0, 0], pts, 1, 'rettangolare')).toBeCloseTo(2 / (4 * 1), 12)
    expect(hypercubeCount([0, 0], pts, 1.2)).toBe(3)
    expect(parzen2d([0, 0], pts, 1.2, 'rettangolare')).toBeCloseTo(3 / (4 * 1.44), 12)
  })
  it('hypercubeCount vale in ogni dimensione e in 1-D ridà il conteggio di parzen1d', () => {
    expect(hypercubeCount([1.2], [[0], [1], [1.5], [4]], 1.2)).toBe(2)
    expect(hypercubeCount([0, 0, 0], [[0.1, 0.2, -0.3], [0.1, 0.2, 0.6]], 1)).toBe(1)
    expect(hypercubeCount([0, 0], [], 1)).toBe(0)
    expect(() => hypercubeCount([0, 0], [[1]], 1)).toThrow(RangeError)
    expect(() => hypercubeCount([0, 0], [[1, 1]], 0)).toThrow(RangeError)
  })
  it('integra a 1 sul piano con V = h²', () => {
    const pts = [[0, 0], [1, 0.5], [-0.5, 1.2]]
    const g = linspace(-6, 7, 261)
    for (const k of ['gaussiano', 'triangolare'] as const) {
      const rows = g.map((y) => trapz(g, g.map((x) => parzen2d([x, y], pts, 0.7, k))))
      expect(trapz(g, rows)).toBeCloseTo(1, 3)
    }
  })
  it('senza campioni vale 0, con h ≤ 0 o punti non 2-D rifiuta', () => {
    expect(parzen2d([0, 0], [], 1)).toBe(0)
    expect(() => parzen2d([0, 0], [[0, 0]], 0)).toThrow(RangeError)
    expect(() => parzen2d([0], [[0, 0]], 1)).toThrow(RangeError)
    expect(() => parzen2d([0, 0], [[0, 0, 0]], 1)).toThrow(RangeError)
  })
})

describe('knnDensity1d', () => {
  const samples = [-1, 1, 3, 10]

  it('r_K è la distanza dal K-esimo campione più vicino', () => {
    expect(knnRadius1d(0, samples, 1)).toBe(1)
    expect(knnRadius1d(0, samples, 3)).toBe(3)
    expect(knnRadius1d(2.5, samples, 2)).toBe(1.5)
  })
  it('N = 1, K = 1: un solo spillo iperbolico 1 / (2 |x − x₁|)', () => {
    expect(knnDensity1d(3, [1], 1)).toBeCloseTo(1 / 4, 12)
    expect(knnDensity1d(-9, [1], 1)).toBeCloseTo(1 / 20, 12)
  })
  it('K = N: la cella arriva al campione più lontano', () => {
    expect(knnDensity1d(0, samples, 4)).toBeCloseTo(4 / (4 * 2 * 10), 12)
  })
  it('K > N (o nessun campione): la cella non si chiude mai, r_K = ∞ e la stima è 0', () => {
    expect(knnRadius1d(0, samples, 5)).toBe(Number.POSITIVE_INFINITY)
    expect(knnDensity1d(0, samples, 5)).toBe(0)
    expect(knnDensity1d(0, [], 1)).toBe(0)
  })
  it('code pesanti: lontano dai dati la stima decade solo come K / (2 N |x|)', () => {
    const x = 1e6
    expect(knnDensity1d(x, samples, 2) / (2 / (2 * 4 * x))).toBeCloseTo(1, 4)
    // l'area su intervalli sempre più larghi continua a crescere: non è una densità legittima
    const area = (L: number) => { const xs = linspace(-L, L, 20001); return trapz(xs, xs.map((v) => knnDensity1d(v, samples, 2))) }
    expect(area(1e4)).toBeGreaterThan(area(1e2) + 1)
  })
  it('r_K = 0 (x su un campione con K = 1): niente Infinity, il raggio si ferma a minRadius', () => {
    expect(knnRadius1d(1, [1, 2, 3], 1)).toBe(0)
    const p = knnDensity1d(1, [1, 2, 3], 1)
    expect(Number.isFinite(p)).toBe(true)
    expect(p).toBeCloseTo(1 / (3 * 2 * KNN_MIN_RADIUS), 0)
    expect(knnDensity1d(1, [1, 2, 3], 1, 0.05)).toBeCloseTo(1 / (3 * 2 * 0.05), 10)
  })
  it('campioni coincidenti: K copie danno r_K = 0, una in più riapre la cella', () => {
    const dup = [5, 5, 5, 9]
    expect(knnRadius1d(5, dup, 3)).toBe(0)
    expect(Number.isFinite(knnDensity1d(5, dup, 3))).toBe(true)
    expect(knnDensity1d(5, dup, 4)).toBeCloseTo(4 / (4 * 2 * 4), 12)
  })
  it('minRadius non tocca le celle più grandi', () => {
    expect(knnDensity1d(0, samples, 2, 0.5)).toBeCloseTo(0.25, 12)
  })
  it('con K ≥ 2 e campioni distinti la stima è finita ovunque', () => {
    for (const x of linspace(-3, 12, 301)) expect(knnDensity1d(x, samples, 2)).toBeLessThan(10)
  })
  it('rifiuta K non intero o < 1 e minRadius ≤ 0', () => {
    for (const k of [0, -1, 1.5, Number.NaN]) expect(() => knnDensity1d(0, samples, k)).toThrow(RangeError)
    expect(() => knnDensity1d(0, samples, 2, 0)).toThrow(RangeError)
    expect(() => knnDensity1d(0, samples, 2, -1)).toThrow(RangeError)
  })
})

describe('knnDensity2d e hypersphereVolume', () => {
  const pts = [[1, 0], [0, 2], [3, 4], [-6, 8]]

  it('p(x*) = K / (N π r_K²)', () => {
    expect(knnRadius2d([0, 0], pts, 3)).toBe(5)
    expect(knnDensity2d([0, 0], pts, 3)).toBeCloseTo(3 / (4 * Math.PI * 25), 12)
  })
  it('K = N, K > N e nessun campione', () => {
    expect(knnDensity2d([0, 0], pts, 4)).toBeCloseTo(4 / (4 * Math.PI * 100), 12)
    expect(knnDensity2d([0, 0], pts, 5)).toBe(0)
    expect(knnDensity2d([0, 0], [], 1)).toBe(0)
  })
  it('punti coincidenti con x*: valore finito, governato da minRadius', () => {
    expect(knnRadius2d([1, 0], pts, 1)).toBe(0)
    expect(Number.isFinite(knnDensity2d([1, 0], pts, 1))).toBe(true)
    expect(knnDensity2d([1, 0], pts, 1, 0.1)).toBeCloseTo(1 / (4 * Math.PI * 0.01), 10)
  })
  it('rifiuta K non valido e punti non 2-D', () => {
    expect(() => knnDensity2d([0, 0], pts, 0)).toThrow(RangeError)
    expect(() => knnDensity2d([0], pts, 1)).toThrow(RangeError)
    expect(() => knnDensity2d([0, 0], [[1, 2, 3]], 1)).toThrow(RangeError)
  })
  it('volume dell\'ipersfera: 2r, πr², (4/3)πr³ e formula con la Gamma', () => {
    expect(hypersphereVolume(1, 3)).toBe(6)
    expect(hypersphereVolume(2, 2)).toBeCloseTo(4 * Math.PI, 12)
    expect(hypersphereVolume(3, 2)).toBeCloseTo((32 / 3) * Math.PI, 12)
    expect(hypersphereVolume(4, 1)).toBeCloseTo(Math.PI ** 2 / 2, 10)
    expect(hypersphereVolume(10, 1)).toBeCloseTo(Math.PI ** 5 / 120, 10)
    expect(hypersphereVolume(5, 0)).toBe(0)
  })
  it('in 10-D la sfera occupa circa lo 0.25% del cubo circoscritto', () => {
    expect(hypersphereVolume(10, 1) / 2 ** 10).toBeCloseTo(0.0025, 4)
    expect(hypersphereVolume(2, 1) / 4).toBeCloseTo(0.785, 3)
    expect(hypersphereVolume(3, 1) / 8).toBeCloseTo(0.524, 3)
  })
  it('rifiuta dimensione non intera o < 1 e raggio negativo', () => {
    expect(() => hypersphereVolume(0, 1)).toThrow(RangeError)
    expect(() => hypersphereVolume(2.5, 1)).toThrow(RangeError)
    expect(() => hypersphereVolume(2, -1)).toThrow(RangeError)
  })
})

describe('nearestNeighbors', () => {
  it('ordina per distanza crescente e riporta l\'indice del campione', () => {
    const nn = nearestNeighbors([0, 0], [[3, 4], [1, 0], [0, 2]], 2)
    expect(nn).toEqual([{ index: 1, distance: 1 }, { index: 2, distance: 2 }])
  })
  it('a parità di distanza passa prima il campione che viene prima nell\'array', () => {
    const nn = nearestNeighbors([0], [[2], [-1], [1], [-2]], 3)
    expect(nn.map((n) => n.index)).toEqual([1, 2, 0])
  })
  it('K > N restituisce tutti i campioni, senza campioni restituisce []', () => {
    expect(nearestNeighbors([0], [[1], [2]], 5)).toHaveLength(2)
    expect(nearestNeighbors([0], [], 3)).toEqual([])
  })
  it('rifiuta K non valido e dimensioni diverse', () => {
    expect(() => nearestNeighbors([0], [[1]], 0)).toThrow(RangeError)
    expect(() => nearestNeighbors([0, 0], [[1]], 1)).toThrow(RangeError)
  })
})

describe('knnClassify: voto dei K vicini', () => {
  const data = [
    { x: [1, 1], y: 0 }, { x: [1.2, 0.8], y: 0 }, { x: [0.8, 1.3], y: 0 },
    { x: [4, 4], y: 1 }, { x: [4.2, 3.9], y: 1 }, { x: [3.8, 4.1], y: 1 }, { x: [1.4, 1.4], y: 1 },
  ]

  it('assegna la classe più rappresentata tra i K vicini', () => {
    expect(knnClassify([1, 1.1], data, 3)).toBe(0)
    expect(knnClassify([4, 3.8], data, 3)).toBe(1)
  })
  it('K = 1 copia l\'etichetta del campione più vicino, anche se è un\'eccezione isolata', () => {
    expect(knnClassify([1.45, 1.45], data, 1)).toBe(1)
    expect(knnClassify([1.45, 1.45], data, 3)).toBe(0)
  })
  it('restituisce voti K_i e posteriori K_i / K', () => {
    const v = knnVote([1.45, 1.45], data, 4)
    expect(v.label).toBe(0)
    expect(v.tie).toBe(false)
    expect(v.votes).toEqual([{ label: 0, count: 3, posterior: 0.75 }, { label: 1, count: 1, posterior: 0.25 }])
    expect(v.neighbors.map((n) => n.index)).toEqual([6, 0, 2, 1])
  })
  it('pareggio nei voti: vince la classe del vicino più vicino tra quelle in parità', () => {
    const d = [{ x: [1], y: 7 }, { x: [-2], y: 3 }]
    const v = knnVote([0], d, 2)
    expect(v.tie).toBe(true)
    expect(v.label).toBe(7)
    // una terza classe con meno voti non entra nello spareggio, anche se ha il vicino più vicino in assoluto
    const d2 = [{ x: [0.1], y: 9 }, { x: [1], y: 7 }, { x: [1.5], y: 7 }, { x: [-2], y: 3 }, { x: [-0.5], y: 3 }]
    expect(knnClassify([0], d2, 5)).toBe(3)
  })
  it('pareggio anche nella distanza: vince l\'etichetta numericamente più piccola, qualunque sia l\'ordine dei dati', () => {
    expect(knnClassify([0], [{ x: [1], y: 1 }, { x: [-1], y: 0 }], 2)).toBe(0)
    expect(knnClassify([0], [{ x: [-1], y: 0 }, { x: [1], y: 1 }], 2)).toBe(0)
  })
  it('K ≥ N: votano tutti i campioni e vince la classe più numerosa', () => {
    expect(knnClassify([1, 1], data, 7)).toBe(1)
    expect(knnClassify([1, 1], data, 50)).toBe(1)
    expect(knnVote([1, 1], data, 50).neighbors).toHaveLength(7)
    // le posteriori si dividono per i vicini che hanno votato davvero (N), non per il K richiesto
    expect(knnVote([1, 1], data, 50).votes.map((v) => v.posterior)).toEqual([3 / 7, 4 / 7])
  })
  it('funziona con più di due classi e in una dimensione', () => {
    const d = [{ x: [0], y: 0 }, { x: [0.2], y: 0 }, { x: [5], y: 1 }, { x: [5.1], y: 1 }, { x: [9], y: 2 }, { x: [9.3], y: 2 }, { x: [9.1], y: 2 }]
    expect(knnClassify([8.7], d, 3)).toBe(2)
    expect(knnClassify([4.4], d, 2)).toBe(1)
  })
  it('campioni coincidenti con etichette diverse: decide il voto, poi l\'etichetta più piccola', () => {
    const d = [{ x: [2, 2], y: 1 }, { x: [2, 2], y: 0 }, { x: [2, 2], y: 1 }]
    expect(knnClassify([2, 2], d, 3)).toBe(1)
    expect(knnClassify([2, 2], d, 2)).toBe(0)
  })
  it('rifiuta un training set vuoto, K non valido e dimensioni incoerenti', () => {
    expect(() => knnClassify([0], [], 1)).toThrow(RangeError)
    expect(() => knnClassify([0], [{ x: [1], y: 0 }], 0)).toThrow(RangeError)
    expect(() => knnClassify([0, 0], [{ x: [1], y: 0 }], 1)).toThrow(RangeError)
  })
})

describe('ise: errore quadratico integrato tra due densità', () => {
  it('è 0 tra curve uguali e ∫(p − q)² in generale', () => {
    const xs = linspace(0, 1, 11)
    expect(ise(xs, xs.map(() => 1), xs.map(() => 1))).toBe(0)
    expect(ise(xs, xs.map(() => 1), xs.map(() => 0.5))).toBeCloseTo(0.25, 12)
  })
  it('tra due normali di pari σ = 1 distanti d vale (1 − e^{−d²/4}) / √π', () => {
    const xs = linspace(-12, 13, 5001)
    const p = xs.map((x) => normalPdf(x, 0, 1))
    const q = xs.map((x) => normalPdf(x, 1, 1))
    expect(ise(xs, p, q)).toBeCloseTo((1 - Math.exp(-0.25)) / Math.sqrt(Math.PI), 6)
    expect(ise(xs, q, p)).toBeCloseTo(ise(xs, p, q), 14)
  })
  it('premia un h intermedio contro sotto- e sovra-smoothing', () => {
    const samples = sampleNormal(createRng(314), 200, 0, 1)
    const xs = linspace(-6, 6, 601)
    const truth = xs.map((x) => normalPdf(x))
    const err = (h: number) => ise(xs, xs.map((x) => parzen1d(x, samples, h)), truth)
    expect(err(0.4)).toBeLessThan(err(0.02))
    expect(err(0.4)).toBeLessThan(err(4))
  })
  it('meno di due punti di griglia: 0; lunghezze diverse: errore', () => {
    expect(ise([], [], [])).toBe(0)
    expect(ise([1], [2], [3])).toBe(0)
    expect(() => ise([0, 1], [1, 1], [1])).toThrow(RangeError)
    expect(() => ise([0, 1], [1], [1, 1])).toThrow(RangeError)
  })
})

describe('metodo di Specht: kernel gaussiano sferico e σ adattiva', () => {
  it('in 1-D e 2-D coincide con Parzen gaussiano di larghezza h = σ', () => {
    expect(spechtDensity([0.3], [[0], [1], [1.5], [4]], 0.5)).toBeCloseTo(parzen1d(0.3, [0, 1, 1.5, 4], 0.5), 14)
    const pts = [[0, 0], [1, 0.5], [-0.5, 1.2]]
    expect(spechtDensity([0.2, 0.4], pts, 0.7)).toBeCloseTo(parzen2d([0.2, 0.4], pts, 0.7), 14)
  })
  it('in n dimensioni normalizza con (2πσ²)^{n/2}', () => {
    expect(spechtDensity([0, 0, 0], [[0, 0, 0]], 2)).toBeCloseTo(1 / (2 * Math.PI * 4) ** 1.5, 14)
  })
  it('σ_k = distanza euclidea media dagli L vicini più prossimi', () => {
    expect(adaptiveSigmas([[0], [1], [3], [7]], 2)).toEqual([2, 1.5, 2.5, 5])
    expect(adaptiveSigmas([[0, 0], [3, 4], [6, 8]], 1)).toEqual([5, 5, 5])
  })
  it('L oltre N − 1 usa tutti gli altri campioni; nessun campione dà []; uno solo non ha vicini', () => {
    expect(adaptiveSigmas([[0], [1], [3]], 10)).toEqual([2, 1.5, 2.5])
    expect(adaptiveSigmas([], 2)).toEqual([])
    expect(() => adaptiveSigmas([[1]], 1)).toThrow(RangeError)
    expect(() => adaptiveSigmas([[1], [2]], 0)).toThrow(RangeError)
  })
  it('con una σ_k per campione la stima resta una densità: integra a 1', () => {
    const pts = [[0], [0.2], [0.5], [3], [6]]
    const sig = adaptiveSigmas(pts, 2)
    const xs = linspace(-30, 40, 14001)
    expect(trapz(xs, xs.map((x) => spechtDensity([x], pts, sig)))).toBeCloseTo(1, 4)
    // σ piccola dove i campioni sono densi, grande dove sono radi
    expect(sig[0]).toBeLessThan(sig[4])
  })
  it('senza campioni vale 0; rifiuta σ ≤ 0, σ_k in numero sbagliato e dimensioni diverse', () => {
    expect(spechtDensity([0], [], 1)).toBe(0)
    expect(() => spechtDensity([0], [[1]], 0)).toThrow(RangeError)
    expect(() => spechtDensity([0], [[1], [2]], [1])).toThrow(RangeError)
    expect(() => spechtDensity([0], [[1], [1]], [1, 0])).toThrow(RangeError)
    expect(() => spechtDensity([0, 0], [[1]], 1)).toThrow(RangeError)
  })
})

// ---------------------------------------------------------------------------------------------
// Regressioni della revisione del kit (2026-09-18)
// ---------------------------------------------------------------------------------------------

/** Riferimento lento e ovvio: ordina tutto, spareggio per indice. */
function bruteNeighbors(x: readonly number[], samples: readonly (readonly number[])[], k: number) {
  return samples
    .map((s, index) => ({ index, distance: Math.sqrt(s.reduce((acc, v, j) => acc + (v - x[j]) ** 2, 0)) }))
    .sort((p, q) => p.distance - q.distance || p.index - q.index)
    .slice(0, k)
}

describe('K-NN senza ordinare tutti gli N campioni a ogni interrogazione', () => {
  it('nearestNeighbors non ordina l\'intero campione (selezione dei K migliori)', () => {
    const rng = createRng(7)
    const samples = Array.from({ length: 200 }, () => [rng.normal(), rng.normal()])
    const sort = vi.spyOn(Array.prototype, 'sort')
    try {
      nearestNeighbors([0.1, -0.2], samples, 5)
      knnRadius2d([0.1, -0.2], samples, 5)
      knnRadius1d(0.1, samples.map((s) => s[0]), 5)
      expect(sort).not.toHaveBeenCalled()
    } finally {
      sort.mockRestore()
    }
  })

  it('knnVote non ricopia i punti di training a ogni chiamata', () => {
    const data = [{ x: [0, 0], y: 0 }, { x: [1, 0], y: 1 }, { x: [2, 0], y: 1 }]
    const map = vi.spyOn(data, 'map')
    knnVote([0.9, 0], data, 3)
    expect(map).not.toHaveBeenCalled()
  })

  it('dà gli stessi vicini, distanze e spareggi del riferimento che ordina tutto, anche con molti pari merito', () => {
    const rng = createRng(11)
    // coordinate intere su una griglia piccola: tante distanze uguali, lo spareggio per indice conta
    const samples = Array.from({ length: 120 }, () => [Math.floor(rng.next() * 7), Math.floor(rng.next() * 7)])
    for (const k of [1, 2, 5, 17, 64, 65, 119, 120, 300]) {
      for (const q of [[3, 3], [0, 0], [6.5, 2], [3.2, 4.9]]) {
        expect(nearestNeighbors(q, samples, k)).toEqual(bruteNeighbors(q, samples, k))
      }
    }
    const ones = samples.map((s) => [s[0]])
    for (const k of [1, 3, 40, 120, 121]) {
      const ref = bruteNeighbors([2.5], ones, k)
      expect(knnRadius1d(2.5, ones.map((s) => s[0]), k)).toBe(k > ones.length ? Number.POSITIVE_INFINITY : ref[k - 1].distance)
    }
  })

  it('knnVote e knnClassify restano quelli di prima sui dati del corso', () => {
    const rng = createRng(3)
    const data = [
      ...Array.from({ length: 60 }, () => ({ x: [rng.normal(-1, 1), rng.normal(0, 1)], y: 0 })),
      ...Array.from({ length: 60 }, () => ({ x: [rng.normal(1, 1), rng.normal(0.5, 1)], y: 1 })),
    ]
    for (const q of [[0, 0], [-2, 1], [1.5, -0.5], [0.2, 0.3]]) {
      const ref = bruteNeighbors(q, data.map((d) => d.x), 7)
      const vote = knnVote(q, data, 7)
      expect(vote.neighbors).toEqual(ref)
      const ones = ref.filter((nb) => data[nb.index].y === 1).length
      expect(vote.label).toBe(ones >= 4 ? 1 : 0)
    }
  })
})

describe('campioni non finiti: un errore di chi chiama, mai un esito che dipende dall\'ordine', () => {
  it('K-NN rifiuta un campione NaN o infinito, dovunque sia nell\'array', () => {
    for (const samples of [[Number.NaN, 3, 1, 2], [3, 1, Number.NaN, 2], [3, 1, 2, Number.POSITIVE_INFINITY]]) {
      expect(() => knnRadius1d(0, samples, 1)).toThrow(RangeError)
      expect(() => knnDensity1d(0, samples, 2)).toThrow(RangeError)
    }
    const nan = { x: [Number.NaN, 0], y: 1 }
    const a = { x: [1, 0], y: 0 }
    const b = { x: [2, 0], y: 0 }
    expect(() => knnVote([0, 0], [nan, a, b], 1)).toThrow(RangeError)
    expect(() => knnVote([0, 0], [a, b, nan], 1)).toThrow(RangeError)
    expect(() => nearestNeighbors([0, 0], [[1, 1], [Number.NaN, 0]], 1)).toThrow(RangeError)
    expect(() => knnRadius2d([0, 0], [[1, 1], [0, Number.NaN]], 1)).toThrow(RangeError)
  })

  it('K-NN rifiuta un punto interrogato non finito', () => {
    expect(() => nearestNeighbors([Number.NaN, 0], [[1, 1]], 1)).toThrow(RangeError)
    expect(() => knnRadius1d(Number.NaN, [1, 2], 1)).toThrow(RangeError)
  })

  it('Parzen e Specht rifiutano un campione non finito con qualsiasi kernel', () => {
    for (const kernel of KERNELS) {
      expect(() => parzen1d(0, [Number.NaN, 1], 1, kernel)).toThrow(RangeError)
      expect(() => parzen2d([0, 0], [[0, Number.NaN]], 1, kernel)).toThrow(RangeError)
    }
    expect(() => hypercubeCount([0, 0], [[Number.NaN, 0]], 1)).toThrow(RangeError)
    expect(() => spechtDensity([0, 0], [[Number.NaN, 0]], 1)).toThrow(RangeError)
    expect(() => adaptiveSigmas([[0, 0], [1, Number.NaN]], 1)).toThrow(RangeError)
  })

  it('kernelValue: NaN resta NaN per ogni kernel (niente comparatori o conteggi che lo nascondono), ±∞ vale 0', () => {
    for (const kernel of KERNELS) {
      expect(kernelValue(Number.NaN, kernel)).toBeNaN()
      expect(kernelValue(Number.POSITIVE_INFINITY, kernel)).toBe(0)
      expect(kernelValue(Number.NEGATIVE_INFINITY, kernel)).toBe(0)
    }
  })
})

describe('nessuna densità restituisce Infinity, nemmeno ai limiti del double', () => {
  it('Parzen, Specht e K-NN con larghezze sub-normali restano finiti', () => {
    expect(Number.isFinite(parzen1d(0, [0], Number.MIN_VALUE))).toBe(true)
    expect(Number.isFinite(parzen1d(0, [0], Number.MIN_VALUE, 'rettangolare'))).toBe(true)
    expect(Number.isFinite(parzen2d([0, 0], [[0, 0]], 1e-160))).toBe(true)
    expect(Number.isFinite(spechtDensity([0, 0], [[0, 0]], 1e-160))).toBe(true)
    expect(Number.isFinite(knnDensity1d(0, [0], 1, Number.MIN_VALUE))).toBe(true)
    expect(Number.isFinite(knnDensity2d([0, 0], [[0, 0]], 1, Number.MIN_VALUE))).toBe(true)
    // lontano dai campioni resta 0, anche con sinc² (sin(∞) non deve diventare NaN)
    expect(parzen1d(1, [0], Number.MIN_VALUE, 'sinc2')).toBe(0)
  })
})
