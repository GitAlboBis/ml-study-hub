// Formula Match: memory fra il nome di una formula e la sua scrittura. Le tessere coperte sono terreno non
// ancora rilevato (tratteggio); si girano con un flip 3D breve (solo transform, --dur-base) e con reduced
// motion le facce si scambiano in dissolvenza. Una tessera scoperta porta lo spillo; due sbagliate restano
// scoperte poco più di un secondo (o finché ne giri un'altra), una coppia trovata prende il cartellino
// con il suo numero. Tempo (dal primo giro) e mosse fanno il punteggio.
//
// Tastiera: le tessere sono pulsanti; frecce, Home e Fine muovono il fuoco nella griglia, Invio o Spazio
// girano. Lo stato di ogni tessera è nel nome accessibile; l'esito di ogni mossa in una riga aria-live.
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { M } from '../../components/content/M'
import { BTN_SECONDARY, HATCH, Icon } from '../../components/content/shared'
import { formatClock } from '../../components/practice/logic'
import { Stat } from '../../components/practice/parts'
import { useStopwatch } from '../../components/practice/useStopwatch'
import { createRng } from '../../lib/rng'
import { useReduceMotion } from '../../lib/useReduceMotion'
import { EndPanel, FitMath, FromSheet, Hud, ReviewTitle } from './GameKit'
import { closeMiss, flip, isFaceUp, isWon, matchScore, newMatch, pairNumber } from './logic/formulaMatch'
import type { MatchState } from './logic/formulaMatch'
import { newSeed } from './kit'
import type { GameProps } from './kit'
import { formulasOf } from './pool'

/** Quanto restano scoperte due tessere sbagliate: il tempo di leggerle. */
const MISS_MS = 1100

interface Final {
  score: number
  seconds: number
}

