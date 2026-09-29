// Classificatori del piano delle feature (classifier2d oggi; raster-lab, fit-sweep, m17-m22 e p06-p09 domani):
// soglia su una feature, retta, MDM (minima distanza dalle medie, anche multi-prototipo e con metriche L1, L∞,
// Mahalanobis), Box (parallelepipedo m_ij ± ασ_ij con rifiuto, contese e le due gestioni dei campioni esterni),
// gaussiano/Bayes (Σ piena, diagonale, sferica o condivisa; prior; regola MAP, ML o rischio minimo con i costi),
// K-NN e Parzen per classe, perceptron. Per ogni modello: `predict` (l'etichetta), `decide` (etichetta, classi e
// punteggi "più alto è meglio"), il dettaglio del proprio calcolo per la sonda (distanze, discriminanti g_i,
// posteriori, rischi, appartenenza ai box), la carta delle regioni su griglia e la valutazione su un insieme.
//
// Etichette: le classi sono interi ≥ 0 (come `cls` dei Dots e di BoundaryCanvas del kit); REJECT = −1 (fuori da
// tutti i box, finestra vuota) e CONTESTED = −2 (dentro più box) sono negativi, quindi la carta li lascia vuoti.
// Nessun testo di widget: nomi e colori delle classi stanno nei preset.
import { knnVote } from '../../../../lib/ml/nonparam'
import { clipLineToBox, lineThrough } from '../handleMath'
import type { LabeledPoint } from '../../../../lib/ml/nonparam'
import { covarianceMatrix } from '../../../../lib/ml/stats'
import { labelGrid } from './grid'
import type { LabelGrid } from './grid'
import { prepareGauss } from './gauss'
import type { PreparedGauss } from './gauss'
import { inv2 } from './linalg'
import { perceptronValue } from './perceptron'
import { erf, logSumExp } from './special'
import type { Mat, Mat2, Vec, Vec2 } from './types'

export type { LabeledPoint }

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)

/** Fuori da tutti i box, o nessuna evidenza (finestra di Parzen vuota): non classificato. */
export const REJECT = -1
/** Dentro più box senza una regola per le sovrapposizioni: zona ambigua. */
export const CONTESTED = -2

export type Metric = 'l2' | 'l1' | 'linf' | 'mahalanobis'

// --- modelli ---

export interface ThresholdModel {
  kind: 'threshold'
  /** feature su cui si taglia: 0 = x₁, 1 = x₂ */
  axis: 0 | 1
  t: number
  /** classe per x_axis < t */
  below: number
  /** classe per x_axis ≥ t */
  above: number
}

export interface LineModel {
  kind: 'line'
  /** retta wᵗx + b = 0; wᵗx + b ≥ 0 → positive */
  w: Vec2
  b: number
  positive: number
  negative: number
}

export interface MdmModel {
  kind: 'mdm'
  /** un prototipo per classe (i baricentri) o più d'uno (MDM multi-prototipo) */
  prototypes: readonly { m: Vec2; cls: number }[]
  /** predefinito 'l2' (euclidea, quella del corso) */
  metric?: Metric
  /** covarianza comune per la metrica di Mahalanobis */
  Sigma?: Mat2
}

export interface BoxSpec {
  cls: number
  /** baricentro m_i */
  m: Vec2
  /** deviazioni standard σ_i1, σ_i2 lungo le due feature */
  sd: Vec2
  /** semilato ασ_ij */
  alpha: number
  /** P(ω_i), per la regola 'posterior' nelle sovrapposizioni */
  prior?: number
}

export interface BoxModel {
  kind: 'box'
  boxes: readonly BoxSpec[]
  /** campione fuori da tutti i box: rifiuto (predefinito), box con il bordo più vicino, media più vicina, r_i(x) minimo */
  outside?: 'reject' | 'nearest-box' | 'nearest-mean' | 'normalized'
  /** dentro più box: conteso (predefinito), 1/V_i maggiore, P(ω_i)/V_i maggiore */
  overlap?: 'contested' | 'density' | 'posterior'
}

export interface GaussClass {
  cls: number
  m: Vec2
  S: Mat2
  /** P(ω_i) */
  P: number
}

