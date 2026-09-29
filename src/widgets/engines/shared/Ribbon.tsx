// Fascia fra due curve dentro un <Plot>: la banda ±σ attorno a una media, l'intervallo di confidenza o di
// credibilità, la banda delle 50 repliche, la fascia del residuo fra un profilo e la sua ricostruzione. Come
// AreaPath è una velatura leggera (mai un blocco saturo); i bordi, se servono, sono fili sottili.
//
// - `data`: terne [x, basso, alto] nel dominio; i punti con un valore non finito interrompono la fascia.
// - Una fascia della verità a terra ha i bordi tratteggiati (il tratteggio vuol dire solo questo).
// - Una fascia per classe porta la forma della classe sul suo punto più alto: la velatura da sola è solo colore.
// - `xRange` limita la fascia a un intervallo senza toccare i dati.
import { useId, useMemo } from 'react'
import { area, curveLinear, curveMonotoneX, curveStep, line, type CurveFactory } from 'd3'
import { ClassMark } from '../../kit/plot/ClassMark'
import { roleVar, type VizRole } from '../../kit/plot/colors'
import type { PlotCurve } from '../../kit/plot/LinePath'
import { classVar, peakPixel } from '../../kit/plot/marks'
import { usePlot } from '../../kit/plot/Plot'

export interface RibbonProps {
  /** terne [x, basso, alto] nel dominio */
  data: readonly (readonly number[])[]
  /** predefinito 'estimate' */
  role?: VizRole
  cls?: number
  /** opacità della velatura; predefinito 0.16 */
  opacity?: number
  /** fili sottili sui due bordi */
  edges?: boolean
  curve?: PlotCurve
  xRange?: readonly [number, number]
  /** con `cls`, il marcatore della classe sul punto più alto; predefinito true */
  marker?: boolean
}

const CURVES: Record<PlotCurve, CurveFactory> = { linear: curveLinear, step: curveStep, monotone: curveMonotoneX }
const ok = (p: readonly number[]) => Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2])

export function Ribbon({ data, role = 'estimate', cls, opacity = 0.16, edges = false, curve = 'linear', xRange, marker = true }: RibbonProps) {
  const { x, y, innerHeight, clipPath } = usePlot()
  const rangeId = `${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-ribbon`
  const color = cls !== undefined ? classVar(cls) : roleVar(role)
  const f = CURVES[curve]
  const body = useMemo(
    () =>
      area<readonly number[]>()
        .defined(ok)
        .x((p) => x(p[0]))
        .y0((p) => y(p[1]))
        .y1((p) => y(p[2]))
        .curve(f)([...data]) ?? '',
    [data, x, y, f],
  )
  const rims = useMemo(() => {
    if (!edges) return null
    const mk = (k: 1 | 2) =>
      line<readonly number[]>()
        .defined(ok)
        .x((p) => x(p[0]))
        .y((p) => y(p[k]))
        .curve(f)([...data]) ?? ''
    return [mk(1), mk(2)]
  }, [edges, data, x, y, f])
  const peak = useMemo(
    () => (cls !== undefined && marker ? peakPixel(data.filter(ok).map((p) => [p[0], p[2]]), x, y, xRange) : null),
    [cls, marker, data, x, y, xRange],
  )

  const shape = (
    <>
      <path d={body} fill={color} fillOpacity={opacity} stroke="none" />
      {rims?.map((d, i) => <path key={i} d={d} fill="none" stroke={color} strokeOpacity={0.8} strokeWidth={1} strokeDasharray={role === 'truth' && cls === undefined ? '6 4' : undefined} />)}
    </>
  )
  const a = xRange ? x(Math.min(xRange[0], xRange[1])) : 0
  const b = xRange ? x(Math.max(xRange[0], xRange[1])) : 0
  return (
    <g data-ribbon="" pointerEvents="none">
      <g clipPath={clipPath}>
        {xRange ? (
          <>
            <clipPath id={rangeId}>
              <rect x={Math.min(a, b)} y={0} width={Math.abs(b - a)} height={innerHeight} />
            </clipPath>
            <g clipPath={`url(#${rangeId})`}>{shape}</g>
          </>
        ) : (
          shape
        )}
      </g>
      {peak !== null && cls !== undefined ? <ClassMark cls={cls} x={peak[0]} y={peak[1] - 9} /> : null}
    </g>
  )
}
