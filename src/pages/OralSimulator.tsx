// Simulatore dell'orale (/orale). Si prepara la prova (parte del corso, quali domande, quante, tempo per
// risposta), si estraggono le domande con un'estrazione pesata sulle meno ripassate, e per ognuna si risponde
// ad alta voce con il cronometro e la scala del tempo; poi si rivela traccia e risposta modello (o, per le
// domande della banca senza foglio pronto, i fogli di riferimento) e ci si dà un voto da 0 a 3, che finisce
// nello storico con recordExam. Alla fine l'esito della prova.
// Sotto la preparazione: il quadro delle domande reali della banca (se ne può provare una sola) e il registro
// delle ultime simulazioni.
//
// Funziona con qualunque numero di fogli pronti (loadReadySheets, un foglio alla volta): senza fogli la banca
// resta tutta disponibile, con il testo italiano e inglese e i fogli di riferimento al posto della risposta
// modello; un foglio che non si carica si segnala con "Riprova" e gli altri restano.
// Parametri dell'indirizzo, tutti facoltativi: ?parte=melgani|passerini|ricci|mista, ?modo=banca|fogli,
// ?seme=<intero> per ripetere un'estrazione (vale per la prima estrazione della visita). Con il seme
// l'estrazione non guarda lo storico (pesi tutti uguali): con gli stessi fogli pronti esce sempre la stessa
// prova. Senza seme l'estrazione preferisce le domande meno ripassate e non si può ripetere, quindi il numero
// non si mostra.
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BTN_PRIMARY, BTN_SECONDARY, HATCH, Icon } from '../components/content/shared'
import { Rich } from '../components/content/Rich'
import { RegionSwatch } from '../components/layout/marks'
import { ALL_REGIONS } from '../components/layout/RegionFilter'
import { formatClock, formatNumber, SCORE_LABEL } from '../components/practice/logic'
import type { ExamScore } from '../components/practice/logic'
import { StampMark, Stat, Track } from '../components/practice/parts'
import { examBank, reportOf } from '../content/exam-bank'
import { manifest } from '../content/manifest'
import type { CourseId, ModuleData } from '../content/types'
import { REGIONS, sheetNumber } from '../lib/atlas'
import { loadReadySheets } from '../lib/readySheets'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { useProgress } from '../store/progress'
import { BankBoard } from './oral/BankBoard'
import { bankStats, buildPool, drawSession, PART_ORDER, PART_WHAT, poolSize } from './oral/logic'
import type { OralItem, OralMode, OralPart } from './oral/logic'
import { QuestionDesk } from './oral/QuestionDesk'
import { Registro } from './oral/Registro'
import type { SpeechLang } from './oral/useSpeech'
import { LoadFailures } from './practice/parts'
import { HEAD_READINGS, PAGE_SUBTITLE, PAGE_TITLE, PAGE_TITLE_COMPACT, TICKS } from './global/ui'

const H2 = 'm-0 flex flex-wrap items-baseline gap-x-3 border-t-2 border-border-strong pt-3 font-label text-[length:var(--step-2)] leading-tight font-bold'


/** I comandi a inchiostro non hanno uno stato spento: qui serve, quando non c'è niente da estrarre. */
const OFF = 'disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-faint disabled:hover:bg-transparent disabled:hover:text-faint'

const COUNTS = [1, 3, 5, 10] as const
const MINUTES = [3, 5, 8] as const

// la parte che mescola le tre regioni ha la dicitura del filtro per regione delle altre pagine
const PART_LABEL: Record<OralPart, string> = { melgani: 'Melgani', passerini: 'Passerini', ricci: 'Ricci', mista: ALL_REGIONS }
const MODE_LABEL: Record<OralMode, string> = { banca: "Banca d'esame", fogli: 'Fogli pronti' }

interface Settings {
  part: OralPart
  mode: OralMode
  count: number
  minutes: number
}

type Result = { score: ExamScore; seconds?: number } | 'saltata' | null

interface Session {
  items: OralItem[]
  index: number
  results: Result[]
  /** null = domanda scelta dal quadro */
  seed: number | null
  /** estrazione ripetibile: il seme viene dall'indirizzo e i pesi non guardano lo storico */
  repeatable: boolean
  settings: Settings
  finished: boolean
}

