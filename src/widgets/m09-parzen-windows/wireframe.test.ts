import { describe, expect, it } from 'vitest'
import { fit, mesh, project, rotate, volume } from './wireframe'

describe('wireframe: proiezione', () => {
  it('dall\'alto (elevazione 90°) la base è un quadrato e la quota non conta', () => {
    const top = { azimuth: 0, elevation: 90 }
    expect(project(1, 0, 0, top)[0]).toBeCloseTo(1, 12)
    const [x0, y0] = project(0.3, 0.4, 0, top)
    const [x1, y1] = project(0.3, 0.4, 1, top)
    expect(x1).toBeCloseTo(x0, 12)
    expect(y1).toBeCloseTo(y0, 12)
  })

  it('di lato (elevazione 0°) la quota sale verso l\'alto dello schermo', () => {
    const side = { azimuth: 0, elevation: 0 }
    expect(project(0, 0, 1, side)[1]).toBeLessThan(project(0, 0, 0, side)[1])
  })

  it('il riquadro contiene la base, la cima al centro e 0.6 della cima sugli spigoli, per ogni azimut', () => {
    const box = { width: 300, height: 200, pad: 10 }
    for (const azimuth of [0, 30, 45, 90, 200]) {
      const view = { azimuth, elevation: 30 }
      const place = fit(view, box)
      for (const [u, v, w] of [
        [-1, -1, 0],
        [1, 1, 0],
        [1, -1, 0.6],
        [-1, -1, 0.6],
        [0, 0, 1],
      ] as const) {
        const [x, y] = place(project(u, v, w, view))
        expect(x).toBeGreaterThanOrEqual(10 - 1e-9)
        expect(x).toBeLessThanOrEqual(290 + 1e-9)
        expect(y).toBeGreaterThanOrEqual(10 - 1e-9)
        expect(y).toBeLessThanOrEqual(190 + 1e-9)
      }
    }
  })

  it('il reticolo ha 2n polilinee di m punti e la base ha 4 spigoli', () => {
    const m = mesh(() => 0.1, [-2, 2], [-2, 2], 0.2, { azimuth: 30, elevation: 30 }, { width: 300, height: 200 }, 11, 21)
    expect(m.lines).toHaveLength(22)
    expect(m.lines[0]).toHaveLength(21)
    expect(m.base).toHaveLength(4)
  })

  it('la rotazione resta in [0, 360)', () => {
    expect(rotate(350, 15)).toBe(5)
    expect(rotate(5, -15)).toBe(350)
  })
})

describe('wireframe: volume', () => {
  it('la finestra normale 2-D ha volume 1 su tutto il piano', () => {
    const h = 0.5
    const f = (x: number, y: number) => Math.exp(-(x * x + y * y) / (2 * h * h)) / (2 * Math.PI * h * h)
    expect(volume(f, [-6 * h, 6 * h], [-6 * h, 6 * h])).toBeCloseTo(1, 4)
  })
})
