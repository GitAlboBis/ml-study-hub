// Colori dei grafici: sempre e solo i token --viz-* di src/styles/tokens.css, mai un colore scritto a mano.
//
// Due strade, a seconda di chi disegna:
// - SVG e DOM usano la variabile (`roleVar`, e `classVar` / `fieldVar` di marks.ts): il browser la risolve e al
//   cambio di tema ridipinge da solo, senza passare da React;
// - il canvas non conosce le variabili CSS: gli serve il valore calcolato (`vizColor`, `classColor`, `fieldColor`,
//   `seqColors`, `divColors`, letti con getComputedStyle) e qualcuno che lo faccia ridisegnare quando il tema
//   cambia. Quel qualcuno è `useThemeVersion`: un contatore che sale a ogni cambio di `data-theme` su <html>,
//   da mettere tra le dipendenze dell'effetto che disegna.
//
// In coda al file, la griglia dei valori di un campo scalare e le soglie delle sue bande: servono insieme alla
// rampa a FieldCanvas (tinte) e a Contours (isolinee), che così tagliano il terreno alle stesse quote.
import { color as parseCss } from 'd3'
import { useSyncExternalStore } from 'react'

/**
 * Ruolo di un segno nel grafico, uno per token `--viz-<ruolo>`. `accent` è il segno messo in evidenza: usa l'ocra
 * dello spillo (`--viz-highlight`), che sulla carta chiara va sempre accompagnato da un bordino a inchiostro.
 */
export type VizRole = 'sample' | 'estimate' | 'truth' | 'kernel' | 'boundary' | 'grid' | 'axis' | 'highlight' | 'negative' | 'positive' | 'accent'

const roleToken = (role: VizRole): string => `--viz-${role === 'accent' ? 'highlight' : role}`

/** Il ruolo come variabile CSS, per SVG e DOM: `stroke={roleVar('estimate')}`. */
export const roleVar = (role: VizRole): string => `var(${roleToken(role)})`

/** Valore calcolato di una variabile CSS di <html>; stringa vuota se manca (test senza foglio di stile, SSR). */
export function cssVar(name: string): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Colore calcolato di un ruolo, per il canvas. Si legge a ogni disegno: non va tenuto in uno stato. */
export const vizColor = (role: VizRole): string => cssVar(roleToken(role))

/** Indice di classe (0-5, poi ricomincia come in marks.ts) -> colore calcolato del segno della classe. */
export const classColor = (i: number): string => cssVar(`--viz-class-${(i % 6) + 1}`)

/** Indice di classe -> colore calcolato del campo (regione di decisione) della classe. */
export const fieldColor = (i: number): string => cssVar(`--viz-field-${(i % 6) + 1}`)

const RAMP_STEPS = 7
const ramp = (prefix: string): string[] => Array.from({ length: RAMP_STEPS }, (_, i) => cssVar(`--${prefix}-${i + 1}`))

/** I 7 passi della rampa sequenziale, da "poco" a "tanto" (di notte la rampa è già ribaltata nei token). */
export const seqColors = (): string[] => ramp('viz-seq')

/** I 7 passi della rampa divergente: negativo, grigio neutro al centro, positivo. */
export const divColors = (): string[] => ramp('viz-div')

// --- cambio di tema ---

let themeVersion = 0
const themeListeners = new Set<() => void>()
let themeObserver: MutationObserver | null = null

