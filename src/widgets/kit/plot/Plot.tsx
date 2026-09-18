// Plot: il foglio su cui disegnano tutte le primitive. Tiene le scale d3, la cornice, lo strato dei canvas,
// il cursore-quota e il cartiglio delle letture; i figli leggono tutto con usePlot().
//
// SCELTE
// - Convenzione dei margini di d3: i figli disegnano in un <g> traslato, con x in [0, innerWidth] e y in
//   [innerHeight, 0]. Il dominio cade quindi esattamente sugli estremi dell'area interna.
// - Responsive senza rimpicciolire il testo: `width` e `height` danno il rapporto e la misura di partenza, poi
//   il viewBox segue la larghezza VERA del contenitore (ResizeObserver). Un'unità del viewBox resta un pixel CSS:
//   su un telefono cambia il numero di tacche, non la grandezza delle cifre, e i canvas sanno quanti pixel hanno.
//   Dove ResizeObserver manca (jsdom) resta il viewBox dato, che scala come un'immagine.
// - I canvas (FieldCanvas, BoundaryCanvas) non stanno in un <foreignObject>, fragile su Safari: entrano con un
//   portale in uno strato HTML sotto l'SVG, allineato all'area interna. Il terreno sta sotto, i segni sopra.
// - role="img" nasconde i figli agli screen reader: appena c'è una parte interattiva (cursore, punti
//   trascinabili) il grafico diventa un role="group", altrimenti quei controlli avrebbero fuoco ma non nome.
// - Le letture dei segni non stanno solo sotto il puntatore. Dots, Bars e Histogram si registrano
//   (registerReadable): il cursore-quota, che si muove anche da tastiera, aggancia la sua lettura al segno più
//   vicino e ne dice nome e classe, nel cartiglio e in aria-valuetext; in un grafico senza cursore i segni che
//   hanno un nome proprio (un punto con `label`, una barra con `label`) finiscono nella descrizione dell'SVG.
// - Il cartiglio segue il cursore con transform (translate in pixel, che dopo la misura coincidono con quelli CSS):
//   left e top restano fermi, nessun ricalcolo del layout a ogni mossa del puntatore.
import { createContext, useCallback, useContext, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { format, scaleLinear, type ScaleLinear } from 'd3'

export interface Margin {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Per ora solo scale lineari, come dice il contratto di usePlot (ScaleLinear). Un asse logaritmico si ottiene
 * passando log10 dei valori e formattando le tacche di Axis con `format={(v) => `10^${v}`}`.
 */
export type ScaleKind = 'linear'

/** Lettura mostrata nel cartiglio: prima il valore, poi (se c'è) che cosa è. Coordinate in pixel dell'area interna. */
export interface PlotTip {
  x: number
  y: number
  value: string
  label?: string
}

/** Lettura di un segno per il cursore-quota: quanto dista dal cursore, in pixel, e che cosa è. */
export interface MarkReading {
  distance: number
  /** "salmone 1 · classe 1 · cerchio · x = 2, y = 4" */
  text: string
}

/** Segni che si leggono anche senza puntatore (vedi registerReadable). */
export interface ReadableMarks {
  /**
   * Il segno più vicino al punto (px, py) dell'area interna, entro la portata del segno, oppure null. Con il
   * cursore 'x' conta solo la distanza orizzontale.
   */
  nearest(px: number, py: number, mode: 'x' | 'xy'): MarkReading | null
  /** Letture dei segni con un nome proprio, separate da "; ": vanno nella descrizione del grafico. */
  named: string
}

export interface PlotContextValue {
  x: ScaleLinear<number, number>
  y: ScaleLinear<number, number>
  innerWidth: number
  innerHeight: number
  /** misura dell'intero SVG, margini compresi, in unità del viewBox (= pixel CSS dopo la misura) */
  width: number
  height: number
  margin: Margin
  /** identificatore del grafico, buono per gli id di clipPath e simili */
  id: string
  /** `clipPath={clipPath}` ritaglia un segno sull'area interna */
  clipPath: string
  /** strato HTML sotto l'SVG, grande come l'area interna: ci entrano i canvas. null al primo render. */
  layer: HTMLElement | null
  /** tacche di un asse: un elenco esplicito (tenuto dentro il dominio), un numero indicativo, o quante ne stanno */
  ticks(axis: 'x' | 'y', spec?: number | readonly number[]): number[]
  /** coordinate del puntatore (clientX, clientY) -> coordinate nel dominio, senza ritaglio */
  toData(clientX: number, clientY: number): [number, number]
  /** mostra o toglie (null) il cartiglio delle letture */
  showTip(tip: PlotTip | null): void
  /** chi è interattivo lo dichiara in un effetto e restituisce la funzione come cleanup: il grafico smette di essere una img */
  registerInteractive(): () => void
  /**
   * Chi disegna segni con una lettura (punti, barre, bin) si registra in un effetto e restituisce la funzione come
   * cleanup: il cursore-quota li legge e i loro nomi entrano nella descrizione del grafico.
   */
  registerReadable(marks: ReadableMarks): () => void
}

const PlotCtx = createContext<PlotContextValue | null>(null)

/** Scale, misure e servizi del grafico che contiene il componente. */
// oxlint-disable-next-line react/only-export-components -- usePlot è parte del contratto di Plot.tsx (piano, Task 4.4)
export function usePlot(): PlotContextValue {
  const ctx = useContext(PlotCtx)
  if (ctx === null) throw new Error('usePlot: questa primitiva va disegnata dentro un <Plot>')
  return ctx
}

export interface PlotProps {
  /** misura di partenza e rapporto tra i lati; il viewBox segue poi il contenitore */
  width: number
  height: number
  xDomain: readonly [number, number]
  yDomain: readonly [number, number]
  margin?: Partial<Margin>
  x?: ScaleKind
  y?: ScaleKind
  /** nome accessibile: che cosa mostra il grafico */
  ariaLabel: string
  /** descrizione più lunga per chi non vede il grafico: andamento, modi, ciò che conta */
  description?: string
  /** cornice dell'area interna (la carta ha sempre il suo bordo); predefinito true */
  frame?: boolean
  /** riempie il contenitore, che deve avere un'altezza propria, invece di tenere il rapporto width / height */
  fill?: boolean
  /**
   * cursore-quota: 'x' una verticale che legge l'ascissa, 'xy' una croce che legge il punto. Si muove con il
   * puntatore, con il dito (in orizzontale) e da tastiera. Quando è attivo la sua lettura prevale su quelle dei segni.
   */
  cursor?: 'x' | 'xy'
  /** testo della lettura del cursore; predefinito "x = …" oppure "x = … · y = …" */
  cursorFormat?: (x: number, y: number) => string
  /** posizione del cursore nel dominio, null quando esce */
  onCursor?: (point: { x: number; y: number } | null) => void
  className?: string
  children?: ReactNode
}

const DEFAULT_MARGIN: Margin = { top: 24, right: 16, bottom: 40, left: 56 }
/** Il cursore da tastiera attraversa il dominio in 40 passi (8 con Maiusc). */
const CURSOR_STEPS = 40
const compact = format('.3~g')

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, Math.min(a, b)), Math.max(a, b))
/** Toglie il rumore in virgola mobile dei passi sommati (5.250000000000001 -> 5.25). */
const tidy = (v: number) => Number(v.toPrecision(12))