function readSettings(params: URLSearchParams): Settings {
  const part = PART_ORDER.find((p) => p === params.get('parte')) ?? 'melgani'
  const mode: OralMode = params.get('modo') === 'fogli' ? 'fogli' : 'banca'
  return { part, mode, count: 3, minutes: 5 }
}

const freshSeed = () => (Date.now() % 1_000_000_000) + 1

// ---------------------------------------------------------------------------------------------
// Pezzi della preparazione
// ---------------------------------------------------------------------------------------------

function Choices({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  const id = useId()
  return (
    <div className="grid gap-2">
      <p id={id} className="label m-0 text-text">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className={className}>
        {children}
      </div>
    </div>
  )
}

interface ChoiceProps {
  name: string
  checked: boolean
  disabled?: boolean
  onSelect: () => void
  children: ReactNode
  className?: string
}

/** Un tassello da scegliere: radio vero, nascosto; il tassello si inchiostra quando è scelto. */
function Choice({ name, checked, disabled = false, onSelect, children, className = '' }: ChoiceProps) {
  return (
    <label
      className={
        'group relative -mt-px -ml-px flex min-h-11 cursor-pointer border border-border-strong bg-surface text-text transition-[background-color,color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2 ' +
        'has-[:checked]:bg-accent has-[:checked]:text-accent-contrast has-[:focus-visible]:z-10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ' +
        `has-[:disabled]:cursor-not-allowed has-[:disabled]:border-border has-[:disabled]:text-faint has-[:disabled]:hover:bg-surface ${className}`
      }
    >
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onSelect} className="sr-only" />
      {disabled && <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${HATCH}`} />}
      {children}
    </label>
  )
}

const SUB = 'text-[length:var(--step--1)] text-muted group-has-[:checked]:text-accent-contrast group-has-[:disabled]:text-faint'

function PartSwatches({ part }: { part: OralPart }) {
  const courses: CourseId[] = part === 'mista' ? ['melgani', 'passerini', 'ricci'] : [part]
  return (
    <span className="flex gap-0.5">
      {courses.map((c) => (
        <RegionSwatch key={c} course={c} />
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------------------------
// La pagina
// ---------------------------------------------------------------------------------------------

export default function OralSimulator() {
  useDocumentTitle("Simulatore dell'orale")
  const [params] = useSearchParams()
  const entries = useProgress((s) => s.exam)
  const [sheets, setSheets] = useState<ModuleData[] | null>(null)
  const [failed, setFailed] = useState<string[]>([])
  const [attempt, setAttempt] = useState(0)
  const [settings, setSettings] = useState<Settings>(() => readSettings(params))
  const [session, setSession] = useState<Session | null>(null)
  const [lang, setLang] = useState<SpeechLang>('en-US')
  const paramSeedUsed = useRef(false)
  const setupId = useId()
  const boardId = useId()
  const logId = useId()
  // "Prepara un'altra prova" smonta l'esito: il fuoco va sul titolo della preparazione
  const setupHeading = useRef<HTMLHeadingElement>(null)
  const focusSetup = useRef(false)

  useEffect(() => {
    let alive = true
    loadReadySheets({ lists: ['exam'] }).then(({ modules, failed: lost }) => {
      if (!alive) return
      setSheets(modules)
      setFailed(lost)
    })
    return () => {
      alive = false
    }
  }, [attempt])

  useEffect(() => {
    if (session !== null || !focusSetup.current) return
    focusSetup.current = false
    setupHeading.current?.focus()
  }, [session])

  function prepareAgain() {
    focusSetup.current = true
    setSession(null)
  }

  const ready = useMemo(() => sheets ?? [], [sheets])
  const bankPool = useMemo(() => buildPool('banca', 'mista', ready), [ready])
  const stats = useMemo(() => bankStats(bankPool, entries), [bankPool, entries])
  const available = poolSize(settings.mode, settings.part, ready)
  const toDraw = Math.min(settings.count, available)

  function start(s: Settings) {
    const fromUrl = Number(params.get('seme'))
    const useUrl = !paramSeedUsed.current && Number.isInteger(fromUrl) && fromUrl > 0
    const seed = useUrl ? fromUrl : freshSeed()
    paramSeedUsed.current = true
    // con il seme dell'indirizzo lo storico non conta: la stessa prova si ripete anche dopo averla fatta
    const history = useUrl ? [] : useProgress.getState().exam
    const items = drawSession(buildPool(s.mode, s.part, ready), history, s.count, seed, Date.now())
    if (items.length === 0) return
    setSession({ items, index: 0, results: items.map(() => null), seed, repeatable: useUrl, settings: s, finished: false })
  }

  function tryOne(item: OralItem) {
    setSession({ items: [item], index: 0, results: [null], seed: null, repeatable: false, settings: { ...settings, count: 1 }, finished: false })
  }

  function reload() {
    setSheets(null)
    setFailed([])
    setAttempt((n) => n + 1)
  }

  // durante la prova la testata si riduce a una riga: la domanda deve stare nel primo schermo
  const header = session && !session.finished ? (
    <header className="max-w-[64rem] border-2 border-border-strong bg-surface">
      <div aria-hidden="true" className="h-2.5 border-b border-border-strong" style={TICKS} />
      <h1 className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3">
        <span className={PAGE_TITLE_COMPACT}>Orale</span>
        <span className="font-label text-[length:var(--step-1)] leading-tight font-bold">Simulatore d'esame</span>
        <span lang="en" className="font-body text-[length:var(--step--1)] font-normal text-muted italic">
          Oral exam simulator
        </span>
      </h1>
    </header>
  ) : (
    <header className="border-2 border-border-strong bg-surface">
      <div aria-hidden="true" className="h-2.5 border-b border-border-strong" style={TICKS} />
      <div className="grid items-end gap-6 p-5 @3xl:grid-cols-[minmax(0,1fr)_auto] @3xl:p-8">
        <div className="min-w-0">
          <h1 className="m-0">
            <span className={PAGE_TITLE}>Orale</span>
            <span className={PAGE_SUBTITLE}>Simulatore d'esame</span>
          </h1>
          <p lang="en" className="m-0 mt-2 text-[length:var(--step-1)] text-muted italic">
            Oral exam simulator
          </p>
          <p className="m-0 mt-4 max-w-[var(--measure)]">
            Estrai le domande come all'esame, rispondi ad alta voce mentre il tempo scorre, poi confronta con la traccia e datti un voto. L'estrazione torna sulle domande che hai ripassato meno.
          </p>
        </div>
        <dl className={HEAD_READINGS}>
          <dt className="label">Banca</dt>
          <dd className="num m-0">
            {examBank.length} domande reali · {new Set(examBank.map((q) => reportOf(q.id))).size} resoconti
          </dd>
          <dt className="label">Fogli pronti</dt>
          <dd className="num m-0">{sheets === null ? '…' : `${ready.length} di ${manifest.length}`}</dd>
          <dt className="label">Simulazioni</dt>
          <dd className="num m-0">{entries.length}</dd>
        </dl>
      </div>
    </header>
  )

  let body: ReactNode
  if (sheets === null) {
    body = (
      <p role="status" className="label m-0 mt-10">
        Apro i fogli pronti…
      </p>
    )
  } else if (session && !session.finished) {
    body = <SessionView session={session} setSession={setSession} lang={lang} onLang={setLang} />
  } else {
    body = (
      <>
        {session?.finished && <Summary session={session} onAgain={() => start(session.settings)} onSetup={prepareAgain} />}

        {!session && (
          <section aria-labelledby={setupId} className="mt-10 grid gap-4">
            <h2 id={setupId} ref={setupHeading} tabIndex={-1} className={`${H2} outline-offset-4`}>
              Prepara la prova
              <span lang="en" className="font-body text-[length:var(--step-1)] font-normal text-muted italic">
                Set up the exam
              </span>
            </h2>
            <LoadFailures
              failed={failed}
              effect="le sue domande restano nella banca, con i fogli di riferimento al posto della risposta modello"
              onRetry={reload}
            />
            <div className="grid gap-8 border-2 border-border-strong bg-surface p-4 @3xl:p-6 @5xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <div className="grid content-start gap-6">
                <Choices label="Parte del corso" className="grid grid-cols-2 pt-px pl-px @3xl:grid-cols-4">
                  {PART_ORDER.map((part) => {
                    const n = poolSize(settings.mode, part, ready)
                    return (
                      <Choice key={part} name="parte" checked={settings.part === part} disabled={n === 0} onSelect={() => setSettings({ ...settings, part })}>
                        <span className="relative grid w-full content-start gap-1.5 p-3">
                          <span className="flex items-center gap-2">
                            <PartSwatches part={part} />
                            <span className="font-label text-[length:var(--step-1)] leading-tight font-bold">{PART_LABEL[part]}</span>
                          </span>
                          <span className={SUB}>{PART_WHAT[part]}</span>
                          <span className={`num ${SUB}`}>{n === 0 ? 'nessun foglio pronto' : `${n} ${n === 1 ? 'domanda' : 'domande'}`}</span>
                        </span>
                      </Choice>
                    )
                  })}
                </Choices>

                <Choices label="Domande" className="grid pt-px pl-px @3xl:grid-cols-2">
                  {(['banca', 'fogli'] as const).map((mode) => {
                    const n = poolSize(mode, 'mista', ready)
                    const text =
                      mode === 'banca'
                        ? `Solo le ${n} domande reali. Dove il foglio non è pronto hai il testo in italiano e in inglese e i fogli di riferimento.`
                        : n === 0
                          ? 'Nessun foglio è ancora pronto: arriveranno nei prossimi giorni.'
                          : `Tutte le domande d'orale dei fogli pronti: ${n} da ${ready.length} ${ready.length === 1 ? 'foglio' : 'fogli'}, con traccia e risposta modello.`
                    return (
                      <Choice key={mode} name="modo" checked={settings.mode === mode} disabled={n === 0} onSelect={() => setSettings({ ...settings, mode })}>
                        <span className="relative grid w-full content-start gap-1.5 p-3">
                          <span className="flex items-center gap-2 font-label text-[length:var(--step-1)] leading-tight font-bold">
                            <Icon name={mode === 'banca' ? 'pin' : 'page'} size={18} />
                            {MODE_LABEL[mode]}
                          </span>
                          <span className={SUB}>{text}</span>
                        </span>
                      </Choice>
                    )
                  })}
                </Choices>
              </div>

              <div className="grid content-start gap-6 @5xl:border-l @5xl:border-border @5xl:pl-6">
                <Choices label="Quante domande" className="flex pt-px pl-px">
                  {COUNTS.map((c) => (
                    <Choice key={c} name="quante" checked={settings.count === c} onSelect={() => setSettings({ ...settings, count: c })} className="min-w-12 flex-1">
                      <span className="num grid w-full place-items-center px-3 py-2 text-[length:var(--step-1)]">{c}</span>
                    </Choice>
                  ))}
                </Choices>
                <Choices label="Tempo per risposta" className="flex pt-px pl-px">
                  {MINUTES.map((m) => (
                    <Choice key={m} name="tempo" checked={settings.minutes === m} onSelect={() => setSettings({ ...settings, minutes: m })} className="flex-1">
                      <span className="num grid w-full place-items-center px-3 py-2">{m} min</span>
                    </Choice>
                  ))}
                </Choices>
                <div className="grid gap-3 border-t border-border pt-5">
                  <button type="button" className={`${BTN_PRIMARY} ${OFF} justify-self-start`} disabled={available === 0} onClick={() => start(settings)}>
                    {available === 0 ? 'Niente da estrarre' : `Estrai ${toDraw} ${toDraw === 1 ? 'domanda' : 'domande'}`}
                    <Icon name="arrow" size={18} />
                  </button>
                  <p className="m-0 max-w-[48ch] text-[length:var(--step--1)] text-muted">
                    {available === 0
                      ? `${settings.part === 'mista' ? 'In nessuna regione' : `Per ${PART_LABEL[settings.part]} non`} c'è ancora un foglio pronto: scegli la banca d'esame.`
                      : available < settings.count
                        ? `Ce ne sono solo ${available}: le estraggo tutte, in ordine casuale.`
                        : "L'estrazione preferisce le domande che non hai mai provato, quelle in cui ti sei dato un voto basso e quelle che non ripassi da giorni."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section aria-labelledby={boardId} className="mt-14 grid gap-4">
          <h2 id={boardId} className={H2}>
            Quadro della banca
            <span lang="en" className="font-body text-[length:var(--step-1)] font-normal text-muted italic">
              Question bank
            </span>
          </h2>
          <p className="m-0 max-w-[var(--measure)] text-muted">
            Ogni tassello è una domanda reale d'esame, dal documento dei resoconti degli studenti. Sceglila con un clic o con le frecce, leggila in italiano e in inglese e provala da sola.
          </p>
          <BankBoard pool={bankPool} stats={stats} onTry={tryOne} />
        </section>

        <section aria-labelledby={logId} className="mt-14 grid gap-4">
          <h2 id={logId} className={H2}>
            Registro
            <span lang="en" className="font-body text-[length:var(--step-1)] font-normal text-muted italic">
              Practice log
            </span>
          </h2>
          <Registro entries={entries} sheets={ready} bankPool={bankPool} stats={stats} />
        </section>
      </>
    )
  }

  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      {header}
      {body}
    </main>
  )
}