function Board({ state: initial, onAgain, scope, focusStart }: { state: MatchState; onAgain: () => void; scope: GameProps['scope']; focusStart: boolean }) {
  const [state, setState] = useState(initial)
  const [notice, setNotice] = useState('')
  const [final, setFinal] = useState<Final | null>(null)
  // tessere già viste: la faccia resta nel DOM, così richiudendosi non si svuota a metà giro
  const [seen, setSeen] = useState<number[]>([])
  const watch = useStopwatch()
  const reduced = useReduceMotion()
  const grid = useRef<HTMLOListElement>(null)
  const uid = useId()
  const pairs = state.pairs.length

  // dopo "Gioca ancora" o "Rimescola" il pulsante premuto non c'è più: il fuoco va sulla prima tessera
  const focusFirst = useRef(focusStart)
  useEffect(() => {
    if (focusFirst.current) grid.current?.querySelector<HTMLButtonElement>('button[data-tile]')?.focus()
  }, [])

  // due tessere sbagliate si richiudono da sole; girarne un'altra prima le richiude subito (flip)
  useEffect(() => {
    if (state.open.length !== 2) return
    const t = setTimeout(() => setState(closeMiss), MISS_MS)
    return () => clearTimeout(t)
  }, [state.open])

  const nameOf = (i: number) => {
    const card = state.cards[i]
    return card.face === 'name' ? `«${state.pairs[card.pair].formula.name}»` : 'una formula'
  }

  function turn(i: number) {
    if (final) return
    if (!watch.running && state.moves === 0 && state.open.length === 0 && state.matched.length === 0) watch.start()
    const { state: next, result } = flip(state, i)
    if (result === 'ignored') return
    setState(next)
    setSeen((xs) => (xs.includes(i) ? xs : [...xs, i]))
    if (result === 'opened') setNotice(`Scoperta ${nameOf(i)}.`)
    if (result === 'miss') setNotice(`Scoperta ${nameOf(i)}: non fa coppia con l'altra tessera.`)
    if (result === 'match') {
      const name = state.pairs[state.cards[i].pair].formula.name
      if (isWon(next)) {
        watch.pause()
        const seconds = watch.read()
        setFinal({ score: matchScore(pairs, next.moves, seconds), seconds })
        setNotice('Tutte le coppie trovate.')
      } else setNotice(`Coppia trovata: «${name}». Ne mancano ${pairs - next.matched.length}.`)
    }
  }

  /** Frecce nella griglia: le colonne si contano dalle tessere sulla prima riga. */
  function onGridKey(e: KeyboardEvent<HTMLOListElement>) {
    const tiles = Array.from(grid.current?.querySelectorAll<HTMLButtonElement>('button[data-tile]') ?? [])
    const at = tiles.indexOf(document.activeElement as HTMLButtonElement)
    if (at === -1) return
    const top = tiles[0].offsetTop
    const cols = Math.max(1, tiles.filter((t) => t.offsetTop === top).length)
    const to =
      e.key === 'ArrowRight' ? at + 1 : e.key === 'ArrowLeft' ? at - 1 : e.key === 'ArrowDown' ? at + cols : e.key === 'ArrowUp' ? at - cols : e.key === 'Home' ? 0 : e.key === 'End' ? tiles.length - 1 : null
    if (to === null) return
    e.preventDefault()
    tiles[Math.min(tiles.length - 1, Math.max(0, to))].focus()
  }

  if (final) {
    const perfect = state.moves === pairs
    return (
      <EndPanel
        title="Tutte le coppie trovate"
        stamp={perfect ? 'Perfetto' : `${final.score} punti`}
        tone={perfect ? 'pin' : 'ink'}
        scope={scope}
        onAgain={onAgain}
        stats={
          <>
            <Stat label="Punteggio" value={final.score} pinned />
            <Stat label="Mosse" value={`${state.moves} (minimo ${pairs})`} />
            <Stat label="Tempo" value={formatClock(final.seconds)} />
          </>
        }
      >
        <ReviewTitle>Le formule della partita</ReviewTitle>
        <ol className="m-0 grid list-none gap-0 p-0">
          {state.matched.map((p, k) => {
            const { formula, moduleId } = state.pairs[p]
            return (
              <li key={p} className="m-0 -mt-px grid gap-2 border border-border px-4 py-3 @3xl:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)] @3xl:items-center">
                <span className="num text-muted">{String(k + 1).padStart(2, '0')}</span>
                <span className="grid gap-0.5">
                  <span className="font-label font-bold">{formula.name}</span>
                  <FromSheet moduleId={moduleId} tab="formule" />
                </span>
                <span className="overflow-x-auto">
                  <M tex={formula.latex} />
                </span>
              </li>
            )
          })}
        </ol>
      </EndPanel>
    )
  }

  return (
    <div className="grid gap-4">
      <Hud
        actions={
          <button type="button" className={BTN_SECONDARY} onClick={onAgain}>
            <Icon name="reset" size={18} />
            Rimescola
          </button>
        }
      >
        <Stat label="Coppie" value={`${state.matched.length} di ${pairs}`} />
        <Stat label="Mosse" value={state.moves} />
        <Stat label="Tempo" value={formatClock(watch.seconds)} />
      </Hud>
      <p role="status" className="m-0 min-h-[1.6em] text-muted">
        {notice || 'Gira una tessera per cominciare: il tempo parte dal primo giro.'}
      </p>
      <ol ref={grid} aria-label="Tessere" onKeyDown={onGridKey} className="m-0 grid list-none grid-cols-2 gap-2 p-0 @2xl:grid-cols-4 @2xl:gap-3">
        {state.cards.map((card, i) => {
          const up = isFaceUp(state, i)
          const drawn = up || seen.includes(i)
          const pairNo = pairNumber(state, i)
          const miss = state.open.length === 2 && state.open.includes(i)
          const { formula } = state.pairs[card.pair]
          const mathId = `${uid}-m${i}`
          const n = i + 1
          const label = !up
            ? `Tessera ${n}, coperta`
            : `Tessera ${n}: ${card.face === 'name' ? formula.name : 'formula'}${pairNo ? `, coppia ${pairNo} trovata` : miss ? ', non fa coppia' : ''}`
          const face = 'col-start-1 row-start-1 grid min-h-28 min-w-0 grid-cols-[minmax(0,1fr)] [backface-visibility:hidden] transition-[opacity] duration-[var(--dur-base)] ease-out'
          return (
            <li key={card.key} className="m-0 min-w-0">
              <button
                type="button"
                data-tile={i}
                aria-label={label}
                aria-describedby={up && card.face === 'formula' ? mathId : undefined}
                aria-disabled={pairNo !== null || undefined}
                onClick={() => turn(i)}
                className={`group block h-full w-full min-w-0 cursor-pointer text-left [perspective:900px] active:scale-[0.98] transition-[scale] duration-[var(--dur-fast)] ease-out aria-disabled:cursor-default aria-disabled:active:scale-100`}
              >
                <span
                  className={`grid h-full grid-cols-[minmax(0,1fr)] [transform-style:preserve-3d] transition-[transform] duration-[var(--dur-base)] ease-[var(--ease-out)] ${up && !reduced ? '[transform:rotateY(180deg)]' : ''}`}
                >
                  {/* dorso: terreno non rilevato */}
                  <span aria-hidden="true" className={`${face} relative border border-border-strong bg-surface group-hover:bg-surface-2 ${reduced && up ? 'opacity-0' : ''}`}>
                    <span className={`absolute inset-0 ${HATCH}`} />
                    <span className="num relative m-1.5 self-start justify-self-start bg-surface px-1 text-[length:var(--step--1)] text-muted">{String(n).padStart(2, '0')}</span>
                  </span>
                  {/* faccia: nome o formula */}
                  <span
                    className={`${face} relative content-between gap-2 p-3 ${reduced ? (up ? '' : 'opacity-0') : '[transform:rotateY(180deg)]'} ${
                      pairNo ? 'border border-border bg-surface-2' : miss ? 'border-2 border-border-strong bg-error-bg' : 'border-2 border-border-strong bg-surface'
                    }`}
                  >
                    {up && !pairNo && !miss && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-pin" />}
                    {!drawn ? null : card.face === 'name' ? (
                      <span className="grid gap-1 pt-1">
                        <span className="font-label text-[length:var(--step-0)] leading-snug font-bold">{formula.name}</span>
                        <span lang="en" className="text-[length:var(--step--1)] leading-snug text-muted italic">
                          {formula.nameEn}
                        </span>
                      </span>
                    ) : (
                      <span className="block pt-1 text-[0.95em]">
                        <FitMath id={mathId} tex={formula.latex} />
                      </span>
                    )}
                    {pairNo !== null && (
                      <span className="label flex items-center gap-1.5 text-ok">
                        <Icon name="check" size={16} />
                        Coppia {pairNo}
                      </span>
                    )}
                    {miss && (
                      <span className="label flex items-center gap-1.5 text-error">
                        <Icon name="cross" size={16} />
                        Non fa coppia
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default function FormulaMatch({ modules, scope, seed: firstSeed }: GameProps) {
  const pool = useMemo(() => formulasOf(modules), [modules])
  const [seed, setSeed] = useState(() => firstSeed ?? newSeed())
  const [again, setAgain] = useState(false)
  const state = useMemo(() => newMatch(pool, createRng(seed)), [pool, seed])
  return (
    <Board
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
