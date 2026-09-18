# Guida per gli autori dei widget

Chi scrive un widget legge questa guida per prima. È scritta a partire da ciò che è stato davvero costruito e verificato il 2026-09-18: il kit (`src/widgets/kit/`), il motore `density1d` (`src/widgets/engines/density1d/`) e il widget di riferimento `m09-somma-dei-kernel`, che ne è la prima istanza. Gli altri due widget di riferimento del Task 4.7 (`m03-campioni-che-rivelano-la-pdf`, `m08-cella-che-si-espande`) sono scritti a mano sul kit, senza motore: guardali quando il tuo widget non è una variante di un esperimento già motorizzato.

Le richieste dell'utente valgono anche qui: **nessun concetto perso**, ogni concetto con qualcosa di interattivo e animato su un esempio reale del cast, italiano con ogni termine tecnico anche in inglese.

## 1. Flusso di lavoro

1. Leggi la specifica del widget nell'inventario, senza aprire tutto il JSON:
   ```sh
   node -e "const i=require('./docs/inventory/m09-parzen-windows.json'); const w=i.widgets.find(w=>w.id==='m09-somma-dei-kernel'); console.log(JSON.stringify(w,null,1)); for (const c of i.concepts.filter(c=>w.concepts.includes(c.id))) console.log(JSON.stringify({id:c.id,name:c.name,nameEn:c.nameEn,latex:c.latex}))"
   ```
   Ti servono `storyboard`, `interactions`, `realExample`, `formulasShown`, `challenge` e il `latex` dei concetti: la notazione delle formule si copia da lì.
2. Decidi se il widget è la variante di un motore (sezione 12) o va scritto a mano. Se un motore lo copre, scrivi solo il preset.
3. Prima di scrivere il moto invoca le skill `ui-design:emil-design-eng` e `ui-design:svg-animations`; prima dei grafici `dataviz`. Per le API di librerie (motion, d3, Testing Library) usa Context7, non la memoria.
4. Test prima: la logica non banale va in un `.ts` accanto al widget, con il suo test che fallisce per il motivo giusto (sezione 10).
5. Verifica: `npx vitest run src/widgets`, `npx tsc -p tsconfig.app.json --noEmit`, `npx oxlint src/widgets`.
6. Non modificare `src/widgets/kit/`: ciò che manca si crea accanto al widget o nel motore, e lo si dice nelle note. Niente operazioni git.

## 2. Contratto dei file e di `meta`

Un widget è il file `src/widgets/<moduleId>/<widgetId>.widget.tsx`. Esporta `meta` (tipo `WidgetMeta`) e, come default, il componente. Il registry (`registry.ts`) lo trova con `import.meta.glob` e lo carica pigro per id; `registry.test.ts` controlla da solo il contratto di ogni file.

| Campo di `meta` | Regola |
|---|---|
| `id` | uguale al nome del file senza `.widget.tsx`, unico in tutta l'app |
| `moduleId` | uguale al nome della cartella, un modulo del manifest |
| `title` | il titolo dell'inventario |
| `concepts` | gli id dei concetti dell'inventario che il widget copre |
| `scenario` | una chiave del cast (`pesce`, `sensori`, …): il WidgetFrame la mostra con il badge "Dati sintetici" |
| `scenarioNote` | una frase sullo scenario reale ("Luminosità di 12 salmoni misurata dalla telecamera…") |
| `size` | `S` in colonna, `M` colonna larga, `L` tutta la larghezza |

- Annota sempre `export const meta: WidgetMeta`: `import.meta.glob` è un cast, il tipo lo controlli tu.
- oxlint segnala `only-export-components` su `meta`: è atteso, lo fa anche `_test/prova.widget.tsx`. Tutto il resto (funzioni, costanti, preset) va in file `.ts` accanto.
- Un `_` davanti alla cartella o al file rende il widget privato: si carica per id ma non entra negli elenchi (prove, bozze).
- Accanto al widget: `<id>.preset.ts` (se usa un motore) oppure `<nome>.ts` con la logica, e i test `<id>.test.tsx`.

