// Indice del foglio: i titoli h2 e h3 della nota illustrativa. Evidenzia la sezione in lettura (spillo ocra,
// aria-current="location") e la registra nei progressi con markSection: è così che il foglio passa a
// "rilievo in corso" e che lo spillo dell'atlante sa dove ti sei fermato. Le sezioni già lette hanno il
// tassello pieno. Da 1024 px di contenitore sta in una colonna fissa a sinistra; sotto si apre a comando.
import { useId, useState } from 'react'
import { useProgress } from '../../store/progress'
import { Icon } from '../content/shared'
import { useReadingSection } from './reading'
import type { TocHeading } from './reading'

const EMPTY: string[] = []

export function Toc({ moduleId, headings }: { moduleId: string; headings: TocHeading[] }) {
  const markSection = useProgress((s) => s.markSection)
  const read = useProgress((s) => s.modules[moduleId]?.sections ?? EMPTY)
  const active = useReadingSection(
    headings.map((h) => h.id),
    (slug) => markSection(moduleId, slug),
  )
  const [open, setOpen] = useState(false)
  const listId = useId()
  if (headings.length === 0) return null

  return (
    <nav
      aria-label="Indice del foglio"
      className="min-w-0 self-start border border-border-strong bg-surface @5xl:sticky @5xl:top-20 @5xl:max-h-[calc(100dvh-6rem)] @5xl:overflow-y-auto @5xl:border-0 @5xl:bg-transparent"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2 @5xl:hidden"
      >
        <Icon name="chevron" size={18} className={`transition-[rotate] duration-[var(--dur-fast)] ease-out ${open ? 'rotate-180' : ''}`} />
        <span className="label text-text">Indice del foglio</span>
        <span className="num ml-auto text-[length:var(--step--1)] text-muted">
          {read.filter((s) => headings.some((h) => h.id === s)).length}/{headings.length} lette
        </span>
      </button>
      <p className="label m-0 hidden pb-2 @5xl:block">Indice del foglio</p>
      <ol id={listId} className={`${open ? 'block' : 'hidden'} m-0 list-none border-t border-border p-0 @5xl:block @5xl:border-t-0 @5xl:border-l @5xl:border-border-strong`}>
        {headings.map((h) => {
          const current = h.id === active
          const done = read.includes(h.id)
          return (
            <li key={h.id} className="m-0">
              <a
                href={`#${h.id}`}
                aria-current={current ? 'location' : undefined}
                onClick={() => setOpen(false)}
                className={`flex min-h-10 items-start gap-2.5 py-2 pr-2 text-[length:var(--step--1)] leading-snug no-underline transition-[background-color] duration-[var(--dur-fast)] ease-out ${
                  h.level === 3 ? 'pl-7' : 'pl-3'
                } ${current ? 'bg-pin font-semibold text-pin-contrast' : 'text-text hover:bg-surface-2'}`}
              >
                <span aria-hidden="true" className={`mt-[0.3em] size-2.5 shrink-0 border border-current ${done ? 'bg-current' : ''}`} />
                <span className="min-w-0">
                  {h.text}
                  {done && <span className="visually-hidden"> (letta)</span>}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
