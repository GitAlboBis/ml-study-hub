// Chi sono?: la definizione di un termine del glossario, e un campo per scriverlo in italiano o in inglese.
// Gli indizi scendono come una scala di legenda: definizione, iniziali del termine italiano, termine
// inglese, quattro nomi fra cui scegliere; accanto, quanto vale adesso il turno (con lo spillo). Un
// tentativo sbagliato apre il prossimo indizio e resta scritto sotto il campo. A turno chiuso il termine
// compare con la sua traduzione e "Avanti" prende il fuoco. "Un altro indizio" resta nello schermo mentre gli
// indizi si allungano; al quarto indizio sparisce, e il fuoco va sul primo dei quattro nomi.
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Rich } from '../../components/content/Rich'
import { BTN_PRIMARY, BTN_SECONDARY, FLOW, Icon } from '../../components/content/shared'
import { Stat, Track } from '../../components/practice/parts'
import { createRng } from '../../lib/rng'
import { useReduceMotion } from '../../lib/useReduceMotion'
import { EndPanel, FromSheet, Hud, ReviewTitle, Verdict } from './GameKit'
import { newSeed } from './kit'
import type { GameProps } from './kit'
import { glossaryOf } from './pool'
import { currentWhoRound, giveUp, guess, HINT_POINTS, initials, maskTerm, moreHint, newWho, nextWho, pickWho } from './logic/whoAmI'
import type { WhoState } from './logic/whoAmI'

const INPUT = 'min-h-11 w-full rounded-m border border-border-strong bg-bg px-3 text-text'

const HINT_LABEL = ['Definizione', 'Iniziali', 'In inglese', 'Quattro nomi'] as const

function Hint({ n, label, children }: { n: number; label: string; children: ReactNode }) {
  return (
    <li className="m-0 grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-t border-border px-4 py-3 first:border-t-0 @3xl:px-6">
      <span aria-hidden="true" className="num grid size-8 place-items-center border border-border-strong bg-surface-2 text-[length:var(--step--1)]">
        {n}
      </span>
      <div className="grid gap-1">
        <p className="label m-0">
          Indizio {n} · {label}
        </p>
        {children}
      </div>
    </li>
  )
}