export interface GaussModel {
  kind: 'gauss'
  classes: readonly GaussClass[]
  /** 'map' (predefinito) argmax P(ω_i)p(x|ω_i); 'ml' argmax p(x|ω_i); 'min-risk' argmin Σ_j λ_ij P(ω_j|x) */
  rule?: 'map' | 'ml' | 'min-risk'
  /** λ_ij = costo di decidere la classe i quando la vera è j (indici nell'ordine di `classes`) */
  loss?: Mat
}

export interface KnnModel {
  kind: 'knn'
  data: readonly LabeledPoint[]
  k: number
}

export interface ParzenModel {
  kind: 'parzen'
  data: readonly LabeledPoint[]
  /** σ del kernel gaussiano sferico, o lato della finestra quadrata */
  h: number
  /** predefinito 'gauss' */
  window?: 'gauss' | 'box'
  /** P(ω_i): 'empirical' N_i/N (predefinito) o valori nell'ordine delle classi crescenti */
  priors?: 'empirical' | readonly number[]
}

export interface PerceptronModel {
  kind: 'perceptron'
  /** a₀ + a₁x₁ + a₂x₂ > 0 → positive */
  a: readonly [number, number, number]
  positive: number
  negative: number
}

export type Model2d = ThresholdModel | LineModel | MdmModel | BoxModel | GaussModel | KnnModel | ParzenModel | PerceptronModel

export interface Decision {
  label: number
  /** classi in ordine crescente */
  classes: number[]
  /** un punteggio per classe, più alto è meglio (−distanza, g_i, voti, P_i p̂_i, densità del box) */
  scores: number[]
}

const argmax = (v: readonly number[]): number => {
  let best = 0
  for (let i = 1; i < v.length; i++) if (v[i] > v[best]) best = i
  return best
}
const argmin = (v: readonly number[]): number => {
  let best = 0
  for (let i = 1; i < v.length; i++) if (v[i] < v[best]) best = i
  return best
}
const uniqueSorted = (xs: readonly number[]): number[] => [...new Set(xs)].sort((a, b) => a - b)

// --- statistiche per classe e addestramento ---

export interface ClassStats2 {
  cls: number
  n: number
  m: Vec2
  /** covarianza stimata (1/N_i predefinito) */
  S: Mat2
  /** σ_i1, σ_i2 = √ della diagonale */
  sd: Vec2
}

/** Media, covarianza e deviazioni standard di ogni classe, in ordine di classe crescente. */
export function classStats(data: readonly LabeledPoint[], normalization: '1/N' | '1/(N-1)' = '1/N'): ClassStats2[] {
  return uniqueSorted(data.map((d) => d.y)).map((cls) => {
    const pts = data.filter((d) => d.y === cls).map((d) => d.x)
    const n = pts.length
    const m: Vec2 = [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n]
    const C = covarianceMatrix(pts, normalization === '1/(N-1)')
    const S: Mat2 = [
      [C[0][0], C[0][1]],
      [C[1][0], C[1][1]],
    ]
    return { cls, n, m, S, sd: [Math.sqrt(S[0][0]), Math.sqrt(S[1][1])] }
  })
}

/** MDM addestrato: il baricentro di ogni classe come prototipo. */
export function trainMdm(data: readonly LabeledPoint[], metric: Metric = 'l2'): MdmModel {
  return { kind: 'mdm', prototypes: classStats(data).map((s) => ({ m: s.m, cls: s.cls })), metric }
}

/** Box addestrato: centro m_i, lati 2ασ_ij (σ con 1/N_i come nel corso), prior N_i/N. */
export function trainBox(
  data: readonly LabeledPoint[],
  alpha: number,
  options: { normalization?: '1/N' | '1/(N-1)'; outside?: BoxModel['outside']; overlap?: BoxModel['overlap'] } = {},
): BoxModel {
  if (!(alpha > 0)) throw err('trainBox', `α deve essere > 0 (ricevuto ${alpha})`)
  const N = data.length
  const boxes = classStats(data, options.normalization).map((s) => ({ cls: s.cls, m: s.m, sd: s.sd, alpha, prior: s.n / N }))
  return { kind: 'box', boxes, outside: options.outside, overlap: options.overlap }
}

