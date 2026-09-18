import { describe, expect, it } from 'vitest'
import { defineModule, md } from './types'
import type { ModuleData } from './types'

const moduloMinimo: ModuleData = {
  id: 'm00',
  title: 'Modulo di prova',
  titleEn: 'Test module',
  course: 'melgani',
  chapter: 'Cap. 2',
  order: 0,
  sources: [{ doc: 'ch2', pages: [1, 3] }],
  prerequisites: [],
  estimatedMinutes: 10,
  summary: 'Riassunto di prova con $\\mu$.',
  keyPoints: [],
  glossary: [],
  formulas: [],
  derivations: [],
  figures: [],
  flashcards: [],
  quiz: [],
  exam: [],
  exercises: [],
  widgets: [],
  connections: [],
  coverage: { c01: ['#introduzione'] },
}

describe('md', () => {
  it('restituisce il LaTeX con un solo backslash', () => {
    const latex = md`\hat{\mu}`
    expect(latex).toBe('\\hat{\\mu}')
    expect(latex).toHaveLength(9)
    expect(latex.split('\\')).toHaveLength(3)
  })

  it('interpola i valori senza toccare i backslash', () => {
    const n = 5
    expect(md`\frac{1}{${n}}`).toBe('\\frac{1}{5}')
  })

  it('non interpreta le sequenze di escape come \\n o \\t', () => {
    expect(md`\nabla \theta`).toBe('\\nabla \\theta')
  })
})

describe('defineModule', () => {
  it('restituisce il modulo invariato (stesso riferimento)', () => {
    expect(defineModule(moduloMinimo)).toBe(moduloMinimo)
  })

  it('conserva la mappa di copertura', () => {
    expect(defineModule(moduloMinimo).coverage).toEqual({ c01: ['#introduzione'] })
  })
})
