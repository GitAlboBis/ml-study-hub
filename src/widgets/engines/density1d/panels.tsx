// Pannelli del motore density1d fuori dal terreno: la legenda viva con la terminologia del docente, la
// tabella degli addendi del punto sonda e il timbro del regime di smoothing.
//
// LEGENDA VIVA (contratto del foglio, .impeccable/surfaces): passare o mettere a fuoco una voce accende il
// suo strato nel terreno e attenua gli altri; un clic la fissa (aria-pressed), un altro la libera. Sono
// pulsanti veri: fuoco, nome accessibile e stato arrivano dal browser. Nessun moto: si passa spesso.
import { M } from '../../../components/content/M'
import { Rich } from '../../../components/content/Rich'
import type { Rich as RichText } from '../../../content/types'
import { fixed, typographic } from '../../kit/format'
import { roleVar } from '../../kit/plot/colors'
import { classVar } from '../../kit/plot/marks'
import type { Contribution, Regime } from './density1d'
import type { Density1dTerm } from './types'

type Target = Density1dTerm['target']

/** Tassello della legenda: lo stesso segno che lo strato ha nel terreno. */
function Swatch({ target }: { target: Target }) {
  const common = { width: 28, height: 16, viewBox: '0 0 28 16', 'aria-hidden': true } as const
  switch (target) {
    case 'samples':
      return (
        <svg {...common}>
          <rect x={0} y={9} width={28} height={7} fill="var(--surface-2)" />
          <circle cx={9} cy={12.5} r={3.5} fill={roleVar('sample')} />
          <circle cx={19} cy={12.5} r={3.5} fill={roleVar('sample')} />
        </svg>
      )
    case 'kernels':
      return (
        <svg {...common}>
          <path d="M1 15 C8 15 10 3 14 3 S20 15 27 15 Z" fill={roleVar('kernel')} fillOpacity={0.15} stroke={roleVar('kernel')} strokeWidth={1.25} />
        </svg>
      )
    case 'h':
      return (
        <svg {...common}>
          <path d="M3 8h22" stroke={roleVar('boundary')} strokeWidth={1.5} />
          <path d="M1 8l5-3.5v7zM27 8l-5-3.5v7z" fill={roleVar('boundary')} />
        </svg>
      )
    case 'estimate':
      return (
        <svg {...common}>
          <path d="M1 13 C7 13 9 4 14 4 S21 13 27 13" fill="none" stroke={roleVar('estimate')} strokeWidth={3} strokeLinecap="round" />
        </svg>
      )
    case 'truth':
      return (
        <svg {...common}>
          <path d="M1 13 C7 13 9 4 14 4 S21 13 27 13" fill="none" stroke={roleVar('truth')} strokeWidth={2} strokeDasharray="6 4" />
        </svg>
      )
    case 'histogram':
      return (
        <svg {...common}>
          <rect x={2} y={8} width={7} height={8} fill={classVar(2)} fillOpacity={0.5} />
          <rect x={10.5} y={3} width={7} height={13} fill={classVar(2)} fillOpacity={0.5} />
          <rect x={19} y={10} width={7} height={6} fill={classVar(2)} fillOpacity={0.5} />
        </svg>
      )
    case 'knn':
      return (
        <svg {...common}>
          <path d="M1 12 L9 10 L14 4 L19 10 L27 12" fill="none" stroke={classVar(1)} strokeWidth={2} />
        </svg>
      )
  }
}

export interface TermLegendProps {
  terms: readonly Density1dTerm[]
  pinned: Target | null
  onPreview: (target: Target | null) => void
  onPin: (target: Target) => void
  notes?: readonly RichText[]
}

