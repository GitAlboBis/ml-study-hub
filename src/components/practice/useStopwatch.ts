// Cronometro per il simulatore dell'orale e per il quiz a tempo. Il tempo si misura con Date.now() e non
// contando i tick: se il browser rallenta i timer (scheda in secondo piano) il conto resta giusto.
// Il componente si ridisegna quattro volte al secondo solo mentre il cronometro corre.
import { useCallback, useEffect, useState } from 'react'

const TICK_MS = 250

export interface Stopwatch {
  /** secondi interi trascorsi, per lo schermo */
  seconds: number
  running: boolean
  start(): void
  pause(): void
  /** ferma e azzera */
  reset(): void
  /** secondi trascorsi letti adesso, per registrare un tempo senza aspettare il prossimo tick */
  read(): number
}

interface Clock {
  /** ms accumulati prima della corsa in atto */
  base: number
  /** inizio della corsa in atto; null = fermo */
  startedAt: number | null
}

const elapsedAt = (c: Clock, t: number) => c.base + (c.startedAt === null ? 0 : Math.max(0, t - c.startedAt))

export function useStopwatch(autoStart = false): Stopwatch {
  const [clock, setClock] = useState<Clock>(() => ({ base: 0, startedAt: autoStart ? Date.now() : null }))
  const [now, setNow] = useState(() => Date.now())
  const running = clock.startedAt !== null

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [running])

  const start = useCallback(() => {
    const t = Date.now()
    setClock((c) => (c.startedAt === null ? { base: c.base, startedAt: t } : c))
    setNow(t)
  }, [])

  const pause = useCallback(() => {
    const t = Date.now()
    setClock((c) => (c.startedAt === null ? c : { base: elapsedAt(c, t), startedAt: null }))
    setNow(t)
  }, [])

  const reset = useCallback(() => {
    setClock({ base: 0, startedAt: null })
    setNow(Date.now())
  }, [])

  const read = useCallback(() => Math.floor(elapsedAt(clock, Date.now()) / 1000), [clock])

  return { seconds: Math.floor(elapsedAt(clock, now) / 1000), running, start, pause, reset, read }
}
