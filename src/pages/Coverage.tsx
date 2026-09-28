// Copertura (/copertura): la prova visibile che nulla è stato perso. Per ogni foglio pronto, i concetti del suo
// inventario (estratti pagina per pagina dalle fonti) con le pagine da cui vengono e le destinazioni che la
// `coverage` del foglio dichiara, ciascuna come collegamento al punto dell'atlante che la spiega. In testa i
// totali per regione e la frase che conta: se qualche concetto dei fogli pronti non ha destinazioni, lo dice e
// lo mostra con un clic. I fogli non ancora pronti mostrano quanti concetti l'inventario ha già contato.
// Filtri: regione, destinazione mancante (senza widget, senza domanda d'orale, …) e ricerca per nome.
// Connettori consultati (Magic UI, ui-layouts: "table", "accordion", "filter"): tabelle con righe a zebra e
// fisarmoniche con animazione d'altezza. Si tiene la semantica (tabella vera con caption, pulsante con
// aria-expanded nel titolo del foglio, select e campo di ricerca nativi), l'aspetto è quello del registro.
import { Fragment, useDeferredValue, useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Rich } from '../components/content/Rich'
import { BTN_SECONDARY, HATCH, Icon } from '../components/content/shared'
import { RegionSwatch } from '../components/layout/marks'
import { manifest } from '../content/manifest'
import type { ModuleManifestEntry } from '../content/manifest'
import { hasModule } from '../content/registry'
import type { CourseId, ModuleData } from '../content/types'
import { DOCS, pageLabel, REGION_ORDER, REGIONS, sheetNumber } from '../lib/atlas'
import { conceptRows, GROUP_LABEL, KIND_LABEL, matchesQuery, matchesView, regionTotals, sheetTotals, TARGET_GROUPS } from '../lib/coverage'
import type { ConceptRow, CoverageIndex, CoverageView, IndexModule } from '../lib/coverage'
import { coverageIndex, sectionTitle } from '../lib/coverageIndex'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { useReadyModules } from '../lib/useReadyModules'
import { RegionFilter } from '../components/layout/RegionFilter'
import { SettledStatus } from '../components/ui/SettledStatus'
import { PageHead, Reading, SectionHead } from './global/PageHead'
import { FIELD, NUM_CELL, PAGE, SELECT, TABLE, TH } from './global/ui'


/** Voci del filtro "Mostra": che cosa manca al concetto. */
const VIEWS: { value: CoverageView; label: string; none: string }[] = [
  { value: 'tutti', label: 'Tutti i concetti', none: 'Nessun concetto corrisponde alla ricerca.' },
  { value: 'non-tracciati', label: 'Senza destinazioni', none: 'Nessun concetto senza destinazioni: nei fogli pronti non si è perso nulla.' },
  { value: 'rotte', label: 'Con destinazioni rotte', none: 'Nessuna destinazione rotta: ogni collegamento porta a qualcosa che esiste.' },
  { value: 'teoria', label: 'Senza sezione di teoria', none: 'Ogni concetto ha la sua sezione di teoria.' },
  { value: 'formule', label: 'Senza formula né dimostrazione', none: 'Ogni concetto ha almeno una formula o una dimostrazione.' },
  { value: 'widget', label: 'Senza widget', none: 'Ogni concetto ha il suo widget, o il motivo per cui non ne ha.' },
  { value: 'figure', label: 'Senza figura', none: 'Ogni concetto ha almeno una figura.' },
  { value: 'quiz', label: 'Senza quiz', none: 'Ogni concetto ha almeno un quiz.' },
  { value: 'flashcard', label: 'Senza flashcard', none: 'Ogni concetto ha almeno una flashcard.' },
  { value: 'orale', label: "Senza domanda d'orale", none: "Ogni concetto ha almeno una domanda d'orale." },
  { value: 'esercizi', label: 'Senza esercizio', none: 'Ogni concetto ha almeno un esercizio.' },
]

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// ---------------------------------------------------------------------------------------------
// Dati della pagina
// ---------------------------------------------------------------------------------------------

type Sheet =
  | { meta: ModuleManifestEntry; status: 'ready'; data: ModuleData; inventory: IndexModule | undefined; rows: ConceptRow[] }
  | { meta: ModuleManifestEntry; status: 'error' }

