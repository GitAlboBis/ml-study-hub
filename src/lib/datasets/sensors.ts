// Scenario "sensori" del cast: un sensore IoT sul cuscinetto del motore di un nastro trasportatore.
// Ogni lettura è un numero solo (1D): la temperatura in °C oppure la velocità di vibrazione RMS in mm/s,
// a scelta con opts.quantity. Il motore passa da fermo a marcia a pieno carico, quindi le letture, prese
// in istanti casuali dei turni (campioni i.i.d.), formano una mistura di gaussiane a due o tre modi.
//
// La densità VERA è disponibile come funzione (sensorsDensity): i widget di stima non parametrica
// (istogramma, K-NN, Parzen) e di EM la disegnano accanto alla stima e ne misurano l'errore.
// La variante con anomalie aggiunge poche letture fuori dai regimi: surriscaldamenti o urti in alto,
// letture spurie del sensore in basso.
import type { Rng } from '../../content/types'
import type { DatasetMeta, Density1D, Sample } from './types'

export const SENSOR_QUANTITIES = ['temperatura', 'vibrazione'] as const
export type SensorQuantity = (typeof SENSOR_QUANTITIES)[number]
export const SENSOR_REGIMES = ['fermo', 'marcia', 'pieno carico'] as const
export type SensorRegime = (typeof SENSOR_REGIMES)[number]
export type SensorLabel = SensorRegime | 'anomalia'

/**
 * x = [lettura]; y è l'indice del regime che l'ha generata (la variabile nascosta di EM), label il suo nome.
 * Vale sempre label === sensorsMeta.classNames[y]: un'anomalia ha y = 3 anche con due modi, e anomaly true.
 */
export interface SensorSample extends Sample<SensorLabel> { anomaly: boolean }

/** Componente della mistura: p(x) = somma di weight * N(x; mean, sd^2) */
export interface MixtureComponent { label: SensorRegime; weight: number; mean: number; sd: number }

/** Bande uniformi da cui escono le anomalie: con probabilità pHigh quella alta, altrimenti quella bassa */
export interface AnomalyBands { low: readonly [number, number]; high: readonly [number, number]; pHigh: number }

export interface SensorsModelOptions {
  /** grandezza letta dal sensore (default 'temperatura') */
  quantity?: SensorQuantity
  /** numero di modi della mistura (default 3); con 2 restano fermo e marcia */
  modes?: 2 | 3
}
export interface SensorsDensityOptions extends SensorsModelOptions {
  /** quota eps di anomalie: la densità diventa (1 - eps) * mistura + eps * bande (default 0) */
  anomalyRate?: number
}
export interface SensorsOptions extends SensorsDensityOptions {
  /** numero di letture, anomalie comprese (default 200) */
  n?: number
}

export const sensorsMeta: DatasetMeta<SensorQuantity, SensorLabel> = {
  scenario: 'sensori',
  // le due grandezze sono alternative: ogni dataset ne contiene una sola, scelta con opts.quantity
  featureNames: SENSOR_QUANTITIES,
  featureLabels: {
    temperatura: { it: 'temperatura', en: 'temperature' },
    vibrazione: { it: 'vibrazione (velocità RMS)', en: 'vibration (RMS velocity)' },
  },
  units: { temperatura: '°C', vibrazione: 'mm/s' },
  // intervallo dei regimi normali; le anomalie cadono fuori, nelle bande di sensorsAnomalyBands
  ranges: { temperatura: [15, 62], vibrazione: [0.2, 5] },
  classNames: [...SENSOR_REGIMES, 'anomalia'],
  classLabels: {
    fermo: { it: 'fermo', en: 'stopped' },
    marcia: { it: 'marcia', en: 'running' },
    'pieno carico': { it: 'pieno carico', en: 'full load' },
    anomalia: { it: 'anomalia', en: 'anomaly' },
  },
  description:
    'Dati sintetici ispirati al monitoraggio IoT del motore di un nastro trasportatore: un sensore sul cuscinetto legge '
    + 'la temperatura (°C) oppure la velocità di vibrazione RMS (mm/s) in istanti casuali dei turni. Il motore passa da fermo '
    + 'a marcia a pieno carico, quindi le letture formano una mistura di gaussiane a due o tre modi; nella variante con anomalie '
    + 'si aggiungono surriscaldamenti o urti (valori alti) e letture spurie del sensore (valori bassi).',
  synthetic: true,
}

