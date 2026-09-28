import { describe, expect, it } from 'vitest'
import { defineModule } from '../content/types'
import type { ModuleData } from '../content/types'
import { conceptRows, destinationOf, matchesQuery, matchesView, regionTotals, sheetTotals } from './coverage'
import type { CoverageIndex, IndexModule } from './coverage'

const data: ModuleData = defineModule({
  id: 'm09-parzen-windows',
  title: 'Finestre di Parzen',
  titleEn: 'Parzen windows',
  course: 'melgani',
  chapter: 'Cap. 2',
  order: 9,
  sources: [{ doc: 'ch2', pages: [51, 66] }],
  prerequisites: [],
  estimatedMinutes: 60,
  summary: '',
  keyPoints: [],
  glossary: [],
  formulas: [{ id: 'f-c01', name: 'Stima di base', nameEn: 'Basic estimate', latex: 'K/(NV)', explain: '', symbols: [], importance: 3, blanks: [], source: [] }],
  derivations: [{ id: 'der01', title: 'Dal conteggio alla stima', goal: '', steps: [], conclusion: '', source: [] }],
  figures: [{ id: 'fig03', file: 'x.webp', caption: 'Finestre normali per tre valori di $h$', alt: 'Tre campane', source: { doc: 'ch2', page: 55 } }],
  flashcards: [{ id: 'fc01', q: 'Che cosa fissa Parzen?', a: 'Il volume', kind: 'definizione' }],
  quiz: [{ id: 'q-uno', type: 'tf', q: 'Parzen fissa $K$?', answer: false, explanation: '', difficulty: 1, concepts: ['c01'] }],
  exam: [{ id: 'or-1', q: 'Descrivi il metodo di Parzen', qEn: 'Describe Parzen', prof: 'Melgani', fromBank: false, answer: '', checklist: [], followUps: [] }],
  exercises: [{ id: 'es01', title: 'Conta i campioni', difficulty: 1, kind: 'numerico', concepts: ['c01'], generate: () => ({ prompt: '', answers: [], solution: '' }) }],
  widgets: [{ id: 'm09-scatola-nera', title: 'La scatola nera', concepts: ['c01'] }],
  connections: [],
  coverage: {
    c01: ['#panoramica', 'example:ex07', 'formula:f-c01', 'derivation:der01', 'widget:m09-scatola-nera', 'figure:fig03', 'quiz:q-uno', 'flashcard:fc01', 'exam:or-1', 'exercise:es01', 'seeAlso:m08-non-parametrica-knn#stima-di-base'],
    c02: ['#panoramica', 'formula:f-che-non-esiste'],
  },
})

const inventory: IndexModule = {
  complete: true,
  examples: { ex07: 'Due campioni e la somma dei rettangoli' },
  concepts: [
    { id: 'c01', name: 'Contesto e obiettivo', nameEn: 'Parzen windows estimation', kind: 'definizione', pages: [['ch2', 51]], exam: 3 },
    { id: 'c02', name: 'Parzen contro K-NN', nameEn: 'Parzen vs K-NN', kind: 'confronto', pages: [['ch2', 52]] },
    { id: 'c03', name: 'Perché è non parametrica', nameEn: 'Why nonparametric', kind: 'osservazione', pages: [['part1', 36]], noWidget: 'Solo una nota' },
  ],
}

