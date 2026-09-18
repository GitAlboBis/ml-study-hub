import { describe, expect, it } from 'vitest'
import { kernelValue, parzen1d } from '../../../lib/ml/nonparam'
import { linspace, mixturePdf, trapz } from '../../../lib/ml/stats'
import {
  birthGrowth,
  captionFor,
  clippedPeaks,
  contributions,
  countLocalMaxima,
  defaultK,
  evalGrid,
  flankPoint,
  formulaValues,
  iseAt,
  kernelBands,
  nearestSampleIndex,
  niceLogSteps,
  optimalBandwidth,
  peakPoint,
  regimeOf,
  resolveSteps,
  sceneAt,
  snapSample,
  tweenValue,
  weightedKernelSum,
  windowCount,
} from './density1d'
import type { Density1dStep } from './types'

// I dodici salmoni dell'inventario m09 (widget m09-somma-dei-kernel) e la loro densità vera
const S = [2.6, 3.1, 3.3, 3.8, 4.0, 4.1, 4.4, 4.9, 5.2, 5.6, 6.3, 7.1]
const MIX = [
  { weight: 0.7, mu: 4, sigma: 0.8 },
  { weight: 0.3, mu: 6, sigma: 0.9 },
]
const truth = (x: number) => mixturePdf(x, MIX)
const D: [number, number] = [0, 10]

describe('niceLogSteps: la scala dello slider h', () => {
  it('da 0.05 a 3 dà valori tondi, crescenti, estremi compresi', () => {
    const v = niceLogSteps(0.05, 3)
    expect(v[0]).toBe(0.05)
    expect(v.at(-1)).toBe(3)
    for (const x of [0.1, 0.25, 0.4, 0.45, 0.5, 1, 1.5, 2.5]) expect(v).toContain(x)
    for (let i = 1; i < v.length; i++) expect(v[i]).toBeGreaterThan(v[i - 1])
    // passi di al più il 25% circa: la scala è davvero logaritmica
    for (let i = 1; i < v.length; i++) expect(v[i] / v[i - 1]).toBeLessThan(1.26)
  })

  it('estremi non tondi entrano lo stesso, così lo slider li raggiunge', () => {
    const v = niceLogSteps(0.066, 0.31)
    expect(v[0]).toBe(0.066)
    expect(v.at(-1)).toBe(0.31)
    expect(v).toContain(0.07)
    expect(v).toContain(0.3)
  })

  it('un intervallo di un solo valore dà quel valore', () => {
    expect(niceLogSteps(0.5, 0.5)).toEqual([0.5])
  })
})

describe('stima sul terreno', () => {
  it('con pesi 1/N la somma pesata dei kernel è la stima di Parzen della libreria', () => {
    const xs = evalGrid(D, S, 0.5, 'gaussiano')
    const w = S.map(() => 1 / S.length)
    const ys = weightedKernelSum(xs, S, 0.5, 'gaussiano', w)
    xs.forEach((x, i) => expect(ys[i]).toBeCloseTo(parzen1d(x, S, 0.5, 'gaussiano'), 12))
  })

  it('la stima gaussiana integra a 1 anche per h piccolo', () => {
    const xs = linspace(-20, 30, 20001)
    for (const h of [0.1, 0.5, 2]) {
      const ys = weightedKernelSum(xs, S, h, 'gaussiano', S.map(() => 1 / S.length))
      expect(trapz(xs, ys)).toBeCloseTo(1, 3)
    }
  })

  it('con il kernel rettangolare la griglia contiene i salti: da 0 a 1/(Nh) in un tratto verticale', () => {
    const xs = evalGrid(D, [5], 1, 'rettangolare')
    const ys = weightedKernelSum(xs, [5], 1, 'rettangolare', [1])
    const i = xs.findIndex((x) => x === 4.5)
    expect(i).toBeGreaterThan(0)
    expect(ys[i - 1]).toBe(0)
    expect(xs[i] - xs[i - 1]).toBeLessThan(1e-6)
    expect(ys[i]).toBe(1)
    // e a destra: 5.5 incluso (|u| ≤ 1/2), subito dopo zero
    const j = xs.findIndex((x) => x === 5.5)
    expect(ys[j]).toBe(1)
    expect(ys[j + 1]).toBe(0)
  })

  it('la griglia è crescente, dentro il dominio, con gli estremi', () => {
    const xs = evalGrid(D, S, 0.3, 'triangolare')
    expect(xs[0]).toBe(0)
    expect(xs.at(-1)).toBe(10)
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1])
  })
})