function Game({ state: initial, onAgain, scope, focusStart }: { state: WhoState; onAgain: () => void; scope: GameProps['scope']; focusStart: boolean }) {
  const [state, setState] = useState(initial)
  const [text, setText] = useState('')
  const uid = useId()
  const field = useRef<HTMLInputElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  const more = useRef<HTMLButtonElement>(null)
  const names = useRef<HTMLDivElement>(null)
  const reduced = useReduceMotion()
  const round = currentWhoRound(state)
  const total = state.rounds.length

  // a turno chiuso il fuoco va su "Avanti"; a turno nuovo torna nel campo
  useEffect(() => {
    if (state.outcome) next.current?.focus()
  }, [state.outcome])

  // dopo "Gioca ancora" il fuoco va nel campo del primo termine
  const focusFirst = useRef(focusStart)
  useEffect(() => {
    if (focusFirst.current) field.current?.focus()
  }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    const after = guess(state, text)
    if (after === state) return
    setState(after)
    setText('')
  }

  function hint() {
    const after = moreHint(state)
    setState(after)
    requestAnimationFrame(() => {
      if (after.stage >= 3) names.current?.querySelector<HTMLButtonElement>('button')?.focus()
      else more.current?.scrollIntoView?.({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
    })
  }

  function advance() {
    setState(nextWho(state))
    requestAnimationFrame(() => field.current?.focus())
  }

  if (!round) {
    const solved = state.results.filter((r) => r.solved).length
    return (
      <EndPanel
        title="Termini riconosciuti"
        stamp={`${solved} su ${total}`}
        tone={solved === total ? 'pin' : 'ink'}
        scope={scope}
        onAgain={onAgain}
        stats={
          <>
            <Stat label="Punteggio" value={state.score} pinned />
            <Stat label="Indovinati" value={`${solved} di ${total}`} />
            <Stat label="Al primo indizio" value={state.results.filter((r) => r.solved && r.stage === 0).length} />
          </>
        }
      >
        <ReviewTitle>Il glossario della partita</ReviewTitle>
        <ul className="m-0 grid list-none gap-0 p-0">
          {state.results.map(({ round: r, solved: ok, points }) => (
            <li key={`${r.entry.moduleId}:${r.entry.item.term}`} className="m-0 -mt-px grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border border-border px-4 py-3">
              <Icon name={ok ? 'check' : 'cross'} className={ok ? 'text-ok' : 'text-error'} />
              <span className="grid gap-0.5">
                <span className="font-label font-bold">{r.entry.item.term}</span>
                <span lang="en" className="text-muted italic">
                  {r.entry.item.en}
                </span>
                <span className="visually-hidden">{ok ? 'indovinato' : 'non indovinato'}</span>
              </span>
              <span className="num text-muted">{points}</span>
            </li>
          ))}
        </ul>
      </EndPanel>
    )
  }

  const entry = round.entry.item
  const worth = HINT_POINTS[state.stage]
  const out = state.outcome
  return (
    <div className="grid gap-4">
      <Hud>
        <Stat label="Termine" value={`${state.index + 1} di ${total}`} />
        <Stat label="Punteggio" value={state.score} />
        <Stat label="Vale adesso" value={out ? '—' : `${worth} punti`} pinned={!out} />
        <span className="self-center">
          <Track total={total} done={state.index + (out ? 1 : 0)} current={out ? -1 : state.index} />
        </span>
      </Hud>

      <section aria-labelledby={`${uid}-t`} className="border-2 border-border-strong bg-surface">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border-strong px-4 py-3 @3xl:px-6">
          <h2 id={`${uid}-t`} className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold">
            Chi sono?
          </h2>
          <FromSheet moduleId={round.entry.moduleId} />
        </header>

        <ol aria-live="polite" className="m-0 grid list-none p-0">
          <Hint n={1} label={HINT_LABEL[0]}>
            <Rich text={maskTerm(entry.def, entry)} className={`prose text-[length:var(--step-1)] leading-snug ${FLOW}`} />
          </Hint>
          {(state.stage >= 1 || out) && (
            <Hint n={2} label={HINT_LABEL[1]}>
              <p className="num m-0 text-[length:var(--step-1)] tracking-[0.12em] break-words">{initials(entry.term)}</p>
            </Hint>
          )}
          {(state.stage >= 2 || out) && (
            <Hint n={3} label={HINT_LABEL[2]}>
              <p lang="en" className="m-0 text-[length:var(--step-1)] italic">
                {entry.en}
              </p>
            </Hint>
          )}
          {state.stage >= 3 && !out && (
            <Hint n={4} label={HINT_LABEL[3]}>
              <div ref={names} role="group" aria-label="Scegli il termine" className="mt-1 grid gap-2 @xl:grid-cols-2">
                {round.options.map((o, i) => (
                  <button
                    key={`${o.moduleId}:${o.item.term}`}
                    type="button"
                    onClick={() => setState(pickWho(state, i))}
                    className="grid min-h-12 cursor-pointer gap-0.5 border-2 border-border-strong bg-surface px-3 py-2 text-left transition-[background-color,scale] duration-[var(--dur-fast)] ease-out hover:bg-surface-2 active:scale-[0.98]"
                  >
                    <span className="font-label font-bold">{o.item.term}</span>
                    <span lang="en" className="text-[length:var(--step--1)] text-muted italic">
                      {o.item.en}
                    </span>
                  </button>
                ))}
              </div>
            </Hint>
          )}
        </ol>

        {/* la regione di stato c'è sempre, così l'esito del turno viene annunciato quando compare */}
        <div role="status" className="px-4 @3xl:px-6">
          {out && (
            <div className="border-t border-border-strong pt-4">
              <Verdict ok={out.solved}>
                {out.solved ? `Giusto: +${out.points} punti.` : 'Questa volta no.'} Il termine è «{entry.term}» (<span lang="en">{entry.en}</span>).
              </Verdict>
            </div>
          )}
        </div>
        {out ? (
          <div className="grid gap-3 p-4 @3xl:px-6">
            <div>
              <button ref={next} type="button" className={BTN_PRIMARY} onClick={advance}>
                {state.index + 1 < total ? 'Avanti' : 'Vedi il risultato'}
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-3 border-t border-border-strong p-4 @3xl:px-6">
            <label htmlFor={`${uid}-in`} className="font-bold">
              Scrivi il termine, in italiano o in inglese
            </label>
            <div className="flex flex-wrap gap-3">
              <input
                ref={field}
                id={`${uid}-in`}
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-describedby={`${uid}-tries`}
                className={`${INPUT} max-w-[26rem] flex-1 basis-56`}
              />
              <button type="submit" className={BTN_PRIMARY}>
                Prova
              </button>
            </div>
            <p id={`${uid}-tries`} role="status" className="m-0 text-[length:var(--step--1)] text-muted">
              {state.tries.length > 0 && (
                <>
                  Non è {state.tries.map((t) => `«${t}»`).join(', né ')}: {state.stage < 3 ? 'ecco un altro indizio.' : 'scegli fra i quattro nomi.'}
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-3 border-t border-border pt-3">
              {state.stage < 3 && (
                <button ref={more} type="button" className={BTN_SECONDARY} onClick={hint}>
                  Un altro indizio{' '}
                  <span className="num text-[length:var(--step--1)]">poi {HINT_POINTS[state.stage + 1]}</span>
                </button>
              )}
              <button type="button" className={BTN_SECONDARY} onClick={() => setState(giveUp(state))}>
                Mi arrendo
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

export default function WhoAmI({ modules, scope, seed: firstSeed }: GameProps) {
  const pool = useMemo(() => glossaryOf(modules), [modules])
  const [seed, setSeed] = useState(() => firstSeed ?? newSeed())
  const [again, setAgain] = useState(false)
  const state = useMemo(() => newWho(pool, createRng(seed)), [pool, seed])
  return (
    <Game
      key={seed}
      state={state}
      scope={scope}
      focusStart={again}
      onAgain={() => {
        setAgain(true)
        setSeed((s) => (s + 1) >>> 0)
      }}
    />
  )
}
