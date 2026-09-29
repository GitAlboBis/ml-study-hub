// Proiezione 3D senza dipendenze per scene3d e dimension-lab: camera orbitale (azimut, elevazione, ortografica o
// prospettica), proiezione di punti in pixel, clic sul pavimento (il raggio che torna al piano z = z₀), mesh di
// superfici z = f(x, y) in facce quadrate con l'algoritmo del pittore (dalla più lontana alla più vicina, riempite:
// le vicine coprono le lontane senza calcolare le linee nascoste), ombreggiatura lambertiana a due facce, blocchi,
// spigoli del box, ellissoidi di livello.
//
// Convenzioni. Il box del mondo si normalizza in un cubo di base 1 × 1 centrato nell'origine, con altezza `zScale`
// (predefinito 0.8): u = (x − x₀)/(x₁ − x₀) − ½, v analogo, w = ((z − z₀)/(z₁ − z₀) − ½)·zScale. La camera ruota
// dell'azimut attorno alla verticale e guarda con l'elevazione (0 = di lato, π/2 = dall'alto):
//   x₁ = u cos az − v sin az,  y₁ = u sin az + v cos az
//   X = x₁ (destra),  Y = w cos el + y₁ sin el (alto),  Z = y₁ cos el − w sin el (profondità, cresce allontanandosi)
// Con az = el = 0 si guarda lungo +y: x a destra, z in alto. Prospettica: fattore D/(D + Z) con D = `distance`.
// La scala in pixel è fissa per ogni rotazione (la sfera che contiene il box sta nel riquadro): ruotare non fa
// "respirare" la scena. Gli angoli sono in radianti (`radians` converte).
import type { Grid2d } from './grid'
import { eigSym } from './linalg'
import type { Mat, Vec2, Vec3 } from './types'

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)

/** Gradi → radianti. */
export const radians = (d: number): number => (d * Math.PI) / 180

export interface Box3 {
  x: readonly [number, number]
  y: readonly [number, number]
  z: readonly [number, number]
}

export interface CameraSpec {
  /** rotazione attorno alla verticale, radianti */
  azimuth: number
  /** elevazione dello sguardo, radianti: 0 di lato, π/2 dall'alto */
  elevation: number
  /** distanza della camera in unità del box normalizzato (lato di base 1); assente = ortografica */
  distance?: number
  /** altezza del box normalizzato rispetto al lato di base; predefinito 0.8 */
  zScale?: number
}

export interface Viewport {
  width: number
  height: number
  /** margine in pixel; predefinito 12 */
  margin?: number
}

export interface ScreenPoint {
  /** pixel da sinistra */
  x: number
  /** pixel dall'alto (come in SVG e canvas) */
  y: number
  /** profondità: più grande = più lontano */
  depth: number
}

export interface Camera {
  box: Box3
  spec: CameraSpec
  viewport: Viewport
  /** pixel per unità del box normalizzato */
  scale: number
  project(p: Vec3): ScreenPoint
  /** coordinate di camera (X, Y, Z) prima della prospettiva */
  toCamera(p: Vec3): Vec3
  /** il punto del piano z = z₀ (predefinito il pavimento z₀ = box.z[0]) sotto il pixel; null se lo sguardo è parallelo al piano */
  unprojectToPlane(sx: number, sy: number, z0?: number): Vec3 | null
}