describe('kernelBands: le campane, separate o impilate', () => {
  const xs = evalGrid(D, S, 0.5, 'gaussiano')
  const w = S.map(() => 1 / S.length)

  it('impilate (stack = 1) la cima dell\'ultima banda è la stima', () => {
    const bands = kernelBands(xs, S, 0.5, 'gaussiano', w, 1)
    const est = weightedKernelSum(xs, S, 0.5, 'gaussiano', w)
    const top = bands.at(-1)!
    for (let i = top.from; i <= top.to; i++) expect(top.upper[i - top.from]).toBeCloseTo(est[i], 12)
  })

  it('separate (stack = 0) ogni campana poggia sullo zero e ha il suo picco sul campione', () => {
    const bands = kernelBands(xs, S, 0.5, 'gaussiano', w, 0)
    expect(bands).toHaveLength(S.length)
    for (const b of bands) {
      expect(b.lower.every((v) => v === 0)).toBe(true)
      const peak = b.upper.indexOf(Math.max(...b.upper))
      expect(Math.abs(xs[b.from + peak] - S[b.k])).toBeLessThan(0.05)
      expect(Math.max(...b.upper)).toBeCloseTo(kernelValue(0, 'gaussiano') / (S.length * 0.5), 3)
    }
  })

  it('una campana si disegna solo sul suo supporto', () => {
    const [b] = kernelBands(evalGrid(D, [5], 1, 'epanechnikov'), [5], 1, 'epanechnikov', [1], 0)
    const g = evalGrid(D, [5], 1, 'epanechnikov')
    expect(g[b.from]).toBeGreaterThanOrEqual(3.9)
    expect(g[b.to]).toBeLessThanOrEqual(6.1)
  })
})

describe('contributions: gli addendi nel punto sonda', () => {
  it('sono ordinati per contributo, il primo è il campione più vicino, la somma è p̂(x)', () => {
    const c = contributions(4.2, S, 0.5, 'gaussiano')
    expect(c).toHaveLength(12)
    expect(c[0].x).toBe(4.1)
    for (let i = 1; i < c.length; i++) expect(c[i].term).toBeLessThanOrEqual(c[i - 1].term)
    expect(c.reduce((s, t) => s + t.term, 0)).toBeCloseTo(parzen1d(4.2, S, 0.5, 'gaussiano'), 12)
    expect(c[0].u).toBeCloseTo((4.2 - 4.1) / 0.5, 12)
    expect(c[0].term).toBeCloseTo(c[0].gamma / (12 * 0.5), 12)
  })

  it('a parità di contributo (rettangolare) passa prima il campione più vicino', () => {
    const c = contributions(4.2, S, 0.5, 'rettangolare')
    expect(c.slice(0, 3).map((t) => t.x)).toEqual([4.1, 4.0, 4.4])
  })

  it('K nella finestra di lato h centrata in x', () => {
    expect(windowCount(4.2, S, 0.5)).toBe(3)
    expect(windowCount(0, S, 0.5)).toBe(0)
  })
})

