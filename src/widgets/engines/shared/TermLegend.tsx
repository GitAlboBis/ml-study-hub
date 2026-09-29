// La legenda viva di un preset (`terms`): la terminologia del docente in italiano e in inglese, legata agli strati
// del terreno. È quella di density1d resa generica: il tassello di ogni voce lo disegna il motore (`swatch`), perché
// solo lui sa com'è fatto il suo strato.
//
// CONTRATTO DEL FOGLIO (.impeccable/surfaces): passare o mettere a fuoco una voce accende il suo strato nel terreno
// e attenua gli altri (onPreview); un clic la fissa (aria-pressed, onPin), un altro la libera. Sono pulsanti veri:
// fuoco, nome accessibile e stato arrivano dal browser. Il simbolo LaTeX è per gli occhi (aria-hidden): il nome è
// il termine in parole.
//
// MOTO. Nessuno: si passa spesso sopra le voci.
import type { ReactNode } from 'react'
import { M } from '../../../components/content/M'
import { Rich } from '../../../components/content/Rich'
import type { Rich as RichText } from '../../../content/types'
import type { EngineTerm } from './types'

export interface TermLegendProps<Target extends string> {
  terms: readonly EngineTerm<Target>[]
  /** la voce fissata (null: nessuna) */
  pinned: Target | null
  onPreview: (target: Target | null) => void
  onPin: (target: Target) => void
  notes?: readonly RichText[]
  /** il tassello di uno strato, come appare nel terreno (28 × 16 px); senza, un quadratino a inchiostro */
  swatch?: (target: Target) => ReactNode
  /** titolo; predefinito "Legenda · termini" */
  title?: string
}

export function TermLegend<Target extends string>({ terms, pinned, onPreview, onPin, notes, swatch, title = 'Legenda · termini' }: TermLegendProps<Target>) {
  return (
    <div className="grid gap-2">
      <h5 className="label m-0">{title}</h5>
      <ul className="m-0 grid list-none gap-px border border-border bg-border p-0">
        {terms.map((t, i) => (
          <li key={`${t.target}-${i}`} className="bg-surface">
            <button
              type="button"
              data-term={t.target}
              aria-pressed={pinned === t.target}
              onPointerEnter={() => onPreview(t.target)}
              onPointerLeave={() => onPreview(null)}
              onFocus={() => onPreview(t.target)}
              onBlur={() => onPreview(null)}
              onClick={() => onPin(t.target)}
              className="grid min-h-10 w-full cursor-pointer grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 border-0 bg-transparent px-3 py-2 text-left text-text hover:bg-surface-2 aria-pressed:bg-surface-2"
            >
              <span className="mt-1 grid gap-1" aria-hidden="true">
                {swatch !== undefined ? swatch(t.target) : <span className="block size-3 border border-border-strong bg-text" />}
                {pinned === t.target ? <span className="block h-1 w-full bg-pin" /> : null}
              </span>
              <span className="grid gap-0.5">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span aria-hidden="true">
                    <M tex={t.symbol} />
                  </span>
                  <em className="text-[length:var(--step--1)] text-muted" lang="en">
                    {t.en}
                  </em>
                </span>
                <Rich text={t.it} inline className="text-[length:var(--step--1)]" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {notes?.map((n, i) => (
        <p key={i} className="m-0 flex gap-2 text-[length:var(--step--1)] text-muted">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" aria-hidden="true" className="mt-0.5 shrink-0 text-info">
            <path d="M12 10v8M12 6v.5" />
          </svg>
          <Rich text={n} inline />
        </p>
      ))}
    </div>
  )
}
