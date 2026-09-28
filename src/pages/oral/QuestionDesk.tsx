// Il banco di una domanda del simulatore: la scheda d'orale (ExamCard) con, nella fascia del tempo, la scala
// del tempo consigliato e la risposta ad alta voce. Il cronometro è uno solo e lo condividono la scheda e la
// voce: "Rispondi ad alta voce" lo avvia insieme alla trascrizione, e quando la scheda lo ferma (pausa o
// rivelazione) si ferma anche il microfono. Per una domanda della banca senza foglio pronto, al posto della
// risposta modello ci sono i fogli di riferimento, la nota sulla fonte e la pagina della banca.
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { BTN_PRIMARY, BTN_SECONDARY, BTN_TOGGLE, HATCH, Icon } from '../../components/content/shared'
import { RegionSwatch } from '../../components/layout/marks'
import { ExamCard } from '../../components/practice/ExamCard'
import { formatClock } from '../../components/practice/logic'
import type { ExamScore } from '../../components/practice/logic'
import { useStopwatch } from '../../components/practice/useStopwatch'
import type { Stopwatch } from '../../components/practice/useStopwatch'
import type { BankQuestion } from '../../content/exam-bank'
import { getModuleMeta } from '../../content/manifest'
import { hasModule } from '../../content/registry'
import { sheetNumber } from '../../lib/atlas'
import type { OralItem } from './logic'
import { useSpeechAnswer } from './useSpeech'
import type { SpeechAnswer, SpeechLang } from './useSpeech'

/** Microfono, nella mano delle icone del foglio (griglia 24, tratto 2, estremità squadrate). */
function MicIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" focusable="false" className="shrink-0">
      <path d="M9 3h6v10H9zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
    </svg>
  )
}

// ---------------------------------------------------------------------------------------------
// Scala del tempo
// ---------------------------------------------------------------------------------------------

/**
 * La scala grafica di una carta, in minuti: segmenti alterni a inchiostro e carta. Lo spillo segna il tempo
 * passato e scorre lineare (moto costante); con riduci movimento salta a passi. Oltre il tempo consigliato
 * resta in fondo e compare l'avviso, annunciato una volta.
 */
