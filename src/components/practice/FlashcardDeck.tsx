// Mazzo di flashcard con ripetizione dilazionata (lib/srs, SM-2). Ogni carta è una tessera di rilievo:
// angoli vivi, bordo a inchiostro, tacche d'angolo; si gira (flip 3D, solo transform) per vedere la
// risposta e si vota con quattro timbri. Il mazzo si usa nella scheda Flashcard del foglio e nella
// pagina globale delle flashcard: riceve le carte con la loro chiave nei progressi e decide da solo la
// coda (le carte in scadenza, fissate all'inizio della sessione). Con `reviewAll` la prima sessione prende
// invece tutte le carte ricevute, nell'ordine dato: la pagina globale lo usa per "ripassa comunque".
//
// Tastiera: Spazio gira la carta (sul comando "Mostra la risposta" o con il fuoco sul mazzo, che lo
// prende al clic sulla carta), 1-4 votano dopo aver visto la risposta. Dopo il voto il fuoco torna
// sul comando che gira la carta, a fine sessione va al titolo del riepilogo.
//
// Moto: il giro dura --dur-base (240 ms) con ease-out: è un'azione ripetuta decine di volte, anche da
// tastiera, quindi breve. La carta successiva arriva già dritta (elemento nuovo, nessun giro all'indietro
// che mostrerebbe per un istante la risposta della carta dopo). Con meno movimento (sistema o Impostazioni)
// niente rotazione: le due facce si scambiano in dissolvenza.
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { review } from '../../lib/srs'
import { useReduceMotion } from '../../lib/useReduceMotion'
import type { SrsGrade } from '../../lib/srs'
import { activeStreak, useProgress } from '../../store/progress'
import { Rich } from '../content/Rich'
import { BTN_PRIMARY, BTN_SECONDARY, FLOW, Icon } from '../content/shared'
import { dueQueue, formatClock, gradeForKey, GRADES, intervalLabel, KIND_LABEL, nextDue } from './logic'
import type { DeckEntry } from './logic'
import { Kbd, StampButton, Stat, Ticks, Track } from './parts'

const DAY = 86_400_000

export interface DeckSummary {
  reviewed: number
  /** carte votate "Non la sapevo" */
  missed: number
  tally: Record<SrsGrade, number>
  seconds: number
}

export interface FlashcardDeckProps {
  entries: readonly DeckEntry[]
  /** nome accessibile del mazzo */
  label?: string
  /** la prima sessione ripassa tutte le carte ricevute, anche quelle non in scadenza */
  reviewAll?: boolean
  onFinish?: (summary: DeckSummary) => void
}

interface Session {
  /** cambia a ogni nuova sessione */
  id: number
  queue: DeckEntry[]
  index: number
  flipped: boolean
  /** la risposta è stata vista almeno una volta: da qui si può votare */
  revealed: boolean
  tally: Record<SrsGrade, number>
  missed: DeckEntry[]
  startedAt: number
  /** fine della sessione (ms), 0 finché è in corso */
  endedAt: number
}

/** L'ora, letta solo alla creazione di una sessione e nei gestori degli eventi (mai durante il render). */
const clock = () => Date.now()

const emptyTally = (): Record<SrsGrade, number> => ({ 1: 0, 3: 0, 4: 0, 5: 0 })

const newSession = (id: number, queue: DeckEntry[]): Session => ({
  id,
  queue,
  index: 0,
  flipped: false,
  revealed: false,
  tally: emptyTally(),
  missed: [],
  startedAt: clock(),
  endedAt: 0,
})

const cards = (n: number) => (n === 1 ? '1 carta' : `${n} carte`)
const days = (n: number) => (n === 1 ? '1 giorno' : `${n} giorni`)

/** "domani", "tra 3 giorni" a partire da una scadenza in ms. */
const untilLabel = (due: number, now: number) => intervalLabel(Math.ceil((due - now) / DAY))