/** Camera per il box e il riquadro dati. */
export function createCamera(box: Box3, spec: CameraSpec, viewport: Viewport): Camera {
  const zs = spec.zScale ?? 0.8
  const D = spec.distance
  const R = Math.sqrt(0.5 + (zs * zs) / 4)
  if (D !== undefined && !(D > R)) throw err('createCamera', `la distanza della camera (${D}) deve superare il raggio del box (${R.toFixed(3)})`)
  for (const k of ['x', 'y', 'z'] as const) if (!(box[k][1] > box[k][0])) throw err('createCamera', `intervallo ${k} non valido`)
  const margin = viewport.margin ?? 12
  const cx = viewport.width / 2
  const cy = viewport.height / 2
  // nella prospettica il punto più vicino si ingrandisce di D/(D − R): la scala lo tiene nel riquadro
  const persp = D === undefined ? 1 : D / (D - R)
  const scale = Math.max(0, Math.min(viewport.width, viewport.height) / 2 - margin) / (R * persp)
  const ca = Math.cos(spec.azimuth)
  const sa = Math.sin(spec.azimuth)
  const ce = Math.cos(spec.elevation)
  const se = Math.sin(spec.elevation)
  const [x0, x1] = box.x
  const [y0, y1] = box.y
  const [z0, z1] = box.z

  const normalize = (p: Vec3): Vec3 => [(p[0] - x0) / (x1 - x0) - 0.5, (p[1] - y0) / (y1 - y0) - 0.5, ((p[2] - z0) / (z1 - z0) - 0.5) * zs]

  const toCamera = (p: Vec3): Vec3 => {
    const [u, v, w] = normalize(p)
    const xr = u * ca - v * sa
    const yr = u * sa + v * ca
    return [xr, w * ce + yr * se, yr * ce - w * se]
  }

  const project = (p: Vec3): ScreenPoint => {
    const [X, Y, Z] = toCamera(p)
    const f = D === undefined ? 1 : D / (D + Z)
    return { x: cx + scale * X * f, y: cy - scale * Y * f, depth: Z }
  }

  const unprojectToPlane = (sx: number, sy: number, zPlane = z0): Vec3 | null => {
    const Xs = (sx - cx) / scale
    const Ys = (cy - sy) / scale
    const w0 = ((zPlane - z0) / (z1 - z0) - 0.5) * zs
    // w = Y cos el − Z sin el, con X = Xs·g, Y = Ys·g e g = (D + Z)/D (1 in ortografica)
    let Z: number
    if (D === undefined) {
      if (Math.abs(se) < 1e-12) return null
      Z = (Ys * ce - w0) / se
    } else {
      const den = (Ys * ce) / D - se
      if (Math.abs(den) < 1e-12) return null
      Z = (w0 - Ys * ce) / den
    }
    const g = D === undefined ? 1 : (D + Z) / D
    const X = Xs * g
    const Y = Ys * g
    const yr = Y * se + Z * ce
    const u = X * ca + yr * sa
    const v = -X * sa + yr * ca
    return [(u + 0.5) * (x1 - x0) + x0, (v + 0.5) * (y1 - y0) + y0, zPlane]
  }

  return { box, spec, viewport, scale, project, toCamera, unprojectToPlane }
}

/** Nuovo punto di vista dopo un trascinamento o una freccia: azimut modulo 2π, elevazione nei limiti (predefiniti −π/2…π/2). */
export function orbit(spec: CameraSpec, dAzimuth: number, dElevation: number, elevationRange: readonly [number, number] = [-Math.PI / 2, Math.PI / 2]): CameraSpec {
  const tau = 2 * Math.PI
  const az = (((spec.azimuth + dAzimuth) % tau) + tau) % tau
  const el = Math.min(elevationRange[1], Math.max(elevationRange[0], spec.elevation + dElevation))
  return { ...spec, azimuth: az, elevation: el }
}

/** Ordinamento del pittore: profondità decrescente (il più lontano prima), stabile a parità. */
export function paintersSort<T extends { depth: number }>(items: readonly T[]): T[] {
  return items.map((it, k) => ({ it, k })).sort((a, b) => b.it.depth - a.it.depth || a.k - b.k).map((o) => o.it)
}

/** Normale unitaria del triangolo abc (regola della mano destra). */
export function faceNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const len = Math.hypot(n[0], n[1], n[2])
  if (!(len > 0)) return [0, 0, 0]
  return [n[0] / len + 0, n[1] / len + 0, n[2] / len + 0]
}

/** Direzione della luce nello spazio della camera: dall'alto a sinistra, verso chi guarda. */
const LIGHT: Vec3 = (() => {
  const l = [-0.35, 0.8, -0.5]
  const n = Math.hypot(l[0], l[1], l[2])
  return [l[0] / n, l[1] / n, l[2] / n]
})()

