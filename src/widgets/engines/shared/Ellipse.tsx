// Ellissi di livello di una gaussiana 2D dentro un <Plot>: da m e Σ, ai livelli di Mahalanobis k = 1, 2 σ
// (o quelli chiesti), con semiassi lungo gli autovettori, croce della media, etichette dei livelli e maniglie.
// Serve alla covarianza costruita e stimata, al box contro l'ellisse, alle componenti di EM, al bersaglio delle stime.
//
// - Tutto si calcola nel dominio (ellipseGeometry.ts) e passa per le scale solo alla fine: con assi di unità
//   diverse l'ellisse resta quella dei dati.
// - La verità a terra (role="truth") è tratteggiata, come ogni verità del mondo; le altre ellissi sono piene.
//   Un'ellisse di una classe (`cls`) porta la forma della classe sulla punta del semiasse maggiore esterno.
// - Σ singolare: l'ellisse degenera nel segmento lungo l'autovettore (la S_W di 4 pixel allineati). Σ non valida
//   (non semidefinita): non si disegna nulla; il timbro "non valida" lo mette chi la usa.
// - Maniglie (`handles`): la media (sposta m), la punta del semiasse maggiore (ruota Σ tenendo gli autovalori;
//   con `axes` anche allunga), la punta del semiasse minore (allunga λ2). Tastiera sulla punta maggiore: senza
//   `axes` tutte le frecce ruotano; con `axes` sinistra e destra ruotano, su e giù allungano del 5%.
// - Moto: nessuno. L'ellisse è una misura: cambia quando cambiano m e Σ.
import { format } from 'd3'
import { ClassMark } from '../../kit/plot/ClassMark'
import { roleVar, type VizRole } from '../../kit/plot/colors'
import { classVar } from '../../kit/plot/marks'
import { usePlot } from '../../kit/plot/Plot'
import { DragHandle } from './DragHandle'
import { axisTips, eig2, ellipsePoints, fromEigen, isPsd, massInside, stretchSigma } from './ellipseGeometry'
import { angleFromCenter, tidy, wrapAngle } from './handleMath'
import type { Mat2, Vec2 } from './math/types'

export interface EllipseHandles {
  /** maniglia sulla media */
  mean?: boolean
  /** maniglia sulla punta del semiasse maggiore che ruota Σ */
  rotate?: boolean
  /** maniglie che allungano i semiassi (la punta maggiore, se c'è anche `rotate`, fa le due cose) */
  axes?: boolean
  onChange: (next: { m: Vec2; Sigma: Mat2 }) => void
  /** nomi accessibili; predefiniti "Media", "Asse maggiore", "Asse minore" preceduti da `label` */
  names?: { mean?: string; major?: string; minor?: string }
  /** autovalore minimo raggiungibile allungando (predefinito 1e-4: l'ellisse non collassa per un gesto) */
  minLambda?: number
  /** passo della media da tastiera nel dominio; predefinito un cinquantesimo del dominio x */
  moveStep?: number
  onDragState?: (dragging: boolean) => void
  disabled?: boolean
}

export interface EllipseProps {
  m: Vec2
  Sigma: Mat2
  /** livelli in σ di Mahalanobis; predefiniti 1 e 2. Le maniglie stanno sul primo */
  levels?: readonly number[]
  /** predefinito 'estimate' */
  role?: VizRole
  /** indice di classe: colore e forma della classe */
  cls?: number
  /** predefinito: tratteggiata solo la verità a terra */
  dashed?: boolean
  /** velatura del livello più interno (0 = nessuna; predefinita 0.1 per una classe, 0 altrimenti) */
  fillOpacity?: number
  /** spessore in px; predefinito 2 */
  width?: number
  /** semiassi k√λ lungo gli autovettori, sul primo livello */
  axes?: boolean
  /** "1σ", "2σ" (e la probabilità dentro, con `massLabels`) accanto a ogni livello */
  levelLabels?: boolean
  massLabels?: boolean
  /** croce della media */
  center?: boolean
  /** nome dell'ellisse per chi ascolta e per le maniglie: "Ellisse stimata" */
  label?: string
  handles?: EllipseHandles
  /** punti per livello; predefinito 96 */
  segments?: number
}

const f2 = format('.2f')
const pct = format('.0%')
const n2 = (v: number) => Number(v.toFixed(2))

