import { describe, expect, it } from 'vitest'
import { autoDomain, axisFromSpec, axisTicks, clipUpTo, formatReading, formatTick, fromAxis, sampleCurve, toAxis } from './paramAxes'

describe('assi lineari e logaritmici', () => {
  it('toAxis e fromAxis sono l\'una l\'inversa dell\'altra; in log i non positivi non esistono', () => {
    expect(toAxis(100, true)).toBe(2)
    expect(fromAxis(2, true)).toBe(100)
    expect(toAxis(3, false)).toBe(3)
    expect(Number.isNaN(toAxis(0, true))).toBe(true)
    expect(Number.isNaN(toAxis(-1, true))).toBe(true)
  })

  it('tacche in scala log: 1-2-5 su poche decadi, solo le potenze di 10 su molte', () => {
    expect(axisTicks([1, 100], true)).toEqual([1, 2, 5, 10, 20, 50, 100])
    expect(axisTicks([2, 5000], true)).toEqual([2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000])
    expect(axisTicks([1e-3, 1e4], true)).toEqual([1e-3, 1e-2, 0.1, 1, 10, 100, 1000, 1e4])
    // oltre otto decadi, una potenza di 10 ogni due
    expect(axisTicks([1, 1e10], true)).toEqual([1, 100, 1e4, 1e6, 1e8, 1e10])
  })

  it('con meno spazio (count piccolo) le tacche log si diradano prima: niente cifre ammucchiate', () => {
    expect(axisTicks([1e-3, 10], true, 4)).toEqual([1e-3, 1e-2, 0.1, 1, 10])
    expect(axisTicks([1e-3, 10], true, 7)).toHaveLength(13)
  })

  it('tacche lineari: quelle di d3, dentro il dominio', () => {
    expect(axisTicks([0, 1], false, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
  })

  it('testo delle tacche compatto: niente zeri inutili, esponente per i numeri enormi o minuscoli', () => {
    expect(formatTick(0.5)).toBe('0.5')
    expect(formatTick(2000)).toBe('2000')
    expect(formatTick(1e5)).toBe('1e5')
    expect(formatTick(1e-4)).toBe('1e−4')
    expect(formatTick(-3)).toBe('−3')
  })
})

describe('curve e costruzione punto per punto', () => {
  it('campionamento uniforme nello spazio dell\'asse (in log: più punti vicino allo zero)', () => {
    const pts = sampleCurve((x) => 1 / x, [1, 1000], true, 4)
    expect(pts.map((p) => p[0])).toEqual([1, 10, 100, 1000])
    expect(pts[1][1]).toBeCloseTo(0.1, 12)
  })

  it('clipUpTo tiene ciò che sta prima di upTo e chiude con il punto interpolato in upTo', () => {
    const pts: [number, number][] = [
      [0, 0],
      [1, 10],
      [2, 20],
    ]
    expect(clipUpTo(pts, 1.5, false)).toEqual([
      [0, 0],
      [1, 10],
      [1.5, 15],
    ])
    expect(clipUpTo(pts, 5, false)).toEqual(pts)
    expect(clipUpTo(pts, -1, false)).toEqual([])
    // in scala log l'interpolazione è nello spazio dell'asse: a metà fra 10 e 1000 c'è 100
    const lg = clipUpTo(
      [
        [10, 0],
        [1000, 2],
      ],
      100,
      true,
    )
    expect(lg[1][0]).toBe(100)
    expect(lg[1][1]).toBeCloseTo(1, 12)
  })

  it('dominio automatico con un margine; in log moltiplicativo; un valore solo si allarga', () => {
    expect(autoDomain([0, 10], false)).toEqual([-0.5, 10.5])
    const [a, b] = autoDomain([1, 100], true)
    expect(a).toBeCloseTo(10 ** -0.1, 12)
    expect(b).toBeCloseTo(10 ** 2.1, 12)
    expect(autoDomain([3, 3], false)).toEqual([2, 4])
    expect(autoDomain([], false)).toEqual([0, 1])
  })
})

describe('axisFromSpec', () => {
  it('l\'AxisSpec di un preset (it/en, unità, simbolo) diventa l\'asse di ParamChart senza riscriverlo', () => {
    expect(axisFromSpec({ it: 'campioni', en: 'samples', symbol: 'N', domain: [1, 1000], log: true })).toEqual({ label: 'campioni', symbol: 'N', domain: [1, 1000], log: true })
    // l'unità va nel simbolo, scritta come la vuole l'Axis del kit ("x [cm]")
    const b = axisFromSpec({ it: 'luminosità', en: 'lightness', unit: 'lux', symbol: 'x' })
    expect(b.symbol).toBe('x [lux]')
    expect(b.domain).toBeUndefined()
    expect(axisFromSpec({ it: 'tempo', en: 'time', unit: 's' }).symbol).toBe('[s]')
    // estremi e formato si possono dare o cambiare qui
    const f = (v: number) => v.toFixed(1)
    expect(axisFromSpec({ it: 'soglia', en: 'threshold', domain: [0, 1] }, { domain: [0, 2], format: f })).toMatchObject({ label: 'soglia', domain: [0, 2], format: f })
  })
})

describe('formatReading', () => {
  it('letture del cursore a 3 cifre significative, senza perdere le cifre intere', () => {
    expect(formatReading(31.6227766)).toBe('31.6')
    expect(formatReading(0.126491106)).toBe('0.126')
    expect(formatReading(2)).toBe('2')
    expect(formatReading(1234.5)).toBe('1235')
    expect(formatReading(-0.5)).toBe('−0.5')
    expect(formatReading(0)).toBe('0')
    // esponente sotto 10⁻³ e da 10⁵, come formatTick; la mantissa non arriva mai a 10
    expect(formatReading(123456)).toBe('1.23e5')
    expect(formatReading(0.000123456)).toBe('1.23e−4')
    expect(formatReading(0.00099999)).toBe('1e−3')
    expect(formatReading(Number.NaN)).toBe('—')
    expect(formatReading(Number.POSITIVE_INFINITY)).toBe('∞')
  })
})
