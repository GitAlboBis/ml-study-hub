// Formule del foglio m08-non-parametrica-knn, prima metà: concetti c01-c36 dell'inventario.
// Convenzione condivisa con formulas-b.ts: una voce per ogni stringa LaTeX dei concetti (concepts[].latex),
// id "f-<concetto>" per la prima, "f-<concetto>-2", "f-<concetto>-3"… per le successive.
// La LaTeX è copiata dall'inventario (verificata sulle immagini di ch2 p43-46 e part1 p30-33) e non è ritoccata.
// importance = examRelevance del concetto; le voci di importanza 3 hanno almeno un blank per "Completa la formula".
// Concetti c01-c36 con LaTeX: c02, c04 (2), c15, c17, c18, c20, c21, c22, c32 (3), c33, c34 = 14 voci.
import { md } from '../../types'
import type { Formula } from '../../types'

export const formulasA: Formula[] = [
  // --- c02 Approccio bayesiano: si stima un'intera distribuzione (pagina di confine con m07) ----------
  {
    id: 'f-c02',
    name: "Stima bayesiana: l'intera distribuzione p(x|X)",
    nameEn: 'Bayesian approach: estimating the entire distribution p(x|X)',
    latex: md`p(x|X)`,
    explain: md`La stima a massima verosimiglianza (*Maximum Likelihood*, ML) restituisce un solo punto nello spazio dei parametri: una stima deterministica (*deterministic estimate*). La stima bayesiana (*Bayesian Estimation*, BE) invece stima l'intera distribuzione $p(x|X)$, la densità di $x$ alla luce dei campioni osservati $X$, dalla quale si inferisce $\theta$ (*from which $\theta$ is inferred*). Il risultato è una distribuzione a posteriori (*posterior distribution*) che riflette sia i dati osservati sia le convinzioni a priori (*prior beliefs*). La differenza da ricordare: ML pianta una bandierina, Bayes disegna una curva, e la larghezza della curva è l'incertezza sulla stima. Le note (p. 30) riprendono questo confronto come ponte tra la stima parametrica e quella non parametrica.`,
    symbols: [
      { s: md`x`, meaning: md`valore della feature di cui si vuole la densità` },
      { s: md`X`, meaning: md`insieme dei campioni di training osservati, $X = \{x_1, \dots, x_N\}$` },
      { s: md`p(x|X)`, meaning: md`densità di $x$ condizionata ai dati osservati (densità predittiva, *predictive density*)` },
      { s: md`\theta`, meaning: md`vettore dei parametri incogniti della pdf; per Bayes è una variabile aleatoria, per ML un valore fisso da trovare` },
    ],
    whenToUse: md`Alla domanda sulle differenze tra ML e Bayes: ML stima un punto, Bayes una distribuzione che contiene anche l'incertezza. Entrambi però assumono una forma funzionale per la pdf: la stima non parametrica nasce quando si vuole farne a meno.`,
    pitfalls: md`La frase della fonte (note p. 30, presa alla lettera dalla slide 40 del Cap. 2) è ambigua sull'ordine logico. Nella stima bayesiana dei parametri si calcola prima la posterior $p(\theta|X)$; la densità predittiva si ottiene poi integrando su $\theta$: $p(x|X) = \int p(x|\theta)\,p(\theta|X)\,d\theta$. All'orale di' che Bayes tratta $\theta$ come variabile aleatoria e restituisce una distribuzione, non un punto.`,
    importance: 2,
    blanks: [
      {
        masked: md`p(x|X) = \int p(x|\theta)\,\boxed{\;?\;}\,d\theta`,
        answer: md`p(\theta|X)`,
        distractors: [md`p(X|\theta)`, md`p(\theta)`, md`p(x|\theta)`],
      },
    ],
    source: [{ doc: 'part1', page: 30 }],
  },

  // --- c04 Equivalenza ML-Bayes con prior uniforme ---------------------------------------------------
  {
    id: 'f-c04',
    name: 'Prior dei parametri: se è uniforme, Bayes si riduce a ML',
    nameEn: 'Uniform prior p(θ): the Bayesian solution reduces to the ML solution',
    latex: md`p(\theta)`,
    explain: md`$p(\theta)$ è la densità a priori (*prior*) dei parametri: ciò che credi su $\theta$ prima di vedere i dati. Le note (p. 30) danno due casi in cui ML e Bayes coincidono. Il primo è asintotico (*asymptotic equivalence*): con un numero infinito di campioni le due soluzioni diventano equivalenti ed entrambe convergono ai veri valori dei parametri (sono stimatori consistenti, *consistent estimators*). Il secondo è il prior uniforme (*uniform prior*): se $p(\theta)$ è uniforme, cioè non si assume alcuna conoscenza a priori (*no prior knowledge is assumed*), la soluzione bayesiana si riduce alla soluzione ML, perché in questo caso il prior non influenza la posterior (*the prior doesn't influence the posterior*). Con $p(\theta) = c$ la posterior è proporzionale alla sola verosimiglianza, e due funzioni proporzionali hanno lo stesso punto di massimo. I passaggi sono nella dimostrazione [«quando ML e Bayes coincidono»](#derivation:der10).`,
    symbols: [
      { s: md`p(\theta)`, meaning: md`densità a priori (*prior*) dei parametri, scelta prima di osservare i dati` },
      { s: md`\theta`, meaning: md`vettore dei parametri incogniti della pdf` },
      { s: md`c`, meaning: md`valore costante del prior uniforme, sulla regione che contiene il massimo della verosimiglianza` },
    ],
    whenToUse: md`Risposta alla domanda d'esame «In which case ML and Bayesian are the same?»: con un prior uniforme (per ogni $N$) oppure nel limite $N \to \infty$ (per qualunque prior ragionevole).`,
    pitfalls: md`«Si riduce a ML» vale per il punto di massimo della posterior: la posterior resta una curva con la sua larghezza, quindi l'informazione sull'incertezza non sparisce (nel caso gaussiano la varianza a posteriori tende a $\sigma^2/N$, non a zero). Un prior uniforme su tutto l'asse reale non è normalizzabile: va inteso come costante su una regione che contiene il massimo della verosimiglianza, oppure come limite di un prior sempre più largo ($\sigma_0^2 \to \infty$, che dà $\mu_N \to \bar{X}$ per ogni $N$). L'equivalenza asintotica richiede invece che il prior dia densità positiva al valore vero: con $\sigma_0^2 = 0$ (certezza assoluta su $\mu_0$) i dati non correggono mai il prior.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\theta) = \boxed{\;?\;} \;\Rightarrow\; \arg\max_{\theta}\, p(\theta|X) = \hat{\theta}_{ML}`,
        answer: md`c \;\; (\text{costante})`,
        distractors: [md`\delta(\theta - \theta_0)`, md`\mathcal{N}(\theta;\, \mu_0, \sigma_0^2)`, md`p(\theta|X)`],
      },
    ],
    source: [{ doc: 'part1', page: 30 }],
  },
  {
    id: 'f-c04-2',
    name: 'Posterior proporzionale a verosimiglianza per prior',
    nameEn: 'Posterior ∝ likelihood × prior (Bayes rule for the parameters)',
    latex: md`p(\theta|X)\propto p(X|\theta)\,p(\theta)`,
    explain: md`È la regola di Bayes per i parametri, dal modulo sulla stima bayesiana, riportata qui per rendere esplicito il motivo dell'equivalenza con ML. La posterior $p(\theta|X)$ è il prodotto della verosimiglianza (*likelihood*) $p(X|\theta)$ e del prior $p(\theta)$, diviso per la costante di normalizzazione $\int p(X|\theta)\,p(\theta)\,d\theta$, che non dipende da $\theta$: per questo si scrive $\propto$. Se $p(\theta) = c$ è costante, $c$ si semplifica e resta $p(\theta|X) \propto p(X|\theta)$: la posterior è la verosimiglianza normalizzata e il suo massimo è $\hat{\theta}_{ML} = \arg\max_{\theta} p(X|\theta)$. Se il prior non è piatto, sposta il massimo verso i valori ritenuti plausibili a priori. Nel caso gaussiano con varianza nota la media a posteriori $\mu_N$ è una media pesata tra media campionaria $\bar{X}$ e media a priori $\mu_0$, con peso del prior $\sigma^2/(N\sigma_0^2 + \sigma^2)$: il peso va a zero per $N \to \infty$ (equivalenza asintotica) e per $\sigma_0^2 \to \infty$ (prior piatto).`,
    symbols: [
      { s: md`p(\theta|X)`, meaning: md`densità a posteriori (*posterior*) dei parametri, dati i campioni` },
      { s: md`p(X|\theta)`, meaning: md`verosimiglianza (*likelihood*) dei dati: funzione di $\theta$ a dati fissati` },
      { s: md`p(\theta)`, meaning: md`densità a priori (*prior*) dei parametri` },
      { s: md`\propto`, meaning: md`«proporzionale a»: uguale a meno di una costante che non dipende da $\theta$` },
      { s: md`X`, meaning: md`insieme dei campioni di training osservati` },
    ],
    whenToUse: md`Per spiegare perché il prior uniforme fa coincidere Bayes e ML, e perché con tanti dati il prior conta sempre meno: la verosimiglianza di $N$ campioni i.i.d. è un prodotto di $N$ fattori, il prior è uno solo.`,
    pitfalls: md`Non confondere $p(X|\theta)$ (verosimiglianza, funzione di $\theta$ a dati fissati) con $p(\theta|X)$ (posterior, densità su $\theta$). Il denominatore $p(X) = \int p(X|\theta)\,p(\theta)\,d\theta$ manca solo perché si scrive $\propto$: per avere una densità che integra a 1 va rimesso.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\theta|X)\propto p(X|\theta)\,\boxed{\;?\;}`,
        answer: md`p(\theta)`,
        distractors: [md`p(X)`, md`p(\theta|X)`, md`\frac{1}{p(\theta)}`],
      },
      {
        masked: md`p(\theta|X)\propto \boxed{\;?\;}\,p(\theta)`,
        answer: md`p(X|\theta)`,
        distractors: [md`p(\theta|X)`, md`p(X)`],
      },
    ],
    source: [{ doc: 'part1', page: 30 }],
  },

  // --- c15 Campione generico x* e regione R --------------------------------------------------------
  {
    id: 'f-c15',
    name: 'Punto di stima x* dentro una regione R',
    nameEn: 'Generic sample x* in a predefined region R of the feature space',
    latex: md`\mathbf{x}^* \in R`,
    explain: md`È l'impostazione dei *Basic Concepts* (slide 43). $\mathbf{x}^*$ è un campione generico (*generic sample*): il punto dello spazio delle feature (*feature space*) in cui vuoi conoscere la densità. Non deve essere uno dei campioni di training: è il punto di interrogazione (*query point*). $R$ è una regione predefinita (*predefined region*) dello spazio delle feature che lo contiene. Tutta la stima non parametrica è locale: guardi che cosa succede dentro $R$ (quanti campioni ci cadono, quanto è grande) per dedurre il valore della pdf in $\mathbf{x}^*$. Esempio con il pesce: per conoscere la densità della luminosità dei salmoni nel valore $x^* = 4.8$ prendi come $R$ l'intervallo $[4.55,\ 5.05]$, largo $V = 0.5$.`,
    symbols: [
      { s: md`\mathbf{x}^*`, meaning: md`campione generico: il punto in cui si stima la pdf (non necessariamente un campione di training)` },
      { s: md`R`, meaning: md`regione predefinita dello spazio delle feature che contiene $\mathbf{x}^*$` },
      { s: md`\in`, meaning: md`«appartiene a»: $\mathbf{x}^*$ è un punto di $R$` },
      { s: md`\mathbf{x}`, meaning: md`vettore delle $n$ feature di un campione (in grassetto nelle slide, non nelle note)` },
    ],
    whenToUse: md`Primo passo di ogni risposta sulla stima non parametrica, K-NN o Parzen: «fisso un punto $\mathbf{x}^*$ e una regione $R$ che lo contiene».`,
    pitfalls: md`«Predefinita» significa fissata prima di guardare i campioni: è ciò che rende $K$ una variabile binomiale e permette di usare la legge dei grandi numeri. Nel K-NN la cella viene invece costruita sui campioni, e lì l'aleatorio è la regione stessa (dimostrazione [«il contenuto di probabilità della cella è una variabile Beta»](#derivation:der09)). Le slide scrivono i vettori in grassetto ($\mathbf{x}^*$), le note no ($x^*$): è lo stesso oggetto.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mathbf{x}^* \boxed{\;?\;} R`,
        answer: md`\in`,
        distractors: [md`\notin`, md`\subset`],
      },
    ],
    source: [
      { doc: 'ch2', page: 43 },
      { doc: 'part1', page: 31 },
    ],
  },

  // --- c17 Probabilità della regione ---------------------------------------------------------------
  {
    id: 'f-c17',
    name: 'Probabilità della regione: P_R ≈ p(x*)·V',
    nameEn: 'Probability that a sample falls in R',
    latex: md`P_R = P\{\mathbf{x}\in R\} = \int_R p(\mathbf{x})\,d\mathbf{x} = p(\mathbf{x}^*)\,V`,
    explain: md`Leggi la catena da sinistra. $P_R$ è per definizione la probabilità che un campione $\mathbf{x}$ cada in $R$. Per definizione di densità, questa probabilità è l'integrale della pdf su $R$. L'ultimo passaggio usa le due ipotesi in rosso nella slide 43: la pdf vera è una funzione continua (*continuous function*) e $R$ è sufficientemente piccola (*sufficiently small*) perché $p(\mathbf{x})$ non vari in modo significativo al suo interno. Allora $p(\mathbf{x}) \approx p(\mathbf{x}^*)$ su tutta $R$, esce dall'integrale e resta l'integrale di 1 su $R$, cioè il volume $V$. Geometricamente: l'area sotto la curva sopra $R$ viene sostituita da un rettangolo di base $V$ e altezza $p(\mathbf{x}^*)$. Esempio: se attorno a $x^* = 4.8$ la densità della luminosità dei salmoni vale circa $0.21$ e $R$ è largo $V = 0.5$, un salmone cade in $R$ con probabilità circa $0.21 \cdot 0.5 = 0.105$.`,
    symbols: [
      { s: md`P_R`, meaning: md`probabilità che un campione cada nella regione $R$` },
      { s: md`P\{\mathbf{x}\in R\}`, meaning: md`la stessa probabilità scritta come evento: il campione $\mathbf{x}$ appartiene a $R$` },
      { s: md`p(\mathbf{x})`, meaning: md`pdf vera (incognita) del fenomeno, supposta continua` },
      { s: md`\int_R \cdot \; d\mathbf{x}`, meaning: md`integrale sulla regione $R$ ($n$-dimensionale nello spazio delle feature)` },
      { s: md`p(\mathbf{x}^*)`, meaning: md`valore della pdf vera nel punto $\mathbf{x}^*$: è ciò che si vuole stimare` },
      { s: md`V`, meaning: md`volume di $R$ (*Volume of R*, cerchiato in verde nella slide)` },
    ],
    whenToUse: md`È il primo passaggio della dimostrazione [«dalla probabilità di una regione alla stima K/(N·V)»](#derivation:der01): da qui, uguagliando alla stima $K/N$, nasce la formula madre di K-NN e Parzen.`,
    pitfalls: md`La slide scrive «=», ma l'ultimo passaggio è un'approssimazione ($\approx$), esatta solo per $V \to 0$. Per il teorema della media integrale, se $p$ è continua e $R$ è connessa esiste un punto $\boldsymbol{\xi} \in R$ con $P_R = p(\boldsymbol{\xi})\,V$ esattamente; l'ipotesi di regione piccola serve a sostituire $\boldsymbol{\xi}$ con $\mathbf{x}^*$. In 1-D, con $R$ simmetrica attorno a $x^*$, l'errore vale circa $p''(x^*)\,V^3/24$: nullo dove la pdf è lineare, grande sui picchi (dove $p'' < 0$ il rettangolo sovrastima l'area). Se $p$ ha un salto dentro $R$ l'approssimazione non vale.`,
    importance: 3,
    blanks: [
      {
        masked: md`P_R = \int_R p(\mathbf{x})\,d\mathbf{x} = p(\mathbf{x}^*)\,\boxed{\;?\;}`,
        answer: md`V`,
        distractors: [md`N`, md`\frac{1}{V}`, md`K`],
      },
      {
        masked: md`P_R = P\{\mathbf{x}\in R\} = \boxed{\;?\;} = p(\mathbf{x}^*)\,V`,
        answer: md`\int_R p(\mathbf{x})\,d\mathbf{x}`,
        distractors: [md`\sum_{k=1}^{N} p(\mathbf{x}_k)`, md`\int_R \mathbf{x}\,p(\mathbf{x})\,d\mathbf{x}`, md`\frac{K}{NV}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 43 },
      { doc: 'part1', page: 31 },
    ],
  },

  // --- c18 Volume V della regione R ----------------------------------------------------------------
  {
    id: 'f-c18',
    name: 'Volume (ipervolume) V della regione R',
    nameEn: 'Volume of R (hypervolume)',
    latex: md`V`,
    explain: md`Nella slide 43 la $V$ della formula è cerchiata in verde con la didascalia *Volume of R*; la slide 45 la chiama ipervolume (*hypervolume V of R*). È la misura di $R$ nello spazio delle feature a $n$ dimensioni: una lunghezza in 1-D, un'area in 2-D, un volume in 3-D, un ipervolume oltre. Per una cella sferica di raggio $r$ (formule non scritte nella fonte, utili nei conti): $V = 2r$ in 1-D, $V = \pi r^2$ in 2-D, $V = \frac{4}{3}\pi r^3$ in 3-D. Per l'ipercubo di lato $h$ di Parzen $V = h^n$. $V$ è il secondo dei due parametri della stima, insieme a $K$: il K-NN lo misura sui dati, Parzen lo fissa.`,
    symbols: [
      { s: md`V`, meaning: md`volume (ipervolume) della regione $R$` },
      { s: md`R`, meaning: md`regione dello spazio delle feature che contiene $\mathbf{x}^*$` },
      { s: md`n`, meaning: md`dimensione dello spazio delle feature (numero di feature)` },
      { s: md`r`, meaning: md`raggio di una cella sferica (la forma tipica del K-NN)` },
      { s: md`h`, meaning: md`lato dell'ipercubo nel metodo di Parzen` },
    ],
    whenToUse: md`Ogni volta che passi da una probabilità ($K/N$) a una densità: dividi per $V$. Nei conti in 1-D $V$ è la larghezza dell'intervallo.`,
    pitfalls: md`Una densità ha unità «1 / unità di volume» e può superare 1: con $K = 30$, $N = 100$ e $V = 0.1$ la stima vale $30/(100 \cdot 0.1) = 3$. Non confondere il raggio con il volume: se il raggio scala come $1/\sqrt{N}$, in 2-D l'area scala come $1/N$ (è quello che succede nel disegno della riga Parzen della slide 46).`,
    importance: 2,
    blanks: [
      {
        masked: md`V = \boxed{\;?\;} \quad (\text{cerchio di raggio } r,\ n = 2)`,
        answer: md`\pi r^2`,
        distractors: [md`2\pi r`, md`\frac{4}{3}\pi r^3`, md`r^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 43 },
      { doc: 'part1', page: 31 },
    ],
  },

  // --- c20 Stima di P_R con la frequenza relativa --------------------------------------------------
  {
    id: 'f-c20',
    name: 'Frequenza relativa K/N: stima consistente di P_R',
    nameEn: 'Consistent estimate of P_R through the relative frequency',
    latex: md`\hat{P}_R = \frac{K}{N}`,
    explain: md`$P_R$ non si conosce, perché la pdf è ignota. Si stima con la frequenza relativa (*relative frequency*): la frazione degli $N$ campioni di training che cade in $R$. La slide la chiama stima consistente (*consistent estimate*): converge in probabilità a $P_R$ quando $N \to \infty$, come dice la legge dei grandi numeri scritta subito accanto. Il motivo, non scritto nella fonte: se i campioni sono i.i.d., ognuno cade in $R$ con probabilità $P_R$ indipendentemente dagli altri, quindi $K$ è binomiale di parametri $N$ e $P_R$; ne seguono $E\{\hat{P}_R\} = P_R$ (stima non distorta) e $\mathrm{var}\{\hat{P}_R\} = P_R(1-P_R)/N \to 0$. I passaggi sono nella dimostrazione [«perché K/N è una stima consistente di P_R»](#derivation:der06). Esempio: su $N = 500$ salmoni, $K = 52$ hanno luminosità dentro $R$, quindi $\hat{P}_R = 52/500 = 0.104$.`,
    symbols: [
      { s: md`\hat{P}_R`, meaning: md`stima della probabilità $P_R$ tramite la frequenza relativa` },
      { s: md`K`, meaning: md`numero di campioni di training che cadono in $R$ (una variabile aleatoria: dipende dai campioni estratti)` },
      { s: md`N`, meaning: md`numero totale di campioni di training` },
      { s: md`P_R`, meaning: md`probabilità vera che un campione cada in $R$` },
    ],
    whenToUse: md`Secondo passaggio verso $K/(NV)$: sostituisci la probabilità vera $P_R$ con la sua stima. Serve anche a spiegare perché $R$ deve contenere «abbastanza» campioni: l'errore relativo della stima vale circa $1/\sqrt{K}$ (50% con $K = 4$, 10% con $K = 100$).`,
    pitfalls: md`Due ipotesi implicite: campioni i.i.d. estratti dalla stessa $p(\mathbf{x})$, e regione $R$ fissata prima di guardare i campioni. Nel K-NN la seconda cade ($K$ è deciso, la cella dipende dai dati) e il ragionamento va rifatto. Inoltre $K/N$ converge a $P_R$, non a $p(\mathbf{x}^*)$: per arrivare alla densità serve dividere per $V$ e far tendere $V$ a zero. Non confondere $\hat{P}_R = K/N$, una probabilità tra 0 e 1, con $\hat{p}(\mathbf{x}^*) = K/(NV)$, una densità.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{P}_R = \boxed{\;?\;}`,
        answer: md`\frac{K}{N}`,
        distractors: [md`\frac{K}{NV}`, md`\frac{N}{K}`, md`\frac{K}{V}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 43 },
      { doc: 'part1', page: 32 },
    ],
  },

  // --- c21 Legge dei grandi numeri -----------------------------------------------------------------
  {
    id: 'f-c21',
    name: 'Legge dei grandi numeri per la frequenza relativa',
    nameEn: 'Law of large numbers (convergence in probability of K/N)',
    latex: md`\lim_{N\to+\infty} P\{|\hat{P}_R - P_R| < \delta\} = 1 \quad \forall\delta > 0`,
    explain: md`Nella slide 43 una freccia rossa collega questo limite all'etichetta *Law of large numbers*. Si legge così: fissata una tolleranza $\delta$ positiva, piccola a piacere, la probabilità che la stima $\hat{P}_R$ disti da $P_R$ meno di $\delta$ tende a 1 al crescere del numero $N$ di campioni. È la convergenza in probabilità, cioè la definizione di stimatore consistente del modulo sulla bontà degli stimatori. Le note concludono: la stima diventa più accurata al crescere della dimensione del campione (*the estimate becomes more accurate as the sample size grows*). Si dimostra con la disuguaglianza di Chebyshev (integrazione, non nella fonte): $P\{\vert \hat{P}_R - P_R \vert \ge \delta\} \le \frac{P_R(1-P_R)}{N\delta^2} \le \frac{1}{4N\delta^2}$, che tende a 0. Esempio: con $N = 1000$ e $\delta = 0.05$ il limite vale $1/(4 \cdot 1000 \cdot 0.0025) = 0.1$, quindi la frequenza relativa sta entro $\pm 0.05$ da $P_R$ con probabilità almeno $0.9$.`,
    symbols: [
      { s: md`\lim_{N\to+\infty}`, meaning: md`limite al crescere del numero di campioni di training` },
      { s: md`P\{\cdot\}`, meaning: md`probabilità dell'evento tra graffe (calcolata sulle possibili estrazioni dei campioni)` },
      { s: md`\hat{P}_R`, meaning: md`frequenza relativa $K/N$` },
      { s: md`P_R`, meaning: md`probabilità vera che un campione cada in $R$` },
      { s: md`\delta`, meaning: md`tolleranza positiva arbitraria sullo scarto tra stima e valore vero` },
      { s: md`\forall\delta > 0`, meaning: md`«per ogni $\delta$ positivo»: il limite vale per qualunque tolleranza, anche piccolissima` },
    ],
    whenToUse: md`Quando all'orale dici «la stima è consistente»: scrivi questo limite e aggiungi che vale per ogni $\delta > 0$. È il motivo della prima osservazione della slide 44: $R$ deve contenere abbastanza campioni per applicare la legge dei grandi numeri.`,
    pitfalls: md`Il limite garantisce $\hat{P}_R \to P_R$, non $\hat{p}(\mathbf{x}^*) \to p(\mathbf{x}^*)$: con $V$ fisso la stima della densità converge alla media spaziale $P_R/V$, non al valore puntuale. Per la densità servono in più $V_N \to 0$ e $N V_N \to \infty$ (le leggi $V = 1/\sqrt{N}$ e $K = \sqrt{N}$ della slide 46). È un risultato asintotico: non dice quanti campioni bastano, per quello serve la varianza.`,
    importance: 3,
    blanks: [
      {
        masked: md`\lim_{N\to+\infty} P\{|\hat{P}_R - P_R| < \delta\} = \boxed{\;?\;} \quad \forall\delta > 0`,
        answer: md`1`,
        distractors: [md`0`, md`\delta`, md`P_R`],
      },
      {
        masked: md`\lim_{N\to+\infty} P\{|\hat{P}_R - P_R| \boxed{\;?\;} \delta\} = 1 \quad \forall\delta > 0`,
        answer: md`<`,
        distractors: [md`>`, md`\ge`],
      },
      {
        masked: md`\lim_{N\to+\infty} P\{|\hat{P}_R - P_R| < \delta\} = 1 \quad \boxed{\;?\;}`,
        answer: md`\forall\delta > 0`,
        distractors: [md`\exists\,\delta > 0`, md`\forall\delta < 0`],
      },
    ],
    source: [
      { doc: 'ch2', page: 43 },
      { doc: 'part1', page: 32 },
    ],
  },

  // --- c22 Stima non parametrica della pdf: K/(N·V) ------------------------------------------------
  {
    id: 'f-c22',
    name: 'Stima non parametrica della pdf: K/(N·V)',
    nameEn: 'Nonparametric pdf estimate (PDF estimation)',
    latex: md`\hat{p}(\mathbf{x}^*) = \frac{\hat{P}_R}{V} = \frac{K}{NV}`,
    explain: md`È la formula madre di tutta la stima non parametrica (slide 44, *PDF Estimation*). Dalla relazione $P_R \approx p(\mathbf{x}^*)\,V$ ricavi $p(\mathbf{x}^*) \approx P_R / V$; al posto della probabilità vera, che non conosci, metti la sua stima $\hat{P}_R = K/N$. Ottieni una densità contando campioni e misurando un volume, senza alcun modello per la forma della pdf. Esempio con il pesce: su $N = 500$ salmoni, $K = 52$ hanno luminosità in $R = [4.55,\ 5.05]$, largo $V = 0.5$ attorno a $x^* = 4.8$: $\hat{p}(4.8) = 52/(500 \cdot 0.5) = 0.208$. La stessa formula si legge in due modi, secondo quale dei due parametri $K$ e $V$ fissi: il K-NN fissa $K$ e misura il volume $V_K(\mathbf{x}^*)$ che lo contiene ([stima K-NN](#formula:f-c39)); Parzen fissa $R$, quindi $V$, e conta $K$. I passaggi completi sono nella dimostrazione [«dalla probabilità di una regione alla stima K/(N·V)»](#derivation:der01).`,
    symbols: [
      { s: md`\hat{p}(\mathbf{x}^*)`, meaning: md`stima della pdf nel punto $\mathbf{x}^*$` },
      { s: md`\hat{P}_R`, meaning: md`stima della probabilità della regione, la frequenza relativa $K/N$` },
      { s: md`K`, meaning: md`numero di campioni di training dentro $R$` },
      { s: md`N`, meaning: md`numero totale di campioni di training` },
      { s: md`V`, meaning: md`volume di $R$` },
    ],
    whenToUse: md`Punto di partenza obbligato per le domande d'esame sul K-NN e su Parzen: scrivila, poi di' quale parametro ciascun metodo tiene fermo.`,
    pitfalls: md`La catena contiene due approssimazioni di natura diversa. La prima, $P_R \approx p(\mathbf{x}^*)\,V$, è geometrica: migliora stringendo $R$ (errore di approssimazione, cioè bias). La seconda, $P_R \approx K/N$, è statistica: migliora allargando $R$ o aumentando $N$ (varianza). Da qui le due osservazioni della slide 44, *R should be enough large* e *enough small*, in conflitto tra loro: con $R$ fissata il valore atteso della stima è la media spaziale $P_R/V$ e la varianza è circa $p(\mathbf{x}^*)/(NV)$ (dimostrazione [«bias e varianza di K/(N·V)»](#derivation:der07)). Casi limite: a $N$ fisso e $V \to 0$ la stima vale 0 oppure diverge; a $V$ fisso e $N \to \infty$ converge a $P_R/V$, non a $p(\mathbf{x}^*)$. Ipotesi: campioni i.i.d. e $p$ continua in $\mathbf{x}^*$.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x}^*) = \frac{\hat{P}_R}{V} = \frac{K}{\boxed{\;?\;}}`,
        answer: md`NV`,
        distractors: [md`N`, md`V`, md`KV`],
      },
      {
        masked: md`\hat{p}(\mathbf{x}^*) = \frac{\boxed{\;?\;}}{V} = \frac{K}{NV}`,
        answer: md`\hat{P}_R`,
        distractors: [md`P_R\,V`, md`K`, md`p(\mathbf{x}^*)`],
      },
    ],
    source: [
      { doc: 'ch2', page: 44 },
      { doc: 'part1', page: 32 },
    ],
  },

  // --- c32 Figura: Parzen contro K-NN al crescere di N (tre scritte della slide 46) ------------------
  {
    id: 'f-c32',
    name: 'Colonne della figura Parzen contro K-NN: N = 1, 4, 9, 16, …, 100',
    nameEn: 'Illustration of Parzen versus K-NN estimation concepts: column labels',
    latex: md`N = 1, \quad N = 4, \quad N = 9, \quad N = 16, \quad \dots, \quad N = 100`,
    explain: md`Sono le etichette delle cinque colonne della figura *Illustration of Parzen versus K-NN estimation concepts* (slide 46, ripresa nelle note a p. 33). Ogni riquadro è un pezzo di spazio delle feature 2-D con $N$ campioni (punti neri); il punto in cui si stima la densità è il centro del riquadro; la regione $R$ è il cerchio rosso centrato lì. I valori di $N$ sono quadrati perfetti, così $\sqrt{N}$ è intero: nella riga K-NN $K = 1, 2, 3, 4, 10$, nella riga Parzen $V = 1,\ 0.5,\ 0.333,\ 0.25,\ 0.1$. I puntini tra $N = 16$ e $N = 100$ indicano le colonne omesse. I campioni sono gli stessi nelle due righe e si accumulano da una colonna all'altra (il campione di $N = 1$ c'è ancora in $N = 4$, e così via). Il messaggio: la stessa formula $K/(NV)$ letta in due modi; in entrambi la regione si restringe al crescere di $N$, mentre i campioni al suo interno dovrebbero aumentare. La figura viene dal testo di Duda, Hart e Stork (Fig. 4.2), la cui didascalia precisa che in entrambe le righe le successioni di stime sono variabili aleatorie che in generale convergono al valore vero della densità nel punto.`,
    symbols: [
      { s: md`N`, meaning: md`numero di campioni di training nel riquadro (etichetta della colonna)` },
      { s: md`\dots`, meaning: md`colonne omesse tra $N = 16$ e $N = 100$` },
    ],
    whenToUse: md`Alla domanda sulle differenze tra K-NN e Parzen: descrivi la figura riga per riga, dicendo che cosa è imposto (in alto $V$, in basso $K$) e che cosa dipende dai dati.`,
    pitfalls: md`Nella riga Parzen del disegno è il raggio, non l'area, a ridursi come $1/\sqrt{N}$ (raggi di circa 73, 36, 24, 18 e 6 pixel): l'area scala allora come $1/N$ e il cerchio cattura $K = 1, 0, 1, 1, 1$ campioni invece di un numero medio che cresce come $\sqrt{N}$. La figura è schematica: la legge da ricordare è quella dichiarata, sul volume. Con $N = 4$ il cerchio di Parzen disegnato è vuoto (il campione più vicino ne tocca il bordo da fuori): $K = 0$ e la stima vale zero, cosa che nel K-NN non può succedere.`,
    importance: 3,
    blanks: [
      {
        masked: md`N = 1, \quad N = 4, \quad N = 9, \quad N = \boxed{\;?\;}, \quad \dots, \quad N = 100`,
        answer: md`16`,
        distractors: [md`12`, md`25`, md`13`],
      },
    ],
    source: [
      { doc: 'ch2', page: 46 },
      { doc: 'part1', page: 33 },
    ],
  },
  {
    id: 'f-c32-2',
    name: 'Riga Parzen della figura: volume imposto V = 1/√N',
    nameEn: 'Parzen row of the figure: V = 1/sqrt(N)',
    latex: md`V = \frac{1}{\sqrt{N}}`,
    explain: md`È l'etichetta della riga superiore della figura della slide 46. Qui il volume della regione è imposto come funzione prefissata di $N$ e si restringe in modo deterministico, qualunque sia la posizione dei campioni; il numero $K$ di campioni catturati è invece casuale, deciso dai dati. È la lettura «Parzen» di $K/(NV)$: $R$, e quindi $V$, è fissata; $K$ si conta. Per $N = 1$ il cerchio occupa quasi tutto il riquadro e contiene l'unico campione ($K = 1$); nei riquadri successivi rimpicciolisce attorno al centro e cattura quello che capita.`,
    symbols: [
      { s: md`V`, meaning: md`volume (area del cerchio rosso) della regione di Parzen, imposto a priori come funzione di $N$` },
      { s: md`N`, meaning: md`numero di campioni di training nel riquadro` },
    ],
    whenToUse: md`Per descrivere la riga alta della figura e il principio di Parzen: il volume è deciso prima di guardare i dati, il conteggio no.`,
    pitfalls: md`Non scambiare le righe: in alto è imposto il volume, in basso il numero di vicini. Poiché $K$ è casuale, può valere zero (riquadro con $N = 4$): la stima con una regione rigida vale allora zero. Nel disegno della slide è il raggio a scalare come $1/\sqrt{N}$, non l'area: per questo i cerchi disegnati restano quasi vuoti.`,
    importance: 3,
    blanks: [
      {
        masked: md`V = \boxed{\;?\;}`,
        answer: md`\frac{1}{\sqrt{N}}`,
        distractors: [md`\sqrt{N}`, md`\frac{1}{N}`, md`\frac{1}{N^2}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 46 },
      { doc: 'part1', page: 33 },
    ],
  },
  {
    id: 'f-c32-3',
    name: 'Riga K-NN della figura: numero di vicini imposto K = √N',
    nameEn: 'K-NN row of the figure: K = sqrt(N)',
    latex: md`K = \sqrt{N}`,
    explain: md`È l'etichetta della riga inferiore. Qui è il numero di vicini a essere imposto: $K = 1, 2, 3, 4, 10$ per $N = 1, 4, 9, 16, 100$. Il cerchio parte dal centro del riquadro e si espande finché il suo bordo tocca il $K$-esimo campione più vicino: il volume è il risultato, deciso dai dati. Nella figura i raggi (circa 61, 61, 50, 41 e 28 pixel) coincidono con le distanze del 1°, 2°, 3°, 4° e 10° vicino: questa riga è disegnata in modo esatto. Per $N = 1$ il cerchio passa per l'unico campione. A $N = 100$ il cerchio K-NN è molto più grande di quello di Parzen, perché deve contenere 10 campioni.`,
    symbols: [
      { s: md`K`, meaning: md`numero di campioni che la regione K-NN deve contenere, imposto a priori come funzione di $N$` },
      { s: md`N`, meaning: md`numero di campioni di training nel riquadro` },
    ],
    whenToUse: md`Per descrivere la riga bassa della figura e il principio del K-NN: il conteggio è deciso prima, il volume si misura sui dati.`,
    pitfalls: md`Il cerchio K-NN si restringe al crescere di $N$ non perché lo imponi, ma perché i campioni si infittiscono. La stima K-NN non è mai nulla: dentro la cella ci sono sempre $K \ge 1$ campioni.`,
    importance: 3,
    blanks: [
      {
        masked: md`K = \boxed{\;?\;}`,
        answer: md`\sqrt{N}`,
        distractors: [md`\frac{1}{\sqrt{N}}`, md`N`, md`1`],
      },
    ],
    source: [
      { doc: 'ch2', page: 46 },
      { doc: 'part1', page: 33 },
    ],
  },

  // --- c33 Riga Parzen della figura: V = 1/√N ------------------------------------------------------
  {
    id: 'f-c33',
    name: 'Legge V = 1/√N: il volume di Parzen che si restringe con N',
    nameEn: 'Parzen row: V = 1/sqrt(N)',
    latex: md`V = \frac{1}{\sqrt{N}}`,
    explain: md`Il volume è una funzione prefissata di $N$ che tende a zero: $N = 1$ dà $V = 1$; $N = 4$ dà $V = 0.5$; $N = 9$ dà $V \approx 0.333$; $N = 16$ dà $V = 0.25$; $N = 100$ dà $V = 0.1$. Il volume non dipende dai dati; $K$ sì, e può anche essere zero (stima nulla). Perché proprio questa legge (verifica non scritta nella fonte): la stima converge se $V_N \to 0$, così la media spaziale su $R$ diventa il valore puntuale (bias nullo), e se $N V_N \to \infty$, così il numero atteso di campioni in $R$, circa $N\,p(\mathbf{x}^*)\,V_N$, cresce senza limite (varianza nulla). Con $V_N = 1/\sqrt{N}$ si ha $V_N \to 0$ e $N V_N = \sqrt{N} \to \infty$: entrambe soddisfatte. Sono le condizioni sulla larghezza della finestra di Parzen ($h_N \to 0$ e $N h_N^n \to \infty$, con $V = h^n$); la legge $V_N = 1/\sqrt{N}$ equivale a $h_N = 1/N^{1/(2n)}$, l'esempio della slide 61.`,
    symbols: [
      { s: md`V`, meaning: md`volume della regione di Parzen, imposto come funzione di $N$` },
      { s: md`V_N`, meaning: md`lo stesso volume con il pedice che ricorda la dipendenza da $N$` },
      { s: md`N`, meaning: md`numero di campioni di training` },
      { s: md`h_N`, meaning: md`lato della finestra (ipercubo) di Parzen con $N$ campioni, $V_N = h_N^n$` },
      { s: md`n`, meaning: md`dimensione dello spazio delle feature` },
    ],
    whenToUse: md`Alla domanda «do they tend to the optimal solution?» per Parzen: un esempio concreto di legge $V(N)$ che rende la stima consistente.`,
    pitfalls: md`Non ogni volume decrescente va bene. Con $V = 1/N$ si ha $N V_N = 1$: il numero di campioni nella regione non cresce e la varianza non va a zero. Con $V$ costante resta il bias. La costante davanti alla legge non conta per la convergenza, ma a $N$ finito conta molto.`,
    importance: 2,
    blanks: [
      {
        masked: md`N\,V_N = N \cdot \frac{1}{\sqrt{N}} = \boxed{\;?\;} \;\to\; +\infty`,
        answer: md`\sqrt{N}`,
        distractors: [md`1`, md`\frac{1}{\sqrt{N}}`],
      },
    ],
    source: [{ doc: 'ch2', page: 46 }],
  },

  // --- c34 Riga K-NN della figura: K = √N ----------------------------------------------------------
  {
    id: 'f-c34',
    name: 'Legge K = √N: il numero di vicini che cresce con N',
    nameEn: 'K-NN row: K = sqrt(N)',
    latex: md`K = \sqrt{N}`,
    explain: md`Il numero di vicini è una funzione prefissata di $N$ che cresce: $N = 1$ dà $K = 1$; $N = 4$ dà $K = 2$; $N = 9$ dà $K = 3$; $N = 16$ dà $K = 4$; $N = 100$ dà $K = 10$. Il volume è quello che serve per racchiudere $K$ campioni: dipende dai dati, è grande dove i campioni sono radi e si restringe al crescere di $N$ perché i campioni si infittiscono. Con il K-NN la stima non è mai nulla. La legge soddisfa le due condizioni di consistenza del K-NN ([condizione necessaria e sufficiente](#formula:f-c40)): $K_N = \sqrt{N} \to \infty$ e $K_N/N = 1/\sqrt{N} \to 0$. Nei punti dove $p(\mathbf{x}^*) > 0$ il volume si comporta come $V_K(\mathbf{x}^*) \approx 1/(\sqrt{N}\,p(\mathbf{x}^*))$: una finestra che si stringe come $1/\sqrt{N}$, proprio come quella di Parzen, ma con la costante decisa dai dati, grande dove la densità è bassa (dimostrazione [«il volume della cella K-NN con K = √N»](#derivation:der08)).`,
    symbols: [
      { s: md`K`, meaning: md`numero di vicini che la cella K-NN deve contenere, imposto come funzione di $N$` },
      { s: md`K_N`, meaning: md`lo stesso $K$ con il pedice che ricorda la dipendenza da $N$` },
      { s: md`N`, meaning: md`numero di campioni di training` },
      { s: md`V_K(\mathbf{x}^*)`, meaning: md`volume della cella centrata in $\mathbf{x}^*$ che contiene $K$ campioni` },
    ],
    whenToUse: md`Esempio standard di legge $K(N)$ consistente, da citare quando enunci la condizione di consistenza del K-NN.`,
    pitfalls: md`$K$ costante (per esempio sempre 3) non soddisfa $K_N \to \infty$: la varianza non va a zero. $K = N/2$ viola $K_N/N \to 0$: la cella non si stringe e la stima resta troppo liscia. La legge è imposta a $K$, non al volume: non confondere le due righe della figura.`,
    importance: 2,
    blanks: [
      {
        masked: md`\frac{K_N}{N} = \frac{\sqrt{N}}{N} = \boxed{\;?\;} \;\to\; 0`,
        answer: md`\frac{1}{\sqrt{N}}`,
        distractors: [md`\sqrt{N}`, md`1`],
      },
    ],
    source: [{ doc: 'ch2', page: 46 }],
  },
]
