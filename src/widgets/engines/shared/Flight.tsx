// Segni che volano da un <Plot> a un altro: il pixel dell'immagine che cade nel piano rosso × NIR, la stima che
// scende dal pannello dei training set nell'istogramma delle stime, il fattore p(x_k|θ) che entra nella barra del
// prodotto, il punto 3D che cade nel piano della proiezione. Tre pezzi:
//
//   <FlightLayer>                       contenitore comune (position: relative) dei grafici coinvolti
//     <Plot …><FlightAnchor name="immagine" />…</Plot>
//     <Plot …><FlightAnchor name="piano" />…</Plot>
//     <FlightMarks flights={[{ id, from: { anchor: 'immagine', at: [x, y] }, to: { anchor: 'piano', at: [x, y] }, t }]} />
//   </FlightLayer>
//
// - Ogni FlightAnchor misura dove sta il suo grafico nello strato (una lettura di geometria al montaggio, quando
//   cambiano le scale e quando lo strato cambia misura) e da lì la mappa dominio → pixel dello strato (flightPath.ts).
// - FlightMarks disegna i segni in volo in uno strato sopra i grafici, senza bersagli (pointer-events: none) e
//   nascosto ai lettori di schermo: il volo è racconto, i dati veri restano nei grafici.
// - Il tempo lo dà chi lo usa (`t` per segno, da 0 a 1, di solito dal canale onFrame dello storyboard; `staggered`
//   di flightPath fa partire i segni uno dopo l'altro). Con reduced motion chi lo usa passa t = 1 o toglie il volo:
//   ogni passo è uno stato completo.
// - Tanti segni (centinaia di pixel): `mode="canvas"` disegna su un canvas alla densità dello schermo, con le stesse
//   forme di classe del modo SVG e i colori calcolati dei token, letti una volta per tema (e ridisegna al cambio).
// - Una sorgente che non è un <Plot> (la scena 3D di scene3d, disegnata su un suo canvas) entra con <FlightBox>: un
//   riquadro che dà la sua proiezione `project(at) → pixel del riquadro` (per la scena 3D, la camera).
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { classColor, cssVar, roleVar, useThemeVersion, vizColor, type VizRole } from '../../kit/plot/colors'
import { classSymbolPath, classVar } from '../../kit/plot/marks'
import { usePlot } from '../../kit/plot/Plot'
import { easeInOut, flightPoint, toLayer } from './flightPath'
import type { Vec2 } from './math/types'

/** Da un punto della sorgente (dominio del grafico, coordinate della scena) ai pixel dello strato comune. */
type Mapper = (at: Vec2) => Vec2

interface FlightCtx {
  layer: RefObject<HTMLDivElement | null>
  /** mappe dei grafici per nome; cambia identità quando cambia una misura */
  placements: ReadonlyMap<string, Mapper>
  register: (name: string, measure: () => Mapper | null) => () => void
  /** rimisura tutti i grafici (all'inizio di un volo: il layout può essere cambiato senza che nulla lo dicesse) */
  remeasure: () => void
}

const Ctx = createContext<FlightCtx | null>(null)

function useFlightCtx(who: string): FlightCtx {
  const ctx = useContext(Ctx)
  if (ctx === null) throw new Error(`${who}: va messo dentro un <FlightLayer>`)
  return ctx
}

export interface FlightLayerProps {
  children: ReactNode
  className?: string
}

