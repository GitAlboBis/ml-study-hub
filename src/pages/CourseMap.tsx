// Il quadro d'unione (/mappa): i 50 fogli dell'atlante come grafo. Nodi = fogli (campo della regione con il numero,
// stato del rilievo dai progressi, tratteggio se il foglio è in preparazione, spillo dove ti sei fermato); archi =
// prerequisiti e collegamenti dei data.ts dei fogli pronti più l'ordine di studio dentro ogni capitolo.
// Layout deterministico per regione e capitolo (src/lib/courseMap.ts), nessuna fisica. Zoom e spostamento con
// rotella, trascinamento (anche a due dita), tasti + − 0 e frecce; passare o mettere a fuoco un foglio accende i suoi
// vicini e apre il cartiglio del foglio; clic o Invio aprono il foglio. Filtro per regione nell'indirizzo (?regione=).
// Sotto i 48rem il grafo diventa un elenco per capitoli con i collegamenti; su schermo largo l'elenco si sceglie (?vista=elenco).
// Dai connettori nessun componente preso: Magic UI e ui-layouts non hanno grafi con zoom e spostamento (solo "Animated
// Beam", un fascio luminoso decorativo, e "Lens", una lente per immagini); la logica è scritta qui, sui token del mondo.
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { FocusEvent, KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BTN_TOGGLE, HATCH } from '../components/content/shared'
import { PinMark, RegionSwatch, StatusMark } from '../components/layout/marks'
import { RegionFilter } from '../components/layout/RegionFilter'
import { manifest } from '../content/manifest'
import type { ModuleManifestEntry } from '../content/manifest'
import { hasModule } from '../content/registry'
import type { CourseId } from '../content/types'
import { chapterLabel, chapterName, chaptersOf, lastStop, REGION_ORDER, REGIONS, STATUS_LABEL } from '../lib/atlas'
import { buildEdges, edgePath, fitCamera, layoutAtlas, neighborsOf, orthoRoute, panBy, relationsOf, revealBox, roundedPath, ZOOM, zoomAt } from '../lib/courseMap'
import type { Box, Camera, EdgeKind, GraphEdge, GraphLayout, GraphNode, Relations, Size } from '../lib/courseMap'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { useSheetsData } from '../lib/useSheetsData'
import { MODULE_STATUSES, useProgress } from '../store/progress'
import type { ModuleProgress, ModuleStatus } from '../store/progress'
import { HEAD_READINGS, PAGE_SUBTITLE, PAGE_TITLE, TICKS } from './global/ui'

// ---------------------------------------------------------------------------------------------
// Lessico
// ---------------------------------------------------------------------------------------------

const byId = new Map(manifest.map((m) => [m.id, m]))
const numberOf = new Map(manifest.map((m, i) => [m.id, String(i + 1).padStart(2, '0')]))
const isCourse = (v: string | null): v is CourseId => v !== null && (REGION_ORDER as readonly string[]).includes(v)
/** Primo e ultimo foglio di ogni regione, per la legenda. */
const RANGE = Object.fromEntries(
  REGION_ORDER.map((c) => {
    const sheets = chaptersOf(c).flatMap((ch) => ch.sheets)
    return [c, `${sheets[0]?.number ?? ''}–${sheets.at(-1)?.number ?? ''}`]
  }),
) as Record<CourseId, string>

const EDGE_KINDS: readonly EdgeKind[] = ['sequenza', 'prerequisito', 'collegamento']
const EDGE_LABEL: Record<EdgeKind, { it: string; en: string }> = {
  sequenza: { it: 'Ordine di studio', en: 'study order' },
  prerequisito: { it: 'Prerequisito', en: 'prerequisite' },
  collegamento: { it: 'Collegamento', en: 'connection' },
}

/** Tratto di ogni tipo di arco: inchiostro pieno con freccia per i prerequisiti, tratteggio per i collegamenti. */
const EDGE_STROKE: Record<EdgeKind, { stroke: string; width: number; dash?: string }> = {
  sequenza: { stroke: 'var(--text-faint)', width: 1.5 },
  collegamento: { stroke: 'var(--text-muted)', width: 1.5, dash: '6 5' },
  prerequisito: { stroke: 'var(--text)', width: 1.75 },
}


/** "il foglio 08" / "i fogli 03, 04". */
const sheetsPhrase = (ids: string[], one: string, many: string) =>
  ids.length === 1 ? `${one} ${numberOf.get(ids[0])}` : `${many} ${ids.map((id) => numberOf.get(id)).join(', ')}`

/** Il nome di un foglio per i lettori di schermo: numero, titolo, regione, stato; con `rel` anche i collegamenti. */
function describeSheet(meta: ModuleManifestEntry, ready: boolean, status: ModuleStatus, here: boolean, rel?: Relations): string {
  const parts = [`Foglio ${numberOf.get(meta.id)} · ${meta.title}. ${REGIONS[meta.course].name}, ${chapterLabel(meta.chapter)}`]
  parts.push(ready ? `pronto, ${STATUS_LABEL[status]}` : status === 'da-iniziare' ? 'in preparazione' : `in preparazione, ${STATUS_LABEL[status]}`)
  if (here) parts.push('ti sei fermato qui')
  if (rel?.requires.length) parts.push(`richiede ${sheetsPhrase(rel.requires.map((r) => r.id), 'il foglio', 'i fogli')}`)
  if (rel?.unlocks.length) parts.push(`serve per ${sheetsPhrase(rel.unlocks.map((r) => r.id), 'il foglio', 'i fogli')}`)
  if (rel?.related.length) parts.push(`collegato ${sheetsPhrase(rel.related.map((r) => r.id), 'al foglio', 'ai fogli')}`)
  return parts.join('; ')
}

