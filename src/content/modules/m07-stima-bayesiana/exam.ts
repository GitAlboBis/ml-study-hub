// Domande d'orale del modulo m07 (stima bayesiana e confronto ML contro Bayes): le sette della banca d'esame
// (testo verbatim in bankText) più sei domande sulle parti più chieste. Le risposte sono in prima persona,
// come le direbbe lo studente.
import { md } from '../../types'
import type { ExamQuestion } from '../../types'

export const exam: ExamQuestion[] = [
  // --- banca d'esame ---
  {
    id: 'or-banca-1',
    q: md`Come si descrive la bontà di una stima? La stima a massima verosimiglianza è un buon stimatore? È migliore o no della stima bayesiana, e perché?`,
    qEn: 'How can we describe the goodness of an estimate? Is Maximum Likelihood estimation a good estimator? Is it better or not than Bayesian estimation? Why?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'How we can describe the goodness of an estimation and Is Maximum Likelihood Estimation a good estimator? Is it better or not with respect to the Bayesian Estimation? Why?',
    answer: md`**Bontà di una stima.** La stima $\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\boldsymbol{X})$ dipende dai campioni, quindi è un vettore aleatorio. La giudico con l'errore di stima $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$. La stima ideale ha $E\{\varepsilon_i\} = 0$ e $\mathrm{var}\{\varepsilon_i\} = 0$: nessun errore sistematico e nessuna dispersione. Da qui i due criteri:

- il bias $E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}$: se è nullo la stima è non distorta (*unbiased*);
- la varianza $\mathrm{var}\{\varepsilon_i\}$, che confronto con il bound di Cramér-Rao $\mathrm{var}\{\varepsilon_i\} \ge [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}$: uno stimatore non distorto che lo raggiunge è efficiente (*efficient*).

Con $N$ finito le due proprietà insieme sono rare, quindi guardo il comportamento per $N \to +\infty$: stima asintoticamente non distorta, asintoticamente efficiente e consistente (*consistent*), cioè $\lim_{N\to+\infty} P\{\Vert\boldsymbol{\varepsilon}\Vert < \delta\} = 1$ per ogni $\delta > 0$.

**ML è un buon stimatore?** $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\boldsymbol{X}\,|\,\boldsymbol{\theta})$. A $N$ finito può essere distorta: la covarianza gaussiana stimata dividendo per $N$ ha $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$. Asintoticamente ha tutte e tre le proprietà: asintoticamente non distorta, asintoticamente efficiente e consistente. In più, se esiste uno stimatore efficiente ed ML è non distorta, lo stimatore efficiente è proprio ML. Esempio: per la media gaussiana $\hat{m} = \frac{1}{N}\sum_k x_k$ ha $E\{\hat{m}\} = m$ e $\mathrm{var}\{\hat{m}\} = \sigma^2/N$, esattamente il bound.

**Rispetto alla stima bayesiana.** Le due procedure vedono $\boldsymbol{\theta}$ in modo diverso. In ML è fisso ma ignoto, e ottengo un punto dello spazio dei parametri. Nella stima bayesiana $\boldsymbol{\theta}$ è una variabile aleatoria con densità a priori $p(\boldsymbol{\theta})$; i dati la trasformano nella posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ e stimo una distribuzione:

$$p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$$

Nessuna delle due vince sempre. Con infiniti campioni, oppure con prior uniforme, danno la stessa soluzione. In pratica si preferisce spesso ML per due motivi: minore complessità computazionale (Bayes integra sull'intero spazio dei parametri, ML cerca un massimo, spesso in forma chiusa) e interpretabilità più facile (un solo valore). La stima bayesiana conviene quando i dati sono pochi e ho una conoscenza a priori affidabile, e quando devo quantificare l'incertezza con un intervallo di credibilità.

Nel caso gaussiano lo vedo con i numeri. $\mu_N = w\bar{X} + (1-w)\mu_0$ con $w = \frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}$ ha bias $(1-w)(\mu_0 - \mu_{\text{vera}})$ e varianza $w^2\sigma^2/N$, più piccola di quella di ML: Bayes accetta un po' di bias in cambio di meno varianza. Il suo errore quadratico medio batte $\sigma^2/N$ se e solo se $(\mu_0 - \mu_{\text{vera}})^2 < 2\sigma_0^2 + \sigma^2/N$: il prior deve essere centrato bene rispetto all'incertezza che dichiara. I passaggi sono nella dimostrazione [«errore quadratico medio della media a posteriori»](#derivation:der12).`,
    checklist: [
      md`la stima è aleatoria: errore $\boldsymbol{\varepsilon}$, stima ideale con bias e varianza nulli`,
      md`bias, varianza e bound di Cramér-Rao: definizione di stima efficiente`,
      'proprietà asintotiche: non distorsione, efficienza, consistenza',
      md`ML distorta a $N$ finito (covarianza con $\frac{N-1}{N}$) ma ottima asintoticamente`,
      md`ML: $\boldsymbol{\theta}$ fisso, stima un punto; Bayes: $\boldsymbol{\theta}$ aleatorio, stima una distribuzione`,
      'coincidono con infiniti campioni o con prior uniforme',
      'ML preferita per costo e interpretabilità; Bayes per conoscenza a priori, pochi dati e incertezza',
    ],
    followUps: [
      {
        q: md`Un prior sbagliato può rendere Bayes peggiore di ML?`,
        a: md`Sì. Con $\Delta = \mu_0 - \mu_{\text{vera}}$ l'errore quadratico medio di $\mu_N$ è $w^2\sigma^2/N + (1-w)^2\Delta^2$ e supera $\sigma^2/N$ quando $\Delta^2 > 2\sigma_0^2 + \sigma^2/N$: succede con un prior lontano dal vero e troppo sicuro. Il danno sparisce per $N \to \infty$, perché $w \to 1$, purché $\sigma_0^2 > 0$.`,
      },
      {
        q: md`Perché la stima ML della covarianza è distorta e quella della media no?`,
        a: md`Nella covarianza gli scarti sono presi da $\hat{\mathbf{m}}$, che è costruita sugli stessi campioni: gli scarti risultano in media più piccoli di quelli dalla media vera. Il risultato è $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$; lo correggo dividendo per $N-1$ invece che per $N$.`,
      },
      {
        q: md`Che cosa significa che una stima è consistente?`,
        a: md`$\lim_{N\to+\infty} P\{\Vert\hat{\boldsymbol{\theta}} - \boldsymbol{\theta}\Vert < \delta\} = 1$ per ogni $\delta > 0$: con abbastanza campioni la stima cade vicino al valore vero con probabilità che tende a 1. Una condizione sufficiente è che bias e varianza tendano entrambi a zero.`,
      },
    ],
  },
  {
    id: 'or-banca-2',
    q: md`In quale caso la stima ML e la stima bayesiana coincidono?`,
    qEn: 'In which case do ML and Bayesian estimation give the same result?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Last question was: In which case ML and Bayesian are the same?',
    answer: md`La slide del confronto dà due casi: nel limite di infiniti campioni di training, oppure con prior $p(\boldsymbol{\theta})$ uniforme.

**Infiniti campioni.** Lo vedo sull'esempio gaussiano con varianza nota:

$$\mu_N = \left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X} + \left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0,\qquad \sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}$$

Per $N \to \infty$ il peso del prior tende a 0, quindi $\mu_N \to \bar{X}$, che è la stima ML della media; intanto $\sigma_N^2 \to 0$ e la posterior diventa una delta di Dirac. Anche la densità predittiva converge: $N(\mu_N, \sigma^2 + \sigma_N^2) \to N(\bar{X}, \sigma^2)$, cioè il modello con la stima ML inserita. In generale entrambi i metodi sono consistenti e convergono al valore vero. Serve però un prior che non escluda il valore vero: con $\sigma_0^2 = 0$ (prior dogmatico) ho $\mu_N = \mu_0$ per ogni $N$ e i dati non contano mai.

**Prior uniforme.** Se $p(\boldsymbol{\theta}) = c$ la costante si semplifica nella formula di Bayes:

$$p(\boldsymbol{\theta}\,|\,\boldsymbol{X}) = \frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,c}{\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,c\,\mathrm{d}\boldsymbol{\theta}} \propto p(\boldsymbol{X}\,|\,\boldsymbol{\theta})$$

Il prior non influenza la posterior: nessuna conoscenza a priori. Il massimo della posterior coincide con il massimo della verosimiglianza, cioè con $\hat{\boldsymbol{\theta}}_{ML}$. Nel caso gaussiano il prior uniforme è il limite $\sigma_0^2 \to \infty$: $\mu_N \to \bar{X}$ per ogni $N \ge 1$. Resta però $\sigma_N^2 \to \sigma^2/N$: la stima del parametro coincide con ML, mentre la predittiva $N(\bar{X}, \sigma^2 + \sigma^2/N)$ è più larga del modello ML finché $N$ è piccolo. A rigore un prior uniforme su tutta la retta non si normalizza: lo intendo come limite di prior sempre più larghi, oppure uniforme su un intervallo che contiene la stima ML.

Con la riscrittura $n_0 = \sigma^2/\sigma_0^2$ i due casi si leggono insieme: il peso dei dati è $\frac{N}{N+n_0}$ e tende a 1 sia per $N \to \infty$ sia per $n_0 \to 0$.`,
    checklist: [
      'i due casi della slide: infiniti campioni di training e prior uniforme',
      md`$N \to \infty$: $\mu_N \to \bar{X}$, $\sigma_N^2 \to 0$, posterior a delta, predittiva $\to N(\bar{X}, \sigma^2)$`,
      'prior uniforme: la costante si semplifica, massimo della posterior = massimo della verosimiglianza',
      md`ipotesi: il prior non esclude il valore vero ($\sigma_0^2 > 0$)`,
      md`con prior uniforme la predittiva conserva la varianza extra $\sigma^2/N$`,
    ],
    followUps: [
      {
        q: md`Perché il limite $N \to \infty$ richiede $\sigma_0^2 > 0$?`,
        a: md`Con $\sigma_0^2 = 0$ il prior è una delta su $\mu_0$: il peso dei dati $\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}$ vale 0 per ogni $N$ e $\mu_N = \mu_0$ per sempre. I due limiti non si scambiano.`,
      },
      {
        q: md`E se il prior è uniforme su un intervallo $[a, b]$ che non contiene $\bar{X}$?`,
        a: md`La posterior è la verosimiglianza troncata a $[a, b]$, una gaussiana troncata. Il suo massimo cade sull'estremo più vicino a $\bar{X}$, quindi non coincide con la stima ML: l'equivalenza richiede che il prior sia costante attorno a $\hat{\boldsymbol{\theta}}_{ML}$.`,
      },
      {
        q: md`Dove ritrovi questa equivalenza nella parte di Passerini?`,
        a: md`Nell'apprendimento dei parametri delle reti bayesiane: la stima MAP con prior di Dirichlet $\theta_{x|u} = \frac{N_{u,x} + \alpha_{x|u}}{\sum_x (N_{u,x} + \alpha_{x|u})}$ torna alla stima ML dei conteggi quando gli pseudo-conteggi $\alpha_{x|u}$ sono trascurabili rispetto ai conteggi osservati.`,
      },
    ],
  },
  {
    id: 'or-banca-3',
    q: md`Qual è la formula della massima verosimiglianza? Perché possiamo scrivere la verosimiglianza come prodotto delle probabilità dei singoli campioni, e che cosa descrive la verosimiglianza?`,
    qEn: 'What is the Maximum Likelihood formula, why can we use the product of the probabilities of the single samples, and what does the likelihood describe?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'What is the formula of Maximum Likelihood, why we can use the separate products of the probabilities and what the Likelihood describe.',
    answer: md`Ho un modello parametrico $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ di forma nota e $N$ campioni $\boldsymbol{X} = \{\mathbf{x}_1, \ldots, \mathbf{x}_N\}$. In ML $\boldsymbol{\theta}$ è fisso ma ignoto, e scelgo il valore che rende più probabili i dati osservati:

$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}}\, p(\boldsymbol{X}\,|\,\boldsymbol{\theta})$$

**Perché il prodotto.** I campioni sono estratti in modo indipendente dalla stessa densità (i.i.d.). La densità congiunta di variabili indipendenti è il prodotto delle densità dei singoli campioni:

$$p(\boldsymbol{X}\,|\,\boldsymbol{\theta}) = p(\mathbf{x}_1, \ldots, \mathbf{x}_N\,|\,\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\,|\,\boldsymbol{\theta})$$

Senza indipendenza, per esempio con pixel adiacenti di un'immagine o misure consecutive di un sensore, il prodotto non vale e servirebbe la densità congiunta completa. Per i calcoli passo al logaritmo: è monotono crescente, quindi non sposta il massimo, e trasforma il prodotto in una somma:

$$l(\boldsymbol{\theta}) = \ln p(\boldsymbol{X}\,|\,\boldsymbol{\theta}) = \sum_{k=1}^{N}\ln p(\mathbf{x}_k\,|\,\boldsymbol{\theta}),\qquad \nabla_{\boldsymbol{\theta}} \ln p(\boldsymbol{X}\,|\,\boldsymbol{\theta}) = \sum_{k=1}^{N}\nabla_{\boldsymbol{\theta}}\ln p(\mathbf{x}_k\,|\,\boldsymbol{\theta}) = \mathbf{0}$$

**Che cosa descrive.** La stessa espressione, letta con i dati fissi e $\boldsymbol{\theta}$ che varia, misura quanto ogni valore del parametro è compatibile con i dati osservati: ogni $\boldsymbol{\theta}$ dà una pdf diversa, e la verosimiglianza è la quota che quella pdf assegna ai campioni. Non è una densità in $\boldsymbol{\theta}$: in generale $\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta} \ne 1$. Esempio della slide: un solo campione $x_0$ e gaussiana a varianza nota. Faccio scorrere la campana lungo l'asse e leggo la sua quota in $x_0$: la più alta si ha con la campana centrata su $x_0$, quindi $\hat{m} = x_0$. Con $N$ campioni ottengo la media campionaria.

La stessa produttoria serve nella stima bayesiana: con la terza ipotesi (campioni estratti indipendentemente) la posterior diventa $p(\boldsymbol{\theta}\,|\,\boldsymbol{X}) = \alpha\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})$: verosimiglianza per prior, poi normalizzata.`,
    checklist: [
      md`definizione $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\boldsymbol{X}\,|\,\boldsymbol{\theta})$ con $\boldsymbol{\theta}$ fisso ma ignoto`,
      'indipendenza dei campioni (i.i.d.) che giustifica la produttoria',
      'logaritmo: stesso massimo, prodotto in somma, gradiente nullo',
      md`la verosimiglianza misura la compatibilità di $\boldsymbol{\theta}$ con i dati e non è una densità in $\boldsymbol{\theta}$`,
      md`esempio con un campione: $\hat{m} = x_0$; collegamento con la posterior bayesiana`,
    ],
    followUps: [
      {
        q: md`Perché il logaritmo non cambia la soluzione?`,
        a: md`$\ln$ è strettamente crescente: se $p(\boldsymbol{X}\,|\,\boldsymbol{\theta}_1) > p(\boldsymbol{X}\,|\,\boldsymbol{\theta}_2)$ l'ordine resta tra i logaritmi, quindi l'arg max è lo stesso. In più la somma evita l'underflow del prodotto di $N$ numeri piccoli.`,
      },
      {
        q: md`Che cosa succede se uso il prodotto con campioni correlati?`,
        a: md`Conto più volte la stessa informazione: la verosimiglianza risulta troppo stretta e la stima sembra più sicura di quanto sia. Nella stima bayesiana la posterior si stringe troppo in fretta.`,
      },
      {
        q: md`La verosimiglianza integra a 1?`,
        a: md`Integra a 1 nei dati, non nel parametro. Per ottenere una densità su $\boldsymbol{\theta}$ la stima bayesiana moltiplica per il prior e divide per $p(\boldsymbol{X}) = \int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}$.`,
      },
    ],
  },
  {
    id: 'or-banca-4',
    q: md`Esempio di stima dei parametri di una gaussiana: perché anche la posterior è gaussiana?`,
    qEn: 'Example of estimation of Gaussian parameters: why do we obtain a Gaussian also as posterior?',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Example of estimation of Gaussian parameters: why do we obtain a Gaussian also as posterior?',
    answer: md`Prendo il caso univariato delle slide: $p(x\,|\,\mu) \sim N(\mu, \sigma^2)$ con $\sigma^2$ nota e solo $\mu$ ignota, prior $p(\mu) \sim N(\mu_0, \sigma_0^2)$ con $\mu_0$ e $\sigma_0^2$ noti. Con la formula di Bayes e l'indipendenza dei campioni:

$$p(\mu\,|\,\boldsymbol{X}) = \alpha\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\mu)\,p(\mu)$$

dove $\alpha$ è il fattore di normalizzazione. Sostituisco le gaussiane: il prodotto di esponenziali è l'esponenziale della somma degli esponenti, cioè di una somma di parabole in $\mu$, una per campione più una per il prior:

$$p(\mu\,|\,\boldsymbol{X}) = \alpha'\exp\left[-\frac{1}{2}\left(\sum_{k=1}^{N}\left(\frac{\mathbf{x}_k-\mu}{\sigma}\right)^2 + \left(\frac{\mu-\mu_0}{\sigma_0}\right)^2\right)\right]$$

Sviluppo i quadrati e porto nella costante tutto ciò che non dipende da $\mu$: i termini con $\sum_k \mathbf{x}_k^2$ e con $\mu_0^2$.

$$p(\mu\,|\,\boldsymbol{X}) = \alpha''\exp\left\{-\frac{1}{2}\left[\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)\mu^2 - 2\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k + \frac{\mu_0}{\sigma_0^2}\right)\mu\right]\right\}$$

L'esponente è un polinomio di secondo grado in $\mu$, con coefficiente di $\mu^2$ negativo, $-\frac{1}{2}\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)$. Una densità il cui logaritmo è una parabola rivolta verso il basso è una gaussiana, quindi $p(\mu\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma_N^2)$. Confronto con l'esponente canonico $-\frac{1}{2}\left(\frac{\mu^2}{\sigma_N^2} - \frac{2\mu_N}{\sigma_N^2}\mu\right)$:

$$\frac{1}{\sigma_N^2} = \frac{N}{\sigma^2}+\frac{1}{\sigma_0^2},\qquad \frac{\mu_N}{\sigma_N^2} = \frac{N}{\sigma^2}\bar{X} + \frac{\mu_0}{\sigma_0^2}$$

e ottengo le due equazioni della slide:

$$\mu_N = \left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X} + \left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0,\qquad \sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}$$

Le precisioni si sommano e la media a posteriori è la media di $\bar{X}$ e $\mu_0$ pesata con le precisioni. Esempio: $\sigma = 2$, $\mu_0 = 10$, $\sigma_0 = 3$ e campioni $12.1, 13.4, 11.2, 13.3$ danno $\bar{X} = 12.5$, $N\sigma_0^2 + \sigma^2 = 40$, $\mu_N = 0.9 \cdot 12.5 + 0.1 \cdot 10 = 12.25$ e $\sigma_N^2 = 36/40 = 0.9$.

In termini generali il prior gaussiano è coniugato (*conjugate*) alla verosimiglianza gaussiana con varianza nota: la posterior resta nella famiglia del prior e cambiano solo i parametri. Il risultato dipende dalle ipotesi: con un prior uniforme su un intervallo otterrei una gaussiana troncata; con anche $\sigma^2$ ignota la posterior congiunta di $(\mu, \sigma^2)$ non sarebbe gaussiana.`,
    checklist: [
      md`ipotesi: $\sigma^2$ nota, prior gaussiano su $\mu$, campioni indipendenti`,
      md`posterior $= \alpha \prod_k p(\mathbf{x}_k\,|\,\mu)\,p(\mu)$`,
      md`somma di parabole: esponente quadratico in $\mu$ con coefficiente di $\mu^2$ negativo`,
      md`identificazione di $1/\sigma_N^2$ e $\mu_N/\sigma_N^2$, formule di $\mu_N$ e $\sigma_N^2$`,
      'prior coniugato e controesempio con un prior non gaussiano',
    ],
    followUps: [
      {
        q: md`Perché serve che il coefficiente di $\mu^2$ sia negativo?`,
        a: md`Perché l'esponenziale sia integrabile e quindi normalizzabile. Qui vale $-\frac{1}{2}\left(\frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}\right)$, negativo per qualunque $N$: le precisioni sono positive.`,
      },
      {
        q: md`Da che cosa dipende $\alpha''$?`,
        a: md`Non dipende da $\mu$, quindi per la posterior è una costante che garantisce area 1. Dipende però dai campioni: assorbe i fattori $1/(\sqrt{2\pi}\sigma)$, i termini con $\sum_k \mathbf{x}_k^2$ e quelli con $\mu_0^2$.`,
      },
      {
        q: md`Anche la densità predittiva è gaussiana?`,
        a: md`Sì: $p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}\,|\,\mu)\,p(\mu\,|\,\boldsymbol{X})\,\mathrm{d}\mu \sim N(\mu_N, \sigma^2 + \sigma_N^2)$. Il motivo: $\mu$ è un parametro di posizione, $x = \mu + \varepsilon$ con $\varepsilon \sim N(0, \sigma^2)$ indipendente, e la somma di due gaussiane indipendenti è gaussiana.`,
      },
    ],
  },
  {
    id: 'or-banca-5',
    q: md`Reti bayesiane: formalizzazione (DAG, indipendenze locali, i vari casi del criterio di d-separazione, criterio generale e indipendenze globali) e apprendimento dei parametri (ML con dati completi, MAP con conoscenza a priori, EM con dati incompleti).`,
    qEn: 'Bayesian networks: formalization (DAG, local independencies, the cases of the d-separation criterion, the general d-separation criterion and global independencies) and parameter learning (ML with complete data, MAP with prior knowledge, EM with incomplete data).',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Bayesian networks: formalization (DAG, local independencies, various case of d-separation criterion, general d-separation criterion and global independencies) and learning of the parameters (ML with complete data, MAP with prior knowledge, EM with incomplete data)',
    answer: md`**Formalizzazione.** Una rete bayesiana è una coppia $(G, p)$. $G$ è un grafo orientato aciclico (*directed acyclic graph*, DAG) con un nodo per ogni variabile aleatoria; $p$ è una distribuzione congiunta che si fattorizza secondo $G$:

$$p(x_1, \ldots, x_m) = \prod_{i=1}^{m}p(x_i\,|\,Pa_{x_i})$$

Ogni nodo porta la distribuzione condizionata ai genitori (*conditional probability distribution*, CPD); con variabili discrete è una tabella (CPT) con una colonna per configurazione dei genitori. Il grafo codifica le indipendenze locali: ogni variabile è indipendente dai non discendenti, dati i genitori.

$$I_\ell(G) = \{\forall i:\ x_i \perp NonDescendants_{x_i}\,|\,Parents_{x_i}\}$$

$G$ è una I-map per $p$ se $p$ soddisfa queste indipendenze, e questo equivale alla fattorizzazione: lo mostro ordinando le variabili in ordine topologico, applicando la regola della catena e togliendo da ogni condizionata i non genitori.

**d-separazione: i tre casi con tre nodi.**

- Coda-coda (*tail-to-tail*), $a \leftarrow c \rightarrow b$: $p(a,b,c) = p(a\,|\,c)\,p(b\,|\,c)\,p(c)$. $a$ e $b$ sono dipendenti, ma indipendenti dato $c$: la causa comune osservata spiega entrambe.
- Testa-coda (*head-to-tail*), catena $a \rightarrow c \rightarrow b$: dipendenti; indipendenti dato $c$, che fa da mediatore.
- Testa-testa (*head-to-head*, collider), $a \rightarrow c \leftarrow b$: $p(a,b,c) = p(c\,|\,a,b)\,p(a)\,p(b)$, quindi $p(a,b) = p(a)\,p(b)$ e sono indipendenti. Osservando $c$ o un suo discendente diventano dipendenti (*explaining away*).

**Criterio generale.** Dati tre insiemi disgiunti $A$, $B$, $C$, $A$ e $B$ sono d-separati da $C$ se ogni cammino tra un nodo di $A$ e un nodo di $B$ è bloccato. Un cammino è bloccato se contiene un nodo in cui le frecce si incontrano coda-coda o testa-coda e il nodo è in $C$, oppure un nodo testa-testa che non è in $C$ e non ha discendenti in $C$. Le indipendenze globali sono $I(G) = \{(A \perp B\,|\,C) : dsep(A; B\,|\,C)\}$. Strutture diverse possono codificare le stesse indipendenze (I-equivalenza): coda-coda e testa-coda sì, testa-testa no.

**ML con dati completi.** Con il grafo dato e $N$ esempi i.i.d. la verosimiglianza si fattorizza per esempio e per nodo:

$$p(D\,|\,\boldsymbol{\theta}) = \prod_{i=1}^{N}\prod_{j=1}^{m}p(x_j(i)\,|\,pa_j(i), \boldsymbol{\theta}_{X_j|pa_j})$$

Ogni CPD ha i suoi parametri e la stimo separatamente; ogni colonna è una multinomiale. Annullando il gradiente della log-verosimiglianza con il vincolo $\sum_x \theta_{x|u} = 1$ ottengo la frequenza relativa:

$$\theta_{x|u}^{max} = \frac{N_{u,x}}{\sum_x N_{u,x}}$$

Difetti: sovradattamento e probabilità zero per le configurazioni mai osservate.

**MAP con conoscenza a priori.** $\boldsymbol{\theta}^{max} = \arg\max_{\boldsymbol{\theta}} p(D\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})$ con un prior di Dirichlet, coniugato della multinomiale:

$$\theta_{x|u}^{max} = \frac{N_{u,x} + \alpha_{x|u}}{\sum_x\left(N_{u,x} + \alpha_{x|u}\right)}$$

Gli $\alpha_{x|u}$ sono pseudo-conteggi, osservazioni immaginarie: con $\alpha$ piccoli ritrovo ML, con $\alpha$ grandi pesa il prior, e nessuna probabilità vale zero. È la stessa logica della stima bayesiana della media gaussiana, dove il prior pesa come $n_0 = \sigma^2/\sigma_0^2$ campioni virtuali.

**EM con dati incompleti.** Se mancano dei valori non posso contare. Parto da parametri iniziali e alterno due passi. Passo E: calcolo i conteggi attesi con l'inferenza sulla rete corrente,

$$E[N_{ijk}] = \sum_{l=1}^{n}p(X_i(l) = x_k, Pa_i(l) = pa_j\,|\,\boldsymbol{X}_l, \boldsymbol{\theta})$$

Passo M: rinormalizzo i conteggi attesi, $\theta_{ijk}^* = \frac{E[N_{ijk}]}{\sum_{k=1}^{r_i}E[N_{ijk}]}$, aggiungendo $\alpha_{ijk}$ se voglio la versione MAP. Itero fino a convergenza: arrivo a un ottimo locale della verosimiglianza (o della posterior).`,
    checklist: [
      md`definizione $(G, p)$, DAG e fattorizzazione $\prod_i p(x_i\,|\,Pa_{x_i})$`,
      'indipendenze locali e I-map',
      'i tre casi: coda-coda, testa-coda, testa-testa con explaining away',
      md`criterio generale del cammino bloccato e indipendenze globali $I(G)$`,
      'ML con dati completi: conteggi normalizzati per colonna, e i suoi difetti',
      'MAP con prior di Dirichlet: pseudo-conteggi',
      'EM: conteggi attesi nel passo E, rinormalizzazione nel passo M, ottimo locale',
    ],
    followUps: [
      {
        q: md`Perché con dati completi la stima ML si separa nodo per nodo?`,
        a: md`Ogni CPD ha un sottoinsieme disgiunto di parametri e la log-verosimiglianza è una somma di termini, uno per nodo e per configurazione dei genitori: massimizzo ogni termine per conto suo.`,
      },
      {
        q: md`Che legame c'è con il confronto ML contro Bayes di Melgani?`,
        a: md`La stima MAP incorpora conoscenza a priori come la stima bayesiana e, con pseudo-conteggi trascurabili, torna alla stima ML, come con il prior uniforme della slide del confronto. Resta però una stima puntuale: la stima bayesiana completa conserverebbe tutta la posterior di Dirichlet.`,
      },
      {
        q: md`Fammi un esempio di explaining away.`,
        a: md`Allarme che suona per un furto o per un terremoto: furto e terremoto sono indipendenti, ma se so che l'allarme suona e poi scopro che c'è stato un terremoto, la probabilità del furto scende. Osservare il collider ha reso dipendenti le due cause.`,
      },
    ],
  },
  {
    id: 'or-banca-6',
    q: md`Spiega la stima ML, sviluppa la derivata prima per una gaussiana e spiega il significato del risultato.`,
    qEn: 'Explain ML estimation, develop the first derivative for a Gaussian and explain the meaning of the result.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Explain ML estimation, develop the first derivative for a gaussian and explain the meaning of the result.',
    answer: md`**Stima ML.** Il vettore dei parametri $\boldsymbol{\theta}$ è fisso ma ignoto; scelgo il valore che massimizza la verosimiglianza dei campioni i.i.d., o il suo logaritmo, che ha lo stesso massimo:

$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \ln p(\boldsymbol{X}\,|\,\boldsymbol{\theta}) = \arg\max_{\boldsymbol{\theta}} \sum_{k=1}^{N}\ln p(\mathbf{x}_k\,|\,\boldsymbol{\theta})$$

Cerco il massimo annullando il gradiente: $\sum_{k=1}^{N}\nabla_{\boldsymbol{\theta}}\ln p(\mathbf{x}_k\,|\,\boldsymbol{\theta}) = \mathbf{0}$.

**Derivata per la media gaussiana (1-D, $\sigma$ nota).**

$$\ln p(\boldsymbol{X}\,|\,m) = \sum_{k=1}^{N}\left[-\ln\left(\sqrt{2\pi}\,\sigma\right) - \frac{(x_k - m)^2}{2\sigma^2}\right]$$

$$\frac{\partial \ln p(\boldsymbol{X}\,|\,m)}{\partial m} = \sum_{k=1}^{N}\frac{x_k - m}{\sigma^2} = 0 \;\Rightarrow\; \sum_{k=1}^{N}(x_k - \hat{m}) = 0 \;\Rightarrow\; \hat{m} = \frac{1}{N}\sum_{k=1}^{N}x_k$$

La derivata seconda vale $-N/\sigma^2 < 0$: è un massimo. Con $N = 1$ ritrovo l'esempio della slide, $\hat{m} = x_0$. In più dimensioni $\nabla_{\mathbf{m}}\ln p = \sum_k \Sigma^{-1}(\mathbf{x}_k - \mathbf{m}) = \mathbf{0}$ dà $\hat{\mathbf{m}} = \frac{1}{N}\sum_k \mathbf{x}_k$, e per la covarianza

$$\hat{\Sigma} = \frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^t - \hat{\mathbf{m}}\hat{\mathbf{m}}^t$$

**Significato del risultato.**

- $\sum_k (x_k - \hat{m}) = 0$: la stima è il baricentro dei campioni, dove scarti positivi e negativi si compensano. Ogni campione tira la media verso di sé con forza $(x_k - m)/\sigma^2$.
- $\sigma$ si semplifica: la stima della media non dipende dalla varianza.
- Massimizzare la log-verosimiglianza gaussiana equivale a minimizzare $\sum_k (x_k - m)^2$: con rumore gaussiano ML coincide con i minimi quadrati.
- Qualità: $E\{\hat{m}\} = m$ e $\mathrm{var}\{\hat{m}\} = \sigma^2/N$, pari al bound di Cramér-Rao: stima non distorta, efficiente e consistente. La covarianza invece è distorta, $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$, e lo stimatore non distorto elementare divide per $N - 1$.
- $\hat{m}$ è la media campionaria $\bar{X}$ che compare nella media a posteriori bayesiana $\mu_N$: con infiniti campioni o con prior uniforme le due stime coincidono.`,
    checklist: [
      'definizione di ML e passaggio alla log-verosimiglianza',
      md`derivata della log-verosimiglianza gaussiana rispetto a $m$, posta uguale a zero`,
      md`risultato $\hat{m} = \frac{1}{N}\sum_k x_k$ e verifica del massimo`,
      'significato: baricentro, indipendenza da σ, minimi quadrati',
      md`proprietà: non distorta ed efficiente; covarianza distorta di $\frac{N-1}{N}$`,
      'versione multivariata di media e covarianza',
    ],
    followUps: [
      {
        q: md`Quanto vale la stima ML della varianza in 1-D?`,
        a: md`$\hat{\sigma}^2 = \frac{1}{N}\sum_k (x_k - \hat{m})^2$, distorta: $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2$. La correggo con il fattore $\frac{N}{N-1}$.`,
      },
      {
        q: md`Perché le due forme di $\hat{\Sigma}$ coincidono?`,
        a: md`Sviluppo il prodotto: $\frac{1}{N}\sum_k(\mathbf{x}_k\mathbf{x}_k^t - \mathbf{x}_k\hat{\mathbf{m}}^t - \hat{\mathbf{m}}\mathbf{x}_k^t + \hat{\mathbf{m}}\hat{\mathbf{m}}^t)$. Con $\frac{1}{N}\sum_k \mathbf{x}_k = \hat{\mathbf{m}}$ gli ultimi tre termini valgono $-\hat{\mathbf{m}}\hat{\mathbf{m}}^t - \hat{\mathbf{m}}\hat{\mathbf{m}}^t + \hat{\mathbf{m}}\hat{\mathbf{m}}^t = -\hat{\mathbf{m}}\hat{\mathbf{m}}^t$.`,
      },
      {
        q: md`Perché l'esempio della slide chiede la varianza nota?`,
        a: md`Con un solo campione e $\sigma$ ignota la verosimiglianza in $m = x_0$ vale $\frac{1}{\sigma\sqrt{2\pi}}$ e cresce senza limite per $\sigma \to 0$: il massimo non esiste e la stima sarebbe degenere.`,
      },
    ],
  },
  {
    id: 'or-banca-7',
    q: md`Spiega la stima non parametrica: che cosa significa non parametrico e perché la usiamo. Spiega sia il K-NN sia le finestre di Parzen. Tendono alla soluzione ottima?`,
    qEn: 'Explain non-parametric estimation, what non-parametric means and why we use it, explain both K-NN and Parzen windows. Do they tend to the optimal solution?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Explain non-parametric estimation, what non-parametric means and why we use it, explain both KNN and Parzen windows, do they tend to the optimal solution?',
    answer: md`**Perché.** ML e stima bayesiana sono parametriche: assumono nota la forma $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ e stimano solo $\boldsymbol{\theta}$. La stima bayesiana, per esempio, si applica solo se la densità ignota si può parametrizzare. Quando manca conoscenza a priori sulla forma della distribuzione, o quando nessun modello parametrico (gaussiano, di Poisson…) approssima bene i dati, per esempio con una densità multimodale, uso la stima non parametrica. Non parametrico vuol dire che non fisso una forma funzionale né un vettore di parametri: la stima si costruisce direttamente dai campioni, con meno assunzioni.

**Idea comune.** Prendo una regione $R$ di volume $V$ attorno a $\mathbf{x}^*$. Se $R$ è piccola, $P_R = \int_R p(\mathbf{x})\,d\mathbf{x} \simeq p(\mathbf{x}^*)\,V$; stimo $P_R$ con la frequenza relativa $K/N$, che per la legge dei grandi numeri converge a $P_R$:

$$\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$$

Ho due scelte: fissare $V$ e contare $K$ (Parzen) oppure fissare $K$ e misurare $V$ (K-NN).

**Finestre di Parzen.** $R$ è un ipercubo di lato $h$, $V = h^n$; la funzione finestra $\gamma(\mathbf{u})$ vale 1 se $\vert u_j \vert \le 1/2$ per ogni $j$, quindi $K = \sum_k \gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right)$. Con un kernel generale $\gamma \ge 0$ di area 1:

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\,\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)$$

Il kernel più usato è il gaussiano. $h$ grande sovra-liscia (*oversmoothing*), $h$ piccolo insegue il rumore.

**K-NN.** Fisso $K$ e allargo una sfera attorno a $\mathbf{x}^*$ finché contiene $K$ campioni: $\hat{p}(\mathbf{x}^*) = \frac{K}{N\,V_K(\mathbf{x}^*)}$. Il volume si adatta: piccolo dove i dati sono fitti, grande dove sono radi. A $N$ finito la stima non integra a 1 (code che vanno come $1/\vert x \vert$) e ha discontinuità della derivata.

**Tendono alla soluzione ottima?** Sì, asintoticamente e sotto condizioni sulla successione dei volumi o di $K$: nei punti di continuità convergono alla pdf vera.

- Parzen: $\lim_{N\to+\infty} h_N = 0$ toglie il bias, $\lim_{N\to+\infty} N h_N^n = +\infty$ toglie la varianza. Esempio: $V = 1/\sqrt{N}$.
- K-NN: $\lim_{N\to+\infty} K_N = +\infty$ e $\lim_{N\to+\infty} K_N/N = 0$. Esempio: $K = \sqrt{N}$.

A $N$ finito però il risultato dipende dalla scelta di $h$ o di $K$, e la stima può restare rumorosa anche con qualche centinaio di campioni.`,
    checklist: [
      'significato di non parametrico e quando si usa (forma ignota, modelli che non approssimano)',
      md`stima di base $K/(NV)$ dalla probabilità della regione`,
      'Parzen: volume fisso, funzione finestra, formula con il kernel, effetto di h',
      'K-NN: K fisso, volume adattivo, formula',
      md`condizioni di convergenza: $h_N \to 0$, $N h_N^n \to \infty$; $K_N \to \infty$, $K_N/N \to 0$`,
      'limiti a campione finito',
    ],
    followUps: [
      {
        q: md`Perché non posso scegliere $V$ piccolo a piacere con $N$ fissato?`,
        a: md`Con $V$ troppo piccolo cadono pochi campioni nella regione e $K/N$ diventa molto variabile (varianza circa $p/(NV)$). Con $V$ grande la stima è una media di $p$ su $R$ e la sfoca (bias). Il compromesso si sposta con $N$: più campioni permettono regioni più piccole.`,
      },
      {
        q: md`Che differenza pratica c'è tra K-NN e Parzen?`,
        a: md`Parzen usa la stessa finestra ovunque: rischia di sovra-lisciare dove i dati sono fitti e di essere rumoroso dove sono radi. Il K-NN adatta il volume alla densità locale, ma la stima che produce non è una pdf normalizzata.`,
      },
      {
        q: md`Come si collega alla stima bayesiana?`,
        a: md`La stima bayesiana richiede una densità parametrizzabile: la prima ipotesi è che la forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ sia nota. Quando questa ipotesi cade si passa alla stima non parametrica, che nelle note inizia subito dopo il confronto tra ML e Bayes.`,
      },
    ],
  },

  // --- domande sulle parti più chieste ---
  {
    id: 'or-formula-chiave',
    q: md`Stima bayesiana: su quali ipotesi si basa, qual è l'obiettivo e come si ricava la formula $p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$? Come la interpreti?`,
    qEn: 'Bayesian estimation: which assumptions is it based on, what is the goal, and how do you derive p(x|X) = ∫ p(x|θ) p(θ|X) dθ? How do you interpret it?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Idea.** Nella stima bayesiana (*Bayesian estimation*, detta anche *Bayesian learning*) il vettore dei parametri $\boldsymbol{\theta}$ non è un numero fisso ma una variabile aleatoria. Parto da una densità a priori sul parametro e i dati di training la convertono in una densità a posteriori (*posterior probability density*). Apprendere vuol dire aggiornare una distribuzione.

**Le tre ipotesi.** Si applica a qualunque situazione in cui la densità ignota si possa parametrizzare.

1. La forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota; il valore di $\boldsymbol{\theta}$ non è noto esattamente.
2. La conoscenza iniziale su $\boldsymbol{\theta}$ è contenuta in una densità a priori nota $p(\boldsymbol{\theta})$.
3. Il resto della conoscenza è in $N$ campioni $\boldsymbol{X} = \{\mathbf{x}_1, \ldots, \mathbf{x}_N\}$ estratti indipendentemente dalla densità ignota $p(\mathbf{x})$.

La terza ipotesi si traduce nella posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$, che spero abbia un picco stretto sul valore vero.

**Obiettivo.** Non mi interessa $\boldsymbol{\theta}$ in sé: voglio $p(\mathbf{x}\,|\,\boldsymbol{X})$, il più vicina possibile a $p(\mathbf{x})$. La ricavo in tre passi:

$$p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}, \boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta} = \int p(\mathbf{x}\,|\,\boldsymbol{\theta}, \boldsymbol{X})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta} = \int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$$

