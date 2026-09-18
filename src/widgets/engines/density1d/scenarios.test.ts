import { describe, expect, it } from 'vitest'
import { fishDensity } from '../../../lib/datasets/fish'
import { sensorsDensity } from '../../../lib/datasets/sensors'
import { linspace, trapz } from '../../../lib/ml/stats'
import { fishLightnessScenario, mixtureScenario, mixtureTex, sensorsScenario } from './scenarios'

describe('mixtureScenario', () => {
  const sc = mixtureScenario({
    samples: [2.6, 3.1, 7.1],
    components: [
      { weight: 0.7, mu: 4, sigma: 0.8 },
      { weight: 0.3, mu: 6, sigma: 0.9 },
    ],
    domain: [0, 10],
    axis: { it: 'luminosità', en: 'lightness', unit: 'scala 0-10' },
    sampleName: { one: 'salmone', many: 'salmoni' },
  })

  it('la densità vera è la mistura e integra a 1 sul dominio', () => {
    const xs = linspace(0, 10, 2001)
    expect(trapz(xs, xs.map(sc.truth!))).toBeCloseTo(1, 4)
  })

  it('scrive la mistura in LaTeX con i pesi normalizzati', () => {
    expect(sc.truthTex).toBe(String.raw`0.7\,\mathcal{N}(4,\ 0.8^2) + 0.3\,\mathcal{N}(6,\ 0.9^2)`)
    expect(mixtureTex([{ weight: 2, mu: 0, sigma: 1 }, { weight: 2, mu: 3, sigma: 0.5 }])).toBe(String.raw`0.5\,\mathcal{N}(0,\ 1^2) + 0.5\,\mathcal{N}(3,\ 0.5^2)`)
  })

  it('i campioni sono quelli dati, nell\'ordine dato', () => {
    expect(sc.samples).toEqual([2.6, 3.1, 7.1])
  })
})

describe('scenari del cast', () => {
  it('sensori: stesso seed, stesse letture, arrotondate e dentro il dominio; verità del dataset', () => {
    const a = sensorsScenario({ seed: 9, n: 30 })
    const b = sensorsScenario({ seed: 9, n: 30 })
    expect(a.samples).toEqual(b.samples)
    expect(a.samples).toHaveLength(30)
    for (const x of a.samples) {
      expect(x).toBeGreaterThanOrEqual(a.domain[0])
      expect(x).toBeLessThanOrEqual(a.domain[1])
      expect(Number(x.toFixed(1))).toBe(x)
    }
    expect(a.truth!(40)).toBeCloseTo(sensorsDensity()(40), 12)
    expect(a.axis.unit).toBe('°C')
  })

  it('pesce: luminosità dei soli salmoni, verità p(x | salmone) del dataset', () => {
    const sc = fishLightnessScenario({ seed: 3, n: 20 })
    expect(sc.samples).toHaveLength(20)
    expect(sc.domain).toEqual([0, 10])
    expect(sc.truth!(3.3)).toBeCloseTo(fishDensity('salmone', ['luminosita'])([3.3]), 12)
    expect(sc.sampleName.one).toBe('salmone')
  })
})
