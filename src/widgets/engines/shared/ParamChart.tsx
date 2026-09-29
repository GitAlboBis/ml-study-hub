// ParamChart: il grafico piccolo "grandezza contro parametro" che quasi ogni motore mette accanto al terreno. Curve a
// U (ISE contro h, bias² + varianza), errore contro soglia, J(θ), accuratezza contro n, varianza contro N in scala log.
//
//   curve teoriche (f o punti)      ──  linea del ruolo o della classe, tratteggiata solo se è la verità
//   punti Monte Carlo (± barre)     ●┬  il marcatore della classe con l'anello di carta, barra d'errore con i cappucci
//   valore corrente del parametro   │▪  verticale a inchiostro con lo spillo e la lettura "N = 120"
//   ottimi e riferimenti            ◆   rombo ocra (h*, il picco), linea a quota 1 con la sua etichetta
//
// SCELTE (skill dataviz)
// - Scale log sopra il Plot lineare del kit: si disegna log10 dei valori (paramAxes.ts) e le tacche dicono i valori
//   veri; 1-2-5 per decade, poi solo le potenze di 10.
// - Costruzione punto per punto: `upTo` mostra solo ciò che ha x ≤ upTo, e le curve finiscono esattamente in upTo.
//   Il motore lo fa crescere con il racconto (25 passi logaritmici di N): ogni passo è uno stato completo.
// - Un asse solo per grandezza: niente doppio asse y. Due grandezze di scala diversa sono due ParamChart.
// - Identità mai del solo colore: ogni serie di punti ha la forma della sua classe; con due o più serie c'è sempre la
//   legenda; il tratteggio vuol dire solo "verità" (curva teorica di riferimento).
// - Letture senza puntatore: il cursore-quota del Plot si muove da tastiera e legge il punto più vicino (serie,
//   parametro, valore, barra d'errore) e il valore delle curve; con `onPick` il clic, o Invio sul cursore, porta il
//   parametro lì. Le letture hanno 3 cifre significative (formatReading), le tacche il loro formato (formatTick); con
//   `snap` il cursore legge e sceglie solo valori dello slider del parametro.
//
// MOTO. Un punto nuovo entra in 200 ms (opacità, ease-out, CSS @starting-style: niente JavaScript, niente layout).
// Il resto segue i dati senza animazioni: il grafico risponde a slider e passi che l'utente muove spesso.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { M } from '../../../components/content/M'
import { Axis } from '../../kit/plot/Axis'
import { roleVar } from '../../kit/plot/colors'
import type { VizRole } from '../../kit/plot/colors'
import { Grid } from '../../kit/plot/Grid'
import { LinePath } from '../../kit/plot/LinePath'
import { classSymbolPath, classVar } from '../../kit/plot/marks'
import { Plot, usePlot } from '../../kit/plot/Plot'
import type { MarkReading } from '../../kit/plot/Plot'
import { autoDomain, axisTicks, clipUpTo, formatReading, formatTick, fromAxis, sampleCurve, toAxis } from './paramAxes'

export interface ParamAxis {
  /** nome della grandezza in italiano: "campioni", "errore integrato" */
  label: string
  /** simbolo in testo semplice, sull'asse e nelle letture: "N", "ISE" */
  symbol?: string
  /** estremi; per l'asse y predefinito quelli dei dati con un margine */
  domain?: readonly [number, number]
  log?: boolean
  /** testo di tacche e letture; predefinito formatTick sulle tacche e formatReading (3 cifre significative) nelle letture */
  format?: (v: number) => string
}

export interface ParamCurve {
  id: string
  /** nome in parole, in legenda e nelle letture */
  label: string
  /** simbolo in LaTeX per la legenda */
  latex?: string
  role?: VizRole
  /** indice di classe (0-5): colore e forma, vince sul ruolo */
  cls?: number
  dashed?: boolean
  /** curva teorica, campionata sul dominio x (in scala log se l'asse lo è) */
  f?: (x: number) => number
  /** oppure i punti già calcolati [x, y] */
  data?: readonly (readonly [number, number])[]
  width?: number
}

export interface ParamPoint {
  x: number
  y: number
  /** estremi della barra d'errore (per esempio media ± 1.96 errori standard) */
  lo?: number
  hi?: number
}

export interface ParamPoints {
  id: string
  label: string
  latex?: string
  role?: VizRole
  cls?: number
  data: readonly ParamPoint[]
  /** unisce i punti con un filo sottile */
  connect?: boolean
}

