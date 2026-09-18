// La finestra cartografica del foglio: ogni widget vive qui dentro.
//
//   ┌ cartiglio ──────────────────────────────────────────────┐   titolo, "dati sintetici", scenario,
//   │ Titolo                                   [Reset] [⛶]    │   Reset e schermo intero
//   ├──────────────────────────────────────────┬──────────────┤
//   │ ╔═╤═╤═╤═╤═╤═╤═╤═╤═╗  terreno: squadratura│ COMANDI      │   sotto il terreno su mobile,
//   │ ║   area visuale  ║  a inchiostro con    │ slider, …    │   a destra da 1024 px (se la finestra
//   │ ╚═╧═╧═╧═╧═╧═╧═╧═╧═╝  le tacche           │              │   è abbastanza larga da reggerli)
//   │ trasporto (Play, passi)                  │              │
//   │ didascalia del passo                     │              │
//   ├──────────────────────────────────────────┴──────────────┤
//   │ sfida                                                   │
//   └─────────────────────────────────────────────────────────┘
//
// Regole del mondo: angoli vivi, cornici a bordo d'inchiostro, nessuna ombra (la finestra non si
// sovrappone a nulla), solo token. L'ordine nel DOM è quello di lettura e del Tab: terreno,
// trasporto, didascalia, comandi, sfida.
//
// SCHERMO INTERO. Si usa l'API del browser; dove manca (Safari su iPhone) o viene rifiutata la
// finestra si espande sulla pagina con position: fixed, la pagina sotto non scorre ed Esc chiude.
// Nei due casi il widget non viene smontato: lo stato dell'esercizio resta.
// Il ripiego si comporta come un dialogo modale senza spostare il riquadro nel DOM (un <dialog> o un
// portale lo smonterebbero): tutto ciò che sta fuori diventa `inert`, quindi né il Tab né lo swipe
// di VoiceOver arrivano ai contenuti coperti; se il fuoco esce lo stesso (browser senza inert) torna
// dentro, al primo o all'ultimo comando secondo il verso del Tab. Uscendo con Esc il fuoco torna al
// pulsante "Schermo intero".
//
// MOTO. Nessuno, a parte la risposta alla pressione dei pulsanti. L'ingresso a schermo intero lo
// anima già il sistema; il ripiego compare subito.
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import type { ScenarioId, WidgetMeta } from '../types'
import { ActionButton } from './ActionButton'
import { WidgetElementContext, WidgetMetaContext } from './widgetContext'

export interface WidgetFrameProps {
  meta: WidgetMeta
  /** L'area visuale: il terreno (SVG, canvas). Riempie un riquadro con il rapporto `aspect`. */
  children: ReactNode
  /** Slider, selettori, letture: sotto il terreno su mobile, a destra da 1024 px. */
  controls?: ReactNode
  /** Il trasporto dello storyboard (PlayControls), agganciato sotto il terreno a sinistra. */
  transport?: ReactNode
  /** Didascalia del passo (StepCaption). */
  caption?: ReactNode
  /** La sfida del widget (Challenge). */
  challenge?: ReactNode
  /** Riporta il widget allo stato iniziale. Senza, il pulsante Reset non compare. */
  onReset?: () => void
  /** Larghezza / altezza dell'area visuale. Predefinito 16:10. */
  aspect?: number
}

/** Nomi degli scenari del cast (docs/plan/cast.md) come si leggono nel cartiglio. */
const SCENARIO_NAMES: Record<ScenarioId, string> = {
  pesce: 'Pesce',
  telerilevamento: 'Telerilevamento',
  medicina: 'Medicina',
  spam: 'Spam',
  cifre: 'Cifre',
  sensori: 'Sensori',
  energia: 'Energia',
  case: 'Case',
  banca: 'Banca',
  incendio: 'Incendio',
  robot: 'Robot',
  traduzione: 'Traduzione',
  immagini: 'Immagini',
  fonte: 'Dalla fonte',
}

