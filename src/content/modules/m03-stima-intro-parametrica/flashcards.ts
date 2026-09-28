// Flashcard del modulo m03 (stima statistica: introduzione, stima di pdf, stima parametrica e verosimiglianza).
// Formule, definizioni, confronti, intuizioni e procedure, nell'ordine delle fonti (part1 p12-19, ch2 p1-11).
import { md } from '../../types'
import type { Flashcard } from '../../types'

export const flashcards: Flashcard[] = [
  // --- overfitting, ultimo stadio dell'esempio del pesce ---
  {
    id: 'fc-overfitting',
    kind: 'definizione',
    q: md`Che cos'è l'overfitting e da quale figura lo introducono le note?`,
    a: md`Nel piano (Lightness, Width) una curva rossa molto tortuosa separa salmoni e spigole: ogni campione di training cade dalla parte giusta. Un modello così flessibile (*highly flexible model*) migliora il fit sul training ma rischia l'**overfitting**: impara "troppo bene" i dati di training, compreso il rumore nelle feature e nelle etichette (*labels*), che possono contenere errori umani (*human error*). Il classificatore memorizza i campioni (*memorize the training samples*) e generalizza male sui dati nuovi (*new, unseen data*).`,
  },
  {
    id: 'fc-compromesso-complessita',
    kind: 'intuizione',
    q: md`Con quale compromesso chiudono le note il discorso sull'overfitting?`,
    a: md`Il classificatore non va adattato troppo (*excessively tune*) ai campioni di training: solo così classifica bene pattern nuovi (*novel patterns or samples*). Serve un compromesso tra complessità del modello e capacità di generalizzazione (*compromise between model complexity and generalization capability*). Si parte da modelli semplici, più robusti, e si aggiunge complessità (più feature, un classificatore non lineare) solo se non bastano.`,
  },
  // --- l'esempio PAM delle note ---
  {
    id: 'fc-pam-sistema-ideale',
    kind: 'procedura',
    q: md`Descrivi il sistema di telecomunicazione con cui le note aprono la teoria della stima.`,
    a: md`Una sorgente discreta emette tre simboli: Yes, No, Maybe. Tra sorgente e ricevitore c'è il canale di comunicazione (*communication channel*). Al trasmettitore un dispositivo PAM (*Pulse Amplitude Modulation*) mappa ogni simbolo in un impulso rettangolare (*rectangular pulse*) di durata $T$; l'ampiezza porta l'informazione:

$$\text{Yes}\mapsto 0.25,\qquad \text{Maybe}\mapsto 0.5,\qquad \text{No}\mapsto 0.75$$

Al ricevitore un campionatore (*sampler*) preleva un valore da ogni impulso e un classificatore decide il simbolo.`,
  },
  {
    id: 'fc-pam-campionatore',
    kind: 'formula',
    q: md`A quali istanti campiona il ricevitore PAM e con quale regola decide nel caso ideale?`,
    a: md`Le note scrivono "every x.5T": si legge $t_j = (j + 0.5)\,T$ con $j = 0, 1, 2, \dots$, cioè al centro di ogni impulso. Senza rumore la regola è immediata (*straightforward*):

$$\hat{s}(Y_s)=\begin{cases}\text{Yes} & Y_s = 0.25\\ \text{Maybe} & Y_s = 0.5\\ \text{No} & Y_s = 0.75\end{cases}$$`,
  },
  {
    id: 'fc-ys-discreta',
    kind: 'proprieta',
    q: md`Nel sistema ideale, che variabile è $Y_s$? Quanto valgono il prior e le probabilità condizionate?`,
    a: md`$Y_s$ è una variabile aleatoria discreta con tre valori (0.25, 0.5, 0.75). Con simboli equiprobabili la probabilità a priori (*prior probability*) di ogni valore è $1/3$. La probabilità condizionata (*conditional probability*) $P(Y_s \mid \text{Yes})$ vale 1 per $Y_s = 0.25$ e 0 altrimenti; lo stesso vale per gli altri simboli. Le condizionate sono impulsi: nel caso ideale non c'è incertezza da modellare, e per la probabilità totale $P(Y_s = 0.25) = P(\text{Yes})$.`,
  },
  {
    id: 'fc-rumore-additivo',
    kind: 'formula',
    q: md`Quale modello di canale usano le note per il sistema reale, e che cosa smette di funzionare?`,
    a: md`$$y = x + n,\qquad n \sim \mathcal{N}(0, \sigma_n^2)$$

Il rumore di canale (*channel noise*) è gaussiano additivo (*additive Gaussian noise*). Le note non danno media e varianza; la media nulla si deduce dal fatto che $p(y \mid \text{Yes})$ è centrata in 0.25. I valori ricevuti si scostano (*deviate*) da 0.25, 0.5 e 0.75, quindi il classificatore a valori esatti non funziona più.

Attenzione: qui $n$ è il rumore; dalla slide 7 in poi $n$ è il numero di feature.`,
  },
  {
    id: 'fc-discreta-piu-continua',
    kind: 'proprieta',
    q: md`$x$ è discreta e $n$ è gaussiana. Che cosa si può dire di $y = x + n$?`,
    a: md`$y$ è continua, quindi ha una densità di probabilità (*probability density function*, PDF). $x$ ha invece una distribuzione di probabilità (*probability distribution*): tre masse di $1/3$ concentrate su 0.25, 0.5 e 0.75. Una variabile discreta più una continua indipendente dà una variabile continua.`,
  },
  {
    id: 'fc-convoluzione',
    kind: 'formula',
    q: md`Come si ottiene la densità del segnale ricevuto $y$ nel canale PAM rumoroso?`,
    a: md`$x$ e $n$ sono indipendenti, quindi la densità di $y$ è la convoluzione (*convolution*) della distribuzione di $x$ con la densità di $n$:

$$P_y = P_x * P_n$$

Tre impulsi di massa $1/3$ convoluti con una campana danno tre copie della campana, una per livello:

$$p_y(y) = \frac{1}{3}\sum_{i=1}^{3} p_n(y - a_i),\qquad a_i \in \{0.25,\ 0.5,\ 0.75\}$$

Il risultato è una mistura di tre gaussiane.`,
  },
  {
    id: 'fc-condizionata-yes',
    kind: 'formula',
    q: md`Scrivi la densità condizionata del segnale ricevuto dato che è stato trasmesso Yes.`,
    a: md`$$p(y \mid \text{Yes}) = \frac{1}{\sqrt{2\pi}\,\sigma_n}\exp\!\left(-\frac{(y - 0.25)^2}{2\sigma_n^2}\right)$$

Una gaussiana centrata in 0.25 con larghezza (*spread*) fissata dal rumore. $p(y \mid \text{Maybe})$ e $p(y \mid \text{No})$ sono la stessa campana centrata in 0.5 e in 0.75.`,
  },
  {
    id: 'fc-soglie-decisione',
    kind: 'procedura',
    q: md`Come si classifica il segnale ricevuto nel canale rumoroso?`,
    a: md`Con un modello a soglie (*threshold-based model*): le soglie di decisione (*decision thresholds*) tengono conto del rumore e assegnano $y$ al simbolo più verosimile:

$$\hat{s}(y) = \arg\max_{s \in \{\text{Yes},\,\text{Maybe},\,\text{No}\}} p(y \mid s)$$

Con prior uguali e stessa $\sigma_n$ due campane vicine si incrociano a metà strada: Yes se $y < 0.375$, Maybe se $0.375 \le y < 0.625$, No se $y \ge 0.625$. Le note non danno i valori: seguono dalle ipotesi dell'esempio.`,
  },
  {
    id: 'fc-soglia-con-prior',
    kind: 'formula',
    q: md`Con prior diversi, dove cade la soglia tra due livelli PAM adiacenti $a_1 < a_2$?`,
    a: md`Si pesa ogni verosimiglianza con il suo prior e si uguagliano le due gaussiane pesate:

$$t_{12} = \frac{a_1 + a_2}{2} + \frac{\sigma_n^2}{a_2 - a_1}\,\ln\frac{P_1}{P_2}$$

La soglia si sposta verso il simbolo meno probabile e allarga la regione di quello più probabile. Con $P_1 = P_2$, oppure con $\sigma_n \to 0$, torna a metà strada. Le note non riportano la formula: risponde alla domanda d'esame su come i prior spostano la soglia rispetto al criterio ML.`,
  },
  {
    id: 'fc-probabilita-errore-pam',
    kind: 'formula',
    q: md`Prior uguali, soglie a metà strada: quanto vale la probabilità d'errore del canale PAM?`,
    a: md`Ogni livello dista $0.125$ dalla soglia più vicina. Yes e No sbagliano da un lato solo, Maybe da entrambi:

$$P_e = \frac{1}{3}\left[Q\!\left(\frac{0.125}{\sigma_n}\right) + 2\,Q\!\left(\frac{0.125}{\sigma_n}\right) + Q\!\left(\frac{0.125}{\sigma_n}\right)\right] = \frac{4}{3}\,Q\!\left(\frac{0.125}{\sigma_n}\right)$$

$Q$ è la coda destra della gaussiana standard. Con $\sigma_n = 0.05$ si ha $P_e \approx 0.83$ per cento, con $\sigma_n = 0.1$ circa il 14.1 per cento; per $\sigma_n \to +\infty$ tende a $2/3$. Calcolo aggiunto: le note non lo riportano.`,
  },
  // --- perché serve la stima statistica ---
  {
    id: 'fc-perche-stima',
    kind: 'intuizione',
    q: md`Perché la slide 2 dice che la stima statistica è "rather important"?`,
    a: md`Perché può intervenire in diverse parti di un sistema basato sul machine learning (*may intervene in different parts of a system*). Le note aggiungono che è fondamentale per l'addestramento del modello (*model training*), l'inferenza (*inference*) e la valutazione delle prestazioni (*performance evaluation*): aiuta a dare senso ai dati e ai pattern sottostanti. L'esempio PAM lo mostra: per piazzare le soglie servono le densità condizionate.`,
  },
  {
    id: 'fc-obiettivo-capitolo-2',
    kind: 'definizione',
    q: md`Qual è l'obiettivo del Capitolo 2 e che cosa mostra la figura della slide 2?`,
    a: md`Studiare metodi e algoritmi per stimare la distribuzione statistica (*estimating the statistical distribution*) di un segnale stocastico a partire da un insieme di osservazioni disponibili (*samples*). Una buona stima fa capire meglio i dati e migliora i modelli di ML. La figura mostra $p(\mathbf{x})$ con $\mathbf{x} = (x_1, x_2)$: superfici a campana sopra il piano delle feature, di forma e altezza diverse e in parte sovrapposte. La distribuzione da stimare è una funzione sullo spazio delle feature.`,
  },
  {
    id: 'fc-mappa-capitolo-2',
    kind: 'definizione',
    q: md`Quali sono, in ordine, gli argomenti del Capitolo 2 (Statistical Estimation Theory)?`,
    a: md`1. Introduction
2. PDF Estimation
3. Maximum Likelihood Estimation
4. Bayesian Estimation
5. K-NN Estimation
6. Parzen Windows Estimation
7. Expectation-Maximization Algorithm

Prima il problema (stimare la pdf), poi i metodi parametrici (ML, Bayes), poi i non parametrici (K-NN, Parzen), infine i dati incompleti (EM).`,
  },
  {
    id: 'fc-tre-blocchi-stima',
    kind: 'definizione',
    q: md`Nello schema a blocchi della slide 3, dove "can be necessary" la stima statistica e a che cosa serve in ciascun blocco?`,
    a: md`Le manine rosse indicano tre blocchi su sette (Physical World, Acquisition, Pre-processing, Feature Extraction, Recognition, Post-recognition, Decision):
- **Pre-processing**: normalizzazione dei dati (*data normalization*), riduzione del rumore (*noise reduction*), gestione dei valori mancanti (*handling missing values*).
- **Feature Extraction**: ricavare feature significative analizzando le proprietà statistiche dei dati grezzi, per una rappresentazione compatta e informativa (*compact and informative representation*).
- **Recognition**: identificare pattern, apprendere distribuzioni di probabilità (*learning probability distributions*), migliorare le decisioni.

Nessuna manina su Acquisition, Post-recognition e Decision.`,
  },
  {
    id: 'fc-stima-nel-preprocessing',
    kind: 'intuizione',
    q: md`Dove si nasconde una stima nei compiti di pre-processing?`,
    a: md`Normalizzare una feature a media nulla e varianza unitaria richiede di stimare dai campioni media e deviazione standard. Sostituire un valore mancante richiede una stima della distribuzione di quella feature. Attenuare il rumore richiede una stima della sua varianza. Gli esempi non sono nelle note, ma mostrano perché la slide 3 mette una manina sul pre-processing.`,
  },
  {
    id: 'fc-pipeline-decisione',
    kind: 'procedura',
    q: md`Descrivi la pipeline di un sistema di decisione statistico della slide 4.`,
    a: md`- **Information Source**: osservazioni o misure del mondo reale (letture di sensori, immagini, testo).
- **Observation Space**: il dominio, l'insieme di tutte le osservazioni possibili; sono dati grezzi, eventualmente rumorosi (*possibly noisy*).
- **Statistical Modeling & Estimation**: metodi statistici modellano pattern e distribuzioni dello spazio delle osservazioni. Il progettista sceglie l'approccio parametrico o non parametrico (*Parametric/Nonparametric*); la freccia rossa curva lega il modello allo spazio delle osservazioni.
- **Output**: Classification, Detection, Prediction.`,
  },
  {
    id: 'fc-tre-uscite',
    kind: 'definizione',
    q: md`Quali uscite ha il sistema della slide 4 e che cosa fa ciascuna?`,
    a: md`- **Classification**: assegna i dati a una tra più categorie predefinite.
- **Detection** (rivelazione): identifica la presenza o l'assenza di pattern o segnali specifici nei dati.
- **Prediction**: prevede esiti futuri in base al modello appreso.

Sono i risultati della modellazione statistica.`,
  },
  // --- le tre categorie di segnali stocastici ---
  {
    id: 'fc-tre-categorie-segnali',
    kind: 'confronto',
    q: md`Quali sono le tre categorie di segnali stocastici della teoria della stima, e qual è il criterio che le separa?`,
    a: md`Il criterio è quanto si conosce della sorgente di informazione:
- **Noisy deterministic signals**: sorgente completamente nota (*completely known*); il rumore interviene in trasmissione e/o acquisizione.
- **Noisy parametric signals**: sorgente solo parzialmente nota (*partially known*); le osservazioni servono a stimare i parametri aleatori (*random parameters*) che controllano il segnale.
- **Noisy random signals**: segnale completamente ignoto (*completely unknown*); la stima si basa del tutto sulle osservazioni.

Il rumore è presente in tutti e tre i casi.`,
  },
  {
    id: 'fc-esempi-categorie',
    kind: 'confronto',
    q: md`Quale esempio applicativo dà la slide 5 per ciascuna categoria di segnali?`,
    a: md`- Deterministici rumorosi: trasmissione di segnali nei sistemi di telecomunicazione basati su PAM. Il segnale è deterministico ma subisce rumore additivo.
- Parametrici rumorosi: stima della velocità di un bersaglio nei sistemi sonar (*target speed velocity estimation*). La struttura del segnale è nota, la velocità va inferita da osservazioni rumorose.
- Aleatori rumorosi: rivelazione di oggetti sepolti con il georadar (*ground penetrating radar*). Segnale e rumore sono entrambi aleatori e solo i dati guidano la stima.`,
  },
  {
    id: 'fc-focus-del-corso',
    kind: 'intuizione',
    q: md`Su quali categorie di segnali si concentra il seguito del capitolo, e quale problema affronta?`,
    a: md`Sulla seconda e sulla terza (segnali parametrici e aleatori rumorosi), le più comuni nelle applicazioni reali. Il problema è la stima della funzione densità di probabilità (pdf), importante «as we have understood before»: la slide non dice a che cosa rimandi, negli appunti il discorso che precede è l'esempio PAM, dove per decidere servono le densità. Il motivo della scelta dato dalla fonte è solo che sono le categorie più comuni; che con una sorgente completamente nota non resti una densità da stimare è una lettura in più, non detta dalla slide.`,
  },
  {
    id: 'fc-ml-statistico-vs-non',
    kind: 'confronto',
    q: md`Machine learning statistico contro non statistico: che ruolo ha la pdf?`,
    a: md`- **Statistical Machine Learning**: si basa sui metodi statistici; la pdf ha un ruolo chiave per modellare e prevedere a partire dalle distribuzioni dei dati. Stimarla permette di inferire pattern e relazioni.
- **Non-Statistical Machine Learning**: approcci come certi tipi di deep learning, che possono non richiedere esplicitamente la pdf e imparano pattern in modo guidato dai dati (*data-driven*), senza assumere un modello probabilistico.

Per il ML statistico una stima accurata della pdf è essenziale per prestazioni e affidabilità.`,
  },
  // --- il problema della stima di pdf ---
  {
    id: 'fc-impostazione-problema',
    kind: 'definizione',
    q: md`Come imposta la slide 7 il problema della stima di pdf?`,
    a: md`- $\mathbf{x} = (x_1, x_2, \dots, x_n)$: vettore di $n$ feature con pdf incognita (*unknown pdf*) $p(\mathbf{x})$.
- $\mathbf{X} = \{\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_N\}$: insieme finito di $N$ campioni indipendenti e identicamente distribuiti (iid) estratti da quella pdf, detti campioni di training (*training samples*).

Attenzione agli indici: $n$ minuscolo è il numero di feature, $N$ maiuscolo il numero di campioni.`,
  },
  {
    id: 'fc-iid',
    kind: 'definizione',
    q: md`Che cosa significa che i campioni di training sono iid?`,
    a: md`Indipendenti e identicamente distribuiti (*independent and identically distributed*):
- **indipendenti**: il valore di un campione non influenza gli altri;
- **identicamente distribuiti**: tutti seguono la stessa pdf, $\mathbf{x}_k \sim p(\mathbf{x})$ per $k = 1, \dots, N$.

È l'ipotesi che permette di scrivere la verosimiglianza come prodotto.`,
  },
  {
    id: 'fc-iid-raramente-vera',
    kind: 'intuizione',
    q: md`L'ipotesi iid è realistica? Perché la si usa?`,
    a: md`Le note ammettono che è raramente vera nei casi reali, per le dipendenze tra i dati (*dependencies between data points*). La si assume per semplificare il calcolo (*to simplify the computation*). Esempi di dati non iid: letture consecutive dello stesso sensore, pixel vicini di un'immagine telerilevata, battiti successivi di un ECG. È un'ipotesi di lavoro, non una proprietà garantita dei dati.`,
  },
  {
    id: 'fc-obiettivo-stima-pdf',
    kind: 'definizione',
    q: md`Qual è l'obiettivo della stima di pdf (riquadro verde della slide 7)?`,
    a: md`Determinare una stima (*estimate*) $\hat{p}(\mathbf{x})$ sulla base dei campioni disponibili $\mathbf{X}$ che sia il più vicina possibile (*as close as possible*) alla pdf vera $p(\mathbf{x})$:

$$\hat{p}(\mathbf{x}) \approx p(\mathbf{x})$$

Le note: stimare un modello di densità che rifletta la distribuzione sottostante dei dati. Il cappello indica una quantità stimata dai dati.`,
  },
  {
    id: 'fc-stima-funzione-dei-campioni',
    kind: 'proprieta',
    q: md`Da che cosa dipende la stima $\hat{p}(\mathbf{x})$, e come se ne giudica la qualità?`,
    a: md`$$\hat{p}(\mathbf{x}) = \hat{p}(\mathbf{x};\,\mathbf{X})$$

È costruita "on the basis of the available samples": cambiando l'insieme di training cambia la stima. La slide 7 non definisce una misura di vicinanza tra stima e pdf vera; la qualità si giudicherà con bias, varianza e consistenza.`,
  },
  {
    id: 'fc-usare-tutta-informazione',
    kind: 'intuizione',
    q: md`Quale principio statistico richiamano le note dopo l'obiettivo della stima?`,
    a: md`Massimizzare l'uso di tutta l'informazione disponibile (*maximize the use of all available information*). Anche con dati incompleti o imperfetti bisogna estrarne quanta più conoscenza possibile: i metodi statistici efficaci sfruttano al meglio i dati parziali, così nessuna informazione preziosa va sprecata, e permettono inferenze robuste anche con incertezza o dati mancanti. Anticipa la stima con dati incompleti e l'algoritmo EM.`,
  },
  // --- approcci alla stima di pdf ---
  {
    id: 'fc-albero-approcci',
    kind: 'definizione',
    q: md`Disegna a parole l'albero degli approcci alla stima di pdf della slide 8.`,
    a: md`Dalla radice *Approaches* partono due rami:
- **Parametric**: Gaussian, Gamma, Rayleigh.
- **Nonparametric**: K-Nearest Neighbors, Parzen Windows, Orthogonal Function Approximation.

Le note: "There are two primary approaches to PDF estimation".`,
  },
  {
    id: 'fc-approcci-parametrici',
    kind: 'definizione',
    q: md`Che cosa caratterizza gli approcci parametrici?`,
    a: md`La forma della distribuzione è nota (*the shape of the distribution is known*): ci si concentra solo sulla stima dei suoi parametri. Esempi: gaussiana, Gamma, Rayleigh. Corrisponde ai segnali parametrici rumorosi, con sorgente parzialmente nota: si conosce il modello, non i suoi parametri.`,
  },
  {
    id: 'fc-tre-modelli-parametrici',
    kind: 'confronto',
    q: md`Gaussiana, Gamma, Rayleigh: come le descrivono le note?`,
    a: md`- **Gaussiana** (*Gaussian*): caratterizzata da media e varianza (*mean and variance*), molto usata in statistica e nel ML; in 1-D $\boldsymbol{\theta} = (\mu, \sigma^2)$, quindi $r = 2$.
- **Gamma**: famiglia flessibile, usata nei modelli di code (*queuing models*) e nell'analisi di affidabilità (*reliability analysis*). È definita per valori positivi ed è asimmetrica: adatta a tempi di attesa e durate.
- **Rayleigh**: modella il modulo (*magnitude*) di un vettore nel piano, tipica dell'elaborazione dei segnali (*signal processing*). Caso classico: ampiezza di un segnale con due componenti gaussiane indipendenti a media nulla e stessa varianza.`,
  },
  {
    id: 'fc-approcci-non-parametrici',
    kind: 'definizione',
    q: md`Che cosa caratterizza gli approcci non parametrici?`,
    a: md`Non assumono una forma specifica per la densità (*do not assume a specific shape for the density*): si affidano ai dati disponibili per inferire la distribuzione. Tecniche: K-Nearest Neighbors, Parzen Windows, Orthogonal Function Approximation. Corrisponde ai segnali aleatori rumorosi, con sorgente completamente ignota.`,
  },
  {
    id: 'fc-tre-non-parametrici',
    kind: 'confronto',
    q: md`K-NN, finestre di Parzen, funzioni ortogonali: come li presentano le note?`,
    a: md`- **K-Nearest Neighbors**: algoritmo semplice ed efficace che stima la densità in base alla prossimità dei punti (*proximity of data points*) nello spazio delle feature.
- **Parzen Windows**: usa una funzione finestra (*windowing function*) per lisciare (*smooth*) i contributi dei punti e ottenere la stima della pdf.
- **Orthogonal Function Approximation**: approssima la densità con funzioni ortogonali, senza imporre una forma predeterminata. Nel corso compare solo qui.`,
  },
  {
    id: 'fc-parametrico-vs-non-parametrico',
    kind: 'confronto',
    q: md`Parametrico o non parametrico: qual è il discrimine e quando conviene ciascuno?`,
    a: md`Il discrimine è la conoscenza della forma della densità.

$$\underbrace{p(\mathbf{x}\mid\boldsymbol{\theta}),\ \ \boldsymbol{\theta} = (\theta_1, \dots, \theta_r)\ \text{incognito}}_{\text{forma nota: parametrico}} \qquad\text{contro}\qquad \underbrace{p(\mathbf{x})\ \text{incognita per intero}}_{\text{forma ignota: non parametrico}}$$

Con la forma giusta il parametrico stima pochi numeri e gli bastano meno dati. Senza un modello affidabile della forma si usa il non parametrico: più flessibile, ma chiede più campioni. Le note: ciascun metodo ha i suoi vantaggi e la sua applicabilità, secondo i dati e i requisiti dell'analisi.`,
  },
  {
    id: 'fc-quanto-sai-della-sorgente',
    kind: 'confronto',
    q: md`Come si passa dalle categorie di segnali della slide 5 agli approcci della slide 8?`,
    a: md`- Sorgente parzialmente nota (segnali parametrici): la struttura è nota, restano da stimare i parametri, cioè un vettore $\boldsymbol{\theta}$ di $r$ numeri. Approccio **parametrico**.
- Segnale completamente ignoto (segnali aleatori): la stima si basa solo sulle osservazioni, resta da stimare un'intera funzione. Approccio **non parametrico**.
- Sorgente completamente nota: nessuna densità da stimare, solo decisioni in presenza di rumore.

Nella slide 4 questa scelta è l'etichetta Parametric/Nonparametric che il progettista porta nel blocco di modellazione.`,
  },
  // --- stima parametrica e verosimiglianza ---
  {
    id: 'fc-vettore-parametri',
    kind: 'definizione',
    q: md`Che cos'è il vettore dei parametri nella stima parametrica?`,
    a: md`Si assume che il modello di $p(\mathbf{x})$ sia caratterizzato da $r$ parametri (*parameters*), che formano il vettore

$$\boldsymbol{\theta} = (\theta_1, \theta_2, \dots, \theta_r)$$

Per una gaussiana monodimensionale $r = 2$ (media e varianza). Stimare la pdf diventa stimare un punto nello spazio $r$-dimensionale dei parametri.`,
  },
  {
    id: 'fc-notazione-condizionata',
    kind: 'definizione',
    q: md`Che cosa sottolinea la notazione $p(\mathbf{x}\mid\boldsymbol{\theta})$?`,
    a: md`La dipendenza del modello dai parametri: è la pdf di $\mathbf{x}$ quando i parametri valgono $\boldsymbol{\theta}$. Al variare di $\boldsymbol{\theta}$ si ottiene una famiglia di pdf, tutte della stessa forma.`,
  },
  {
    id: 'fc-funzione-verosimiglianza',
    kind: 'formula',
    q: md`Scrivi la funzione di verosimiglianza (slide 9).`,
    a: md`$$p(\mathbf{X}\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})$$

$\mathbf{X} = \{\mathbf{x}_1, \dots, \mathbf{x}_N\}$ è un vettore di variabili aleatorie (*random variables*) iid; la funzione di verosimiglianza (*likelihood function*) è il prodotto delle densità dei singoli campioni. Melgani la chiede all'orale: "What is the formula of Maximum Likelihood".`,
  },
  {
    id: 'fc-perche-il-prodotto',
    kind: 'proprieta',
    q: md`Perché la verosimiglianza si può scrivere come prodotto delle densità dei singoli campioni?`,
    a: md`$$p(\mathbf{X}\mid\boldsymbol{\theta}) = p(\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_N\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})$$

1. $p(\mathbf{X}\mid\boldsymbol{\theta})$ è la densità congiunta degli $N$ campioni.
2. **Indipendenza**: la congiunta si fattorizza nel prodotto delle marginali $p_1(\mathbf{x}_1\mid\boldsymbol{\theta})\cdots p_N(\mathbf{x}_N\mid\boldsymbol{\theta})$.
3. **Identica distribuzione**: ogni fattore è la stessa funzione $p(\cdot\mid\boldsymbol{\theta})$, valutata nel suo $\mathbf{x}_k$.

Le note: "Since the samples are independent, the overall probability can be expressed as the product".`,
  },
  {
    id: 'fc-campioni-dipendenti',
    kind: 'proprieta',
    q: md`Che cosa succede alla verosimiglianza se i campioni non sono indipendenti?`,
    a: md`La regola della catena lascia densità condizionate ai campioni precedenti:

$$p(\mathbf{x}_1, \mathbf{x}_2\mid\boldsymbol{\theta}) = p(\mathbf{x}_1\mid\boldsymbol{\theta})\,p(\mathbf{x}_2\mid\mathbf{x}_1, \boldsymbol{\theta}) \ne p(\mathbf{x}_1\mid\boldsymbol{\theta})\,p(\mathbf{x}_2\mid\boldsymbol{\theta})$$

Il prodotto delle marginali non è più la congiunta. L'indipendenza che serve è quella per $\boldsymbol{\theta}$ fissato.`,
  },
  {
    id: 'fc-significato-verosimiglianza',
    kind: 'definizione',
    q: md`Che cosa descrive la verosimiglianza?`,
    a: md`La verosimiglianza di $\boldsymbol{\theta}$ rispetto all'insieme di campioni $\mathbf{X}$: una misura di compatibilità/accordo (*measure of compatibility/agreement*) tra $\boldsymbol{\theta}$ e $\mathbf{X}$. Le note: dice quanto bene il modello scelto sa "spiegare" (*explain*) i campioni di training. Valore alto: con quei parametri i campioni osservati sono plausibili. Valore basso: i campioni cadono dove il modello mette poca densità.`,
  },
  {
    id: 'fc-parametri-piu-probabili',
    kind: 'intuizione',
    q: md`A che cosa serve analizzare la funzione di verosimiglianza?`,
    a: md`A capire quali parametri del modello hanno generato con maggiore probabilità i campioni osservati (*most likely to have generated the observed samples*). È un passo fondante dell'inferenza statistica (*foundational in statistical inference*) e porta a stimare i parametri che si adattano meglio ai dati (*best fit the data*): è il ponte verso la stima a massima verosimiglianza.`,
  },
  {
    id: 'fc-slide-10-pannello-superiore',
    kind: 'intuizione',
    q: md`Slide 10, pannello superiore: che cosa sono i pallini rossi e le quattro gaussiane tratteggiate?`,
    a: md`I pallini sono 12 campioni di training monodimensionali, tra circa 1.9 e 4.8, con media 3.13. Le gaussiane tratteggiate sono quattro delle infinite pdf candidate

$$p(x\mid\theta) = \frac{1}{\sqrt{2\pi}\,\sigma}\exp\!\left(-\frac{(x-\theta)^2}{2\sigma^2}\right)$$

con la stessa larghezza ($\sigma \approx 1$, nota) e media $\theta$ incognita pari a circa 2.5, 3, 3.5 e 5. La candidata centrata in 5 lascia quasi tutti i campioni nella coda: è poco compatibile con i dati.`,
  },
  {
    id: 'fc-slide-10-pannello-centrale',
    kind: 'intuizione',
    q: md`Slide 10, pannello centrale: com'è fatta $p(\mathbf{X}\mid\theta)$ in funzione di $\theta$?`,
    a: md`Ogni punto della curva è il prodotto delle 12 densità dei campioni calcolate con quel $\theta$. Ne esce una campana stretta, quasi nulla fuori da $[2, 4]$, con massimo circa $1.5\times 10^{-7}$ in $\hat{\theta} \approx 3.1$ (la media dei campioni). La larghezza è circa $\sigma/\sqrt{N} = 1/\sqrt{12} \approx 0.29$: con più campioni il picco si stringe.`,
  },
  {
    id: 'fc-log-verosimiglianza',
    kind: 'formula',
    q: md`Slide 10, pannello inferiore: che cos'è $l(\theta)$ e perché ha lo stesso massimo?`,
    a: md`La log-verosimiglianza (*log-likelihood*):

$$l(\theta) = \ln p(\mathbf{X}\mid\theta) = \sum_{k=1}^{N} \ln p(x_k\mid\theta)$$

$$\arg\max_{\theta}\, l(\theta) = \arg\max_{\theta}\, p(\mathbf{X}\mid\theta) = \hat{\theta}$$

Il logaritmo è monotono crescente, quindi non sposta il massimo. Trasforma il prodotto in somma e la campana strettissima in un arco parabolico leggibile, con massimo circa $-15.7$ in $\hat{\theta} \approx 3.1$. La slide usa $l(\theta)$ solo come etichetta dell'asse.`,
  },
  {
    id: 'fc-verosimiglianza-gaussiana',
    kind: 'formula',
    q: md`Scrivi $p(\mathbf{X}\mid\theta)$ e $l(\theta)$ per $N$ campioni gaussiani con varianza nota e media $\theta$ incognita.`,
    a: md`$$p(\mathbf{X}\mid\theta) = (2\pi\sigma^2)^{-N/2}\exp\!\left(-\frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k-\theta)^2\right)$$

$$l(\theta) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k-\theta)^2$$

Il prodotto di esponenziali diventa l'esponenziale della somma degli esponenti; il logaritmo lascia una costante meno una somma di quadrati.`,
  },
  {
    id: 'fc-parabola-e-campana',
    kind: 'procedura',
    q: md`Come si vede che, per la media gaussiana, $l(\theta)$ è una parabola con vertice nella media campionaria?`,
    a: md`Si completa il quadrato attorno a $\bar{x} = \frac{1}{N}\sum_k x_k$:

$$\sum_{k=1}^{N}(x_k-\theta)^2 = \sum_{k=1}^{N}(x_k-\bar{x})^2 + N(\theta-\bar{x})^2$$

$$l(\theta) = l(\bar{x}) - \frac{N}{2\sigma^2}(\theta-\bar{x})^2$$

Quindi $\hat{\theta} = \bar{x}$ e, esponenziando, $p(\mathbf{X}\mid\theta)$ è una campana in $\theta$ di varianza $\sigma^2/N$. Nella slide 10: $\bar{x} \approx 3.13$, larghezza $1/\sqrt{12} \approx 0.29$, curvatura $N/\sigma^2 = 12$.`,
  },
  {
    id: 'fc-due-letture',
    kind: 'confronto',
    q: md`Stessa espressione, due letture: che differenza c'è tra $p(x\mid\theta)$ come funzione di $x$ e $p(\mathbf{X}\mid\theta)$ come funzione di $\theta$?`,
    a: md`- Funzione di $x$ con $\theta$ fissato: è una pdf, con area unitaria, $\int p(x\mid\theta)\,dx = 1$ (pannello superiore).
- Funzione di $\theta$ con i campioni fissati: è la verosimiglianza (pannelli centrale e inferiore). Non è una densità in $\theta$: $\int p(\mathbf{X}\mid\theta)\,d\theta \ne 1$ in generale, e non è "la probabilità che $\theta$ sia vero".

Nella slide 10 l'area sotto la campana centrale vale circa $1.07\times 10^{-7}$.`,
  },
  {
    id: 'fc-ordini-di-grandezza',
    kind: 'intuizione',
    q: md`Perché nella slide 10 la verosimiglianza vale circa $10^{-7}$ con soli 12 campioni, e perché conviene il logaritmo?`,
    a: md`È un prodotto di $N$ densità, ciascuna di solito minore di 1, quindi cala in modo esponenziale con $N$. Con $\sigma = 1$ ogni fattore vale al più $1/\sqrt{2\pi} \approx 0.399$:

$$p(\mathbf{X}\mid\theta) \le (2\pi\sigma^2)^{-N/2} = e^{-11.03} \approx 1.6\times 10^{-5}\quad (N = 12)$$

Con centinaia di campioni il prodotto va in underflow numerico (con densità grandi, $\sigma$ piccola, in overflow). In logaritmo gli stessi valori stanno tra $-15$ e $-100$: $\ln(1.5\times 10^{-7}) \approx -15.7$.`,
  },
  // --- le due procedure di stima dei parametri ---
  {
    id: 'fc-due-procedure',
    kind: 'confronto',
    q: md`Quali sono le due procedure principali di stima del vettore dei parametri (slide 11)?`,
    a: md`- **Maximum Likelihood Estimation** (MLE): $\boldsymbol{\theta}$ è un vettore di quantità fisse ma incognite (*fixed but unknown*); la stima migliore massimizza la probabilità di ottenere i campioni effettivamente osservati.
- **Bayesian Estimation** (BE): i parametri sono variabili aleatorie con una distribuzione a priori nota (*known prior distribution*); l'osservazione dei campioni la converte in una densità a posteriori (*posterior density*).

Entrambe partono dalla stessa verosimiglianza $p(\mathbf{X}\mid\boldsymbol{\theta})$.`,
  },
  {
    id: 'fc-mle-definizione',
    kind: 'definizione',
    q: md`Definisci la stima a massima verosimiglianza e scrivi la sua formula.`,
    a: md`Il vettore $\boldsymbol{\theta}$ è fisso ma incognito; la stima migliore è quella che massimizza la verosimiglianza dei campioni osservati:

$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}}\, p(\mathbf{X}\mid\boldsymbol{\theta})$$

$\arg\max$ restituisce il punto di massimo, non il valore massimo. Con dati continui "la probabilità di ottenere i campioni" va letta sulla densità: la probabilità di cadere in celle piccole di volume $\Delta$ attorno ai campioni vale circa $p(\mathbf{X}\mid\boldsymbol{\theta})\,\Delta^N$, e $\Delta^N$ non dipende da $\boldsymbol{\theta}$.`,
  },
  {
    id: 'fc-stima-bayesiana',
    kind: 'definizione',
    q: md`Come funziona la stima bayesiana?`,
    a: md`I parametri sono variabili aleatorie con un prior noto $p(\boldsymbol{\theta})$. Quando si osservano i campioni, il teorema di Bayes aggiorna il prior e produce la densità a posteriori:

$$p(\boldsymbol{\theta}\mid\mathbf{X}) = \frac{p(\mathbf{X}\mid\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\int p(\mathbf{X}\mid\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,d\boldsymbol{\theta}}$$

Così si incorpora la conoscenza a priori (*prior knowledge or beliefs*) e la si combina con i dati per una stima più informata.`,
  },
  {
    id: 'fc-mle-be-natura-parametri',
    kind: 'confronto',
    q: md`Differenza MLE/BE numero 1: la natura dei parametri.`,
    a: md`- MLE: $\boldsymbol{\theta}$ è una costante da stimare.
- BE: $\boldsymbol{\theta}$ è una variabile aleatoria, che riflette l'incertezza e integra la conoscenza a priori nella stima.`,
  },
  {
    id: 'fc-mle-be-obiettivo',
    kind: 'confronto',
    q: md`Differenza MLE/BE numero 2: l'obiettivo.`,
    a: md`- MLE: ottimizza una funzione costo o funzione obiettivo basata solo sui dati osservati (*based solely on the observed data*) e trova i parametri che massimizzano la verosimiglianza.
- BE: combina i campioni di training con il prior e produce una densità a posteriori, cioè una descrizione probabilistica completa dell'incertezza sul parametro (*complete probabilistic description of the parameter's uncertainty*).

Le note: capire i due approcci permette di scegliere il metodo adatto al problema e ai dati disponibili.`,
  },
  {
    id: 'fc-ml-bayes-coincidono',
    kind: 'proprieta',
    q: md`In quali casi ML e Bayes danno la stessa soluzione (slide 40, anticipata qui)?`,
    a: md`"ML and Bayes solutions are equivalent": nel limite di infiniti campioni di training (*infinite training samples*) oppure se il prior $p(\boldsymbol{\theta})$ è uniforme. Il motivo:

$$p(\boldsymbol{\theta}\mid\mathbf{X}) \propto p(\mathbf{X}\mid\boldsymbol{\theta})\,p(\boldsymbol{\theta})$$

- prior costante: il posterior ha la forma della verosimiglianza e quindi lo stesso massimo, $\hat{\boldsymbol{\theta}}_{ML}$;
- $N \to \infty$: la verosimiglianza diventa un picco strettissimo (larghezza $\sigma/\sqrt{N}$ nella slide 10) e domina qualunque prior non nullo attorno al valore vero.

In pratica si preferisce spesso ML: minore complessità computazionale e interpretazione più semplice.`,
  },
  {
    id: 'fc-densita-bayesiana-vs-ml',
    kind: 'confronto',
    q: md`Con prior uniforme il massimo del posterior (MAP) coincide con la stima ML. Coincidono anche le densità stimate?`,
    a: md`No, per $N$ finito. Nell'esempio gaussiano con varianza nota e prior piatto ($\sigma_0\to+\infty$):

$$p(x\mid\mathbf{X}) = \mathcal{N}\!\left(\bar{x},\ \sigma^2\left(1+\frac{1}{N}\right)\right)\ \ne\ p(x\mid\hat{\theta}_{ML}) = \mathcal{N}(\bar{x},\ \sigma^2)$$

La densità bayesiana è più larga perché media il modello su tutti i $\theta$ pesati dal posterior e porta con sé l'incertezza su $\theta$. Le due densità coincidono solo per $N \to \infty$.`,
  },
  {
    id: 'fc-posterior-gaussiano',
    kind: 'formula',
    q: md`Media gaussiana con varianza nota $\sigma^2$ e prior $\mathcal{N}(\mu_0, \sigma_0^2)$: com'è il posterior?`,
    a: md`Il prodotto di due esponenziali di quadratiche in $\theta$ è ancora una gaussiana (si completa il quadrato):

$$p(\theta\mid\mathbf{X}) = \mathcal{N}(\mu_N, \sigma_N^2),\qquad \mu_N = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\,\bar{x} + \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\,\mu_0,\qquad \sigma_N^2 = \frac{\sigma_0^2\,\sigma^2}{N\sigma_0^2 + \sigma^2}$$

Per $N\to+\infty$: $\mu_N \to \bar{x} = \hat{\theta}_{ML}$ e $\sigma_N^2 \to 0$. Per $\sigma_0\to+\infty$ (prior piatto): $\mu_N \to \bar{x}$. Lo sviluppo completo è nel foglio sulla stima bayesiana.`,
  },
  // --- bontà della stima ---
  {
    id: 'fc-stima-vettore-aleatorio',
    kind: 'proprieta',
    q: md`Perché la stima $\hat{\boldsymbol{\theta}}$ è un vettore aleatorio?`,
    a: md`Perché dipende dal vettore delle osservazioni:

$$\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\mathbf{X})$$

Se cambia l'insieme di training cambia anche la stima. Ha quindi senso parlare della sua media e della sua varianza.`,
  },
  {
    id: 'fc-errore-di-stima',
    kind: 'formula',
    q: md`Come si definisce l'errore di stima?`,
    a: md`$$\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta} = \boldsymbol{\varepsilon}(\mathbf{X}, \boldsymbol{\theta}) = \left[\hat{\theta}_i - \theta_i \,:\, i = 1, 2, \dots, r\right]$$

Differenza tra valore stimato e valore vero. Dipende dai campioni e da $\boldsymbol{\theta}$, ed è un vettore con $r$ componenti, una per parametro.`,
  },
  {
    id: 'fc-stima-ideale',
    kind: 'definizione',
    q: md`Quali due criteri definiscono la stima ideale di ogni parametro $\theta_i$?`,
    a: md`Ogni errore $\varepsilon_i$ deve essere:
- **non polarizzato** (*unbiasedness*): $E\{\varepsilon_i\} = 0$;
- **senza varianza** (*no variance*): $\operatorname{var}\{\varepsilon_i\} = 0$.

In pratica è difficile ottenerli entrambi, ma sono i riferimenti fondamentali (*fundamental benchmarks*) per giudicare la bontà di un metodo di stima. Insieme equivalgono a errore quadratico medio nullo.`,
  },
  {
    id: 'fc-bias-non-polarizzato',
    kind: 'formula',
    q: md`Che cos'è il bias e quando uno stimatore è non polarizzato?`,
    a: md`Il bias (polarizzazione) di un errore di stima è il suo valore medio:

$$\text{bias} = E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}$$

Uno stimatore è non polarizzato (*unbiased*) se

$$E\{\boldsymbol{\varepsilon}\} = 0 \quad\Rightarrow\quad E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$$

In media produce il valore corretto. L'implicazione segue dalla linearità del valore atteso: $\boldsymbol{\theta}$ è una costante.`,
  },
  {
    id: 'fc-varianza-errore',
    kind: 'formula',
    q: md`Scrivi la varianza dell'errore di stima. Che cosa compare al posto di $\theta_i$?`,
    a: md`$$\operatorname{var}\{\varepsilon_i\} = E\left\{\left(\hat{\theta}_i - \overline{\hat{\theta}}_i\right)^2\right\},\qquad i = 1, 2, \dots, r$$

Compare $\overline{\hat{\theta}}_i = E\{\hat{\theta}_i\}$, il valor medio della stima (cappello con barra sopra). Infatti $\varepsilon_i - E\{\varepsilon_i\} = \hat{\theta}_i - E\{\hat{\theta}_i\}$: la varianza dell'errore coincide con la varianza della stima, perché $\theta_i$ è una costante. Misura la dispersione della stima attorno alla propria media.`,
  },
  {
    id: 'fc-errore-quadratico-medio',
    kind: 'proprieta',
    q: md`Come si scompone l'errore quadratico medio di una stima?`,
    a: md`$$E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + \left(E\{\varepsilon_i\}\right)^2$$

Varianza più bias al quadrato: si somma e si sottrae $E\{\varepsilon_i\}$ dentro il quadrato, e il doppio prodotto si annulla perché $E\{\varepsilon_i - E\{\varepsilon_i\}\} = 0$. Per questo la stima ideale chiede entrambe le condizioni: solo con bias nullo e varianza nulla l'errore quadratico medio è zero.`,
  },
  {
    id: 'fc-stimatore-costante',
    kind: 'intuizione',
    q: md`Perché non basta una varianza nulla per avere una buona stima?`,
    a: md`Lo stimatore costante $\hat{\theta} = c$ ignora i dati e ha $\operatorname{var}\{\varepsilon\} = 0$, ma $E\{\varepsilon\} = c - \theta \ne 0$ appena $c \ne \theta$. Ha varianza nulla ed è polarizzato. Per lo stesso motivo il bound di Cramér-Rao vale solo per stimatori non polarizzati: lo stimatore costante starebbe sotto qualunque bound.`,
  },
  {
    id: 'fc-cramer-rao',
    kind: 'formula',
    q: md`Enuncia il bound di Cramér-Rao.`,
    a: md`Per ogni stimatore non polarizzato (*unbiased*):

$$\operatorname{var}\{\varepsilon_i\} \ge \left[\mathbf{I}^{-1}(\boldsymbol{\theta})\right]_{ii},\qquad i = 1, 2, \dots, r$$

La varianza dell'errore sull'$i$-esimo parametro non scende sotto l'$i$-esimo elemento diagonale dell'inversa della matrice di informazione di Fisher. Serve a giudicare la bontà della varianza di una stima.`,
  },
  {
    id: 'fc-cramer-rao-ipotesi',
    kind: 'proprieta',
    q: md`Quali ipotesi servono al bound di Cramér-Rao, e come si comporta al crescere di $N$?`,
    a: md`- Stimatore non polarizzato.
- Modello regolare: supporto di $p(\mathbf{x}\mid\boldsymbol{\theta})$ indipendente da $\boldsymbol{\theta}$, derivabilità in $\boldsymbol{\theta}$, derivata e integrale scambiabili.

Con campioni iid $\mathbf{I}(\boldsymbol{\theta}) = N\,\mathbf{I}_1(\boldsymbol{\theta})$, quindi il bound cala come $1/N$. Poiché $[\mathbf{I}^{-1}]_{ii} \ge 1/[\mathbf{I}]_{ii}$, dover stimare anche gli altri parametri non abbassa il bound sul parametro $i$-esimo.`,
  },
  {
    id: 'fc-informazione-fisher',
    kind: 'formula',
    q: md`Scrivi la matrice di informazione di Fisher, in forma matriciale ed elemento per elemento.`,
    a: md`$$\mathbf{I}(\boldsymbol{\theta}) = E\left\{\nabla_{\boldsymbol{\theta}}\ln\left[p(\mathbf{X}\mid\boldsymbol{\theta})\right]\;\nabla_{\boldsymbol{\theta}}\ln\left[p(\mathbf{X}\mid\boldsymbol{\theta})\right]^{t}\right\}$$

$$\left[\mathbf{I}(\boldsymbol{\theta})\right]_{ij} = E\left\{\frac{\partial \ln\left[p(\mathbf{X}\mid\boldsymbol{\theta})\right]}{\partial\theta_i}\cdot\frac{\partial \ln\left[p(\mathbf{X}\mid\boldsymbol{\theta})\right]}{\partial\theta_j}\right\}$$

Gradiente (colonna) per gradiente trasposto: una matrice $r \times r$. Più la log-verosimiglianza è sensibile a $\boldsymbol{\theta}$, più informazione portano i dati e più basso è il bound.`,
  },
  {
    id: 'fc-fisher-media-gaussiana',
    kind: 'procedura',
    q: md`Calcola informazione di Fisher e bound di Cramér-Rao per la media di una gaussiana con varianza nota.`,
    a: md`1. Derivata della log-verosimiglianza: $\frac{\partial\ln p(\mathbf{X}\mid\theta)}{\partial\theta} = \frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k - \theta)$.
2. Valore atteso del quadrato: i termini incrociati hanno media nulla per l'indipendenza, restano $N$ termini da $\sigma^2$.
3. $I(\theta) = \frac{N\sigma^2}{\sigma^4} = \frac{N}{\sigma^2}$.
4. Bound: $\operatorname{var}\{\varepsilon\} \ge \frac{\sigma^2}{N}$.

La media campionaria $\bar{x}$, che è anche la stima ML, è non polarizzata e ha varianza $\sigma^2/N$: raggiunge il bound, quindi è efficiente. Nella slide 10 ($N = 12$, $\sigma = 1$) la deviazione standard è $1/\sqrt{12} \approx 0.29$, la larghezza del picco.`,
  },
  {
    id: 'fc-stimatore-efficiente',
    kind: 'definizione',
    q: md`Quando uno stimatore si dice efficiente?`,
    a: md`Quando la sua varianza raggiunge il bound di Cramér-Rao:

$$\operatorname{var}\{\varepsilon_i\} = \left[\mathbf{I}^{-1}(\boldsymbol{\theta})\right]_{ii}$$

Ottiene la minima varianza possibile per uno stimatore non polarizzato: è ottimo in termini di efficienza statistica. Esempio: la media campionaria di campioni gaussiani con $\sigma$ nota.`,
  },
  {
    id: 'fc-perche-asintotico',
    kind: 'intuizione',
    q: md`Perché si studiano le proprietà asintotiche degli stimatori?`,
    a: md`Nella pratica molte stime vengono da stimatori polarizzati e inefficienti, e la loro qualità dipende da due fattori: il numero di campioni di training e la loro qualità intrinseca. Con pochi campioni il confronto è falsato. Per valutare e confrontare gli stimatori si assume un numero infinito di campioni ($N \to +\infty$): uno stimatore è buono se ha proprietà asintotiche (*asymptotic properties*) favorevoli.`,
  },
  {
    id: 'fc-non-polarizzazione-asintotica',
    kind: 'formula',
    q: md`Quando uno stimatore è asintoticamente non polarizzato?`,
    a: md`$$\lim_{N\to+\infty} E\{\boldsymbol{\varepsilon}\} = 0 \quad\Rightarrow\quad \lim_{N\to+\infty} E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$$

Al crescere di $N$ il valore atteso dello stimatore tende al valore vero. Per $N$ finito può essere polarizzato: per esempio $E\{\hat{\theta}\} = \frac{N-1}{N}\theta$ ha bias $-\theta/N$, che si annulla solo al limite.`,
  },
  {
    id: 'fc-efficienza-asintotica',
    kind: 'formula',
    q: md`Quando uno stimatore è asintoticamente efficiente?`,
    a: md`Quando, nel limite di campioni numerosi, raggiunge il bound di Cramér-Rao, la minima varianza tra gli stimatori non polarizzati:

$$\lim_{N\to+\infty} \frac{\operatorname{var}\{\varepsilon_i\}}{\left[\mathbf{I}^{-1}(\boldsymbol{\theta})\right]_{ii}} = 1,\qquad i = 1, 2, \dots, r$$

Si guarda il rapporto e non la differenza perché numeratore e denominatore tendono entrambi a zero.`,
  },
  {
    id: 'fc-consistenza',
    kind: 'formula',
    q: md`Definisci uno stimatore consistente.`,
    a: md`Converge al valore vero del parametro quando il numero di campioni tende all'infinito (convergenza in probabilità):

$$\lim_{N\to+\infty} P\{\lVert\boldsymbol{\varepsilon}\rVert < \delta\} = 1 \qquad \forall\,\delta > 0$$

Per quanto piccola sia la tolleranza $\delta$, con abbastanza campioni l'errore sta sotto $\delta$ con probabilità che tende a 1.`,
  },
  {
    id: 'fc-condizioni-consistenza',
    kind: 'proprieta',
    q: md`Quali condizioni indicano le note per la consistenza?`,
    a: md`Le "necessary conditions": lo stimatore deve essere asintoticamente non polarizzato e la sua varianza deve tendere a zero.

$$\lim_{N\to+\infty} E\{\boldsymbol{\varepsilon}\} = 0,\qquad \lim_{N\to+\infty} \operatorname{var}\{\varepsilon_i\} = 0$$

A rigore sono condizioni sufficienti: esistono stimatori consistenti con bias che non va a zero. All'orale riporta la formulazione del docente e, se richiesto, precisa.`,
  },
  {
    id: 'fc-chebyshev-consistenza',
    kind: 'procedura',
    q: md`Dimostra che bias e varianza che tendono a zero implicano la consistenza.`,
    a: md`1. Disuguaglianza di Chebyshev (forma di Markov sul quadrato): $P\{\vert\varepsilon_i\vert \ge \delta\} \le \frac{E\{\varepsilon_i^2\}}{\delta^2}$.
2. Scomposizione: $E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + \left(E\{\varepsilon_i\}\right)^2$.
3. Se bias e varianza tendono a zero, $E\{\varepsilon_i^2\} \to 0$, quindi $P\{\vert\varepsilon_i\vert \ge \delta\} \to 0$ per ogni $\delta > 0$.
4. Sul vettore: $P\{\lVert\boldsymbol{\varepsilon}\rVert \ge \delta\} \le \frac{1}{\delta^2}\sum_{i=1}^{r}E\{\varepsilon_i^2\} \to 0$.`,
  },
  {
    id: 'fc-controesempio-consistenza',
    kind: 'intuizione',
    q: md`Perché le condizioni delle note per la consistenza non sono, a rigore, necessarie?`,
    a: md`Controesempio: $\hat{\theta}_N = \bar{x} + N\,B_N$, con $B_N = 1$ con probabilità $1/N$ e $B_N = 0$ altrimenti. Il bias vale sempre $E\{\varepsilon\} = N \cdot \frac{1}{N} = 1$, quindi non tende a zero. Eppure $P\{\vert\varepsilon\vert \ge \delta\} \le \frac{1}{N} + P\{\vert\bar{x}-\theta\vert \ge \delta\} \to 0$: lo stimatore è consistente. Un salto enorme ma sempre più raro sposta la media senza impedire la convergenza in probabilità.`,
  },
]
