// Domande d'orale del modulo m05 (stima a massima verosimiglianza): le quindici della banca d'esame (testo verbatim
// in bankText) più otto domande sulle parti che Melgani chiede di più. Le risposte sono in prima persona, come le
// direbbe lo studente.
import { md } from '../../types'
import type { ExamQuestion } from '../../types'

export const exam: ExamQuestion[] = [
  // --- banca d'esame ---
  {
    id: 'or-banca-1',
    q: md`Qual è la formula della stima a massima verosimiglianza? Perché possiamo scrivere la likelihood come prodotto delle probabilità dei singoli campioni, e che cosa descrive la likelihood?`,
    qEn: 'What is the formula of Maximum Likelihood estimation, why can we use the product of the separate probabilities, and what does the likelihood describe?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'What is the formula of Maximum Likelihood, why we can use the separate products of the probabilities and what the Likelihood describe.',
    answer: md`**Formula.** Ho un modello parametrico $p(\mathbf{x} \mid \boldsymbol{\theta})$ di forma nota con parametri ignoti e un training set $\mathbf{X} = \{\mathbf{x}_1, \ldots, \mathbf{x}_N\}$. La stima a massima verosimiglianza (*maximum likelihood*, ML) è il valore dei parametri che massimizza la likelihood dei dati osservati:

$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta})$$

La variabile della ricerca è $\boldsymbol{\theta}$, scritta sotto l'$\arg\max$; i campioni restano quelli osservati. L'$\arg\max$ restituisce il punto di massimo, non il valore massimo. Il cappello ricorda che $\hat{\boldsymbol{\theta}}$ dipende dai dati, quindi è un vettore aleatorio con il suo bias e la sua varianza. Poiché il logaritmo è monotono crescente (*monotonically increasing*), scrivo in modo equivalente

$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta})$$

**Perché il prodotto.** Assumo i campioni indipendenti e identicamente distribuiti (*iid*). L'indipendenza mi fa fattorizzare la densità congiunta nel prodotto delle densità dei singoli campioni; l'identica distribuzione mi fa usare in ogni fattore la stessa $p(\cdot \mid \boldsymbol{\theta})$, con lo stesso $\boldsymbol{\theta}$:

$$p(\mathbf{X} \mid \boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta})$$

Se i campioni fossero dipendenti dovrei scrivere la congiunta per intero e il prodotto semplice cadrebbe. Il logaritmo trasforma poi il prodotto in una somma, $\ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \sum_{k=1}^{N} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})$: la derivo termine a termine e non vado in underflow. Nell'esempio delle slide con una dozzina di campioni la likelihood vale già circa $10^{-7}$.

**Che cosa descrive.** La likelihood ha la stessa espressione della pdf, letta al contrario. Nella pdf fisso $\boldsymbol{\theta}$ e la variabile è $\mathbf{x}$, con area 1. Nella likelihood fisso i dati e la variabile è $\boldsymbol{\theta}$. Misura la compatibilità (*compatibility/agreement*) tra un valore dei parametri e i campioni osservati: è alta quando la pdf candidata mette densità alta proprio dove i campioni sono caduti. Variando $\boldsymbol{\theta}$ ottengo pdf diverse, ognuna con il suo valore di likelihood, e la stima ML è quella che si accorda meglio (*best agrees*) con i campioni. Massimizzarla vuol dire massimizzare la probabilità di osservare proprio quei dati sotto il modello. Non è una densità su $\boldsymbol{\theta}$: in generale $\int p(\mathbf{X} \mid \theta)\,d\theta \neq 1$, e in ML $\boldsymbol{\theta}$ è fisso ma ignoto, non aleatorio. Con dati discreti la likelihood è davvero una probabilità; con feature continue è una densità e può superare 1.

**Esempio.** Una sola osservazione $x_0$ da una gaussiana con varianza nota: la likelihood è la pdf valutata in $x_0$, $p(x_0 \mid m)$. Faccio scorrere la campana lungo l'asse e leggo la quota sulla verticale di $x_0$: è massima quando la campana è centrata su $x_0$, quindi $\hat{m} = x_0$.`,
    checklist: [
      md`formula $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta})$ e versione equivalente con $\ln$`,
      md`prodotto giustificato dai campioni iid: indipendenza per fattorizzare, identica distribuzione per usare la stessa pdf`,
      md`log-likelihood: monotona crescente, stesso $\arg\max$, prodotti in somme, niente underflow`,
      md`likelihood come funzione di $\boldsymbol{\theta}$ a dati fissi: misura di compatibilità, non densità su $\boldsymbol{\theta}$`,
      md`esempio della ricerca ML con una sola osservazione: $\hat{m} = x_0$`,
    ],
    followUps: [
      {
        q: md`Nel massimo la likelihood e la log-likelihood hanno lo stesso valore?`,
        a: md`No: coincide la posizione del massimo, non il valore. Il logaritmo di un numero minore di 1 è negativo. Il logaritmo conserva l'ordine dei candidati, quindi l'$\arg\max$ resta lo stesso.`,
      },
      {
        q: md`E se i campioni fossero correlati, per esempio letture consecutive di un sensore?`,
        a: md`Il prodotto semplice non vale più. Dovrei scrivere $p(\mathbf{X} \mid \boldsymbol{\theta}) = p(\mathbf{x}_1 \mid \boldsymbol{\theta}) \prod_{k=2}^{N} p(\mathbf{x}_k \mid \mathbf{x}_1, \ldots, \mathbf{x}_{k-1}, \boldsymbol{\theta})$ e modellare la dipendenza.`,
      },
      {
        q: md`La likelihood può valere più di 1?`,
        a: md`Sì, con feature continue è una densità. Una gaussiana con $\sigma = 0.1$ ha picco $\frac{1}{0.1\sqrt{2\pi}} \approx 3.99$.`,
      },
    ],
  },
  {
    id: 'or-banca-2',
    q: md`Come si descrive la bontà di una stima? La stima ML è un buon stimatore? È migliore o no della stima bayesiana, e perché?`,
    qEn: 'How can we describe the goodness of an estimate? Is Maximum Likelihood estimation a good estimator? Is it better or not than Bayesian estimation? Why?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'How we can describe the goodness of an estimation and Is Maximum Likelihood Estimation a good estimator? Is it better or not with respect to the Bayesian Estimation? Why?',
    answer: md`**Bontà di una stima.** La stima $\hat{\boldsymbol{\theta}}$ è funzione dei campioni, quindi è un vettore aleatorio. La giudico dall'errore $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$ e guardo due cose.

- Il bias $E\{\boldsymbol{\varepsilon}\}$: la stima è non distorta (*unbiased*) se $E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$.
- La varianza dell'errore, che confronto con il bound di Cramér-Rao: per ogni stima non distorta $\mathrm{var}\{\varepsilon_i\} \geq [\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}$, con $\mathrm{I}(\boldsymbol{\theta})$ matrice di informazione di Fisher. Se vale l'uguaglianza per ogni $i$ la stima è efficiente (*efficient*): non distorta e con la varianza più piccola possibile.

Con $N$ finito una stima efficiente può non esistere, quindi guardo anche il comportamento per $N \to +\infty$: asintoticamente non distorta, asintoticamente efficiente, consistente.

**ML è un buon stimatore?** La slide sulle proprietà dice due cose.

1. Sotto certe ipotesi su $p(\mathbf{x} \mid \boldsymbol{\theta})$, se esiste una stima efficiente e se la stima ML è non distorta, allora la stima efficiente è quella fornita da ML. Le ipotesi sono le condizioni di regolarità: log-likelihood derivabile, supporto che non dipende da $\boldsymbol{\theta}$, informazione di Fisher finita e non nulla. Esempio: la media campionaria di una gaussiana è la stima ML, è non distorta e ha varianza $\sigma^2/N$, uguale al bound.
2. Anche se una stima efficiente non esiste, la stima ML ha buone proprietà asintotiche:

$$\lim_{N \to +\infty} E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}, \qquad \lim_{N \to +\infty} \frac{\mathrm{var}\{\varepsilon_i\}}{[\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1, \qquad \lim_{N \to +\infty} P\{\lVert \boldsymbol{\varepsilon} \rVert < \delta\} = 1 \;\; \forall \delta > 0$$

cioè è asintoticamente non distorta, asintoticamente efficiente e consistente. Queste proprietà spiegano perché ML si usa in tanti problemi reali: le gaussiane di classe, EM per le misture, i parametri delle reti bayesiane.

C'è un limite: con pochi campioni ML può essere distorta. La covarianza gaussiana stimata con ML divide per $N$ e ha $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$, quindi sottostima; lo stimatore non distorto divide per $N-1$. Il fattore tende a 1, come promette la non distorsione asintotica.

**Meglio o peggio della bayesiana?** Le due impostazioni stimano cose diverse. In ML $\boldsymbol{\theta}$ è fisso ma ignoto e stimo un punto nello spazio dei parametri. Nella stima bayesiana $\boldsymbol{\theta}$ è una variabile aleatoria con prior $p(\boldsymbol{\theta})$: calcolo la posterior $p(\boldsymbol{\theta} \mid \mathbf{X})$ e da lì una distribuzione, $p(\mathbf{x} \mid \mathbf{X}) = \int p(\mathbf{x} \mid \boldsymbol{\theta})\, p(\boldsymbol{\theta} \mid \mathbf{X})\, d\boldsymbol{\theta}$. Le due soluzioni coincidono con infiniti campioni di training o con prior uniforme. In pratica preferisco ML per la minore complessità computazionale (cerco un massimo invece di integrare su tutto lo spazio dei parametri) e perché il risultato si interpreta più facilmente. La bayesiana conviene quando ho pochi campioni e una prior affidabile: la prior compensa i dati che mancano. Con una prior sbagliata e pochi dati, però, mi porta fuori strada.`,
    checklist: [
      md`errore di stima come vettore aleatorio: bias e varianza`,
      md`bound di Cramér-Rao e definizione di stima efficiente`,
      md`teorema: se esiste una stima efficiente e ML è non distorta, la stima efficiente è ML (sotto ipotesi su $p(\mathbf{x} \mid \boldsymbol{\theta})$)`,
      md`le tre proprietà asintotiche scritte con i limiti`,
      md`limite a $N$ finito: covarianza con $1/N$ e fattore $(N-1)/N$`,
      md`confronto con Bayes: punto contro distribuzione, equivalenza con $N \to \infty$ o prior uniforme, costo e interpretabilità`,
    ],
    followUps: [
      {
        q: md`«Asintoticamente efficiente» vuol dire che la varianza tende a zero?`,
        a: md`No, riguarda il rapporto tra varianza e bound, che tende a 1. Varianza e bound scendono entrambi come $1/N$: vanno a zero tutti e due, ma l'efficienza chiede che la stima raggiunga il pavimento.`,
      },
      {
        q: md`Quali ipotesi su $p(\mathbf{x} \mid \boldsymbol{\theta})$ hai in mente? Fammi un controesempio.`,
        a: md`Le condizioni di regolarità del bound di Cramér-Rao: log-likelihood derivabile, supporto indipendente da $\boldsymbol{\theta}$, scambio tra derivata e integrale, informazione di Fisher finita e non nulla. L'uniforme su $[0, \theta]$ le viola perché il supporto dipende da $\theta$: la stima ML è $\max_k x_k$, il massimo cade sul bordo e la derivata lì non si annulla.`,
      },
      {
        q: md`Perché la consistenza segue dalle prime due proprietà?`,
        a: md`Se il bias va a zero e la varianza segue il bound, che scende come $1/N$, va a zero l'errore quadratico medio $E\{\varepsilon^2\} = \mathrm{var}\{\varepsilon\} + (E\{\varepsilon\})^2$. Per la disuguaglianza di Chebyshev $P\{\vert \varepsilon \vert \geq \delta\} \leq E\{\varepsilon^2\}/\delta^2 \to 0$. La condizione è sufficiente, non necessaria: i passaggi sono nella dimostrazione [«condizione sufficiente per la consistenza»](#derivation:der16).`,
      },
    ],
  },
  {
    id: 'or-banca-3',
    q: md`Applica la stima a massima verosimiglianza a un esercizio: per esempio, stima il parametro $\sigma$ del modello di Rayleigh da cinque ampiezze radar.`,
    qEn: 'Apply Maximum Likelihood estimation to an exercise (for example, estimate the Rayleigh parameter sigma from five radar amplitudes).',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Then he asked me to apply Maximum Likelihood estimation on an exercise.',
    answer: md`**La ricetta.** (1) Scrivo il modello $p(x \mid \theta)$. (2) Scrivo la likelihood come prodotto sui campioni iid. (3) Passo al logaritmo. (4) Derivo rispetto a ogni parametro e pongo a zero: sono le equazioni di verosimiglianza (*likelihood equations*), $\nabla_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \sum_k \nabla_{\boldsymbol{\theta}} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta}) = \mathbf{0}$. (5) Risolvo e controllo che sia un massimo.

**L'esercizio.** Un radar misura $N = 5$ ampiezze dell'eco: $\{1.2,\ 2.0,\ 0.8,\ 1.6,\ 2.4\}$. Il modello della galleria per i segnali diffusi è la Rayleigh:

$$p(x \mid \sigma) = \frac{x}{\sigma^2} \exp\left(-\frac{x^2}{2\sigma^2}\right), \qquad x \geq 0$$

Likelihood e log-likelihood, con $s = \sigma^2$:

$$p(\mathbf{X} \mid s) = \prod_{k=1}^{N} \frac{x_k}{s} \exp\left(-\frac{x_k^2}{2s}\right), \qquad \ln p(\mathbf{X} \mid s) = \sum_{k=1}^{N} \ln x_k - N \ln s - \frac{1}{2s} \sum_{k=1}^{N} x_k^2$$

Derivo rispetto a $s$ e pongo a zero:

$$\frac{\partial \ln p(\mathbf{X} \mid s)}{\partial s} = -\frac{N}{s} + \frac{1}{2s^2} \sum_{k=1}^{N} x_k^2 = 0 \;\Rightarrow\; \hat{\sigma}^2 = \frac{1}{2N} \sum_{k=1}^{N} x_k^2$$

Controllo il segno: in $\hat{s}$ la derivata seconda vale $\frac{N}{\hat{s}^2} - \frac{1}{\hat{s}^3}\sum_k x_k^2 = \frac{N}{\hat{s}^2} - \frac{2N}{\hat{s}^2} = -\frac{N}{\hat{s}^2} < 0$, quindi è un massimo.

Numeri: $\sum_k x_k^2 = 1.44 + 4 + 0.64 + 2.56 + 5.76 = 14.40$, quindi $\hat{\sigma}^2 = 14.40/10 = 1.44$. Per l'invarianza della stima ML, $\hat{\sigma} = \sqrt{1.44} = 1.2$: derivare rispetto a $\sigma^2$ o rispetto a $\sigma$ porta allo stesso punto.

**A che cosa serve.** Con la Rayleigh stimata fisso la soglia di rivelazione. La probabilità di falso allarme è $P\{x > T\} = \exp\left(-\frac{T^2}{2\sigma^2}\right)$, quindi $T = \hat{\sigma}\sqrt{2\ln(1/P_{FA})}$; con $P_{FA} = 0.01$ ottengo $T = 1.2 \cdot 3.035 \approx 3.64$.

**Gli altri esercizi tipici.** Gaussiana: $\hat{m} = \frac{1}{N}\sum_k x_k$ e $\hat{\sigma}^2 = \frac{1}{N}\sum_k (x_k - \hat{m})^2$. Bernoulli con $K$ successi su $N$ prove: $\hat{\theta} = K/N$. Esponenziale di media $\theta$: $\hat{\theta} = \frac{1}{N}\sum_k x_k$. Uniforme su $[0, \theta]$: la derivata di $-N\ln\theta$ non si annulla mai, la likelihood decresce dove è positiva, quindi $\hat{\theta} = \max_k x_k$, un massimo sul bordo.`,
    checklist: [
      md`ricetta in cinque passi: modello, prodotto, logaritmo, derivata nulla, controllo del massimo`,
      md`log-likelihood della Rayleigh scritta per esteso`,
      md`derivata rispetto a $\sigma^2$ e soluzione $\hat{\sigma}^2 = \frac{1}{2N}\sum_k x_k^2$`,
      md`derivata seconda negativa: è un massimo`,
      md`conto numerico e passaggio a $\hat{\sigma}$ per invarianza`,
      md`uso della stima (soglia di falso allarme) e risultati degli altri modelli tipici`,
    ],
    followUps: [
      {
        q: md`La stima $\hat{\sigma}^2$ della Rayleigh è non distorta?`,
        a: md`Sì. Scrivo $x^2 = z_1^2 + z_2^2$ con $z_1, z_2$ gaussiane indipendenti a media nulla e varianza $\sigma^2$: $E\{x^2\} = 2\sigma^2$, quindi $E\{\hat{\sigma}^2\} = \frac{1}{2N} \cdot N \cdot 2\sigma^2 = \sigma^2$. La sua varianza è $\sigma^4/N$, uguale al bound di Cramér-Rao: è efficiente. La stima $\hat{\sigma} = \sqrt{\hat{\sigma}^2}$ invece è distorta, perché la radice è concava (disuguaglianza di Jensen).`,
      },
      {
        q: md`Perché puoi derivare rispetto a $\sigma^2$ invece che rispetto a $\sigma$?`,
        a: md`Per l'invarianza della stima ML: con $g$ invertibile, $\widehat{g(\theta)} = g(\hat{\theta})$. Il massimo della likelihood è lo stesso punto, etichettato in un altro modo.`,
      },
      {
        q: md`E se le equazioni di verosimiglianza non avessero soluzione in forma chiusa?`,
        a: md`Uso un metodo iterativo: salita del gradiente, Newton, oppure EM quando ci sono variabili nascoste come nelle misture di gaussiane. La likelihood può avere più massimi locali, quindi parto da più inizializzazioni.`,
      },
    ],
  },
  {
    id: 'or-banca-4',
    q: md`In quali casi la stima ML e la stima bayesiana coincidono?`,
    qEn: 'In which cases do ML and Bayesian estimation coincide?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Last question was: In which case ML and Bayesian are the same?',
    answer: md`**I due casi.** La slide di confronto dice che le soluzioni ML e bayesiana sono equivalenti nel limite asintotico di infiniti campioni di training (*infinite training samples*) oppure se la prior $p(\boldsymbol{\theta})$ è uniforme.

**Prior uniforme.** Per la formula di Bayes

$$p(\boldsymbol{\theta} \mid \mathbf{X}) = \frac{p(\mathbf{X} \mid \boldsymbol{\theta})\, p(\boldsymbol{\theta})}{\int p(\mathbf{X} \mid \boldsymbol{\theta})\, p(\boldsymbol{\theta})\, d\boldsymbol{\theta}}$$

il denominatore non dipende da $\boldsymbol{\theta}$. Se $p(\boldsymbol{\theta})$ è costante, la posterior è proporzionale alla sola likelihood e ha il massimo nello stesso punto:

$$p(\boldsymbol{\theta}) = \text{cost.} \;\Rightarrow\; \arg\max_{\boldsymbol{\theta}} p(\boldsymbol{\theta} \mid \mathbf{X}) = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta}) = \hat{\boldsymbol{\theta}}_{ML}$$

Una prior uniforme non preferisce nessun valore: parlano solo i dati. La intendo uniforme su un intervallo che contiene la zona di interesse, perché su tutta la retta non sarebbe normalizzabile.

**Infiniti campioni.** La likelihood è un prodotto di $N$ fattori, la prior è un fattore solo: al crescere di $N$ la likelihood domina. La posterior si stringe attorno al valore ML fino a diventare una delta di Dirac, e allora

$$p(\mathbf{x} \mid \mathbf{X}) = \int p(\mathbf{x} \mid \boldsymbol{\theta})\, p(\boldsymbol{\theta} \mid \mathbf{X})\, d\boldsymbol{\theta} \;\to\; p(\mathbf{x} \mid \hat{\boldsymbol{\theta}}_{ML})$$

**Esempio gaussiano.** Media ignota, varianza $\sigma^2$ nota, prior $p(\mu) \sim N(\mu_0, \sigma_0^2)$. La posterior è ancora gaussiana, $N(\mu_N, \sigma_N^2)$, con

$$\mu_N = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\,\bar{X} + \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\,\mu_0, \qquad \sigma_N^2 = \frac{\sigma_0^2 \sigma^2}{N\sigma_0^2 + \sigma^2}$$

Con $N \to \infty$ il peso della media campionaria va a 1: $\mu_N \to \bar{X} = \hat{m}_{ML}$ e $\sigma_N^2 \to 0$. Con $\sigma_0^2 \to \infty$ (prior piatta) $\mu_N = \bar{X}$ per ogni $N$. La densità cercata è $p(x \mid \mathbf{X}) \sim N(\mu_N, \sigma^2 + \sigma_N^2)$.

**Una precisazione.** Con prior uniforme coincidono esattamente i punti di massimo: la stima MAP bayesiana è quella ML. La soluzione bayesiana completa resta però una media delle pdf pesata dalla posterior, e coincide con $p(\mathbf{x} \mid \hat{\boldsymbol{\theta}}_{ML})$ solo quando la posterior è stretta, cioè per $N$ grande. Nell'esempio con prior piatta la media è $\bar{X}$, ma la varianza della densità stimata è $\sigma^2 + \sigma^2/N$ e non $\sigma^2$.`,
    checklist: [
      md`i due casi della slide: infiniti campioni di training oppure prior uniforme`,
      md`formula di Bayes: con prior costante la posterior è proporzionale alla likelihood`,
      md`con $N \to \infty$ la posterior tende a una delta di Dirac attorno a $\hat{\boldsymbol{\theta}}_{ML}$`,
      md`esempio gaussiano con $\mu_N$ e $\sigma_N^2$ e i due limiti`,
      md`precisazione: coincidono i massimi (MAP = ML); la predittiva completa coincide solo per $N$ grande`,
    ],
    followUps: [
      {
        q: md`Allora perché in pratica si preferisce ML?`,
        a: md`Per la minore complessità computazionale, visto che cerco un massimo invece di integrare su tutto lo spazio dei parametri, e perché il risultato si interpreta più facilmente: un valore dei parametri, non una distribuzione.`,
      },
      {
        q: md`Quando conviene la stima bayesiana?`,
        a: md`Con pochi campioni e una prior affidabile. Nell'esempio gaussiano con $N$ piccolo e $\sigma_0^2$ piccola, $\mu_N$ resta vicina a $\mu_0$: la conoscenza a priori corregge una media campionaria ancora rumorosa.`,
      },
      {
        q: md`Che differenza c'è tra stima MAP e stima bayesiana completa?`,
        a: md`La MAP prende il punto di massimo della posterior, $\arg\max_{\boldsymbol{\theta}} p(\boldsymbol{\theta} \mid \mathbf{X})$. La stima bayesiana completa usa tutta la posterior: $p(\mathbf{x} \mid \mathbf{X}) = \int p(\mathbf{x} \mid \boldsymbol{\theta})\, p(\boldsymbol{\theta} \mid \mathbf{X})\, d\boldsymbol{\theta}$.`,
      },
    ],
  },
  {
    id: 'or-banca-5',
    q: md`Spiega la stima ML, sviluppa la derivata prima per una gaussiana e spiega il significato del risultato.`,
    qEn: 'Explain ML estimation, develop the first derivative for a Gaussian and explain the meaning of the result.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Explain ML estimation, develop the first derivative for a gaussian and explain the meaning of the result.',
    answer: md`**La stima ML.** Scelgo i parametri che massimizzano la likelihood dei campioni osservati, $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta})$, oppure, con lo stesso risultato, la log-likelihood. Con campioni iid la log-likelihood è una somma, quindi la derivo termine a termine e pongo il gradiente a zero.

**Lo sviluppo.** Ho $N$ campioni iid da una gaussiana 1-D con varianza $\sigma^2$ nota e media $m$ ignota:

$$p(x_k \mid m) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[-\frac{(x_k - m)^2}{2\sigma^2}\right]$$

$$\ln p(\mathbf{X} \mid m) = \sum_{k=1}^{N} \ln p(x_k \mid m) = -N \ln\left(\sigma\sqrt{2\pi}\right) - \frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - m)^2$$

Derivo rispetto a $m$: il primo termine non dipende da $m$, e la derivata di $(x_k - m)^2$ è $-2(x_k - m)$:

$$\frac{\partial \ln p(\mathbf{X} \mid m)}{\partial m} = \frac{1}{\sigma^2} \sum_{k=1}^{N} (x_k - m) = 0 \;\Rightarrow\; \sum_{k=1}^{N} x_k - N\hat{m} = 0 \;\Rightarrow\; \hat{m} = \frac{1}{N} \sum_{k=1}^{N} x_k$$

La derivata seconda vale $-N/\sigma^2 < 0$ per ogni $m$: la log-likelihood è una parabola rivolta verso il basso, quindi il massimo è unico e globale.

**Il significato.**

- La condizione $\sum_k (x_k - \hat{m}) = 0$ dice che $\hat{m}$ è il baricentro dei campioni: gli scarti positivi e negativi si compensano. Ogni campione tira la media verso di sé con forza $(x_k - m)/\sigma^2$.
- Massimizzare la log-likelihood gaussiana equivale a minimizzare $\sum_k (x_k - m)^2$: con rumore gaussiano ML coincide con i minimi quadrati.
- $\sigma^2$ si semplifica: la stima della media non dipende dalla varianza.
- Con $N = 1$ ritrovo $\hat{m} = x_0$, il risultato della figura «ML search» delle slide.
- $E\{\hat{m}\} = m$ e $\mathrm{var}\{\hat{m}\} = \sigma^2/N$, che è il bound di Cramér-Rao: la media campionaria è non distorta ed efficiente, un caso concreto del teorema sulle proprietà di ML. La varianza va a zero, quindi è anche consistente.

**Se anche la varianza è ignota.** Derivo rispetto a $\sigma^2$ e ottengo $\hat{\sigma}^2 = \frac{1}{N}\sum_k (x_k - \hat{m})^2$, distorta con $N$ finito: $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2$. In più dimensioni: $\hat{\mathbf{m}} = \frac{1}{N}\sum_k \mathbf{x}_k$ e $\hat{\Sigma} = \frac{1}{N}\sum_k (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$. Tutti i passaggi sono nella dimostrazione [«derivata prima per una gaussiana con N campioni»](#derivation:der04).`,
    checklist: [
      md`definizione di ML e passaggio alla log-likelihood come somma`,
      md`log-likelihood gaussiana scritta per esteso`,
      md`derivata $\frac{1}{\sigma^2}\sum_k (x_k - m)$ posta a zero e soluzione: media campionaria`,
      md`derivata seconda $-N/\sigma^2$: massimo unico e globale`,
      md`significato: baricentro, minimi quadrati, indipendenza da $\sigma^2$, caso $N = 1$`,
      md`proprietà: non distorta, varianza $\sigma^2/N$ uguale al bound, efficiente e consistente`,
    ],
    followUps: [
      {
        q: md`Che cosa cambia se il rumore è laplaciano invece che gaussiano?`,
        a: md`La log-likelihood diventa $N\ln(b/2) - b\sum_k \vert x_k - m \vert$: massimizzarla vuol dire minimizzare la somma dei valori assoluti, e la stima ML della posizione è la mediana. Cambiando il modello cambia lo stimatore.`,
      },
      {
        q: md`Perché la stima della varianza è distorta e quella della media no?`,
        a: md`Nella varianza uso $\hat{m}$ al posto della media vera. $\hat{m}$ minimizza la somma dei quadrati degli scarti, quindi i campioni gli stanno più vicini che alla media vera e la dispersione risulta sottostimata: $\sum_k (x_k - \hat{m})^2 = \sum_k (x_k - m)^2 - N(\hat{m} - m)^2$.`,
      },
      {
        q: md`Come appare la likelihood in funzione di $m$?`,
        a: md`Completando il quadrato è una campana centrata nella media campionaria e larga $\sigma/\sqrt{N}$. Con $N = 1$ è la campana larga $\sigma$ centrata in $x_0$ della figura; al crescere di $N$ si stringe.`,
      },
    ],
  },
  {
    id: 'or-banca-6',
    q: md`Scrivi la formula della gaussiana in uno spazio a più dimensioni, con vettore medio e matrice di covarianza.`,
    qEn: 'Write the formula of the Gaussian in a multidimensional space, with the mean vector and the covariance matrix.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'He also asked me the formula of the Gaussian curve in a multi dimensional space (with mean vector and covariance matrix).',
    answer: md`**La formula.** Per un vettore di feature $\mathbf{x}$ a $n$ dimensioni:

$$p(\mathbf{x} \mid \theta) = p(\mathbf{x} \mid \mathbf{m}, \Sigma) = \frac{1}{(2\pi)^{n/2} \vert \Sigma \vert^{1/2}} \exp\left[-\frac{1}{2} (\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m})\right]$$

La scrivo $N(\mathbf{m}, \Sigma)$: il vettore dei parametri è la coppia $\boldsymbol{\theta} = (\mathbf{m}, \Sigma)$.

**I simboli.** $\mathbf{x} = (x_1, \ldots, x_n)^t$ è il vettore di feature. $\mathbf{m} = E\{\mathbf{x}\}$ è il vettore medio, la tendenza centrale dei dati. $\Sigma = E\{(\mathbf{x} - \mathbf{m})(\mathbf{x} - \mathbf{m})^t\} = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$ è la matrice di covarianza $n \times n$: varianze sulla diagonale, covarianze fuori. $\vert \Sigma \vert$ è il suo determinante.

**Le due parti.** La costante $\frac{1}{(2\pi)^{n/2}\vert\Sigma\vert^{1/2}}$ garantisce che il volume sotto la campana valga 1. All'esponente c'è la forma quadratica

$$d^2(\mathbf{x}, \mathbf{m}) = (\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m})$$

che le note chiamano distanza di Mahalanobis; a rigore ne è il quadrato. È una distanza dalla media misurata in deviazioni standard lungo ogni direzione, che tiene conto delle correlazioni; con $\Sigma = I$ torna la distanza euclidea al quadrato. La densità dipende da $\mathbf{x}$ solo attraverso $d^2$, quindi i punti alla stessa distanza di Mahalanobis hanno la stessa densità: gli isolivelli sono ellissi con gli assi sugli autovettori di $\Sigma$.

**Ruolo dei parametri.** $\mathbf{m}$ compare solo nello scarto $\mathbf{x} - \mathbf{m}$: sposta la campana senza deformarla. $\Sigma$ compare due volte: in $\Sigma^{-1}$ decide forma e orientamento, in $\vert\Sigma\vert$ decide l'altezza. Serve $\Sigma$ invertibile, cioè definita positiva.

**Controlli.** Con $n = 1$: $\Sigma = \sigma^2$, $\vert\Sigma\vert^{1/2} = \sigma$ e ritrovo $\frac{1}{\sigma\sqrt{2\pi}}\exp\left[-\frac{(x - m)^2}{2\sigma^2}\right]$. Con feature indipendenti $\Sigma$ è diagonale e la pdf diventa il prodotto delle gaussiane 1-D, $p(\mathbf{x}) = p(x_1)\,p(x_2) \ldots p(x_n)$. I parametri scalari sono $n + \frac{n(n+1)}{2}$: 5 con $n = 2$, già 20300 con $n = 200$ bande. Con ML li stimo con $\hat{\mathbf{m}} = \frac{1}{N}\sum_k \mathbf{x}_k$ e $\hat{\Sigma} = \frac{1}{N}\sum_k (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$.`,
    checklist: [
      md`formula completa con $(2\pi)^{n/2}$, $\vert\Sigma\vert^{1/2}$ e $\Sigma^{-1}$ all'esponente`,
      md`significato di $\mathbf{x}$, $n$, $\mathbf{m}$, $\Sigma$, $\vert\Sigma\vert$`,
      md`definizioni $\mathbf{m} = E\{\mathbf{x}\}$ e $\Sigma = E\{(\mathbf{x} - \mathbf{m})(\mathbf{x} - \mathbf{m})^t\}$`,
      md`distanza di Mahalanobis e isolivelli ellittici`,
      md`ruolo dei parametri: $\mathbf{m}$ sposta, $\Sigma$ dà forma, orientamento e altezza`,
      md`controllo con $n = 1$, caso diagonale e numero di parametri`,
    ],
    followUps: [
      {
        q: md`Quanto vale il picco della gaussiana bivariata?`,
        a: md`Il massimo è in $\mathbf{x} = \mathbf{m}$, dove l'esponente è zero: $p(\mathbf{m}) = \frac{1}{2\pi\vert\Sigma\vert^{1/2}}$. Più la nuvola è larga ($\vert\Sigma\vert$ grande), più la campana è bassa, perché il volume resta 1.`,
      },
      {
        q: md`Perché serve $\Sigma$ definita positiva e non solo semidefinita?`,
        a: md`Con un autovalore nullo $\vert\Sigma\vert = 0$ e $\Sigma^{-1}$ non esiste: i dati stanno su un sottospazio e la densità degenera. Succede per esempio con due feature perfettamente correlate.`,
      },
      {
        q: md`Perché la costante dà volume 1?`,
        a: md`Ruoto gli assi sugli autovettori di $\Sigma$: la forma quadratica diventa $\sum_i y_i^2/\lambda_i$ e l'integrale si spezza in $n$ integrali gaussiani 1-D, ognuno pari a $\sqrt{2\pi\lambda_i}$. Il prodotto è $(2\pi)^{n/2}\sqrt{\lambda_1 \cdots \lambda_n} = (2\pi)^{n/2}\vert\Sigma\vert^{1/2}$.`,
      },
    ],
  },
  {
    id: 'or-banca-7',
    q: md`Spiega la PCA. Com'è costruita la matrice di covarianza e che cosa contiene? Che cosa sono l'equazione caratteristica, gli autovalori e gli autovettori?`,
    qEn: 'Explain PCA. How is the covariance matrix built and what does it contain? What are the characteristic equation, the eigenvalues and the eigenvectors?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Asked me to explain PCA. When I started explaining he asked about covariance matrix, how it is created, what is cov matrix and etc. Then also some detailed questions about characteristic equation, eigenvalues/vectors.',
    answer: md`**PCA.** L'analisi delle componenti principali (*Principal Component Analysis*, o trasformata di Karhunen-Loève) è un metodo di estrazione delle feature non supervisionato. Dati $\mathbf{x}_1, \ldots, \mathbf{x}_N \in \Re^n$ cerco un sottospazio a $m < n$ dimensioni in cui l'errore di ricostruzione, nel senso dei minimi quadrati, sia minimo. Si dimostra che la base ottima è data dagli $m$ autovettori della matrice di scatter (o di covarianza) con gli autovalori più grandi. Le proiezioni $\mathbf{y} = (y_1, \ldots, y_m)^t$ sono le componenti principali: la prima porta la varianza più grande, la seconda la successiva, e così via. Spesso pochi autovalori sono grandi: quelle direzioni contengono il segnale, le altre soprattutto rumore.

**La matrice di covarianza.** Per definizione

$$\Sigma = \mathrm{Cov}\{\mathbf{x}\} = E\{(\mathbf{x} - \mathbf{m})(\mathbf{x} - \mathbf{m})^t\} = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$$

$(\mathbf{x} - \mathbf{m})$ è una colonna $n \times 1$, il trasposto una riga $1 \times n$: il prodotto esterno è una matrice $n \times n$. La seconda forma è la versione matriciale di $\mathrm{var} = E\{x^2\} - (E\{x\})^2$. Dai dati la costruisco così: calcolo $\hat{\mathbf{m}} = \frac{1}{N}\sum_k \mathbf{x}_k$, tolgo la media a ogni campione e faccio la media dei prodotti esterni, $\hat{\Sigma} = \frac{1}{N}\sum_k (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$ (con $\frac{1}{N-1}$ se la voglio non distorta).

**Che cosa contiene.** $[\Sigma]_{ij} = E\{(x_i - m_i)(x_j - m_j)\}$: sulla diagonale le varianze $\sigma_i^2$, fuori le covarianze, positive se due feature crescono insieme, negative se una cresce quando l'altra cala, nulle se sono incorrelate. Proprietà: è simmetrica, $\Sigma = \Sigma^t$; è semidefinita positiva, perché $\mathbf{a}^t\Sigma\mathbf{a} = \mathrm{var}\{\mathbf{a}^t\mathbf{x}\} \geq 0$ per ogni $\mathbf{a}$; con feature indipendenti è diagonale.

**Equazione caratteristica, autovalori, autovettori.** Un autovettore $\mathbf{e}_i$ soddisfa $\Sigma\mathbf{e}_i = \lambda_i\mathbf{e}_i$: $\Sigma$ lo allunga senza ruotarlo. Riscrivo $(\Sigma - \lambda I)\mathbf{e} = \mathbf{0}$, con $I$ matrice identità: ha soluzioni non nulle solo se

$$\vert \Sigma - \lambda I \vert = 0$$

un polinomio di grado $n$ in $\lambda$ le cui radici sono gli autovalori. Per ognuno risolvo $(\Sigma - \lambda_i I)\mathbf{e}_i = \mathbf{0}$ e normalizzo. Poiché $\Sigma$ è simmetrica gli autovalori sono reali e gli autovettori ortogonali; poiché è semidefinita positiva $\lambda_i \geq 0$. L'autovalore $\lambda_i$ è la varianza dei dati proiettati su $\mathbf{e}_i$, e $\lambda_1 = \max_{\lVert\mathbf{a}\rVert = 1} \mathbf{a}^t\Sigma\mathbf{a}$.

**Esempio.** $\Sigma = \begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}$: $(2 - \lambda)^2 - 1 = 0$ dà $\lambda_1 = 3$ e $\lambda_2 = 1$, con $\mathbf{e}_1 = \frac{1}{\sqrt{2}}(1, 1)^t$ ed $\mathbf{e}_2 = \frac{1}{\sqrt{2}}(1, -1)^t$. Le ellissi di isolivello della gaussiana hanno l'asse maggiore a 45°, lungo $\mathbf{e}_1$, e rapporto tra gli assi $\sqrt{3} \approx 1.73$. Se proietto su $\mathbf{e}_1$ conservo $3/4$ della varianza totale.`,
    checklist: [
      md`PCA: metodo non supervisionato, minimo errore di ricostruzione, autovettori con gli autovalori più grandi`,
      md`definizione di $\Sigma$ con le due forme e costruzione dai dati`,
      md`contenuto: varianze sulla diagonale, covarianze fuori, e loro segno`,
      md`proprietà: simmetrica, semidefinita positiva, diagonale con feature indipendenti`,
      md`equazione caratteristica $\vert\Sigma - \lambda I\vert = 0$, autovettori da $(\Sigma - \lambda_i I)\mathbf{e}_i = \mathbf{0}$`,
      md`significato: $\lambda_i$ varianza lungo $\mathbf{e}_i$, assi delle ellissi, esempio $2 \times 2$`,
    ],
    followUps: [
      {
        q: md`Perché gli autovalori di $\Sigma$ non possono essere negativi?`,
        a: md`Perché $\lambda_i = \mathbf{e}_i^t\Sigma\mathbf{e}_i = \mathrm{var}\{\mathbf{e}_i^t\mathbf{x}\}$ è una varianza. Il verso logico è questo: ogni varianza è non negativa, quindi $\Sigma$ è semidefinita positiva e ha autovalori non negativi.`,
      },
      {
        q: md`Quanti elementi distinti ha $\Sigma$?`,
        a: md`$\frac{n(n+1)}{2}$, grazie alla simmetria: le $n$ varianze e le $\frac{n(n-1)}{2}$ covarianze.`,
      },
      {
        q: md`Che differenza c'è tra PCA e LDA?`,
        a: md`La PCA è non supervisionata e cerca la proiezione che rappresenta meglio i dati. La LDA usa le etichette e cerca la proiezione che separa meglio le classi, massimizzando $J(\mathbf{w}) = \frac{\vert \tilde{m}_1 - \tilde{m}_2 \vert^2}{\tilde{s}_1^2 + \tilde{s}_2^2}$. La direzione di massima varianza non è per forza quella che separa le classi.`,
      },
    ],
  },
  {
    id: 'or-banca-8',
    q: md`Reti bayesiane: formalizzazione (DAG, indipendenze locali, i casi della d-separazione, criterio generale di d-separazione e indipendenze globali) e apprendimento dei parametri (ML con dati completi, MAP con conoscenza a priori, EM con dati incompleti).`,
    qEn: 'Bayesian networks: formalization (DAG, local independencies, the cases of d-separation, general d-separation criterion and global independencies) and parameter learning (ML with complete data, MAP with prior knowledge, EM with incomplete data).',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Bayesian networks: formalization (DAG, local independencies, various case of d-separation criterion, general d-separation criterion and global independencies) and learning of the parameters (ML with complete data, MAP with prior knowledge, EM with incomplete data)',
    answer: md`**Formalizzazione.** Una rete bayesiana è una coppia $(G, p)$. $G$ è un grafo orientato aciclico (*directed acyclic graph*, DAG) con un nodo per variabile; $p$ è una distribuzione congiunta che si fattorizza secondo $G$:

$$p(x_1, \ldots, x_m) = \prod_{i=1}^{m} p(x_i \mid Pa_{x_i})$$

Ogni nodo porta una distribuzione condizionata dai genitori (CPD); con variabili discrete è una tabella (CPT). La fattorizzazione riduce di molto i parametri rispetto alla tabella congiunta completa.

**Indipendenze locali.** $G$ dice che ogni variabile è indipendente dai suoi non discendenti, dati i genitori: $I_\ell(G) = \{x_i \perp \mathrm{NonDesc}_{x_i} \mid Pa_{x_i}\}$. Se $p$ soddisfa queste indipendenze, $G$ è una I-map di $p$; e $p$ si fattorizza secondo $G$ se e solo se $G$ è una sua I-map.

**I tre casi base della d-separazione.**
- *Tail-to-tail*, $a \leftarrow c \rightarrow b$ (causa comune): $a$ e $b$ sono dipendenti, e diventano indipendenti se osservo $c$.
- *Head-to-tail*, $a \rightarrow c \rightarrow b$ (catena): dipendenti; indipendenti dato $c$.
- *Head-to-head*, $a \rightarrow c \leftarrow b$ (collider): indipendenti finché non osservo né $c$ né un suo discendente; se osservo $c$ o un discendente diventano dipendenti (*explaining away*).

**Criterio generale.** Gli insiemi $A$ e $B$ sono d-separati da $C$ se ogni cammino tra un nodo di $A$ e un nodo di $B$ è bloccato. Un cammino è bloccato se contiene un nodo in cui le frecce si incontrano tail-to-tail o head-to-tail e il nodo sta in $C$, oppure head-to-head e né il nodo né alcun suo discendente sta in $C$.

**Indipendenze globali.** Il grafo codifica l'insieme $I(G) = \{(A \perp B \mid C) : \mathrm{dsep}_G(A; B \mid C)\}$, le indipendenze globali (di Markov).

**Apprendimento dei parametri.** La struttura è data; stimo le CPD da un dataset $D$ di $N$ esempi.

*ML con dati completi.* $\boldsymbol{\theta}^{max} = \arg\max_{\boldsymbol{\theta}} p(D \mid \boldsymbol{\theta})$, con esempi indipendenti dati $\boldsymbol{\theta}$ e la fattorizzazione della rete:

$$p(D \mid \boldsymbol{\theta}) = \prod_{i=1}^{N} \prod_{j=1}^{m} p(x_j(i) \mid pa_j(i), \boldsymbol{\theta}_{X_j \mid pa_j})$$

Ogni CPD ha i suoi parametri disgiunti, quindi la stimo da sola. Ogni colonna di una CPT è una multinomiale; massimizzando la log-likelihood con il vincolo $\sum_x \theta_{x \mid \mathbf{u}} = 1$ ottengo la frequenza relativa

$$\theta_{x \mid \mathbf{u}}^{max} = \frac{N_{\mathbf{u},x}}{\sum_x N_{\mathbf{u},x}}$$

I problemi: *overfitting* e probabilità nulle per le configurazioni mai viste nel training set.

*MAP con conoscenza a priori.* $\boldsymbol{\theta}^{max} = \arg\max_{\boldsymbol{\theta}} p(D \mid \boldsymbol{\theta})\, p(\boldsymbol{\theta})$, con la prior coniugata della multinomiale, la Dirichlet, i cui parametri $\alpha_{x \mid \mathbf{u}}$ fanno da pseudo-conteggi:

$$\theta_{x \mid \mathbf{u}}^{max} = \frac{N_{\mathbf{u},x} + \alpha_{x \mid \mathbf{u}}}{\sum_x \left(N_{\mathbf{u},x} + \alpha_{x \mid \mathbf{u}}\right)}$$

Con $\alpha$ piccoli torno a ML; con $\alpha$ grandi la prior pesa di più e le configurazioni mai viste ricevono probabilità non nulla. Una precisazione (integrazione): le note (part2 p27) chiamano questa formula stima MAP, ma con la Dirichlet scritta come $\propto \prod_k \theta_k^{\alpha_k - 1}$ (part2 p9) essa è il valore atteso a posteriori, la stessa formula di part2 p11. La moda della posterior, cioè il MAP in senso stretto, è $\frac{N_k + \alpha_k - 1}{N + \alpha - r}$: con $\alpha_k = 1$ (prior uniforme) ridà la stima ML, coerente con «prior uniforme, MAP = ML». La formula delle note è un MAP esatto solo se gli $\alpha$ sono letti come puri pseudo-conteggi, cioè con prior $\propto \prod_k \theta_k^{\alpha_k}$.

*EM con dati incompleti.* Se alcune variabili mancano non posso contare. Parto da parametri iniziali; nel passo E calcolo con l'inferenza sulla rete i conteggi attesi $E_{p(\mathbf{X} \mid D, \boldsymbol{\theta})}[N_{ijk}]$; nel passo M rifaccio la stima ML (o MAP) con quei conteggi; ripeto fino a convergenza, che è garantita verso un ottimo locale.

**Legame con ML di Melgani.** È la stessa definizione $\hat{\boldsymbol{\theta}} = \arg\max p(\mathbf{X} \mid \boldsymbol{\theta})$ con campioni iid: il logaritmo trasforma il doppio prodotto in una somma di termini locali. Per esempio, 12 email con una parola su 40 spam danno $\hat{\theta} = 0.30$; con pseudo-conteggi $\alpha = 1$ su entrambi i valori la formula delle note dà $\frac{12 + 1}{40 + 2} \approx 0.31$. È la media a posteriori con prior uniforme (regola di Laplace, *Laplace's rule of succession*); la moda della posterior con prior uniforme resterebbe $0.30$, uguale a ML.`,
    checklist: [
      md`definizione come coppia $(G, p)$ e fattorizzazione $\prod_i p(x_i \mid Pa_{x_i})$`,
      md`indipendenze locali e I-map`,
      md`tre casi base: tail-to-tail, head-to-tail, head-to-head con explaining away`,
      md`criterio generale di d-separazione e indipendenze globali $I(G)$`,
      md`ML con dati completi: decomposizione per CPD e frequenza relativa`,
      md`MAP con Dirichlet e pseudo-conteggi; EM con conteggi attesi e ottimo locale`,
    ],
    followUps: [
      {
        q: md`Perché l'osservazione di un discendente del collider sblocca il cammino?`,
        a: md`Perché il discendente porta informazione sul collider stesso: sapere che l'allarme ha suonato, anche solo tramite la telefonata di un vicino, rende dipendenti le due cause (furto e terremoto), e una spiega via l'altra.`,
      },
      {
        q: md`Che cosa garantisce EM e che cosa no?`,
        a: md`Ogni iterazione non fa diminuire la likelihood dei dati osservati, e l'algoritmo converge a un ottimo locale. Non garantisce l'ottimo globale: il risultato dipende dall'inizializzazione.`,
      },
      {
        q: md`Che cosa sono i conteggi $N_{\mathbf{u},x}$ dal punto di vista della stima?`,
        a: md`Sono statistiche sufficienti: una volta noti, il resto del dataset non aggiunge informazione sui parametri della CPT.`,
      },
    ],
  },
  {
    id: 'or-banca-9',
    q: md`Apprendimento dei parametri (ML con dati completi, MAP), SVM (margine rigido, lagrangiana, margine morbido), casi non lineari, macchine a kernel, percettrone.`,
    qEn: 'Parameter learning (ML with complete data, MAP), SVM (hard margin, Lagrangian, soft margin), non-linear case, kernel machines, perceptron.',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Learning Parameters  (ML with complete data, MAP), SVM (Hard Margin, Lagrangian, Soft Margin), NonLinear,  Kernel Machine, Perceptron)',
    answer: md`**Apprendimento dei parametri.** Con dati completi uso ML: $\boldsymbol{\theta}^{max} = \arg\max_{\boldsymbol{\theta}} p(D \mid \boldsymbol{\theta})$, con $p(D \mid \boldsymbol{\theta}) = \prod_i p(\mathbf{x}(i) \mid \boldsymbol{\theta})$ perché gli esempi sono iid. Il logaritmo trasforma il prodotto in somma e, in una rete bayesiana, la somma si separa per CPD: ogni parametro è una frequenza relativa, $\theta_{x \mid \mathbf{u}} = N_{\mathbf{u},x}/\sum_x N_{\mathbf{u},x}$. Per una gaussiana la stima ML è la media campionaria (e la covarianza con $1/N$). Con conoscenza a priori uso MAP, $\arg\max_{\boldsymbol{\theta}} p(D \mid \boldsymbol{\theta})\,p(\boldsymbol{\theta})$: con prior di Dirichlet gli iperparametri fanno da pseudo-conteggi e tolgono le probabilità nulle.

**Percettrone.** $f(\mathbf{x}) = \mathrm{sign}(\mathbf{w}^T\mathbf{x})$, con il bias incluso in $\mathbf{w}$. La funzione d'errore somma i margini funzionali degli esempi sbagliati, $E(\mathbf{w}; D) = \sum_{(\mathbf{x}, y) \in D_E} -y\,\mathbf{w}^T\mathbf{x}$, con gradiente $-\sum_{D_E} y\,\mathbf{x}$. La discesa del gradiente stocastica aggiorna su ogni errore $\mathbf{w} \leftarrow \mathbf{w} + \eta\, y\,\mathbf{x}$. Converge se i dati sono linearmente separabili; non rappresenta lo XOR.

**SVM a margine rigido.** Tra tutti gli iperpiani separatori cerco quello a margine massimo. Con l'iperpiano canonico ($\min_i y_i f(\mathbf{x}_i) = 1$) il margine vale $2/\lVert\mathbf{w}\rVert$, quindi

$$\min_{\mathbf{w}, w_0} \frac{1}{2}\lVert\mathbf{w}\rVert^2 \quad \text{s.t.} \quad y_i(\mathbf{w}^T\mathbf{x}_i + w_0) \geq 1 \;\; \forall i$$

**Lagrangiana e duale.** Con moltiplicatori $\alpha_i \geq 0$:

$$L(\mathbf{w}, w_0, \boldsymbol{\alpha}) = \frac{1}{2}\lVert\mathbf{w}\rVert^2 - \sum_i \alpha_i \left[y_i(\mathbf{w}^T\mathbf{x}_i + w_0) - 1\right]$$

Annullando le derivate: $\mathbf{w} = \sum_i \alpha_i y_i \mathbf{x}_i$ e $\sum_i \alpha_i y_i = 0$. Sostituendo ottengo il duale: massimizzo $\sum_i \alpha_i - \frac{1}{2}\sum_i\sum_j \alpha_i\alpha_j y_i y_j \mathbf{x}_i^T\mathbf{x}_j$ con $\alpha_i \geq 0$ e $\sum_i \alpha_i y_i = 0$. Per le condizioni KKT $\alpha_i\left[y_i f(\mathbf{x}_i) - 1\right] = 0$: solo i punti sul margine hanno $\alpha_i > 0$, e sono i vettori di supporto. Il classificatore è $f(\mathbf{x}) = \sum_i \alpha_i y_i \mathbf{x}_i^T\mathbf{x} + w_0$.

**Margine morbido.** Con dati non separabili ammetto violazioni con variabili di slack $\xi_i \geq 0$:

$$\min \frac{1}{2}\lVert\mathbf{w}\rVert^2 + C\sum_i \xi_i \quad \text{s.t.} \quad y_i(\mathbf{w}^T\mathbf{x}_i + w_0) \geq 1 - \xi_i$$

$C$ regola il compromesso tra margine ampio ed errori sul training; equivale a minimizzare la *hinge loss* più un termine di regolarizzazione. Il duale è lo stesso con $0 \leq \alpha_i \leq C$.

**Caso non lineare e macchine a kernel.** Mappo i dati con $\phi(\mathbf{x})$ in uno spazio dove siano separabili linearmente. Nel duale i dati compaiono solo in prodotti scalari, quindi li sostituisco con un kernel $k(\mathbf{x}, \mathbf{x}') = \phi(\mathbf{x})^T\phi(\mathbf{x}')$ senza calcolare $\phi$ (*kernel trick*): $f(\mathbf{x}) = \sum_i \alpha_i y_i k(\mathbf{x}_i, \mathbf{x}) + w_0$. Un kernel è valido se la matrice di Gram è simmetrica e semidefinita positiva; esempi: lineare, polinomiale $(\mathbf{x}^T\mathbf{x}' + 1)^d$, gaussiano $\exp\left(-\lVert\mathbf{x} - \mathbf{x}'\rVert^2/(2\sigma^2)\right)$. Ogni algoritmo scritto con prodotti scalari si «kernelizza»: il percettrone duale conta gli errori in $\alpha_i$ e classifica con $\sum_i \alpha_i y_i k(\mathbf{x}_i, \mathbf{x})$.`,
    checklist: [
      md`ML con dati completi come $\arg\max p(D \mid \boldsymbol{\theta})$ e soluzione a conteggi; MAP con prior di Dirichlet`,
      md`percettrone: funzione d'errore, gradiente, regola di aggiornamento, separabilità`,
      md`SVM a margine rigido: margine $2/\lVert\mathbf{w}\rVert$ e problema vincolato`,
      md`lagrangiana, condizioni di stazionarietà, duale, KKT e vettori di supporto`,
      md`margine morbido con slack e $C$; duale con $0 \leq \alpha_i \leq C$`,
      md`kernel trick, kernel validi ed esempi, percettrone a kernel`,
    ],
    followUps: [
      {
        q: md`Perché il duale della SVM è comodo?`,
        a: md`Perché i dati compaiono solo nei prodotti scalari $\mathbf{x}_i^T\mathbf{x}_j$, che posso sostituire con un kernel, e perché la soluzione è sparsa: contano solo i vettori di supporto.`,
      },
      {
        q: md`Che cosa succede con $C$ molto grande?`,
        a: md`Le violazioni costano tanto e torno verso il margine rigido: margine stretto, rischio di *overfitting*. Con $C$ piccolo accetto più errori sul training e allargo il margine.`,
      },
      {
        q: md`Che legame c'è tra la stima ML e la funzione di costo di un classificatore?`,
        a: md`Minimizzare i minimi quadrati equivale a ML con rumore gaussiano, e minimizzare la cross-entropy equivale a ML con un modello di Bernoulli sulle etichette. Molte funzioni di costo sono log-likelihood negative.`,
      },
    ],
  },
  {
    id: 'or-banca-10',
    q: md`Come si usa la stima dei parametri nelle reti bayesiane?`,
    qEn: 'How is parameter estimation used in Bayesian networks?',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'How to use parameter estimation in Bayesian Networks',
    answer: md`**Il problema.** Ho la struttura della rete (il DAG) e un dataset $D = \{\mathbf{x}(1), \ldots, \mathbf{x}(N)\}$; devo riempire le CPD, cioè stimare i parametri $\boldsymbol{\theta}$ delle distribuzioni condizionate $p(x_j \mid Pa_{x_j})$. Dopo la stima uso la rete per l'inferenza.

**Dati completi: ML.** Scelgo i parametri che rendono i dati osservati il più «probabili» possibile, $\boldsymbol{\theta}^{max} = \arg\max_{\boldsymbol{\theta}} p(D \mid \boldsymbol{\theta})$. Gli esempi sono indipendenti dati $\boldsymbol{\theta}$ e ogni esempio si fattorizza secondo la rete:

$$p(D \mid \boldsymbol{\theta}) = \prod_{i=1}^{N} \prod_{j=1}^{m} p(x_j(i) \mid pa_j(i), \boldsymbol{\theta}_{X_j \mid pa_j})$$

Ogni CPD ha i suoi parametri, disgiunti dagli altri: la likelihood si spezza in likelihood locali, una per CPD, e le massimizzo separatamente. Per una CPT la likelihood locale è $\prod_{\mathbf{u}} \prod_x \theta_{x \mid \mathbf{u}}^{N_{\mathbf{u},x}}$; annullando il gradiente della log-likelihood con il vincolo $\sum_x \theta_{x \mid \mathbf{u}} = 1$ ottengo

$$\theta_{x \mid \mathbf{u}}^{max} = \frac{N_{\mathbf{u},x}}{\sum_x N_{\mathbf{u},x}}$$

la frazione di volte in cui compare la configurazione $(X = x, \mathbf{U} = \mathbf{u})$. Per un nodo continuo gaussiano la stima ML è la media e la varianza campionarie dei casi con quella configurazione dei genitori.

**Pochi dati: MAP.** ML va in *overfitting* e dà probabilità zero alle configurazioni mai viste. Aggiungo una prior: $\boldsymbol{\theta}^{max} = \arg\max_{\boldsymbol{\theta}} p(D \mid \boldsymbol{\theta})\,p(\boldsymbol{\theta})$. La prior coniugata della multinomiale è la Dirichlet, con iperparametri $\alpha_{x \mid \mathbf{u}}$ che fanno da osservazioni immaginarie:

$$\theta_{x \mid \mathbf{u}}^{max} = \frac{N_{\mathbf{u},x} + \alpha_{x \mid \mathbf{u}}}{\sum_x \left(N_{\mathbf{u},x} + \alpha_{x \mid \mathbf{u}}\right)}$$

**Dati incompleti: EM.** Se alcune variabili mancano i conteggi non si calcolano direttamente, e la soluzione bayesiana completa è spesso intrattabile. Con EM stimo i conteggi attesi con l'inferenza sulla rete corrente (passo E), rifaccio la stima ML o MAP con quei conteggi (passo M) e ripeto fino alla convergenza a un ottimo locale.

**Esempio.** Nodo «spam» senza genitori e nodo «contiene la parola gratis» con genitore «spam». Su 40 email di spam la parola compare 12 volte: $\hat{\theta}_{\text{gratis} \mid \text{spam}} = 12/40 = 0.30$. Se in 60 email normali non compare mai, ML dà $0$ e una sola email normale con quella parola diventerebbe impossibile; con $\alpha = 1$ la formula delle note dà $\frac{0 + 1}{60 + 2} \approx 0.016$. Attenzione: le note la chiamano MAP, ma con la Dirichlet di part2 p9 ($\propto \theta^{\alpha - 1}$) è il valore atteso a posteriori (part2 p11); con $\alpha = 1$ la prior è uniforme e la sua moda, il MAP in senso stretto, ridarebbe ML, cioè $0$. $\frac{K + 1}{N + 2}$ è la regola di Laplace (*Laplace's rule of succession*).`,
    checklist: [
      md`obiettivo: struttura data, stima delle CPD, poi inferenza`,
      md`ML con dati completi: likelihood come doppio prodotto, decomposizione per CPD`,
      md`soluzione ML per una CPT: frequenza relativa $N_{\mathbf{u},x}/\sum_x N_{\mathbf{u},x}$`,
      md`MAP con prior di Dirichlet e pseudo-conteggi contro overfitting e zeri`,
      md`EM con dati incompleti: conteggi attesi, passo M, ottimo locale`,
    ],
    followUps: [
      {
        q: md`Perché le CPD si stimano separatamente?`,
        a: md`Perché ogni CPD ha un sottoinsieme disgiunto di parametri: dopo il logaritmo la log-likelihood è una somma di termini, ognuno dipendente da una sola CPD, e il massimo di una somma di funzioni di variabili diverse si trova massimizzando ogni termine.`,
      },
      {
        q: md`Da dove viene la frequenza relativa?`,
        a: md`Massimizzo $\sum_x N_{\mathbf{u},x}\ln\theta_{x \mid \mathbf{u}}$ con il vincolo $\sum_x \theta_{x \mid \mathbf{u}} = 1$. Con il moltiplicatore di Lagrange $\lambda$: $N_{\mathbf{u},x}/\theta_{x \mid \mathbf{u}} = \lambda$, quindi $\theta_{x \mid \mathbf{u}} \propto N_{\mathbf{u},x}$ e normalizzando ottengo la frazione.`,
      },
      {
        q: md`E se voglio stimare anche la struttura?`,
        a: md`È un altro problema: si cercano grafi che massimizzano un punteggio penalizzato sui dati, e per ogni grafo candidato si stimano i parametri come sopra.`,
      },
    ],
  },
  {
    id: 'or-banca-11',
    q: md`Perché la stima ML è veloce in una rete bayesiana (indipendenza delle CPD)?`,
    qEn: 'Why is ML estimation fast in a Bayesian network (independence of the CPDs)?',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Why ML is fast in Bayesian Network (CDP independence)',
    answer: md`**La ragione.** Con dati completi la likelihood si decompone. Gli esempi sono iid, quindi $p(D \mid \boldsymbol{\theta}) = \prod_i p(\mathbf{x}(i) \mid \boldsymbol{\theta})$; ogni esempio si fattorizza secondo la rete; ogni CPD ha parametri propri, disgiunti da quelli delle altre:

$$p(D \mid \boldsymbol{\theta}) = \prod_{i=1}^{N} \prod_{j=1}^{m} p(x_j(i) \mid pa_j(i), \boldsymbol{\theta}_{X_j \mid pa_j}) = \prod_{j=1}^{m} L(\boldsymbol{\theta}_{X_j \mid pa_j}, D)$$

con $L(\boldsymbol{\theta}_{X_j \mid pa_j}, D) = \prod_{i=1}^{N} p(x_j(i) \mid pa_j(i), \boldsymbol{\theta}_{X_j \mid pa_j})$. Scambiando l'ordine dei due prodotti ottengo un prodotto di likelihood locali, una per CPD. Il logaritmo lo trasforma in una somma di termini che dipendono da parametri diversi: massimizzo ogni termine per conto suo. Dentro una CPT la decomposizione continua, perché ogni colonna (una configurazione $\mathbf{u}$ dei genitori) è una multinomiale indipendente dalle altre.

**Forma chiusa.** Ogni problema locale ha soluzione esplicita: la frequenza relativa $\theta_{x \mid \mathbf{u}} = N_{\mathbf{u},x}/\sum_x N_{\mathbf{u},x}$. Non servono iterazioni né inferenza: basta una passata sul dataset per contare. I conteggi $N_{\mathbf{u},x}$ sono statistiche sufficienti, quindi dopo averli calcolati posso buttare i dati.

**Confronto.** Senza decomposizione dovrei ottimizzare tutti i parametri insieme su una likelihood accoppiata. È quello che succede con dati incompleti: la variabile mancante lega più CPD, i conteggi non si leggono più dai dati, e serve EM con inferenza a ogni iterazione.

**Legame con il corso di Melgani.** È la proprietà vista per i campioni iid: il logaritmo trasforma i prodotti in somme, $\ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \sum_k \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})$, e ogni pezzo contribuisce in modo additivo al gradiente. Nella rete la somma si spezza due volte, sui campioni e sui nodi.`,
    checklist: [
      md`likelihood come doppio prodotto su esempi e nodi`,
      md`parametri disgiunti per ogni CPD: prodotto di likelihood locali`,
      md`logaritmo: somma di termini indipendenti, massimizzati separatamente`,
      md`soluzione in forma chiusa con i conteggi, una sola passata sui dati`,
      md`confronto con dati incompleti ed EM`,
    ],
    followUps: [
      {
        q: md`Che cosa vuol dire che i conteggi sono statistiche sufficienti?`,
        a: md`Che la likelihood dipende dai dati solo attraverso i conteggi: due dataset con gli stessi $N_{\mathbf{u},x}$ danno la stessa stima.`,
      },
      {
        q: md`La decomposizione vale anche per MAP?`,
        a: md`Sì, se la prior si fattorizza sulle CPD, come con Dirichlet indipendenti per ogni colonna: la posterior si spezza allo stesso modo e ogni colonna ha la sua formula con pseudo-conteggi.`,
      },
      {
        q: md`Quanti parametri ha una CPT?`,
        a: md`Per un nodo con $k$ valori e genitori con $\prod_j k_j$ configurazioni: $(k - 1)\prod_j k_j$ parametri liberi, perché ogni colonna somma a 1.`,
      },
    ],
  },
  {
    id: 'or-banca-12',
    q: md`Esempio di stima dei parametri di una gaussiana: perché anche la posterior risulta gaussiana?`,
    qEn: 'Example of estimation of Gaussian parameters: why do we also obtain a Gaussian as the posterior?',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Example of estimation of Gaussian parameters: why do we obtain a Gaussian also as posterior?',
    answer: md`**Stima ML.** Con $N$ campioni iid da $N(\mu, \sigma^2)$ la log-likelihood è $-N\ln(\sigma\sqrt{2\pi}) - \frac{1}{2\sigma^2}\sum_k (x_k - \mu)^2$. Derivando e ponendo a zero: $\hat{\mu} = \frac{1}{N}\sum_k x_k$ e, se anche $\sigma^2$ è ignota, $\hat{\sigma}^2 = \frac{1}{N}\sum_k (x_k - \hat{\mu})^2$.

**Stima bayesiana della media.** Tengo $\sigma^2$ nota e metto su $\mu$ una prior gaussiana, $p(\mu) \sim N(\mu_0, \sigma_0^2)$. La posterior è proporzionale a likelihood per prior:

$$p(\mu \mid \mathbf{X}) = \alpha \prod_{k=1}^{N} p(x_k \mid \mu)\, p(\mu)$$

**Perché resta gaussiana.** Entrambi i fattori sono esponenziali di polinomi di secondo grado in $\mu$. Il prodotto somma gli esponenti, e una somma di quadratiche in $\mu$ è ancora una quadratica:

$$p(\mu \mid \mathbf{X}) = \alpha'' \exp\left\{-\frac{1}{2}\left[\left(\frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}\right)\mu^2 - 2\left(\frac{1}{\sigma^2}\sum_{k=1}^{N} x_k + \frac{\mu_0}{\sigma_0^2}\right)\mu\right]\right\}$$

Completando il quadrato riconosco una gaussiana $N(\mu_N, \sigma_N^2)$, con

$$\frac{1}{\sigma_N^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}, \qquad \mu_N = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\,\bar{X} + \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\,\mu_0, \qquad \sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2 + \sigma^2}$$

La gaussiana è la prior coniugata (*conjugate prior*) della media gaussiana: prior e posterior hanno la stessa forma, e l'aggiornamento cambia solo i parametri.

**Lettura.** Le precisioni si sommano: quella dei dati, $N/\sigma^2$, e quella della prior, $1/\sigma_0^2$. $\mu_N$ è una media pesata tra la media campionaria e $\mu_0$, con pesi proporzionali alle precisioni. Al crescere di $N$ il peso va tutto sui dati, $\mu_N \to \bar{X}$ (la stima ML), e $\sigma_N^2 \to 0$: la posterior diventa una delta di Dirac. Infine $p(x \mid \mathbf{X}) = \int p(x \mid \mu)\,p(\mu \mid \mathbf{X})\,d\mu \sim N(\mu_N, \sigma^2 + \sigma_N^2)$: anche la predittiva è gaussiana, con l'incertezza su $\mu$ che si somma al rumore.

**Esempio.** $\sigma^2 = 1$, prior $N(0, 1)$, $N = 4$ campioni con $\bar{X} = 2$: $\mu_N = \frac{4}{5}\cdot 2 + \frac{1}{5}\cdot 0 = 1.6$ e $\sigma_N^2 = \frac{1}{5} = 0.2$. La stima ML sarebbe 2; la prior tira verso 0.`,
    checklist: [
      md`stime ML di media e varianza di una gaussiana`,
      md`posterior proporzionale a likelihood per prior, con prior $N(\mu_0, \sigma_0^2)$`,
      md`prodotto di esponenziali di quadratiche in $\mu$: ancora una quadratica, quindi gaussiana`,
      md`formule di $\mu_N$ e $\sigma_N^2$ e concetto di prior coniugata`,
      md`limite $N \to \infty$: $\mu_N \to$ stima ML, $\sigma_N^2 \to 0$; predittiva $N(\mu_N, \sigma^2 + \sigma_N^2)$`,
    ],
    followUps: [
      {
        q: md`E se la prior su $\mu$ non fosse gaussiana, per esempio uniforme su un intervallo?`,
        a: md`La posterior sarebbe la likelihood (una campana centrata in $\bar{X}$, larga $\sigma/\sqrt{N}$) troncata all'intervallo e rinormalizzata: non più una gaussiana, e il suo massimo coincide con la stima ML se $\bar{X}$ cade nell'intervallo.`,
      },
      {
        q: md`Qual è la prior coniugata per una Bernoulli?`,
        a: md`La Beta; per una multinomiale la Dirichlet. La posterior ha la stessa forma con i conteggi osservati sommati agli iperparametri.`,
      },
      {
        q: md`Perché $\sigma_N^2$ non dipende dai valori dei campioni?`,
        a: md`Perché con $\sigma^2$ nota la precisione della likelihood in $\mu$ è $N/\sigma^2$, che dipende solo da quanti campioni ho. I valori spostano il centro, non la larghezza.`,
      },
    ],
  },
  {
    id: 'or-banca-13',
    q: md`Schema a blocchi e fasi di progetto di un sistema di machine learning: descrivi tutti i blocchi e le fasi con esempi (in particolare l'acquisizione dei dati e l'estrazione delle feature: qual è la feature migliore per discriminare, con il riferimento alla LDA).`,
    qEn: 'Block scheme and design phases of an ML system: describe all the blocks and phases with examples (in particular data acquisition and feature extraction: which is the best feature in terms of discrimination, with a reference to LDA).',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Block scheme/Design phases of an ML system, describe all the blocks and phases with examples (in particular at the beginning of data acquisition and feature extraction, which is the best feature in terms of discrimination, cit. of LDA).',
    answer: md`**Schema a blocchi.** Mondo fisico → acquisizione → pre-processing → estrazione delle feature → classificazione → post-processing → decisione, con un supervisore che fornisce le etichette in addestramento. Esempio del corso, l'impianto che smista i pesci: una telecamera acquisisce l'immagine del nastro; il pre-processing la segmenta per isolare ogni pesce dagli altri e dallo sfondo; l'estrazione delle feature misura proprietà utili a distinguere le specie (lunghezza, luminosità, larghezza); il classificatore valuta l'evidenza e decide salmone o spigola; il post-processing può correggere la decisione con il contesto o con i costi.

**Fasi di progetto.** Raccolta dei dati → scelta delle feature → scelta del modello → addestramento del classificatore → valutazione del classificatore, con la conoscenza a priori che guida ogni passo e un ciclo che torna indietro se la valutazione non soddisfa.

**Acquisizione e scelta del modello.** Il blocco di acquisizione decide già la statistica dei dati, e per questo la scelta del modello $p(\mathbf{x})$ guarda tre aspetti: la natura statistica intrinseca del fenomeno fisico; il rumore introdotto dal mezzo di propagazione durante la trasmissione e dal sensore durante l'acquisizione; il pre-processing e l'estrazione delle feature fatti prima del classificatore. Esempio: l'ampiezza dell'eco radar da molti diffusori è Rayleigh; se ne faccio il quadrato e la media su $L$ look ottengo una Gamma.

**La feature migliore per discriminare.** Nell'esempio dei pesci la lunghezza da sola separa male le due classi, la luminosità meglio ma non abbastanza; aggiungendo la larghezza passo a un vettore $\mathbf{x} = [x_1, x_2]$ e le classi si separano meglio. Una feature discrimina bene se allontana le medie delle classi rispetto alla loro dispersione interna. È il criterio di Fisher, alla base della LDA (*Linear Discriminant Analysis*), che cerca la proiezione $\mathbf{w}$ che massimizza

$$J(\mathbf{w}) = \frac{\vert \tilde{m}_1 - \tilde{m}_2 \vert^2}{\tilde{s}_1^2 + \tilde{s}_2^2}$$

con $\tilde{m}_i$ media e $\tilde{s}_i^2$ dispersione dei campioni proiettati della classe $i$. La PCA invece è non supervisionata: conserva la varianza, non la separazione.

**Attenzione all'overfitting.** Un classificatore molto non lineare può separare perfettamente il training set e generalizzare male: bisogna lasciare margine per classificare correttamente campioni nuovi.`,
    checklist: [
      md`blocchi: acquisizione, pre-processing, estrazione delle feature, classificazione, post-processing, decisione, supervisore`,
      md`fasi: raccolta dati, scelta delle feature, scelta del modello, addestramento, valutazione, conoscenza a priori`,
      md`esempio dell'impianto dei pesci con segmentazione e feature`,
      md`tre aspetti per scegliere il modello statistico (fenomeno, rumore, pre-processing)`,
      md`feature discriminante: criterio di Fisher e LDA`,
      md`generalizzazione e rischio di overfitting`,
    ],
    followUps: [
      {
        q: md`Aggiungere feature migliora sempre?`,
        a: md`No. Con un numero fisso di campioni, oltre un certo punto le prestazioni peggiorano perché i parametri da stimare crescono più dei dati (effetto Hughes): una gaussiana in $n$ dimensioni ha $n + n(n+1)/2$ parametri.`,
      },
      {
        q: md`Che cosa distingue la selezione dall'estrazione delle feature?`,
        a: md`La selezione sceglie un sottoinsieme delle feature originali; l'estrazione ne costruisce di nuove combinandole, come la PCA o la LDA.`,
      },
      {
        q: md`Perché il pre-processing cambia il modello statistico?`,
        a: md`Perché ogni trasformazione cambia la distribuzione: il quadrato di una gaussiana standard (media 0, varianza 1) dà una chi-quadro con 1 grado di libertà, il modulo di due gaussiane indipendenti a media nulla e con la stessa varianza una Rayleigh, il logaritmo di una log-normale una gaussiana.`,
      },
    ],
  },
  {
    id: 'or-banca-14',
    q: md`Criterio MAP: confronto e differenze principali con il criterio ML.`,
    qEn: 'MAP criterion: comparison and main differences with the ML criterion.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'MAP criterion: comparison and main differences between ML.',
    answer: md`**Criterio MAP.** Ipotesi: conosco le probabilità a posteriori delle classi $P(\omega_i \mid \mathbf{x})$, $i = 1, \ldots, C$. Obiettivo: minimizzare la probabilità d'errore media. Regola: assegno $\mathbf{x}$ alla classe con posterior massima,

$$\mathbf{x} \in \omega_j \iff P(\omega_j \mid \mathbf{x}) \geq P(\omega_i \mid \mathbf{x}), \quad i = 1, \ldots, C$$

Le posterior di solito non sono note direttamente, quindi uso il teorema di Bayes (posterior = likelihood × prior / evidenza) e, poiché l'evidenza $p(\mathbf{x})$ è comune a tutte le classi:

$$\mathbf{x} \in \omega_j \iff P(\omega_j)\,p(\mathbf{x} \mid \omega_j) \geq P(\omega_i)\,p(\mathbf{x} \mid \omega_i)$$

È ottimo: la probabilità d'errore è $P(err) = 1 - \sum_i P(\omega_i)\int_{\Omega_i} p(\mathbf{x} \mid \omega_i)\,d\mathbf{x}$, e MAP sceglie in ogni punto la classe che massimizza l'integrando.

**Criterio ML.** Ipotesi: conosco solo le pdf condizionate $p(\mathbf{x} \mid \omega_i)$. Regola:

$$\mathbf{x} \in \omega_j \iff p(\mathbf{x} \mid \omega_j) \geq p(\mathbf{x} \mid \omega_i), \quad i = 1, \ldots, C$$

**Differenze.**
- MAP usa le prior, ML le ignora.
- Se le prior sono uguali, ML equivale al criterio MAP ottimo; se sono diverse ML è sub-ottimo e favorisce la classe rara.
- Le frontiere di decisione di MAP si spostano verso la classe meno probabile, quelle di ML stanno dove le pdf si incrociano.

**Esempio.** In un punto $x$: $p(x \mid \omega_1) = 0.2$, $p(x \mid \omega_2) = 0.3$, con prior $P(\omega_1) = 2/3$ e $P(\omega_2) = 1/3$. ML sceglie $\omega_2$. MAP confronta $\frac{2}{3}\cdot 0.2 \approx 0.133$ con $\frac{1}{3}\cdot 0.3 = 0.1$ e sceglie $\omega_1$.

**Da non confondere.** Il criterio ML di classificazione tiene fisso il campione $\mathbf{x}$ e varia la classe. La stima ML dei parametri tiene fissi i campioni di training e varia $\boldsymbol{\theta}$. Nella pratica si usano in sequenza: prima stimo con ML le pdf di classe $p(\mathbf{x} \mid \omega_i)$ dai campioni etichettati di ogni classe, poi le uso nel criterio ML o MAP.`,
    checklist: [
      md`MAP: ipotesi, obiettivo (minima probabilità d'errore) e regola con le posterior`,
      md`riscrittura con Bayes: $P(\omega_j)\,p(\mathbf{x} \mid \omega_j)$`,
      md`ML: ipotesi (solo pdf di classe) e regola`,
      md`con prior uguali ML equivale a MAP; altrimenti è sub-ottimo`,
      md`esempio numerico in cui le due decisioni differiscono`,
      md`distinzione tra criterio ML di classificazione e stima ML dei parametri`,
    ],
    followUps: [
      {
        q: md`Perché MAP minimizza la probabilità d'errore?`,
        a: md`Perché $P(err) = 1 - \int P(\text{corretto} \mid \mathbf{x})\,p(\mathbf{x})\,d\mathbf{x}$ e in ogni punto la probabilità di decidere giusto è la posterior della classe scelta: prendendo la massima in ogni punto massimizzo l'integrale.`,
      },
      {
        q: md`Quando conviene ML se MAP è ottimo?`,
        a: md`Quando le prior non sono note o non sono affidabili, per esempio perché il training set non rispecchia le proporzioni reali delle classi. Con prior uguali perdo nulla.`,
      },
      {
        q: md`Come si scrive MAP con il rapporto di verosimiglianza in due classi?`,
        a: md`Scelgo $\omega_1$ se $L(\mathbf{x}) = \frac{p(\mathbf{x} \mid \omega_1)}{p(\mathbf{x} \mid \omega_2)} \geq \frac{P(\omega_2)}{P(\omega_1)}$. Per ML la soglia vale 1.`,
      },
    ],
  },
  {
    id: 'or-banca-15',
    q: md`Come funziona il criterio a minimo rischio? Confrontalo con MAP e con la classificazione ML. Qual è il migliore?`,
    qEn: 'How does the minimum risk criterion work? Compare it with MAP and ML classification. Which one is the best?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'How does the Minimum risk criterium work, comparison with MAP and ML classification. Which is the best one (minimum risk).',
    answer: md`**Idea.** MAP e ML minimizzano la probabilità d'errore senza badare a quanto costa ogni errore. In molte applicazioni ogni decisione è seguita da un'azione con un costo, e sbagliare in un verso costa più che sbagliare nell'altro. La teoria del minimo rischio porta questi costi nella decisione e contiene MAP e ML come casi particolari.

**Ingredienti.** Un insieme di $R$ azioni $A = \{\alpha_1, \ldots, \alpha_R\}$, $C$ classi e una matrice dei costi $\Lambda$ di dimensione $R \times C$, con $\lambda_{ij} = \lambda(\alpha_i \mid \omega_j) \geq 0$ costo dell'azione $\alpha_i$ quando la classe vera è $\omega_j$.

**Rischio condizionato e rischio di Bayes.** Per ogni $\mathbf{x}$ calcolo il costo atteso di ogni azione:

$$R(\alpha_i \mid \mathbf{x}) = \sum_{j=1}^{C} \lambda(\alpha_i \mid \omega_j)\, P(\omega_j \mid \mathbf{x})$$

e scelgo l'azione con rischio condizionato minimo: $\alpha^* = \alpha_j \iff R(\alpha_j \mid \mathbf{x}) \leq R(\alpha_i \mid \mathbf{x})$ per ogni $i$. Il rischio complessivo che ne risulta, $R^* = \int R(\alpha^*(\mathbf{x}) \mid \mathbf{x})\, p(\mathbf{x})\, d\mathbf{x}$, è il rischio di Bayes: la miglior prestazione raggiungibile.

**Due classi, due azioni.** $R(\alpha_1 \mid \mathbf{x}) = P(\omega_1 \mid \mathbf{x})\lambda_{11} + P(\omega_2 \mid \mathbf{x})\lambda_{12}$ e $R(\alpha_2 \mid \mathbf{x}) = P(\omega_1 \mid \mathbf{x})\lambda_{21} + P(\omega_2 \mid \mathbf{x})\lambda_{22}$. Scelgo $\alpha_1$ se $R(\alpha_1 \mid \mathbf{x}) \leq R(\alpha_2 \mid \mathbf{x})$, cioè, con Bayes e con $\lambda_{21} - \lambda_{11} > 0$:

$$L(\mathbf{x}) = \frac{p(\mathbf{x} \mid \omega_1)}{p(\mathbf{x} \mid \omega_2)} \geq \frac{P(\omega_2)}{P(\omega_1)}\,\frac{\lambda_{12} - \lambda_{22}}{\lambda_{21} - \lambda_{11}}$$

L'ipotesi $\lambda_{21} - \lambda_{11} > 0$ vale di solito: le azioni corrette, sulla diagonale, costano meno.

**Confronto.** Con costi nulli per le azioni corrette ($\lambda_{11} = \lambda_{22} = 0$) la soglia è $\frac{P(\omega_2)\lambda_{12}}{P(\omega_1)\lambda_{21}}$. Se in più $\lambda_{12} = \lambda_{21}$ (costi 0-1) il minimo rischio coincide con MAP, soglia $P(\omega_2)/P(\omega_1)$. Se anche le prior sono uguali coincide con ML, soglia 1.

**Esempio.** Classi «incendio» e «nessun incendio», azioni «chiamo i pompieri» e «non li chiamo». Chiamarli senza incendio costa $10^3$ euro, non chiamarli con l'incendio $10^6$. Chiamo se $10^3\,P(\text{nessun incendio} \mid \mathbf{x}) \leq 10^6\,P(\text{incendio} \mid \mathbf{x})$, cioè già con $P(\text{incendio} \mid \mathbf{x}) \geq 1/1001 \approx 0.001$. MAP chiamerebbe solo sopra 0.5.

**Il migliore.** Il minimo rischio, perché è il più generale: raggiunge il rischio di Bayes con qualunque matrice dei costi. MAP è ottimo solo per la probabilità d'errore, cioè con costi 0-1; ML lo è solo se anche le prior sono uguali. Il prezzo del minimo rischio è che richiede di conoscere prior, pdf di classe e costi.`,
    checklist: [
      md`motivazione: costi diversi per errori diversi`,
      md`azioni, classi, matrice dei costi $\lambda_{ij}$`,
      md`rischio condizionato, regola di decisione, rischio di Bayes`,
      md`caso a due classi con il rapporto di verosimiglianza e la soglia`,
      md`riduzione a MAP (costi 0-1) e a ML (prior uguali)`,
      md`esempio dei pompieri e conclusione: il minimo rischio è il più generale`,
    ],
    followUps: [
      {
        q: md`Che cosa si fa se le prior non sono note ma i costi sì?`,
        a: md`Si usa il criterio minimax, che minimizza il rischio nel caso peggiore rispetto alle prior; se si vuole fissare una probabilità di falso allarme si usa Neyman-Pearson.`,
      },
      {
        q: md`Il minimo rischio minimizza anche la probabilità d'errore?`,
        a: md`No, in generale no: accetta più errori del tipo economico per evitarne di costosi. Nell'esempio dei pompieri ci sono molti falsi allarmi.`,
      },
      {
        q: md`Da dove vengono le pdf $p(\mathbf{x} \mid \omega_i)$ che entrano nel rapporto?`,
        a: md`Le stimo dai campioni etichettati di ogni classe, per esempio con la stima ML dei parametri di una gaussiana, oppure con un metodo non parametrico come Parzen o K-NN.`,
      },
    ],
  },

  // --- domande sulle parti più chieste ---
  {
    id: 'or-log-likelihood',
    q: md`Perché nella stima ML si passa alla log-likelihood? Dimostra che il punto di massimo non cambia.`,
    qEn: 'Why do we switch to the log-likelihood in ML estimation? Prove that the maximizer does not change.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Perché conviene.** La slide dice che per scopi analitici (*analytical purposes*) è più facile lavorare con il logaritmo della likelihood. Vedo tre motivi.

- Con campioni iid la likelihood è un prodotto di $N$ fattori; il logaritmo lo trasforma in una somma, che derivo termine a termine: $\ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \sum_{k=1}^{N} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})$.
- Molti modelli, a partire dal gaussiano, contengono un esponenziale: il logaritmo lo elimina e lascia un polinomio nei parametri. Per la media gaussiana la log-likelihood è una parabola, $-N\ln(\sigma\sqrt{2\pi}) - \frac{1}{2\sigma^2}\sum_k (x_k - m)^2$.
- Numericamente il prodotto di tanti numeri piccoli va in underflow. Con 40 email e $\hat{\theta} = 0.3$ la likelihood vale $0.3^{12}\cdot 0.7^{28} \approx 2.4 \cdot 10^{-11}$, con qualche migliaio di campioni scende sotto il più piccolo numero rappresentabile. La log-likelihood vale $-24.43$ e resta maneggevole.

