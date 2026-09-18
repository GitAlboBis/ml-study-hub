// Dimostrazione a passi: si parte dal primo, ogni clic ne rivela uno con il suo "perché"; la conclusione arriva
// con l'ultimo. In modalità "prova tu" il passo che viene mostra solo il perché, come indizio, e tiene coperta
// la formula: la si scrive su carta e poi la si confronta, che è quello che chiede l'orale.
import { useId, useState } from 'react'
import type { Derivation as DerivationData } from '../../content/types'
import { M } from './M'
import { targetId, useModule } from './ModuleContext'
import { Rich } from './Rich'
import { BTN_TOGGLE, FLOW, Frame, HATCH, Icon, Missing, STEP_ENTER, StepControls, TITLE } from './shared'
import { SourceRef } from './SourceRef'

/** `<Derivation id />` nell'MDX: prende la dimostrazione dai dati del modulo corrente. */
export function Derivation({ id }: { id: string }) {
  const data = useModule()
  const derivation = data.derivations.find((d) => d.id === id)
  if (!derivation) return <Missing what="La dimostrazione" id={id} />
  return <DerivationCard derivation={derivation} anchor={targetId('derivation', id)} />
}

const two = (n: number) => String(n).padStart(2, '0')

/** La dimostrazione senza il contesto del modulo: la riusano le schede di pratica. */
export function DerivationCard({ derivation, anchor }: { derivation: DerivationData; anchor?: string }) {
  const total = derivation.steps.length
  const [shown, setShown] = useState(Math.min(1, total))
  const [tryIt, setTryIt] = useState(false)
  const titleId = useId()
  const done = shown >= total
  const pending = tryIt && !done ? derivation.steps[shown] : undefined

  const actions = total > 1 && (
    <button type="button" aria-pressed={tryIt} onClick={() => setTryIt(!tryIt)} className={BTN_TOGGLE}>
      <Icon name="pencil" size={18} />
      Prova tu
    </button>
  )

  return (
    <Frame id={anchor} label="Dimostrazione" labelledBy={titleId} actions={actions}>
      <div className="grid @2xl:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="min-w-0 p-4 @md:p-6">
          <h4 id={titleId} className={TITLE}>
            {derivation.title}
          </h4>
          <dl className="m-0 mt-3 grid gap-2">
            <div>
              <dt className="label">Obiettivo</dt>
              <dd className="m-0">
                <Rich text={derivation.goal} className={FLOW} />
              </dd>
            </div>
            {derivation.assumptions && (
              <div>
                <dt className="label">Ipotesi</dt>
                <dd className="m-0">
                  <Rich text={derivation.assumptions} className={FLOW} />
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="border-t border-border p-4 @2xl:border-t-0 @2xl:border-l">
          <p className="label m-0">Fonte</p>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0 @2xl:flex-col @2xl:items-start">
            {derivation.source.map((s) => (
              <li key={`${s.doc}-${s.page}`} className="m-0">
                <SourceRef doc={s.doc} page={s.page} block />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ol className="m-0 list-none p-0">
        {derivation.steps.slice(0, shown).map((step, i) => (
          <li key={i} className={`m-0 grid grid-cols-[2.75rem_minmax(0,1fr)] border-t border-border ${i > 0 ? STEP_ENTER : ''}`}>
            <span className="num border-r border-border pt-7 text-center text-[length:var(--step--1)] text-faint">{two(i + 1)}</span>
            <div className="min-w-0 px-4 pb-4">
              <M tex={step.latex} display />
              <p className="m-0">
                <span className="label mr-2">Perché</span>
                <Rich text={step.why} inline />
              </p>
            </div>
          </li>
        ))}
        {pending && (
          <li key={`prova-${shown}`} className={`m-0 grid grid-cols-[2.75rem_minmax(0,1fr)] border-t border-border-strong ${STEP_ENTER}`}>
            <span className="num border-r border-border bg-pin pt-4 text-center text-[length:var(--step--1)] text-pin-contrast">{two(shown + 1)}</span>
            <div className="min-w-0 p-4">
              <p className="m-0">
                <span className="label mr-2 text-text">Tocca a te · indizio</span>
                <Rich text={pending.why} inline />
              </p>
              <p className={`m-0 mt-3 border border-border p-4 ${HATCH}`}>
                <span className="bg-surface px-1">Scrivi il passo su carta, poi confronta.</span>
              </p>
            </div>
          </li>
        )}
      </ol>

      {done && (
        <div className={`border-t border-border-strong bg-surface-2 p-4 @md:px-6 ${total > 1 ? STEP_ENTER : ''}`}>
          <p className="label m-0 flex items-center gap-2 text-text">
            <Icon name="check" size={16} />
            Conclusione
          </p>
          <Rich text={derivation.conclusion} className={`${FLOW} mt-2`} />
        </div>
      )}

      <StepControls
        shown={shown}
        total={total}
        nextLabel={pending ? `Confronta il passo ${shown + 1}` : 'Passo successivo'}
        onNext={() => setShown(shown + 1)}
        onAll={() => setShown(total)}
        onReset={() => setShown(1)}
      />
    </Frame>
  )
}
