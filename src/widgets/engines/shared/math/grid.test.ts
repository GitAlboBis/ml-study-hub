import { describe, expect, it } from 'vitest'
import { gridIntegral, gridRange, labelFractions, labelGrid, marchingSquares, sampleGrid } from './grid'

describe('griglia di nodi', () => {
  it('estremi inclusi, riga i = y costante, valori per righe', () => {
    const g = sampleGrid((x, y) => 10 * y + x, [0, 2], [0, 1], 3, 2)
    expect(g.xs).toEqual([0, 1, 2])
    expect(g.ys).toEqual([0, 1])
    expect(Array.from(g.values)).toEqual([0, 1, 2, 10, 11, 12])
  })
  it('integrale 2-D con i trapezi: ∫∫ di una gaussiana standard su [−6, 6]² ≈ 1', () => {
    const g = sampleGrid((x, y) => Math.exp(-(x * x + y * y) / 2) / (2 * Math.PI), [-6, 6], [-6, 6], 121)
    expect(gridIntegral(g)).toBeCloseTo(1, 6)
    expect(gridRange(g.values)[1]).toBeCloseTo(1 / (2 * Math.PI), 12)
  })
})

describe('griglia di celle per le regioni', () => {
  it('centri delle celle come BoundaryCanvas: colonna i da sinistra, riga j dall\'alto', () => {
    const seen: [number, number][] = []
    const lg = labelGrid((x, y) => {
      seen.push([x, y])
      return x > 0 ? 1 : 0
    }, [-1, 1], [0, 1], 4, 2)
    expect(lg.cols).toBe(4)
    expect(lg.rows).toBe(2)
    expect(seen[0]).toEqual([-0.75, 0.75])
    expect(seen[4]).toEqual([-0.75, 0.25])
    expect(Array.from(lg.labels)).toEqual([0, 0, 1, 1, 0, 0, 1, 1])
    expect(lg.cellArea).toBeCloseTo(0.5 * 0.5, 14)
  })
  it('frazioni per classe, con il rifiuto (−1) contato a parte', () => {
    const lg = labelGrid((x) => (x < -0.5 ? -1 : x < 0.5 ? 0 : 2), [-1, 1], [0, 1], 8, 1)
    const f = labelFractions(lg.labels)
    expect(f.get(-1)).toBeCloseTo(0.25, 14)
    expect(f.get(0)).toBeCloseTo(0.5, 14)
    expect(f.get(2)).toBeCloseTo(0.25, 14)
  })
})

describe('marching squares', () => {
  it('curva di livello di una funzione lineare: segmenti tutti su x = 0.3', () => {
    const g = sampleGrid((x) => x, [-1, 1], [-1, 1], 11)
    const segs = marchingSquares(g, 0.3)
    expect(segs.length).toBe(10)
    for (const [a, b] of segs) {
      expect(a[0]).toBeCloseTo(0.3, 12)
      expect(b[0]).toBeCloseTo(0.3, 12)
    }
  })
  it('x² + y² = 1: punti sul cerchio unitario e lunghezza 2π', () => {
    const g = sampleGrid((x, y) => x * x + y * y, [-2, 2], [-2, 2], 81)
    const segs = marchingSquares(g, 1)
    let len = 0
    for (const [a, b] of segs) {
      expect(Math.hypot(a[0], a[1])).toBeCloseTo(1, 2)
      len += Math.hypot(b[0] - a[0], b[1] - a[1])
    }
    expect(len / (2 * Math.PI)).toBeCloseTo(1, 2)
  })
  it('livello fuori dal campo: nessun segmento', () => {
    const g = sampleGrid((x, y) => x * x + y * y, [-1, 1], [-1, 1], 11)
    expect(marchingSquares(g, 5)).toEqual([])
  })
})
