// Contenuto nascosto finché non si clicca (la risposta a una domanda, il risultato di un conto da fare prima a mano).
// Il contenuto non esiste nel DOM fino al primo clic: né la ricerca nella pagina né il lettore di schermo lo anticipano.
import type { ReactNode } from 'react'
import { BLOCK, Disclosure, FLOW } from './shared'

export function Reveal({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <Disclosure
      className={`${BLOCK} border border-border bg-surface`}
      summary={<span className="label text-text">{label}</span>}
      panelClassName={`border-t border-border p-4 ${FLOW}`}
    >
      {children}
    </Disclosure>
  )
}
