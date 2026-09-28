import { describe, expect, it } from 'vitest'
import { defineModule } from '../content/types'
import type { CourseId, GlossaryEntry, ModuleData } from '../content/types'
import { filterGlossary, glossaryKey, initialOf, mergeGlossary, sectionsByInitial, sortGlossary, termAnchor, termKey } from './glossary'

// Un foglio minimo con il solo glossario: il resto non serve alla fusione.
const sheet = (id: string, course: CourseId, glossary: GlossaryEntry[]): ModuleData =>
  defineModule({
    id,
    title: id,
    titleEn: id,
    course,
    chapter: '',
    order: 0,
    sources: [],
    prerequisites: [],
    estimatedMinutes: 0,
    summary: '',
    keyPoints: [],
    glossary,
    formulas: [],
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

const knn = sheet('m08-non-parametrica-knn', 'melgani', [
  { term: 'Sovradattamento', en: 'Overfitting', def: 'Stima che insegue il rumore (K-NN).' },
  { term: 'Stima non parametrica', en: 'nonparametric estimation', def: 'Senza forma funzionale.' },
])
const parzen = sheet('m09-parzen-windows', 'melgani', [
  { term: 'Finestra di Parzen', en: 'Parzen window', def: 'Il kernel.' },
  { term: 'Sovra-adattamento', en: '  overfitting ', def: 'Finestra troppo stretta.' },
  { term: 'Élite dei kernel', en: 'kernel elite', def: 'Un termine con l\'accento.' },
])
const svm = sheet('p08-svm-hard-margin', 'passerini', [
  { term: 'Margine', en: 'margin', def: 'Distanza dall\'iperpiano.' },
  { term: 'overfitting', en: 'OVERFITTING', def: 'Anche le SVM.' },
  { term: '1-NN', en: 'one nearest neighbour', def: 'Un solo vicino.' },
])

describe('glossaryKey', () => {
  it('normalizza il termine inglese: minuscole e spazi', () => {
    expect(glossaryKey('  Window   Function ')).toBe('window function')
    expect(glossaryKey('OVERFITTING')).toBe(glossaryKey('overfitting'))
  })
})

describe('mergeGlossary', () => {
  it('fonde le voci con lo stesso termine inglese normalizzato, con i fogli in ordine di manifest', () => {
    // i fogli arrivano in ordine sparso: conta il manifest
    const terms = mergeGlossary([svm, parzen, knn])
    const overfitting = terms.find((t) => t.key === 'overfitting')!
    expect(overfitting.en).toBe('Overfitting')
    expect(overfitting.sightings.map((s) => s.moduleId)).toEqual(['m08-non-parametrica-knn', 'm09-parzen-windows', 'p08-svm-hard-margin'])
    expect(overfitting.sightings.map((s) => s.def)).toEqual(['Stima che insegue il rumore (K-NN).', 'Finestra troppo stretta.', 'Anche le SVM.'])
    // i termini italiani distinti, senza ripetere quelli uguali a meno delle maiuscole
    expect(overfitting.it).toEqual(['Sovradattamento', 'Sovra-adattamento', 'overfitting'])
    expect(overfitting.courses).toEqual(['melgani', 'passerini'])
    expect(terms.filter((t) => t.key === 'overfitting')).toHaveLength(1)
    expect(terms).toHaveLength(6)
  })

  it('una voce ripetuta nello stesso foglio conta una volta sola', () => {
    const doubled = sheet('m09-parzen-windows', 'melgani', [
      { term: 'Kernel', en: 'kernel', def: 'Prima.' },
      { term: 'Kernel', en: 'Kernel', def: 'Seconda.' },
    ])
    const [kernel] = mergeGlossary([doubled])
    expect(kernel.sightings).toHaveLength(1)
    expect(kernel.sightings[0].def).toBe('Prima.')
    expect(kernel.it).toEqual(['Kernel'])
  })

  it('senza fogli non ci sono termini', () => {
    expect(mergeGlossary([])).toEqual([])
  })
})

describe('ordine e indice alfabetico', () => {
  const terms = mergeGlossary([knn, parzen, svm])

  it('ordina per termine italiano o inglese, senza badare a maiuscole e accenti', () => {
    expect(sortGlossary(terms, 'it').map((t) => t.it[0])).toEqual([
      '1-NN',
      'Élite dei kernel',
      'Finestra di Parzen',
      'Margine',
      'Sovradattamento',
      'Stima non parametrica',
    ])
    expect(sortGlossary(terms, 'en').map((t) => t.en)).toEqual([
      'kernel elite',
      'margin',
      'nonparametric estimation',
      'one nearest neighbour',
      'Overfitting',
      'Parzen window',
    ])
  })

  it('l\'iniziale toglie gli accenti; ciò che non comincia con una lettera va sotto #', () => {
    expect(initialOf('Élite')).toBe('E')
    expect(initialOf('  kernel')).toBe('K')
    expect(initialOf('1-NN')).toBe('#')
    expect(initialOf('σ adattiva')).toBe('#')
  })

  it('raggruppa per iniziale della voce principale; # va in fondo', () => {
    const it = sectionsByInitial(sortGlossary(terms, 'it'), 'it')
    expect(it.map((s) => s.letter)).toEqual(['E', 'F', 'M', 'S', '#'])
    expect(it.find((s) => s.letter === 'S')!.terms.map((t) => t.it[0])).toEqual(['Sovradattamento', 'Stima non parametrica'])
    const en = sectionsByInitial(sortGlossary(terms, 'en'), 'en')
    expect(en.map((s) => s.letter)).toEqual(['K', 'M', 'N', 'O', 'P'])
  })
})

describe('filterGlossary', () => {
  const terms = mergeGlossary([knn, parzen, svm])

  it('cerca nei termini italiani e inglesi, senza accenti e maiuscole', () => {
    expect(filterGlossary(terms, { query: 'elite', course: null }).map((t) => t.en)).toEqual(['kernel elite'])
    expect(filterGlossary(terms, { query: 'SOVRA', course: null }).map((t) => t.key)).toEqual(['overfitting'])
    expect(filterGlossary(terms, { query: 'parzen window', course: null }).map((t) => t.key)).toEqual(['parzen window'])
    // più parole: devono esserci tutte, anche in lingue diverse
    expect(filterGlossary(terms, { query: 'finestra window', course: null }).map((t) => t.key)).toEqual(['parzen window'])
    expect(filterGlossary(terms, { query: 'nulla del genere', course: null })).toEqual([])
    expect(filterGlossary(terms, { query: '   ', course: null })).toHaveLength(terms.length)
  })

  it('filtra per regione: basta che il termine compaia in un foglio di quel corso', () => {
    expect(filterGlossary(terms, { query: '', course: 'passerini' }).map((t) => t.key)).toEqual(['overfitting', 'margin', 'one nearest neighbour'])
    expect(filterGlossary(terms, { query: '', course: 'ricci' })).toEqual([])
  })
})

describe('termAnchor', () => {
  it('è un id stabile e leggibile, lo stesso per le varianti di scrittura', () => {
    expect(termAnchor('Parzen windows estimation, kernel density estimation (KDE)')).toBe('termine:parzen-windows-estimation-kernel-density-estimation-kde')
    expect(termAnchor(' OVERFITTING ')).toBe(termAnchor('overfitting'))
    expect(termAnchor('sinc² kernel')).toBe('termine:sinc2-kernel')
  })
})

describe('fusione dei sinonimi (regressione: lo stesso concetto compariva più volte)', () => {
  // coppie vere dai fogli pronti
  const m03 = sheet('m03-stima-intro-parametrica', 'melgani', [
    { term: 'Stima a massima verosimiglianza', en: 'Maximum Likelihood Estimation (MLE)', def: 'Da m03.' },
    { term: 'Semidefinita positiva', en: 'positive semi-definite', def: 'Da m03.' },
    { term: 'Bound di Cramér-Rao', en: 'Cramér-Rao bound', def: 'Da m03.' },
  ])
  const m05 = sheet('m05-max-likelihood', 'melgani', [
    { term: 'Stima a massima verosimiglianza', en: 'maximum likelihood (ML) estimation', def: 'Da m05.' },
    { term: 'Semidefinita positiva', en: 'positive semidefinite', def: 'Da m05.' },
    { term: 'Bound di Cramér-Rao', en: 'Cramér-Rao lower bound', def: 'Da m05.' },
  ])
  const m07 = sheet('m07-stima-bayesiana', 'melgani', [
    { term: 'Stima a massima verosimiglianza', en: 'Maximum Likelihood estimation (ML)', def: 'Da m07.' },
    { term: 'Stima bayesiana', en: 'Bayesian estimation', def: 'Da m07.' },
  ])

  it('una voce sola per concetto: stesso inglese a meno di parentesi, trattini e maiuscole, oppure stesso italiano', () => {
    const terms = mergeGlossary([m03, m05, m07])
    expect(terms).toHaveLength(4)
    const mle = terms.find((t) => t.it[0] === 'Stima a massima verosimiglianza')!
    expect(mle.sightings.map((s) => s.moduleId)).toEqual(['m03-stima-intro-parametrica', 'm05-max-likelihood', 'm07-stima-bayesiana'])
    expect(mle.en).toBe('Maximum Likelihood Estimation (MLE)')
    // nulla si perde: le altre grafie inglesi restano nella voce
    expect(mle.enAlt).toEqual(['maximum likelihood (ML) estimation', 'Maximum Likelihood estimation (ML)'])
    const psd = terms.find((t) => t.it[0] === 'Semidefinita positiva')!
    expect(psd.sightings).toHaveLength(2)
    const cr = terms.find((t) => t.it[0] === 'Bound di Cramér-Rao')!
    expect(cr.enAlt).toEqual(['Cramér-Rao lower bound'])
  })

  it('la ricerca trova anche le altre grafie inglesi', () => {
    const terms = mergeGlossary([m03, m05])
    expect(filterGlossary(terms, { query: 'lower bound', course: null }).map((t) => t.it[0])).toEqual(['Bound di Cramér-Rao'])
  })

  it('termKey piega parentesi, trattini, spazi e accenti', () => {
    expect(termKey('Maximum Likelihood Estimation (MLE)')).toBe(termKey('maximum likelihood (ML) estimation'))
    expect(termKey('positive semi-definite')).toBe(termKey('positive semidefinite'))
    expect(termKey('Cramér-Rao')).toBe(termKey('cramer rao'))
    expect(termKey('bias')).not.toBe(termKey('variance'))
  })
})
