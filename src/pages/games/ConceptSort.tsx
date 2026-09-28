// Smista i concetti: la carta in mano (nome di una formula, termine del glossario, titolo di una
// dimostrazione) va nel contenitore giusto: il docente, oppure il foglio dentro una regione. I contenitori
// sono tasselli della legenda con il campo della loro regione e un numero: si sceglie trascinando la carta
// sopra (drag di motion, il contenitore sotto il puntatore prende lo spillo), premendo il numero o con un
// clic. Lo sbaglio lascia la carta in mano e lo dice; la carta giusta finisce nel contenitore, che mostra
// le ultime arrivate. Con meno movimento (sistema o Impostazioni) la carta non torna indietro scivolando:
// ricompare al suo posto.
import { MotionConfig, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Icon } from '../../components/content/shared'
import { Stat, Ticks, Track } from '../../components/practice/parts'
import { createRng } from '../../lib/rng'
import { motionConfigOf, useReduceMotion } from '../../lib/useReduceMotion'
import { REGIONS } from '../../lib/atlas'
import { currentCard, newSort, place, sortOver } from './logic/conceptSort'
import type { CardKind, SortState } from './logic/conceptSort'
import { EndPanel, Hud, ReviewTitle } from './GameKit'
import { newSeed, useFocusOnMount, useHotkeys } from './kit'
import type { GameProps } from './kit'

const KIND_LABEL: Record<CardKind, string> = { formula: 'Formula', termine: 'Termine', dimostrazione: 'Dimostrazione' }

/** Il contenitore sotto un punto dello schermo (coordinate del client), se c'è. */
function binAt(x: number, y: number): string | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const bin = (el as HTMLElement).closest?.('[data-bin]')
    if (bin) return bin.getAttribute('data-bin')
  }
  return null
}

function clientPoint(e: MouseEvent | TouchEvent | PointerEvent, fallback: { x: number; y: number }) {
  if ('clientX' in e) return { x: e.clientX, y: e.clientY }
  const t = e.changedTouches?.[0]
  return t ? { x: t.clientX, y: t.clientY } : { x: fallback.x - window.scrollX, y: fallback.y - window.scrollY }
}

