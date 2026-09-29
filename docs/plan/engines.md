# Architettura dei motori dei widget (m01-m16)

Documento dell'architetto, 2026-09-24, rivisto lo stesso giorno da un critico indipendente (sezione "Revisione indipendente": due motori divisi, quattro widget su misura passati a un motore, campi del preset precisati). Riguarda i 382 widget degli inventari m01-m16 esclusi quelli di m09 (tutti costruiti) e ne decide la produzione: **20 motori parametrici** coprono 312 widget con un preset ciascuno, **68 widget** restano su misura, **2** (`m03-campioni-che-rivelano-la-pdf`, `m08-cella-che-si-espande`) sono già costruiti. La mappa macchina è `docs/plan/widget-map.json` (ogni widget del catalogo compare una e una sola volta, controllato con node); il workflow `scripts/workflows/engines-build.workflow.js` la legge e cerca qui la sezione di ogni motore per nome.

Criterio di assegnazione: un widget va su un motore **solo se** storyboard, interazioni, formule vive e sfida della sua specifica si scrivono tutti come preset. Dove il motore perderebbe ciò che rende unico il widget (una metafora fisica, una tabella che è la spiegazione, un gesto che nessun altro widget usa) il widget è su misura, anche se somiglia a qualcosa di motorizzato. Quando un motore deve crescere per un widget, cresce con un campo nuovo del preset e i suoi test, mai con un ramo "se è il widget X".

## Sommario

| # | Motore | Widget | Riferimento | Moduli futuri che lo useranno |
|---|---|---|---|---|
| 1 | `density1d` (esteso) | 15 | `m08-dilemma-dimensione-regione` | m09 (varianti mancanti), p01, d14 |
| 2 | `pdf-families` | 20 | `m06-chi-quadro-somma-quadrati` | m17, p01-p02 (Bernoulli, Beta), d11-d12 (VAE, rumore) |
| 3 | `estimator-lab` | 26 | `m04-pavimento-di-cramer-rao` | p01-p02, m21 (valutazione ripetuta), d04 |
| 4 | `theta-lab` | 31 | `m07-bayesian-learning-live` | m17 (MAP/ML), p01-p02 (Beta-Bernoulli, Dirichlet) |
| 5 | `covariance` | 21 | `m06-costruisci-la-covarianza` | m18-m19 (discriminanti quadratici) |
| 6 | `projection2d` | 20 | `m15-retta-rotante-proiezioni` | m19, p06 (perceptron), d13 (self-supervised, embedding) |
| 7 | `classifier2d` | 33 | `m16-mdm-come-bayes` | m17-m22, p06-p09 (perceptron, SVM, kernel), p11-p13 (clustering), d01 |
| 8 | `mixture-em` | 14 | `m10-em-passo-passo-1d` | p11-p13 (k-means, GMM), d11 (VAE latente) |
| 9 | `landscape` | 6 | `m05-massimo-o-trappola` | d03 (SGD, momentum, Adam), p07 (duale SVM), d10 (GAN min-max) |
| 10 | `twoclass1d` | 22 | `m02-soglia-sulla-luminosita` | m17-m18 (Bayes, rischio minimo), m21 (ROC), p03 |
| 11 | `subset-search` | 20 | `m13-sfs-bottom-up` | m22 (alberi, scelta degli split), d04 (pruning) |
| 12 | `block-flow` | 13 | `m01-schema-a-blocchi-percorso` | d06 (pipeline di detection), d09 (transformer a blocchi), p04 (reti bayesiane come grafo) |
| 13 | `exam-deck` | 6 | `m05-officina-esercizi-ml` | tutti i moduli: simulazioni d'orale e derivazioni |
| 14 | `signal-lab` | 8 | `m01-campionamento-ecg` | d07 (RNN su sequenze), energia |
| 15 | `raster-lab` | 13 | `m16-box-classifica-mappa` | d05-d06 (convoluzioni, detection, segmentazione), d12 (diffusione) |
| 16 | `dimension-lab` | 10 | `m11-freccette-negli-angoli` | p10 (spazi delle feature dei kernel), d02 |
| 17 | `fit-sweep` | 9 | `m11-curva-di-hughes` | d01 (regressione), d03-d04 (curve di apprendimento, regolarizzazione), p08 (C delle SVM) |
| 18 | `scene3d` | 15 | `m06-affetta-la-campana` | m19 (superfici discriminanti), p07 (mappa delle feature 3D), d03 (superfici di loss) |
| 19 | `density2d` | 5 | `m08-chi-fissa-cosa` | m09 (varianti 2D oggi su misura), p11-p13 (mean-shift, clustering per densità) |
| 20 | `spectrum-nd` | 5 | `m14-segnale-e-rumore` | p10 (matrici di Gram dei kernel), d08-d09 (matrici di attenzione), d13 (spettri degli embedding) |

`density1d` esiste già: per lui "costruire" significa aggiungere i campi del preset descritti sotto, senza rompere i 28 preset di m09 (i loro test restano verdi).

---

## Parte comune a tutti i motori

### Il contratto di cartella

Ogni motore segue `density1d` (WIDGET_GUIDE §12):

```
src/widgets/engines/<nome>/
  types.ts        tipi del preset (solo tipi, commentati)
  <nome>.ts       logica pura: calcoli, stato di un passo (sceneAt), valori delle formule
  <nome>.test.ts  test della logica
  <Componente>.tsx  riceve { meta, preset } e costruisce tutto nel WidgetFrame
  layers/*.tsx    strati del terreno che il kit non ha (come density1d/terrain.tsx)
  scenarios.ts    costruttori di scenari del cast pronti (pesce, sensori, telerilevamento, …)
  index.ts        API pubblica: componente, tipi, costruttori, funzioni che i test dei preset usano
```

Un widget su motore è tre file: `<widgetId>.widget.tsx` (meta e `<Motore meta={meta} preset={preset} />`), `<widgetId>.preset.ts`, `<widgetId>.test.tsx`.

### Tipi condivisi: `src/widgets/engines/shared/`

Venti motori non devono reinventare venti volte lo stesso passo, la stessa formula viva e la stessa sfida. Il primo costruttore che ne ha bisogno crea `engines/shared/` (il kit non si modifica, WIDGET_GUIDE §1.6; se più avanti un pezzo si rivela generale lo si promuove al kit con un task a parte). Tipi di base:

```ts
// engines/shared/types.ts
import type { Rich } from '../../../content/types'

/** Un parametro con slider: lineare o logaritmico a valori tondi (niceLogSteps di density1d). */
export interface ParamSpec {
  id: string
  label: Rich            // "Numero di campioni $N$"
  en?: string            // termine inglese della slide, in corsivo lang="en"
  min: number; max: number; initial: number
  step?: number
  scale?: 'linear' | 'log' | 'int'
  unit?: string
  /** valori a cui lo slider si aggancia (i valori della slide) */
  snaps?: readonly number[]
}

/** Un passo dello storyboard: la fase è propria del motore, il resto è uguale per tutti. */
export interface EngineStep<Phase, Ctx> {
  id: string
  label: string
  phase: Phase
  durationMs: number | ((ctx: Ctx) => number)
  caption: Rich | ((ctx: Ctx) => Rich)
}

/** Formula viva: LaTeX con \val{nome}; i nomi sono quelli che il motore esporta in VALUE_NAMES. */
export interface EngineFormula<Ctx> {
  id: string
  label?: string
  tex: string | ((ctx: Ctx) => string)
}

/** Sfide comuni: ogni motore aggiunge le sue in coda all'unione. */
export type CommonChallenge<State> =
  | { kind: 'custom'; prompt: Rich; hint?: Rich; check: (s: State) => boolean; reveal?: Rich }
  /** raggiungere una grandezza calcolata entro una tolleranza (ISE minimo, errori minimi, P_FA < a…) */
  | { kind: 'find'; prompt: Rich; hint?: Rich; score: (s: State) => number; target: (s: State) => number; tolerance: number }
  /** prevedere prima di far partire il racconto: un numero, un clic sul terreno o una scelta fra opzioni */
  | { kind: 'predict'; prompt: Rich; hint?: Rich; input: 'number' | 'click-x' | 'click-xy' | { options: readonly Rich[] }; truth: (s: State) => number | [number, number]; tolerance: number; points?: 'distance' | 'exact' }
  /** smistare chip o carte in contenitori (tastiera: Invio prende, frecce scelgono, Invio posa) */
  | { kind: 'sort'; prompt: Rich; items: readonly { id: string; label: Rich }[]; bins: readonly { id: string; label: Rich }[]; answer: Readonly<Record<string, string>>; explain?: Readonly<Record<string, Rich>> }
  /** rispondere con un numero calcolato a mano (NumberField) */
  | { kind: 'compute'; prompt: Rich; hint?: Rich; answer: (s: State) => number; tolerance: number; unit?: string }

/** Voce della legenda viva, legata a uno strato del motore. */
export interface EngineTerm<Target extends string> { target: Target; symbol: string; it: Rich; en: string }

/** Campi che ogni preset ha, qualunque sia il motore. */
export interface BasePreset<Layer extends string, Phase, Ctx, State> {
  layers: readonly Layer[]
  initialLayers: readonly Layer[]
  params?: readonly ParamSpec[]
  storyboard: readonly EngineStep<Phase, Ctx>[]
  formulas: readonly EngineFormula<Ctx>[]
  challenge?: CommonChallenge<State> // allargata dal motore
  terms?: readonly EngineTerm<Layer | 'samples'>[]
  notes?: readonly Rich[]
  ariaLabel: string
  description?: string | ((s: State) => string)
  aspect?: number
  /** seme dei dati sintetici; "Nuovi dati" lo incrementa */
  seed?: number
  /**
   * Schede del widget (Gaussian / Gamma / Rayleigh, "V fisso" / "K fisso", Costo / Interpretabilità):
   * ogni scheda è un preset parziale che il motore fonde con quello di base. Una scheda non è un altro
   * widget: stessi dati, stesso terreno, cambia ciò che è acceso e che cosa si regola.
   */
  tabs?: readonly { id: string; label: Rich; en?: string; overrides: Partial<Omit<BasePreset<Layer, Phase, Ctx, State>, 'tabs'>> & Record<string, unknown> }[]
  /**
   * Spie, badge e schede che si accendono quando lo stato soddisfa una condizione: "ML = Bayes",
   * le tre ipotesi del TLC, le due condizioni di consistenza, i pro e contro di K-NN e Parzen, "S_W singolare".
   * Hanno sempre testo e icona (mai solo colore) e annunciano il cambio con useSettled.
   */
  insights?: readonly { id: string; label: Rich; en?: string; when: (s: State) => boolean; tone?: 'ok' | 'warn' | 'info' }[]
}
```

`tabs` e `insights` sono nati dalla revisione a campione: fra i 312 widget su motore 26 specifiche hanno schede e 93 hanno spie, badge o schede che si accendono, e scriverle motore per motore avrebbe prodotto venti varianti diverse della stessa cosa. Il motore le disegna con un componente unico di `engines/shared/` (`TabStrip`, `InsightLamps`).

### Pezzi che mancano al kit e si scrivono una volta in `engines/shared/`

