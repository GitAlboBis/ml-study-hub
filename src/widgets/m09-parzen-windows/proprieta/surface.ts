// Superfici 3-D a creste per i widget del foglio m09 (griglia 2-D della slide p64, vista 3-D di Specht): logica
// pura, nessun React. Una densità su un rettangolo del piano si campiona su una griglia; ogni riga della griglia
// diventa una cresta (polilinea della superficie chiusa fino alla base) e le creste si disegnano dalla più
// lontana alla più vicina, riempite del colore della carta: così le vicine coprono le lontane senza calcolare le
// linee nascoste (la tecnica dei "ridgeline plot"). Dove la finestra è più stretta della griglia, la superficie
// campionata perderebbe i picchi: lì ogni campione diventa un ago verticale, alto quanto la sua campana.

export interface View {
  /** rotazione attorno all'asse verticale, in radianti */
  az: number
  /** elevazione dello sguardo, in radianti (0 = di taglio, π/2 = dall'alto) */
  el: number
}

export const DEFAULT_VIEW: View = { az: -0.6, el: 0.55 }

export interface Box {
  domain: readonly [number, number]
  /** quota massima disegnata: oltre, la superficie si taglia e il picco porta una punta */
  zMax: number
}

/**
 * Proiezione nel quadrato [0, 1] × [0, 1] (y verso il basso, come in SVG) di un punto (x, y, z) della scatola.
 * Il quadrato di base ruotato ha diagonale 1: ci sta intero per ogni azimut.
 */
export function project(x: number, y: number, z: number, box: Box, view: View): [number, number, number] {
  const [a, b] = box.domain
  const u = (x - a) / (b - a) - 0.5
  const v = (y - a) / (b - a) - 0.5
  const ca = Math.cos(view.az)
  const sa = Math.sin(view.az)
  const xr = u * ca - v * sa
  const yr = u * sa + v * ca
  const w = Math.min(z, box.zMax) / box.zMax
  const k = 1 / Math.SQRT2
  const sx = 0.5 + xr * k
  // la base occupa la parte bassa del riquadro, la quota la parte alta
  const sy = 0.72 - yr * k * Math.sin(view.el) - w * 0.62 * Math.cos(view.el)
  return [sx, sy, yr]
}

/** Valori di fn sulla griglia n × n del quadrato domain², riga i = y costante. */
export function sampleGrid(fn: (x: number, y: number) => number, domain: readonly [number, number], n: number): Float64Array {
  const out = new Float64Array(n * n)
  const [a, b] = domain
  for (let i = 0; i < n; i++) {
    const y = a + ((b - a) * i) / (n - 1)
    for (let j = 0; j < n; j++) out[i * n + j] = fn(a + ((b - a) * j) / (n - 1), y)
  }
  return out
}

/** Stima di Parzen 2-D con kernel gaussiano a simmetria sferica (σ = h) sulla griglia. */
export function parzenGrid(samples: readonly (readonly number[])[], h: number, domain: readonly [number, number], n: number): Float64Array {
  const c = 1 / (samples.length * 2 * Math.PI * h * h)
  return sampleGrid(
    (x, y) => {
      let s = 0
      for (const p of samples) {
        const d2 = ((x - p[0]) ** 2 + (y - p[1]) ** 2) / (h * h)
        if (d2 < 60) s += Math.exp(-0.5 * d2)
      }
      return s * c
    },
    domain,
    n,
  )
}

/** Mescola due griglie (transizione fra due leggi): (1 − t)·a + t·b. */
export function blendGrid(a: Float64Array, b: Float64Array, t: number): Float64Array {
  if (a.length !== b.length) return b
  const out = new Float64Array(b.length)
  for (let i = 0; i < b.length; i++) out[i] = a[i] + (b[i] - a[i]) * t
  return out
}

export interface Ridge {
  /** percorso chiuso della cresta, già in coordinate [0, 1] moltiplicate per la misura */
  d: string
  depth: number
}

const r2 = (v: number) => Math.round(v * 100) / 100

/**
 * Le creste della superficie in pixel (w × h), dalla più lontana alla più vicina. Ogni riga della griglia è
 * chiusa fino alla base, così riempita copre ciò che sta dietro.
 */
export function ridges(z: Float64Array, n: number, box: Box, view: View, w: number, h: number): Ridge[] {
  const [a, b] = box.domain
  const out: Ridge[] = []
  // si segue la direzione che, a questo azimut, va "di lato": righe a y costante o colonne a x costante
  const alongX = Math.abs(Math.cos(view.az)) >= Math.abs(Math.sin(view.az))
  for (let i = 0; i < n; i++) {
    const pts: [number, number][] = []
    let depth = 0
    for (let j = 0; j < n; j++) {
      const gx = alongX ? j : i
      const gy = alongX ? i : j
      const x = a + ((b - a) * gx) / (n - 1)
      const y = a + ((b - a) * gy) / (n - 1)
      const [sx, sy, dz] = project(x, y, z[gy * n + gx], box, view)
      pts.push([sx * w, sy * h])
      depth += dz
    }
    const first = alongX ? [a, a + ((b - a) * i) / (n - 1)] : [a + ((b - a) * i) / (n - 1), a]
    const last = alongX ? [b, first[1]] : [first[0], b]
    const [bx0, by0] = project(first[0], first[1], 0, box, view)
    const [bx1, by1] = project(last[0], last[1], 0, box, view)
    const d = `M${r2(bx0 * w)},${r2(by0 * h)}` + pts.map(([px, py]) => `L${r2(px)},${r2(py)}`).join('') + `L${r2(bx1 * w)},${r2(by1 * h)}Z`
    out.push({ d, depth: depth / n })
  }
  // le più lontane (depth grande = dietro) per prime
  return out.sort((p, q) => q.depth - p.depth)
}

/** Il contorno della base (quadrato) proiettato, in pixel. */
export function basePath(box: Box, view: View, w: number, h: number): string {
  const [a, b] = box.domain
  const c = [
    [a, a],
    [b, a],
    [b, b],
    [a, b],
  ].map(([x, y]) => project(x, y, 0, box, view))
  return `M${c.map(([x, y]) => `${r2(x * w)},${r2(y * h)}`).join('L')}Z`
}

/** Aghi: un segmento verticale per campione, alto quanto la sua campana 1/(N·2π h²), dal più lontano. */
export function needles(samples: readonly (readonly number[])[], peak: number, box: Box, view: View, w: number, h: number): { d: string; over: boolean; depth: number }[] {
  return samples
    .filter((p) => p[0] >= box.domain[0] && p[0] <= box.domain[1] && p[1] >= box.domain[0] && p[1] <= box.domain[1])
    .map((p) => {
      const [x0, y0, depth] = project(p[0], p[1], 0, box, view)
      const [x1, y1] = project(p[0], p[1], peak, box, view)
      return { d: `M${r2(x0 * w)},${r2(y0 * h)}L${r2(x1 * w)},${r2(y1 * h)}`, over: peak > box.zMax, depth }
    })
    .sort((p, q) => q.depth - p.depth)
}
