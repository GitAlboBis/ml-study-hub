// La copertina dell'atlante (/). Titolo, "riprendi da dove eri" dallo spillo, "oggi sul campo" (la domanda
// d'orale del giorno, le flashcard in scadenza, i punti deboli nei quiz), le tre regioni (i corsi) come campi
// pieni di falso colore con la loro scala dei fogli, il quadro d'unione dei 50 fogli (il foglio di un atlante
// che mostra come si accostano tutti gli altri) e i fogli pronti in evidenza.
// Nel quadro ogni tassello porta tre informazioni, mai affidate al solo colore: la regione (striscia e tinta),
// se il foglio è pronto (tratteggio = contenuti in preparazione) e il tuo rilievo (la tinta sale: niente,
// metà, tutto; più il segno di stato). Le tinte salgono una volta sola, all'apertura; con riduci movimento no.
// "Oggi sul campo" legge i dati dei fogli pronti (loadAllModuleData): funziona con zero, uno o cinquanta fogli.
import { Fragment, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Rich } from '../components/content/Rich'
import { BTN_PRIMARY, BTN_SECONDARY, Disclosure, FLOW, HATCH, Icon } from '../components/content/shared'
import { PinMark, RegionSwatch, StatusMark } from '../components/layout/marks'
import { examHistory, intervalLabel } from '../components/practice/logic'
import { getModuleMeta, manifest } from '../content/manifest'
import type { ModuleManifestEntry } from '../content/manifest'
import { hasModule } from '../content/registry'
import type { CourseId, ModuleData, Prof } from '../content/types'
import { chapterLabel, chapterName, chaptersOf, lastStop, REGION_ORDER, REGIONS, sectionLabel, sheetNumber, STATUS_LABEL } from '../lib/atlas'
import { calendarDay, cardsForToday, courseProgress, daysAgoLabel, examPool, pickOfTheDay, weakSheets } from '../lib/cover'
import { loadReadySheets } from '../lib/readySheets'
import { dayKey, progressKey, useProgress } from '../store/progress'
import type { ModuleStatus } from '../store/progress'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { LoadFailures } from './practice/parts'
import { HEAD_READINGS, PAGE_SUBTITLE, PAGE_TITLE, TICKS } from './global/ui'

const H2 = 'm-0 border-t-2 border-border-strong pt-3 font-label text-[length:var(--step-2)] leading-tight font-bold'


const FILL: Record<ModuleStatus, string> = {
  'da-iniziare': 'h-1',
  'in-corso': 'h-1/2',
  completato: 'h-full',
  'da-ripassare': 'h-full',
}

/** Salita delle tinte all'apertura: la stessa grammatica per i tasselli del quadro e per le scale delle regioni. */
const RISE = 'origin-bottom transition-[scale] duration-[var(--dur-slow)] ease-[var(--ease-out)] motion-safe:starting:scale-y-0'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// ---------------------------------------------------------------------------------------------
// Dati dei fogli pronti
// ---------------------------------------------------------------------------------------------

/** `failed`: i fogli pronti che non si sono caricati; la copertina lavora con gli altri e lo dice. */
type Field = { status: 'loading' } | { status: 'error' } | { status: 'ready'; sheets: ModuleData[]; failed: string[] }

/**
 * I dati di tutti i fogli pronti, per la domanda del giorno e le flashcard. Si carica una volta, con "Riprova".
 * Un foglio per volta (loadReadySheets): uno rotto non spegne gli altri; solo se non se ne apre nessuno è un errore.
 */
function useReadySheets(): [Field, () => void] {
  const [field, setField] = useState<Field>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    const start = () =>
      loadReadySheets({ lists: ['exam', 'flashcards'] }).then(({ modules, failed }) => {
        if (!alive) return
        setField(modules.length === 0 && failed.length > 0 ? { status: 'error' } : { status: 'ready', sheets: modules, failed })
      })
    // Con cinquanta fogli sono cinquanta chunk di dati: partono dopo il primo disegno, quando il browser è
    // libero, così la copertina si vede subito e "oggi sul campo" si riempie un attimo dopo.
    const idle = 'requestIdleCallback' in window
    const handle = idle ? window.requestIdleCallback(start, { timeout: 1200 }) : window.setTimeout(start, 0)
    return () => {
      alive = false
      if (idle) window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
  }, [attempt])
  const retry = () => {
    setField({ status: 'loading' })
    setAttempt((n) => n + 1)
  }
  return [field, retry]
}

