// Progressi (/progressi): il rilievo sul campo di tutto l'atlante. Fogli per stato, flashcard ripassate e in
// scadenza, accuratezza dei quiz per foglio, simulazioni d'orale con i voti, sfide dei widget completate e la
// serie di giorni di studio. In fondo "Salva e ripristina": backup JSON da scaricare, backup da caricare (letto e
// mostrato prima di sostituire qualcosa) e azzeramento con una seconda conferma.
// I dati vengono dallo store dei progressi (src/store/progress.ts) e dai data.ts dei fogli pronti: i totali
// (carte, domande, widget) ci sono solo per i fogli caricati, il resto conta con quello che c'è nello store.
// Connettori consultati (Magic UI "file upload", ui-layouts "file-upload", "confirm"): zone di trascinamento
// con anteprime e dialoghi modali. Qui basta un input file nativo con l'etichetta a forma di tasto e una conferma
// in linea a due passi: nessuna interruzione modale per un'azione che si fa di rado e si può annullare prima.
import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Rich } from '../components/content/Rich'
import { BTN_PRIMARY, BTN_SECONDARY, Icon } from '../components/content/shared'
import { StatusMark } from '../components/layout/marks'
import { formatClock, SCORE_LABEL } from '../components/practice/logic'
import type { ExamScore } from '../components/practice/logic'
import { getModuleMeta, manifest } from '../content/manifest'
import type { ModuleData } from '../content/types'
import { sheetNumber, STATUS_LABEL } from '../lib/atlas'
import {
  accuracy,
  backupFileName,
  backupSummary,
  cardRows,
  challengeRows,
  examSummary,
  formatDay,
  isEmptyProgress,
  quizRows,
  sheetsByStatus,
} from '../lib/progressSummary'
import type { BackupSummary } from '../lib/progressSummary'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { useReadyModules } from '../lib/useReadyModules'
import { activeStreak, moduleOfKey, parseBackup, selectProgressData, useProgress } from '../store/progress'
import type { ExamEntry, ModuleStatus, ProgressData } from '../store/progress'
import { PageHead, Reading, SectionHead } from './global/PageHead'
import { NUM_CELL, PAGE, TABLE, TH } from './global/ui'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const percent = (x: number) => `${Math.round(x * 100)}%`
const decimal = (x: number) => x.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const when = (ms: number) => new Date(ms).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Ordine delle colonne dei fogli: prima ciò che hai fatto, poi ciò che resta. */
const STATUS_ORDER: readonly ModuleStatus[] = ['completato', 'da-ripassare', 'in-corso', 'da-iniziare']

/** Numero e titolo del foglio, come collegamento (alto almeno 40 px); un id che il manifest non conosce resta scritto com'è. */
function SheetName({ id, to }: { id: string; to?: string }) {
  const meta = getModuleMeta(id)
  if (!meta) return <span className="num">{id}</span>
  return (
    <Link to={to ?? `/m/${id}`} className="grid min-h-10 grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-x-1 leading-snug">
      <span className="num text-muted">
        <span className="visually-hidden">Foglio</span> {sheetNumber(id)}
      </span>
      <span>{meta.title}</span>
    </Link>
  )
}

