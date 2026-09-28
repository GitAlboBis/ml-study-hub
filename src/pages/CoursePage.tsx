// La pagina di una regione dell'atlante (/corso/:course: melgani, passerini, ricci). Testata sul campo della regione,
// come quella del foglio; "riprendi" con lo spillo della sola regione; il rilievo della regione (fogli pronti, stati,
// tempo di studio dei fogli pronti) con la fila dei suoi fogli in cui la tinta sale; poi i capitoli con i loro fogli:
// titolo italiano e inglese, pagine delle fonti, stato e minuti stimati se il foglio è pronto, "in preparazione" se no.
// Funziona con 1 foglio pronto come con 50: i fogli vengono dal manifest, i minuti dai data.ts di quelli pronti.
import { useId, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { BTN_PRIMARY, BTN_SECONDARY, HATCH, Icon } from '../components/content/shared'
import { PinMark, RegionSwatch, StatusMark } from '../components/layout/marks'
import { getModuleMeta } from '../content/manifest'
import { hasModule } from '../content/registry'
import type { CourseId, DocId } from '../content/types'
import { chapterLabel, chapterName, chaptersOf, DOCS, formatRange, REGION_ORDER, REGIONS, sectionLabel, sheetNumber, STATUS_LABEL } from '../lib/atlas'
import type { Chapter } from '../lib/atlas'
import { formatMinutes, lastStopIn, nextSheetIn, tallyCourse } from '../lib/courseMap'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { useSheetsData } from '../lib/useSheetsData'
import { useProgress } from '../store/progress'
import type { ModuleProgress, ModuleStatus } from '../store/progress'
import { HEAD_READINGS, PAGE_TITLE, TICKS } from './global/ui'

const isCourse = (v: string | undefined): v is CourseId => v !== undefined && (REGION_ORDER as readonly string[]).includes(v)

/** Di che cosa parla la regione, in inglese: la lingua dell'esame. */
const REGION_EN: Record<CourseId, string> = {
  melgani: 'Statistical estimation, feature reduction, supervised classification',
  passerini: 'Bayesian estimation, Bayesian networks, SVMs and kernels, clustering, reinforcement learning',
  ricci: 'Deep learning: neural networks, CNNs, RNNs, transformers, generative and multimodal models',
}


const H2 = 'm-0 font-label text-[length:var(--step-2)] leading-tight font-bold'

/** La tinta della regione che sale nel tassello: niente, metà, tutto (come nel quadro della copertina). */
const FILL: Record<ModuleStatus, string> = {
  'da-iniziare': 'h-1',
  'in-corso': 'h-1/2',
  completato: 'h-full',
  'da-ripassare': 'h-full',
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function HatchSwatch() {
  return <span aria-hidden="true" className={`inline-block size-[18px] shrink-0 border border-border-strong bg-bg ${HATCH}`} />
}

// ---------------------------------------------------------------------------------------------
// Riprendi
// ---------------------------------------------------------------------------------------------

function Resume({ course, modules }: { course: CourseId; modules: Record<string, ModuleProgress> }) {
  const stop = lastStopIn(course, modules)
  const meta = stop ? getModuleMeta(stop.moduleId) : undefined

  if (stop && meta) {
    const section = stop.section ? sectionLabel(stop.section) : null
    return (
      <section aria-labelledby="riprendi" className="mt-8 grid grid-cols-[auto_minmax(0,1fr)] border-2 border-border-strong bg-surface">
        <div aria-hidden="true" className="grid place-items-center bg-pin px-4 text-pin-contrast @3xl:px-6">
          <Icon name="pin" size={32} />
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 @3xl:p-5">
          <div className="min-w-0 flex-1 basis-64">
            <h2 id="riprendi" className="label m-0 text-text">
              Riprendi da dove eri
            </h2>
            <p className="m-0 mt-1 font-label text-[length:var(--step-1)] leading-snug font-bold">
              <span className="num font-normal">Foglio {sheetNumber(meta.id)}</span> · {meta.title}
            </p>
            {section && <p className="m-0 text-muted">Ti eri fermato alla sezione «{section}».</p>}
          </div>
          <Link to={stop.section ? `/m/${meta.id}/teoria#${stop.section}` : `/m/${meta.id}`} className={`${BTN_PRIMARY} no-underline`}>
            Riprendi
            {section && <span className="visually-hidden">: {section}</span>}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>
    )
  }

  const next = nextSheetIn(course, hasModule, modules)
  if (next && hasModule(next.id)) {
    // nextSheetIn ripiega sul primo foglio pronto quando sono tutti rilevati: allora si propone un ripasso
    const allDone = modules[next.id]?.status === 'completato'
    return (
      <section aria-labelledby="partenza" className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-2 border-border-strong bg-surface p-4 @3xl:p-5">
        <div className="min-w-0 flex-1 basis-64">
          <h2 id="partenza" className="label m-0 text-text">
            {allDone ? 'Regione rilevata' : 'Da dove partire'}
          </h2>
          <p className="m-0 mt-1 text-muted">
            {allDone
              ? `Hai rilevato tutti i fogli pronti di questa regione. Per ripassare, riparti dal foglio ${sheetNumber(next.id)}, «${next.title}».`
              : `Non hai ancora letto nessun foglio di questa regione. Il prossimo foglio pronto da rilevare è il ${sheetNumber(next.id)}, «${next.title}».`}
          </p>
        </div>
        <Link to={`/m/${next.id}`} className={`${BTN_PRIMARY} no-underline`}>
          {allDone ? 'Ripassa dal foglio' : 'Comincia dal foglio'} {sheetNumber(next.id)}
          <Icon name="arrow" size={18} />
        </Link>
      </section>
    )
  }

  const first = next?.sources[0]
  return (
    <section aria-labelledby="partenza" className={`mt-8 border-2 border-border-strong bg-bg p-4 @3xl:p-5 ${HATCH}`}>
      <div className="max-w-[var(--measure)] bg-bg">
        <h2 id="partenza" className="label m-0 text-text">
          In preparazione
        </h2>
        <p className="m-0 mt-1">
          Nessun foglio di questa regione è ancora pronto: i contenuti arrivano nei prossimi giorni.
          {first && (
            <>
              {' '}
              Intanto puoi studiare sulle <Link to={`/fonti/${first.doc}/${first.pages[0]}`}>pagine delle fonti</Link>.
            </>
          )}
        </p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Capitoli e fogli
// ---------------------------------------------------------------------------------------------

interface ChapterProps {
  chapter: Chapter
  course: CourseId
  modules: Record<string, ModuleProgress>
  minutes: Map<string, number>
  loading: boolean
  pinned: string | null
}

function ChapterBlock({ chapter, course, modules, minutes, loading, pinned }: ChapterProps) {
  const titleId = useId()
  const region = REGIONS[course]
  const ready = chapter.sheets.filter((s) => hasModule(s.meta.id)).length
  const done = chapter.sheets.filter((s) => modules[s.meta.id]?.status === 'completato').length

  return (
    <div role="group" aria-labelledby={titleId} className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={titleId} className="m-0 font-label text-[length:var(--step-1)] leading-tight font-bold">
          {chapterLabel(chapter.chapter)}{' '}
          <span lang="en" className="font-body text-[length:var(--step--1)] font-normal text-muted italic">
            {chapterName(chapter.chapter).en}
          </span>
        </h3>
        <p className="num m-0 text-[length:var(--step--1)] text-muted">
          {plural(chapter.sheets.length, 'foglio', 'fogli')} · {plural(ready, 'pronto', 'pronti')} · {plural(done, 'rilevato', 'rilevati')}
        </p>
      </div>
      <ol role="list" className="m-0 mt-3 list-none p-0 pt-px">
        {chapter.sheets.map(({ meta, number }) => {
          const isReady = hasModule(meta.id)
          const status = modules[meta.id]?.status ?? 'da-iniziare'
          const min = minutes.get(meta.id)
          const here = pinned === meta.id
          return (
            <li
              key={meta.id}
              data-sheet={meta.id}
              className={`relative -mt-px grid grid-cols-[auto_minmax(0,1fr)] border border-border-strong transition-[background-color] duration-[var(--dur-fast)] ease-out @3xl:grid-cols-[auto_minmax(0,1fr)_17rem] ${
                isReady ? 'bg-surface has-[[data-main]:hover]:bg-surface-2' : 'bg-bg has-[[data-main]:hover]:bg-surface'
              }`}
            >
              <span aria-hidden="true" className={`${region.field} grid w-16 place-items-center font-display text-[length:var(--step-3)] leading-none font-extrabold @3xl:w-20`}>
                {number}
              </span>
              <div className="grid min-w-0 content-center gap-1 px-4 py-3">
                <h4 className="m-0 font-label text-[length:var(--step-1)] leading-snug font-bold tracking-normal normal-case">
                  {/* il titolo è il collegamento, ma l'area cliccabile è tutta la riga (after:inset-0) */}
                  <Link data-main="" to={`/m/${meta.id}`} className={`no-underline after:absolute after:inset-0 after:content-[''] hover:underline ${isReady ? 'text-text' : 'text-muted'}`}>
                    <span className="visually-hidden">Foglio {number} ·</span> {meta.title}
                  </Link>
                </h4>
                <p lang="en" className="m-0 text-[length:var(--step--1)] leading-snug text-muted italic">
                  {meta.titleEn}
                </p>
                <ul role="list" aria-label="Fonti" className="relative z-10 m-0 flex w-fit list-none flex-wrap gap-x-4 p-0 text-[length:var(--step--1)]">
                  {meta.sources.map((r) => (
                    <li key={`${r.doc}-${r.pages[0]}`} className="m-0">
                      <Link to={`/fonti/${r.doc}/${r.pages[0]}`} className="num inline-flex min-h-10 items-center">
                        {formatRange(r)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2 flex flex-wrap content-center items-center gap-x-5 gap-y-1 border-t border-border px-4 py-2.5 text-[length:var(--step--1)] @3xl:col-span-1 @3xl:border-t-0 @3xl:border-l">
                {isReady ? (
                  <>
                    <span className="flex items-center gap-2">
                      <StatusMark status={status} course={course} size={18} />
                      {STATUS_LABEL[status]}
                    </span>
                    {min !== undefined ? (
                      <span className="num text-muted">≈ {formatMinutes(min)}</span>
                    ) : (
                      loading && (
                        <span className="num text-muted" aria-label="minuti in caricamento">
                          …
                        </span>
                      )
                    )}
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-muted">
                    <HatchSwatch />
                    In preparazione
                  </span>
                )}
                {here && (
                  <span className="flex items-center gap-2">
                    <PinMark size={18} />
                    Ti sei fermato qui
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------------------------

function Region({ course }: { course: CourseId }) {
  const region = REGIONS[course]
  useDocumentTitle(`Regione ${region.name}`)
  const progressId = useId()
  const chaptersId = useId()

  const modules = useProgress((s) => s.modules)
  const chapters = useMemo(() => chaptersOf(course), [course])
  const sheets = useMemo(() => chapters.flatMap((c) => c.sheets), [chapters])
  const ids = useMemo(() => sheets.map((s) => s.meta.id), [sheets])
  const { data, loading, failed } = useSheetsData(ids)
  const minutes = useMemo(() => new Map(data.map((d) => [d.id, d.estimatedMinutes])), [data])

  const tally = tallyCourse(course, hasModule, modules)
  const pinned = lastStopIn(course, modules)?.moduleId ?? null
  const total = data.reduce((s, d) => s + d.estimatedMinutes, 0)
  const left = data.filter((d) => modules[d.id]?.status !== 'completato').reduce((s, d) => s + d.estimatedMinutes, 0)

  // i documenti delle fonti della regione, nell'ordine in cui compaiono, ciascuno dalla prima pagina citata
  const docs = useMemo(() => {
    const first = new Map<DocId, number>()
    for (const s of sheets) for (const r of s.meta.sources) first.set(r.doc, Math.min(first.get(r.doc) ?? Infinity, r.pages[0]))
    return [...first.entries()]
  }, [sheets])

  const counts: [string, ModuleStatus, number][] = [
    ['Rilevati', 'completato', tally.byStatus.completato],
    ['Rilievo in corso', 'in-corso', tally.byStatus['in-corso']],
    ['Da ripassare', 'da-ripassare', tally.byStatus['da-ripassare']],
    ['Da rilevare', 'da-iniziare', tally.byStatus['da-iniziare']],
  ]

  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <header className="grid grid-cols-1 border-2 border-border-strong bg-surface sm:grid-cols-[auto_minmax(0,1fr)]">
        <h1 className={`${region.field} m-0 flex flex-row items-end justify-between gap-3 px-4 pt-3 pb-2 sm:row-span-2 sm:flex-col sm:items-start sm:justify-end sm:px-5 sm:pb-4 @3xl:px-6`}>
          <span className="font-display text-[length:var(--step-0)] leading-none font-bold tracking-[0.24em] uppercase">Regione</span>{' '}
          <span className={PAGE_TITLE}>{region.name}</span>
        </h1>
        <div aria-hidden="true" className="h-2.5 border-b border-border-strong" style={TICKS} />
        <div className="grid min-w-0 gap-5 p-4 @3xl:grid-cols-[minmax(0,1fr)_minmax(15rem,auto)] @3xl:gap-8 @3xl:p-6">
          <div className="min-w-0 self-end">
            <p className="m-0 font-label text-[length:var(--step-2)] leading-[1.12] font-bold">{region.what}</p>
            <p lang="en" className="m-0 mt-2 text-[length:var(--step-1)] leading-snug text-muted italic">
              {REGION_EN[course]}
            </p>
          </div>
          <dl className={HEAD_READINGS}>
            <dt className="label">Fogli</dt>
            <dd className="num m-0">
              {sheets[0]?.number}–{sheets.at(-1)?.number}
            </dd>
            <dt className="label">Capitoli</dt>
            <dd className="num m-0">{chapters.length}</dd>
            <dt className="label">Fonti</dt>
            <dd className="m-0">
              <ul role="list" className="m-0 flex list-none flex-wrap gap-x-4 p-0">
                {docs.map(([doc, page]) => (
                  <li key={doc} className="m-0">
                    {/* stanno da sole in una fila: bersagli alti almeno 40 px */}
                    <Link to={`/fonti/${doc}/${page}`} title={DOCS[doc].long} className="num inline-flex min-h-10 items-center">
                      {DOCS[doc].short}
                      <span className="visually-hidden">: {DOCS[doc].long}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </dd>
          </dl>
        </div>
      </header>

      <Resume course={course} modules={modules} />

      <section aria-labelledby={progressId} className="mt-12">
        <h2 id={progressId} className={`${H2} border-t-2 border-border-strong pt-3`}>
          Rilievo della regione
        </h2>
        <div className="mt-4 grid gap-6 @4xl:grid-cols-[minmax(0,1fr)_auto] @4xl:items-center @4xl:gap-10">
          {/* la fila dei fogli della regione: la tinta sale con il rilievo, il tratteggio segna quelli in preparazione */}
          <ol aria-hidden="true" className="m-0 flex list-none p-0 pl-px">
            {sheets.map(({ meta }, i) => {
              const isReady = hasModule(meta.id)
              const status = modules[meta.id]?.status ?? 'da-iniziare'
              return (
                <li key={meta.id} className={`relative -ml-px aspect-square max-w-12 min-w-0 flex-1 overflow-hidden border border-border-strong ${isReady ? 'bg-surface' : 'bg-bg'}`}>
                  {!isReady && <span className={`absolute inset-0 ${HATCH}`} />}
                  <span
                    style={{ transitionDelay: `${i * 30}ms` }}
                    className={`absolute inset-x-0 bottom-0 origin-bottom ${region.fill} ${isReady ? FILL[status] : 'h-0.5'} transition-[scale] duration-[var(--dur-slow)] ease-[var(--ease-out)] motion-safe:starting:scale-y-0`}
                  />
                  {pinned === meta.id && (
                    <span className="absolute top-0.5 right-0.5">
                      <PinMark size={12} />
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
          <dl className="m-0 grid grid-cols-[auto_auto] items-center gap-x-5 gap-y-1.5 text-[length:var(--step--1)] @md:grid-cols-[auto_auto_auto_auto] @4xl:grid-cols-[auto_auto]">
            <dt className="label">Fogli pronti</dt>
            <dd className="num m-0">
              {tally.ready} di {tally.total}
            </dd>
            {counts.map(([label, status, n]) => (
              <div key={status} className="contents">
                <dt className="label flex items-center gap-2">
                  <StatusMark status={status} course={course} className="text-text" />
                  {label}
                </dt>
                <dd className="num m-0">{n}</dd>
              </div>
            ))}
            <dt className="label flex items-center gap-2">
              <HatchSwatch />
              In preparazione
            </dt>
            <dd className="num m-0">{tally.preparing}</dd>
            <dt className="label">Tempo di studio</dt>
            <dd className="num m-0">
              {loading ? '…' : total === 0 ? '—' : `≈ ${formatMinutes(total)} nei fogli pronti${left > 0 && left < total ? `, ne restano ≈ ${formatMinutes(left)}` : left === 0 ? ', tutti rilevati' : ''}`}
            </dd>
          </dl>
        </div>
        {failed.length > 0 && (
          <p role="alert" className="m-0 mt-4 flex items-center gap-2 text-[length:var(--step--1)]">
            <Icon name="warning" size={18} className="text-warn" />
            Non riesco a leggere {failed.length === 1 ? 'un foglio pronto' : `${failed.length} fogli pronti`}: i loro minuti mancano dal conto.
          </p>
        )}
      </section>

      <section aria-labelledby={chaptersId} className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t-2 border-border-strong pt-3">
          <h2 id={chaptersId} className={H2}>
            Capitoli e fogli
          </h2>
          <Link to={`/mappa?regione=${course}`} className={`${BTN_SECONDARY} no-underline`}>
            Vedi i collegamenti sulla mappa
            <Icon name="arrow" size={18} />
          </Link>
        </div>
        {chapters.map((ch) => (
          <ChapterBlock key={ch.chapter} chapter={ch} course={course} modules={modules} minutes={minutes} loading={loading} pinned={pinned} />
        ))}
      </section>

      <nav aria-label="Altre regioni" className="mt-16">
        <p className="label m-0 border-t-2 border-border-strong pt-3">Altre regioni</p>
        <ul role="list" className="m-0 mt-4 grid list-none p-0 pt-px pl-px @3xl:grid-cols-2">
          {REGION_ORDER.filter((c) => c !== course).map((c) => (
            <li key={c} className="m-0 -mt-px -ml-px">
              <Link
                to={`/corso/${c}`}
                className={`${REGIONS[c].field} grid h-full min-h-32 content-between gap-3 border border-border-strong p-4 no-underline transition-[translate] duration-[var(--dur-fast)] ease-out active:translate-y-px @3xl:p-5`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display text-[length:var(--step-4)] leading-[0.9] font-extrabold uppercase">{REGIONS[c].name}</span>
                  <Icon name="arrow" size={24} />
                </span>
                <span className="text-[length:var(--step--1)]">{REGIONS[c].what}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  )
}

function UnknownRegion() {
  useDocumentTitle('Regione sconosciuta')
  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <h1 className={`m-0 ${PAGE_TITLE}`}>Regione sconosciuta</h1>
      <p className="m-0 mt-4 max-w-[var(--measure)]">Questo indirizzo non corrisponde a nessuna delle tre regioni dell'atlante. Scegline una:</p>
      <ul role="list" className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
        {REGION_ORDER.map((c) => (
          <li key={c} className="m-0">
            <Link to={`/corso/${c}`} className={`${BTN_SECONDARY} no-underline`}>
              <RegionSwatch course={c} />
              {REGIONS[c].name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default function CoursePage() {
  const { course } = useParams()
  // la chiave azzera lo stato passando da una regione all'altra
  return isCourse(course) ? <Region key={course} course={course} /> : <UnknownRegion />
}
