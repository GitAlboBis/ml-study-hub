// Prova a quiz sulle domande di uno o più fogli: scelta singola, scelta multipla, vero o falso, numerica
// con tolleranza. Due modi:
// - allenamento: esito e spiegazione subito dopo ogni risposta, punti e serie di risposte giuste;
// - esame: a tempo (predefinito un minuto a domanda), si va avanti e indietro senza esiti, si consegna
//   (o consegna il tempo) e solo allora arrivano punteggio e spiegazioni.
// A fine prova il riepilogo propone il ripasso degli errori (sbagliate e senza risposta, in allenamento).
// Ogni risposta giudicata finisce nei progressi con recordQuiz; all'esame solo quelle date.
//
// Tastiera: i tasti 1-9 scelgono le opzioni (fuori dal campo numerico), Invio conferma dal campo, il
// pulsante principale resta lo stesso elemento fra "Controlla" e "Prossima domanda", così il fuoco non
// si perde; passando alla domanda dopo il fuoco va sul testo della domanda, a fine prova sul riepilogo.
// L'aspetto delle opzioni riprende <Check> del foglio (components/content/Check.tsx), che resta la
// verifica dentro il testo: la logica comune sta in logic.ts.
import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, RefObject } from 'react'
import type { QuizItem } from '../../content/types'
import { useProgress } from '../../store/progress'
import { Rich } from '../content/Rich'
import { BTN_PRIMARY, BTN_SECONDARY, Disclosure, FLOW, Frame, Icon } from '../content/shared'
import { correctOptions, emptyResponse, formatClock, formatNumber, isBlank, judge, optionsOf } from './logic'
import type { QuizEntry, QuizResponse } from './logic'
import { Difficulty, Stat, StampMark, Ticks, Track } from './parts'
import { useStopwatch } from './useStopwatch'

export type QuizMode = 'allenamento' | 'esame'

export interface QuizResult {
  mode: QuizMode
  total: number
  correct: number
  /** domande a cui si è risposto */
  answered: number
  seconds: number
  timedOut: boolean
  /** chiavi delle domande sbagliate o senza risposta */
  missed: string[]
}

export interface QuizRunnerProps {
  entries: readonly QuizEntry[]
  mode?: QuizMode
  /** solo esame: secondi a disposizione; predefinito un minuto a domanda */
  timeLimit?: number
  onFinish?: (result: QuizResult) => void
  /** se c'è, il riepilogo offre "Cambia prova" (per tornare alla scelta del modo) */
  onExit?: () => void
}

/** Secondi a disposizione di una prova d'esame, se non indicati. */
export const SECONDS_PER_QUESTION = 60

interface Round {
  n: number
  entries: QuizEntry[]
  mode: QuizMode
  review: boolean
}

export function QuizRunner({ entries, mode = 'allenamento', timeLimit, onFinish, onExit }: QuizRunnerProps) {
  const [round, setRound] = useState<Round>(() => ({ n: 0, entries: [...entries], mode, review: false }))

  if (round.entries.length === 0) {
    return (
      <p className="m-0 flex items-center gap-3 border border-border bg-surface p-5 text-muted">
        <Icon name="info" />
        Non ci sono ancora domande qui.
      </p>
    )
  }

  return (
    <QuizRound
      key={round.n}
      entries={round.entries}
      mode={round.mode}
      review={round.review}
      timeLimit={timeLimit ?? round.entries.length * SECONDS_PER_QUESTION}
      onFinish={onFinish}
      onExit={onExit}
      onReview={(missed) => setRound((r) => ({ n: r.n + 1, entries: missed, mode: 'allenamento', review: true }))}
      onRestart={() => setRound((r) => ({ n: r.n + 1, entries: [...entries], mode, review: false }))}
    />
  )
}

// ---------------------------------------------------------------------------------------------
// Una prova
// ---------------------------------------------------------------------------------------------

interface RoundProps {
  entries: QuizEntry[]
  mode: QuizMode
  review: boolean
  timeLimit: number
  onFinish?: (result: QuizResult) => void
  onExit?: () => void
  onReview: (missed: QuizEntry[]) => void
  onRestart: () => void
}

