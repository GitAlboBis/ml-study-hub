// I dati di tutti i fogli pronti (quelli con data.ts, secondo il registry), caricati insieme per le pagine che
// guardano l'atlante intero (copertura, progressi). Ogni foglio si carica per conto suo: uno che non si carica
// (un data.ts rotto o scritto a metà mentre un autore ci lavora) non ferma gli altri e resta nell'elenco con lo
// stato 'error'. Nessun id scritto a mano: la pagina funziona con 1 foglio pronto come con 50.
import { useEffect, useState } from 'react'
import { manifest } from '../content/manifest'
import { hasModule, loadModuleData } from '../content/registry'
import type { ModuleData } from '../content/types'

export type SheetLoad = { id: string; status: 'ready'; data: ModuleData } | { id: string; status: 'error' }

export interface ReadyModules {
  /** true finché i dati non sono arrivati tutti (anche quelli andati male) */
  loading: boolean
  /** i fogli pronti nell'ordine del manifest */
  sheets: SheetLoad[]
  /** ricarica tutto, per i fogli che non si sono caricati */
  retry: () => void
}

const LISTS = ['formulas', 'derivations', 'figures', 'flashcards', 'quiz', 'exam', 'exercises', 'widgets'] as const

/** Un data.ts a metà può arrivare senza qualche elenco: meglio segnarlo come non caricato che rompere la pagina. */
const usable = (d: unknown): d is ModuleData => {
  if (typeof d !== 'object' || d === null) return false
  const o = d as Record<string, unknown>
  return LISTS.every((k) => Array.isArray(o[k])) && typeof o.coverage === 'object' && o.coverage !== null
}

export function useReadyModules(): ReadyModules {
  const [sheets, setSheets] = useState<SheetLoad[] | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    const ids = manifest.filter((m) => hasModule(m.id)).map((m) => m.id)
    Promise.allSettled(ids.map((id) => loadModuleData(id))).then((results) => {
      if (!alive) return
      setSheets(results.map((r, i) => (r.status === 'fulfilled' && usable(r.value) ? { id: ids[i], status: 'ready', data: r.value } : { id: ids[i], status: 'error' })))
    })
    return () => {
      alive = false
    }
  }, [attempt])

  return {
    loading: sheets === null,
    sheets: sheets ?? [],
    retry: () => {
      setSheets(null)
      setAttempt((n) => n + 1)
    },
  }
}
