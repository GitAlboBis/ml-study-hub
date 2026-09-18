// La copertina dell'atlante (/). Titolo, "riprendi da dove eri" dallo spillo, le tre regioni (i corsi) come campi
// pieni di falso colore, il quadro d'unione dei 50 fogli (il foglio di un atlante che mostra come si
// accostano tutti gli altri) e i fogli pronti in evidenza.
// Nel quadro ogni tassello porta tre informazioni, mai affidate al solo colore: la regione (striscia e tinta),
// se il foglio è pronto (tratteggio = contenuti in preparazione) e il tuo rilievo (la tinta sale: niente,
// metà, tutto; più il segno di stato). Le tinte salgono una volta sola, all'apertura; con riduci movimento no.
import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { BTN_PRIMARY, HATCH, Icon } from '../components/content/shared'
import { PinMark, StatusMark } from '../components/layout/marks'
import { manifest } from '../content/manifest'
import type { ModuleManifestEntry } from '../content/manifest'
import { hasModule } from '../content/registry'
import type { CourseId } from '../content/types'
import { chaptersOf, lastStop, REGION_ORDER, REGIONS, sectionLabel, sheetNumber, STATUS_LABEL } from '../lib/atlas'
import { useProgress } from '../store/progress'
import type { ModuleStatus } from '../store/progress'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const H2 = 'm-0 border-t-2 border-border-strong pt-3 font-label text-[length:var(--step-2)] leading-tight font-bold'

/** Squadratura della cornice, come nella testata del foglio. */
const TICKS: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(90deg, var(--border-strong) 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, var(--border-strong) 0 1px, transparent 1px 16px)',
  backgroundSize: '100% 100%, 100% 45%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'left bottom',
}

const FILL: Record<ModuleStatus, string> = {
  'da-iniziare': 'h-1',
  'in-corso': 'h-1/2',
  completato: 'h-full',
  'da-ripassare': 'h-full',
}

/** La faccia di un tassello del quadro: la usano i tasselli veri e la legenda. */
function TileFace({ course, status, ready, here, number, delay = 0 }: { course: CourseId; status: ModuleStatus; ready: boolean; here: boolean; number?: string; delay?: number }) {
  const region = REGIONS[course]
  const full = ready && (status === 'completato' || status === 'da-ripassare')
  return (
    <>
      {!ready && <span aria-hidden="true" className={`absolute inset-0 ${HATCH}`} />}
      <span
        aria-hidden="true"
        style={{ transitionDelay: `${delay}ms` }}
        className={`absolute inset-x-0 bottom-0 origin-bottom ${region.fill} ${ready ? FILL[status] : 'h-1'} transition-[scale] duration-[var(--dur-slow)] ease-[var(--ease-out)] motion-safe:starting:scale-y-0`}
      />
      {number && (
        <span aria-hidden="true" className={`num absolute top-1 left-1.5 text-[length:var(--step--1)] leading-none ${full ? region.ink : ready ? 'text-text' : 'bg-bg px-0.5 text-muted'}`}>
          {number}
        </span>
      )}
      {ready && status !== 'da-iniziare' && (
        <span aria-hidden="true" className="absolute top-1 right-1 bg-surface text-text">
          <StatusMark status={status} course={course} size={14} />
        </span>
      )}
      {here && (
        <span aria-hidden="true" className="absolute right-1 bottom-1.5">
          <PinMark size={14} />
        </span>
      )}
    </>
  )
}

function Tile({ meta, number, index, status, ready, here }: { meta: ModuleManifestEntry; number: string; index: number; status: ModuleStatus; ready: boolean; here: boolean }) {
  return (
    <li className="m-0 -mt-px -ml-px">
      <Link
        to={`/m/${meta.id}`}
        title={`Foglio ${number} · ${meta.title}`}
        className={`relative block aspect-square overflow-hidden border border-border-strong no-underline outline-offset-2 focus-visible:z-10 transition-[background-color] duration-[var(--dur-fast)] ease-out ${ready ? 'bg-surface hover:bg-surface-2' : 'bg-bg'}`}
      >
        <TileFace course={meta.course} status={status} ready={ready} here={here} number={number} delay={Math.floor(index / 10) * 70} />
        <span className="visually-hidden">
          Foglio {number} · {meta.title}, {ready ? `pronto, ${STATUS_LABEL[status]}` : 'in preparazione'}
          {here ? ', ti sei fermato qui' : ''}
        </span>
      </Link>
    </li>
  )
}

