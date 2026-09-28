// Pezzi a vista condivisi dall'hub e dai giochi, nel mondo dell'atlante: il segno di ogni gioco (SVG a un
// tratto, come le icone del foglio), la barra del campo (regione e foglio), la testata dei risultati di
// una partita, il riquadro "non c'è ancora materiale" e la riga che dice da quale foglio viene una domanda.
//
// Connettori consultati: ui-layouts "drag-items" (Reorder di motion con maniglia e useDragControls, da cui
// viene la logica del riordino), Magic UI "animated list" e le carte a flip (tweet card, neon card): tutte
// con angoli tondi, ombre morbide e gradienti, quindi se ne tiene solo la meccanica e l'aspetto è riscritto
// con i token del foglio. Timer: nessun componente nei connettori, si usa il tempo misurato con Date.now().
import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { M } from '../../components/content/M'
import { BTN_PRIMARY, BTN_SECONDARY, HATCH, Icon } from '../../components/content/shared'
import { RegionSwatch } from '../../components/layout/marks'
import { RegionFilter } from '../../components/layout/RegionFilter'
import { StampMark } from '../../components/practice/parts'
import type { StampTone } from '../../components/practice/parts'
import { manifest } from '../../content/manifest'
import type { CourseId } from '../../content/types'
import { REGION_ORDER, REGIONS, sheetNumber } from '../../lib/atlas'
import type { GameSlug } from './catalog'
import { useFocusOnMount } from './kit'
import { scopeLabel, scopeSearch } from './pool'
import type { GameScope } from './pool'

// ---------------------------------------------------------------------------------------------
// Segni dei giochi
// ---------------------------------------------------------------------------------------------

const GLYPHS: Record<GameSlug, ReactNode> = {
  // due tessere del memory, una sfalsata
  'formula-match': (
    <>
      <path d="M3 5h12v16H3zM17 11h12v16H17z" />
      <path d="M6.5 13h5M20.5 17.5h5M20.5 20.5h5" />
    </>
  ),
  // una riga di formula con il pezzo coperto
  'completa-la-formula': (
    <>
      <path d="M3 16h6M23 16h6" />
      <path d="M12 9h8v14h-8z" strokeDasharray="3 2" />
      <path d="M14.5 13.5a1.8 1.8 0 1 1 2.6 1.6c-.7.4-1.1.9-1.1 1.7M16 19.5v.5" />
    </>
  ),
  // passaggi in fila e la freccia che li riordina
  'riordina-la-dimostrazione': <path d="M3 7h15M3 16h15M3 25h15M25 5v22M21 23l4 4 4-4M21 9l4-4 4 4" />,
  // cronometro dello sprint
  'vero-falso': (
    <>
      <path d="M12 3h8M16 3v4" />
      <path d="M16 7a10.5 10.5 0 1 1 0 21 10.5 10.5 0 0 1 0-21z" />
      <path d="M16 12v6l4 3" />
    </>
  ),
  // cartellino con il punto di domanda
  'chi-sono': (
    <>
      <path d="M4 4h24v19H13l-6 5v-5H4z" />
      <path d="M12.5 10.5a3.5 3.5 0 1 1 5.2 3c-1.2.7-1.7 1.4-1.7 2.8M16 19v.5" />
    </>
  ),
  // scalini: i livelli della palestra
  palestra: <path d="M3 28h8v-8h8v-8h10M25 4v8M21.5 7.5 25 4l3.5 3.5" />,
  // la carta in mano sopra tre contenitori
  'smista-i-concetti': (
    <>
      <path d="M12 3h8v10h-8zM16 13v4M13.5 15 16 17.5 18.5 15" />
      <path d="M3 20v8h7v-8M12.5 20v8h7v-8M22 20v8h7v-8" />
    </>
  ),
}

export function GameGlyph({ slug, size = 32 }: { slug: GameSlug; size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {GLYPHS[slug]}
    </svg>
  )
}

/** Maniglia di trascinamento: sei tasselli, come la legenda. */
export function Grip({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" focusable="false" className="shrink-0" fill="currentColor">
      {[4, 10, 16].map((y) => [7, 13].map((x) => <rect key={`${x}-${y}`} x={x - 1.5} y={y - 1.5} width="3" height="3" />))}
    </svg>
  )
}

/**
 * Una formula che si adatta alla larghezza della sua scatola (le tessere del memory sul telefono): se è più
 * larga la rimpicciolisce con `zoom`, che cambia anche l'ingombro, fino a `min`; oltre scorre in orizzontale.
 * Senza ResizeObserver (test) resta a grandezza piena.
 */