**Dimostrazione.** Il logaritmo è strettamente crescente: per $u > 0$, $\frac{d}{du}\ln u = \frac{1}{u} > 0$. Quindi conserva l'ordine:

$$p(\mathbf{X} \mid \boldsymbol{\theta}_1) > p(\mathbf{X} \mid \boldsymbol{\theta}_2) > 0 \;\Rightarrow\; \ln p(\mathbf{X} \mid \boldsymbol{\theta}_1) > \ln p(\mathbf{X} \mid \boldsymbol{\theta}_2)$$

Se $\hat{\boldsymbol{\theta}}$ massimizza la likelihood, $p(\mathbf{X} \mid \hat{\boldsymbol{\theta}}) \geq p(\mathbf{X} \mid \boldsymbol{\theta})$ per ogni $\boldsymbol{\theta}$, e applicando il logaritmo la disuguaglianza resta vera: $\hat{\boldsymbol{\theta}}$ massimizza anche la log-likelihood. Il viceversa vale perché l'esponenziale, l'inversa del logaritmo, è anch'essa crescente. Quindi

$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta}) = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta})$$

Anche i punti stazionari coincidono: $\nabla_{\boldsymbol{\theta}} \ln p = \frac{\nabla_{\boldsymbol{\theta}} p}{p}$ si annulla dove si annulla $\nabla_{\boldsymbol{\theta}} p$, finché $p > 0$.

