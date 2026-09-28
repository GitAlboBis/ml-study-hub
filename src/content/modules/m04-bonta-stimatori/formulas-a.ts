// Formule del foglio m04 (bontà di uno stimatore, bound di Cramér-Rao, proprietà asintotiche),
// concetti c01-c35 dell'inventario, nell'ordine dell'inventario.
// Convenzione condivisa: una voce per ogni stringa LaTeX di concepts[].latex, id "f-<concetto>" per la prima,
// "f-<concetto>-2", "f-<concetto>-3"... per le successive. Il campo latex è copiato dall'inventario
// (verificato sulle immagini di ch2 p10-15 e part1 p17-20) e scripts/formula-coverage.ts lo ritrova per confronto.
// importance = examRelevance del concetto. Le formule che la fonte non scrive (integrazioni) lo dicono nel testo.
// Unico ritocco al LaTeX dell'inventario: f-c05-2 (vedi il commento sulla voce).
import { md } from '../../types'
import type { Formula } from '../../types'

export const formulasA: Formula[] = [
  // --- c01 Modello parametrico e vettore dei parametri ----------------------------------------------
  {
    id: 'f-c01',
    name: 'Vettore dei parametri',
    nameEn: 'Parameter vector θ',
    latex: md`\boldsymbol{\theta} = (\theta_1, \theta_2, \ldots, \theta_r)`,
    explain: md`Nella stima parametrica (*parametric estimation*) assumi che la densità di probabilità $p(\mathbf{x})$ abbia una forma nota, fissata da $r$ parametri (*parameters*). Messi in fila formano il vettore dei parametri (*parameter vector*) $\boldsymbol{\theta}$: stimare la densità diventa stimare $r$ numeri. Esempio del pesce: se modelli la luminosità dei salmoni con una gaussiana, $\boldsymbol{\theta} = (m, \sigma^2)$ e $r = 2$. Tutto il discorso sulla bontà della stima (*estimation goodness*) riguarda quanto la stima $\hat{\boldsymbol{\theta}}$, ricavata dai campioni, si avvicina a questo $\boldsymbol{\theta}$.`,
    symbols: [
      { s: md`\boldsymbol{\theta}`, meaning: md`vettore dei parametri veri: fisso ma ignoto nella stima a massima verosimiglianza (*Maximum Likelihood*, ML)` },
      { s: md`\theta_i`, meaning: md`$i$-esimo parametro del modello, con $i = 1, 2, \ldots, r$` },
      { s: md`r`, meaning: md`numero di parametri del modello` },
    ],
    whenToUse: md`All'inizio di ogni problema di stima: prima di parlare di bias o di Cramér-Rao dichiari chi è $\boldsymbol{\theta}$ e quanti parametri ha. Il bound di Cramér-Rao e le proprietà asintotiche si scrivono parametro per parametro, per $i = 1, 2, \ldots, r$.`,
    pitfalls: md`$\boldsymbol{\theta}$ è il valore vero, $\hat{\boldsymbol{\theta}}$ la sua stima: non confonderli. Nella visione ML $\boldsymbol{\theta}$ è una costante; nella stima bayesiana (*Bayesian Estimation*, BE) diventa una variabile aleatoria con una distribuzione a priori (*prior*). Non confondere $r$ (numero di parametri) con $N$ (numero di campioni).`,
    importance: 2,
    blanks: [
      {
        masked: md`\boldsymbol{\theta} = (\theta_1, \theta_2, \ldots, \boxed{\;?\;})`,
        answer: md`\theta_r`,
        distractors: [md`\theta_N`, md`\theta_n`],
      },
    ],
    source: [{ doc: 'part1', page: 17 }],
  },
  {
    id: 'f-c01-2',
    name: 'Modello parametrico della densità',
    nameEn: 'Parametric model p(x|θ)',
    latex: md`p(\mathbf{x}|\boldsymbol{\theta})`,
    explain: md`La barra verticale indica la dipendenza del modello dal vettore dei parametri (*the dependency of the model on this parameter vector is denoted as*). $p(\mathbf{x}|\boldsymbol{\theta})$ è una famiglia di densità, una per ogni valore di $\boldsymbol{\theta}$: fissato $\boldsymbol{\theta}$ è una pdf in $\mathbf{x}$ e integra a 1 sullo spazio delle feature. Esempio: la gaussiana della luminosità dei salmoni con media e varianza raccolte in $\boldsymbol{\theta}$. Nella visione ML, dove $\boldsymbol{\theta}$ non è aleatorio, la barra si legge «con parametri $\boldsymbol{\theta}$»; nella stima bayesiana è un vero condizionamento.`,
    symbols: [
      { s: md`\mathbf{x}`, meaning: md`vettore delle feature di un campione (per esempio la luminosità di un pesce)` },
      { s: md`p(\mathbf{x}|\boldsymbol{\theta})`, meaning: md`densità del modello quando i parametri valgono $\boldsymbol{\theta}$` },
      { s: md`\boldsymbol{\theta}`, meaning: md`vettore dei parametri che fissa la forma della densità` },
    ],
    whenToUse: md`È il mattone della likelihood: la valuti in ogni campione di training e fai il prodotto.`,
    pitfalls: md`Come funzione di $\mathbf{x}$, con $\boldsymbol{\theta}$ fisso, è una densità. Come funzione di $\boldsymbol{\theta}$, con i dati fissi, non lo è: in generale non integra a 1 rispetto a $\boldsymbol{\theta}$. È la stessa espressione letta in due modi, ed è proprio la seconda lettura che porta alla funzione di verosimiglianza.`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'part1', page: 17 }],
  },
  {
    id: 'f-c01-3',
    name: 'Training set di N campioni iid',
    nameEn: 'Observation vector X of N iid samples',
    latex: md`\mathbf{X} = \{\mathbf{x}_1, \mathbf{x}_2, \ldots, \mathbf{x}_N\}`,
    explain: md`$\mathbf{X}$ è l'insieme degli $N$ campioni di training (*training samples*), che le note chiamano vettore di variabili aleatorie indipendenti e identicamente distribuite (*independent and identically distributed (iid) random variables*). Indipendenti: il valore di un campione non dice nulla sugli altri. Identicamente distribuiti: tutti seguono la stessa $p(\mathbf{x}|\boldsymbol{\theta})$, con lo stesso $\boldsymbol{\theta}$. Esempio: la luminosità di $N = 200$ salmoni presi a caso dal nastro trasportatore. Nella slide sulla bontà della stima $\mathbf{X}$ si chiama vettore delle osservazioni (*observation vector*).`,
    symbols: [
      { s: md`\mathbf{X}`, meaning: md`training set, o vettore delle osservazioni: è aleatorio` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo campione di training, con $k = 1, \ldots, N$` },
      { s: md`N`, meaning: md`numero di campioni di training` },
    ],
    whenToUse: md`Ogni volta che scrivi la likelihood o un valore atteso: le medie $E\{\cdot\}$ di questo foglio sono fatte su tutti i possibili training set $\mathbf{X}$ di $N$ campioni, con il $\boldsymbol{\theta}$ vero ([«rispetto a che cosa si calcola il valore atteso»](#formula:f-c68)).`,
    pitfalls: md`$\mathbf{X}$ è aleatorio: un altro giorno di pesca dà un altro training set, e per questo la stima ricavata da $\mathbf{X}$ è a sua volta aleatoria. L'ipotesi iid non è un dettaglio: senza di essa la likelihood non si scrive come prodotto.`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'part1', page: 17 }, { doc: 'ch2', page: 12 }],
  },

  // --- c02 Funzione di verosimiglianza ------------------------------------------------------------
  {
    id: 'f-c02',
    name: 'Funzione di verosimiglianza per campioni iid',
    nameEn: 'Likelihood function',
    latex: md`p(\mathbf{X}|\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k|\boldsymbol{\theta})`,
    explain: md`La funzione di verosimiglianza (*likelihood function*) è la densità congiunta del training set vista come funzione di $\boldsymbol{\theta}$, a dati fissati. Con campioni iid è il prodotto delle densità del modello valutate nei singoli campioni. Le note: definisce la verosimiglianza del vettore $\boldsymbol{\theta}$ rispetto ai dati osservati $\mathbf{X}$, cioè una misura della compatibilità o dell'accordo (*measure of the compatibility or agreement*) tra i parametri del modello e i campioni: quanto bene il modello scelto «spiega» (*explain*) il training set. Analizzandola si trovano i parametri che più verosimilmente hanno generato i dati, e il suo massimo è la stima ML. Esempio: 12 salmoni con luminosità tra 2 e 5; una gaussiana centrata in 3 dà densità alta a quasi tutti e il prodotto è grande; una centrata in 5 dà densità minuscole ai campioni vicini a 2 e il prodotto crolla. La stessa $p(\mathbf{X}|\boldsymbol{\theta})$ compare dentro l'informazione di Fisher.`,
    symbols: [
      { s: md`p(\mathbf{X}|\boldsymbol{\theta})`, meaning: md`likelihood di $\boldsymbol{\theta}$ rispetto al training set $\mathbf{X}$` },
      { s: md`p(\mathbf{x}_k|\boldsymbol{\theta})`, meaning: md`densità del modello valutata nel $k$-esimo campione` },
      { s: md`\prod_{k=1}^{N}`, meaning: md`produttoria: prodotto degli $N$ fattori, uno per campione` },
      { s: md`k`, meaning: md`indice del campione, da 1 a $N$` },
    ],
    whenToUse: md`Domanda d'esame «what the likelihood describe»: scrivi questa formula, di' che è funzione di $\boldsymbol{\theta}$ e non di $\mathbf{x}$, e che misura quanto $\boldsymbol{\theta}$ spiega i dati. È il punto di partenza di stima ML, informazione di Fisher e bound di Cramér-Rao.`,
    pitfalls: md`Non è una densità in $\boldsymbol{\theta}$: in generale non integra a 1 rispetto a $\boldsymbol{\theta}$. Il prodotto vale solo con campioni indipendenti e con la stessa densità (voce seguente). Il prodotto di tante densità dà numeri minuscoli (nella figura dell'esempio l'ordine è $10^{-7}$ con una dozzina di campioni): per questo si lavora quasi sempre con il logaritmo.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{X}|\boldsymbol{\theta}) = \boxed{\;?\;} p(\mathbf{x}_k|\boldsymbol{\theta})`,
        answer: md`\prod_{k=1}^{N}`,
        distractors: [md`\sum_{k=1}^{N}`, md`\frac{1}{N}\sum_{k=1}^{N}`, md`\max_{k}`],
      },
    ],
    source: [{ doc: 'part1', page: 17 }],
  },

  // --- c03 Perché la likelihood è un prodotto -------------------------------------------------------
  {
    id: 'f-c03',
    name: 'Densità congiunta fattorizzata: perché il prodotto',
    nameEn: 'Joint density of independent samples as a product',
    latex: md`p(\mathbf{x}_1, \mathbf{x}_2, \ldots, \mathbf{x}_N|\boldsymbol{\theta}) = p(\mathbf{x}_1|\boldsymbol{\theta})\, p(\mathbf{x}_2|\boldsymbol{\theta}) \cdots p(\mathbf{x}_N|\boldsymbol{\theta})`,
    explain: md`È la likelihood scritta per esteso: a sinistra la densità congiunta degli $N$ campioni, a destra il prodotto delle densità individuali. Le note: poiché i campioni sono indipendenti, la probabilità complessiva si esprime come prodotto delle probabilità individuali di ciascun campione (*since the samples are independent, the overall probability can be expressed as the product of the individual probabilities of each sample*). Le due ipotesi lavorano in punti diversi. L'indipendenza spezza la densità congiunta in $N$ fattori. L'identica distribuzione fa sì che ogni fattore sia la stessa funzione $p(\cdot|\boldsymbol{\theta})$ con lo stesso $\boldsymbol{\theta}$. La fonte scrive solo la produttoria: questa scrittura estesa serve a vedere che a sinistra c'è la densità congiunta. Passaggi completi nella dimostrazione [«perché la likelihood è un prodotto»](#derivation:der19).`,
    symbols: [
      { s: md`p(\mathbf{x}_1, \mathbf{x}_2, \ldots, \mathbf{x}_N|\boldsymbol{\theta})`, meaning: md`densità congiunta degli $N$ campioni dato $\boldsymbol{\theta}$: è la likelihood $p(\mathbf{X}|\boldsymbol{\theta})$ scritta per esteso` },
      { s: md`p(\mathbf{x}_k|\boldsymbol{\theta})`, meaning: md`densità del modello nel $k$-esimo campione: la stessa funzione $p$ per ogni $k$ (identica distribuzione)` },
    ],
    whenToUse: md`Domanda d'esame «why we can use the separate products of the probabilities»: la risposta è l'ipotesi iid, e in particolare l'indipendenza dei campioni.`,
    pitfalls: md`Con campioni dipendenti il prodotto non è giustificato. Se registri due volte la stessa misura dello stesso salmone, il secondo fattore non porta informazione nuova ma il prodotto lo conta come se la portasse: la likelihood diventa troppo appuntita e la stima sembra più precisa di quanto sia. Senza identica distribuzione i fattori sarebbero densità diverse, una per campione.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}_1, \mathbf{x}_2, \ldots, \mathbf{x}_N|\boldsymbol{\theta}) = \boxed{\;?\;}`,
        answer: md`p(\mathbf{x}_1|\boldsymbol{\theta})\, p(\mathbf{x}_2|\boldsymbol{\theta}) \cdots p(\mathbf{x}_N|\boldsymbol{\theta})`,
        distractors: [
          md`p(\mathbf{x}_1|\boldsymbol{\theta}) + p(\mathbf{x}_2|\boldsymbol{\theta}) + \cdots + p(\mathbf{x}_N|\boldsymbol{\theta})`,
          md`p(\mathbf{x}_1|\boldsymbol{\theta})^{N}`,
          md`\frac{1}{N}\sum_{k=1}^{N} p(\mathbf{x}_k|\boldsymbol{\theta})`,
        ],
      },
    ],
    source: [{ doc: 'part1', page: 17 }],
  },

  // --- c05 Figura «Likelihood Function: Example» -----------------------------------------------------
  {
    id: 'f-c05',
    name: 'Log-likelihood',
    nameEn: 'Log-likelihood l(θ)',
    latex: md`l(\theta) = \ln p(\mathbf{X}|\theta)`,
    explain: md`È l'etichetta dell'asse verticale del pannello basso della figura «Likelihood Function: Example» (note p17, slide p10): la log-likelihood (*log-likelihood*) è il logaritmo naturale della likelihood. Nella figura il parametro è scalare, la media di una gaussiana. Pannello alto: una dozzina di campioni tra circa 1.9 e 4.8 e quattro gaussiane candidate; quella centrata attorno a 5 spiega male i dati. Pannello centrale: $p(\mathbf{X}|\theta)$, un picco stretto in $\hat{\theta} \approx 3.1$ che arriva a circa $1.7 \times 10^{-7}$ (prodotto di una dozzina di densità). Pannello basso: $l(\theta)$, una curva concava e larga tra circa $-16$ e $-100$, con il massimo nello stesso $\hat{\theta}$. I due pannelli sono coerenti: $\ln(1.7 \times 10^{-7}) \approx -15.6$. Messaggi: la likelihood è funzione di $\theta$, non di $x$; il suo massimo individua la stima; il logaritmo, funzione crescente, non sposta il massimo e trasforma il prodotto in una somma ([«il logaritmo trasforma i prodotti in somme»](#formula:f-c44)).`,
    symbols: [
      { s: md`l(\theta)`, meaning: md`log-likelihood, asse verticale del pannello basso` },
      { s: md`\ln`, meaning: md`logaritmo naturale (in alcune formule, come la forma compatta della matrice di Fisher di slide p14 e le note p19-20, le slide e le note lo scrivono in corsivo, $ln$; altrove, per esempio in $\arg\max \ln p(\mathbf{X}|\boldsymbol{\theta})$ di slide p17, è in tondo)` },
      { s: md`\theta`, meaning: md`parametro scalare: nella figura è la media della gaussiana` },
      { s: md`\hat{\theta}`, meaning: md`valore di $\theta$ in cui likelihood e log-likelihood sono massime (circa 3.1 nella figura)` },
    ],
    whenToUse: md`Quando commenti la figura all'orale, o quando devi massimizzare la likelihood a mano: derivare una somma di logaritmi è molto più semplice che derivare un prodotto.`,
    pitfalls: md`Il logaritmo cambia la forma della curva (da picco stretto a parabola larga) e la scala dei valori (tutti negativi), non la posizione del massimo. Non confrontare i valori di $l(\theta)$ con quelli di $p(\mathbf{X}|\theta)$ come se fossero sulla stessa scala. La figura ha un solo parametro, per questo $\theta$ non è in grassetto.`,
    importance: 2,
    blanks: [
      {
        masked: md`l(\theta) = \boxed{\;?\;} p(\mathbf{X}|\theta)`,
        answer: md`\ln`,
        distractors: [md`\exp`, md`\frac{\partial}{\partial \theta}`],
      },
    ],
    source: [
      { doc: 'part1', page: 17 },
      { doc: 'ch2', page: 10 },
      { doc: 'part1', page: 20 },
    ],
  },
  // LaTeX ritoccato rispetto all'inventario, che dentro \text scriveva anche "integrazione, der17": un codice
  // interno non va mostrato allo studente, e il rimando alla dimostrazione è nel testo. Inventario (c05.latex[1]):
  // l(\theta) = l(\hat{\theta}) - \frac{N(\theta - \hat{\theta})^2}{2\sigma^2} \quad (\text{gaussiana con } \sigma \text{ nota; integrazione, der17})
  // scripts/formula-coverage.ts la segnala come "non ritrovata": è presente, senza la nota tra parentesi.
  {
    id: 'f-c05-2',
    name: 'La log-likelihood della figura è una parabola',
    nameEn: 'Gaussian log-likelihood as a parabola around θ̂',
    latex: md`l(\theta) = l(\hat{\theta}) - \frac{N(\theta - \hat{\theta})^2}{2\sigma^2} \quad (\text{gaussiana con } \sigma \text{ nota})`,
    explain: md`Integrazione, non scritta nella fonte: spiega i numeri della figura. Con $N$ campioni iid gaussiani di varianza $\sigma^2$ nota e parametro $\theta$ uguale alla media, la log-likelihood è esattamente una parabola rivolta verso il basso, con il vertice nella stima ML $\hat{\theta} = \bar{x}$, la media campionaria. Con i valori letti dalla figura, $N = 12$, $\sigma \approx 1$, $\hat{\theta} = 3.1$ e $l(\hat{\theta}) \approx -16$, ottieni $l(0) \approx -16 - 6 \cdot 3.1^2 \approx -74$ e $l(7) \approx -16 - 6 \cdot 3.9^2 \approx -107$, come nel grafico. Prendendo l'esponenziale, la likelihood è una campana in $\theta$ con deviazione standard $\sigma/\sqrt{N} \approx 0.29$: è la larghezza del picco centrale e coincide con la radice del bound di Cramér-Rao. La curvatura della parabola, $N/\sigma^2$, è l'informazione di Fisher. Passaggi nella dimostrazione [«la log-likelihood della figura è una parabola»](#derivation:der17).`,
    symbols: [
      { s: md`\hat{\theta}`, meaning: md`vertice della parabola: stima ML, uguale alla media campionaria $\bar{x}$` },
      { s: md`l(\hat{\theta})`, meaning: md`valore massimo della log-likelihood (circa $-16$ nella figura)` },
      { s: md`N`, meaning: md`numero di campioni (12 nella figura)` },
      { s: md`\sigma^2`, meaning: md`varianza della gaussiana, supposta nota` },
    ],
    whenToUse: md`Per collegare la figura della likelihood al bound di Cramér-Rao: parabola appuntita, molta informazione, bound basso. Più campioni rendono la parabola più stretta.`,
    pitfalls: md`È esatta solo per la media di una gaussiana con $\sigma$ nota; per altri modelli la log-likelihood è parabolica solo vicino al massimo e per $N$ grande. Il coefficiente è $N/(2\sigma^2)$, non $1/(2\sigma^2)$: raddoppiare i campioni raddoppia la curvatura.`,
    importance: 2,
    blanks: [
      {
        masked: md`l(\theta) = l(\hat{\theta}) - \frac{\boxed{\;?\;}(\theta - \hat{\theta})^2}{2\sigma^2} \quad (\text{gaussiana con } \sigma \text{ nota})`,
        answer: md`N`,
        distractors: [md`1`, md`\sqrt{N}`, md`N^2`],
      },
    ],
    source: [
      { doc: 'part1', page: 17 },
      { doc: 'ch2', page: 10 },
      { doc: 'ch2', page: 14 },
    ],
  },

  // --- c10 La stima dipende dalle osservazioni -------------------------------------------------------
  {
    id: 'f-c10',
    name: 'Lo stimatore è una funzione del training set',
    nameEn: 'The estimate depends on the observation vector X',
    latex: md`\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\mathbf{X})`,
    explain: md`Primo punto della slide «Estimation Goodness»: la stima del vettore dei parametri dipende dal vettore delle osservazioni (*the estimate of the vector of parameters depends on the observation vector*). Uno stimatore (*estimator*) è una regola che trasforma il training set in un valore: stima ML, stima bayesiana, media campionaria sono tutte funzioni di $\mathbf{X}$. Conseguenza, detta subito dopo nella slide: poiché $\mathbf{X}$ è aleatorio, la stima è un vettore aleatorio (*random vector*). Le note spiegano perché: se cambia l'insieme dei campioni di training, cambia anche la stima. Esempio: stimi la luminosità media dei salmoni con la media campionaria; lunedì, con 200 pesci, esce 3.12; martedì, con altri 200, esce 3.07. La regola è la stessa, i numeri cambiano: ha senso chiedersi quanto valgono in media e quanto oscillano.`,
    symbols: [
      { s: md`\hat{\boldsymbol{\theta}}`, meaning: md`stima del vettore dei parametri` },
      { s: md`\hat{\boldsymbol{\theta}}(\mathbf{X})`, meaning: md`stimatore: funzione che associa al training set $\mathbf{X}$ un valore della stima` },
      { s: md`\mathbf{X}`, meaning: md`vettore delle osservazioni, cioè il training set` },
    ],
    whenToUse: md`È la prima frase della risposta a «How can we describe the goodness of an estimation?»: da qui seguono errore di stima, bias, varianza e bound.`,
    pitfalls: md`La fonte usa *estimate* ed *estimator* come sinonimi. A rigore lo stimatore è la funzione e la stima è il valore che assume su un training set. Bias e varianza sono proprietà dello stimatore, medie su tutti i training set possibili, non del singolo numero che hai calcolato.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\boxed{\;?\;})`,
        answer: md`\mathbf{X}`,
        distractors: [md`\boldsymbol{\theta}`, md`\boldsymbol{\varepsilon}`, md`N`],
      },
    ],
    source: [{ doc: 'ch2', page: 12 }, { doc: 'part1', page: 18 }],
  },

  // --- c12 Errore di stima -------------------------------------------------------------------------
  {
    id: 'f-c12',
    name: 'Errore di stima',
    nameEn: 'Estimation error ε',
    latex: md`\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta} = \boldsymbol{\varepsilon}(\mathbf{X}, \boldsymbol{\theta}) = [\hat{\theta}_i - \theta_i : i = 1, 2, \ldots, r]`,
    explain: md`Per quantificare l'accuratezza delle stime (*to quantify the accuracy of our estimates*) si definisce l'errore di stima (*estimation error*) $\boldsymbol{\varepsilon}$: la differenza tra il valore stimato e il valore vero del parametro. È un vettore di $r$ componenti, una per parametro: $\varepsilon_i = \hat{\theta}_i - \theta_i$. Dipende da $\mathbf{X}$, attraverso la stima, e da $\boldsymbol{\theta}$, il valore vero: da qui la scrittura $\boldsymbol{\varepsilon}(\mathbf{X}, \boldsymbol{\theta})$. Poiché dipende da $\mathbf{X}$, anche l'errore è un vettore aleatorio: il bias è la sua media, la varianza la sua dispersione. Esempio: luminosità media vera dei salmoni $m = 3$; il training set di lunedì dà $\hat{m} = 3.12$, errore $+0.12$; quello di martedì dà $3.07$, errore $+0.07$.`,
    symbols: [
      { s: md`\boldsymbol{\varepsilon}`, meaning: md`vettore errore di stima, $r$ componenti` },
      { s: md`\varepsilon_i`, meaning: md`errore sul parametro $i$-esimo` },
      { s: md`\hat{\theta}_i`, meaning: md`stima del parametro $i$-esimo` },
      { s: md`\theta_i`, meaning: md`valore vero del parametro $i$-esimo` },
      { s: md`\boldsymbol{\varepsilon}(\mathbf{X}, \boldsymbol{\theta})`, meaning: md`notazione che mette in evidenza la doppia dipendenza: dai dati e dal valore vero` },
    ],
    whenToUse: md`Ogni volta che definisci bias, varianza, consistenza: tutte le proprietà di questo foglio sono proprietà di $\boldsymbol{\varepsilon}$.`,
    pitfalls: md`Il segno è stima meno vero, non il contrario: invertirlo cambia il segno del bias. In pratica $\boldsymbol{\varepsilon}$ non si può calcolare, perché $\boldsymbol{\theta}$ è ignoto: se ne studiano le proprietà in teoria o con simulazioni su dati sintetici. Omonimia: nel Cap. 4 *estimation error* indica una componente dell'errore di generalizzazione, un'altra cosa ([«i due estimation error»](#formula:f-c66)). Nella slide la X dentro $\boldsymbol{\varepsilon}(\cdot, \boldsymbol{\theta})$ è in tondo non grassetto, ma è lo stesso vettore delle osservazioni.`,
    importance: 3,
    blanks: [
      {
        masked: md`\boldsymbol{\varepsilon} = \boxed{\;?\;} = \boldsymbol{\varepsilon}(\mathbf{X}, \boldsymbol{\theta})`,
        answer: md`\hat{\boldsymbol{\theta}} - \boldsymbol{\theta}`,
        distractors: [
          md`\boldsymbol{\theta} - \hat{\boldsymbol{\theta}}`,
          md`\hat{\boldsymbol{\theta}} - E\{\hat{\boldsymbol{\theta}}\}`,
          md`(\hat{\boldsymbol{\theta}} - \boldsymbol{\theta})^2`,
        ],
      },
    ],
    source: [{ doc: 'ch2', page: 12 }, { doc: 'part1', page: 18 }],
  },

  // --- c13 Stima ideale ----------------------------------------------------------------------------
  {
    id: 'f-c13',
    name: 'Stima ideale: errore senza bias e senza varianza',
    nameEn: 'Ideal estimate: unbiased error with no variance',
    latex: md`E\{\varepsilon_i\} = 0, \qquad \operatorname{var}\{\varepsilon_i\} = 0 \qquad (i = 1, 2, \ldots, r)`,
    explain: md`Per ottenere una stima ideale (*ideal estimate*) di ciascun parametro $\theta_i$ serve che il corrispondente errore $\varepsilon_i$ sia non polarizzato (*unbiased*, a media nulla) e non abbia varianza (*has no variance*). La slide lo dice a parole; questa scrittura lo formalizza con i simboli delle slide successive. I due requisiti sono i due assi con cui giudichi ogni stimatore: l'errore sistematico (bias) e l'errore casuale (varianza). Presi insieme equivalgono a $E\{\varepsilon_i^2\} = 0$, cioè $\varepsilon_i = 0$ con probabilità 1: la stima coincide con il valore vero su tutti i training set tranne, al più, un insieme di probabilità nulla ([«errore quadratico medio = varianza + bias²»](#derivation:der03)). Al tiro al bersaglio: tutti i colpi nel centro, sempre. Le note aggiungono che in pratica ottenere insieme le due cose può essere difficile (*challenging*), ma i due criteri servono come riferimenti fondamentali (*fundamental benchmarks*) per valutare la bontà dei metodi di stima.`,
    symbols: [
      { s: md`E\{\cdot\}`, meaning: md`valore atteso rispetto ai possibili training set $\mathbf{X}$ di $N$ campioni` },
      { s: md`\operatorname{var}\{\cdot\}`, meaning: md`varianza rispetto agli stessi training set` },
      { s: md`\varepsilon_i`, meaning: md`errore di stima sul parametro $i$-esimo` },
    ],
    whenToUse: md`In apertura della risposta sulla bontà di uno stimatore: «l'ideale sarebbe un errore a media nulla e senza varianza; poiché con dati finiti non si ottiene, confronto la varianza con il bound di Cramér-Rao e guardo il comportamento per $N$ grande».`,
    pitfalls: md`È un metro di giudizio, non un obiettivo raggiungibile: con $N$ finito uno stimatore unbiased di un modello regolare ha varianza almeno pari al bound di Cramér-Rao, che è strettamente positivo. Uno stimatore costante ha varianza nulla ma bias arbitrario: soddisfa la seconda condizione e non la prima. Le condizioni valgono per ogni parametro $i$, non in media sui parametri.`,
    importance: 3,
    blanks: [
      {
        masked: md`E\{\varepsilon_i\} = 0, \qquad \operatorname{var}\{\varepsilon_i\} = \boxed{\;?\;} \qquad (i = 1, 2, \ldots, r)`,
        answer: md`0`,
        distractors: [md`[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}`, md`1`, md`\frac{\sigma^2}{N}`],
      },
      {
        masked: md`E\{\varepsilon_i\} = \boxed{\;?\;}, \qquad \operatorname{var}\{\varepsilon_i\} = 0 \qquad (i = 1, 2, \ldots, r)`,
        answer: md`0`,
        distractors: [md`\theta_i`, md`\hat{\theta}_i`],
      },
    ],
    source: [{ doc: 'ch2', page: 12 }, { doc: 'part1', page: 18 }],
  },

  // --- c15 Bias ------------------------------------------------------------------------------------
  {
    id: 'f-c15',
    name: "Bias dell'errore di stima",
    nameEn: 'Bias of the estimation error',
    latex: md`E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}`,
    explain: md`Slide 13: il bias (polarizzazione) di un errore di stima è il suo valor medio (*the bias of an estimation error is its mean value*). Poiché $\boldsymbol{\theta}$ è una costante, esce dal valore atteso: il bias è la distanza tra la media della stima e il valore vero. È l'errore sistematico, quello che resta anche mediando su infiniti training set della stessa dimensione $N$; in generale dipende da $\boldsymbol{\theta}$ e da $N$. Esempio: la stima ML della varianza di una gaussiana, $\hat{\sigma}^2 = \frac{1}{N}\sum_{k} (x_k - \hat{m})^2$, ha media $\frac{N-1}{N}\sigma^2$, quindi bias $-\sigma^2/N$: sottostima in media, sempre meno al crescere di $N$. La slide scrive solo la frase; l'uguaglianza segue dalla definizione di $\boldsymbol{\varepsilon}$ e dalla linearità del valore atteso ([«dalla media dell'errore alla media della stima»](#derivation:der01)).`,
    symbols: [
      { s: md`E\{\boldsymbol{\varepsilon}\}`, meaning: md`bias: valor medio dell'errore di stima` },
      { s: md`E\{\hat{\boldsymbol{\theta}}\}`, meaning: md`valore atteso della stima, mediato su tutti i training set di $N$ campioni` },
      { s: md`\boldsymbol{\theta}`, meaning: md`valore vero, costante: per questo esce dal valore atteso` },
    ],
    whenToUse: md`Quando devi dire se uno stimatore sbaglia sistematicamente: calcoli $E\{\hat{\boldsymbol{\theta}}\}$ e lo confronti con $\boldsymbol{\theta}$.`,
    pitfalls: md`$\boldsymbol{\theta}$ esce dal valore atteso solo perché è costante (visione ML): nella stima bayesiana, dove è aleatorio, il passaggio non vale. Il bias è una media: un singolo training set può dare un errore grande anche con bias nullo.`,
    importance: 3,
    blanks: [
      {
        masked: md`E\{\boldsymbol{\varepsilon}\} = \boxed{\;?\;} - \boldsymbol{\theta}`,
        answer: md`E\{\hat{\boldsymbol{\theta}}\}`,
        distractors: [md`\hat{\boldsymbol{\theta}}`, md`\operatorname{var}\{\hat{\boldsymbol{\theta}}\}`, md`E\{\hat{\boldsymbol{\theta}}^2\}`],
      },
    ],
    source: [{ doc: 'ch2', page: 13 }, { doc: 'part1', page: 18 }],
  },

  // --- c16 Stima unbiased --------------------------------------------------------------------------
  {
    id: 'f-c16',
    name: 'Stima non polarizzata',
    nameEn: 'Unbiased estimate',
    latex: md`E\{\boldsymbol{\varepsilon}\} = 0 \;\Longrightarrow\; E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}`,
    explain: md`Una stima si dice non polarizzata (*unbiased*) se il valore atteso dell'errore è nullo; la freccia verde della slide porta alla scrittura equivalente: il valore atteso della stima coincide con il valore vero. Le note: in media lo stimatore produce il valore corretto del parametro (*on average, the estimator produces the correct value of the parameter*). La freccia va letta come un'equivalenza: nel livello di testo del PDF delle slide, sotto la freccia, c'è la parola «ossia», e il passaggio vale nei due sensi perché $E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}$ ([«dalla media dell'errore alla media della stima»](#derivation:der01)). Esempio: la media campionaria della luminosità dei salmoni è unbiased, $E\{\hat{m}\} = m$ per ogni $N$; la stima ML della varianza no, perché ha media $\frac{N-1}{N}\sigma^2$.`,
    symbols: [
      { s: md`E\{\boldsymbol{\varepsilon}\}`, meaning: md`bias, valor medio dell'errore` },
      { s: md`E\{\hat{\boldsymbol{\theta}}\}`, meaning: md`valore atteso della stima, mediato sui training set` },
      { s: md`0`, meaning: md`vettore nullo di $r$ componenti (la slide 13 lo scrive come scalare, la slide 15 in grassetto)` },
    ],
    whenToUse: md`Prima di confrontare la varianza con il bound di Cramér-Rao: il bound vale solo per stimatori unbiased, quindi l'assenza di bias va verificata per prima.`,
    pitfalls: md`Unbiased non vuol dire preciso: una stima può essere giusta in media e oscillare moltissimo da un training set all'altro. La condizione deve valere per ogni valore vero di $\boldsymbol{\theta}$ e per l'$N$ dato, non solo in un caso fortunato.`,
    importance: 3,
    blanks: [
      {
        masked: md`E\{\boldsymbol{\varepsilon}\} = 0 \;\Longrightarrow\; E\{\hat{\boldsymbol{\theta}}\} = \boxed{\;?\;}`,
        answer: md`\boldsymbol{\theta}`,
        distractors: [md`\mathbf{0}`, md`\hat{\boldsymbol{\theta}}`, md`\boldsymbol{\varepsilon}`],
      },
    ],
    source: [{ doc: 'ch2', page: 13 }, { doc: 'part1', page: 18 }],
  },

  // --- c17 Varianza dell'errore --------------------------------------------------------------------
  {
    id: 'f-c17',
    name: "Varianza dell'errore di stima",
    nameEn: 'Variance of the estimation error',
    latex: md`\operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \bar{\hat{\theta}}_i)^2\} \qquad (i = 1, 2, \ldots, r)`,
    explain: md`La varianza (*variance*) dell'errore sul parametro $i$ è il valore atteso del quadrato dello scarto tra la stima $\hat{\theta}_i$ e la sua media $\bar{\hat{\theta}}_i = E\{\hat{\theta}_i\}$: nella slide è la barra sopra il cappello. Misura quanto la stima oscilla da un training set all'altro: è l'errore casuale. Si calcola per ognuno degli $r$ parametri separatamente. Esempio: la media campionaria di $N$ luminosità con $\sigma = 1$ ha varianza $\sigma^2/N$; con $N = 100$ vale 0.01, cioè la stima oscilla di circa $\pm 0.1$ attorno alla sua media. L'ultimo punto della slide dice come giudicarla: per valutarne la bontà va riferita al bound di Cramér-Rao (*it is necessary to refer it to the so-called Cramér-Rao bound*).`,
    symbols: [
      { s: md`\operatorname{var}\{\varepsilon_i\}`, meaning: md`varianza dell'errore di stima sul parametro $i$-esimo` },
      { s: md`\hat{\theta}_i`, meaning: md`stima del parametro $i$-esimo, aleatoria` },
      { s: md`\bar{\hat{\theta}}_i`, meaning: md`valor medio della stima del parametro $i$-esimo, $E\{\hat{\theta}_i\}$` },
    ],
    whenToUse: md`Per il secondo requisito della stima ideale, per il confronto con il bound di Cramér-Rao e nelle definizioni di asintotica efficienza e di consistenza.`,
    pitfalls: md`Il termine sottratto è la media della stima, non il valore vero $\theta_i$: con il valore vero otterresti l'errore quadratico medio, che contiene anche il bias. Le due cose coincidono solo per stimatori unbiased ([«perché nella varianza compare la media della stima»](#derivation:der02)). Un valore di varianza da solo non dice se è piccolo: serve il riferimento del bound.`,
    importance: 3,
    blanks: [
      {
        masked: md`\operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \boxed{\;?\;})^2\} \qquad (i = 1, 2, \ldots, r)`,
        answer: md`\bar{\hat{\theta}}_i`,
        distractors: [md`\theta_i`, md`\varepsilon_i`, md`0`],
      },
    ],
    source: [
      { doc: 'ch2', page: 13 },
      { doc: 'part1', page: 18 },
      { doc: 'part1', page: 19 },
    ],
  },

  // --- c18 Varianza dell'errore = varianza della stima ---------------------------------------------
  {
    id: 'f-c18',
    name: "Varianza dell'errore = varianza della stima",
    nameEn: 'var{ε_i} equals the variance of the estimate',
    latex: md`\operatorname{var}\{\varepsilon_i\} = \operatorname{var}\{\hat{\theta}_i\}`,
    explain: md`Spiega perché nella formula della varianza compare la media della stima. $\varepsilon_i = \hat{\theta}_i - \theta_i$ e $\theta_i$ è una costante: sottrarre una costante sposta la distribuzione senza cambiarne la dispersione. Quindi la varianza dell'errore è la varianza della stima attorno alla propria media. La varianza dice quanto la stima oscilla attorno al punto in cui cade in media; quanto quel punto dista dal vero lo dice il bias. Passaggi in [«perché nella varianza compare la media della stima»](#derivation:der02).`,
    symbols: [
      { s: md`\operatorname{var}\{\varepsilon_i\}`, meaning: md`varianza dell'errore sul parametro $i$-esimo (slide 13)` },
      { s: md`\operatorname{var}\{\hat{\theta}_i\}`, meaning: md`varianza della stima del parametro $i$-esimo attorno alla propria media $E\{\hat{\theta}_i\}$` },
    ],
    whenToUse: md`Quando calcoli la varianza di uno stimatore concreto: calcoli direttamente $\operatorname{var}\{\hat{\theta}_i\}$, senza passare dall'errore.`,
    pitfalls: md`La varianza non misura la distanza dal vero: uno stimatore con varianza piccolissima può essere lontano dal vero se è biased (al bersaglio: colpi raggruppati, ma fuori dal centro).`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'ch2', page: 13 }, { doc: 'part1', page: 19 }],
  },
  {
    id: 'f-c18-2',
    name: "Solo se unbiased la varianza è l'errore quadratico medio",
    nameEn: 'Unbiased case: variance equals mean squared error',
    latex: md`E\{\hat{\theta}_i\} = \theta_i \;\Longrightarrow\; \operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \theta_i)^2\}`,
    explain: md`Se lo stimatore è unbiased, la media della stima coincide con il valore vero, $\bar{\hat{\theta}}_i = \theta_i$, e nella formula della varianza puoi sostituire l'una con l'altro: la varianza diventa l'errore quadratico medio (*mean squared error*, MSE) sul parametro $i$. È il caso in cui il bound di Cramér-Rao limita direttamente quanto la stima si allontana, in media quadratica, dal valore vero. Senza questa ipotesi l'errore quadratico medio è varianza più bias al quadrato (voce seguente).`,
    symbols: [
      { s: md`E\{\hat{\theta}_i\} = \theta_i`, meaning: md`ipotesi: stimatore unbiased sul parametro $i$` },
      { s: md`E\{(\hat{\theta}_i - \theta_i)^2\}`, meaning: md`errore quadratico medio sul parametro $i$-esimo: coincide con la varianza solo se lo stimatore è unbiased` },
    ],
    whenToUse: md`Per spiegare perché, per uno stimatore unbiased, «varianza piccola» significa «stima vicina al vero».`,
    pitfalls: md`Senza l'ipotesi non vale: per uno stimatore biased $E\{(\hat{\theta}_i - \theta_i)^2\}$ è strettamente maggiore della varianza, e la differenza è il bias al quadrato.`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'ch2', page: 13 }, { doc: 'part1', page: 19 }],
  },

  // --- c19 MSE = varianza + bias² ------------------------------------------------------------------
  {
    id: 'f-c19',
    name: 'Errore quadratico medio = varianza + bias al quadrato',
    nameEn: 'Mean squared error decomposition',
    latex: md`E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + (E\{\varepsilon_i\})^2`,
    explain: md`Integrazione didattica, non scritta nelle slide né nelle note: spiega perché la slide chiede entrambe le condizioni per la stima ideale. L'errore quadratico medio (*mean squared error*) sul parametro $i$ si scompone in varianza (errore casuale) più quadrato del bias (errore sistematico). I due termini sono non negativi, quindi l'errore quadratico medio è nullo solo se lo stimatore è insieme unbiased e senza varianza: è la stima ideale. Si ottiene aggiungendo e togliendo la media dell'errore dentro il quadrato; il termine misto ha media nulla ([«errore quadratico medio = varianza + bias²»](#derivation:der03)). Esempio: sensore con rumore gaussiano di varianza vera $\sigma^2 = 4$, stima ML della varianza con $N = 5$ letture: bias $-\sigma^2/N = -0.8$, varianza $\frac{2(N-1)}{N^2}\sigma^4 = 5.12$, errore quadratico medio $5.12 + 0.64 = 5.76$.`,
    symbols: [
      { s: md`E\{\varepsilon_i^2\}`, meaning: md`errore quadratico medio sul parametro $i$-esimo` },
      { s: md`\operatorname{var}\{\varepsilon_i\}`, meaning: md`varianza dell'errore: errore casuale` },
      { s: md`(E\{\varepsilon_i\})^2`, meaning: md`quadrato del bias: errore sistematico` },
    ],
    whenToUse: md`Quando il docente chiede se uno stimatore è buono «in termini di bias e varianza», anche per Parzen e K-NN: è il compromesso bias-varianza (*bias-variance trade-off*).`,
    pitfalls: md`Il bias entra al quadrato, la varianza no. Togliere il bias non basta e a volte peggiora: nell'esempio lo stimatore unbiased con $\frac{1}{N-1}$ ha varianza $\frac{2\sigma^4}{N-1} = 8$ ed errore quadratico medio 8, più alto del 5.76 della stima ML biased ([«stima ML della varianza con pochi campioni»](#example:ex04)). Un altro caso è la ridge nella dimostrazione [«uno stimatore biased sotto il bound»](#derivation:der18).`,
    importance: 2,
    blanks: [
      {
        masked: md`E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + \boxed{\;?\;}`,
        answer: md`(E\{\varepsilon_i\})^2`,
        distractors: [md`E\{\varepsilon_i\}`, md`2E\{\varepsilon_i\}`, md`-(E\{\varepsilon_i\})^2`],
      },
    ],
    source: [{ doc: 'ch2', page: 12 }, { doc: 'ch2', page: 13 }],
  },

  // --- c22 Disuguaglianza di Cramér-Rao ------------------------------------------------------------
  {
    id: 'f-c22',
    name: 'Disuguaglianza di Cramér-Rao',
    nameEn: 'Cramér-Rao inequality (lower bound)',
    latex: md`\operatorname{var}\{\varepsilon_i\} \geq [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}, \qquad i = 1, 2, \ldots, r`,
    explain: md`Il bound di Cramér-Rao (*Cramér-Rao bound*) esprime un limite inferiore (*lower bound*) sulla varianza di uno stimatore statistico non polarizzato (*unbiased statistical estimator*), basato sull'informazione di Fisher (*Fisher information*). Per ogni parametro $i$ la varianza dell'errore è almeno l'elemento diagonale $i$-esimo dell'inversa della matrice di informazione di Fisher. Il membro destro dipende solo dal modello $p(\mathbf{X}|\boldsymbol{\theta})$, dal valore di $\boldsymbol{\theta}$ e da $N$, non dallo stimatore: è il metro assoluto che serve per giudicare la varianza, perché nessuno stimatore unbiased può fare meglio, qualunque regola usi. Esempio: media della luminosità dei salmoni, gaussiana con $\sigma = 1$ nota e $N = 100$: il bound vale $\sigma^2/N = 0.01$, e la media campionaria, con varianza 0.01, lo tocca. Le note la chiamano disuguaglianza di Cramér-Rao (*Cramér-Rao inequality*). La fonte non la dimostra; uno schizzo per un parametro è in [«schizzo della dimostrazione del bound»](#derivation:der09).`,
    symbols: [
      { s: md`\operatorname{var}\{\varepsilon_i\}`, meaning: md`varianza dell'errore di stima sul parametro $i$-esimo` },
      { s: md`\mathbf{I}(\boldsymbol{\theta})`, meaning: md`matrice di informazione di Fisher, $r \times r$` },
      { s: md`\mathbf{I}^{-1}(\boldsymbol{\theta})`, meaning: md`inversa della matrice di Fisher` },
      { s: md`[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}`, meaning: md`elemento diagonale $i$-esimo dell'inversa: limite inferiore alla varianza di ogni stimatore unbiased del parametro $i$ (lo raggiunge solo uno stimatore efficiente, se esiste)` },
    ],
    whenToUse: md`Domanda d'esame sul bound o sulla bontà di uno stimatore: enunci il bound, dici che vale per stimatori unbiased, definisci la matrice di Fisher, dici quando lo stimatore è efficiente.`,
    pitfalls: md`Quattro trappole. Uno: vale solo per stimatori unbiased; uno stimatore biased può stare sotto, al limite uno costante ha varianza zero. Due: è l'elemento diagonale dell'inversa, non l'inverso dell'elemento diagonale; coincidono solo se la matrice è diagonale. Tre: servono condizioni di regolarità (supporto di $p$ indipendente da $\boldsymbol{\theta}$, derivabilità, scambio tra derivata e integrale, matrice di Fisher invertibile); con l'uniforme su $[0, \theta]$ il bound formale viene violato ([«quando le ipotesi di regolarità cadono»](#derivation:der20)). Quattro: è un minimo teorico, non garantisce che esista uno stimatore che lo raggiunge.`,
    importance: 3,
    blanks: [
      {
        masked: md`\operatorname{var}\{\varepsilon_i\} \geq [\boxed{\;?\;}]_{ii}, \qquad i = 1, 2, \ldots, r`,
        answer: md`\mathbf{I}^{-1}(\boldsymbol{\theta})`,
        distractors: [md`\mathbf{I}(\boldsymbol{\theta})`, md`\mathbf{I}^{2}(\boldsymbol{\theta})`, md`\mathbf{I}^{-2}(\boldsymbol{\theta})`],
      },
      {
        masked: md`\operatorname{var}\{\varepsilon_i\} \;\boxed{\;?\;}\; [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}, \qquad i = 1, 2, \ldots, r`,
        answer: md`\geq`,
        distractors: [md`\leq`, md`=`],
      },
    ],
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },

  // --- c24 Informazione di Fisher (r = 1) ----------------------------------------------------------
  {
    id: 'f-c24',
    name: 'Informazione di Fisher con un parametro',
    nameEn: 'Fisher information, scalar case',
    latex: md`I(\theta) = E\left\{\left(\frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta}\right)^2\right\} \quad (r = 1)`,
    explain: md`Il bound è costruito sull'informazione di Fisher (*Fisher information*). Con un solo parametro ($r = 1$) è il valore atteso del quadrato dello score (*score*), la derivata della log-likelihood rispetto a $\theta$. Misura quanta informazione le osservazioni $\mathbf{X}$ portano sul parametro: quanto la log-likelihood è sensibile a piccole variazioni di $\theta$. Log-likelihood appuntita: lo score cambia molto appena ti sposti, informazione alta, bound basso. Log-likelihood piatta: informazione bassa, bound alto. Esempio: media di una gaussiana con $\sigma$ nota, $I(m) = N/\sigma^2$; con $N = 100$ salmoni e $\sigma = 1$ vale 100, e il bound è $1/100$. La fonte scrive solo la forma matriciale; questa è la sua versione con $r = 1$, scritta per comodità. La forma equivalente con la curvatura è in [«le due forme dell'informazione di Fisher»](#derivation:der13).`,
    symbols: [
      { s: md`I(\theta)`, meaning: md`informazione di Fisher di tutto il training set sul parametro scalare $\theta$` },
      { s: md`\frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta}`, meaning: md`score: derivata della log-likelihood rispetto al parametro` },
      { s: md`E\{\cdot\}`, meaning: md`valore atteso sui training set $\mathbf{X}$ distribuiti secondo $p(\mathbf{X}|\theta)$, con il $\theta$ vero` },
    ],
    whenToUse: md`Per calcolare a mano il bound di un parametro scalare: derivi la log-likelihood, elevi al quadrato, prendi il valore atteso, poi fai il reciproco.`,
    pitfalls: md`Il valore atteso si calcola con il $\theta$ vero, su tutti i training set possibili: non è la pendenza sul tuo training set. Sotto le condizioni di regolarità lo score ha media nulla, quindi $I(\theta)$ è anche la varianza dello score. Per campioni iid l'informazione cresce come $N$ ($I_N = N\,I_1$), ed è per questo che il bound scende come $1/N$ ([«con campioni iid l'informazione cresce come N»](#derivation:der06)).`,
    importance: 3,
    blanks: [
      {
        masked: md`I(\theta) = E\left\{\left(\frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta}\right)^{\boxed{\;?\;}}\right\} \quad (r = 1)`,
        answer: md`2`,
        distractors: [md`1`, md`-1`, md`\frac{1}{2}`],
      },
      {
        masked: md`I(\theta) = E\left\{\left(\frac{\partial\, \boxed{\;?\;}}{\partial \theta}\right)^2\right\} \quad (r = 1)`,
        answer: md`\ln p(\mathbf{X}|\theta)`,
        distractors: [md`p(\mathbf{X}|\theta)`, md`\ln \theta`],
      },
    ],
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },

  // --- c25 Matrice di Fisher, forma compatta -------------------------------------------------------
  {
    id: 'f-c25',
    name: 'Matrice di informazione di Fisher',
    nameEn: 'Fisher information matrix',
    latex: md`\mathbf{I}(\boldsymbol{\theta}) = E\{\nabla_{\boldsymbol{\theta}} \ln[p(\mathbf{X}|\boldsymbol{\theta})]\, \nabla_{\boldsymbol{\theta}} \ln[p(\mathbf{X}|\boldsymbol{\theta})]^{t}\}`,
    explain: md`Con $r$ parametri l'informazione diventa una matrice, la matrice di informazione di Fisher (*Fisher information matrix*): il valore atteso del prodotto esterno tra il gradiente della log-likelihood rispetto a $\boldsymbol{\theta}$ e il suo trasposto (apice $t$). Il gradiente è un vettore colonna $r \times 1$, una derivata parziale per parametro; il trasposto è una riga $1 \times r$; il prodotto colonna per riga è una matrice $r \times r$. Il valore atteso è preso sulle osservazioni $\mathbf{X}$ distribuite secondo $p(\mathbf{X}|\boldsymbol{\theta})$. Esempio: gaussiana della luminosità dei salmoni con $\boldsymbol{\theta} = (m, \sigma^2)$ entrambi incogniti: la matrice è $2 \times 2$ e diagonale, con elementi $N/\sigma^2$ e $N/(2\sigma^4)$ ([«matrice di Fisher 2×2 per una gaussiana»](#derivation:der12)).`,
    symbols: [
      { s: md`\mathbf{I}(\boldsymbol{\theta})`, meaning: md`matrice di informazione di Fisher, $r \times r$` },
      { s: md`\nabla_{\boldsymbol{\theta}}`, meaning: md`gradiente rispetto al vettore dei parametri: vettore colonna $r \times 1$ di derivate parziali` },
      { s: md`\ln[p(\mathbf{X}|\boldsymbol{\theta})]`, meaning: md`log-likelihood del training set` },
      { s: md`{}^{t}`, meaning: md`trasposto: trasforma la colonna in una riga` },
      { s: md`E\{\cdot\}`, meaning: md`valore atteso sui training set $\mathbf{X}$, con il $\boldsymbol{\theta}$ vero` },
    ],
    whenToUse: md`Quando il modello ha più parametri incogniti e ti serve il bound di ciascuno: costruisci la matrice, la inverti, leggi la diagonale.`,
    pitfalls: md`L'ordine conta: gradiente per gradiente trasposto (colonna per riga) dà una matrice; nell'ordine inverso (riga per colonna) avresti uno scalare, la norma al quadrato del gradiente. Nella slide la scrittura è compatta ($ln$ in corsivo, gradiente con pedice $\boldsymbol{\theta}$): è sempre il logaritmo naturale della likelihood.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mathbf{I}(\boldsymbol{\theta}) = E\{\nabla_{\boldsymbol{\theta}} \ln[p(\mathbf{X}|\boldsymbol{\theta})]\, \nabla_{\boldsymbol{\theta}} \ln[p(\mathbf{X}|\boldsymbol{\theta})]^{\boxed{\;?\;}}\}`,
        answer: md`t`,
        distractors: [md`-1`, md`2`],
      },
      {
        masked: md`\mathbf{I}(\boldsymbol{\theta}) = E\{\nabla_{\boldsymbol{\theta}} \boxed{\;?\;}\, \nabla_{\boldsymbol{\theta}} \ln[p(\mathbf{X}|\boldsymbol{\theta})]^{t}\}`,
        answer: md`\ln[p(\mathbf{X}|\boldsymbol{\theta})]`,
        distractors: [md`p(\mathbf{X}|\boldsymbol{\theta})`, md`\ln[\boldsymbol{\theta}]`],
      },
    ],
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },

  // --- c26 Elemento (i, j) della matrice di Fisher -------------------------------------------------
  {
    id: 'f-c26',
    name: 'Elemento (i, j) della matrice di Fisher',
    nameEn: 'Fisher information matrix, element (i, j)',
    latex: md`[\mathbf{I}(\boldsymbol{\theta})]_{ij} = E\left\{ \frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial \theta_i} \cdot \frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial \theta_j} \right\}`,
    explain: md`La slide definisce la matrice elemento per elemento (*which is defined as*): nella riga $i$ e colonna $j$ c'è il valore atteso del prodotto tra la derivata parziale della log-likelihood rispetto a $\theta_i$ e quella rispetto a $\theta_j$. È la forma compatta scritta per componenti: l'elemento $(i, j)$ del prodotto esterno di un vettore $\mathbf{g}$ con sé stesso è $g_i g_j$ ([«dalla forma compatta alla definizione elemento per elemento»](#derivation:der04)). Sulla diagonale ($i = j$) c'è il valore atteso del quadrato della derivata rispetto a $\theta_i$: l'informazione che avresti sul parametro $i$ se tutti gli altri fossero noti. Fuori diagonale c'è l'accoppiamento tra due parametri: se non è zero, l'incertezza sull'uno si riflette sull'altro. Accanto a questa formula la slide porta la nota scritta in diagonale: quando il bound è raggiunto, lo stimatore si dice efficiente.`,
    symbols: [
      { s: md`[\mathbf{I}(\boldsymbol{\theta})]_{ij}`, meaning: md`elemento di riga $i$ e colonna $j$ della matrice di Fisher` },
      { s: md`\frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial \theta_i}`, meaning: md`derivata parziale della log-likelihood rispetto a $\theta_i$: componente $i$ del gradiente` },
      { s: md`\theta_i, \theta_j`, meaning: md`parametri $i$-esimo e $j$-esimo del modello` },
    ],
    whenToUse: md`Per calcolare a mano la matrice di un modello concreto, per esempio una gaussiana con media e varianza incognite: calcoli le derivate parziali, fai i prodotti a coppie, prendi i valori attesi.`,
    pitfalls: md`È il valore atteso del prodotto, non il prodotto dei valori attesi: le derivate hanno media nulla nel $\boldsymbol{\theta}$ vero, e il prodotto dei valori attesi darebbe sempre zero. La matrice è simmetrica: scambiare $i$ e $j$ non cambia nulla.`,
    importance: 3,
    blanks: [
      {
        masked: md`[\mathbf{I}(\boldsymbol{\theta})]_{ij} = E\left\{ \frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial \theta_i} \cdot \frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial \boxed{\;?\;}} \right\}`,
        answer: md`\theta_j`,
        distractors: [md`\theta_i`, md`\boldsymbol{\theta}`],
      },
      {
        masked: md`[\mathbf{I}(\boldsymbol{\theta})]_{ij} = \boxed{\;?\;}`,
        answer: md`E\left\{ \frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial \theta_i} \cdot \frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial \theta_j} \right\}`,
        distractors: [
          md`E\left\{ \frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial \theta_i} \right\} \cdot E\left\{ \frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial \theta_j} \right\}`,
          md`E\left\{ \frac{\partial p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_i} \cdot \frac{\partial p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_j} \right\}`,
        ],
      },
    ],
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },

  // --- c27 Struttura della matrice e diagonale dell'inversa ----------------------------------------
  {
    id: 'f-c27',
    name: 'La matrice di Fisher è simmetrica',
    nameEn: 'Symmetry of the Fisher information matrix',
    latex: md`[\mathbf{I}(\boldsymbol{\theta})]_{ij} = [\mathbf{I}(\boldsymbol{\theta})]_{ji}`,
    explain: md`Conseguenza diretta della definizione elemento per elemento: scambiare $i$ e $j$ scambia i due fattori del prodotto, che commutano. La matrice è quindi $r \times r$ e simmetrica, con elementi diagonali non negativi perché sono valori attesi di quadrati. Sotto le ipotesi del bound è anche definita positiva, quindi invertibile: se due parametri producessero la stessa densità (parametri non identificabili) la matrice sarebbe singolare e il bound non si potrebbe scrivere.`,
    symbols: [
      { s: md`[\mathbf{I}(\boldsymbol{\theta})]_{ij}`, meaning: md`elemento di riga $i$ e colonna $j$` },
      { s: md`[\mathbf{I}(\boldsymbol{\theta})]_{ji}`, meaning: md`elemento simmetrico, di riga $j$ e colonna $i$` },
    ],
    whenToUse: md`Per risparmiare calcoli (in una $2 \times 2$ calcoli tre elementi, non quattro) e per controllare il risultato: se la tua matrice non è simmetrica, c'è un errore.`,
    pitfalls: md`Simmetrica non vuol dire diagonale: gli elementi fuori diagonale possono essere diversi da zero, ed è proprio allora che l'elemento diagonale dell'inversa differisce dall'inverso dell'elemento diagonale.`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },
  {
    id: 'f-c27-2',
    name: "Diagonale dell'inversa contro inverso della diagonale",
    nameEn: 'Diagonal of the inverse vs inverse of the diagonal',
    latex: md`[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii} \geq \frac{1}{[\mathbf{I}(\boldsymbol{\theta})]_{ii}}`,
    explain: md`Nel bound compare l'elemento diagonale dell'inversa, non l'inverso dell'elemento diagonale. Il secondo è il bound che avresti se tutti gli altri parametri fossero noti; il primo è quello vero, con gli altri parametri da stimare insieme. Quando i parametri sono accoppiati (termini fuori diagonale non nulli) l'incertezza sugli altri può solo alzare il bound; l'uguaglianza vale se e solo se la riga $i$ ha zeri fuori diagonale, cioè il parametro è disaccoppiato. Esempio: intercetta di una regressione lineare dei prezzi delle case con feature non centrata: $[\mathbf{I}^{-1}]_{11} = \frac{\sigma^2}{N}\left(1 + \frac{\bar{x}^2}{s_x^2}\right)$ contro $1/[\mathbf{I}]_{11} = \sigma^2/N$; centrando la feature ($\bar{x} = 0$) le due quantità coincidono. Dimostrazioni: caso $2 \times 2$ in [«perché il bound usa l'elemento diagonale dell'inversa»](#derivation:der14), qualunque $r$ con Cauchy-Schwarz in [«la disuguaglianza per qualunque numero di parametri»](#derivation:der22).`,
    symbols: [
      { s: md`[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}`, meaning: md`elemento diagonale dell'inversa: bound sul parametro $i$ quando anche gli altri parametri sono incogniti` },
      { s: md`[\mathbf{I}(\boldsymbol{\theta})]_{ii}`, meaning: md`elemento diagonale della matrice: informazione sul parametro $i$ se tutti gli altri fossero noti` },
      { s: md`\bar{x}, s_x^2`, meaning: md`media e varianza campionaria della feature nell'esempio della regressione` },
    ],
    whenToUse: md`Quando il docente chiede perché la slide scrive $[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}$, o quando calcoli il bound di un modello con più parametri.`,
    pitfalls: md`Errore classico: invertire elemento per elemento. Si inverte la matrice intera e poi si legge la diagonale. La disuguaglianza richiede la matrice simmetrica e definita positiva.`,
    importance: 2,
    blanks: [
      {
        masked: md`[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii} \;\boxed{\;?\;}\; \frac{1}{[\mathbf{I}(\boldsymbol{\theta})]_{ii}}`,
        answer: md`\geq`,
        distractors: [md`\leq`, md`=`],
      },
    ],
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },
  {
    id: 'f-c27-3',
    name: 'Bound di Cramér-Rao con un parametro',
    nameEn: 'Scalar Cramér-Rao bound (r = 1)',
    latex: md`r = 1: \quad \operatorname{var}\{\varepsilon\} \geq \frac{1}{I(\theta)}`,
    explain: md`Con un solo parametro la matrice di Fisher è un numero, la sua inversa è il reciproco, e il bound diventa $1/I(\theta)$: più informazione, varianza minima più bassa. È la forma da usare negli esercizi con un parametro: media di una gaussiana con varianza nota, tasso di un'esponenziale, probabilità di spam di una Bernoulli. Esempio: $N$ email, ognuna spam con probabilità $\theta$: $I(\theta) = \frac{N}{\theta(1-\theta)}$ e il bound è $\frac{\theta(1-\theta)}{N}$; con $\theta = 0.3$ e $N = 1000$ vale 0.00021, cioè una deviazione standard minima di circa 0.0145.`,
    symbols: [
      { s: md`\varepsilon`, meaning: md`errore di stima sull'unico parametro` },
      { s: md`I(\theta)`, meaning: md`informazione di Fisher scalare, di tutto il training set` },
    ],
    whenToUse: md`In ogni esercizio con un solo parametro incognito, e per ricordare la forma generale: con $r$ parametri il reciproco diventa l'elemento diagonale dell'inversa.`,
    pitfalls: md`Vale per stimatori unbiased. $I(\theta)$ è l'informazione di tutti gli $N$ campioni, non di uno solo: per campioni iid è $N$ volte l'informazione di un campione.`,
    importance: 2,
    blanks: [
      {
        masked: md`r = 1: \quad \operatorname{var}\{\varepsilon\} \geq \boxed{\;?\;}`,
        answer: md`\frac{1}{I(\theta)}`,
        distractors: [md`I(\theta)`, md`\frac{1}{I(\theta)^2}`, md`\sqrt{I(\theta)}`],
      },
    ],
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },

  // --- c28 Stimatore efficiente --------------------------------------------------------------------
  {
    id: 'f-c28',
    name: 'Stimatore efficiente',
    nameEn: 'Efficient estimator',
    latex: md`\operatorname{var}\{\varepsilon_i\} = [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}, \qquad i = 1, 2, \ldots, r`,
    explain: md`Nota scritta in diagonale sulla slide 14: quando il bound è raggiunto, lo stimatore si dice efficiente (*when the bound is reached, the estimator is said efficient*). Il segno $\geq$ della disuguaglianza di Cramér-Rao diventa $=$ per ogni parametro. Le note: quando la varianza raggiunge il bound, lo stimatore ottiene la minima varianza possibile per uno stimatore unbiased ed è quindi ottimo in termini di efficienza statistica (*statistical efficiency*). Efficiente significa dunque unbiased e con varianza uguale al bound. La fonte lo dice a parole; questa uguaglianza ne è la formalizzazione. Esempio: la media campionaria della luminosità dei salmoni (gaussiana, $\sigma$ nota) ha varianza $\sigma^2/N$, uguale al bound: è efficiente.`,
    symbols: [
      { s: md`\operatorname{var}\{\varepsilon_i\}`, meaning: md`varianza dell'errore di stima sul parametro $i$-esimo (slide 13)` },
      { s: md`[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}`, meaning: md`bound di Cramér-Rao per il parametro $i$-esimo (slide 14)` },
    ],
    whenToUse: md`All'orale, subito dopo aver enunciato il bound. Poi il legame con la stima ML: se esiste uno stimatore efficiente e la stima ML è unbiased, la stima ML è proprio lo stimatore efficiente.`,
    pitfalls: md`Uno stimatore efficiente non sempre esiste: per molti modelli nessuno stimatore unbiased tocca il bound con $N$ finito, e allora si guarda l'efficienza asintotica. Uno stimatore biased con varianza uguale al bound non è efficiente nel senso della slide, perché il bound riguarda gli stimatori unbiased.`,
    importance: 3,
    blanks: [
      {
        masked: md`\operatorname{var}\{\varepsilon_i\} \;\boxed{\;?\;}\; [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}, \qquad i = 1, 2, \ldots, r`,
        answer: md`=`,
        distractors: [md`\geq`, md`\leq`, md`<`],
      },
      {
        masked: md`\operatorname{var}\{\varepsilon_i\} = [\boxed{\;?\;}]_{ii}, \qquad i = 1, 2, \ldots, r`,
        answer: md`\mathbf{I}^{-1}(\boldsymbol{\theta})`,
        distractors: [md`\mathbf{I}(\boldsymbol{\theta})`, md`\mathbf{I}^{-2}(\boldsymbol{\theta})`],
      },
    ],
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },

  // --- c29 Esempio: bound per la media di una gaussiana (integrazione) -----------------------------
  {
    id: 'f-c29',
    name: 'Informazione di Fisher per la media di una gaussiana',
    nameEn: 'Fisher information for the mean of a Gaussian',
    latex: md`I(m) = \frac{N}{\sigma^2}`,
    explain: md`Esempio integrativo, non presente nella fonte: dà numeri alle formule della slide 14. Modello gaussiano monodimensionale, varianza $\sigma^2$ nota, media $m$ da stimare con $N$ campioni iid. Lo score è $\frac{1}{\sigma^2}\sum_{k} (x_k - m)$; il valore atteso del suo quadrato vale $N\sigma^2/\sigma^4 = N/\sigma^2$, perché i termini incrociati hanno media nulla per l'indipendenza e ognuno dei $N$ termini quadrati vale $\sigma^2$. L'informazione cresce con $N$ (più campioni) e scende con $\sigma^2$ (campioni più rumorosi): sono i due fattori delle note, numero e qualità intrinseca dei campioni. Passaggi in [«bound per la media di una gaussiana»](#derivation:der05).`,
    symbols: [
      { s: md`m`, meaning: md`media della gaussiana, parametro da stimare` },
      { s: md`\sigma^2`, meaning: md`varianza nota della gaussiana` },
      { s: md`N`, meaning: md`numero di campioni iid` },
    ],
    whenToUse: md`È l'esempio da portare all'orale per rendere concreti informazione di Fisher e bound.`,
    pitfalls: md`È l'informazione di tutti gli $N$ campioni: quella di un campione solo è $1/\sigma^2$. Se anche $\sigma^2$ è incognita la matrice diventa $2 \times 2$, ma resta diagonale, quindi il bound sulla media non cambia.`,
    importance: 2,
    blanks: [
      {
        masked: md`I(m) = \frac{\boxed{\;?\;}}{\sigma^2}`,
        answer: md`N`,
        distractors: [md`1`, md`N^2`, md`\sqrt{N}`],
      },
    ],
    source: [{ doc: 'ch2', page: 14 }],
  },
  {
    id: 'f-c29-2',
    name: 'Bound di Cramér-Rao per la media di una gaussiana',
    nameEn: 'Cramér-Rao bound for the Gaussian mean',
    latex: md`\operatorname{var}\{\varepsilon\} \geq \frac{\sigma^2}{N}`,
    explain: md`Con un parametro il bound è il reciproco dell'informazione: $\sigma^2/N$. Nessuno stimatore unbiased della media può avere varianza più piccola. Scende come $1/N$: per dimezzare la deviazione standard minima servono quattro volte i campioni. Esempio integrativo, lo stesso di [«quanti salmoni servono?»](#example:ex03): luminosità con $\sigma = 2$ nota e $N = 25$ pesci; $I(m) = 25/4 = 6.25$, bound $4/25 = 0.16$, cioè deviazione standard minima 0.4. Perché il bound non superi 0.1 servono $N \geq \sigma^2/0.1 = 40$ pesci.`,
    symbols: [
      { s: md`\varepsilon`, meaning: md`errore di stima sulla media, $\hat{m} - m$` },
      { s: md`\sigma^2`, meaning: md`varianza nota dei campioni` },
      { s: md`N`, meaning: md`numero di campioni iid` },
    ],
    whenToUse: md`Per dimensionare un training set: fissata la precisione che vuoi sulla media, ricavi il numero minimo di campioni.`,
    pitfalls: md`Tende a zero sia per $N \to +\infty$ sia per $\sigma \to 0$. Riguarda solo gli stimatori unbiased: uno stimatore biased della media può stare sotto.`,
    importance: 2,
    blanks: [
      {
        masked: md`\operatorname{var}\{\varepsilon\} \geq \frac{\sigma^2}{\boxed{\;?\;}}`,
        answer: md`N`,
        distractors: [md`N^2`, md`\sqrt{N}`, md`N-1`],
      },
    ],
    source: [{ doc: 'ch2', page: 14 }],
  },
  {
    id: 'f-c29-3',
    name: 'La media campionaria raggiunge il bound',
    nameEn: 'Sample mean attains the bound (efficient)',
    latex: md`\hat{m} = \frac{1}{N}\sum_{k=1}^{N} x_k, \qquad \operatorname{var}\{\hat{m}\} = \frac{\sigma^2}{N}`,
    explain: md`La media campionaria (*sample mean*) è unbiased, $E\{\hat{m}\} = m$, e ha varianza $\frac{1}{N^2} \cdot N\sigma^2 = \sigma^2/N$: per variabili indipendenti la varianza della somma è la somma delle varianze, e $\operatorname{var}\{aX\} = a^2 \operatorname{var}\{X\}$ con $a = 1/N$. La varianza coincide con il bound, quindi è uno stimatore efficiente. È anche la stima ML della media: esempio concreto del risultato «se esiste uno stimatore efficiente e la stima ML è unbiased, la stima ML è lo stimatore efficiente».`,
    symbols: [
      { s: md`\hat{m}`, meaning: md`media campionaria, stima della media` },
      { s: md`x_k`, meaning: md`$k$-esimo campione (per esempio la luminosità del $k$-esimo salmone)` },
      { s: md`\operatorname{var}\{\hat{m}\}`, meaning: md`varianza della stima al variare del training set` },
    ],
    whenToUse: md`Come esempio positivo di stimatore efficiente, da mettere accanto al controesempio della stima ML della varianza, biased ma asintoticamente efficiente.`,
    pitfalls: md`Non ogni stimatore unbiased è efficiente: per una gaussiana anche la mediana campionaria è unbiased, ma per $N$ grande ha varianza circa $\frac{\pi}{2}\frac{\sigma^2}{N}$; con $\sigma = 2$ e $N = 25$ vale circa 0.247 (la formula asintotica dà 0.251) contro il bound 0.16, e il rapporto con il bound tende a $\pi/2$ al crescere di $N$. E l'efficienza dipende dal modello: con dati di Laplace (code più pesanti) di scala $b$ la media campionaria resta unbiased ma ha varianza $2b^2/N$, il doppio del bound $b^2/N$ di quel modello.`,
    importance: 2,
    blanks: [
      {
        masked: md`\hat{m} = \frac{1}{N}\sum_{k=1}^{N} x_k, \qquad \operatorname{var}\{\hat{m}\} = \boxed{\;?\;}`,
        answer: md`\frac{\sigma^2}{N}`,
        distractors: [md`\sigma^2`, md`\frac{\sigma^2}{N^2}`, md`\frac{\sigma}{\sqrt{N}}`],
      },
    ],
    source: [{ doc: 'ch2', page: 14 }],
  },

  // --- c32 Ipotesi di infiniti campioni ------------------------------------------------------------
  {
    id: 'f-c32',
    name: "Numero di campioni che tende all'infinito",
    nameEn: 'Infinite number of training samples',
    latex: md`N \to +\infty`,
    explain: md`Solo nelle note: per valutare e confrontare correttamente gli stimatori si assume spesso un numero infinito di campioni di training (*infinite number of training samples*). Il motivo è nella frase che precede: l'efficacia di uno stimatore può essere molto penalizzata dal numero limitato di campioni disponibili, e la qualità di uno stimatore dipende da due fattori, il numero di campioni di training e la loro qualità intrinseca (*the number of training samples and the intrinsic quality of those samples*). Mandare $N$ all'infinito toglie di mezzo la scarsità dei dati e fa giudicare la regola di stima in sé. È la giustificazione del limite che compare in tutte le definizioni successive: asintoticamente non polarizzata, asintoticamente efficiente, consistente. Serve anche perché, come dice la slide 15, nei problemi reali gli stimatori sono spesso biased e inefficienti (*biased and inefficient*): a $N$ finito quasi nessuno supererebbe l'esame.`,
    symbols: [
      { s: md`N`, meaning: md`numero di campioni di training, fatto tendere all'infinito per giudicare la regola di stima e non la scarsità dei dati` },
    ],
    whenToUse: md`Come frase di passaggio all'orale, dalle proprietà a $N$ finito (unbiased, efficiente) alle proprietà asintotiche.`,
    pitfalls: md`È un criterio di giudizio, non una promessa sul tuo dataset: una proprietà asintotica non dice quanti campioni bastano. E più campioni non rimediano a campioni di cattiva qualità: rumorosi, etichettati male, non rappresentativi.`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'part1', page: 19 }, { doc: 'ch2', page: 15 }],
  },

  // --- c34 Asintoticamente non polarizzata ---------------------------------------------------------
  {
    id: 'f-c34',
    name: 'Stima asintoticamente non polarizzata',
    nameEn: 'Asymptotically unbiased estimate',
    latex: md`\lim_{N \to +\infty} E\{\boldsymbol{\varepsilon}\} = \mathbf{0} \;\Longrightarrow\; \lim_{N \to +\infty} E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}`,
    explain: md`Una stima è asintoticamente non polarizzata (*asymptotically unbiased*) se il bias tende al vettore nullo quando il numero di campioni $N$ tende all'infinito; la freccia verde della slide porta alla forma equivalente: il valore atteso della stima tende al valore vero. Le note: al crescere di $N$ il valore atteso dello stimatore si avvicina al valore vero del parametro. Uno stimatore unbiased lo è anche asintoticamente, perché il suo bias è zero per ogni $N$; il viceversa non vale. Esempio del corso: la stima ML della covarianza ha $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$, biased per ogni $N$ finito ma con un fattore che tende a 1 ([«la stima ML della covarianza è biased»](#formula:f-c64-2)): con $N = 10$ sottostima del 10%, con $N = 1000$ dello 0.1%.`,
    symbols: [
      { s: md`\lim_{N \to +\infty}`, meaning: md`limite al crescere del numero $N$ di campioni del training set` },
      { s: md`E\{\boldsymbol{\varepsilon}\}`, meaning: md`bias calcolato con $N$ campioni: una funzione di $N$` },
      { s: md`\mathbf{0}`, meaning: md`vettore nullo di $r$ componenti` },
      { s: md`E\{\hat{\boldsymbol{\theta}}\}`, meaning: md`valore atteso della stima con $N$ campioni` },
    ],
    whenToUse: md`È la prima delle tre proprietà asintotiche. Serve a giustificare l'uso di stimatori biased come la stima ML della varianza.`,
    pitfalls: md`Il limite riguarda il bias, calcolato per ogni $N$ come media su tutti i training set di quella dimensione: non è il limite della stima su un singolo training set che cresce (di quello parla la consistenza). Lo zero a destra è un vettore, in grassetto nella slide 15.`,
    importance: 3,
    blanks: [
      {
        masked: md`\lim_{N \to +\infty} E\{\boldsymbol{\varepsilon}\} = \boxed{\;?\;} \;\Longrightarrow\; \lim_{N \to +\infty} E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}`,
        answer: md`\mathbf{0}`,
        distractors: [md`\boldsymbol{\theta}`, md`\mathbf{1}`, md`+\infty`],
      },
      {
        masked: md`\lim_{N \to +\infty} E\{\boldsymbol{\varepsilon}\} = \mathbf{0} \;\Longrightarrow\; \lim_{N \to +\infty} E\{\hat{\boldsymbol{\theta}}\} = \boxed{\;?\;}`,
        answer: md`\boldsymbol{\theta}`,
        distractors: [md`\mathbf{0}`, md`\hat{\boldsymbol{\theta}}`],
      },
    ],
    source: [{ doc: 'ch2', page: 15 }, { doc: 'part1', page: 19 }],
  },

  // --- c35 Asintoticamente efficiente --------------------------------------------------------------
  {
    id: 'f-c35',
    name: 'Stima asintoticamente efficiente',
    nameEn: 'Asymptotically efficient estimate',
    latex: md`\lim_{N \to +\infty} \frac{\operatorname{var}\{\varepsilon_i\}}{[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1, \qquad i = 1, 2, \ldots, r`,
    explain: md`Una stima è asintoticamente efficiente (*asymptotically efficient*) se, per ogni parametro, il rapporto tra la varianza dell'errore e il bound di Cramér-Rao corrispondente tende a 1 per $N \to +\infty$. Le note: lo stimatore raggiunge la minima varianza possibile, cioè il bound di Cramér-Rao, tra tutti gli stimatori unbiased nel limite di campioni numerosi (*in the limit of large sample sizes*). Si usa il rapporto e non la differenza perché varianza e bound tendono entrambi a zero, di solito come $1/N$: la differenza andrebbe a zero per qualunque stimatore ragionevole, il rapporto controlla che ci vadano con la stessa velocità. Esempio: stima ML della varianza di una gaussiana con media incognita: varianza $\frac{2(N-1)}{N^2}\sigma^4$, bound $\frac{2\sigma^4}{N}$, rapporto $\frac{N-1}{N} \to 1$ ([«la stima ML della varianza è asintoticamente efficiente»](#derivation:der11)). In numeri il rapporto vale 0.8 con $N = 5$, 0.99 con $N = 100$, 0.999 con $N = 1000$.`,
    symbols: [
      { s: md`\lim_{N \to +\infty}`, meaning: md`limite al crescere del numero $N$ di campioni iid del training set` },
      { s: md`\frac{\operatorname{var}\{\varepsilon_i\}}{[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}}`, meaning: md`rapporto tra la varianza dello stimatore e il bound di Cramér-Rao, calcolati entrambi con lo stesso $N$` },
    ],
    whenToUse: md`È la seconda proprietà asintotica, ed è una delle tre che la stima ML possiede anche quando uno stimatore efficiente non esiste.`,
    pitfalls: md`Sottigliezza che la fonte non discute: il bound è definito per stimatori unbiased, ma questa definizione si applica anche a stimatori solo asintoticamente unbiased come la ML. A $N$ finito il rapporto può allora essere minore di 1 senza contraddizione: nell'esempio vale $(N-1)/N$ ([«stima ML della varianza con pochi campioni»](#example:ex04)). Efficiente implica asintoticamente efficiente, non il contrario.`,
    importance: 3,
    blanks: [
      {
        masked: md`\lim_{N \to +\infty} \frac{\operatorname{var}\{\varepsilon_i\}}{[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}} = \boxed{\;?\;}, \qquad i = 1, 2, \ldots, r`,
        answer: md`1`,
        distractors: [md`0`, md`+\infty`],
      },
      {
        masked: md`\lim_{N \to +\infty} \frac{\operatorname{var}\{\varepsilon_i\}}{\boxed{\;?\;}} = 1, \qquad i = 1, 2, \ldots, r`,
        answer: md`[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}`,
        distractors: [md`[\mathbf{I}(\boldsymbol{\theta})]_{ii}`, md`E\{\varepsilon_i\}`],
      },
    ],
    source: [{ doc: 'ch2', page: 15 }, { doc: 'part1', page: 19 }],
  },
]
