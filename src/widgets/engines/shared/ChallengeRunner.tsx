// Le sfide comuni dei motori (CommonChallenge: custom, find, predict, sort, compute) sopra il Challenge del kit.
// Il kit dà consegna, Verifica, Indizio, esito e la registrazione nei progressi; qui si aggiunge ciò che ogni tipo di
// sfida vuole: il campo della risposta, la previsione da bloccare, i chip da smistare, e dopo la verifica i numeri
// del confronto (il tuo valore, l'obiettivo, lo scarto). L'esito lo decide evaluateChallenge (challenges.ts).
//
// VALIDITÀ. L'esito vale per ciò che è stato verificato: `stateKey` (ciò che conta nello stato: il motore sceglie,
// di solito non il punto sonda) più la risposta. Se cambia uno dei due, la sfida torna "da verificare"
// (WIDGET_GUIDE §9). Il motore riceve l'esito con onOutcome per accendere sul terreno ciò che la sfida chiedeva.
// Una sfida diversa (tipo o consegna: una scheda di `tabs` con la sua sfida) azzera risposta, blocco ed esito.
//
// PREDICT. Si prevede prima di far partire il racconto: la previsione si scrive (o si segna sul terreno: il motore
// passa `pick`, i campi numerici sono l'alternativa da tastiera) e si blocca con "Blocca la previsione"; poi Play,
// poi Verifica. Il motore sa del blocco con onLockChange.
//
// SORT. I chip li smista DragBins della base comune: trascinamento, tocco e "Posa qui", tastiera (Invio prende,
// frecce scelgono il contenitore, Invio posa, Esc annulla). Dopo la verifica ogni chip ha l'icona e la parola
// dell'esito, e quelli da rivedere la loro spiegazione.
//
// DISPOSIZIONE. Consegna, risposta, Verifica e Indizio, esito, numeri del confronto: la risposta sta fra la consegna e
// Verifica (sulla pagina e nel Tab) grazie a ChallengePanel, il Challenge del kit con lo spazio `answer` (da promuovere
// al kit). Invio nel campo verifica (compute) o blocca la previsione (predict).
//
// ERRORI. "Manca la tua risposta" è legato al campo (aria-invalid e aria-describedby) e annunciato; "Blocca la
// previsione" spento dice perché, in una riga accanto che lo descrive.
//
// MOTO. Nessuno oltre a quello del kit (l'esito entra in 200 ms): si risponde spesso e da tastiera.
import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Rich } from '../../../components/content/Rich'
import { ActionButton } from '../../kit/ActionButton'
import type { ChallengeStatus } from '../../kit/Challenge'
import { decimalsOf, fixed } from '../../kit/format'
import type { NumberFormat } from '../../kit/format'
import { Readout } from '../../kit/Readout'
import { ChallengePanel } from './ChallengePanel'
import { evaluateChallenge } from './challenges'
import type { ChallengeAnswer, ChallengeOutcome } from './challenges'
import { DragBins } from './DragBins'
import type { Placement } from './dragKeyboard'
import { richToPlain } from './presetTools'
import type { CommonChallenge } from './types'

export type ChallengePick = number | readonly [number, number]

export interface ChallengeRunnerProps<State> {
  challenge: CommonChallenge<State>
  /** lo stato corrente del widget: la sfida lo legge alla verifica */
  state: State
  /** ciò che conta per l'esito, in una stringa: se cambia, l'esito torna da verificare */
  stateKey: string
  /** predict con 'click-x' o 'click-xy': il segno messo sul terreno (null: nessuno). Senza, i campi numerici bastano */
  pick?: ChallengePick | null
  /** i campi numerici (l'alternativa da tastiera al clic) scrivono il segno: il motore lo ridisegna sul terreno */
  onPick?: (pick: ChallengePick | null) => void
  /** l'esito valido (null quando torna da verificare) */
  onOutcome?: (outcome: ChallengeOutcome | null) => void
  /** predict: la previsione è bloccata (il racconto può partire) */
  onLockChange?: (locked: boolean) => void
  /** formato dei numeri nelle letture; predefinito: i decimali della tolleranza più uno (fra 2 e 4) */
  format?: NumberFormat
  /** nomi delle coordinate del segno sul terreno; predefinito ['x', 'y'] */
  axisNames?: readonly [string, string?]
  /** id per i progressi, se la sfida non sta in un WidgetFrame */
  widgetId?: string
}

