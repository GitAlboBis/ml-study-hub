// <Widget id />: carica il widget dal registry, un chunk per widget, e solo quando il foglio ci si avvicina.
// Se il file del widget non esiste ancora mostra la scheda "in costruzione" con titolo e concetti presi da
// data.widgets; se il chunk non si carica o il widget si rompe, l'errore resta dentro la sua cornice.
//
// FUOCO. "Riprova" sparisce appena lo si preme (al suo posto arriva il caricamento, o il widget): senza cure il
// fuoco cadrebbe su <body> e chi usa la tastiera ripartirebbe dall'inizio della pagina. Dopo un Riprova il fuoco
// passa al riquadro del widget (tabIndex -1); se il tentativo fallisce ancora va sul nuovo "Riprova".
import { Component, useContext, useEffect, useRef, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { WidgetElementContext } from '../../widgets/kit/widgetContext'
import { loadWidget } from '../../widgets/registry'
import { ModuleContext, targetId } from './ModuleContext'
import { BLOCK, BTN_SECONDARY, Frame, HATCH, Icon, TITLE } from './shared'

type LoadState = { status: 'loading' | 'missing' | 'error' } | { status: 'ready'; View: ComponentType }

function Trouble({ message, onRetry, focusOnMount = false }: { message: string; onRetry: () => void; focusOnMount?: boolean }) {
  const retry = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (focusOnMount) retry.current?.focus()
  }, [focusOnMount])
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 border border-border-strong bg-error-bg p-4">
      <Icon name="cross" className="text-error" />
      <p className="m-0 min-w-0 flex-1">{message}</p>
      <button ref={retry} type="button" className={BTN_SECONDARY} onClick={onRetry}>
        <Icon name="reset" size={18} />
        Riprova
      </button>
    </div>
  )
}

/** Un widget che lancia durante il render non deve portarsi via il foglio intero. */
class WidgetBoundary extends Component<{ children: ReactNode; onRetry?: () => void }, { failed: boolean }> {
  state = { failed: false }
  /** Vero tra un Riprova e il render che segue: se il widget si rompe ancora, il fuoco va sul nuovo Riprova. */
  private retrying = false

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidUpdate() {
    if (!this.state.failed) this.retrying = false
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <Trouble
        message="Il widget si è fermato per un errore."
        focusOnMount={this.retrying}
        onRetry={() => {
          this.retrying = true
          this.props.onRetry?.()
          this.setState({ failed: false })
        }}
      />
    )
  }
}

export function Widget({ id }: { id: string }) {
  // la chiave azzera lo stato di caricamento se l'id cambia
  return <WidgetSlot key={id} id={id} />
}

function WidgetSlot({ id }: { id: string }) {
  // fuori da un modulo (laboratorio dei widget) il componente funziona lo stesso, senza titolo e concetti
  const entry = useContext(ModuleContext)?.widgets.find((w) => w.id === id)
  const holder = useRef<HTMLDivElement>(null)
  // jsdom e i browser senza IntersectionObserver caricano subito
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined')
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const loading = state.status === 'loading'
  // un Riprova chiesto dall'utente: il fuoco è sul riquadro e, se il caricamento fallisce ancora, va sul nuovo Riprova
  const [retried, setRetried] = useState(false)
  const holdFocus = () => holder.current?.focus()
  const retry = () => {
    holdFocus()
    setRetried(true)
    setState({ status: 'loading' })
  }

  useEffect(() => {
    const el = holder.current
    if (near || !el) return
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: '600px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [near])

  useEffect(() => {
    if (!near || !loading) return
    let alive = true
    loadWidget(id).then(
      (mod) => alive && setState(mod ? { status: 'ready', View: mod.default } : { status: 'missing' }),
      () => alive && setState({ status: 'error' }),
    )
    return () => {
      alive = false
    }
  }, [id, near, loading])

  return (
    <div ref={holder} id={targetId('widget', id)} tabIndex={-1} className={`${BLOCK} wide`}>
      {state.status === 'loading' && (
        <p role="status" className={`label m-0 grid min-h-80 place-items-center border border-border ${HATCH}`}>
          <span className="bg-surface px-2 py-1">Carico il widget…</span>
        </p>
      )}
      {state.status === 'error' && <Trouble message="Il widget non si è caricato. Riprova; se non basta, ricarica la pagina." focusOnMount={retried} onRetry={retry} />}
      {state.status === 'missing' && (
        <Frame label="Widget in costruzione" icon="tripod" flush>
          <div className={`grid min-h-56 content-end gap-3 p-4 @md:p-6 ${HATCH}`}>
            <h4 className={`${TITLE} justify-self-start bg-surface px-1`}>{entry?.title ?? id}</h4>
            {entry && entry.concepts.length > 0 && (
              <ul aria-label="Concetti coperti" className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
                {entry.concepts.map((c) => (
                  <li key={c} className="num m-0 border border-border-strong bg-surface px-2 py-0.5 text-[length:var(--step--1)]">
                    {c}
                  </li>
                ))}
              </ul>
            )}
            <p className="m-0 justify-self-start bg-surface px-1 text-muted">Il rilievo di questo terreno è ancora in corso: qui arriverà il widget interattivo.</p>
          </div>
        </Frame>
      )}
      {state.status === 'ready' && (
        // il riquadro è l'elemento del widget: fuori dalla vista le sue animazioni si fermano (useAnimationFrame)
        <WidgetElementContext.Provider value={holder}>
          <WidgetBoundary onRetry={holdFocus}>
            <state.View />
          </WidgetBoundary>
        </WidgetElementContext.Provider>
      )}
    </div>
  )
}