describe('countLocalMaxima', () => {
  it('conta i massimi interni, un pianoro una volta sola, niente sui bordi', () => {
    expect(countLocalMaxima([0, 1, 0, 2, 0])).toBe(2)
    expect(countLocalMaxima([0, 1, 1, 1, 0])).toBe(1)
    expect(countLocalMaxima([0, 1, 1, 2, 0])).toBe(1)
    expect(countLocalMaxima([1, 1, 1])).toBe(0)
    expect(countLocalMaxima([0, 1, 2, 3])).toBe(0)
    expect(countLocalMaxima([])).toBe(0)
  })

  it('il rumore in virgola mobile su un pianoro non crea né toglie massimi', () => {
    expect(countLocalMaxima([0, 1, 1 + 1e-17, 1 - 1e-16, 1, 0])).toBe(1)
  })

  it('sui salmoni: h piccolo un picco per campione, h medio una gobba sola', () => {
    const xs = linspace(0, 10, 1001)
    const at = (h: number) => countLocalMaxima(weightedKernelSum(xs, S, h, 'gaussiano', S.map(() => 1 / 12)))
    expect(at(0.05)).toBe(11)
    expect(at(0.5)).toBe(1)
    // il triangolare ha la cima piatta: resta almeno un massimo
    expect(countLocalMaxima(weightedKernelSum(xs, S, 1.4, 'triangolare', S.map(() => 1 / 12)))).toBeGreaterThanOrEqual(1)
  })
})

describe('clippedPeaks: i picchi oltre la cornice', () => {
  it('un segno per ogni tratto sopra la quota massima, sul suo punto più alto', () => {
    const xs = [0, 1, 2, 3, 4, 5, 6]
    expect(clippedPeaks(xs, [0, 2, 0, 0.5, 3, 4, 0], 1)).toEqual([1, 5])
    expect(clippedPeaks(xs, [0, 0.2, 0, 0.5, 0.3, 0.4, 0], 1)).toEqual([])
  })
})

describe('posto delle etichette dirette', () => {
  const pts = [0, 1, 2, 3, 4, 5, 6].map((x) => [x, [0, 1, 3, 4, 3, 1, 0][x]])
  it('peakPoint è il punto più alto', () => {
    expect(peakPoint(pts)).toEqual([3, 4])
    expect(peakPoint([])).toEqual([Number.NaN, Number.NaN])
  })
  it('flankPoint scende sul fianco fino alla frazione chiesta del picco', () => {
    expect(flankPoint(pts, 'right', 0.5)).toEqual([5, 1])
    expect(flankPoint(pts, 'left', 0.8)).toEqual([2, 3])
    expect(flankPoint(pts, 'right', 0)).toEqual([6, 0])
  })
})

describe('errore integrato e h ottimo', () => {
  it('ISE = ∫(p̂ − p)² sui salmoni con il gaussiano: minimo vicino a h = 0.42', () => {
    const best = optimalBandwidth(S, 'gaussiano', truth, D, [0.05, 3])
    expect(best.h).toBeGreaterThan(0.39)
    expect(best.h).toBeLessThan(0.45)
    expect(best.ise).toBeCloseTo(0.007, 3)
    for (const h of niceLogSteps(0.05, 3)) expect(iseAt(S, h, 'gaussiano', truth, D)).toBeGreaterThanOrEqual(best.ise * (1 - 1e-6))
  })

  it('ISE è zero se la stima coincide con la verità', () => {
    const one = (x: number) => parzen1d(x, [5], 1, 'gaussiano')
    expect(iseAt([5], 1, 'gaussiano', one, D)).toBeCloseTo(0, 12)
  })
})

describe('regimeOf', () => {
  const r = { sensitiveBelow: 0.15, smoothAbove: 1.5 }
  it('sensibile sotto, liscia sopra, in equilibrio fra le due soglie', () => {
    expect(regimeOf(0.1, r)).toBe('sensitive')
    expect(regimeOf(0.5, r)).toBe('balanced')
    expect(regimeOf(2, r)).toBe('smooth')
    expect(regimeOf(0.01)).toBe('balanced')
  })
})