describe('destinationOf', () => {
  const dest = (t: string) => destinationOf(data, inventory, t)

  it('porta ogni destinazione alla scheda che la contiene, con il suo nome', () => {
    expect(dest('#panoramica')).toMatchObject({ group: 'teoria', href: '/m/m09-parzen-windows/teoria#panoramica', label: 'Panoramica' })
    expect(dest('example:ex07')).toMatchObject({ group: 'teoria', href: '/m/m09-parzen-windows/teoria#example:ex07', label: 'Due campioni e la somma dei rettangoli' })
    expect(dest('formula:f-c01')).toMatchObject({ group: 'formule', href: '/m/m09-parzen-windows/formule#formula:f-c01', label: 'Stima di base' })
    expect(dest('derivation:der01')).toMatchObject({ group: 'formule', href: '/m/m09-parzen-windows/formule#derivation:der01', label: 'Dal conteggio alla stima' })
    expect(dest('widget:m09-scatola-nera')).toMatchObject({ group: 'widget', href: '/lab/m09-scatola-nera', label: 'La scatola nera' })
    expect(dest('figure:fig03')).toMatchObject({ group: 'figure', href: '/m/m09-parzen-windows/teoria#figure:fig03', label: 'Finestre normali per tre valori di $h$', rich: true })
    expect(dest('quiz:q-uno')).toMatchObject({ group: 'quiz', href: '/m/m09-parzen-windows/quiz', label: 'Parzen fissa $K$?', rich: true })
    expect(dest('flashcard:fc01')).toMatchObject({ group: 'flashcard', href: '/m/m09-parzen-windows/flashcard' })
    expect(dest('exam:or-1')).toMatchObject({ group: 'orale', href: '/m/m09-parzen-windows/orale#exam:or-1', label: 'Descrivi il metodo di Parzen' })
    expect(dest('exercise:es01')).toMatchObject({ group: 'esercizi', href: '/m/m09-parzen-windows/esercizi#exercise:es01', label: 'Conta i campioni' })
  })

  it('un rimando a un altro foglio va alla sua sezione e dice di quale foglio si tratta', () => {
    expect(dest('seeAlso:m08-non-parametrica-knn#stima-di-base')).toMatchObject({
      group: 'teoria',
      href: '/m/m08-non-parametrica-knn/teoria#stima-di-base',
      label: expect.stringMatching(/^Foglio 08 · .+ · Stima di base$/),
    })
    expect(dest('seeAlso:m08-non-parametrica-knn')).toMatchObject({ href: '/m/m08-non-parametrica-knn' })
  })

  it("con l'indice delle sezioni usa il titolo vero, anche per i rimandi ad altri fogli", () => {
    const titles = (id: string, slug: string) => (slug === 'panoramica' ? `Panoramica di ${id}` : slug === 'stima-di-base' ? 'Stima di base $K/(NV)$' : undefined)
    expect(destinationOf(data, inventory, '#panoramica', titles)).toMatchObject({ label: 'Panoramica di m09-parzen-windows', rich: true })
    expect(destinationOf(data, inventory, '#altro-titolo', titles)).toMatchObject({ label: 'Altro titolo', rich: false })
    expect(destinationOf(data, inventory, 'seeAlso:m08-non-parametrica-knn#stima-di-base', titles).label).toMatch(/ · Stima di base \$K\/\(NV\)\$$/)
  })

  it('una destinazione che non esiste nei dati del foglio resta visibile, segnata come rotta', () => {
    expect(dest('formula:f-che-non-esiste')).toMatchObject({ group: 'formule', broken: true })
    expect(dest('boh:qualcosa')).toMatchObject({ broken: true })
    expect(dest('#panoramica').broken).toBe(false)
  })
})

