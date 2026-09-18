// Figura ritagliata dalla fonte: immagine WebP caricata lazy, didascalia Rich, rimando alla pagina originale
// e zoom in un dialogo. Il dialogo è l'elemento nativo <dialog> aperto con showModal(): intrappola il fuoco,
// rende inerte il resto del foglio, si chiude con Esc e sta nel top layer senza z-index. Dai connettori
// (ui-layouts "dialog", lightbox di 21st.dev) non si è preso codice: nessuno gestiva fuoco e aria-modal.
import { useEffect, useRef, useState } from 'react'
import type { Figure as FigureData } from '../../content/types'
import { targetId, useModule } from './ModuleContext'
import { Rich } from './Rich'
import { BLOCK, BTN_SECONDARY, Icon, Missing } from './shared'
import { SourceRef } from './SourceRef'

/** I file delle figure stanno in public/: "figures/<modulo>/<fig>.webp" va servito dalla base dell'app. */
const figureUrl = (file: string) => `${import.meta.env.BASE_URL}${file.replace(/^\/+/, '')}`

/** `<Figure id />` nell'MDX: prende la figura dai dati del modulo corrente. */
export function Figure({ id }: { id: string }) {
  const data = useModule()
  const figure = data.figures.find((f) => f.id === id)
  if (!figure) return <Missing what="La figura" id={id} />
  return <FigureView figure={figure} anchor={targetId('figure', id)} />
}

/** La figura senza il contesto del modulo. */
export function FigureView({ figure, anchor }: { figure: FigureData; anchor?: string }) {
  const [zoomed, setZoomed] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const src = figureUrl(figure.file)

  useEffect(() => {
    const el = dialog.current
    if (!zoomed || !el || el.open) return
    // jsdom non ha showModal: lì basta l'attributo open
    if (typeof el.showModal === 'function') el.showModal()
    else el.setAttribute('open', '')
  }, [zoomed])

  // chiamata dall'evento close del dialogo (Esc, "Chiudi", clic sul fondale): smonta e riporta il fuoco a chi ha aperto
  const onClosed = () => {
    setZoomed(false)
    opener.current?.focus()
  }
  const requestClose = () => (typeof dialog.current?.close === 'function' ? dialog.current.close() : onClosed())

  return (
    <figure id={anchor} className={`${BLOCK} border border-border-strong bg-surface`}>
      <div className="relative border-b border-border-strong bg-surface-2">
        {/* il clic sull'immagine è una comodità per il mouse: da tastiera e con lettore di schermo c'è il pulsante */}
        <img src={src} alt={figure.alt} loading="lazy" decoding="async" onClick={() => setZoomed(true)} className="mx-auto h-auto max-h-[70dvh] w-auto cursor-zoom-in" />
        <button
          ref={opener}
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="Ingrandisci la figura"
          className={`${BTN_SECONDARY} absolute right-2 bottom-2 min-w-11 bg-surface px-0`}
        >
          <Icon name="zoom" />
        </button>
      </div>
      <figcaption className="flex flex-wrap items-start gap-x-4 gap-y-2 p-4">
        <span className="label pt-0.5">Figura</span>
        <Rich text={figure.caption} className="min-w-0 flex-1 basis-64 text-muted" />
        <SourceRef doc={figure.source.doc} page={figure.source.page} block />
      </figcaption>

      {zoomed && (
        <dialog
          ref={dialog}
          aria-label="Figura ingrandita"
          onClose={onClosed}
          onClick={(e) => e.target === e.currentTarget && requestClose()}
          className="m-auto max-h-[94dvh] w-[min(96vw,80rem)] max-w-none border border-border-strong bg-surface p-0 text-text shadow-2 backdrop:bg-bg/85"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border-strong px-4 py-2">
            <p className="label m-0 text-text">Figura ingrandita</p>
            <button type="button" className={BTN_SECONDARY} onClick={requestClose}>
              <Icon name="cross" size={18} />
              Chiudi
            </button>
          </div>
          <div className="overflow-auto bg-surface-2">
            <img src={src} alt={figure.alt} className="mx-auto h-auto max-h-[80dvh] w-auto max-w-full" />
          </div>
          <Rich text={figure.caption} className="border-t border-border-strong p-4 text-muted" />
        </dialog>
      )}
    </figure>
  )
}