export function Plot(props: PlotProps) {
  const { xDomain, yDomain, ariaLabel, description, frame = true, fill = false, cursor, cursorFormat, onCursor, className, children } = props
  // il margine dipende dai quattro numeri, non dall'oggetto: chi lo scrive in linea non rifà il contesto a ogni render
  const top = props.margin?.top ?? DEFAULT_MARGIN.top
  const right = props.margin?.right ?? DEFAULT_MARGIN.right
  const bottom = props.margin?.bottom ?? DEFAULT_MARGIN.bottom
  const left = props.margin?.left ?? DEFAULT_MARGIN.left
  const margin = useMemo<Margin>(() => ({ top, right, bottom, left }), [top, right, bottom, left])

  // --- misura ---
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (el === null || typeof ResizeObserver === 'undefined') return
    const apply = (w: number, h: number) => {
      const rw = Math.round(w)
      const rh = Math.round(h)
      // un contenitore nascosto misura 0: si tiene l'ultima misura buona
      if (rw > 0 && rh > 0) setMeasured((m) => (m !== null && m.w === rw && m.h === rh ? m : { w: rw, h: rh }))
    }
    // subito, prima del primo paint: niente fotogramma con il testo in scala
    const rect = el.getBoundingClientRect()
    apply(rect.width, rect.height)
    const ro = new ResizeObserver((entries) => {
      const box = entries[entries.length - 1]?.contentRect
      if (box) apply(box.width, box.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const width = measured?.w ?? props.width
  const height = measured?.h ?? props.height
  const innerWidth = Math.max(1, width - margin.left - margin.right)
  const innerHeight = Math.max(1, height - margin.top - margin.bottom)

  // le scale dipendono dai numeri, non dall'identità degli array: chi passa [0, 10] in linea non le rifà a ogni render
  const [x0, x1] = xDomain
  const [y0, y1] = yDomain
  const x = useMemo(() => scaleLinear().domain([x0, x1]).range([0, innerWidth]), [x0, x1, innerWidth])
  const y = useMemo(() => scaleLinear().domain([y0, y1]).range([innerHeight, 0]), [y0, y1, innerHeight])

  // --- servizi per i figli ---
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [layer, setLayer] = useState<HTMLDivElement | null>(null)
  const [tip, setTip] = useState<PlotTip | null>(null)
  const [interactive, setInteractive] = useState(0)

  const showTip = useCallback((next: PlotTip | null) => setTip(next), [])
  const registerInteractive = useCallback(() => {
    setInteractive((n) => n + 1)
    return () => setInteractive((n) => n - 1)
  }, [])
  const [readables, setReadables] = useState<readonly ReadableMarks[]>([])
  const registerReadable = useCallback((marks: ReadableMarks) => {
    setReadables((list) => [...list, marks])
    return () => setReadables((list) => list.filter((m) => m !== marks))
  }, [])

  const toData = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const svg = svgRef.current
      let px = clientX
      let py = clientY
      if (svg !== null) {
        // getScreenCTM tiene conto di scala, bande del preserveAspectRatio e trasformazioni CSS (schermo intero)
        const ctm = typeof svg.getScreenCTM === 'function' ? svg.getScreenCTM() : null
        if (ctm !== null && typeof DOMPoint !== 'undefined') {
          const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
          px = p.x
          py = p.y
        } else {
          const r = svg.getBoundingClientRect()
          px = (clientX - r.left) * (r.width > 0 ? width / r.width : 1)
          py = (clientY - r.top) * (r.height > 0 ? height / r.height : 1)
        }
      }
      return [x.invert(px - margin.left), y.invert(py - margin.top)]
    },
    [x, y, width, height, margin.left, margin.top],
  )

  const ticks = useCallback(
    (axis: 'x' | 'y', spec?: number | readonly number[]): number[] => {
      const scale = axis === 'x' ? x : y
      if (typeof spec === 'object') {
        const [a, b] = scale.domain()
        return spec.filter((t) => t >= Math.min(a, b) && t <= Math.max(a, b))
      }
      // quante ne stanno senza che le cifre si tocchino: il telefono ne ha meno della scrivania
      const room = axis === 'x' ? Math.floor(innerWidth / 80) : Math.floor(innerHeight / 48)
      return scale.ticks(spec ?? Math.max(2, room))
    },
    [x, y, innerWidth, innerHeight],
  )

  const clipId = `${id}-clip`
  const ctx = useMemo<PlotContextValue>(
    () => ({ x, y, innerWidth, innerHeight, width, height, margin, id, clipPath: `url(#${clipId})`, layer, ticks, toData, showTip, registerInteractive, registerReadable }),
    [x, y, innerWidth, innerHeight, width, height, margin, id, clipId, layer, ticks, toData, showTip, registerInteractive, registerReadable],
  )

  /** Il segno più vicino al punto del dominio, fra quelli registrati: la sua lettura, o undefined. */
  const markAt = (point: { x: number; y: number }): string | undefined => {
    if (cursor === undefined) return undefined
    let best: MarkReading | null = null
    for (const marks of readables) {
      const m = marks.nearest(x(point.x), y(point.y), cursor)
      if (m !== null && (best === null || m.distance < best.distance)) best = m
    }
    return best?.text
  }

  // --- cursore-quota ---
  const [cursorAt, setCursorAt] = useState<{ x: number; y: number } | null>(null)
  const onCursorRef = useRef(onCursor)
  useLayoutEffect(() => {
    onCursorRef.current = onCursor
  })
  const readout = useCallback(
    (cx: number, cy: number) => cursorFormat?.(cx, cy) ?? (cursor === 'xy' ? `x = ${compact(cx)} · y = ${compact(cy)}` : `x = ${compact(cx)}`),
    [cursor, cursorFormat],
  )
  const moveCursor = (point: { x: number; y: number } | null) => {
    setCursorAt(point)
    onCursorRef.current?.(point)
    // la lettura sta in alto sulla verticale, accanto alla croce quando si legge un punto; l'etichetta è il segno agganciato
    setTip(point === null ? null : { x: x(point.x), y: cursor === 'xy' ? y(point.y) : 0, value: readout(point.x, point.y), label: markAt(point) })
  }
  const onAreaPointer = (e: PointerEvent<SVGGElement>) => {
    if (cursor === undefined) return
    const [dx, dy] = toData(e.clientX, e.clientY)
    const inside = dx >= Math.min(x0, x1) && dx <= Math.max(x0, x1) && dy >= Math.min(y0, y1) && dy <= Math.max(y0, y1)
    if (inside) moveCursor({ x: dx, y: dy })
    else if (cursorAt !== null) moveCursor(null)
  }
  const onAreaLeave = (e: PointerEvent<SVGGElement>) => {
    // un dito "esce" appena si solleva: su touch la lettura resta dov'è finché non si tocca altrove
    if (cursor !== undefined && cursorAt !== null && e.pointerType !== 'touch') moveCursor(null)
  }
  const center = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }
  const onCursorKey = (e: KeyboardEvent<SVGRectElement>) => {
    const from = cursorAt ?? center
    const big = e.shiftKey ? 5 : 1
    const sx = (Math.abs(x1 - x0) / CURSOR_STEPS) * big
    const sy = (Math.abs(y1 - y0) / CURSOR_STEPS) * big
    let nx = from.x
    let ny = from.y
    if (e.key === 'ArrowRight') nx += sx
    else if (e.key === 'ArrowLeft') nx -= sx
    else if (e.key === 'Home') nx = Math.min(x0, x1)
    else if (e.key === 'End') nx = Math.max(x0, x1)
    else if (cursor === 'xy' && e.key === 'ArrowUp') ny += sy
    else if (cursor === 'xy' && e.key === 'ArrowDown') ny -= sy
    else if (cursor === 'x' && e.key === 'ArrowUp') nx += sx
    else if (cursor === 'x' && e.key === 'ArrowDown') nx -= sx
    else if (e.key === 'Escape') {
      moveCursor(null)
      return
    } else return
    e.preventDefault()
    moveCursor({ x: tidy(clamp(nx, x0, x1)), y: tidy(clamp(ny, y0, y1)) })
  }

  const role = cursor !== undefined || interactive > 0 ? 'group' : 'img'
  const descId = `${id}-desc`
  const pct = (part: number, whole: number) => `${(part / whole) * 100}%`
  const at = cursorAt ?? center
  const atMark = markAt(at)
  // la descrizione dell'autore e, dopo, i segni che hanno un nome: in un grafico statico è l'unico modo di sentirli
  const named = readables
    .map((m) => m.named)
    .filter((s) => s !== '')
    .join('; ')
  const fullDescription = [description ?? '', named !== '' ? `Segni: ${named}.` : ''].filter((s) => s !== '').join(' ')
  // cartiglio: fermo in alto a sinistra e spostato con transform; senza misura (niente ResizeObserver) il viewBox
  // scala come un'immagine e i pixel non coincidono, quindi resta il posizionamento in percentuale
  const r1 = (v: number) => Math.round(v * 10) / 10
  const tipStyle = (t: PlotTip) => {
    const flip = `translate(${t.x > innerWidth * 0.6 ? 'calc(-100% - 10px)' : '10px'}, ${t.y < 44 ? '10px' : 'calc(-100% - 10px)'})`
    return measured !== null
      ? { left: 0, top: 0, transform: `translate(${r1(margin.left + t.x)}px, ${r1(margin.top + t.y)}px) ${flip}` }
      : { left: pct(margin.left + t.x, width), top: pct(margin.top + t.y, height), transform: flip }
  }

  return (
    <div ref={wrapRef} className={`relative w-full${className ? ` ${className}` : ''}`} style={fill ? { height: '100%' } : { aspectRatio: `${props.width} / ${props.height}` }}>
      {/* la carta e, sopra, i canvas del terreno: tutto sotto l'SVG */}
      <div
        ref={setLayer}
        aria-hidden="true"
        className="absolute overflow-hidden bg-surface"
        style={{ left: pct(margin.left, width), top: pct(margin.top, height), width: pct(innerWidth, width), height: pct(innerHeight, height) }}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        role={role}
        aria-label={ariaLabel}
        aria-describedby={fullDescription !== '' ? descId : undefined}
        // assoluto sul contenitore: l'altezza in percentuale si risolve sempre, anche quando la dà aspect-ratio
        className="absolute inset-0 block h-full w-full overflow-visible select-none"
        // con il cursore il dito che scorre in orizzontale legge il grafico, in verticale continua a scorrere la pagina
        style={cursor !== undefined ? { touchAction: 'pan-y' } : undefined}
      >
        {fullDescription !== '' ? <desc id={descId}>{fullDescription}</desc> : null}
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={innerWidth} height={innerHeight} />
          </clipPath>
        </defs>
        <PlotCtx.Provider value={ctx}>
          <g data-plot-area="" transform={`translate(${margin.left},${margin.top})`} onPointerMove={onAreaPointer} onPointerDown={onAreaPointer} onPointerLeave={onAreaLeave}>
            {cursor !== undefined ? (
              <rect
                x={0}
                y={0}
                width={innerWidth}
                height={innerHeight}
                fill="transparent"
                tabIndex={0}
                role="slider"
                aria-label="Cursore di lettura: frecce per muoverlo"
                aria-valuemin={Math.min(x0, x1)}
                aria-valuemax={Math.max(x0, x1)}
                aria-valuenow={at.x}
                aria-valuetext={atMark !== undefined ? `${readout(at.x, at.y)} · ${atMark}` : readout(at.x, at.y)}
                onFocus={() => moveCursor(cursorAt ?? center)}
                onBlur={() => moveCursor(null)}
                onKeyDown={onCursorKey}
              />
            ) : null}
            {children}
            {frame ? <rect x={0} y={0} width={innerWidth} height={innerHeight} fill="none" stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" pointerEvents="none" /> : null}
            {cursor !== undefined && cursorAt !== null ? (
              <g data-plot-cursor="" pointerEvents="none" stroke="var(--viz-boundary)" strokeOpacity={0.55} strokeWidth={1} shapeRendering="crispEdges">
                <line x1={x(cursorAt.x)} x2={x(cursorAt.x)} y1={0} y2={innerHeight} />
                {cursor === 'xy' ? <line x1={0} x2={innerWidth} y1={y(cursorAt.y)} y2={y(cursorAt.y)} /> : null}
                {cursor === 'xy' ? (
                  <rect x={x(cursorAt.x) - 3.5} y={y(cursorAt.y) - 3.5} width={7} height={7} fill="var(--pin)" stroke="var(--pin-contrast)" strokeOpacity={1} shapeRendering="auto" />
                ) : null}
              </g>
            ) : null}
          </g>
        </PlotCtx.Provider>
      </svg>
      {tip !== null ? (
        // cartiglio della lettura: si sovrappone al grafico, quindi ha l'ombra; prima il valore, poi l'etichetta
        <div
          data-plot-tip=""
          className="pointer-events-none absolute z-10 border border-border-strong bg-surface px-2 py-1 whitespace-nowrap text-text shadow-1"
          style={tipStyle(tip)}
        >
          <span className="num text-[length:var(--step--1)] font-semibold">{tip.value}</span>
          {tip.label ? <span className="label ml-2">{tip.label}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