/** "3,5" come "3.5": sulla tastiera italiana la virgola decimale viene spontanea. Vuoto o non un numero: null. */
function parseNumber(text: string): number | null {
  const t = text.trim().replace(',', '.')
  if (t === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return null
  const v = Number(t)
  return Number.isFinite(v) ? v : null
}

const answerKey = (a: ChallengeAnswer | undefined): string => {
  if (a === undefined) return '-'
  switch (a.kind) {
    case 'number':
      return `n${a.value}`
    case 'point':
      return `p${a.value[0]},${a.value[1]}`
    case 'option':
      return `o${a.index}`
    case 'placement':
      return `s${Object.entries(a.bins)
        .sort(([x], [y]) => x.localeCompare(y))
        .map(([k, v]) => `${k}:${v}`)
        .join(',')}`
  }
}

/**
 * Campo per un numero scritto a mano: testo libero (anche vuoto), tastierino decimale sui telefoni. `missingId` è l'id
 * del messaggio "manca la risposta" quando Verifica l'ha trovato vuoto: il campo diventa aria-invalid e ne è descritto.
 */
function AnswerField({ id, label, value, onChange, onEnter, unit, disabled = false, missingId }: { id: string; label: string; value: string; onChange: (v: string) => void; onEnter?: () => void; unit?: string; disabled?: boolean; missingId?: string }) {
  const invalid = value.trim() !== '' && parseNumber(value) === null
  const describedBy = [invalid ? `${id}-err` : undefined, missingId].filter((s) => s !== undefined).join(' ')
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={disabled}
          aria-invalid={invalid || missingId !== undefined || undefined}
          aria-describedby={describedBy === '' ? undefined : describedBy}
          onChange={(e) => onChange(e.currentTarget.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && onEnter !== undefined) {
              e.preventDefault()
              onEnter()
            }
          }}
          className="num min-h-10 w-full max-w-[14rem] min-w-0 rounded-m border border-border-strong bg-surface px-3 text-right text-text disabled:cursor-not-allowed disabled:opacity-60"
        />
        {unit !== undefined ? <span className="num flex items-center text-muted">{unit}</span> : null}
      </div>
      {invalid ? (
        <p id={`${id}-err`} className="m-0 text-[length:var(--step--1)] text-muted">
          Scrivi un numero, con il punto o la virgola decimale.
        </p>
      ) : null}
    </div>
  )
}

/** I chip posati in un contenitore (quelli nel vassoio, null, non sono una risposta). */
const placedOnly = (p: Placement): Record<string, string> => Object.fromEntries(Object.entries(p).filter((e): e is [string, string] => e[1] !== null))

const CROSS = <path d="M6 6l12 12M18 6L6 18" />
const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square" aria-hidden="true" className="shrink-0">
    {d}
  </svg>
)

