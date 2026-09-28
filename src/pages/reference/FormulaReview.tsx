// Ripasso del formulario: una formula alla volta, coperta. Restano in vista il nome (italiano e inglese), il
// foglio e "quando si usa": quello che all'orale hai in mano prima di scriverla. Spazio la scopre, un secondo
// Spazio passa alla successiva; ← e → scorrono; Esc torna all'elenco. I tasti non hanno animazioni (si premono
// decine di volte di fila) e non scattano mentre il fuoco è in un campo o in una finestra di dialogo; con il
// fuoco su un pulsante Spazio preme quel pulsante e basta.
import { useEffect, useId, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router'
import { M } from '../../components/content/M'
import { targetId } from '../../components/content/ModuleContext'
import { Rich } from '../../components/content/Rich'
import { BTN_PRIMARY, BTN_SECONDARY, BTN_TOGGLE, FLOW, HATCH, Icon } from '../../components/content/shared'
import { SourceRef } from '../../components/content/SourceRef'
import { RegionSwatch } from '../../components/layout/marks'
import { Kbd, Ticks, Track } from '../../components/practice/parts'
import type { FormulaEntry } from '../../lib/formulario'
import { createRng } from '../../lib/rng'
import { ImportanceMark } from './parts'
import { IMPORTANCE_INFO, SHEET_LINK } from './ui'

interface FormulaReviewProps {
  /** le formule da ripassare, nell'ordine dell'elenco filtrato */
  entries: readonly FormulaEntry[]
  onExit: () => void
}

/** Dove Spazio non deve fare altro che il suo lavoro nativo, e dove nessun tasto del ripasso deve scattare. */
const OWN_SPACE = 'button, a[href], summary, [role="button"], [role="checkbox"], [role="switch"]'
const TYPING = 'input, textarea, select, [contenteditable="true"], dialog'

export function FormulaReview({ entries, onExit }: FormulaReviewProps) {
  const [order, setOrder] = useState<readonly FormulaEntry[]>(entries)
  const [shuffled, setShuffled] = useState(false)
  const [pos, setPos] = useState(0)
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set())
  const region = useRef<HTMLElement>(null)
  const restart = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  const total = order.length
  const done = pos >= total
  const current = done ? null : order[pos]
  const isRevealed = current !== null && revealed.has(current.key)

  const focusRegion = () => region.current?.focus({ preventScroll: true })
  const reveal = () => {
    if (!current) return
    setRevealed((set) => new Set(set).add(current.key))
  }
  const next = () => setPos((p) => Math.min(p + 1, total))
  const prev = () => setPos((p) => Math.max(p - 1, 0))
  const again = () => {
    setPos(0)
    setRevealed(new Set())
    focusRegion()
  }

  // entrando nel ripasso il fuoco va sulla tessera: i tasti funzionano subito
  useEffect(() => {
    region.current?.focus({ preventScroll: true })
    region.current?.scrollIntoView?.({ block: 'nearest' })
  }, [])

  // a fine giro il fuoco va su "Ricomincia il giro", il comando che resta
  useEffect(() => {
    if (done) restart.current?.focus()
  }, [done])

  // un solo ascoltatore sul documento, che legge sempre lo stato dell'ultimo render
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    onKey.current = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest(TYPING)) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onExit()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === ' ' && !target?.closest(OWN_SPACE)) {
        e.preventDefault()
        // un tasto tenuto premuto non scorre tutto il giro
        if (e.repeat || done) return
        if (isRevealed) next()
        else reveal()
      }
    }
  })
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey.current(e)
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [])

  // col mouse il fuoco torna alla tessera, così Spazio scopre invece di ripremere il pulsante;
  // da tastiera (detail 0) resta sul pulsante
  const byMouse = (action: () => void) => (e: MouseEvent) => {
    action()
    if (e.detail > 0) focusRegion()
  }

  const toggleShuffle = () => {
    const on = !shuffled
    setShuffled(on)
    setOrder(on ? createRng(Date.now()).shuffle(entries) : entries)
    setPos(0)
    setRevealed(new Set())
  }

  return (
    <section ref={region} tabIndex={-1} aria-label="Ripasso delle formule" className="@container mt-8 scroll-mt-20 outline-offset-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="label m-0 text-text" aria-live="polite">
          {done ? 'Giro finito' : `Formula ${pos + 1} di ${total}`}
        </p>
        <Track total={total} done={Math.min(pos, total)} current={done ? -1 : pos} />
        <p className="num m-0 text-[length:var(--step--1)] text-muted">
          Scoperte {revealed.size} di {total}
        </p>
        <div className="flex flex-wrap gap-2 @2xl:ml-auto">
          <button type="button" aria-pressed={shuffled} onClick={toggleShuffle} className={BTN_TOGGLE}>
            Mescola
          </button>
          <button type="button" onClick={onExit} className={BTN_SECONDARY}>
            <Icon name="arrow" size={18} className="rotate-180" />
            Torna all'elenco
          </button>
        </div>
      </div>
      {/* le scorciatoie servono a chi ha una tastiera: sui telefoni la riga non si mostra */}
      <p className="m-0 mt-3 hidden flex-wrap items-center gap-x-2 gap-y-1 text-[length:var(--step--1)] text-muted pointer-fine:flex">
        <Kbd>Spazio</Kbd> scopre la formula, poi passa alla successiva <span aria-hidden="true">·</span> <Kbd>←</Kbd> <Kbd>→</Kbd> scorrono{' '}
        <span aria-hidden="true">·</span> <Kbd>Esc</Kbd> torna all'elenco
      </p>

      {current === null ? (
        <div className="relative mt-5 grid justify-items-start gap-4 border-2 border-border-strong bg-surface p-5 @md:p-8">
          <Ticks />
          <p className="m-0 max-w-[var(--measure)] font-label text-[length:var(--step-2)] leading-tight font-bold">{lapSummary(total, revealed.size)}</p>
          <p className="m-0 max-w-[var(--measure)] text-muted">Rifai il giro coperto per fissarle, oppure torna all'elenco e cambia i filtri.</p>
          <button ref={restart} type="button" onClick={again} className={BTN_PRIMARY}>
            <Icon name="reset" size={18} />
            Ricomincia il giro
          </button>
        </div>
      ) : (
        <article aria-labelledby={titleId} className="relative mt-5 border-2 border-border-strong bg-surface">
          <Ticks />
          <header className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border-strong px-4 py-2">
            <p className="label m-0 flex items-baseline gap-2 text-text">
              <span className="relative top-0.5">
                <RegionSwatch course={current.course} />
              </span>
              <span>
                <span className="num">Foglio {current.number}</span> · {current.title}
              </span>
            </p>
            <p className="label m-0 ml-auto flex items-center gap-2" title={IMPORTANCE_INFO[current.formula.importance].long}>
              <ImportanceMark value={current.formula.importance} />
              {IMPORTANCE_INFO[current.formula.importance].short}
            </p>
          </header>

          <div className="p-5 @md:p-8">
            <h2 id={titleId} className="m-0 font-label text-[length:var(--step-3)] leading-tight font-bold">
              {current.formula.name}
            </h2>
            <p lang="en" className="m-0 mt-1 text-[length:var(--step-1)] text-muted italic">
              {current.formula.nameEn}
            </p>

            {current.formula.whenToUse && (
              <div className="mt-5 max-w-[var(--measure)]">
                <p className="label m-0 flex items-center gap-2">
                  <Icon name="arrow" size={16} />
                  Quando si usa
                </p>
                <Rich text={current.formula.whenToUse} className={`${FLOW} mt-2`} />
              </div>
            )}

            {isRevealed ? (
              <Revealed entry={current} />
            ) : (
              <div className={`mt-6 grid justify-items-start gap-3 border border-border p-5 ${HATCH}`}>
                <p className="m-0 bg-surface px-1">Scrivila su carta, poi scoprila.</p>
                <button
                  type="button"
                  className={BTN_PRIMARY}
                  onClick={() => {
                    reveal()
                    focusRegion()
                  }}
                >
                  <Icon name="eye" size={18} />
                  Scopri la formula
                </button>
              </div>
            )}
          </div>

          <footer className="flex flex-wrap items-center gap-3 border-t border-border-strong px-4 py-3">
            <button
              type="button"
              aria-disabled={pos === 0 || undefined}
              onClick={byMouse(prev)}
              className={`${BTN_SECONDARY} aria-disabled:cursor-not-allowed aria-disabled:opacity-40`}
            >
              <Icon name="arrow" size={18} className="rotate-180" />
              Precedente
            </button>
            <button type="button" onClick={byMouse(next)} className={isRevealed ? BTN_PRIMARY : BTN_SECONDARY}>
              Successiva
              <Icon name="arrow" size={18} />
            </button>
          </footer>
        </article>
      )}
    </section>
  )
}

