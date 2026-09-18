// Campo scalare 2D su canvas: il "terreno" dell'atlante (una densità, una funzione di costo, un discriminante).
// - La funzione si valuta su una griglia grossolana (`resolution` colonne, celle quadrate); ogni pixel del
//   canvas interpola poi bilinearmente i quattro valori vicini e prende il colore dalla rampa. Così poche
//   valutazioni bastano e i confini tra le bande restano lisci e nitidi alla densità dello schermo.
// - A bande per scelta del mondo (tinte ipsometriche: 7 passi, confini netti, gli stessi di <Contours />);
//   `smooth` sfuma. La rampa è --viz-seq-* (una tinta, poco -> tanto) o --viz-div-* (due tinte e un grigio
//   neutro al centro, con il dominio dei valori simmetrico attorno allo zero). Mai un arcobaleno.
// - Nitido: il canvas ha innerWidth × devicePixelRatio pixel veri (con un tetto, perché il costo cresce con i pixel).
// - Si ridisegna solo se cambiano la funzione, i domini, la misura, la densità dello schermo o il tema. `fn`
//   va quindi tenuta stabile con useCallback: una funzione nuova a ogni render è un campo nuovo a ogni render.
// - Budget del fotogramma. Quando il campo cambia di continuo (uno slider trascinato, uno storyboard) un disegno a
//   piena densità, fino a 1,6 Mpx, costa 20 ms solo di pittura: lo strato allora disegna con meno pixel (circa
//   0,5 Mpx) e, appena ci si ferma, ridisegna a piena densità. Un cambio isolato (un passo da tastiera) resta nitido.
//   La tabella dei colori si rilegge solo al cambio di tema e l'ImageData si riusa tra un disegno e l'altro.
import { useCallback, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { divColors, gridSize, imageBuffer, rampLut, seqColors, sharedField, useThemeVersion, valueRange, type FieldGrid } from './colors'
import { usePlot } from './Plot'

/** Oltre 2 i pixel in più non si vedono su un campo continuo, ma si pagano tutti. */
const MAX_RATIO = 2
const MAX_PIXELS = 1_600_000
/** Tetto dei pixel durante un gesto continuo: la pittura resta sotto i 7-8 ms. */
const MOVING_PIXELS = 480_000
/** Due disegni più vicini di così fanno parte di un gesto continuo. */
const QUICK_MS = 120
/** Dopo l'ultimo disegno ravvicinato, quanto aspettare prima di ridisegnare a piena densità. */
const SETTLE_MS = 180

// --- densità dello schermo, reattiva: cambia trascinando la finestra su un altro monitor o con lo zoom ---

const readRatio = (): number => (typeof window !== 'undefined' && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1)

function subscribeRatio(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  // la media query vale per la densità di adesso: quando smette di valere si riascolta quella nuova
  let mql: MediaQueryList | null = null
  const listen = () => {
    mql?.removeEventListener?.('change', fire)
    mql = window.matchMedia(`(resolution: ${readRatio()}dppx)`)
    mql.addEventListener?.('change', fire)
  }
  const fire = () => {
    listen()
    onChange()
  }
  listen()
  return () => mql?.removeEventListener?.('change', fire)
}

const useDevicePixelRatio = (): number => useSyncExternalStore(subscribeRatio, readRatio, () => 1)

// --- strato canvas condiviso ---

export interface CanvasLayerProps {
  /** rettangolo del dominio coperto dal canvas; predefinito tutta l'area del grafico */
  xDomain?: readonly [number, number]
  yDomain?: readonly [number, number]
  /**
   * Disegna su un canvas di `width` × `height` pixel veri. Deve essere stabile (useCallback): cambia identità solo
   * quando cambiano i dati. I colori si leggono qui dentro, oppure in un useMemo che dipende da useThemeVersion: al
   * cambio di tema lo strato richiama `draw`. `ratio` può essere più basso della densità dello schermo durante un gesto
   * continuo (vedi MOVING_PIXELS): chi disegna linee lo usa per lo spessore.
   */
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, ratio: number) => void
  opacity?: number
}

