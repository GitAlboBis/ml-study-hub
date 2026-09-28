// Tavola delle flashcard (/flashcard): la ripetizione dilazionata su tutto l'atlante. Si sceglie l'ambito
// (tutti i fogli, una regione, un foglio) da una legenda che conta, riga per riga, le carte in scadenza e le
// nuove; si sceglie quante carte fare; la sessione usa FlashcardDeck (la stessa del foglio) con le chiavi dei
// progressi di ogni foglio. Alla fine, sotto il riepilogo del mazzo, il bilancio per foglio e ciò che resta.
// A destra le carte che tornano nei prossimi sette giorni.
//
// L'ambito sta nell'URL (?regione=melgani, ?foglio=m09-…): la copertina e i fogli possono aprire la tavola
// già puntata. I fogli pronti li dice il registry: la pagina funziona con uno e con cinquanta, e i fogli in
// preparazione restano visibili (tratteggio) ma non si scelgono.
//
// Moto: nessuno sulla scelta (si fa da tastiera, a frecce); le colonne dei giorni salgono una volta sola
// all'apertura, come le tinte del quadro d'unione; con riduci movimento compaiono e basta.
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Ref } from 'react'
import { useSearchParams } from 'react-router'
import { BTN_PRIMARY, BTN_SECONDARY, Icon } from '../components/content/shared'
import { FlashcardDeck } from '../components/practice/FlashcardDeck'
import type { DeckSummary } from '../components/practice/FlashcardDeck'
import { intervalLabel, nextDue } from '../components/practice/logic'
import type { DeckEntry } from '../components/practice/logic'
import { Ticks } from '../components/practice/parts'
import { getModuleMeta, manifest } from '../content/manifest'
import type { ModuleData } from '../content/types'
import { lastStop } from '../lib/atlas'
import type { SrsCard } from '../lib/srs'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { useProgress } from '../store/progress'
import { Segmented } from '../widgets/kit/Segmented'
import { LoadFailures, Loading, NoSheetsYet, PAGE_H2, PracticeTitle, ScopePicker, ScopePreparing, SessionBar } from './practice/parts'
import type { Reading } from './practice/parts'
import {
  ALL_SHEETS,
  cardCounts,
  deckOf,
  entriesIn,
  forecast,
  parseScope,
  pickSize,
  scopeLabel,
  scopeWhere,
  sessionQueue,
  sheetName,
  sheetsOf,
  sizeChoices,
  sizeLimit,
  soonestFirst,
  startedSheets,
  tallyBySheet,
  writeScope,
} from './practice/selection'
import type { Scope, SizeChoice } from './practice/selection'
import { useReadyModules } from './practice/useReadyModules'
import type { ReadyModules } from './practice/useReadyModules'

const DAY = 86_400_000
/** I passi della grandezza di una sessione; oltre c'è "tutte". */
const SIZE_STEPS = [10, 20, 50] as const

const cards = (n: number) => (n === 1 ? '1 carta' : `${n} carte`)
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
/** "domani", "tra 3 giorni" a partire da una scadenza in ms. */
const untilLabel = (due: number, now: number) => intervalLabel(Math.ceil((due - now) / DAY))

function Title({ readings }: { readings?: Reading[] }) {
  return (
    <PracticeTitle
      title="Flashcard"
      subtitle="Ripetizione dilazionata su tutto l'atlante"
      en="Spaced repetition across the atlas"
      lead="Scegli dove ripassare: tutti i fogli, una regione o un solo foglio. Prima arrivano le carte in scadenza, poi le nuove; ogni carta torna quando stai per dimenticarla."
      readings={readings}
    />
  )
}

export default function Flashcards() {
  useDocumentTitle('Flashcard')
  const [loaded, retry] = useReadyModules()
  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <CardRoom loaded={loaded} onRetry={retry} />
    </main>
  )
}

// ---------------------------------------------------------------------------------------------
// La tavola con i fogli caricati
// ---------------------------------------------------------------------------------------------

interface Session {
  /** cambia a ogni sessione: un mazzo nuovo */
  n: number
  scope: Scope
  queue: DeckEntry[]
  finished: boolean
  /** carte votate "Non la sapevo" nella sessione */
  missed: number
  /** "ripassa comunque": nessuna carta era in scadenza, il mazzo prende tutte quelle della coda */
  anyway: boolean
}