describe('storyboard: sceneAt', () => {
  const steps: Density1dStep[] = [
    { id: 'quadro', label: 'Quadro', phase: { kind: 'overview' }, durationMs: 1000, caption: '' },
    { id: 'cadono', label: 'Cadono', phase: { kind: 'drop' }, durationMs: (n) => n * 300, caption: '' },
    { id: 'nascono', label: 'Nascono', phase: { kind: 'grow' }, durationMs: 1500, caption: '' },
    { id: 'pesano', label: 'Pesano', phase: { kind: 'normalize' }, durationMs: 1000, caption: '' },
    { id: 'somma', label: 'Somma', phase: { kind: 'stack' }, durationMs: 1500, caption: '' },
    { id: 'vera', label: 'Vera', phase: { kind: 'truth' }, durationMs: 1000, caption: '' },
    { id: 'aghi', label: 'Aghi', phase: { kind: 'bandwidth', h: 0.1, truth: true }, durationMs: 1500, caption: '' },
    { id: 'collina', label: 'Collina', phase: { kind: 'bandwidth', h: 2.5, truth: true }, durationMs: 1500, caption: '' },
    { id: 'tuo', label: 'Tuo', phase: { kind: 'bandwidth', h: 'user' }, durationMs: 1000, caption: '' },
  ]
  const ctx = { n: 12, userH: 0.5 }
  const at = (i: number, p: number) => sceneAt(steps, i, p, ctx)

  it('il quadro è lo stato completo con i valori dell\'utente', () => {
    const s = at(0, 0)
    expect(s.fall.every((f) => f === 1)).toBe(true)
    expect(s.growth.every((g) => g === 1)).toBe(true)
    expect(s.weight).toBeCloseTo(1 / 12, 12)
    expect(s).toMatchObject({ stack: 0, estimate: 1, truth: 'user', kernels: 'user', h: 0.5, hOverride: false })
  })

  it('caduta: a metà passo metà dei campioni è a terra, niente kernel', () => {
    const s = at(1, 0.5)
    expect(s.fall.filter((f) => f === 1)).toHaveLength(6)
    expect(s.fall[6]).toBe(0)
    expect(s).toMatchObject({ estimate: 0, kernels: 'hide' })
    expect(at(1, 1).fall.every((f) => f === 1)).toBe(true)
  })

  it('nascita: i kernel crescono uno dopo l\'altro fino all\'altezza intera', () => {
    expect(at(2, 0).growth.every((g) => g === 0)).toBe(true)
    expect(at(2, 1).growth.every((g) => g === 1)).toBe(true)
    const mid = at(2, 0.5).growth
    for (let k = 1; k < mid.length; k++) expect(mid[k]).toBeLessThanOrEqual(mid[k - 1])
    expect(mid[0]).toBeGreaterThan(mid[11])
    expect(at(2, 0.5)).toMatchObject({ weight: 1, kernels: 'force', estimate: 0 })
  })

  it('normalizzazione: il peso scende da 1 a 1/N', () => {
    expect(at(3, 0).weight).toBe(1)
    expect(at(3, 1).weight).toBeCloseTo(1 / 12, 12)
  })

  it('somma: a fine passo la pila è completa e la stima disegnata', () => {
    expect(at(4, 0)).toMatchObject({ stack: 0, estimate: 0 })
    expect(at(4, 1)).toMatchObject({ stack: 1, estimate: 1 })
  })

  it('verità: la pila torna giù e la densità vera compare', () => {
    expect(at(5, 0)).toMatchObject({ stack: 1, truth: 0 })
    expect(at(5, 1)).toMatchObject({ stack: 0, truth: 1 })
  })

  it('banda: h passa in scala logaritmica dal valore di prima al nuovo', () => {
    expect(at(6, 0).h).toBeCloseTo(0.5, 12)
    expect(at(6, 1)).toMatchObject({ h: 0.1, hOverride: true, truth: 1 })
    expect(at(7, 0).h).toBeCloseTo(0.1, 12)
    expect(at(7, 0.5).h).toBeCloseTo(Math.sqrt(0.1 * 2.5), 12)
    expect(at(8, 0).h).toBeCloseTo(2.5, 12)
    expect(at(8, 1)).toMatchObject({ h: 0.5, hOverride: false, truth: 'user' })
  })

  it('senza campioni non si rompe', () => {
    const s = sceneAt(steps, 1, 0.5, { n: 0, userH: 0.5 })
    expect(s.fall).toEqual([])
    expect(s.weight).toBe(1)
  })

  it('resolveSteps calcola le durate che dipendono da N; captionFor le didascalie', () => {
    expect(resolveSteps(steps, 12)[1]).toEqual({ id: 'cadono', label: 'Cadono', durationMs: 3600 })
    const step: Density1dStep = { ...steps[3], caption: ({ n, invN }) => `N = ${n}, 1/N = ${invN}` }
    expect(captionFor(step, { n: 12, h: 0.5, kernel: 'gaussiano', invN: '0.083' })).toBe('N = 12, 1/N = 0.083')
  })
})

