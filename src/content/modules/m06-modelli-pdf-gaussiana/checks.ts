// Quiz dentro il testo del foglio m06 (modelli di pdf e modello gaussiano): ognuno ha il suo <Check id="chk-NN" />
// in index.mdx, nel punto in cui il concetto è appena stato spiegato. L'integratore li unisce a data.quiz (il validatore
// risolve <Check id> su data.quiz). I conti numerici sono rifatti a mano; i dati sono diversi da quelli degli esercizi
// (es01 picco gaussiano, es04 Σ = [[2,1],[1,2]], es03 quattro campioni 2-D, es16 σ² = 4 e N = 5), così il quiz
// non suggerisce le soluzioni.
import { md } from '../../types'
import type { QuizItem } from '../../types'

export const checks: QuizItem[] = [
  // --- Proprietà asintotiche della stima ML (c01) --------------------------------------------------------
  {
    id: 'chk-01',
    type: 'mcq',
    q: md`Quale proprietà asintotica della stima ML esprime la condizione $\lim_{N\to+\infty} var\{\varepsilon_i\}/[I^{-1}(\boldsymbol{\theta})]_{ii} = 1$?`,
    options: [
      md`L'efficienza asintotica`,
      md`La non distorsione asintotica`,
      md`La consistenza`,
      md`Nessuna: è la definizione di stimatore non distorto`,
    ],
    answer: 0,
    explanation: md`Il denominatore è il bound di Cramér-Rao: il rapporto che tende a 1 dice che la varianza dello stimatore raggiunge il minimo possibile quando $N$ cresce, cioè l'efficienza asintotica. La non distorsione asintotica riguarda $E\{\boldsymbol{\varepsilon}\} \to 0$, la consistenza $P\{\Vert\boldsymbol{\varepsilon}\Vert < \delta\} \to 1$.`,
    difficulty: 2,
    concepts: ['c01'],
  },
  // --- Selezione del modello statistico (c02-c05) --------------------------------------------------------
  {
    id: 'chk-02',
    type: 'multi',
    q: md`Quali sono i tre aspetti che la slide 20 chiede di considerare nella scelta del modello statistico per $p(\mathbf{x})$?`,
    options: [
      md`La natura statistica intrinseca del fenomeno fisico analizzato`,
      md`Il rumore introdotto nelle fasi di trasmissione e acquisizione dal mezzo di propagazione e dal sensore`,
      md`I passi di pre-processing e di estrazione delle feature prima del sistema di riconoscimento`,
      md`Il numero di campioni di training disponibili`,
      md`Il costo computazionale dello stimatore ML`,
    ],
    answers: [0, 1, 2],
    explanation: md`La slide elenca fenomeno, rumore (mezzo di propagazione e sensore, «respectively») e pre-processing con estrazione delle feature. Il numero di campioni decide quanto è buona la stima dei parametri, non quale forma dare a $p(\mathbf{x})$; il costo computazionale non compare.`,
    difficulty: 1,
    concepts: ['c02', 'c03', 'c04', 'c05'],
  },
  // --- Gaussiana univariata (c08, c09) ------------------------------------------------------------------
  {
    id: 'chk-03',
    type: 'numeric',
    q: md`Una gaussiana 1-D ha $\mu = 3$ e $\sigma^2 = 0.1$. Quanto vale la pdf nel picco?`,
    answer: 1.2616,
    tolerance: 0.005,
    explanation: md`Il picco è in $x = \mu$ e vale $1/(\sigma\sqrt{2\pi})$, con $\sigma = \sqrt{0.1} = 0.316$: $1/(0.316 \cdot 2.507) = 1.262$. La media non conta. Il valore supera 1: una densità può farlo, perché è l'area sotto la curva a essere 1, non l'altezza.`,
    difficulty: 1,
    concepts: ['c08', 'c09'],
  },
  // --- Gaussiana generalizzata (c10, c11, c12) ---------------------------------------------------------------
  {
    id: 'chk-04',
    type: 'mcq',
    q: md`Nella gaussiana generalizzata $f(x;m,b,\beta)$ poni $\beta = 1$. Che pdf ottieni?`,
    options: [
      md`La laplaciana $\frac{b}{2}\,e^{-b\vert x-m\vert}$, con una cuspide in $x = m$`,
      md`La gaussiana con $\sigma = 1/(b\sqrt{2})$`,
      md`L'uniforme su $[m - 1/b,\ m + 1/b]$`,
      md`La Rayleigh con parametro $b$`,
    ],
    answer: 0,
    explanation: md`Con $\beta = 1$ e $\Gamma(1) = 1$ la costante diventa $b/2$ e l'esponente $-b\vert x - m\vert$: è la doppia esponenziale. La gaussiana corrisponde a $\beta = 2$, l'uniforme al limite $\beta \to \infty$.`,
    difficulty: 1,
    concepts: ['c10', 'c11', 'c12'],
  },
  // --- Chi-quadro e Gamma (c13, c17, c18) --------------------------------------------------------------------
  {
    id: 'chk-05',
    type: 'tf',
    q: md`Il chi-quadro con $k = 2$ gradi di libertà coincide con la Gamma di forma 1 e scala $\theta = 2$, cioè con l'esponenziale di media 2.`,
    answer: true,
    explanation: md`Con $k = 2$ la formula della slide 24 dà $\frac{1/2}{\Gamma(1)}x^{0}e^{-x/2} = \frac{1}{2}e^{-x/2}$; la Gamma con forma 1 e scala 2 dà $e^{-x/2}/2$. In generale il chi-quadro è una Gamma con forma $k/2$ e scala 2: nel grafico la curva blu $k = 2$ è la rossa della Gamma.`,
    difficulty: 2,
    concepts: ['c13', 'c17', 'c18'],
  },
  // --- Log-normale (c19, c20) -----------------------------------------------------------------------------
  {
    id: 'chk-06',
    type: 'mcq',
    q: md`Una variabile log-normale ha $\mu = 0$ e $\sigma = 1$. Quanto vale la sua mediana?`,
    options: [md`$1$`, md`$e^{-1} = 0.368$`, md`$e^{1/2} = 1.649$`, md`$0$`],
    answer: 0,
    explanation: md`$\ln x$ è gaussiana con media 0, quindi la sua mediana è 0 e quella di $x$ è $e^0 = 1$ (il logaritmo è monotono e conserva le mediane). $e^{-1}$ è la moda $e^{\mu-\sigma^2}$, $e^{1/2}$ la media $e^{\mu+\sigma^2/2}$: $\mu$ e $\sigma$ sono parametri di $\ln x$, non di $x$.`,
    difficulty: 2,
    concepts: ['c19', 'c20'],
  },
  // --- Confronto tra i sei modelli (c06, c21) ----------------------------------------------------------------
  {
    id: 'chk-07',
    type: 'multi',
    q: md`Quali famiglie delle slide 22-24 assegnano densità nulla a ogni valore negativo?`,
    options: [md`Gaussiana`, md`Gaussiana generalizzata`, md`Gamma`, md`Rayleigh`, md`Chi-quadro`, md`Log-normale`],
    answers: [2, 3, 4, 5],
    explanation: md`Gamma e log-normale vivono su $x > 0$, Rayleigh e chi-quadro su $x \ge 0$: quattro famiglie su sei, tutte asimmetriche con la coda a destra. Gaussiana e gaussiana generalizzata sono definite su tutto l'asse reale e simmetriche.`,
    difficulty: 1,
    concepts: ['c06', 'c21'],
  },
  // --- Limite centrale (c23, c24) -------------------------------------------------------------------------
  {
    id: 'chk-08',
    type: 'tf',
    q: md`Il teorema del limite centrale richiede che le singole variabili sommate siano gaussiane.`,
    answer: false,
    explanation: md`L'enunciato chiede molte variabili, iid e con varianza finita: la loro forma può essere qualunque (uniforme, esponenziale, discreta). Dodici uniformi tra 0 e 1, sommate e centrate, danno già una curva quasi gaussiana. Con varianza infinita (Cauchy) il teorema non vale.`,
    difficulty: 1,
    concepts: ['c23', 'c24', 'c25'],
  },
  // --- Distanza di Mahalanobis (c29) -----------------------------------------------------------------------
  {
    id: 'chk-09',
    type: 'mcq',
    q: md`Se $\Sigma = I$, a che cosa si riduce la forma quadratica $(\mathbf{x}-\mathbf{m})^t\Sigma^{-1}(\mathbf{x}-\mathbf{m})$ all'esponente della gaussiana?`,
    options: [
      md`Al quadrato della distanza euclidea tra $\mathbf{x}$ e $\mathbf{m}$`,
      md`Alla distanza euclidea tra $\mathbf{x}$ e $\mathbf{m}$, senza quadrato`,
      md`Al prodotto scalare $\mathbf{x}^t\mathbf{m}$`,
      md`A una costante che non dipende da $\mathbf{x}$`,
    ],
    answer: 0,
    explanation: md`Con $\Sigma^{-1} = I$ resta $(\mathbf{x}-\mathbf{m})^t(\mathbf{x}-\mathbf{m}) = \Vert\mathbf{x}-\mathbf{m}\Vert^2$. In generale la forma quadratica è il quadrato della distanza di Mahalanobis: le note la chiamano distanza, ma la distanza è la sua radice.`,
    difficulty: 1,
    concepts: ['c29', 'c27'],
  },
  // --- Numero di parametri (c33) ---------------------------------------------------------------------------
  {
    id: 'chk-10',
    type: 'numeric',
    q: md`Quanti parametri liberi ha una gaussiana multivariata con $n = 10$ feature?`,
    answer: 65,
    tolerance: 0.5,
    explanation: md`$n = 10$ per il vettore media e $n(n+1)/2 = 55$ per la covarianza, che è simmetrica: $10 + 55 = 65$. Con $n = 100$ sarebbero 5150: il conteggio cresce con il quadrato di $n$.`,
    difficulty: 1,
    concepts: ['c33', 'c38'],
  },
  // --- Correlazione e determinante in 2-D (c69, c32) -----------------------------------------------------------
  {
    id: 'chk-11',
    type: 'numeric',
    q: md`Due feature con $\sigma_1 = 3$, $\sigma_2 = 2$ e coefficiente di correlazione $\rho = 0.5$. Quanto vale $\vert\Sigma\vert$?`,
    answer: 27,
    tolerance: 0.01,
    explanation: md`$\vert\Sigma\vert = \sigma_1^2\sigma_2^2(1-\rho^2) = 9 \cdot 4 \cdot 0.75 = 27$. Equivalente: $\sigma_{12} = \rho\sigma_1\sigma_2 = 3$ e $\vert\Sigma\vert = 36 - 9 = 27$. Con $\vert\rho\vert = 1$ il determinante si annullerebbe e la pdf non sarebbe definita.`,
    difficulty: 2,
    concepts: ['c69', 'c32', 'c37'],
  },
  // --- Semidefinitezza positiva (c39, c50) --------------------------------------------------------------------
  {
    id: 'chk-12',
    type: 'tf',
    q: md`La matrice $\begin{bmatrix} 1 & 2 \\ 2 & 1 \end{bmatrix}$ può essere la matrice di covarianza di due feature.`,
    answer: false,
    explanation: md`È simmetrica ma non semidefinita positiva: con $\mathbf{a} = (1, -1)$ la varianza della proiezione sarebbe $\mathbf{a}^t\Sigma\,\mathbf{a} = 1 - 4 + 1 = -2 < 0$. I suoi autovalori sono 3 e $-1$. In 2-D lo vedi anche dal coefficiente di correlazione: $\rho = 2/(1 \cdot 1) = 2$, fuori da $[-1, 1]$.`,
    difficulty: 2,
    concepts: ['c39', 'c50', 'c38'],
  },
  // --- Indipendenza e covarianza nulla (c40, c41, c71) -----------------------------------------------------------
  {
    id: 'chk-13',
    type: 'multi',
    q: md`Quali affermazioni sono vere?`,
    options: [
      md`Se due feature sono indipendenti, la loro covarianza è nulla, qualunque sia la distribuzione`,
      md`Se due feature hanno covarianza nulla, sono indipendenti, qualunque sia la distribuzione`,
      md`Per un vettore gaussiano con $\Sigma$ diagonale vale $p(\mathbf{x}) = p(x_1)\,p(x_2)\dots p(x_n)$`,
      md`Con $x \sim N(0,1)$ e $y = x^2$ la covarianza tra $x$ e $y$ è nulla`,
    ],
    answers: [0, 2, 3],
    explanation: md`L'indipendenza annulla sempre la covarianza, perché $E\{(x_i-m_i)(x_j-m_j)\} = E\{x_i-m_i\}E\{x_j-m_j\} = 0$. Il viceversa vale solo per vettori congiuntamente gaussiani, dove $\Sigma$ diagonale fattorizza la pdf. Il controesempio è proprio $y = x^2$: covarianza $E\{x^3\} = 0$, ma $y$ dipende da $x$.`,
    difficulty: 2,
    concepts: ['c40', 'c41', 'c71'],
  },
  // --- Autovalori e lunghezza degli assi (c44, c46) ---------------------------------------------------------------
  {
    id: 'chk-14',
    type: 'numeric',
    q: md`Con $\Sigma = \begin{bmatrix} 5 & 4 \\ 4 & 5 \end{bmatrix}$, quanto misura il semiasse maggiore dell'ellisse di livello a distanza di Mahalanobis $r = 1$?`,
    answer: 3,
    tolerance: 0.01,
    explanation: md`Equazione caratteristica: $(5-\lambda)^2 - 16 = \lambda^2 - 10\lambda + 9 = 0$, quindi $\lambda_1 = 9$ e $\lambda_2 = 1$. Il semiasse lungo $\mathbf{e}_1 = (1,1)/\sqrt{2}$ vale $r\sqrt{\lambda_1} = 3$, l'altro $1$: le lunghezze vanno con la radice degli autovalori.`,
    difficulty: 2,
    concepts: ['c44', 'c45', 'c46'],
  },
  // --- La figura della slide 28 (c43, c47) -------------------------------------------------------------------------
  {
    id: 'chk-15',
    type: 'mcq',
    q: md`Nella vista dall'alto della slide 28 compaiono le etichette $z = 3$, $z = 2$, $z = 0.5$ e $z = 0.01$. Che cosa indica $z = 3$?`,
    options: [
      md`Il punto centrale $\mathbf{m}$, dove la campana raggiunge la quota massima`,
      md`L'ellisse più interna`,
      md`L'ellisse più esterna`,
      md`La lunghezza dell'asse $\mathbf{e}_1$`,
    ],
    answer: 0,
    explanation: md`Le ellissi disegnate sono tre ($z = 2$, $0.5$, $0.01$ dall'interno all'esterno). $z = 3$ etichetta il punto nero: alla quota del picco la distanza di Mahalanobis è $r = 0$ e l'isolivello degenera nella media. Quote più basse danno ellissi più grandi.`,
    difficulty: 1,
    concepts: ['c47', 'c43'],
  },
  // --- Esempio 3-D (c54, c55) ---------------------------------------------------------------------------------------
  {
    id: 'chk-16',
    type: 'mcq',
    q: md`In una gaussiana 3-D hai $\sigma_{13} = 0$, mentre $\sigma_{12}$ e $\sigma_{23}$ sono diverse da zero. Che cosa puoi concludere?`,
    options: [
      md`$x_1$ e $x_3$ sono indipendenti (marginalmente)`,
      md`$x_1$ e $x_3$ sono indipendenti anche quando conosci $x_2$`,
      md`L'elemento $(1, 3)$ di $\Sigma^{-1}$ è nullo`,
      md`Tutte e tre le feature sono indipendenti`,
    ],
    answer: 0,
    explanation: md`La coppia $(x_1, x_3)$ è gaussiana con covarianza diagonale, quindi si fattorizza: è la nota della slide 30. L'indipendenza condizionata dato $x_2$ richiederebbe $[\Sigma^{-1}]_{13} = 0$, che in generale non vale: con varianze 1, $\sigma_{12} = 0.6$ e $\sigma_{23} = 0.5$ si ha $[\Sigma^{-1}]_{13} = 0.77$.`,
    difficulty: 3,
    concepts: ['c54', 'c55'],
  },
  // --- Stima ML 1-D (c57, c58, c70) --------------------------------------------------------------------------------
  {
    id: 'chk-17',
    type: 'numeric',
    q: md`Tre misure di luminosità: $2,\ 4,\ 9$. Quanto vale la stima ML della varianza, $\hat{\sigma}^2$?`,
    answer: 8.6667,
    tolerance: 0.01,
    explanation: md`$\hat{m} = 15/3 = 5$; scarti $-3, -1, 4$; quadrati $9, 1, 16$, somma 26. La stima ML divide per $N$: $26/3 = 8.667$. Con la media dei quadrati: $(4 + 16 + 81)/3 - 25 = 33.667 - 25 = 8.667$. Lo stimatore corretto dividerebbe per $N - 1$: $s^2 = 13$.`,
    difficulty: 1,
    concepts: ['c70', 'c57', 'c58'],
  },
  // --- Proprietà delle stime (c60, c61, c62) -------------------------------------------------------------------------
  {
    id: 'chk-18',
    type: 'mcq',
    q: md`Quale delle stime ML della slide 31 è efficiente per ogni $N$, non solo al limite $N \to +\infty$?`,
    options: [
      md`La media campionaria $\hat{\mathbf{m}}$`,
      md`La covarianza $\hat{\Sigma}$ con fattore $1/N$`,
      md`Entrambe`,
      md`Nessuna delle due`,
    ],
    answer: 0,
    explanation: md`$\hat{\mathbf{m}}$ è non distorta e ha covarianza $\Sigma/N$, pari al bound di Cramér-Rao $I^{-1}(\mathbf{m}) = \Sigma/N$: è efficiente per ogni $N$. $\hat{\Sigma}$ è distorta, $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$, quindi le proprietà della slide («asymptotically unbiased and efficient, and consistent») per lei valgono solo asintoticamente.`,
    difficulty: 2,
    concepts: ['c60', 'c61', 'c62'],
  },
  // --- Stimatore non distorto (c63, c64) ---------------------------------------------------------------------------------
  {
    id: 'chk-19',
    type: 'numeric',
    q: md`Con $N = 4$ letture la stima ML della varianza di un sensore vale $6$. Quanto vale lo stimatore non distorto elementare con $1/(N-1)$?`,
    answer: 8,
    tolerance: 0.01,
    explanation: md`Moltiplichi per il fattore di correzione $N/(N-1) = 4/3$: $6 \cdot 4/3 = 8$. La stima ML, con $1/N$, sottostima in media la varianza di un fattore $(N-1)/N = 0.75$.`,
    difficulty: 1,
    concepts: ['c63', 'c64', 'c62'],
  },
  // --- Stima bayesiana (c65, c66, c67, c68) ------------------------------------------------------------------------------
  {
    id: 'chk-20',
    type: 'mcq',
    q: md`Nella stima bayesiana, come introdotta a pagina 26 delle note, il vettore dei parametri $\boldsymbol{\theta}$ è:`,
    options: [
      md`Una variabile aleatoria, con una prior che i dati di training aggiornano in una posterior`,
      md`Una quantità fissa ma incognita, da trovare massimizzando la verosimiglianza`,
      md`Noto con precisione prima di osservare i dati`,
      md`La forma funzionale di $p(\mathbf{x}\vert\boldsymbol{\theta})$`,
    ],
    answer: 0,
    explanation: md`È la differenza concettuale con la ML, dove $\boldsymbol{\theta}$ è «fixed but unknown». In entrambi gli approcci la forma di $p(\mathbf{x}\vert\boldsymbol{\theta})$ è assunta nota (*Known Density Form*): cambia il trattamento di $\boldsymbol{\theta}$, non il modello.`,
    difficulty: 1,
    concepts: ['c65', 'c66', 'c67', 'c68'],
  },
]
