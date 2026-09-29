// Il canale dei fotogrammi (regola 4 di engines.md): il tempo dello storyboard per i soli strati che si muovono.
//
//   const [channel] = useState(() => createFrameChannel())
//   const sb = useStoryboard(steps, { onFrame: channel.set })
//   …
//   function CellLayer({ channel, playing }) { const { index, progress } = useFrameChannel(channel, playing); … }
//
// useStoryboard consegna (progress, index) a ogni fotogramma fuori da React; qui lo leggono con
// useSyncExternalStore solo i componenti che disegnano il moto, così a ogni fotogramma si ridisegnano loro e non
// il widget intero con comandi, formule e mappe. È il modello di m08-cella-che-si-espande, portato nella base comune.
import { useSyncExternalStore } from 'react'

export interface FrameSnapshot {
  /** avanzamento del passo corrente, da 0 a 1 */
  progress: number
  /** indice del passo corrente */
  index: number
}

export interface FrameChannel {
  get(): FrameSnapshot
  /** firma di onFrame di useStoryboard: si passa com'è */
  set(progress: number, index: number): void
  subscribe(listener: () => void): () => void
}

/** Un canale per un widget: la fotografia cambia solo se cambia progress o index. */
export function createFrameChannel(initial: FrameSnapshot = { progress: 0, index: 0 }): FrameChannel {
  let snap = initial
  const listeners = new Set<() => void>()
  return {
    get: () => snap,
    set(progress, index) {
      if (snap.progress === progress && snap.index === index) return
      snap = { progress, index }
      for (const listener of [...listeners]) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
  }
}

/**
 * Il tempo dello storyboard per uno strato animato. Un passo raggiunto a storyboard fermo (Passo avanti, Passo
 * indietro, clic sulla scala dei passi) arriva con progresso 0: lì si mostra lo stato FINALE del passo, come una
 * diapositiva (ogni passo è uno stato completo). Una Pausa a metà passo invece congela il punto in cui si era.
 */
export function useFrameChannel(channel: FrameChannel, playing: boolean): FrameSnapshot {
  const f = useSyncExternalStore(channel.subscribe, channel.get, channel.get)
  return !playing && f.progress === 0 ? { index: f.index, progress: 1 } : f
}
