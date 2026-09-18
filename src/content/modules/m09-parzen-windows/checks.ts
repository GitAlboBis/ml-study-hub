// Quiz dentro il testo del foglio m09 (finestre di Parzen): ognuno ha il suo <Check id="chk-NN" /> in index.mdx,
// nel punto in cui il concetto è appena stato spiegato. L'integratore li unisce a data.quiz (il validatore risolve
// <Check id> su data.quiz). I conti numerici sono rifatti a mano; i dati degli esempi sono diversi da quelli degli
// esercizi, così il quiz non suggerisce la soluzione di es01, es06, es08 ed es09.
import { md } from '../../types'
import type { QuizItem } from '../../types'

export const checks: QuizItem[] = [
  // --- Parzen contro K-NN (c02) ----------------------------------------------------------------------
  {
    id: 'chk-01',
    type: 'mcq',
    q: md`Entrambi i metodi partono da $\hat{p}(\mathbf{x}^*) = K/(NV)$. Nel metodo di Parzen che cosa fissi a priori?`,
    options: [
      md`Il volume $V$ della regione, tramite la larghezza $h$`,
      md`Il numero $K$ di campioni che devono cadere nella regione`,
      md`La forma parametrica della pdf`,
      md`Il rapporto $K/N$`,
    ],
    answer: 0,
    explanation: md`Parzen fissa la regione (un ipercubo di lato $h$, volume $V = h^n$) e conta $K$ dai dati. Il K-NN fa il contrario: fissa $K$ e allarga la cella fino a contenerne $K$, misurando $V_K(\mathbf{x}^*)$. Nessuno dei due assume una forma parametrica.`,
    difficulty: 1,
    concepts: ['c02'],
  },
  // --- Test di appartenenza e conteggio (c06, c07, c08) ------------------------------------------------
  {
    id: 'chk-02',
    type: 'numeric',
    q: md`Cinque campioni 1-D: $0.4,\ 1.1,\ 1.3,\ 2.0,\ 2.9$. Con finestra a ipercubo di lato $h = 1$ centrata in $x^* = 1.4$, quanto vale $\hat{p}(x^*)$?`,
    answer: 0.4,
    tolerance: 0.005,
    explanation: md`La finestra copre $[x^* - h/2,\ x^* + h/2] = [0.9,\ 1.9]$: $\gamma[(x_k - x^*)/h] = 1$ solo per $1.1$ e $1.3$ ($\vert x_k - x^* \vert \le 0.5$), mentre $2.0$ dista $0.6$. Quindi $K = 2$ e $\hat{p} = K/(Nh) = 2/(5 \cdot 1) = 0.4$.`,
    difficulty: 1,
    concepts: ['c06', 'c07', 'c08'],
  },
  // --- Simmetria della finestra (c09) -------------------------------------------------------------------
  {
    id: 'chk-03',
    type: 'tf',
    q: md`Nella slide p52 si può scrivere $\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right) = \gamma\left(\frac{\mathbf{x}^* - \mathbf{x}_k}{h}\right)$ perché la finestra è una funzione pari, $\gamma(\mathbf{u}) = \gamma(-\mathbf{u})$.`,
    answer: true,
    explanation: md`L'ipercubo unitario è simmetrico rispetto all'origine, e lo sono anche i sei kernel delle slide p58-59. Il cambio di segno non cambia il valore ma il punto di vista: da una finestra centrata su $\mathbf{x}^*$ a $N$ finestre centrate sui campioni, la forma che si generalizza a kernel qualsiasi.`,
    difficulty: 1,
    concepts: ['c09'],
  },
  // --- Conteggio con due campioni (c11, c71) ------------------------------------------------------------
  {
    id: 'chk-04',
    type: 'numeric',
    q: md`Due campioni 1-D in $x_1 = 1$ e $x_2 = 4$, kernel rettangolare con $h = 2$. Quanto vale $\hat{p}(1.5)$?`,
    answer: 0.25,
    tolerance: 0.005,
    explanation: md`Ogni campione porta un rettangolo di base $h = 2$ e altezza $1/(Nh) = 1/4$: il primo su $[0, 2]$, il secondo su $[3, 5]$. In $1.5$ arriva solo il primo, quindi $\hat{p}(1.5) = 0.25$. Nota che in $2.5$ non arriva nessun rettangolo: la stima vale $0$, un buco tra i due campioni.`,
    difficulty: 2,
    concepts: ['c10', 'c11', 'c71'],
  },
  // --- Interpolazione (c14, c16) -------------------------------------------------------------------------
  {
    id: 'chk-05',
    type: 'mcq',
    q: md`Che cosa cambia davvero quando sostituisci il kernel rettangolare con un kernel gaussiano?`,
    options: [
      md`Il contributo di ogni campione diventa graduato con la sua distanza da $\mathbf{x}$, invece di valere 0 oppure 1`,
      md`Ogni campione porta un'area diversa da $1/N$`,
      md`La stima smette di essere una media sui campioni`,
      md`Il numero di campioni che contribuisce in $\mathbf{x}$ scende a uno`,
    ],
    answer: 0,
    explanation: md`Slide p53: «the window function is being used for interpolation - each sample contributing to the estimate in accordance with its distance from x». La massa di ogni campione resta $1/N$ e la stima resta una media: cambia solo il peso, che ora cala con la distanza, e con esso spariscono salti e spigoli.`,
    difficulty: 1,
    concepts: ['c14', 'c16'],
  },
  // --- Densità legittima (c19, c20, c21) ---------------------------------------------------------------------
  {
    id: 'chk-06',
    type: 'multi',
    q: md`Quali condizioni, prese insieme, garantiscono che la stima di Parzen $\hat{p}(\mathbf{x})$ sia una densità legittima?`,
    options: [
      md`$\gamma(\mathbf{x}) \ge 0$ per ogni $\mathbf{x} \in \Re^n$`,
      md`$\int_{\Re^n} \gamma(\mathbf{x})\,d\mathbf{x} = 1$`,
      md`$V = h^n$`,
      md`$\gamma$ continua`,
      md`$\gamma$ con il massimo nell'origine`,
    ],
    answers: [0, 1, 2],
    explanation: md`Slide p54: se il kernel è una densità e mantieni $V = h^n$, la stima è non negativa e integra a 1 (il fattore $1/h^n$ cancella lo Jacobiano $h^n$ del cambio di variabile). Continuità e massimo nell'origine sono condizioni aggiuntive per una stima «buona», non per una stima legittima.`,
    difficulty: 2,
    concepts: ['c19', 'c20', 'c21'],
  },
  // --- Kernel buoni (c22-c24, c33, c39) ------------------------------------------------------------------------
  {
    id: 'chk-07',
    type: 'mcq',
    q: md`Quale dei sei kernel delle slide p58-59 viola una delle tre condizioni per una «buona» stima?`,
    options: [md`Il rettangolare`, md`Il triangolare`, md`Il Cauchy`, md`Il sinc al quadrato`],
    answer: 0,
    explanation: md`Tutti e sei sono densità, hanno il massimo nell'origine e decadono a zero. Il rettangolare $\Pi(x)$ non è continuo (salta ai bordi del supporto) e infatti produce stime a gradini.`,
    difficulty: 1,
    concepts: ['c23', 'c33', 'c39'],
  },
  // --- Ampiezza e larghezza di delta (c27, c31) ---------------------------------------------------------------
  {
    id: 'chk-08',
    type: 'numeric',
    q: md`Finestra normale 2-D a simmetria circolare. Se $h$ passa da $1$ a $0.5$, per quale fattore si moltiplica il picco $\delta(\mathbf{0})$?`,
    answer: 4,
    tolerance: 0.01,
    explanation: md`$\delta(\mathbf{0}) = \gamma(\mathbf{0})/h^n$ con $n = 2$: dimezzare $h$ moltiplica il picco per $2^2 = 4$ (da $0.159$ a $0.637$, i valori della slide p56). Il volume sotto la superficie resta 1.`,
    difficulty: 2,
    concepts: ['c27', 'c31'],
  },
  // --- Oversmoothing e overfitting (c28, c29, c32) -------------------------------------------------------------
  {
    id: 'chk-09',
    type: 'mcq',
    q: md`Nella slide p57, con $h = 0.2$, la stima sui cinque campioni mostra cinque aghi isolati. Come si chiama questo comportamento?`,
    options: [
      md`Stima troppo variabile che insegue i campioni (*overfitting*)`,
      md`*Oversmoothing*: i dettagli della distribuzione si perdono`,
      md`Stima distorta per effetto della convoluzione con un kernel largo`,
      md`Stima non legittima perché l'area supera 1`,
    ],
    answer: 0,
    explanation: md`Con $h$ troppo piccolo ogni campione diventa un picco stretto e tra i picchi la densità è quasi nulla: la stima cattura i campioni specifici e il rumore, non la distribuzione (note p39). L'*oversmoothing* è il caso opposto, il pannello $h = 1$.`,
    difficulty: 1,
    concepts: ['c29', 'c28', 'c32'],
  },
  // --- Galleria dei kernel (c37, c39) -------------------------------------------------------------------------------
  {
    id: 'chk-10',
    type: 'mcq',
    q: md`Stimi la densità degli importi di una carta di credito e vuoi dare un po' di densità anche agli importi estremi. Quale kernel delle slide ha le code più pesanti?`,
    options: [md`Cauchy, $\gamma(x) = \frac{1}{\pi}\cdot\frac{1}{1+x^2}$`, md`Gaussiano`, md`Esponenziale`, md`Triangolare`],
    answer: 0,
    explanation: md`Il Cauchy decade come $1/x^2$, più lentamente dell'esponenziale e del gaussiano; il triangolare ha supporto limitato. Le note: dà ai punti lontani un peso relativamente maggiore, utile con *outlier* e code pesanti.`,
    difficulty: 1,
    concepts: ['c37', 'c39'],
  },
  // --- Bias (c41, c44) ---------------------------------------------------------------------------------------------------
  {
    id: 'chk-11',
    type: 'tf',
    q: md`Con la larghezza $h$ fissa, raccogliere molti più campioni elimina il bias della stima di Parzen.`,
    answer: false,
    explanation: md`$E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$ non dipende da $N$: a $h$ fisso la media resta la versione sfocata di $p$. Più campioni riducono solo la varianza, quindi la stima si stabilizza attorno alla cosa sbagliata. Il bias sparisce solo con $h_N \to 0$.`,
    difficulty: 2,
    concepts: ['c41', 'c44', 'c45'],
  },
  // --- Bound sulla varianza (c47, c48) ----------------------------------------------------------------------------------
  {
    id: 'chk-12',
    type: 'numeric',
    q: md`Kernel con $\sup(\gamma) = 0.4$, $n = 1$, $N = 100$, $h_N = 0.5$ e media della stima nel punto $\bar{\hat{p}}(x) = 0.25$. Quanto vale il bound sulla varianza di slide p61?`,
    answer: 0.002,
    tolerance: 0.0002,
    explanation: md`$\frac{\sup(\gamma)\,\bar{\hat{p}}(x)}{N h_N^n} = \frac{0.4 \cdot 0.25}{100 \cdot 0.5} = \frac{0.1}{50} = 0.002$, cioè una deviazione standard al più $\approx 0.045$. Con $N = 400$ il bound si divide per 4.`,
    difficulty: 2,
    concepts: ['c47', 'c48'],
  },
  // --- Consistenza (c49, c50, c53) ---------------------------------------------------------------------------------------
  {
    id: 'chk-13',
    type: 'multi',
    q: md`In 1-D ($n = 1$), quali leggi per la larghezza danno una stima di Parzen consistente?`,
    options: [md`$h_N = N^{-1/2}$`, md`$h_N = N^{-1}$`, md`$h_N = N^{-1/4}$`, md`$h_N = 0.3$ costante`, md`$h_N = N^{-2}$`],
    answers: [0, 2],
    explanation: md`Servono $h_N \to 0$ e $N h_N \to +\infty$, cioè $h_N = N^{-a}$ con $0 < a < 1/n = 1$. $N^{-1/2}$ dà $N h_N = \sqrt{N}$ e $N^{-1/4}$ dà $N^{3/4}$: entrambe valide. $N^{-1}$ dà $N h_N = 1$ costante e $N^{-2}$ dà $1/N \to 0$ (varianza che non si spegne); $h$ costante non toglie il bias.`,
    difficulty: 2,
    concepts: ['c49', 'c50', 'c51', 'c53'],
  },
  // --- La legge della slide 2-D (c56) ------------------------------------------------------------------------------------------
  {
    id: 'chk-14',
    type: 'tf',
    q: md`Con $n = 2$, la legge $h_N = h_1/N$ scritta sulle colonne della slide p64 soddisfa la condizione $N h_N^n \to +\infty$.`,
    answer: false,
    explanation: md`$N h_N^2 = N \cdot h_1^2/N^2 = h_1^2/N \to 0$: la condizione è violata. Anche $h_1/\sqrt{N}$ darebbe $N h_N^2 = h_1^2$ costante. Una legge 2-D consistente è $h_N = h_1/\sqrt[4]{N}$, con $N h_N^2 = h_1^2\sqrt{N}$.`,
    difficulty: 3,
    concepts: ['c56', 'c57'],
  },
  // --- Normalizzazione (c60) ----------------------------------------------------------------------------------------------------
  {
    id: 'chk-15',
    type: 'mcq',
    q: md`Perché, con il kernel gaussiano a simmetria sferica di Specht, devi normalizzare le feature prima della stima?`,
    options: [
      md`Perché $\sigma$ è la stessa lungo tutte le feature, e senza normalizzazione la feature con la scala più grande domina la distanza $\Vert \mathbf{x} - \mathbf{x}_k \Vert$`,
      md`Perché altrimenti la stima non integra a 1`,
      md`Perché il kernel sferico funziona solo con feature comprese tra 0 e 1`,
      md`Perché la normalizzazione riduce il numero di campioni necessari`,
    ],
    answer: 0,
    explanation: md`Slide p65: «Since σ is the same along all features, it is important to normalize them». Il kernel sferico assume che un passo lungo una feature valga quanto un passo lungo l'altra. La stima integra a 1 anche senza normalizzare.`,
    difficulty: 1,
    concepts: ['c60'],
  },
  // --- Sigma adattiva (c63) ----------------------------------------------------------------------------------------------------------
  {
    id: 'chk-16',
    type: 'numeric',
    q: md`Campioni 2-D: $A = (0, 0)$, $B = (1, 0)$, $C = (0, 3)$, $D = (4, 0)$, $E = (0, 5)$. Con $L = 2$, quanto vale la $\sigma_A$ adattiva della slide p66?`,
    answer: 2,
    tolerance: 0.01,
    explanation: md`Distanze da $A$, escluso $A$ stesso: $B = 1$, $C = 3$, $D = 4$, $E = 5$. I due vicini più prossimi sono $B$ e $C$: $\sigma_A = \frac{1}{L}\sum_{l=1}^{L} \Vert \mathbf{x}_A - \mathbf{y}_l \Vert = \frac{1 + 3}{2} = 2$.`,
    difficulty: 2,
    concepts: ['c62', 'c63'],
  },
  // --- Convergenza di Parzen e K-NN (c69) ------------------------------------------------------------------------------------------------
  {
    id: 'chk-17',
    type: 'mcq',
    q: md`Per Parzen, con $V_N = h_N^n$, la consistenza chiede $V_N \to 0$ e $N V_N \to +\infty$. Quale condizione del K-NN (slide p47) corrisponde a $N V_N \to +\infty$?`,
    options: [md`$K_N \to +\infty$`, md`$K_N/N \to 0$`, md`$h_N \to 0$`, md`$K_N = 1$`],
    answer: 0,
    explanation: md`Con $K \approx N V p(\mathbf{x}^*)$, chiedere che la finestra contenga sempre più campioni ($N V_N \to +\infty$) equivale a $K_N \to +\infty$: è la richiesta della legge dei grandi numeri, che spegne la varianza. $K_N/N \to 0$ corrisponde invece a $V_N \to 0$, la regione che si restringe e spegne il bias.`,
    difficulty: 3,
    concepts: ['c69', 'c70'],
  },
]
