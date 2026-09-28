// Pezzi senza componenti condivisi dai giochi: le props comuni, il seed di una partita, i tasti rapidi e il
// fuoco sul titolo dell'esito. Stanno in un .ts perché i file .tsx esportano solo componenti.
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { ModuleData } from '../../content/types'
import type { GameScope } from './pool'

/** Le props di ogni gioco: i fogli del campo (già filtrati), il campo, e un seed fisso per i test. */
export interface GameProps {
  modules: ModuleData[]
  scope: GameScope
  /** seed della prima partita; senza, ne nasce uno nuovo a ogni partita */
  seed?: number
}

/** Un seed intero a 32 bit per una partita nuova (createRng vuole interi, non Math.random()). */
export const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0

/** L'elemento ha il fuoco in un campo di testo o in un menu: lì i tasti servono a scrivere. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Tasti rapidi di un gioco su tutta la pagina, finché `active` è vero. Il gestore riceve il tasto già
 * normalizzato (e.key) e restituisce true se l'ha usato: allora l'evento non prosegue. Non scattano con
 * Ctrl, Alt o Meta, né mentre si scrive in un campo.
 */
export function useHotkeys(handler: (key: string, e: KeyboardEvent) => boolean, active = true): void {
  const latest = useRef(handler)
  // nel commit, prima del prossimo tasto: il gestore vede sempre lo stato appena disegnato
  useLayoutEffect(() => {
    latest.current = handler
  })
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey || isTyping(e.target)) return
      if (latest.current(e.key, e)) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])
}

/**
 * Porta il fuoco sull'elemento al montaggio (il titolo dell'esito, la prima domanda), se `active`.
 * Al primo caricamento della pagina i giochi non lo chiedono: il fuoco spostato farebbe scorrere la
 * pagina oltre le regole. Lo chiedono dopo "Gioca ancora", quando il pulsante premuto sparisce.
 */
export function useFocusOnMount<T extends HTMLElement>(active = true): RefObject<T | null> {
  const ref = useRef<T>(null)
  // conta il valore del montaggio: cambiarlo dopo non sposta il fuoco
  const wanted = useRef(active)
  useEffect(() => {
    if (wanted.current) ref.current?.focus()
  }, [])
  return ref
}

/** "1 risposta", "3 risposte". */
export const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Larghezza di lettura dei giochi: un tavolo, non tutto il foglio. */
export const GAME_COLUMN = 'mx-auto w-full max-w-[64rem]'
