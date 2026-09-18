// Scheda Orale del foglio: una domanda alla volta, come all'esame. In alto le tessere numerate di tutte
// le domande del foglio (con lo spillo quelle della banca, con l'ultimo voto quelle già simulate), sotto
// la scheda d'orale (ExamCard). "Domanda a caso" preferisce quelle non ancora simulate.
// L'ancora "#exam:<id>" nell'indirizzo (dalla pagina Copertura o dal margine del foglio) apre quella domanda.
import { useEffect, useId, useState } from 'react'
import { BTN_SECONDARY, Icon } from '../../components/content/shared'
import { ExamCard } from '../../components/practice/ExamCard'
import { examHistory, formatNumber } from '../../components/practice/logic'
import { PracticeHeader, Reading } from '../../components/practice/parts'
import type { ModuleData } from '../../content/types'
import { progressKey, useProgress } from '../../store/progress'

/** Id DOM di una domanda d'orale: la stessa stringa della destinazione di copertura. */
const anchorOf = (id: string) => `exam:${id}`

/** I comandi di cornice non hanno uno stato spento: qui servono, agli estremi dell'elenco. */
const NAV_BTN = `${BTN_SECONDARY} disabled:cursor-not-allowed disabled:border-border disabled:text-faint disabled:hover:bg-transparent disabled:hover:text-faint`

const hashTarget = () => {
  try {
    return decodeURIComponent(window.location.hash.slice(1))
  } catch {
    return ''
  }
}

export default function TabOrale({ data }: { data: ModuleData }) {
  // la domanda aperta appartiene al foglio: cambiando modulo si riparte dalla prima
  return <OraleTab key={data.id} data={data} />
}

function OraleTab({ data }: { data: ModuleData }) {
  const headingId = useId()
  const navId = useId()
  const entries = useProgress((s) => s.exam)
  const [index, setIndex] = useState(() => Math.max(0, data.exam.findIndex((q) => anchorOf(q.id) === hashTarget())))

  useEffect(() => {
    const target = hashTarget()
    if (!target.startsWith('exam:')) return
    // scrollIntoView manca in jsdom e nei browser molto vecchi
    document.getElementById(target)?.scrollIntoView?.({ block: 'start' })
  }, [])

  const total = data.exam.length
  const histories = data.exam.map((q) => examHistory(entries, progressKey(data.id, q.id)))
  const simulated = histories.filter((h) => h.attempts > 0).length
  const fromBank = data.exam.filter((q) => q.fromBank).length
  const lasts: number[] = histories.flatMap((h) => (h.last === null ? [] : [h.last]))
  const mean = lasts.length > 0 ? lasts.reduce((a, b) => a + b, 0) / lasts.length : null

  function random() {
    const others = data.exam.map((_, i) => i).filter((i) => i !== current)
    if (others.length === 0) return
    const fresh = others.filter((i) => histories[i].attempts === 0)
    const pool = fresh.length > 0 ? fresh : others
    setIndex(pool[Math.floor(Math.random() * pool.length)])
  }

  const header = (
    <PracticeHeader
      id={headingId}
      title="Orale"
      en="oral exam"
      lead="Leggi la domanda, avvia il cronometro e rispondi ad alta voce; poi rivela la traccia, spunta i punti che hai toccato e datti un voto."
    >
      {total > 0 && (
        <>
          <Reading label="Domande" value={total} />
          <Reading label="Dalla banca" value={fromBank} />
          <Reading label="Simulate" value={`${simulated} su ${total}`} />
          {mean !== null && <Reading label="Media degli ultimi voti" value={`${formatNumber(Math.round(mean * 10) / 10)} su 3`} />}
        </>
      )}
    </PracticeHeader>
  )

  if (total === 0) {
    return (
      <section aria-labelledby={headingId} className="grid max-w-[64rem] gap-6">
        {header}
        <p className="m-0 border border-border bg-surface p-5 text-muted">Non ci sono ancora domande d'orale in questo foglio.</p>
      </section>
    )
  }

  const current = Math.min(index, total - 1)
  const question = data.exam[current]

  return (
    <section aria-labelledby={headingId} className="grid max-w-[64rem] gap-6">
      {header}

      <nav aria-labelledby={navId} className="grid gap-3">
        <p id={navId} className="label m-0 text-text">
          Domande d'orale del foglio
        </p>
        <ol className="m-0 flex list-none flex-wrap gap-3 p-0">
          {data.exam.map((q, i) => {
            const h = histories[i]
            const selected = i === current
            return (
              <li key={q.id}>
                <button
                  type="button"
                  aria-current={selected ? 'true' : undefined}
                  aria-label={`Domanda ${i + 1}${q.fromBank ? ', dalla banca' : ''}${h.last !== null ? `, ultimo voto ${h.last} su 3` : ', non ancora simulata'}`}
                  onClick={() => setIndex(i)}
                  className={
                    'relative grid size-11 cursor-pointer place-items-center border-2 border-border-strong transition-[background-color,color] duration-[var(--dur-fast)] ease-out ' +
                    (selected ? 'bg-accent text-accent-contrast' : 'bg-surface text-text hover:bg-surface-2')
                  }
                >
                  <span className="num">{i + 1}</span>
                  {/* spillo: domanda della banca */}
                  {q.fromBank && <span aria-hidden="true" className="absolute top-0.5 left-0.5 size-2 bg-pin outline outline-1 outline-border-strong" />}
                  {/* ultimo voto, timbrato nell'angolo */}
                  {h.last !== null && (
                    <span
                      aria-hidden="true"
                      className="num absolute -right-2 -bottom-2 grid size-5 place-items-center border border-border-strong bg-surface text-[length:var(--step--1)] leading-none text-text"
                    >
                      {h.last}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
        {/* legenda dei segni sulle tessere */}
        <p className="m-0 flex flex-wrap items-center gap-x-5 gap-y-1 text-[length:var(--step--1)] text-muted" aria-hidden="true">
          <span className="flex items-center gap-2">
            <span className="size-2 bg-pin outline outline-1 outline-border-strong" />
            dalla banca domande
          </span>
          <span className="flex items-center gap-2">
            <span className="num grid size-5 place-items-center border border-border-strong bg-surface leading-none text-text">2</span>
            ultimo voto, da 0 a 3
          </span>
        </p>
      </nav>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={NAV_BTN} disabled={current === 0} onClick={() => setIndex(current - 1)}>
          Domanda precedente
        </button>
        <button type="button" className={NAV_BTN} disabled={current === total - 1} onClick={() => setIndex(current + 1)}>
          Domanda successiva
          <Icon name="arrow" size={18} />
        </button>
        {total > 1 && (
          <button type="button" className={BTN_SECONDARY} onClick={random}>
            <Icon name="reset" size={18} />
            Domanda a caso
          </button>
        )}
      </div>

      {/* flusso a blocchi: nessun margine doppio intorno alla cornice (my-8) */}
      <div className="-my-8">
        <ExamCard key={question.id} question={question} moduleId={data.id} anchor={anchorOf(question.id)} number={current + 1} total={total} />
      </div>
    </section>
  )
}