/** P(x ∈ B_i | ω_i) per classi gaussiane a feature indipendenti: [erf(α/√2)]ⁿ. */
export const boxCoverage = (alpha: number, n = 2): number => erf(alpha / Math.SQRT2) ** n

/**
 * Gaussiano addestrato. `covariance`: 'full' Σ_i di ogni classe, 'diagonal' solo le varianze, 'spherical' σ_i²I con
 * σ_i² = tr(Σ_i)/2, 'shared' la Σ comune Σ_i (N_i/N) Σ_i. `priors`: 'empirical' N_i/N, 'equal', o valori dati.
 */
export function trainGauss(
  data: readonly LabeledPoint[],
  options: {
    covariance?: 'full' | 'diagonal' | 'spherical' | 'shared'
    priors?: 'empirical' | 'equal' | readonly number[]
    normalization?: '1/N' | '1/(N-1)'
    rule?: GaussModel['rule']
    loss?: Mat
  } = {},
): GaussModel {
  const st = classStats(data, options.normalization)
  const N = data.length
  const C = st.length
  const cov = options.covariance ?? 'full'
  let pooled: Mat2 | null = null
  if (cov === 'shared') {
    const a = st.reduce((s, c) => s + (c.n / N) * c.S[0][0], 0)
    const b = st.reduce((s, c) => s + (c.n / N) * c.S[0][1], 0)
    const d = st.reduce((s, c) => s + (c.n / N) * c.S[1][1], 0)
    pooled = [
      [a, b],
      [b, d],
    ]
  }
  const classes = st.map((c, i): GaussClass => {
    let S: Mat2 = c.S
    if (pooled) S = pooled
    else if (cov === 'diagonal') S = [[c.S[0][0], 0], [0, c.S[1][1]]]
    else if (cov === 'spherical') {
      const v = (c.S[0][0] + c.S[1][1]) / 2
      S = [[v, 0], [0, v]]
    }
    const pr = options.priors ?? 'empirical'
    const P = pr === 'empirical' ? c.n / N : pr === 'equal' ? 1 / C : pr[i]
    return { cls: c.cls, m: c.m, S, P }
  })
  return { kind: 'gauss', classes, rule: options.rule, loss: options.loss }
}

/** λ_ij da un costo per classe vera: sbagliare un campione di ω_j costa costs[j] (0 sulla diagonale). */
export const lossFromCosts = (costs: readonly number[]): number[][] => costs.map((_, i) => costs.map((c, j) => (i === j ? 0 : c)))

// --- dettagli per modello ---

/** Distanza nella metrica dell'MDM (Mahalanobis con la Σ⁻¹ data). */
function metricDistance(x: Vec, m: Vec, metric: Metric, Sinv: Mat | null): number {
  const d0 = x[0] - m[0]
  const d1 = x[1] - m[1]
  switch (metric) {
    case 'l1': return Math.abs(d0) + Math.abs(d1)
    case 'linf': return Math.max(Math.abs(d0), Math.abs(d1))
    case 'mahalanobis': {
      if (!Sinv) throw err('mdm', 'la metrica di Mahalanobis richiede una Σ invertibile')
      return Math.sqrt(Sinv[0][0] * d0 * d0 + (Sinv[0][1] + Sinv[1][0]) * d0 * d1 + Sinv[1][1] * d1 * d1)
    }
    default: return Math.hypot(d0, d1)
  }
}

export interface MdmDetail {
  label: number
  /** d(x, m) per ogni prototipo, nell'ordine dei prototipi */
  distances: number[]
  /** g(x) = mᵗx − ½ mᵗm per ogni prototipo (discriminante lineare della metrica euclidea) */
  g: number[]
  /** indice del prototipo vincente */
  nearest: number
}

/** MDM: la classe del prototipo più vicino (a parità, il primo prototipo). */
export function mdmDecide(model: MdmModel, x: Vec2): MdmDetail {
  if (model.prototypes.length === 0) throw err('mdmDecide', 'nessun prototipo')
  const metric = model.metric ?? 'l2'
  const Sinv = metric === 'mahalanobis' && model.Sigma ? inv2(model.Sigma) : null
  const distances = model.prototypes.map((p) => metricDistance(x, p.m, metric, Sinv))
  const g = model.prototypes.map((p) => p.m[0] * x[0] + p.m[1] * x[1] - 0.5 * (p.m[0] ** 2 + p.m[1] ** 2))
  const nearest = argmin(distances)
  return { label: model.prototypes[nearest].cls, distances, g, nearest }
}

