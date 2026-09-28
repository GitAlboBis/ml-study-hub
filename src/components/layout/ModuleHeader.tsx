// La testata del foglio (FIRST VIEWPORT del contratto): cornice a inchiostro con le tacche della squadratura,
// "FOGLIO 09" in extra condensato sul campo della regione, titolo italiano e inglese, coordinate del foglio
// (regione, capitolo, pagine delle fonti, tempo di studio) e stato del rilievo, che si cambia da qui.
// Funziona anche senza data.ts: titoli e fonti vengono dal manifest.
import { useId } from 'react'
import { Link } from 'react-router'
import type { ModuleManifestEntry } from '../../content/manifest'
import type { ModuleData } from '../../content/types'
import { formatRange, REGIONS, sheetNumber, STATUS_LABEL } from '../../lib/atlas'
import { MODULE_STATUSES, useProgress } from '../../store/progress'
import type { ModuleStatus } from '../../store/progress'
import { StatusMark } from './marks'
import { TICKS } from '../../pages/global/ui'


const EMPTY: string[] = []

export function ModuleHeader({ meta, data }: { meta: ModuleManifestEntry; data?: ModuleData }) {
  const number = sheetNumber(meta.id) ?? '··'
  const region = REGIONS[meta.course]
  const sources = data?.sources ?? meta.sources
  const status = useProgress((s) => s.modules[meta.id]?.status ?? 'da-iniziare')
  const read = useProgress((s) => s.modules[meta.id]?.sections ?? EMPTY).length
  const setStatus = useProgress((s) => s.setModuleStatus)
  const selectId = useId()

  return (
    <header className="@container grid grid-cols-1 border-2 border-border-strong bg-surface sm:grid-cols-[auto_minmax(0,1fr)]">
      {/* sul telefono il numero del foglio è una fascia in alto, così il titolo ha tutta la larghezza */}
      <p className={`${region.field} m-0 flex flex-row items-end justify-between gap-2 px-4 pt-2 pb-2 sm:row-span-2 sm:flex-col sm:items-stretch sm:px-3 @3xl:px-5`}>
        <span className="font-display text-[length:var(--step-0)] leading-none font-bold tracking-[0.24em] uppercase">Foglio</span>{' '}
        <span className="font-display text-[length:var(--step-5)] leading-[0.78] font-extrabold tracking-tight">{number}</span>
      </p>
      <div aria-hidden="true" className="h-2.5 border-b border-border-strong" style={TICKS} />

      <div className="grid min-w-0 gap-5 p-4 @3xl:grid-cols-[minmax(0,1fr)_minmax(15rem,auto)] @3xl:gap-8 @3xl:p-6">
        <div className="min-w-0 self-end">
          <h1 className="font-label text-[length:var(--step-3)] leading-[1.08] font-bold">{data?.title ?? meta.title}</h1>
          <p lang="en" className="m-0 mt-2 text-[length:var(--step-1)] leading-snug text-muted italic">
            {data?.titleEn ?? meta.titleEn}
          </p>
        </div>

        <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] content-start items-baseline gap-x-4 gap-y-2 border-t border-border pt-4 text-[length:var(--step--1)] @3xl:border-t-0 @3xl:border-l @3xl:pt-0 @3xl:pl-6">
          <dt className="label">Regione</dt>
          <dd className="m-0">{region.name}</dd>
          <dt className="label">Capitolo</dt>
          <dd className="m-0">{meta.chapter}</dd>
          <dt className="label">Fonti</dt>
          <dd className="m-0">
            <ul role="list" className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
              {sources.map((r) => (
                <li key={`${r.doc}-${r.pages[0]}`} className="m-0">
                  <Link to={`/fonti/${r.doc}/${r.pages[0]}`} className="num">
                    {formatRange(r)}
                  </Link>
                </li>
              ))}
            </ul>
          </dd>
          {data && (
            <>
              <dt className="label">Studio</dt>
              <dd className="num m-0">≈ {data.estimatedMinutes} min</dd>
            </>
          )}
          <dt className="label self-center">
            <label htmlFor={selectId}>Stato del rilievo</label>
          </dt>
          <dd className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-2">
              <StatusMark status={status} course={meta.course} size={18} />
              <select
                id={selectId}
                value={status}
                onChange={(e) => setStatus(meta.id, e.target.value as ModuleStatus)}
                className="min-h-10 cursor-pointer border border-border-strong bg-surface px-2 font-label font-semibold text-text"
              >
                {MODULE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </span>
            <span className="num text-muted">
              {read} {read === 1 ? 'sezione letta' : 'sezioni lette'}
            </span>
          </dd>
        </dl>
      </div>
    </header>
  )
}