export function Ellipse({ m, Sigma, levels = [1, 2], role = 'estimate', cls, dashed, fillOpacity, width = 2, axes = false, levelLabels = false, massLabels = false, center = false, label = 'Ellisse', handles, segments = 96 }: EllipseProps) {
  const { x, y, clipPath } = usePlot()
  if (!isPsd(Sigma) || levels.length === 0) return null
  const color = cls !== undefined ? classVar(cls) : roleVar(role)
  const isDashed = dashed ?? role === 'truth'
  const k0 = levels[0]
  const e = eig2(Sigma)
  const tips = axisTips(m, Sigma, k0)
  const outer = Math.max(...levels)
  const outerTip = axisTips(m, Sigma, outer).major
  const veil = fillOpacity ?? (cls !== undefined ? 0.1 : 0)

  const pathOf = (k: number) => {
    const pts = ellipsePoints(m, Sigma, k, segments)
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${n2(x(p[0]))},${n2(y(p[1]))}`).join('') + (e.l2 > 1e-12 ? 'Z' : '')
  }
  const inner = Math.min(...levels)

  const name = (which: 'mean' | 'major' | 'minor', fallback: string) => handles?.names?.[which] ?? `${label}: ${fallback}`
  const sigmaText = `σ₁² = ${f2(Sigma[0][0])}, σ₁₂ = ${f2(Sigma[0][1])}, σ₂² = ${f2(Sigma[1][1])}`
  const eigenText = `λ₁ = ${f2(e.l1)}, λ₂ = ${f2(e.l2)}, asse maggiore a ${f2(e.phi)}°`
  const emit = (next: { m?: Vec2; Sigma?: Mat2 }) => handles?.onChange({ m: next.m ?? m, Sigma: next.Sigma ?? Sigma })
  const minL = handles?.minLambda ?? 1e-4
  const [xa, xb] = x.domain()
  const moveStep = handles?.moveStep ?? Math.abs(xb - xa) / 50

  return (
    <g data-ellipse="">
      <g clipPath={clipPath} pointerEvents="none">
        {veil > 0 ? <path d={pathOf(inner)} fill={color} fillOpacity={veil} stroke="none" /> : null}
        {levels.map((k) => (
          <path key={k} data-level={k} d={pathOf(k)} fill="none" stroke={color} strokeWidth={k === inner ? width : Math.max(1, width - 0.75)} strokeDasharray={isDashed ? '6 4' : undefined} strokeLinejoin="round" />
        ))}
        {axes ? (
          <g stroke={color} strokeWidth={1.25}>
            <line x1={n2(x(m[0]))} y1={n2(y(m[1]))} x2={n2(x(tips.major[0]))} y2={n2(y(tips.major[1]))} />
            <line x1={n2(x(m[0]))} y1={n2(y(m[1]))} x2={n2(x(tips.minor[0]))} y2={n2(y(tips.minor[1]))} />
          </g>
        ) : null}
        {center ? (
          <g transform={`translate(${n2(x(m[0]))},${n2(y(m[1]))})`} stroke="var(--text)" strokeWidth={2}>
            <line x1={-6} x2={6} y1={0} y2={0} />
            <line x1={0} x2={0} y1={-6} y2={6} />
          </g>
        ) : null}
      </g>
      {levelLabels
        ? levels.map((k) => {
            const t = axisTips(m, Sigma, k).major
            return (
              <text
                key={k}
                x={n2(x(t[0]))}
                y={n2(y(t[1]))}
                dx={6}
                dy={-6}
                className="num"
                fontSize={12}
                fontWeight={600}
                fill="var(--text)"
                stroke="var(--surface)"
                strokeWidth={3}
                paintOrder="stroke"
                pointerEvents="none"
                aria-hidden="true"
              >
                {`${k}σ${massLabels ? ` · ${pct(massInside(k))}` : ''}`}
              </text>
            )
          })
        : null}
      {cls !== undefined ? <ClassMark cls={cls} x={x(outerTip[0])} y={y(outerTip[1])} /> : null}

      {handles?.mean ? (
        <DragHandle
          px={x(m[0])}
          py={y(m[1])}
          name="ellipse-mean"
          label={name('mean', 'media')}
          valueText={`m = (${f2(m[0])}, ${f2(m[1])})`}
          valueNow={m[0]}
          valueMin={Math.min(xa, xb)}
          valueMax={Math.max(xa, xb)}
          disabled={handles.disabled}
          tip={{ value: `m = (${f2(m[0])}, ${f2(m[1])})`, label }}
          onDragState={handles.onDragState}
          onDragTo={(dx, dy) => emit({ m: [tidy(dx), tidy(dy)] })}
          onKey={(key, shift) => {
            const s = (shift ? 10 : 1) * moveStep
            const d: Record<string, Vec2> = { ArrowRight: [s, 0], ArrowLeft: [-s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] }
            if (d[key] === undefined) return false
            emit({ m: [tidy(m[0] + d[key][0]), tidy(m[1] + d[key][1])] })
            return true
          }}
        >
          <circle r={20} fill="transparent" />
          <rect x={-6} y={-6} width={12} height={12} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} />
        </DragHandle>
      ) : null}

      {handles?.rotate || handles?.axes ? (
        <DragHandle
          px={x(tips.major[0])}
          py={y(tips.major[1])}
          name="ellipse-major"
          label={name('major', handles.rotate && handles.axes ? 'asse maggiore, frecce sinistra e destra ruotano, su e giù allungano' : handles.rotate ? 'asse maggiore, le frecce ruotano' : 'asse maggiore, le frecce allungano')}
          valueText={`${eigenText}; ${sigmaText}`}
          valueNow={e.phi}
          valueMin={0}
          valueMax={180}
          roleDescription="maniglia dell'ellisse"
          disabled={handles.disabled}
          tip={{ value: handles.rotate ? `φ = ${f2(e.phi)}°` : `λ₁ = ${f2(e.l1)}`, label }}
          onDragState={handles.onDragState}
          onDragTo={(dx, dy) => {
            const v: Vec2 = [dx - m[0], dy - m[1]]
            const len = Math.hypot(v[0], v[1])
            if (!(len > 0)) return
            const phi = handles.rotate ? angleFromCenter(v[0], v[1]) : e.phi
            const l1 = handles.axes ? Math.max((len / k0) ** 2, minL) : e.l1
            emit({ Sigma: fromEigen(l1, e.l2, phi) })
          }}
          onKey={(key, shift) => {
            const turn = shift ? 15 : 1
            const grow = shift ? 1.25 : 1.05
            // come la manopola: destra e su aumentano l'angolo (verso antiorario)
            const rotKeys: Record<string, number> = handles.axes ? { ArrowRight: turn, ArrowLeft: -turn } : { ArrowRight: turn, ArrowLeft: -turn, ArrowUp: turn, ArrowDown: -turn }
            if (handles.rotate && rotKeys[key] !== undefined) {
              emit({ Sigma: fromEigen(e.l1, e.l2, wrapAngle(e.phi + rotKeys[key], 180)) })
              return true
            }
            const growKeys: Record<string, number> = handles.rotate ? { ArrowUp: grow, ArrowDown: 1 / grow } : { ArrowUp: grow, ArrowRight: grow, ArrowDown: 1 / grow, ArrowLeft: 1 / grow }
            if (handles.axes && growKeys[key] !== undefined) {
              emit({ Sigma: stretchSigma(Sigma, 'major', k0 * Math.sqrt(Math.max(e.l1, 0)) * growKeys[key], k0, minL) })
              return true
            }
            return false
          }}
        >
          <circle r={20} fill="transparent" />
          <circle r={6.5} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} />
        </DragHandle>
      ) : null}

      {handles?.axes ? (
        <DragHandle
          px={x(tips.minor[0])}
          py={y(tips.minor[1])}
          name="ellipse-minor"
          label={name('minor', 'asse minore, le frecce allungano')}
          valueText={`${eigenText}; ${sigmaText}`}
          valueNow={e.l2}
          valueMin={0}
          valueMax={Math.max(e.l1, e.l2)}
          roleDescription="maniglia dell'ellisse"
          disabled={handles.disabled}
          tip={{ value: `λ₂ = ${f2(e.l2)}`, label }}
          onDragState={handles.onDragState}
          onDragTo={(dx, dy) => {
            // solo la componente lungo e2 conta: trascinare di lato non cambia λ2
            const along = Math.abs((dx - m[0]) * e.e2[0] + (dy - m[1]) * e.e2[1])
            emit({ Sigma: stretchSigma(Sigma, 'minor', along, k0, minL) })
          }}
          onKey={(key, shift) => {
            const grow = shift ? 1.25 : 1.05
            const factor: Record<string, number> = { ArrowUp: grow, ArrowRight: grow, ArrowDown: 1 / grow, ArrowLeft: 1 / grow }
            if (factor[key] === undefined) return false
            emit({ Sigma: stretchSigma(Sigma, 'minor', k0 * Math.sqrt(Math.max(e.l2, minL)) * factor[key], k0, minL) })
            return true
          }}
        >
          <circle r={20} fill="transparent" />
          <circle r={5.5} fill="var(--surface)" stroke="var(--pin-contrast)" strokeWidth={2.5} />
        </DragHandle>
      ) : null}
    </g>
  )
}
