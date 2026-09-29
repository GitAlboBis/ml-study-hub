// Le schede di un widget (`tabs` di BasePreset): Gaussian / Gamma / Rayleigh, "V fisso" / "K fisso", Costo /
// Interpretabilità. Una scheda non è un altro widget: stessi dati, stesso terreno, cambia ciò che è acceso e che
// cosa si regola; il motore fonde gli override con applyTab (presetTools.ts).
//
// ACCESSIBILITÀ. Lo schema "tabs" di WAI-ARIA: role="tablist" con un nome, un role="tab" per scheda con
// aria-selected, un solo arresto del Tab (tabindex mobile), frecce sinistra e destra (con giro), Inizio e Fine.
// Attivazione automatica: la freccia sceglie subito, perché cambiare scheda costa poco e si fa spesso. Il pannello
// lo avvolge il motore: `<div role="tabpanel" id={panelId} aria-labelledby={tabElementId(id, scheda)}>`.
// Il nome accessibile di ogni scheda è in parole (richToPlain): il MathML di KaTeX dentro un nome si legge male.
//
// ASPETTO. Linguette di carta sopra il terreno: la scelta ha lo spillo ocra in alto, l'inchiostro pieno e copre il
// filetto di base; le altre sono attenuate. Mai il solo colore: spillo, peso e aria-selected. Le etichette lunghe
// vanno a capo (lezione del pilota), e a 390 px le linguette vanno a capo tutte.
//
// MOTO. Nessuno: si cambia scheda spesso e da tastiera.
import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { Rich } from '../../../components/content/Rich'
import type { Rich as RichText } from '../../../content/types'
import { richToPlain, tabElementId } from './presetTools'

export interface TabStripItem {
  id: string
  label: RichText
  /** termine inglese, in corsivo sotto l'etichetta */
  en?: string
}

export interface TabStripProps {
  /** prefisso degli id delle schede nel DOM: unico nella pagina */
  id: string
  /** nome accessibile del gruppo di schede: "Famiglia di densità" */
  label: string
  tabs: readonly TabStripItem[]
  value: string
  onChange: (id: string) => void
  /** id del pannello che le schede comandano (il terreno avvolto in role="tabpanel") */
  panelId?: string
}

export function TabStrip({ id, label, tabs, value, onChange, panelId }: TabStripProps) {
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const current = Math.max(0, tabs.findIndex((t) => t.id === value))

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || tabs.length === 0) return
    let next: number
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    else return
    e.preventDefault()
    const tab = tabs[next]
    onChange(tab.id)
    refs.current.get(tab.id)?.focus()
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex flex-wrap items-end gap-x-px border-b border-border-strong">
      {tabs.map((t, i) => {
        const selected = i === current
        const name = t.en !== undefined ? `${richToPlain(t.label)} (${t.en})` : richToPlain(t.label)
        return (
          <button
            key={t.id}
            ref={(el) => {
              if (el === null) refs.current.delete(t.id)
              else refs.current.set(t.id, el)
            }}
            type="button"
            role="tab"
            id={tabElementId(id, t.id)}
            aria-selected={selected}
            aria-controls={panelId}
            aria-label={name}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`relative -mb-px grid min-h-10 max-w-full min-w-0 cursor-pointer content-center gap-0.5 border px-3 pt-2 pb-1.5 text-left [text-wrap:balance] ${
              selected ? 'border-border-strong border-b-surface bg-surface text-text' : 'border-transparent bg-transparent text-muted hover:bg-surface-2 hover:text-text'
            }`}
          >
            {selected ? <span aria-hidden="true" data-tab-pin="" className="absolute inset-x-[-1px] top-[-1px] h-1 bg-pin" /> : null}
            <Rich text={t.label} inline className={`font-label text-[length:var(--step-0)] leading-tight ${selected ? 'font-bold' : 'font-semibold'}`} />
            {t.en !== undefined ? (
              <em lang="en" className="text-[length:var(--step--1)] leading-tight text-muted">
                {t.en}
              </em>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