## 3. Il kit

| Pezzo | A cosa serve | Da sapere |
|---|---|---|
| `WidgetFrame` | la finestra del foglio: cartiglio, badge, terreno, trasporto, didascalia, comandi, sfida, Reset, schermo intero | non ha uno spazio per le formule: mettile nel `caption`, sotto la `StepCaption`. Il terreno ha il rapporto `aspect` e `overflow: hidden` |
| `PlayControls` | Passo indietro, Play/Pausa, Passo avanti, velocità, scala dei passi | passagli anche `steps`: l'indicatore mostra una tacca per passo |
| `StepCaption` | numero, titolo e spiegazione del passo (regione `aria-live`) | `text` è Markdown con `$…$` |
| `Slider` | scala lineare con tastiera completa | per una scala logaritmica fai scorrere lo slider sull'**indice** di un elenco di valori tondi (vedi `niceLogSteps` del motore) e formatta con `format={(i) => …}` |
| `Segmented`, `Toggle`, `NumberField`, `ActionButton` | scelte, strati, numeri, azioni | nessun moto: si usano spesso e da tastiera |
| `Readout` | lettura di uno strumento, annunciata quando si ferma | `pinned` = lo spillo ocra sulla lettura che conta |
| `LiveFormula` | formula con `\val{nome}` sostituiti e lampo sui numeri che cambiano | vedi sezione 8 |
| `Challenge` | consegna, Verifica, Indizio, esito; registra il completamento nei progressi | l'esito lo calcoli tu (sezione 9) |
| `useStoryboard`, `useAnimationFrame`, `useReducedMotion`, `useSettled` | tempo dei passi, cicli di fotogrammi che si fermano, preferenza di moto, annunci non a raffica | sezione 4 |
| `plot/*` | `Plot` (scale, cursore-quota, cartiglio delle letture), `Axis`, `Grid`, `LinePath`, `AreaPath`, `Dots`, `Histogram`, `Bars`, `Arrow`, `FieldCanvas`, `BoundaryCanvas`, `Contours`, `colors.ts`, `marks.ts` | le primitive leggono scale e servizi con `usePlot()`; uno strato che manca si scrive allo stesso modo, fuori dal kit (esempio: `engines/density1d/terrain.tsx`) |

Montaggio del terreno che funziona: dentro il `WidgetFrame` un contenitore `absolute inset-0` e dentro `<Plot fill …>`; sovrapposizioni HTML (un timbro, una legenda) come fratelli assoluti del `Plot`.

## 4. Regole di moto

Prima di animare qualcosa rispondi a tre domande (skill `emil-design-eng`): quante volte lo vedrà lo studente, a che cosa serve, che curva usare.

