// Istogramma di un campione, con la stessa funzione `histogram` della libreria numerica: ciò che il widget calcola
// e ciò che si vede sono gli stessi numeri. Con `normalize` l'altezza è la densità K / (N · larghezza), quindi
// l'istogramma si confronta sulla stessa scala con la pdf vera e con le stime.
// - Tra due barre che si toccano resta un varco di 2 px del colore della superficie: niente bordi attorno ai segni.
// - `tone="wash"` (predefinito): velatura della tinta con il ciglio pieno di 2 px in cima, così le curve disegnate
//   sopra (stima, verità a terra) restano leggibili; `tone="solid"` per l'istogramma da solo.
// - Angoli vivi, come tutto l'atlante: qui la regola del mondo vince sulle estremità arrotondate della skill dataviz.
// - `animate` muove gli attributi y e height dei rettangoli: è ridisegno dell'SVG, non layout della pagina, su una
//   superficie piccola e isolata, per 240 ms e una volta sola a ogni cambio dei dati. Nessun ciclo continuo.
// - Ogni bin risponde al puntatore con intervallo, conteggio e densità. Non è una tappa di tabulazione: trenta bin
//   sarebbero trenta Tab; da tastiera si legge con il cursore-quota del Plot (`cursor="x"`), che si aggancia al bin
//   sotto di sé e ne dice intervallo e conteggio (il bin si registra nel Plot con registerReadable).
// - Un istogramma per classe (`cls`) porta la forma della classe sopra il bin più alto (ClassMark): due istogrammi
//   velati che si sovrappongono non si distinguono dal solo colore.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { format } from 'd3'
import { motion } from 'motion/react'
import { histogram } from '../../../lib/ml/stats'
import type { HistogramBin } from '../../../lib/ml/stats'
import { useReducedMotion } from '../useReducedMotion'
import { ClassMark } from './ClassMark'
import { roleVar, type VizRole } from './colors'
import { classVar } from './marks'
import { usePlot } from './Plot'

export interface HistogramProps {
  values: readonly number[]
  /** numero di bin di pari larghezza; predefinito 10 */
  bins?: number
  /** intervallo coperto dai bin; predefinito il dominio x del grafico */
  domain?: readonly [number, number]
  /** altezza = densità K / (N · larghezza) invece del conteggio K */
  normalize?: boolean
  /** predefinito 'sample' */
  role?: VizRole
  /** indice di classe (0-5): vince sul ruolo */
  cls?: number
  tone?: 'wash' | 'solid'
  /** le barre raggiungono la nuova altezza in 240 ms (anche al montaggio, da zero); ferme con reduced motion */
  animate?: boolean
  format?: (value: number) => string
}

const GAP = 2
const CAP = 2
/** Distanza con cui il bin sotto il cursore-quota compete con gli altri segni (un punto dei Dots entro 12 px vince). */
const BIN_REACH = 12
const compact = format('.3~g')
/** come --ease-out dei token */
const EASE_OUT = [0.2, 0.8, 0.2, 1] as const

export function Histogram({ values, bins = 10, domain, normalize = false, role = 'sample', cls, tone = 'wash', animate = false, format: fmt = compact }: HistogramProps) {
  const { x, y, clipPath, showTip, registerReadable } = usePlot()
  const reduced = useReducedMotion()
  const [xa, xb] = x.domain()
  const lo = domain?.[0] ?? Math.min(xa, xb)
  const hi = domain?.[1] ?? Math.max(xa, xb)
  // `histogram` rifiuta un dominio vuoto o un numero di bin non intero: qui un grafico a metà non deve far cadere il widget
  const cells = useMemo(() => (hi > lo ? histogram(values, Math.max(1, Math.round(bins)), [lo, hi]) : []), [values, bins, lo, hi])

  const fill = cls !== undefined ? classVar(cls) : roleVar(role)
  const [ya, yb] = y.domain()
  const zero = y(Math.min(Math.max(0, Math.min(ya, yb)), Math.max(ya, yb)))
  const moving = animate && !reduced
  const transition = { duration: 0.24, ease: EASE_OUT }

  // --- lettura per il cursore-quota: il bin che contiene l'ascissa del cursore ---
  const say = (b: HistogramBin, last: boolean) => `[${fmt(b.x0)}, ${fmt(b.x1)}${last ? ']' : ')'} · K = ${b.count}${normalize ? ` · p̂ = ${fmt(b.density)}` : ''}`
  const latest = useRef({ cells, x, say })
  useLayoutEffect(() => {
    latest.current = { cells, x, say }
  })
  useEffect(
    () =>
      registerReadable({
        named: '',
        nearest(px) {
          const { cells: bins, x: sx, say: speak } = latest.current
          const at = sx.invert(px)
          const i = bins.findIndex((b, k) => at >= b.x0 && (at < b.x1 || (k === bins.length - 1 && at <= b.x1)))
          // il bin copre tutta la colonna: gli si dà una distanza di 12 px, così un punto più vicino di così vince
          return i < 0 ? null : { distance: BIN_REACH, text: speak(bins[i], i === bins.length - 1) }
        },
      }),
    [registerReadable],
  )

  // il marcatore di classe sta sopra il bin più alto: un'etichetta diretta per tutto l'istogramma
  let tallest = -1
  if (cls !== undefined) for (let i = 0; i < cells.length; i++) if (cells[i].count > 0 && (tallest < 0 || cells[i].count > cells[tallest].count)) tallest = i

  return (
    <g data-histogram="">
      <g clipPath={clipPath}>
        {cells.map((b, i) => {
          const left = x(b.x0)
          const right = x(b.x1)
          const w = Math.max(1, Math.abs(right - left) - GAP)
          const px = Math.min(left, right) + GAP / 2
          const top = Math.min(y(normalize ? b.density : b.count), zero)
          const h = zero - top
          const closing = i === cells.length - 1 ? ']' : ')'
          const tip = () =>
            showTip({ x: px + w / 2, y: top, value: normalize ? `p̂ = ${fmt(b.density)}` : `K = ${b.count}`, label: `[${fmt(b.x0)}, ${fmt(b.x1)}${closing}${normalize ? ` · K = ${b.count}` : ''}` })
          const body = { x: px, width: w, fill, fillOpacity: tone === 'wash' ? 0.28 : 1 }
          return (
            <g key={i}>
              {moving ? (
                <motion.rect data-bin={i} {...body} initial={{ attrY: zero, height: 0 }} animate={{ attrY: top, height: h }} transition={transition} />
              ) : (
                <rect data-bin={i} {...body} y={top} height={h} />
              )}
              {tone === 'wash' && b.count > 0 ? (
                moving ? (
                  <motion.rect x={px} width={w} height={CAP} fill={fill} initial={{ attrY: zero - CAP }} animate={{ attrY: top }} transition={transition} />
                ) : (
                  <rect x={px} width={w} y={top} height={CAP} fill={fill} />
                )
              ) : null}
              {/* bersaglio a tutta altezza: anche un bin basso, o vuoto, si legge senza mirare */}
              <rect data-bin-hit={i} x={Math.min(left, right)} y={0} width={Math.abs(right - left)} height={Math.max(zero, 1)} fill="transparent" onPointerEnter={tip} onPointerLeave={() => showTip(null)} />
            </g>
          )
        })}
      </g>
      {cls !== undefined && tallest >= 0 ? (
        <ClassMark
          cls={cls}
          x={(x(cells[tallest].x0) + x(cells[tallest].x1)) / 2}
          y={Math.min(y(normalize ? cells[tallest].density : cells[tallest].count), zero) - 9}
        />
      ) : null}
    </g>
  )
}