export function FitMath({ tex, id, min = 0.6 }: { tex: string; id?: string; min?: number }) {
  const box = useRef<HTMLSpanElement>(null)
  const inner = useRef<HTMLSpanElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const b = box.current
    const i = inner.current
    if (!b || !i || typeof ResizeObserver === 'undefined') return
    const fit = () => {
      // larghezza naturale: quella misurata divisa per lo zoom in atto
      const current = Number(i.style.zoom || 1)
      const natural = i.getBoundingClientRect().width / current
      const room = b.clientWidth
      const next = natural > room && room > 0 ? Math.max(min, Math.floor((room / natural) * 100) / 100) : 1
      if (next !== current) {
        i.style.zoom = String(next)
        setScale(next)
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(b)
    return () => ro.disconnect()
  }, [tex, min])

  return (
    <span ref={box} id={id} className={`block max-w-full ${scale <= min ? 'overflow-x-auto' : 'overflow-hidden'}`}>
      <span ref={inner} className="inline-block whitespace-nowrap">
        <M tex={tex} />
      </span>
    </span>
  )
}

// ---------------------------------------------------------------------------------------------
// Il campo: regione e foglio
// ---------------------------------------------------------------------------------------------

const SELECT = 'min-h-11 w-full cursor-pointer border border-border-strong bg-surface px-2 font-label font-semibold text-text'

interface ScopeBarProps {
  scope: GameScope
  onChange: (scope: GameScope) => void
  /** id dei fogli che hanno già i dati */
  ready: ReadonlySet<string>
}

/**
 * Dove si gioca. La regione è il filtro comune a tutte le pagine (RegionFilter: radio nativi, frecce per scegliere,
 * "Tutte le regioni" e i tasselli di legenda); il foglio è un menu con tutti i fogli dell'atlante, quelli non ancora
 * pronti visibili ma non sceglibili.
 */