/** Luminosità lambertiana a due facce |n·l| ∈ [0, 1] di un poligono (primi tre vertici), in coordinate di camera. */
function shadeOf(cam: Camera, pts: readonly Vec3[]): number {
  const n = faceNormal(cam.toCamera(pts[0]), cam.toCamera(pts[1]), cam.toCamera(pts[2]))
  return Math.min(1, Math.abs(n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]))
}

export interface Face {
  /** vertici proiettati in pixel */
  pts: [number, number][]
  /** profondità media dei vertici */
  depth: number
  /** riga (y) e colonna (x) della cella nella griglia */
  i: number
  j: number
  /** quota media della faccia (dopo il taglio al tetto) */
  zMean: number
  /** luminosità lambertiana ∈ [0, 1] */
  shade: number
  /** un vertice superava il tetto del box ed è stato tagliato */
  clipped: boolean
}

/**
 * Le facce quadrate della superficie campionata su una griglia di nodi (sampleGrid), proiettate e ordinate per il
 * pittore. Le quote oltre il box si fermano al tetto (o al pavimento) e la faccia porta `clipped`: +∞ va al tetto,
 * −∞ al pavimento (ln 0 di una log-verosimiglianza è un pozzo, non un picco). Un NaN non ha quota: le facce che
 * toccano quel nodo mancano, e la superficie ha un buco dove la funzione non è definita.
 */
export function surfaceFaces(grid: Grid2d, cam: Camera): Face[] {
  const { xs, ys, nx, ny, values } = grid
  const [zlo, zhi] = cam.box.z
  const P: ScreenPoint[] = new Array(nx * ny)
  const W: Vec3[] = new Array(nx * ny)
  const clip = new Uint8Array(nx * ny)
  const missing = new Uint8Array(nx * ny)
  for (let i = 0; i < ny; i++) {
    for (let j = 0; j < nx; j++) {
      const k = i * nx + j
      const z = values[k]
      missing[k] = Number.isNaN(z) ? 1 : 0
      // Math.max/min portano già −∞ a zlo e +∞ a zhi; il NaN resta a zlo solo per non avere coordinate NaN
      const zc = missing[k] ? zlo : Math.min(zhi, Math.max(zlo, z))
      clip[k] = zc !== z ? 1 : 0
      W[k] = [xs[j], ys[i], zc]
      P[k] = cam.project(W[k])
    }
  }
  const faces: Face[] = []
  for (let i = 0; i < ny - 1; i++) {
    for (let j = 0; j < nx - 1; j++) {
      const ks = [i * nx + j, i * nx + j + 1, (i + 1) * nx + j + 1, (i + 1) * nx + j]
      if (ks.some((k) => missing[k] === 1)) continue
      faces.push({
        pts: ks.map((k) => [P[k].x, P[k].y] as [number, number]),
        depth: (P[ks[0]].depth + P[ks[1]].depth + P[ks[2]].depth + P[ks[3]].depth) / 4,
        i,
        j,
        zMean: (W[ks[0]][2] + W[ks[1]][2] + W[ks[2]][2] + W[ks[3]][2]) / 4,
        shade: shadeOf(cam, [W[ks[0]], W[ks[1]], W[ks[2]]]),
        clipped: ks.some((k) => clip[k] === 1),
      })
    }
  }
  return paintersSort(faces)
}

/** Poligoni qualsiasi (blocchi, pareti, piani di taglio) proiettati e ordinati per il pittore, con i dati di chi chiama. */
export function polygonFaces<T extends { pts: readonly Vec3[] }>(items: readonly T[], cam: Camera): (T & { screen: [number, number][]; depth: number; shade: number })[] {
  return paintersSort(
    items.map((it) => {
      const sp = it.pts.map((p) => cam.project(p))
      return { ...it, screen: sp.map((s) => [s.x, s.y] as [number, number]), depth: sp.reduce((s, p) => s + p.depth, 0) / sp.length, shade: it.pts.length >= 3 ? shadeOf(cam, it.pts) : 1 }
    }),
  )
}

