// Superficie a reticolo in assonometria (vista ortografica con azimut e elevazione): la figura delle slide p56 e p57
// di Melgani, disegnata in SVG. Solo geometria pura, testata in wireframe.test.ts; il componente è Wireframe3d in
// parzen-lab-3d.tsx.
//
// Convenzioni: il dominio [x0, x1] × [y0, y1] si normalizza nel quadrato [−1, 1]²; la quota z si divide per zTop e
// diventa [0, 1] (ciò che supera zTop è tagliato alla cima). Azimut θ in gradi (rotazione attorno all'asse verticale),
// elevazione φ in gradi (0 = di lato, 90 = dall'alto).

export interface View {
  azimuth: number
  elevation: number
}

export interface Box {
  width: number
  height: number
  /** margine in pixel attorno alla figura */
  pad?: number
}

const rad = (d: number) => (d * Math.PI) / 180
/** Quanto sale la quota piena (w = 1) rispetto al lato della base: la figura è più alta che larga, come nella slide. */
const RISE = 1.5
/** Fino a che quota (frazione della cima) il riquadro tiene posto sugli spigoli lontani: i picchi stanno di solito verso il centro. */
const CORNER_ROOM = 0.6

/** Proiezione ortografica di un punto (u, v, w) con u, v ∈ [−1, 1], w ∈ [0, 1]: coordinate schermo (x a destra, y in giù). */
export function project(u: number, v: number, w: number, view: View): [number, number] {
  const a = rad(view.azimuth)
  const e = rad(view.elevation)
  const sx = u * Math.cos(a) - v * Math.sin(a)
  const depth = u * Math.sin(a) + v * Math.cos(a)
  const sy = depth * Math.sin(e) - w * Math.cos(e) * RISE
  return [sx, sy]
}

/** Il riquadro che contiene la base e la cima per ogni azimut: la figura non cambia scala mentre ruota. */
export function fit(view: View, box: Box): (p: [number, number]) => [number, number] {
  const pad = box.pad ?? 8
  const e = rad(view.elevation)
  // |sx| ≤ √2; in alto il posto per la cima piena al centro e per 0.6 della cima sugli spigoli lontani
  const sxMax = Math.SQRT2
  const syMin = -Math.max(RISE * Math.cos(e), Math.SQRT2 * Math.sin(e) + CORNER_ROOM * RISE * Math.cos(e))
  const syMax = Math.SQRT2 * Math.sin(e)
  const sw = (box.width - 2 * pad) / (2 * sxMax)
  const sh = (box.height - 2 * pad) / (syMax - syMin)
  const s = Math.min(sw, sh)
  const cx = box.width / 2
  const oy = pad + (box.height - 2 * pad - s * (syMax - syMin)) / 2 - s * syMin
  return ([x, y]) => [cx + s * x, oy + s * y]
}

export interface Mesh {
  /** polilinee già proiettate: righe a y costante e colonne a x costante */
  lines: [number, number][][]
  /** i quattro spigoli della base, proiettati */
  base: [number, number][]
}

/**
 * Il reticolo di f sul dominio, `n` linee per direzione (e `m` punti per linea), proiettato nel riquadro.
 * La quota è f/zTop, tagliata a 1 (una punta più alta si ferma sul soffitto della figura).
 */
export function mesh(f: (x: number, y: number) => number, xDomain: readonly [number, number], yDomain: readonly [number, number], zTop: number, view: View, box: Box, n = 25, m = 49): Mesh {
  const place = fit(view, box)
  const P = (u: number, v: number, w: number) => place(project(u, v, w, view))
  const toX = (u: number) => xDomain[0] + ((u + 1) / 2) * (xDomain[1] - xDomain[0])
  const toY = (v: number) => yDomain[0] + ((v + 1) / 2) * (yDomain[1] - yDomain[0])
  const height = (u: number, v: number) => Math.min(1, Math.max(0, f(toX(u), toY(v)) / zTop))
  const lines: [number, number][][] = []
  for (let i = 0; i < n; i++) {
    const c = -1 + (2 * i) / (n - 1)
    const row: [number, number][] = []
    const col: [number, number][] = []
    for (let j = 0; j < m; j++) {
      const t = -1 + (2 * j) / (m - 1)
      row.push(P(t, c, height(t, c)))
      col.push(P(c, t, height(c, t)))
    }
    lines.push(row, col)
  }
  const base = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([u, v]) => P(u, v, 0))
  return { lines, base }
}

/** Volume sotto una superficie con i trapezi su una griglia n × n del dominio (per il contatore del volume). */
export function volume(f: (x: number, y: number) => number, xDomain: readonly [number, number], yDomain: readonly [number, number], n = 161): number {
  const dx = (xDomain[1] - xDomain[0]) / (n - 1)
  const dy = (yDomain[1] - yDomain[0]) / (n - 1)
  let s = 0
  for (let i = 0; i < n; i++) {
    const wx = i === 0 || i === n - 1 ? 0.5 : 1
    for (let j = 0; j < n; j++) {
      const wy = j === 0 || j === n - 1 ? 0.5 : 1
      s += wx * wy * f(xDomain[0] + i * dx, yDomain[0] + j * dy)
    }
  }
  return s * dx * dy
}

/** Azimut dopo un passo da tastiera (15°) o un trascinamento, riportato in [0, 360). */
export const rotate = (azimuth: number, by: number): number => (((azimuth + by) % 360) + 360) % 360
