// Flashcard del modulo m08 (stima non parametrica e K-NN): formule, definizioni, confronti, intuizioni, proprietà e procedure.
// Coprono tutti i 71 concetti dell'inventario, nell'ordine delle slide (part1 p30-36, ch2 p41-50) più le integrazioni.
import { md } from '../../types'
import type { Flashcard } from '../../types'

export const flashcards: Flashcard[] = [
  // --- pagina di confine: ML contro Bayes (c01-c06) ---
  {
    id: 'fc-ml-punto-bayes-curva',
    kind: 'confronto',
    q: md`Che cosa restituisce la stima ML e che cosa restituisce la stima bayesiana?`,
    a: md`- **ML** (*Maximum Likelihood*): un solo valore «migliore» dei parametri, quello che massimizza la funzione di verosimiglianza (*likelihood function*) dati i campioni. È una stima deterministica (*deterministic estimate*): un punto (*single point*) nello spazio di $\theta$.
- **Bayes** (*Bayesian Estimation*, BE): una distribuzione invece di un punto. La slide p40 scrive «l'intera distribuzione $p(x|X)$, da cui si inferisce $\theta$»; nella notazione del foglio bayesiano la distribuzione a posteriori (*posterior distribution*) è $p(\theta|X)$, sui parametri, e la densità predittiva $p(x|X)$ si ottiene integrando su $\theta$. La posterior riflette i dati osservati e le convinzioni a priori (*prior beliefs*), quindi porta con sé anche l'incertezza.`,
  },
  {
    id: 'fc-ml-bayes-coincidono',
    kind: 'proprieta',
    q: md`In quali due casi la stima ML e la stima bayesiana coincidono? *(In which case ML and Bayesian are the same?)*`,
    a: md`1. **Limite asintotico** (*asymptotic equivalence*): con un numero infinito di campioni di training le due soluzioni diventano equivalenti; entrambe convergono ai veri valori dei parametri (stimatori consistenti). Serve un prior che dia densità positiva al valore vero: con $\sigma_0^2 = 0$ (certezza assoluta su $\mu_0$) i dati non lo correggono mai. Nel caso gaussiano lo scarto vale $\frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\,\vert \bar{X} - \mu_0 \vert$ e decresce come $1/N$.
2. **Prior uniforme** (*uniform prior*): se $p(\theta)$ è costante il prior non influenza la posterior, $p(\theta|X) \propto p(X|\theta)$, e il massimo della posterior è la stima ML. La posterior resta una curva con la sua larghezza. Un prior uniforme su tutto l'asse non è normalizzabile: lo leggo come limite $\sigma_0^2 \to \infty$, che dà $\mu_N \to \bar{X}$ per ogni $N$.

I passaggi sono nella dimostrazione [«quando ML e Bayes coincidono»](#derivation:der10).`,
  },
  {
    id: 'fc-ml-o-bayes-pratica',
    kind: 'confronto',
    q: md`Perché in pratica si preferisce spesso ML, e che cosa offre in più la stima bayesiana?`,
    a: md`**ML** (*why ML is often preferred*):
- minore complessità computazionale (*lower computational complexity*): Bayes calcola e integra distribuzioni intere;
- interpretabilità più semplice (*simpler interpretability*): un solo valore dei parametri, comodo per una predizione diretta (*straightforward prediction*).

**Bayes** (*key benefits*):
- incorpora conoscenza a priori o il parere di esperti (*incorporating prior knowledge*), utile quando i dati sono scarsi;
- quantifica l'incertezza (*uncertainty quantification*): la posterior intera permette affermazioni probabilistiche, per esempio intervalli di credibilità (*credible intervals*).`,
  },

  // --- stima non parametrica: che cos'è e quando serve (c07-c14) ---
  {
    id: 'fc-non-parametrica',
    kind: 'definizione',
    q: md`Che cosa vuol dire «stima non parametrica» e in che cosa differisce dalla stima parametrica?`,
    a: md`I metodi parametrici assumono una forma funzionale (*functional form*) fissata, per esempio gaussiana o di Poisson, e ne stimano i parametri $\theta$ con ML o con Bayes. I metodi non parametrici (*nonparametric estimation*) fanno meno ipotesi sulla distribuzione e si appoggiano ai dati: stimano il valore della pdf $p(\mathbf{x}^*)$ in ogni punto di interesse.

«Non parametrico» non vuol dire «senza parametri da scegliere» ($K$ e $V$ vanno scelti): vuol dire senza un modello a forma fissa descritto da un vettore $\theta$.`,
  },
  {
    id: 'fc-quando-serve',
    kind: 'proprieta',
    q: md`Quando diventa necessaria la stima non parametrica? (slide p41)`,
    a: md`Due condizioni:
1. **nessuna conoscenza a priori** sulla forma funzionale della pdf che caratterizza il fenomeno osservato (*no prior knowledge*): ho solo i campioni di training, e senza una famiglia fissata non posso applicare ML o Bayes;
2. **modelli parametrici inadeguati** (*inadequate parametric models*): gaussiana, esponenziale o logistica non rappresentano i dati in modo abbastanza accurato. Esempio tipico: una densità multimodale approssimata con una sola gaussiana.

In entrambi i casi gli approcci non parametrici si applicano direttamente alle osservazioni disponibili (*applied directly on the available observations*).`,
  },
  {
    id: 'fc-data-driven-flessibilita',
    kind: 'proprieta',
    q: md`Quali sono le due caratteristiche chiave dei metodi non parametrici secondo le note, e qual è il loro prezzo?`,
    a: md`- **Guidati dai dati** (*data-driven*): nessuna distribuzione assunta, la stimo dai campioni; utile quando la distribuzione vera è complessa o sconosciuta. I campioni vanno conservati: ogni valutazione della stima li usa tutti.
- **Flessibili** (*flexibility*): catturano strutture intricate (*intricate patterns*) nei dati.

Prezzo: maggiore complessità computazionale (*higher computational complexity*) e bisogno di quantità di dati più grandi (*larger amounts of data*) per stime accurate.`,
  },
  {
    id: 'fc-due-metodi',
    kind: 'definizione',
    q: md`Quali sono i due metodi non parametrici del corso e qual è l'idea di ciascuno?`,
    a: md`- **K-NN** (*K-nearest neighbor*): la densità in un punto dipende dalla prossimità dei campioni vicini. Per un punto di interrogazione (*query point*) trovo i $K$ campioni di training più vicini: se sono vicini la densità è alta, se devo andare lontano per trovarli è bassa.
- **Finestre di Parzen** (*Parzen windows*): colloco una piccola finestra predefinita (spesso un kernel gaussiano) attorno a ogni campione; la densità in un punto è la media dei contributi delle finestre vicine.

Le note p16 citavano anche l'approssimazione con funzioni ortogonali, che il corso non sviluppa.`,
  },

  // --- concetti di base e formula madre (c15-c25) ---
  {
    id: 'fc-x-star-e-regione',
    kind: 'definizione',
    q: md`Da quali oggetti parte il ragionamento dei «Basic Concepts» (slide p43)?`,
    a: md`Da un campione generico $\mathbf{x}^*$, il punto dello spazio delle feature in cui voglio la densità, e da una regione predefinita $R$ dello spazio delle feature che lo contiene: $\mathbf{x}^* \in R$. La stima è locale: guardo che cosa succede dentro $R$ per dedurre il valore di $p(\mathbf{x}^*)$.`,
  },
  {
    id: 'fc-ipotesi-di-base',
    kind: 'definizione',
    q: md`Quali due ipotesi della slide 43 servono per scrivere $P_R = p(\mathbf{x}^*)\,V$?`,
    a: md`1. la pdf vera $p(\mathbf{x})$ è una funzione continua (*continuous function*);
2. $R$ è abbastanza piccola (*sufficiently small*) perché $p(\mathbf{x})$ non vari in modo significativo al suo interno.

Allora $p(\mathbf{x}) \approx p(\mathbf{x}^*)$ in tutta $R$. Se $p$ ha un salto dentro $R$, o $R$ è grande rispetto alla scala su cui $p$ varia, l'approssimazione cade.`,
  },
  {
    id: 'fc-probabilita-regione',
    kind: 'formula',
    q: md`Scrivi la probabilità $P_R$ che un campione cada in $R$ e la sua approssimazione.`,
    a: md`$$P_R = P\{\mathbf{x}\in R\} = \int_R p(\mathbf{x})\,d\mathbf{x} = p(\mathbf{x}^*)\,V$$

La slide scrive «=», ma l'ultimo passaggio è un'approssimazione, esatta per $V \to 0$. Versione rigorosa: per il teorema della media integrale, con $p$ continua e $R$ connessa esiste $\boldsymbol{\xi} \in R$ con $P_R = p(\boldsymbol{\xi})\,V$; la regione piccola permette di sostituire $\boldsymbol{\xi}$ con $\mathbf{x}^*$.`,
  },
  {
    id: 'fc-volume-regione',
    kind: 'definizione',
    q: md`Che cos'è $V$ nella stima non parametrica e che unità di misura ha la densità?`,
    a: md`$V$ è il volume (ipervolume, *hypervolume*) della regione $R$: una lunghezza in 1-D, un'area in 2-D, un volume in 3-D. Per una ipersfera di raggio $r$: $V = 2r$ in 1-D, $V = \pi r^2$ in 2-D, $V = \tfrac{4}{3}\pi r^3$ in 3-D. La densità si misura in «1 / unità di volume», quindi può superare 1.`,
  },
  {
    id: 'fc-conteggio-k',
    kind: 'definizione',
    q: md`Che cos'è $K$ nella formula $K/(NV)$ e perché è una variabile aleatoria?`,
    a: md`$K$ è il numero di campioni di training che cadono in $R$, su un totale di $N$. Dipende da quali campioni sono stati estratti: con campioni i.i.d. e $R$ fissata, ogni campione cade in $R$ con probabilità $P_R$, quindi $K \sim \text{Binomiale}(N, P_R)$ con valore atteso $N P_R$.`,
  },
  {
    id: 'fc-frequenza-relativa',
    kind: 'formula',
    q: md`Come si stima $P_R$ e sotto quali ipotesi implicite la stima è consistente?`,
    a: md`Con la frequenza relativa (*relative frequency*):

$$\hat{P}_R = \frac{K}{N}$$

È una stima consistente (*consistent estimate*) se (a) gli $N$ campioni sono i.i.d. da $p(\mathbf{x})$ e (b) $R$ è «predefined», fissata prima di guardare i campioni. Nel K-NN la (b) cade: la cella è costruita sui campioni. Attenzione: $K/N$ converge a $P_R$, non a $p(\mathbf{x}^*)$; per arrivare alla densità serve anche $V \to 0$.`,
  },
  {
    id: 'fc-legge-grandi-numeri',
    kind: 'formula',
    q: md`Scrivi la legge dei grandi numeri per la frequenza relativa, come nella slide 43.`,
    a: md`$$\lim_{N\to+\infty} P\{\vert\hat{P}_R - P_R\vert < \delta\} = 1 \quad \forall\delta > 0$$

Convergenza in probabilità (*law of large numbers*): qualunque tolleranza $\delta$ fissi, la probabilità che la stima disti meno di $\delta$ da $P_R$ tende a 1. La stima diventa più accurata al crescere di $N$.`,
  },
  {
    id: 'fc-formula-madre',
    kind: 'formula',
    q: md`Scrivi la stima non parametrica della pdf in $\mathbf{x}^*$ e spiega da dove viene.`,
    a: md`$$\hat{p}(\mathbf{x}^*) = \frac{\hat{P}_R}{V} = \frac{K}{NV}$$

Uguaglio $P_R \approx p(\mathbf{x}^*)\,V$ con la stima $\hat{P}_R = K/N$ e divido per il volume. È la formula madre: K-NN e Parzen ne sono due letture. Vale con campioni i.i.d., $p$ continua in $\mathbf{x}^*$, $R$ piccola (poco bias) e con abbastanza campioni dentro (poca varianza). I passaggi sono nella dimostrazione [«dalla probabilità di una regione alla stima K/(N·V)»](#derivation:der01).`,
  },
  {
    id: 'fc-due-approssimazioni',
    kind: 'intuizione',
    q: md`Nella catena che porta a $K/(NV)$ ci sono due «≈». Di che natura sono e come si migliorano?`,
    a: md`- Il primo, $\int_R p(\mathbf{x})\,d\mathbf{x} \approx p(\mathbf{x}^*)\,V$, è **geometrico**: è un errore di approssimazione (bias) e migliora stringendo $R$.
- Il secondo, $P_R \approx K/N$, è **statistico**: è un errore di campionamento (varianza) e migliora allargando $R$ o aumentando $N$.

Le due richieste tirano in direzioni opposte: da qui il dilemma sulla dimensione di $R$.`,
  },
  {
    id: 'fc-r-grande-e-piccola',
    kind: 'proprieta',
    q: md`Quali sono le due «Observations» della slide 44 sulla regione $R$?`,
    a: md`1. $R$ deve essere **abbastanza grande** (*enough large*) da contenere abbastanza campioni per applicare la legge dei grandi numeri; con pochissimi campioni $K/N$ è una stima rumorosa di $P_R$.
2. $R$ deve essere **abbastanza piccola** (*enough small*) da limitare la variabilità di $p(\mathbf{x})$ al suo interno; altrimenti $P_R = p(\mathbf{x}^*)\,V$ non vale e la stima diventa una media della densità su una zona larga.`,
  },
  {
    id: 'fc-dilemma-regione',
    kind: 'intuizione',
    q: md`Che cosa succede se $R$ è troppo piccola o troppo grande? (note p32)`,
    a: md`- **Troppo piccola**: la stima è eccessivamente sensibile al rumore dei dati (varianza alta).
- **Troppo grande**: la stima non riflette le variazioni locali della pdf (bias alto).

È il compromesso bias-varianza della stima non parametrica; nella slide 44 c'è l'omino che si gratta la testa. K-NN e Parzen lo risolvono in due modi diversi.`,
  },

  // --- due parametri, due metodi (c26-c31) ---
  {
    id: 'fc-due-parametri',
    kind: 'confronto',
    q: md`Nella formula $K/(NV)$, come nascono dal ruolo di $K$ e $V$ i due metodi non parametrici?`,
    a: md`Il progettista fissa uno dei due parametri e l'altro si ricava dai dati (slide 45, che scrive «two parameters K e V», con la congiunzione italiana):
- **K-NN**: $K$ è fissato e l'ipervolume $V$ di $R$ si calcola sul training set; $V$ si regola in modo che dentro cadano esattamente $K$ campioni.
- **Parzen** (*Parzen window*, *Kernel Density Estimation*): $R$, e quindi $V$, è fissata e $K$ si calcola dai campioni; le note aggiungono che i contributi dei campioni nella finestra sono pesati da un kernel, tipicamente gaussiano.`,
  },
  {
    id: 'fc-knn-pro-contro',
    kind: 'confronto',
    q: md`Vantaggio e svantaggio del K-NN secondo le note p32?`,
    a: md`- **Vantaggio**: si adatta alle variazioni locali di densità (*adaptive to local density variations*): la cella è piccola dove i dati sono fitti e grande dove sono radi.
- **Svantaggio**: la scelta di $K$ è cruciale; se $K$ non è scelto bene le prestazioni degradano.`,
  },
  {
    id: 'fc-parzen-pro-contro',
    kind: 'confronto',
    q: md`Vantaggi e svantaggi del metodo di Parzen secondo le note p32?`,
    a: md`- **Vantaggi**: stime della pdf lisce (*smooth*), meno sensibili al rumore di quelle del K-NN.
- **Svantaggi**: la dimensione della finestra (*window size*, *bandwidth*) influenza molto la stima. Finestra troppo piccola: *overfitting*. Finestra troppo grande: *oversmoothing*, che nasconde struttura locale importante.`,
  },
  {
    id: 'fc-convergenza-campione-finito',
    kind: 'proprieta',
    q: md`K-NN e Parzen tendono alla soluzione ottima? *(Do they tend to the optimal solution?)*`,
    a: md`Sì, asintoticamente: entrambi i metodi convergono (slide 45). Sono consistenti: al crescere di $N$ la pdf stimata converge alla pdf vera, sotto le condizioni su $K_N$ (K-NN) o su $V_N$ (Parzen). È però difficile dire qualcosa di significativo sul loro comportamento a campione finito (*finite-sample behavior*), per i compromessi nella scelta di $K$ e $V$.`,
  },

  // --- figura di slide p46: Parzen contro K-NN (c32-c34) ---
  {
    id: 'fc-figura-parzen-vs-knn',
    kind: 'intuizione',
    q: md`Che cosa mostra la figura «Illustration of Parzen versus K-NN estimation concepts» (slide p46)?`,
    a: md`Riquadri 2-D con i campioni (punti neri) e la regione $R$ (cerchio rosso) centrata nel centro del riquadro, per $N = 1, 4, 9, 16, \dots, 100$; i campioni si accumulano da un riquadro al successivo.
- **Riga alta, Parzen**, $V = 1/\sqrt{N}$: il cerchio si restringe in modo deterministico, qualunque sia la posizione dei campioni; il numero $K$ catturato è casuale (per $N = 4$ nessun campione è dentro: stima nulla).
- **Riga bassa, K-NN**, $K = \sqrt{N}$: il cerchio si espande fino a toccare il $K$-esimo campione più vicino; per $N = 1$ passa per l'unico campione.

È la stessa formula $K/(NV)$ letta in due modi: in entrambe le righe la regione si restringe al crescere di $N$, e con le leggi dichiarate il numero di campioni dentro cresce. È la Fig. 4.2 del testo di Duda-Hart-Stork.`,
  },
  {
    id: 'fc-figura-numeri',
    kind: 'formula',
    q: md`Nella figura di slide p46, quanto valgono $V$ (riga Parzen) e $K$ (riga K-NN) per $N = 1, 4, 9, 16, 100$?`,
    a: md`| $N$ | $V = 1/\sqrt{N}$ | $K = \sqrt{N}$ |
|---|---|---|
| 1 | 1 | 1 |
| 4 | 0.5 | 2 |
| 9 | 0.333 | 3 |
| 16 | 0.25 | 4 |
| 100 | 0.1 | 10 |

La legge di Parzen soddisfa $V_N \to 0$ e $N V_N = \sqrt{N} \to \infty$ (è la legge $h_N = 1/N^{1/(2n)}$ del modulo sulle finestre di Parzen, perché $h_N^n = 1/\sqrt{N}$). La legge K-NN soddisfa $K_N \to \infty$ e $K_N/N = 1/\sqrt{N} \to 0$. Con il K-NN la stima non è mai nulla; con Parzen può esserlo.`,
  },
  {
    id: 'fc-figura-disegno-raggio',
    kind: 'proprieta',
    q: md`Nella riga Parzen della figura di slide p46, i cerchi disegnati rispettano davvero $V = 1/\sqrt{N}$?`,
    a: md`No. Misurati sull'immagine, i raggi valgono circa 73, 36, 24, 18 e 6 pixel: è il **raggio** a scalare come $1/\sqrt{N}$, e l'area scala come $1/N$. Per questo il conteggio resta fermo attorno a 1 ($K = 1, 0, 1, 1, 1$) invece di crescere come $\sqrt{N}$. La legge da ricordare è quella dichiarata, sul volume.

Nella riga K-NN i raggi (61, 61, 50, 41, 28 pixel) coincidono con le distanze del 1°, 2°, 3°, 4° e 10° vicino: quella riga è esatta. Per $N = 100$ il cerchio K-NN è molto più grande di quello di Parzen perché deve contenere 10 campioni.`,
  },

  // --- stima K-NN: ipotesi, metodo, formula, consistenza (c35-c46) ---
  {
    id: 'fc-ipotesi-knn',
    kind: 'definizione',
    q: md`Quali sono le due ipotesi del metodo K-NN (slide p47)?`,
    a: md`1. Il numero $K$ è fissato a priori (*set a priori*), indipendentemente dal punto $\mathbf{x}^*$.
2. Si sceglie a priori una forma (*shape*) per la cella di volume centrata su $\mathbf{x}^*$, per esempio una ipersfera (*hypersphere*); si possono usare anche altre geometrie. La forma decide come si misura la vicinanza (ipersfera = distanza euclidea) e la formula del volume.`,
  },
  {
    id: 'fc-metodologia-knn',
    kind: 'procedura',
    q: md`Descrivi passo per passo come si calcola la stima K-NN in un punto $\mathbf{x}^*$.`,
    a: md`1. Fisso $K$ e la forma della cella.
2. Centro la cella in $\mathbf{x}^*$.
3. La espando finché contiene $K$ campioni di training (*expand the cell up to spanning K training samples*): calcolo le $N$ distanze da $\mathbf{x}^*$, le ordino e prendo come raggio $r_K$ la $K$-esima.
4. Misuro il volume raggiunto $V_K(\mathbf{x}^*)$.
5. Applico $\hat{p}(\mathbf{x}^*) = K/(N\,V_K(\mathbf{x}^*))$.

La stima è puntuale: per la curva intera ripeto su una griglia di punti, e ogni valutazione costa $N$ distanze.`,
  },
  {
    id: 'fc-volume-vk',
    kind: 'definizione',
    q: md`Che cos'è $V_K(\mathbf{x}^*)$ e come si calcola con una cella sferica?`,
    a: md`È il volume della cella alla fine dell'espansione: la regione centrata in $\mathbf{x}^*$ che contiene i $K$ campioni più vicini. Dipende dal punto e dai dati: piccolo nelle zone dense, grande nelle zone rade. Se $r_K(\mathbf{x}^*)$ è la distanza dal $K$-esimo vicino: $V_K = 2 r_K$ in 1-D, $V_K(\mathbf{x}^*) = \pi\, r_K^2(\mathbf{x}^*)$ in 2-D.`,
  },
  {
    id: 'fc-formula-knn',
    kind: 'formula',
    q: md`Scrivi la stima K-NN della pdf in $\mathbf{x}^*$.`,
    a: md`$$\hat{p}(\mathbf{x}^*) = \frac{K}{N\,V_K(\mathbf{x}^*)}$$

$K$ è il numero di vicini (fissato), $N$ il numero totale di campioni di training, $V_K(\mathbf{x}^*)$ il volume della cella che racchiude i $K$ vicini. Il numeratore è costante: tutta l'informazione sulla densità sta nel volume al denominatore.`,
  },
  {
    id: 'fc-condizione-consistenza',
    kind: 'formula',
    q: md`Qual è la condizione necessaria e sufficiente per una stima K-NN consistente (slide p47)?`,
    a: md`Se $K$ è scelto come funzione di $N$, la stima è consistente in tutti i punti in cui $p(\mathbf{x})$ è continua se e solo se:

$$\lim_{N\to+\infty} K_N = +\infty, \qquad \lim_{N\to+\infty} \frac{K_N}{N} = 0$$

Le due condizioni devono valere insieme. La slide dice «It can be shown» e non riporta la dimostrazione.`,
  },
  {
    id: 'fc-significato-condizioni',
    kind: 'intuizione',
    q: md`Che cosa garantiscono, una per una, le due condizioni $K_N \to \infty$ e $K_N/N \to 0$?`,
    a: md`$K$ deve crescere con $N$, ma molto più lentamente di $N$.
- $K_N \to \infty$: dentro la cella cadono sempre più campioni, la frequenza relativa diventa affidabile e la variabilità si riduce (varianza $\to 0$).
- $K_N/N \to 0$: la frazione di dati nella cella tende a zero, quindi la cella si restringe, l'ipotesi di pdf costante in $R$ diventa esatta e migliora l'accuratezza locale (bias $\to 0$).`,
  },
  {
    id: 'fc-esempio-radice',
    kind: 'formula',
    q: md`Verifica che $K(N) = \sqrt{N}$ è una legge consistente e dai qualche numero.`,
    a: md`$$\lim_{N\to+\infty} \sqrt{N} = +\infty, \qquad \lim_{N\to+\infty} \frac{\sqrt{N}}{N} = \lim_{N\to+\infty} \frac{1}{\sqrt{N}} = 0$$

$N = 100$: $K = 10$, $K/N = 0.1$. $N = 10\,000$: $K = 100$, $K/N = 0.01$. $N = 10^6$: $K = 1000$, $K/N = 0.001$. Il volume $V_K(\mathbf{x}^*)$ si restringe (risoluzione locale migliore) mentre più vicini danno affidabilità statistica. La slide scrive $K_N$ nella condizione e $K(N)$ nell'esempio: sono la stessa cosa.`,
  },
  {
    id: 'fc-controesempi',
    kind: 'proprieta',
    q: md`Dai una legge $K(N)$ che viola ciascuna condizione di consistenza e di' che cosa succede.`,
    a: md`- $K_N = K_0$ costante: $K_N \nrightarrow \infty$. La frequenza è sempre calcolata su pochi campioni, la varianza non si annulla, la curva resta frastagliata anche con $N$ enorme.
- $K_N = \alpha N$ con $0 < \alpha < 1$: $K_N/N \to \alpha \ne 0$. La cella contiene sempre una frazione fissa dei dati, il volume non tende a zero e resta un bias (*oversmoothing*).
- $K_N = \sqrt{N}$ o $K_N = \log N$ rispettano entrambe le condizioni; il logaritmo riduce la varianza molto lentamente.

Passaggi nella dimostrazione [«controesempi»](#derivation:der03).`,
  },
  {
    id: 'fc-k-fisso',
    kind: 'proprieta',
    q: md`Perché le note dicono «Fixed K may lead to bias or overfitting»?`,
    a: md`- $K$ troppo piccolo: stime troppo sensibili alle fluttuazioni casuali dei dati (varianza alta, *high variance*).
- $K$ troppo grande: stima troppo liscia, si perdono dettagli locali importanti (bias alto, *high bias*).

Adattare $K$ a $N$ mantiene il metodo consistente e offre un compromesso tra bias e varianza. Con $K$ funzione di $N$ il K-NN resta non parametrico: nessuna ipotesi sulla forma funzionale della pdf.`,
  },
  {
    id: 'fc-overfit',
    kind: 'definizione',
    q: md`Che cosa vuol dire *overfit* per la stima K-NN? *(what does it mean overfit)*`,
    a: md`Con $K$ troppo piccolo la densità stimata diventa molto variabile, frastagliata (*jagged*): cattura anche le fluttuazioni minori dei campioni di training. La stima è troppo sensibile al rumore dei dati. Caso estremo $K = 1$: uno spillo che diverge su ogni campione.`,
  },
  {
    id: 'fc-oversmooth',
    kind: 'definizione',
    q: md`Che cosa vuol dire *oversmooth* per la stima K-NN? *(what does it mean oversmooth)*`,
    a: md`Con $K$ troppo grande la stima diventa troppo liscia o piatta (*flat*): va in *underfitting*. Media su una regione grande, perde risoluzione (*loss of resolution*) e non cattura la struttura locale. Caso estremo $K = N$: in 1-D un'unica cuspide tra il campione minimo e il massimo, con tutta la struttura interna cancellata.`,
  },
  {
    id: 'fc-k-iperparametro',
    kind: 'proprieta',
    q: md`Che tipo di parametro è $K$ e come si sceglie?`,
    a: md`È un iperparametro (*hyperparameter*) importante: bilancia bias (*underfitting*) e varianza (*overfitting*). Non si stima dai dati con una formula: si fissa a priori, con una legge come $K = \sqrt{N}$ oppure con una procedura di validazione.`,
  },

  // --- esempi grafici 1-D e 2-D (c47-c52) ---
  {
    id: 'fc-esempio-1d',
    kind: 'intuizione',
    q: md`Descrivi l'esempio 1-D della slide 48 ($K = 3$ e $K = 5$).`,
    a: md`Otto campioni sull'asse $x$ (punti rossi) e due stime $p(x)$:
- **$K = 3$** (curva rossa): segue i dati da vicino, aspetto frastagliato con molte discontinuità; cattura la struttura locale ma tende all'*overfitting*. Ha 6 cuspidi; la più alta sta sopra la terna di punti più ravvicinati.
- **$K = 5$** (curva nera): più liscia, picchi più bassi e larghi (4 cuspidi). Riduce la varianza ma diventa più piatta e meno reattiva alla distribuzione locale.

Le cuspidi sono $N - K + 1$, una per ogni gruppo di $K$ campioni consecutivi, e le due curve hanno code che scendono lentamente.`,
  },
  {
    id: 'fc-discontinuita-pendenza',
    kind: 'proprieta',
    q: md`Perché le discontinuità di pendenza della stima K-NN cadono lontano dai campioni (Nota della slide 48)?`,
    a: md`La pendenza cambia di colpo quando cambia l'identità del $K$-esimo vicino, e questo accade nei **punti medi** tra due campioni, non sui campioni. Le cuspidi (massimi) cadono nel punto medio tra il primo e l'ultimo di $K$ campioni consecutivi; gli angoli (minimi) nel punto medio tra il campione che esce dalla cella e quello che entra.

A essere discontinua è solo la pendenza: $r_K(x)$ è continuo, quindi per $K \ge 2$ e campioni distinti la stima è continua. Le note parlano di «many discontinuities»: sono discontinuità della derivata prima.`,
  },
  {
    id: 'fc-forma-1d',
    kind: 'formula',
    q: md`Scrivi la stima K-NN in 1-D in forma esplicita.`,
    a: md`La cella è un intervallo centrato in $x$ di semi-larghezza $r_K(x)$, la distanza dal $K$-esimo campione più vicino:

$$V_K(x) = 2\,r_K(x), \qquad \hat{p}(x) = \frac{K}{2N\,r_K(x)}$$

$r_K(x)$ è lineare a tratti con pendenza $\pm 1$, quindi tra un cambio di vicino e il successivo la stima è un ramo di iperbole. Per $K \ge 2$ e campioni distinti la stima è sempre finita; per $K = 1$ diverge sui campioni.`,
  },
  {
    id: 'fc-cuspidi-formule',
    kind: 'formula',
    q: md`Dove cadono e quanto sono alte le cuspidi della stima K-NN in 1-D? Quanto vale la pendenza?`,
    a: md`Con $x_{(i)}$ i campioni in ordine crescente:

$$x_{\text{cuspide}} = \frac{x_{(i)} + x_{(i+K-1)}}{2}, \qquad x_{\text{angolo}} = \frac{x_{(i)} + x_{(i+K)}}{2}$$

$$\hat{p}\left(x_{\text{cuspide}}\right) = \frac{K}{N\,\left(x_{(i+K-1)} - x_{(i)}\right)}, \qquad \left\vert\frac{d\hat{p}}{dx}\right\vert = \frac{K}{2N\,r_K^2(x)} = \frac{2N}{K}\,\hat{p}^{\,2}(x)$$

La cuspide più alta sta sopra il gruppo di $K$ campioni consecutivi più stretto. I passaggi sono nella dimostrazione [«forma 1-D della stima K-NN»](#derivation:der04).`,
  },
  {
    id: 'fc-disegnare-stima-1d',
    kind: 'procedura',
    q: md`All'orale ti chiedono di disegnare la stima K-NN in 1-D e di dire «how is the distribution». Come procedi?`,
    a: md`Con $N$ campioni ordinati e $K$ fissato:
1. prendo le finestre di $K$ campioni consecutivi e ne misuro la larghezza;
2. metto una cuspide nel punto medio di ogni finestra, alta $K/(N \cdot \text{larghezza})$;
3. metto i minimi angolosi nei punti medi tra il campione che esce e quello che entra;
4. unisco con rami di iperbole $K/(2N\,r_K(x))$;
5. disegno le code che scendono come $1/\vert x \vert$.

Esempio: campioni 1.0, 1.2, 1.3, 2.5, 4.0 con $K = 3$: cuspidi in 1.15, 1.85, 2.65, alte 2.0, 0.46, 0.22; minimi in 1.75 (0.4) e 2.6 (0.21). La distribuzione ha un picco alto e stretto sulla zona densa, un altopiano basso sui campioni isolati e code lente.`,
  },
  {
    id: 'fc-code-pesanti',
    kind: 'proprieta',
    q: md`La stima K-NN è una pdf valida? Guarda le code.`,
    a: md`No. Lontano da tutti i campioni $r_K(x)$ cresce come $\vert x \vert$, quindi:

$$\hat{p}(x) \simeq \frac{K}{2N\vert x\vert} \quad (\vert x\vert\to\infty) \qquad\Rightarrow\qquad \int_{-\infty}^{+\infty} \hat{p}(x)\,dx = +\infty$$

La divergenza è logaritmica: l'area su $[-L, +L]$ cresce come $\frac{K}{N}\ln L$ (con $K = 4$ e $N = 16$, circa 0.58 per ogni decade di $L$). Le code lente si vedono nelle figure delle slide 48 e 50, ma la fonte non le commenta.`,
  },
  {
    id: 'fc-esempio-2d',
    kind: 'intuizione',
    q: md`Com'è la superficie K-NN con $K = 5$ della slide 49?`,
    a: md`Sul piano $(x_1, x_2)$ una trentina di campioni rossi; sopra, la stima $\hat{p}(\mathbf{x}) = 5/(N\,\pi\,r_5^2(\mathbf{x}))$ con cella circolare. Picchi aguzzi sopra i gruppi fitti, creste angolose, un altopiano basso che non scende a zero dove i punti sono radi. Le discontinuità di pendenza stanno su linee lontane dai campioni, dove cambia il quinto vicino. Le note dicono che la stima «media» sui 5 vicini: in realtà misura il volume che li racchiude.`,
  },
  {
    id: 'fc-dimensioni-elevate',
    kind: 'intuizione',
    q: md`Che cosa dicono le note sul K-NN in dimensioni elevate e come lo leggi?`,
    a: md`In dimensioni più alte il volume dell'intorno cresce in modo esponenziale, quindi la scelta di $K$ diventa ancora più critica. A parità di $N$, per catturare $K$ campioni la cella deve diventare così estesa da non essere più locale, e cade l'ipotesi di pdf quasi costante in $R$. Un'immagine: la sfera inscritta occupa il 78.5% del cubo in 2-D, il 52.4% in 3-D, circa lo 0.25% in 10-D. È il legame con la maledizione della dimensionalità e l'effetto Hughes del Cap. 3.`,
  },

  // --- figura di slide p50: stime al crescere di N (c53-c57) ---
  {
    id: 'fc-figura-n-crescente',
    kind: 'intuizione',
    q: md`Che cosa mostra la figura delle stime K-NN di slide p50?`,
    a: md`Una griglia 4×2 su asse $x$ da 0 a 4: a sinistra una densità gaussiana, a destra una bimodale; righe $N = 1, 16, 256, \infty$. A $N$ finito le stime sono a spilli e rumorose; l'ultima riga mostra le densità vere a cui le stime tendono. La slide non dichiara $K$: la figura (dal testo di Duda-Hart-Stork) usa $K = \sqrt{N}$, cioè 1, 4, 16, come nell'esempio della slide 47.`,
  },
  {
    id: 'fc-colonna-gaussiana',
    kind: 'intuizione',
    q: md`Colonna gaussiana della figura di slide p50: com'è la stima per $N = 1, 16, 256, \infty$?`,
    a: md`La gaussiana vera ha media 2 e deviazione standard 1 (massimo circa 0.40).
- $N = 1$: un solo spillo, nessuna forma a campana.
- $N = 16$: la forma comincia a vedersi ma è rumorosa; i picchi arrivano a 0.8-0.9, più del doppio del massimo vero.
- $N = 256$: campana riconoscibile ma increspata, tra circa 0.25 e 0.55 nella zona centrale.
- $N = \infty$: gaussiana liscia centrata in $x = 2$.`,
  },
  {
    id: 'fc-colonna-bimodale',
    kind: 'intuizione',
    q: md`Colonna bimodale della figura di slide p50: com'è fatta la densità vera e come la insegue la stima?`,
    a: md`La densità vera è un triangolo su $[0.5, 2.5]$ con vertice in 1.5 più un rettangolo su $[3, 3.5]$, entrambi alti circa 0.67 (aree 2/3 e 1/3): non sono due gaussiane.
- $N = 1$: la stima non cattura i due picchi.
- $N = 16$: i due picchi cominciano ad apparire, con rumore.
- $N = 256$: forma bimodale più chiara, un po' di rumore residuo; nella valle e ai bordi la stima non scende mai a zero (code lente).
- $N = \infty$: struttura bimodale netta con due picchi distinti.

I bordi verticali del rettangolo sono il punto più difficile da riprodurre.`,
  },
  {
    id: 'fc-un-solo-campione',
    kind: 'formula',
    q: md`Com'è la stima K-NN con un solo campione ($N = 1$, $K = 1$)?`,
    a: md`La cella centrata in $x$ si espande fino a $x_1$: $V = 2\vert x - x_1\vert$ e

$$\hat{p}(x) = \frac{1}{2\,\vert x - x_1\vert}$$

Un asintoto verticale sul campione e due rami che decrescono lentamente. Nella prima riga della figura di slide p50 la curva di sinistra ($x_1 \approx 3.4$) vale circa 0.15 in $x = 0$, proprio $1/(2 \cdot 3.4)$. L'area è infinita e la stima non somiglia alla densità vera: con $N$ piccolo il K-NN è inutilizzabile.`,
  },
  {
    id: 'fc-convergenza-visiva',
    kind: 'proprieta',
    q: md`Che cosa mostra l'ultima riga ($N = \infty$) della figura di slide p50?`,
    a: md`La consistenza, in forma grafica: nel limite la stima diventa la gaussiana liscia e la bimodale netta, qualunque sia la forma della densità (è il vantaggio del non parametrico). La convergenza è lenta: a $N = 256$ la stima è ancora rumorosa. La slide 47 la garantisce solo nei punti in cui $p(\mathbf{x})$ è continua: ai bordi verticali del rettangolo della bimodale non è garantita, e lì la stima a $N$ finito è peggiore.`,
  },

  // --- pagina di confine: avvio di Parzen (c58-c62) ---
  {
    id: 'fc-parzen-idea',
    kind: 'definizione',
    q: md`Qual è l'idea di base della stima con finestre di Parzen (note p36) e quali due punti di vista si mescolano?`,
    a: md`Stimare la pdf senza un modello parametrico: si mette una finestra (*kernel*) e si calcola la densità dalla proporzione di punti che vi cadono. Due letture:
- slide: una regione $R$ centrata sul punto di stima $\mathbf{x}^*$, dentro cui si contano i campioni;
- note: una finestra centrata su ogni campione $\mathbf{x}_k$, e in $\mathbf{x}^*$ si sommano i contributi delle finestre che lo coprono.

Danno lo stesso numero perché la finestra è pari:

$$\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right) = \gamma\left(\frac{\mathbf{x}^* - \mathbf{x}_k}{h}\right)$$

L'equivalenza cadrebbe con una finestra asimmetrica.`,
  },
  {
    id: 'fc-parzen-ipercubo',
    kind: 'definizione',
    q: md`Con quale regione parte il metodo di Parzen e qual è il suo obiettivo?`,
    a: md`Per semplicità si assume, temporaneamente, che $R$ sia un ipercubo $n$-dimensionale (*n-dimensional hypercube*) di spigolo $h$ centrato su $\mathbf{x}^*$: $V = h^n$, con $n$ numero di feature. L'obiettivo è contare i campioni che cadono nell'ipercubo, per poi usare ancora $K/(NV)$. Per avere un'espressione analitica di $K$ (*analytic expression for K*) si definisce una funzione finestra. L'ipotesi è temporanea: poi l'ipercubo lascia il posto a kernel lisci.`,
  },
  {
    id: 'fc-funzione-finestra',
    kind: 'formula',
    q: md`Come è definita la funzione finestra $\gamma$ dell'ipercubo?`,
    a: md`Nella fonte (note e slide) solo a parole:

$$\gamma(\mathbf{x}) = \begin{cases} 1, & \text{if } \mathbf{x} \text{ belongs to the hypercube} \\ 0, & \text{otherwise} \end{cases}$$

Con la convenzione di Duda-Hart-Stork l'ipercubo è quello di lato 1 centrato nell'origine:

$$\gamma(\mathbf{u}) = \begin{cases} 1, & \vert u_j\vert \le \frac{1}{2}, \quad j = 1, \dots, n \\ 0, & \text{altrimenti} \end{cases}$$

La funzione «conta» se un campione cade nell'ipercubo oppure no.`,
  },
  {
    id: 'fc-appartenenza-regione',
    kind: 'formula',
    q: md`Quando il campione $\mathbf{x}_k$ appartiene alla regione $R$ di centro $\mathbf{x}^*$ e spigolo $h$?`,
    a: md`$$\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right) = 1 \;\Longleftrightarrow\; \vert x_{k,j} - x^*_j\vert \le \frac{h}{2} \quad \forall j = 1, \dots, n$$

Altrimenti $\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right) = 0$ e il campione è fuori. L'argomento trasla il campione rispetto al centro e lo scala con $h$, riportando il test all'ipercubo unitario. La slide p51 scrive la stessa condizione con le parentesi quadre: $\gamma[(\mathbf{x}_k - \mathbf{x}^*)/h] = 1$.`,
  },

  // --- confronto e classificatore (c63-c64) ---
  {
    id: 'fc-knn-contro-parzen',
    kind: 'confronto',
    q: md`Quali sono le differenze tra K-NN e finestre di Parzen? *(what are the difference with parzen window)*`,
    a: md`Formula comune: $\hat{p}(\mathbf{x}^*) = K/(NV)$.

| | K-NN | Parzen |
|---|---|---|
| fissato | $K$ | $V$ (cioè $h$) |
| ricavato dai dati | $V_K(\mathbf{x}^*)$ | $K$ |
| cella | si adatta alla densità locale | uguale ovunque |
| forma della stima | spigolosa, code lente, area infinita | liscia con kernel lisci, meno sensibile al rumore, integra a 1 |
| zone senza campioni | valore piccolo ma mai nullo | 0 con l'ipercubo; col kernel gaussiano decade in fretta |
| iperparametro | $K$ | $h$ |
| consistenza | $K_N \to \infty$, $K_N/N \to 0$ (es. $K = \sqrt{N}$) | $V_N \to 0$, $N V_N \to \infty$ (es. $V = 1/\sqrt{N}$) |

Entrambi convergono alla pdf vera; a campione finito il comportamento è difficile da prevedere.`,
  },
  {
    id: 'fc-classificatore-knn',
    kind: 'procedura',
    q: md`Come si passa dalla stima K-NN al classificatore K-NN? *(how the K-NN classifier works)*`,
    a: md`Espando la cella attorno a $\mathbf{x}$ fino a $K$ campioni di qualunque classe; $K_i$ di essi sono della classe $\omega_i$, che ha $N_i$ campioni di training.

$$\hat{p}(\mathbf{x}|\omega_i) = \frac{K_i}{N_i\,V}, \qquad \hat{P}(\omega_i) = \frac{N_i}{N}, \qquad \hat{P}(\omega_i|\mathbf{x}) = \frac{K_i}{K}$$

Per Bayes volume e numerosità si semplificano: la regola MAP assegna $\mathbf{x}$ alla classe più rappresentata tra i $K$ vicini (voto di maggioranza). $K$ piccolo: confine di decisione frastagliato; $K$ grande: troppo liscio. Il classificatore non è nelle pagine del modulo: lo chiede la banca delle domande. Passaggi nella dimostrazione [«dalla stima K-NN al classificatore K-NN»](#derivation:der05).`,
  },
  {
    id: 'fc-classificatore-ipotesi',
    kind: 'proprieta',
    q: md`Sotto quali ipotesi il classificatore K-NN si riduce al voto di maggioranza, e che cosa succede con $K = 1$ e $K = N$?`,
    a: md`Ipotesi:
1. la stessa cella di volume $V$ (quella con $K$ campioni di qualunque classe) vale per tutte le classi, così $V$ si semplifica;
2. i prior sono stimati con le frequenze $N_i/N$ del training set, così $N_i$ si semplifica. Se i prior veri $P(\omega_i)$ sono noti e diversi, la posterior è proporzionale a $P(\omega_i)\,K_i/N_i$ e la regola cambia.

Controllo: $\sum_i \frac{K_i}{N_i V}\cdot\frac{N_i}{N} = \frac{K}{NV}$, quindi le posterior sommano a 1. Casi limite: $K = 1$ è la regola del vicino più prossimo (confine frastagliato); $K = N$ sceglie sempre la classe più numerosa, cioè decide con il solo prior. Con due classi conviene $K$ dispari per evitare i pareggi.`,
  },

  // --- integrazioni quantitative (c65-c71) ---
  {
    id: 'fc-k-binomiale',
    kind: 'formula',
    q: md`Con $R$ fissata e campioni i.i.d., che legge segue $K$? Quanto valgono media e varianza di $K/N$?`,
    a: md`Ogni campione cade in $R$ con probabilità $P_R$: $K$ è la somma di $N$ prove di Bernoulli indipendenti.

$$P(K = k) = \binom{N}{k} P_R^{k} (1 - P_R)^{N-k}$$

$$E\{\hat{P}_R\} = P_R, \qquad \mathrm{var}\{\hat{P}_R\} = \frac{P_R (1 - P_R)}{N}$$

La frequenza relativa è non distorta e la sua varianza tende a zero: per la disuguaglianza di Chebyshev è consistente, ed è il limite della slide 43. I passaggi sono nella dimostrazione [«perché K/N è una stima consistente»](#derivation:der06).`,
  },
  {
    id: 'fc-errore-relativo',
    kind: 'intuizione',
    q: md`Quanto è precisa la frequenza relativa $K/N$ in termini di errore relativo?`,
    a: md`$$\frac{\sqrt{\mathrm{var}\{\hat{P}_R\}}}{P_R} = \sqrt{\frac{1 - P_R}{N P_R}} \simeq \frac{1}{\sqrt{K}}$$

Con 4 campioni nella regione l'incertezza è circa il 50%, con 100 circa il 10%. È la versione quantitativa di «R enough large» e della condizione $K_N \to \infty$.`,
  },
  {
    id: 'fc-bias-varianza-regione-fissa',
    kind: 'formula',
    q: md`Con $R$ fissata, quanto valgono valore atteso e varianza di $\hat{p}(\mathbf{x}^*) = K/(NV)$?`,
    a: md`$$E\{\hat{p}(\mathbf{x}^*)\} = \frac{E\{K\}}{NV} = \frac{P_R}{V} = \frac{1}{V}\int_R p(\mathbf{x})\,d\mathbf{x}$$

$$\mathrm{var}\{\hat{p}(\mathbf{x}^*)\} = \frac{P_R(1 - P_R)}{N V^2} \simeq \frac{p(\mathbf{x}^*)}{N V}$$

Il valore atteso è la **media spaziale** di $p$ su $R$: coincide con $p(\mathbf{x}^*)$ solo se $p$ è costante in $R$ o se $V \to 0$ (bias, da cui «R enough small»). La varianza esplode se $NV$ è piccolo (da cui «R enough large»). Serve una regione che dipende da $N$: $V_N \to 0$ e $N V_N \to \infty$. Passaggi nella dimostrazione [«bias e varianza di K/(N·V)»](#derivation:der07).`,
  },
  {
    id: 'fc-varianza-limite-docente',
    kind: 'proprieta',
    q: md`Come si confronta la varianza binomiale di $K/(NV)$ con il limite superiore che il docente dà per Parzen (slide p61)?`,
    a: md`$$\mathrm{var}\{\hat{p}(\mathbf{x}^*)\} = \frac{\bar{\hat{p}}(\mathbf{x}^*)\,(1 - P_R)}{N V} \;\le\; \frac{\bar{\hat{p}}(\mathbf{x}^*)}{N V} = \frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x}^*)}{N h^n} \quad (\sup\gamma = 1,\ V = h^n)$$

$\bar{\hat{p}} = P_R/V$ è il valore atteso della stima, nella notazione della slide 61. Con la finestra a ipercubo il risultato binomiale rispetta il limite del docente e ne è un caso particolare.`,
  },
  {
    id: 'fc-volume-ipersfera',
    kind: 'formula',
    q: md`Quanto vale il volume di una cella ipersferica di raggio $r_K$ in $n$ dimensioni?`,
    a: md`$$V_K(\mathbf{x}^*) = \frac{\pi^{n/2}}{\Gamma\left(\frac{n}{2}+1\right)}\, r_K^{\,n}(\mathbf{x}^*)$$

$n = 1$: $V = 2r_K$; $n = 2$: $V = \pi r_K^2$; $n = 3$: $V = \tfrac{4}{3}\pi r_K^3$. Con una cella a ipercubo di semilato $r$ si avrebbe $V = (2r)^n$. La formula non è nella fonte: serve per calcolare davvero $V_K(\mathbf{x}^*)$.`,
  },
  {
    id: 'fc-cella-si-regola-da-sola',
    kind: 'formula',
    q: md`Con $K_N = \sqrt{N}$, come si comporta il volume della cella K-NN e che legame ha con la riga Parzen della figura di slide p46?`,
    a: md`Nella cella cadono $K$ campioni su $N$, quindi $K_N/N \approx P_R \approx p(\mathbf{x}^*)\,V_K$:

$$V_K(\mathbf{x}^*) \simeq \frac{K_N}{N\,p(\mathbf{x}^*)}, \qquad K_N = \sqrt{N} \;\Rightarrow\; V_K(\mathbf{x}^*) \simeq \frac{1}{\sqrt{N}\,p(\mathbf{x}^*)} = \frac{V_1(\mathbf{x}^*)}{\sqrt{N}}$$

Stessa legge $V_1/\sqrt{N}$ della riga Parzen, ma $V_1(\mathbf{x}^*) = 1/p(\mathbf{x}^*)$ lo decidono i dati, diverso in ogni punto: piccolo dove la densità è alta. È la spiegazione quantitativa di «adaptive to local density variations».`,
  },
  {
    id: 'fc-tre-condizioni',
    kind: 'formula',
    q: md`Quali sono le condizioni generali di convergenza della successione di stime $\hat{p}_N(\mathbf{x}) = \frac{K_N/N}{V_N}$?`,
    a: md`$$\lim_{N\to+\infty} V_N = 0, \qquad \lim_{N\to+\infty} K_N = +\infty, \qquad \lim_{N\to+\infty} \frac{K_N}{N} = 0$$

- $V_N \to 0$: la media spaziale diventa il valore puntuale (bias nullo);
- $K_N \to \infty$: la frequenza relativa converge alla probabilità (varianza nulla);
- $K_N/N \to 0$: permette alle prime due di convivere.

Parzen sceglie la legge di $V_N$ (es. $1/\sqrt{N}$, con $N V_N \to \infty$); il K-NN sceglie quella di $K_N$ (es. $\sqrt{N}$) e il volume segue. Valgono con campioni i.i.d. e $p$ continua nel punto, come convergenza in probabilità, e non dicono nulla sul comportamento a $N$ finito.`,
  },
  {
    id: 'fc-terza-condizione',
    kind: 'intuizione',
    q: md`Perché la slide 47 dà solo due condizioni su $K_N$ se le condizioni generali sono tre?`,
    a: md`La stima è il rapporto $(K_N/N)/V_N$ e deve tendere a un valore finito $p(\mathbf{x})$: se $V_N \to 0$, anche $K_N/N$ deve tendere a zero, altrimenti il rapporto diverge. La terza condizione è una conseguenza obbligata della prima. Letta dal lato K-NN: se $K_N/N \to 0$, nei punti con $p(\mathbf{x}) > 0$ il volume $V_N \approx K_N/(N\,p(\mathbf{x}))$ tende a zero da solo. Lo stesso vale per le due condizioni su $h_N$ di Parzen.`,
  },
  {
    id: 'fc-cella-aleatoria-beta',
    kind: 'formula',
    q: md`Nel K-NN che cosa è aleatorio, e che legge segue il contenuto di probabilità della cella?`,
    a: md`$K$ è un numero fissato; la cella è costruita sui campioni, quindi sono aleatori il volume $V_K(\mathbf{x}^*)$ e il contenuto di probabilità $P_K$. Con campioni i.i.d. e pdf continua, qualunque siano $p$, $\mathbf{x}^*$, $n$ e la forma della cella:

$$P_K = \int_{R_K(\mathbf{x}^*)} p(\mathbf{x})\,d\mathbf{x} \;\sim\; \mathrm{Beta}(K,\; N-K+1)$$

$$E\{P_K\} = \frac{K}{N+1} \simeq \frac{K}{N}, \qquad \frac{\sqrt{\mathrm{var}\{P_K\}}}{E\{P_K\}} = \sqrt{\frac{N-K+1}{K\,(N+2)}} \simeq \frac{1}{\sqrt{K}}$$

È la giustificazione rigorosa, per il K-NN, di «$K/N$ stima $P_R$»: la dispersione si annulla solo se $K_N \to \infty$, il contenuto medio tende a zero solo se $K_N/N \to 0$. Passaggi nella dimostrazione [«versione esatta per il K-NN»](#derivation:der09).`,
  },
  {
    id: 'fc-bias-knn',
    kind: 'formula',
    q: md`Quanto sono distorta e dispersa la stima K-NN? Dai qualche numero.`,
    a: md`Con cella piccola, $\hat{p}(\mathbf{x}^*) \simeq p(\mathbf{x}^*)\,\frac{K/N}{P_K}$, da cui

$$E\{\hat{p}(\mathbf{x}^*)\} \simeq \frac{K}{K-1}\,p(\mathbf{x}^*) \quad (K \ge 2), \qquad \frac{\mathrm{var}\{\hat{p}(\mathbf{x}^*)\}}{E\{\hat{p}(\mathbf{x}^*)\}^2} \simeq \frac{N-K+1}{N\,(K-2)} \simeq \frac{1}{K} \quad (K \ge 3)$$

La stima è distorta verso l'alto (valore atteso infinito per $K = 1$). $K = 5$ fisso: +25% di bias e una dispersione che non cala aggiungendo dati (circa 58% per $N$ grande). $K = \sqrt{N}$ con $N = 10\,000$: +1% e circa 10%. Figura di slide p50: $N = 16$, $K = 4$ dà +33% e 64%; $N = 256$, $K = 16$ dà +6.7% e 26%.`,
  },
  {
    id: 'fc-casi-limite-regione',
    kind: 'proprieta',
    q: md`Casi limite della formula $K/(NV)$ a regione fissata: $V \to 0$ a $N$ fisso, $N \to \infty$ a $V$ fisso, $R$ uguale a tutto lo spazio.`,
    a: md`- **$N$ fisso, $V \to 0$**: se $\mathbf{x}^*$ non coincide con un campione, $K = 0$ e la stima vale 0; se coincide, $K \ge 1$ e la stima diverge. Inutilizzabile in entrambi i casi.
- **$V$ fisso, $N \to \infty$**: $K/N \to P_R$, quindi la stima tende a $P_R/V = \frac{1}{V}\int_R p(\mathbf{x})\,d\mathbf{x}$, la media spaziale, e non a $p(\mathbf{x}^*)$: la varianza si annulla ma il bias resta.
- **$R$ = tutto lo spazio**: $K = N$, $P_R = 1$ e la stima vale $1/V$, piatta.

Conclusione: $V$ deve dipendere da $N$.`,
  },
  {
    id: 'fc-casi-limite-knn',
    kind: 'proprieta',
    q: md`Casi limite della stima K-NN a $N$ fissato: $K = 1$ e $K = N$.`,
    a: md`$$K = 1\ (1\text{-D}): \ \hat{p}(x) = \frac{1}{2N\,r_1(x)}, \qquad K = N\ (1\text{-D}): \ \hat{p}(x) = \frac{1}{2\,\max\{x - x_{(1)},\; x_{(N)} - x\}} \;\le\; \frac{1}{x_{(N)} - x_{(1)}}$$

- $K = 1$: diverge su ogni campione, valore atteso infinito, area infinita: *overfitting* estremo (prima riga della figura di slide p50).
- $K = N$: un'unica cuspide nel punto medio tra minimo e massimo, alta $1/(x_{(N)} - x_{(1)})$, con code $1/(2\vert x\vert)$: *oversmoothing* estremo.

Il $K$ utile sta tra i due estremi e al crescere di $N$ si allontana da entrambi: $K_N \to \infty$ (via da 1) e $K_N/N \to 0$ (via da $N$).`,
  },

  // --- per l'orale ---
  {
    id: 'fc-orale-knn-completo',
    kind: 'procedura',
    q: md`Domanda d'orale: «K-NN estimation, how does it work». Quali punti tocchi, in ordine?`,
    a: md`1. Formula madre $K/(NV)$, da $P_R \approx p(\mathbf{x}^*)V$ e $\hat{P}_R = K/N$.
2. Ipotesi K-NN: $K$ fissato a priori, forma della cella (ipersfera).
3. Metodologia: espando la cella fino a $K$ campioni, misuro $V_K(\mathbf{x}^*)$, calcolo $\hat{p} = K/(N V_K(\mathbf{x}^*))$.
4. Consistenza: $K_N \to \infty$ e $K_N/N \to 0$, esempio $K = \sqrt{N}$.
5. Scelta di $K$: piccolo dà *overfit* (stima frastagliata), grande dà *oversmooth* (stima piatta).
6. Disegno 1-D: cuspidi sopra i gruppi fitti, angoli nei punti medi, code lente.
7. Differenze con Parzen e, se chiesto, il classificatore a voto di maggioranza.`,
  },
]
