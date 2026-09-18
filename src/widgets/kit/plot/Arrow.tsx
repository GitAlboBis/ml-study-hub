// Freccia tra due punti del dominio: il vettore dei pesi w, un autovettore della PCA, il passo del gradiente,
// l'ampiezza del margine di una SVM (`double`). La punta è disegnata a mano e non con <marker>: un marker non
// eredita il colore dell'asta e avrebbe bisogno di un id per ogni colore. L'asta si ferma alla base della punta,
// così la punta resta aguzza. L'etichetta è a inchiostro (mai del colore del segno) con un alone di superficie,
// come i toponimi sulle carte: si legge anche sopra un campo colorato o una curva.
// Una freccia per classe (`cls`) porta la forma della classe a metà dell'asta: il colore da solo non basta.
import { ClassMark } from './ClassMark'
import { roleVar, type VizRole } from './colors'
import { classVar } from './marks'
import { usePlot } from './Plot'

export interface ArrowProps {
  /** coda, nel dominio */
  from: readonly [number, number]
  /** punta, nel dominio */
  to: readonly [number, number]
  /** predefinito 'boundary' (inchiostro) */
  role?: VizRole
  /** indice di classe (0-5): vince sul ruolo */
  cls?: number
  dashed?: boolean
  /** punta anche sulla coda: una misura, non una direzione */
  double?: boolean
  /** scritta accanto alla punta: "w", "∇J" */
  label?: string
  /** spessore dell'asta in px; predefinito 2 */
  width?: number
  /** lunghezza della punta in px; predefinito 9 */
  head?: number
}

export function Arrow({ from, to, role = 'boundary', cls, dashed = false, double = false, label, width = 2, head = 9 }: ArrowProps) {
  const { x, y } = usePlot()
  const x1 = x(from[0])
  const y1 = y(from[1])
  const x2 = x(to[0])
  const y2 = y(to[1])
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (!Number.isFinite(len) || len < 1e-6) return null

  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  // una freccia più corta della sua punta tiene una punta in proporzione
  const h = Math.min(head, len * (double ? 0.4 : 0.8))
  const half = h * 0.42
  const color = cls !== undefined ? classVar(cls) : roleVar(role)
  const n = (v: number) => Number(v.toFixed(2))
  const tip = (px: number, py: number, dir: 1 | -1) =>
    `M${n(px)},${n(py)}L${n(px - dir * ux * h - uy * half)},${n(py - dir * uy * h + ux * half)}L${n(px - dir * ux * h + uy * half)},${n(py - dir * uy * h - ux * half)}Z`

  return (
    <g data-arrow="" pointerEvents="none">
      <line
        x1={n(double ? x1 + ux * h * 0.9 : x1)}
        y1={n(double ? y1 + uy * h * 0.9 : y1)}
        x2={n(x2 - ux * h * 0.9)}
        y2={n(y2 - uy * h * 0.9)}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="butt"
        strokeDasharray={dashed ? '6 4' : undefined}
      />
      <path data-head="" d={tip(x2, y2, 1)} fill={color} />
      {double ? <path data-head="" d={tip(x1, y1, -1)} fill={color} /> : null}
      {cls !== undefined ? <ClassMark cls={cls} x={(x1 + x2) / 2} y={(y1 + y2) / 2} /> : null}
      {label ? (
        <text
          className="num"
          fontSize={13}
          fontWeight={600}
          x={n(x2 + ux * 8)}
          y={n(y2 + uy * 8)}
          dy="0.32em"
          textAnchor={ux > 0.3 ? 'start' : ux < -0.3 ? 'end' : 'middle'}
          fill="var(--text)"
          stroke="var(--surface)"
          strokeWidth={3}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {label}
        </text>
      ) : null}
    </g>
  )
}
