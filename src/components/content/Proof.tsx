// Dimostrazione rigorosa, comprimibile: chiusa all'inizio, perché il filo della sezione si segue anche senza;
// si apre dal titolo e si chiude con il quadratino di fine dimostrazione (disegnato, non un carattere).
import type { ReactNode } from 'react'
import { BLOCK, Disclosure, FLOW } from './shared'

export function Proof({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Disclosure
      className={`${BLOCK} border border-border-strong bg-surface`}
      summary={
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-3">
          <span className="label">Dimostrazione</span>
          <span className="font-label text-[length:var(--step-0)] font-bold">{title}</span>
        </span>
      }
      panelClassName="border-t border-border-strong p-4"
    >
      <div className={FLOW}>{children}</div>
      <p className="m-0 mt-3 flex justify-end">
        <span className="visually-hidden">Fine della dimostrazione</span>
        <span aria-hidden="true" className="size-3 border border-border-strong bg-accent" />
      </p>
    </Disclosure>
  )
}