function TimeScale({ seconds, minutes }: { seconds: number; minutes: number }) {
  const limit = minutes * 60
  const over = seconds > limit
  const p = Math.min(1, seconds / limit)
  return (
    <div className="grid gap-2">
      <p className="m-0 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="label">Tempo consigliato · {minutes} min</span>
        <span className={`num text-[length:var(--step--1)] ${over ? 'text-warn' : 'text-muted'}`}>
          {over ? `oltre di ${formatClock(seconds - limit)}` : `${formatClock(limit - seconds)} rimasti`}
        </span>
      </p>
      <div aria-hidden="true" className="px-2">
        <div className="@container relative pt-4">
          <div className="flex h-2.5 border border-border-strong">
            {Array.from({ length: minutes }, (_, i) => (
              <span key={i} className={`flex-1 border-border-strong not-first:border-l ${i % 2 === 0 ? 'bg-accent' : 'bg-surface'}`} />
            ))}
          </div>
          {/* lo spillo: un'asta a inchiostro sulla scala e la testa ocra sopra */}
          <span
            className="absolute top-0 left-0 h-full w-0 transition-transform duration-[250ms] ease-linear"
            style={{ transform: `translateX(${p * 100}cqw)` }}
          >
            <span className="absolute top-0 left-0 size-3 -translate-x-1/2 border border-border-strong bg-pin" />
            <span className="absolute top-3 left-0 h-3.5 w-0.5 -translate-x-1/2 bg-accent" />
          </span>
          <div className="mt-1 flex justify-between">
            {Array.from({ length: minutes + 1 }, (_, i) => (
              <span key={i} className="num w-0 text-center text-[length:var(--step--1)] leading-none text-faint">
                <span className="inline-block -translate-x-1/2">{i}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      {over && (
        <p className="m-0 flex items-start gap-2 text-[length:var(--step--1)] text-warn">
          <Icon name="warning" size={18} />
          <span>Tempo consigliato superato: all'orale il docente ti fermerebbe qui. Chiudi con una sintesi di una frase.</span>
        </p>
      )}
      <span aria-live="polite" className="visually-hidden">
        {over ? 'Hai superato il tempo consigliato.' : ''}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Risposta ad alta voce
// ---------------------------------------------------------------------------------------------

const LANGS: { lang: SpeechLang; label: string; name: string }[] = [
  { lang: 'en-US', label: 'EN', name: 'inglese' },
  { lang: 'it-IT', label: 'IT', name: 'italiano' },
]

const wordCount = (s: string) => (s.trim() === '' ? 0 : s.trim().split(/\s+/).length)

interface VoiceAnswerProps {
  speech: SpeechAnswer
  watch: Stopwatch
  lang: SpeechLang
  onLang: (l: SpeechLang) => void
  /** risposta rivelata: niente più microfono, resta la trascrizione da confrontare con la traccia */
  revealed: boolean
}

function VoiceAnswer({ speech, watch, lang, onLang, revealed }: VoiceAnswerProps) {
  if (!speech.supported) {
    if (revealed) return null
    return (
      <p className="m-0 flex items-start gap-3 border-t border-border pt-3 text-[length:var(--step--1)] text-muted">
        <MicIcon />
        <span>
          Questo browser non trascrive la voce: rispondi ad alta voce con il cronometro, poi confronta con la traccia. La trascrizione funziona in Chrome, Edge e Safari.
        </span>
      </p>
    )
  }

  function toggle() {
    if (speech.listening) {
      speech.stop()
      watch.pause()
    } else {
      speech.start(lang)
      if (!watch.running) watch.start()
    }
  }

  function pickLang(l: SpeechLang) {
    onLang(l)
    if (speech.listening) speech.start(l)
  }

  const text = [speech.finalText, speech.interim].filter(Boolean).join(' ')
  const words = wordCount(text)
  const current = LANGS.find((l) => l.lang === lang) ?? LANGS[0]
  if (revealed && text === '') return null

  return (
    <div className="grid gap-3 border-t border-border pt-3">
      {!revealed && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <button type="button" className={speech.listening ? BTN_SECONDARY : BTN_PRIMARY} onClick={toggle}>
            <MicIcon />
            {speech.listening ? 'Ferma la trascrizione' : 'Rispondi ad alta voce'}
          </button>
          <div role="group" aria-label="Lingua della risposta" className="flex items-center gap-2">
            <span className="label" aria-hidden="true">
              Lingua
            </span>
            {LANGS.map((l) => (
              <button key={l.lang} type="button" aria-pressed={l.lang === lang} className={`${BTN_TOGGLE} min-h-10 px-3`} onClick={() => pickLang(l.lang)}>
                {l.label}
                <span className="visually-hidden">, {l.name}</span>
              </button>
            ))}
          </div>
          {speech.listening && (
            <span className="flex items-center gap-2 text-[length:var(--step--1)] text-text">
              <span aria-hidden="true" className="size-2.5 bg-pin outline outline-1 outline-border-strong" />
              In ascolto, in {current.name}
            </span>
          )}
        </div>
      )}
      <span aria-live="polite" className="visually-hidden">
        {speech.listening ? 'Trascrizione avviata.' : text !== '' ? 'Trascrizione ferma.' : ''}
      </span>

      {speech.error && (
        <p role="alert" className="m-0 flex items-start gap-3 border border-border bg-warn-bg p-3 text-[length:var(--step--1)]">
          <Icon name="warning" size={18} className="text-warn" />
          <span>{speech.error}</span>
        </p>
      )}

      {(text !== '' || speech.listening) && (
        <div className="grid gap-2 border border-border bg-bg p-3">
          <p className="label m-0 text-text">Trascrizione</p>
          <p lang={lang.slice(0, 2)} className="m-0 max-w-[var(--measure)] min-h-[1.6em]">
            {speech.finalText}
            {speech.interim && <span className="text-muted italic"> {speech.interim}</span>}
            {text === '' && <span className="text-faint">Parla pure: il testo compare qui mentre rispondi.</span>}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-2">
            <span className="num text-[length:var(--step--1)] text-muted">
              {words} {words === 1 ? 'parola' : 'parole'}
            </span>
            {text !== '' && (
              <button type="button" className={`${BTN_SECONDARY} min-h-10 px-3`} onClick={speech.clear}>
                <Icon name="cross" size={16} />
                Cancella la trascrizione
              </button>
            )}
          </div>
        </div>
      )}
      {!revealed && (
        <p className="m-0 text-[length:var(--step--1)] text-faint">La trascrizione resta su questa pagina e non viene salvata. In Chrome l'audio passa dal servizio vocale del browser, in rete.</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Fogli di riferimento (domanda della banca senza foglio pronto)
// ---------------------------------------------------------------------------------------------

function BankReferences({ bank }: { bank: BankQuestion }) {
  return (
    <div className="grid content-start gap-3">
      <p className="label m-0 text-text">Fogli di riferimento</p>
      <p className="m-0 max-w-[var(--measure)] text-muted">
        La risposta modello arriva con il foglio, ancora in preparazione. Intanto confronta quello che hai detto con questi fogli e con le fonti del corso.
      </p>
      <ul aria-label="Fogli di riferimento" className="m-0 grid list-none gap-0 p-0">
        {bank.moduleIds.map((id, i) => {
          const meta = getModuleMeta(id)
          if (!meta) return null
          const ready = hasModule(id)
          return (
            <li key={id} className="-mt-px grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 border border-border px-3 py-2">
              <RegionSwatch course={meta.course} />
              <span className="grid gap-0.5">
                <span>
                  <span className="num text-[length:var(--step--1)]">Foglio {sheetNumber(id)}</span> · {meta.title}
                  {i === 0 && <span className="label ml-2">principale</span>}
                </span>
                {ready ? (
                  <Link to={`/m/${id}`} target="_blank" rel="noreferrer" className="text-[length:var(--step--1)]">
                    Apri il foglio
                    <span className="visually-hidden"> {sheetNumber(id)} in una nuova scheda</span>
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 text-[length:var(--step--1)] text-muted">
                    <span aria-hidden="true" className={`size-3 border border-border ${HATCH}`} />
                    in preparazione
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
      {bank.note && (
        <p className="m-0 flex items-start gap-2 text-[length:var(--step--1)] text-muted">
          <Icon name="info" size={18} />
          <span>{bank.note}</span>
        </p>
      )}
      <p className="m-0 text-[length:var(--step--1)]">
        <Link to={`/fonti/examq/${bank.page}`} target="_blank" rel="noreferrer">
          Pagina {bank.page} della banca, nel documento originale
          <span className="visually-hidden"> (si apre in una nuova scheda)</span>
        </Link>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Il banco
// ---------------------------------------------------------------------------------------------

export interface QuestionDeskProps {
  item: OralItem
  number: number
  total: number
  /** tempo consigliato per la risposta, in minuti */
  minutes: number
  lang: SpeechLang
  onLang: (l: SpeechLang) => void
  onGrade: (score: ExamScore, seconds?: number) => void
  /** "Rifai la domanda": la prova dimentica il voto appena dato */
  onRetry?: () => void
}

export function QuestionDesk({ item, number, total, minutes, lang, onLang, onGrade, onRetry }: QuestionDeskProps) {
  const watch = useStopwatch()
  const speech = useSpeechAnswer()
  const { listening, stop } = speech
  const wasRunning = useRef(false)

  // la scheda ha fermato il cronometro (pausa o rivelazione): si chiude anche il microfono
  useEffect(() => {
    if (wasRunning.current && !watch.running && listening) stop()
    wasRunning.current = watch.running
  }, [watch.running, listening, stop])

  const bankOnly = item.sheet === undefined && item.bank !== undefined
  return (
    <ExamCard
      question={item.question}
      moduleId={item.recordModule}
      number={number}
      total={total}
      stopwatch={watch}
      onGrade={onGrade}
      onRetry={onRetry}
      timerExtra={(revealed) => (
        <div className="grid gap-4">
          <TimeScale seconds={watch.seconds} minutes={minutes} />
          <VoiceAnswer speech={speech} watch={watch} lang={lang} onLang={onLang} revealed={revealed} />
        </div>
      )}
      answerFallback={bankOnly && item.bank ? <BankReferences bank={item.bank} /> : undefined}
      revealLabel={bankOnly ? 'Rivela i fogli di riferimento' : undefined}
    />
  )
}
