// Esempio svolto: i figli <Step title> si rivelano uno alla volta, tutto il resto (l'enunciato) si legge subito.
// Example numera i suoi Step diretti e passa a ciascuno il proprio posto; uno Step fuori da un Example si mostra intero.
import { Children, createContext, isValidElement, useContext, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { targetId } from './ModuleContext'
import { FLOW, Frame, STEP_ENTER, StepControls, TITLE } from './shared'

interface StepSlot {
  /** posto del passo, da 0 */
  index: number
  /** quanti passi sono rivelati */
  shown: number
}

const StepSlotContext = createContext<StepSlot | null>(null)

const two = (n: number) => String(n).padStart(2, '0')

export function Example({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  const [shown, setShown] = useState(1)
  const titleId = useId()

  // Step si riconosce per identità: nell'MDX arriva da mdxComponents, quindi è questa stessa funzione.
  const items = Children.toArray(children)
  const total = items.filter((c) => isValidElement(c) && c.type === Step).length
  let next = 0

  return (
    <Frame id={targetId('example', id)} label="Esempio svolto" labelledBy={titleId}>
      <div className={`p-4 @md:p-6 ${FLOW}`}>
        <h4 id={titleId} className={TITLE}>
          {title}
        </h4>
        {items.map((child) => {
          if (!isValidElement(child) || child.type !== Step) return child
          const index = next++
          return (
            <StepSlotContext key={child.key ?? index} value={{ index, shown }}>
              {child}
            </StepSlotContext>
          )
        })}
      </div>
      <StepControls shown={Math.min(shown, total)} total={total} onNext={() => setShown(shown + 1)} onAll={() => setShown(total)} onReset={() => setShown(1)} />
    </Frame>
  )
}

export function Step({ title, children }: { title: string; children?: ReactNode }) {
  const slot = useContext(StepSlotContext)
  if (slot && slot.index >= slot.shown) return null
  return (
    <section className={`grid grid-cols-[2.75rem_minmax(0,1fr)] border-t border-border pt-3 ${slot && slot.index > 0 ? STEP_ENTER : ''}`}>
      <span className="num pt-0.5 text-[length:var(--step--1)] text-faint" aria-hidden="true">
        {slot ? two(slot.index + 1) : '·'}
      </span>
      <div className={`min-w-0 ${FLOW}`}>
        <h5 className="m-0 font-body text-[length:var(--step-0)] font-bold text-text">{title}</h5>
        {children}
      </div>
    </section>
  )
}