1. Marginalizzo sul parametro: introduco $\boldsymbol{\theta}$ nella congiunta e lo integro via, sull'intero spazio dei parametri.
2. Fattorizzo la congiunta con la regola del prodotto (teorema di Bayes), tutto condizionato a $\boldsymbol{X}$.
3. Noto $\boldsymbol{\theta}$, la distribuzione di $\mathbf{x}$ è completamente nota: i campioni non aggiungono informazione, quindi $p(\mathbf{x}\,|\,\boldsymbol{\theta}, \boldsymbol{X}) = p(\mathbf{x}\,|\,\boldsymbol{\theta})$.

**Interpretazione.** Un integrale è la forma continua di una somma: la formula fa la media di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ su tutti i valori possibili di $\boldsymbol{\theta}$, pesata dalla posterior. Invece di scegliere un solo modello come ML, li mescolo tutti, ciascuno con la sua credibilità. I campioni entrano solo attraverso la posterior; il problema base diventa calcolare $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$, e lo faccio con Bayes più indipendenza:

$$p(\boldsymbol{\theta}\,|\,\boldsymbol{X}) = \frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}},\qquad p(\boldsymbol{X}\,|\,\boldsymbol{\theta}) = \prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})$$

Esempio: per la luminosità dei salmoni con modello $N(\mu, \sigma^2)$, $p(\mathbf{x}\,|\,\boldsymbol{X})$ è una media di tante campane, una per ogni valore plausibile di $\mu$. Siccome la media pesata di densità è ancora una densità, $p(\mathbf{x}\,|\,\boldsymbol{X})$ integra a 1 per qualunque modello.`,
    checklist: [
      md`$\boldsymbol{\theta}$ variabile aleatoria: dal prior alla posterior con i dati`,
      'le tre ipotesi: forma nota, prior noto, campioni indipendenti',
      md`obiettivo $p(\mathbf{x}\,|\,\boldsymbol{X})$ vicino a $p(\mathbf{x})$`,
      'i tre passaggi: marginalizzazione, regola del prodotto, eliminazione di X',
      'interpretazione come media pesata dei modelli',
      md`problema base: calcolare $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ con Bayes e la produttoria`,
    ],
    followUps: [
      {
        q: md`Perché nel terzo passo posso togliere $\boldsymbol{X}$?`,
        a: md`Per la prima ipotesi la forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota: fissato $\boldsymbol{\theta}$ la distribuzione di $\mathbf{x}$ è completamente determinata e i campioni di training non dicono altro. È un'indipendenza condizionata tra la nuova osservazione e $\boldsymbol{X}$, dato $\boldsymbol{\theta}$.`,
      },
      {
        q: md`Perché la stima bayesiana costa di più?`,
        a: md`L'integrale si estende all'intero spazio dei parametri, e se $\boldsymbol{\theta}$ è un vettore è un integrale multiplo. In più serve la normalizzazione $\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}$. ML invece cerca solo un massimo.`,
      },
      {
        q: md`Che cosa succede se la posterior ha un picco molto stretto in $\hat{\boldsymbol{\theta}}$?`,
        a: md`L'integrale pesa quasi solo $\hat{\boldsymbol{\theta}}$ e $p(\mathbf{x}\,|\,\boldsymbol{X}) \simeq p(\mathbf{x}\,|\,\hat{\boldsymbol{\theta}})$: la stima bayesiana si comporta come una stima puntuale, ed è ciò che accade per $N \to \infty$.`,
      },
    ],
  },
  {
    id: 'or-caso-gaussiano',
    q: md`Caso gaussiano univariato con media ignota: calcola media e varianza a posteriori, commenta come si combinano prior e dati e discuti i casi limite.`,
    qEn: 'Univariate Gaussian case with unknown mean: compute the posterior mean and variance, comment on how prior and data are combined and discuss the limiting cases.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Impostazione.** $\boldsymbol{\theta} = [\mu, \sigma^2]$ ma solo $\mu$ è ignota: $p(x\,|\,\mu) \sim N(\mu, \sigma^2)$. Il prior sulla media è $p(\mu) \sim N(\mu_0, \sigma_0^2)$ con parametri noti a priori: $\mu_0$ è il valore che ritengo più plausibile, $\sigma_0^2$ quanto ne sono incerto. La posterior è $p(\mu\,|\,\boldsymbol{X}) = \alpha\prod_k p(\mathbf{x}_k\,|\,\mu)\,p(\mu)$; sostituendo le gaussiane l'esponente è quadratico in $\mu$, quindi $p(\mu\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma_N^2)$ con

$$\mu_N = \left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X}+\left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0,\qquad \sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}$$

