// Domande d'orale del modulo m03 (stima statistica: introduzione, stima di pdf, stima parametrica e verosimiglianza).
// Prima le dieci domande della banca d'esame collegate a queste pagine (testo verbatim in bankText), poi nove domande
// sulle parti più chieste da Melgani. Le risposte sono in prima persona, come le direbbe lo studente.
import { md } from '../../types'
import type { ExamQuestion } from '../../types'

export const exam: ExamQuestion[] = [
  // --- banca d'esame ---------------------------------------------------------------------------------
  {
    id: 'or-banca-1',
    q: md`Qual è la formula della verosimiglianza (*Maximum Likelihood*), perché si può scrivere come prodotto delle probabilità dei singoli campioni e che cosa descrive? Come si giudica la bontà di una stima e la stima a massima verosimiglianza è un buon stimatore? È migliore o peggiore della stima bayesiana, e perché? Applica la stima ML a un esercizio. Infine: in quale caso ML e stima bayesiana coincidono?`,
    qEn: 'What is the Maximum Likelihood formula, why can we use the product of the separate probabilities, and what does the likelihood describe? How can we describe the goodness of an estimate, and is Maximum Likelihood Estimation a good estimator? Is it better or worse than Bayesian Estimation, and why? Apply Maximum Likelihood estimation to an exercise. In which case are ML and Bayesian estimation the same?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'What is the formula of Maximum Likelihood, why we can use the separate products of the probabilities and what the Likelihood describe. How we can describe the goodness of an estimation and Is Maximum Likelihood Estimation a good estimator? Is it better or not with respect to the Bayesian Estimation? Why? Then he asked me to apply Maximum Likelihood estimation on an exercise. Last question was: In which case ML and Bayesian are the same?',
    answer: md`**Impostazione.** Ho un vettore di $n$ feature $\mathbf{x} = (x_1, \dots, x_n)$ con pdf incognita $p(\mathbf{x})$ e un insieme di training $\mathbf{X} = \{\mathbf{x}_1, \dots, \mathbf{x}_N\}$ di $N$ campioni iid. Nella stima parametrica conosco la forma del modello e mi resta da stimare il vettore dei parametri $\boldsymbol{\theta} = (\theta_1, \dots, \theta_r)$; scrivo $p(\mathbf{x}\mid\boldsymbol{\theta})$ per sottolineare che il modello dipende da $\boldsymbol{\theta}$.

**Formula.** La funzione di verosimiglianza (*likelihood function*) è

$$p(\mathbf{X}\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})$$

e la stima a massima verosimiglianza ne prende il massimo: $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X}\mid\boldsymbol{\theta})$. Nei conti massimizzo il logaritmo, $l(\boldsymbol{\theta}) = \sum_{k=1}^{N} \ln p(\mathbf{x}_k\mid\boldsymbol{\theta})$: il logaritmo è monotono crescente e non sposta il massimo, trasforma il prodotto in somma ed evita numeri minuscoli. Nell'esempio della slide, con 12 campioni, la verosimiglianza nel massimo vale circa $1.5\times 10^{-7}$ e il suo logaritmo circa $-15.7$.

**Perché il prodotto.** $p(\mathbf{X}\mid\boldsymbol{\theta})$ è la densità congiunta $p(\mathbf{x}_1, \dots, \mathbf{x}_N\mid\boldsymbol{\theta})$. Per $\boldsymbol{\theta}$ fissato i campioni sono indipendenti, quindi la congiunta si fattorizza nel prodotto delle marginali; sono identicamente distribuiti, quindi ogni marginale è la stessa funzione $p(\cdot\mid\boldsymbol{\theta})$ calcolata nel proprio $\mathbf{x}_k$. Con due campioni dipendenti la regola della catena lascerebbe $p(\mathbf{x}_2\mid\mathbf{x}_1, \boldsymbol{\theta})$ e il prodotto delle marginali non sarebbe più la congiunta. Nei dati reali l'ipotesi iid vale di rado, ma la assumo per semplificare i calcoli.

**Che cosa descrive.** È una misura di compatibilità (*compatibility/agreement*) tra $\boldsymbol{\theta}$ e i campioni $\mathbf{X}$: dice quanto bene il modello con quei parametri spiega il training set. Come funzione di $\boldsymbol{\theta}$ non è una densità (la sua area non vale 1) e non è la probabilità che $\boldsymbol{\theta}$ sia quello vero. La stima ML tratta $\boldsymbol{\theta}$ come fisso ma incognito e sceglie il valore che massimizza la probabilità di ottenere i campioni osservati.

**Bontà di una stima.** $\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\mathbf{X})$ dipende dai campioni, quindi è un vettore aleatorio. Definisco l'errore di stima $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$; la stima ideale ha errore non polarizzato e senza varianza. Non polarizzazione: $E\{\boldsymbol{\varepsilon}\} = 0 \Rightarrow E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$. Varianza: $\operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \overline{\hat{\theta}}_i)^2\}$. Per uno stimatore non polarizzato la varianza ha un pavimento, il bound di Cramér-Rao:

$$\operatorname{var}\{\varepsilon_i\} \ge \left[\mathbf{I}^{-1}(\boldsymbol{\theta})\right]_{ii},\qquad \mathbf{I}(\boldsymbol{\theta}) = E\left\{\nabla_{\boldsymbol{\theta}}\ln p(\mathbf{X}\mid\boldsymbol{\theta})\;\nabla_{\boldsymbol{\theta}}\ln p(\mathbf{X}\mid\boldsymbol{\theta})^{t}\right\}$$

Se lo raggiunge lo stimatore è efficiente. Gli stimatori reali sono spesso polarizzati e inefficienti, perciò guardo il comportamento per $N \to +\infty$: non polarizzazione asintotica, efficienza asintotica e consistenza, $\lim_{N\to+\infty} P\{\lVert\boldsymbol{\varepsilon}\rVert < \delta\} = 1$ per ogni $\delta > 0$. Per la consistenza servono bias asintotico nullo e varianza che tende a zero.

**La ML è un buon stimatore?** Sì. Sotto certe ipotesi su $p(\mathbf{x}\mid\boldsymbol{\theta})$ (slide 19), se esiste uno stimatore efficiente e la stima ML è non polarizzata, lo stimatore efficiente è proprio quello ML. Anche quando non esiste, la ML è asintoticamente non polarizzata, asintoticamente efficiente e consistente. A $N$ finito può essere polarizzata: la varianza ML di una gaussiana divide per $N$ e ha media $\frac{N-1}{N}\sigma^2$.

**ML contro stima bayesiana.** Nella stima bayesiana $\boldsymbol{\theta}$ è una variabile aleatoria con una distribuzione a priori $p(\boldsymbol{\theta})$ nota; i campioni la trasformano in una densità a posteriori con il teorema di Bayes, $p(\boldsymbol{\theta}\mid\mathbf{X}) \propto p(\mathbf{X}\mid\boldsymbol{\theta})\,p(\boldsymbol{\theta})$. La ML ottimizza una funzione obiettivo che dipende solo dai dati e restituisce un punto; la bayesiana aggiunge la conoscenza a priori e restituisce una descrizione completa dell'incertezza sul parametro. Nessuna vince sempre: con pochi campioni e un prior affidabile la bayesiana stima meglio, con un prior sbagliato ne paga il costo. In pratica si preferisce spesso la ML perché costa meno calcolo ed è più facile da interpretare.

**Esercizio.** Campioni gaussiani 1-D con $\sigma$ nota e media $\theta$ incognita:

$$l(\theta) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k - \theta)^2,\qquad \frac{dl}{d\theta} = \frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k - \theta) = 0 \;\Rightarrow\; \hat{\theta} = \frac{1}{N}\sum_{k=1}^{N} x_k$$

La derivata seconda vale $-N/\sigma^2$, negativa: è un massimo. Con i 12 campioni della slide e $\sigma = 1$ trovo $\hat{\theta} = 37.55/12 = 3.13$. La media campionaria è non polarizzata e ha varianza $\sigma^2/N$; l'informazione di Fisher vale $I(\theta) = N/\sigma^2$, quindi la varianza coincide con il bound: lo stimatore è efficiente.

**Quando coincidono.** Nel limite di infiniti campioni di training, oppure se il prior $p(\boldsymbol{\theta})$ è uniforme. Con prior costante il posterior è proporzionale alla verosimiglianza e ha lo stesso massimo. Con $N \to +\infty$ la verosimiglianza diventa un picco stretto, largo $\sigma/\sqrt{N}$ nell'esempio gaussiano, che schiaccia qualunque prior non nullo attorno al valore vero. Una precisazione: con prior uniforme coincide la stima del parametro, ma la densità bayesiana $p(x\mid\mathbf{X}) = \mathcal{N}\left(\bar{x}, \sigma^2(1 + 1/N)\right)$ resta più larga di $\mathcal{N}(\bar{x}, \sigma^2)$ finché $N$ è finito.`,
    checklist: [
      md`formula $p(\mathbf{X}\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})$ con gli estremi della produttoria e la stima $\arg\max$`,
      md`prodotto giustificato con indipendenza (a $\boldsymbol{\theta}$ fissato) e identica distribuzione`,
      md`la verosimiglianza misura la compatibilità tra $\boldsymbol{\theta}$ e $\mathbf{X}$ e non è una densità in $\boldsymbol{\theta}$`,
      md`bontà: stima aleatoria, errore di stima, bias, varianza, Cramér-Rao con Fisher, efficienza`,
      md`proprietà della ML: sotto certe ipotesi su $p(\mathbf{x}\mid\boldsymbol{\theta})$, se esiste uno stimatore efficiente e la ML è non polarizzata, è quello ML; asintoticamente non polarizzata ed efficiente, consistente`,
      md`confronto con la stima bayesiana: $\boldsymbol{\theta}$ fisso contro aleatorio, prior e posterior, punto contro distribuzione`,
      md`esercizio svolto: derivata della log-verosimiglianza gaussiana, $\hat{\theta} = \bar{x}$`,
      md`coincidenza per $N \to +\infty$ oppure con prior uniforme`,
    ],
    followUps: [
      { q: md`Perché si massimizza il logaritmo della verosimiglianza e non la verosimiglianza stessa?`, a: md`Il logaritmo è monotono crescente, quindi ha lo stesso $\arg\max$. In più trasforma il prodotto in una somma, più facile da derivare, e porta valori come $10^{-7}$ o $10^{-300}$ su numeri trattabili, evitando underflow e overflow.` },
      { q: md`Con dati continui la probabilità di osservare esattamente quei campioni è zero. Che cosa massimizza allora la ML?`, a: md`La densità congiunta. Se prendo una cella di volume $\Delta$ attorno a ogni campione, la probabilità di cadere nelle celle vale circa $p(\mathbf{X}\mid\boldsymbol{\theta})\,\Delta^N$; il fattore $\Delta^N$ non dipende da $\boldsymbol{\theta}$, quindi massimizzare quella probabilità equivale a massimizzare $p(\mathbf{X}\mid\boldsymbol{\theta})$.` },
      { q: md`Uno stimatore con varianza nulla è per forza buono?`, a: md`No. $\hat{\theta} = c$ costante ha varianza nulla ma bias $c - \theta$. L'errore quadratico medio si scompone in $E\{\varepsilon^2\} = \operatorname{var}\{\varepsilon\} + (E\{\varepsilon\})^2$ e servono entrambi i termini piccoli; il bound di Cramér-Rao vale solo per stimatori non polarizzati.` },
    ],
  },
  {
    id: 'or-banca-2',
    q: md`Spiega la stima non parametrica: che cosa vuol dire non parametrico e perché la usiamo. Spiega il K-NN e le finestre di Parzen: tendono alla soluzione ottima? Spiega la stima a massima verosimiglianza, sviluppa la derivata prima per una gaussiana e spiega il significato del risultato. Infine spiega il classificatore a box (*box classifier*).`,
    qEn: 'Explain non-parametric estimation: what non-parametric means and why we use it. Explain both K-NN and Parzen windows: do they tend to the optimal solution? Explain ML estimation, develop the first derivative for a Gaussian and explain the meaning of the result. Finally, explain the box classifier.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Explain non-parametric estimation, what non-parametric means and why we use it, explain both KNN and Parzen windows, do they tend to the optimal solution? Explain ML estimation, develop the first derivative for a gaussian and explain the meaning of the result. Explain box classifier',
    answer: md`**Che cosa vuol dire non parametrico.** Il problema resta lo stesso: da $N$ campioni iid voglio una stima $\hat{p}(\mathbf{x})$ il più vicina possibile alla pdf vera. Nell'approccio parametrico conosco la forma della densità (gaussiana, Gamma, Rayleigh) e stimo solo il vettore $\boldsymbol{\theta}$. Nel non parametrico non assumo alcuna forma: stimo l'intera funzione direttamente dai dati. Lo uso quando la sorgente è completamente ignota, come nei segnali aleatori rumorosi (gli oggetti sepolti visti dal georadar), oppure quando nessun modello parametrico approssima bene la pdf: un istogramma di luminosità a due gobbe non lo segue nessuna gaussiana. Il prezzo è che servono più campioni e più calcolo.

**Stima di base.** La probabilità che un campione cada in una regione $R$ piccola attorno a $\mathbf{x}^*$ è $P_R \approx p(\mathbf{x}^*)V$; la stimo con la frequenza relativa $K/N$ e ottengo

$$\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$$

$R$ deve essere abbastanza grande da contenere diversi campioni e abbastanza piccola perché $p$ sia quasi costante al suo interno. Posso fissare $K$ e misurare $V$ (K-NN) oppure fissare $V$ e contare $K$ (Parzen).

**K-NN.** Fisso $K$ e allargo la cella attorno a $\mathbf{x}^*$ finché contiene $K$ campioni: $\hat{p}(\mathbf{x}^*) = \frac{K}{N\,V_K(\mathbf{x}^*)}$. La cella si adatta ai dati: piccola dove i campioni sono fitti, grande dove sono radi.

**Parzen.** Fisso un ipercubo di lato $h$, volume $V = h^n$, e conto i campioni con la funzione finestra $\gamma$:

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\,\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$$

Con un kernel liscio, per esempio gaussiano, la stima è una somma di campane centrate sui campioni.

**Tendono alla soluzione ottima?** Sì, al crescere di $N$ e con le leggi giuste. Parzen converge alla pdf vera se $h_N \to 0$ (sparisce il bias) e $N h_N^n \to +\infty$ (sparisce la varianza), per esempio con $h_N = 1/\sqrt[2n]{N}$. Il K-NN converge se $K_N \to +\infty$ e $K_N/N \to 0$, per esempio con $K_N = \sqrt{N}$. Se uso queste stime come $p(\mathbf{x}\mid\omega_i)$ in un classificatore bayesiano, al crescere di $N$ mi avvicino al classificatore MAP ottimo. A $N$ finito il risultato dipende da $h$ o da $K$ ed è difficile da prevedere.

**Stima ML con la gaussiana.** Campioni 1-D iid, modello $\mathcal{N}(\mu, \sigma^2)$:

$$l(\mu, \sigma^2) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k - \mu)^2$$

$$\frac{\partial l}{\partial \mu} = \frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k - \mu) = 0 \;\Rightarrow\; \hat{\mu} = \frac{1}{N}\sum_{k=1}^{N} x_k$$

$$\frac{\partial l}{\partial \sigma^2} = -\frac{N}{2\sigma^2} + \frac{1}{2\sigma^4}\sum_{k=1}^{N}(x_k - \mu)^2 = 0 \;\Rightarrow\; \hat{\sigma}^2 = \frac{1}{N}\sum_{k=1}^{N}(x_k - \hat{\mu})^2$$

Significato. La stima della media è la media campionaria, il baricentro dei campioni: gli scarti $x_k - \hat{\mu}$ sommano a zero, ed è la soluzione ai minimi quadrati. È non polarizzata e ha varianza $\sigma^2/N$, pari al bound di Cramér-Rao: è efficiente. La stima della varianza divide per $N$ e non per $N-1$: ha media $\frac{N-1}{N}\sigma^2$, quindi è polarizzata a $N$ finito ma asintoticamente non polarizzata. In $n$ dimensioni ottengo $\hat{\mathbf{m}} = \frac{1}{N}\sum_k \mathbf{x}_k$ e $\hat{\Sigma} = \frac{1}{N}\sum_k (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$.

**Box classifier.** È un classificatore parametrico che migliora il classificatore a minima distanza dalle medie (MDM) usando le statistiche del secondo ordine, anche se in modo primitivo. Modello ogni classe $\omega_i$ con una pdf uniforme su un iper-rettangolo centrato nel baricentro $\mathbf{m}_i$, con semilato proporzionale alla deviazione standard lungo ogni feature:

$$B_i = \prod_{j=1}^{n}\left[m_{ij} - \alpha\sigma_{ij},\ m_{ij} + \alpha\sigma_{ij}\right]$$

L'addestramento stima $\mathbf{m}_i$ e le $\sigma_{ij}$, cioè $2nC$ parametri. Assegno $\mathbf{x}$ alla classe del box che lo contiene. Restano due casi: un campione fuori da tutti i box, che assegno al box con il bordo più vicino oppure lascio non classificato, e i box sovrapposti, dove scelgo il box di volume minore perché la sua densità $1/V_i$ è più alta. Limiti: frontiere rigide e parallele agli assi, nessuna covarianza tra le feature.`,
    checklist: [
      'non parametrico: nessuna forma assunta, si stima l’intera funzione; quando serve e che cosa costa',
      md`stima di base $K/(NV)$ e i due modi di fissare $K$ o $V$`,
      'formule del K-NN e di Parzen',
      md`convergenza: $h_N \to 0$ e $N h_N^n \to +\infty$ per Parzen, $K_N \to +\infty$ e $K_N/N \to 0$ per il K-NN, con un esempio`,
      md`derivate della log-verosimiglianza gaussiana, $\hat{\mu}$ media campionaria e $\hat{\sigma}^2$ polarizzata`,
      md`box classifier: pdf uniforme, centro $\mathbf{m}_i$, semilato $\alpha\sigma_{ij}$, regola, rifiuto e sovrapposizioni`,
    ],
    followUps: [
      { q: md`Perché la stima K-NN non integra a 1?`, a: md`Lontano dai campioni la cella che contiene $K$ campioni cresce in proporzione alla distanza: in 1-D $\hat{p}(x) \simeq \frac{K}{2N\vert x \vert}$, una coda che decresce come $1/\vert x \vert$ e ha area infinita.` },
      { q: md`Quanto vale la stima ML della varianza con un solo campione?`, a: md`Zero: $\hat{\mu} = x_1$ e l'unico scarto è nullo. È il caso estremo della polarizzazione $\frac{N-1}{N}\sigma^2$; lo stimatore con $N-1$ al denominatore non è nemmeno definito.` },
      { q: md`Come si sceglie $\alpha$ nel box classifier?`, a: md`È un compromesso: con $\alpha$ piccolo molti campioni cadono fuori da tutti i box (rifiuti), con $\alpha$ grande i box si sovrappongono. Per una feature gaussiana $P(\vert x_j - m_{ij} \vert \le \alpha\sigma_{ij}) = \mathrm{erf}(\alpha/\sqrt{2})$: con $\alpha = 2$ il box contiene circa il 95% dei campioni lungo quella feature.` },
    ],
  },
  {
    id: 'or-banca-3',
    q: md`Stima a finestre di Parzen: contesto e proprietà. Qual è la funzione finestra più comune (scrivi la formula)? Parzen è un buon stimatore (bias e varianza)? Mostra con un disegno come funzionano il conteggio e l'interpolazione con una coppia di campioni.`,
    qEn: 'Parzen window estimation: context and properties. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias and variance)? Show graphically how counting and interpolation work with a couple of samples.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Parzen Window Estimation: context, properties etc. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Graphical representation of how the counting/interpolation works with a couple of samples.',
    answer: md`**Contesto.** L'obiettivo della stima di pdf è una $\hat{p}(\mathbf{x})$ il più vicina possibile alla pdf vera $p(\mathbf{x})$, costruita su $N$ campioni iid. Parzen non assume una forma per la densità: è un metodo non parametrico. Parto da $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$ e, a differenza del K-NN, fisso la regione: un ipercubo di lato $h$ centrato in $\mathbf{x}^*$, di volume $V = h^n$. Conto i campioni con la funzione finestra

$$\gamma(\mathbf{u}) = \begin{cases} 1 & \vert u_j \vert \le 1/2,\ \ j = 1, \dots, n \\ 0 & \text{altrimenti}\end{cases}\qquad K = \sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}^* - \mathbf{x}_k}{h}\right)$$

e sostituendo ottengo

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\,\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$$

**Proprietà.** Letta al contrario, la formula dice che ogni campione porta con sé una finestra centrata su di sé e la stima è la media delle finestre. Se $\gamma \ge 0$ e $\int \gamma(\mathbf{u})\,d\mathbf{u} = 1$, la stima è non negativa e integra a 1: con il cambio di variabile $\mathbf{u} = (\mathbf{x} - \mathbf{x}_k)/h$ ho $d\mathbf{x} = h^n\,d\mathbf{u}$, e il fattore $1/h^n$ compensa. Con il rettangolo la stima è a gradini; per una stima continua scelgo un kernel liscio, con il massimo nell'origine e che decade a zero allontanandosi.

**Finestra più comune.** La gaussiana. In 1-D $\gamma(u) = \frac{1}{\sqrt{2\pi}}\exp\left(-\frac{u^2}{2}\right)$; in $n$ dimensioni, a simmetria sferica,

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\lVert\mathbf{x} - \mathbf{x}_k\rVert^2}{2\sigma^2}\right)$$

**È un buon stimatore?** Uso gli stessi criteri della bontà di una stima, applicati al valore $\hat{p}(\mathbf{x})$ in un punto, che è una variabile aleatoria perché dipende dai campioni. Bias: con campioni iid

$$E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$$

cioè una versione sfocata di $p$. A $h$ fisso la stima è polarizzata e più campioni non tolgono il bias, perché $N$ non compare. Se $h_N \to 0$ il kernel riscalato tende alla delta di Dirac e la stima è asintoticamente non polarizzata. Varianza:

$$E\left\{\left(\hat{p}(\mathbf{x}) - \bar{\hat{p}}(\mathbf{x})\right)^2\right\} \le \frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$$

e tende a zero se $N h_N^n \to +\infty$. Con le due condizioni la stima è consistente, per esempio con $h_N = 1/\sqrt[2n]{N}$, che dà $N h_N^n = \sqrt{N}$. A $N$ finito resta il compromesso: $h$ grande riduce la varianza ma sfoca (*oversmoothing*), $h$ piccolo riduce il bias ma produce una stima piena di picchi.

**Disegno con due campioni.** Metto $x_1$ e $x_2$ sull'asse. Conteggio: su ogni campione poso un rettangolo di base $h$ e altezza $\frac{1}{Nh} = \frac{1}{2h}$; dove i due rettangoli si sovrappongono la stima vale $\frac{1}{h}$, altrove $\frac{1}{2h}$ oppure $0$, con salti in $x_k \pm h/2$. Interpolazione: al posto dei rettangoli disegno due gaussiane di area $1/2$ ciascuna; la somma è una curva liscia, con una sola gobba se $\vert x_1 - x_2 \vert \le 2h$ e due gobbe se i campioni sono più lontani. In entrambi i disegni l'area totale vale 1.`,
    checklist: [
      md`obiettivo $\hat{p}(\mathbf{x})$ vicina a $p(\mathbf{x})$, metodo non parametrico, regione fissa con $V = h^n$`,
      md`funzione finestra dell'ipercubo e formula della stima con il fattore $1/h^n$`,
      'kernel gaussiano scritto per esteso, in 1-D o a simmetria sferica',
      md`bias: media della stima come convoluzione, non polarizzazione asintotica con $h_N \to 0$`,
      md`varianza limitata e consistenza con $N h_N^n \to +\infty$, con un esempio di $h_N$`,
      'disegno con due campioni: scaletta dei rettangoli e curva liscia delle gaussiane',
    ],
    followUps: [
      { q: md`A $h$ fisso raddoppio i campioni. Che cosa cambia?`, a: md`Il bound sulla varianza scala come $1/N$, quindi la varianza circa si dimezza. Il bias resta identico: la media della stima è la convoluzione di $p$ con il kernel e non dipende da $N$.` },
      { q: md`Con il kernel gaussiano la stima può valere zero in qualche punto?`, a: md`No: ogni gaussiana è positiva ovunque, quindi anche la loro media. Con il rettangolo invece la stima è nulla dove non cade alcun campione entro $h/2$.` },
      { q: md`Che cosa succede per $h \to 0$ a $N$ fisso?`, a: md`Ogni finestra diventa un ago di area $1/N$ sul proprio campione: la stima è una somma di impulsi, con varianza che esplode e nessuna informazione fra un campione e l'altro.` },
    ],
  },
  {
    id: 'or-banca-4',
    q: md`Finestre di Parzen: contesto generale (che cosa vogliamo fare, perché è una stima non parametrica), kernel gaussiano a simmetria sferica con formula e disegno, effetto della scelta della larghezza sulla stima. È una buona stima? (Bias, varianza e caratteristiche della larghezza per avere una stima consistente.)`,
    qEn: 'Parzen windows: general context (what we want to do, why it is a non-parametric estimation), the Gaussian kernel with spherical symmetry with formula and a drawing, how the choice of the width affects the estimate. Is it a good estimate? (Bias, variance and the conditions on the width for a consistent estimate.)',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Parzen Windows: general context (what we want to do, why they are non parametric estimation), gaussian kernel with spherical symmetry with formula and some drawing to represent it, How the choice of the width impacts our estimate? Is it a good estimate? (Bias, variance and consideration about the characteristics of the width to have a consistent estimate)',
    answer: md`**Che cosa voglio fare.** Stimare la pdf $p(\mathbf{x})$ di un fenomeno da $N$ campioni iid, con una stima $\hat{p}(\mathbf{x})$ il più vicina possibile a quella vera. Non conosco la forma della densità, quindi non ho un vettore $\boldsymbol{\theta}$ da stimare: la sorgente è completamente ignota e lascio parlare i dati. Per questo è una stima non parametrica. Fisso una regione di volume $V = h^n$ attorno al punto, conto i $K$ campioni che ci cadono e stimo $\hat{p} = K/(NV)$; con un kernel generale la stima diventa la media di finestre centrate sui campioni.

**Kernel gaussiano sferico.**

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\lVert\mathbf{x} - \mathbf{x}_k\rVert^2}{2\sigma^2}\right)$$

Disegno: nel piano delle feature $(x_1, x_2)$ segno i campioni; su ognuno disegno una campana con curve di livello circolari, tutte con la stessa $\sigma$; la stima è la loro somma divisa per $N$, alta dove i campioni si addensano e bassa dove sono radi. $\sigma$ è la stessa in tutte le direzioni, quindi prima normalizzo le feature: altrimenti quella con la scala più grande domina la distanza. Posso anche usare una $\sigma_k$ diversa per ogni campione, pari alla distanza media dai suoi $L$ vicini più prossimi.

**Effetto della larghezza.** Scrivo $\delta(\mathbf{x}) = \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$: la stima è $\frac{1}{N}\sum_k \delta(\mathbf{x} - \mathbf{x}_k)$. $h$ cambia insieme ampiezza e larghezza di $\delta$ tenendo l'area a 1: per la finestra normale 2-D il picco vale $\frac{1}{2\pi h^2}$, cioè $0.159$ con $h = 1$ e $3.98$ con $h = 0.2$. Con $h$ grande sommo funzioni larghe e basse: la stima è sovra-lisciata e perde i dettagli, due mode vicine si fondono (*oversmoothing*). Con $h$ piccolo sommo aghi sui campioni: la stima è irregolare e insegue il rumore del training set (*overfitting*). Con più campioni posso permettermi un $h$ più piccolo.

**È una buona stima?** La stima in un punto è una variabile aleatoria, e la giudico con bias e varianza. Media:

$$E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$$

una versione sfocata di $p$: a $h$ fisso la stima è polarizzata, asintoticamente non polarizzata se $h_N \to 0$. Varianza: al più $\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$. Per la consistenza servono insieme

$$\lim_{N\to+\infty} h_N = 0,\qquad \lim_{N\to+\infty} N h_N^n = +\infty$$

La prima toglie il bias, la seconda la varianza: la finestra deve stringersi, ma più lentamente di quanto crescono i campioni, così dentro ogni finestra ne cadono sempre di più. Esempio: $h_N = 1/\sqrt[2n]{N}$, con $N h_N^n = \sqrt{N}$. Se $h_N$ si stringe troppo in fretta la stima diventa rumorosa, se si stringe troppo piano resta sfocata.`,
    checklist: [
      'obiettivo della stima di pdf e perché il metodo è non parametrico',
      md`formula del kernel gaussiano sferico con $(2\pi\sigma^2)^{n/2}$ e $\lVert\mathbf{x} - \mathbf{x}_k\rVert^2$`,
      'disegno: campane a curve di livello circolari sui campioni, poi la somma',
      md`normalizzazione delle feature e $\sigma$ come parametro di lisciatura`,
      md`effetto di $h$: ampiezza e larghezza di $\delta(\mathbf{x})$ ad area costante, oversmoothing e overfitting`,
      md`bias come convoluzione, bound della varianza, condizioni $h_N \to 0$ e $N h_N^n \to +\infty$ con un esempio`,
    ],
    followUps: [
      { q: md`La legge $h_N = 1/N$ in una dimensione dà una stima consistente?`, a: md`No. $h_N \to 0$ va bene, ma $N h_N = 1$ resta costante: dentro ogni finestra cade in media un numero fisso di campioni e la varianza non va a zero.` },
      { q: md`Che cosa succede per $\sigma \to +\infty$?`, a: md`Ogni gaussiana si spalma su tutto lo spazio e la stima diventa quasi piatta: bias massimo, varianza minima.` },
      { q: md`Perché una $\sigma_k$ adattiva può aiutare?`, a: md`Dove i campioni sono fitti una finestra stretta basta a contarne molti e segue i dettagli; dove sono radi una finestra larga evita picchi isolati. Una $\sigma$ unica è per forza un compromesso fra le due zone.` },
    ],
  },
  {
    id: 'or-banca-5',
    q: md`Stima K-NN: come funziona? Disegna un grafico di esempio e descrivi la distribuzione che ottieni; che cosa vogliono dire *overfit* e *oversmooth*? Come funziona il classificatore K-NN (con un esempio)? Infine: quali sono le differenze con le finestre di Parzen?`,
    qEn: 'K-NN estimation: how does it work? Draw an example graph and describe the resulting distribution; what do overfit and oversmooth mean? How does the K-NN classifier work (with an example)? Finally, what are the differences with Parzen windows?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'K-NN estimation, how does it works, we draw a graph for example and asked how is the distribution, what does it mean overfit and oversmooth. Then he asked how the K-NN classifier works and made an example. Last question what are the difference with parzen window',
    answer: md`**Contesto.** È un metodo non parametrico: nessuna forma assunta per $p(\mathbf{x})$, la stima viene dai campioni. Parto dalla stima di base $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$, che richiede una regione abbastanza piccola perché $p$ sia costante dentro e abbastanza grande da contenere campioni.

**Come funziona.** Fisso $K$ e la forma della cella (per esempio una sfera). Attorno a $\mathbf{x}^*$ allargo la cella finché contiene esattamente $K$ campioni di training e ne misuro il volume $V_K(\mathbf{x}^*)$:

$$\hat{p}(\mathbf{x}^*) = \frac{K}{N\,V_K(\mathbf{x}^*)}$$

In 1-D la cella è un intervallo di semiampiezza $r_K(x)$, la distanza del $K$-esimo vicino, e $V_K = 2r_K$. La cella si adatta alla densità locale: stretta dove i campioni sono fitti, larga dove sono radi.

**Il grafico.** Disegno pochi campioni sull'asse e la stima con $K = 3$: è appuntita, con cuspidi e tratti curvi, picchi dove i campioni si addensano. Lontano dai dati non va mai a zero: la cella si allarga ma resta finita, e la coda scende come $\frac{K}{2N\vert x \vert}$. Per questo la stima K-NN non integra a 1. Aumentando $N$ con $K = \sqrt{N}$ la forma vera, per esempio una densità bimodale, emerge sempre meglio.

**Overfit e oversmooth.** Con $K$ piccolo la cella contiene pochi campioni: la stima segue i singoli punti, è frastagliata e cambia molto da un training set all'altro (*overfit*, varianza alta). Con $K$ grande la cella ingloba campioni lontani: la stima si appiattisce, due mode si fondono (*oversmooth*, bias alto). $K$ è un iperparametro da bilanciare; per la consistenza servono $K_N \to +\infty$ e $K_N/N \to 0$.

**Classificatore K-NN.** Per classificare $\mathbf{x}$ trovo i suoi $K$ vicini fra tutti i campioni di training e lo assegno alla classe più rappresentata. Lo giustifico con Bayes: se nella cella di volume $V$ cadono $K_i$ campioni della classe $\omega_i$, $\hat{p}(\mathbf{x}\mid\omega_i) = \frac{K_i}{N_i V}$ e $\hat{P}(\omega_i) = \frac{N_i}{N}$, quindi $\hat{P}(\omega_i\mid\mathbf{x}) = \frac{K_i}{K}$: il voto di maggioranza è la regola MAP. Esempio con il pesce: $K = 5$, tra i vicini ci sono 3 salmoni e 2 spigole, quindi classifico salmone, con posterior stimata $3/5$.

**Differenze con Parzen.**

- Parzen fissa il volume, $V = h^n$, e conta $K$; il K-NN fissa $K$ e misura $V$.
- Il parametro da scegliere è $h$ per Parzen e $K$ per il K-NN.
- Parzen con un kernel valido dà una densità vera, di area 1, e con il rettangolo può valere zero dove non ci sono campioni; il K-NN non si annulla mai, ha code pesanti e non integra a 1.
- Il K-NN adatta la cella alla densità locale; in Parzen la finestra ha la stessa larghezza ovunque.
- Entrambi convergono: Parzen con $h_N \to 0$ e $N h_N^n \to +\infty$, il K-NN con $K_N \to +\infty$ e $K_N/N \to 0$.`,
    checklist: [
      md`stima K-NN: cella allargata fino a $K$ campioni, $\hat{p} = K/(N\,V_K(\mathbf{x}^*))$`,
      'grafico: stima appuntita, code che non vanno a zero, integrale infinito',
      md`$K$ piccolo overfit, $K$ grande oversmooth, condizioni di consistenza`,
      md`classificatore: voto di maggioranza fra i $K$ vicini, giustificato come MAP con $K_i/K$, con un esempio`,
      md`differenze con Parzen: $V$ fisso contro $K$ fisso, area 1 contro code pesanti, finestra fissa contro cella adattiva`,
    ],
    followUps: [
      { q: md`Che cosa succede con $K = 1$ e un solo campione $x_1$?`, a: md`La stima è $\hat{p}(x) = \frac{1}{2\vert x - x_1 \vert}$: uno spillo che va all'infinito sul campione e scende come $1/\vert x - x_1 \vert$ ai lati.` },
      { q: md`Perché con $K$ pari il classificatore a due classi è scomodo?`, a: md`Può finire in parità, per esempio 2 contro 2 con $K = 4$. Con due classi si sceglie $K$ dispari per evitarlo.` },
      { q: md`Il K-NN classificatore ha una fase di addestramento?`, a: md`Quasi nessuna: memorizza i campioni. Il costo si sposta alla classificazione, dove per ogni $\mathbf{x}$ devo calcolare le distanze da tutti gli $N$ campioni.` },
    ],
  },
  {
    id: 'or-banca-6',
    q: md`Schema a blocchi e fasi di design di un sistema di ML: descrivi tutti i blocchi e le fasi con esempi (in particolare all'inizio, acquisizione dei dati ed estrazione delle feature: qual è la feature migliore per la discriminazione, citando la LDA). Poi, parlando di selezione (overfitting), addestramento e valutazione del modello (k-fold), arriva alle probabilità del classificatore binario (MAP). Infine: che cosa si può fare se il modello ha un'accuratezza bassa, o se l'utente finale vuole ridurre la probabilità di falso allarme e quella di mancato allarme?`,
    qEn: 'Block scheme and design phases of an ML system: describe all the blocks and phases with examples (especially data acquisition and feature extraction at the beginning: which is the best feature in terms of discrimination, citing LDA). Then, discussing selection (overfitting), training and evaluation of the model (k-fold), reach the probabilities of the binary classifier (MAP). Finally: what can we do when the model has low accuracy, or when a final user wants to reduce the probability of false alarm and the probability of missed alarm?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Block scheme/Design phases of an ML system, describe all the blocks and phases with examples (in particular at the beginning of data acquisition and feature extraction, which is the best feature in terms of discrimination, cit. of LDA). Then speaking about the selection (cit. of overfitting), the training and the evaluation of the model (cit. of k-fold), we reach the probabilities regarding the binary classifier (cit. of MAP). At the end, what can we do when the model has low accuracy or in general if a final user wants to reduce the probability of false alarm and the probability of missed alarm?',
    answer: md`**Schema a blocchi (il sistema in funzione).** Physical World → Acquisition → Pre-processing → Feature Extraction → Classification → Post-processing → Decision, con un supervisore che riceve le decisioni e rimanda correzioni ai blocchi. Uso l'impianto che separa salmoni e spigole:

- *Physical World*: i pesci sul nastro, il fenomeno che osservo.
- *Acquisition*: una telecamera acquisisce l'immagine con un sensore; i dati sono grezzi e rumorosi.
- *Pre-processing*: pulizia, normalizzazione, riduzione del rumore, valori mancanti; qui la segmentazione separa i pesci fra loro e dallo sfondo.
- *Feature Extraction*: misuro lunghezza, luminosità, larghezza e riduco l'immagine a pochi numeri.
- *Classification*: il modello decide salmone o spigola.
- *Post-processing*: raffino l'uscita, per esempio con soglie o aggregando più predizioni.
- *Decision*: l'azione finale, cioè il nastro che smista il pesce.

Nel Cap. 2 lo stesso schema torna con tre frecce: la stima statistica può servire nel pre-processing (stimo media e deviazione standard per normalizzare, la varianza del rumore per filtrarlo), nell'estrazione delle feature (feature dalle proprietà statistiche dei dati) e nel riconoscimento (apprendo le distribuzioni delle classi).

**La feature migliore.** È quella con la maggiore capacità di discriminazione: istogrammi delle classi poco sovrapposti. Con la sola lunghezza gli istogrammi di salmone e spigola si sovrappongono quasi ovunque e ogni soglia sbaglia molto; con la luminosità va meglio, ma attorno alla soglia $x^*$ restano errori. Combinando luminosità e larghezza le classi si separano meglio. La LDA cerca proprio la direzione di proiezione che massimizza la separazione fra le medie delle classi rispetto alla dispersione interna.

**Fasi di design (il lavoro del progettista).** Start (obiettivi e problema) → Collect data (sensori, database; quantità e qualità pesano sulle prestazioni) → Select features (tolgo le feature irrilevanti o ridondanti) → Choose model (in base a problema, dati e conoscenza a priori, bilanciando complessità, accuratezza e interpretabilità) → Train classifier (ottimizzo i parametri minimizzando una loss) → Evaluate classifier (su dati mai visti) → End. La conoscenza a priori alimenta le fasi, e se la valutazione è scarsa torno indietro.

**Selezione e overfitting.** Un modello molto flessibile, come una frontiera tortuosa che separa perfettamente i pesci di training, impara anche il rumore delle feature e gli errori umani nelle etichette: memorizza i campioni invece di generalizzare. Parto da modelli semplici, che sono più robusti, e aumento la complessità solo se serve: cerco un compromesso tra complessità del modello e capacità di generalizzazione.

**Addestramento e valutazione.** Con la k-fold cross-validation divido i dati in $k$ parti, addestro su $k-1$ e valuto sulla restante, ruoto $k$ volte e faccio la media: ogni campione viene usato una volta per il test. Con $k = N$ ho il leave-one-out.

**Probabilità del classificatore binario.** Con le pdf condizionate $p(\mathbf{x}\mid\omega_i)$ e i prior $P(\omega_i)$ la regola MAP sceglie la classe con la posterior più alta, cioè il massimo di $P(\omega_i)\,p(\mathbf{x}\mid\omega_i)$: è la regola a minima probabilità d'errore. Per stimare quelle pdf dai campioni serve la teoria della stima del Cap. 2.

**Accuratezza bassa, falsi e mancati allarmi.** Se l'accuratezza è bassa torno alle fasi precedenti: feature diverse o più numerose, un modello più adatto, più dati, stando attento all'overfitting. Falso allarme e mancato allarme si scambiano spostando la soglia: se la spigola è la classe da rilevare, spostare $x^*$ verso destra riduce i falsi allarmi e aumenta i mancati allarmi, e viceversa. La soglia sceglie solo il punto di equilibrio; per ridurre entrambi gli errori devo aumentare la capacità di discriminazione.`,
    checklist: [
      'tutti i blocchi dello schema con l’esempio del pesce, supervisore compreso',
      'dove interviene la stima statistica: pre-processing, feature extraction, riconoscimento',
      'feature migliore = maggiore capacità di discriminazione, con gli istogrammi e il richiamo alla LDA',
      'le sette fasi di design, la conoscenza a priori e il raffinamento iterativo',
      'overfitting e compromesso complessità-generalizzazione',
      'k-fold e leave-one-out, regola MAP per il binario',
      'rimedi all’accuratezza bassa e scambio tra falso e mancato allarme con la soglia',
    ],
    followUps: [
      { q: md`Qual è la differenza tra estrazione e selezione delle feature?`, a: md`L'estrazione costruisce nuove feature dai dati grezzi o combinando quelle esistenti (per esempio una proiezione come PCA o LDA); la selezione sceglie un sottoinsieme delle feature disponibili e scarta quelle irrilevanti o ridondanti.` },
      { q: md`Con 5 errori su 100 pesci di test, quanto vale l'accuratezza?`, a: md`$\frac{100 - 5}{100} = 95\%$.` },
      { q: md`Perché non conviene valutare il classificatore sugli stessi dati di training?`, a: md`Sui dati di training un modello abbastanza flessibile può arrivare a zero errori memorizzandoli: la stima dell'accuratezza sarebbe ottimista e non direbbe nulla sulla generalizzazione a pesci nuovi.` },
    ],
  },
  {
    id: 'or-banca-7',
    q: md`Fasi di design di un sistema di ML, differenza tra classificazione supervisionata e non supervisionata, alcuni esempi di funzioni di loss per la regressione, cross-validation (k-fold, leave-one-out), matrice di confusione (due classi e più classi: accuratezza, precisione, richiamo). Che cosa si può fare quando il modello ha un'accuratezza bassa?`,
    qEn: 'Design phases of an ML system, difference between supervised and unsupervised classification, some examples of loss functions for regression, cross-validation (k-fold, leave-one-out), confusion matrix (two-class and multi-class: accuracy, precision, recall). What can we do when the model has low accuracy?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Design phase of an ML system, difference between supervised and unsupervised classification, some examples of loss functions (for regression), cross-validation (k-fold, leave-one-out), confusion matrix (two-class/multi-class, accuracy, precision, recall). What can we do when the model has low accuracy?',
    answer: md`**Fasi di design.** Start: definisco gli obiettivi e capisco il problema. Collect data: raccolgo dati da sensori, database o piattaforme online; quantità e qualità pesano sulle prestazioni. Select features: tengo le feature che discriminano e scarto quelle irrilevanti o ridondanti. Choose model: scelgo il tipo di modello (albero di decisione, SVM, rete neurale) in base al problema, ai dati e alla conoscenza a priori, bilanciando complessità, accuratezza e interpretabilità. Train classifier: ottimizzo i parametri minimizzando una loss. Evaluate classifier: misuro le prestazioni su dati mai visti. End: il sistema è pronto per la messa in esercizio. La conoscenza a priori guida le fasi e ogni valutazione scarsa mi rimanda indietro.

**Supervisionata e non supervisionata.** Nella supervisionata ho campioni di training con l'etichetta della classe e imparo la corrispondenza $\mathbf{x} \mapsto \omega(\mathbf{x})$; per esempio pesci già etichettati salmone o spigola. Nella non supervisionata non ho etichette: cerco una struttura nei dati, per esempio gruppi di pixel simili in un'immagine da satellite (*clustering*), e le classi emergono dai dati.

**Loss per la regressione.** Con $y$ il valore vero e $f(\mathbf{x})$ la predizione:

- quadratica: $(y - f(\mathbf{x}))^2$, penalizza molto gli errori grandi e quindi gli outlier;
- assoluta: $\vert y - f(\mathbf{x}) \vert$, più robusta agli outlier;
- $\varepsilon$-insensibile: $\max(0, \vert y - f(\mathbf{x}) \vert - \varepsilon)$, ignora gli errori più piccoli di $\varepsilon$ (la usa la SVR).

Il legame con la stima: minimizzare la loss quadratica equivale alla stima ML con rumore gaussiano, perché $-\ln p$ di una gaussiana è un quadrato.

**Cross-validation.** k-fold: divido i dati in $k$ parti uguali, addestro su $k - 1$, valuto sulla parte esclusa, ripeto $k$ volte e faccio la media delle prestazioni. Leave-one-out: $k = N$, ogni volta lascio fuori un solo campione; usa quasi tutti i dati per addestrare ma costa $N$ addestramenti.

**Matrice di confusione.** Righe = classe vera, colonne = classe predetta. A due classi ho veri positivi $TP$, falsi positivi $FP$, falsi negativi $FN$, veri negativi $TN$:

$$\text{accuratezza} = \frac{TP + TN}{TP + FP + FN + TN},\qquad \text{precisione} = \frac{TP}{TP + FP},\qquad \text{richiamo} = \frac{TP}{TP + FN}$$

Precisione: quanti dei positivi dichiarati lo sono davvero. Richiamo: quanti dei positivi veri ho trovato. A $C$ classi la matrice è $C \times C$: l'accuratezza è la traccia divisa per il totale; per la classe $i$ la precisione è l'elemento diagonale diviso la somma della colonna $i$, il richiamo è l'elemento diagonale diviso la somma della riga $i$.

**Accuratezza bassa.** Torno alle fasi precedenti: rivedo la selezione delle feature, cambio modello o raccolgo altri dati. Posso aumentare il numero di feature o passare a un classificatore non lineare più flessibile, ma senza cadere nell'overfitting: serve un compromesso tra complessità del modello e capacità di generalizzazione, verificato con la cross-validation.`,
    checklist: [
      'le fasi di design in ordine, con conoscenza a priori e raffinamento iterativo',
      'supervisionata con etichette contro non supervisionata senza etichette, con esempi',
      'almeno due loss per la regressione scritte per esteso',
      'k-fold e leave-one-out descritti correttamente',
      'matrice di confusione a due e a più classi con accuratezza, precisione e richiamo',
      'rimedi all’accuratezza bassa e rischio di overfitting',
    ],
    followUps: [
      { q: md`Con $TP = 40$, $FP = 10$, $FN = 20$, $TN = 30$, quanto valgono accuratezza, precisione e richiamo?`, a: md`Accuratezza $\frac{70}{100} = 0.7$, precisione $\frac{40}{50} = 0.8$, richiamo $\frac{40}{60} \approx 0.67$.` },
      { q: md`Perché l'accuratezza può ingannare con classi sbilanciate?`, a: md`Se il 95% dei casi è negativo, un classificatore che dice sempre negativo ha accuratezza 95% e richiamo zero sui positivi. Servono precisione e richiamo per classe.` },
      { q: md`Quale $k$ conviene nella k-fold?`, a: md`Valori come 5 o 10 sono un compromesso: $k$ piccolo addestra su meno dati (stima pessimista), $k$ grande costa più addestramenti e dà stime più variabili; il leave-one-out è il caso estremo.` },
    ],
  },
  {
    id: 'or-banca-8',
    q: md`Perceptron (tutto) e stima dei parametri: problema della soluzione analitica per la regressione con il perceptron; esempio di stima dei parametri di una gaussiana: perché anche il posterior è gaussiano? Come si usa la stima dei parametri nelle reti bayesiane? Perché la stima ML è veloce in una rete bayesiana (indipendenza delle distribuzioni condizionate)?`,
    qEn: 'Perceptron (everything) and parameter estimation: the problem with the analytical solution for perceptron regression; example of Gaussian parameter estimation: why do we also obtain a Gaussian as posterior? How is parameter estimation used in Bayesian networks? Why is ML fast in a Bayesian network (independence of the conditional distributions)?',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Perceptron (All) + Parameter estimation Questions: - Problem with analytical solution for perceptron regression - Example of estimation of Gaussian parameters: why do we obtain a Gaussian also as posterior? - How to use parameter estimation in Bayesian Networks - Why ML is fast in Bayesian Network (CDP independence)',
    answer: md`**Perceptron.** È il classificatore lineare $f(\mathbf{x}) = \operatorname{sign}(\mathbf{w}^t\mathbf{x} + w_0)$: un iperpiano divide lo spazio in due semispazi. Lo addestro minimizzando l'errore sui campioni classificati male, $E(\mathbf{w}) = -\sum_{(\mathbf{x}, y) \in \mathcal{E}} y\,\mathbf{w}^t\mathbf{x}$, con la discesa del gradiente stocastica: per ogni campione sbagliato aggiorno $\mathbf{w} \leftarrow \mathbf{w} + \eta\,y\,\mathbf{x}$. Se i dati sono linearmente separabili l'algoritmo converge in un numero finito di passi; se non lo sono (lo XOR) non converge, e serve una rete a più strati.

**Regressione e soluzione analitica.** Per la regressione tolgo il segno: $f(\mathbf{x}) = \mathbf{w}^t\mathbf{x}$ e minimizzo l'errore quadratico $E(\mathbf{w}) = (\mathbf{y} - X\mathbf{w})^t(\mathbf{y} - X\mathbf{w})$. Il sistema $X\mathbf{w} = \mathbf{y}$ ha di solito più righe che colonne e nessuna soluzione esatta; annullando il gradiente ottengo

$$\mathbf{w} = (X^tX)^{-1}X^t\mathbf{y}$$

con la pseudo-inversa $(X^tX)^{-1}X^t$. Il problema: $X^tX$ può essere singolare o mal condizionata (feature linearmente dipendenti, meno campioni che feature) e invertirla costa $O(d^3)$ con $d$ feature. Per questo si usa la discesa del gradiente, o si regolarizza.

**Perché il posterior della media gaussiana è gaussiano.** Campioni iid $\mathcal{N}(\theta, \sigma^2)$ con $\sigma$ nota e prior $p(\theta) = \mathcal{N}(\mu_0, \sigma_0^2)$. La verosimiglianza, come funzione di $\theta$, è l'esponenziale di una quadratica: $p(\mathbf{X}\mid\theta) \propto \exp\left(-\frac{N(\theta - \bar{x})^2}{2\sigma^2}\right)$. Il posterior è proporzionale a verosimiglianza per prior, cioè al prodotto di due esponenziali di quadratiche in $\theta$, che è ancora l'esponenziale di una quadratica. Completando il quadrato trovo

$$\frac{1}{\sigma_N^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2},\qquad \mu_N = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\,\bar{x} + \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\,\mu_0$$

La gaussiana è un prior coniugato per la media: prior e posterior stanno nella stessa famiglia. $\mu_N$ è una media pesata tra la stima ML $\bar{x}$ e il prior $\mu_0$; con $N \to +\infty$ o $\sigma_0 \to +\infty$ (prior piatto) tende a $\bar{x}$.

**Stima dei parametri nelle reti bayesiane.** La struttura fissa la fattorizzazione $p(X_1, \dots, X_m) = \prod_i p(X_i\mid \mathrm{Pa}_i)$; i parametri sono le distribuzioni condizionate di ogni nodo dati i genitori. Con dati completi la stima ML è un conteggio: $\hat{\theta}_{ijk} = \frac{N_{ijk}}{N_{ij}}$, frazione dei casi con $X_i$ nello stato $k$ fra quelli con i genitori nella configurazione $j$. Con conoscenza a priori metto un prior di Dirichlet e i conteggi ricevono pseudo-conteggi $\alpha_{ijk}$: la stima MAP delle note di Passerini è $\frac{N_{ijk} + \alpha_{ijk}}{N_{ij} + \alpha_{ij}}$ (se gli $\alpha$ sono i parametri della Dirichlet, la stessa formula è la media a posteriori), e non assegna mai probabilità zero a una configurazione mai vista. Con dati incompleti uso l'EM: il passo E calcola i conteggi attesi con i parametri correnti, il passo M rifà la stima con quei conteggi.

**Perché la ML è veloce.** Con campioni iid la verosimiglianza è un prodotto sui campioni; dentro ogni campione la rete la fattorizza in un prodotto sui nodi:

$$p(\mathcal{D}\mid\boldsymbol{\theta}) = \prod_{l=1}^{N}\prod_{i=1}^{m} p\left(x_i^{(l)}\mid \mathrm{pa}_i^{(l)}, \boldsymbol{\theta}_{i}\right) = \prod_{i=1}^{m}\left[\prod_{l=1}^{N} p\left(x_i^{(l)}\mid \mathrm{pa}_i^{(l)}, \boldsymbol{\theta}_{i}\right)\right]$$

Ogni fattore dipende solo dai parametri $\boldsymbol{\theta}_i$ della distribuzione condizionata di un nodo. Il massimo globale si spezza in $m$ massimizzazioni indipendenti, ognuna in forma chiusa con i conteggi: basta una passata sui dati. È la stessa mossa della verosimiglianza come prodotto: l'indipendenza trasforma una funzione congiunta in un prodotto di pezzi separati.`,
    checklist: [
      'perceptron: modello, regola di aggiornamento, convergenza con dati separabili, limite dello XOR',
      md`regressione: soluzione $\mathbf{w} = (X^tX)^{-1}X^t\mathbf{y}$ e i suoi problemi (singolarità, costo)`,
      'posterior gaussiano: prodotto di esponenziali di quadratiche, completamento del quadrato, prior coniugato',
      md`formule di $\sigma_N^2$ e $\mu_N$ e loro limiti`,
      'reti bayesiane: ML con i conteggi, prior di Dirichlet, EM con dati incompleti',
      'velocità della ML: la verosimiglianza si fattorizza per nodo, stime separate in forma chiusa',
    ],
    followUps: [
      { q: md`Che cosa succede alla stima ML di una rete bayesiana se una configurazione dei genitori non compare mai nei dati?`, a: md`$N_{ij} = 0$ e la frazione $N_{ijk}/N_{ij}$ non è definita; anche con pochi casi le probabilità stimate possono valere 0. Il prior di Dirichlet risolve aggiungendo pseudo-conteggi.` },
      { q: md`Nella formula di $\mu_N$, chi pesa di più con pochi campioni?`, a: md`Il prior: il peso dei dati è $\frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}$, piccolo se $N\sigma_0^2$ è piccolo rispetto a $\sigma^2$. Con $N = 12$, $\sigma = 1$, $\sigma_0 = 0.5$ il peso dei dati vale $3/4$.` },
      { q: md`Il perceptron trova l'iperpiano migliore fra quelli che separano i dati?`, a: md`No: si ferma sul primo che separa i campioni di training, e quale trova dipende dall'ordine dei campioni e dall'inizializzazione. Il margine massimo è l'idea delle SVM.` },
    ],
  },
  {
    id: 'or-banca-9',
    q: md`Criterio MAP: confronto e differenze principali con il criterio ML. Esempio di come i prior spostano la soglia rispetto al criterio ML. Dimostra che il MAP minimizza l'errore. Alla fine, è meglio il MAP o il ML, e perché? Perché il MAP potrebbe non essere il migliore (collegamento con l'errore di approssimazione)?`,
    qEn: 'MAP criterion: comparison and main differences with ML. Example of how priors change the threshold compared to the ML criterion. Proof of MAP as error minimization. At the end of the day, is MAP or ML better, and why? Why might MAP not be the best one (link to the approximation error)?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'MAP criterion: comparison and main differences between ML. Example of how priors change the threshold compared to ML criterion. Proof of MAP as error minimization. At the end of the day is better MAP or ML and why? Why MAP could not be the best one? (Linked to approximation error)',
    answer: md`**Le due regole.** Il MAP assegna $\mathbf{x}$ alla classe con la probabilità a posteriori più alta; con il teorema di Bayes, e siccome l'evidenza $p(\mathbf{x})$ non dipende dalla classe,

$$\omega_{MAP}(\mathbf{x}) = \arg\max_{i} P(\omega_i\mid\mathbf{x}) = \arg\max_{i} P(\omega_i)\,p(\mathbf{x}\mid\omega_i)$$

Il ML usa solo le pdf condizionate: $\omega_{ML}(\mathbf{x}) = \arg\max_i p(\mathbf{x}\mid\omega_i)$, la classe che più verosimilmente ha generato $\mathbf{x}$. Il MAP richiede prior e pdf, il ML solo le pdf; con prior uguali coincidono.

**Come i prior spostano la soglia.** Lo vedo sul canale PAM delle note: tre livelli $0.25$ (Yes), $0.5$ (Maybe), $0.75$ (No) con rumore gaussiano di deviazione standard $\sigma_n$. Il criterio ML mette le soglie dove le campane adiacenti si incrociano, a metà strada: $0.375$ e $0.625$. Con il MAP la soglia tra due livelli $a_1 < a_2$ è dove $P_1\,p(y\mid a_1) = P_2\,p(y\mid a_2)$; passando ai logaritmi i termini in $y^2$ si cancellano e resta

$$t_{12} = \frac{a_1 + a_2}{2} + \frac{\sigma_n^2}{a_2 - a_1}\ln\frac{P_1}{P_2}$$

Con $\sigma_n = 0.1$ e prior $0.5$, $0.3$, $0.2$: $t_{12} = 0.375 + 0.04\ln\frac{5}{3} \approx 0.395$ e $t_{23} = 0.625 + 0.04\ln 1.5 \approx 0.641$. La soglia si sposta verso il simbolo meno probabile e allarga la regione di quello più probabile; la probabilità d'errore scende da circa $13.7\%$ a circa $13.2\%$. Lo spostamento cresce con $\sigma_n^2$: se il rumore sparisce le soglie tornano ai punti medi e il prior non conta più.

**Il MAP minimizza l'errore.** Per un classificatore qualsiasi con regioni di decisione $\Re_1, \dots, \Re_C$:

$$P_e = \sum_{i=1}^{C} P(\omega_i)\,P(\mathbf{x}\notin\Re_i\mid\omega_i) = 1 - \sum_{i=1}^{C}\int_{\Re_i} P(\omega_i)\,p(\mathbf{x}\mid\omega_i)\,d\mathbf{x}$$

Minimizzare $P_e$ significa massimizzare la somma degli integrali. Ogni punto $\mathbf{x}$ appartiene a una sola regione e contribuisce con $P(\omega_i)\,p(\mathbf{x}\mid\omega_i)$ della classe a cui lo assegno; il contributo è massimo se lo assegno alla classe con il prodotto più grande, che è la regola MAP. Nessuna partizione fa meglio: l'errore minimo $P_e^* = 1 - \int \max_i P(\omega_i)\,p(\mathbf{x}\mid\omega_i)\,d\mathbf{x}$ è un limite inferiore per ogni classificatore.

**Meglio MAP o ML?** Se prior e pdf sono quelli veri, il MAP: è ottimo, e il ML sbaglia di più o uguale. L'uguaglianza vale quando le due regole decidono allo stesso modo quasi ovunque: per esempio con prior uguali, oppure con classi che non si sovrappongono (il canale PAM ideale, senza rumore, ha errore nullo con qualunque prior). Se i prior non li conosco o non mi fido, il ML equivale a supporli uguali, una scelta neutra. Se gli errori hanno costi diversi nessuno dei due è il migliore: serve il rischio minimo.

**Perché il MAP potrebbe non essere il migliore.** L'ottimalità vale solo se tutte le probabilità sono note. In pratica le stimo: se il modello scelto per $p(\mathbf{x}\mid\omega_i)$ non può rappresentare la pdf vera, per esempio una gaussiana per una classe bimodale, ho un errore di approssimazione; con pochi campioni ho anche un errore di stima; se la frequenza delle classi sul campo è diversa da quella del training set i prior sono sbagliati. Il MAP costruito con quantità stimate non è più il classificatore ottimo e può fare peggio del ML. In più tratta tutti gli errori come se costassero uguale.`,
    checklist: [
      'regole MAP e ML con le formule, e la differenza di informazione richiesta',
      'coincidenza con prior uguali',
      md`esempio con la soglia spostata di $\frac{\sigma^2}{a_2 - a_1}\ln\frac{P_1}{P_2}$, con numeri`,
      md`dimostrazione: $P_e = 1 - \sum_i \int_{\Re_i} P(\omega_i)\,p(\mathbf{x}\mid\omega_i)\,d\mathbf{x}$ massimizzato punto per punto`,
      'scelta tra MAP e ML in base alla conoscenza dei prior; costi diversi portano al rischio minimo',
      'limiti del MAP: errore di approssimazione, errore di stima, prior sbagliati',
    ],
    followUps: [
      { q: md`Nel caso a due classi gaussiane con la stessa varianza, dove sta la soglia ML?`, a: md`A metà tra le medie, $\frac{\mu_1 + \mu_2}{2}$: lì le due campane hanno la stessa altezza.` },
      { q: md`Il criterio ML di classificazione è la stessa cosa della stima ML dei parametri?`, a: md`No. La stima ML sceglie il $\boldsymbol{\theta}$ che massimizza $p(\mathbf{X}\mid\boldsymbol{\theta})$ al variare dei parametri; il criterio ML sceglie la classe che massimizza $p(\mathbf{x}\mid\omega_i)$ al variare della classe. In comune hanno solo l'idea di massimizzare una verosimiglianza.` },
      { q: md`Perché con rumore molto piccolo i prior contano poco?`, a: md`Lo spostamento $\frac{\sigma_n^2}{a_2 - a_1}\ln\frac{P_1}{P_2}$ va a zero con $\sigma_n^2$: le campane sono così strette che la misura decide da sola quasi sempre.` },
    ],
  },
  {
    id: 'or-banca-10',
    q: md`Reti bayesiane: formalizzazione (grafo aciclico orientato, indipendenze locali, i vari casi del criterio di d-separazione, criterio generale di d-separazione e indipendenze globali) e apprendimento dei parametri (ML con dati completi, MAP con conoscenza a priori, EM con dati incompleti).`,
    qEn: 'Bayesian networks: formalization (DAG, local independencies, the cases of the d-separation criterion, the general d-separation criterion and global independencies) and parameter learning (ML with complete data, MAP with prior knowledge, EM with incomplete data).',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Bayesian networks: formalization (DAG, local independencies, various case of d-separation criterion, general d-separation criterion and global independencies) and learning of the parameters (ML with complete data, MAP with prior knowledge, EM with incomplete data)',
    answer: md`**Formalizzazione.** Una rete bayesiana è un grafo aciclico orientato (DAG): ogni nodo è una variabile aleatoria, ogni arco una dipendenza diretta, e ogni nodo porta la distribuzione condizionata dati i suoi genitori, $p(X_i\mid\mathrm{Pa}_i)$. La congiunta si fattorizza

$$p(X_1, \dots, X_m) = \prod_{i=1}^{m} p(X_i\mid\mathrm{Pa}_i)$$

Il vantaggio è il numero di parametri: con $m$ variabili binarie la tabella congiunta ne richiede $2^m - 1$, la rete una tabella piccola per nodo.

**Indipendenze locali.** Ogni nodo è condizionatamente indipendente dai suoi non discendenti, dati i genitori. La fattorizzazione e queste indipendenze si implicano a vicenda.

**I tre casi della d-separazione**, con due nodi $X$ e $Y$ collegati attraverso $Z$:

- *coda-coda* (causa comune, $X \leftarrow Z \rightarrow Y$): $X$ e $Y$ sono dipendenti, diventano indipendenti se osservo $Z$;
- *testa-coda* (catena, $X \rightarrow Z \rightarrow Y$): dipendenti, indipendenti dato $Z$;
- *testa-testa* (V-structure, $X \rightarrow Z \leftarrow Y$): indipendenti finché non osservo nulla, dipendenti se osservo $Z$ o un suo discendente (*explaining away*: se l'allarme suona e so che c'è stato un terremoto, il furto diventa meno probabile).

**Criterio generale e indipendenze globali.** Due insiemi di nodi $A$ e $B$ sono d-separati da $C$ se ogni cammino non orientato tra un nodo di $A$ e uno di $B$ è bloccato. Un cammino è bloccato se contiene un nodo in $C$ in cui le frecce sono testa-coda o coda-coda, oppure un nodo testa-testa che non sta in $C$ e non ha discendenti in $C$. Se $A$ e $B$ sono d-separati da $C$, allora $A$ è indipendente da $B$ dato $C$ in ogni distribuzione che si fattorizza secondo il grafo. L'insieme di tutte queste affermazioni sono le indipendenze globali del grafo.

**ML con dati completi.** Con campioni iid la verosimiglianza è un prodotto sui campioni e, dentro ognuno, sui nodi: si spezza in una verosimiglianza per ogni distribuzione condizionata. Ogni pezzo si massimizza da solo con i conteggi, $\hat{\theta}_{ijk} = \frac{N_{ijk}}{N_{ij}}$: la frazione dei casi con $X_i$ nello stato $k$ fra quelli con i genitori nella configurazione $j$.

**MAP con conoscenza a priori.** Tratto i parametri come variabili aleatorie, come nella stima bayesiana, con un prior di Dirichlet su ogni distribuzione condizionata. Il posterior è ancora Dirichlet e i conteggi ricevono pseudo-conteggi $\alpha_{ijk}$, cioè osservazioni immaginarie viste prima dei dati: la stima MAP, come la scrivono le note di Passerini, è $\frac{N_{ijk} + \alpha_{ijk}}{N_{ij} + \alpha_{ij}}$, con $\alpha_{ij} = \sum_k \alpha_{ijk}$. Con $\alpha$ piccoli è quasi la stima ML; con $\alpha$ grandi pesa di più il prior e si riduce l'overfitting. Se invece si prendono gli $\alpha$ come parametri della Dirichlet, questa formula è la media a posteriori e la moda vale $\frac{N_{ijk} + \alpha_{ijk} - 1}{N_{ij} + \alpha_{ij} - K}$, con $K$ stati di $X_i$: all'orale uso la convenzione del docente. Con pochi dati il prior evita probabilità nulle; con molti dati i conteggi dominano e la stima tende a quella ML, come succede per ML e Bayes in generale.

**EM con dati incompleti.** Scartare i casi con valori mancanti butterebbe informazione utile: il principio è sfruttare tutta l'informazione disponibile. L'EM alterna due passi: E, calcolo con i parametri correnti la distribuzione delle variabili mancanti e i conteggi attesi; M, rifaccio la stima ML (o MAP) con i conteggi attesi al posto di quelli osservati. Ogni iterazione non fa diminuire la verosimiglianza e l'algoritmo converge a un massimo locale.`,
    checklist: [
      'DAG, distribuzioni condizionate dei nodi e fattorizzazione della congiunta',
      'indipendenze locali: un nodo dai non discendenti, dati i genitori',
      'i tre casi coda-coda, testa-coda, testa-testa con l’effetto dell’osservazione',
      'criterio generale di d-separazione con la regola dei cammini bloccati e indipendenze globali',
      'ML con dati completi come conteggi per configurazione dei genitori',
      'MAP con prior di Dirichlet come pseudo-conteggi, EM con dati incompleti',
    ],
    followUps: [
      { q: md`Perché nella struttura testa-testa l'osservazione crea dipendenza?`, a: md`Se so che l'effetto comune è avvenuto, le due cause competono per spiegarlo: scoprire che una è vera rende l'altra meno necessaria, quindi meno probabile (*explaining away*).` },
      { q: md`Quanti parametri servono per un nodo binario con tre genitori binari?`, a: md`Una probabilità per ognuna delle $2^3 = 8$ configurazioni dei genitori: 8 parametri liberi.` },
      { q: md`Perché l'EM trova solo un massimo locale?`, a: md`Con dati mancanti la verosimiglianza marginale non è concava nei parametri; l'EM la fa salire a ogni passo ma si ferma sul primo massimo che incontra, che dipende dall'inizializzazione.` },
    ],
  },

  // --- domande sulle parti più chieste --------------------------------------------------------------
  {
    id: 'or-problema-stima-pdf',
    q: md`Perché la stima statistica serve in un sistema di machine learning e come si formula il problema della stima di una pdf?`,
    qEn: 'Why is statistical estimation needed in a machine learning system, and how is the pdf estimation problem formulated?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Dove serve.** Nello schema a blocchi Physical World → Acquisition → Pre-processing → Feature Extraction → Recognition → Post-recognition → Decision la stima statistica può intervenire in tre blocchi. Nel pre-processing: normalizzare i dati, ridurre il rumore, gestire i valori mancanti; per normalizzare una feature devo stimarne media e deviazione standard dai campioni. Nella feature extraction: ricavo feature significative analizzando le proprietà statistiche dei dati, per avere una rappresentazione compatta e informativa. Nel riconoscimento: identifico pattern e apprendo le distribuzioni di probabilità su cui prendo le decisioni. Lo schema del sistema di decisione statistico lo dice in altro modo: sorgente di informazione, spazio delle osservazioni (dati grezzi, spesso rumorosi), modellazione statistica e stima (parametrica o non parametrica, scelta dal progettista), uscita (classificazione, rivelazione, predizione).

**Obiettivo del capitolo.** Stimare la distribuzione statistica di un segnale stocastico a partire da un insieme di osservazioni. Nel machine learning statistico la pdf ha un ruolo chiave; alcuni approcci, come certe reti profonde, non la richiedono in modo esplicito e imparano i pattern direttamente dai dati.

**Formulazione.** Sia $\mathbf{x} = (x_1, x_2, \dots, x_n)$ un vettore di $n$ feature con pdf incognita $p(\mathbf{x})$. Ho un insieme finito $\mathbf{X} = \{\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_N\}$ di $N$ campioni di training indipendenti e identicamente distribuiti, estratti da $p(\mathbf{x})$. L'obiettivo è una stima $\hat{p}(\mathbf{x})$, costruita sui campioni $\mathbf{X}$, il più vicina possibile alla pdf vera. Attenzione agli indici: $n$ minuscolo conta le feature, $N$ maiuscolo i campioni.

**L'ipotesi iid.** Indipendenti: un campione non influenza gli altri. Identicamente distribuiti: seguono tutti la stessa $p(\mathbf{x})$. Nei casi reali è raramente vera, per esempio per letture consecutive dello stesso sensore o pixel vicini di un'immagine, ma la assumo per semplificare i calcoli: mi permetterà di scrivere la verosimiglianza come prodotto.

**Principio.** Devo sfruttare tutta l'informazione disponibile, anche quando i dati sono incompleti o imperfetti: buttare un campione con un valore mancante spreca le componenti che ho misurato. Il capitolo chiude con l'algoritmo EM proprio per questo.

**Due strade.** Se conosco la forma della densità stimo solo i parametri (approccio parametrico: gaussiana, Gamma, Rayleigh); se non la conosco lascio parlare i dati (non parametrico: K-NN, finestre di Parzen, approssimazione con funzioni ortogonali).`,
    checklist: [
      'i tre blocchi dello schema in cui serve la stima, con un compito per ciascuno',
      'schema sorgente, spazio delle osservazioni, modellazione e stima, uscita con classificazione, rivelazione, predizione',
      md`notazione $\mathbf{x}$, $n$, $p(\mathbf{x})$, $\mathbf{X}$, $N$ e obiettivo $\hat{p}(\mathbf{x})$ vicina a $p(\mathbf{x})$`,
      'ipotesi iid, significato e limiti',
      'principio di sfruttare tutta l’informazione, anche con dati incompleti',
      'ML statistico e non statistico, parametrico e non parametrico',
    ],
    followUps: [
      { q: md`Che cosa distingue classificazione, rivelazione e predizione?`, a: md`La classificazione assegna i dati a una tra più categorie predefinite; la rivelazione (*detection*) decide se un certo pattern o segnale è presente o assente; la predizione prevede esiti futuri in base al modello appreso.` },
      { q: md`La stima $\hat{p}(\mathbf{x})$ è una funzione deterministica?`, a: md`No: è costruita su $\mathbf{X}$, quindi $\hat{p}(\mathbf{x}) = \hat{p}(\mathbf{x};\mathbf{X})$. Con un altro training set ottengo un'altra stima; per questo la sua qualità si giudica con bias, varianza e consistenza.` },
      { q: md`Nella figura 3D della slide introduttiva che cosa rappresentano gli assi?`, a: md`Sul piano ci sono le due feature $x_1$ e $x_2$, in verticale la densità $p(\mathbf{x})$. Le superfici a campana, di forma e orientamento diversi, si possono leggere come le densità di classi diverse, che si sovrappongono in parte.` },
    ],
  },
  {
    id: 'or-categorie-segnali',
    q: md`Quali sono le tre categorie di segnali stocastici nella teoria della stima, e che legame hanno con gli approcci parametrico e non parametrico alla stima di pdf?`,
    qEn: 'What are the three categories of stochastic signals in estimation theory, and how are they linked to the parametric and nonparametric approaches to pdf estimation?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Criterio.** Divido i segnali stocastici in base a quanto conosco della sorgente di informazione. In tutti e tre i casi c'è rumore.

- **Segnali deterministici rumorosi.** Sorgente completamente nota; il rumore entra in trasmissione e/o in acquisizione. Esempio: la trasmissione nei sistemi di telecomunicazione basati su PAM.
- **Segnali parametrici rumorosi.** Sorgente nota solo in parte: conosco la struttura del segnale e dalle osservazioni stimo i parametri aleatori che ne controllano il comportamento. Esempio: stimare la velocità di un bersaglio con il sonar.
- **Segnali aleatori rumorosi.** Segnale completamente ignoto: segnale e rumore sono entrambi aleatori e la stima si appoggia solo sulle osservazioni. Esempio: rivelare oggetti sepolti con il georadar (*ground penetrating radar*).

Il corso si concentra sulla seconda e sulla terza categoria, le più comuni nelle applicazioni, e in particolare sulla stima della pdf.

**Gli approcci alla stima di pdf.** L'albero ha due rami. Parametrico: la forma della distribuzione è nota e stimo solo i parametri; esempi gaussiana (media e varianza), Gamma (code d'attesa, affidabilità), Rayleigh (modulo di un vettore 2-D, ampiezza di un segnale). Non parametrico: nessuna forma assunta, la distribuzione viene inferita dai dati; K-Nearest Neighbors (densità dalla vicinanza dei punti), finestre di Parzen (una funzione finestra liscia i contributi dei punti), approssimazione con funzioni ortogonali.

