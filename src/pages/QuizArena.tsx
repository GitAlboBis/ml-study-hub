// Arena dei quiz (/quiz): le domande di tutto l'atlante. Si sceglie l'ambito (tutti i fogli, una regione, un
// foglio) dalla stessa legenda della tavola delle flashcard, poi il modo:
// - allenamento: esito e spiegazione subito dopo ogni risposta;
// - esame a tempo: un minuto a domanda, nessun esito fino alla consegna;
// - ripasso degli errori: le domande sbagliate l'ultima volta (recordQuiz), dalla peggiore, con esito subito;
// e quante domande. L'estrazione è a seme (lib/rng) e divide i posti in parti uguali fra i fogli
// (practice/selection.ts); la prova la conduce QuizRunner, lo stesso della scheda Quiz del foglio.
// Sotto, lo storico dell'accuratezza foglio per foglio, raggruppato per regione, con il ripasso dei suoi errori.
//
// Ambito e modo stanno nell'URL (?regione=…, ?foglio=…, ?modo=esame|errori): la copertina e i fogli possono
// aprire l'arena già puntata, per esempio sul ripasso degli errori di un foglio.
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Ref } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BTN_PRIMARY, BTN_SECONDARY, HATCH, Icon } from '../components/content/shared'
import { RegionSwatch } from '../components/layout/marks'
import { formatClock } from '../components/practice/logic'
import type { QuizEntry } from '../components/practice/logic'
import { Ticks } from '../components/practice/parts'
import { QuizRunner, SECONDS_PER_QUESTION } from '../components/practice/QuizRunner'
import { getModuleMeta, manifest } from '../content/manifest'
import type { ModuleData } from '../content/types'
import { lastStop, REGION_ORDER, REGIONS, sheetNumber } from '../lib/atlas'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { moduleOfKey, useProgress } from '../store/progress'
import type { QuizStat } from '../store/progress'
import { Segmented } from '../widgets/kit/Segmented'
import { LoadFailures, Loading, NoSheetsYet, PAGE_H2, PracticeTitle, ScopePicker, ScopePreparing, SessionBar } from './practice/parts'
import type { Reading } from './practice/parts'
import {
  ALL_SHEETS,
  drawMistakes,
  drawQuiz,
  entriesIn,
  mistakesOf,
  parseMode,
  parseScope,
  percent,
  pickSize,
  quizOf,
  quizTally,
  quizTallyBySheet,
  scopeLabel,
  scopeWhere,
  sheetName,
  sheetsOf,
  sizeChoices,
  sizeLimit,
  writeMode,
  writeScope,
} from './practice/selection'
import type { ArenaMode, QuizTally, Scope, SizeChoice } from './practice/selection'
import { useReadyModules } from './practice/useReadyModules'
import type { ReadyModules } from './practice/useReadyModules'

/** I passi del numero di domande; oltre c'è "tutte". */
const SIZE_STEPS = [5, 10, 20, 30] as const

const questions = (n: number) => (n === 1 ? '1 domanda' : `${n} domande`)
const minutes = (n: number) => `${Math.ceil((n * SECONDS_PER_QUESTION) / 60)} min`

/** I fogli da cui si pesca: quelli che hanno domande fra le voci date, nell'ordine in cui compaiono. */
const sheetsOfEntries = (entries: readonly QuizEntry[]) => [...new Set(entries.map((e) => moduleOfKey(e.key)))]

/**
 * Com'è fatta l'estrazione di una prova, sotto il nome dell'ambito. La ripartizione "in parti uguali" si dice solo
 * quando ci sono almeno due fogli fra cui dividere: con un foglio solo si dice da quale.
 */
function drawnLabel({ mode, entries, from }: Run): string {
  const n = entries.length
  if (mode === 'errori') return `${questions(n)} ${n === 1 ? "sbagliata l'ultima volta" : "sbagliate l'ultima volta, dalla peggiore"}`
  const drawn = n === 1 ? 'estratta' : 'estratte'
  if (from.length === 1) return `${questions(n)} ${drawn} a caso dal foglio ${sheetNumber(from[0]) ?? from[0]}`
  return `${questions(n)} ${drawn} a caso, in parti uguali fra i ${from.length} fogli`
}

