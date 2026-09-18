// Riquadro semantico. L'identità del tipo sta in tre cose insieme: etichetta in testa, icona disegnata, fondo
// (di stato o surface-2). Niente bordo colorato a sinistra: nel foglio il colore non fa da righello.
// "esame" è l'unico con lo spillo ocra, perché lo spillo segna ciò che all'orale è in evidenza; "intuizione" e
// "inglese" vanno in corsivo, che nel lettering del foglio è riservato proprio a intuizione e termini inglesi.
import type { ReactNode } from 'react'
import { BLOCK, FLOW, Icon } from './shared'
import type { IconName } from './shared'

export type CalloutKind = 'intuizione' | 'attenzione' | 'esame' | 'suggerimento' | 'nota' | 'inglese'

interface KindStyle {
  label: string
  icon: IconName
  /** cornice e fondo del riquadro */
  box: string
  /** testata: icona, etichetta, titolo */
  head: string
  /** colore dell'icona */
  ink: string
  body?: string
}

const KINDS: Record<CalloutKind, KindStyle> = {
  intuizione: { label: 'Intuizione', icon: 'compass', box: 'border-border bg-surface-2', head: '', ink: 'text-text', body: 'italic' },
  attenzione: { label: 'Attenzione', icon: 'warning', box: 'border-border bg-warn-bg', head: '', ink: 'text-warn' },
  esame: { label: 'Da orale', icon: 'pin', box: 'border-border-strong bg-surface', head: 'bg-pin text-pin-contrast', ink: 'text-pin-contrast' },
  suggerimento: { label: 'Suggerimento', icon: 'arrow', box: 'border-border bg-info-bg', head: '', ink: 'text-info' },
  nota: { label: 'Nota', icon: 'note', box: 'border-border bg-surface', head: '', ink: 'text-muted' },
  inglese: { label: 'In inglese', icon: 'speech', box: 'border-border bg-surface-2', head: '', ink: 'text-text', body: 'italic' },
}

export function Callout({ kind, title, children }: { kind: CalloutKind; title?: string; children?: ReactNode }) {
  // l'MDX non è tipizzato: un kind fuori elenco (il validatore lo ferma prima) ricade sul riquadro più neutro
  const k = KINDS[kind] ?? KINDS.nota
  const pinned = k.head !== ''
  return (
    <aside role="note" className={`${BLOCK} border ${k.box}`}>
      <p className={`m-0 flex flex-wrap items-center gap-x-3 gap-y-1 px-4 ${pinned ? `py-2 ${k.head}` : 'pt-3'}`}>
        <Icon name={k.icon} size={18} className={k.ink} />
        <span className={`label ${pinned ? 'text-pin-contrast' : 'text-text'}`}>{k.label}</span>
        {title && <strong className="font-label text-[length:var(--step-0)] font-bold">{title}</strong>}
      </p>
      <div className={`px-4 pb-4 ${pinned ? 'pt-3' : 'pt-2'} ${FLOW} ${k.body ?? ''}`}>{children}</div>
    </aside>
  )
}
