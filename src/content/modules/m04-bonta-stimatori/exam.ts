// Domande d'orale del modulo m04 (bontà di uno stimatore, bound di Cramér-Rao, proprietà asintotiche):
// le sette domande della banca d'esame (testo verbatim in bankText) più otto domande sulle parti più chieste.
// Le risposte sono in prima persona, come le direbbe lo studente, e toccano tutti i punti della checklist.
import { md } from '../../types'
import type { ExamQuestion } from '../../types'

export const exam: ExamQuestion[] = [
  // --- banca d'esame ---------------------------------------------------------------------------------
  {
    id: 'or-banca-1',
    q: md`Qual è la formula della massima verosimiglianza, perché possiamo usare il prodotto delle singole probabilità e che cosa descrive la likelihood? Come si descrive la bontà di una stima, e la stima ML è un buon stimatore? È migliore o no della stima bayesiana, e perché? Applica la stima ML a un esercizio. In quale caso ML e stima bayesiana coincidono?`,
    qEn: 'What is the formula of Maximum Likelihood, why can we use the product of the individual probabilities and what does the likelihood describe? How can we describe the goodness of an estimate, and is Maximum Likelihood a good estimator? Is it better or not than Bayesian Estimation, and why? Apply Maximum Likelihood estimation to an exercise. In which case do ML and Bayesian estimation coincide?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'What is the formula of Maximum Likelihood, why we can use the separate products of the probabilities and what the Likelihood describe. How we can describe the goodness of an estimation and Is Maximum Likelihood Estimation a good estimator? Is it better or not with respect to the Bayesian Estimation? Why? Then he asked me to apply Maximum Likelihood estimation on an exercise. Last question was: In which case ML and Bayesian are the same?',
    answer: md`**Likelihood e formula ML.** Assumo un modello parametrico $p(\mathbf{x}|\boldsymbol{\theta})$, con vettore dei parametri $\boldsymbol{\theta} = (\theta_1, \theta_2, \ldots, \theta_r)$, e un training set $\mathbf{X} = \{\mathbf{x}_1, \mathbf{x}_2, \ldots, \mathbf{x}_N\}$ di campioni iid (*independent and identically distributed*). La funzione di verosimiglianza (*likelihood function*) è

$$p(\mathbf{X}|\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k|\boldsymbol{\theta})$$

e la stima a massima verosimiglianza (*maximum likelihood*, ML) è

$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X}|\boldsymbol{\theta}) = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X}|\boldsymbol{\theta})$$

Il logaritmo è monotono crescente, quindi il punto di massimo non cambia; in più trasforma il prodotto in una somma, $\ln p(\mathbf{X}|\boldsymbol{\theta}) = \sum_{k=1}^{N}\ln p(\mathbf{x}_k|\boldsymbol{\theta})$, facile da derivare.

**Perché il prodotto.** La likelihood è la densità congiunta $p(\mathbf{x}_1, \ldots, \mathbf{x}_N|\boldsymbol{\theta})$. Con la regola del prodotto la scrivo come $p(\mathbf{x}_1|\boldsymbol{\theta})\,p(\mathbf{x}_2|\mathbf{x}_1, \boldsymbol{\theta})\cdots$. L'indipendenza fa cadere il condizionamento sugli altri campioni; l'identica distribuzione rende tutti i fattori la stessa funzione $p(\cdot|\boldsymbol{\theta})$. Se due misure fossero copie l'una dell'altra, il prodotto le conterebbe due volte e sottovaluterebbe l'incertezza.

**Che cosa descrive.** A dati fissati, $p(\mathbf{X}|\boldsymbol{\theta})$ è una funzione di $\boldsymbol{\theta}$: misura la compatibilità tra i parametri del modello e i campioni osservati, cioè quanto bene il modello scelto «spiega» il training set. Variando $\boldsymbol{\theta}$ ottengo pdf diverse, ognuna con il suo valore di likelihood; la stima ML sceglie quella che meglio si accorda con i campioni. Come funzione di $\boldsymbol{\theta}$ non è una densità e in generale non integra a 1.

**Bontà di una stima.** La stima dipende dalle osservazioni, $\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\mathbf{X})$: con un altro training set ottengo un'altra stima, quindi è un vettore aleatorio. Definisco l'errore di stima (*estimation error*)

$$\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta} = [\hat{\theta}_i - \theta_i : i = 1, 2, \ldots, r]$$

La stima ideale ha ogni $\varepsilon_i$ non polarizzato e senza varianza. Il bias è la media dell'errore: la stima è non polarizzata (*unbiased*) se $E\{\boldsymbol{\varepsilon}\} = 0$, cioè $E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$. La varianza è $\operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \bar{\hat{\theta}}_i)^2\}$ e la giudico con il bound di Cramér-Rao, che vale per gli stimatori non polarizzati:

$$\operatorname{var}\{\varepsilon_i\} \geq [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}, \qquad [\mathbf{I}(\boldsymbol{\theta})]_{ij} = E\left\{\frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial\theta_i}\cdot\frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial\theta_j}\right\}$$

Se la varianza raggiunge il bound lo stimatore è efficiente (*efficient*). Nei problemi reali gli stimatori sono spesso polarizzati e inefficienti, quindi li giudico per $N \to +\infty$: asintoticamente non polarizzato, $\lim_{N\to+\infty}E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$; asintoticamente efficiente, $\lim_{N\to+\infty}\frac{\operatorname{var}\{\varepsilon_i\}}{[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1$; consistente, $\lim_{N\to+\infty}P\{\Vert\boldsymbol{\varepsilon}\Vert < \delta\} = 1$ per ogni $\delta > 0$.

**La ML è un buon stimatore?** Sì. Sotto certe ipotesi su $p(\mathbf{x}|\boldsymbol{\theta})$, se esiste uno stimatore efficiente e la stima ML è non polarizzata, lo stimatore efficiente è proprio la ML. Anche quando uno stimatore efficiente non esiste, la ML è asintoticamente non polarizzata, asintoticamente efficiente e consistente: per questo si usa in tanti problemi reali. A $N$ finito può essere polarizzata: la stima ML della varianza di una gaussiana, $\frac{1}{N}\sum_k(x_k - \hat{m})^2$, ha media $\frac{N-1}{N}\sigma^2$.

**Meglio o peggio della bayesiana?** Dipende dal contesto. Nella ML $\boldsymbol{\theta}$ è fisso ma ignoto e ottimizzo una funzione obiettivo che usa solo i dati osservati. Nella stima bayesiana $\boldsymbol{\theta}$ è una variabile aleatoria con una prior nota, che il teorema di Bayes aggiorna in una posterior. La ML costa meno (nessun integrale su intere distribuzioni) e dà un solo valore, facile da interpretare e da usare. La bayesiana incorpora la conoscenza a priori, preziosa quando i dati sono pochi, e quantifica l'incertezza con l'intera posterior. Con pochi dati e una prior affidabile preferisco la bayesiana; con molti dati scelgo la ML, che arriva allo stesso punto con meno calcoli.

**Esercizio.** Luminosità di $N$ salmoni, gaussiana con $\sigma$ nota e media $m$ ignota:

$$\ln p(\mathbf{X}|m) = -\frac{N}{2}\ln(2\pi\sigma^2) - \sum_{k=1}^{N}\frac{(x_k - m)^2}{2\sigma^2}, \qquad \frac{\partial \ln p(\mathbf{X}|m)}{\partial m} = \sum_{k=1}^{N}\frac{x_k - m}{\sigma^2} = 0 \;\Rightarrow\; \hat{m} = \frac{1}{N}\sum_{k=1}^{N}x_k$$

La derivata seconda $-N/\sigma^2$ è negativa, quindi è un massimo. Con le misure $4.1$, $3.7$, $4.6$ ottengo $\hat{m} = 4.13$. La media campionaria è non polarizzata e ha varianza $\sigma^2/N$, uguale al bound $1/I(m)$ con $I(m) = N/\sigma^2$: è efficiente, come prevede il teorema.

**Quando coincidono.** In due casi. Con infiniti campioni di training le due soluzioni diventano equivalenti: nel caso gaussiano la media a posteriori $\mu_N = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\,\hat{m} + \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\,\mu_0$ tende alla media campionaria e la posterior diventa una delta centrata lì. Con una prior uniforme, cioè nessuna conoscenza a priori, la prior non sposta la posterior e la soluzione bayesiana si riduce a quella ML.`,
    checklist: [
      md`likelihood come prodotto $\prod_k p(\mathbf{x}_k|\boldsymbol{\theta})$ per campioni iid`,
      'prodotto giustificato: indipendenza (cade il condizionamento) e identica distribuzione (stessa densità)',
      md`significato: compatibilità tra $\boldsymbol{\theta}$ e dati, quanto il modello spiega il training set`,
      md`definizione ML con $\arg\max$ e passaggio alla log-likelihood (monotonia, prodotti in somme)`,
      'stima aleatoria, errore di stima, bias e varianza, stima ideale',
      'bound di Cramér-Rao con la matrice di Fisher ed efficienza',
      'tre proprietà asintotiche con le formule',
      'proprietà della ML: teorema sull\'efficienza e proprietà asintotiche',
      'ML contro bayesiana: natura dei parametri, obiettivo, costo, prior e incertezza',
      md`esercizio svolto: derivata prima per la media gaussiana e $\hat{m} = \bar{x}$`,
      'coincidenza: infiniti campioni e prior uniforme',
    ],
    followUps: [
      {
        q: md`Perché conviene lavorare con $\ln p(\mathbf{X}|\boldsymbol{\theta})$?`,
        a: md`Il logaritmo è monotono crescente, quindi il massimo resta nello stesso punto. Il prodotto di $N$ densità diventa una somma, che si deriva termine per termine; in più un prodotto di tanti numeri piccoli va in underflow sul calcolatore, una somma di logaritmi no.`,
      },
      {
        q: 'La likelihood è una densità di probabilità per il parametro?',
        a: md`No. È una densità in $\mathbf{X}$, letta come funzione di $\boldsymbol{\theta}$ a dati fissati. Per una Bernoulli con $k$ successi su $N$, $\int_0^1\theta^k(1-\theta)^{N-k}\,d\theta = \frac{k!\,(N-k)!}{(N+1)!} \neq 1$.`,
      },
      {
        q: 'La stima ML è sempre non polarizzata?',
        a: md`No. La stima ML della varianza ha media $\frac{N-1}{N}\sigma^2$; quella del fondo scala di un'uniforme su $[0, \theta]$ è il massimo dei campioni, con media $\frac{N}{N+1}\theta$. Entrambe sono però asintoticamente non polarizzate.`,
      },
      {
        q: md`Che cosa dà la stima bayesiana della media gaussiana con $N = 0$?`,
        a: md`$\mu_N = \mu_0$: senza campioni l'unica informazione è la prior, e la media a posteriori coincide con la media a priori.`,
      },
    ],
  },
  {
    id: 'or-banca-2',
    q: md`Stima a finestre di Parzen: contesto e proprietà. Qual è la funzione finestra più comune (scrivi la formula)? Parzen è un buon stimatore (bias e varianza)? Mostra con un disegno come funzionano il conteggio e l'interpolazione con un paio di campioni.`,
    qEn: 'Parzen window estimation: context and properties. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Show graphically how counting and interpolation work with a couple of samples.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Parzen Window Estimation: context, properties etc. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Graphical representation of how the counting/interpolation works with  a couple of samples.',
    answer: md`**Contesto.** Sono nella stima non parametrica: non conosco la forma funzionale di $p(\mathbf{x})$, oppure i modelli parametrici la approssimano male, quindi lavoro direttamente sui campioni. In una regione $R$ piccola attorno a $\mathbf{x}^*$ ho $P_R \approx p(\mathbf{x}^*)\,V$, e la frequenza relativa $K/N$ è una stima consistente di $P_R$: da qui $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$. Nel metodo di Parzen fisso la regione, quindi $V$, e conto $K$. Con un ipercubo di lato $h$, $V = h^n$, e la funzione finestra $\gamma(\mathbf{u})$ che vale 1 se $\vert u_j\vert \le 1/2$ per ogni $j$ e 0 altrimenti:

$$K = \sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}^* - \mathbf{x}_k}{h}\right), \qquad \hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\,\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$$

La stima è una media di funzioni centrate sui campioni: la finestra fa da interpolatore, ogni campione contribuisce secondo la sua distanza da $\mathbf{x}$. Perché $\hat{p}$ sia una densità chiedo $\gamma \ge 0$ e $\int\gamma(\mathbf{u})\,d\mathbf{u} = 1$.

**Finestra più comune.** La gaussiana:

$$\gamma(\mathbf{u}) = \frac{1}{(2\pi)^{n/2}}\exp\left(-\frac{\Vert\mathbf{u}\Vert^2}{2}\right) \;\Rightarrow\; \hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi h^2)^{n/2}}\exp\left(-\frac{\Vert\mathbf{x} - \mathbf{x}_k\Vert^2}{2h^2}\right)$$

È liscia, derivabile e dà una stima continua; la finestra rettangolare invece produce gradini.

**È un buon stimatore?** Uso i criteri della bontà di una stima, con il valore $p(\mathbf{x})$ al posto di $\boldsymbol{\theta}$ e l'errore $\varepsilon(\mathbf{x}) = \hat{p}(\mathbf{x}) - p(\mathbf{x})$.

- Bias: con campioni iid $E\{\hat{p}(\mathbf{x})\} = \int\frac{1}{h^n}\gamma\left(\frac{\mathbf{x} - \mathbf{v}}{h}\right)p(\mathbf{v})\,d\mathbf{v}$, la convoluzione di $p$ con la finestra riscalata. A $h$ fisso la stima è polarizzata: vedo una versione sfocata di $p$. Se $h_N \to 0$ la finestra riscalata tende a una delta di Dirac e la stima diventa asintoticamente non polarizzata.
- Varianza: $E\{(\hat{p}(\mathbf{x}) - \bar{\hat{p}}(\mathbf{x}))^2\} \le \frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$, che va a zero se $N h_N^n \to +\infty$.
- Consistenza: con $\lim_{N\to+\infty}h_N = 0$ e $\lim_{N\to+\infty}N h_N^n = +\infty$ bias e varianza tendono a zero e la stima è consistente; esempio $h_N = 1/\sqrt[2n]{N}$, che dà $N h_N^n = \sqrt{N}$.

A $N$ finito resta il compromesso, perché l'errore quadratico medio è varianza più bias al quadrato: $h$ grande sfoca e perde i picchi (*oversmoothing*), $h$ piccolo produce aghi sui campioni che inseguono il rumore (*overfitting*).

**Disegno con due campioni.** Metto $x_1 = 2$ e $x_2 = 3$ sull'asse, $N = 2$, $h = 2$. Conteggio: su ogni campione un rettangolo largo $h$ e alto $\frac{1}{Nh} = \frac{1}{4}$; la stima è una scala che vale $\frac{1}{4}$ su $[1, 2)$ e $(3, 4]$, $\frac{1}{2}$ su $[2, 3]$ dove i rettangoli si sovrappongono, e 0 fuori. L'area è $\frac{1}{4} + \frac{1}{2} + \frac{1}{4} = 1$. Interpolazione: al posto dei rettangoli disegno due campane gaussiane di area $\frac{1}{2}$ ciascuna; la somma è una curva liscia con una sola gobba, perché i campioni distano meno di $2h$. Con i campioni più lontani di $2h$ vedrei due gobbe.`,
    checklist: [
      md`contesto non parametrico e stima di base $K/(NV)$ con $V$ fisso`,
      md`funzione finestra e formula generale con $1/V(h)$`,
      'kernel gaussiano scritto per esteso',
      md`media della stima come convoluzione: polarizzata a $h$ fisso, asintoticamente non polarizzata con $h_N \to 0$`,
      'bound sulla varianza e condizioni di consistenza con un esempio',
      'compromesso tra oversmoothing e overfitting',
      'disegno: scala dei rettangoli e curva liscia delle gaussiane, area 1',
    ],
    followUps: [
      {
        q: md`Perché compare il fattore $1/h^n$?`,
        a: md`Con il cambio di variabile $\mathbf{u} = (\mathbf{x} - \mathbf{x}_k)/h$ si ha $d\mathbf{x} = h^n\,d\mathbf{u}$: senza il fattore ogni finestra avrebbe area $h^n$ e la stima non integrerebbe a 1.`,
      },
      {
        q: md`A $h$ fisso, più campioni migliorano la stima?`,
        a: md`Riducono la varianza, non il bias: $E\{\hat{p}(\mathbf{x})\}$ non dipende da $N$. La stima si concentra attorno alla versione sfocata di $p$, non attorno a $p$.`,
      },
      {
        q: 'In che senso la consistenza di Parzen è la stessa delle slide sulla bontà degli stimatori?',
        a: md`È la convergenza in probabilità: $\lim_{N\to+\infty}P\{\vert\hat{p}(\mathbf{x}) - p(\mathbf{x})\vert < \delta\} = 1$ per ogni $\delta > 0$. La si ottiene con la condizione della slide: stima asintoticamente non polarizzata ($h_N \to 0$) e varianza che tende a zero ($N h_N^n \to +\infty$).`,
      },
    ],
  },
  {
    id: 'or-banca-3',
    q: md`Finestre di Parzen: contesto generale (che cosa vogliamo fare, perché è una stima non parametrica), kernel gaussiano a simmetria sferica con formula e disegno, effetto della scelta della larghezza sulla stima. È una buona stima? (Bias, varianza e caratteristiche della larghezza per avere una stima consistente.)`,
    qEn: 'Parzen windows: general context (what we want to do, why it is a non-parametric estimation), Gaussian kernel with spherical symmetry with formula and a drawing, how the choice of the width affects the estimate. Is it a good estimate? (Bias, variance and the characteristics of the width needed for a consistent estimate.)',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Parzen Windows: general context (what we want to do, why they are non parametric estimation), gaussian kernel with spherical symmetry with formula and some drawing to represent it, How the choice of the width impacts our estimate? Is it a good estimate? (Bias, variance and consideration about the characteristics of the width to have a consistent estimate)',
    answer: md`**Che cosa voglio fare.** Stimare la pdf $p(\mathbf{x})$ di un fenomeno, per esempio la luminosità dei salmoni, senza assumere una forma funzionale. È non parametrica perché non scelgo una famiglia $p(\mathbf{x}|\boldsymbol{\theta})$ con un numero fisso di parametri: la stima usa direttamente tutti i campioni e cresce con loro. Parto da $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$, fisso la regione di volume $V = h^n$ e conto i campioni che ci cadono; con una finestra generale la stima diventa $\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$.

**Kernel gaussiano a simmetria sferica** (metodo di Specht):

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\Vert\mathbf{x} - \mathbf{x}_k\Vert^2}{2\sigma^2}\right)$$

Disegno: nel piano di due feature metto i campioni e su ciascuno una campana con curve di livello circolari, tutte con lo stesso $\sigma$; la stima è la somma divisa per $N$, alta dove i campioni si addensano. $\sigma$ è la stessa lungo tutte le feature, quindi prima le normalizzo; posso anche usare una $\sigma_k$ adattiva per ogni campione.

**Effetto della larghezza.** Scrivo $\delta(\mathbf{x}) = \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$: $h$ cambia insieme ampiezza e larghezza di $\delta$, lasciando l'area uguale a 1. Con $h$ grande la stima è una somma di funzioni larghe e basse: sovra-lisciata, perde i picchi e le mode vicine si fondono (*oversmoothing*). Con $h$ piccolo è una somma di aghi sui campioni: molto variabile da un training set all'altro, insegue il rumore (*overfitting*). Più campioni ho, più posso stringere $h$.

**È una buona stima?** Uso i criteri delle slide sulla bontà degli stimatori.

- Bias: $E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \delta(\mathbf{x})$, una convoluzione. A $h$ finito la stima è polarizzata; se $h_N \to 0$, $\delta$ tende alla delta di Dirac e la stima è asintoticamente non polarizzata.
- Varianza: $E\{(\hat{p}(\mathbf{x}) - \bar{\hat{p}}(\mathbf{x}))^2\} \le \frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$.
- Consistenza: servono insieme

$$\lim_{N\to+\infty}h_N = 0, \qquad \lim_{N\to+\infty}N h_N^n = +\infty$$

La prima toglie il bias, la seconda porta a zero la varianza: è la condizione delle slide, asintoticamente non polarizzata con varianza che tende a zero. La finestra deve stringersi, ma più lentamente di quanto crescono i campioni, così che il volume $h_N^n$ contenga sempre più campioni. Esempio: $h_N = 1/\sqrt[2n]{N}$, per cui $N h_N^n = \sqrt{N} \to +\infty$. Se $h_N$ si stringe troppo in fretta la stima resta rumorosa, se si stringe troppo piano resta sfocata.`,
    checklist: [
      'obiettivo e perché è non parametrica (nessuna famiglia con parametri fissi)',
      md`formula di Specht con $(2\pi\sigma^2)^{n/2}$ e $\Vert\mathbf{x} - \mathbf{x}_k\Vert^2$`,
      'disegno: campane a curve di livello circolari su ogni campione e loro somma',
      md`normalizzazione delle feature e $\sigma$ come parametro di lisciatura`,
      md`effetto di $h$ su ampiezza e larghezza di $\delta(\mathbf{x})$, area costante`,
      md`oversmoothing con $h$ grande, overfitting con $h$ piccolo`,
      'bias come convoluzione, bound sulla varianza',
      md`due condizioni di consistenza e l'esempio $h_N = 1/\sqrt[2n]{N}$`,
    ],
    followUps: [
      {
        q: md`Perché serve $N h_N^n \to +\infty$ e non basta $h_N \to 0$?`,
        a: md`$N h_N^n$ è proporzionale al numero atteso di campioni nella finestra. Se resta limitato, la stima in ogni punto dipende da pochi campioni e la varianza non va a zero: stima non consistente anche se non polarizzata al limite.`,
      },
      {
        q: 'Che cosa succede se non normalizzo le feature?',
        a: md`Con una sola $\sigma$ la feature con la scala più grande domina la distanza $\Vert\mathbf{x} - \mathbf{x}_k\Vert$: la stima sarebbe troppo stretta lungo quella direzione o troppo larga lungo le altre.`,
      },
    ],
  },
  {
    id: 'or-banca-4',
    q: md`Spiega la stima non parametrica: che cosa significa non parametrica e perché la usiamo. Spiega K-NN e finestre di Parzen: tendono alla soluzione ottima? Spiega la stima ML, sviluppa la derivata prima per una gaussiana e spiega il significato del risultato. Spiega il box classifier.`,
    qEn: 'Explain non-parametric estimation, what non-parametric means and why we use it; explain both K-NN and Parzen windows: do they tend to the optimal solution? Explain ML estimation, develop the first derivative for a Gaussian and explain the meaning of the result. Explain the box classifier.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Explain non-parametric estimation, what non-parametric means and why we use it, explain both KNN and Parzen windows, do they tend to the optimal solution? Explain ML estimation, develop the first derivative for a gaussian and explain the meaning of the result. Explain box classifier',
    answer: md`**Stima non parametrica.** Serve quando non ho conoscenza a priori sulla forma funzionale della pdf, oppure quando i modelli parametrici non la approssimano bene. «Non parametrica» vuol dire che non assumo una famiglia $p(\mathbf{x}|\boldsymbol{\theta})$ con un numero fisso di parametri: lavoro direttamente sui campioni di training. Base comune: in una regione $R$ di volume $V$ attorno a $\mathbf{x}^*$, $P_R \approx p(\mathbf{x}^*)V$; se $K$ campioni su $N$ cadono in $R$, la frequenza relativa $K/N$ stima $P_R$ (legge dei grandi numeri) e

$$\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$$

$R$ deve essere abbastanza grande da contenere molti campioni e abbastanza piccola perché $p$ non vari al suo interno.

**K-NN.** Fisso $K$ e la forma della cella (per esempio un'ipersfera centrata in $\mathbf{x}^*$), espando la cella finché contiene $K$ campioni e ne misuro il volume: $\hat{p}(\mathbf{x}^*) = \frac{K}{N V_K(\mathbf{x}^*)}$.

**Parzen.** Fisso la regione, cioè $V = h^n$, e conto $K$ con la funzione finestra: $\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$.

**Tendono alla soluzione ottima?** Sì, se faccio variare i parametri con $N$; la garanzia è la consistenza, cioè la convergenza in probabilità al valore vero. Per il K-NN la condizione necessaria e sufficiente, in ogni punto dove $p$ è continua, è $\lim_{N\to+\infty}K_N = +\infty$ e $\lim_{N\to+\infty}K_N/N = 0$, per esempio $K_N = \sqrt{N}$. Per Parzen servono $\lim h_N = 0$ e $\lim N h_N^n = +\infty$, per esempio $h_N = 1/\sqrt[2n]{N}$. Messe dentro la regola di Bayes, stime consistenti portano al classificatore bayesiano, che è l'ottimo. Il limite: entrambi convergono, ma a $N$ finito è difficile dire quanto siano buoni, e in alta dimensione servono moltissimi campioni.

**Stima ML e derivata prima per la gaussiana.** La stima ML è $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}}\ln p(\mathbf{X}|\boldsymbol{\theta})$ con $p(\mathbf{X}|\boldsymbol{\theta}) = \prod_k p(\mathbf{x}_k|\boldsymbol{\theta})$. Per una gaussiana 1-D:

$$\ln p(\mathbf{X}|m, \sigma^2) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k - m)^2$$

$$\frac{\partial \ln p}{\partial m} = \frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k - m) = 0 \;\Rightarrow\; \hat{m} = \frac{1}{N}\sum_{k=1}^{N}x_k$$

$$\frac{\partial \ln p}{\partial \sigma^2} = -\frac{N}{2\sigma^2} + \frac{1}{2\sigma^4}\sum_{k=1}^{N}(x_k - m)^2 = 0 \;\Rightarrow\; \hat{\sigma}^2 = \frac{1}{N}\sum_{k=1}^{N}(x_k - \hat{m})^2$$

Significato: la stima ML della media è il baricentro dei campioni, il punto che minimizza la somma dei quadrati delle distanze; quella della varianza è lo scarto quadratico medio dal baricentro. In $n$ dimensioni $\hat{\mathbf{m}} = \frac{1}{N}\sum_k\mathbf{x}_k$ e $\hat{\Sigma} = \frac{1}{N}\sum_k(\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$. Proprietà: $E\{\hat{\mathbf{m}}\} = \mathbf{m}$ ed $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$, quindi $\hat{\Sigma}$ è polarizzata; entrambe sono asintoticamente non polarizzate, efficienti asintoticamente e consistenti. Lo stimatore non polarizzato elementare divide per $N - 1$.

**Box classifier.** Estende il classificatore a minima distanza dalla media (che assegna alla classe con il baricentro più vicino) usando le statistiche del secondo ordine in modo semplice. Ogni classe è una pdf uniforme su un iper-rettangolo (la «scatola») centrato sul baricentro, con lato lungo ogni feature proporzionale alla deviazione standard della classe lungo quella feature. Un campione dentro una scatola va alla classe corrispondente; se cade fuori da tutte, lo assegno alla scatola con il bordo più vicino oppure lo lascio non classificato. L'altezza della pdf in ogni scatola rende il volume totale uguale a 1, e la probabilità serve a decidere quando le scatole si sovrappongono. Limiti: confini rettangolari rigidi e gestione degli outlier.`,
    checklist: [
      'quando serve la stima non parametrica e che cosa significa',
      md`stima di base $K/(NV)$ e compromesso sulla dimensione di $R$`,
      md`K-NN: $K$ fisso, volume che si adatta`,
      md`Parzen: volume fisso, $K$ contato con la finestra`,
      md`consistenza di entrambi con le condizioni su $K_N$ e $h_N$`,
      'derivata prima della log-likelihood gaussiana e media campionaria',
      'significato: baricentro dei campioni, proprietà delle stime ML (covarianza polarizzata)',
      'box classifier: scatole centrate sui baricentri, lati proporzionali alle deviazioni standard, gestione dei campioni fuori',
    ],
    followUps: [
      {
        q: md`Perché nel K-NN serve anche $K_N/N \to 0$?`,
        a: md`Garantisce che la cella si restringa: la frazione di campioni nella cella va a zero, quindi il volume $V_K$ si stringe attorno a $\mathbf{x}^*$ e la stima diventa locale (bias che si spegne). $K_N \to +\infty$ invece riduce la varianza.`,
      },
      {
        q: md`La stima ML della varianza è efficiente?`,
        a: md`Non a $N$ finito: è polarizzata e la sua varianza $\frac{2(N-1)}{N^2}\sigma^4$ confrontata con il bound $\frac{2\sigma^4}{N}$ dà un rapporto $\frac{N-1}{N}$ che tende a 1. È asintoticamente efficiente.`,
      },
      {
        q: 'Che differenza c\'è tra box classifier e classificatore a minima distanza?',
        a: 'Il classificatore a minima distanza usa solo i baricentri, cioè le statistiche del primo ordine; il box classifier aggiunge la dispersione di ogni classe lungo ogni feature, quindi tiene conto di classi più o meno disperse.',
      },
    ],
  },
  {
    id: 'or-banca-5',
    q: md`Percettrone (tutto) più domande sulla stima dei parametri: il problema della soluzione analitica per la regressione con il percettrone; nell'esempio di stima dei parametri di una gaussiana, perché anche la posterior è gaussiana? Come si usa la stima dei parametri nelle reti bayesiane? Perché la ML è veloce in una rete bayesiana (indipendenza delle CPD)?`,
    qEn: 'Perceptron (all) plus parameter estimation questions: the problem with the analytical solution for perceptron regression; in the example of estimating the parameters of a Gaussian, why do we also obtain a Gaussian as posterior? How is parameter estimation used in Bayesian networks? Why is ML fast in a Bayesian network (independence of the CPDs)?',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Perceptron (All) + Parameter estimation Questions: - Problem with analytical solution for perceptron regression - Example of estimation of Gaussian parameters: why do we obtain a Gaussian also as posterior? - How to use parameter estimation in Bayesian Networks - Why ML is fast in Bayesian Network (CDP independence)',
    answer: md`**Percettrone.** È un'unità lineare con soglia: $f(\mathbf{x}) = \operatorname{sign}(\mathbf{w}^T\mathbf{x})$, con il bias assorbito in $\mathbf{w}$. Rappresenta ogni insieme linearmente separabile, non lo XOR; una rete a due strati di percettroni rappresenta qualunque funzione booleana. Lo addestro minimizzando l'errore sui campioni mal classificati $D_E$:

$$E(\mathbf{w}; D) = \sum_{(\mathbf{x}, y)\in D_E} -y\,\mathbf{w}^T\mathbf{x}, \qquad \nabla E = -\sum_{(\mathbf{x}, y)\in D_E} y\,\mathbf{x}, \qquad \mathbf{w} \leftarrow \mathbf{w} + \eta\sum_{(\mathbf{x}, y)\in D_E} y\,\mathbf{x}$$

Nella versione stocastica aggiorno con un campione alla volta: costa meno per aggiornamento del batch, che deve predire tutto il training set.

**Regressione e soluzione analitica.** Per la regressione vorrei $X\mathbf{w} = \mathbf{y}$, cioè $\mathbf{w} = X^{-1}\mathbf{y}$. Non funziona quasi mai: $X$ è rettangolare ($n > d$, più esempi che feature) e quindi non invertibile, e il sistema è sovradeterminato, senza soluzione esatta. Minimizzo allora l'errore quadratico $E(\mathbf{w}; D) = (\mathbf{y} - X\mathbf{w})^T(\mathbf{y} - X\mathbf{w})$; annullando il gradiente $-2\mathbf{y}^TX + 2\mathbf{w}^TX^TX$ ottengo

$$X^TX\mathbf{w} = X^T\mathbf{y} \;\Rightarrow\; \mathbf{w} = (X^TX)^{-1}X^T\mathbf{y}$$

con la pseudo-inversa sinistra. Il problema: serve $X^TX$ di rango pieno; con feature linearmente dipendenti non è invertibile e devo togliere le feature ridondanti. Se $X^TX$ è grande l'inversione costa troppo e passo alla discesa del gradiente.

**Perché la posterior è gaussiana.** Stimo la media $\mu$ di una gaussiana con $\sigma^2$ nota e prior gaussiana $p(\mu) \sim N(\mu_0, \sigma_0^2)$. La posterior è proporzionale a likelihood per prior: un prodotto di esponenziali con esponenti quadratici in $\mu$, quindi ancora l'esponenziale di una quadratica in $\mu$, cioè una gaussiana. La prior gaussiana è coniugata (*conjugate prior*) alla likelihood gaussiana: la posterior mantiene la forma della prior e i conti restano analitici. Risultato: $p(\mu|\mathbf{X}) = N(\mu_N, \sigma_N^2)$ con

$$\mu_N = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\,\bar{x} + \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\,\mu_0, \qquad \sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2 + \sigma^2}$$

Con $N \to +\infty$, $\mu_N \to \bar{x}$ (la stima ML) e $\sigma_N^2 \to 0$.

**Stima dei parametri in una rete bayesiana.** Con dati completi la likelihood è il prodotto sugli esempi, che sono iid dato $\boldsymbol{\theta}$, e la fattorizzazione della rete la spezza nelle distribuzioni di probabilità condizionate (*conditional probability distribution*, CPD) di ogni variabile dati i genitori:

$$p(D|\boldsymbol{\theta}) = \prod_{i=1}^{N}\prod_{j=1}^{m}p(x_j^{(i)}|pa_j^{(i)}, \boldsymbol{\theta}_{X_j|pa_j})$$

Ogni CPD ha il suo sottoinsieme disgiunto di parametri, quindi massimizzo separatamente una likelihood locale per CPD. Per una CPD discreta a tabella la likelihood locale è $\prod_{\mathbf{u}}\prod_x\theta_{x|\mathbf{u}}^{N_{\mathbf{u},x}}$ con il vincolo $\sum_x\theta_{x|\mathbf{u}} = 1$, e la stima ML è la frequenza relativa $\hat{\theta}_{x|\mathbf{u}} = N_{\mathbf{u},x}/N_{\mathbf{u}}$. In versione bayesiana uso una prior di Dirichlet, coniugata della multinomiale, i cui parametri fanno da pseudo-conteggi (osservazioni immaginarie) sommati ai conteggi veri.

**Perché la ML è veloce.** Per la fattorizzazione e l'indipendenza dei parametri delle CPD non c'è un'ottimizzazione globale: basta un passaggio sui dati per contare le configurazioni (le statistiche sufficienti) e normalizzare colonna per colonna, tabella per tabella. Con dati incompleti i conteggi non si possono fare e serve l'EM con conteggi attesi.

**Legame con la teoria della stima.** Nella ML i parametri delle CPD sono costanti ignote; nella versione bayesiana sono variabili aleatorie con prior nota. Le due soluzioni coincidono al crescere dei dati o con una prior uniforme.`,
    checklist: [
      'percettrone: funzione, separabilità lineare, regola di aggiornamento',
      md`regressione: $X$ non invertibile e sistema sovradeterminato, minimi quadrati e pseudo-inversa`,
      md`limiti della soluzione analitica: $X^TX$ di rango pieno, costo dell'inversione`,
      md`prior coniugata: posterior gaussiana, formule di $\mu_N$ e $\sigma_N^2$`,
      'likelihood della rete fattorizzata nelle CPD, parametri disgiunti, stima locale',
      'stima ML di una CPD a tabella come frequenza relativa, prior di Dirichlet come pseudo-conteggi',
      'velocità: conteggi e normalizzazione, niente ottimizzazione globale',
    ],
    followUps: [
      {
        q: 'Perché la likelihood della rete si può scrivere come prodotto sugli esempi?',
        a: md`Perché gli esempi sono indipendenti dato $\boldsymbol{\theta}$ e generati dallo stesso modello: la densità congiunta del dataset si fattorizza come nel caso iid della stima parametrica.`,
      },
      {
        q: md`Che cosa succede alla posterior della media se $\sigma_0^2 \to +\infty$?`,
        a: md`La prior diventa piatta: $\mu_N \to \bar{x}$ e $\sigma_N^2 \to \sigma^2/N$. La stima bayesiana coincide con quella ML, come succede con una prior uniforme.`,
      },
      {
        q: 'Perché la discesa del gradiente al posto della soluzione chiusa?',
        a: md`L'inversione di $X^TX$, matrice $d \times d$, costa circa $d^3$ operazioni: con molte feature o dati che arrivano in flusso conviene aggiornare i pesi un passo alla volta.`,
      },
    ],
  },
  {
    id: 'or-banca-6',
    q: md`Errore di generalizzazione (errore di approssimazione ed errore di stima), macchina addestrata, spazio target e spazio delle ipotesi, rischio empirico, funzioni di perdita (coefficiente di correlazione, MSE, RMSE, errore assoluto).`,
    qEn: 'Generalization error (approximation error and estimation error), trained machine, target space and hypothesis space, empirical risk, loss functions (correlation coefficient, MSE, RMSE, absolute error).',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Generalization error (Approximation error - Estimation error) - (Trained machine) - Target space/ hypothesis space - Empirical risk Loss function (correlation coefficient - MSE - RMSE-absolute error)',
    answer: md`**Spazi e obiettivo.** Nello spazio target (*target space*) c'è la funzione vera $f_{true}(\mathbf{x})$; io scelgo il modello dentro uno spazio delle ipotesi (*hypothesis space*) e voglio la funzione più vicina a $f_{true}$ secondo una misura d'errore. L'errore di generalizzazione, cioè l'errore su campioni nuovi, nasce da due parti:

- errore di approssimazione (*approximation error*): distanza tra $f_{true}$ e la migliore funzione dello spazio delle ipotesi, $f(\mathbf{x}, \alpha^*)$. È il limite del modello, per esempio una retta su dati non lineari. Lo riduco allargando lo spazio delle ipotesi, con il rischio di overfitting;
- errore di stima (*estimation error*): distanza tra $f(\mathbf{x}, \alpha^*)$ e la funzione che imparo davvero, $f(\mathbf{x}, \hat{\alpha})$, perché apprendo da un campione limitato e non dall'intera popolazione.

Modelli semplici hanno errore di stima basso e di approssimazione alto; modelli complessi il contrario. Cerco il compromesso.

**Macchina addestrata.** La macchina impara la corrispondenza $\mathbf{x}_i \to y_i$; i dati sono estratti iid da una distribuzione $P(\mathbf{x}, y)$ ignota. La macchina è un insieme di funzioni $\mathbf{x} \to f(\mathbf{x}, \alpha)$ etichettate dai parametri regolabili $\alpha$, ed è deterministica: dato $\mathbf{x}$ e fissato $\alpha$ l'uscita è sempre la stessa. Una scelta particolare di $\alpha$ è una macchina addestrata (*trained machine*).

**Rischio e rischio empirico.** L'errore di generalizzazione atteso, o rischio, è

$$R(\alpha) = \int_{X\times Y} L(y, f(\mathbf{x}, \alpha))\,p(\mathbf{x}, y)\,d\mathbf{x}\,dy$$

con una funzione di perdita, per esempio $L = \frac{1}{2}(y - f(\mathbf{x}, \alpha))^2$. Serve $p(\mathbf{x}, y)$, che non conosco; allora uso il rischio empirico, la perdita media sul training set:

$$R_{emp}(\alpha) = \frac{1}{N}\sum_{i=1}^{N}L(y_i, f(\mathbf{x}_i, \alpha))$$

L'approssimazione vale solo con $N$ molto grande: al crescere di $N$, $R_{emp}$ tende a $R$ (minimizzazione del rischio empirico). Siccome in pratica $N$ è limitato, stimo l'accuratezza con procedure come hold-out e cross-validation, che servono a scegliere gli iperparametri, valutare una macchina addestrata e confrontare macchine diverse.

**Misure d'errore per la regressione.** Con $\hat{y}_i = f(\mathbf{x}_i, \alpha)$:

$$\text{MSE} = \frac{1}{N}\sum_{i=1}^{N}(y_i - \hat{y}_i)^2, \qquad \text{RMSE} = \sqrt{\text{MSE}}, \qquad \text{MAE} = \frac{1}{N}\sum_{i=1}^{N}\vert y_i - \hat{y}_i\vert$$

L'MSE pesa molto gli errori grandi; la RMSE ha la stessa unità di $y$; l'errore assoluto è meno sensibile agli outlier. Il coefficiente di correlazione $\rho = \frac{\sum_i(y_i - \bar{y})(\hat{y}_i - \bar{\hat{y}})}{\sqrt{\sum_i(y_i - \bar{y})^2\sum_i(\hat{y}_i - \bar{\hat{y}})^2}}$ misura l'accordo lineare tra predizioni e valori veri: vale 1 se sono allineati, ma non vede un offset o un errore di scala.

**Attenzione al nome.** Nella stima parametrica «estimation error» è il vettore aleatorio $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$ tra i parametri stimati di una pdf e quelli veri. Qui è una componente dell'errore di generalizzazione di una macchina addestrata. Hanno la stessa origine, il training set finito, ed entrambi calano al crescere di $N$ per uno stimatore consistente, ma non vanno confusi.`,
    checklist: [
      'spazio target, spazio delle ipotesi e funzione più vicina',
      'errore di approssimazione (limite del modello) ed errore di stima (campione finito)',
      'compromesso tra complessità e overfitting',
      md`macchina deterministica, parametri $\alpha$, macchina addestrata`,
      md`rischio atteso $R(\alpha)$ e rischio empirico $R_{emp}(\alpha)$, validità con $N$ grande`,
      'MSE, RMSE, errore assoluto e coefficiente di correlazione con le formule',
      'distinzione dall\'errore di stima dei parametri',
    ],
    followUps: [
      {
        q: 'Allargare lo spazio delle ipotesi riduce sempre l\'errore di generalizzazione?',
        a: 'No. Riduce l\'errore di approssimazione, ma con lo stesso numero di campioni aumenta l\'errore di stima: il modello si adatta al rumore del training set (overfitting).',
      },
      {
        q: 'Perché il rischio empirico non basta a valutare una macchina?',
        a: md`È calcolato sugli stessi campioni usati per addestrarla, quindi è ottimista; approssima $R(\alpha)$ solo con $N$ molto grande. Per questo si valuta su dati separati (hold-out, cross-validation).`,
      },
      {
        q: 'Un coefficiente di correlazione pari a 1 garantisce errore nullo?',
        a: md`No: se $\hat{y}_i = 2y_i + 5$ la correlazione è 1 ma l'MSE è grande. La correlazione misura l'allineamento lineare, non la distanza.`,
      },
    ],
  },
  {
    id: 'or-banca-7',
    q: md`Stima K-NN: come funziona? Disegna un grafico di esempio e descrivi la distribuzione stimata; che cosa significano overfitting e oversmoothing? Come funziona il classificatore K-NN, con un esempio? Quali sono le differenze con le finestre di Parzen?`,
    qEn: 'K-NN estimation: how does it work? Draw an example graph and describe the estimated distribution; what do overfitting and oversmoothing mean? How does the K-NN classifier work, with an example? What are the differences with Parzen windows?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'K-NN estimation, how does it works, we draw a graph for example and asked how is the distribution, what does it mean overfit and oversmooth. Then he asked how the K-NN classifier works and made an example. Last question what are the difference with parzen window',
    answer: md`**Come funziona.** Parto dalla stima non parametrica $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$. Nel K-NN fisso $K$ a priori e la forma della cella, un'ipersfera centrata in $\mathbf{x}^*$; espando la cella finché contiene $K$ campioni di training e misuro il volume $V_K(\mathbf{x}^*)$:

$$\hat{p}(\mathbf{x}^*) = \frac{K}{N V_K(\mathbf{x}^*)}$$

In 1-D la cella è l'intervallo di semiampiezza $r_K(x)$, la distanza dal $K$-esimo vicino, quindi $\hat{p}(x) = \frac{K}{2N r_K(x)}$.

**Esempio disegnato.** Campioni in $1, 2, 4, 7$, $N = 4$, $K = 2$. In $x = 3$ le distanze sono $1, 1, 2, 4$: $r_2 = 1$ e $\hat{p}(3) = \frac{2}{4\cdot 2} = 0.25$. In $x = 0$ le distanze sono $1, 2, 4, 7$: $r_2 = 2$ e $\hat{p}(0) = \frac{2}{4\cdot 4} = 0.125$. La curva è alta dove i campioni sono fitti e bassa dove sono radi; è continua ma con spigoli, e i cambi di pendenza cadono in genere lontano dai campioni. Le code scendono come $1/\vert x\vert$, quindi la stima non integra a 1: non è una densità vera.

**Overfitting e oversmoothing.** Con $K$ piccolo la cella è minuscola nelle zone dense: la stima diventa frastagliata e cattura anche le fluttuazioni casuali del training set (*overfitting*, varianza alta; con $K = 1$ ha un picco su ogni campione). Con $K$ grande la cella media su una regione ampia: stima piatta, perde la struttura locale (*oversmoothing*, underfitting, bias alto). $K$ è un iperparametro da scegliere per bilanciare bias e varianza. Per la consistenza in ogni punto di continuità servono $\lim_{N\to+\infty}K_N = +\infty$, che porta la varianza a zero, e $\lim_{N\to+\infty}K_N/N = 0$, che restringe la cella e spegne il bias; esempio $K_N = \sqrt{N}$.

**Classificatore K-NN.** Metto la stima dentro la regola di Bayes. Attorno a $\mathbf{x}$ prendo la cella con $K$ campioni di tutte le classi, di cui $K_i$ della classe $\omega_i$:

$$\hat{p}(\mathbf{x}|\omega_i) = \frac{K_i}{N_i V}, \qquad \hat{P}(\omega_i) = \frac{N_i}{N}, \qquad \hat{P}(\omega_i|\mathbf{x}) = \frac{\hat{p}(\mathbf{x}|\omega_i)\hat{P}(\omega_i)}{\hat{p}(\mathbf{x})} = \frac{K_i}{K}$$

Quindi assegno $\mathbf{x}$ alla classe più rappresentata tra i $K$ vicini (voto di maggioranza). Esempio: pesce con luminosità e larghezza, $K = 5$; tra i 5 vicini ci sono 3 salmoni e 2 spigole, lo classifico salmone con posterior stimata $3/5$. Con due classi scelgo $K$ dispari per evitare pareggi, e normalizzo le feature perché la distanza non sia dominata da una sola.

**Differenze con Parzen.** Parzen fissa il volume ($h$) e conta i campioni; il K-NN fissa il numero di campioni e lascia variare il volume. Il K-NN si adatta alla densità locale: celle piccole dove i dati sono fitti, grandi dove sono radi; Parzen usa la stessa finestra ovunque, che nelle zone rade può restare vuota e dare stima nulla. Con un kernel liscio Parzen dà una stima continua che integra a 1; il K-NN no. Le condizioni di consistenza sono diverse: $K_N \to +\infty$, $K_N/N \to 0$ contro $h_N \to 0$, $N h_N^n \to +\infty$. Entrambi tengono in memoria tutti i campioni e costano al momento della predizione.`,
    checklist: [
      md`formula $\hat{p} = K/(N V_K)$ con K fisso e volume che si adatta`,
      'grafico di esempio con i numeri e forma della stima (picchi, spigoli, code che non integrano a 1)',
      md`overfitting con $K$ piccolo, oversmoothing con $K$ grande, compromesso bias-varianza`,
      md`consistenza: $K_N \to +\infty$ e $K_N/N \to 0$, esempio $\sqrt{N}$`,
      md`classificatore: posterior stimata $K_i/K$ e voto di maggioranza con un esempio`,
      md`differenze con Parzen: volume fisso contro $K$ fisso, adattività, continuità, condizioni di consistenza`,
    ],
    followUps: [
      {
        q: md`Che cosa succede con $K = 1$?`,
        a: md`Nei punti di training il volume tende a zero e la stima esplode: una fila di picchi sui campioni. Il classificatore 1-NN assegna la classe del campione più vicino e ha errore nullo sul training set, segno di overfitting.`,
      },
      {
        q: md`Perché $K_N/N \to 0$ e non $K_N$ costante?`,
        a: md`Con $K$ costante la varianza non cala; con $K_N$ che cresce come $N$ la cella non si restringe e il bias resta. $K_N/N \to 0$ con $K_N \to +\infty$ ottiene entrambe le cose: la stima è asintoticamente non polarizzata con varianza che tende a zero, quindi consistente.`,
      },
    ],
  },

  // --- domande proprie -------------------------------------------------------------------------------
  {
    id: 'or-bonta-della-stima',
    q: md`Come si descrive la bontà di una stima? Definisci errore di stima, bias, varianza e stima ideale.`,
    qEn: 'How can we describe the goodness of an estimate? Define estimation error, bias, variance and ideal estimate.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**La stima è aleatoria.** La stima del vettore dei parametri dipende dal vettore delle osservazioni, $\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\mathbf{X})$. Se cambio il training set cambia la stima: $\hat{\boldsymbol{\theta}}$ è un vettore aleatorio. I valori attesi che seguono sono medie su tutti i training set possibili, generati da $p(\mathbf{X}|\boldsymbol{\theta})$ con $\boldsymbol{\theta}$ e $N$ fissati.

**Errore di stima.**

$$\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta} = \boldsymbol{\varepsilon}(\mathbf{X}, \boldsymbol{\theta}) = [\hat{\theta}_i - \theta_i : i = 1, 2, \ldots, r]$$

**Stima ideale.** Per ogni parametro $\theta_i$ l'errore $\varepsilon_i$ dovrebbe essere non polarizzato e senza varianza: $E\{\varepsilon_i\} = 0$ e $\operatorname{var}\{\varepsilon_i\} = 0$. In pratica le due cose insieme sono quasi impossibili, ma restano il riferimento con cui confronto i metodi.

**Bias.** È il valore medio dell'errore. La stima è non polarizzata (*unbiased*) se

$$E\{\boldsymbol{\varepsilon}\} = 0 \;\Longrightarrow\; E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$$

cioè in media lo stimatore dà il valore giusto. La freccia vale in entrambi i versi, perché $E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}$ e $\boldsymbol{\theta}$ è una costante.