/**
 * Un canvas allineato all'area del grafico, sotto l'SVG, nitido alla densità dello schermo. È il pezzo comune di
 * FieldCanvas e BoundaryCanvas; serve anche a chi deve disegnare migliaia di segni che in SVG peserebbero troppo.
 */
export function CanvasLayer({ xDomain, yDomain, draw, opacity }: CanvasLayerProps) {
  const { x, y, layer, innerWidth, innerHeight } = usePlot()
  const themeVersion = useThemeVersion()
  const deviceRatio = useDevicePixelRatio()
  const ref = useRef<HTMLCanvasElement>(null)

  const [xa, xb] = xDomain ?? x.domain()
  const [ya, yb] = yDomain ?? y.domain()
  const left = Math.min(x(xa), x(xb))
  const top = Math.min(y(ya), y(yb))
  const cssW = Math.abs(x(xb) - x(xa))
  const cssH = Math.abs(y(yb) - y(ya))
  const area = Math.max(1, cssW * cssH)
  const ratio = Math.max(0.5, Math.min(deviceRatio, MAX_RATIO, Math.sqrt(MAX_PIXELS / area)))
  const light = Math.max(0.5, Math.min(ratio, Math.sqrt(MOVING_PIXELS / area)))
  /** istante dell'ultimo disegno (performance.now): due disegni ravvicinati sono un gesto continuo */
  const lastDraw = useRef(Number.NEGATIVE_INFINITY)

  // effetto di layout: si disegna prima del paint, così un ridimensionamento (che svuota il canvas) non lampeggia
  useLayoutEffect(() => {
    const canvas = ref.current
    if (canvas === null) return
    const paint = (r: number) => {
      const pw = Math.max(1, Math.round(cssW * r))
      const ph = Math.max(1, Math.round(cssH * r))
      if (canvas.width !== pw) canvas.width = pw
      if (canvas.height !== ph) canvas.height = ph
      const ctx = canvas.getContext('2d')
      if (ctx === null) return
      ctx.clearRect(0, 0, pw, ph)
      draw(ctx, pw, ph, r)
    }
    const now = performance.now()
    const quick = now - lastDraw.current < QUICK_MS
    lastDraw.current = now
    if (!quick || light >= ratio) {
      paint(ratio)
      return
    }
    // in mezzo a un gesto: pochi pixel adesso, piena densità quando il campo smette di cambiare
    paint(light)
    const settle = setTimeout(() => paint(ratio), SETTLE_MS)
    return () => clearTimeout(settle)
  }, [draw, cssW, cssH, ratio, light, layer, themeVersion])

  if (layer === null) return null
  const pct = (part: number, whole: number) => `${(part / whole) * 100}%`
  return createPortal(
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', left: pct(left, innerWidth), top: pct(top, innerHeight), width: pct(cssW, innerWidth), height: pct(cssH, innerHeight), opacity }}
    />,
    layer,
  )
}

// --- campo scalare ---

export interface FieldCanvasProps {
  /** valore del campo nel punto (x, y) del dominio. Tenerla stabile con useCallback. */
  fn: (x: number, y: number) => number
  /** predefinito il dominio del grafico */
  xDomain?: readonly [number, number]
  yDomain?: readonly [number, number]
  /** colonne della griglia di valutazione; predefinito 64. Le righe seguono, a celle quadrate */
  resolution?: number
  colormap?: 'sequential' | 'diverging'
  /** valori agli estremi della rampa; predefinito min-max del campo (simmetrico attorno a 0 se divergente) */
  valueDomain?: readonly [number, number]
  /** sfumatura continua invece delle bande */
  smooth?: boolean
  opacity?: number
}

