// L'indice dell'atlante: i 50 fogli raggruppati per regione (corso) e capitolo, con il numero del foglio,
// lo stato del rilievo letto dai progressi e lo spillo sul foglio in cui ti sei fermato. Ogni regione si
// comprime e porta alla sua pagina. In testa la copertina, la mappa e le pagine sul campo e di consultazione;
// in fondo il registro (progressi, copertura, impostazioni) e la legenda. Lo stesso indice sta nella colonna
// a sinistra da 1024 px e nel cassetto su schermi stretti.
// Dai connettori (21st.dev "sidebar nav group", Aceternity sidebar) nessun codice preso: dipendono da
// Radix o da motion per il solo aprire e chiudere; qui basta un pulsante con aria-expanded e l'attributo hidden.
import { useEffect, useId, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import type { CourseId } from '../../content/types'
import { chaptersOf, lastStop, REGION_ORDER, REGIONS, STATUS_LABEL } from '../../lib/atlas'
import type { Chapter as ChapterData } from '../../lib/atlas'
import { MODULE_STATUSES, useProgress } from '../../store/progress'
import type { ModuleProgress } from '../../store/progress'
import { Icon } from '../content/shared'
import { DESTINATIONS, GROUP_LABEL, inGroup } from './destinations'
import type { DestinationGroup } from './destinations'
import { NavGlyph, PinMark, RegionSwatch, StatusMark } from './marks'

const ROW =
  'flex min-h-10 items-center gap-2 px-4 py-1.5 text-[length:var(--step--1)] leading-snug no-underline transition-[background-color] duration-[var(--dur-fast)] ease-out'
/** Lo stato di un collegamento dell'indice: lo spillo ocra segna dove sei. */
const rowState = ({ isActive }: { isActive: boolean }) => (isActive ? 'bg-pin text-pin-contrast' : 'text-text hover:bg-surface-2')

interface ListProps {
  modules: Record<string, ModuleProgress>
  pinned: string | null
  onNavigate?: () => void
}

function Region({ course, modules, pinned, onNavigate }: ListProps & { course: CourseId }) {
  const [open, setOpen] = useState(true)
  const panelId = useId()
  const region = REGIONS[course]
  const chapters = chaptersOf(course)
  const sheets = chapters.flatMap((c) => c.sheets)
  const surveyed = sheets.filter((s) => modules[s.meta.id]?.status === 'completato').length

  return (
    <section className="border-t border-border-strong">
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
          className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2"
        >
          <RegionSwatch course={course} />
          <span className="font-display text-[length:var(--step-1)] leading-none font-extrabold tracking-wide uppercase">{region.name}</span>
          <span className="num ml-auto text-[length:var(--step--1)] text-muted">
            <span className="visually-hidden">fogli</span> {sheets[0].number}–{sheets.at(-1)?.number}
          </span>
          <Icon name="chevron" size={18} className={`transition-[rotate] duration-[var(--dur-fast)] ease-out ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      <div id={panelId} hidden={!open} className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-x-2 pr-2 pl-4">
          <p className="num m-0 text-[length:var(--step--1)] text-muted">
            {surveyed} di {sheets.length} rilevati
          </p>
          <NavLink
            to={`/corso/${course}`}
            onClick={onNavigate}
            className={({ isActive }) =>
              `inline-flex min-h-10 items-center gap-1.5 px-2 font-label text-[length:var(--step--1)] font-semibold no-underline transition-[background-color] duration-[var(--dur-fast)] ease-out ${
                isActive ? 'bg-pin text-pin-contrast' : 'text-link hover:bg-surface-2'
              }`
            }
          >
            Apri la regione <span className="visually-hidden">{region.name}</span>
            <Icon name="arrow" size={16} />
          </NavLink>
        </div>
        {chapters.map((ch) => (
          <Chapter key={ch.chapter} chapter={ch} course={course} modules={modules} pinned={pinned} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  )
}

function Chapter({ chapter, course, modules, pinned, onNavigate }: ListProps & { chapter: ChapterData; course: CourseId }) {
  const titleId = useId()
  return (
    <div className="mt-2">
      <h3 id={titleId} className="label m-0 px-4 pt-2 pb-1 text-[length:var(--step--1)] tracking-[0.06em]">
        {chapter.chapter}
      </h3>
      <ul role="list" aria-labelledby={titleId} className="m-0 list-none p-0">
        {chapter.sheets.map(({ meta, number }) => {
          const status = modules[meta.id]?.status ?? 'da-iniziare'
          const here = pinned === meta.id
          return (
            <li key={meta.id} className="m-0">
              <NavLink
                to={`/m/${meta.id}`}
                onClick={onNavigate}
                className={(s) => `${ROW} ${rowState(s)}`}
              >
                {({ isActive }) => (
                  <>
                    <span className={`num w-6 shrink-0 ${isActive ? '' : 'text-muted'}`}>
                      <span className="visually-hidden">Foglio</span> {number}
                    </span>{' '}
                    <span className="min-w-0 flex-1">{meta.title}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {here && <PinMark />}
                      <StatusMark status={status} course={course} />
                    </span>
                    <span className="visually-hidden">
                      , {STATUS_LABEL[status]}
                      {here ? ', ti sei fermato qui' : ''}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Un gruppo di pagine globali: titolo in etichetta e due colonne di collegamenti con il loro glifo. */
function PageGroup({ group, onNavigate }: { group: Exclude<DestinationGroup, 'atlante'>; onNavigate?: () => void }) {
  const titleId = useId()
  return (
    <div className="mt-3">
      <h2 id={titleId} className="label m-0 px-4 pb-1 text-[length:var(--step--1)] tracking-[0.06em]">
        {GROUP_LABEL[group]}
      </h2>
      <ul role="list" aria-labelledby={titleId} className="m-0 grid list-none grid-cols-2 p-0">
        {inGroup(group).map((d) => (
          <li key={d.to} className="m-0 min-w-0">
            <NavLink to={d.to} onClick={onNavigate} className={(s) => `${ROW} ${rowState(s)}`}>
              <NavGlyph d={d.glyph} size={18} />
              <span className="min-w-0">{d.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

const MAP = DESTINATIONS.find((d) => d.to === '/mappa')!

/** `onNavigate`: chi contiene l'indice (il cassetto) si chiude quando scegli una destinazione. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const modules = useProgress((s) => s.modules)
  const pinned = lastStop(modules)?.moduleId ?? null
  const nav = useRef<HTMLElement>(null)
  const { pathname } = useLocation()

  // il foglio aperto resta in vista nella colonna (o nel cassetto) che scorre: senza toccare lo scorrimento della pagina
  useEffect(() => {
    const box = nav.current?.parentElement
    const link = nav.current?.querySelector<HTMLElement>('a[aria-current="page"]')
    if (!box || !link || box.scrollHeight <= box.clientHeight) return
    const top = link.offsetTop
    if (top < box.scrollTop || top + link.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = top - box.clientHeight / 3
  }, [pathname])

  return (
    <nav ref={nav} aria-label="Indice dell'atlante" className="pb-6">
      <p className="label m-0 px-4 pt-4 pb-2">Indice dell'atlante</p>
      <ul role="list" className="m-0 list-none p-0">
        <li className="m-0">
          <NavLink to="/" end onClick={onNavigate} className={(s) => `${ROW} font-label font-semibold ${rowState(s)}`}>
            <Icon name="page" size={18} />
            Copertina
          </NavLink>
        </li>
        <li className="m-0">
          <NavLink to={MAP.to} onClick={onNavigate} className={(s) => `${ROW} font-label font-semibold ${rowState(s)}`}>
            <NavGlyph d={MAP.glyph} size={18} />
            {MAP.label}
          </NavLink>
        </li>
      </ul>
      <div className="pb-4">
        <PageGroup group="campo" onNavigate={onNavigate} />
        <PageGroup group="consultazione" onNavigate={onNavigate} />
      </div>
      {REGION_ORDER.map((course) => (
        <Region key={course} course={course} modules={modules} pinned={pinned} onNavigate={onNavigate} />
      ))}
      <div className="border-t border-border-strong pt-1 pb-4">
        <PageGroup group="registro" onNavigate={onNavigate} />
      </div>
      <div className="border-t border-border-strong px-4 pt-4">
        <p className="label m-0">Legenda</p>
        <ul role="list" className="m-0 mt-2 grid list-none gap-1.5 p-0 text-[length:var(--step--1)] text-muted">
          {MODULE_STATUSES.map((s) => (
            <li key={s} className="m-0 flex items-center gap-2">
              <StatusMark status={s} className="text-text" />
              {STATUS_LABEL[s]}
            </li>
          ))}
          <li className="m-0 flex items-center gap-2">
            <PinMark />
            Ti sei fermato qui
          </li>
        </ul>
      </div>
    </nav>
  )
}
