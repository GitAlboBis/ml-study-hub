import { describe, expect, it } from 'vitest'
import { defineModule, md } from '../content/types'
import type { CourseId, Formula, ModuleData } from '../content/types'
import { collectFormulas, filterFormulas, formulaAnchor, formulaFacets, groupFormulas, NO_FILTERS, searchTokens } from './formulario'

const formula = (id: string, name: string, nameEn: string, latex: string, importance: 1 | 2 | 3, symbols: string[] = []): Formula => ({
  id,
  name,
  nameEn,
  latex,
  explain: '',
  symbols: symbols.map((s) => ({ s, meaning: 'un simbolo' })),
  importance,
  blanks: [],
  source: [{ doc: 'ch2', page: 53 }],
})

const sheet = (id: string, course: CourseId, title: string, formulas: Formula[]): ModuleData =>
  defineModule({
    id,
    title,
    titleEn: `${title} (en)`,
    course,
    chapter: '',
    order: 0,
    sources: [],
    prerequisites: [],
    estimatedMinutes: 0,
    summary: '',
    keyPoints: [],
    glossary: [],
    formulas,
    derivations: [],
    figures: [],
    flashcards: [],
    quiz: [],
    exam: [],
    exercises: [],
    widgets: [],
    connections: [],
    coverage: {},
  })

const parzen = sheet('m09-parzen-windows', 'melgani', 'Finestre di Parzen', [
  formula('f1', 'Stima a finestre di Parzen', 'Parzen windows estimate', md`\hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \frac{1}{h^{n}} \gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)`, 3, [md`\gamma(\cdot)`, md`h`]),
  formula('f2', 'Volume della finestra', 'Window volume', md`V = h^{n}`, 1),
])
const ml = sheet('m05-max-likelihood', 'melgani', 'Massima verosimiglianza', [
  formula('f3', 'Stima ML della varianza', 'ML variance estimate', md`\hat{\sigma}^2 = \frac{1}{N}\sum_{k=1}^{N} (x_k - \hat{\mu})^2`, 3),
])
const svm = sheet('p08-svm-hard-margin', 'passerini', 'SVM a margine rigido', [
  formula('f4', 'Proprietà del margine geometrico', 'Geometric margin', md`\gamma = \frac{2}{\Vert \mathbf{w} \Vert}`, 2, [md`\mathbf{w}`]),
])

// i fogli arrivano in ordine sparso: il formulario segue il manifest
const all = collectFormulas([svm, parzen, ml])
const ids = (list: { formula: Formula }[]) => list.map((e) => e.formula.id)
const search = (query: string) => ids(filterFormulas(all, { ...NO_FILTERS, query }))

describe('collectFormulas', () => {
  it('raccoglie le formule di tutti i fogli nell\'ordine del manifest, con il foglio di provenienza', () => {
    expect(all.map((e) => e.key)).toEqual(['m05-max-likelihood:f3', 'm09-parzen-windows:f1', 'm09-parzen-windows:f2', 'p08-svm-hard-margin:f4'])
    expect(all[1]).toMatchObject({ moduleId: 'm09-parzen-windows', course: 'melgani', number: '09', title: 'Finestre di Parzen', titleEn: 'Finestre di Parzen (en)' })
    expect(all[3].number).toBe('30')
  })
})

describe('searchTokens', () => {
  it('porta lettere greche e comandi LaTeX al loro nome, e spezza sui separatori', () => {
    expect(searchTokens('σ')).toEqual(['sigma'])
    expect(searchTokens('Σ ϑ')).toEqual(['sigma', 'theta'])
    expect(searchTokens('\\hat{p}')).toEqual(['hat', 'p'])
    expect(searchTokens('\\varepsilon')).toEqual(['epsilon'])
    expect(searchTokens('h_N')).toEqual(['h', 'n'])
    expect(searchTokens('  Kernel   Gaussiano ')).toEqual(['kernel', 'gaussiano'])
    expect(searchTokens('')).toEqual([])
  })
})

