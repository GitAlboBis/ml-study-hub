import { describe, expect, it } from 'vitest'
import {
  ANSWER,
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  KERNEL_TEX,
  SAMPLES,
  SNIPPETS,
  STEPS,
  TEX_GAUSS_EST,
  TEX_LIVE,
  captionFor,
  checklist,
  estimateArea,
  formulaOk,
  judge,
  kernelFn,
  smoothness,
  tabOfStep,
} from './galleria-base'
import { expectRichCompiles, expectTexCompiles } from './parzen-lab-testing'

describe('galleria-base: i dati', () => {
  it('25 frazioni di pixel accesi fra 0.30 e 0.55', () => {
    expect(SAMPLES).toHaveLength(25)
    for (const v of SAMPLES) {
      expect(v).toBeGreaterThanOrEqual(0.3)
      expect(v).toBeLessThanOrEqual(0.55)
    }
  })
})

describe('galleria-base: le tre schede', () => {
  it('area 1, massimo nell\'origine, decadimento: per tutti e tre; continuità solo triangolo e gaussiana', () => {
    for (const k of ['rettangolare', 'triangolare', 'gaussiano'] as const) {
      const c = checklist(k)
      expect(c.area, k).toBeCloseTo(1, 3)
      expect(c.maxAtOrigin).toBe(true)
      expect(c.decays).toBe(true)
    }
    expect(checklist('rettangolare').continuous).toBe(false)
    expect(checklist('triangolare').continuous).toBe(true)
    expect(checklist('triangolare').differentiable).toBe(false)
    expect(checklist('gaussiano').differentiable).toBe(true)
  })

  it('i valori notevoli: picchi 1, 1 e 0.399', () => {
    expect(kernelFn('rettangolare')(0)).toBe(1)
    expect(kernelFn('triangolare')(0)).toBe(1)
    expect(kernelFn('gaussiano')(0).toFixed(3)).toBe('0.399')
  })

  it('il rettangolo alto 1/2: area 0.5, e la stima integra a 0.5', () => {
    expect(checklist('rettangolare', true).area).toBeCloseTo(0.5, 3)
    expect(estimateArea(0.03, 'rettangolare', true)).toBeCloseTo(0.5, 3)
    expect(estimateArea(0.03, 'gaussiano')).toBeCloseTo(1, 3)
  })

  it('la lente in parole', () => {
    expect(smoothness('rettangolare')).toBe('discontinua')
    expect(smoothness('triangolare')).toBe('continua ma non derivabile')
    expect(smoothness('gaussiano')).toBe('continua e derivabile')
  })

  it('il racconto impone le schede nei suoi passi', () => {
    expect(tabOfStep(0)).toBeNull()
    expect(tabOfStep(1)).toBe('rettangolare')
    expect(tabOfStep(6)).toBe('comune')
  })
})

describe('galleria-base: sfida', () => {
  it('la formula è giusta solo con le tessere al loro posto', () => {
    expect(formulaOk(ANSWER)).toBe(true)
    expect(formulaOk({ ...ANSWER, num: 'due', bottom: 'uno' })).toBe(false)
    expect(formulaOk({})).toBe(false)
  })

  it('tre riconoscimenti giusti e la formula superano la sfida', () => {
    const right = Object.fromEntries(SNIPPETS.map((s) => [s.id, s.kernel])) as Record<'A' | 'B' | 'C', 'rettangolare' | 'triangolare' | 'gaussiano'>
    expect(judge(right, ANSWER).ok).toBe(true)
    expect(judge(right, {}).ok).toBe(false)
    expect(judge({ ...right, A: 'gaussiano' }, ANSWER).ok).toBe(false)
  })

  it('formule e didascalie compilano', () => {
    for (const tex of [...Object.values(KERNEL_TEX), TEX_GAUSS_EST, TEX_LIVE]) expectTexCompiles(tex)
    for (let i = 0; i < STEPS.length; i++) expectRichCompiles(captionFor(i, { h: '0.030', k: 'gaussiano', lens: 'continua e derivabile' }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
  })
})
