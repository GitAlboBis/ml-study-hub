// Logica del widget m09-normalizza-le-feature ("Normalizza prima di stimare"), concetto c60. Slide p65: "since σ
// is the same along all features, it is important to normalize them before undertaking the pdf estimation
// process". Scenario (inventario): 30 salmoni descritti da luminosità (scala 0-10, deviazione standard 1.2) e
// lunghezza in millimetri (deviazione standard 110): nelle unità originali la distanza euclidea è dominata dalla
// lunghezza. Due salmoni fissati dalla specifica: (4.2, 520) e (5.1, 610); gli altri 28 sono sintetici e
// riscalati perché media e deviazione standard delle due feature siano esattamente 4.6 / 1.2 e 600 / 110.
import { createRng } from '../../lib/rng'
import { niceLogSteps } from '../engines/density1d'
import { easeInOut } from './proprieta/teoria'

/** Un salmone: [luminosità, lunghezza in mm]. */
export type Fish = readonly [number, number]
export type Mode = 'zscore' | 'minmax'

export const N = 30
export const PAIR: readonly [Fish, Fish] = [
  [4.2, 520],
  [5.1, 610],
]
export const TARGET = { mean: [4.6, 600], sd: [1.2, 110] } as const
export const SIGMA_ORIG = niceLogSteps(0.1, 200)
export const SIGMA_NORM = niceLogSteps(0.05, 2)
export const INITIAL = { sigmaOrig: 20, sigmaNorm: 0.4 }
/** Durata della normalizzazione animata (inventario: 600 ms di traslazione, 900 ms di riscala). */
export const NORMALIZE_MS = 1500
export const CENTER_SHARE = 0.4

/** Riscala i valori liberi perché tutti gli N valori abbiano media m e deviazione standard (divisa per N) s. */
function fitFree(free: readonly number[], fixed: readonly number[], m: number, s: number): number[] {
  const n = free.length + fixed.length
  const fm = free.reduce((a, b) => a + b, 0) / free.length
  const fsd = Math.sqrt(free.reduce((a, b) => a + (b - fm) ** 2, 0) / free.length)
  const z = free.map((v) => (v - fm) / fsd)
  const sumFree = n * m - fixed.reduce((a, b) => a + b, 0)
  const sqFree = n * (s * s + m * m) - fixed.reduce((a, b) => a + b * b, 0)
  const b = sumFree / free.length
  const a = Math.sqrt(sqFree / free.length - b * b)
  return z.map((v) => b + a * v)
}

/** I 30 salmoni: i due della specifica per primi, poi 28 sintetici, con medie e deviazioni esatte. */
export function salmons(seed = 7): Fish[] {
  const rng = createRng(seed)
  const light = Array.from({ length: N - 2 }, () => rng.normal())
  // la lunghezza è un po' legata alla luminosità: la nuvola normalizzata è tondeggiante ma non un cerchio
  const len = light.map((l) => 0.35 * l + rng.normal() * 0.94)
  const L = fitFree(light, PAIR.map((p) => p[0]), TARGET.mean[0], TARGET.sd[0])
  const Ln = fitFree(len, PAIR.map((p) => p[1]), TARGET.mean[1], TARGET.sd[1])
  return [...PAIR, ...L.map((l, i) => [Number(l.toFixed(4)), Number(Ln[i].toFixed(2))] as const)]
}

export interface Stats {
  mean: [number, number]
  sd: [number, number]
  min: [number, number]
  max: [number, number]
}

export function stats(fish: readonly Fish[]): Stats {
  const col = (j: 0 | 1) => fish.map((f) => f[j])
  const mean = [0, 1].map((j) => col(j as 0 | 1).reduce((a, b) => a + b, 0) / fish.length) as [number, number]
  const sd = [0, 1].map((j) => Math.sqrt(col(j as 0 | 1).reduce((a, b) => a + (b - mean[j]) ** 2, 0) / fish.length)) as [number, number]
  const min = [0, 1].map((j) => Math.min(...col(j as 0 | 1))) as [number, number]
  const max = [0, 1].map((j) => Math.max(...col(j as 0 | 1))) as [number, number]
  return { mean, sd, min, max }
}