const NO_MODULES: ModuleData[] = []

// Un solo componente per il caricamento e per la tavola pronta: la testata resta la stessa (non si rimonta)
// e riceve le letture quando i fogli sono arrivati.
function CardRoom({ loaded, onRetry }: { loaded: ReadyModules; onRetry: () => void }) {
  const modules = loaded.status === 'ready' ? loaded.modules : NO_MODULES
  const [params, setParams] = useSearchParams()
  const scope = parseScope(params)
  const setScope = (next: Scope) => setParams((p) => writeScope(p, next), { replace: true })

  const srs = useProgress((s) => s.flashcards)
  const progressModules = useProgress((s) => s.modules)
  // l'ora di riferimento dei conti: l'apertura, poi la fine di ogni sessione (mai letta durante il render)
  const [now, setNow] = useState(() => Date.now())
  const [size, setSize] = useState<SizeChoice>('20')
  const [session, setSession] = useState<Session | null>(null)

  const deck = useMemo(() => deckOf(modules), [modules])
  const ready = useMemo(() => new Set(modules.map((m) => m.id)), [modules])
  const all = cardCounts(deck, srs, now)

  const setupRef = useRef<HTMLHeadingElement>(null)
  const deckRef = useRef<HTMLDivElement>(null)
  // dove portare il fuoco dopo il prossimo render: mai all'apertura, solo dopo un'azione
  const focusNext = useRef<'setup' | 'deck' | null>(null)
  useEffect(() => {
    const target = focusNext.current
    if (target === null) return
    focusNext.current = null
    // il mazzo prende il fuoco sul suo contenitore: Spazio gira subito la carta, 1-4 votano
    if (target === 'deck') deckRef.current?.querySelector<HTMLElement>('section')?.focus()
    else setupRef.current?.focus()
  })

  /** Una sessione su un ambito: la coda si decide adesso, con i progressi di adesso. */
  function launch(target: Scope) {
    const at = Date.now()
    const entries = entriesIn(deck, target)
    const c = cardCounts(entries, srs, at)
    const available = c.due + c.fresh
    const limit = sizeLimit(pickSize(size, sizeChoices(SIZE_STEPS, available > 0 ? available : c.total)))
    const anyway = available === 0
    const queue = anyway ? soonestFirst(entries, srs, limit) : sessionQueue(entries, srs, at, limit, startedSheets(progressModules))
    setNow(at)
    focusNext.current = 'deck'
    setSession((s) => ({ n: (s?.n ?? 0) + 1, scope: target, queue, finished: false, missed: 0, anyway }))
  }

  function exit() {
    setNow(Date.now())
    focusNext.current = 'setup'
    setSession(null)
  }

  function finish(summary: DeckSummary) {
    setNow(Date.now())
    setSession((s) => (s ? { ...s, finished: true, missed: summary.missed } : s))
  }

  // il foglio proposto per "Un foglio": quello dove ti sei fermato, se è pronto, altrimenti il primo pronto
  const stop = lastStop(progressModules)?.moduleId
  const suggested = stop && ready.has(stop) ? stop : (modules[0]?.id ?? manifest[0].id)

  return (
    <>
      <Title
        readings={
          loaded.status === 'ready'
            ? [
                { label: 'In scadenza', value: all.due },
                { label: 'Nuove', value: all.fresh },
                { label: 'Fogli pronti', value: `${modules.length} di ${manifest.length}` },
              ]
            : undefined
        }
      />
      <div className="mt-10 grid gap-8">
        {loaded.status === 'ready' && <LoadFailures failed={loaded.failed} what="le loro carte" onRetry={onRetry} />}
        {loaded.status === 'loading' ? (
          <Loading what="le carte" />
        ) : modules.length === 0 ? (
          <NoSheetsYet what="le flashcard" />
        ) : session ? (
          <SessionView session={session} deck={deck} srs={srs} now={now} size={size} deckRef={deckRef} onFinish={finish} onContinue={() => launch(session.scope)} onExit={exit} />
        ) : (
          <Setup
            scope={scope}
            onScope={setScope}
            deck={deck}
            srs={srs}
            now={now}
            ready={ready}
            suggested={suggested}
            started={startedSheets(progressModules)}
            size={size}
            onSize={setSize}
            headingRef={setupRef}
            onStart={() => launch(scope)}
          />
        )}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------------------------
// Preparazione
// ---------------------------------------------------------------------------------------------

interface SetupProps {
  scope: Scope
  onScope: (scope: Scope) => void
  deck: DeckEntry[]
  srs: Readonly<Record<string, SrsCard>>
  now: number
  ready: ReadonlySet<string>
  suggested: string
  started: ReadonlySet<string>
  size: SizeChoice
  onSize: (size: SizeChoice) => void
  headingRef: Ref<HTMLHeadingElement>
  onStart: () => void
}

/** Com'è fatta la sessione, in una riga: quante carte in scadenza e quante nuove, in che ordine. */
function composition(due: number, fresh: number, n: number, freshOrder: string): string {
  const dueIn = Math.min(n, due)
  const freshIn = Math.min(n - dueIn, fresh)
  if (dueIn > 0 && freshIn > 0) {
    return `Prima ${dueIn === 1 ? 'la carta' : `le ${dueIn} carte`} in scadenza, dalla più vecchia; poi ${freshIn === 1 ? '1 nuova' : `${freshIn} nuove`}.`
  }
  if (dueIn > 0) return `${capital(cards(dueIn))} in scadenza, dalla più vecchia.`
  return `${cards(freshIn)} ${freshIn === 1 ? 'nuova' : 'nuove'}, ${freshOrder}.`
}

function Setup({ scope, onScope, deck, srs, now, ready, suggested, started, size, onSize, headingRef, onStart }: SetupProps) {
  const uid = useId()
  const inScopeDeck = entriesIn(deck, scope)
  const counts = cardCounts(inScopeDeck, srs, now)
  const available = counts.due + counts.fresh
  const pool = available > 0 ? available : counts.total
  const choices = sizeChoices(SIZE_STEPS, pool)
  const chosen = pickSize(size, choices)
  const n = Math.min(sizeLimit(chosen), pool)
  const readyHere = sheetsOf(scope).some((m) => ready.has(m.id))
  const where = scopeWhere(scope)
  const freshOrder =
    scope.kind === 'foglio' ? "nell'ordine del mazzo" : sheetsOf(scope).some((m) => started.has(m.id)) ? 'a partire dai fogli che hai già aperto' : "nell'ordine dell'atlante"

  // i tasselli hanno tutti la stessa larghezza: il gruppo prende spazio fino a una misura comoda
  const sizePicker = choices.length > 1 && (
    <div className="w-full max-w-sm">
      <Segmented<SizeChoice>
        id={`${uid}-size`}
        label="Carte in questa sessione"
        value={chosen}
        onChange={onSize}
        options={choices.map((c) => ({ value: c, label: c === 'tutte' ? 'Tutte' : c }))}
      />
    </div>
  )

  let launcher
  if (!readyHere) {
    launcher = <ScopePreparing scope={scope} what="le sue flashcard" onAll={() => onScope(ALL_SHEETS)} />
  } else if (counts.total === 0) {
    launcher = (
      <p className="m-0 flex items-center gap-3 border border-border bg-surface p-4 text-muted">
        <Icon name="info" />
        Non ci sono ancora flashcard {where}.
      </p>
    )
  } else if (available === 0) {
    const next = nextDue(inScopeDeck, srs, now)
    launcher = (
      <div className="relative grid justify-items-start gap-4 border-2 border-border-strong bg-surface p-4 sm:p-6">
        <Ticks />
        <div className="grid gap-1">
          <p className="m-0 flex items-center gap-3 font-label text-[length:var(--step-1)] leading-tight font-bold">
            <Icon name="check" className="text-ok" />
            Nessuna carta in scadenza {where}.
          </p>
          {next !== null && <p className="m-0 text-muted">La prossima torna {untilLabel(next, now)}. Se vuoi, puoi ripassare prima le carte che tornano per prime.</p>}
        </div>
        {sizePicker}
        <button type="button" className={BTN_SECONDARY} onClick={onStart}>
          <Icon name="reset" size={18} />
          Ripassa comunque {cards(n)}
        </button>
      </div>
    )
  } else {
    launcher = (
      <div className="relative grid justify-items-start gap-4 border-2 border-border-strong bg-surface p-4 sm:p-6">
        <Ticks />
        {sizePicker}
        <p aria-live="polite" className="m-0 max-w-[var(--measure)] text-muted">
          {composition(counts.due, counts.fresh, n, freshOrder)}
        </p>
        <button type="button" className={BTN_PRIMARY} onClick={onStart}>
          <Icon name="arrow" size={18} />
          Inizia la sessione
          <span className="num tracking-normal normal-case">· {cards(n)}</span>
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-12 @5xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <section aria-labelledby={`${uid}-h`} className="grid min-w-0 content-start gap-5">
        <h2 id={`${uid}-h`} ref={headingRef} tabIndex={-1} className={PAGE_H2}>
          Prepara la sessione
        </h2>
        <ScopePicker
          id={`${uid}-scope`}
          scope={scope}
          onChange={onScope}
          ready={ready}
          suggestedSheet={suggested}
          readings={(s) => {
            const c = cardCounts(entriesIn(deck, s), srs, now)
            return [
              { label: 'in scadenza', value: c.due },
              { label: c.fresh === 1 ? 'nuova' : 'nuove', value: c.fresh },
            ]
          }}
        />
        {launcher}
      </section>
      {readyHere && counts.total > 0 && <Forecast entries={inScopeDeck} srs={srs} now={now} scope={scope} />}
    </div>
  )
}

/** Le carte già studiate che tornano nei prossimi sette giorni: colonne che salgono, cifra sotto. */
function Forecast({ entries, srs, now, scope }: { entries: DeckEntry[]; srs: Readonly<Record<string, SrsCard>>; now: number; scope: Scope }) {
  const uid = useId()
  const days = forecast(entries, srs, now)
  const max = Math.max(1, ...days.map((d) => d.count))
  const total = days.reduce((n, d) => n + d.count, 0)
  return (
    <section aria-labelledby={uid} className="grid min-w-0 content-start gap-3">
      <h2 id={uid} className={PAGE_H2}>
        In arrivo
      </h2>
      <p className="m-0 max-w-[var(--measure)] text-muted">
        Le carte già studiate che tornano {scopeWhere(scope)}, giorno per giorno; oggi comprende quelle scadute. Le nuove non hanno ancora una data.
      </p>
      <ol aria-label="Carte che tornano nei prossimi 7 giorni" className="m-0 grid list-none grid-cols-7 border border-border-strong bg-surface p-0">
        {days.map((d, i) => {
          const date = new Date(d.start)
          const name = i === 0 ? 'oggi' : i === 1 ? 'domani' : date.toLocaleDateString('it-IT', { weekday: 'short' })
          return (
            <li key={d.start} className="m-0 grid min-w-0 justify-items-center gap-1.5 border-l border-border px-0.5 pt-2 pb-2 first:border-l-0">
              <span className="label truncate text-[length:var(--step--1)] text-text">{name}</span>
              <span aria-hidden="true" className="num text-[length:var(--step--1)] leading-none text-muted">
                {date.getDate()}
              </span>
              <span aria-hidden="true" className="relative block h-20 w-3/5 border-b border-border-strong">
                {d.count > 0 && (
                  <span
                    className={`absolute inset-x-0 bottom-0 origin-bottom transition-[scale] duration-[var(--dur-slow)] ease-[var(--ease-out)] motion-safe:starting:scale-y-0 ${i === 0 ? 'bg-pin' : 'bg-accent'}`}
                    style={{ height: `max(3px, ${(100 * d.count) / max}%)`, transitionDelay: `${i * 40}ms` }}
                  />
                )}
              </span>
              <span className="num text-text">
                {d.count}
                <span className="visually-hidden"> {d.count === 1 ? 'carta' : 'carte'}</span>
              </span>
            </li>
          )
        })}
      </ol>
      <p className="m-0 text-[length:var(--step--1)] text-muted">
        {total === 0 ? 'Nessuna carta già studiata torna nei prossimi sette giorni.' : `${capital(cards(total))} in sette giorni; la colonna ocra è oggi.`}
      </p>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Sessione e bilancio
// ---------------------------------------------------------------------------------------------

interface SessionViewProps {
  session: Session
  deck: DeckEntry[]
  srs: Readonly<Record<string, SrsCard>>
  now: number
  size: SizeChoice
  /** il contenitore del mazzo: al via il fuoco va sul mazzo */
  deckRef: Ref<HTMLDivElement>
  onFinish: (summary: DeckSummary) => void
  onContinue: () => void
  onExit: () => void
}

function SessionView({ session, deck, srs, now, size, deckRef, onFinish, onContinue, onExit }: SessionViewProps) {
  const label = scopeLabel(session.scope)
  return (
    <div className="grid max-w-[52rem] gap-6">
      <SessionBar
        title="Sessione di flashcard"
        detail={`${label} · ${cards(session.queue.length)}`}
        exitLabel={session.finished ? undefined : 'Interrompi la sessione'}
        onExit={onExit}
      />
      <div ref={deckRef}>
        <FlashcardDeck key={session.n} entries={session.queue} reviewAll={session.anyway} label={`Flashcard: ${label}`} onFinish={onFinish} />
      </div>
      {session.finished && <Report session={session} deck={deck} srs={srs} now={now} size={size} onContinue={onContinue} onExit={onExit} />}
    </div>
  )
}

function Report({ session, deck, srs, now, size, onContinue, onExit }: Omit<SessionViewProps, 'deckRef' | 'onFinish'>) {
  const uid = useId()
  const tallies = tallyBySheet(session.queue, srs)
  const scopeDeck = entriesIn(deck, session.scope)
  const left = cardCounts(scopeDeck, srs, now)
  const available = left.due + left.fresh
  const n = Math.min(sizeLimit(pickSize(size, sizeChoices(SIZE_STEPS, available))), available)
  const where = scopeWhere(session.scope)
  const next = nextDue(scopeDeck, srs, now)

  let sentence: string
  if (available === 0) {
    sentence = `Per oggi hai finito le carte ${where}.${next !== null ? ` La prossima torna ${untilLabel(next, now)}.` : ''}`
  } else {
    const parts = [
      left.due > 0 ? `${cards(left.due)} in scadenza` : '',
      left.fresh > 0 ? (left.due > 0 ? `${left.fresh} ${left.fresh === 1 ? 'nuova' : 'nuove'}` : `${cards(left.fresh)} ${left.fresh === 1 ? 'nuova' : 'nuove'}`) : '',
    ].filter(Boolean)
    sentence = `${capital(where)} ${available === 1 ? 'resta' : 'restano'} ${parts.join(' e ')}.`
  }

  return (
    <section aria-labelledby={uid} className="grid gap-4 border-t-2 border-border-strong pt-3">
      <h2 id={uid} className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold">
        Dopo la sessione
      </h2>
      {tallies.length > 1 && (
        <table className="w-full border-collapse border border-border-strong bg-surface text-left">
          <caption className="label mb-2 text-left">Bilancio per foglio</caption>
          <thead>
            <tr className="border-b border-border-strong">
              <th scope="col" className="label px-3 py-2 font-normal">
                Foglio
              </th>
              <th scope="col" className="label px-3 py-2 text-right font-normal">
                Ripassate
              </th>
              <th scope="col" className="label px-3 py-2 text-right font-normal">
                Da rivedere domani
              </th>
            </tr>
          </thead>
          <tbody>
            {tallies.map((t) => (
              <tr key={t.moduleId} className="border-t border-border">
                <th scope="row" className="px-3 py-2 font-label font-semibold">
                  {sheetName(t.moduleId, getModuleMeta(t.moduleId)?.title ?? t.moduleId)}
                </th>
                <td className="num px-3 py-2 text-right">{t.reviewed}</td>
                <td className={`num px-3 py-2 text-right ${t.missed > 0 ? 'text-text' : 'text-muted'}`}>{t.missed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p aria-live="polite" className="m-0 max-w-[var(--measure)]">
        {sentence}
      </p>
      <div className="flex flex-wrap gap-3">
        {available > 0 && (
          <button type="button" className={session.missed > 0 ? BTN_SECONDARY : BTN_PRIMARY} onClick={onContinue}>
            <Icon name="arrow" size={18} />
            {n > 1 ? `Continua con altre ${cards(n)}` : available === 1 ? "Continua con l'ultima carta" : "Continua con un'altra carta"}
          </button>
        )}
        <button type="button" className={BTN_SECONDARY} onClick={onExit}>
          Cambia ambito
        </button>
      </div>
    </section>
  )
}
