// Il quadrante a lancetta dei cruscotti: le proprietà asintotiche (bias/σ che va a 0, varianza/bound che va a 1,
// frazione dentro la banda che va a 1), gli obiettivi pesati di fit-sweep. Uno strumento, non un grafico: dice dove
// sta UN valore rispetto a una scala e a un obiettivo.
//
//   ╭──────────╮     arco della scala (reticolo), zona dell'obiettivo in ocra con il bordino a inchiostro,
//   │    ╲     │     tacche e cifre fuori dall'arco, lancetta a inchiostro, cifra del valore sotto.
//   ╰────●─────╯
//
// ACCESSIBILITÀ. role="meter" con estremi, valore e testo del valore (anche "fuori scala"); il valore si annuncia
// quando si ferma (useSettled), come in Readout: un Monte Carlo lo muove a ogni fotogramma.
// Mai il solo colore: la zona dell'obiettivo ha anche le tacche ai bordi e la parola nell'etichetta.
//
// MOTO. Nessuno: la lancetta segue il valore (una lancetta che insegue mostrerebbe valori mai esistiti).
import { M } from '../../../components/content/M'
import { fixed, typographic } from '../../kit/format'
import type { NumberFormat } from '../../kit/format'
import { useSettled } from '../../kit/useSettled'
import { axisTicks, formatTick } from './paramAxes'
import { arcPath, arcPoint, meterPosition } from './meters'

export interface GaugeProps {
  label: string
  /** simbolo in LaTeX davanti all'etichetta */
  latex?: string
  value: number
  min: number
  max: number
  /** scala logaritmica (min > 0): per i rapporti che vanno da 0.1 a 10 */
  log?: boolean
  /** obiettivo: un valore (tacca) o una zona [da, a] */
  target?: number | readonly [number, number]
  /** parola dell'obiettivo nel testo accessibile; predefinito "obiettivo" */
  targetLabel?: string
  /** formato della cifra; predefinito due decimali */
  format?: NumberFormat
  unit?: string
  /** tacche esplicite; predefinite quelle della scala */
  ticks?: readonly number[]
  /** lo spillo sull'etichetta: la lettura che conta */
  pinned?: boolean
  /** false toglie l'annuncio (se lo stesso valore lo annuncia già un Readout) */
  announce?: boolean
}

const CX = 100
const CY = 100
const R = 76
/** Il viewBox del quadrante, simmetrico attorno al perno: le cifre delle tacche si posano in percentuale su di lui. */
const VB = { x: -36, y: -12, w: 272, h: 128 }
/** Raggio a cui stanno le cifre delle tacche, fuori dall'arco e dalle sue tacche. */
const LABEL_R = R + 16
const pct = (v: number) => `${Number(v.toFixed(3))}%`

/** Segmento radiale del quadrante alla frazione t, fra i raggi r0 e r1: tacche e segno dell'obiettivo. */
const radial = (t: number, r0: number, r1: number) => {
  const [x0, y0] = arcPoint(CX, CY, r0, t)
  const [x1, y1] = arcPoint(CX, CY, r1, t)
  return `M${x0},${y0}L${x1},${y1}`
}

