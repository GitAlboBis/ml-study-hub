// Pezzi d'interfaccia condivisi dai widget del foglio m09 su bias, varianza e consistenza, fatti solo con il
// kit e i token del mondo: lo slider su una scala logaritmica di valori tondi, la spia a tre stati delle
// condizioni di consistenza, la formula viva con la sua etichetta, i tasselli della legenda, la scheda che si
// posa sul terreno. Nessun moto: sono comandi e letture che si usano spesso.
import type { ReactNode } from 'react'
import { M } from '../../../components/content/M'
import { LiveFormula } from '../../kit/LiveFormula'
import { Slider } from '../../kit/Slider'

export interface LogSliderProps {
  id: string
  label: string
  latex?: string
  /** i valori tondi della scala (niceLogSteps o intLogSteps) */
  values: readonly number[]
  value: number
  onChange: (value: number) => void
  format: (value: number) => string
  unit?: string
  disabled?: boolean
}

/** Slider lineare sull'indice di un elenco di valori tondi: la scala è logaritmica e ogni tacca è un numero leggibile. */
export function LogSlider({ id, label, latex, values, value, onChange, format, unit, disabled }: LogSliderProps) {
  let index = 0
  let best = Number.POSITIVE_INFINITY
  values.forEach((v, i) => {
    const d = Math.abs(Math.log(v) - Math.log(value))
    if (d < best) {
      best = d
      index = i
    }
  })
  return (
    <Slider
      id={id}
      label={label}
      latex={latex}
      min={0}
      max={values.length - 1}
      step={1}
      value={index}
      onChange={(i) => onChange(values[Math.round(i)] ?? value)}
      format={(i) => format(values[Math.round(i)] ?? value)}
      unit={unit}
      disabled={disabled}
    />
  )
}

export type SpiaState = 'ok' | 'warn' | 'ko'

const SPIA: Record<SpiaState, { word: string; box: string; icon: string; path: string }> = {
  ok: { word: 'sì', box: 'bg-ok-bg', icon: 'text-ok', path: 'M4 12.5l5 5L20 6.5' },
  warn: { word: 'in bilico', box: 'bg-warn-bg', icon: 'text-warn', path: 'M5 12h14' },
  ko: { word: 'no', box: 'bg-error-bg', icon: 'text-error', path: 'M6 6l12 12M18 6L6 18' },
}

export interface SpiaProps {
  /** la domanda: "h_N → 0?" in LaTeX */
  tex: string
  /** la stessa domanda in parole, per chi ascolta */
  spoken: string
  state: SpiaState
  /** lettura accanto alla spia (il valore attuale) */
  detail?: ReactNode
  /** parola dello stato, se "sì / in bilico / no" non basta ("verde", "K atteso ≥ 30") */
  word?: string
}

/**
 * Spia a tre stati: lampada quadrata con icona e parola, mai il solo colore. I token sono quelli di stato
 * (ok, warn, error) perché la spia dice se una condizione è soddisfatta: è uno stato, non una classe.
 */
export function Spia({ tex, spoken, state, detail, word }: SpiaProps) {
  const s = SPIA[state]
  return (
    <div className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-0.5 border border-border px-2.5 py-2 ${s.box}`}>
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square" aria-hidden="true" className={`row-span-2 shrink-0 ${s.icon}`}>
        <path d={s.path} />
      </svg>
      <p className="m-0 flex flex-wrap items-baseline gap-x-2">
        <span aria-hidden="true">
          <M tex={tex} />
        </span>
        <span className="visually-hidden">{spoken}</span>
        <strong className="label text-text">{word ?? s.word}</strong>
      </p>
      {detail !== undefined ? <div className="num text-[length:var(--step--1)] text-muted">{detail}</div> : null}
    </div>
  )
}

export interface FormulaBoxProps {
  label?: string
  tex: string
  values: Readonly<Record<string, number | string | undefined>>
  announce?: boolean
}

/** Formula viva con l'etichetta di cornice sopra; le formule larghe scorrono nel loro riquadro. */
export function FormulaBox({ label, tex, values, announce = false }: FormulaBoxProps) {
  return (
    <div className="grid min-w-0 gap-1">
      {label !== undefined ? <span className="label">{label}</span> : null}
      <LiveFormula tex={tex} values={values} announce={announce} />
    </div>
  )
}

/** Formula fissa (senza valori) con etichetta. */
export function StaticFormula({ label, tex }: { label?: string; tex: string }) {
  return (
    <div className="grid min-w-0 gap-1">
      {label !== undefined ? <span className="label">{label}</span> : null}
      <M tex={tex} display />
    </div>
  )
}

export type SwatchKind = 'line' | 'thick' | 'dash' | 'band' | 'bar' | 'dot'

/** Tassello di legenda: lo stesso segno che la serie ha nel terreno. */
export function Swatch({ kind, color }: { kind: SwatchKind; color: string }) {
  return (
    <svg viewBox="0 0 28 14" width={28} height={14} aria-hidden="true" className="shrink-0">
      {kind === 'band' ? <rect x={1} y={2} width={26} height={10} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1} /> : null}
      {kind === 'bar' ? <rect x={1} y={3} width={26} height={8} fill={color} /> : null}
      {kind === 'dot' ? <circle cx={14} cy={7} r={4.5} fill={color} stroke="var(--surface)" strokeWidth={2} /> : null}
      {kind === 'line' || kind === 'thick' || kind === 'dash' ? (
        <path d="M1 7h26" stroke={color} strokeWidth={kind === 'thick' ? 3 : 2} strokeDasharray={kind === 'dash' ? '6 4' : undefined} strokeLinecap="round" />
      ) : null}
    </svg>
  )
}

export interface LegendEntry {
  kind: SwatchKind
  color: string
  label: ReactNode
}

/** Legenda a tasselli, in riga: per i grafici con due o più serie (le etichette dirette non bastano da sole). */
export function Legend({ items, className = '' }: { items: readonly LegendEntry[]; className?: string }) {
  return (
    <ul className={`m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[length:var(--step--1)] ${className}`}>
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-1.5">
          <Swatch kind={it.kind} color={it.color} />
          <span>{it.label}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Scheda posata sul terreno (verdetto, tabella, ponte fra le condizioni): si sovrappone, quindi ha l'ombra.
 * Entra con opacity e 4 px di salita in 200 ms (@starting-style); con reduced motion base.css azzera le transizioni.
 */
export function OverlayCard({ title, children, className = '' }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div
      className={`absolute z-10 grid max-h-[calc(100%-1rem)] gap-2 overflow-auto border-2 border-border-strong bg-surface p-3 text-text shadow-2 transition-[opacity,translate] duration-200 ease-out starting:translate-y-1 starting:opacity-0 ${className}`}
    >
      <p className="label m-0 flex items-center gap-2">
        <span aria-hidden="true" className="size-3 shrink-0 border border-border-strong bg-pin" />
        {title}
      </p>
      {children}
    </div>
  )
}

/** Termine inglese in corsivo con la lingua giusta. */
export function En({ children }: { children: ReactNode }) {
  return <em lang="en">{children}</em>
}

/** Icona piccola per i pulsanti. */
export function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