describe('ricerca', () => {
  it('trova per nome italiano e inglese, senza accenti né maiuscole', () => {
    expect(search('parzen')).toEqual(['f1'])
    expect(search('WINDOW')).toEqual(['f1', 'f2'])
    expect(search('proprieta margine')).toEqual(['f4'])
    expect(search('varianza estimate')).toEqual(['f3'])
    expect(search('nulla del genere')).toEqual([])
  })

  it('trova per simbolo: lettera greca, nome LaTeX o suo inizio', () => {
    expect(search('σ')).toEqual(['f3'])
    expect(search('\\sigma')).toEqual(['f3'])
    expect(search('sig')).toEqual(['f3'])
    expect(search('γ')).toEqual(['f1', 'f4'])
    expect(search('mu')).toEqual(['f3'])
  })

  it('una lettera sola cerca quel simbolo, non un pezzo di parola', () => {
    // f3 contiene \hat ma nessuna h: non deve comparire
    expect(search('h')).toEqual(['f1', 'f2'])
    expect(search('V')).toEqual(['f2'])
    expect(search('w')).toEqual(['f4'])
    // h_N: tutte e due le lettere
    expect(search('h_N')).toEqual(['f1', 'f2'])
    expect(search('x_k')).toEqual(['f3', 'f1'])
  })

  it('i comandi di impaginazione non contano come simboli', () => {
    expect(search('left')).toEqual([])
    expect(search('mathbf')).toEqual([])
    expect(search('frac')).toEqual([])
  })
})

describe('filtri', () => {
  it('per regione, foglio e importanza, insieme alla ricerca', () => {
    expect(ids(filterFormulas(all, { ...NO_FILTERS, course: 'passerini' }))).toEqual(['f4'])
    expect(ids(filterFormulas(all, { ...NO_FILTERS, moduleId: 'm09-parzen-windows' }))).toEqual(['f1', 'f2'])
    expect(ids(filterFormulas(all, { ...NO_FILTERS, importance: 3 }))).toEqual(['f3', 'f1'])
    expect(ids(filterFormulas(all, { ...NO_FILTERS, importance: 3, course: 'melgani', query: 'parzen' }))).toEqual(['f1'])
    expect(filterFormulas(all, NO_FILTERS)).toHaveLength(4)
  })

  it('i conteggi di ogni filtro tengono conto degli altri filtri, non di sé stessi', () => {
    const facets = formulaFacets(all, { ...NO_FILTERS, course: 'melgani', importance: 3 })
    // regioni: importanza 3 sì, regione no
    expect(facets.course).toEqual({ melgani: 2, passerini: 0, ricci: 0 })
    // importanza: regione sì, importanza no
    expect(facets.importance).toEqual({ 1: 1, 2: 0, 3: 2 })
    // fogli: regione e importanza
    expect(facets.modules).toEqual({ 'm05-max-likelihood': 1, 'm09-parzen-windows': 1 })
    expect(facets.total).toBe(4)
    expect(formulaFacets(all, { ...NO_FILTERS, query: 'h' }).course).toEqual({ melgani: 2, passerini: 0, ricci: 0 })
  })
})

describe('groupFormulas', () => {
  it('raggruppa per regione e per foglio, nell\'ordine del manifest', () => {
    const groups = groupFormulas(all)
    expect(groups.map((g) => [g.course, g.count])).toEqual([
      ['melgani', 3],
      ['passerini', 1],
    ])
    expect(groups[0].sheets.map((s) => [s.moduleId, s.number, ids(s.entries)])).toEqual([
      ['m05-max-likelihood', '05', ['f3']],
      ['m09-parzen-windows', '09', ['f1', 'f2']],
    ])
    expect(groupFormulas([])).toEqual([])
  })
})

describe('formulaAnchor', () => {
  it('distingue formule con lo stesso id in fogli diversi', () => {
    expect(formulaAnchor('m09-parzen-windows', 'f1')).toBe('formula:m09-parzen-windows:f1')
    expect(formulaAnchor('m05-max-likelihood', 'f1')).not.toBe(formulaAnchor('m09-parzen-windows', 'f1'))
  })
})
