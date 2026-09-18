// Idea chiave: la frase da portarsi via dalla sezione. È una voce di legenda: tassello ocra (lo spillo, che nel foglio
// segna ciò che è in evidenza) ed etichetta a sinistra, il testo a destra un passo più su nella scala tipografica.
// Nessun fondo colorato: la prosa resta acromatica. Nelle cornici strette etichetta e testo vanno uno sotto l'altra.
import type { ReactNode } from 'react'
import { BLOCK, FLOW } from './shared'

export function KeyIdea({ children }: { children?: ReactNode }) {
  return (
    <div role="note" className={`${BLOCK} @container border-y border-border-strong py-4`}>
      <div className="grid gap-x-6 gap-y-2 @lg:grid-cols-[8.5rem_minmax(0,1fr)]">
        <p className="label m-0 flex items-center gap-2 self-start pt-1 text-text">
          <span aria-hidden="true" className="size-4 shrink-0 border border-border-strong bg-pin" />
          Idea chiave
        </p>
        <div className={`min-w-0 text-[length:var(--step-1)] leading-snug font-medium ${FLOW}`}>{children}</div>
      </div>
    </div>
  )
}
