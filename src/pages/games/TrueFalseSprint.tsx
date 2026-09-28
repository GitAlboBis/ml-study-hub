// Vero/Falso Sprint: 60 secondi di affermazioni (quiz tf dei fogli). Prima del via una cornice con le regole
// e il pulsante "Via"; durante lo sprint il tempo che resta (cifre grandi e barra che si svuota), punteggio,
// combo e moltiplicatore con lo spillo quando sale; l'affermazione in una cornice che si annuncia, e due
// timbri Vero / Falso (tasti V o freccia sinistra, F o freccia destra). Nessuna animazione fra
// un'affermazione e l'altra: si risponde decine di volte, spesso da tastiera.
// Ogni risposta va nei progressi come tentativo di quel quiz (recordQuiz), come nella scheda Quiz del foglio.
// Con la scheda nascosta il tempo si ferma. A fine sprint: errori da ripassare con la spiegazione e
// "Rigioca gli errori", uno sprint con le sole affermazioni sbagliate.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Rich } from '../../components/content/Rich'
import { BTN_PRIMARY, BTN_SECONDARY, FLOW, Icon } from '../../components/content/shared'
import { StampButton, Stat } from '../../components/practice/parts'
import { createRng } from '../../lib/rng'
import { useReduceMotion } from '../../lib/useReduceMotion'
import { progressKey, useProgress } from '../../store/progress'
import { EndPanel, FromSheet, Hud, ReviewTitle } from './GameKit'
import { count, newSeed, useFocusOnMount, useHotkeys } from './kit'
import type { GameProps } from './kit'
import { tfOf } from './pool'
import type { Tagged, TfItem } from './pool'
import { answerSprint, isRunning, multiplier, newSprint, pauseSprint, remaining, resumeSprint, sprintMistakes, SPRINT_SECONDS, startSprint, tickSprint } from './logic/trueFalse'

const TICK_MS = 200

function Ready({ total, review, onStart, focusStart }: { total: number; review: boolean; onStart: () => void; focusStart: boolean }) {
  const go = useFocusOnMount<HTMLButtonElement>(focusStart)
  return (
    <section aria-labelledby="sprint-pronto" className="border-2 border-border-strong bg-surface">
      <div className="grid items-center gap-5 p-5 @3xl:grid-cols-[auto_minmax(0,1fr)] @3xl:gap-8 @3xl:p-8">
        <p className="m-0 grid justify-items-start">
          <span className="num text-[length:var(--step-5)] leading-none font-bold">{SPRINT_SECONDS}</span>
          <span className="label">secondi</span>
        </p>
        <div className="grid gap-2">
          <h2 id="sprint-pronto" className="m-0 font-label text-[length:var(--step-3)] leading-tight font-bold">
            {review ? 'Ripasso degli errori' : 'Pronto per lo sprint?'}
          </h2>
          <p className="m-0 max-w-[var(--measure)]">
            {count(total, 'affermazione', 'affermazioni')} in ordine casuale. Rispondi con <strong>V</strong> o <strong>F</strong> (oppure le frecce): ogni tre
            risposte giuste di fila il moltiplicatore sale.
          </p>
        </div>
      </div>
      <div className="border-t border-border-strong px-5 py-4 @3xl:px-8">
        <button ref={go} type="button" className={BTN_PRIMARY} onClick={onStart}>
          Via
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </section>
  )
}

interface SprintProps {
  pool: Tagged<TfItem>[]
  seed: number
  review: boolean
  /** dopo "Gioca ancora" il fuoco va su "Via" */
  focusStart: boolean
  scope: GameProps['scope']
  onAgain: () => void
  onReview: (pool: Tagged<TfItem>[]) => void
}