**Il legame.** Categoria 2: conosco la forma e non i parametri, quindi approccio parametrico. Resta da stimare un vettore $\boldsymbol{\theta} = (\theta_1, \dots, \theta_r)$ di $r$ numeri nel modello $p(\mathbf{x}\mid\boldsymbol{\theta})$. Categoria 3: la sorgente è ignota, quindi approccio non parametrico, e resta da stimare l'intera funzione $p(\mathbf{x})$. Categoria 1: non c'è alcuna densità da stimare, resta solo da decidere in presenza di rumore, come nel classificatore a soglie del canale PAM. Nello schema del sistema di decisione è l'etichetta Parametric/Nonparametric che il progettista porta nel blocco di modellazione e stima.

**Quando conviene l'uno o l'altro.** Ogni metodo ha i suoi vantaggi a seconda dei dati e dei requisiti. Se il modello è giusto, il parametrico usa pochi parametri e pochi campioni; se è sbagliato sbaglia anche con infiniti campioni. Il non parametrico si adatta a qualunque forma ma chiede più campioni e più calcolo.`,
    checklist: [
      'criterio: quanto è nota la sorgente (completamente, in parte, per niente)',
      'le tre categorie con il loro esempio: PAM, sonar, georadar',
      'focus del corso sulle categorie 2 e 3 e sulla stima della pdf',
      'albero degli approcci con le tre foglie per ramo',
      md`legame categoria 2 → parametrico ($\boldsymbol{\theta}$ di $r$ numeri), categoria 3 → non parametrico (intera funzione)`,
      'vantaggi e limiti dei due approcci',
    ],
    followUps: [
      { q: md`Quanti parametri ha una gaussiana in due feature?`, a: md`Due medie e tre elementi distinti della covarianza (due varianze e una covarianza): $r = 5$. In generale $r = n + \frac{n(n+1)}{2}$.` },
      { q: md`Perché la Rayleigh è adatta all'ampiezza di un'eco radar?`, a: md`L'ampiezza è il modulo di un vettore 2-D le cui componenti in fase e in quadratura sono gaussiane indipendenti a media nulla e stessa varianza: quel modulo segue una Rayleigh, definita solo per valori positivi e con un solo parametro di scala.` },
      { q: md`Se ho 30 campioni e so che il rumore di un sensore è gaussiano, quale approccio scelgo?`, a: md`Parametrico: conosco la forma e 30 campioni bastano a stimare media e varianza. Un metodo non parametrico con 30 campioni darebbe una stima molto più rumorosa.` },
    ],
  },
  {
    id: 'or-canale-pam',
    q: md`Descrivi l'esempio del canale PAM con cui le note aprono il capitolo: che cosa succede nel caso ideale e che cosa cambia con il rumore? Perché mostra che servono le densità di probabilità?`,
    qEn: 'Describe the PAM channel example that opens the chapter in the notes: what happens in the ideal case and what changes with noise? Why does it show that probability densities are needed?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Il sistema.** Una sorgente discreta emette tre simboli, Yes, No e Maybe, che devono attraversare un canale di comunicazione fino al ricevitore. Al trasmettitore un modulatore PAM (*Pulse Amplitude Modulation*) trasforma ogni simbolo in un impulso rettangolare di durata $T$, la cui ampiezza porta l'informazione: $0.25$ per Yes, $0.5$ per Maybe, $0.75$ per No. Al ricevitore un campionatore preleva un valore da ogni impulso: le note dicono «every x.5T», che si legge come il centro di ogni impulso, negli istanti $t_j = (j + 0.5)T$.

**Caso ideale.** Senza rumore il classificatore è immediato: se il campione vale $0.25$ decido Yes, se vale $0.5$ Maybe, se vale $0.75$ No. Il valore campionato $Y_s$ è una variabile aleatoria discreta con tre valori; con simboli equiprobabili ciascuno ha probabilità a priori $1/3$. Le probabilità condizionate valgono 0 oppure 1: $P(Y_s\mid\text{Yes}) = 1$ se $Y_s = 0.25$ e 0 altrimenti. Nessuna incertezza, niente da stimare.

**Con il rumore.** Un sistema reale ha rumore di canale, gaussiano e additivo: $y = x + n$ con $n \sim \mathcal{N}(0, \sigma_n^2)$. I valori ricevuti si scostano da quelli nominali e il classificatore a valori esatti non funziona più. Però conosco le due distribuzioni: $x$ è discreta (tre valori, ha una distribuzione di probabilità), $n$ è continua. La somma di una discreta e di una continua indipendenti è continua, quindi $y$ ha una densità, e quella densità è la convoluzione tra la distribuzione di $x$ e la densità di $n$:

$$p_y(y) = \sum_{i=1}^{3} P_x(a_i)\,p_n(y - a_i) = \frac{1}{3}\sum_{i=1}^{3} p_n(y - a_i)$$

una mistura di tre gaussiane. La densità condizionata $p(y\mid\text{Yes})$ è una gaussiana centrata in $0.25$ con dispersione data dal rumore, e così le altre.

**Classificatore a soglie.** Decido il simbolo con la verosimiglianza più alta, $\hat{s}(y) = \arg\max_s p(y\mid s)$. Su un asse si traduce in due soglie, dove le campane adiacenti si incrociano: con prior uguali e stessa varianza cadono a metà, in $0.375$ e $0.625$. Ogni simbolo estremo sbaglia da un lato solo, quello centrale da due, quindi

$$P_e = \frac{4}{3}\,Q\left(\frac{0.125}{\sigma_n}\right)$$

che vale circa $0.83\%$ con $\sigma_n = 0.05$ e circa $14\%$ con $\sigma_n = 0.1$.

**Perché servono le densità.** Per piazzare le soglie servono le densità condizionate $p(y\mid s)$. Nell'esempio delle note sono note: si conoscono le leggi di $x$ e di $n$ («we know the distribution of both x and n») e basta la convoluzione, senza stimare nulla. Quando invece non sono note (per esempio $\sigma_n$ incognita, o forma del rumore ignota) vanno stimate dai campioni ricevuti: è il motivo per cui il capitolo studia la stima della pdf. Con prior diversi le soglie si spostano verso il simbolo meno probabile, di $\frac{\sigma_n^2}{a_2 - a_1}\ln\frac{P_1}{P_2}$: è già il criterio MAP.`,
    checklist: [
      'sorgente a tre simboli, PAM con ampiezze 0.25, 0.5, 0.75, campionamento al centro dell’impulso',
      md`caso ideale: $Y_s$ discreta, prior $1/3$, condizionate 0 o 1, classificatore a valori esatti`,
      md`rumore gaussiano additivo $y = x + n$ e fallimento del classificatore a valori esatti`,
      'discreta + continua = continua: densità di y come convoluzione, mistura di tre gaussiane',
      md`soglie $0.375$ e $0.625$ dalla massima verosimiglianza e probabilità d'errore`,
      'nell’esempio le densità condizionate sono note (convoluzione); quando non lo sono vanno stimate: motivazione del capitolo',
    ],
    followUps: [
      { q: md`Se il rumore è molto grande, quanto vale al massimo la probabilità d'errore?`, a: md`Con $\sigma_n \to +\infty$ la funzione $Q$ tende a $\frac{1}{2}$ e $P_e \to \frac{4}{3}\cdot\frac{1}{2} = \frac{2}{3}$: lo stesso errore di chi tira a indovinare fra tre simboli.` },
      { q: md`Oltre quale $\sigma_n$ la densità di $y$ smette di avere tre gobbe?`, a: md`Circa $\sigma_n = 0.121$: oltre, le tre campane distanti $0.25$ si fondono e la mistura perde i due avvallamenti.` },
      { q: md`Nel caso ideale, se i prior diventano $0.5$, $0.3$, $0.2$, che cosa cambia?`, a: md`Cambiano le probabilità dei valori campionati, $P(Y_s = 0.25) = 0.5$ e così via, perché con condizionate 0 o 1 la distribuzione di $Y_s$ coincide con quella dei simboli. Le condizionate e la regola di decisione restano identiche.` },
    ],
  },
  {
    id: 'or-verosimiglianza',
    q: md`Nella stima parametrica, che cosa sono il vettore dei parametri e la funzione di verosimiglianza? Commenta l'esempio grafico della slide con tre pannelli (campioni e candidate, verosimiglianza, log-verosimiglianza).`,
    qEn: 'In parametric estimation, what are the parameter vector and the likelihood function? Comment on the three-panel example of the slide (samples and candidates, likelihood, log-likelihood).',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Parametri.** Assumo che il modello di $p(\mathbf{x})$ sia caratterizzato da $r$ parametri, il vettore $\boldsymbol{\theta} = (\theta_1, \theta_2, \dots, \theta_r)$; scrivo $p(\mathbf{x}\mid\boldsymbol{\theta})$ per sottolineare la dipendenza. Al variare di $\boldsymbol{\theta}$ ottengo una famiglia di pdf della stessa forma, e stimare la pdf diventa stimare un punto nello spazio $r$-dimensionale dei parametri. Per una gaussiana 1-D $r = 2$, media e varianza.

**Verosimiglianza.** Con $\mathbf{X} = \{\mathbf{x}_1, \dots, \mathbf{x}_N\}$ campioni iid definisco

$$p(\mathbf{X}\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})$$

