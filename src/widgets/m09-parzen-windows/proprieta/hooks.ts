// Hook condivisi dai widget del foglio m09 su bias, varianza e consistenza. Solo ciò che il kit non ha:
// - useNarrow: il terreno è stretto (telefono)? Serve a impilare due grafici invece di affiancarli. Cambiare il
//   rapporto del terreno cambia l'altezza, non la larghezza: la misura non rientra in un ciclo.
// - useTween: un numero che raggiunge il nuovo valore in `durationMs` (ease-in-out), con il tempo dei fotogrammi
//   del kit (mai timer). Con reduced motion arriva subito. Serve ai moti brevi di risposta (una superficie che
//   cambia legge, una cella che si riscala), non ai comandi trascinati, che il terreno segue senza ritardo.
import { useCallback, useLayoutEffect, useState } from 'react'
import { useAnimationFrame } from '../../kit/useAnimationFrame'
import { useReducedMotion } from '../../kit/useReducedMotion'
import { easeInOut } from './teoria'

/** [ref da agganciare, stretto?]: stretto quando la larghezza misurata è sotto `threshold` px. Senza ResizeObserver: largo. */
export function useNarrow(threshold: number): [(el: HTMLElement | null) => void, boolean] {
  const [el, setEl] = useState<HTMLElement | null>(null)
  const [narrow, setNarrow] = useState(false)
  useLayoutEffect(() => {
    if (el === null || typeof ResizeObserver === 'undefined') return
    const apply = (w: number) => {
      if (w > 0) setNarrow(w < threshold)
    }
    apply(el.getBoundingClientRect().width)
    const ro = new ResizeObserver((entries) => apply(entries[entries.length - 1]?.contentRect.width ?? 0))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el, threshold])
  const ref = useCallback((node: HTMLElement | null) => setEl(node), [])
  return [ref, narrow]
}

interface TweenState {
  from: number
  to: number
  /** istante di partenza nel tempo dei fotogrammi; null = parte al prossimo fotogramma */
  start: number | null
  now: number
}

/**
 * Valore che insegue `target` in `durationMs` con ease-in-out. Il gesto che cambia il bersaglio non legge
 * l'orologio: l'istante lo fissa il primo fotogramma (come fa il motore density1d).
 */
export function useTween(target: number, durationMs: number): number {
  const reduced = useReducedMotion()
  const [s, setS] = useState<TweenState>({ from: target, to: target, start: null, now: 0 })
  // un bersaglio nuovo: si riparte da dove si è adesso (interrompibile a metà)
  if (s.to !== target) {
    const t = s.start === null ? 0 : Math.min(1, (s.now - s.start) / durationMs)
    const here = s.from + (s.to - s.from) * easeInOut(t)
    setS({ from: reduced ? target : here, to: target, start: null, now: s.now })
  }
  const active = !reduced && s.from !== s.to
  useAnimationFrame((_dt, tMs) => {
    setS((cur) => {
      const start = cur.start ?? tMs
      if (tMs - start >= durationMs) return { from: cur.to, to: cur.to, start: null, now: tMs }
      return { ...cur, start, now: tMs }
    })
  }, active)
  if (reduced || s.from === s.to) return target
  const t = s.start === null ? 0 : Math.min(1, (s.now - s.start) / durationMs)
  return s.from + (s.to - s.from) * easeInOut(t)
}
