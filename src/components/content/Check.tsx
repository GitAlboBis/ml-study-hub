// Quiz dentro il testo, preso da data.quiz: scelta singola, scelta multipla, vero o falso, risposta numerica.
// L'esito usa i token di stato con icona ed etichetta (mai il solo colore) ed è annunciato (role="status");
// ogni tentativo finisce nei progressi con recordQuiz.
// Dopo la risposta i campi si disabilitano: se il fuoco era su uno di loro (Invio nel campo numerico, invio
// implicito del form) passa al pulsante, che diventa "Riprova", così chi usa la tastiera non perde il posto.
import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { QuizItem } from '../../content/types'
import { progressKey, useProgress } from '../../store/progress'
import { targetId, useModule } from './ModuleContext'
import { Rich } from './Rich'
import { BTN_PRIMARY, BTN_SECONDARY, FLOW, Frame, Icon, Missing } from './shared'

/** `<Check id />` nell'MDX: prende la domanda dai dati del modulo corrente. */
export function Check({ id }: { id: string }) {
  const data = useModule()
  const item = data.quiz.find((q) => q.id === id)
  if (!item) return <Missing what="Il quiz" id={id} />
  return <QuizCheck item={item} moduleId={data.id} anchor={targetId('quiz', id)} />
}

const number = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: 6 })

/** "0,33", "1.5e-3", " 2 " → numero; qualsiasi altra cosa → NaN. */
function parseNumber(text: string): number {
  const clean = text.trim().replace(',', '.')
  return clean === '' ? Number.NaN : Number(clean)
}

const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x))

/** Le opzioni mostrate: per vero/falso sono fisse, 0 = Vero e 1 = Falso. */
const optionsOf = (item: QuizItem) => (item.type === 'tf' ? ['Vero', 'Falso'] : item.type === 'numeric' ? [] : item.options)

function correctOptions(item: QuizItem): number[] {
  if (item.type === 'mcq') return [item.answer]
  if (item.type === 'multi') return item.answers
  if (item.type === 'tf') return [item.answer ? 0 : 1]
  return []
}

interface QuizCheckProps {
  item: QuizItem
  moduleId: string
  anchor?: string
}