describe('moti brevi fuori dallo storyboard', () => {
  it('birthGrowth: da 0 a 1 in ease-out, subito 1 senza durata', () => {
    expect(birthGrowth(0, 250)).toBe(0)
    expect(birthGrowth(250, 250)).toBe(1)
    expect(birthGrowth(125, 250)).toBeGreaterThan(0.5)
    expect(birthGrowth(10, 0)).toBe(1)
  })

  it('tweenValue: dal vecchio peso al nuovo', () => {
    expect(tweenValue(1 / 12, 1 / 13, 0, 300)).toBeCloseTo(1 / 12, 12)
    expect(tweenValue(1 / 12, 1 / 13, 300, 300)).toBeCloseTo(1 / 13, 12)
    const mid = tweenValue(1 / 12, 1 / 13, 150, 300)
    expect(mid).toBeLessThan(1 / 12)
    expect(mid).toBeGreaterThan(1 / 13)
  })
})

describe('campioni aggiunti e tolti', () => {
  it('snapSample arrotonda ai decimali dello scenario e resta nel dominio', () => {
    expect(snapSample(4.234, D, 1)).toBe(4.2)
    expect(snapSample(-3, D, 1)).toBe(0)
    expect(snapSample(10.04, D, 1)).toBe(10)
  })

  it('nearestSampleIndex trova il campione più vicino; -1 se non ce ne sono', () => {
    expect(nearestSampleIndex(S, 4.26)).toBe(6)
    expect(nearestSampleIndex([], 4)).toBe(-1)
  })

  it('defaultK è √N arrotondato, almeno 1', () => {
    expect(defaultK(12)).toBe(3)
    expect(defaultK(0)).toBe(1)
  })
})

describe('formulaValues: i numeri delle formule vive', () => {
  it('nel punto sonda: p̂(x) = S / (N h), addendi ordinati, δ(0) e 1/N', () => {
    const v = formulaValues({ x: 4.2, samples: S, h: 0.5, kernel: 'gaussiano', k: 3, truth, hOpt: 0.42, ise: 0.0075 })
    expect(v.p).toBeCloseTo(parzen1d(4.2, S, 0.5, 'gaussiano'), 12)
    expect(Number(v.S) / Number(v.Nh)).toBeCloseTo(Number(v.p), 12)
    expect(v.N).toBe(12)
    expect(v.Nh).toBeCloseTo(6, 12)
    expect(Number(v.g1)).toBeGreaterThanOrEqual(Number(v.g2))
    expect(Number(v.g2)).toBeGreaterThanOrEqual(Number(v.g3))
    expect(v.xk1).toBe(4.1)
    expect(v.d0).toBeCloseTo(kernelValue(0, 'gaussiano') / 0.5, 12)
    expect(v.peak).toBeCloseTo(kernelValue(0, 'gaussiano') / 6, 12)
    expect(v.area).toBeCloseTo(1 / 12, 12)
    expect(v.K).toBe(3)
    expect(v.ptrue).toBeCloseTo(truth(4.2), 12)
    expect(v.hopt).toBe(0.42)
    expect(v.ise).toBe(0.0075)
    // K-NN: V_K = 2 r_K, p̂ = K / (N V_K)
    expect(Number(v.pk)).toBeCloseTo(3 / (12 * Number(v.VK)), 12)
    expect(v.VK).toBeCloseTo(2 * Number(v.r), 12)
  })

  it('gli addendi che non esistono restano vuoti (LiveFormula scrive un trattino)', () => {
    const v = formulaValues({ x: 1, samples: [2], h: 1, kernel: 'gaussiano', k: 1 })
    expect(v.g1).toBeDefined()
    expect(v.g2).toBeUndefined()
    expect(v.ptrue).toBeUndefined()
  })
})