dove $\bar{X} = \frac{1}{N}\sum_k \mathbf{x}_k$ è la media campionaria.

**Come si combinano.** Le equazioni mostrano come l'informazione a priori si combina con l'informazione empirica dei campioni. I due pesi sono positivi e sommano a 1, quindi $\mu_N$ sta sempre tra $\bar{X}$ e $\mu_0$. Il peso dei dati cresce con $N$ e con $\sigma_0^2$ (prior vago); il peso del prior cresce con $\sigma^2$ (dati rumorosi). In forma di precisioni $\frac{1}{\sigma_N^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}$: $\sigma_N^2$ non dipende dai valori dei campioni e cala con $N$. Dividendo per $\sigma_0^2$ con $n_0 = \sigma^2/\sigma_0^2$:

$$\mu_N = \frac{N\bar{X} + n_0\mu_0}{N + n_0},\qquad \sigma_N^2 = \frac{\sigma^2}{N + n_0}$$

Il prior vale come $n_0$ campioni virtuali tutti uguali a $\mu_0$.

**Casi limite.**

- $N = 0$: $\mu_N = \mu_0$ e $\sigma_N^2 = \sigma_0^2$, la posterior è il prior, l'unica informazione che ho.
- $N \to \infty$: $\mu_N \to \bar{X}$ e $\sigma_N^2 \to 0$; la posterior diventa una delta di Dirac e l'influenza del prior sparisce. È il Bayesian learning.
- $\sigma_0^2 \to \infty$ (prior vago, uniforme): $\mu_N \to \bar{X}$ per ogni $N \ge 1$, ma $\sigma_N^2 \to \sigma^2/N$.
- $\sigma_0^2 \to 0$ (prior dogmatico): $\mu_N \to \mu_0$ e $\sigma_N^2 \to 0$ per ogni $N$: i dati non contano mai. Per questo il limite $N \to \infty$ richiede $\sigma_0^2 > 0$.

