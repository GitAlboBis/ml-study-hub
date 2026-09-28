// Pezzi comuni delle pagine globali di pratica (/flashcard, /quiz): la testata della tavola, la legenda
// dell'ambito che fa anche da scelta, gli avvisi (fogli in preparazione, fogli che non si sono caricati).
//
// Connettori consultati prima di scriverli (Magic UI "quiz" e "flashcard": nessun risultato; ui-layouts
// "tabs": pillole con il pollice che scivola; nessun timer né tabella). Niente di adatto al mondo
// dell'atlante: la scelta dell'ambito è una legenda a righe con radio nativi, come la legenda del quadro
// d'unione in copertina, e le cifre di ogni riga sono le letture dell'ambito.
import { useId, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { Link } from 'react-router'
import { BTN_SECONDARY, HATCH, Icon } from '../../components/content/shared'
import { RegionSwatch } from '../../components/layout/marks'
import { ALL_REGIONS } from '../../components/layout/RegionFilter'
import { getModuleMeta, manifest } from '../../content/manifest'
import { REGION_ORDER, REGIONS, sheetNumber } from '../../lib/atlas'
import { HEAD_READINGS, PAGE_SUBTITLE, PAGE_TITLE, TICKS } from '../global/ui'
import { scopeId, scopeLabel, sheetsOf } from './selection'
import type { Scope } from './selection'


/** Titolo di sezione della pagina (h2): condensato, filo d'inchiostro spesso sopra, come in copertina. */
export const PAGE_H2 = 'm-0 border-t-2 border-border-strong pt-3 font-label text-[length:var(--step-2)] leading-tight font-bold outline-offset-4'

export interface Reading {
  label: string
  value: ReactNode
}

// ---------------------------------------------------------------------------------------------
// Testata
// ---------------------------------------------------------------------------------------------

/**
 * Testata di una tavola di pratica: il nome in extra condensato, che cosa si fa qui (italiano e inglese),
 * e a destra le coordinate della tavola (le letture di tutto l'atlante).
 */
export function PracticeTitle({ title, subtitle, en, lead, readings }: { title: string; subtitle: string; en: string; lead: ReactNode; readings?: Reading[] }) {
  return (
    <header className="border-2 border-border-strong bg-surface">
      <div aria-hidden="true" className="h-2.5 border-b border-border-strong" style={TICKS} />
      <div className="grid items-end gap-6 p-5 @3xl:grid-cols-[minmax(0,1fr)_auto] @3xl:p-8">
        <div className="min-w-0">
          <h1 className="m-0">
            <span className={PAGE_TITLE}>{title}</span>
            <span className={PAGE_SUBTITLE}>{subtitle}</span>
          </h1>
          <p lang="en" className="m-0 mt-2 text-[length:var(--step-1)] text-muted italic">
            {en}
          </p>
          <p className="m-0 mt-3 max-w-[var(--measure)] text-muted">{lead}</p>
        </div>
        {readings && readings.length > 0 && (
          <dl className={HEAD_READINGS}>
            {readings.map((r) => (
              <div key={r.label} className="contents">
                <dt className="label">{r.label}</dt>
                <dd className="num m-0">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------------------------
// Legenda dell'ambito
// ---------------------------------------------------------------------------------------------

/** Il tassello di un ambito: la regione, oppure le tre regioni accostate per "tutti i fogli". */
function ScopeSwatch({ scope }: { scope: Scope }) {
  if (scope.kind === 'regione') return <RegionSwatch course={scope.course} size={18} />
  if (scope.kind === 'foglio') {
    const course = getModuleMeta(scope.moduleId)?.course
    return course ? <RegionSwatch course={course} size={18} /> : null
  }
  return (
    <span aria-hidden="true" className="flex">
      {REGION_ORDER.map((c) => (
        <span key={c} className="-ml-px shrink-0 first:ml-0">
          <RegionSwatch course={c} size={12} />
        </span>
      ))}
    </span>
  )
}

// Sempre `input:` davanti a :checked e :focus-visible: nella riga del foglio c'è anche l'elenco dei fogli, e
// l'opzione scelta di un <select> è anch'essa :checked.

/**
 * Il segno della scelta: un quadrato vuoto; scelto, pieno d'inchiostro come la scelta di RegionFilter. Non lo spillo:
 * l'ocra dello spillo è anche il campo della regione Ricci, e la scelta si confonderebbe con la regione.
 */
const INDICATOR =
  'grid size-5 shrink-0 place-items-center border-2 border-border-strong bg-surface group-has-[input:checked]:bg-accent ' +
  "after:size-2 after:bg-accent-contrast after:opacity-0 after:content-[''] group-has-[input:checked]:after:opacity-100"

const ROW =
  'group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 border-t border-border px-3 py-2.5 first:border-t-0 ' +
  'transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2 has-[input:checked]:bg-surface-2 ' +
  'has-[input:focus-visible]:relative has-[input:focus-visible]:z-10 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-2 has-[input:focus-visible]:outline-focus ' +
  '@xl:grid-cols-[auto_minmax(0,1fr)_auto]'

function ScopeReadings({ id, readings, ready }: { id?: string; readings: Reading[]; ready: boolean }) {
  if (!ready) {
    return (
      <span id={id} className={`col-start-2 flex min-h-8 items-center justify-self-start border border-border px-2 @xl:col-start-3 @xl:justify-self-end ${HATCH}`}>
        <span className="visually-hidden">, </span>
        <span className="label bg-surface px-1 text-text">In preparazione</span>
      </span>
    )
  }
  return (
    <span id={id} className="col-start-2 flex flex-wrap gap-x-5 gap-y-1 @xl:col-start-3 @xl:justify-end">
      {readings.map((r) => (
        // le virgole nascoste separano le letture per chi ascolta (il nome del radio è tutto il testo della riga)
        <span key={r.label} className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="visually-hidden">, </span>
          <span className="num text-text">{r.value}</span> <span className="text-[length:var(--step--1)] text-muted">{r.label}</span>
        </span>
      ))}
    </span>
  )
}

interface ScopePickerProps {
  /** anche il `name` dei radio: unico nella pagina */
  id: string
  scope: Scope
  onChange: (scope: Scope) => void
  /** id dei fogli pronti */
  ready: ReadonlySet<string>
  /** le letture di un ambito, accanto alla sua riga */
  readings: (scope: Scope) => Reading[]
  /** il foglio proposto quando si passa a "Un foglio" */
  suggestedSheet: string
}

/**
 * La scelta dell'ambito come legenda: tutti i fogli, le tre regioni, un foglio. Ogni riga dice quanti fogli
 * della regione sono pronti e porta le letture (carte in scadenza, domande…). Radio nativi: un solo arresto
 * del Tab, frecce per cambiare riga; il foglio si sceglie da un elenco nativo con i fogli raggruppati per
 * regione (quelli in preparazione ci sono, ma non si possono scegliere).
 */
export function ScopePicker({ id, scope, onChange, ready, readings, suggestedSheet }: ScopePickerProps) {
  const [sheet, setSheet] = useState(scope.kind === 'foglio' ? scope.moduleId : suggestedSheet)
  const current = scope.kind === 'foglio' ? scope.moduleId : sheet
  const uid = useId()
  const sheetScope: Scope = { kind: 'foglio', moduleId: current }

  const rows: { key: string; scope: Scope; name: string }[] = [
    // la stessa dicitura del filtro per regione delle altre pagine
    { key: 'tutti', scope: { kind: 'tutti' }, name: ALL_REGIONS },
    ...REGION_ORDER.map((course) => ({ key: course, scope: { kind: 'regione', course } as Scope, name: REGIONS[course].name })),
  ]
  const readyIn = (s: Scope) => sheetsOf(s).filter((m) => ready.has(m.id)).length

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="label mb-2 p-0">Ambito</legend>
      <div className="grid border border-border-strong bg-surface">
        {rows.map((row) => {
          const sheets = sheetsOf(row.scope).length
          const n = readyIn(row.scope)
          return (
            <label key={row.key} className={`${ROW} min-h-12 cursor-pointer`}>
              <input
                type="radio"
                name={id}
                value={row.key}
                checked={scopeId(scope) === scopeId(row.scope)}
                onChange={() => onChange(row.scope)}
                className="visually-hidden"
              />
              <span aria-hidden="true" className={INDICATOR} />
              <span className="flex min-w-0 items-center gap-2.5">
                <ScopeSwatch scope={row.scope} />
                <span className="grid min-w-0">
                  <span className="font-label text-[length:var(--step-1)] leading-tight font-bold">{row.name}</span>
                  <span className="visually-hidden">, </span>
                  <span className="num text-[length:var(--step--1)] text-muted">
                    {n} di {sheets} fogli pronti
                  </span>
                </span>
              </span>
              <ScopeReadings readings={n > 0 ? readings(row.scope) : []} ready={n > 0} />
            </label>
          )
        })}

        {/* un foglio: il radio e l'elenco dei fogli sono due controlli distinti, uno accanto all'altro */}
        <div className={ROW}>
          <label className="contents cursor-pointer">
            <input
              type="radio"
              name={id}
              value="foglio"
              checked={scope.kind === 'foglio'}
              onChange={() => onChange(sheetScope)}
              aria-describedby={`${uid}-r`}
              className="visually-hidden"
            />
            <span aria-hidden="true" className={INDICATOR} />
            <span className="flex min-h-10 min-w-0 cursor-pointer items-center gap-2.5">
              <ScopeSwatch scope={sheetScope} />
              <span className="font-label text-[length:var(--step-1)] leading-tight font-bold">Un foglio</span>
            </span>
          </label>
          <span className="col-start-2 flex min-w-0 @xl:col-span-2">
            <select
              aria-label="Foglio"
              value={current}
              onChange={(e) => {
                setSheet(e.target.value)
                onChange({ kind: 'foglio', moduleId: e.target.value })
              }}
              className="min-h-10 w-full min-w-0 cursor-pointer border border-border-strong bg-surface px-2 font-label font-semibold text-text"
            >
              {REGION_ORDER.map((course) => (
                <optgroup key={course} label={REGIONS[course].name}>
                  {manifest
                    .filter((m) => m.course === course)
                    .map((m) => (
                      <option key={m.id} value={m.id} disabled={!ready.has(m.id)}>
                        {sheetNumber(m.id)} · {m.title}
                        {ready.has(m.id) ? '' : ' (in preparazione)'}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </span>
          <ScopeReadings id={`${uid}-r`} readings={ready.has(current) ? readings(sheetScope) : []} ready={ready.has(current)} />
        </div>
      </div>
    </fieldset>
  )
}

// ---------------------------------------------------------------------------------------------
// Avvisi
// ---------------------------------------------------------------------------------------------

/** Nessun foglio è ancora pronto: niente da ripassare in tutto l'atlante. */
export function NoSheetsYet({ what }: { what: string }) {
  return (
    <div className={`grid min-h-40 content-end border border-border-strong p-5 ${HATCH}`}>
      <div className="grid max-w-[var(--measure)] justify-items-start gap-2">
        <p className="label m-0 bg-surface px-1 text-text">Fogli in preparazione</p>
        <p className="m-0 bg-surface px-1">
          Nessun foglio è ancora pronto: {what} arrivano insieme ai contenuti. Intanto puoi studiare sulle pagine delle fonti.
        </p>
        <Link to="/" className={`${BTN_SECONDARY} bg-surface no-underline`}>
          Torna alla copertina
        </Link>
      </div>
    </div>
  )
}

/** L'ambito scelto non ha fogli pronti (una regione ancora vuota, un foglio in preparazione). */
export function ScopePreparing({ scope, what, onAll }: { scope: Scope; what: string; onAll?: () => void }) {
  const text =
    scope.kind === 'foglio'
      ? `Il ${scopeLabel(scope)} è in preparazione: ${what} arrivano con i suoi contenuti.`
      : scope.kind === 'regione'
        ? `Nessuno dei ${sheetsOf(scope).length} fogli della regione ${REGIONS[scope.course].name} è ancora pronto: ${what} arrivano con i contenuti.`
        : `Nessun foglio è ancora pronto: ${what} arrivano con i contenuti.`
  return (
    <div className={`grid content-end border border-border-strong p-4 ${HATCH}`}>
      <div className="grid max-w-[var(--measure)] justify-items-start gap-2">
        <p className="m-0 bg-surface px-1">{text}</p>
        {onAll && (
          <button type="button" className={`${BTN_SECONDARY} bg-surface`} onClick={onAll}>
            Scegli tutti i fogli pronti
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Alcuni fogli pronti non si sono caricati: la pagina lavora senza, e lo dice. `what` è ciò che manca dai conti
 * ("le loro carte"); `effect`, se c'è, sostituisce tutta la conseguenza ("i giochi usano gli altri fogli pronti").
 */
export function LoadFailures({ failed, what, effect, onRetry }: { failed: readonly string[]; what?: string; effect?: string; onRetry: () => void }) {
  if (failed.length === 0) return null
  const names = failed.map((id) => `Foglio ${sheetNumber(id) ?? id}`).join(', ')
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 border border-border-strong bg-warn-bg p-3">
      <Icon name="warning" className="text-warn" />
      <p className="m-0 min-w-0 flex-1 basis-64">
        {failed.length === 1 ? `${names} non si è caricato` : `${names} non si sono caricati`}: {effect ?? `${what ?? 'i loro dati'} mancano dai conti`}. Riprova; se non basta, ricarica la pagina.
      </p>
      <button type="button" className={BTN_SECONDARY} onClick={onRetry}>
        <Icon name="reset" size={18} />
        Riprova
      </button>
    </div>
  )
}

export function Loading({ what }: { what: string }) {
  return (
    <p role="status" className="label m-0">
      Raccolgo {what} dai fogli pronti…
    </p>
  )
}

// ---------------------------------------------------------------------------------------------
// Barra della sessione
// ---------------------------------------------------------------------------------------------

/**
 * Sopra una sessione in corso: che cosa stai facendo e su quale ambito, e il comando per tornare alla scelta
 * (assente quando la sessione ha già i suoi comandi di fine). Il titolo può prendere il fuoco (tabIndex -1).
 */
export function SessionBar({ headingRef, title, detail, exitLabel, onExit }: { headingRef?: Ref<HTMLHeadingElement>; title: string; detail: ReactNode; exitLabel?: string; onExit: () => void }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t-2 border-border-strong pt-3">
      <div className="grid min-w-0 gap-0.5">
        <h2 ref={headingRef} tabIndex={-1} className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold outline-offset-4">
          {title}
        </h2>
        <p className="m-0 text-muted">{detail}</p>
      </div>
      {exitLabel !== undefined && (
        <button type="button" className={BTN_SECONDARY} onClick={onExit}>
          {exitLabel}
        </button>
      )}
    </div>
  )
}