export interface BoxDetail {
  label: number
  /** x ∈ B_i per ogni box, nell'ordine dei box */
  inside: boolean[]
  /** d(x, B_i) = √Σ max(0, |x_j − m_ij| − ασ_ij)² */
  distances: number[]
  /** r_i(x) = Σ ((x_j − m_ij)/σ_ij)² */
  r: number[]
  /** V_i = Π 2ασ_ij */
  volumes: number[]
  rejected: boolean
  contested: boolean
}

/** Distanza euclidea dal punto al box (0 dentro). */
export function boxDistance(x: Vec2, b: BoxSpec): number {
  const e0 = Math.max(0, Math.abs(x[0] - b.m[0]) - b.alpha * b.sd[0])
  const e1 = Math.max(0, Math.abs(x[1] - b.m[1]) - b.alpha * b.sd[1])
  return Math.hypot(e0, e1)
}

/** Box: appartenenza, rifiuto, contese e le regole scelte per sovrapposizioni ed esterni. */
export function boxDecide(model: BoxModel, x: Vec2): BoxDetail {
  const bs = model.boxes
  if (bs.length === 0) throw err('boxDecide', 'nessun box')
  const inside = bs.map((b) => Math.abs(x[0] - b.m[0]) <= b.alpha * b.sd[0] && Math.abs(x[1] - b.m[1]) <= b.alpha * b.sd[1])
  const distances = bs.map((b) => boxDistance(x, b))
  const r = bs.map((b) => ((x[0] - b.m[0]) / b.sd[0]) ** 2 + ((x[1] - b.m[1]) / b.sd[1]) ** 2)
  const volumes = bs.map((b) => 4 * b.alpha * b.alpha * b.sd[0] * b.sd[1])
  const ins = inside.flatMap((v, i) => (v ? [i] : []))
  let label: number
  let rejected = false
  let contested = false
  if (ins.length === 1) label = bs[ins[0]].cls
  else if (ins.length > 1) {
    const rule = model.overlap ?? 'contested'
    contested = rule === 'contested'
    if (contested) label = CONTESTED
    else {
      const score = ins.map((i) => (rule === 'posterior' ? (bs[i].prior ?? 1) : 1) / volumes[i])
      label = bs[ins[argmax(score)]].cls
    }
  } else {
    const rule = model.outside ?? 'reject'
    if (rule === 'reject') {
      rejected = true
      label = REJECT
    } else if (rule === 'nearest-box') label = bs[argmin(distances)].cls
    else if (rule === 'nearest-mean') label = bs[argmin(bs.map((b) => Math.hypot(x[0] - b.m[0], x[1] - b.m[1])))].cls
    else label = bs[argmin(r)].cls
  }
  return { label, inside, distances, r, volumes, rejected, contested }
}

export interface GaussDetail {
  label: number
  /** g_i(x) = ln P(ω_i) + ln p(x|ω_i) (senza ln P con la regola 'ml'), nell'ordine delle classi */
  g: number[]
  /** P(ω_i|x) */
  posteriors: number[]
  /** R(α_i|x) = Σ_j λ_ij P(ω_j|x), solo con la regola 'min-risk' */
  risks?: number[]
  /** (x − m_i)ᵗΣ_i⁻¹(x − m_i) */
  mahalanobis2: number[]
}

const gaussCache = new WeakMap<GaussModel, PreparedGauss[]>()
const prepared = (model: GaussModel): PreparedGauss[] => {
  let p = gaussCache.get(model)
  if (!p) {
    p = model.classes.map((c) => prepareGauss({ m: c.m, S: c.S }))
    gaussCache.set(model, p)
  }
  return p
}