function Table({ state: initial, onAgain, scope, focusStart }: { state: SortState; onAgain: () => void; scope: GameProps['scope']; focusStart: boolean }) {
  const [state, setState] = useState(initial)
  const [over, setOver] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const title = useFocusOnMount<HTMLHeadingElement>(focusStart)
  const reduced = useReduceMotion()
  const card = currentCard(state)
  const total = state.cards.length
  const binName = (id: string) => state.bins.find((b) => b.id === id)?.label ?? id

  // funzionale: due tasti di fila smistano due carte, non due volte la stessa
  const drop = (bin: string) => setState((s) => place(s, bin))

  useHotkeys((key) => {
    const n = Number(key)
    if (!Number.isInteger(n) || n < 1 || n > state.bins.length) return false
    drop(state.bins[n - 1].id)
    return true
  }, !sortOver(state))

  if (!card) {
    const first = state.placed.filter((p) => p.misses === 0).length
    return (
      <EndPanel
        title="Tutto smistato"
        stamp={state.mistakes === 0 ? 'Senza errori' : `${state.score} punti`}
        tone={state.mistakes === 0 ? 'pin' : 'ink'}
        scope={scope}
        onAgain={onAgain}
        stats={
          <>
            <Stat label="Punteggio" value={state.score} pinned />
            <Stat label="Al primo colpo" value={`${first} di ${total}`} />
            <Stat label="Errori" value={state.mistakes} />
          </>
        }
      >
        <ReviewTitle>Dove stava ogni carta</ReviewTitle>
        <div className="grid gap-3 @3xl:grid-cols-2">
          {state.bins.map((b) => (
            <section key={b.id} aria-label={b.label} className="border border-border-strong">
              <h4 className={`${REGIONS[b.course].field} m-0 px-3 py-1.5 font-label text-[length:var(--step-0)] font-bold`}>
                {b.label} <span className="font-normal">· {b.detail}</span>
              </h4>
              <ul className="m-0 grid list-none gap-0 p-0">
                {state.placed
                  .filter((p) => p.card.bin === b.id)
                  .map((p) => (
                    <li key={p.card.id} className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-2 border-t border-border px-3 py-2 first:border-t-0">
                      <Icon name={p.misses === 0 ? 'check' : 'reset'} size={16} className={`mt-1 ${p.misses === 0 ? 'text-ok' : 'text-warn'}`} />
                      <span>
                        {p.card.text}
                        <span className="text-[length:var(--step--1)] text-muted"> · {KIND_LABEL[p.card.kind].toLowerCase()}</span>
                        {p.misses > 0 && <span className="text-[length:var(--step--1)] text-muted"> · {p.misses === 1 ? 'al secondo tentativo' : `dopo ${p.misses} errori`}</span>}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </EndPanel>
    )
  }

  const last = state.last
  const lastCard = last ? state.cards.find((c) => c.id === last.cardId) : undefined
  return (
    <div className="grid gap-4">
      <Hud>
        <Stat label="Carta" value={`${state.index + 1} di ${total}`} />
        <Stat label="Punteggio" value={state.score} />
        <Stat label="Errori" value={state.mistakes} />
        <span className="self-center">
          <Track total={total} done={state.index} current={state.index} />
        </span>
      </Hud>

      <h2 ref={title} tabIndex={-1} className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold">
        {state.mode === 'docente' ? 'Di quale docente è?' : 'Di quale foglio è?'}
      </h2>

      <MotionConfig reducedMotion={motionConfigOf(reduced)}>
        <div className="grid justify-items-center py-2">
          <motion.div
            key={card.id}
            drag
            dragSnapToOrigin
            dragElastic={0.6}
            whileDrag={{ scale: 1.03 }}
            onDragStart={() => setDragging(true)}
            onDrag={(e, info) => {
              const p = clientPoint(e, info.point)
              const bin = binAt(p.x, p.y)
              if (bin !== over) setOver(bin)
            }}
            onDragEnd={(e, info) => {
              const p = clientPoint(e, info.point)
              const bin = binAt(p.x, p.y)
              setOver(null)
              setDragging(false)
              if (bin) drop(bin)
            }}
            className={`relative z-10 grid w-full max-w-[28rem] cursor-grab touch-none gap-1.5 border-2 border-border-strong bg-surface px-5 pt-5 pb-4 active:cursor-grabbing ${dragging ? 'shadow-2' : ''}`}
          >
            <Ticks />
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-pin" />
            <p className="label m-0">{KIND_LABEL[card.kind]}</p>
            <p className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold">
              {card.text}
            </p>
            {card.en && (
              <p lang="en" className="m-0 text-muted italic">
                {card.en}
              </p>
            )}
          </motion.div>
          <p className="m-0 mt-3 text-center text-[length:var(--step--1)] text-muted">Trascina la carta su un contenitore, oppure premi il suo numero.</p>
          {/* la carta è un elemento nuovo a ogni giro: l'annuncio sta in una regione che resta */}
          <p aria-live="polite" className="visually-hidden">
            Carta in mano: {KIND_LABEL[card.kind].toLowerCase()} «{card.text}».
          </p>
        </div>
      </MotionConfig>

      <ul role="list" aria-label="Contenitori" className={`m-0 grid list-none gap-3 p-0 ${state.bins.length > 2 ? '@2xl:grid-cols-2' : ''} ${state.bins.length === 2 ? '@xl:grid-cols-2' : ''} ${state.bins.length === 3 ? '@4xl:grid-cols-3' : ''}`}>
        {state.bins.map((b, i) => {
          const region = REGIONS[b.course]
          const inside = state.placed.filter((p) => p.card.bin === b.id)
          const wrong = last && !last.correct && last.bin === b.id && last.cardId === card.id
          return (
            <li key={b.id} className="m-0">
              <button
                type="button"
                data-bin={b.id}
                onClick={() => drop(b.id)}
                className={`grid h-full w-full cursor-pointer grid-rows-[auto_1fr] border-2 border-border-strong text-left transition-[background-color,scale] duration-[var(--dur-fast)] ease-out active:scale-[0.99] ${
                  over === b.id ? 'bg-pin text-pin-contrast' : wrong ? 'bg-error-bg' : 'bg-surface hover:bg-surface-2'
                }`}
              >
                <span className={`${region.field} flex items-center gap-3 px-3 py-2`}>
                  <span aria-hidden="true" className="num grid size-8 place-items-center border-2 border-current font-bold">
                    {i + 1}
                  </span>
                  <span className="font-display text-[length:var(--step-2)] leading-none font-extrabold uppercase">{b.label}</span>
                </span>
                <span className="grid content-start gap-2 px-3 py-3">
                  <span className="text-[length:var(--step--1)] leading-snug">{b.detail}</span>
                  <span className="label">{inside.length === 1 ? '1 carta' : `${inside.length} carte`}</span>
                  {inside.length > 0 && (
                    <span aria-hidden="true" className="grid gap-1">
                      {inside.slice(-3).map((p) => (
                        <span key={p.card.id} className="truncate border-t border-border pt-1 text-[length:var(--step--1)] text-muted">
                          {p.card.text}
                        </span>
                      ))}
                    </span>
                  )}
                  {wrong && (
                    <span className="label flex items-center gap-1.5 text-error">
                      <Icon name="cross" size={16} />
                      Non qui
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p role="status" className="m-0 min-h-[1.6em]">
        {last && lastCard && (
          <span className="flex items-center gap-2 font-semibold">
            <Icon name={last.correct ? 'check' : 'cross'} size={18} className={last.correct ? 'text-ok' : 'text-error'} />
            {last.correct
              ? `Giusto: «${lastCard.text}» sta in ${binName(last.bin)}.`
              : `No: «${lastCard.text}» non sta in ${binName(last.bin)}. Riprova.`}
          </span>
        )}
      </p>
    </div>
  )
}

export default function ConceptSort({ modules, scope, seed: firstSeed }: GameProps) {
  const [seed, setSeed] = useState(() => firstSeed ?? newSeed())
  const [again, setAgain] = useState(false)
  const state = useMemo(() => newSort(modules, scope, createRng(seed)), [modules, scope, seed])
  if (!state) return null
  return (
    <Table
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