export function ScopeBar({ scope, onChange, ready }: ScopeBarProps) {
  const uid = useId()
  const sheets = scope.course === 'tutti' ? manifest : manifest.filter((m) => m.course === scope.course)
  const readyHere = sheets.filter((m) => ready.has(m.id)).length
  const option = (m: (typeof manifest)[number]) => (
    <option key={m.id} value={m.id} disabled={!ready.has(m.id)}>
      {sheetNumber(m.id)} · {m.title}
      {ready.has(m.id) ? '' : ' (in preparazione)'}
    </option>
  )

  return (
    <div className="grid gap-4 border border-border-strong bg-surface p-4 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] @3xl:items-end">
      <RegionFilter
        id={`${uid}-regione`}
        value={scope.course === 'tutti' ? null : scope.course}
        onChange={(course) => onChange({ course: course ?? 'tutti', moduleId: null })}
      />
      <div className="grid gap-1.5">
        <label htmlFor={`${uid}-foglio`} className="label">
          Foglio
        </label>
        <select
          id={`${uid}-foglio`}
          className={SELECT}
          value={scope.moduleId ?? ''}
          onChange={(e) => {
            const id = e.target.value
            const meta = manifest.find((m) => m.id === id)
            onChange(meta ? { course: meta.course, moduleId: meta.id } : { course: scope.course, moduleId: null })
          }}
        >
          <option value="">{scope.course === 'tutti' ? 'Tutti i fogli' : `Tutti i fogli di ${REGIONS[scope.course].name}`}</option>
          {scope.course === 'tutti'
            ? REGION_ORDER.map((c) => (
                <optgroup key={c} label={REGIONS[c].name}>
                  {manifest.filter((m) => m.course === c).map(option)}
                </optgroup>
              ))
            : sheets.map(option)}
        </select>
      </div>
      <p className="m-0 flex flex-wrap items-center gap-x-2 text-[length:var(--step--1)] text-muted @3xl:col-span-2" aria-live="polite">
        {scope.course !== 'tutti' && <RegionSwatch course={scope.course as CourseId} />}
        <span>
          Campo: <strong className="font-semibold text-text">{scopeLabel(scope)}</strong>
        </span>
        {!scope.moduleId && (
          <span className="num">
            · fogli pronti {readyHere} di {sheets.length}
          </span>
        )}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Stati della pagina
// ---------------------------------------------------------------------------------------------

/** Caricamento dei fogli: tratteggio del terreno non ancora rilevato, niente spinner. */
export function LoadingSheets() {
  return (
    <div role="status" className={`grid min-h-40 place-items-center border border-border bg-surface ${HATCH}`}>
      <p className="label m-0 bg-surface px-3 py-1 text-text">Apro i fogli…</p>
    </div>
  )
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-4 border border-border bg-error-bg p-4">
      <Icon name="cross" className="text-error" />
      <p className="m-0 flex-1">Non sono riuscito a leggere i fogli dell'atlante. Di solito basta riprovare.</p>
      <button type="button" className={BTN_SECONDARY} onClick={onRetry}>
        <Icon name="reset" size={18} />
        Riprova
      </button>
    </div>
  )
}

/**
 * Il gioco non ha abbastanza materiale nel campo scelto: si dice perché, e dove si può giocare adesso.
 * Tratteggio del terreno non rilevato, come i fogli in preparazione nel quadro d'unione.
 */
export function NotEnough({ reason, scope, onWiden }: { reason: string; scope: GameScope; onWiden: (scope: GameScope) => void }) {
  const wider: GameScope | null = scope.moduleId ? { course: scope.course, moduleId: null } : scope.course !== 'tutti' ? { course: 'tutti', moduleId: null } : null
  return (
    <section aria-labelledby="poco-materiale" className="relative border border-border-strong bg-surface">
      <div aria-hidden="true" className={`h-3 border-b border-border-strong ${HATCH}`} />
      <div className="grid gap-3 p-5 @3xl:p-6">
        <h2 id="poco-materiale" className="m-0 font-label text-[length:var(--step-2)] leading-tight font-bold">
          Qui non c'è ancora abbastanza materiale
        </h2>
        <p className="m-0 max-w-[var(--measure)]">{reason}</p>
        <p className="m-0 max-w-[var(--measure)] text-muted">I fogli arrivano uno alla volta: questo gioco si accende da solo quando ci sono.</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {wider && (
            <button type="button" className={BTN_PRIMARY} onClick={() => onWiden(wider)}>
              Gioca su {wider.course === 'tutti' ? "tutto l'atlante" : `tutta la regione ${REGIONS[wider.course].name}`}
              <Icon name="arrow" size={18} />
            </button>
          )}
          <Link to={`/giochi${scopeSearch(scope)}`} className={`${BTN_SECONDARY} no-underline`}>
            Scegli un altro gioco
          </Link>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Partita
// ---------------------------------------------------------------------------------------------

/** La riga delle letture di una partita: punteggio, tempo, mosse. Le cifre in mono. */
export function Hud({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-3 border-y border-border-strong py-3">
      {children}
      {actions && <div className="ml-auto flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/** Da quale foglio viene una domanda: numero e titolo, con il collegamento alla scheda giusta. */
export function FromSheet({ moduleId, tab }: { moduleId: string; tab?: string }) {
  const meta = manifest.find((m) => m.id === moduleId)
  if (!meta) return null
  return (
    // sta da sola in una riga: bersaglio alto almeno 40 px
    <Link to={`/m/${meta.id}${tab ? `/${tab}` : ''}`} className="inline-flex min-h-10 items-center gap-x-1 text-[length:var(--step--1)]">
      <span className="num">Foglio {sheetNumber(meta.id)}</span> · {meta.title}
    </Link>
  )
}

interface EndPanelProps {
  title: string
  /** il timbro accanto al titolo */
  stamp: ReactNode
  tone?: StampTone
  /** le letture finali (Stat) */
  stats: ReactNode
  /** ripasso: errori, formule della partita */
  children?: ReactNode
  onAgain: () => void
  againLabel?: string
  /** altre azioni fra "Gioca ancora" e "Tutti i giochi" */
  extra?: ReactNode
  scope: GameScope
}

/**
 * Fine partita: titolo con il timbro dell'esito, letture, ripasso e le azioni. Il titolo prende il fuoco
 * quando la testata compare, così chi usa la tastiera o un lettore di schermo sa che la partita è finita.
 */
export function EndPanel({ title, stamp, tone = 'ink', stats, children, onAgain, againLabel = 'Gioca ancora', extra, scope }: EndPanelProps) {
  const id = useId()
  const heading = useFocusOnMount<HTMLHeadingElement>()
  return (
    <section aria-labelledby={id} className="border-2 border-border-strong bg-surface">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border-strong p-4 @3xl:px-6">
        <h2 id={id} ref={heading} tabIndex={-1} className="m-0 font-label text-[length:var(--step-3)] leading-tight font-bold">
          {title}
        </h2>
        <StampMark tone={tone}>{stamp}</StampMark>
      </header>
      <div className="flex flex-wrap gap-x-10 gap-y-4 p-4 @3xl:px-6">{stats}</div>
      {/* traccia minmax(0,1fr): le formule del ripasso scorrono nella loro riga invece di allargare la cornice */}
      {children !== undefined && <div className="grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-border p-4 @3xl:p-6">{children}</div>}
      <div className="flex flex-wrap gap-3 border-t border-border-strong p-4 @3xl:px-6">
        <button type="button" className={BTN_PRIMARY} onClick={onAgain}>
          <Icon name="reset" size={18} />
          {againLabel}
        </button>
        {extra}
        <Link to={`/giochi${scopeSearch(scope)}`} className={`${BTN_SECONDARY} no-underline`}>
          Tutti i giochi
        </Link>
      </div>
    </section>
  )
}

/** Esito di una risposta: icona ed etichetta di stato, mai solo colore. */
export function Verdict({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <p className={`m-0 flex items-center gap-3 border border-border p-3 font-bold ${ok ? 'bg-ok-bg' : 'bg-error-bg'}`}>
      <Icon name={ok ? 'check' : 'cross'} className={ok ? 'text-ok' : 'text-error'} />
      <span>{children}</span>
    </p>
  )
}

/** Sottotitolo a etichetta dentro il ripasso di fine partita. */
export function ReviewTitle({ children }: { children: ReactNode }) {
  return <h3 className="label m-0 text-text">{children}</h3>
}