/** Centro e scala di ogni feature per il tipo di normalizzazione: x' = (x − c)/s. */
export function params(st: Stats, mode: Mode): { c: [number, number]; s: [number, number] } {
  return mode === 'zscore' ? { c: st.mean, s: st.sd } : { c: st.min, s: [st.max[0] - st.min[0], st.max[1] - st.min[1]] }
}

/**
 * La trasformazione a metà animazione: t da 0 (unità originali) a 1 (normalizzate). Nel primo 40% si centra
 * (i punti traslano), nel resto si divide per la scala, in modo geometrico (gli assi si riscalano).
 */
export function transformAt(t: number, p: { c: [number, number]; s: [number, number] }): { c: [number, number]; s: [number, number]; center: number; scale: number } {
  const center = easeInOut(Math.min(1, t / CENTER_SHARE))
  const scale = easeInOut(Math.max(0, (t - CENTER_SHARE) / (1 - CENTER_SHARE)))
  return { c: [p.c[0] * center, p.c[1] * center], s: [p.s[0] ** scale, p.s[1] ** scale], center, scale }
}

export const apply = (f: Fish, tr: { c: [number, number]; s: [number, number] }): Fish => [(f[0] - tr.c[0]) / tr.s[0], (f[1] - tr.c[1]) / tr.s[1]]

/**
 * Quadrato della distanza scomposto per feature: [luminosità, lunghezza] e le quote. Nelle unità originali i
 * due salmoni della specifica danno 0.81 + 8100, cioè il 99.99% dalla lunghezza.
 */
export function decompose(a: Fish, b: Fish): { parts: [number, number]; total: number; share: [number, number] } {
  const parts: [number, number] = [(a[0] - b[0]) ** 2, (a[1] - b[1]) ** 2]
  const total = parts[0] + parts[1]
  return { parts, total, share: total > 0 ? [parts[0] / total, parts[1] / total] : [0.5, 0.5] }
}

/** Quota media della distanza al quadrato dovuta a ciascuna feature, su tutte le coppie. */
export function averageShare(fish: readonly Fish[]): [number, number] {
  let a = 0
  let b = 0
  for (let i = 0; i < fish.length; i++) {
    for (let j = i + 1; j < fish.length; j++) {
      const d = decompose(fish[i], fish[j])
      a += d.parts[0]
      b += d.parts[1]
    }
  }
  return [a / (a + b), b / (a + b)]
}

/** Stima di Specht in 2-D con una sola σ, nelle unità in cui sono dati i punti. */
export function specht2(x: number, y: number, pts: readonly Fish[], sigma: number): number {
  const c = 1 / (pts.length * 2 * Math.PI * sigma * sigma)
  let s = 0
  for (const p of pts) {
    const d2 = ((x - p[0]) ** 2 + (y - p[1]) ** 2) / (sigma * sigma)
    if (d2 < 60) s += Math.exp(-0.5 * d2)
  }
  return s * c
}

/** Log-verosimiglianza leave-one-out della stima di Specht (per la sfida nelle unità normalizzate). */
export function looLogLik(pts: readonly Fish[], sigma: number): number {
  return pts.reduce((acc, p, k) => {
    const others = pts.filter((_, j) => j !== k)
    return acc + Math.log(Math.max(1e-300, specht2(p[0], p[1], others, sigma)))
  }, 0)
}

export function bestSigma(pts: readonly Fish[], grid: readonly number[]): number {
  let best = grid[0]
  let bv = Number.NEGATIVE_INFINITY
  for (const s of grid) {
    const v = looLogLik(pts, s)
    if (v > bv) {
      bv = v
      best = s
    }
  }
  return best
}

/** Con la lunghezza in metri (deviazione standard 0.11) quale feature dominerebbe la distanza? */
export function dominantInMeters(st: Stats): 'luminosita' | 'lunghezza' {
  return st.sd[0] > st.sd[1] / 1000 ? 'luminosita' : 'lunghezza'
}