// Squadratura del terreno: fra il bordo esterno e quello interno corre una fascia con le tacche della
// graduazione, una ogni decimo del lato, che partono dal bordo interno verso l'esterno. Sono quattro
// gradienti ancorati al riquadro interno (background-origin: content-box) e spinti nella fascia.
const TICK_LENGTH = 5
const BAND = 7
const tickLine = (direction: 'right' | 'bottom') =>
  `repeating-linear-gradient(to ${direction}, transparent 0 calc(5% - 0.5px), var(--border-strong) calc(5% - 0.5px) calc(5% + 0.5px), transparent calc(5% + 0.5px) 10%)`
const NEATLINE: CSSProperties = {
  padding: BAND,
  backgroundOrigin: 'content-box',
  backgroundRepeat: 'no-repeat',
  backgroundImage: [tickLine('right'), tickLine('right'), tickLine('bottom'), tickLine('bottom')].join(', '),
  backgroundSize: `100% ${TICK_LENGTH}px, 100% ${TICK_LENGTH}px, ${TICK_LENGTH}px 100%, ${TICK_LENGTH}px 100%`,
  backgroundPosition: `0 -${TICK_LENGTH}px, 0 calc(100% + ${TICK_LENGTH}px), -${TICK_LENGTH}px 0, calc(100% + ${TICK_LENGTH}px) 0`,
}

/** Il pulsante "Schermo intero" dentro la finestra: dove torna il fuoco quando il ripiego si chiude con Esc. */
const TOGGLE_ATTR = 'data-fullscreen-toggle'

type Focusable = Element & HTMLOrSVGElement

/** Ciò che dentro `root` si raggiunge con il Tab, in ordine di documento (anche i segni SVG con tabindex). */
function tabbables(root: Element): Focusable[] {
  const selector = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]'
  return [...root.querySelectorAll<Focusable & Element>(selector)].filter(
    (el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && el.closest('[hidden], [inert]') === null,
  )
}

/**
 * Rende inerte tutto ciò che non contiene `el`: i fratelli di `el` e di ogni suo antenato fino a <body>.
 * Restituisce il ripristino, che toglie `inert` solo dove l'ha messo.
 */
function inertOutside(el: Element): () => void {
  const touched: Element[] = []
  for (let node: Element = el; node.parentElement !== null && node !== document.body; node = node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling === node || sibling.hasAttribute('inert') || sibling instanceof HTMLScriptElement || sibling instanceof HTMLStyleElement) continue
      sibling.setAttribute('inert', '')
      touched.push(sibling)
    }
  }
  return () => {
    for (const sibling of touched) sibling.removeAttribute('inert')
  }
}

/** Schermo intero dell'elemento `ref`: API del browser se c'è, altrimenti espansione sulla pagina. */
function useExpand(ref: RefObject<HTMLElement | null>) {
  const [native, setNative] = useState(false)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const sync = () => setNative(ref.current !== null && document.fullscreenElement === ref.current)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [ref])

  useEffect(() => {
    const el = ref.current
    if (!fallback || el === null) return
    let backwards = false
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') backwards = e.shiftKey
      if (e.key !== 'Escape') return
      setFallback(false)
      el.querySelector<HTMLElement>(`[${TOGGLE_ATTR}]`)?.focus()
    }
    // rete di sicurezza per i browser senza inert: il fuoco che esce dal riquadro ci rientra dal lato giusto
    const onFocusIn = (e: FocusEvent) => {
      if (e.target instanceof Node && el.contains(e.target)) return
      // un dialogo modale aperto sopra (ingrandimento, palette dei comandi) ha il suo fuoco: non lo si ruba
      if (e.target instanceof Element && e.target.closest('dialog[open]') !== null) return
      const inside = tabbables(el)
      ;(backwards ? inside.at(-1) : inside[0])?.focus()
    }
    const page = document.documentElement
    const before = page.style.overflow
    page.style.overflow = 'hidden'
    const restoreInert = inertOutside(el)
    document.addEventListener('keydown', onKey)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      page.style.overflow = before
      restoreInert()
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [fallback, ref])

  const toggle = useCallback(() => {
    const el = ref.current
    if (el === null) return
    if (document.fullscreenElement === el) {
      void document.exitFullscreen()
    } else if (fallback) {
      setFallback(false)
    } else if (document.fullscreenEnabled && typeof el.requestFullscreen === 'function') {
      el.requestFullscreen().catch(() => setFallback(true))
    } else {
      setFallback(true)
    }
  }, [ref, fallback])

  return { expanded: native || fallback, toggle }
}

