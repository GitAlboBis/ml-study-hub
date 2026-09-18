// Pezzi comuni della pratica nel mondo dell'atlante: tasti, tacche d'angolo delle tessere, timbri
// (per votare e per segnare un esito), tasselli di avanzamento, pallini di difficoltà.
//
// Connettori consultati prima di scriverli (21st.dev search, Magic UI, ui-layouts): "flip card" e
// "quiz" portano carte 3D con inclinazione al passaggio, anelli di progresso circolari e scelte in
// pillole arrotondate con ombra. Nessuno regge il mondo (angoli vivi, bordo a inchiostro, niente
// anelli): se ne tiene solo la semantica (pulsanti veri, nomi accessibili, stato annunciato).
import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Testata di una scheda di pratica del foglio: titolo italiano con il termine inglese in corsivo, una
 * riga che dice come si usa, e le letture (quante carte, quante domande) in una riga di legenda.
 */
export function PracticeHeader({ id, title, en, lead, children }: { id: string; title: string; en: string; lead: ReactNode; children?: ReactNode }) {
  return (
    <header className="grid gap-3">
      {/* come i titoli delle altre schede del foglio (TAB_H2 in pages/module/ui.ts): filo d'inchiostro sopra */}
      <h2 id={id} className="m-0 flex flex-wrap items-baseline gap-x-3 border-t border-border-strong pt-3 font-label text-[length:var(--step-2)] leading-tight font-bold">
        {title}
        <span lang="en" className="font-body text-[length:var(--step-1)] font-normal text-muted italic">
          {en}
        </span>
      </h2>
      <p className="m-0 max-w-[var(--measure)] text-muted">{lead}</p>
      {children !== undefined && <div className="flex flex-wrap gap-x-8 gap-y-2">{children}</div>}
    </header>
  )
}

/** Lettura piccola della testata: etichetta e cifra sulla stessa riga. */
export function Reading({ label, value }: { label: string; value: ReactNode }) {
  return (
    <p className="m-0 flex items-baseline gap-2">
      <span className="label">{label}</span>
      <span className="num text-text">{value}</span>
    </p>
  )
}

/** Tasto della tastiera, nelle scorciatoie scritte accanto ai comandi. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="num inline-grid min-w-6 place-items-center border border-border-strong bg-surface px-1 text-[length:var(--step--1)] leading-5 text-text not-italic">
      {children}
    </kbd>
  )
}

/**
 * Tacche d'angolo di una tessera di rilievo, come i segni di registro ai quattro angoli di un foglio.
 * Decorative: il contenitore deve essere `relative`.
 */
export function Ticks() {
  const c = 'pointer-events-none absolute size-3 border-border-strong'
  return (
    <span aria-hidden="true">
      <span className={`${c} -top-1.5 -left-1.5 border-t-2 border-l-2`} />
      <span className={`${c} -top-1.5 -right-1.5 border-t-2 border-r-2`} />
      <span className={`${c} -bottom-1.5 -left-1.5 border-b-2 border-l-2`} />
      <span className={`${c} -right-1.5 -bottom-1.5 border-r-2 border-b-2`} />
    </span>
  )
}

interface StampButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
  /** cifra grande del timbro: il tasto della scorciatoia o il voto */
  mark: string
  label: string
  /** riga piccola sotto l'etichetta: "domani", "tra 6 giorni" */
  detail?: string
  /** acceso con lo spillo: il voto suggerito */
  pinned?: boolean
}

/**
 * Timbro da premere: doppio filetto a inchiostro, cifra in mono, etichetta condensata. Al passaggio si
 * inchiostra; alla pressione cede appena (scale 0.97), l'unico moto, perché si preme decine di volte.
 */
export function StampButton({ mark, label, detail, pinned = false, className = '', ...rest }: StampButtonProps) {
  return (
    <button
      type="button"
      className={
        'group min-h-16 cursor-pointer border-2 border-border-strong p-[3px] text-text transition-[background-color,color,scale] duration-[var(--dur-fast)] ease-out ' +
        'hover:bg-accent hover:text-accent-contrast active:scale-[0.97] disabled:cursor-not-allowed disabled:border-border disabled:text-faint disabled:hover:bg-transparent disabled:active:scale-100 ' +
        `${pinned ? 'bg-pin text-pin-contrast' : 'bg-surface'} ${className}`
      }
      {...rest}
    >
      <span className="grid h-full content-center justify-items-center gap-0.5 border border-current px-2 py-1.5 text-center">
        <span aria-hidden="true" className="num text-[length:var(--step-1)] leading-none font-bold">
          {mark}
        </span>
        <span className="font-label text-[length:var(--step--1)] leading-tight font-bold tracking-[0.06em] uppercase">{label}</span>
        {detail !== undefined && <span className="text-[length:var(--step--1)] leading-tight opacity-80">{detail}</span>}
      </span>
    </button>
  )
}