// ---------------------------------------------------------------------------------------------
// Quadro d'unione
// ---------------------------------------------------------------------------------------------

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
        className={`absolute inset-x-0 bottom-0 ${region.fill} ${ready ? FILL[status] : 'h-1'} ${RISE}`}
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

// ---------------------------------------------------------------------------------------------
// Riprendi da dove eri
// ---------------------------------------------------------------------------------------------

function Resume({ ready, now }: { ready: ModuleManifestEntry[]; now: number }) {
  const modules = useProgress((s) => s.modules)
  const stop = lastStop(modules)
  const meta = stop ? getModuleMeta(stop.moduleId) : undefined

  if (stop && meta) {
    const section = stop.section ? sectionLabel(stop.section) : null
    const when = daysAgoLabel(stop.at, now)
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
            <p className="m-0 text-muted">{section ? `Ti eri fermato alla sezione «${section}», ${when}.` : `Ultima lettura: ${when}.`}</p>
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

// ---------------------------------------------------------------------------------------------
// Oggi sul campo
// ---------------------------------------------------------------------------------------------

const PROF_NAME: Record<Prof, string> = { Melgani: 'Melgani', Passerini: 'Passerini', Ricci: 'Ricci', Assistant: 'Assistente' }

const PLATE_ID = 'domanda-del-giorno'

/** Il corpo della tavola quando la domanda non c'è: in caricamento, nessun foglio pronto, errore. */
function PlateNote({ children, hatch = false }: { children: ReactNode; hatch?: boolean }) {
  return <div className={`grid min-h-40 content-center p-4 @3xl:p-5 ${hatch ? HATCH : ''}`}>{children}</div>
}

/** La domanda d'orale del giorno: scelta per data tra quelle dei fogli pronti, con la traccia a scomparsa. */
function QuestionPlate({ field, now, readyCount, onRetry }: { field: Field; now: number; readyCount: number; onRetry: () => void }) {
  const entries = useProgress((s) => s.exam)
  const pick = useMemo(() => (field.status === 'ready' ? pickOfTheDay(examPool(field.sheets), now) : null), [field, now])
  const meta = pick ? getModuleMeta(pick.moduleId) : undefined

  if (!pick || !meta) {
    return (
      <section aria-labelledby={PLATE_ID} className="grid content-start border-2 border-border-strong bg-surface">
        <PlateHead />
        {field.status === 'loading' ? (
          <PlateNote hatch>
            <p role="status" className="label m-0 justify-self-start bg-surface px-2 py-1 text-text">
              Scelgo la domanda del giorno…
            </p>
          </PlateNote>
        ) : field.status === 'error' ? (
          <PlateNote>
            <div role="alert" className="flex flex-wrap items-center gap-3 border border-border-strong bg-error-bg p-4">
              <Icon name="cross" className="text-error" />
              <p className="m-0 min-w-0 flex-1">Non riesco ad aprire i fogli pronti. Riprova; se non basta, ricarica la pagina.</p>
              <button type="button" className={BTN_SECONDARY} onClick={onRetry}>
                <Icon name="reset" size={18} />
                Riprova
              </button>
            </div>
          </PlateNote>
        ) : (
          <PlateNote hatch>
            <p className="m-0 max-w-[48ch] justify-self-start bg-surface px-2 py-1 text-muted">
              {readyCount === 0
                ? "La domanda del giorno arriva con il primo foglio pronto: ogni giorno una domanda d'orale diversa, da ripetere ad alta voce."
                : "I fogli pronti non hanno ancora domande d'orale: la domanda del giorno arriva con loro."}
            </p>
          </PlateNote>
        )}
      </section>
    )
  }

  const { question } = pick
  const region = REGIONS[meta.course]
  const history = examHistory(entries, progressKey(pick.moduleId, question.id))
  return (
    <section aria-labelledby={PLATE_ID} className="grid content-start border-2 border-border-strong bg-surface">
      <PlateHead>
        <span className="flex items-center gap-2">
          <RegionSwatch course={meta.course} size={12} />
          <span className="label text-text">{PROF_NAME[question.prof] ?? region.name}</span>
        </span>
        {question.fromBank && (
          <span className="label flex items-center gap-1.5 bg-pin px-2 py-0.5 text-pin-contrast">
            <Icon name="pin" size={14} />
            Dalla banca domande
          </span>
        )}
      </PlateHead>
      <div className="grid gap-3 p-4 @3xl:p-5">
        <div className="font-label text-[length:var(--step-1)] leading-snug font-bold @3xl:text-[length:var(--step-2)]">
          <Rich text={question.q} className={FLOW} />
        </div>
        <p className="m-0 flex items-baseline gap-2 text-muted">
          <span className="label" aria-hidden="true">
            EN
          </span>
          <span lang="en" className="italic">
            {question.qEn}
          </span>
        </p>
      </div>
      {question.checklist.length > 0 && (
        <Disclosure
          className="border-t border-border"
          summary={<span className="label text-text">Traccia: i punti da toccare</span>}
          panelClassName="border-t border-border p-4 @3xl:px-5"
        >
          <ol className="m-0 grid list-decimal gap-1.5 pl-6 marker:font-mono marker:text-muted">
            {question.checklist.map((point, i) => (
              <li key={i} className="pl-1">
                <Rich text={point} inline />
              </li>
            ))}
          </ol>
        </Disclosure>
      )}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border-strong p-4 @3xl:px-5">
        <p className="m-0 min-w-0 flex-1 basis-56 text-[length:var(--step--1)] text-muted">
          Dal <Link to={`/m/${meta.id}`}>foglio {sheetNumber(meta.id)} · {meta.title}</Link>
          {history.last !== null && (
            <>
              {' · '}
              <span className="num">Ultimo voto {history.last} su 3</span>
            </>
          )}
        </p>
        <Link to={`/m/${meta.id}/orale#exam:${question.id}`} className={`${BTN_PRIMARY} no-underline`}>
          Rispondi ad alta voce
          <span className="visually-hidden">: la domanda del foglio {sheetNumber(meta.id)}</span>
          <Icon name="arrow" size={18} />
        </Link>
      </div>
    </section>
  )
}

function PlateHead({ children }: { children?: ReactNode }) {
  return (
    <header className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border-strong px-4 py-1.5 @3xl:px-5">
      <h3 id={PLATE_ID} className="label m-0 flex items-center gap-2 text-text">
        <Icon name="speech" size={18} />
        Domanda d'orale del giorno
      </h3>
      {children && <div className="ml-auto flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  )
}

const ENTRY = 'grid content-start gap-3 border-t-2 border-border-strong pt-3'

/** Le flashcard di oggi: quante scadono entro stasera e quante sono ancora da vedere, su tutti i fogli pronti. */
function CardsToday({ field, now }: { field: Field; now: number }) {
  const state = useProgress((s) => s.flashcards)
  const load = useMemo(() => {
    if (field.status !== 'ready') return null
    const keys = field.sheets.flatMap((m) => m.flashcards.map((c) => progressKey(m.id, c.id)))
    return { total: keys.length, ...cardsForToday(keys, state, now) }
  }, [field, state, now])

  let text: ReactNode
  if (field.status === 'loading') text = 'Conto le carte…'
  else if (field.status === 'error' || !load) text = 'Le carte si contano appena i fogli si aprono.'
  else if (load.total === 0) text = 'Ancora nessuna carta: arrivano con i fogli pronti.'
  else if (load.due > 0) {
    text = (
      <>
        <span className="num">{load.due}</span> {load.due === 1 ? 'carta in scadenza oggi' : 'carte in scadenza oggi'}
        {load.fresh > 0 && (
          <>
            {' e '}
            <span className="num">{load.fresh}</span> {load.fresh === 1 ? 'nuova' : 'nuove'} da imparare
          </>
        )}
        .
      </>
    )
  } else {
    const next = load.next === null ? null : intervalLabel(calendarDay(load.next) - calendarDay(now))
    text = (
      <>
        Nessuna carta da ripassare oggi
        {load.fresh > 0 ? (
          <>
            {': ne hai '}
            <span className="num">{load.fresh}</span> {load.fresh === 1 ? 'nuova' : 'nuove'} da imparare.
          </>
        ) : next ? (
          `: la prossima scade ${next}.`
        ) : (
          '.'
        )}
      </>
    )
  }
  const work = load !== null && load.due + load.fresh > 0

  return (
    <section aria-labelledby="carte-di-oggi" className={ENTRY}>
      <h3 id="carte-di-oggi" className="label m-0 text-text">
        Flashcard di oggi
      </h3>
      <p aria-live="polite" className="m-0 max-w-[40ch] text-[length:var(--step-1)] leading-snug">
        {text}
      </p>
      <div>
        <Link to="/flashcard" className={`${work ? BTN_PRIMARY : BTN_SECONDARY} no-underline`}>
          {work ? 'Ripassa le flashcard' : 'Apri le flashcard'}
          <Icon name="arrow" size={18} />
        </Link>
      </div>
    </section>
  )
}

/** Scala di dieci tacche: la quota di risposte giuste. Decorativa, il numero è scritto accanto. */
function Scale({ value }: { value: number }) {
  const filled = Math.round(value * 10)
  return (
    <span aria-hidden="true" className="flex h-2.5 w-20 border border-border-strong">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`flex-1 border-border-strong not-first:border-l ${i < filled ? 'bg-accent' : ''}`} />
      ))}
    </span>
  )
}

