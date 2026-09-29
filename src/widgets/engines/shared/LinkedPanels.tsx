// Pannelli collegati: impilati (i tre pannelli della verosimiglianza con l'asse θ in comune), affiancati (ML | Bayes,
// due classificatori gemelli con la stessa sonda) o in griglia di small multiples (N = 1, 4, 9, 16, 100; griglie per
// metodo). Il collegamento è un cursore condiviso: la sonda che si muove in un pannello si vede in tutti.
//
//   <LinkedPanels label="Tre pannelli" layout="stack" panels={[
//     { id: 'lik', title: 'Verosimiglianza $L(\\theta)$', content: ({ onCursor, last }) => (
//         <Plot … cursor="x" onCursor={onCursor}> … <Axis side="bottom" values={last} /> <LinkedCursorMark /> </Plot>) },
//     …
//   ]} />
//
// SCELTE
// - Il cursore è in coordinate del dominio dei Plot, le stesse per tutti i pannelli che condividono l'asse (stesse
//   unità, stessa trasformazione): è la condizione perché "lo stesso x" voglia dire qualcosa.
// - Un pannello su un altro asse (spazio dei dati contro spazio dei parametri in theta-lab, log10 contro valori
//   veri) dichiara `map`: toPanel porta il cursore condiviso nelle sue coordinate, toShared lo riporta indietro.
//   Il suo Plot, il suo LinkedCursorMark e `cursor` del contenuto parlano allora in coordinate del pannello.
//   Una mappa che restituisce null dice "qui il cursore non ha un corrispondente": il pannello non lo disegna.
// - Sonda persistente (predefinita): quando il puntatore esce da un pannello il cursore resta dov'era, come il punto
//   sonda di density1d; con sticky={false} sparisce.
// - Impilati, solo l'ultimo pannello ha bisogno delle cifre dell'asse x: il contenuto riceve `first` e `last`.
// - Da tastiera: ogni Plot ha il suo cursore di lettura (frecce), che muove quello condiviso.
// - A 390 px tutto va in colonna; le griglie da 4 colonne in su restano a due colonne (piccoli multipli leggibili).
// - `fill`: dentro il terreno del WidgetFrame, che ha un'altezza sua, i pannelli se la dividono in parti uguali
//   (una riga per pannello impilato, o per riga di multipli) invece di tenere ciascuno il rapporto del suo Plot, che a
//   390 px li schiaccerebbe. Il contenuto riceve `fill` e lo passa al suo Plot. Ogni pannello tiene almeno 7rem:
//   in un terreno troppo basso i pannelli restano leggibili e il gruppo scorre (il fuoco sul cursore di un Plot lo
//   porta in vista). Per tre pannelli impilati conviene comunque un terreno più alto che largo (aspect sotto 1).
//
// - Costo di una mossa: il cursore vive in uno store fuori da React (linked.ts). A ogni pointermove si ridisegnano
//   solo i segni del cursore (LinkedCursorMark, useLinkedPoint) e i pannelli il cui contenuto legge ctx.cursor, non
//   gli altri pannelli e non il motore. Un motore che vuole il cursore per una formula passa `store` e lo legge con
//   useLinkedCursorStore dove serve; `cursor` (controllato) resta possibile, ma ridisegna il motore a ogni mossa.
//
// MOTO. Nessuno: il cursore segue la mano.
import { useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { Rich } from '../../../components/content/Rich'
import type { Rich as RichText } from '../../../content/types'
import { usePlot } from '../../kit/plot/Plot'
import { LinkedCursorContext, createLinkedCursorStore, sameLinkedPoint, useLinkedCursor, useLinkedPoint } from './linked'
import type { LinkedCursorStore, LinkedCursorValue, LinkedPoint } from './linked'
import { richToPlain } from './presetTools'

export interface PanelContext {
  index: number
  count: number
  first: boolean
  last: boolean
  /**
   * il cursore nelle coordinate del pannello. Leggerlo iscrive il pannello al cursore: da allora quel pannello, e solo
   * lui, si ridisegna a ogni mossa. Un pannello che non lo legge non si ridisegna quando il cursore si muove
   */
  cursor: LinkedPoint | null
  /** da passare a onCursor del Plot del pannello */
  onCursor: (p: { x: number; y: number } | null) => void
  /** i pannelli riempiono il contenitore: il Plot del pannello va con `fill` */
  fill: boolean
}

/** Da e verso le coordinate condivise, per un pannello che ha un asse suo (vedi SCELTE). */
export interface PanelMap {
  toPanel(p: LinkedPoint): LinkedPoint | null
  toShared(p: LinkedPoint): LinkedPoint | null
}

export interface LinkedPanel {
  id: string
  /** titolo del pannello (Markdown con $…$): anche il nome della sua regione */
  title?: RichText
  en?: string
  /** asse proprio del pannello: il cursore condiviso tradotto nelle sue coordinate e ritorno */
  map?: PanelMap
  content: ReactNode | ((ctx: PanelContext) => ReactNode)
}

export interface LinkedPanelsProps {
  panels: readonly LinkedPanel[]
  /** nome accessibile del gruppo */
  label: string
  /** 'stack' in colonna (predefinito), 'row' affiancati dove c'è spazio, 'grid' piccoli multipli */
  layout?: 'stack' | 'row' | 'grid'
  /** colonne della griglia sullo schermo largo (2-6) */
  columns?: 2 | 3 | 4 | 5 | 6
  /** cursore controllato dal motore (che allora si ridisegna a ogni mossa); senza, lo tiene il componente */
  cursor?: LinkedPoint | null
  /**
   * store del cursore tenuto dal motore (createLinkedCursorStore): il motore lo legge con useLinkedCursorStore solo
   * dove serve (una formula, una lettura) senza ridisegnarsi a ogni mossa. Con `store`, defaultCursor non conta
   */
  store?: LinkedCursorStore
  defaultCursor?: LinkedPoint | null
  onCursorChange?: (p: LinkedPoint | null) => void
  /** 'x' (predefinito) condivide la sola ascissa, 'xy' il punto */
  axis?: 'x' | 'xy'
  /** il cursore resta quando il puntatore esce (predefinito true) */
  sticky?: boolean
  /** riempie il contenitore (che ha un'altezza propria): i pannelli si dividono l'altezza */
  fill?: boolean
}

// classi scritte per esteso: Tailwind le trova leggendo il sorgente
const GRID_COLUMNS: Record<2 | 3 | 4 | 5 | 6, string> = {
  2: 'grid-cols-1 @sm:grid-cols-2',
  3: 'grid-cols-1 @sm:grid-cols-2 @3xl:grid-cols-3',
  4: 'grid-cols-2 @3xl:grid-cols-4',
  5: 'grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-5',
  6: 'grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-6',
}
const LAYOUT: Record<'stack' | 'row', string> = {
  stack: 'grid-cols-1',
  row: 'grid-cols-1 @2xl:grid-flow-col @2xl:auto-cols-fr',
}

/**
 * Il cursore visto da un pannello con un asse suo: quello condiviso tradotto con la mappa. La traduzione sta in cache
 * (useSyncExternalStore vuole lo stesso oggetto finché il punto condiviso non cambia).
 */
function mappedValue(base: LinkedCursorValue, map: PanelMap): LinkedCursorValue {
  let lastIn: LinkedPoint | null | undefined
  let lastOut: LinkedPoint | null = null
  return {
    axis: base.axis,
    subscribe: base.subscribe,
    get() {
      const c = base.get()
      if (c !== lastIn) {
        lastIn = c
        lastOut = c === null ? null : map.toPanel(c)
      }
      return lastOut
    },
    setCursor: (p) => base.setCursor(p === null ? null : map.toShared(p)),
    fromPlot(p) {
      if (p === null) {
        base.fromPlot(null)
        return
      }
      const q = map.toShared(base.axis === 'x' ? { x: p.x } : { x: p.x, y: p.y })
      // un punto del pannello senza corrispondente condiviso: il cursore resta dov'era
      if (q !== null) base.setCursor(base.axis === 'x' ? { x: q.x } : q)
    },
  }
}

/**
 * Il contenuto di un pannello. Chi legge ctx.cursor si iscrive al cursore (il getter accende la sonda): da allora quel
 * pannello, e solo lui, si ridisegna quando il cursore si muove. Gli altri restano fermi.
 */
function PanelBody({ content, value, index, count, fill }: { content: LinkedPanel['content']; value: LinkedCursorValue; index: number; count: number; fill: boolean }) {
  const [probe] = useState(() => ({ reads: false }))
  const snapshot = () => (probe.reads ? value.get() : null)
  useSyncExternalStore(value.subscribe, snapshot, snapshot)
  if (typeof content !== 'function') return <>{content}</>
  const ctx: PanelContext = {
    index,
    count,
    first: index === 0,
    last: index === count - 1,
    onCursor: value.fromPlot,
    fill,
    get cursor() {
      probe.reads = true
      return value.get()
    },
  }
  return <>{content(ctx)}</>
}

export function LinkedPanels({ panels, label, layout = 'stack', columns = 3, cursor, store: external, defaultCursor = null, onCursorChange, axis = 'x', sticky = true, fill = false }: LinkedPanelsProps) {
  const controlled = cursor !== undefined
  const [own] = useState(() => createLinkedCursorStore(cursor !== undefined ? cursor : defaultCursor))
  const store = external ?? own
  // cursore controllato: lo store segue la prop, prima del disegno (i segni non restano indietro di un fotogramma)
  useLayoutEffect(() => {
    if (cursor !== undefined) store.set(cursor)
  }, [cursor, store])

  const value = useMemo<LinkedCursorValue>(() => {
    const setCursor = (p: LinkedPoint | null) => {
      // una mossa che non sposta il punto non sveglia nessuno, nemmeno il motore
      if (sameLinkedPoint(store.get(), p)) return
      // controllato: decide il motore, e la prop torna nello store; altrimenti lo store è la verità
      if (!controlled) store.set(p)
      onCursorChange?.(p)
    }
    return {
      get: store.get,
      subscribe: store.subscribe,
      axis,
      setCursor,
      fromPlot(p) {
        if (p === null) {
          if (!sticky) setCursor(null)
          return
        }
        setCursor(axis === 'x' ? { x: p.x } : { x: p.x, y: p.y })
      },
    }
  }, [store, axis, sticky, controlled, onCursorChange])
  // un valore per pannello, rifatto quando il motore si ridisegna (pannelli o callback nuovi), mai a una mossa del cursore
  const panelValues = useMemo(() => panels.map((p) => (p.map === undefined ? value : mappedValue(value, p.map))), [panels, value])

  const cls = layout === 'grid' ? GRID_COLUMNS[columns] : LAYOUT[layout]
  return (
    <LinkedCursorContext.Provider value={value}>
      <div role="group" aria-label={label} className={fill ? '@container h-full min-h-0 overflow-y-auto' : '@container'}>
        <div className={`grid gap-3 ${cls}${fill ? ' h-full auto-rows-[minmax(7rem,1fr)]' : ''}`}>
          {panels.map((p, i) => {
            const mine = panelValues[i]
            const name = p.title !== undefined ? richToPlain(p.title) : undefined
            return (
              // ogni pannello vede il cursore nelle sue coordinate (LinkedCursorMark lo legge da qui)
              <LinkedCursorContext.Provider key={p.id} value={mine}>
                <section data-panel={p.id} aria-label={name} className={fill ? `grid min-h-0 min-w-0 gap-1.5 ${p.title !== undefined ? 'grid-rows-[auto_minmax(0,1fr)]' : 'grid-rows-[minmax(0,1fr)]'}` : 'grid min-w-0 content-start gap-1.5'}>
                  {p.title !== undefined ? (
                    <p aria-hidden="true" className="m-0 flex flex-wrap items-baseline gap-x-2">
                      <Rich text={p.title} inline className="font-label text-[length:var(--step--1)] font-bold" />
                      {p.en !== undefined ? (
                        <em lang="en" className="text-[length:var(--step--1)] text-muted">
                          {p.en}
                        </em>
                      ) : null}
                    </p>
                  ) : null}
                  <div className={fill ? 'min-h-0 min-w-0' : 'min-w-0'}>
                    <PanelBody content={p.content} value={mine} index={i} count={panels.length} fill={fill} />
                  </div>
                </section>
              </LinkedCursorContext.Provider>
            )
          })}
        </div>
      </div>
    </LinkedCursorContext.Provider>
  )
}

/**
 * Il cursore condiviso disegnato nel Plot che lo contiene: verticale (e orizzontale col cursore a due assi) a
 * inchiostro attenuato, con lo spillo sul bordo alto. Fuori da un LinkedPanels, o senza cursore, non disegna nulla.
 * Si iscrive da solo al cursore: a ogni mossa si ridisegna lui, non il pannello.
 */
export function LinkedCursorMark() {
  const linked = useLinkedCursor()
  const c = useLinkedPoint()
  const { x, y, innerWidth, innerHeight } = usePlot()
  if (c == null) return null
  const px = x(c.x)
  if (!Number.isFinite(px) || px < -0.5 || px > innerWidth + 0.5) return null
  const py = c.y !== undefined && linked?.axis === 'xy' ? y(c.y) : null
  return (
    <g data-linked-cursor="" pointerEvents="none" stroke="var(--viz-boundary)" strokeWidth={1} shapeRendering="crispEdges">
      <line x1={px} x2={px} y1={0} y2={innerHeight} strokeOpacity={0.55} />
      {py !== null && py >= 0 && py <= innerHeight ? <line x1={0} x2={innerWidth} y1={py} y2={py} strokeOpacity={0.55} /> : null}
      <rect x={px - 3.5} y={-3.5} width={7} height={7} fill="var(--pin)" stroke="var(--pin-contrast)" shapeRendering="auto" />
    </g>
  )
}
