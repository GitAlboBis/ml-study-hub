// Il filtro per regione, uguale in tutte le pagine globali (mappa, formulario, glossario, copertura, giochi):
// "Tutte le regioni" e le tre regioni, ognuna con il suo tassello di legenda e, se la pagina li ha, i conteggi.
// Radio nativi come Segmented (un solo arresto del Tab, frecce per scegliere, stato annunciato dal browser); la
// scelta è a inchiostro, non a spillo: l'ocra dello spillo è anche il campo della regione Ricci, e un tasto Ricci
// premuto in ocra farebbe sparire il suo tassello. Sul tassello scelto un filetto nel colore della carta lo tiene
// staccato dall'inchiostro, nei due temi.
//
// Connettori consultati: ui-layouts "Tabs" (pillole con il pollice che scivola, angoli tondi), Magic UI (nessun
// controllo di scelta). Se ne tiene solo la semantica del gruppo; l'aspetto è quello di Segmented, nel mondo del foglio.
import type { ReactNode } from 'react'
import type { CourseId } from '../../content/types'
import { REGION_ORDER, REGIONS } from '../../lib/atlas'
import { RegionSwatch } from './marks'

/** La dicitura unica dell'opzione che non filtra. */
export const ALL_REGIONS = 'Tutte le regioni'

export interface RegionFilterProps {
  /** anche il `name` dei radio: unico nella pagina */
  id: string
  value: CourseId | null
  onChange: (course: CourseId | null) => void
  /** conteggi accanto alle opzioni: `all` per "Tutte le regioni" */
  counts?: Partial<Record<CourseId | 'all', ReactNode>>
  label?: string
  /** etichetta a sinistra dei tasselli (barre dei filtri) invece che sopra */
  inline?: boolean
}

const OPTION =
  'group label relative flex min-h-10 flex-auto cursor-pointer items-center justify-center gap-2 bg-surface px-3 py-1.5 text-center whitespace-nowrap text-text ' +
  'transition-[background-color,color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2 ' +
  'has-[:checked]:bg-accent has-[:checked]:text-accent-contrast has-[:checked]:hover:bg-accent ' +
  'has-[:focus-visible]:z-10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus'

/** Il tassello di "Tutte le regioni": i tre campi accostati, come nella legenda della pratica. */
function AllSwatch() {
  return (
    <span aria-hidden="true" className="flex">
      {REGION_ORDER.map((c) => (
        <span key={c} className="-ml-px shrink-0 first:ml-0">
          <RegionSwatch course={c} size={10} />
        </span>
      ))}
    </span>
  )
}

export function RegionFilter({ id, value, onChange, counts, label = 'Regione', inline = false }: RegionFilterProps) {
  const labelId = `${id}-label`
  const options: { key: string; course: CourseId | null; name: string }[] = [
    { key: 'all', course: null, name: ALL_REGIONS },
    ...REGION_ORDER.map((c) => ({ key: c, course: c as CourseId | null, name: REGIONS[c].name })),
  ]
  return (
    <div className={inline ? 'flex flex-wrap items-center gap-x-3 gap-y-2' : 'grid gap-1.5'}>
      <span id={labelId} className={`label ${inline ? 'm-0 min-w-24' : ''}`}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-px border border-border-strong bg-border-strong">
        {options.map((o) => {
          const count = counts?.[o.course ?? 'all']
          return (
            <label key={o.key} className={OPTION}>
              <input type="radio" name={id} value={o.key} checked={value === o.course} onChange={() => onChange(o.course)} className="visually-hidden" />
              {/* sul tassello scelto il filetto color carta lo stacca dall'inchiostro */}
              <span className="grid shrink-0 place-items-center group-has-[:checked]:outline group-has-[:checked]:outline-accent-contrast">
                {o.course ? <RegionSwatch course={o.course} /> : <AllSwatch />}
              </span>
              {/* lo spazio fra nome e cifra sta nel testo: il nome accessibile diventa "Ricci 12", non "Ricci12" */}
              {count === undefined ? o.name : `${o.name} `}
              {count !== undefined && <span className="num tracking-normal">{count}</span>}
            </label>
          )
        })}
      </div>
    </div>
  )
}
