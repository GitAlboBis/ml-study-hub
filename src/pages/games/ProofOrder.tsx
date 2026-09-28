// Riordina la dimostrazione: i passaggi di una derivazione arrivano mescolati in una colonna di righe a
// inchiostro. Si spostano trascinando la maniglia (Reorder di motion con useDragControls: il resto della
// riga resta selezionabile e scorrevole), con i pulsanti su e giù, oppure da tastiera: fuoco sulla maniglia,
// frecce su e giù, Home e Fine. Il fuoco segue il passaggio spostato e la nuova posizione è annunciata.
// "Controlla l'ordine" segna ogni riga giusta o fuori posto (icona ed etichetta); "Un aiuto" sistema il
// primo passaggio sbagliato. A dimostrazione rimessa in fila si leggono i perché, passo per passo.
// Moto: le righe scivolano al loro posto (layout, 200 ms); con meno movimento (sistema o Impostazioni)
// MotionConfig lo toglie. A spostamento finito la riga a fuoco viene portata nello schermo.
import { MotionConfig, Reorder, useDragControls } from 'motion/react'
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { Rich } from '../../components/content/Rich'
import { BTN_PRIMARY, BTN_SECONDARY, Disclosure, FLOW, Icon } from '../../components/content/shared'
import { Stat } from '../../components/practice/parts'
import type { Derivation, DerivationStep } from '../../content/types'
import { createRng } from '../../lib/rng'
import { sheetNumber } from '../../lib/atlas'
import { motionConfigOf, useReduceMotion } from '../../lib/useReduceMotion'
import { EndPanel, FromSheet, Grip, Hud, ReviewTitle } from './GameKit'
import { newSeed, useFocusOnMount } from './kit'
import type { GameProps } from './kit'
import { derivationsOf } from './pool'
import type { Tagged } from './pool'
import { checkProof, firstWrong, hint, moveStep, newProof, proofScore, setOrder } from './logic/proofOrder'
import type { ProofState } from './logic/proofOrder'

const SELECT = 'min-h-11 w-full cursor-pointer border border-border-strong bg-surface px-2 font-label font-semibold text-text'

/** Durata dello scivolamento delle righe (layout di Reorder.Item), in ms. */
const SLIDE_MS = 200

const SMALL = 'grid size-10 cursor-pointer place-items-center border border-border text-text hover:border-border-strong hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-faint disabled:hover:border-border disabled:hover:bg-transparent'

interface RowProps {
  step: DerivationStep
  stepIndex: number
  pos: number
  total: number
  /** esito dell'ultimo controllo per questa posizione; undefined senza controllo */
  verdict: boolean | undefined
  /** radice degli id della riga: `${base}-m` formula, `-h` maniglia, `-u` su, `-d` giù */
  base: string
  onMove: (from: number, to: number, source: Source) => void
}

/** Da dove parte uno spostamento: il fuoco torna lì, sulla riga spostata. */
type Source = 'h' | 'u' | 'd'

function StepRow({ step, stepIndex, pos, total, verdict, base, onMove }: RowProps) {
  const controls = useDragControls()
  const [dragging, setDragging] = useState(false)
  const tone = verdict === true ? 'bg-ok-bg' : verdict === false ? 'bg-error-bg' : 'bg-surface'
  return (
    <Reorder.Item
      value={stepIndex}
      as="li"
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      transition={{ duration: SLIDE_MS / 1000, ease: [0.2, 0.8, 0.2, 1] }}
      className={`relative m-0 -mt-px grid grid-cols-[1.5rem_2.75rem_minmax(0,1fr)_2.5rem] items-center gap-x-2 gap-y-1 border border-border-strong px-2 py-2 @3xl:grid-cols-[2rem_2.75rem_minmax(0,1fr)_auto] @3xl:px-3 ${tone} ${dragging ? 'z-10 shadow-2' : ''}`}
    >
      <span className="num text-right text-[length:var(--step--1)] text-muted">{pos + 1}</span>
      <button
        id={`${base}-h`}
        type="button"
        aria-label={`Passaggio in posizione ${pos + 1} di ${total}: frecce su e giù per spostarlo`}
        aria-describedby={`${base}-m`}
        onPointerDown={(e) => {
          e.preventDefault()
          controls.start(e)
        }}
        onKeyDown={(e) => {
          const to = e.key === 'ArrowUp' ? pos - 1 : e.key === 'ArrowDown' ? pos + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? total - 1 : null
          if (to === null) return
          e.preventDefault()
          if (to >= 0 && to < total) onMove(pos, to, 'h')
        }}
        className="grid size-11 cursor-grab touch-none place-items-center border border-border-strong bg-surface text-text hover:bg-surface-2 active:cursor-grabbing"
      >
        <Grip />
      </button>
      <div id={`${base}-m`} className="min-w-0 overflow-x-auto py-1 text-[length:var(--step-0)]">
        <M tex={step.latex} />
      </div>
      <div className="row-span-2 grid gap-1 self-start @3xl:row-span-1 @3xl:flex @3xl:self-center">
        <button id={`${base}-u`} type="button" aria-label={`Sposta su il passaggio ${pos + 1}`} disabled={pos === 0} onClick={() => onMove(pos, pos - 1, 'u')} className={SMALL}>
          <Icon name="chevron" size={18} className="rotate-180" />
        </button>
        <button id={`${base}-d`} type="button" aria-label={`Sposta giù il passaggio ${pos + 1}`} disabled={pos === total - 1} onClick={() => onMove(pos, pos + 1, 'd')} className={SMALL}>
          <Icon name="chevron" size={18} />
        </button>
      </div>
      {verdict !== undefined && (
        <p className={`label col-start-3 m-0 flex items-center gap-1.5 ${verdict ? 'text-ok' : 'text-error'}`}>
          <Icon name={verdict ? 'check' : 'cross'} size={16} />
          {verdict ? 'Al posto giusto' : 'Fuori posto'}
        </p>
      )}
    </Reorder.Item>
  )
}