/** Indice di classe delle anomalie: la posizione di 'anomalia' in sensorsMeta.classNames */
export const ANOMALY_CLASS = SENSOR_REGIMES.length

// ---------------------------------------------------------------------------------------------
// Modello generativo
// ---------------------------------------------------------------------------------------------

interface Scenario { three: MixtureComponent[]; two: MixtureComponent[]; bands: AnomalyBands }

// Temperatura: ambiente a motore fermo, cassa tiepida in marcia, calda a pieno carico; oltre 65 °C è allarme.
// Vibrazione: zone della ISO 10816 per macchine piccole (buono sotto 1.8 mm/s, inaccettabile oltre 4.5).
// I modi bassi stanno ad almeno 5 deviazioni standard dallo zero: una vibrazione negativa non esce mai.
const SCENARIOS: Record<SensorQuantity, Scenario> = {
  temperatura: {
    three: [
      { label: 'fermo', weight: 0.3, mean: 24, sd: 1.8 },
      { label: 'marcia', weight: 0.45, mean: 40, sd: 3.5 },
      { label: 'pieno carico', weight: 0.25, mean: 51, sd: 2.2 },
    ],
    two: [
      { label: 'fermo', weight: 0.35, mean: 24, sd: 1.8 },
      { label: 'marcia', weight: 0.65, mean: 40, sd: 3.5 },
    ],
    bands: { low: [0, 10], high: [65, 85], pHigh: 0.7 },
  },
  vibrazione: {
    three: [
      { label: 'fermo', weight: 0.3, mean: 0.8, sd: 0.12 },
      { label: 'marcia', weight: 0.45, mean: 1.9, sd: 0.3 },
      { label: 'pieno carico', weight: 0.25, mean: 3.2, sd: 0.35 },
    ],
    two: [
      { label: 'fermo', weight: 0.35, mean: 0.8, sd: 0.12 },
      { label: 'marcia', weight: 0.65, mean: 1.9, sd: 0.3 },
    ],
    bands: { low: [0, 0.15], high: [5.5, 10], pHigh: 0.7 },
  },
}

function scenarioOf(where: string, { quantity = 'temperatura', modes = 3 }: SensorsModelOptions) {
  const s = SCENARIOS[quantity]
  if (!s) throw new RangeError(`${where}: grandezza sconosciuta "${quantity}" (valide: ${SENSOR_QUANTITIES.join(', ')})`)
  if (modes !== 2 && modes !== 3) throw new RangeError(`${where}: modes deve essere 2 o 3 (ricevuto ${modes})`)
  return { mix: modes === 2 ? s.two : s.three, bands: s.bands }
}

function checkRate(where: string, anomalyRate: number) {
  if (!(anomalyRate >= 0 && anomalyRate <= 1)) throw new RangeError(`${where}: anomalyRate deve stare in [0, 1] (ricevuto ${anomalyRate})`)
}

// ---------------------------------------------------------------------------------------------
// Verità del modello
// ---------------------------------------------------------------------------------------------

/** Componenti vere della mistura, in ordine di media crescente; i pesi sommano a 1 */
export function sensorsMixture(opts: SensorsModelOptions = {}): MixtureComponent[] {
  return scenarioOf('sensorsMixture', opts).mix.map((c) => ({ ...c }))
}