function Legend() {
  const items: { label: string; status: ModuleStatus; ready: boolean; here?: boolean }[] = [
    { label: 'In preparazione', status: 'da-iniziare', ready: false },
    { label: 'Pronto, da rilevare', status: 'da-iniziare', ready: true },
    { label: 'Rilievo in corso', status: 'in-corso', ready: true },
    { label: 'Rilevato', status: 'completato', ready: true },
    { label: 'Da ripassare', status: 'da-ripassare', ready: true },
    { label: 'Ti sei fermato qui', status: 'da-iniziare', ready: true, here: true },
  ]
  return (
    <ul role="list" aria-label="Legenda del quadro" className="m-0 mt-4 grid list-none grid-cols-2 gap-x-4 gap-y-2 p-0 text-[length:var(--step--1)] text-muted @md:grid-cols-3">
      {items.map((it) => (
        <li key={it.label} className="m-0 flex items-center gap-2">
          <span className={`relative block size-7 shrink-0 overflow-hidden border border-border-strong ${it.ready ? 'bg-surface' : 'bg-bg'}`}>
            <TileFace course="passerini" status={it.status} ready={it.ready} here={it.here ?? false} />
          </span>
          {it.label}
        </li>
      ))}
    </ul>
  )
}

function Resume({ ready }: { ready: ModuleManifestEntry[] }) {
  const modules = useProgress((s) => s.modules)
  const stop = lastStop(modules)
  const meta = stop ? manifest.find((m) => m.id === stop.moduleId) : undefined

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

  const first = ready[0] ?? manifest[0]
  return (
    <section aria-labelledby="partenza" className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-2 border-border-strong bg-surface p-4 @3xl:p-5">
      <div className="min-w-0 flex-1 basis-64">
        <h2 id="partenza" className="label m-0 text-text">
          Da dove partire
        </h2>
        <p className="m-0 mt-1 text-muted">Non hai ancora letto nessun foglio. Quando leggi la teoria, uno spillo segna il punto in cui ti sei fermato.</p>
      </div>
      <Link to={`/m/${first.id}`} className={`${BTN_PRIMARY} no-underline`}>
        Comincia dal foglio {sheetNumber(first.id)}
        <span className="visually-hidden">: {first.title}</span>
        <Icon name="arrow" size={18} />
      </Link>
    </section>
  )
}

