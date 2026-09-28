// Un valore che segue quello vero solo quando smette di cambiare: per le regioni live dei conteggi di ricerca
// (palette, glossario, formulario, copertura). Il numero a vista resta immediato; quello annunciato arriva dopo una
// pausa nella scrittura, così un lettore di schermo dice "7 termini" una volta e non un conteggio per lettera.
import { useEffect, useState } from 'react'

/** Pausa dopo l'ultimo cambio prima di annunciare, in ms: più di un intervallo fra due tasti, meno di un'attesa. */
export const SETTLE_MS = 700

export function useSettledValue<T>(value: T, delay = SETTLE_MS): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    if (Object.is(value, settled)) return
    const t = window.setTimeout(() => setSettled(value), delay)
    return () => window.clearTimeout(t)
  }, [value, settled, delay])
  return settled
}
