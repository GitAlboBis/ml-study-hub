import { describe, expect, it } from 'vitest'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  H0,
  SAMPLES0,
  STEPS,
  TEX_BOTH,
  TEX_COUNT,
  TEX_RECT,
  TEX_SYMMETRY,
  X0,
  captionFor,
  countK,
  covering,
  estimateAt,
  ghostAt,
  judge,
  maxIntervals,
  snap,
  staircase,
  staircaseArea,
  sweepAt,
  texContributions,
} from './due-viste'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'

describe('due-viste: i numeri dell\'inventario', () => {
  it('x* = 4.0, h = 1.5: dentro 3.4, 3.9, 4.3, K = 3 e p̂ = 3/(8 · 1.5) = 0.250', () => {
    expect(covering(X0, SAMPLES0, H0).map((k) => SAMPLES0[k])).toEqual([3.4, 3.9, 4.3])
    expect(countK(X0, SAMPLES0, H0)).toBe(3)
    expect(estimateAt(X0, SAMPLES0, H0).toFixed(3)).toBe('0.250')
    expect((1 / (8 * 1.5)).toFixed(3)).toBe('0.083')
  })

  it('le due viste danno lo stesso numero in ogni x (la curva a gradini è la somma dei rettangoli)', () => {
    const { xs, ys } = staircase(SAMPLES0, H0)
    for (let i = 0; i < xs.length; i += 7) {
      // sui bordi esatti la griglia ha tre punti: il conteggio chiuso coincide con il punto sul bordo
      expect(ys[i]).toBeCloseTo(estimateAt(xs[i], SAMPLES0, H0), 12)
    }
  })

  it('l\'area sotto la curva resta 1 per ogni h (nessun rettangolo esce dal dominio)', () => {
    for (const h of [0.2, 0.7, 1.5, 3, 4]) expect(staircaseArea(SAMPLES0, h)).toBeCloseTo(1, 6)
  })

  it('il gradino più alto: K = 4 per x* fra 3.55 e 3.65, p̂ = 4/(8 · 1.5) = 0.333', () => {
    const top = maxIntervals(SAMPLES0, H0)
    expect(top).toHaveLength(1)
    expect(top[0].K).toBe(4)
    expect(top[0].from).toBeCloseTo(3.55, 9)
    expect(top[0].to).toBeCloseTo(3.65, 9)
    expect(estimateAt(3.6, SAMPLES0, H0).toFixed(3)).toBe('0.333')
  })
})

describe('due-viste: racconto', () => {
  it('i fantasmi partono sfalsati e arrivano tutti a fine passo', () => {
    expect(ghostAt(0, 0, 8)).toBe(0)
    expect(ghostAt(0.3, 7, 8)).toBe(0)
    for (let k = 0; k < 8; k++) expect(ghostAt(1, k, 8)).toBe(1)
    expect(ghostAt(0.5, 0, 8)).toBeGreaterThan(ghostAt(0.5, 7, 8))
  })

  it('la penna va da 0 a 10; un clic si arrotonda a 0.05 dentro il dominio', () => {
    expect(sweepAt(0)).toBe(0)
    expect(sweepAt(1)).toBe(10)
    expect(snap(3.337)).toBe(3.35)
    expect(snap(12)).toBe(10)
  })
})

describe('due-viste: sfida tarata', () => {
  const coverAt = (x: number) => covering(x, SAMPLES0, H0)

  it('lo stato iniziale non la supera', () => {
    expect(judge({ samples: SAMPLES0, h: H0, x: X0, chosen: [], from: 0, to: 0, K: 0 }).ok).toBe(false)
  })

  it('un x* con K = 2, i suoi due rettangoli e l\'intervallo [3.55, 3.65] con K = 4 la superano', () => {
    const x = 5.6
    expect(coverAt(x).map((k) => SAMPLES0[k])).toEqual([5.0, 6.2])
    expect(estimateAt(x, SAMPLES0, H0).toFixed(3)).toBe('0.167')
    const v = judge({ samples: SAMPLES0, h: H0, x, chosen: coverAt(x), from: 3.55, to: 3.65, K: 4 })
    expect(v.ok).toBe(true)
  })

  it('i rettangoli sbagliati, un h diverso o un intervallo sbagliato non bastano', () => {
    expect(judge({ samples: SAMPLES0, h: H0, x: 5.6, chosen: [4, 5], from: 3.55, to: 3.65, K: 4 }).part1.ok).toBe(false)
    expect(judge({ samples: SAMPLES0, h: 1.6, x: 5.6, chosen: coverAt(5.6), from: 3.55, to: 3.65, K: 4 }).ok).toBe(false)
    expect(judge({ samples: SAMPLES0, h: H0, x: 5.6, chosen: coverAt(5.6), from: 3.4, to: 3.65, K: 4 }).part2.ok).toBe(false)
  })
})

describe('due-viste: testi', () => {
  it('formule e didascalie compilano con la notazione del docente', () => {
    for (const tex of [TEX_COUNT, TEX_BOTH, TEX_SYMMETRY, TEX_RECT, texContributions(0), texContributions(3), texContributions(9)]) expectTexCompiles(tex)
    expect(TEX_BOTH).toContain(String.raw`\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h}\gamma\left(\frac{x_k-x^*}{h}\right)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h}\gamma\left(\frac{x^*-x_k}{h}\right)`)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { K: 3, N: 8, h: '1.5', p: '0.250', w: '0.083', x: '4.00' }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
    expect(captionFor(3, { K: 3, N: 8, h: '1.5', p: '0.250', w: '0.083', x: '4.00' })).toContain(String.raw`\gamma(u) = \gamma(-u)`)
  })
})
