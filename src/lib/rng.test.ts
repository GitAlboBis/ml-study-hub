import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('è deterministico per seed', () => {
    const a = createRng(42), b = createRng(42)
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()])
  })
  it('int rispetta gli estremi inclusi', () => {
    const r = createRng(1)
    const xs = Array.from({ length: 2000 }, () => r.int(3, 5))
    expect(Math.min(...xs)).toBe(3)
    expect(Math.max(...xs)).toBe(5)
  })
  it('normal ha media e varianza corrette', () => {
    const r = createRng(7)
    const xs = Array.from({ length: 20000 }, () => r.normal(2, 3))
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length
    const v = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length
    expect(mean).toBeCloseTo(2, 1)
    expect(Math.sqrt(v)).toBeCloseTo(3, 1)
  })
  it('shuffle non perde elementi', () => {
    expect(createRng(3).shuffle([1, 2, 3, 4]).sort()).toEqual([1, 2, 3, 4])
  })

  it('next sta in [0, 1)', () => {
    const r = createRng(5)
    const xs = Array.from({ length: 5000 }, () => r.next())
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...xs)).toBeLessThan(1)
  })

  it('int restituisce solo interi e tocca ogni valore dell\'intervallo', () => {
    const r = createRng(9)
    const xs = Array.from({ length: 2000 }, () => r.int(-2, 2))
    expect(xs.filter((x) => !Number.isInteger(x))).toEqual([])
    expect([...new Set(xs)].sort((a, b) => a - b)).toEqual([-2, -1, 0, 1, 2])
  })

  it('float senza decimals sta in [min, max)', () => {
    const r = createRng(13)
    const xs = Array.from({ length: 5000 }, () => r.float(-3, 7))
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-3)
    expect(Math.max(...xs)).toBeLessThan(7)
  })

  it('float con decimals rispetta estremi e arrotondamento', () => {
    const r = createRng(11)
    const xs = Array.from({ length: 5000 }, () => r.float(1, 2, 2))
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(1)
    expect(Math.max(...xs)).toBeLessThanOrEqual(2)
    expect(xs.filter((x) => x !== Number(x.toFixed(2)))).toEqual([])

    // con 1 decimale escono tutti e soli i valori della griglia, estremi compresi
    const ys = Array.from({ length: 5000 }, () => r.float(0, 1, 1))
    expect([...new Set(ys)].sort((a, b) => a - b)).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])

    // decimals = 0 produce interi
    const zs = Array.from({ length: 2000 }, () => r.float(10, 20, 0))
    expect(zs.filter((z) => !Number.isInteger(z) || z < 10 || z > 20)).toEqual([])
  })

  it('float con estremi non allineati ai decimali non esce da [min, max]', () => {
    const r = createRng(17)
    // caso reale: una sigma con 1 decimale in [0.01, 1] non deve mai valere 0
    const xs = Array.from({ length: 5000 }, () => r.float(0.01, 1, 1))
    expect(Math.min(...xs)).toBe(0.1)
    expect(Math.max(...xs)).toBe(1)

    const ys = Array.from({ length: 5000 }, () => r.float(0.12, 0.88, 1))
    expect([...new Set(ys)].sort((a, b) => a - b)).toEqual([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8])

    // estremi già sulla griglia ma non rappresentabili esattamente in binario (1.1 * 10 = 11.000000000000002)
    const ws = Array.from({ length: 5000 }, () => r.float(1.1, 1.3, 1))
    expect([...new Set(ws)].sort((a, b) => a - b)).toEqual([1.1, 1.2, 1.3])
  })

  it('float con decimals non restituisce mai -0', () => {
    const r = createRng(19)
    const xs = Array.from({ length: 5000 }, () => r.float(-1, 1, 1))
    expect(xs.some((x) => x === 0)).toBe(true)
    expect(xs.filter((x) => Object.is(x, -0))).toEqual([])
  })

  it('pick non esce mai dall\'array', () => {
    const r = createRng(23)
    const pool = ['knn', 'parzen', 'mle', 'map', 'svm'] as const
    const xs = Array.from({ length: 5000 }, () => r.pick(pool))
    expect(xs.filter((x) => !pool.includes(x))).toEqual([])
    expect(new Set(xs).size).toBe(pool.length)
    // un solo elemento: esce sempre quello
    expect(Array.from({ length: 50 }, () => r.pick([7]))).toEqual(Array(50).fill(7))
  })

  it('pick su array vuoto lancia un errore chiaro', () => {
    expect(() => createRng(1).pick([])).toThrow(/vuoto/)
  })

  it('shuffle non modifica l\'input ed è deterministico', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const copy = [...input]
    const a = createRng(31).shuffle(input)
    const b = createRng(31).shuffle(input)
    expect(input).toEqual(copy)
    expect(a).toEqual(b)
    expect(a).not.toBe(input)
    expect(createRng(31).shuffle([])).toEqual([])
  })

  it('due seed diversi danno sequenze diverse', () => {
    const seq = (seed: number) => {
      const r = createRng(seed)
      return Array.from({ length: 10 }, () => r.next())
    }
    expect(seq(1)).not.toEqual(seq(2))
    expect(seq(42)).not.toEqual(seq(43))
    // seed consecutivi (come quelli usati dal validatore, 1..20): primi valori tutti distinti
    const firsts = Array.from({ length: 50 }, (_, seed) => createRng(seed).next())
    expect(new Set(firsts).size).toBe(50)
  })

  it('seed 0 funziona', () => {
    const seq = () => {
      const r = createRng(0)
      return Array.from({ length: 1000 }, () => r.next())
    }
    const xs = seq()
    expect(xs.filter((x) => !(x >= 0 && x < 1))).toEqual([])
    // non è degenere: valori distinti, media vicina a 0.5
    expect(new Set(xs).size).toBeGreaterThan(990)
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length
    expect(mean).toBeGreaterThan(0.45)
    expect(mean).toBeLessThan(0.55)
    // deterministico e diverso dal seed 1
    expect(seq()).toEqual(xs)
    expect(createRng(1).next()).not.toBe(xs[0])
    // anche gli altri metodi restano finiti
    const r = createRng(0)
    expect(Number.isFinite(r.normal())).toBe(true)
    expect(Number.isInteger(r.int(1, 6))).toBe(true)
  })

  it('normal riusa il secondo valore di Box-Muller con i nuovi parametri', () => {
    const a = createRng(37), b = createRng(37)
    a.normal(0, 1)
    b.normal(0, 1)
    const z = a.normal(0, 1)
    expect(b.normal(10, 2)).toBeCloseTo(10 + 2 * z, 10)
  })
})
