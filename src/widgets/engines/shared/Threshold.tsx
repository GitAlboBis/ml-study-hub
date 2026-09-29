// Soglia trascinabile dentro un <Plot>: la x* di una regola di decisione, la soglia orizzontale di un rivelatore,
// un confine di segmentazione, la τ di un classificatore multilabel. Una linea a inchiostro che attraversa il
// grafico, con una linguetta ocra (lo spillo: segna una posizione) che porta il simbolo.
//
// - Verticale (x = valore) o orizzontale (y = valore).
// - Aggancio: ai bordi dei bin (`snaps`, sempre o solo vicino, come una calamita) oppure alla griglia del passo.
//   Da tastiera le frecce vanno al bordo successivo nel verso del tasto (handleMath.sliderKey): con bordi ogni 0.5
//   e passo 0.2 non si resta fermi. Maiusc e Pag: dieci passi o cinque bordi; Inizio e Fine gli estremi.
// - Bersagli: la linguetta dà 40 × 40 px, la striscia lungo la linea 24 px: si prende anche a metà altezza.
// - Senza `onChange` è una soglia ferma: solo il disegno, niente fuoco.
// - Confini ordinati (più soglie con distanza minima: la segmentazione di un segnale, le soglie di una
//   quantizzazione): `ThresholdSet`, in fondo al file. Ogni confine ha per estremi i vicini a distanza `gap`
//   (handleMath.clampOrdered): non si scavalcano né col puntatore né da tastiera.
// - Moto: nessuno; la soglia segue la mano. Una soglia imposta da un passo del racconto la muove lo storyboard.
import { format } from 'd3'
import { roleVar, type VizRole } from '../../kit/plot/colors'
import { classVar } from '../../kit/plot/marks'
import { usePlot } from '../../kit/plot/Plot'
import { DragHandle } from './DragHandle'
import { clampOrdered, sliderKey, snapValue, tidy } from './handleMath'

export interface ThresholdProps {
  value: number
  /** nuovo valore, già agganciato e dentro [min, max]; senza, la soglia è ferma */
  onChange?: (value: number) => void
  /** verticale: x = valore (predefinito); orizzontale: y = valore */
  orientation?: 'vertical' | 'horizontal'
  /** nome accessibile: "Soglia sulla luminosità x*" */
  label: string
  /** scritta sulla linguetta, breve: "x*", "τ", "θ" */
  symbol?: string
  /** estremi del valore; predefinito il dominio dell'asse */
  min?: number
  max?: number
  /** passo della tastiera e griglia d'aggancio senza `snaps`; predefinito un centesimo dell'intervallo */
  step?: number
  /** valori a cui agganciarsi: i bordi dei bin (handleMath.binEdges) */
  snaps?: readonly number[]
  /** 'always': sempre al bordo più vicino (predefinito); 'near': solo entro 10 px, come una calamita */
  snapMode?: 'always' | 'near'
  /** testo del valore; predefinito 3 cifre significative */
  format?: (value: number) => string
  /** colore della linea; predefinito 'boundary' (inchiostro) */
  role?: VizRole
  /** soglia di una classe: colore della classe (la linguetta resta lo spillo, con la forma nel simbolo) */
  cls?: number
  onDragState?: (dragging: boolean) => void
  disabled?: boolean
}

const compact = format('.3~g')
const SNAP_PX = 10
const TAB_H = 20

