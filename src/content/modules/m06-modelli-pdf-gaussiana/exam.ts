// Domande d'orale del modulo m06 (modelli di pdf e modello gaussiano): le dieci della banca d'esame (testo verbatim
// in bankText) più otto domande sulle parti del modulo che Melgani chiede di più. Le risposte sono in prima persona,
// come le direbbe lo studente; le parti delle domande di banca che appartengono ad altri moduli sono trattate in breve.
import { md } from '../../types'
import type { ExamQuestion } from '../../types'

export const exam: ExamQuestion[] = [
  // --- banca d'esame ---------------------------------------------------------------------------------
  {
    id: 'or-banca-1',
    q: md`Come funziona il criterio del rischio minimo e come si confronta con la classificazione MAP e ML? Qual è il migliore? Poi: scrivi la formula della gaussiana in uno spazio a più dimensioni, con vettore media e matrice di covarianza.`,
    qEn: 'How does the minimum risk criterion work, and how does it compare with MAP and ML classification? Which one is the best? Then: write the formula of the Gaussian in a multidimensional space, with mean vector and covariance matrix.',
    prof: 'Melgani',
    fromBank: true,
    bankText:
      'How does the Minimum risk criterium work, comparison with MAP and ML classification. Which is the best one (minimum risk). He also asked me the formula of the Gaussian curve in a multi dimensional space (with mean vector and covariance matrix).',
    answer: md`**Rischio minimo.** Ogni decisione è un'azione $\alpha_i$ che costa $\lambda(\alpha_i|\omega_j) \ge 0$ se la classe vera è $\omega_j$; i costi formano la matrice $\Lambda$. Vedendo $\mathbf{x}$ calcolo il rischio condizionale, cioè la perdita attesa di ogni azione:

$$R(\alpha_i|\mathbf{x})=\sum_{j=1}^{C}\lambda(\alpha_i|\omega_j)\,P(\omega_j|\mathbf{x})$$

e scelgo l'azione con il rischio condizionale più piccolo. Facendolo in ogni punto minimizzo il rischio complessivo $R=\int R(\alpha(\mathbf{x})|\mathbf{x})\,p(\mathbf{x})\,d\mathbf{x}$; il minimo è il rischio di Bayes $R^*$. Con due classi e costo nullo per le decisioni giuste diventa un test sul rapporto di verosimiglianza:

$$\Lambda(\mathbf{x})=\frac{p(\mathbf{x}|\omega_1)}{p(\mathbf{x}|\omega_2)}\geq\frac{P(\omega_2)}{P(\omega_1)}\,\frac{\lambda_{12}}{\lambda_{21}}\ \Rightarrow\ \alpha_1$$

A sinistra ci sono i dati, a destra prior e costi.

**Confronto.** Con costi uguali ($\lambda_{12} = \lambda_{21}$, loss 0-1) la soglia diventa $\frac{P(\omega_2)}{P(\omega_1)}$: è il MAP, che minimizza la probabilità d'errore. Se anche i prior sono uguali la soglia vale 1: è il ML, che guarda solo le verosimiglianze. Quindi ML ⊂ MAP ⊂ rischio minimo.

**Il migliore.** Il rischio minimo: contiene gli altri due come casi particolari e il rischio di Bayes è la migliore prestazione ottenibile. Dipende però dalla metrica: il rischio minimo può fare più errori del MAP, ma quelli che fa costano meno (nell'esempio dell'incendio un falso allarme costa $10^3$ euro, un incendio ignorato $10^6$). Il limite pratico è che pdf, prior e costi vanno conosciuti.

**La gaussiana multivariata.** Le pdf $p(\mathbf{x}|\omega_i)$ che servono al criterio si modellano spesso con

$$p(\mathbf{x}|\mathbf{m},\Sigma)=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]$$

in breve $N(\mathbf{m}, \Sigma)$. $\mathbf{x}\in\Re^n$ è il vettore di feature, $\mathbf{m}=E\{\mathbf{x}\}$ il vettore media (la tendenza centrale), $\Sigma=E\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\}$ la matrice di covarianza $n \times n$ (varianze sulla diagonale, covarianze fuori), $|\Sigma|$ il suo determinante. La forma quadratica all'esponente è la distanza di Mahalanobis (al quadrato) di $\mathbf{x}$ dalla media; la costante davanti rende 1 il volume sotto la campana. Con $n = 1$ ritrovo $\frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}$. Media e covarianza definiscono completamente la pdf: $n + \frac{n(n+1)}{2}$ parametri, che stimo con la ML, $\hat{\mathbf{m}}=\frac{1}{N}\sum_k\mathbf{x}_k$ e $\hat{\Sigma}=\frac{1}{N}\sum_k(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}$.

**Il legame.** Con classi gaussiane $p(\mathbf{x}|\omega_i) = N(\mathbf{m}_i, \Sigma_i)$ passo al logaritmo e ottengo funzioni discriminanti quadratiche in $\mathbf{x}$, $g_i(\mathbf{x}) = -\frac{1}{2}(\mathbf{x}-\mathbf{m}_i)^t\Sigma_i^{-1}(\mathbf{x}-\mathbf{m}_i) - \frac{1}{2}\ln|\Sigma_i| + \ln P(\omega_i)$, a meno di costanti; i costi entrano come soglia.`,
    checklist: [
      md`azioni, matrice dei costi e rischio condizionale $R(\alpha_i|\mathbf{x})=\sum_j\lambda(\alpha_i|\omega_j)P(\omega_j|\mathbf{x})$`,
      'regola: azione a rischio condizionale minimo, rischio di Bayes come prestazione migliore',
      'test sul rapporto di verosimiglianza con soglia fatta di prior e costi',
      'MAP (costi uguali) e ML (anche prior uguali) come casi particolari',
      'quale è il migliore e in che senso (costo atteso contro probabilità d’errore)',
      md`formula completa della gaussiana con $(2\pi)^{n/2}$, $|\Sigma|^{1/2}$ e $\Sigma^{-1}$`,
      md`significato di $\mathbf{x}$, $\mathbf{m}$, $\Sigma$, $|\Sigma|$ e della forma quadratica (Mahalanobis)`,
    ],
    followUps: [
      {
        q: md`Perché nella costante compare $|\Sigma|^{1/2}$?`,
        a: md`Ruoto gli assi sugli autovettori di $\Sigma$: la forma quadratica diventa $\sum_i y_i^2/\lambda_i$ e l'integrale si spezza in $n$ integrali gaussiani 1-D, ognuno $\sqrt{2\pi\lambda_i}$. Il prodotto è $(2\pi)^{n/2}\sqrt{\lambda_1\cdots\lambda_n} = (2\pi)^{n/2}|\Sigma|^{1/2}$, perché il determinante è il prodotto degli autovalori.`,
      },
      {
        q: md`Che cosa succede alla soglia se cresce $\lambda_{21}$, il costo di scegliere $\alpha_2$ quando la classe è $\omega_1$?`,
        a: md`La soglia $\frac{P(\omega_2)}{P(\omega_1)}\frac{\lambda_{12}}{\lambda_{21}}$ scende e la regione di $\alpha_1$ si allarga: pur di non sbagliare il caso costoso accetto più falsi allarmi.`,
      },
      {
        q: md`Che forma ha la frontiera tra due classi gaussiane?`,
        a: md`In generale quadratica, perché i termini $\mathbf{x}^t\Sigma_i^{-1}\mathbf{x}$ restano. Se le due classi hanno la stessa $\Sigma$ quei termini si cancellano e la frontiera è un iperpiano.`,
      },
    ],
  },
  {
    id: 'or-banca-2',
    q: md`Spiega la PCA. Com'è costruita la matrice di covarianza e che cos'è? Domande di dettaglio su equazione caratteristica, autovalori e autovettori. Infine: le differenze principali tra SFS e PCA.`,
    qEn: 'Explain PCA. How is the covariance matrix built and what is it? Detailed questions on the characteristic equation, eigenvalues and eigenvectors. Finally: the main differences between SFS and PCA.',
    prof: 'Melgani',
    fromBank: true,
    bankText:
      'Asked me to explain PCA. When I started explaining he asked about covariance matrix, how it is created, what is cov matrix and etc. Then also some detailed questions about characteristic equation, eigenvalues/vectors. Lastly, main differences between sfs and pca.',
    answer: md`**PCA in breve.** L'analisi delle componenti principali (*Principal Component Analysis*) è un'estrazione di feature lineare e non supervisionata: cerca il sottospazio a $m < n$ dimensioni in cui i dati si ricostruiscono con il minimo errore quadratico, che equivale a conservare la massima varianza. La base ottima è data dagli $m$ autovettori della matrice di covarianza con gli autovalori più grandi.

**Che cos'è la matrice di covarianza.** Per un vettore di feature $\mathbf{x}$ con media $\mathbf{m}=E\{\mathbf{x}\}$:

$$\Sigma=Cov\{\mathbf{x}\}=E\left\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\right\}=E\left\{\mathbf{x}\mathbf{x}^{t}\right\}-\mathbf{m}\mathbf{m}^{t}$$

$(\mathbf{x}-\mathbf{m})$ è una colonna $n\times 1$, il trasposto una riga: il prodotto esterno è $n \times n$. L'elemento $(i,j)$ è $\sigma_{ij}=E\{(x_i-m_i)(x_j-m_j)\}$: sulla diagonale le varianze $\sigma_i^2$, fuori le covarianze, positive se due feature crescono insieme, negative se una cresce quando l'altra cala, nulle se sono incorrelate. In 2-D $\sigma_{12}=\rho\,\sigma_1\sigma_2$, con $\rho$ coefficiente di correlazione fra $-1$ e $1$.

**Come si costruisce dai dati.** Calcolo $\hat{\mathbf{m}}=\frac{1}{N}\sum_k\mathbf{x}_k$, tolgo la media a ogni campione e faccio la media dei prodotti esterni: $\hat{\Sigma}=\frac{1}{N}\sum_k(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}=\frac{1}{N}\sum_k\mathbf{x}_k\mathbf{x}_k^{t}-\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}$, oppure divido per $N-1$ per averla non distorta.

**Proprietà.** È simmetrica, $\Sigma=\Sigma^t$, quindi ha $\frac{n(n+1)}{2}$ elementi distinti. È semidefinita positiva: $\mathbf{a}^t\Sigma\mathbf{a}=E\{(\mathbf{a}^t(\mathbf{x}-\mathbf{m}))^2\}=var\{\mathbf{a}^t\mathbf{x}\}\ge 0$ per ogni $\mathbf{a}$. Con feature indipendenti è diagonale.

**Equazione caratteristica, autovalori, autovettori.** $\mathbf{e}$ è autovettore se $\Sigma\mathbf{e}=\lambda\mathbf{e}$, cioè $(\Sigma-\lambda I)\mathbf{e}=\mathbf{0}$ con $\mathbf{e}\neq\mathbf{0}$. Serve una matrice singolare:

$$\det(\Sigma-\lambda I)=0$$

un polinomio di grado $n$ in $\lambda$ le cui radici sono gli autovalori. In 2-D: $\lambda^{2}-(\sigma_1^{2}+\sigma_2^{2})\lambda+(\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2})=0$. Per ogni $\lambda_i$ risolvo il sistema omogeneo e normalizzo. Per convenzione $\lambda_1\ge\lambda_2\ge\dots\ge\lambda_n$. La simmetria dà autovalori reali e autovettori ortogonali (una base ortogonale, $\Sigma=U\Lambda U^t$); la semidefinitezza dà $\lambda_i=\mathbf{e}_i^t\Sigma\mathbf{e}_i=var\{\mathbf{e}_i^t\mathbf{x}\}\ge 0$. Con i moltiplicatori di Lagrange si mostra che $\mathbf{e}_1$ massimizza $\mathbf{a}^t\Sigma\mathbf{a}$ con $\Vert\mathbf{a}\Vert=1$ e il massimo vale $\lambda_1$: è la prima componente principale. Nella gaussiana gli stessi autovettori sono gli assi delle ellissi di isolivello, con semiassi $r\sqrt{\lambda_i}$.

**Esempio.** $\Sigma=\begin{bmatrix}2&1\\1&2\end{bmatrix}$: $(2-\lambda)^2-1=0$ dà $\lambda_1=3$ e $\lambda_2=1$, con $\mathbf{e}_1=\frac{1}{\sqrt{2}}(1,1)^t$ ed $\mathbf{e}_2=\frac{1}{\sqrt{2}}(1,-1)^t$. Proiettando su $\mathbf{e}_1$ tengo $\frac{3}{4}$ della varianza totale.

**SFS contro PCA.** La SFS (*Sequential Forward Selection*) è una selezione: parte dall'insieme vuoto e aggiunge a ogni passo la feature originale che, insieme alle già scelte, massimizza un criterio di separabilità fra le classi. È supervisionata, conserva feature con un significato fisico e costa $mn-\frac{m(m-1)}{2}$ valutazioni; una feature inserita non si toglie più. La PCA è un'estrazione: costruisce feature nuove come combinazioni lineari $\mathbf{y}=W^t\mathbf{x}$ di tutte le originali, non usa le etichette e ottimizza la rappresentazione, non la separabilità: la direzione di massima varianza può non separare le classi. Con la PCA devo comunque misurare tutte le feature di partenza.`,
    checklist: [
      'PCA: estrazione lineare non supervisionata, minimo errore di ricostruzione, autovettori con gli autovalori più grandi',
      md`definizione di $\Sigma$ con le due forme e costruzione da $N$ campioni ($\frac{1}{N}$ o $\frac{1}{N-1}$)`,
      'contenuto: varianze sulla diagonale, covarianze fuori, segno e coefficiente di correlazione',
      'proprietà: simmetrica, semidefinita positiva, diagonale con feature indipendenti',
      md`equazione caratteristica $\det(\Sigma-\lambda I)=0$ e autovettori da $(\Sigma-\lambda_i I)\mathbf{e}_i=\mathbf{0}$`,
      md`autovalori reali e non negativi, autovettori ortogonali, $\lambda_i$ varianza lungo $\mathbf{e}_i$, ordinamento`,
      'SFS (selezione supervisionata, feature originali) contro PCA (estrazione non supervisionata, combinazioni lineari)',
    ],
    followUps: [
      {
        q: md`Perché gli autovalori di $\Sigma$ non possono essere negativi?`,
        a: md`Perché ognuno è una varianza: $\lambda_i=\mathbf{e}_i^t\Sigma\mathbf{e}_i=var\{\mathbf{e}_i^t\mathbf{x}\}$ con $\mathbf{e}_i$ unitario. La slide dice «positivi» perché la gaussiana richiede $\Sigma$ invertibile; un autovalore nullo vuol dire dati schiacciati su un sottospazio.`,
      },
      {
        q: md`Perché due autovettori di $\Sigma$ con autovalori diversi sono ortogonali?`,
        a: md`Calcolo $\mathbf{e}_j^t\Sigma\mathbf{e}_i$ in due modi: vale $\lambda_i\mathbf{e}_j^t\mathbf{e}_i$ e, per la simmetria, $\lambda_j\mathbf{e}_j^t\mathbf{e}_i$. La differenza $(\lambda_i-\lambda_j)\mathbf{e}_j^t\mathbf{e}_i=0$ con $\lambda_i\neq\lambda_j$ impone $\mathbf{e}_j^t\mathbf{e}_i=0$.`,
      },
      {
        q: 'Quale frazione di varianza conservo con le prime m componenti?',
        a: md`$\frac{\lambda_1+\dots+\lambda_m}{\lambda_1+\dots+\lambda_n}$: la traccia (*trace*) di $\Sigma$ è la varianza totale ed è la somma degli autovalori.`,
      },
    ],
  },
  {
    id: 'or-banca-3',
    q: md`Spiega la stima non parametrica: che cosa vuol dire non parametrico e perché si usa; spiega K-NN e finestre di Parzen: tendono alla soluzione ottima? Spiega la stima ML, sviluppa la derivata prima per una gaussiana e spiega il significato del risultato. Spiega il classificatore box.`,
    qEn: 'Explain non-parametric estimation, what non-parametric means and why we use it; explain both K-NN and Parzen windows: do they tend to the optimal solution? Explain ML estimation, develop the first derivative for a Gaussian and explain the meaning of the result. Explain the box classifier.',
    prof: 'Melgani',
    fromBank: true,
    bankText:
      'Explain non-parametric estimation, what non-parametric means and why we use it, explain both KNN and Parzen windows, do they tend to the optimal solution? Explain ML estimation, develop the first derivative for a gaussian and explain the meaning of the result. Explain box classifier',
    answer: md`**Non parametrico.** Nella stima parametrica fisso la forma di $p(\mathbf{x}|\boldsymbol{\theta})$ (per esempio gaussiana) e stimo pochi parametri. Se la forma è ignota, o nessuna famiglia nota si adatta ai dati, stimo la densità direttamente dai campioni: $\hat{p}(\mathbf{x})=\frac{K}{NV}$, con $K$ campioni su $N$ dentro una regione di volume $V$ attorno a $\mathbf{x}$.

**K-NN e Parzen.** Nel K-NN fisso $K$ e allargo la regione finché contiene $K$ campioni: $\hat{p}(\mathbf{x})=\frac{K}{N\,V_K(\mathbf{x})}$. In Parzen fisso la regione, un ipercubo di lato $h$ e volume $h^n$, e conto i campioni con una funzione finestra; con un kernel gaussiano la stima è una media di gaussiane centrate sui campioni. **Tendono all'ottimo?** Sì, asintoticamente, se valgono le condizioni di consistenza: $K_N\to\infty$ e $K_N/N\to 0$ per il K-NN, $h_N\to 0$ e $Nh_N^n\to\infty$ per Parzen. Allora la stima converge alla pdf vera e il classificatore costruito sopra tende a quello bayesiano. Con $N$ finito no: resta il compromesso fra bias e varianza.

**Stima ML.** Cerco il $\boldsymbol{\theta}$ che rende più probabili i dati: $\hat{\boldsymbol{\theta}}=\arg\max_{\boldsymbol{\theta}}p(X|\boldsymbol{\theta})$. Con campioni iid la verosimiglianza è un prodotto e ne prendo il logaritmo, che è monotono e trasforma il prodotto in somma.

**La derivata per una gaussiana 1-D.**

$$\ln p(X|m,\sigma^{2})=-\frac{N}{2}\ln(2\pi\sigma^{2})-\frac{1}{2\sigma^{2}}\sum_{k=1}^{N}(x_k-m)^{2}$$

$$\frac{\partial}{\partial m}\ln p(X|m,\sigma^{2})=\frac{1}{\sigma^{2}}\sum_{k=1}^{N}(x_k-m)=0\ \Rightarrow\ \hat{m}=\frac{1}{N}\sum_{k=1}^{N}x_k$$

**Significato.** La derivata è la somma degli scarti dei campioni da $m$: si annulla quando gli scarti positivi bilanciano quelli negativi, cioè nel baricentro dei dati. La stima ML della media è la media campionaria e non dipende da $\sigma^2$. La derivata seconda, $-N/\sigma^2$, è negativa: è un massimo. Derivando rispetto a $\sigma^2$ e sostituendo $\hat{m}$ trovo $\hat{\sigma}^2=\frac{1}{N}\sum_k(x_k-\hat{m})^2$, con fattore $\frac{1}{N}$: in media vale $\frac{N-1}{N}\sigma^2$, quindi è distorta ma asintoticamente non distorta. In $n$ dimensioni $\nabla_{\mathbf{m}}\ln p=\Sigma^{-1}\sum_k(\mathbf{x}_k-\mathbf{m})$ e ritrovo $\hat{\mathbf{m}}=\frac{1}{N}\sum_k\mathbf{x}_k$ (i passaggi sono nella dimostrazione [«Stima ML di media e varianza di una gaussiana 1-D: la derivata prima»](#derivation:der08)).

**Classificatore box.** Per ogni classe $\omega_i$ stimo il baricentro $\mathbf{m}_i$ e la deviazione standard $\sigma_{ij}$ di ogni feature. Il box è l'iper-rettangolo con i lati paralleli agli assi $\prod_j[m_{ij}-\alpha\sigma_{ij},\ m_{ij}+\alpha\sigma_{ij}]$: equivale a una pdf di classe uniforme sul box. Un campione che cade in un solo box va a quella classe; nelle sovrapposizioni o fuori da tutti i box serve una regola aggiuntiva (rifiuto, box più vicino, box di volume minore). Usa le statistiche del secondo ordine in modo primitivo: prende solo la diagonale di $\Sigma$. Con feature correlate la nuvola è un'ellisse inclinata e il box copre angoli vuoti.`,
    checklist: [
      md`non parametrico: nessuna forma assunta, stima base $\hat{p}=K/(NV)$`,
      'K-NN (K fisso, volume dai dati) e Parzen (volume fisso, conteggio con la finestra)',
      'consistenza come risposta a «tendono all’ottimo?», con le condizioni su K e h',
      'verosimiglianza come prodotto per campioni iid e passaggio al logaritmo',
      md`derivata rispetto a $m$, annullamento, $\hat{m}$ media campionaria e sua interpretazione`,
      md`derivata seconda negativa e stima di $\sigma^2$ con fattore $1/N$`,
      'box classifier: baricentro, deviazioni standard, iper-rettangolo, uso solo della diagonale di Σ',
    ],
    followUps: [
      {
        q: 'Perché il massimo non cambia passando al logaritmo?',
        a: md`Il logaritmo è strettamente crescente: se $p(X|\theta_1)>p(X|\theta_2)$ allora anche $\ln p(X|\theta_1)>\ln p(X|\theta_2)$, quindi l'argomento del massimo è lo stesso. In più trasforma il prodotto in somma e toglie l'esponenziale della gaussiana.`,
      },
      {
        q: md`La stima ML della media dipende da $\sigma^2$?`,
        a: md`No: la condizione $\sum_k(x_k-\hat{m})=0$ non contiene $\sigma^2$, che moltiplica soltanto la derivata. Per questo si risolve prima in $m$ e poi si sostituisce $\hat{m}$ nella condizione su $\sigma^2$.`,
      },
      {
        q: 'Che cosa ignora il box rispetto a un modello gaussiano completo?',
        a: md`Le covarianze fuori diagonale: il box è allineato agli assi. Una gaussiana con $\Sigma$ piena ha isolivelli ellittici ruotati lungo gli autovettori e segue la correlazione fra le feature.`,
      },
    ],
  },
  {
    id: 'or-banca-4',
    q: md`Qual è la formula della massima verosimiglianza, perché possiamo usare il prodotto delle singole probabilità e che cosa descrive la verosimiglianza? Come si descrive la bontà di una stima? La stima ML è un buon stimatore? È meglio o peggio della stima bayesiana, e perché? Applica la ML a un esercizio. In quale caso ML e stima bayesiana coincidono?`,
    qEn: 'What is the formula of maximum likelihood, why can we use the product of the separate probabilities and what does the likelihood describe? How can we describe the goodness of an estimate? Is ML a good estimator? Is it better or worse than Bayesian estimation, and why? Apply ML to an exercise. In which case are ML and Bayesian estimation the same?',
    prof: 'Melgani',
    fromBank: true,
    bankText:
      'What is the formula of Maximum Likelihood, why we can use the separate products of the probabilities and what the Likelihood describe. How we can describe the goodness of an estimation and Is Maximum Likelihood Estimation a good estimator? Is it better or not with respect to the Bayesian Estimation? Why? Then he asked me to apply Maximum Likelihood estimation on an exercise. Last question was: In which case ML and Bayesian are the same?',
    answer: md`**Formula e prodotto.** Con $N$ campioni $X=\{\mathbf{x}_1,\dots,\mathbf{x}_N\}$ la stima ML è $\hat{\boldsymbol{\theta}}=\arg\max_{\boldsymbol{\theta}}p(X|\boldsymbol{\theta})$. Se i campioni sono indipendenti e identicamente distribuiti (iid) la densità congiunta si fattorizza:

$$p(X|\boldsymbol{\theta})=\prod_{k=1}^{N}p(\mathbf{x}_k|\boldsymbol{\theta}),\qquad \ln p(X|\boldsymbol{\theta})=\sum_{k=1}^{N}\ln p(\mathbf{x}_k|\boldsymbol{\theta})$$

L'indipendenza giustifica il prodotto, l'identica distribuzione permette di usare lo stesso $\boldsymbol{\theta}$ in ogni fattore.

**Che cosa descrive.** Vista come funzione di $\boldsymbol{\theta}$ con i dati fissati, la verosimiglianza misura quanto ogni valore del parametro rende plausibili i dati osservati. Non è una densità in $\boldsymbol{\theta}$: non integra a 1.

**Bontà di una stima.** Guardo il bias $E\{\hat{\boldsymbol{\theta}}\}-\boldsymbol{\theta}$, la varianza (con il limite inferiore di Cramér-Rao, l'inverso dell'informazione di Fisher, per gli stimatori non distorti; chi lo raggiunge è efficiente) e la consistenza (la stima converge al vero valore per $N\to\infty$).

**La ML è buona?** Non sempre per $N$ finito, ma ha buone proprietà asintotiche: è asintoticamente non distorta, asintoticamente efficiente e consistente. Nel caso gaussiano la slide lo dice esplicitamente. $\hat{\mathbf{m}}$ è non distorta ed efficiente per ogni $N$, con $Cov\{\hat{\mathbf{m}}\}=\frac{1}{N}\Sigma$; $\hat{\Sigma}$ è distorta, $E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$, e si corregge dividendo per $N-1$.

**ML contro Bayes.** Nella ML $\boldsymbol{\theta}$ è fisso ma incognito e ottengo un punto. Nella stima bayesiana $\boldsymbol{\theta}$ è una variabile aleatoria: parto da un prior $p(\boldsymbol{\theta})$ e con i dati lo aggiorno nella posterior $p(\boldsymbol{\theta}|X)$. Nessuna delle due vince sempre. Con pochi dati e un prior sensato la bayesiana è migliore, perché usa conoscenza a priori e quantifica l'incertezza. La ML è più semplice da calcolare e da interpretare, per questo in pratica si preferisce.

**Esercizio.** Quattro pixel con due feature: $(1,2)$, $(3,4)$, $(5,4)$, $(3,6)$. $\hat{\mathbf{m}}=(3,4)^t$; scarti $(-2,-2)$, $(0,0)$, $(2,0)$, $(0,2)$; somma dei prodotti esterni $\begin{bmatrix}8&4\\4&8\end{bmatrix}$, quindi $\hat{\Sigma}=\begin{bmatrix}2&1\\1&2\end{bmatrix}$. Con la seconda forma: $\frac{1}{4}\sum_k\mathbf{x}_k\mathbf{x}_k^t=\begin{bmatrix}11&13\\13&18\end{bmatrix}$ meno $\hat{\mathbf{m}}\hat{\mathbf{m}}^t=\begin{bmatrix}9&12\\12&16\end{bmatrix}$, stesso risultato. Lo stimatore corretto vale $\frac{4}{3}\hat{\Sigma}$.

**Quando coincidono.** Asintoticamente: con $N\to\infty$ la posterior si concentra in un picco sulla stima ML e il prior non conta più. Nell'esempio gaussiano $\mu_N=\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\bar{X}+\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\mu_0\to\bar{X}$. Coincidono anche con un prior uniforme: la posterior è proporzionale alla verosimiglianza e ha il massimo nello stesso punto.`,
    checklist: [
      md`$\hat{\boldsymbol{\theta}}=\arg\max p(X|\boldsymbol{\theta})$ con il prodotto giustificato dall'ipotesi iid`,
      'la verosimiglianza come funzione di θ a dati fissati, non densità in θ',
      'criteri di bontà: bias, varianza e bound di Cramér-Rao, efficienza, consistenza',
      md`proprietà della ML e caso gaussiano: $\hat{\mathbf{m}}$ non distorta, $\hat{\Sigma}$ distorta di $\frac{N-1}{N}$`,
      'θ fisso contro θ aleatorio, prior e posterior, vantaggi e costi dei due approcci',
      'esercizio svolto con i numeri',
      'coincidenza per N grande e con prior uniforme',
    ],
    followUps: [
      {
        q: md`Perché la stima ML della covarianza è distorta?`,
        a: md`Gli scarti si misurano da $\hat{\mathbf{m}}$, calcolata sugli stessi dati, che sta ai campioni più vicina della media vera. Nei conti $E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^t\}=\frac{1}{N}\Sigma+\mathbf{m}\mathbf{m}^t$, e quel $\frac{1}{N}\Sigma$ sottratto dà $E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$.`,
      },
      {
        q: 'Che ipotesi hanno in comune ML e stima bayesiana?',
        a: md`La forma della densità $p(\mathbf{x}|\boldsymbol{\theta})$ è nota; ignoti sono solo i valori dei parametri. Il prior è un'ipotesi in più della sola stima bayesiana.`,
      },
    ],
  },
  {
    id: 'or-banca-5',
    q: md`Che cos'è l'algoritmo EM e come funziona? Spiega la formula e i due passi. Poi un esempio EM con una mistura di gaussiane. Infine K-NN, con un esempio.`,
    qEn: 'What is the EM algorithm and how does it work? Explain the formula and both steps. Then a multi-Gaussian example for EM. Finally K-NN and a K-NN example.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'What is an EM algorithm and how does it work? Explain formula and both steps. Then Multi Gaussian example for EM algorithm. KNN and KNN example.',
    answer: md`**A che cosa serve.** L'algoritmo EM (*Expectation-Maximization*) calcola la stima ML quando i dati sono incompleti: ai dati osservati $X$ mancano delle variabili $Y$ (feature mancanti, oppure l'etichetta del modo che ha generato un campione). Massimizzare direttamente $\ln p(X|\boldsymbol{\theta})$ è difficile; con i dati completi $(X, Y)$ sarebbe facile.

**I due passi.** Parto da una stima iniziale $\boldsymbol{\theta}^{(0)}$ e ripeto:

$$\text{E-step:}\quad Q(\boldsymbol{\theta},\boldsymbol{\theta}^{(k)})=E\left\{\log p(X,Y|\boldsymbol{\theta})\ \middle|\ X,\boldsymbol{\theta}^{(k)}\right\}$$

$$\text{M-step:}\quad \boldsymbol{\theta}^{(k+1)}=\arg\max_{\boldsymbol{\theta}}\,Q(\boldsymbol{\theta},\boldsymbol{\theta}^{(k)})$$

L'E-step sostituisce le variabili mancanti con il loro valore atteso, dati i campioni e i parametri correnti; l'M-step rifà la stima ML come se i dati fossero completi. La verosimiglianza non diminuisce mai da un'iterazione all'altra e l'algoritmo converge a un massimo locale: l'inizializzazione conta.

**Mistura di gaussiane.** $p(\mathbf{x})=\sum_{i=1}^{M}P_i\,p(\mathbf{x}|\mathbf{m}_i,\Sigma_i)$, con $\boldsymbol{\theta}=[P_1,\dots,P_M;\ \mathbf{m}_1,\dots,\mathbf{m}_M;\ \Sigma_1,\dots,\Sigma_M]$. Il dato mancante è il modo che ha generato ciascun $\mathbf{x}_j$. Nell'E-step calcolo la probabilità a posteriori del modo $i$ per il campione $j$:

$$P(i|\mathbf{x}_j,\boldsymbol{\theta}^{[k]})=\frac{P_i^{[k]}\,p(\mathbf{x}_j|\mathbf{m}_i^{[k]},\Sigma_i^{[k]})}{\sum_{l=1}^{M}P_l^{[k]}\,p(\mathbf{x}_j|\mathbf{m}_l^{[k]},\Sigma_l^{[k]})}$$

Nell'M-step aggiorno i parametri con le stime ML della gaussiana di questo modulo, pesate da quelle probabilità: il prior è la media dei pesi, $P_i^{[k+1]}=\frac{1}{N}\sum_j P(i|\mathbf{x}_j,\boldsymbol{\theta}^{[k]})$; la media è la media pesata dei campioni; la covarianza è la media pesata dei prodotti esterni $(\mathbf{x}_j-\mathbf{m}_i^{[k+1]})(\mathbf{x}_j-\mathbf{m}_i^{[k+1]})^t$. Se i pesi fossero 0 o 1 (etichette note) ritroverei esattamente $\hat{P}_i=N_i/N$, la media campionaria e la covarianza ML di ogni modo.

**Esempio.** Le lunghezze dei salmoni di un allevamento mescolano due età: un istogramma con due gobbe. Inizializzo due gaussiane con medie diverse; nell'E-step ogni pesce viene diviso fra le due in proporzione a quanto ciascuna lo spiega; nell'M-step ricalcolo medie, varianze e proporzioni. Dopo qualche iterazione le due gaussiane si posano sulle due gobbe.

**K-NN.** Stima non parametrica: fisso $K$, allargo una cella attorno a $\mathbf{x}$ finché contiene $K$ campioni e stimo $\hat{p}(\mathbf{x})=\frac{K}{N\,V_K(\mathbf{x})}$. È consistente se $K_N\to\infty$ e $K_N/N\to 0$, per esempio $K=\sqrt{N}$. Come classificatore: fra i $K$ vicini $K_i$ sono della classe $\omega_i$, la posterior stimata è $K_i/K$ e vince la classe più rappresentata. Esempio: $K=3$, due vicini salmoni e uno spigola: classifico salmone, con posterior stimata $2/3$.`,
    checklist: [
      'EM: stima ML con dati incompleti, dati osservati e variabili mancanti',
      md`E-step con $Q(\boldsymbol{\theta},\boldsymbol{\theta}^{(k)})$ e M-step con l'arg max`,
      'verosimiglianza non decrescente, massimo locale, ruolo dell’inizializzazione',
      'mistura di gaussiane: parametri, posterior del modo come dato mancante',
      'M-step come stime ML pesate di prior, medie e covarianze',
      md`K-NN: $\hat{p}=K/(N V_K)$, condizioni di consistenza, regola di classificazione con un esempio`,
    ],
    followUps: [
      {
        q: 'Perché serve EM per la mistura e non basta annullare la derivata?',
        a: md`La log-verosimiglianza contiene il logaritmo di una somma, $\sum_j\ln\sum_i P_i\,p(\mathbf{x}_j|\mathbf{m}_i,\Sigma_i)$: annullando le derivate ottengo equazioni accoppiate senza soluzione in forma chiusa. EM le risolve alternando i due passi.`,
      },
      {
        q: 'Che cosa succede se una gaussiana della mistura si stringe su un solo campione?',
        a: md`Con $\mathbf{m}_i=\mathbf{x}_j$ e $\Sigma_i=\sigma^2I$, per $\sigma\to 0$ la densità in $\mathbf{x}_j$ diverge e la verosimiglianza va all'infinito: il massimo globale è degenere. Si evita con vincoli sulla covarianza o ripartendo da un'altra inizializzazione.`,
      },
    ],
  },
  {
    id: 'or-banca-6',
    q: md`Finestre di Parzen: contesto generale (che cosa vogliamo fare, perché è una stima non parametrica), kernel gaussiano a simmetria sferica con formula e disegno. Come la scelta della larghezza influenza la stima? È una buona stima (bias, varianza, caratteristiche della larghezza per una stima consistente)?`,
    qEn: 'Parzen windows: general context (what we want to do, why it is a non-parametric estimation), the Gaussian kernel with spherical symmetry with formula and drawing. How does the choice of the width affect the estimate? Is it a good estimate (bias, variance, conditions on the width for a consistent estimate)?',
    prof: 'Melgani',
    fromBank: true,
    bankText:
      'Parzen Windows: general context (what we want to do, why they are non parametric estimation), gaussian kernel with spherical symmetry with formula and some drawing to represent it, How the choice of the width impacts our estimate? Is it a good estimate? (Bias, variance and consideration about the characteristics of the width to have a consistent estimate)',
    answer: md`**Contesto.** Voglio la pdf $p(\mathbf{x})$ senza assumerne la forma: nessuna famiglia parametrica, quindi nessun parametro da stimare. Uso direttamente i campioni. Fisso una regione di volume $V=h^n$ attorno al punto, conto i campioni che ci cadono con una funzione finestra $\gamma$ e stimo

$$\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^{n}}\,\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)$$

Se $\gamma$ è una densità, lo è anche la stima.

**Kernel gaussiano a simmetria sferica** (metodo di Specht):

$$\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^{2})^{n/2}}\exp\left(-\frac{\Vert\mathbf{x}-\mathbf{x}_k\Vert^{2}}{2\sigma^{2}}\right)$$

Ogni addendo è la gaussiana multivariata $N(\mathbf{x}_k,\sigma^2I)$: vettore media sul campione e covarianza $\Sigma=\sigma^2I$. Con quella $\Sigma$ ho $|\Sigma|^{1/2}=\sigma^n$ e la distanza di Mahalanobis diventa la distanza euclidea divisa per $\sigma$; $\Sigma$ è diagonale, quindi il kernel è il prodotto di $n$ gaussiane 1-D con la stessa larghezza. «Sferica» vuol dire isolivelli circolari: tutte le direzioni pesano uguale, per questo prima normalizzo le feature.

**Disegno.** Nel piano delle feature metto i campioni; su ognuno una campana con curve di livello circolari, tutte uguali; la stima è la loro somma divisa per $N$, alta dove i campioni si addensano. In 1-D: una gaussiana di area $1/N$ su ogni campione e la curva somma sopra.

**Effetto della larghezza.** $\sigma$ (o $h$) cambia insieme altezza e larghezza di ogni campana, ad area costante. Con $\sigma$ grande le campane si fondono: stima liscia che perde i dettagli (*oversmoothing*). Con $\sigma$ piccola la stima è una fila di picchi sui campioni, molto variabile (*overfitting*). Più campioni permettono una larghezza più piccola.

**È una buona stima?** Con campioni iid la media della stima è una convoluzione, $E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})*\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$: una versione sfocata della pdf vera, distorta a $h$ finito e asintoticamente non distorta se $h_N\to 0$. La varianza è limitata da $\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{Nh_N^n}$ e va a zero se $Nh_N^n\to\infty$. La stima è consistente se valgono insieme

$$\lim_{N\to+\infty}h_N=0,\qquad \lim_{N\to+\infty}Nh_N^n=+\infty$$

per esempio $h_N=1/\sqrt[2n]{N}$. A $N$ finito resta il compromesso: la larghezza giusta bilancia bias e varianza.`,
    checklist: [
      md`contesto non parametrico e formula generale con il fattore $1/h^n$`,
      md`formula di Specht con $(2\pi\sigma^2)^{n/2}$ e $\Vert\mathbf{x}-\mathbf{x}_k\Vert^2$`,
      md`kernel come gaussiana $N(\mathbf{x}_k,\sigma^2I)$: covarianza diagonale, isolivelli circolari, feature normalizzate`,
      'disegno: una campana su ogni campione e la loro somma',
      'effetto della larghezza: oversmoothing contro stima rumorosa',
      'bias come convoluzione, bound sulla varianza, due condizioni di consistenza con un esempio',
    ],
    followUps: [
      {
        q: md`Come cambierebbe il kernel con una $\Sigma$ piena invece di $\sigma^2I$?`,
        a: md`Diventerebbe $\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{x}_k)^t\Sigma^{-1}(\mathbf{x}-\mathbf{x}_k)\right]$: isolivelli ellittici lungo gli autovettori di $\Sigma$, adatti a feature con scale diverse o correlate, senza normalizzarle prima.`,
      },
      {
        q: md`A $h$ fisso, più campioni migliorano la stima?`,
        a: md`Riducono la varianza ma non il bias: la media della stima, la convoluzione con il kernel, non dipende da $N$.`,
      },
    ],
  },
  {
    id: 'or-banca-7',
    q: md`Stima a finestre di Parzen: contesto e proprietà. Qual è la funzione finestra più comune (scrivi la formula)? Parzen è un buon stimatore (bias e varianza)? Mostra con un disegno come funzionano il conteggio e l'interpolazione con un paio di campioni.`,
    qEn: 'Parzen window estimation: context and properties. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Show graphically how counting and interpolation work with a couple of samples.',
    prof: 'Melgani',
    fromBank: true,
    bankText:
      'Parzen Window Estimation: context, properties etc. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Graphical representation of how the counting/interpolation works with  a couple of samples.',
    answer: md`**Contesto.** Stima non parametrica: parto da $\hat{p}(\mathbf{x})=\frac{K}{NV}$ e fisso la regione, un ipercubo di lato $h$ e volume $V=h^n$ centrato in $\mathbf{x}$. Conto i campioni dentro con la finestra $\gamma(\mathbf{u})$, che vale 1 se $|u_j|\le 1/2$ per ogni $j$ e 0 altrimenti. Ammettendo un kernel qualsiasi:

$$\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^{n}}\,\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)$$

Proprietà del kernel: $\gamma\ge 0$ e area 1, così la stima è una densità; per una buona stima anche massimo nell'origine, continuità e decadimento a zero.

**La finestra più comune.** La gaussiana, cioè la pdf univariata del modulo con media 0 e varianza 1:

$$\gamma(u)=\frac{1}{\sqrt{2\pi}}\,e^{-\frac{u^{2}}{2}},\qquad \frac{1}{h}\gamma\left(\frac{x-x_k}{h}\right)=\frac{1}{h\sqrt{2\pi}}\,e^{-\frac{(x-x_k)^{2}}{2h^{2}}}$$

Riscalata, è la gaussiana $N(x_k, h^2)$: $h$ fa da deviazione standard, il picco vale $\frac{1}{h\sqrt{2\pi}}$ e l'area resta 1. La stima di Parzen con kernel gaussiano è quindi una mistura di $N$ gaussiane uguali, di peso $1/N$, centrate sui campioni. In $n$ dimensioni con simmetria sferica la covarianza di ogni campana è $h^2I$.

**Buon stimatore?** Distorto a $h$ finito: $E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})*\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$ è la pdf vera sfocata dal kernel; asintoticamente non distorto con $h_N\to 0$. Varianza al più $\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{Nh_N^n}$: va a zero con $Nh_N^n\to\infty$. Con le due condizioni insieme è consistente. Il compromesso: $h$ grande riduce la varianza e alza il bias, $h$ piccolo il contrario.

**Disegno con due campioni** $x_1<x_2$. Conteggio: su ogni campione poso un rettangolo di base $h$ e altezza $\frac{1}{2h}$; la somma è una scaletta che vale $0$, $\frac{1}{2h}$ oppure $\frac{1}{h}$ dove i rettangoli si sovrappongono, con salti in $x_k\pm h/2$. Interpolazione: al posto dei rettangoli metto due campane gaussiane di area $\frac{1}{2}$ e larghezza $h$; la somma è una curva liscia, con una sola gobba se $x_2-x_1\le 2h$ e due gobbe se i campioni sono più lontani. In entrambi i disegni l'area totale è 1: il contributo di un campione passa da «dentro o fuori» a graduato con la distanza.`,
    checklist: [
      md`contesto: $\hat{p}=K/(NV)$ con regione fissa di volume $h^n$ e finestra a ipercubo`,
      'proprietà richieste al kernel (non negativo, area 1, massimo nell’origine, continuo, decrescente)',
      'formula del kernel gaussiano e sua lettura come gaussiana N(x_k, h²)',
      'bias come convoluzione e non distorsione asintotica',
      'bound sulla varianza e consistenza',
      'disegno con due campioni: scaletta dei rettangoli e curva liscia, una o due gobbe',
    ],
    followUps: [
      {
        q: md`Quando la somma di due gaussiane di larghezza $h$ ha una sola gobba?`,
        a: md`Con pesi uguali, quando la distanza fra i centri è al più $2h$: in mezzo la somma ha derivata seconda non positiva e il punto medio resta un massimo. Oltre $2h$ il punto medio diventa un minimo e compaiono due massimi.`,
      },
      {
        q: 'Perché il kernel gaussiano dà stime migliori del rettangolo?',
        a: md`È continuo e derivabile, quindi la stima non ha salti; e pesa i campioni in modo graduale con la distanza invece di contarli come dentro o fuori.`,
      },
    ],
  },
  {
    id: 'or-banca-8',
    q: md`Percettrone e domande sulla stima dei parametri: il problema della soluzione analitica per la regressione con il percettrone; un esempio di stima dei parametri di una gaussiana: perché otteniamo una gaussiana anche come posterior? Come si usa la stima dei parametri nelle reti bayesiane? Perché la ML è veloce nelle reti bayesiane (indipendenza delle CPD)?`,
    qEn: 'Perceptron and parameter estimation questions: the problem with the analytical solution for perceptron regression; an example of estimation of Gaussian parameters: why do we obtain a Gaussian also as posterior? How is parameter estimation used in Bayesian networks? Why is ML fast in Bayesian networks (CPD independence)?',
    prof: 'Passerini',
    fromBank: true,
    bankText:
      'Perceptron (All) + Parameter estimation Questions: - Problem with analytical solution for perceptron regression - Example of estimation of Gaussian parameters: why do we obtain a Gaussian also as posterior? - How to use parameter estimation in Bayesian Networks - Why ML is fast in Bayesian Network (CDP independence)',
    answer: md`**Soluzione analitica per la regressione lineare.** Con uscita lineare $f(\mathbf{x})=\mathbf{w}^t\mathbf{x}$ ed errore quadratico, annullando il gradiente ottengo $\mathbf{w}=(X^tX)^{-1}X^t\mathbf{y}$. Il problema è l'inversione di $X^tX$: costa $O(d^3)$ con $d$ feature e diventa instabile o impossibile se $X^tX$ è quasi singolare, per esempio con feature correlate o con meno esempi che feature. $X^tX$ (con i dati centrati e diviso per $N$) è la matrice di covarianza campionaria di questo modulo: il suo rango è al più $\min(n,N-1)$, lo stesso motivo per cui $\hat{\Sigma}$ non è invertibile con pochi campioni. Per questo si usa la discesa del gradiente o una regolarizzazione. La regola del percettrone invece non ha forma chiusa: aggiorna $\mathbf{w}$ solo sugli esempi classificati male.

**Stima dei parametri di una gaussiana.** Con $N$ campioni iid da $N(\mu,\sigma^2)$ e $\sigma^2$ nota, la ML dà la media campionaria $\hat{\mu}=\bar{X}=\frac{1}{N}\sum_k x_k$. In chiave bayesiana metto un prior gaussiano $p(\mu)\sim N(\mu_0,\sigma_0^2)$. La posterior è proporzionale a verosimiglianza per prior:

$$p(\mu|X)=\alpha\prod_{k=1}^{N}p(x_k|\mu)\,p(\mu)=\alpha''\exp\left\{-\frac{1}{2}\left[\left(\frac{N}{\sigma^{2}}+\frac{1}{\sigma_0^{2}}\right)\mu^{2}-2\left(\frac{1}{\sigma^{2}}\sum_{k}x_k+\frac{\mu_0}{\sigma_0^{2}}\right)\mu\right]\right\}$$

**Perché è gaussiana.** Il prodotto di esponenziali è l'esponenziale della somma degli esponenti, e ogni esponente è quadratico in $\mu$: la somma resta un polinomio di secondo grado in $\mu$ con coefficiente negativo davanti a $\mu^2$. L'esponenziale di una quadratica in $\mu$, normalizzato, è una gaussiana in $\mu$. Il prior gaussiano è coniugato alla verosimiglianza gaussiana. Completando il quadrato:

$$\mu_N=\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\bar{X}+\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\mu_0,\qquad \sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}$$

La media a posteriori è una media pesata fra la stima ML e il prior; per $N\to\infty$ tende a $\bar{X}$ e $\sigma_N^2\to 0$.

**Reti bayesiane.** La congiunta si fattorizza secondo il grafo, $p(x_1,\dots,x_n)=\prod_i p(x_i|pa_i)$, e i parametri sono quelli delle distribuzioni condizionate (CPD) di ogni nodo. Con dati completi la log-verosimiglianza diventa una somma di termini locali, uno per nodo: ogni CPD si stima da sola. Per variabili discrete la stima ML è un conteggio, $\hat{P}(x_i=a\,|\,pa_i=b)=\frac{N(x_i=a,\,pa_i=b)}{N(pa_i=b)}$; per un nodo gaussiano sono la media e la varianza campionarie di questo modulo, calcolate sui dati del nodo. Con conoscenza a priori uso la stima MAP; con dati incompleti EM.

**Perché la ML è veloce.** Per la scomposizione appena vista: invece di un'ottimizzazione congiunta su tutti i parametri risolvo tanti problemi piccoli e indipendenti, ciascuno in forma chiusa (conteggi o medie). I parametri di CPD diverse non interagiscono nella verosimiglianza.`,
    checklist: [
      md`soluzione in forma chiusa $\mathbf{w}=(X^tX)^{-1}X^t\mathbf{y}$ e problemi dell'inversione (costo, singolarità, legame con il rango di $\hat{\Sigma}$)`,
      'stima ML della media gaussiana come media campionaria',
      'posterior come verosimiglianza per prior, esponente quadratico in μ, prior coniugato',
      md`formule di $\mu_N$ e $\sigma_N^2$ e loro limite per $N\to\infty$`,
      'reti bayesiane: fattorizzazione, verosimiglianza come somma di termini locali, stima ML per conteggio',
      'velocità della ML: problemi separati per ogni CPD, ciascuno in forma chiusa',
    ],
    followUps: [
      {
        q: md`Che cosa succede alla posterior se il prior è molto vago, $\sigma_0^2\to\infty$?`,
        a: md`Il peso del prior $\frac{\sigma^2}{N\sigma_0^2+\sigma^2}$ tende a zero: $\mu_N\to\bar{X}$ e $\sigma_N^2\to\sigma^2/N$. La stima bayesiana torna la ML.`,
      },
      {
        q: 'E se il prior non fosse gaussiano?',
        a: md`La posterior non sarebbe in generale gaussiana: l'esponente non sarebbe più quadratico in $\mu$. La comodità del caso gaussiano viene dalla coniugazione.`,
      },
    ],
  },
  {
    id: 'or-banca-9',
    q: md`Apprendimento non supervisionato: qual è la formula dell'algoritmo EM, e in particolare il passo M per il modello a mistura di gaussiane?`,
    qEn: "Unsupervised learning: what is the formula of the EM algorithm, and in particular the M-step for the Gaussian mixture model?",
    prof: 'Passerini',
    fromBank: true,
    bankText: "Unsupervised learning Q: what's the formula of the EM-algo, M-step for the Gaussian mixture model (because I wrote the e step formula but not the m step one)",
    answer: md`**Il modello.** Una mistura di $M$ gaussiane: $p(\mathbf{x})=\sum_{i=1}^{M}P_i\,p(\mathbf{x}|\mathbf{m}_i,\Sigma_i)$, con pesi $P_i\ge 0$ che sommano a 1. Per ogni campione $\mathbf{x}_j$ una variabile latente $z_{ji}\in\{0,1\}$ dice quale componente l'ha generato; i dati osservati sono incompleti perché $z$ manca.

**Formula generale.** EM alterna

$$\text{E-step:}\ \ Q(\boldsymbol{\theta},\boldsymbol{\theta}^{(k)})=E\left\{\log p(X,Z|\boldsymbol{\theta})\ \middle|\ X,\boldsymbol{\theta}^{(k)}\right\},\qquad \text{M-step:}\ \ \boldsymbol{\theta}^{(k+1)}=\arg\max_{\boldsymbol{\theta}}Q(\boldsymbol{\theta},\boldsymbol{\theta}^{(k)})$$

**E-step per la mistura.** Il valore atteso di $z_{ji}$ è la probabilità a posteriori (la responsabilità) della componente $i$ per il campione $j$:

$$\gamma_{ji}=E\{z_{ji}\}=\frac{P_i\,p(\mathbf{x}_j|\mathbf{m}_i,\Sigma_i)}{\sum_{l=1}^{M}P_l\,p(\mathbf{x}_j|\mathbf{m}_l,\Sigma_l)}$$

**M-step.** Con $N_i=\sum_{j=1}^{N}\gamma_{ji}$, il numero «efficace» di campioni della componente $i$:

$$\mathbf{m}_i^{new}=\frac{1}{N_i}\sum_{j=1}^{N}\gamma_{ji}\,\mathbf{x}_j,\qquad \Sigma_i^{new}=\frac{1}{N_i}\sum_{j=1}^{N}\gamma_{ji}\,(\mathbf{x}_j-\mathbf{m}_i^{new})(\mathbf{x}_j-\mathbf{m}_i^{new})^t,\qquad P_i^{new}=\frac{N_i}{N}$$

**Da dove vengono.** $Q$ è una somma pesata dai $\gamma_{ji}$ di log-verosimiglianze gaussiane. Annullo il gradiente rispetto a $\mathbf{m}_i$ e a $\Sigma_i$ esattamente come nella stima ML di una sola gaussiana, dove ottengo $\hat{\mathbf{m}}=\frac{1}{N}\sum_k\mathbf{x}_k$ e $\hat{\Sigma}=\frac{1}{N}\sum_k(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t$; qui ogni campione conta con il suo peso $\gamma_{ji}$. Per i pesi $P_i$ serve un moltiplicatore di Lagrange per il vincolo $\sum_i P_i=1$. La media si aggiorna prima della covarianza, che usa la media nuova.

**Controllo.** Con responsabilità 0 o 1 (etichette note) $N_i$ è il numero di campioni della componente, e le formule diventano la frequenza relativa, la media campionaria e la covarianza ML di ogni gruppo.`,
    checklist: [
      'mistura di gaussiane con pesi, medie e covarianze; variabili latenti di appartenenza',
      'formula generale di EM: E-step con Q, M-step con arg max',
      'responsabilità come probabilità a posteriori della componente',
      md`M-step: $\mathbf{m}_i$ e $\Sigma_i$ come medie pesate, $P_i=N_i/N$`,
      'origine: stime ML della gaussiana pesate dalle responsabilità, Lagrange per i pesi',
    ],
    followUps: [
      {
        q: 'Perché nella covarianza si usa la media già aggiornata?',
        a: md`Nell'M-step massimizzo $Q$ rispetto a medie e covarianze insieme: la condizione sulla media non contiene la covarianza, quindi la risolvo prima e la sostituisco, come nel caso di una sola gaussiana con $\hat{\mathbf{m}}$ dentro $\hat{\Sigma}$.`,
      },
      {
        q: 'Che legame c’è con il k-means?',
        a: md`Se tutte le covarianze sono $\sigma^2I$ con $\sigma\to 0$, le responsabilità diventano 0 o 1: ogni punto va alla media più vicina e l'M-step ricalcola i baricentri. È il k-means.`,
      },
    ],
  },
  {
    id: 'or-banca-10',
    q: md`Apprendimento non supervisionato, più il kernel gaussiano legato alla distanza gaussiana. All'orale: spiega meglio il meccanismo di EM per la mistura di gaussiane e il risultato; che cosa sono i kernel e quando li usiamo?`,
    qEn: 'Unsupervised learning, plus the Gaussian kernel related to the Gaussian distance. In the oral part: explain better the EM mechanism for Gaussian mixtures and the result; what are kernels and when do we use them?',
    prof: 'Passerini',
    fromBank: true,
    bankText:
      'Unsupervised learning (everything I knew) + gaussian kernel related to gaussian distance (he said something during lessons, nothing in slides about that). During the oral part he asked me to explain better the mechanism of EM used for gaussian mixture and to explain the result then he asked me what are kernels and when we use them',
    answer: md`**Kernel gaussiano e distanza.** Il kernel gaussiano è

$$k(\mathbf{x},\mathbf{x}')=\exp\left(-\frac{\Vert\mathbf{x}-\mathbf{x}'\Vert^{2}}{2\sigma^{2}}\right)$$

cioè la pdf gaussiana $N(\mathbf{x}',\sigma^2I)$ senza la costante di normalizzazione. Dipende dai due punti solo attraverso la loro distanza: vale 1 se coincidono e scende verso 0 quando si allontanano; $\sigma$ decide quanto in fretta. Con $\Sigma=\sigma^2I$ la forma quadratica della gaussiana, $(\mathbf{x}-\mathbf{x}')^t\Sigma^{-1}(\mathbf{x}-\mathbf{x}')$, è la distanza euclidea al quadrato divisa per $\sigma^2$. Con una $\Sigma$ piena ottengo la versione con la distanza di Mahalanobis, $\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{x}')^t\Sigma^{-1}(\mathbf{x}-\mathbf{x}')\right]$, che tiene conto delle scale e delle correlazioni delle feature. Il kernel è una misura di somiglianza costruita come densità gaussiana della distanza.

**Meccanismo di EM per la mistura.** La mistura $p(\mathbf{x})=\sum_i P_i\,p(\mathbf{x}|\mathbf{m}_i,\Sigma_i)$ ha una variabile nascosta: quale componente ha generato ogni punto. Parto da parametri iniziali e alterno due passi. E-step: per ogni punto calcolo la responsabilità di ogni componente, $\gamma_{ji}=\frac{P_i\,p(\mathbf{x}_j|\mathbf{m}_i,\Sigma_i)}{\sum_l P_l\,p(\mathbf{x}_j|\mathbf{m}_l,\Sigma_l)}$, un'assegnazione morbida. M-step: ristimo ogni componente con le stime ML della gaussiana, pesando ogni punto con la sua responsabilità: media pesata, covarianza pesata dei prodotti esterni degli scarti, peso $P_i=N_i/N$. La verosimiglianza non diminuisce mai e il processo converge a un massimo locale.

**Il risultato.** Ottengo un modello generativo della densità dei dati, una somma di campane con centro $\mathbf{m}_i$ e forma $\Sigma_i$ (ellissi di isolivello lungo gli autovettori), e per ogni punto un clustering morbido: le responsabilità dicono con che probabilità appartiene a ciascun gruppo. Rispetto al k-means ogni cluster ha la sua forma ellittica e un peso.

**Che cosa sono i kernel e quando si usano.** Un kernel è una funzione $k(\mathbf{x},\mathbf{x}')=\boldsymbol{\phi}(\mathbf{x})^t\boldsymbol{\phi}(\mathbf{x}')$ che calcola il prodotto scalare fra le immagini dei punti in uno spazio di feature, spesso di dimensione molto grande o infinita (è il caso del gaussiano), senza calcolare $\boldsymbol{\phi}$. Per essere valido deve essere simmetrico e semidefinito positivo: la matrice di Gram $K_{ij}=k(\mathbf{x}_i,\mathbf{x}_j)$ deve avere autovalori non negativi, la stessa proprietà della matrice di covarianza. Li uso quando i dati non sono separabili (o non si modellano bene) con un modello lineare nelle feature originali: in ogni algoritmo che dipende dai dati solo attraverso prodotti scalari (SVM, kernel PCA, regressione con kernel) sostituisco il prodotto scalare con $k$ e ottengo un modello non lineare, con lo stesso algoritmo lineare nello spazio delle feature.`,
    checklist: [
      'formula del kernel gaussiano e lettura come gaussiana N(x′, σ²I) non normalizzata',
      'dipendenza dalla sola distanza; versione con la distanza di Mahalanobis',
      'EM per la mistura: variabile nascosta, E-step con le responsabilità, M-step con stime ML pesate',
      'risultato: modello di densità e clustering morbido, confronto con k-means',
      'kernel come prodotto scalare nello spazio delle feature, simmetria e semidefinitezza',
      'quando usarli: problemi non lineari, algoritmi basati su prodotti scalari (kernel trick)',
    ],
    followUps: [
      {
        q: 'Perché il kernel gaussiano corrisponde a uno spazio di feature di dimensione infinita?',
        a: md`Sviluppando $\exp\left(\frac{\mathbf{x}^t\mathbf{x}'}{\sigma^2}\right)$ in serie di Taylor compaiono monomi di ogni grado: il prodotto scalare implicito ha infiniti termini.`,
      },
      {
        q: md`Che effetto ha $\sigma$ in un classificatore con kernel gaussiano?`,
        a: md`Con $\sigma$ piccola la somiglianza è locale e la frontiera segue i singoli punti (rischio di overfitting); con $\sigma$ grande la somiglianza è quasi costante e la frontiera diventa quasi lineare. È lo stesso compromesso della larghezza nelle finestre di Parzen.`,
      },
    ],
  },

  // --- domande proprie sulle parti più chieste --------------------------------------------------------
  {
    id: 'or-scelta-modello',
    q: md`Come si sceglie il modello statistico per $p(\mathbf{x})$? Quali modelli conosci e come si confrontano?`,
    qEn: 'How do you select the statistical model for p(x)? Which models do you know and how do they compare?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Perché serve sceglierlo.** La stima parametrica presuppone di aver fissato la forma analitica di $p(\mathbf{x})$: poi si stimano pochi parametri. Se la famiglia è sbagliata, anche lo stimatore migliore dà parametri privi di senso.

**I tre aspetti.** La slide dice di considerarne tre:

1. la natura statistica intrinseca del fenomeno fisico: l'eco di un radar prodotta da molti diffusori ha ampiezza Rayleigh, un tempo d'attesa è positivo e asimmetrico;
2. il rumore introdotto nella trasmissione (dal mezzo di propagazione) e nell'acquisizione (dal sensore): il dato osservato è fenomeno più rumore;
3. il pre-processing e l'estrazione delle feature fatti prima del sistema di riconoscimento: un quadrato trasforma una Rayleigh in un'esponenziale, una media di molti valori avvicina alla gaussiana, un logaritmo trasforma una log-normale in gaussiana.

**I sei modelli.** Gaussiana, $f(x;\mu,\sigma)=\frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}$: due parametri, simmetrica, su tutto l'asse. Gaussiana generalizzata, $f(x;m,b,\beta)=\frac{b\beta}{2\Gamma(1/\beta)}e^{-[b|x-m|]^\beta}$: tre parametri; con $\beta=2$ è la gaussiana, con $\beta=1$ la laplaciana, con $\beta$ grande quasi uniforme. Gamma, $f(x;k,\theta)=x^{k-1}\frac{e^{-x/\theta}}{\theta^k\Gamma(k)}$ per $x>0$: forma $k$ e scala $\theta$, usata nella teoria delle code. Rayleigh, $f(x|\sigma)=\frac{x}{\sigma^2}e^{-\frac{x^2}{2\sigma^2}}$: un parametro, moda in $x=\sigma$, per segnali diffusi in radar e comunicazioni. Chi-quadro, $f(x;k)=\frac{(1/2)^{k/2}}{\Gamma(k/2)}x^{k/2-1}e^{-x/2}$: $k$ gradi di libertà, è una Gamma con forma $k/2$ e scala 2, usata nei test d'ipotesi. Log-normale, $f(x;\mu,\sigma)=\frac{e^{-(\ln x-\mu)^2/(2\sigma^2)}}{x\sigma\sqrt{2\pi}}$: il logaritmo è gaussiano, asimmetria positiva, per dati finanziari.

**Confronto.** Gaussiana e gaussiana generalizzata vivono su tutto l'asse e sono simmetriche; Gamma, Rayleigh, chi-quadro e log-normale vivono sui positivi e hanno la coda a destra. Parametri: 2, 3, 2, 1, 1, 2.

**Non è banale.** Le note avvertono che la selezione del modello non è un compito banale: Gamma e log-normale possono adattarsi quasi ugualmente bene agli stessi dati positivi, e una gaussiana su dati solo positivi vicini a zero assegna probabilità a valori impossibili.`,
    checklist: [
      'la stima parametrica presuppone la forma di p(x)',
      'i tre aspetti: natura del fenomeno, rumore di trasmissione e acquisizione, pre-processing',
      'le sei famiglie con formula e un uso tipico',
      'confronto: supporto, simmetria, numero di parametri',
      'casi particolari: β = 2 e β = 1, chi-quadro come Gamma',
      'perché la selezione non è banale',
    ],
    followUps: [
      {
        q: 'Da dove viene il fattore 1/x della log-normale?',
        a: md`Dal cambio di variabile: se $y=\ln x\sim N(\mu,\sigma^2)$, allora $p_x(x)=p_y(\ln x)\left|\frac{dy}{dx}\right|=p_y(\ln x)\frac{1}{x}$. $\mu$ e $\sigma$ sono media e deviazione standard del logaritmo, non di $x$.`,
      },
      {
        q: 'Dove sta il massimo della Rayleigh e quanto vale?',
        a: md`Annullando la derivata, $\frac{1}{\sigma^2}e^{-x^2/(2\sigma^2)}\left(1-\frac{x^2}{\sigma^2}\right)=0$, trovo $x=\sigma$, con valore $\frac{1}{\sigma\sqrt{e}}\approx\frac{0.607}{\sigma}$: raddoppiando $\sigma$ la moda raddoppia e il picco si dimezza.`,
      },
      {
        q: md`Con $\beta=2$, che legame c'è fra $b$ e $\sigma$?`,
        a: md`Confrontando gli esponenti, $b^2=\frac{1}{2\sigma^2}$, cioè $b=\frac{1}{\sigma\sqrt{2}}$; con $\Gamma(1/2)=\sqrt{\pi}$ la costante diventa $\frac{1}{\sigma\sqrt{2\pi}}$.`,
      },
    ],
  },
  {
    id: 'or-limite-centrale',
    q: md`Perché il modello gaussiano è così usato? Enuncia il teorema del limite centrale e discuti le sue ipotesi.`,
    qEn: 'Why is the Gaussian model so widely used? State the central limit theorem and discuss its hypotheses.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Il modello.** Il modello gaussiano è parametrico e usatissimo: in una dimensione bastano media e varianza, in $n$ dimensioni vettore media e matrice di covarianza. Il motivo del suo successo è il teorema del limite centrale (*Central Limit Theorem*).

**Enunciato del corso.** Se la somma di molte variabili iid ha varianza finita, allora è distribuita approssimativamente in modo normale. Il teorema non chiede nulla sulla forma delle singole variabili.

**Versione precisa.** Con $S_n=\sum_{i=1}^n x_i$, $E\{S_n\}=n\mu$ e $var\{S_n\}=n\sigma^2$ crescono con $n$, quindi il limite si enuncia sulla somma standardizzata:

$$\frac{S_n-n\mu}{\sigma\sqrt{n}}\ \xrightarrow[n\to+\infty]{}\ N(0,1)$$

**Le ipotesi.** Molte variabili: con $n=1$ non si somma nulla e la forma resta quella della singola variabile; l'approssimazione migliora con $n$. Indipendenti e identicamente distribuite: se sommo $n$ copie della stessa variabile ottengo solo la variabile riscalata, con la sua forma. Varianza finita: per variabili indipendenti $var\{S_n\}=n\sigma^2$, finita se e solo se lo è $\sigma^2$; con variabili di Cauchy, che non hanno varianza, la media resta una Cauchy per ogni $n$.

**Ubiquità.** Molti processi reali nascono da tante cause indipendenti, ognuna con un piccolo effetto, e hanno varianza finita: il rumore termico di un sensore, gli errori di misura. Per il teorema la loro somma è circa gaussiana, e la gaussiana compare in signal processing, machine learning, economia e ingegneria.

**Esempi dal modulo.** Una Gamma con forma $k$ intera è la somma di $k$ esponenziali indipendenti: al crescere di $k$ diventa sempre più simmetrica e simile a una gaussiana. Nelle immagini radar il *multi-look* media più osservazioni indipendenti dello stesso pixel e ne rende la statistica più vicina alla gaussiana.`,
    checklist: [
      'modello parametrico usatissimo, motivato dal limite centrale',
      'enunciato della slide: somma di molte variabili iid con varianza finita, approssimativamente normale',
      'somma standardizzata e convergenza alla N(0,1)',
      'le tre ipotesi con un controesempio per ciascuna',
      'ubiquità: molte cause indipendenti con piccolo effetto',
    ],
    followUps: [
      {
        q: 'Il teorema dice che le singole variabili devono essere gaussiane?',
        a: md`No: le variabili possono avere qualunque distribuzione con varianza finita (uniformi, esponenziali, discrete). Gaussiana diventa la somma.`,
      },
      {
        q: 'Perché la varianza della somma è nσ²?',
        a: md`Per variabili indipendenti le covarianze incrociate sono nulle e le varianze si sommano: $var\{S_n\}=\sum_i var\{x_i\}=n\sigma^2$.`,
      },
    ],
  },
  {
    id: 'or-covarianza',
    q: md`Definisci vettore media e matrice di covarianza e dimostra le proprietà della covarianza.`,
    qEn: 'Define the mean vector and the covariance matrix and prove the properties of the covariance matrix.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Definizioni.** Media e covarianza definiscono completamente la gaussiana multivariata:

$$\mathbf{m}=E\{\mathbf{x}\},\qquad \Sigma=Cov\{\mathbf{x}\}=E\left\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\right\}=E\left\{\mathbf{x}\mathbf{x}^{t}\right\}-\mathbf{m}\mathbf{m}^{t}$$

$m_i=E\{x_i\}$ è la media della feature $i$; $[\Sigma]_{ii}=\sigma_i^2$ è la sua varianza, $[\Sigma]_{ij}=\sigma_{ij}=E\{(x_i-m_i)(x_j-m_j)\}$ la covarianza fra le feature $i$ e $j$. In 2-D:

$$\Sigma=\begin{bmatrix}\sigma_1^{2}&\rho\,\sigma_1\sigma_2\\\rho\,\sigma_1\sigma_2&\sigma_2^{2}\end{bmatrix},\qquad |\Sigma|=\sigma_1^2\sigma_2^2(1-\rho^2)$$

**Le due forme.** Sviluppo il prodotto esterno, porto fuori $\mathbf{m}$ che è costante e uso $E\{\mathbf{x}\}=\mathbf{m}$: $E\{\mathbf{x}\mathbf{x}^t\}-\mathbf{m}\mathbf{m}^t-\mathbf{m}\mathbf{m}^t+\mathbf{m}\mathbf{m}^t=E\{\mathbf{x}\mathbf{x}^t\}-\mathbf{m}\mathbf{m}^t$. È la versione matriciale di $var\{x\}=E\{x^2\}-(E\{x\})^2$.

**Simmetria.** $(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^t$ coincide con la sua trasposta e la trasposizione commuta con il valore atteso: $\Sigma=\Sigma^t$. Gli elementi distinti sono $\frac{n(n+1)}{2}$.

**Semidefinita positiva.** Per ogni $\mathbf{a}$:

$$\mathbf{a}^{t}\Sigma\,\mathbf{a}=E\left\{\left(\mathbf{a}^{t}(\mathbf{x}-\mathbf{m})\right)^{2}\right\}=var\{\mathbf{a}^{t}\mathbf{x}\}\ge 0$$

La forma quadratica è la varianza dei dati proiettati sulla direzione $\mathbf{a}$. Con $\mathbf{a}=\mathbf{e}_i$ unitario ottengo $\lambda_i=var\{\mathbf{e}_i^t\mathbf{x}\}\ge 0$: gli autovalori sono varianze. In 2-D la semidefinitezza è il vincolo $|\rho|\le 1$. Perché la gaussiana esista serve di più, $\Sigma$ definita positiva: con un autovalore nullo $|\Sigma|=0$ e $\Sigma^{-1}$ non esiste.

**Feature indipendenti.** Se $x_i$ e $x_j$ sono indipendenti, $\sigma_{ij}=E\{x_i-m_i\}E\{x_j-m_j\}=0$: $\Sigma$ è diagonale, con le varianze sulla diagonale, e la gaussiana si fattorizza in $p(x_1)p(x_2)\dots p(x_n)$.

**Dai dati.** $\hat{\Sigma}=\frac{1}{N}\sum_k(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t$ (stima ML, distorta) oppure con $\frac{1}{N-1}$ (non distorta).`,
    checklist: [
      md`definizioni di $\mathbf{m}$ e $\Sigma$ con le due forme e la dimostrazione dell'equivalenza`,
      'contenuto elemento per elemento, forma 2-D con ρ',
      'simmetria e numero di elementi distinti',
      md`semidefinitezza: $\mathbf{a}^t\Sigma\mathbf{a}$ come varianza della proiezione, autovalori non negativi`,
      'differenza fra semidefinita e definita positiva per l’esistenza della gaussiana',
      'feature indipendenti: covarianza diagonale e fattorizzazione',
    ],
    followUps: [
      {
        q: md`Covarianza nulla implica indipendenza?`,
        a: md`In generale no: con $x\sim N(0,1)$ e $y=x^2$, $\sigma_{xy}=E\{x^3\}-E\{x\}E\{x^2\}=0$ ma $y$ è funzione di $x$. Per un vettore congiuntamente gaussiano sì, perché con $\Sigma$ diagonale la pdf si fattorizza.`,
      },
      {
        q: md`Quanto vale $|\Sigma|$ e che cosa misura?`,
        a: md`È il prodotto degli autovalori, cioè delle varianze lungo gli assi dell'ellisse: misura il volume della nuvola. L'ellisse di raggio di Mahalanobis $r$ ha area $\pi r^2|\Sigma|^{1/2}$ in 2-D.`,
      },
    ],
  },
  {
    id: 'or-forma-gaussiana',
    q: md`Descrivi la forma di una gaussiana a 2 e a $n$ dimensioni: isolivelli, autovalori e autovettori della covarianza.`,
    qEn: 'Describe the shape of a 2-D and of an n-D Gaussian pdf: isolevels, eigenvalues and eigenvectors of the covariance matrix.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Una campana di volume 1.** In 2-D $p(\mathbf{x})$ è una superficie a campana sopra il piano $(x_1,x_2)$, con il massimo $\frac{1}{2\pi|\Sigma|^{1/2}}$ in $\mathbf{m}$ e volume unitario: $\iint p(x_1,x_2)\,dx_1\,dx_2=1$ per ogni $\mathbf{m}$ e $\Sigma$.

**Isolivelli.** Taglio la campana a quota $c$: $p(\mathbf{x})=c$ equivale a

$$(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})=r^{2},\qquad r^{2}=-2\ln\left[c\,(2\pi)^{n/2}|\Sigma|^{1/2}\right]$$