**Esempio.** Sensore di una cella frigorifera: $\sigma^2 = 0.25$, prior $N(4, 1)$, $N = 9$ letture con $\bar{X} = 4.6$. $N\sigma_0^2 + \sigma^2 = 9.25$, $\mu_N = \frac{9}{9.25}\cdot 4.6 + \frac{0.25}{9.25}\cdot 4 \approx 4.584$, $\sigma_N^2 = 0.25/9.25 \approx 0.027$: intervallo di credibilità al 95% per $\mu$ circa $[4.26, 4.91]$.`,
    checklist: [
      md`ipotesi: $\sigma^2$ nota, prior $N(\mu_0, \sigma_0^2)$ con parametri noti`,
      md`formule di $\mu_N$ e $\sigma_N^2$ con la media campionaria $\bar{X}$`,
      md`pesi che sommano a 1: $\mu_N$ tra $\bar{X}$ e $\mu_0$; precisioni che si sommano`,
      md`casi $N = 0$ e $N \to \infty$ con la delta di Dirac`,
      md`casi limite in $\sigma_0^2$ e necessità di $\sigma_0^2 > 0$`,
      md`lettura con i campioni virtuali $n_0 = \sigma^2/\sigma_0^2$`,
    ],
    followUps: [
      {
        q: md`Con quanti campioni i dati pesano quanto il prior?`,
        a: md`Quando $N\sigma_0^2 = \sigma^2$, cioè $N = n_0 = \sigma^2/\sigma_0^2$: allora $\mu_N$ sta esattamente a metà tra $\mu_0$ e $\bar{X}$.`,
      },
      {
        q: md`Perché $\sigma_N^2$ non dipende dai valori osservati?`,
        a: md`Il coefficiente di $\mu^2$ nell'esponente è $\frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}$: contiene solo $N$ e le due varianze. I valori dei campioni spostano il centro della posterior, non la sua larghezza. Vale perché $\sigma^2$ è nota.`,
      },
      {
        q: md`Posso aggiornare la posterior un campione alla volta?`,
        a: md`Sì: uso la posterior dopo $N$ campioni come prior per il campione successivo. Con $N = 1$ nelle formule ottengo $\mu_{N+1} = \frac{\sigma_N^2 x_{N+1} + \sigma^2\mu_N}{\sigma_N^2 + \sigma^2}$ e $\sigma_{N+1}^2 = \frac{\sigma_N^2\sigma^2}{\sigma_N^2+\sigma^2}$, lo stesso risultato dell'aggiornamento in blocco.`,
      },
    ],
  },
  {
    id: 'or-predittiva',
    q: md`Nel caso gaussiano, come si ottiene la densità $p(\mathbf{x}\,|\,\boldsymbol{X})$ e perché la sua varianza è $\sigma^2 + \sigma_N^2$?`,
    qEn: 'In the Gaussian case, how do you obtain the density p(x|X) and why is its variance σ² + σN²?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Ottenuta la posterior $p(\mu\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma_N^2)$, resta da calcolare la densità desiderata con la formula chiave, con $\boldsymbol{\theta} = \mu$:

$$p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}\,|\,\mu)\,p(\mu\,|\,\boldsymbol{X})\,\mathrm{d}\mu = \int \frac{1}{\sqrt{2\pi}\sigma}\exp\left[-\frac{1}{2}\left(\frac{\mathbf{x}-\mu}{\sigma}\right)^2\right]\frac{1}{\sqrt{2\pi}\sigma_N}\exp\left[-\frac{1}{2}\left(\frac{\mu-\mu_N}{\sigma_N}\right)^2\right]\mathrm{d}\mu$$