export function Gauge({ label, latex, value, min, max, log = false, target, targetLabel = 'obiettivo', format = fixed(2), unit, ticks, pinned = false, announce = true }: GaugeProps) {
  const pos = meterPosition(value, min, max, log)
  const tOf = (v: number) => meterPosition(v, min, max, log).t
  const shown = typographic(format(value))
  const outside = pos.over ? 'oltre il fondo scala' : pos.under ? 'sotto l\'inizio della scala' : ''
  const zone = target === undefined ? '' : typeof target === 'number' ? `${targetLabel} ${typographic(format(target))}` : `${targetLabel} fra ${typographic(format(target[0]))} e ${typographic(format(target[1]))}`
  const text = [`${shown}${unit !== undefined ? ` ${unit}` : ''}`, outside, zone].filter((s) => s !== '').join(', ')
  const spoken = useSettled(text)
  // poche tacche e cifre grandi: il quadrante si rimpicciolisce con la colonna dei comandi
  const at = axisTicks([min, max], log, 3).filter((v) => v >= min && v <= max)
  const tickValues = ticks ?? (at.length >= 2 ? at : [min, max])

  const [nx, ny] = arcPoint(CX, CY, R - 10, Number.isNaN(pos.t) ? 0 : pos.t)

  return (
    // il meter ha figli presentazionali: l'annuncio sta fuori, accanto
    <div className="grid min-w-0 gap-0.5">
      <span aria-hidden="true" className="flex items-baseline gap-2">
        {pinned ? <span data-pin="" aria-hidden="true" className="size-3 shrink-0 self-center border border-border-strong bg-pin" /> : null}
        {latex !== undefined ? (
          <span aria-hidden="true" className="text-text">
            <M tex={latex} />
          </span>
        ) : null}
        <span className="label">{label}</span>
      </span>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number.isFinite(value) ? Math.min(Math.max(value, min), max) : undefined}
        aria-valuetext={text}
        className="grid justify-items-center"
      >
        {/* le cifre sono HTML sopra l'SVG, posate in percentuale: il quadrante si stringe con la colonna, le cifre no */}
        <div className="relative w-full max-w-[13rem] min-w-[9rem]">
          <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="block w-full" aria-hidden="true">
            {/* scala: il reticolo; zona dell'obiettivo: ocra con il bordino a inchiostro */}
            <path d={arcPath(CX, CY, R, 0, 1)} fill="none" stroke="var(--viz-grid)" strokeWidth={10} />
            {Array.isArray(target) ? (
              <g data-target-zone="">
                <path d={arcPath(CX, CY, R, tOf(target[0]), tOf(target[1]))} fill="none" stroke="var(--pin-contrast)" strokeWidth={12} />
                <path d={arcPath(CX, CY, R, tOf(target[0]), tOf(target[1]))} fill="none" stroke="var(--viz-highlight)" strokeWidth={9} />
              </g>
            ) : null}
            {typeof target === 'number' ? (
              <path data-target="" d={radial(tOf(target), R - 8, R + 8)} stroke="var(--pin-contrast)" strokeWidth={3} />
            ) : null}
            {tickValues.map((v) => (
              <path key={v} d={radial(tOf(v), R + 6, R + 11)} stroke="var(--viz-axis)" strokeWidth={1} />
            ))}
            {/* lancetta: senza un valore (ancora nessuna replica) non indica nulla */}
            {Number.isNaN(pos.t) ? null : <line data-needle="" x1={CX} y1={CY} x2={nx} y2={ny} stroke="var(--text)" strokeWidth={3} strokeLinecap="round" />}
            <circle cx={CX} cy={CY} r={5} fill="var(--text)" />
          </svg>
          {tickValues.map((v) => {
            const tt = tOf(v)
            const [lx, ly] = arcPoint(CX, CY, LABEL_R, tt)
            // ancorate come un testo SVG: a destra del punto sul fianco destro, a sinistra su quello sinistro, al centro in alto
            const shift = tt < 0.3 ? 'calc(-100% - 2px)' : tt > 0.7 ? '2px' : '-50%'
            return (
              <span
                key={v}
                aria-hidden="true"
                data-tick-label=""
                className="num pointer-events-none absolute text-[length:var(--step--1)] leading-none whitespace-nowrap text-muted"
                style={{ left: pct(((lx - VB.x) / VB.w) * 100), top: pct(((ly - VB.y) / VB.h) * 100), transform: `translate(${shift}, -50%)` }}
              >
                {formatTick(v)}
              </span>
            )
          })}
        </div>
        <span aria-hidden="true" className="num -mt-2 text-[length:var(--step-1)] leading-tight text-text">
          {pos.over ? '> ' : pos.under ? '< ' : ''}
          {shown}
          {unit !== undefined ? <span className="text-[length:var(--step--1)] text-muted"> {unit}</span> : null}
        </span>
        {outside !== '' ? (
          <span aria-hidden="true" className="label">
            fuori scala
          </span>
        ) : null}
      </div>
      {announce ? (
        <span className="visually-hidden" aria-live="polite" aria-atomic="true">
          {label}: {spoken}
        </span>
      ) : null}
    </div>
  )
}
