// I dati dei fogli pronti, per le pagine che leggono tutto l'atlante (formulario, glossario). Quali fogli sono
// pronti lo dice il registry (hasModule), nell'ordine del manifest: nessun id scritto a mano. Ogni foglio si
// carica per conto suo: se uno è rotto (un data.ts a metà mentre un altro lavoro lo sta scrivendo) gli altri
// arrivano lo stesso, e la pagina dice quale manca con un "Riprova".
import { useEffect, useState } from 'react'
import { manifest } from '../../content/manifest'
import type { ModuleManifestEntry } from '../../content/manifest'
import { hasModule, loadModuleData } from '../../content/registry'
import type { ModuleData } from '../../content/types'

export type ReadySheets =
  | { status: 'loading' }
  | {
      status: 'ready'
      /** i fogli caricati, nell'ordine del manifest */
      modules: ModuleData[]
      /** i fogli pronti che non si sono caricati */
      failed: ModuleManifestEntry[]
    }

export interface ReadySheetsResult {
  sheets: ReadySheets
  /** ricarica i fogli senza togliere dalla pagina quelli già arrivati */
  retry: () => void
  retrying: boolean
}

export function useReadySheets(): ReadySheetsResult {
  const [sheets, setSheets] = useState<ReadySheets>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState(-1)

  useEffect(() => {
    let alive = true
    const ready = manifest.filter((m) => hasModule(m.id))
    Promise.allSettled(ready.map((m) => loadModuleData(m.id))).then((results) => {
      if (!alive) return
      const modules: ModuleData[] = []
      const failed: ModuleManifestEntry[] = []
      results.forEach((r, i) => (r.status === 'fulfilled' ? modules.push(r.value) : failed.push(ready[i])))
      setSheets({ status: 'ready', modules, failed })
      setSettled(attempt)
    })
    return () => {
      alive = false
    }
  }, [attempt])

  return { sheets, retry: () => setAttempt((n) => n + 1), retrying: sheets.status === 'ready' && settled !== attempt }
}
