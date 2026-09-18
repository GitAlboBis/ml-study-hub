// Flashcard del modulo m09 (finestre di Parzen): formule, definizioni, confronti, intuizioni e procedure.
// Coprono tutti i 71 concetti dell'inventario, nell'ordine delle slide (ch2 p51-66, part1 p36-45).
import { md } from '../../types'
import type { Flashcard } from '../../types'

export const flashcards: Flashcard[] = [
  // --- contesto e confronto con il K-NN (c01-c03) ---
  {
    id: 'fc-contesto-non-parametrica',
    kind: 'definizione',
    q: md`Che cosa vuole fare il metodo delle finestre di Parzen e perché è una stima non parametrica?`,
    a: md`Stima la pdf $p(\mathbf{x})$ direttamente dai campioni di addestramento (*training samples*), senza assumere una forma funzionale (*functional form*) e quindi senza un vettore di parametri. Serve quando non si conosce la forma della pdf o quando i modelli parametrici la approssimano male. Idea: pongo una finestra (*window*, *kernel*) attorno ai dati e conto quanti campioni cadono in una regione di volume $V$ centrata in $\mathbf{x}^*$.`,
  },
  {
    id: 'fc-stima-di-base',
    kind: 'formula',
    q: md`Da quale stima di base partono sia Parzen sia il K-NN, e da dove viene?`,
    a: md`$$\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$$

Viene da $P_R = \int_R p(\mathbf{x})\,d\mathbf{x} \approx p(\mathbf{x}^*)\,V$ (regione piccola, $p$ continua) e dalla frequenza relativa $\hat{P}_R = K/N$ (legge dei grandi numeri): $\hat{p}(\mathbf{x}^*) = \hat{P}_R/V$.`,
  },
  {
    id: 'fc-parzen-vs-knn',
    kind: 'confronto',
    q: md`Parzen contro K-NN: che cosa è fissato e che cosa si calcola?`,
    a: md`- **K-NN**: fisso $K$ e allargo la cella finché contiene $K$ campioni; misuro $V_K(\mathbf{x}^*)$ e stimo $\hat{p} = K/(N\,V_K(\mathbf{x}^*))$.
- **Parzen**: fisso la regione, cioè $V = h^n$, e conto $K$ con un'espressione analitica.

Nell'illustrazione di ch2 p46: $V = 1/\sqrt{N}$ per Parzen, $K = \sqrt{N}$ per il K-NN. Parzen dà stime lisce e di area 1 ma dipende da $h$ e può valere 0 dove non ci sono campioni; il K-NN si adatta alla densità locale, non si annulla mai, ma dipende da $K$.`,
  },
  {
    id: 'fc-knn-bimodale',
    kind: 'intuizione',
    q: md`Com'è la stima K-NN della densità bimodale per $N = 16$, $256$, $\infty$ (part1 p36)?`,
    a: md`Con $N = 16$ i due picchi iniziano a vedersi ma c'è ancora rumore; con $N = 256$ la forma bimodale è più chiara; per $N = \infty$ compaiono due picchi distinti, come nella densità vera. Le stime K-NN restano appuntite e con code che non scendono a zero: è il termine di paragone per le stime di Parzen di ch2 p62-63.`,
  },
  // --- ipercubo, finestra, conteggio (c04-c11) ---
  {
    id: 'fc-ipercubo',
    kind: 'definizione',
    q: md`Con quale regione si introduce il metodo di Parzen e quanto vale il suo volume?`,
    a: md`Si assume, temporaneamente, che $R$ sia un ipercubo $n$-dimensionale (*n-dimensional hypercube*) centrato in $\mathbf{x}^*$ con lato (*edge*) $h$: $V = h^n$. In 1-D è un intervallo lungo $h$, in 2-D un quadrato di area $h^2$.`,
  },
  {
    id: 'fc-funzione-finestra',
    kind: 'definizione',
    q: md`Come è definita la funzione finestra $\gamma$ dell'ipercubo?`,
    a: md`È un'indicatrice (*window function*):

$$\gamma(\mathbf{u}) = \begin{cases} 1 & \vert u_j \vert \le \tfrac{1}{2},\ j = 1,\dots,n \\ 0 & \text{altrimenti} \end{cases}$$

Vale 1 dentro l'ipercubo unitario centrato nell'origine e 0 fuori: dice se un campione cade nella regione.`,
  },
  {
    id: 'fc-test-appartenenza',
    kind: 'formula',
    q: md`Come si scrive il test «$\mathbf{x}_k$ cade nell'ipercubo di centro $\mathbf{x}^*$ e lato $h$»? Perché l'argomento è normalizzato?`,
    a: md`$$\mathbf{x}_k \in R \iff \gamma\left[\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right] = 1$$

Sottrarre $\mathbf{x}^*$ porta il cubo nell'origine, dividere per $h$ lo riporta a lato 1: una sola $\gamma$ descrive ogni ipercubo. In 1-D equivale a $\vert x_k - x^* \vert \le h/2$.`,
  },
  {
    id: 'fc-conteggio-k',
    kind: 'formula',
    q: md`Scrivi l'espressione analitica del numero $K$ di campioni nell'ipercubo.`,
    a: md`$$K = \sum_{k=1}^{N} \gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right)$$

Ogni campione dentro aggiunge 1, ogni campione fuori 0. $K$ diventa una funzione analitica di $\mathbf{x}^*$ e di $h$.`,
  },
  {
    id: 'fc-stima-ipercubo',
    kind: 'formula',
    q: md`Scrivi la stima di Parzen con la finestra a ipercubo, nelle due forme della slide.`,
    a: md`$$\hat{p}(\mathbf{x}^*) = \frac{K}{NV} = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right) = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}^* - \mathbf{x}_k}{h}\right)$$

Si ottiene sostituendo $K$ e $V = h^n$ nella stima di base.`,
  },
  {
    id: 'fc-simmetria-finestra',
    kind: 'proprieta',
    q: md`Perché si può scambiare $\mathbf{x}_k - \mathbf{x}^*$ con $\mathbf{x}^* - \mathbf{x}_k$, e che cosa cambia nel punto di vista?`,
    a: md`L'ipercubo è simmetrico rispetto al centro: $\gamma(\mathbf{u}) = \gamma(-\mathbf{u})$. Il numero non cambia, ma la lettura sì: prima c'è UNA finestra su $\mathbf{x}^*$ che guarda i campioni, poi ci sono $N$ finestre, una su ogni campione, valutate in $\mathbf{x}^*$. Questa seconda lettura porta alla formula generale; tutti i kernel delle slide sono pari, quindi le due forme restano equivalenti.`,
  },
  {
    id: 'fc-contributi-rettangolari',
    kind: 'intuizione',
    q: md`Come si «vede» la stima a ipercubo in 1-D?`,
    a: md`Come una collezione di contributi rettangolari (*rectangular functions*), uno per campione: ogni campione porta un mattoncino di base $h$ e altezza $1/(Nh)$, cioè area $1/N$. Dove i mattoncini si sovrappongono la stima sale. Il risultato è costante a tratti, con salti in $x_k \pm h/2$:

$$\hat{p}(x) = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{h}\,\Pi\left(\frac{x - x_k}{h}\right)$$`,
  },
  {
    id: 'fc-conteggio-equivalente',
    kind: 'confronto',
    q: md`Somma di rettangoli e conteggio: sono due stime diverse?`,
    a: md`No, sono due letture dello stesso numero $\hat{p}(\mathbf{x}^*) = K/(N h^n)$. Nella prima forma si fa scorrere una finestra su $\mathbf{x}^*$ e si contano i campioni (*counting mechanism*); nella seconda si sommano i rettangoli posati sui campioni. Con la finestra rettangolare ogni campione conta 1 oppure 0, senza gradazioni.`,
  },
  {
    id: 'fc-classe-generale',
    kind: 'intuizione',
    q: md`Quale osservazione permette di passare dall'ipercubo a una classe più generale di finestre?`,
    a: md`Nella seconda forma della stima $\gamma$ compare solo come funzione di $(\mathbf{x} - \mathbf{x}_k)/h$: nulla obbliga a usare l'indicatrice dell'ipercubo. La slide ch2 p52 propone di ammettere «a more general class of window functions».`,
  },
  {
    id: 'fc-finestre-delle-note',
    kind: 'definizione',
    q: md`Quali tre finestre generali citano le note (part1 p37)?`,
    a: md`- **Gaussiana** (*Gaussian window*): liscia, riduce le discontinuità.
- **Epanechnikov** (*Epanechnikov kernel*): minimizza l'errore quadratico medio integrato (*mean integrated squared error*); forma standard $\gamma(x) = \tfrac{3}{4}(1 - x^2)$ per $\vert x \vert \le 1$, 0 altrove (la fonte non dà la formula).
- **Triangolare** (*triangular window*): lineare a tratti.`,
  },
  {
    id: 'fc-finestre-lisce',
    kind: 'proprieta',
    q: md`Che cosa si guadagna usando finestre lisce al posto dell'ipercubo?`,
    a: md`Stime più lisce e continue, senza spigoli e discontinuità (*sharp edges and discontinuities*): la stima diventa una somma di gaussiane. La regolarità della stima è quella del kernel: kernel discontinuo, stima a gradini; kernel liscio, stima liscia. Il metodo si adatta meglio a distribuzioni diverse, anche in alta dimensione.`,
  },
  // --- formula generale, interpolazione, h (c15-c18) ---
  {
    id: 'fc-stima-generale',
    kind: 'formula',
    q: md`Scrivi la stima di Parzen generale (ch2 p53).`,
    a: md`$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{V(h)}\,\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$$

$N$ campioni, $V(h)$ volume della finestra di larghezza $h$, $\gamma$ kernel che pesa il contributo di $\mathbf{x}_k$ secondo la distanza da $\mathbf{x}$. È una media di funzioni di $\mathbf{x}$ e dei campioni, definita in ogni $\mathbf{x}$.`,
  },
  {
    id: 'fc-interpolazione',
    kind: 'intuizione',
    q: md`In che senso la finestra «interpola»?`,
    a: md`Ogni campione contribuisce alla stima in $\mathbf{x}$ secondo la sua distanza da $\mathbf{x}$, con un peso che cala allontanandosi («each sample contributing to the estimate in accordance with its distance from x»). Si passa dal conteggio (contributo 0 o 1) all'interpolazione (contributo graduato): tra un campione e l'altro la densità si riempie con le code dei kernel.`,
  },
  {
    id: 'fc-terminologia',
    kind: 'definizione',
    q: md`Come si chiamano $\gamma(\cdot)$ e $h$? Con quale altro nome è noto il metodo?`,
    a: md`$\gamma$ è la finestra di Parzen (*Parzen window*) o kernel; $h$ è la larghezza della finestra (*width*), detta anche *bandwidth* o parametro di smoothing (*smoothing parameter*). Il metodo si chiama anche *kernel density estimation* (KDE). Questo kernel è una densità che pesa i campioni: non va confuso con il kernel delle SVM (prodotto scalare in uno spazio di feature).`,
  },
  {
    id: 'fc-effetto-h-qualitativo',
    kind: 'intuizione',
    q: md`Che effetto ha $h$ sulla stima, a grandi linee?`,
    a: md`$h$ controlla il livello di smoothing. $h$ piccolo: il kernel si concentra sui singoli campioni, la stima è sensibile e rischia l'*overfitting*. $h$ grande: il kernel si spalma su un'area ampia, la stima è liscia e rischia l'*underfitting*.`,
  },
  // --- densità legittima e condizioni sul kernel (c19-c24) ---
  {
    id: 'fc-densita-legittima',
    kind: 'proprieta',
    q: md`Quali due proprietà deve avere la stima per essere una densità legittima?`,
    a: md`Non negatività (*non-negativity*) e normalizzazione (*normalization*):

$$\hat{p}(\mathbf{x}) \ge 0\quad \forall\,\mathbf{x} \in \Re^n,\qquad \int_{\Re^n} \hat{p}(\mathbf{x})\,d\mathbf{x} = 1$$

Senza, non potrei calcolare probabilità integrando $\hat{p}$ né usarla come densità di classe in un classificatore bayesiano.`,
  },
  {
    id: 'fc-kernel-densita',
    kind: 'formula',
    q: md`Quale condizione sul kernel garantisce che la stima sia una densità legittima?`,
    a: md`Il kernel stesso deve essere una densità (ch2 p54):

$$\gamma(\mathbf{x}) \ge 0\quad \forall\,\mathbf{x} \in \Re^n,\qquad \int_{\Re^n} \gamma(\mathbf{x})\,d\mathbf{x} = 1$$

con $V = h^n$. I fattori $1/\sqrt{2\pi}$ del gaussiano e $1/\pi$ del Cauchy sono costanti di normalizzazione.`,
  },
  {
    id: 'fc-eredita-area-unitaria',
    kind: 'procedura',
    q: md`Come si mostra che, con $\gamma$ densità e $V = h^n$, la stima integra a 1?`,
    a: md`1. Linearità: $\int \hat{p} = \frac{1}{N}\sum_k \frac{1}{h^n}\int \gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)d\mathbf{x}$.
2. Cambio di variabile $\mathbf{u} = (\mathbf{x} - \mathbf{x}_k)/h$, $d\mathbf{x} = h^n d\mathbf{u}$: ogni integrale vale $h^n$.
3. $\frac{1}{N}\sum_k \frac{h^n}{h^n} = 1$.

La non negatività viene da $\gamma \ge 0$. Il fattore $1/h^n$ compensa l'allargamento della finestra.`,
  },
  {
    id: 'fc-tre-condizioni-buon-kernel',
    kind: 'proprieta',
    q: md`Quali tre condizioni aggiuntive servono per una «buona» stima (ch2 p54)?`,
    a: md`1. $\gamma(\cdot)$ ha il massimo nell'origine: i punti vicini al campione contano di più.
2. $\gamma(\cdot)$ è continua: stimiamo una pdf liscia.
3. $\gamma(\mathbf{x}) \to 0$ per $\Vert\mathbf{x}\Vert \to +\infty$: i punti lontani hanno influenza trascurabile.`,
  },
  {
    id: 'fc-massimo-origine',
    kind: 'formula',
    q: md`Come si traduce in formula la condizione «$\gamma$ ha il massimo nell'origine»? Perché «appartiene all'argmax»?`,
    a: md`$$\gamma(\mathbf{0}) = \max_{\mathbf{x}} \gamma(\mathbf{x}),\qquad \mathbf{x}_k \in \arg\max_{\mathbf{x}} \gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$$

Il massimo può non essere unico: il rettangolo vale 1 su tutto il supporto. La condizione segna il passaggio dal semplice conteggio a un peso che tiene conto della vicinanza.`,
  },
  {
    id: 'fc-rettangolo-discontinuo',
    kind: 'confronto',
    q: md`Quale kernel delle slide è una densità valida ma non soddisfa tutte le condizioni del «buon» kernel?`,
    a: md`Il rettangolare $\Pi(x)$: non è continuo (salta in $\pm 1/2$), quindi produce stime a gradini. Assegna lo stesso peso a tutti i punti dentro la finestra e zero fuori: semplice ma rozzo (*crude*).`,
  },
  // --- δ(x) ed effetto di h (c25-c32) ---
  {
    id: 'fc-delta-riscalata',
    kind: 'formula',
    q: md`Come si definisce $\delta(\mathbf{x})$ a ch2 p55, e come si riscrive la stima?`,
    a: md`$$\delta(\mathbf{x}) = \frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}}{h}\right),\qquad \hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N} \delta(\mathbf{x} - \mathbf{x}_k)$$

È il kernel riscalato in larghezza ($\mathbf{x}/h$) e in altezza ($1/V(h)$). Qui $\delta$ NON è la delta di Dirac: lo diventa solo nel limite $h \to 0$ (ch2 p60).`,
  },
  {
    id: 'fc-ampiezza-larghezza',
    kind: 'proprieta',
    q: md`Come agisce $h$ su $\delta(\mathbf{x})$?`,
    a: md`Con $V(h) = h^n$ cambia insieme ampiezza e larghezza, ad area costante:

$$\delta(\mathbf{0}) = \frac{1}{h^n}\gamma(\mathbf{0}),\qquad \int_{\Re^n} \delta(\mathbf{x})\,d\mathbf{x} = 1\quad \forall h > 0$$

$h$ grande: $\delta$ bassa, larga, lenta. $h$ piccolo: $\delta$ alta e stretta, un impulso; per $h \to 0$ tende a una delta di Dirac centrata sul campione.`,
  },
  {
    id: 'fc-oversmoothing',
    kind: 'intuizione',
    q: md`Che cosa succede se $h$ è troppo grande?`,
    a: md`Sovra-lisciatura (*oversmoothing*): la stima è la somma di $N$ funzioni larghe e perde dettagli, soprattutto le strutture a picco stretto (*sharply peaked features*). Nel pannello $h = 1$ di ch2 p57 i cinque campioni si fondono in due rilievi bassi e larghi.`,
  },
  {
    id: 'fc-h-troppo-piccolo',
    kind: 'intuizione',
    q: md`Che cosa succede se $h$ è troppo piccolo?`,
    a: md`La stima è molto variabile (*highly variable estimate*): fa *overfitting* sui campioni specifici e cattura il rumore invece della distribuzione. Nel pannello $h = 0.2$ di ch2 p57 restano cinque aghi isolati, con densità quasi nulla fra l'uno e l'altro.`,
  },
  {
    id: 'fc-regola-pratica-n',
    kind: 'procedura',
    q: md`Regola pratica: come scegliere $h$ in base al numero di campioni?`,
    a: md`Più campioni permettono un $h$ più piccolo: finestre strette danno stime accurate senza overfitting. Con pochi campioni conviene un $h$ più grande, per lisciare la stima ed evitare buchi (*gaps*) nella rappresentazione della densità. È l'anticipo informale delle condizioni su $h_N$.`,
  },
  {
    id: 'fc-finestre-normali-2d',
    kind: 'formula',
    q: md`Finestra normale 2-D a simmetria circolare: quanto vale il picco per $h = 1$, $0.5$, $0.2$ (ch2 p56)?`,
    a: md`$$\delta(\mathbf{x}) = \frac{1}{2\pi h^2}\exp\left(-\frac{\Vert\mathbf{x}\Vert^2}{2h^2}\right),\qquad \delta(\mathbf{0}) \approx 0.159,\ 0.637,\ 3.98$$

Riducendo $h$ di 5 volte il picco cresce di 25 volte ($n = 2$), mentre il volume resta 1. Coincide con le scale verticali della figura (circa 0.15, 0.6, 4).`,
  },
  {
    id: 'fc-cinque-campioni',
    kind: 'intuizione',
    q: md`Che cosa insegna la figura con tre stime degli stessi cinque campioni 2-D (ch2 p57)?`,
    a: md`Stessi dati, stime completamente diverse: $h = 1$ superficie liscia a rilievi fusi, $h = 0.5$ cinque campane con parziale sovrapposizione, $h = 0.2$ cinque aghi. Con $N$ così piccolo nessun $h$ è giusto. Le scale verticali della figura sono riscalate (corrispondono alla somma senza $1/N$): non vanno lette come valori di $\hat{p}$.`,
  },
  // --- i sei kernel (c33-c39) ---
  {
    id: 'fc-kernel-rett-tri',
    kind: 'formula',
    q: md`Scrivi il kernel rettangolare e quello triangolare.`,
    a: md`$$\Pi(x) = \begin{cases} 1 & \vert x \vert \le \tfrac{1}{2} \\ 0 & \text{altrove} \end{cases}\qquad \Lambda(x) = \begin{cases} 1 - \vert x \vert & \vert x \vert \le 1 \\ 0 & \text{altrove} \end{cases}$$

Il rettangolare pesa ugualmente tutti i punti nella finestra; il triangolare attenua il peso linearmente (*linear tapering*) e dà stime più lisce. Nella slide il grafico di $\Pi$ porta l'etichetta $1/2$ sull'altezza: con supporto unitario l'altezza che dà area 1 è 1.`,
  },
  {
    id: 'fc-kernel-gaussiano',
    kind: 'formula',
    q: md`Scrivi il kernel gaussiano 1-D e la stima di Parzen che ne risulta.`,
    a: md`$$\gamma(x) = \frac{1}{\sqrt{2\pi}}\exp\left(-\frac{x^2}{2}\right)$$

$$\hat{p}(x) = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{\sqrt{2\pi}\,h}\exp\left(-\frac{(x - x_k)^2}{2h^2}\right)$$

È la risposta a «Which is the most common window function?»: liscio, derivabile, influenza che cala in modo esponenziale con la distanza.`,
  },
  {
    id: 'fc-kernel-code',
    kind: 'formula',
    q: md`Scrivi i kernel esponenziale, di Cauchy e sinc², con la loro caratteristica.`,
    a: md`- Esponenziale: $\gamma(x) = \frac{1}{2}\exp(-\vert x \vert)$, decadimento rapido, cuspide nell'origine (non derivabile).
- Cauchy: $\gamma(x) = \frac{1}{\pi}\cdot\frac{1}{1+x^2}$, code pesanti (*heavy tails*), utile con outlier.
- sinc²: $\gamma(x) = \frac{1}{2\pi}\left(\frac{\sin(x/2)}{x/2}\right)^2$, oscillante, zeri in $\pm 2\pi, \pm 4\pi, \dots$; comune nei segnali, raro nella stima di densità.`,
  },
  {
    id: 'fc-sinc-al-quadrato',
    kind: 'proprieta',
    q: md`Perché il kernel è $\text{sinc}^2$ e non $\text{sinc}$?`,
    a: md`Il $\text{sinc}$ semplice ha lobi negativi: violerebbe $\gamma \ge 0$ e la stima potrebbe diventare negativa. Il quadrato lo rende non negativo; il fattore $1/(2\pi)$ gli dà area 1.`,
  },
  {
    id: 'fc-sup-dei-kernel',
    kind: 'formula',
    q: md`Quanto vale $\sup\gamma$ per i sei kernel delle slide? Dove serve?`,
    a: md`Rettangolare 1, triangolare 1, gaussiano $1/\sqrt{2\pi} \approx 0.399$, esponenziale $1/2$, Cauchy $1/\pi \approx 0.318$, sinc² $1/(2\pi) \approx 0.159$. Tutti hanno area 1. $\sup(\gamma(\cdot))$ entra nel bound sulla varianza della stima.`,
  },
  {
    id: 'fc-perche-gaussiano',
    kind: 'confronto',
    q: md`Fra i sei kernel, perché si usa quasi sempre il gaussiano?`,
    a: md`Regolarità (*smoothness*), buone proprietà matematiche, efficacia su distribuzioni molto diverse; secondo le note offre in genere il miglior equilibrio fra bias e varianza. Quadro: rettangolare semplice ma discontinuo, triangolare lineare a tratti, esponenziale con cuspide, Cauchy a code pesanti, sinc² oscillante. Tutti hanno massimo nell'origine e tendono a zero; solo il rettangolare non è continuo.`,
  },
  // --- proprietà statistiche (c40-c53) ---
  {
    id: 'fc-scatola-nera',
    kind: 'intuizione',
    q: md`Perché ci si chiede se la stima di Parzen sia «buona»?`,
    a: md`La finestra di Parzen è una scatola nera (*black box*): entrano i campioni, esce una funzione $\hat{p}(\mathbf{x})$, senza ipotesi sulla forma. Come per gli stimatori parametrici si studiano bias, varianza e consistenza.`,
  },
  {
    id: 'fc-media-convoluzione',
    kind: 'formula',
    q: md`Quanto vale la media della stima di Parzen?`,
    a: md`Con campioni i.i.d. di densità $p(\mathbf{x})$:

$$E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right) = \int_{\Re^n} \frac{1}{h^n}\gamma\left(\frac{\mathbf{x} - \mathbf{v}}{h}\right)p(\mathbf{v})\,d\mathbf{v}$$

Una media pesata di $p$ attorno a $\mathbf{x}$ con i pesi del kernel. Non dipende da $N$.`,
  },
  {
    id: 'fc-versione-sfocata',
    kind: 'intuizione',
    q: md`«The estimate mean is a blurred version of the true $p(\mathbf{x})$!»: che cosa si vede?`,
    a: md`Il kernel agisce da filtro di sfocatura (*blurring filter*): picchi abbassati, valli riempite, discontinuità arrotondate. L'entità della sfocatura dipende da $h$ e dalla forma di $\gamma$.`,
  },
  {
    id: 'fc-h-bias-varianza',
    kind: 'confronto',
    q: md`Kernel larghi contro kernel stretti: che cosa succede a bias e varianza?`,
    a: md`Kernel più larghi ($h$ grande): più smoothing, bias maggiore, varianza minore. Kernel più stretti ($h$ piccolo): meno smoothing e meno bias, ma varianza maggiore, soprattutto con pochi campioni. È il compromesso bias-varianza (*bias-variance trade-off*) di Parzen.`,
  },
  {
    id: 'fc-stima-distorta',
    kind: 'proprieta',
    q: md`La stima di Parzen è distorta? Aumentare $N$ a $h$ fisso aiuta?`,
    a: md`Sì: per $h > 0$ finito, in generale $E\{\hat{p}(\mathbf{x})\} \ne p(\mathbf{x})$ (*biased*). A $h$ fisso aumentare $N$ non toglie il bias: la varianza va a zero e la stima si concentra attorno alla versione sfocata, non attorno a $p$. Più dati danno una stima sempre più stabile della cosa sbagliata; per togliere il bias serve $h \to 0$.`,
  },
  {
    id: 'fc-asintoticamente-non-distorta',
    kind: 'proprieta',
    q: md`Quando la stima di Parzen è asintoticamente non distorta?`,
    a: md`Se la larghezza diventa una successione con $\lim_{N\to+\infty} h_N = 0$: allora $\lim_{N\to+\infty} E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x})$ nei punti in cui $p$ è continua. In un punto di salto, con kernel simmetrico, la media tende alla media dei limiti destro e sinistro. Il risultato riguarda la media: da solo non garantisce la convergenza della singola stima.`,
  },
  {
    id: 'fc-limite-dirac',
    kind: 'formula',
    q: md`Perché $h_N \to 0$ toglie il bias? Scrivi il limite.`,
    a: md`$$\lim_{N\to+\infty}\left\{\frac{1}{h_N^n}\gamma\left(\frac{\mathbf{x}}{h_N}\right)\right\} = \delta(\mathbf{x})\ \Longrightarrow\ \lim_{N\to+\infty} E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x})$$

Il kernel riscalato mantiene area 1 mentre si stringe e tende alla delta di Dirac (nel senso delle distribuzioni); poi $p * \delta = p$. Qui $\delta$ è la vera delta di Dirac, non la finestra di ch2 p55.`,
  },
  {
    id: 'fc-bound-varianza',
    kind: 'formula',
    q: md`Scrivi il bound sulla varianza della stima di Parzen.`,
    a: md`$$E\left\{\left(\hat{p}(\mathbf{x}) - \bar{\hat{p}}(\mathbf{x})\right)^2\right\} \le \frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$$

$\bar{\hat{p}}(\mathbf{x}) = E\{\hat{p}(\mathbf{x})\}$ è la media della stima. Vale perché la stima è somma di funzioni di variabili indipendenti; richiede un kernel non negativo e limitato, e vale per ogni $N$.`,
  },
  {
    id: 'fc-lettura-bound',
    kind: 'intuizione',
    q: md`Come si legge il bound sulla varianza?`,
    a: md`Il bound è inversamente proporzionale a $N$ e al volume della finestra $h_N^n$: più campioni o finestre più larghe riducono le fluttuazioni. $\sup\gamma$ dice quanto può pesare un singolo campione. Con la finestra a ipercubo ($\sup\gamma = 1$) e $h < 1$ fisso, al crescere di $n$ il volume $h^n$ crolla e il bound esplode: la maledizione della dimensionalità vista da Parzen. Con il gaussiano sferico, dove $\sup\gamma = (2\pi)^{-n/2}$, succede solo se $h < 1/\sqrt{2\pi} \approx 0.4$.`,
  },
  {
    id: 'fc-condizioni-consistenza',
    kind: 'formula',
    q: md`Quando la stima di Parzen è consistente?`,
    a: md`$$\lim_{N\to+\infty} h_N = 0,\qquad \lim_{N\to+\infty} N h_N^n = +\infty$$

Le due condizioni insieme sono sufficienti («consistent if»): bias e varianza vanno a zero, quindi la stima converge in media quadratica, e per Chebyshev in probabilità, alla pdf vera nei punti in cui è continua.`,
  },
  {
    id: 'fc-ruolo-due-condizioni',
    kind: 'confronto',
    q: md`Quale delle due condizioni di consistenza toglie il bias e quale la varianza?`,
    a: md`$h_N \to 0$ toglie il bias: il kernel diventa una delta di Dirac e la sfocatura sparisce. $N h_N^n \to +\infty$ toglie la varianza: il bound $\sup(\gamma)\,\bar{\hat{p}}/(N h_N^n)$ va a zero. Le due richieste tirano $h$ in direzioni opposte: $h$ va a zero, ma più lentamente di $N^{-1/n}$.`,
  },
  {
    id: 'fc-velocita-restringimento',
    kind: 'intuizione',
    q: md`Che cosa succede se $h_N$ si restringe troppo in fretta o troppo piano?`,
    a: md`Troppo in fretta rispetto alla crescita di $N$: stima molto variabile (alta varianza). Troppo piano: stima che resta distorta, sovra-lisciata. Serve un equilibrio per avere la consistenza.`,
  },
  {
    id: 'fc-compromesso-nhn',
    kind: 'proprieta',
    q: md`Perché si dice che il compromesso bias-varianza è guidato da $N h_N^n$?`,
    a: md`Per ridurre la varianza voglio $N h_N^n$ grande. Se allargo $h_N$ la varianza cala ma il bias cresce; se $h_N$ è piccolo serve un $N$ abbastanza grande da compensare. Obiettivo: minimizzare la varianza senza introdurre bias eccessivo. La frase delle note «we need $h \to 0$ as $N \to +\infty$» è incompleta: serve anche $N h_N^n \to +\infty$.`,
  },
  {
    id: 'fc-esempio-hn',
    kind: 'formula',
    q: md`Quale esempio di larghezza consistente dà la slide ch2 p61? Verificalo.`,
    a: md`$$h_N = \frac{1}{\sqrt[2n]{N}}$$

$h_N = N^{-1/(2n)} \to 0$ e $N h_N^n = N \cdot N^{-1/2} = \sqrt{N} \to +\infty$. In 1-D è $h_N = 1/\sqrt{N}$, la legge degli esempi di ch2 p62-63.`,
  },
  {
    id: 'fc-leggi-di-potenza',
    kind: 'formula',
    q: md`Per quali esponenti $a$ la legge $h_N = h_1 N^{-a}$ è consistente?`,
    a: md`$h_N \to 0$ richiede $a > 0$; $N h_N^n = h_1^n N^{1-an} \to +\infty$ richiede $a < 1/n$:

$$0 < a < \frac{1}{n}$$

L'esempio di Melgani ha $a = \frac{1}{2n}$. In 2-D la legge $h_1/N$ stampata a ch2 p64 dà $N h_N^2 \to 0$, e anche $h_1/\sqrt{N}$ dà $N h_N^2$ costante.`,
  },
  // --- esempi grafici (c54-c57) ---
  {
    id: 'fc-griglie-1d',
    kind: 'intuizione',
    q: md`Che cosa mostrano le griglie 1-D di ch2 p62-63 (normale e bimodale)?`,
    a: md`Colonne $h_N = 1/\sqrt{N}$, $0.5/\sqrt{N}$, $0.1/\sqrt{N}$; righe con $N$ crescente fino a $\infty$, kernel gaussiano. $N = 1$: si vede solo il kernel sull'unico campione. $h_1$ grande: campana liscia presto; $h_1$ piccolo: pettine di picchi, ancora rumoroso a $N = 100$. Nella bimodale (triangolo + rettangolo) $h_1 = 1$ riconosce le due mode già a $N = 16$. Per $N = \infty$ le tre colonne coincidono con la densità vera, spigoli compresi.`,
  },
  {
    id: 'fc-griglia-2d-refuso',
    kind: 'proprieta',
    q: md`Che cosa non torna nella griglia 2-D di ch2 p64?`,
    a: md`Le colonne sono etichettate $h_N = 1/N,\ 0.5/N,\ 0.1/N$. Con $n = 2$: $N h_N^2 = h_1^2/N \to 0$, che viola la seconda condizione. Probabile refuso (Duda-Hart usa $h_1/\sqrt{N}$), ma anche quella dà $N h_N^2 = h_1^2$ costante. Una legge consistente in 2-D è $h_N = h_1/N^{1/4}$. In 2-D, a parità di $N$, la stima è più rumorosa che in 1-D.`,
  },
  {
    id: 'fc-messaggio-griglie',
    kind: 'intuizione',
    q: md`Qual è il messaggio comune dei tre esempi grafici?`,
    a: md`Per $N = \infty$ la stima converge alla densità vera qualunque sia $h_1$ e qualunque sia la forma (unimodale, bimodale, 1-D, 2-D), purché la legge $h_N$ rispetti le due condizioni. A $N$ finito invece $h_1$ pesa molto: piccolo dà stime rumorose, grande stime lisce. I pannelli mostrano una singola realizzazione, non la media.`,
  },
  // --- metodo di Specht (c58-c66) ---
  {
    id: 'fc-specht',
    kind: 'formula',
    q: md`Scrivi la stima con kernel gaussiano a simmetria sferica (metodo di Specht).`,
    a: md`$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\Vert\mathbf{x} - \mathbf{x}_k\Vert^2}{2\sigma^2}\right)$$

Media di $N$ gaussiane $n$-dimensionali con covarianza $\sigma^2\mathbf{I}$, una su ogni campione: formula generale con $h = \sigma$ e $V(h) = \sigma^n$. Disegno: una campana a curve di livello circolari su ogni campione, poi la somma.`,
  },
  {
    id: 'fc-specht-prodotto',
    kind: 'proprieta',
    q: md`Come si passa dal kernel gaussiano 1-D al kernel sferico $n$-dimensionale?`,
    a: md`Il kernel sferico è il prodotto di $n$ campane 1-D, una per coordinata: $\prod_{j=1}^{n} \frac{1}{\sqrt{2\pi}}e^{-u_j^2/2} = \frac{1}{(2\pi)^{n/2}}e^{-\Vert\mathbf{u}\Vert^2/2}$. Con $\mathbf{u} = (\mathbf{x} - \mathbf{x}_k)/\sigma$ e il fattore $1/\sigma^n$ si ottiene la formula di Specht.`,
  },
  {
    id: 'fc-sigma-smoothing',
    kind: 'intuizione',
    q: md`Che ruolo ha $\sigma$ nel metodo di Specht e che cosa succede ai due estremi?`,
    a: md`$\sigma$ è il parametro di smoothing: va scelto con cura per evitare sia over- sia under-fitting. $\sigma \to 0$: $N$ impulsi sui campioni, varianza che esplode. $\sigma \to +\infty$: ogni gaussiana si spalma ovunque, la stima diventa piatta e perde ogni struttura. Sono i limiti di $h \to 0$ e $h \to +\infty$.`,
  },
  {
    id: 'fc-normalizzare-feature',
    kind: 'procedura',
    q: md`Perché con il kernel di Specht bisogna normalizzare le feature?`,
    a: md`$\sigma$ è la stessa lungo tutte le feature: il kernel assume che abbiano la stessa varianza. Senza normalizzare, la feature con la scala numerica più grande domina $\Vert\mathbf{x} - \mathbf{x}_k\Vert$ (per esempio una lunghezza in mm accanto a una in m) e le «sfere» non rispettano i dati. Normalizzo prima di stimare.`,
  },
  {
    id: 'fc-un-iperparametro',
    kind: 'proprieta',
    q: md`Quanti iperparametri restano con il kernel gaussiano sferico e le feature normalizzate?`,
    a: md`Uno solo, $\sigma$, qualunque sia la dimensione $n$ («the only hyperparameter we need to tune is $\sigma$»). È il vantaggio pratico rispetto a una covarianza piena per ogni kernel.`,
  },
  {
    id: 'fc-sigma-adattiva',
    kind: 'formula',
    q: md`Come si calcola la $\sigma$ adattiva $\sigma_k$ del campione $\mathbf{x}_k$?`,
    a: md`$$\sigma_k = \frac{1}{L}\sum_{l=1}^{L} \Vert\mathbf{x}_k - \mathbf{y}_l\Vert$$

Distanza euclidea media di $\mathbf{x}_k$ dai suoi $L$ vicini più prossimi $\mathbf{y}_1, \dots, \mathbf{y}_L$ (fra gli altri campioni). Nella stima ogni addendo usa la sua $\sigma_k$, con la propria costante $(2\pi\sigma_k^2)^{n/2}$, e l'area resta 1. $L$ diventa il nuovo parametro.`,
  },
  {
    id: 'fc-perche-adattiva',
    kind: 'intuizione',
    q: md`Perché conviene una $\sigma$ piccola dove i campioni sono fitti e grande dove sono radi?`,
    a: md`Lo scopo è interpolare bene. Dove i campioni sono fitti ci sono pochi vuoti da riempire: una varianza piccola riflette la densità locale. Dove sono radi serve una varianza grande, per coprire la zona e tener conto dell'incertezza. È un'idea ibrida: i vicini del K-NN fissano la larghezza dei kernel di Parzen.`,
  },
  {
    id: 'fc-pnn',
    kind: 'definizione',
    q: md`Che cos'è una Probabilistic Neural Network (PNN) e che legame ha con Parzen?`,
    a: md`È la realizzazione del metodo di Specht come rete (*Probabilistic Neural Network*). Nella formulazione classica: uno strato di pattern con un neurone per campione (calcola il kernel gaussiano), uno strato di somma per classe (fa la media di Parzen, cioè $\hat{p}(\mathbf{x}\mid\omega_i)$) e uno strato di decisione (regola di Bayes). La fonte cita solo l'implementazione, l'architettura è un approfondimento.`,
  },
  {
    id: 'fc-vantaggi-gaussiano',
    kind: 'proprieta',
    q: md`Quali vantaggi ha il kernel gaussiano nel modellare densità diverse?`,
    a: md`Si adatta bene a molti tipi di densità grazie alla sua regolarità e si presta all'adattività di $\sigma$. Le note aggiungono che gestisce dati ad alta dimensionalità con simmetria sferica: la simmetria lascia un solo iperparametro, $\sigma$, in qualunque dimensione, ma i campioni necessari crescono comunque in fretta con $n$ (maledizione della dimensionalità).`,
  },
  // --- sintesi e collegamenti (c67-c71) ---
  {
    id: 'fc-buon-stimatore',
    kind: 'procedura',
    q: md`Scaletta della risposta a «Is Parzen a good estimator?».`,
    a: md`1. A $h$ finito è distorta: $E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$, versione sfocata.
2. Asintoticamente non distorta se $h_N \to 0$ (kernel verso la delta di Dirac).
3. Varianza $\le \frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$: va a zero se $N h_N^n \to +\infty$.
4. Con le due condizioni è consistente, per esempio con $h_N = 1/\sqrt[2n]{N}$.
5. A $N$ finito tutto dipende da $h$ o $\sigma$; in alta dimensione servono moltissimi campioni.`,
  },
  {
    id: 'fc-dati-incompleti',
    kind: 'definizione',
    q: md`Con quale argomento si chiude la parte delle note su Parzen (part1 p45)?`,
    a: md`Con l'apertura della stima con dati incompleti (*Estimation with Incomplete Data*): finora le stime usavano solo variabili osservabili (*observable variables*), ma molti modelli dipendono anche da variabili latenti non osservate (*unobserved latent variables*). È l'ingresso all'algoritmo EM del modulo successivo.`,
  },
  {
    id: 'fc-convergenza-parzen-knn',
    kind: 'confronto',
    q: md`Condizioni di convergenza di Parzen e del K-NN: perché dicono la stessa cosa?`,
    a: md`Parzen: $h_N \to 0$ e $N h_N^n \to +\infty$, cioè $V_N \to 0$ e $N V_N \to +\infty$. K-NN: $K_N \to +\infty$ e $K_N/N \to 0$ (necessaria e sufficiente). Da $K \approx N V p(\mathbf{x}^*)$: la regione deve restringersi perché $p$ vi sia quasi costante (niente bias) e contenere sempre più campioni perché valga la legge dei grandi numeri (niente varianza). Con $h_N = 1/\sqrt[2n]{N}$ si ha $V_N = 1/\sqrt{N}$, accanto a $K(N) = \sqrt{N}$.`,
  },
  {
    id: 'fc-dilemma-regione',
    kind: 'confronto',
    q: md`Il dilemma della regione $R$ (grande per contare, piccola per non mediare): come diventa nel metodo di Parzen?`,
    a: md`Diventa la scelta di $h$. $h$ grande: molti campioni nella finestra ($N h^n$ grande), varianza bassa, ma $p$ varia dentro la finestra e ne esce una media locale, cioè bias. $h$ piccolo: $p$ quasi costante nella finestra, bias piccolo, ma pochi campioni, $K/N$ inaffidabile e varianza alta. Le condizioni di consistenza sono la versione asintotica delle due richieste.`,
  },
  {
    id: 'fc-disegno-due-campioni',
    kind: 'procedura',
    q: md`Come disegno all'orale il conteggio e l'interpolazione con due campioni?`,
    a: md`1. Asse $x$ con $x_1$, $x_2$ ($N = 2$) e una larghezza $h$.
2. Conteggio: un rettangolo di base $h$ e altezza $\frac{1}{Nh}$ su ogni campione; la somma vale $0$, $\frac{1}{2h}$ o $\frac{1}{h}$, una scaletta con salti in $x_k \pm h/2$.
3. Interpolazione: al posto dei rettangoli due campane gaussiane di area $1/2$; se $\vert x_1 - x_2 \vert \le 2h$ si fondono in una gobba, altrimenti restano due gobbe con una valle.
4. A voce: l'area totale è 1 in entrambi i casi; il contributo passa da «dentro o fuori» a graduato con la distanza, e i salti spariscono.`,
  },
  {
    id: 'fc-sfocatura-gaussiana',
    kind: 'formula',
    q: md`Pdf vera $\mathcal{N}(\mu, \sigma_p^2)$ e kernel gaussiano di larghezza $h$: quanto vale la media della stima?`,
    a: md`$$E\{\hat{p}(x)\} = \mathcal{N}(x;\ \mu,\ \sigma_p^2 + h^2),\qquad \frac{E\{\hat{p}(\mu)\}}{p(\mu)} = \frac{\sigma_p}{\sqrt{\sigma_p^2 + h^2}} < 1$$

La convoluzione di due gaussiane è una gaussiana con le varianze sommate: il picco si abbassa. Con $\sigma_p = 1$ e $h = 1$ scende del 29%; con $h_N \to 0$ torna a $p$.`,
  },
]