una distanza di Mahalanobis costante: l'equazione di un'ellisse centrata in $\mathbf{m}$. Esiste solo per $0<c\le p(\mathbf{m})$; alla quota del picco degenera nel punto $\mathbf{m}$. Tutte le ellissi sono concentriche, con la stessa orientazione e lo stesso rapporto fra gli assi; quota più bassa vuol dire ellisse più grande. Nella figura della slide 28 $z=3$ è il picco e le ellissi $z=2$, $0.5$ e $0.01$ si allargano verso l'esterno.

**Assi e autovettori.** Scrivo $\Sigma=U\Lambda U^t$ con gli autovettori unitari come colonne di $U$. Nelle coordinate ruotate $\mathbf{y}=U^t(\mathbf{x}-\mathbf{m})$ i termini misti spariscono:

$$\sum_{i=1}^{n}\frac{y_i^{2}}{\lambda_i}=r^{2}$$

Gli assi dell'ellisse sono diretti dagli autovettori, i semiassi valgono $r\sqrt{\lambda_i}$: l'autovettore del massimo autovalore definisce l'asse principale, la direzione di massima varianza. Se $\lambda_1=\lambda_2$ l'ellisse è un cerchio. In 2-D gli autovalori vengono da $\lambda^{2}-(\sigma_1^{2}+\sigma_2^{2})\lambda+(\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2})=0$; con $\sigma_{12}\neq 0$ gli assi sono ruotati rispetto a $x_1$, $x_2$.

