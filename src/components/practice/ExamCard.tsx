// Scheda d'orale: la domanda (in italiano e, come all'esame, in inglese), un cronometro per rispondere ad
// alta voce, poi "Rivela traccia e risposta": la traccia dei punti da toccare (da spuntare) e la risposta
// modello. Si chiude con l'autovalutazione da 0 a 3, quattro timbri di cui uno suggerito dalla traccia
// spuntata; il voto e il tempo finiscono nei progressi con recordExam e il voto resta impresso sulla
// scheda come un timbro. Sotto, le domande di approfondimento che il docente può fare dopo, ognuna con
// la sua risposta a scomparsa.
//
// Il cronometro non parte da solo: si avvia quando si comincia a parlare e si ferma alla rivelazione,
// così il tempo registrato è quello della risposta. È un role="timer" (non annunciato a ogni secondo);
// avvio e pausa sono annunciati una volta.
//
// Il simulatore dell'orale (pages/OralSimulator) passa quattro cose in più, tutte facoltative: il proprio
// cronometro (lo condivide con la risposta a voce), i comandi da mettere nella fascia del tempo, chi
// avvisare quando arriva il voto, e per le domande della banca senza foglio pronto il contenuto che
// prende il posto della risposta modello, con l'etichetta del pulsante che lo rivela.
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import type { ExamQuestion, Prof } from '../../content/types'
import { progressKey, useProgress } from '../../store/progress'
import { Rich } from '../content/Rich'
import { BTN_PRIMARY, BTN_SECONDARY, Disclosure, FLOW, Frame, Icon } from '../content/shared'
import { examHistory, formatClock, SCORE_LABEL, suggestScore } from './logic'
import type { ExamScore } from './logic'
import { PlayPause, StampButton, StampMark, Stat } from './parts'
import { useStopwatch } from './useStopwatch'
import type { Stopwatch } from './useStopwatch'

export interface ExamCardProps {
  question: ExamQuestion
  /** modulo della domanda: la chiave nei progressi è progressKey(moduleId, question.id) */
  moduleId: string
  /** id DOM della cornice: la destinazione di copertura "exam:<id>" */
  anchor?: string
  number?: number
  total?: number
  /** cronometro di chi contiene la scheda; senza, la scheda usa il suo */
  stopwatch?: Stopwatch
  /** comandi in più nella fascia del tempo, sotto il cronometro; come funzione ricevono se la risposta è rivelata */
  timerExtra?: ReactNode | ((revealed: boolean) => ReactNode)
  /** chiamato dopo recordExam con il voto e i secondi registrati */
  onGrade?: (score: ExamScore, seconds?: number) => void
  /** chiamato da "Rifai la domanda": chi contiene la scheda dimentica il voto appena dato */
  onRetry?: () => void
  /** al posto della risposta modello, quando la domanda non ne ha (answer vuota) */
  answerFallback?: ReactNode
  /** etichetta del pulsante che rivela traccia e risposta */
  revealLabel?: string
}

/** Il docente e la regione dell'atlante (il corso) in cui cade la domanda: tassello di legenda + nome. */
const PROF: Record<Prof, { name: string; field: string }> = {
  Melgani: { name: 'Melgani', field: 'bg-melgani' },
  Passerini: { name: 'Passerini', field: 'bg-passerini' },
  Ricci: { name: 'Ricci', field: 'bg-ricci' },
  Assistant: { name: 'Assistente', field: 'bg-surface-2' },
}

const SCORES: readonly ExamScore[] = [0, 1, 2, 3]

