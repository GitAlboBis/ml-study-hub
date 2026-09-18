// L'area sotto una curva: una velatura della tinta del segno (circa il 12%), mai un blocco saturo; la curva
// sopra, con LinePath, porta il contorno. `xRange` limita la velatura a un intervallo [a, b] senza toccare i dati:
// è la probabilità P(a ≤ x ≤ b) che si colora sotto la densità, con i bordi esatti anche tra due campioni.
// Un'area per classe (`cls`) porta la forma della classe sul suo punto più alto: la velatura da sola è solo colore.
// Se sopra c'è già la LinePath della stessa classe, che ha il suo marcatore, qui si passa `marker={false}`.
import { useId, useMemo } from 'react'
import { area, curveLinear, curveMonotoneX, curveStep, type CurveFactory } from 'd3'
import { ClassMark } from './ClassMark'
import { roleVar, type VizRole } from './colors'
import type { PlotCurve } from './LinePath'
import { classVar, peakPixel } from './marks'
import { usePlot } from './Plot'

export interface AreaPathProps {
  /** coppie [x, y] nel dominio; va bene anche ciò che esce da `xs.map((x) => [x, f(x)])`, senza cast a tupla */
  data: readonly (readonly number[])[]
  /** predefinito 'estimate' */
  role?: VizRole
  /** indice di classe (0-5): vince sul ruolo */
  cls?: number
  /** quota da cui parte la velatura; predefinito 0, riportato dentro il dominio */
  baseline?: number
  /** colora solo tra a e b (coordinate del dominio) */
  xRange?: readonly [number, number]
  /** opacità della velatura; predefinito 0.12. Un'area messa in evidenza (spillo) regge fino a 0.4 */
  opacity?: number
  curve?: PlotCurve
  /** con `cls`, il marcatore della classe sul punto più alto dell'area; predefinito true */
  marker?: boolean
}

const CURVES: Record<PlotCurve, CurveFactory> = { linear: curveLinear, step: curveStep, monotone: curveMonotoneX }

export function AreaPath({ data, role = 'estimate', cls, baseline = 0, xRange, opacity = 0.12, curve = 'linear', marker = true }: AreaPathProps) {
  const { x, y, innerHeight, clipPath } = usePlot()
  const rangeId = `${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-range`
  const d = useMemo(() => {
    const [lo, hi] = y.domain()
    const base = y(Math.min(Math.max(baseline, Math.min(lo, hi)), Math.max(lo, hi)))
    return (
      area<readonly number[]>()
        .defined((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
        .x((p) => x(p[0]))
        .y0(base)
        .y1((p) => y(p[1]))
        .curve(CURVES[curve])([...data]) ?? ''
    )
  }, [data, x, y, baseline, curve])

  const lo = xRange?.[0]
  const hi = xRange?.[1]
  const peak = useMemo(
    () => (cls !== undefined && marker ? peakPixel(data, x, y, lo !== undefined && hi !== undefined ? [lo, hi] : undefined) : null),
    [cls, marker, data, x, y, lo, hi],
  )
  const mark = cls !== undefined && peak !== null ? <ClassMark cls={cls} x={peak[0]} y={peak[1]} /> : null

  const path = <path d={d} fill={cls !== undefined ? classVar(cls) : roleVar(role)} fillOpacity={opacity} stroke="none" />
  if (!xRange) {
    return (
      <g data-area="" pointerEvents="none">
        <g clipPath={clipPath}>{path}</g>
        {mark}
      </g>
    )
  }
  const a = x(Math.min(xRange[0], xRange[1]))
  const b = x(Math.max(xRange[0], xRange[1]))
  return (
    <g data-area="" pointerEvents="none">
      <g clipPath={clipPath}>
        <clipPath id={rangeId}>
          <rect x={Math.min(a, b)} y={0} width={Math.abs(b - a)} height={innerHeight} />
        </clipPath>
        <g clipPath={`url(#${rangeId})`}>{path}</g>
      </g>
      {mark}
    </g>
  )
}
