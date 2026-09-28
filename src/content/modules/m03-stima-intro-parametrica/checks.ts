// Quiz dentro il testo del foglio m03 (introduzione alla stima, stima di pdf, stima parametrica): ognuno ha il suo
// <Check id="chk-NN" /> in index.mdx, subito dopo il punto in cui il concetto è spiegato. L'integratore li unisce a
// data.quiz (il validatore risolve <Check id> su data.quiz). I conti numerici sono rifatti a mano e con node; i dati
// sono diversi da quelli degli esempi svolti, così il quiz non ripete la soluzione già scritta nel testo.
import { md } from '../../types'
import type { QuizItem } from '../../types'

export const checks: QuizItem[] = [
  // --- Overfitting e compromesso (c01, c02, c03) --------------------------------------------------------
  {
    id: 'chk-01',
    type: 'tf',
    q: md`Nell'esempio del pesce il confine rosso tortuoso classifica bene tutti i campioni di training: per questo è il classificatore migliore dei tre gradini.`,
    answer: false,
    explanation: md`Errore nullo sul training non vuol dire buona generalizzazione. Il modello molto flessibile impara anche il rumore di feature ed etichette (possibili errori umani) e memorizza i campioni: su pesci nuovi sbaglia nelle anse della curva. Le note chiedono un compromesso tra complessità del modello e capacità di generalizzazione.`,
    difficulty: 1,
    concepts: ['c01', 'c02', 'c03'],
  },
  // --- Canale PAM ideale: prior e condizionate (c08) -----------------------------------------------------
  {
    id: 'chk-02',
    type: 'numeric',
    q: md`Canale PAM ideale (senza rumore), ma con una sorgente che emette Yes, Maybe e No con probabilità 0.5, 0.3 e 0.2. Quanto vale $P(Y_s = 0.75)$?`,
    answer: 0.2,
    tolerance: 0.001,
    explanation: md`Nel sistema ideale le condizionate valgono 0 oppure 1: $P(Y_s = 0.75 \mid \text{No}) = 1$ e $P(Y_s = 0.75 \mid s) = 0$ per gli altri simboli. Per la probabilità totale $P(Y_s = 0.75) = \sum_s P(Y_s = 0.75 \mid s)\,P(s) = P(\text{No}) = 0.2$. Cambiare i prior cambia le probabilità dei valori campionati, non le condizionate.`,
    difficulty: 1,
    concepts: ['c08'],
  },
  // --- Densità del segnale ricevuto (c11, c12, c13) --------------------------------------------------------
  {
    id: 'chk-03',
    type: 'mcq',
    q: md`Nel canale PAM rumoroso $y = x + n$, con $x$ discreta su tre livelli equiprobabili e $n$ gaussiano indipendente da $x$. Che forma ha la densità di $y$?`,
    options: [
      md`Una mistura di tre gaussiane con peso $1/3$, centrate in 0.25, 0.5 e 0.75`,
      md`Una sola gaussiana centrata in 0.5`,
      md`Tre impulsi di massa $1/3$ in 0.25, 0.5 e 0.75`,
      md`Una distribuzione uniforme tra 0.25 e 0.75`,
    ],
    answer: 0,
    explanation: md`Discreta più continua fa continua, quindi $y$ ha una pdf. È la convoluzione $P_x * P_n$: ogni impulso di massa $1/3$ diventa una campana di area $1/3$ centrata sul suo livello, con larghezza fissata da $\sigma_n$. I tre impulsi sono la distribuzione di $x$, non di $y$.`,
    difficulty: 1,
    concepts: ['c11', 'c12', 'c13'],
  },
  // --- Soglie e probabilità d'errore (c14) ---------------------------------------------------------------------
  {
    id: 'chk-04',
    type: 'numeric',
    q: md`Canale PAM con prior uguali, soglie 0.375 e 0.625 e rumore gaussiano con $\sigma_n = 0.0625$. Sapendo che $Q(2) \approx 0.0228$, quanto vale la probabilità d'errore $P_e$?`,
    answer: 0.0304,
    tolerance: 0.001,
    explanation: md`Ogni coda parte a distanza 0.125 dal livello, cioè $0.125/0.0625 = 2$ deviazioni standard. I simboli estremi sbagliano da un lato, quello centrale da due: $P_e = \frac{1}{3}(1 + 2 + 1)\,Q(2) = \frac{4}{3} \cdot 0.0228 \approx 0.0304$, circa il 3%.`,
    difficulty: 2,
    concepts: ['c14'],
  },
  // --- Dove serve la stima (c19, c20, c21, c22) ----------------------------------------------------------------
  {
    id: 'chk-05',
    type: 'multi',
    q: md`Nello schema a blocchi della slide 3, verso quali blocchi puntano le manine rosse con il fumetto «Statistical estimation can be necessary here»?`,
    options: ['Acquisition', 'Pre-processing', 'Feature Extraction', 'Recognition', 'Post-recognition', 'Decision'],
    answers: [1, 2, 3],
    explanation: md`Le manine indicano pre-processing (normalizzazione, riduzione del rumore, valori mancanti), feature extraction (feature compatte e informative dalle proprietà statistiche) e recognition (apprendere distribuzioni di probabilità e decidere). Nessuna manina su Acquisition, Post-recognition e Decision.`,
    difficulty: 1,
    concepts: ['c19', 'c20', 'c21', 'c22'],
  },
  // --- Tre categorie di segnali (c28, c29, c30, c31) ------------------------------------------------------------
  {
    id: 'chk-06',
    type: 'mcq',
    q: md`La stima della velocità del bersaglio in un sistema sonar è l'esempio di quale categoria di segnali stocastici?`,
    options: [
      md`Segnali parametrici rumorosi: sorgente parzialmente nota, si stimano parametri`,
      md`Segnali deterministici rumorosi: sorgente completamente nota`,
      md`Segnali aleatori rumorosi: sorgente completamente ignota`,
      md`Nessuna: nel sonar non c'è rumore`,
    ],
    answer: 0,
    explanation: md`Nel sonar la struttura del segnale è nota, ma parametri come la velocità vanno inferiti da osservazioni rumorose. Il PAM è l'esempio dei deterministici rumorosi, il georadar per oggetti sepolti quello degli aleatori rumorosi. Il rumore c'è in tutte e tre le categorie.`,
    difficulty: 1,
    concepts: ['c28', 'c29', 'c30', 'c31'],
  },
  // --- ML statistico e non statistico (c32, c33) ------------------------------------------------------------------
  {
    id: 'chk-07',
    type: 'tf',
    q: md`Secondo gli appunti, gli approcci di machine learning non statistico, come certi tipi di deep learning, richiedono di stimare in modo esplicito la PDF dei dati.`,
    answer: false,
    explanation: md`Gli approcci non statistici possono non richiedere la PDF in modo esplicito: imparano i pattern in modo guidato dai dati, senza assumere un modello probabilistico sottostante. È il machine learning statistico a basarsi sulla PDF, e per esso una stima accurata è essenziale.`,
    difficulty: 1,
    concepts: ['c33'],
  },
  // --- Notazione e obiettivo della stima di pdf (c34, c35, c37) ---------------------------------------------------
  {
    id: 'chk-08',
    type: 'mcq',
    q: md`Un impianto misura luminosità e larghezza di 500 pesci. Nella notazione della slide 7, quanto valgono $n$ e $N$?`,
    options: [md`$n = 2$, $N = 500$`, md`$n = 500$, $N = 2$`, md`$n = N = 500$`, md`$n = 1000$, $N = 500$`],
    answer: 0,
    explanation: md`$n$ minuscolo è il numero di feature, la lunghezza del vettore $\mathbf{x} = (x_1, \dots, x_n)$: qui due. $N$ maiuscolo è il numero di campioni di training $\mathbf{x}_1, \dots, \mathbf{x}_N$: qui 500. La stima $\hat{p}(\mathbf{x})$ si costruisce su questi $N$ campioni.`,
    difficulty: 1,
    concepts: ['c34', 'c35', 'c37'],
  },
  // --- Categoria di segnale e approccio (c40, c44, c48, c78) --------------------------------------------------
  {
    id: 'chk-09',
    type: 'mcq',
    q: md`Conosci la struttura del segnale ma non i valori che la controllano. Quale approccio alla stima della pdf si adatta a questa situazione?`,
    options: [
      md`Parametrico: forma nota, stimi il vettore $\boldsymbol{\theta}$`,
      md`Non parametrico: nessuna forma assunta, stimi l'intera funzione`,
      md`Nessuno: con una sorgente nota non c'è nulla da stimare`,
      md`Solo l'approssimazione con funzioni ortogonali`,
    ],
    answer: 0,
    explanation: md`È la categoria dei segnali parametrici rumorosi (sorgente parzialmente nota): la forma della distribuzione è nota e resta da stimare un vettore di $r$ parametri. Con sorgente completamente ignota useresti il non parametrico; con sorgente completamente nota non c'è una densità da stimare.`,
    difficulty: 2,
    concepts: ['c40', 'c44', 'c48', 'c78'],
  },
  // --- Il prodotto richiede l'indipendenza (c36, c52) ----------------------------------------------------------------
  {
    id: 'chk-10',
    type: 'tf',
    q: md`Se i campioni sono correlati (per esempio letture consecutive dello stesso sensore), la densità congiunta $p(\mathbf{x}_1, \dots, \mathbf{x}_N \mid \boldsymbol{\theta})$ è ancora uguale al prodotto delle densità marginali $\prod_k p(\mathbf{x}_k \mid \boldsymbol{\theta})$.`,
    answer: false,
    explanation: md`Il prodotto delle marginali è la densità congiunta solo se i campioni sono indipendenti (per $\boldsymbol{\theta}$ fissato). Con campioni dipendenti la regola della catena lascia densità condizionate, per esempio $p(\mathbf{x}_2 \mid \mathbf{x}_1, \boldsymbol{\theta})$. Per questo le note dicono che l'ipotesi iid si assume per semplificare il calcolo, pur essendo raramente vera.`,
    difficulty: 2,
    concepts: ['c36', 'c52'],
  },
  // --- Calcolo della verosimiglianza (c51) ---------------------------------------------------------------------------
  {
    id: 'chk-11',
    type: 'numeric',
    q: md`Modello $p(x \mid \theta)$ gaussiano con media $\theta$ e $\sigma = 1$. Due campioni, $x_1 = 2$ e $x_2 = 4$. Quanto vale la verosimiglianza $p(\mathbf{X} \mid \theta)$ per $\theta = 3$?`,
    answer: 0.0585,
    tolerance: 0.001,
    explanation: md`È il prodotto delle due densità: $p(\mathbf{X} \mid 3) = \frac{1}{\sqrt{2\pi}}e^{-1/2} \cdot \frac{1}{\sqrt{2\pi}}e^{-1/2} = \frac{1}{2\pi}e^{-1} \approx 0.1592 \cdot 0.3679 \approx 0.0585$. Con $\theta = 3$ i due campioni distano entrambi 1 dalla media.`,
    difficulty: 2,
    concepts: ['c51', 'c52'],
  },
  // --- La verosimiglianza non è una densità in theta (c53, c58) ---------------------------------------------------
  {
    id: 'chk-12',
    type: 'tf',
    q: md`Con i campioni $\mathbf{X}$ fissati, la verosimiglianza $p(\mathbf{X} \mid \theta)$ vista come funzione di $\theta$ è una densità di probabilità su $\theta$: la sua area vale 1.`,
    answer: false,
    explanation: md`Come funzione di $x$, con $\theta$ fissato, $p(x \mid \theta)$ ha area 1. Come funzione di $\theta$ la verosimiglianza è una misura di compatibilità tra $\theta$ e i dati: la sua area non ha significato. Nell'esempio della slide 10 vale circa $1.07 \times 10^{-7}$.`,
    difficulty: 1,
    concepts: ['c53', 'c58'],
  },
  // --- Parabola della log-verosimiglianza (c56, c57, c59) ---------------------------------------------------------
  {
    id: 'chk-13',
    type: 'numeric',
    q: md`Nell'esempio della slide 10 ($N = 12$, $\sigma = 1$) la log-verosimiglianza ha massimo $l(\hat{\theta}) = -15.73$ in $\hat{\theta} = 3.13$ e vale $l(\theta) = l(\hat{\theta}) - \frac{N}{2\sigma^2}(\theta - \hat{\theta})^2$. Quanto vale $l(4)$?`,
    answer: -20.27,
    tolerance: 0.05,
    explanation: md`$l(4) = -15.73 - 6 \cdot (0.87)^2 = -15.73 - 4.54 = -20.27$. In verosimiglianza, $e^{-20.27} \approx 1.6 \times 10^{-9}$: circa 94 volte meno del massimo. Il logaritmo tiene questi numeri in una scala leggibile.`,
    difficulty: 2,
    concepts: ['c56', 'c57', 'c59'],
  },
  // --- MLE e BE (c61, c62, c63, c64) -----------------------------------------------------------------------------------
  {
    id: 'chk-14',
    type: 'mcq',
    q: md`Quale frase descrive la stima bayesiana (BE) secondo la slide 11 e gli appunti?`,
    options: [
      md`I parametri sono variabili aleatorie con un prior noto; i campioni lo trasformano in una densità a posteriori`,
      md`I parametri sono fissi ma incogniti; si sceglie il valore che massimizza la probabilità dei campioni osservati`,
      md`Si ottimizza una funzione obiettivo basata solo sui dati osservati`,
      md`Non usa la verosimiglianza: combina solo prior e conoscenza del progettista`,
    ],
    answer: 0,
    explanation: md`Nella BE $\boldsymbol{\theta}$ è una variabile aleatoria con prior $p(\boldsymbol{\theta})$; il teorema di Bayes combina prior e verosimiglianza e produce $p(\boldsymbol{\theta} \mid \mathbf{X})$, una descrizione completa dell'incertezza. La seconda e la terza opzione descrivono la MLE. I dati entrano nella BE proprio attraverso la verosimiglianza.`,
    difficulty: 1,
    concepts: ['c61', 'c62', 'c63', 'c64'],
  },
  // --- Quando ML e Bayes coincidono (c79) -------------------------------------------------------------------------------
  {
    id: 'chk-15',
    type: 'multi',
    q: md`Secondo la slide 40, in quali casi le soluzioni ML e bayesiana sono equivalenti?`,
    options: [
      md`Prior $p(\boldsymbol{\theta})$ uniforme`,
      md`Numero di campioni di training che tende all'infinito`,
      md`Prior molto stretto attorno a un valore scelto dal progettista`,
      md`Pochissimi campioni di training`,
    ],
    answers: [0, 1],
    explanation: md`Il posterior è proporzionale a verosimiglianza per prior. Se il prior è costante sparisce e il posterior ha lo stesso massimo della verosimiglianza; se $N \to \infty$ la verosimiglianza diventa un picco sempre più stretto e domina il prior. Un prior stretto o pochi campioni sono i casi in cui il prior pesa di più e le due stime differiscono.`,
    difficulty: 2,
    concepts: ['c79'],
  },
  // --- Bias di uno stimatore (c65, c66, c67, c68) --------------------------------------------------------------------
  {
    id: 'chk-16',
    type: 'numeric',
    q: md`Campioni iid con media vera $\theta = 10$. Lo stimatore è $\hat{\theta} = \frac{1}{N+1}\sum_{k=1}^{N} x_k$ e $N = 4$. Quanto vale il bias $E\{\varepsilon\} = E\{\hat{\theta}\} - \theta$?`,
    answer: -2,
    tolerance: 0.01,
    explanation: md`$E\{\hat{\theta}\} = \frac{N}{N+1}\theta = \frac{4}{5} \cdot 10 = 8$, quindi il bias è $8 - 10 = -2$. Lo stimatore è polarizzato; il bias $-\theta/(N+1)$ tende però a zero per $N \to \infty$: è asintoticamente non polarizzato.`,
    difficulty: 2,
    concepts: ['c65', 'c66', 'c67', 'c68', 'c74'],
  },
  // --- Bound di Cramér-Rao (c70, c71, c72) --------------------------------------------------------------------------------
  {
    id: 'chk-17',
    type: 'numeric',
    q: md`Stimi la media di una gaussiana con $\sigma = 2$ nota da $N = 16$ campioni iid. L'informazione di Fisher vale $I(\theta) = N/\sigma^2$. Quanto vale il bound di Cramér-Rao sulla varianza dell'errore?`,
    answer: 0.25,
    tolerance: 0.001,
    explanation: md`Il bound è $[I(\theta)]^{-1} = \sigma^2/N = 4/16 = 0.25$. La media campionaria ha varianza esattamente $\sigma^2/N$ ed è non polarizzata: raggiunge il bound, quindi è uno stimatore efficiente.`,
    difficulty: 2,
    concepts: ['c70', 'c71', 'c72'],
  },
  // --- Consistenza (c73, c76, c77) ----------------------------------------------------------------------------------
  {
    id: 'chk-18',
    type: 'tf',
    q: md`Uno stimatore ha bias $\theta/N$ e varianza $\sigma^2/N$. Soddisfa le condizioni delle note per la consistenza.`,
    answer: true,
    explanation: md`Il bias tende a zero (asintoticamente non polarizzato) e la varianza tende a zero per $N \to +\infty$. Per Chebyshev $P\{\vert\varepsilon\vert \ge \delta\} \le (\text{var} + \text{bias}^2)/\delta^2 \to 0$ per ogni $\delta > 0$: lo stimatore è consistente, anche se per $N$ finito è polarizzato.`,
    difficulty: 2,
    concepts: ['c73', 'c76', 'c77'],
  },
]
