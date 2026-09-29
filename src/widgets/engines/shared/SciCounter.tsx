// Il contatore a rulli in notazione scientifica: le combinazioni C(n, m) che esplodono, le valutazioni dell'esaustiva,
// i punti della griglia Δ^(−n), il prodotto delle verosimiglianze che va in underflow. Ogni cifra è un rullo che
// scorre alla cifra nuova, come in un contachilometri: lo si vede girare mentre n cresce.
//
//   1.23 × 10^58      mantissa e esponente a rulli; per esteso (con gli spazi fini) gli interi sotto il milione
//
// Numeri oltre il double (10^500, 10^-400): si passa `log10` invece di `value`.
//
// ACCESSIBILITÀ. Come Readout: ciò che si vede è nascosto ai lettori di schermo; per chi ascolta c'è il numero a
// parole ("1.23 per 10 alla 58"), in una regione aria-live che cambia solo quando il valore si ferma.
//
// MOTO. Un rullo scorre alla cifra nuova in 200 ms (transform, ease-out): una risposta breve del sistema, che si
// riprende da dov'è se il valore cambia ancora (transizione CSS, interrompibile). Con reduced motion la cifra
// cambia subito (base.css azzera le transizioni).
import { M } from '../../../components/content/M'
import { useSettled } from '../../kit/useSettled'
import { sciParts, spokenSci } from './sciNotation'

export interface SciCounterProps {
  label: string
  latex?: string
  /** il numero; oppure `log10` per quelli che un double non contiene */
  value?: number
  log10?: number
  /** cifre significative della mantissa; predefinito 3 */
  digits?: number
  /** 'auto' (predefinito) per esteso gli interi sotto il milione; 'sci' sempre la notazione scientifica */
  mode?: 'auto' | 'sci' | 'plain'
  unit?: string
  pinned?: boolean
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Un rullo: le dieci cifre in colonna, spostate con transform fino a quella giusta. */
function Reel({ digit }: { digit: number }) {
  return (
    <span data-reel={digit} className="relative inline-block h-[1em] overflow-hidden align-[-0.12em] leading-none">
      <span className="block transition-transform duration-200 ease-out" style={{ transform: `translateY(${-digit}em)` }}>
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1em] leading-none">
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}

/** Una stringa di cifre e segni: le cifre diventano rulli (chiave dalla destra: le unità restano le unità). */
function Reels({ text }: { text: string }) {
  const chars = [...text]
  return (
    <>
      {chars.map((c, i) => {
        const key = `${chars.length - i}`
        return /\d/.test(c) ? <Reel key={key} digit={Number(c)} /> : <span key={key}>{c}</span>
      })}
    </>
  )
}

export function SciCounter({ label, latex, value, log10, digits = 3, mode = 'auto', unit, pinned = false }: SciCounterProps) {
  const parts = sciParts({ value, log10 }, digits, mode)
  const spoken = useSettled(`${spokenSci(parts)}${unit !== undefined ? ` ${unit}` : ''}`)
  return (
    <div className="grid min-w-0 gap-0.5">
      <span className="flex items-baseline gap-2">
        {pinned ? <span data-pin="" aria-hidden="true" className="size-3 shrink-0 self-center border border-border-strong bg-pin" /> : null}
        {latex !== undefined ? (
          <span aria-hidden="true" className="text-text">
            <M tex={latex} />
          </span>
        ) : null}
        <span className="label">{label}</span>
      </span>
      <output aria-live="polite" aria-atomic="true" className="relative block">
        <span aria-hidden="true" data-sci={parts.kind} className="num inline-flex items-baseline whitespace-nowrap text-[length:var(--step-1)] leading-tight text-text">
          {parts.kind === 'nan' ? '—' : null}
          {parts.kind === 'inf' ? `${parts.sign}∞` : null}
          {parts.kind === 'plain' ? (
            <>
              {parts.sign}
              <Reels text={parts.plain} />
            </>
          ) : null}
          {parts.kind === 'sci' ? (
            <>
              {parts.sign}
              <Reels text={parts.mantissa} />
              <span className="px-[0.25em] text-muted">×</span>
              10
              <sup className="ml-[0.05em] text-[0.62em] leading-none">
                {parts.exponent < 0 ? '−' : ''}
                <Reels text={String(Math.abs(parts.exponent))} />
              </sup>
            </>
          ) : null}
          {unit !== undefined ? <span className="ml-1 text-[length:var(--step--1)] text-muted">{unit}</span> : null}
        </span>
        <span className="visually-hidden">
          {label}
          {pinned ? ' (in evidenza)' : ''}: {spoken}
        </span>
      </output>
    </div>
  )
}
