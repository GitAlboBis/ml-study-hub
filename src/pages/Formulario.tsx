// Formulario (/formulario): tutte le formule dei fogli pronti in un posto solo, raggruppate per regione (corso) e
// per foglio. Filtri per regione, foglio e importanza con il conteggio di ogni scelta, ricerca per nome italiano o
// inglese e per simbolo (σ, \sigma, h_N), modalità ripasso a una formula per volta (FormulaReview), stampa pulita.
// È un prontuario: ogni formula è una riga (FormulaLine) con nome IT/EN, importanza, formula e fonte, e il
// rimando alla stessa formula nella scheda Formule del foglio; spiegazione e simboli si aprono a richiesta (la
// targa intera resta nel foglio). I fogli non ancora pronti si vedono come terreno tratteggiato, con i loro numeri.
// Indice dei fogli a lato già a larghezza media; sotto, il menu "Foglio" dei filtri fa lo stesso lavoro.
//
// Connettori consultati (Magic UI, ui-layouts): nessun elenco filtrabile né indice utilizzabile senza cambiare il
// mondo (liste animate, rivelazioni con gradiente); si tiene solo la semantica e si scrive sui token del foglio.
//
// Filtri iniziali dall'indirizzo, letti una volta: ?q=…&regione=melgani&foglio=<id>&importanza=3. Un'ancora
// #formula:<modulo>:<id> porta alla formula; #foglio-<modulo> al foglio.
import { memo, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { flushSync } from 'react-dom'
import { Link, useLocation, useSearchParams } from 'react-router'
import { BTN_PRIMARY, BTN_SECONDARY, BTN_TOGGLE, Icon } from '../components/content/shared'
import { RegionSwatch } from '../components/layout/marks'
import { RegionFilter } from '../components/layout/RegionFilter'
import { SettledStatus } from '../components/ui/SettledStatus'
import { getModuleMeta, manifest } from '../content/manifest'
import type { CourseId } from '../content/types'
import { REGION_ORDER, REGIONS, sheetNumber } from '../lib/atlas'
import { collectFormulas, filterFormulas, formulaFacets, groupFormulas, IMPORTANCE_LEVELS, NO_FILTERS } from '../lib/formulario'
import type { FormulaEntry, FormulaFilters, SheetGroup } from '../lib/formulario'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { SELECT } from './module/ui'
import { DeferredMount } from './reference/DeferredMount'
import { FormulaLine } from './reference/FormulaLine'
import { FormulaReview } from './reference/FormulaReview'
import { MountAllContext } from './reference/mountAll'
import { FailedSheets, ImportanceMark, PendingSheets, ReferenceHeader, SearchGlyph, SheetsLoading } from './reference/parts'
import { PrintSheet } from './reference/PrintSheet'
import { pendingSheets } from './reference/sheets'
import { FILTER_LABEL, IMPORTANCE_INFO, PAGE, SEARCH_INPUT } from './reference/ui'
import { useReadySheets } from './reference/useReadySheets'

const COURSES = new Set<string>(REGION_ORDER)
const sheetAnchor = (moduleId: string) => `foglio-${moduleId}`

/** Filtri iniziali dall'indirizzo; i valori che non esistono si ignorano. */
function filtersFromParams(params: URLSearchParams): FormulaFilters {
  const course = params.get('regione') ?? ''
  const moduleId = params.get('foglio') ?? ''
  const importance = Number(params.get('importanza'))
  return {
    query: params.get('q') ?? '',
    course: COURSES.has(course) ? (course as CourseId) : null,
    moduleId: getModuleMeta(moduleId) ? moduleId : null,
    importance: importance === 1 || importance === 2 || importance === 3 ? importance : null,
  }
}

// ---------------------------------------------------------------------------------------------
// Una formula e un foglio dell'elenco. Filtrare nasconde e non smonta: KaTeX non si ricalcola a ogni tasto.
// ---------------------------------------------------------------------------------------------

// il contenuto della riga non dipende dai filtri: memo a parte, così cambiare `hidden` non ridisegna la riga
const PlateBody = memo(function PlateBody({ entry }: { entry: FormulaEntry }) {
  return <FormulaLine entry={entry} />
})

const FormulaPlate = memo(function FormulaPlate({ entry, hidden }: { entry: FormulaEntry; hidden: boolean }) {
  return (
    <div
      data-formula={entry.key}
      hidden={hidden}
      className="my-3 [contain-intrinsic-size:auto_12rem] [content-visibility:auto] print:my-2 print:[content-visibility:visible] print:break-inside-avoid print:[&_button]:hidden"
    >
      <PlateBody entry={entry} />
    </div>
  )
})

const SheetBlock = memo(function SheetBlock({ group, shown, target }: { group: SheetGroup; shown: ReadonlySet<string>; target: string | null }) {
  const headingId = useId()
  const count = group.entries.reduce((n, e) => n + (shown.has(e.key) ? 1 : 0), 0)
  // l'ancora dell'indirizzo punta a questo foglio o a una sua formula: si monta subito
  const wanted = target !== null && (target === sheetAnchor(group.moduleId) || target.startsWith(`formula:${group.moduleId}:`))
  return (
    <section id={sheetAnchor(group.moduleId)} aria-labelledby={headingId} hidden={count === 0} className="mt-10">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 border-b-2 border-border-strong pb-3 print:break-after-avoid">
        {/* il numero del foglio in un tassello a inchiostro, come nell'angolo di un foglio d'atlante */}
        <span aria-hidden="true" className="grid min-w-16 place-items-center self-start border-2 border-border-strong px-2 py-1.5 font-display text-[length:var(--step-4)] leading-none font-extrabold">
          {group.number}
        </span>
        <div className="grid min-w-0 content-start gap-x-4 gap-y-2 @2xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <h3 id={headingId} className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold">
              <span className="visually-hidden">Foglio {group.number} · </span>
              {group.title}
            </h3>
            <p lang="en" className="m-0 mt-0.5 text-muted italic">
              {group.titleEn}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 @2xl:justify-end">
            <p className="m-0 text-[length:var(--step--1)] text-muted">
              {count === group.entries.length ? (
                <>
                  <span className="num text-text">{count}</span> {count === 1 ? 'formula' : 'formule'}
                </>
              ) : (
                <>
                  <span className="num text-text">{count}</span> di <span className="num">{group.entries.length}</span> formule
                </>
              )}
            </p>
            <Link to={`/m/${group.moduleId}/formule`} className={`${BTN_SECONDARY} min-h-10 no-underline print:hidden`}>
              Apri il foglio
              <span className="visually-hidden"> {group.number}</span>
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        </div>
      </header>
      <DeferredMount estimate={`${group.entries.length * 12}rem`} force={wanted}>
        {group.entries.map((e) => (
          <FormulaPlate key={e.key} entry={e} hidden={!shown.has(e.key)} />
        ))}
      </DeferredMount>
    </section>
  )
})

// ---------------------------------------------------------------------------------------------
// Filtri
// ---------------------------------------------------------------------------------------------

interface FilterBarProps {
  filters: FormulaFilters
  onChange: (next: FormulaFilters) => void
  facets: ReturnType<typeof formulaFacets>
  sheets: SheetGroup[]
  readyIds: ReadonlySet<string>
  /** il campo di ricerca: la pagina ci riporta il fuoco dopo "Azzera i filtri" */
  search: RefObject<HTMLInputElement | null>
}

function FilterBar({ filters, onChange, facets, sheets, readyIds, search }: FilterBarProps) {
  const searchId = useId()
  const sheetId = useId()
  const regionId = useId()
  const importanceLabel = useId()
  const set = (patch: Partial<FormulaFilters>) => onChange({ ...filters, ...patch })
  const allCourses = REGION_ORDER.reduce((n, c) => n + facets.course[c], 0)
  const allImportance = IMPORTANCE_LEVELS.reduce((n, i) => n + facets.importance[i], 0)
  const allSheets = Object.values(facets.modules).reduce((n, c) => n + c, 0)
  const selectable = sheets.filter((s) => !filters.course || getModuleMeta(s.moduleId)?.course === filters.course)
  const orphan = filters.moduleId !== null && !sheets.some((s) => s.moduleId === filters.moduleId) ? getModuleMeta(filters.moduleId) : undefined

  return (
    <div className="grid grid-cols-1 gap-4 border-b border-border p-4 @3xl:px-5">
      <div className="grid grid-cols-1 gap-2">
        <label htmlFor={searchId} className="label m-0 text-text">
          Cerca una formula
        </label>
        <div className="relative">
          <SearchGlyph className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            ref={search}
            id={searchId}
            type="search"
            autoComplete="off"
            spellCheck={false}
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Nome o simbolo: margine, σ, h_N"
            className={SEARCH_INPUT}
          />
          {filters.query !== '' && (
            <button
              type="button"
              aria-label="Svuota la ricerca"
              title="Svuota la ricerca"
              onClick={() => {
                set({ query: '' })
                search.current?.focus()
              }}
              className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 cursor-pointer place-items-center text-muted transition-colors duration-[var(--dur-fast)] ease-out hover:text-text"
            >
              <Icon name="cross" size={18} />
            </button>
          )}
        </div>
      </div>

      <RegionFilter
        id={regionId}
        inline
        value={filters.course}
        counts={{ all: allCourses, ...facets.course }}
        onChange={(course) =>
          // un foglio scelto che non sta nella regione nuova si lascia andare
          set({ course, moduleId: course && filters.moduleId && getModuleMeta(filters.moduleId)?.course !== course ? null : filters.moduleId })
        }
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label htmlFor={sheetId} className={FILTER_LABEL}>
          Foglio
        </label>
        <select
          id={sheetId}
          value={filters.moduleId ?? ''}
          onChange={(e) => set({ moduleId: e.target.value || null })}
          className={`${SELECT} max-w-full min-w-0 flex-1 basis-60 @3xl:flex-none`}
        >
          <option value="">Tutti i fogli ({allSheets})</option>
          {REGION_ORDER.filter((c) => selectable.some((s) => getModuleMeta(s.moduleId)?.course === c)).map((course) => (
            <optgroup key={course} label={REGIONS[course].name}>
              {selectable
                .filter((s) => getModuleMeta(s.moduleId)?.course === course)
                .map((s) => (
                  <option key={s.moduleId} value={s.moduleId}>
                    {s.number} · {s.title} ({facets.modules[s.moduleId] ?? 0})
                  </option>
                ))}
            </optgroup>
          ))}
          {orphan && (
            <option value={orphan.id}>
              {sheetNumber(orphan.id)} · {orphan.title} ({readyIds.has(orphan.id) ? 'senza formule' : 'in preparazione'})
            </option>
          )}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p id={importanceLabel} className={FILTER_LABEL}>
          Importanza
        </p>
        <div role="group" aria-labelledby={importanceLabel} className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={filters.importance === null} onClick={() => set({ importance: null })} className={BTN_TOGGLE}>
            Tutte <span className="num tracking-normal">{allImportance}</span>
          </button>
          {IMPORTANCE_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={filters.importance === level}
              title={IMPORTANCE_INFO[level].long}
              onClick={() => set({ importance: level })}
              className={BTN_TOGGLE}
            >
              <ImportanceMark value={level} />
              {IMPORTANCE_INFO[level].short} <span className="num tracking-normal">{facets.importance[level]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// La pagina
// ---------------------------------------------------------------------------------------------

export default function Formulario() {
  useDocumentTitle('Formulario')
  const { sheets, retry, retrying } = useReadySheets()
  const [params] = useSearchParams()
  const { hash } = useLocation()
  const [filters, setFilters] = useState<FormulaFilters>(() => filtersFromParams(params))
  const [reviewing, setReviewing] = useState(false)
  const [mountAll, setMountAll] = useState(false)
  const reviewButton = useRef<HTMLButtonElement>(null)
  const wasReviewing = useRef(false)
  const search = useRef<HTMLInputElement>(null)

  const modules = useMemo(() => (sheets.status === 'ready' ? sheets.modules : []), [sheets])
  const readyIds = useMemo(() => new Set(modules.map((m) => m.id)), [modules])
  const entries = useMemo(() => collectFormulas(modules), [modules])
  const groups = useMemo(() => groupFormulas(entries), [entries])
  const allSheets = useMemo(() => groups.flatMap((g) => g.sheets), [groups])
  // il campo segue il tasto subito; l'elenco (centinaia di targhe) lo rincorre senza bloccarlo
  const deferred = useDeferredValue(filters)
  const shown = useMemo(() => filterFormulas(entries, deferred), [entries, deferred])
  const shownKeys = useMemo(() => new Set(shown.map((e) => e.key)), [shown])
  const facets = useMemo(() => formulaFacets(entries, deferred), [entries, deferred])
  const byHeart = entries.filter((e) => e.formula.importance === 3).length

  let target: string | null = null
  try {
    target = hash ? decodeURIComponent(hash.slice(1)) : null
  } catch {
    // ancora malformata: si resta in cima
  }

  // l'ancora dell'indirizzo, quando i fogli sono arrivati (il suo blocco è montato subito, vedi SheetBlock)
  const ready = sheets.status === 'ready'
  useEffect(() => {
    if (!ready || !target || reviewing) return
    // scrollIntoView manca in jsdom e nei browser molto vecchi
    document.getElementById(target)?.scrollIntoView?.({ block: 'start' })
  }, [ready, target, reviewing])

  // uscendo dal ripasso il fuoco torna al pulsante che l'ha aperto
  useEffect(() => {
    if (wasReviewing.current && !reviewing) reviewButton.current?.focus()
    wasReviewing.current = reviewing
  }, [reviewing])

  const query = filters.query.trim()
  const active = query !== '' || filters.course !== null || filters.moduleId !== null || filters.importance !== null
  // i fogli in preparazione si mostrano quando non si cerca e non si è scelto un foglio
  const showPending = query === '' && filters.moduleId === null
  const regions = REGION_ORDER.filter((c) => filters.course === null || filters.course === c).map((course) => {
    const group = groups.find((g) => g.course === course)
    const count = group ? group.sheets.reduce((n, s) => n + s.entries.filter((e) => shownKeys.has(e.key)).length, 0) : 0
    const pending = showPending ? pendingSheets(course, readyIds) : []
    const readyCount = manifest.filter((m) => m.course === course && readyIds.has(m.id)).length
    return { course, group, count, pending, readyCount, visible: count > 0 || pending.length > 0 }
  })
  const anyVisible = regions.some((r) => r.visible)

  const printAll = () => flushSync(() => setMountAll(true))
  // "Azzera i filtri" sparisce premendolo: il fuoco torna nel campo di ricerca, che c'è sempre
  const resetFilters = () => {
    setFilters(NO_FILTERS)
    search.current?.focus()
  }
  const countText = `${shown.length} ${shown.length === 1 ? 'formula' : 'formule'} su ${entries.length}`

  return (
    <main data-print-page="" className={PAGE}>
      <PrintSheet onBeforePrint={printAll} />
      <ReferenceHeader
        title="Formulario"
        titleEn="Formula sheet"
        lead="Tutte le formule dei fogli pronti, in un posto solo: cercale per nome o per simbolo, filtrale per regione e importanza, ripassale coperte."
        stats={[
          { label: 'Formule', value: ready ? entries.length : '…' },
          { label: 'A memoria', value: ready ? byHeart : '…' },
          { label: 'Fogli pronti', value: ready ? `${modules.length} di ${manifest.length}` : '…' },
        ]}
      />

      {sheets.status === 'loading' ? (
        <SheetsLoading what="Raccolgo le formule dai fogli pronti…" />
      ) : (
        <>
          <FailedSheets failed={sheets.failed} noun="formule" onRetry={retry} retrying={retrying} />

          {reviewing ? (
            <FormulaReview entries={shown} onExit={() => setReviewing(false)} />
          ) : (
            <>
              {entries.length === 0 ? (
                <p className="m-0 mt-8 max-w-[var(--measure)] text-muted">
                  Il formulario si riempie con i fogli: per ora nessun foglio pronto ha ancora formule. Le formule arrivano insieme ai fogli, già divise per regione.
                </p>
              ) : (
                <section aria-label="Filtri del formulario" className="@container mt-8 border border-border-strong bg-surface print:hidden">
                  <FilterBar filters={filters} onChange={setFilters} facets={facets} sheets={allSheets} readyIds={readyIds} search={search} />
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3 @3xl:px-5">
                    {/* il conteggio a vista segue ogni tasto; quello annunciato arriva a scrittura ferma */}
                    <p aria-hidden="true" className="m-0 text-muted">
                      <span className="num text-[length:var(--step-1)] text-text">{shown.length}</span> {shown.length === 1 ? 'formula' : 'formule'} su{' '}
                      <span className="num">{entries.length}</span>
                    </p>
                    <SettledStatus text={countText} label="Risultati" />
                    <div className="flex flex-wrap gap-2 @3xl:ml-auto">
                      {active && (
                        <button type="button" onClick={resetFilters} className={BTN_SECONDARY}>
                          <Icon name="reset" size={18} />
                          Azzera i filtri
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          printAll()
                          window.print()
                        }}
                        className={BTN_SECONDARY}
                      >
                        <Icon name="page" size={18} />
                        Stampa
                      </button>
                      {shown.length > 0 && (
                        <button ref={reviewButton} type="button" onClick={() => setReviewing(true)} className={BTN_PRIMARY}>
                          <Icon name="eye-off" size={18} />
                          {shown.length === 1 ? 'Ripassa questa formula' : `Ripassa queste ${shown.length} formule`}
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {entries.length > 0 && !anyVisible && (
                <div className="mt-8 grid max-w-[var(--measure)] justify-items-start gap-3">
                  <p className="m-0 text-muted">
                    {filters.moduleId !== null && !readyIds.has(filters.moduleId)
                      ? `Il foglio ${sheetNumber(filters.moduleId)} è ancora in preparazione: le sue formule arriveranno con lui.`
                      : query !== ''
                        ? `Nessuna formula risponde a «${query}» con questi filtri.`
                        : 'Nessuna formula con questi filtri.'}
                  </p>
                  <button type="button" onClick={resetFilters} className={BTN_SECONDARY}>
                    <Icon name="reset" size={18} />
                    Azzera i filtri
                  </button>
                </div>
              )}

              <MountAllContext value={mountAll}>
                <div className="mt-10 grid grid-cols-1 gap-10 @4xl:grid-cols-[12rem_minmax(0,1fr)]">
                  <SheetIndex regions={regions} shown={shownKeys} />
                  <div className="grid min-w-0 grid-cols-1 content-start gap-14">
                    {regions.map((r) => (
                      <section key={r.course} aria-labelledby={`regione-${r.course}`} hidden={!r.visible} className={r.count === 0 ? 'print:hidden' : undefined}>
                        <div className="flex flex-wrap items-stretch border-2 border-border-strong bg-surface print:break-after-avoid">
                          <h2 id={`regione-${r.course}`} className={`${REGIONS[r.course].field} m-0 px-4 py-2 font-display text-[length:var(--step-4)] leading-none font-extrabold uppercase`}>
                            {REGIONS[r.course].name}
                          </h2>
                          <p className="m-0 flex flex-wrap items-center gap-x-2 px-4 py-2 text-[length:var(--step--1)] text-muted">
                            <span>
                              <span className="num text-text">{r.count}</span> {r.count === 1 ? 'formula' : 'formule'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              fogli pronti <span className="num text-text">{r.readyCount}</span> di <span className="num">{manifest.filter((m) => m.course === r.course).length}</span>
                            </span>
                          </p>
                        </div>
                        {r.group?.sheets.map((s) => (
                          <SheetBlock key={s.moduleId} group={s} shown={shownKeys} target={target} />
                        ))}
                        <PendingSheets region={REGIONS[r.course].name} pending={r.pending} readyCount={r.readyCount} what="le sue formule" />
                      </section>
                    ))}
                  </div>
                </div>
              </MountAllContext>
            </>
          )}
        </>
      )}
    </main>
  )
}

// ---------------------------------------------------------------------------------------------
// Indice a lato (schermi larghi): regioni e fogli con quante formule mostrano, come una legenda
// ---------------------------------------------------------------------------------------------

interface IndexRegion {
  course: CourseId
  group: { sheets: SheetGroup[] } | undefined
  count: number
}

function SheetIndex({ regions, shown }: { regions: IndexRegion[]; shown: ReadonlySet<string> }) {
  const listed = regions.filter((r) => r.count > 0 && r.group)
  if (listed.length === 0) return <div className="hidden @4xl:block" />
  return (
    <nav aria-label="Indice del formulario" className="hidden @4xl:block print:hidden">
      <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain border-t-2 border-border-strong pt-3">
        <p className="label m-0">Indice</p>
        {listed.map((r) => (
          <div key={r.course} className="mt-4">
            <p className="m-0 flex items-center gap-2 font-label font-bold">
              <RegionSwatch course={r.course} />
              {REGIONS[r.course].name}
            </p>
            <ul role="list" className="m-0 mt-1 list-none p-0">
              {r.group!.sheets.map((s) => {
                const n = s.entries.filter((e) => shown.has(e.key)).length
                if (n === 0) return null
                return (
                  <li key={s.moduleId} className="m-0">
                    <a
                      href={`#${sheetAnchor(s.moduleId)}`}
                      className="grid min-h-10 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-2 px-1 py-2 text-[length:var(--step--1)] leading-snug text-text no-underline transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2"
                    >
                      <span className="num text-muted">{s.number}</span>
                      <span>{s.title}</span>
                      <span className="num text-muted">{n}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}

