// Isolinee di un campo 2D: le curve di livello della carta. Fili sottili (1 px) a inchiostro attenuato, senza
// riempimento: la tinta la mette FieldCanvas, qui c'è solo la quota. Senza soglie esplicite si usano i confini
// delle 7 bande della rampa, quindi le isolinee cadono esattamente dove il terreno cambia tinta.
// d3-contour lavora sulla griglia (il punto ⟨i + 0.5, j + 0.5⟩ è il valore i + j·n) e chiude ogni poligono
// lungo il bordo della griglia: quei tratti di chiusura non sono curve di livello e qui si scartano, altrimenti
// attorno al campo comparirebbe un riquadro che non esiste.
// `animate`: le isolinee si tracciano una dopo l'altra, dal livello più basso, una volta sola al montaggio; ferme con
// reduced motion. Ogni isolinea ha per chiave il suo posto fra le soglie, non la quota: le quote seguono min e max del
// campo, e con la quota come chiave ogni cambio del campo (uno slider di h) rimontava tutte le isolinee da pathLength 0.
// Così cambia solo il tracciato `d` e le isolinee restano disegnate mentre si trascina.
// La griglia è quella di FieldCanvas (sharedField): sullo stesso campo la funzione si valuta una volta sola.
import { useMemo } from 'react'
import { contours } from 'd3'
import { motion } from 'motion/react'
import { useReducedMotion } from '../useReducedMotion'
import { bandThresholds, gridSize, roleVar, sharedField, valueRange, type VizRole } from './colors'
import { usePlot } from './Plot'

export interface ContoursProps {
  /** valore del campo nel punto (x, y) del dominio. Tenerla stabile con useCallback. */
  fn: (x: number, y: number) => number
  /** predefinito il dominio del grafico */
  xDomain?: readonly [number, number]
  yDomain?: readonly [number, number]
  /** colonne della griglia; predefinito 64, come FieldCanvas: stessa griglia, stesse quote */
  resolution?: number
  /** quote esplicite, oppure quante (equidistanti tra minimo e massimo); predefinito i 6 confini delle 7 bande */
  thresholds?: number | readonly number[]
  /** estremi dei valori, come `valueDomain` di FieldCanvas, per tagliare alle stesse quote */
  valueDomain?: readonly [number, number]
  /** divergente: quote simmetriche attorno allo zero, come la rampa --viz-div-* */
  diverging?: boolean
  /** predefinito 'boundary' (inchiostro) */
  role?: VizRole
  /** spessore in px; predefinito 1 */
  width?: number
  opacity?: number
  animate?: boolean
}

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

export function Contours({ fn, xDomain, yDomain, resolution = 64, thresholds, valueDomain, diverging = false, role = 'boundary', width = 1, opacity = 0.6, animate = false }: ContoursProps) {
  const { x, y, innerWidth, innerHeight, clipPath } = usePlot()
  const reduced = useReducedMotion()
  const [xa, xb] = xDomain ?? x.domain()
  const [ya, yb] = yDomain ?? y.domain()
  const left = Math.min(x(xa), x(xb))
  const top = Math.min(y(ya), y(yb))
  const spanW = Math.abs(x(xb) - x(xa))
  const spanH = Math.abs(y(yb) - y(ya))
  const { cols, rows } = gridSize(resolution, spanW || innerWidth, spanH || innerHeight)

  const grid = useMemo(() => sharedField(fn,[Math.min(xa, xb), Math.max(xa, xb)], [Math.min(ya, yb), Math.max(ya, yb)], cols, rows), [fn, xa, xb, ya, yb, cols, rows])
  const lo = valueDomain?.[0]
  const hi = valueDomain?.[1]
  const levels = useMemo(() => {
    if (typeof thresholds === 'object') return [...thresholds]
    const [a, b] = valueRange(grid, diverging, lo !== undefined && hi !== undefined ? [lo, hi] : undefined)
    return bandThresholds(a, b, (thresholds ?? 6) + 1)
  }, [thresholds, grid, diverging, lo, hi])

  const paths = useMemo(() => {
    const n = (v: number) => Number(v.toFixed(1))
    const px = (cx: number) => n(left + (cx / cols) * spanW)
    const py = (cy: number) => n(top + (cy / rows) * spanH)
    // i punti sul bordo della griglia li mette d3 per chiudere il poligono (anche in diagonale, negli angoli): un tratto
    // con entrambi gli estremi sul bordo è chiusura; con un solo estremo è l'isolinea che arriva fino alla cornice
    const onBorder = (p: number[]) => p[0] === 0 || p[0] === cols || p[1] === 0 || p[1] === rows
    const onEdge = (a: number[], b: number[]) => onBorder(a) && onBorder(b)
    const shapes = contours().size([cols, rows]).thresholds(levels)(Array.from(grid.values))
    return shapes.map((shape) => {
      let d = ''
      for (const polygon of shape.coordinates) {
        for (const ring of polygon) {
          let open = false
          let whole = true
          for (let k = 1; k < ring.length; k++) {
            const a = ring[k - 1]
            const b = ring[k]
            if (onEdge(a, b)) {
              open = false
              whole = false
              continue
            }
            if (!open) d += `M${px(a[0])},${py(a[1])}`
            open = true
            d += `L${px(b[0])},${py(b[1])}`
          }
          if (whole && open) d += 'Z'
        }
      }
      return { level: shape.value, d }
    })
  }, [grid, levels, cols, rows, left, top, spanW, spanH])

  const moving = animate && !reduced
  return (
    <g data-contours="" clipPath={clipPath} pointerEvents="none" fill="none" stroke={roleVar(role)} strokeWidth={width} strokeOpacity={opacity} strokeLinejoin="round">
      {paths.map((p, i) =>
        moving ? (
          <motion.path key={i} d={p.d} fill="none" strokeWidth={width} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: i * 0.12, ease: EASE_IN_OUT }} />
        ) : (
          <path key={i} d={p.d} fill="none" strokeWidth={width} />
        ),
      )}
    </g>
  )
}
