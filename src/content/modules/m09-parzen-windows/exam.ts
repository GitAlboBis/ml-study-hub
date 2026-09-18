// Domande d'orale del modulo m09 (finestre di Parzen): le quattro della banca d'esame (testo verbatim in bankText)
// più sei domande sulle parti più chieste da Melgani. Le risposte sono in prima persona, come le direbbe lo studente.
import { md } from '../../types'
import type { ExamQuestion } from '../../types'

export const exam: ExamQuestion[] = [
  // --- banca d'esame ---
  {
    id: 'or-banca-1',
    q: md`Stima a finestre di Parzen: contesto e proprietà. Qual è la funzione finestra più comune (scrivi la formula)? Parzen è un buon stimatore (bias e varianza)? Mostra con un disegno come funzionano il conteggio e l'interpolazione con una coppia di campioni.`,
    qEn: 'Parzen window estimation: context and properties. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Show graphically how counting and interpolation work with a couple of samples.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Parzen Window Estimation: context, properties etc. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Graphical representation of how the counting/interpolation works with  a couple of samples.',
    answer: md`**Contesto.** Voglio stimare la pdf $p(\mathbf{x})$ senza assumere una forma parametrica: lavoro direttamente sui campioni di addestramento. Parto da $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$. Nel metodo di Parzen fisso la regione, un ipercubo di lato $h$ e volume $V = h^n$, e conto i campioni con la funzione finestra $\gamma$, che vale 1 dentro l'ipercubo unitario e 0 fuori:

$$K = \sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right)$$

Sostituendo e ammettendo un kernel qualsiasi ottengo

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\,\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$$

Il kernel dev'essere una densità ($\gamma \ge 0$, area 1): con $V = h^n$ lo è anche la stima. Per una stima buona chiedo anche massimo nell'origine, continuità e decadimento a zero.

**Kernel più comune.** Il gaussiano, $\gamma(x) = \frac{1}{\sqrt{2\pi}}\exp\left(-\frac{x^2}{2}\right)$. In $n$ dimensioni, con simmetria sferica (metodo di Specht):

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\Vert\mathbf{x} - \mathbf{x}_k\Vert^2}{2\sigma^2}\right)$$

È liscio, derivabile, e dà stime continue.

**È un buon stimatore?** Con campioni i.i.d. la media della stima è una convoluzione, $E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$: una versione sfocata di $p$, quindi a $h$ finito la stima è distorta. Se $h_N \to 0$ il kernel riscalato tende alla delta di Dirac e la stima diventa asintoticamente non distorta. La varianza è limitata:

$$E\left\{\left(\hat{p}(\mathbf{x}) - \bar{\hat{p}}(\mathbf{x})\right)^2\right\} \le \frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$$

e va a zero se $N h_N^n \to +\infty$. Con le due condizioni insieme la stima è consistente, per esempio con $h_N = 1/\sqrt[2n]{N}$. A $N$ finito resta il compromesso: $h$ grande sfoca, $h$ piccolo insegue il rumore.

**Disegno con due campioni.** Metto $x_1$ e $x_2$ sull'asse. Conteggio: su ogni campione poso un rettangolo di base $h$ e altezza $\frac{1}{Nh}$; la somma è una scaletta che vale $0$, $\frac{1}{2h}$ oppure $\frac{1}{h}$ dove i rettangoli si sovrappongono, con salti in $x_k \pm h/2$. Interpolazione: al posto dei rettangoli disegno due campane gaussiane di area $1/2$; la somma è una curva liscia, con una sola gobba se $\vert x_1 - x_2 \vert \le 2h$ e due gobbe altrimenti. L'area resta 1 in entrambi i disegni: cambia che il contributo passa da «dentro o fuori» a graduato con la distanza.`,
    checklist: [
      md`contesto non parametrico e stima di base $K/(NV)$ con regione fissa`,
      md`formula generale con il fattore $1/V(h)$`,
      md`kernel gaussiano scritto per esteso (1-D o sferico di Specht)`,
      md`media della stima come convoluzione: stima distorta, versione sfocata di $p$`,
      md`non distorsione asintotica con $h_N \to 0$ (delta di Dirac)`,
      md`bound sulla varianza e condizioni di consistenza con un esempio di $h_N$`,
      md`disegno con due campioni: scaletta dei rettangoli e curva liscia delle gaussiane`,
    ],
    followUps: [
      { q: md`Perché nella stima serve il fattore $1/h^n$?`, a: md`Con il cambio di variabile $\mathbf{u} = (\mathbf{x} - \mathbf{x}_k)/h$ si ha $d\mathbf{x} = h^n\,d\mathbf{u}$: un kernel non riscalato avrebbe area $h^n$. Il fattore $1/h^n$ riporta l'area a 1.` },
      { q: md`A $h$ fisso, più campioni migliorano la stima?`, a: md`Riducono la varianza, non il bias: $E\{\hat{p}(\mathbf{x})\}$ non dipende da $N$. La stima si concentra attorno alla versione sfocata di $p$.` },
      { q: md`Che cosa succede alla media della stima in un punto dove $p$ ha un salto?`, a: md`Con un kernel simmetrico tende alla media dei limiti destro e sinistro: sul bordo di una densità uniforme vale circa metà dell'altezza.` },
    ],
  },
  {
    id: 'or-banca-2',
    q: md`Finestre di Parzen: contesto generale (che cosa vogliamo fare, perché è una stima non parametrica), kernel gaussiano a simmetria sferica con formula e disegno, effetto della scelta della larghezza sulla stima. È una buona stima? (Bias, varianza e caratteristiche della larghezza per avere una stima consistente.)`,
    qEn: 'Parzen windows: general context (what we want to do, why it is a non-parametric estimation), the Gaussian kernel with spherical symmetry with formula and a drawing, how the choice of the width affects the estimate. Is it a good estimate? (Bias, variance and the conditions on the width for a consistent estimate.)',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Parzen Windows: general context (what we want to do, why they are non parametric estimation), gaussian kernel with spherical symmetry with formula and some drawing to represent it, How the choice of the width impacts our estimate? Is it a good estimate? (Bias, variance and consideration about the characteristics of the width to have a consistent estimate)',
    answer: md`**Contesto.** Voglio la pdf di un fenomeno senza sapere che forma abbia: nessun modello parametrico, quindi nessun vettore di parametri da stimare. Uso direttamente i campioni: fisso una regione di volume $V = h^n$ attorno al punto, conto i campioni che ci cadono e stimo $\hat{p} = K/(NV)$. Con un kernel generale la stima diventa una media di finestre centrate sui campioni.

**Kernel gaussiano sferico (Specht).**

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\Vert\mathbf{x} - \mathbf{x}_k\Vert^2}{2\sigma^2}\right)$$

Disegno: nel piano delle feature metto i campioni; su ognuno una campana con curve di livello circolari, tutte con la stessa $\sigma$; la stima è la loro somma divisa per $N$, alta dove i campioni si addensano. $\sigma$ è uguale lungo tutte le feature, quindi prima normalizzo le feature. Posso anche usare una $\sigma_k$ adattiva, la distanza media dai $L$ vicini più prossimi.

**Effetto della larghezza.** Con $\delta(\mathbf{x}) = \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$ la stima è $\frac{1}{N}\sum_k \delta(\mathbf{x} - \mathbf{x}_k)$. $h$ cambia insieme ampiezza e larghezza di $\delta$, ad area 1: per la finestra normale 2-D il picco passa da $0.159$ ($h = 1$) a $0.637$ ($h = 0.5$) a $3.98$ ($h = 0.2$). Con $h$ grande la stima è la somma di funzioni larghe: sovra-lisciata, perde i picchi (*oversmoothing*). Con $h$ piccolo è una somma di aghi sui campioni: molto variabile, insegue il rumore (*overfitting*). Con più campioni posso usare un $h$ più piccolo.

**È una buona stima?** La media è $E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$, una versione sfocata: distorta a $h$ finito, asintoticamente non distorta se $h_N \to 0$. La varianza è al più $\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$. Per la consistenza servono insieme

$$\lim_{N\to+\infty} h_N = 0,\qquad \lim_{N\to+\infty} N h_N^n = +\infty$$

la prima toglie il bias, la seconda la varianza. Esempio: $h_N = 1/\sqrt[2n]{N}$, che dà $N h_N^n = \sqrt{N}$. Se $h_N$ si stringe troppo in fretta la stima diventa rumorosa, se si stringe troppo piano resta sfocata.`,
    checklist: [
      md`contesto: nessuna forma funzionale, stima da $K/(NV)$ con regione fissa`,
      md`formula di Specht con $(2\pi\sigma^2)^{n/2}$ e $\Vert\mathbf{x} - \mathbf{x}_k\Vert^2$`,
      md`disegno: una campana a curve di livello circolari su ogni campione, poi la somma`,
      md`normalizzazione delle feature e $\sigma$ come parametro di smoothing`,
      md`effetto di $h$ su ampiezza e larghezza di $\delta(\mathbf{x})$, ad area costante`,
      md`sovra-lisciatura con $h$ grande, stima rumorosa con $h$ piccolo`,
      md`bias (convoluzione), varianza (bound) e condizioni $h_N \to 0$, $N h_N^n \to +\infty$ con esempio`,
    ],
    followUps: [
      { q: md`Perché bisogna normalizzare le feature prima della stima?`, a: md`$\sigma$ è la stessa in tutte le direzioni: una feature con scala numerica più grande dominerebbe $\Vert\mathbf{x} - \mathbf{x}_k\Vert$ e le sfere del kernel non rispetterebbero i dati.` },
      { q: md`Che cosa succede per $\sigma \to 0$ e per $\sigma \to +\infty$?`, a: md`Con $\sigma \to 0$ la stima diventa $N$ impulsi sui campioni (varianza che esplode). Con $\sigma \to +\infty$ ogni gaussiana si spalma ovunque e la stima diventa piatta.` },
      { q: md`Come si potrebbe scegliere una $\sigma$ diversa per ogni campione?`, a: md`$\sigma_k = \frac{1}{L}\sum_{l=1}^{L}\Vert\mathbf{x}_k - \mathbf{y}_l\Vert$, la distanza media dai $L$ vicini più prossimi: piccola dove i campioni sono fitti, grande dove sono radi.` },
    ],
  },
  {
    id: 'or-banca-3',
    q: md`Stima K-NN: come funziona? Disegna un grafico di esempio e descrivi la distribuzione; che cosa vogliono dire *overfit* e *oversmooth*? Come funziona il classificatore K-NN (con un esempio)? Infine: quali sono le differenze con le finestre di Parzen?`,
    qEn: 'K-NN estimation: how does it work? Draw an example graph and describe the distribution; what do overfitting and oversmoothing mean? How does the K-NN classifier work (with an example)? Finally, what are the differences with Parzen windows?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'K-NN estimation, how does it works, we draw a graph for example and asked how is the distribution, what does it mean overfit and oversmooth. Then he asked how the K-NN classifier works and made an example. Last question what are the difference with parzen window',
    answer: md`**Stima K-NN.** Parto da $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$, ma fisso $K$: attorno a $\mathbf{x}^*$ allargo la cella finché contiene $K$ campioni e misuro il suo volume $V_K(\mathbf{x}^*)$:

$$\hat{p}(\mathbf{x}^*) = \frac{K}{N\,V_K(\mathbf{x}^*)}$$

**Grafico.** In 1-D la stima è appuntita: picchi dove i campioni sono fitti e code che scendono piano senza mai arrivare a zero, perché lontano dai dati la cella si allarga ma resta finita. Con $K$ piccolo la stima è rumorosa e segue i singoli campioni (*overfit*); con $K$ grande è sovra-lisciata e perde le strutture, come due mode che si fondono (*oversmooth*). Con più campioni, per esempio $K = \sqrt{N}$, la forma bimodale emerge sempre meglio.

**Classificatore K-NN.** Per classificare $\mathbf{x}$ cerco i suoi $K$ vicini più prossimi fra i campioni di addestramento e assegno la classe più rappresentata. Viene da Bayes: con $\hat{p}(\mathbf{x}\mid\omega_i) = \frac{K_i}{N_i V}$ e $P(\omega_i) = \frac{N_i}{N}$ la probabilità a posteriori è proporzionale a $K_i$. Esempio con il pesce: $K = 5$, fra i vicini 3 salmoni e 2 spigole: classifico salmone.

**Differenze con Parzen.**

- Parzen fissa il volume ($V = h^n$) e conta $K$; il K-NN fissa $K$ e misura $V$. Nell'illustrazione di ch2 p46: $V = 1/\sqrt{N}$ contro $K = \sqrt{N}$.
- Il parametro da scegliere è $h$ in un caso, $K$ nell'altro.
- Parzen con un kernel liscio dà una stima liscia di area 1; può valere zero dove non cade nessun campione (kernel a supporto limitato). Il K-NN non si annulla mai, ha code pesanti e non integra a 1.
- Il K-NN si adatta alla densità locale; in Parzen la finestra ha la stessa larghezza ovunque (salvo la $\sigma_k$ adattiva).
- Entrambi convergono: Parzen con $h_N \to 0$ e $N h_N^n \to +\infty$, il K-NN con $K_N \to +\infty$ e $K_N/N \to 0$.`,
    checklist: [
      md`stima K-NN: cella allargata fino a $K$ campioni, $\hat{p} = K/(N\,V_K(\mathbf{x}^*))$`,
      md`disegno: stima appuntita con code che non vanno a zero`,
      md`$K$ piccolo *overfit*, $K$ grande *oversmooth*`,
      md`classificatore: voto di maggioranza fra i $K$ vicini, con un esempio`,
      md`Parzen fissa $V$ e conta $K$, il K-NN fissa $K$ e misura $V$`,
      md`Parzen può valere zero ed è liscia di area 1; il K-NN non si annulla mai`,
    ],
    followUps: [
      { q: md`Quali condizioni servono al K-NN per essere consistente?`, a: md`$K_N \to +\infty$ e $K_N/N \to 0$ per $N \to +\infty$ (necessarie e sufficienti nei punti di continuità), per esempio $K_N = \sqrt{N}$.` },
      { q: md`Perché la stima di Parzen può valere esattamente zero?`, a: md`Con un kernel a supporto limitato, come il rettangolo, in una zona senza campioni la finestra è vuota: $K = 0$. Il K-NN invece allarga la cella finché trova $K$ campioni.` },
    ],
  },
  {
    id: 'or-banca-4',
    q: md`Spiega la stima non parametrica: che cosa significa e perché si usa. Spiega K-NN e finestre di Parzen: tendono alla soluzione ottima? Poi: stima ML, derivata prima per una gaussiana e significato del risultato; infine il *box classifier*.`,
    qEn: 'Explain non-parametric estimation: what it means and why we use it. Explain both K-NN and Parzen windows: do they tend to the optimal solution? Then explain ML estimation, develop the first derivative for a Gaussian and explain the result; finally, explain the box classifier.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Explain non-parametric estimation, what non-parametric means and why we use it, explain both KNN and Parzen windows, do they tend to the optimal solution? Explain ML estimation, develop the first derivative for a gaussian and explain the meaning of the result. Explain box classifier',
    answer: md`**Non parametrica.** Non assumo una forma funzionale per la pdf, quindi non stimo parametri: lavoro direttamente sui campioni. Serve quando non so che forma abbia la densità o quando i modelli parametrici la approssimano male (per esempio una densità bimodale). Entrambi i metodi partono da $P_R \approx p(\mathbf{x}^*)V$ e $\hat{P}_R = K/N$, cioè $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$.

**K-NN e Parzen.** Il K-NN fissa $K$ e allarga la cella fino a contenerne $K$ campioni; Parzen fissa la regione ($V = h^n$) e conta i campioni con il kernel.

**Tendono alla soluzione ottima?** Sì, entrambi convergono alla pdf vera se i parametri seguono $N$:

- Parzen: $\lim h_N = 0$ e $\lim N h_N^n = +\infty$, per esempio $h_N = 1/\sqrt[2n]{N}$;
- K-NN: $\lim K_N = +\infty$ e $\lim K_N/N = 0$, per esempio $K_N = \sqrt{N}$.

Le due coppie dicono la stessa cosa: la regione deve restringersi perché $p$ sia quasi costante al suo interno (niente bias), ma deve contenere sempre più campioni perché valga la legge dei grandi numeri (niente varianza). L'esempio di Parzen dà $V_N = 1/\sqrt{N}$, accanto a $K_N = \sqrt{N}$. Negli esempi grafici, per $N = \infty$ la stima coincide con la densità vera qualunque sia $h_1$; a campione finito il comportamento dipende molto da $h$ o da $K$.

**ML per la gaussiana.** Scelgo i parametri che massimizzano la log-verosimiglianza $l(\mu) = \sum_{k=1}^{N}\ln p(x_k\mid\mu)$. Per una gaussiana 1-D

$$\frac{\partial l}{\partial \mu} = \sum_{k=1}^{N}\frac{x_k - \mu}{\sigma^2} = 0\ \Rightarrow\ \hat{\mu} = \frac{1}{N}\sum_{k=1}^{N}x_k$$

Il significato: la stima ML della media è la media campionaria. Per la varianza si ottiene $\hat{\sigma}^2 = \frac{1}{N}\sum_k (x_k - \hat{\mu})^2$, distorta ma asintoticamente non distorta.

**Box classifier.** A differenza del MDM usa, in modo primitivo, le statistiche del secondo ordine: modella ogni classe con una pdf uniforme centrata sul baricentro della classe, con lati proporzionali alla deviazione standard lungo ogni feature. I box che ne escono sono le regioni di decisione: assegno un campione alla classe il cui box lo contiene. Restano zone non coperte da nessun box e zone ambigue dove i box si sovrappongono.`,
    checklist: [
      md`non parametrica: nessuna forma funzionale, si lavora sui campioni`,
      md`K-NN: $K$ fisso e volume misurato; Parzen: volume fisso e $K$ contato`,
      md`convergenza di Parzen: $h_N \to 0$ e $N h_N^n \to +\infty$, con un esempio`,
      md`convergenza del K-NN: $K_N \to +\infty$ e $K_N/N \to 0$, con $K_N = \sqrt{N}$`,
      md`lettura comune: regione che si restringe ma con sempre più campioni`,
      md`ML per la gaussiana: derivata nulla della log-verosimiglianza, $\hat{\mu}$ = media campionaria`,
      md`box classifier: pdf uniforme sul baricentro con lati proporzionali alla deviazione standard, un box per classe`,
    ],
    followUps: [
      { q: md`L'esempio di Parzen $h_N = 1/\sqrt[2n]{N}$ che volume dà?`, a: md`$V_N = h_N^n = 1/\sqrt{N}$: la stessa legge dell'illustrazione di ch2 p46, e $N V_N = \sqrt{N} \to +\infty$.` },
      { q: md`Perché serve anche $N h_N^n \to +\infty$ e non basta $h_N \to 0$?`, a: md`$h_N \to 0$ toglie il bias, ma se la finestra si stringe troppo in fretta contiene pochi campioni e la varianza, limitata da $\frac{\sup(\gamma)\,\bar{\hat{p}}}{N h_N^n}$, non va a zero.` },
    ],
  },
  // --- domande sulle parti più chieste ---
  {
    id: 'or-formula-generale',
    q: md`Ricava la stima di Parzen partendo da $\hat{p}(\mathbf{x}^*) = K/(NV)$: prima con l'ipercubo, poi con un kernel qualsiasi.`,
    qEn: 'Derive the Parzen estimate starting from p(x*) = K/(NV): first with the hypercube, then with a general kernel.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Prendo come regione un ipercubo $n$-dimensionale di lato $h$ centrato in $\mathbf{x}^*$, con volume $V = h^n$. Per contare i campioni in forma analitica definisco la funzione finestra $\gamma(\mathbf{u})$, che vale 1 se $\vert u_j \vert \le 1/2$ per ogni $j$ e 0 altrimenti. Il campione $\mathbf{x}_k$ è nella regione se e solo se $\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right) = 1$: sottrarre $\mathbf{x}^*$ centra il cubo nell'origine, dividere per $h$ lo porta a lato 1. Quindi

$$K = \sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right),\qquad \hat{p}(\mathbf{x}^*) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}^* - \mathbf{x}_k}{h}\right)$$

