import { describe, expect, it, vi } from 'vitest'
import { linspace, normalCdf, trapz } from '../../lib/ml/stats'
import {
  binLayout,
  cellsCurve,
  cellsDensityAt,
  cellsIntegral,
  challengeMet,
  countInside,
  createFrameStore,
  DOMAIN,
  estimator,
  FIRST,
  fishStream,
  fitGaussian,
  flightsAt,
  gaussIntegral,
  hiddenPdf,
  HIDDEN_PDF_IDS,
  HYP_START,
  HYP_XS,
  hypothesisArea,
  hypothesisPdf,
  normalizeHypothesis,
  histogramCells,
  intervalProbability,
  iseCurve,
  iseOf,
  landedAt,
  landingProgress,
  MAX_N,
  moveHandle,
  N_OPTIONS,
  STEP,
  streamDurationMs,
} from './campioniPdf'

describe('pdf nascoste', () => {
  it('ogni pdf, ristretta alla scala 0-10, integra a 1', () => {
    const xs = linspace(DOMAIN[0], DOMAIN[1], 4001)
    for (const id of HIDDEN_PDF_IDS) {
      const p = hiddenPdf(id).pdf
      expect(trapz(xs, xs.map(p))).toBeCloseTo(1, 4)
    }
  })

  it('fuori dalla scala la densità è 0', () => {
    for (const id of HIDDEN_PDF_IDS) {
      expect(hiddenPdf(id).pdf(-0.1)).toBe(0)
      expect(hiddenPdf(id).pdf(10.1)).toBe(0)
    }
  })

  it('unimodale = N(3.1, 1.0²) rinormalizzata sulla scala', () => {
    const p = hiddenPdf('unimodale')
    const mass = normalCdf(10, 3.1, 1) - normalCdf(0, 3.1, 1)
    expect(p.pdf(3.1)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI) / mass, 6)
    expect(p.peak).toBeCloseTo(p.pdf(3.1), 2)
  })

  it('la bimodale ha due gobbe e un avvallamento fra le due', () => {
    const p = hiddenPdf('bimodale').pdf
    expect(p(3.1)).toBeGreaterThan(p(4.8))
    expect(p(6.5)).toBeGreaterThan(p(4.8))
  })

  it('la asimmetrica (Gamma k = 3, θ = 1) ha la moda in (k − 1)θ = 2', () => {
    const p = hiddenPdf('asimmetrica').pdf
    expect(p(2)).toBeGreaterThan(p(1.8))
    expect(p(2)).toBeGreaterThan(p(2.2))
  })
})

describe('campioni sul nastro', () => {
  it('stesso seed, stessi pesci; tutti dentro la scala; tre feature', () => {
    const a = fishStream('unimodale', 300)
    const b = fishStream('unimodale', 300)
    expect(a).toEqual(b)
    expect(a).toHaveLength(300)
    for (const f of a) {
      expect(f.lum).toBeGreaterThanOrEqual(0)
      expect(f.lum).toBeLessThanOrEqual(10)
      expect(f.larghezza).toBeGreaterThan(0)
      expect(f.lunghezza).toBeGreaterThan(0)
    }
  })

  it('i primi N di un flusso lungo sono il flusso corto: cambiare N non rimescola i campioni', () => {
    expect(fishStream('bimodale', 50)).toEqual(fishStream('bimodale', MAX_N).slice(0, 50))
  })

  it('la media campionaria con tanti campioni si avvicina a quella vera', () => {
    const lums = fishStream('unimodale').map((f) => f.lum)
    const m = lums.reduce((s, v) => s + v, 0) / lums.length
    expect(m).toBeGreaterThan(3.0)
    expect(m).toBeLessThan(3.2)
    const g = fishStream('asimmetrica').map((f) => f.lum)
    // media della Gamma(3, 1) = kθ = 3 (il troncamento a 10 la sposta di pochissimo)
    expect(g.reduce((s, v) => s + v, 0) / g.length).toBeCloseTo(3, 0)
  })

  it('le tre pdf danno flussi diversi', () => {
    expect(fishStream('unimodale', 5)).not.toEqual(fishStream('bimodale', 5))
  })
})

