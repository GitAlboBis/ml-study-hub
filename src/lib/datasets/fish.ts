// Scenario "pesce" del cast: l'impianto di confezionamento che separa salmoni e spigole
// (Melgani, Cap. 1, slide 14-20, "Automatic Fish-Packing Plant"). Una telecamera misura di ogni pesce
// luminosità, larghezza e lunghezza. I numeri ricalcano le slide: istogrammi della luminosità con i
// salmoni attorno a 3 e le spigole attorno a 7 (slide 17), piano luminosità/larghezza con larghezze tra
// 14 e 22 (slide 19), lunghezza quasi inutile per separare le classi (slide 16).
//
// Il modello che genera i dati è noto e si può interrogare: fishTruth dà medie e covarianze vere,
// fishDensity la densità vera di classe. I widget li usano per confrontare stima e verità.
import type { Rng } from '../../content/types'
import type { DatasetMeta, Density, Sample } from './types'

export const FISH_FEATURES = ['luminosita', 'larghezza', 'lunghezza'] as const
export type FishFeature = (typeof FISH_FEATURES)[number]
export const FISH_CLASSES = ['salmone', 'spigola'] as const
export type FishLabel = (typeof FISH_CLASSES)[number]
/** x segue l'ordine di opts.features; y = 0 salmone, 1 spigola */
export type FishSample = Sample<FishLabel, 0 | 1>

export interface FishOptions {
  /** numero di pesci (default 100) */
  n?: number
  /** colonne di x, nell'ordine voluto (default tutte e tre). I pesci estratti non dipendono da questa scelta */
  features?: readonly FishFeature[]
  /** quota di salmoni, cioè la prior P(salmone): i salmoni sono round(n * pSalmone) (default 0.5) */
  pSalmone?: number
}

/** Parametri veri di una classe sulle feature scelte: media e matrice di covarianza */
export interface FishClassTruth { mean: number[]; cov: number[][] }

export const fishMeta: DatasetMeta<FishFeature, FishLabel> = {
  scenario: 'pesce',
  featureNames: FISH_FEATURES,
  featureLabels: {
    luminosita: { it: 'luminosità', en: 'lightness' },
    larghezza: { it: 'larghezza', en: 'width' },
    lunghezza: { it: 'lunghezza', en: 'length' },
  },
  units: { luminosita: 'scala 0-10', larghezza: 'cm', lunghezza: 'cm' },
  ranges: { luminosita: [0, 10], larghezza: [8, 29], lunghezza: [30, 110] },
  classNames: FISH_CLASSES,
  classLabels: { salmone: { it: 'salmone', en: 'salmon' }, spigola: { it: 'spigola', en: 'sea bass' } },
  description:
    'Dati sintetici ispirati all\'impianto di confezionamento del pesce del Cap. 1 di Melgani (Automatic Fish-Packing Plant): '
    + 'una telecamera misura luminosità, larghezza e lunghezza di ogni pesce sul nastro per separare i salmoni dalle spigole. '
    + 'La spigola è in media più chiara, più larga e più lunga; la luminosità separa bene ma non del tutto, la lunghezza quasi per nulla.',
  synthetic: true,
}

// ---------------------------------------------------------------------------------------------
// Modello generativo
// ---------------------------------------------------------------------------------------------

interface Gauss { mu: number; sd: number }
interface ClassModel {
  /** luminosità: gaussiana troncata alla scala [0, 10], indipendente dalla taglia */
  lum: Gauss
  /** larghezza e lunghezza in cm: gaussiana bivariata, un pesce più lungo è anche più largo */
  larg: Gauss
  lung: Gauss
  rho: number
}

const MODEL: Record<FishLabel, ClassModel> = {
  salmone: { lum: { mu: 3.3, sd: 1.3 }, larg: { mu: 17, sd: 2.2 }, lung: { mu: 66, sd: 8 }, rho: 0.6 },
  spigola: { lum: { mu: 7.1, sd: 1.2 }, larg: { mu: 19.5, sd: 2.2 }, lung: { mu: 74, sd: 8 }, rho: 0.6 },
}

const [LUM_MIN, LUM_MAX] = fishMeta.ranges.luminosita

const normalPdf = (x: number, mu: number, sd: number) =>
  Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI))

/**
 * Massa, media e varianza della gaussiana ristretta a [a, b], con la regola di Simpson.
 * Il troncamento toglie meno dell'1% della massa ma sposta la media di qualche centesimo: la verità
 * dichiarata deve essere quella della densità da cui i campioni escono davvero, non quella nominale.
 */
function truncatedMoments({ mu, sd }: Gauss, a: number, b: number) {
  const steps = 4000
  const h = (b - a) / steps
  let z = 0, m1 = 0, m2 = 0
  for (let i = 0; i <= steps; i++) {
    const x = a + i * h
    const w = (i === 0 || i === steps ? 1 : i % 2 === 1 ? 4 : 2) * normalPdf(x, mu, sd)
    z += w
    m1 += w * x
    m2 += w * x * x
  }
  const mean = m1 / z
  return { mass: (z * h) / 3, mean, variance: m2 / z - mean * mean }
}

const LUM_TRUTH: Record<FishLabel, { mass: number; mean: number; variance: number }> = {
  salmone: truncatedMoments(MODEL.salmone.lum, LUM_MIN, LUM_MAX),
  spigola: truncatedMoments(MODEL.spigola.lum, LUM_MIN, LUM_MAX),
}