export function FlashcardDeck({ entries, label = 'Flashcard', reviewAll = false, onFinish }: FlashcardDeckProps) {
  const srs = useProgress((s) => s.flashcards)
  const gradeCard = useProgress((s) => s.gradeCard)
  const streak = useProgress((s) => s.streak)
  const reduced = useReduceMotion()

  const [session, setSession] = useState<Session>(() => {
    const s = newSession(0, [])
    return { ...s, queue: reviewAll ? [...entries] : dueQueue(entries, useProgress.getState().flashcards, s.startedAt) }
  })
  const flipRef = useRef<HTMLButtonElement>(null)
  const summaryRef = useRef<HTMLHeadingElement>(null)
  // dove portare il fuoco dopo il prossimo render: mai al primo montaggio, solo dopo un'azione
  const focusNext = useRef<'flip' | 'summary' | null>(null)

  useEffect(() => {
    const target = focusNext.current
    if (target === null) return
    focusNext.current = null
    ;(target === 'flip' ? flipRef.current : summaryRef.current)?.focus()
  })

  const total = session.queue.length
  const finished = total > 0 && session.index >= total
  const current = finished ? undefined : session.queue[session.index]

  const start = (queue: DeckEntry[]) => {
    focusNext.current = 'flip'
    setSession((s) => newSession(s.id + 1, queue))
  }

  const flip = () => setSession((s) => ({ ...s, flipped: !s.flipped, revealed: true }))

  const grade = (g: SrsGrade) => {
    if (!current || !session.revealed) return
    gradeCard(current.key, g)
    const last = session.index + 1 >= total
    const endedAt = last ? clock() : 0
    const next: Session = {
      ...session,
      index: session.index + 1,
      flipped: false,
      revealed: false,
      tally: { ...session.tally, [g]: session.tally[g] + 1 },
      missed: g === 1 ? [...session.missed, current] : session.missed,
      endedAt,
    }
    const seconds = Math.round((endedAt - session.startedAt) / 1000)
    setSession(next)
    focusNext.current = last ? 'summary' : 'flip'
    if (last) onFinish?.({ reviewed: total, missed: next.missed.length, tally: next.tally, seconds })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || !current) return
    const target = e.target as HTMLElement
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return
    // Spazio su un pulsante lo attiva già da sé (il comando che gira la carta, un timbro): qui solo sul mazzo
    if (e.key === ' ' && target === e.currentTarget) {
      e.preventDefault()
      flip()
      return
    }
    const g = gradeForKey(e.key)
    // un tasto tenuto premuto non vota le carte successive
    if (g !== null && session.revealed && !e.repeat) {
      e.preventDefault()
      grade(g)
    }
  }

  const onCardClick = (e: MouseEvent) => {
    // chi seleziona il testo della carta (per copiarlo) non vuole girarla
    if (window.getSelection()?.toString()) return
    e.preventDefault()
    flip()
  }

  // -------------------------------------------------------------------------------------------
  // Mazzo vuoto, niente in scadenza
  // -------------------------------------------------------------------------------------------

  if (entries.length === 0) {
    return (
      <section aria-label={label} className="@container relative border border-border bg-surface p-5">
        <p className="m-0 flex items-center gap-3 text-muted">
          <Icon name="info" />
          Non ci sono ancora flashcard qui.
        </p>
      </section>
    )
  }

  if (total === 0) {
    // l'ora di riferimento è l'inizio della sessione (vuota): il render resta puro
    const due = nextDue(entries, srs, session.startedAt)
    return (
      <section aria-label={label} className="@container relative grid justify-items-start gap-4 border-2 border-border-strong bg-surface p-5 sm:p-8">
        <Ticks />
        <p className="m-0 flex items-center gap-3 font-label text-[length:var(--step-2)] leading-tight font-bold">
          <Icon name="check" className="text-ok" />
          Nessuna carta in scadenza.
        </p>
        {due !== null && <p className="m-0 text-muted">La prossima torna {untilLabel(due, session.startedAt)}.</p>}
        <button type="button" className={BTN_SECONDARY} onClick={() => start([...entries])}>
          {entries.length === 1 ? 'Ripassa comunque la carta' : `Ripassa comunque tutte le ${entries.length} carte`}
        </button>
      </section>
    )
  }

  // -------------------------------------------------------------------------------------------
  // Riepilogo
  // -------------------------------------------------------------------------------------------

  if (finished) {
    const now = session.endedAt
    const due = nextDue(entries, srs, now)
    const run = activeStreak(streak, now)
    const missed = session.missed.length
    return (
      <section aria-label={label} className="@container relative grid gap-6 border-2 border-border-strong bg-surface p-5 sm:p-8">
        <Ticks />
        <div className="grid gap-1">
          <h3 ref={summaryRef} tabIndex={-1} className="m-0 font-label text-[length:var(--step-3)] leading-tight font-bold">
            Sessione finita
          </h3>
          <p className="m-0 text-muted">
            Hai ripassato {cards(total)} in <span className="num">{formatClock(Math.round((session.endedAt - session.startedAt) / 1000))}</span>.
          </p>
        </div>

        <ul aria-label="Voti della sessione" className="m-0 grid list-none grid-cols-2 gap-2 p-0 @lg:grid-cols-4">
          {GRADES.map((g) => {
            const n = session.tally[g.grade]
            return (
              <li key={g.key} className={`border-2 p-[3px] ${n > 0 ? 'border-border-strong text-text' : 'border-border text-faint'}`}>
                <span className="grid justify-items-center gap-0.5 border border-current px-2 py-2 text-center">
                  <span className="num text-[length:var(--step-3)] leading-none font-bold">{n}</span>
                  <span className="font-label text-[length:var(--step--1)] font-bold tracking-[0.06em] uppercase">{g.label}</span>
                </span>
              </li>
            )
          })}
        </ul>

        <div className="flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-4">
          <Stat label="Serie di studio" value={`${days(run)} · record ${streak.best}`} />
          {due !== null && <Stat label="Prossima carta" value={untilLabel(due, now)} />}
        </div>

        <div className="flex flex-wrap gap-3">
          {missed > 0 && (
            <button type="button" className={BTN_PRIMARY} onClick={() => start(session.missed)}>
              <Icon name="reset" size={18} />
              {missed === 1 ? 'Ripassa la carta che non sapevi' : `Ripassa le ${missed} carte che non sapevi`}
            </button>
          )}
          <button type="button" className={missed > 0 ? BTN_SECONDARY : BTN_PRIMARY} onClick={() => start([...entries])}>
            Ripassa tutto il mazzo
          </button>
        </div>
      </section>
    )
  }

  // -------------------------------------------------------------------------------------------
  // Studio
  // -------------------------------------------------------------------------------------------

  // `current` esiste: la coda non è vuota e la sessione non è finita
  const entry = current as DeckEntry
  const state = srs[entry.key]
  const { flipped, revealed } = session
  const kind = KIND_LABEL[entry.card.kind] ?? entry.card.kind

  // coordinate della tessera, come il numero di un foglio nell'angolo: per gli occhi (il contatore sopra lo dice già)
  const pad = (n: number) => String(n).padStart(2, '0')
  const coords = (
    <p aria-hidden="true" className="num m-0 self-end text-[length:var(--step--1)] text-faint">
      {pad(session.index + 1)} / {pad(total)}
    </p>
  )

  const face = 'relative flex min-h-60 flex-col gap-4 border-2 border-border-strong bg-surface p-5 [grid-area:1/1] @md:p-8'
  const turning = reduced
    ? 'transition-opacity duration-[var(--dur-base)] ease-out'
    : '[backface-visibility:hidden]'

  return (
    <section
      aria-label={label}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="@container grid gap-4 outline-offset-4"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="label m-0 text-text" aria-live="polite">
          Carta {session.index + 1} di {total}
        </p>
        <Track total={total} done={session.index} current={session.index} />
        {entry.origin !== undefined && <p className="label m-0 ml-auto">{entry.origin}</p>}
      </div>

      {/* La tessera. Il clic la gira (comodità per il mouse); da tastiera c'è il comando qui sotto. */}
      <div onClick={onCardClick} className="relative cursor-pointer [perspective:1600px]">
        <Ticks />
        <div
          // elemento nuovo a ogni carta: arriva dritta, senza girare all'indietro
          key={`${session.id}-${session.index}`}
          className={
            'grid transition-[transform,opacity] duration-[var(--dur-base)] ease-[var(--ease-out)] [transform-style:preserve-3d] starting:opacity-0 ' +
            (flipped && !reduced ? '[transform:rotateY(180deg)]' : '')
          }
        >
          <div className={`${face} ${turning} ${reduced && flipped ? 'opacity-0' : ''}`} inert={flipped} aria-hidden={flipped || undefined}>
            <p className="m-0 flex items-center justify-between gap-3 border-b border-border pb-2">
              <span className="label text-text">Domanda</span>
              <span className="label">{kind}</span>
            </p>
            <Rich text={entry.card.q} className={`prose flex-1 font-label text-[length:var(--step-1)] leading-snug font-semibold ${FLOW}`} />
            {coords}
          </div>
          {revealed && (
            <div
              className={`${face} ${turning} ${reduced ? (flipped ? '' : 'opacity-0') : '[transform:rotateY(180deg)]'}`}
              inert={!flipped}
              aria-hidden={!flipped || undefined}
            >
              <p className="m-0 flex items-center justify-between gap-3 border-b border-border pb-2">
                <span className="label flex items-center gap-2 text-text">
                  <span aria-hidden="true" className="size-2.5 bg-pin outline outline-1 outline-border-strong" />
                  Risposta
                </span>
                <span className="label">{kind}</span>
              </p>
              <Rich text={entry.card.a} className={`prose flex-1 ${FLOW}`} />
              {coords}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button ref={flipRef} type="button" aria-keyshortcuts="Space" className={flipped ? BTN_SECONDARY : BTN_PRIMARY} onClick={flip}>
          <Icon name={flipped ? 'reset' : 'eye'} size={18} />
          {flipped ? 'Torna alla domanda' : 'Mostra la risposta'}
        </button>
        <p className="m-0 flex flex-wrap items-center gap-2 text-[length:var(--step--1)] text-muted">
          <Kbd>Spazio</Kbd> gira la carta · <Kbd>1</Kbd>–<Kbd>4</Kbd> votano
        </p>
      </div>

      <div role="group" aria-label="Quanto la sapevi?" className="grid gap-2">
        <p className="label m-0" aria-hidden="true">
          {revealed ? 'Quanto la sapevi?' : 'Prima guarda la risposta, poi vota'}
        </p>
        <div className="grid grid-cols-2 gap-2 @lg:grid-cols-4">
          {GRADES.map((g) => (
            <StampButton
              key={g.key}
              mark={g.key}
              label={g.label}
              detail={intervalLabel(review(state, g.grade, 0).interval)}
              aria-keyshortcuts={g.key}
              disabled={!revealed}
              onClick={() => grade(g.grade)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
