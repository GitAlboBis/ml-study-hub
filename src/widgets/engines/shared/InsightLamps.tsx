// Le spie di un widget (`insights` di BasePreset): condizioni sullo stato che si accendono e si spengono mentre lo
// studente muove i comandi. "ML = Bayes", le tre ipotesi del TLC, le due condizioni di consistenza, "S_W singolare".
//
// Due forme:
// - 'list' (predefinita): tutte le spie, accese e spente, come il quadro spie di un cruscotto (nei comandi). Chi
//   guarda vede quali condizioni mancano ancora, non solo quelle soddisfatte;
// - 'badges': solo le accese, come timbri sul terreno (il motore le mette in un angolo, assolute).
//
// MAI IL SOLO COLORE. Accesa: tassello pieno del tono (ok, avvertenza, informazione) con la sua icona (spunta,
// punto esclamativo, "i") e il testo a inchiostro; spenta: tassello vuoto e testo attenuato. Per chi ascolta ogni
// voce comincia con "accesa" o "spenta".
//
// ANNUNCI. Una regione aria-live="polite" dice quali spie sono accese, ma solo quando lo stato si ferma (useSettled):
// trascinando uno slider le spie possono accendersi e spegnersi a ogni fotogramma.
//
// MOTO. Nessuno: una spia che si accende deve farlo subito, sotto la mano che muove il comando.
import { Rich } from '../../../components/content/Rich'
import { useSettled } from '../../kit/useSettled'
import { litInsights, richToPlain } from './presetTools'
import type { Insight } from './types'

export interface InsightLampsProps<State> {
  insights: readonly Insight<State>[]
  state: State
  /** 'list' tutte le spie (predefinito), 'badges' solo le accese come timbri sul terreno */
  variant?: 'list' | 'badges'
  /** titolo del gruppo; predefinito "Spie" */
  label?: string
}

type Tone = NonNullable<Insight<unknown>['tone']>

const TONE_CLASS: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok',
  warn: 'bg-warn-bg text-warn',
  info: 'bg-info-bg text-info',
}

/** Icona del tono: la forma dice che cosa è acceso anche senza colore. */
function ToneIcon({ tone }: { tone: Tone }) {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square" aria-hidden="true">
      {tone === 'ok' ? <path d="M4 12.5l5 5L20 6.5" /> : tone === 'warn' ? <path d="M12 4v10M12 18.5v.5" /> : <path d="M12 10v8M12 6v.5" />}
    </svg>
  )
}

/** Il tassello della spia: pieno con l'icona se accesa, vuoto se spenta. */
function Lamp({ on, tone }: { on: boolean; tone: Tone }) {
  return (
    <span
      aria-hidden="true"
      data-lamp={on ? 'on' : 'off'}
      className={`grid size-5 shrink-0 place-items-center border-2 ${on ? `border-border-strong ${TONE_CLASS[tone]}` : 'border-border bg-surface text-faint'}`}
    >
      {on ? <ToneIcon tone={tone} /> : null}
    </span>
  )
}

export function InsightLamps<State>({ insights, state, variant = 'list', label = 'Spie' }: InsightLampsProps<State>) {
  const lit = litInsights(insights, state)
  const litIds = new Set(lit.map((i) => i.id))
  const spoken = lit.length === 0 ? `${label}: nessuna accesa.` : `${label} accese: ${lit.map((i) => richToPlain(i.label)).join('; ')}.`
  const settled = useSettled(spoken)

  const announcer = (
    <span className="visually-hidden" aria-live="polite" aria-atomic="true">
      {settled}
    </span>
  )

  if (variant === 'badges') {
    return (
      <div className="pointer-events-none">
        <ul aria-label={label} className="m-0 flex list-none flex-wrap justify-end gap-2 p-0">
          {lit.map((i) => {
            const tone = i.tone ?? 'info'
            return (
              <li key={i.id} data-insight={i.id} className="flex max-w-full items-center gap-2 border border-border-strong bg-surface px-2 py-1 text-text shadow-1">
                <Lamp on tone={tone} />
                <span className="grid leading-tight">
                  <Rich text={i.label} inline className="font-label text-[length:var(--step--1)] font-bold" />
                  {i.en !== undefined ? (
                    <em lang="en" className="text-[length:var(--step--1)] text-muted">
                      {i.en}
                    </em>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ul>
        {announcer}
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <h5 className="label m-0">{label}</h5>
      <ul className="m-0 grid list-none gap-px border border-border bg-border p-0">
        {insights.map((i) => {
          const on = litIds.has(i.id)
          return (
            <li key={i.id} data-insight={i.id} data-on={on ? 'true' : 'false'} className="flex min-h-10 items-start gap-3 bg-surface px-3 py-2">
              <span className="mt-0.5">
                <Lamp on={on} tone={i.tone ?? 'info'} />
              </span>
              <span className={`grid gap-0.5 ${on ? 'text-text' : 'text-muted'}`}>
                <span>
                  <span className="visually-hidden">{on ? 'Accesa: ' : 'Spenta: '}</span>
                  <Rich text={i.label} inline className={on ? 'font-semibold' : undefined} />
                </span>
                {i.en !== undefined ? (
                  <em lang="en" className="text-[length:var(--step--1)] text-muted">
                    {i.en}
                  </em>
                ) : null}
              </span>
            </li>
          )
        })}
      </ul>
      {announcer}
    </div>
  )
}
