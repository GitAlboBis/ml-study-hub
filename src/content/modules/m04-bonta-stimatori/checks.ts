// Quiz dentro il testo del foglio m04 (bontà di uno stimatore, bound di Cramér-Rao, proprietà asintotiche):
// ognuno ha il suo <Check id="chk-NN" /> in index.mdx, nel punto in cui il concetto è appena stato spiegato.
// L'integratore li unisce a data.quiz (il validatore risolve <Check id> su data.quiz). I conti numerici sono
// rifatti a mano e usano dati diversi da quelli degli esempi svolti, così il quiz non ripete la soluzione.
import { md } from '../../types'
import type { QuizItem } from '../../types'

export const checks: QuizItem[] = [
  // --- Likelihood come prodotto (c02, c03) -------------------------------------------------------------
  {
    id: 'chk-01',
    type: 'mcq',
    q: md`Un tecnico registra due volte la stessa lettura di un sensore e la inserisce nel training set come due campioni distinti. Se scrivi la likelihood come prodotto $\prod_k p(x_k|\theta)$, che cosa succede?`,
    options: [
      md`Il prodotto conta due volte la stessa informazione: il picco della likelihood si stringe come se avessi più dati e sottovaluti l'incertezza della stima`,
      md`Nulla: il prodotto vale per qualunque training set, indipendente o no`,
      md`La likelihood diventa una densità di probabilità su $\theta$`,
      md`La stima ML non esiste più, perché la likelihood ha due massimi`,
    ],
    answer: 0,
    explanation: md`Il prodotto è la densità congiunta solo se i campioni sono indipendenti: è l'indipendenza a far cadere i condizionamenti nella regola del prodotto. Una copia della stessa misura non porta informazione nuova, ma il prodotto la conta come un campione in più: $p(x_1|\theta)^2 \neq p(x_1, x_2|\theta)$.`,
    difficulty: 2,
    concepts: ['c02', 'c03'],
  },
  // --- MLE e stima bayesiana (c06, c07, c08, c09) ------------------------------------------------------
  {
    id: 'chk-02',
    type: 'mcq',
    q: md`Quale frase descrive la differenza sulla **natura dei parametri** tra MLE e stima bayesiana?`,
    options: [
      md`Nella MLE $\boldsymbol{\theta}$ è una costante fissa ma ignota; nella BE è una variabile aleatoria con una prior nota, che i dati aggiornano in una posterior`,
      md`Nella MLE $\boldsymbol{\theta}$ è una variabile aleatoria; nella BE è una costante`,
      md`In entrambe $\boldsymbol{\theta}$ è aleatorio, ma solo la BE usa la likelihood`,
      md`In entrambe $\boldsymbol{\theta}$ è costante; la BE si limita a usare più dati`,
    ],
    answer: 0,
    explanation: md`Le note: nella MLE $\boldsymbol{\theta}$ è «a constant that we aim to estimate» e si massimizza la likelihood usando solo i dati; nella BE $\boldsymbol{\theta}$ è «a random variable», con una prior che il teorema di Bayes trasforma in una densità a posteriori. Anche la BE usa la likelihood, per aggiornare la prior.`,
    difficulty: 1,
    concepts: ['c06', 'c07', 'c08', 'c09'],
  },
  // --- La stima è aleatoria; rispetto a che cosa si media (c11, c68) -----------------------------------
  {
    id: 'chk-03',
    type: 'mcq',
    q: md`Nella definizione di bias, $E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}$, rispetto a che cosa si calcola il valore atteso?`,
    options: [
      md`Rispetto a tutti i possibili training set di $N$ campioni iid, pesati con $p(\mathbf{X}|\boldsymbol{\theta})$ calcolata nel $\boldsymbol{\theta}$ vero`,
      md`Rispetto ai campioni del training set che hai in mano, facendone la media aritmetica`,
      md`Rispetto a una distribuzione a priori su $\boldsymbol{\theta}$`,
      md`Rispetto a $N$, facendo crescere il numero di campioni`,
    ],
    answer: 0,
    explanation: md`La stima è funzione di $\mathbf{X}$ e $\mathbf{X}$ è aleatorio: $E\{\hat{\boldsymbol{\theta}}\} = \int \hat{\boldsymbol{\theta}}(\mathbf{X})\, p(\mathbf{X}|\boldsymbol{\theta})\, d\mathbf{X}$. Per questo bias e varianza sono funzioni di $\boldsymbol{\theta}$ e di $N$, non del training set osservato. La prior appartiene alla visione bayesiana; il limite su $N$ entra solo nelle proprietà asintotiche.`,
    difficulty: 2,
    concepts: ['c11', 'c68'],
  },
  // --- Errore di stima e omonimia (c12, c66) -----------------------------------------------------------
  {
    id: 'chk-04',
    type: 'tf',
    q: md`Nel Cap. 4, nella scomposizione dell'errore di generalizzazione in *approximation error* ed *estimation error*, il termine *estimation error* indica lo stesso vettore $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$ di questo foglio.`,
    answer: false,
    explanation: md`Qui *estimation error* è l'errore sui parametri di una pdf, un vettore aleatorio di $r$ componenti. Nel Cap. 4 è la parte del rischio di una macchina addestrata dovuta al training set finito, contrapposta all'errore di approssimazione dello spazio delle ipotesi. Le due nozioni nascono entrambe dai pochi campioni, ma sono oggetti diversi.`,
    difficulty: 1,
    concepts: ['c12', 'c66'],
  },
  // --- Bias e stima unbiased (c15, c16) -----------------------------------------------------------------
  {
    id: 'chk-05',
    type: 'numeric',
    q: md`Uno stimatore della luminosità media dei salmoni restringe la media campionaria verso zero: $\hat{m} = 0.9\,\bar{x}$. Con media vera $m = 6$, quanto vale il bias $E\{\varepsilon\}$?`,
    answer: -0.6,
    tolerance: 0.005,
    explanation: md`La media campionaria è unbiased, quindi $E\{\hat{m}\} = 0.9\, m = 5.4$ e $E\{\varepsilon\} = E\{\hat{m}\} - m = 5.4 - 6 = -0.6$. Il valore vero esce dal valore atteso perché è una costante. Lo stimatore è biased: $E\{\hat{m}\} \neq m$.`,
    difficulty: 1,
    concepts: ['c15', 'c16'],
  },
  // --- Varianza attorno alla media della stima (c17, c18) ----------------------------------------------
  {
    id: 'chk-06',
    type: 'tf',
    q: md`La varianza dell'errore della slide p13, $\operatorname{var}\{\varepsilon_i\}$, misura la dispersione della stima $\hat{\theta}_i$ attorno al valore vero $\theta_i$.`,
    answer: false,
    explanation: md`Nella formula compare $\bar{\hat{\theta}}_i$, la media della stima, non $\theta_i$: la varianza misura la dispersione attorno alla **propria** media, e $\operatorname{var}\{\varepsilon_i\} = \operatorname{var}\{\hat{\theta}_i\}$. La distanza della media dal vero è il bias. Le due cose coincidono solo per uno stimatore unbiased, quando la varianza diventa l'errore quadratico medio.`,
    difficulty: 2,
    concepts: ['c17', 'c18'],
  },
  // --- Errore quadratico medio (c13, c19) ---------------------------------------------------------------
  {
    id: 'chk-07',
    type: 'numeric',
    q: md`Uno stimatore ha bias $E\{\varepsilon\} = 0.3$ e varianza $\operatorname{var}\{\varepsilon\} = 0.16$. Quanto vale l'errore quadratico medio $E\{\varepsilon^2\}$?`,
    answer: 0.25,
    tolerance: 0.001,
    explanation: md`$E\{\varepsilon^2\} = \operatorname{var}\{\varepsilon\} + (E\{\varepsilon\})^2 = 0.16 + 0.09 = 0.25$. La scomposizione spiega perché la stima ideale chiede insieme bias nullo e varianza nulla: l'errore quadratico medio è zero solo se lo sono entrambi gli addendi.`,
    difficulty: 1,
    concepts: ['c13', 'c19'],
  },
  // --- Il bound vale solo per stimatori unbiased (c23, c30) -------------------------------------------
  {
    id: 'chk-08',
    type: 'mcq',
    q: md`Un collega mostra uno stimatore ridge della pendenza di una regressione con varianza **minore** del bound di Cramér-Rao $\sigma^2/S$. Che cosa concludi?`,
    options: [
      md`Nessuna contraddizione: la ridge è biased, e il bound limita solo la varianza degli stimatori unbiased`,
      md`Il calcolo è sbagliato: nessuno stimatore può scendere sotto il bound`,
      md`La ridge è efficiente, perché ha la varianza più piccola`,
      md`Il modello non è regolare, quindi il bound non vale per nessuno stimatore`,
    ],
    answer: 0,
    explanation: md`La ridge moltiplica la stima ai minimi quadrati per $S/(S+\lambda) < 1$: introduce un bias e riduce la varianza. Il bound della slide p14 riguarda gli stimatori unbiased («lower bound on the variance of an **unbiased** estimator»). Efficiente significa unbiased con varianza uguale al bound, quindi la ridge non lo è. Con pochi dati il suo errore quadratico medio può essere molto più basso: è uno dei motivi per cui nei problemi reali si usano stimatori biased.`,
    difficulty: 2,
    concepts: ['c23', 'c30'],
  },
  // --- Diagonale dell'inversa (c27) ---------------------------------------------------------------------
  {
    id: 'chk-09',
    type: 'numeric',
    q: md`La matrice di Fisher di due parametri è $\mathbf{I} = \begin{bmatrix} 4 & 2 \\ 2 & 2 \end{bmatrix}$. Quanto vale il bound di Cramér-Rao sul primo parametro, $[\mathbf{I}^{-1}]_{11}$?`,
    answer: 0.5,
    tolerance: 0.001,
    explanation: md`$\det \mathbf{I} = 4 \cdot 2 - 2^2 = 4$ e $[\mathbf{I}^{-1}]_{11} = [\mathbf{I}]_{22}/\det \mathbf{I} = 2/4 = 0.5$. L'inverso dell'elemento diagonale darebbe $1/4 = 0.25$: ignorare l'accoppiamento con il secondo parametro dimezzerebbe il bound. Vale sempre $[\mathbf{I}^{-1}]_{ii} \geq 1/[\mathbf{I}]_{ii}$, con uguaglianza solo se i termini fuori diagonale sono nulli.`,
    difficulty: 2,
    concepts: ['c26', 'c27'],
  },
  // --- Stimatore efficiente (c28) -----------------------------------------------------------------------
  {
    id: 'chk-10',
    type: 'tf',
    q: md`Uno stimatore si dice efficiente se ha la varianza più piccola tra tutti gli stimatori possibili, biased compresi.`,
    answer: false,
    explanation: md`Efficiente significa: unbiased e con varianza **uguale** al bound di Cramér-Rao, $\operatorname{var}\{\varepsilon_i\} = [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}$ per ogni $i$. È la varianza minima tra gli stimatori **unbiased**. Uno stimatore biased può stare più in basso: lo stimatore costante ha varianza zero.`,
    difficulty: 1,
    concepts: ['c28'],
  },
  // --- Bound per la media di una gaussiana (c22, c29) ---------------------------------------------------
  {
    id: 'chk-11',
    type: 'numeric',
    q: md`La luminosità dei salmoni è gaussiana con deviazione standard nota $\sigma = 3$. Stimi la media da $N = 36$ pesci. Quanto vale il bound di Cramér-Rao sulla varianza di uno stimatore unbiased della media?`,
    answer: 0.25,
    tolerance: 0.001,
    explanation: md`L'informazione di Fisher è $I(m) = N/\sigma^2 = 36/9 = 4$ e il bound è $1/I(m) = \sigma^2/N = 0.25$, cioè una deviazione standard minima di $0.5$. La media campionaria ha proprio varianza $\sigma^2/N$: è efficiente.`,
    difficulty: 1,
    concepts: ['c22', 'c24', 'c29'],
  },
  // --- Ipotesi del bound (c22, c69, c70) ----------------------------------------------------------------
  {
    id: 'chk-12',
    type: 'multi',
    q: md`Quali ipotesi servono perché valga la disuguaglianza di Cramér-Rao $\operatorname{var}\{\varepsilon_i\} \geq [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}$?`,
    options: [
      md`Lo stimatore è unbiased per ogni valore di $\boldsymbol{\theta}$`,
      md`Il supporto di $p(\mathbf{X}|\boldsymbol{\theta})$ non dipende da $\boldsymbol{\theta}$ e derivata e integrale si possono scambiare`,
      md`La matrice di Fisher è invertibile`,
      md`I campioni sono gaussiani`,
      md`Il numero di campioni tende a infinito`,
    ],
    answers: [0, 1, 2],
    explanation: md`La slide nomina solo «unbiased»; le condizioni di regolarità e l'invertibilità sono sottintese. Senza regolarità il bound cade: con letture uniformi su $[0, \theta]$ lo stimatore unbiased $\frac{N+1}{N}\max_k x_k$ ha varianza $\theta^2/(N(N+2))$, sotto il «bound» formale $\theta^2/N^2$. Il bound vale per qualunque modello regolare, non solo gaussiano, e per ogni $N$ finito.`,
    difficulty: 2,
    concepts: ['c22', 'c69', 'c70'],
  },
  // --- Covarianza ML e asintotica non polarizzazione (c34, c64) ----------------------------------------
  {
    id: 'chk-13',
    type: 'mcq',
    q: md`La slide ch2 p31 dà $E\{\hat{\Sigma}\} = \frac{N-1}{N}\,\Sigma$ per la stima ML della matrice di covarianza. Come classifichi questo stimatore?`,
    options: [
      md`Biased per ogni $N$ finito, ma asintoticamente unbiased`,
      md`Unbiased per ogni $N$`,
      md`Biased anche per $N \to +\infty$`,
      md`Unbiased solo per $N = 1$`,
    ],
    answer: 0,
    explanation: md`Il bias è $E\{\hat{\Sigma}\} - \Sigma = -\Sigma/N$: diverso da zero per ogni $N$ finito, tende a zero per $N \to +\infty$. È l'esempio del corso che separa *unbiased* da *asymptotically unbiased*. Lo stimatore unbiased elementare divide per $N - 1$. Con $N = 1$ la stima ML vale zero, il caso peggiore.`,
    difficulty: 1,
    concepts: ['c34', 'c64'],
  },
  // --- Efficienza asintotica (c35) ----------------------------------------------------------------------
  {
    id: 'chk-14',
    type: 'numeric',
    q: md`Uno stimatore unbiased della media di una gaussiana ha varianza $\sigma^2/N + \sigma^2/N^2$. Il bound è $\sigma^2/N$. Quanto vale il rapporto varianza/bound con $N = 50$?`,
    answer: 1.02,
    tolerance: 0.001,
    explanation: md`Il rapporto è $\frac{\sigma^2/N + \sigma^2/N^2}{\sigma^2/N} = 1 + \frac{1}{N} = 1.02$. Non vale 1 per nessun $N$ finito, quindi lo stimatore non è efficiente, ma tende a 1: è asintoticamente efficiente. Si usa il rapporto e non la differenza perché varianza e bound tendono entrambi a zero.`,
    difficulty: 2,
    concepts: ['c35'],
  },
  // --- Consistenza in numeri (c36, c37) -----------------------------------------------------------------
  {
    id: 'chk-15',
    type: 'numeric',
    q: md`Media campionaria di $N = 25$ campioni gaussiani con $\sigma = 1$. Quanto vale $P\{\vert \varepsilon \vert < 0.2\}$? Usa $\Phi(1) = 0.8413$.`,
    answer: 0.683,
    tolerance: 0.005,
    explanation: md`L'errore è gaussiano con deviazione standard $\sigma/\sqrt{N} = 0.2$, quindi $P\{\vert \varepsilon \vert < \delta\} = 2\Phi(\delta\sqrt{N}/\sigma) - 1 = 2\Phi(1) - 1 = 0.683$. Al crescere di $N$ l'argomento cresce e la probabilità tende a 1 per ogni $\delta > 0$: la media campionaria è consistente.`,
    difficulty: 2,
    concepts: ['c36', 'c37'],
  },
  // --- Quali stimatori sono consistenti (c38, c67) ------------------------------------------------------
  {
    id: 'chk-16',
    type: 'multi',
    q: md`Campioni iid gaussiani di media $m$ e varianza $\sigma^2$. Quali stimatori di $m$ sono consistenti? ($c \neq 0$ è una costante.)`,
    options: [
      md`La media campionaria $\bar{x}$`,
      md`Il primo campione $x_1$`,
      md`$\bar{x} + c$`,
      md`La mediana campionaria`,
      md`$\bar{x} + c/N$`,
    ],
    answers: [0, 3, 4],
    explanation: md`Bias e varianza che tendono a zero bastano. $\bar{x}$: bias 0, varianza $\sigma^2/N$. Mediana: unbiased, varianza circa $\pi\sigma^2/(2N) \to 0$ (consistente, ma non asintoticamente efficiente). $\bar{x} + c/N$: bias $c/N \to 0$, varianza $\sigma^2/N$. Invece $x_1$ ha varianza $\sigma^2$ costante (unbiased ma non consistente) e $\bar{x} + c$ converge a $m + c$ (varianza che tende a zero, bias che resta).`,
    difficulty: 2,
    concepts: ['c38', 'c67'],
  },
  // --- Log-likelihood (c43, c44) ------------------------------------------------------------------------
  {
    id: 'chk-17',
    type: 'tf',
    q: md`Massimizzare $\ln p(\mathbf{X}|\boldsymbol{\theta})$ dà la stessa stima che massimizzare $p(\mathbf{X}|\boldsymbol{\theta})$, perché il logaritmo è una funzione monotona crescente.`,
    answer: true,
    explanation: md`Il logaritmo conserva l'ordinamento dei valori, quindi il punto di massimo non cambia. In più, con campioni iid, trasforma il prodotto in una somma, $\sum_k \ln p(\mathbf{x}_k|\boldsymbol{\theta})$, che si deriva termine a termine e non soffre dei valori minuscoli del prodotto.`,
    difficulty: 1,
    concepts: ['c43', 'c44'],
  },
  // --- ML search con una sola osservazione (c42, c45) ---------------------------------------------------
  {
    id: 'chk-18',
    type: 'numeric',
    q: md`Una sola osservazione $x_0 = 2.4$, gaussiana con $\sigma = 1$ nota. Quanto vale la likelihood della curva centrata in $m = 1.4$, **relativa** a quella della curva centrata in $x_0$?`,
    answer: 0.607,
    tolerance: 0.005,
    explanation: md`La likelihood relativa è $\exp(-(x_0 - m)^2/(2\sigma^2)) = \exp(-0.5) = 0.607$. La curva centrata in $x_0$ ha likelihood relativa 1, la più alta: è la ML search della figura, con risultato $\hat{m} = x_0$.`,
    difficulty: 2,
    concepts: ['c42', 'c45'],
  },
  // --- Proprietà della ML (c46, c47, c48, c49, c50) ----------------------------------------------------
  {
    id: 'chk-19',
    type: 'mcq',
    q: md`Per il tasso $\lambda$ di tempi esponenziali uno stimatore efficiente non esiste, e la stima ML $\hat{\lambda} = N/\sum_k x_k$ è biased. Che cosa garantiscono le note sulla stima ML in questo caso?`,
    options: [
      md`È comunque asintoticamente unbiased, asintoticamente efficiente e consistente`,
      md`Nulla: senza stimatore efficiente la ML non ha buone proprietà`,
      md`È efficiente per ogni $N$, perché la ML raggiunge sempre il bound`,
      md`È unbiased per ogni $N$, ma non consistente`,
    ],
    answer: 0,
    explanation: md`Le note: «Even in cases where an efficient estimator does not exist, the ML estimate still demonstrates good asymptotic properties». Qui $E\{\hat{\lambda}\} = \frac{N}{N-1}\lambda \to \lambda$, il rapporto con il bound $\lambda^2/N$ vale $N^3/((N-1)^2(N-2)) \to 1$ e la varianza tende a zero. Il teorema su ML ed efficienza vale solo se lo stimatore efficiente esiste e la ML è unbiased: qui non si applica.`,
    difficulty: 2,
    concepts: ['c46', 'c47', 'c48', 'c49', 'c50'],
  },
  // --- Scelta del modello statistico (c52, c53, c54, c56, c60) ----------------------------------------
  {
    id: 'chk-20',
    type: 'mcq',
    q: md`Devi modellare l'ampiezza di un segnale radar diffuso da una superficie. Quale modello suggeriscono le note?`,
    options: [md`Rayleigh`, md`Chi-quadrato`, md`Gamma`, md`Gaussiano`],
    answer: 0,
    explanation: md`Le note: il modello di Rayleigh è «commonly applied in radar and communications for modeling scattered signals». La scelta segue i tre aspetti: la natura del fenomeno (ampiezze solo positive di un segnale diffuso), il rumore del mezzo e del sensore, il pre-processing. Il chi-quadrato serve nei test di ipotesi, il Gamma nella teoria delle code.`,
    difficulty: 1,
    concepts: ['c52', 'c53', 'c54', 'c56', 'c60'],
  },
]