describe('istogramma normalizzato', () => {
  it('bin di larghezza qualsiasi: tanti bin da coprire la scala', () => {
    expect(binLayout(0.5)).toEqual({ bins: 20, domain: [0, 10] })
    const odd = binLayout(0.3)
    expect(odd.bins).toBe(34)
    expect(odd.domain[1]).toBeCloseTo(10.2, 10)
  })

  it('area 1, e p̂ = (K/N)/V in ogni bin', () => {
    const values = [0.1, 0.2, 0.7, 3.3, 3.4, 9.9]
    const cells = histogramCells(values, 0.5)
    expect(cellsIntegral(cells, 0, 10)).toBeCloseTo(1, 10)
    // bin [0, 0.5): K = 2, N = 6, V = 0.5
    expect(cellsDensityAt(cells, 0.3)).toBeCloseTo(2 / 6 / 0.5, 10)
    expect(cellsDensityAt(cells, 5)).toBe(0)
    expect(cellsDensityAt(cells, -1)).toBe(0)
  })

  it('l integrale fra due bordi di bin è la frazione di campioni K_ab / N', () => {
    const values = fishStream('unimodale', 400).map((f) => f.lum)
    const cells = histogramCells(values, 0.5)
    expect(cellsIntegral(cells, 2, 4)).toBeCloseTo(countInside(values, 2, 4) / values.length, 10)
    // a metà bin conta la frazione di bin coperta
    const half = cellsIntegral(cells, 2, 2.25)
    expect(half).toBeCloseTo(cellsDensityAt(cells, 2.1) * 0.25, 10)
  })

  it('la curva a gradini passa per le altezze dei bin', () => {
    const cells = histogramCells([1, 1.2, 2.6], 1)
    const curve = cellsCurve(cells)
    expect(curve[0]).toEqual([0, 0])
    expect(curve).toContainEqual([1, 2 / 3])
    expect(curve).toContainEqual([2, 2 / 3])
    expect(curve.at(-1)?.[0]).toBe(10)
  })

  it('campione vuoto: tutti i bin a 0', () => {
    expect(cellsIntegral(histogramCells([], 1), 0, 10)).toBe(0)
  })
})

describe('gaussiana adattata', () => {
  it('media e deviazione standard campionarie (1/N)', () => {
    const fit = fitGaussian([2, 4, 4, 4, 5, 5, 7, 9])
    expect(fit?.mu).toBeCloseTo(5, 10)
    expect(fit?.sigma).toBeCloseTo(2, 10)
  })

  it('con meno di due campioni, o tutti uguali, non esiste', () => {
    expect(fitGaussian([])).toBeNull()
    expect(fitGaussian([3])).toBeNull()
    expect(fitGaussian([3, 3, 3])).toBeNull()
  })

  it('P sotto la gaussiana adattata con la cdf', () => {
    expect(gaussIntegral({ mu: 0, sigma: 1 }, -1, 1)).toBeCloseTo(0.6827, 4)
  })
})

describe('probabilità come area', () => {
  it('P{a ≤ x ≤ b} = ∫ p(x) dx: sulla scala intera vale 1', () => {
    for (const id of HIDDEN_PDF_IDS) expect(intervalProbability(hiddenPdf(id).pdf, 0, 10)).toBeCloseTo(1, 4)
  })

  it('unimodale: coincide con la cdf normale rinormalizzata', () => {
    const mass = normalCdf(10, 3.1, 1) - normalCdf(0, 3.1, 1)
    const expected = (normalCdf(4, 3.1, 1) - normalCdf(2, 3.1, 1)) / mass
    expect(intervalProbability(hiddenPdf('unimodale').pdf, 2, 4)).toBeCloseTo(expected, 5)
  })

  it('a e b scambiati danno la stessa area; a = b dà 0', () => {
    const p = hiddenPdf('bimodale').pdf
    expect(intervalProbability(p, 5, 3)).toBeCloseTo(intervalProbability(p, 3, 5), 10)
    expect(intervalProbability(p, 3, 3)).toBe(0)
  })

  it('K_ab conta i campioni dentro [a, b], estremi compresi', () => {
    expect(countInside([1, 2, 3, 4], 2, 3)).toBe(2)
  })
})

