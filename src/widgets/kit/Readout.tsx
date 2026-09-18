// Lettura di uno strumento: etichetta di cornice sopra, cifra in mono sotto (p̂(x) = 0.1837, errore, N).
// La cifra cambia subito, senza contatori che rincorrono il valore: è una misura, e un numero che
// scorre verso quello giusto mostrerebbe per qualche istante valori che non sono mai esistiti.
// (È il motivo per cui il "number ticker" di Magic UI, trovato nei connettori, qui non è usato.)
//
// ACCESSIBILITÀ. <output> è una regione aria-live="polite". Dentro ci sono due testi: quello che si
// vede, nascosto ai lettori di schermo, che segue il valore fotogramma per fotogramma; e quello che
// si ascolta, nascosto alla vista, che cambia solo quando il valore si ferma (useSettled). Così una
// riproduzione o un trascinamento non mettono in coda cento annunci, ma il valore finale si sente.
//
// IN EVIDENZA (pinned). Lo spillo del mondo: un tassello ocra con il bordo a inchiostro davanti
// all'etichetta, come nella legenda dell'Idea chiave, e le parole "in evidenza" per chi ascolta.
// Mai il solo colore, e niente filetto laterale.
import { M } from '../../components/content/M'
import { formatValue, typographic } from './format'
import type { NumberFormat } from './format'
import { useSettled } from './useSettled'

export interface ReadoutProps {
  label: string
  /** Un numero passa da `format`; una stringa (una classe, un esito) si mostra com'è. */
  value: number | string
  /** Predefinito: due decimali. Per i conteggi: fixed(0). */
  format?: NumberFormat
  /** Simbolo della grandezza in LaTeX, davanti all'etichetta: '\\hat p(x)'. */
  latex?: string
  unit?: string
  /** In evidenza: la lettura che la sfida o il passo corrente chiedono di guardare (spillo ocra). */
  pinned?: boolean
}

export function Readout({ label, value, format, latex, unit, pinned = false }: ReadoutProps) {
  const shown = typographic(formatValue(value, format))
  const spoken = useSettled(unit !== undefined ? `${shown} ${unit}` : shown)
  return (
    <div className="grid min-w-0 gap-0.5">
      <span className="flex items-baseline gap-2">
        {pinned && <span data-pin="" aria-hidden="true" className="size-3 shrink-0 self-center border border-border-strong bg-pin" />}
        {/* simbolo per gli occhi: chi ascolta sente l'etichetta in parole (vedi Slider) */}
        {latex !== undefined && (
          <span aria-hidden="true" className="text-text">
            <M tex={latex} />
          </span>
        )}
        <span className="label">{label}</span>
      </span>
      <output aria-live="polite" aria-atomic="true" className="relative block">
        <span aria-hidden="true" className="num text-[length:var(--step-1)] leading-tight text-text">
          {shown}
          {unit !== undefined && <span className="text-[length:var(--step--1)] text-muted"> {unit}</span>}
        </span>
        <span className="visually-hidden">
          {label}
          {pinned ? ' (in evidenza)' : ''}: {spoken}
        </span>
      </output>
    </div>
  )
}
