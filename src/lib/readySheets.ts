// Caricamento tollerante dei fogli pronti, per le pagine che leggono tutto l'atlante (copertina, giochi,
// simulatore dell'orale). Quali fogli sono pronti lo dice il registry (hasModule), nell'ordine del manifest:
// nessun id scritto a mano, funziona con 1 foglio come con 50.
// Ogni foglio si carica per conto suo (allSettled, non loadAllModuleData che fallisce tutto se un solo data.ts
// non arriva): un foglio rotto o scritto a metà mentre un altro lavoro ci scrive finisce in `failed`, e la
// pagina lavora con gli altri e lo dice.
import { manifest } from '../content/manifest'
import { hasModule, loadModuleData } from '../content/registry'
import type { ModuleData } from '../content/types'

/** Gli elenchi di un foglio che una pagina può leggere. */
export type SheetList = 'formulas' | 'derivations' | 'figures' | 'flashcards' | 'quiz' | 'exam' | 'exercises' | 'widgets' | 'glossary'

export const ALL_LISTS: readonly SheetList[] = ['formulas', 'derivations', 'figures', 'flashcards', 'quiz', 'exam', 'exercises', 'widgets', 'glossary']

/**
 * Un data.ts a metà può arrivare senza qualche elenco: meglio segnarlo come non caricato che rompere la pagina.
 * `lists` sono gli elenchi che la pagina legge davvero (il simulatore dell'orale, per esempio, solo `exam`).
 */
export const isUsableSheet = (d: unknown, lists: readonly SheetList[] = ALL_LISTS): d is ModuleData => {
  if (typeof d !== 'object' || d === null) return false
  const o = d as Record<string, unknown>
  return typeof o.id === 'string' && lists.every((k) => Array.isArray(o[k]))
}

export interface ReadySheetsLoad {
  /** i fogli caricati, nell'ordine del manifest */
  modules: ModuleData[]
  /** id dei fogli pronti che non si sono caricati */
  failed: string[]
}

/** Gli id dei fogli pronti, nell'ordine del manifest. */
export const readySheetIds = (): string[] => manifest.filter((m) => hasModule(m.id)).map((m) => m.id)

/** Carica i fogli pronti uno per uno: non rifiuta mai, i fogli andati male finiscono in `failed`. */
export async function loadReadySheets({ ids = readySheetIds(), lists = ALL_LISTS }: { ids?: readonly string[]; lists?: readonly SheetList[] } = {}): Promise<ReadySheetsLoad> {
  const results = await Promise.allSettled(ids.map((id) => loadModuleData(id)))
  const modules: ModuleData[] = []
  const failed: string[] = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && isUsableSheet(r.value, lists)) modules.push(r.value)
    else failed.push(ids[i])
  })
  return { modules, failed }
}