**n dimensioni.** Con $\lambda_1\ge\lambda_2\ge\dots\ge\lambda_n$ e autovettori $\mathbf{e}_1,\dots,\mathbf{e}_n$: $\Sigma$ simmetrica e semidefinita positiva ha autovalori non negativi (positivi se la gaussiana esiste) e autovettori che formano una base ortogonale. Gli isolivelli sono iperellissi in $\Re^n$; il primo autovettore definisce l'asse principale, l'ultimo l'asse più piccolo.

**Esempio 3-D (slide 30).** La nuvola di punti riempie un ellissoide; le sue ombre sulle pareti del cubo sono ellissi. L'ellisse sul piano $(x_1,x_3)$ ha gli assi paralleli agli assi coordinati: $\sigma_{13}=0$, e per una gaussiana le feature $x_1$ e $x_3$ sono indipendenti.

**Perché volume 1.** Nelle coordinate $\mathbf{y}$ l'integrale si spezza in $n$ integrali 1-D, ognuno $\sqrt{2\pi\lambda_i}$; il prodotto è $(2\pi)^{n/2}|\Sigma|^{1/2}$, esattamente il denominatore della formula.`,
    checklist: [
      'campana di volume unitario con massimo in m',
      'isolivelli come ellissi a distanza di Mahalanobis costante; quota e dimensione',
      md`decomposizione $\Sigma=U\Lambda U^t$ e forma canonica $\sum_i y_i^2/\lambda_i=r^2$`,
      md`assi lungo gli autovettori, semiassi $r\sqrt{\lambda_i}$, asse principale con il massimo autovalore`,
      'generalizzazione a n dimensioni: ordinamento, base ortogonale, iperellissi, asse principale e più piccolo',
      'lettura delle figure delle slide 28 e 30',
    ],
    followUps: [
      {
        q: md`Che cosa cambia nelle ellissi se $\Sigma$ è diagonale?`,
        a: md`Gli autovettori sono gli assi coordinati e le ellissi non sono ruotate; i semiassi sono $r\sigma_1$ e $r\sigma_2$. Se in più $\sigma_1=\sigma_2$ sono cerchi.`,
      },
      {
        q: 'Che frazione dei campioni cade dentro l’ellisse di raggio di Mahalanobis r in 2-D?',
        a: md`$1-e^{-r^2/2}$, perché $r^2$ di un campione gaussiano 2-D è un chi-quadro con 2 gradi di libertà. Con $r=1$ è il 39%, con $r=2$ l'86%, con $r=3$ il 99%.`,
      },
    ],
  },
  {
    id: 'or-stima-ml-gaussiana',
    q: md`Quali sono le stime ML del vettore media e della matrice di covarianza di una gaussiana, e che proprietà hanno? Dimostra che la stima della covarianza è distorta.`,
    qEn: 'What are the ML estimates of the mean vector and of the covariance matrix of a Gaussian, and what properties do they have? Prove that the covariance estimate is biased.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Le stime.** Con $N$ campioni iid $X=\{\mathbf{x}_1,\dots,\mathbf{x}_N\}$ la slide 31 dà:

$$\hat{\mathbf{m}}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k,\qquad \hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t}-\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}$$