export function FieldCanvas({ fn, xDomain, yDomain, resolution = 64, colormap = 'sequential', valueDomain, smooth = false, opacity }: FieldCanvasProps) {
  const { x, y, innerWidth, innerHeight } = usePlot()
  const [xa, xb] = xDomain ?? x.domain()
  const [ya, yb] = yDomain ?? y.domain()
  const spanW = Math.abs(x(xb) - x(xa))
  const spanH = Math.abs(y(yb) - y(ya))
  const { cols, rows } = gridSize(resolution, spanW || innerWidth, spanH || innerHeight)

  const grid = useMemo(() => sharedField(fn, [Math.min(xa, xb), Math.max(xa, xb)], [Math.min(ya, yb), Math.max(ya, yb)], cols, rows), [fn, xa, xb, ya, yb, cols, rows])
  const lo = valueDomain?.[0]
  const hi = valueDomain?.[1]
  // la tabella dei colori dipende solo dalla rampa e dal tema: si rilegge (getComputedStyle) solo quando cambiano
  const themeVersion = useThemeVersion()
  const lut = useMemo(() => {
    void themeVersion // i colori vengono dai token del tema corrente: al cambio di tema la tabella si rilegge
    return rampLut(colormap === 'diverging' ? divColors() : seqColors(), smooth)
  }, [colormap, smooth, themeVersion])
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const range = valueRange(grid, colormap === 'diverging', lo !== undefined && hi !== undefined ? [lo, hi] : undefined)
      // campo piatto: il primo passo della rampa sequenziale, il grigio neutro al centro di quella divergente
      paintField(ctx, grid, range, lut, width, height, colormap === 'diverging' ? Math.floor(lut.length / 2) : 0)
    },
    [grid, colormap, lut, lo, hi],
  )
  return <CanvasLayer xDomain={xDomain} yDomain={yDomain} draw={draw} opacity={opacity} />
}

/** Interpolazione bilineare dalla griglia (valori al centro delle celle) a ogni pixel, poi colore dalla tabella. */
function paintField(ctx: CanvasRenderingContext2D, grid: FieldGrid, [lo, hi]: [number, number], lut: Uint32Array, width: number, height: number, flatIndex: number) {
  const { values, cols, rows } = grid
  const img = imageBuffer(ctx, width, height)
  const out = new Uint32Array(img.data.buffer)
  const flat = !(hi > lo)
  const scale = flat ? 0 : lut.length / (hi - lo)
  const last = lut.length - 1

  // pesi orizzontali, uguali per tutte le righe: si calcolano una volta
  const i0 = new Int32Array(width)
  const i1 = new Int32Array(width)
  const fx = new Float64Array(width)
  for (let px = 0; px < width; px++) {
    const u = Math.min(Math.max(((px + 0.5) / width) * cols - 0.5, 0), cols - 1)
    i0[px] = Math.floor(u)
    i1[px] = Math.min(i0[px] + 1, cols - 1)
    fx[px] = u - i0[px]
  }
  for (let py = 0; py < height; py++) {
    const v = Math.min(Math.max(((py + 0.5) / height) * rows - 0.5, 0), rows - 1)
    const j0 = Math.floor(v)
    const fy = v - j0
    const r0 = j0 * cols
    const r1 = Math.min(j0 + 1, rows - 1) * cols
    const o = py * width
    for (let px = 0; px < width; px++) {
      const a = values[r0 + i0[px]]
      const b = values[r0 + i1[px]]
      const c = values[r1 + i0[px]]
      const d = values[r1 + i1[px]]
      const value = (a + (b - a) * fx[px]) * (1 - fy) + (c + (d - c) * fx[px]) * fy
      // un valore non finito lascia vedere la carta: nessun colore è meglio di un colore falso (0 = trasparente;
      // il buffer si riusa, quindi anche il pixel trasparente va scritto)
      if (value !== value || value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY) {
        out[o + px] = 0
        continue
      }
      const k = flat ? flatIndex : Math.floor((value - lo) * scale)
      out[o + px] = lut[k < 0 ? 0 : k > last ? last : k]
    }
  }
  ctx.putImageData(img, 0, 0)
}
