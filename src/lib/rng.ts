import type { Rng } from '../content/types'

/**
 * Generatore pseudo-casuale a seed (mulberry32): stesso seed, stessa sequenza.
 * Il seed è ridotto a intero senza segno a 32 bit: passare interi (1, 2, 3, Date.now()...).
 * Un seed frazionario come Math.random() viene troncato a 0 e darebbe sempre la stessa sequenza.
 */
export function createRng(seed: number): Rng {
  let s = seed >>> 0 || 0x9e3779b9
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  // Box-Muller: ogni coppia di uniformi dà due normali standard, la seconda resta da parte
  let spare: number | null = null
  const normal = (mu = 0, sigma = 1) => {
    if (spare !== null) { const z = spare; spare = null; return mu + sigma * z }
    let u = 0
    while (u === 0) u = next()
    const v = next()
    const r = Math.sqrt(-2 * Math.log(u))
    spare = r * Math.sin(2 * Math.PI * v)
    return mu + sigma * r * Math.cos(2 * Math.PI * v)
  }
  // tolleranza sugli errori binari dei prodotti (1.1 * 10 = 11.000000000000002)
  const tol = (v: number) => 1e-9 * Math.max(1, Math.abs(v))
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    float: (min, max, decimals) => {
      const x = min + next() * (max - min)
      if (decimals === undefined) return x
      const y = Number(x.toFixed(decimals))
      // l'arrotondamento può uscire da [min, max] se gli estremi hanno più cifre di `decimals`
      // (float(0.01, 1, 1) darebbe 0): si rientra sul primo e sull'ultimo punto della griglia interni
      const p = 10 ** decimals
      const lo = Math.ceil(min * p - tol(min * p)) / p
      const hi = Math.floor(max * p + tol(max * p)) / p
      // se nessun punto della griglia cade in [min, max] resta l'arrotondamento semplice
      const z = lo <= hi ? Math.min(hi, Math.max(lo, y)) : y
      return z === 0 ? 0 : z // mai -0
    },
    normal,
    pick: (xs) => {
      if (xs.length === 0) throw new Error('rng.pick: array vuoto')
      return xs[Math.floor(next() * xs.length)]
    },
    shuffle: (xs) => {
      const a = [...xs]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
  }
}
