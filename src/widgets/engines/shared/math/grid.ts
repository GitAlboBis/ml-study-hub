// Griglie del piano per i motori: campi scalari campionati sui nodi (superfici di scene3d, mappe di density2d,
// verosimiglianze di landscape), carte delle etichette sui centri delle celle (le regioni di classifier2d, con la
// stessa convenzione di BoundaryCanvas del kit), integrali e curve di livello con marching squares (il taglio
// orizzontale di una superficie, l'ellisse che si stacca in m06-affetta-la-campana).
import type { Vec2 } from './types'

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)

export interface Grid2d {
  /** ascisse dei nodi, estremi inclusi */
  xs: number[]
  /** ordinate dei nodi, estremi inclusi, crescenti */
  ys: number[]
  nx: number
  ny: number
  /** values[i·nx + j] = f(xs[j], ys[i]): riga i a y costante */
  values: Float64Array
}

const nodes = (fn: string, [a, b]: readonly [number, number], n: number): number[] => {
  if (!Number.isInteger(n) || n < 2) throw err(fn, `servono almeno 2 nodi per asse (ricevuto ${n})`)
  const out = Array.from({ length: n }, (_, k) => a + ((b - a) * k) / (n - 1))
  out[n - 1] = b
  return out
}

/** Campiona f sui nodi di una griglia nx × ny del rettangolo xDomain × yDomain (estremi inclusi). */
export function sampleGrid(
  fn: (x: number, y: number) => number,
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
  nx: number,
  ny = nx,
): Grid2d {
  const xs = nodes('sampleGrid', xDomain, nx)
  const ys = nodes('sampleGrid', yDomain, ny)
  const values = new Float64Array(nx * ny)
  for (let i = 0; i < ny; i++) for (let j = 0; j < nx; j++) values[i * nx + j] = fn(xs[j], ys[i])
  return { xs, ys, nx, ny, values }
}

/** [minimo, massimo] dei valori finiti ([NaN, NaN] se non ce n'è uno). */
export function gridRange(values: ArrayLike<number>): [number, number] {
  let lo = Number.POSITIVE_INFINITY
  let hi = Number.NEGATIVE_INFINITY
  for (let k = 0; k < values.length; k++) {
    const v = values[k]
    if (!Number.isFinite(v)) continue
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  return lo <= hi ? [lo, hi] : [Number.NaN, Number.NaN]
}

/** ∫∫ f dx dy con i trapezi sulla griglia (pesi ½ sui bordi, ¼ negli angoli). */
export function gridIntegral(grid: Grid2d, values: ArrayLike<number> = grid.values): number {
  const { xs, ys, nx, ny } = grid
  let s = 0
  for (let i = 0; i < ny - 1; i++) {
    const dy = ys[i + 1] - ys[i]
    for (let j = 0; j < nx - 1; j++) {
      const dx = xs[j + 1] - xs[j]
      s += ((values[i * nx + j] + values[i * nx + j + 1] + values[(i + 1) * nx + j] + values[(i + 1) * nx + j + 1]) / 4) * dx * dy
    }
  }
  return s
}

/** Errore quadratico integrato 2-D ∫∫ (a − b)² fra due campi sulla stessa griglia. */
export function ise2d(grid: Grid2d, a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length || a.length !== grid.nx * grid.ny) throw err('ise2d', 'i campi non hanno la misura della griglia')
  const d = new Float64Array(a.length)
  for (let k = 0; k < a.length; k++) d[k] = (a[k] - b[k]) ** 2
  return gridIntegral(grid, d)
}

export interface LabelGrid {
  /** etichetta della cella (colonna i, riga j dall'alto) in labels[j·cols + i]; −1 = rifiuto, −2 = conteso */
  labels: Int8Array
  cols: number
  rows: number
  /** area di una cella nelle unità del dominio */
  cellArea: number
}

