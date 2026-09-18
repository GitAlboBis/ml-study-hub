// Contesto del modulo: i componenti MDX (<Formula id>, <Check id>, …) ricevono solo un id e leggono qui
// i dati tipizzati del foglio. La pagina modulo avvolge l'MDX in <ModuleContext value={data}>.
// Questo file non esporta componenti: così il contesto e il suo hook convivono senza rompere il fast refresh.
import { createContext, useContext } from 'react'
import type { ModuleData } from '../../content/types'

export const ModuleContext = createContext<ModuleData | null>(null)

/** I dati del modulo corrente. Fuori da <ModuleContext> è un errore di montaggio, non un caso da gestire. */
export function useModule(): ModuleData {
  const data = useContext(ModuleContext)
  if (data === null) throw new Error('useModule: manca <ModuleContext value={data}> attorno ai componenti di contenuto')
  return data
}

/** Tipi di destinazione della copertura che hanno un componente nel foglio (vedi CoverageTarget in content/types.ts). */
export type TargetKind = 'formula' | 'derivation' | 'figure' | 'widget' | 'example' | 'quiz'

/**
 * Id DOM di una destinazione di copertura: la stessa stringa usata in `coverage`, es. "formula:parzen".
 * I due punti non compaiono mai negli slug dei titoli, quindi non ci sono collisioni con le ancore delle sezioni,
 * e la pagina Copertura può puntare a `#formula:parzen` senza tradurre nulla.
 */
export const targetId = (kind: TargetKind, id: string) => `${kind}:${id}`
