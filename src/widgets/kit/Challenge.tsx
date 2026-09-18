// La sfida del widget: una consegna ("trova h che minimizza l'errore"), il pulsante Verifica e l'esito.
// Il widget decide l'esito (status); quando diventa 'ok' il completamento finisce nei progressi
// (useProgress.completeChallenge) con l'id del widget, preso dal WidgetFrame in cui la sfida vive
// oppure dalla prop widgetId. Lo store tiene la data del PRIMO completamento: rifare la sfida non
// la sposta.
//
// STATO. Esito positivo con i token di successo, "non ancora" con quelli di avviso: non è un errore
// e nel mondo dell'atlante il rosso è vegetazione, non uno stato. Sempre icona più parole, mai il
// solo colore. L'esito vive in una regione role="status" presente dall'inizio, così il cambio
// viene annunciato. Ogni pressione di Verifica rimonta il paragrafo dell'esito (chiave con il
// numero del tentativo): anche un secondo "non ancora" identico al primo cambia la regione e si
// sente, così chi ascolta sa che la verifica è partita. Il testo dell'esito si fissa al momento
// della verifica: aprire l'indizio dopo non lo riscrive (e non lo fa ripetere).
//
// MOTO. Verificare è un gesto raro e atteso: l'esito entra con opacity e 4 px di salita, 200 ms,
// ease-out (@starting-style, quindi interrompibile e senza JavaScript). Con reduced motion le
// transizioni sono azzerate da base.css. Il pulsante ha solo la risposta alla pressione.
import { useEffect, useId, useState } from 'react'
import { Rich } from '../../components/content/Rich'
import type { Rich as RichText } from '../../content/types'
import { useProgress } from '../../store/progress'
import { ActionButton } from './ActionButton'
import { useWidgetMeta } from './widgetContext'

export type ChallengeStatus = 'idle' | 'ok' | 'ko'

export interface ChallengeProps {
  prompt: RichText
  status: ChallengeStatus
  hint?: RichText
  onCheck: () => void
  /** Id con cui registrare il completamento. Dentro un WidgetFrame non serve: vale meta.id. */
  widgetId?: string
  /** Testo del pulsante. Predefinito: "Verifica". */
  checkLabel?: string
}

const ENTER = 'transition-[opacity,translate] duration-200 ease-out starting:translate-y-1 starting:opacity-0'
const ICON = { viewBox: '0 0 24 24', width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'square', 'aria-hidden': true } as const

export function Challenge({ prompt, status, hint, onCheck, widgetId, checkLabel = 'Verifica' }: ChallengeProps) {
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