La slide dice «it can be shown»: si ottengono annullando il gradiente della log-verosimiglianza, prima rispetto a $\mathbf{m}$ (la somma degli scarti deve essere nulla) poi rispetto a $\Sigma^{-1}$. Sono le versioni campionarie di $\mathbf{m}=E\{\mathbf{x}\}$ e di $\Sigma=E\{\mathbf{x}\mathbf{x}^t\}-\mathbf{m}\mathbf{m}^t$.

**Proprietà.** Sono asintoticamente non distorte, efficienti e consistenti. Inoltre $E\{\hat{\mathbf{m}}\}=\mathbf{m}$ per ogni $N$, mentre $E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$.

**Dimostrazione del bias.** Uso la seconda forma e la linearità:

$$E\{\hat{\Sigma}\}=\frac{1}{N}\sum_{k}E\{\mathbf{x}_k\mathbf{x}_k^{t}\}-E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}\}$$

Per ogni campione $E\{\mathbf{x}_k\mathbf{x}_k^{t}\}=\Sigma+\mathbf{m}\mathbf{m}^{t}$. Per la media campionaria, con i campioni indipendenti, i termini incrociati si annullano e $Cov\{\hat{\mathbf{m}}\}=\frac{1}{N^2}\sum_k Cov\{\mathbf{x}_k\}=\frac{1}{N}\Sigma$, quindi $E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}\}=\frac{1}{N}\Sigma+\mathbf{m}\mathbf{m}^{t}$. Sottraendo:

$$E\{\hat{\Sigma}\}=\Sigma+\mathbf{m}\mathbf{m}^{t}-\frac{1}{N}\Sigma-\mathbf{m}\mathbf{m}^{t}=\frac{N-1}{N}\Sigma$$

**Perché sottostima.** Gli scarti sono misurati da $\hat{\mathbf{m}}$, calcolata sugli stessi dati e quindi più vicina a loro della media vera: la media stimata assorbe una parte $\frac{1}{N}\Sigma$ della variabilità. Con $N=1$ la stima è la matrice nulla.

**Stimatore corretto.** Moltiplico per $\frac{N}{N-1}$: $\hat{\Sigma}=\frac{1}{N-1}\sum_k(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t$ ha valore atteso $\Sigma$ ma non è più la stima ML. Conta con pochi campioni: con $N=2$ la ML vale in media metà del vero, con $N=100$ il 99%.

**Efficienza e consistenza.** L'informazione di Fisher per $\mathbf{m}$ è $N\Sigma^{-1}$: il bound di Cramér-Rao è $\frac{1}{N}\Sigma$, proprio $Cov\{\hat{\mathbf{m}}\}$, quindi $\hat{\mathbf{m}}$ è efficiente per ogni $N$; con Chebyshev la varianza che va a zero dà la consistenza. Per $\hat{\Sigma}$ le proprietà valgono solo asintoticamente. Serve anche $N\ge n+1$: il rango di $\hat{\Sigma}$ è al più $\min(n,N-1)$ e con meno campioni la stima non è invertibile.`,
    checklist: [
      md`formule di $\hat{\mathbf{m}}$ e di $\hat{\Sigma}$ nelle due forme, con il fattore $\frac{1}{N}$`,
      'origine: gradiente della log-verosimiglianza annullato',
      'proprietà asintotiche: non distorte, efficienti, consistenti',
      md`$E\{\hat{\mathbf{m}}\}=\mathbf{m}$ ed $E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$ con la dimostrazione`,
      md`ruolo dell'indipendenza in $Cov\{\hat{\mathbf{m}}\}=\frac{1}{N}\Sigma$`,
      md`stimatore non distorto con $\frac{1}{N-1}$ e quando conta`,
    ],
    followUps: [
      {
        q: md`Quanti campioni servono perché $\hat{\Sigma}$ sia invertibile?`,
        a: md`Almeno $n+1$, non contenuti in un sottospazio affine di dimensione minore: gli scarti $\mathbf{x}_k-\hat{\mathbf{m}}$ sommano a zero e generano al più $N-1$ dimensioni. Con molte feature e pochi campioni è il problema dell'effetto Hughes.`,
      },
      {
        q: md`Perché la varianza ML può essere più piccola del bound di Cramér-Rao?`,
        a: md`Il bound vale per gli stimatori non distorti; $\hat{\sigma}^2$ è distorta. In 1-D $var\{\hat{\sigma}^2\}=\frac{2(N-1)}{N^2}\sigma^4<\frac{2\sigma^4}{N}$, mentre lo stimatore corretto ha $\frac{2\sigma^4}{N-1}$, sopra il bound.`,
      },
    ],
  },
  {
    id: 'or-indipendenza',
    q: md`Feature indipendenti e covarianza nulla: che relazione c'è? Come si legge la nota della slide 30 sulle feature $x_1$ e $x_3$?`,
    qEn: 'Independent features and zero covariance: what is the relation? How do you read the note of slide 30 about features x1 and x3?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**La slide 27.** «For independent features» la matrice di covarianza è diagonale, e una freccia porta a $p(\mathbf{x})=p(x_1)\,p(x_2)\dots p(x_n)$.

**Indipendenza ⟹ covarianza nulla, sempre.** Se $x_i$ e $x_j$ sono indipendenti, $p(x_i,x_j)=p(x_i)p(x_j)$ e l'integrale doppio si spezza:

$$\sigma_{ij}=\iint(x_i-m_i)(x_j-m_j)\,p(x_i)\,p(x_j)\,dx_i\,dx_j=E\{x_i-m_i\}\,E\{x_j-m_j\}=0$$

Vale per qualunque distribuzione.

**Covarianza nulla ⟹ indipendenza, solo per la gaussiana.** In generale è falso: con $x\sim N(0,1)$ e $y=x^2$, $\sigma_{xy}=E\{x^3\}-E\{x\}E\{x^2\}=0$, eppure $y$ è funzione di $x$. La covarianza misura solo la dipendenza lineare. Per un vettore congiuntamente gaussiano invece basta: con $\Sigma$ diagonale il determinante è $\prod_i\sigma_i^2$, l'inversa è diagonale, la forma quadratica diventa $\sum_i\frac{(x_i-m_i)^2}{\sigma_i^2}$ e l'esponenziale della somma si spezza nel prodotto:

$$p(\mathbf{x})=\prod_{i=1}^{n}\frac{1}{\sigma_i\sqrt{2\pi}}\exp\left[-\frac{(x_i-m_i)^{2}}{2\sigma_i^{2}}\right]=p(x_1)\,p(x_2)\dots p(x_n)$$

Nel modello gaussiano «$\Sigma$ diagonale», «feature incorrelate» e «feature indipendenti» sono la stessa cosa.

**La slide 30.** Una nuvola 3-D con le proiezioni sulle tre pareti del cubo e la nota «In this example, the features x1 and x3 are independent!». Lo si vede dall'ellisse sul piano $(x_1,x_3)$: ha gli assi paralleli agli assi coordinati, quindi $\sigma_{13}=\sigma_{31}=0$, e per una gaussiana questo basta. Le altre due proiezioni sono inclinate: quelle coppie sono correlate. È un'indipendenza a coppie: $x_1$ e $x_3$ possono diventare dipendenti se conosco $x_2$, perché l'indipendenza condizionata richiede lo zero in $\Sigma^{-1}$, non in $\Sigma$.

**Conseguenza pratica.** Con feature indipendenti stimo $n$ varianze invece di $\frac{n(n+1)}{2}$ elementi: è l'ipotesi del classificatore naive Bayes gaussiano. Il kernel di Parzen a simmetria sferica, $\Sigma=\sigma^2I$, è il caso con tutte le varianze uguali.`,
    checklist: [
      'lettura della slide 27: Σ diagonale e fattorizzazione',
      'dimostrazione di indipendenza ⟹ covarianza nulla, valida per ogni distribuzione',
      md`controesempio $y=x^2$ per il viceversa`,
      'fattorizzazione della gaussiana con Σ diagonale',
      'lettura della figura 3-D: ellisse (x1, x3) non ruotata, σ13 = 0',
      'indipendenza marginale contro condizionata',
    ],
    followUps: [
      {
        q: 'In una matrice 3×3 dove si vede che x1 e x3 sono indipendenti?',
        a: md`Negli elementi $(1,3)$ e $(3,1)$, che valgono zero. Gli altri elementi fuori diagonale possono essere non nulli.`,
      },
      {
        q: 'Qual è il numero di parametri di una gaussiana con feature indipendenti?',
        a: md`$2n$: le $n$ medie e le $n$ varianze, contro $n+\frac{n(n+1)}{2}$ con $\Sigma$ piena.`,
      },
    ],
  },
  {
    id: 'or-mahalanobis',
    q: md`Che cos'è la distanza di Mahalanobis e che ruolo ha nella gaussiana multivariata?`,
    qEn: 'What is the Mahalanobis distance and what role does it play in the multivariate Gaussian?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Definizione.** All'esponente della gaussiana c'è la forma quadratica

$$(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m}),\qquad d_M(\mathbf{x},\mathbf{m})=\sqrt{(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})}$$