/** La domanda senza il contesto del modulo. */
export function QuizCheck({ item, moduleId, anchor }: QuizCheckProps) {
  const [picked, setPicked] = useState<number[]>([])
  const [text, setText] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const recordQuiz = useProgress((s) => s.recordQuiz)
  const submit = useRef<HTMLButtonElement>(null)
  const uid = useId()
  const questionId = `${uid}-q`
  const inputId = `${uid}-n`
  const statusId = `${uid}-s`
  const multi = item.type === 'multi'
  const answered = result !== null
  const right = correctOptions(item)

  function judge(): boolean | null {
    if (item.type === 'numeric') {
      const value = parseNumber(text)
      if (!Number.isFinite(value)) {
        setHint('Scrivi un numero, ad esempio 0,33.')
        return null
      }
      return Math.abs(value - item.answer) <= item.tolerance + 1e-12
    }
    if (picked.length === 0) {
      setHint(multi ? 'Scegli almeno una risposta.' : 'Scegli una risposta.')
      return null
    }
    return sameSet(picked, right)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (answered) {
      setPicked([])
      setText('')
      setResult(null)
      setHint(null)
      return
    }
    const correct = judge()
    if (correct === null) return
    // il campo o l'opzione con il fuoco sta per diventare disabilitato: il fuoco va al pulsante, che resta
    const active = document.activeElement
    if (active !== submit.current && active instanceof HTMLElement && e.currentTarget instanceof HTMLFormElement && e.currentTarget.contains(active)) submit.current?.focus()
    setHint(null)
    setResult(correct)
    recordQuiz(progressKey(moduleId, item.id), correct)
  }

  const pick = (i: number) => {
    setHint(null)
    setPicked(multi ? (picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i]) : [i])
  }

  const difficulty = (
    <p className="m-0 flex items-center gap-1" title={`Difficoltà ${item.difficulty} su 3`}>
      <span className="visually-hidden">Difficoltà {item.difficulty} su 3</span>
      {[1, 2, 3].map((d) => (
        <span key={d} aria-hidden="true" className={`size-2.5 border border-border-strong ${d <= item.difficulty ? 'bg-accent' : ''}`} />
      ))}
    </p>
  )

  return (
    <Frame id={anchor} label="Verifica" labelledBy={questionId} actions={difficulty}>
      <form onSubmit={onSubmit} className="p-4 @md:p-6">
        {/* la domanda dà il nome alla cornice: l'id sta su un contenitore perché Rich non porta attributi */}
        <div id={questionId} className="font-bold">
          <Rich text={item.q} className={FLOW} />
        </div>

        {item.type === 'numeric' ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label htmlFor={inputId} className="label">
              La tua risposta{item.unit ? ` (${item.unit})` : ''}
            </label>
            <input
              id={inputId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={text}
              disabled={answered}
              aria-invalid={hint ? true : undefined}
              aria-describedby={hint ? statusId : undefined}
              onChange={(e) => {
                setText(e.target.value)
                setHint(null)
              }}
              className="num min-h-11 w-40 rounded-m border border-border-strong bg-bg px-3 disabled:border-border disabled:text-muted"
            />
          </div>
        ) : (
          <div role={multi ? 'group' : 'radiogroup'} aria-label={multi ? 'Opzioni, più risposte possibili' : 'Opzioni'} className="mt-4 grid gap-2">
            {multi && <p className="label m-0">Più risposte possibili</p>}
            {optionsOf(item).map((option, i) => {
              const isRight = right.includes(i)
              const isPicked = picked.includes(i)
              return (
                <label
                  key={i}
                  className="group flex min-h-11 cursor-pointer items-center gap-3 border border-border px-3 py-2 transition-[border-color,background-color] duration-[var(--dur-fast)] ease-out hover:border-border-strong has-[:checked]:border-border-strong has-[:checked]:bg-surface-2 has-[:disabled]:cursor-default has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
                >
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    name={uid}
                    checked={isPicked}
                    disabled={answered}
                    onChange={() => pick(i)}
                    className="sr-only"
                  />
                  <span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center border border-border-strong bg-surface ${multi ? '' : 'rounded-full'}`}>
                    <span className={`size-2.5 scale-0 bg-accent transition-[scale] duration-[var(--dur-fast)] ease-out group-has-[:checked]:scale-100 ${multi ? '' : 'rounded-full'}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <Rich text={option} inline />
                  </span>
                  {answered && isRight && (
                    <span className="label flex items-center gap-1 text-ok">
                      <Icon name="check" size={16} />
                      giusta
                    </span>
                  )}
                  {answered && isPicked && !isRight && (
                    <span className="label flex items-center gap-1 text-error">
                      <Icon name="cross" size={16} />
                      tua scelta
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        )}

        <div id={statusId} role="status" className="mt-4 empty:mt-0">
          {hint && (
            <p className="m-0 flex items-center gap-3 border border-border bg-info-bg p-3">
              <Icon name="info" className="text-info" />
              {hint}
            </p>
          )}
          {result !== null && (
            <p className={`m-0 flex items-center gap-3 border border-border p-3 font-bold ${result ? 'bg-ok-bg' : 'bg-error-bg'}`}>
              <Icon name={result ? 'check' : 'cross'} className={result ? 'text-ok' : 'text-error'} />
              {result ? 'Risposta corretta' : 'Risposta sbagliata'}
            </p>
          )}
        </div>

        {answered && (
          <div className={`mt-4 border-t border-border pt-4 ${FLOW}`}>
            {item.type === 'numeric' && (
              <p className="m-0">
                <span className="label mr-2">Risposta attesa</span>
                <span className="num">
                  {number(item.answer)} ± {number(item.tolerance)}
                  {item.unit ? ` ${item.unit}` : ''}
                </span>
              </p>
            )}
            <p className="label m-0">Spiegazione</p>
            <Rich text={item.explanation} className={FLOW} />
          </div>
        )}

        <button ref={submit} type="submit" className={`mt-5 ${answered ? BTN_SECONDARY : BTN_PRIMARY}`}>
          {answered ? (
            <>
              <Icon name="reset" size={18} />
              Riprova
            </>
          ) : (
            'Controlla'
          )}
        </button>
      </form>
    </Frame>
  )
}
