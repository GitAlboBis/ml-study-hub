import { describe, expect, it } from 'vitest'
import { linspace, trapz } from '../../lib/ml/stats'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  HOLE_X,
  PROBE0,
  SAMPLES0,
  STEP,
  STEPS,
  TEX_EPAN,
  TEX_LIVE,
  captionFor,
  estimateAt,
  gridFor,
  judge,
  sceneAt,
  sceneEstimate,
  shapeAt,
  weightsTable,
  zeroRuns,
} from './conteggio-interp'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'

const f3 = (v: number) => v.toFixed(3)

describe('conteggio-interp: i numeri dell\'inventario (x = 4.5, h = 1)', () => {
  it('la tabella dei pesi: rettangolare 0/1/0, triangolare 0/0.6/0, Epanechnikov 0/0.63/0, gaussiano 0.171/0.368/0.130', () => {
    const t = weightsTable(PROBE0, SAMPLES0, 1)
    expect(t.map((r) => r.kernel)).toEqual(['rettangolare', 'triangolare', 'epanechnikov', 'gaussiano'])
    expect(t[0].weights).toEqual([0, 1, 0])
    expect(t[1].weights.map((v) => Number(v.toFixed(2)))).toEqual([0, 0.6, 0])
    expect(t[2].weights.map((v) => Number(v.toFixed(2)))).toEqual([0, 0.63, 0])
    expect(t[3].weights.map(f3)).toEqual(['0.171', '0.368', '0.130'])
    expect(t.map((r) => f3(r.p))).toEqual(['0.333', '0.200', '0.210', '0.223'])
  })

  it('il buco a metà fra 4.1 e 6.0 °C: col rettangolo p̂(5.05) = 0, col gaussiano 0.193', () => {
    expect(estimateAt(HOLE_X, SAMPLES0, 1, 'rettangolare')).toBe(0)
    expect(f3(estimateAt(HOLE_X, SAMPLES0, 1, 'gaussiano'))).toBe('0.193')
  })

  it('la zona zero del rettangolo fra le letture c\'è, quella del gaussiano no', () => {
    const xs = gridFor(SAMPLES0, 1)
    const rect = sceneEstimate(xs, SAMPLES0, 1, { from: 'rettangolare', to: 'rettangolare', t: 1, until: Infinity, probe: null, label: 'conteggio' })
    const runs = zeroRuns(xs, rect, SAMPLES0)
    expect(runs).toHaveLength(1)
    expect(runs[0][0]).toBeCloseTo(4.6, 6)
    expect(runs[0][1]).toBeCloseTo(5.5, 6)
    const gauss = sceneEstimate(xs, SAMPLES0, 1, { from: 'gaussiano', to: 'gaussiano', t: 1, until: Infinity, probe: null, label: 'interpolazione' })
    expect(zeroRuns(xs, gauss, SAMPLES0)).toEqual([])
  })
})

describe('conteggio-interp: il morphing', () => {
  it('a ogni istante la finestra è una densità (area 1) e la stima ha area 1', () => {
    const us = linspace(-6, 6, 12001)
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expect(trapz(us, us.map(shapeAt('rettangolare', 'triangolare', t)))).toBeCloseTo(1, 2)
      expect(trapz(us, us.map(shapeAt('epanechnikov', 'gaussiano', t)))).toBeCloseTo(1, 2)
    }
  })

  it('i passi del morphing partono dal kernel precedente e arrivano al successivo; la penna ridisegna dopo', () => {
    const start = sceneAt(STEP.tri, 0, 'rettangolare')
    expect([start.from, start.to, start.t]).toEqual(['rettangolare', 'triangolare', 0])
    expect(start.until).toBe(0)
    const end = sceneAt(STEP.gauss, 1, 'rettangolare')
    expect([end.from, end.to, end.t, end.until]).toEqual(['epanechnikov', 'gaussiano', 1, Infinity])
    expect(sceneAt(STEP.buco, 1, 'gaussiano').probe).toBe(HOLE_X)
    // l'ultimo passo restituisce il kernel dell'utente
    expect(sceneAt(STEP.tabella, 1, 'triangolare').to).toBe('triangolare')
  })
})

describe('conteggio-interp: sfida tarata', () => {
  it('in x = 5: pesa di più 4.1 °C con γ = 0.266 (6.0: 0.242, 3.2: 0.079), p̂(5) = 0.196', () => {
    const v = judge({ heaviest: 1, gamma: 0.266, p: 0.196 })
    expect(v.weights.map(f3)).toEqual(['0.079', '0.266', '0.242'])
    expect(f3(v.p)).toBe('0.196')
    expect(v.ok).toBe(true)
  })

  it('lo stato iniziale e le risposte sbagliate non la superano', () => {
    expect(judge({ heaviest: null, gamma: 0, p: 0 }).ok).toBe(false)
    expect(judge({ heaviest: 2, gamma: 0.266, p: 0.196 }).ok).toBe(false)
    expect(judge({ heaviest: 1, gamma: 0.3, p: 0.196 }).ok).toBe(false)
  })
})

describe('conteggio-interp: testi', () => {
  it('formule e didascalie compilano', () => {
    expectTexCompiles(TEX_LIVE)
    expectTexCompiles(TEX_EPAN)
    expect(TEX_LIVE).toContain(String.raw`\hat{p}(x)&=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h}\gamma\left(\frac{x-x_k}{h}\right)`)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { x: '4.50', h: '1.00', p: '0.333', pRect: '0', kernel: 'gaussiano' }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
    expect(captionFor(STEP.riempito, { x: '5.05', h: '1.00', p: '0.193', pRect: '0', kernel: 'gaussiano' })).toContain('each sample contributing')
  })
})