const ICON = { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'square', 'aria-hidden': true } as const

export function WidgetFrame({ meta, children, controls, transport, caption, challenge, onReset, aspect = 1.6 }: WidgetFrameProps) {
  const frame = useRef<HTMLElement>(null)
  const titleId = useId()
  const controlsId = useId()
  const { expanded, toggle } = useExpand(frame)

  // a schermo intero il terreno cresce finché sta in altezza, senza perdere il rapporto
  const neatline: CSSProperties = expanded ? { ...NEATLINE, width: `min(100%, calc(72dvh * ${aspect}))`, marginInline: 'auto' } : NEATLINE

  return (
    <WidgetMetaContext.Provider value={meta}>
      {/* la sezione è l'elemento del widget per ciò che ci sta dentro: fuori dalla vista le animazioni si fermano */}
      <WidgetElementContext.Provider value={frame}>
        <section
          ref={frame}
          aria-labelledby={titleId}
          data-widget={meta.id}
          data-size={meta.size}
          data-expanded={expanded ? 'true' : undefined}
          className={`@container w-full border-2 border-border-strong bg-surface text-text ${expanded ? 'fixed inset-0 z-50 overflow-auto' : 'relative'}`}
        >
          <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-border-strong px-4 py-3">
            <div className="grid min-w-0 gap-1.5">
              <h3 id={titleId} className="font-label text-[length:var(--step-2)] leading-tight font-bold">
                {meta.title}
              </h3>
              <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[length:var(--step--1)] text-muted">
                <span className="label inline-flex items-center gap-1.5 border border-border bg-info-bg px-1.5 py-0.5 text-text">
                  <svg {...ICON} width={14} height={14} className="text-info">
                    <path d="M12 10v8M12 6v.5" />
                  </svg>
                  Dati sintetici
                </span>
                <span className="label">Scenario · {SCENARIO_NAMES[meta.scenario]}</span>
                <span>{meta.scenarioNote}</span>
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {onReset !== undefined && (
                <ActionButton onClick={onReset} title="Riporta il widget allo stato iniziale">
                  <svg {...ICON}>
                    <path d="M5 12a7 7 0 1 0 2-4.9M5 4v4h4" />
                  </svg>
                  Reset
                </ActionButton>
              )}
              <ActionButton data-fullscreen-toggle="" iconOnly aria-label="Schermo intero" aria-pressed={expanded} title={expanded ? 'Esci da schermo intero (Esc)' : 'Schermo intero'} onClick={toggle}>
                <svg {...ICON}>{expanded ? <path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" /> : <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />}</svg>
              </ActionButton>
            </div>
          </header>

          <div className="grid lg:@3xl:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)]">
            <div className="min-w-0">
              <div className="p-3 sm:p-4">
                <div className="border-2 border-border-strong bg-surface" style={neatline}>
                  <div className="relative overflow-hidden border border-border-strong bg-bg [&>canvas]:size-full [&>svg]:size-full" style={{ aspectRatio: String(aspect) }}>
                    {children}
                  </div>
                </div>
              </div>
              {transport !== undefined && <div className="px-3 pb-4 sm:px-4">{transport}</div>}
              {caption !== undefined && <div className="border-t border-border px-4 py-3">{caption}</div>}
            </div>

            {controls !== undefined && (
              <div role="group" aria-labelledby={controlsId} className="grid content-start gap-5 border-t border-border-strong p-4 lg:@3xl:border-t-0 lg:@3xl:border-l">
                <h4 id={controlsId} className="label m-0">
                  Comandi
                </h4>
                {controls}
              </div>
            )}
          </div>

          {challenge !== undefined && <div className="border-t border-border-strong p-4">{challenge}</div>}
        </section>
      </WidgetElementContext.Provider>
    </WidgetMetaContext.Provider>
  )
}
