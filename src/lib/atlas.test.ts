import { describe, expect, it } from 'vitest'
import { manifest } from '../content/manifest'
import type { ModuleProgress } from '../store/progress'
import { chaptersOf, DOCS, formatRange, isDocId, lastStop, modulesCitingPage, REGION_ORDER, sectionLabel, sheetNumber, sourcePageUrl } from './atlas'

const progress = (lastVisited: number, lastSection: string | null): ModuleProgress => ({
  status: 'in-corso',
  sections: lastSection ? [lastSection] : [],
  lastSection,
  lastVisited,
})

describe('numero del foglio', () => {
  it('è il posto del modulo nel manifest, da 01', () => {
    expect(sheetNumber(manifest[0].id)).toBe('01')
    expect(sheetNumber('m09-parzen-windows')).toBe('09')
    expect(sheetNumber(manifest[49].id)).toBe('50')
  })

  it('è null per un modulo che non esiste', () => {
    expect(sheetNumber('inesistente')).toBeNull()
  })
})

describe('regioni e capitoli', () => {
  it('le regioni sono i tre corsi, nell\'ordine del manifest', () => {
    expect(REGION_ORDER).toEqual(['melgani', 'passerini', 'ricci'])
  })

  it('chaptersOf raggruppa i fogli di un corso per capitolo, senza perderne nessuno e con il numero del foglio', () => {
    const melgani = chaptersOf('melgani')
    expect(melgani[0].chapter).toBe('Cap. 1 · Introduction')
    expect(melgani[0].sheets.map((s) => s.number)).toEqual(['01', '02'])
    const all = REGION_ORDER.flatMap((c) => chaptersOf(c).flatMap((ch) => ch.sheets.map((s) => s.meta.id)))
    expect(all).toEqual(manifest.map((m) => m.id))
  })
})

describe('spillo: dove ti sei fermato', () => {
  it('è il modulo letto per ultimo, con la sua sezione', () => {
    expect(lastStop({ a: progress(5, 'x'), b: progress(9, 'y'), c: progress(0, null) })).toEqual({ moduleId: 'b', section: 'y', at: 9 })
  })

  it('non c\'è se non hai ancora letto nulla', () => {
    expect(lastStop({})).toBeNull()
    expect(lastStop({ a: progress(0, null) })).toBeNull()
  })

  it('sectionLabel rende leggibile lo slug di una sezione', () => {
    expect(sectionLabel('scelta-di-h')).toBe('Scelta di h')
    expect(sectionLabel('')).toBe('')
  })
})

describe('fonti', () => {
  it('isDocId riconosce solo gli otto documenti', () => {
    expect(isDocId('ch2')).toBe(true)
    expect(isDocId('part1')).toBe(true)
    expect(isDocId('boh')).toBe(false)
    expect(isDocId('toString')).toBe(false)
  })

  it('ogni documento ha sigla, nome e numero di pagine', () => {
    expect(Object.keys(DOCS).sort()).toEqual(['ch1', 'ch2', 'ch3', 'ch4', 'dl', 'examq', 'part1', 'part2'])
    expect(DOCS.ch2.pages).toBe(77)
    expect(DOCS.dl.pages).toBe(126)
  })

  it('sourcePageUrl punta al WebP della pagina con tre cifre', () => {
    expect(sourcePageUrl('ch2', 7)).toBe('/sources/ch2/p007.webp')
    expect(sourcePageUrl('dl', 126)).toBe('/sources/dl/p126.webp')
  })

  it('formatRange dice slide per le slide e pagine per le note', () => {
    expect(formatRange({ doc: 'ch2', pages: [51, 66] })).toBe('Cap. 2 · slide 51–66')
    expect(formatRange({ doc: 'part1', pages: [36, 45] })).toBe('Note 1 · pp. 36–45')
    expect(formatRange({ doc: 'part1', pages: [36, 36] })).toBe('Note 1 · p. 36')
  })

  it('modulesCitingPage trova i fogli il cui intervallo contiene la pagina', () => {
    expect(modulesCitingPage('part1', 20).map((m) => m.id)).toEqual(['m04-bonta-stimatori', 'm05-max-likelihood'])
    expect(modulesCitingPage('ch2', 51).map((m) => m.id)).toEqual(['m09-parzen-windows'])
    expect(modulesCitingPage('examq', 3)).toEqual([])
  })
})