/**
 * Carta delle etichette sui centri delle celle, come BoundaryCanvas del kit: la cella (i, j) ha centro
 * (x₀ + (i + ½)dx, y₁ − (j + ½)dy), righe dall'alto. Serve a contare aree di regione, errori e rifiuti.
 * Le etichette devono stare in un Int8 (−128…127).
 */
export function labelGrid(
  classify: (x: number, y: number) => number,
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
  cols: number,
  rows: number,
): LabelGrid {
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) throw err('labelGrid', `griglia non valida ${cols} × ${rows}`)
  const x0 = Math.min(xDomain[0], xDomain[1])
  const y1 = Math.max(yDomain[0], yDomain[1])
  const dx = Math.abs(xDomain[1] - xDomain[0]) / cols
  const dy = Math.abs(yDomain[1] - yDomain[0]) / rows
  const labels = new Int8Array(cols * rows)
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) labels[j * cols + i] = classify(x0 + (i + 0.5) * dx, y1 - (j + 0.5) * dy)
  return { labels, cols, rows, cellArea: dx * dy }
}

/** Frazione delle celle per etichetta (rifiuti e contesi compresi, con le loro etichette negative). */
export function labelFractions(labels: ArrayLike<number>): Map<number, number> {
  const out = new Map<number, number>()
  for (let k = 0; k < labels.length; k++) out.set(labels[k], (out.get(labels[k]) ?? 0) + 1)
  for (const [key, c] of out) out.set(key, c / labels.length)
  return out
}

/**
 * Curva di livello f = level con marching squares sulla griglia di nodi: un elenco di segmenti [a, b] nelle
 * coordinate del dominio (interpolazione lineare sui lati). Le celle a sella si risolvono con il valore medio al
 * centro. Celle con valori non finiti: saltate.
 */
export function marchingSquares(grid: Grid2d, level: number): [Vec2, Vec2][] {
  const { xs, ys, nx, ny, values } = grid
  const out: [Vec2, Vec2][] = []
  // angoli: 0 = (j, i), 1 = (j+1, i), 2 = (j+1, i+1), 3 = (j, i+1); lati: 0 = 0-1, 1 = 1-2, 2 = 3-2, 3 = 0-3
  const EDGE_CORNERS = [
    [0, 1],
    [1, 2],
    [3, 2],
    [0, 3],
  ] as const
  // i due lati che toccano ogni angolo
  const CORNER_EDGES = [
    [0, 3],
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const
  const v = [0, 0, 0, 0]
  const px = [0, 0, 0, 0]
  const py = [0, 0, 0, 0]
  for (let i = 0; i < ny - 1; i++) {
    for (let j = 0; j < nx - 1; j++) {
      v[0] = values[i * nx + j]
      v[1] = values[i * nx + j + 1]
      v[2] = values[(i + 1) * nx + j + 1]
      v[3] = values[(i + 1) * nx + j]
      if (!v.every(Number.isFinite)) continue
      px[0] = px[3] = xs[j]
      px[1] = px[2] = xs[j + 1]
      py[0] = py[1] = ys[i]
      py[2] = py[3] = ys[i + 1]
      const hi = v.map((x) => x >= level)
      const point = (e: number): Vec2 => {
        const [a, b] = EDGE_CORNERS[e]
        const t = (level - v[a]) / (v[b] - v[a])
        return [px[a] + t * (px[b] - px[a]), py[a] + t * (py[b] - py[a])]
      }
      const crossing = [0, 1, 2, 3].filter((e) => hi[EDGE_CORNERS[e][0]] !== hi[EDGE_CORNERS[e][1]])
      if (crossing.length === 2) out.push([point(crossing[0]), point(crossing[1])])
      else if (crossing.length === 4) {
        const center = (v[0] + v[1] + v[2] + v[3]) / 4 >= level
        for (let c = 0; c < 4; c++) if (hi[c] !== center) out.push([point(CORNER_EDGES[c][0]), point(CORNER_EDGES[c][1])])
      }
    }
  }
  return out
}
