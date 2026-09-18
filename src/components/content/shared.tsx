// Primitive condivise dai componenti di contenuto del foglio: icone a un solo tratto, cornice a inchiostro,
// comandi, rivelazione a scomparsa e a passi. Non fanno parte dell'API per gli autori MDX (vedi mdxComponents.ts).
import { useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------------------------
// Classi ricorrenti
// ---------------------------------------------------------------------------------------------

/** Ritmo verticale del contenuto annidato (paragrafi, elenchi, formule che arrivano dall'MDX). */
export const FLOW = '[&>*+*]:mt-3'

/** Margine esterno dei blocchi del foglio: più aria della prosa, così la cornice si stacca dal testo. */
export const BLOCK = 'my-8'

/** Titolo di un blocco. È un h4 perché l'indice del foglio segue h2 e h3; le utility annullano lo stile di `.prose h4`. */
export const TITLE = 'm-0 font-label text-[length:var(--step-2)] leading-tight font-bold tracking-normal text-text normal-case'

const BTN =
  'label inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-m border border-border-strong px-4 py-2 text-center ' +
  'transition-[background-color,color,translate] duration-[var(--dur-fast)] ease-out active:translate-y-px'
/** Azione a inchiostro: pieno blu-notte di giorno, chiaro di notte; al passaggio si inverte. */
export const BTN_PRIMARY = `${BTN} bg-accent text-accent-contrast hover:bg-surface hover:text-text`
export const BTN_SECONDARY = `${BTN} bg-transparent text-text hover:bg-accent hover:text-accent-contrast`
/** Interruttore (aria-pressed): acceso prende lo spillo ocra, che nel foglio segna ciò che è in evidenza. */
export const BTN_TOGGLE =
  `${BTN} border-border bg-transparent text-muted hover:border-border-strong hover:text-text ` +
  'aria-pressed:border-border-strong aria-pressed:bg-pin aria-pressed:text-pin-contrast'

/** Tratteggio cartografico: terreno non ancora rilevato (formula coperta, widget in costruzione). */
export const HATCH = 'bg-[repeating-linear-gradient(135deg,var(--border)_0_1px,transparent_1px_9px)]'

// ---------------------------------------------------------------------------------------------
// Icone: griglia 24, tratto 2, estremità squadrate. Una sola mano per tutto il foglio, niente emoji.
// ---------------------------------------------------------------------------------------------

const ICONS = {
  // rosa dei venti: l'intuizione orienta
  compass: <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" />,
  warning: <path d="M12 4l9 16H3zM12 10v4.5M12 17.5v.5" />,
  // lo spillo: posizione ed evidenza
  pin: (
    <>
      <circle cx="12" cy="8" r="4.5" />
      <path d="M12 12.5V21" />
    </>
  ),
  arrow: <path d="M4 12h14M13 6l6 6-6 6" />,
  note: <path d="M5 6h14M5 12h14M5 18h8" />,
  speech: <path d="M4 5h16v11h-9l-4 4v-4H4z" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  info: <path d="M12 10v8M12 6v.5" />,
  zoom: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21M10.5 8v5M8 10.5h5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <path d="M4 4l16 16" />
    </>
  ),
  chevron: <path d="M7 10l5 5 5-5" />,
  next: <path d="M12 5v13M6 12l6 6 6-6" />,
  reset: <path d="M6 8a7 7 0 1 1-1 5M6 3v5h5" />,
  pencil: <path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" />,
  page: <path d="M6 3h9l4 4v14H6zM15 3v4h4" />,
  // treppiede da rilievo: il widget è ancora in campagna
  tripod: <path d="M8 5h8M12 5v12M12 10L6 20M12 10l6 10" />,
} as const

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {ICONS[name]}
    </svg>
  )
}

// ---------------------------------------------------------------------------------------------
// Cornice
// ---------------------------------------------------------------------------------------------

interface FrameProps {
  /** id DOM: la destinazione di copertura (targetId) */
  id?: string
  /** classe dell'informazione, in testa alla cornice: "Formula", "Dimostrazione", … */
  label: string
  icon?: IconName
  /** ciò che sta a destra nella testata: segnali e comandi */
  actions?: ReactNode
  /** id dell'elemento che dà il nome al blocco: entrando con il fuoco si sente di quale formula o esempio sono i comandi */
  labelledBy?: string
  /** senza margine esterno: quando il blocco che la contiene ha già il suo */
  flush?: boolean
  children: ReactNode
}

