// Quadro della banca: le domande reali d'esame come tasselli di un quadro d'unione, una fascia per parte.
// Ogni tassello porta tre informazioni, mai affidate al solo colore: la parte (fascia e tinta), se la domanda
// ha già il suo foglio con la risposta modello (il tratteggio segna i fogli in preparazione) e il tuo ultimo
// voto (la tinta sale di un quarto per punto, e la cifra è scritta nel nome accessibile).
// Il quadro è un solo punto di tabulazione: le frecce spostano la scelta (tabindex mobile), Inizio e Fine
// vanno agli estremi. Sotto, la scheda della domanda scelta con "Prova questa domanda".
import { useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { BTN_PRIMARY, Disclosure, HATCH, Icon } from '../../components/content/shared'
import { Rich } from '../../components/content/Rich'
import { PinMark, RegionSwatch } from '../../components/layout/marks'
import { Stat } from '../../components/practice/parts'
import { BANK_PARTS } from '../../content/exam-bank'
import type { BankPart } from '../../content/exam-bank'
import { getModuleMeta } from '../../content/manifest'
import { hasModule } from '../../content/registry'
import { REGIONS, sheetNumber } from '../../lib/atlas'
import { COURSE_OF_PART, PART_WHAT } from './logic'
import type { ItemHistory, OralItem } from './logic'

const FILL = ['h-1/4', 'h-2/4', 'h-3/4', 'h-full'] as const
const NEVER: ItemHistory = { attempts: 0, last: null, lastAt: 0 }

/** "mel-14a" → "14a": il numero del resoconto nella fonte. */
const tileLabel = (id: string) => id.slice(id.indexOf('-') + 1)

/** Il nome della parte è quello della regione ("Ricci", non "Deep Learning"), come nel resto dell'atlante. */
const partName = (part: BankPart) => REGIONS[COURSE_OF_PART[part]].name

export interface BankBoardProps {
  /** la banca intera (modalità banca, parte mista), nell'ordine della banca */
  pool: OralItem[]
  stats: Map<string, ItemHistory>
  onTry: (item: OralItem) => void
}

export function BankBoard({ pool, stats, onTry }: BankBoardProps) {
  const items = pool.filter((i) => i.bank !== undefined)
  const [selected, setSelected] = useState(0)
  const detailId = useId()
  const tiles = useRef<(HTMLButtonElement | null)[]>([])
  const current = items[Math.min(selected, items.length - 1)]

  function move(to: number) {
    const i = Math.max(0, Math.min(items.length - 1, to))
    setSelected(i)
    tiles.current[i]?.focus()
  }

  /** La riga sopra o sotto: il tassello più vicino in orizzontale nella riga adiacente (se il layout è misurabile). */
  function vertical(from: number, dir: 1 | -1): number {
    const here = tiles.current[from]?.getBoundingClientRect()
    if (!here || here.height === 0) return from + dir
    let best = -1
    let bestScore = Infinity
    tiles.current.forEach((el, i) => {
      if (!el || i === from) return
      const r = el.getBoundingClientRect()
      const dy = (r.top - here.top) * dir
      if (dy < here.height / 2) return
      const score = dy * 1000 + Math.abs(r.left - here.left)
      if (score < bestScore) {
        bestScore = score
        best = i
      }
    })
    return best === -1 ? from : best
  }

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const to =
      e.key === 'ArrowRight' ? i + 1
      : e.key === 'ArrowLeft' ? i - 1
      : e.key === 'ArrowDown' ? vertical(i, 1)
      : e.key === 'ArrowUp' ? vertical(i, -1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? items.length - 1
      : null
    if (to === null) return
    e.preventDefault()
    move(to)
  }

  if (!current?.bank) return null
  const bank = current.bank
  const h = stats.get(bank.id) ?? NEVER
  const region = REGIONS[current.course]

  return (
    <div className="grid gap-6">
      <div role="group" aria-label="Quadro della banca" className="grid gap-5">
        {BANK_PARTS.map((part) => {
          const course = COURSE_OF_PART[part]
          const partItems = items.map((item, index) => ({ item, index })).filter(({ item }) => item.bank?.part === part)
          const tried = partItems.filter(({ item }) => (stats.get(item.bank?.id ?? '')?.attempts ?? 0) > 0).length
          return (
            <div key={part} className="grid gap-2">
              <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1">
                <RegionSwatch course={course} />
                <span className="label text-text">{partName(part)}</span>
                <span className="text-[length:var(--step--1)] text-muted">{PART_WHAT[course]}</span>
                <span className="num text-[length:var(--step--1)] text-muted">
                  {tried} di {partItems.length} provate
                </span>
              </p>
              <div className="flex flex-wrap pt-px pl-px">
                {partItems.map(({ item, index }) => {
                  const b = item.bank
                  if (!b) return null
                  const hist = stats.get(b.id) ?? NEVER
                  const isSelected = index === selected
                  const full = hist.last === 3
                  return (
                    <button
                      key={b.id}
                      ref={(el) => {
                        tiles.current[index] = el
                      }}
                      type="button"
                      tabIndex={isSelected ? 0 : -1}
                      aria-pressed={isSelected}
                      aria-label={`${b.id}, ${partName(part)}: ${item.sheet ? 'con risposta modello' : 'foglio in preparazione'}, ${hist.last === null ? 'mai provata' : `ultimo voto ${hist.last} su 3`}`}
                      onClick={() => setSelected(index)}
                      onKeyDown={(e) => onKey(e, index)}
                      className={
                        '-mt-px -ml-px relative block size-10 shrink-0 cursor-pointer overflow-hidden border-border-strong outline-offset-2 transition-[background-color] duration-[var(--dur-fast)] ease-out focus-visible:z-10 ' +
                        `${isSelected ? 'z-10 border-2' : 'border'} ${item.sheet ? 'bg-surface hover:bg-surface-2' : 'bg-bg'}`
                      }
                    >
                      {!item.sheet && <span aria-hidden="true" className={`absolute inset-0 ${HATCH}`} />}
                      <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 ${REGIONS[course].fill} ${hist.last === null ? 'h-1' : FILL[hist.last]}`} />
                      <span
                        aria-hidden="true"
                        className={`num absolute top-0.5 left-0.5 px-0.5 text-[0.6875rem] leading-none ${full ? REGIONS[course].ink : item.sheet ? 'bg-surface text-text' : 'bg-bg text-muted'}`}
                      >
                        {tileLabel(b.id)}
                      </span>
                      {isSelected && (
                        <span aria-hidden="true" className="absolute right-0.5 bottom-0.5">
                          <PinMark size={12} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        <p className="m-0 flex flex-wrap items-center gap-x-5 gap-y-2 text-[length:var(--step--1)] text-muted" aria-hidden="true">
          <span className="flex items-center gap-2">
            <span className={`relative size-5 border border-border-strong bg-bg ${HATCH}`} />
            foglio in preparazione
          </span>
          <span className="flex items-center gap-2">
            <span className="relative size-5 overflow-hidden border border-border-strong bg-surface">
              <span className="absolute inset-x-0 bottom-0 h-3/4 bg-muted" />
            </span>
            la tinta sale con l'ultimo voto
          </span>
          <span className="flex items-center gap-2">
            <PinMark size={16} />
            domanda scelta
          </span>
        </p>
      </div>

      {/* la domanda scelta. Non è una regione live: la scelta la dice già il nome del tassello a fuoco, e
          annunciarla anche qui la farebbe sentire due volte a ogni freccia */}
      <article aria-labelledby={detailId} className="grid gap-4 border-2 border-border-strong bg-surface p-4 @3xl:p-6">
        <p id={detailId} className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span aria-hidden="true" className={`size-3 border border-border-strong ${region.fill}`} />
          <span className="label text-text">Domanda {bank.id}</span>
          <span className="label">{bank.prof === 'Assistant' ? 'Assistente' : bank.prof}</span>
          <span className="num text-[length:var(--step--1)] text-muted">banca · p. {bank.page}</span>
        </p>
        <Rich text={bank.textIt} className="font-label text-[length:var(--step-1)] leading-snug font-bold" />
        <p className="m-0 flex items-baseline gap-2 text-muted">
          <span className="label" aria-hidden="true">
            EN
          </span>
          <span lang="en" className="italic">
            {bank.textEn}
          </span>
        </p>
        <Disclosure
          className="border border-border"
          summary={<span className="label text-text">Resoconto originale della banca (EN, testuale)</span>}
          panelClassName="border-t border-border p-4"
        >
          <p lang="en" className="m-0 max-w-[var(--measure)] italic">
            {bank.text}
          </p>
        </Disclosure>
        {bank.note && (
          <p className="m-0 flex items-start gap-2 text-[length:var(--step--1)] text-muted">
            <Icon name="info" size={18} />
            <span>{bank.note}</span>
          </p>
        )}
        <div className="grid gap-2">
          <p className="label m-0">Fogli in cui sta la risposta</p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {bank.moduleIds.map((id) => {
              const meta = getModuleMeta(id)
              if (!meta) return null
              const ready = hasModule(id)
              const face = (
                <>
                  <RegionSwatch course={meta.course} size={12} />
                  <span className="num">{sheetNumber(id)}</span>
                  <span className="min-w-0">{meta.title}</span>
                </>
              )
              return (
                <li key={id}>
                  {ready ? (
                    <Link to={`/m/${id}`} title={meta.title} className="flex min-h-10 items-center gap-2 border border-border-strong bg-surface px-2.5 py-1 text-[length:var(--step--1)] leading-snug text-text no-underline hover:bg-surface-2">
                      {face}
                    </Link>
                  ) : (
                    <span title={`${meta.title}: in preparazione`} className={`flex min-h-10 items-center gap-2 border border-border bg-bg px-2.5 py-1 text-[length:var(--step--1)] leading-snug text-muted ${HATCH}`}>
                      {face}
                      <span className="visually-hidden">, in preparazione</span>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3 border-t border-border pt-4">
          <Stat label="Tentativi" value={h.attempts} />
          <Stat label="Ultimo voto" value={h.last === null ? '–' : `${h.last} su 3`} />
          <button type="button" className={`${BTN_PRIMARY} ml-auto`} onClick={() => onTry(current)}>
            Prova questa domanda
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </article>
    </div>
  )
}
