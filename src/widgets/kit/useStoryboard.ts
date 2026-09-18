// Storyboard di un widget: una sequenza di passi con durata, fatta scorrere dal tempo dei fotogrammi
// (il dt di useAnimationFrame), mai da setInterval o setTimeout. Così la pausa conserva il punto
// esatto, la velocità scala il tempo, a scheda nascosta tutto si ferma e un fotogramma in ritardo
// non fa saltare un passo della spiegazione.
//
// SCELTA SUI RENDER. Il tempo vive in un piccolo store fuori da React (createStore), letto con
// useSyncExternalStore. Lo store pubblica uno snapshot nuovo solo quando cambia qualcosa che il
// componente mostra: indice, playing, speed. `progress` cambia a ogni fotogramma, quindi è un
// getter che si annota la lettura: finché nessuno lo legge, i fotogrammi aggiornano solo lo store
// (zero render tra un passo e l'altro); dalla prima lettura in poi lo store pubblica anche i
// fotogrammi e il componente che possiede l'hook si ridisegna a ogni frame. Chi vuole il valore
// continuo senza render (canvas, motion value, attributi SVG) passa `onFrame`, chiamato a ogni
// fotogramma fuori da React. Alternative scartate: `progress` nello stato a ogni fotogramma (60
// render al secondo dell'intero widget anche se mostra solo il passo corrente); un `subscribe` nel
// valore di ritorno (cambierebbe l'interfaccia che PlayControls e i widget ricevono).
import { useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useAnimationFrame } from './useAnimationFrame'
import { useReducedMotion } from './useReducedMotion'

export interface StoryboardStep {
  id: string
  label: string
  /** Durata a velocità 1. Zero, negativa o non finita: il passo è già compiuto e in riproduzione si salta. */
  durationMs: number
}

export interface StoryboardOptions {
  /** Parte da solo al montaggio. Ignorato con prefers-reduced-motion. */
  autoplay?: boolean
  /** Dopo l'ultimo passo ricomincia dal primo invece di fermarsi. */
  loop?: boolean
  /** Velocità iniziale (1 = durate dichiarate). Dopo il montaggio si cambia con setSpeed(). */
  speed?: number
  /**
   * Canale senza render: riceve (progress, index) al montaggio, a ogni fotogramma in riproduzione e
   * a ogni salto (next, prev, goto, reset, play, pause). Con reduced motion progress vale sempre 1 e
   * arriva solo ai cambi di passo. Può cambiare a ogni render: si usa sempre l'ultima.
   */
  onFrame?: (progress: number, index: number) => void
}

export interface Storyboard {
  index: number
  step: { id: string; label: string }
  /**
   * Avanzamento del passo corrente, da 0 a 1 (sempre 1 con reduced motion). Leggerlo iscrive il
   * componente agli aggiornamenti per fotogramma: chi mostra solo il passo non lo legga.
   */
  progress: number
  playing: boolean
  speed: number
  /** A storyboard finito (ultimo passo compiuto, senza loop) ricomincia dal primo passo. */
  play(): void
  pause(): void
  toggle(): void
  /** Passo successivo dall'inizio; sull'ultimo passo non fa nulla. */
  next(): void
  /** Passo precedente dall'inizio; sul primo passo lo fa ripartire. */
  prev(): void
  /** Va all'inizio del passo i, riportato dentro l'elenco e troncato a intero. NaN è ignorato. */
  goto(i: number): void
  /** Primo passo, fermo. La velocità scelta dall'utente resta. */
  reset(): void
  /** Accetta solo numeri finiti maggiori di zero. */
  setSpeed(s: number): void
}

interface Config {
  steps: StoryboardStep[]
  loop: boolean
  reduced: boolean
  onFrame: StoryboardOptions['onFrame']
}

interface Snapshot {
  index: number
  progress: number
  playing: boolean
  speed: number
}

const NO_STEP: Storyboard['step'] = Object.freeze({ id: '', label: '' })

const validSpeed = (s: unknown): s is number => typeof s === 'number' && Number.isFinite(s) && s > 0

function durationOf(steps: StoryboardStep[], index: number): number {
  const d = steps[index]?.durationMs
  return d !== undefined && Number.isFinite(d) && d > 0 ? d : 0
}

function progressOf(steps: StoryboardStep[], index: number, elapsedMs: number): number {
  const d = durationOf(steps, index)
  return d === 0 ? 1 : Math.min(elapsedMs / d, 1)
}