Il prodotto viene dall'indipendenza: la congiunta si fattorizza nelle marginali, tutte uguali per l'identica distribuzione. È la verosimiglianza di $\boldsymbol{\theta}$ rispetto ai campioni, una misura di compatibilità tra $\boldsymbol{\theta}$ e $\mathbf{X}$: quanto bene il modello spiega i dati. Analizzandola trovo i parametri che con maggiore probabilità hanno generato i campioni.

**Pannello superiore.** Asse $x$ da 1 a 7: dodici campioni 1-D, fra circa $1.9$ e $4.8$, e quattro gaussiane tratteggiate con la stessa larghezza ($\sigma \approx 1$) e medie $2.5$, $3$, $3.5$, $5$. Sono quattro delle infinite candidate $p(x\mid\theta)$, con $\theta$ la media incognita e varianza nota. La candidata centrata in 5 lascia quasi tutti i campioni in coda: è poco compatibile.

**Pannello centrale.** In ascissa c'è $\theta$, in ordinata $p(\mathbf{X}\mid\theta)$: ogni punto è il prodotto delle 12 densità calcolate con quel $\theta$. È una campana stretta, quasi nulla fuori da $2 \lt \theta \lt 4$, con massimo di circa $1.5\times 10^{-7}$ in $\hat{\theta} \approx 3.1$, la media campionaria. Dai conti:

$$p(\mathbf{X}\mid\theta) = p(\mathbf{X}\mid\bar{x})\,\exp\left(-\frac{(\theta - \bar{x})^2}{2\,\sigma^2/N}\right)$$

quindi la campana ha deviazione standard $\sigma/\sqrt{N} = 1/\sqrt{12} \approx 0.29$: più campioni, picco più stretto.

**Pannello inferiore.** $l(\theta) = \ln p(\mathbf{X}\mid\theta)$ è una parabola concava con il massimo, circa $-15.7$, nello stesso $\hat{\theta}$:

$$l(\theta) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k - \theta)^2$$

Il logaritmo è monotono crescente e non sposta il massimo; trasforma il prodotto in somma e la campana strettissima in una parabola leggibile.

**Due letture della stessa espressione.** Nel pannello superiore $\theta$ è fisso e la curva, funzione di $x$, è una pdf di area 1. Nei pannelli sotto i campioni sono fissi e la curva è funzione di $\theta$: non è una densità, la sua area qui vale circa $1.07\times 10^{-7}$, e non è la probabilità che $\theta$ sia vero.

**Ordini di grandezza.** Valori dell'ordine di $10^{-7}$ con soli 12 campioni: il prodotto di $N$ densità decresce in modo esponenziale con $N$ e con centinaia di campioni va in underflow. Il logaritmo porta tutto fra $-15$ e $-100$.`,
    checklist: [
      md`vettore $\boldsymbol{\theta}$ di $r$ parametri e notazione $p(\mathbf{x}\mid\boldsymbol{\theta})$`,
      'formula della verosimiglianza, perché è un prodotto, significato di compatibilità',
      'pannello superiore: campioni e quattro candidate con varianza nota e media incognita',
      md`pannello centrale: campana stretta in $\theta$, massimo $\approx 1.5\times 10^{-7}$ nella media campionaria, larghezza $\sigma/\sqrt{N}$`,
      'pannello inferiore: log-verosimiglianza parabolica con lo stesso massimo',
      md`pdf in $x$ di area 1 contro verosimiglianza in $\theta$ che non è una densità`,
      'ordini di grandezza e motivo pratico del logaritmo',
    ],
    followUps: [
      { q: md`Quanto vale la curvatura della log-verosimiglianza nel massimo, e che cosa significa?`, a: md`$-\frac{d^2 l}{d\theta^2} = \frac{N}{\sigma^2} = 12$ nell'esempio. È l'informazione di Fisher: più la parabola è curva, più i dati localizzano $\theta$ e più bassa è la varianza minima della stima, $\sigma^2/N$.` },
      { q: md`Perché la verosimiglianza non può superare circa $1.6\times 10^{-5}$ nell'esempio?`, a: md`Con $\sigma = 1$ ogni fattore vale al più $\frac{1}{\sqrt{2\pi}} \approx 0.399$, quindi il prodotto di 12 fattori non supera $0.399^{12} = e^{-11.03} \approx 1.6\times 10^{-5}$. Il resto dell'ordine di grandezza viene dagli scarti dei campioni.` },
      { q: md`Se raddoppio i campioni, che cosa succede ai pannelli centrale e inferiore?`, a: md`Il picco della verosimiglianza si stringe di un fattore $\sqrt{2}$ e scende di molti ordini di grandezza; la parabola della log-verosimiglianza diventa due volte più curva.` },
    ],
  },
  {
    id: 'or-mle-contro-be',
    q: md`Quali sono le due procedure principali per stimare il vettore dei parametri? In che cosa differiscono e quando danno la stessa soluzione?`,
    qEn: 'What are the two main procedures to estimate the parameter vector? How do they differ, and when do they give the same solution?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Le due procedure.** Stima a massima verosimiglianza (*Maximum Likelihood Estimation*, MLE) e stima bayesiana (*Bayesian Estimation*, BE). Partono entrambe dalla verosimiglianza $p(\mathbf{X}\mid\boldsymbol{\theta})$, ma interpretano $\boldsymbol{\theta}$ in modo diverso.

**MLE.** $\boldsymbol{\theta}$ è un vettore di quantità con valori fissi ma incogniti. La stima migliore è quella che massimizza la probabilità di ottenere i campioni effettivamente osservati:

$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X}\mid\boldsymbol{\theta})$$