export function ChallengeRunner<State>(props: ChallengeRunnerProps<State>) {
  const { challenge: ch, state, stateKey, pick, onPick, onOutcome, onLockChange, axisNames = ['x', 'y'], widgetId } = props
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const fmt: NumberFormat = props.format ?? fixed('tolerance' in ch ? Math.min(4, Math.max(2, decimalsOf(ch.tolerance) + 1)) : 2)

  // --- risposta ---
  const [draft, setDraft] = useState('')
  const [draftY, setDraftY] = useState('')
  const [option, setOption] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [placement, setPlacement] = useState<Placement>({})
  const [result, setResult] = useState<{ key: string; outcome: ChallengeOutcome } | null>(null)
  const [missing, setMissing] = useState(false)
  // una sfida nuova (una scheda con un'altra sfida) riparte da capo. La si riconosce da tipo e consegna, non
  // dall'oggetto: un preset che la scrive in linea non la azzera a ogni render
  const identity = `${ch.kind}|${ch.prompt}`
  const [lastIdentity, setLastIdentity] = useState(identity)
  if (identity !== lastIdentity) {
    setLastIdentity(identity)
    setDraft('')
    setDraftY('')
    setOption(null)
    setLocked(false)
    setPlacement({})
    setResult(null)
    setMissing(false)
  }
  // il segno sul terreno riscrive i campi (stato derivato dalle props, senza effetti)
  const [lastPick, setLastPick] = useState<ChallengePick | null | undefined>(pick)
  if (pick !== lastPick) {
    setLastPick(pick)
    if (pick == null) {
      setDraft('')
      setDraftY('')
    } else if (typeof pick === 'number') setDraft(String(Number(pick.toFixed(6))))
    else {
      setDraft(String(Number(pick[0].toFixed(6))))
      setDraftY(String(Number(pick[1].toFixed(6))))
    }
  }

  const clickXY = ch.kind === 'predict' && ch.input === 'click-xy'
  let answer: ChallengeAnswer | undefined
  if (ch.kind === 'sort') answer = { kind: 'placement', bins: placedOnly(placement) }
  else if (ch.kind === 'predict' && typeof ch.input === 'object') answer = option === null ? undefined : { kind: 'option', index: option }
  else if (clickXY) {
    const x = parseNumber(draft)
    const y = parseNumber(draftY)
    answer = x === null || y === null ? undefined : { kind: 'point', value: [x, y] }
  } else if (ch.kind === 'predict' || ch.kind === 'compute') {
    const v = parseNumber(draft)
    answer = v === null ? undefined : { kind: 'number', value: v }
  }
  const needsAnswer = ch.kind === 'predict' || ch.kind === 'compute'
  // il messaggio "manca la risposta", finché la risposta resta vuota dopo Verifica
  const missingId = `${uid}-missing`
  const showMissing = missing && answer === undefined
  const missingRef = showMissing ? missingId : undefined

  // --- esito ---
  const key = `${identity}|${stateKey}|${answerKey(answer)}`
  const valid = result !== null && result.key === key ? result.outcome : null
  const status: ChallengeStatus = valid === null ? 'idle' : valid.passed ? 'ok' : 'ko'

  const onOutcomeRef = useRef(onOutcome)
  const onLockRef = useRef(onLockChange)
  useEffect(() => {
    onOutcomeRef.current = onOutcome
    onLockRef.current = onLockChange
  })
  useEffect(() => onOutcomeRef.current?.(valid), [valid])
  useEffect(() => onLockRef.current?.(locked), [locked])

  const check = () => {
    if (needsAnswer && answer === undefined) {
      setMissing(true)
      setResult(null)
      return
    }
    setMissing(false)
    if (ch.kind === 'predict') setLocked(true)
    setResult({ key, outcome: evaluateChallenge(ch, state, answer) })
  }

  const writePick = (x: string, y: string) => {
    if (onPick === undefined || ch.kind !== 'predict' || (ch.input !== 'click-x' && ch.input !== 'click-xy')) return
    const px = parseNumber(x)
    const py = parseNumber(y)
    const next: ChallengePick | null = ch.input === 'click-x' ? px : px === null || py === null ? null : [px, py]
    setLastPick(next)
    onPick(next)
  }

  let body: ReactNode = null
  if (ch.kind === 'sort') {
    // i chip li smista DragBins (trascinamento, tocco e "Posa qui", tastiera); qui l'esito, chip per chip
    const verdict = valid?.kind === 'sort' ? valid : null
    const feedback = verdict === null ? undefined : Object.fromEntries(Object.keys(placedOnly(placement)).map((id) => [id, verdict.wrong.includes(id) ? ('wrong' as const) : ('ok' as const)]))
    body = (
      <div className="grid gap-3">
        <DragBins id={`${uid}-sort`} label="Smista gli elementi" items={ch.items} bins={ch.bins} placement={placement} onChange={setPlacement} feedback={feedback} />
        {verdict !== null && verdict.wrong.length > 0 && ch.explain !== undefined ? (
          <ul aria-label="Da rivedere" className="m-0 grid list-none gap-1 p-0 text-[length:var(--step--1)] text-muted">
            {verdict.wrong
              .filter((id) => ch.explain?.[id] !== undefined)
              .map((id) => (
                <li key={id} className="flex gap-2">
                  <span className="text-warn">{icon(CROSS)}</span>
                  <Rich text={ch.explain?.[id] ?? ''} inline />
                </li>
              ))}
          </ul>
        ) : null}
      </div>
    )
  } else if (ch.kind === 'predict') {
    const input = ch.input
    // il pulsante spento dice perché: una riga accanto, che ne è anche la descrizione accessibile
    const whyId = `${uid}-lockwhy`
    const why = locked || answer !== undefined ? null : typeof input === 'object' ? 'Scegli prima una risposta.' : input === 'number' ? 'Scrivi prima la previsione.' : 'Segna o scrivi prima la previsione.'
    const lockButton = (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {locked ? (
          <ActionButton onClick={() => setLocked(false)}>Cambia previsione</ActionButton>
        ) : (
          <ActionButton variant="primary" disabled={answer === undefined} aria-describedby={why !== null ? whyId : undefined} onClick={() => setLocked(true)}>
            Blocca la previsione
          </ActionButton>
        )}
        {why !== null ? (
          <p id={whyId} className="m-0 text-[length:var(--step--1)] text-muted">
            {why}
          </p>
        ) : null}
      </div>
    )
    const lockNote = locked ? (
      <p className="m-0 flex items-center gap-2 text-[length:var(--step--1)] text-muted">
        <span aria-hidden="true" className="size-3 shrink-0 border border-border-strong bg-pin" />
        Previsione bloccata: ora fai partire il racconto, poi premi Verifica.
      </p>
    ) : null
    if (typeof input === 'object') {
      body = (
        <div className="grid gap-3">
          <div role="radiogroup" aria-label="La tua previsione" aria-invalid={showMissing || undefined} aria-describedby={missingRef} className="grid gap-px border border-border-strong bg-border-strong">
            {input.options.map((o, i) => (
              <label key={i} className="flex min-h-10 cursor-pointer items-center gap-3 bg-surface px-3 py-2 hover:bg-surface-2 has-[:checked]:bg-surface-2 has-[:disabled]:cursor-not-allowed has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus">
                <input type="radio" name={`${uid}-opt`} checked={option === i} disabled={locked} onChange={() => setOption(i)} className="peer visually-hidden" aria-label={richToPlain(o)} />
                <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-border-strong bg-surface peer-checked:[&>span]:block">
                  <span className="hidden size-2.5 rounded-full bg-accent" />
                </span>
                <Rich text={o} inline />
              </label>
            ))}
          </div>
          {lockButton}
          {lockNote}
        </div>
      )
    } else {
      const [nx, ny = 'y'] = axisNames
      body = (
        <div className="grid gap-3">
          {input !== 'number' ? (
            <p className="m-0 text-[length:var(--step--1)] text-muted">Segna la previsione sul terreno, oppure scrivila qui.</p>
          ) : null}
          <div className="flex flex-wrap gap-4">
            <AnswerField
              id={`${uid}-x`}
              label={input === 'number' ? 'La tua previsione' : `Previsione di ${nx}`}
              value={draft}
              disabled={locked}
              missingId={parseNumber(draft) === null ? missingRef : undefined}
              onChange={(v) => {
                setDraft(v)
                writePick(v, draftY)
              }}
              onEnter={() => (answer !== undefined ? setLocked(true) : undefined)}
            />
            {input === 'click-xy' ? (
              <AnswerField
                id={`${uid}-y`}
                label={`Previsione di ${ny}`}
                value={draftY}
                disabled={locked}
                missingId={parseNumber(draftY) === null ? missingRef : undefined}
                onChange={(v) => {
                  setDraftY(v)
                  writePick(draft, v)
                }}
                onEnter={() => (answer !== undefined ? setLocked(true) : undefined)}
              />
            ) : null}
          </div>
          {lockButton}
          {lockNote}
        </div>
      )
    }
  } else if (ch.kind === 'compute') {
    body = <AnswerField id={`${uid}-ans`} label="La tua risposta" value={draft} unit={ch.unit} missingId={missingRef} onChange={setDraft} onEnter={check} />
  }

  // --- i numeri del confronto, dopo la verifica ---
  let readouts: ReactNode = null
  if (valid !== null) {
    if (valid.kind === 'find') {
      readouts = (
        <>
          <Readout label="Il tuo valore" value={valid.score} format={fmt} />
          <Readout label="Obiettivo" value={valid.target} format={fmt} />
          <Readout label={`Scarto (serve ≤ ${fmt(valid.tolerance)})`} value={valid.gap} format={fmt} pinned />
        </>
      )
    } else if (valid.kind === 'predict' && ch.kind === 'predict') {
      if (typeof ch.input === 'object') {
        const truth = typeof valid.truth === 'number' ? ch.input.options[valid.truth] : undefined
        readouts = truth !== undefined ? <Readout label="Risposta giusta" value={richToPlain(truth)} pinned /> : null
      } else {
        const show = (v: ChallengePick) => (typeof v === 'number' ? fmt(v) : `(${fmt(v[0])}, ${fmt(v[1])})`)
        readouts = (
          <>
            {answer !== undefined && (answer.kind === 'number' || answer.kind === 'point') ? <Readout label="La tua previsione" value={show(answer.value)} /> : null}
            <Readout label="Valore vero" value={show(valid.truth)} />
            <Readout label={`Scarto (serve ≤ ${fmt(ch.tolerance)})`} value={valid.distance} format={fmt} pinned />
            {ch.points === 'distance' ? <Readout label="Punti" value={`${Math.round(valid.points * 100)} / 100`} /> : null}
          </>
        )
      }
    } else if (valid.kind === 'compute') {
      readouts = valid.passed ? (
        <Readout label="Valore esatto" value={valid.expected} format={fixed(Math.min(6, Math.max(3, decimalsOf(ch.kind === 'compute' ? ch.tolerance : 0) + 2)))} pinned />
      ) : (
        <Readout label="La tua risposta è" value={valid.direction === 'high' ? 'troppo alta' : 'troppo bassa'} pinned />
      )
    } else if (valid.kind === 'sort') {
      readouts = <Readout label="Chip al posto giusto" value={`${ch.kind === 'sort' ? ch.items.length - valid.wrong.length - valid.missing.length : 0} di ${ch.kind === 'sort' ? ch.items.length : 0}`} pinned />
    }
  }

  return (
    <div className="@container grid gap-4">
      <ChallengePanel
        prompt={ch.prompt}
        hint={'hint' in ch ? ch.hint : undefined}
        status={status}
        onCheck={check}
        widgetId={widgetId}
        answer={
          body !== null ? (
            <>
              {body}
              {/* presente dall'inizio, così il messaggio si annuncia quando compare */}
              <div role="status" className="min-h-0">
                {showMissing ? (
                  <p id={missingId} className="m-0 text-[length:var(--step--1)] text-muted">
                    Manca la tua risposta: {ch.kind === 'predict' && typeof ch.input === 'object' ? 'sceglila' : 'scrivila'}, poi premi Verifica.
                  </p>
                ) : null}
              </div>
            </>
          ) : undefined
        }
      />
      {valid?.kind === 'custom' && valid.passed && ch.kind === 'custom' && ch.reveal !== undefined ? (
        <div className="grid gap-1.5 border border-border p-3">
          <p className="label m-0 flex items-center gap-2">
            <span aria-hidden="true" className="size-3 shrink-0 border border-border-strong bg-pin" />
            Perché
          </p>
          <Rich text={ch.reveal} inline className="block max-w-[var(--measure)]" />
        </div>
      ) : null}
      {readouts !== null ? <div className="grid grid-cols-2 gap-x-4 gap-y-3 @xl:grid-cols-4">{readouts}</div> : null}
    </div>
  )
}