describe('errore quadratico integrato', () => {
  it('ISE di una stima perfetta è 0', () => {
    const p = hiddenPdf('unimodale').pdf
    expect(iseOf(p, p)).toBeCloseTo(0, 12)
  })

  it('l istogramma converge: con più campioni l errore scende', () => {
    const lums = fishStream('unimodale').map((f) => f.lum)
    const curve = iseCurve(lums, hiddenPdf('unimodale').pdf, 'istogramma', 0.5, [20, 200, 5000])
    expect(curve[1].ise).toBeLessThan(curve[0].ise)
    expect(curve[2].ise).toBeLessThan(curve[1].ise)
    expect(curve[2].ise).toBeLessThan(0.006)
  })

  it('sulla bimodale la gaussiana adattata resta lontana qualunque sia N, l istogramma no', () => {
    const lums = fishStream('bimodale').map((f) => f.lum)
    const pdf = hiddenPdf('bimodale').pdf
    const [gauss] = iseCurve(lums, pdf, 'gaussiana', 0.5, [5000])
    const [hist] = iseCurve(lums, pdf, 'istogramma', 0.5, [5000])
    expect(gauss.ise).toBeGreaterThan(0.02)
    expect(hist.ise).toBeLessThan(gauss.ise / 4)
  })

  it('senza campioni la stima non c è', () => {
    expect(estimator([], 'istogramma', 0.5)).toBeNull()
    expect(estimator([1], 'gaussiana', 0.5)).toBeNull()
    expect(estimator([1], 'istogramma', 0.5)?.(1.2)).toBeCloseTo(2, 10)
  })
})

describe('la tua ipotesi disegnata a mano', () => {
  it('parte uniforme: altezza 1/10 su tutta la scala, area 1', () => {
    expect(HYP_XS).toHaveLength(11)
    expect(hypothesisArea(HYP_START)).toBeCloseTo(1, 12)
  })

  it('rinormalizzare porta l area a 1 senza cambiare la forma', () => {
    const doubled = HYP_START.map((h, i) => (i === 3 ? 0.6 : h * 2))
    const norm = normalizeHypothesis(doubled)
    expect(hypothesisArea(norm)).toBeCloseTo(1, 5)
    expect(norm[3] / norm[0]).toBeCloseTo(0.6 / 0.2, 4)
    expect(normalizeHypothesis(HYP_START.map(() => 0))).toEqual([...HYP_START])
  })

  it('la pdf dell ipotesi è la spezzata rinormalizzata: integra a 1, 0 fuori scala', () => {
    const heights = [0, 0.1, 0.4, 0.8, 0.4, 0.1, 0, 0, 0, 0, 0]
    const p = hypothesisPdf(heights)
    const xs = linspace(0, 10, 2001)
    expect(trapz(xs, xs.map(p))).toBeCloseTo(1, 4)
    const area = hypothesisArea(heights)
    expect(p(3)).toBeCloseTo(0.8 / area, 5)
    expect(p(2.5)).toBeCloseTo(0.6 / area, 5)
    expect(p(-1)).toBe(0)
    expect(p(11)).toBe(0)
  })

  it('un ipotesi con la forma giusta ha un ISE piccolo, quella uniforme no', () => {
    const truth = hiddenPdf('unimodale').pdf
    const good = hypothesisPdf(HYP_XS.map((x) => truth(x)))
    const flat = hypothesisPdf(HYP_START)
    expect(iseOf(good, truth)).toBeLessThan(0.002)
    expect(iseOf(flat, truth)).toBeGreaterThan(0.1)
  })
})