**Varianza.**

$$\operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \bar{\hat{\theta}}_i)^2\} \qquad (i = 1, 2, \ldots, r)$$

Compare la media della stima, non il valore vero: la varianza dell'errore coincide con la varianza della stima e misura la dispersione attorno al suo centro. Se la stima è non polarizzata il centro è proprio $\theta_i$.

**Come le combino.** L'errore quadratico medio si scompone in $E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + (E\{\varepsilon_i\})^2$: bias e varianza sono le due voci dell'errore. Immagino il tiro al bersaglio: il bias è la distanza del centro dei colpi dal centro del bersaglio, la varianza è quanto i colpi sono sparsi.

**Esempio.** Con $N$ salmoni di luminosità gaussiana la media campionaria è non polarizzata con varianza $\sigma^2/N$; il primo campione $x_1$ è non polarizzato ma ha varianza $\sigma^2$; la costante $5$ ha varianza nulla ma bias $5 - m$. Nessuno dei tre è ideale; per dire se $\sigma^2/N$ è una varianza «buona» mi serve un riferimento, il bound di Cramér-Rao.`,
    checklist: [
      md`stima come vettore aleatorio $\hat{\boldsymbol{\theta}}(\mathbf{X})$`,
      md`definizione di $\boldsymbol{\varepsilon}$ per componenti`,
      'stima ideale: non polarizzata e senza varianza, come riferimento',
      md`bias e condizione $E\{\boldsymbol{\varepsilon}\} = 0 \Rightarrow E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$`,
      'varianza con la media della stima',
      md`valori attesi sui training set, con $\boldsymbol{\theta}$ e $N$ fissati`,
      'rimando al bound di Cramér-Rao per giudicare la varianza',
    ],
    followUps: [
      {
        q: 'Uno stimatore costante ha varianza nulla: è una buona stima?',
        a: md`No: il suo errore è tutto bias, $c - \theta$, e non cala con i dati. Mostra perché la stima ideale chiede entrambe le condizioni e perché il bound di Cramér-Rao si applica solo agli stimatori non polarizzati.`,
      },
      {
        q: md`Perché nella varianza c'è $\bar{\hat{\theta}}_i$ e non $\theta_i$?`,
        a: md`Perché è la varianza di $\varepsilon_i$: $\varepsilon_i - E\{\varepsilon_i\} = \hat{\theta}_i - \bar{\hat{\theta}}_i$, e $\theta_i$ si cancella. Con $\theta_i$ al posto della media si otterrebbe l'errore quadratico medio, che include il bias.`,
      },
      {
        q: md`Rispetto a che cosa si calcola $E\{\cdot\}$?`,
        a: md`Rispetto al training set $\mathbf{X}$, distribuito come $p(\mathbf{X}|\boldsymbol{\theta}) = \prod_k p(\mathbf{x}_k|\boldsymbol{\theta})$: $E\{\hat{\boldsymbol{\theta}}\} = \int\hat{\boldsymbol{\theta}}(\mathbf{X})\,p(\mathbf{X}|\boldsymbol{\theta})\,d\mathbf{X}$. $\boldsymbol{\theta}$ non è aleatorio.`,
      },
    ],
  },
  {
    id: 'or-cramer-rao',
    q: md`Enuncia il bound di Cramér-Rao. Che cos'è l'informazione di Fisher e quando uno stimatore è efficiente?`,
    qEn: 'State the Cramér-Rao bound. What is the Fisher information and when is an estimator efficient?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Enunciato.** Il bound di Cramér-Rao è un limite inferiore alla varianza di uno stimatore **non polarizzato**, basato sull'informazione di Fisher:

$$\operatorname{var}\{\varepsilon_i\} \geq [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}, \qquad i = 1, 2, \ldots, r$$

Serve a giudicare la varianza: da sola, $\operatorname{var}\{\varepsilon_i\}$ non mi dice se è grande o piccola.

**Matrice di Fisher.** In forma compatta e elemento per elemento:

$$\mathbf{I}(\boldsymbol{\theta}) = E\{\nabla_{\boldsymbol{\theta}}\ln[p(\mathbf{X}|\boldsymbol{\theta})]\,\nabla_{\boldsymbol{\theta}}\ln[p(\mathbf{X}|\boldsymbol{\theta})]^t\}, \qquad [\mathbf{I}(\boldsymbol{\theta})]_{ij} = E\left\{\frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial\theta_i}\cdot\frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial\theta_j}\right\}$$

