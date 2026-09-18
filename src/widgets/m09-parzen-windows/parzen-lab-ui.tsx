// Pezzi di interfaccia condivisi dai widget del foglio m09 scritti a mano sul kit (lotto "dal conteggio al
// bias"). Il kit non si tocca: ciò che manca sta qui, fatto con i suoi stessi token e le sue regole.
//
// - Verdict, Lamp: esiti e spie (successo e avviso con icona e parole, mai il solo colore; il rosso non è uno stato)
// - Stamp: timbro sul terreno (spillo ocra, si sovrappone al grafico e quindi ha l'ombra)
// - SeriesLegend: legenda delle curve con il segno che ciascuna ha nel terreno
// - AreaMeter: il misuratore dell'area sotto una curva, con la tacca dell'1
// - dentro <Plot>: Rug (i campioni come tacche sul nastro), JumpMarks (i salti del rettangolare), Reveal (una
//   curva che si disegna da sinistra), BetweenArea (l'area fra due curve, tratteggiata a inchiostro)
//
// MOTO. Nessuno qui dentro: le geometrie seguono i numeri che arrivano (storyboard o tween del widget).
import { area } from 'd3'
import type { ReactNode } from 'react'
import { useId } from 'react'
import { M } from '../../components/content/M'
import { fixed, typographic } from '../kit/format'
import { roleVar } from '../kit/plot/colors'
import type { VizRole } from '../kit/plot/colors'
import { classSymbolPath, classVar } from '../kit/plot/marks'
import { usePlot } from '../kit/plot/Plot'

const ICON = { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'square', 'aria-hidden': true } as const
const n2 = (v: number) => Number(v.toFixed(2))

export function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...ICON} width={size} height={size} className="shrink-0 text-ok">
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  )
}

export function WarnIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...ICON} width={size} height={size} className="shrink-0 text-warn">
      <path d="M12 4v10M12 18.5v.5" />
    </svg>
  )
}

export function InfoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...ICON} width={size} height={size} className="mt-0.5 shrink-0 text-info">
      <path d="M12 10v8M12 6v.5" />
    </svg>
  )
}

/** Esito di una verifica: frase con icona, fondo di successo o di avviso. */
export function Verdict({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <p className={`m-0 flex items-start gap-2 border border-border p-2.5 ${ok ? 'bg-ok-bg' : 'bg-warn-bg'}`}>
      {ok ? <CheckIcon /> : <WarnIcon />}
      <span className="min-w-0">{children}</span>
    </p>
  )
}

/** Nota con l'icona dell'informazione, a inchiostro tenue. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 flex gap-2 text-[length:var(--step--1)] text-muted">
      <InfoIcon />
      <span className="min-w-0">{children}</span>
    </p>
  )
}

/**
 * Spia di una condizione: verde con la spunta se vale, color avviso con il punto esclamativo se no. Il testo
 * dice sempre lo stato in parole ("vale", "violata"), per chi non distingue i colori e per chi ascolta.
 */
export function Lamp({ ok, tex, label, en, why, pending = false }: { ok: boolean; tex?: string; label: string; en?: string; why?: ReactNode; pending?: boolean }) {
  if (pending) {
    // spia ancora spenta (si accende in sequenza nel racconto): niente colore di stato, solo la voce
    return (
      <li className="flex min-h-10 items-start gap-2 border border-border px-2.5 py-2 text-muted" data-lamp="pending">
        <span aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 rounded-full border-2 border-border" />
        <span className="flex flex-wrap items-baseline gap-x-2">
          {tex !== undefined ? (
            <span aria-hidden="true">
              <M tex={tex} />
            </span>
          ) : null}
          <span className="label">{label}</span>
          <span className="text-[length:var(--step--1)]">in verifica</span>
        </span>
      </li>
    )
  }
  return (
    <li className={`flex min-h-10 items-start gap-2 border border-border px-2.5 py-2 ${ok ? 'bg-ok-bg' : 'bg-warn-bg'}`} data-lamp={ok ? 'ok' : 'ko'}>
      {ok ? <CheckIcon size={18} /> : <WarnIcon size={18} />}
      <span className="grid min-w-0 gap-0.5">
        <span className="flex flex-wrap items-baseline gap-x-2">
          {tex !== undefined ? (
            <span aria-hidden="true">
              <M tex={tex} />
            </span>
          ) : null}
          <span className="label text-text">{label}</span>
          <span className="text-[length:var(--step--1)] font-semibold">{ok ? 'vale' : 'violata'}</span>
        </span>
        {en !== undefined ? (
          <em className="text-[length:var(--step--1)] text-muted" lang="en">
            {en}
          </em>
        ) : null}
        {why !== undefined ? <span className="text-[length:var(--step--1)] text-muted">{why}</span> : null}
      </span>
    </li>
  )
}

