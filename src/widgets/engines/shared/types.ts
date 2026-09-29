// Tipi comuni a tutti i motori dei widget (docs/plan/engines.md, "Parte comune a tutti i motori").
//
// Venti motori (classifier2d, theta-lab, estimator-lab, …) descrivono i loro widget con un preset. I preset
// hanno una parte che è uguale per tutti (strati, parametri, storyboard, formule vive, sfida, legenda, schede,
// spie) e una propria del motore (i dati, le viste, le fasi). Qui c'è la prima: ogni motore scrive
//
//   export interface Twoclass1dPreset extends BasePreset<TcLayer, TcPhase, TcCtx, TcState> { … }
//
// e riceve gratis il contratto dei test (presetContract.ts), le schede (TabStrip), le spie (InsightLamps), le
// sfide comuni (ChallengeRunner) e gli slider dei parametri (ParamSlider).
//
// I quattro parametri di tipo, sempre in quest'ordine:
// - Layer: gli strati del terreno del motore ('densities' | 'errorAreas' | …): un preset li offre in `layers`;
// - Phase: le fasi dello storyboard, un'unione discriminata propria del motore ({ kind: 'scan' } | …);
// - Ctx: ciò che didascalie, durate e formule possono citare (N, h, il kernel…): il motore lo costruisce;
// - State: lo stato che sfide, spie e descrizione leggono (i valori dell'utente e i numeri calcolati).
//
// Solo tipi: nessun testo di un widget, nessuna logica. Gli aiuti puri su questi tipi sono in presetTools.ts.
import type { Rich } from '../../../content/types'

/**
 * Un parametro regolabile con uno slider (ParamSlider): lineare, logaritmico a valori tondi (come h in density1d)
 * o intero. Lo slider scorre sempre su un elenco finito di valori (paramValues in params.ts), così la formula
 * viva mostra esattamente il numero usato nel calcolo.
 */
export interface ParamSpec {
  id: string
  /** Etichetta in italiano, con il simbolo fra $…$: "Numero di campioni $N$". */
  label: Rich
  /** Termine inglese della slide, mostrato in corsivo con lang="en". */
  en?: string
  min: number
  max: number
  initial: number
  /** Passo della scala lineare (predefinito: un centesimo dell'intervallo, arrotondato) o di quella intera (predefinito 1). */
  step?: number
  /** 'linear' (predefinito), 'log' (valori tondi in scala logaritmica, serve min > 0) o 'int' (interi). */
  scale?: 'linear' | 'log' | 'int'
  /** Unità di misura dello scenario: 'cm', '°C', 'bpm'. */
  unit?: string
  /** Valori a cui lo slider si aggancia (i valori della slide): entrano sempre nell'elenco dei valori. */
  snaps?: readonly number[]
}

/**
 * Un passo dello storyboard: la fase è propria del motore, il resto è uguale per tutti. `durationMs` e `caption`
 * possono dipendere dal contesto (la caduta dei campioni dura N · 300 ms; la didascalia cita N e h).
 * Ogni passo descrive uno stato completo: con prefers-reduced-motion il kit mostra subito lo stato finale.
 */
export interface EngineStep<Phase, Ctx> {
  id: string
  /** Titolo breve del passo: finisce nella scala del trasporto e nella didascalia. */
  label: string
  phase: Phase
  /** Durata a velocità 1, in ms. Zero: il passo è già compiuto (in riproduzione si salta). */
  durationMs: number | ((ctx: Ctx) => number)
  /** Spiegazione del passo: Markdown con matematica fra $…$, inglese in corsivo. */
  caption: Rich | ((ctx: Ctx) => Rich)
}

/**
 * Formula viva: LaTeX con i segnaposto \val{nome} e \val[decimali]{nome} di LiveFormula. I nomi sono quelli che
 * il motore esporta in VALUE_NAMES e calcola con formulaValues(stato): i numeri esatti del calcolo.
 * La notazione è quella del docente, copiata dal `latex` dei concetti dell'inventario.
 */
export interface EngineFormula<Ctx> {
  id: string
  /** Etichetta di cornice sopra la formula ("Nel punto sonda"). */
  label?: string
  tex: string | ((ctx: Ctx) => string)
}

