// Flashcard del modulo m10 (stima con dati incompleti e algoritmo EM): formule, definizioni, confronti,
// intuizioni e procedure. Coprono tutti i 67 concetti dell'inventario, nell'ordine delle slide
// (ch2 p67-77, part1 p45-50).
import { md } from '../../types'
import type { Flashcard } from '../../types'

export const flashcards: Flashcard[] = [
  // --- variabili latenti e dati incompleti ---
  {
    id: 'fc-variabili-latenti',
    kind: 'definizione',
    q: md`Che cosa sono le variabili latenti non osservate, e che cosa cambiano rispetto alla stima vista finora nel Cap. 2?`,
    a: md`Finora (ML, stima bayesiana, K-NN, Parzen) il modello dipendeva solo da variabili osservabili (*observable variables*): ogni campione era misurato per intero. In alcuni casi reali il modello dipende anche da variabili latenti non osservate (*unobserved latent variables*): grandezze che fanno parte del meccanismo che genera i dati ma che nessuno misura. Nella mistura di gaussiane la latente è l'indice del modo che ha generato ogni campione; nell'esempio dei quattro punti è il valore mancante di una feature.`,
  },
  {
    id: 'fc-informazione-parziale',
    kind: 'intuizione',
    q: md`Perché non conviene ignorare le variabili latenti o scartare i campioni incompleti?`,
    a: md`Le note: la pratica statistica preferisce usare tutta l'informazione disponibile, anche se parziale (*utilizing all available information, even if it is partial*), perché anche quella ha valore. Nell'esempio dei quattro punti, scartare il punto a cui manca $x_1$ porterebbe la stima di $\mu_2$ da $2$ a $1.33$: andrebbe persa l'informazione $x_2 = 4$. EM costruisce uno stimatore che usa anche i dati parziali.`,
  },
  {
    id: 'fc-parametrico-dati-incompleti',
    kind: 'confronto',
    q: md`Con dati incompleti la fonte sceglie l'approccio parametrico o quello non parametrico? Perché?`,
    a: md`Il parametrico (*for problems with incomplete data, the estimation approach that is used is the parametric one*). Per compensare ciò che non si osserva serve una forma funzionale nota, con un vettore di parametri $\boldsymbol{\theta}$.

Il non parametrico (Parzen, K-NN) è sub-ottimo: non sfrutta l'informazione a priori sulla struttura del modello (per esempio che è una mistura di gaussiane), quindi la stima diventa meno efficiente e meno accurata. In più restituisce solo la $p(\mathbf{x})$ complessiva, non i singoli modi. Le note: *when prior information is used, the estimation problem becomes parametric*.`,
  },
  {
    id: 'fc-em-classe-di-problemi',
    kind: 'definizione',
    q: md`Come introduce la slide 67 l'algoritmo EM?`,
    a: md`Come soluzione alla classe dei problemi di stima con dati incompleti (*A solution to this class of estimation problems is the Expectation-Maximization (EM) algorithm*; le note dicono *a robust solution*). È uno strumento generale per la stima parametrica con variabili latenti, non un algoritmo pensato per le sole misture. La mistura di gaussiane è l'esempio tipico (*a typical example of estimation with incomplete data*) che la slide annuncia.`,
  },
  {
    id: 'fc-due-forme-incompletezza',
    kind: 'confronto',
    q: md`Quali due forme di dato incompleto compaiono nella fonte, e che cosa le accomuna?`,
    a: md`- **Feature mancante**: ad alcuni campioni manca il valore di una feature (note p46; i quattro punti della slide 77, uno senza $x_1$).
- **Appartenenza nascosta**: nella mistura ogni campione è misurato per intero, ma non si sa quale modo lo ha generato (slide 69).

In entrambi i casi ciò che manca diventa la variabile latente $\mathbf{Y}$ e il dataset completo è $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$: per questo lo stesso EM risolve i due problemi.`,
  },

  // --- la mistura di gaussiane ---
  {
    id: 'fc-ipotesi-iid',
    kind: 'definizione',
    q: md`Da quali ipotesi parte l'esempio della mistura, e che cosa indicano $N$, $n$ e $X$?`,
    a: md`Si hanno $N$ osservazioni i.i.d. $\mathbf{x}_i$ ($i = 1, 2, \ldots, N$) in uno spazio $n$-dimensionale $X$. I.i.d. (*independent and identically distributed*): tutti i campioni escono dalla stessa $p(\mathbf{x})$ e nessuno influenza gli altri; è l'ipotesi che permette di scrivere la verosimiglianza come prodotto.

$N$ è il numero di campioni, $n$ la dimensione delle feature, $X$ lo spazio (e poi anche l'insieme dei dati osservati). Attenzione all'indice: nella slide 68 $i$ numera sia i campioni sia i modi; dalla slide 76 i campioni si numerano con $j$ e $i$ resta ai modi.`,
  },
  {
    id: 'fc-mistura',
    kind: 'formula',
    q: md`Scrivi la densità di una mistura di $M$ modi gaussiani.`,
    a: md`$$p(\mathbf{x}) = \sum_{i=1}^{M} P_i \, p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i)$$

La densità complessiva è la somma pesata di $M$ gaussiane (*mixture of M Gaussian modes*; nelle note *Gaussian Mixture Model*, GMM). Ogni termine è un modo (*mode*) o componente (*mixture component*) con il suo peso $P_i$, il suo vettore media e la sua matrice di covarianza.`,
  },
  {
    id: 'fc-parametri-del-modo',
    kind: 'definizione',
    q: md`Che cosa sono $P_i$, $\mathbf{m}_i$ e $\Sigma_i$, e che cosa dicono della campana $i$?`,
    a: md`Probabilità a priori, vettore media e matrice di covarianza dell'$i$-esima componente (*prior probability, mean vector and covariance matrix of the i-th mixture component*). $P_i$ dice quale frazione dei campioni viene in media dal modo $i$, $\mathbf{m}_i$ dove è centrata la campana, $\Sigma_i$ la sua forma e il suo orientamento. $p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i)$ è la densità gaussiana del modo.`,
  },
  {
    id: 'fc-gaussiana-multivariata',
    kind: 'formula',
    q: md`Scrivi la densità gaussiana $n$-dimensionale del modo $i$ (formula chiesta anche all'orale).`,
    a: md`$$p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i) = \frac{1}{(2\pi)^{n/2} \, |\Sigma_i|^{1/2}} \exp\left\{ -\frac{1}{2} (\mathbf{x} - \mathbf{m}_i)^{t} \, \Sigma_i^{-1} (\mathbf{x} - \mathbf{m}_i) \right\}$$

Il fattore davanti la fa integrare a 1; nell'esponente c'è il quadrato della distanza di Mahalanobis da $\mathbf{m}_i$. Queste pagine non la riscrivono (viene dal modulo sul modello gaussiano), ma serve per calcolare le posterior dell'E-step.`,
  },
  {
    id: 'fc-vincoli-prior',
    kind: 'proprieta',
    q: md`Quali vincoli rispettano i prior $P_i$ della mistura, e a che cosa servono?`,
    a: md`$$\sum_{i=1}^{M} P_i = 1, \qquad P_i \ge 0$$

Sono probabilità di $M$ eventi esaustivi e mutuamente esclusivi: ogni campione viene da uno e un solo modo. Il vincolo fa integrare $p(\mathbf{x})$ a 1 e, con un moltiplicatore di Lagrange, produce il fattore $1/N$ nell'aggiornamento EM di $P_i$. Le note chiamano i $P_i$ anche pesi della mistura (*mixing weights*). La slide non scrive il vincolo: è implicito nella definizione di probabilità a priori.`,
  },
  {
    id: 'fc-vettore-theta',
    kind: 'formula',
    q: md`Com'è fatto il vettore dei parametri $\theta$ della mistura?`,
    a: md`$$\theta = [P_1, P_2, \ldots, P_M; \; \mathbf{m}_1, \mathbf{m}_2, \ldots, \mathbf{m}_M; \; \Sigma_1, \Sigma_2, \ldots, \Sigma_M]$$

Tre gruppi, come elencano le note: il contributo di ciascun modo alla mistura, la media di ciascun modo, la covarianza di ciascun modo. La forma del modello è nota e i valori sono ignoti: resta una stima parametrica. Con $M = 3$ modi in $n = 2$ dimensioni e covarianze piene i numeri liberi sono $2 + 6 + 9 = 17$ (un prior è fissato dal vincolo di somma, ogni covarianza è simmetrica).`,
  },
  {
    id: 'fc-superficie-mistura',
    kind: 'intuizione',
    q: md`Che cosa mostra la figura 3D della slide 68, e che messaggio porta?`,
    a: md`La superficie di una densità 2D formata da quattro campane gaussiane di colore diverso: una rossa alta a sinistra, una grigio chiaro in primo piano, una grigio scuro più stretta sullo sfondo, una marrone larga e bassa a destra. Le campane hanno altezza ($P_i$), posizione ($\mathbf{m}_i$) e forma ($\Sigma_i$) diverse e si sovrappongono in parte: nelle zone di sovrapposizione non puoi dire a occhio a quale modo appartiene un punto.`,
  },

  // --- obiettivo e motivi dell'incompletezza ---
  {
    id: 'fc-obiettivo',
    kind: 'definizione',
    q: md`Qual è l'obiettivo della stima nell'esempio della mistura?`,
    a: md`Stimare la distribuzione di ciascun modo gaussiano di $p(\mathbf{x})$ (*to estimate the distribution of each Gaussian mode of p(x)*), cioè $P_i$, $\mathbf{m}_i$ e $\Sigma_i$ per ogni $i$. Le note dicono la stessa cosa in termini di parametri: stimare i parametri della $p(\mathbf{x})$ caratterizzata da questi modi. Stimare la sola $p(\mathbf{x})$ complessiva non basta: lo farebbe anche un Parzen.`,
  },
  {
    id: 'fc-tre-motivi',
    kind: 'proprieta',
    q: md`Per quali tre motivi la mistura è un problema con dati incompleti (slide 69)?`,
    a: md`1. Si hanno solo le osservazioni dell'intera $p(\mathbf{x})$, non quelle dei singoli modi: i campioni arrivano mescolati, senza un training set per modo.
2. Non si sa a quale modo è associato ogni campione (*which are the samples to use for the estimation of each mode?*).
3. Si sa solo che tra i modi nascosti c'è una relazione di tipo somma (*relationship of the summation type*).`,
  },
  {
    id: 'fc-appartenenza-latente',
    kind: 'intuizione',
    q: md`Perché il secondo motivo di incompletezza, l'appartenenza ignota, è il cuore del problema?`,
    a: md`Se sapessi quale modo ha generato ogni campione, divideresti i dati in $M$ gruppi e faresti una stima ML gaussiana separata per gruppo, in forma chiusa. L'associazione campione-modo che manca è la variabile latente $\mathbf{Y}$: EM la sostituisce con probabilità di appartenenza.`,
  },
  {
    id: 'fc-relazione-somma',
    kind: 'intuizione',
    q: md`Da dove nasce la «relazione di tipo somma» tra i modi nascosti, e perché è utile?`,
    a: md`Dalla marginalizzazione della latente. Se $y_{ji} = 1$ quando $\mathbf{x}_j$ viene dal modo $i$, sommando la congiunta sugli $M$ valori possibili di $\mathbf{y}_j$ ottieni la mistura:

$$p(\mathbf{x}_j \,|\, \boldsymbol{\theta}) = \sum_{i=1}^{M} P(y_{ji} = 1 \,|\, \boldsymbol{\theta}) \, p(\mathbf{x}_j \,|\, y_{ji} = 1, \boldsymbol{\theta}) = \sum_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)$$

È poca informazione, ma è l'informazione a priori che rende il problema parametrico e risolvibile con EM: la mistura è un modello a variabile latente.`,
  },

  // --- il problema ML ---
  {
    id: 'fc-problema-ml',
    kind: 'formula',
    q: md`Come riparte la slide 70 dalla stima a massima verosimiglianza, e che cosa cambia con EM?`,
    a: md`$$\boldsymbol{\theta}^{*} = \arg\max \; l(\boldsymbol{\theta} | \mathbf{X}), \qquad l(\boldsymbol{\theta} | \mathbf{X}) = p(\mathbf{X} \,|\, \boldsymbol{\theta}) = \prod_{i=1}^{N} p(\mathbf{x}_i \,|\, \boldsymbol{\theta})$$

Il prodotto vale perché i campioni sono i.i.d.: indipendenza, quindi la congiunta è il prodotto delle marginali; identica distribuzione, quindi la stessa $p(\cdot \,|\, \boldsymbol{\theta})$ per tutti. EM non cambia il criterio, resta una stima ML: cambia il modo di cercarne il massimo quando manca una soluzione analitica.`,
  },
  {
    id: 'fc-ml-facile-difficile',
    kind: 'confronto',
    q: md`Quando la stima ML è facile e quando è difficile? Fai un esempio per ciascun caso.`,
    a: md`Dipende dalla forma di $p(\mathbf{X} \,|\, \boldsymbol{\theta})$ (*the ML estimation problem can be easy or hard*).

- **Facile**: una sola gaussiana. Il logaritmo cancella l'esponenziale, la derivata uguagliata a zero dà media e covarianza campionarie in forma chiusa.
- **Difficile**: la mistura. Per molti problemi non esiste una soluzione analitica e servono tecniche più elaborate; EM è una di queste (*The EM algorithm is one of them*).`,
  },
  {
    id: 'fc-log-di-una-somma',
    kind: 'formula',
    q: md`Scrivi la log-verosimiglianza della mistura e spiega perché impedisce una soluzione in forma chiusa.`,
    a: md`$$\ln l(\boldsymbol{\theta} | \mathbf{X}) = \sum_{j=1}^{N} \ln \left[ \sum_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]$$

Il logaritmo resta davanti alla somma dei modi e non la separa. Annullando la derivata rispetto a $\mathbf{m}_i$ trovi

$$\mathbf{m}_i = \frac{\sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}) \, \mathbf{x}_j}{\sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta})}$$

ma le posterior $P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta})$ dipendono da tutto $\boldsymbol{\theta}$, medie comprese: equazioni accoppiate e implicite. Serve una tecnica iterativa. La fonte dice solo che per le misture *an analytical solution is often not feasible*; il conto è un'integrazione.`,
  },

  // --- formulazione: dataset completo e verosimiglianze ---
  {
    id: 'fc-x-y-z',
    kind: 'definizione',
    q: md`Nella formulazione di EM (slide 71), che cosa sono $\mathbf{X}$, $\mathbf{Y}$ e $\mathbf{Z}$?`,
    a: md`- $\mathbf{X}$: i dati osservati, generati da qualche distribuzione. È il dataset incompleto (*incomplete dataset*): da solo non contiene l'informazione che renderebbe facile la stima.
- $\mathbf{Y}$: i dati mancanti o latenti (*missing data*).
- $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$: il dataset completo (*complete dataset*). Si postula che esista, ma non è disponibile; EM ragiona su $\mathbf{Z}$ pur osservando solo $\mathbf{X}$.`,
  },
  {
    id: 'fc-y-one-hot',
    kind: 'definizione',
    q: md`Che cosa è $\mathbf{Y}$ nella mistura di gaussiane?`,
    a: md`Un vettore binario di appartenenza (*a binary vector that indicates which Gaussian mode each sample belongs to*). Per ogni campione $\mathbf{x}_j$, $\mathbf{y}_j$ è lungo $M$ e ha un solo 1, nella posizione del modo che lo ha generato (codifica *one-hot*). Il modello assume che $\mathbf{X}$ venga da una mistura di componenti, ma non si sa quale componente abbia generato ogni osservazione: questa informazione mancante è $\mathbf{Y}$.`,
  },
  {
    id: 'fc-congiunta',
    kind: 'formula',
    q: md`Scrivi la densità congiunta dei dati completi e spiega da dove viene la fattorizzazione.`,
    a: md`$$p(\mathbf{Z} \,|\, \boldsymbol{\theta}) = p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = p(\mathbf{Y} | \mathbf{X}, \boldsymbol{\theta}) \cdot p(\mathbf{X} \,|\, \boldsymbol{\theta})$$

È la regola del prodotto, valida per qualunque coppia di variabili aleatorie, senza ipotesi sul modello. Il primo fattore, $p(\mathbf{Y} | \mathbf{X}, \boldsymbol{\theta})$, valutato nella stima corrente $\boldsymbol{\theta}^{(k)}$, è la distribuzione con cui l'E-step pesa i dati mancanti. Passando al logaritmo e isolando $\ln p(\mathbf{X} \,|\, \boldsymbol{\theta})$ si apre la dimostrazione di monotonia.`,
  },
  {
    id: 'fc-due-verosimiglianze',
    kind: 'confronto',
    q: md`Verosimiglianza dei dati completi e dei dati incompleti: formule e differenze.`,
    a: md`$$l(\boldsymbol{\theta} | \mathbf{Z}) = p(\mathbf{Z} \,|\, \boldsymbol{\theta}) = p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}), \qquad l(\boldsymbol{\theta} | \mathbf{X}) = p(\mathbf{X} \,|\, \boldsymbol{\theta})$$

- La prima (*complete-data likelihood*) contiene anche $\mathbf{Y}$ ed è più informativa: se conoscessi $\mathbf{Y}$ risolveresti la ML direttamente. Ma $\mathbf{Y}$ non si osserva.
- La seconda (*incomplete-data likelihood*) dipende solo da $\mathbf{X}$: è quella che si può calcolare ed è quella da massimizzare, ma è più difficile per via dei dati mancanti.

EM fa salire la seconda lavorando, in media, sulla prima.`,
  },
  {
    id: 'fc-marginalizzazione',
    kind: 'formula',
    q: md`Come si lega la verosimiglianza dei dati incompleti alla congiunta dei dati completi?`,
    a: md`$$p(\mathbf{X} \,|\, \boldsymbol{\theta}) = \int p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}) \, d\mathbf{y}$$

Si somma o si integra la congiunta su tutti i valori possibili dei dati mancanti. Per la mistura la somma sugli $M$ valori di $\mathbf{y}_j$ ridà la formula della mistura, e da qui nasce il logaritmo di una somma. La slide 71 scrive le due densità ma non il legame: è un passaggio implicito.`,
  },
  {
    id: 'fc-log-congiunta-mistura',
    kind: 'formula',
    q: md`Quanto vale $\ln p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta})$ per la mistura, e perché con $\mathbf{Y}$ noto la ML è facile?`,
    a: md`Da $p(\mathbf{x}_j, \mathbf{y}_j \,|\, \boldsymbol{\theta}) = \prod_{i=1}^{M} \left[ P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]^{y_{ji}}$ segue

$$\ln p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = \sum_{j=1}^{N} \sum_{i=1}^{M} y_{ji} \left[ \ln P_i + \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]$$

Il logaritmo agisce su ogni singola gaussiana: la somma si separa per modo e ogni modo si stima in forma chiusa ($\hat{P}_i = N_i/N$, media e covarianza campionarie del gruppo). È il senso della frase delle note *If we knew the values of Y, we could solve the ML estimation problem directly*.`,
  },

  // --- l'algoritmo EM ---
  {
    id: 'fc-che-cosa-e-em',
    kind: 'definizione',
    q: md`Che cos'è l'algoritmo EM? (la prima frase da dire all'orale)`,
    a: md`Un metodo iterativo di stima a massima verosimiglianza in modelli con variabili latenti o non osservate (*a widely-used iterative method for maximum likelihood estimation in models with latent or unobserved variables*). Raffina le stime dei parametri a partire dalle osservazioni disponibili e dalle latenti che non si osservano.

Tre parole chiave: **iterativo** (produce una successione di stime), **ML** (massimizza la verosimiglianza dei dati osservati), **due passi** alternati (E e M).`,
  },
  {
    id: 'fc-idea-em',
    kind: 'intuizione',
    q: md`Qual è l'idea di EM, secondo la slide 72?`,
    a: md`EM trova il valore atteso di $\log p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta})$ rispetto a $\mathbf{y}$, dati $\mathbf{X}$ e una stima corrente di $\boldsymbol{\theta}$. Il log della verosimiglianza completa non si può calcolare, perché $\mathbf{Y}$ è ignoto: se ne calcola la media su tutti i valori possibili di $\mathbf{y}$, pesati con la loro plausibilità alla luce di $\mathbf{X}$ e dell'ultima stima dei parametri. Le note: le latenti vengono trattate come se ne conoscessimo la distribuzione, data la stima corrente.`,
  },
  {
    id: 'fc-q',
    kind: 'formula',
    q: md`Scrivi l'aspettazione condizionata $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ nelle due forme della slide 72.`,
    a: md`$$Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{ \log\left( p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) \right) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\}$$

$$Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \int \log\left( p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}) \right) p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) \, d\mathbf{y}$$

Nella prima $\mathbf{Y}$ maiuscola è la variabile aleatoria, nella seconda $\mathbf{y}$ minuscola è la variabile di integrazione. Il logaritmo usa $\boldsymbol{\theta}$ (l'incognita), il peso usa $\boldsymbol{\theta}^{(k)}$ (la stima corrente). Con $\mathbf{Y}$ discreta, come nella mistura, l'integrale diventa una somma.`,
  },
  {
    id: 'fc-argomenti-q',
    kind: 'proprieta',
    q: md`Che ruolo hanno i due argomenti di $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$? Si possono scambiare?`,
    a: md`No. $\boldsymbol{\theta}$ è la variabile libera su cui l'M-step massimizzerà; $\boldsymbol{\theta}^{(k)}$ è fissato e stabilisce i pesi della media, cioè la legge $p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})$.

Dopo l'integrazione $\mathbf{Y}$ sparisce e $Q$ è una funzione deterministica del solo $\boldsymbol{\theta}$: mediare su $\mathbf{Y}$ rimuove l'incertezza sulle latenti (*removes the uncertainty associated with these unobserved variables*). $\boldsymbol{\theta}$ non è una variabile aleatoria (la stima è ML, non bayesiana): la barra indica con quale legge si fa la media, non un condizionamento su $\boldsymbol{\theta}^{(k)}$.`,
  },
  {
    id: 'fc-e-step',
    kind: 'procedura',
    q: md`Che cosa fa l'E-step? Formula e lettura.`,
    a: md`$$\text{E-step:} \quad Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{ \log\left( p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) \right) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\}$$

Calcola il valore atteso della log-verosimiglianza dei dati completi rispetto alle latenti, includendole come se fossero osservate (*by including the latent variables as if they were observed*). I parametri restano fermi a $\boldsymbol{\theta}^{(k)}$: si calcola la distribuzione delle latenti e con essa $Q$.

Il riquadro verde della slide 73 dice *expectation of the likelihood*, ma la formula (e le note) mostrano che la media è sul logaritmo della verosimiglianza completa.`,
  },
  {
    id: 'fc-m-step',
    kind: 'procedura',
    q: md`Che cosa fa l'M-step? Formula e lettura.`,
    a: md`$$\text{M-step:} \quad \boldsymbol{\theta}^{(k+1)} = \arg\max \; Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$$

Calcola le stime ML dei parametri massimizzando la verosimiglianza attesa trovata nell'E-step. I pesi delle latenti restano fermi e si muovono i parametri. A rigore l'M-step massimizza $Q$, non la verosimiglianza dei dati osservati: è la dimostrazione di monotonia a garantire che anche quest'ultima non scenda.`,
  },
  {
    id: 'fc-alternanza',
    kind: 'procedura',
    q: md`Come si concatenano E-step e M-step?`,
    a: md`$$\boldsymbol{\theta}^{(k)} \;\xrightarrow{\;\text{E-step}\;}\; Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) \;\xrightarrow{\;\text{M-step}\;}\; \boldsymbol{\theta}^{(k+1)} \;\xrightarrow{\;\text{E-step}\;}\; \cdots$$

I parametri trovati nell'M-step servono a cominciare un nuovo E-step, e il processo si ripete (*The parameters found on the M step are then used to begin another E step, and the process is repeated*). Ogni iterazione $k$ produce $\boldsymbol{\theta}^{(k+1)}$ a partire da $\boldsymbol{\theta}^{(k)}$.`,
  },

  // --- inizializzazione, arresto, lettura intuitiva ---
  {
    id: 'fc-inizializzazione',
    kind: 'procedura',
    q: md`Come si inizializza EM, e perché la scelta conta?`,
    a: md`Si parte da una stima $\boldsymbol{\theta}^{(0)}$ scelta a caso oppure in base a conoscenza a priori sul problema (*chosen randomly or based on prior knowledge*). Conta perché EM sale solo in modo locale: da ogni $\boldsymbol{\theta}^{(0)}$ raggiunge la cima del proprio bacino di attrazione, che può essere un massimo locale o un punto di sella.`,
  },
  {
    id: 'fc-criterio-arresto',
    kind: 'procedura',
    q: md`Quando si ferma EM, e che cosa garantisce lo stop?`,
    a: md`Quando i parametri non cambiano più in modo significativo tra due iterazioni (*no longer change significantly between iterations*). In formula

$$\| \boldsymbol{\theta}^{(k+1)} - \boldsymbol{\theta}^{(k)} \| < \varepsilon$$

con la soglia $\varepsilon$ scelta da te: la fonte non la fissa. Le note dicono che così la verosimiglianza ha raggiunto un massimo locale; a rigore parametri fermi indicano un punto stazionario, che può essere anche un punto di sella (slide 75).`,
  },
  {
    id: 'fc-key-insights',
    kind: 'intuizione',
    q: md`Come riassumono le note (*Key Insights*) il lavoro dei due passi?`,
    a: md`L'E-step incorpora le latenti nel modello calcolando l'aspettazione condizionata, come se le latenti fossero note; l'M-step massimizza questa verosimiglianza attesa e aggiorna i parametri. EM alterna l'assegnazione di probabilità alle latenti (E-step) e l'aggiornamento dei parametri per adattarli meglio ai dati (M-step).

Nella mistura: l'E-step dà a ogni campione una probabilità di appartenere a ciascun modo (assegnazione morbida), l'M-step ristima ogni modo con i campioni pesati.`,
  },
  {
    id: 'fc-prior-nell-m-step',
    kind: 'proprieta',
    q: md`I prior $P_i$ della mistura si fissano a mano o si stimano?`,
    a: md`Si stimano. Nelle misture ci sono parametri aggiuntivi come le probabilità a priori (i *mixing weights* del GMM), e anche questi si aggiornano a ogni M-step: EM offre un modo sistematico per farlo. Fissarli a $1/M$ butterebbe via informazione quando i modi hanno numerosità diverse.`,
  },

  // --- convergenza ---
  {
    id: 'fc-monotonia',
    kind: 'proprieta',
    q: md`Che cosa afferma la slide 74 sulla convergenza di EM?`,
    a: md`La successione di stime $\{ \boldsymbol{\theta}^{[k]} \}$ generata da EM fa crescere a ogni iterazione la log-verosimiglianza dei dati osservati:

$$l(\boldsymbol{\theta}^{(i+1)}) \ge l(\boldsymbol{\theta}^{(i)})$$

Cresce o resta uguale, non scende mai (note: *always increases or remains the same*). La fonte non lo dimostra (*It can be shown*). Il risultato non usa né la forma gaussiana né l'ipotesi i.i.d.: vale per qualunque modello con variabili latenti, purché l'M-step non faccia scendere $Q$. Riguarda i valori di $l$, non dice che i parametri convergano.`,
  },
  {
    id: 'fc-dimostrazione-monotonia',
    kind: 'procedura',
    q: md`Traccia la dimostrazione che EM non fa scendere la log-verosimiglianza.`,
    a: md`1. Regola del prodotto: $\ln p(\mathbf{X} \,|\, \boldsymbol{\theta}) = \ln p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}) - \ln p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta})$.
2. Fai la media con $p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})$: $l(\boldsymbol{\theta}) = Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$, con $H$ la media di $\ln p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta})$.
3. L'M-step dà $Q(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) \ge Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$.
4. Per la disuguaglianza di Jensen $H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) \le \ln \int p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}) \, d\mathbf{y} = \ln 1 = 0$.
5. Sottraendo: $l(\boldsymbol{\theta}^{(k+1)}) - l(\boldsymbol{\theta}^{(k)}) \ge 0$.

La fonte si ferma a *It can be shown*: questa è la dimostrazione standard, aggiunta per l'orale.`,
  },
  {
    id: 'fc-minorante',
    kind: 'intuizione',
    q: md`Perché salire su $Q$ fa salire anche $l$? Spiegalo con il minorante.`,
    a: md`$$l(\boldsymbol{\theta}) \;\ge\; l(\boldsymbol{\theta}^{(k)}) + Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$$

con uguaglianza per $\boldsymbol{\theta} = \boldsymbol{\theta}^{(k)}$. $Q(\cdot, \boldsymbol{\theta}^{(k)})$, spostata di una costante, sta sotto $l$ ovunque e la tocca nella stima corrente. L'M-step sale al massimo di questo minorante: il minorante parte da $l(\boldsymbol{\theta}^{(k)})$ e sta sotto $l$, quindi nel nuovo punto $l$ vale almeno $l(\boldsymbol{\theta}^{(k)})$. Ogni E-step costruisce un nuovo minorante attaccato al nuovo punto. Basta anche un M-step che aumenti $Q$ senza massimizzarla.`,
  },
  {
    id: 'fc-figura-gradini',
    kind: 'intuizione',
    q: md`Come si legge la figura della salita a gradini sulla superficie $Q(\cdot,\cdot)$ della slide 74?`,
    a: md`I due assi orizzontali sono i due argomenti di $Q$: su uno le tacche $\theta^1, \theta^3$, sull'altro $\theta^0, \theta^2, \theta^4$. La proiezione rossa sul pavimento è una spezzata a gradini di quattro tratti, ognuno parallelo a un asse e terminato su una tacca con un nome nuovo: ogni tratto è un'iterazione di EM. Con un argomento fermo sulla stima corrente (E-step) massimizzi $Q$ lungo l'altro asse (M-step); il punto trovato diventa l'argomento fisso del tratto successivo. Così $\theta^0 \to \theta^1 \to \theta^2 \to \theta^3 \to \theta^4$ sono quattro stime successive. Gli assi si alternano perché nel disegno $Q$ è simmetrica nei due argomenti (in generale non lo è).

Ogni tratto è un salto al massimo della sezione, non un piccolo passo di gradiente; la garanzia di non discesa vale agli estremi dei tratti, e i gradini si accorciano verso la cresta. Ciò che la figura mostra salire è $Q$: il legame con $l$ lo dà il minorante.`,
  },
  {
    id: 'fc-no-massimo-globale',
    kind: 'proprieta',
    q: md`EM trova la stima ML?`,
    a: md`Non è garantito. Slide 75: EM può non convergere al massimo globale di $L(\theta)$, che è per definizione la stima ML (*i.e., the ML estimate of θ*). La crescita monotona assicura solo che non si peggiori, non che si arrivi in cima alla collina più alta.

Per la mistura con covarianze libere il massimo globale non esiste nemmeno: una campana che si stringe su un solo campione manda $L$ a $+\infty$. La stima utile è un massimo locale non degenere.`,
  },
  {
    id: 'fc-minimi-o-massimi-locali',
    kind: 'confronto',
    q: md`La slide 75 parla di *local minima*, le note di *local maximum*. Quale termine è coerente, e che cosa rischia EM?`,
    a: md`EM massimizza la verosimiglianza, quindi il rischio concreto è fermarsi su un massimo locale o su un punto di sella (*saddle point*), cioè un punto stazionario che non è un massimo. *Local minima* è gergo dell'ottimizzazione, dove di solito si minimizza. Esempio di sella: due componenti inizializzate identiche restano identiche a ogni iterazione.`,
  },
  {
    id: 'fc-dipendenza-partenza',
    kind: 'intuizione',
    q: md`Perché EM dipende dal punto di partenza, e che cosa conviene fare?`,
    a: md`La log-verosimiglianza può avere più picchi, ed EM procede con aggiornamenti simili a una salita del gradiente (*gradient ascent-like updates*), sensibili al punto di partenza. Da ogni $\boldsymbol{\theta}^{(0)}$ sale alla cima del proprio bacino di attrazione.

In pratica: inizializzi con conoscenza a priori, oppure ripeti EM da più punti di partenza e tieni la soluzione con la verosimiglianza più alta.`,
  },
  {
    id: 'fc-em-e-gradiente',
    kind: 'confronto',
    q: md`EM è una salita del gradiente? In che senso le note dicono *gradient ascent-like*?`,
    a: md`È un'analogia. EM non calcola gradienti e non ha un learning rate da tarare: l'M-step massimizza $Q$ in modo esatto, spesso in forma chiusa. Per le medie della mistura l'analogia ha però un contenuto preciso:

$$\mathbf{m}_i^{[k+1]} = \mathbf{m}_i^{[k]} + \frac{\Sigma_i^{[k]}}{N_i^{[k]}} \, \frac{\partial \ln l}{\partial \mathbf{m}_i} \bigg|_{\boldsymbol{\theta}^{[k]}}, \qquad N_i^{[k]} = \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})$$

È un passo di gradiente con «matrice di passo» $\Sigma_i / N_i$ fissata dal modello, sempre definita positiva.`,
  },
  {
    id: 'fc-punto-fisso',
    kind: 'proprieta',
    q: md`Perché «parametri che non cambiano più» significa trovarsi in un punto stazionario della log-verosimiglianza?`,
    a: md`Il minorante è tangente a $l$ nel punto corrente, quindi i due hanno lo stesso gradiente:

$$\nabla_{\boldsymbol{\theta}} \, l(\boldsymbol{\theta}) \Big|_{\boldsymbol{\theta} = \boldsymbol{\theta}^{(k)}} = \nabla_{\boldsymbol{\theta}} \, Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) \Big|_{\boldsymbol{\theta} = \boldsymbol{\theta}^{(k)}}$$

Se $\boldsymbol{\theta}^{(k+1)} = \boldsymbol{\theta}^{(k)}$, il massimo di $Q$ cade nel punto corrente, dove il gradiente di $Q$ è nullo; quindi è nullo anche quello di $l$. È un punto stazionario: massimo locale oppure sella.`,
  },
  {
    id: 'fc-efficacia-misture',
    kind: 'proprieta',
    q: md`Nonostante massimi locali e punti di sella, in che cosa la fonte giudica EM particolarmente efficace?`,
    a: md`Nella stima dei parametri delle componenti di una mistura (*particularly effective in the estimation of mixture components parameters*). Nei GMM stima media, varianza e peso di ogni componente anche quando le etichette vere, cioè la componente che ha generato ogni punto, sono ignote.`,
  },

  // --- le equazioni EM della mistura ---
  {
    id: 'fc-posterior',
    kind: 'formula',
    q: md`Qual è il termine che si ripete in tutte e tre le equazioni EM della slide 76, e che significato ha?`,
    a: md`$$P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = \frac{P_i^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]})}$$

Per il teorema di Bayes è la probabilità a posteriori che $\mathbf{x}_j$ sia stato generato dal modo $i$, calcolata con i parametri correnti: è il risultato dell'E-step per la mistura. In letteratura si chiama responsabilità (*responsibility*); la fonte non le dà un nome. Sta tra 0 e 1 e, per ogni $\mathbf{x}_j$, somma a 1 sugli $M$ modi.`,
  },
  {
    id: 'fc-y-atteso',
    kind: 'formula',
    q: md`Che legame c'è tra la posterior del modo e il vettore binario di appartenenza $\mathbf{y}_j$?`,
    a: md`$$E\{ y_{ji} \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]} \} = 1 \cdot P(y_{ji} = 1 \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) + 0 \cdot P(y_{ji} = 0 \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})$$

Il valore atteso di un indicatore è la probabilità che valga 1. L'E-step della mistura sostituisce l'indicatore sconosciuto con la sua media: $Q$ è la log-verosimiglianza completa con $y_{ji}$ rimpiazzato dalla posterior.`,
  },
  {
    id: 'fc-denominatore',
    kind: 'formula',
    q: md`Che cosa rappresenta il denominatore comune $p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]})$ delle equazioni EM?`,
    a: md`$$p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]}) = \sum_{l=1}^{M} P_l^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_l^{[k]}, \Sigma_l^{[k]})$$

La mistura corrente valutata in $\mathbf{x}_j$, cioè la somma dei numeratori su tutti i modi. È l'evidenza del teorema di Bayes e fa sommare a 1 le posterior. Geometricamente: il numeratore è l'altezza della campana pesata del modo $i$ in $\mathbf{x}_j$, il denominatore l'altezza della curva somma nello stesso punto.`,
  },
  {
    id: 'fc-aggiorna-prior',
    kind: 'formula',
    q: md`Scrivi l'equazione EM per il prior $P_i$ e interpretala.`,
    a: md`$$P_i^{[k+1]} = \frac{1}{N} \sum_{j=1}^{N} \frac{P_i^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]})}$$

Media delle posterior del modo $i$ sugli $N$ campioni: la frazione morbida di campioni attribuiti al modo. Attenzione: la slide scrive $P_j^{[k]}$ al numeratore, refuso per $P_i^{[k]}$.`,
  },
  {
    id: 'fc-aggiorna-media',
    kind: 'formula',
    q: md`Scrivi l'equazione EM per il vettore media $\mathbf{m}_i$ e interpretala.`,
    a: md`$$\mathbf{m}_i^{[k+1]} = \frac{\displaystyle \sum_{j=1}^{N} \frac{P_i^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]})} \cdot \mathbf{x}_j}{\displaystyle \sum_{j=1}^{N} \frac{P_i^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]})}}$$

Media pesata di tutti i campioni, con peso la posterior del modo $i$; il denominatore, somma dei pesi, normalizza. Tutti i campioni contribuiscono a tutte le medie, ma quelli lontani dal modo pesano quasi zero: è la media campionaria in versione morbida.`,
  },
  {
    id: 'fc-aggiorna-covarianza',
    kind: 'formula',
    q: md`Scrivi l'equazione EM per la matrice di covarianza $\Sigma_i$ e interpretala.`,
    a: md`$$\Sigma_i^{[k+1]} = \frac{\displaystyle \sum_{j=1}^{N} \frac{P_i^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]})} \cdot (\mathbf{x}_j - \mathbf{m}_i^{[k+1]}) \cdot (\mathbf{x}_j - \mathbf{m}_i^{[k+1]})^{t}}{\displaystyle \sum_{j=1}^{N} \frac{P_i^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]})}}$$

Media pesata dei prodotti esterni degli scarti, normalizzata dalla somma dei pesi; l'apice $t$ indica il trasposto. Gli scarti usano la media già aggiornata $\mathbf{m}_i^{[k+1]}$: prima si aggiornano le medie, poi le covarianze. Il peso è la stessa posterior dell'E-step usata per $P_i$ e $\mathbf{m}_i$.`,
  },
  {
    id: 'fc-refuso-covarianza',
    kind: 'proprieta',
    q: md`Che cosa non torna nell'equazione della covarianza stampata nella slide 76?`,
    a: md`Dentro il peso, al numeratore e al denominatore, la slide scrive la gaussiana con $\mathbf{m}_i^{[k+1]}$ (e $\Sigma_i^{[k]}$), mentre il denominatore resta $p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]})$. Con quel numeratore i pesi non sono più posterior: non sommano a 1 sui modi. Nella forma corretta i pesi sono le posterior dell'E-step (con $\mathbf{m}_i^{[k]}$) e solo gli scarti usano $\mathbf{m}_i^{[k+1]}$. Vicino alla convergenza $\mathbf{m}_i^{[k+1]} \approx \mathbf{m}_i^{[k]}$ e le due forme danno quasi lo stesso numero. Le note ripetono la stessa immagine.`,
  },
  {
    id: 'fc-ml-pesata',
    kind: 'confronto',
    q: md`Qual è il modo più rapido per ricordare le tre equazioni EM? Che cosa diventano se le etichette sono note?`,
    a: md`Sono le stime ML della gaussiana (frequenza relativa, media campionaria, covarianza campionaria) in cui ogni campione conta a frazioni, in proporzione alla sua posterior. Con appartenenze note le posterior valgono 0 oppure 1 e le equazioni diventano le stime ML per classe, con $N_i$ campioni nel modo $i$:

$$\hat{P}_i = \frac{N_i}{N}, \qquad \hat{\mathbf{m}}_i = \frac{1}{N_i} \sum_{\mathbf{x}_j \in \text{modo } i} \mathbf{x}_j, \qquad \hat{\Sigma}_i = \frac{1}{N_i} \sum_{\mathbf{x}_j \in \text{modo } i} (\mathbf{x}_j - \hat{\mathbf{m}}_i)(\mathbf{x}_j - \hat{\mathbf{m}}_i)^{t}$$`,
  },
  {
    id: 'fc-lagrange-prior',
    kind: 'procedura',
    q: md`Come si ricava l'aggiornamento dei prior $P_i^{[k+1]}$?`,
    a: md`Nell'M-step massimizzi $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{[k]}) = \sum_{j} \sum_{i} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \left[ \ln P_i + \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]$ con il vincolo $\sum_i P_i = 1$, tramite un moltiplicatore di Lagrange $\lambda$:

$$\frac{1}{P_i} \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) - \lambda = 0$$

Moltiplichi per $P_i$, sommi su $i$ e usi il fatto che le posterior di ogni campione sommano a 1: $\lambda = N$. Quindi $P_i^{[k+1]} = \frac{1}{N} \sum_{j} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})$. La fonte non lo ricava (*it can be shown*).`,
  },
  {
    id: 'fc-derivate-media-covarianza',
    kind: 'procedura',
    q: md`Come si ricavano gli aggiornamenti di media e covarianza della mistura?`,
    a: md`Annulli la derivata di $Q$, dove la posterior è un peso costante (calcolato con $\boldsymbol{\theta}^{[k]}$):

$$\frac{\partial Q}{\partial \mathbf{m}_i} = \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, \Sigma_i^{-1} (\mathbf{x}_j - \mathbf{m}_i) = \mathbf{0}$$

dà la media pesata. Derivando rispetto a $\Sigma_i^{-1}$, $\frac{1}{2} \sum_{j} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \left[ \Sigma_i - (\mathbf{x}_j - \mathbf{m}_i)(\mathbf{x}_j - \mathbf{m}_i)^{t} \right] = \mathbf{0}$ dà la covarianza pesata, con gli scarti calcolati sulla media nuova. A differenza della ML diretta, qui i pesi non dipendono dall'incognita: niente equazioni implicite.`,
  },
  {
    id: 'fc-refusi-notazione',
    kind: 'proprieta',
    q: md`Quali particolarità di notazione trovi nelle slide 68-76 su EM?`,
    a: md`- Prima equazione della slide 76: $P_j^{[k]}$ al numeratore è un refuso per $P_i^{[k]}$ ($j$ numera i campioni).
- Equazione di $\Sigma_i$: la gaussiana nel peso usa $\mathbf{m}_i^{[k+1]}$ invece di $\mathbf{m}_i^{[k]}$.
- Indice di iterazione: $(k)$ alle slide 72-73, $[k]$ alle slide 74 e 76, $(i)$ nella disuguaglianza della slide 74, apice semplice $\theta^0, \ldots, \theta^4$ nella figura.
- Verosimiglianza: $l(\boldsymbol{\theta} | \mathbf{X})$ alle slide 70-71, $l(\theta)$ alla 74, $L(\theta)$ alla 75.
- $\boldsymbol{\theta}$ è in grassetto nelle formule delle slide 70-74 e 76 (disuguaglianza della slide 74, denominatori $p(\mathbf{x}_j | \boldsymbol{\theta}^{[k]})$ della slide 76); non lo è nella slide 68, nel testo delle slide 70, 72, 74 e 75 e nella figura della slide 74.
- L'indice $i$ numera campioni, modi e iterazioni in slide diverse; dalla slide 76 i campioni usano $j$.`,
  },
  {
    id: 'fc-procedura-gmm',
    kind: 'procedura',
    q: md`Scrivi la procedura completa di EM per una mistura di gaussiane.`,
    a: md`0. Scegli $M$ e inizializza $\boldsymbol{\theta}^{[0]}$ ($P_i$, $\mathbf{m}_i$, $\Sigma_i$ per ogni $i$), a caso o con conoscenza a priori.
1. **E-step**: per ogni campione $\mathbf{x}_j$ e ogni modo $i$ calcola la posterior $P_i^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_i^{[k]}, \Sigma_i^{[k]}) / p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]})$.
2. **M-step**: aggiorna i prior, le medie e poi le covarianze, che usano le medie nuove. Tutte e tre usano le posterior del passo 1, senza ricalcolarle.
3. Se i parametri non cambiano in modo significativo ti fermi; altrimenti $k \leftarrow k+1$ e torni al passo 1.

A ogni giro la log-verosimiglianza non scende; il punto d'arrivo è un punto stazionario della verosimiglianza, di solito un massimo locale ma può essere un punto di sella (slide 75), e dipende dall'inizializzazione.`,
  },
  {
    id: 'fc-iterazione-numerica',
    kind: 'procedura',
    q: md`Luminosità di sei pesci senza etichetta, $X = \{2, 3, 4, 5, 7, 8\}$, mistura 1D con $M = 2$ (salmone, spigola), $P = (0.5, 0.5)$, $m = (3, 6)$, $\sigma^2 = (1, 1)$. Quanto vale la posterior del modo 1 per $x = 4$?`,
    a: md`Numeratori: $0.5 \cdot \mathcal{N}(4 \,|\, 3, 1) = 0.5 \cdot 0.24197 = 0.12099$ e $0.5 \cdot \mathcal{N}(4 \,|\, 6, 1) = 0.5 \cdot 0.05399 = 0.02700$. Denominatore $0.14798$. Posterior $0.12099 / 0.14798 = 0.8176$.

Completando l'iterazione (somme dei pesi $2.989$ e $3.011$): $P^{[1]} = (0.4982, 0.5018)$, $m^{[1]} = (3.062, 6.592)$, $(\sigma^2)^{[1]} = (0.851, 1.860)$. La log-verosimiglianza passa da $-13.2575$ a $-12.3273$, poi $-12.3091$: sale, come promette la slide 74. Esempio costruito per l'app, non presente nella fonte.`,
  },

  // --- esempio: quattro punti con x1 mancante ---
  {
    id: 'fc-quattro-punti',
    kind: 'definizione',
    q: md`Che cosa mostra l'esempio della slide 77, e qual è la variabile latente?`,
    a: md`Quattro punti in 2D, uno dei quali senza il valore di $x_1$ (*Example with four data points, one of which is missing the value of the $x_1$ component*). Tre punti completi in $(0, 2)$, $(1, 0)$, $(2, 2)$; del quarto si sa solo $x_2 = 4$, quindi può stare ovunque sulla retta rossa orizzontale. Si stima una sola gaussiana 2D: la latente non è un'etichetta di modo ma il valore mancante $x_{41}$. Le note: EM tratta i valori mancanti come variabili latenti.`,
  },
  {
    id: 'fc-quattro-punti-q',
    kind: 'formula',
    q: md`Com'è fatta $Q$ nell'esempio dei quattro punti, partendo da $\boldsymbol{\theta}^0 = (0, 0, 1, 1)^t$?`,
    a: md`$$Q(\boldsymbol{\theta}; \boldsymbol{\theta}^{0}) = \sum_{k=1}^{3} \ln p(\mathbf{x}_k \,|\, \boldsymbol{\theta}) + \int_{-\infty}^{+\infty} \ln p\big( (x_{41}, 4)^{t} \,\big|\, \boldsymbol{\theta} \big) \; p(x_{41} \,|\, \boldsymbol{\theta}^{0}; x_{42} = 4) \, dx_{41}$$

I tre punti completi entrano con il loro log; per il quarto si integra sul valore mancante. Con covarianza diagonale $p(x_{41} \,|\, \boldsymbol{\theta}^{0}; x_{42} = 4) = \mathcal{N}(0, 1)$, quindi

$$Q(\boldsymbol{\theta}; \boldsymbol{\theta}^{0}) = \sum_{k=1}^{3} \ln p(\mathbf{x}_k \,|\, \boldsymbol{\theta}) - \frac{1 + \mu_1^2}{2\sigma_1^2} - \frac{(4 - \mu_2)^2}{2\sigma_2^2} - \ln(2\pi\sigma_1\sigma_2)$$

EM non indovina $x_{41}$: ne usa l'intera distribuzione. La slide mostra solo la figura; i conti ricostruiscono l'esempio di Duda-Hart-Stork da cui viene.`,
  },
  {
    id: 'fc-quattro-punti-numeri',
    kind: 'procedura',
    q: md`Quanto vale $\boldsymbol{\theta}^1$ nell'esempio dei quattro punti, e dove converge EM?`,
    a: md`$\boldsymbol{\theta} = (\mu_1, \mu_2, \sigma_1^2, \sigma_2^2)^t$, partenza $\boldsymbol{\theta}^0 = (0, 0, 1, 1)^t$. Prima iterazione:

- $\mu_1 = (0 + 1 + 2 + 0)/4 = 0.75$ e $\mu_2 = (2 + 0 + 2 + 4)/4 = 2$;
- $\sigma_1^2 = [0.5625 + 0.0625 + 1.5625 + (1 + 0.5625)]/4 = 0.938$ e $\sigma_2^2 = (0 + 4 + 0 + 4)/4 = 2$.

Poi $\boldsymbol{\theta}^2 = (0.938, 2.0, 0.746, 2.0)^t$, $\boldsymbol{\theta}^3 = (0.984, 2.0, 0.687, 2.0)^t$ e al limite $\boldsymbol{\mu} = (1.0, 2.0)^t$, $\Sigma = \mathrm{diag}(0.667, 2.0)$. La media di $x_1$ segue $\mu_1 \leftarrow (3 + \mu_1)/4$, con punto fisso 1. La convergenza è asintotica: alla terza iterazione $\sigma_1^2$ vale $0.687$, non ancora $0.667$.`,
  },
  {
    id: 'fc-quattro-punti-lettura',
    kind: 'intuizione',
    q: md`Che cosa insegna il risultato dei quattro punti rispetto a scartare il punto incompleto?`,
    a: md`Scartandolo avresti $\mu_2 = 1.33$ e $\sigma_2^2 = 0.89$: perderesti l'informazione $x_2 = 4$. Con EM $\mu_2 = 2$ e $\sigma_2^2 = 2$ fin dalla prima iterazione, perché $x_2$ è osservato in tutti e quattro i punti.

Il limite di $x_1$ ($\mu_1 = 1$, $\sigma_1^2 = 2/3$) coincide invece con la ML sui tre valori di $x_1$ osservati: con covarianza diagonale $x_1$ e $x_2$ sono indipendenti e il quarto punto non dice nulla su $x_1$. Con una covarianza piena la correlazione permetterebbe di prevedere $x_{41}$ da $x_{42} = 4$.`,
  },
  {
    id: 'fc-figura-ellissi',
    kind: 'intuizione',
    q: md`Come si leggono le ellissi 0, 1, 2, 3 nella figura della slide 77?`,
    a: md`Sono i contorni della gaussiana stimata alle iterazioni successive, a una deviazione standard (distanza di Mahalanobis 1). La 0 è un cerchio di raggio 1 centrato nell'origine: la stima iniziale con varianze unitarie. La 1 è già spostata verso i dati, centrata circa in $(0.75, 2)$. La 2 e la 3 sono quasi sovrapposte, centrate circa in $(1, 2)$ e allungate lungo $x_2$. Bastano poche iterazioni, e il punto incompleto pesa sulla stima attraverso la coordinata nota.`,
  },
  {
    id: 'fc-conclusione-em',
    kind: 'proprieta',
    q: md`Con quali tre messaggi si chiude la parte su EM nelle note?`,
    a: md`1. EM è molto efficace per stimare i parametri dei GMM e si estende ai dati mancanti (*can be extended to handle missing data*).
2. Nei GMM gli aggiornamenti iterativi di media, covarianza e pesi migliorano le stime e convergono a un massimo locale della verosimiglianza (così le note; a rigore a un punto stazionario, che la slide 75 ammette possa essere una sella).
3. La capacità di incorporare dati latenti o mancanti lo rende utile nelle applicazioni con dataset incompleti, frequenti nella pratica.`,
  },

  // --- coda delle finestre di Parzen (part1 p45) ---
  {
    id: 'fc-specht-distanza',
    kind: 'formula',
    q: md`Nella stima di Parzen con kernel gaussiano a simmetria sferica, come entra il campione di training nel kernel?`,
    a: md`$$\hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \frac{1}{(2\pi\sigma^2)^{n/2}} \exp\left( -\frac{\| \mathbf{x} - \mathbf{x}_k \|^2}{2\sigma^2} \right)$$

Solo attraverso la distanza euclidea $\| \mathbf{x} - \mathbf{x}_k \|$ tra il punto di valutazione e il campione di training (*Euclidean distance*). I punti alla stessa distanza da $\mathbf{x}_k$ ricevono lo stesso contributo: le curve di livello sono ipersfere.`,
  },
  {
    id: 'fc-ruolo-sigma',
    kind: 'confronto',
    q: md`Kernel gaussiano di Parzen: che cosa succede con $\sigma$ troppo grande e con $\sigma$ troppo piccolo?`,
    a: md`$\sigma$ (deviazione standard) controlla quanto è liscia la stima.

- **Troppo grande**: il kernel sovra-liscia i dati (*over-smooth*) e porta a sottoadattamento (*underfitting*); per esempio due modi vicini si fondono in uno.
- **Troppo piccolo**: la stima è molto variabile, con un picco stretto su ogni campione e quasi zero altrove, e porta a sovradattamento (*overfitting*).`,
  },
  {
    id: 'fc-normalizzazione-feature',
    kind: 'procedura',
    q: md`Perché con il kernel gaussiano sferico si normalizzano le feature prima di stimare la pdf?`,
    a: md`La formulazione assume che tutte le feature abbiano la stessa varianza: c'è un solo $\sigma$ per tutte le direzioni. Normalizzando, ogni feature contribuisce allo stesso modo alla distanza e il kernel forma ipersfere corrette attorno ai dati; senza, una feature con scala numerica grande domina la distanza euclidea. Dopo la normalizzazione l'unico iperparametro da tarare è $\sigma$.`,
  },
  {
    id: 'fc-sigma-adattivo',
    kind: 'formula',
    q: md`Come si definisce la larghezza adattiva $\sigma_k$ del kernel?`,
    a: md`$$\sigma_k = \frac{1}{L} \sum_{l=1}^{L} \| \mathbf{x}_k - \mathbf{y}_l \|$$

Una larghezza per ogni campione di training $\mathbf{x}_k$ ($k = 1, \ldots, N$): la distanza euclidea media dai suoi $L$ campioni di training più vicini $\mathbf{y}_1, \ldots, \mathbf{y}_L$. Dove i campioni sono fitti $\sigma_k$ è piccolo, dove sono radi è grande: lo stimatore adatta lo smoothing alla densità locale. Il nuovo iperparametro è $L$.`,
  },
  {
    id: 'fc-pnn',
    kind: 'definizione',
    q: md`Con quale struttura si realizza il metodo di Specht?`,
    a: md`Con una rete neurale probabilistica (*Probabilistic Neural Network*, PNN): uno strato con un'unità gaussiana per ogni campione di training, uno strato che somma (media) le unità di ciascuna classe, un'uscita che sceglie la classe con densità maggiore. Le note la presentano come modo flessibile di modellare densità complesse, utile in machine learning e statistica.`,
  },
  {
    id: 'fc-adattivita',
    kind: 'intuizione',
    q: md`Perché conviene un $\sigma$ piccolo dove i campioni sono fitti e uno grande dove sono radi?`,
    a: md`Dove ci sono tanti campioni i vuoti da riempire sono pochi e l'obiettivo è un'interpolazione accurata: una varianza grande non serve e cancellerebbe dettagli. Dove i campioni sono pochi una varianza più grande tiene conto dell'incertezza maggiore. Per stimare la varianza localmente si guarda la densità dei campioni. Le note aggiungono che la levigatezza del kernel gaussiano gli permette di adattarsi bene a molti tipi di densità.`,
  },

  // --- casi limite (integrazione del verificatore) ---
  {
    id: 'fc-collasso-sigma',
    kind: 'proprieta',
    q: md`Perché la verosimiglianza di una mistura con covarianze libere non ha massimo globale?`,
    a: md`Se un modo si centra su un campione ($\mathbf{m}_i = \mathbf{x}_j$) e la sua covarianza si restringe ($\Sigma_i = \sigma^2 I$, $\sigma \to 0$), il termine di quel campione cresce come $\ln [P_i / (2\pi\sigma^2)^{n/2}]$, mentre gli altri campioni restano spiegati dagli altri modi. La log-verosimiglianza tende a $+\infty$.

Sono soluzioni degeneri: una campana su un solo punto, *overfitting* estremo. La crescita monotona non protegge: se EM parte vicino a una di esse, ci sale dentro fino a $\Sigma_i$ singolare. Rimedi: una nuova inizializzazione, oppure un minimo imposto alle varianze ($\Sigma_i + \varepsilon I$). Integrazione, non presente nella fonte.`,
  },
  {
    id: 'fc-limite-kmeans',
    kind: 'confronto',
    q: md`In che senso k-means è un caso limite di EM per la mistura?`,
    a: md`Se tutti i modi hanno la stessa covarianza fissa $\sigma^2 I$ e $\sigma \to 0$, le posterior

$$P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}) = \frac{P_i \, \exp\left( -\|\mathbf{x}_j - \mathbf{m}_i\|^2 / 2\sigma^2 \right)}{\sum_{l=1}^{M} P_l \, \exp\left( -\|\mathbf{x}_j - \mathbf{m}_l\|^2 / 2\sigma^2 \right)}$$

tendono a 1 per il modo con la media più vicina e a 0 per gli altri. L'assegnazione diventa dura, i prior non contano più (purché positivi) e l'M-step delle medie diventa la media dei campioni assegnati: è k-means, il clustering della parte di Passerini. È il caso simmetrico delle etichette note.`,
  },
]