function useMediaQuery(query: string, fallback: boolean): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener?.('change', notify)
      return () => mql.removeEventListener?.('change', notify)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : fallback),
    () => fallback,
  )
}

// ---------------------------------------------------------------------------------------------
// Segni piccoli
// ---------------------------------------------------------------------------------------------

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  )
}

/** Il campione del terreno non ancora rilevato: tratteggio su carta, come nei fogli in preparazione. */
function HatchSwatch({ size = 'size-4' }: { size?: string }) {
  return <span aria-hidden="true" className={`inline-block ${size} shrink-0 border border-border-strong bg-bg ${HATCH}`} />
}

/**
 * Il campione di un tipo di arco nel suo tasto della legenda. Prende il colore del tasto (currentColor): inchiostro
 * sullo spillo quando è premuto, grigio del testo quando no, leggibile nei due temi. Nel quadro i tre tipi hanno anche
 * tinte diverse, ma fra loro troppo vicine per fare da legenda: qui si distinguono per il disegno (pieno sottile, pieno
 * con la freccia, tratteggio), lo stesso degli archi.
 */
function EdgeSample({ kind }: { kind: EdgeKind }) {
  const s = EDGE_STROKE[kind]
  return (
    <svg viewBox="0 0 36 12" width="36" height="12" aria-hidden="true" focusable="false" className="shrink-0">
      <path d="M2 6H30" fill="none" stroke="currentColor" strokeWidth={s.width + 0.5} strokeDasharray={s.dash} />
      {kind === 'prerequisito' && <path d="M27 1.5L35 6L27 10.5z" fill="currentColor" />}
    </svg>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="num border border-border-strong bg-surface px-1.5 text-[length:var(--step--1)] text-text">{children}</kbd>
}

/** Un foglio citato (cartiglio, elenco): il numero sul campo della sua regione. */
function NumberChip({ id }: { id: string }) {
  const meta = byId.get(id)
  if (!meta) return null
  return <span className={`num inline-grid min-w-8 place-items-center px-1 text-[length:var(--step--1)] leading-6 ${REGIONS[meta.course].field}`}>{numberOf.get(id)}</span>
}

// ---------------------------------------------------------------------------------------------
// Legenda
// ---------------------------------------------------------------------------------------------

interface LegendProps {
  edges?: { kinds: Record<EdgeKind, boolean>; counts: Record<EdgeKind, number>; onToggle: (kind: EdgeKind) => void }
}

function Legend({ edges }: LegendProps) {
  const edgesId = useId()
  return (
    <div className={`mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 border-t-2 border-border-strong pt-4 ${edges ? '@3xl:grid-cols-[auto_auto_minmax(0,1fr)]' : '@3xl:grid-cols-[auto_minmax(0,1fr)]'} @3xl:gap-10`}>
      <div>
        <p className="label m-0">Regioni</p>
        <ul role="list" className="m-0 mt-2 flex list-none flex-wrap gap-x-5 gap-y-1.5 p-0 text-[length:var(--step--1)] @3xl:grid @3xl:gap-x-0">
          {REGION_ORDER.map((c) => (
            <li key={c} className="m-0 flex items-center gap-2">
              <RegionSwatch course={c} />
              {REGIONS[c].name}
              <span className="num text-muted">{RANGE[c]}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="label m-0">Stato del rilievo</p>
        <ul role="list" className="m-0 mt-2 grid list-none grid-cols-2 gap-x-4 gap-y-1.5 p-0 text-[length:var(--step--1)] @md:gap-x-6">
          {MODULE_STATUSES.map((s) => (
            <li key={s} className="m-0 flex items-center gap-2">
              <StatusMark status={s} className="text-text" />
              {STATUS_LABEL[s]}
            </li>
          ))}
          <li className="m-0 flex items-center gap-2">
            <HatchSwatch />
            In preparazione
          </li>
          <li className="m-0 flex items-center gap-2">
            <PinMark />
            Ti sei fermato qui
          </li>
        </ul>
      </div>
      {edges && (
        <div role="group" aria-labelledby={edgesId}>
          <p id={edgesId} className="label m-0">
            Archi da mostrare
          </p>
          <div className="mt-2 grid gap-2 @md:grid-cols-3 @3xl:grid-cols-1 @5xl:grid-cols-3">
            {EDGE_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={edges.kinds[k]}
                onClick={() => edges.onToggle(k)}
                className={`${BTN_TOGGLE} justify-start text-left normal-case tracking-normal`}
              >
                <EdgeSample kind={k} />
                <span>
                  {EDGE_LABEL[k].it}{' '}
                  <span lang="en" className="italic">
                    ({EDGE_LABEL[k].en})
                  </span>
                </span>
                <span className="num ml-auto">{edges.counts[k]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Il grafo
// ---------------------------------------------------------------------------------------------

/** Vista di riserva finché il contenitore non è misurato (e in jsdom, dove non si misura). */
const FALLBACK_VIEW: Size = { w: 960, h: 600 }
/**
 * Sotto questo zoom i titoli sarebbero illeggibili: il nodo mostra solo numero, regione e stato. Il titolo è a 14 px
 * del mondo (le etichette dei capitoli anche): 12/14 li tiene ad almeno 12 px reali sullo schermo.
 */
const FAR = 12 / 14
/** Gli archi dei dati (prerequisiti, collegamenti) a riposo: sotto l'ordine di studio, ripassati dal foglio acceso. */
const DATA_EDGE_REST = 0.4

/** La corsia di un arco nel suo corridoio (−2…2), fissa per arco: archi paralleli restano distinti. */
function laneOf(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return (h % 5) - 2
}
const ZOOM_IN = 'M12 5v14M5 12h14'
const ZOOM_OUT = 'M5 12h14'
const FIT = 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5'

type NodeState = 'idle' | 'active' | 'near' | 'dim' | 'out'

const NODE_STATE: Record<NodeState, string> = {
  idle: '',
  active: 'z-10 shadow-[0_0_0_4px_var(--pin)]',
  near: 'shadow-[0_0_0_2px_var(--border-strong)]',
  dim: 'opacity-35',
  out: 'opacity-20',
}

interface MapNodeProps {
  node: GraphNode
  meta: ModuleManifestEntry
  ready: boolean
  status: ModuleStatus
  here: boolean
  state: NodeState
  label: string
  onEnter: (id: string) => void
  onLeave: (id: string) => void
  onFocusNode: (node: GraphNode, e: FocusEvent<HTMLAnchorElement>) => void
  onBlurNode: (id: string) => void
}

function MapNode({ node, meta, ready, status, here, state, label, onEnter, onLeave, onFocusNode, onBlurNode }: MapNodeProps) {
  const region = REGIONS[node.course]
  return (
    <Link
      to={`/m/${node.id}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      inert={state === 'out'}
      data-sheet={node.id}
      data-state={state}
      onPointerEnter={() => onEnter(node.id)}
      onPointerLeave={() => onLeave(node.id)}
      onFocus={(e) => onFocusNode(node, e)}
      onBlur={() => onBlurNode(node.id)}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      className={`absolute grid grid-cols-[2.75rem_minmax(0,1fr)] border border-border-strong text-text no-underline transition-[opacity,box-shadow,background-color] duration-[var(--dur-fast)] ease-out ${
        ready ? 'bg-surface hover:bg-surface-2' : 'bg-bg'
      } ${NODE_STATE[state]}`}
    >
      <span aria-hidden="true" className={`${region.field} grid content-between justify-items-center py-1.5`}>
        <span className="font-display text-[1.6rem] leading-none font-extrabold group-data-[lod=far]/world:text-[2.5rem]">{node.number}</span>
        {status !== 'da-iniziare' && (
          <span className="bg-surface p-px text-text">
            <StatusMark status={status} course={node.course} size={14} className="group-data-[lod=far]/world:size-6" />
          </span>
        )}
      </span>
      <span aria-hidden="true" className="relative min-w-0 overflow-hidden px-2 py-1.5">
        {!ready && <span className={`absolute inset-0 ${HATCH}`} />}
        <span className="relative line-clamp-3 font-label text-[0.875rem] leading-[1.12] font-semibold group-data-[lod=far]/world:invisible">
          {/* sul tratteggio il titolo porta un alone di carta, come i toponimi sulle carte */}
          <span className={ready ? '' : 'bg-bg text-muted [box-decoration-break:clone]'}>{meta.title}</span>
        </span>
      </span>
      {here && (
        <span aria-hidden="true" className="absolute -top-3 -right-3">
          <PinMark size={22} />
        </span>
      )}
      <span className="visually-hidden">{label}</span>
    </Link>
  )
}

function Arrow({ id }: { id: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M0 0L10 5L0 10z" fill="var(--text)" />
    </marker>
  )
}

/** Il cartiglio del foglio acceso: sta nell'angolo opposto al foglio, così non lo copre. */
function Cartouche({ node, ready, status, rel, side }: { node: GraphNode; ready: boolean; status: ModuleStatus; rel: Relations; side: 'left' | 'right' }) {
  const meta = byId.get(node.id)!
  const rows: [string, string[]][] = [
    ['Richiede', rel.requires.map((r) => r.id)],
    ['Serve per', rel.unlocks.map((r) => r.id)],
    ['Collegato a', rel.related.map((r) => r.id)],
  ]
  return (
    <div
      data-testid="cartiglio"
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 w-[min(21rem,calc(100%-1.5rem))] border-2 border-border-strong bg-surface p-4 shadow-2 ${side === 'left' ? 'top-3 left-3' : 'top-16 right-3'}`}
    >
      <p className="label m-0 flex items-center gap-2 text-text">
        <RegionSwatch course={node.course} />
        Foglio <span className="num">{node.number}</span> · {REGIONS[node.course].name}
      </p>
      <p className="m-0 mt-2 font-label text-[length:var(--step-1)] leading-snug font-bold">{meta.title}</p>
      <p lang="en" className="m-0 mt-1 text-[length:var(--step--1)] leading-snug text-muted italic">
        {meta.titleEn}
      </p>
      <p className="m-0 mt-2 text-[length:var(--step--1)] text-muted">
        {chapterLabel(meta.chapter)}{' '}
        <span lang="en" className="italic">
          {chapterName(meta.chapter).en}
        </span>
      </p>
      <p className="m-0 mt-3 flex items-center gap-2 text-[length:var(--step--1)]">
        {ready ? <StatusMark status={status} course={node.course} /> : <HatchSwatch />}
        {ready ? STATUS_LABEL[status] : 'In preparazione'}
      </p>
      {rows.some(([, ids]) => ids.length > 0) && (
        <dl className="m-0 mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1.5 border-t border-border pt-3 text-[length:var(--step--1)]">
          {rows
            .filter(([, ids]) => ids.length > 0)
            .map(([label, ids]) => (
              <div key={label} className="contents">
                <dt className="label leading-6">{label}</dt>
                <dd className="m-0 flex flex-wrap gap-1">
                  {ids.map((id) => (
                    <NumberChip key={id} id={id} />
                  ))}
                </dd>
              </div>
            ))}
        </dl>
      )}
    </div>
  )
}

interface GraphProps {
  layout: GraphLayout
  edges: readonly GraphEdge[]
  relations: Map<string, Relations>
  kinds: Record<EdgeKind, boolean>
  filter: CourseId | null
  modules: Record<string, ModuleProgress>
  ready: ReadonlySet<string>
  pinned: string | null
}

function AtlasGraph({ layout, edges, relations, kinds, filter, modules, ready, pinned }: GraphProps) {
  const canvas = useRef<HTMLDivElement>(null)
  const view = useRef<Size>(FALLBACK_VIEW)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const hintId = useId()

  // il riquadro da inquadrare: tutto il quadro o la fascia della regione scelta
  const target = useMemo<Box>(() => {
    const band = filter ? layout.regions.find((r) => r.course === filter) : undefined
    return band ? { x: band.x, y: band.y, w: band.w, h: band.h } : { x: 0, y: 0, w: layout.width, h: layout.height }
  }, [layout, filter])

  const [cam, setCam] = useState<Camera>(() => fitCamera(target, FALLBACK_VIEW))
  const camRef = useRef(cam)
  const [animate, setAnimate] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  // larghezza della vista per il render (il cartiglio sceglie il lato); gli handler leggono view.current
  const [viewW, setViewW] = useState(FALLBACK_VIEW.w)
  const active = hover ?? focused
  // la camera si riadatta da sola alla vista finché non la sposti tu
  const userMoved = useRef(false)

  useLayoutEffect(() => {
    camRef.current = cam
  }, [cam])

  // cambiando regione la camera vola sulla fascia scelta (con riduci movimento ci arriva e basta)
  const targetRef = useRef(target)
  useLayoutEffect(() => {
    if (targetRef.current === target) return
    targetRef.current = target
    userMoved.current = false
    setAnimate(true)
    setCam(fitCamera(target, view.current))
  }, [target])

  // misura della vista, alla prima apertura e a ogni ridimensionamento
  useLayoutEffect(() => {
    const el = canvas.current
    if (!el) return
    const measure = () => {
      if (el.clientWidth <= 0 || el.clientHeight <= 0) return
      view.current = { w: el.clientWidth, h: el.clientHeight }
      setViewW(el.clientWidth)
    }
    measure()
    setCam(fitCamera(targetRef.current, view.current))
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      measure()
      if (userMoved.current) return
      setAnimate(false)
      setCam(fitCamera(targetRef.current, view.current))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const move = useCallback((next: (c: Camera) => Camera, animated = false) => {
    userMoved.current = true
    setAnimate(animated)
    setCam(next)
  }, [])

  const fit = useCallback((animated: boolean) => {
    userMoved.current = false
    setAnimate(animated)
    setCam(fitCamera(targetRef.current, view.current))
  }, [])

  const zoomBy = (factor: number, animated: boolean) => move((c) => zoomAt(c, factor, view.current.w / 2, view.current.h / 2), animated)

  // rotella: zoom attorno al cursore (il pizzico del trackpad arriva come rotella con Ctrl, a passi piccoli)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? view.current.h : 1
      const factor = Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.01 : 0.0015))
      move((c) => zoomAt(c, factor, e.clientX - r.left, e.clientY - r.top))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [move])

  // trascinamento con un dito o col mouse, pizzico con due dita. Il trascinamento parte oltre 4 px:
  // sotto quella soglia un clic su un foglio resta un clic e apre il foglio.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ x: number; y: number; cam: Camera; moved: boolean; dist: number } | null>(null)
  const suppressClick = useRef(false)

  const local = (x: number, y: number) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: x - r.left, y: y - r.top }
  }
  const restartGesture = (moved: boolean) => {
    const pts = [...pointers.current.values()]
    if (pts.length === 0) return
    const [a, b] = pts
    gesture.current = b
      ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, cam: camRef.current, moved: true, dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) }
      : { x: a.x, y: a.y, cam: camRef.current, moved, dist: 0 }
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size > 1) e.currentTarget.setPointerCapture?.(e.pointerId)
    restartGesture(false)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return
    const pts = [...pointers.current.values()]
    if (pts.length > 1 && g.dist > 0) {
      const [a, b] = pts
      const mid = local((a.x + b.x) / 2, (a.y + b.y) / 2)
      const start = local(g.x, g.y)
      const factor = Math.hypot(a.x - b.x, a.y - b.y) / g.dist
      move(() => zoomAt(panBy(g.cam, mid.x - start.x, mid.y - start.y), factor, mid.x, mid.y))
      return
    }
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (!g.moved && Math.hypot(dx, dy) < 4) return
    if (!g.moved) {
      g.moved = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
      setDragging(true)
    }
    move(() => panBy(g.cam, dx, dy))
  }
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return
    if (pointers.current.size > 0) {
      restartGesture(true)
      return
    }
    if (gesture.current?.moved) {
      // il clic che segue il rilascio non deve aprire il foglio sotto il cursore
      suppressClick.current = true
      setTimeout(() => (suppressClick.current = false), 0)
    }
    gesture.current = null
    setDragging(false)
  }

  // tastiera: nessuna animazione, la risposta è immediata
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const step = e.shiftKey ? 240 : 80
    const pan: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
    if (e.key in pan) move((c) => panBy(c, ...pan[e.key]))
    else if (e.key === '+' || e.key === '=') zoomBy(ZOOM.step, false)
    else if (e.key === '-' || e.key === '_') zoomBy(1 / ZOOM.step, false)
    else if (e.key === '0') fit(false)
    else return
    e.preventDefault()
  }

  const onEnter = useCallback((id: string) => setHover(id), [])
  const onLeave = useCallback((id: string) => setHover((h) => (h === id ? null : h)), [])
  const onBlurNode = useCallback((id: string) => setFocused((f) => (f === id ? null : f)), [])
  // un foglio raggiunto con Tab entra nella vista: la camera lo segue senza animazione
  const onFocusNode = useCallback((node: GraphNode, e: FocusEvent<HTMLAnchorElement>) => {
    setFocused(node.id)
    let keyboard = true
    try {
      keyboard = e.currentTarget.matches(':focus-visible')
    } catch {
      // selettore non supportato: si segue comunque
    }
    if (!keyboard) return
    setAnimate(false)
    setCam((c) => revealBox(c, node, view.current))
  }, [])

  const inFilter = useCallback((course: CourseId) => filter === null || filter === course, [filter])
  const nodeById = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout])
  const visible = useMemo(
    () => edges.filter((e) => kinds[e.kind] && nodeById.has(e.from) && nodeById.has(e.to) && (inFilter(nodeById.get(e.from)!.course) || inFilter(nodeById.get(e.to)!.course))),
    [edges, kinds, nodeById, inFilter],
  )

  const world = useMemo(() => {
    const near = active ? neighborsOf(active, visible) : null
    const touches = (e: GraphEdge) => active !== null && (e.from === active || e.to === active)
    const stateOf = (n: GraphNode): NodeState =>
      !inFilter(n.course) ? 'out' : active === null ? 'idle' : n.id === active ? 'active' : near?.has(n.id) ? 'near' : 'dim'
    // gli archi dei dati fra fogli della stessa riga di capitoli corrono a gomiti nei corridoi; gli altri restano curve
    const path = (e: GraphEdge) => {
      const a = nodeById.get(e.from)!
      const b = nodeById.get(e.to)!
      const route = e.kind === 'sequenza' ? null : orthoRoute(a, b, laneOf(e.id))
      return route ? roundedPath(route) : edgePath(a, b)
    }

    return (
      <>
        <svg aria-hidden="true" width={layout.width} height={layout.height} className="absolute inset-0 max-w-none overflow-visible">
          <defs>
            {/* reticolo del quadro: la carta millimetrata del rilievo */}
            <pattern id={`${uid}-grid`} width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M80 0H0V80" fill="none" stroke="var(--viz-grid)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </pattern>
            <Arrow id={`${uid}-arrow`} />
          </defs>
          <rect width={layout.width} height={layout.height} fill={`url(#${uid}-grid)`} />
          {visible
            .filter((e) => !touches(e))
            .map((e) => {
              const s = EDGE_STROKE[e.kind]
              return (
                <path
                  key={e.id}
                  data-edge={e.id}
                  data-edge-kind={e.kind}
                  d={path(e)}
                  fill="none"
                  stroke={s.stroke}
                  strokeWidth={s.width}
                  strokeDasharray={s.dash}
                  markerEnd={e.kind === 'prerequisito' ? `url(#${uid}-arrow)` : undefined}
                  opacity={active ? 0.15 : e.kind === 'sequenza' ? 1 : DATA_EDGE_REST}
                  className="transition-opacity duration-[var(--dur-fast)] ease-out"
                />
              )
            })}
        </svg>

        {layout.regions.map((r) => (
          <div
            key={r.course}
            aria-hidden="true"
            style={{ left: r.x, top: r.y, width: r.w, height: layout.tabHeight }}
            className={`absolute flex items-stretch border-b-2 border-border-strong transition-opacity duration-[var(--dur-fast)] ease-out ${inFilter(r.course) ? '' : 'opacity-20'}`}
          >
            <p className={`${REGIONS[r.course].field} m-0 flex items-center gap-3 px-3`}>
              <span className="font-display text-[2.25rem] leading-none font-extrabold tracking-wide uppercase group-data-[lod=far]/world:text-[3.4rem]">{REGIONS[r.course].name}</span>
              <span className="num text-[0.875rem] group-data-[lod=far]/world:text-[1.5rem]">
                {r.first}–{r.last}
              </span>
            </p>
          </div>
        ))}
        {layout.chapters.map((c) => (
          <p
            key={`${c.course}-${c.chapter}`}
            aria-hidden="true"
            style={{ left: c.x, top: c.y, width: c.w, height: c.h }}
            className={`label absolute m-0 line-clamp-2 pt-1.5 text-[0.875rem] leading-[1.2] text-text transition-opacity duration-[var(--dur-fast)] ease-out group-data-[lod=far]/world:invisible ${inFilter(c.course) ? '' : 'opacity-20'}`}
          >
            {chapterLabel(c.chapter)}
          </p>
        ))}

        {layout.nodes.map((n) => {
          const meta = byId.get(n.id)!
          const status = modules[n.id]?.status ?? 'da-iniziare'
          const isReady = ready.has(n.id)
          const here = pinned === n.id
          return (
            <MapNode
              key={n.id}
              node={n}
              meta={meta}
              ready={isReady}
              status={status}
              here={here}
              state={stateOf(n)}
              label={describeSheet(meta, isReady, status, here, relations.get(n.id))}
              onEnter={onEnter}
              onLeave={onLeave}
              onFocusNode={onFocusNode}
              onBlurNode={onBlurNode}
            />
          )
        })}

        {/* gli archi del foglio acceso passano sopra i fogli, ripassati con l'evidenziatore ocra dello spillo */}
        <svg aria-hidden="true" width={layout.width} height={layout.height} className="pointer-events-none absolute inset-0 z-10 max-w-none overflow-visible">
          <defs>
            <Arrow id={`${uid}-arrow-on`} />
          </defs>
          {visible.filter(touches).map((e) => {
            const s = EDGE_STROKE[e.kind]
            const d = path(e)
            return (
              <g key={e.id} data-edge-on={e.id}>
                <path d={d} fill="none" stroke="var(--pin)" strokeWidth="6" strokeLinecap="round" opacity="0.45" />
                <path
                  d={d}
                  fill="none"
                  stroke={e.kind === 'sequenza' ? 'var(--text-muted)' : 'var(--text)'}
                  strokeWidth={s.width + 0.75}
                  strokeDasharray={s.dash}
                  markerEnd={e.kind === 'prerequisito' ? `url(#${uid}-arrow-on)` : undefined}
                />
              </g>
            )
          })}
        </svg>
      </>
    )
  }, [layout, visible, active, inFilter, nodeById, uid, modules, ready, pinned, relations, onEnter, onLeave, onFocusNode, onBlurNode])

  const activeNode = active ? nodeById.get(active) : undefined
  const side = activeNode && (activeNode.x + activeNode.w / 2) * cam.k + cam.x > viewW / 2 ? 'left' : 'right'
  const percent = Math.round(cam.k * 100)
  const btn =
    'grid size-10 cursor-pointer place-items-center text-text transition-[background-color,color] duration-[var(--dur-fast)] ease-out hover:bg-accent hover:text-accent-contrast disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text'

  return (
    <section aria-labelledby={`${uid}-titolo`} className="mt-4">
      <h2 id={`${uid}-titolo`} className="visually-hidden">
        Grafo dei fogli
      </h2>
      <div className="relative border-2 border-border-strong">
        <div
          ref={canvas}
          tabIndex={0}
          role="group"
          aria-roledescription="mappa"
          aria-label="Grafo dei fogli"
          aria-describedby={hintId}
          data-drag={dragging}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onClickCapture={(e) => {
            if (!suppressClick.current) return
            e.preventDefault()
            e.stopPropagation()
          }}
          onKeyDown={onKeyDown}
          className="relative h-[clamp(24rem,calc(100dvh-9rem),56rem)] cursor-grab touch-none overflow-clip bg-bg outline-offset-[-6px] select-none data-[drag=true]:cursor-grabbing"
        >
          <div
            data-world=""
            data-lod={cam.k < FAR ? 'far' : 'near'}
            onTransitionEnd={(e) => e.target === e.currentTarget && setAnimate(false)}
            style={{ width: layout.width, height: layout.height, transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.k})` }}
            className={`group/world absolute top-0 left-0 origin-top-left ${animate ? 'transition-[transform] duration-[var(--dur-slow)] ease-[var(--ease-in-out)]' : ''} ${dragging ? 'will-change-transform' : ''}`}
          >
            {world}
          </div>
        </div>

        {activeNode && (
          <Cartouche
            node={activeNode}
            ready={ready.has(activeNode.id)}
            status={modules[activeNode.id]?.status ?? 'da-iniziare'}
            rel={relations.get(activeNode.id) ?? { requires: [], unlocks: [], related: [] }}
            side={side === 'left' ? 'left' : 'right'}
          />
        )}

        {/* comandi dello zoom in alto a destra: restano nel primo schermo anche quando il quadro è più alto della finestra */}
        <div className="absolute top-3 right-3 z-20 flex border border-border-strong bg-surface shadow-1">
          <button type="button" aria-label="Riduci" title="Riduci (−)" disabled={cam.k <= ZOOM.min} onClick={() => zoomBy(1 / ZOOM.step, true)} className={btn}>
            <Glyph d={ZOOM_OUT} />
          </button>
          <output aria-label="Zoom" className="num grid w-14 place-items-center border-x border-border-strong text-[length:var(--step--1)] text-text">
            {percent}%
          </output>
          <button type="button" aria-label="Ingrandisci" title="Ingrandisci (+)" disabled={cam.k >= ZOOM.max} onClick={() => zoomBy(ZOOM.step, true)} className={btn}>
            <Glyph d={ZOOM_IN} />
          </button>
          <button type="button" aria-label="Tutto il quadro in vista" title="Tutto il quadro in vista (0)" onClick={() => fit(true)} className={`${btn} border-l border-border-strong`}>
            <Glyph d={FIT} />
          </button>
        </div>
      </div>
      <p id={hintId} className="m-0 mt-3 max-w-[var(--measure)] text-[length:var(--step--1)] leading-relaxed text-muted">
        Trascina o usa le frecce per spostarti; rotella, <Kbd>+</Kbd> e <Kbd>−</Kbd> per lo zoom; <Kbd>0</Kbd> rimette tutto in vista. Passa su un foglio per accendere i suoi
        collegamenti; clic o <Kbd>Invio</Kbd> lo aprono.
      </p>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// L'elenco (schermi stretti, o per scelta)
// ---------------------------------------------------------------------------------------------

function RelatedLinks({ rel }: { rel: Relations }) {
  const rows: [string, string[]][] = [
    ['Richiede', rel.requires.map((r) => r.id)],
    ['Serve per', rel.unlocks.map((r) => r.id)],
    ['Collegato a', rel.related.map((r) => r.id)],
  ]
  const shown = rows.filter(([, ids]) => ids.length > 0)
  if (shown.length === 0) return null
  // una riga di numeri sul campo della regione ("Richiede 03 · Serve per 09 10"): con cinquanta fogli una fila di
  // titoli a tutta larghezza per ogni relazione allungava l'elenco a decine di migliaia di pixel. Il titolo resta nel
  // nome accessibile e nel suggerimento; il foglio citato sta comunque più su o più giù nello stesso elenco.
  return (
    <dl className="m-0 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border px-3 py-1.5 text-[length:var(--step--1)]">
      {shown.map(([label, ids]) => (
        <div key={label} className="flex flex-wrap items-center gap-x-2">
          <dt className="label">{label}</dt>
          <dd className="m-0">
            <ul role="list" className="m-0 flex list-none flex-wrap gap-1 p-0">
              {ids.map((id) => {
                const meta = byId.get(id)!
                const name = `Foglio ${numberOf.get(id)} · ${meta.title}`
                return (
                  <li key={id} className="m-0">
                    <Link
                      to={`/m/${id}`}
                      aria-label={name}
                      title={name}
                      className={`num grid min-h-10 min-w-10 place-items-center border border-border-strong px-1 no-underline hover:underline ${REGIONS[meta.course].field}`}
                    >
                      {numberOf.get(id)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  )
}

interface ListProps {
  filter: CourseId | null
  modules: Record<string, ModuleProgress>
  ready: ReadonlySet<string>
  pinned: string | null
  relations: Map<string, Relations>
}

function SheetList({ filter, modules, ready, pinned, relations }: ListProps) {
  const uid = useId()
  const courses = filter ? [filter] : REGION_ORDER
  return (
    <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-14">
      {courses.map((course) => {
        const region = REGIONS[course]
        const chapters = chaptersOf(course)
        const sheets = chapters.flatMap((c) => c.sheets)
        return (
          <section key={course} aria-labelledby={`${uid}-${course}`}>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t-2 border-border-strong pt-3">
              <h2 id={`${uid}-${course}`} className="m-0 flex items-center gap-3">
                <span className={`${region.field} px-2.5 pt-1.5 pb-1 font-display text-[length:var(--step-3)] leading-none font-extrabold tracking-wide uppercase`}>{region.name}</span>
                <span className="num text-[length:var(--step--1)] font-normal text-muted">
                  <span className="visually-hidden">fogli</span> {sheets[0]?.number}–{sheets.at(-1)?.number}
                </span>
              </h2>
              <Link to={`/corso/${course}`} className="inline-flex min-h-10 items-center">
                La regione {region.name}
              </Link>
            </div>
            {chapters.map((ch) => (
              <div key={ch.chapter} className="mt-6">
                <h3 id={`${uid}-${course}-${ch.sheets[0].number}`} className="m-0 font-label text-[length:var(--step-1)] leading-tight font-bold">
                  {chapterLabel(ch.chapter)}{' '}
                  <span lang="en" className="font-body text-[length:var(--step--1)] font-normal text-muted italic">
                    {chapterName(ch.chapter).en}
                  </span>
                </h3>
                <ol role="list" aria-label={`Fogli di ${chapterLabel(ch.chapter)}`} className="m-0 mt-2 list-none p-0 pt-px">
                  {ch.sheets.map(({ meta, number }) => {
                    const status = modules[meta.id]?.status ?? 'da-iniziare'
                    const isReady = ready.has(meta.id)
                    const here = pinned === meta.id
                    return (
                      <li key={meta.id} data-sheet={meta.id} className={`m-0 -mt-px border border-border-strong ${isReady ? 'bg-surface' : 'bg-bg'}`}>
                        <Link
                          to={`/m/${meta.id}`}
                          className={`grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-stretch text-text no-underline transition-[background-color] duration-[var(--dur-fast)] ease-out ${isReady ? 'hover:bg-surface-2' : 'hover:bg-surface'}`}
                        >
                          <span aria-hidden="true" className={`${region.field} grid w-14 place-items-center font-display text-[length:var(--step-2)] leading-none font-extrabold`}>
                            {number}
                          </span>
                          <span aria-hidden="true" className="grid content-center gap-0.5 px-3 py-2">
                            <span className={`font-label leading-snug font-bold ${isReady ? '' : 'text-muted'}`}>{meta.title}</span>
                            <span lang="en" className="text-[length:var(--step--1)] leading-snug text-muted italic">
                              {meta.titleEn}
                            </span>
                          </span>
                          <span aria-hidden="true" className="flex items-center gap-1.5 px-3">
                            {here && <PinMark size={18} />}
                            {isReady ? <StatusMark status={status} course={course} size={18} /> : <HatchSwatch size="size-[18px]" />}
                          </span>
                          <span className="visually-hidden">{describeSheet(meta, isReady, status, here)}</span>
                        </Link>
                        <RelatedLinks rel={relations.get(meta.id) ?? { requires: [], unlocks: [], related: [] }} />
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------------------------

export default function CourseMap() {
  useDocumentTitle("Quadro d'unione")
  const [params, setParams] = useSearchParams()
  const regionParam = params.get('regione')
  const filter = isCourse(regionParam) ? regionParam : null
  const wide = useMediaQuery('(min-width: 48rem)', true)
  const view = wide && params.get('vista') !== 'elenco' ? 'grafo' : 'elenco'
  const regionLabel = useId()
  const viewLabel = useId()

  const modules = useProgress((s) => s.modules)
  const pinned = lastStop(modules)?.moduleId ?? null
  const layout = useMemo(() => layoutAtlas(), [])
  const readyIds = useMemo(() => manifest.map((m) => m.id).filter(hasModule), [])
  const ready = useMemo(() => new Set(readyIds), [readyIds])
  const { data, loading, failed } = useSheetsData(readyIds)
  const edges = useMemo(() => buildEdges(manifest, data), [data])
  const relations = useMemo(() => new Map(manifest.map((m) => [m.id, relationsOf(m.id, edges)])), [edges])
  const [kinds, setKinds] = useState<Record<EdgeKind, boolean>>({ sequenza: true, prerequisito: true, collegamento: true })
  const counts = useMemo(() => {
    const c: Record<EdgeKind, number> = { sequenza: 0, prerequisito: 0, collegamento: 0 }
    for (const e of edges) c[e.kind] += 1
    return c
  }, [edges])

  const setParam = (name: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === null) next.delete(name)
        else next.set(name, value)
        return next
      },
      { replace: true },
    )

  const surveyed = manifest.filter((m) => modules[m.id]?.status === 'completato').length
  const scope = filter ? manifest.filter((m) => m.course === filter) : manifest
  const scopeReady = scope.filter((m) => ready.has(m.id)).length
  const status =
    `${filter ? REGIONS[filter].name : 'Tutte le regioni'}: ${scope.length} fogli, ${scopeReady} ${scopeReady === 1 ? 'pronto' : 'pronti'}.` +
    (loading
      ? ' Leggo i collegamenti dei fogli pronti…'
      : failed.length > 0
        ? ` Non riesco a leggere ${failed.length === 1 ? 'un foglio pronto' : `${failed.length} fogli pronti`}: mancano i loro collegamenti.`
        : '')

  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <header className="border-2 border-border-strong bg-surface">
        <div aria-hidden="true" className="h-2.5 border-b border-border-strong" style={TICKS} />
        <div className="grid items-end gap-5 p-5 @3xl:grid-cols-[minmax(0,1fr)_auto] @3xl:px-8 @3xl:py-6">
          <div className="min-w-0">
            <h1 className="m-0">
              <span className={PAGE_TITLE}>Quadro d'unione</span>
              <span className={PAGE_SUBTITLE}>Come si collegano i cinquanta fogli</span>
            </h1>
            <p lang="en" className="m-0 mt-2 text-[length:var(--step-1)] text-muted italic">
              Index map: how the fifty sheets connect
            </p>
          </div>
          <dl className={HEAD_READINGS}>
            <dt className="label">Fogli pronti</dt>
            <dd className="num m-0">
              {ready.size} di {manifest.length}
            </dd>
            <dt className="label">Rilevati</dt>
            <dd className="num m-0">
              {surveyed} di {manifest.length}
            </dd>
            <dt className="label">Regioni</dt>
            <dd className="m-0 flex flex-wrap gap-x-4">
              {/* stanno da sole in una fila: bersagli alti almeno 40 px */}
              {REGION_ORDER.map((c) => (
                <Link key={c} to={`/corso/${c}`} className="inline-flex min-h-10 items-center">
                  {REGIONS[c].name}
                </Link>
              ))}
            </dd>
          </dl>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        {/* il filtro comune a tutte le pagine: scelta a inchiostro, così il tassello Ricci (ocra come lo spillo) resta visibile */}
        <RegionFilter id={regionLabel} value={filter} onChange={(c) => setParam('regione', c)} inline />
        {wide && (
          <div role="group" aria-labelledby={viewLabel} className="flex items-center gap-3">
            <span id={viewLabel} className="label">
              Vista
            </span>
            <div className="flex gap-2">
              <button type="button" aria-pressed={view === 'grafo'} onClick={() => setParam('vista', null)} className={BTN_TOGGLE}>
                Grafo
              </button>
              <button type="button" aria-pressed={view === 'elenco'} onClick={() => setParam('vista', 'elenco')} className={BTN_TOGGLE}>
                Elenco
              </button>
            </div>
          </div>
        )}
      </div>
      <p role="status" aria-label="Stato del quadro" className="m-0 mt-3 text-[length:var(--step--1)] text-muted">
        {status}
      </p>

      {view === 'grafo' ? (
        <>
          <AtlasGraph layout={layout} edges={edges} relations={relations} kinds={kinds} filter={filter} modules={modules} ready={ready} pinned={pinned} />
          <Legend edges={{ kinds, counts, onToggle: (k) => setKinds((prev) => ({ ...prev, [k]: !prev[k] })) }} />
        </>
      ) : (
        <>
          <Legend />
          <SheetList filter={filter} modules={modules} ready={ready} pinned={pinned} relations={relations} />
        </>
      )}
    </main>
  )
}
