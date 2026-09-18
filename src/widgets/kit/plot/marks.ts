import { symbol, symbolCircle, symbolCross, symbolDiamond, symbolSquare, symbolStar, symbolTriangle, type ScaleLinear, type SymbolType } from 'd3'

/**
 * Identità di classe mai affidata al solo colore: ogni classe ha anche una forma del marcatore, in ordine fisso.
 * Le classi 1-4 sono distinguibili a coppie anche per chi è daltonico; la 5 e la 6 lo sono solo grazie alla forma.
 */
export const CLASS_SYMBOLS: readonly SymbolType[] = [symbolCircle, symbolSquare, symbolTriangle, symbolDiamond, symbolCross, symbolStar]
export const CLASS_SYMBOL_NAMES = ['cerchio', 'quadrato', 'triangolo', 'rombo', 'croce', 'stella'] as const

/** Indice di classe (0-5) -> variabili CSS dei token. */
export const classVar = (i: number) => `var(--viz-class-${(i % 6) + 1})`
export const fieldVar = (i: number) => `var(--viz-field-${(i % 6) + 1})`

/** Path SVG del marcatore della classe i, centrato nell'origine; `size` è l'area in px² come in d3. */
export const classSymbolPath = (i: number, size = 64): string => symbol(CLASS_SYMBOLS[i % 6], size)() ?? ''

/** Area del marcatore di classe sui segni che non sono punti: quella di un punto dei Dots (raggio 4.5 px). */
export const CLASS_MARK_SIZE = Math.PI * 4.5 * 4.5

/**
 * Attributi del marcatore della classe i per curve, aree, frecce, barre e istogrammi: la stessa forma e lo stesso
 * anello di superficie dei Dots, così la legenda vale per tutti i segni. Si disegna centrato nell'origine
 * (`<g transform="translate(x,y)"><path {...classMarker(i)} /></g>`). Il tratteggio no: nel mondo vuol dire
 * "verità a terra", non una classe.
 */
export const classMarker = (i: number, size = CLASS_MARK_SIZE) =>
  ({
    d: classSymbolPath(i, size),
    fill: classVar(i),
    stroke: 'var(--surface)',
    strokeWidth: 4,
    strokeLinejoin: 'round',
    paintOrder: 'stroke',
  }) as const

/** Nome parlato della classe i: "classe 2 · quadrato". */
export const className = (i: number) => `classe ${i + 1} · ${CLASS_SYMBOL_NAMES[i % 6]}`

/**
 * Il punto visibile più in alto di una curva, in pixel dell'area interna: dove una curva per classe porta il suo
 * marcatore (per una densità è la moda, il punto che la distingue dalle altre). null se nessun punto è visibile.
 * `xRange` limita la ricerca a un intervallo di x (l'area colorata tra a e b).
 */
export function peakPixel(
  data: readonly (readonly number[])[],
  x: ScaleLinear<number, number>,
  y: ScaleLinear<number, number>,
  xRange?: readonly [number, number],
): [number, number] | null {
  const [xa, xb] = xRange ?? x.domain()
  const [ya, yb] = y.domain()
  const [x0, x1] = [Math.min(xa, xb), Math.max(xa, xb)]
  const [y0, y1] = [Math.min(ya, yb), Math.max(ya, yb)]
  let best: [number, number] | null = null
  for (const [dx, dy] of data) {
    if (!(dx >= x0 && dx <= x1 && dy >= y0 && dy <= y1)) continue
    const py = y(dy)
    if (best === null || py < best[1]) best = [x(dx), py]
  }
  return best
}