/** Barra orizzontale piena per una frazione da 0 a 1. Decorativa: la cifra accanto è la lettura. */
function Bar({ value, className = 'w-20' }: { value: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-block h-2.5 border border-border-strong align-middle ${className}`}>
      <span className="block h-full origin-left bg-accent" style={{ transform: `scaleX(${Math.max(0, Math.min(1, value))})` }} />
    </span>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="m-0 mt-4 max-w-[var(--measure)] text-muted">{children}</p>
}

/** Senza nessun dato una tabella di zeri non registra niente: al suo posto, da dove cominciare. */
function StartHere({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={`${BTN_SECONDARY} mt-4 no-underline`}>
      {children}
      <Icon name="arrow" size={18} />
    </Link>
  )
}

/**
 * Le righe di una tabella per foglio: prima solo quelle dei fogli toccati; "Mostra tutti i fogli" apre le altre.
 * Con cinquanta fogli sono decine di righe a zero: servono solo a chi le cerca.
 */
function useTouchedRows<T>(rows: readonly T[], touched: (row: T) => boolean): { shown: readonly T[]; rest: number; all: boolean; toggle: () => void } {
  const [all, setAll] = useState(false)
  const mine = rows.filter(touched)
  return { shown: all ? rows : mine, rest: rows.length - mine.length, all, toggle: () => setAll((a) => !a) }
}

function ShowAllRows({ rest, all, onToggle }: { rest: number; all: boolean; onToggle: () => void }) {
  if (rest === 0) return null
  return (
    <button type="button" aria-expanded={all} className={`${BTN_SECONDARY} mt-3`} onClick={onToggle}>
      <Icon name="chevron" size={18} className={all ? 'rotate-180' : undefined} />
      {all ? 'Solo i fogli toccati' : `Mostra tutti i fogli (${rest} ${rest === 1 ? 'altro' : 'altri'})`}
    </button>
  )
}

// ---------------------------------------------------------------------------------------------
// Sezioni
// ---------------------------------------------------------------------------------------------

function Sheets({ modules, ready }: { modules: ProgressData['modules']; ready: ReadonlySet<string> }) {
  const uid = useId()
  const { byStatus, preparing } = sheetsByStatus(modules, ready)
  return (
    <section aria-labelledby={`${uid}-fogli`} className="mt-12">
      <SectionHead id={`${uid}-fogli`} title="Fogli" en="Sheets" />
      <div className="mt-4 grid border-t border-l border-border-strong @3xl:grid-cols-2 @6xl:grid-cols-4">
        {STATUS_ORDER.map((status) => {
          const sheets = byStatus[status]
          return (
            <div key={status} className="border-r border-b border-border-strong bg-surface">
              <h3 id={`${uid}-${status}`} className="m-0 flex items-center gap-2 border-b border-border px-4 py-2.5">
                <StatusMark status={status} size={18} className="text-text" />
                <span className="label text-text">{STATUS_LABEL[status]}</span>
                <span className="num ml-auto text-[length:var(--step-1)]">{sheets.length}</span>
              </h3>
              {sheets.length === 0 ? (
                <p className="m-0 px-4 py-3 text-[length:var(--step--1)] text-muted">Nessun foglio.</p>
              ) : (
                <ul role="list" aria-labelledby={`${uid}-${status}`} className="m-0 grid max-h-72 list-none gap-0.5 overflow-y-auto overscroll-contain p-0 px-4 py-2 text-[length:var(--step--1)]">
                  {sheets.map((m) => (
                    <li key={m.id} className="m-0">
                      <SheetName id={m.id} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
      {preparing.length > 0 && (
        <p className="m-0 mt-3 text-[length:var(--step--1)] text-muted">
          {`E ${plural(preparing.length, 'foglio ancora in preparazione', 'fogli ancora in preparazione')}: compaiono qui quando sono pronti o quando li apri.`}
        </p>
      )}
    </section>
  )
}

function Cards({ flashcards, loaded, now }: { flashcards: ProgressData['flashcards']; loaded: ReadonlyMap<string, ModuleData>; now: number }) {
  const uid = useId()
  const rows = cardRows(flashcards, loaded, now)
  const seen = rows.reduce((n, r) => n + r.seen, 0)
  const due = rows.reduce((n, r) => n + r.due, 0)
  const fresh = rows.reduce((n, r) => n + (r.fresh ?? 0), 0)
  const table = useTouchedRows(rows, (r) => r.seen > 0)
  return (
    <section aria-labelledby={`${uid}-carte`} className="mt-14">
      <SectionHead id={`${uid}-carte`} title="Flashcard" en="Flashcards" />
      <p className="m-0 mt-2 max-w-[var(--measure)] text-muted">
        {seen === 0 ? 'Non hai ancora ripassato nessuna carta.' : `${plural(seen, 'carta ripassata', 'carte ripassate')}, ${plural(due, 'da ripassare adesso', 'da ripassare adesso')}, ${plural(fresh, 'mai vista', 'mai viste')}.`}{' '}
        Le carte tornano quando stanno per sfuggirti: più le sai, più si allontanano.
      </p>
      {rows.length === 0 ? (
        <Empty>I fogli pronti non hanno ancora flashcard.</Empty>
      ) : seen === 0 ? (
        <StartHere to="/flashcard">Comincia dalle flashcard</StartHere>
      ) : (
        <>
        <div className="relative mt-4 overflow-x-auto overscroll-x-contain" tabIndex={0} role="region" aria-label="Flashcard per foglio, scorrevole">
          <table className={`${TABLE} min-w-[36rem]`}>
            <caption className="visually-hidden">Flashcard per foglio</caption>
            <thead>
              <tr>
                <th scope="col" className={TH}>
                  Foglio
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Carte
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Ripassate
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Da ripassare ora
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Mai viste
                </th>
                <th scope="col" className={TH}>
                  <span className="visually-hidden">Azione</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {table.shown.map((r) => (
                <tr key={r.moduleId}>
                  <th scope="row" className="border-t border-border px-3 py-1 font-normal">
                    <SheetName id={r.moduleId} />
                  </th>
                  <td className={NUM_CELL}>{r.total ?? '—'}</td>
                  <td className={NUM_CELL}>{r.seen}</td>
                  <td className={`${NUM_CELL} ${r.due > 0 ? 'font-bold' : ''}`}>{r.due}</td>
                  <td className={NUM_CELL}>{r.fresh ?? '—'}</td>
                  <td className="text-right">
                    {getModuleMeta(r.moduleId) && (
                      <Link to={`/m/${r.moduleId}/flashcard`} className="label inline-flex min-h-10 items-center gap-1.5 text-link">
                        Ripassa
                        <span className="visually-hidden">{` le carte del foglio ${sheetNumber(r.moduleId)}`}</span>
                        <Icon name="arrow" size={16} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ShowAllRows rest={table.rest} all={table.all} onToggle={table.toggle} />
        </>
      )}
    </section>
  )
}

function Quiz({ quiz, loaded }: { quiz: ProgressData['quiz']; loaded: ReadonlyMap<string, ModuleData> }) {
  const uid = useId()
  const rows = quizRows(quiz, loaded)
  const attempts = rows.reduce((n, r) => n + r.attempts, 0)
  const correct = rows.reduce((n, r) => n + r.correct, 0)
  const table = useTouchedRows(rows, (r) => r.attempts > 0)
  return (
    <section aria-labelledby={`${uid}-quiz`} className="mt-14">
      <SectionHead id={`${uid}-quiz`} title="Quiz" en="Quizzes" />
      <p className="m-0 mt-2 max-w-[var(--measure)] text-muted">
        {attempts === 0 ? 'Non hai ancora risposto a nessun quiz.' : `${plural(correct, 'risposta giusta', 'risposte giuste')} su ${plural(attempts, 'tentativo', 'tentativi')}: accuratezza ${percent(correct / attempts)}.`}
      </p>
      {rows.length === 0 ? (
        <Empty>I fogli pronti non hanno ancora quiz.</Empty>
      ) : attempts === 0 ? (
        <StartHere to="/quiz">Comincia dai quiz</StartHere>
      ) : (
        <>
        <div className="relative mt-4 overflow-x-auto overscroll-x-contain" tabIndex={0} role="region" aria-label="Quiz per foglio, scorrevole">
          <table className={`${TABLE} min-w-[42rem]`}>
            <caption className="visually-hidden">Quiz per foglio</caption>
            <thead>
              <tr>
                <th scope="col" className={TH}>
                  Foglio
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Domande provate
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Tentativi
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Accuratezza
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Sbagliate l'ultima volta
                </th>
                <th scope="col" className={TH}>
                  <span className="visually-hidden">Azione</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {table.shown.map((r) => {
                const acc = accuracy(r)
                return (
                  <tr key={r.moduleId}>
                    <th scope="row" className="border-t border-border px-3 py-1 font-normal">
                      <SheetName id={r.moduleId} />
                    </th>
                    <td className={NUM_CELL}>{r.items === null ? r.tried : `${r.tried} di ${r.items}`}</td>
                    <td className={NUM_CELL}>{r.attempts}</td>
                    <td className={NUM_CELL}>
                      {acc === null ? (
                        '—'
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <Bar value={acc} className="w-16" />
                          {percent(acc)}
                        </span>
                      )}
                    </td>
                    <td className={NUM_CELL}>{r.wrongLast}</td>
                    <td className="text-right">
                      {getModuleMeta(r.moduleId) && (
                        <Link to={`/m/${r.moduleId}/quiz`} className="label inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap text-link">
                          Rifai i quiz
                          <span className="visually-hidden">{` del foglio ${sheetNumber(r.moduleId)}`}</span>
                          <Icon name="arrow" size={16} />
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <ShowAllRows rest={table.rest} all={table.all} onToggle={table.toggle} />
        </>
      )}
    </section>
  )
}

const SHOWN_EXAMS = 8

function Oral({ exam, loaded }: { exam: readonly ExamEntry[]; loaded: ReadonlyMap<string, ModuleData> }) {
  const uid = useId()
  const [all, setAll] = useState(false)
  const s = examSummary(exam)
  const recent = [...exam].reverse()
  const shown = all ? recent : recent.slice(0, SHOWN_EXAMS)
  const firstReady = [...loaded.values()].find((d) => d.exam.length > 0)
  const question = (key: string) => {
    const id = moduleOfKey(key)
    return loaded.get(id)?.exam.find((q) => `${id}:${q.id}` === key)?.q
  }

  return (
    <section aria-labelledby={`${uid}-orale`} className="mt-14">
      <SectionHead id={`${uid}-orale`} title="Simulazioni d'orale" en="Oral exam simulations" />
      {s.count === 0 ? (
        <Empty>
          Nessuna simulazione ancora. Nell'orale di un foglio rispondi ad alta voce, poi ti dai un voto da 0 a 3 con la traccia della risposta.
          {firstReady && (
            <>
              {' '}
              <Link to={`/m/${firstReady.id}/orale`}>Prova l'orale del foglio {sheetNumber(firstReady.id)}</Link>.
            </>
          )}
        </Empty>
      ) : (
        <div className="mt-4 grid gap-8 @4xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <div>
            <p className="m-0">
              <span className="num">{s.count}</span> {s.count === 1 ? 'simulazione' : 'simulazioni'}
              <span className="text-muted">{` in ${plural(s.sheets, 'foglio', 'fogli')} · media ${decimal(s.average ?? 0)} su 3`}</span>
            </p>
            <h3 id={`${uid}-voti`} className="label m-0 mt-4">
              Voti
            </h3>
            <dl aria-labelledby={`${uid}-voti`} className="m-0 mt-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 text-[length:var(--step--1)]">
              {([3, 2, 1, 0] as ExamScore[]).map((score) => (
                <div key={score} className="contents">
                  <dt className="whitespace-nowrap">
                    <span className="num">{score}</span> · {SCORE_LABEL[score]}
                  </dt>
                  <dd className="m-0">
                    <Bar value={s.byScore[score] / s.count} className="w-full" />
                  </dd>
                  <dd className="num m-0 text-right">{s.byScore[score]}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="min-w-0">
            <h3 id={`${uid}-ultime`} className="label m-0">
              Ultime simulazioni
            </h3>
            <ol role="list" aria-labelledby={`${uid}-ultime`} className="m-0 mt-2 list-none p-0">
              {shown.map((e, i) => {
                const q = question(e.key)
                return (
                  <li key={`${e.key}-${e.at}-${i}`} className="m-0 grid gap-x-4 gap-y-1 border-t border-border py-2.5 @2xl:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <p className="m-0 flex flex-wrap gap-x-2 text-[length:var(--step--1)] text-muted">
                        <span className="num">{when(e.at)}</span>
                        <span>· Foglio {sheetNumber(moduleOfKey(e.key)) ?? moduleOfKey(e.key)}</span>
                        {e.seconds !== undefined && <span className="num">· {formatClock(e.seconds)}</span>}
                      </p>
                      <Link to={`/m/${moduleOfKey(e.key)}/orale#exam:${e.key.slice(e.key.indexOf(':') + 1)}`} className="line-clamp-2 leading-snug">
                        {q ? <Rich text={q} inline /> : 'Domanda non più presente nel foglio'}
                      </Link>
                    </div>
                    <p className="m-0 self-center">
                      <span className={`label inline-flex items-center gap-1.5 border px-2 py-0.5 ${e.score === 3 ? 'border-border-strong bg-pin text-pin-contrast' : 'border-border-strong text-text'}`}>
                        <span className="num">{e.score}/3</span>
                        {SCORE_LABEL[e.score]}
                      </span>
                    </p>
                  </li>
                )
              })}
            </ol>
            {recent.length > SHOWN_EXAMS && (
              <button type="button" className={`${BTN_SECONDARY} mt-3`} aria-expanded={all} onClick={() => setAll(!all)}>
                {all ? 'Mostra solo le ultime' : `Mostra tutte (${recent.length})`}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function Challenges({ challenges, loaded }: { challenges: ProgressData['challenges']; loaded: ReadonlyMap<string, ModuleData> }) {
  const uid = useId()
  const rows = challengeRows(challenges, loaded)
  const widgets = [...loaded.values()].reduce((n, d) => n + d.widgets.length, 0)
  return (
    <section aria-labelledby={`${uid}-sfide`} className="mt-14">
      <SectionHead id={`${uid}-sfide`} title="Sfide dei widget" en="Widget challenges" />
      <p className="m-0 mt-2 max-w-[var(--measure)] text-muted">
        {`${plural(rows.length, 'sfida completata', 'sfide completate')} · ${plural(widgets, 'widget', 'widget')} nei fogli pronti.`} Molti widget chiudono con una sfida: la trovi in fondo al widget, nel laboratorio del foglio.
      </p>
      {rows.length > 0 && (
        <ul role="list" className="m-0 mt-4 grid list-none p-0 pt-px pl-px @3xl:grid-cols-2">
          {rows.map((r) => (
            <li key={r.widgetId} className="m-0 -mt-px -ml-px flex items-center gap-3 border border-border-strong bg-surface px-4 py-2.5">
              <Icon name="check" size={18} className="text-ok" />
              <span className="min-w-0 flex-1">
                <Link to={`/lab/${r.widgetId}`} className="leading-snug">
                  {r.title ?? r.widgetId}
                </Link>
                <span className="block text-[length:var(--step--1)] text-muted">
                  {r.moduleId ? `Foglio ${sheetNumber(r.moduleId)} · ` : ''}
                  {formatDay(r.at)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Salva e ripristina
// ---------------------------------------------------------------------------------------------

function summaryLine(s: BackupSummary): string {
  return [
    plural(s.sheets, 'foglio', 'fogli'),
    plural(s.cards, 'carta', 'carte'),
    plural(s.quiz, 'quiz', 'quiz'),
    plural(s.exams, 'simulazione', 'simulazioni'),
    plural(s.challenges, 'sfida', 'sfide'),
    plural(s.bookmarks, 'segnalibro', 'segnalibri'),
    plural(s.notes, 'nota', 'note'),
  ].join(' · ')
}

type Pending = { name: string; text: string; exportedAt: number | null; summary: BackupSummary }

function Backup() {
  const uid = useId()
  const exportJson = useProgress((s) => s.exportJson)
  const importJson = useProgress((s) => s.importJson)
  const reset = useProgress((s) => s.reset)
  const current = useProgress((s) => backupSummaryKey(selectProgressData(s)))
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [confirming, setConfirming] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const statusLine = useRef<HTMLParagraphElement>(null)
  const resetTrigger = useRef<HTMLButtonElement>(null)
  const cancelReset = useRef<HTMLButtonElement>(null)

  function download() {
    const now = Date.now()
    const name = backupFileName(now)
    const url = URL.createObjectURL(new Blob([exportJson(now)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.append(a)
    a.click()
    a.remove()
    // il download parte dal clic: l'URL si può liberare subito dopo
    setTimeout(() => URL.revokeObjectURL(url), 0)
    setError(null)
    setMessage(`Backup scaricato: ${name}. Tienilo dove non si perde.`)
  }

  async function choose(file: File | undefined) {
    if (!file) return
    setMessage('')
    setPending(null)
    try {
      const text = await file.text()
      const data = parseBackup(text)
      const raw = JSON.parse(text) as { exportedAt?: unknown }
      setPending({ name: file.name, text, exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : null, summary: backupSummary(data) })
      setError(null)
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e)
      setError(`Non ho caricato «${file.name}». ${reason}. Scegli un file scaricato da questa pagina con «Scarica il backup».`)
    } finally {
      // lo stesso file si può scegliere di nuovo
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function applyImport() {
    if (!pending) return
    try {
      importJson(pending.text)
      setMessage('Progressi ripristinati dal backup.')
      setPending(null)
      // l'anteprima con il pulsante premuto sparisce: il fuoco va sul messaggio che dice com'è andata
      requestAnimationFrame(() => statusLine.current?.focus())
    } catch (e) {
      setError(`Non ho ripristinato il backup. ${e instanceof Error ? e.message : String(e)}.`)
    }
  }

  // aprendo la conferma il fuoco va sull'uscita sicura (Invio per sbaglio non cancella niente); chiudendola torna al tasto
  const wasConfirming = useRef(false)
  useEffect(() => {
    if (confirming) cancelReset.current?.focus()
    else if (wasConfirming.current) resetTrigger.current?.focus()
    wasConfirming.current = confirming
  }, [confirming])

  function openConfirm() {
    setConfirming(true)
    setMessage('')
  }

  function closeConfirm(done: boolean) {
    setConfirming(false)
    if (done) {
      reset()
      setMessage('Progressi azzerati. Si riparte da un atlante vuoto.')
    }
  }

  const BOX = 'grid content-start gap-3 border border-border-strong bg-surface p-4 @3xl:p-5'

  return (
    <section aria-labelledby={`${uid}-backup`} className="mt-14">
      <SectionHead id={`${uid}-backup`} title="Salva e ripristina" en="Backup and restore" />
      <p className="m-0 mt-2 max-w-[var(--measure)] text-muted">I progressi vivono solo in questo browser. Un backup li mette al sicuro e li porta su un altro computer.</p>
      <div className="mt-4 grid gap-4 @4xl:grid-cols-3">
        <div className={BOX}>
          <h3 className="label m-0 text-text">Scarica</h3>
          <p className="m-0 text-[length:var(--step--1)]">Un file JSON con tutto: stato dei fogli, carte, quiz, simulazioni, sfide, segnalibri e note.</p>
          <p className="m-0 text-[length:var(--step--1)] text-muted">Adesso: {current}</p>
          <button type="button" className={`${BTN_PRIMARY} justify-self-start`} onClick={download}>
            <Icon name="next" size={18} />
            Scarica il backup
          </button>
        </div>

        <div className={BOX}>
          <h3 className="label m-0 text-text">Carica</h3>
          <p className="m-0 text-[length:var(--step--1)]">Scegli un backup scaricato da qui. Prima di sostituire qualcosa ti mostro che cosa contiene.</p>
          <label className={`${BTN_SECONDARY} justify-self-start has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus`}>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              onChange={(e) => void choose(e.target.files?.[0])}
            />
            <Icon name="page" size={18} />
            Scegli il file del backup
          </label>
          {error && (
            <p role="alert" className="m-0 flex items-start gap-2 border border-border-strong bg-error-bg p-3 text-[length:var(--step--1)]">
              <Icon name="cross" size={18} className="mt-0.5 text-error" />
              <span>{error}</span>
            </p>
          )}
          {pending && (
            <div role="group" aria-labelledby={`${uid}-anteprima`} className="grid gap-3 border-2 border-border-strong bg-bg p-3">
              <p id={`${uid}-anteprima`} className="m-0 font-label font-bold">
                {pending.exportedAt ? `Backup del ${formatDay(pending.exportedAt)}` : 'Backup senza data'}
                <span className="block font-body text-[length:var(--step--1)] font-normal text-muted">{pending.name}</span>
              </p>
              <p className="m-0 text-[length:var(--step--1)]">{summaryLine(pending.summary)}</p>
              <p className="m-0 flex items-start gap-2 text-[length:var(--step--1)]">
                <Icon name="warning" size={18} className="mt-0.5 text-warn" />
                Caricandolo sostituisci tutti i progressi di adesso.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={BTN_PRIMARY} onClick={applyImport}>
                  Sostituisci i progressi
                </button>
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  onClick={() => {
                    setPending(null)
                    // l'anteprima sparisce: il fuoco torna alla scelta del file
                    fileInput.current?.focus()
                  }}
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={BOX}>
          <h3 className="label m-0 text-text">Azzera</h3>
          <p className="m-0 text-[length:var(--step--1)]">Riparti da zero: cancella da questo browser tutti i progressi dell'atlante. Le impostazioni restano.</p>
          <button
            ref={resetTrigger}
            type="button"
            aria-expanded={confirming}
            aria-controls={`${uid}-azzera`}
            className={`${BTN_SECONDARY} justify-self-start`}
            onClick={() => (confirming ? closeConfirm(false) : openConfirm())}
          >
            <Icon name="reset" size={18} />
            Azzera i progressi…
          </button>
          {confirming && (
            <div id={`${uid}-azzera`} role="group" aria-labelledby={`${uid}-conferma`} className="grid gap-3 border-2 border-border-strong bg-error-bg p-3">
              <p id={`${uid}-conferma`} className="m-0 flex items-center gap-2 font-label font-bold">
                <Icon name="warning" size={18} className="text-error" />
                Azzerare tutti i progressi?
              </p>
              <p className="m-0 text-[length:var(--step--1)]">{`Cancello ${current}. Non si può annullare: se vuoi tenerli, scarica prima il backup.`}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="label inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-m border border-error bg-surface px-4 py-2 text-error transition-[background-color,color,translate] duration-[var(--dur-fast)] ease-out hover:bg-error hover:text-surface active:translate-y-px"
                  onClick={() => closeConfirm(true)}
                >
                  Sì, azzera tutto
                </button>
                <button ref={cancelReset} type="button" className={BTN_PRIMARY} onClick={() => closeConfirm(false)}>
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p ref={statusLine} tabIndex={-1} role="status" aria-live="polite" className="m-0 mt-3 flex min-h-6 items-center gap-2 text-[length:var(--step--1)] outline-offset-4">
        {message && <Icon name="check" size={18} className="text-ok" />}
        {message}
      </p>
    </section>
  )
}

/** Il contenuto dei progressi in una riga, per la scheda Scarica e per la conferma dell'azzeramento. */
function backupSummaryKey(data: ProgressData): string {
  return summaryLine(backupSummary(data))
}

// ---------------------------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------------------------

export default function Progress() {
  useDocumentTitle('Progressi')
  const state = useProgress()
  const data = selectProgressData(state)
  const { loading, sheets } = useReadyModules()
  const loaded = new Map(sheets.flatMap((s) => (s.status === 'ready' ? [[s.id, s.data] as const] : [])))
  const ready = new Set(manifest.filter((m) => sheets.some((s) => s.id === m.id)).map((m) => m.id))
  // l'istante dell'apertura: serve per le scadenze delle carte e per la serie di giorni
  const [now] = useState(() => Date.now())
  const streak = activeStreak(data.streak, now)
  const surveyed = Object.values(data.modules).filter((m) => m.status === 'completato').length
  const empty = isEmptyProgress(data)
  const first = sheets.find((s) => s.status === 'ready')

  return (
    <main className={PAGE}>
      <PageHead title="Progressi" en="Progress" lead="Il tuo rilievo sul campo: fogli, carte, quiz, orale e sfide. Resta in questo browser; in fondo alla pagina lo salvi in un file.">
        <Reading label="Serie">
          {plural(streak, 'giorno', 'giorni')} <span className="text-muted">· record {data.streak.best}</span>
        </Reading>
        <Reading label="Ultimo studio">{data.streak.lastDay ? formatDay(new Date(`${data.streak.lastDay}T12:00:00`).getTime(), now) : 'mai'}</Reading>
        <Reading label="Fogli rilevati">
          {surveyed} di {manifest.length}
        </Reading>
      </PageHead>

      {empty && (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-2 border-border-strong bg-surface p-4">
          <p className="m-0 min-w-0 flex-1 basis-64">Non hai ancora progressi. Si registrano da soli mentre leggi la teoria, ripassi le carte, rispondi ai quiz e provi l'orale.</p>
          {first && (
            <Link to={`/m/${first.id}`} className={`${BTN_PRIMARY} no-underline`}>
              Comincia dal foglio {sheetNumber(first.id)}
              <Icon name="arrow" size={18} />
            </Link>
          )}
        </div>
      )}

      <Sheets modules={data.modules} ready={ready} />

      {loading ? (
        <p role="status" className="label m-0 mt-14">
          Leggo i fogli pronti…
        </p>
      ) : (
        <>
          <Cards flashcards={data.flashcards} loaded={loaded} now={now} />
          <Quiz quiz={data.quiz} loaded={loaded} />
          <Oral exam={data.exam} loaded={loaded} />
          <Challenges challenges={data.challenges} loaded={loaded} />
        </>
      )}

      <Backup />
    </main>
  )
}