/** Gaussiano/Bayes con discriminanti, posteriori e (con i costi) rischi. */
export function gaussDecide(model: GaussModel, x: Vec2): GaussDetail {
  const cs = model.classes
  if (cs.length === 0) throw err('gaussDecide', 'nessuna classe')
  const pg = prepared(model)
  const rule = model.rule ?? 'map'
  const mahalanobis2 = pg.map((p) => p.mahal2(x))
  const logp = pg.map((p) => p.logPdf(x))
  const joint = logp.map((l, i) => l + Math.log(cs[i].P))
  const Z = logSumExp(joint)
  const posteriors = joint.map((j) => Math.exp(j - Z))
  const g = rule === 'ml' ? logp : joint
  if (rule === 'min-risk') {
    const L = model.loss
    if (!L || L.length !== cs.length) throw err('gaussDecide', 'la regola del rischio minimo richiede la matrice λ C × C')
    const risks = L.map((row) => row.reduce((s, l, j) => s + l * posteriors[j], 0))
    return { label: cs[argmin(risks)].cls, g, posteriors, risks, mahalanobis2 }
  }
  return { label: cs[argmax(g)].cls, g, posteriors, mahalanobis2 }
}

export interface ParzenDetail {
  label: number
  classes: number[]
  /** p̂_i(x) di ogni classe */
  densities: number[]
  /** P(ω_i) p̂_i(x) */
  weighted: number[]
  posteriors: number[]
}

/** Parzen per classe: argmax P(ω_i) p̂_i(x); nessuna evidenza (tutti zero) → REJECT. */
export function parzenDecide(model: ParzenModel, x: Vec2): ParzenDetail {
  if (!(model.h > 0)) throw err('parzenDecide', `h deve essere > 0 (ricevuto ${model.h})`)
  const classes = uniqueSorted(model.data.map((d) => d.y))
  const N = model.data.length
  const sums = new Array<number>(classes.length).fill(0)
  const counts = new Array<number>(classes.length).fill(0)
  const h = model.h
  const box = model.window === 'box'
  const inv = 1 / (2 * h * h)
  for (const d of model.data) {
    const c = classes.indexOf(d.y)
    counts[c]++
    const dx = x[0] - d.x[0]
    const dy = x[1] - d.x[1]
    if (box) {
      if (Math.abs(dx) <= h / 2 && Math.abs(dy) <= h / 2) sums[c] += 1
    } else sums[c] += Math.exp(-(dx * dx + dy * dy) * inv)
  }
  const norm = box ? h * h : 2 * Math.PI * h * h
  const densities = sums.map((s, i) => (counts[i] === 0 ? 0 : s / counts[i] / norm))
  const pr = model.priors ?? 'empirical'
  const P = pr === 'empirical' ? counts.map((c) => c / N) : classes.map((_, i) => pr[i])
  const weighted = densities.map((p, i) => P[i] * p)
  const tot = weighted.reduce((s, v) => s + v, 0)
  const posteriors = weighted.map((w) => (tot > 0 ? w / tot : 0))
  const label = tot > 0 ? classes[argmax(weighted)] : REJECT
  return { label, classes, densities, weighted, posteriors }
}

// --- interfaccia comune ---

