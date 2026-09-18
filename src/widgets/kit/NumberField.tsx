// Campo numerico del kit, per i valori che si scrivono più volentieri di quanto si trascinino (N = 500).
// È un <input type="number"> nativo (ruolo spinbutton, tastierino numerico sui telefoni) con due
// pulsanti da 40 px ai lati, perché le freccette del browser sono troppo piccole per un dito.
//
// Mentre si scrive il campo mostra ciò che si è scritto (una bozza): "4" sulla strada per "47" non
// viene corretto sotto le dita. A onChange arriva sempre un valore valido, dentro gli estremi e
// sulla griglia dei passi; all'uscita dal campo, o con Invio, compare il valore accettato.
// Frecce: un passo. PageUp, PageDown: dieci passi. Home, End: gli estremi.
import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { M } from '../../components/content/M'
import { ActionButton } from './ActionButton'
import { formatForStep, snapToStep } from './format'
import type { NumberFormat } from './format'

export interface NumberFieldProps {
  id: string
  label: string
  /** Simbolo della grandezza in LaTeX, davanti all'etichetta. */
  latex?: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  /** Testo del valore accettato. Deve restare un numero leggibile da un input (punto decimale, niente unità). */
  format?: NumberFormat
  unit?: string
  disabled?: boolean
}

export function NumberField({ id, label, latex, min, max, step, value, onChange, format, unit, disabled = false }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const fmt = format ?? formatForStep(min, step)

  const commit = (next: number) => {
    const snapped = snapToStep(next, min, max, step)
    if (snapped !== value) onChange(snapped)
  }
  /** Pulsanti e tasti partono dal valore accettato e chiudono la bozza. */
  const nudge = (next: number) => {
    setDraft(null)
    commit(next)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    let next: number
    switch (e.key) {
      case 'ArrowUp':
        next = value + step
        break
      case 'ArrowDown':
        next = value - step
        break
      case 'PageUp':
        next = value + step * 10
        break
      case 'PageDown':
        next = value - step * 10
        break
      case 'Home':
        next = min
        break
      case 'End':
        next = max
        break
      case 'Enter':
        setDraft(null)
        return
      default:
        return
    }
    e.preventDefault()
    nudge(next)
  }

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="flex items-baseline gap-2">
        {/* simbolo per gli occhi: il nome accessibile è l'etichetta in parole (vedi Slider) */}
        {latex !== undefined && (
          <span aria-hidden="true" className="text-text">
            <M tex={latex} />
          </span>
        )}
        <span className="label">{label}</span>
      </label>
      <div className="flex items-stretch gap-px">
        <ActionButton iconOnly tabIndex={-1} aria-label={`Diminuisci ${label}`} disabled={disabled || value <= min} onClick={() => nudge(value - step)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </ActionButton>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft ?? fmt(value)}
          disabled={disabled}
          aria-describedby={unit !== undefined ? `${id}-unit` : undefined}
          onChange={(e) => {
            const text = e.currentTarget.value
            setDraft(text)
            const n = Number(text)
            if (text.trim() !== '' && Number.isFinite(n)) commit(n)
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={onKeyDown}
          className="num min-h-10 w-full min-w-0 flex-1 [appearance:textfield] rounded-m border border-border-strong bg-surface px-3 text-right text-text disabled:cursor-not-allowed disabled:opacity-45 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {unit !== undefined && (
          <span id={`${id}-unit`} className="num flex items-center px-2 text-muted">
            {unit}
          </span>
        )}
        <ActionButton iconOnly tabIndex={-1} aria-label={`Aumenta ${label}`} disabled={disabled || value >= max} onClick={() => nudge(value + step)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
            <path d="M5 12h14M12 5v14" />
          </svg>
        </ActionButton>
      </div>
    </div>
  )
}