**BE.** I parametri sono variabili aleatorie con una distribuzione a priori nota. L'osservazione dei campioni la trasforma in una densità a posteriori, con il teorema di Bayes:

$$p(\boldsymbol{\theta}\mid\mathbf{X}) = \frac{p(\mathbf{X}\mid\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\int p(\mathbf{X}\mid\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,d\boldsymbol{\theta}}$$

Così combino la conoscenza a priori con l'informazione dei dati.

**Differenze.**

- Natura dei parametri: per la MLE una costante da stimare; per la BE una variabile aleatoria, che riflette l'incertezza e incorpora la conoscenza a priori.
- Obiettivo: la MLE ottimizza una funzione obiettivo basata solo sui dati osservati; la BE combina dati e prior e produce una densità a posteriori, una descrizione probabilistica completa dell'incertezza sul parametro.
- Risultato: un punto nello spazio dei parametri contro una distribuzione. Per la densità dei dati la BE integra su $\boldsymbol{\theta}$: $p(\mathbf{x}\mid\mathbf{X}) = \int p(\mathbf{x}\mid\boldsymbol{\theta})\,p(\boldsymbol{\theta}\mid\mathbf{X})\,d\boldsymbol{\theta}$.

Scelgo in base al problema e ai dati: se ho una conoscenza a priori affidabile e pochi campioni la BE la sfrutta; se non ho un prior credibile la MLE è più semplice, costa meno calcolo ed è più facile da interpretare.

**Quando coincidono.** Nel limite di infiniti campioni di training oppure con prior $p(\boldsymbol{\theta})$ uniforme. Con prior costante $p(\boldsymbol{\theta}\mid\mathbf{X}) \propto p(\mathbf{X}\mid\boldsymbol{\theta})$ e il massimo è lo stesso. Con molti campioni la verosimiglianza diventa un picco che domina il prior. Nell'esempio gaussiano con $\sigma$ nota e prior $\mathcal{N}(\mu_0, \sigma_0^2)$ la media a posteriori è

$$\mu_N = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\,\bar{x} + \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\,\mu_0$$

e tende a $\bar{x} = \hat{\theta}_{ML}$ sia per $N \to +\infty$ sia per $\sigma_0 \to +\infty$. Con $N = 12$, $\bar{x} = 3.13$, $\sigma = 1$, $\mu_0 = 5$, $\sigma_0 = 0.5$ il peso dei dati è $3/4$ e $\mu_N \approx 3.60$; con $N = 1200$ diventa $3.136$, praticamente la stima ML. Anche con prior uniforme la densità predittiva bayesiana resta più larga, $\mathcal{N}\left(\bar{x}, \sigma^2(1 + 1/N)\right)$ contro $\mathcal{N}(\bar{x}, \sigma^2)$.`,
    checklist: [
      'le due procedure e la verosimiglianza come punto di partenza comune',
      md`MLE: $\boldsymbol{\theta}$ fisso ma incognito, formula con $\arg\max$`,
      'BE: parametri aleatori, prior noto, posterior con il teorema di Bayes',
      'differenze su natura dei parametri, obiettivo e risultato',
      'criteri di scelta: prior affidabile, numero di campioni, costo, interpretabilità',
      md`coincidenza per $N \to +\infty$ o prior uniforme, con l'esempio numerico di $\mu_N$`,
    ],
    followUps: [
      { q: md`Nella BE qual è la stima puntuale del parametro, se me ne serve una?`, a: md`Il massimo del posterior (stima MAP) o la sua media; per il posterior gaussiano coincidono in $\mu_N$.` },
      { q: md`Che cosa succede alla varianza a posteriori al crescere di $N$?`, a: md`$\sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2 + \sigma^2}$ va a zero come $\sigma^2/N$: il posterior si stringe attorno a $\bar{x}$ e l'incertezza sul parametro sparisce.` },
      { q: md`Un prior sbagliato rovina per sempre la stima bayesiana?`, a: md`No, se non è nullo attorno al valore vero: con abbastanza campioni la verosimiglianza domina. A $N$ piccolo invece la tira verso $\mu_0$.` },
    ],
  },
  {
    id: 'or-bonta-bias-varianza',
    q: md`Come si misura la bontà di una stima? Definisci errore di stima, bias, varianza e stima ideale.`,
    qEn: 'How is the goodness of an estimate measured? Define estimation error, bias, variance and ideal estimate.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**La stima è aleatoria.** La stima del vettore dei parametri dipende dalle osservazioni, $\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\mathbf{X})$: se cambio il training set cambia la stima. Quindi $\hat{\boldsymbol{\theta}}$ è un vettore aleatorio e ha senso chiedersi quanto vale in media e quanto oscilla.

**Errore di stima.**

$$\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta} = \boldsymbol{\varepsilon}(\mathbf{X}, \boldsymbol{\theta}) = \left[\hat{\theta}_i - \theta_i : i = 1, \dots, r\right]$$

