import { describe, expect, it, vi } from 'vitest'
import { loadReadySheets } from './readySheets'

// Tre fogli pronti: uno si carica, uno non arriva (data.ts scritto a metà), uno arriva senza gli elenchi.
vi.mock('../content/registry', () => {
  const sheet = (id: string) => ({ id, formulas: [], derivations: [], figures: [], flashcards: [], quiz: [], exam: [], exercises: [], widgets: [], glossary: [] })
  return {
    hasModule: (id: string) => ['m03-stima-intro-parametrica', 'm05-max-likelihood', 'm09-parzen-windows'].includes(id),
    loadModuleData: vi.fn(async (id: string) => {
      if (id === 'm05-max-likelihood') throw new Error('chunk non trovato')
      if (id === 'm03-stima-intro-parametrica') return { id }
      return sheet(id)
    }),
    loadAllModuleData: vi.fn(async () => {
      throw new Error('un solo foglio rotto fa fallire tutto')
    }),
  }
})

describe('loadReadySheets', () => {
  it('un foglio che non arriva non fa sparire gli altri: finisce in failed', async () => {
    const { modules, failed } = await loadReadySheets()
    expect(modules.map((m) => m.id)).toEqual(['m09-parzen-windows'])
    expect(failed).toEqual(['m03-stima-intro-parametrica', 'm05-max-likelihood'])
  })

  it('con gli id chiesti carica solo quelli', async () => {
    const { modules, failed } = await loadReadySheets({ ids: ['m09-parzen-windows'] })
    expect(modules.map((m) => m.id)).toEqual(['m09-parzen-windows'])
    expect(failed).toEqual([])
  })
})
