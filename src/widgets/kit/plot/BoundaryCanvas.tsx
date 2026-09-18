// Regioni di decisione su canvas: la carta tematica di un classificatore. Ogni cella della griglia prende il
// campo (--viz-field-*) della classe che `classify` le assegna; le celle restano pixel netti, come in una
// classificazione da satellite: le etichette non si interpolano, tra la classe 0 e la 2 non c'è una classe 1.
// Il confine tra due regioni si ripassa a inchiostro (--viz-boundary), perché un campo pieno porta sempre il
// suo confine e due tinte chiare vicine da sole non bastano a chi distingue male i colori.
// Classi da 0, come `cls` di Dots; un valore non valido (negativo, NaN) lascia vedere la carta: "non classificato".
// Come per FieldCanvas, `classify` va tenuta stabile con useCallback.
import { useCallback, useMemo } from 'react'
import { fieldColor, gridSize, imageBuffer, packRgba, parseColor, vizColor } from './colors'
import { CanvasLayer } from './FieldCanvas'
import { usePlot } from './Plot'

export interface BoundaryCanvasProps {
  /** classe (0-5) del punto (x, y) del dominio. Tenerla stabile con useCallback. */
  classify: (x: number, y: number) => number
  /** predefinito il dominio del grafico */
  xDomain?: readonly [number, number]
  yDomain?: readonly [number, number]
  /** colonne della griglia; predefinito 120. Le righe seguono, a celle quadrate */
  resolution?: number
  /** ripassa a inchiostro il confine tra le regioni; predefinito true */
  outline?: boolean
  opacity?: number
}

const CLASSES = 6
const NONE = -1

export function BoundaryCanvas({ classify, xDomain, yDomain, resolution = 120, outline = true, opacity }: BoundaryCanvasProps) {
  const { x, y, innerWidth, innerHeight } = usePlot()
  const [xa, xb] = xDomain ?? x.domain()
  const [ya, yb] = yDomain ?? y.domain()
  const spanW = Math.abs(x(xb) - x(xa))
  const spanH = Math.abs(y(yb) - y(ya))
  const { cols, rows } = gridSize(resolution, spanW || innerWidth, spanH || innerHeight)

  const labels = useMemo(() => {
    const out = new Int8Array(cols * rows)
    const x0 = Math.min(xa, xb)
    const y1 = Math.max(ya, yb)
    const dx = Math.abs(xb - xa) / cols
    const dy = Math.abs(yb - ya) / rows
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const c = classify(x0 + (i + 0.5) * dx, y1 - (j + 0.5) * dy)
        out[j * cols + i] = Number.isInteger(c) && c >= 0 ? c % CLASSES : NONE
      }
    }
    return out
  }, [classify, xa, xb, ya, yb, cols, rows])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, ratio: number) => {
      const fields = Array.from({ length: CLASSES }, (_, i) => packRgba(parseColor(fieldColor(i))))
      // il buffer si riusa da un disegno all'altro: ogni pixel si scrive, 0 (trasparente) dove non c'è classe
      const img = imageBuffer(ctx, width, height)
      const out = new Uint32Array(img.data.buffer)
      const col = new Int32Array(width)
      for (let px = 0; px < width; px++) col[px] = Math.min(cols - 1, Math.floor((px / width) * cols))
      for (let py = 0; py < height; py++) {
        const r = Math.min(rows - 1, Math.floor((py / height) * rows)) * cols
        const o = py * width
        for (let px = 0; px < width; px++) {
          const c = labels[r + col[px]]
          out[o + px] = c !== NONE ? fields[c] : 0
        }
      }
      ctx.putImageData(img, 0, 0)
      if (!outline) return

      // confine: i lati condivisi da due celle di classe diversa, su un solo tracciato
      const ex = (i: number) => Math.round((i / cols) * width)
      const ey = (j: number) => Math.round((j / rows) * height)
      let segments = 0
      ctx.beginPath()
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const c = labels[j * cols + i]
          if (i + 1 < cols && labels[j * cols + i + 1] !== c) {
            ctx.moveTo(ex(i + 1), ey(j))
            ctx.lineTo(ex(i + 1), ey(j + 1))
            segments++
          }
          if (j + 1 < rows && labels[(j + 1) * cols + i] !== c) {
            ctx.moveTo(ex(i), ey(j + 1))
            ctx.lineTo(ex(i + 1), ey(j + 1))
            segments++
          }
        }
      }
      if (segments === 0) return
      ctx.strokeStyle = vizColor('boundary')
      ctx.lineWidth = Math.max(1, Math.round(1.5 * ratio))
      // capi squadrati: negli angoli della scaletta i segmenti si chiudono senza tacche
      ctx.lineCap = 'square'
      ctx.stroke()
    },
    [labels, cols, rows, outline],
  )
  return <CanvasLayer xDomain={xDomain} yDomain={yDomain} draw={draw} opacity={opacity} />
}