function Title({ readings, sheets = 0 }: { readings?: Reading[]; sheets?: number }) {
  return (
    <PracticeTitle
      title="Quiz"
      subtitle="L'arena delle domande di tutto l'atlante"
      en="Quiz arena: practice, timed exam, mistake review"
      lead={`Allenati con l'esito subito, simula un esame a tempo o ripassa le domande che hai sbagliato. Le domande si pescano a caso${sheets >= 2 ? ", in parti uguali fra i fogli dell'ambito" : ''}.`}
      readings={readings}
    />
  )
}

export default function QuizArena() {
  useDocumentTitle('Quiz')
  const [loaded, retry] = useReadyModules()
  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <Arena loaded={loaded} onRetry={retry} />
    </main>
  )
}

// ---------------------------------------------------------------------------------------------
// L'arena con i fogli caricati
// ---------------------------------------------------------------------------------------------

interface Run {
  /** cambia a ogni prova: un QuizRunner nuovo */
  n: number
  scope: Scope
  mode: ArenaMode
  entries: QuizEntry[]
  /** i fogli fra cui si è pescato */
  from: string[]
}

const NO_MODULES: ModuleData[] = []

// Un solo componente per il caricamento e per l'arena pronta: la testata non si rimonta.
function Arena({ loaded, onRetry }: { loaded: ReadyModules; onRetry: () => void }) {
  const modules = loaded.status === 'ready' ? loaded.modules : NO_MODULES
  const [params, setParams] = useSearchParams()
  const scope = parseScope(params)
  const mode = parseMode(params)
  const setScope = (next: Scope) => setParams((p) => writeScope(p, next), { replace: true })
  const setMode = (next: ArenaMode) => setParams((p) => writeMode(p, next), { replace: true })

  const stats = useProgress((s) => s.quiz)
  const progressModules = useProgress((s) => s.modules)
  const quiz = useMemo(() => quizOf(modules), [modules])
  const ready = useMemo(() => new Set(modules.map((m) => m.id)), [modules])
  const all = quizTally(quiz, stats)

  // quante domande, per ogni modo: l'esame di solito è più lungo dell'allenamento
  const [sizes, setSizes] = useState<Record<ArenaMode, SizeChoice>>({ allenamento: '10', esame: '20', errori: 'tutte' })
  const [run, setRun] = useState<Run | null>(null)

  const setupRef = useRef<HTMLHeadingElement>(null)
  const runRef = useRef<HTMLDivElement>(null)
  const focusNext = useRef<'setup' | 'run' | null>(null)
  useEffect(() => {
    const target = focusNext.current
    if (target === null) return
    focusNext.current = null
    // al via il fuoco va sul testo della prima domanda: si legge, e i tasti 1-9 scelgono subito
    if (target === 'run') runRef.current?.querySelector<HTMLElement>('form [tabindex="-1"]')?.focus()
    else setupRef.current?.focus()
  })

  const inScope = entriesIn(quiz, scope)
  const mistakes = mistakesOf(inScope, stats)
  const pool = mode === 'errori' ? mistakes.length : inScope.length
  const choices = sizeChoices(SIZE_STEPS, pool)
  const chosen = pickSize(sizes[mode], choices)
  const n = Math.min(sizeLimit(chosen), pool)

  function launch() {
    // il seme è l'ora: ogni prova un'estrazione nuova, riproducibile a parità di seme (selection.test.ts)
    const seed = Date.now() >>> 0
    const entries = mode === 'errori' ? drawMistakes(mistakes, n, seed) : drawQuiz(inScope, n, seed)
    const from = sheetsOfEntries(mode === 'errori' ? mistakes : inScope)
    focusNext.current = 'run'
    setRun((r) => ({ n: (r?.n ?? 0) + 1, scope, mode, entries, from }))
  }

  function exit() {
    focusNext.current = 'setup'
    setRun(null)
  }

  /** Dallo storico: il ripasso degli errori di un foglio, pronto da far partire. */
  function reviewSheet(moduleId: string) {
    setParams((p) => writeMode(writeScope(p, { kind: 'foglio', moduleId }), 'errori'), { replace: true })
    focusNext.current = 'setup'
  }

  /** Dallo storico vuoto: l'allenamento su un foglio, pronto da far partire. */
  function trainOn(moduleId: string) {
    setParams((p) => writeMode(writeScope(p, { kind: 'foglio', moduleId }), 'allenamento'), { replace: true })
    focusNext.current = 'setup'
  }

  const stop = lastStop(progressModules)?.moduleId
  const suggested = stop && ready.has(stop) ? stop : (modules[0]?.id ?? manifest[0].id)
  const accuracy = percent(all.correct, all.attempts)
  const withQuestions = sheetsOfEntries(quiz)
  // da dove partire se non hai ancora provato niente: lo spillo, se il foglio ha domande, altrimenti il primo che ne ha
  const firstSheet = stop && withQuestions.includes(stop) ? stop : withQuestions[0]

  return (
    <>
      <Title
        sheets={withQuestions.length}
        readings={
          loaded.status === 'ready'
            ? [
                { label: 'Domande', value: all.total },
                { label: 'Provate', value: `${all.tried} di ${all.total}` },
                { label: 'Accuratezza', value: accuracy === null ? '—' : `${accuracy}%` },
                { label: 'Errori aperti', value: all.mistakes },
              ]
            : undefined
        }
      />
      <div className="mt-10 grid gap-12">
        {loaded.status === 'ready' && <LoadFailures failed={loaded.failed} what="le loro domande" onRetry={onRetry} />}
        {loaded.status === 'loading' ? (
          <Loading what="le domande" />
        ) : modules.length === 0 ? (
          <NoSheetsYet what="le domande dei quiz" />
        ) : run ? (
          <div className="grid max-w-[64rem] gap-6">
            {/* il modo lo dice già la testata della prova (QuizRunner): qui l'ambito e com'è fatta l'estrazione */}
            <SessionBar title={scopeLabel(run.scope)} detail={drawnLabel(run)} exitLabel="Esci dalla prova" onExit={exit} />
            <div ref={runRef}>
              <QuizRunner key={run.n} entries={run.entries} mode={run.mode === 'esame' ? 'esame' : 'allenamento'} onExit={exit} />
            </div>
          </div>
        ) : (
          <>
            <Setup
              headingRef={setupRef}
              scope={scope}
              onScope={setScope}
              mode={mode}
              onMode={setMode}
              quiz={quiz}
              stats={stats}
              ready={ready}
              suggested={suggested}
              choices={choices}
              chosen={chosen}
              onSize={(size) => setSizes((s) => ({ ...s, [mode]: size }))}
              pool={pool}
              n={n}
              total={inScope.length}
              mistakes={mistakes.length}
              onStart={launch}
            />
            <History modules={modules} stats={stats} onReview={reviewSheet} firstSheet={firstSheet} onTrain={trainOn} />
          </>
        )}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------------------------
// Preparazione
// ---------------------------------------------------------------------------------------------

interface SetupProps {
  headingRef: Ref<HTMLHeadingElement>
  scope: Scope
  onScope: (scope: Scope) => void
  mode: ArenaMode
  onMode: (mode: ArenaMode) => void
  quiz: QuizEntry[]
  stats: Readonly<Record<string, QuizStat>>
  ready: ReadonlySet<string>
  suggested: string
  choices: SizeChoice[]
  chosen: SizeChoice
  onSize: (size: SizeChoice) => void
  /** domande fra cui pescare nel modo scelto */
  pool: number
  /** domande della prova */
  n: number
  /** domande dell'ambito */
  total: number
  /** errori aperti dell'ambito */
  mistakes: number
  onStart: () => void
}

function Setup({ headingRef, scope, onScope, mode, onMode, quiz, stats, ready, suggested, choices, chosen, onSize, pool, n, total, mistakes, onStart }: SetupProps) {
  const uid = useId()
  const where = scopeWhere(scope)
  const readyHere = sheetsOf(scope).some((m) => ready.has(m.id))

  const help: Record<ArenaMode, string> = {
    allenamento: 'Esito e spiegazione dopo ogni risposta; la serie conta le risposte giuste di fila.',
    esame: `Un minuto a domanda (${formatClock(n * SECONDS_PER_QUESTION)} in tutto), nessun esito fino alla consegna; puoi tornare indietro e cambiare risposta.`,
    errori: "Le domande che hai sbagliato l'ultima volta, dalla peggiore, con l'esito subito. Quando ne rifai una giusta, esce dal ripasso.",
  }
  const startLabel: Record<ArenaMode, string> = {
    allenamento: "Inizia l'allenamento",
    esame: "Inizia l'esame",
    errori: 'Inizia il ripasso',
  }

  let launcher
  if (!readyHere) {
    launcher = <ScopePreparing scope={scope} what="le sue domande" onAll={() => onScope(ALL_SHEETS)} />
  } else if (total === 0) {
    launcher = (
      <p className="m-0 flex items-center gap-3 border border-border bg-surface p-4 text-muted">
        <Icon name="info" />
        Non ci sono ancora domande {where}.
      </p>
    )
  } else {
    launcher = (
      <div className="relative grid justify-items-start gap-5 border-2 border-border-strong bg-surface p-4 sm:p-6">
        <Ticks />
        <div className="grid w-full gap-2">
          <Segmented<ArenaMode>
            id={`${uid}-mode`}
            label="Modo"
            value={mode}
            onChange={onMode}
            options={[
              { value: 'allenamento', label: 'Allenamento' },
              { value: 'esame', label: 'Esame a tempo' },
              { value: 'errori', label: `Ripasso degli errori · ${mistakes}` },
            ]}
          />
          <p aria-live="polite" className="m-0 max-w-[var(--measure)] text-[length:var(--step--1)] text-muted">
            {help[mode]}
          </p>
        </div>
        {mode === 'errori' && pool === 0 ? (
          <div className="grid justify-items-start gap-3">
            <p className="m-0 flex items-center gap-3 font-label text-[length:var(--step-1)] leading-tight font-bold">
              <Icon name="check" className="text-ok" />
              Nessun errore aperto {where}.
            </p>
            <p className="m-0 max-w-[var(--measure)] text-muted">Le domande che sbagli finiscono qui finché non le rifai giuste.</p>
            <button type="button" className={BTN_SECONDARY} onClick={() => onMode('allenamento')}>
              Passa all'allenamento
            </button>
          </div>
        ) : (
          <>
            {choices.length > 1 && (
              <div className="w-full max-w-md">
                <Segmented<SizeChoice>
                  id={`${uid}-size`}
                  label="Domande"
                  value={chosen}
                  onChange={onSize}
                  options={choices.map((c) => ({ value: c, label: c === 'tutte' ? 'Tutte' : c }))}
                />
              </div>
            )}
            <button type="button" className={BTN_PRIMARY} onClick={onStart}>
              <Icon name="arrow" size={18} />
              {startLabel[mode]}
              <span className="num tracking-normal normal-case">
                · {questions(n)}
                {mode === 'esame' ? `, ${minutes(n)}` : ''}
              </span>
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <section aria-labelledby={`${uid}-h`} className="grid max-w-[64rem] min-w-0 content-start gap-5">
      <h2 id={`${uid}-h`} ref={headingRef} tabIndex={-1} className={PAGE_H2}>
        Prepara la prova
      </h2>
      <ScopePicker
        id={`${uid}-scope`}
        scope={scope}
        onChange={onScope}
        ready={ready}
        suggestedSheet={suggested}
        readings={(s) => {
          const t = quizTally(entriesIn(quiz, s), stats)
          return [
            { label: t.total === 1 ? 'domanda' : 'domande', value: t.total },
            { label: 'da ripassare', value: t.mistakes },
          ]
        }}
      />
      {launcher}
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Storico dell'accuratezza
// ---------------------------------------------------------------------------------------------

const formatDay = (ms: number) => new Date(ms).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

/**
 * Barra dell'accuratezza: il campo a inchiostro è l'ultimo tentativo di ogni domanda, la tacca ocra tutti i
 * tentativi. Decorativa: le cifre accanto dicono lo stesso. Il campo sale una volta sola, all'apertura.
 */
function Meter({ value, mark }: { value: number; mark: number }) {
  return (
    <span aria-hidden="true" className="relative block h-3 w-16 shrink-0 border border-border-strong bg-surface">
      <span
        className="absolute inset-y-0 left-0 origin-left bg-accent transition-[scale] duration-[var(--dur-slow)] ease-[var(--ease-out)] motion-safe:starting:scale-x-0"
        style={{ width: `${value}%` }}
      />
      <span className="absolute -inset-y-1 w-[3px] bg-pin shadow-[0_0_0_1px_var(--surface)]" style={{ left: `calc(${mark}% - 1.5px)` }} />
    </span>
  )
}

function HistoryRow({ moduleId, tally, onReview }: { moduleId: string; tally: QuizTally; onReview: (moduleId: string) => void }) {
  const title = getModuleMeta(moduleId)?.title ?? moduleId
  const number = sheetNumber(moduleId)
  const current = percent(tally.lastRight, tally.tried)
  const overall = percent(tally.correct, tally.attempts)
  return (
    <tr className="border-t border-border align-top">
      <th scope="row" className="px-3 py-3 text-left font-normal">
        <Link to={`/m/${moduleId}/quiz`} className="font-label font-bold">
          {sheetName(moduleId, title)}
        </Link>
        <p className="m-0 mt-0.5 text-[length:var(--step--1)] text-muted">
          {tally.tried === 0
            ? `${questions(tally.total)}, mai provate`
            : `${tally.tried} di ${tally.total} provate · ultima prova ${formatDay(tally.lastAt)}`}
        </p>
      </th>
      <td className="px-3 py-3">
        {current === null || overall === null ? (
          <span className="text-muted">—</span>
        ) : (
          <div className="grid gap-1">
            <span className="flex items-center gap-2.5">
              <Meter value={current} mark={overall} />
              <span className="whitespace-nowrap">
                <span className="num text-text">{current}%</span> <span className="text-[length:var(--step--1)] text-muted">ora</span>
              </span>
            </span>
            <span className="text-[length:var(--step--1)] text-muted">
              {overall}% in tutto, su {tally.attempts} {tally.attempts === 1 ? 'tentativo' : 'tentativi'}
            </span>
          </div>
        )}
      </td>
      <td className="px-3 py-3 text-right">
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <span className={`num ${tally.mistakes > 0 ? 'text-text' : 'text-muted'}`}>{tally.mistakes}</span>
          {tally.mistakes > 0 && (
            <button type="button" className={BTN_SECONDARY} onClick={() => onReview(moduleId)}>
              Ripassa <span className="visually-hidden">gli errori del foglio {number}</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

interface HistoryProps {
  modules: ModuleData[]
  stats: Readonly<Record<string, QuizStat>>
  onReview: (moduleId: string) => void
  /** il foglio da cui cominciare quando lo storico è vuoto */
  firstSheet?: string
  onTrain: (moduleId: string) => void
}

/**
 * Lo storico per foglio. Vuoto finché non rispondi a un quiz: una frase e da dove partire, non una tabella di zeri.
 * Poi le righe dei fogli provati; gli altri fogli pronti e quelli in preparazione si aprono con "Mostra tutti i fogli".
 */
function History({ modules, stats, onReview, firstSheet, onTrain }: HistoryProps) {
  const uid = useId()
  const bySheet = quizTallyBySheet(modules, stats)
  const [all, setAll] = useState(false)
  const tried = (id: string) => (bySheet.get(id)?.tried ?? 0) > 0
  const touched = [...bySheet.keys()].filter(tried).length
  const rest = bySheet.size - touched

  if (touched === 0) {
    return (
      <section aria-labelledby={uid} className="grid max-w-[64rem] min-w-0 justify-items-start gap-4">
        <h2 id={uid} className={`${PAGE_H2} justify-self-stretch`}>
          Storico dell'accuratezza
        </h2>
        <p className="m-0 max-w-[var(--measure)] text-muted">
          Non hai ancora risposto a nessun quiz: lo storico si riempie foglio per foglio dalla prima risposta, con l'accuratezza e gli errori da
          ripassare.
        </p>
        {firstSheet && (
          <button type="button" className={BTN_SECONDARY} onClick={() => onTrain(firstSheet)}>
            Allenati sul foglio {sheetNumber(firstSheet) ?? firstSheet}
            <Icon name="arrow" size={18} />
          </button>
        )}
      </section>
    )
  }

  return (
    <section aria-labelledby={uid} className="grid max-w-[64rem] min-w-0 gap-4">
      <h2 id={uid} className={PAGE_H2}>
        Storico dell'accuratezza
      </h2>
      <p className="m-0 max-w-[var(--measure)] text-muted">
        Per ogni foglio pronto: quante domande hai provato; l'accuratezza di adesso, cioè dell'ultimo tentativo di ogni domanda (la barra), e quella
        di tutti i tentativi (la tacca ocra), la stessa della testata; gli errori ancora aperti, da ripassare.
      </p>
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse border border-border-strong bg-surface">
          <caption className="visually-hidden">Storico dell'accuratezza per foglio</caption>
          <thead>
            <tr className="border-b border-border-strong">
              <th scope="col" className="label px-3 py-2 text-left font-normal">
                Foglio
              </th>
              <th scope="col" className="label px-3 py-2 text-left font-normal">
                Accuratezza
              </th>
              <th scope="col" className="label px-3 py-2 text-right font-normal">
                Errori aperti
              </th>
            </tr>
          </thead>
          {REGION_ORDER.map((course) => {
            const sheets = manifest.filter((m) => m.course === course)
            const readySheets = sheets.filter((m) => bySheet.has(m.id))
            const rows = all ? readySheets : readySheets.filter((m) => tried(m.id))
            const waiting = sheets.length - readySheets.length
            // a righe chiuse una regione senza fogli provati non occupa spazio
            if (rows.length === 0 && !all) return null
            return (
              <tbody key={course} className="border-t-2 border-border-strong">
                <tr className="bg-surface-2">
                  <th scope="colgroup" colSpan={3} className="px-3 py-2 text-left font-normal">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <RegionSwatch course={course} />
                      <span className="font-label font-bold">{REGIONS[course].name}</span>
                      <span className="num text-[length:var(--step--1)] text-muted">
                        {readySheets.length} di {sheets.length} fogli pronti
                      </span>
                    </span>
                  </th>
                </tr>
                {rows.map((m) => (
                  <HistoryRow key={m.id} moduleId={m.id} tally={bySheet.get(m.id) as QuizTally} onReview={onReview} />
                ))}
                {all && waiting > 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={3} className={`px-3 py-2 ${HATCH}`}>
                      <span className="bg-surface px-1 text-[length:var(--step--1)] text-muted">
                        {waiting === 1 ? '1 foglio in preparazione' : `${waiting} fogli in preparazione`}: le loro domande arrivano con i contenuti.
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            )
          })}
        </table>
      </div>
      {(rest > 0 || modules.length < manifest.length) && (
        <button type="button" aria-expanded={all} className={`${BTN_SECONDARY} justify-self-start`} onClick={() => setAll((a) => !a)}>
          <Icon name="chevron" size={18} className={all ? 'rotate-180' : undefined} />
          {all ? 'Solo i fogli provati' : rest > 0 ? `Mostra tutti i fogli (${rest} ${rest === 1 ? 'altro' : 'altri'})` : 'Mostra tutti i fogli'}
        </button>
      )}
    </section>
  )
}
