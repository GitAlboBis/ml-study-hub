// Una curva nel dominio del grafico: p̂(x), la densità vera, un kernel, una frontiera.
// - 2 px, giunti e capi tondi, ritagliata sull'area interna; il colore viene dal ruolo o dalla classe, mai scritto a mano;
// - la "verità a terra" (role="truth") è tratteggiata per convenzione del mondo: non serve chiederlo;
// - la linea in evidenza (accent / highlight) è ocra: sulla carta chiara un giallo non arriva a 3:1, quindi porta
//   un bordino a inchiostro come le strade sulle carte; di notte il bordino ha il colore del fondo e sparisce;
// - `animate`: il tracciato si disegna una volta sola al montaggio (pathLength di motion). Per rifarlo si cambia
//   `key`. Una linea tratteggiata non può usare pathLength (occupa lo stesso stroke-dasharray): compare in
//   dissolvenza. Con prefers-reduced-motion la curva è già lì.
// - una curva per classe (`cls`) porta anche la forma della classe (ClassMark) sul suo punto visibile più alto: il
//   colore da solo non distingue blu e viola per chi è deuteranope, e il tratteggio qui vuol già dire "verità".
import { useMemo } from 'react'
import { curveLinear, curveMonotoneX, curveStep, line, type CurveFactory } from 'd3'
import { motion } from 'motion/react'
import { useReducedMotion } from '../useReducedMotion'
import { ClassMark } from './ClassMark'
import { roleVar, type VizRole } from './colors'
import { classVar, peakPixel } from './marks'
import { usePlot } from './Plot'

export type PlotCurve = 'linear' | 'step' | 'monotone'

export interface LinePathProps {
  /** coppie [x, y] nel dominio; va bene anche ciò che esce da `xs.map((x) => [x, f(x)])`, senza cast a tupla */
  data: readonly (readonly number[])[]
  /** predefinito 'estimate' */
  role?: VizRole
  /** indice di classe (0-5): vince sul ruolo, per le curve per classe come p(x|ω₁) e p(x|ω₂) */
  cls?: number
  /** predefinito: tratteggiata solo la verità a terra */
  dashed?: boolean
  animate?: boolean
  /** 'linear' unisce i punti, 'step' fa i gradini (istogrammi, K-NN), 'monotone' liscia senza inventare massimi */
  curve?: PlotCurve
  /** spessore in px; predefinito 2 */
  width?: number
  /** durata del tracciamento in ms; predefinito 900 */
  durationMs?: number
  /** con `cls`, il marcatore della classe sul punto più alto della curva; predefinito true */
  marker?: boolean
}

const CURVES: Record<PlotCurve, CurveFactory> = { linear: curveLinear, step: curveStep, monotone: curveMonotoneX }
const DASH = '6 4'
/** come --ease-in-out dei token: un tratto di penna parte e arriva piano */
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

export function LinePath({ data, role = 'estimate', cls, dashed, animate = false, curve = 'linear', width = 2, durationMs = 900, marker = true }: LinePathProps) {
  const { x, y, clipPath } = usePlot()
  const reduced = useReducedMotion()
  const d = useMemo(
    () =>
      line<readonly number[]>()
        .defined((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
        .x((p) => x(p[0]))
        .y((p) => y(p[1]))
        .curve(CURVES[curve])([...data]) ?? '',
    [data, x, y, curve],
  )

  const isDashed = dashed ?? role === 'truth'
  const cased = cls === undefined && (role === 'accent' || role === 'highlight')
  const strokes = [
    ...(cased ? [{ key: 'casing', stroke: 'var(--pin-contrast)', strokeWidth: width + 2 }] : []),
    { key: 'line', stroke: cls !== undefined ? classVar(cls) : roleVar(role), strokeWidth: width },
  ]
  const moving = animate && !reduced
  const peak = useMemo(() => (cls !== undefined && marker ? peakPixel(data, x, y) : null), [cls, marker, data, x, y])

  return (
    <g data-line="" pointerEvents="none">
      <g clipPath={clipPath}>
        {strokes.map((s) => {
          const common = { d, fill: 'none', stroke: s.stroke, strokeWidth: s.strokeWidth, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
          if (!moving) return <path key={s.key} {...common} strokeDasharray={isDashed ? DASH : undefined} />
          const transition = { duration: durationMs / 1000, ease: EASE_IN_OUT }
          return isDashed ? (
            <motion.path key={s.key} {...common} strokeDasharray={DASH} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transition} />
          ) : (
            <motion.path key={s.key} {...common} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} />
          )
        })}
      </g>
      {/* fuori dal ritaglio: un picco sul bordo alto non perde metà del marcatore */}
      {cls !== undefined && peak !== null ? <ClassMark cls={cls} x={peak[0]} y={peak[1]} appearAfterMs={moving ? durationMs * 0.8 : undefined} /> : null}
    </g>
  )
}
