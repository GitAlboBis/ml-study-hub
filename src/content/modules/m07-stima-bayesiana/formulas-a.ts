// Formule del foglio m07 (stima bayesiana), concetti c01-c31 dell'inventario.
// Convenzione condivisa: una voce per ogni stringa LaTeX di concepts[].latex, id "f-<concetto>" per la prima,
// "f-<concetto>-2", "f-<concetto>-3"... per le successive. Il campo latex è copiato dall'inventario
// (verificato sulle immagini di ch2 p33-37 e part1 p26-28) e scripts/formula-coverage.ts lo ritrova per confronto.
// importance = examRelevance del concetto. c01-c05 e c12 non hanno LaTeX nell'inventario: nessuna voce.
// Esempio numerico ricorrente: i salmoni dell'esempio sintetico del foglio (sigma^2 = 4, mu0 = 10, sigma0^2 = 9,
// N = 4 campioni 12.1, 13.4, 11.2, 13.3, media 12.5 -> muN = 12.25, sigmaN^2 = 0.9).
// Le forme equivalenti non scritte nella fonte (f-c28-2, f-c28-3, f-c29-2) lo dicono nel testo.
import { md } from '../../types'
import type { Formula } from '../../types'

export const formulasA: Formula[] = [
  // --- c06 Ipotesi 1: forma nota ------------------------------------------------------------------
  {
    id: 'f-c06',
    name: 'Ipotesi 1: densità parametrica di forma nota',
    nameEn: 'Known density form',
    latex: md`p(\mathbf{x}\,|\,\boldsymbol{\theta})`,
    explain: md`Prima delle tre ipotesi di base (*basic assumptions*) della stima bayesiana (*Bayesian estimation*): la **forma** della densità $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota (*the form of the density is assumed to be known*), il **valore** del vettore dei parametri $\boldsymbol{\theta}$ no (*is not known exactly*). Sai per esempio che la luminosità di un salmone segue una gaussiana, ma non ne conosci la media. È la stessa ipotesi della stima a massima verosimiglianza (*Maximum Likelihood*, ML): i due metodi partono dallo stesso modello parametrico e si separano su come trattano $\boldsymbol{\theta}$. Le note la chiamano *Known Density Form* e parlano di *likelihood density* $p(\mathbf{x}\,|\,\boldsymbol{\theta})$. Nella catena che porta alla formula chiave serve così: noto $\boldsymbol{\theta}$, la distribuzione di $\mathbf{x}$ è completamente determinata, ed è questo che permette di scrivere $p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})=p(\mathbf{x}\,|\,\boldsymbol{\theta})$.`,
    symbols: [
      { s: md`\mathbf{x}`, meaning: md`vettore delle feature: un'osservazione` },
      { s: md`\boldsymbol{\theta}`, meaning: md`vettore dei parametri della densità, di valore non noto esattamente (per una gaussiana univariata $[\mu,\sigma^2]$)` },
      { s: md`p(\mathbf{x}\,|\,\boldsymbol{\theta})`, meaning: md`densità parametrica di forma nota: per ogni $\boldsymbol{\theta}$ fissato è una densità in $\mathbf{x}$ (nelle note *likelihood density*)` },
    ],
    whenToUse: md`All'orale, quando elenchi le tre ipotesi della stima bayesiana: forma della densità nota, prior noto, campioni indipendenti. Questa è la prima.`,
    pitfalls: md`«Non noto esattamente» non vuol dire «senza informazione»: ciò che sai su $\boldsymbol{\theta}$ prima dei dati sta nel prior $p(\boldsymbol{\theta})$ (ipotesi 2). E non confondere $p(\mathbf{x}\,|\,\boldsymbol{\theta})$, densità di una singola osservazione, con $p(\boldsymbol{X}\,|\,\boldsymbol{\theta})$, verosimiglianza dell'intero insieme dei campioni.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}\,|\,\boxed{\;?\;})`,
        answer: md`\boldsymbol{\theta}`,
        distractors: [md`\boldsymbol{X}`, md`\hat{\boldsymbol{\theta}}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 33 },
      { doc: 'part1', page: 26 },
    ],
  },

  // --- c07 Ipotesi 2: prior noto ------------------------------------------------------------------
  {
    id: 'f-c07',
    name: 'Ipotesi 2: densità a priori del parametro',
    nameEn: 'Prior knowledge: known a priori density',
    latex: md`p(\boldsymbol{\theta})`,
    explain: md`Seconda ipotesi: la conoscenza iniziale (*initial knowledge*) su $\boldsymbol{\theta}$ è contenuta in una densità a priori nota (*known a priori density*) $p(\boldsymbol{\theta})$, il prior. Dice quali valori del parametro ritieni plausibili prima di osservare qualunque campione: le note parlano di convinzioni o informazioni (*beliefs or information*) sul parametro *before considering any observations*. «Nota» significa che forma e parametri del prior sono fissati prima dei dati, per esempio dallo storico o dal parere di un esperto. È l'ingrediente che la stima ML non ha: in ML $\boldsymbol{\theta}$ è un numero fisso, qui è una variabile aleatoria (*random variable*) con la sua distribuzione. Esempio: dallo storico dell'impianto sai che la luminosità media di una partita di salmoni sta attorno a 10, con varianza 9; nel caso gaussiano il prior diventa $p(\mu)\sim N(\mu_0,\sigma_0^2)$ con $\mu_0=10$ e $\sigma_0^2=9$.`,
    symbols: [
      { s: md`\boldsymbol{\theta}`, meaning: md`vettore dei parametri, trattato come variabile aleatoria` },
      { s: md`p(\boldsymbol{\theta})`, meaning: md`densità a priori (*a priori density*, prior): distribuzione di $\boldsymbol{\theta}$ prima di vedere i dati` },
    ],
    whenToUse: md`Quando spieghi la differenza tra ML e Bayes: il prior è il modo in cui la stima bayesiana incorpora la conoscenza a priori (*incorporating prior knowledge*), il suo vantaggio principale quando i dati sono pochi.`,
    pitfalls: md`Il prior riguarda il **parametro**, non le osservazioni: $p(\boldsymbol{\theta})$ non è $p(\mathbf{x})$. Non va confuso con le probabilità a priori delle classi $P(\omega_i)$ della teoria della decisione bayesiana: stesso aggettivo, oggetti diversi. Un prior molto sicuro (varianza piccolissima) rallenta l'apprendimento: servono molti dati per spostarlo.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\boxed{\;?\;})`,
        answer: md`\boldsymbol{\theta}`,
        distractors: [md`\boldsymbol{\theta}\,|\,\boldsymbol{X}`, md`\boldsymbol{X}\,|\,\boldsymbol{\theta}`, md`\mathbf{x}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 33 },
      { doc: 'part1', page: 27 },
    ],
  },

  // --- c08 Ipotesi 3: campioni indipendenti -------------------------------------------------------
  {
    id: 'f-c08',
    name: "Ipotesi 3: l'insieme degli N campioni indipendenti",
    nameEn: 'Independently drawn samples',
    latex: md`\boldsymbol{X}=\{\mathbf{x}_1,\mathbf{x}_2,\ldots,\mathbf{x}_N\}`,
    explain: md`Terza ipotesi: il resto della conoscenza (*the rest of our knowledge*) su $\boldsymbol{\theta}$ sta in un insieme $\boldsymbol{X}$ di $N$ campioni $\mathbf{x}_1,\ldots,\mathbf{x}_N$ estratti in modo indipendente (*drawn independently*) secondo la densità vera e ignota $p(\mathbf{x})$. Le note la chiamano *Independently Drawn Samples*: è la conoscenza aggiuntiva che permette di usare le osservazioni per raffinare la stima. L'indipendenza ha una conseguenza precisa, usata due slide dopo: la densità congiunta dei campioni dato il parametro si fattorizza in una produttoria, $p(\boldsymbol{X}\,|\,\boldsymbol{\theta})=\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})$ (vedi [la verosimiglianza come produttoria](#formula:f-c21)). Esempio: misuri la luminosità di $N=4$ salmoni presi a caso dalla partita, $\boldsymbol{X}=\{12.1,\;13.4,\;11.2,\;13.3\}$.`,
    symbols: [
      { s: md`\boldsymbol{X}`, meaning: md`insieme dei campioni di training (*training set*)` },
      { s: md`N`, meaning: md`numero di campioni` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo campione, $k=1,\ldots,N$` },
      { s: md`p(\mathbf{x})`, meaning: md`densità vera e ignota da cui i campioni sono estratti; nel modello è $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ con il valore vero di $\boldsymbol{\theta}$` },
    ],
    whenToUse: md`Terza delle tre ipotesi da elencare all'orale. Citala anche alla domanda «why we can use the separate products of the probabilities»: il prodotto viene da qui.`,
    pitfalls: md`Due oggetti con simboli simili: $\boldsymbol{X}$ maiuscolo in grassetto è l'insieme dei campioni, $\mathbf{x}$ minuscolo una singola osservazione (nella formula chiave, un'osservazione nuova). E l'indipendenza è un'ipotesi: con campioni correlati (per esempio misure ripetute dello stesso salmone) la produttoria non vale più.`,
    importance: 3,
    blanks: [
      {
        masked: md`\boxed{\;?\;}=\{\mathbf{x}_1,\mathbf{x}_2,\ldots,\mathbf{x}_N\}`,
        answer: md`\boldsymbol{X}`,
        distractors: [md`\mathbf{x}`, md`\boldsymbol{\theta}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 33 },
      { doc: 'part1', page: 27 },
    ],
  },

  // --- c09 Densità a posteriori -------------------------------------------------------------------
  {
    id: 'f-c09',
    name: 'Densità a posteriori del parametro',
    nameEn: 'Posterior density of the parameter',
    latex: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})`,
    explain: md`La terza ipotesi, combinata con il prior, si converte in una densità a posteriori (*posterior density*) $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$: la distribuzione del parametro dopo aver visto i campioni. Si spera (*we hope*) che abbia un picco stretto attorno al valore vero di $\boldsymbol{\theta}$ (*sharply peaked about the true value*): secondo le note riflette una forte convinzione (*strong belief*) in un valore specifico del parametro dopo l'osservazione dei dati. Più il picco è stretto, più la posterior si comporta come una stima puntuale, ed è così che Bayes si avvicina a ML quando i campioni sono tanti. Esempio: con il prior $N(10,9)$ sulla luminosità media e i quattro salmoni di media $12.5$, la posterior della media è $N(12.25,\;0.9)$: la varianza è scesa da 9 a 0.9, il picco si è stretto.`,
    symbols: [
      { s: md`\boldsymbol{\theta}`, meaning: md`parametro, variabile aleatoria` },
      { s: md`\boldsymbol{X}`, meaning: md`campioni osservati, su cui si condiziona` },
      { s: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})`, meaning: md`densità a posteriori: quanto è plausibile ogni valore di $\boldsymbol{\theta}$ dopo aver visto $\boldsymbol{X}$` },
    ],
    whenToUse: md`È il cuore del metodo: la slide successiva dice che il problema base del *Bayesian learning* è proprio calcolare $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$. Tienila distinta dalla densità desiderata $p(\mathbf{x}\,|\,\boldsymbol{X})$, che è l'obiettivo finale.`,
    pitfalls: md`La posterior è una densità su $\boldsymbol{\theta}$, non su $\mathbf{x}$: integra a 1 rispetto a $\boldsymbol{\theta}$. Il picco stretto è una speranza, non una garanzia: con pochi dati o un prior sbagliato la posterior può essere larga o centrata lontano dal valore vero.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\boxed{\;?\;})`,
        answer: md`\boldsymbol{\theta}\,|\,\boldsymbol{X}`,
        distractors: [md`\boldsymbol{X}\,|\,\boldsymbol{\theta}`, md`\mathbf{x}\,|\,\boldsymbol{X}`, md`\boldsymbol{\theta}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 34 },
      { doc: 'part1', page: 27 },
    ],
  },

  // --- c10 Obiettivo: densità desiderata ----------------------------------------------------------
  {
    id: 'f-c10',
    name: 'Obiettivo: la densità desiderata dati i campioni',
    nameEn: 'Desired (predictive) density given the samples',
    latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})`,
    explain: md`L'obiettivo (*the goal*) non è $\boldsymbol{\theta}$ in sé ma la densità delle feature condizionata ai campioni osservati, $p(\mathbf{x}\,|\,\boldsymbol{X})$, da rendere il più vicina possibile (*as close as possible*) alla densità vera e ignota $p(\mathbf{x})$. La slide 36 la chiama densità desiderata (*desired probability density*); le note la chiamano densità predittiva (*predictive density*): la probabilità di una nuova osservazione $\mathbf{x}$ dati i dati $\boldsymbol{X}$. Nel contesto del capitolo è la densità che serve al classificatore, per esempio la densità condizionata alla classe $p(\mathbf{x}\,|\,\omega_i)$, stimata una classe alla volta con i campioni di quella classe. Esempio: nel caso dei salmoni risulta $p(x\,|\,\boldsymbol{X})\sim N(12.25,\;4+0.9)$, una gaussiana un po' più larga di quella del modello perché tiene conto dell'incertezza residua sulla media.`,
    symbols: [
      { s: md`\mathbf{x}`, meaning: md`nuova osservazione` },
      { s: md`\boldsymbol{X}`, meaning: md`campioni di training` },
      { s: md`p(\mathbf{x}\,|\,\boldsymbol{X})`, meaning: md`densità desiderata o predittiva (*desired / predictive density*)` },
      { s: md`p(\mathbf{x})`, meaning: md`densità vera e ignota che si vuole approssimare` },
    ],
    whenToUse: md`Per dire all'orale dove vuole arrivare la stima bayesiana: si parte da qui e si scende a $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ con i tre passi della [dimostrazione della formula chiave](#derivation:der01).`,
    pitfalls: md`$p(\mathbf{x}\,|\,\boldsymbol{X})$ non è $p(\mathbf{x}\,|\,\boldsymbol{\theta})$: la prima non contiene più il parametro (è stato integrato via), la seconda sì. E non è neppure $p(\mathbf{x}\,|\,\hat{\boldsymbol{\theta}})$, la densità che si ottiene inserendo una stima puntuale come fa ML.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\boxed{\;?\;})`,
        answer: md`\mathbf{x}\,|\,\boldsymbol{X}`,
        distractors: [md`\boldsymbol{\theta}\,|\,\boldsymbol{X}`, md`\mathbf{x}\,|\,\boldsymbol{\theta}`, md`\boldsymbol{X}\,|\,\boldsymbol{\theta}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 34 },
      { doc: 'part1', page: 27 },
      { doc: 'ch2', page: 36 },
    ],
  },

  // --- c11 Passo 1: marginalizzazione -------------------------------------------------------------
  {
    id: 'f-c11',
    name: 'Passo 1: marginalizzazione sul parametro',
    nameEn: 'Step 1: marginalization over the parameter',
    latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x},\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
    explain: md`Primo dei tre passi della slide 34 (*This can be done by*). Il parametro è una variabile aleatoria di valore ignoto: lo si introduce nella densità congiunta di $\mathbf{x}$ e $\boldsymbol{\theta}$, sempre condizionata ai campioni, e lo si elimina integrando. È la marginalizzazione (*marginalization*), la versione continua della legge della probabilità totale: integrando la congiunta su tutti i valori di $\boldsymbol{\theta}$ resta la marginale di $\mathbf{x}$. La nota inclinata della slide ricorda che l'integrazione si estende all'intero spazio dei parametri (*the integration extends over the entire parameter space*): nel caso gaussiano con sola media ignota l'integrale corre su tutto l'asse reale di $\mu$. Il passo di per sé non semplifica nulla; prepara la fattorizzazione del passo 2.`,
    symbols: [
      { s: md`p(\mathbf{x},\boldsymbol{\theta}\,|\,\boldsymbol{X})`, meaning: md`densità congiunta di $\mathbf{x}$ e $\boldsymbol{\theta}$ condizionata ai campioni` },
      { s: md`\int\cdot\,\mathrm{d}\boldsymbol{\theta}`, meaning: md`integrale su tutto lo spazio dei parametri (se $\boldsymbol{\theta}$ ha $d$ componenti, integrale $d$-dimensionale)` },
      { s: md`\mathrm{d}\boldsymbol{\theta}`, meaning: md`elemento di integrazione nello spazio dei parametri` },
    ],
    whenToUse: md`Primo passo da scrivere alla lavagna quando chiedono da dove viene la formula chiave. Tutta la catena è nella [dimostrazione della formula chiave](#derivation:der01).`,
    pitfalls: md`Si integra in $\mathrm{d}\boldsymbol{\theta}$, non in $\mathrm{d}\mathbf{x}$: il risultato deve restare una funzione di $\mathbf{x}$. Il condizionamento a $\boldsymbol{X}$ resta su tutti i termini: si marginalizza solo $\boldsymbol{\theta}$.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\boxed{\;?\;}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
        answer: md`\mathbf{x},\boldsymbol{\theta}`,
        distractors: [md`\mathbf{x}`, md`\boldsymbol{\theta}`],
      },
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x},\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\boxed{\;?\;}`,
        answer: md`\mathrm{d}\boldsymbol{\theta}`,
        distractors: [md`\mathrm{d}\mathbf{x}`, md`\mathrm{d}\boldsymbol{X}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 34 },
      { doc: 'part1', page: 27 },
    ],
  },

  // --- c13 Passo 2: fattorizzazione con Bayes -----------------------------------------------------
  {
    id: 'f-c13',
    name: 'Passo 2: fattorizzazione della congiunta',
    nameEn: 'Step 2: factorization of the joint density (Bayes theorem)',
    latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
    explain: md`Secondo passo (*By using Bayes theorem*): la congiunta si scrive come prodotto di una condizionata per una marginale, $p(\mathbf{x},\boldsymbol{\theta}\,|\,\boldsymbol{X})=p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$, con tutto condizionato a $\boldsymbol{X}$. La slide lo chiama teorema di Bayes; a rigore è la regola del prodotto (*product rule*) delle probabilità condizionate, la stessa identità da cui il teorema di Bayes discende. Sostituendo nell'integrale compaiono due fattori: il primo è la densità di $\mathbf{x}$ quando conosci sia il parametro sia i campioni, il secondo è già la posterior del parametro. L'integrale ha ora la forma di una media, con $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ come peso.`,
    symbols: [
      { s: md`p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})`, meaning: md`densità di $\mathbf{x}$ dato il parametro e dati i campioni` },
      { s: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})`, meaning: md`densità a posteriori del parametro, che fa da peso` },
      { s: md`\mathrm{d}\boldsymbol{\theta}`, meaning: md`integrazione su tutto lo spazio dei parametri` },
    ],
    whenToUse: md`Secondo passo della catena della slide 34, da giustificare a voce: «regola del prodotto, condizionando tutto a $\boldsymbol{X}$».`,
    pitfalls: md`L'ordine dei fattori conta: si condiziona $\mathbf{x}$ a $\boldsymbol{\theta}$, non il contrario. Scrivere $p(\boldsymbol{\theta}\,|\,\mathbf{x},\boldsymbol{X})\,p(\mathbf{x}\,|\,\boldsymbol{X})$ è altrettanto vero ma porta fuori strada, perché rimette dentro l'incognita $p(\mathbf{x}\,|\,\boldsymbol{X})$. Il condizionamento a $\boldsymbol{X}$ nel primo fattore resta finché non lo toglie il passo 3.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})\,\boxed{\;?\;}\,\mathrm{d}\boldsymbol{\theta}`,
        answer: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})`,
        distractors: [md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})`, md`p(\boldsymbol{\theta})`, md`p(\mathbf{x}\,|\,\boldsymbol{X})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 34 },
      { doc: 'part1', page: 27 },
    ],
  },

  // --- c14 Passo 3: noto θ, x è completamente nota ------------------------------------------------
  {
    id: 'f-c14',
    name: 'Passo 3: noto il parametro, i campioni non aggiungono nulla',
    nameEn: 'Step 3: x is completely known once θ is known',
    latex: md`p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})=p(\mathbf{x}\,|\,\boldsymbol{\theta})`,
    explain: md`Terzo passo: la distribuzione di $\mathbf{x}$ è completamente nota una volta noto il valore del vettore dei parametri (*the distribution of $\mathbf{x}$ is completely known once we know the value of the parameter vector*). Per l'ipotesi 1 la forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota; se in più conosci $\boldsymbol{\theta}$, i campioni $\boldsymbol{X}$ non aggiungono nulla su una nuova osservazione. Le note: *we can remove $\boldsymbol{X}$ from the first density*. È un'indipendenza condizionata (*conditional independence*): dato $\boldsymbol{\theta}$, la nuova osservazione e i campioni di training sono indipendenti, perché sono estratti tutti in modo indipendente dalla stessa densità. Esempio: se sapessi che la media vera della partita è $\mu=12$, la luminosità del prossimo salmone sarebbe $N(12,4)$ qualunque cosa abbiano misurato i quattro salmoni precedenti.`,
    symbols: [
      { s: md`p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})`, meaning: md`densità di $\mathbf{x}$ dato il parametro e dati i campioni` },
      { s: md`p(\mathbf{x}\,|\,\boldsymbol{\theta})`, meaning: md`densità parametrica di forma nota (ipotesi 1)` },
    ],
    whenToUse: md`Ultimo passo prima della formula chiave: all'orale di' esplicitamente quali ipotesi lo giustificano (forma nota e campioni indipendenti).`,
    pitfalls: md`Si toglie $\boldsymbol{X}$, non $\boldsymbol{\theta}$: $p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})$ non diventa $p(\mathbf{x}\,|\,\boldsymbol{X})$. L'uguaglianza vale solo dato $\boldsymbol{\theta}$: senza condizionare al parametro, i campioni informano eccome su $\mathbf{x}$, ed è proprio ciò che misura la posterior.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})=\boxed{\;?\;}`,
        answer: md`p(\mathbf{x}\,|\,\boldsymbol{\theta})`,
        distractors: [md`p(\mathbf{x}\,|\,\boldsymbol{X})`, md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})`, md`p(\mathbf{x})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 34 },
      { doc: 'part1', page: 27 },
    ],
  },

  // --- c15 Formula chiave -------------------------------------------------------------------------
  {
    id: 'f-c15',
    name: 'Formula chiave della stima bayesiana',
    nameEn: 'Bayesian estimation key formula',
    latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
    explain: md`La formula conclusiva della slide 34, in rosso e con l'icona del diamante (risultato da ricordare): la densità desiderata è l'integrale su $\boldsymbol{\theta}$ del prodotto tra la densità parametrica $p(\mathbf{x}\,|\,\boldsymbol{\theta})$, di forma nota, e la posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$. Si legge come una media: non conoscendo il valore esatto di $\boldsymbol{\theta}$, la stima bayesiana fa la media di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ su tutti i valori possibili di $\boldsymbol{\theta}$ (*to average $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ over all possible values of $\boldsymbol{\theta}$*), pesata dalla posterior. Le note: un integrale è una forma continua di somma, e la somma è un tipo di media. I campioni agiscono su $p(\mathbf{x}\,|\,\boldsymbol{X})$ solo attraverso la posterior, quindi tutta la difficoltà si sposta sul calcolo di $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$. Esempio discreto per fissare l'idea: se la media dei salmoni potesse valere solo 10 o 12, con probabilità a posteriori 0.3 e 0.7, avresti $p(x\,|\,\boldsymbol{X})=0.3\,N(x;10,4)+0.7\,N(x;12,4)$, una miscela di due modelli ($N(x;m,v)$ è la gaussiana in $x$ di media $m$ e varianza $v$). Con infiniti valori la somma diventa l'integrale; nel caso gaussiano il risultato è la [densità predittiva gaussiana](#formula:f-c42).`,
    symbols: [
      { s: md`p(\mathbf{x}\,|\,\boldsymbol{X})`, meaning: md`densità desiderata (predittiva)` },
      { s: md`p(\mathbf{x}\,|\,\boldsymbol{\theta})`, meaning: md`densità parametrica di forma nota (ipotesi 1): il «modello» per un valore fissato di $\boldsymbol{\theta}$` },
      { s: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})`, meaning: md`densità a posteriori del parametro: il peso della media` },
      { s: md`\mathrm{d}\boldsymbol{\theta}`, meaning: md`integrazione su tutto lo spazio dei parametri` },
    ],
    whenToUse: md`Va scritta a memoria: è la risposta a «come si ottiene la densità nella stima bayesiana?» e il punto di partenza del confronto con ML, che invece inserisce un solo valore $\hat{\boldsymbol{\theta}}$ in $p(\mathbf{x}\,|\,\hat{\boldsymbol{\theta}})$. Il widget [la densità stimata come media pesata di tanti modelli](#widget:m07-media-pesata-dei-modelli) la mostra all'opera.`,
    pitfalls: md`Il peso è la posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$, non il prior $p(\boldsymbol{\theta})$: con il prior otterresti la densità prima di aver visto i dati. Il risultato in genere **non** ha la stessa forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$, perché è una miscela; nel caso gaussiano torna gaussiano, ma con varianza aumentata.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,\boxed{\;?\;}\,\mathrm{d}\boldsymbol{\theta}`,
        answer: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})`,
        distractors: [md`p(\boldsymbol{\theta})`, md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})`, md`p(\mathbf{x}\,|\,\boldsymbol{X})`],
      },
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int \boxed{\;?\;}\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
        answer: md`p(\mathbf{x}\,|\,\boldsymbol{\theta})`,
        distractors: [md`p(\boldsymbol{\theta}\,|\,\mathbf{x})`, md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})`, md`p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})\,p(\boldsymbol{\theta})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 34 },
      { doc: 'part1', page: 27 },
      { doc: 'ch2', page: 35 },
    ],
  },

  // --- c19 Posterior dalla formula di Bayes (due forme) -------------------------------------------
  {
    id: 'f-c19',
    name: 'Posterior dalla formula di Bayes',
    nameEn: 'Posterior from Bayes formula',
    latex: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}}`,
    explain: md`Il problema base del *Bayesian learning* è calcolare $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$, e la prima delle due relazioni della slide 35 lo fa con la formula di Bayes (*From Bayes formula*): la posterior è la verosimiglianza dei campioni $p(\boldsymbol{X}\,|\,\boldsymbol{\theta})$ per il prior $p(\boldsymbol{\theta})$, diviso l'integrale su $\boldsymbol{\theta}$ dello stesso prodotto. Al numeratore c'è tutto ciò che dipende da $\boldsymbol{\theta}$; il denominatore è un numero (dipende da $\boldsymbol{X}$ ma non da $\boldsymbol{\theta}$) che rende uguale a 1 l'area della posterior. Così la posterior è espressa con quantità note: il prior (ipotesi 2) e la verosimiglianza, che per l'ipotesi 3 è un prodotto di densità di forma nota (ipotesi 1). Esempio discreto: due valori possibili della media, prior 0.5 e 0.5, verosimiglianze dei dati 0.02 e 0.06. Il denominatore vale $0.5\cdot 0.02+0.5\cdot 0.06=0.04$ e le posterior sono $0.01/0.04=0.25$ e $0.03/0.04=0.75$: i dati hanno spostato la fiducia verso il secondo valore.`,
    symbols: [
      { s: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})`, meaning: md`densità a posteriori del parametro` },
      { s: md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})`, meaning: md`verosimiglianza (*likelihood*) dell'intero insieme dei campioni, letta come funzione di $\boldsymbol{\theta}$` },
      { s: md`p(\boldsymbol{\theta})`, meaning: md`densità a priori` },
      { s: md`\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}`, meaning: md`costante di normalizzazione, pari a $p(\boldsymbol{X})$: non dipende da $\boldsymbol{\theta}$` },
    ],
    whenToUse: md`Prima relazione da scrivere quando chiedono come si calcola la posterior; subito dopo va la produttoria dell'ipotesi di indipendenza. La catena completa è nella [dimostrazione del calcolo della posterior](#derivation:der02).`,
    pitfalls: md`Al denominatore c'è l'integrale **del prodotto** verosimiglianza per prior, non della sola verosimiglianza. Il denominatore è anche l'ostacolo pratico: un integrale su tutto lo spazio dei parametri, che in generale non ha forma chiusa; è uno dei motivi del maggior costo computazionale della stima bayesiana rispetto a ML.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\boxed{\;?\;}}`,
        answer: md`\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}`,
        distractors: [
          md`\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}`,
          md`p(\boldsymbol{\theta})`,
          md`\int p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}`,
        ],
      },
      {
        masked: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\frac{\boxed{\;?\;}}{\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}}`,
        answer: md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})`,
        distractors: [md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})`, md`p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 35 },
      { doc: 'part1', page: 27 },
    ],
  },
  {
    id: 'f-c19-2',
    name: 'Posterior: il denominatore nella forma delle note',
    nameEn: 'Bayes formula: the denominator as written in the notes',
    latex: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{p(\boldsymbol{X})}=\frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}}`,
    explain: md`Le note scrivono il passaggio intermedio che la slide salta: prima la formula di Bayes nella forma canonica, con la densità dei campioni $p(\boldsymbol{X})$ al denominatore, poi $p(\boldsymbol{X})$ sostituita dal suo integrale. Le due scritture coincidono perché $p(\boldsymbol{X})=\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}$, per marginalizzazione su $\boldsymbol{\theta}$. La prima uguaglianza è la formula di Bayes di sempre (posterior uguale a verosimiglianza per prior, diviso la densità dei dati); la seconda la rende calcolabile con le sole quantità note per ipotesi.`,
    symbols: [
      { s: md`p(\boldsymbol{X})`, meaning: md`densità marginale dei campioni, al denominatore nelle note; in letteratura evidenza (*evidence*), nome che la fonte non usa` },
      { s: md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})`, meaning: md`verosimiglianza dei campioni` },
      { s: md`p(\boldsymbol{\theta})`, meaning: md`densità a priori` },
    ],
    whenToUse: md`Se all'orale parti dalla formula di Bayes «da manuale», questa è la forma che fa da ponte verso quella della slide.`,
    pitfalls: md`$p(\boldsymbol{X})$ non è il prior e non dipende da $\boldsymbol{\theta}$: per questo, quando interessa solo la forma della posterior, si scrive $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\propto p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})$ e si recupera la costante alla fine.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\boxed{\;?\;}}=\frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}}`,
        answer: md`p(\boldsymbol{X})`,
        distractors: [md`p(\boldsymbol{\theta})`, md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})`, md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})`],
      },
    ],
    source: [
      { doc: 'part1', page: 27 },
      { doc: 'ch2', page: 35 },
    ],
  },

  // --- c20 Denominatore p(X) ----------------------------------------------------------------------
  {
    id: 'f-c20',
    name: 'Il denominatore p(X): integrale di normalizzazione',
    nameEn: 'Normalization integral p(X)',
    latex: md`p(\boldsymbol{X})=\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}`,
    explain: md`La densità dei campioni si ottiene marginalizzando su $\boldsymbol{\theta}$ la congiunta $p(\boldsymbol{X},\boldsymbol{\theta})=p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})$: è la media della verosimiglianza pesata dal prior. Poiché $\boldsymbol{\theta}$ è integrato via, il risultato non dipende da $\boldsymbol{\theta}$: per la posterior è solo una costante che ne garantisce l'area unitaria (*normalization*). Dipende però dai dati $\boldsymbol{X}$. Nell'esempio gaussiano questa costante confluisce nel fattore di normalizzazione $\alpha=1/p(\boldsymbol{X})$. Esempio discreto: con prior 0.5 e 0.5 e verosimiglianze 0.02 e 0.06, $p(\boldsymbol{X})=0.5\cdot 0.02+0.5\cdot 0.06=0.04$.`,
    symbols: [
      { s: md`p(\boldsymbol{X})`, meaning: md`densità marginale dei campioni, costante rispetto a $\boldsymbol{\theta}$` },
      { s: md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})`, meaning: md`densità congiunta dei campioni e del parametro` },
    ],
    whenToUse: md`Per giustificare perché nella posterior si può ragionare «a meno di una costante»: è la ragione del fattore $\alpha$ della slide 36.`,
    pitfalls: md`Costante rispetto a $\boldsymbol{\theta}$ non vuol dire costante in assoluto: cambia se cambiano i dati. Per questo nella forma esponenziale della posterior la costante può assorbire anche termini che contengono i campioni ma non il parametro.`,
    importance: 2,
    blanks: [
      {
        masked: md`p(\boldsymbol{X})=\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,\boxed{\;?\;}\,\mathrm{d}\boldsymbol{\theta}`,
        answer: md`p(\boldsymbol{\theta})`,
        distractors: [md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})`, md`p(\mathbf{x}\,|\,\boldsymbol{\theta})`],
      },
    ],
    source: [
      { doc: 'part1', page: 27 },
      { doc: 'ch2', page: 35 },
    ],
  },

  // --- c21 Verosimiglianza come produttoria -------------------------------------------------------
  {
    id: 'f-c21',
    name: 'Verosimiglianza di campioni indipendenti',
    nameEn: 'Likelihood of independently drawn samples',
    latex: md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})=\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})`,
    explain: md`Seconda relazione della slide 35 (*From independence assumption*, nelle note *among the samples*): i campioni sono estratti in modo indipendente (ipotesi 3), quindi la densità congiunta dell'insieme $\boldsymbol{X}$ dato $\boldsymbol{\theta}$ è il prodotto delle densità dei singoli campioni, ciascuna di forma nota (ipotesi 1). Letta come funzione di $\boldsymbol{\theta}$ con i dati fissati è la funzione di verosimiglianza (*likelihood*): dice quanto ogni valore del parametro rende probabili i campioni osservati. È la stessa fattorizzazione della stima ML, che la massimizza; qui invece la si moltiplica per il prior e la si normalizza. Esempio: con il modello $N(\mu,4)$ e i quattro salmoni $12.1,\;13.4,\;11.2,\;13.3$, la verosimiglianza di $\mu$ è il prodotto di quattro gaussiane, massimo in $\mu=12.5$, la media campionaria.`,
    symbols: [
      { s: md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})`, meaning: md`verosimiglianza dell'insieme dei campioni` },
      { s: md`\prod_{k=1}^{N}`, meaning: md`produttoria sugli $N$ campioni` },
      { s: md`p(\mathbf{x}_k\,|\,\boldsymbol{\theta})`, meaning: md`densità del $k$-esimo campione, di forma nota` },
      { s: md`N`, meaning: md`numero di campioni` },
    ],
    whenToUse: md`È la risposta alla domanda della banca «why we can use the separate products of the probabilities and what the Likelihood describe»: il prodotto viene dall'indipendenza dei campioni, la verosimiglianza descrive quanto i dati sono probabili al variare del parametro.`,
    pitfalls: md`È un prodotto, non una somma: diventa una somma solo passando al logaritmo, come si fa in ML (*log-likelihood*). Senza indipendenza la fattorizzazione non vale. Come funzione di $\boldsymbol{\theta}$ non è una densità: non integra a 1 rispetto al parametro, ed è per questo che nella posterior serve il denominatore.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})=\boxed{\;?\;}\,p(\mathbf{x}_k\,|\,\boldsymbol{\theta})`,
        answer: md`\prod_{k=1}^{N}`,
        distractors: [md`\sum_{k=1}^{N}`, md`\frac{1}{N}\sum_{k=1}^{N}`, md`\max_{k}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 35 },
      { doc: 'part1', page: 27 },
    ],
  },

  // --- c22 Caso gaussiano: impostazione -----------------------------------------------------------
  {
    id: 'f-c22',
    name: 'Caso gaussiano univariato: il vettore dei parametri',
    nameEn: 'Univariate Gaussian case: the parameter vector, only the mean unknown',
    latex: md`\boldsymbol{\theta}=[\mu,\sigma^2]`,
    explain: md`L'esempio della slide 36 calcola esplicitamente la posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ e la densità desiderata $p(\mathbf{x}\,|\,\boldsymbol{X})$ sotto due ipotesi: $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è una gaussiana univariata (*univariate Gaussian distribution*), e nel vettore $\boldsymbol{\theta}=[\mu,\sigma^2]$ l'unico parametro ignoto è $\mu$ (*the only unknown parameter is $\mu$*). La varianza $\sigma^2$ è nota e resta un numero fisso in tutto l'esempio; la variabile aleatoria su cui si fa inferenza è la sola media, quindi tutte le densità «su $\boldsymbol{\theta}$» diventano densità su $\mu$ e gli integrali in $\mathrm{d}\boldsymbol{\theta}$ diventano integrali in $\mathrm{d}\mu$ su tutto l'asse reale. Le note: il parametro di interesse è la media, la varianza è nota. Scenario: la luminosità dei salmoni ha varianza nota $\sigma^2=4$, ma la media della nuova partita è ignota.`,
    symbols: [
      { s: md`\boldsymbol{\theta}`, meaning: md`vettore dei parametri della gaussiana` },
      { s: md`\mu`, meaning: md`media, unico parametro ignoto: è la variabile aleatoria dell'inferenza` },
      { s: md`\sigma^2`, meaning: md`varianza, nota` },
    ],
    whenToUse: md`Per impostare l'esempio che all'orale chiedono di svolgere: di' subito quali parametri sono noti e quale è ignoto.`,
    pitfalls: md`Non confondere i parametri del modello, $\mu$ e $\sigma^2$, con quelli del prior, $\mu_0$ e $\sigma_0^2$, né con quelli della posterior, $\mu_N$ e $\sigma_N^2$. Se anche $\sigma^2$ fosse ignota i conti cambierebbero: la posterior congiunta di $(\mu,\sigma^2)$ non sarebbe più una gaussiana.`,
    importance: 3,
    blanks: [
      {
        masked: md`\boldsymbol{\theta}=[\boxed{\;?\;}]`,
        answer: md`\mu,\sigma^2`,
        distractors: [md`\mu_0,\sigma_0^2`, md`\mu_N,\sigma_N^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 36 },
      { doc: 'part1', page: 27 },
      { doc: 'part1', page: 28 },
    ],
  },

  // --- c23 Modello dei dati -----------------------------------------------------------------------
  {
    id: 'f-c23',
    name: 'Modello dei dati: gaussiana di media ignota',
    nameEn: 'Data model: Gaussian with unknown mean',
    latex: md`p(\mathbf{x}\,|\,\mu)\sim N(\mu,\sigma^2)`,
    explain: md`Di conseguenza (*Accordingly*), visto che l'unico parametro ignoto è $\mu$, la densità parametrica si scrive condizionata alla sola media: $p(\mathbf{x}\,|\,\mu)=\frac{1}{\sqrt{2\pi}\sigma}\exp\left[-\frac{1}{2}\left(\frac{\mathbf{x}-\mu}{\sigma}\right)^2\right]$. Le note: la verosimiglianza di un campione segue una gaussiana univariata (*The likelihood follows a univariate Gaussian distribution*). $\sigma^2$ è un numero noto; $\mu$ è la variabile aleatoria. Esempio: con $\sigma^2=4$, se la media vera fosse $\mu=12$, un salmone di luminosità $13.4$ avrebbe densità $\frac{1}{\sqrt{2\pi}\cdot 2}\,e^{-0.245}\approx 0.156$.`,
    symbols: [
      { s: md`\mathbf{x}`, meaning: md`osservazione, scalare nel caso univariato (la slide mantiene il grassetto, le note scrivono $x$)` },
      { s: md`\mu`, meaning: md`media ignota` },
      { s: md`\sigma^2`, meaning: md`varianza nota` },
      { s: md`N(\mu,\sigma^2)`, meaning: md`densità normale di media $\mu$ e varianza $\sigma^2$` },
    ],
    whenToUse: md`Primo dei due ingredienti gaussiani dell'esempio: scrivilo insieme al prior $p(\mu)\sim N(\mu_0,\sigma_0^2)$.`,
    pitfalls: md`Il secondo argomento di $N(\cdot,\cdot)$ è la **varianza** $\sigma^2$, non la deviazione standard. E la densità è condizionata a $\mu$: senza condizionamento $\mathbf{x}$ non è $N(\mu,\sigma^2)$, perché $\mu$ è incerta.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}\,|\,\mu)\sim N(\boxed{\;?\;})`,
        answer: md`\mu,\sigma^2`,
        distractors: [md`\mu_0,\sigma_0^2`, md`\mu_N,\sigma_N^2`, md`\mu_N,\sigma^2+\sigma_N^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 36 },
      { doc: 'part1', page: 28 },
    ],
  },

  // --- c24 Prior gaussiano sulla media ------------------------------------------------------------
  {
    id: 'f-c24',
    name: 'Prior gaussiano sulla media',
    nameEn: 'Gaussian prior on the mean',
    latex: md`p(\mu)\sim N(\mu_0,\sigma_0^2)`,
    explain: md`Ipotesi ulteriore (*further assumption*): anche la conoscenza a priori sulla media è una gaussiana, $p(\mu)=\frac{1}{\sqrt{2\pi}\sigma_0}\exp\left[-\frac{1}{2}\left(\frac{\mu-\mu_0}{\sigma_0}\right)^2\right]$, con parametri noti a priori (*whose parameters are a priori known*). $\mu_0$ è il valore della media che ritieni più plausibile prima dei dati (*prior mean*); $\sigma_0^2$ misura quanto sei incerto su quel valore (*prior variance*). Con $\sigma_0^2$ piccola il prior è deciso e i dati faticano a spostarlo; con $\sigma_0^2$ grande il prior è vago e lascia parlare i dati. Esempio: dallo storico dell'impianto la luminosità media di una partita sta attorno a $\mu_0=10$ con $\sigma_0^2=9$, cioè entro circa $10\pm 6$ con probabilità del 95%.`,
    symbols: [
      { s: md`p(\mu)`, meaning: md`densità a priori della media` },
      { s: md`\mu_0`, meaning: md`media del prior (*prior mean*), nota a priori` },
      { s: md`\sigma_0^2`, meaning: md`varianza del prior (*prior variance*), nota a priori: incertezza sulla media prima dei dati` },
    ],
    whenToUse: md`Secondo ingrediente gaussiano: la scelta di un prior gaussiano su una verosimiglianza gaussiana è ciò che rende la posterior ancora gaussiana.`,
    pitfalls: md`$\mu_0$ e $\sigma_0^2$ non sono media e varianza dei dati: descrivono l'incertezza sul **parametro** $\mu$. $\sigma_0^2$ non va confusa con $\sigma^2$, il rumore delle singole osservazioni. Le note chiamano i parametri del prior «$\mu_0$ and $\sigma_0$»: $\sigma_0$ è la deviazione standard, la varianza è $\sigma_0^2$.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mu)\sim N(\boxed{\;?\;})`,
        answer: md`\mu_0,\sigma_0^2`,
        distractors: [md`\mu,\sigma^2`, md`\mu_N,\sigma_N^2`, md`\mu_0,\sigma^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 36 },
      { doc: 'part1', page: 28 },
    ],
  },

  // --- c25 Posterior con il fattore α -------------------------------------------------------------
  {
    id: 'f-c25',
    name: 'Posterior della media: prodotto normalizzato con il fattore α',
    nameEn: 'Posterior of the mean with normalization factor α',
    latex: md`p(\mu\,|\,\boldsymbol{X})=\alpha\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\mu)\,p(\mu)`,
    explain: md`Usando le due relazioni già viste (*Using formula previously seen*: Bayes più indipendenza) con $\boldsymbol{\theta}=\mu$, la posterior della media è il prodotto delle $N$ verosimiglianze dei singoli campioni per il prior, moltiplicato per $\alpha$. Nella slide $\alpha$ è cerchiato in verde con l'etichetta *Normalization factor*; le note: la posterior è proporzionale al prodotto delle verosimiglianze e del prior (*proportional to the product of the likelihoods and the prior*), e $\alpha$ è solo un fattore di normalizzazione. Confrontando con la formula di Bayes, $\alpha$ è l'inverso del denominatore: $\alpha=1/\int\prod_{k}p(\mathbf{x}_k\,|\,\mu)\,p(\mu)\,\mathrm{d}\mu=1/p(\boldsymbol{X})$. Non dipende da $\mu$ ma dipende dai campioni: per questo nei passaggi successivi può assorbire anche i termini che contengono i dati ma non $\mu$. Tutta la forma della posterior come funzione di $\mu$ sta nel prodotto; $\alpha$ si recupera alla fine imponendo area 1.`,
    symbols: [
      { s: md`p(\mu\,|\,\boldsymbol{X})`, meaning: md`densità a posteriori della media` },
      { s: md`\alpha`, meaning: md`fattore di normalizzazione (*normalization factor*), costante rispetto a $\mu$: vale $1/p(\boldsymbol{X})$` },
      { s: md`p(\mathbf{x}_k\,|\,\mu)`, meaning: md`verosimiglianza del $k$-esimo campione, $N(\mu,\sigma^2)$` },
      { s: md`p(\mu)`, meaning: md`prior sulla media, $N(\mu_0,\sigma_0^2)$` },
    ],
    whenToUse: md`Punto di partenza dei conti dell'esempio gaussiano: da qui si sostituiscono le gaussiane e si arriva alla forma esponenziale (vedi la [dimostrazione della posterior gaussiana](#derivation:der03)).`,
    pitfalls: md`Il prior compare **una volta sola**, fuori dalla produttoria; le verosimiglianze sono $N$. $\alpha$ non è un parametro da stimare: è determinata dal resto, e i conti si fanno senza calcolarla.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mu\,|\,\boldsymbol{X})=\alpha\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\mu)\,\boxed{\;?\;}`,
        answer: md`p(\mu)`,
        distractors: [md`p(\mu\,|\,\boldsymbol{X})`, md`p(\boldsymbol{X})`, md`\prod_{k=1}^{N}p(\mu)`],
      },
    ],
    source: [
      { doc: 'ch2', page: 36 },
      { doc: 'part1', page: 28 },
    ],
  },

  // --- c26 Forma esponenziale della posterior (due stringhe) --------------------------------------
  {
    id: 'f-c26',
    name: 'Verosimiglianza e prior entrambi gaussiani',
    nameEn: 'Gaussian likelihood and Gaussian prior',
    latex: md`p(\mathbf{x}_k\,|\,\mu)\sim N(\mu,\sigma^2),\qquad p(\mu)\sim N(\mu_0,\sigma_0^2)`,
    explain: md`È la premessa della slide 37 (*Since $p(\mathbf{x}_k\,|\,\mu)\sim N(\mu,\sigma^2)$ and $p(\mu)\sim N(\mu_0,\sigma_0^2)$, we can obtain*): ogni campione ha verosimiglianza gaussiana di media $\mu$ e varianza $\sigma^2$, e il prior sulla media è gaussiano. Nella posterior $\alpha\prod_k p(\mathbf{x}_k\,|\,\mu)\,p(\mu)$ entrano quindi $N+1$ gaussiane, tutte lette come funzioni di $\mu$: le $N$ verosimiglianze sono campane centrate sui campioni $\mathbf{x}_k$ con deviazione standard $\sigma$, il prior una campana centrata su $\mu_0$ con deviazione standard $\sigma_0$. Le note: poiché sia la verosimiglianza sia il prior sono gaussiani, anche la posterior sarà gaussiana.`,
    symbols: [
      { s: md`p(\mathbf{x}_k\,|\,\mu)`, meaning: md`verosimiglianza del $k$-esimo campione, gaussiana di media $\mu$ e varianza nota $\sigma^2$` },
      { s: md`p(\mu)`, meaning: md`prior gaussiano di media $\mu_0$ e varianza $\sigma_0^2$` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo campione` },
    ],
    whenToUse: md`Da dire prima di sostituire: sono le due ipotesi che, insieme, fanno della posterior una gaussiana.`,
    pitfalls: md`La stessa scrittura $N(\mu,\sigma^2)$ si legge in due modi: come densità in $\mathbf{x}_k$ per $\mu$ fissato (modello dei dati) o come funzione di $\mu$ per $\mathbf{x}_k$ fissato (verosimiglianza). Nella posterior serve la seconda lettura.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}_k\,|\,\mu)\sim N(\mu,\sigma^2),\qquad p(\mu)\sim N(\boxed{\;?\;})`,
        answer: md`\mu_0,\sigma_0^2`,
        distractors: [md`\mu,\sigma^2`, md`\mu_0,\sigma^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },
  {
    id: 'f-c26-2',
    name: 'Forma esponenziale della posterior della media',
    nameEn: 'Exponential form of the posterior: quadratic exponent in μ',
    latex: md`p(\mu\,|\,\boldsymbol{X})=\alpha''\exp\left\{-\frac{1}{2}\left[\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)\mu^2-2\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k+\frac{\mu_0}{\sigma_0^2}\right)\mu\right]\right\}`,
    explain: md`Sostituendo le gaussiane nel prodotto si ottiene la forma della slide 37, in cui l'esponente è un polinomio di secondo grado in $\mu$. I passaggi, che la slide salta: (1) il prodotto di esponenziali è l'esponenziale della somma degli esponenti, $-\frac{1}{2}\left[\sum_k\left(\frac{\mu-\mathbf{x}_k}{\sigma}\right)^2+\left(\frac{\mu-\mu_0}{\sigma_0}\right)^2\right]$, mentre i fattori $\frac{1}{\sqrt{2\pi}\sigma}$ (ripetuto $N$ volte) e $\frac{1}{\sqrt{2\pi}\sigma_0}$ finiscono con $\alpha$ in una costante $\alpha'$; (2) si sviluppano i quadrati: ogni $(\mu-\mathbf{x}_k)^2$ dà $\mu^2-2\mathbf{x}_k\mu+\mathbf{x}_k^2$, e $(\mu-\mu_0)^2$ dà $\mu^2-2\mu_0\mu+\mu_0^2$; (3) si raccolgono le potenze di $\mu$: il coefficiente di $\mu^2$ somma $N$ volte $1/\sigma^2$ e una volta $1/\sigma_0^2$, quello di $\mu$ somma $\mathbf{x}_k/\sigma^2$ su tutti i campioni e $\mu_0/\sigma_0^2$. I termini senza $\mu$, cioè $\frac{1}{\sigma^2}\sum_k\mathbf{x}_k^2$ e $\mu_0^2/\sigma_0^2$, danno un fattore costante che si assorbe in $\alpha''$, cerchiato in verde con l'etichetta *Constant*. Il 2 davanti al termine lineare viene dai doppi prodotti. Tutti i passaggi sono nella [dimostrazione della posterior gaussiana](#derivation:der03).`,
    symbols: [
      { s: md`\alpha''`, meaning: md`costante (*Constant*) che raccoglie tutti i fattori indipendenti da $\mu$: $\alpha$, i fattori $1/(\sqrt{2\pi}\sigma)$ e $1/(\sqrt{2\pi}\sigma_0)$, i termini con $\mathbf{x}_k^2$ e $\mu_0^2$` },
      { s: md`\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}`, meaning: md`coefficiente di $\mu^2$: vale $1/\sigma_N^2$, la precisione della posterior` },
      { s: md`\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k+\frac{\mu_0}{\sigma_0^2}`, meaning: md`coefficiente del termine lineare: vale $\mu_N/\sigma_N^2$` },
      { s: md`\mathbf{x}_k`, meaning: md`campioni osservati; entrano solo attraverso la loro somma` },
      { s: md`\mu_0,\;\sigma_0^2`, meaning: md`media e varianza del prior` },
      { s: md`\sigma^2`, meaning: md`varianza nota dei dati` },
    ],
    whenToUse: md`Alla domanda della banca «why do we obtain a Gaussian also as posterior?»: mostra che l'esponente è una parabola in $\mu$, e una densità con esponente quadratico è una gaussiana.`,
    pitfalls: md`Il coefficiente di $\mu^2$ ha $N$ davanti a $1/\sigma^2$ (un contributo per campione) ma non davanti a $1/\sigma_0^2$ (il prior conta una volta). $\alpha''$ non è la stessa costante $\alpha$ della slide 36: ha assorbito i fattori delle gaussiane e i termini con $\mathbf{x}_k^2$ e $\mu_0^2$. La slide passa da $\alpha$ ad $\alpha''$ senza mostrare la costante intermedia $\alpha'$.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mu\,|\,\boldsymbol{X})=\alpha''\exp\left\{-\frac{1}{2}\left[\boxed{\;?\;}\mu^2-2\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k+\frac{\mu_0}{\sigma_0^2}\right)\mu\right]\right\}`,
        answer: md`\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)`,
        distractors: [
          md`\left(\frac{1}{\sigma^2}+\frac{1}{\sigma_0^2}\right)`,
          md`\left(\frac{N}{\sigma^2}+\frac{N}{\sigma_0^2}\right)`,
          md`\left(\frac{\sigma^2}{N}+\sigma_0^2\right)`,
        ],
      },
      {
        masked: md`p(\mu\,|\,\boldsymbol{X})=\alpha''\exp\left\{-\frac{1}{2}\left[\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)\mu^2-2\boxed{\;?\;}\mu\right]\right\}`,
        answer: md`\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k+\frac{\mu_0}{\sigma_0^2}\right)`,
        distractors: [
          md`\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k+\frac{1}{\sigma_0^2}\right)`,
          md`\left(\frac{1}{N\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k+\frac{\mu_0}{\sigma_0^2}\right)`,
          md`\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k^2+\frac{\mu_0^2}{\sigma_0^2}\right)`,
        ],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },

  // --- c27 La posterior è ancora normale ----------------------------------------------------------
  {
    id: 'f-c27',
    name: 'La posterior della media è ancora gaussiana',
    nameEn: 'The posterior is again a normal density',
    latex: md`p(\mu\,|\,\boldsymbol{X})\sim N(\mu_N,\sigma_N^2)`,
    explain: md`La posterior della media è di nuovo una densità normale (*$p(\mu\,|\,\boldsymbol{X})$ is again a normal density*), di media $\mu_N$ e varianza $\sigma_N^2$. Il motivo si legge nella forma esponenziale: il logaritmo della posterior è un polinomio di secondo grado in $\mu$, con coefficiente di $\mu^2$ pari a $-\frac{1}{2}\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)<0$, cioè una parabola rivolta verso il basso; completando il quadrato si ottiene esattamente $-\frac{1}{2}\left(\frac{\mu-\mu_N}{\sigma_N}\right)^2$ più una costante. In parole: il prodotto di gaussiane nella stessa variabile $\mu$ è l'esponenziale di una somma di parabole, e una somma di parabole è ancora una parabola. Le note: poiché verosimiglianza e prior sono gaussiani, anche la posterior lo sarà. Nel linguaggio della Parte 2 del corso il prior gaussiano è coniugato (*conjugate prior*) alla verosimiglianza gaussiana con varianza nota: posterior e prior appartengono alla stessa famiglia. Esempio: prior $N(10,9)$, quattro salmoni di media $12.5$, $\sigma^2=4$: posterior $N(12.25,\;0.9)$.`,
    symbols: [
      { s: md`\mu_N`, meaning: md`media della posterior dopo $N$ campioni` },
      { s: md`\sigma_N^2`, meaning: md`varianza della posterior dopo $N$ campioni` },
      { s: md`N(\mu_N,\sigma_N^2)`, meaning: md`densità normale in $\mu$ (qui $N$ come pedice è il numero di campioni, $N(\cdot,\cdot)$ la normale)` },
    ],
    whenToUse: md`Risposta diretta alla domanda d'esame di Passerini «why do we obtain a Gaussian also as posterior?». Il widget [perché la posterior è ancora gaussiana: una somma di parabole](#widget:m07-somma-di-parabole) lo fa vedere.`,
    pitfalls: md`Vale sotto le ipotesi dell'esempio: campioni indipendenti tutti da $N(\mu,\sigma^2)$ con $\sigma^2$ nota, prior gaussiano. Con un prior uniforme su un intervallo la posterior sarebbe una gaussiana troncata; con $\sigma^2$ ignota la posterior congiunta di $(\mu,\sigma^2)$ non sarebbe gaussiana. Serve anche il segno: con un coefficiente di $\mu^2$ positivo l'esponenziale non sarebbe integrabile.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mu\,|\,\boldsymbol{X})\sim N(\boxed{\;?\;})`,
        answer: md`\mu_N,\sigma_N^2`,
        distractors: [md`\mu_0,\sigma_0^2`, md`\mu_N,\sigma^2+\sigma_N^2`, md`\bar{X},\sigma^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },

  // --- c28 Media a posteriori (tre forme) ---------------------------------------------------------
  {
    id: 'f-c28',
    name: 'Media a posteriori',
    nameEn: 'Posterior mean μN',
    latex: md`\mu_N=\left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X}+\left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0`,
    explain: md`Dopo alcuni calcoli (*After some calculations, one can get*) la media della posterior risulta una combinazione lineare della media campionaria $\bar{X}$ e della media a priori $\mu_0$. I due pesi hanno lo stesso denominatore $N\sigma_0^2+\sigma^2$ e sommano a 1: $\mu_N$ cade sempre tra $\bar{X}$ e $\mu_0$ (combinazione convessa). Il peso dei dati $\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}$ cresce con $N$ e con $\sigma_0^2$ (prior vago); il peso del prior $\frac{\sigma^2}{N\sigma_0^2+\sigma^2}$ cresce con $\sigma^2$ (dati rumorosi). Casi limite: con $N=0$ resta $\mu_N=\mu_0$, per $N\to\infty$ $\mu_N\to\bar{X}$. Esempio dei salmoni: $\sigma^2=4$, $\mu_0=10$, $\sigma_0^2=9$, $N=4$, $\bar{X}=12.5$. Peso dei dati $36/40=0.9$, peso del prior $4/40=0.1$, quindi $\mu_N=0.9\cdot 12.5+0.1\cdot 10=12.25$. Come si arriva ai pesi è nella [dimostrazione che identifica media e varianza a posteriori](#derivation:der04).`,
    symbols: [
      { s: md`\mu_N`, meaning: md`media a posteriori (media della posterior dopo $N$ campioni)` },
      { s: md`\bar{X}`, meaning: md`media campionaria (*sample mean*) degli $N$ campioni` },
      { s: md`\mu_0`, meaning: md`media a priori` },
      { s: md`\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}`, meaning: md`peso dell'informazione empirica` },
      { s: md`\frac{\sigma^2}{N\sigma_0^2+\sigma^2}`, meaning: md`peso dell'informazione a priori` },
      { s: md`\sigma^2,\;\sigma_0^2`, meaning: md`varianza nota dei dati e varianza del prior` },
    ],
    whenToUse: md`Da scrivere a memoria insieme a $\sigma_N^2$: è il risultato dell'esempio gaussiano e mostra come si combinano informazione a priori ed empirica. Il widget [tiro alla fune tra prior e dati](#widget:m07-tiro-alla-fune-prior-dati) fa variare $N$, $\sigma^2$ e $\sigma_0^2$.`,
    pitfalls: md`$N$ moltiplica $\sigma_0^2$, non $\sigma^2$. I pesi non vanno scambiati: $\bar{X}$ ha il peso con $N\sigma_0^2$ al numeratore. Controllo rapido: con $N=0$ deve restare $\mu_0$; se la tua formula non lo dà, è sbagliata.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mu_N=\boxed{\;?\;}\bar{X}+\left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0`,
        answer: md`\left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)`,
        distractors: [
          md`\left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)`,
          md`\left(\frac{N\sigma^2}{N\sigma^2+\sigma_0^2}\right)`,
          md`\left(\frac{\sigma_0^2}{\sigma_0^2+\sigma^2}\right)`,
        ],
      },
      {
        masked: md`\mu_N=\left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X}+\boxed{\;?\;}\mu_0`,
        answer: md`\left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)`,
        distractors: [
          md`\left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)`,
          md`\left(\frac{\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)`,
          md`\left(\frac{\sigma^2}{\sigma_0^2+\sigma^2}\right)`,
        ],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },
  {
    id: 'f-c28-2',
    name: 'Media a posteriori come media pesata con le precisioni',
    nameEn: 'Posterior mean as a precision-weighted average',
    latex: md`\mu_N=\frac{\frac{N}{\sigma^2}\bar{X}+\frac{1}{\sigma_0^2}\mu_0}{\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}}`,
    explain: md`Forma equivalente, non scritta nella fonte: si dividono numeratore e denominatore di ciascun peso per $\sigma_0^2\sigma^2$. Le precisioni (*precision*, inverso della varianza) fanno da pesi: $N/\sigma^2$ è la precisione dell'informazione empirica ($N$ campioni, ciascuno di precisione $1/\sigma^2$), $1/\sigma_0^2$ quella del prior. Al denominatore c'è la precisione totale, che è proprio $1/\sigma_N^2$. È la stessa espressione che si legge nella forma esponenziale della slide 37, dove $\mu_N/\sigma_N^2$ è il coefficiente del termine lineare e $\frac{1}{\sigma^2}\sum_k\mathbf{x}_k=\frac{N}{\sigma^2}\bar{X}$. Esempio dei salmoni: $N/\sigma^2=4/4=1$ e $1/\sigma_0^2=1/9\approx 0.111$, quindi $\mu_N=(1\cdot 12.5+0.111\cdot 10)/1.111=12.25$, come con la forma della slide.`,
    symbols: [
      { s: md`\frac{N}{\sigma^2}`, meaning: md`precisione dell'informazione empirica: $N$ campioni di precisione $1/\sigma^2$ ciascuno` },
      { s: md`\frac{1}{\sigma_0^2}`, meaning: md`precisione del prior` },
      { s: md`\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}`, meaning: md`precisione totale, pari a $1/\sigma_N^2$` },
      { s: md`\bar{X},\;\mu_0`, meaning: md`media campionaria e media a priori` },
    ],
    whenToUse: md`Utile all'orale per spiegare *perché* i pesi sono quelli: ogni fonte pesa quanto è precisa.`,
    pitfalls: md`Al numeratore c'è $\frac{N}{\sigma^2}\bar{X}$, cioè $\frac{1}{\sigma^2}\sum_k\mathbf{x}_k$, non $\frac{1}{\sigma^2}\bar{X}$: il fattore $N$ va sia al numeratore sia al denominatore.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mu_N=\frac{\frac{N}{\sigma^2}\bar{X}+\frac{1}{\sigma_0^2}\mu_0}{\boxed{\;?\;}}`,
        answer: md`\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}`,
        distractors: [md`\frac{1}{\sigma^2}+\frac{1}{\sigma_0^2}`, md`N\sigma^2+\sigma_0^2`, md`\sigma^2+\sigma_0^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },
  {
    id: 'f-c28-3',
    name: "Media a posteriori: ogni fonte pesata con la varianza dell'altra",
    nameEn: 'Posterior mean with the variance of the sample mean σ²/N',
    latex: md`\mu_N=\frac{\sigma_0^2}{\sigma_0^2+\sigma^2/N}\,\bar{X}+\frac{\sigma^2/N}{\sigma_0^2+\sigma^2/N}\,\mu_0`,
    explain: md`Altra forma equivalente, non scritta nella fonte: si dividono numeratore e denominatore di ciascun peso per $N$. Compare $\sigma^2/N$, la varianza della media campionaria $\bar{X}$ come stimatore di $\mu$, accanto a $\sigma_0^2$, la varianza del prior. Ogni fonte è pesata con la varianza dell'**altra**: se il prior è molto incerto ($\sigma_0^2$ grande) il peso di $\bar{X}$ va verso 1; se la media campionaria è molto incerta ($\sigma^2/N$ grande: pochi dati o dati rumorosi) il peso passa al prior. Vince la fonte meno incerta. Esempio dei salmoni: $\sigma^2/N=4/4=1$ e $\sigma_0^2=9$, pesi $9/10=0.9$ e $1/10=0.1$.`,
    symbols: [
      { s: md`\sigma^2/N`, meaning: md`varianza della media campionaria $\bar{X}$ (incertezza dell'informazione empirica)` },
      { s: md`\sigma_0^2`, meaning: md`varianza del prior (incertezza dell'informazione a priori)` },
      { s: md`\bar{X},\;\mu_0`, meaning: md`media campionaria e media a priori` },
    ],
    whenToUse: md`Per commentare i casi limite: per $N\to\infty$ la varianza $\sigma^2/N$ va a zero e il peso di $\bar{X}$ va a 1.`,
    pitfalls: md`Il peso di $\bar{X}$ ha $\sigma_0^2$ al numeratore, non $\sigma^2/N$: pesare ciascuna fonte con la propria varianza è l'errore tipico, e darebbe più peso alla fonte più incerta.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mu_N=\boxed{\;?\;}\,\bar{X}+\frac{\sigma^2/N}{\sigma_0^2+\sigma^2/N}\,\mu_0`,
        answer: md`\frac{\sigma_0^2}{\sigma_0^2+\sigma^2/N}`,
        distractors: [
          md`\frac{\sigma^2/N}{\sigma_0^2+\sigma^2/N}`,
          md`\frac{\sigma_0^2}{\sigma_0^2+\sigma^2}`,
          md`\frac{N\sigma_0^2}{\sigma_0^2+\sigma^2/N}`,
        ],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },

  // --- c29 Varianza a posteriori (due forme) ------------------------------------------------------
  {
    id: 'f-c29',
    name: 'Varianza a posteriori',
    nameEn: 'Posterior variance σN²',
    latex: md`\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}`,
    explain: md`Seconda equazione del sistema della slide 37: la varianza della posterior misura l'incertezza che resta su $\mu$ dopo $N$ campioni. Non dipende dai valori dei campioni, solo da $N$, $\sigma^2$ e $\sigma_0^2$: sai quanto sarai incerto prima ancora di misurare. Decresce con $N$ in modo monotono; per $N$ grande si comporta come $\sigma^2/N$ e va a zero, così la posterior si stringe fino a una delta di Dirac. Per $N\ge 1$ vale $\sigma_N^2<\sigma_0^2$ (i dati riducono l'incertezza del prior) e $\sigma_N^2<\sigma^2/N$ (il prior riduce l'incertezza della sola media campionaria); con $N=0$ resta $\sigma_N^2=\sigma_0^2$. Esempio dei salmoni: $\sigma_N^2=\frac{9\cdot 4}{4\cdot 9+4}=\frac{36}{40}=0.9$, contro $\sigma_0^2=9$ del prior e $\sigma^2/N=1$ della sola media campionaria.`,
    symbols: [
      { s: md`\sigma_N^2`, meaning: md`varianza a posteriori: incertezza residua su $\mu$ dopo $N$ campioni` },
      { s: md`\sigma^2`, meaning: md`varianza nota dei dati` },
      { s: md`\sigma_0^2`, meaning: md`varianza del prior` },
      { s: md`N`, meaning: md`numero di campioni` },
    ],
    whenToUse: md`Da scrivere a memoria con $\mu_N$. Serve a spiegare il *Bayesian learning*: al crescere di $N$ la posterior si stringe.`,
    pitfalls: md`Al denominatore $N\sigma_0^2+\sigma^2$, con $N$ davanti a $\sigma_0^2$; al numeratore il prodotto $\sigma_0^2\sigma^2$, senza $N$. $\sigma_N^2$ è l'incertezza sul **parametro** $\mu$, non la varianza dei dati: quella resta $\sigma^2$, e la densità predittiva somma le due.`,
    importance: 3,
    blanks: [
      {
        masked: md`\sigma_N^2=\frac{\sigma_0^2\sigma^2}{\boxed{\;?\;}}`,
        answer: md`N\sigma_0^2+\sigma^2`,
        distractors: [md`\sigma_0^2+N\sigma^2`, md`\sigma_0^2+\sigma^2`, md`N(\sigma_0^2+\sigma^2)`],
      },
      {
        masked: md`\sigma_N^2=\frac{\boxed{\;?\;}}{N\sigma_0^2+\sigma^2}`,
        answer: md`\sigma_0^2\sigma^2`,
        distractors: [md`N\sigma_0^2\sigma^2`, md`\sigma_0^2+\sigma^2`, md`\sigma^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },
  {
    id: 'f-c29-2',
    name: 'Varianza a posteriori: le precisioni si sommano',
    nameEn: 'Posterior precision: precisions add up',
    latex: md`\frac{1}{\sigma_N^2}=\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}`,
    explain: md`Forma equivalente della varianza a posteriori: la precisione della posterior è la somma delle precisioni, $N$ contributi $1/\sigma^2$ dai campioni più $1/\sigma_0^2$ dal prior. Non è scritta come equazione nella fonte, ma si legge direttamente nella forma esponenziale della slide 37: è il coefficiente di $\mu^2$. Portando a denominatore comune, $\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}=\frac{N\sigma_0^2+\sigma^2}{\sigma^2\sigma_0^2}$, e invertendo si ritrova $\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}$. Ogni nuovo campione aggiunge la stessa quantità di precisione $1/\sigma^2$, qualunque sia il suo valore. Esempio dei salmoni: $1/\sigma_N^2=4/4+1/9\approx 1.111$, quindi $\sigma_N^2=0.9$.`,
    symbols: [
      { s: md`\frac{1}{\sigma_N^2}`, meaning: md`precisione della posterior` },
      { s: md`\frac{N}{\sigma^2}`, meaning: md`precisione portata dagli $N$ campioni` },
      { s: md`\frac{1}{\sigma_0^2}`, meaning: md`precisione del prior` },
    ],
    whenToUse: md`È il modo più rapido per ricordare la varianza a posteriori e per spiegare perché va a zero: la precisione cresce linearmente con $N$. Il widget [la varianza a posteriori: precisioni che si sommano](#widget:m07-precisioni-che-si-sommano) la mostra.`,
    pitfalls: md`Si sommano le precisioni, non le varianze: $\sigma_N^2\neq\frac{\sigma^2}{N}+\sigma_0^2$.`,
    importance: 3,
    blanks: [
      {
        masked: md`\frac{1}{\sigma_N^2}=\boxed{\;?\;}+\frac{1}{\sigma_0^2}`,
        answer: md`\frac{N}{\sigma^2}`,
        distractors: [md`\frac{1}{\sigma^2}`, md`\frac{\sigma^2}{N}`, md`N\sigma^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },

  // --- c30 Media campionaria ----------------------------------------------------------------------
  {
    id: 'f-c30',
    name: 'Media campionaria',
    nameEn: 'Sample mean',
    latex: md`\bar{X}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k`,
    explain: md`Nella formula di $\mu_N$ il simbolo $\bar{X}$ è cerchiato in verde con l'etichetta *Sample mean*: è la media aritmetica degli $N$ campioni osservati (le note: *$\bar{X}$ is the sample mean of the observed data*). La definizione esplicita non è scritta nella slide; nasce dal termine $\frac{1}{\sigma^2}\sum_k\mathbf{x}_k$ della forma esponenziale, riscritto come $\frac{N}{\sigma^2}\bar{X}$. I campioni entrano nella posterior solo attraverso $\bar{X}$ e $N$: due insiemi di dati diversi con la stessa media e la stessa numerosità danno la stessa posterior. $\bar{X}$ coincide con la stima ML della media di una gaussiana. Esempio: $(12.1+13.4+11.2+13.3)/4=50.0/4=12.5$.`,
    symbols: [
      { s: md`\bar{X}`, meaning: md`media campionaria degli $N$ campioni` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo campione (scalare nel caso univariato)` },
      { s: md`N`, meaning: md`numero di campioni` },
    ],
    whenToUse: md`Quando confronti ML e Bayes nel caso gaussiano: la stima ML della media è $\bar{X}$, quella bayesiana è $\mu_N$, che mescola $\bar{X}$ con $\mu_0$.`,
    pitfalls: md`Il fattore è $1/N$, non $1/(N-1)$: quello compare nello stimatore non distorto della **covarianza**, non della media. Non confondere $\bar{X}$ (dipende dai dati) con $\mu$ (media vera, ignota) né con $\mu_N$ (media a posteriori).`,
    importance: 2,
    blanks: [
      {
        masked: md`\bar{X}=\boxed{\;?\;}\sum_{k=1}^{N}\mathbf{x}_k`,
        answer: md`\frac{1}{N}`,
        distractors: [md`\frac{1}{N-1}`, md`N`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },

  // --- c31 Il sistema: informazione a priori ed empirica ------------------------------------------
  {
    id: 'f-c31',
    name: 'Il sistema della posterior: informazione a priori ed empirica',
    nameEn: 'Prior and empirical information combined (μN, σN² system)',
    latex: md`\begin{cases}\mu_N=\left(\dfrac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X}+\left(\dfrac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0\\[8pt]\sigma_N^2=\dfrac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}\end{cases}`,
    explain: md`Il sistema delle due equazioni è il risultato da ricordare dell'esempio gaussiano, e la nota inclinata della slide 37 ne dà la lettura: queste equazioni mostrano come l'informazione a priori (*prior information*) si combina con l'informazione empirica contenuta nei campioni (*empirical information in the samples*) per ottenere la densità a posteriori. L'informazione a priori è la coppia $\mu_0$, $\sigma_0^2$; quella empirica è la coppia $\bar{X}$, $N$ (le note parlano di *sample information*, i dati osservati $\boldsymbol{X}$); $\sigma^2$, nota, dice quanto vale ciascun campione. La media si sposta da $\mu_0$ verso $\bar{X}$, la varianza scende da $\sigma_0^2$ verso zero. Letto come conteggio, il prior vale quanto $\sigma^2/\sigma_0^2$ campioni virtuali (vedi [il prior come campioni virtuali](#formula:f-c60)). Esempio dei salmoni: con $\mu_0=10$, $\sigma_0^2=9$, $\bar{X}=12.5$, $N=4$ e $\sigma^2=4$ il sistema dà $\mu_N=12.25$ e $\sigma_N^2=0.9$.`,
    symbols: [
      { s: md`\mu_0,\;\sigma_0^2`, meaning: md`informazione a priori (*prior information*): media e varianza del prior` },
      { s: md`\bar{X},\;N`, meaning: md`informazione empirica contenuta nei campioni (*empirical information*): media campionaria e numero di campioni` },
      { s: md`\sigma^2`, meaning: md`varianza nota dei dati: fissa quanto pesa ogni campione` },
      { s: md`\mu_N,\;\sigma_N^2`, meaning: md`media e varianza della posterior` },
    ],
    whenToUse: md`È la coppia di formule da scrivere quando all'orale chiedono di svolgere l'esempio gaussiano della stima bayesiana, seguita dai casi limite $N=0$ e $N\to\infty$.`,
    pitfalls: md`Le due equazioni hanno lo stesso denominatore $N\sigma_0^2+\sigma^2$: se nel tuo sistema i denominatori differiscono, c'è un errore. Solo $\mu_N$ dipende dai valori dei dati; $\sigma_N^2$ dipende dal numero di campioni, non dai loro valori.`,
    importance: 3,
    blanks: [
      {
        masked: md`\begin{cases}\mu_N=\left(\dfrac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X}+\left(\dfrac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0\\[8pt]\sigma_N^2=\dfrac{\boxed{\;?\;}}{N\sigma_0^2+\sigma^2}\end{cases}`,
        answer: md`\sigma_0^2\sigma^2`,
        distractors: [md`\sigma_0^2`, md`N\sigma_0^2\sigma^2`, md`\sigma^2`],
      },
      {
        masked: md`\begin{cases}\mu_N=\left(\dfrac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\boxed{\;?\;}+\left(\dfrac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0\\[8pt]\sigma_N^2=\dfrac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}\end{cases}`,
        answer: md`\bar{X}`,
        distractors: [md`\mu_0`, md`\mu`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },
]