/** Esito di ogni domanda: true giusta, false sbagliata, null senza risposta (o non ancora controllata). */
type Verdict = boolean | null

interface Done {
  timedOut: boolean
  seconds: number
}

function QuizRound({ entries, mode, review, timeLimit, onFinish, onExit, onReview, onRestart }: RoundProps) {
  const recordQuiz = useProgress((s) => s.recordQuiz)
  const exam = mode === 'esame'
  const total = entries.length

  const [index, setIndex] = useState(0)
  const [responses, setResponses] = useState<QuizResponse[]>(() => entries.map(emptyResponse))
  const [verdicts, setVerdicts] = useState<Verdict[]>(() => entries.map(() => null))
  const [hint, setHint] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [done, setDone] = useState<Done | null>(null)
  const [startedAt] = useState(() => Date.now())

  const uid = useId()
  const questionRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLHeadingElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const focusNext = useRef<'question' | 'summary' | null>(null)
  useEffect(() => {
    const target = focusNext.current
    if (target === null) return
    focusNext.current = null
    ;(target === 'question' ? questionRef.current : summaryRef.current)?.focus()
  })

  const entry = entries[index]
  const item = entry.item
  const response = responses[index]
  const verdict = verdicts[index]
  // in allenamento, una domanda controllata non si cambia più
  const locked = !exam && verdict !== null
  const multi = item.type === 'multi'
  const last = index === total - 1
  const questionId = `${uid}-q`
  const statusId = `${uid}-s`

  function finish(timedOut: boolean) {
    if (done) return
    let final = verdicts
    if (exam) {
      final = entries.map((e, i) => {
        if (isBlank(responses[i])) return null
        const j = judge(e.item, responses[i])
        // all'esame un numero scritto male vale come risposta sbagliata
        return j.ok ? j.correct : false
      })
      final.forEach((v, i) => {
        if (v !== null) recordQuiz(entries[i].key, v)
      })
      setVerdicts(final)
    }
    const seconds = Math.round((Date.now() - startedAt) / 1000)
    setDone({ timedOut, seconds })
    focusNext.current = 'summary'
    onFinish?.({
      mode,
      total,
      correct: final.filter((v) => v === true).length,
      answered: final.filter((v) => v !== null).length,
      seconds,
      timedOut,
      missed: entries.filter((_, i) => final[i] !== true).map((e) => e.key),
    })
  }

  function go(to: number) {
    setHint(null)
    setIndex(to)
    focusNext.current = 'question'
  }

  const setResponse = (next: QuizResponse) => setResponses((rs) => rs.map((r, i) => (i === index ? next : r)))

  function pick(i: number) {
    if (locked) return
    setHint(null)
    const picked = multi ? (response.picked.includes(i) ? response.picked.filter((x) => x !== i) : [...response.picked, i]) : [i]
    setResponse({ ...response, picked })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (exam) {
      // un testo che non è un numero si corregge prima di andare avanti
      if (item.type === 'numeric' && !isBlank(response)) {
        const j = judge(item, response)
        if (!j.ok) {
          setHint(j.hint)
          inputRef.current?.focus()
          return
        }
      }
      if (last) finish(false)
      else go(index + 1)
      return
    }
    if (verdict !== null) {
      if (last) finish(false)
      else go(index + 1)
      return
    }
    const j = judge(item, response)
    if (!j.ok) {
      setHint(j.hint)
      return
    }
    setHint(null)
    setVerdicts((vs) => vs.map((v, i) => (i === index ? j.correct : v)))
    recordQuiz(entry.key, j.correct)
    const nextStreak = j.correct ? streak + 1 : 0
    setStreak(nextStreak)
    setBest(Math.max(best, nextStreak))
  }

  function onKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.altKey || e.ctrlKey || e.metaKey || item.type === 'numeric') return
    if (!/^[1-9]$/.test(e.key)) return
    const i = Number(e.key) - 1
    if (i >= optionsOf(item).length) return
    e.preventDefault()
    pick(i)
  }

  if (done) {
    return (
      <QuizSummary
        entries={entries}
        responses={responses}
        verdicts={verdicts}
        mode={mode}
        done={done}
        timeLimit={timeLimit}
        best={best}
        headingRef={summaryRef}
        onReview={onReview}
        onRestart={onRestart}
        onExit={onExit}
      />
    )
  }

  const points = verdicts.filter((v) => v === true).length
  const answered = responses.filter((r) => !isBlank(r)).length
  const right = correctOptions(item)
  const checked = !exam && verdict !== null

  return (
    <div className="@container grid gap-4">
      {/* testata della prova: dove sono, come sta andando */}
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="grid gap-2">
          <p className="label m-0 text-text">{review ? 'Ripasso degli errori' : exam ? 'Esame a tempo' : 'Allenamento'}</p>
          <Track total={total} done={index} current={index} />
        </div>
        {exam ? (
          <>
            <Countdown limit={timeLimit} onExpire={() => finish(true)} />
            <Stat label="Risposte date" value={`${answered} / ${total}`} />
          </>
        ) : (
          <>
            <Stat label="Punti" value={points} />
            <Stat label="Serie" value={streak} pinned={streak >= 3} />
            <Stat label="Record" value={best} />
          </>
        )}
      </div>

      <Frame
        flush
        label={`Domanda ${index + 1} di ${total}`}
        labelledBy={questionId}
        actions={
          <>
            {entry.origin !== undefined && <span className="label">{entry.origin}</span>}
            <Difficulty value={item.difficulty} />
          </>
        }
      >
        <form onSubmit={onSubmit} onKeyDown={onKeyDown} className="p-4 @md:p-6">
          <div id={questionId} ref={questionRef} tabIndex={-1} className="font-bold outline-offset-4">
            <Rich text={item.q} className={`prose ${FLOW}`} />
          </div>

          {item.type === 'numeric' ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label htmlFor={`${uid}-n`} className="label">
                La tua risposta{item.unit ? ` (${item.unit})` : ''}
              </label>
              <input
                ref={inputRef}
                id={`${uid}-n`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={response.text}
                disabled={locked}
                aria-invalid={hint ? true : undefined}
                aria-describedby={hint ? statusId : undefined}
                onChange={(e) => {
                  setHint(null)
                  setResponse({ ...response, text: e.target.value })
                }}
                className="num min-h-11 w-40 rounded-m border border-border-strong bg-bg px-3 disabled:border-border disabled:text-muted"
              />
            </div>
          ) : (
            <div role={multi ? 'group' : 'radiogroup'} aria-labelledby={questionId} className="mt-4 grid gap-2">
              {multi && <p className="label m-0">Più risposte possibili</p>}
              {optionsOf(item).map((option, i) => {
                const isRight = right.includes(i)
                const isPicked = response.picked.includes(i)
                return (
                  <label
                    key={i}
                    className="group flex min-h-11 cursor-pointer items-center gap-3 border border-border px-3 py-2 transition-[border-color,background-color] duration-[var(--dur-fast)] ease-out hover:border-border-strong has-[:checked]:border-border-strong has-[:checked]:bg-surface-2 has-[:disabled]:cursor-default has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
                  >
                    <input
                      type={multi ? 'checkbox' : 'radio'}
                      name={uid}
                      checked={isPicked}
                      disabled={locked}
                      onChange={() => pick(i)}
                      className="sr-only"
                    />
                    {/* il tassello porta il tasto della scorciatoia; scelto, si inchiostra */}
                    <span
                      aria-hidden="true"
                      className={`num grid size-7 shrink-0 place-items-center border border-border-strong text-[length:var(--step--1)] group-has-[:checked]:bg-accent group-has-[:checked]:text-accent-contrast ${multi ? '' : 'rounded-full'}`}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Rich text={option} inline />
                    </span>
                    {checked && isRight && (
                      <span className="label flex items-center gap-1 text-ok">
                        <Icon name="check" size={16} />
                        giusta
                      </span>
                    )}
                    {checked && isPicked && !isRight && (
                      <span className="label flex items-center gap-1 text-error">
                        <Icon name="cross" size={16} />
                        tua scelta
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          )}

          <div id={statusId} role="status" className="mt-4 empty:mt-0">
            {hint && (
              <p className="m-0 flex items-center gap-3 border border-border bg-info-bg p-3">
                <Icon name="info" className="text-info" />
                {hint}
              </p>
            )}
            {checked && (
              <p className={`m-0 flex items-center gap-3 border border-border p-3 font-bold ${verdict ? 'bg-ok-bg' : 'bg-error-bg'}`}>
                <Icon name={verdict ? 'check' : 'cross'} className={verdict ? 'text-ok' : 'text-error'} />
                {verdict ? 'Risposta corretta' : 'Risposta sbagliata'}
              </p>
            )}
          </div>

          {checked && <Explanation item={item} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {exam && index > 0 && (
              <button type="button" className={BTN_SECONDARY} onClick={() => go(index - 1)}>
                Indietro
              </button>
            )}
            <button type="submit" className={BTN_PRIMARY}>
              {exam ? (last ? 'Consegna' : 'Avanti') : !checked ? 'Controlla' : last ? 'Vedi il risultato' : 'Prossima domanda'}
              {(exam || checked) && <Icon name="arrow" size={18} />}
            </button>
            {exam && !last && (
              <button type="button" className={`${BTN_SECONDARY} ml-auto`} onClick={() => finish(false)}>
                Consegna ora
                {total - answered > 0 && <span className="normal-case tracking-normal">({total - answered} senza risposta)</span>}
              </button>
            )}
          </div>
        </form>
      </Frame>
    </div>
  )
}

/** Risposta attesa (per le numeriche) e spiegazione. */
function Explanation({ item }: { item: QuizItem }) {
  return (
    <div className={`mt-4 border-t border-border pt-4 ${FLOW}`}>
      {item.type === 'numeric' && (
        <p className="m-0">
          <span className="label mr-2">Risposta attesa</span>
          <span className="num">
            {formatNumber(item.answer)} ± {formatNumber(item.tolerance)}
            {item.unit ? ` ${item.unit}` : ''}
          </span>
        </p>
      )}
      <p className="label m-0">Spiegazione</p>
      <Rich text={item.explanation} className={`prose ${FLOW}`} />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Tempo dell'esame
// ---------------------------------------------------------------------------------------------

/**
 * Conto alla rovescia. Sta in un componente suo perché si ridisegna quattro volte al secondo: la prova
 * intorno no. L'ultimo minuto prende lo spillo ed è annunciato una volta sola.
 */
function Countdown({ limit, onExpire }: { limit: number; onExpire: () => void }) {
  const { seconds } = useStopwatch(true)
  const remaining = Math.max(0, limit - seconds)
  const expired = remaining <= 0
  const low = remaining <= 60
  const latest = useRef(onExpire)
  useEffect(() => {
    latest.current = onExpire
  })
  useEffect(() => {
    if (expired) latest.current()
  }, [expired])
  return (
    <div className="grid gap-0.5">
      <span className="label" aria-hidden="true">
        Tempo rimasto
      </span>
      <span
        role="timer"
        aria-label="Tempo rimasto"
        className={`num w-fit text-[length:var(--step-1)] leading-tight ${low ? 'bg-pin px-1.5 text-pin-contrast' : ''}`}
      >
        {formatClock(remaining)}
      </span>
      <span aria-live="polite" className="visually-hidden">
        {low && !expired ? 'Manca meno di un minuto.' : ''}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Riepilogo
// ---------------------------------------------------------------------------------------------

interface SummaryProps {
  entries: QuizEntry[]
  responses: QuizResponse[]
  verdicts: Verdict[]
  mode: QuizMode
  done: Done
  timeLimit: number
  best: number
  headingRef: RefObject<HTMLHeadingElement | null>
  onReview: (missed: QuizEntry[]) => void
  onRestart: () => void
  onExit?: () => void
}

/** La risposta data, per il riepilogo. */
function Given({ item, response }: { item: QuizItem; response: QuizResponse }) {
  if (isBlank(response)) return <span className="text-muted">nessuna</span>
  if (item.type === 'numeric') return <span className="num">{response.text.trim()}</span>
  const options = optionsOf(item)
  return (
    <>
      {[...response.picked].sort((a, b) => a - b).map((i, k) => (
        <span key={i}>
          {k > 0 && '; '}
          <Rich text={options[i]} inline />
        </span>
      ))}
    </>
  )
}

/** La risposta giusta, per il riepilogo. */
function Expected({ item }: { item: QuizItem }) {
  if (item.type === 'numeric') {
    return (
      <span className="num">
        {formatNumber(item.answer)} ± {formatNumber(item.tolerance)}
        {item.unit ? ` ${item.unit}` : ''}
      </span>
    )
  }
  const options = optionsOf(item)
  return (
    <>
      {correctOptions(item).map((i, k) => (
        <span key={i}>
          {k > 0 && '; '}
          <Rich text={options[i]} inline />
        </span>
      ))}
    </>
  )
}

function QuizSummary({ entries, responses, verdicts, mode, done, timeLimit, best, headingRef, onReview, onRestart, onExit }: SummaryProps) {
  const total = entries.length
  const correct = verdicts.filter((v) => v === true).length
  const blank = verdicts.filter((v) => v === null).length
  const missed = entries.filter((_, i) => verdicts[i] !== true)
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="@container relative grid gap-6 border-2 border-border-strong bg-surface p-5 sm:p-8">
      <Ticks />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid gap-1">
          <h3 id={headingId} ref={headingRef} tabIndex={-1} className="m-0 font-label text-[length:var(--step-3)] leading-tight font-bold">
            {done.timedOut ? 'Tempo scaduto' : 'Prova finita'}
          </h3>
          <p className="m-0 text-muted">
            Risposte giuste: {correct} su {total}
          </p>
        </div>
        {/* il punteggio in grande, come il numero del foglio: per gli occhi, la frase sopra lo dice già */}
        <p aria-hidden="true" className="m-0 flex items-baseline gap-2 font-display leading-none font-extrabold uppercase">
          <span className="text-[length:var(--step-5)]">{correct}</span>
          <span className="text-[length:var(--step-3)] text-muted">/ {total}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-4">
        {mode === 'esame' ? (
          <>
            <Stat label="Tempo usato" value={`${formatClock(Math.min(done.seconds, timeLimit))} di ${formatClock(timeLimit)}`} />
            <Stat label="Senza risposta" value={blank} />
          </>
        ) : (
          <>
            <Stat label="Serie migliore" value={best} />
            <Stat label="Tempo" value={formatClock(done.seconds)} />
          </>
        )}
      </div>

      <ol aria-label="Le domande" className="m-0 grid list-none gap-5 p-0">
        {entries.map((e, i) => {
          const v = verdicts[i]
          return (
            <li key={e.key} className="grid gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="label text-text">Domanda {i + 1}</span>
                <StampMark size="s" tone={v === true ? 'ok' : v === false ? 'error' : 'ink'}>
                  <Icon name={v === true ? 'check' : v === false ? 'cross' : 'info'} size={14} />
                  {v === true ? 'Giusta' : v === false ? 'Sbagliata' : 'Senza risposta'}
                </StampMark>
              </div>
              <Rich text={e.item.q} className={`prose ${FLOW}`} />
              <Disclosure
                className="border border-border"
                summary={<span className="label text-text">Rivedi la spiegazione</span>}
                panelClassName={`border-t border-border p-4 ${FLOW}`}
              >
                <p className="m-0">
                  <span className="label mr-2">La tua risposta</span>
                  <Given item={e.item} response={responses[i]} />
                </p>
                <p className="m-0">
                  <span className="label mr-2">Risposta giusta</span>
                  <Expected item={e.item} />
                </p>
                <Rich text={e.item.explanation} className={`prose ${FLOW}`} />
              </Disclosure>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        {missed.length > 0 && (
          <button type="button" className={BTN_PRIMARY} onClick={() => onReview(missed)}>
            <Icon name="reset" size={18} />
            Ripassa gli errori ({missed.length})
          </button>
        )}
        <button type="button" className={missed.length > 0 ? BTN_SECONDARY : BTN_PRIMARY} onClick={onRestart}>
          Rifai la prova
        </button>
        {onExit && (
          <button type="button" className={BTN_SECONDARY} onClick={onExit}>
            Cambia prova
          </button>
        )}
      </div>
    </section>
  )
}
