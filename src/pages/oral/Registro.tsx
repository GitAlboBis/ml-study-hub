// Registro delle simulazioni: quante domande della banca hai già provato per parte (direttamente o dal loro
// foglio) e le ultime simulazioni registrate con recordExam, anche quelle fatte dalla scheda Orale dei fogli,
// dalla più recente. Ogni riga dice quando, di quale foglio, quale domanda, il voto timbrato e il tempo.
import { Rich } from '../../components/content/Rich'
import { RegionSwatch } from '../../components/layout/marks'
import { formatClock } from '../../components/practice/logic'
import { StampMark } from '../../components/practice/parts'
import { BANK_PARTS } from '../../content/exam-bank'
import type { ModuleData } from '../../content/types'
import { REGIONS, sheetNumber } from '../../lib/atlas'
import type { ExamEntry } from '../../store/progress'
import { COURSE_OF_PART, describeKey } from './logic'
import type { ItemHistory, OralItem } from './logic'

const SHOWN = 10

const WHEN = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export interface RegistroProps {
  entries: readonly ExamEntry[]
  sheets: readonly ModuleData[]
  /** la banca intera, per contare le domande provate */
  bankPool: readonly OralItem[]
  stats: Map<string, ItemHistory>
}

export function Registro({ entries, sheets, bankPool, stats }: RegistroProps) {
  const recent = entries.slice(-SHOWN).reverse()
  return (
    <div className="grid gap-5">
      <dl className="m-0 flex flex-wrap gap-x-8 gap-y-3">
        {BANK_PARTS.map((part) => {
          const inPart = bankPool.filter((i) => i.bank?.part === part)
          const tried = inPart.filter((i) => (stats.get(i.bank?.id ?? '')?.attempts ?? 0) > 0).length
          return (
            <div key={part} className="grid gap-0.5">
              <dt className="label flex items-center gap-2">
                <RegionSwatch course={COURSE_OF_PART[part]} size={12} />
                {REGIONS[COURSE_OF_PART[part]].name}
              </dt>
              <dd className="num m-0 text-[length:var(--step-1)] leading-tight">
                {tried} <span className="text-[length:var(--step--1)] text-muted">di {inPart.length} domande della banca provate</span>
              </dd>
            </div>
          )
        })}
      </dl>

      {recent.length === 0 ? (
        <p className="m-0 max-w-[var(--measure)] border border-border bg-surface p-4 text-muted">
          Non hai ancora simulato nessuna domanda. Il voto che ti dai alla fine di ogni risposta finisce qui, con il tempo che hai impiegato.
        </p>
      ) : (
        <ol aria-label="Ultime simulazioni" className="m-0 grid list-none gap-0 p-0">
          {recent.map((e, i) => {
            const d = describeKey(e.key, sheets)
            return (
              <li
                key={`${e.key}-${e.at}-${i}`}
                className="-mt-px grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border border-border bg-surface px-3 py-2.5 @3xl:grid-cols-[9rem_minmax(0,1fr)_auto_4rem]"
              >
                <span className="num col-span-2 flex items-center gap-2 text-[length:var(--step--1)] text-muted @3xl:col-span-1">
                  {d.course && <RegionSwatch course={d.course} size={12} />}
                  {WHEN.format(e.at)}
                </span>
                <span className="min-w-0">
                  <span className="num mr-2 text-[length:var(--step--1)] text-muted">
                    {d.kind === 'banca' ? `Banca ${d.bank.id}` : `Foglio ${sheetNumber(d.moduleId) ?? '?'}`}
                  </span>
                  <span className="line-clamp-2">
                    <Rich text={d.text} inline />
                  </span>
                </span>
                <StampMark size="s" tone={e.score >= 2 ? 'ok' : e.score === 1 ? 'ink' : 'error'}>
                  {e.score} su 3
                </StampMark>
                <span className="num col-span-2 text-[length:var(--step--1)] text-muted @3xl:col-span-1 @3xl:text-right">
                  <span className="@3xl:hidden">tempo </span>
                  {e.seconds !== undefined ? formatClock(e.seconds) : '–'}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
