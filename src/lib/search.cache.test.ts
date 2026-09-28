// L'indice di ricerca non resta in cache se un foglio non si è caricato: alla prossima apertura della palette
// lo si ritenta (regressione: prima il foglio mancava fino al ricaricamento della pagina).
import { describe, expect, it, vi } from 'vitest'
import { loadSearchIndex, searchAtlas } from './search'

const state = vi.hoisted(() => ({ calls: 0 }))

vi.mock('../content/registry', () => ({
  hasModule: (id: string) => id === 'm09-parzen-windows',
  loadModuleData: vi.fn(async (id: string) => {
    state.calls++
    // la prima volta il data.ts non arriva (lo sta scrivendo un altro lavoro), poi sì
    if (state.calls === 1) throw new Error('chunk non arrivato')
    return {
      id,
      title: 'Finestre di Parzen',
      titleEn: 'Parzen windows',
      course: 'melgani',
      chapter: '',
      glossary: [{ term: 'Larghezza della finestra', en: 'bandwidth', def: 'Il lato h.' }],
      formulas: [],
      derivations: [],
      figures: [],
      flashcards: [],
      quiz: [],
      exam: [],
      exercises: [],
      widgets: [],
    }
  }),
  loadModuleContent: vi.fn(),
  loadAllModuleData: vi.fn(),
}))

describe('loadSearchIndex e fogli che non si caricano', () => {
  it('un indice parziale non si tiene: la volta dopo il foglio mancante si ritenta e si trova', async () => {
    const first = await loadSearchIndex()
    expect(first.stats.readySheets).toBe(0)
    expect(first.stats.failedSheets).toBe(1)
    const second = await loadSearchIndex()
    expect(second).not.toBe(first)
    expect(second.stats).toMatchObject({ readySheets: 1, failedSheets: 0 })
    expect(searchAtlas(second, 'bandwidth').total).toBeGreaterThan(0)
    // un indice completo invece resta per la sessione
    expect(await loadSearchIndex()).toBe(second)
  })
})
