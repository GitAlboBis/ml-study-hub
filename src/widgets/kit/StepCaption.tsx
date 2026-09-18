// Didascalia del passo corrente dello storyboard: dice dove siamo (lo spillo ocra con il numero del
// passo) e che cosa sta succedendo nel terreno. È la voce narrante del widget, quindi è una regione
// aria-live="polite": a ogni passo il lettore di schermo legge numero, titolo e spiegazione.
// Moto: nessuno. Il testo del passo nuovo compare subito, anche perché spesso ci si arriva con le frecce.
import type { ReactNode } from 'react'
import { Rich } from '../../components/content/Rich'
import type { Rich as RichText } from '../../content/types'

export interface StepCaptionProps {
  /** Indice del passo corrente, da zero (sb.index). */
  index: number
  /** Numero dei passi dello storyboard. */
  total?: number
  /** Titolo breve del passo (sb.step.label). */
  label: string
  /** Spiegazione del passo: Markdown con matematica fra $…$. */
  text?: RichText
  /** In alternativa o in aggiunta a `text`, contenuto libero. */
  children?: ReactNode
}

const two = (n: number) => String(n).padStart(2, '0')

export function StepCaption({ index, total, label, text, children }: StepCaptionProps) {
  const n = index + 1
  return (
    <div aria-live="polite" aria-atomic="true" className="relative flex items-start gap-3">
      <span aria-hidden="true" className="num mt-0.5 shrink-0 bg-pin px-1.5 text-[length:var(--step--1)] text-pin-contrast">
        {total !== undefined ? `${two(n)}/${two(total)}` : two(n)}
      </span>
      <div className="min-w-0">
        <p className="m-0">
          <span className="visually-hidden">{total !== undefined ? `Passo ${n} di ${total}: ` : `Passo ${n}: `}</span>
          <strong className="font-label text-[length:var(--step-1)] leading-tight font-bold">{label}</strong>
        </p>
        {text !== undefined && <Rich text={text} inline className="mt-1 block max-w-[var(--measure)] text-muted" />}
        {children}
      </div>
    </div>
  )
}
