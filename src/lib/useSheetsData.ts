// I data.ts dei fogli pronti tra quelli chiesti, per le pagine che guardano molti fogli insieme (mappa, regione).
// Ogni foglio si carica da solo (allSettled): uno che non si carica non ferma gli altri e finisce in `failed`.
// Funziona con 1 foglio pronto come con 50: chi chiama passa gli id del manifest, qui si tengono quelli con hasModule.
import { useEffect, useState } from 'react'
import { hasModule, loadModuleData } from '../content/registry'
import type { ModuleData } from '../content/types'

export interface SheetsData {
  /** i data.ts caricati, nell'ordine degli id chiesti */
  data: ModuleData[]
  loading: boolean
  /** id dei fogli pronti che non si sono caricati */
  failed: string[]
}

const IDLE: SheetsData = { data: [], loading: false, failed: [] }
// oggetti fissi: chi li usa come dipendenza di useMemo non ricalcola a ogni render
const LOADING: SheetsData = { data: [], loading: true, failed: [] }

export function useSheetsData(ids: readonly string[]): SheetsData {
  const key = ids.filter(hasModule).join(',')
  const [state, setState] = useState<{ key: string; value: SheetsData } | null>(null)

  useEffect(() => {
    if (key === '') return
    let alive = true
    const wanted = key.split(',')
    Promise.allSettled(wanted.map((id) => loadModuleData(id))).then((results) => {
      if (!alive) return
      const data: ModuleData[] = []
      const failed: string[] = []
      results.forEach((r, i) => (r.status === 'fulfilled' ? data.push(r.value) : failed.push(wanted[i])))
      setState({ key, value: { data, loading: false, failed } })
    })
    return () => {
      alive = false
    }
  }, [key])

  if (key === '') return IDLE
  // finché i fogli caricati non sono quelli chiesti, si sta caricando
  return state?.key === key ? state.value : LOADING
}
