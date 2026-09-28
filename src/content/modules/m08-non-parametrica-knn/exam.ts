// Domande d'orale del modulo m08 (stima non parametrica e K-NN): le sette della banca d'esame (testo verbatim in
// bankText) più sette domande sulle parti che Melgani chiede di più. Le risposte sono in prima persona, come le
// direbbe lo studente.
import { md } from '../../types'
import type { ExamQuestion } from '../../types'

export const exam: ExamQuestion[] = [
  // --- banca d'esame ---
  {
    id: 'or-banca-1',
    q: md`Stima K-NN: come funziona? Disegna un grafico di esempio e descrivi com'è la distribuzione stimata; che cosa vogliono dire *overfit* e *oversmooth*? Come funziona il classificatore K-NN (fai un esempio)? Infine: quali differenze ci sono con le finestre di Parzen?`,
    qEn: 'K-NN estimation: how does it work? Draw an example graph and describe what the estimated distribution looks like; what do overfitting and oversmoothing mean? How does the K-NN classifier work (give an example)? Finally, what are the differences with Parzen windows?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'K-NN estimation, how does it works, we draw a graph for example and asked how is the distribution, what does it mean overfit and oversmooth. Then he asked how the K-NN classifier works and made an example. Last question what are the difference with parzen window',
    answer: md`**Punto di partenza.** Voglio la pdf nel punto $\mathbf{x}^*$ senza un modello parametrico. Prendo una regione $R$ che contiene $\mathbf{x}^*$: se la pdf è continua e $R$ è piccola, $P_R \simeq p(\mathbf{x}^*)\,V$. Stimo $P_R$ con la frequenza relativa $K/N$ e ottengo $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$. Nella formula ci sono due parametri: il metodo dei $K$ vicini più prossimi (*K-nearest neighbor*, K-NN) fissa $K$ e ricava $V$ dai dati.

**Come funziona.** Le ipotesi sono due: $K$ è fissato a priori, e la forma della cella centrata in $\mathbf{x}^*$ è scelta a priori, di solito un'ipersfera (*hypersphere*). Allargo la cella finché contiene $K$ campioni di training, cioè fino al $K$-esimo vicino, e misuro il volume raggiunto $V_K(\mathbf{x}^*)$:

$$\hat{p}(\mathbf{x}^*) = \frac{K}{N\,V_K(\mathbf{x}^*)}$$

Il numeratore è costante: l'informazione sulla densità sta tutta nel volume. Dove i campioni sono fitti la cella resta piccola e la stima è alta; dove sono radi la cella si allarga e la stima scende. In 1-D la cella è un intervallo, $V_K = 2r_K$; in 2-D un cerchio, $V_K = \pi r_K^2$. Esempio: dieci luminosità di salmoni $2.1, 2.4, 2.5, 3.0, 3.2, 3.3, 3.9, 4.4, 5.0, 5.6$, $x^* = 3.1$ e $K = 3$. Il terzo vicino è $3.3$, quindi $r_3 = 0.2$, $V = 0.4$ e $\hat{p} = \frac{3}{10 \cdot 0.4} = 0.75$.

**Il grafico.** Disegno otto campioni su un asse e le stime con $K = 3$ e $K = 5$, come nella slide 48. In 1-D la curva è fatta di rami di iperbole $\frac{K}{2N\,\vert x - c \vert}$, dove $c$ è il $K$-esimo vicino. C'è una cuspide sopra ogni gruppo di $K$ campioni consecutivi, nel punto medio tra il primo e l'ultimo, alta $\frac{K}{N\,(x_{(i+K-1)} - x_{(i)})}$: il gruppo più stretto dà il picco più alto, e i picchi sono $N - K + 1$ (sei con $K = 3$, quattro con $K = 5$). I minimi angolosi cadono nei punti medi tra il campione che esce dalla cella e quello che entra. Quindi le discontinuità della pendenza cadono lontano dai campioni, come dice la nota della slide; la stima è continua, a saltare è la derivata. Le code scendono come $\frac{K}{2N\vert x \vert}$ e non arrivano mai a zero: l'area è infinita, e a rigore la stima non è una pdf.

**Overfit e oversmooth.** Con $K$ piccolo la cella è minuscola e la stima insegue le fluttuazioni dei singoli campioni: frastagliata, molto variabile, sensibile al rumore. È l'*overfitting* (alta varianza). Con $K$ grande la cella media su una zona larga: la stima si appiattisce, due mode vicine si fondono, perdo risoluzione. È l'*oversmoothing*, o *underfitting* (alto bias). I casi estremi sono $K = 1$, spilli che divergono sui campioni, e $K = N$, un'unica cuspide che cancella ogni struttura. $K$ è un iperparametro (*hyperparameter*): lo lego a $N$, per esempio $K = \sqrt{N}$, oppure lo scelgo per validazione.

**Classificatore K-NN.** Attorno al campione da classificare $\mathbf{x}$ allargo la cella fino a $K$ campioni di qualunque classe; $K_i$ sono della classe $\omega_i$, che ha $N_i$ campioni di training. Stimo $\hat{p}(\mathbf{x}\vert\omega_i) = \frac{K_i}{N_i V}$ e $\hat{P}(\omega_i) = \frac{N_i}{N}$, e con la regola di Bayes $V$ e $N_i$ si semplificano:

$$\hat{P}(\omega_i\vert\mathbf{x}) = \frac{\frac{K_i}{N_i V}\cdot\frac{N_i}{N}}{\frac{K}{NV}} = \frac{K_i}{K}$$

La regola MAP diventa un voto di maggioranza (*majority vote*) tra i $K$ vicini. Esempio: 50 pesci di training, 20 salmoni e 30 spigole. Con $K = 5$ il cerchio attorno al pesce ignoto ha area $0.8$ e contiene 4 salmoni e 1 spigola: $\hat{p}(\mathbf{x}\vert\text{salmone}) = \frac{4}{20 \cdot 0.8} = 0.25$ e $\hat{p}(\mathbf{x}\vert\text{spigola}) = \frac{1}{30 \cdot 0.8} \approx 0.042$. Con i prior $0.4$ e $0.6$ le posterior valgono $0.8$ e $0.2$: classifico salmone. Con due classi prendo $K$ dispari, così evito i pareggi.

**Differenze con Parzen.**

- Stessa formula $K/(NV)$, ruoli opposti: Parzen fissa la regione ($V = h^n$) e conta $K$; il K-NN fissa $K$ e misura $V$. Nella figura della slide 46: $V = 1/\sqrt{N}$ contro $K = \sqrt{N}$.
- L'iperparametro è $h$ per Parzen, $K$ per il K-NN.
- Il K-NN si adatta alla densità locale; in Parzen la finestra ha la stessa larghezza ovunque. Con $K = \sqrt{N}$ la cella K-NN vale circa $\frac{1}{\sqrt{N}\,p(\mathbf{x}^*)}$: la legge di Parzen, con un volume iniziale deciso dai dati.
- Parzen con un kernel liscio dà una stima liscia, meno sensibile al rumore e di area 1; con una finestra a supporto limitato può valere zero. Il K-NN dà una stima spigolosa, mai nulla, con code pesanti.
- Entrambi convergono alla pdf vera: il K-NN con $K_N \to +\infty$ e $K_N/N \to 0$, Parzen con $h_N \to 0$ e $N h_N^n \to +\infty$. A campione finito il comportamento è difficile da prevedere.`,
    checklist: [
      md`formula madre $K/(NV)$ e scelta del K-NN: $K$ fisso, $V$ ricavato dai dati`,
      md`ipotesi ($K$ e forma della cella a priori) e stima $\hat{p}(\mathbf{x}^*) = K/(N\,V_K(\mathbf{x}^*))$`,
      md`grafico 1-D: cuspidi nei punti medi dei gruppi di $K$ campioni, minimi angolosi tra i campioni, code come $1/\vert x \vert$`,
      md`*overfit* con $K$ piccolo (varianza) e *oversmooth* con $K$ grande (bias); $K$ come iperparametro`,
      md`classificatore: posterior $K_i/K$ e voto di maggioranza, con un esempio numerico`,
      md`differenze con Parzen: che cosa è fissato, iperparametro, adattività, stima liscia di area 1 contro stima spigolosa con code pesanti, convergenza`,
    ],
    followUps: [
      {
        q: md`Perché la stima K-NN non integra a 1?`,
        a: md`Lontano dai dati $r_K(x)$ cresce come $\vert x \vert$ e la stima scende come $\frac{K}{2N\vert x \vert}$: l'integrale di $1/\vert x \vert$ diverge in modo logaritmico. Su $[-L, L]$ l'area cresce circa come $\frac{K}{N}\ln L$. La stima resta buona localmente, ma non è una pdf normalizzata.`,
      },
      {
        q: md`La stima K-NN è non distorta?`,
        a: md`No. Con $K$ fisso il contenuto di probabilità della cella segue una legge $\mathrm{Beta}(K, N - K + 1)$ e il valore atteso della stima vale circa $\frac{K}{K-1}\,p(\mathbf{x}^*)$: $+25\%$ con $K = 5$. La dispersione relativa è circa $1/\sqrt{K}$. Entrambi i difetti spariscono solo se $K_N \to +\infty$. I passaggi sono nella dimostrazione [«il contenuto della cella è una variabile Beta»](#derivation:der09).`,
      },
      {
        q: md`Che cosa ipotizzi quando dici che la posterior vale $K_i/K$?`,
        a: md`Uso la stessa cella per tutte le classi, così $V$ si semplifica, e stimo i prior con $N_i/N$, cioè assumo che il training set rispecchi le proporzioni reali. Se conosco prior veri diversi, la posterior è proporzionale a $P(\omega_i)\,K_i/N_i$ e il voto va pesato.`,
      },
    ],
  },
  {
    id: 'or-banca-2',
    q: md`Che cos'è l'algoritmo EM e come funziona? Spiega la formula e i due passi, poi fai l'esempio della miscela di gaussiane. Infine: stima K-NN con un esempio.`,
    qEn: 'What is the EM algorithm and how does it work? Explain the formula and both steps, then give the Gaussian mixture example. Finally: K-NN estimation with an example.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'What is an EM algorithm and how does it work? Explain formula and both steps. Then Multi Gaussian example for EM algorithm. KNN and KNN example.',
    answer: md`**Il problema.** L'algoritmo EM (*Expectation-Maximization*) serve quando il modello dipende da variabili latenti non osservate: un problema con dati incompleti (*incomplete data*). L'approccio resta parametrico: voglio la stima ML di $\boldsymbol{\theta}$, ma massimizzare direttamente la log-verosimiglianza $l(\boldsymbol{\theta}) = \ln p(\mathbf{X}\vert\boldsymbol{\theta})$ non ha soluzione analitica. Suppongo che esista un dataset completo $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$, dove $\mathbf{X}$ è osservato e $\mathbf{Y}$ sono i dati mancanti.

**La formula.** EM calcola il valore atteso della log-verosimiglianza completa rispetto a $\mathbf{Y}$, dati $\mathbf{X}$ e la stima corrente $\boldsymbol{\theta}^{(k)}$:

$$Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{\log p(\mathbf{X}, \mathbf{Y}\vert\boldsymbol{\theta}) \,\middle\vert\, \mathbf{X}, \boldsymbol{\theta}^{(k)}\right\} = \int \log p(\mathbf{X}, \mathbf{y}\vert\boldsymbol{\theta})\,p(\mathbf{y}\vert\mathbf{X}, \boldsymbol{\theta}^{(k)})\,d\mathbf{y}$$

**I due passi.**

- Passo E: calcolo $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$, cioè tratto le variabili latenti come se fossero osservate, pesate con la loro distribuzione dati $\mathbf{X}$ e $\boldsymbol{\theta}^{(k)}$.
- Passo M: $\boldsymbol{\theta}^{(k+1)} = \arg\max_{\boldsymbol{\theta}} Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$, una stima ML sulla verosimiglianza attesa.

Con i parametri del passo M riparto dal passo E e ripeto fino a convergenza. A ogni iterazione la log-verosimiglianza non diminuisce, $l(\boldsymbol{\theta}^{(k+1)}) \ge l(\boldsymbol{\theta}^{(k)})$, ma nessuno garantisce il massimo globale: posso fermarmi in un massimo locale o in un punto di sella, quindi l'inizializzazione conta.

**Miscela di gaussiane.** Ho $N$ osservazioni i.i.d. da $p(\mathbf{x}) = \sum_{i=1}^{M} P_i\,p(\mathbf{x}\vert\mathbf{m}_i, \Sigma_i)$, con $\boldsymbol{\theta} = [P_1, \dots, P_M;\ \mathbf{m}_1, \dots, \mathbf{m}_M;\ \Sigma_1, \dots, \Sigma_M]$. I dati sono incompleti perché non so da quale modo viene ogni campione: so solo che i modi si sommano. Il passo E assegna a ogni campione $\mathbf{x}_j$ un peso per ogni modo, la sua probabilità a posteriori:

$$w_{ij}^{[k]} = \frac{P_i^{[k]}\,p(\mathbf{x}_j\vert\mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j\vert\boldsymbol{\theta}^{[k]})}$$

Il passo M ricalcola i parametri come medie pesate:

$$P_i^{[k+1]} = \frac{1}{N}\sum_{j=1}^{N} w_{ij}^{[k]}, \qquad \mathbf{m}_i^{[k+1]} = \frac{\sum_{j=1}^{N} w_{ij}^{[k]}\,\mathbf{x}_j}{\sum_{j=1}^{N} w_{ij}^{[k]}}, \qquad \Sigma_i^{[k+1]} = \frac{\sum_{j=1}^{N} w_{ij}^{[k]}\,(\mathbf{x}_j - \mathbf{m}_i^{[k+1]})(\mathbf{x}_j - \mathbf{m}_i^{[k+1]})^t}{\sum_{j=1}^{N} w_{ij}^{[k]}}$$

Nella slide 76 due simboli sono stampati diversamente: al numeratore dell'equazione dei prior compare $P_j^{[k]}$ e, nell'equazione di $\Sigma_i$, la gaussiana dentro il peso usa $\mathbf{m}_i^{[k+1]}$. Sono refusi: il prior al numeratore ha il pedice del modo, $i$, e i pesi sono gli stessi $w_{ij}^{[k]}$, calcolati con i parametri vecchi, in tutte e tre le equazioni. Con $\mathbf{m}_i^{[k+1]}$ nel peso i pesi non sommerebbero più a 1 sui modi. I dettagli sono nel [foglio sull'EM](/m/m10-em-dati-incompleti/teoria#le-equazioni-em-per-la-mistura-di-gaussiane).

Esempio: le luminosità dei pesci pescati in un giorno formano due gruppi, salmoni e spigole, ma i pesci non hanno etichetta. Parto da due gaussiane messe a caso; al passo E ogni pesce riceve due pesi che sommano a 1; al passo M ricalcolo prior, medie e varianze pesando ogni pesce. Dopo poche iterazioni le due gaussiane si posano sui due gruppi. La slide 77 mostra un altro caso di dati incompleti: quattro punti 2-D, uno dei quali senza la componente $x_1$; le ellissi numerate sono le gaussiane stimate nelle iterazioni successive, che si stabilizzano in pochi passi.

**Stima K-NN.** È un metodo non parametrico: fisso $K$ e la forma della cella, allargo la cella attorno a $\mathbf{x}^*$ fino al $K$-esimo campione di training e uso $\hat{p}(\mathbf{x}^*) = \frac{K}{N\,V_K(\mathbf{x}^*)}$. Esempio con dieci luminosità di salmoni, $2.1, 2.4, 2.5, 3.0, 3.2, 3.3, 3.9, 4.4, 5.0, 5.6$:

- zona densa, $x^* = 3.1$: con $K = 3$ il terzo vicino dista $0.2$, $V = 0.4$ e $\hat{p} = 0.75$; con $K = 5$ il quinto dista $0.7$, $V = 1.4$ e $\hat{p} \approx 0.357$;
- zona rada, $x^* = 5.3$: con $K = 3$, $V = 1.8$ e $\hat{p} \approx 0.167$; con $K = 5$, $V = 4$ e $\hat{p} = 0.125$.

In 2-D con cella circolare, $N = 200$, $K = 5$ e quinto vicino a distanza $0.4$: $V = \pi \cdot 0.4^2 \approx 0.503$ e $\hat{p} \approx 0.0497$. La stima è più bassa dove devo andare lontano per trovare $K$ vicini, ma non vale mai zero.`,
    checklist: [
      md`dati incompleti e variabili latenti, dataset completo $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$`,
      md`funzione $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ come valore atteso condizionato della log-verosimiglianza completa`,
      md`passo E e passo M, iterazione, $l(\boldsymbol{\theta})$ che non decresce, rischio di massimi locali`,
      md`miscela di gaussiane: parametri $P_i$, $\mathbf{m}_i$, $\Sigma_i$ e pesi a posteriori`,
      md`equazioni di aggiornamento come medie pesate`,
      md`K-NN: $K$ fisso, cella allargata, $K/(N\,V_K)$ con un esempio numerico`,
    ],
    followUps: [
      {
        q: md`Perché per la miscela serve EM e non basta annullare le derivate?`,
        a: md`La log-verosimiglianza della miscela è $\sum_j \ln \sum_i P_i\,p(\mathbf{x}_j\vert\mathbf{m}_i, \Sigma_i)$, il logaritmo di una somma: annullando le derivate non ottengo una soluzione chiusa. Se sapessi da quale modo viene ogni campione, stimerei ogni gaussiana separatamente con ML. EM sostituisce questa informazione mancante con il suo valore atteso.`,
      },
      {
        q: md`Nell'esempio K-NN, perché passando da $K = 3$ a $K = 5$ la stima in $3.1$ scende da $0.75$ a $0.357$?`,
        a: md`La cella deve raccogliere due campioni in più e arriva fino a $2.4$, in una zona meno densa: il volume passa da $0.4$ a $1.4$, cioè cresce più del numeratore. È la direzione dell'*oversmoothing*.`,
      },
      {
        q: md`EM e K-NN sono metodi dello stesso tipo?`,
        a: md`No. EM è parametrico: stima i parametri di una miscela di forma nota. Il K-NN è non parametrico: stima il valore della pdf punto per punto direttamente dai campioni, senza assumere una forma.`,
      },
    ],
  },
  {
    id: 'or-banca-3',
    q: md`Spiega la stima non parametrica: che cosa vuol dire e perché la usiamo. Spiega K-NN e finestre di Parzen: tendono alla soluzione ottima? Poi spiega la stima ML, sviluppa la derivata prima per una gaussiana e spiega il significato del risultato. Infine spiega il *box classifier*.`,
    qEn: 'Explain non-parametric estimation: what non-parametric means and why we use it. Explain both K-NN and Parzen windows: do they tend to the optimal solution? Explain ML estimation, develop the first derivative for a Gaussian and explain the meaning of the result. Finally, explain the box classifier.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Explain non-parametric estimation, what non-parametric means and why we use it, explain both KNN and Parzen windows, do they tend to the optimal solution? Explain ML estimation, develop the first derivative for a gaussian and explain the meaning of the result. Explain box classifier',
    answer: md`**Che cosa vuol dire.** Nei metodi parametrici assumo una forma funzionale (gaussiana, Poisson...) e stimo il suo vettore di parametri $\boldsymbol{\theta}$ con ML o con Bayes. Nella stima non parametrica (*nonparametric estimation*) non fisso nessuna forma: stimo direttamente il valore della pdf $p(\mathbf{x}^*)$ nei punti che mi interessano, usando i campioni di training. «Non parametrica» non vuol dire senza parametri da scegliere: $K$ o $h$ vanno scelti.

**Perché la uso.** La slide 41 dà due casi: non ho conoscenza a priori sulla forma funzionale della pdf, oppure i modelli parametrici non la approssimano bene, come una densità bimodale approssimata con una sola gaussiana. Questi metodi si applicano direttamente alle osservazioni (*data-driven*) e sono flessibili; il prezzo è più calcolo e più dati, perché ogni valutazione usa tutti i campioni.

**La base comune.** Se la pdf è continua e la regione $R$ attorno a $\mathbf{x}^*$ è piccola, $P_R = \int_R p(\mathbf{x})\,d\mathbf{x} \simeq p(\mathbf{x}^*)\,V$. Stimo $P_R$ con la frequenza relativa $K/N$, consistente per la legge dei grandi numeri, e ottengo

$$\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$$

$R$ deve essere abbastanza grande da contenere molti campioni e abbastanza piccola perché $p$ non vari al suo interno.

**K-NN.** Fisso $K$ e la forma della cella, allargo la cella fino al $K$-esimo vicino e misuro il volume: $\hat{p}(\mathbf{x}^*) = \frac{K}{N\,V_K(\mathbf{x}^*)}$.

**Parzen.** Fisso la regione, un ipercubo di lato $h$ e volume $V = h^n$, e conto i campioni con la funzione finestra $\gamma$, che vale 1 dentro l'ipercubo unitario e 0 fuori: $K = \sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right)$. Con un kernel qualsiasi, per esempio gaussiano, $\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\,\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$.

**Tendono alla soluzione ottima?** Sì, asintoticamente: entrambi convergono alla pdf vera nei punti in cui è continua, se la regione dipende da $N$ nel modo giusto.

- K-NN: $\lim_{N\to+\infty} K_N = +\infty$ e $\lim_{N\to+\infty} K_N/N = 0$, condizione necessaria e sufficiente; esempio $K_N = \sqrt{N}$.
- Parzen: $\lim_{N\to+\infty} h_N = 0$ e $\lim_{N\to+\infty} N h_N^n = +\infty$; esempio $h_N = 1/\sqrt[2n]{N}$, che dà $V_N = 1/\sqrt{N}$ come nella figura della slide 46.

In entrambi i casi una condizione stringe la regione (niente bias) e l'altra ci mette sempre più campioni (niente varianza). A campione finito, però, il comportamento è difficile da prevedere: nella figura della slide 50, con $N = 256$, la stima K-NN è ancora rumorosa.

**Stima ML e derivata per la gaussiana.** Con campioni i.i.d. scelgo i parametri che massimizzano la log-verosimiglianza, $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \sum_{k=1}^{N}\ln p(\mathbf{x}_k\vert\boldsymbol{\theta})$. Per una gaussiana con $\Sigma$ nota e media incognita

$$\ln p(\mathbf{x}_k\vert\boldsymbol{\mu}) = -\frac{1}{2}\ln\left[(2\pi)^n\vert\Sigma\vert\right] - \frac{1}{2}(\mathbf{x}_k - \boldsymbol{\mu})^t\,\Sigma^{-1}(\mathbf{x}_k - \boldsymbol{\mu})$$

$$\nabla_{\boldsymbol{\mu}}\, l = \sum_{k=1}^{N}\Sigma^{-1}(\mathbf{x}_k - \boldsymbol{\mu}) = \mathbf{0} \;\Rightarrow\; \hat{\boldsymbol{\mu}} = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k$$

Il significato: la stima ML della media è la media campionaria, il baricentro dei campioni, ed è non distorta. In 1-D con varianza incognita la derivata rispetto a $\sigma^2$ dà $\hat{\sigma}^2 = \frac{1}{N}\sum_{k}(x_k - \hat{\mu})^2$, distorta del fattore $\frac{N-1}{N}$ ma asintoticamente non distorta.

**Box classifier.** A differenza del classificatore a minima distanza dalla media (MDM), sfrutta le statistiche del secondo ordine, anche se in modo primitivo. Modella ogni classe con una pdf uniforme centrata sul baricentro della classe, con lati proporzionali alla deviazione standard lungo ogni feature. I box che ne escono sono le regioni di decisione: assegno un campione ignoto alla classe del box che lo contiene. Restano zone non coperte da nessun box e zone ambigue dove i box si sovrappongono.`,
    checklist: [
      md`non parametrica: niente forma funzionale, stima diretta della pdf dai campioni`,
      md`i due casi d'uso della slide 41, *data-driven* e costo della flessibilità`,
      md`formula madre $K/(NV)$ e le due letture: K-NN ($K$ fisso) e Parzen ($V$ fisso)`,
      md`convergenza: condizioni su $K_N$ e su $h_N$ con esempi, bias e varianza, limite a campione finito`,
      md`ML per la gaussiana: derivata della log-verosimiglianza, $\hat{\boldsymbol{\mu}}$ = media campionaria`,
      md`box classifier: pdf uniforme sul baricentro, lati proporzionali alla deviazione standard, box come regioni di decisione`,
    ],
    followUps: [
      {
        q: md`Perché nel K-NN non basta $K_N/N \to 0$?`,
        a: md`$K$ costante soddisfa $K_N/N \to 0$, ma la dispersione relativa della stima non scende a zero: per $N$ grande resta circa $1/\sqrt{K}$, con $K = 5$ circa il 58%. La curva resta frastagliata per sempre. Serve anche $K_N \to +\infty$.`,
      },
      {
        q: md`La condizione $K_N/N \to 0$ è indipendente da $V_N \to 0$?`,
        a: md`No. La stima è il rapporto $\frac{K_N/N}{V_N}$ e deve tendere a un valore finito: se $V_N \to 0$, anche $K_N/N$ deve andare a zero. Letta al contrario, nel K-NN $K_N/N \to 0$ fa tendere a zero il volume $V_N \simeq \frac{K_N}{N\,p(\mathbf{x})}$ nei punti con $p > 0$.`,
      },
      {
        q: md`Che cosa succede nei punti in cui la pdf vera ha un salto?`,
        a: md`La convergenza è garantita solo nei punti di continuità. Nella figura della slide 50 la densità bimodale ha i bordi verticali del rettangolo: lì la stima a $N$ finito è peggiore e la convergenza non è assicurata.`,
      },
    ],
  },
  {
    id: 'or-banca-4',
    q: md`Finestre di Parzen: contesto generale (che cosa vogliamo fare, perché è una stima non parametrica), kernel gaussiano a simmetria sferica con formula e un disegno, effetto della scelta della larghezza sulla stima. È una buona stima? (Bias, varianza e condizioni sulla larghezza per avere una stima consistente.)`,
    qEn: 'Parzen windows: general context (what we want to do, why it is a non-parametric estimation), the Gaussian kernel with spherical symmetry with its formula and a drawing, how the choice of the width affects the estimate. Is it a good estimate? (Bias, variance and the conditions on the width for a consistent estimate.)',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Parzen Windows: general context (what we want to do, why they are non parametric estimation), gaussian kernel with spherical symmetry with formula and some drawing to represent it, How the choice of the width impacts our estimate? Is it a good estimate? (Bias, variance and consideration about the characteristics of the width to have a consistent estimate)',
    answer: md`**Contesto.** Voglio la pdf di un fenomeno senza conoscerne la forma: nessun modello parametrico, quindi nessun vettore $\boldsymbol{\theta}$ da stimare. Parto dai campioni: se la pdf è continua e la regione $R$ attorno a $\mathbf{x}^*$ è piccola, $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$. Parzen fissa la regione e conta i campioni: con un ipercubo di lato $h$, $V = h^n$ e la funzione finestra $\gamma$ (1 dentro l'ipercubo unitario, 0 fuori),

$$K = \sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right), \qquad \hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{V}\,\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$$

Poiché $\gamma$ è pari, la stessa somma si legge come una finestra centrata su ogni campione. Sostituendo il rettangolo con un kernel generale, ogni campione contribuisce secondo la sua distanza da $\mathbf{x}$: la finestra interpola. Se $\gamma \ge 0$, $\int\gamma = 1$ e $V = h^n$, la stima è una densità legittima.

**Kernel gaussiano a simmetria sferica (metodo di Specht).**

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\Vert\mathbf{x} - \mathbf{x}_k\Vert^2}{2\sigma^2}\right)$$

Il disegno: nel piano delle feature metto i campioni; su ognuno poso una campana con curve di livello circolari, tutte con la stessa $\sigma$; la stima è la loro somma divisa per $N$, alta dove i campioni si addensano. $\sigma$ è il parametro di *smoothing* ed è uguale lungo tutte le feature, quindi prima normalizzo le feature. Posso anche usare una $\sigma_k$ diversa per ogni campione, in modo adattivo.

**Effetto della larghezza.** Con $\delta(\mathbf{x}) = \frac{1}{V}\gamma\left(\frac{\mathbf{x}}{h}\right)$ la stima diventa la media $\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\delta(\mathbf{x} - \mathbf{x}_k)$. $h$ cambia insieme ampiezza e larghezza di $\delta$, che mantiene area 1: per la finestra normale 2-D il picco passa da $0.159$ con $h = 1$ a $0.637$ con $h = 0.5$ e a $3.98$ con $h = 0.2$. Con $h$ grande sommo funzioni larghe: la stima è sovra-lisciata e perde i dettagli (*oversmoothing*). Con $h$ piccolo sommo aghi sui campioni: la stima è frastagliata e insegue il rumore (*overfitting*). Più campioni ho, più posso stringere $h$.

**È una buona stima?** Con campioni i.i.d. la media della stima è una convoluzione:

$$E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\,\gamma\left(\frac{\mathbf{x}}{h}\right)$$

una versione sfocata (*blurred*) della pdf vera: a $h$ fisso la stima è distorta. Se $h_N \to 0$ il kernel riscalato tende alla delta di Dirac e la stima è asintoticamente non distorta. La varianza è limitata:

$$E\left\{\left(\hat{p}(\mathbf{x}) - \bar{\hat{p}}(\mathbf{x})\right)^2\right\} \le \frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$$

e va a zero se $N h_N^n \to +\infty$. La stima è consistente se valgono insieme

$$\lim_{N\to+\infty} h_N = 0, \qquad \lim_{N\to+\infty} N h_N^n = +\infty$$

per esempio con $h_N = 1/\sqrt[2n]{N}$, che dà $N h_N^n = \sqrt{N}$. Se $h_N$ si stringe troppo in fretta la varianza esplode, se si stringe troppo piano resta il bias. Dalle note: Parzen dà stime lisce e meno sensibili al rumore del K-NN, ma la scelta della larghezza pesa molto sul risultato.`,
    checklist: [
      md`contesto non parametrico: stima $K/(NV)$ con regione fissata`,
      md`funzione finestra, conteggio $K$ e generalizzazione a un kernel che interpola`,
      md`formula di Specht con $(2\pi\sigma^2)^{n/2}$ e $\Vert\mathbf{x} - \mathbf{x}_k\Vert^2$, con il disegno delle campane circolari`,
      md`normalizzazione delle feature e $\sigma$ come parametro di *smoothing*`,
      md`effetto di $h$ su ampiezza e larghezza di $\delta(\mathbf{x})$; *oversmoothing* e *overfitting*`,
      md`bias come convoluzione, non distorsione asintotica, bound sulla varianza`,
      md`condizioni di consistenza con l'esempio $h_N = 1/\sqrt[2n]{N}$`,
    ],
    followUps: [
      {
        q: md`A $h$ fisso, più campioni migliorano la stima?`,
        a: md`Riducono la varianza, non il bias: $E\{\hat{p}(\mathbf{x})\}$ non dipende da $N$. La stima si concentra attorno alla versione sfocata di $p$, non attorno a $p$.`,
      },
      {
        q: md`Che cosa succede per $\sigma \to 0$ e per $\sigma \to +\infty$?`,
        a: md`Con $\sigma \to 0$ la stima diventa $N$ picchi sui campioni, con varianza enorme. Con $\sigma \to +\infty$ ogni gaussiana si spalma ovunque e la stima diventa piatta.`,
      },
      {
        q: md`Che legame c'è con la figura della slide 46?`,
        a: md`L'esempio $h_N = 1/\sqrt[2n]{N}$ dà $V_N = h_N^n = 1/\sqrt{N}$: è proprio la legge della riga di Parzen nella figura, con $N V_N = \sqrt{N} \to +\infty$.`,
      },
    ],
  },
  {
    id: 'or-banca-5',
    q: md`Stima a finestre di Parzen: contesto e proprietà. Qual è la funzione finestra più comune (scrivi la formula)? Parzen è un buon stimatore (bias e varianza)? Mostra con un disegno come funzionano il conteggio e l'interpolazione con un paio di campioni.`,
    qEn: 'Parzen window estimation: context and properties. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Show graphically how counting and interpolation work with a couple of samples.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Parzen Window Estimation: context, properties etc. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Graphical representation of how the counting/interpolation works with  a couple of samples.',
    answer: md`**Contesto.** Stimo la pdf senza assumere un modello parametrico, partendo da $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$. Parzen fissa la regione e conta i campioni. Per semplicità la regione è un ipercubo $n$-dimensionale di lato $h$ centrato in $\mathbf{x}^*$, con $V = h^n$. Per contare in modo analitico uso la funzione finestra (*window function*)

$$\gamma(\mathbf{u}) = \begin{cases} 1, & \vert u_j \vert \le \frac{1}{2}, \quad j = 1, \dots, n \\ 0, & \text{altrimenti} \end{cases}$$

Il campione $\mathbf{x}_k$ è nella regione se $\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right) = 1$: sottrarre $\mathbf{x}^*$ centra il cubo nell'origine, dividere per $h$ lo porta a lato 1. Quindi

$$K = \sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right), \qquad \hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{V}\,\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$$

Con un kernel più generale ogni campione contribuisce secondo la sua distanza da $\mathbf{x}$: il conteggio diventa un'interpolazione.

**Proprietà del kernel.** Se $\gamma(\mathbf{x}) \ge 0$, $\int \gamma(\mathbf{x})\,d\mathbf{x} = 1$ e $V = h^n$, la stima è non negativa e integra a 1. Per una stima «buona» chiedo anche massimo nell'origine, continuità e $\gamma(\mathbf{x}) \to 0$ per $\Vert\mathbf{x}\Vert \to +\infty$. Il rettangolo è valido ma discontinuo: dà stime a gradini.

**Funzione finestra più comune.** La gaussiana: in 1-D $\gamma(x) = \frac{1}{\sqrt{2\pi}}\exp\left(-\frac{x^2}{2}\right)$; in $n$ dimensioni, a simmetria sferica (metodo di Specht),

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\Vert\mathbf{x} - \mathbf{x}_k\Vert^2}{2\sigma^2}\right)$$

**È un buon stimatore?** La media è la convoluzione $E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$: una versione sfocata di $p$, distorta a $h$ fisso, asintoticamente non distorta se $h_N \to 0$. La varianza è al più $\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$. Con $h_N \to 0$ e $N h_N^n \to +\infty$ la stima è consistente, per esempio con $h_N = 1/\sqrt[2n]{N}$. A $N$ finito resta il compromesso: $h$ grande sfoca, $h$ piccolo insegue il rumore.

**Disegno con due campioni.** Prendo $x_1 = 2$ e $x_2 = 3$, cioè $N = 2$.

- Conteggio, finestra rettangolare con $h = 1.5$: su ogni campione poso un rettangolo di base $1.5$ e altezza $\frac{1}{Nh} = \frac{1}{3}$. I due rettangoli coprono $[1.25, 2.75]$ e $[2.25, 3.75]$: la somma è una scaletta che vale $\frac{1}{3}$, poi $\frac{2}{3}$ sulla sovrapposizione $[2.25, 2.75]$, poi di nuovo $\frac{1}{3}$, e zero fuori. In ogni punto la stima conta quanti campioni cadono nella finestra centrata lì.
- Interpolazione, kernel gaussiano: al posto dei rettangoli disegno due campane di area $\frac{1}{2}$. La somma è una curva liscia, senza salti: con $h \ge 0.5$ (distanza tra i campioni al più $2h$) ha una sola gobba in $2.5$, con $h$ più piccolo ha due gobbe separate.

In entrambi i disegni l'area totale è 1. Cambia il contributo di un campione: nel conteggio è «dentro o fuori», nell'interpolazione decresce con la distanza.`,
    checklist: [
      md`contesto non parametrico e stima $K/(NV)$ con regione fissata`,
      md`ipercubo di lato $h$, $V = h^n$, funzione finestra e test di appartenenza`,
      md`formula della stima e passaggio dal conteggio all'interpolazione`,
      md`condizioni sul kernel per una densità legittima e per una stima buona`,
      md`kernel gaussiano scritto per esteso (1-D e sferico di Specht)`,
      md`bias come convoluzione, bound sulla varianza, condizioni di consistenza`,
      md`disegno con due campioni: scaletta dei rettangoli e curva liscia delle gaussiane`,
    ],
    followUps: [
      {
        q: md`Perché nella stima serve il fattore $1/h^n$?`,
        a: md`Con il cambio di variabile $\mathbf{u} = (\mathbf{x} - \mathbf{x}_k)/h$ si ha $d\mathbf{x} = h^n\,d\mathbf{u}$: senza il fattore ogni kernel avrebbe area $h^n$. Il fattore $1/h^n$ riporta l'area a 1.`,
      },
      {
        q: md`Perché il conteggio con la finestra centrata in $\mathbf{x}^*$ e la somma di finestre centrate sui campioni danno lo stesso numero?`,
        a: md`Perché $\gamma$ è pari: $\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right) = \gamma\left(\frac{\mathbf{x}^* - \mathbf{x}_k}{h}\right)$. «$\mathbf{x}_k$ sta nel cubo centrato in $\mathbf{x}^*$» equivale a «$\mathbf{x}^*$ sta nel cubo centrato in $\mathbf{x}_k$». Con una finestra asimmetrica le due letture non coinciderebbero.`,
      },
      {
        q: md`In quali punti la stima di Parzen con finestra rettangolare vale zero?`,
        a: md`Dove la finestra centrata nel punto non contiene nessun campione: nel disegno, a sinistra di $1.25$ e a destra di $3.75$. Il K-NN invece non vale mai zero, perché allarga la cella finché trova $K$ campioni.`,
      },
    ],
  },
  {
    id: 'or-banca-6',
    q: md`Qual è la formula della massima verosimiglianza, perché possiamo usare il prodotto delle singole probabilità e che cosa descrive la likelihood? Come si descrive la bontà di una stima, e la stima ML è un buon stimatore? È migliore o no della stima bayesiana, e perché? Poi applica la stima ML a un esercizio. Infine: in quali casi ML e Bayes coincidono?`,
    qEn: 'What is the Maximum Likelihood formula, why can we use the product of the separate probabilities and what does the likelihood describe? How can we describe the goodness of an estimate, and is Maximum Likelihood a good estimator? Is it better or not than Bayesian estimation, and why? Then apply Maximum Likelihood estimation to an exercise. Last: in which cases are ML and Bayesian estimation the same?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'What is the formula of Maximum Likelihood, why we can use the separate products of the probabilities and what the Likelihood describe. How we can describe the goodness of an estimation and Is Maximum Likelihood Estimation a good estimator? Is it better or not with respect to the Bayesian Estimation? Why? Then he asked me to apply Maximum Likelihood estimation on an exercise. Last question was: In which case ML and Bayesian are the same?',
    answer: md`**Formula.** Ho un modello $p(\mathbf{x}\vert\boldsymbol{\theta})$ di forma nota con parametri ignoti e un training set $\mathbf{X} = \{\mathbf{x}_1, \dots, \mathbf{x}_N\}$. La stima a massima verosimiglianza (*Maximum Likelihood*, ML) è

$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X}\vert\boldsymbol{\theta}) = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X}\vert\boldsymbol{\theta})$$

Il logaritmo è monotono crescente, quindi non sposta il massimo.

**Perché il prodotto.** Assumo i campioni indipendenti e identicamente distribuiti (i.i.d.): l'indipendenza fattorizza la densità congiunta, l'identica distribuzione mi fa usare la stessa $p(\cdot\vert\boldsymbol{\theta})$ in ogni fattore. Così $p(\mathbf{X}\vert\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\vert\boldsymbol{\theta})$ e il logaritmo trasforma il prodotto in somma.

**Che cosa descrive la likelihood.** È la stessa espressione della pdf, letta come funzione di $\boldsymbol{\theta}$ a dati fissi. Misura quanto un valore dei parametri è compatibile con i campioni osservati: è alta quando la pdf candidata mette densità alta proprio dove i campioni sono caduti. Non è una densità su $\boldsymbol{\theta}$.

**Bontà di una stima.** La stima è funzione dei campioni, quindi è aleatoria. Guardo il bias, $E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}$, e la varianza, che confronto con il bound di Cramér-Rao: una stima non distorta che raggiunge il bound è efficiente. Per $N \to +\infty$ guardo non distorsione asintotica, efficienza asintotica e consistenza.

**ML è un buon stimatore?** Sì: se esiste una stima efficiente e la stima ML è non distorta, la stima efficiente è quella ML. In ogni caso la stima ML è asintoticamente non distorta, asintoticamente efficiente e consistente. Con pochi campioni può essere distorta: la varianza gaussiana stimata con $1/N$ ha media $\frac{N-1}{N}\sigma^2$.

**Meglio di Bayes?** Stimano cose diverse. ML restituisce un solo punto nello spazio dei parametri, una stima deterministica. La stima bayesiana stima un'intera distribuzione, $p(\mathbf{x}\vert\mathbf{X})$, attraverso la posterior dei parametri, che riflette insieme i dati e le convinzioni a priori. In pratica spesso preferisco ML per due motivi: minore complessità computazionale (cerco un massimo invece di calcolare e integrare distribuzioni) e interpretazione più semplice (una sola stima, pronta per una predizione diretta). Bayes offre due cose in più: incorpora la conoscenza a priori o il parere di esperti, utile quando i dati sono pochi, e quantifica l'incertezza con la posterior, per esempio con intervalli di credibilità (*credible intervals*). Nessuno dei due vince sempre: con molti dati coincidono, con pochi dati e un prior affidabile Bayes è meglio, con un prior sbagliato mi porta fuori strada.

**Esercizio.** Quattro letture di temperatura da una gaussiana 1-D: $2, 4, 5, 9$ °C. Annullo le derivate della log-verosimiglianza:

$$\hat{\mu} = \frac{1}{N}\sum_{k=1}^{N} x_k = \frac{2 + 4 + 5 + 9}{4} = 5, \qquad \hat{\sigma}^2 = \frac{1}{N}\sum_{k=1}^{N}(x_k - \hat{\mu})^2 = \frac{9 + 1 + 0 + 16}{4} = 6.5$$

La versione non distorta della varianza divide per $N - 1$: $26/3 \approx 8.67$.

**Quando ML e Bayes coincidono.**

- Nel limite di infiniti campioni di training: le due soluzioni diventano equivalenti ed entrambe convergono ai valori veri, perché sono stimatori consistenti. Nel caso gaussiano la distanza tra le due stime della media vale $\frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\,\vert\bar{X} - \mu_0\vert$ e cala come $1/N$. Serve un prior che dia densità positiva al valore vero.
- Con prior uniforme (*uniform prior*), cioè senza conoscenza a priori: $p(\boldsymbol{\theta})$ costante si semplifica nella regola di Bayes, la posterior è proporzionale alla sola verosimiglianza e il suo massimo coincide con la stima ML. Un prior uniforme su tutto l'asse non è normalizzabile: lo leggo come limite di un prior sempre più largo, $\sigma_0^2 \to +\infty$ nel caso gaussiano.

I passaggi sono nella dimostrazione [«quando ML e Bayes coincidono»](#derivation:der10).`,
    checklist: [
      md`formula $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X}\vert\boldsymbol{\theta})$ e versione con il logaritmo`,
      md`prodotto giustificato dai campioni i.i.d.`,
      md`likelihood come funzione di $\boldsymbol{\theta}$ a dati fissi: misura di compatibilità`,
      md`bontà di una stima: bias, varianza, bound di Cramér-Rao, proprietà asintotiche`,
      md`ML buono: efficiente se esiste una stima efficiente e ML è non distorta; asintoticamente non distorto, efficiente e consistente`,
      md`ML contro Bayes: punto contro distribuzione; complessità e interpretabilità contro prior e incertezza`,
      md`esercizio svolto con i numeri`,
      md`coincidenza nel limite $N \to +\infty$ e con prior uniforme, con il perché`,
    ],
    followUps: [
      {
        q: md`Con prior uniforme le due stime sono identiche in tutto?`,
        a: md`No: coincide il punto di massimo della posterior con la stima ML. Bayes conserva la posterior intera, con la sua larghezza ($\sigma_N^2 \to \sigma^2/N$ nel caso gaussiano), quindi l'informazione sull'incertezza resta.`,
      },
      {
        q: md`E se il prior assegna densità zero al valore vero?`,
        a: md`I dati non lo correggono mai: la posterior resta nulla dove il prior è nullo. Nel caso gaussiano con $\sigma_0^2 = 0$ si ha $\mu_N = \mu_0$ per ogni $N$, e l'equivalenza asintotica cade.`,
      },
      {
        q: md`Nell'esercizio, perché la stima ML della varianza divide per $N$?`,
        a: md`Annullando la derivata della log-verosimiglianza rispetto a $\sigma^2$ esce la divisione per $N$. Lo stimatore è distorto, $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2$, ma il fattore tende a 1: asintoticamente non distorto.`,
      },
    ],
  },
  {
    id: 'or-banca-7',
    q: md`Riduzione delle feature, effetto Hughes e il suo grafico. Spiegazione geometrica veloce della maledizione della dimensionalità.`,
    qEn: 'Feature reduction, the Hughes effect and the Hughes graph. A quick geometric explanation of the curse of dimensionality.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Feature reduction, Huges effect and Huges graph. Fast geometrical explanation of the curse of dimensionality.',
    answer: md`**Effetto Hughes.** Quando le prestazioni non bastano viene naturale aggiungere feature, e in teoria aggiungere dimensioni aiuta: densità che si sovrappongono in 1-D o in 2-D possono separarsi in 3-D, e l'errore di Bayes sparisce. In pratica, oltre un certo punto, aggiungere feature peggiora le prestazioni: è la maledizione della dimensionalità (*curse of dimensionality*), o effetto Hughes (*Hughes effect*). Le cause sono ipotesi sbagliate nella scelta del modello ed errori di stima dovuti al numero finito di campioni in alta dimensione (*overfitting*). La stima delle pdf diventa critica quando numero di campioni e numero di feature sono sbilanciati, e l'equilibrio dipende anche dalla complessità del classificatore. L'origine è la crescita esponenziale del volume quando aggiungo dimensioni.

**Il grafico.** In ascissa il numero di feature, in ordinata l'accuratezza media di classificazione sui campioni di test. Disegno una famiglia di curve, una per numero di campioni di training: ognuna sale, raggiunge un massimo e poi scende. Al crescere del numero di campioni il massimo si alza e si sposta a destra; con infiniti campioni la curva cresce sempre. Quindi a $N$ fissato esiste un numero ottimo di feature.

**Spiegazione geometrica veloce.**

- 100 punti equispaziati bastano per campionare l'intervallo unitario con passo $0.01$; un reticolo con lo stesso passo nell'ipercubo unitario 10-D richiede $10^{20}$ punti: in questo senso l'ipercubo è $10^{18}$ volte «più grande».
- Con $N = 1000$, $n = 200$ e $p(\mathbf{x}) \sim N(\boldsymbol{\mu}, \Sigma)$, la covarianza ha $\frac{n(n+1)}{2} = 20\,100$ elementi distinti: in media ho circa $0.05$ campioni per stimare ogni elemento di $\Sigma$.
- Sfera inscritta nel cubo: $V_s(r) = \frac{2r^n}{n}\,\frac{\pi^{n/2}}{\Gamma(n/2)}$, $V_c(r) = (2r)^n$, quindi

$$f_n = \frac{V_s(r)}{V_c(r)} = \frac{1}{n\,2^{n-1}}\,\frac{\pi^{n/2}}{\Gamma(n/2)} \;\Rightarrow\; \lim_{n\to\infty} f_n = 0$$

$f_n$ vale $0.785$ in 2-D, $0.524$ in 3-D, circa $0.0025$ in 10-D: il volume del cubo si concentra negli angoli. Gli spazi ad alta dimensione sono quasi vuoti, i dati tendono a vivere su strutture di dimensione minore, i dati gaussiani si concentrano nelle code e quelli uniformi negli angoli: stimare la densità diventa più difficile.

**Il legame con il K-NN.** Con $N$ campioni uniformi nell'ipercubo unitario, per catturare $K$ vicini serve in media un sottocubo di lato $(K/N)^{1/n}$. Con $K/N = 0.001$ il lato vale $0.001$ in 1-D, $0.032$ in 2-D, $0.50$ in 10-D e $0.93$ in 100-D: l'intorno non è più locale, cade l'ipotesi di pdf quasi costante nella cella, e la scelta di $K$ diventa ancora più critica.

**Riduzione delle feature.** Gli obiettivi sono tre: ridurre il costo di implementazione del sistema, ridurre il carico computazionale del classificatore e superare l'effetto Hughes. Voglio minimizzare il numero di feature mantenendo la capacità discriminante più alta possibile. Gli approcci sono due: selezione (*feature selection*), cioè scegliere un sottoinsieme di $m < n$ feature che massimizza un criterio $J(\cdot)$; estrazione (*feature extraction*), cioè trasformare le feature in un nuovo spazio più piccolo, come fanno PCA e LDA.`,
    checklist: [
      md`definizione dell'effetto Hughes: oltre un certo punto più feature peggiorano le prestazioni`,
      md`cause: modello sbagliato, errori di stima con $N$ finito, squilibrio tra campioni e feature`,
      md`grafico: accuratezza contro numero di feature, una curva per $N$, picco che si sposta, curva crescente con $N$ infinito`,
      md`esempi geometrici: $10^{20}$ punti in 10-D, circa $0.05$ campioni per elemento di $\Sigma$`,
      md`frazione sfera/cubo $f_n \to 0$ con la formula, volume negli angoli, spazio quasi vuoto`,
      md`riduzione delle feature: obiettivi e i due approcci (selezione ed estrazione)`,
    ],
    followUps: [
      {
        q: md`Perché con infiniti campioni la curva non scende?`,
        a: md`Senza errore di stima, aggiungere feature non può far crescere l'errore di Bayes: aggiungo informazione. Il calo nasce solo dalla stima con $N$ finito.`,
      },
      {
        q: md`Come calcoli $f_2$?`,
        a: md`$V_s = \pi r^2$ e $V_c = (2r)^2 = 4r^2$, quindi $f_2 = \pi/4 \approx 0.785$. Dalla formula: $\frac{1}{2 \cdot 2}\,\frac{\pi}{\Gamma(1)} = \frac{\pi}{4}$.`,
      },
      {
        q: md`Che cosa cambia tra selezione ed estrazione?`,
        a: md`La selezione tiene alcune delle feature originali, che restano interpretabili. L'estrazione costruisce feature nuove come trasformazioni di quelle originali (PCA, LDA): può conservare più informazione, ma le nuove feature sono combinazioni meno leggibili.`,
      },
    ],
  },
  // --- domande sulle parti più chieste ---
  {
    id: 'or-formula-madre',
    q: md`Ricava la stima non parametrica $\hat{p}(\mathbf{x}^*) = K/(NV)$: ipotesi, passaggi e le due osservazioni sulla dimensione della regione.`,
    qEn: 'Derive the nonparametric estimate p(x*) = K/(NV): hypotheses, steps and the two observations on the size of the region.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Prendo un campione generico $\mathbf{x}^*$, il punto in cui voglio la densità, e una regione $R$ predefinita dello spazio delle feature con $\mathbf{x}^* \in R$. La probabilità che un campione cada in $R$ è

$$P_R = P\{\mathbf{x} \in R\} = \int_R p(\mathbf{x})\,d\mathbf{x} \simeq p(\mathbf{x}^*)\,V$$

L'ultimo passaggio usa due ipotesi: la pdf vera è continua e $R$ è abbastanza piccola perché $p$ non vari in modo significativo al suo interno. La slide scrive un uguale, ma è un'approssimazione: per il teorema della media integrale $P_R = p(\boldsymbol{\xi})\,V$ con $\boldsymbol{\xi} \in R$, e la regione piccola mi fa sostituire $\boldsymbol{\xi}$ con $\mathbf{x}^*$. $V$ è il volume di $R$: una lunghezza in 1-D, un'area in 2-D.

Tra gli $N$ campioni di training, $K$ cadono in $R$. La frequenza relativa (*relative frequency*) è una stima consistente (*consistent estimate*) di $P_R$:

$$\hat{P}_R = \frac{K}{N}, \qquad \lim_{N\to+\infty} P\{\vert\hat{P}_R - P_R\vert < \delta\} = 1 \quad \forall\delta > 0$$

È la legge dei grandi numeri (*law of large numbers*). Dietro c'è la binomiale: con campioni i.i.d. e $R$ fissata, $K$ è binomiale di parametri $N$ e $P_R$, quindi $E\{K/N\} = P_R$ e $\mathrm{var}\{K/N\} = P_R(1 - P_R)/N$, e Chebyshev dà il limite. Uguaglio le due espressioni di $P_R$ e divido per $V$:

$$\hat{p}(\mathbf{x}^*) = \frac{\hat{P}_R}{V} = \frac{K}{NV}$$

Le due approssimazioni sono di natura diversa: la prima è geometrica e migliora stringendo $R$, la seconda è statistica e migliora allargando $R$ o aumentando $N$. Da qui le due osservazioni della slide 44: $R$ abbastanza grande da contenere molti campioni, così vale la legge dei grandi numeri; $R$ abbastanza piccola da limitare la variabilità di $p$. Sono in conflitto: una regione troppo piccola rende la stima sensibile al rumore, una troppo grande non vede le variazioni locali. In formule, con $R$ fissata $E\{\hat{p}\} = P_R/V$, la media spaziale di $p$ su $R$ (bias), e $\mathrm{var}\{\hat{p}\} \simeq \frac{p(\mathbf{x}^*)}{NV}$ (varianza). Esempio: su 500 letture di un sensore, 40 cadono nella fascia $[20.0, 20.2]$ °C; $\hat{P}_R = 0.08$, $\hat{p} = 0.4$ per °C, con una deviazione standard di circa $0.061$, il 15%.

Il compromesso si risolve facendo dipendere la regione da $N$, e nella formula ho due parametri: se fisso $K$ e calcolo $V$ dai dati ottengo il K-NN; se fisso $R$, quindi $V$, e conto $K$ ottengo Parzen.`,
    checklist: [
      md`$\mathbf{x}^*$ generico e regione $R$ predefinita con $\mathbf{x}^* \in R$`,
      md`ipotesi: pdf continua e $R$ abbastanza piccola; $P_R \simeq p(\mathbf{x}^*)V$`,
      md`frequenza relativa $K/N$ e limite della legge dei grandi numeri`,
      md`formula finale $\hat{p}(\mathbf{x}^*) = K/(NV)$`,
      md`le due osservazioni (enough large, enough small) e il loro conflitto`,
      md`dal ruolo di $K$ e $V$ nascono K-NN e Parzen`,
    ],
    followUps: [
      {
        q: md`Perché la frequenza relativa è una stima consistente?`,
        a: md`Ogni campione cade in $R$ con probabilità $P_R$, indipendentemente dagli altri: $K$ è binomiale. $K/N$ ha media $P_R$ e varianza $P_R(1 - P_R)/N$, e per la disuguaglianza di Chebyshev $P\{\vert K/N - P_R\vert \ge \delta\} \le \frac{P_R(1 - P_R)}{N\delta^2} \to 0$. I passaggi sono nella dimostrazione [«perché K/N è consistente»](#derivation:der06).`,
      },
      {
        q: md`Con $V$ fisso e $N \to +\infty$ la stima converge a $p(\mathbf{x}^*)$?`,
        a: md`No, converge a $P_R/V$, la media spaziale di $p$ su $R$: la varianza sparisce, il bias resta. Per arrivare a $p(\mathbf{x}^*)$ serve anche $V \to 0$.`,
      },
      {
        q: md`La densità stimata può superare 1?`,
        a: md`Sì: è una densità, non una probabilità. Supera 1 ogni volta che $V < K/N$. A valere 1 è l'area sotto la pdf.`,
      },
    ],
  },
  {
    id: 'or-due-metodi-figura',
    q: md`Nella formula $K/(NV)$ ci sono due parametri: come nascono K-NN e Parzen? Commenta la figura con $V = 1/\sqrt{N}$ e $K = \sqrt{N}$.`,
    qEn: 'The formula K/(NV) contains two parameters: how do K-NN and Parzen arise from it? Comment on the figure with V = 1/sqrt(N) and K = sqrt(N).',
    prof: 'Melgani',
    fromBank: false,
    answer: md`A seconda del ruolo che do a $K$ e a $V$ ottengo due metodi. Nel K-NN $K$ è fissato e il volume $V$ della regione si calcola dal training set: la cella si allarga finché contiene esattamente $K$ campioni. Nel metodo di Parzen la regione, e quindi $V$, è fissata, e $K$ si conta sui campioni; nelle note si chiama anche *kernel density estimation*, perché i campioni vengono pesati con un kernel, tipicamente gaussiano.

La figura della slide 46 mostra le due letture sugli stessi campioni 2-D, con la regione circolare centrata nel centro del riquadro, per $N = 1, 4, 9, 16, \dots, 100$.

- Riga di Parzen, $V = 1/\sqrt{N}$: il volume è una funzione prefissata di $N$, vale $1$, $0.5$, $0.333$, $0.25$ e $0.1$. Il cerchio si restringe in modo deterministico, dovunque siano i campioni; è casuale il numero $K$ di campioni catturati, che può anche essere zero. Nel disegno, con $N = 4$, il cerchio non contiene nessun campione e la stima vale zero.
- Riga del K-NN, $K = \sqrt{N}$: $K$ vale $1$, $2$, $3$, $4$ e $10$. Il cerchio si allarga fino a toccare il $K$-esimo vicino, quindi è casuale il volume. La stima non è mai nulla.

In entrambe le righe la regione si restringe al crescere di $N$ mentre i campioni che contiene aumentano: è ciò che serve per la convergenza. Le due leggi soddisfano le condizioni di consistenza: $N V_N = \sqrt{N} \to +\infty$ per Parzen, $K_N = \sqrt{N} \to +\infty$ con $K_N/N = 1/\sqrt{N} \to 0$ per il K-NN.

C'è un legame preciso tra le due righe. Nella cella K-NN cadono $K$ campioni su $N$, quindi $p(\mathbf{x}^*)\,V_K \simeq K/N$ e

$$V_K(\mathbf{x}^*) \simeq \frac{K_N}{N\,p(\mathbf{x}^*)} = \frac{1}{\sqrt{N}\,p(\mathbf{x}^*)} = \frac{V_1(\mathbf{x}^*)}{\sqrt{N}}, \qquad V_1(\mathbf{x}^*) = \frac{1}{p(\mathbf{x}^*)}$$

Stessa legge $1/\sqrt{N}$ di Parzen, ma con un volume iniziale deciso dai dati e diverso da punto a punto: piccolo dove la densità è alta, grande dove è bassa. È il senso preciso di «adattivo alle variazioni locali di densità», il vantaggio del K-NN secondo le note; lo svantaggio è che la scelta di $K$ è cruciale. Parzen dà stime lisce e meno sensibili al rumore, ma dipende dalla larghezza della finestra. Entrambi convergono, ma a campione finito il loro comportamento è difficile da prevedere.

Un dettaglio della figura: nella riga di Parzen è il raggio dei cerchi a ridursi come $1/\sqrt{N}$, non l'area. La legge da ricordare è quella scritta, sul volume.`,
    checklist: [
      md`K-NN: $K$ fisso, $V$ calcolato; Parzen: $V$ fisso, $K$ contato`,
      md`riga di Parzen con $V = 1/\sqrt{N}$: volume deterministico, $K$ casuale, stima anche nulla`,
      md`riga del K-NN con $K = \sqrt{N}$: $V$ casuale, cerchio fino al $K$-esimo vicino`,
      md`regione che si restringe e contenuto che cresce; verifica delle condizioni di consistenza`,
      md`$V_K \simeq 1/(\sqrt{N}\,p(\mathbf{x}^*))$: stessa legge con volume iniziale deciso dai dati`,
      md`vantaggi e svantaggi dei due metodi e comportamento a campione finito`,
    ],
    followUps: [
      {
        q: md`Nel K-NN che cosa succede alla cella in un punto dove la densità è bassa?`,
        a: md`Si allarga: $V_K \simeq \frac{K}{N\,p(\mathbf{x}^*)}$ cresce quando $p$ scende. È il motivo per cui la stima non si annulla mai e le code scendono piano. I passaggi sono nella dimostrazione [«il volume della cella K-NN con K = √N»](#derivation:der08).`,
      },
      {
        q: md`Quale legge di $h_N$ corrisponde a $V = 1/\sqrt{N}$?`,
        a: md`$V_N = h_N^n$, quindi $h_N = 1/\sqrt[2n]{N}$: è l'esempio di Melgani per la consistenza di Parzen.`,
      },
    ],
  },
  {
    id: 'or-consistenza-knn',
    q: md`Quando la stima K-NN è consistente? Interpreta le due condizioni e fai esempi e controesempi di leggi $K(N)$.`,
    qEn: 'When is the K-NN estimate consistent? Interpret the two conditions and give examples and counterexamples of laws K(N).',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Se scelgo $K$ come funzione di $N$, una condizione necessaria e sufficiente per una stima consistente in tutti i punti in cui $p(\mathbf{x})$ è continua è

$$\lim_{N\to+\infty} K_N = +\infty, \qquad \lim_{N\to+\infty} \frac{K_N}{N} = 0$$

La slide dice «it can be shown» e non dà la dimostrazione; posso dare la giustificazione.

**Prima condizione.** Se i campioni nella cella crescono senza limite, la stima si appoggia su sempre più dati e la sua variabilità si annulla. In termini precisi, il contenuto di probabilità della cella $P_K$ segue una $\mathrm{Beta}(K, N - K + 1)$, con media $\frac{K}{N+1}$ e dispersione relativa circa $1/\sqrt{K}$: va a zero solo se $K_N \to +\infty$. È la varianza.

**Seconda condizione.** Nella cella cade una frazione $K_N/N$ dei campioni, quindi $V_{K_N}(\mathbf{x}^*) \simeq \frac{K_N}{N\,p(\mathbf{x}^*)}$: se $K_N/N \to 0$ il volume tende a zero e l'ipotesi di pdf costante nella cella diventa esatta. È il bias. Nelle note: $K$ deve crescere con $N$, ma molto più lentamente.

**Esempio.** $K(N) = \sqrt{N}$: $\sqrt{N} \to +\infty$ e $\sqrt{N}/N = 1/\sqrt{N} \to 0$. In numeri: $N = 100$ dà $K = 10$ e $K/N = 0.1$; $N = 10\,000$ dà $K = 100$ e $0.01$; $N = 10^6$ dà $K = 1000$ e $0.001$. Anche $K = \ln N$ è consistente, ma riduce la varianza molto lentamente.

**Controesempi.**

- $K$ costante: cade la prima condizione. La varianza non si annulla mai: con $K = 5$ la stima ha un bias di circa $+25\%$ (il fattore $\frac{K}{K-1}$) e una dispersione relativa che non cala aggiungendo dati e tende a circa $58\%$ per $N$ grande. È l'*overfitting* persistente; $K = 1$ è il caso peggiore, con spilli e valore atteso infinito.
- $K = \alpha N$ con $0 < \alpha < 1$: cade la seconda. La cella contiene sempre una frazione $\alpha$ della massa, il volume non tende a zero e la stima resta una media su una regione larga: *oversmoothing* persistente.

Il titolo delle note «fixed K may lead to bias or overfitting» mette insieme i due difetti: $K$ troppo piccolo dà varianza, $K$ troppo grande dà bias. Adattare $K$ a $N$ tiene il metodo consistente.

**Due dettagli.** La consistenza è un risultato asintotico: a $N$ finito il comportamento dipende molto da $K$. Nei punti fuori dal supporto, dove $p = 0$, il volume non tende a zero, ma la stima va lo stesso a zero perché $K_N/N \to 0$.`,
    checklist: [
      md`enunciato: $K_N \to +\infty$ e $K_N/N \to 0$, necessarie e sufficienti nei punti di continuità`,
      md`prima condizione e varianza (dispersione circa $1/\sqrt{K}$)`,
      md`seconda condizione e bias ($V_K \simeq K_N/(N p)$ che tende a zero)`,
      md`esempio $K = \sqrt{N}$ con i numeri`,
      md`controesempi: $K$ costante e $K = \alpha N$, con il difetto che resta`,
      md`carattere asintotico e caso dei punti fuori dal supporto`,
    ],
    followUps: [
      {
        q: md`Perché la stima K-NN è distorta verso l'alto?`,
        a: md`La stima vale circa $p(\mathbf{x}^*)\,\frac{K/N}{P_K}$ e $E\{1/P_K\} = \frac{N}{K-1}$: il valore atteso è $\frac{K}{K-1}\,p(\mathbf{x}^*)$. Il fattore tende a 1 solo se $K_N \to +\infty$. I passaggi sono nella dimostrazione [«il contenuto della cella è una variabile Beta»](#derivation:der09).`,
      },
      {
        q: md`Quali potenze $K_N = N^a$ sono consistenti?`,
        a: md`Quelle con $0 < a < 1$: $N^a \to +\infty$ se $a > 0$ e $N^a/N = N^{a-1} \to 0$ se $a < 1$. Con $a$ vicino a 1 la convergenza del bias è lentissima: $N^{0.9}$ con $N = 10^6$ tiene ancora nella cella il 25% dei dati.`,
      },
      {
        q: md`Perché il ragionamento con la binomiale non si applica così com'è al K-NN?`,
        a: md`La binomiale vale per una regione fissata prima di guardare i campioni: $K$ è aleatorio, $V$ no. Nel K-NN $K$ è deciso a priori e la cella dipende dai campioni, quindi aleatori sono il volume e il contenuto $P_K$. Per questo serve la legge Beta.`,
      },
    ],
  },
  {
    id: 'or-grafico-1d',
    q: md`Disegna la stima K-NN di cinque campioni 1-D con $K = 3$: dove cadono picchi, angoli e code, e perché le discontinuità della pendenza sono lontane dai campioni?`,
    qEn: 'Draw the K-NN estimate of five 1-D samples with K = 3: where do the peaks, the corners and the tails fall, and why are the slope discontinuities away from the samples?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Prendo i campioni $1.0, 1.2, 1.3, 2.5, 4.0$, quindi $N = 5$, e $K = 3$. In 1-D la cella è un intervallo che arriva al terzo vicino, $V = 2r_3(x)$, e

$$\hat{p}(x) = \frac{K}{2N\,r_K(x)} = \frac{0.3}{r_3(x)}$$

I tre vicini di $x$ sono sempre tre campioni consecutivi; il terzo vicino è il più lontano dei due estremi del gruppo.

**Picchi.** Quando $x$ è equidistante dagli estremi di un gruppo il raggio è minimo e la stima ha una cuspide. I gruppi sono $[1.0, 1.3]$, $[1.2, 2.5]$ e $[1.3, 4.0]$, larghi $0.3$, $1.3$ e $2.7$: le cuspidi cadono in $1.15$, $1.85$ e $2.65$, alte $\frac{K}{N \cdot \text{larghezza}} = 2.0$, $0.46$ e $0.22$. Il gruppo più stretto dà il picco più alto.

**Angoli.** Quando il gruppo scorre di un posto, cioè quando $x$ è equidistante dal campione che esce e da quello che entra, il raggio è massimo e la stima ha un minimo angoloso: in $\frac{1.0 + 2.5}{2} = 1.75$, dove vale $0.4$, e in $\frac{1.2 + 4.0}{2} = 2.6$, dove vale $0.21$.

**Tratti e code.** Tra un punto angoloso e il successivo la curva è un ramo di iperbole $\frac{0.3}{\vert x - c \vert}$, con $c$ il terzo vicino: per esempio $\frac{0.3}{x - 1.0}$ tra $1.15$ e $1.75$. A sinistra della prima cuspide vale $\frac{0.3}{1.3 - x}$, a destra dell'ultima $\frac{0.3}{x - 1.3}$: le code scendono come $1/\vert x \vert$ e non toccano mai lo zero. Nei raccordi i due rami danno lo stesso valore: la stima è continua, a saltare è la pendenza, che passa da $+\frac{K}{2N\,r_K^2}$ a $-\frac{K}{2N\,r_K^2}$.

**Perché lontano dai campioni.** La pendenza cambia quando cambia l'identità del $K$-esimo vicino, e questo succede nei punti medi tra due campioni, non sui campioni. È la nota della slide 48. Nella figura con otto campioni, la curva con $K = 3$ ha sei cuspidi e quella con $K = 5$ ne ha quattro: $N - K + 1$ in entrambi i casi.

**Com'è la distribuzione.** Un picco alto e stretto sopra la terna fitta $1.0$-$1.3$, un altopiano basso sopra i campioni isolati, code lente. L'area non vale 1: tra $0$ e $6$ vale già circa $1.79$ e cresce senza limite allargando l'intervallo.`,
    checklist: [
      md`formula 1-D $\hat{p}(x) = K/(2N\,r_K(x))$ e vicini come campioni consecutivi`,
      md`cuspidi nei punti medi dei gruppi di $K$ campioni, altezza $K/(N \cdot \text{larghezza})$`,
      md`minimi angolosi nei punti medi tra campione che esce e campione che entra`,
      md`rami di iperbole e code come $1/\vert x \vert$`,
      md`continuità della stima, salto della sola pendenza, nota della slide 48`,
      md`area diversa da 1`,
    ],
    followUps: [
      {
        q: md`Che cosa cambia con $K = 1$?`,
        a: md`Ogni campione diventa il centro di due rami che divergono: la stima va all'infinito sui campioni e ha area infinita. È la prima riga della figura della slide 50.`,
      },
      {
        q: md`E con $K = N$?`,
        a: md`Resta un'unica cuspide nel punto medio tra il minimo e il massimo, alta $\frac{1}{x_{(N)} - x_{(1)}}$: con questi dati $\frac{1}{3} \approx 0.33$ in $2.5$. Ogni struttura interna sparisce.`,
      },
      {
        q: md`Perché i picchi più alti sono anche i più appuntiti?`,
        a: md`Il modulo della pendenza vale $\frac{K}{2N\,r_K^2} = \frac{2N}{K}\,\hat{p}^2$: cresce con il quadrato della stima. I passaggi sono nella dimostrazione [«forma 1-D della stima K-NN»](#derivation:der04).`,
      },
    ],
  },
  {
    id: 'or-figura-n-crescente',
    q: md`Commenta la figura con le stime K-NN di una gaussiana e di una bimodale per $N = 1, 16, 256, \infty$.`,
    qEn: 'Comment on the figure with the K-NN estimates of a Gaussian and of a bimodal density for N = 1, 16, 256 and infinity.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`La figura della slide 50 è una griglia 4 per 2 sull'asse da 0 a 4. A sinistra la densità vera è una gaussiana di media 2 e deviazione standard circa 1, con massimo circa $0.40$. A destra è bimodale: un triangolo su $[0.5, 2.5]$ con vertice in $1.5$ e un rettangolo su $[3, 3.5]$, entrambi alti circa $0.67$, con aree $2/3$ e $1/3$. La slide non dice quale $K$ usa; la figura originale usa $K = \sqrt{N}$, cioè $1$, $4$ e $16$.

- $N = 1$: un solo spillo iperbolico $\hat{p}(x) = \frac{1}{2\vert x - x_1 \vert}$ attorno all'unico campione, con area infinita. A sinistra il campione è vicino a $3.4$ e in $x = 0$ la curva vale circa $\frac{1}{2 \cdot 3.4} \approx 0.15$. La stima non assomiglia per nulla alla densità vera.
- $N = 16$: gruppi di spilli; a sinistra la forma della gaussiana si intuisce appena, con picchi a $0.8$-$0.9$, più del doppio del massimo vero; a destra compaiono due picchi, ancora rumorosi.
- $N = 256$: a sinistra la campana è riconoscibile ma increspata, con valori tra circa $0.25$ e $0.55$ attorno a $0.40$; a destra la forma bimodale è chiara, con rumore residuo.
- $N = \infty$: le stime coincidono con le densità vere. È la versione grafica della consistenza.

Posso dire quanto rumore aspettarmi. Con $K$ vicini la stima ha un bias di circa $\frac{K}{K-1}$ e una dispersione relativa di circa $\sqrt{\frac{N-K+1}{N(K-2)}}$: con $N = 16$ e $K = 4$ fanno $+33\%$ e $64\%$, con $N = 256$ e $K = 16$ fanno $+6.7\%$ e $26\%$. La dispersione è relativa al valore atteso, non al valore vero: nel centro $E\{\hat{p}\} \approx 1.067 \cdot 0.40 \approx 0.43$, e una deviazione standard ($0.26 \cdot 0.43 \approx 0.11$) dà la fascia $0.32$-$0.54$, coerente con l'oscillazione della figura.

Due osservazioni. Nella valle della bimodale e ai bordi dell'asse la stima non scende mai a zero, anche dove la densità vera è nulla: sono le code lente del K-NN. E la consistenza è garantita solo nei punti di continuità: i bordi verticali del rettangolo sono il punto più difficile, e lì la stima a $N$ finito è peggiore. La convergenza vale per qualunque forma della densità, che è il vantaggio del non parametrico, ma è lenta.`,
    checklist: [
      md`struttura della figura: due densità, quattro valori di $N$, $K = \sqrt{N}$`,
      md`$N = 1$: spillo $\frac{1}{2\vert x - x_1 \vert}$ con area infinita`,
      md`$N = 16$ e $N = 256$: forma che emerge ma stima ancora rumorosa`,
      md`$N = \infty$: stima uguale alla densità vera (consistenza)`,
      md`stima quantitativa del rumore con bias $K/(K-1)$ e dispersione relativa`,
      md`code che non scendono a zero e problema dei punti di discontinuità`,
    ],
    followUps: [
      {
        q: md`Le note dicono che a $N = 256$ la stima gaussiana è «più liscia, con una chiara forma a campana». Sei d'accordo?`,
        a: md`Solo in parte: la campana si vede, ma la stima oscilla ancora tra circa $0.25$ e $0.55$ con cinque o sei denti. Con $K = 16$ la dispersione relativa attesa è circa il 26%: il rumore è quello previsto.`,
      },
      {
        q: md`Perché con $N = 1$ la curva esce dal bordo superiore del grafico?`,
        a: md`Con $K = 1$ la stima diverge sul campione: $\frac{1}{2\vert x - x_1 \vert} \to +\infty$ per $x \to x_1$.`,
      },
    ],
  },
  {
    id: 'or-classificatore-knn',
    q: md`Ricava il classificatore K-NN dalla stima K-NN delle densità e discuti ipotesi, scelta di $K$ e casi limite.`,
    qEn: 'Derive the K-NN classifier from the K-NN density estimates and discuss the assumptions, the choice of K and the limit cases.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Ho $N$ campioni di training, $N_i$ della classe $\omega_i$. Attorno al campione da classificare $\mathbf{x}$ allargo una cella fino a contenere $K$ campioni di qualunque classe; il suo volume è $V$ e dentro ci sono $K_i$ campioni della classe $\omega_i$, con $K = \sum_i K_i$. Applico $K/(NV)$ classe per classe:

$$\hat{p}(\mathbf{x}\vert\omega_i) = \frac{K_i}{N_i\,V}, \qquad \hat{P}(\omega_i) = \frac{N_i}{N}, \qquad \hat{p}(\mathbf{x}) = \frac{K}{N\,V}$$

Con la regola di Bayes volume e numerosità si semplificano:

$$\hat{P}(\omega_i\vert\mathbf{x}) = \frac{\hat{p}(\mathbf{x}\vert\omega_i)\,\hat{P}(\omega_i)}{\hat{p}(\mathbf{x})} = \frac{K_i}{K}$$

La regola MAP sceglie la classe con posterior massima, $\hat{\omega} = \arg\max_i K_i$: la classe più rappresentata tra i $K$ vicini. È un voto di maggioranza.

**Esempio.** 50 pesci, 20 salmoni e 30 spigole. Con $K = 5$ il cerchio attorno al pesce ignoto ha area $0.8$ e contiene 4 salmoni e 1 spigola. Densità condizionate $\frac{4}{20 \cdot 0.8} = 0.25$ e $\frac{1}{30 \cdot 0.8} \approx 0.042$; prior $0.4$ e $0.6$; prodotti $0.1$ e $0.025$, che sommano a $\frac{5}{50 \cdot 0.8} = 0.125$, la densità non condizionata. Posterior $0.8 = 4/5$ e $0.2 = 1/5$: salmone. Le spigole sono più numerose nel training set, ma il prior si semplifica con $N_i$: conta solo chi sta nel cerchio.

**Ipotesi.** Uso la stessa cella per tutte le classi, quella con $K$ campioni in totale: solo così $V$ si semplifica. Stimo i prior con le frequenze $N_i/N$, cioè assumo che il training set rispecchi le proporzioni reali: se conosco prior diversi, la posterior diventa proporzionale a $P(\omega_i)\,K_i/N_i$ e il voto va pesato. Le posterior sommano a 1, perché $\sum_i \frac{K_i}{N_i V}\frac{N_i}{N} = \frac{K}{NV}$.

**Scelta di $K$ e casi limite.** Con $K$ piccolo il confine di decisione è frastagliato (*overfit*); con $K$ grande è troppo liscio (*oversmooth*). $K = 1$ è la regola del vicino più prossimo; $K = N$ assegna sempre la classe più numerosa del training set, cioè decide con il solo prior. Con due classi prendo $K$ dispari per evitare i pareggi.

Questo collegamento non è nelle slide del capitolo: lo ricavo dalla stima K-NN e dalla regola di Bayes.`,
    checklist: [
      md`cella comune con $K$ campioni, $K_i$ per classe`,
      md`$\hat{p}(\mathbf{x}\vert\omega_i) = K_i/(N_i V)$ e $\hat{P}(\omega_i) = N_i/N$`,
      md`regola di Bayes e posterior $K_i/K$`,
      md`regola MAP come voto di maggioranza, con un esempio numerico`,
      md`ipotesi: stessa cella per tutte le classi e prior stimati con le frequenze`,
      md`scelta di $K$, $K = 1$, $K = N$, $K$ dispari`,
    ],
    followUps: [
      {
        q: md`Che cosa succede se il training set ha proporzioni diverse da quelle reali?`,
        a: md`Il voto di maggioranza usa implicitamente i prior $N_i/N$. Se so che i salmoni sono il 10% del pescato ma nel training set sono il 40%, peso i voti: $\hat{P}(\omega_i\vert\mathbf{x}) \propto P(\omega_i)\,\frac{K_i}{N_i}$.`,
      },
      {
        q: md`I passaggi completi dove sono?`,
        a: md`Nella dimostrazione [«dal K-NN stimatore al K-NN classificatore»](#derivation:der05).`,
      },
    ],
  },
  {
    id: 'or-casi-limite',
    q: md`Che cosa succede alla stima $K/(NV)$ se stringi la regione tenendo fisso $N$? E se tieni fissa la regione e fai crescere $N$? E nel K-NN con $K = 1$ o $K = N$?`,
    qEn: 'What happens to the estimate K/(NV) if you shrink the region with N fixed? And if you keep the region fixed and let N grow? And in K-NN with K = 1 or K = N?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**$N$ fisso, $V \to 0$.** Prima o poi la regione non contiene più campioni: $K = 0$ e la stima vale 0 quasi ovunque. Se invece $\mathbf{x}^*$ coincide con un campione, $K$ resta almeno 1 e $\frac{K}{NV}$ diverge. In entrambi i casi la stima è inutilizzabile: a dati fissi non posso rendere esatta $P_R = p(\mathbf{x}^*)V$ stringendo $R$. È il senso di «$R$ enough large».

**$V$ fisso, $N \to +\infty$.** Per la legge dei grandi numeri $K/N \to P_R$, quindi

$$\hat{p}(\mathbf{x}^*) \to \frac{P_R}{V} = \frac{1}{V}\int_R p(\mathbf{x})\,d\mathbf{x}$$

la media spaziale di $p$ su $R$, in generale diversa da $p(\mathbf{x}^*)$: la varianza sparisce, il bias resta. Esempio: triangolo $p(x) = 1 - \vert x - 1 \vert$ su $[0, 2]$, $x^* = 1$ e $R$ larga $0.8$: la stima tende a $1 - 0.8/4 = 0.8$ invece che a 1. È il senso di «$R$ enough small».

**$R$ grande quanto tutto lo spazio.** $K = N$ e $P_R = 1$: la stima vale $1/V$, piatta, qualunque sia la forma della pdf. La conclusione dei tre casi è che $V$ deve dipendere da $N$: $V_N \to 0$ e $N V_N \to +\infty$.

**K-NN con $K = 1$.** La cella arriva al campione più vicino: in 1-D $\hat{p}(x) = \frac{1}{2N\,r_1(x)}$, che diverge su ogni campione. Il valore atteso della stima è infinito e l'area pure: è l'*overfitting* estremo, la prima riga della figura della slide 50.

**K-NN con $K = N$.** La cella deve contenere tutti i campioni: in 1-D $\hat{p}(x) = \frac{1}{2\max\{x - x_{(1)},\ x_{(N)} - x\}}$, un'unica cuspide nel punto medio tra minimo e massimo, alta $\frac{1}{x_{(N)} - x_{(1)}}$. Tutta la struttura interna è cancellata: *oversmoothing* estremo.

Il $K$ utile sta tra i due estremi, e al crescere di $N$ deve allontanarsi da entrambi: $K_N \to +\infty$ per lasciare $K = 1$, $K_N/N \to 0$ per lasciare $K = N$. Sono le due condizioni della slide 47.`,
    checklist: [
      md`$N$ fisso e $V \to 0$: stima 0 oppure infinita`,
      md`$V$ fisso e $N \to +\infty$: converge alla media spaziale $P_R/V$, bias residuo`,
      md`$R$ uguale a tutto lo spazio: stima piatta $1/V$`,
      md`$K = 1$: spilli, valore atteso e area infiniti`,
      md`$K = N$: un'unica cuspide alta $1/(x_{(N)} - x_{(1)})$`,
      md`collegamento con le due condizioni della slide 47`,
    ],
    followUps: [
      {
        q: md`E nel K-NN in un punto fuori dal supporto della pdf?`,
        a: md`Il volume non tende a zero, perché la cella deve raggiungere la zona dei campioni. La stima tende lo stesso a $0 = p(\mathbf{x}^*)$, perché $K_N/N \to 0$. Con $N = 10^4$ campioni uniformi su $[0, 1]$, $K = 100$ e $x^* = 1.5$ vale circa $\frac{100}{2 \cdot 10^4 \cdot 0.51} \approx 0.0098$.`,
      },
      {
        q: md`Perché con $K = 1$ il valore atteso è infinito?`,
        a: md`La stima vale circa $p(\mathbf{x}^*)\,\frac{K/N}{P_K}$ e con $K = 1$ il contenuto della cella segue una $\mathrm{Beta}(1, N)$: $E\{1/P_K\}$ diverge.`,
      },
    ],
  },
]