/** Il bilancio del giro, al singolare quando la formula è una sola. */
function lapSummary(total: number, uncovered: number): string {
  if (total === 1) return uncovered > 0 ? "Hai visto la formula e l'hai scoperta." : 'Hai visto la formula senza scoprirla.'
  return `Hai visto tutte le ${total} formule; ne hai scoperte ${uncovered}.`
}

/** La formula scoperta: display, spiegazione, legenda dei simboli, trappole, fonte e rimando al foglio. */
function Revealed({ entry }: { entry: FormulaEntry }) {
  const { formula } = entry
  return (
    <div className="mt-6 border-t border-border-strong pt-2">
      <div className="overflow-x-auto text-[length:var(--step-1)]">
        <M tex={formula.latex} display />
      </div>
      {formula.explain && <Rich text={formula.explain} className={`${FLOW} max-w-[var(--measure)] text-muted`} />}

      {formula.symbols.length > 0 && (
        <div className="mt-5">
          <p className="label m-0">Legenda dei simboli</p>
          <dl className="m-0 mt-3 grid gap-x-6 gap-y-2 @xl:grid-cols-2">
            {formula.symbols.map((sym) => (
              <div key={sym.s} className="flex items-start gap-3">
                <dt className="grid min-h-9 min-w-12 shrink-0 place-items-center border border-border-strong bg-surface-2 px-2">
                  <M tex={sym.s} />
                </dt>
                <dd className="m-0 min-w-0 pt-1">
                  <Rich text={sym.meaning} inline />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {formula.pitfalls && (
        <div className="mt-5 max-w-[var(--measure)] border border-border bg-warn-bg p-4">
          <p className="label m-0 flex items-center gap-2 text-warn">
            <Icon name="warning" size={16} />
            Trappole
          </p>
          <Rich text={formula.pitfalls} className={`${FLOW} mt-2`} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="label">Fonte</span>
        {formula.source.map((s) => (
          <SourceRef key={`${s.doc}-${s.page}`} doc={s.doc} page={s.page} block />
        ))}
        <Link to={`/m/${entry.moduleId}/formule#${targetId('formula', formula.id)}`} className={`${SHEET_LINK} sm:ml-auto`}>
          Nel foglio {entry.number}
          <span className="visually-hidden">: {formula.name}</span>
          <Icon name="arrow" size={16} />
        </Link>
      </div>
    </div>
  )
}