// Un solo MutationObserver per tutta l'app, acceso dal primo iscritto e spento dall'ultimo.
function subscribeTheme(onChange: () => void): () => void {
  themeListeners.add(onChange)
  if (themeObserver === null && typeof MutationObserver !== 'undefined') {
    themeObserver = new MutationObserver(() => {
      themeVersion++
      for (const listener of [...themeListeners]) listener()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  }
  return () => {
    themeListeners.delete(onChange)
    if (themeListeners.size === 0) {
      themeObserver?.disconnect()
      themeObserver = null
    }
  }
}

/**
 * Contatore che sale a ogni cambio di `data-theme` su <html> e fa ri-renderizzare chi lo usa. Chi disegna su
 * canvas lo mette tra le dipendenze dell'effetto di disegno e rilegge i colori dentro l'effetto.
 */
export function useThemeVersion(): number {
  return useSyncExternalStore(subscribeTheme, () => themeVersion, () => 0)
}

// --- dal colore CSS ai byte del canvas ---

export type Rgba = [r: number, g: number, b: number, a: number]

/** Colore CSS -> byte RGBA. Ciò che non si capisce (anche la stringa vuota) diventa trasparente, mai un colore inventato. */
export function parseColor(css: string): Rgba {
  const c = parseCss(css.trim())?.rgb()
  if (!c || Number.isNaN(c.r)) return [0, 0, 0, 0]
  const byte = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return [byte(c.r), byte(c.g), byte(c.b), byte(c.opacity * 255)]
}

const LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1

/** RGBA impacchettato per scrivere un pixel con una sola assegnazione in un Uint32Array steso su ImageData. */
export function packRgba([r, g, b, a]: Rgba): number {
  return (LITTLE_ENDIAN ? (a << 24) | (b << 16) | (g << 8) | r : (r << 24) | (g << 16) | (b << 8) | a) >>> 0
}

/** Voci della tabella dei colori per ogni passo della rampa. */
const LUT_PER_STEP = 36

/**
 * Tabella dei colori di una rampa, indicizzata da t in [0, 1] (`lut[Math.min(lut.length - 1, Math.floor(t * lut.length))]`).
 * - a bande (predefinito): tinte ipsometriche, un colore pieno per banda, confini netti;
 * - `smooth`: sfumatura lineare in RGB tra un passo e il successivo.
 */
export function rampLut(colors: readonly string[], smooth = false): Uint32Array {
  const stops = colors.map(parseColor)
  const n = stops.length
  const lut = new Uint32Array(Math.max(1, n) * LUT_PER_STEP)
  if (n === 0) return lut
  for (let i = 0; i < lut.length; i++) {
    if (!smooth || n === 1) {
      lut[i] = packRgba(stops[Math.min(n - 1, Math.floor(i / LUT_PER_STEP))])
      continue
    }
    const pos = (i / (lut.length - 1)) * (n - 1)
    const k = Math.min(n - 2, Math.floor(pos))
    const f = pos - k
    const a = stops[k]
    const b = stops[k + 1]
    lut[i] = packRgba([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f].map(Math.round) as Rgba)
  }
  return lut
}

// --- campi scalari ---

export interface FieldGrid {
  /** valori riga per riga; la riga 0 è quella in ALTO (y massima), come i pixel di un'immagine */
  values: Float64Array
  cols: number
  rows: number
  /** minimo e massimo dei valori finiti (0 e 0 se non ce ne sono) */
  min: number
  max: number
}

/** Valuta `fn` al centro di ogni cella di una griglia cols × rows stesa sul rettangolo xDomain × yDomain. */
export function sampleField(fn: (x: number, y: number) => number, xDomain: readonly [number, number], yDomain: readonly [number, number], cols: number, rows: number): FieldGrid {
  const values = new Float64Array(cols * rows)
  const dx = (xDomain[1] - xDomain[0]) / cols
  const dy = (yDomain[1] - yDomain[0]) / rows
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (let j = 0; j < rows; j++) {
    const y = yDomain[1] - (j + 0.5) * dy
    for (let i = 0; i < cols; i++) {
      const v = fn(xDomain[0] + (i + 0.5) * dx, y)
      values[j * cols + i] = v
      if (Number.isFinite(v)) {
        if (v < min) min = v
        if (v > max) max = v
      }
    }
  }
  if (min > max) min = max = 0
  return { values, cols, rows, min, max }
}

/** Ultima griglia calcolata per ogni funzione: FieldCanvas e Contours sullo stesso campo la valutano una volta sola. */
const lastGrid = new WeakMap<(x: number, y: number) => number, { key: string; grid: FieldGrid }>()

/**
 * Come `sampleField`, ma se la stessa funzione è appena stata valutata sulla stessa griglia (stessi domini, colonne e
 * righe) restituisce quella griglia. FieldCanvas (le tinte) e Contours (le isolinee) sullo stesso campo usano la stessa
 * griglia per costruzione, e con una stima di Parzen 2D la valutazione è la parte cara del fotogramma. Vale la stessa
 * regola di useMemo: `fn` stabile finché il campo non cambia. La griglia restituita si legge e basta.
 */
export function sharedField(fn: (x: number, y: number) => number, xDomain: readonly [number, number], yDomain: readonly [number, number], cols: number, rows: number): FieldGrid {
  const key = `${xDomain[0]} ${xDomain[1]} ${yDomain[0]} ${yDomain[1]} ${cols} ${rows}`
  const hit = lastGrid.get(fn)
  if (hit !== undefined && hit.key === key) return hit.grid
  const grid = sampleField(fn, xDomain, yDomain, cols, rows)
  lastGrid.set(fn, { key, grid })
  return grid
}

const imageBuffers = new WeakMap<CanvasRenderingContext2D, ImageData>()

/**
 * ImageData della misura chiesta, riusato da un disegno all'altro sullo stesso contesto: a 1600 × 1000 sono 6,4 MB
 * che altrimenti si allocherebbero a ogni fotogramma. Chi lo usa scrive TUTTI i pixel (0 dove vuole trasparenza).
 */
export function imageBuffer(ctx: CanvasRenderingContext2D, width: number, height: number): ImageData {
  const img = imageBuffers.get(ctx)
  if (img !== undefined && img.width === width && img.height === height) return img
  const fresh = ctx.createImageData(width, height)
  imageBuffers.set(ctx, fresh)
  return fresh
}

/** Celle quadrate: `resolution` colonne, e le righe che servono a coprire l'area con lo stesso passo. */
export function gridSize(resolution: number, width: number, height: number): { cols: number; rows: number } {
  const cols = Math.max(2, Math.round(resolution))
  const rows = width > 0 && height > 0 ? Math.max(2, Math.round((cols * height) / width)) : cols
  return { cols, rows }
}

/** I confini interni di `bands` bande uguali tra lo e hi: le quote a cui FieldCanvas cambia tinta. */
export function bandThresholds(lo: number, hi: number, bands = RAMP_STEPS): number[] {
  return Array.from({ length: Math.max(0, bands - 1) }, (_, i) => lo + ((i + 1) * (hi - lo)) / bands)
}

/** Intervallo dei valori da colorare: quello dato, oppure min-max della griglia (simmetrico attorno a 0 se divergente). */
export function valueRange(grid: FieldGrid, diverging: boolean, given?: readonly [number, number]): [number, number] {
  if (given) return [given[0], given[1]]
  if (!diverging) return [grid.min, grid.max]
  const m = Math.max(Math.abs(grid.min), Math.abs(grid.max))
  return [-m, m]
}
