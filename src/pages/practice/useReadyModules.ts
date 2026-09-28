// I dati di tutti i fogli pronti, per le pagine globali di pratica. Quali fogli sono pronti lo dice il registry
// (hasModule: esiste il loro data.ts), mai un elenco scritto a mano: la pagina funziona con 1 foglio e con 50.
// Ogni foglio si carica per conto suo (non con loadAllModuleData, che fallisce tutto se un solo foglio non
// arriva): un foglio che non si carica, o i cui dati non hanno ancora carte e domande, finisce in `failed` e la
// pagina lavora con gli altri.
import { useEffect, useState } from 'react'
import { manifest } from '../../content/manifest'
import { hasModule, loadModuleData } from '../../content/registry'
import type { ModuleData } from '../../content/types'

export type ReadyModules =
  | { status: 'loading' }
  | {
      status: 'ready'
      /** i fogli caricati, nell'ordine del manifest */
      modules: ModuleData[]
      /** id dei fogli pronti che non si sono caricati */
      failed: string[]
    }

const readyIds = () => manifest.filter((m) => hasModule(m.id)).map((m) => m.id)

// un data.ts ancora a metà può arrivare senza gli elenchi: meglio saltarlo che rompere la pagina
const usable = (d: unknown): d is ModuleData =>
  typeof d === 'object' && d !== null && Array.isArray((d as ModuleData).flashcards) && Array.isArray((d as ModuleData).quiz)

const NONE: ReadyModules = { status: 'ready', modules: [], failed: [] }

export function useReadyModules(): [state: ReadyModules, retry: () => void] {
  const [attempt, setAttempt] = useState(0)
  // senza fogli pronti non c'è niente da aspettare: la pagina nasce già pronta
  const [result, setResult] = useState<{ attempt: number; value: ReadyModules }>(() => ({ attempt: 0, value: readyIds().length === 0 ? NONE : { status: 'loading' } }))

  useEffect(() => {
    const ids = readyIds()
    let alive = true
    Promise.allSettled(ids.map((id) => loadModuleData(id))).then((results) => {
      if (!alive) return
      const modules: ModuleData[] = []
      const failed: string[] = []
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && usable(r.value)) modules.push(r.value)
        else failed.push(ids[i])
      })
      setResult({ attempt, value: { status: 'ready', modules, failed } })
    })
    return () => {
      alive = false
    }
  }, [attempt])

  // subito dopo "Riprova" lo stato è ancora quello del tentativo di prima
  const state = result.attempt === attempt ? result.value : { status: 'loading' as const }
  return [state, () => setAttempt((n) => n + 1)]
}