/** Etichetta, classi e punteggi del modello in x. */
export function decide(model: Model2d, x: Vec2): Decision {
  switch (model.kind) {
    case 'threshold': {
      const v = x[model.axis] - model.t
      const classes = uniqueSorted([model.below, model.above])
      const label = v >= 0 ? model.above : model.below
      return { label, classes, scores: classes.map((c) => (c === model.above ? v : -v)) }
    }
    case 'line':
    case 'perceptron': {
      const v = model.kind === 'line' ? model.w[0] * x[0] + model.w[1] * x[1] + model.b : perceptronValue(model.a, x)
      const label = model.kind === 'line' ? (v >= 0 ? model.positive : model.negative) : v > 0 ? model.positive : model.negative
      const classes = uniqueSorted([model.positive, model.negative])
      return { label, classes, scores: classes.map((c) => (c === model.positive ? v : -v)) }
    }
    case 'mdm': {
      const d = mdmDecide(model, x)
      const classes = uniqueSorted(model.prototypes.map((p) => p.cls))
      const scores = classes.map((c) => -Math.min(...d.distances.filter((_, i) => model.prototypes[i].cls === c)))
      return { label: d.label, classes, scores }
    }
    case 'box': {
      const d = boxDecide(model, x)
      const classes = uniqueSorted(model.boxes.map((b) => b.cls))
      const scores = classes.map((c) => {
        const i = model.boxes.findIndex((b) => b.cls === c)
        return d.inside[i] ? 1 / d.volumes[i] : -d.distances[i]
      })
      return { label: d.label, classes, scores }
    }
    case 'gauss': {
      const d = gaussDecide(model, x)
      const order = model.classes.map((c, i) => ({ c: c.cls, i })).sort((a, b) => a.c - b.c)
      const scores = order.map((o) => (d.risks ? -d.risks[o.i] : d.g[o.i]))
      return { label: d.label, classes: order.map((o) => o.c), scores }
    }
    case 'knn': {
      const v = knnVote(x, model.data, model.k)
      const classes = uniqueSorted(model.data.map((d) => d.y))
      return { label: v.label, classes, scores: classes.map((c) => v.votes.find((q) => q.label === c)?.count ?? 0) }
    }
    case 'parzen': {
      const d = parzenDecide(model, x)
      return { label: d.label, classes: d.classes, scores: d.weighted }
    }
    default:
      throw err('decide', `modello sconosciuto: ${String((model satisfies never as { kind: string }).kind)}`)
  }
}

/** L'etichetta del modello in x (REJECT e CONTESTED negativi). */
export function predict(model: Model2d, x: Vec2): number {
  switch (model.kind) {
    case 'mdm': return mdmDecide(model, x).label
    case 'box': return boxDecide(model, x).label
    case 'gauss': return gaussDecide(model, x).label
    case 'knn': return knnVote(x, model.data, model.k).label
    case 'parzen': return parzenDecide(model, x).label
    default: return decide(model, x).label
  }
}

/**
 * Il modello come funzione (x, y) → classe, stabile per lo stesso modello: da passare a BoundaryCanvas (con
 * useMemo sul modello) o a `labelGrid`. Il gaussiano precalcola inverse e determinanti una volta.
 */
export function classifier(model: Model2d): (x: number, y: number) => number {
  if (model.kind === 'gauss') prepared(model)
  const p: [number, number] = [0, 0]
  return (x, y) => {
    p[0] = x
    p[1] = y
    return predict(model, p)
  }
}

/** Carta delle regioni sui centri delle celle (convenzione di BoundaryCanvas): aree, rifiuti, contese. */
export function regionMap(model: Model2d, xDomain: readonly [number, number], yDomain: readonly [number, number], cols: number, rows: number): LabelGrid {
  return labelGrid(classifier(model), xDomain, yDomain, cols, rows)
}

export interface Evaluation {
  n: number
  /** campioni classificati in una classe sbagliata (rifiuti e contese esclusi) */
  errors: number
  /** indici dei campioni sbagliati */
  wrong: number[]
  /** campioni rifiutati o contesi */
  rejected: number
  rejectedIdx: number[]
  /** errors / n */
  rate: number
  /** classi delle righe e colonne della matrice di confusione */
  classes: number[]
  /** confusion[vera][decisa], rifiuti esclusi */
  confusion: number[][]
}

/** Errori, rifiuti e matrice di confusione del modello su un insieme etichettato. */
export function evaluate(model: Model2d, data: readonly LabeledPoint[]): Evaluation {
  const preds = data.map((d) => predict(model, [d.x[0], d.x[1]]))
  const classes = uniqueSorted([...data.map((d) => d.y), ...preds.filter((p) => p >= 0)])
  const confusion = classes.map(() => new Array<number>(classes.length).fill(0))
  const wrong: number[] = []
  const rejectedIdx: number[] = []
  preds.forEach((p, i) => {
    if (p < 0) {
      rejectedIdx.push(i)
      return
    }
    confusion[classes.indexOf(data[i].y)][classes.indexOf(p)]++
    if (p !== data[i].y) wrong.push(i)
  })
  const n = data.length
  return { n, errors: wrong.length, wrong, rejected: rejectedIdx.length, rejectedIdx, rate: n === 0 ? 0 : wrong.length / n, classes, confusion }
}

// --- geometria delle frontiere ---

