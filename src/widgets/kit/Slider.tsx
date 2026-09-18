// Slider del kit: una scala graduata. È un <input type="range"> nativo con un altro vestito, quindi
// ruolo, valore, estremi e trascinamento (mouse, tocco, tastiera) arrivano dal browser. La traccia è
// una barra a inchiostro piena fino al valore e sottile oltre, con le tacche sotto; il cursore è lo
// spillo ocra, che nel mondo dell'atlante segna la posizione.
//
// TASTIERA. I tasti sono gestiti qui e non lasciati al browser: così il comportamento è lo stesso
// ovunque (PageUp e PageDown cambiano da browser a browser) e i valori escono sempre puliti dalla
// griglia dei passi, senza 0.30000000000000004. Frecce: un passo. Maiusc+frecce, PageUp, PageDown:
// un decimo della scala. Home, End: gli estremi.
//
// MOTO. Il valore segue il dito senza transizioni: uno slider che insegue in ritardo sembra rotto.
// Il cursore risponde solo alla pressione (scale, 150 ms, ease-out).
//
// Connettori consultati prima di scriverlo (Magic UI, ui-layouts, 21st.dev): gli slider trovati sono
// Radix o Base UI con traccia arrotondata e pollice tondo con ombra. Qui resta l'input nativo
// (accessibile per costruzione, nessuna dipendenza nuova); dai connettori viene solo lo schema
// "etichetta a sinistra, valore a destra, tacche sotto la traccia".
import type { ChangeEvent, CSSProperties, KeyboardEvent } from 'react'
import { M } from '../../components/content/M'
import { formatForStep, pageStep, snapToStep, typographic } from './format'
import type { NumberFormat } from './format'

export interface SliderProps {
  id: string
  label: string
  /** Simbolo della grandezza in LaTeX, mostrato davanti all'etichetta: 'h', 'k', '\\sigma^2'. Decorativo per i lettori di schermo. */
  latex?: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  /** Testo del valore (lettura accanto all'etichetta e aria-valuetext). Predefinito: i decimali del passo. */
  format?: NumberFormat
  /** Unità di misura dello scenario: 'cm', '°C', 'bpm'. */
  unit?: string
  disabled?: boolean
}

/** Larghezza del cursore in px: serve a traccia e tacche per allinearsi al suo centro. */
const THUMB = 14

// Le classi sono scritte per esteso, una per una: Tailwind le trova leggendo il sorgente e non vede
// quelle composte a runtime. WebKit e Gecko vogliono ciascuno i suoi pseudo-elementi.
const RANGE = [
  'relative block h-10 w-full cursor-pointer touch-pan-y appearance-none bg-transparent',
  'disabled:cursor-not-allowed disabled:opacity-45',
  // traccia: il disegno arriva dalla variabile --track calcolata sul valore
  '[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:[background:var(--track)]',
  '[&::-moz-range-track]:h-1 [&::-moz-range-track]:[background:var(--track)]',
  // cursore: lo spillo. In WebKit va centrato a mano sulla traccia: (4 - 24) / 2 = -10 px
  '[&::-webkit-slider-thumb]:-mt-[10px] [&::-webkit-slider-thumb]:appearance-none',
  '[&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-m',
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-border-strong [&::-webkit-slider-thumb]:bg-pin',
  '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:ease-out',
  '[&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-m',
  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-border-strong [&::-moz-range-thumb]:bg-pin',
  '[&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:ease-out',
  // risposta alla pressione
  'active:[&::-webkit-slider-thumb]:scale-110 active:[&::-moz-range-thumb]:scale-110',
].join(' ')

/** Frazioni (0-1) delle tacche: una per passo se sono poche, altrimenti dieci intervalli. */
function tickFractions(min: number, max: number, step: number): number[] {
  const steps = step > 0 ? Math.round((max - min) / step) : 0
  const n = steps >= 1 && steps <= 24 ? steps : 10
  return Array.from({ length: n + 1 }, (_, i) => i / n)
}

export function Slider({ id, label, latex, min, max, step, value, onChange, format, unit, disabled = false }: SliderProps) {
  const fmt = format ?? formatForStep(min, step)
  const shown = typographic(fmt(value))
  const span = max - min
  const pct = span > 0 && Number.isFinite(value) ? Math.min(Math.max((value - min) / span, 0), 1) : 0
  const ticks = tickFractions(min, max, step)

  const commit = (next: number) => {
    const snapped = snapToStep(next, min, max, step)
    if (snapped !== value) onChange(snapped)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const big = pageStep(min, max, step)
    const small = e.shiftKey ? big : step
    let next: number
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = value + small
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        next = value - small
        break
      case 'PageUp':
        next = value + big
        break
      case 'PageDown':
        next = value - big
        break
      case 'Home':
        next = min
        break
      case 'End':
        next = max
        break
      default:
        return
    }
    // il browser non deve fare a sua volta il suo passo
    e.preventDefault()
    commit(next)
  }

  const track = {
    '--track': [
      `linear-gradient(to right, var(--text) calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${pct}), transparent 0) left center / 100% 4px no-repeat`,
      'linear-gradient(var(--text-faint), var(--text-faint)) left center / 100% 2px no-repeat',
    ].join(', '),
  } as CSSProperties

  return (
    <div className="grid gap-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="flex min-w-0 items-baseline gap-2">
          {/* Il simbolo è per gli occhi: il nome accessibile è l'etichetta in parole. Il MathML dentro
              un nome viene letto male ("σ2"), quindi `label` deve bastare da sola. */}
          {latex !== undefined && (
            <span aria-hidden="true" className="text-text">
              <M tex={latex} />
            </span>
          )}
          <span className="label">{label}</span>
        </label>
        {/* la lettura è per gli occhi: a chi ascolta il valore lo dice già lo slider (aria-valuetext) */}
        <span aria-hidden="true" className="num whitespace-nowrap text-text">
          {shown}
          {unit !== undefined && <span className="text-muted"> {unit}</span>}
        </span>
      </div>

      <div className="relative h-10">
        <div aria-hidden="true" className="pointer-events-none absolute top-[22px] h-2.5" style={{ insetInline: THUMB / 2 }}>
          {ticks.map((f, i) => {
            const major = i === 0 || i === ticks.length - 1 || ((ticks.length - 1) % 2 === 0 && i === (ticks.length - 1) / 2)
            return <span key={`${i}:${f}`} className={`absolute top-0 w-px ${major ? 'h-2.5 bg-text' : 'h-1.5 bg-faint'}`} style={{ left: `${f * 100}%` }} />
          })}
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-valuetext={unit !== undefined ? `${shown} ${unit}` : shown}
          onChange={(e: ChangeEvent<HTMLInputElement>) => commit(Number(e.currentTarget.value))}
          onKeyDown={onKeyDown}
          className={RANGE}
          style={track}
        />
      </div>

      <div aria-hidden="true" className="num flex justify-between text-[length:var(--step--1)] leading-none text-faint">
        <span>{typographic(fmt(min))}</span>
        <span>{typographic(fmt(max))}</span>
      </div>
    </div>
  )
}
