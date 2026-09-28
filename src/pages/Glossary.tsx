// Glossario (/glossario): i termini di tutti i fogli pronti in un dizionario italiano ↔ inglese. Le voci dello
// stesso concetto (stesso inglese a meno di parentesi e trattini, oppure stesso italiano) diventano una sola, con
// le altre grafie, la definizione di ogni foglio in cui compaiono e il collegamento al foglio (la sua scheda
// Riassunto, dove sta il lessico). ?q=… nell'indirizzo è la ricerca iniziale (la usa la ricerca dell'atlante). Indice alfabetico sempre in
// vista, ricerca nei termini italiani e inglesi, filtro per regione, ordine per italiano o per inglese. La logica
// (fusione, ordine, iniziali, ricerca) è in lib/glossary.ts.
//
// Connettori consultati (Magic UI, ui-layouts): nessun indice alfabetico né elenco filtrabile; si scrive qui, sui
// token del foglio. Un'ancora #termine:<slug> porta alla voce; #lettera-<L> alla lettera.
import { memo, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useLocation, useSearchParams } from 'react-router'
import { Rich } from '../components/content/Rich'
import { BTN_SECONDARY, BTN_TOGGLE, FLOW, HATCH, Icon } from '../components/content/shared'
import { RegionSwatch } from '../components/layout/marks'
import { RegionFilter } from '../components/layout/RegionFilter'
import { SettledStatus } from '../components/ui/SettledStatus'
import { getModuleMeta, manifest } from '../content/manifest'
import type { CourseId } from '../content/types'
import { REGION_ORDER, REGIONS, sheetNumber } from '../lib/atlas'
import { ALPHABET, filterGlossary, headword, mergeGlossary, OTHER_INITIAL, sectionsByInitial, sortGlossary, termAnchor } from '../lib/glossary'
import type { GlossaryFilters, GlossaryOrder, GlossarySection, GlossaryTerm } from '../lib/glossary'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { DeferredMount } from './reference/DeferredMount'
import { MountAllContext } from './reference/mountAll'
import { FailedSheets, ReferenceHeader, SearchGlyph, SheetsLoading } from './reference/parts'
import { PrintSheet } from './reference/PrintSheet'
import { pendingSheets, sheetRanges } from './reference/sheets'
import { FILTER_LABEL, PAGE, SEARCH_INPUT } from './reference/ui'
import { useReadySheets } from './reference/useReadySheets'

const NO_FILTERS: GlossaryFilters = { query: '', course: null }

/** Id della sezione di una lettera: # non sta bene in un'ancora. */
const letterAnchor = (letter: string) => `lettera-${letter === OTHER_INITIAL ? 'altri' : letter}`
const OTHER_NAME = 'Cifre e simboli'

// ---------------------------------------------------------------------------------------------
// Una voce e una lettera. Filtrare nasconde e non smonta: le definizioni non si ricalcolano a ogni tasto.
// ---------------------------------------------------------------------------------------------

// il contenuto della voce non dipende dai filtri: memo a parte, così cambiare `hidden` non ridisegna la voce
const TermBody = memo(function TermBody({ term, order }: { term: GlossaryTerm; order: GlossaryOrder }) {
  const english = order === 'en'
  const main = headword(term, order)
  const other = english ? term.it[0] : term.en
  const alternates = term.it.slice(1)
  return (
    <>
      <dt className="m-0 min-w-0">
        <span data-headword="" lang={english ? 'en' : undefined} className={`block font-label text-[length:var(--step-1)] leading-snug font-bold ${english ? 'italic' : ''}`}>
          {main}
        </span>
        {other && (
          <span lang={english ? undefined : 'en'} className={`mt-0.5 block text-muted ${english ? '' : 'italic'}`}>
            {other}
          </span>
        )}
        {alternates.length > 0 && <span className="mt-1 block text-[length:var(--step--1)] text-muted">anche: {alternates.join(', ')}</span>}
        {term.enAlt.length > 0 && (
          <span className="mt-1 block text-[length:var(--step--1)] text-muted">
            <span lang="en">also</span>:{' '}
            {term.enAlt.map((en, i) => (
              <span key={en}>
                {i > 0 && ', '}
                <span lang="en" className="italic">
                  {en}
                </span>
              </span>
            ))}
          </span>
        )}
      </dt>
      <dd className="m-0 grid min-w-0 gap-4">
        {term.sightings.map((s) => (
          <div key={s.moduleId} className="grid justify-items-start gap-2">
            <Rich text={s.def} className={`${FLOW} max-w-[var(--measure)]`} />
            <Link
              to={`/m/${s.moduleId}/riassunto`}
              className="inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-2 text-[length:var(--step--1)] text-text no-underline transition-[border-color,background-color] duration-[var(--dur-fast)] ease-out hover:border-border-strong hover:bg-surface-2 print:min-h-0 print:border-0 print:px-0"
            >
              <RegionSwatch course={s.course} />
              <span className="num whitespace-nowrap">Foglio {sheetNumber(s.moduleId)}</span> · {getModuleMeta(s.moduleId)?.title ?? s.moduleId}
            </Link>
          </div>
        ))}
      </dd>
    </>
  )
})