È una matrice $r \times r$ simmetrica. Il gradiente della log-likelihood (lo score) dice quanto i dati «spingono» sul parametro; se la log-likelihood è appuntita attorno al massimo, i dati identificano bene $\boldsymbol{\theta}$, l'informazione è grande e il bound è piccolo. Con campioni iid la log-likelihood è una somma e l'informazione cresce come $N$: il bound scende come $1/N$.

**Il bound usa la diagonale dell'inversa.** Non l'inverso della diagonale: $[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii} \geq 1/[\mathbf{I}(\boldsymbol{\theta})]_{ii}$, con l'uguaglianza quando gli altri parametri non sono accoppiati a $\theta_i$. Stimare parametri accoppiati costa varianza. Con $r = 1$: $\operatorname{var}\{\varepsilon\} \geq 1/I(\theta)$.

**Efficienza.** Quando la varianza raggiunge il bound lo stimatore è efficiente: ha la varianza minima possibile tra gli stimatori non polarizzati.

**Esempio.** Media di una gaussiana con $\sigma$ nota: lo score è $\frac{1}{\sigma^2}\sum_k(x_k - m)$, $I(m) = N/\sigma^2$, bound $\sigma^2/N$. La media campionaria è non polarizzata con varianza $\sigma^2/N$: è efficiente. Con $\sigma = 2$ e $N = 100$ salmoni nessuno stimatore non polarizzato scende sotto una deviazione standard di $0.2$.