export function FlightLayer({ children, className }: FlightLayerProps) {
  const layer = useRef<HTMLDivElement>(null)
  const measures = useRef(new Map<string, () => Mapper | null>())
  const [placements, setPlacements] = useState<ReadonlyMap<string, Mapper>>(() => new Map())

  const remeasure = useCallback(() => {
    const next = new Map<string, Mapper>()
    for (const [name, m] of measures.current) {
      const p = m()
      if (p !== null) next.set(name, p)
    }
    setPlacements(next)
  }, [])

  const register = useCallback(
    (name: string, measure: () => Mapper | null) => {
      measures.current.set(name, measure)
      remeasure()
      return () => {
        if (measures.current.get(name) === measure) measures.current.delete(name)
        remeasure()
      }
    },
    [remeasure],
  )

  // React aggancia i ref nella fase di layout, dai figli ai genitori: quando gli ancoraggi si registrano il ref
  // dello strato è ancora vuoto. Questo effetto del genitore gira dopo i loro e fa la prima misura vera.
  useLayoutEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- misura del DOM (sistema esterno): serve un render con le misure
    remeasure()
  }, [remeasure])

  // lo strato cambia misura (finestra, schermo intero, pannelli che si aprono): i grafici si sono spostati
  useEffect(() => {
    const el = layer.current
    if (el === null || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => remeasure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [remeasure])

  const value = useMemo<FlightCtx>(() => ({ layer, placements, register, remeasure }), [placements, register, remeasure])
  return (
    <div ref={layer} data-flight-layer="" className={`relative${className ? ` ${className}` : ''}`}>
      <Ctx.Provider value={value}>{children}</Ctx.Provider>
    </div>
  )
}

/** Dentro un <Plot>: registra il grafico nello strato dei voli con il suo nome. Non disegna nulla. */
export function FlightAnchor({ name }: { name: string }) {
  const { x, y, margin, width } = usePlot()
  const left = margin.left
  const top = margin.top
  const { layer, register } = useFlightCtx('FlightAnchor')
  const g = useRef<SVGGElement>(null)

  useLayoutEffect(() => {
    const measure = (): Mapper | null => {
      const svg = g.current?.ownerSVGElement
      const root = layer.current
      if (!svg || !root) return null
      // due letture di geometria, fuori dai fotogrammi del volo
      const r = svg.getBoundingClientRect()
      const l = root.getBoundingClientRect()
      const placement = { left: r.left - l.left, top: r.top - l.top, scale: r.width > 0 && width > 0 ? r.width / width : 1, margin: { left, top }, x, y }
      return (at) => toLayer(placement, at)
    }
    return register(name, measure)
  }, [name, x, y, left, top, width, layer, register])

  return <g ref={g} data-flight-anchor={name} aria-hidden="true" />
}

export interface FlightBoxProps {
  /** nome della sorgente, come per FlightAnchor */
  name: string
  /** proiezione di un punto della sorgente in pixel del riquadro (angolo in alto a sinistra = 0, 0); si legge sempre l'ultima */
  project: (at: Vec2) => Vec2
  className?: string
  children?: ReactNode
}

/**
 * Riquadro sorgente o destinazione dei voli che non è un <Plot>: la scena 3D su canvas, un'immagine. Si misura come
 * FlightAnchor e usa la proiezione data (una camera che ruota cambia `project`: il volo legge sempre l'ultima).
 */
export function FlightBox({ name, project, className, children }: FlightBoxProps) {
  const { layer, register } = useFlightCtx('FlightBox')
  const box = useRef<HTMLDivElement>(null)
  const latest = useRef(project)
  useLayoutEffect(() => {
    latest.current = project
  })
  useLayoutEffect(() => {
    const measure = (): Mapper | null => {
      const el = box.current
      const root = layer.current
      if (!el || !root) return null
      const r = el.getBoundingClientRect()
      const l = root.getBoundingClientRect()
      return (at) => {
        const p = latest.current(at)
        return [r.left - l.left + p[0], r.top - l.top + p[1]]
      }
    }
    return register(name, measure)
  }, [name, layer, register])
  return (
    <div ref={box} data-flight-box={name} className={className}>
      {children}
    </div>
  )
}

export interface FlightMark {
  id: string
  from: { anchor: string; at: Vec2 }
  to: { anchor: string; at: Vec2 }
  /** avanzamento del volo, da 0 (in partenza) a 1 (arrivato); la curva di moto la mette FlightMarks */
  t: number
  /** indice di classe: colore e forma */
  cls?: number
  /** colore senza classe; predefinito 'sample' */
  role?: VizRole
  /** raggio in px; predefinito 4.5 */
  r?: number
}

export interface FlightMarksProps {
  flights: readonly FlightMark[]
  /** curvatura del volo (0 = retta); predefinita 0.2 */
  arc?: number
  /** 'svg' per decine di segni (predefinito), 'canvas' per centinaia */
  mode?: 'svg' | 'canvas'
  /** i segni arrivati (t = 1) restano visibili; predefinito false: all'arrivo li disegna il grafico di destinazione */
  keepLanded?: boolean
}

const n2 = (v: number) => Number(v.toFixed(2))

export function FlightMarks({ flights, arc = 0.2, mode = 'svg', keepLanded = false }: FlightMarksProps) {
  const { layer, placements, remeasure } = useFlightCtx('FlightMarks')
  const flying = flights.filter((f) => (keepLanded ? f.t >= 0 : f.t > 0 && f.t < 1))
  const active = flying.length > 0

  // un volo che parte rimisura i grafici: fra un volo e l'altro la pagina può essersi spostata
  useLayoutEffect(() => {
    if (active) remeasure()
  }, [active, remeasure])

  const points = flying
    .map((f) => {
      const a = placements.get(f.from.anchor)
      const b = placements.get(f.to.anchor)
      if (a === undefined || b === undefined) return null
      return { f, p: flightPoint(a(f.from.at), b(f.to.at), easeInOut(f.t), arc) }
    })
    .filter((v): v is { f: FlightMark; p: Vec2 } => v !== null)

  if (mode === 'canvas') return <FlightCanvas layer={layer} points={points} />
  if (points.length === 0) return null
  return (
    <svg data-flight-marks="" aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
      {points.map(({ f, p }) => {
        const r = Math.max(4, f.r ?? 4.5)
        return (
          <path
            key={f.id}
            data-flight={f.id}
            transform={`translate(${n2(p[0])},${n2(p[1])})`}
            d={classSymbolPath(f.cls ?? 0, Math.PI * r * r)}
            fill={f.cls !== undefined ? classVar(f.cls) : roleVar(f.role ?? 'sample')}
            stroke="var(--surface)"
            strokeWidth={3}
            paintOrder="stroke"
          />
        )
      })}
    </svg>
  )
}

/** Chiave del colore di un segno: la classe o il ruolo. */
const colorKey = (f: FlightMark) => (f.cls !== undefined ? `c${f.cls % 6}` : `r${f.role ?? 'sample'}`)

/**
 * I segni in volo su canvas, alla densità dello schermo: la stessa forma di classe del modo SVG (classSymbolPath in un
 * Path2D spostato sul punto) con l'anello di superficie, così durante il volo la classe non si riconosce dal solo
 * colore. Costo per fotogramma: i colori calcolati dei token stanno in una cache che si svuota al cambio di tema (un
 * getComputedStyle per classe o ruolo, non uno per segno), e i tracciati in una cache per forma e raggio.
 */
function FlightCanvas({ layer, points }: { layer: RefObject<HTMLDivElement | null>; points: readonly { f: FlightMark; p: Vec2 }[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const theme = useThemeVersion()
  const colors = useRef<{ theme: number; map: Map<string, string> }>({ theme: -1, map: new Map() })
  const shapes = useRef(new Map<string, Path2D>())
  useLayoutEffect(() => {
    const canvas = ref.current
    const root = layer.current
    if (canvas === null || root === null) return
    const ctx = canvas.getContext?.('2d')
    if (!ctx) return
    const ratio = Math.min(2, typeof window !== 'undefined' && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1)
    const w = root.clientWidth
    const h = root.clientHeight
    if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
      canvas.width = Math.round(w * ratio)
      canvas.height = Math.round(h * ratio)
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, w, h)
    if (points.length === 0) return
    // il canvas non conosce le variabili CSS: i valori calcolati si rileggono solo quando cambia il tema
    if (colors.current.theme !== theme) colors.current = { theme, map: new Map() }
    const cache = colors.current.map
    const colorOf = (key: string, read: () => string) => {
      let c = cache.get(key)
      if (c === undefined) {
        c = read() || 'transparent'
        cache.set(key, c)
      }
      return c
    }
    const ring = colorOf('ring', () => cssVar('--surface'))
    const hasPath2D = typeof Path2D !== 'undefined'
    ctx.lineWidth = 3
    ctx.strokeStyle = ring
    for (const { f, p } of points) {
      const r = Math.max(4, f.r ?? 4.5)
      const fill = colorOf(colorKey(f), () => (f.cls !== undefined ? classColor(f.cls) : vizColor(f.role ?? 'sample')))
      if (!hasPath2D) {
        // ripiego senza Path2D (ambienti di prova vecchi): un cerchio con l'anello
        ctx.beginPath()
        ctx.arc(p[0], p[1], r + 1.5, 0, 2 * Math.PI)
        ctx.fillStyle = ring
        ctx.fill()
        ctx.beginPath()
        ctx.arc(p[0], p[1], r, 0, 2 * Math.PI)
        ctx.fillStyle = fill
        ctx.fill()
        continue
      }
      // la stessa forma del modo SVG: senza classe, il simbolo della classe 0 (il cerchio)
      const cls = f.cls ?? 0
      const shapeKey = `${cls % 6}:${r}`
      let shape = shapes.current.get(shapeKey)
      if (shape === undefined) {
        shape = new Path2D(classSymbolPath(cls, Math.PI * r * r))
        shapes.current.set(shapeKey, shape)
      }
      ctx.save()
      ctx.translate(p[0], p[1])
      // come paintOrder="stroke" in SVG: prima l'anello di superficie, poi il riempimento
      ctx.stroke(shape)
      ctx.fillStyle = fill
      ctx.fill(shape)
      ctx.restore()
    }
  }, [layer, points, theme])
  return <canvas ref={ref} data-flight-canvas="" aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full" />
}