export function TermLegend({ terms, pinned, onPreview, onPin, notes }: TermLegendProps) {
  return (
    <div className="grid gap-2">
      <h5 className="label m-0">Legenda · termini</h5>
      <ul className="m-0 grid list-none gap-px border border-border bg-border p-0">
        {terms.map((t) => (
          <li key={t.target} className="bg-surface">
            <button
              type="button"
              aria-pressed={pinned === t.target}
              onPointerEnter={() => onPreview(t.target)}
              onPointerLeave={() => onPreview(null)}
              onFocus={() => onPreview(t.target)}
              onBlur={() => onPreview(null)}
              onClick={() => onPin(t.target)}
              className="grid min-h-10 w-full cursor-pointer grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 border-0 bg-transparent px-3 py-2 text-left text-text hover:bg-surface-2 aria-pressed:bg-surface-2"
            >
              <span className="mt-1 grid gap-1">
                <Swatch target={t.target} />
                {pinned === t.target ? <span aria-hidden="true" className="block h-1 w-full bg-pin" /> : null}
              </span>
              <span className="grid gap-0.5">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span aria-hidden="true">
                    <M tex={t.symbol} />
                  </span>
                  <em className="text-[length:var(--step--1)] text-muted" lang="en">
                    {t.en}
                  </em>
                </span>
                <Rich text={t.it} inline className="text-[length:var(--step--1)]" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {notes?.map((n, i) => (
        <p key={i} className="m-0 flex gap-2 text-[length:var(--step--1)] text-muted">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" aria-hidden="true" className="mt-0.5 shrink-0 text-info">
            <path d="M12 10v8M12 6v.5" />
          </svg>
          <Rich text={n} inline />
        </p>
      ))}
    </div>
  )
}

export interface AddendsTableProps {
  terms: readonly Contribution[]
  /** quanti addendi mostrare; gli altri finiscono in una riga di somma */
  limit: number
  x: number
  p: number
  name: string
}

const f3 = fixed(3)
const f4 = fixed(4)
const t = (s: string) => typographic(s)

/** Gli addendi (1/(Nh)) γ((x − x_k)/h) del punto sonda, dal più grande; in fondo la loro somma, p̂(x). */
export function AddendsTable({ terms, limit, x, p, name }: AddendsTableProps) {
  const shown = terms.slice(0, limit)
  const rest = terms.slice(limit)
  const restSum = rest.reduce((s, c) => s + c.term, 0)
  return (
    // scorre da sola su schermi stretti: il fuoco serve a scorrerla da tastiera
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`Addendi di p̂(${f3(x)}), dal più grande`}>
      <table className="num w-full border-collapse text-right text-[length:var(--step--1)]">
        <caption className="label pb-1 text-left">
          Addendi in <span className="num tracking-normal normal-case">x = {t(fixed(2)(x))}</span>, dal più grande
        </caption>
        <thead>
          <tr className="border-b border-border-strong text-muted">
            <th scope="col" className="py-1 pr-2 text-left font-normal">
              {name}
            </th>
            <th scope="col" className="px-2 py-1 font-normal">
              <M tex="x_k" />
            </th>
            <th scope="col" className="px-2 py-1 font-normal">
              <M tex="u=\tfrac{x-x_k}{h}" />
            </th>
            <th scope="col" className="px-2 py-1 font-normal">
              <M tex="\gamma(u)" />
            </th>
            <th scope="col" className="py-1 pl-2 font-normal">
              <M tex="\tfrac{\gamma(u)}{Nh}" />
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((c, i) => (
            <tr key={c.index} className="border-b border-border">
              <td className="py-0.5 pr-2 text-left text-muted">{i + 1}</td>
              <td className="px-2 py-0.5">{t(fixed(2)(c.x))}</td>
              <td className="px-2 py-0.5">{t(fixed(2)(c.u))}</td>
              <td className="px-2 py-0.5">{t(f3(c.gamma))}</td>
              <td className="py-0.5 pl-2">{t(f4(c.term))}</td>
            </tr>
          ))}
          {rest.length > 0 ? (
            <tr className="border-b border-border text-muted">
              <td colSpan={4} className="py-0.5 pr-2 text-left">
                altri {rest.length}
              </td>
              <td className="py-0.5 pl-2">{t(f4(restSum))}</td>
            </tr>
          ) : null}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={4} className="py-1 pr-2 text-left font-semibold">
              somma = <M tex="\hat p(x)" />
            </th>
            <td className="py-1 pl-2 font-semibold">{t(f4(p))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

const REGIME_TEXT: Record<Exclude<Regime, 'balanced'>, { it: string; en: string }> = {
  sensitive: { it: 'Stima sensibile: rischio overfitting', en: 'h small · undersmoothing' },
  smooth: { it: 'Stima liscia: rischio underfitting', en: 'h large · oversmoothing' },
}

/**
 * Timbro del regime sul terreno: spillo ocra (è un'evidenza, non uno stato d'errore) con icona e parole.
 * Si sovrappone al grafico, quindi ha l'ombra. Nessun moto d'entrata: compare mentre si trascina h.
 */
export function RegimeStamp({ regime }: { regime: Regime }) {
  if (regime === 'balanced') return null
  const text = REGIME_TEXT[regime]
  return (
    <p className="pointer-events-none absolute top-2 right-2 m-0 flex max-w-[70%] items-center gap-2 border border-border-strong bg-pin px-2 py-1 text-pin-contrast shadow-1">
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        {regime === 'sensitive' ? <path d="M2 20h3l2-14 2 14 2-10 2 10 2-16 2 16 2-8 2 8h1" /> : <path d="M2 20c5 0 6-9 10-9s5 9 10 9" />}
      </svg>
      <span className="grid leading-tight">
        <span className="label text-pin-contrast">{text.it}</span>
        <em className="text-[length:var(--step--1)]" lang="en">
          {text.en}
        </em>
      </span>
    </p>
  )
}