Dipende dai campioni e dal valore vero, e ha una componente per parametro.

**Stima ideale.** Ogni errore $\varepsilon_i$ dovrebbe essere non polarizzato e senza varianza: $E\{\varepsilon_i\} = 0$ e $\operatorname{var}\{\varepsilon_i\} = 0$. In pratica ottenerli insieme è difficile, ma sono i riferimenti per confrontare i metodi.

**Bias.** È il valore medio dell'errore. Lo stimatore è non polarizzato se

$$E\{\boldsymbol{\varepsilon}\} = 0 \;\Rightarrow\; E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$$

perché $E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}$, con $\boldsymbol{\theta}$ costante. In media lo stimatore centra il valore vero.

**Varianza.**

$$\operatorname{var}\{\varepsilon_i\} = E\left\{\left(\hat{\theta}_i - \overline{\hat{\theta}}_i\right)^2\right\},\qquad i = 1, \dots, r$$

con $\overline{\hat{\theta}}_i$ la media della stima. Misura quanto la stima si disperde attorno alla propria media; coincide con la varianza di $\hat{\theta}_i$ perché $\theta_i$ è una costante.

**Perché servono tutti e due.** L'errore quadratico medio si scompone:

$$E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + \left(E\{\varepsilon_i\}\right)^2$$