/** Timbro sul terreno: in alto a destra (o a sinistra), spillo ocra con bordo a inchiostro e ombra. */
export function Stamp({ it, en, side = 'right', icon }: { it: string; en?: string; side?: 'left' | 'right'; icon?: ReactNode }) {
  return (
    <p className={`pointer-events-none absolute top-2 ${side === 'right' ? 'right-2' : 'left-2'} m-0 flex max-w-[70%] items-center gap-2 border border-border-strong bg-pin px-2 py-1 text-pin-contrast shadow-1`}>
      {icon}
      <span className="grid leading-tight">
        <span className="label text-pin-contrast">{it}</span>
        {en !== undefined ? (
          <em className="text-[length:var(--step--1)]" lang="en">
            {en}
          </em>
        ) : null}
      </span>
    </p>
  )
}

export interface SeriesItem {
  /** il segno: una linea con il ruolo (tratteggiata se truth), una linea di classe, una velatura, un rettangolo */
  kind: 'line' | 'wash' | 'hatch' | 'window'
  role?: VizRole
  cls?: number
  dashed?: boolean
  width?: number
  label: ReactNode
}

function SeriesSwatch({ item }: { item: SeriesItem }) {
  const stroke = item.cls !== undefined ? classVar(item.cls) : roleVar(item.role ?? 'estimate')
  const common = { width: 28, height: 14, viewBox: '0 0 28 14', 'aria-hidden': true } as const
  switch (item.kind) {
    case 'wash':
      return (
        <svg {...common}>
          <rect x={1} y={2} width={26} height={11} fill={stroke} fillOpacity={0.25} stroke={stroke} strokeWidth={1} />
        </svg>
      )
    case 'hatch':
      return (
        <svg {...common}>
          <rect x={1} y={2} width={26} height={11} fill="none" stroke="var(--text)" strokeWidth={1} />
          <path d="M3 13l8-11M9 13l8-11M15 13l8-11M21 13l6-8" stroke="var(--text)" strokeWidth={1} strokeOpacity={0.6} />
        </svg>
      )
    case 'window':
      return (
        <svg {...common}>
          <rect x={4} y={1} width={20} height={12} fill="var(--pin)" fillOpacity={0.35} stroke="var(--pin-contrast)" strokeWidth={1.25} />
        </svg>
      )
    default: {
      const cased = item.role === 'accent' || item.role === 'highlight'
      return (
        <svg {...common}>
          {cased ? <path d="M1 7h26" stroke="var(--pin-contrast)" strokeWidth={(item.width ?? 2) + 2} /> : null}
          <path d="M1 7h26" stroke={stroke} strokeWidth={item.width ?? 2} strokeDasharray={item.dashed ?? item.role === 'truth' ? '6 4' : undefined} />
        </svg>
      )
    }
  }
}

