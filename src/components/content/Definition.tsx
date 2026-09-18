// Definizione: una voce di legenda. Filo a inchiostro in testa, termine italiano in evidenza, il suo inglese in corsivo
// (all'orale si risponde in inglese), poi il corpo. Nessun fondo: deve leggersi come parte della nota illustrativa.
import type { ReactNode } from 'react'
import { BLOCK, FLOW } from './shared'

export function Definition({ term, en, children }: { term: string; en: string; children?: ReactNode }) {
  return (
    <div className={`${BLOCK} border-t-2 border-b border-t-border-strong border-b-border pt-3 pb-4`}>
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="label">Definizione</span>
        <dfn className="font-label text-[length:var(--step-1)] leading-tight font-bold not-italic">{term}</dfn>
        <span lang="en" className="text-muted italic">
          {en}
        </span>
      </p>
      <div className={`mt-2 ${FLOW}`}>{children}</div>
    </div>
  )
}
