// Quiz dentro il testo del foglio m07 (stima bayesiana e confronto ML contro Bayes): ognuno ha il suo
// <Check id="chk-NN" /> in index.mdx, nel punto in cui il concetto è appena stato spiegato, e gli id seguono
// l'ordine di comparsa nel testo. L'integratore li unisce a data.quiz (il validatore risolve <Check id> su
// data.quiz). I conti numerici sono rifatti a mano e usano dati diversi da quelli degli esempi svolti.
import { md } from '../../types'
import type { QuizItem } from '../../types'

export const checks: QuizItem[] = [
  // --- Pagina di confine: bias della covarianza ML (c56, c57, c58) ---------------------------------------
  {
    id: 'chk-01',
    type: 'numeric',
    q: md`Stimi con ML la varianza di una gaussiana 1-D da $N = 5$ campioni indipendenti. La varianza vera è $\Sigma = 10$. Quanto vale, in media, la stima ML $E\{\hat{\Sigma}\}$?`,
    answer: 8,
    tolerance: 0.01,
    explanation: md`Le note danno $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma = \frac{4}{5} \cdot 10 = 8$: la stima ML sottostima perché misura gli scarti dalla media stimata $\hat{\mathbf{m}}$, più vicina ai campioni della media vera. Moltiplicando per $N/(N-1) = 5/4$, cioè dividendo per $N - 1$, ottieni lo stimatore non distorto elementare, che in media vale 10.`,
    difficulty: 1,
    concepts: ['c56', 'c57', 'c58'],
  },
  // --- Le due visioni del parametro (c01, c02, c03, c04) ------------------------------------------------
  {
    id: 'chk-02',
    type: 'mcq',
    q: md`Nella stima bayesiana, che cos'è il vettore dei parametri $\boldsymbol{\theta}$?`,
    options: [
      md`Una variabile aleatoria con una densità a priori $p(\boldsymbol{\theta})$, che i campioni di training convertono in una densità a posteriori $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$`,
      md`Una costante fissa ma ignota, stimata con il valore che massimizza la verosimiglianza`,
      md`La media campionaria dei dati di training`,
      md`Una variabile aleatoria la cui densità si stima senza alcuna ipotesi a priori`,
    ],
    answer: 0,
    explanation: md`È la frase di slide p32: in *Bayesian learning* $\boldsymbol{\theta}$ è una *random variable*, e i dati di training convertono la distribuzione su di essa in una *posterior probability density*. La seconda opzione è la visione ML (*to be fixed*). La quarta contraddice la seconda ipotesi di base: il prior è noto.`,
    difficulty: 1,
    concepts: ['c01', 'c02', 'c03', 'c04'],
  },
  // --- Le tre ipotesi di base (c05, c06, c07, c08) -----------------------------------------------------
  {
    id: 'chk-03',
    type: 'multi',
    q: md`Quali sono le ipotesi di base della stima bayesiana secondo la slide p33?`,
    options: [
      md`La forma della densità $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota, il valore di $\boldsymbol{\theta}$ no`,
      md`La conoscenza iniziale su $\boldsymbol{\theta}$ sta in una densità a priori $p(\boldsymbol{\theta})$ nota`,
      md`Il resto della conoscenza sta in $N$ campioni estratti indipendentemente secondo la densità ignota $p(\mathbf{x})$`,
      md`La densità $p(\mathbf{x})$ è nota e si stimano solo i parametri del prior`,
      md`Il valore vero di $\boldsymbol{\theta}$ è noto con esattezza`,
    ],
    answers: [0, 1, 2],
    explanation: md`Le tre ipotesi sono forma della densità nota (*Known Density Form*), conoscenza a priori in un prior noto (*Prior Knowledge*) e campioni indipendenti (*Independently Drawn Samples*). $p(\mathbf{x})$ resta ignota: è ciò che vuoi approssimare con $p(\mathbf{x}\,|\,\boldsymbol{X})$. Tutto presuppone che la densità si possa parametrizzare.`,
    difficulty: 1,
    concepts: ['c05', 'c06', 'c07', 'c08'],
  },
  // --- La posterior e l'obiettivo (c09, c10) -------------------------------------------------------------
  {
    id: 'chk-04',
    type: 'tf',
    q: md`L'obiettivo finale della stima bayesiana, secondo la slide p34, è la densità a posteriori $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$.`,
    answer: false,
    explanation: md`L'obiettivo è $p(\mathbf{x}\,|\,\boldsymbol{X})$, il più vicina possibile alla vera $p(\mathbf{x})$: la densità desiderata, o predittiva. La posterior, che speri piccata attorno al valore vero di $\boldsymbol{\theta}$, è il mezzo: la slide p35 dice che calcolarla è il problema di base.`,
    difficulty: 1,
    concepts: ['c09', 'c10'],
  },
  // --- I tre passaggi verso la formula chiave (c11, c12, c13, c14, c15) --------------------------------
  {
    id: 'chk-05',
    type: 'mcq',
    q: md`Nel terzo passaggio della slide p34 scrivi $p(\mathbf{x}\,|\,\boldsymbol{\theta}, \boldsymbol{X}) = p(\mathbf{x}\,|\,\boldsymbol{\theta})$. Perché puoi togliere $\boldsymbol{X}$?`,
    options: [
      md`Perché, noto $\boldsymbol{\theta}$, la distribuzione di $\mathbf{x}$ è completamente nota: i campioni non aggiungono informazione su $\mathbf{x}$`,
      md`Perché l'integrale su tutto lo spazio dei parametri elimina la dipendenza da $\boldsymbol{X}$`,
      md`Perché $\boldsymbol{X}$ e $\boldsymbol{\theta}$ sono indipendenti`,
      md`Per il teorema di Bayes applicato alla posterior`,
    ],
    answer: 0,
    explanation: md`È l'ipotesi 1: la forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota, quindi fissato $\boldsymbol{\theta}$ la nuova osservazione è indipendente dai campioni di training (indipendenza condizionata). $\boldsymbol{X}$ e $\boldsymbol{\theta}$ non sono indipendenti: proprio da $\boldsymbol{X}$ nasce la posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$, l'altro fattore della formula chiave.`,
    difficulty: 2,
    concepts: ['c11', 'c12', 'c13', 'c14', 'c15'],
  },
  // --- La formula chiave come media pesata (c16, c17) ---------------------------------------------------
  {
    id: 'chk-06',
    type: 'numeric',
    q: md`Caso discreto: $\boldsymbol{\theta}$ può valere solo $\boldsymbol{\theta}_1$ o $\boldsymbol{\theta}_2$, con probabilità a posteriori $0.7$ e $0.3$. In un punto $\mathbf{x}_0$ i due modelli valgono $p(\mathbf{x}_0\,|\,\boldsymbol{\theta}_1) = 0.2$ e $p(\mathbf{x}_0\,|\,\boldsymbol{\theta}_2) = 0.5$. Quanto vale $p(\mathbf{x}_0\,|\,\boldsymbol{X})$?`,
    answer: 0.29,
    tolerance: 0.001,
    explanation: md`La formula chiave diventa una media pesata dei modelli, con pesi uguali alla credibilità a posteriori: $0.7 \cdot 0.2 + 0.3 \cdot 0.5 = 0.14 + 0.15 = 0.29$. ML sceglierebbe un solo modello e risponderebbe $0.2$ oppure $0.5$.`,
    difficulty: 1,
    concepts: ['c16', 'c17'],
  },
  // --- La formula di Bayes e il denominatore (c18, c19, c20, c25) -------------------------------------
  {
    id: 'chk-07',
    type: 'mcq',
    q: md`Nella formula di Bayes della slide p35 il denominatore è $\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}$. Da che cosa dipende?`,
    options: [
      md`Solo dai campioni $\boldsymbol{X}$: per la posterior è una costante che garantisce area 1`,
      md`Da $\boldsymbol{\theta}$: per questo la posterior non è proporzionale a verosimiglianza per prior`,
      md`Dalla nuova osservazione $\mathbf{x}$`,
      md`Da nulla: vale sempre 1`,
    ],
    answer: 0,
    explanation: md`$\boldsymbol{\theta}$ viene integrato via, quindi il denominatore è $p(\boldsymbol{X})$, costante rispetto a $\boldsymbol{\theta}$ ma funzione dei dati. Nell'esempio gaussiano è l'inverso del fattore di normalizzazione $\alpha$, che per questo può assorbire termini con i dati ma senza $\mu$, come $\sum_k \mathbf{x}_k^2$.`,
    difficulty: 1,
    concepts: ['c18', 'c19', 'c20', 'c25'],
  },
  // --- Indipendenza e produttoria (c08, c21) ---------------------------------------------------------------
  {
    id: 'chk-08',
    type: 'tf',
    q: md`Puoi scrivere la verosimiglianza come produttoria, $p(\boldsymbol{X}\,|\,\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\,|\,\boldsymbol{\theta})$, perché gli $N$ campioni sono estratti indipendentemente.`,
    answer: true,
    explanation: md`È la seconda relazione della slide p35 (*From independence assumption*) e poggia sulla terza ipotesi di base. È la stessa fattorizzazione della stima ML: ML massimizza il prodotto, la stima bayesiana lo moltiplica per il prior e normalizza.`,
    difficulty: 1,
    concepts: ['c08', 'c21'],
  },
  // --- Le ipotesi dell'esempio gaussiano (c22, c23, c24) --------------------------------------------------
  {
    id: 'chk-09',
    type: 'mcq',
    q: md`Nell'esempio gaussiano univariato delle slide p36-39, che cosa è noto e che cosa è ignoto?`,
    options: [
      md`$\mu$ è ignota; $\sigma^2$ è nota; $\mu_0$ e $\sigma_0^2$ del prior sono noti a priori`,
      md`$\mu$ e $\sigma^2$ sono entrambe ignote; il prior è uniforme`,
      md`$\mu$ è nota; si stima $\sigma^2$ con un prior gaussiano`,
      md`$\mu_0$ e $\sigma_0^2$ sono ignoti e si stimano dai campioni`,
    ],
    answer: 0,
    explanation: md`In $\boldsymbol{\theta} = [\mu, \sigma^2]$ l'unico parametro ignoto è $\mu$, quindi $p(\mathbf{x}\,|\,\mu) \sim N(\mu, \sigma^2)$ con $\sigma^2$ fissa. Il prior $p(\mu) \sim N(\mu_0, \sigma_0^2)$ ha parametri noti a priori (*whose parameters are a priori known*): non si stimano dai dati.`,
    difficulty: 1,
    concepts: ['c22', 'c23', 'c24'],
  },
  // --- Perché la posterior è gaussiana (c26, c27) -----------------------------------------------------------
  {
    id: 'chk-10',
    type: 'mcq',
    q: md`Perché nell'esempio della slide p37 la posterior $p(\mu\,|\,\boldsymbol{X})$ è ancora una densità normale?`,
    options: [
      md`Perché il suo logaritmo è una somma di parabole in $\mu$, cioè una parabola con coefficiente di $\mu^2$ negativo, $-\frac{1}{2}(N/\sigma^2 + 1/\sigma_0^2)$`,
      md`Per il teorema del limite centrale, che vale per $N$ grande`,
      md`Perché il prior è uniforme e la posterior coincide con la verosimiglianza`,
      md`Perché $\alpha''$ vale $1/(\sqrt{2\pi}\sigma)$`,
    ],
    answer: 0,
    explanation: md`Il prodotto di gaussiane in $\mu$ è l'esponenziale di una somma di quadrati in $\mu$: sviluppando resta un polinomio di secondo grado, con coefficiente di $\mu^2$ negativo, e questa è una gaussiana per qualunque $N$, non solo per $N$ grande. È la risposta alla domanda di Passerini: il prior gaussiano è coniugato alla verosimiglianza gaussiana con varianza nota.`,
    difficulty: 2,
    concepts: ['c26', 'c27'],
  },
  // --- Media a posteriori (c28, c30, c31, c60) ---------------------------------------------------------------
  {
    id: 'chk-11',
    type: 'numeric',
    q: md`Varianza dei dati $\sigma^2 = 9$ nota, prior $N(\mu_0 = 3,\ \sigma_0^2 = 1)$, $N = 9$ campioni con media campionaria $\bar{X} = 5$. Quanto vale $\mu_N$?`,
    answer: 4,
    tolerance: 0.01,
    explanation: md`$N\sigma_0^2 = 9$ e $N\sigma_0^2 + \sigma^2 = 18$: il peso dei dati è $9/18 = 0.5$, quello del prior $9/18 = 0.5$. Quindi $\mu_N = 0.5 \cdot 5 + 0.5 \cdot 3 = 4$. Con i campioni virtuali: $n_0 = \sigma^2/\sigma_0^2 = 9 = N$, e la media a posteriori sta a metà strada tra $\mu_0$ e $\bar{X}$.`,
    difficulty: 2,
    concepts: ['c28', 'c30', 'c31', 'c60'],
  },
  // --- Varianza a posteriori (c29) ----------------------------------------------------------------------------
  {
    id: 'chk-12',
    type: 'numeric',
    q: md`Varianza dei dati $\sigma^2 = 4$, varianza del prior $\sigma_0^2 = 1$, $N = 12$ campioni. Quanto vale la varianza a posteriori $\sigma_N^2$?`,
    answer: 0.25,
    tolerance: 0.001,
    explanation: md`$\sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2 + \sigma^2} = \frac{4}{12 + 4} = 0.25$. Con le precisioni: $1/\sigma_N^2 = 12/4 + 1/1 = 4$. Non ti serve alcun valore dei campioni: $\sigma_N^2$ dipende solo da $N$, $\sigma^2$ e $\sigma_0^2$.`,
    difficulty: 1,
    concepts: ['c29'],
  },
  // --- Casi limite in N (c32, c33, c34, c37) ---------------------------------------------------------------
  {
    id: 'chk-13',
    type: 'multi',
    q: md`Con $\sigma_0^2 > 0$, che cosa succede alla posterior dell'esempio gaussiano per $N \to \infty$?`,
    options: [
      md`$\mu_N$ tende alla media campionaria $\bar{X}$`,
      md`$\sigma_N^2$ tende a 0`,
      md`La posterior tende a una delta di Dirac`,
      md`$\mu_N$ tende alla media del prior $\mu_0$`,
      md`$\sigma_N^2$ tende a $\sigma_0^2$`,
    ],
    answers: [0, 1, 2],
    explanation: md`Il peso dei dati $N\sigma_0^2/(N\sigma_0^2 + \sigma^2)$ tende a 1 e quello del prior a 0: l'informazione dei dati domina il prior. $\sigma_N^2 \approx \sigma^2/N \to 0$, quindi la posterior diventa una delta centrata sulla media campionaria. $\mu_N = \mu_0$ e $\sigma_N^2 = \sigma_0^2$ valgono invece per $N = 0$.`,
    difficulty: 1,
    concepts: ['c32', 'c33', 'c34', 'c37'],
  },
  // --- Bayesian learning e la figura di slide p38 (c35, c36) ----------------------------------------------
  {
    id: 'chk-14',
    type: 'numeric',
    q: md`La figura di slide p38 è compatibile con $\sigma = 1$ e $\sigma_0 = 2$. Quanto è alto il picco della posterior per $N = 30$?`,
    answer: 2.19,
    tolerance: 0.02,
    explanation: md`$1/\sigma_N^2 = N/\sigma^2 + 1/\sigma_0^2 = 30 + 0.25 = 30.25$, quindi $\sigma_N = 0.1818$. Il picco di una gaussiana è $1/(\sqrt{2\pi}\sigma_N) = 0.3989/0.1818 = 2.19$, come nella figura. Più campioni, picco più alto e più stretto: è il Bayesian learning.`,
    difficulty: 2,
    concepts: ['c35', 'c36'],
  },
  // --- Casi limite nei parametri (c61) ----------------------------------------------------------------------
  {
    id: 'chk-15',
    type: 'tf',
    q: md`Con un prior dogmatico ($\sigma_0^2 \to 0$) i dati riescono comunque a portare $\mu_N$ verso $\bar{X}$ se $N$ è abbastanza grande.`,
    answer: false,
    explanation: md`Con $\sigma_0^2 = 0$ il peso dei dati $N\sigma_0^2/(N\sigma_0^2 + \sigma^2)$ vale 0 per ogni $N$: $\mu_N = \mu_0$ e $\sigma_N^2 = 0$, la posterior è una delta su $\mu_0$ fin dall'inizio. Per questo il limite $N \to \infty$ e l'equivalenza asintotica con ML richiedono $\sigma_0^2 > 0$.`,
    difficulty: 2,
    concepts: ['c61', 'c33'],
  },
  // --- Densità predittiva (c38, c39, c40, c41, c42) --------------------------------------------------------
  {
    id: 'chk-16',
    type: 'numeric',
    q: md`Dati con $\sigma = 2$ nota ($\sigma^2 = 4$), prior con $\sigma_0^2 = 4$, $N = 4$ campioni. Quanto vale la deviazione standard della densità predittiva $p(x\,|\,\boldsymbol{X})$?`,
    answer: 2.191,
    tolerance: 0.01,
    explanation: md`Prima la varianza a posteriori: $\sigma_N^2 = \frac{4 \cdot 4}{4 \cdot 4 + 4} = 0.8$. La predittiva è $N(\mu_N, \sigma^2 + \sigma_N^2) = N(\mu_N, 4.8)$, con deviazione standard $\sqrt{4.8} = 2.191$: più larga del modello $N(\mu_N, 4)$ perché aggiunge l'incertezza su $\mu$.`,
    difficulty: 2,
    concepts: ['c38', 'c39', 'c40', 'c41', 'c42'],
  },
  // --- «μ = μN» e le due fonti di incertezza (c43, c44, c45) ------------------------------------------------
  {
    id: 'chk-17',
    type: 'tf',
    q: md`Per $N$ finito la densità predittiva $p(\mathbf{x}\,|\,\boldsymbol{X})$ coincide con il modello *plug-in* $N(\mu_N, \sigma^2)$, perché la slide p39 conclude «and thus $\mu = \mu_N$».`,
    answer: false,
    explanation: md`L'identificazione $\mu = \mu_N$ riguarda solo la media. La varianza della predittiva è $\sigma^2 + \sigma_N^2$: la varianza intrinseca dei dati più l'incertezza sulla stima di $\mu$. Le due densità coincidono solo quando $\sigma_N^2 \to 0$, cioè per $N \to \infty$.`,
    difficulty: 2,
    concepts: ['c43', 'c44', 'c45'],
  },
  // --- Quando ML e Bayes coincidono (c46, c47, c48, c49) ---------------------------------------------------
  {
    id: 'chk-18',
    type: 'tf',
    q: md`Con prior uniforme ($\sigma_0^2 \to \infty$ nell'esempio gaussiano) anche la densità predittiva bayesiana coincide con il *plug-in* ML $N(\bar{X}, \sigma^2)$, per qualunque $N$.`,
    answer: false,
    explanation: md`Con prior uniforme coincide la stima del parametro: $\mu_N = \bar{X}$ per ogni $N \ge 1$, perché la posterior è proporzionale alla sola verosimiglianza. La posterior però conserva la larghezza $\sigma_N^2 = \sigma^2/N$, quindi la predittiva è $N(\bar{X}, \sigma^2 + \sigma^2/N)$ e coincide con il *plug-in* solo quando anche $N$ è grande.`,
    difficulty: 3,
    concepts: ['c46', 'c47', 'c48', 'c49'],
  },
  // --- Perché ML in pratica, perché Bayes (c50, c51, c52, c53) ---------------------------------------------
  {
    id: 'chk-19',
    type: 'multi',
    q: md`Secondo la slide p40, per quali motivi in pratica si preferisce spesso ML alla stima bayesiana?`,
    options: [
      md`Minore complessità computazionale`,
      md`Interpretabilità più facile`,
      md`Permette di incorporare conoscenza a priori`,
      md`Quantifica l'incertezza con intervalli di credibilità`,
    ],
    answers: [0, 1],
    explanation: md`La slide dà due motivi: *lower computational complexity* (niente distribuzioni da calcolare e integrare su tutto lo spazio dei parametri) ed *easier interpretability* (un solo numero, facile da usare). Le altre due opzioni sono i vantaggi della stima bayesiana che le note aggiungono: conoscenza a priori, utile con pochi dati, e incertezza quantificata.`,
    difficulty: 1,
    concepts: ['c50', 'c51', 'c52', 'c53'],
  },
  // --- Verso la stima non parametrica (c59) ----------------------------------------------------------------
  {
    id: 'chk-20',
    type: 'mcq',
    q: md`Le letture di temperatura di una cella frigorifera hanno due regimi e una densità con due gobbe. Che cosa ottieni aumentando $N$ con una stima bayesiana gaussiana?`,
    options: [
      md`Una posterior sempre più stretta, ma la densità stimata resta una sola campana: serve una stima non parametrica`,
      md`Una densità che converge alla bimodale vera, perché Bayes e ML sono consistenti`,
      md`Una densità bimodale, perché il prior aggiunge la seconda gobba`,
      md`Nulla di diverso da ML, perché il prior non conta mai`,
    ],
    answer: 0,
    explanation: md`ML e Bayes sono metodi parametrici: la consistenza vale solo se i dati vengono davvero dal modello ipotizzato. Se la forma è sbagliata, nessun $N$ rimedia. Le note di p30 dicono che la stima non parametrica serve proprio quando i modelli parametrici non danno una buona approssimazione, e si basa direttamente sui dati.`,
    difficulty: 1,
    concepts: ['c59'],
  },
]