/** Bande delle anomalie della grandezza scelta: stanno fuori da sensorsMeta.ranges */
export function sensorsAnomalyBands(quantity: SensorQuantity = 'temperatura'): AnomalyBands {
  const { bands } = scenarioOf('sensorsAnomalyBands', { quantity })
  return { low: [...bands.low], high: [...bands.high], pHigh: bands.pHigh }
}

/**
 * Densità vera delle letture, come funzione da valutare dove serve: xs.map(sensorsDensity({ modes: 3 })).
 * Con anomalyRate = eps > 0 è la densità contaminata (1 - eps) * mistura + eps * bande uniformi,
 * quella da cui esce sensorsAnomalyDataset quando n * eps è intero.
 */
export function sensorsDensity(opts: SensorsDensityOptions = {}): Density1D {
  const { anomalyRate: eps = 0 } = opts
  const { mix, bands } = scenarioOf('sensorsDensity', opts)
  checkRate('sensorsDensity', eps)
  const comps = mix.map((c) => ({ mean: c.mean, sd: c.sd, k: c.weight / (c.sd * Math.sqrt(2 * Math.PI)) }))
  const mixture = (x: number) => {
    let p = 0
    for (const c of comps) p += c.k * Math.exp(-0.5 * ((x - c.mean) / c.sd) ** 2)
    return p
  }
  if (eps === 0) return mixture
  const [l0, l1] = bands.low, [h0, h1] = bands.high
  const uLow = (1 - bands.pHigh) / (l1 - l0), uHigh = bands.pHigh / (h1 - h0)
  return (x) => (1 - eps) * mixture(x) + eps * (x >= h0 && x <= h1 ? uHigh : x >= l0 && x <= l1 ? uLow : 0)
}

// ---------------------------------------------------------------------------------------------
// Generatori
// ---------------------------------------------------------------------------------------------

/**
 * Letture del sensore: ognuna sceglie il regime con i pesi della mistura (campioni i.i.d., quindi le
 * frequenze dei regimi oscillano attorno ai pesi) e poi il valore dalla gaussiana del regime.
 * Con anomalyRate > 0 le anomalie sono esattamente round(n * anomalyRate), inserite in posizioni casuali:
 * tolte quelle, restano nello stesso ordine le letture di sensorsDataset(rng, { n: n - anomalie }) con lo stesso seed.
 * I valori non sono arrotondati (niente letture identiche, che azzererebbero il raggio di K-NN).
 */
export function sensorsDataset(rng: Rng, opts: SensorsOptions = {}): SensorSample[] {
  const { n = 200, anomalyRate = 0 } = opts
  const { mix, bands } = scenarioOf('sensorsDataset', opts)
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`sensorsDataset: n deve essere un intero >= 0 (ricevuto ${n})`)
  checkRate('sensorsDataset', anomalyRate)
  const nAnomalies = Math.round(n * anomalyRate)
  const out: SensorSample[] = []
  for (let i = 0; i < n - nAnomalies; i++) {
    // regime: inversione della cumulata dei pesi
    const u = rng.next()
    let k = 0, acc = mix[0].weight
    while (u >= acc && k < mix.length - 1) acc += mix[++k].weight
    out.push({ x: [rng.normal(mix[k].mean, mix[k].sd)], y: k, label: mix[k].label, anomaly: false })
  }
  for (let i = 0; i < nAnomalies; i++) {
    const [a, b] = rng.next() < bands.pHigh ? bands.high : bands.low
    const value = rng.float(a, b)
    out.splice(rng.int(0, out.length), 0, { x: [value], y: ANOMALY_CLASS, label: 'anomalia', anomaly: true })
  }
  return out
}

/** Variante con anomalie: come sensorsDataset, ma anomalyRate vale 0.05 se non indicato */
export function sensorsAnomalyDataset(rng: Rng, opts: SensorsOptions = {}): SensorSample[] {
  return sensorsDataset(rng, { ...opts, anomalyRate: opts.anomalyRate ?? 0.05 })
}
