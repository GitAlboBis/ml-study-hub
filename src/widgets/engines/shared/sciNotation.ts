// Notazione scientifica per SciCounter: mantissa, esponente e numero per esteso, anche per numeri che un double non
// contiene (C(200, 100) ≈ 9.05 · 10^58 va, 10^500 e il prodotto di 1000 verosimiglianze no): per quelli si passa il
// logaritmo in base 10. Logica pura, testata in sciNotation.test.ts.

export interface SciParts {
  kind: 'sci' | 'plain' | 'nan' | 'inf'
  /** '' oppure il segno meno vero (U+2212) */
  sign: '' | '−'
  /** cifre della mantissa con il punto: '1.23' (solo 'sci') */
  mantissa: string
  exponent: number
  /** il numero per esteso con gli spazi fini fra le migliaia (solo 'plain') */
  plain: string
}

const THIN = ' '
const group = (int: string) => int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN)

/**
 * Le parti di un numero dato come `value` o come `log10` (solo positivi). `digits` cifre significative (predefinito 3).
 * `mode`: 'auto' (predefinito) scrive per esteso gli interi sotto il milione e lo zero, il resto in notazione
 * scientifica; 'sci' e 'plain' forzano (in 'plain' i non interi si arrotondano all'intero).
 */
export function sciParts(input: { value?: number; log10?: number }, digits = 3, mode: 'auto' | 'sci' | 'plain' = 'auto'): SciParts {
  const d = Math.max(1, Math.min(15, Math.round(digits)))
  const none = (kind: 'nan' | 'inf', sign: '' | '−' = ''): SciParts => ({ kind, sign, mantissa: '', exponent: 0, plain: '' })

  let sign: '' | '−' = ''
  let lg: number
  const v = input.value
  if (input.log10 !== undefined) {
    if (Number.isNaN(input.log10)) return none('nan')
    if (!Number.isFinite(input.log10)) return input.log10 > 0 ? none('inf') : { kind: 'plain', sign: '', mantissa: '', exponent: 0, plain: '0' }
    lg = input.log10
  } else {
    if (v === undefined || Number.isNaN(v)) return none('nan')
    if (!Number.isFinite(v)) return none('inf', v < 0 ? '−' : '')
    if (v < 0) sign = '−'
    if (mode === 'plain' || (mode === 'auto' && (v === 0 || (Number.isInteger(v) && Math.abs(v) < 1e6)))) {
      return { kind: 'plain', sign, mantissa: '', exponent: 0, plain: group(String(Math.round(Math.abs(v)))) }
    }
    if (v === 0) return { kind: 'sci', sign: '', mantissa: (0).toFixed(d - 1), exponent: 0, plain: '' }
    lg = Math.log10(Math.abs(v))
  }

  let exponent = Math.floor(lg)
  // la mantissa dal valore quando c'è (più precisa), dal logaritmo altrimenti
  let m = v !== undefined && input.log10 === undefined ? Math.abs(v) / 10 ** exponent : 10 ** (lg - exponent)
  // correzioni di bordo: 1e-5 può dare log10 = -5.000000000000001
  if (m >= 10 - 1e-12) {
    m /= 10
    exponent += 1
  } else if (m < 1) {
    m *= 10
    exponent -= 1
  }
  let text = m.toFixed(d - 1)
  // riporto dell'arrotondamento: 9.996 a tre cifre è 10.0, cioè 1.00 con un esponente in più
  if (Number(text) >= 10) {
    exponent += 1
    text = (Number(text) / 10).toFixed(d - 1)
  }
  return { kind: 'sci', sign, mantissa: text, exponent, plain: '' }
}

/** Il numero come si legge a voce, per le regioni aria-live: "1.23 per 10 alla 8", "meno 4.6 per 10 alla meno 4". */
export function spokenSci(p: SciParts): string {
  const s = p.sign === '−' ? 'meno ' : ''
  switch (p.kind) {
    case 'nan':
      return 'non definito'
    case 'inf':
      return `${s}infinito`
    case 'plain':
      return `${s}${p.plain.replaceAll(THIN, '')}`
    case 'sci':
      return `${s}${p.mantissa} per 10 alla ${p.exponent < 0 ? `meno ${-p.exponent}` : p.exponent}`
  }
}