export type StampTone = 'ok' | 'error' | 'ink' | 'pin'

const TONE: Record<StampTone, string> = {
  ok: 'text-ok',
  error: 'text-error',
  ink: 'text-text',
  pin: 'bg-pin text-pin-contrast',
}

/**
 * Timbro impresso: l'esito di una prova (voto dell'orale, domanda giusta o sbagliata). Leggermente
 * storto come un timbro vero; entra "battuto" (da più grande e trasparente al suo posto, 240 ms) con
 * @starting-style, quindi solo quando nasce. Con reduced motion compare e basta (regola globale in base.css).
 */
export function StampMark({ tone = 'ink', size = 'm', children }: { tone?: StampTone; size?: 's' | 'm'; children: ReactNode }) {
  const text = size === 'm' ? 'text-[length:var(--step-1)] px-2 py-0.5' : 'text-[length:var(--step--1)] px-1.5'
  return (
    <span
      className={
        `inline-flex -rotate-2 border-2 border-current p-[2px] ${TONE[tone]} ` +
        'transition-[scale,opacity] duration-[var(--dur-base)] ease-[var(--ease-out)] starting:scale-125 starting:opacity-0'
      }
    >
      <span className={`inline-flex items-center gap-1.5 border border-current font-display leading-tight font-extrabold tracking-[0.04em] uppercase ${text}`}>
        {children}
      </span>
    </span>
  )
}

/**
 * Tasselli di avanzamento di una sessione, come la legenda a tasselli dell'atlante: fatti a inchiostro,
 * quello in corso con lo spillo. Oltre 40 elementi diventano una barra. Decorativi: il testo accanto
 * ("Tessera 3 di 12") è la versione accessibile.
 */
export function Track({ total, done, current = -1 }: { total: number; done: number; current?: number }) {
  if (total <= 0) return null
  if (total > 40) {
    return (
      <span aria-hidden="true" className="block h-2.5 w-full max-w-60 overflow-hidden border border-border-strong">
        <span
          className="block h-full origin-left bg-accent transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)]"
          style={{ transform: `scaleX(${Math.min(1, done / total)})` }}
        />
      </span>
    )
  }
  return (
    <span aria-hidden="true" className="flex flex-wrap gap-[3px]">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`size-2.5 border border-border-strong ${i === current ? 'bg-pin' : i < done ? 'bg-accent' : 'bg-surface'}`}
        />
      ))}
    </span>
  )
}

/** Difficoltà da 1 a 3 in tasselli pieni; il valore è detto a parole per chi ascolta. */
export function Difficulty({ value }: { value: 1 | 2 | 3 }) {
  return (
    <span className="flex items-center gap-1" title={`Difficoltà ${value} su 3`}>
      <span className="visually-hidden">Difficoltà {value} su 3</span>
      {[1, 2, 3].map((d) => (
        <span key={d} aria-hidden="true" className={`size-2.5 border border-border-strong ${d <= value ? 'bg-accent' : ''}`} />
      ))}
    </span>
  )
}

/** Icona del cronometro: triangolo per avviare, due barre per fermare. Stesso tratto delle icone del foglio. */
export function PlayPause({ playing, size = 18 }: { playing: boolean; size?: number }) {
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
      className="shrink-0"
    >
      {playing ? <path d="M8 5v14M16 5v14" /> : <path d="M7 4.5l12 7.5-12 7.5z" />}
    </svg>
  )
}

/** Una lettura della sessione: etichetta di cornice, cifra in mono. */
export function Stat({ label, value, pinned = false }: { label: string; value: ReactNode; pinned?: boolean }) {
  return (
    <p className={`m-0 grid gap-0.5 ${pinned ? 'bg-pin px-2 py-1 text-pin-contrast' : ''}`}>
      <span className={`label ${pinned ? 'text-pin-contrast' : ''}`}>{label}</span>
      <span className="num text-[length:var(--step-1)] leading-tight">{value}</span>
    </p>
  )
}
