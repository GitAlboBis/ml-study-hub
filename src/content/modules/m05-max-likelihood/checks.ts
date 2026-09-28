// Quiz dentro il testo del foglio m05 (stima a massima verosimiglianza): ognuno ha il suo <Check id="chk-NN" />
// in index.mdx, subito dopo la spiegazione del concetto che verifica. L'integratore li unisce a data.quiz.
// I conti numerici sono rifatti a mano e usano dati diversi da quelli degli esempi svolti e degli esercizi.
import { md } from '../../types'
import type { QuizItem } from '../../types'

export const checks: QuizItem[] = [
  // --- Definizione: arg max (c02, c04) --------------------------------------------------------------
  {
    id: 'chk-01',
    type: 'mcq',
    q: md`Nella definizione $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta})$, che cosa restituisce l'operatore $\arg\max$?`,
    options: [
      md`Il valore di $\boldsymbol{\theta}$ in cui la likelihood dei campioni osservati è massima`,
      md`Il valore massimo della likelihood, cioè $\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta})$`,
      md`Il campione $\mathbf{x}_k$ con la densità più alta`,
      md`La probabilità di $\boldsymbol{\theta}$ dati i campioni, $p(\boldsymbol{\theta} \mid \mathbf{X})$`,
    ],
    answer: 0,
    explanation: md`$\arg\max$ restituisce il **punto** di massimo, non il valore. Nella ricerca varia $\boldsymbol{\theta}$ (scritto sotto l'operatore) e i dati $\mathbf{X}$ restano quelli osservati: ogni $\boldsymbol{\theta}$ individua una pdf della famiglia, ognuna con il suo valore di likelihood, e tieni quella con il valore più alto. $p(\boldsymbol{\theta} \mid \mathbf{X})$ è la posterior della stima bayesiana, che in ML non esiste perché $\boldsymbol{\theta}$ non è aleatorio.`,
    difficulty: 1,
    concepts: ['c02', 'c04', 'c05'],
  },
  // --- Densità contro probabilità (c06) --------------------------------------------------------------
  {
    id: 'chk-02',
    type: 'tf',
    q: md`Con feature continue la likelihood $p(\mathbf{X} \mid \boldsymbol{\theta})$ è una probabilità, quindi non può mai superare 1.`,
    answer: false,
    explanation: md`Con feature continue $p(\mathbf{X} \mid \boldsymbol{\theta})$ è una **densità** e può superare 1. Una gaussiana con $\sigma = 0.2$ vale $1/(0.2\sqrt{2\pi}) \approx 1.99$ nella sua media, e un solo campione lì dà likelihood $1.99$. La lettura «probabilità di osservare i dati» delle note è esatta solo con dati discreti, come la presenza di una parola in un'email.`,
    difficulty: 1,
    concepts: ['c06', 'c03'],
  },
  // --- Il logaritmo non sposta il massimo (c07, c08) -------------------------------------------------
  {
    id: 'chk-03',
    type: 'tf',
    q: md`Passando dalla likelihood alla log-likelihood cambia la posizione del massimo, ma non il suo valore.`,
    answer: false,
    explanation: md`È il contrario. Il logaritmo è strettamente crescente, quindi conserva l'ordine tra i candidati: il $\boldsymbol{\theta}$ che massimizza $\ln p(\mathbf{X} \mid \boldsymbol{\theta})$ massimizza anche $p(\mathbf{X} \mid \boldsymbol{\theta})$. Cambia il valore del massimo: se la likelihood massima vale $10^{-7}$, la log-likelihood massima vale circa $-16.1$.`,
    difficulty: 1,
    concepts: ['c07', 'c08'],
  },
  // --- Prodotto che diventa somma (c09) --------------------------------------------------------------
  {
    id: 'chk-04',
    type: 'numeric',
    q: md`Sotto un certo $\boldsymbol{\theta}$ tre campioni iid hanno densità $p(\mathbf{x}_1 \mid \boldsymbol{\theta}) = 0.2$, $p(\mathbf{x}_2 \mid \boldsymbol{\theta}) = 0.5$, $p(\mathbf{x}_3 \mid \boldsymbol{\theta}) = 0.1$. Quanto vale la log-likelihood $\ln p(\mathbf{X} \mid \boldsymbol{\theta})$?`,
    answer: -4.6052,
    tolerance: 0.01,
    explanation: md`La likelihood è il prodotto $0.2 \cdot 0.5 \cdot 0.1 = 0.01$. Il logaritmo la trasforma in somma: $\ln 0.2 + \ln 0.5 + \ln 0.1 = -1.6094 - 0.6931 - 2.3026 = -4.6052 = \ln 0.01$. Ogni campione contribuisce con un addendo proprio.`,
    difficulty: 1,
    concepts: ['c09', 'c07', 'c03'],
  },
  // --- Condizione necessaria e controllo del massimo (c10, c11) ---------------------------------------
  {
    id: 'chk-05',
    type: 'mcq',
    q: md`Hai trovato un $\hat{\theta}$ in cui la derivata prima della log-likelihood si annulla. Che cosa ti manca per dire che è la stima ML?`,
    options: [
      md`Controllare che sia un massimo (derivata seconda negativa) e che sia il massimo globale, confrontandolo anche con il bordo dello spazio dei parametri`,
      md`Niente: derivata nulla implica massimo`,
      md`Controllare che la likelihood in $\hat{\theta}$ valga 1`,
      md`Controllare che $\hat{\theta}$ sia non distorta`,
    ],
    answer: 0,
    explanation: md`Il gradiente nullo è una condizione necessaria, non sufficiente: il punto può essere un minimo, una sella o un massimo solo locale (misture di gaussiane). Con un parametro controlli $\partial^2 \ln p / \partial \theta^2 < 0$ in $\hat{\theta}$, con più parametri l'hessiana definita negativa. Il massimo può anche stare sul bordo, dove la derivata non si annulla. La non distorsione è una proprietà dello stimatore, non una condizione per essere la stima ML.`,
    difficulty: 2,
    concepts: ['c10', 'c11'],
  },
  // --- Massimo sul bordo: uniforme (c11) ------------------------------------------------------------
  {
    id: 'chk-06',
    type: 'numeric',
    q: md`Quattro tempi di attesa, modellati come uniformi su $[0, \theta]$: $2.1,\ 3.4,\ 0.7,\ 2.9$. Quanto vale la stima ML $\hat{\theta}$?`,
    answer: 3.4,
    tolerance: 0.001,
    explanation: md`La likelihood vale $\theta^{-4}$ se $\theta \geq \max_k x_k = 3.4$ e 0 altrimenti (un campione fuori da $[0, \theta]$ ha densità nulla). Per $\theta \geq 3.4$ la funzione $\theta^{-4}$ decresce, quindi il massimo sta sul bordo: $\hat{\theta} = 3.4$. La derivata non si annulla mai: la ricetta «derivata uguale a zero» qui non funziona.`,
    difficulty: 2,
    concepts: ['c11', 'c22'],
  },
  // --- Likelihood sulla verticale di x0 (c14, c15) ------------------------------------------------
  {
    id: 'chk-07',
    type: 'numeric',
    q: md`Gaussiana 1-D con varianza nota $\sigma = 0.5$, una sola osservazione $x_0 = 2$. Quanto vale la likelihood $p(x_0 \mid m)$ della candidata con media $m = 1.5$?`,
    answer: 0.4839,
    tolerance: 0.002,
    explanation: md`$p(x_0 \mid m) = \frac{1}{0.5\sqrt{2\pi}} \exp\left[-\frac{(2 - 1.5)^2}{2 \cdot 0.25}\right] = 0.7979 \cdot e^{-0.5} = 0.7979 \cdot 0.6065 = 0.4839$. La candidata centrata su $x_0$ darebbe il picco $0.7979$: la stima ML è $\hat{m} = x_0 = 2$.`,
    difficulty: 2,
    concepts: ['c12', 'c14', 'c15'],
  },
  // --- Pdf contro likelihood (c17) ------------------------------------------------------------------
  {
    id: 'chk-08',
    type: 'tf',
    q: md`La likelihood $p(\mathbf{X} \mid \theta)$, vista come funzione di $\theta$ con i dati fissati, ha sempre integrale 1 rispetto a $\theta$.`,
    answer: false,
    explanation: md`L'integrale vale 1 rispetto a $x$ con $\theta$ fissato (lettura come pdf). Rispetto a $\theta$, con i dati fissati, in generale non vale 1: per 12 successi su 40 prove di Bernoulli $\int_0^1 \theta^{12}(1 - \theta)^{28}\, d\theta$ è un numero minuscolo. La likelihood non è una densità su $\theta$: misura la compatibilità tra parametri e dati.`,
    difficulty: 1,
    concepts: ['c17', 'c16'],
  },
  // --- Media campionaria (c18, c19) --------------------------------------------------------------------
  {
    id: 'chk-09',
    type: 'numeric',
    q: md`Quattro misure da una gaussiana con varianza nota $\sigma^2 = 1$: $2.0,\ 3.5,\ 2.5,\ 4.0$. Quanto vale la stima ML della media?`,
    answer: 3,
    tolerance: 0.001,
    explanation: md`Annullando la derivata $\frac{1}{\sigma^2}\sum_k (x_k - m)$ ottieni la media campionaria: $\hat{m} = (2.0 + 3.5 + 2.5 + 4.0)/4 = 12/4 = 3$. Gli scarti $-1,\ 0.5,\ -0.5,\ 1$ sommano a zero: $\hat{m}$ è il baricentro dei campioni. La varianza nota non compare nel risultato.`,
    difficulty: 1,
    concepts: ['c18', 'c19', 'c10'],
  },
  // --- Proprietà della slide (c21, c23) ------------------------------------------------------------
  {
    id: 'chk-10',
    type: 'mcq',
    q: md`Quale affermazione corrisponde alla slide «ML Estimation: Properties»?`,
    options: [
      md`Se esiste una stima efficiente e la stima ML è non distorta, la stima efficiente è quella ML; anche se non esiste, ML è asintoticamente non distorta, asintoticamente efficiente e consistente`,
      md`La stima ML è non distorta ed efficiente per ogni $N$`,
      md`La stima ML esiste solo se esiste una stima efficiente`,
      md`La stima ML è consistente ma non asintoticamente efficiente`,
    ],
    answer: 0,
    explanation: md`La slide ha due punti, entrambi sotto opportune ipotesi di regolarità su $p(\mathbf{x} \mid \boldsymbol{\theta})$. Primo: esistenza di una stima efficiente più ML non distorta implicano che la stima efficiente è ML. Secondo: anche senza stima efficiente, ML ha le tre proprietà asintotiche. Con $N$ finito ML può essere distorta: la covarianza gaussiana divide per $N$.`,
    difficulty: 2,
    concepts: ['c21', 'c23', 'c24', 'c25', 'c26'],
  },
  // --- Bias della covarianza (c24, c28) ------------------------------------------------------------
  {
    id: 'chk-11',
    type: 'multi',
    q: md`La stima ML della covarianza gaussiana divide per $N$. Quali affermazioni sono vere?`,
    options: [
      md`È distorta per $N$ finito: $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$`,
      md`È asintoticamente non distorta`,
      md`Con $N = 10$ sottostima in media la covarianza del 10%`,
      md`Anche la media ML $\hat{\mathbf{m}}$ è distorta per $N$ finito`,
    ],
    answers: [0, 1, 2],
    explanation: md`Il fattore $(N-1)/N$ vale $0.9$ con $N = 10$ (sottostima del 10%) e tende a 1 per $N \to +\infty$: distorta con $N$ finito, asintoticamente non distorta. La media ML invece è non distorta per ogni $N$: $E\{\hat{\mathbf{m}}\} = \mathbf{m}$. Lo stimatore non distorto elementare divide per $N - 1$.`,
    difficulty: 2,
    concepts: ['c28', 'c24'],
  },
  {
    id: 'chk-12',
    type: 'numeric',
    q: md`Quattro campioni scalari $1,\ 3,\ 5,\ 7$ da una gaussiana con media e varianza incognite. Quanto vale la stima ML della varianza $\hat{\sigma}^2$?`,
    answer: 5,
    tolerance: 0.001,
    explanation: md`Media ML $\hat{m} = 16/4 = 4$. Scarti al quadrato: $9,\ 1,\ 1,\ 9$, somma $20$. La stima ML divide per $N$: $\hat{\sigma}^2 = 20/4 = 5$. Lo stimatore non distorto dividerebbe per $N - 1 = 3$ e darebbe $6.67$; il rapporto $5/6.67 = 0.75$ è proprio $(N-1)/N$.`,
    difficulty: 2,
    concepts: ['c28', 'c18'],
  },
  // --- ML contro bayesiana (c68) --------------------------------------------------------------------
  {
    id: 'chk-13',
    type: 'mcq',
    q: md`Secondo la slide «ML versus Bayesian Estimation», in quali casi la stima ML e la stima bayesiana sono equivalenti?`,
    options: [
      md`Nel limite di infiniti campioni di training, oppure se la prior $p(\boldsymbol{\theta})$ è uniforme`,
      md`Con pochi campioni e una prior molto concentrata`,
      md`Solo se il modello è gaussiano`,
      md`Mai: la stima bayesiana dà una distribuzione, ML un punto`,
    ],
    answer: 0,
    explanation: md`Con prior uniforme la posterior è proporzionale alla likelihood, quindi il suo massimo è $\hat{\boldsymbol{\theta}}_{ML}$. Con $N \to \infty$ la posterior si stringe in una delta di Dirac attorno al valore ML e la prior perde peso. La soluzione bayesiana completa $p(\mathbf{x} \mid \mathbf{X})$ coincide con $p(\mathbf{x} \mid \hat{\boldsymbol{\theta}}_{ML})$ solo quando la posterior è concentrata, cioè con $N$ grande.`,
    difficulty: 1,
    concepts: ['c68'],
  },
  // --- Due volte maximum likelihood (c69) ---------------------------------------------------------------
  {
    id: 'chk-14',
    type: 'mcq',
    q: md`Nel criterio ML di classificazione, $\mathbf{x} \in \omega_j$ se $p(\mathbf{x} \mid \omega_j) \geq p(\mathbf{x} \mid \omega_i)$ per ogni $i$. Che cosa varia nella massimizzazione?`,
    options: [
      md`La classe $\omega_i$, con il campione $\mathbf{x}$ fisso`,
      md`Il parametro $\boldsymbol{\theta}$, con i campioni di training fissi`,
      md`Sia la classe sia il parametro, insieme`,
      md`La prior delle classi`,
    ],
    answer: 0,
    explanation: md`Il criterio di classificazione tiene fisso il campione nuovo e sceglie la classe con la densità condizionata più alta. La stima ML dei parametri fa l'opposto: tiene fissi i campioni di training e varia $\boldsymbol{\theta}$. In sequenza: prima stimi con ML i parametri di ogni $p(\mathbf{x} \mid \omega_i)$, poi usi le pdf stimate per decidere. Con prior uguali il criterio ML equivale al MAP.`,
    difficulty: 1,
    concepts: ['c69'],
  },
  // --- Scelta del modello: il pre-processing cambia la pdf (c32, c38, c42) --------------------------------
  {
    id: 'chk-15',
    type: 'mcq',
    q: md`Il sistema estrae come feature il modulo di un segnale complesso, la cui parte reale e immaginaria sono gaussiane indipendenti a media nulla e con la stessa $\sigma$. Quale modello della galleria scegli per la feature?`,
    options: [
      md`Rayleigh`,
      md`Gaussiano`,
      md`Log-normale`,
      md`Chi-quadro con 1 grado di libertà`,
    ],
    answer: 0,
    explanation: md`Il modulo $\sqrt{z_1^2 + z_2^2}$ di due gaussiane indipendenti a media nulla e con la stessa $\sigma$ è una Rayleigh di parametro $\sigma$: è non negativo, parte da zero, ha la moda in $\sigma$. È il terzo aspetto della scelta del modello: l'estrazione delle feature cambia la pdf, e il modello va scelto per la feature che entra nel classificatore, non per il segnale grezzo.`,
    difficulty: 2,
    concepts: ['c32', 'c38', 'c42', 'c29'],
  },
  // --- Parentele Gamma e chi-quadro (c42) ---------------------------------------------------------------
  {
    id: 'chk-16',
    type: 'tf',
    q: md`Nella galleria, la curva del pannello Gamma con $k = 1$ e $\theta = 2$ e la curva del pannello chi-quadro con $k = 2$ sono la stessa funzione.`,
    answer: true,
    explanation: md`La chi-quadro con $k$ gradi di libertà è una Gamma con forma $k/2$ e scala 2: con $k = 2$ è la Gamma con forma 1 e scala 2, cioè l'esponenziale $\frac{1}{2}e^{-x/2}$. Entrambe le curve partono da $0.5$ in $x = 0$ e decrescono.`,
    difficulty: 2,
    concepts: ['c42', 'c37', 'c39'],
  },
  // --- Limite centrale (c46, c47) -------------------------------------------------------------------
  {
    id: 'chk-17',
    type: 'multi',
    q: md`Quali sono le ipotesi del teorema del limite centrale come lo enunciano le note?`,
    options: [
      md`Molte variabili aleatorie sommate`,
      md`Variabili indipendenti e identicamente distribuite`,
      md`Varianza finita`,
      md`Addendi già gaussiani`,
    ],
    answers: [0, 1, 2],
    explanation: md`Le note: «If the sum of many independent and identically distributed (iid) random variables has finite variance, then the sum will be approximately normally distributed». Gli addendi possono avere qualunque distribuzione: la somma diventa gaussiana lo stesso. Per addendi iid la varianza finita della somma equivale alla varianza finita di ciascun addendo.`,
    difficulty: 1,
    concepts: ['c46', 'c47'],
  },
  // --- Numero di parametri (c54) ------------------------------------------------------------------------
  {
    id: 'chk-18',
    type: 'numeric',
    q: md`Quanti parametri scalari liberi ha una gaussiana multivariata con $n = 3$ feature (vettore medio più matrice di covarianza)?`,
    answer: 9,
    tolerance: 0.001,
    explanation: md`Il vettore medio ha $n = 3$ componenti. La covarianza è $3 \times 3$ ma simmetrica, quindi ha $n(n+1)/2 = 6$ elementi liberi (3 varianze e 3 covarianze). Totale $r = 3 + 6 = 9$. Il conto cresce con il quadrato di $n$: è la radice dell'effetto Hughes.`,
    difficulty: 2,
    concepts: ['c54', 'c58'],
  },
  // --- Mahalanobis con Σ diagonale (c51, c61) --------------------------------------------------------
  {
    id: 'chk-19',
    type: 'numeric',
    q: md`Gaussiana 2-D con $\mathbf{m} = (0, 0)$ e $\Sigma = \mathrm{diag}(4, 1)$. Quanto vale la distanza di Mahalanobis al quadrato del punto $\mathbf{x} = (2, 1)$?`,
    answer: 2,
    tolerance: 0.001,
    explanation: md`Con $\Sigma$ diagonale la forma quadratica è la somma degli scarti standardizzati al quadrato: $(2 - 0)^2/4 + (1 - 0)^2/1 = 1 + 1 = 2$. La distanza euclidea al quadrato sarebbe $5$: la prima feature varia di più, quindi il suo scarto pesa meno.`,
    difficulty: 2,
    concepts: ['c51', 'c60', 'c61'],
  },
  // --- Indipendenza e covarianza (c60) --------------------------------------------------------------
  {
    id: 'chk-20',
    type: 'tf',
    q: md`Se due feature qualsiasi hanno covarianza nulla, allora sono indipendenti.`,
    answer: false,
    explanation: md`Vale il verso opposto: indipendenti implica covarianza nulla. Il viceversa in generale è falso: con $x$ gaussiana standard e $y = x^2$ la covarianza è $E\{x^3\} - E\{x\}E\{x^2\} = 0$, ma $y$ dipende completamente da $x$. Per variabili congiuntamente gaussiane, invece, covarianza nulla equivale a indipendenza.`,
    difficulty: 2,
    concepts: ['c60'],
  },
  // --- Autovalori e assi dell'ellisse (c64, c65, c66) ------------------------------------------------
  {
    id: 'chk-21',
    type: 'numeric',
    q: md`Matrice di covarianza $\Sigma = \begin{bmatrix} 5 & 2 \\ 2 & 2 \end{bmatrix}$. Quanto vale l'autovalore associato all'asse maggiore delle ellissi di isolivello?`,
    answer: 6,
    tolerance: 0.001,
    explanation: md`Equazione caratteristica: $(5 - \lambda)(2 - \lambda) - 4 = \lambda^2 - 7\lambda + 6 = 0$, quindi $\lambda_1 = 6$ e $\lambda_2 = 1$. L'asse maggiore è lungo l'autovettore di $\lambda_1 = 6$, la direzione di massima varianza. Il rapporto tra i semiassi è $\sqrt{6/1} \approx 2.45$.`,
    difficulty: 2,
    concepts: ['c64', 'c65', 'c66', 'c59'],
  },
]
