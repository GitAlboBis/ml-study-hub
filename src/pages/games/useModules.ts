// I dati di tutti i fogli pronti, per l'hub e per i giochi. Quali fogli sono pronti lo dice il registry
// (hasModule), nell'ordine del manifest: con uno o con cinquanta il codice è lo stesso.
// Ogni foglio si carica per conto suo (loadReadySheets): uno che non arriva, per esempio un data.ts scritto a
// metà mentre un altro lavoro ci scrive, finisce in `failed` e i giochi continuano con gli altri. Solo se non
// arriva nessun foglio la pagina dice che non è riuscita a leggerli.
import { useEffect, useState } from 'react'
import { loadReadySheets } from '../../lib/readySheets'
import type { ModuleData } from '../../content/types'

export type ModulesState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready'
      modules: ModuleData[]
      /** id dei fogli pronti che non si sono caricati */
      failed: string[]
    }

export function useAllModules(): [state: ModulesState, retry: () => void] {
  const [state, setState] = useState<ModulesState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    loadReadySheets().then(({ modules, failed }) => {
      if (!alive) return
      setState(modules.length === 0 && failed.length > 0 ? { status: 'error' } : { status: 'ready', modules, failed })
    })
    return () => {
      alive = false
    }
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((a) => a + 1)
  }
  return [state, retry]
}
