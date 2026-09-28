// Flashcard del modulo m05 (stima a massima verosimiglianza, selezione del modello, gaussiana multivariata).
// Coprono tutti i 69 concetti dell'inventario, nell'ordine delle slide (ch2 p17-21, part1 p20-24).
import { md } from '../../types'
import type { Flashcard } from '../../types'

export const flashcards: Flashcard[] = [
  // --- ponte dal modulo precedente e definizione (c01-c06) ---
  {
    id: 'fc-ponte-proprieta-asintotiche',
    kind: 'intuizione',
    q: md`Con quale frase le note (part1 p20) passano dalla bontà degli stimatori alla massima verosimiglianza, e perché è la premessa del modulo?`,
    a: md`Le note chiudono il discorso sugli stimatori così: se le proprietà asintotiche sono soddisfatte (non distorsione asintotica, efficienza asintotica, consistenza), puoi avere più fiducia nell'affidabilità (*reliability*) e nell'accuratezza (*accuracy*) degli stimatori su dataset grandi. Subito dopo arriva la stima ML, cioè lo stimatore che possiede proprio queste tre proprietà. La frase compare solo nelle note, non nelle slide.`,
  },
  {
    id: 'fc-definizione-ml',
    kind: 'formula',
    q: md`Scrivi la definizione della stima a massima verosimiglianza (*maximum likelihood estimate*, ML) e spiega che cosa è fisso e che cosa varia.`,
    a: md`$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \, p(\mathbf{X} \mid \boldsymbol{\theta})$$

- $\boldsymbol{\theta} = (\theta_1, \ldots, \theta_r)$ è il vettore dei parametri: è la variabile su cui cerchi il massimo (sta sotto $\arg\max$).
- $\mathbf{X} = \{\mathbf{x}_1, \ldots, \mathbf{x}_N\}$ sono i campioni di training osservati: restano fissi.
- $\arg\max$ restituisce il **punto** di massimo, non il valore massimo.
- $\hat{\boldsymbol{\theta}}$ ha il cappello perché dipende dai dati: è un vettore aleatorio, con bias e varianza.`,
  },
  {
    id: 'fc-likelihood-prodotto',
    kind: 'formula',
    q: md`Perché la likelihood si può scrivere come prodotto delle pdf dei singoli campioni, e che cosa descrive?`,
    a: md`$$p(\mathbf{X} \mid \boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta})$$

- **Indipendenza**: la densità congiunta si fattorizza nel prodotto delle marginali.
- **Identica distribuzione**: in ogni fattore compare la stessa $p(\cdot \mid \boldsymbol{\theta})$.

Letta come funzione di $\boldsymbol{\theta}$ con $\mathbf{X}$ fissato, misura la compatibilità (*compatibility/agreement*) tra un valore dei parametri e i campioni osservati. È la risposta alla domanda d'esame «why we can use the separate products of the probabilities and what the Likelihood describe».`,
  },
  {
    id: 'fc-variare-theta',
    kind: 'intuizione',
    q: md`Prima osservazione della slide: che cosa ottieni variando $\boldsymbol{\theta}$?`,
    a: md`«By varying θ, one obtains different pdfs, each yielding a likelihood value». Ogni valore di $\boldsymbol{\theta}$ individua una pdf diversa della stessa famiglia $p(\mathbf{x} \mid \boldsymbol{\theta})$, per esempio gaussiane con medie diverse. Valutata sui campioni osservati, quella pdf dà un numero: il suo valore di likelihood. La stima ML è una ricerca nello spazio dei parametri che confronta le candidate tramite questo numero.`,
  },
  {
    id: 'fc-best-agrees',
    kind: 'intuizione',
    q: md`Che cosa vuol dire che la stima ML è il $\boldsymbol{\theta}$ che «in some sense best agrees» con i campioni osservati?`,
    a: md`La pdf che si accorda meglio è quella che mette densità alta proprio nei punti in cui i campioni sono caduti. Le note dicono «most closely aligns with the observed training samples». «In some sense» precisa che l'accordo si misura con la likelihood stessa, non con altri criteri come la distanza tra istogramma e pdf.`,
  },
  {
    id: 'fc-lettura-probabilistica',
    kind: 'definizione',
    q: md`Lettura probabilistica delle note: che cosa massimizza ML, e che cosa invece **non** è $p(\mathbf{X} \mid \boldsymbol{\theta})$?`,
    a: md`ML massimizza la probabilità di osservare proprio i dati raccolti, sotto il modello (*maximizing the probability of observing the given data under the model*). In ML $\boldsymbol{\theta}$ è un vettore di quantità fisse ma ignote (*fixed but unknown*), senza prior.

- Con feature continue $p(\mathbf{X} \mid \boldsymbol{\theta})$ è una densità e può superare 1; con dati discreti (una parola presente o no in un'email) è davvero la probabilità del dataset.
- Non è la probabilità di $\boldsymbol{\theta}$ dati i campioni, $p(\boldsymbol{\theta} \mid \mathbf{X})$: quella appartiene alla stima bayesiana.`,
  },
  // --- log-likelihood, equazioni di verosimiglianza, invarianza (c07-c11, c67) ---
  {
    id: 'fc-log-likelihood',
    kind: 'definizione',
    q: md`Perché si lavora con la log-likelihood (*log-likelihood*) invece che con la likelihood?`,
    a: md`La slide dice «for analytical purposes»: è più comodo.

$$l(\boldsymbol{\theta}) = \ln p(\mathbf{X} \mid \boldsymbol{\theta})$$

- La likelihood di $N$ campioni iid è un prodotto di $N$ fattori: scomodo da derivare e numericamente minuscolo (nell'esempio di ch2 p10, con una dozzina di campioni, vale circa $10^{-7}$).
- Molti modelli, a partire dal gaussiano, contengono un esponenziale che il logaritmo elimina.`,
  },
  {
    id: 'fc-monotonia-logaritmo',
    kind: 'proprieta',
    q: md`Perché massimizzare la log-likelihood dà la stessa stima che massimizzare la likelihood?`,
    a: md`Il logaritmo è monotono crescente (*monotonically increasing*): se $p(\mathbf{X} \mid \boldsymbol{\theta}_1) > p(\mathbf{X} \mid \boldsymbol{\theta}_2)$ allora anche i loro logaritmi stanno nello stesso ordine. La classifica dei candidati non cambia, quindi

$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta})$$

Cambia il **valore** del massimo (il logaritmo di un numero minore di 1 è negativo), non la sua **posizione**. Dove la likelihood vale 0 la log-likelihood vale $-\infty$: quel $\boldsymbol{\theta}$ resta escluso.`,
  },
  {
    id: 'fc-prodotti-in-somme',
    kind: 'formula',
    q: md`Come diventa la log-likelihood di $N$ campioni iid, e quali vantaggi porta?`,
    a: md`$$\ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \ln \prod_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta}) = \sum_{k=1}^{N} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})$$

Il logaritmo trasforma il prodotto in somma (*converts products into sums*), perché $\ln(ab) = \ln a + \ln b$. La somma si deriva termine a termine, ogni campione contribuisce in modo additivo al gradiente e il calcolo non va in underflow: un prodotto di migliaia di fattori minori di 1 scende sotto il più piccolo numero positivo della doppia precisione (circa $5 \cdot 10^{-324}$; i numeri normalizzati arrivano a circa $2 \cdot 10^{-308}$) e diventa zero.`,
  },
  {
    id: 'fc-equazioni-verosimiglianza',
    kind: 'procedura',
    q: md`Come si calcola in pratica l'$\arg\max$ quando la log-likelihood è derivabile?`,
    a: md`Se il massimo cade all'interno dello spazio dei parametri, la stima ML annulla il gradiente:

$$\nabla_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \sum_{k=1}^{N} \nabla_{\boldsymbol{\theta}} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta}) = \mathbf{0}$$

cioè $r$ equazioni, una per parametro, $\partial \ln p(\mathbf{X} \mid \boldsymbol{\theta}) / \partial \theta_i = 0$ per $i = 1, \ldots, r$: le equazioni di verosimiglianza (*likelihood equations*). La fonte non le scrive in queste pagine, ma all'orale Melgani chiede di «develop the first derivative».`,
  },
  {
    id: 'fc-ricetta-esercizio-ml',
    kind: 'procedura',
    q: md`Ricetta in cinque passi per applicare ML a un esercizio.`,
    a: md`1. Scrivi il modello $p(x \mid \boldsymbol{\theta})$.
2. Scrivi la likelihood come prodotto sui campioni iid.
3. Passa al logaritmo: il prodotto diventa somma.
4. Deriva rispetto a ogni parametro e poni la derivata uguale a zero.
5. Risolvi e verifica che sia un massimo (derivata seconda negativa, o bordo dello spazio dei parametri).`,
  },
  {
    id: 'fc-verifica-massimo',
    kind: 'procedura',
    q: md`Il gradiente nullo basta a trovare la stima ML? Come controlli e quando non c'è forma chiusa?`,
    a: md`È una condizione **necessaria**, non sufficiente: il punto stazionario può essere un minimo, una sella o un massimo solo locale.

$$\left. \frac{\partial^2 \ln p(\mathbf{X} \mid \theta)}{\partial \theta^2} \right|_{\theta = \hat{\theta}} < 0$$

Con $r$ parametri serve l'hessiana definita negativa. Per la media gaussiana la derivata seconda vale $-N/\sigma^2$: parabola rivolta in basso, massimo unico. Per le misture di gaussiane le equazioni non hanno forma chiusa e ci sono più massimi locali: si usa un metodo iterativo, l'algoritmo EM.`,
  },
  {
    id: 'fc-uniforme-massimo-bordo',
    kind: 'intuizione',
    q: md`Uniforme su $[0, \theta]$: perché la stima ML si trova senza derivata nulla, e quanto è distorta?`,
    a: md`$$p(\mathbf{X} \mid \theta) = \begin{cases} \theta^{-N} & \theta \geq \max_k x_k \\ 0 & \text{altrimenti} \end{cases}$$

Per $\theta \geq \max_k x_k$ la likelihood decresce con $\theta$, sotto vale 0: il massimo cade sul bordo, $\hat{\theta} = \max_k x_k$, dove la derivata non si annulla. La stima sottostima sempre: $E\{\hat{\theta}\} = \frac{N}{N+1}\,\theta$, quindi è distorta con $N$ finito e asintoticamente non distorta. Il supporto dipende da $\theta$: il modello viola le ipotesi di regolarità.`,
  },
  {
    id: 'fc-invarianza-ml',
    kind: 'proprieta',
    q: md`Che cosa dice la proprietà di invarianza della stima ML, e che cosa non conserva?`,
    a: md`$$\widehat{g(\theta)} = g(\hat{\theta})$$

Se cambi parametro con una funzione invertibile $g$, il massimo della likelihood resta lo stesso punto, etichettato in modo diverso. Esempi: $\hat{\sigma} = \sqrt{\hat{\sigma}^2}$; nell'esponenziale il tasso stimato è l'inverso della media stimata. L'invarianza riguarda il valore della stima, non il bias: se $\hat{\theta}$ è non distorta, $g(\hat{\theta})$ in generale non lo è. È un'integrazione, la fonte non la cita.`,
  },
  // --- esempio della fonte (c12-c17) ---
  {
    id: 'fc-esempio-una-osservazione',
    kind: 'definizione',
    q: md`Enuncia l'esempio della slide «ML Estimation: Example» (ch2 p18) e scrivi la sua likelihood.`,
    a: md`«ML estimation of the mean of a mono-dimensional Gaussian pdf ($\hat{m}$) with known variance basing on a single observation $x_0$». Un solo parametro ($\theta = m$), un solo campione ($N = 1$): la likelihood coincide con la pdf valutata in $x_0$.

$$p(\mathbf{X} \mid \boldsymbol{\theta}) = p(x_0 \mid m) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[ -\frac{(x_0 - m)^2}{2\sigma^2} \right]$$

La slide non scrive la formula: mostra solo la figura.`,
  },
  {
    id: 'fc-perche-varianza-nota',
    kind: 'intuizione',
    q: md`Perché l'esempio con una sola osservazione richiede la varianza **nota**?`,
    a: md`Con $\sigma$ incognita e un solo campione, nel punto $m = x_0$ la likelihood vale $\frac{1}{\sigma\sqrt{2\pi}}$ e cresce senza limite per $\sigma \to 0$: stringendo la campana sull'unica osservazione la likelihood esplode. Il massimo non esiste e la stima sarebbe degenere. Con $\sigma$ fissata resta un solo grado di libertà, la posizione della campana.`,
  },
  {
    id: 'fc-figura-ml-search',
    kind: 'intuizione',
    q: md`Descrivi la figura «ML search» di ch2 p18.`,
    a: md`Asse orizzontale da $-6$ a $6$. Cinque campane di uguale larghezza e altezza (la varianza è nota), centrate circa in $-2$ (viola), $-1.5$ (rossa), $0$ (blu), $1$ (verde) e $1.5$ (magenta): cinque medie candidate. A sinistra la scritta «ML search» con una doppia freccia: la ricerca consiste nel far scorrere la campana lungo l'asse, cioè nel variare $m$. Dalla larghezza si legge $\sigma \approx 1$.`,
  },
  {
    id: 'fc-verticale-x0',
    kind: 'procedura',
    q: md`Come si legge la likelihood di ogni candidata nella figura, e quali valori danno le cinque campane con $\sigma = 1$ e $x_0 = 1$?`,
    a: md`Dall'osservazione $x_0$ (circa $1$) sale una verticale tratteggiata; i trattini orizzontali segnano la quota a cui ogni campana la interseca, cioè $p(x_0 \mid m)$. L'asse verticale pieno è etichettato «Likelihood».

| $m$ | $-2$ | $-1.5$ | $0$ | $1$ | $1.5$ |
|---|---|---|---|---|---|
| $p(x_0 \mid m)$ | $0.0044$ | $0.0175$ | $0.2420$ | $0.3989$ | $0.3521$ |

La quota massima è quella della verde, il cui picco cade su $x_0$ (valori ricostruiti dalla figura, la slide non dà numeri).`,
  },
  {
    id: 'fc-risultato-mhat-x0',
    kind: 'formula',
    q: md`Qual è il risultato dell'esempio e perché?`,
    a: md`$$\Rightarrow \; \hat{m} = x_0$$

Il picco della gaussiana sta nella media: la candidata che dà la quota più alta sulla verticale di $x_0$ è la campana centrata su $x_0$. Spostando $m$ a destra o a sinistra la quota scende. Con un solo campione la stima è non distorta ($E\{x_0\} = m$) ma ha varianza $\sigma^2$, quella di una singola misura.`,
  },
  {
    id: 'fc-likelihood-campana-in-m',
    kind: 'intuizione',
    q: md`Che forma ha la likelihood dell'esempio vista come funzione di $m$?`,
    a: md`$$L(m) = p(x_0 \mid m) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[ -\frac{(m - x_0)^2}{2\sigma^2} \right]$$

$x_0$ e $m$ compaiono solo nel quadrato $(x_0 - m)^2$, quindi scambiare i ruoli non cambia la forma: è una campana di larghezza $\sigma$ centrata in $x_0$. I trattini della figura ne sono cinque punti. Con $N$ campioni la campana si centra nella media campionaria e si stringe a larghezza $\sigma/\sqrt{N}$. Questa simmetria vale per la gaussiana con varianza nota, non per un modello qualunque.`,
  },
  {
    id: 'fc-pdf-contro-likelihood',
    kind: 'confronto',
    q: md`Pdf e likelihood: stessa espressione $p(x \mid \theta)$, che cosa cambia?`,
    a: md`- **Pdf**: $\theta$ fissato, la variabile è $x$, l'area sotto la curva vale 1. Nella figura sono le cinque campane colorate.
- **Likelihood**: dati fissati, la variabile è $\theta$; l'integrale in $\theta$ in generale non vale 1, quindi non è una densità su $\theta$.

$$\int p(x \mid \theta)\, dx = 1 \qquad \text{mentre in generale} \qquad \int p(\mathbf{X} \mid \theta)\, d\theta \neq 1$$

La likelihood descrive la compatibilità tra un valore dei parametri e i campioni osservati.`,
  },
  // --- N campioni: media campionaria e suo significato (c18-c19) ---
  {
    id: 'fc-media-campionaria-ml',
    kind: 'formula',
    q: md`Stima ML della media gaussiana con $N$ campioni iid (varianza nota): risultato scalare e vettoriale.`,
    a: md`$$\hat{m} = \frac{1}{N} \sum_{k=1}^{N} x_k \qquad \hat{\mathbf{m}} = \frac{1}{N} \sum_{k=1}^{N} \mathbf{x}_k$$

È la media campionaria (*sample mean*). Per $N = 1$ ritrovi $\hat{m} = x_0$ dell'esempio. La varianza nota $\sigma^2$ si semplifica: la stima della media non dipende da $\sigma$. La fonte enuncia il risultato in ch2 p31 («it can be shown»); i passaggi sono nella dimostrazione [«derivata prima per una gaussiana con N campioni»](#derivation:der04).`,
  },
  {
    id: 'fc-derivata-prima-gaussiana',
    kind: 'procedura',
    q: md`Sviluppa la derivata prima della log-likelihood gaussiana rispetto a $m$ ($\sigma$ nota).`,
    a: md`$$\ln p(\mathbf{X} \mid m) = -N \ln\left(\sigma\sqrt{2\pi}\right) - \frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - m)^2$$

$$\frac{\partial \ln p(\mathbf{X} \mid m)}{\partial m} = \frac{1}{\sigma^2} \sum_{k=1}^{N} (x_k - m) = 0 \;\Rightarrow\; \hat{m} = \frac{1}{N} \sum_{k=1}^{N} x_k$$

La derivata seconda vale $-N/\sigma^2 < 0$: è un massimo, unico e globale.`,
  },
  {
    id: 'fc-significato-media-ml',
    kind: 'intuizione',
    q: md`«Explain the meaning of the result»: che cosa significa che la stima ML della media è la media campionaria?`,
    a: md`- $\sum_{k=1}^{N} (x_k - \hat{m}) = 0$: la stima è il baricentro dei campioni, gli scarti positivi e negativi si compensano. Ogni campione tira la media verso di sé con forza $(x_k - m)/\sigma^2$.
- Massimizzare la likelihood gaussiana equivale a minimizzare la somma dei quadrati degli scarti: ML con rumore gaussiano coincide con i minimi quadrati.
- $E\{\hat{m}\} = m$ e $\mathrm{var}\{\hat{m}\} = \sigma^2/N$, uguale al bound di Cramér-Rao: la media campionaria è efficiente.`,
  },
  {
    id: 'fc-ml-minimi-quadrati',
    kind: 'confronto',
    q: md`Scrivi l'equivalenza tra ML gaussiana e minimi quadrati (*least squares*).`,
    a: md`$$\hat{m} = \arg\max_{m} \ln p(\mathbf{X} \mid m) = \arg\min_{m} \sum_{k=1}^{N} (x_k - m)^2$$

Nella log-likelihood gaussiana $m$ compare solo in $-\frac{1}{2\sigma^2}\sum_k (x_k - m)^2$: massimizzare un termine negativo equivale a minimizzare la somma dei quadrati. Con una laplaciana (gaussiana generalizzata con $\beta = 1$) comparirebbe $\sum_k \vert x_k - m \vert$ e la stima sarebbe la mediana.`,
  },
  // --- proprietà di ML (c20-c28) ---
  {
    id: 'fc-stima-efficiente-richiamo',
    kind: 'definizione',
    q: md`Richiamo: quando una stima è efficiente (*efficient estimate*)?`,
    a: md`Quando è non distorta e la varianza del suo errore raggiunge il bound di Cramér-Rao per ogni parametro:

$$\mathrm{var}\{\varepsilon_i\} \geq [\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}, \quad i = 1, 2, \ldots, r$$

con l'uguaglianza. $\mathrm{I}(\boldsymbol{\theta})$ è la matrice di informazione di Fisher, $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$. Una stima efficiente non esiste per ogni problema: il bound può non essere raggiungibile con $N$ finito.`,
  },
  {
    id: 'fc-teorema-efficienza-ml',
    kind: 'proprieta',
    q: md`Primo punto della slide «ML Estimation: Properties»: che cosa afferma?`,
    a: md`«In certain hypotheses regarding $p(\mathbf{x} \mid \boldsymbol{\theta})$, it can be shown that, if it exists an efficient estimate and if the ML estimate is unbiased, then the efficient estimate is that provided by ML estimation».

Due ipotesi: esiste una stima efficiente, e la stima ML è non distorta. Conclusione: la stima efficiente è quella ML, non serve cercare altrove. La fonte non dà la dimostrazione. Esempio: la media campionaria gaussiana è ML, non distorta, con varianza $\sigma^2/N$ uguale al bound.`,
  },
  {
    id: 'fc-ipotesi-regolarita',
    kind: 'definizione',
    q: md`Che cosa nasconde «in certain hypotheses regarding $p(\mathbf{x} \mid \boldsymbol{\theta})$»?`,
    a: md`Le condizioni di regolarità (*regularity conditions*), che la fonte non elenca: log-likelihood derivabile rispetto a $\boldsymbol{\theta}$, supporto di $p(\mathbf{x} \mid \boldsymbol{\theta})$ indipendente da $\boldsymbol{\theta}$, derivata e integrale scambiabili, informazione di Fisher finita e non nulla. Sono le stesse del bound di Cramér-Rao. Controesempio classico: l'uniforme su $[0, \theta]$, il cui supporto dipende dal parametro. All'esame basta dire «sotto opportune ipotesi di regolarità su $p(\mathbf{x} \mid \boldsymbol{\theta})$».`,
  },
  {
    id: 'fc-tre-proprieta-asintotiche',
    kind: 'proprieta',
    q: md`Che cosa garantisce ML anche quando una stima efficiente non esiste?`,
    a: md`«Even if it does not exist an efficient estimate, the ML estimate exhibits good asymptotic properties since it is:»

1. asintoticamente non distorta (*asymptotically unbiased*);
2. asintoticamente efficiente (*asymptotically efficient*);
3. consistente (*consistent*).

È la risposta a «Is Maximum Likelihood Estimation a good estimator?»: sì, perché ha tutte e tre le buone proprietà asintotiche.`,
  },
  {
    id: 'fc-asintoticamente-non-distorta',
    kind: 'formula',
    q: md`Scrivi in formula la non distorsione asintotica della stima ML.`,
    a: md`$$\lim_{N \to +\infty} E\{\boldsymbol{\varepsilon}\} = \mathbf{0} \;\Rightarrow\; \lim_{N \to +\infty} E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$$

Le note: «As the sample size approaches infinity, the ML estimate converges in expectation to the true parameter value». Con $N$ finito la stima può essere distorta: il bias svanisce solo al crescere di $N$.`,
  },
  {
    id: 'fc-asintoticamente-efficiente',
    kind: 'formula',
    q: md`Scrivi in formula l'efficienza asintotica. Perché si guarda un rapporto?`,
    a: md`$$\lim_{N \to +\infty} \frac{\mathrm{var}\{\varepsilon_i\}}{[\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1, \quad i = 1, 2, \ldots, r$$

Varianza e bound tendono entrambi a zero come $1/N$: la loro differenza tende a zero per qualsiasi stimatore con varianza che si annulla, quindi non dice nulla. Il rapporto che tende a 1 dice che la varianza si comporta come il bound. Le note: «achieves the lowest possible variance among all unbiased estimators as the sample size increases».`,
  },
  {
    id: 'fc-consistenza-ml',
    kind: 'formula',
    q: md`Scrivi in formula la consistenza e spiega perché ML la soddisfa.`,
    a: md`$$\lim_{N \to +\infty} P\{\lVert \boldsymbol{\varepsilon} \rVert < \delta\} = 1 \qquad \forall \delta > 0$$

È una convergenza in probabilità. Basta che la stima sia asintoticamente non distorta e con varianza che tende a zero (l'errore quadratico medio va a zero, poi la disuguaglianza di Chebyshev). ML ha entrambe le cose: il bias svanisce e la varianza segue il bound, che scende come $1/N$. La slide ch2 p16 chiama questa coppia «necessary condition»; a rigore è una condizione sufficiente.`,
  },
  {
    id: 'fc-uso-diffuso-ml',
    kind: 'intuizione',
    q: md`Perché ML è così usata nei problemi reali? Dove la ritrovi nel corso?`,
    a: md`La slide: «Such properties are behind the common use of ML estimation in numerous real problems». Le note aggiungono che la rendono un metodo preferito in statistica e machine learning. Nel corso: parametri delle gaussiane di classe, algoritmo EM per le misture, parametri delle reti bayesiane con dati completi (Passerini), minimi quadrati e cross-entropy come casi particolari di ML.`,
  },
  {
    id: 'fc-covarianza-ml-distorta',
    kind: 'formula',
    q: md`Con $N$ finito la stima ML può essere distorta: scrivi l'esempio della covarianza gaussiana.`,
    a: md`$$\hat{\Sigma} = \frac{1}{N} \sum_{k=1}^{N} (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t, \qquad E\{\hat{\Sigma}\} = \frac{N-1}{N}\, \Sigma$$

Divide per $N$ e sottostima sistematicamente. Lo stimatore non distorto elementare (*elementary unbiased estimator*, ch2 p31) divide per $N - 1$. Il fattore $(N-1)/N$ tende a 1: la stima è asintoticamente non distorta. La media ML invece è non distorta per ogni $N$.`,
  },
  {
    id: 'fc-ml-buon-stimatore',
    kind: 'confronto',
    q: md`«Is Maximum Likelihood Estimation a good estimator?»: risposta in tre punti.`,
    a: md`1. Criterio di bontà: bias, varianza confrontata con il bound di Cramér-Rao, proprietà asintotiche.
2. Sotto ipotesi di regolarità, se esiste una stima efficiente e ML è non distorta, la stima efficiente è ML.
3. Anche senza stima efficiente, ML è asintoticamente non distorta, asintoticamente efficiente e consistente.

Limite: con pochi campioni può essere distorta, come la varianza gaussiana che divide per $N$ (valore atteso $\frac{N-1}{N}\sigma^2$).`,
  },
  // --- selezione del modello statistico (c29-c34, c43, c44) ---
  {
    id: 'fc-tre-aspetti-selezione',
    kind: 'procedura',
    q: md`Quali tre aspetti considera la slide «Statistical Model Selection» nella scelta del modello di $p(\mathbf{x})$?`,
    a: md`1. La natura statistica intrinseca (*intrinsic statistical nature*) del fenomeno fisico analizzato.
2. Il rumore (*noise*) introdotto nelle fasi di trasmissione e acquisizione del segnale (passivo/attivo) dal mezzo di propagazione (*propagation medium*) e dal sensore (*sensor*), rispettivamente.
3. Il pre-processing e l'estrazione delle feature (*feature extraction*) adottati prima di alimentare il sistema di riconoscimento.

I tre aspetti seguono il percorso del dato, dal fenomeno al classificatore.`,
  },
  {
    id: 'fc-natura-intrinseca',
    kind: 'intuizione',
    q: md`Primo aspetto: come la natura del fenomeno suggerisce la famiglia di pdf? Tre esempi.`,
    a: md`- Una grandezza non negativa, come un'ampiezza o un tempo di attesa, non può essere esattamente gaussiana.
- L'ampiezza dell'eco radar retrodiffusa da molti diffusori elementari segue una Rayleigh.
- Una grandezza che nasce dalla somma di molte cause indipendenti è gaussiana per il teorema del limite centrale.`,
  },
  {
    id: 'fc-rumore-trasmissione-acquisizione',
    kind: 'definizione',
    q: md`Secondo aspetto: da dove viene il rumore, e che cosa indica «(passive/active)»?`,
    a: md`«Respectively» accoppia fasi e sorgenti: in **trasmissione** il rumore viene dal mezzo di propagazione (atmosfera, acqua, terreno), in **acquisizione** dal sensore.

Sulla slide «(passive/active)» qualifica il segnale o il sistema: passivo se misura energia già presente (sensore ottico con luce solare), attivo se emette il proprio segnale (radar, GPR, sonar). Le note invece scrivono «propagation medium (passive) or the sensors (active)». La lettura della slide è la più aderente. In ogni caso il rumore modifica la pdf osservata.`,
  },
  {
    id: 'fc-preprocessing-cambia-pdf',
    kind: 'intuizione',
    q: md`Terzo aspetto: perché il pre-processing cambia il modello da scegliere? Esempi.`,
    a: md`Ogni trasformazione cambia la distribuzione:

- il quadrato di una gaussiana standard è una chi-quadro con 1 grado di libertà;
- il modulo di due gaussiane indipendenti a media nulla e con la stessa varianza è una Rayleigh;
- il logaritmo di una log-normale è una gaussiana;
- la media di molti valori tende alla gaussiana.

Scegli il modello per la feature che entra davvero nel classificatore, non per il segnale grezzo.`,
  },
  {
    id: 'fc-passi-migliorano-modello',
    kind: 'intuizione',
    q: md`Che cosa aggiungono le note dopo i tre aspetti?`,
    a: md`«Properly selecting and applying these steps can enhance the effectiveness of the chosen statistical model». Il legame vale nei due sensi: le elaborazioni condizionano il modello, e puoi progettarle apposta per avvicinare i dati a un modello semplice, per esempio applicare il logaritmo per ottenere feature quasi gaussiane.`,
  },
  {
    id: 'fc-sei-modelli',
    kind: 'definizione',
    q: md`Quali sono i sei modelli statistici popolari della slide ch2 p21, con l'uso tipico secondo le note?`,
    a: md`| Modello | Uso tipico (note, part1 p21) |
|---|---|
| gaussiano (*Gaussian*) | dati con distribuzione normale |
| gaussiano generalizzato (*Generalized Gaussian*) | alternativa flessibile |
| Gamma | dati continui non negativi, teoria delle code |
| Rayleigh | radar e comunicazioni, segnali diffusi |
| chi-quadro (*Chi-square*) | test di ipotesi, bontà di adattamento |
| log-normale (*Log-Normal*) | variabili con asimmetria positiva, dati finanziari |

Due hanno supporto su tutta la retta (gaussiano e gaussiano generalizzato), quattro solo su $x \geq 0$.`,
  },
  {
    id: 'fc-scelta-non-banale',
    kind: 'intuizione',
    q: md`Perché le note dicono che scegliere il modello è «vital» e «not a trivial task»?`,
    a: md`«Choosing the right model is vital for accurately capturing the underlying processes»; dopo la galleria: «Model selection is not a trivial task». Con pochi campioni famiglie diverse, come Gamma e log-normale, si adattano quasi ugualmente bene allo stesso istogramma. Un modello sbagliato si propaga a tutto ciò che segue: stime dei parametri, classificatore bayesiano, probabilità d'errore. Se nessun modello parametrico è credibile passi alla stima non parametrica (K-NN, Parzen).`,
  },
  {
    id: 'fc-ml-dentro-la-famiglia',
    kind: 'confronto',
    q: md`Perché la fonte passa da ML alla scelta del modello? Che cosa fa ML e che cosa non fa?`,
    a: md`$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta})$ cerca il massimo solo tra le pdf della famiglia $p(\mathbf{x} \mid \boldsymbol{\theta})$ fissata in partenza: risponde a «quali parametri?», non a «quale famiglia?». Le buone proprietà di ML valgono assumendo che i dati vengano davvero da un membro della famiglia. Con un modello sbagliato ML converge ai parametri migliori di quel modello sbagliato. Per questo la scelta del modello viene prima della stima.`,
  },
  // --- galleria dei sei modelli (c35-c42) ---
  {
    id: 'fc-modello-gaussiano',
    kind: 'formula',
    q: md`Modello gaussiano della galleria: formula e lettura delle quattro curve.`,
    a: md`$$f(x; \mu, \sigma) = \frac{1}{\sigma\sqrt{2\pi}} \, e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

Curve (asse da $-5$ a $5$): $\mu = 0$ con $\sigma^2 = 0.2$ (picco circa $0.89$), $1.0$ (circa $0.40$), $5.0$ (circa $0.18$); $\mu = -2$ con $\sigma^2 = 0.5$ (circa $0.56$). $\mu$ sposta la campana, $\sigma^2$ la allarga; l'area resta 1, quindi una campana più larga è più bassa: il picco vale $1/(\sigma\sqrt{2\pi})$.`,
  },
  {
    id: 'fc-gaussiana-generalizzata',
    kind: 'formula',
    q: md`Gaussiana generalizzata: formula e ruolo di $m$, $b$ e $\beta$.`,
    a: md`$$f(x; m, b, \beta) = \frac{b\beta}{2\Gamma(1/\beta)} \, e^{-\left[ b|x-m| \right]^{\beta}}$$

$m$ è la posizione, $b$ un parametro di scala (inverso della larghezza), $\beta$ il parametro di forma (*shape parameter*). Curve della galleria: $\beta = 0.8$ cuspide appuntita, $\beta = 1$ laplaciana, $\beta = 2$ gaussiana, $\beta = 10$ quasi rettangolare; per $\beta \to \infty$ tende all'uniforme. $\Gamma(\cdot)$ è la funzione Gamma di Eulero.`,
  },
  {
    id: 'fc-modello-gamma',
    kind: 'formula',
    q: md`Modello Gamma: formula, parametri, momenti.`,
    a: md`$$f(x; k, \theta) = x^{k-1} \, \frac{e^{-x/\theta}}{\theta^{k} \, \Gamma(k)} \quad \text{for } x > 0$$

$k$ è la forma, $\theta$ la scala: qui $\theta$ è la notazione della figura, non il vettore dei parametri della stima ML. Media $k\theta$, varianza $k\theta^2$, moda $(k-1)\theta$ per $k \geq 1$. Con $k = 1$ è l'esponenziale (curva rossa, parte da $0.5$ con $\theta = 2$); al crescere di $k$ la curva diventa più simmetrica. Uso: dati continui non negativi, teoria delle code.`,
  },
  {
    id: 'fc-modello-rayleigh',
    kind: 'formula',
    q: md`Modello di Rayleigh: formula, forma delle curve, origine.`,
    a: md`$$f(x \mid \sigma) = \frac{x \exp\left( \frac{-x^2}{2\sigma^2} \right)}{\sigma^2}$$

Un solo parametro $\sigma$, supporto $x \geq 0$, parte da zero, asimmetrica a destra. Moda in $x = \sigma$ con picco $1/(\sigma\sqrt{e})$: con $\sigma = 1$ circa $0.6$, con $\sigma = 0.5$ circa $1.2$. È la pdf del modulo di un vettore con due componenti gaussiane indipendenti a media nulla e stessa $\sigma$: per questo descrive l'ampiezza dei segnali radar diffusi.`,
  },
  {
    id: 'fc-modello-chi-quadro',
    kind: 'formula',
    q: md`Modello chi-quadro: formula, parametro, origine e momenti.`,
    a: md`$$f(x; k) = \frac{(1/2)^{k/2}}{\Gamma(k/2)} \, x^{k/2-1} e^{-x/2}$$

$k$ sono i gradi di libertà (*degrees of freedom*): è la pdf della somma dei quadrati di $k$ gaussiane standard indipendenti. Media $k$, varianza $2k$, moda $\max(k-2, 0)$. Nella galleria $k = 1$ diverge in zero, $k = 2$ è un'esponenziale che parte da $0.5$. Uso: test di ipotesi e bontà di adattamento (*goodness-of-fit*).`,
  },
  {
    id: 'fc-modello-lognormale',
    kind: 'formula',
    q: md`Modello log-normale: formula e significato di $\mu$ e $\sigma$.`,
    a: md`$$f(x; \mu, \sigma) = \frac{e^{-(\ln x - \mu)^2 / (2\sigma^2)}}{x \sigma \sqrt{2\pi}}$$

$x$ è log-normale se $\ln x$ è gaussiana: $\mu$ e $\sigma$ sono media e deviazione standard di $\ln x$, non di $x$. Moda $e^{\mu-\sigma^2}$, mediana $e^{\mu}$, media $e^{\mu+\sigma^2/2}$. Nella galleria ($\mu = 0$) con $\sigma$ piccola la curva è quasi simmetrica attorno a 1, con $\sigma$ grande molto asimmetrica. Uso: variabili con asimmetria positiva, dati finanziari.`,
  },
  {
    id: 'fc-galleria-modelli',
    kind: 'intuizione',
    q: md`Come è organizzata la galleria dei modelli di part1 p22 e che cosa mostra?`,
    a: md`Una griglia $3 \times 2$: Gaussian e Generalized Gaussian in alto, Gamma e Rayleigh al centro, Chi-Square e Log-Normal in basso. Ogni pannello ha titolo, legenda dei parametri e formula sotto. La prima riga contiene modelli simmetrici definiti su tutta la retta; le altre due, modelli per grandezze non negative e asimmetriche. In ogni pannello vedi come i parametri cambiano posizione, larghezza e forma. Sono gli stessi grafici delle slide «PDF Examples».`,
  },
  {
    id: 'fc-parentele-modelli',
    kind: 'confronto',
    q: md`Quali parentele legano i sei modelli della galleria?`,
    a: md`- Gaussiana = gaussiana generalizzata con $\beta = 2$.
- $x \sim \chi^2_k \iff x \sim \mathrm{Gamma}(k/2, \; \theta = 2)$; la Gamma con $k = 1$ è l'esponenziale.
- $z_1, z_2 \sim N(0, \sigma^2)$ indipendenti $\Rightarrow \sqrt{z_1^2 + z_2^2} \sim \mathrm{Rayleigh}(\sigma)$.
- $\ln x \sim N(\mu, \sigma^2) \iff x \sim$ log-normale$(\mu, \sigma)$.

Quasi tutti nascono dalla gaussiana attraverso una trasformazione (terzo aspetto della scelta del modello).`,
  },
  {
    id: 'fc-stessa-curva-gamma-chi',
    kind: 'proprieta',
    q: md`Nella galleria, quali due curve di pannelli diversi sono la stessa funzione?`,
    a: md`La curva rossa del pannello Gamma ($k = 1$, $\theta = 2$) e la curva $k = 2$ del pannello chi-quadro: entrambe valgono $\frac{1}{2} e^{-x/2}$ e partono da $0.5$. È un caso della regola $\chi^2_k = \mathrm{Gamma}(k/2, \theta = 2)$ con $k = 2$.`,
  },
  // --- modello gaussiano e limite centrale (c45-c48) ---
  {
    id: 'fc-gaussiana-parametrica',
    kind: 'definizione',
    q: md`Come introducono le note il modello gaussiano, e che cosa vuol dire «parametric»?`,
    a: md`«The Gaussian model is a widely used parametric model in numerous applications. Its popularity is largely due to the Central Limit Theorem». Parametrico significa che la pdf è descritta completamente da un numero finito di parametri, media e (co)varianza: proprio ciò che ML stimerà.`,
  },
  {
    id: 'fc-limite-centrale',
    kind: 'formula',
    q: md`Enuncia il teorema del limite centrale (*Central Limit Theorem*, CLT) come nella fonte e in forma standardizzata.`,
    a: md`«If the sum of many independent and identically distributed (iid) random variables has finite variance, then the sum will be approximately normally distributed».

Ipotesi: molte variabili, iid, varianza finita. Tesi: somma circa gaussiana, qualunque sia la pdf dei singoli addendi.

$$S_n = \sum_{i=1}^{n} x_i, \qquad \frac{S_n - n\mu}{\sigma\sqrt{n}} \;\xrightarrow{\; n \to \infty \;}\; N(0, 1)$$

La somma è vicina a una gaussiana di media $n\mu$ e varianza $n\sigma^2$.`,
  },
  {
    id: 'fc-ubiquita-gaussiana',
    kind: 'intuizione',
    q: md`Perché il teorema del limite centrale spiega l'ubiquità della gaussiana?`,
    a: md`Molti fenomeni naturali e industriali nascono dalla combinazione di numerosi fattori indipendenti, ognuno con un piccolo effetto. Sommandosi producono distribuzioni ben approssimate da una gaussiana, soprattutto se la varianza totale è finita. La slide ch2 p25: «many real processes take origin from many independent causes». È il primo aspetto della scelta del modello applicato al caso più comune.`,
  },
  {
    id: 'fc-campi-gaussiana',
    kind: 'intuizione',
    q: md`In quali campi le note dicono che la pdf gaussiana è adottata, e dove la ritrovi nel corso?`,
    a: md`Note: dall'elaborazione dei segnali (*signal processing*) e dal machine learning all'economia e all'ingegneria, per modellare e analizzare dati. Nel corso: modello di classe dei classificatori bayesiani (funzioni discriminanti), componente delle misture stimate con EM, prior e likelihood della stima bayesiana, kernel più usato nelle finestre di Parzen.`,
  },
  // --- gaussiana multivariata (c49-c55) ---
  {
    id: 'fc-gaussiana-multivariata',
    kind: 'formula',
    q: md`Scrivi la pdf gaussiana multivariata (domanda d'orale di Melgani).`,
    a: md`$$p(\mathbf{x} \mid \theta) = p(\mathbf{x} \mid \mathbf{m}, \Sigma) = \frac{1}{(2\pi)^{n/2} |\Sigma|^{1/2}} \exp\left[ -\frac{1}{2} (\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m}) \right]$$

Due parti: la costante di normalizzazione, che garantisce integrale unitario, e un esponenziale con argomento $-\frac{1}{2}$ per una forma quadratica in $(\mathbf{x} - \mathbf{m})$. La scrittura $p(\mathbf{x} \mid \theta) = p(\mathbf{x} \mid \mathbf{m}, \Sigma)$ dice che qui $\theta = (\mathbf{m}, \Sigma)$. Serve $\Sigma$ invertibile.`,
  },
  {
    id: 'fc-simboli-multivariata',
    kind: 'definizione',
    q: md`Che cosa sono $\mathbf{x}$, $n$, $\mathbf{m}$, $\Sigma$ e $|\Sigma|$ nella formula multivariata? Che cosa succede con $n = 1$?`,
    a: md`- $\mathbf{x} = (x_1, \ldots, x_n)^t$: vettore di feature $n$-dimensionale (colonna).
- $\mathbf{m} = (m_1, \ldots, m_n)^t$: vettore medio.
- $\Sigma$: matrice di covarianza $n \times n$; $|\Sigma|$ il suo determinante, che misura il volume della nuvola (varianza generalizzata).

La forma quadratica $(\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m})$ è uno scalare. Con $n = 1$: $\Sigma = \sigma^2$, $|\Sigma|^{1/2} = \sigma$ e ritrovi la gaussiana 1-D della galleria.`,
  },
  {
    id: 'fc-distanza-mahalanobis',
    kind: 'definizione',
    q: md`Che cos'è la distanza di Mahalanobis (*Mahalanobis distance*) e che ruolo ha nella gaussiana?`,
    a: md`$$d^2(\mathbf{x}, \mathbf{m}) = (\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m})$$

Le note chiamano così la forma quadratica; a rigore ne è il **quadrato**. Misura la distanza da $\mathbf{m}$ in unità di deviazione standard lungo ogni direzione, tenendo conto delle correlazioni. Con $\Sigma = I$ diventa la distanza euclidea al quadrato. La densità dipende da $\mathbf{x}$ solo tramite questa quantità: punti a uguale distanza di Mahalanobis hanno uguale densità.`,
  },
  {
    id: 'fc-ruoli-media-covarianza',
    kind: 'intuizione',
    q: md`Che ruolo hanno $\mathbf{m}$ e $\Sigma$ nella formula della gaussiana multivariata?`,
    a: md`- $\mathbf{m}$ rappresenta la tendenza centrale (*central tendency*): compare solo nello scarto $(\mathbf{x} - \mathbf{m})$, quindi sposta la campana senza deformarla.
- $\Sigma$ cattura variabilità e correlazione tra le dimensioni: compare nell'esponente tramite $\Sigma^{-1}$, dove decide forma e orientamento, e nella costante tramite $|\Sigma|$, dove decide l'altezza.`,
  },
  {
    id: 'fc-bivariata-figura',
    kind: 'intuizione',
    q: md`Che cosa mostra la figura della gaussiana bivariata di part1 p23?`,
    a: md`Una superficie a rete a forma di campana 3-D (*3D bell-shaped surface*) sopra il piano $(x_1, x_2)$, con l'asse verticale etichettato $p(\mathbf{x}) = p(x_1, x_2)$: l'altezza in ogni punto è la densità congiunta. La campana è allungata in diagonale, segno che le due variabili sono correlate.`,
  },
  {
    id: 'fc-due-parametri-gaussiana',
    kind: 'proprieta',
    q: md`Da quanti parametri è definita la gaussiana multivariata? Quanti scalari liberi sono?`,
    a: md`È completamente definita da due parametri: il vettore medio e la matrice di covarianza.

$$\boldsymbol{\theta} = (\mathbf{m}, \Sigma), \qquad r = n + \frac{n(n+1)}{2}$$

$n$ per la media, $n(n+1)/2$ per la covarianza (simmetrica). Con $n = 2$ sono 5; con $n = 200$ bande sono 20300. Per questo in alta dimensione servono molti campioni (effetto Hughes).`,
  },
  {
    id: 'fc-vettore-medio',
    kind: 'formula',
    q: md`Definisci il vettore medio e dove lo vedi nella campana.`,
    a: md`$$\mathbf{m} = E\{\mathbf{x}\}$$

Valore atteso del vettore di feature, componente per componente: $m_i = E\{x_i\}$. Le note: «Represents the expected value or central tendency of the data». Nella gaussiana è il centro della campana e di tutte le ellissi di isolivello, e il punto di massima densità.`,
  },
  // --- matrice di covarianza (c56-c61) ---
  {
    id: 'fc-matrice-covarianza',
    kind: 'formula',
    q: md`Definisci la matrice di covarianza nelle due forme equivalenti.`,
    a: md`$$\Sigma = \mathrm{Cov}\{\mathbf{x}\} = E\{(\mathbf{x} - \mathbf{m})(\mathbf{x} - \mathbf{m})^t\} = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$$

$(\mathbf{x} - \mathbf{m})$ è una colonna $n \times 1$ e $(\mathbf{x} - \mathbf{m})^t$ una riga $1 \times n$: il prodotto esterno è una matrice $n \times n$. La seconda forma è la versione matriciale di $\mathrm{var} = E\{x^2\} - (E\{x\})^2$. Risponde a «how it is created, what is cov matrix».`,
  },
  {
    id: 'fc-contenuto-covarianza',
    kind: 'definizione',
    q: md`Che cosa contengono gli elementi di $\Sigma$?`,
    a: md`$$[\Sigma]_{ij} = E\{(x_i - m_i)(x_j - m_j)\}, \qquad [\Sigma]_{ii} = \sigma_i^2$$

Sulla diagonale le varianze delle singole feature; fuori diagonale le covarianze: positive se le due feature crescono insieme, negative se una cresce quando l'altra cala, nulle se sono incorrelate. Le note: «captures both the variance of each feature and the covariance between different features».`,
  },
  {
    id: 'fc-simmetria-covarianza',
    kind: 'proprieta',
    q: md`Perché $\Sigma$ è simmetrica e che cosa ne segue?`,
    a: md`$$\Sigma = \Sigma^t$$

La covarianza tra $x_i$ e $x_j$ è uguale a quella tra $x_j$ e $x_i$: il prodotto di due scalari commuta. Conseguenze: gli elementi distinti sono $n(n+1)/2$ e non $n^2$; gli autovalori sono reali; gli autovettori si possono scegliere ortogonali.`,
  },
  {
    id: 'fc-semidefinita-positiva',
    kind: 'proprieta',
    q: md`Perché $\Sigma$ è semidefinita positiva? Che cosa serve in più per la formula della gaussiana?`,
    a: md`$$\mathbf{a}^t \Sigma \mathbf{a} = \mathrm{var}\{\mathbf{a}^t \mathbf{x}\} \geq 0 \quad \forall \mathbf{a}, \qquad \lambda_i \geq 0$$

$\mathbf{a}^t \Sigma \mathbf{a}$ è la varianza della proiezione $\mathbf{a}^t\mathbf{x}$, e una varianza non è mai negativa. Poiché $\Sigma$ è simmetrica, questo equivale ad autovalori non negativi. Le note dicono che la semidefinitezza «ensures that the variance is always non-negative»: il verso logico corretto è l'opposto. Per la formula della gaussiana serve $\Sigma$ definita positiva, altrimenti $|\Sigma| = 0$ e $\Sigma^{-1}$ non esiste.`,
  },
  {
    id: 'fc-indipendenti-diagonale',
    kind: 'proprieta',
    q: md`Com'è $\Sigma$ con feature indipendenti? Vale il viceversa?`,
    a: md`$$\Sigma = \begin{bmatrix} \sigma_1^2 & 0 & \cdots & 0 \\ 0 & \sigma_2^2 & \cdots & 0 \\ \cdots & \cdots & \cdots & \cdots \\ 0 & 0 & \cdots & \sigma_n^2 \end{bmatrix}$$

Diagonale: le covarianze fuori diagonale sono nulle, $\sigma_i^2$ è la varianza della feature $i$-esima. Il viceversa in generale non vale (con $x$ gaussiana e $y = x^2$ la covarianza è nulla ma $y$ dipende da $x$); per variabili congiuntamente gaussiane covarianza nulla equivale a indipendenza.`,
  },
  {
    id: 'fc-fattorizzazione-indipendenti',
    kind: 'formula',
    q: md`Con feature indipendenti, a che cosa si riduce la gaussiana multivariata e perché?`,
    a: md`$$p(\mathbf{x}) = p(x_1)\, p(x_2) \ldots p(x_n)$$

Con $\Sigma$ diagonale il determinante è il prodotto delle varianze e la forma quadratica è la somma degli scarti standardizzati al quadrato: l'esponenziale di una somma diventa un prodotto di esponenziali. Ogni $p(x_i)$ è una gaussiana 1-D. In pratica stimi $2n$ parametri invece di $n + n(n+1)/2$; è l'ipotesi del naive Bayes gaussiano.`,
  },
  // --- forma della gaussiana 2-D (c62-c66) ---
  {
    id: 'fc-volume-unitario',
    kind: 'proprieta',
    q: md`Che forma ha la pdf gaussiana 2-D e quanto vale il suo picco?`,
    a: md`Una superficie a campana di volume unitario (*bell-shaped surface with unit volume*):

$$\iint p(x_1, x_2)\, dx_1\, dx_2 = 1, \qquad p(\mathbf{m}) = \frac{1}{2\pi |\Sigma|^{1/2}}$$

Se la campana si allarga ($|\Sigma|$ cresce) deve abbassarsi per conservare il volume.`,
  },
  {
    id: 'fc-isolivelli-ellissi',
    kind: 'proprieta',
    q: md`Perché le sezioni orizzontali della campana sono ellissi?`,
    a: md`$$p(\mathbf{x}) = z \iff (\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m}) = \text{costante}$$

Tagliare a quota $z$ significa prendere i punti con distanza di Mahalanobis costante da $\mathbf{m}$: nel piano è l'equazione di un'ellisse centrata in $\mathbf{m}$. Gli isolivelli (*isolevels*) sono regioni a densità costante. Quote più basse danno ellissi più grandi, concentriche e con gli stessi assi.`,
  },
  {
    id: 'fc-assi-autovettori',
    kind: 'proprieta',
    q: md`Come sono orientati gli assi delle ellissi di isolivello?`,
    a: md`Lungo gli autovettori (*eigenvectors*) della matrice di covarianza:

$$\Sigma \mathbf{e}_i = \lambda_i \mathbf{e}_i, \qquad \mathbf{e}_i^t \mathbf{e}_j = 0 \;\; (i \neq j)$$

$\Sigma$ è simmetrica, quindi gli autovettori sono ortogonali come gli assi di un'ellisse. Con $\Sigma$ diagonale coincidono con gli assi delle feature e le ellissi non sono inclinate; la covarianza fuori diagonale le ruota.`,
  },
  {
    id: 'fc-asse-maggiore',
    kind: 'proprieta',
    q: md`Quale autovettore definisce l'asse maggiore dell'ellisse e che cosa indica?`,
    a: md`L'autovettore dell'autovalore più grande: la direzione in cui i dati hanno la varianza massima.

$$\lambda_1 = \max_{\lVert \mathbf{a} \rVert = 1} \mathbf{a}^t \Sigma \mathbf{a} = \mathrm{var}\{\mathbf{e}_1^t \mathbf{x}\}$$

Ogni autovalore $\lambda_i$ è la varianza dei dati proiettati su $\mathbf{e}_i$. La PCA conserva proprio le direzioni con autovalore più grande.`,
  },
  {
    id: 'fc-lunghezze-assi',
    kind: 'formula',
    q: md`Quanto sono lunghi gli assi di un'ellisse di isolivello?`,
    a: md`Autovalori più grandi danno assi più lunghi. Nelle coordinate $y_i$ lungo gli autovettori, l'ellisse a distanza di Mahalanobis $d$ è

$$\frac{y_1^2}{d^2 \lambda_1} + \frac{y_2^2}{d^2 \lambda_2} = 1, \qquad \text{semiassi: } d\sqrt{\lambda_1}, \; d\sqrt{\lambda_2}$$

Il rapporto tra asse maggiore e minore è $\sqrt{\lambda_1/\lambda_2}$. Con $\lambda_1 = \lambda_2$ le ellissi diventano cerchi; se $\lambda_2 \to 0$ l'ellisse degenera in un segmento e $\Sigma$ diventa singolare.`,
  },
  {
    id: 'fc-ellisse-esempio-numerico',
    kind: 'procedura',
    q: md`Con $\Sigma = \begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}$, come ricavi orientamento e forma delle ellissi?`,
    a: md`1. Equazione caratteristica: $|\Sigma - \lambda I| = (2 - \lambda)^2 - 1 = 0$, quindi $\lambda_1 = 3$, $\lambda_2 = 1$.
2. Autovettori: $\mathbf{e}_1 = (1, 1)^t/\sqrt{2}$, $\mathbf{e}_2 = (1, -1)^t/\sqrt{2}$, ortogonali.
3. Asse maggiore sulla bisettrice a 45 gradi (varianza 3), asse minore sulla perpendicolare.
4. Rapporto tra gli assi $\sqrt{3} \approx 1.73$; $|\Sigma| = \lambda_1 \lambda_2 = 3$.`,
  },
  // --- confronti con la stima bayesiana e con il criterio di decisione (c68-c69) ---
  {
    id: 'fc-ml-contro-bayesiana',
    kind: 'confronto',
    q: md`ML contro stima bayesiana: che cosa stimano e come trattano $\boldsymbol{\theta}$?`,
    a: md`- **ML**: $\boldsymbol{\theta}$ è fisso ma ignoto; stimi un **punto**, $\hat{\boldsymbol{\theta}} = \arg\max p(\mathbf{X} \mid \boldsymbol{\theta})$.
- **Bayesiana**: $\boldsymbol{\theta}$ è una variabile aleatoria con prior $p(\boldsymbol{\theta})$; stimi una **distribuzione**, $p(\mathbf{x} \mid \mathbf{X})$, da cui si inferisce $\boldsymbol{\theta}$ (*a distribution p(x|X) from which θ is inferred*), calcolata tramite la posterior $p(\boldsymbol{\theta} \mid \mathbf{X})$:

$$p(\mathbf{x} \mid \mathbf{X}) = \int p(\mathbf{x} \mid \boldsymbol{\theta})\, p(\boldsymbol{\theta} \mid \mathbf{X})\, d\boldsymbol{\theta}$$

In pratica ML è spesso preferita per complessità computazionale più bassa (*lower computational complexity*) e interpretabilità più facile (*easier interpretability*); la bayesiana conviene con pochi campioni e una prior affidabile.`,
  },
  {
    id: 'fc-ml-bayes-coincidono',
    kind: 'proprieta',
    q: md`«In which case ML and Bayesian are the same?»`,
    a: md`Secondo la fonte (ch2 p40) le due soluzioni sono equivalenti nel limite di infiniti campioni di training (*in the asymptotic limit of infinite training samples*) oppure se la prior $p(\boldsymbol{\theta})$ è uniforme.

$$p(\boldsymbol{\theta}) = \text{cost.} \;\Rightarrow\; \arg\max_{\boldsymbol{\theta}} p(\boldsymbol{\theta} \mid \mathbf{X}) = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta}) = \hat{\boldsymbol{\theta}}_{ML}$$

Con prior uniforme la posterior è proporzionale alla likelihood; con $N \to \infty$ la posterior si stringe fino a una delta di Dirac attorno al valore ML e la prior perde peso.`,
  },
  {
    id: 'fc-due-maximum-likelihood',
    kind: 'confronto',
    q: md`Stima ML dei parametri e criterio ML di classificazione: stessa funzione, che cosa cambia?`,
    a: md`- **Stima**: varia $\boldsymbol{\theta}$ con i campioni di training fissi, $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta})$; restituisce una pdf.
- **Decisione** (Cap. 4): fisso il campione nuovo $\mathbf{x}$ e vario la classe, $\mathbf{x} \in \omega_j \iff p(\mathbf{x} \mid \omega_j) \geq p(\mathbf{x} \mid \omega_i)$ per $i = 1, \ldots, C$; con prior uguali coincide con il criterio MAP.

In sequenza: prima stimi con ML le pdf di classe dai campioni etichettati, poi le usi nel criterio di decisione.`,
  },
]