export interface ParamChartProps {
  x: ParamAxis & { domain: readonly [number, number] }
  y: ParamAxis
  curves?: readonly ParamCurve[]
  points?: readonly ParamPoints[]
  /** valore corrente del parametro: verticale con lo spillo */
  current?: { value: number; label?: string }
  /** ottimi e punti notevoli: rombo ocra con etichetta; senza y, un segno sull'asse */
  markers?: readonly { id: string; x: number; y?: number; label: string }[]
  /** linee orizzontali di riferimento (quota 1 del rapporto var/bound) */
  refLines?: readonly { y: number; label?: string }[]
  /** costruzione punto per punto: solo ciò che ha x ≤ upTo */
  upTo?: number
  ariaLabel: string
  description?: string
  /** misura di partenza e rapporto; predefinito 480 × 260 */
  width?: number
  height?: number
  /**
   * riempie il contenitore, che deve avere un'altezza propria (il terreno del WidgetFrame, una cella di griglia):
   * il grafico prende l'altezza che resta dopo la legenda invece di tenere il rapporto width / height. Non scende
   * sotto 8rem: in un terreno troppo basso (un aspect largo a 390 px) il grafico resta leggibile e la legenda scorre
   */
  fill?: boolean
  /** legenda sotto il grafico; predefinita con due o più serie */
  legend?: boolean
  /**
   * clic sul grafico (o Invio sul cursore di lettura): porta il parametro al valore. Senza `snap` il valore è quello
   * sotto il puntatore (N = 31.62 su un asse log): il motore lo aggancia con snapParam prima di usarlo
   */
  onPick?: (x: number) => void
  /**
   * aggancia l'ascissa letta dal cursore e scelta con clic o Invio a un valore del parametro (per esempio
   * `(x) => snapParam(spec, x)`): la lettura dice il valore agganciato e onPick lo riceve già tondo
   */
  snap?: (x: number) => number
}

const MARGIN = { top: 20, right: 18, bottom: 40, left: 54 }
const POINT_SIZE = Math.PI * 4 * 4
const READ_REACH = 24

const identity = (v: number) => v

const colorOf = (s: { role?: VizRole; cls?: number }, fallback: VizRole) => (s.cls !== undefined ? classVar(s.cls) : roleVar(s.role ?? fallback))

/** Etichetta a inchiostro con alone di carta, come i toponimi: si legge sopra curve e punti. */
function Tag({ x, y, text, anchor = 'middle' }: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <text className="num" x={x} y={y} fontSize={12} fontWeight={600} textAnchor={anchor} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} strokeLinejoin="round" paintOrder="stroke">
      {text}
    </text>
  )
}

interface MarksProps {
  series: readonly ParamPoints[]
  xLog: boolean
  yLog: boolean
  upTo: number
  fx: (v: number) => string
  fy: (v: number) => string
  xName: string
  yName: string
}

