// Violino dentro un <Plot>: la distribuzione delle stime per un N dato (le stime di μ con N = 5, 20, 100 che si
// stringono), dei punteggi di una misura, degli errori di uno stimatore. La sagoma è la stima di Parzen gaussiana
// dei valori (violinShape.ts), specchiata attorno alla posizione della categoria; dentro, la scatola fra i
// quartili e la mediana.
//
// - Verticale (predefinito): i valori sull'asse y, la categoria in x = `at`. Orizzontale: valori in x, categoria in y.
// - Più violini da confrontare: si passa a tutti lo stesso `densityMax`, così la larghezza è la stessa scala (un
//   violino più stretto vuol dire davvero valori più concentrati, non un'altra normalizzazione).
// - Velatura della tinta (come l'istogramma del kit) con il filo del contorno; per classe la forma della classe in cima.
// - Letture senza puntatore: il cursore-quota 'x' (o 'xy') legge il violino sotto di sé: nome, quanti valori, mediana,
//   quartili (i valori sono le stime ripetute, non la N del training set, che sta nel nome).
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { format } from 'd3'
import { ClassMark } from '../../kit/plot/ClassMark'
import { roleVar, type VizRole } from '../../kit/plot/colors'
import { classVar, className } from '../../kit/plot/marks'
import { usePlot, type MarkReading } from '../../kit/plot/Plot'
import { useSettled } from '../../kit/useSettled'
import { quantile, silverman, violinProfile } from './violinShape'

export interface ViolinProps {
  values: readonly number[]
  /** posizione della categoria sull'altro asse, nel dominio */
  at: number
  /** mezza larghezza massima in px; predefinito 22 */
  halfWidth?: number
  /** densità che corrisponde a `halfWidth`: la stessa per violini da confrontare; predefinito il massimo del profilo */
  densityMax?: number
  /** larghezza del kernel nel dominio dei valori; predefinita quella di Silverman */
  bandwidth?: number
  orientation?: 'vertical' | 'horizontal'
  /** predefinito 'estimate' */
  role?: VizRole
  cls?: number
  /** scatola dei quartili e mediana; predefinito true */
  box?: boolean
  /** nome nelle letture: "N = 20" */
  label?: string
  /** intervallo dei valori da coprire; predefinito dal minimo al massimo ± 3 larghezze, dentro il dominio */
  extent?: readonly [number, number]
  /** punti del profilo; predefinito 64 */
  points?: number
  format?: (v: number) => string
}

const compact = format('.3~g')
const n2 = (v: number) => Number(v.toFixed(2))

export function Violin({ values, at, halfWidth = 22, densityMax, bandwidth, orientation = 'vertical', role = 'estimate', cls, box = true, label, extent, points = 64, format: fmt = compact }: ViolinProps) {
  const { x, y, clipPath, showTip, registerReadable } = usePlot()
  const vertical = orientation === 'vertical'
  const vScale = vertical ? y : x
  const cScale = vertical ? x : y
  const [da, db] = vScale.domain()
  const color = cls !== undefined ? classVar(cls) : roleVar(role)

  const shape = useMemo(() => {
    const v = values.filter(Number.isFinite)
    if (v.length === 0) return null
    const h = bandwidth ?? silverman(v)
    const lo = Math.max(extent?.[0] ?? Math.min(...v) - 3 * h, Math.min(da, db))
    const hi = Math.min(extent?.[1] ?? Math.max(...v) + 3 * h, Math.max(da, db))
    const n = Math.max(8, Math.round(points))
    const grid = Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n)
    const prof = violinProfile(v, grid, h)
    return { grid, prof, q1: quantile(v, 0.25), med: quantile(v, 0.5), q3: quantile(v, 0.75), n: v.length }
  }, [values, bandwidth, extent, points, da, db])

  const say = shape === null ? '' : [label, cls !== undefined ? className(cls) : undefined, `${shape.n} ${shape.n === 1 ? 'valore' : 'valori'}`, `mediana ${fmt(shape.med)}`, `quartili ${fmt(shape.q1)}–${fmt(shape.q3)}`].filter((s) => s !== undefined).join(' · ')
  const c = cScale(at)
  const latest = useRef({ c, say, halfWidth, vertical })
  useLayoutEffect(() => {
    latest.current = { c, say, halfWidth, vertical }
  })
  const named = useSettled(label !== undefined ? say : '')
  useEffect(
    () =>
      registerReadable({
        named,
        nearest(px, py) {
          const { c: cc, say: speak, halfWidth: hw, vertical: vert } = latest.current
          if (speak === '') return null
          const distance = Math.abs((vert ? px : py) - cc)
          return distance <= hw ? ({ distance, text: speak } as MarkReading) : null
        },
      }),
    [registerReadable, named],
  )

  if (shape === null) return null
  const top = Math.max(...shape.prof)
  const scale = (densityMax ?? top) > 0 ? halfWidth / (densityMax ?? top) : 0
  const pt = (v: number, off: number) => (vertical ? `${n2(c + off)},${n2(vScale(v))}` : `${n2(vScale(v))},${n2(c + off)}`)
  let d = ''
  shape.grid.forEach((g, i) => (d += `${i === 0 ? 'M' : 'L'}${pt(g, shape.prof[i] * scale)}`))
  for (let i = shape.grid.length - 1; i >= 0; i--) d += `L${pt(shape.grid[i], -shape.prof[i] * scale)}`
  d += 'Z'

  const boxW = 4
  const q1 = vScale(shape.q1)
  const q3 = vScale(shape.q3)
  const med = vScale(shape.med)
  const peakIdx = shape.prof.indexOf(top)
  const tipV = shape.grid[shape.grid.length - 1]

  return (
    <g data-violin="" onPointerEnter={() => showTip(vertical ? { x: c, y: med, value: `mediana ${fmt(shape.med)}`, label: label ?? `${shape.n} valori` } : { x: med, y: c, value: `mediana ${fmt(shape.med)}`, label: label ?? `${shape.n} valori` })} onPointerLeave={() => showTip(null)}>
      <g clipPath={clipPath}>
        <path d={d} fill={color} fillOpacity={0.24} stroke={color} strokeWidth={1.25} strokeLinejoin="round" />
        {box ? (
          <g pointerEvents="none">
            {vertical ? (
              <rect x={n2(c - boxW / 2)} y={n2(Math.min(q1, q3))} width={boxW} height={n2(Math.abs(q3 - q1))} fill="var(--text)" />
            ) : (
              <rect x={n2(Math.min(q1, q3))} y={n2(c - boxW / 2)} width={n2(Math.abs(q3 - q1))} height={boxW} fill="var(--text)" />
            )}
            <circle cx={vertical ? n2(c) : n2(med)} cy={vertical ? n2(med) : n2(c)} r={3.5} fill="var(--surface)" stroke="var(--text)" strokeWidth={1.5} />
          </g>
        ) : null}
      </g>
      {cls !== undefined ? (
        vertical ? (
          <ClassMark cls={cls} x={c} y={Math.max(6, vScale(tipV) - 9)} />
        ) : (
          <ClassMark cls={cls} x={vScale(shape.grid[peakIdx])} y={c - (top * scale + 9)} />
        )
      ) : null}
    </g>
  )
}