// ---------------------------------------------------------------------------------------------
// La prova in corso
// ---------------------------------------------------------------------------------------------

function SessionView({ session, setSession, lang, onLang }: { session: Session; setSession: (s: Session) => void; lang: SpeechLang; onLang: (l: SpeechLang) => void }) {
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  const { items, index, results, settings, seed, repeatable } = session
  const item = items[index]
  const total = items.length
  const last = index === total - 1
  const result = results[index]
  const graded = result !== null && result !== 'saltata'

  // a ogni domanda il fuoco va sul suo titolo: chi usa la tastiera o un lettore di schermo riparte da lì
  useEffect(() => {
    heading.current?.focus()
  }, [index])

  // dato il voto, i tasti del voto spariscono: il fuoco passa al comando che porta avanti
  useEffect(() => {
    if (graded) next.current?.focus()
  }, [graded])

  function setResult(r: Result) {
    const results2 = [...results]
    results2[index] = r
    return results2
  }

  function advance(r: Result) {
    const res = setResult(r)
    if (last) setSession({ ...session, results: res, finished: true })
    else setSession({ ...session, results: res, index: index + 1 })
  }

  const sheetMeta = item.sheet ? manifest.find((m) => m.id === item.sheet?.moduleId) : undefined

  return (
    <section aria-labelledby={headingId} className="mt-6 grid max-w-[64rem] gap-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-2 border-border-strong bg-surface px-4 py-3">
        <h2 id={headingId} ref={heading} tabIndex={-1} className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold">
          Domanda {index + 1} di {total}
        </h2>
        <Track total={total} done={index} current={index} />
        <span className="label flex items-center gap-2">
          <PartSwatches part={seed === null ? item.course : settings.part} />
          {seed === null ? 'Scelta dal quadro' : `${PART_LABEL[settings.part]} · ${MODE_LABEL[settings.mode]}`}
        </span>
        {repeatable && <span className="num text-[length:var(--step--1)] text-muted">Seme {seed}</span>}
        <button type="button" className={`${BTN_SECONDARY} ml-auto`} onClick={() => setSession({ ...session, finished: true })}>
          Termina la prova
        </button>
      </div>

      <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[length:var(--step--1)] text-muted">
        {item.bank && <span className="label">Banca · domanda {item.bank.id}</span>}
        {sheetMeta ? (
          <span>
            dal <span className="num">Foglio {sheetNumber(sheetMeta.id)}</span> · {sheetMeta.title}
          </span>
        ) : (
          <span>il foglio con la risposta modello è in preparazione</span>
        )}
      </p>

      {/* flusso a blocchi: nessun margine doppio intorno alla cornice (my-8) */}
      <div className="-my-8">
        <QuestionDesk
          key={`${index}-${item.id}`}
          item={item}
          number={index + 1}
          total={total}
          minutes={settings.minutes}
          lang={lang}
          onLang={onLang}
          onGrade={(score, seconds) => setSession({ ...session, results: setResult(seconds === undefined ? { score } : { score, seconds }) })}
          onRetry={() => setSession({ ...session, results: setResult(null) })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t-2 border-border-strong pt-4">
        {graded ? (
          <button ref={next} type="button" className={BTN_PRIMARY} onClick={() => advance(result)}>
            {last ? "Vedi l'esito della prova" : 'Prossima domanda'}
            <Icon name="arrow" size={18} />
          </button>
        ) : (
          <button type="button" className={BTN_SECONDARY} onClick={() => advance('saltata')}>
            {last ? "Salta e vedi l'esito" : 'Salta la domanda'}
          </button>
        )}
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          {graded ? 'Voto registrato nello storico.' : 'Rispondi, rivela e datti un voto; oppure salta: la domanda resterà fra quelle da ripassare.'}
        </p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Esito
// ---------------------------------------------------------------------------------------------

function Summary({ session, onAgain, onSetup }: { session: Session; onAgain: () => void; onSetup: () => void }) {
  const id = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  const { items, results, seed, repeatable, settings } = session
  const scored = results.flatMap((r) => (r !== null && r !== 'saltata' ? [r] : []))
  const mean = scored.length > 0 ? scored.reduce((s, r) => s + r.score, 0) / scored.length : null
  const time = scored.reduce((s, r) => s + (r.seconds ?? 0), 0)

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <section aria-labelledby={id} className="mt-10 grid max-w-[64rem] gap-5">
      <h2 id={id} ref={heading} tabIndex={-1} className={H2}>
        Esito della prova
        <span lang="en" className="font-body text-[length:var(--step-1)] font-normal text-muted italic">
          Result
        </span>
      </h2>
      <div className="flex flex-wrap items-end gap-x-10 gap-y-3">
        <Stat label="Valutate" value={`${scored.length} di ${items.length}`} />
        {mean !== null && <Stat label="Media" value={`${formatNumber(Math.round(mean * 10) / 10)} su 3`} pinned />}
        {time > 0 && <Stat label="Tempo di risposta" value={formatClock(time)} />}
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          {seed === null ? 'Domanda scelta dal quadro' : `${PART_LABEL[settings.part]} · ${MODE_LABEL[settings.mode]}`}
          {repeatable && <span className="num"> · Seme {seed}</span>}
        </p>
      </div>
      <ol className="m-0 grid list-none gap-0 p-0">
        {items.map((item, i) => {
          const r = results[i]
          return (
            <li key={item.id} className="-mt-px grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-2 border border-border-strong bg-surface p-3 @3xl:grid-cols-[auto_minmax(0,1fr)_auto]">
              <span className={`num grid size-8 place-items-center border border-border-strong ${REGIONS[item.course].field}`}>{i + 1}</span>
              <span className="min-w-0">
                <span className="line-clamp-3">
                  <Rich text={item.question.q} inline />
                </span>
                {item.bank && <span className="label mt-1 block">Banca · {item.bank.id}</span>}
              </span>
              <span className="col-start-2 flex flex-wrap items-center gap-3 @3xl:col-start-3 @3xl:justify-end">
                {r === null || r === 'saltata' ? (
                  <span className="label">{r === 'saltata' ? 'Saltata' : 'Non valutata'}</span>
                ) : (
                  <>
                    <StampMark size="s" tone={r.score >= 2 ? 'ok' : r.score === 1 ? 'ink' : 'error'}>
                      Voto {r.score} su 3 · {SCORE_LABEL[r.score]}
                    </StampMark>
                    {r.seconds !== undefined && <span className="num text-[length:var(--step--1)] text-muted">{formatClock(r.seconds)}</span>}
                  </>
                )}
              </span>
            </li>
          )
        })}
      </ol>
      <div className="flex flex-wrap gap-3">
        {seed !== null && (
          <button type="button" className={BTN_PRIMARY} onClick={onAgain}>
            <Icon name="reset" size={18} />
            Nuova estrazione
          </button>
        )}
        <button type="button" className={seed === null ? BTN_PRIMARY : BTN_SECONDARY} onClick={onSetup}>
          Prepara un'altra prova
        </button>
        <Link to="/progressi" className={`${BTN_SECONDARY} no-underline`}>
          Vedi i progressi
        </Link>
      </div>
    </section>
  )
}
