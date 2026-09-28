// Palestra esercizi: serie di dieci esercizi generativi a livelli, con ExerciseRunner dei fogli (stesso
// controllo delle risposte, stessa soluzione a scomparsa). Prima della serie si sceglie il livello di
// partenza fra quelli che hanno esercizi; durante la serie la testata dice livello, punteggio e risolti di
// fila, e sotto l'esercizio "Com'è andata?" chiede l'esito: ExerciseRunner non lo comunica fuori, e per gli
// esercizi concettuali lo sa solo chi li ha fatti. Il cambio di livello si annuncia con lo spillo.
import { useEffect, useMemo, useRef, useState } from 'react'
import { BTN_PRIMARY, BTN_SECONDARY, Icon } from '../../components/content/shared'
import { ExerciseRunner } from '../../components/practice/ExerciseRunner'
import { Stat, Track } from '../../components/practice/parts'
import { createRng } from '../../lib/rng'
import { Segmented } from '../../widgets/kit/Segmented'
import { EndPanel, FromSheet, Hud, ReviewTitle } from './GameKit'
import { currentPick, levelsOf, newGym, nextSeries, recordGym, SERIES } from './logic/exerciseGym'
import type { GymState, Level } from './logic/exerciseGym'
import { count, newSeed } from './kit'
import type { GameProps } from './kit'
import { exercisesOf } from './pool'
import type { Tagged } from './pool'
import type { Exercise } from '../../content/types'

const LEVEL_NAME: Record<Level, string> = { 1: 'base', 2: 'medio', 3: 'avanzato' }

function Start({ pool, onStart }: { pool: Tagged<Exercise>[]; onStart: (level: Level) => void }) {
  const levels = levelsOf(pool)
  const [level, setLevel] = useState<Level>(levels[0] ?? 1)
  return (
    <section aria-labelledby="palestra-via" className="border-2 border-border-strong bg-surface">
      <div className="grid gap-4 p-5 @3xl:p-6">
        <h2 id="palestra-via" className="m-0 font-label text-[length:var(--step-3)] leading-tight font-bold">
          Una serie di {SERIES} esercizi
        </h2>
        <p className="m-0 max-w-[var(--measure)]">
          Ogni esercizio ha numeri nuovi a ogni variante. Tre risolti di fila ti portano al livello dopo, due non risolti di fila a quello prima.
        </p>
        <div className="max-w-[32rem]">
          <Segmented<`${Level}`>
            id="palestra-livello"
            label="Livello di partenza"
            options={levels.map((l) => ({ value: `${l}` as `${Level}`, label: `${l} · ${LEVEL_NAME[l]}` }))}
            value={`${level}`}
            onChange={(v) => setLevel(Number(v) as Level)}
          />
        </div>
        <p className="num m-0 text-[length:var(--step--1)] text-muted">
          {levels.map((l) => `livello ${l}: ${count(pool.filter((e) => e.item.difficulty === l).length, 'esercizio', 'esercizi')}`).join(' · ')}
        </p>
      </div>
      <div className="border-t border-border-strong px-5 py-4 @3xl:px-6">
        <button type="button" className={BTN_PRIMARY} onClick={() => onStart(level)}>
          Comincia la serie
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </section>
  )
}

