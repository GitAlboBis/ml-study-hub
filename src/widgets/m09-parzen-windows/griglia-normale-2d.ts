// Logica del widget m09-griglia-normale-2d ("La griglia 2-D e il giallo della legge h_N"), concetto c56.
// La slide p64 (da Duda-Hart) stima una normale standard 2-D con N = 1, 10, 100, ∞ e h_1 = 1, 0.5, 0.1, ma
// etichetta le colonne h_N = h_1/N, senza radice, a differenza delle figure 1-D. In 2-D quella legge dà
// N·h_N² = h_1²/N → 0 e viola la seconda condizione di consistenza; h_1/√N (la lettura probabile, come in
// Duda-Hart) dà N·h_N² = h_1² costante; solo h_1/N^(1/4) = h_1/N^(1/(2n)) dà N·h_N² = h_1²·√N → +∞.
import { createRng } from '../../lib/rng'
import { normalPdf } from '../../lib/ml/stats'
import { lawLimits } from './proprieta/teoria'
import type { Limit } from './proprieta/teoria'
import { parzenGrid, sampleGrid } from './proprieta/surface'

export type LawId = 'slide' | 'radice' | 'quarta'
export const LAW_IDS: readonly LawId[] = ['slide', 'radice', 'quarta']
export const LAWS: Record<LawId, { label: string; tex: string; a: number }> = {
  slide: { label: 'h₁/N (slide)', tex: String.raw`h_N=\frac{h_1}{N}`, a: 1 },
  radice: { label: 'h₁/√N (Duda-Hart)', tex: String.raw`h_N=\frac{h_1}{\sqrt{N}}`, a: 0.5 },
  quarta: { label: 'h₁/N^(1/(2n))', tex: String.raw`h_N=\frac{h_1}{\sqrt[2n]{N}}=\frac{h_1}{\sqrt[4]{N}}`, a: 0.25 },
}

export const DIM = 2
export const DOMAIN: readonly [number, number] = [-2, 2]
export const ROWS = [1, 10, 100, Number.POSITIVE_INFINITY] as const
export const H1S = [1, 0.5, 0.1] as const
export const GRID_N = 41
export const POOL = 100
export const CELL_MS = 350
export const Z_MAX = 0.25
/** Sotto questa larghezza la griglia (passo 0.1) non vede più i picchi: la stima si disegna ad aghi. */
export const SPIKE_H = 0.075

export const hOf = (law: LawId, h1: number, N: number): number => (Number.isFinite(N) ? h1 * N ** -LAWS[law].a : 0)
export const nh2 = (law: LawId, h1: number, N: number): number => N * hOf(law, h1, N) ** 2

/** Le due condizioni della slide p61 per la legge, in n = 2. */
export const lawVerdict = (law: LawId): { h: Limit; nhn: Limit; consistent: boolean } => lawLimits(LAWS[law].a, DIM)

/** I 100 campioni della normale standard 2-D, a seme; la cella con N usa i primi N. */
export function samples2d(seed: number): number[][] {
  const rng = createRng(seed * 7717 + 5)
  return Array.from({ length: POOL }, () => [rng.normal(), rng.normal()])
}

export const truth2d = (x: number, y: number): number => normalPdf(x) * normalPdf(y)

let truthCache: Float64Array | null = null
export function truthGrid(): Float64Array {
  if (truthCache === null) truthCache = sampleGrid(truth2d, DOMAIN, GRID_N)
  return truthCache
}

export interface Cell {
  z: Float64Array
  h: number
  /** la stima è ad aghi: z è la base piatta, gli aghi sono i primi N campioni */
  spikes: boolean
  peak: number
}

/** La cella (riga N, colonna h_1) con la legge data. */
export function cellFor(law: LawId, h1: number, N: number, pts: readonly (readonly number[])[]): Cell {
  if (!Number.isFinite(N)) return { z: truthGrid(), h: 0, spikes: false, peak: 0 }
  const h = hOf(law, h1, N)
  const peak = 1 / (N * 2 * Math.PI * h * h)
  if (h < SPIKE_H) return { z: new Float64Array(GRID_N * GRID_N), h, spikes: true, peak }
  return { z: parzenGrid(pts.slice(0, N), h, DOMAIN, GRID_N), h, spikes: false, peak }
}

/** Tutte le celle delle tre leggi: 3 × 4 × 3 superfici, calcolate una volta per seme. */
export function allCells(pts: readonly (readonly number[])[]): Record<LawId, Cell[][]> {
  const out = {} as Record<LawId, Cell[][]>
  for (const law of LAW_IDS) out[law] = ROWS.map((N) => H1S.map((h1) => cellFor(law, h1, N, pts)))
  return out
}

// --- confronto 1-D / 2-D a parità di N = 100 e h = 0.3 ---

export const COMPARE = { N: 100, h: 0.3 } as const
/** Campioni attesi nella finestra: 1-D N·h·p(0), 2-D N·h²·p(0). */
export const expectedInWindow = (n: 1 | 2): number => COMPARE.N * COMPARE.h ** n * normalPdf(0) ** n

/** La stima 1-D con la prima coordinata degli stessi campioni. */
export function estimate1d(xs: readonly number[], pts: readonly (readonly number[])[], N: number, h: number): number[] {
  const c = 1 / (N * h * Math.sqrt(2 * Math.PI))
  return xs.map((x) => pts.slice(0, N).reduce((s, p) => s + Math.exp(-0.5 * ((x - p[0]) / h) ** 2), 0) * c)
}

// --- la sfida ---

/** La legge che somiglia alla riga N = 100 della slide (una cupola irregolare): quella con la radice, come in Duda-Hart. */
export const SIMILAR: LawId = 'radice'
/** La legge che soddisfa entrambe le condizioni, calcolata. */
export const consistentLaw = (): LawId => LAW_IDS.find((l) => lawVerdict(l).consistent) ?? 'quarta'
