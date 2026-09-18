// Asse come lato della cornice di una carta: un filo sottile, tacche verso l'esterno, cifre nel margine.
// - cifre in .num (mono, tabellari: si allineano in colonna), titolo in .label (condensato maiuscolo spaziato);
// - il simbolo matematico sta a parte (`symbol`), fuori dal maiuscolo della .label: "p(x)" non deve diventare "P(X)";
// - il titolo non è mai ruotato: quello dell'asse verticale sta in alto a sinistra, come intestazione della colonna
//   delle cifre; quello dell'asse orizzontale in basso a destra, dove l'asse finisce;
// - tutto recessivo (token --viz-axis e token di testo): il colore forte resta ai dati.
import { usePlot } from './Plot'

export interface AxisProps {
  side?: 'bottom' | 'left' | 'top' | 'right'
  /** elenco esplicito di tacche, oppure un numero indicativo; senza nulla decide lo spazio disponibile */
  ticks?: number | readonly number[]
  /** testo di una tacca; predefinito: il formato che d3 sceglie per quelle tacche */
  format?: (value: number) => string
  /** nome della grandezza, in italiano: "luminosità" */
  label?: string
  /** simbolo e unità, scritti così come sono: "x [cm]", "p̂(x)" */
  symbol?: string
  tickSize?: number
  /** false: solo tacche, senza cifre (assi ripetuti in piccoli multipli) */
  values?: boolean
}

const TEXT_GAP = 4
const TICK_FONT = 12

export function Axis({ side = 'bottom', ticks: spec, format: fmt, label, symbol, tickSize = 6, values = true }: AxisProps) {
  const { x, y, innerWidth, innerHeight, margin, ticks } = usePlot()
  const horizontal = side === 'bottom' || side === 'top'
  const scale = horizontal ? x : y
  const at = ticks(horizontal ? 'x' : 'y', spec)
  const text = fmt ?? scale.tickFormat(typeof spec === 'number' ? spec : Math.max(2, at.length))
  // verso dell'esterno: giù e a destra positivo, su e a sinistra negativo
  const out = side === 'bottom' || side === 'right' ? 1 : -1
  const origin = side === 'bottom' ? `translate(0,${innerHeight})` : side === 'right' ? `translate(${innerWidth},0)` : undefined

  const title =
    label || symbol ? (
      <text
        x={horizontal ? innerWidth : side === 'left' ? -margin.left + 2 : margin.right - 2}
        y={horizontal ? out * (tickSize + TEXT_GAP + TICK_FONT + 16) : -10}
        textAnchor={horizontal || side === 'right' ? 'end' : 'start'}
        fill="var(--text-muted)"
      >
        {label ? <tspan className="label">{label}</tspan> : null}
        {symbol ? (
          <tspan data-axis-symbol="" className="num" fontSize={13} dx={label ? 6 : 0}>
            {symbol}
          </tspan>
        ) : null}
      </text>
    ) : null

  return (
    <g data-axis={side} transform={origin} aria-hidden="true">
      <line x1={0} y1={0} x2={horizontal ? innerWidth : 0} y2={horizontal ? 0 : innerHeight} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
      {at.map((t, i) => {
        const p = scale(t)
        return (
          <g key={`${i}:${t}`} transform={horizontal ? `translate(${p},0)` : `translate(0,${p})`}>
            <line data-tick="" x2={horizontal ? 0 : out * tickSize} y2={horizontal ? out * tickSize : 0} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
            {values ? (
              <text
                className="num"
                fontSize={TICK_FONT}
                fill="var(--text-muted)"
                x={horizontal ? 0 : out * (tickSize + TEXT_GAP)}
                y={horizontal ? out * (tickSize + TEXT_GAP) : 0}
                dy={horizontal ? (side === 'bottom' ? '0.71em' : '0em') : '0.32em'}
                textAnchor={horizontal ? 'middle' : side === 'left' ? 'end' : 'start'}
              >
                {text(t)}
              </text>
            ) : null}
          </g>
        )
      })}
      {title}
    </g>
  )
}
