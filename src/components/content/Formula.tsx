// La targa di una formula: nome IT, nome EN in corsivo, formula in display, legenda dei simboli a tasselli,
// quando si usa, trappole, pagina della fonte nel margine. "Nascondi per ripasso" copre formula e legenda:
// restano il nome e l'uso, cioè quello che all'orale si ha in mano prima di scriverla.
import { useId, useRef, useState } from 'react'
import type { Formula as FormulaData } from '../../content/types'
import { useProgress } from '../../store/progress'
import { M } from './M'
import { targetId, useModule } from './ModuleContext'
import { Rich } from './Rich'
import { BTN_PRIMARY, BTN_TOGGLE, FLOW, Frame, HATCH, Icon, Missing, TITLE } from './shared'
import { SourceRef } from './SourceRef'

/** `<Formula id />` nell'MDX: prende la formula dai dati del modulo corrente. */
export function Formula({ id }: { id: string }) {
  const data = useModule()
  const formula = data.formulas.find((f) => f.id === id)
  if (!formula) return <Missing what="La formula" id={id} />
  return <FormulaCard formula={formula} moduleId={data.id} anchor={targetId('formula', id)} />
}

interface FormulaCardProps {
  formula: FormulaData
  moduleId: string
  /** id DOM della targa; si omette dove la stessa formula può comparire più volte (formulario) */
  anchor?: string
  /** parte coperta: la modalità ripasso del formulario */
  startHidden?: boolean
}

/** La targa senza il contesto del modulo: la usano anche la scheda Formule e il formulario globale. */
export function FormulaCard({ formula, moduleId, anchor, startHidden = false }: FormulaCardProps) {
  const [hidden, setHidden] = useState(startHidden)
  const titleId = useId()
  const hideToggle = useRef<HTMLButtonElement>(null)
  const bookmark = `formula:${moduleId}:${formula.id}`
  const pinned = useProgress((s) => s.bookmarks.includes(bookmark))
  const toggleBookmark = useProgress((s) => s.toggleBookmark)
  const both = Boolean(formula.whenToUse && formula.pitfalls)

  const actions = (
    <>
      {formula.importance === 3 && (
        <span className="label flex min-h-8 items-center gap-1.5 bg-pin px-2 text-pin-contrast">
          <Icon name="pin" size={14} />
          Da sapere a memoria
        </span>
      )}
      <button
        type="button"
        aria-pressed={pinned}
        aria-label="Appunta sull'indice"
        title={pinned ? "Togli dall'indice" : "Appunta sull'indice"}
        onClick={() => toggleBookmark(bookmark)}
        className={`${BTN_TOGGLE} min-w-11 px-0`}
      >
        <Icon name="pin" size={18} />
      </button>
      <button ref={hideToggle} type="button" aria-pressed={hidden} onClick={() => setHidden(!hidden)} className={BTN_TOGGLE}>
        <Icon name={hidden ? 'eye-off' : 'eye'} size={18} />
        Nascondi per ripasso
      </button>
    </>
  )

  return (
    <Frame id={anchor} label="Formula" labelledBy={titleId} actions={actions}>
      <div className="grid @2xl:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="min-w-0 p-4 @md:p-6">
          <h4 id={titleId} className={TITLE}>
            {formula.name}
          </h4>
          <p lang="en" className="m-0 mt-1 text-muted italic">
            {formula.nameEn}
          </p>
          {hidden ? (
            <div className={`mt-5 grid justify-items-start gap-3 border border-border p-4 ${HATCH}`}>
              <p className="m-0 bg-surface px-1">Formula coperta: scrivila su carta, poi confronta.</p>
              <button
                type="button"
                className={BTN_PRIMARY}
                onClick={() => {
                  setHidden(false)
                  hideToggle.current?.focus()
                }}
              >
                <Icon name="eye" size={18} />
                Mostra la formula
              </button>
            </div>
          ) : (
            <>
              <div className="text-[length:var(--step-1)]">
                <M tex={formula.latex} display />
              </div>
              <Rich text={formula.explain} className={`${FLOW} text-muted`} />
            </>
          )}
        </div>
        <div className="border-t border-border p-4 @2xl:border-t-0 @2xl:border-l">
          <p className="label m-0">Fonte</p>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0 @2xl:flex-col @2xl:items-start">
            {formula.source.map((s) => (
              <li key={`${s.doc}-${s.page}`} className="m-0">
                <SourceRef doc={s.doc} page={s.page} block />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!hidden && formula.symbols.length > 0 && (
        <div className="border-t border-border-strong p-4 @md:px-6">
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

      {(formula.whenToUse || formula.pitfalls) && (
        <div className={`grid border-t border-border-strong ${both ? '@xl:grid-cols-2' : ''}`}>
          {formula.whenToUse && (
            <div className="min-w-0 p-4 @md:px-6">
              <p className="label m-0 flex items-center gap-2">
                <Icon name="arrow" size={16} />
                Quando si usa
              </p>
              <Rich text={formula.whenToUse} className={`${FLOW} mt-2`} />
            </div>
          )}
          {formula.pitfalls && (
            <div className={`min-w-0 bg-warn-bg p-4 @md:px-6 ${both ? 'border-t border-border @xl:border-t-0 @xl:border-l' : ''}`}>
              <p className="label m-0 flex items-center gap-2 text-warn">
                <Icon name="warning" size={16} />
                Trappole
              </p>
              <Rich text={formula.pitfalls} className={`${FLOW} mt-2`} />
            </div>
          )}
        </div>
      )}
    </Frame>
  )
}
