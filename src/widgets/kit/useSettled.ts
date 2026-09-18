// Un valore che cambia a ogni fotogramma (trascinando uno slider, in riproduzione) non va annunciato
// a ogni cambio: una regione aria-live lo metterebbe in coda decine di volte al secondo. Questo hook
// restituisce il valore solo dopo che è rimasto fermo per `delayMs`: chi guarda legge il numero vivo,
// chi ascolta sente quello su cui ci si è fermati.
import { useEffect, useState } from 'react'

export const SETTLE_MS = 500

export function useSettled<T>(value: T, delayMs: number = SETTLE_MS): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return settled
}
