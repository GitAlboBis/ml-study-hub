// La sfida con uno spazio per la risposta: è il Challenge del kit (src/widgets/kit/Challenge.tsx) con in più `answer`,
// reso fra la consegna e i pulsanti. Un esercizio si legge così: la domanda, la risposta, il controllo e il suo esito.
// Il Challenge del kit mette Verifica subito sotto la consegna, e chi ci aggiungeva il campo della risposta lo trovava
// dopo Verifica sulla pagina e nell'ordine del Tab, con l'esito sopra il campo da correggere.
//
// DA PROMUOVERE AL KIT. Il kit non si modifica dai motori (WIDGET_GUIDE §1.6): questa è una copia fedele del
// Challenge del kit (testi, stile, moto, registrazione nei progressi) più la prop `answer`. Quando il kit avrà
// `ChallengeProps.answer`, ChallengeRunner torna al Challenge del kit e questo file si cancella. Se il Challenge del
// kit cambia prima, va cambiato anche qui.
//
// STATO e MOTO: come nel kit. Esito con icona e parole in una regione role="status" presente dall'inizio, rimontata
// a ogni verifica; entra in 200 ms (opacity e 4 px, ease-out, @starting-style), azzerato con reduced motion.
import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Rich } from '../../../components/content/Rich'
import { useProgress } from '../../../store/progress'
import { ActionButton } from '../../kit/ActionButton'
import type { ChallengeProps } from '../../kit/Challenge'
import { useWidgetMeta } from '../../kit/widgetContext'

export interface ChallengePanelProps extends ChallengeProps {
  /** la risposta dello studente (campo, opzioni, chip), fra la consegna e Verifica */
  answer?: ReactNode
}

const ENTER = 'transition-[opacity,translate] duration-200 ease-out starting:translate-y-1 starting:opacity-0'
const ICON = { viewBox: '0 0 24 24', width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'square', 'aria-hidden': true } as const

export function ChallengePanel({ prompt, status, hint, onCheck, widgetId, checkLabel = 'Verifica', answer }: ChallengePanelProps) {
  const meta = useWidgetMeta()
  const id = widgetId ?? meta?.id
  const completeChallenge = useProgress((s) => s.completeChallenge)
  const doneAt = useProgress((s) => (id !== undefined ? s.challenges[id] : undefined))
  const [hintOpen, setHintOpen] = useState(false)
  // tentativi di verifica e, per l'ultimo, se l'esito deve suggerire l'indizio (era ancora chiuso)
  const [attempt, setAttempt] = useState({ n: 0, offerHint: true })
  const hintId = useId()
  const check = () => {
    setAttempt((a) => ({ n: a.n + 1, offerHint: !hintOpen }))
    onCheck()
  }

  useEffect(() => {
    if (status === 'ok' && id !== undefined) completeChallenge(id)
  }, [status, id, completeChallenge])

  return (
    // un div e non una section con nome: una pagina ha decine di widget, e ogni regione in più è rumore fra i landmark
    <div className="grid gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h4 className="label m-0 bg-pin px-2 py-0.5 text-pin-contrast">Sfida</h4>
        {doneAt !== undefined && status !== 'ok' && (
          <span className="label">
            Già superata il <span className="num tracking-normal">{new Date(doneAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </span>
        )}
      </div>

      <Rich text={prompt} inline className="block max-w-[var(--measure)]" />

      {answer !== undefined && answer !== null ? (
        <div data-challenge-answer="" className="grid gap-3">
          {answer}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <ActionButton variant="primary" onClick={check}>
          {checkLabel}
        </ActionButton>
        {hint !== undefined && (
          <ActionButton aria-expanded={hintOpen} aria-controls={hintId} onClick={() => setHintOpen((open) => !open)}>
            Indizio
          </ActionButton>
        )}
      </div>

      {hint !== undefined && (
        // una voce di legenda in cornice, come l'Idea chiave: tassello a spillo ed etichetta, niente filetto laterale
        <div id={hintId} hidden={!hintOpen} className="grid gap-1.5 border border-border p-3">
          {hintOpen && (
            <>
              <p className="label m-0 flex items-center gap-2">
                <span aria-hidden="true" className="size-3 shrink-0 border border-border-strong bg-pin" />
                Indizio
              </p>
              <Rich text={hint} inline className="block max-w-[var(--measure)] text-muted" />
            </>
          )}
        </div>
      )}

      <div role="status" className="min-h-0">
        {status === 'ok' && (
          <p key={`ok-${attempt.n}`} className={`m-0 flex items-center gap-3 border border-border bg-ok-bg p-3 ${ENTER}`}>
            <svg {...ICON} className="shrink-0 text-ok">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
            <span>
              <strong>Sfida superata.</strong>
              {id !== undefined && ' È segnata nei tuoi progressi.'}
            </span>
          </p>
        )}
        {status === 'ko' && (
          <p key={`ko-${attempt.n}`} className={`m-0 flex items-center gap-3 border border-border bg-warn-bg p-3 ${ENTER}`}>
            <svg {...ICON} className="shrink-0 text-warn">
              <path d="M12 4v10M12 18.5v.5" />
            </svg>
            <span>
              <strong>Non ancora.</strong> {hint !== undefined && attempt.offerHint ? "Cambia i valori e riprova, oppure apri l'indizio." : 'Cambia i valori e riprova.'}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