export function ExamCard({
  question,
  moduleId,
  anchor,
  number,
  total,
  stopwatch,
  timerExtra,
  onGrade,
  onRetry,
  answerFallback,
  revealLabel = 'Rivela traccia e risposta',
}: ExamCardProps) {
  const key = progressKey(moduleId, question.id)
  const recordExam = useProgress((s) => s.recordExam)
  const entries = useProgress((s) => s.exam)
  const history = examHistory(entries, key)
  const own = useStopwatch()
  const watch = stopwatch ?? own
  const [revealed, setRevealed] = useState(false)
  const [ticked, setTicked] = useState<boolean[]>([])
  const [score, setScore] = useState<ExamScore | null>(null)
  const [spoken, setSpoken] = useState('')
  const uid = useId()
  const questionId = `${uid}-q`
  const suggestionId = `${uid}-sug`

  const prof = PROF[question.prof] ?? PROF.Assistant
  const tickedCount = ticked.filter(Boolean).length
  const suggested = suggestScore(tickedCount, question.checklist.length)
  const label = number !== undefined && total !== undefined ? `Domanda d'orale ${number} di ${total}` : "Domanda d'orale"

  function toggleWatch() {
    if (watch.running) {
      watch.pause()
      setSpoken(`Cronometro fermo a ${formatClock(watch.read())}.`)
    } else {
      watch.start()
      setSpoken('Cronometro avviato.')
    }
  }

  function reveal() {
    if (watch.running) {
      watch.pause()
      setSpoken(`Cronometro fermo a ${formatClock(watch.read())}.`)
    }
    setRevealed(true)
  }

  function grade(s: ExamScore) {
    const seconds = watch.read()
    recordExam(seconds > 0 ? { key, score: s, seconds } : { key, score: s })
    setScore(s)
    onGrade?.(s, seconds > 0 ? seconds : undefined)
  }

  const noAnswer = question.answer.trim() === '' && answerFallback !== undefined
  const twoColumns = question.checklist.length > 0

  function again() {
    watch.reset()
    setRevealed(false)
    setTicked([])
    setScore(null)
    setSpoken('')
    onRetry?.()
  }

  return (
    <Frame
      id={anchor}
      label={label}
      icon="speech"
      labelledBy={questionId}
      actions={
        <>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-3 border border-border-strong ${prof.field}`} />
            <span className="label text-text">{prof.name}</span>
          </span>
          {question.fromBank && (
            <span className="label flex items-center gap-1.5 bg-pin px-2 py-0.5 text-pin-contrast">
              <Icon name="pin" size={14} />
              Dalla banca domande
            </span>
          )}
        </>
      }
    >
      <div className="grid gap-6 p-4 @md:p-6">
        {/* la domanda */}
        <div className="grid gap-2">
          <div id={questionId} className="font-label text-[length:var(--step-2)] leading-snug font-bold">
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
          {question.fromBank && question.bankText && (
            <Disclosure
              className="mt-1 border border-border"
              summary={<span className="label text-text">Resoconto originale della banca (EN, testuale)</span>}
              panelClassName="border-t border-border p-4"
            >
              <p lang="en" className="m-0 italic">
                {question.bankText}
              </p>
            </Disclosure>
          )}
        </div>

        {/* il tempo della risposta */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-border py-3">
          <div className="grid gap-0.5">
            {/* il nome lo porta il timer stesso */}
            <span className="label" aria-hidden="true">
              Tempo di risposta
            </span>
            <span role="timer" aria-label="Tempo di risposta" className="num text-[length:var(--step-3)] leading-none">
              {formatClock(watch.seconds)}
            </span>
          </div>
          {!revealed && (
            <button type="button" className={watch.running ? BTN_SECONDARY : BTN_PRIMARY} onClick={toggleWatch}>
              <PlayPause playing={watch.running} />
              {watch.running ? 'Pausa' : watch.seconds > 0 ? 'Riprendi' : 'Avvia il cronometro'}
            </button>
          )}
          <p className="m-0 max-w-[36ch] text-[length:var(--step--1)] text-muted">
            {revealed ? 'Il cronometro si è fermato quando hai rivelato la risposta.' : "Rispondi ad alta voce, come all'orale, poi confronta."}
          </p>
          <span aria-live="polite" className="visually-hidden">
            {spoken}
          </span>
          {timerExtra !== undefined && <div className="min-w-0 basis-full">{typeof timerExtra === 'function' ? timerExtra(revealed) : timerExtra}</div>}
        </div>

        {!revealed ? (
          <div>
            <button type="button" className={BTN_PRIMARY} onClick={reveal}>
              <Icon name="eye" size={18} />
              {revealLabel}
            </button>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${twoColumns ? '@3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : ''}`}>
              {question.checklist.length > 0 && (
                <fieldset className="m-0 grid content-start gap-2 border-0 p-0">
                  <legend className="label mb-2 p-0 text-text">Traccia: spunta i punti che hai toccato</legend>
                  {question.checklist.map((point, i) => (
                    <label
                      key={i}
                      className="group flex min-h-11 cursor-pointer items-start gap-3 border border-border px-3 py-2 hover:border-border-strong has-[:checked]:border-border-strong has-[:checked]:bg-surface-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
                    >
                      <input
                        type="checkbox"
                        checked={ticked[i] ?? false}
                        onChange={(e) => {
                          const on = e.target.checked
                          setTicked((t) => {
                            const next = [...t]
                            next[i] = on
                            return next
                          })
                        }}
                        className="sr-only"
                      />
                      <span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center border border-border-strong bg-surface group-has-[:checked]:bg-accent group-has-[:checked]:text-accent-contrast">
                        <Icon name="check" size={14} className="opacity-0 group-has-[:checked]:opacity-100" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <Rich text={point} inline />
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}
              {noAnswer ? (
                <div className="grid content-start gap-2">{answerFallback}</div>
              ) : (
                <div className="grid content-start gap-2">
                  <p className="label m-0 text-text">Risposta modello</p>
                  <Rich text={question.answer} className={`prose ${FLOW}`} />
                </div>
              )}
            </div>

            {/* autovalutazione */}
            <div role="group" aria-label="Come è andata?" className="grid gap-3 border-t border-border pt-4">
              <p className="label m-0 text-text" aria-hidden="true">
                Come è andata?
              </p>
              {score === null ? (
                <>
                  <div className="grid grid-cols-2 gap-2 @lg:grid-cols-4">
                    {SCORES.map((s) => (
                      <StampButton
                        key={s}
                        mark={String(s)}
                        label={SCORE_LABEL[s]}
                        pinned={s === suggested && tickedCount > 0}
                        aria-describedby={s === suggested && tickedCount > 0 ? suggestionId : undefined}
                        onClick={() => grade(s)}
                      />
                    ))}
                  </div>
                  {suggested !== null && tickedCount > 0 && (
                    <p id={suggestionId} className="m-0 flex items-center gap-2 text-[length:var(--step--1)] text-muted">
                      <span aria-hidden="true" className="size-2.5 bg-pin outline outline-1 outline-border-strong" />
                      Voto suggerito dalla traccia: {tickedCount} punti su {question.checklist.length}.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3" aria-live="polite">
                  <StampMark tone={score >= 2 ? 'ok' : score === 1 ? 'ink' : 'error'}>
                    Voto {score} su 3 · {SCORE_LABEL[score]}
                  </StampMark>
                  <button type="button" className={BTN_SECONDARY} onClick={again}>
                    <Icon name="reset" size={18} />
                    Rifai la domanda
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {history.attempts > 0 && (
          <div className="flex flex-wrap gap-x-10 gap-y-3 border-t border-border pt-4">
            <Stat label="Tentativi" value={history.attempts} />
            {history.last !== null && <Stat label="Ultimo" value={`${history.last} su 3`} />}
            {history.best !== null && <Stat label="Migliore" value={`${history.best} su 3`} />}
          </div>
        )}

        {question.followUps.length > 0 && (
          <div className="grid gap-2 border-t border-border pt-4">
            <p className="label m-0 text-text">Domande di approfondimento</p>
            <ul className="m-0 grid list-none gap-2 p-0">
              {question.followUps.map((f, i) => (
                <li key={i}>
                  <Disclosure
                    className="border border-border"
                    summary={
                      <span className="min-w-0 flex-1">
                        <Rich text={f.q} inline />
                      </span>
                    }
                    panelClassName={`border-t border-border p-4 ${FLOW}`}
                  >
                    <Rich text={f.a} className={`prose ${FLOW}`} />
                  </Disclosure>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Frame>
  )
}
