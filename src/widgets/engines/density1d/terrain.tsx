// Strati del terreno del motore density1d che il kit non ha: le campane dei singoli kernel (separate o
// impilate), il nastro dei campioni, la colonna degli addendi nel punto sonda, i segni "fuori scala" e le
// etichette dirette delle curve. Si disegnano dentro <Plot> e leggono scale e servizi con usePlot().
//
// Colori: solo ruoli --viz-* (kernel, estimate, truth, sample, boundary, highlight) e token di superficie.
// Moto: nessuna transizione CSS qui. Le geometrie cambiano perché cambiano i numeri (storyboard, slider):
// il ridisegno segue il valore senza inseguirlo, come chiede il kit.
import { area, line } from 'd3'
import type { MouseEvent } from 'react'
import { roleVar } from '../../kit/plot/colors'
import { classSymbolPath } from '../../kit/plot/marks'
import { usePlot } from '../../kit/plot/Plot'
import type { KernelBand } from './density1d'

const n2 = (v: number) => Number(v.toFixed(2))

/** Le campane dei kernel: velatura della tinta del kernel e filo sottile in cima; impilate, bande più piene. */
export function KernelBandsLayer({ xs, bands, stack, opacity = 1 }: { xs: readonly number[]; bands: readonly KernelBand[]; stack: number; opacity?: number }) {
  const { x, y, clipPath } = usePlot()
  if (bands.length === 0) return null
  const fillOpacity = 0.07 + 0.2 * stack
  return (
    <g data-kernels="" clipPath={clipPath} pointerEvents="none" opacity={opacity}>
      {bands.map((b, j) => {
        const idx = Array.from({ length: b.to - b.from + 1 }, (_, i) => i)
        const shape =
          area<number>()
            .x((i) => n2(x(xs[b.from + i])))
            .y0((i) => n2(y(b.lower[i])))
            .y1((i) => n2(y(b.upper[i])))(idx) ?? ''
        const top = line<number>()
          .x((i) => n2(x(xs[b.from + i])))
          .y((i) => n2(y(b.upper[i])))(idx) ?? ''
        return (
          <g key={b.k} data-kernel={b.k}>
            {/* nella pila le bande si alternano appena, perché si distinguano senza bordi */}
            <path d={shape} fill={roleVar('kernel')} fillOpacity={stack > 0 && j % 2 === 1 ? fillOpacity * 0.6 : fillOpacity} stroke="none" />
            <path d={top} fill="none" stroke={roleVar('kernel')} strokeWidth={1.25} strokeLinejoin="round" />
          </g>
        )
      })}
    </g>
  )
}

export interface BeltSample {
  id: string
  x: number
  /** 0 = sopra la cornice (non ancora caduto), 1 = sul nastro; già con l'accelerazione applicata */
  drop: number
}

export interface SampleBeltProps {
  samples: readonly BeltSample[]
  /** quota della base del nastro (negativa: il nastro sta sotto lo zero delle densità) */
  bottom: number
  /** quota da cui cadono i campioni */
  from: number
  editable: boolean
  onAdd: (x: number) => void
  onRemove: (id: string) => void
  /** nome di un campione, per le letture: "salmone" */
  name: string
  format: (v: number) => string
  opacity?: number
}

/**
 * Il nastro: la fascia sotto lo zero dove stanno i campioni (nel mondo del pesce è davvero il nastro
 * trasportatore). Un clic sul nastro aggiunge un campione in quel punto, un clic su un campione lo toglie.
 * Da tastiera le stesse azioni passano dal cursore-quota (Invio, Canc) e dai pulsanti dei comandi.
 */