- **Azioni frequenti o da tastiera: nessuna animazione.** Slider, selettori, interruttori, legenda, cursore: il terreno segue subito la mano. Un valore che insegue in ritardo sembra rotto.
- **Racconto (storyboard): il moto è la spiegazione.** Qui le durate sono lunghe (1-2 s a passo) e le geometrie seguono l'avanzamento del passo.
- **Risposte brevi del sistema: sotto i 300 ms.** Nel motore density1d un kernel nuovo cresce in 250 ms e le altezze si riscalano da 1/N a 1/(N ± 1) in 300 ms; il lampo di `LiveFormula` dura 240 ms, l'esito della sfida 200 ms.
- **Curve.** Ciò che entra o cresce: ease-out (`--ease-out`, in JS `easeOut` del motore). Ciò che si sposta o cambia forma: ease-in-out (`--ease-in-out`, `easeInOut`). Ease-in solo per la gravità: i campioni che cadono sull'asse (`easeIn`).
- **Il tempo viene dai fotogrammi.** Mai `setTimeout`/`setInterval`: lo storyboard fa scorrere il tempo con `useAnimationFrame` (pausa esatta, velocità, scheda nascosta ferma). Un moto breve fuori dallo storyboard usa `useAnimationFrame(cb, attivo)` con `attivo` falso appena finisce. Non leggere `performance.now()` nei gestori degli eventi (il linter lo segnala): il gesto registra "da far partire" e l'istante lo fissa il primo fotogramma, come fa `DensityExplorer`.
- **Ogni passo è uno stato completo.** Con `prefers-reduced-motion` il kit dà `progress = 1` a ogni passo: lo stato finale di un passo deve raccontare da solo il passo (la pila impilata, non la pila che torna giù). Con reduced motion anche i moti brevi saltano all'arrivo.
- **Niente animazioni di layout nei cicli.** Si muovono attributi SVG, `opacity`, `transform`; mai `width`, `height`, margini o posizioni CSS a ogni fotogramma.
- **Costo dei fotogrammi.** Leggere `sb.progress` fa ridisegnare a ogni fotogramma il componente che possiede lo storyboard: va bene se il ridisegno costa poco (density1d ricalcola tutti i suoi numeri in circa 0.6 ms con N = 12 e 1.4 ms con N = 40, misurati in Node su questo PC, più il ridisegno dell'SVG). Se no, usa il canale `onFrame` di `useStoryboard` e fai leggere il tempo solo agli strati che si muovono, come `m08-cella-che-si-espande`.
- Un passo che **impone un valore** (h del racconto) non deve nascondere il comando: se l'utente lo tocca, lo storyboard va in pausa e il valore torna all'utente.

## 5. Colori per ruolo

Solo token: utility (`bg-surface`, `text-muted`, `bg-pin`, …) nell'HTML e `var(--token)` in SVG e `style`. Nessun colore letterale, nessun gradiente, nessuna ombra se non su ciò che si sovrappone.

| Ruolo | Token | Uso nel motore density1d |
|---|---|---|
| campioni | `--viz-sample` (inchiostro) | punti sul nastro, anello di superficie |
| stima | `--viz-estimate` | p̂(x), linea di 3 px |
| verità a terra | `--viz-truth`, **tratteggiata** | la densità vera; il tratteggio vuol dire solo questo |
| kernel | `--viz-kernel` | campane: filo di 1.25 px e velatura leggera, più piena quando sono impilate |
| evidenza | `--viz-highlight` (ocra, con bordino a inchiostro: `role="accent"`) | la stima con h* dopo la verifica |
| confini, frecce | `--viz-boundary` | la freccia h, la verticale del punto sonda |
| classi 1-6 | `classVar(i)` con la forma di `marks.ts` | istogramma `cls={2}`, K-NN `cls={1}`: identità mai solo di colore |
| spillo | `bg-pin` / `var(--pin)` | posizione ed evidenza: punto sonda, timbro del regime, lettura in evidenza, etichetta "Sfida" |
| stato | `--ok`, `--warn` con icona e parole | solo l'esito della sfida (lo fa `Challenge`) |

Il rosso non è un colore di stato: è vegetazione (classe 1). Le etichette dirette delle curve sono a inchiostro con alone di superficie, mai del colore della serie; se più curve hanno il picco nello stesso punto, mettile su fianchi diversi (`flankPoint`).

## 6. Accessibilità

- **Tastiera ovunque.** Ogni gesto del puntatore ha un equivalente: nel motore il clic sul nastro corrisponde a Invio sul cursore di lettura e al pulsante "Aggiungi in x", il clic su un campione a Canc e a "Togli il più vicino". Dillo nel testo dei comandi.
- **Nomi e ruoli.** `Plot` riceve `ariaLabel` e una `description` con un riassunto dello stato (N, kernel, h, massimi locali, valore nel punto sonda). I simboli LaTeX nelle etichette sono `aria-hidden`: il nome accessibile è la parola.
- **Annunci.** `Readout`, `StepCaption`, l'esito di `Challenge` sono regioni `aria-live="polite"`; i valori si annunciano quando si fermano (`useSettled`), mai a ogni fotogramma. Con più formule vive annuncia i valori di una sola (`announce={false}` sulle altre).
- **Bersagli.** Almeno 40 px per controlli e pulsanti (`min-h-10`). I segni fitti dei dati (campioni a pochi pixel l'uno dall'altro) non possono averli: danno un bersaglio di 22 px e hanno l'alternativa da tastiera.
- **390 px.** Il `WidgetFrame` porta i comandi sotto il terreno; le formule in display scorrono nel loro riquadro; una tabella larga sta in una regione `overflow-x-auto` con `tabIndex={0}` e nome; le scritte dentro il terreno che coprirebbero i dati si nascondono sotto una certa larghezza.
- **Lingua.** Il termine inglese va in corsivo con `lang="en"` (il corsivo è riservato ai termini inglesi e all'intuizione).
- `prefers-reduced-motion` rispettato (sezione 4). Il fuoco visibile è globale (`base.css`): non toglierlo.

## 7. Storyboard

- I passi sono `{ id, label, durationMs }` per `useStoryboard`, più una didascalia in Markdown. Il titolo del passo è breve e dice che cosa succede ("Ogni kernel pesa 1/N"); la didascalia spiega con la formula del docente e mette l'inglese in corsivo.
- **Il primo passo è il quadro completo**: all'apertura il terreno deve già dire che cosa fa il concetto, prima di Play. Il racconto parte da lì.
- Durate: un passo di racconto dura 1-2 s a velocità 1; una sequenza (i campioni che cadono) si misura per elemento (300 ms a campione).
- Niente `autoplay`: lo studente decide quando partire.
- Le didascalie possono citare lo stato (N, h, 1/N): scrivile come funzioni.

## 8. Formule vive

- La notazione è quella del docente: copia il `latex` dei concetti dell'inventario (per m09: $\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)$, $\delta(\mathbf{x})=\frac{1}{V(h)}\gamma(\mathbf{x}/h)$, i kernel $\Pi$, $\Lambda$, gaussiano).
- `\val{nome}` scrive `values[nome]` con due decimali, `\val[3]{nome}` con tre. Decimali fissi: una cifra che cambia sotto il cursore non deve cambiare lunghezza.
- Scrivi prima la formula generale e sotto la stessa con i numeri, in un `\begin{aligned}` o `\begin{gathered}`: lo studente vede il passaggio dalla definizione al conto. Esempio vero (m09):
  ```tex
  \begin{aligned}\hat{p}(x)&=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\,\gamma\!\left(\frac{x-x_k}{h}\right)\\
  \hat{p}(\val{x})&=\frac{1}{\val[0]{N}\cdot\val{h}}\sum_{k=1}^{\val[0]{N}}\gamma\!\left(\frac{\val{x}-x_k}{\val{h}}\right)\\
  &=\frac{\val[3]{g1}+\val[3]{g2}+\val[3]{g3}+\cdots}{\val{Nh}}=\frac{\val[3]{S}}{\val{Nh}}=\val[4]{p}\end{aligned}
  ```
- I numeri della formula sono quelli **esatti** usati nel calcolo: se uno slider mostra 0.50 ma il calcolo usa 0.5012, lo studente che rifà il conto a mano non torna. Per questo lo slider di h scorre su valori tondi.
- Test obbligatorio: ogni `\val{nome}` esiste fra i valori forniti e la formula, con i segnaposto riempiti, compila con `katex.renderToString(…, { throwOnError: true })`.

## 9. Sfide

- La consegna è un'azione misurabile ("trova h che minimizza l'errore"); l'esito lo calcola il widget e lo passa a `Challenge` come `status`.
- **Tarala con un test**: lo stato iniziale NON deve superarla (altrimenti basta premere Verifica), almeno un valore raggiungibile con i controlli deve superarla, l'indizio deve portare davvero alla soluzione. In m09 la soglia è $\mathrm{ISE}(h)/\mathrm{ISE}(h^*) \le 1.05$: con h = 0.5 il rapporto è 1.07, con 0.40 è 1.004, e il più piccolo h con un solo massimo locale (l'indizio) è proprio 0.40.
- L'esito vale per lo stato verificato: se cambia ciò che conta (h, kernel, campioni) torna "da verificare". Il punto sonda non conta, perché si muove appena il puntatore passa sul terreno.
- Dopo la verifica mostra i numeri del confronto con dei `Readout` (il tuo valore, l'ottimo, il rapporto in evidenza) e sul terreno ciò che la sfida chiedeva di trovare (la stima con h*).

## 10. Test richiesti

| Che cosa | Dove | Esempio vero |
|---|---|---|
| logica pura: valori noti, casi limite, stato dopo N passi | `<nome>.test.ts` accanto alla logica | `density1d.test.ts`: stima = `parzen1d`, somma degli addendi = p̂(x), `sceneAt` a inizio e fine di ogni fase |
| fedeltà all'inventario | test del widget | i 12 salmoni, la mistura, area 1/N = 0.083 e picco 0.0665 con h = 0.5 |
| formule, didascalie, termini compilano | test del widget | KaTeX con `throwOnError: true` su ogni testo, per N = 1 e N = 12 |
| sfida tarata | test del widget | sezione 9 |
| componente: apertura, tastiera, clic, storyboard con reduced motion, Reset | test del widget | `m09-somma-dei-kernel.test.tsx` |
| contratto di `meta` | automatico | `registry.test.ts` |

Trappole di jsdom già incontrate:

- `getByRole('button', { name })` calcola il nome di **tutti** i pulsanti; se uno contiene MathML (una voce di legenda con $x$) il `getComputedStyle` di jsdom si rompe. Cerca per testo (`getByText('Verifica', { selector: 'button' })`) o per etichetta (`getByLabelText('Passo avanti')`).
- `matchMedia` non esiste: finta con `vi.stubGlobal` (reduced motion vera rende i passi istantanei e i test deterministici).
- `ResizeObserver` non esiste: il `Plot` resta sul `viewBox` dato (nel motore 720 × 480), quindi un clic in `clientX = margin.left + innerWidth/2` cade a metà del dominio.
- Per i moti brevi, finte di `requestAnimationFrame` e `cancelAnimationFrame` con una coda: così si verifica anche che il ciclo si fermi.

Verifica visiva senza browser (quando il pannello Browser non è disponibile): un test temporaneo scrive l'`outerHTML` dell'SVG del terreno con i `var(--token)` sostituiti dai valori di `tokens.css`, e PyMuPDF lo rasterizza (`pymupdf.open(file.svg)[0].get_pixmap()`). MuPDF non conosce `fill="transparent"` (va sostituito con `none`), ignora i `tspan` affiancati e il tratteggio: serve per geometria, sovrapposizioni e scala, non per la tipografia. Il test temporaneo va cancellato subito.

## 11. Esempio commentato: `m09-somma-dei-kernel`

Il widget è tre righe di codice più un preset:

```tsx
// src/widgets/m09-parzen-windows/m09-somma-dei-kernel.widget.tsx
export const meta: WidgetMeta = {
  id: 'm09-somma-dei-kernel',            // = nome del file
  moduleId: 'm09-parzen-windows',        // = cartella
  title: 'La somma dei kernel in tempo reale',
  concepts: ['c15', 'c17', 'c18', 'c26'], // dall'inventario
  scenario: 'pesce',
  scenarioNote: "Luminosità di 12 salmoni misurata dalla telecamera dell'impianto di confezionamento",
  size: 'L',
}
export default function M09SommaDeiKernel() {
  return <DensityExplorer meta={meta} preset={preset} />
}
```

Il preset (`m09-somma-dei-kernel.preset.ts`) traduce la specifica dell'inventario:

- **scenario**: i 12 salmoni nell'ordine in cui arrivano sul nastro e la verità $0.7\,\mathcal N(4, 0.8^2) + 0.3\,\mathcal N(6, 0.9^2)$ con `mixtureScenario`, che scrive anche la mistura in LaTeX per le didascalie;
- **strati**: campane, stima, verità; la verità parte spenta perché la sfida chiede di scegliere h senza vederla;
- **controlli**: kernel gaussiano, rettangolare, triangolare; h da 0.05 a 3 in scala logaritmica, 0.5 all'inizio; campioni da 1 a 40, modificabili;
- **regimi**: sotto 0.15 il timbro "Stima sensibile: rischio overfitting", sopra 1.5 "Stima liscia: rischio underfitting";
- **storyboard** in nove passi: il quadro, i campioni che cadono (300 ms l'uno), i kernel interi che nascono, la divisione per N, la pila che diventa p̂(x), la verità con l'ISE, h = 0.10 (aghi), h = 2.5 (collina), ritorno all'h dell'utente;
- **formule**: la stima con i numeri del punto sonda (i primi tre addendi, la somma, il risultato) e δ(x) con V(h) = h, area 1/N e picco γ(0)/(Nh);
- **sfida** `min-ise` con tolleranza 1.05 e l'indizio del contatore dei massimi locali;
- **legenda viva** con la terminologia della slide ($\gamma(\cdot)$ *Parzen window or kernel*, $h$ *width of the window, bandwidth, smoothing parameter*, $\hat p(x)$ *an average of functions of x and the samples*) e l'avvertenza "non è il kernel delle SVM".

Scelte che valgono per ogni widget: il terreno è in SVG (non canvas come diceva la specifica) perché con N ≤ 40 costa poco, eredita i token e il cambio di tema senza ridisegni manuali e resta leggibile dagli strumenti di accessibilità; i colori seguono i ruoli del mondo e non quelli della specifica ("campane azzurre, curva blu"): kernel verde-acqua, stima rossa, verità grigia tratteggiata.

## 12. Motori parametrici

Molti widget di un foglio sono varianti dello stesso esperimento: stessa meccanica, scenario, strati, parametri, racconto e sfida diversi. Per questi si scrive un **preset** di un motore invece di un widget intero. Oggi c'è un motore, `density1d`; la proposta per il resto dell'app è di 40-60 motori (confini di decisione, discesa del gradiente, reti bayesiane, gridworld, attenzione…), con i widget su misura solo dove servono.

Un motore sta in `src/widgets/engines/<nome>/`: tipi del preset (`types.ts`), logica pura con test, componente che riceve `meta` e `preset` e costruisce tutto nel `WidgetFrame`, un `index.ts` che è la sua API pubblica. Il motore non contiene testi di un widget: tutto ciò che è proprio del widget sta nel preset.

## 13. Come si scrive un preset del motore density1d

`density1d` è la stima di densità in una dimensione del Cap. 2 di Melgani: campioni su un asse, stima di Parzen con kernel e h regolabili, stima K-NN, istogramma, densità vera, errore integrato, cursore-quota, campioni aggiunti e tolti con clic e tastiera, storyboard, formule vive, sfida.

```ts
import { DensityExplorer, mixtureScenario, sensorsScenario } from '../engines/density1d'
import type { Density1dPreset } from '../engines/density1d'
```

### Lo scenario

| Costruttore | Dati | Verità |
|---|---|---|
| `mixtureScenario({ samples, components, domain, axis, sampleName, decimals })` | campioni dati a mano (quelli dell'inventario) | la mistura di gaussiane `components`, con `truthTex` |
| `sensorsScenario({ seed, n, quantity, modes })` | letture del sensore IoT (`sensori`), a seed | `sensorsDensity` del dataset |
| `fishLightnessScenario({ seed, n })` | luminosità dei salmoni (`pesce`), a seed | `fishDensity('salmone', ['luminosita'])` |

Oppure un oggetto `Density1dScenario` scritto a mano: `samples`, `truth?`, `truthTex?`, `domain`, `axis: { it, en, unit? }`, `sampleName: { one, many }`, `decimals?`. Senza `truth` non ci sono densità vera, ISE né sfida `min-ise`.

### I campi del preset

| Campo | Che cosa decide |
|---|---|
| `layers` | strati offerti: `'kernels'`, `'estimate'`, `'truth'`, `'histogram'`, `'knn'`. Uno strato assente non ha né disegno né comando |
| `initialLayers` | strati accesi all'apertura e dopo Reset |
| `kernels`, `initial.kernel` | kernel del selettore (uno solo: niente selettore). Tutti quelli di `nonparam.ts`: rettangolare, triangolare, gaussiano, Epanechnikov, esponenziale, Cauchy, sinc² |
| `h`, `initial.h` | estremi della scala logaritmica di h e valore iniziale (portato al valore tondo più vicino) |
| `k`, `initial.k` | estremi e valore iniziale di K per lo strato `knn` (il massimo non supera N; predefinito √N) |
| `bins`, `initial.bins` | bin dell'istogramma |
| `initial.probe` | ascissa iniziale del punto sonda |
| `samples` | `{ editable, min, max }`: campioni aggiungibili e togliibili, e fra quali numeri |
| `yMax` | quota massima **fissa** dell'asse verticale: le altezze devono confrontarsi fra h diversi. Scegline una che contenga il kernel intero δ(0) = γ(0)/h all'h iniziale; ciò che la supera ha una punta "fuori scala" |
| `regimes` | soglie di h per i timbri "sensibile" (overfitting) e "liscia" (underfitting) |
| `storyboard` | i passi (sotto) |
| `formulas` | formule vive (sotto) |
| `addends` | tabella degli addendi del punto sonda, ordinati per contributo |
| `challenge` | la sfida (sotto) |
| `terms`, `notes` | legenda viva con la terminologia IT/EN e avvertenze |
| `ariaLabel`, `description`, `aspect` | nome e descrizione del grafico, rapporto del terreno (predefinito 1.5) |

### Le fasi dello storyboard

Ogni passo è `{ id, label, phase, durationMs, caption }`; `durationMs` e `caption` possono essere funzioni (di N; di `{ n, h, kernel, invN }`). Lo stato a fine passo è quello che si vede con reduced motion.

| Fase | Che cosa si vede durante il passo | Stato finale |
|---|---|---|
| `overview`, `explore` | il quadro completo con i valori dell'utente | uguale |
| `drop` | i campioni cadono sull'asse uno dopo l'altro (durata consigliata `n * 300`) | tutti a terra, nessun kernel |
| `grow` | su ogni campione cresce il kernel intero δ(x − x_k), area 1, uno dopo l'altro | tutti i kernel interi |
| `normalize` | ogni kernel scende da δ a δ/N | kernel di area 1/N |
| `stack` | i kernel si impilano; la cima della pila diventa p̂(x) | pila completa e stima disegnata |
| `truth` | la pila torna giù, compare la densità vera (e l'ISE) | kernel separati, verità accesa |
| `bandwidth` `{ h, truth? }` | h passa in scala logaritmica al valore del passo; `'user'` torna a quello dello slider; `truth: true` tiene accesa la verità | h del passo |

Un passo `bandwidth` impone h: se l'utente muove lo slider lì, lo storyboard va in pausa e h torna suo.

### Le formule vive

`formulas: [{ id, label?, tex }]`, con `tex` stringa o funzione di `{ n, kernel }` (per scrivere solo gli addendi che esistono). La prima formula con segnaposto annuncia i suoi valori ai lettori di schermo. Valori disponibili (`FORMULA_VALUE_NAMES`), tutti calcolati nel punto sonda con l'h mostrato:

| Nome | Valore |
|---|---|
| `x`, `N`, `h`, `V`, `Nh` | punto sonda, numero di campioni, larghezza, V(h) = h, N·h |
| `S`, `p` | Σ γ((x − x_k)/h) e p̂(x) = S/(Nh) |
| `g1`…`g6`, `t1`…`t6`, `xk1`…`xk6`, `u1`…`u6` | i primi sei addendi per contributo: γ(u), addendo γ(u)/(Nh), x_k, u |
| `rest` | N − 3 (quanti addendi restano dopo i primi tre) |
| `d0`, `peak`, `area` | δ(0) = γ(0)/h, picco di una campana γ(0)/(Nh), area 1/N |
| `K` | campioni nella finestra di lato h centrata in x |
| `k`, `r`, `VK`, `pk` | K della stima K-NN, r_K, V_K = 2r_K, p̂ = K/(N·V_K) |
| `ptrue`, `ise`, `hopt` | densità vera in x, ISE (se la verità è visibile), h* (dopo la verifica) |

### La sfida

- `{ kind: 'min-ise', prompt, hint?, tolerance }`: trovare l'h che minimizza l'ISE per il kernel scelto. La verifica cerca h* (`optimalBandwidth`), confronta il rapporto con `tolerance`, accende la densità vera e disegna la stima con h*. Taralo con i test della sezione 9.
- `{ kind: 'custom', prompt, hint?, check }`: `check({ samples, h, kernel, k, bins, probe })` decide. L'esito vale finché nessuno di quei valori cambia.

### Varianti del foglio m09: che cosa copre già e che cosa manca

Confronto con le specifiche dell'inventario (2026-09-18). Il nucleo di ciascuna è già nel motore; ciò che manca è la lista delle estensioni da aggiungere al motore, ognuna come campo nuovo del preset.

| Widget dell'inventario | Già con un preset | Manca al motore |
|---|---|---|
| `m09-conteggio-vs-interpolazione` | tre campioni, kernel rettangolare, triangolare, Epanechnikov, gaussiano, punto sonda, formula con i numeri | campioni trascinabili, un colore per campione, il "morphing" dalla finestra rettangolare alle altre |
| `m09-parzen-contro-knn` | strato `knn` con K, r_K, V_K e p̂_K nelle formule, h e K regolabili | due grafici impilati con asse comune, selettore N = 1, 16, 256, ∞ |
| `m09-galleria-kernel-base`, `m09-galleria-kernel-code` | tutti i kernel del corso, h regolabile, stima sui dati | il grafico della forma del kernel sopra la stima, la lente |
| `m09-piu-campioni-h-piu-stretto` | stima contro verità, ISE, h* con `optimalBandwidth` | slider di N con ricampionamento a seed, grafico ISE(h), grafico log-log di h* contro N |
| `m09-cinque-campioni-tre-h`, `m09-delta-ampiezza-larghezza` | nulla: sono in due dimensioni (pianta, superficie) | un motore `density2d` |

### Limiti del motore

Una sola dimensione; terreno in SVG (fino a qualche decina di campioni); campioni aggiunti e tolti, non trascinati; un solo grafico; asse verticale fisso; i timbri di regime dipendono solo da h. La verifica della sfida `min-ise` cerca h* in 12-55 ms (N da 12 a 40): si fa al clic, mai a ogni render. Ciò che serve oltre si aggiunge al motore con un campo nuovo del preset e i suoi test, senza rompere i preset esistenti.

### Controllo finale di un preset

1. `meta.concepts` e i numeri della specifica tornano nei test.
2. Ogni didascalia, termine, nota e formula compila con KaTeX in modalità severa, per N = 1 e per l'N dello scenario.
3. La sfida è tarata (stato iniziale non basta, un valore raggiungibile basta, l'indizio funziona).
4. `npx vitest run src/widgets`, `npx tsc -p tsconfig.app.json --noEmit`, `npx oxlint src/widgets` puliti.