Le note la chiamano distanza di Mahalanobis fra $\mathbf{x}$ e il vettore media; a rigore la distanza è la radice, la forma quadratica ne è il quadrato.

**Che cosa misura.** La distanza dalla media in unità di deviazione standard lungo ogni direzione, tenendo conto delle correlazioni. Con $\Sigma=I$ coincide con la distanza euclidea. Con $\Sigma$ diagonale ogni scarto è diviso per la deviazione standard della sua feature: $d_M^2=\sum_i\frac{(x_i-m_i)^2}{\sigma_i^2}$. Nel caso generale, nelle coordinate degli autovettori, $d_M^2=\sum_i\frac{y_i^2}{\lambda_i}$: gli scarti lungo le direzioni di grande varianza pesano meno.

**Esempio.** Con $\mathbf{m}=\mathbf{0}$ e $\Sigma=diag(4,1)$ i punti $A=(2,0)$ e $B=(0,2)$ hanno la stessa distanza euclidea, 2. La distanza di Mahalanobis vale 1 per $A$ e 2 per $B$; il rapporto delle densità è $\frac{p(A)}{p(B)}=\frac{e^{-1/2}}{e^{-2}}=e^{1.5}\approx 4.48$. Lungo $x_1$ la nuvola è più larga e lo scarto di $A$ è meno sorprendente.

