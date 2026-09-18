// Barre per poche categorie: le probabilità a posteriori P(ωᵢ|x), i voti dei k vicini, il peso di una feature.
// Le categorie stanno su posizioni numeriche dell'asse x (0, 1, 2… con xDomain [-0.5, n - 0.5]); i nomi si
// scrivono con <Axis ticks={[0, 1, 2]} format={(i) => nomi[i]} />.
// - Sottili: mai più di 24 px, il resto della fascia è aria. Partono tutte dalla linea dello zero; i negativi scendono.
// - Angoli vivi (regola dell'atlante) e nessun bordo: le barre non si toccano, non c'è nulla da separare.
// - Il colore segue la classe (o il ruolo), mai la graduatoria: filtrando le barre nessuna cambia tinta.
// - `showValues` scrive il valore in punta, a inchiostro: va bene con poche barre, mai un numero su ogni punto.
// - Una barra per classe (`cls`) porta la forma della classe oltre la punta (ClassMark): il colore da solo non basta.
// - Letture senza puntatore: il cursore-quota 'x' legge la barra sotto di sé (nome e valore); in un grafico statico
//   le barre con `label` entrano nella descrizione dell'SVG.
import { useEffect, useLayoutEffect, useRef } from 'react'
import { format } from 'd3'
import { motion } from 'motion/react'
import { useReducedMotion } from '../useReducedMotion'
import { useSettled } from '../useSettled'
import { ClassMark } from './ClassMark'
import { roleVar, type VizRole } from './colors'
import { classVar, className } from './marks'
import { usePlot, type MarkReading } from './Plot'

export interface Bar {
  /** posizione sull'asse x, nel dominio */
  x: number
  value: number
  /** indice di classe (0-5): colore della barra */
  cls?: number
  /** nome della categoria, mostrato nella lettura */
  label?: string
  id?: string
}

export interface BarsProps {
  data: readonly Bar[]
  /** colore delle barre senza classe; predefinito 'estimate' */
  role?: VizRole
  /** spessore massimo in px; predefinito 24, che è anche il tetto */
  thickness?: number
  showValues?: boolean
  /** le barre raggiungono il nuovo valore in 240 ms; ferme con reduced motion */
  animate?: boolean
  format?: (value: number) => string
}

const MAX_THICKNESS = 24
const compact = format('.3~g')
const EASE_OUT = [0.2, 0.8, 0.2, 1] as const
/** Distanza del centro del marcatore di classe dalla punta della barra, e spazio che lascia al valore scritto. */
const MARK_GAP = 9
const MARK_ROOM = 16

export function Bars({ data, role = 'estimate', thickness = MAX_THICKNESS, showValues = false, animate = false, format: fmt = compact }: BarsProps) {
  const { x, y, clipPath, showTip, registerReadable } = usePlot()
  const reduced = useReducedMotion()
  const [ya, yb] = y.domain()
  const zero = y(Math.min(Math.max(0, Math.min(ya, yb)), Math.max(ya, yb)))

  // la fascia di una barra è la distanza dalla vicina più prossima: la barra ne prende al più il 60%
  const xs = data.map((b) => x(b.x)).sort((a, b) => a - b)
  let band = Number.POSITIVE_INFINITY
  for (let i = 1; i < xs.length; i++) if (xs[i] - xs[i - 1] > 0) band = Math.min(band, xs[i] - xs[i - 1])
  const w = Math.max(2, Math.min(thickness, MAX_THICKNESS, band * 0.6))
  const hit = Math.max(w, Math.min(Number.isFinite(band) ? band : 40, 40))

  const moving = animate && !reduced
  const transition = { duration: 0.24, ease: EASE_OUT }

  // --- letture per il cursore-quota e per la descrizione del grafico ---
  const say = (b: Bar) => `${[b.label, b.cls !== undefined ? className(b.cls) : undefined].filter((s) => s !== undefined).join(' · ') || 'barra'}: ${fmt(b.value)}`
  const reach = Number.isFinite(band) ? band / 2 : 24
  const latest = useRef({ data, x, say, reach })
  useLayoutEffect(() => {
    latest.current = { data, x, say, reach }
  })
  // la descrizione si aggiorna quando i valori smettono di cambiare: un'animazione non rifà il Plot a ogni fotogramma
  const named = useSettled(
    data
      .filter((b) => b.label !== undefined)
      .map(say)
      .join('; '),
  )
  useEffect(
    () =>
      registerReadable({
        named,
        nearest(px) {
          const { data: bars, x: sx, say: speak, reach: r } = latest.current
          let best: MarkReading | null = null
          for (const b of bars) {
            const distance = Math.abs(sx(b.x) - px)
            if (distance <= r && (best === null || distance < best.distance)) best = { distance, text: speak(b) }
          }
          return best
        },
      }),
    [registerReadable, named],
  )

  return (
    <g data-bars="">
      <g clipPath={clipPath}>
        {data.map((b, i) => {
          const cx = x(b.x)
          const tipY = y(b.value)
          const top = Math.min(tipY, zero)
          const h = Math.abs(tipY - zero)
          const body = { x: cx - w / 2, width: w, fill: b.cls !== undefined ? classVar(b.cls) : roleVar(role) }
          const tip = () => showTip({ x: cx, y: top, value: fmt(b.value), label: b.label })
          return (
            <g key={b.id ?? i}>
              {moving ? (
                <motion.rect data-bar={i} {...body} initial={{ attrY: zero, height: 0 }} animate={{ attrY: top, height: h }} transition={transition} />
              ) : (
                <rect data-bar={i} {...body} y={top} height={h} />
              )}
              <rect x={cx - hit / 2} y={Math.min(top, zero - 12)} width={hit} height={Math.max(h, 12) + (tipY > zero ? 12 : 0)} fill="transparent" onPointerEnter={tip} onPointerLeave={() => showTip(null)} />
            </g>
          )
        })}
      </g>
      {data.map((b, i) => {
        if (b.cls === undefined) return null
        const tipY = y(b.value)
        const below = tipY > zero
        return <ClassMark key={b.id ?? i} cls={b.cls} x={x(b.x)} y={below ? tipY + MARK_GAP : tipY - MARK_GAP} />
      })}
      {showValues
        ? data.map((b, i) => {
            const tipY = y(b.value)
            const below = tipY > zero
            // oltre il marcatore di classe, se la barra ne ha uno
            const room = b.cls !== undefined ? MARK_ROOM : 0
            return (
              <text key={b.id ?? i} className="num" fontSize={12} fill="var(--text)" textAnchor="middle" x={x(b.x)} y={below ? tipY + 6 + room : tipY - 6 - room} dy={below ? '0.71em' : '0em'} pointerEvents="none">
                {fmt(b.value)}
              </text>
            )
          })
        : null}
    </g>
  )
}
