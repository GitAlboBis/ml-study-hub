// Derivazioni del foglio m08 (stima non parametrica e K-NN): der01-der10 dell'inventario.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più servono a seguire i conti
// che la fonte salta; sono controllati sulle immagini di ch2 p37-50 e part1 p30-35 e ricalcolati a mano.
// Due passi dell'inventario hanno parole senza accento dentro \text{} ("piu" in der04, "probabilita" in der09).
// Qui sono scritte con l'accento («più», «probabilità»), come le legge lo studente: formula-coverage le segnala come
// non ritrovate, ma le due formule sono presenti e l'unica differenza è l'accento (verificato a mano, revisione giro 1).
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivations: Derivation[] = [
  // --- der01 Dalla probabilità di una regione alla stima K/(N·V) -------------------------------------
  {
    id: 'der01',
    title: 'Dalla probabilità di una regione alla stima K/(N·V)',
    goal: md`Ricavare la stima non parametrica della pdf nel punto $\mathbf{x}^*$, $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$, partendo dalla probabilità che un campione cada in una regione $R$ e dalla frequenza relativa (*relative frequency*) dei campioni di addestramento che vi cadono.`,
    assumptions: md`$\mathbf{x}^*$ è un campione generico (*generic sample*) e $R$ una regione prefissata dello spazio delle feature (*predefined region of the feature space*) con $\mathbf{x}^* \in R$. La pdf vera $p(\mathbf{x})$ è una funzione continua (*continuous function*) e $R$ è abbastanza piccola (*sufficiently small*) perché $p(\mathbf{x})$ non vi vari in modo significativo. Gli $N$ campioni di addestramento (*training samples*) $\mathbf{x}_1, \dots, \mathbf{x}_N$ sono estratti in modo indipendente dalla stessa $p(\mathbf{x})$ e $K$ di essi cadono in $R$.`,
    steps: [
      {
        latex: md`P_R = P\{\mathbf{x}\in R\} = \int_R p(\mathbf{x})\,d\mathbf{x}`,
        why: md`Definizione di densità di probabilità: la probabilità $P_R$ che un campione cada in $R$ è l'integrale della pdf su $R$. È un numero fisso tra 0 e 1 che dipende dalla pdf vera e dalla regione, non dai campioni: per questo è ignoto.`,
      },
      {
        latex: md`V = \int_R d\mathbf{x}`,
        why: md`Il volume di $R$ (in $n$ dimensioni un ipervolume, *hypervolume*) è l'integrale di 1 sulla regione: in 1-D è una lunghezza, in 2-D un'area. È la $V$ cerchiata in verde nella slide 43 con la scritta «Volume of R».`,
      },
      {
        latex: md`\int_R p(\mathbf{x})\,d\mathbf{x} = p(\boldsymbol{\xi})\,V \quad \text{per qualche } \boldsymbol{\xi} \in R`,
        why: md`Passo aggiunto, esatto: teorema della media integrale. Se $p$ è continua e $R$ è chiusa, limitata e connessa, l'integrale è compreso tra $V \cdot \min_R p$ e $V \cdot \max_R p$, quindi è uguale a $p$ calcolata in un punto $\boldsymbol{\xi}$ della regione per il volume. Non si sa quale sia $\boldsymbol{\xi}$, ma si sa che sta in $R$.`,
      },
      {
        latex: md`\int_R p(\mathbf{x})\,d\mathbf{x} \simeq p(\mathbf{x}^*)\int_R d\mathbf{x} = p(\mathbf{x}^*)\,V`,
        why: md`Ipotesi della slide 43: $p$ continua e $R$ piccola. Allora $\boldsymbol{\xi}$ e $\mathbf{x}^*$, che stanno entrambi in $R$, sono vicini e per continuità $p(\boldsymbol{\xi}) \simeq p(\mathbf{x}^*)$: la pdf esce dall'integrale come se fosse costante e resta il volume. La slide (e le note a p. 31) scrivono $=$, ma è un'approssimazione: l'errore è $\vert p(\boldsymbol{\xi}) - p(\mathbf{x}^*)\vert\, V$ e sparisce, in proporzione a $P_R$, solo quando $R$ si stringe su $\mathbf{x}^*$.`,
      },
      {
        latex: md`P_R = P\{\mathbf{x}\in R\} = \int_R p(\mathbf{x})\,d\mathbf{x} \simeq p(\mathbf{x}^*)\,V`,
        why: md`La formula della slide 43 per intero, da leggere come un rettangolo: l'area sotto la pdf sopra $R$ è circa altezza $p(\mathbf{x}^*)$ per base $V$. È il ponte tra la densità in un punto, che si vuole stimare, e la probabilità di una regione, che si può stimare contando.`,
      },
      {
        latex: md`K = \sum_{k=1}^{N} I_k, \qquad I_k = 1 \ \text{se } \mathbf{x}_k \in R, \quad I_k = 0 \ \text{altrimenti}`,
        why: md`$K$ è il numero di campioni di addestramento che appartengono a $R$, su $N$ in tutto (*number of training samples belonging to R, among a total of N*): si conta un 1 per ogni campione dentro la regione. $K$ è una variabile aleatoria, perché cambia se cambia il training set; la sua legge è nella dimostrazione [«la frequenza relativa è una stima consistente»](#derivation:der06).`,
      },
      {
        latex: md`\hat{P}_R = \frac{K}{N}`,
        why: md`La frequenza relativa è lo stimatore naturale di una probabilità: la frazione di prove in cui l'evento si è verificato. Qui ogni campione è una prova indipendente e l'evento è «il campione cade in $R$». Il cappello indica che è una stima calcolata dai dati.`,
      },
      {
        latex: md`\lim_{N\to+\infty} P\{|\hat{P}_R - P_R| < \delta\} = 1 \quad \forall\delta > 0`,
        why: md`Legge dei grandi numeri (*law of large numbers*), la freccia rossa della slide 43: per quanto piccolo sia lo scarto $\delta$, la probabilità che la frequenza relativa disti da $P_R$ meno di $\delta$ tende a 1 quando $N$ cresce. È la convergenza in probabilità, cioè la consistenza (*consistent estimate*) di $\hat{P}_R$. I passaggi (legge binomiale e disuguaglianza di Chebyshev) sono nella dimostrazione [«la frequenza relativa è una stima consistente»](#derivation:der06).`,
      },
      {
        latex: md`p(\mathbf{x}^*)\,V \simeq \hat{P}_R = \frac{K}{N}`,
        why: md`Si uguagliano due espressioni della stessa quantità $P_R$: quella geometrica (densità per volume) e quella statistica (frequenza relativa). Le approssimazioni ora sono due: $p$ quasi costante in $R$ e $K/N$ vicino a $P_R$.`,
      },
      {
        latex: md`\hat{p}(\mathbf{x}^*) = \frac{\hat{P}_R}{V} = \frac{K}{NV}`,
        why: md`Si divide per $V$ e si ottiene la stima della pdf in $\mathbf{x}^*$ della slide 44 (*PDF estimation*). La densità è una probabilità per unità di volume: la frazione dei campioni nella regione divisa per la sua misura.`,
      },
      {
        latex: md`N = 200,\ K = 10,\ V = 0.5: \quad \hat{p}(x^*) = \frac{10}{200 \cdot 0.5} = 0.1`,
        why: md`Controllo numerico in 1-D: 10 campioni su 200 in un intervallo lungo 0.5 attorno a $x^*$. La probabilità stimata dell'intervallo è $10/200 = 0.05$; divisa per la lunghezza dà una densità di $0.1$ per unità di $x$.`,
      },
      {
        latex: md`\text{K-NN: } K \text{ fisso, } V = V_K(\mathbf{x}^*) \text{ calcolato dai dati}; \qquad \text{Parzen: } V \text{ fisso, } K \text{ contato dai dati}`,
        why: md`Slide 45: a seconda del ruolo dato ai due parametri $K$ e $V$ (*depending on the role taken by each of the two parameters*) la stessa formula diventa due metodi. Nel K-NN si fissa $K$ e si misura il volume che serve a contenere $K$ campioni; nel metodo di Parzen si fissa la regione, quindi $V$, e si contano i campioni che vi cadono.`,
      },
    ],
    conclusion: md`$\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$ è la formula madre dei metodi non parametrici. La regione deve essere abbastanza grande (*enough large*) da contenere molti campioni, perché valga la legge dei grandi numeri, e abbastanza piccola (*enough small*) da rendere trascurabile la variazione di $p(\mathbf{x})$ al suo interno (slide 44). Se è troppo piccola la stima diventa troppo sensibile al rumore dei dati; se è troppo grande non segue le variazioni locali della pdf (note, p. 32). Fissare $K$ e misurare $V$ dà il metodo K-NN, fissare $V$ e contare $K$ dà il metodo di Parzen (slide 45). La formula si monta pezzo per pezzo nel [widget «Montare la formula K/(N·V)»](#widget:m08-da-pr-a-densita).`,
    source: [
      { doc: 'ch2', page: 43 }, { doc: 'ch2', page: 44 }, { doc: 'ch2', page: 45 },
      { doc: 'part1', page: 31 }, { doc: 'part1', page: 32 },
    ],
  },

  // --- der02 Perché servono K_N -> inf e K_N/N -> 0 -------------------------------------------------
  {
    id: 'der02',
    title: 'Perché servono K_N → ∞ e K_N/N → 0 (giustificazione intuitiva)',
    goal: md`Capire il ruolo delle due condizioni che la slide 47 dà come necessarie e sufficienti (*necessary and sufficient condition*) per una stima K-NN consistente in tutti i punti in cui $p(\mathbf{x})$ è continua: $\lim_{N\to+\infty} K_N = +\infty$ e $\lim_{N\to+\infty} K_N/N = 0$. La slide dice «It can be shown» e non riporta la dimostrazione: qui il ragionamento delle note è reso esplicito passo per passo. La versione quantitativa è nella dimostrazione [«il contenuto di probabilità della cella è una variabile Beta»](#derivation:der09).`,
    assumptions: md`$K$ è scelto come funzione di $N$ (*if K is chosen as a function of N*) e si scrive $K_N$. La pdf $p(\mathbf{x})$ è continua in $\mathbf{x}^*$ e, salvo dove detto, $p(\mathbf{x}^*) > 0$. Per celle piccole vale la formula madre $P_R \simeq p(\mathbf{x}^*)\,V$.`,
    steps: [
      {
        latex: md`\hat{p}_N(\mathbf{x}^*) = \frac{K_N}{N\,V_{K_N}(\mathbf{x}^*)}`,
        why: md`Stima K-NN della slide 47 con $K$ funzione di $N$: il pedice $N$ su $\hat{p}$ ricorda che si tratta di una successione di stime, una per ogni dimensione del training set. La cella si espande attorno a $\mathbf{x}^*$ fino a contenere $K_N$ campioni e $V_{K_N}(\mathbf{x}^*)$ è il suo volume, che dipende dai dati ed è quindi aleatorio.`,
      },
      {
        latex: md`\hat{p}_N(\mathbf{x}^*) = \frac{K_N/N}{V_{K_N}(\mathbf{x}^*)}`,
        why: md`Passo aggiunto: stessa stima, letta come rapporto. Al numeratore c'è la frazione dei campioni nella cella, cioè la stima della sua probabilità; al denominatore il suo volume. Una densità in un punto è il limite di «probabilità della cella diviso volume della cella» quando la cella si stringe sul punto, come il rapporto incrementale che definisce una derivata: per arrivarci numeratore e denominatore devono tendere a zero insieme, ma il numeratore deve restare una stima affidabile.`,
      },
      {
        latex: md`\lim_{N\to+\infty} K_N = +\infty \;\Rightarrow\; \frac{K_N}{N} \text{ stima affidabile di } P_R`,
        why: md`Prima condizione. Se il numero di campioni nella cella cresce senza limite, la frequenza relativa è calcolata su sempre più campioni e diventa una stima affidabile della probabilità della cella (le note: «including enough samples to reduce variability»). Riduce la varianza. Precisazione: il ragionamento è preso in prestito dal caso a regione fissata; nel K-NN $K_N/N$ è un numero deciso in anticipo e ad essere aleatorio è il contenuto di probabilità della cella. La forma corretta dell'affermazione è: il contenuto della cella si concentra attorno a $K_N/N$ con dispersione relativa circa $1/\sqrt{K_N}$, che si annulla se e solo se $K_N \to +\infty$ (dimostrazione [«il contenuto di probabilità della cella è una variabile Beta»](#derivation:der09)).`,
      },
      {
        latex: md`\frac{K_N}{N} \simeq p(\mathbf{x}^*)\,V_{K_N}(\mathbf{x}^*) \;\Rightarrow\; V_{K_N}(\mathbf{x}^*) \simeq \frac{K_N}{N\,p(\mathbf{x}^*)}`,
        why: md`Si usa la formula madre $P_R \simeq p(\mathbf{x}^*)\,V$ sulla cella e si risolve rispetto al volume (serve $p(\mathbf{x}^*) > 0$). A parità di $p(\mathbf{x}^*)$ il volume della cella è proporzionale a $K_N/N$.`,
      },
      {
        latex: md`\lim_{N\to+\infty} \frac{K_N}{N} = 0 \;\Rightarrow\; V_{K_N}(\mathbf{x}^*) \to 0`,
        why: md`Seconda condizione. Se $K$ cresce più lentamente di $N$, la frazione $K_N/N$ va a zero e con essa il volume della cella (le note: «the region used for estimation shrinks, thus improving the local accuracy of the estimate»). Riduce il bias, perché rende esatta l'ipotesi di pdf costante nella cella.`,
      },
      {
        latex: md`N\,V_{K_N}(\mathbf{x}^*) \simeq \frac{K_N}{p(\mathbf{x}^*)} \to +\infty`,
        why: md`Passo aggiunto: il volume tende a zero, ma più lentamente di $1/N$, perché $N V_{K_N}$ cresce come $K_N$. È la stessa coppia di condizioni che vale per qualunque stima $K/(NV)$, anche per Parzen: $V_N \to 0$ e $N V_N \to +\infty$ (dimostrazione [«bias e varianza di K/(N·V)»](#derivation:der07)). Nel K-NN la seconda parte è garantita proprio dalla prima condizione.`,
      },
      {
        latex: md`K_N \to +\infty,\; V_{K_N} \to 0 \;\Rightarrow\; \hat{p}_N(\mathbf{x}^*) \to p(\mathbf{x}^*)`,
        why: md`Con varianza e bias che tendono entrambi a zero, la stima converge alla pdf vera in ogni punto di continuità: è la consistenza affermata dalla slide. Casi particolari. Nei punti a distanza positiva dal supporto ($p = 0$ in tutto un intorno di $\mathbf{x}^*$) la formula del volume non si applica e il volume non tende a zero (la cella deve comunque arrivare dove stanno i campioni); la stima tende lo stesso a $0 = p(\mathbf{x}^*)$ perché il numeratore $K_N/N$ tende a zero. Ai bordi del supporto, dove $p(\mathbf{x}^*) = 0$ ma ogni intorno contiene probabilità, il volume invece tende a zero, più lentamente: all'estremo sinistro del triangolo della slide 50, in $x^* = 0.5$, la massa di $[x^*, x^* + r]$ vale $r^2/3$, quindi $r_K \simeq \sqrt{3K_N/N} \to 0$. In entrambi i casi serve la seconda condizione.`,
      },
      {
        latex: md`K(N) = \sqrt{N}: \quad \lim_{N\to+\infty} \sqrt{N} = +\infty, \qquad \lim_{N\to+\infty} \frac{\sqrt{N}}{N} = \lim_{N\to+\infty} \frac{1}{\sqrt{N}} = 0`,
        why: md`Verifica dell'esempio della slide 47 (la freccia rossa porta dalla seconda condizione a $K(N) = \sqrt{N}$): la radice di $N$ cresce senza limite, ma il rapporto con $N$ vale $1/\sqrt{N}$ e va a zero. Soddisfa entrambe le condizioni.`,
      },
      {
        latex: md`N = 100:\ K_N = 10,\ \tfrac{K_N}{N} = 0.1; \qquad N = 10^4:\ K_N = 100,\ \tfrac{K_N}{N} = 0.01; \qquad N = 10^6:\ K_N = 1000,\ \tfrac{K_N}{N} = 0.001`,
        why: md`Passo aggiunto, in numeri: ogni volta che $N$ si moltiplica per 100, i vicini crescono di 10 volte (la dispersione relativa $1/\sqrt{K_N}$ passa da circa 0.32 a 0.1 e poi a 0.03) e la frazione dei dati usata cala di 10 volte (la cella si stringe). Le note lo dicono così: il volume $V_K(\mathbf{x}^*)$ si restringe (*better local resolution*) e più vicini danno affidabilità statistica (*statistical reliability*).`,
      },
    ],
    conclusion: md`Le due condizioni agiscono su due errori diversi: $K_N \to +\infty$ riduce la varianza (abbastanza campioni nella cella), $K_N/N \to 0$ riduce il bias (la cella si stringe attorno al punto). In breve, $K$ deve crescere con $N$ ma molto più lentamente di $N$ (*at a much slower rate than N*), e $K = \sqrt{N}$ è l'esempio della slide. Questa è una giustificazione, non la dimostrazione del «necessary and sufficient», che la fonte non riporta. Le leggi $K(N)$ si mettono alla prova nel [widget «Quale legge K(N) porta alla pdf vera?»](#widget:m08-condizioni-di-consistenza).`,
    source: [{ doc: 'ch2', page: 47 }, { doc: 'part1', page: 33 }, { doc: 'part1', page: 34 }],
  },

  // --- der03 Controesempi ------------------------------------------------------------------------------
  {
    id: 'der03',
    title: 'Controesempi: leggi K(N) che violano una delle due condizioni',
    goal: md`Mostrare che le due condizioni della slide 47 sono entrambe necessarie, collegandole alla frase delle note «Fixed K may lead to bias or overfitting». I controesempi sono un'integrazione coerente con la fonte.`,
    assumptions: md`Campioni i.i.d. da una $p$ continua in $\mathbf{x}^*$ con $p(\mathbf{x}^*) > 0$; stima $\hat{p}_N(\mathbf{x}^*) = K_N/(N\,V_{K_N}(\mathbf{x}^*))$. Si usano i risultati della dimostrazione [«il contenuto di probabilità della cella è una variabile Beta»](#derivation:der09): valore atteso della stima circa $\frac{K}{K-1}\,p(\mathbf{x}^*)$ e varianza relativa circa $\frac{N-K+1}{N(K-2)}$ quando la cella è piccola.`,
    steps: [
      {
        latex: md`K_N = K_0 \text{ (costante)}: \quad \lim_{N\to+\infty} K_N = K_0 \neq +\infty`,
        why: md`Prima condizione violata. La seconda invece vale ($K_0/N \to 0$), quindi la cella si stringe attorno a $\mathbf{x}^*$: il bias dovuto alla larghezza della cella sparisce. Resta il problema che la frequenza è sempre calcolata su pochi campioni.`,
      },
      {
        latex: md`K_N = K_0 \ge 3: \quad \frac{\mathrm{var}\{\hat{p}_N(\mathbf{x}^*)\}}{E\{\hat{p}_N(\mathbf{x}^*)\}^2} \simeq \frac{N-K_0+1}{N\,(K_0-2)} \;\xrightarrow[N\to+\infty]{}\; \frac{1}{K_0-2} \neq 0`,
        why: md`Passo aggiunto, quantitativo: con $K$ fisso la varianza relativa non si annulla per nessun $N$. La dispersione relativa tende a 1 (100%) con $K_0 = 3$, a $1/\sqrt{3} \simeq 0.58$ con $K_0 = 5$, a $1/\sqrt{8} \simeq 0.35$ con $K_0 = 10$; in più resta il bias verso l'alto $K_0/(K_0-1)$, cioè +50% con $K_0 = 3$. Per quanti dati si aggiungano, la curva resta frastagliata (*jagged*): overfitting persistente, la «high variance» delle note.`,
      },
      {
        latex: md`K_N = \alpha N,\; 0 < \alpha < 1: \quad \lim_{N\to+\infty} \frac{K_N}{N} = \alpha \neq 0`,
        why: md`Seconda condizione violata. La prima vale ($\alpha N \to +\infty$), quindi la varianza si annulla: il difetto è un altro. La cella contiene sempre una frazione fissa $\alpha$ dei dati.`,
      },
      {
        latex: md`P_{K_N} \to \alpha \;\Rightarrow\; \hat{p}_N(\mathbf{x}^*) \to \frac{\alpha}{V_\alpha(\mathbf{x}^*)} = \frac{1}{V_\alpha(\mathbf{x}^*)}\int_{\|\mathbf{x}-\mathbf{x}^*\| \le r_\alpha} p(\mathbf{x})\,d\mathbf{x}`,
        why: md`Passo aggiunto. Il contenuto di probabilità della cella, $P_{K_N}$, ha media $K_N/(N+1) \to \alpha$ e varianza che tende a zero, quindi la cella converge alla sfera di raggio $r_\alpha$ attorno a $\mathbf{x}^*$ che contiene probabilità $\alpha$, di volume $V_\alpha(\mathbf{x}^*)$. La stima $\alpha N/(N V_{K_N})$ tende allora alla media di $p$ su quella sfera fissa: è lo stesso bias di una regione fissata (dimostrazione [«bias e varianza di K/(N·V)»](#derivation:der07)), e non sparisce aumentando $N$.`,
      },
      {
        latex: md`p = \mathcal{N}(0,1),\ x^* = 0,\ \alpha = \tfrac{1}{2}: \quad r_\alpha \simeq 0.674,\ V_\alpha \simeq 1.349, \quad \hat{p}_N(0) \to \frac{0.5}{1.349} \simeq 0.371 \ \text{invece di}\ p(0) \simeq 0.399`,
        why: md`Esempio in 1-D con una gaussiana standard: metà della probabilità sta in $[-0.674,\ 0.674]$ (tra il primo e il terzo quartile), un intervallo lungo $1.349$. Con $K = N/2$ la stima nel picco converge a $0.371$, il 7% sotto il valore vero, con qualunque $N$: il picco resta schiacciato. È l'eccesso di lisciatura (*oversmoothing*, «high bias» nelle note).`,
      },
      {
        latex: md`K_N = \sqrt{N} \text{ oppure } K_N = \log N: \quad K_N \to +\infty, \quad \frac{K_N}{N} \to 0`,
        why: md`Entrambe le condizioni valgono: $K$ cresce (varianza verso zero) ma più lentamente di $N$ (volume verso zero, bias verso zero). La radice di $N$ è l'esempio della slide; anche il logaritmo dà una stima consistente, ma riduce la varianza molto lentamente.`,
      },
      {
        latex: md`\frac{1}{\sqrt{K_N}}: \quad K_N = \sqrt{N} \Rightarrow N^{-1/4}, \qquad K_N = \ln N \Rightarrow \frac{1}{\sqrt{\ln N}}; \qquad N = 10^6:\ 0.032 \ \text{contro} \ 0.27`,
        why: md`Passo aggiunto: la dispersione relativa della stima è circa $1/\sqrt{K_N}$. Con un milione di campioni la legge $\sqrt{N}$ usa 1000 vicini e sbaglia in media del 3%; la legge logaritmica (naturale) usa circa 14 vicini e sbaglia del 27%. Tra le leggi consistenti la scelta resta un compromesso tra bias e varianza a $N$ finito, come dicono le note.`,
      },
    ],
    conclusion: md`Nessuna delle due condizioni si può togliere. Con $K$ fisso la cella si stringe ma contiene sempre pochi campioni: la varianza non si annulla e la stima resta frastagliata (*overfitting*). Con $K$ proporzionale a $N$ la cella contiene sempre una frazione fissa dei dati: la stima converge alla media della pdf su una regione larga (bias, *oversmoothing*). È consistente solo una legge che cresce senza limite ma più lentamente di $N$, come $\sqrt{N}$: è il senso di «Fixed K may lead to bias or overfitting» e del consiglio delle note di scegliere $K$ in funzione di $N$ (*as a function of N*).`,
    source: [{ doc: 'ch2', page: 47 }, { doc: 'part1', page: 34 }],
  },

  // --- der04 Forma 1-D della stima K-NN ---------------------------------------------------------------
  {
    id: 'der04',
    title: 'Forma 1-D della stima K-NN e posizione delle discontinuità di pendenza',
    goal: md`Spiegare in modo preciso la Nota della slide 48, «the discontinuities in the slopes in the estimates generally occur away from the positions of the points themselves», e ottenere le formule per disegnare a mano la stima K-NN in una dimensione. La fonte dà solo la figura e la nota: i passaggi sono un'integrazione, e le posizioni previste tornano con quelle della [figura della slide 48](#figure:fig02).`,
    assumptions: md`Spazio delle feature a una dimensione; $N$ campioni distinti ordinati in modo crescente, $x_{(1)} < x_{(2)} < \dots < x_{(N)}$ (statistiche d'ordine, *order statistics*); $2 \le K \le N$ (il caso $K = 1$ è trattato alla fine). La cella è l'intervallo centrato nel punto di stima $x$, cioè l'ipersfera in una dimensione.`,
    steps: [
      {
        latex: md`V_K(x) = 2\,r_K(x), \qquad r_K(x) = \text{distanza da } x \text{ al } K\text{-esimo campione più vicino}`,
        why: md`In una dimensione la cella «ipersferica» è l'intervallo $[x - r_K(x),\ x + r_K(x)]$, simmetrico attorno a $x$, che arriva fino al $K$-esimo vicino: il suo volume è una lunghezza, il doppio del raggio.`,
      },
      {
        latex: md`r_K(x) = K\text{-esimo valore più piccolo tra } |x - x_1|, \dots, |x - x_N|`,
        why: md`Passo aggiunto: la definizione in formula. Ogni distanza $\vert x - x_k\vert$ è una funzione continua di $x$ (una V con il vertice nel campione), e il $K$-esimo valore più piccolo di $N$ funzioni continue è ancora una funzione continua: $r_K(x)$ non ha salti.`,
      },
      {
        latex: md`\hat{p}(x) = \frac{K}{N\,V_K(x)} = \frac{K}{2N\,r_K(x)}`,
        why: md`Si sostituisce il volume nella formula K-NN della slide 47. La stima è inversamente proporzionale al raggio: dove i campioni sono fitti il $K$-esimo vicino è vicino e la stima è alta.`,
      },
      {
        latex: md`x_{(i)} \le \dots \le x_{(i+K-1)} \text{ i } K \text{ vicini di } x: \quad r_K(x) = \max\{x - x_{(i)},\; x_{(i+K-1)} - x\}`,
        why: md`In 1-D i $K$ vicini di $x$ sono sempre $K$ campioni consecutivi nell'ordinamento: se un campione è tra i vicini, anche ogni campione compreso tra lui e $x$ lo è, perché è più vicino. Il $K$-esimo vicino è il più lontano tra i due estremi di questa finestra di campioni. La formula vale anche quando $x$ è fuori dalla finestra (nelle code), perché uno dei due termini diventa negativo.`,
      },
      {
        latex: md`x - x_{(i)} = x_{(i+K-1)} - x \;\Rightarrow\; x = \frac{x_{(i)} + x_{(i+K-1)}}{2} \quad (\text{cuspide: massimo locale})`,
        why: md`Dentro una stessa finestra di $K$ campioni il raggio $\max\{x - x_{(i)},\ x_{(i+K-1)} - x\}$ è una V con il minimo quando $x$ è equidistante dai due estremi: lì il $K$-esimo vicino passa dall'estremo destro al sinistro e la stima ha una cuspide verso l'alto. In quel punto la finestra è davvero l'insieme dei vicini: i campioni fuori da essa distano almeno metà della sua larghezza. Quindi ogni finestra di $K$ campioni consecutivi produce una cuspide, e la cuspide sta nel punto medio tra due campioni, non su un campione.`,
      },
      {
        latex: md`x - x_{(i)} = x_{(i+K)} - x \;\Rightarrow\; x = \frac{x_{(i)} + x_{(i+K)}}{2} \quad (\text{angolo: minimo locale})`,
        why: md`La finestra dei vicini scorre di un posto quando il campione successivo a destra, $x_{(i+K)}$, diventa più vicino dell'estremo sinistro $x_{(i)}$. Prima di quel punto il raggio cresce (vale $x - x_{(i)}$), dopo cala (vale $x_{(i+K)} - x$): il raggio ha un massimo e la stima un minimo angoloso. Anche questo è un punto medio tra due campioni.`,
      },
      {
        latex: md`\hat{p}\left(\frac{x_{(i)} + x_{(i+K-1)}}{2}\right) = \frac{K}{N\,\left(x_{(i+K-1)} - x_{(i)}\right)}`,
        why: md`Nella cuspide il raggio è metà della larghezza della finestra, $r_K = (x_{(i+K-1)} - x_{(i)})/2$, e $K/(2N r_K)$ dà l'altezza del picco. L'altezza è inversamente proporzionale alla larghezza della finestra di $K$ campioni consecutivi: la terna (con $K = 3$) o la cinquina (con $K = 5$) più stretta dà il picco più alto, come nella figura. Tra un punto angoloso e il successivo la curva è un ramo di iperbole liscio.`,
      },
      {
        latex: md`\hat{p}\left(\frac{x_{(i)} + x_{(i+K)}}{2}\right) = \frac{K}{N\,\left(x_{(i+K)} - x_{(i)}\right)}`,
        why: md`Passo aggiunto: nel minimo angoloso il raggio è $(x_{(i+K)} - x_{(i)})/2$, quindi il fondo della valle è tanto più basso quanto più sono distanti $x_{(i)}$ e $x_{(i+K)}$.`,
      },
      {
        latex: md`\frac{x_{(i)} + x_{(i+K-1)}}{2} \le \frac{x_{(i)} + x_{(i+K)}}{2} \le \frac{x_{(i+1)} + x_{(i+K)}}{2}, \qquad N-K+1 \ \text{cuspidi}, \quad N-K \ \text{minimi angolosi}`,
        why: md`Passo aggiunto: cuspidi e minimi si alternano. Le finestre di $K$ campioni consecutivi sono $N - K + 1$ (da $i = 1$ a $i = N-K+1$), ciascuna con la sua cuspide, e tra due cuspidi consecutive c'è esattamente un minimo. Con gli 8 campioni della slide 48 si hanno 6 cuspidi per $K = 3$ e 4 per $K = 5$, come nelle due curve della figura.`,
      },
      {
        latex: md`\frac{d\hat{p}}{dx} = -\frac{K}{2N\,r_K^2(x)}\,\frac{dr_K}{dx}, \qquad \frac{dr_K}{dx} = \pm 1 \;\Rightarrow\; \left|\frac{d\hat{p}}{dx}\right| = \frac{K}{2N\,r_K^2(x)} = \frac{2N}{K}\,\hat{p}^{\,2}(x)`,
        why: md`Derivata di $K/(2N r_K)$ con la regola della funzione composta. Il raggio è una distanza da un campione, quindi la sua pendenza vale $+1$ o $-1$. L'ultima uguaglianza si ottiene da $\hat{p}^{\,2} = K^2/(4N^2 r_K^2)$: la pendenza cresce con il quadrato della stima, quindi i picchi alti sono anche i più aguzzi, come nella figura.`,
      },
      {
        latex: md`\lim_{x \to x_0^-} \hat{p}(x) = \lim_{x \to x_0^+} \hat{p}(x), \qquad \frac{d\hat{p}}{dx}\Big|_{x_0^-} = -\frac{d\hat{p}}{dx}\Big|_{x_0^+}`,
        why: md`Passo aggiunto, il cuore della Nota: in un punto angoloso $x_0$ la stima è continua (perché lo è $r_K$, e $r_K > 0$ quando $K \ge 2$ e i campioni sono distinti), ma $dr_K/dx$ cambia segno, quindi la pendenza passa di colpo da $+K/(2N r_K^2)$ a $-K/(2N r_K^2)$ in una cuspide, e viceversa in un minimo. Sono le «discontinuities in the slopes» della slide 48; le «many discontinuities» delle note (p. 34) vanno lette così, perché la stima non ha salti di valore.`,
      },
      {
        latex: md`x \ge \frac{x_{(N-K+1)} + x_{(N)}}{2}: \ \ \hat{p}(x) = \frac{K}{2N\,\left(x - x_{(N-K+1)}\right)}, \qquad x \le \frac{x_{(1)} + x_{(K)}}{2}: \ \ \hat{p}(x) = \frac{K}{2N\,\left(x_{(K)} - x\right)}`,
        why: md`Le code. Oltre l'ultima cuspide i $K$ vicini restano per sempre gli ultimi $K$ campioni e il $K$-esimo vicino è il più a sinistra di essi, $x_{(N-K+1)}$: la coda destra è un unico ramo di iperbole, con l'asintoto verticale (mai raggiunto) in $x_{(N-K+1)}$. Specularmente, prima della prima cuspide il $K$-esimo vicino è $x_{(K)}$.`,
      },
      {
        latex: md`\int_{m}^{+\infty} \frac{K}{2N\,\left(x - x_{(N-K+1)}\right)}\,dx = \frac{K}{2N}\Big[\ln\left(x - x_{(N-K+1)}\right)\Big]_{m}^{+\infty} = +\infty, \qquad m = \frac{x_{(N-K+1)} + x_{(N)}}{2}`,
        why: md`Passo aggiunto: le code decrescono solo come $1/\vert x\vert$, e l'integrale di $1/x$ diverge come il logaritmo. L'area sotto la stima è infinita: la stima K-NN non è una vera densità, non integra a 1 (code pesanti). Va bene per stimare il valore della pdf in un punto, non come modello completo.`,
      },
      {
        latex: md`K = 1: \quad \hat{p}(x) = \frac{1}{2N\,|x - x_{(j)}|}, \ \ x_{(j)} \ \text{campione più vicino a } x \;\Rightarrow\; \hat{p}\left(x_{(j)}\right) = +\infty`,
        why: md`Passo aggiunto, il caso escluso: con $K = 1$ la «finestra» è un solo campione e il suo punto medio è il campione stesso, quindi le cuspidi cadono proprio sui campioni e sono poli (valore infinito). I minimi angolosi restano a metà tra campioni consecutivi. Per questo la Nota vale per $K \ge 2$; con un solo campione ($N = K = 1$) la stima è lo spillo iperbolico della prima riga della slide 50.`,
      },
    ],
    conclusion: md`In 1-D la stima K-NN è una catena di rami di iperbole $K/(2N\,r_K(x))$, continua per $K \ge 2$, con $N-K+1$ cuspidi nei punti medi delle finestre di $K$ campioni consecutivi e $N-K$ minimi angolosi nei punti medi tra $x_{(i)}$ e $x_{(i+K)}$: le pendenze saltano nei punti medi tra campioni, non sui campioni (Nota della slide 48). I picchi più alti stanno sulle finestre più strette e sono anche i più aguzzi; le code decrescono come $1/\vert x\vert$ e hanno area infinita. Con queste formule il grafico si disegna a mano, come nell'[esempio svolto con cinque campioni e K = 3](#example:ex09) e nel [widget «All'orale: disegna tu la stima K-NN»](#widget:m08-disegna-la-stima-knn).`,
    source: [{ doc: 'ch2', page: 48 }, { doc: 'part1', page: 34 }, { doc: 'part1', page: 35 }],
  },

  // --- der05 Dalla stima K-NN al classificatore K-NN -----------------------------------------------------
  {
    id: 'der05',
    title: 'Dalla stima K-NN al classificatore K-NN (collegamento chiesto all\'esame)',
    goal: md`Mostrare che inserendo le stime K-NN delle densità nella regola di Bayes si ottiene il voto di maggioranza tra i $K$ vicini. Il passaggio non è nelle pagine del modulo (è un'integrazione sul modello di Duda-Hart): serve per la domanda d'esame «how the K-NN classifier works».`,
    assumptions: md`Training set di $N$ campioni etichettati, $N_i$ dei quali della classe $\omega_i$, con $\sum_i N_i = N$. Attorno al punto da classificare $\mathbf{x}$ si fa crescere **una sola** cella, finché contiene $K$ campioni di qualsiasi classe; $V = V_K(\mathbf{x})$ è il suo volume e $K_i$ dei $K$ campioni appartengono a $\omega_i$.`,
    steps: [
      {
        latex: md`\hat{p}(\mathbf{x}|\omega_i) = \frac{K_i}{N_i\,V}`,
        why: md`Si applica la formula $K/(NV)$ ai soli campioni della classe $\omega_i$: dei suoi $N_i$ campioni, $K_i$ cadono nella cella di volume $V$. È la stima della densità condizionata alla classe (*class-conditional density*).`,
      },
      {
        latex: md`\hat{P}(\omega_i) = \frac{N_i}{N}`,
        why: md`La probabilità a priori della classe si stima con la frazione di campioni di training di quella classe.`,
      },
      {
        latex: md`\hat{p}(\mathbf{x}) = \frac{K}{N\,V}, \qquad K = \sum_i K_i`,
        why: md`La densità non condizionata si stima con tutti i campioni: è la formula K-NN della slide 47. I $K$ campioni della cella si ripartiscono tra le classi.`,
      },
      {
        latex: md`\sum_i \hat{p}(\mathbf{x}|\omega_i)\,\hat{P}(\omega_i) = \sum_i \frac{K_i}{N_i V}\cdot\frac{N_i}{N} = \frac{\sum_i K_i}{N V} = \frac{K}{N V} = \hat{p}(\mathbf{x})`,
        why: md`Passo aggiunto, di controllo: le tre stime sono coerenti con il teorema della probabilità totale, perché la densità non condizionata è la somma delle condizionate pesate con le priori. Funziona solo perché tutte le classi usano la stessa cella di volume $V$.`,
      },
      {
        latex: md`\hat{P}(\omega_i|\mathbf{x}) = \frac{\hat{p}(\mathbf{x}|\omega_i)\,\hat{P}(\omega_i)}{\hat{p}(\mathbf{x})} = \frac{\frac{K_i}{N_i V}\cdot\frac{N_i}{N}}{\frac{K}{N V}} = \frac{K_i}{K}`,
        why: md`Teorema di Bayes: $N_i$ si semplifica tra verosimiglianza e priore, $N$ e $V$ tra numeratore e denominatore. Resta la frazione dei vicini che appartengono alla classe.`,
      },
      {
        latex: md`\sum_i \hat{P}(\omega_i|\mathbf{x}) = \sum_i \frac{K_i}{K} = 1`,
        why: md`Passo aggiunto: le stime delle probabilità a posteriori sono una distribuzione legittima. Il volume $V$ non compare più: per classificare non serve misurarlo.`,
      },
      {
        latex: md`\hat{\omega} = \arg\max_i \hat{P}(\omega_i|\mathbf{x}) = \arg\max_i K_i`,
        why: md`Regola MAP (massima probabilità a posteriori): si sceglie la classe con la stima più alta, cioè la più rappresentata tra i $K$ vicini. È il voto di maggioranza (*majority vote*).`,
      },
      {
        latex: md`K = 5,\ K_1 = 3,\ K_2 = 2: \quad \hat{P}(\omega_1|\mathbf{x}) = \tfrac{3}{5} = 0.6, \quad \hat{P}(\omega_2|\mathbf{x}) = \tfrac{2}{5} = 0.4 \;\Rightarrow\; \hat{\omega} = \omega_1`,
        why: md`Passo aggiunto, in numeri: dei 5 vicini 3 sono della classe $\omega_1$, che vince. Con due classi si sceglie $K$ dispari, così il voto non può finire in parità.`,
      },
    ],
    conclusion: md`Il classificatore K-NN non ha bisogno di calcolare volumi né densità: trova i $K$ campioni di training più vicini a $\mathbf{x}$ e assegna la classe più votata. La stima $K_i/K$ della probabilità a posteriori discende dalla formula $K/(NV)$ e dal teorema di Bayes, e la decisione è la regola MAP. Il volume si semplifica solo perché tutte le classi usano la stessa cella. Il passaggio si segue nel [widget «Dal K-NN che stima al K-NN che classifica»](#widget:m08-dal-knn-stimatore-al-classificatore).`,
    source: [{ doc: 'ch2', page: 44 }, { doc: 'ch2', page: 47 }],
  },

  // --- der06 K/N consistente: binomiale e Chebyshev ---------------------------------------------------
  {
    id: 'der06',
    title: 'Perché K/N è una stima consistente di P_R: binomiale e disuguaglianza di Chebyshev (integrazione)',
    goal: md`Mostrare da dove viene il limite della slide 43 etichettato «Law of large numbers»: la frequenza relativa $K/N$ è non distorta e la sua varianza tende a zero, quindi converge in probabilità a $P_R$. La fonte enuncia il risultato senza passaggi.`,
    assumptions: md`Regione $R$ fissata con probabilità $0 < P_R < 1$; campioni $\mathbf{x}_1, \dots, \mathbf{x}_N$ indipendenti e identicamente distribuiti (i.i.d.) secondo $p(\mathbf{x})$; $K$ è il numero di campioni che cadono in $R$ e $\hat{P}_R = K/N$.`,
    steps: [
      {
        latex: md`K = \sum_{k=1}^{N} I_k, \qquad I_k = \begin{cases} 1, & \mathbf{x}_k \in R \\ 0, & \mathbf{x}_k \notin R \end{cases}, \qquad P\{I_k = 1\} = P_R`,
        why: md`Ogni campione di training cade in $R$ oppure no: $K$ è la somma di $N$ variabili indicatrici. I campioni sono i.i.d., quindi le indicatrici sono prove di Bernoulli indipendenti con la stessa probabilità di successo $P_R$.`,
      },
      {
        latex: md`E\{I_k\} = 1\cdot P_R + 0\cdot(1-P_R) = P_R, \qquad \mathrm{var}\{I_k\} = E\{I_k^2\} - E\{I_k\}^2 = P_R - P_R^2 = P_R(1-P_R)`,
        why: md`Passo aggiunto: media e varianza di una Bernoulli. Poiché $I_k$ vale 0 o 1, $I_k^2 = I_k$ e quindi $E\{I_k^2\} = P_R$.`,
      },
      {
        latex: md`P(K = k) = \binom{N}{k} P_R^{k} (1 - P_R)^{N-k}`,
        why: md`La somma di $N$ prove di Bernoulli indipendenti con lo stesso parametro è una variabile binomiale: $\binom{N}{k}$ conta i modi di scegliere quali $k$ campioni cadono in $R$, e ognuna di queste configurazioni ha probabilità $P_R^{k}(1-P_R)^{N-k}$ per l'indipendenza.`,
      },
      {
        latex: md`E\{K\} = \sum_{k=1}^{N} E\{I_k\}, \qquad \mathrm{var}\{K\} = \sum_{k=1}^{N} \mathrm{var}\{I_k\}`,
        why: md`Passo aggiunto: la media di una somma è la somma delle medie (sempre); la varianza di una somma di variabili indipendenti è la somma delle varianze, perché le covarianze sono nulle.`,
      },
      {
        latex: md`E\{K\} = N P_R, \qquad \mathrm{var}\{K\} = N P_R (1 - P_R)`,
        why: md`Si sommano $N$ termini uguali: sono media e varianza della binomiale.`,
      },
      {
        latex: md`E\{\hat{P}_R\} = \frac{E\{K\}}{N} = P_R, \qquad \mathrm{var}\{\hat{P}_R\} = \frac{\mathrm{var}\{K\}}{N^2} = \frac{P_R (1 - P_R)}{N}`,
        why: md`Si divide per $N$, usando $E\{aX\} = a\,E\{X\}$ e $\mathrm{var}\{aX\} = a^2\,\mathrm{var}\{X\}$ con $a = 1/N$: la frequenza relativa è non distorta (*unbiased*) e la sua varianza decresce come $1/N$.`,
      },
      {
        latex: md`P\{|\hat{P}_R - P_R| \geq \delta\} = P\{(\hat{P}_R - P_R)^2 \geq \delta^2\} \leq \frac{E\{(\hat{P}_R - P_R)^2\}}{\delta^2}`,
        why: md`Passo aggiunto: disuguaglianza di Markov applicata alla variabile non negativa $Y = (\hat{P}_R - P_R)^2$. Per ogni $a > 0$ vale $E\{Y\} \ge a\,P\{Y \ge a\}$, perché $Y \ge a$ sull'evento e $Y \ge 0$ fuori; con $a = \delta^2$ si ottiene la disuguaglianza. Poiché $\hat{P}_R$ è non distorta, $E\{(\hat{P}_R - P_R)^2\}$ è proprio la sua varianza.`,
      },
      {
        latex: md`P\{|\hat{P}_R - P_R| \geq \delta\} \leq \frac{\mathrm{var}\{\hat{P}_R\}}{\delta^2} = \frac{P_R (1 - P_R)}{N \delta^2}`,
        why: md`È la disuguaglianza di Chebyshev per una variabile di media $P_R$: la probabilità di uno scarto maggiore o uguale a $\delta$ è limitata dalla varianza divisa per $\delta^2$. Si sostituisce la varianza trovata sopra.`,
      },
      {
        latex: md`1 \geq P\{|\hat{P}_R - P_R| < \delta\} = 1 - P\{|\hat{P}_R - P_R| \geq \delta\} \geq 1 - \frac{P_R (1 - P_R)}{N \delta^2}`,
        why: md`Passo aggiunto: si passa all'evento complementare. La probabilità cercata è stretta tra 1 e una quantità che tende a 1.`,
      },
      {
        latex: md`\lim_{N\to+\infty} P\{|\hat{P}_R - P_R| < \delta\} = 1 \quad \forall\delta > 0`,
        why: md`Per $N \to +\infty$ il maggiorante $P_R(1-P_R)/(N\delta^2)$ tende a zero per ogni $\delta$ fissato, quindi la probabilità dell'evento complementare tende a 1: è la formula della slide 43, cioè la convergenza in probabilità (consistenza nel senso del foglio sulla bontà degli stimatori).`,
      },
      {
        latex: md`P_R(1-P_R) \le \tfrac{1}{4} \;\Rightarrow\; P\{|\hat{P}_R - P_R| \geq \delta\} \le \frac{1}{4N\delta^2}; \qquad N = 1000,\ \delta = 0.05:\ \le 0.1`,
        why: md`Passo aggiunto, in numeri: $P_R(1-P_R)$ è massimo per $P_R = 1/2$, quindi il limite vale qualunque sia la probabilità ignota. Con 1000 campioni la frequenza relativa dista da $P_R$ meno di $0.05$ con probabilità almeno del 90%. Chebyshev è prudente: nel caso peggiore $P_R = 1/2$ l'approssimazione normale dà per la stessa probabilità circa il 99,8%.`,
      },
    ],
    conclusion: md`$\hat{P}_R = K/N$ è non distorta e ha varianza $P_R(1-P_R)/N$, che tende a zero: per Chebyshev converge in probabilità a $P_R$. È la legge (debole) dei grandi numeri della slide 43, il motivo per cui la slide chiama $K/N$ una stima consistente (*consistent estimate*). L'errore tipico decresce come $1/\sqrt{N}$. Le oscillazioni del conteggio si vedono nel [widget «K è una binomiale»](#widget:m08-k-binomiale-e-imbuto).`,
    source: [{ doc: 'ch2', page: 43 }, { doc: 'part1', page: 32 }],
  },

  // --- der07 Bias e varianza di K/(NV) a regione fissata -----------------------------------------------
  {
    id: 'der07',
    title: 'Bias e varianza di K/(N·V): le due «Observations» della slide 44 in formule (integrazione)',
    goal: md`Tradurre in formule le due osservazioni della slide 44 e la frase delle note («too small: overly sensitive to noise; too large: may not reflect local variations»): una regione grande introduce bias, una regione con pochi campioni introduce varianza. Si lavora con $R$ fissata, usando la legge binomiale della dimostrazione [«la frequenza relativa è una stima consistente»](#derivation:der06).`,
    assumptions: md`Regione $R$ fissata, contenente $\mathbf{x}^*$, di volume $V$ e probabilità $P_R$; $K$ binomiale di parametri $N$ e $P_R$; $p$ continua. Stima $\hat{p}(\mathbf{x}^*) = K/(NV)$. Per l'esempio in 1-D, $p$ ha anche derivata seconda continua.`,
    steps: [
      {
        latex: md`E\{\hat{p}(\mathbf{x}^*)\} = \frac{E\{K\}}{NV} = \frac{N P_R}{NV} = \frac{P_R}{V} = \frac{1}{V}\int_R p(\mathbf{x})\,d\mathbf{x}`,
        why: md`Si usa $E\{K\} = N P_R$: il valore atteso della stima è la media spaziale della pdf vera su $R$, non il valore puntuale $p(\mathbf{x}^*)$.`,
      },
      {
        latex: md`\frac{1}{V}\int_R p(\mathbf{x})\,d\mathbf{x} \neq p(\mathbf{x}^*) \ \text{se } p \text{ varia in } R, \qquad \lim_{V\to 0} \frac{1}{V}\int_R p(\mathbf{x})\,d\mathbf{x} = p(\mathbf{x}^*)`,
        why: md`Se $R$ è grande e $p$ non è costante al suo interno, la media spaziale differisce da $p(\mathbf{x}^*)$: la stima è distorta e liscia i dettagli (*oversmoothing*). Se $p$ è continua la media spaziale tende a $p(\mathbf{x}^*)$ quando la regione si stringe attorno a $\mathbf{x}^*$: è la richiesta «R enough small».`,
      },
      {
        latex: md`n = 1,\ R = \left[x^* - \tfrac{h}{2},\ x^* + \tfrac{h}{2}\right]: \quad \frac{1}{h}\int_{x^*-h/2}^{x^*+h/2} p(x)\,dx \simeq p(x^*) + \frac{p''(x^*)}{24}\,h^2`,
        why: md`Passo aggiunto: quanto vale il bias in 1-D. Si sviluppa $p(x^* + t) \simeq p(x^*) + p'(x^*)\,t + p''(x^*)\,t^2/2$ e si integra per $t$ tra $-h/2$ e $h/2$: il termine lineare si annulla per simmetria e $\int t^2\,dt = h^3/12$, quindi la correzione è $p''(x^*)\,h^3/24$, divisa per $h$. Il bias $p''(x^*)\,h^2/24$ è negativo sui picchi ($p'' < 0$, i picchi si abbassano) e positivo nelle valli (le valli si riempiono), e cresce con il quadrato della larghezza.`,
      },
      {
        latex: md`\mathrm{var}\{\hat{p}(\mathbf{x}^*)\} = \frac{\mathrm{var}\{K\}}{N^2 V^2} = \frac{P_R (1 - P_R)}{N V^2} \simeq \frac{p(\mathbf{x}^*)\,V}{N V^2} = \frac{p(\mathbf{x}^*)}{N V}`,
        why: md`Varianza della binomiale divisa per $(NV)^2$. Con $R$ piccola $P_R \simeq p(\mathbf{x}^*)\,V$ è molto minore di 1, quindi $1 - P_R \simeq 1$ e resta $p(\mathbf{x}^*)/(NV)$: la varianza esplode quando $NV$ è piccolo.`,
      },
      {
        latex: md`\frac{\sqrt{\mathrm{var}\{\hat{p}(\mathbf{x}^*)\}}}{E\{\hat{p}(\mathbf{x}^*)\}} = \sqrt{\frac{1 - P_R}{N P_R}} \simeq \frac{1}{\sqrt{E\{K\}}}`,
        why: md`Si divide la deviazione standard $\sqrt{P_R(1-P_R)/N}\,/V$ per la media $P_R/V$: $V$ si semplifica. L'errore relativo dipende solo dal numero atteso di campioni dentro $R$, $E\{K\} = N P_R$: per una stima affidabile servono molti campioni nella regione. È la richiesta «R enough large» (legge dei grandi numeri).`,
      },
      {
        latex: md`E\{K\} = 4:\ \frac{1}{\sqrt{4}} = 0.5; \qquad E\{K\} = 100:\ \frac{1}{\sqrt{100}} = 0.1`,
        why: md`Passo aggiunto, in numeri: con 4 campioni attesi nella regione la stima oscilla in media del 50% attorno al suo valore atteso, con 100 del 10%. Per dimezzare l'errore relativo servono quattro volte più campioni nella regione.`,
      },
      {
        latex: md`E\{(\hat{p} - p)^2\} = \big(E\{\hat{p}\} - p\big)^2 + \mathrm{var}\{\hat{p}\} \;\overset{n=1}{\simeq}\; \frac{p''(x^*)^2}{576}\,h^4 + \frac{p(x^*)}{N h}`,
        why: md`Passo aggiunto: l'errore quadratico medio (*mean squared error*) è bias al quadrato più varianza (si aggiunge e si toglie $E\{\hat{p}\}$ e il doppio prodotto ha media nulla). In 1-D, con i due risultati precedenti, allargare $h$ abbassa la varianza ma alza il bias come $h^4$, restringerlo fa il contrario: è il dilemma della slide 44 in una formula. Risultato classico, non nelle slide: il minimo si ha per $h \propto N^{-1/5}$, che tende a zero mentre $N h \propto N^{4/5}$ tende all'infinito.`,
      },
      {
        latex: md`V_N \to 0 \ (\text{bias} \to 0) \qquad \text{e} \qquad N V_N \to +\infty \ (\text{varianza} \to 0,\ E\{K_N\} \to +\infty)`,
        why: md`Conclusione generale: per la consistenza il volume deve tendere a zero, ma più lentamente di $1/N$. Il metodo di Parzen lo ottiene scegliendo la legge $V_N$ (per esempio $1/\sqrt{N}$), il K-NN scegliendo $K_N \to \infty$ con $K_N/N \to 0$ (slide 47), perché $V_K \simeq K_N/(N\,p(\mathbf{x}^*))$.`,
      },
      {
        latex: md`V_{K_N} \simeq \frac{K_N}{N\,p(\mathbf{x}^*)}: \quad V_{K_N} \to 0 \iff \frac{K_N}{N} \to 0, \qquad N\,V_{K_N} \to +\infty \iff K_N \to +\infty`,
        why: md`Passo aggiunto: nei punti con $p(\mathbf{x}^*) > 0$ le due condizioni generali, scritte per la cella K-NN, diventano esattamente le due condizioni della slide 47 (dimostrazione [«perché servono le due condizioni»](#derivation:der02)).`,
      },
      {
        latex: md`V_N = \frac{V_1}{\sqrt{N}}: \quad V_N \to 0, \qquad N\,V_N = V_1\sqrt{N} \to +\infty`,
        why: md`Passo aggiunto: la riga alta della figura della slide 46 ($V = 1/\sqrt{N}$, cioè $V_1 = 1$) rispetta entrambe le condizioni. Il seguito è nel foglio sulle finestre di Parzen.`,
      },
    ],
    conclusion: md`A regione fissata la stima $K/(NV)$ ha valore atteso uguale alla media di $p$ su $R$ (un bias che cresce con la regione) e varianza circa $p(\mathbf{x}^*)/(NV)$ (che cresce quando la regione contiene pochi campioni). Le due «Observations» della slide 44 sono queste due formule. Per la consistenza servono $V_N \to 0$ e $N V_N \to +\infty$: Parzen le ottiene fissando la legge del volume, il K-NN fissando la legge di $K_N$. La nuvola delle stime si vede nel [widget «bias e varianza di K/(N·V)»](#widget:m08-bias-varianza-a-regione-fissa).`,
    source: [{ doc: 'ch2', page: 44 }, { doc: 'part1', page: 32 }, { doc: 'ch2', page: 46 }, { doc: 'ch2', page: 47 }],
  },

  // --- der08 Volume della cella K-NN con K = sqrt(N) ----------------------------------------------------
  {
    id: 'der08',
    title: 'Il volume della cella K-NN con K = √N: una finestra V_1/√N con V_1 deciso dai dati (integrazione)',
    goal: md`Collegare le due righe della figura della slide 46: mostrare che, con $K = \sqrt{N}$, la cella del K-NN si restringe con la stessa legge $1/\sqrt{N}$ della riga di Parzen, ma con una costante che dipende dalla densità locale.`,
    assumptions: md`$N$ abbastanza grande da rendere la stima K-NN vicina alla pdf vera (è ciò che garantisce la consistenza); $p(\mathbf{x}^*) > 0$; $K_N = \sqrt{N}$, come nella riga bassa della figura della slide 46 e nell'esempio della slide 47.`,
    steps: [
      {
        latex: md`\hat{p}(\mathbf{x}^*) = \frac{K_N}{N\,V_K(\mathbf{x}^*)} \simeq p(\mathbf{x}^*)`,
        why: md`Si assume che $N$ sia abbastanza grande da rendere la stima K-NN una buona approssimazione della pdf vera in $\mathbf{x}^*$.`,
      },
      {
        latex: md`V_K(\mathbf{x}^*) \simeq \frac{K_N}{N\,p(\mathbf{x}^*)}`,
        why: md`Si risolve rispetto al volume: a parità di $K$ e $N$ la cella è tanto più grande quanto più bassa è la densità locale.`,
      },
      {
        latex: md`K_N = \sqrt{N} \;\Rightarrow\; V_K(\mathbf{x}^*) \simeq \frac{\sqrt{N}}{N\,p(\mathbf{x}^*)} = \frac{1}{\sqrt{N}\,p(\mathbf{x}^*)}`,
        why: md`Si sostituisce la legge dell'esempio della slide 47, la stessa della riga bassa della figura della slide 46, e si usa $\sqrt{N}/N = 1/\sqrt{N}$.`,
      },
      {
        latex: md`V_K(\mathbf{x}^*) \simeq \frac{V_1(\mathbf{x}^*)}{\sqrt{N}}, \qquad V_1(\mathbf{x}^*) = \frac{1}{p(\mathbf{x}^*)} \qquad \text{contro} \qquad V_N^{\text{Parzen}} = \frac{V_1}{\sqrt{N}},\ V_1 = 1`,
        why: md`Confronto con la riga alta della figura: stessa dipendenza $1/\sqrt{N}$, ma in Parzen il volume iniziale $V_1$ è scelto dal progettista ed è uguale ovunque, nel K-NN è $1/p(\mathbf{x}^*)$, cioè deciso dai dati e diverso da punto a punto. È il senso preciso di «adaptive to local density variations» (note, p. 32).`,
      },
      {
        latex: md`N = 1,\ 4,\ 9,\ 16,\ 100: \quad V_N = 1,\ \tfrac{1}{2},\ \tfrac{1}{3},\ \tfrac{1}{4},\ \tfrac{1}{10} \ (\text{Parzen}), \qquad K_N = 1,\ 2,\ 3,\ 4,\ 10 \ (\text{K-NN})`,
        why: md`Passo aggiunto: i numeri della [figura della slide 46](#figure:fig01). Nella riga alta il cerchio si restringe secondo una legge fissata, qualunque sia la posizione dei campioni; nella riga bassa il cerchio si allarga finché contiene $\sqrt{N}$ punti, con l'ultimo sul bordo (2 punti con $N = 4$, 10 con $N = 100$), quindi la sua taglia dipende da dove stanno i campioni. Nella riga di Parzen il disegno non è in scala (è il raggio, non il volume, a scalare come $1/\sqrt{N}$); la riga K-NN invece è esatta: il bordo passa per il $K$-esimo vicino.`,
      },
      {
        latex: md`p = \mathcal{N}(0,1),\ N = 100: \quad V_K(0) \simeq \frac{1}{10 \cdot 0.399} \simeq 0.25, \qquad V_K(2) \simeq \frac{1}{10 \cdot 0.054} \simeq 1.85`,
        why: md`Passo aggiunto, in numeri per una gaussiana standard in 1-D: nel picco ($p(0) \simeq 0.399$) la cella con 10 vicini è lunga circa 0.25, in coda ($p(2) \simeq 0.054$) è 7.4 volte più lunga. Una finestra di Parzen con $V_1 = 1$ sarebbe lunga 0.1 ovunque: in $x = 2$ conterrebbe in media $100 \cdot 0.054 \cdot 0.1 \simeq 0.54$ campioni, quindi spesso nessuno, mentre la cella K-NN ne contiene sempre 10.`,
      },
    ],
    conclusion: md`Con $K = \sqrt{N}$ la cella K-NN si restringe con la stessa legge $1/\sqrt{N}$ della finestra di Parzen, ma con una costante diversa in ogni punto, $V_1(\mathbf{x}^*) = 1/p(\mathbf{x}^*)$: piccola dove i dati sono densi, grande nelle code. Il volume iniziale di Parzen lo sceglie il progettista ed è uguale ovunque; quello del K-NN lo decidono i dati. È la differenza tra le due righe della figura della slide 46, da esplorare nel [widget «La cella K-NN è una finestra che si regola da sola»](#widget:m08-volume-knn-segue-la-densita).`,
    source: [{ doc: 'ch2', page: 46 }, { doc: 'ch2', page: 47 }, { doc: 'part1', page: 32 }, { doc: 'part1', page: 33 }],
  },

  // --- der09 Contenuto di probabilità della cella K-NN: legge Beta ----------------------------------
  {
    id: 'der09',
    title: 'Versione esatta per il K-NN: il contenuto di probabilità della cella è una variabile Beta (integrazione)',
    goal: md`Chiudere il salto logico della [giustificazione delle due condizioni](#derivation:der02): nel K-NN $K$ non è aleatorio, quindi «$K/N$ è una stima affidabile di $P_R$ per la legge dei grandi numeri» va riformulato. Si dimostra che il contenuto di probabilità della cella K-NN segue la legge $\mathrm{Beta}(K, N-K+1)$ e da qui si leggono le due condizioni della slide 47, il bias $K/(K-1)$ e la dispersione relativa circa $1/\sqrt{K}$. La fonte dice solo «It can be shown».`,
    assumptions: md`Campioni $\mathbf{x}_1, \dots, \mathbf{x}_N$ i.i.d. con pdf $p(\mathbf{x})$ continua; cella ipersferica centrata nel punto fissato $\mathbf{x}^*$; $1 \le K \le N$. Nessuna ipotesi sulla forma di $p$ né sulla dimensione $n$ finché non si lega il contenuto della cella al suo volume.`,
    steps: [
      {
        latex: md`D_k = \|\mathbf{x}_k - \mathbf{x}^*\|, \qquad G(r) = P\{\|\mathbf{x} - \mathbf{x}^*\| \le r\} = \int_{\|\mathbf{x} - \mathbf{x}^*\| \le r} p(\mathbf{x})\,d\mathbf{x}`,
        why: md`Si guardano i campioni attraverso la loro distanza dal punto $\mathbf{x}^*$ (per una cella di forma diversa dall'ipersfera si usa al posto della distanza la «taglia» minima della cella che contiene il campione). $G(r)$ è la probabilità che un campione cada nella cella di raggio $r$: è la funzione di ripartizione delle distanze, ed è continua perché $p(\mathbf{x})$ è una densità (nessuna sfera ha probabilità positiva sul bordo).`,
      },
      {
        latex: md`U_k = G(D_k) \sim \mathrm{Uniforme}(0,1), \qquad k = 1, \dots, N \quad (\text{i.i.d.})`,
        why: md`Trasformazione integrale di probabilità (*probability integral transform*): applicando a una variabile continua la propria funzione di ripartizione si ottiene una variabile uniforme in $(0, 1)$. I campioni sono i.i.d., quindi lo sono anche le $U_k$. Da qui in poi $p(\mathbf{x})$, $\mathbf{x}^*$ e la dimensione $n$ non compaiono più: il risultato è universale.`,
      },
      {
        latex: md`P\{U_k \le u\} = P\{D_k \le G^{-1}(u)\} = G\left(G^{-1}(u)\right) = u, \qquad 0 \le u \le 1`,
        why: md`Passo aggiunto: la dimostrazione della trasformazione quando $G$ è strettamente crescente (per esempio se $p > 0$ attorno a $\mathbf{x}^*$). $G(D_k) \le u$ equivale a $D_k \le G^{-1}(u)$, e la probabilità di questo evento è $G$ calcolata in quel raggio. Una funzione di ripartizione uguale a $u$ è quella dell'uniforme. Se $G$ ha tratti piatti si usa l'inversa generalizzata e il risultato non cambia, perché $G$ è continua.`,
      },
      {
        latex: md`P\{u \le U_{(K)} \le u + du\} = \frac{N!}{(K-1)!\,1!\,(N-K)!}\,u^{K-1}\,du\,(1-u)^{N-K}`,
        why: md`Passo aggiunto: la densità della $K$-esima statistica d'ordine $U_{(K)}$ si ottiene contando. Perché $U_{(K)}$ cada in $[u, u + du]$ servono $K-1$ uniformi sotto $u$ (ciascuna con probabilità $u$), una nell'intervallo (probabilità $du$) e $N-K$ sopra (ciascuna con probabilità $1-u$); il coefficiente multinomiale conta i modi di dividere gli $N$ campioni in questi tre gruppi.`,
      },
      {
        latex: md`P_K = G\left(D_{(K)}\right) = U_{(K)}, \qquad f_{U_{(K)}}(u) = \frac{N!}{(K-1)!\,(N-K)!}\,u^{K-1}(1-u)^{N-K} \;\Rightarrow\; P_K \sim \mathrm{Beta}(K,\, N-K+1)`,
        why: md`La cella K-NN arriva fino al $K$-esimo vicino, cioè alla $K$-esima distanza in ordine crescente $D_{(K)}$. Poiché $G$ è crescente conserva l'ordine, quindi il contenuto di probabilità della cella, $P_K$, è la $K$-esima statistica d'ordine di $N$ uniformi. La sua densità è quella del passo precedente, cioè una $\mathrm{Beta}(a, b)$ con $a = K$ e $b = N-K+1$, perché $1/B(K, N-K+1) = N!/((K-1)!\,(N-K)!)$.`,
      },
      {
        latex: md`E\{P_K^m\} = \frac{B(K+m,\, N-K+1)}{B(K,\, N-K+1)}, \qquad B(a,b) = \frac{\Gamma(a)\,\Gamma(b)}{\Gamma(a+b)}`,
        why: md`Passo aggiunto: ogni momento della Beta è un rapporto di funzioni Beta, perché moltiplicare la densità per $u^m$ alza di $m$ l'esponente di $u$. Vale per ogni $m > -K$ (altrimenti l'integrale diverge vicino a 0). Servono $m = 1, 2$ per media e varianza del contenuto, $m = -1, -2$ per la stima, che contiene $1/P_K$.`,
      },
      {
        latex: md`E\{P_K\} = \frac{K}{N+1}, \qquad \mathrm{var}\{P_K\} = \frac{K\,(N-K+1)}{(N+1)^2 (N+2)}, \qquad \frac{\sqrt{\mathrm{var}\{P_K\}}}{E\{P_K\}} = \sqrt{\frac{N-K+1}{K\,(N+2)}} \simeq \frac{1}{\sqrt{K}}`,
        why: md`Media e varianza della legge $\mathrm{Beta}(a, b)$, $a/(a+b)$ e $ab/((a+b)^2(a+b+1))$, con $a = K$, $b = N-K+1$, $a + b = N+1$. Per la media, con $m = 1$: $\Gamma(K+1)/\Gamma(K) = K$ e $\Gamma(N+1)/\Gamma(N+2) = 1/(N+1)$. Il contenuto medio della cella è $K/(N+1)$: è la versione rigorosa, per il K-NN, di «$K/N$ stima $P_R$». La dispersione relativa si ottiene dividendo la deviazione standard per la media ed è circa $1/\sqrt{K}$ quando $K \ll N$.`,
      },
      {
        latex: md`K_N \to +\infty \;\Leftrightarrow\; \frac{\sqrt{\mathrm{var}\{P_K\}}}{E\{P_K\}} \to 0, \qquad \frac{K_N}{N} \to 0 \;\Leftrightarrow\; E\{P_K\} \to 0`,
        why: md`Lettura delle due condizioni della slide 47 (con $K_N \ll N$). La dispersione relativa del contenuto si annulla se e solo se $K_N \to \infty$: con $K$ limitato resta almeno dell'ordine di $1/\sqrt{K}$. Il contenuto medio tende a zero se e solo se $K_N/N \to 0$: altrimenti la cella conserva una frazione finita $\alpha$ della massa di probabilità e la stima tende alla media di $p$ su quella cella, non a $p(\mathbf{x}^*)$ (secondo caso della dimostrazione [«controesempi»](#derivation:der03)).`,
      },
      {
        latex: md`P_K = p(\boldsymbol{\xi})\,V_K(\mathbf{x}^*) \simeq p(\mathbf{x}^*)\,V_K(\mathbf{x}^*) \;\Rightarrow\; \hat{p}(\mathbf{x}^*) = \frac{K}{N\,V_K(\mathbf{x}^*)} \simeq p(\mathbf{x}^*)\,\frac{K/N}{P_K}`,
        why: md`Teorema della media integrale ($p$ continua): il contenuto è $p(\boldsymbol{\xi})\,V_K$ con $\boldsymbol{\xi}$ dentro la cella, e se la cella è piccola $p(\boldsymbol{\xi}) \simeq p(\mathbf{x}^*)$. Si ricava $V_K \simeq P_K/p(\mathbf{x}^*)$ e lo si sostituisce nella formula della slide 47: tutta l'aleatorietà della stima sta in $1/P_K$.`,
      },
      {
        latex: md`E\left\{\frac{1}{P_K}\right\} = \frac{N}{K-1} \;\Rightarrow\; E\{\hat{p}(\mathbf{x}^*)\} \simeq \frac{K}{N}\cdot\frac{N}{K-1}\,p(\mathbf{x}^*) = \frac{K}{K-1}\,p(\mathbf{x}^*) \quad (K \ge 2)`,
        why: md`Momento di ordine $-1$ della Beta: $E\{1/P\} = (a + b - 1)/(a - 1) = N/(K-1)$, perché $\Gamma(K-1)/\Gamma(K) = 1/(K-1)$ e $\Gamma(N+1)/\Gamma(N) = N$. La stima K-NN è distorta verso l'alto del fattore $K/(K-1)$: +100% con $K = 2$, +25% con $K = 5$, +1% con $K = 100$; con $K = 1$ il valore atteso è infinito. Per questo alcuni testi usano la variante $(K-1)/(N\,V_K)$; la formula del docente resta $K/(N\,V_K)$, e il fattore tende a 1 quando $K_N \to \infty$.`,
      },
      {
        latex: md`E\left\{\frac{1}{P_K^2}\right\} = \frac{N(N-1)}{(K-1)(K-2)} \;\Rightarrow\; \frac{\mathrm{var}\{\hat{p}(\mathbf{x}^*)\}}{E\{\hat{p}(\mathbf{x}^*)\}^2} \simeq \frac{(N-1)(K-1)}{N\,(K-2)} - 1 = \frac{N-K+1}{N\,(K-2)} \simeq \frac{1}{K} \quad (K \ge 3)`,
        why: md`Momento di ordine $-2$ della Beta: $E\{1/P^2\} = (a+b-1)(a+b-2)/((a-1)(a-2))$. La varianza relativa è $E\{1/P_K^2\}/E\{1/P_K\}^2 - 1$ (il fattore costante $p(\mathbf{x}^*)\,K/N$ si semplifica). Con $K$ fisso non si annulla per nessun $N$ (primo caso della dimostrazione [«controesempi»](#derivation:der03)); con $K \le 2$ è addirittura infinita.`,
      },
      {
        latex: md`\frac{N(N-1)}{(K-1)(K-2)}\cdot\frac{(K-1)^2}{N^2} - 1 = \frac{(N-1)(K-1) - N(K-2)}{N\,(K-2)} = \frac{N - K + 1}{N\,(K-2)}`,
        why: md`Passo aggiunto, il conto del passo precedente: si semplificano un fattore $N$ e un fattore $K-1$, si porta tutto a denominatore comune, e al numeratore $NK - N - K + 1 - NK + 2N = N - K + 1$. Quando $K$ è grande e molto minore di $N$ il risultato è circa $1/K$.`,
      },
      {
        latex: md`N = 1000:\ \ K = 5:\ \tfrac{K}{K-1} = 1.25,\ \sqrt{\tfrac{N-K+1}{N(K-2)}} \simeq 0.58; \qquad K = 32:\ \tfrac{K}{K-1} \simeq 1.03,\ \sqrt{\tfrac{N-K+1}{N(K-2)}} \simeq 0.18`,
        why: md`Passo aggiunto, in numeri: con mille campioni e 5 vicini la stima è in media il 25% troppo alta e oscilla del 58%; con $K = 32 \simeq \sqrt{1000}$ il bias scende al 3% e la dispersione al 18%.`,
      },
      {
        latex: md`K_N \to +\infty,\ \frac{K_N}{N} \to 0 \;\Rightarrow\; \frac{K_N}{K_N-1} \to 1, \quad \frac{N-K_N+1}{N\,(K_N-2)} \to 0, \quad V_{K_N}(\mathbf{x}^*) \to 0 \;\Rightarrow\; \hat{p}_N(\mathbf{x}^*) \to p(\mathbf{x}^*) \ \text{ in probabilità}`,
        why: md`Con entrambe le condizioni il bias e la varianza relativa tendono a zero e la cella si stringe attorno a $\mathbf{x}^*$ (dove $p(\mathbf{x}^*) > 0$), quindi diventa esatta anche l'approssimazione $p(\boldsymbol{\xi}) \simeq p(\mathbf{x}^*)$: la stima è consistente. Nei punti a distanza positiva dal supporto ($p = 0$ in tutto un intorno di $\mathbf{x}^*$) il volume non tende a zero, ma la stima $K_N/(NV)$ tende comunque a 0 perché $K_N/N \to 0$; ai bordi del supporto il volume tende a zero lo stesso. Resta una giustificazione quantitativa, non la dimostrazione completa del «necessary and sufficient» della slide.`,
      },
    ],
    conclusion: md`Nel K-NN non è il conteggio a essere aleatorio ma la cella: il suo contenuto di probabilità segue la legge $\mathrm{Beta}(K, N-K+1)$ qualunque siano $p$ e la dimensione. Ne seguono un bias verso l'alto del fattore $K/(K-1)$ e una dispersione relativa circa $1/\sqrt{K}$: entrambi spariscono solo se $K_N \to +\infty$, e la cella si stringe solo se $K_N/N \to 0$. È la versione quantitativa delle due condizioni della slide 47. La cella casuale si vede nel [widget «Nel K-NN è la cella a essere casuale»](#widget:m08-cella-aleatoria-beta).`,
    source: [{ doc: 'ch2', page: 47 }, { doc: 'part1', page: 33 }, { doc: 'part1', page: 34 }],
  },

  // --- der10 Quando ML e Bayes coincidono -------------------------------------------------------------
  {
    id: 'der10',
    title: 'Quando ML e Bayes coincidono: prior uniforme e limite N → ∞',
    goal: md`Dare i passaggi delle due affermazioni delle note (p. 30) e della slide 40, chieste all'orale con «In which case ML and Bayesian are the same?»: con un prior uniforme la soluzione bayesiana si riduce a quella ML (*the Bayesian solution reduces to the ML solution*), e nel limite di infiniti campioni le due soluzioni diventano equivalenti (*asymptotic equivalence*). La fonte le motiva solo a parole («the prior doesn't influence the posterior»; «both methods will converge to the true parameter values»). Le formule di $\mu_N$ e $\sigma_N^2$ sono quelle della slide 37, controllate sull'immagine. È un doppione voluto della stessa dimostrazione nel foglio sulla stima bayesiana.`,
    assumptions: md`Parametro $\theta$ con prior $p(\theta)$; training set $X = \{\mathbf{x}_1, \dots, \mathbf{x}_N\}$ di campioni i.i.d., con verosimiglianza $p(X|\theta) = \prod_{k=1}^{N} p(\mathbf{x}_k|\theta)$. Per la verifica: caso gaussiano univariato con $\sigma^2$ nota, $p(x_k|\mu) \sim N(\mu, \sigma^2)$ e prior $p(\mu) \sim N(\mu_0, \sigma_0^2)$ con $\sigma_0^2 > 0$ (slide 37).`,
    steps: [
      {
        latex: md`p(\theta|X) = \frac{p(X|\theta)\,p(\theta)}{\int p(X|\theta)\,p(\theta)\,d\theta}`,
        why: md`Teorema di Bayes per i parametri: posterior uguale a verosimiglianza per prior, diviso per la costante di normalizzazione, che non dipende da $\theta$.`,
      },
      {
        latex: md`\ln p(\theta|X) = \ln p(X|\theta) + \ln p(\theta) - \ln \int p(X|\theta)\,p(\theta)\,d\theta`,
        why: md`Passo aggiunto: con il logaritmo il prodotto diventa una somma. Il prior aggiunge alla log-verosimiglianza il termine $\ln p(\theta)$, che sposta il massimo verso ciò che si credeva prima dei dati; l'ultimo termine è una costante.`,
      },
      {
        latex: md`p(\theta) = c \;\Rightarrow\; p(\theta|X) = \frac{p(X|\theta)\,c}{c\int p(X|\theta)\,d\theta} = \frac{p(X|\theta)}{\int p(X|\theta)\,d\theta} \;\propto\; p(X|\theta)`,
        why: md`Prior uniforme: la costante $c$ esce dall'integrale e si semplifica (nel logaritmo, $\ln p(\theta)$ è una costante). È il senso preciso di «the prior doesn't influence the posterior»: la posterior è la verosimiglianza normalizzata. Condizione: il prior deve essere costante su una regione che contiene il massimo della verosimiglianza; un prior uniforme su tutto l'asse non è normalizzabile e va inteso come limite di un prior sempre più largo (ultimo passo).`,
      },
      {
        latex: md`\arg\max_{\theta}\, p(\theta|X) = \arg\max_{\theta}\, p(X|\theta) = \hat{\theta}_{ML}`,
        why: md`Due funzioni proporzionali hanno lo stesso punto di massimo: il picco della posterior coincide con la stima ML. «La soluzione bayesiana si riduce a quella ML» va inteso così: la posterior resta una curva, con la sua larghezza, ma il suo massimo è la stima ML.`,
      },
      {
        latex: md`\mu_N = \left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X} + \left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0, \qquad \sigma_N^2 = \frac{\sigma_0^2\,\sigma^2}{N\sigma_0^2+\sigma^2}, \qquad \hat{\mu}_{ML} = \bar{X}`,
        why: md`Verifica sul caso gaussiano univariato con $\sigma$ nota e prior $N(\mu_0, \sigma_0^2)$, formule della slide 37: la posterior è di nuovo normale, $N(\mu_N, \sigma_N^2)$, e la sua media è una media pesata tra la media campionaria $\bar{X}$ («Sample mean» nella slide) e la media a priori $\mu_0$; i due pesi sommano a 1. La stima ML della media è la media campionaria (foglio sulla massima verosimiglianza).`,
      },
      {
        latex: md`\frac{1}{\sigma_N^2} = \frac{N\sigma_0^2 + \sigma^2}{\sigma_0^2\,\sigma^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}`,
        why: md`Passo aggiunto: letta come precisione (l'inverso della varianza), la formula di $\sigma_N^2$ dice che la precisione della posterior è la somma di quella dei dati, $N/\sigma^2$, che cresce con ogni campione, e di quella del prior, $1/\sigma_0^2$, che resta fissa. Con $N$ grande i dati dominano.`,
      },
      {
        latex: md`\bar{X} - \mu_N = \left(1 - \frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X} - \frac{\sigma^2}{N\sigma_0^2+\sigma^2}\,\mu_0 = \frac{\sigma^2}{N\sigma_0^2+\sigma^2}\,\left(\bar{X} - \mu_0\right)`,
        why: md`Si usa $1 - \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2} = \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}$: lo scarto tra la stima ML e la media a posteriori è il peso del prior moltiplicato per la distanza tra i dati e il prior. È la formula dello scarto usata nel [widget «Quando ML e Bayes danno la stessa risposta»](#widget:m08-quando-ml-e-bayes-coincidono).`,
      },
      {
        latex: md`N \to +\infty: \quad \frac{\sigma^2}{N\sigma_0^2+\sigma^2} \to 0 \;\Rightarrow\; \mu_N \to \bar{X} = \hat{\mu}_{ML}, \qquad \sigma_N^2 \to 0`,
        why: md`Equivalenza asintotica: il peso del prior decresce come $1/N$ (purché $\sigma_0^2 > 0$, cioè il prior non sia una certezza), quindi le due stime coincidono nel limite e la posterior collassa su un punto ($\sigma_N^2 \to 0$, la delta di Dirac della slide 38, *Bayesian learning*): Bayes restituisce di fatto un punto, come ML. Entrambe le stime sono consistenti.`,
      },
      {
        latex: md`\sigma^2 = \sigma_0^2 = 1,\ \mu_0 = 0,\ \bar{X} = 2: \quad N = 1:\ \mu_N = 1; \qquad N = 9:\ \mu_N = 1.8; \qquad N = 99:\ \mu_N = 1.98`,
        why: md`Passo aggiunto, in numeri: il peso del prior vale $1/(N+1)$, quindi lo scarto $\bar{X} - \mu_N = 2/(N+1)$ passa da 1 a 0.2 a 0.02, e $\sigma_N^2 = 1/(N+1)$ passa da 0.5 a 0.1 a 0.01.`,
      },
      {
        latex: md`\sigma_0^2 \to +\infty: \quad \mu_N \to \bar{X} \ \ \forall N, \qquad \sigma_N^2 \to \frac{\sigma^2}{N}`,
        why: md`Prior sempre più piatto: il peso del prior va a zero per qualunque $N$, quindi la stima del parametro coincide con ML anche con pochi campioni. Resta però $\sigma_N^2 = \sigma^2/N$, cioè l'incertezza sul parametro, che ML non fornisce: la densità predittiva $N(\mu_N, \sigma^2 + \sigma_N^2)$ della slide 39 coincide con quella ottenuta inserendo la stima ML nel modello solo se anche $N$ è grande.`,
      },
    ],
    conclusion: md`ML e Bayes coincidono in due casi. Con un prior uniforme (nessuna conoscenza a priori, *no prior knowledge is assumed*) la posterior è la verosimiglianza normalizzata e il suo massimo è la stima ML. Con infiniti campioni il peso del prior va a zero come $1/N$, la media a posteriori tende alla media campionaria e la posterior collassa su un punto: entrambe le stime sono consistenti. Nel caso gaussiano lo scarto tra le due stime è $\frac{\sigma^2}{N\sigma_0^2+\sigma^2}(\bar{X} - \mu_0)$. Anche quando le stime puntuali coincidono, Bayes conserva la larghezza della posterior, cioè l'incertezza sul parametro.`,
    source: [
      { doc: 'part1', page: 30 },
      { doc: 'ch2', page: 37 }, { doc: 'ch2', page: 38 }, { doc: 'ch2', page: 39 }, { doc: 'ch2', page: 40 },
    ],
  },
]
