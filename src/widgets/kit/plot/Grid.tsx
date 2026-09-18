// Reticolo della carta: fili pieni e sottili, un passo sopra la superficie (--viz-grid). Mai tratteggiato: il
// tratteggio nel mondo dell'atlante vuol dire "verità a terra", non "griglia". Va messo prima dei segni, così
// resta sotto. Con le stesse `ticks` di Axis le linee cadono sulle tacche.
import { usePlot } from './Plot'

export interface GridProps {
  /** quali fili disegnare; predefinito entrambi */
  axis?: 'x' | 'y' | 'both'
  /** tacche dei fili verticali: come `ticks` di Axis */
  xTicks?: number | readonly number[]
  /** tacche dei fili orizzontali */
  yTicks?: number | readonly number[]
}

export function Grid({ axis = 'both', xTicks, yTicks }: GridProps) {
  const { x, y, innerWidth, innerHeight, ticks } = usePlot()
  return (
    <g data-grid="" aria-hidden="true" pointerEvents="none" stroke="var(--viz-grid)" strokeWidth={1} shapeRendering="crispEdges">
      {axis !== 'y' ? ticks('x', xTicks).map((t) => <line key={`x${t}`} stroke="var(--viz-grid)" x1={x(t)} x2={x(t)} y1={0} y2={innerHeight} />) : null}
      {axis !== 'x' ? ticks('y', yTicks).map((t) => <line key={`y${t}`} stroke="var(--viz-grid)" x1={0} x2={innerWidth} y1={y(t)} y2={y(t)} />) : null}
    </g>
  )
}
