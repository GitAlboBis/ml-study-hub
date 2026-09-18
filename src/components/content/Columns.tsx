// Confronto affiancato (ML vs Bayes, K-NN vs Parzen…): una tavola a colonne con i fili a inchiostro tra una colonna
// e l'altra. Le colonne si adattano alla larghezza della cornice, non della finestra: sotto i 16rem ciascuna vanno
// una sotto l'altra, quindi su mobile diventa una colonna sola senza punti di rottura scritti a mano.
import type { ReactNode } from 'react'
import { BLOCK, FLOW } from './shared'

export function Columns({ children }: { children?: ReactNode }) {
  // il fondo a inchiostro del contenitore, visto attraverso il gap di 1px, disegna i fili tra le celle
  return (
    <div className={`${BLOCK} grid grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),1fr))] gap-px border border-border-strong bg-border-strong`}>{children}</div>
  )
}

export function Col({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="min-w-0 bg-surface">
      <h4 className="m-0 border-b border-border bg-surface-2 px-4 py-2 font-label text-[length:var(--step-0)] font-bold tracking-normal text-text normal-case">{title}</h4>
      <div className={`p-4 ${FLOW}`}>{children}</div>
    </section>
  )
}