export function Threshold({
  value,
  onChange,
  orientation = 'vertical',
  label,
  symbol,
  min,
  max,
  step,
  snaps,
  snapMode = 'always',
  format: fmt = compact,
  role = 'boundary',
  cls,
  onDragState,
  disabled = false,
}: ThresholdProps) {
  const { x, y, innerWidth, innerHeight } = usePlot()
  const vertical = orientation === 'vertical'
  const scale = vertical ? x : y
  const [da, db] = scale.domain()
  const lo = min ?? Math.min(da, db)
  const hi = max ?? Math.max(da, db)
  const keyStep = step ?? (hi - lo) / 100
  const pos = scale(Math.min(Math.max(value, lo), hi))
  const color = cls !== undefined ? classVar(cls) : roleVar(role)
  const text = symbol ? `${symbol} = ${fmt(value)}` : fmt(value)

  const settle = (raw: number) => {
    const inside = Math.min(Math.max(raw, lo), hi)
    // la calamita lavora in pixel: 10 px valgono unità diverse a ogni zoom
    const perPx = Math.abs(scale.invert(1) - scale.invert(0))
    const snapped = snaps && snaps.length > 0 ? snapValue(inside, { snaps, radius: snapMode === 'near' ? SNAP_PX * perPx : undefined }) : step !== undefined ? snapValue(inside, { step, min: lo }) : tidy(inside)
    return Math.min(Math.max(snapped, lo), hi)
  }
  const emit = (raw: number) => {
    const next = settle(raw)
    if (next !== value) onChange?.(next)
  }

  const tabW = Math.max(28, (symbol?.length ?? 2) * 8 + 14)
  // la linguetta: in cima alla verticale, nel margine sopra la cornice; sull'orizzontale dentro la cornice, in
  // fondo a destra e appoggiata sopra la linea (fuori, nel margine destro stretto, uscirebbe dal grafico)
  const tab = vertical ? { x: -tabW / 2, y: -TAB_H - 2, w: tabW, h: TAB_H } : { x: -tabW - 4, y: -TAB_H - 3, w: tabW, h: TAB_H }
  const tabHit = vertical ? { x: -20, y: -TAB_H - 12, w: 40, h: 40 } : { x: -Math.max(40, tabW + 8), y: -TAB_H - 10, w: Math.max(40, tabW + 8), h: 40 }
  const line = vertical ? { x1: 0, y1: 0, x2: 0, y2: innerHeight } : { x1: -innerWidth, y1: 0, x2: 0, y2: 0 }
  const strip = vertical ? { x: -12, y: 0, width: 24, height: innerHeight } : { x: -innerWidth, y: -12, width: innerWidth, height: 24 }

  const mark = (
    <>
      <line {...line} stroke={color} strokeWidth={2} shapeRendering="crispEdges" />
      {symbol !== undefined || onChange !== undefined ? (
        <g aria-hidden="true">
          <rect x={tab.x} y={tab.y} width={tab.w} height={tab.h} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} />
          {symbol !== undefined ? (
            <text x={tab.x + tab.w / 2} y={tab.y + tab.h / 2} dy="0.34em" textAnchor="middle" className="num" fontSize={12} fontWeight={700} fill="var(--pin-contrast)">
              {symbol}
            </text>
          ) : null}
        </g>
      ) : null}
    </>
  )

  if (onChange === undefined) {
    return (
      <g data-threshold="" transform={vertical ? `translate(${pos},0)` : `translate(${innerWidth},${pos})`} pointerEvents="none" aria-hidden="true">
        {mark}
      </g>
    )
  }

  return (
    <g data-threshold="">
      <DragHandle
        px={vertical ? pos : innerWidth}
        py={vertical ? 0 : pos}
        name="threshold"
        label={label}
        valueText={text}
        valueNow={value}
        valueMin={lo}
        valueMax={hi}
        orientation={vertical ? 'horizontal' : 'vertical'}
        roleDescription="soglia trascinabile"
        disabled={disabled}
        tip={{ value: text, label }}
        onDragState={onDragState}
        onDragTo={(dx, dy) => emit(vertical ? dx : dy)}
        onKey={(key, shift) => {
          const next = sliderKey(value, key, shift, { min: lo, max: hi, step: keyStep, snaps })
          if (next === null) return false
          if (next !== value) onChange(Math.min(Math.max(next, lo), hi))
          return true
        }}
      >
        <rect {...strip} fill="transparent" />
        <rect x={tabHit.x} y={tabHit.y} width={tabHit.w} height={tabHit.h} fill="transparent" />
        {mark}
      </DragHandle>
    </g>
  )
}

export interface ThresholdSetProps extends Omit<ThresholdProps, 'value' | 'onChange' | 'label' | 'symbol' | 'min' | 'max'> {
  /** i confini, in ordine crescente */
  values: readonly number[]
  /** i confini dopo il gesto, ancora in ordine e a distanza almeno `gap` */
  onChange: (values: number[]) => void
  /** distanza minima fra due confini vicini, nel dominio; predefinito un passo (o un centesimo del dominio) */
  gap?: number
  /** nome accessibile del confine i: "Confine fra il battito 2 e il 3" */
  label: (i: number) => string
  /** scritta sulla linguetta del confine i: "t₁" */
  symbol?: (i: number) => string | undefined
  /** estremi del primo e dell'ultimo confine; predefinito il dominio dell'asse */
  min?: number
  max?: number
}

/** Più soglie ordinate sullo stesso asse, ognuna fra i vicini a distanza almeno `gap`. */
export function ThresholdSet({ values, onChange, gap, label, symbol, min, max, ...rest }: ThresholdSetProps) {
  const { x, y } = usePlot()
  const [da, db] = (rest.orientation === 'horizontal' ? y : x).domain()
  const lo = min ?? Math.min(da, db)
  const hi = max ?? Math.max(da, db)
  const g = gap ?? rest.step ?? (hi - lo) / 100
  return (
    <g data-threshold-set="">
      {values.map((v, i) => (
        <Threshold
          // i confini non hanno identità propria: il posto nell'ordine è il loro nome
          key={i}
          {...rest}
          value={v}
          label={label(i)}
          symbol={symbol?.(i)}
          min={tidy(i > 0 ? values[i - 1] + g : lo)}
          max={tidy(i < values.length - 1 ? values[i + 1] - g : hi)}
          onChange={(next) => onChange(clampOrdered(values, i, next, g, lo, hi))}
        />
      ))}
    </g>
  )
}
