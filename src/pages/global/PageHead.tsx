// Testata e titoli delle pagine globali dell'atlante. La testata è la cornice della copertina in piccolo:
// squadratura in alto, titolo in maiuscolo extra condensato, titolo inglese in corsivo, una riga che dice a che
// cosa serve la pagina e, a destra, le letture del foglio (coordinate e cifre) in una legenda a due colonne.
import type { ReactNode } from 'react'
import { H2, HEAD_READINGS, PAGE_TITLE, TICKS } from './ui'

export function PageHead({ title, en, lead, children }: { title: string; en: string; lead: ReactNode; children?: ReactNode }) {
  return (
    <header className="border-2 border-border-strong bg-surface">
      <div aria-hidden="true" className="h-2.5 border-b border-border-strong" style={TICKS} />
      <div className="grid items-end gap-6 p-5 @3xl:grid-cols-[minmax(0,1fr)_auto] @3xl:p-8">
        <div className="min-w-0">
          <h1 className={`m-0 ${PAGE_TITLE}`}>{title}</h1>
          <p lang="en" className="m-0 mt-2 text-[length:var(--step-1)] text-muted italic">
            {en}
          </p>
          <p className="m-0 mt-4 max-w-[var(--measure)]">{lead}</p>
        </div>
        {children !== undefined && (
          <dl className={HEAD_READINGS}>
            {children}
          </dl>
        )}
      </div>
    </header>
  )
}

/** Una lettura della testata: etichetta e cifra. */
export function Reading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="label">{label}</dt>
      <dd className="num m-0">{children}</dd>
    </>
  )
}

/** Titolo di sezione (h2) con il termine inglese in corsivo accanto. */
export function SectionHead({ id, title, en }: { id: string; title: string; en: string }) {
  return (
    <h2 id={id} className={H2}>
      {title}{' '}
      <span lang="en" className="font-body text-[length:var(--step-1)] font-normal text-muted italic">
        {en}
      </span>
    </h2>
  )
}