Lo scambio di segno è lecito perché l'ipercubo è simmetrico. Questa seconda forma si legge in due modi: un conteggio dei campioni nella finestra su $\mathbf{x}^*$, oppure una somma di rettangoli, uno per campione, di base $h$ e area $1/N$. Siccome $\gamma$ compare solo come funzione di $(\mathbf{x} - \mathbf{x}_k)/h$, posso usare un kernel più generale:

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\,\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$$

Ora il kernel interpola: ogni campione contribuisce secondo la sua distanza da $\mathbf{x}$. Perché la stima sia una densità chiedo che $\gamma$ sia a sua volta una densità e che $V = h^n$: allora, con il cambio di variabile $d\mathbf{x} = h^n d\mathbf{u}$, ogni termine ha area 1 e la media pure.`,
    checklist: [
      md`ipercubo di lato $h$ e volume $V = h^n$`,
      md`funzione finestra $\gamma$ e test di appartenenza con argomento normalizzato`,
      md`$K$ come somma delle $\gamma$ e stima a ipercubo`,
      md`simmetria: da una finestra su $\mathbf{x}^*$ a $N$ finestre sui campioni`,
      md`conteggio e somma di rettangoli come due letture della stessa stima`,
      md`generalizzazione a un kernel qualsiasi e interpolazione`,
      md`condizioni sul kernel ($\gamma \ge 0$, area 1, $V = h^n$) per una densità legittima`,
    ],
    followUps: [
      { q: md`Quali condizioni in più rendono «buono» un kernel?`, a: md`Massimo nell'origine, continuità, $\gamma(\mathbf{x}) \to 0$ per $\Vert\mathbf{x}\Vert \to +\infty$. Il rettangolo è valido ma non continuo: dà stime a gradini.` },
      { q: md`Che cosa succede se sostituisco il rettangolo con una gaussiana?`, a: md`La stima diventa una somma di gaussiane: liscia, senza salti, con i vuoti fra i campioni riempiti dalle code dei kernel.` },
    ],
  },
  {
    id: 'or-effetto-larghezza',
    q: md`Come influisce la larghezza $h$ sulla stima di Parzen? Usa la funzione $\delta(\mathbf{x})$ e le figure delle slide.`,
    qEn: 'How does the window width h affect the Parzen estimate? Use the function delta(x) and the figures in the slides.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Definisco la finestra riscalata $\delta(\mathbf{x}) = \frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}}{h}\right)$, così la stima è la media di copie traslate: $\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\delta(\mathbf{x} - \mathbf{x}_k)$. Qui $\delta$ non è la delta di Dirac: lo diventa solo per $h \to 0$.

Con $V(h) = h^n$, $h$ agisce su due cose insieme: l'ampiezza, $\delta(\mathbf{0}) = \gamma(\mathbf{0})/h^n$, e la larghezza, tramite $\mathbf{x}/h$. L'area resta sempre 1. Per la finestra normale 2-D il picco è $\frac{1}{2\pi h^2}$: $0.159$, $0.637$ e $3.98$ per $h = 1$, $0.5$, $0.2$, come nella figura di ch2 p56.

- $h$ grande: $\delta$ bassa e larga, la stima è la somma di $N$ funzioni lente. Si perdono i dettagli e i picchi stretti: sovra-lisciatura (*oversmoothing*).
- $h$ piccolo: $\delta$ alta e stretta, la stima è una fila di impulsi sui campioni. È molto variabile e insegue il rumore (*overfitting*).

Nella figura con cinque campioni 2-D (ch2 p57): con $h = 1$ i rilievi si fondono, con $h = 0.5$ si vedono cinque campane, con $h = 0.2$ cinque aghi. Stessi dati, stime diverse. La regola pratica: più campioni ho, più posso stringere $h$; con pochi campioni devo allargarlo per non lasciare buchi. In termini statistici $h$ grande porta bias, $h$ piccolo porta varianza.`,
    checklist: [
      md`definizione di $\delta(\mathbf{x})$ e stima come media di $\delta(\mathbf{x} - \mathbf{x}_k)$`,
      md`$h$ cambia ampiezza e larghezza di $\delta$, ad area costante`,
      md`valori di picco della finestra normale 2-D per $h = 1$, $0.5$, $0.2$`,
      md`$h$ grande: sovra-lisciatura; $h$ piccolo: stima rumorosa`,
      md`figura dei cinque campioni: stessi dati, stime diverse`,
      md`regola pratica: più campioni, $h$ più piccolo`,
    ],
    followUps: [
      { q: md`Di quanto cresce il picco di $\delta$ se riduco $h$ di 5 volte in 2-D?`, a: md`Di $5^2 = 25$ volte, perché $\delta(\mathbf{0}) \propto 1/h^n$.` },
      { q: md`Il $\delta$ di ch2 p55 e quello di ch2 p60 sono la stessa cosa?`, a: md`No: a p55 è la finestra riscalata a $h$ finito, a p60 è la delta di Dirac. Le due notazioni si raccordano nel limite $h_N \to 0$.` },
    ],
  },
  {
    id: 'or-bias-convoluzione',
    q: md`Dimostra che la media della stima di Parzen è una convoluzione. Che cosa ne segue sul bias?`,
    qEn: 'Show that the mean of the Parzen estimate is a convolution. What does this imply about the bias?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Per linearità del valore atteso

$$E\{\hat{p}(\mathbf{x})\} = \frac{1}{N}\sum_{k=1}^{N}E\left\{\frac{1}{h^n}\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)\right\}$$

I campioni sono i.i.d. con densità $p$, quindi gli $N$ termini hanno la stessa media e resta quella di un solo termine:

$$E\{\hat{p}(\mathbf{x})\} = \int_{\Re^n}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x} - \mathbf{v}}{h}\right)p(\mathbf{v})\,d\mathbf{v} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$$

È una media pesata di $p$ attorno a $\mathbf{x}$ con i pesi della finestra: la media della stima è una versione sfocata della pdf vera. Picchi più bassi, valli riempite, spigoli arrotondati. Quindi a $h$ finito la stima è distorta, e $N$ non compare: aumentando i campioni a $h$ fisso il bias resta.

Se invece $h_N \to 0$, il kernel riscalato $\frac{1}{h_N^n}\gamma\left(\frac{\mathbf{x}}{h_N}\right)$ mantiene area 1 e si stringe: tende alla delta di Dirac, e $p * \delta = p$ nei punti in cui $p$ è continua. La stima è asintoticamente non distorta. Esempio in forma chiusa: pdf vera $\mathcal{N}(\mu, \sigma_p^2)$ e kernel gaussiano danno $E\{\hat{p}(x)\} = \mathcal{N}(x;\ \mu,\ \sigma_p^2 + h^2)$; con $\sigma_p = 1$ e $h = 1$ il picco medio scende del 29%.`,
    checklist: [
      md`linearità del valore atteso e campioni i.i.d.`,
      md`valore atteso come integrale rispetto a $p(\mathbf{v})$`,
      md`riconoscimento della convoluzione`,
      md`lettura: versione sfocata di $p$, stima distorta a $h$ finito, indipendente da $N$`,
      md`limite alla delta di Dirac con $h_N \to 0$: non distorsione asintotica`,
    ],
    followUps: [
      { q: md`Il risultato vale in ogni punto?`, a: md`Il limite $p * \delta = p$ richiede che $p$ sia continua in $\mathbf{x}$. In un punto di salto, con kernel simmetrico, la media tende alla media dei due limiti.` },
      { q: md`Allora basta $h_N \to 0$ per avere una buona stima?`, a: md`No: toglie il bias, ma serve anche $N h_N^n \to +\infty$ perché la varianza vada a zero.` },
    ],
  },
  {
    id: 'or-consistenza-parzen-knn',
    q: md`Quali caratteristiche deve avere la larghezza $h_N$ perché la stima di Parzen sia consistente? Confronta con le condizioni del K-NN.`,
    qEn: 'What characteristics must the width h_N have for the Parzen estimate to be consistent? Compare them with the K-NN conditions.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`La varianza della stima è limitata da

$$E\left\{\left(\hat{p}(\mathbf{x}) - \bar{\hat{p}}(\mathbf{x})\right)^2\right\} \le \frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$$

e la media è la pdf convoluta con il kernel. La stima è consistente se valgono insieme

$$\lim_{N\to+\infty} h_N = 0,\qquad \lim_{N\to+\infty} N h_N^n = +\infty$$

La prima toglie il bias (il kernel tende alla delta di Dirac), la seconda la varianza (il bound va a zero). Tirano $h$ in direzioni opposte: $h_N$ deve andare a zero, ma più piano di $N^{-1/n}$. Per le leggi $h_N = h_1 N^{-a}$ serve $0 < a < 1/n$. L'esempio della slide è $h_N = 1/\sqrt[2n]{N}$, con $N h_N^n = \sqrt{N}$. Se $h_N$ si stringe troppo in fretta la stima è rumorosa; troppo piano, resta sfocata.

Per il K-NN la condizione necessaria e sufficiente è $K_N \to +\infty$ e $K_N/N \to 0$, per esempio $K_N = \sqrt{N}$. Con $V_N = h_N^n$ le condizioni di Parzen diventano $V_N \to 0$ e $N V_N \to +\infty$: sono le stesse, viste da $K \approx N V p(\mathbf{x}^*)$. La regione si restringe perché $p$ sia quasi costante dentro, e contiene sempre più campioni perché valga la legge dei grandi numeri. L'esempio di Parzen dà $V_N = 1/\sqrt{N}$, la stessa legge dell'illustrazione di ch2 p46 accanto a $K = \sqrt{N}$. La differenza: in Parzen la cella si restringe in modo deterministico, nel K-NN si adatta ai dati.`,
    checklist: [
      md`bound sulla varianza con $N h_N^n$ al denominatore`,
      md`le due condizioni e il ruolo di ciascuna (bias, varianza)`,
      md`esempio $h_N = 1/\sqrt[2n]{N}$ con la verifica $N h_N^n = \sqrt{N}$`,
      md`condizioni del K-NN: $K_N \to +\infty$ e $K_N/N \to 0$`,
      md`lettura comune con $V_N = h_N^n$ e $K \approx N V p$`,
    ],
    followUps: [
      { q: md`La legge $h_N = h_1/N$ scritta nella griglia 2-D di ch2 p64 è consistente?`, a: md`No: con $n = 2$ dà $N h_N^2 = h_1^2/N \to 0$. Anche $h_1/\sqrt{N}$ dà $N h_N^2$ costante; una legge consistente in 2-D è $h_1/N^{1/4}$.` },
      { q: md`Che cosa succede al bound se passo da $n = 1$ a $n = 4$ con la stessa finestra a ipercubo di lato $h < 1$?`, a: md`Con l'ipercubo $\sup\gamma = 1$ in ogni dimensione, quindi conta solo $1/h^n$: il volume crolla e, a parità di media della stima, il bound cresce di un fattore $h^{-3}$. Con il gaussiano sferico anche $\sup\gamma = (2\pi)^{-n/2}$ scende, e il bound cresce solo se $h < 1/\sqrt{2\pi} \approx 0.4$. In ogni caso l'ipercubo stretto contiene sempre meno campioni: in alta dimensione ne servono moltissimi (maledizione della dimensionalità, *curse of dimensionality*).` },
    ],
  },
  {
    id: 'or-kernel-validi',
    q: md`Quali proprietà deve avere un kernel di Parzen? Elenca i kernel delle slide e confrontali.`,
    qEn: 'Which properties must a Parzen kernel have? List the kernels in the slides and compare them.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Voglio che la stima sia una densità legittima, non negativa e di area 1. Basta che il kernel sia a sua volta una densità, $\gamma(\mathbf{x}) \ge 0$ e $\int_{\Re^n}\gamma(\mathbf{x})\,d\mathbf{x} = 1$, con $V = h^n$. Per una stima buona aggiungo tre condizioni: massimo nell'origine (i campioni vicini pesano di più), continuità (stimo una pdf liscia), $\gamma(\mathbf{x}) \to 0$ per $\Vert\mathbf{x}\Vert \to +\infty$ (i campioni lontani pesano poco).

I sei kernel delle slide:

- rettangolare $\Pi(x)$: 1 per $\vert x \vert \le 1/2$; semplice ma rozzo, e l'unico non continuo: dà stime a gradini;
- triangolare $\Lambda(x) = 1 - \vert x \vert$ per $\vert x \vert \le 1$: attenuazione lineare, stime più lisce;
- gaussiano $\frac{1}{\sqrt{2\pi}}\exp\left(-\frac{x^2}{2}\right)$: liscio e derivabile, il più usato;
- esponenziale $\frac{1}{2}\exp(-\vert x \vert)$: decadimento rapido, cuspide nell'origine;
- Cauchy $\frac{1}{\pi}\cdot\frac{1}{1+x^2}$: code pesanti, utile con outlier;
- $\text{sinc}^2$, $\frac{1}{2\pi}\left(\frac{\sin(x/2)}{x/2}\right)^2$: oscillante, comune nei segnali; il quadrato lo rende non negativo.

Tutti sono densità con massimo nell'origine e tendono a zero. Il gaussiano vince per regolarità e perché si adatta bene a densità diverse.`,
    checklist: [
      md`kernel come densità: $\gamma \ge 0$, area 1, e $V = h^n$`,
      md`tre condizioni per una stima buona`,
      md`almeno quattro dei sei kernel con formula`,
      md`il rettangolare è l'unico discontinuo`,
      md`perché il sinc va elevato al quadrato`,
      md`perché il gaussiano è il più usato`,
    ],
    followUps: [
      { q: md`Quanto vale $\sup\gamma$ per il gaussiano e dove serve?`, a: md`$1/\sqrt{2\pi} \approx 0.399$. Entra nel bound sulla varianza, $\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$.` },
      { q: md`Che cosa cita in più il materiale delle note sui kernel?`, a: md`Il kernel di Epanechnikov, che minimizza l'errore quadratico medio integrato; le slide non lo riportano.` },
    ],
  },
  {
    id: 'or-specht-adattivo',
    q: md`Metodo di Specht: formula, ruolo di $\sigma$, normalizzazione delle feature, $\sigma$ adattiva e implementazione con le PNN.`,
    qEn: 'Specht method: formula, role of sigma, feature normalization, adaptive sigma and implementation with PNNs.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`Il kernel più usato è il gaussiano a simmetria sferica:

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\Vert\mathbf{x} - \mathbf{x}_k\Vert^2}{2\sigma^2}\right)$$

