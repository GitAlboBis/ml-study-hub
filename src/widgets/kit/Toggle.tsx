// Interruttore del kit: accende e spegne uno strato del terreno (la densità vera, i vicini, la griglia).
// Sotto c'è una checkbox nativa con role="switch": fuoco, Spazio, clic sull'etichetta e stato per i
// lettori di schermo arrivano dal browser. L'aspetto è il tassello di una legenda: quadrato a bordo
// d'inchiostro, pieno quando lo strato è acceso, con il segno di spunta perché lo stato non sia mai
// affidato al solo colore. Niente pillola arrotondata da pannello di impostazioni.
// Moto: nessuno. Lo stato cambia subito; si commuta spesso e da tastiera.
import type { ReactNode } from 'react'

export interface ToggleProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Riga di spiegazione sotto l'etichetta. */
  hint?: ReactNode
  disabled?: boolean
}

export function Toggle({ id, label, checked, onChange, hint, disabled = false }: ToggleProps) {
  const hintId = `${id}-hint`
  return (
    <div className="grid gap-0.5">
      <label
        htmlFor={id}
        className="relative flex min-h-10 cursor-pointer items-center gap-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
      >
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-describedby={hint !== undefined ? hintId : undefined}
          onChange={(e) => onChange(e.currentTarget.checked)}
          className="peer visually-hidden"
        />
        <span
          aria-hidden="true"
          className="grid size-5 shrink-0 place-items-center border-2 border-border-strong bg-surface text-accent-contrast peer-checked:bg-accent [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </span>
        <span className="label text-text">{label}</span>
      </label>
      {hint !== undefined && (
        <p id={hintId} className="m-0 pl-8 text-[length:var(--step--1)] text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
