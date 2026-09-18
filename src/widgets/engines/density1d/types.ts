// Contratto del motore density1d: che cosa un "preset" deve dire perché il motore diventi un widget.
//
// Il motore è l'esperimento della stima di densità in una dimensione (Melgani, Cap. 2: Parzen e K-NN):
// campioni su un asse, stima di Parzen con kernel e h scelti, stima K-NN, istogramma, densità vera,
// errore integrato, cursore-quota. Molti widget del foglio m09 (e di m08) sono varianti dello stesso
// esperimento: cambiano lo scenario, gli strati accesi, i parametri iniziali, lo storyboard, le formule
// vive e la sfida. Tutto questo sta nel preset; il motore non contiene nessun testo di un widget.
//
// Qui solo tipi: la logica pura è in density1d.ts, il componente in DensityExplorer.tsx.
import type { Rich } from '../../../content/types'
import type { Kernel } from '../../../lib/ml/nonparam'

/** Lo scenario del cast in una dimensione: i campioni, la verità (se nota), l'asse. */
export interface Density1dScenario {
  /** Campioni iniziali, nell'ordine in cui cadono sull'asse nello storyboard. */
  samples: readonly number[]
  /** Densità vera da cui escono i dati sintetici: la si disegna tratteggiata e serve all'errore integrato. */
  truth?: (x: number) => number
  /** La densità vera in LaTeX, per didascalie e legenda: 0.7\,\mathcal N(4, 0.8^2) + … */
  truthTex?: string
  /** Estremi dell'asse; i campioni aggiunti a mano restano qui dentro. */
  domain: readonly [number, number]
  /** Grandezza sull'asse, in italiano e in inglese; `unit` va accanto al nome ("scala 0-10", "°C"). */
  axis: { it: string; en: string; unit?: string }
  /** Nome di un campione, al singolare e al plurale: "salmone", "salmoni". */
  sampleName: { one: string; many: string }
  /** Decimali con cui si leggono (e si arrotondano, se aggiunti con un clic) i campioni. Predefinito 1. */
  decimals?: number
}

/** Strati del terreno. Un preset li elenca in `layers`: gli altri non esistono né nel terreno né nei comandi. */
export type Density1dLayer = 'kernels' | 'estimate' | 'truth' | 'histogram' | 'knn'

/**
 * Che cosa fa il terreno durante un passo dello storyboard. Ogni fase descrive uno stato completo
 * (non un incremento): con prefers-reduced-motion il passo mostra subito il suo stato finale, che quindi
 * da solo deve già raccontare il passo.
 * - overview, explore: il quadro completo con i valori scelti dall'utente
 * - drop: i campioni cadono sull'asse uno alla volta
 * - grow: su ogni campione cresce il kernel intero δ(x − x_k), area 1
 * - normalize: ogni kernel scende a δ(x − x_k)/N, area 1/N
 * - stack: i kernel si impilano; la cima della pila è p̂(x)
 * - truth: la pila torna giù e compare la densità vera con l'errore integrato
 * - bandwidth: h passa (in scala logaritmica) al valore `h`; 'user' torna a quello dello slider.
 *   `truth: true` tiene accesa la densità vera durante il passo.
 */
export type Density1dPhase =
  | { kind: 'overview' }
  | { kind: 'explore' }
  | { kind: 'drop' }
  | { kind: 'grow' }
  | { kind: 'normalize' }
  | { kind: 'stack' }
  | { kind: 'truth' }
  | { kind: 'bandwidth'; h: number | 'user'; truth?: boolean }

/** Ciò che le didascalie di un passo possono citare. */
export interface Density1dCaptionContext {
  /** numero dei campioni */
  n: number
  /** h dello slider */
  h: number
  kernel: Kernel
  /** testo già formattato di 1/N, con tre decimali */
  invN: string
}

export interface Density1dStep {
  id: string
  /** titolo breve del passo: finisce nel trasporto e nella didascalia */
  label: string
  phase: Density1dPhase
  /** durata a velocità 1, oppure funzione del numero di campioni (la caduta: 300 ms a campione) */
  durationMs: number | ((n: number) => number)
  /** spiegazione del passo: Markdown con matematica fra $…$ */
  caption: Rich | ((ctx: Density1dCaptionContext) => Rich)
}

