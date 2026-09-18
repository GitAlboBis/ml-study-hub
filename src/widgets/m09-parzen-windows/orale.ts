// Logica del widget m09-orale-buon-stimatore ("«Is Parzen a good estimator?»: costruisci la catena della
// risposta"), concetti c67, c44, c45, c47, c49. La risposta d'orale (slide p60-61) è una catena di cinque anelli:
// media distorta, non distorsione asintotica, bound sulla varianza, varianza che si annulla, consistenza. Qui la
// catena come stato puro (riduttore testato), le formule con il pezzo mancante, le domande trabocchetto calcolate
// con i limiti delle due condizioni, e i numeri delle mini-simulazioni sulla riflettanza nel vicino infrarosso
// dei pixel di vegetazione (bimodale: sana e in stress idrico).
import { createRng } from '../../lib/rng'
import { convolveGauss, lawLimits, mixPdf, pointGaussMoments, pointStats, sampleMix } from './proprieta/teoria'
import type { Comp } from './proprieta/teoria'

// --- la catena ---

export type TileId = 'media' | 'asintotica' | 'bound' | 'annulla' | 'consistente'
export const ORDER: readonly TileId[] = ['media', 'asintotica', 'bound', 'annulla', 'consistente']
/** L'ordine in cui le tessere arrivano mescolate (fisso: la sfida deve essere la stessa per tutti). */
export const SHUFFLED: readonly TileId[] = ['bound', 'consistente', 'media', 'annulla', 'asintotica']

export type PieceId = 'conv' | 'invh' | 'sup' | 'nhn' | 'legge' | 'somma' | 'inf' | 'invN'

export interface Tile {
  text: string
  /** formula con il segnaposto \square al posto del pezzo mancante */
  tex: string
  piece: PieceId
}

export const TILES: Record<TileId, Tile> = {
  media: {
    text: 'La media è la pdf vera convoluta con il kernel: a h finito la stima è distorta',
    tex: String.raw`E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})\ \square\ \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)`,
    piece: 'conv',
  },
  asintotica: {
    text: 'Con h_N → 0 il kernel tende alla delta di Dirac: asintoticamente non distorta',
    tex: String.raw`\lim_{N\to+\infty}\left\{\square\,\gamma\left(\frac{\mathbf{x}}{h_N}\right)\right\}=\delta(\mathbf{x})`,
    piece: 'invh',
  },
  bound: {
    text: 'La varianza è limitata da sup(γ)·media/(N·h_Nⁿ)',
    tex: String.raw`E\left\{\left(\hat{p}(\mathbf{x})-\bar{\hat{p}}(\mathbf{x})\right)^2\right\}\le\frac{\square\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}`,
    piece: 'sup',
  },
  annulla: {
    text: 'Se N·h_Nⁿ → +∞ la varianza si annulla',
    tex: String.raw`\lim_{N\to+\infty}\square=+\infty\ \Rightarrow\ E\left\{\left(\hat{p}-\bar{\hat{p}}\right)^2\right\}\to 0`,
    piece: 'nhn',
  },
  consistente: {
    text: 'Le due condizioni insieme: stima consistente, per esempio h_N = 1/N^(1/(2n))',
    tex: String.raw`\lim_{N\to+\infty}h_N=0,\ \ \lim_{N\to+\infty}N h_N^n=+\infty,\qquad h_N=\square`,
    piece: 'legge',
  },
}

export const PIECES: Record<PieceId, { label: string; tex: string }> = {
  conv: { label: 'convoluzione ∗', tex: '*' },
  invh: { label: '1/h_Nⁿ', tex: String.raw`\frac{1}{h_N^n}` },
  sup: { label: 'sup γ(·)', tex: String.raw`\sup(\gamma(\cdot))` },
  nhn: { label: 'N·h_Nⁿ', tex: String.raw`N h_N^n` },
  legge: { label: '1/N^(1/(2n))', tex: String.raw`\frac{1}{\sqrt[2n]{N}}` },
  somma: { label: 'somma +', tex: '+' },
  inf: { label: 'inf γ(·)', tex: String.raw`\inf(\gamma(\cdot))` },
  invN: { label: '1/N', tex: String.raw`\frac{1}{N}` },
}
/** La tavolozza, in un ordine che non suggerisce nulla. */
export const PALETTE: readonly PieceId[] = ['nhn', 'somma', 'invh', 'legge', 'inf', 'conv', 'invN', 'sup']

/** La formula della tessera: con il pezzo al suo posto se completa, altrimenti con una casella vuota. */
export const tileTex = (id: TileId, complete: boolean): string => TILES[id].tex.replace('\\square', complete ? PIECES[TILES[id].piece].tex : '\\boxed{\\phantom{xx}}')

export interface ChainState {
  slots: (TileId | null)[]
  pool: TileId[]
  selected: TileId | null
  /** formule completate */
  complete: Partial<Record<TileId, boolean>>
  errors: number
  /** ultima mossa: per il messaggio e il rimbalzo */
  last: { kind: 'placed' | 'wrongSlot' | 'incomplete' | 'pieceOk' | 'pieceWrong' | 'select'; tile: TileId | null; seq: number } | null
}

export const initialChain = (): ChainState => ({ slots: ORDER.map(() => null), pool: [...SHUFFLED], selected: null, complete: {}, errors: 0, last: null })

