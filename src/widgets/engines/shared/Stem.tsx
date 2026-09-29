// Steli dentro un <Plot>: un segnale campionato x[n] = x(nT) (ogni campione è un'asta dalla linea di base con un
// segno in cima), le componenti di uno spettro, i coefficienti y_k. Il segno pieno è il campione; `hollow` fa
// segni vuoti (la ricostruzione, i valori quantizzati) che si distinguono per forma, non solo per colore.
//
// - Asta di 1.5 px, segno di almeno 8 px con l'anello di superficie (come i Dots); per classe, forma della classe.
// - `count` mostra solo i primi steli (da sinistra): lo storyboard "i campioni compaiono" è un numero, non un'animazione
//   interna. Con reduced motion chi lo usa passa il conteggio finale.
// - Letture senza puntatore: gli steli si registrano nel Plot; il cursore-quota 'x' legge lo stelo più vicino
//   (nome, x e valore). In un grafico statico gli steli con `label` entrano nella descrizione.
import { useEffect, useLayoutEffect, useRef } from 'react'
import { format } from 'd3'
import { useSettled } from '../../kit/useSettled'
import { roleVar, type VizRole } from '../../kit/plot/colors'
import { classSymbolPath, classVar, className } from '../../kit/plot/marks'
import { usePlot, type MarkReading } from '../../kit/plot/Plot'

export interface StemDatum {
  x: number
  y: number
  id?: string
  /** indice di classe (0-5): colore e forma */
  cls?: number
  /** nome nella lettura: "campione n = 3" */
  label?: string
}

export interface StemProps {
  data: readonly StemDatum[]
  /** quota da cui partono le aste; predefinito 0 (riportata dentro il dominio) */
  baseline?: number
  /** predefinito 'sample' */
  role?: VizRole
  /** raggio del segno in px, mai sotto 4; predefinito 4 */
  r?: number
  /** segni vuoti (anello), per ciò che è ricostruito o approssimato */
  hollow?: boolean
  /** id degli steli da accendere con l'alone ocra (il campione mancato, quello cliccato) */
  highlight?: readonly string[]
  /** quanti steli mostrare, dal primo; predefinito tutti */
  count?: number
  format?: (v: number) => string
}

const compact = format('.3~g')
const n2 = (v: number) => Number(v.toFixed(2))

export function Stem({ data, baseline = 0, role = 'sample', r = 4, hollow = false, highlight, count, format: fmt = compact }: StemProps) {
  const { x, y, clipPath, showTip, registerReadable } = usePlot()
  const radius = Math.max(4, r)
  const size = Math.PI * radius * radius
  const [ya, yb] = y.domain()
  const base = y(Math.min(Math.max(baseline, Math.min(ya, yb)), Math.max(ya, yb)))
  const shown = count === undefined ? data : data.slice(0, Math.max(0, Math.round(count)))

  const say = (d: StemDatum) => [d.label, d.cls !== undefined ? className(d.cls) : undefined, `x = ${fmt(d.x)}`, `y = ${fmt(d.y)}`].filter((s) => s !== undefined).join(' · ')
  // la portata del cursore: metà della distanza fra due steli vicini, al più 24 px
  const xs = shown.map((d) => x(d.x)).sort((a, b) => a - b)
  let gap = Number.POSITIVE_INFINITY
  for (let i = 1; i < xs.length; i++) if (xs[i] - xs[i - 1] > 0) gap = Math.min(gap, xs[i] - xs[i - 1])
  const reach = Math.min(24, Number.isFinite(gap) ? gap / 2 : 24)

  const latest = useRef({ shown, x, say, reach })
  useLayoutEffect(() => {
    latest.current = { shown, x, say, reach }
  })
  const named = useSettled(
    shown
      .filter((d) => d.label !== undefined)
      .map(say)
      .join('; '),
  )
  useEffect(
    () =>
      registerReadable({
        named,
        nearest(px) {
          const { shown: list, x: sx, say: speak, reach: rr } = latest.current
          let best: MarkReading | null = null
          for (const d of list) {
            const distance = Math.abs(sx(d.x) - px)
            if (distance <= rr && (best === null || distance < best.distance)) best = { distance, text: speak(d) }
          }
          return best
        },
      }),
    [registerReadable, named],
  )

  return (
    <g data-stems="">
      <g clipPath={clipPath} pointerEvents="none">
        {shown.map((d, i) => {
          if (!Number.isFinite(d.x) || !Number.isFinite(d.y)) return null
          const color = d.cls !== undefined ? classVar(d.cls) : roleVar(role)
          return <line key={d.id ?? i} x1={n2(x(d.x))} x2={n2(x(d.x))} y1={n2(base)} y2={n2(y(d.y))} stroke={color} strokeWidth={1.5} shapeRendering="crispEdges" />
        })}
      </g>
      {shown.map((d, i) => {
        if (!Number.isFinite(d.x) || !Number.isFinite(d.y)) return null
        const id = d.id ?? String(i)
        const color = d.cls !== undefined ? classVar(d.cls) : roleVar(role)
        const lit = highlight?.includes(id) ?? false
        return (
          <g
            key={id}
            data-stem={id}
            transform={`translate(${n2(x(d.x))},${n2(y(d.y))})`}
            onPointerEnter={() => showTip({ x: x(d.x), y: y(d.y) - radius, value: `y = ${fmt(d.y)}`, label: d.label ?? `x = ${fmt(d.x)}` })}
            onPointerLeave={() => showTip(null)}
          >
            <circle r={12} fill="transparent" />
            {lit ? <circle data-halo="" r={radius + 5} fill="var(--viz-highlight)" stroke="var(--pin-contrast)" strokeWidth={1} /> : null}
            <path
              d={classSymbolPath(d.cls ?? 0, size)}
              fill={hollow ? 'var(--surface)' : color}
              stroke={hollow ? color : 'var(--surface)'}
              strokeWidth={hollow ? 2 : 3}
              paintOrder="stroke"
            />
          </g>
        )
      })}
    </g>
  )
}