/**
 * Una formula viva: LaTeX con i segnaposto \val{nome} di LiveFormula. I nomi disponibili sono quelli di
 * `Density1dValues` (density1d.ts, funzione `formulaValues`); `tex` può dipendere dal numero di campioni
 * (per esempio per scrivere solo gli addendi che esistono).
 */
export interface Density1dFormula {
  id: string
  /** etichetta di cornice sopra la formula ("Nel punto sonda") */
  label?: string
  tex: string | ((ctx: { n: number; kernel: Kernel }) => string)
}

/**
 * La sfida.
 * - 'min-ise': trovare l'h che minimizza l'errore quadratico integrato ISE per il kernel scelto.
 *   Verifica: rapporto ISE(h scelto) / ISE(h*) ≤ `tolerance`, con h* cercato dal motore. Dopo la verifica la
 *   densità vera si accende e sul terreno compare la stima con h*. Serve una verità nello scenario.
 * - 'custom': il preset decide con `check`, che riceve lo stato corrente.
 */
export type Density1dChallenge =
  | { kind: 'min-ise'; prompt: Rich; hint?: Rich; tolerance: number }
  | { kind: 'custom'; prompt: Rich; hint?: Rich; check: (state: Density1dCheckState) => boolean }

export interface Density1dCheckState {
  samples: readonly number[]
  h: number
  kernel: Kernel
  k: number
  bins: number
  probe: number
}

/** Una voce della legenda viva: il termine del docente in italiano e in inglese, legato a uno strato. */
export interface Density1dTerm {
  /** che cosa accende nel terreno quando la voce è sotto il puntatore o a fuoco */
  target: 'samples' | 'kernels' | 'h' | 'estimate' | 'truth' | 'histogram' | 'knn'
  /** simbolo in LaTeX: '\\gamma(\\cdot)' */
  symbol: string
  /** definizione in italiano (Markdown con $…$) */
  it: Rich
  /** il termine inglese delle slide */
  en: string
}

export interface Density1dPreset {
  scenario: Density1dScenario
  /** Strati offerti dal widget. */
  layers: readonly Density1dLayer[]
  /** Strati accesi all'apertura (e dopo Reset). 'estimate' è sempre acceso se c'è. */
  initialLayers: readonly Density1dLayer[]
  /** Kernel del selettore, nell'ordine mostrato. Con uno solo il selettore non compare. */
  kernels: readonly Kernel[]
  initial: {
    h: number
    kernel: Kernel
    /** K della stima K-NN; predefinito √N arrotondato */
    k?: number
    /** bin dell'istogramma; predefinito 10 */
    bins?: number
    /** ascissa del punto sonda; predefinito il centro del dominio */
    probe?: number
  }
  /** Scala dello slider h, a passi "tondi" in scala logaritmica fra min e max (vedi niceLogSteps). */
  h: { min: number; max: number }
  /** Estremi dello slider K (il massimo non supera mai N). Serve solo con lo strato 'knn'. */
  k?: { min: number; max: number }
  /** Estremi dello slider dei bin. Serve solo con lo strato 'histogram'. */
  bins?: { min: number; max: number }
  /** Campioni modificabili con clic e tastiera, e loro numero minimo e massimo. */
  samples: { editable: boolean; min: number; max: number }
  /** Quota massima dell'asse verticale. È fissa di proposito: le altezze si confrontano fra h diversi. */
  yMax: number
  /** Sotto `sensitiveBelow` la stima è "sensibile" (overfitting), sopra `smoothAbove` "liscia" (underfitting). */
  regimes?: { sensitiveBelow: number; smoothAbove: number }
  storyboard: readonly Density1dStep[]
  formulas: readonly Density1dFormula[]
  /** Tabella degli addendi del punto sonda, ordinati per contributo. */
  addends?: boolean
  challenge?: Density1dChallenge
  terms?: readonly Density1dTerm[]
  /** Avvertenze sotto la legenda (Markdown), per esempio "non è il kernel delle SVM". */
  notes?: readonly Rich[]
  /** Nome accessibile e descrizione del grafico. */
  ariaLabel: string
  description?: string
  /** Rapporto larghezza/altezza del terreno. Predefinito 1.5. */
  aspect?: number
}