**Che cosa cambia e che cosa no.** Cambia il valore del massimo (il logaritmo di un numero minore di 1 è negativo), non la sua posizione. Serve $p(\mathbf{X} \mid \boldsymbol{\theta}) > 0$: dove la likelihood è nulla la log-likelihood vale $-\infty$ e quel $\boldsymbol{\theta}$ è escluso comunque.`,
    checklist: [
      md`prodotto in somma: $\ln\prod_k = \sum_k \ln$`,
      md`esponenziali eliminati: polinomio nei parametri`,
      md`underflow numerico con molti campioni`,
      md`dimostrazione con la monotonia stretta: stesso ordine, stesso $\arg\max$`,
      md`cambia il valore del massimo, non la sua posizione; serve $p > 0$`,
    ],
    followUps: [
      {
        q: md`Funzionerebbe con una trasformazione non monotona, per esempio il quadrato?`,
        a: md`Non in generale: una trasformazione che non conserva l'ordine può spostare il massimo. Il quadrato è crescente solo sui numeri positivi; il logaritmo va bene perché è strettamente crescente su tutto il dominio della likelihood.`,
      },
      {
        q: md`La log-likelihood è sempre concava?`,
        a: md`No. Per la media gaussiana sì (derivata seconda $-N/\sigma^2$), ma per le misture di gaussiane ha più massimi locali e serve un metodo iterativo come EM.`,
      },
      {
        q: md`Quanto vale la log-likelihood di una Bernoulli nel massimo?`,
        a: md`$K\ln\hat{\theta} + (N - K)\ln(1 - \hat{\theta})$ con $\hat{\theta} = K/N$: con $N = 40$ e $K = 12$ vale $12\ln 0.3 + 28\ln 0.7 \approx -24.43$.`,
      },
    ],
  },
  {
    id: 'or-ml-search',
    q: md`Spiega l'esempio della slide: stima ML della media di una gaussiana 1-D a varianza nota da una sola osservazione $x_0$. Perché la varianza deve essere nota?`,
    qEn: 'Explain the example on the slide: ML estimation of the mean of a one-dimensional Gaussian with known variance from a single observation x0. Why must the variance be known?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Il problema.** Un solo parametro incognito, la media $m$; un solo campione, $\mathbf{X} = \{x_0\}$. Con $N = 1$ la likelihood coincide con la pdf valutata nell'osservazione:

$$p(\mathbf{X} \mid \boldsymbol{\theta}) = p(x_0 \mid m) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[-\frac{(x_0 - m)^2}{2\sigma^2}\right]$$

**La figura «ML search».** Sull'asse sono disegnate cinque campane candidate, tutte con la stessa larghezza e la stessa altezza perché la varianza è nota: cambia solo la posizione, $m \approx -2,\ -1.5,\ 0,\ 1,\ 1.5$. La doppia freccia dice che la ricerca ML consiste nel far scorrere la campana lungo l'asse. Da $x_0$ sale una verticale tratteggiata; i trattini dove ogni campana la incrocia sono i valori di likelihood $p(x_0 \mid m)$ delle candidate, letti sull'asse verticale etichettato «Likelihood». Con $\sigma = 1$ e $x_0 = 1$ valgono circa $0.0044$, $0.0175$, $0.2420$, $0.3989$ e $0.3521$.

**Il risultato.** Vince la campana centrata su $x_0$, perché il picco della gaussiana sta nella media: spostandola a destra o a sinistra la quota sulla verticale scende. Quindi $\hat{m} = x_0$. Lo ritrovo derivando: $\frac{\partial}{\partial m}\ln p(x_0 \mid m) = \frac{x_0 - m}{\sigma^2} = 0$. La stima è non distorta, $E\{x_0\} = m$, ma ha la varianza $\sigma^2$ di una singola misura: per ridurla servono più campioni, e con $N$ campioni la stima diventa la media campionaria, con varianza $\sigma^2/N$.

**La likelihood come funzione di $m$.** Nella gaussiana $x$ e $m$ compaiono solo in $(x_0 - m)^2$, quindi scambiarne i ruoli non cambia la forma: $L(m) = p(x_0 \mid m)$ è una campana larga $\sigma$ centrata in $x_0$. Riportando i cinque trattini sopra le rispettive medie ricostruisco questa campana. È una proprietà della gaussiana a varianza nota, non di un modello qualunque. E la likelihood non è una densità su $m$: le cinque campane colorate sono funzioni di $x$ con area 1, la likelihood è una funzione di $m$ letta sulla verticale.

**Perché la varianza nota.** Se anche $\sigma$ fosse ignota, con un solo campione la likelihood in $m = x_0$ varrebbe $\frac{1}{\sigma\sqrt{2\pi}}$, che cresce senza limite per $\sigma \to 0$: stringo la campana sull'unica osservazione e la likelihood esplode. Il massimo non esiste e la stima degenera. Fissare $\sigma$ lascia un solo grado di libertà, la posizione, e rende il problema ben posto.`,
    checklist: [
      md`likelihood uguale alla pdf in $x_0$ quando $N = 1$`,
      md`lettura della figura: campane traslate, verticale in $x_0$, asse Likelihood`,
      md`risultato $\hat{m} = x_0$, anche con la derivata`,
      md`likelihood in funzione di $m$: campana centrata in $x_0$, non una densità su $m$`,
      md`perché la varianza nota: con $\sigma$ libera la likelihood diverge per $\sigma \to 0$`,
    ],
    followUps: [
      {
        q: md`La candidata migliore della figura è la stima ML?`,
        a: md`Solo se una candidata cade esattamente su $x_0$, come la verde. In generale la stima ML è $\hat{m} = x_0$, anche se nessuna delle campane disegnate è centrata lì: le cinque sono solo esempi della ricerca.`,
      },
      {
        q: md`Quanto vale la likelihood massima?`,
        a: md`$p(x_0 \mid \hat{m}) = \frac{1}{\sigma\sqrt{2\pi}}$: con $\sigma = 1$ circa $0.399$.`,
      },
      {
        q: md`Che cosa cambia con $N$ campioni?`,
        a: md`La likelihood in $m$ resta una campana, centrata nella media campionaria e larga $\sigma/\sqrt{N}$: più campioni la stringono, e la stima diventa più precisa.`,
      },
    ],
  },
  {
    id: 'or-varianza-distorta',
    q: md`Ricava la stima ML della varianza di una gaussiana e dimostra che è distorta.`,
    qEn: 'Derive the ML estimate of the variance of a Gaussian and prove that it is biased.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**La stima.** Con media e varianza entrambe ignote la log-likelihood di $N$ campioni iid è

$$\ln p(\mathbf{X} \mid m, \sigma^2) = -\frac{N}{2}\ln(2\pi) - \frac{N}{2}\ln\sigma^2 - \frac{1}{2\sigma^2}\sum_{k=1}^{N} (x_k - m)^2$$

La derivata rispetto a $m$ dà $\hat{m} = \frac{1}{N}\sum_k x_k$. Derivo rispetto a $\sigma^2$, trattandola come variabile:

$$\frac{\partial \ln p}{\partial \sigma^2} = -\frac{N}{2\sigma^2} + \frac{1}{2\sigma^4}\sum_{k=1}^{N} (x_k - m)^2 = 0 \;\Rightarrow\; \hat{\sigma}^2 = \frac{1}{N}\sum_{k=1}^{N} (x_k - \hat{m})^2$$

**Il valore atteso.** Scrivo $x_k - m = (x_k - \hat{m}) + (\hat{m} - m)$, elevo al quadrato e sommo; il termine misto sparisce perché $\sum_k (x_k - \hat{m}) = 0$:

$$\sum_{k=1}^{N} (x_k - \hat{m})^2 = \sum_{k=1}^{N} (x_k - m)^2 - N(\hat{m} - m)^2$$

Prendo il valore atteso: $E\{\sum_k (x_k - m)^2\} = N\sigma^2$ e $E\{N(\hat{m} - m)^2\} = N\,\mathrm{var}\{\hat{m}\} = N\frac{\sigma^2}{N} = \sigma^2$. Quindi

$$E\{\hat{\sigma}^2\} = \frac{1}{N}(N\sigma^2 - \sigma^2) = \frac{N-1}{N}\,\sigma^2$$

La stima è distorta, con bias $-\sigma^2/N$: sottostima sempre. Il fattore tende a 1, quindi è asintoticamente non distorta, come promettono le proprietà di ML. Lo stimatore non distorto divide per $N - 1$. In più dimensioni vale lo stesso: $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$, e le slide danno come stimatore non distorto elementare $\frac{1}{N-1}\sum_k (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$.

**Intuizione.** Misuro gli scarti da $\hat{m}$, che è calcolata sugli stessi campioni e minimizza la somma dei quadrati: i campioni stanno più vicini a $\hat{m}$ che alla media vera, e la dispersione risulta più piccola. Perdo un grado di libertà.

**Esempio.** Luminosità di cinque salmoni $\{4.2, 5.1, 3.8, 4.9, 4.5\}$: $\hat{m} = 4.5$, scarti $-0.3, 0.6, -0.7, 0.4, 0$, somma dei quadrati $1.10$. $\hat{\sigma}^2 = 0.22$, la versione non distorta $0.275$, e il rapporto è $0.8 = (N-1)/N$.`,
    checklist: [
      md`log-likelihood con media e varianza ignote`,
      md`derivata rispetto a $\sigma^2$ e stima con $1/N$`,
      md`identità $\sum_k (x_k - \hat{m})^2 = \sum_k (x_k - m)^2 - N(\hat{m} - m)^2$`,
      md`valore atteso $\frac{N-1}{N}\sigma^2$ usando $\mathrm{var}\{\hat{m}\} = \sigma^2/N$`,
      md`distorta a $N$ finito, asintoticamente non distorta; versione con $1/(N-1)$`,
      md`caso multivariato con $\hat{\Sigma}$ ed esempio numerico`,
    ],
    followUps: [
      {
        q: md`Contraddice le proprietà di ML?`,
        a: md`No: le proprietà della slide sono asintotiche. Con $N$ finito ML può essere distorta; per $N \to \infty$ il bias $-\sigma^2/N$ va a zero.`,
      },
      {
        q: md`Posso derivare rispetto a $\sigma$ invece che a $\sigma^2$?`,
        a: md`Sì, e ottengo $\hat{\sigma} = \sqrt{\hat{\sigma}^2}$: per l'invarianza della stima ML il massimo è lo stesso punto.`,
      },
      {
        q: md`Se conoscessi la media vera $m$?`,
        a: md`Userei $\frac{1}{N}\sum_k (x_k - m)^2$, che è non distorta: il bias nasce proprio dal sostituire $m$ con $\hat{m}$.`,
      },
    ],
  },
  {
    id: 'or-scelta-modello',
    q: md`Come si sceglie il modello statistico di $p(\mathbf{x})$ prima di applicare ML? Elenca i modelli più diffusi con le loro formule.`,
    qEn: 'How is the statistical model of p(x) selected before applying ML? List the most popular models with their formulas.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Perché serve.** La stima ML cerca il massimo solo dentro la famiglia $p(\mathbf{x} \mid \boldsymbol{\theta})$ fissata in partenza: risponde a «quali parametri?», non a «quale famiglia?». La slide premette «in certain hypotheses regarding $p(\mathbf{x} \mid \boldsymbol{\theta})$» solo al teorema sull'efficienza, e quelle ipotesi sono le condizioni di regolarità (log-likelihood derivabile, supporto indipendente da $\boldsymbol{\theta}$, derivata e integrale scambiabili, informazione di Fisher finita e non nulla). In più, ed è un'integrazione e non una citazione, tutte le proprietà di ML presuppongono che i dati vengano davvero da un membro della famiglia scelta (modello corretto, *correctly specified*). Con il modello sbagliato (*misspecified*) ML converge ai parametri migliori di quel modello sbagliato.

**I tre aspetti.** Nella scelta del modello per $p(\mathbf{x})$ considero:
1. la natura statistica intrinseca del fenomeno fisico (*intrinsic statistical nature*): una grandezza che nasce dalla somma di molte cause indipendenti è gaussiana per il limite centrale; l'ampiezza dell'eco di molti diffusori è Rayleigh; una grandezza non negativa non può essere esattamente gaussiana;
2. il rumore introdotto nelle fasi di trasmissione e acquisizione del segnale (passivo o attivo) dal mezzo di propagazione e dal sensore, rispettivamente: modifica la pdf osservata rispetto a quella del fenomeno puro;
3. il pre-processing e l'estrazione delle feature fatti prima del sistema di riconoscimento: il quadrato di una gaussiana standard (media 0, varianza 1) è una chi-quadro con 1 grado di libertà, il logaritmo di una log-normale è una gaussiana. Il modello va scelto per la feature che entra nel classificatore.

Scegliere e applicare bene questi passi migliora l'efficacia del modello; posso anche progettare il pre-processing per avvicinarmi a un modello semplice, per esempio con un logaritmo.

**I sei modelli più diffusi.**
- Gaussiano, per dati normali: $f(x; \mu, \sigma) = \frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}$.
- Gaussiano generalizzato, alternativa flessibile: $f(x; m, b, \beta) = \frac{b\beta}{2\Gamma(1/\beta)}e^{-[b\vert x - m\vert]^{\beta}}$; con $\beta = 2$ è la gaussiana, con $\beta = 1$ la laplaciana, con $\beta \to \infty$ tende all'uniforme.
- Gamma, per dati continui non negativi (teoria delle code): $f(x; k, \theta) = x^{k-1}\frac{e^{-x/\theta}}{\theta^k\Gamma(k)}$ per $x > 0$, con forma $k$ e scala $\theta$.
- Rayleigh, per radar e comunicazioni: $f(x \mid \sigma) = \frac{x\exp\left(\frac{-x^2}{2\sigma^2}\right)}{\sigma^2}$.
- Chi-quadro, per test di ipotesi e bontà di adattamento: $f(x; k) = \frac{(1/2)^{k/2}}{\Gamma(k/2)}x^{k/2-1}e^{-x/2}$, con $k$ gradi di libertà.
- Log-normale, per variabili con asimmetria positiva come i dati finanziari: $f(x; \mu, \sigma) = \frac{e^{-(\ln x - \mu)^2/(2\sigma^2)}}{x\sigma\sqrt{2\pi}}$, con $\mu$ e $\sigma$ media e deviazione standard di $\ln x$.