const TermEntry = memo(function TermEntry({ term, order, hidden }: { term: GlossaryTerm; order: GlossaryOrder; hidden: boolean }) {
  return (
    <div
      data-term=""
      id={termAnchor(term.en)}
      hidden={hidden}
      className="grid scroll-mt-6 gap-x-8 gap-y-3 border-b border-border py-5 [contain-intrinsic-size:auto_9rem] [content-visibility:auto] print:[content-visibility:visible] @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] print:break-inside-avoid"
    >
      <TermBody term={term} order={order} />
    </div>
  )
})

const LetterSection = memo(function LetterSection({
  section,
  order,
  shown,
  target,
}: {
  section: GlossarySection
  order: GlossaryOrder
  shown: ReadonlySet<string>
  target: string | null
}) {
  const headingId = useId()
  const count = section.terms.reduce((n, t) => n + (shown.has(t.key) ? 1 : 0), 0)
  const anchor = letterAnchor(section.letter)
  // l'ancora dell'indirizzo punta a questa lettera o a una sua voce: si monta subito
  const wanted = target !== null && (target === anchor || section.terms.some((t) => termAnchor(t.en) === target))
  const other = section.letter === OTHER_INITIAL
  return (
    <section id={anchor} aria-labelledby={headingId} hidden={count === 0} className="scroll-mt-6">
      <div className="flex items-end gap-4 border-b-2 border-border-strong pb-1 print:break-after-avoid">
        <h2 id={headingId} className="m-0 font-display text-[length:var(--step-4)] leading-none font-extrabold uppercase">
          {other ? (
            <>
              <span aria-hidden="true">#</span>
              <span className="visually-hidden">{OTHER_NAME}</span>
            </>
          ) : (
            section.letter
          )}
        </h2>
        <p className="m-0 pb-1 text-[length:var(--step--1)] text-muted">
          <span className="num text-text">{count}</span> {count === 1 ? 'termine' : 'termini'}
          {other && ' · cifre, simboli, lettere greche'}
        </p>
      </div>
      <DeferredMount estimate={`${section.terms.length * 9}rem`} force={wanted}>
        <dl className="m-0">
          {section.terms.map((t) => (
            <TermEntry key={t.key} term={t} order={order} hidden={!shown.has(t.key)} />
          ))}
        </dl>
      </DeferredMount>
    </section>
  )
})

// ---------------------------------------------------------------------------------------------
// Indice alfabetico: sempre in vista sotto la barra; le lettere senza voci restano in grigio, non si premono
// ---------------------------------------------------------------------------------------------