/** Punti con barre d'errore; si registrano nel Plot per il cursore di lettura. */
function PointMarks({ series, xLog, yLog, upTo, fx, fy, xName, yName }: MarksProps) {
  const { x, y, innerHeight, registerReadable } = usePlot()
  const shown = series.map((s) => ({ ...s, data: s.data.filter((p) => p.x <= upTo && Number.isFinite(toAxis(p.x, xLog)) && Number.isFinite(toAxis(p.y, yLog))) }))
  const px = (v: number) => x(toAxis(v, xLog))
  const py = (v: number) => y(toAxis(v, yLog))
  const clampY = (v: number) => Math.min(Math.max(v, 0), innerHeight)

  // le letture leggono i dati dell'ultimo render: cambiarli non richiede di registrarsi di nuovo
  const latest = useRef({ shown, px, py })
  useLayoutEffect(() => {
    latest.current = { shown, px, py }
  })
  const text = useRef({ fx, fy, xName, yName })
  useLayoutEffect(() => {
    text.current = { fx, fy, xName, yName }
  })
  useEffect(
    () =>
      registerReadable({
        named: '',
        nearest(qx, qy, mode) {
          const { shown: all, px: sx, py: sy } = latest.current
          const t = text.current
          let best: MarkReading | null = null
          for (const s of all) {
            for (const p of s.data) {
              const dx = sx(p.x) - qx
              const d = mode === 'x' ? Math.abs(dx) : Math.hypot(dx, sy(p.y) - qy)
              if (d > READ_REACH || (best !== null && d >= best.distance)) continue
              const bar = p.lo !== undefined && p.hi !== undefined ? ` (da ${t.fy(p.lo)} a ${t.fy(p.hi)})` : ''
              best = { distance: d, text: `${s.label} · ${t.xName} = ${t.fx(p.x)} · ${t.yName} = ${t.fy(p.y)}${bar}` }
            }
          }
          return best
        },
      }),
    [registerReadable],
  )

  return (
    <g data-points="" pointerEvents="none">
      {shown.map((s, si) => {
        const color = colorOf(s, 'sample')
        const path = classSymbolPath(s.cls ?? si, POINT_SIZE)
        return (
          <g key={s.id} data-series={s.id}>
            {s.connect === true && s.data.length > 1 ? (
              <polyline points={s.data.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')} fill="none" stroke={color} strokeWidth={1.25} strokeOpacity={0.7} />
            ) : null}
            {s.data.map((p, i) => {
              const cx = px(p.x)
              const cy = py(p.y)
              const hasBar = p.lo !== undefined && p.hi !== undefined
              const y0 = hasBar ? clampY(py(p.lo as number)) : cy
              const y1 = hasBar ? clampY(py(p.hi as number)) : cy
              return (
                // un punto nuovo entra in dissolvenza (200 ms): quelli già lì restano fermi, la chiave è l'indice
                <g key={`${s.id}:${i}`} data-point={`${s.id}:${i}`} className="transition-opacity duration-200 ease-out starting:opacity-0">
                  {hasBar && Number.isFinite(y0) && Number.isFinite(y1) ? (
                    <g stroke={color} strokeWidth={1.5} data-errorbar="">
                      <line x1={cx} x2={cx} y1={y0} y2={y1} />
                      <line x1={cx - 3.5} x2={cx + 3.5} y1={y0} y2={y0} />
                      <line x1={cx - 3.5} x2={cx + 3.5} y1={y1} y2={y1} />
                    </g>
                  ) : null}
                  <path transform={`translate(${cx},${cy})`} d={path} fill={color} stroke="var(--surface)" strokeWidth={3} strokeLinejoin="round" paintOrder="stroke" />
                </g>
              )
            })}
          </g>
        )
      })}
    </g>
  )
}

/** Verticale del valore corrente del parametro, con lo spillo in alto e la lettura. */
function CurrentLine({ at, label }: { at: number; label: string }) {
  const { x, innerWidth, innerHeight } = usePlot()
  const px = x(at)
  if (!Number.isFinite(px) || px < -0.5 || px > innerWidth + 0.5) return null
  const anchor = px > innerWidth * 0.75 ? 'end' : px < innerWidth * 0.25 ? 'start' : 'middle'
  return (
    <g data-current="" pointerEvents="none">
      <line x1={px} x2={px} y1={0} y2={innerHeight} stroke="var(--viz-boundary)" strokeWidth={1.5} />
      <rect x={px - 4} y={-4} width={8} height={8} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.25} />
      <Tag x={anchor === 'start' ? px + 7 : anchor === 'end' ? px - 7 : px} y={-8} text={label} anchor={anchor} />
    </g>
  )
}

/** Clic sul grafico: porta il parametro lì. Il rettangolo sta sotto i segni, sopra il cursore del Plot. */
function PickSurface({ onPick, xLog, snap }: { onPick: (v: number) => void; xLog: boolean; snap: (v: number) => number }) {
  const { innerWidth, innerHeight, toData } = usePlot()
  return (
    <rect
      data-pick=""
      x={0}
      y={0}
      width={innerWidth}
      height={innerHeight}
      fill="transparent"
      style={{ cursor: 'pointer' }}
      onClick={(e) => onPick(snap(fromAxis(toData(e.clientX, e.clientY)[0], xLog)))}
    />
  )
}

/**
 * Reticolo o assi, con tacche che dipendono dallo spazio vero dell'area interna (letto dal Plot): su un telefono le
 * tacche log passano da 1-2-5 alle sole potenze di 10 prima che le cifre si tocchino.
 */
function ChartFrame({ part, xa, ya, yDomain, fx, fy }: { part: 'grid' | 'axes'; xa: ParamChartProps['x']; ya: ParamAxis; yDomain: readonly [number, number]; fx: (v: number) => string; fy: (v: number) => string }) {
  const { innerWidth, innerHeight } = usePlot()
  const xLog = xa.log === true
  const yLog = ya.log === true
  const xTicks = axisTicks(xa.domain, xLog, Math.max(2, Math.floor(innerWidth / 72))).map((v) => toAxis(v, xLog))
  const yTicks = axisTicks(yDomain, yLog, Math.max(2, Math.floor(innerHeight / 40))).map((v) => toAxis(v, yLog))
  if (part === 'grid') return <Grid xTicks={xTicks} yTicks={yTicks} />
  return (
    <>
      <Axis side="bottom" ticks={xTicks} format={(t) => fx(fromAxis(t, xLog))} label={xa.label} symbol={xa.symbol} />
      <Axis side="left" ticks={yTicks} format={(t) => fy(fromAxis(t, yLog))} symbol={ya.symbol ?? ya.label} />
    </>
  )
}