/**
 * Sfide comuni: ogni motore aggiunge le sue in coda all'unione (vedi il parametro `Ch` di BasePreset).
 * Le decide `evaluateChallenge` (challenges.ts) e le disegna ChallengeRunner.
 * - custom: il preset decide con `check`; `reveal` si mostra dopo il successo.
 * - find: raggiungere una grandezza calcolata entro una tolleranza. Superata quando |score(s) − target(s)| ≤ tolerance.
 *   Un minimo (ISE, errori) si scrive con score = il valore corrente e target = il minimo; un rapporto entro il 5%
 *   con score = rapporto, target = 1, tolerance = 0.05; un vincolo "P_FA < a" con score = max(0, P_FA − a), target = 0.
 * - predict: prevedere prima di far partire il racconto. `input` 'number' (un campo), 'click-x' e 'click-xy' (un
 *   segno sul terreno, messo dal motore, con i campi numerici come alternativa da tastiera) o `{ options }` (una
 *   scelta: `truth` restituisce l'indice dell'opzione giusta). Superata quando la distanza dalla verità è ≤ tolerance
 *   (con le opzioni: la stessa opzione). `points`: 'exact' (predefinito) giusto o sbagliato; 'distance' dà anche un
 *   punteggio che scende con lo scarto (pieno entro la tolleranza, zero a tre tolleranze).
 * - sort: smistare chip o carte in contenitori (tastiera: Invio prende, frecce scelgono, Invio posa). Superata
 *   quando ogni chip sta nel contenitore di `answer`; `explain` spiega i chip messi male.
 * - compute: rispondere con un numero calcolato a mano. Superata quando |risposta − answer(s)| ≤ tolerance.
 */
export type CommonChallenge<State> =
  | { kind: 'custom'; prompt: Rich; hint?: Rich; check: (s: State) => boolean; reveal?: Rich }
  /** raggiungere una grandezza calcolata entro una tolleranza (ISE minimo, errori minimi, P_FA < a…) */
  | { kind: 'find'; prompt: Rich; hint?: Rich; score: (s: State) => number; target: (s: State) => number; tolerance: number }
  /** prevedere prima di far partire il racconto: un numero, un clic sul terreno o una scelta fra opzioni */
  | {
      kind: 'predict'
      prompt: Rich
      hint?: Rich
      input: 'number' | 'click-x' | 'click-xy' | { options: readonly Rich[] }
      truth: (s: State) => number | readonly [number, number]
      tolerance: number
      points?: 'distance' | 'exact'
    }
  /** smistare chip o carte in contenitori (tastiera: Invio prende, frecce scelgono, Invio posa) */
  | {
      kind: 'sort'
      prompt: Rich
      items: readonly { id: string; label: Rich }[]
      bins: readonly { id: string; label: Rich }[]
      answer: Readonly<Record<string, string>>
      explain?: Readonly<Record<string, Rich>>
    }
  /** rispondere con un numero calcolato a mano (NumberField) */
  | { kind: 'compute'; prompt: Rich; hint?: Rich; answer: (s: State) => number; tolerance: number; unit?: string }

/** I tipi delle sfide comuni, nell'ordine dell'unione. */
export type CommonChallengeKind = CommonChallenge<unknown>['kind']

/**
 * Voce della legenda viva, legata a uno strato del motore: passarci sopra accende lo strato e attenua gli altri
 * (TermLegend). `symbol` è LaTeX senza $, `it` Markdown, `en` il termine delle slide.
 */
export interface EngineTerm<Target extends string> {
  target: Target
  symbol: string
  it: Rich
  en: string
}

/**
 * Una scheda del widget (Gaussian / Gamma / Rayleigh, "V fisso" / "K fisso", Costo / Interpretabilità): un preset
 * parziale che il motore fonde con quello di base (applyTab in presetTools.ts). Una scheda non è un altro widget:
 * stessi dati, stesso terreno, cambia ciò che è acceso e che cosa si regola. `overrides` può toccare anche i campi
 * propri del motore (per questo `& Record<string, unknown>`).
 */
export interface PresetTab<Layer extends string, Phase, Ctx, State, Ch extends { kind: string } = CommonChallenge<State>, TermTarget extends string = Layer | 'samples'> {
  id: string
  label: Rich
  en?: string
  overrides: Partial<Omit<BasePreset<Layer, Phase, Ctx, State, Ch, TermTarget>, 'tabs'>> & Record<string, unknown>
}