/** Le sei facce (quadrilateri) di un parallelepipedo allineato agli assi: i blocchi di altezza 1/V, i box del Box classifier. */
export function boxFaces(min: Vec3, max: Vec3): Vec3[][] {
  const [a, b, c] = min
  const [d, e, f] = max
  return [
    [[a, b, c], [d, b, c], [d, e, c], [a, e, c]],
    [[a, b, f], [d, b, f], [d, e, f], [a, e, f]],
    [[a, b, c], [d, b, c], [d, b, f], [a, b, f]],
    [[a, e, c], [d, e, c], [d, e, f], [a, e, f]],
    [[a, b, c], [a, e, c], [a, e, f], [a, b, f]],
    [[d, b, c], [d, e, c], [d, e, f], [d, b, f]],
  ]
}

/** I 12 spigoli del box (per la cornice e gli assi). */
export function boxEdges(box: Box3): [Vec3, Vec3][] {
  const xs = box.x
  const ys = box.y
  const zs = box.z
  const out: [Vec3, Vec3][] = []
  for (const y of ys) for (const z of zs) out.push([[xs[0], y, z], [xs[1], y, z]])
  for (const x of xs) for (const z of zs) out.push([[x, ys[0], z], [x, ys[1], z]])
  for (const x of xs) for (const y of ys) out.push([[x, y, zs[0]], [x, y, zs[1]]])
  return out
}

/**
 * Ellissoide di livello (p − m)ᵗΣ⁻¹(p − m) = k² come maglia di quadrilateri (nu meridiani × nv paralleli), dagli
 * autovettori e autovalori di Σ (Jacobi): p = m + k Σ_i √λ_i e_i s_i con s sulla sfera unitaria.
 */
export function ellipsoidMesh(m: Vec3, S: Mat, k = 1, nu = 24, nv = 12): Vec3[][] {
  const { values, vectors } = eigSym(S)
  if (values.some((l) => l < -1e-12 * Math.abs(values[0]))) throw err('ellipsoidMesh', 'Σ non è semidefinita positiva')
  const r = values.map((l) => k * Math.sqrt(Math.max(0, l)))
  const at = (theta: number, phi: number): Vec3 => {
    const s = [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)]
    const p = [m[0], m[1], m[2]]
    for (let a = 0; a < 3; a++) for (let c = 0; c < 3; c++) p[c] += r[a] * s[a] * vectors[a][c]
    return [p[0], p[1], p[2]]
  }
  const quads: Vec3[][] = []
  for (let b = 0; b < nv; b++) {
    const p0 = (Math.PI * b) / nv
    const p1 = (Math.PI * (b + 1)) / nv
    for (let a = 0; a < nu; a++) {
      const t0 = (2 * Math.PI * a) / nu
      const t1 = (2 * Math.PI * (a + 1)) / nu
      quads.push([at(t0, p0), at(t1, p0), at(t1, p1), at(t0, p1)])
    }
  }
  return quads
}

/** Punto del piano proiettato sul pavimento del box (ombra verticale di un punto 3D). */
export const floorShadow = (p: Vec3, box: Box3): Vec3 => [p[0], p[1], box.z[0]]

/** Proiezione di un punto su una parete del box (ombre sulle pareti di m06-nuvola-3d-proiezioni). */
export function wallShadow(p: Vec3, box: Box3, wall: 'x' | 'y' | 'z', side: 0 | 1 = 0): Vec3 {
  if (wall === 'x') return [box.x[side], p[1], p[2]]
  if (wall === 'y') return [p[0], box.y[side], p[2]]
  return [p[0], p[1], box.z[side]]
}

/** Un segmento 2-D del piano (una curva di livello di marchingSquares) alla quota z, pronto per la proiezione. */
export const liftSegment = (seg: readonly [Vec2, Vec2], z: number): [Vec3, Vec3] => [
  [seg[0][0], seg[0][1], z],
  [seg[1][0], seg[1][1], z],
]