describe('storyboard: quanti campioni sono atterrati', () => {
  it('passo 1: nessuno; passo 2: il primo atterra alla fine della caduta', () => {
    expect(landedAt(STEP.sipario, 1, 200)).toBe(0)
    expect(landedAt(STEP.primo, 0, 200)).toBe(0)
    expect(landedAt(STEP.primo, FIRST.land - 0.01, 200)).toBe(0)
    expect(landedAt(STEP.primo, FIRST.land, 200)).toBe(1)
    expect(landedAt(STEP.primo, 1, 200)).toBe(1)
  })

  it('passo 3: da 1 a N, senza mai tornare indietro; dal passo 4 sono N', () => {
    for (const n of [1, 2, 5, 200, 5000]) {
      expect(landedAt(STEP.campione, 0, n)).toBe(Math.min(1, n))
      expect(landedAt(STEP.campione, 1, n)).toBe(n)
      let last = 0
      for (let p = 0; p <= 1.0001; p += 0.01) {
        const c = landedAt(STEP.campione, Math.min(p, 1), n)
        expect(c).toBeGreaterThanOrEqual(last)
        last = c
      }
      expect(landedAt(STEP.svela, 0, n)).toBe(n)
      expect(landedAt(STEP.area, 0.3, n)).toBe(n)
    }
  })

  it('il campione i atterra esattamente al suo istante', () => {
    for (const n of [4, 300]) {
      for (const i of [2, 3, n]) {
        const p = landingProgress(i, n)
        expect(landedAt(STEP.campione, p, n)).toBeGreaterThanOrEqual(i)
        expect(landedAt(STEP.campione, Math.max(0, p - 1e-6), n)).toBeLessThan(i)
      }
    }
  })

  it('pochi pesci uno alla volta (ritmo costante), tanti a raffica', () => {
    expect(streamDurationMs(2)).toBeLessThan(streamDurationMs(5))
    expect(streamDurationMs(5000)).toBe(streamDurationMs(200))
    // con N piccolo i pesci arrivano a intervalli uguali
    expect(landingProgress(3, 5) - landingProgress(2, 5)).toBeCloseTo(landingProgress(5, 5) - landingProgress(4, 5), 10)
  })

  it('in volo ci sono solo campioni non ancora atterrati, con t fra 0 e 1', () => {
    const n = 300
    const p = 0.5
    const landed = landedAt(STEP.campione, p, n)
    const flights = flightsAt(p, n, 0.1)
    expect(flights.length).toBeGreaterThan(0)
    for (const f of flights) {
      expect(f.k).toBeGreaterThan(landed)
      expect(f.t).toBeGreaterThanOrEqual(0)
      expect(f.t).toBeLessThan(1)
    }
    expect(flightsAt(p, n, 0.5, 12).length).toBeLessThanOrEqual(12)
    expect(flightsAt(1, n, 0.1)).toEqual([])
  })
})

describe('maniglie a e b, sfida', () => {
  it('a resta sempre a sinistra di b', () => {
    expect(moveHandle('a', 5, 2, 4)).toEqual({ a: 3.95, b: 4 })
    expect(moveHandle('b', 1, 2, 4)).toEqual({ a: 2, b: 2.05 })
    expect(moveHandle('a', 1.5, 2, 4)).toEqual({ a: 1.5, b: 4 })
  })

  it('la sfida chiede P = 0.50 con tolleranza 0.01', () => {
    expect(challengeMet(0.5)).toBe(true)
    expect(challengeMet(0.509)).toBe(true)
    expect(challengeMet(0.49)).toBe(true)
    expect(challengeMet(0.52)).toBe(false)
    expect(challengeMet(Number.NaN)).toBe(false)
  })

  it('la sfida si può vincere sulla griglia dei passi da tastiera (0.05)', () => {
    // da a = 2, b = 4: otto passi a destra per a, cinque a sinistra per b
    expect(challengeMet(intervalProbability(hiddenPdf('unimodale').pdf, 2.4, 3.75))).toBe(true)
  })

  it('i valori di N offerti sono crescenti e arrivano al massimo', () => {
    for (let i = 1; i < N_OPTIONS.length; i++) expect(N_OPTIONS[i]).toBeGreaterThan(N_OPTIONS[i - 1])
    expect(N_OPTIONS.at(-1)).toBe(MAX_N)
  })
})

describe('store dei fotogrammi', () => {
  it('avvisa solo quando qualcosa cambia', () => {
    const store = createFrameStore()
    const listener = vi.fn()
    const off = store.subscribe(listener)
    store.set(0, 0)
    expect(listener).not.toHaveBeenCalled()
    store.set(0.5, 2)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.get()).toEqual({ progress: 0.5, index: 2 })
    off()
    store.set(1, 2)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
