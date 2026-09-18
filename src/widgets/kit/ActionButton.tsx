// Pulsante del kit. Due pesi soli: l'azione a inchiostro (pieno) e il pulsante di cornice (bordo a
// inchiostro su carta). Angoli quasi vivi (--radius-m), bersaglio di almeno 40 px, nessuna ombra.
// Moto: l'unico è la risposta alla pressione (scale 0.97, 150 ms, ease-out), che conferma il tocco
// senza far aspettare; hover e stato cambiano subito, perché questi pulsanti si premono decine di
// volte in una sessione e spesso da tastiera.
import type { ButtonHTMLAttributes } from 'react'

export interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** primary: azione a inchiostro. secondary (predefinito): bordo a inchiostro su carta. */
  variant?: 'primary' | 'secondary'
  /** Pulsante quadrato con la sola icona: il nome accessibile arriva da aria-label. */
  iconOnly?: boolean
}

const BASE =
  'label inline-flex min-h-10 shrink-0 cursor-pointer select-none items-center justify-center gap-2 rounded-m border ' +
  'transition-transform duration-150 ease-out active:scale-[0.97] ' +
  'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100'

const VARIANT = {
  primary: 'border-accent bg-accent text-accent-contrast',
  secondary: 'border-border-strong bg-surface text-text hover:bg-surface-2',
} as const

export function ActionButton({ variant = 'secondary', iconOnly = false, className = '', children, ...rest }: ActionButtonProps) {
  return (
    <button type="button" className={`${BASE} ${VARIANT[variant]} ${iconOnly ? 'min-w-10 px-0' : 'px-3'} ${className}`} {...rest}>
      {children}
    </button>
  )
}
