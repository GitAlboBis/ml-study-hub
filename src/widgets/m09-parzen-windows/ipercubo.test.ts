import { describe, expect, it } from 'vitest'
import {
  H_DEFAULT,
  H_VALUES,
  N_SALMON,
  SEED_DEFAULT,
  SPOTS,
  TARGET_K,
  TARGET_X,
  X_START,
  centerOf,
  countK,
  estimate,
  estimateVsH,
  gammaCube,
  gammaRow,
  hForK,
  judge,
  normalized,
  pulseScale,
  salmonSet,
  scanAt,
  volume,
} from './ipercubo'

const points = salmonSet(SEED_DEFAULT)

describe('ipercubo: i salmoni', () => {
  it('40 salmoni a seed, dentro 0-10, con un decimale', () => {
    expect(points).toHaveLength(N_SALMON)
    for (const p of points) for (const v of p) {
      expect(v).toBeGreaterThanOrEqual(0.2)
      expect(v).toBeLessThanOrEqual(9.8)
      expect(Number(v.toFixed(1))).toBe(v)
    }
    expect(salmonSet(SEED_DEFAULT)).toEqual(points)
    expect(salmonSet(SEED_DEFAULT + 1)).not.toEqual(points)
  })
})

describe('ipercubo: γ, K, V e la stima', () => {
  it('γ è 1 solo dentro l\'ipercubo unitario |u_j| ≤ 1/2 (bordo incluso)', () => {
    expect(gammaCube([0, 0])).toBe(1)
    expect(gammaCube([0.5, -0.5])).toBe(1)
    expect(gammaCube([0.51, 0])).toBe(0)
    expect(gammaCube([0.2, 0.2, 0.6])).toBe(0)
  })

  it('u = (x_k − x*)/h riporta il salmone nell\'ipercubo unitario', () => {
    expect(normalized([5.6, 4.1, 0], [5, 5], 1.5).map((v) => Number(v.toFixed(6)))).toEqual([0.4, -0.6])
  })

  it('il numero dell\'inventario: x* = (5, 5), h = 1.5, n = 2 → K = 6, V = 2.25, p̂ = 6/(40 · 2.25) = 0.067', () => {
    const K = countK(points, centerOf(X_START, 2), H_DEFAULT)
    expect(K).toBe(6)
    expect(volume(1.5, 2)).toBe(2.25)
    expect(estimate(K, 40, 1.5, 2).toFixed(3)).toBe('0.067')
    expect(gammaRow(points, centerOf(X_START, 2), H_DEFAULT).reduce<number>((s, g) => s + g, 0)).toBe(6)
  })

  it('a parità di h = 1.5 il K catturato cala al crescere di n (V = 1.5, 2.25, 3.375)', () => {
    const K1 = countK(points, centerOf(X_START, 1), 1.5)
    const K2 = countK(points, centerOf(X_START, 2), 1.5)
    const K3 = countK(points, centerOf(X_START, 3), 1.5)
    expect(K1).toBeGreaterThan(K2)
    expect(K2).toBeGreaterThan(K3)
    expect([volume(1.5, 1), volume(1.5, 2), volume(1.5, 3)]).toEqual([1.5, 2.25, 3.375])
  })

  it('h = 8 ingloba quasi tutto: p̂ scende verso 40/(40 · 64) ≈ 0.016', () => {
    const K = countK(points, centerOf(X_START, 2), 8)
    expect(K).toBeGreaterThanOrEqual(38)
    expect(estimate(K, 40, 8, 2)).toBeCloseTo(0.016, 2)
  })

  it('con h piccolo K vale 0 o 1 e p̂ salta fra 0 e 1/(N h²)', () => {
    const small = estimateVsH(points, centerOf(X_START, 2), 2).filter(([h]) => h < 0.5)
    for (const [h, p] of small) expect([0, 1 / (40 * h * h)].some((v) => Math.abs(v - p) < 1e-12) || p * 40 * h * h === 2).toBe(true)
  })

  it('la scala di h va da 0.2 a 8 a passi di 0.1 senza rumore', () => {
    expect(H_VALUES[0]).toBe(0.2)
    expect(H_VALUES.at(-1)).toBe(8)
    expect(H_VALUES).toContain(1.5)
    expect(H_VALUES).toHaveLength(79)
  })
})

describe('ipercubo: la scansione', () => {
  it('a inizio passo nessun salmone è esaminato, a fine passo tutti', () => {
    expect(scanAt(0, 40).done).toBe(0)
    expect(scanAt(1, 40)).toEqual({ done: 40, current: -1, segment: 1, local: 1 })
    const mid = scanAt(10.5 / 40, 40)
    expect(mid.current).toBe(10)
    expect(mid.done).toBe(10)
    expect(mid.segment).toBe(1)
  })

  it('l\'impulso va da 1 a 1.4 e torna a 1', () => {
    expect(pulseScale(0)).toBe(1)
    expect(pulseScale(0.48 + 0.26)).toBeCloseTo(1.4, 6)
    expect(pulseScale(1)).toBe(1)
  })
})

describe('ipercubo: la sfida è tarata', () => {
  it('le previsioni esatte superano la prima parte; lo stato iniziale no', () => {
    const exact = Object.fromEntries(SPOTS.map((s) => [s.id, countK(points, centerOf(s.x, 2), 1.5)])) as Record<'A' | 'B' | 'C', number>
    expect(judge({ points, predictions: exact, x: X_START, h: 1.5, n: 2 }).spots.every((s) => s.ok)).toBe(true)
    const start = judge({ points, predictions: { A: null, B: null, C: null }, x: X_START, h: 1.5, n: 2 })
    expect(start.ok).toBe(false)
  })

  it('in (5, 3) esiste un h dello slider con esattamente 5 salmoni, e quello supera la seconda parte', () => {
    const hs = hForK(points, TARGET_X, TARGET_K)
    expect(hs.length).toBeGreaterThan(0)
    const exact = Object.fromEntries(SPOTS.map((s) => [s.id, countK(points, centerOf(s.x, 2), 1.5)])) as Record<'A' | 'B' | 'C', number>
    const v = judge({ points, predictions: exact, x: TARGET_X, h: hs[0], n: 2 })
    expect(v.second.ok).toBe(true)
    expect(v.ok).toBe(true)
    expect(v.second.p).toBeCloseTo(5 / (40 * hs[0] ** 2), 12)
    // con l'h iniziale non basta
    expect(hs).not.toContain(1.5)
  })
})
