// Il cursore condiviso di LinkedPanels, fuori dal file del componente (i file .tsx esportano solo componenti).
// Un pannello lo scrive dal suo Plot (onCursor), tutti lo leggono: la sonda che si muove in uno si vede negli altri.
//
// COSTO. Il cursore vive in un piccolo store fuori da React, sul modello di createFrameChannel: a ogni mossa del
// puntatore si ridisegnano solo i componenti che lo leggono con useSyncExternalStore (LinkedCursorMark, le letture,
// i pannelli che leggono ctx.cursor), non tutti i pannelli e non il widget intero. Un motore che vuole il cursore
// per una formula o una lettura crea lo store (createLinkedCursorStore), lo passa a LinkedPanels (`store`) e lo legge
// con useLinkedCursorStore solo nel componente che ne ha bisogno.
import { createContext, useContext, useSyncExternalStore } from 'react'

/** Posizione del cursore condiviso, in coordinate del dominio dei Plot (le stesse in tutti i pannelli). */
export interface LinkedPoint {
  x: number
  /** solo con il cursore a due assi */
  y?: number
}

/** Stesso punto (o tutti e due assenti): una mossa che non sposta il cursore non sveglia nessuno. */
export const sameLinkedPoint = (a: LinkedPoint | null, b: LinkedPoint | null): boolean => a === b || (a !== null && b !== null && a.x === b.x && a.y === b.y)

/** Il cursore fuori da React: `get` restituisce lo stesso oggetto finché il punto non cambia. */
export interface LinkedCursorStore {
  get(): LinkedPoint | null
  set(p: LinkedPoint | null): void
  subscribe(listener: () => void): () => void
}

/** Uno store per un gruppo di pannelli collegati (o per il motore che li controlla). */
export function createLinkedCursorStore(initial: LinkedPoint | null = null): LinkedCursorStore {
  let point = initial
  const listeners = new Set<() => void>()
  return {
    get: () => point,
    set(p) {
      if (sameLinkedPoint(point, p)) return
      point = p
      for (const listener of [...listeners]) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
  }
}

/** Il cursore visto da un pannello (nelle sue coordinate, se ha una mappa) e i modi di scriverlo. */
export interface LinkedCursorValue {
  /** il cursore adesso; per ridisegnarsi quando cambia si legge con useLinkedPoint */
  get(): LinkedPoint | null
  subscribe(listener: () => void): () => void
  /** imposta il cursore (anche da un comando fuori dai pannelli) */
  setCursor(p: LinkedPoint | null): void
  /** da passare a onCursor di un Plot: rispetta l'asse condiviso e la sonda persistente */
  fromPlot(p: { x: number; y: number } | null): void
  axis: 'x' | 'xy'
}

export const LinkedCursorContext = createContext<LinkedCursorValue | null>(null)

/** Il cursore dei pannelli collegati che contengono il componente (get, set, asse); null fuori da un LinkedPanels. */
export const useLinkedCursor = (): LinkedCursorValue | null => useContext(LinkedCursorContext)

const noSubscribe = () => () => undefined
const noPoint = () => null

/**
 * Il punto del cursore collegato, vivo: ridisegna solo il componente che lo chiama quando il cursore si muove. Nelle
 * coordinate del pannello che lo contiene; null senza cursore o fuori da un LinkedPanels.
 */
export function useLinkedPoint(): LinkedPoint | null {
  const v = useContext(LinkedCursorContext)
  return useSyncExternalStore(v?.subscribe ?? noSubscribe, v?.get ?? noPoint, v?.get ?? noPoint)
}

/** Il punto di uno store che il motore tiene per sé (prop `store` di LinkedPanels), per una formula o una lettura. */
export function useLinkedCursorStore(store: LinkedCursorStore): LinkedPoint | null {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
