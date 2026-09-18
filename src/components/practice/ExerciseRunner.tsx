// Esercizio generativo: `generate(rng)` costruisce testo, risposte e soluzione a partire da un seed, così
// ogni variante è riproducibile ("Variante 3" è sempre la stessa) e "Nuovo esercizio" passa alla successiva.
// Le risposte numeriche si controllano una per una con la loro tolleranza (virgola o punto); un campo
// vuoto o non numerico è segnalato, non contato come sbagliato. "Mostra la soluzione" apre i passaggi
// e i valori attesi. Un esercizio senza risposte numeriche (concettuale, dimostrazione) ha solo la soluzione.
import { useId, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Exercise, ExerciseInstance } from '../../content/types'
import { createRng } from '../../lib/rng'
import { Rich } from '../content/Rich'
import { BTN_PRIMARY, BTN_SECONDARY, FLOW, Frame, Icon, TITLE } from '../content/shared'
import { checkAnswer, formatNumber } from './logic'
import { Difficulty } from './parts'

export interface ExerciseRunnerProps {
  exercise: Exercise
  /** seed della prima variante; predefinito 1 */
  seed?: number
  /** id DOM della cornice: la destinazione di copertura "exercise:<id>" */
  anchor?: string
  /** numero dell'esercizio nella scheda, per l'etichetta della cornice */
  number?: number
}

const KIND_LABEL: Record<Exercise['kind'], string> = {
  numerico: 'Numerico',
  concettuale: 'Concettuale',
  dimostrazione: 'Dimostrazione',
}

type Generated = { ok: true; value: ExerciseInstance } | { ok: false }

/** Una variante: se il generatore lancia, l'esercizio lo dice invece di far cadere la pagina. */
function generate(exercise: Exercise, seed: number): Generated {
  try {
    return { ok: true, value: exercise.generate(createRng(seed)) }
  } catch {
    return { ok: false }
  }
}

/** Esito di un campo: giusto, sbagliato, null = vuoto o non numerico, undefined = da controllare. */
type Mark = boolean | null | undefined

const tolerance = (t: number) => (t > 0 ? `tolleranza ± ${formatNumber(t)}` : 'valore esatto')