**Ipotesi.** Stimatore non polarizzato, condizioni di regolarità su $p(\mathbf{X}|\boldsymbol{\theta})$ (supporto che non dipende da $\boldsymbol{\theta}$, scambio tra derivata e integrale), matrice invertibile. Uno stimatore polarizzato può stare sotto il bound; con l'uniforme su $[0, \theta]$ cade la regolarità e anche uno stimatore non polarizzato lo viola.`,
    checklist: [
      md`enunciato con $[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}$ e la parola «unbiased»`,
      'matrice di Fisher in forma compatta ed elemento per elemento',
      'intuizione: log-likelihood appuntita, più informazione, bound più basso',
      'diagonale dell\'inversa e non inverso della diagonale',
      'definizione di stimatore efficiente',
      md`esempio: $I(m) = N/\sigma^2$, bound $\sigma^2/N$, media campionaria efficiente`,
      'ipotesi: assenza di bias e regolarità',
    ],
    followUps: [
      {
        q: 'Uno stimatore efficiente esiste sempre?',
        a: md`No. Per il tasso $\lambda$ di un'esponenziale nessuno stimatore non polarizzato raggiunge $\lambda^2/N$ a $N$ finito; per il tempo medio $\tau = 1/\lambda$ invece la media campionaria è efficiente. Dipende anche dalla parametrizzazione.`,
      },
      {
        q: md`Che cosa succede al bound se raddoppio $N$?`,
        a: md`Con campioni iid $\mathbf{I}_N(\boldsymbol{\theta}) = N\,\mathbf{I}_1(\boldsymbol{\theta})$, quindi il bound si dimezza e la deviazione standard minima si riduce di $\sqrt{2}$.`,
      },
      {
        q: 'Esiste una forma equivalente dell\'informazione di Fisher?',
        a: md`Sotto le condizioni di regolarità $I(\theta) = -E\left\{\frac{\partial^2\ln p(\mathbf{X}|\theta)}{\partial\theta^2}\right\}$: la curvatura media della log-likelihood nel valore vero.`,
      },
    ],
  },
  {
    id: 'or-proprieta-asintotiche',
    q: md`Quali sono le proprietà asintotiche di uno stimatore? Scrivi le tre definizioni e la condizione per la consistenza.`,
    qEn: 'What are the asymptotic properties of an estimator? Write the three definitions and the condition for consistency.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Perché servono.** Nei problemi reali le stime vengono spesso da stimatori polarizzati e inefficienti, e la qualità dipende da quanti campioni ho e da quanto sono buoni. Per valutare e confrontare gli stimatori studio il loro comportamento con insiemi di osservazioni grandi, $N \to +\infty$: uno stimatore è buono se ha buone proprietà asintotiche.

**Asintoticamente non polarizzato** (*asymptotically unbiased*):

$$\lim_{N\to+\infty}E\{\boldsymbol{\varepsilon}\} = \mathbf{0} \;\Longrightarrow\; \lim_{N\to+\infty}E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$$

**Asintoticamente efficiente** (*asymptotically efficient*):

$$\lim_{N\to+\infty}\frac{\operatorname{var}\{\varepsilon_i\}}{[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1, \qquad i = 1, 2, \ldots, r$$

Varianza e bound tendono entrambi a zero; conta che il loro rapporto tenda a 1.

**Consistente** (*consistent*): la stima converge al valore vero,

$$\lim_{N\to+\infty}P\{\Vert\boldsymbol{\varepsilon}\Vert < \delta\} = 1 \qquad \forall\delta > 0$$

La leggo così: fisso una tolleranza $\delta$, piccola quanto voglio; la probabilità che la stima cada entro $\delta$ dal vero tende a 1. È la convergenza in probabilità.

**Condizione.** Le slide danno come condizione necessaria per la consistenza che la stima sia asintoticamente non polarizzata e con varianza che tende a zero. Con la disuguaglianza di Chebyshev si vede che le due condizioni bastano: $P\{\vert\varepsilon_i\vert \geq \delta\} \leq \frac{E\{\varepsilon_i^2\}}{\delta^2} = \frac{\operatorname{var}\{\varepsilon_i\} + (E\{\varepsilon_i\})^2}{\delta^2} \to 0$.

**Legami.** Non polarizzato implica asintoticamente non polarizzato; efficiente implica asintoticamente efficiente. Il viceversa non vale: la stima ML della varianza ha media $\frac{N-1}{N}\sigma^2$, polarizzata ma asintoticamente no. Il primo campione $x_1$ è non polarizzato ma non consistente, perché la sua varianza non cala; $\bar{x} + c$ ha varianza che va a zero ma non è consistente, perché il bias $c$ resta.

**Esempio numerico.** Media campionaria con $\sigma = 2$ e $\delta = 0.5$: $P\{\vert\varepsilon\vert < 0.5\} = 2\Phi(0.25\sqrt{N}) - 1$, che vale circa $0.74$ con $N = 20$ e $0.99$ con $N = 110$. Queste proprietà danno fiducia nell'affidabilità degli stimatori sui grandi dataset.`,
    checklist: [
      'motivazione: stimatori reali polarizzati e inefficienti, numero e qualità dei campioni',
      'definizione di asintoticamente non polarizzato',
      'definizione di asintoticamente efficiente con il rapporto',
      md`definizione di consistenza con $\forall\delta > 0$`,
      'condizione: bias e varianza che tendono a zero (Chebyshev)',
      'legami e controesempi',
    ],
    followUps: [
      {
        q: 'Le due condizioni della slide sono davvero necessarie?',
        a: md`Sono sufficienti, e sono quelle che si usano in pratica. In senso stretto non sono necessarie: uno stimatore che vale $\bar{x}$ con probabilità $1 - 1/N$ e $N^2$ con probabilità $1/N$ è consistente ma ha valore atteso divergente. All'orale riporto la formulazione del docente.`,
      },
      {
        q: 'Uno stimatore asintoticamente efficiente è anche consistente?',
        a: md`Se è anche asintoticamente non polarizzato sì: con campioni iid il bound scende come $1/N$, la varianza lo segue e va a zero, quindi vale la condizione di consistenza.`,
      },
    ],
  },
  {
    id: 'or-proprieta-ml',
    q: md`Definisci la stima a massima verosimiglianza e discuti le sue proprietà. Perché è così usata?`,
    qEn: 'Define maximum likelihood estimation and discuss its properties. Why is it so widely used?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Definizione.** La stima ML del vettore dei parametri è

$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}}p(\mathbf{X}|\boldsymbol{\theta}) = \arg\max_{\boldsymbol{\theta}}\ln p(\mathbf{X}|\boldsymbol{\theta})$$

Variando $\boldsymbol{\theta}$ ottengo pdf diverse, ognuna con un valore di likelihood sui campioni osservati; la stima ML è il valore di $\boldsymbol{\theta}$ che meglio si accorda con i campioni. Il logaritmo non sposta il massimo, perché è monotono crescente, e trasforma i prodotti in somme.

**Esempio della slide.** Gaussiana 1-D con varianza nota e una sola osservazione $x_0$. Faccio scorrere la gaussiana lungo l'asse («ML search») e guardo il valore della sua densità in $x_0$: è massimo quando la gaussiana è centrata su $x_0$. Infatti $\frac{\partial}{\partial m}\ln p(x_0|m) = \frac{x_0 - m}{\sigma^2} = 0$ dà $\hat{m} = x_0$. Questa stima è non polarizzata e ha varianza $\sigma^2$, uguale al bound con $N = 1$: è efficiente.

**Proprietà.** Sotto certe ipotesi su $p(\mathbf{x}|\boldsymbol{\theta})$ (condizioni di regolarità), se esiste uno stimatore efficiente e la stima ML è non polarizzata, lo stimatore efficiente è quello ML. Anche se uno stimatore efficiente non esiste, la stima ML ha buone proprietà asintotiche:

- asintoticamente non polarizzata: $\lim_{N\to+\infty}E\{\hat{\boldsymbol{\theta}}_{ML}\} = \boldsymbol{\theta}$;
- asintoticamente efficiente: $\lim_{N\to+\infty}\frac{\operatorname{var}\{\varepsilon_i\}}{[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1$;
- consistente: $\lim_{N\to+\infty}P\{\Vert\hat{\boldsymbol{\theta}}_{ML} - \boldsymbol{\theta}\Vert < \delta\} = 1$ per ogni $\delta > 0$.

Queste proprietà spiegano perché la ML si usa in tanti problemi reali: con abbastanza dati nessuno stimatore non polarizzato fa meglio, e il calcolo si riduce spesso ad annullare una derivata.

**Esempio asintotico.** Tempi tra anomalie esponenziali di tasso $\lambda$: $\hat{\lambda}_{ML} = N/\sum_k x_k$ ha media $\frac{N}{N-1}\lambda$ e varianza sopra il bound $\lambda^2/N$, ma bias e rapporto con il bound tendono a 0 e a 1. Per il tempo medio $\tau = 1/\lambda$ la ML è la media dei tempi, non polarizzata ed efficiente.

**Limiti.** A $N$ finito la ML può essere polarizzata (la varianza di una gaussiana, il massimo per l'uniforme) e le proprietà valgono se il modello scelto per $p(\mathbf{x})$ è corretto: se è sbagliato non c'è un valore vero a cui convergere. Per questo la scelta del modello viene prima della stima.`,
    checklist: [
      'definizione con argmax della likelihood e della log-likelihood',
      'interpretazione: la pdf della famiglia che meglio spiega i campioni',
      md`esempio della singola osservazione: $\hat{m} = x_0$, efficiente`,
      'teorema: stimatore efficiente esistente e ML non polarizzata, allora è la ML',
      'tre proprietà asintotiche della ML con le formule',
      'perché è così usata',
      'limiti: bias a N finito e modello corretto',
    ],
    followUps: [
      {
        q: 'Perché nell\'enunciato del teorema serve «la stima ML è non polarizzata»?',
        a: md`Per escludere i casi in cui il massimo cade sul bordo dello spazio dei parametri. Con il vincolo $m \geq 0$ sulla media la stima ML diventa $\max(\bar{x}, 0)$: è polarizzata e non coincide con lo stimatore efficiente $\bar{x}$.`,
      },
      {
        q: 'La stima ML si trova sempre annullando la derivata?',
        a: md`No. Per l'uniforme su $[0, \theta]$ la likelihood $\theta^{-N}$ decresce per $\theta \geq \max_k x_k$ e il massimo sta sul bordo: $\hat{\theta}_{ML} = \max_k x_k$.`,
      },
    ],
  },
  {
    id: 'or-ml-contro-bayes',
    q: md`Che differenza c'è tra la stima a massima verosimiglianza e la stima bayesiana? Come si sceglie tra le due?`,
    qEn: 'What is the difference between maximum likelihood estimation and Bayesian estimation? How do we choose between them?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Natura dei parametri.** Nella ML $\boldsymbol{\theta}$ è un insieme di quantità fisse ma ignote, una costante da stimare. Nella stima bayesiana $\boldsymbol{\theta}$ è una variabile aleatoria con una distribuzione a priori nota $p(\boldsymbol{\theta})$, che esprime l'incertezza e la conoscenza che ho prima dei dati.

**Obiettivo.** La ML ottimizza una funzione di costo, o obiettivo, basata solo sui dati osservati: cerca il $\boldsymbol{\theta}$ che massimizza la likelihood $p(\mathbf{X}|\boldsymbol{\theta})$ e restituisce un punto. La stima bayesiana combina l'informazione dei campioni con la prior tramite il teorema di Bayes,

$$p(\boldsymbol{\theta}|\mathbf{X}) = \frac{p(\mathbf{X}|\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\int p(\mathbf{X}|\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,d\boldsymbol{\theta}}$$

e restituisce una densità a posteriori, una descrizione probabilistica completa dell'incertezza sul parametro.

**Esempio.** Luminosità media dei salmoni con $\sigma^2$ nota e prior $N(\mu_0, \sigma_0^2)$. La ML dà $\bar{x}$. La posterior è $N(\mu_N, \sigma_N^2)$ con $\mu_N = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\bar{x} + \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\mu_0$: una media pesata tra dati e prior, che con pochi campioni resta vicina a $\mu_0$.

**Come scelgo.** In base al contesto e ai dati disponibili. La ML ha complessità di calcolo più bassa e dà un solo valore, facile da interpretare. La bayesiana incorpora conoscenza a priori o il parere di un esperto, utile con pochi dati, e quantifica l'incertezza (per esempio con intervalli di credibilità).

**Quando coincidono.** Con infiniti campioni le soluzioni diventano equivalenti e convergono entrambe al valore vero; con una prior uniforme la soluzione bayesiana si riduce a quella ML.

**Legame con la bontà degli stimatori.** Le proprietà di questo capitolo (bias, varianza, Cramér-Rao, consistenza) trattano $\boldsymbol{\theta}$ come fisso e fanno la media sui training set: è il punto di vista della ML.`,
    checklist: [
      'natura dei parametri: costante ignota contro variabile aleatoria con prior nota',
      'obiettivo: ottimizzazione sui soli dati contro posterior che combina dati e prior',
      'formula di Bayes per la posterior',
      'esempio gaussiano con media a posteriori pesata',
      'criteri di scelta: costo e interpretabilità contro prior e incertezza',
      'coincidenza: N infinito e prior uniforme',
    ],
    followUps: [
      {
        q: 'Con pochi dati quale preferisci?',
        a: md`La bayesiana, se ho una prior affidabile: con $N$ piccolo $\mu_N$ resta vicino a $\mu_0$ e la stima non si lascia trascinare da pochi campioni rumorosi. Con una prior sbagliata però introduco un bias.`,
      },
      {
        q: 'Perché la ML costa meno?',
        a: 'Richiede di massimizzare una funzione, spesso annullando una derivata; la stima bayesiana richiede di calcolare e integrare intere distribuzioni (la costante di normalizzazione della posterior e la densità predittiva).',
      },
    ],
  },
  {
    id: 'or-sotto-il-bound',
    q: md`Uno stimatore può avere varianza più piccola del bound di Cramér-Rao? Discuti con degli esempi.`,
    qEn: 'Can an estimator have a variance smaller than the Cramér-Rao bound? Discuss with examples.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Sì, se non rispetta le ipotesi del bound.** La slide dice che il bound è un limite inferiore alla varianza degli stimatori **non polarizzati**, e la dimostrazione usa anche condizioni di regolarità sul modello.

**Stimatori polarizzati.** Lo stimatore costante $\hat{\theta} = c$ ha varianza zero, sotto qualunque bound, ma il suo errore quadratico medio è $(c - \theta)^2$. La ridge per il sovrapprezzo per stanza, $\hat{\theta}_\lambda = \frac{\sum_k x_k y_k}{S + \lambda}$, restringe la stima ai minimi quadrati di un fattore $\frac{S}{S + \lambda}$: ha bias $-\frac{\lambda\theta}{S + \lambda}$ e varianza $\frac{\sigma^2 S}{(S + \lambda)^2} < \frac{\sigma^2}{S}$. Per uno stimatore con bias $b(\theta)$ il limite corretto è $\frac{(1 + \partial b/\partial\theta)^2}{I(\theta)}$, e la ridge lo raggiunge. Anche la stima ML della varianza gaussiana ha rapporto varianza/bound $\frac{N-1}{N} < 1$: è polarizzata, nessuna violazione.

**Perché usarli.** Conta l'errore quadratico medio, $E\{\varepsilon^2\} = \operatorname{var}\{\varepsilon\} + (E\{\varepsilon\})^2$. Con pochi dati e molto rumore un piccolo bias può ridurre molto la varianza e far sbagliare meno. Le slide lo dicono: nei problemi reali si usano spesso stimatori polarizzati e inefficienti, e li si giudica con le proprietà asintotiche. Nella ridge con $\lambda^* = \sigma^2/\theta^2$ l'errore quadratico medio è $\frac{\sigma^2}{S + \lambda^*}$, sotto il bound; al crescere di $N$ il vantaggio svanisce.

**Regolarità che cade.** Letture uniformi su $[0, \theta]$: lo stimatore $\frac{N+1}{N}\max_k x_k$ è non polarizzato con varianza $\frac{\theta^2}{N(N+2)}$, sotto il bound formale $\frac{\theta^2}{N^2}$. Il supporto dipende da $\theta$, lo score vale sempre $-N/\theta$ e non ha media nulla: la dimostrazione del bound non si applica.

**Conclusione.** Il bound è un pavimento solo per gli stimatori non polarizzati di un modello regolare. Sotto il pavimento si può andare pagando in bias, oppure quando il modello non è regolare.`,
    checklist: [
      'il bound vale per stimatori non polarizzati e modelli regolari',
      'stimatore costante: varianza nulla, errore tutto bias',
      'ridge: bias, varianza sotto il bound, forma del bound per stimatori polarizzati',
      'errore quadratico medio come criterio e compromesso bias-varianza',
      md`uniforme su $[0, \theta]$: regolarità violata, stimatore non polarizzato sotto il bound formale`,
    ],
    followUps: [
      {
        q: 'Allora il bound è inutile per gli stimatori polarizzati?',
        a: md`Serve come riferimento asintotico: se il bias tende a zero, il rapporto tra varianza e bound deve tendere a 1 perché lo stimatore sia asintoticamente efficiente. La ML, spesso polarizzata a $N$ finito, lo è.`,
      },
      {
        q: 'Che cosa sono le condizioni di regolarità?',
        a: md`Supporto di $p(\mathbf{X}|\boldsymbol{\theta})$ indipendente da $\boldsymbol{\theta}$, derivabilità, possibilità di scambiare derivata e integrale. Garantiscono che lo score abbia media nulla, passaggio chiave della dimostrazione.`,
      },
    ],
  },
  {
    id: 'or-scelta-del-modello',
    q: md`Come si sceglie il modello statistico per $p(\mathbf{x})$? Quali sono i modelli più usati?`,
    qEn: 'How do we select the statistical model for p(x)? Which are the most popular models?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Tre aspetti.** Nella scelta del modello statistico per $p(\mathbf{x})$ considero:

1. la natura statistica intrinseca del fenomeno fisico che analizzo: capire come nasce il dato orienta la famiglia di distribuzioni;
2. il rumore introdotto nelle fasi di trasmissione e acquisizione del segnale, dal mezzo di propagazione (passivo) e dal sensore (attivo): cambia la distribuzione osservata;
3. il pre-processing e l'estrazione delle feature fatti prima del sistema di riconoscimento: una trasformazione logaritmica o una media su molti valori cambiano la statistica del dato.

**Modelli più usati**, con l'uso tipico indicato nelle note:

- gaussiano (*Gaussian*): dati con distribuzione normale;
- gaussiano generalizzato (*Generalized Gaussian*): alternativa flessibile, un parametro di forma che va da distribuzioni appuntite a quasi piatte;
- Gamma: dati continui non negativi, teoria delle code;
- Rayleigh: radar e comunicazioni, segnali diffusi;
- Chi-quadrato (*Chi-square*): test di ipotesi e bontà di adattamento;
- Log-Normale (*Log-Normal*): variabili con asimmetria positiva, come i dati finanziari.

**Esempi.** La luminosità dei salmoni misurata dalla telecamera è ben descritta da una gaussiana. L'ampiezza di un'eco radar diffusa segue una Rayleigh: conta la natura del fenomeno, ma anche il sensore attivo. Se sullo stesso dato radar applico un logaritmo e medio molti pixel, la statistica si avvicina a una gaussiana: è l'effetto del pre-processing.

**Perché conta.** La stima parametrica stima i parametri di una famiglia scelta prima. Le buone proprietà della ML (asintoticamente non polarizzata, efficiente, consistente) presuppongono che il modello sia corretto: con un modello sbagliato non c'è un valore vero dei parametri a cui convergere. Scegliere bene il modello serve a catturare il processo che genera i dati e a rendere efficace l'analisi.`,
    checklist: [
      'natura statistica intrinseca del fenomeno',
      'rumore di trasmissione e acquisizione: mezzo passivo e sensore attivo',
      'pre-processing ed estrazione delle feature',
      'sei modelli con l\'uso tipico',
      'esempi concreti per ogni aspetto',
      'perché la scelta viene prima della stima',
    ],
    followUps: [
      {
        q: 'Perché una media su molti pixel porta verso la gaussiana?',
        a: 'Per il teorema del limite centrale: la somma, o la media, di molte variabili indipendenti tende a una distribuzione gaussiana qualunque sia la distribuzione di partenza.',
      },
      {
        q: 'Che cosa succede alla stima ML se il modello è sbagliato?',
        a: 'La stima converge al parametro della famiglia scelta più vicino ai dati, ma quel parametro non descrive il fenomeno: le proprietà asintotiche perdono il loro significato di convergenza al valore vero.',
      },
    ],
  },
  {
    id: 'or-covarianza-ml',
    q: md`La stima ML della matrice di covarianza di una gaussiana è non polarizzata? Che proprietà ha e come la si corregge?`,
    qEn: 'Is the ML estimate of the covariance matrix of a Gaussian unbiased? What properties does it have and how can it be corrected?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Le stime ML.** Con $N$ campioni iid di una gaussiana multivariata:

$$\hat{\mathbf{m}} = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k, \qquad \hat{\Sigma} = \frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^t - \hat{\mathbf{m}}\hat{\mathbf{m}}^t$$

**Bias.** $E\{\hat{\mathbf{m}}\} = \mathbf{m}$, ma $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$: la covarianza stimata è polarizzata e in media troppo piccola. Nel caso 1-D lo vedo così: $\sum_k(x_k - \hat{m})^2 = \sum_k(x_k - m)^2 - N(\hat{m} - m)^2$, e passando ai valori attesi $N\sigma^2 - \sigma^2 = (N-1)\sigma^2$. Gli scarti dalla media stimata sono più piccoli degli scarti dalla media vera, perché $\hat{m}$ è calcolata proprio su quei campioni: si perde un grado di libertà.

**Proprietà.** Il bias $-\frac{1}{N}\Sigma$ tende a zero: la stima è asintoticamente non polarizzata. È anche asintoticamente efficiente (per la varianza 1-D il rapporto con il bound è $\frac{N-1}{N} \to 1$) e consistente. Sono le proprietà che le note attribuiscono a ogni stima ML.

**Correzione.** Per un campione piccolo uso lo stimatore non polarizzato elementare, moltiplicando per $\frac{N}{N-1}$:

$$\hat{\Sigma} = \frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$$

**Esempio.** Con $N = 5$ letture di un sensore e varianza vera $4$, la stima ML vale in media $3.2$: sottostima del $20\%$. Con $N = 100$ la sottostima scende all'$1\%$ e la differenza tra le due formule diventa trascurabile.`,
    checklist: [
      'formule ML di media e covarianza',
      md`$E\{\hat{\mathbf{m}}\} = \mathbf{m}$ ed $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$`,
      'spiegazione del grado di libertà perso',
      'proprietà asintotiche: non polarizzata, efficiente, consistente',
      md`correzione con $\frac{1}{N-1}$`,
      'esempio numerico',
    ],
    followUps: [
      {
        q: md`Lo stimatore corretto con $\frac{1}{N-1}$ è efficiente?`,
        a: md`No a $N$ finito: nel caso 1-D ha varianza $\frac{2\sigma^4}{N-1}$, sopra il bound $\frac{2\sigma^4}{N}$. Il rapporto $\frac{N}{N-1}$ tende a 1, quindi è asintoticamente efficiente.`,
      },
      {
        q: 'Se conoscessi la media vera, servirebbe la correzione?',
        a: md`No: $\frac{1}{N}\sum_k(x_k - m)^2$ ha media esattamente $\sigma^2$. Il bias nasce dall'aver stimato $m$ con gli stessi campioni.`,
      },
    ],
  },
]