/**
 * Spia, badge o scheda che si accende quando lo stato soddisfa una condizione: "ML = Bayes", le tre ipotesi del
 * TLC, "S_W singolare". Ha sempre testo e icona (mai solo colore) e annuncia il cambio (InsightLamps).
 * `tone`: 'ok' una condizione soddisfatta, 'warn' un'avvertenza, 'info' (predefinito) un fatto.
 */
export interface Insight<State> {
  id: string
  label: Rich
  en?: string
  when: (s: State) => boolean
  tone?: 'ok' | 'warn' | 'info'
}

/**
 * Campi che ogni preset ha, qualunque sia il motore.
 *
 * Due parametri di tipo oltre ai quattro della Parte comune, entrambi con un predefinito, così
 * `BasePreset<Layer, Phase, Ctx, State>` resta la forma del documento:
 * - `Ch`: l'unione delle sfide. Un motore che "allarga" le sfide scrive
 *   `BasePreset<L, P, C, S, CommonChallenge<S> | { kind: 'requirements'; … }>`: un'interfaccia che estende non può
 *   allargare il tipo di un campo, quindi l'allargamento passa da qui.
 * - `TermTarget`: i bersagli della legenda (predefinito gli strati più 'samples'; density1d aggiunge 'h').
 */
export interface BasePreset<Layer extends string, Phase, Ctx, State, Ch extends { kind: string } = CommonChallenge<State>, TermTarget extends string = Layer | 'samples'> {
  /** Strati offerti: uno strato assente non ha né disegno né comando. */
  layers: readonly Layer[]
  /** Strati accesi all'apertura e dopo Reset; devono essere fra quelli offerti. */
  initialLayers: readonly Layer[]
  /** Parametri con slider (ParamSlider), nell'ordine dei comandi. */
  params?: readonly ParamSpec[]
  /** I passi del racconto. Il primo è il quadro completo; niente autoplay. */
  storyboard: readonly EngineStep<Phase, Ctx>[]
  /** Formule vive, sotto la didascalia: la prima con segnaposto annuncia i suoi valori. */
  formulas: readonly EngineFormula<Ctx>[]
  /** La sfida: una delle comuni o una del motore. Non deve essere superata dallo stato iniziale. */
  challenge?: Ch
  /** Legenda viva con la terminologia del docente, IT/EN. */
  terms?: readonly EngineTerm<TermTarget>[]
  /** Avvertenze sotto la legenda (Markdown): "non è il kernel delle SVM". */
  notes?: readonly Rich[]
  /** Nome accessibile del terreno. */
  ariaLabel: string
  /** Descrizione del terreno per chi non lo vede; una funzione dello stato per citarne i numeri. */
  description?: string | ((s: State) => string)
  /** Rapporto larghezza/altezza del terreno. */
  aspect?: number
  /** seme dei dati sintetici; "Nuovi dati" lo incrementa */
  seed?: number
  /**
   * Schede del widget (Gaussian / Gamma / Rayleigh, "V fisso" / "K fisso", Costo / Interpretabilità):
   * ogni scheda è un preset parziale che il motore fonde con quello di base. Una scheda non è un altro
   * widget: stessi dati, stesso terreno, cambia ciò che è acceso e che cosa si regola.
   */
  tabs?: readonly PresetTab<Layer, Phase, Ctx, State, Ch, TermTarget>[]
  /**
   * Spie, badge e schede che si accendono quando lo stato soddisfa una condizione: "ML = Bayes",
   * le tre ipotesi del TLC, le due condizioni di consistenza, i pro e contro di K-NN e Parzen, "S_W singolare".
   * Hanno sempre testo e icona (mai solo colore) e annunciano il cambio con useSettled.
   */
  insights?: readonly Insight<State>[]
}

/**
 * Qualsiasi preset di un motore, per gli aiuti che non guardano ai tipi di strati, fasi, contesto e stato
 * (twinsDiffer). `never` al posto di contesto e stato: una funzione di un contesto qualsiasi resta assegnabile.
 */
export type AnyPreset = BasePreset<string, unknown, never, never, { kind: string }, string>

/**
 * Asse di una grandezza dello scenario, per i motori che ne hanno più d'uno (spazio dei dati e dei parametri,
 * tempo e ampiezza): nome in italiano e in inglese, unità, simbolo, estremi e scala.
 */
export interface AxisSpec {
  it: string
  en: string
  unit?: string
  /** simbolo come si scrive sull'asse, in testo semplice: "x", "θ", "p̂(x)" */
  symbol?: string
  domain?: readonly [number, number]
  log?: boolean
}