export function SampleBelt({ samples, bottom, from, editable, onAdd, onRemove, name, format, opacity = 1 }: SampleBeltProps) {
  const { x, y, innerWidth, toData, showTip } = usePlot()
  const top = y(0)
  const base = y(bottom)
  const mid = y(bottom / 2)
  const add = (e: MouseEvent<SVGRectElement>) => {
    if (!editable) return
    onAdd(toData(e.clientX, e.clientY)[0])
  }
  const size = Math.PI * 4.5 * 4.5
  return (
    <g data-belt="" opacity={opacity}>
      <rect data-belt-strip="" x={0} y={top} width={innerWidth} height={Math.max(0, base - top)} fill="var(--surface-2)" style={{ cursor: editable ? 'copy' : undefined }} onClick={add} />
      <line x1={0} x2={innerWidth} y1={top} y2={top} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" pointerEvents="none" />
      {/* sul telefono la scritta coprirebbe i campioni: lì la stessa istruzione sta nei comandi */}
      {editable && innerWidth >= 520 ? (
        <text className="label" x={6} y={base - 5} fontSize={10} fill="var(--text-faint)" pointerEvents="none">
          Clic sul nastro: aggiungi · clic su un {name}: togli
        </text>
      ) : null}
      {samples.map((s) => {
        if (s.drop <= 0) return null
        const cy = y(from + (bottom / 2 - from) * s.drop)
        const landed = s.drop >= 1
        return (
          <g
            key={s.id}
            data-sample={s.id}
            transform={`translate(${n2(x(s.x))},${n2(landed ? mid : cy)})`}
            style={{ cursor: editable && landed ? 'pointer' : undefined }}
            onClick={(e) => {
              if (!editable || !landed) return
              e.stopPropagation()
              showTip(null)
              onRemove(s.id)
            }}
            onPointerEnter={() => showTip({ x: x(s.x), y: mid - 8, value: `x = ${format(s.x)}`, label: editable ? `${name} · clic per toglierlo` : name })}
            onPointerLeave={() => showTip(null)}
          >
            <circle r={11} fill="transparent" />
            <path d={classSymbolPath(0, size)} fill={roleVar('sample')} stroke="var(--surface)" strokeWidth={3} paintOrder="stroke" />
          </g>
        )
      })}
    </g>
  )
}

/**
 * Il punto sonda: la verticale fino alla stima, lo spillo sulla curva e, accanto, la colonna degli addendi
 * impilati dal più grande. La colonna arriva esattamente allo spillo: p̂(x) è la somma dei contributi.
 */
export function ProbeMarks({ x0, p, terms, column }: { x0: number; p: number; terms: readonly number[]; column: boolean }) {
  const { x, y, clipPath } = usePlot()
  const px = n2(x(x0))
  let acc = 0
  return (
    <g data-probe="" pointerEvents="none">
      <g clipPath={clipPath}>
        <line x1={px} x2={px} y1={y(0)} y2={y(p)} stroke="var(--viz-boundary)" strokeOpacity={0.5} strokeWidth={1} shapeRendering="crispEdges" />
        {column
          ? terms.map((t, i) => {
              const lo = acc
              acc += t
              const y0 = y(lo)
              const y1 = y(acc)
              if (y0 - y1 < 0.5) return null
              return <rect key={i} x={px + 3} y={n2(y1)} width={7} height={n2(Math.max(0.5, y0 - y1 - 1))} fill={roleVar('kernel')} fillOpacity={i % 2 === 0 ? 0.9 : 0.5} />
            })
          : null}
      </g>
      {/* lo spillo: posizione del punto sonda sulla stima */}
      <rect x={px - 4.5} y={n2(y(p)) - 4.5} width={9} height={9} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} transform={`rotate(45 ${px} ${n2(y(p))})`} />
    </g>
  )
}

/** Picchi oltre la cornice: una punta a inchiostro sul bordo alto, perché ciò che non si vede non sembri assente. */
export function ClippedMarks({ at }: { at: readonly number[] }) {
  const { x } = usePlot()
  if (at.length === 0) return null
  return (
    <g data-clipped="" pointerEvents="none">
      {at.map((v, i) => (
        <path key={i} d={`M${n2(x(v))},-1l-5,7h10z`} fill="var(--text)">
          <title>fuori scala</title>
        </path>
      ))}
    </g>
  )
}

/**
 * Etichetta diretta di una curva: a inchiostro con un alone di superficie, come i toponimi. `above`: sopra il
 * punto (per un picco); altrimenti centrata sul punto, accanto al fianco della curva.
 */
export function CurveLabel({ at, text, anchor = 'start', above = true }: { at: readonly [number, number]; text: string; anchor?: 'start' | 'end'; above?: boolean }) {
  const { x, y, innerHeight } = usePlot()
  const ty = Math.max(12, Math.min(innerHeight - 4, y(at[1]) - (above ? 8 : 0)))
  return (
    <text
      className="num"
      fontSize={12}
      fontWeight={600}
      x={n2(x(at[0]) + (anchor === 'start' ? 8 : -8))}
      y={n2(ty)}
      dy={above ? undefined : '0.32em'}
      textAnchor={anchor}
      fill="var(--text)"
      stroke="var(--surface)"
      strokeWidth={3}
      strokeLinejoin="round"
      paintOrder="stroke"
      pointerEvents="none"
    >
      {text}
    </text>
  )
}