interface BoardProps {
  entry: Tagged<Derivation>
  initial: ProofState
  onAgain: () => void
  scope: GameProps['scope']
  focusStart: boolean
}

function Board({ entry, initial, onAgain, scope, focusStart }: BoardProps) {
  const [state, setState] = useState(initial)
  const title = useFocusOnMount<HTMLHeadingElement>(focusStart)
  // ogni annuncio ha il suo numero: due frasi uguali di fila sono due nodi diversi, e il lettore le dice tutte e due
  const [notice, setNoticeState] = useState({ text: '', n: 0 })
  const setNotice = (text: string) => setNoticeState((p) => ({ text, n: p.n + 1 }))
  const reduced = useReduceMotion()
  const uid = useId()
  const derivation = entry.item
  const n = state.steps.length
  const right = state.verdict?.filter(Boolean).length ?? null

  function move(from: number, to: number, source: Source = 'h') {
    const next = moveStep(state, from, to)
    if (next === state) return
    setState(next)
    setNotice(`Passaggio spostato in posizione ${to + 1} di ${n}.`)
    // React sposta il nodo della riga nel DOM e il browser gli toglie il fuoco: lo si rimette dov'era,
    // o sulla maniglia se il pulsante di partenza ora è spento (riga arrivata in cima o in fondo)
    const base = `${uid}-s${state.order[from]}`
    // Il fuoco non basta a far scorrere la pagina: durante lo scivolamento la riga è ancora disegnata al posto di
    // prima. La si porta nello schermo a scivolamento finito (subito, se il movimento è ridotto).
    requestAnimationFrame(() => {
      const el = document.getElementById(`${base}-${source}`) as HTMLButtonElement | null
      const target = el && !el.disabled ? el : document.getElementById(`${base}-h`)
      target?.focus({ preventScroll: true })
      const reveal = () => target?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' })
      if (reduced) reveal()
      else window.setTimeout(reveal, SLIDE_MS + 40)
    })
  }

  function check() {
    const next = checkProof(state)
    setState(next)
    const ok = next.verdict?.filter(Boolean).length ?? 0
    if (!next.solved) setNotice(`${ok} di ${n} passaggi al posto giusto. Sposta quelli segnati e controlla di nuovo.`)
  }

  function help() {
    const at = firstWrong(state)
    const next = hint(state)
    if (next === state) return
    setState(next)
    setNotice(`Aiuto: il passaggio ${at + 1} ora è quello giusto.`)
  }

  if (state.solved) {
    const score = proofScore(n, state.checks, state.hints)
    const clean = state.checks === 1 && state.hints === 0
    return (
      <EndPanel
        title="Dimostrazione in ordine"
        stamp={clean ? 'Al primo colpo' : `${score} punti`}
        tone={clean ? 'pin' : 'ink'}
        scope={scope}
        onAgain={onAgain}
        againLabel="Un'altra dimostrazione"
        stats={
          <>
            <Stat label="Punteggio" value={score} pinned />
            <Stat label="Passaggi" value={n} />
            <Stat label="Controlli" value={state.checks} />
            <Stat label="Aiuti" value={state.hints} />
          </>
        }
      >
        <ReviewTitle>I perché, passo per passo</ReviewTitle>
        <p className="m-0 font-label text-[length:var(--step-1)] font-bold">{derivation.title}</p>
        <ol className="m-0 grid list-none gap-0 p-0">
          {derivation.steps.map((step, i) => (
            <li key={i} className="m-0 -mt-px grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-2 border border-border px-3 py-3">
              <span className="num text-right text-muted">{i + 1}</span>
              <div className="min-w-0 overflow-x-auto">
                <M tex={step.latex} display />
              </div>
              {step.why && <Rich text={step.why} className={`prose col-start-2 text-[length:var(--step-0)] ${FLOW}`} />}
            </li>
          ))}
        </ol>
        {derivation.conclusion && (
          <div className="grid gap-1 border-2 border-border-strong p-4">
            <p className="label m-0 text-text">Conclusione</p>
            <Rich text={derivation.conclusion} className={`prose ${FLOW}`} />
          </div>
        )}
        <FromSheet moduleId={entry.moduleId} tab="teoria" />
      </EndPanel>
    )
  }

  return (
    <div className="grid gap-4">
      <Hud>
        <Stat label="Passaggi" value={n} />
        <Stat label="Controlli" value={state.checks} />
        <Stat label="Aiuti" value={state.hints} />
        {right !== null && <Stat label="Al posto giusto" value={`${right} di ${n}`} pinned />}
      </Hud>

      <section aria-labelledby={`${uid}-t`} className="border-2 border-border-strong bg-surface">
        <header className="grid gap-2 border-b border-border-strong px-4 py-3 @3xl:px-6">
          <p className="label m-0">Dimostrazione</p>
          <h2 id={`${uid}-t`} ref={title} tabIndex={-1} className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold">
            {derivation.title}
          </h2>
          <Rich text={derivation.goal} className={`prose max-w-[var(--measure)] ${FLOW}`} />
          <FromSheet moduleId={entry.moduleId} tab="teoria" />
        </header>
        {derivation.assumptions && (
          <Disclosure summary={<span className="label text-text">Ipotesi</span>} className="border-b border-border" panelClassName={`prose px-4 pb-4 @3xl:px-6 ${FLOW}`}>
            <Rich text={derivation.assumptions} className={FLOW} />
          </Disclosure>
        )}
        <p className="m-0 px-4 pt-4 text-[length:var(--step--1)] text-muted @3xl:px-6">
          Trascina un passaggio per la maniglia, oppure mettici il fuoco e usa le frecce su e giù (Home e Fine per portarlo in cima o in fondo).
        </p>
        <MotionConfig reducedMotion={motionConfigOf(reduced)}>
          <Reorder.Group
            as="ol"
            axis="y"
            values={state.order}
            onReorder={(order: number[]) => setState((s) => setOrder(s, order))}
            aria-label="Passaggi da ordinare"
            className="m-0 grid list-none p-4 pt-3 @3xl:px-6"
          >
            {state.order.map((stepIndex, pos) => (
              <StepRow
                key={stepIndex}
                step={state.steps[stepIndex]}
                stepIndex={stepIndex}
                pos={pos}
                total={n}
                verdict={state.verdict?.[pos]}
                base={`${uid}-s${stepIndex}`}
                onMove={move}
              />
            ))}
          </Reorder.Group>
        </MotionConfig>
        <p role="status" className="m-0 min-h-[1.6em] px-4 text-muted @3xl:px-6">
          <span key={notice.n}>{notice.text}</span>
        </p>
        <div className="flex flex-wrap items-center gap-3 border-t border-border-strong px-4 py-3 @3xl:px-6">
          <button type="button" className={BTN_PRIMARY} onClick={check}>
            <Icon name="check" size={18} />
            Controlla l'ordine
          </button>
          <button type="button" className={BTN_SECONDARY} onClick={help}>
            Un aiuto{' '}
            <span className="num text-[length:var(--step--1)]">−15</span>
          </button>
        </div>
      </section>
    </div>
  )
}