export function ExerciseRunner({ exercise, seed: firstSeed = 1, anchor, number }: ExerciseRunnerProps) {
  const [seed, setSeed] = useState(firstSeed)
  const [texts, setTexts] = useState<string[]>([])
  const [results, setResults] = useState<Mark[] | null>(null)
  const [solution, setSolution] = useState(false)
  const generated = useMemo(() => generate(exercise, seed), [exercise, seed])
  const uid = useId()
  const titleId = `${uid}-t`
  const solutionId = `${uid}-sol`
  const solutionLabelId = `${uid}-soll`

  const answers = generated.ok ? generated.value.answers : []

  function renew() {
    setSeed((s) => (s + 1) >>> 0)
    setTexts([])
    setResults(null)
    setSolution(false)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setResults(answers.map((a, i) => checkAnswer(a, texts[i] ?? '')))
  }

  const right = results?.filter((r) => r === true).length ?? 0
  const missing = results?.some((r) => r === null) ?? false
  // l'esito complessivo vale solo finché nessun campo è stato cambiato dopo il controllo
  const judged = results !== null && results.every((r) => r !== undefined)

  return (
    <Frame
      id={anchor}
      label={number !== undefined ? `Esercizio ${number}` : 'Esercizio'}
      icon="pencil"
      labelledBy={titleId}
      actions={
        <>
          <span className="label">{KIND_LABEL[exercise.kind] ?? exercise.kind}</span>
          <Difficulty value={exercise.difficulty} />
        </>
      }
    >
      <div className="grid gap-5 p-4 @md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h4 id={titleId} className={TITLE}>
            {exercise.title}
          </h4>
          {/* il numero della variante: cambia con "Nuovo esercizio" ed è annunciato */}
          <p className="num m-0 text-[length:var(--step--1)] text-muted" aria-live="polite">
            Variante {seed}
          </p>
        </div>

        {!generated.ok ? (
          <p role="alert" className="m-0 flex items-center gap-3 border border-border bg-error-bg p-3">
            <Icon name="cross" className="text-error" />
            La variante {seed} non si è generata. Prova con un nuovo esercizio.
          </p>
        ) : (
          <>
            <Rich text={generated.value.prompt} className={`prose ${FLOW}`} />

            {answers.length > 0 ? (
              <form onSubmit={onSubmit}>
                <ul className="m-0 grid list-none gap-3 p-0">
                  {answers.map((a, i) => {
                    const id = `${uid}-a${i}`
                    const r = results?.[i]
                    return (
                      <li key={i} className="grid gap-1.5 border-t border-border pt-3 first:border-t-0 first:pt-0">
                        <label htmlFor={id} className="font-bold">
                          <Rich text={a.label} inline />
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            id={id}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={texts[i] ?? ''}
                            aria-invalid={r === false || r === null ? true : undefined}
                            aria-describedby={`${id}-tol`}
                            onChange={(e) => {
                              const value = e.target.value
                              setTexts((ts) => {
                                const next = [...ts]
                                next[i] = value
                                return next
                              })
                              // il campo cambiato torna da controllare; gli altri tengono il loro esito
                              setResults((rs) => (rs === null ? rs : rs.map((x, j) => (j === i ? undefined : x))))
                            }}
                            className="num min-h-11 w-44 rounded-m border border-border-strong bg-bg px-3"
                          />
                          {r === true && (
                            <span className="label flex items-center gap-1 text-ok">
                              <Icon name="check" size={16} />
                              giusta
                            </span>
                          )}
                          {r === false && (
                            <span className="label flex items-center gap-1 text-error">
                              <Icon name="cross" size={16} />
                              da rivedere
                            </span>
                          )}
                          {r === null && (
                            <span className="label flex items-center gap-1 text-info">
                              <Icon name="info" size={16} />
                              manca il numero
                            </span>
                          )}
                        </div>
                        <p id={`${id}-tol`} className="num m-0 text-[length:var(--step--1)] text-faint">
                          {tolerance(a.tolerance)}
                        </p>
                      </li>
                    )
                  })}
                </ul>

                <div role="status" className="mt-4 empty:mt-0">
                  {judged && (
                    <p
                      className={`m-0 flex items-center gap-3 border border-border p-3 font-bold ${
                        missing ? 'bg-info-bg' : right === answers.length ? 'bg-ok-bg' : 'bg-error-bg'
                      }`}
                    >
                      <Icon
                        name={missing ? 'info' : right === answers.length ? 'check' : 'cross'}
                        className={missing ? 'text-info' : right === answers.length ? 'text-ok' : 'text-error'}
                      />
                      {right === answers.length
                        ? 'Tutte giuste'
                        : `Giuste ${right} su ${answers.length}${missing ? '. Scrivi un numero in ogni casella, ad esempio 0,33.' : ''}`}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="submit" className={BTN_PRIMARY}>
                    Controlla
                  </button>
                </div>
              </form>
            ) : (
              <p className="m-0 flex items-center gap-3 text-muted">
                <Icon name="pencil" size={18} />
                Prova a rispondere su carta, poi confronta con la soluzione.
              </p>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          {generated.ok && (
            <button type="button" className={BTN_SECONDARY} aria-expanded={solution} aria-controls={solutionId} onClick={() => setSolution(!solution)}>
              <Icon name={solution ? 'eye-off' : 'eye'} size={18} />
              {solution ? 'Nascondi la soluzione' : 'Mostra la soluzione'}
            </button>
          )}
          <button type="button" className={BTN_SECONDARY} onClick={renew}>
            <Icon name="reset" size={18} />
            Nuovo esercizio
          </button>
        </div>

        {generated.ok && (
          <div id={solutionId} role="region" aria-labelledby={solutionLabelId} hidden={!solution} className={`border border-border-strong bg-surface-2 p-4 ${FLOW}`}>
            <p id={solutionLabelId} className="label m-0 text-text">
              Soluzione
            </p>
            {solution && (
              <>
                <Rich text={generated.value.solution} className={`prose ${FLOW}`} />
                {answers.length > 0 && (
                  <dl className="m-0 grid gap-1 border-t border-border pt-3">
                    {answers.map((a, i) => (
                      <div key={i} className="flex flex-wrap items-baseline gap-x-3">
                        <dt>
                          <Rich text={a.label} inline />
                        </dt>
                        <dd className="num m-0">
                          {formatNumber(a.value)}
                          {a.tolerance > 0 ? ` ± ${formatNumber(a.tolerance)}` : ''}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Frame>
  )
}