(il doppio prodotto sparisce perché lo scarto dalla media ha media nulla). Nessuno dei due criteri basta da solo: lo stimatore costante $\hat{\theta} = c$ ha varianza nulla ma bias $c - \theta$; il solo primo campione $x_1$ come stima della media è non polarizzato ma ha varianza $\sigma^2$ che non scende mai.

**Esempio.** Per campioni iid con varianza $\sigma^2$: la media campionaria ha bias 0 e varianza $\sigma^2/N$. Lo stimatore della varianza $\frac{1}{N}\sum_k (x_k - \bar{x})^2$ ha media $\frac{N-1}{N}\sigma^2$, bias $-\sigma^2/N$; con $\frac{1}{N-1}$ diventa non polarizzato.

**Poi.** La varianza di uno stimatore non polarizzato ha un pavimento, il bound di Cramér-Rao; e siccome gli stimatori reali sono spesso polarizzati, se ne studia il comportamento per $N \to +\infty$.`,
    checklist: [
      md`la stima $\hat{\boldsymbol{\theta}}(\mathbf{X})$ è un vettore aleatorio`,
      md`errore di stima $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$ con le sue componenti`,
      'stima ideale: non polarizzata e senza varianza',
      md`bias e non polarizzazione: $E\{\boldsymbol{\varepsilon}\} = 0 \Rightarrow E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$`,
      md`varianza con la media della stima $\overline{\hat{\theta}}_i$`,
      'scomposizione dell’errore quadratico medio e controesempi',
    ],
    followUps: [
      { q: md`Con $N = 5$ e $\sigma^2 = 4$, qual è il bias dello stimatore della varianza che divide per $N$?`, a: md`$-\frac{\sigma^2}{N} = -\frac{4}{5} = -0.8$: in media sottostima la varianza vera.` },
      { q: md`Perché dividere per $N$ sottostima la varianza?`, a: md`Gli scarti sono presi da $\bar{x}$, che è calcolata sugli stessi campioni ed è il punto che minimizza la somma dei quadrati: gli scarti da $\bar{x}$ sono in media più piccoli di quelli dalla media vera. Si perde un grado di libertà.` },
      { q: md`Una stima polarizzata può essere preferibile a una non polarizzata?`, a: md`Sì, se ha errore quadratico medio più basso: un piccolo bias con molta meno varianza può dare $E\{\varepsilon^2\}$ minore.` },
    ],
  },
  {
    id: 'or-cramer-rao',
    q: md`Enuncia il bound di Cramér-Rao e definisci la matrice di informazione di Fisher. Quando uno stimatore è efficiente? Fai un esempio.`,
    qEn: 'State the Cramér-Rao bound and define the Fisher information matrix. When is an estimator efficient? Give an example.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Enunciato.** Per giudicare la varianza di uno stimatore non polarizzato mi riferisco al bound di Cramér-Rao, un limite inferiore basato sull'informazione di Fisher:

$$\operatorname{var}\{\varepsilon_i\} \ge \left[\mathbf{I}^{-1}(\boldsymbol{\theta})\right]_{ii},\qquad i = 1, 2, \dots, r$$

La varianza dell'errore sul parametro $i$-esimo non scende sotto l'elemento diagonale $i$-esimo dell'inversa della matrice di Fisher.

**Matrice di Fisher.**

$$\mathbf{I}(\boldsymbol{\theta}) = E\left\{\nabla_{\boldsymbol{\theta}}\ln\left[p(\mathbf{X}\mid\boldsymbol{\theta})\right]\;\nabla_{\boldsymbol{\theta}}\ln\left[p(\mathbf{X}\mid\boldsymbol{\theta})\right]^{t}\right\},\qquad \left[\mathbf{I}(\boldsymbol{\theta})\right]_{ij} = E\left\{\frac{\partial \ln p(\mathbf{X}\mid\boldsymbol{\theta})}{\partial\theta_i}\cdot\frac{\partial \ln p(\mathbf{X}\mid\boldsymbol{\theta})}{\partial\theta_j}\right\}$$

Il valore atteso del prodotto esterno del gradiente della log-verosimiglianza con sé stesso. Se la log-verosimiglianza è molto sensibile a $\boldsymbol{\theta}$ i dati portano molta informazione sul parametro e il bound è basso. Con campioni iid la log-verosimiglianza è una somma, quindi $\mathbf{I}(\boldsymbol{\theta}) = N\,\mathbf{I}_1(\boldsymbol{\theta})$ e il bound cala come $1/N$.

**Ipotesi.** Lo stimatore è non polarizzato e il modello è regolare: supporto di $p(\mathbf{x}\mid\boldsymbol{\theta})$ indipendente da $\boldsymbol{\theta}$, derivabilità, possibilità di scambiare derivata e integrale. Senza la non polarizzazione il bound salta: $\hat{\theta} = c$ ha varianza zero.

**Efficienza.** Se la varianza raggiunge il bound,

$$\operatorname{var}\{\varepsilon_i\} = \left[\mathbf{I}^{-1}(\boldsymbol{\theta})\right]_{ii}$$

lo stimatore è efficiente: ha la varianza minima possibile tra gli stimatori non polarizzati.

**Esempio.** Letture iid gaussiane con $\sigma$ nota e media $\theta$ incognita. Derivo la log-verosimiglianza:

$$\frac{\partial \ln p(\mathbf{X}\mid\theta)}{\partial\theta} = \frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k - \theta)$$

Il quadrato della somma ha valore atteso $N\sigma^2$, perché i doppi prodotti fra campioni indipendenti a media nulla si annullano:

$$I(\theta) = \frac{1}{\sigma^4}\,E\left\{\left(\sum_{k=1}^{N}(x_k - \theta)\right)^2\right\} = \frac{N\sigma^2}{\sigma^4} = \frac{N}{\sigma^2}$$

Il bound è $\sigma^2/N$. La media campionaria è non polarizzata e ha varianza esattamente $\sigma^2/N$: è efficiente, ed è anche la stima ML. La mediana invece ha varianza asintotica $\frac{\pi\sigma^2}{2N}$, circa $1.57$ volte il bound: non è efficiente. Con $N = 12$ e $\sigma = 1$ la deviazione standard minima è $1/\sqrt{12} \approx 0.29$, la larghezza del picco della verosimiglianza nella slide.

**Forma equivalente.** $I(\theta) = -E\left\{\frac{\partial^2 \ln p(\mathbf{X}\mid\theta)}{\partial\theta^2}\right\}$: l'informazione è la curvatura media della log-verosimiglianza. Una parabola stretta localizza bene il parametro.`,
    checklist: [
      md`disuguaglianza $\operatorname{var}\{\varepsilon_i\} \ge [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}$ per stimatori non polarizzati`,
      'matrice di Fisher in forma matriciale ed elemento per elemento',
      md`additività con campioni iid: $\mathbf{I} = N\,\mathbf{I}_1$`,
      'definizione di stimatore efficiente',
      md`esempio: media gaussiana, $I(\theta) = N/\sigma^2$, media campionaria efficiente`,
      'legame con la curvatura della log-verosimiglianza',
    ],
    followUps: [
      { q: md`Perché ci vuole l'elemento diagonale dell'inversa e non l'inverso dell'elemento diagonale?`, a: md`Per una matrice definita positiva $[\mathbf{I}^{-1}]_{ii} \ge 1/[\mathbf{I}]_{ii}$: stimare anche gli altri parametri, correlati con $\theta_i$, può solo alzare il bound. $1/[\mathbf{I}]_{ii}$ sarebbe il bound se gli altri parametri fossero noti.` },
      { q: md`Il gradiente della log-verosimiglianza ha media nulla. Perché?`, a: md`$E\left\{\frac{\partial \ln p}{\partial\theta_i}\right\} = \int \frac{\partial p(\mathbf{x}\mid\boldsymbol{\theta})}{\partial\theta_i}\,d\mathbf{x} = \frac{\partial}{\partial\theta_i}\int p(\mathbf{x}\mid\boldsymbol{\theta})\,d\mathbf{x} = \frac{\partial}{\partial\theta_i}1 = 0$, scambiando derivata e integrale.` },
      { q: md`Con $\sigma = 2$ quanti campioni servono perché il bound sulla deviazione standard scenda a $0.1$?`, a: md`$\sigma/\sqrt{N} \le 0.1$ dà $N \ge 400$.` },
    ],
  },
  {
    id: 'or-proprieta-asintotiche',
    q: md`Perché si studiano le proprietà asintotiche di uno stimatore? Definisci non polarizzazione asintotica, efficienza asintotica e consistenza, con le condizioni per la consistenza.`,
    qEn: 'Why do we study the asymptotic properties of an estimator? Define asymptotic unbiasedness, asymptotic efficiency and consistency, with the conditions for consistency.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Perché.** In molti casi pratici gli stimatori sono polarizzati e inefficienti, e il loro comportamento dipende dal numero limitato di campioni di training e dalla loro qualità. Per confrontarli si assume un numero infinito di campioni e si guarda che cosa succede per $N \to +\infty$: uno stimatore è buono se ha proprietà asintotiche favorevoli.

**Non polarizzazione asintotica.**

$$\lim_{N\to+\infty} E\{\boldsymbol{\varepsilon}\} = 0 \;\Rightarrow\; \lim_{N\to+\infty} E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$$

Esempio: la varianza campionaria con $1/N$ ha bias $-\sigma^2/N$, che va a zero.

**Efficienza asintotica.**

$$\lim_{N\to+\infty} \frac{\operatorname{var}\{\varepsilon_i\}}{\left[\mathbf{I}^{-1}(\boldsymbol{\theta})\right]_{ii}} = 1,\qquad i = 1, \dots, r$$

Con molti campioni la varianza raggiunge il bound di Cramér-Rao.

**Consistenza.** Lo stimatore converge in probabilità al valore vero:

$$\lim_{N\to+\infty} P\{\lVert\boldsymbol{\varepsilon}\rVert < \delta\} = 1 \qquad \forall\,\delta > 0$$

Per quanto piccola scelga la tolleranza $\delta$, con abbastanza campioni l'errore sta sotto $\delta$ con probabilità vicina a 1.

**Condizioni.** Le note le chiamano necessarie: lo stimatore deve essere asintoticamente non polarizzato e la sua varianza deve tendere a zero,

$$\lim_{N\to+\infty} E\{\boldsymbol{\varepsilon}\} = 0,\qquad \lim_{N\to+\infty}\operatorname{var}\{\varepsilon_i\} = 0$$

Che bastino lo mostro con la disuguaglianza di Chebyshev:

$$P\{\vert\varepsilon_i\vert \ge \delta\} \le \frac{E\{\varepsilon_i^2\}}{\delta^2} = \frac{\operatorname{var}\{\varepsilon_i\} + \left(E\{\varepsilon_i\}\right)^2}{\delta^2} \xrightarrow[N\to+\infty]{} 0$$

Per il vettore sommo sulle componenti, $E\{\lVert\boldsymbol{\varepsilon}\rVert^2\} = \sum_i E\{\varepsilon_i^2\}$. A rigore sono sufficienti e non necessarie: esiste uno stimatore consistente con bias costante, che una volta su $N$ aggiunge $N$ alla media campionaria.

**Esempi.** Media campionaria: bias 0, varianza $\sigma^2/N$, consistente. Solo il primo campione: non polarizzato ma varianza $\sigma^2$ fissa, non consistente. Media più una costante $c \ne 0$: varianza che va a zero ma bias $c$, non consistente. Media più $1/N$: bias e varianza vanno a zero, consistente.

**Legame con la ML.** La stima ML è asintoticamente non polarizzata, asintoticamente efficiente e consistente: per questo la si usa così tanto. Le stesse idee valgono per Parzen e K-NN, dove la stima è la densità in un punto.`,
    checklist: [
      'motivazione: stimatori reali polarizzati e inefficienti, valutazione per N che tende a infinito',
      'non polarizzazione asintotica con formula ed esempio',
      'efficienza asintotica come rapporto con il bound che tende a 1',
      md`consistenza come convergenza in probabilità, con $\forall\,\delta > 0$`,
      'condizioni: bias asintotico nullo e varianza che tende a zero, prova con Chebyshev',
      'esempi di stimatori consistenti e non consistenti; proprietà della ML',
    ],
    followUps: [
      { q: md`Uno stimatore non polarizzato è sempre consistente?`, a: md`No: il primo campione $x_1$ come stima della media è non polarizzato, ma la sua varianza resta $\sigma^2$ per ogni $N$ e la probabilità di sbagliare di più di $\delta$ non va a zero.` },
      { q: md`Con Chebyshev, quanti campioni garantiscono $P\{\vert\bar{x} - \theta\vert \ge 0.5\} \le 0.05$ se $\sigma = 1$?`, a: md`$\frac{\sigma^2}{N\delta^2} = \frac{1}{0.25N} \le 0.05$ dà $N \ge 80$. È una garanzia prudente: con campioni gaussiani ne bastano molti meno.` },
      { q: md`Qual è la differenza tra consistenza e non polarizzazione asintotica?`, a: md`La non polarizzazione asintotica riguarda solo la media della stima; la consistenza riguarda tutta la distribuzione, che si deve concentrare attorno al valore vero. Serve anche la varianza che va a zero.` },
    ],
  },
  {
    id: 'or-overfitting',
    q: md`Che cos'è l'overfitting? Spiegalo con l'esempio del pesce e collegalo alla scelta della complessità del modello.`,
    qEn: 'What is overfitting? Explain it with the fish example and link it to the choice of model complexity.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**L'esempio.** Nello spazio 2-D delle feature (luminosità in ascissa, larghezza in ordinata) salmoni e spigole si separano bene ma non del tutto. Il classificatore lineare, una retta con due parametri (pendenza e intercetta), lascia ancora qualche pesce dalla parte sbagliata. Le note mostrano come si misura la bontà con un esempio di calcolo, non con un risultato di quella retta: se ci fossero 5 errori su 100 classificazioni, l'accuratezza sarebbe del $95\%$. Per fare meglio posso aggiungere feature o usare un classificatore più complesso. All'estremo c'è una curva molto tortuosa che serpeggia attorno ai singoli campioni e li mette tutti dalla parte giusta: zero errori sul training.

**Che cos'è.** Un modello molto flessibile migliora l'adattamento ai dati di training ma rischia l'overfitting: impara i dati di training troppo bene, compreso il rumore presente nelle feature e nelle etichette, che possono contenere errori umani. Memorizza i campioni invece di generalizzare a dati nuovi, mai visti. Su pesci nuovi la curva tortuosa sbaglia di più della retta, perché le sue anse inseguono dettagli del particolare training set.

**Il compromesso.** Non devo adattare troppo il classificatore ai campioni di training: serve un compromesso tra complessità del modello e capacità di generalizzazione. La regola pratica è partire da modelli semplici, che tendono a essere più robusti, e aumentare gradualmente la complessità (più feature o un classificatore non lineare) solo se non bastano. L'errore sul training scende sempre con la complessità; l'errore su dati nuovi scende e poi risale, a forma di U, e il modello giusto sta vicino al minimo.

**Come me ne accorgo.** Confronto l'errore sul training con quello su dati non usati per addestrare, per esempio con la cross-validation. Una differenza grande (zero errori sul training, molti sul test) è il segno dell'overfitting.

**Legame con la stima.** Lo stesso compromesso torna nella stima di densità: nelle finestre di Parzen un $h$ troppo piccolo e nel K-NN un $K$ troppo piccolo danno stime che inseguono i singoli campioni, cioè overfitting; valori troppo grandi sovra-lisciano. È il compromesso tra bias e varianza.`,
    checklist: [
      'esempio del pesce: retta con due parametri che sbaglia ancora qualche pesce, curva tortuosa con zero errori sul training',
      'come si calcola l’accuratezza (esempio delle note: 5 errori su 100 danno il 95%)',
      'definizione: il modello impara anche il rumore di feature ed etichette e memorizza invece di generalizzare',
      'compromesso tra complessità del modello e capacità di generalizzazione',
      'partire da modelli semplici e crescere gradualmente',
      'diagnosi con dati non usati per l’addestramento',
      'stesso compromesso nella stima non parametrica (h, K)',
    ],
    followUps: [
      { q: md`Il contrario dell'overfitting come si chiama?`, a: md`*Underfitting*: il modello è troppo semplice per la struttura dei dati e sbaglia molto sia sul training sia su dati nuovi.` },
      { q: md`Più dati di training aiutano contro l'overfitting?`, a: md`Sì: con più campioni il rumore dei singoli pesa meno e un modello flessibile ha meno spazio per memorizzarli. Per questo con più dati ci si può permettere un modello più complesso.` },
      { q: md`Perché le etichette possono essere rumorose?`, a: md`Le assegna una persona, che può sbagliare: un salmone etichettato come spigola. Una frontiera che lo mette dalla parte "giusta" impara l'errore.` },
    ],
  },
]
