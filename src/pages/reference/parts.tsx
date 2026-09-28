// Pezzi comuni delle pagine di consultazione (formulario, glossario): testata a cornice, lente, segno
// d'importanza, attesa dei fogli, fogli che non si sono caricati, fogli ancora in preparazione.
import type { ReactNode } from 'react'
import { BTN_SECONDARY, HATCH, Icon } from '../../components/content/shared'
import type { ModuleManifestEntry } from '../../content/manifest'
import { sheetNumber } from '../../lib/atlas'
import type { Importance } from '../../lib/formulario'
import { sheetRanges } from './sheets'
import { HEAD_READINGS, PAGE_TITLE } from '../global/ui'
import { TICKS } from './ui'

interface ReferenceHeaderProps {
  title: string
  titleEn: string
  lead: ReactNode
  stats: { label: string; value: ReactNode }[]
}

/** Testata a cornice con la squadratura, come la copertina: titolo in capitali strette, inglese in corsivo, letture a destra. */
export function ReferenceHeader({ title, titleEn, lead, stats }: ReferenceHeaderProps) {
  return (
    <header className="border-2 border-border-strong bg-surface">
      <div aria-hidden="true" className="h-2.5 border-b border-border-strong" style={TICKS} />
      <div className="grid items-end gap-6 p-5 @3xl:grid-cols-[minmax(0,1fr)_auto] @3xl:p-7">
        <div className="min-w-0">
          <h1 className={`m-0 ${PAGE_TITLE}`}>{title}</h1>
          <p lang="en" className="m-0 mt-2 text-[length:var(--step-1)] text-muted italic">
            {titleEn}
          </p>
          <p className="m-0 mt-3 max-w-[var(--measure)]">{lead}</p>
        </div>
        <dl className={HEAD_READINGS}>
          {stats.map((s) => (
            <div key={s.label} className="contents">
              <dt className="label">{s.label}</dt>
              <dd className="num m-0 text-text">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  )
}

/** La lente del campo di ricerca: stessa mano della barra superiore (griglia 24, tratto 2, estremità squadrate). */
export function SearchGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true" focusable="false" className={className}>
      <path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5L21 21" />
    </svg>
  )
}

/** Importanza in tre tasselli, come una scala di quote: decorativa, chi la usa scrive anche il testo. */
export function ImportanceMark({ value }: { value: Importance }) {
  return (
    <span aria-hidden="true" className="flex items-center gap-0.5">
      {[1, 2, 3].map((d) => (
        <span key={d} className={`size-2 border border-current ${d <= value ? 'bg-current' : ''}`} />
      ))}
    </span>
  )
}

/** Attesa dei fogli: tratteggio del terreno non ancora rilevato, e una riga che dice che cosa succede. */
export function SheetsLoading({ what }: { what: string }) {
  return (
    <div className="mt-8 grid gap-4">
      <p role="status" className="label m-0 text-text">
        {what}
      </p>
      {[0, 1, 2].map((i) => (
        <div key={i} aria-hidden="true" className={`h-32 border border-border ${HATCH}`} />
      ))}
    </div>
  )
}

/** I fogli pronti che non si sono caricati: gli altri restano sulla pagina, questi si riprovano. */
export function FailedSheets({ failed, noun, onRetry, retrying }: { failed: ModuleManifestEntry[]; noun: string; onRetry: () => void; retrying: boolean }) {
  if (failed.length === 0) return null
  const one = failed[0]
  return (
    <div role="alert" className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border border-border-strong bg-error-bg p-4">
      <Icon name="warning" className="text-error" />
      <p className="m-0 min-w-0 flex-1 basis-64">
        {failed.length === 1 ? (
          <>
            <span className="num">Foglio {sheetNumber(one.id)}</span> · {one.title} non si è caricato: qui mancano le sue {noun}.
          </>
        ) : (
          <>
            I fogli <span className="num">{sheetRanges(failed.map((m) => m.id))}</span> non si sono caricati: qui mancano le loro {noun}.
          </>
        )}
      </p>
      <button type="button" onClick={onRetry} aria-busy={retrying || undefined} className={BTN_SECONDARY}>
        <Icon name="reset" size={18} />
        {retrying ? 'Riprovo…' : 'Riprova'}
      </button>
    </div>
  )
}

/** I fogli di una regione ancora in preparazione: terreno tratteggiato, con i numeri in intervalli. */
export function PendingSheets({ region, pending, readyCount, what }: { region: string; pending: ModuleManifestEntry[]; readyCount: number; what: string }) {
  if (pending.length === 0) return null
  const ranges = sheetRanges(pending.map((m) => m.id))
  return (
    <p className={`m-0 mt-6 border border-border p-3 text-[length:var(--step--1)] print:hidden ${HATCH}`}>
      <span className="bg-surface px-1 leading-7 text-muted [box-decoration-break:clone]">
        {readyCount === 0 ? (
          <>
            Nessun foglio di {region} è ancora pronto: {what} arriveranno con i fogli <span className="num text-text">{ranges}</span>.
          </>
        ) : (
          <>
            Ancora in preparazione: fogli <span className="num text-text">{ranges}</span>.
          </>
        )}
      </span>
    </p>
  )
}