/** Il tempo dello storyboard, fuori da React. Uno store per ogni istanza dell'hook. */
function createStore(initial: Config, autoplay: boolean, speed: number) {
  let cfg = initial
  const m = {
    index: 0,
    /** millisecondi già trascorsi nel passo corrente, in tempo di storyboard (dt × speed) */
    elapsedMs: 0,
    playing: autoplay && !initial.reduced && initial.steps.length > 0,
    speed,
  }
  let progressRead = false
  let snapshot: Snapshot = { index: 0, progress: progressOf(cfg.steps, 0, 0), playing: m.playing, speed }
  const listeners = new Set<() => void>()

  const emit = () => cfg.onFrame?.(cfg.reduced ? 1 : progressOf(cfg.steps, m.index, m.elapsedMs), m.index)

  /**
   * `discrete`: è cambiato qualcosa che ogni consumatore vede (passo, playing, speed, un salto).
   * Un fotogramma qualsiasi (discrete = false) arriva a React solo se qualcuno legge progress.
   */
  const publish = (discrete: boolean) => {
    if (discrete || !cfg.reduced) emit()
    if (!discrete && (cfg.reduced || !progressRead)) return
    const progress = progressOf(cfg.steps, m.index, m.elapsedMs)
    const s = snapshot
    if (s.index === m.index && s.progress === progress && s.playing === m.playing && s.speed === m.speed) return
    snapshot = { index: m.index, progress, playing: m.playing, speed: m.speed }
    for (const listener of [...listeners]) listener()
  }

  const goto = (i: number) => {
    const n = cfg.steps.length
    if (n === 0 || Number.isNaN(i)) return
    m.index = Math.min(Math.max(Math.trunc(i), 0), n - 1)
    m.elapsedMs = 0
    publish(true)
  }
  const play = () => {
    const last = cfg.steps.length - 1
    if (m.playing || last < 0) return
    const ended = !cfg.loop && m.index >= last && m.elapsedMs >= durationOf(cfg.steps, last)
    if (ended) {
      m.index = 0
      m.elapsedMs = 0
    }
    m.playing = true
    publish(true)
  }
  const pause = () => {
    if (!m.playing) return
    m.playing = false
    publish(true)
  }

  const actions: Pick<Storyboard, 'play' | 'pause' | 'toggle' | 'next' | 'prev' | 'goto' | 'reset' | 'setSpeed'> = {
    play,
    pause,
    toggle: () => (m.playing ? pause() : play()),
    next: () => {
      if (m.index < cfg.steps.length - 1) goto(m.index + 1)
    },
    prev: () => goto(m.index - 1),
    goto,
    reset: () => {
      m.index = 0
      m.elapsedMs = 0
      m.playing = false
      publish(true)
    },
    setSpeed: (s) => {
      if (!validSpeed(s)) return
      m.speed = s
      publish(true)
    },
  }

  return {
    actions,
    emit,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    trackProgress: () => {
      progressRead = true
    },
    /** Passi e opzioni dell'ultimo render. Se i passi sono diminuiti l'indice rientra nell'elenco. */
    configure: (next: Config) => {
      cfg = next
      const last = Math.max(0, cfg.steps.length - 1)
      if (m.index <= last) return
      m.index = last
      m.elapsedMs = 0
      publish(true)
    },
    /** Un fotogramma: fa scorrere il tempo del passo e, se il passo è compiuto, va al successivo. */
    tick: (dtMs: number) => {
      const { steps, loop } = cfg
      if (!m.playing || steps.length === 0) return
      const before = m.index
      m.elapsedMs += dtMs * m.speed
      // Il resto di un passo passa al successivo, così i tempi non derivano. Al più un giro
      // dell'elenco per fotogramma: con durate nulle e loop il ciclo non gira all'infinito.
      for (let hops = 0; hops < steps.length && m.elapsedMs >= durationOf(steps, m.index); hops++) {
        const isLast = m.index === steps.length - 1
        if (isLast && !loop) {
          m.playing = false
          break
        }
        m.elapsedMs -= durationOf(steps, m.index)
        m.index = isLast ? 0 : m.index + 1
      }
      m.elapsedMs = Math.min(m.elapsedMs, durationOf(steps, m.index))
      publish(m.index !== before || !m.playing)
    },
  }
}

/**
 * Sequenza di passi animata e controllabile (Play, Pausa, Passo, Velocità, Reset).
 * Con prefers-reduced-motion `autoplay` è ignorato e `progress` vale 1 a ogni passo: ogni passo mostra
 * subito il suo stato finale. Se l'utente preme Play i passi scorrono lo stesso, come diapositive,
 * con le loro durate e senza interpolazione.
 * `steps` e `opts` possono essere ricreati a ogni render: indice e tempo non ne risentono.
 */
export function useStoryboard(steps: StoryboardStep[], opts: StoryboardOptions = {}): Storyboard {
  const reduced = useReducedMotion()
  const { autoplay = false, loop = false, onFrame } = opts
  const config: Config = { steps, loop, reduced, onFrame }

  const [store] = useState(() => createStore(config, autoplay, validSpeed(opts.speed) ? opts.speed : 1))
  // Effetto di layout senza dipendenze: fotogrammi e azioni vedono sempre i passi dell'ultimo render.
  useLayoutEffect(() => {
    store.configure(config)
  })
  // Stato iniziale per chi disegna con onFrame, e di nuovo se la preferenza di movimento cambia.
  useEffect(() => {
    store.emit()
  }, [store, reduced])

  const view = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useAnimationFrame(store.tick, view.playing)

  const index = Math.min(view.index, Math.max(0, steps.length - 1))
  const step: Storyboard['step'] = steps[index] ?? NO_STEP
  const progress = reduced ? 1 : view.progress

  return useMemo<Storyboard>(
    () => ({
      index,
      step,
      get progress() {
        store.trackProgress()
        return progress
      },
      playing: view.playing,
      speed: view.speed,
      ...store.actions,
    }),
    [store, index, step, progress, view.playing, view.speed],
  )
}
