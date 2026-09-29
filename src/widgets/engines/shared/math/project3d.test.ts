import { describe, expect, it } from 'vitest'
import { sampleGrid } from './grid'
import { inverse, quadForm } from './linalg'
import {
  boxEdges, boxFaces, createCamera, ellipsoidMesh, faceNormal, orbit, paintersSort, polygonFaces, radians, surfaceFaces,
} from './project3d'
import type { Box3 } from './project3d'

const BOX: Box3 = { x: [-2, 2], y: [-2, 2], z: [0, 0.2] }
const VP = { width: 400, height: 300, margin: 10 }

describe('camera orbitale', () => {
  it('di lato (az = 0, el = 0): x a destra, z in alto, y lontano', () => {
    const cam = createCamera(BOX, { azimuth: 0, elevation: 0 }, VP)
    const c = cam.project([0, 0, 0.1])
    expect(c.x).toBeCloseTo(200, 10)
    expect(c.y).toBeCloseTo(150, 10)
    expect(cam.project([2, 0, 0.1]).x).toBeGreaterThan(200)
    expect(cam.project([0, 0, 0.2]).y).toBeLessThan(150)
    expect(cam.project([0, 2, 0.1]).depth).toBeGreaterThan(cam.project([0, -2, 0.1]).depth)
    // di lato la profondità non sposta il punto sullo schermo (ortografica)
    expect(cam.project([0, 2, 0.1]).x).toBeCloseTo(200, 10)
  })
  it('dall\'alto (el = 90°): y lontano va in alto, il punto più alto è il più vicino', () => {
    const cam = createCamera(BOX, { azimuth: 0, elevation: radians(90) }, VP)
    expect(cam.project([0, 2, 0]).y).toBeLessThan(cam.project([0, -2, 0]).y)
    expect(cam.project([0, 0, 0.2]).depth).toBeLessThan(cam.project([0, 0, 0]).depth)
  })
  it('azimut di 90°: l\'asse x ruota verso la profondità', () => {
    const cam = createCamera(BOX, { azimuth: radians(90), elevation: 0 }, VP)
    expect(cam.project([2, 0, 0.1]).x).toBeCloseTo(200, 10)
    expect(cam.project([0, 2, 0.1]).x).toBeLessThan(200)
  })
  it('la scala non dipende dalla rotazione: il box sta sempre nel riquadro', () => {
    const corners = [0, 1].flatMap((a) => [0, 1].flatMap((b) => [0, 1].map((c) => [BOX.x[a], BOX.y[b], BOX.z[c]] as const)))
    for (let az = 0; az < 360; az += 23) {
      for (let el = -80; el <= 90; el += 17) {
        const cam = createCamera(BOX, { azimuth: radians(az), elevation: radians(el) }, VP)
        expect(cam.scale).toBe(createCamera(BOX, { azimuth: 0, elevation: 0 }, VP).scale)
        for (const p of corners) {
          const s = cam.project(p)
          expect(s.x).toBeGreaterThanOrEqual(10 - 1e-9)
          expect(s.x).toBeLessThanOrEqual(390 + 1e-9)
          expect(s.y).toBeGreaterThanOrEqual(10 - 1e-9)
          expect(s.y).toBeLessThanOrEqual(290 + 1e-9)
        }
      }
    }
  })
  it('prospettica: lo stesso segmento vicino sembra più lungo che lontano', () => {
    const cam = createCamera(BOX, { azimuth: 0, elevation: radians(20), distance: 2.5 }, VP)
    const len = (y: number) => Math.abs(cam.project([1, y, 0]).x - cam.project([-1, y, 0]).x)
    expect(len(-2)).toBeGreaterThan(len(2))
  })
  it('clic sul pavimento: unprojectToPlane inverte project, ortografica e prospettica', () => {
    for (const distance of [undefined, 3]) {
      const cam = createCamera(BOX, { azimuth: radians(-35), elevation: radians(30), distance }, VP)
      for (const p of [[0.5, -1.2], [-1.7, 1.9], [0, 0]] as const) {
        const s = cam.project([p[0], p[1], 0])
        const back = cam.unprojectToPlane(s.x, s.y, 0)!
        expect(back[0]).toBeCloseTo(p[0], 9)
        expect(back[1]).toBeCloseTo(p[1], 9)
        expect(back[2]).toBe(0)
      }
    }
    expect(createCamera(BOX, { azimuth: 0, elevation: 0 }, VP).unprojectToPlane(200, 150, 0)).toBeNull()
  })
  it('orbit: frecce che cambiano azimut ed elevazione, con l\'elevazione nei limiti', () => {
    const s = orbit({ azimuth: 0, elevation: radians(80) }, radians(10), radians(30), [radians(-10), radians(89)])
    expect(s.azimuth).toBeCloseTo(radians(10), 14)
    expect(s.elevation).toBeCloseTo(radians(89), 14)
    expect(orbit({ azimuth: radians(355), elevation: 0 }, radians(10), 0).azimuth).toBeCloseTo(radians(5), 12)
  })
})

