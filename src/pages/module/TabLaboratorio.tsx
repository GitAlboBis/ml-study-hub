// Scheda Laboratorio: tutti i widget del foglio, uno sotto l'altro, con il filtro per concetto dell'inventario.
// <Widget id> carica ogni widget quando ci si avvicina e, se il file non esiste ancora, mostra la scheda
// "in costruzione" con titolo e concetti presi da data.widgets. Ogni widget si apre anche a tutta pagina (/lab/:id).
// Il filtro è un select nativo: i concetti di un foglio sono decine e una fila di pulsanti non sarebbe leggibile.
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/content/shared'
import { Widget } from '../../components/content/Widget'
import type { ModuleData } from '../../content/types'
import { SELECT } from './ui'

export default function TabLaboratorio({ data }: { data: ModuleData }) {
  const [concept, setConcept] = useState('')
  const selectId = useId()
  const widgets = data.widgets
  const counts = new Map<string, number>()
  for (const w of widgets) for (const c of w.concepts) counts.set(c, (counts.get(c) ?? 0) + 1)
  const concepts = [...counts.keys()].sort((a, b) => a.localeCompare(b, 'it', { numeric: true }))
  const shown = concept ? widgets.filter((w) => w.concepts.includes(concept)) : widgets

  if (widgets.length === 0) {
    return <p className="m-0 max-w-[var(--measure)] text-muted">Questo foglio non ha ancora widget.</p>
  }

  return (
    <div>
      <h2 className="visually-hidden">Widget del foglio</h2>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3 border-b border-border-strong pb-4">
        <div className="grid gap-1">
          <label htmlFor={selectId} className="label">
            Concetto
          </label>
          <select id={selectId} value={concept} onChange={(e) => setConcept(e.target.value)} className={SELECT}>
            <option value="">Tutti i concetti</option>
            {concepts.map((c) => (
              <option key={c} value={c}>
                {c} · {counts.get(c)} widget
              </option>
            ))}
          </select>
        </div>
        <p role="status" className="num m-0 pb-2 text-[length:var(--step--1)] text-muted">
          {shown.length} widget su {widgets.length}
        </p>
      </div>

      <ol className="m-0 mt-8 grid list-none gap-14 p-0">
        {shown.map((w) => (
          <li key={w.id} className="m-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-2">
              <span className="num text-[length:var(--step--1)] text-muted">{w.concepts.length === 1 ? "1 concetto" : `${w.concepts.length} concetti`}</span>
              <Link to={`/lab/${w.id}`} className="label ml-auto inline-flex min-h-10 items-center gap-2 text-link">
                A tutta pagina
                <span className="visually-hidden">: {w.title}</span>
                <Icon name="arrow" size={16} />
              </Link>
            </div>
            <Widget id={w.id} />
          </li>
        ))}
      </ol>
    </div>
  )
}