**Ruolo nella gaussiana.** $p(\mathbf{x})=p(\mathbf{m})\,e^{-d_M^2/2}$: la densità dipende da $\mathbf{x}$ solo attraverso la distanza di Mahalanobis. Punti alla stessa distanza hanno la stessa densità, quindi gli isolivelli sono ellissi (iperellissi) di raggio costante. $\mathbf{m}$ ne fissa il centro, $\Sigma$ forma e orientazione. In 1-D si riduce a $\frac{(x-\mu)^2}{\sigma^2}$, lo scarto in deviazioni standard al quadrato.

**Dove torna.** Nelle funzioni discriminanti per classi gaussiane con la stessa $\Sigma$: si assegna alla classe con la distanza di Mahalanobis minima (corretta dai prior). Il classificatore a distanza minima dalla media usa invece la distanza euclidea, cioè ignora $\Sigma$.`,
    checklist: [
      'forma quadratica all’esponente e distanza come sua radice',
      'misura in deviazioni standard, tiene conto delle correlazioni; Σ = I dà l’euclidea',
      'caso diagonale e forma nelle coordinate degli autovettori',
      'esempio numerico con distanza euclidea uguale e Mahalanobis diversa',
      'densità funzione della sola distanza: isolivelli ellittici',
      'uso nei classificatori: Mahalanobis contro distanza euclidea',
    ],
    followUps: [
      {
        q: md`Perché serve $\Sigma^{-1}$ e non $\Sigma$?`,
        a: md`Per dividere per la varianza: in 1-D $\Sigma^{-1}=1/\sigma^2$. Una direzione con grande varianza deve pesare meno, quindi compare l'inversa, che ha gli stessi autovettori e autovalori $1/\lambda_i$.`,
      },
      {
        q: 'Che distribuzione ha d_M² per un campione gaussiano in n dimensioni?',
        a: md`Un chi-quadro con $n$ gradi di libertà: nelle coordinate degli autovettori standardizzate $d_M^2$ è la somma dei quadrati di $n$ gaussiane standard indipendenti.`,
      },
    ],
  },
]