function Sprint({ pool, seed, review, focusStart, scope, onAgain, onReview }: SprintProps) {
  const [state, setState] = useState(() => newSprint(pool, createRng(seed)))
  const [now, setNow] = useState(() => Date.now())
  const recordQuiz = useProgress((s) => s.recordQuiz)
  // al via il fuoco va sul titolo dell'affermazione: chi usa un lettore di schermo sa che è partito
  const heading = useRef<HTMLHeadingElement>(null)
  // e il tavolo sale in cima, così affermazione e timbri stanno nello schermo
  const board = useRef<HTMLDivElement>(null)
  const reduced = useReduceMotion()
  const running = isRunning(state)
  const paused = state.pausedAt !== null
  const left = Math.ceil(remaining(state, now))

  // il tempo: letto con Date.now() a ogni tick, lo sprint si chiude da solo allo scadere
  useEffect(() => {
    if (!running || paused) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      setState((s) => tickSprint(s, t))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [running, paused])

  // scheda nascosta: il tempo si ferma e riparte al ritorno
  useEffect(() => {
    if (!running) return
    const onVisibility = () => {
      const t = Date.now()
      setNow(t)
      setState((s) => (document.hidden ? pauseSprint(s, t) : resumeSprint(s, t)))
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [running])

  function start() {
    const t = Date.now()
    setNow(t)
    setState((s) => startSprint(s, t))
    requestAnimationFrame(() => {
      board.current?.scrollIntoView?.({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
      heading.current?.focus({ preventScroll: true })
    })
  }

  // ogni risposta nuova va nei progressi una volta sola, anche se due tasti arrivano prima di un render
  const recorded = useRef(0)
  useEffect(() => {
    const fresh = state.answers.slice(recorded.current)
    recorded.current = state.answers.length
    for (const a of fresh) recordQuiz(progressKey(a.entry.moduleId, a.entry.item.id), a.correct)
  }, [state.answers, recordQuiz])

  function answer(given: boolean) {
    const t = Date.now()
    setNow(t)
    // aggiornamento funzionale: due risposte di fila leggono sempre lo stato dopo la precedente
    setState((s) => answerSprint(s, given, t))
  }

  useHotkeys((key) => {
    if (key === 'v' || key === 'V' || key === 'ArrowLeft') answer(true)
    else if (key === 'f' || key === 'F' || key === 'ArrowRight') answer(false)
    else return false
    return true
  }, running && !paused)

  if (state.startedAt === null) return <Ready total={state.queue.length} review={review} onStart={start} focusStart={focusStart} />

  if (state.endedAt !== null) {
    const mistakes = sprintMistakes(state)
    const correct = state.answers.length - mistakes.length
    return (
      <EndPanel
        title={state.reason === 'domande' ? 'Affermazioni finite' : 'Tempo scaduto'}
        stamp={`${state.score} punti`}
        tone={mistakes.length === 0 && state.answers.length > 0 ? 'pin' : 'ink'}
        scope={scope}
        onAgain={onAgain}
        extra={
          mistakes.length > 0 && (
            <button type="button" className={BTN_SECONDARY} onClick={() => onReview(mistakes.map((m) => m.entry))}>
              Rigioca gli errori
            </button>
          )
        }
        stats={
          <>
            <Stat label="Punteggio" value={state.score} pinned />
            <Stat label="Giuste" value={`${correct} su ${state.answers.length}`} />
            <Stat label="Combo migliore" value={state.bestCombo} />
            {state.timeBonus > 0 && <Stat label="Bonus tempo" value={`+${state.timeBonus}`} />}
          </>
        }
      >
        {state.answers.length === 0 ? (
          <p className="m-0">Nessuna risposta data in tempo. Riprova: bastano V e F.</p>
        ) : mistakes.length === 0 ? (
          <p className="m-0">Nessun errore: tutte le risposte date erano giuste.</p>
        ) : (
          <>
            <ReviewTitle>Da ripassare</ReviewTitle>
            <ul className="m-0 grid list-none gap-0 p-0">
              {mistakes.map(({ entry }) => (
                <li key={`${entry.moduleId}:${entry.item.id}`} className="m-0 -mt-px grid gap-2 border border-border px-4 py-3">
                  <Rich text={entry.item.q} className={`prose ${FLOW}`} />
                  <p className="label m-0 flex items-center gap-1.5 text-text">
                    <Icon name="info" size={16} className="text-info" />
                    Era {entry.item.answer ? 'vera' : 'falsa'}
                  </p>
                  <Rich text={entry.item.explanation} className={`prose text-muted ${FLOW}`} />
                  <FromSheet moduleId={entry.moduleId} tab="quiz" />
                </li>
              ))}
            </ul>
          </>
        )}
      </EndPanel>
    )
  }

  const entry = state.queue[state.index]
  const last = state.answers.at(-1)
  const mult = multiplier(state.combo)
  return (
    <div ref={board} className="grid gap-4">
      <Hud>
        {/* negli ultimi dieci secondi il tempo prende lo spillo: evidenza, non uno stato d'errore */}
        <p className={`m-0 grid gap-0.5 ${left <= 10 ? 'bg-pin px-2 py-1 text-pin-contrast' : ''}`}>
          <span className={`label ${left <= 10 ? 'text-pin-contrast' : ''}`}>Secondi</span>
          <span className="num text-[length:var(--step-3)] leading-none font-bold">{left}</span>
        </p>
        <Stat label="Punteggio" value={state.score} />
        <Stat label="Combo" value={state.combo} />
        <Stat label="Moltiplicatore" value={`×${mult}`} pinned={mult > 1} />
      </Hud>
      <span aria-hidden="true" className="block h-2 w-full overflow-hidden border border-border-strong">
        <span
          className="block h-full origin-left bg-accent transition-transform duration-200 ease-linear"
          style={{ transform: `scaleX(${remaining(state, now) / SPRINT_SECONDS})` }}
        />
      </span>
      <p role="status" className="visually-hidden">
        {left <= 10 ? `Mancano ${left <= 5 ? 'pochi' : '10'} secondi.` : ''}
      </p>

      <section aria-labelledby="sprint-affermazione" className="border-2 border-border-strong bg-surface">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border-strong px-4 py-2 @3xl:px-6">
          <h2 id="sprint-affermazione" ref={heading} tabIndex={-1} className="label m-0 text-text">
            Affermazione {state.index + 1}
          </h2>
          <FromSheet moduleId={entry.moduleId} />
        </header>
        <div aria-live="polite" className="min-h-[5.5em] px-4 py-5 text-[length:var(--step-1)] leading-snug @3xl:px-6">
          <Rich text={entry.item.q} className={FLOW} />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-border-strong p-4 @3xl:px-6">
          <StampButton mark="V" label="Vero" detail="tasto V o ←" onClick={() => answer(true)} />
          <StampButton mark="F" label="Falso" detail="tasto F o →" onClick={() => answer(false)} />
        </div>
      </section>

      {/* key: ogni risposta rimonta l'esito, così due esiti uguali di fila sono due annunci */}
      <p role="status" className="m-0 min-h-[1.6em]">
        {last &&
          (last.correct ? (
            <span key={state.answers.length} className="flex items-center gap-2 font-semibold">
              <Icon name="check" size={18} className="text-ok" />
              Giusta, +{last.points}
            </span>
          ) : (
            <span key={state.answers.length} className="flex items-center gap-2 font-semibold">
              <Icon name="cross" size={18} className="text-error" />
              Sbagliata: era {last.entry.item.answer ? 'vera' : 'falsa'}. La combo riparte.
            </span>
          ))}
      </p>
    </div>
  )
}

export default function TrueFalseSprint({ modules, scope, seed: firstSeed }: GameProps) {
  const all = useMemo(() => tfOf(modules), [modules])
  const [round, setRound] = useState(() => ({ seed: firstSeed ?? newSeed(), pool: all, review: false, again: false }))
  return (
    <Sprint
      key={round.seed}
      pool={round.pool}
      seed={round.seed}
      review={round.review}
      focusStart={round.again}
      scope={scope}
      onAgain={() => setRound((r) => ({ seed: (r.seed + 1) >>> 0, pool: all, review: false, again: true }))}
      onReview={(pool) => setRound((r) => ({ seed: (r.seed + 1) >>> 0, pool, review: true, again: true }))}
    />
  )
}
