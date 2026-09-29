// Matrice con i numeri: Σ costruita punto per punto, S_W, S_B, la matrice di Fisher, W, la tabella dei J. Fuori dal
// Plot: è testo, non un grafico, e resta leggibile e navigabile come una tabella.
//
// - Numeri a decimali fissi o frazioni esatte (matrixCells.ts): la lavagna a 4 punti ha 17/48, non 0.354. Una
//   frazione si impila (numeratore sopra, denominatore sotto); chi ascolta sente "meno 3 su 4".
// - Colormap divergente con i token (--viz-div-1…7, il grigio neutro allo zero) o sequenziale (--viz-seq-*): una
//   velatura dietro la cifra, che resta a inchiostro e leggibile nei due temi (contrasto ≥ 4.5:1 calcolato sulle
//   rampe). Il segno sta nella cifra: il colore non è mai l'unica informazione.
// - Hover e fuoco di una cella accendono anche la sua simmetrica (σ₁₂ e σ₂₁ sono lo stesso numero): bordo ocra
//   dello spillo sulla simmetrica, fuoco del sistema sulla cella. `onCellFocus` lo dice a chi disegna il terreno
//   (per accendere la coppia di feature della cella).
// - Tastiera: la griglia è un solo arresto del Tab; frecce di cella in cella, Inizio e Fine della riga, Ctrl+Inizio
//   e Ctrl+Fine della matrice (ruoli ARIA grid, row, gridcell, rowheader, columnheader).
// - Celle che volano e si sommano (`ghost`): una matrice fantasma (il prodotto esterno di un punto, (x − m)(x − m)ᵗ/N)
//   parte da `from` (px rispetto alla matrice) e si posa sulla matrice, cella su cella; a fine volo le celle che la
//   ricevono hanno il bordo ocra e il segno "+". Il tempo `t` lo dà chi la usa (storyboard); si muove solo
//   transform. Chi la usa aggiorna `values` con la somma quando il fantasma arriva.
// - Per n grandi (heatmap 120 × 120 di spectrum-nd) non è il pezzo giusto: lì serve FieldCanvas. Qui fino a 8 × 8.
import { useId, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { M } from '../../../components/content/M'
import { cellNumber, cellText, divStep, gridMove, seqStep, type CellText, type MatrixCell } from './matrixCells'

export interface MatrixGhost {
  values: readonly (readonly MatrixCell[])[]
  /** avanzamento del volo, da 0 a 1 */
  t: number
  /** partenza, in px rispetto all'angolo della matrice di destinazione (dove sta il punto che la genera) */
  from: readonly [number, number]
}

export interface MatrixGridProps {
  /** righe di celle: numeri, frazioni { n, d } o null (cella da calcolare, "?") */
  values: readonly (readonly MatrixCell[])[]
  /** nome della matrice: "Matrice di covarianza Σ" */
  label: string
  /** simbolo della matrice in LaTeX, davanti alla parentesi: '\\Sigma =' */
  symbol?: string
  /** intestazioni in LaTeX (x_1, x_2…) e i loro nomi parlati */
  rowLabels?: readonly string[]
  colLabels?: readonly string[]
  rowSpoken?: readonly string[]
  colSpoken?: readonly string[]
  /** nome parlato di una cella: "σ uno due"; predefinito "riga i, colonna j" */
  cellName?: (i: number, j: number) => string
  /** 'decimal' (predefinito), 'fraction' (frazione se esatta), 'auto' (frazione se piccola) */
  mode?: 'decimal' | 'fraction' | 'auto'
  decimals?: number
  maxDen?: number
  /** velatura dietro le cifre; predefinita 'diverging' */
  colormap?: 'diverging' | 'sequential' | 'none'
  /** |v| del colore più forte (divergente) o [min, max] (sequenziale); predefinito dai valori */
  range?: number | readonly [number, number]
  /** hover di una cella accende la simmetrica (matrici simmetriche) */
  symmetric?: boolean
  /** celle in evidenza (spillo): la cella che il passo del racconto sta calcolando */
  highlight?: readonly (readonly [number, number])[]
  onCellFocus?: (cell: readonly [number, number] | null) => void
  ghost?: MatrixGhost | null
  /** larghezza minima di una cella in rem; predefinito 3.75 */
  cellRem?: number
}

const ALPHA = { diverging: 0.45, sequential: 0.35 } as const

function Fraction({ c }: { c: CellText }) {
  if (c.frac === undefined) return <>{c.text}</>
  const neg = c.frac.n < 0
  return (
    <span className="inline-flex items-center gap-0.5">
      {neg ? <span>−</span> : null}
      <span className="inline-grid justify-items-center leading-none">
        <span>{Math.abs(c.frac.n)}</span>
        <span aria-hidden="true" className="my-0.5 h-px w-full bg-current" />
        <span>{c.frac.d}</span>
      </span>
    </span>
  )
}

const ease = (t: number) => {
  const u = Math.min(Math.max(t, 0), 1)
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2
}

export function MatrixGrid({
  values,
  label,
  symbol,
  rowLabels,
  colLabels,
  rowSpoken,
  colSpoken,
  cellName,
  mode = 'decimal',
  decimals = 2,
  maxDen,
  colormap = 'diverging',
  range,
  symmetric = false,
  highlight,
  onCellFocus,
  ghost,
  cellRem = 3.75,
}: MatrixGridProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const rows = values.length
  const cols = values[0]?.length ?? 0
  const [active, setActive] = useState<readonly [number, number]>([0, 0])
  const [pointed, setPointed] = useState<readonly [number, number] | null>(null)
  const [focused, setFocused] = useState(false)
  const ai = Math.min(active[0], Math.max(0, rows - 1))
  const aj = Math.min(active[1], Math.max(0, cols - 1))

  // cella indicata: quella sotto il puntatore, altrimenti quella con il fuoco
  const lit = pointed ?? (focused ? ([ai, aj] as const) : null)
  const partner = lit !== null && symmetric && lit[0] !== lit[1] ? ([lit[1], lit[0]] as const) : null

  const nums = values.flatMap((r) => r.map(cellNumber)).filter(Number.isFinite)
  const absMax = nums.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
  const seqRange: readonly [number, number] = Array.isArray(range) ? (range as readonly [number, number]) : [Math.min(0, ...nums), Math.max(0, ...nums)]
  const divRange = typeof range === 'number' ? range : absMax

  const speakCell = (i: number, j: number) => cellName?.(i, j) ?? `riga ${rowSpoken?.[i] ?? i + 1}, colonna ${colSpoken?.[j] ?? j + 1}`
  const point = (cell: readonly [number, number] | null) => {
    setPointed(cell)
    onCellFocus?.(cell ?? (focused ? [ai, aj] : null))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = gridMove([ai, aj], e.key, e.ctrlKey || e.metaKey, rows, cols)
    if (next === null) return
    e.preventDefault()
    setActive(next)
    onCellFocus?.(next)
    document.getElementById(`${uid}-c${next[0]}-${next[1]}`)?.focus()
  }

  const g = ghost !== null && ghost !== undefined && ghost.t > 0 && ghost.t < 1 ? ghost : null
  const e = g !== null ? ease(g.t) : 1
  const landing = g !== null && g.t >= 0.85
  const is = (cell: readonly [number, number] | null, i: number, j: number) => cell !== null && cell[0] === i && cell[1] === j
  const hasRowHead = rowLabels !== undefined
  const template = `${hasRowHead ? 'auto ' : ''}repeat(${cols}, minmax(${cellRem}rem, auto))`

  return (
    // una matrice larga scorre di lato a 390 px; durante un volo no, se no il fantasma che arriva da fuori sarebbe ritagliato
    <div className={`flex max-w-full items-center gap-2 ${g !== null ? 'overflow-visible' : 'overflow-x-auto'}`} data-matrix-grid="">
      {symbol !== undefined ? (
        <span aria-hidden="true" className="shrink-0 text-text">
          <M tex={symbol} />
        </span>
      ) : null}
      <div
        role="grid"
        aria-label={label}
        aria-rowcount={rows + (colLabels !== undefined ? 1 : 0)}
        aria-colcount={cols + (rowLabels !== undefined ? 1 : 0)}
        className="relative grid shrink-0 gap-px border-x-2 border-border-strong px-1 py-0.5"
        style={{ gridTemplateColumns: template }}
        onKeyDown={onKeyDown}
        onPointerLeave={() => point(null)}
      >
        {colLabels !== undefined ? (
          <div role="row" className="contents">
            {hasRowHead ? <span aria-hidden="true" /> : null}
            {colLabels.map((c, j) => (
              <span key={`h${j}`} role="columnheader" aria-label={colSpoken?.[j] ?? c} className="grid place-items-center px-1 pb-0.5 text-[length:var(--step--1)] text-muted">
                <span aria-hidden="true">
                  <M tex={c} />
                </span>
              </span>
            ))}
          </div>
        ) : null}
        {values.map((row, i) => (
          <div key={`r${i}`} role="row" className="contents">
            {hasRowHead ? (
              <span role="rowheader" aria-label={rowSpoken?.[i] ?? rowLabels?.[i]} className="grid place-items-center px-1 text-[length:var(--step--1)] text-muted">
                <span aria-hidden="true">
                  <M tex={rowLabels?.[i] ?? ''} />
                </span>
              </span>
            ) : null}
            {row.map((v, j) => {
              const c = cellText(v, { mode, decimals, maxDen })
              const num = cellNumber(v)
              const step = colormap === 'diverging' ? divStep(num, divRange) : colormap === 'sequential' ? seqStep(num, seqRange[0], seqRange[1]) : null
              const pinned = (highlight?.some((h) => h[0] === i && h[1] === j) ?? false) || is(partner, i, j) || (is(pointed, i, j) && !focused) || (landing && g?.values[i]?.[j] !== undefined && g.values[i][j] !== null)
              const gv = g?.values[i]?.[j]
              const gc = gv !== undefined && gv !== null ? cellText(gv, { mode, decimals, maxDen }) : null
              return (
                <div
                  key={`c${i}-${j}`}
                  id={`${uid}-c${i}-${j}`}
                  role="gridcell"
                  tabIndex={i === ai && j === aj ? 0 : -1}
                  aria-label={`${speakCell(i, j)}: ${c.spoken}${is(partner, i, j) ? ', simmetrica' : ''}`}
                  data-cell={`${i}-${j}`}
                  data-lit={pinned || undefined}
                  className="num relative grid min-h-10 place-items-center px-2 py-1 text-text"
                  // lo spillo è un bordo interno: il contorno del fuoco (outline) resta al sistema
                  style={pinned ? { boxShadow: 'inset 0 0 0 2px var(--pin), inset 0 0 0 3px var(--pin-contrast)' } : undefined}
                  onFocus={() => {
                    setFocused(true)
                    setActive([i, j])
                    onCellFocus?.([i, j])
                  }}
                  onBlur={() => {
                    setFocused(false)
                    if (pointed === null) onCellFocus?.(null)
                  }}
                  onPointerEnter={() => point([i, j])}
                >
                  {step !== null && colormap !== 'none' ? (
                    <span aria-hidden="true" className="absolute inset-0" style={{ background: `var(--viz-${colormap === 'diverging' ? 'div' : 'seq'}-${step})`, opacity: ALPHA[colormap] }} />
                  ) : null}
                  <span aria-hidden="true" className="relative">
                    <Fraction c={c} />
                  </span>
                  {gc !== null ? (
                    // il fantasma: la stessa cella della matrice che arriva, in volo verso questa
                    <span
                      aria-hidden="true"
                      data-ghost=""
                      className="pointer-events-none absolute inset-0 z-10 grid place-items-center border border-border-strong bg-surface-2 text-[length:var(--step--1)]"
                      style={{ transform: `translate(${(g!.from[0] * (1 - e)).toFixed(1)}px, ${(g!.from[1] * (1 - e)).toFixed(1)}px)`, opacity: g!.t > 0.9 ? (1 - g!.t) / 0.1 : 1 }}
                    >
                      <span>
                        {/* il segno del contributo: "+" davanti a un positivo, il "−" della cifra davanti a un negativo */}
                        {cellNumber(gv ?? null) >= 0 ? '+' : ''}
                        <Fraction c={gc} />
                      </span>
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
