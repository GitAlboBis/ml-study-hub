// Completa la formula: la targa della formula con un pezzo coperto (\boxed{?}) e le scelte in timbri
// numerati. Dopo la scelta il timbro giusto prende il segno di stato, la formula intera compare sotto con
// la sua spiegazione a scomparsa, e "Avanti" prende il fuoco. Tasti 1-4 per scegliere; Invio sul pulsante.
// Le scelte hanno un nome breve ("Opzione 2") e la formula come descrizione: KaTeX dentro il nome
// accessibile di un pulsante lo rende illeggibile ai lettori di schermo che non leggono MathML.
import { useId, useMemo, useRef, useState } from 'react'
import { M } from '../../components/content/M'
import { Rich } from '../../components/content/Rich'
import { BTN_PRIMARY, Disclosure, FLOW, Icon } from '../../components/content/shared'
import { Stat, Track } from '../../components/practice/parts'
import { createRng } from '../../lib/rng'
import { EndPanel, FromSheet, Hud, ReviewTitle, Verdict } from './GameKit'
import { currentRound, fillOver, fillPoints, newFill, nextRound, pickOption } from './logic/fillFormula'
import type { FillState } from './logic/fillFormula'
import { newSeed, useFocusOnMount, useHotkeys } from './kit'
import type { GameProps } from './kit'
import { blanksOf } from './pool'