/** Legenda delle curve: tassello con lo stesso segno del terreno e nome a inchiostro (mai del colore della serie). */
export function SeriesLegend({ items, className = '' }: { items: readonly SeriesItem[]; className?: string }) {
  return (
    <ul className={`m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[length:var(--step--1)] ${className}`}>
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-1.5">
          <SeriesSwatch item={it} />
          <span>{it.label}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Misuratore dell'area: una barra riempita fino al valore su una scala da 0 a `max`, con la tacca dell'1 (la
 * condizione di densità). Oltre il fondo scala la barra si ferma e compare la freccia "fuori scala". Il numero
 * a tre decimali sta accanto, in cifre di strumento; la barra è per gli occhi, il numero anche per chi ascolta.
 */
export function AreaMeter({ value, max = 2, label = 'Area sotto la curva', tex = '\\int \\hat p(x)\\,dx', fill = 1 }: { value: number; max?: number; label?: string; tex?: string; fill?: number }) {
  const frac = Math.max(0, Math.min(1, (value * fill) / max))
  const over = value > max
  const ok = Math.abs(value - 1) < 5e-3
  const shown = typographic(fixed(3)(value))
  return (
    <div className="grid gap-1">
      <span className="flex items-baseline justify-between gap-2">
        <span className="flex items-baseline gap-2">
          <span aria-hidden="true">
            <M tex={tex} />
          </span>
          <span className="label">{label}</span>
        </span>
        <output aria-live="polite" className="num text-[length:var(--step-1)] leading-tight">
          {shown}
          <span className="visually-hidden">{ok ? ', uguale a 1' : ', diversa da 1'}</span>
        </output>
      </span>
      <span aria-hidden="true" className="relative block h-4 border border-border-strong bg-surface-2">
        <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${frac * 100}%` }} />
        {/* la tacca dell'1: la condizione di densità */}
        <span className="absolute -inset-y-1 w-0.5 bg-pin outline outline-1 outline-border-strong" style={{ left: `calc(${(1 / max) * 100}% - 1px)` }} />
        {over ? (
          <svg viewBox="0 0 8 10" width={8} height={10} className="absolute top-1/2 right-0.5 -translate-y-1/2 text-accent-contrast">
            <path d="M0 0l8 5-8 5z" fill="currentColor" />
          </svg>
        ) : null}
      </span>
      <span aria-hidden="true" className="num flex justify-between text-[length:var(--step--1)] text-faint">
        <span>0</span>
        <span>1</span>
        <span>{typographic(String(max))}</span>
      </span>
    </div>
  )
}

// --- strati dentro <Plot> ---

export interface RugItem {
  x: number
  /** 0 = ancora in alto (non caduto), 1 = sul nastro; già con l'accelerazione applicata */
  drop?: number
  /** acceso (dentro la finestra, fra i K vicini…) */
  lit?: boolean
}

/**
 * I campioni come tacche verticali sul nastro sotto lo zero (rug plot); cadono dall'alto con `drop`. `top` è la quota
 * del bordo alto del nastro (predefinita 0; più in basso se la curva scende sotto zero e deve restare visibile).
 */
export function Rug({ items, bottom, from, top: topValue = 0, lit = 'var(--viz-highlight)' }: { items: readonly RugItem[]; bottom: number; from: number; top?: number; lit?: string }) {
  const { x, y, innerWidth } = usePlot()
  const top = y(topValue)
  const base = y(bottom)
  const len = Math.max(6, (base - top) * 0.7)
  return (
    <g data-rug="" pointerEvents="none">
      <rect x={0} y={top} width={innerWidth} height={Math.max(0, base - top)} fill="var(--surface-2)" />
      <line x1={0} x2={innerWidth} y1={top} y2={top} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
      {items.map((s, i) => {
        const d = s.drop ?? 1
        if (d <= 0) return null
        const cx = n2(x(s.x))
        const y1 = d >= 1 ? base - 2 : y(from) + (base - 2 - y(from)) * d
        return (
          <g key={i} data-rug-sample="">
            {s.lit ? <rect x={cx - 3} y={n2(y1 - len)} width={6} height={n2(len)} fill={lit} stroke="var(--pin-contrast)" strokeWidth={1} /> : null}
            <line x1={cx} x2={cx} y1={n2(y1 - len)} y2={n2(y1)} stroke="var(--viz-sample)" strokeWidth={1.5} />
          </g>
        )
      })}
    </g>
  )
}

/** I salti di una stima a gradini: triangolini a inchiostro sulla linea dello zero, puntati verso l'alto. */
export function JumpMarks({ at, y0 = 0 }: { at: readonly number[]; y0?: number }) {
  const { x, y } = usePlot()
  const base = y(y0)
  return (
    <g data-jumps="" pointerEvents="none">
      {at.map((v, i) => (
        <path key={i} d={`M${n2(x(v))},${n2(base - 7)}l-4.5,7h9z`} fill="var(--text)" stroke="var(--surface)" strokeWidth={1} paintOrder="stroke">
          <title>salto</title>
        </path>
      ))}
    </g>
  )
}

/** I figli si vedono solo a sinistra di `until` (nel dominio): una curva che si disegna con la penna. */
export function Reveal({ until, children }: { until: number; children: ReactNode }) {
  const { x, innerHeight, innerWidth } = usePlot()
  const id = `${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-reveal`
  const w = Math.max(0, Math.min(innerWidth, x(until)))
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={-4} y={-40} width={w + 4} height={innerHeight + 80} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  )
}

/**
 * L'area fra due curve campionate sulle stesse ascisse, tratteggiata a inchiostro: il bias, l'errore, ciò che
 * separa una stima dalla verità. La texture regge anche senza colori (stampa, daltonismo, colori forzati).
 */
export function BetweenArea({ xs, a, b, opacity = 0.55 }: { xs: readonly number[]; a: readonly number[]; b: readonly number[]; opacity?: number }) {
  const { x, y, clipPath } = usePlot()
  const id = `${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-hatch`
  const idx = xs.map((_, i) => i)
  const d =
    area<number>()
      .x((i) => n2(x(xs[i])))
      .y0((i) => n2(y(a[i])))
      .y1((i) => n2(y(b[i])))(idx) ?? ''
  return (
    <g data-between="" clipPath={clipPath} pointerEvents="none">
      <defs>
        <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={6} stroke="var(--text)" strokeWidth={1.25} />
        </pattern>
      </defs>
      <path d={d} fill={`url(#${id})`} opacity={opacity} />
    </g>
  )
}

/** Un campione come segno (il cerchio a inchiostro dei campioni, con l'anello di superficie), fuori da Dots. */
export function SampleMark({ at, cls, size = 64 }: { at: readonly [number, number]; cls?: number; size?: number }) {
  const { x, y } = usePlot()
  return (
    <path
      transform={`translate(${n2(x(at[0]))},${n2(y(at[1]))})`}
      d={classSymbolPath(cls ?? 0, size)}
      fill={cls !== undefined ? classVar(cls) : roleVar('sample')}
      stroke="var(--surface)"
      strokeWidth={3}
      paintOrder="stroke"
      pointerEvents="none"
    />
  )
}