/** Il tassello della legenda: lo stesso segno che la serie ha nel grafico. */
function Swatch({ kind, color, dashed, cls }: { kind: 'curve' | 'points'; color: string; dashed?: boolean; cls: number }) {
  return (
    <svg width={28} height={16} viewBox="0 0 28 16" aria-hidden="true" className="shrink-0">
      {kind === 'curve' ? (
        <path d="M1 8h26" stroke={color} strokeWidth={2.5} strokeDasharray={dashed ? '6 4' : undefined} />
      ) : (
        <>
          <path d="M14 2v12M10.5 2h7M10.5 14h7" stroke={color} strokeWidth={1.5} fill="none" />
          <path transform="translate(14,8)" d={classSymbolPath(cls, POINT_SIZE)} fill={color} stroke="var(--surface)" strokeWidth={3} paintOrder="stroke" />
        </>
      )}
    </svg>
  )
}

export function ParamChart(props: ParamChartProps) {
  const { x: xa, y: ya, curves = [], points = [], current, markers = [], refLines = [], upTo = Number.POSITIVE_INFINITY, ariaLabel, description, width = 480, height = 260, fill = false, onPick } = props
  const snap = props.snap ?? identity
  const xLog = xa.log === true
  const yLog = ya.log === true
  // tacche e valore corrente (valori esatti del parametro) con il formato delle tacche; letture a 3 cifre
  const fx = xa.format ?? formatTick
  const fy = ya.format ?? formatTick
  const rx = xa.format ?? formatReading
  const ry = ya.format ?? formatReading
  const xName = xa.symbol ?? xa.label
  const yName = ya.symbol ?? ya.label

  // le curve teoriche, campionate una volta per funzione e dominio
  const [x0, x1] = xa.domain
  const sampled = useMemo(
    () => curves.map((c) => ({ c, pts: c.data !== undefined ? c.data.map((p) => [p[0], p[1]] as [number, number]) : c.f !== undefined ? sampleCurve(c.f, [x0, x1], xLog) : [] })),
    [curves, x0, x1, xLog],
  )
  const yDomain = useMemo(() => {
    if (ya.domain !== undefined) return ya.domain
    const ys: number[] = []
    for (const { pts } of sampled) for (const p of pts) ys.push(p[1])
    for (const s of points) for (const p of s.data) ys.push(p.y, p.lo ?? p.y, p.hi ?? p.y)
    for (const r of refLines) ys.push(r.y)
    return autoDomain(ys, yLog)
  }, [ya.domain, sampled, points, refLines, yLog])

  const tx = (v: number) => toAxis(v, xLog)
  const ty = (v: number) => toAxis(v, yLog)

  // cursore: ultima ascissa letta, per Invio → onPick
  const cursorX = useRef<number | null>(null)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onPick === undefined || e.key !== 'Enter' || cursorX.current === null) return
    const el = e.target as Element
    if (el.getAttribute('role') !== 'slider' || el.closest('[data-plot-area]') === null) return
    e.preventDefault()
    onPick(cursorX.current)
  }
  const withF = curves.filter((c) => c.f !== undefined).slice(0, 2)
  const cursorFormat = (cx: number) => {
    const v = snap(fromAxis(cx, xLog))
    return [`${xName} = ${rx(v)}`, ...withF.map((c) => `${c.label} ${ry((c.f as (x: number) => number)(v))}`)].join(' · ')
  }

  const series = curves.length + points.length
  const showLegend = props.legend ?? series >= 2
  const summary = [
    curves.length > 0 ? `Curve: ${curves.map((c) => c.label).join(', ')}.` : '',
    points.length > 0 ? `Punti: ${points.map((s) => `${s.label} (${s.data.filter((p) => p.x <= upTo).length})`).join(', ')}.` : '',
    current !== undefined ? `Valore corrente: ${xName} = ${fx(current.value)}.` : '',
    ...markers.map((m) => `${m.label} in ${xName} = ${rx(m.x)}.`),
  ]
    .filter((s) => s !== '')
    .join(' ')

  return (
    <div data-param-chart="" className={fill ? 'grid h-full min-h-0 grid-rows-[minmax(8rem,1fr)_auto] gap-2 overflow-y-auto' : 'grid gap-2'}>
      <div onKeyDown={onKeyDown} className={fill ? 'min-h-0' : undefined}>
        <Plot
          width={width}
          height={height}
          fill={fill}
          xDomain={[tx(x0), tx(x1)]}
          yDomain={[ty(yDomain[0]), ty(yDomain[1])]}
          margin={MARGIN}
          ariaLabel={ariaLabel}
          description={`${description ?? ''} ${summary}`.trim()}
          cursor="x"
          cursorFormat={cursorFormat}
          onCursor={(p) => {
            cursorX.current = p === null ? null : snap(fromAxis(p.x, xLog))
          }}
        >
          <ChartFrame part="grid" xa={xa} ya={ya} yDomain={yDomain} fx={fx} fy={fy} />
          {onPick !== undefined ? <PickSurface onPick={onPick} xLog={xLog} snap={snap} /> : null}
          {refLines.map((r, i) => (
            <RefLine key={`${i}:${r.y}`} at={ty(r.y)} label={r.label} />
          ))}
          {sampled.map(({ c, pts }) => {
            const visible = clipUpTo(pts, upTo, xLog).map(([px, py]) => [tx(px), ty(py)])
            return visible.length > 1 ? (
              <g key={c.id} data-curve={c.id}>
                <LinePath data={visible} role={c.role ?? 'estimate'} cls={c.cls} dashed={c.dashed} width={c.width ?? 2} />
              </g>
            ) : null
          })}
          <PointMarks series={points} xLog={xLog} yLog={yLog} upTo={upTo} fx={rx} fy={ry} xName={xName} yName={yName} />
          {markers.map((m) => (
            <MarkerMark key={m.id} x={tx(m.x)} y={m.y === undefined ? undefined : ty(m.y)} label={m.label} />
          ))}
          {current !== undefined ? <CurrentLine at={tx(current.value)} label={current.label ?? `${xName} = ${fx(current.value)}`} /> : null}
          <ChartFrame part="axes" xa={xa} ya={ya} yDomain={yDomain} fx={fx} fy={fy} />
        </Plot>
      </div>
      {showLegend ? (
        <ul aria-label="Legenda" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[length:var(--step--1)]">
          {curves.map((c) => (
            <li key={`c-${c.id}`} className="flex items-center gap-2">
              <Swatch kind="curve" color={colorOf(c, 'estimate')} dashed={c.dashed ?? c.role === 'truth'} cls={c.cls ?? 0} />
              {c.latex !== undefined ? (
                <span aria-hidden="true">
                  <M tex={c.latex} />
                </span>
              ) : null}
              <span>{c.label}</span>
            </li>
          ))}
          {points.map((s, i) => (
            <li key={`p-${s.id}`} className="flex items-center gap-2">
              <Swatch kind="points" color={colorOf(s, 'sample')} cls={s.cls ?? i} />
              {s.latex !== undefined ? (
                <span aria-hidden="true">
                  <M tex={s.latex} />
                </span>
              ) : null}
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Linea orizzontale di riferimento, sottile e piena (il tratteggio vuol dire "verità"), con l'etichetta a destra. */
function RefLine({ at, label }: { at: number; label?: string }) {
  const { y, innerWidth } = usePlot()
  const py = y(at)
  if (!Number.isFinite(py)) return null
  return (
    <g data-refline="" pointerEvents="none">
      <line x1={0} x2={innerWidth} y1={py} y2={py} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
      {label !== undefined ? (
        <text className="num" x={innerWidth - 4} y={py - 5} fontSize={11} textAnchor="end" fill="var(--text-muted)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
          {label}
        </text>
      ) : null}
    </g>
  )
}

/** Un ottimo o un punto notevole: rombo ocra con bordino a inchiostro ed etichetta; senza y, un segno sull'asse x. */
function MarkerMark({ x: at, y: atY, label }: { x: number; y?: number; label: string }) {
  const { x, y, innerWidth, innerHeight } = usePlot()
  const px = x(at)
  if (!Number.isFinite(px) || px < -0.5 || px > innerWidth + 0.5) return null
  const py = atY === undefined ? innerHeight : Math.min(Math.max(y(atY), 0), innerHeight)
  const anchor = px > innerWidth * 0.8 ? 'end' : px < innerWidth * 0.2 ? 'start' : 'middle'
  return (
    <g data-marker="" pointerEvents="none">
      {atY === undefined ? (
        <path d={`M${px},${py - 9}l6,9h-12z`} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.25} />
      ) : (
        <path transform={`translate(${px},${py})`} d="M0,-6.5L6.5,0L0,6.5L-6.5,0Z" fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.25} />
      )}
      <Tag x={px} y={py - 12} text={label} anchor={anchor} />
    </g>
  )
}