/** Cornice di un blocco del foglio: bordo a inchiostro, angoli vivi, nessuna ombra. È un contenitore per le container query. */
export function Frame({ id, label, icon, actions, labelledBy, flush = false, children }: FrameProps) {
  return (
    // role="group" e non una regione: decine di landmark per foglio renderebbero inutile l'elenco dei landmark
    <section id={id} role={labelledBy ? 'group' : undefined} aria-labelledby={labelledBy} className={`${flush ? '' : BLOCK} @container border border-border-strong bg-surface`}>
      <header className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border-strong px-4 py-1.5">
        <p className="label m-0 flex items-center gap-2 text-text">
          {icon && <Icon name={icon} size={18} />}
          {label}
        </p>
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  )
}

/** Un id che non esiste in data.ts deve vedersi nel foglio (il validatore lo ferma prima, ma l'MDX non è tipizzato). */
export function Missing({ what, id }: { what: string; id: string }) {
  return (
    <p role="alert" className={`${BLOCK} flex items-center gap-3 border border-border bg-error-bg p-3`}>
      <Icon name="cross" className="text-error" />
      <span>
        {what} <code>{id}</code> non esiste nei dati di questo modulo.
      </span>
    </p>
  )
}

// ---------------------------------------------------------------------------------------------
// Rivelazione a scomparsa (Reveal, Proof)
// ---------------------------------------------------------------------------------------------

interface DisclosureProps {
  summary: ReactNode
  children: ReactNode
  className?: string
  buttonClassName?: string
  panelClassName?: string
}

/**
 * Pulsante che apre e chiude un pannello (aria-expanded + aria-controls). Il contenuto nasce al primo clic e poi
 * resta montato da chiuso, così un quiz o un widget al suo interno non perde lo stato.
 */
export function Disclosure({ summary, children, className = '', buttonClassName = '', panelClassName = '' }: DisclosureProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const panelId = useId()
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen(!open)
          setMounted(true)
        }}
        className={`flex min-h-11 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2 ${buttonClassName}`}
      >
        <Icon name="chevron" size={18} className={`transition-[rotate] duration-[var(--dur-fast)] ease-out ${open ? 'rotate-180' : ''}`} />
        {summary}
      </button>
      <div id={panelId} hidden={!open} className={panelClassName}>
        {mounted && children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Rivelazione a passi (Derivation, Example)
// ---------------------------------------------------------------------------------------------

/** Ingresso di un passo appena rivelato: parte da @starting-style, quindi senza supporto compare e basta. */
export const STEP_ENTER =
  'transition-[opacity,translate] duration-[var(--dur-base)] ease-out starting:translate-y-2 starting:opacity-0'

interface StepControlsProps {
  shown: number
  total: number
  onNext: () => void
  onAll: () => void
  onReset: () => void
  /** etichetta dell'azione primaria quando non è "Passo successivo" (modalità "prova tu") */
  nextLabel?: string
}

/**
 * Comandi di una sequenza a passi. L'azione primaria resta sempre lo stesso pulsante (avanza, poi ricomincia):
 * il fuoco da tastiera non si perde mai. La scala graduata fa da avanzamento, la lettura è annunciata (aria-live).
 */
export function StepControls({ shown, total, onNext, onAll, onReset, nextLabel = 'Passo successivo' }: StepControlsProps) {
  const primary = useRef<HTMLButtonElement>(null)
  if (total <= 1) return null
  const done = shown >= total
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border-strong px-4 py-3">
      <button ref={primary} type="button" className={done ? BTN_SECONDARY : BTN_PRIMARY} onClick={done ? onReset : onNext}>
        <Icon name={done ? 'reset' : 'next'} size={18} />
        {done ? 'Ricomincia' : nextLabel}
      </button>
      {!done && (
        <button
          type="button"
          className={BTN_SECONDARY}
          onClick={() => {
            onAll()
            primary.current?.focus()
          }}
        >
          Mostra tutti i passi
        </button>
      )}
      <div className="ml-auto flex items-center gap-3">
        <span aria-hidden="true" className="flex h-2 w-24 border border-border-strong">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`flex-1 border-border-strong not-first:border-l ${i < shown ? 'bg-accent' : ''}`} />
          ))}
        </span>
        <p role="status" className="num m-0 text-[length:var(--step--1)] text-muted">
          Passo {shown} di {total}
        </p>
      </div>
    </div>
  )
}
