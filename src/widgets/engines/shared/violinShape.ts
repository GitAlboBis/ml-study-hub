// Logica di Violin: la forma di un violino è la stima di Parzen gaussiana dei valori (con la larghezza di
// Silverman se non se ne dà una), più mediana e quartili per la scatola interna. Niente React.
import { normalPdf } from '../../../lib/ml/stats'

/** Quantile q di un campione con interpolazione lineare fra le statistiche d'ordine (tipo 7, come R e numpy). NaN se vuoto. */
export function quantile(values: readonly number[], q: number): number {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (v.length === 0) return Number.NaN
  const pos = Math.min(Math.max(q, 0), 1) * (v.length - 1)
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return v[lo] + (v[hi] - v[lo]) * (pos - lo)
}

/**
 * Larghezza della regola di Silverman, 0.9·min(σ̂, IQR/1.34)·N^(−1/5), con σ̂ a denominatore N − 1. Per un campione
 * senza dispersione dà una larghezza piccola ma positiva: il violino diventa una spina, non sparisce.
 */
export function silverman(values: readonly number[]): number {
  const v = values.filter(Number.isFinite)
  const n = v.length
  if (n < 2) return 1
  const mean = v.reduce((s, x) => s + x, 0) / n
  const sd = Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1))
  const iqr = quantile(v, 0.75) - quantile(v, 0.25)
  const spread = iqr > 0 ? Math.min(sd, iqr / 1.34) : sd
  const h = 0.9 * spread * n ** -0.2
  return h > 0 ? h : Math.max(1e-3, Math.abs(mean) * 1e-3)
}

/** Profilo del violino: p̂(g) = (1/N) Σ N(g; x_k, h²) su ogni punto g della griglia. Campione vuoto: zeri. */
export function violinProfile(values: readonly number[], grid: readonly number[], h: number): number[] {
  const v = values.filter(Number.isFinite)
  if (v.length === 0) return grid.map(() => 0)
  return grid.map((g) => {
    let s = 0
    for (const x of v) s += normalPdf(g, x, h)
    return s / v.length
  })
}