È la media di $N$ gaussiane con covarianza $\sigma^2\mathbf{I}$, una su ogni campione: la formula generale con $h = \sigma$. $\sigma$ è il parametro di smoothing e va scelta con cura: troppo piccola dà una stima fatta di impulsi (*overfitting*), troppo grande una stima piatta (*underfitting*).

Siccome $\sigma$ è la stessa lungo tutte le feature, prima normalizzo le feature: altrimenti la feature con la scala più grande domina la distanza. Fatto questo resta un solo iperparametro, $\sigma$.

Posso anche renderla adattiva: una $\sigma_k$ per ogni campione,

$$\sigma_k = \frac{1}{L}\sum_{l=1}^{L}\Vert\mathbf{x}_k - \mathbf{y}_l\Vert$$

la distanza euclidea media dai $L$ vicini più prossimi. Dove i campioni sono fitti $\sigma_k$ è piccola e interpola con precisione; dove sono radi è grande e copre i vuoti.

Il metodo si implementa con una Probabilistic Neural Network: nella forma classica uno strato con un neurone per campione calcola i kernel, uno strato di somma per classe fa la media di Parzen $\hat{p}(\mathbf{x}\mid\omega_i)$ e l'ultimo strato decide con la regola di Bayes.`,
    checklist: [
      md`formula di Specht con $(2\pi\sigma^2)^{n/2}$`,
      md`$\sigma$ come parametro di smoothing, con i due estremi`,
      md`normalizzazione delle feature e un solo iperparametro`,
      md`$\sigma_k$ adattiva dagli $L$ vicini più prossimi`,
      md`razionale: $\sigma$ piccola dove i campioni sono fitti, grande dove sono radi`,
      md`implementazione con Probabilistic Neural Networks`,
    ],
    followUps: [
      { q: md`Da dove viene la costante $(2\pi\sigma^2)^{n/2}$?`, a: md`Il kernel sferico è il prodotto di $n$ gaussiane 1-D di deviazione standard $\sigma$, ognuna con costante $\sqrt{2\pi}\,\sigma$.` },
      { q: md`Che cosa succede con $L = N - 1$?`, a: md`$\sigma_k$ diventa la distanza media da tutti gli altri campioni. Le $\sigma_k$ restano diverse (un campione isolato ne ha una molto più grande), ma misurano quanto $\mathbf{x}_k$ è periferico rispetto all'intero insieme, non più la densità locale: l'adattamento locale si perde.` },
    ],
  },
]