function checkFeatures(where: string, features: readonly FishFeature[]): readonly FishFeature[] {
  if (features.length === 0) throw new RangeError(`${where}: serve almeno una feature`)
  for (const f of features) {
    if (!FISH_FEATURES.includes(f)) throw new RangeError(`${where}: feature sconosciuta "${f}" (valide: ${FISH_FEATURES.join(', ')})`)
  }
  if (new Set(features).size !== features.length) throw new RangeError(`${where}: feature ripetuta in [${features.join(', ')}]`)
  return features
}

function checkLabel(where: string, label: FishLabel): ClassModel {
  const m = MODEL[label]
  if (!m) throw new RangeError(`${where}: classe sconosciuta "${label}" (valide: ${FISH_CLASSES.join(', ')})`)
  return m
}

// ---------------------------------------------------------------------------------------------
// Verità del modello
// ---------------------------------------------------------------------------------------------

/**
 * Media e covarianza vere di ogni classe, ristrette alle feature richieste e nel loro ordine.
 * Per la luminosità sono i momenti esatti della gaussiana troncata a [0, 10].
 */
export function fishTruth(features: readonly FishFeature[] = FISH_FEATURES): Record<FishLabel, FishClassTruth> {
  const cols = checkFeatures('fishTruth', features).map((f) => FISH_FEATURES.indexOf(f))
  const one = (label: FishLabel): FishClassTruth => {
    const m = MODEL[label]
    const mean = [LUM_TRUTH[label].mean, m.larg.mu, m.lung.mu]
    const c = m.rho * m.larg.sd * m.lung.sd
    const cov = [
      [LUM_TRUTH[label].variance, 0, 0],
      [0, m.larg.sd ** 2, c],
      [0, c, m.lung.sd ** 2],
    ]
    return { mean: cols.map((i) => mean[i]), cov: cols.map((i) => cols.map((j) => cov[i][j])) }
  }
  return { salmone: one('salmone'), spigola: one('spigola') }
}

/**
 * Densità vera di classe p(x | classe) sulle feature richieste, nello stesso ordine di x nei campioni.
 * Fuori dalla scala 0-10 della luminosità vale 0. Per il classificatore bayesiano la si pesa con la prior.
 */
export function fishDensity(label: FishLabel, features: readonly FishFeature[] = FISH_FEATURES): Density {
  const cols = checkFeatures('fishDensity', features)
  const m = checkLabel('fishDensity', label)
  const iLum = cols.indexOf('luminosita'), iLarg = cols.indexOf('larghezza'), iLung = cols.indexOf('lunghezza')
  const lumMass = LUM_TRUTH[label].mass
  const q = 1 - m.rho ** 2
  const binormalScale = 1 / (2 * Math.PI * m.larg.sd * m.lung.sd * Math.sqrt(q))
  const d = cols.length
  return (x) => {
    if (x.length !== d) throw new RangeError(`fishDensity: x ha ${x.length} valori, le feature sono ${d}`)
    let p = 1
    if (iLum >= 0) {
      const v = x[iLum]
      if (v < LUM_MIN || v > LUM_MAX) return 0
      p *= normalPdf(v, m.lum.mu, m.lum.sd) / lumMass
    }
    if (iLarg >= 0 && iLung >= 0) {
      const a = (x[iLarg] - m.larg.mu) / m.larg.sd, b = (x[iLung] - m.lung.mu) / m.lung.sd
      p *= binormalScale * Math.exp(-(a * a - 2 * m.rho * a * b + b * b) / (2 * q))
    } else if (iLarg >= 0) p *= normalPdf(x[iLarg], m.larg.mu, m.larg.sd)
    else if (iLung >= 0) p *= normalPdf(x[iLung], m.lung.mu, m.lung.sd)
    return p
  }
}

// ---------------------------------------------------------------------------------------------
// Generatore
// ---------------------------------------------------------------------------------------------

function drawFish(rng: Rng, label: FishLabel): [number, number, number] {
  const m = MODEL[label]
  // campionamento a rigetto: una lettura fuori scala si ripete (succede meno di una volta su cento)
  let lum = rng.normal(m.lum.mu, m.lum.sd)
  while (lum < LUM_MIN || lum > LUM_MAX) lum = rng.normal(m.lum.mu, m.lum.sd)
  const z1 = rng.normal(), z2 = rng.normal()
  const larg = m.larg.mu + m.larg.sd * z1
  const lung = m.lung.mu + m.lung.sd * (m.rho * z1 + Math.sqrt(1 - m.rho ** 2) * z2)
  return [lum, larg, lung]
}

/**
 * Pesci sul nastro: round(n * pSalmone) salmoni e il resto spigole, in ordine casuale.
 * Stesso seed, stessi pesci: `features` sceglie solo le colonne di x. I valori non sono arrotondati
 * (niente pari merito nelle distanze di K-NN): la precisione di lettura la decide chi li mostra.
 */
export function fishDataset(rng: Rng, opts: FishOptions = {}): FishSample[] {
  const { n = 100, pSalmone = 0.5 } = opts
  const cols = checkFeatures('fishDataset', opts.features ?? FISH_FEATURES).map((f) => FISH_FEATURES.indexOf(f))
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`fishDataset: n deve essere un intero >= 0 (ricevuto ${n})`)
  if (!(pSalmone >= 0 && pSalmone <= 1)) throw new RangeError(`fishDataset: pSalmone deve stare in [0, 1] (ricevuto ${pSalmone})`)
  const nSalmone = Math.round(n * pSalmone)
  const fish: { full: [number, number, number]; y: 0 | 1 }[] = []
  for (let i = 0; i < n; i++) {
    const y = i < nSalmone ? 0 : 1
    fish.push({ full: drawFish(rng, FISH_CLASSES[y]), y })
  }
  return rng.shuffle(fish).map(({ full, y }) => ({ x: cols.map((j) => full[j]), y, label: FISH_CLASSES[y] }))
}