describe('conceptRows e filtri', () => {
  const rows = conceptRows(data, inventory)

  it('una riga per concetto dell\'inventario, con le destinazioni raggruppate', () => {
    expect(rows.map((r) => r.concept.id)).toEqual(['c01', 'c02', 'c03'])
    expect(rows[0].tracked).toBe(true)
    expect([...rows[0].groups].sort()).toEqual(['esercizi', 'figure', 'flashcard', 'formule', 'orale', 'quiz', 'teoria', 'widget'])
    // c03 non ha destinazioni: è il caso che la pagina deve mostrare subito
    expect(rows[2].tracked).toBe(false)
    expect(rows[2].destinations).toEqual([])
    // una destinazione rotta non conta come copertura
    expect(rows[1].groups.has('formule')).toBe(false)
    expect(rows[1].broken).toBe(1)
  })

  it('matchesView filtra per destinazione mancante; "senza widget" salta chi ha un motivo', () => {
    expect(rows.filter((r) => matchesView(r, 'tutti')).length).toBe(3)
    expect(rows.filter((r) => matchesView(r, 'non-tracciati')).map((r) => r.concept.id)).toEqual(['c03'])
    expect(rows.filter((r) => matchesView(r, 'orale')).map((r) => r.concept.id)).toEqual(['c02', 'c03'])
    expect(rows.filter((r) => matchesView(r, 'widget')).map((r) => r.concept.id)).toEqual(['c02'])
    expect(rows.filter((r) => matchesView(r, 'rotte')).map((r) => r.concept.id)).toEqual(['c02'])
  })

  it('matchesQuery cerca in nome, nome inglese e id, senza badare ad accenti e maiuscole', () => {
    expect(matchesQuery(rows[2], 'perche')).toBe(true)
    expect(matchesQuery(rows[1], 'k-nn')).toBe(true)
    expect(matchesQuery(rows[0], 'WINDOWS')).toBe(true)
    expect(matchesQuery(rows[0], 'c01')).toBe(true)
    expect(matchesQuery(rows[0], 'bayes')).toBe(false)
    expect(matchesQuery(rows[0], '  ')).toBe(true)
  })
})

describe('totali', () => {
  it('sheetTotals conta concetti, tracciati e destinazioni', () => {
    expect(sheetTotals(conceptRows(data, inventory))).toEqual({ concepts: 3, tracked: 2, destinations: 13 })
  })

  it('regionTotals separa i fogli pronti da quelli con il solo inventario', () => {
    const index: CoverageIndex = {
      version: 1,
      modules: {
        'm09-parzen-windows': inventory,
        'm08-non-parametrica-knn': { complete: true, examples: {}, concepts: [inventory.concepts[0], inventory.concepts[1]] },
        'p01-stima-parametri': { complete: false, examples: {}, concepts: [inventory.concepts[0]] },
      },
    }
    const rows = new Map([['m09-parzen-windows', conceptRows(data, inventory)]])
    const melgani = regionTotals('melgani', index, rows)
    expect(melgani).toMatchObject({ ready: 1, inventoried: 5, readyConcepts: 3, tracked: 2, destinations: 13 })
    expect(melgani.sheets).toBeGreaterThan(20)
    expect(regionTotals('passerini', index, rows)).toMatchObject({ ready: 0, inventoried: 1, readyConcepts: 0, tracked: 0 })
  })
})

describe('destinazioni inesistenti e in attesa (regressione: la pagina contava tracciato ciò che coverage-report segna rotto)', () => {
  const titles = Object.assign((id: string, slug: string) => (id === 'm09-parzen-windows' && slug === 'panoramica' ? 'Panoramica' : undefined), {
    known: (id: string) => id === 'm09-parzen-windows',
  })
  const ready = (id: string) => id === 'm09-parzen-windows' || id === 'm08-non-parametrica-knn'

  it('una sezione che l\'indice del foglio non conosce e un esempio che l\'inventario non ha sono rotti', () => {
    expect(destinationOf(data, inventory, '#sezione-che-non-esiste', titles, ready).broken).toBe(true)
    expect(destinationOf(data, inventory, '#panoramica', titles, ready).broken).toBe(false)
    expect(destinationOf(data, inventory, 'example:ex-inesistente', titles, ready).broken).toBe(true)
    expect(destinationOf(data, inventory, 'example:ex07', titles, ready).broken).toBe(false)
  })

  it('un rimando a un foglio non ancora pronto è in attesa: né rotto né tracciato', () => {
    const d = destinationOf(data, inventory, 'seeAlso:p01-stima-parametri#titolo-inventato', titles, ready)
    expect(d).toMatchObject({ broken: false, pending: true })
    const withOnlyThese = { ...data, coverage: { c01: ['#sezione-che-non-esiste', 'example:ex-inesistente', 'seeAlso:p01-stima-parametri#titolo-inventato'] } }
    const [row] = conceptRows(withOnlyThese, inventory, titles, ready)
    expect(row).toMatchObject({ tracked: false, broken: 2, pending: 1 })
  })
})
