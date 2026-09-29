// Il termometro delle misure di separabilità (Cap. 3): D, B, JM, P_c affiancati, ciascuno con la sua scala. Una
// colonna che si riempie dal bulbo fino al valore, con le tacche a destra e i riferimenti a sinistra (JM satura a √2,
// P_c non scende sotto 1/2). Oltre il fondo scala la colonna è piena e in cima c'è la freccia "fuori scala": la
// divergenza non si ferma, e il termometro lo deve dire.
//
// ACCESSIBILITÀ. role="meter" con estremi, valore e testo (anche "fuori scala" e i riferimenti superati); il valore
// si annuncia quando si ferma. Il colore del riempimento è un ruolo o una classe (con la sua forma sul bulbo): mai
// il solo colore, perché la cifra e l'altezza dicono già il valore.
//
// MOTO. Nessuno: la colonna segue il valore.
import { M } from '../../../components/content/M'
import { fixed, typographic } from '../../kit/format'
import type { NumberFormat } from '../../kit/format'
import { roleVar } from '../../kit/plot/colors'
import type { VizRole } from '../../kit/plot/colors'
import { classSymbolPath, classVar } from '../../kit/plot/marks'
import { useSettled } from '../../kit/useSettled'
import { meterPosition } from './meters'
import { axisTicks, formatTick } from './paramAxes'

export interface ThermometerProps {
  label: string
  latex?: string
  value: number
  min: number
  max: number
  log?: boolean
  /** riferimenti sulla scala, con etichette brevi: "√2", "1/2" (la spiegazione va nella didascalia o nel label) */
  markers?: readonly { value: number; label: string }[]
  /** colore del riempimento: un ruolo (predefinito 'estimate') o una classe (con la sua forma sul bulbo) */
  role?: VizRole
  cls?: number
  format?: NumberFormat
  unit?: string
  ticks?: readonly number[]
  pinned?: boolean
  announce?: boolean
}

// geometria in unità del viewBox (0 0 132 H): colonna al centro, riferimenti a sinistra, tacche a destra
const H = 210
const COL_X = 58
const COL_W = 16
const TOP = 16
const BOTTOM = H - 44
const BULB_Y = H - 26
const BULB_R = 13
/**
 * Cifre e riferimenti in unità del viewBox (132 di larghezza): circa 11 px alla larghezza minima (7rem), 13 px alla
 * massima. Le etichette dei riferimenti stanno nei 40 punti a sinistra della canna: vanno tenute brevi ("√2", "1/2").
 */
const LABEL_FONT = 12.5

export function Thermometer({ label, latex, value, min, max, log = false, markers = [], role = 'estimate', cls, format = fixed(2), unit, ticks, pinned = false, announce = true }: ThermometerProps) {
  const pos = meterPosition(value, min, max, log)
  const yOf = (v: number) => BOTTOM - (BOTTOM - TOP) * (meterPosition(v, min, max, log).t || 0)
  const yValue = BOTTOM - (BOTTOM - TOP) * (Number.isNaN(pos.t) ? 0 : pos.t)
  const color = cls !== undefined ? classVar(cls) : roleVar(role)
  const shown = typographic(format(value))
  const passed = markers.filter((m) => value >= m.value).map((m) => `sopra ${m.label}`)
  const text = [`${shown}${unit !== undefined ? ` ${unit}` : ''}`, pos.over ? 'oltre il fondo scala' : '', ...passed].filter((s) => s !== '').join(', ')
  const spoken = useSettled(text)
  const at = axisTicks([min, max], log, 4).filter((v) => v >= min && v <= max)
  const tickValues = ticks ?? (at.length >= 2 ? at : [min, max])
  const cx = COL_X + COL_W / 2

  return (
    <div className="grid min-w-0 justify-items-center gap-1">
      <span aria-hidden="true" className="flex items-baseline gap-2">
        {pinned ? <span data-pin="" className="size-3 shrink-0 self-center border border-border-strong bg-pin" /> : null}
        {latex !== undefined ? (
          <span className="text-text">
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
        <svg viewBox={`0 0 132 ${H}`} className="w-full max-w-[8.5rem] min-w-[7rem]" aria-hidden="true">
          {/* la canna: carta sotto, riempimento del valore, contorno a inchiostro sopra */}
          <rect x={COL_X} y={TOP} width={COL_W} height={BOTTOM - TOP + 4} fill="var(--surface-2)" />
          <rect data-fill="" x={COL_X} y={yValue} width={COL_W} height={Math.max(0, BOTTOM - yValue + 4)} fill={color} />
          <circle cx={cx} cy={BULB_Y} r={BULB_R} fill={color} stroke="var(--border-strong)" strokeWidth={1.5} />
          <path d={`M${COL_X},${BOTTOM + 4}V${TOP}H${COL_X + COL_W}V${BOTTOM + 4}`} fill="none" stroke="var(--border-strong)" strokeWidth={1.5} />
          {cls !== undefined ? <path transform={`translate(${cx},${BULB_Y})`} d={classSymbolPath(cls, 60)} fill="var(--surface)" /> : null}
          {pos.over ? <path data-overflow="" d={`M${cx},${TOP - 13}l7,9h-14z`} fill="var(--text)" /> : null}
          {tickValues.map((v) => (
            <g key={`t${v}`}>
              <line x1={COL_X + COL_W + 3} x2={COL_X + COL_W + 9} y1={yOf(v)} y2={yOf(v)} stroke="var(--viz-axis)" strokeWidth={1} />
              <text className="num" x={COL_X + COL_W + 12} y={yOf(v)} dy="0.32em" fontSize={LABEL_FONT} fill="var(--text-muted)">
                {formatTick(v)}
              </text>
            </g>
          ))}
          {markers.map((m) => (
            <g key={`m${m.label}`} data-marker="">
              <line x1={COL_X - 8} x2={COL_X + COL_W} y1={yOf(m.value)} y2={yOf(m.value)} stroke="var(--pin-contrast)" strokeWidth={2} />
              <rect x={COL_X - 12} y={yOf(m.value) - 3} width={6} height={6} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1} />
              <text className="num" x={COL_X - 15} y={yOf(m.value)} dy="0.32em" fontSize={LABEL_FONT} fontWeight={600} textAnchor="end" fill="var(--text)">
                {m.label}
              </text>
            </g>
          ))}
        </svg>
        <span aria-hidden="true" className="num text-[length:var(--step-1)] leading-tight text-text">
          {pos.over ? '> ' : ''}
          {shown}
          {unit !== undefined ? <span className="text-[length:var(--step--1)] text-muted"> {unit}</span> : null}
        </span>
        {pos.over ? (
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
