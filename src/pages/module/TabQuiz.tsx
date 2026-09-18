// Scheda Quiz del foglio: si sceglie quali domande (tutte, quelle sbagliate l'ultima volta, quelle mai
// provate), il modo (allenamento con esito subito, esame a tempo con esito alla fine) e l'ordine, poi
// parte QuizRunner. Le letture in testata vengono dai progressi: quante domande provate, accuratezza.
import { useId, useMemo, useState } from 'react'
import { BTN_PRIMARY, BTN_TOGGLE, Icon } from '../../components/content/shared'
import { formatClock } from '../../components/practice/logic'
import type { QuizEntry } from '../../components/practice/logic'
import { PracticeHeader, Reading } from '../../components/practice/parts'
import { QuizRunner, SECONDS_PER_QUESTION } from '../../components/practice/QuizRunner'
import type { QuizMode } from '../../components/practice/QuizRunner'
import type { ModuleData } from '../../content/types'
import { createRng } from '../../lib/rng'
import { progressKey, useProgress } from '../../store/progress'
import { Segmented } from '../../widgets/kit/Segmented'

type Pool = 'tutte' | 'sbagliate' | 'nuove'

interface Run {
  n: number
  entries: QuizEntry[]
  mode: QuizMode
}

export default function TabQuiz({ data }: { data: ModuleData }) {
  // lo stato della prova appartiene al foglio: cambiando modulo si riparte dalla scelta
  return <QuizTab key={data.id} data={data} />
}

function QuizTab({ data }: { data: ModuleData }) {
  const headingId = useId()
  const uid = useId()
  const stats = useProgress((s) => s.quiz)
  const entries = useMemo<QuizEntry[]>(() => data.quiz.map((item) => ({ key: progressKey(data.id, item.id), item })), [data])

  const [mode, setMode] = useState<QuizMode>('allenamento')
  const [pool, setPool] = useState<Pool>('tutte')
  const [shuffle, setShuffle] = useState(false)
  const [run, setRun] = useState<Run | null>(null)

  const tried = entries.filter((e) => stats[e.key])
  const attempts = tried.reduce((n, e) => n + stats[e.key].attempts, 0)
  const correct = tried.reduce((n, e) => n + stats[e.key].correct, 0)
  const wrongLast = entries.filter((e) => stats[e.key] && !stats[e.key].lastCorrect)
  const fresh = entries.filter((e) => !stats[e.key])

  const pools: { value: Pool; label: string; entries: QuizEntry[] }[] = [
    { value: 'tutte', label: `Tutte · ${entries.length}`, entries },
    { value: 'sbagliate', label: `Sbagliate l'ultima volta · ${wrongLast.length}`, entries: wrongLast },
    { value: 'nuove', label: `Mai provate · ${fresh.length}`, entries: fresh },
  ]
  // un gruppo vuoto non si offre; se quello scelto si svuota (le hai rifatte giuste) si torna a "Tutte"
  const offered = pools.filter((p) => p.value === 'tutte' || p.entries.length > 0)
  const chosen = offered.find((p) => p.value === pool) ?? offered[0]

  function start() {
    const list = shuffle ? createRng(Date.now()).shuffle(chosen.entries) : [...chosen.entries]
    setRun((r) => ({ n: (r?.n ?? 0) + 1, entries: list, mode }))
  }

  const minutes = Math.ceil((chosen.entries.length * SECONDS_PER_QUESTION) / 60)

  return (
    <section aria-labelledby={headingId} className="grid max-w-[64rem] gap-6">
      <PracticeHeader
        id={headingId}
        title="Quiz"
        en="quiz"
        lead="Allenati con l'esito subito dopo ogni risposta, oppure simula un esame a tempo e scopri il punteggio alla fine."
      >
        {entries.length > 0 && (
          <>
            <Reading label="Domande" value={entries.length} />
            <Reading label="Provate" value={`${tried.length} su ${entries.length}`} />
            {attempts > 0 && <Reading label="Accuratezza" value={`${Math.round((100 * correct) / attempts)}%`} />}
          </>
        )}
      </PracticeHeader>

      {entries.length === 0 ? (
        <QuizRunner entries={[]} />
      ) : run ? (
        <QuizRunner key={run.n} entries={run.entries} mode={run.mode} onExit={() => setRun(null)} />
      ) : (
        <div className="@container grid justify-items-start gap-5 border border-border-strong bg-surface p-4 sm:p-6">
          <div className="grid gap-2">
            <Segmented<QuizMode>
              id={`${uid}-modo`}
              label="Modo"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'allenamento', label: 'Allenamento' },
                { value: 'esame', label: 'Esame a tempo' },
              ]}
            />
            <p className="m-0 max-w-[var(--measure)] text-[length:var(--step--1)] text-muted">
              {mode === 'esame'
                ? `Un minuto a domanda (${formatClock(chosen.entries.length * SECONDS_PER_QUESTION)} in tutto); puoi tornare indietro, l'esito arriva alla consegna.`
                : 'Esito e spiegazione dopo ogni risposta; la serie conta le risposte giuste di fila.'}
            </p>
          </div>
          {offered.length > 1 && (
            <Segmented<Pool> id={`${uid}-gruppo`} label="Domande" value={chosen.value} onChange={setPool} options={offered} />
          )}
          <button type="button" aria-pressed={shuffle} className={BTN_TOGGLE} onClick={() => setShuffle(!shuffle)}>
            Mescola l'ordine
          </button>
          <button type="button" className={BTN_PRIMARY} onClick={start}>
            <Icon name="arrow" size={18} />
            {mode === 'esame' ? `Inizia l'esame (${minutes} min)` : "Inizia l'allenamento"}
          </button>
        </div>
      )}
    </section>
  )
}