export type ChainAction = { type: 'select'; tile: TileId } | { type: 'piece'; piece: PieceId } | { type: 'place'; slot: number } | { type: 'reset' }

const seqOf = (s: ChainState) => (s.last?.seq ?? 0) + 1

/**
 * La catena: si sceglie una tessera, si completa la sua formula dalla tavolozza, la si mette nell'anello giusto.
 * Una formula sbagliata o un anello sbagliato contano un errore; la tessera fuori posto torna nel mucchio.
 */
export function chainReducer(s: ChainState, a: ChainAction): ChainState {
  switch (a.type) {
    case 'reset':
      return initialChain()
    case 'select':
      if (!s.pool.includes(a.tile)) return s
      return { ...s, selected: a.tile, last: { kind: 'select', tile: a.tile, seq: seqOf(s) } }
    case 'piece': {
      const t = s.selected
      if (t === null || s.complete[t]) return s
      if (TILES[t].piece === a.piece) return { ...s, complete: { ...s.complete, [t]: true }, last: { kind: 'pieceOk', tile: t, seq: seqOf(s) } }
      return { ...s, errors: s.errors + 1, last: { kind: 'pieceWrong', tile: t, seq: seqOf(s) } }
    }
    case 'place': {
      const t = s.selected
      if (t === null || s.slots[a.slot] !== null) return s
      if (!s.complete[t]) return { ...s, last: { kind: 'incomplete', tile: t, seq: seqOf(s) } }
      if (ORDER[a.slot] !== t) return { ...s, errors: s.errors + 1, selected: null, last: { kind: 'wrongSlot', tile: t, seq: seqOf(s) } }
      const slots = s.slots.map((x, i) => (i === a.slot ? t : x))
      return { ...s, slots, pool: s.pool.filter((x) => x !== t), selected: null, last: { kind: 'placed', tile: t, seq: seqOf(s) } }
    }
  }
}

export const chainDone = (s: ChainState): boolean => s.slots.every((x, i) => x === ORDER[i])

// --- le domande trabocchetto ---

export type Quantity = 'h' | 'nhn'
export interface Trick {
  id: string
  question: string
  /** la legge h_N = h_1·N^(−a) in n dimensioni */
  a: number
  n: number
}
export const TRICKS: readonly Trick[] = [
  { id: 'fisso', question: 'E se tengo h fisso e aumento N?', a: 0, n: 1 },
  { id: 'inverso', question: 'E se in 1-D scelgo h_N = 1/N?', a: 1, n: 1 },
  { id: 'dimensione', question: 'E se la dimensione passa da 1 a 3 con la stessa legge h_N = 1/√N?', a: 0.5, n: 3 },
]

/** L'anello che si spezza (indice da 0) e la quantità che non va più dove deve, dai limiti delle due condizioni. */
export function breaks(t: Trick): { ring: number; quantity: Quantity } {
  const l = lawLimits(t.a, t.n)
  if (l.h !== 'zero') return { ring: ORDER.indexOf('asintotica'), quantity: 'h' }
  return { ring: ORDER.indexOf('annulla'), quantity: 'nhn' }
}

// --- le mini-simulazioni ---

/** Riflettanza NIR dei pixel di vegetazione: sana (0.48) e in stress idrico (0.30), dati sintetici. */
export const NIR: readonly Comp[] = [
  { w: 0.55, mu: 0.48, s: 0.045 },
  { w: 0.45, mu: 0.3, s: 0.05 },
]
export const DOMAIN: readonly [number, number] = [0.1, 0.7]
/** Il punto della valle fra i due modi, dove la media della stima "riempie" di più. */
export const VALLEY = 0.39
export const truth = (x: number): number => mixPdf(x, NIR)
/** E{p̂}(x) con kernel gaussiano di larghezza h: la verità convoluta (anello 1). */
export const meanEstimate = (x: number, h: number): number => mixPdf(x, convolveGauss(NIR, h))

/** h lungo la legge degli anelli 2, 4 e 5: h a N = 20, poi h_N ∝ 1/√N (l'esempio della slide in 1-D). */
export const lawH = (h20: number, N: number): number => h20 * Math.sqrt(20 / N)

/** Varianza vera e bound nel punto x0 (anelli 3 e 4). */
export const varianceAt = (x0: number, h: number, N: number) => pointStats(pointGaussMoments(x0, NIR, h), { N, h, n: 1, kernel: 'gaussiano' })

/** Le stime p̂(x0) di `count` training set indipendenti (anello 3): istogramma e varianza empirica. */
export function resampled(x0: number, h: number, N: number, count: number, seed: number): number[] {
  const rng = createRng(seed)
  const c = 1 / (N * h * Math.sqrt(2 * Math.PI))
  return Array.from({ length: count }, () => {
    let s = 0
    for (const v of sampleMix(rng, N, NIR)) s += Math.exp(-0.5 * ((x0 - v) / h) ** 2)
    return s * c
  })
}

let pool: number[] | null = null
/** 20 000 pixel etichettati, estratti una volta: l'anello 5 usa i primi N. */
export function labelled(): number[] {
  if (pool === null) pool = sampleMix(createRng(4242), 20000, NIR)
  return pool
}

export const CHALLENGE_MS = 3 * 60 * 1000
export const SPEAK_MS = 2 * 60 * 1000