const keyOf = (d: Tagged<Derivation>) => `${d.moduleId}:${d.item.id}`

export default function ProofOrder({ modules, scope, seed: firstSeed }: GameProps) {
  const pool = useMemo(() => derivationsOf(modules), [modules])
  const [seed, setSeed] = useState(() => firstSeed ?? newSeed())
  const [choice, setChoice] = useState<string>('')
  // il fuoco va sul titolo solo dopo "Un'altra dimostrazione": cambiando scelta nel menu resta sul menu
  const [again, setAgain] = useState(false)
  const uid = useId()
  const entry = useMemo(() => (pool.length === 0 ? null : (pool.find((d) => keyOf(d) === choice) ?? createRng(seed).pick(pool))), [pool, choice, seed])
  const initial = useMemo(() => (entry ? newProof(entry.item, createRng(seed + 1)) : null), [entry, seed])
  if (!entry || !initial) return null

  return (
    <div className="grid gap-5">
      {pool.length > 1 && (
        <div className="grid max-w-[36rem] gap-1.5">
          <label htmlFor={`${uid}-d`} className="label">
            Dimostrazione
          </label>
          <select
            id={`${uid}-d`}
            className={SELECT}
            value={choice}
            onChange={(e) => {
              setAgain(false)
              setChoice(e.target.value)
            }}
          >
            <option value="">Una a caso</option>
            {pool.map((d) => (
              <option key={keyOf(d)} value={keyOf(d)}>
                {sheetNumber(d.moduleId)} · {d.item.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <Board
        key={`${keyOf(entry)}/${seed}`}
        entry={entry}
        initial={initial}
        scope={scope}
        focusStart={again}
        onAgain={() => {
          setAgain(true)
          setChoice('')
          setSeed((s) => (s + 2) >>> 0)
        }}
      />
    </div>
  )
}
