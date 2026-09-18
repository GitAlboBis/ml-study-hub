// Scheda Esercizi del foglio: un indice e, sotto, un riquadro per esercizio (ExerciseRunner), ognuno con
// l'id della sua destinazione di copertura ("exercise:<id>"), così la pagina Copertura e l'indice ci
// portano con un'ancora. Se l'indirizzo arriva già con l'ancora, il riquadro si porta in vista.
import { useEffect, useId } from 'react'
import { ExerciseRunner } from '../../components/practice/ExerciseRunner'
import { Difficulty, PracticeHeader, Reading } from '../../components/practice/parts'
import type { Exercise, ModuleData } from '../../content/types'

const KIND: Record<Exercise['kind'], string> = {
  numerico: 'Numerici',
  concettuale: 'Concettuali',
  dimostrazione: 'Dimostrazioni',
}

/** Id DOM di un esercizio: la stessa stringa della destinazione di copertura. */
const anchorOf = (id: string) => `exercise:${id}`

export default function TabEsercizi({ data }: { data: ModuleData }) {
  const headingId = useId()
  const indexId = useId()

  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (!hash.startsWith('exercise:')) return
    // scrollIntoView manca in jsdom e nei browser molto vecchi
    document.getElementById(hash)?.scrollIntoView?.({ block: 'start' })
  }, [data.id])

  const byKind = (Object.keys(KIND) as Exercise['kind'][])
    .map((k) => ({ kind: k, n: data.exercises.filter((e) => e.kind === k).length }))
    .filter((k) => k.n > 0)

  return (
    <section aria-labelledby={headingId} className="grid max-w-[64rem] gap-6">
      <PracticeHeader
        id={headingId}
        title="Esercizi"
        en="exercises"
        lead="Ogni esercizio genera numeri nuovi a ogni variante: risolvilo su carta, scrivi i risultati e controlla; se non torna, apri la soluzione passo per passo."
      >
        {data.exercises.length > 0 && (
          <>
            <Reading label="Esercizi" value={data.exercises.length} />
            {byKind.map((k) => (
              <Reading key={k.kind} label={KIND[k.kind]} value={k.n} />
            ))}
          </>
        )}
      </PracticeHeader>

      {data.exercises.length === 0 ? (
        <p className="m-0 border border-border bg-surface p-5 text-muted">Non ci sono ancora esercizi in questo foglio.</p>
      ) : (
        <>
          {data.exercises.length > 1 && (
            <nav aria-labelledby={indexId} className="grid gap-2">
              <p id={indexId} className="label m-0 text-text">
                Indice degli esercizi
              </p>
              <ol className="m-0 grid list-none gap-px border border-border-strong bg-border-strong p-0 sm:grid-cols-2">
                {data.exercises.map((e, i) => (
                  <li key={e.id} className="bg-surface">
                    <a
                      href={`#${anchorOf(e.id)}`}
                      className="flex min-h-11 items-center gap-3 px-3 py-2 text-text no-underline transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2"
                    >
                      <span className="num text-muted">{String(i + 1).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1">{e.title}</span>
                      <Difficulty value={e.difficulty} />
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {/* flusso a blocchi: i margini delle cornici (my-8) si fondono fra un esercizio e l'altro */}
          <div>
            {data.exercises.map((e, i) => (
              <ExerciseRunner key={`${data.id}:${e.id}`} exercise={e} anchor={anchorOf(e.id)} number={i + 1} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