| Pezzo | Serve a | Motori |
|---|---|---|
| `Knob` (manopola angolare, tastiera come uno slider circolare, θ e θ+180° identici se richiesto) | direzioni, angoli, rotazioni | projection2d, covariance, scene3d, landscape |
| `HandleOnCurve` e `LineHandles` (maniglia vincolata a una curva; retta a due maniglie) | picco e fianco di una campana, retta di separazione, soglia orizzontale | pdf-families, theta-lab, classifier2d, twoclass1d, mixture-em |
| `Threshold` (verticale o orizzontale trascinabile, aggancio ai bordi dei bin, tastiera) | soglie, confini di segmentazione ordinati | twoclass1d, signal-lab, raster-lab, pdf-families |
| `Ellipse` (da m e Σ, livelli in σ, maniglie opzionali di rotazione e assi) | covarianze, box contro ellisse, EM | covariance, classifier2d, projection2d, mixture-em |
| `MatrixGrid` (matrice con numeri o frazioni esatte, colormap divergente, hover di cella e simmetrica, celle che volano e si sommano) | Σ, S_W, S_B, Fisher, W, tabelle J | covariance, projection2d, estimator-lab, scene3d, subset-search |
| `ParamChart` (grafico piccolo "grandezza contro parametro", scala log, cursore del valore corrente, curve teoriche, punti Monte Carlo con barre d'errore, costruzione punto per punto) | curve a U, ISE contro N, errore contro soglia, J(θ), accuratezza contro n | quasi tutti |
| `Gauge` e `Thermometer` | cruscotti asintotici, misure di separabilità, tre obiettivi | estimator-lab, twoclass1d, fit-sweep |
| `DragBins` e `Sortable` (chip in contenitori, liste riordinabili con FLIP, tastiera completa) | sfide `sort`, riordino di blocchi, carte | exam-deck, block-flow, signal-lab, subset-search |
| `Flight` (segni che volano da un `Plot` a un altro: mappa coordinate dominio → schermo → dominio) | pixel che volano nel piano, stime che cadono nell'istogramma, fattori nel prodotto | raster-lab, estimator-lab, theta-lab, projection2d, scene3d |
| `MonteCarloRunner` (repliche a lotti per fotogramma con `useAnimationFrame`, fermabili, a seed; oltre i 50 ms per lotto usa un Web Worker) | training set ripetuti, freccette, ondate di punti | estimator-lab, dimension-lab, fit-sweep, classifier2d, subset-search |
| `LinkedPanels` (pannelli impilati o affiancati con asse o cursore condiviso, small multiples) | tre pannelli della verosimiglianza, duelli, griglie N = 1…100 | theta-lab, density1d, classifier2d, twoclass1d, estimator-lab |
| `Sketch` (disegno a mano libera di una curva e punteggio di somiglianza) | disegnare la pdf ipotizzata, la predittiva | theta-lab, density1d (estratto dal widget costruito `m03-campioni-che-rivelano-la-pdf`) |
| `Stem`, `Violin`, `Ribbon` (fascia fra due curve), `SciCounter` (notazione scientifica con rulli) | segnali campionati, distribuzioni per N, bande, contatori combinatori | signal-lab, estimator-lab, subset-search, dimension-lab |
| `TabStrip` e `InsightLamps` (schede di `tabs`; spie e badge di `insights` con icona, testo e annuncio) | schede Gaussian/Gamma/Rayleigh, V fisso / K fisso; spie delle ipotesi, badge "ML = Bayes", pro e contro | tutti |

### Regole comuni

1. **Nessun testo di un widget nel motore.** Titoli dei passi, didascalie, termini, note, etichette dei pulsanti che raccontano il caso ("Aggiungi la feature width"), nomi delle classi e delle grandezze stanno nel preset. Il motore ha solo i testi generici dei suoi comandi ("Passo avanti", "Nuovi dati") e li prende dal kit quando esistono.
2. **Scenari del cast.** I dati vengono da `src/lib/datasets/` o da un costruttore di `scenarios.ts` del motore, a seed; il `meta.scenario` è una chiave di `docs/plan/cast.md`. Numeri della slide (i 12 salmoni, i conteggi degli istogrammi di p.17, i punti di p51) entrano nel preset come dati espliciti e sono verificati dai test.
3. **Ogni passo è uno stato completo** (`sceneAt(preset, stepIndex, progress)` pura e testata a inizio e fine di ogni fase), perché con `prefers-reduced-motion` il kit mostra lo stato finale. Il primo passo è il quadro completo; niente autoplay; un passo che impone un valore mette in pausa lo storyboard se l'utente tocca quel comando.
4. **Moto**: WIDGET_GUIDE §4. Comandi frequenti senza animazione; racconto con durate di 1-2 s; risposte brevi sotto i 300 ms; il tempo viene da `useAnimationFrame`, mai da `setTimeout`. Moti lunghi (Monte Carlo, scansioni) leggono il tempo solo negli strati che si muovono (canale `onFrame`).
5. **Colori per ruolo** (WIDGET_GUIDE §5): campioni, stima, verità tratteggiata, kernel, evidenza ocra, confini; classi con `classVar(i)` e la forma di `marks.ts`, mai solo colore. Il preset sceglie ruoli, non colori.
6. **Accessibilità**: ogni gesto del puntatore ha l'equivalente da tastiera (trascinamenti = cursori con frecce; clic sul terreno = cursore di lettura più Invio; drag-and-drop = Invio/frecce/Invio); `Plot` con `ariaLabel` e `description` calcolata dallo stato; annunci con `useSettled`, una sola formula annuncia; bersagli di 40 px (22 px per i segni fitti con alternativa da tastiera); layout a 390 px con comandi sotto il terreno.
7. **Formule vive**: notazione del docente copiata dal `latex` dei concetti; il motore esporta `VALUE_NAMES` e `formulaValues(state)` con i numeri **esatti** del calcolo; slider su valori tondi.
8. **Test richiesti per ogni motore**: logica pura (valori noti, casi limite, `sceneAt` a inizio e fine di ogni fase); componente (apertura, tastiera, clic, storyboard con reduced motion, Reset); un test generico `presetContract(preset)` esportato dall'`index.ts` che ogni preset chiama: ogni `\val{}` esiste, ogni testo compila con `katex.renderToString(…, { throwOnError: true })`, ogni strato iniziale è offerto, ogni parametro iniziale sta nel suo intervallo, la sfida non è superata dallo stato iniziale.
9. **Test richiesti per ogni preset**: fedeltà ai numeri della specifica, sfida tarata (stato iniziale non basta, un valore raggiungibile basta, l'indizio porta alla soluzione), `presetContract`.
10. **Costo**: il calcolo di un fotogramma interattivo resta sotto qualche millisecondo; ciò che costa (ottimi, esaustive, 5000 repliche) si fa al clic o a lotti per fotogramma, mai a ogni render. SVG finché i segni sono poche centinaia, `FieldCanvas`/`CanvasLayer` oltre.
11. **Niente dipendenze nuove** senza necessità: la scena 3D è una proiezione propria con algoritmo del pittore su canvas, la FFT e le componenti connesse sono funzioni pure nel motore.
12. **Guida del motore**: il costruttore scrive `docs/engines/<nome>.md` sul modello di WIDGET_GUIDE §13 (scenari, campi del preset, fasi, valori delle formule, sfide, limiti, tabella "widget coperti: che cosa usa ciascuno").
13. **Gemelli**: i moduli che si sovrappongono (m03-m08 sulle stesse slide, m11-m12 sul filtro/wrapper, m01-m02 sulle tessere UAV, m09-m10 sul σ adattivo) hanno widget quasi omonimi sullo stesso motore. Le loro specifiche differiscono per scenario, dati, sfida e pannelli: il preset li rende **tutti**, e un test per coppia (`twinsDiffer(a, b)`) controlla che differiscano almeno per scenario, sfida e un pannello o strato. Elenco dei gruppi nella sezione "Revisione indipendente".

---

## 1. Motore `density1d` (esteso)

**Scopo.** La stima di densità in una dimensione del Cap. 2 (Melgani) e di m08: campioni su un asse, Parzen, K-NN, istogramma, regione R di volume V con la formula madre $K/(NV)$, stima a serie ortogonali, fit gaussiano ML come termine di confronto, densità vera, errore integrato, punto sonda. Oggi copre m09; va esteso per m03, m07 e m08.

**Riferimento.** `m08-dilemma-dimensione-regione`: regione R con slider V logaritmico, N da 50 a 2000, "Nuovi dati", ventaglio di 20 ripetizioni, grafico a U di ISE con bias² e varianza, sonda fra picco e spalla. Esercita quasi tutte le estensioni.

**Widget coperti.**
`m03-albero-degli-approcci`, `m03-anteprima-non-parametrici`, `m07-quando-serve-la-non-parametrica`, `m08-parametrico-che-fallisce`, `m08-flessibilita-e-suo-prezzo`, `m08-due-strade-anteprima`, `m08-dilemma-dimensione-regione`, `m08-bias-varianza-a-regione-fissa`, `m08-pro-e-contro`, `m08-k-piccolo-k-grande`, `m08-esempio-1d-k3-k5`, `m08-un-solo-campione-e-code`, `m08-knn-al-crescere-di-n`, `m08-volume-knn-segue-la-densita`, `m08-casi-limite-formula-madre`.

**Estensioni del preset** (campi nuovi e opzionali; i preset m09 non cambiano):

```ts
// aggiunte a Density1dPreset
export type Density1dLayer =
  | 'kernels' | 'estimate' | 'truth' | 'histogram' | 'knn'            // esistenti
  | 'region'      // regione R centrata nella sonda, larghezza V con maniglie; stima K/(NV)
  | 'gaussFit'    // fit gaussiano ML dei campioni (il parametrico che fallisce sui dati bimodali)
  | 'series'      // stima a funzioni ortogonali con M termini e basi tratteggiate
  | 'fan'         // ripetizioni fantasma su training set ricampionati
  | 'compass'     // costruzione K-NN tracciata: compasso sulla x corrente fino al K-esimo vicino
  | 'probeStrip'  // striscia verticale di stime ripetute sopra la sonda, con media e std
  | 'smoothedTruth' // densità lisciata (1/V)∫_R p: il limite a V fisso quando N → ∞ (m08-casi-limite-formula-madre)
  | 'zeroBand'    // tratti dell'asse in cui la stima vale 0, con la frazione d'asse a stima nulla

export interface Density1dExtensions {
  /** stimatori confrontati in pannelli sincronizzati con sonda condivisa (anteprima a tre, due strade) */
  panes?: readonly { id: string; estimator: 'parzen' | 'knn' | 'region' | 'series' | 'gaussFit'; overrides?: Partial<Density1dPreset['initial']> }[]
  /** campioni ricampionabili a seed con uno slider di N (anche logaritmico, fino a 2000) */
  resample?: { generator: (rng: Rng, n: number) => number[]; n: ParamSpec }
  samples?: { editable: boolean; draggable?: boolean; min: number; max: number }
  region?: { V: ParamSpec }                       // regione R
  series?: { M: ParamSpec; basis: 'cosine' | 'hermite' }
  repetitions?: { count: number }                 // strato 'fan' e bias/varianza
  /** pannelli secondari sotto o a lato del terreno */
  panels?: readonly (
    | { kind: 'error-vs-param'; param: 'h' | 'k' | 'V' | 'M'; parts: readonly ('ise' | 'bias2' | 'var')[] }
    | { kind: 'error-vs-N'; estimators: readonly ('gaussFit' | 'parzen' | 'knn')[]; metric: 'ise' | 'l1'; crossing?: boolean }
    | { kind: 'width-vs-x' }                       // larghezza della cella K-NN contro x (misurata, prevista, Parzen)
    | { kind: 'area-vs-L' }                        // area della stima K-NN con N = 1 che diverge
    | { kind: 'multiples'; Ns: readonly (number | 'inf')[] }  // colonna N = 1, 16, 256, ∞ (slide 50)
    | { kind: 'approach-tree'; leaves: readonly { id: string; estimator: string; label: Rich }[] }
    | { kind: 'costs'; memory: boolean; perQuery: boolean }
  )[]
  /** K legato a N (K = c√N) quando N cambia */
  kLaw?: { kind: 'fixed' } | { kind: 'sqrt'; c: ParamSpec }
  /** asse verticale: fisso (come oggi) o con asintoto e punta fuori scala esplicita */
  yMax?: number | { fixed: number; clipLabel: Rich }
  /** stato del regime per K, V o M, non solo per h (timbri overfit/equilibrio/oversmooth) */
  regimes?: { param: 'h' | 'k' | 'V'; sensitiveBelow: number; smoothAbove: number }
  zoom?: readonly { id: string; label: Rich; domain: readonly [number, number] }[]
  /** zone dell'asse con errore L1 separato (zona densa e coda di m08-pro-e-contro) */
  zones?: readonly { id: string; label: Rich; domain: readonly [number, number] }[]
  /** N fino a 50 000 per i casi limite: sopra i 2000 campioni il terreno disegna la stima, non le tacche */
  nMax?: number
}
```

Le schede ("V fisso" / "K fisso", "solo salmoni" / "pescato misto") e le schede dei pro e contro che si accendono usano `tabs` e `insights` di `BasePreset`: `density1d` adotta i due campi insieme alle estensioni.

**Nuove fasi dello storyboard**: `expand` (l'intervallo K-NN si allarga fino al K-esimo vicino), `sweep` (la sonda scorre e la curva si traccia, con compasso), `repeat` (i fantasmi entrano uno alla volta), `grow-n { to }` (N passa per valori con ricampionamento), `region { V }` (V passa al valore, come `bandwidth`), `reveal` (sipario della verità), `play-n` (25 passi logaritmici di N con le curve d'errore che si costruiscono).

**Formule vive, valori nuovi**: `V`, `KR` (campioni in R), `pR` (K/(NV)), `bias2`, `var`, `mse`, `l1`, `M`, `muHat`, `sigmaHat` (fit gaussiano), `width` (larghezza della cella in x), `Lint` (area fino a L), `memory`, `ops`.

**Sfide**: `min-ise` esteso a V, K e M; `find` sui minimi contro N; `predict` (prevedere l'incrocio prima di Play, il K-esimo vicino); `custom` (V decrescenti per N = 50, 200, 1000).

**Primitive del kit**: `Plot`, `LinePath`, `AreaPath`, `Dots` (trascinabili per `m08-esempio-1d-k3-k5`), `Histogram`, `Arrow`, `PlayControls`, `Slider` su indici logaritmici, `LiveFormula`, `Readout`, `Challenge`. **Da scrivere**: stima a serie ortogonali (`lib/ml/nonparam.ts` non ce l'ha: va nel motore), regione R, ventaglio e striscia di ripetizioni, pannelli `ParamChart`, `LinkedPanels` per le tre anteprime.

**Confini.** Resta in una dimensione. La regione in 2D e 3D (`m08-regione-r-e-probabilita`) e le sfide a fasi con disegno (`m08-disegna-la-stima-knn`) sono su misura.

---

## 2. Motore `pdf-families`

**Scopo.** Le famiglie parametriche di m03-m06 (gaussiana, gaussiana generalizzata, Gamma, χ², Rayleigh, log-normale, esponenziale) come laboratorio: un **generatore visibile** produce i dati (somma di quadrati, attesa del k-esimo evento, modulo di un fasore I-Q, esponenziale di una gaussiana, somma di n cause, catena di acquisizione SAR), i campioni cadono in un istogramma, sopra si disegnano le curve della famiglia con le manopole dei parametri, il fit ML si anima, una classifica di log-verosimiglianza confronta le famiglie.

**Riferimento.** `m06-chi-quadro-somma-quadrati`: generatore a colonne-sensore con barre che si elevano al quadrato e si impilano, flusso veloce fino a 5000, slider k, sovrapposizione Gamma(k/2, 2), soglia con coda e falsi allarmi, anomalia iniettata.

**Widget coperti.**
`m03-famiglie-parametriche`, `m04-scelta-del-modello-statistico`, `m04-galleria-modelli-simmetrici`, `m04-galleria-modelli-positivi`, `m05-catena-di-acquisizione-sar`, `m05-gaussiana-e-gaussiana-generalizzata`, `m05-gamma-e-chi-quadro`, `m05-rayleigh-ampiezza-radar`, `m05-lognormale-importi`, `m05-indovina-il-modello`, `m05-limite-centrale-consumi`, `m06-catena-acquisizione-modello`, `m06-indovina-il-modello`, `m06-gaussiana-mu-sigma`, `m06-gaussiana-generalizzata-beta`, `m06-gamma-attesa-k-eventi`, `m06-rayleigh-eco-radar`, `m06-chi-quadro-somma-quadrati`, `m06-log-normale-prezzi-case`, `m06-limite-centrale-somma-cause`.

```ts
export type FamilyId = 'gauss' | 'gengauss' | 'gamma' | 'chi2' | 'rayleigh' | 'lognormal' | 'exponential' | 'laplace' | 'uniform'

export interface FamilySpec {
  id: FamilyId
  params: readonly ParamSpec[]                 // μ, σ²; β, b; k, θ; …
  /** curve della slide da tracciare in sequenza come fantasmi etichettati */
  presets?: readonly { label: Rich; values: Readonly<Record<string, number>> }[]
  /** parametrizzazione alternativa per l'invarianza (σ o σ², θ o λ = 1/θ) */
  alt?: { id: string; label: Rich }
}

export type GeneratorSpec =
  | { kind: 'direct'; family: FamilyId; values: Readonly<Record<string, number>> }
  | { kind: 'sum-of-squares'; k: ParamSpec; anomaly?: { shift: ParamSpec } }          // χ²
  | { kind: 'waiting-time'; k: ParamSpec; theta: ParamSpec }                           // Gamma: timeline di Poisson
  | { kind: 'modulus-iq'; sigma: ParamSpec; ring?: boolean }                            // Rayleigh: piano I-Q
  | { kind: 'log-transform'; mu: ParamSpec; sigma: ParamSpec; factors?: ParamSpec }     // log-normale: tre pannelli
  | { kind: 'sum-of-causes'; n: ParamSpec; causes: readonly ('uniform' | 'exponential' | 'bernoulli' | 'cauchy')[]; violations?: readonly ('infinite-variance' | 'dependent')[] } // TLC
  | { kind: 'acquisition-chain'; stages: readonly ChainStage[] }                       // fenomeno → mezzo → sensore → pre-processing
  | { kind: 'mystery'; pool: readonly FamilyId[]; rounds: number }                      // dataset senza etichetta

export interface ChainStage { id: string; label: Rich; control: ParamSpec | { options: readonly { id: string; label: Rich }[] } }

export type PdfLayer = 'histogram' | 'curve' | 'presets' | 'fit' | 'others' | 'marks' | 'tail' | 'support' | 'bands' | 'probe'

export interface PdfFamiliesPreset extends BasePreset<PdfLayer, PdfPhase, PdfCtx, PdfState> {
  source: GeneratorSpec
  axis: { it: string; en: string; unit?: string }; domain: readonly [number, number]
  families: readonly FamilySpec[]
  /** explore: manopole; fit: fit ML e classifica; guess: round a punteggio; match: griglia 2×2 e etichette da abbinare */
  mode: 'explore' | 'fit' | 'guess' | 'match'
  panels?: readonly ('leaderboard' | 'objective-vs-shape' | 'compare-table' | 'distance-vs-n' | 'hypotheses')[]
  threshold?: { initial: number; draggable: boolean; report: 'tail' | 'false-alarm' }
  n: ParamSpec
  yLog?: boolean; xExtended?: readonly [number, number]
  /** tolleranza della sfida di fit: log-lik entro questa frazione del massimo */
  fitTolerance?: number
}
export type PdfPhase =
  | { kind: 'overview' } | { kind: 'generate'; rate: number } | { kind: 'stream'; to: number }
  | { kind: 'presets' } | { kind: 'fit' } | { kind: 'overlay'; family: FamilyId } | { kind: 'reveal' } | { kind: 'explore' }
```

**Strati e interazioni.** Istogramma con campioni che cadono; curva della famiglia attiva con manopole (slider) e, per gaussiana e GG, maniglie su picco e fianco; curve fantasma dei preset della slide; sonda con valore della densità; marcatori moda/mediana/media; soglia trascinabile con area di coda; zone di supporto impossibile (una gaussiana che mette massa sotto lo zero); classifica a barre della log-verosimiglianza; mini-grafico della log-verosimiglianza contro il parametro di forma; tessere delle famiglie cliccabili; pannello del generatore sopra l'istogramma (colonne di barre, timeline di eventi, piano I-Q, tre pannelli x → ln x → istogramma, tubi di cause, schema a blocchi della catena).

**Storyboard.** `generate` (il generatore produce un campione ogni ~400 ms, visibile passo per passo), `stream` (flusso a lotti fino a N), `presets` (i fantasmi della slide uno alla volta), `fit` (la curva scivola ai parametri ML), `overlay` (una seconda famiglia sovrapposta: Gamma su χ²), `reveal` (la famiglia vera del dataset misterioso).

**Formule vive.** Valori: parametri correnti e stimati (`mu`, `sigma2`, `beta`, `b`, `k`, `theta`, …), `logL`, `logLmax`, `mean`, `mode`, `median`, `var`, `x0`, `px0`, `tail`, `threshold`, `n`, `ks` (distanza dalla normale nel TLC). La formula della densità si scrive con i numeri del punto sonda (esempio della specifica: $f(2;4)=0.184$).

**Sfide**: `fit-within` (log-lik entro `fitTolerance` del massimo), `guess` (round a punteggio sulla famiglia), `match` (abbinamento griglia), `tail-rate` (soglia per un tasso di falsi allarmi dato), `predict` (stimare β a occhio), `find`, `custom`.

**Primitive del kit**: `Histogram`, `LinePath`, `AreaPath`, `Bars`, `Dots`, `Arrow`, `Segmented`, `Slider`, `PlayControls`, `LiveFormula`, `Readout`, `Challenge`. **Da scrivere**: densità di GG, χ², log-normale, esponenziale, Laplace e i loro fit ML (Gamma e Rayleigh esistono in `stats.ts`), generatori animati, `HandleOnCurve`, `Threshold`, `DragBins` per `match`, `ParamChart`.

**Confini.** Il grafo di trasformazioni con particelle sugli archi (`m05-parentele-tra-modelli`) resta su misura.

---

## 3. Motore `estimator-lab`

**Scopo.** La bontà degli stimatori (m03-m06, m08): un modello genera training set ripetuti, ogni stimatore produce la sua stima, le stime si accumulano in viste diverse; bias, varianza, MSE, pavimento di Cramér-Rao, score e curvatura di Fisher, proprietà asintotiche contro N, consistenza come frazione di traiettorie dentro una banda.

**Riferimento.** `m04-pavimento-di-cramer-rao`: quattro corsie di stimatori, "+1" e "+500", barre della varianza che si assestano, pavimento σ²/N che sale con spillo, badge EFFICIENT, slider N e σ, scala log, lettura del rapporto varianza/bound.

**Widget coperti.**
`m03-stima-che-cambia-col-training-set`, `m03-bersaglio-bias-varianza`, `m03-cramer-rao-e-fisher`, `m03-proprieta-asintotiche`, `m03-consistenza-imbuto`, `m04-la-stima-e-aleatoria`, `m04-bersaglio-bias-varianza`, `m04-varianza-attorno-alla-media`, `m04-pavimento-di-cramer-rao`, `m04-fisher-pendenza-e-curvatura`, `m04-quantita-e-qualita-dei-campioni`, `m04-corsa-verso-infinito`, `m04-imbuto-della-consistenza`, `m04-ml-raggiunge-il-bound`, `m04-ml-tre-proprieta-asintotiche`, `m04-score-e-curvatura-spam`, `m04-ipotesi-del-bound`, `m05-teorema-efficienza-ml`, `m05-cruscotto-asintotico-ml`, `m06-bias-covarianza-ml`, `m06-proprieta-asintotiche-stime`, `m07-pochi-dati-prior-e-intervalli`, `m08-frequenza-relativa-e-grandi-numeri`, `m08-k-binomiale-e-imbuto`, `m08-condizioni-di-consistenza`, `m08-cella-aleatoria-beta`.

```ts
export interface ModelSpec {
  id: string
  /** genera un training set; θ è il vettore dei parametri veri */
  sample: (rng: Rng, n: number, theta: Readonly<Record<string, number>>) => number[]
  theta: readonly ParamSpec[]                          // σ, λ, sensibilità, contaminazione q, …
  truthTex: string
  /** come si vede un training set: puntini sull'asse, eventi su una timeline, griglia di icone (email), pixel di un'immagine */
  view: 'axis' | 'timeline' | 'icons' | 'raster'
  /** regione R trascinabile sull'asse (frequenza relativa K/N di m08-frequenza-relativa-e-grandi-numeri) */
  region?: { initial: readonly [number, number]; minWidth: number }
  logLik?: (x: readonly number[], theta: number) => number   // per score e curvatura
}

export interface EstimatorSpec {
  id: string
  label: Rich; en?: string
  estimate: (x: readonly number[], ctx: { theta: Readonly<Record<string, number>> }) => number | readonly [number, number]
  theory?: { mean?: (n: number, th: Record<string, number>) => number; var?: (n: number, th: Record<string, number>) => number }
  /** stimatore lineare con pesi editabili (vincolo di somma 1) */
  weights?: { n: number; editable: true }
  /** intervallo attorno alla stima (μN ± 1.96σN, banda di confidenza): barra sul terreno e vista 'coverage' */
  interval?: (x: readonly number[], ctx: { theta: Readonly<Record<string, number>> }) => readonly [number, number]
}

export type EstimatorView =
  | { kind: 'draw' }                                          // il training set corrente e la freccia θ̂(·) verso l'asse delle stime
  | { kind: 'estimates-axis'; histogram: boolean; theory: boolean; signedError: boolean }
  | { kind: 'target2d'; axes: readonly [string, string]; ellipse: boolean; biasArrow: boolean; thumbnails?: boolean }
  | { kind: 'lanes'; varianceBars: boolean }
  | { kind: 'decomposition' }                                 // barre impilate bias² + varianza = MSE
  | { kind: 'n-sweep'; metrics: readonly ('biasRatio' | 'varOverBound' | 'pInside' | 'mse' | 'rmse' | 'value' | 'frequency' | { id: string; label: Rich; value: (n: number, th: Record<string, number>) => number; log?: boolean })[]; mc: boolean; miniHist?: boolean; laws?: readonly { id: string; label: Rich; k: (n: number) => number }[] }  // leggi K(N) da confrontare (m08-condizioni-di-consistenza)
  | { kind: 'funnel'; trajectories: number; delta: ParamSpec; fraction: boolean }
  | { kind: 'score'; tangent: boolean; curvature: boolean }   // log-lik con tangente nel vero, istogramma degli score
  | { kind: 'gauges' }
  | { kind: 'violins'; Ns: readonly number[] }
  | { kind: 'count-hist'; theory: 'binomial' | 'beta' }        // K in R mese per mese; contenuto di probabilità della cella K-NN
  | { kind: 'error-hist'; metric: 'squared' | 'absolute'; overlay: boolean } // istogrammi sovrapposti dell'errore di due stimatori (ML contro Bayes)
  | { kind: 'coverage'; level: number }                        // quante volte l'intervallo (di credibilità o di confidenza) contiene il vero

export interface EstimatorLabPreset extends BasePreset<EstLayer, EstPhase, EstCtx, EstState> {
  model: ModelSpec
  estimators: readonly EstimatorSpec[]
  selector: 'checkbox' | 'segmented' | 'none'
  views: readonly EstimatorView[]
  bound?: { tex: string; value: (n: number, th: Record<string, number>) => number }
  batches: readonly number[]                                  // +1, +100, +500
  n: ParamSpec
  /** interruttori di ipotesi che cambiano modello o stimatore (unbiased, regolare, iid) */
  hypotheses?: readonly { id: string; label: Rich; off: { model?: ModelSpec; estimators?: readonly EstimatorSpec[] } }[]
  /** stato visibile solo dopo "Rivela" (θ vero sotto il cappuccio) */
  hidden?: readonly ('theta' | 'truthCurve')[]
}
export type EstPhase =
  | { kind: 'overview' } | { kind: 'draw' } | { kind: 'batch'; count: number; ms: number }
  | { kind: 'bound' } | { kind: 'badge'; estimator: string } | { kind: 'sweep-n' } | { kind: 'reveal' } | { kind: 'explore' }
```

**Strati e interazioni.** Campioni del training set corrente; stime come pallini o triangoli che cadono e rimbalzano; istogramma cumulato con curva teorica; linee del vero e della media; parentesi della deviazione standard; freccia del bias; ellisse di dispersione; barre di varianza e linea del bound; small multiples contro N in scala log con linea a quota 1; traiettorie colorate dentro/fuori la banda ±δ; gauge a lancetta; violini per N; pulsanti a lotti; hover di barra e cella; slider di N, σ, δ, α (shrinkage), q (contaminazione).

**Storyboard.** `draw` (un training set cade e produce una stima), `batch` (k training set a lotti), `bound` (il pavimento sale), `badge` (lo stimatore efficiente tocca il pavimento), `sweep-n` (N corre da 2 a 5000 in scala log con i mini-istogrammi che seguono), `reveal`.

**Formule vive.** `N`, `theta`, `thetaHat`, `meanHat`, `bias`, `var`, `mse`, `bound`, `ratio` (var/bound), `pInside`, `delta`, `scoreMean`, `scoreVar`, `fisher`, `alpha`, `coverage`, `k`, `kOverN`.

**Sfide**: `compute` (quante letture per un bound di 0.1), `find` (α ottimo per MSE; N per RMSE sotto soglia), `predict` (scommessa su quale stimatore è più stabile), `custom` (battere ML con i pesi: impossibile, lo si verifica).

**Primitive del kit**: `Dots`, `Histogram`, `Bars`, `LinePath`, `Arrow`, `Grid`, `PlayControls`, `Segmented`, `Toggle`, `LiveFormula`, `Readout`. **Da scrivere**: `MonteCarloRunner`, `ParamChart` log con punti MC e barre d'errore, `Gauge`, `Violin`, `Ellipse`, corsie (strip plot), `Flight` delle stime, vista `raster` (riusa le funzioni di `raster-lab`).

**Confini.** La pagella 4×5 con controesempi (`m04-pagella-dello-stimatore`), la geometria dei quadrati degli scarti (`m05-varianza-ml-distorta`), la tabella con celle mancanti (`m03-non-sprecare-informazione`) e la matrice di Fisher costruita cella per cella (`m04-matrice-di-fisher-2x2`) sono su misura.

---

## 4. Motore `theta-lab`

**Scopo.** Verosimiglianza e stima bayesiana su un parametro scalare (m03-m08): due spazi collegati, lo spazio dei dati x (campioni, candidata p(x|θ) trascinabile, asticelle p(x_k|θ)) e lo spazio del parametro θ (L(θ), l(θ), prior, posterior, predittiva), con ML contro Bayes, aggiornamento sequenziale e casi limite.

**Riferimento.** `m07-bayesian-learning-live`: assi della slide 38, campioni uno alla volta, posterior che si deforma, fantasmi congelati a N = 1, 5, 10, 20, 30, "Nuova estrazione", "Salta a N = 1000", slider σ, μ0, σ0, sfida di abbinamento fantasmi-N.

**Widget coperti.**
`m03-verosimiglianza-come-prodotto`, `m03-accordo-tra-theta-e-dati`, `m03-tre-pannelli-della-verosimiglianza`, `m03-ml-contro-bayes-anteprima`, `m03-quando-ml-e-bayes-coincidono`, `m03-costante-o-variabile-aleatoria`, `m04-likelihood-come-prodotto`, `m04-tre-pannelli-likelihood`, `m04-ml-contro-bayes-parametro`, `m04-ricerca-ml-singola-osservazione`, `m05-ml-search-una-osservazione`, `m05-argmax-likelihood-salmoni`, `m05-pdf-contro-likelihood`, `m05-derivata-nulla-molle`, `m05-ml-contro-bayesiana`, `m06-derivata-log-verosimiglianza`, `m06-theta-fisso-o-aleatorio`, `m07-theta-fisso-o-aleatorio`, `m07-catena-dati-posterior-predittiva`, `m07-media-pesata-dei-modelli`, `m07-prior-per-verosimiglianza`, `m07-due-spazi-mu-e-x`, `m07-somma-di-parabole`, `m07-casi-limite-della-posterior`, `m07-precisioni-che-si-sommano`, `m07-bayesian-learning-live`, `m07-integrale-predittivo`, `m07-due-fonti-di-incertezza`, `m07-quando-ml-e-bayes-coincidono`, `m08-ml-punto-vs-bayes-distribuzione`, `m08-quando-ml-e-bayes-coincidono`.

```ts
export type ThetaModel =
  | { kind: 'gauss-mean'; sigma: ParamSpec }                 // σ nota, θ = μ (maniglia σ opzionale se r = 2)
  | { kind: 'gauss-mean-var' }                               // θ = (m, σ): heatmap di likelihood nel piano (m, σ)
  | { kind: 'bernoulli' }                                    // email spam/ham, θ ∈ [0, 1]
  | { kind: 'exponential' }

export type ThetaPrior =
  | { kind: 'gauss'; mu0: ParamSpec; sigma0: ParamSpec; allowUniform?: boolean }
  | { kind: 'beta'; a: ParamSpec; b: ParamSpec } | { kind: 'uniform' }

export type ThetaPanel =
  | 'data'            // asse x: campioni, candidata, asticelle, molle, frecce degli scarti
  | 'likelihood'      // L(θ), anche tracciata per scansione; scala lin, log o ×1e-k
  | 'loglik'          // l(θ), parabole dei singoli campioni e del prior (somma di parabole)
  | 'posterior'       // prior, fattori, prodotto non normalizzato, posterior, banda 95%
  | 'predictive'      // plug-in p(x|θ̂) contro predittiva p(x|X), campane pesate e loro somma
  | 'product-chain'   // catena dei fattori che volano in una barra del prodotto
  | 'phase-map'       // heatmap dello scarto ML-Bayes su (N, σ0) con punto cliccabile
  | 'vs-N'            // grandezze contro N: peso del prior, σN², Δ log-log
  | 'precision-stack' // pila di blocchi di precisione 1/σ0² + N/σ²
  | 'counters'        // costo, falsi allarmi, copertura

export interface ThetaLabPreset extends BasePreset<ThetaLayer, ThetaPhase, ThetaCtx, ThetaState> {
  model: ThetaModel
  prior?: ThetaPrior
  data: { samples?: readonly number[]; generator?: (rng: Rng, n: number) => number[]; truth: number; hidden?: boolean }
  axisX: AxisSpec; axisTheta: AxisSpec
  layout: readonly ThetaPanel[] | { split: readonly [readonly ThetaPanel[], readonly ThetaPanel[]] } // impilati o ML | Bayes
  candidates?: readonly { label: Rich; theta: number; clickable: boolean }[]   // A, B fisse, quattro candidate della slide
  arrival: { mode: 'manual' | 'stream'; batches: readonly number[]; conveyor?: boolean; icons?: 'dot' | 'email'; editable?: 'click' | 'drag' | 'none' }
  n?: ParamSpec
  ghosts?: { atN: readonly number[]; labelled: boolean }
  numeric?: { underflow: boolean }                                    // indicatore di underflow con N grandi
  sensors?: readonly { id: string; label: Rich; sigma: number; cost: number }[] // precisioni che si sommano
  flow?: { readings: number; repeats: number }                        // flusso di letture con lampi fuori banda
}
export type ThetaPhase =
  | { kind: 'overview' } | { kind: 'arrive'; perSampleMs: number } | { kind: 'bars' } | { kind: 'multiply' }
  | { kind: 'scan'; from: number; to: number } | { kind: 'normalize' } | { kind: 'ghost' } | { kind: 'jump'; n: number }
  | { kind: 'release' }   // le molle portano m all'equilibrio (media)
  | { kind: 'ascend' }    // "Vai al massimo"
  | { kind: 'predictive-sweep' } | { kind: 'reveal' } | { kind: 'explore' }
```

**Strati e interazioni.** Candidata con maniglie θ (e σ); asticelle con valori; fattori trasparenti e prodotto in grassetto; scia di L(θ) mentre si trascina θ; tacche di altezza su una verticale in x0 (ML search); molle a zig-zag con freccia risultante = ∂l/∂m; frecce degli scarti che si sommano; spillo argmax ML e rombo del picco posterior con doppia freccia della distanza; bandierina, ago, lucchetto; campioni virtuali del prior; banda credibile; fantasmi etichettati; heatmap (m, σ) o (N, σ0) con punto sincronizzato; nastro trasportatore di campioni; icone email; clic per aggiungere o togliere campioni; slider N (log), θ, σ, μ0, σ0, n0.

**Storyboard.** `arrive`, `bars`, `multiply` (i fattori volano nel prodotto), `scan` (θ scorre e traccia L e l), `normalize`, `ghost`, `jump` (N = 1000: l'ago), `release` (molle), `ascend`, `predictive-sweep` (la posterior viene scandita e le campane pesate si accumulano nella predittiva), `reveal`.

**Formule vive.** `N`, `theta`, `L`, `l`, `prod` (prodotto parziale), `thetaML`, `muN`, `sigmaN`, `peak`, `delta` (ML − Bayes), `wData`, `wPrior`, `k`, `a`, `b`, `pred` (p(x|X) nella sonda), `sigmaPred`, `falseAlarms`, `cost`, `ratio` (p(X|θ_A)/p(X|θ_B)).

**Sfide**: `find` (θ entro 0.05 dal massimo, overlap massimo con 5 campioni posizionati), `predict` (clic sul picco; direzione dello spostamento della posterior prima di ogni campione), `sketch` (disegno della predittiva, da `Sketch`), `match-ghosts`, `compute` (N per σN < 0.1; costo minimo fra sensori), `custom`.

**Primitive del kit**: `Plot`, `LinePath`, `AreaPath`, `Dots`, `Arrow`, `FieldCanvas`, `Contours`, `PlayControls`, `Slider`, `Toggle`, `LiveFormula`, `Readout`. **Da scrivere**: `LinkedPanels` (asse θ condiviso fra i pannelli, cursore che collega spazio dei dati e dei parametri), `HandleOnCurve`, molle con dinamica di rilassamento, `Flight` dei fattori, notazione scientifica con underflow, `Sketch`.

**Confini.** La deformazione dell'asse in ln (`m05-log-likelihood-prodotti-somme`), la heatmap p(x|θ) con tagli ortogonali (`m03-funzione-di-x-o-di-theta`), la marginalizzazione per scansione di colonna (`m07-marginalizzare-theta`), il tiro alla fune e la macchina a slot restano su misura.

---

## 5. Motore `covariance`

**Scopo.** Statistiche del secondo ordine (m05-m07, m11-m12, m14-m15): nuvola 2D con media e ellissi di livello, covarianza costruita a passi con i prodotti esterni, correlazione, Mahalanobis contro euclidea, autovalori e autovettori (polinomio caratteristico, frecce lunghe √λ, maniglie sull'ellisse che modificano Σ), stima ML incrementale e ripetuta, misure fra due gaussiane 2D (divergenza, Bhattacharyya, Chernoff), matrici di scatter di più classi, scatter a coppie fino a n = 3. La vista **matrice n × n** con lo spettro degli autovalori è un motore a parte, `spectrum-nd` (sezione 20): il suo terreno non è il piano.

**Riferimento.** `m06-costruisci-la-covarianza`: 40 pixel di vegetazione, cinque fasi (media, centratura con quadranti, prodotti esterni che si sommano in Σ, strada alternativa E{xxᵗ} − mmᵗ, correlazione), trascinamento di un punto, slider ρ e N, preset "lavagna" a 4 punti con frazioni esatte, sfida "cambia il segno della covarianza".

**Widget coperti.**
`m05-formula-gaussiana-multivariata`, `m05-costruisci-la-covarianza`, `m05-indipendenza-e-fattorizzazione`, `m05-ellissi-e-autovettori`, `m06-formula-viva-bivariata`, `m06-mahalanobis-contro-euclidea`, `m06-costruisci-la-covarianza`, `m06-feature-indipendenti-prodotto`, `m06-autovettori-assi-ellisse`, `m06-stima-ml-campione-per-campione`, `m07-stime-ml-media-e-covarianza`, `m07-bias-della-covarianza-ml`, `m12-divergenza-gaussiana-2d`, `m12-chernoff-gaussiano`, `m12-bhattacharyya-due-termini`, `m14-varianza-e-unita`, `m14-costruisci-la-scatter`, `m14-equazione-caratteristica`, `m14-varianza-per-componente`, `m15-fabbrica-matrici-scatter`, `m15-tre-classi-tre-medie`.

```ts
export type CovData =
  | { kind: 'points'; points: readonly Vec2[]; labels?: readonly number[] }            // lavagna, esempi della slide
  | { kind: 'gauss'; m: Vec2; sigma1: ParamSpec; sigma2: ParamSpec; rho: ParamSpec; n: ParamSpec }
  | { kind: 'classes'; classes: readonly { m: Vec2; Sigma: Mat2; n: number; weight?: ParamSpec }[] }
  | { kind: 'bands3'; Sigma: (rho: number) => Mat3; n: ParamSpec; image?: { w: number; h: number } }  // 3 bande: scatter a coppie, heatmap 3 × 3, barre degli autovalori

export type CovLayer =
  | 'points' | 'mean' | 'ellipses' | 'trueEllipse' | 'estEllipse' | 'repEllipses' | 'eigen' | 'deviations'
  | 'quadrants' | 'outer' | 'mahalanobis' | 'euclidean' | 'probe' | 'marginals' | 'whiten' | 'charPoly'
  | 'matrix' | 'eigenBars' | 'fields' | 'pairs' | 'globalMean' | 'lever' | 'mixedEllipse' | 'termBars'
  // 'mixedEllipse': ellisse della covarianza mescolata M di chernoffMu (campo M: (1 − s)Σ_i + sΣ_j con 'correct', sΣ_i + (1 − s)Σ_j con 'slide') che si trasforma con s (Chernoff); 'termBars': termini delle medie e delle covarianze impilati

export interface CovariancePreset extends BasePreset<CovLayer, CovPhase, CovCtx, CovState> {
  data: CovData
  view: 'plane' | 'plane+matrix' | 'fields' | 'pairs' | 'plane+3d'  // 'plane+3d' usa scene3d per la campana tagliata
  handles?: { mean?: boolean; points?: 'drag' | 'click-add' | 'none'; ellipse?: 'axes' | 'none'; probe?: boolean }
  estimator?: { normalization: '1/N' | '1/(N-1)' | 'toggle'; incremental?: 'click' | 'stream' | 'none'; repeats?: number }
  twoGaussians?: { measure: 'divergence' | 'bhattacharyya' | 'chernoff'; s?: ParamSpec; formulaVariant?: 'slide' | 'correct' | 'toggle' }
  scatter?: { withinBetween: boolean; normalization: 'toggle' | 'sum' | 'mean' }  // S_i, S_W, S_B, S_T
  units?: { scale: ParamSpec; standardize: boolean }                              // cm/mm che ruotano la PCA
  matrixDisplay?: { fractions: boolean; decimals: number; symmetricHover: boolean }
  /** editor numerico di una matrice 2 × 2 simmetrica con timbro di validità (semidefinita o no) */
  matrixEditor?: { min: number; max: number }
  /** conteggio dei parametri n + n(n+1)/2 contro 2n con uno slider n che non tocca il piano */
  paramCounter?: { n: ParamSpec }
}
export type CovPhase =
  | { kind: 'overview' } | { kind: 'light-points' } | { kind: 'mean' } | { kind: 'center' } | { kind: 'quadrants' }
  | { kind: 'outer-products'; perPointMs: number } | { kind: 'accumulate' } | { kind: 'alternative' } | { kind: 'correlation' }
  | { kind: 'rotate-to-eigen' } | { kind: 'incremental' } | { kind: 'mix-s'; to: number } | { kind: 'explore' }
```

**Strati e interazioni.** Punti trascinabili o aggiunti con clic; croce della media che scivola; nuvola che trasla; quadranti colorati per segno; mini-matrici 2×2 che volano e si sommano; ellissi 1-2σ vere, stimate, ripetute; frecce degli autovettori √λ con maniglie di rotazione e allungamento; righelli euclideo e di Mahalanobis; sbiancamento animato; parabola del polinomio caratteristico con radici cliccabili; matrice live con celle che si illuminano; barre di λ1, λ2, λ3 con percentuali (fino a n = 3); tre heatmap (congiunta, prodotto delle marginali, differenza divergente); scatter a coppie per n = 3 con rotazione nelle coordinate PCA; leva con fulcro nella media globale.

**Storyboard.** Le fasi elencate nel tipo; ogni fase è uno stato completo (la mini-matrice di ogni punto già sommata a fine `outer-products`).

**Formule vive.** `m1`, `m2`, `s11`, `s12`, `s22`, `rho`, `det`, `tr`, `l1`, `l2`, `phi` (angolo), `e1x`, `e1y`, `dE`, `dM`, `N`, `D`, `Dm`, `Dc` (termini medie e covarianze), `B`, `mu_s`, `sStar`, `params` (conteggio), `x0` (punto sonda), `pdf` (valore della densità nella sonda), `pprod` (prodotto delle marginali nella sonda).

**Sfide**: `custom` (cambia il segno di σ12 trascinando un solo punto; due autovalori entro il 2%; S_i singolare con 4 pixel allineati), `compute` (λ1, λ2, φ1 a mano), `find` (punto di errore relativo massimo fra congiunta e prodotto delle marginali), `predict` (percentuale della prima barra prima di "Ruota").

**Primitive del kit**: `Dots` trascinabili, `Contours`, `FieldCanvas`, `Arrow`, `Bars`, `LinePath`, `LiveFormula`, `Readout`. **Da scrivere**: `Ellipse` con maniglie, `MatrixGrid` (frazioni esatte, celle che volano), autovalori e autovettori 2×2 e 3×3 (il Jacobi n × n sta in `engines/shared/math/linalg.ts`, condiviso con `spectrum-nd`), misure fra gaussiane (condivise con `twoclass1d` in `engines/shared/math/gauss.ts`), `Knob`.

**Confini.** Matrici n × n, spettri lunghi, rango e ricostruzione con m componenti sono di `spectrum-nd`, che importa da qui la stima di Σ e le ellissi per il suo riquadro 2D. Il poligono chiuso dei vettori pesati (`m15-rango-c-meno-uno`) e la tabella 4D editabile della ricetta LDA sono su misura; la matrice multiclasse di divergenze è di `subset-search`.

---

## 6. Motore `projection2d`

**Scopo.** Riduzione delle feature per proiezione (m05-m06, m11, m13-m15): una nuvola 2D con 1-3 classi o senza etichette, una direzione w ruotabile con manopola o trascinando la punta, perpendicolari e piedi animati, asse 1D proiettato con soglia, istogrammi proiettati per classe, criterio contro θ (varianza, residuo, Fisher, errore, curtosi, J_1) con sweep, pulsanti PCA, LDA e Fisher che ruotano la retta, molle di ricostruzione con rilassamento, sbiancamento, trasformazioni non lineari (polare, NDVI) con scrubber del morph.

**Riferimento.** `m15-retta-rotante-proiezioni`: i 15 punti di p51, retta a 45°, perpendicolari una per una, asse y con l'ordine N N R…, contatore dei fuori posto, manopola θ, preset p51 destra, "direzione di Fisher", toggle ‖w‖ = 2, clic su un punto per il calcolo di y.

**Widget coperti.**
`m05-semidefinita-positiva-proiezioni`, `m06-varianza-proiezione-psd`, `m11-selezionare-o-trasformare`, `m13-estrazione-polare`, `m13-selezionare-o-combinare`, `m14-scegliere-o-combinare`, `m14-dal-cerchio-alla-striscia`, `m14-lineare-o-non-lineare`, `m14-quale-obiettivo`, `m14-direzioni-interessanti`, `m14-rappresentare-o-separare`, `m14-molle-di-ricostruzione`, `m14-pca-passo-passo`, `m15-rappresentare-o-discriminare`, `m15-retta-rotante-proiezioni`, `m15-medie-proiettate-e-scatter`, `m15-allontanare-non-basta`, `m15-assi-lda-cosa-rappresentano`, `m15-duello-pca-lda`, `m15-lda-cieca-medie-coincidenti`.

```ts
export type Criterion = 'variance' | 'residual' | 'fisher' | 'error' | 'kurtosis' | 'J1' | 'sb'
export type Method = 'select-x1' | 'select-x2' | 'pca' | 'lda' | 'fisher' | 'autoencoder'

export interface Projection2dPreset extends BasePreset<ProjLayer, ProjPhase, ProjCtx, ProjState> {
  data: { classes?: readonly { points?: readonly Vec2[]; m?: Vec2; Sigma?: Mat2; n?: number; cls: number }[]; unlabeled?: boolean; editable?: 'drag' | 'add-remove' | 'none'; seed?: number }
  direction: { initialDeg: number; knob: { min: number; max: number; step: number }; tip?: { draggable: boolean; length?: readonly [number, number] }; through: 'origin' | 'mean' }
  layers: readonly ProjLayer[] // 'line' | 'arrow' | 'perpendiculars' | 'feet' | 'axis1d' | 'projHist' | 'sideHists' | 'reconstruction' | 'springs' | 'residualSquares' | 'ellipses' | 'means' | 'pcaAxes' | 'ldaAxis' | 'goniometer' | 'marginals' | 'whiten' | 'errorSegments'
  criteria?: readonly Criterion[]             // pannello criterio(θ) con marcatori degli ottimi
  methods?: readonly Method[]                 // pulsanti che animano la rotazione
  labelsToggle?: { initial: boolean; lockLdaWhenHidden: boolean }
  threshold?: { kind: 'best' | 'draggable' | 'symmetric' }
  normToggle?: boolean                        // ‖w‖ = 1 / 2
  transform?: { kind: 'polar' | 'ndvi' | 'ratio'; scrubber: boolean; probe?: boolean; thresholdOn: 'R' | 'x1' | 'ndvi' }
  physics?: { springs: boolean }
  shape?: { rho?: ParamSpec; elongation?: ParamSpec; meanDistance?: ParamSpec; meanAngle?: ParamSpec; illumination?: ParamSpec }
  presets?: readonly { label: Rich; deg: number }[]
  /** varianza direzionale aᵗΣa come grafico polare tracciato punto per punto, con editor di Σ 2 × 2 e timbro "semidefinita / non valida" */
  polar?: { editor: boolean }
  /** mini-rete 2→1→2 con neurone di collo di bottiglia addestrata a epoche (metodo 'autoencoder') */
  autoencoder?: { epochs: number; eta: ParamSpec }
  /** dataset alternativi con morph dei punti ("Due nuvole" / "Anello", "due strisce oblique") */
  datasets?: readonly { id: string; label: Rich; data: Projection2dPreset['data'] }[]
}
export type ProjPhase =
  | { kind: 'overview' } | { kind: 'project'; perPointMs: number } | { kind: 'collect' } | { kind: 'rotate-to'; to: number | Method }
  | { kind: 'sweep' } | { kind: 'release' } | { kind: 'whiten' } | { kind: 'morph' } | { kind: 'center' } | { kind: 'rotate-axes' }
  | { kind: 'cut'; m: 1 | 2 } | { kind: 'fly-to-hists' } | { kind: 'reveal-labels' } | { kind: 'explore' }
```

**Formule vive.** `theta`, `w1`, `w2`, `y` (punto cliccato con i numeri), `x1`, `x2`, `J`, `mt1`, `mt2` (medie proiettate), `st1`, `st2`, `varProj`, `J1`, `total`, `errors`, `kurt`, `angle` (fra PCA e LDA), `lambda1`, `lambda2`, `R`, `Phi`.

**Sfide**: `find` (minimo dei fuori posto con l'intervallo di θ; direzione che minimizza il residuo), `predict` (scommessa PCA contro LDA), `custom` (configurazione in cui PCA ≈ LDA o PCA ⊥ LDA).

**Primitive del kit**: `Dots`, `LinePath`, `Arrow`, `Histogram`, `Bars`, `Contours`, `LiveFormula`. **Da scrivere**: `Knob`, proiezioni e piedi animati, istogrammi ruotati lungo la retta, molle con rilassamento (condivise con `theta-lab`), `Ellipse`, sweep di `ParamChart` con marcatori degli ottimi, morph polare con i rami di arctan.

**Confini.** La bilancia di Fisher, la separazione di sorgenti ICA su serie temporali e la cernita su nastro sono su misura.

---

## 7. Motore `classifier2d`

**Scopo.** Il piano delle feature con classi: il motore più grande e più riusato (m01-m03, m08, m10, m12, m16 oggi; m17-m22, p06-p09 e p11-p13 domani). Famiglie di classificatori con i loro parametri, regioni e frontiere, punto di prova trascinabile con le sue letture (discriminanti, posterior, distanze, voti, appartenenza ai box), costruzioni geometriche (assi e Voronoi, box per momenti marginali), addestramento animato, cicli di apprendimento, pannelli gemelli e small multiples. La stima di densità nel piano senza classi (cella K-NN che si espande, lucchetto su K o su V, σ adattivo, normalizzazione) è un motore a parte, `density2d` (sezione 19); qui resta la densità **per classe** che entra in una regola di decisione (Parzen e K-NN come classificatori, voto dei K vicini).

**Riferimento.** `m16-mdm-come-bayes`: due gaussiane sferiche con cerchi di livello, frontiera MDM e bayesiana che coincidono, barre g_i(x) per il pesce trascinato, slider P(salmone) e σ che spostano la frontiera bayesiana, costi 5:1, fascia di disaccordo, formula di x_0 con i numeri.

**Widget coperti.**
`m01-semi-supervisionato-pixel`, `m01-active-learning-oracolo`, `m01-semi-vs-active-budget`, `m02-seleziona-scegli-addestra`, `m02-da-una-a-due-feature`, `m02-modello-e-costo`, `m02-retta-di-separazione`, `m02-confine-flessibile`, `m02-overfitting-pesci-nuovi`, `m03-overfitting-confine-pesce`, `m08-dal-knn-stimatore-al-classificatore`, `m12-perche-un-bound`, `m16-mappa-capitolo-4`, `m16-etichette-si-o-no`, `m16-quattro-leve-del-design`, `m16-albero-approcci`, `m16-parametrico-contro-non-parametrico`, `m16-galleria-frontiere-nonparametriche`, `m16-mdm-addestramento-prototipi`, `m16-mdm-classe-piu-vicina`, `m16-mdm-frontiere-assi`, `m16-mdm-come-bayes`, `m16-mdm-ipotesi`, `m16-mdm-limiti-separabilita`, `m16-box-costruzione`, `m16-box-alpha-e-lati`, `m16-box-secondo-ordine-primitivo`, `m16-box-bordo-piu-vicino`, `m16-box-sovrapposizioni`, `m16-box-scegli-alpha`, `m16-box-esempio-slide`, `m16-box-limiti-rigidi`, `m16-duello-mdm-box`.

```ts
export type ModelKind =
  | 'threshold' | 'line' | 'poly' | 'mdm' | 'box' | 'gauss' | 'knn' | 'parzen' | 'tree' | 'mlp' | 'svm' | 'kmeans'

export interface ModelSpec {
  kind: ModelKind
  label: Rich
  params?: readonly ParamSpec[]              // α del box, K, h o σ, grado, profondità, C, η…
  options?: {
    covariance?: 'full' | 'diagonal' | 'spherical' | 'shared'
    priors?: 'slider' | readonly number[]; costs?: 'toggle' | readonly [number, number]
    metric?: 'l2' | 'l1' | 'linf' | 'mahalanobis'; squared?: 'toggle'
    prototypes?: 'click-add' | number          // MDM multi-prototipo
    outside?: 'reject' | 'nearest-box' | 'nearest-mean'
    stats?: '1/N' | '1/(N-1)' | 'toggle'
    /** criterio di decisione applicato alle stesse densità (mappa del Cap. 4: MDM, box, MAP, rischio minimo, discriminanti, albero) */
    rule?: 'map' | 'ml' | 'min-risk' | 'discriminant'
  }
}

export interface Classifier2dPreset extends BasePreset<ClsLayer, ClsPhase, ClsCtx, ClsState> {
  data: {
    classes: readonly { cls: number; points?: readonly Vec2[]; m?: Vec2; Sigma?: Mat2; n?: number; shape?: 'gauss' | 'moons' | 'ring' | 'elongated' }[]
    features?: readonly { id: string; label: Rich; en: string }[] // candidate fra cui sceglierne due
    test?: { n: number; hidden?: boolean }; labelNoise?: ParamSpec; overlap?: ParamSpec; rotation?: ParamSpec
    editable?: 'none' | 'drag' | 'click-add' | 'both'; unlabeledFraction?: ParamSpec; seed: number
  }
  models: readonly ModelSpec[]
  /** un pannello, pannelli gemelli sincronizzati o small multiples: ognuno con il suo modello e i suoi override */
  /** tessere o leve che scelgono il modello attivo (sei criteri di m16-mappa-capitolo-4, quattro leve di m16-quattro-leve-del-design): ogni tessera è una scheda di `tabs`, e `verdicts` mette un pallino per criterio sotto il punto di prova */
  verdicts?: boolean
  panels?: readonly { id: string; model: string; overrides?: Readonly<Record<string, number>>; title?: Rich }[]
  layers: readonly ClsLayer[] // 'points' | 'regions' | 'boundary' | 'boundaries' | 'errors' | 'prototypes' | 'distances' | 'bisectors' | 'voronoi' | 'triplePoint' | 'boxes' | 'boxAnnotations' | 'ellipses' | 'marginals' | 'density' | 'cell' | 'margin' | 'rules' | 'disagreement' | 'contested' | 'rejected' | 'testSet' | 'mcRain' | 'decisionVerdicts'
  probe?: { draggable: boolean; readouts: readonly ('discriminants' | 'posteriors' | 'distances' | 'membership' | 'votes' | 'density')[]; shared?: boolean }
  loop?:
    | { kind: 'self-training'; unlabeled: ParamSpec }
    | { kind: 'active'; strategies: readonly ('random' | 'uncertainty' | 'manual')[]; budget: ParamSpec; oracleNoise?: ParamSpec }
    | { kind: 'train'; optimizer: 'perceptron' | 'gd'; eta: ParamSpec }
    | { kind: 'kmeans'; k: ParamSpec }
    | { kind: 'incremental-mean' }
  sidePanels?: readonly ('error-vs-param' | 'error-vs-N' | 'accuracy-vs-queries' | 'loss-vs-iter' | 'counters' | 'table' | 'coin-pile' | 'tree-selector' | 'curve-vs-alpha' | 'pe-vs-separation')[]
  wizard?: readonly ('features' | 'model' | 'train')[]   // scheda per scheda
  lift1d?: { axis: 'x' | 'y' }                           // dal dot plot 1D al piano (aggiungi la seconda feature)
  view3d?: { feature: string }                           // terza feature con scene3d
  mc?: { waves: readonly number[]; bound?: 'bhattacharyya' }
}
export type ClsPhase =
  | { kind: 'overview' } | { kind: 'draw-boundary'; model: string } | { kind: 'construct-bisectors' } | { kind: 'build-box' }
  | { kind: 'drop-samples'; perSampleMs: number } | { kind: 'train'; iterations: number } | { kind: 'loop-step' } | { kind: 'lift' }
  | { kind: 'mc-waves' } | { kind: 'expand-cell' } | { kind: 'reveal' } | { kind: 'explore' }
```

**Formule vive.** `g1`…`g6`, `d1`…`d6`, `x0x`, `x0y`, `P1`, `P2`, `sigma`, `alpha`, `K`, `Ki`, `post1`…, `pHat`, `V`, `errors`, `errTrain`, `errTest`, `rejected`, `contested`, `acc`, `cost`, `queries`, `Pe`, `eu` (bound), `mean` (incrementale), `params`.

**Sfide**: `find` (errori minimi, α che classifica il 95% lasciando neri i tetti, grado ottimo), `predict` (spostamento di x_0 con σ doppio; clic sul K-esimo vicino), `budget` (accuratezza con il minimo di domande all'oracolo), `custom` (ε_u < P_e è impossibile; coppia di feature e modello più semplice sotto il 5%).

**Primitive del kit**: `BoundaryCanvas`, `FieldCanvas`, `Contours`, `Dots` trascinabili, `ClassMark`, `Arrow`, `Bars`, `LinePath`, `Segmented`, `Slider`, `PlayControls`, `LiveFormula`, `Readout`, `Challenge`. **Da scrivere**: le famiglie di classificatori in `lib`-stile nel motore (MDM, box con rigetto e distanza punto-rettangolo, gaussiano con Σ e costi, albero assiale, MLP piccolo, SVM lineare/RBF per SMO semplificato, K-NN e Parzen 2D che già esistono in `nonparam.ts`), costruzione di bisettrici e Voronoi, `LineHandles`, `Ellipse`, `LinkedPanels` con sonda condivisa, `MonteCarloRunner` per le ondate, `ParamChart`.

**Confini.** Le densità 2D senza classi sono di `density2d` (che esporta qui i suoi stimatori). La tabella sincronizzata con il nastro (`m01-training-set-pesce`), la rete PNN a strati e l'hub a cinque modalità della supervisione sono su misura.

---

## 8. Motore `mixture-em`

**Scopo.** Misture e clustering iterativo (m01, m10; p11-p13 domani): componenti pesate editabili in 1D e 2D, somma, responsabilità (barrette bicolori, glifi a torta, segmenti impilati sulla sonda), passi E e M animati con diagramma del ciclo, log-verosimiglianza per iterazione, inizializzazione e criterio di arresto, dati mancanti con gaussiane condizionate lungo il vincolo, collasso di σ, k-means come limite a σ comune.

**Riferimento.** `m10-em-passo-passo-1d`: 150 luminosità, due gaussiane iniziali trascinabili, pulsanti E-step e M-step, riquadri del ciclo che si illuminano, campane che scivolano con molla, log-verosimiglianza per iterazione, Play fino a Δ < 1e-6, "Rivela le specie vere", sfida "clicca dove finirà la media".

**Widget coperti.**
`m01-clustering-senza-etichette`, `m10-parametrico-batte-nonparametrico`, `m10-costruttore-di-misture`, `m10-detective-dei-modi`, `m10-due-verosimiglianze`, `m10-costruire-q`, `m10-em-passo-passo-1d`, `m10-inizializza-e-ferma`, `m10-responsabilita-bayes`, `m10-m-step-medie-pesate`, `m10-em-gmm-mappa-satellitare`, `m10-quattro-punti-x1-mancante`, `m10-dati-mancanti-in-pratica`, `m10-collasso-sigma-zero`.

```ts
export interface Component { weight: number; mu: number | Vec2; sigma: number | Mat2; cls?: number }

export interface MixtureEmPreset extends BasePreset<MixLayer, MixPhase, MixCtx, MixState> {
  dim: 1 | 2
  data: { points?: readonly (number | Vec2)[]; truth?: readonly Component[]; n?: ParamSpec; seed: number; missing?: { fraction: ParamSpec; coordinate: 0 | 1 }; raster?: { w: number; h: number } }
  init: { components: readonly Component[]; draggable: boolean; strategies?: readonly ('manual' | 'random' | 'prior')[] }
  M?: ParamSpec
  algorithm: 'em' | 'kmeans' | 'hard-threshold' | 'none'           // 'none' = costruttore di misture
  constraints?: { sharedSigma?: boolean; fixedWeights?: readonly number[]; fixedSigma?: boolean; logSigma?: ParamSpec }
  compare?: { parzen: { h: ParamSpec } }                            // pannello gemello Parzen
  layers: readonly MixLayer[] // 'histogram' | 'samples' | 'components' | 'sum' | 'softColors' | 'pies' | 'responsibilityProbe' | 'ellipses' | 'trails' | 'voronoi' | 'qCurve' | 'loglikBar' | 'truth' | 'conditional' | 'priorBar' | 'rasterMap'
  sidePanels?: readonly ('loglik-vs-iter' | 'delta-vs-iter' | 'params-table' | 'cycle' | 'pseudocode' | 'contingency' | 'q-vs-param')[]
  stop?: { epsilon: ParamSpec; maxIter: number }
  target?: { histogram: readonly number[] }                          // costruttore: istogramma bersaglio
}
export type MixPhase =
  | { kind: 'overview' } | { kind: 'e-step' } | { kind: 'm-step' } | { kind: 'cycle' } | { kind: 'run-until' }
  | { kind: 'generate' } | { kind: 'collapse' } | { kind: 'reveal' } | { kind: 'explore' }
```

**Formule vive.** `k`, `P1`…`P3`, `m1`…`m3`, `s1`…`s3`, `lnl`, `dlnl`, `Q`, `r1`, `r2` (responsabilità del campione cliccato), `num1`, `num2`, `den` (numeratori sulla sonda), `N`, `x`, `iter`.

**Sfide**: `predict` (clic sulla nuova media), `beat-em` (log-verosimiglianza a mano ≥ quella di EM), `find` (combaciare un istogramma bersaglio), `custom`.

**Primitive del kit**: `Histogram`, `LinePath`, `AreaPath`, `Dots`, `Contours`, `FieldCanvas`, `PlayControls`, `LiveFormula`, `Readout`. **Da scrivere**: EM per GMM 1D e 2D e k-means, E-step con dati mancanti (gaussiana condizionata), `Ellipse`, glifi a torta, molle delle medie pesate, diagramma del ciclo E/M, `ParamChart` semilog, collegamento a un raster (con `raster-lab`).

**Confini.** Il paesaggio della log-verosimiglianza (selle, bacini, minorante) è di `landscape`; la superficie Q in 3D di `scene3d`; il nastro con cartellini e la tabella con telo sono su misura.

---

## 9. Motore `landscape`

**Scopo.** Il paesaggio di una funzione obiettivo su uno o due parametri: curva o heatmap con curve di livello, punto trascinabile collegato a una vista dei dati, salita a gradiente o a passi EM con scia, multi-start con istogramma degli arrivi e bacini di attrazione, punti stazionari etichettati (massimo, sella) con curvatura, minorante tangente Q. Pochi widget oggi, ma è il motore dell'ottimizzazione di Ricci (d03) e del duale delle SVM.

**Riferimento.** `m05-massimo-o-trappola`: scheda gaussiana singola (parabola, clic che lancia una pallina a gradiente) e scheda mistura (heatmap su (m1, m2) con due colline e una sella, clic che parte, "Lancia 20 palline", istogramma degli arrivi, slider della separazione e del passo).

**Widget coperti.**
`m03-modello-e-parametri`, `m05-massimo-o-trappola`, `m10-ml-facile-o-difficile`, `m10-massimi-locali-e-selle`, `m10-minorante-q`, `m15-scalata-del-criterio`.

```ts
export interface LandscapePreset extends BasePreset<LandLayer, LandPhase, LandCtx, LandState> {
  tabs?: readonly { id: string; label: Rich; objective: ObjectiveSpec }[]
  objective: ObjectiveSpec
  linked?: 'histogram-curve' | 'samples-bars' | 'scatter-direction' | 'none'   // vista dei dati collegata al punto
  optimizer: { kind: 'gradient' | 'em' | 'closed-form'; eta?: ParamSpec; maxSteps: number }
  multistart?: { count: number; staggerMs: number }
  layers: readonly LandLayer[] // 'curve' | 'heatmap' | 'contours' | 'point' | 'trail' | 'gradient' | 'stationary' | 'basins' | 'minorant' | 'tangent' | 'arrivals'
}
export interface ObjectiveSpec {
  dims: 1 | 2
  axes: readonly [AxisSpec, AxisSpec?]
  f: (theta: readonly number[], data: DataCtx) => number
  grad?: (theta: readonly number[], data: DataCtx) => readonly number[]
  emStep?: (theta: readonly number[], data: DataCtx) => readonly number[]   // per le traiettorie EM e il minorante
  minorant?: (theta: readonly number[], at: readonly number[], data: DataCtx) => number
  data: (rng: Rng, params: Readonly<Record<string, number>>) => DataCtx
  params?: readonly ParamSpec[]                                        // separazione, N
}
export type LandPhase = { kind: 'overview' } | { kind: 'ascend' } | { kind: 'multistart' } | { kind: 'minorize' } | { kind: 'maximize' } | { kind: 'jump-closed' } | { kind: 'explore' }
```

**Formule vive.** `theta1`, `theta2`, `f`, `g1`, `g2` (gradiente), `h` (derivata seconda o autovalori dell'Hessiana), `steps`, `eta`, `arrivedA`, `arrivedB`, `Q`.

**Sfide**: `find` (una partenza che finisce sulla sella o su un massimo peggiore; il punto a gradiente nullo che non è un massimo), `predict` (dove arriverà la pallina), `custom`.

**Primitive del kit**: `FieldCanvas`, `Contours`, `LinePath`, `Dots`, `Arrow`, `Histogram`, `Segmented`, `Slider`, `LiveFormula`. **Da scrivere**: integratore della salita e dei passi EM con scia, classificazione dei punti stazionari, bacini per griglia di partenze (a lotti), minorante tangente.

---

## 10. Motore `twoclass1d`

**Scopo.** Due o tre classi su un asse (m02-m03, m05, m11-m13; m17-m18 e m21 domani): densità di classe (pesate dai prior) o istogrammi di campioni, soglie trascinabili con aggancio ai bin, aree d'errore, regola per bin, costi asimmetrici, piano P_FA × P_MA con riquadro dei requisiti, rilevamento con soglia orizzontale sulla densità, e le **misure di separabilità** del Cap. 3: rapporto e log-rapporto di verosimiglianza, integrando della divergenza con scansione, radici delle densità per JM, media geometrica di Chernoff con μ(s), termometri D, B, JM, P_c, banchi di proprietà, curve della misura contro la distanza fra le medie.

**Riferimento.** `m02-soglia-sulla-luminosita`: 131 pesci in istogrammi a gradini (bin 0.5), soglia x* trascinabile con aggancio, slider del costo relativo in scala log, due colori d'errore, curve errore e costo contro la soglia, confronto con la lunghezza.

**Widget coperti.**
`m02-soglia-sulla-lunghezza`, `m02-soglia-sulla-luminosita`, `m02-falsi-e-mancati-allarmi`, `m02-sovrapposizione-errore-minimo`, `m03-statistico-vs-non-statistico`, `m03-quanto-sai-cosa-stimi`, `m05-due-ml-stima-e-decisione`, `m11-quale-misura-j`, `m12-tre-termometri`, `m12-rapporto-di-verosimiglianza`, `m12-log-rapporto-e-valori-attesi`, `m12-integrando-della-divergenza`, `m12-caccia-al-segno`, `m12-banco-proprieta-divergenza`, `m12-divergenza-che-non-si-ferma`, `m12-errore-di-bayes-come-area`, `m12-chernoff-bound-e-s`, `m12-banco-proprieta-bhattacharyya`, `m12-radici-delle-densita`, `m12-jm-a-tre-classi`, `m12-jm-imita-pc`, `m13-jm-satura`.

```ts
export type ClassSpec1d =
  | { kind: 'gauss'; mu: ParamSpec | number; sigma: ParamSpec | number; prior?: ParamSpec | number; draggable?: boolean }
  | { kind: 'counts'; binWidth: number; start: number; counts: readonly number[] }  // conteggi della slide
  | { kind: 'samples'; generator: (rng: Rng, n: number) => number[]; n: ParamSpec }

export type Measure = 'D' | 'B' | 'JM' | 'Pc' | 'chernoff' | 'accuracy'

export interface Twoclass1dPreset extends BasePreset<TcLayer, TcPhase, TcCtx, TcState> {
  classes: readonly ClassSpec1d[]                 // 2 o 3
  axis: AxisSpec; domain: readonly [number, number]
  mode: 'decision' | 'detection' | 'measures'
  thresholds?: { count: 1 | 2; initial: readonly number[]; draggable: boolean; snap?: 'bins' | number }
  costs?: { ratio: ParamSpec } | { matrix: readonly [number, number] }
  layers: readonly TcLayer[] // 'densities' | 'weighted' | 'histograms' | 'errorAreas' | 'minCurve' | 'overlap' | 'perBin' | 'ratio' | 'logRatio' | 'integrand' | 'roots' | 'geoMean' | 'truth' | 'detectionBand' | 'anomalies' | 'samplesRain' | 'stems'
  sidePanels?: readonly ('error-vs-threshold' | 'cost-vs-threshold' | 'roc' | 'thermometers' | 'measure-vs-distance' | 'mu-of-s' | 'bench' | 'triangle' | 'multiples' | 'twin-learner' | 'formula-check')[]
  measures?: readonly Measure[]
  requirements?: { pfa: ParamSpec; pma: ParamSpec }
  designActions?: readonly { id: string; label: Rich; apply: (s: TcState) => Partial<TcState> }[]  // più dati, feature in più, modello flessibile
  learner?: { kind: 'perceptron'; epochMs: number; repeats: number }
  knowledge?: readonly { id: string; label: Rich; estimate: 'none' | 'gauss' | 'nonparam' }[]   // cursore "quanto sai"
  experiments?: readonly ('identical' | 'perturb' | 'swap')[]                                     // banco di proprietà
  variants?: readonly { id: string; label: Rich; tex: string }[]                                  // formula della slide contro corretta
}
export type TcPhase =
  | { kind: 'overview' } | { kind: 'drop' } | { kind: 'threshold-to'; x: number | 'optimal' } | { kind: 'scan' }
  | { kind: 'morph'; to: 'roots' | 'logRatio' } | { kind: 'experiment'; which: string } | { kind: 'search-s' }
  | { kind: 'normalize-overlay' } | { kind: 'epochs' } | { kind: 'lift2d' } | { kind: 'explore' }
```

**Formule vive.** `x`, `pfa`, `pma`, `pe`, `nerr`, `nerrMin`, `cost`, `L`, `lnL`, `D`, `Dij`, `Dji`, `B`, `rho`, `JM`, `Pc`, `s`, `mu_s`, `sStar`, `eu`, `P1`, `P2`, `mu1`, `mu2`, `s1`, `s2`, `area`, `integral`.

**Sfide**: `find` (soglia a errore minimo entro tolleranza; s ottimo), `requirements` (P_FA < a e P_MA < b con il minimo di azioni di design), `predict` (scommessa sulla stabilità), `compute`, `custom` (configurazione in cui due misure ordinano le feature al contrario).

**Primitive del kit**: `Histogram`, `AreaPath`, `LinePath`, `Bars`, `Dots`, `Plot` con cursore, `LiveFormula`, `Readout`. **Da scrivere**: `Threshold`, integrali numerici delle misure (condivisi con `covariance`), `Thermometer`, piano ROC con riquadro, pannelli allineati con scansione (`LinkedPanels`), sollevamento nel piano per l'azione "aggiungi feature" (usa il piano di `classifier2d`).

**Confini.** L'animazione della convoluzione a timbri su tre simboli (`m03-pam-convoluzione-soglie`), la matrice multiclasse e la disuguaglianza scalare con barre sono su misura.

---

## 11. Motore `subset-search`

**Scopo.** La selezione di feature come ricerca (m11-m13): tessere delle bande su una striscia spettrale, criterio J (tabella fissa, tabella editabile o calcolato da gaussiane di classe), reticolo dei sottoinsiemi, esaustiva che gira le carte, SFS e SBS a passi con vassoio, lucchetti e cestino, alberi della slide, pseudocodice sincronizzato, grafico J(X_k), contatori combinatori con odometro e barra del tempo logaritmica, gare di valutazioni, paesaggio di tutti i sottoinsiemi di taglia m.

**Riferimento.** `m13-sfs-bottom-up`: 10 bande, ogni candidata che si solleva con la sua barra J, la migliore che scende nel vassoio con lucchetto, grafico J contro k, contatore N_SFS, Play/Passo/Indietro, slider m, selettore del criterio, sfida di previsione a ogni passo.

**Widget coperti.**
`m11-caccia-al-sottoinsieme`, `m11-esplosione-combinatoria`, `m12-accuratezza-o-errore-di-bayes`, `m12-compatibilita-e-densita-stimate`, `m12-una-banda-in-piu`, `m12-quante-combinazioni`, `m13-righello-e-mappa`, `m13-esaustiva-gira-tutte-le-carte`, `m13-contatore-che-esplode`, `m13-due-esploratori`, `m13-dieci-coppie-ecg`, `m13-sfs-bottom-up`, `m13-lucchetti-e-cestino`, `m13-albero-sfs`, `m13-sbs-top-down`, `m13-albero-sbs`, `m13-veloci-ma-senza-ritorno`, `m13-stesso-risultato`, `m12-matrice-multiclasse`, `m13-pareggio-matrici`.

```ts
export interface SubsetSearchPreset extends BasePreset<SsLayer, SsPhase, SsCtx, SsState> {
  features: readonly { id: string; label: Rich; en?: string; wavelength?: number }[]
  criterion:
    | { kind: 'table'; J: Readonly<Record<string, number>>; editable?: 'drag' | false; monotone?: boolean }
    | { kind: 'gaussian'; classes: readonly { m: readonly number[]; Sigma: readonly (readonly number[])[]; prior?: ParamSpec | number; label?: Rich }[]; measures: readonly Measure[]
        /** C > 2 classi: misura binaria per ogni coppia, poi media pesata da P_iP_j o caso peggiore (m12-matrice-multiclasse) */
        multiclass?: { combine: 'ave' | 'min' | 'toggle'; normalize?: boolean } }
    | { kind: 'random'; seed: number }                  // tabelle casuali per le statistiche
  m: ParamSpec
  algorithms: readonly ('exhaustive' | 'sfs' | 'sbs')[]
  views: readonly ('tiles' | 'candidateBars' | 'lattice' | 'tree' | 'cards' | 'landscape' | 'jk' | 'pseudocode' | 'odometer' | 'timeBar' | 'race' | 'pascal' | 'classScatter' | 'pairTable' | 'metaScatter' | 'stack' | 'counters'
    | 'matrixLanes'  // corsie SFS e SBS in cui ogni valutazione mostra la matrice k × k del sottoinsieme che cresce o si restringe, costo k³ o k² accumulato
    | 'pairMatrix'   // matrice C × C delle misure a coppie: triangolo calcolato cella per cella e specchiato, pesi P_iP_j impilati, cella minima
  )[]
  cost?: { secondsPerEval: number | ParamSpec; perEval?: 'constant' | 'k2' | 'k3' }
  locks?: boolean                                        // azioni irreversibili visibili e rifiutate
  oracle?: boolean                                       // "Oracolo esaustivo"
  worker?: boolean                                       // paesaggi di C(12, 4) e oltre in un Web Worker
}
export type SsPhase =
  | { kind: 'overview' } | { kind: 'try-candidates' } | { kind: 'pick' } | { kind: 'discard' } | { kind: 'flip-cards' }
  | { kind: 'odometer' } | { kind: 'race' } | { kind: 'enumerate' } | { kind: 'explore' }
```

**Formule vive.** `n`, `m`, `C` (binomiale anche in notazione scientifica), `Nsfs`, `Nsbs`, `J`, `Jbest`, `gap`, `k`, `evals`, `seconds`, `years`, `rho` (Spearman), `sum` (additività), `costSfs`, `costSbs`, `costRatio`, `Dave`, `Dmin`, `pairs` (C(C − 1)/2).

**Sfide**: `predict-next` (la banda del prossimo passo, un punto per previsione), `find` (sottoinsieme migliore a mano in pochi tentativi), `compute` (conteggi), `custom` (costruire un controesempio di subottimalità modificando i J singoli).

**Primitive del kit**: `Bars`, `LinePath`, `Dots`, `PlayControls`, `Segmented`, `Slider`, `LiveFormula`, `Readout`. **Da scrivere**: combinatoria con log-somme, reticolo di Hasse, albero della slide, carte con flip, `SciCounter` a rulli, `Sortable`/`DragBins` per le tessere, pseudocodice con riga evidenziata, `MatrixGrid` per la tabella J.

**Confini.** La vignetta con mappa (n, m) e quiz a tempo (`m13-cantiere-sfs-o-sbs`) resta su misura: la sua spiegazione è la metafora dei due operai. Le corsie di matrici con costo k³ (`m13-pareggio-matrici`) e la matrice multiclasse (`m12-matrice-multiclasse`) sono entrate nel motore con le viste `matrixLanes` e `pairMatrix`: la prima è la stessa gara di `race` con un costo per valutazione che dipende da k, la seconda è il criterio gaussiano con C classi che il motore deve comunque saper calcolare.

---

## 12. Motore `block-flow`

**Scopo.** Schemi a blocchi, flowchart, nastri a stazioni e corsie (m01-m03, m11-m12; architetture di Ricci e grafi di Passerini domani): un gettone attraversa i blocchi e cambia forma e dimensione (immagine → vettore → etichetta), sotto ogni blocco un'anteprima del dato, blocchi cliccabili con pannello di dettaglio, archi di retroazione cliccabili con effetto e costo, oggetti da trascinare su un blocco (sensori, fumetti dell'esperto), due grafi da abbinare, blocchi da riordinare e archi da collegare.

**Riferimento.** `m01-schema-a-blocchi-percorso`: lo schema delle note p. 6 che si disegna, il gettone-pesce che attraversa i blocchi con i contatori della dimensione del dato, Acquisition che si espande nella catena interna, "rimuovi un blocco", gioco di riordino dei 7 blocchi e delle 6 frecce del Supervisor.

**Widget coperti.**
`m01-mappa-corso-pesce`, `m01-catena-acquisizione-pesce`, `m01-schema-a-blocchi-percorso`, `m01-supervisore-feedback`, `m02-pipeline-mondo-fisico-acquisizione`, `m02-supervisore-e-feedback`, `m02-fasi-di-design-flowchart`, `m02-conoscenza-a-priori`, `m02-blocchi-contro-fasi`, `m03-dove-serve-la-stima`, `m03-pipeline-sorgente-uscita`, `m11-filter-wrapper-embedded`, `m12-filtro-wrapper-embedded`.

```ts
export interface BlockFlowPreset extends BasePreset<BfLayer, BfPhase, BfCtx, BfState> {
  layout: 'horizontal' | 'vertical' | 'loop' | 'tape' | 'lanes' | 'free'
  nodes: readonly {
    id: string; label: Rich; en?: string
    kind: 'block' | 'decision' | 'ellipse' | 'start' | 'end' | 'station' | 'supervisor'
    at?: readonly [number, number]                     // layout 'free'
    definition?: Rich
    inner?: readonly string[]                          // catena interna che si espande
    removable?: boolean; droppable?: boolean
  }[]
  edges: readonly { id: string; from: string; to: string; style: 'solid' | 'dashed' | 'feedback'; clickable?: boolean; label?: Rich }[]
  token?: { shape: 'fish' | 'dot' | 'document' | 'particle'; forms: Readonly<Record<string, { label: Rich; size?: number; preview?: PreviewSpec }>> }
  /** anteprime calcolate dal preset con i tipi di anteprima del motore */
  previews?: Readonly<Record<string, PreviewSpec>>
  detail?: Readonly<Record<string, PreviewSpec>>      // pannello polimorfo del blocco cliccato
  params?: readonly ParamSpec[]                       // risoluzione, bit, rumore, N, quantità di email…
  interventions?: { max?: number; items: readonly { edge: string; label: Rich; cost: number; effect: (s: BfState) => Partial<BfState> }[]; orderMatters?: boolean }
  drops?: { items: readonly { id: string; label: Rich }[]; targets: readonly string[]; answer: Readonly<Record<string, string>> }
  second?: { nodes: BlockFlowPreset['nodes']; edges: BlockFlowPreset['edges']; correspondences: readonly (readonly [string, string])[] }
  lanes?: readonly { id: string; label: Rich; nodes: readonly string[]; timer?: (s: BfState) => number }[]
  metrics?: readonly { id: string; label: Rich; value: (s: BfState) => number; chart?: 'stream' | 'bars' | 'learning-curve' }[]
}
export type PreviewSpec =
  | { kind: 'raster'; render: (s: BfState) => ImageSpec } | { kind: 'histogram'; data: (s: BfState) => ClassHist }
  | { kind: 'scatter'; data: (s: BfState) => ClassPoints; axes?: 'pca' } | { kind: 'curve'; data: (s: BfState) => CurveSpec }
  | { kind: 'counter'; value: (s: BfState) => number } | { kind: 'text'; value: Rich }
  | { kind: 'tree'; splits: (s: BfState) => readonly { feature: string; threshold: number }[] }   // albero che cresce split per split (corsia embedded)
  | { kind: 'weights'; values: (s: BfState) => readonly number[]; labels?: readonly string[] }     // pesi che si azzerano con λ (L1)
  | { kind: 'image-steps'; steps: readonly { id: string; label: Rich; render: (s: BfState) => ImageSpec }[] } // banda che si pulisce a passi (pre-processing)
export type BfPhase = { kind: 'overview' } | { kind: 'draw' } | { kind: 'travel'; perNodeMs: number } | { kind: 'expand'; node: string } | { kind: 'loop' } | { kind: 'lanes-run' } | { kind: 'explore' }
```

**Formule vive.** Poche e del preset: `bits` (R²·b), `acc`, `cost`, `rounds`, `evals`, contatori per stadio.

**Sfide**: `reorder` (blocchi nelle caselle) più `connect` (archi), `match` (corrispondenze fra i due grafi, con nodi senza corrispondente), `drop`, `min-cost` (interventi), `predict`, `custom`.

**Primitive del kit**: `Plot` e primitive per le anteprime, `Histogram`, `Dots`, `PlayControls`, `Segmented`, `Toggle`, `Readout`. **Da scrivere**: layout dei grafi (orizzontale, verticale, anello, nastro, corsie) in SVG con frecce e archi tratteggiati animati, gettone che si trasforma, `Sortable`/`DragBins`, tracciamento di un arco fra due nodi da tastiera, pannello di dettaglio polimorfo, grafico a scorrimento.

**Confini.** La pipeline che finisce in un deviatore fisico con voto a fotogrammi, il canale PAM con impulsi e il radargramma sono su misura.

---

## 13. Motore `exam-deck`

**Scopo.** Esercitazione d'orale: carte da smistare in colonne a tempo, scalette di derivazione in cui a ogni gradino si sceglie fra tre tessere-formula (una giusta, due con errori tipici), derivazioni a passi con termini evidenziati e collegati a una figura, riordino di righe, lavagna a slot da riempire con tessere, catene di domande con timer. È il motore che ogni modulo userà per le simulazioni d'orale.

**Riferimento.** `m05-officina-esercizi-ml`: cinque carte-modello, scaletta a 5 gradini con tre tessere per gradino, grafico della log-likelihood con tangente trascinabile, "Verifica numerica" con ricerca a griglia, "cambia parametro" (invarianza), modalità orale da 3 minuti.

**Widget coperti.**
`m02-domini-e-compiti`, `m05-officina-esercizi-ml`, `m05-simulatore-orale-ml`, `m08-carte-knn-o-parzen`, `m12-da-bhattacharyya-a-jm`, `m15-dalla-somma-alla-forma-quadratica`.

```ts
export type Deck =
  | { kind: 'sort'; cards: readonly { id: string; front: Rich; back?: Rich; figure?: FigureSpec }[]; bins: readonly { id: string; label: Rich }[]; answer: Readonly<Record<string, string>>; timerS?: number }
  | { kind: 'ladder'; exercises: readonly { id: string; title: Rich; data?: (rng: Rng) => DataCtx; steps: readonly { prompt: Rich; options: readonly { tex: string; correct: boolean; why: Rich }[] }[]; figure?: FigureSpec; numericCheck?: (d: DataCtx) => { argmax: number; tex: string }; alternative?: { label: Rich; exercise: string } }[] }
  | { kind: 'derivation'; lines: readonly { tex: string; terms?: readonly { id: string; tex: string; link?: string }[] }[]; reorder?: boolean; figure?: FigureSpec; verify?: (s: DataCtx) => readonly { label: Rich; left: number; right: number }[] }
  | { kind: 'board'; questions: readonly { prompt: Rich; slots: readonly { id: string; accepts: readonly string[] }[]; tiles: readonly { id: string; tex?: string; text?: Rich }[]; numeric?: { answer: number; tolerance: number }; confirm?: FigureSpec }[] }
  | { kind: 'grid'; rows: readonly { id: string; label: Rich }[]; cols: readonly { id: string; label: Rich }[]; examples: readonly { id: string; label: Rich; row: string; col: string }[] }

/** Figura dichiarativa disegnata dal motore con le primitive del kit: curve, punti, tangente trascinabile, marcatori. */
export interface FigureSpec {
  x: AxisSpec; y: AxisSpec
  curves?: readonly { f: (x: number, d: DataCtx) => number; role: VizRole; label?: Rich }[]
  points?: (d: DataCtx) => readonly Vec2[]
  tangent?: { f: (x: number, d: DataCtx) => number; draggable: boolean }
  markers?: (d: DataCtx) => readonly { x: number; label: Rich }[]
  links?: Readonly<Record<string, { highlight: 'curve' | 'point' | 'segment'; index?: number }>>
  /** manopole della figura (B da 0 a 10, prior, direzione w): i DataCtx le ricevono in `params` */
  params?: readonly ParamSpec[]
  /** letture e termometri legati ai parametri (JM, ε_u, J(w)) */
  gauges?: readonly { id: string; label: Rich; value: (d: DataCtx) => number; max?: number }[]
  /** pulsanti che animano i parametri verso un caso notevole ("identiche", "scambia", "separa all'infinito") */
  actions?: readonly { id: string; label: Rich; to: Readonly<Record<string, number>>; ms: number }[]
}

export interface ExamDeckPreset extends Omit<BasePreset<'figure', EdPhase, EdCtx, EdState>, 'storyboard'> {
  decks: readonly Deck[]
  picker?: 'cards' | 'tabs' | 'none'
  timer?: { seconds: number; mode: 'oral' | 'countdown' }
  scoring: { perStep: number; firstTry?: boolean }
  storyboard?: readonly EngineStep<EdPhase, EdCtx>[]      // per le derivazioni a passi
}
export type EdPhase = { kind: 'line'; index: number } | { kind: 'reveal' } | { kind: 'explore' }
```

**Formule vive.** I valori dei dati dell'esercizio corrente (`N`, `xbar`, `argmax`, `logL`, tangente `slope`) e quelli che il preset dichiara in `verify`.

**Sfide**: il mazzo stesso è la sfida (`sort`, `ladder` senza errori, `derivation` riordinata, `board`); `Challenge` registra il completamento.

**Primitive del kit**: `Plot`, `LinePath`, `Dots`, `LiveFormula` (KaTeX), `Segmented`, `ActionButton`, `NumberField`, `Challenge`, `StepCaption`. **Da scrivere**: `DragBins`, `Sortable`, carte con flip, tessere-formula con KaTeX come opzioni accessibili (radiogroup), timer a barra, `FigureSpec` → primitive, collegamento termine ↔ elemento della figura.

**Confini.** Le simulazioni d'orale che navigano un grafo concettuale (`m04-simulatore-orale-bonta`) o che si appoggiano a una metafora illustrata sono su misura.

---

## 14. Motore `signal-lab`

**Scopo.** Segnali nel tempo (m01, m03; RNN di Ricci e scenario energia domani): generatori sintetici (somma di sinusoidi, ECG con battiti e aritmia, PAM a livelli, AR(1), parlato sintetico di "Phonetician", temperatura), rumore, campionamento a steli con frequenza e sfasamento, ricostruzione, quantizzazione a b bit con griglia e codici interi, soglia con eventi e rivelatore di picchi, FFT e doppio dominio, confini di segmentazione ordinati trascinabili, istogramma delle ampiezze con mistura teorica, scatter lag-1, sweep automatico degli sfasamenti.

**Riferimento.** `m01-campionamento-ecg`: ECG sintetico di 4 s, f_s in scala log da 5 a 500 Hz, sfasamento φ a 20 posizioni, steli e ricostruzione, rivelatore con battiti mancati cerchiati, "aritmia", zoom del battito con P, QRS, T, sfida della minima f_s robusta su 20 sfasamenti.

**Widget coperti.**
`m01-segnale-porta-informazione`, `m01-tempo-vs-frequenza`, `m01-continuo-o-discreto`, `m01-campionamento-ecg`, `m01-griglia-campiona-quantizza`, `m01-oscillogramma-fonemi`, `m03-pam-rumore-gaussiano`, `m03-ipotesi-iid-alla-prova`.

```ts
export type SignalSpec =
  | { kind: 'sines'; components: readonly { f: ParamSpec | number; a: ParamSpec | number; enabled?: boolean }[]; mystery?: boolean }
  | { kind: 'ecg'; beats: number; hr: number; arrhythmia?: { at: number; rr: number } }
  | { kind: 'pam'; levels: readonly number[]; priors?: readonly number[]; T: number }
  | { kind: 'ar1'; rho: ParamSpec }
  | { kind: 'speech'; word: 'phonetician'; truthBoundaries: readonly number[] }
  | { kind: 'events'; base: (t: number) => number; events: readonly { at: number; shape: 'peak' | 'ramp' }[] }
  | { kind: 'custom'; f: (t: number) => number }

export interface SignalLabPreset extends BasePreset<SigLayer, SigPhase, SigCtx, SigState> {
  signal: SignalSpec
  noise?: ParamSpec
  duration: number
  axis: { t: AxisSpec; y: AxisSpec; semantics?: readonly { id: string; label: Rich; unit: string }[] }  // tempo, frequenza, pressione, posizione
  sampling?: { fs: ParamSpec; phase?: ParamSpec; sweepPhases?: number; delta?: ParamSpec }
  quantization?: { bits: ParamSpec; budget?: number }
  detector?: { threshold: ParamSpec; kind: 'events' | 'peaks' }
  boundaries?: { count: number; minGapMs: number; initial: 'equidistant' | readonly number[] }
  zoom?: { max: number; pan: boolean }
  layers: readonly SigLayer[] // 'continuous' | 'transmitted' | 'stems' | 'reconstruction' | 'grid' | 'levels' | 'codes' | 'threshold' | 'events' | 'peaks' | 'noiseArrows' | 'boundaries' | 'undefinedBands'
  panels?: readonly ('spectrum' | 'amplitude-hist' | 'lag-scatter' | 'twin' | 'phase-sweep' | 'feature-scatter' | 'bits-budget')[]
  sort?: CommonChallenge<SigState> & { kind: 'sort' }        // chip continuo/discreto sotto il grafico
}
export type SigPhase =
  | { kind: 'overview' } | { kind: 'trace' } | { kind: 'stems' } | { kind: 'snap-to-levels' } | { kind: 'codes' }
  | { kind: 'events' } | { kind: 'sweep-phase' } | { kind: 'zoom-beat'; beat: number } | { kind: 'toggle-discrete' } | { kind: 'explore' }
```

**Formule vive.** `fs`, `T`, `phi`, `b`, `L` (livelli), `delta`, `q` (passo di quantizzazione), `detected`, `missed`, `bits`, `sigmaN`, `rho`, `Neff`, `rhoM`, `f1`…`f3`, `a1`…`a3`, `peakF`, `energy`, `zcr`, `score` (scarto in ms).

**Sfide**: `find` (minima f_s robusta su tutti gli sfasamenti; minimo di bit entro il budget), `segment-score` (scarto medio dei confini), `predict` (frequenza misteriosa), `sort`, `custom`.

**Primitive del kit**: `LinePath`, `Dots`, `Bars`, `Histogram`, `Grid`, `Plot` con cursore, `Slider` su indici log, `PlayControls`, `LiveFormula`, `Readout`. **Da scrivere**: generatori, FFT reale (radix-2) nel motore, `Stem`, rivelatore di picchi, confini ordinati trascinabili con distanza minima, zoom e pan orizzontale, `Threshold`, canvas per tracce lunghe.

**Confini.** Le tre corsie eterogenee (PAM, sonar, GPR), la diagnosi ECG con feature e probabilità, la separazione ICA e la fusione con pesi sul simplesso sono su misura.

---

## 15. Motore `raster-lab`

**Scopo.** Immagini sintetiche e multibanda su canvas (m01-m02, m15-m16; CNN, detection, segmentazione e diffusione di Ricci domani): scene generate a seed (aerea multispettrale, nastro con pesci, strada, radiografia, polmoni, satellite a classi), mirino sul pixel con valori per banda, quantizzazione e pre-elaborazione, soglia e componenti connesse con bounding box e tabella delle misure, griglia di tessere multilabel con barre e soglia τ, scansione riga per riga di una mappa classificata con pixel che volano nel piano delle feature, maschere e mappe di calore sovrapposte con opacità, rilevamenti con confidenza e curve FA/MA, poligoni di training editabili, pennello, lente.

**Riferimento.** `m16-box-classifica-mappa`: piano rosso-NIR con tre box, immagine 80×80 scandita riga per riga, pixel fuori dai box in nero, clic su un pixel che illumina il suo punto nel piano, slider α, interruttore Box/MDM, sfida su α.

**Widget coperti.**
`m01-bande-correlate`, `m01-quantizzazione-bit`, `m01-binario-multiclasse-mappa`, `m01-multilabel-tessere-uav`, `m01-acquisizione-preprocessing`, `m02-nastro-del-pesce`, `m02-uav-tile-multilabel`, `m02-rileva-e-conta`, `m02-etichetta-immagine-o-pixel`, `m02-covid-dove-guarda-il-modello`, `m15-bande-pca-lda-dal-satellite`, `m16-dai-campioni-al-modello`, `m16-box-classifica-mappa`.

```ts
export interface SceneSpec {
  kind: 'aerial' | 'multispectral' | 'conveyor-fish' | 'street' | 'xray' | 'lungs' | 'satellite-classes' | 'medical-volume-slice'
  w: number; h: number; bands: readonly { id: string; label: Rich; en: string }[]
  classes: readonly { cls: number; label: Rich; en: string }[]
  seed: number
  /** parametri della scena (illuminazione, sporco, correlazione fra bande, sovrapposizione dei pesci) */
  params?: readonly ParamSpec[]
}

export interface RasterLabPreset extends BasePreset<RlLayer, RlPhase, RlCtx, RlState> {
  scene: SceneSpec | { kind: 'gallery'; items: readonly SceneSpec[] }            // griglia 2×2 di radiografie
  views: readonly ('image' | 'bands' | 'map' | 'mask' | 'tiles' | 'overlay' | 'featurePlane' | 'classHists' | 'lens' | 'components')[]
  display?: { composite: 'rgb' | 'false-color' | 'band'; band?: string }
  ops?: readonly ('quantize' | 'illumination' | 'dirt' | 'denoise' | 'equalize' | 'threshold' | 'connected' | 'measure' | 'brush' | 'polygons')[]
  bits?: ParamSpec; threshold?: ParamSpec; tile?: ParamSpec; brush?: ParamSpec
  classifier?: { kind: 'box' | 'mdm' | 'gauss' | 'scores'; params?: readonly ParamSpec[]; toggle?: readonly ('box' | 'mdm')[] }   // riusa la logica di classifier2d
  multilabel?: { tau: ParamSpec; forceMulticlass?: boolean }
  detections?: { count: readonly [number, number]; tau: ParamSpec; curves: boolean; sweep: boolean }
  granularity?: readonly ('image' | 'tile' | 'pixel')[]
  pixelLink?: boolean
  components?: { pca?: { k: ParamSpec }; lda?: boolean }                           // bande PCA/LDA come strisce
}
export type RlPhase = { kind: 'overview' } | { kind: 'scan'; msPerRow: number } | { kind: 'fly' } | { kind: 'acquire' } | { kind: 'apply-ops' } | { kind: 'reveal' } | { kind: 'stagger-bands' } | { kind: 'explore' }
```

**Formule vive.** `b`, `levels`, `bitsTotal`, `err`, `pix` (valore del pixel), `r`, `g`, `nir`, `rho`, `pctClassified`, `pctRejected`, `counts`, `tau`, `fa`, `ma`, `found`, `truth`, `k`, `varPct`, `acc`.

**Sfide**: `find` (α, τ, b ottimi con criterio calcolato), `predict`, `custom` (lesione visibile con il minimo di bit; comporre la maschera).

**Primitive del kit**: `FieldCanvas`, `CanvasLayer`, `BoundaryCanvas`, `Dots`, `Histogram`, `Bars`, `Segmented`, `Slider`, `PlayControls`, `Readout`. **Da scrivere**: generatori di scene a seed (nessun file immagine), operazioni pixel (quantizzazione, equalizzazione, filtri 3×3, soglia, componenti connesse a due passate), `Flight` pixel → piano, griglia di tessere, pennello, poligoni con vertici trascinabili, lente trascinabile.

**Confini.** Autocifre e macchina y = Φᵗx (m14), il testo che diventa immagine per denoising, le tracce nell'atrio e il georadar restano su misura.

---

## 16. Motore `dimension-lab`

**Scopo.** Ciò che succede quando la dimensione n cresce (m08, m11): forme disegnabili fino a n = 3 (segmento, quadrato, cubo; cerchio e sfera inscritti; finestre ipercubiche; vicinati K-NN), oltre torri logaritmiche e proiezioni su due coordinate; Monte Carlo nell'ipercubo con contatori e intervalli di confidenza; istogrammi delle distanze che si concentrano con la curva χ teorica; volumi C_n r^n con tessere della formula e barratura animata di r^n; lato equivalente della cella; conteggi di parametri di Σ piena, diagonale, identità.

**Riferimento.** `m11-freccette-negli-angoli`: freccette lanciate nel quadrato (blu dentro il cerchio, arancio negli angoli), barra f_n che converge, "n + 1" che costruisce il grafico a barre barra per barra, proiezione per n ≥ 4, badge "99.75% negli angoli", sfida "da quale n meno di una su 100".

**Widget coperti.**
`m07-costo-e-interpretabilita`, `m08-volume-cella-ipersferica`, `m08-knn-e-dimensionalita`, `m08-parzen-ipercubo`, `m11-costo-della-complessita`, `m11-griglia-esplosiva`, `m11-sfera-nel-cubo`, `m11-freccette-negli-angoli`, `m11-code-e-angoli`, `m11-vicinato-enorme`.

```ts
export interface DimensionLabPreset extends BasePreset<DlLayer, DlPhase, DlCtx, DlState> {
  n: ParamSpec
  geometry: 'grid-points' | 'sphere-in-cube' | 'hypercube-window' | 'knn-neighborhood' | 'none'
  // 'grid-points' serve anche come griglia di integrazione G^d della stima bayesiana (m07-costo-e-interpretabilita): Δ = 1/G, n = d
  /** corsie con contatori di operazioni a confronto (ML: N·d; Bayes su griglia: N·G^d; Bayes coniugato: N·d) */
  lanes?: readonly { id: string; label: Rich; ops: (s: DlState) => number; formula: string }[]
  views: readonly ('shape' | 'logTower' | 'barsVsN' | 'darts' | 'distanceHist' | 'sideVsN' | 'counters' | 'costCards' | 'loglog' | 'formulaTiles' | 'windowCount')[]
  params?: readonly ParamSpec[]                 // r, Δ, k, N, h, velocità di lancio, megapixel
  covariance?: { models: readonly ('full' | 'diagonal' | 'identity')[]; classes: number; budget?: number }
  distribution?: readonly ('gauss' | 'uniform')[]
  exactToggle?: boolean
}
export type DlPhase = { kind: 'overview' } | { kind: 'extrude'; to: 1 | 2 | 3 } | { kind: 'build-bar' } | { kind: 'throw'; perFrame: number } | { kind: 'cancel-r' } | { kind: 'explore' }
```

**Formule vive.** `n`, `r`, `Cn`, `Vs`, `Vc`, `fn`, `fnMC`, `ci`, `inside`, `thrown`, `ell` (lato equivalente), `ratio` (vicino/lontano), `points` (Δ^{-n}), `params`, `mults`, `k`, `N`, `h`, `K`, `G`, `opsML`, `opsBayes`.

La scheda "Interpretabilità" di `m07-costo-e-interpretabilita` (numero per banda contro densità sul parametro, scelta dello studente) è una scheda di `tabs` con una sfida `predict` a opzioni: nessun terreno nuovo.

**Sfide**: `compute` (n massimo entro un budget di moltiplicazioni; da quale n meno dell'1%), `predict`, `find`, `custom`.

**Primitive del kit**: `Bars`, `Histogram`, `LinePath`, `Dots`, `CanvasLayer`, `Slider`, `Toggle`, `LiveFormula`, `Readout`. **Da scrivere**: disegno assonometrico di cubo e sfera (con la proiezione di `scene3d`), `MonteCarloRunner` per le freccette con intervallo di confidenza, densità χ e volume dell'ipersfera con Γ (`hypersphereVolume` esiste in `nonparam.ts`), `SciCounter`, tessere della formula con barratura.

**Confini.** La scala 1D→4D del volume medico e la crescita 1D→3D con errore di Bayes sono su misura.

---

## 17. Motore `fit-sweep`

**Scopo.** Adattare un modello al variare di un iperparametro e leggere le curve che ne escono (m01-m02, m04, m11, m14; regressione, curve di apprendimento e regolarizzazione di Ricci domani): anteprima del modello corrente (regressione con banda, curve campione di un processo gaussiano, fascio di rette ripetute, spettro con bande accese, mini-scatter con ellissi stimate contro vere, griglia di pixel accesi), curve train/test/validazione o bias²/varianza/MSE costruite punto per punto, famiglie di curve per N diversi con il luogo dei picchi, asintoto N = ∞, 50 repliche in trasparenza, scomposizione dell'errore a barre impilate, cruscotti multi-obiettivo.

**Riferimento.** `m11-curva-di-hughes`: "Aggiungi banda" o Play che accende una banda, ristima il classificatore (mini-scatter con ellissi) e aggiunge un punto alla curva accuratezza contro n; selettore N per classe; "Nuovo training set"; curva N = ∞; scomposizione; media su 50 training set; sfida di previsione del picco.

**Widget coperti.**
`m01-regressione-saccarosio`, `m02-spettro-concentrazione`, `m02-scala-l-regressione`, `m04-sotto-il-pavimento`, `m11-curva-di-hughes`, `m11-famiglia-di-curve`, `m11-overfitting-train-test`, `m11-tre-obiettivi`, `m14-meno-dimensioni`.

```ts
export type FitTask =
  | { kind: 'regression-1d'; data: DataSpec1d; model: 'line' | 'poly' | 'ridge-origin' | 'gp'; clickToAdd?: boolean }
  | { kind: 'feature-regression'; spectra: SpectraSpec; bands: 'best' | 'first' }          // spettro → concentrazione
  | { kind: 'gaussian-classifier'; bands: number; classes: readonly ClassSpecNd[]; perClass: ParamSpec }
  | { kind: 'pixel-classifier'; digits: readonly number[]; order: 'variance' | 'random' | 'toggle' }
  | { kind: 'pca-classifier'; components: number }

export interface FitSweepPreset extends BasePreset<FsLayer, FsPhase, FsCtx, FsState> {
  task: FitTask
  hyper: ParamSpec & { id: 'degree' | 'lambda' | 'l' | 'n' | 'd' | 'm' }
  preview: readonly ('scatter-fit' | 'band' | 'gp-samples' | 'fan' | 'spectrum' | 'mini-scatter' | 'pixel-grid' | 'cursor-feature')[]
  curves: readonly ('train' | 'test' | 'validation' | 'bias2' | 'var' | 'mse' | 'bound' | 'asymptote' | 'family' | 'peaks' | 'gap')[]
  build: 'point-by-point' | 'instant'
  repetitions?: { count: number }
  family?: { Ns: readonly number[]; interpolate: boolean }
  decomposition?: boolean
  objectives?: readonly { id: string; label: Rich; value: (s: FsState) => number; weight: ParamSpec }[]   // tre obiettivi con gauge
  counters?: readonly ('params' | 'samples' | 'traffic-light')[]
}
export type FsPhase = { kind: 'overview' } | { kind: 'add-step'; ms: number } | { kind: 'sweep' } | { kind: 'asymptote' } | { kind: 'repeat' } | { kind: 'reveal-peak' } | { kind: 'explore' }
```

**Formule vive.** `hyper`, `acc`, `accPeak`, `nPeak`, `errTrain`, `errTest`, `gap`, `rmse`, `bias2`, `var`, `mse`, `bound`, `slope`, `N`, `params`, `ratio` (N/parametri), `score` (tre obiettivi).

**Sfide**: `predict` (dove sarà il picco prima di Play), `find` (λ, l, d ottimi), `compute`, `custom`.

**Primitive del kit**: `Dots`, `LinePath`, `AreaPath`, `Bars`, `Grid`, `PlayControls`, `Segmented`, `Slider`, `LiveFormula`, `Readout`. **Da scrivere**: minimi quadrati e ridge, polinomi, GP con campioni dal posterior, classificatore gaussiano n-dimensionale con covarianza comune (e suo fallimento quando n ≥ 2N − 1), `ParamChart` costruito punto per punto con famiglie, `Ribbon`, `MonteCarloRunner`, `Gauge`.

**Confini.** La regressione con parametri nel piano (ombra contro fetta, `m04-diagonale-dell-inversa`) e la batimetria con finestra mobile sono su misura.

---

## 18. Motore `scene3d`

**Scopo.** Una scena 3D ruotabile senza dipendenze (proiezione propria, algoritmo del pittore su canvas, SVG per poche decine di segni): superfici a rete di densità e discriminanti (anche più d'una, con il pavimento colorato per argmax), superficie costruita per scansione, piani di taglio trascinabili con curva d'intersezione che si stacca e cade in un pannello 2D, nuvole 3D con ombre ellittiche sulle pareti, blocchi di altezza 1/V, ellissoidi, frecce trascinabili (colonne di W), traiettorie sulla superficie (EM su Q), e il **cubo dell'esempio del corso** con vertici etichettati e pannelli 2D e 1D collegati.

**Riferimento.** `m06-affetta-la-campana`: campana che si alza, piano orizzontale alla quota z (slider log), curva d'intersezione illuminata, "Stacca" che la porta nel pannello 2D come ellisse, preset delle quote della slide, rotazione con trascinamento, slider σ1, σ2, ρ, "Sovrapponi", frazione di campioni dentro l'ellisse.

**Widget coperti.**
`m03-superfici-densita-2d`, `m05-campana-bivariata-3d`, `m06-volume-unitario`, `m06-affetta-la-campana`, `m06-nuvola-3d-proiezioni`, `m08-superficie-knn-2d`, `m10-superficie-mistura-e-theta`, `m10-salita-monotona-q`, `m14-cubo-baricentro-covarianza`, `m14-cubo-proiezione-2d`, `m15-tre-classi-una-retta-non-basta`, `m15-volume-del-determinante`, `m15-cubo-del-corso-pca-e-lda`, `m16-mdm-discriminanti-lineari`, `m16-box-pdf-uniforme-3d`.

```ts
export type SceneObject =
  | { kind: 'surface'; f: (x: number, y: number, s: S3State) => number; grid: number; colorBy?: 'height' | 'component' | 'argmax'; wire?: boolean }
  | { kind: 'surfaces'; fs: readonly { f: (x: number, y: number, s: S3State) => number; cls: number }[]; floor: 'argmax' | 'none'; mode?: 'paraboloids' | 'planes' | 'toggle' }
  | { kind: 'points3d'; points: (s: S3State) => readonly { p: Vec3; cls?: number }[] }
  | { kind: 'floorPoints'; points: (s: S3State) => readonly Vec2[]; editable?: 'click' | 'drag' }
  | { kind: 'cut'; axis: 'z' | 'x' | 'y'; value: ParamSpec; detachTo?: 'plane2d' }
  | { kind: 'blocks'; boxes: (s: S3State) => readonly { min: Vec2; max: Vec2; height: number; cls: number }[] }
  | { kind: 'ellipsoid'; m: Vec3; Sigma: (s: S3State) => Mat3 }
  | { kind: 'wallShadows' }
  | { kind: 'arrows'; vectors: (s: S3State) => readonly Vec3[]; draggable?: boolean }
  | { kind: 'cube-example'; vertices: readonly { p: Vec3; cls: number; label: string }[] }
  | { kind: 'trajectory'; step: (s: S3State) => Vec2; onSurface: number }   // indice della superficie

export interface Scene3dPreset extends BasePreset<S3Layer, S3Phase, S3Ctx, S3State> {
  box: { x: AxisSpec; y: AxisSpec; z: AxisSpec }
  camera: { azimuth: number; elevation: number; draggable: boolean; elevationRange?: readonly [number, number] }
  objects: readonly SceneObject[]
  linked?: readonly ({ kind: 'plane2d'; mapping: 'cut' | 'projection' | 'lda' } | { kind: 'axis1d' } | { kind: 'matrix'; value: (s: S3State) => MatrixValue } | { kind: 'curve'; value: (s: S3State) => CurveSpec })[]
  params?: readonly ParamSpec[]
  topView?: { heatmap: boolean; contours: boolean }
  probe?: { floorClick: boolean; readouts: readonly string[] }
  volumeCounter?: boolean
}
export type S3Phase =
  | { kind: 'overview' } | { kind: 'rise' } | { kind: 'build-scan' } | { kind: 'cut'; z: number } | { kind: 'detach' }
  | { kind: 'rain'; n: number } | { kind: 'fly-to-plane' } | { kind: 'project'; to: 1 | 2 } | { kind: 'em-step' }
  | { kind: 'steps'; step: number } | { kind: 'fill-volume' } | { kind: 'explore' }
```

**Formule vive.** `z`, `peak`, `volume`, `det`, `r2`, `frac`, `sigma1`, `sigma2`, `rho`, `az`, `el`, `x`, `y`, `pdf`, `g1`…`g4`, `alpha`, `V`, `J` (rapporto dei determinanti), `k` (iterazione), `m`, frazioni esatte del cubo (`s11`…`s33`).

**Sfide**: `find` (quota che contiene metà dei pesci), `predict` (caso a sorpresa dalle ombre), `compute` (coordinate proiettate del cubo), `custom`.

**Primitive del kit**: `CanvasLayer`, `FieldCanvas`, `Contours`, `Dots`, `Slider`, `LiveFormula`, `Readout`. **Da scrivere**: camera ortografica e prospettica con trascinamento e tastiera (frecce = azimut ed elevazione), maglia con algoritmo del pittore, intersezione piano-superficie (marching squares sul taglio), ombre sulle pareti, `Flight` 3D → 2D, `MatrixGrid` con frazioni, `Knob`.

**Confini.** La cubica con autospazio doppio a disco (`m14-cubo-autovalori`) e il confronto a pari varianza nell'autospazio (`m14-cubo-una-feature`) restano su misura; la scala 1D→4D del volume medico pure.

---

## 19. Motore `density2d`

**Scopo.** La stima di densità non parametrica nel piano, senza classi (m08, m10; m09 per le varianti 2D oggi costruite su misura; mean-shift e clustering per densità di Passerini domani): campioni 2D (pesci in luminosità × larghezza, pixel in rosso × NIR), un punto sonda x* trascinabile, la **cella** che parte da x* e si espande fino al K-esimo vicino (cerchio, quadrato o rombo) oppure la **finestra** di volume fissato che conta i campioni, il lucchetto su K o su V e il numero che pulsa, la formula K/(N·V) con i numeri; la mappa di calore di p̂ su una griglia, i kernel per campione con σ globale o σ_k adattivo dagli L vicini, la normalizzazione delle feature animata, la griglia di small multiples della slide 46 (N = 1, 4, 9, 16, 100) e i fasci di ripetizioni.

È un motore a parte e non una modalità di `classifier2d` perché il suo terreno non ha classi, regioni né frontiere: la domanda è "quanto vale la densità qui", e i gesti che la raccontano (cella che si espande, lucchetto che passa da K a V, velo "prima di vedere i dati", σ_k che si ridimensiona sui suoi L vicini) non esistono nel motore dei classificatori. La logica pura esiste già nei widget costruiti di m09 (`m09-parzen-windows/griglia-normale-2d.ts`, `sigma-adattiva.ts`): il costruttore la sposta qui e quei widget la importano dal motore, senza cambiare aspetto.

**Riferimento.** `m08-chi-fissa-cosa`: 80 pesci fitti al centro e radi ai bordi, x* trascinabile, toggle "K fisso" / "V fisso" con lucchetto sul parametro fissato e impulso su quello calcolato, cerchio che si adatta in tempo reale, K = 0 che lampeggia ai bordi, tabella comparativa che si compila, due mappe di calore affiancate.

**Widget coperti.**
`m08-chi-fissa-cosa`, `m08-griglia-parzen-vs-knn`, `m08-ipotesi-knn`, `m10-sigma-kernel-e-normalizzazione`, `m10-sigma-adattivo`.

```ts
export type CellShape = 'circle' | 'square' | 'rhombus'      // ipersfera, ipercubo, rombo (norme L2, L∞, L1)

export interface Density2dPreset extends BasePreset<D2Layer, D2Phase, D2Ctx, D2State> {
  data: {
    points?: readonly Vec2[]
    generator?: (rng: Rng, n: number) => Vec2[]
    truth?: (x: Vec2) => number                               // densità vera, per errori e "mostra il valore vero"
    n: ParamSpec                                              // anche sui quadrati perfetti (1, 4, 9, … 2500)
    editable?: 'none' | 'click-add' | 'drag' | 'both'
    axes: readonly [AxisSpec, AxisSpec]
    /** unità originali (lunghezza in mm contro luminosità 0-10): il terreno usa la stessa scala in pixel per unità */
    units?: { standardize: 'toggle' | boolean }
  }
  /** chi è fissato: K (K-NN), V (Parzen a finestra), entrambi in pannelli gemelli, o lo decide l'utente */
  mode: 'k-fixed' | 'v-fixed' | 'toggle' | 'twin'
  k?: ParamSpec; radius?: ParamSpec
  /** leggi legate a N: V = 1/√N (sull'area o sul raggio come nella slide), K = √N */
  laws?: { v?: 'inv-sqrt-area' | 'inv-sqrt-radius'; k?: 'sqrt' }
  shapes?: readonly CellShape[]
  /** "Conferma ipotesi": K e forma si scelgono con i dati velati, poi si chiude il lucchetto */
  priorChoice?: boolean
  kernel?: { kind: 'gauss' | 'box'; sigma: ParamSpec; adaptive?: { L: ParamSpec } }
  /** zone con errore separato (densa e rada) */
  zones?: readonly { id: string; label: Rich; contains: (x: Vec2) => boolean }[]
  /** griglia di small multiples su N (colonne) e metodi (righe), come la slide 46 */
  multiples?: { Ns: readonly number[]; rows: readonly ('v-fixed' | 'k-fixed')[] }
  repetitions?: { count: number }                             // tracce di 20 ripetizioni nel grafico di convergenza
  heatmap?: { grid: number; twin?: boolean }                  // griglia di calcolo (80 × 80) e mappe affiancate K/V
  comparisonTable?: boolean                                   // tabella K fisso / V fisso che si compila per posizione
  layers: readonly D2Layer[] // 'points' | 'probe' | 'cell' | 'neighbors' | 'window' | 'kernels' | 'heatmap' | 'distances' | 'veil' | 'lock' | 'truth' | 'convergence'
}
export type D2Phase =
  | { kind: 'overview' } | { kind: 'drop'; perPointMs: number } | { kind: 'expand-cell' } | { kind: 'count-window' }
  | { kind: 'lift-veil' } | { kind: 'normalize' } | { kind: 'adapt-sigma'; sample?: number } | { kind: 'fill-multiples' }
  | { kind: 'heatmap' } | { kind: 'explore' }
```

**Strati e interazioni.** Sonda trascinabile (tastiera: frecce); cella che cresce a velocità costante e si ferma al K-esimo vicino, vicini numerati 1…K; finestra rigida di raggio fissato con i campioni interni che si accendono uno a uno; lucchetto sul parametro fissato e impulso su quello calcolato; K = 0 che lampeggia; cerchi di raggio σ o σ_k su ogni campione; segmenti verso i 5 (o L) vicini con distanza e contributo; mappa di calore su `FieldCanvas` ricalcolata a fine gesto; velo grigio prima della conferma delle ipotesi; griglia 2 × 5 di small multiples; grafico di convergenza con due fasci di tracce e linea del vero; morph degli assi verso le coordinate standardizzate.

**Storyboard.** `drop` (i pesci arrivano uno alla volta sul nastro), `expand-cell`, `count-window`, `lift-veil`, `normalize` (1 s, poi la mappa si ricalcola), `adapt-sigma` (i vicini di un campione pulsano, i segmenti si disegnano, il cerchio si ridimensiona), `fill-multiples` (colonna per colonna), `heatmap`.

**Formule vive.** `x1`, `x2` (sonda), `K`, `N`, `V`, `r`, `p` (stima K/(N·V)), `ptrue`, `sigma`, `sigmaK` con `dk1`…`dkL` (distanze dei vicini del campione cliccato), `L`, `errDense`, `errSparse`, `ise`, `shapeV` (π r², (2r)², 2r²).

**Sfide**: `find` (σ o L con errore minimo in entrambe le zone; σ minimo con e senza normalizzazione), `predict` (K e V della colonna N = 64 prima di muovere lo slider; il K-esimo vicino), `custom` (un x* in cui V fisso dà 0 e K fisso no; un x* in cui cerchio e quadrato scelgono vicini diversi; il raggio per cui le due stime coincidono).

**Primitive del kit**: `Plot`, `Dots` trascinabili, `FieldCanvas`, `Contours`, `Arrow`, `Slider`, `Segmented`, `Toggle`, `PlayControls`, `LiveFormula`, `Readout`, `Challenge`. **Da scrivere**: stimatori K-NN e Parzen 2D con le tre norme (quelli di `nonparam.ts` più rombo e quadrato), σ_k adattivo (da `sigma-adattiva.ts`), cella che si espande con `useAnimationFrame`, lucchetto e impulso, `LinkedPanels` per le small multiples, `MonteCarloRunner` per le ripetizioni.

**Confini.** La cella in n = 1, 2, 3 con il volume h^n (`m08-parzen-ipercubo`) è di `dimension-lab`; la superficie K-NN in 3D (`m08-superficie-knn-2d`) di `scene3d`, che importa gli stimatori da qui; il voto dei K vicini che diventa classificatore (`m08-dal-knn-stimatore-al-classificatore`) di `classifier2d`; la regione R in 1D, 2D e 3D (`m08-regione-r-e-probabilita`) resta su misura.

---

## 20. Motore `spectrum-nd`

**Scopo.** Matrici n × n e il loro spettro, quando il piano non basta più (m06, m11, m14-m15; matrici di Gram di Passerini e di attenzione di Ricci domani): la heatmap di Σ, S_W o della matrice di scatter con la simmetria che scorre sulla diagonale e lo sweep del triangolo superiore che conta i parametri; la "pioggia" di N campioni sulle celle; gli autovalori come barre ordinate (con scambi animati), in scala lineare o logaritmica, con cumulata, soglia del 95%, rango, condizionamento e barre grigie a zero quando la matrice è singolare; gli autovettori come **profili** (curva lungo le bande o immagine 8 × 8) e la mappa di UᵗU; la ricostruzione di un profilo con le prime m componenti, la fascia del residuo e l'errore J_m come somma degli autovalori scartati.

È un motore a parte perché il suo terreno è la matrice e lo spettro, non la nuvola: `covariance` resta nel piano (e fino a n = 3 con gli scatter a coppie), qui n va da 3 a 200.

**Riferimento.** `m14-segnale-e-rumore`: 120 bande, 500 spettri sintetici da 3 materiali più rumore, autovalori ordinati in scala log con 3 barre alte e 117 di pavimento, slider m che colora le tenute e scurisce le scartate, J_m e cumulata con il ginocchio, spettro di un pixel ricostruito con la fascia del residuo, slider del rumore che alza la coda, clic su un pixel della mini-immagine.

**Widget coperti.**
`m06-spettro-autovalori-nd`, `m11-sigma-affamata`, `m14-segnale-e-rumore`, `m14-autocifre-karhunen-loeve`, `m15-quando-sw-non-si-inverte`.

```ts
export type SpectrumSource =
  | { kind: 'toeplitz'; n: ParamSpec; rho: ParamSpec }                                   // Σ_ij = ρ^|i−j| (bande adiacenti correlate)
  | { kind: 'samples'; n: ParamSpec; N: ParamSpec; generator: (rng: Rng, n: number, N: number) => number[][]; noise?: ParamSpec }
  | { kind: 'scatter-within'; n: ParamSpec; N: ParamSpec; classes: number; regularize?: number } // S_W con rango ≤ N − C
  | { kind: 'images'; w: number; h: number; items: (rng: Rng) => number[][]; labels?: readonly number[]; alt?: { label: Rich; items: (rng: Rng) => number[][] } } // cifre 8 × 8, patch satellitari

export interface SpectrumNdPreset extends BasePreset<SpLayer, SpPhase, SpCtx, SpState> {
  source: SpectrumSource
  matrix?: { show: 'cov' | 'scatter' | 'sw'; triangleSweep?: boolean; rain?: boolean; symmetryFlash?: boolean; mirrorHover?: boolean }
  spectrum?: { log: 'toggle' | boolean; cumulative?: boolean; threshold?: number; sortAnimation?: boolean; rankBadge?: boolean; condition?: boolean }
  /** autovettori come profili: curva lungo le bande o immagine w × h a colormap divergente; galleria delle prime k */
  profiles?: { as: 'curve' | 'image'; gallery?: number; orthogonality?: boolean }
  /** ricostruzione progressiva di un elemento (pixel, cifra) con le prime m componenti: coefficienti y_k a barre, profili che volano nella somma */
  reconstruct?: { m: ParamSpec; pick: 'click-thumbnail' | 'selector'; residualBand: boolean; errorChart?: 'Jm-vs-m' }
  /** riduzione a m variabili: la heatmap si restringe e il rapporto campioni/parametri sale */
  reduce?: { m: ParamSpec }
  counters?: readonly ('params' | 'samplesPerParam' | 'rank' | 'varKept' | 'Jm')[]
  /** riquadro nel piano per n = 2 (4 pixel trascinabili, ellisse degenere di S_W; ellissi bootstrap e frontiere di "Stima 5 volte"): usa la logica pura di covariance */
  inset2d?: { kind: 'points-editable' | 'bootstrap'; repeats?: number }
  thumbnail?: { w: number; h: number }                   // mini-immagine da cui si sceglie il pixel
}
export type SpPhase =
  | { kind: 'overview' } | { kind: 'sweep-triangle' } | { kind: 'rain'; n: number } | { kind: 'decompose' } | { kind: 'sort' }
  | { kind: 'orthogonality' } | { kind: 'add-component'; ms: number } | { kind: 'shrink'; to: number } | { kind: 'collapse' } | { kind: 'explore' }
```

**Strati e interazioni.** Heatmap su `FieldCanvas` con hover di cella e della sua simmetrica; barre degli autovalori con tenute (colore) e scartate (scure), barre grigie a zero; cumulata con la linea del 95% e il ginocchio; galleria di autovettori cliccabili (prodotto scalare fra due scelti); profilo originale, ricostruito e fascia del residuo; coefficienti y_k a barre con segno che volano nella ricostruzione; contatore dei parametri con sweep; badge "non singolare" / "S_W singolare" (con `insights`); formula barrata quando l'inversa non esiste; slider n, N, m, ρ, rumore; interruttore cifre / patch.

**Storyboard.** `sweep-triangle` (1.5 s, contatore fino a n(n+1)/2), `rain` (i campioni cadono sulle celle), `decompose` (le barre compaiono in ordine sparso), `sort` (scambi animati fino all'ordine decrescente), `orthogonality` (UᵗU si riempie cella per cella), `add-component` (una componente al secondo nella ricostruzione), `shrink` (la matrice si restringe a m), `collapse` (gli autovalori piccoli precipitano quando N scende).

**Formule vive.** `n`, `N`, `m`, `params` (n + n(n+1)/2), `perParam` (N diviso per i parametri), `l1`…`l8` e `lk` (autovalore cliccato), `varKept`, `Jm`, `rank`, `rankMax` (N − C), `cond`, `rho`, `sigmaNoise`, `yk` (coefficiente cliccato), `dot` (prodotto scalare di due autovettori).

**Sfide**: `find` (m minima per il 95% della varianza; N minimo per classe che rende S_W invertibile), `predict` (se la m del 95% cresce alzando il rumore; la m del 90% sulle cifre), `compute` (campioni per avere 10 campioni per elemento di Σ), `custom`.

**Primitive del kit**: `FieldCanvas`, `Bars`, `LinePath`, `AreaPath`, `Dots`, `Slider` su indici log, `PlayControls`, `LiveFormula`, `Readout`, `Challenge`. **Da scrivere**: Jacobi simmetrico n × n in `engines/shared/math/linalg.ts` (fino a n = 200: al clic o a lotti, mai a ogni render; oltre 50 ms in un Web Worker), `MatrixGrid` in versione canvas per n grandi, generatori di spettri e di cifre 8 × 8 a seed, `Flight` delle componenti verso la ricostruzione.

**Confini.** Le matrici 2 × 2 e 3 × 3 con i loro numeri esatti restano a `covariance`; il poligono chiuso dei vettori pesati e lo spettro di S_W⁻¹S_B al variare delle classi (`m15-rango-c-meno-uno`) restano su misura, ma importano da qui barre e Jacobi; le bande PCA/LDA come immagini (`m15-bande-pca-lda-dal-satellite`) sono di `raster-lab`.

---

## Widget su misura (68)

Scritti a mano sul kit e su `engines/shared/`, come `m03-campioni-che-rivelano-la-pdf` e `m08-cella-che-si-espande`. Riusano liberamente la logica pura dei motori (importando da `engines/<nome>/index.ts`), ma non il loro componente.

| Widget | Perché non va su un motore |
|---|---|
| `m01-scala-delle-dimensioni` | estrusione 1D→2D→3D→4D di un volume medico con pila di fette, cubo con piani di taglio e caccia alla lesione: meccanica unica |
| `m01-regole-vs-apprendimento-spam` | email che scorrono e aggiornano pesi contro regole manuali sotto drift: unico widget di apprendimento online |
| `m01-training-set-pesce` | nastro, tabella che cresce sincronizzata con il piano, cestino e budget: la tabella è la spiegazione |
| `m01-rl-agente-ambiente` | Q-learning su gridworld: unico oggi; diventerà il riferimento del motore gridworld di Passerini (p14) |
| `m01-spettro-della-supervisione` | stesso scatter in cinque modalità di supervisione più quiz di carte: mescola quattro motori |
| `m01-captioning-parcheggio` | scena con auto trascinabili e didascalia a regole generata parola per parola |
| `m01-ranking-cv` | carte riordinate con FLIP e concordanza di Kendall con un ranking nascosto |
| `m01-che-task-e` | layout a raggiera con sei forme d'uscita e quiz a tempo |
| `m01-feature-e-classificazione` | strumenti di misura animati sull'immagine del pesce e passaggio 1D/2D secondo le feature scelte |
| `m01-postprocessing-decisione` | imbuto di aggregazione a voto, flusso di 500 pesci e deviatore con trade-off errore/ispezione |
| `m02-un-ingresso-tre-uscite` | scatola polimorfica che produce frase, ago su scala o lista ordinata |
| `m02-dalle-feature-alla-decisione` | calibri, voto su cinque fotogrammi, deviatore e casse: la pipeline arriva all'azione fisica |
| `m02-valuta-e-torna-indietro` | diagnosi di uno scenario nascosto dalla matrice di confusione e scelta della fase a cui tornare |
| `m02-mappatura-tre-europe` | mappa geografica con regioni e dataset shift fra aree |
| `m02-batimetria-dalle-onde` | finestra trascinabile lungo una traiettoria e mappa di profondità che si costruisce |
| `m02-captioning-parola-per-parola` | decoder autoregressivo con punteggi delle candidate: anticipa il motore di sequenze di Ricci |
| `m02-cerca-con-una-frase` | testo libero digitato e retrieval su didascalie |
| `m02-dal-testo-all-immagine` | immagini che emergono dal rumore in 10 passi: anticipa il motore di diffusione (d12) |
| `m02-tracce-nell-atrio` | tracking multi-oggetto e traiettoria disegnata a mano libera |
| `m02-biometria-retina-firma` | firma disegnata due volte, codice angolare della retina, curve FAR/FRR |
| `m02-georadar-iperbole` | modello fisico diretto che costruisce il radargramma colonna per colonna e inversione manuale |
| `m02-fusione-previsioni-solari` | small multiples di serie meteo e tre pesi vincolati al simplesso |
| `m02-svm-come-filtri` | architettura a strati con mappe di attivazione: anticipa il motore CNN di Ricci |
| `m02-ecg-dal-battito-alla-diagnosi` | morfologia ECG parametrica, 9 feature selezionabili e probabilità delle classi: tre motori in uno |
| `m03-pam-canale-ideale` | simboli che viaggiano e diventano impulsi, prior vincolati a somma 1, quiz a uscita nascosta |
| `m03-pam-convoluzione-soglie` | convoluzione animata a timbri su tre simboli e ottimizzazione di due soglie |
| `m03-mappa-capitolo-2` | mappa metro con anteprime di cinque stimatori diversi nello stesso riquadro |
| `m03-tre-uscite` | tre schede con usi diversi dello stesso modello, fra cui la predizione su scatter con retta |
| `m03-tre-categorie-di-segnali` | tre scenari eterogenei in parallelo (PAM, sonar con stima contro ping, B-scan GPR) |
| `m03-non-sprecare-informazione` | tabella 100×2 con celle mancanti e barratura delle righe incomplete |
| `m03-funzione-di-x-o-di-theta` | heatmap p(x\|θ) con due tagli ortogonali e simulazione float32/float64 dell'underflow |
| `m04-matrice-di-fisher-2x2` | prodotto esterno del gradiente costruito cella per cella e media Monte Carlo verso I |
| `m04-pagella-dello-stimatore` | griglia di autovalutazione 4×5 verificata da simulazione, linea del tempo e controesempi |
| `m04-diagonale-dell-inversa` | ombra contro fetta dell'ellisse nel piano dei parametri della regressione |
| `m04-simulatore-orale-bonta` | grafo concettuale navigabile con carte-stimatore trascinabili sui nodi |
| `m04-trabocchetti-di-terminologia` | metafora della macchina estimator che sputa cartellini estimate |
| `m05-log-likelihood-prodotti-somme` | deformazione animata dell'asse verticale con ln che preserva l'argmax |
| `m05-varianza-ml-distorta` | quadrati degli scarti impilati in due colonne: geometria del fattore (N−1)/N |
| `m05-ml-nei-problemi-reali` | tre rappresentazioni di dati diverse (barra, scatter, griglia 8×8) con repliche fantasma |
| `m05-parentele-tra-modelli` | grafo delle distribuzioni con particelle che viaggiano sugli archi delle trasformazioni |
| `m07-tre-ingredienti-bayes` | macchina a slot con controllo di completezza delle ipotesi del metodo |
| `m07-marginalizzare-theta` | heatmap della congiunta con scansione di colonna e intervallo di integrazione regolabile |
| `m07-tiro-alla-fune-prior-dati` | metafora del tiro alla fune con nodo a molla |
| `m07-punto-contro-distribuzione` | etichettatura di pixel da un'immagine e robustezza delle soglie ML e Bayes per due classi |
| `m08-ml-o-bayes-bilancia-pratica` | corsie ML e Bayes con griglia di integrazione visibile e bilancia costo/informazione |
| `m08-regione-r-e-probabilita` | la stessa approssimazione P_R ≈ p(x)V in 1D, 2D e 3D |
| `m08-da-pr-a-densita` | carte-formula che scivolano e si fondono in K/(NV) |
| `m08-funzione-finestra-gamma` | due assi (dati e normalizzato) con frecce che volano e lampadine |
| `m08-disegna-la-stima-knn` | esercizio a fasi (bandierine, ordinamento, disegno libero) con punteggio per fase |
| `m10-nastro-senza-etichette` | nastro con cartellini, osservazioni parziali come segmenti e tabella X\|Y oscurabile |
| `m10-dataset-completo-z` | tabella con telo sui dati mancanti che distingue X incompleto da Z completo |
| `m10-pnn-parzen-come-rete` | Parzen come rete a quattro strati che si illumina: anticipa il motore di reti di Ricci |
| `m11-mappa-riduzione-feature` | tre viste collegate (mappa, spettro, vettore) con doppia semantica selezione/estrazione |
| `m11-aggiungi-una-feature` | stessa scena che cresce da 1D a 3D con errore di Bayes esatto e marginali |
| `m11-bayes-non-peggiora` | vista a fetta condizionata di una densità 2D sincronizzata con il piano |
| `m11-ipotesi-sbagliate` | istogramma che diventa scatter e modello gaussiano che cade nel vuoto, fino a n = 8 |
| `m11-bilancia-campioni-parametri` | bilancia a molla (metafora condivisa con `m15-bilancia-di-fisher`: un componente comune accanto ai due widget) |
| `m12-minimo-e-media-geometrica` | disuguaglianza scalare con barre e passi della dimostrazione prima dell'estensione all'asse |
| `m13-cantiere-sfs-o-sbs` | vignetta con fumetti che rispondono a n, m e mappa (n, m) con quiz a tempo |
| `m14-ica-ecg-fetale` | tracce ECG in streaming e separazione di sorgenti con due direzioni di demixing |
| `m14-macchina-y-phi-x` | prodotto matrice-vettore animato cella per cella con pesi-immagine editabili |
| `m14-cubo-autovalori` | cubica con radice doppia e autospazio a disco con base ruotabile |
| `m14-cubo-una-feature` | direzioni a pari varianza e Fisher diverso nell'autospazio, con aritmetica esatta |
| `m15-bilancia-di-fisher` | rapporto di Fisher come bilancia a molla (componente comune con `m11-bilancia-campioni-parametri`) |
| `m15-una-feature-per-la-cernita` | nastro continuo di pesci con barre w_j x_j e istogramma che si accumula |
| `m15-rango-c-meno-uno` | poligono chiuso dei vettori pesati e 64 autovalori per le cifre scelte |
| `m15-ricetta-lda-in-cinque-passi` | tabella dati 4D editabile con ricalcolo reattivo dei cinque passi |
| `m16-dal-pesce-al-vettore` | mappatura oggetto → vettore colonna → punto con notazione formale e glossario |

## Revisione indipendente (2026-09-24)

Un critico diverso dall'architetto ha aperto per intero (storyboard, interazioni, visivo, sfida) la specifica di 134 widget: 116 assegnati ai motori, da 4 a 10 per motore scelti fra i più lontani dal riferimento, e 18 su misura (i 14 elencati sotto e i 4 passati a un motore). Per ognuno ha chiesto: il preset proposto lo rende fedelmente, o lo appiattisce su una variante del riferimento?

**Esito.** Nessun widget campionato perde la sua meccanica, e le lacune erano quasi sempre campi mancanti, non meccaniche sbagliate. Due motori mescolavano due terreni diversi e sono stati divisi; quattro widget su misura erano già coperti da un motore.

| Modifica | Perché |
|---|---|
| `covariance` → `covariance` (21) + **`spectrum-nd`** (5) | la vista matrice n × n (heatmap 200 × 200, spettri di 120 autovalori, rango di S_W, ricostruzione di un profilo) non ha il piano come terreno: dentro `covariance` era un secondo motore sotto un `view: 'matrix'` |
| `classifier2d` → `classifier2d` (33) + **`density2d`** (5) | la stima di densità 2D senza classi (cella che si espande, lucchetto K/V, σ adattivo, normalizzazione, griglia della slide 46) non ha né regioni né frontiere; `density-only`, `adaptiveSigma` e `normalize` erano rami speciali. La logica esiste già nei widget costruiti di m09 |
| `m14-autocifre-karhunen-loeve`: su misura → `spectrum-nd` | galleria di autovettori come immagini 8 × 8, coefficienti y_k, ricostruzione progressiva e J_m contro m: è la ricostruzione di `m14-segnale-e-rumore` con il profilo disegnato come immagine |
| `m13-pareggio-matrici`: su misura → `subset-search` | è la gara di `race` fra SFS e SBS con costo per valutazione k³: il motore aveva già `cost.perEval: 'k3'`; nuova vista `matrixLanes` |
| `m12-matrice-multiclasse`: su misura → `subset-search` | scelta del sottoinsieme di bande con criterio gaussiano a C classi, media pesata contro caso peggiore; nuova vista `pairMatrix` e `criterion.multiclass` |
| `m07-costo-e-interpretabilita`: su misura → `dimension-lab` | la griglia G^d che si riempie in 1D, 2D, 3D e la torre logaritmica sono `grid-points` con Δ = 1/G; nuove `lanes` di contatori ML/Bayes |
| `BasePreset.tabs` e `BasePreset.insights` | 26 widget su motore hanno schede, 93 spie o badge che si accendono: un solo meccanismo comune invece di venti varianti |
| campi precisati | `density1d`: strati `smoothedTruth`, `zeroBand`, `zones`, `nMax`; `estimator-lab`: viste `error-hist`, `coverage`, metriche e leggi K(N) libere in `n-sweep`, `interval`, regione R sull'asse; `covariance`: `bands3`, `mixedEllipse`, `termBars`, `matrixEditor`, `paramCounter`; `classifier2d`: `rule`, `verdicts`; `projection2d`: `polar`, `autoencoder`, `datasets`; `block-flow`: anteprime `tree`, `weights`, `image-steps`; `exam-deck`: `FigureSpec.params`, `gauges`, `actions` |

**Widget campionati sui motori.** density1d: `m03-albero-degli-approcci`, `m07-quando-serve-la-non-parametrica`, `m08-pro-e-contro`, `m08-casi-limite-formula-madre`. pdf-families: `m03-famiglie-parametriche`, `m04-scelta-del-modello-statistico`, `m05-catena-di-acquisizione-sar`, `m05-limite-centrale-consumi`, `m06-gamma-attesa-k-eventi`, `m05-indovina-il-modello`, `m06-indovina-il-modello`. estimator-lab: `m04-quantita-e-qualita-dei-campioni`, `m04-ipotesi-del-bound`, `m04-score-e-curvatura-spam`, `m07-pochi-dati-prior-e-intervalli`, `m08-cella-aleatoria-beta`, `m08-condizioni-di-consistenza`, `m08-frequenza-relativa-e-grandi-numeri`. theta-lab: `m03-costante-o-variabile-aleatoria`, `m03-quando-ml-e-bayes-coincidono`, `m05-derivata-nulla-molle`, `m06-theta-fisso-o-aleatorio`, `m07-theta-fisso-o-aleatorio`, `m07-media-pesata-dei-modelli`, `m07-due-fonti-di-incertezza`, `m07-precisioni-che-si-sommano`, `m07-quando-ml-e-bayes-coincidono`, `m08-quando-ml-e-bayes-coincidono`. covariance: `m05-indipendenza-e-fattorizzazione`, `m12-chernoff-gaussiano`, `m14-varianza-e-unita`, `m14-equazione-caratteristica`, `m14-varianza-per-componente`, `m15-fabbrica-matrici-scatter`, `m15-tre-classi-tre-medie` (e i quattro passati a `spectrum-nd`: `m06-spettro-autovalori-nd`, `m11-sigma-affamata`, `m14-segnale-e-rumore`, `m15-quando-sw-non-si-inverte`). projection2d: `m05-semidefinita-positiva-proiezioni`, `m11-selezionare-o-trasformare`, `m13-estrazione-polare`, `m14-quale-obiettivo`, `m14-lineare-o-non-lineare`, `m15-lda-cieca-medie-coincidenti`. classifier2d: `m01-active-learning-oracolo`, `m02-seleziona-scegli-addestra`, `m08-dal-knn-stimatore-al-classificatore`, `m12-perche-un-bound`, `m16-mappa-capitolo-4`, `m16-quattro-leve-del-design`, `m16-albero-approcci`, `m16-etichette-si-o-no`, `m16-galleria-frontiere-nonparametriche` (e i cinque passati a `density2d`: `m08-chi-fissa-cosa`, `m08-griglia-parzen-vs-knn`, `m08-ipotesi-knn`, `m10-sigma-kernel-e-normalizzazione`, `m10-sigma-adattivo`). mixture-em: `m01-clustering-senza-etichette`, `m10-due-verosimiglianze`, `m10-quattro-punti-x1-mancante`, `m10-dati-mancanti-in-pratica`, `m10-parametrico-batte-nonparametrico`, `m10-costruire-q`. landscape: `m03-modello-e-parametri`, `m10-minorante-q`, `m10-ml-facile-o-difficile`, `m15-scalata-del-criterio`. twoclass1d: `m02-falsi-e-mancati-allarmi`, `m03-statistico-vs-non-statistico`, `m03-quanto-sai-cosa-stimi`, `m05-due-ml-stima-e-decisione`, `m11-quale-misura-j`, `m12-jm-a-tre-classi`. subset-search: `m11-caccia-al-sottoinsieme`, `m12-accuratezza-o-errore-di-bayes`, `m12-compatibilita-e-densita-stimate`, `m12-una-banda-in-piu`, `m13-righello-e-mappa`, `m13-dieci-coppie-ecg`, `m13-veloci-ma-senza-ritorno`. block-flow: `m02-conoscenza-a-priori`, `m02-blocchi-contro-fasi`, `m03-dove-serve-la-stima`, `m11-filter-wrapper-embedded`, `m12-filtro-wrapper-embedded`. exam-deck: `m02-domini-e-compiti`, `m05-simulatore-orale-ml`, `m08-carte-knn-o-parzen`, `m12-da-bhattacharyya-a-jm`, `m15-dalla-somma-alla-forma-quadratica`. signal-lab: `m01-tempo-vs-frequenza`, `m01-oscillogramma-fonemi`, `m03-pam-rumore-gaussiano`, `m03-ipotesi-iid-alla-prova`. raster-lab: `m01-acquisizione-preprocessing`, `m01-multilabel-tessere-uav`, `m02-uav-tile-multilabel`, `m02-covid-dove-guarda-il-modello`, `m02-rileva-e-conta`, `m15-bande-pca-lda-dal-satellite`, `m16-dai-campioni-al-modello`. dimension-lab: `m08-knn-e-dimensionalita`, `m08-parzen-ipercubo`, `m11-costo-della-complessita`, `m11-griglia-esplosiva`. fit-sweep: `m02-spettro-concentrazione`, `m04-sotto-il-pavimento`, `m11-tre-obiettivi`, `m14-meno-dimensioni`. scene3d: `m08-superficie-knn-2d`, `m10-salita-monotona-q`, `m14-cubo-proiezione-2d`, `m15-volume-del-determinante`, `m16-mdm-discriminanti-lineari`.

**Widget su misura verificati.** Restano su misura, con motivo confermato: `m08-regione-r-e-probabilita` (la stessa approssimazione in 1D, 2D e 3D, con volumi sotto una superficie), `m08-funzione-finestra-gamma` (due assi e cambio di variabile), `m08-da-pr-a-densita` (formule che si fondono), `m08-ml-o-bayes-bilancia-pratica` (griglia d'integrazione e bilancia su due corsie: `theta-lab` avrebbe bisogno di due campi per un solo widget), `m07-punto-contro-distribuzione` (due classi nello spazio dei parametri), `m11-aggiungi-una-feature`, `m11-bayes-non-peggiora`, `m11-ipotesi-sbagliate`, `m12-minimo-e-media-geometrica`, `m13-cantiere-sfs-o-sbs`, `m15-una-feature-per-la-cernita`, `m15-rango-c-meno-uno` (il poligono chiuso è la spiegazione; importa barre e Jacobi da `spectrum-nd`), `m05-ml-nei-problemi-reali`, `m01-che-task-e`. Passati a un motore: i quattro della tabella sopra.

**Casi limite lasciati dove sono.** `m12-da-bhattacharyya-a-jm` resta in `exam-deck` (derivazione a passi con figura), con i nuovi `FigureSpec.params`, `gauges` e `actions` per lo slider di B, il termometro JM e i pulsanti "identiche / scambia / separa"; `m04-sotto-il-pavimento` resta in `fit-sweep` (λ della ridge è l'iperparametro, il bound è una curva); `m03-modello-e-parametri` resta in `landscape` (il piano dei parametri con la log-verosimiglianza è il suo terreno; con la gaussiana 2D a r = 5 restano solo le manopole).

**Gruppi di gemelli** (regola 13): theta-lab `m03-`/`m07-`/`m08-quando-ml-e-bayes-coincidono`, `m03-costante-o-variabile-aleatoria`/`m06-`/`m07-theta-fisso-o-aleatorio`, `m03-verosimiglianza-come-prodotto`/`m04-likelihood-come-prodotto`, `m03-tre-pannelli-della-verosimiglianza`/`m04-tre-pannelli-likelihood`, `m04-ricerca-ml-singola-osservazione`/`m05-ml-search-una-osservazione`; estimator-lab `m03-`/`m04-bersaglio-bias-varianza`, `m03-consistenza-imbuto`/`m04-imbuto-della-consistenza`, `m03-proprieta-asintotiche`/`m04-ml-tre-proprieta-asintotiche`/`m05-cruscotto-asintotico-ml`/`m06-proprieta-asintotiche-stime`; pdf-families `m05-`/`m06-indovina-il-modello`, `m04-scelta-del-modello-statistico`/`m05-catena-di-acquisizione-sar`/`m06-catena-acquisizione-modello`, `m05-limite-centrale-consumi`/`m06-limite-centrale-somma-cause`, e le coppie m05/m06 di Gamma, Rayleigh e log-normale; covariance `m05-`/`m06-costruisci-la-covarianza`, `m05-ellissi-e-autovettori`/`m06-autovettori-assi-ellisse`, `m05-indipendenza-e-fattorizzazione`/`m06-feature-indipendenti-prodotto`, `m05-formula-gaussiana-multivariata`/`m06-formula-viva-bivariata`; projection2d `m11-selezionare-o-trasformare`/`m13-selezionare-o-combinare`/`m14-scegliere-o-combinare`, `m14-rappresentare-o-separare`/`m15-rappresentare-o-discriminare`; block-flow `m11-filter-wrapper-embedded`/`m12-filtro-wrapper-embedded`, `m01-supervisore-feedback`/`m02-supervisore-e-feedback`; raster-lab `m01-multilabel-tessere-uav`/`m02-uav-tile-multilabel`; density2d `m10-sigma-adattivo` e `m10-sigma-kernel-e-normalizzazione` contro i costruiti `m09-sigma-adattiva` e `m09-normalizza-le-feature`.

**Fuori perimetro.** Gli inventari di m17 (24 widget) e m19 (23) sono comparsi dopo questa architettura e non sono nella mappa: la prima assegnazione va fatta prima di lanciarne la produzione (candidati naturali: `twoclass1d` per MAP, ML e costi in 1D, `classifier2d` per regioni e discriminanti nel piano, `scene3d` per quadriche e il cubo, `covariance` per i tre casi di Σ).

## Già costruiti

`m03-campioni-che-rivelano-la-pdf`, `m08-cella-che-si-espande` e i 28 widget di m09 (elenco completo in `widget-map.json`, campo `built`). Il `Sketch` di `m03-campioni-che-rivelano-la-pdf` e il canale `onFrame` di `m08-cella-che-si-espande` sono i modelli per `engines/shared/`.

## Ordine di costruzione consigliato

1. `engines/shared/` insieme al primo motore che ne ha bisogno (`classifier2d` o `twoclass1d`), perché `Threshold`, `Ellipse`, `ParamChart`, `MatrixGrid` e `DragBins` servono a quasi tutti.
2. I motori con più widget e più riuso futuro: `classifier2d` (33), `theta-lab` (31), `estimator-lab` (26), `twoclass1d` (22), `covariance` (21), `pdf-families` (20), `projection2d` (20), `subset-search` (20).
3. Poi `density1d` (estensione), `density2d` (insieme all'estrazione della logica di m09), `scene3d`, `mixture-em`, `raster-lab`, `block-flow`, `spectrum-nd` (dopo `covariance`, di cui importa stima ed ellissi).
4. Infine `fit-sweep`, `dimension-lab`, `signal-lab`, `exam-deck`, `landscape`.

Motori che toccano la stessa logica la mettono in `engines/shared/` e non la duplicano: misure fra gaussiane (`covariance`, `twoclass1d`, `classifier2d`, `subset-search`), classificatori (`classifier2d`, `raster-lab`, `fit-sweep`), EM (`mixture-em`, `landscape`, `scene3d`), proiezione 3D (`scene3d`, `dimension-lab`), algebra lineare simmetrica (`covariance`, `spectrum-nd`, `projection2d`, `scene3d`), stimatori non parametrici 2D (`density2d`, `classifier2d`, `scene3d`).