function Session({ pool, start, seed, scope }: { pool: Tagged<Exercise>[]; start: Level; seed: number; scope: GameProps['scope'] }) {
  const [state, setState] = useState<GymState>(() => newGym(pool, createRng(seed), start))
  // un generatore solo per le scelte successive: si legge negli eventi, mai durante il render
  const rng = useRef(createRng((seed * 31 + 7) >>> 0))
  const heading = useRef<HTMLHeadingElement>(null)
  const pick = currentPick(state)
  const done = state.results.length

  // la serie parte da "Comincia la serie", che sparisce: il fuoco va sul titolo del primo esercizio
  useEffect(() => {
    heading.current?.focus()
  }, [])

  function record(solved: boolean) {
    setState(recordGym(state, solved, pool, rng.current))
    requestAnimationFrame(() => heading.current?.focus())
  }

  if (!pick) {
    const solved = state.results.filter((r) => r.solved).length
    return (
      <EndPanel
        title="Serie finita"
        stamp={`${solved} su ${state.results.length}`}
        tone={solved === state.results.length ? 'pin' : 'ink'}
        scope={scope}
        againLabel="Un'altra serie"
        onAgain={() => {
          setState(nextSeries(state, pool, rng.current))
          requestAnimationFrame(() => heading.current?.focus())
        }}
        stats={
          <>
            <Stat label="Punteggio" value={state.score} pinned />
            <Stat label="Risolti" value={`${solved} di ${state.results.length}`} />
            <Stat label="Livello raggiunto" value={`${state.level} · ${LEVEL_NAME[state.level]}`} />
          </>
        }
      >
        <ReviewTitle>Gli esercizi della serie</ReviewTitle>
        <ol className="m-0 grid list-none gap-0 p-0">
          {state.results.map((r, i) => (
            <li key={i} className="m-0 -mt-px grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border border-border px-4 py-3">
              <Icon name={r.solved ? 'check' : 'cross'} className={r.solved ? 'text-ok' : 'text-error'} />
              <span className="grid gap-0.5">
                <span className="font-bold">
                  {r.pick.exercise.title}
                  <span className="visually-hidden">{r.solved ? ', risolto' : ', non risolto'}</span>
                </span>
                <span className="text-[length:var(--step--1)] text-muted">
                  Livello {r.pick.level} · variante <span className="num">{r.pick.seed}</span> · <FromSheet moduleId={r.pick.moduleId} tab="esercizi" />
                </span>
              </span>
              <span className="num text-muted">{r.points}</span>
            </li>
          ))}
        </ol>
      </EndPanel>
    )
  }

  return (
    <div className="grid gap-4">
      <Hud>
        <Stat label="Livello" value={`${state.level} · ${LEVEL_NAME[state.level]}`} pinned={state.event === 'su'} />
        <Stat label="Punteggio" value={state.score} />
        <Stat label="Risolti di fila" value={state.run} />
        <span className="self-center">
          <Track total={SERIES} done={done} current={done} />
        </span>
      </Hud>
      <p role="status" className="m-0 min-h-[1.6em]">
        {state.event === 'su' && (
          <span className="inline-flex items-center gap-2 bg-pin px-2 py-0.5 font-semibold text-pin-contrast">
            <Icon name="next" size={16} className="rotate-180" />
            Livello {state.level}: tre risolti di fila, si sale.
          </span>
        )}
        {state.event === 'giu' && (
          <span className="inline-flex items-center gap-2 font-semibold">
            <Icon name="next" size={16} />
            Livello {state.level}: due non risolti di fila, si torna un passo indietro.
          </span>
        )}
      </p>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 ref={heading} tabIndex={-1} className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold">
          Esercizio {done + 1} di {SERIES}
        </h2>
        <FromSheet moduleId={pick.moduleId} tab="esercizi" />
      </div>
      {/* la cornice dell'esercizio porta il margine dei blocchi del foglio: qui il ritmo lo dà la griglia */}
      <div className="[&>section]:my-0">
        <ExerciseRunner key={`${done}-${pick.moduleId}-${pick.exercise.id}-${pick.seed}`} exercise={pick.exercise} seed={pick.seed} />
      </div>
      <section aria-labelledby="palestra-esito" className="grid gap-3 border-2 border-border-strong bg-surface p-4 @3xl:px-6">
        <h3 id="palestra-esito" className="label m-0 text-text">
          Com'è andata?
        </h3>
        <p className="m-0 text-[length:var(--step--1)] text-muted">Controlla le risposte o apri la soluzione, poi segna l'esito: decide il livello del prossimo esercizio.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={BTN_PRIMARY} onClick={() => record(true)}>
            <Icon name="check" size={18} />
            Risolto
          </button>
          <button type="button" className={BTN_SECONDARY} onClick={() => record(false)}>
            <Icon name="cross" size={18} />
            Non risolto
          </button>
        </div>
      </section>
    </div>
  )
}

export default function ExerciseGym({ modules, scope, seed: firstSeed }: GameProps) {
  const pool = useMemo(() => exercisesOf(modules), [modules])
  const [seed] = useState(() => firstSeed ?? newSeed())
  const [start, setStart] = useState<Level | null>(null)
  if (start === null) return <Start pool={pool} onStart={setStart} />
  return <Session pool={pool} start={start} seed={seed} scope={scope} />
}
