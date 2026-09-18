// Scenari del cast (docs/plan/cast.md) pronti per il motore density1d: campioni, densità vera, asse.
// Tutti sintetici e a seed: stesso seed, stessi campioni. La verità è sempre quella da cui i dati escono
// davvero, così l'errore integrato misura la stima e non un modello sbagliato.
import { fishDataset, fishDensity, fishMeta } from '../../../lib/datasets/fish'
import { sensorsDataset, sensorsDensity, sensorsMeta } from '../../../lib/datasets/sensors'
import type { SensorQuantity } from '../../../lib/datasets/sensors'
import { mixturePdf } from '../../../lib/ml/stats'
import type { MixtureComponent } from '../../../lib/ml/stats'
import { createRng } from '../../../lib/rng'
import type { Density1dScenario } from './types'

const num = (v: number) => String(Number(v.toPrecision(6)))

/** Una mistura di gaussiane in LaTeX, con i pesi normalizzati: 0.7\,\mathcal{N}(4,\ 0.8^2) + … */
export function mixtureTex(components: readonly MixtureComponent[]): string {
  const total = components.reduce((s, c) => s + c.weight, 0)
  return components.map((c) => String.raw`${num(c.weight / total)}\,\mathcal{N}(${num(c.mu)},\ ${num(c.sigma)}^2)`).join(' + ')
}

export interface MixtureScenarioOptions extends Omit<Density1dScenario, 'truth' | 'truthTex'> {
  components: readonly MixtureComponent[]
}

/** Campioni dati a mano (per esempio quelli dell'inventario) e la mistura di gaussiane che li ha generati. */
export function mixtureScenario({ components, ...rest }: MixtureScenarioOptions): Density1dScenario {
  const comps = components.map((c) => ({ ...c }))
  return { ...rest, truth: (x) => mixturePdf(x, comps), truthTex: mixtureTex(comps) }
}

/** Sensore IoT sul cuscinetto del motore (scenario "sensori"): temperatura o vibrazione, mistura a 2 o 3 regimi. */
export function sensorsScenario({ seed, n, quantity = 'temperatura', modes = 3 }: { seed: number; n: number; quantity?: SensorQuantity; modes?: 2 | 3 }): Density1dScenario {
  const decimals = quantity === 'temperatura' ? 1 : 2
  const domain = sensorsMeta.ranges[quantity]
  const samples = sensorsDataset(createRng(seed), { n, quantity, modes }).map((s) => Math.min(Math.max(Number(s.x[0].toFixed(decimals)), domain[0]), domain[1]))
  const label = sensorsMeta.featureLabels[quantity]
  return {
    samples,
    truth: sensorsDensity({ quantity, modes }),
    domain,
    axis: { it: label.it, en: label.en, unit: sensorsMeta.units[quantity] },
    sampleName: { one: 'lettura', many: 'letture' },
    decimals,
  }
}

/** Luminosità dei salmoni sul nastro (scenario "pesce"), con la verità p(luminosità | salmone) del dataset. */
export function fishLightnessScenario({ seed, n }: { seed: number; n: number }): Density1dScenario {
  const all = fishDataset(createRng(seed), { n: 2 * n, features: ['luminosita'], pSalmone: 0.5 })
  const samples = all.filter((f) => f.label === 'salmone').slice(0, n).map((f) => Number(f.x[0].toFixed(1)))
  const density = fishDensity('salmone', ['luminosita'])
  return {
    samples,
    truth: (x) => density([x]),
    domain: fishMeta.ranges.luminosita,
    axis: { it: fishMeta.featureLabels.luminosita.it, en: fishMeta.featureLabels.luminosita.en, unit: fishMeta.units.luminosita },
    sampleName: { one: 'salmone', many: 'salmoni' },
    decimals: 1,
  }
}