/** Asse del segmento m_i m_j (frontiera MDM): wᵗ(x − x₀) = 0 con w = m_i − m_j, x₀ = ½(m_i + m_j). */
export function bisector(mi: Vec2, mj: Vec2): { w: Vec2; x0: Vec2 } {
  return { w: [mi[0] - mj[0], mi[1] - mj[1]], x0: [(mi[0] + mj[0]) / 2, (mi[1] + mj[1]) / 2] }
}

/**
 * Frontiera lineare del Bayes gaussiano con Σ comune fra due classi: wᵗ(x − x₀) = 0 con w = Σ⁻¹(m_i − m_j) e
 * x₀ = ½(m_i + m_j) − ln(P_i/P_j) (m_i − m_j) / ((m_i − m_j)ᵗΣ⁻¹(m_i − m_j)); con Σ = σ²I è la formula di m16 c42.
 * Restituisce anche b = −wᵗx₀ (la retta wᵗx + b = 0, positiva dalla parte di ω_i). null se Σ è singolare.
 */
export function linearBoundary(mi: Vec2, mj: Vec2, S: Mat, Pi = 0.5, Pj = 0.5): { w: Vec2; x0: Vec2; b: number } | null {
  const Si = inv2(S)
  if (Si === null) return null
  const d: Vec2 = [mi[0] - mj[0], mi[1] - mj[1]]
  const w: Vec2 = [Si[0][0] * d[0] + Si[0][1] * d[1], Si[1][0] * d[0] + Si[1][1] * d[1]]
  const q = d[0] * w[0] + d[1] * w[1]
  const k = q > 0 ? Math.log(Pi / Pj) / q : 0
  const x0: Vec2 = [(mi[0] + mj[0]) / 2 - k * d[0], (mi[1] + mj[1]) / 2 - k * d[1]]
  return { w, x0, b: -(w[0] * x0[0] + w[1] * x0[1]) }
}

/** Circocentro (punto triplo equidistante da tre prototipi); null se i tre punti sono allineati. */
export function circumcenter(a: Vec2, b: Vec2, c: Vec2): Vec2 | null {
  const D = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
  if (Math.abs(D) < 1e-12 * Math.max(1, Math.abs(a[0]) + Math.abs(b[0]) + Math.abs(c[0])) ** 2) return null
  const a2 = a[0] ** 2 + a[1] ** 2
  const b2 = b[0] ** 2 + b[1] ** 2
  const c2 = c[0] ** 2 + c[1] ** 2
  return [(a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / D, (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / D]
}

/**
 * Retta per due punti (le due maniglie di LineHandles) come wᵗx + b = 0, con ‖w‖ = 1 e il lato positivo a sinistra
 * del verso p → q. È lineThrough di handleMath senza l'angolo: stessa convenzione, stessa soglia (due punti a meno di
 * 1e−12 coincidono), ma qui i punti coincidenti sono un RangeError.
 */
export function lineFromPoints(p: Vec2, q: Vec2): { w: Vec2; b: number } {
  const l = lineThrough(p, q)
  if (l === null) throw err('lineFromPoints', 'i due punti coincidono')
  return { w: l.w, b: l.b }
}

/**
 * Il tratto della retta wᵗx + b = 0 dentro il rettangolo (per disegnarla), nel verso che lascia w a sinistra; null se
 * non lo attraversa (o lo tocca in un solo spigolo) e se w = 0. w può non essere unitario (i pesi di un perceptron).
 * Passa per clipLineToBox di handleMath: il punto della retta più vicino all'origine e la direzione (w₂, −w₁).
 */
export function clipLine(w: Vec2, b: number, xDomain: readonly [number, number], yDomain: readonly [number, number]): [Vec2, Vec2] | null {
  const n2 = w[0] * w[0] + w[1] * w[1]
  if (!(n2 > 0) || !Number.isFinite(n2) || !Number.isFinite(b)) return null
  const n = Math.sqrt(n2)
  const p0: Vec2 = [(-b * w[0]) / n2, (-b * w[1]) / n2]
  return clipLineToBox(p0, [p0[0] + w[1] / n, p0[1] - w[0] / n], xDomain, yDomain)
}
