// Quiz dentro il testo del foglio m10 (dati incompleti ed EM): ognuno ha il suo <Check id="chk-NN" /> in index.mdx,
// nel punto in cui il concetto è appena stato spiegato. L'integratore li unisce a data.quiz (il validatore risolve
// <Check id> su data.quiz). I conti numerici sono rifatti a mano; i dati sono diversi da quelli degli esempi svolti,
// così il quiz non ripete la soluzione già scritta nel testo.
import { md } from '../../types'
import type { QuizItem } from '../../types'

export const checks: QuizItem[] = [
  // --- EM come strumento generale (c05, c06) -------------------------------------------------------------
  {
    id: 'chk-01',
    type: 'tf',
    q: md`EM è un algoritmo pensato soltanto per stimare le misture di gaussiane.`,
    answer: false,
    explanation: md`La slide p67 lo presenta come soluzione per l'intera classe dei problemi di stima con dati incompleti, e annuncia la mistura come «a typical example». La slide p77 lo applica a un secondo tipo di dato incompleto: una feature mancante in uno dei quattro punti. In entrambi i casi la parte mancante diventa $\mathbf{Y}$ e il dataset completo è $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$.`,
    difficulty: 1,
    concepts: ['c05', 'c06'],
  },
  // --- Numero di parametri della mistura (c10, c11) ------------------------------------------------------
  {
    id: 'chk-02',
    type: 'numeric',
    q: md`Una mistura di $M = 2$ gaussiane in uno spazio a $n = 3$ feature, con covarianze piene. Quanti parametri liberi contiene $\boldsymbol{\theta}$, tenendo conto che i prior sommano a 1?`,
    answer: 19,
    tolerance: 0.5,
    explanation: md`Prior liberi: $M - 1 = 1$. Medie: $M n = 6$. Covarianze simmetriche: $M \, n(n+1)/2 = 2 \cdot 6 = 12$. Totale $1 + 6 + 12 = 19$. Il vincolo $\sum_i P_i = 1$ toglie un grado di libertà ai prior.`,
    difficulty: 2,
    concepts: ['c10', 'c11'],
  },
  // --- I tre motivi dell'incompletezza (c14, c15, c16) --------------------------------------------------
  {
    id: 'chk-03',
    type: 'multi',
    q: md`Secondo la slide p69, perché stimare i modi di una mistura è un problema con dati incompleti? Seleziona tutti i motivi della fonte.`,
    options: [
      md`Si hanno solo le osservazioni dell'intera $p(\mathbf{x})$, non quelle dei singoli modi`,
      md`Non si sa a quale modo è associato ciascun campione`,
      md`Si sa soltanto che tra i modi nascosti c'è una relazione di tipo somma`,
      md`Alcune feature dei campioni sono affette da rumore`,
      md`Il numero di modi $M$ è ignoto`,
    ],
    answers: [0, 1, 2],
    explanation: md`I tre motivi della slide sono i primi tre. Il rumore non rende i dati incompleti, e nella fonte $M$ è dato. Il secondo motivo è il cuore del problema: se sapessi quali campioni vengono da ciascun modo, faresti una stima ML gaussiana per ogni modo.`,
    difficulty: 1,
    concepts: ['c14', 'c15', 'c16'],
  },
  // --- Perché la ML della mistura è difficile (c20, c21) -------------------------------------------------
  {
    id: 'chk-04',
    type: 'mcq',
    q: md`Perché la stima ML di una mistura di gaussiane non ha soluzione in forma chiusa, mentre quella di una sola gaussiana sì?`,
    options: [
      md`Perché nella log-verosimiglianza compare il logaritmo di una somma sui modi, che non si separa per componente`,
      md`Perché i campioni di una mistura non sono i.i.d., quindi la verosimiglianza non è un prodotto`,
      md`Perché la densità gaussiana non è derivabile rispetto alla media`,
      md`Perché la mistura ha troppi campioni per risolvere il sistema`,
    ],
    answer: 0,
    explanation: md`I campioni restano i.i.d. e la verosimiglianza resta un prodotto. Passando al logaritmo, con una gaussiana il log cancella l'esponenziale; con la mistura ottieni $\sum_j \ln [\sum_i P_i \, p(\mathbf{x}_j \mid \mathbf{m}_i, \Sigma_i)]$. Annullando la derivata compaiono le posterior dei modi, che dipendono da tutto $\boldsymbol{\theta}$: equazioni implicite.`,
    difficulty: 2,
    concepts: ['c20', 'c21'],
  },
  // --- Il fattore della congiunta usato dall'E-step (c25) ------------------------------------------------
  {
    id: 'chk-05',
    type: 'mcq',
    q: md`Nella fattorizzazione $p(\mathbf{X}, \mathbf{Y} \mid \boldsymbol{\theta}) = p(\mathbf{Y} \mid \mathbf{X}, \boldsymbol{\theta}) \cdot p(\mathbf{X} \mid \boldsymbol{\theta})$ della slide p71, quale fattore, valutato nella stima corrente, usa l'E-step per mediare sui dati mancanti?`,
    options: [
      md`$p(\mathbf{Y} \mid \mathbf{X}, \boldsymbol{\theta})$, la densità dei dati mancanti dati quelli osservati`,
      md`$p(\mathbf{X} \mid \boldsymbol{\theta})$, la verosimiglianza dei dati incompleti`,
      md`$p(\mathbf{X}, \mathbf{Y} \mid \boldsymbol{\theta})$, la verosimiglianza dei dati completi`,
      md`Nessuno: l'E-step usa solo i dati osservati`,
    ],
    answer: 0,
    explanation: md`L'E-step pesa i valori possibili di $\mathbf{y}$ con $p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta}^{(k)})$, come nella forma integrale di $Q$. La congiunta $p(\mathbf{X}, \mathbf{y} \mid \boldsymbol{\theta})$ entra invece nel logaritmo, con i parametri liberi.`,
    difficulty: 2,
    concepts: ['c25', 'c31'],
  },
  // --- I due argomenti di Q (c30, c31, c32) --------------------------------------------------------------
  {
    id: 'chk-06',
    type: 'tf',
    q: md`In $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ i due argomenti sono intercambiabili: $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta})$.`,
    answer: false,
    explanation: md`Hanno ruoli diversi. Il secondo, $\boldsymbol{\theta}^{(k)}$, fissa i pesi $p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta}^{(k)})$ della media; il primo, $\boldsymbol{\theta}$, sta dentro il logaritmo $\log p(\mathbf{X}, \mathbf{y} \mid \boldsymbol{\theta})$ ed è la variabile che l'M-step massimizza. Dopo l'integrazione su $\mathbf{y}$, $Q$ è una funzione deterministica del solo $\boldsymbol{\theta}$.`,
    difficulty: 1,
    concepts: ['c30', 'c31', 'c32'],
  },
  // --- Chi sta fermo nei due passi (c33, c34, c35) --------------------------------------------------------
  {
    id: 'chk-07',
    type: 'mcq',
    q: md`Durante l'M-step che cosa resta fermo?`,
    options: [
      md`La distribuzione delle latenti calcolata nell'E-step, cioè i pesi $p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta}^{(k)})$`,
      md`I parametri $\boldsymbol{\theta}$, mentre si aggiornano i pesi`,
      md`I dati osservati $\mathbf{X}$ e anche i valori veri di $\mathbf{Y}$`,
      md`Nulla: parametri e pesi si aggiornano insieme`,
    ],
    answer: 0,
    explanation: md`Nell'E-step fermi i parametri a $\boldsymbol{\theta}^{(k)}$ e calcoli i pesi; nell'M-step fermi i pesi e cerchi $\boldsymbol{\theta}^{(k+1)} = \arg\max Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$. I valori veri di $\mathbf{Y}$ non li conosci mai. L'uscita dell'M-step avvia l'E-step successivo.`,
    difficulty: 1,
    concepts: ['c33', 'c34', 'c35'],
  },
  // --- I prior si imparano (c38, c39, c36) --------------------------------------------------------------
  {
    id: 'chk-08',
    type: 'tf',
    q: md`Nella mistura i prior $P_i$ si fissano a $1/M$ prima di iniziare e restano costanti: EM aggiorna solo medie e covarianze.`,
    answer: false,
    explanation: md`Le note p49: nei modelli a mistura anche le probabilità a priori (i pesi della mistura) si stimano in modo iterativo nell'M-step. Fanno parte di $\boldsymbol{\theta}$ e hanno la loro equazione, $P_i^{[k+1]} = \frac{1}{N} \sum_j P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})$. Il valore $1/M$ può essere al più un'inizializzazione.`,
    difficulty: 1,
    concepts: ['c38', 'c39', 'c36'],
  },
  // --- Monotonia non vuol dire massimo globale (c40, c42) -----------------------------------------------
  {
    id: 'chk-09',
    type: 'tf',
    q: md`Poiché con EM vale $l(\boldsymbol{\theta}^{(i+1)}) \ge l(\boldsymbol{\theta}^{(i)})$ a ogni iterazione, EM trova sempre la stima ML, cioè il massimo globale di $L(\theta)$.`,
    answer: false,
    explanation: md`La crescita monotona garantisce solo di non peggiorare. La slide p75 avverte che la convergenza al massimo globale non è garantita: EM sale la collina su cui lo metti e può fermarsi su un massimo locale o su un punto di sella, secondo l'inizializzazione.`,
    difficulty: 1,
    concepts: ['c40', 'c42'],
  },
  // --- Inizializzazione simmetrica: punto di sella (c43, c44) --------------------------------------------
  {
    id: 'chk-10',
    type: 'mcq',
    q: md`Mistura 1-D con $M = 2$ inizializzata con due componenti identiche: $P_1 = P_2 = 0.5$, $m_1 = m_2$, $\sigma_1 = \sigma_2$. I dati hanno due gobbe ben separate. Che cosa fa EM?`,
    options: [
      md`Le posterior valgono 0.5 per ogni campione, le due componenti ricevono aggiornamenti identici e restano uguali per sempre: si ferma su un punto stazionario che non è un massimo`,
      md`Separa le due componenti già alla prima iterazione, perché la verosimiglianza deve salire`,
      md`Diverge, perché la matrice di covarianza diventa singolare`,
      md`Converge comunque al massimo globale, perché la log-verosimiglianza non scende mai`,
    ],
    answer: 0,
    explanation: md`Con componenti identiche i numeratori delle posterior coincidono, quindi ogni campione pesa 0.5 su entrambe. L'M-step dà a entrambe media e varianza campionarie globali e prior 0.5: la simmetria non si rompe. È un punto stazionario della verosimiglianza, del tipo punto di sella che la slide p75 nomina. Il rimedio è un'inizializzazione diversa.`,
    difficulty: 2,
    concepts: ['c43', 'c44'],
  },
  // --- Verosimiglianza illimitata (c67, c42) -------------------------------------------------------------
  {
    id: 'chk-11',
    type: 'tf',
    q: md`Per una mistura di gaussiane con covarianze libere la log-verosimiglianza ha sempre un massimo globale finito, che EM al più non riesce a raggiungere.`,
    answer: false,
    explanation: md`Centrando un modo su un campione e facendo tendere a zero la sua covarianza, il termine di quel campione cresce come $\ln[P_i/(2\pi\sigma^2)^{n/2}]$ mentre gli altri campioni restano spiegati dagli altri modi: la log-verosimiglianza tende a $+\infty$. Il massimo globale non esiste; la stima utile è un massimo locale non degenere.`,
    difficulty: 3,
    concepts: ['c67', 'c42'],
  },
  // --- Posterior del modo (c46, c47) --------------------------------------------------------------------
  {
    id: 'chk-12',
    type: 'numeric',
    q: md`Luminosità dei pesci: salmoni con $P_1 = 0.6$, $\mathcal{N}(5 \mid 4, 1^2) = 0.2420$; spigole con $P_2 = 0.4$, $\mathcal{N}(5 \mid 7, 1.5^2) = 0.1093$. Quanto vale la posterior $P(1 \mid x = 5)$ che il pesce sia un salmone?`,
    answer: 0.768,
    tolerance: 0.005,
    explanation: md`Numeratori: $0.6 \cdot 0.2420 = 0.1452$ e $0.4 \cdot 0.1093 = 0.0437$. Il denominatore è la mistura nel punto, $p(5) = 0.1889$. Posterior: $0.1452 / 0.1889 = 0.768$; quella della spigola è $0.232$ e le due sommano a 1.`,
    difficulty: 2,
    concepts: ['c46', 'c47'],
  },
  // --- Aggiornamento dei prior (c48) --------------------------------------------------------------------
  {
    id: 'chk-13',
    type: 'numeric',
    q: md`Cinque campioni hanno, dopo l'E-step, posterior del modo 1 pari a $0.9$, $0.6$, $0.3$, $0.1$, $0.1$. Quanto vale $P_1^{[k+1]}$?`,
    answer: 0.4,
    tolerance: 0.005,
    explanation: md`$P_1^{[k+1]} = \frac{1}{N} \sum_j P(1 \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = (0.9 + 0.6 + 0.3 + 0.1 + 0.1)/5 = 2.0/5 = 0.4$: la frazione morbida di campioni attribuiti al modo 1.`,
    difficulty: 1,
    concepts: ['c48'],
  },
  // --- Aggiornamento delle medie (c49) ------------------------------------------------------------------
  {
    id: 'chk-14',
    type: 'numeric',
    q: md`Campioni 1-D $x = 1$, $2$, $6$ con posterior del modo 1 pari a $0.8$, $0.6$, $0.1$. Quanto vale la nuova media $m_1^{[k+1]}$?`,
    answer: 1.7333,
    tolerance: 0.005,
    explanation: md`Media pesata: $m_1^{[k+1]} = \frac{0.8 \cdot 1 + 0.6 \cdot 2 + 0.1 \cdot 6}{0.8 + 0.6 + 0.1} = \frac{2.6}{1.5} = 1.733$. Il campione a 6 entra con peso 0.1: sposta la media di poco.`,
    difficulty: 2,
    concepts: ['c49'],
  },
  // --- La covarianza e il refuso della slide (c50, c52) ---------------------------------------------------
  {
    id: 'chk-15',
    type: 'mcq',
    q: md`Nell'aggiornamento di $\Sigma_i$ la slide p76 scrive dentro il peso la gaussiana con $\mathbf{m}_i^{[k+1]}$. Qual è la forma corretta dell'M-step?`,
    options: [
      md`Pesi uguali alle posterior dell'E-step (gaussiana con $\mathbf{m}_i^{[k]}$ e $\Sigma_i^{[k]}$), scarti calcolati rispetto alla media nuova $\mathbf{m}_i^{[k+1]}$`,
      md`Pesi con $\mathbf{m}_i^{[k+1]}$ come nella slide, scarti rispetto alla media vecchia $\mathbf{m}_i^{[k]}$`,
      md`Pesi e scarti entrambi con la media vecchia $\mathbf{m}_i^{[k]}$`,
      md`Pesi ricalcolati dopo aver aggiornato anche $\Sigma_i$`,
    ],
    answer: 0,
    explanation: md`Le tre equazioni usano le stesse posterior, calcolate con $\boldsymbol{\theta}^{[k]}$. Con $\mathbf{m}_i^{[k+1]}$ nel numeratore e $p(\mathbf{x}_j \mid \boldsymbol{\theta}^{[k]})$ al denominatore i pesi non sommerebbero più a 1 sui modi: è un refuso. Negli scarti invece va la media appena aggiornata, per questo aggiorni prima le medie e poi le covarianze.`,
    difficulty: 3,
    concepts: ['c50', 'c52'],
  },
  // --- Etichette note: stime ML per classe (c51) ---------------------------------------------------------
  {
    id: 'chk-16',
    type: 'tf',
    q: md`Se tutte le posterior valgono 0 oppure 1, le tre equazioni EM diventano frequenza relativa, media campionaria e covarianza campionaria di ciascun modo.`,
    answer: true,
    explanation: md`Con posterior 0/1 la somma dei pesi del modo $i$ è il numero $N_i$ dei suoi campioni: $\hat{P}_i = N_i/N$, $\hat{\mathbf{m}}_i$ è la media dei campioni del modo e $\hat{\Sigma}_i$ la loro covarianza con $1/N_i$. È la stima ML con etichette note, cioè il caso in cui conosci $\mathbf{Y}$.`,
    difficulty: 1,
    concepts: ['c51'],
  },
  // --- Esempio dei quattro punti, variante (c56, c57) -----------------------------------------------------
  {
    id: 'chk-17',
    type: 'numeric',
    q: md`Nell'esempio della slide p77 cambia il punto incompleto: i punti sono $(0, 2)$, $(1, 0)$, $(2, 2)$ e $(\ast, 6)$, con la stessa stima iniziale $\boldsymbol{\theta}^0 = (0, 0, 1, 1)$ e covarianza diagonale. Quanto vale $\mu_2$ dopo la prima iterazione?`,
    answer: 2.5,
    tolerance: 0.005,
    explanation: md`La componente $x_2$ è osservata in tutti e quattro i punti, quindi entra con i suoi valori: $\mu_2^1 = (2 + 0 + 2 + 6)/4 = 2.5$. Solo $x_{41}$ viene sostituito dal suo valore atteso, che riguarda $\mu_1$. Scartando il punto incompleto avresti $\mu_2 = 4/3$ e perderesti l'informazione $x_{42} = 6$.`,
    difficulty: 2,
    concepts: ['c56', 'c57'],
  },
  // --- Sigma adattivo (c62, c64) ------------------------------------------------------------------------
  {
    id: 'chk-18',
    type: 'numeric',
    q: md`Le distanze euclidee dal campione di training $\mathbf{x}_k$ agli altri campioni sono $0.5$, $1.2$, $0.3$, $2.0$, $0.9$. Con $L = 3$, quanto vale la larghezza adattiva $\sigma_k$?`,
    answer: 0.5667,
    tolerance: 0.005,
    explanation: md`I tre vicini più prossimi sono a $0.3$, $0.5$ e $0.9$: $\sigma_k = \frac{1}{L} \sum_{l=1}^{L} \Vert \mathbf{x}_k - \mathbf{y}_l \Vert = 1.7/3 = 0.567$. Dove i campioni sono fitti le distanze sono piccole e $\sigma_k$ si stringe.`,
    difficulty: 1,
    concepts: ['c62', 'c64'],
  },
]
