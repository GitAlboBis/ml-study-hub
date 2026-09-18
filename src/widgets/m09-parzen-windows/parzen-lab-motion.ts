// Moti brevi dei widget del foglio m09 scritti a mano (lotto "dal conteggio al bias"). Solo hook, niente
// componenti: la regola only-export-components vale per i file .tsx.
//
// useTween: un numero che, quando cambia, passa dal valore mostrato al nuovo in `durationMs` (ease-out),
// con il tempo dei fotogrammi del kit (useAnimationFrame), mai con timer. È la "risposta breve del sistema"
// della guida (sotto i 300 ms): le altezze che si riscalano quando si aggiunge un campione, la forma di un
// kernel che cambia, la scala verticale che si adatta. Con prefers-reduced-motion restituisce subito il valore.
// Il ciclo gira solo durante la transizione. Una transizione interrotta riparte dal valore mostrato.
import { useState } from 'react'
import { easeOut } from '../engines/density1d/density1d'
import { useAnimationFrame } from '../kit/useAnimationFrame'
import { useReducedMotion } from '../kit/useReducedMotion'

interface TweenState {
  from: number
  to: number
  /** istante di partenza nel tempo dei fotogrammi; null finché il primo fotogramma non lo fissa */
  start: number | null
  now: number
}

export function tweenAt(s: TweenState, durationMs: number): number {
  if (s.start === null) return s.from
  const t = durationMs <= 0 ? 1 : (s.now - s.start) / durationMs
  return t >= 1 ? s.to : s.from + (s.to - s.from) * easeOut(t)
}

export function useTween(target: number, durationMs: number): number {
  const reduced = useReducedMotion()
  const [s, setS] = useState<TweenState>({ from: target, to: target, start: 0, now: 0 })
  const shown = tweenAt(s, durationMs)
  // il bersaglio è cambiato: la transizione riparte da ciò che si vede adesso (stato derivato durante il render)
  if (s.to !== target) setS({ from: reduced ? target : shown, to: target, start: null, now: s.now })
  const running = !reduced && (s.start === null || s.now - s.start < durationMs) && s.from !== s.to
  useAnimationFrame((_dt, t) => {
    setS((cur) => {
      const start = cur.start ?? t
      if (t - start >= durationMs) return { from: cur.to, to: cur.to, start, now: t }
      return { ...cur, start, now: t }
    })
  }, running)
  return reduced ? target : shown
}