describe('algoritmo del pittore', () => {
  it('superficie z = f(x, y): (nx − 1)(ny − 1) facce, dalla più lontana alla più vicina', () => {
    const g = sampleGrid((x, y) => 0.2 * Math.exp(-(x * x + y * y)), [-2, 2], [-2, 2], 11, 9)
    const cam = createCamera(BOX, { azimuth: radians(-30), elevation: radians(35) }, VP)
    const faces = surfaceFaces(g, cam)
    expect(faces).toHaveLength(10 * 8)
    for (let k = 1; k < faces.length; k++) expect(faces[k].depth).toBeLessThanOrEqual(faces[k - 1].depth)
    for (const f of faces) {
      expect(f.pts).toHaveLength(4)
      expect(f.shade).toBeGreaterThanOrEqual(0)
      expect(f.shade).toBeLessThanOrEqual(1)
    }
    // la faccia più vicina è nell'angolo verso l'osservatore (y piccolo)
    expect(faces.at(-1)!.i).toBe(0)
  })
  it('le quote oltre il box si tagliano al tetto e la faccia lo dice', () => {
    const g = sampleGrid(() => 5, [-2, 2], [-2, 2], 3)
    const cam = createCamera(BOX, { azimuth: 0, elevation: radians(30) }, VP)
    const faces = surfaceFaces(g, cam)
    expect(faces.every((f) => f.clipped)).toBe(true)
    const top = cam.project([-2, -2, 0.2])
    expect(faces.some((f) => f.pts.some((p) => Math.abs(p[0] - top.x) < 1e-9 && Math.abs(p[1] - top.y) < 1e-9))).toBe(true)
  })
  it('quote non finite: −∞ va al pavimento (un pozzo, non uno spuntone), +∞ al tetto, NaN lascia un buco', () => {
    // una log-verosimiglianza con ln 0 = −∞ lungo x = 0
    const g = sampleGrid((x) => (x === 0 ? Number.NEGATIVE_INFINITY : 0.1), [-2, 2], [-2, 2], 5)
    const cam = createCamera(BOX, { azimuth: radians(-30), elevation: radians(35) }, VP)
    const faces = surfaceFaces(g, cam)
    expect(faces).toHaveLength(16)
    const touching = faces.filter((f) => f.j === 1 || f.j === 2)
    expect(touching.every((f) => f.clipped)).toBe(true)
    // due vertici su quattro al pavimento (0), due a 0.1: quota media 0.05, mai sopra il resto della superficie
    for (const f of touching) expect(f.zMean).toBeCloseTo(0.05, 12)
    for (const f of faces.filter((f) => f.j === 0 || f.j === 3)) {
      expect(f.zMean).toBeCloseTo(0.1, 12)
      expect(f.clipped).toBe(false)
    }
    const up = surfaceFaces(sampleGrid((x) => (x === 0 ? Number.POSITIVE_INFINITY : 0.1), [-2, 2], [-2, 2], 5), cam)
    for (const f of up.filter((f) => f.j === 1)) expect(f.zMean).toBeCloseTo(0.15, 12)
    // NaN: la quota non esiste, le facce che toccano quel nodo mancano
    const hole = surfaceFaces(sampleGrid((x, y) => (x === 0 && y === 0 ? Number.NaN : 0.1), [-2, 2], [-2, 2], 5), cam)
    expect(hole).toHaveLength(12)
    expect(hole.some((f) => (f.i === 1 || f.i === 2) && (f.j === 1 || f.j === 2))).toBe(false)
    for (const f of hole) expect(Number.isFinite(f.zMean) && f.pts.flat().every(Number.isFinite)).toBe(true)
  })
  it('ordinamento stabile e generico; normale di un triangolo', () => {
    const items = [{ depth: 1, id: 'a' }, { depth: 3, id: 'b' }, { depth: 1, id: 'c' }]
    expect(paintersSort(items).map((i) => i.id)).toEqual(['b', 'a', 'c'])
    const n = faceNormal([0, 0, 0], [1, 0, 0], [0, 1, 0])
    expect(n).toEqual([0, 0, 1])
  })
  it('blocchi e poligoni qualsiasi: sei facce per box, ordinate per profondità', () => {
    const faces = boxFaces([-1, -1, 0], [1, 1, 0.1])
    expect(faces).toHaveLength(6)
    const cam = createCamera(BOX, { azimuth: radians(20), elevation: radians(30) }, VP)
    const sorted = polygonFaces(faces.map((pts, k) => ({ pts, tag: k })), cam)
    expect(sorted).toHaveLength(6)
    for (let k = 1; k < sorted.length; k++) expect(sorted[k].depth).toBeLessThanOrEqual(sorted[k - 1].depth)
    expect(boxEdges(BOX)).toHaveLength(12)
  })
  it('ellissoide di livello k: tutti i vertici a distanza di Mahalanobis k', () => {
    const S = [[2, 0.5, 0], [0.5, 1, 0.3], [0, 0.3, 0.8]] as const
    const quads = ellipsoidMesh([1, 0, 2], S, 1.5, 12, 8)
    expect(quads.length).toBe(12 * 8)
    const Si = inverse(S)!
    for (const q of quads) for (const p of q) expect(quadForm(Si, [p[0] - 1, p[1], p[2] - 2])).toBeCloseTo(2.25, 9)
  })
})