function useSheets(index: CoverageIndex) {
  const { loading, sheets, retry } = useReadyModules()
  const ready = useMemo<Sheet[]>(
    () =>
      sheets.flatMap((s): Sheet[] => {
        const meta = manifest.find((m) => m.id === s.id)
        if (!meta) return []
        if (s.status === 'error') return [{ meta, status: 'error' }]
        const inventory = index.modules[s.id]
        return [{ meta, status: 'ready', data: s.data, inventory, rows: inventory ? conceptRows(s.data, inventory, sectionTitle, hasModule) : [] }]
      }),
    [sheets, index],
  )
  return { loading, ready, retry }
}

// ---------------------------------------------------------------------------------------------
// Pezzi
// ---------------------------------------------------------------------------------------------

function RegionTable({ index, rows }: { index: CoverageIndex; rows: ReadonlyMap<string, readonly ConceptRow[]> }) {
  const totals = REGION_ORDER.map((c) => ({ ...regionTotals(c, index, rows), readySheets: manifest.filter((m) => m.course === c && hasModule(m.id)).length }))
  const sum = (k: 'sheets' | 'readySheets' | 'inventoried' | 'readyConcepts' | 'tracked' | 'destinations') => totals.reduce((n, t) => n + t[k], 0)
  const tracked = (t: number, of: number) => (of > 0 ? `${t} di ${of}` : '—')

  return (
    <div className="relative mt-4 overflow-x-auto overscroll-x-contain" tabIndex={0} role="region" aria-label="Totali per regione, scorrevole">
      <table className={`${TABLE} min-w-[34rem]`}>
        <caption className="visually-hidden">Totali per regione</caption>
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Regione
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Fogli pronti
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Concetti inventariati
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Tracciati nei fogli pronti
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Destinazioni
            </th>
          </tr>
        </thead>
        <tbody>
          {totals.map((t) => (
            <tr key={t.course}>
              <th scope="row" className="border-t border-border px-3 py-2 font-normal">
                <span className="flex items-center gap-2 font-display text-[length:var(--step-1)] leading-none font-extrabold uppercase">
                  <RegionSwatch course={t.course} />
                  {REGIONS[t.course].name}
                </span>
              </th>
              <td className={NUM_CELL}>
                {t.readySheets} di {t.sheets}
              </td>
              <td className={NUM_CELL}>
                {t.inventoried}
                <span className="block text-muted">{t.withInventory === t.sheets ? 'tutti i fogli' : `${t.withInventory} di ${t.sheets} fogli`}</span>
              </td>
              <td className={NUM_CELL}>{tracked(t.tracked, t.readyConcepts)}</td>
              <td className={NUM_CELL}>{t.destinations > 0 ? t.destinations : '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <th scope="row" className="label border-t-2 border-border-strong px-3 py-2 text-text">
              Atlante
            </th>
            <td className={`${NUM_CELL} border-t-2! border-border-strong!`}>
              {sum('readySheets')} di {sum('sheets')}
            </td>
            <td className={`${NUM_CELL} border-t-2! border-border-strong!`}>{sum('inventoried')}</td>
            <td className={`${NUM_CELL} border-t-2! border-border-strong!`}>{tracked(sum('tracked'), sum('readyConcepts'))}</td>
            <td className={`${NUM_CELL} border-t-2! border-border-strong!`}>{sum('destinations') || '—'}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/** La frase che conta: nulla è perso, oppure quanti concetti mancano, con il modo di vederli. */
function Verdict({ ready, onShowMissing }: { ready: Sheet[]; onShowMissing: () => void }) {
  const loaded = ready.filter((s) => s.status === 'ready')
  const failed = ready.length - loaded.length
  const rows = loaded.flatMap((s) => s.rows)
  const missing = rows.filter((r) => !r.tracked).length
  const noInventory = loaded.filter((s) => !s.inventory).length
  if (ready.length === 0) {
    return <p className="m-0 mt-6 max-w-[var(--measure)] text-muted">Nessun foglio è ancora pronto: il registro si compila man mano che i fogli arrivano.</p>
  }
  const caveat = [failed > 0 ? plural(failed, 'foglio pronto non si è caricato', 'fogli pronti non si sono caricati') : '', noInventory > 0 ? plural(noInventory, 'foglio pronto non ha l\'inventario nell\'indice', 'fogli pronti non hanno l\'inventario nell\'indice') : '']
    .filter(Boolean)
    .join('; ')

  if (missing === 0) {
    return (
      <div className="mt-6 flex flex-wrap items-start gap-3 border-2 border-border-strong bg-ok-bg p-4">
        <Icon name="check" className="mt-0.5 text-ok" />
        <p className="m-0 min-w-0 flex-1 basis-64">
          <strong>Nulla è perso.</strong> {`Nei fogli pronti ciascuno dei ${rows.length} concetti dell'inventario ha almeno una destinazione nell'atlante.`}
          {caveat && <span className="block text-muted">{`Da verificare: ${caveat}.`}</span>}
        </p>
      </div>
    )
  }
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-2 border-border-strong bg-error-bg p-4">
      <Icon name="warning" className="text-error" />
      <p className="m-0 min-w-0 flex-1 basis-64">{`${plural(missing, 'concetto dei fogli pronti non ha destinazioni', 'concetti dei fogli pronti non hanno destinazioni')}: nell'atlante non c'è ancora il posto che lo spiega.`}</p>
      <button type="button" className={BTN_SECONDARY} onClick={onShowMissing}>
        {missing === 1 ? 'Mostralo' : 'Mostrali'}
      </button>
    </div>
  )
}

/** La barra dei concetti del foglio: un tassello per concetto, pieno se tracciato. Decorativa. */
function Strip({ rows, course }: { rows: readonly ConceptRow[]; course: CourseId }) {
  if (rows.length === 0) return null
  return (
    <span aria-hidden="true" className="mt-1 flex h-2 w-full max-w-lg gap-px border border-border-strong bg-border-strong">
      {rows.map((r) => (
        <span key={r.concept.id} className={`min-w-px flex-1 ${r.tracked ? REGIONS[course].fill : 'bg-surface'}`} />
      ))}
    </span>
  )
}

function SourceLinks({ pages }: { pages: IndexModule['concepts'][number]['pages'] }) {
  return (
    <p className="m-0 mt-1 text-[length:var(--step--1)] leading-relaxed">
      <span className="label mr-2">Fonti</span>
      {pages.map(([doc, page], i) => (
        <Fragment key={`${doc}-${page}`}>
          {i > 0 && ', '}
          {DOCS[doc] ? (
            <Link to={`/fonti/${doc}/${page}`} className="whitespace-nowrap">
              {`${DOCS[doc].short} · ${pageLabel(doc, page)}`}
            </Link>
          ) : (
            <span className="num">{`${doc} ${page}`}</span>
          )}
        </Fragment>
      ))}
    </p>
  )
}

function ConceptItem({ row }: { row: ConceptRow }) {
  const { concept, destinations } = row
  const groups = TARGET_GROUPS.filter((g) => destinations.some((d) => d.group === g && !d.broken && !d.pending))
  const broken = destinations.filter((d) => d.broken)
  const pending = destinations.filter((d) => d.pending)
  const noWidget = concept.noWidget && !row.groups.has('widget') ? concept.noWidget : null

  return (
    <li className="m-0 grid gap-x-10 gap-y-3 border-t border-border px-4 py-5 @4xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
      <div className="grid content-start gap-1">
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[length:var(--step--1)]">
          <span className="num text-muted">{concept.id}</span>
          <span className="label">{KIND_LABEL[concept.kind] ?? concept.kind}</span>
          {concept.exam === 3 && (
            <span className="label inline-flex items-center gap-1 bg-pin px-1.5 text-pin-contrast">
              <Icon name="pin" size={14} />
              Da orale
            </span>
          )}
        </p>
        <h4 className="m-0 font-label text-[length:var(--step-1)] leading-snug font-bold">{concept.name}</h4>
        {concept.nameEn && (
          <p lang="en" className="m-0 text-[length:var(--step--1)] text-muted italic">
            {concept.nameEn}
          </p>
        )}
        <SourceLinks pages={concept.pages} />
      </div>

      <div className="min-w-0">
        {!row.tracked && (
          <p className="m-0 flex items-start gap-2 border border-border-strong bg-error-bg p-3">
            <Icon name="cross" className="mt-0.5 text-error" />
            <span>Nessuna destinazione: questo concetto dell'inventario non è ancora nell'atlante.</span>
          </p>
        )}
        {(groups.length > 0 || noWidget) && (
          <dl className="m-0 grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] gap-x-4 gap-y-2.5">
            {groups.map((g) => (
              <Fragment key={g}>
                <dt className="label pt-0.5">{GROUP_LABEL[g]}</dt>
                <dd className="m-0 min-w-0">
                  <ul role="list" className="m-0 grid list-none gap-1 p-0">
                    {destinations
                      .filter((d) => d.group === g && !d.broken && !d.pending)
                      .map((d) => (
                        <li key={d.target} className="m-0 min-w-0">
                          <Link to={d.href} className="line-clamp-2 text-[length:var(--step--1)] leading-snug">
                            {d.rich ? <Rich text={d.label} inline /> : d.label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </dd>
              </Fragment>
            ))}
            {noWidget && (
              <>
                <dt className="label pt-0.5">{GROUP_LABEL.widget}</dt>
                <dd className="m-0 text-[length:var(--step--1)] text-muted">Nessun widget, per scelta: {noWidget}</dd>
              </>
            )}
          </dl>
        )}
        {pending.length > 0 && (
          <ul role="list" className="m-0 mt-3 grid list-none gap-1 p-0 text-[length:var(--step--1)] text-muted">
            {pending.map((d) => (
              <li key={d.target} className="m-0 flex items-start gap-2">
                <Icon name="tripod" size={16} className="mt-0.5" />
                <span>
                  In attesa: {d.rich ? <Rich text={d.label} inline /> : d.label}. Il foglio è in preparazione: il rimando si verifica quando arriva.
                </span>
              </li>
            ))}
          </ul>
        )}
        {broken.length > 0 && (
          <ul role="list" className="m-0 mt-3 grid list-none gap-1 p-0 text-[length:var(--step--1)]">
            {broken.map((d) => (
              <li key={d.target} className="m-0 flex items-start gap-2">
                <Icon name="warning" size={16} className="mt-0.5 text-warn" />
                <span>
                  Destinazione rotta: <code>{d.target}</code> non esiste nei dati del foglio.
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

function SheetBlock({ sheet, shown, filtering, open, onToggle }: { sheet: Extract<Sheet, { status: 'ready' }>; shown: ConceptRow[]; filtering: boolean; open: boolean; onToggle: () => void }) {
  const uid = useId()
  const { meta, rows, inventory } = sheet
  const region = REGIONS[meta.course]
  const t = sheetTotals(rows)

  return (
    <section aria-labelledby={`${uid}-titolo`} className="-mt-px border border-border-strong bg-surface">
      <h3 id={`${uid}-titolo`} className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${uid}-pannello`}
          onClick={onToggle}
          className="grid min-h-16 w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-stretch text-left text-text transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2"
        >
          <span className={`${region.field} grid min-w-16 place-items-center px-3 py-2 font-display text-[length:var(--step-3)] leading-none font-extrabold`}>
            <span className="visually-hidden">Foglio</span> {sheetNumber(meta.id)}
          </span>
          <span className="grid content-center gap-1 px-4 py-3">
            <span className="font-label text-[length:var(--step-1)] leading-snug font-bold">{sheet.data.title}</span>
            <span className="num text-[length:var(--step--1)] text-muted">
              {plural(t.concepts, 'concetto', 'concetti')} · {t.tracked} tracciati · {plural(t.destinations, 'destinazione', 'destinazioni')}
              {filtering && ` · ${shown.length} mostrati`}
            </span>
            <Strip rows={rows} course={meta.course} />
          </span>
          <span aria-hidden="true" className="grid place-items-center px-4">
            <Icon name="chevron" size={18} className={`transition-[rotate] duration-[var(--dur-fast)] ease-out ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </h3>
      <div id={`${uid}-pannello`} hidden={!open}>
        {open && (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-strong px-4 py-2 text-[length:var(--step--1)]">
              <p className="m-0 min-w-0 flex-1 text-muted">
                {!inventory
                  ? "L'inventario di questo foglio non è nell'indice della copertura: va rigenerato con lo script build-coverage-index."
                  : inventory.complete
                    ? 'Inventario completo: tutti gli stadi di estrazione sono chiusi.'
                    : 'Inventario in corso: altri concetti possono ancora arrivare.'}
              </p>
              <Link to={`/m/${meta.id}`} className="label inline-flex min-h-10 items-center gap-2 text-link">
                Apri il foglio
                <span className="visually-hidden">{` ${sheetNumber(meta.id)}`}</span>
                <Icon name="arrow" size={16} />
              </Link>
            </div>
            <ol role="list" className="m-0 list-none p-0">
              {shown.map((r) => (
                <ConceptItem key={r.concept.id} row={r} />
              ))}
            </ol>
          </>
        )}
      </div>
    </section>
  )
}

function FailedSheet({ meta, onRetry }: { meta: ModuleManifestEntry; onRetry: () => void }) {
  return (
    <div className="-mt-px flex flex-wrap items-center gap-3 border border-border-strong bg-error-bg p-4">
      <Icon name="cross" className="text-error" />
      <p className="m-0 min-w-0 flex-1 basis-64">{`Foglio ${sheetNumber(meta.id)} · ${meta.title}: i contenuti non si sono caricati. Riprova; se non basta, ricarica la pagina.`}</p>
      <button type="button" className={BTN_SECONDARY} onClick={onRetry}>
        <Icon name="reset" size={18} />
        Riprova
      </button>
    </div>
  )
}

function preparingNote(inv: IndexModule | undefined): string {
  if (!inv) return 'Inventario da fare'
  const n = inv.concepts.length
  return inv.complete ? plural(n, 'concetto inventariato', 'concetti inventariati') : `Inventario in corso · ${plural(n, 'concetto', 'concetti')} finora`
}

function Preparing({ sheets, index }: { sheets: ModuleManifestEntry[]; index: CoverageIndex }) {
  return (
    <section aria-labelledby="in-preparazione" className="mt-14">
      <SectionHead id="in-preparazione" title="Fogli in preparazione" en="Sheets in preparation" />
      <p className="m-0 mt-2 max-w-[var(--measure)] text-muted">Il registro di questi fogli si compila quando sono pronti. Intanto l'inventario dice quanti concetti delle fonti dovranno coprire.</p>
      {sheets.length === 0 ? (
        <p className="m-0 mt-4 text-muted">Nessun foglio in preparazione in questa regione.</p>
      ) : (
        <ul role="list" className="m-0 mt-4 grid list-none p-0 pt-px pl-px @3xl:grid-cols-2 @7xl:grid-cols-3">
          {sheets.map((meta) => (
            <li key={meta.id} className="m-0 -mt-px -ml-px">
              <Link
                to={`/m/${meta.id}`}
                className="grid h-full grid-cols-[auto_minmax(0,1fr)] border border-border-strong bg-bg text-text no-underline transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2"
              >
                <span className={`relative grid min-w-14 place-items-center border-r border-border-strong ${HATCH}`}>
                  <span className="num bg-bg px-1 text-[length:var(--step-1)]">
                    <span className="visually-hidden">Foglio</span> {sheetNumber(meta.id)}
                  </span>
                </span>
                <span className="grid content-center gap-0.5 px-3 py-2.5">
                  <span className="flex items-center gap-2 font-label leading-snug font-bold">
                    <RegionSwatch course={meta.course} size={12} />
                    {meta.title}
                  </span>
                  <span className="num text-[length:var(--step--1)] text-muted">{preparingNote(index.modules[meta.id])}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------------------------

export default function Coverage() {
  useDocumentTitle('Copertura')
  const index = coverageIndex
  const uid = useId()
  const { loading, ready, retry } = useSheets(index)
  // null: tutte le regioni (il filtro comune delle pagine globali, RegionFilter)
  const [region, setRegion] = useState<CourseId | null>(null)
  const [view, setView] = useState<CoverageView>('tutti')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const filtering = view !== 'tutti' || deferredQuery.trim() !== ''

  // Aperto/chiuso per foglio; cambiando filtro si riparte. Senza filtri i fogli partono chiusi (un foglio aperto
  // è lungo decine di schermi e spingerebbe in fondo il resto); filtrando, quelli con risultati si aprono da soli.
  const filterKey = `${region}|${view}|${deferredQuery}`
  const [openState, setOpenState] = useState<{ key: string; map: Record<string, boolean> }>({ key: filterKey, map: {} })
  const openMap = openState.key === filterKey ? openState.map : {}

  const rowsById = useMemo(() => new Map(ready.flatMap((s) => (s.status === 'ready' ? [[s.meta.id, s.rows] as const] : []))), [ready])
  const inRegion = (m: ModuleManifestEntry) => region === null || m.course === region
  const visible = ready.filter((s) => inRegion(s.meta))
  const regionRows = visible.flatMap((s) => (s.status === 'ready' ? s.rows : []))
  const shownOf = (rows: ConceptRow[]) => rows.filter((r) => matchesView(r, view) && matchesQuery(r, deferredQuery))
  const shownCount = visible.reduce((n, s) => n + (s.status === 'ready' ? shownOf(s.rows).length : 0), 0)
  const preparing = manifest.filter((m) => inRegion(m) && !hasModule(m.id))

  const totalInventoried = Object.values(index.modules).reduce((n, m) => n + m.concepts.length, 0)
  const allRows = ready.flatMap((s) => (s.status === 'ready' ? s.rows : []))
  const readyCount = manifest.filter((m) => hasModule(m.id)).length

  const status = !filtering
    ? `${plural(regionRows.length, 'concetto', 'concetti')} in ${plural(visible.length, 'foglio pronto', 'fogli pronti')}, ${regionRows.filter((r) => r.tracked).length} tracciati.`
    : shownCount > 0
      ? `${plural(shownCount, 'concetto', 'concetti')} su ${regionRows.length} ${view === 'tutti' ? 'corrispondono alla ricerca' : `· ${VIEWS.find((v) => v.value === view)?.label.toLowerCase()}`}.`
      : deferredQuery.trim()
        ? `Nessun concetto su ${regionRows.length} corrisponde alla ricerca.`
        : (VIEWS.find((v) => v.value === view)?.none ?? 'Nessun concetto.')

  const showMissing = () => {
    setRegion(null)
    setQuery('')
    setView('non-tracciati')
  }

  return (
    <main className={PAGE}>
      <PageHead
        title="Copertura"
        en="Coverage: nothing left behind"
        lead="La prova che nulla è stato perso: ogni concetto delle fonti, estratto pagina per pagina, con i punti dell'atlante che lo spiegano. Teoria, formule, widget, figure, quiz, flashcard, domande d'orale ed esercizi."
      >
        <Reading label="Concetti inventariati">{totalInventoried}</Reading>
        <Reading label="Fogli pronti">
          {readyCount} di {manifest.length}
        </Reading>
        <Reading label="Tracciati">{loading ? '…' : `${allRows.filter((r) => r.tracked).length} di ${allRows.length}`}</Reading>
      </PageHead>

      {!loading && <Verdict ready={ready} onShowMissing={showMissing} />}

      <section aria-labelledby={`${uid}-regioni`} className="mt-12">
        <SectionHead id={`${uid}-regioni`} title="Per regione" en="By course" />
        <RegionTable index={index} rows={rowsById} />
      </section>

      <section aria-labelledby={`${uid}-registro`} className="mt-14">
        <SectionHead id={`${uid}-registro`} title="Registro dei fogli pronti" en="Register of ready sheets" />
        {loading ? (
          <p role="status" className="label m-0 mt-4">
            Apro il registro…
          </p>
        ) : (
          <>
            <div className="mt-4 grid gap-4 border-b border-border-strong pb-4 @4xl:grid-cols-[minmax(0,auto)_minmax(0,16rem)_minmax(0,1fr)] @4xl:items-end">
              <RegionFilter id={`${uid}-regione`} value={region} onChange={setRegion} />
              <div className="grid gap-1.5">
                <label htmlFor={`${uid}-mostra`} className="label">
                  Mostra
                </label>
                <select id={`${uid}-mostra`} value={view} onChange={(e) => setView(e.target.value as CoverageView)} className={SELECT}>
                  {VIEWS.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.value === 'tutti' ? v.label : `${v.label} · ${regionRows.filter((r) => matchesView(r, v.value)).length}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor={`${uid}-cerca`} className="label">
                  Cerca un concetto
                </label>
                <input
                  id={`${uid}-cerca`}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nome, termine inglese o codice (c12)"
                  autoComplete="off"
                  spellCheck={false}
                  className={`${FIELD} w-full placeholder:text-faint`}
                />
              </div>
            </div>
            {/* il riepilogo a vista segue ogni tasto; quello annunciato arriva a scrittura ferma */}
            <p aria-hidden="true" className="m-0 mt-3 text-[length:var(--step--1)] text-muted">
              {status}
            </p>
            <SettledStatus text={status} />

            <div className="mt-4 pt-px">
              {visible.length === 0 && <p className="m-0 text-muted">Nessun foglio pronto in questa regione.</p>}
              {visible.map((s) => {
                if (s.status === 'error') return <FailedSheet key={s.meta.id} meta={s.meta} onRetry={retry} />
                const shown = shownOf(s.rows)
                if (filtering && shown.length === 0) return null
                const open = openMap[s.meta.id] ?? filtering
                return (
                  <SheetBlock
                    key={s.meta.id}
                    sheet={s}
                    shown={shown}
                    filtering={filtering}
                    open={open}
                    onToggle={() => setOpenState({ key: filterKey, map: { ...openMap, [s.meta.id]: !open } })}
                  />
                )
              })}
            </div>
          </>
        )}
      </section>

      <Preparing sheets={preparing} index={index} />
    </main>
  )
}