/** I fogli dove sbagli di più nei quiz (ultima risposta a ogni domanda), con il link ai quiz del foglio. */
function WeakSpots() {
  const quiz = useProgress((s) => s.quiz)
  const weak = weakSheets(quiz).filter((w) => getModuleMeta(w.moduleId))
  const answeredAny = Object.values(quiz).some((q) => q.attempts > 0)

  return (
    <section aria-labelledby="punti-deboli" className={ENTRY}>
      <h3 id="punti-deboli" className="label m-0 text-text">
        Punti deboli
      </h3>
      {weak.length === 0 ? (
        <p className="m-0 max-w-[46ch] text-muted">
          {answeredAny
            ? 'Nei quiz fatti finora nessun foglio scende sotto il 70% di risposte giuste.'
            : 'Qui compaiono i fogli dove sbagli di più nei quiz, dopo almeno tre risposte per foglio.'}
        </p>
      ) : (
        <>
          <ul role="list" aria-label="Fogli con più errori nei quiz" className="m-0 grid list-none p-0">
            {weak.map((w) => {
              const meta = getModuleMeta(w.moduleId)!
              const region = REGIONS[meta.course]
              return (
                <li key={w.moduleId} className="m-0 -mt-px first:mt-0">
                  <Link
                    to={`/m/${meta.id}/quiz`}
                    className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-stretch border border-border-strong bg-surface text-text no-underline transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2"
                  >
                    <span className={`${region.field} num grid min-w-12 place-items-center px-2 font-bold`}>
                      <span className="visually-hidden">Foglio</span> {sheetNumber(meta.id)}
                    </span>
                    <span className="grid content-center gap-0.5 px-3 py-2">
                      <span className="visually-hidden"> · </span>
                      <span className="font-label leading-snug font-bold">{meta.title}</span>
                      <span className="num text-[length:var(--step--1)] text-muted">
                        <span className="visually-hidden">, </span>
                        {w.right} {w.right === 1 ? 'giusta' : 'giuste'} su {w.answered} · {Math.round(w.accuracy * 100)}%
                      </span>
                    </span>
                    <span className="grid place-items-center pr-3">
                      <Scale value={w.accuracy} />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <p className="m-0 text-[length:var(--step--1)] text-muted">Conta l'ultima risposta a ogni domanda: ripassando gli errori, il foglio esce dall'elenco.</p>
        </>
      )}
    </section>
  )
}

function Today({ field, now, readyCount, onRetry }: { field: Field; now: number; readyCount: number; onRetry: () => void }) {
  const date = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  return (
    <section aria-labelledby="oggi" className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t-2 border-border-strong pt-3">
        <h2 id="oggi" className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold">
          Oggi sul campo
        </h2>
        <p className="label m-0">
          <time dateTime={dayKey(now)}>{date}</time>
        </p>
      </div>
      <div className="mt-5 grid gap-8 @5xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] @5xl:gap-10">
        {field.status === 'ready' && field.failed.length > 0 && (
          <div className="@5xl:col-span-2">
            <LoadFailures failed={field.failed} effect="la domanda del giorno e le carte vengono dagli altri fogli pronti" onRetry={onRetry} />
          </div>
        )}
        <QuestionPlate field={field} now={now} readyCount={readyCount} onRetry={onRetry} />
        <div className="grid content-start gap-8">
          <CardsToday field={field} now={now} />
          <WeakSpots />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Le tre regioni
// ---------------------------------------------------------------------------------------------

/**
 * La scala dei fogli di una regione, un tacco per foglio come la barra di scala di una carta: tratteggiato se
 * il foglio è in preparazione, pieno a inchiostro se rilevato, pieno a metà se in corso. Decorativa: il
 * conteggio è scritto sotto.
 */
function RegionScale({ course, ready }: { course: CourseId; ready: Set<string> }) {
  const modules = useProgress((s) => s.modules)
  const sheets = chaptersOf(course).flatMap((c) => c.sheets)
  return (
    <span aria-hidden="true" className="flex h-3.5 gap-[3px]">
      {sheets.map(({ meta }, i) => {
        const status = modules[meta.id]?.status ?? 'da-iniziare'
        const on = ready.has(meta.id)
        return (
          <span key={meta.id} className={`relative flex-1 overflow-hidden border border-current ${on ? '' : 'border-dashed'}`}>
            {on && status !== 'da-iniziare' && (
              <span style={{ transitionDelay: `${i * 20}ms` }} className={`absolute inset-x-0 bottom-0 bg-current ${FILL[status]} ${RISE}`} />
            )}
          </span>
        )
      })}
    </span>
  )
}

function Regions({ ready }: { ready: Set<string> }) {
  const modules = useProgress((s) => s.modules)
  return (
    <div className="mt-4 grid">
      {REGION_ORDER.map((course) => {
        const region = REGIONS[course]
        const sheets = chaptersOf(course).flatMap((c) => c.sheets)
        const p = courseProgress(course, modules, (id) => ready.has(id))
        const parts = [
          `Fogli ${sheets[0].number}–${sheets.at(-1)?.number}`,
          p.ready === 0 ? 'nessun foglio pronto' : plural(p.ready, 'pronto', 'pronti'),
          plural(p.surveyed, 'rilevato', 'rilevati'),
          ...(p.inProgress > 0 ? [`${p.inProgress} in corso`] : []),
          ...(p.toReview > 0 ? [`${p.toReview} da ripassare`] : []),
        ]
        return (
          <article key={course} className={`${region.field} -mt-px grid min-h-36 content-between gap-3 border border-border-strong p-4 @3xl:p-5`}>
            <h3 className="m-0 font-display text-[length:var(--step-4)] leading-[0.9] font-extrabold uppercase">{region.name}</h3>
            <p className="m-0 text-[length:var(--step--1)]">{region.what}</p>
            <div className="grid gap-2">
              <RegionScale course={course} ready={ready} />
              <p className="num m-0 text-[length:var(--step--1)]">
                {/* una voce non si spezza a metà: si va a capo solo tra una voce e l'altra */}
                {parts.map((part, i) => (
                  <Fragment key={part}>
                    {i > 0 && ' '}
                    <span className="whitespace-nowrap">
                      {i > 0 && '· '}
                      {part}
                    </span>
                  </Fragment>
                ))}
              </p>
            </div>
          </article>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------------------------

export default function Home() {
  useDocumentTitle('Copertina')
  const [now] = useState(() => Date.now())
  const modules = useProgress((s) => s.modules)
  const pinned = lastStop(modules)?.moduleId ?? null
  const ready = manifest.filter((m) => hasModule(m.id))
  const readySet = new Set(ready.map((m) => m.id))
  const [field, retry] = useReadySheets()

  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <header className="border-2 border-border-strong bg-surface">
        <div aria-hidden="true" className="h-2.5 border-b border-border-strong" style={TICKS} />
        <div className="grid items-end gap-6 p-5 @3xl:grid-cols-[minmax(0,1fr)_auto] @3xl:p-8">
          <div className="min-w-0">
            <h1 className="m-0">
              <span className={PAGE_TITLE}>Atlante</span>
              <span className={PAGE_SUBTITLE}>Machine Learning in cinquanta fogli</span>
            </h1>
            <p lang="en" className="m-0 mt-2 text-[length:var(--step-1)] text-muted italic">
              An atlas of Machine Learning in fifty sheets
            </p>
          </div>
          <dl className={HEAD_READINGS}>
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

      <Resume ready={ready} now={now} />

      <Today field={field} now={now} readyCount={ready.length} onRetry={retry} />

      <div className="mt-14 grid gap-12 @5xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-labelledby="regioni">
          <h2 id="regioni" className={H2}>
            Le tre regioni
          </h2>
          <Regions ready={readySet} />
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
                      {/* il capitolo in italiano, con l'inglese delle fonti accanto */}
                      <span className="text-[length:var(--step--1)]">
                        <span className="label">{chapterLabel(meta.chapter)}</span>{' '}
                        <span lang="en" className="text-muted italic">
                          {chapterName(meta.chapter).en}
                        </span>
                      </span>
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