export default function Home() {
  useDocumentTitle('Copertina')
  const modules = useProgress((s) => s.modules)
  const pinned = lastStop(modules)?.moduleId ?? null
  const ready = manifest.filter((m) => hasModule(m.id))
  const readySet = new Set(ready.map((m) => m.id))

  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <header className="border-2 border-border-strong bg-surface">
        <div aria-hidden="true" className="h-2.5 border-b border-border-strong" style={TICKS} />
        <div className="grid items-end gap-6 p-5 @3xl:grid-cols-[minmax(0,1fr)_auto] @3xl:p-8">
          <div className="min-w-0">
            <h1 className="m-0">
              <span className="block font-display text-[length:var(--step-5)] leading-[0.82] font-extrabold uppercase">Atlante</span>
              <span className="mt-3 block font-label text-[length:var(--step-3)] leading-tight font-bold">Machine Learning in cinquanta fogli</span>
            </h1>
            <p lang="en" className="m-0 mt-2 text-[length:var(--step-1)] text-muted italic">
              An atlas of Machine Learning in fifty sheets
            </p>
          </div>
          <dl className="m-0 grid gap-x-4 gap-y-1.5 border-t border-border pt-4 text-[length:var(--step--1)] @3xl:grid-cols-[auto_auto] @3xl:border-t-0 @3xl:border-l @3xl:pt-0 @3xl:pl-6">
            <dt className="label">Esame</dt>
            <dd className="m-0">Machine Learning, orale · Università di Trento</dd>
            <dt className="label">Regioni</dt>
            <dd className="m-0">Melgani · Passerini · Ricci</dd>
            <dt className="label">Fogli pronti</dt>
            <dd className="num m-0">
              {ready.length} di {manifest.length}
            </dd>
          </dl>
        </div>
      </header>

      <Resume ready={ready} />

      <div className="mt-12 grid gap-12 @5xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-labelledby="regioni">
          <h2 id="regioni" className={H2}>
            Le tre regioni
          </h2>
          <div className="mt-4 grid">
            {REGION_ORDER.map((course) => {
              const region = REGIONS[course]
              const sheets = chaptersOf(course).flatMap((c) => c.sheets)
              const surveyed = sheets.filter((s) => modules[s.meta.id]?.status === 'completato').length
              return (
                <article key={course} className={`${region.field} -mt-px grid min-h-36 content-between gap-3 border border-border-strong p-4 @3xl:p-5`}>
                  <h3 className="m-0 font-display text-[length:var(--step-4)] leading-[0.9] font-extrabold uppercase">{region.name}</h3>
                  <p className="m-0 text-[length:var(--step--1)]">{region.what}</p>
                  <p className="num m-0 text-[length:var(--step--1)]">
                    Fogli {sheets[0].number}–{sheets.at(-1)?.number} · {surveyed} di {sheets.length} rilevati
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="quadro">
          <h2 id="quadro" className={H2}>
            Quadro d'unione
          </h2>
          <p className="m-0 mt-2 max-w-[var(--measure)] text-muted">Ogni tassello è un foglio. La striscia dice la regione, la tinta che sale il tuo rilievo; il tratteggio segna i fogli ancora in preparazione.</p>
          <ol aria-label="Quadro d'unione" className="m-0 mt-4 grid list-none grid-cols-5 p-0 pt-px pl-px @md:grid-cols-10">
            {manifest.map((meta, i) => (
              <Tile
                key={meta.id}
                meta={meta}
                number={String(i + 1).padStart(2, '0')}
                index={i}
                status={modules[meta.id]?.status ?? 'da-iniziare'}
                ready={readySet.has(meta.id)}
                here={pinned === meta.id}
              />
            ))}
          </ol>
          <Legend />
        </section>
      </div>

      <section aria-labelledby="pronti" className="mt-14">
        <h2 id="pronti" className={H2}>
          Fogli pronti
        </h2>
        {ready.length === 0 ? (
          <p className="m-0 mt-3 max-w-[var(--measure)] text-muted">
            Nessun foglio è ancora pronto: i contenuti sono in preparazione. Intanto puoi studiare sulle <Link to="/fonti/ch1/1">pagine delle fonti</Link>.
          </p>
        ) : (
          <ul role="list" aria-label="Fogli pronti" className="m-0 mt-4 grid list-none gap-0 p-0 @3xl:grid-cols-2">
            {ready.map((meta) => {
              const region = REGIONS[meta.course]
              return (
                <li key={meta.id} className="m-0 -mt-px -ml-px">
                  <Link
                    to={`/m/${meta.id}`}
                    className="grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-stretch border border-border-strong bg-surface text-text no-underline transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2"
                  >
                    <span className={`${region.field} grid min-w-20 place-items-center px-3 py-2 font-display text-[length:var(--step-4)] leading-none font-extrabold`}>
                      <span className="visually-hidden">Foglio</span> {sheetNumber(meta.id)}
                    </span>
                    <span className="grid content-center gap-0.5 px-4 py-3">
                      <span className="font-label text-[length:var(--step-1)] leading-snug font-bold">{meta.title}</span>
                      <span lang="en" className="text-[length:var(--step--1)] text-muted italic">
                        {meta.titleEn}
                      </span>
                      <span className="label text-[length:var(--step--1)]">{meta.chapter}</span>
                    </span>
                    <span aria-hidden="true" className="grid place-items-center px-4">
                      <Icon name="arrow" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