function AlphabetIndex({ letters }: { letters: ReadonlySet<string> }) {
  return (
    <nav
      aria-label="Indice alfabetico"
      className="sticky top-14 z-20 -mx-[var(--sheet-gutter)] mt-8 border-y border-border-strong bg-bg px-[var(--sheet-gutter)] @5xl:px-2 print:hidden"
    >
      {/* una riga sola: sugli schermi stretti scorre di lato, su quelli larghi le lettere si distribuiscono */}
      <ul role="list" className="m-0 flex list-none overflow-x-auto overscroll-x-contain p-0 @5xl:justify-between">
        {[...ALPHABET, OTHER_INITIAL].map((letter) => (
          <li key={letter} className="m-0 shrink-0">
            {letters.has(letter) ? (
              <a
                href={`#${letterAnchor(letter)}`}
                title={letter === OTHER_INITIAL ? OTHER_NAME : `Termini con la ${letter}`}
                className="grid size-10 place-items-center font-display text-[1.4rem] leading-none font-extrabold text-text no-underline transition-[background-color,color] duration-[var(--dur-fast)] ease-out hover:bg-accent hover:text-accent-contrast"
              >
                {letter === OTHER_INITIAL ? (
                  <>
                    <span aria-hidden="true">#</span>
                    <span className="visually-hidden">{OTHER_NAME}</span>
                  </>
                ) : (
                  letter
                )}
              </a>
            ) : (
              <span aria-hidden="true" className="grid size-10 place-items-center font-display text-[1.4rem] leading-none font-extrabold text-faint opacity-50">
                {letter}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ---------------------------------------------------------------------------------------------
// La pagina
// ---------------------------------------------------------------------------------------------

export default function Glossary() {
  useDocumentTitle('Glossario')
  const { sheets, retry, retrying } = useReadySheets()
  const { hash } = useLocation()
  const [params] = useSearchParams()
  // ?q= è la ricerca di partenza: la palette porta qui con "Cerca «…» nel glossario"
  const [filters, setFilters] = useState<GlossaryFilters>(() => ({ ...NO_FILTERS, query: params.get('q') ?? '' }))
  const [order, setOrder] = useState<GlossaryOrder>('it')
  const [mountAll, setMountAll] = useState(false)
  const searchId = useId()
  const regionId = useId()
  const orderLabel = useId()
  const search = useRef<HTMLInputElement>(null)

  const modules = useMemo(() => (sheets.status === 'ready' ? sheets.modules : []), [sheets])
  const readyIds = useMemo(() => new Set(modules.map((m) => m.id)), [modules])
  const terms = useMemo(() => mergeGlossary(modules), [modules])
  const sections = useMemo(() => sectionsByInitial(sortGlossary(terms, order), order), [terms, order])
  // il campo segue il tasto subito; l'elenco lo rincorre senza bloccarlo
  const deferred = useDeferredValue(filters)
  const shown = useMemo(() => filterGlossary(terms, deferred), [terms, deferred])
  const shownKeys = useMemo(() => new Set(shown.map((t) => t.key)), [shown])
  const letters = useMemo(() => new Set(sections.filter((s) => s.terms.some((t) => shownKeys.has(t.key))).map((s) => s.letter)), [sections, shownKeys])
  const byCourse = useMemo(() => {
    const counts = { all: 0 } as Record<CourseId | 'all', number>
    counts.all = filterGlossary(terms, { ...deferred, course: null }).length
    for (const c of REGION_ORDER) counts[c] = filterGlossary(terms, { ...deferred, course: c }).length
    return counts
  }, [terms, deferred])
  const shared = terms.filter((t) => t.sightings.length > 1).length
  const pending = pendingSheets(filters.course, readyIds)

  let target: string | null = null
  try {
    target = hash ? decodeURIComponent(hash.slice(1)) : null
  } catch {
    // ancora malformata: si resta in cima
  }
  const ready = sheets.status === 'ready'
  useEffect(() => {
    if (!ready || !target) return
    // scrollIntoView manca in jsdom e nei browser molto vecchi
    document.getElementById(target)?.scrollIntoView?.({ block: 'start' })
  }, [ready, target])

  const query = filters.query.trim()
  const active = query !== '' || filters.course !== null
  const printAll = () => flushSync(() => setMountAll(true))
  // "Azzera i filtri" sparisce premendolo: il fuoco torna nel campo di ricerca, che c'è sempre
  const resetFilters = () => {
    setFilters(NO_FILTERS)
    search.current?.focus()
  }
  const countText = `${shown.length} ${shown.length === 1 ? 'termine' : 'termini'} su ${terms.length}`

  return (
    <main data-print-page="" className={PAGE}>
      <PrintSheet onBeforePrint={printAll} />
      <ReferenceHeader
        title="Glossario"
        titleEn="Glossary · Italian and English"
        lead="I termini tecnici dei fogli pronti in italiano e in inglese, con la definizione di ogni foglio in cui compaiono: all'orale li dirai in inglese."
        stats={[
          { label: 'Termini', value: ready ? terms.length : '…' },
          { label: 'In più fogli', value: ready ? shared : '…' },
          { label: 'Fogli pronti', value: ready ? `${modules.length} di ${manifest.length}` : '…' },
        ]}
      />

      {sheets.status === 'loading' ? (
        <SheetsLoading what="Raccolgo i termini dai fogli pronti…" />
      ) : (
        <>
          <FailedSheets failed={sheets.failed} noun="voci" onRetry={retry} retrying={retrying} />

          {terms.length === 0 ? (
            <p className="m-0 mt-8 max-w-[var(--measure)] text-muted">
              Il glossario cresce con i fogli: per ora nessun foglio pronto ha ancora un glossario. I termini arriveranno insieme ai fogli, già in italiano e in inglese.
            </p>
          ) : (
            <section aria-label="Filtri del glossario" className="@container mt-8 border border-border-strong bg-surface print:hidden">
              <div className="grid grid-cols-1 gap-4 border-b border-border p-4 @3xl:px-5">
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor={searchId} className="label m-0 text-text">
                    Cerca un termine
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
                      onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                      placeholder="In italiano o in inglese: finestra, bandwidth"
                      className={SEARCH_INPUT}
                    />
                    {filters.query !== '' && (
                      <button
                        type="button"
                        aria-label="Svuota la ricerca"
                        title="Svuota la ricerca"
                        onClick={() => {
                          setFilters({ ...filters, query: '' })
                          search.current?.focus()
                        }}
                        className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 cursor-pointer place-items-center text-muted transition-colors duration-[var(--dur-fast)] ease-out hover:text-text"
                      >
                        <Icon name="cross" size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <RegionFilter id={regionId} value={filters.course} onChange={(course) => setFilters({ ...filters, course })} counts={byCourse} inline />

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <p id={orderLabel} className={FILTER_LABEL}>
                    Ordina per
                  </p>
                  <div role="group" aria-labelledby={orderLabel} className="flex flex-wrap gap-2">
                    <button type="button" aria-pressed={order === 'it'} onClick={() => setOrder('it')} className={BTN_TOGGLE}>
                      Italiano
                    </button>
                    <button type="button" lang="en" aria-pressed={order === 'en'} onClick={() => setOrder('en')} className={BTN_TOGGLE}>
                      English
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 px-4 py-3 @3xl:px-5">
                {/* il conteggio a vista segue ogni tasto; quello annunciato arriva a scrittura ferma */}
                <p aria-hidden="true" className="m-0 text-muted">
                  <span className="num text-[length:var(--step-1)] text-text">{shown.length}</span> {shown.length === 1 ? 'termine' : 'termini'} su{' '}
                  <span className="num">{terms.length}</span>
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
                </div>
              </div>
            </section>
          )}

          {pending.length > 0 && (
            <p className={`m-0 mt-6 border border-border p-3 text-[length:var(--step--1)] print:hidden ${HATCH}`}>
              <span className="bg-surface px-1 leading-7 text-muted [box-decoration-break:clone]">
                {filters.course !== null && pending.length === manifest.filter((m) => m.course === filters.course).length
                  ? `Nessun foglio di ${REGIONS[filters.course].name} è ancora pronto: i suoi termini arriveranno con i fogli `
                  : 'Ancora in preparazione, e quindi non ancora qui: fogli '}
                <span className="num text-text">{sheetRanges(pending.map((m) => m.id))}</span>.
              </span>
            </p>
          )}

          {terms.length > 0 && (
            <>
              <AlphabetIndex letters={letters} />

              {shown.length === 0 && (
                <div className="mt-8 grid max-w-[var(--measure)] justify-items-start gap-3">
                  <p className="m-0 text-muted">{query !== '' ? `Nessun termine risponde a «${query}» con questi filtri.` : 'Nessun termine con questi filtri.'}</p>
                  <button type="button" onClick={resetFilters} className={BTN_SECONDARY}>
                    <Icon name="reset" size={18} />
                    Azzera i filtri
                  </button>
                </div>
              )}

              <MountAllContext value={mountAll}>
                <div className="mt-8 grid max-w-[64rem] grid-cols-1 gap-12">
                  {sections.map((s) => (
                    <LetterSection key={`${order}-${s.letter}`} section={s} order={order} shown={shownKeys} target={target} />
                  ))}
                </div>
              </MountAllContext>
            </>
          )}
        </>
      )}
    </main>
  )
}