Come funzione di $\mu$ l'integranda è il prodotto di due campane. Unisco gli esponenti e completo il quadrato in $\mu$: la parte che dipende da $\mathbf{x}$ esce dall'integrale, e resta un integrale gaussiano in $\mu$ che non dipende da $\mathbf{x}$:

$$p(\mathbf{x}\,|\,\boldsymbol{X}) = \frac{1}{2\pi\,\sigma\sigma_N}\exp\left[-\frac{1}{2}\frac{(\mathbf{x}-\mu_N)^2}{\sigma^2+\sigma_N^2}\right]f(\sigma, \sigma_N)$$

Il fattore vale $f(\sigma, \sigma_N) = \sqrt{2\pi}\,\frac{\sigma\sigma_N}{\sqrt{\sigma^2+\sigma_N^2}}$, e insieme a $\frac{1}{2\pi\sigma\sigma_N}$ dà la normalizzazione $\frac{1}{\sqrt{2\pi(\sigma^2+\sigma_N^2)}}$. Quindi

$$p(\mathbf{x}\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma^2 + \sigma_N^2)$$

Confrontandola con il modello $N(\mu, \sigma^2)$ il ruolo della media ignota lo prende $\mu_N$: è il senso di «and thus $\mu = \mu_N$».

**Perché $\sigma^2 + \sigma_N^2$.** Una nuova osservazione è $x = \mu + \varepsilon$: $\varepsilon \sim N(0, \sigma^2)$ è il rumore intrinseco dei dati, che resterebbe anche conoscendo $\mu$; $\mu$ stessa è incerta, con varianza $\sigma_N^2$ sotto la posterior. Le due parti sono indipendenti e le varianze si sommano. La legge della varianza totale lo conferma per qualunque modello: $\mathrm{var}\{x\,|\,\boldsymbol{X}\} = E\{\mathrm{var}\{x\,|\,\mu\}\} + \mathrm{var}\{E\{x\,|\,\mu\}\} = \sigma^2 + \sigma_N^2$.