I primi due sono definiti su tutta la retta, gli altri quattro su $x \geq 0$. Quasi tutti nascono dalla gaussiana con una trasformazione: la chi-quadro con $k$ gradi è una Gamma di forma $k/2$ e scala 2, la Rayleigh è il modulo di due gaussiane indipendenti a media nulla e con la stessa varianza, la log-normale è l'esponenziale di una gaussiana.

**Non è banale.** Con pochi campioni famiglie diverse, come Gamma e log-normale, si adattano quasi ugualmente bene allo stesso istogramma, e un errore di modello si propaga a stime, classificatore e probabilità d'errore. Se nessun modello parametrico è credibile passo alla stima non parametrica: K-NN e finestre di Parzen.`,
    checklist: [
      md`ML ottimizza dentro la famiglia scelta: la scelta del modello viene prima`,
      md`tre aspetti: fenomeno fisico, rumore di mezzo e sensore, pre-processing ed estrazione delle feature`,
      md`sei modelli con formula e campo d'uso`,
      md`supporto (retta o $x \geq 0$) e parentele con la gaussiana`,
      md`la scelta non è banale; alternativa non parametrica`,
    ],
    followUps: [
      {
        q: md`Che modello scegli per l'intensità di un'immagine SAR mediata su $L$ look?`,
        a: md`Una Gamma con forma $k = L$: l'intensità di un singolo look è esponenziale (Gamma con $k = 1$), e la media di $L$ esponenziali indipendenti è una Gamma di forma $L$. Il terzo aspetto, il pre-processing, guida la scelta.`,
      },
      {
        q: md`Come cambia lo stimatore ML della posizione tra gaussiana e laplaciana?`,
        a: md`Con la gaussiana ($\beta = 2$) è la media campionaria, con la laplaciana ($\beta = 1$) la mediana: massimizzare la log-likelihood vuol dire minimizzare $\sum_k \vert x_k - m\vert$ invece di $\sum_k (x_k - m)^2$.`,
      },
      {
        q: md`Nel modello Gamma della galleria, $\theta$ è il vettore dei parametri della stima?`,
        a: md`No, è la notazione della figura per il parametro di scala. Il vettore dei parametri da stimare con ML è $(k, \theta)$.`,
      },
    ],
  },
  {
    id: 'or-limite-centrale',
    q: md`Perché il modello gaussiano è così diffuso? Enuncia il teorema del limite centrale e discutine le ipotesi.`,
    qEn: 'Why is the Gaussian model so widely used? State the central limit theorem and discuss its hypotheses.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Il modello gaussiano.** È un modello parametrico usato in moltissime applicazioni: la pdf è descritta completamente da pochi parametri, media e (co)varianza, proprio quelli che stimo con ML. La sua popolarità viene soprattutto dal teorema del limite centrale (*Central Limit Theorem*, CLT).

**Enunciato.** Se la somma di molte variabili aleatorie indipendenti e identicamente distribuite (iid) ha varianza finita, allora la somma è distribuita approssimativamente come una normale. In forma più precisa: con $n$ addendi di media $\mu$ e varianza $\sigma^2$ finita,

$$S_n = \sum_{i=1}^{n} x_i, \qquad \frac{S_n - n\mu}{\sigma\sqrt{n}} \longrightarrow N(0, 1) \quad (n \to \infty)$$

La tesi vale qualunque sia la distribuzione dei singoli addendi. Media e varianza della somma crescono con $n$, quindi «approssimativamente normale» significa vicina a una gaussiana di media $n\mu$ e varianza $n\sigma^2$.

**Le ipotesi.**
- Molte variabili: con pochi addendi si vede ancora la forma del singolo addendo (la somma di due uniformi è un triangolo).
- iid: con addendi fortemente dipendenti la convergenza è lenta o assente; se sommo $n$ copie della stessa variabile la somma ha la forma dell'addendo.
- Varianza finita: per addendi iid equivale a chiedere che ciascun addendo abbia varianza finita. La Cauchy non ha varianza: la media di $n$ Cauchy è ancora una Cauchy e non converge mai alla gaussiana.

**Perché la gaussiana è ovunque.** Molti fenomeni reali nascono dalla combinazione di tante cause indipendenti, ciascuna con un piccolo effetto e varianza finita: il rumore termico di un sensore, gli errori di misura, il consumo elettrico di un quartiere come somma dei consumi delle case. Per questo la pdf gaussiana si adotta in elaborazione dei segnali, machine learning, economia e ingegneria. È il primo aspetto della scelta del modello, la natura intrinseca del fenomeno, applicato al caso più comune.

**Nel corso.** La gaussiana è il modello di classe dei classificatori bayesiani, il componente delle misture stimate con EM, la prior e la likelihood della stima bayesiana, il kernel più usato nelle finestre di Parzen.`,
    checklist: [
      md`gaussiana come modello parametrico: pochi parametri da stimare`,
      md`enunciato della fonte con le tre ipotesi: molte variabili, iid, varianza finita`,
      md`versione formale con la somma standardizzata`,
      md`che cosa succede quando un'ipotesi manca (pochi addendi, dipendenza, Cauchy)`,
      md`ubiquità: molte cause indipendenti con piccolo effetto; campi d'uso`,
    ],
    followUps: [
      {
        q: md`La somma di 100 consumi esponenziali di media 5 kWh: che distribuzione ha?`,
        a: md`Approssimativamente gaussiana, con media $100 \cdot 5 = 500$ kWh e deviazione standard $5\sqrt{100} = 50$ kWh, perché un'esponenziale ha deviazione standard uguale alla media.`,
      },
      {
        q: md`Il teorema dice che i dati sono gaussiani?`,
        a: md`No: dice che una somma di molte cause iid a varianza finita lo è approssimativamente. Una grandezza positiva e asimmetrica, come un importo o un tempo di attesa, può essere lontanissima dalla gaussiana.`,
      },
      {
        q: md`Che legame c'è con la stima ML?`,
        a: md`Serve anche a spiegare la normalità asintotica della stima ML: la derivata della log-likelihood è una somma di contributi iid, quindi per $N$ grande la stima si distribuisce come una gaussiana centrata nel valore vero con varianza pari al bound di Cramér-Rao.`,
      },
    ],
  },
  {
    id: 'or-forma-gaussiana-2d',
    q: md`Com'è fatta la gaussiana bivariata? Descrivi gli isolivelli, il ruolo di autovettori e autovalori di $\Sigma$ e il caso di feature indipendenti.`,
    qEn: 'What does the bivariate Gaussian look like? Describe the isolevels, the role of the eigenvectors and eigenvalues of Sigma and the case of independent features.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**La superficie.** $p(\mathbf{x}) = p(x_1, x_2)$ è una superficie a campana di volume unitario: $\iint p(x_1, x_2)\,dx_1\,dx_2 = 1$. Il picco è nella media e vale $p(\mathbf{m}) = \frac{1}{2\pi\vert\Sigma\vert^{1/2}}$: se la campana si allarga deve abbassarsi. Se le variabili sono correlate la campana è allungata in diagonale.

**Isolivelli.** Tagliare la campana con un piano orizzontale a quota $z$ vuol dire cercare i punti con $p(\mathbf{x}) = z$, cioè con distanza di Mahalanobis costante:

$$p(\mathbf{x}) = z \iff (\mathbf{x} - \mathbf{m})^t\Sigma^{-1}(\mathbf{x} - \mathbf{m}) = \text{costante}$$

Nel piano è un'ellisse centrata in $\mathbf{m}$: gli isolivelli sono ellissi concentriche, regioni di densità costante, più grandi a quote più basse.

**Autovettori e autovalori.** Scrivo $\Sigma\mathbf{e}_i = \lambda_i\mathbf{e}_i$; poiché $\Sigma$ è simmetrica gli autovettori sono ortogonali. Nel riferimento ruotato $\mathbf{y} = [\mathbf{e}_1\ \mathbf{e}_2]^t(\mathbf{x} - \mathbf{m})$ la forma quadratica diventa

$$\frac{y_1^2}{\lambda_1} + \frac{y_2^2}{\lambda_2} = d^2$$

quindi:
- gli assi delle ellissi sono allineati con gli autovettori di $\Sigma$;
- l'autovettore dell'autovalore più grande definisce l'asse maggiore, la direzione di massima varianza dei dati: $\lambda_1 = \max_{\lVert\mathbf{a}\rVert = 1}\mathbf{a}^t\Sigma\mathbf{a} = \mathrm{var}\{\mathbf{e}_1^t\mathbf{x}\}$;
- le lunghezze dei semiassi sono $d\sqrt{\lambda_1}$ e $d\sqrt{\lambda_2}$, con rapporto $\sqrt{\lambda_1/\lambda_2}$. Con $\lambda_1 = \lambda_2$ le ellissi sono cerchi; se $\lambda_2 \to 0$ degenerano in un segmento e $\Sigma$ diventa singolare.

**Feature indipendenti.** Se le feature sono indipendenti le covarianze sono nulle e $\Sigma = \mathrm{diag}(\sigma_1^2, \sigma_2^2)$. Gli autovettori sono gli assi delle feature: le ellissi non sono inclinate. Il determinante è $\sigma_1^2\sigma_2^2$, la forma quadratica è la somma degli scarti standardizzati al quadrato, e l'esponenziale di una somma diventa un prodotto:

$$p(\mathbf{x}) = p(x_1)\,p(x_2)$$

Stimo $2n$ parametri invece di $n + n(n+1)/2$: è l'ipotesi del naive Bayes gaussiano. Il viceversa, covarianza nulla quindi indipendenza, in generale non vale; vale per un vettore congiuntamente gaussiano, perché allora la pdf si fattorizza. Controesempio: con $x$ gaussiana e $y = x^2$ la covarianza è nulla ma $y$ dipende del tutto da $x$.

**Esempio.** $\Sigma = \begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}$: $\lambda_1 = 3$, $\lambda_2 = 1$, $\mathbf{e}_1 = \frac{1}{\sqrt{2}}(1, 1)^t$. Asse maggiore a 45°, rapporto tra gli assi $\sqrt{3} \approx 1.73$, $\vert\Sigma\vert = 3$, picco $\frac{1}{2\pi\sqrt{3}} \approx 0.092$.`,
    checklist: [
      md`campana di volume 1 con picco $\frac{1}{2\pi\vert\Sigma\vert^{1/2}}$`,
      md`isolivelli: distanza di Mahalanobis costante, ellissi concentriche`,
      md`assi lungo gli autovettori, asse maggiore sull'autovalore massimo`,
      md`semiassi proporzionali a $\sqrt{\lambda_i}$`,
      md`feature indipendenti: $\Sigma$ diagonale, ellissi non inclinate, pdf prodotto delle marginali`,
      md`esempio numerico $2 \times 2$`,
    ],
    followUps: [
      {
        q: md`Che cosa fa una covarianza positiva alle ellissi?`,
        a: md`Le inclina lungo la bisettrice del primo e terzo quadrante: le due feature tendono a crescere insieme. Con covarianza negativa l'inclinazione è opposta.`,
      },
      {
        q: md`Perché $\Sigma$ simmetrica garantisce assi ortogonali?`,
        a: md`Per il teorema spettrale: una matrice reale simmetrica ha autovalori reali e autovettori ortogonali, come i due assi di un'ellisse.`,
      },
      {
        q: md`Che legame c'è con la PCA?`,
        a: md`La PCA proietta sugli autovettori con gli autovalori più grandi: la prima componente principale è l'asse maggiore delle ellissi.`,
      },
    ],
  },
  {
    id: 'or-bernoulli',
    q: md`Applica ML a dati discreti: stima la probabilità che una parola compaia in un'email di spam. Perché qui conviene ancora di più il logaritmo?`,
    qEn: 'Apply ML to discrete data: estimate the probability that a word appears in a spam email. Why is the logarithm even more convenient here?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Il modello.** Per ogni email di spam $x_k = 1$ se la parola compare e $0$ altrimenti: $p(x \mid \theta) = \theta^x(1 - \theta)^{1-x}$, una Bernoulli con parametro $\theta$.

**Likelihood.** Con $N$ email iid e $K$ occorrenze:

$$p(\mathbf{X} \mid \theta) = \prod_{k=1}^{N}\theta^{x_k}(1 - \theta)^{1 - x_k} = \theta^K(1 - \theta)^{N - K}$$

Qui la likelihood è davvero la probabilità di osservare quel dataset sotto il modello, perché i dati sono discreti.

**Log-likelihood e derivata.**

$$\ln p(\mathbf{X} \mid \theta) = K\ln\theta + (N - K)\ln(1 - \theta), \qquad \frac{\partial \ln p}{\partial \theta} = \frac{K}{\theta} - \frac{N - K}{1 - \theta} = 0 \;\Rightarrow\; \hat{\theta} = \frac{K}{N}$$

La derivata seconda, $-\frac{K}{\theta^2} - \frac{N - K}{(1 - \theta)^2}$, è negativa: è un massimo. La stima è la frequenza relativa.

**Numeri.** $N = 40$ email di spam, la parola compare in $K = 12$: $\hat{\theta} = 0.30$. La log-likelihood massima vale $12\ln 0.3 + 28\ln 0.7 \approx -14.45 - 9.99 = -24.43$, la likelihood $e^{-24.43} \approx 2.4 \cdot 10^{-11}$.

**Perché il logaritmo.** Con 40 email la likelihood è già dell'ordine di $10^{-11}$; con qualche migliaio scende sotto il più piccolo numero positivo della doppia precisione (circa $5 \cdot 10^{-324}$; già sotto circa $2 \cdot 10^{-308}$, il minimo normalizzato, perde cifre significative) e in virgola mobile diventa zero: tutti i candidati avrebbero likelihood nulla e non potrei confrontarli. La log-likelihood cresce solo linearmente in $N$ e resta rappresentabile. In più trasforma $\theta^K(1-\theta)^{N-K}$ in una somma che derivo subito.

**Proprietà.** $E\{\hat{\theta}\} = \theta$ e $\mathrm{var}\{\hat{\theta}\} = \theta(1 - \theta)/N$, uguale al bound di Cramér-Rao: la stima è non distorta ed efficiente. Un limite: se la parola non compare mai ($K = 0$) ottengo $\hat{\theta} = 0$, e una sola email futura con quella parola avrebbe probabilità nulla. Con pochi dati conviene aggiungere pseudo-conteggi, $\frac{K + 1}{N + 2}$ (regola di Laplace, *Laplace's rule of succession*). Le note di Passerini (part2 p27) chiamano MAP questa formula, ma con la prior uniforme ($\alpha = 1$ nella Dirichlet di part2 p9) è la media a posteriori: la moda della posterior con prior uniforme, cioè il MAP in senso stretto, coincide con la stima ML $K/N$. $\frac{K + 1}{N + 2}$ è il MAP di una prior Beta(2, 2).`,
    checklist: [
      md`modello di Bernoulli $\theta^x(1 - \theta)^{1-x}$`,
      md`likelihood $\theta^K(1 - \theta)^{N-K}$, qui vera probabilità del dataset`,
      md`log-likelihood, derivata, soluzione $K/N$ e controllo del segno`,
      md`conto numerico con la log-likelihood massima`,
      md`underflow del prodotto e vantaggio del logaritmo`,
      md`non distorta ed efficiente; problema delle probabilità nulle`,
    ],
    followUps: [
      {
        q: md`Dove si usa questa stima in un classificatore?`,
        a: md`Nel naive Bayes per il filtro antispam: stimo $\theta$ per ogni parola e per ogni classe, poi confronto le classi con il prodotto delle probabilità, anche lì passando ai logaritmi.`,
      },
      {
        q: md`La stima di $1/\theta$ per invarianza è non distorta?`,
        a: md`No: l'invarianza riguarda il valore, non il bias. $1/\hat{\theta}$ è la stima ML di $1/\theta$, ma $E\{1/\hat{\theta}\} \neq 1/\theta$; con $K = 0$ non è nemmeno finita.`,
      },
      {
        q: md`Con più valori possibili invece di due?`,
        a: md`Uso una multinomiale: la stima ML di ogni probabilità è ancora la frequenza relativa $N_i/N$, come nelle tabelle delle reti bayesiane.`,
      },
    ],
  },
  {
    id: 'or-massimo-bordo',
    q: md`Basta porre a zero la derivata della log-likelihood? Discuti massimi, minimi, massimi locali, il caso dell'uniforme su $[0, \theta]$ e l'invarianza della stima.`,
    qEn: 'Is it enough to set the derivative of the log-likelihood to zero? Discuss maxima, minima, local maxima, the uniform distribution on [0, theta] and the invariance of the estimate.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Condizione necessaria.** Se la log-likelihood è derivabile e il massimo cade dentro lo spazio dei parametri, la stima soddisfa le equazioni di verosimiglianza:

$$\frac{\partial \ln p(\mathbf{X} \mid \boldsymbol{\theta})}{\partial \theta_i} = 0, \quad i = 1, \ldots, r$$

La condizione non è sufficiente: il punto stazionario può essere un minimo, una sella o un massimo solo locale.

**Verifica.** Con un parametro controllo che la derivata seconda sia negativa, $\left.\frac{\partial^2 \ln p(\mathbf{X} \mid \theta)}{\partial \theta^2}\right\vert_{\theta = \hat{\theta}} < 0$; con $r$ parametri che l'hessiana sia definita negativa. Per la media gaussiana la derivata seconda vale $-N/\sigma^2$ ovunque: parabola rivolta in basso, massimo unico e globale.

**Massimi locali.** Per le misture di gaussiane le equazioni non hanno soluzione in forma chiusa e la likelihood ha più massimi locali: uso metodi iterativi come EM e più inizializzazioni. Risolvere un problema ML può andare dal semplice all'estremamente difficile.

**Massimo sul bordo: l'uniforme.** Per $x \sim U[0, \theta]$, $p(x \mid \theta) = 1/\theta$ su $[0, \theta]$. Con $N$ campioni:

$$p(\mathbf{X} \mid \theta) = \begin{cases} \theta^{-N} & \theta \geq \max_k x_k \\ 0 & \text{altrimenti} \end{cases}$$

La derivata di $-N\ln\theta$ è $-N/\theta$, che non si annulla mai. La likelihood è nulla sotto il campione più grande e decrescente sopra, quindi il massimo è sul bordo: $\hat{\theta} = \max_k x_k$, trovato senza derivate. La stima è distorta, $E\{\hat{\theta}\} = \frac{N}{N+1}\theta$ (il massimo dei campioni sta sempre sotto $\theta$), ma asintoticamente non distorta. Questo modello viola le ipotesi di regolarità del teorema sulle proprietà di ML, perché il supporto dipende da $\theta$. Esempio: ritardi $\{0.8, 2.3, 1.1, 3.4, 0.5\}$ s danno $\hat{\theta} = 3.4$; se il valore vero è 4, $E\{\hat{\theta}\} = \frac{5}{6}\cdot 4 \approx 3.33$.

**Invarianza.** Poiché la stima ML è un $\arg\max$, cambiando parametro con una funzione invertibile $g$ la stima si trasforma allo stesso modo:

$$\widehat{g(\theta)} = g(\hat{\theta})$$

Il massimo è lo stesso punto, etichettato in un altro modo. Per questo posso derivare rispetto a $\sigma^2$ e prendere $\hat{\sigma} = \sqrt{\hat{\sigma}^2}$, e per l'esponenziale la stima del tasso è l'inverso della stima della media. L'invarianza riguarda il valore, non il bias: se $\hat{\theta}$ è non distorta, $g(\hat{\theta})$ in generale non lo è.`,
    checklist: [
      md`equazioni di verosimiglianza come condizione necessaria, non sufficiente`,
      md`controllo con derivata seconda o hessiana; caso gaussiano con $-N/\sigma^2$`,
      md`massimi locali e metodi iterativi (EM) quando non c'è forma chiusa`,
      md`uniforme su $[0, \theta]$: massimo sul bordo $\hat{\theta} = \max_k x_k$, stima distorta $\frac{N}{N+1}\theta$`,
      md`violazione delle ipotesi di regolarità (supporto dipendente da $\theta$)`,
      md`invarianza $\widehat{g(\theta)} = g(\hat{\theta})$ e non invarianza del bias`,
    ],
    followUps: [
      {
        q: md`Come correggi il bias dell'uniforme?`,
        a: md`Uso $\frac{N+1}{N}\max_k x_k$, che ha valore atteso $\theta$. Non è più la stima ML, ma è non distorta.`,
      },
      {
        q: md`Perché con un solo campione gaussiano e $\sigma$ ignota la stima degenera?`,
        a: md`Perché in $m = x_0$ la likelihood vale $\frac{1}{\sigma\sqrt{2\pi}}$ e cresce senza limite per $\sigma \to 0$: il massimo non esiste. È il motivo per cui l'esempio della slide fissa la varianza.`,
      },
      {
        q: md`Un esempio di stima ottenuta per invarianza che è distorta?`,
        a: md`Nell'esponenziale di media $\theta$, $\hat{\theta}$ è la media campionaria, non distorta; il tasso $\hat{\lambda} = 1/\hat{\theta}$ ha $E\{\hat{\lambda}\} = \frac{N}{N-1}\lambda$, distorta con $N$ finito.`,
      },
    ],
  },
]