function Round({ state: initial, onAgain, scope, focusStart }: { state: FillState; onAgain: () => void; scope: GameProps['scope']; focusStart: boolean }) {
  const [state, setState] = useState(initial)
  const title = useFocusOnMount<HTMLHeadingElement>(focusStart)
  const next = useRef<HTMLButtonElement>(null)
  const uid = useId()
  const round = currentRound(state)
  const total = state.rounds.length

  // "Avanti" sparisce premendolo: il fuoco va sul titolo della formula nuova (l'esito finale lo prende da sé)
  function advance() {
    setState(nextRound(state))
    requestAnimationFrame(() => title.current?.focus())
  }

  function choose(option: number) {
    if (state.picked !== null) return
    // funzionale: pickOption ignora una seconda scelta anche se arriva prima del render
    setState((s) => pickOption(s, option))
    // il fuoco va su "Avanti" dopo il render: così Invio fa proseguire
    requestAnimationFrame(() => next.current?.focus())
  }

  useHotkeys(
    (key) => {
      if (!round || state.picked !== null) return false
      const n = Number(key)
      if (!Number.isInteger(n) || n < 1 || n > round.options.length) return false
      choose(n - 1)
      return true
    },
    !fillOver(state),
  )

  if (!round) {
    return (
      <EndPanel
        title="Formule completate"
        stamp={`${state.correct} su ${total}`}
        tone={state.correct === total ? 'pin' : 'ink'}
        scope={scope}
        onAgain={onAgain}
        stats={
          <>
            <Stat label="Punteggio" value={state.score} pinned />
            <Stat label="Giuste" value={`${state.correct} di ${total}`} />
            <Stat label="Serie migliore" value={state.bestStreak} />
          </>
        }
      >
        {state.misses.length === 0 ? (
          <p className="m-0">Nessun pezzo sbagliato: queste formule le sai scrivere.</p>
        ) : (
          <>
            <ReviewTitle>Da ripassare</ReviewTitle>
            <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-0 p-0">
              {state.misses.map(({ round: r, picked }, i) => (
                <li key={i} className="m-0 -mt-px grid min-w-0 gap-2 border border-border px-4 py-3">
                  <span className="font-label font-bold">{r.formula.name}</span>
                  <span className="overflow-x-auto">
                    <M tex={r.formula.latex} display />
                  </span>
                  <span className="flex flex-wrap items-baseline gap-x-3 text-[length:var(--step--1)] text-muted">
                    <span className="label">Avevi scelto</span>
                    <M tex={r.options[picked]} />
                    <span className="label">al posto di</span>
                    <M tex={r.options[r.answer]} />
                  </span>
                  <FromSheet moduleId={r.moduleId} tab="formule" />
                </li>
              ))}
            </ul>
          </>
        )}
      </EndPanel>
    )
  }

  const answered = state.picked !== null
  const right = answered && state.picked === round.answer
  return (
    // una sola traccia minmax(0,1fr): una formula lunga scorre nella sua cornice invece di allargare la colonna
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <Hud>
        <Stat label="Formula" value={`${state.index + 1} di ${total}`} />
        <Stat label="Punteggio" value={state.score} />
        <Stat label="Di fila" value={state.streak} pinned={state.streak >= 2} />
        <span className="self-center">
          <Track total={total} done={state.index + (answered ? 1 : 0)} current={answered ? -1 : state.index} />
        </span>
      </Hud>

      <section aria-labelledby={`${uid}-t`} className="min-w-0 border-2 border-border-strong bg-surface">
        <header className="grid gap-1 border-b border-border-strong px-4 py-3 @3xl:px-6">
          <p className="label m-0">Formula da completare</p>
          <h2 id={`${uid}-t`} ref={title} tabIndex={-1} className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold">
            {round.formula.name}
          </h2>
          <p lang="en" className="m-0 text-muted italic">
            {round.formula.nameEn}
          </p>
        </header>
        <div className="overflow-x-auto px-4 py-6 text-[length:var(--step-1)] @3xl:px-6">
          <M tex={round.masked} display />
        </div>

        <div role="group" aria-label="Scegli il pezzo mancante" className="grid gap-2 border-t border-border-strong p-4 @xl:grid-cols-2 @3xl:px-6">
          {round.options.map((o, i) => {
            const isAnswer = answered && i === round.answer
            const isWrongPick = answered && i === state.picked && !isAnswer
            const tone = isAnswer ? 'bg-ok-bg' : isWrongPick ? 'bg-error-bg' : answered ? 'bg-surface text-muted' : 'bg-surface hover:bg-surface-2'
            return (
              <button
                key={i}
                type="button"
                aria-label={`Opzione ${i + 1}${isAnswer ? ', giusta' : isWrongPick ? ', la tua scelta, sbagliata' : ''}`}
                aria-describedby={`${uid}-o${i}`}
                aria-disabled={answered || undefined}
                onClick={() => choose(i)}
                className={`grid min-h-16 cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-2 border-border-strong px-3 py-2 text-left transition-[background-color,scale] duration-[var(--dur-fast)] ease-out active:scale-[0.98] aria-disabled:cursor-default aria-disabled:active:scale-100 ${tone}`}
              >
                <span aria-hidden="true" className="num grid size-9 place-items-center border border-current text-[length:var(--step-0)] font-bold">
                  {i + 1}
                </span>
                <span id={`${uid}-o${i}`} className="overflow-x-auto py-1 text-[length:var(--step-0)]">
                  <M tex={o} />
                </span>
                {isAnswer && <Icon name="check" className="text-ok" />}
                {isWrongPick && <Icon name="cross" className="text-error" />}
              </button>
            )
          })}
        </div>

        <div role="status">
          {answered && (
            <div className="grid gap-3 border-t border-border-strong p-4 @3xl:px-6">
              <Verdict ok={right}>{right ? `Giusta: +${fillPoints(state.streak - 1)} punti.` : 'Non è questo il pezzo: ecco la formula intera.'}</Verdict>
              <div className="overflow-x-auto border border-border bg-bg px-3 py-2">
                <M tex={round.formula.latex} display />
              </div>
              <Disclosure summary={<span className="label text-text">Che cosa dice</span>} className="border border-border" panelClassName={`prose px-4 pb-4 ${FLOW}`}>
                <Rich text={round.formula.explain} className={FLOW} />
              </Disclosure>
              <FromSheet moduleId={round.moduleId} tab="formule" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border-strong px-4 py-3 @3xl:px-6">
          {answered ? (
            <button ref={next} type="button" className={BTN_PRIMARY} onClick={advance}>
              {state.index + 1 < total ? 'Avanti' : 'Vedi il risultato'}
              <Icon name="arrow" size={18} />
            </button>
          ) : (
            <p className="m-0 text-[length:var(--step--1)] text-muted">Tasti 1-{round.options.length} per scegliere.</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default function FillFormula({ modules, scope, seed: firstSeed }: GameProps) {
  const pool = useMemo(() => blanksOf(modules), [modules])
  const [seed, setSeed] = useState(() => firstSeed ?? newSeed())
  const [again, setAgain] = useState(false)
  const state = useMemo(() => newFill(pool, createRng(seed)), [pool, seed])
  return (
    <Round
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