**Conseguenza.** Con pochi campioni la predittiva è più larga del modello ottenuto inserendo una stima puntuale, $N(\hat{\mu}, \sigma^2)$: è più prudente sulle code. Per $N \to \infty$ si ha $\sigma_N^2 \to 0$ e le due coincidono. Esempio: con $\sigma^2 = 0.25$ e $\sigma_N^2 = 0.027$ la predittiva ha varianza $0.277$; la probabilità che una nuova lettura superi una soglia alta è un po' maggiore che con il modello plug-in.`,
    checklist: [
      md`formula chiave con $\boldsymbol{\theta} = \mu$ e sostituzione delle due gaussiane`,
      md`completamento del quadrato: la parte in $\mathbf{x}$ esce, resta $f(\sigma, \sigma_N)$ che non dipende da $\mathbf{x}$`,
      md`risultato $N(\mu_N, \sigma^2 + \sigma_N^2)$ e lettura $\mu = \mu_N$`,
      md`varianza intrinseca $\sigma^2$ più incertezza sul parametro $\sigma_N^2$`,
      'confronto con il modello plug-in e limite per N grande',
    ],
    followUps: [
      {
        q: md`Quanto vale $f(\sigma, \sigma_N)$ e perché la slide non lo scrive?`,
        a: md`$f(\sigma, \sigma_N) = \sqrt{2\pi}\,\frac{\sigma\sigma_N}{\sqrt{\sigma^2+\sigma_N^2}}$. La slide lo lascia indicato perché non dipende da $\mathbf{x}$: cambia solo la costante, non la forma gaussiana in $\mathbf{x}$.`,
      },
      {
        q: md`La predittiva sarebbe gaussiana anche se il parametro incerto fosse la varianza?`,
        a: md`No. Il risultato gaussiano viene dal fatto che $\mu$ è un parametro di posizione con varianza fissa: l'integrale è la convoluzione di due gaussiane. Mescolando gaussiane con varianze diverse ottengo una densità con code più pesanti, non una gaussiana.`,
      },
      {
        q: md`Con prior uniforme la predittiva coincide con il modello ML?`,
        a: md`Non per $N$ finito: $\mu_N = \bar{X}$ come in ML, ma $\sigma_N^2 = \sigma^2/N$, quindi la predittiva è $N(\bar{X}, \sigma^2(1 + 1/N))$, più larga di $N(\bar{X}, \sigma^2)$.`,
      },
    ],
  },
  {
    id: 'or-bayesian-learning',
    q: md`Che cosa si intende per Bayesian learning? Descrivi la figura della posterior $p(\mu\,|\,\mathbf{x}_1, \ldots, \mathbf{x}_N)$ al crescere di $N$.`,
    qEn: 'What is meant by Bayesian learning? Describe the plot of the posterior p(μ|x1,...,xN) as N increases.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Il termine ha due usi. Nella slide iniziale è sinonimo di stima bayesiana. Nella slide della figura indica un comportamento: al crescere di $N$ la posterior diventa sempre più piccata e per $N \to \infty$ tende a una delta di Dirac. Man mano che osservo dati la posterior diventa più sicura del valore vero di $\mu$.

**La figura.** In ascissa $\mu$, in ordinata $p(\mu\,|\,\mathbf{x}_1, \ldots, \mathbf{x}_N)$, cinque curve per $N = 1, 5, 10, 20, 30$. Con $N = 1$ è una campana larga e bassa, spostata a sinistra, verso $\mu \approx -1.2$. Con $N$ crescente le campane si alzano e si stringono attorno a 0. I centri non sono allineati: $\mu_N$ segue la media campionaria, che fluttua da un $N$ all'altro.

**Con le formule.** La campana ha picco $\frac{1}{\sqrt{2\pi}\,\sigma_N}$ e larghezza $\sigma_N$, con

$$\frac{1}{\sigma_N^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}$$

Quindi l'altezza cresce circa come $\sqrt{N}$ e la larghezza cala come $1/\sqrt{N}$. Misurando i picchi della figura (circa 0.44, 0.91, 1.28, 1.80, 2.20) ottengo $1/\sigma_N^2 \approx N + 0.25$: la figura è compatibile con $\sigma^2 = 1$ e $\sigma_0^2 = 4$. Il peso del prior nella media, $\frac{\sigma^2}{N\sigma_0^2+\sigma^2}$, cala come $1/N$: due analisti con prior diversi che vedono gli stessi dati finiscono con posterior quasi uguali.

**Limite.** $\sigma_N^2 \to 0$ e $p(\mu\,|\,\boldsymbol{X}) \to \delta(\mu - \bar{X})$: tutta la massa su un valore, come una stima puntuale. Formalmente la posterior si concentra sulla media vera, verso cui converge $\bar{X}$. Serve $\sigma_0^2 > 0$: con un prior dogmatico la posterior è una delta su $\mu_0$ fin dall'inizio.`,
    checklist: [
      'doppio uso del termine: sinonimo di stima bayesiana e fenomeno di restringimento',
      'descrizione della figura: curve per N = 1, 5, 10, 20, 30 sempre più alte e strette',
      'centri che seguono la media campionaria',
      md`altezza $\frac{1}{\sqrt{2\pi}\sigma_N}$ e precisioni $\frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}$`,
      md`limite: delta di Dirac, $\sigma_N^2 \to 0$, influenza del prior che sparisce`,
    ],
    followUps: [
      {
        q: md`Dai picchi della figura come ricavi $\sigma^2$ e $\sigma_0^2$?`,
        a: md`Da ogni picco $h$ ottengo $1/\sigma_N^2 = 2\pi h^2$. La pendenza rispetto a $N$ è $1/\sigma^2$, l'intercetta è $1/\sigma_0^2$. Con $N = 1$ e $N = 30$: $\sigma^2 \approx 29/(2\pi h_{30}^2 - 2\pi h_1^2)$. Il valore di $\sigma_0^2$ è molto sensibile agli errori di lettura.`,
      },
      {
        q: md`Perché la curva con $N = 1$ non è centrata in $\mu_0$?`,
        a: md`Con un campione la media a posteriori è già tirata verso il dato: con $\sigma^2 = 1$ e $\sigma_0^2 = 4$ il dato pesa $\frac{4}{5} = 0.8$ e il prior solo $0.2$.`,
      },
      {
        q: md`Che cosa succede alla densità predittiva mentre la posterior si stringe?`,
        a: md`La sua varianza $\sigma^2 + \sigma_N^2$ scende verso $\sigma^2$: resta il rumore intrinseco dei dati, mentre l'incertezza sul parametro sparisce.`,
      },
    ],
  },
  {
    id: 'or-ml-o-bayes',
    q: md`Quando conviene la stima bayesiana e quando conviene ML? Argomenta con un'applicazione.`,
    qEn: 'When is Bayesian estimation preferable and when is ML preferable? Argue with an application.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Parto dalla differenza: ML stima un punto nello spazio dei parametri, Bayes stima una distribuzione $p(\mathbf{x}\,|\,\boldsymbol{X})$ da cui inferisco $\boldsymbol{\theta}$ (nel caso gaussiano $\mu = \mu_N$). Le due soluzioni coincidono con infiniti campioni o con prior uniforme, quindi la scelta conta con pochi dati e con un prior informativo.

**A favore di ML** (slide del confronto):

- minore complessità computazionale: un massimo, spesso in forma chiusa, invece di integrali su tutto lo spazio dei parametri;
- interpretabilità più facile: un solo valore dei parametri, comodo per una predizione diretta.

**A favore di Bayes** (note):

- incorpora conoscenza a priori o il parere di un esperto, utile quando i dati sono scarsi;
- quantifica l'incertezza: ho tutta la posterior e posso dare un intervallo di credibilità, per esempio $\mu_N \pm 1.96\,\sigma_N$ al 95%.

**Due applicazioni.**

- Parametro clinico, come un intervallo dell'ECG, su 5 pazienti con una malattia rara e un valore di riferimento dalla letteratura: scelgo Bayes. I dati sono pochi, il prior esiste e al medico serve un intervallo, non solo un numero.
- Statistiche di classe (vettore medio e covarianza) su milioni di pixel iperspettrali con centinaia di bande: scelgo ML. Con tanti campioni le due stime coincidono, e integrare su centinaia di medie e migliaia di covarianze costerebbe troppo.

**Il prezzo del prior.** Nel caso gaussiano la media a posteriori ha errore quadratico medio $w^2\sigma^2/N + (1-w)^2\Delta^2$, con $w = \frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}$ e $\Delta = \mu_0 - \mu_{\text{vera}}$. Batte ML ($\sigma^2/N$) se e solo se $\Delta^2 < 2\sigma_0^2 + \sigma^2/N$. Esempio: $\sigma = 30$, $\sigma_0 = 20$, $N = 5$, $\Delta = -10$ danno $w \approx 0.69$, errore di Bayes circa $95$ contro $180$ di ML; la soglia è $\vert\Delta\vert < 31.3$. Un prior sbagliato e troppo sicuro fa peggio di ML.`,
    checklist: [
      'ML punto, Bayes distribuzione; coincidono con N infinito o prior uniforme',
      'ML: complessità computazionale e interpretabilità',
      'Bayes: conoscenza a priori con pochi dati e quantificazione dell\'incertezza',
      'intervallo di credibilità come esempio concreto',
      'esempio applicativo motivato per ciascun metodo',
      md`rischio di un prior sbagliato: soglia $\Delta^2 < 2\sigma_0^2 + \sigma^2/N$`,
    ],
    followUps: [
      {
        q: md`Che differenza c'è tra un intervallo di credibilità e un intervallo di confidenza?`,
        a: md`L'intervallo di credibilità è una affermazione di probabilità sul parametro, che nella stima bayesiana è una variabile aleatoria: $P\{\mu \in [\mu_N - 1.96\sigma_N, \mu_N + 1.96\sigma_N]\,|\,\boldsymbol{X}\} = 0.95$. In ML il parametro è fisso e non ha una distribuzione su cui fare questa affermazione.`,
      },
      {
        q: md`Perché con pochi dati Bayes riduce la varianza della stima?`,
        a: md`$\mu_N = w\bar{X} + (1-w)\mu_0$ con $w < 1$: la parte aleatoria $\bar{X}$ è moltiplicata per $w$, quindi la varianza è $w^2\sigma^2/N$ invece di $\sigma^2/N$. In cambio compare un bias verso $\mu_0$.`,
      },
      {
        q: md`Esiste una via di mezzo tra ML e la stima bayesiana completa?`,
        a: md`La stima a massimo a posteriori (MAP): prendo il massimo di $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$. Usa il prior ma dà un punto, e costa quanto ML. Nel caso gaussiano coincide con $\mu_N$, perché la posterior è simmetrica.`,
      },
    ],
  },
  {
    id: 'or-covarianza-ml',
    q: md`Stime ML del vettore medio e della matrice di covarianza gaussiana: formule, proprietà, bias e stimatore non distorto.`,
    qEn: 'ML estimates of the mean vector and of the Gaussian covariance matrix: formulas, properties, bias and unbiased estimator.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Con $N$ campioni i.i.d. di una gaussiana multivariata le stime ML sono

$$\hat{\mathbf{m}} = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k,\qquad \hat{\Sigma} = \frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^t - \hat{\mathbf{m}}\hat{\mathbf{m}}^t$$

La media è la media campionaria dei vettori; la covarianza è la media dei prodotti esterni degli scarti. La seconda forma viene sviluppando il prodotto e usando la definizione di $\hat{\mathbf{m}}$.

**Proprietà.** Le note danno le stime come asintoticamente non distorte, efficienti (varianza minima tra gli stimatori non distorti) e consistenti: per $N \to +\infty$, $\hat{\mathbf{m}} \to \mathbf{m}$ e $\hat{\Sigma} \to \Sigma$. Preciso l'efficienza: vale in senso stretto per $\hat{\mathbf{m}}$, che è non distorta; per $\hat{\Sigma}$ con $\frac{1}{N}$, distorta a $N$ finito, vale solo in senso asintotico, perché uno stimatore distorto non è tra quelli a cui si applica la definizione.

**Valori attesi.**

$$E\{\hat{\mathbf{m}}\} = \mathbf{m},\qquad E\{\hat{\Sigma}\} = \frac{N-1}{N}\,\Sigma$$

La media è non distorta; la covarianza a $N$ finito sottostima $\Sigma$ del fattore $\frac{N-1}{N}$, che tende a 1. Il motivo: gli scarti sono presi da $\hat{\mathbf{m}}$, calcolata sugli stessi campioni, quindi sono in media più piccoli di quelli da $\mathbf{m}$. Per campioni piccoli uso lo stimatore non distorto elementare:

$$\hat{\Sigma} = \frac{N}{N-1}\cdot\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t = \frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t$$

**Esempio.** Quattro salmoni con (luminosità, larghezza) $(2, 1)$, $(4, 3)$, $(3, 2)$, $(5, 2)$. $\hat{\mathbf{m}} = (3.5, 2)$; con $\frac{1}{N}$ ottengo $\hat{\Sigma} = \begin{bmatrix} 1.25 & 0.5 \\ 0.5 & 0.5 \end{bmatrix}$, e con la seconda forma $13.5 - 3.5^2 = 1.25$, $4.5 - 4 = 0.5$, $7.5 - 7 = 0.5$. Con $\frac{1}{N-1}$: $\begin{bmatrix} 1.667 & 0.667 \\ 0.667 & 0.667 \end{bmatrix}$.

Nel confronto con Bayes, $\hat{\mathbf{m}}$ è la $\bar{X}$ verso cui converge la media a posteriori $\mu_N$.`,
    checklist: [
      md`formule di $\hat{\mathbf{m}}$ e di $\hat{\Sigma}$ nelle due forme`,
      'proprietà: asintoticamente non distorte, efficienti, consistenti',
      md`l'efficienza vale in senso stretto per $\hat{\mathbf{m}}$; per $\hat{\Sigma}$ con $\frac{1}{N}$ solo in senso asintotico`,
      md`$E\{\hat{\mathbf{m}}\} = \mathbf{m}$ e $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$ con la spiegazione del bias`,
      md`stimatore non distorto con $\frac{1}{N-1}$`,
      'esempio numerico su pochi campioni',
    ],
    followUps: [
      {
        q: md`Da dove viene esattamente il fattore $\frac{N-1}{N}$?`,
        a: md`Scrivo $\sum_k(\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t = \sum_k(\mathbf{x}_k - \mathbf{m})(\mathbf{x}_k - \mathbf{m})^t - N(\hat{\mathbf{m}} - \mathbf{m})(\hat{\mathbf{m}} - \mathbf{m})^t$. Il valore atteso del primo termine è $N\Sigma$, quello del secondo è $N\cdot\Sigma/N = \Sigma$ perché la covarianza di $\hat{\mathbf{m}}$ è $\Sigma/N$. Resta $(N-1)\Sigma$, diviso per $N$.`,
      },
      {
        q: md`Con $N = 1$ che cosa succede?`,
        a: md`La stima ML della covarianza è la matrice nulla, perché l'unico campione coincide con la media stimata. Lo stimatore corretto divide per $N - 1 = 0$ e non è definito: servono almeno due campioni.`,
      },
      {
        q: md`Perché la stima con $\frac{1}{N}$ resta comunque accettabile per $N$ grande?`,
        a: md`Il fattore $\frac{N-1}{N}$ tende a 1: con molti campioni il bias è trascurabile. Per questo la stima è asintoticamente non distorta.`,
      },
    ],
  },
]
