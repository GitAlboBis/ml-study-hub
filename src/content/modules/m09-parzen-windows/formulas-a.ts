// Formule del foglio m09 (finestre di Parzen), concetti c01-c35 dell'inventario.
// Convenzione condivisa: una voce per ogni stringa LaTeX di concepts[].latex, id "f-<concetto>" per la prima,
// "f-<concetto>-2", "f-<concetto>-3"... per le successive. Il campo latex è copiato dall'inventario
// (verificato due volte sulle immagini delle pagine) e scripts/formula-coverage.ts lo ritrova per confronto.
// importance = examRelevance del concetto. Le formule ricostruite (non scritte nella fonte) lo dicono nel testo.
import { md } from '../../types'
import type { Formula } from '../../types'

export const formulasA: Formula[] = [
  // --- c01 Contesto e obiettivo ------------------------------------------------------------------
  {
    id: 'f-c01',
    name: 'Stima della pdf da un conteggio in una regione',
    nameEn: 'Nonparametric pdf estimate K/(NV)',
    latex: md`\hat{p}(\mathbf{x}^*)=\frac{K}{NV}`,
    explain: md`Prendi una regione $R$ di volume $V$ centrata sul punto $\mathbf{x}^*$ e conta quanti training samples ci cadono dentro: $K$ su $N$. La frazione $K/N$ stima la probabilità $P_R$ che un campione cada in $R$; dividendo per $V$ ottieni probabilità per unità di volume, cioè una densità. È il punto di partenza della stima non parametrica (*nonparametric estimation*): nessun modello per la forma della pdf, solo i campioni. Ti serve quando non conosci la forma funzionale (*functional form*) della pdf del fenomeno, oppure quando i modelli parametrici la approssimano male (slide p41). Esempio con il pesce: misuri la luminosità di $N = 200$ salmoni, 14 cadono nell'intervallo largo $0.5$ attorno a $x^* = 3.2$, quindi $\hat{p}(3.2) = 14/(200 \cdot 0.5) = 0.14$.`,
    symbols: [
      { s: md`\mathbf{x}^*`, meaning: md`punto dello spazio delle feature in cui stimi la densità` },
      { s: md`R`, meaning: md`regione centrata su $\mathbf{x}^*$ in cui conti i campioni` },
      { s: md`K`, meaning: md`numero di training samples che cadono in $R$` },
      { s: md`N`, meaning: md`numero totale di training samples` },
      { s: md`V`, meaning: md`volume (ipervolume) della regione $R$` },
      { s: md`\hat{P}_R = K/N`, meaning: md`frequenza relativa: stima consistente della probabilità che un campione cada in $R$ (legge dei grandi numeri)` },
    ],
    whenToUse: md`All'orale apri così le finestre di Parzen: che cosa vuoi fare (stimare la pdf in un punto) e perché la stima è non parametrica. K-NN e Parzen partono entrambi da qui.`,
    pitfalls: md`È un'approssimazione: $R$ deve essere abbastanza grande da contenere molti campioni (legge dei grandi numeri) e abbastanza piccola da rendere $p(\mathbf{x})$ quasi costante al suo interno (slide p44). Se dimentichi $V$ ottieni una probabilità, non una densità.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x}^*)=\frac{K}{\boxed{\;?\;}}`,
        answer: md`NV`,
        distractors: [md`N`, md`V`, md`K\,V`],
      },
    ],
    source: [
      { doc: 'ch2', page: 44 },
      { doc: 'ch2', page: 41 },
      { doc: 'ch2', page: 42 },
      { doc: 'ch2', page: 51 },
      { doc: 'part1', page: 36 },
    ],
  },

  // --- c02 Parzen contro K-NN ----------------------------------------------------------------------
  {
    id: 'f-c02',
    name: 'Due parametri, due metodi: K e V',
    nameEn: 'Two parameters K and V: K-NN vs Parzen',
    latex: md`\hat{p}(\mathbf{x}^*)=\frac{K}{NV}`,
    explain: md`La stessa stima dipende da due quantità, $K$ e $V$. Ne fissi una e ricavi l'altra dai dati. Fissi $K$: hai il metodo dei K vicini (*K-nearest neighbor method*, K-NN), che misura il volume necessario a contenere $K$ campioni. Fissi la regione $R$, e con lei $V$: hai il metodo di Parzen (*Parzen method*), che conta $K$. Entrambi convergono alla pdf vera per $N \to \infty$ (*both of these methods do in fact converge*), ma sul comportamento a campione finito (*finite-sample behavior*) la teoria dice poco (slide p45).`,
    symbols: [
      { s: md`K`, meaning: md`fissato a priori nel K-NN; contato sui campioni in Parzen` },
      { s: md`V`, meaning: md`misurato sui campioni nel K-NN; fissato (tramite $h$) in Parzen` },
      { s: md`N`, meaning: md`numero totale di training samples` },
      { s: md`\mathbf{x}^*`, meaning: md`punto in cui stimi la densità` },
    ],
    whenToUse: md`Alla domanda d'esame «what are the differences with Parzen window?»: parti da questa formula e di' quale parametro ciascun metodo tiene fermo.`,
    pitfalls: md`Non invertire i ruoli: in Parzen il volume è deciso prima di guardare i dati, nel K-NN è il risultato. Le note (p32) aggiungono pro e contro: Parzen dà stime lisce ed è meno sensibile al rumore, ma la larghezza della finestra (*bandwidth*) è critica; il K-NN si adatta alla densità locale ma dipende da $K$.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x}^*)=\frac{\boxed{\;?\;}}{NV}`,
        answer: md`K`,
        distractors: [md`N`, md`V`],
      },
    ],
    source: [
      { doc: 'ch2', page: 45 },
      { doc: 'ch2', page: 44 },
      { doc: 'part1', page: 32 },
      { doc: 'ch2', page: 51 },
      { doc: 'part1', page: 36 },
    ],
  },
  {
    id: 'f-c02-2',
    name: 'Stima K-NN: K fissato, volume misurato',
    nameEn: 'K-NN estimate: fixed K, measured volume',
    latex: md`\hat{p}(\mathbf{x}^*)=\frac{K}{N\,V_K(\mathbf{x}^*)}\quad \text{(K-NN: } K \text{ fissato, } V_K(\mathbf{x}^*) \text{ misurato)}`,
    explain: md`Nel K-NN scegli $K$ a priori e una forma per la cella centrata su $\mathbf{x}^*$ (per esempio un'ipersfera). Poi allarghi la cella finché contiene $K$ training samples (*expand the cell up to spanning K training samples*) e ne misuri il volume $V_K(\mathbf{x}^*)$. Dove i campioni sono fitti la cella resta piccola e la stima sale; dove sono radi la cella si gonfia e la stima scende. Per questo il K-NN si adatta alla densità locale e la sua stima non vale mai zero.`,
    symbols: [
      { s: md`V_K(\mathbf{x}^*)`, meaning: md`volume della cella centrata su $\mathbf{x}^*$ espansa fino a contenere $K$ campioni: dipende dal punto e dai dati` },
      { s: md`K`, meaning: md`numero di vicini, scelto a priori` },
      { s: md`N`, meaning: md`numero totale di training samples` },
    ],
    whenToUse: md`Per il confronto con Parzen: accanto alla formula di Parzen mostra che qui è il volume a variare da punto a punto.`,
    pitfalls: md`Il pedice $K$ di $V_K$ ricorda che il volume dipende da $K$ (e da $\mathbf{x}^*$), non che sia fissato. Con $K$ fisso le code della stima K-NN scendono lente e non toccano zero (figura di slide p50).`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x}^*)=\frac{K}{N\,\boxed{\;?\;}}`,
        answer: md`V_K(\mathbf{x}^*)`,
        distractors: [md`h^n`, md`V_K(\mathbf{x}_k)`],
      },
    ],
    source: [
      { doc: 'ch2', page: 47 },
      { doc: 'ch2', page: 45 },
      { doc: 'part1', page: 32 },
    ],
  },
  {
    id: 'f-c02-3',
    name: 'Stima di Parzen: volume fissato, K contato',
    nameEn: 'Parzen estimate: fixed volume, counted K',
    latex: md`\hat{p}(\mathbf{x}^*)=\frac{1}{N h^n}\sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)\quad \text{(Parzen: } V=h^n \text{ fissato, } K \text{ contato)}`,
    explain: md`In Parzen fissi la regione: un ipercubo di lato $h$ e volume $V = h^n$ centrato su $\mathbf{x}^*$. Poi conti con la funzione finestra $\gamma$ i campioni che ci cadono dentro: la somma è $K$ (*an analytic expression for K*). Il volume non dipende dai dati, il conteggio sì. Con una finestra a supporto limitato, dove non cade alcun campione hai $K = 0$ e la stima vale zero: sono i buchi (*gaps*) nella rappresentazione della densità di cui parlano le note (p39).`,
    symbols: [
      { s: md`h`, meaning: md`lato dell'ipercubo, fissato prima di guardare i dati` },
      { s: md`h^n`, meaning: md`volume $V$ dell'ipercubo in $n$ dimensioni` },
      { s: md`\gamma(\cdot)`, meaning: md`funzione finestra: 1 se il campione cade nell'ipercubo, 0 altrimenti` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo training sample` },
    ],
    whenToUse: md`Nel confronto con il K-NN, subito dopo la formula $K/(N\,V_K(\mathbf{x}^*))$: stessa stima, ruoli di $K$ e $V$ scambiati.`,
    pitfalls: md`La somma di $\gamma$ è $K$, un numero intero di campioni: la divisione per $N h^n$ la trasforma in densità. Dimenticare $h^n$ dà la frazione $K/N$, una probabilità.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x}^*)=\frac{1}{\boxed{\;?\;}}\sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)`,
        answer: md`N h^n`,
        distractors: [md`h^n`, md`N^2 h^n`, md`N\,(2h)^n`],
      },
    ],
    source: [
      { doc: 'ch2', page: 45 },
      { doc: 'ch2', page: 51 },
      { doc: 'ch2', page: 52 },
    ],
  },
  {
    id: 'f-c02-4',
    name: 'Le regole della figura: V = 1/√N contro K = √N',
    nameEn: 'Parzen vs K-NN illustration: V = 1/√N, K = √N',
    latex: md`V=\frac{1}{\sqrt{N}}\ \text{(Parzen)},\qquad K=\sqrt{N}\ \text{(K-NN)}`,
    explain: md`La slide p46 confronta i due metodi al crescere dei campioni ($N = 1, 4, 9, 16, 100$). In Parzen la cella si restringe come $1/\sqrt{N}$ qualunque cosa facciano i dati: con $N = 100$ il volume è $0.1$. Nel K-NN con $K = \sqrt{N}$ la cella cresce finché contiene $\sqrt{N}$ campioni: con $N = 100$ ne contiene 10, e la sua grandezza la decidono i dati. Entrambe le regole fanno crescere il numero di campioni nella cella mentre la cella si rimpicciolisce rispetto al totale: in Parzen $N V = \sqrt{N} \to \infty$ con $V \to 0$; nel K-NN $K \to \infty$ con $K/N \to 0$ (le condizioni di consistenza di slide p47).`,
    symbols: [
      { s: md`N`, meaning: md`numero di training samples` },
      { s: md`V`, meaning: md`volume della cella di Parzen, fissato in funzione di $N$` },
      { s: md`K`, meaning: md`numero di vicini del K-NN, fissato in funzione di $N$` },
    ],
    whenToUse: md`Quando disegni all'orale il confronto tra i due metodi: con $N$ che cresce, la cella di Parzen si stringe da sola, quella del K-NN segue i dati.`,
    pitfalls: md`$V = 1/\sqrt{N}$ è un esempio, non l'unica scelta valida: per la consistenza di Parzen servono $V \to 0$ e $N V \to \infty$ (slide p61, più avanti nel foglio).`,
    importance: 3,
    blanks: [
      {
        masked: md`V=\boxed{\;?\;}\ \text{(Parzen)},\qquad K=\sqrt{N}\ \text{(K-NN)}`,
        answer: md`\frac{1}{\sqrt{N}}`,
        distractors: [md`\frac{1}{N}`, md`\sqrt{N}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 46 },
      { doc: 'ch2', page: 47 },
    ],
  },

  // --- c04 Ipotesi dell'ipercubo ------------------------------------------------------------------
  {
    id: 'f-c04',
    name: "Volume dell'ipercubo",
    nameEn: 'Hypercube volume',
    latex: md`V=h^n`,
    explain: md`Ipotesi (*hypotheses*): la regione $R$ è per il momento un ipercubo $n$-dimensionale (*n-dimensional hypercube*) centrato su $\mathbf{x}^*$, con lato (*edge*) lungo $h$. Il volume è il lato elevato alla dimensione: un segmento lungo $h$ per $n = 1$, un quadrato di area $h^2$ per $n = 2$, un cubo $h^3$ per $n = 3$. Con il pesce descritto da luminosità e larghezza ($n = 2$) e $h = 0.5$, la finestra è un quadrato di area $0.25$. L'ipercubo è temporaneo: lo sostituiscono finestre più generali, ma la relazione $V = h^n$ resta e garantisce che la stima abbia area 1 (slide p54).`,
    symbols: [
      { s: md`R`, meaning: md`regione dello spazio delle feature centrata su $\mathbf{x}^*$, qui un ipercubo` },
      { s: md`h`, meaning: md`lunghezza del lato dell'ipercubo (poi: larghezza della finestra)` },
      { s: md`n`, meaning: md`dimensione dello spazio delle feature` },
      { s: md`V`, meaning: md`volume dell'ipercubo` },
    ],
    whenToUse: md`Ogni volta che passi dal lato della finestra al suo volume: nel fattore $1/h^n$ della stima e nella normalizzazione $V(h) = h^n$ dei kernel generali.`,
    pitfalls: md`In dimensione alta il volume cambia in fretta: con $h = 0.5$ e $n = 10$ vale $0.5^{10} \approx 0.001$. A parità di $h$ ti servono molti più campioni per riempire la finestra.`,
    importance: 3,
    blanks: [
      {
        masked: md`V=\boxed{\;?\;}`,
        answer: md`h^n`,
        distractors: [md`(2h)^n`, md`\left(\frac{h}{2}\right)^n`],
      },
    ],
    source: [
      { doc: 'ch2', page: 51 },
      { doc: 'part1', page: 36 },
    ],
  },

  // --- c05 Funzione finestra ----------------------------------------------------------------------
  {
    id: 'f-c05',
    name: "Funzione finestra dell'ipercubo",
    nameEn: 'Hypercube window function',
    latex: md`\gamma(\mathbf{x})=\begin{cases}1, & \text{if } \mathbf{x} \text{ belongs to the hypercube}\\ 0, & \text{otherwise}\end{cases}`,
    explain: md`Per scrivere $K$ come formula (*an analytic expression for K*) definisci la funzione finestra (*window function*) $\gamma$: vale 1 se il suo argomento cade nell'ipercubo, 0 altrimenti. È una funzione indicatrice, risponde sì o no. Applicata a un training sample $\mathbf{x}_k$, ti dice se il campione cade nella finestra (note p36: *this function essentially counts whether a training sample falls inside the hypercube or not*). Sommando le risposte su tutti i campioni ottieni $K$.`,
    symbols: [
      { s: md`\gamma(\cdot)`, meaning: md`funzione finestra: indicatrice dell'ipercubo unitario centrato nell'origine` },
      { s: md`\mathbf{x}`, meaning: md`argomento della finestra, un vettore di $\Re^n$ (poi sarà la differenza normalizzata $(\mathbf{x}_k - \mathbf{x}^*)/h$)` },
    ],
    whenToUse: md`Quando devi trasformare «conta i campioni nella regione» in una somma che puoi scrivere e derivare.`,
    pitfalls: md`La slide non dice quale ipercubo: si intende quello di lato 1 centrato nell'origine (convenzione di Duda-Hart, coerente con il grafico di $\Pi(x)$ di slide p58). Per un ipercubo di centro $\mathbf{x}^*$ e lato $h$ non cambi $\gamma$: ne normalizzi l'argomento.`,
    importance: 3,
    blanks: [
      {
        masked: md`\gamma(\mathbf{x})=\begin{cases}\boxed{\;?\;}, & \text{if } \mathbf{x} \text{ belongs to the hypercube}\\ 0, & \text{otherwise}\end{cases}`,
        answer: md`1`,
        distractors: [md`\frac{1}{h^n}`, md`\frac{1}{N}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 51 },
      { doc: 'part1', page: 36 },
    ],
  },
  {
    id: 'f-c05-2',
    name: "Ipercubo unitario centrato nell'origine",
    nameEn: 'Unit hypercube centered at the origin',
    latex: md`\gamma(\mathbf{u})=1 \iff |u_j|\le \tfrac{1}{2},\quad j=1,\dots,n`,
    explain: md`La forma esplicita della finestra: $\gamma(\mathbf{u})$ vale 1 quando tutte le $n$ componenti di $\mathbf{u}$ stanno tra $-1/2$ e $1/2$. È l'ipercubo di lato 1 e volume 1 centrato nell'origine. Basta una componente fuori e la finestra vale 0. In 1-D ritrovi il rettangolo $\Pi(u)$ del kernel rettangolare (slide p58). La slide non scrive questa condizione: segue Duda-Hart ed è coerente con il grafico di $\Pi$.`,
    symbols: [
      { s: md`\mathbf{u}`, meaning: md`argomento normalizzato della finestra, $\mathbf{u} = (\mathbf{x}_k - \mathbf{x}^*)/h$` },
      { s: md`u_j`, meaning: md`$j$-esima componente di $\mathbf{u}$` },
      { s: md`n`, meaning: md`dimensione dello spazio delle feature: la condizione va controllata su tutte le $n$ componenti` },
    ],
    whenToUse: md`Quando fai il test di appartenenza a mano: una componente alla volta, confronti $\vert u_j \vert$ con $1/2$.`,
    pitfalls: md`La soglia è $1/2$, non 1: con $\vert u_j \vert \le 1$ il lato sarebbe 2, il volume $2^n$, e con il fattore $1/h^n$ la stima non integrerebbe più a 1.`,
    importance: 3,
    blanks: [
      {
        masked: md`\gamma(\mathbf{u})=1 \iff |u_j|\le \boxed{\;?\;},\quad j=1,\dots,n`,
        answer: md`\tfrac{1}{2}`,
        distractors: [md`1`, md`\tfrac{h}{2}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 51 },
      { doc: 'ch2', page: 58 },
      { doc: 'part1', page: 36 },
    ],
  },

  // --- c06 Test di appartenenza -------------------------------------------------------------------
  {
    id: 'f-c06',
    name: 'Test di appartenenza alla finestra',
    nameEn: 'Membership test: x_k belongs to R',
    latex: md`\mathbf{x}_k\in R\iff\gamma\left[\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right]=1`,
    explain: md`Vuoi sapere se il campione $\mathbf{x}_k$ cade nell'ipercubo $R$ di centro $\mathbf{x}^*$ e lato $h$ usando una sola funzione $\gamma$. Sottrai $\mathbf{x}^*$ e porti il centro nell'origine; dividi per $h$ e riporti il lato a 1. Se il vettore normalizzato cade nell'ipercubo unitario, $\gamma$ vale 1 e il campione sta in $R$. In 1-D la condizione diventa $\vert x_k - x^* \vert \le h/2$. Esempio: $x^* = 3.2$, $h = 0.5$, campione $x_k = 3.35$: $(3.35 - 3.2)/0.5 = 0.3 \le 0.5$, il campione è dentro.`,
    symbols: [
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo training sample` },
      { s: md`\mathbf{x}^*`, meaning: md`centro dell'ipercubo, il punto in cui stimi la densità` },
      { s: md`h`, meaning: md`lato dell'ipercubo` },
      { s: md`R`, meaning: md`ipercubo di centro $\mathbf{x}^*$ e lato $h$` },
    ],
    whenToUse: md`Per contare a mano i campioni in una finestra, e come mattone della somma che dà $K$.`,
    pitfalls: md`Se dimentichi di dividere per $h$ confronti la distanza con $1/2$ invece che con $h/2$. La slide usa le quadre $\gamma[\cdot]$ nel testo e le tonde nelle formule di p52: sono la stessa cosa.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 51 },
      { doc: 'part1', page: 36 },
    ],
  },
  {
    id: 'f-c06-2',
    name: 'Campione fuori dalla finestra',
    nameEn: 'Sample outside the region',
    latex: md`\mathbf{x}_k\notin R\iff\gamma\left[\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right]=0`,
    explain: md`Il caso complementare: se anche una sola componente di $(\mathbf{x}_k - \mathbf{x}^*)/h$ esce da $[-1/2, 1/2]$, $\gamma$ vale 0 e il campione non conta. Poiché $\gamma$ prende solo i valori 0 e 1, le due frasi della slide (*belongs to R if … = 1. Otherwise, … = 0*) formano una doppia implicazione. Esempio: con $x^* = 3.2$ e $h = 0.5$ il campione $x_k = 3.6$ dà $(3.6 - 3.2)/0.5 = 0.8 > 0.5$: fuori.`,
    symbols: [
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo training sample` },
      { s: md`(\mathbf{x}_k-\mathbf{x}^*)/h`, meaning: md`posizione del campione relativa al centro, misurata in unità di lato` },
    ],
    whenToUse: md`Insieme alla formula precedente, per giustificare che la somma di $\gamma$ conta i soli campioni dentro la finestra.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 51 },
      { doc: 'part1', page: 36 },
    ],
  },

  // --- c07 Espressione analitica di K -------------------------------------------------------------
  {
    id: 'f-c07',
    name: "Numero di campioni nell'ipercubo",
    nameEn: 'Number of samples in the hypercube',
    latex: md`K=\sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)`,
    explain: md`Sommi la funzione finestra su tutti gli $N$ training samples: ogni campione dentro l'ipercubo aggiunge 1, ogni campione fuori aggiunge 0. Il totale è $K$. Rispetto al conteggio a mano, ora $K$ è una funzione analitica di $\mathbf{x}^*$ e di $h$: sposti il punto o cambi il lato e lo ricalcoli con la stessa formula. Esempio: campioni 1-D $2.9,\ 3.1,\ 3.35,\ 3.6,\ 4.4$, $x^* = 3.2$, $h = 0.5$. La finestra copre $[2.95,\ 3.45]$ e contiene $3.1$ e $3.35$: $K = 2$.`,
    symbols: [
      { s: md`K`, meaning: md`numero di training samples nell'ipercubo di centro $\mathbf{x}^*$ e lato $h$` },
      { s: md`N`, meaning: md`numero totale di training samples` },
      { s: md`\gamma`, meaning: md`funzione finestra che definisce la regione attorno a $\mathbf{x}^*$` },
      { s: md`h`, meaning: md`parametro della finestra (*window* o *bandwidth parameter*)` },
      { s: md`\mathbf{x}^*`, meaning: md`punto in cui stimi la densità` },
      { s: md`\mathbf{x}_k`, meaning: md`training samples, $k = 1, \dots, N$` },
    ],
    whenToUse: md`È il primo passo della derivazione della stima di Parzen: da qui sostituisci $K$ in $K/(NV)$.`,
    pitfalls: md`Dentro $\gamma$ il divisore è $h$, il lato, non il volume $h^n$: la normalizzazione dell'argomento lavora componente per componente.`,
    importance: 3,
    blanks: [
      {
        masked: md`K=\sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{\boxed{\;?\;}}\right)`,
        answer: md`h`,
        distractors: [md`\frac{h}{2}`, md`N`, md`h^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 52 },
      { doc: 'part1', page: 37 },
    ],
  },

  // --- c08 Stima di Parzen con ipercubo -----------------------------------------------------------
  {
    id: 'f-c08',
    name: 'Stima di Parzen con la finestra a ipercubo',
    nameEn: 'Parzen estimate with the hypercube window',
    latex: md`\hat{p}(\mathbf{x}^*)=\frac{K}{NV}=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}^*-\mathbf{x}_k}{h}\right)`,
    explain: md`Sostituisci nella stima di base $K/(NV)$ il conteggio analitico di $K$ e il volume $V = h^n$. Ottieni la media, sugli $N$ campioni, di finestre riscalate di $1/h^n$. La slide scrive due forme, con argomento $(\mathbf{x}_k - \mathbf{x}^*)/h$ e con $(\mathbf{x}^* - \mathbf{x}_k)/h$: coincidono perché l'ipercubo è simmetrico, e la seconda apre la strada alle finestre generali. Continuando l'esempio 1-D ($K = 2$, $N = 5$, $h = 0.5$): $\hat{p}(3.2) = 2/(5 \cdot 0.5) = 0.8$.`,
    symbols: [
      { s: md`\hat{p}(\mathbf{x}^*)`, meaning: md`stima della pdf nel punto $\mathbf{x}^*$` },
      { s: md`h^n`, meaning: md`volume dell'ipercubo (con la finestra rettangolare)` },
      { s: md`n`, meaning: md`dimensione dello spazio delle feature` },
      { s: md`\gamma`, meaning: md`valuta se il campione $\mathbf{x}_k$ cade nella finestra attorno a $\mathbf{x}^*$` },
      { s: md`N`, meaning: md`numero totale di training samples` },
    ],
    whenToUse: md`All'orale scrivi questa catena di uguaglianze per mostrare il passaggio dal conteggio alla stima di Parzen (derivazione [«dal conteggio alla stima di Parzen»](#derivation:der01)).`,
    pitfalls: md`Il fattore $1/h^n$ sta dentro la somma ma è costante: puoi portarlo fuori, $\frac{1}{N h^n}\sum_k$. Non scrivere $1/h$: in $n$ dimensioni il volume è $h^n$.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x}^*)=\frac{1}{N}\sum_{k=1}^{N}\boxed{\;?\;}\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)`,
        answer: md`\frac{1}{h^n}`,
        distractors: [md`h^n`, md`\frac{1}{N}`, md`\frac{1}{N h^n}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 52 },
      { doc: 'part1', page: 37 },
    ],
  },

  // --- c09 Simmetria della finestra ---------------------------------------------------------------
  {
    id: 'f-c09',
    name: 'Simmetria della finestra',
    nameEn: 'Window symmetry',
    latex: md`\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)=\gamma\left(\frac{\mathbf{x}^*-\mathbf{x}_k}{h}\right)`,
    explain: md`L'ultima uguaglianza della slide p52 scambia $\mathbf{x}_k - \mathbf{x}^*$ con $\mathbf{x}^* - \mathbf{x}_k$. Puoi farlo perché la finestra è pari, $\gamma(\mathbf{u}) = \gamma(-\mathbf{u})$: l'ipercubo è simmetrico rispetto al centro. Il valore non cambia, il punto di vista sì. A sinistra hai una sola finestra centrata sul punto di stima $\mathbf{x}^*$, che guarda quali campioni cadono dentro. A destra hai $N$ finestre, una centrata su ogni campione $\mathbf{x}_k$, tutte lette in $\mathbf{x}^*$. La seconda lettura fa della stima una funzione di $\mathbf{x}$, somma di funzioni appoggiate sui campioni, e la generalizza a kernel qualsiasi (slide p53).`,
    symbols: [
      { s: md`\gamma(\mathbf{u})=\gamma(-\mathbf{u})`, meaning: md`parità della finestra: vale per l'ipercubo e per tutti i kernel delle slide p58-59` },
      { s: md`\mathbf{x}^*`, meaning: md`punto di stima: centro dell'unica finestra nella prima forma` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo campione: centro della $k$-esima finestra nella seconda forma` },
    ],
    whenToUse: md`Quando all'orale passi dal conteggio (una finestra sul punto) alla somma di kernel (una finestra per campione).`,
    pitfalls: md`La slide non commenta il passaggio: la giustificazione per simmetria è ricostruita. Con un kernel non pari le due forme darebbero stime diverse.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 52 },
      { doc: 'part1', page: 37 },
    ],
  },

  // --- c10 Collezione di contributi rettangolari --------------------------------------------------
  {
    id: 'f-c10',
    name: 'Stima come somma di rettangoli (1-D)',
    nameEn: 'Estimate as a collection of rectangular contributions',
    latex: md`\hat{p}(x)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h}\,\Pi\left(\frac{x-x_k}{h}\right)\quad (n=1)`,
    explain: md`La stima è una collezione di contributi (*collection of contributions*) da funzioni rettangolari, una per campione. Ogni campione $x_k$ porta un rettangolo centrato su di sé, di base $h$ e altezza $1/h$, quindi di area 1; il fattore $1/N$ riduce l'area di ciascun mattoncino a $1/N$. Dove i rettangoli si sovrappongono la stima sale. Il risultato è costante a tratti, con salti in $x_k \pm h/2$. Esempio: campioni $2.9,\ 3.1,\ 3.35,\ 3.6,\ 4.4$ con $h = 0.5$. Ogni mattoncino è alto $1/(5 \cdot 0.5) = 0.4$; in $x = 3.2$ si sovrappongono quelli di $3.1$ e $3.35$, quindi $\hat{p}(3.2) = 0.8$, lo stesso valore del conteggio.`,
    symbols: [
      { s: md`\Pi(\cdot)`, meaning: md`funzione rettangolo 1-D: 1 per $\vert u \vert \le 1/2$, 0 altrove (kernel rettangolare di slide p58)` },
      { s: md`\frac{1}{h}\Pi\left(\frac{x-x_k}{h}\right)`, meaning: md`rettangolo di base $h$ e altezza $1/h$ centrato sul campione $x_k$: area 1, che il fattore $1/N$ porta a $1/N$` },
      { s: md`x_k`, meaning: md`$k$-esimo training sample 1-D` },
    ],
    whenToUse: md`Per il disegno che chiede Melgani (*graphical representation of how the counting works with a couple of samples*): due campioni, due rettangoli, la stima è la loro somma divisa per $N$.`,
    pitfalls: md`La slide non scrive questa formula: è il caso $n = 1$ della stima di slide p52 (seconda forma) con $\gamma = \Pi$. La stima a gradini è discontinua: da qui nasce la spinta verso kernel lisci.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(x)=\frac{1}{N}\sum_{k=1}^{N}\boxed{\;?\;}\,\Pi\left(\frac{x-x_k}{h}\right)\quad (n=1)`,
        answer: md`\frac{1}{h}`,
        distractors: [md`h`, md`\frac{1}{h^2}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 52 },
      { doc: 'ch2', page: 58 },
      { doc: 'part1', page: 37 },
    ],
  },

  // --- c11 Semplice conteggio ---------------------------------------------------------------------
  {
    id: 'f-c11',
    name: 'Parzen come semplice conteggio',
    nameEn: 'Equivalence with a simple count',
    latex: md`\hat{p}(\mathbf{x}^*)=\frac{K}{N h^n}`,
    explain: md`Letta nella prima forma, la stima a ipercubo è un meccanismo di conteggio (*counting mechanism*, *simple count*): conti i $K$ campioni nell'ipercubo predefinito centrato in $\mathbf{x}^*$ e dividi per $N$ e per il volume $h^n$. Conteggio e somma di rettangoli sono due letture della stessa quantità. Con la finestra rettangolare ogni campione conta 1 oppure 0, senza gradazioni: un campione sul bordo pesa quanto uno al centro. Esempio in 2-D: 200 salmoni descritti da luminosità e larghezza, quadrato di lato $h = 0.5$ attorno a $\mathbf{x}^*$ con 6 campioni dentro: $\hat{p}(\mathbf{x}^*) = 6/(200 \cdot 0.25) = 0.12$.`,
    symbols: [
      { s: md`K`, meaning: md`numero di training samples nell'ipercubo di lato $h$ centrato su $\mathbf{x}^*$` },
      { s: md`h^n`, meaning: md`volume $V$ dell'ipercubo` },
      { s: md`N`, meaning: md`numero totale di training samples` },
    ],
    whenToUse: md`Per rispondere alla parte «counting» della domanda d'esame sulla rappresentazione grafica: disegni la finestra su $\mathbf{x}^*$ e conti.`,
    pitfalls: md`Il conteggio non distingue la distanza dal centro: per pesare la vicinanza serve un kernel che scende con la distanza (interpolazione, slide p53).`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x}^*)=\frac{K}{N\boxed{\;?\;}}`,
        answer: md`h^n`,
        distractors: [md`(2h)^n`, md`\left(\frac{h}{2}\right)^n`],
      },
    ],
    source: [
      { doc: 'ch2', page: 52 },
      { doc: 'part1', page: 37 },
    ],
  },

  // --- c13 Finestre generali citate nelle note ----------------------------------------------------
  {
    id: 'f-c13',
    name: 'Kernel di Epanechnikov',
    nameEn: 'Epanechnikov kernel',
    latex: md`\gamma(x)=\tfrac{3}{4}\,(1-x^2)\ \text{per } |x|\le 1,\qquad \gamma(x)=0\ \text{altrove}`,
    explain: md`Le note (p37) citano tre esempi della classe più generale di finestre: le gaussiane (*Gaussian windows*), kernel lisci che riducono le discontinuità; il kernel di Epanechnikov (*Epanechnikov kernels*), che minimizza l'errore quadratico medio integrato (*mean integrated squared error*); le triangolari (*triangular windows*), lineari a tratti. Solo per Epanechnikov la fonte non dà la formula: questa è la forma standard di letteratura. Profilo parabolico sul supporto $[-1, 1]$, picco $3/4$ nell'origine. Il fattore $3/4$ porta l'area a 1: $\int_{-1}^{1} \tfrac34 (1 - x^2)\,dx = \tfrac34 \cdot \tfrac43 = 1$.`,
    symbols: [
      { s: md`\tfrac{3}{4}(1-x^2)`, meaning: md`profilo parabolico del kernel sul supporto $\vert x \vert \le 1$` },
      { s: md`\tfrac{3}{4}`, meaning: md`costante di normalizzazione: rende l'area uguale a 1` },
    ],
    whenToUse: md`Solo se all'orale ti chiedono altri esempi di finestre oltre a rettangolare, triangolare e gaussiana.`,
    pitfalls: md`Non è nelle slide. Le note dicono anche che il gaussiano offre in genere il miglior compromesso tra bias e varianza (p41): le due affermazioni non sono armonizzate nella fonte.`,
    importance: 1,
    blanks: [],
    source: [{ doc: 'part1', page: 37 }],
  },

  // --- c15 Stima di Parzen generale ---------------------------------------------------------------
  {
    id: 'f-c15',
    name: 'Stima a finestre di Parzen (forma generale)',
    nameEn: 'Parzen window estimate (general form)',
    latex: md`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)`,
    explain: md`La formula da saper scrivere all'orale. Ammetti finestre generali al posto dell'ipercubo e la stima di $p(\mathbf{x})$ diventa una media di funzioni di $\mathbf{x}$ e dei campioni (*an average of functions of x and the samples*). Ogni campione $\mathbf{x}_k$ appoggia su di sé un kernel di larghezza $h$, diviso per il volume $V(h)$; la stima in $\mathbf{x}$ è la media delle $N$ altezze lette in $\mathbf{x}$. Ora la stima è definita in ogni punto $\mathbf{x}$, non più solo in $\mathbf{x}^*$, e ogni campione contribuisce in base alla sua distanza da $\mathbf{x}$ (interpolazione). Nel classificatore salmone contro spigola la usi per stimare $p(x \mid \omega_i)$ della luminosità di ciascuna classe, senza supporre che sia gaussiana.`,
    symbols: [
      { s: md`\hat{p}(\mathbf{x})`, meaning: md`stima di Parzen della pdf nel punto generico $\mathbf{x}$` },
      { s: md`V(h)`, meaning: md`volume della finestra (kernel) di larghezza $h$; con l'ipercubo $V(h) = h^n$` },
      { s: md`\gamma(\cdot)`, meaning: md`funzione finestra di Parzen o kernel: pesa il contributo di $\mathbf{x}_k$ in base alla distanza da $\mathbf{x}$` },
      { s: md`h`, meaning: md`larghezza della finestra (*width*, *bandwidth*, *smoothing parameter*)` },
      { s: md`N`, meaning: md`numero totale di training samples` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo training sample (il testo della slide li chiama $\mathbf{x}_i$)` },
    ],
    whenToUse: md`Quando la forma della pdf è ignota e hai abbastanza campioni: per esempio per le densità condizionate alle classi di un classificatore bayesiano. È la risposta a «Parzen window estimation: context, properties».`,
    pitfalls: md`$V(h)$ non è libero: perché la stima abbia area 1 deve valere $V(h) = h^n$ (slide p54). L'argomento del kernel è diviso per $h$, non per $V(h)$.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\gamma\left(\boxed{\;?\;}\right)`,
        answer: md`\frac{\mathbf{x}-\mathbf{x}_k}{h}`,
        distractors: [md`\mathbf{x}-\mathbf{x}_k`, md`\frac{\mathbf{x}}{h}`, md`h\,(\mathbf{x}-\mathbf{x}_k)`],
      },
      {
        masked: md`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\boxed{\;?\;}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)`,
        answer: md`\frac{1}{V(h)}`,
        distractors: [md`V(h)`, md`\frac{1}{N\,V(h)}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 53 },
      { doc: 'part1', page: 38 },
    ],
  },

  // --- c19 La stima deve essere una densità -------------------------------------------------------
  {
    id: 'f-c19',
    name: 'Non negatività della stima',
    nameEn: 'Non-negativity of the estimate',
    latex: md`\hat{p}(x)\ge 0\quad \forall x`,
    explain: md`Prima condizione perché la stima sia una densità legittima (*legitimate density function*): non può essere negativa in nessun punto (*non-negativity*). Le note la scrivono nel caso scalare. Con una densità negativa da qualche parte, integrando su quell'intervallo otterresti una probabilità negativa.`,
    symbols: [
      { s: md`\hat{p}(x)`, meaning: md`stima di Parzen della pdf nel punto $x$` },
      { s: md`\forall x`, meaning: md`la condizione vale in ogni punto, non solo sui campioni` },
    ],
    whenToUse: md`Quando all'orale ti chiedono quali proprietà deve avere la stima: la prima delle due.`,
    pitfalls: md`La slide scrive $p(\mathbf{x})$ senza cappello (*the estimate p(x) be a legitimate density function*), ma parla della stima $\hat{p}(\mathbf{x})$.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 53 },
      { doc: 'part1', page: 38 },
    ],
  },
  {
    id: 'f-c19-2',
    name: 'Normalizzazione della stima',
    nameEn: 'Normalization: the estimate integrates to one',
    latex: md`\int_{-\infty}^{+\infty}\hat{p}(x)\,dx=1`,
    explain: md`Seconda condizione (*normalization*, *integrate to one*): l'area sotto la stima vale 1 su tutta la retta. Senza, non potresti calcolare probabilità come aree sotto $\hat{p}$ né usarla come densità condizionata alla classe in un classificatore bayesiano. Le note (p38) la scrivono nel caso 1-D.`,
    symbols: [
      { s: md`\int_{-\infty}^{+\infty}`, meaning: md`integrale su tutta la retta reale, cioè su tutto lo spazio delle feature quando $n = 1$` },
      { s: md`\hat{p}(x)`, meaning: md`stima di Parzen della pdf` },
    ],
    whenToUse: md`Insieme alla non negatività, per dire che cosa significa «densità legittima».`,
    pitfalls: md`In $n$ dimensioni l'integrale va esteso a tutto $\Re^n$ (formula seguente).`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 53 },
      { doc: 'part1', page: 38 },
    ],
  },
  {
    id: 'f-c19-3',
    name: 'Densità legittima in n dimensioni',
    nameEn: 'Legitimate density in n dimensions',
    latex: md`\hat{p}(\mathbf{x})\ge 0\quad \forall\,\mathbf{x}\in\Re^n,\qquad \int_{\Re^n}\hat{p}(\mathbf{x})\,d\mathbf{x}=1`,
    explain: md`Le due condizioni insieme, sullo spazio delle feature $\Re^n$: non negativa ovunque, integrale 1 su tutto lo spazio. È la forma coerente con le condizioni sul kernel di slide p54, anch'esse in $\Re^n$. Non devi imporle a mano: le ottieni se il kernel è una densità e se tieni $V = h^n$ (derivazione [«la stima è una densità»](#derivation:der02)).`,
    symbols: [
      { s: md`\Re^n`, meaning: md`spazio delle feature $n$-dimensionale su cui integri (in 1-D la retta da $-\infty$ a $+\infty$)` },
      { s: md`d\mathbf{x}`, meaning: md`elemento di volume in $\Re^n$` },
    ],
    whenToUse: md`Quando imposti la dimostrazione che la stima di Parzen è una densità: è la tesi da raggiungere.`,
    pitfalls: md`Questa forma è aggiunta per coerenza: le note scrivono solo il caso scalare.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 53 },
      { doc: 'ch2', page: 54 },
      { doc: 'part1', page: 38 },
    ],
  },

  // --- c20 Condizioni sul kernel ------------------------------------------------------------------
  {
    id: 'f-c20',
    name: 'Il kernel deve essere una densità',
    nameEn: 'The window function must be a density',
    latex: md`\gamma(\mathbf{x})\ge 0\quad \forall\,\mathbf{x}\in\Re^n,\qquad \int_{\Re^n}\gamma(\mathbf{x})\,d\mathbf{x}=1`,
    explain: md`Per garantire che la stima sia una densità legittima chiedi che lo sia la finestra (*requiring the window function itself be a density function*): non negativa in tutto $\Re^n$ e con integrale 1. I sei kernel delle slide p58-59 rispettano entrambe le condizioni: il fattore $1/\sqrt{2\pi}$ del gaussiano e $1/\pi$ del Cauchy sono costanti di normalizzazione. Se in più mantieni $V = h^n$, la stima eredita le due proprietà (*it follows at once*).`,
    symbols: [
      { s: md`\gamma(\mathbf{x})`, meaning: md`funzione finestra (kernel) valutata in $\mathbf{x}$` },
      { s: md`\Re^n`, meaning: md`spazio delle feature $n$-dimensionale` },
      { s: md`\forall\,\mathbf{x}\in\Re^n`, meaning: md`la non negatività vale in ogni punto dello spazio, non solo sui campioni` },
    ],
    whenToUse: md`Quando giustifichi la scelta di un kernel: prima di tutto deve essere una densità.`,
    pitfalls: md`Una funzione che integra a 1 ma scende sotto zero non va bene: la stima potrebbe diventare negativa. Per questo il kernel sinc delle note compare al quadrato. Nella slide $x$ è in corsivo non grassetto anche se è un vettore di $\Re^n$: qui è trascritto in grassetto, coerente con il resto del capitolo.`,
    importance: 3,
    blanks: [
      {
        masked: md`\gamma(\mathbf{x})\ge 0\quad \forall\,\mathbf{x}\in\Re^n,\qquad \int_{\Re^n}\gamma(\mathbf{x})\,d\mathbf{x}=\boxed{\;?\;}`,
        answer: md`1`,
        distractors: [md`h^n`, md`\frac{1}{N}`],
      },
      {
        masked: md`\gamma(\mathbf{x})\,\boxed{\;?\;}\quad \forall\,\mathbf{x}\in\Re^n,\qquad \int_{\Re^n}\gamma(\mathbf{x})\,d\mathbf{x}=1`,
        answer: md`\ge 0`,
        distractors: [md`\le 1`, md`= 1`],
      },
    ],
    source: [
      { doc: 'ch2', page: 54 },
      { doc: 'part1', page: 38 },
    ],
  },

  // --- c21 La stima eredita le proprietà ----------------------------------------------------------
  {
    id: 'f-c21',
    name: 'Ogni finestra riscalata ha area 1',
    nameEn: 'Each rescaled window integrates to one',
    latex: md`\int_{\Re^n}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)d\mathbf{x}=\int_{\Re^n}\gamma(\mathbf{u})\,d\mathbf{u}=1`,
    explain: md`Cambio di variabile $\mathbf{u} = (\mathbf{x} - \mathbf{x}_k)/h$: ogni componente si dilata di un fattore $h$, quindi $d\mathbf{x} = h^n\, d\mathbf{u}$ (lo Jacobiano). Quel $h^n$ cancella l'$1/h^n$ davanti e resta l'integrale del kernel, che vale 1 per ipotesi. Il fattore $1/V = 1/h^n$ compensa l'allargamento della finestra: se allarghi $h$ senza abbassare l'altezza, l'area cresce come $h^n$. La slide dice solo *it follows at once*: i passaggi sono ricostruiti nella derivazione [«la stima è una densità»](#derivation:der02).`,
    symbols: [
      { s: md`\mathbf{u}=\frac{\mathbf{x}-\mathbf{x}_k}{h}`, meaning: md`variabile di integrazione centrata sul campione e riscalata` },
      { s: md`d\mathbf{x}=h^n\,d\mathbf{u}`, meaning: md`Jacobiano di una dilatazione di fattore $h$ in $n$ dimensioni` },
      { s: md`V=h^n`, meaning: md`volume di normalizzazione: il fattore $1/V$ cancella lo Jacobiano` },
    ],
    whenToUse: md`Per dimostrare all'orale che la stima di Parzen integra a 1: è il passo centrale.`,
    pitfalls: md`In $n$ dimensioni lo Jacobiano è $h^n$, non $h$: se scrivi $d\mathbf{x} = h\,d\mathbf{u}$, l'area viene $h^{1-n}$ invece di 1.`,
    importance: 2,
    blanks: [
      {
        masked: md`\int_{\Re^n}\boxed{\;?\;}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)d\mathbf{x}=\int_{\Re^n}\gamma(\mathbf{u})\,d\mathbf{u}=1`,
        answer: md`\frac{1}{h^n}`,
        distractors: [md`h^n`, md`\frac{1}{N h^n}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 54 },
      { doc: 'part1', page: 39 },
    ],
  },
  {
    id: 'f-c21-2',
    name: 'La stima integra a 1',
    nameEn: 'The estimate integrates to one',
    latex: md`\int_{\Re^n}\hat{p}(\mathbf{x})\,d\mathbf{x}=\frac{1}{N}\sum_{k=1}^{N}1=1`,
    explain: md`Scambi integrale e somma (linearità): l'integrale della stima è la media degli integrali delle $N$ finestre riscalate, e ognuno vale 1. La media di $N$ uni fa 1. La non negatività segue ancora prima: sommi termini non negativi moltiplicati per costanti positive. Con $\gamma$ densità e $V = h^n$ la stima è quindi una densità legittima per ogni $h > 0$ e per ogni insieme di campioni.`,
    symbols: [
      { s: md`\frac{1}{N}\sum_{k=1}^{N}1`, meaning: md`media di $N$ integrali, ciascuno uguale a 1` },
      { s: md`\Re^n`, meaning: md`spazio delle feature su cui integri` },
    ],
    whenToUse: md`Come conclusione della dimostrazione: la stima di Parzen soddisfa le condizioni della slide p53.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 54 },
      { doc: 'part1', page: 39 },
    ],
  },

  // --- c22 Massimo nell'origine -------------------------------------------------------------------
  {
    id: 'f-c22',
    name: "Massimo nell'origine",
    nameEn: 'Maximal value at the origin',
    latex: md`\gamma(\mathbf{0})=\max_{\mathbf{x}}\gamma(\mathbf{x})`,
    explain: md`Prima delle condizioni aggiuntive per una stima «buona» (*additional conditions to get a good estimate*): il kernel raggiunge il massimo nell'origine (*takes a maximal value at the origin*). Il contributo di un campione è massimo quando $\mathbf{x}$ coincide con lui, cioè in $\mathbf{x} - \mathbf{x}_k = \mathbf{0}$: i punti più vicini al campione pesano di più. Le note leggono qui il passaggio dal semplice conteggio a metodi che tengono conto della vicinanza (similarità) tra punti. Rettangolare, triangolare e gaussiano hanno tutti il massimo in 0.`,
    symbols: [
      { s: md`\gamma(\mathbf{0})`, meaning: md`valore del kernel nell'origine, cioè quando $\mathbf{x}$ coincide con il campione $\mathbf{x}_k$` },
      { s: md`\max_{\mathbf{x}}`, meaning: md`valore massimo del kernel su tutto lo spazio` },
    ],
    whenToUse: md`Quando elenchi all'orale le tre condizioni per una buona stima (massimo in 0, continuità, decadimento a zero).`,
    pitfalls: md`La slide e le note enunciano la condizione a parole: la formula ne è la traduzione.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 54 },
      { doc: 'part1', page: 39 },
    ],
  },
  {
    id: 'f-c22-2',
    name: 'Il campione sta nel picco del suo kernel',
    nameEn: 'The sample lies at the peak of its own kernel',
    latex: md`\mathbf{x}_k\in\arg\max_{\mathbf{x}}\ \gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)`,
    explain: md`La stessa condizione vista dal campione: il kernel appoggiato su $\mathbf{x}_k$ ha il picco sul campione stesso. Scrivi «appartiene all'argmax» e non «è uguale» perché il massimo può non essere unico: il kernel rettangolare vale 1 su tutto il supporto, quindi ogni punto della finestra è di massimo.`,
    symbols: [
      { s: md`\arg\max_{\mathbf{x}}`, meaning: md`insieme dei punti in cui la funzione raggiunge il massimo (può contenerne più d'uno)` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo training sample, centro del suo kernel` },
    ],
    whenToUse: md`Quando disegni i kernel sui campioni: ogni campana ha la cima sul suo campione.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 54 },
      { doc: 'part1', page: 39 },
    ],
  },

  // --- c24 Decadimento a zero ---------------------------------------------------------------------
  {
    id: 'f-c24',
    name: 'Decadimento a zero (forma della slide)',
    nameEn: 'Decay to zero',
    latex: md`\gamma(\mathbf{x})\to 0\ \text{ as }\ \mathbf{x}\to+\infty`,
    explain: md`Terza condizione aggiuntiva (*decay to zero*): il kernel tende a zero lontano dall'origine. Così un campione lontano da $\mathbf{x}$ ha influenza trascurabile sulla stima in $\mathbf{x}$: i punti lontani devono contribuire meno. Con il kernel gaussiano, a distanza $3h$ dal campione il contributo vale $e^{-4.5} \approx 0.011$ volte il picco, circa l'1%.`,
    symbols: [
      { s: md`\gamma(\mathbf{x})`, meaning: md`kernel valutato in $\mathbf{x}$` },
      { s: md`\mathbf{x}\to+\infty`, meaning: md`scrittura della slide sul vettore: va letta come norma di $\mathbf{x}$ che tende a infinito` },
    ],
    whenToUse: md`Terza voce dell'elenco delle condizioni per una buona stima.`,
    pitfalls: md`Questa è la forma letterale della slide. Un vettore non tende a $+\infty$: la forma rigorosa usa la norma (formula seguente).`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 54 },
      { doc: 'part1', page: 39 },
    ],
  },
  {
    id: 'f-c24-2',
    name: 'Decadimento a zero (forma rigorosa)',
    nameEn: 'Decay to zero (rigorous form)',
    latex: md`\lim_{\|\mathbf{x}\|\to+\infty}\gamma(\mathbf{x})=0`,
    explain: md`Tende all'infinito la norma del vettore: in ogni direzione, allontanandoti dall'origine, il kernel si spegne. Rettangolare e triangolare soddisfano la condizione in modo banale, perché valgono zero fuori dal supporto. Gaussiano, esponenziale e Cauchy la soddisfano con code che scendono senza mai toccare zero.`,
    symbols: [
      { s: md`\|\mathbf{x}\|`, meaning: md`norma euclidea di $\mathbf{x}$, la distanza dall'origine` },
      { s: md`\lim_{\|\mathbf{x}\|\to+\infty}`, meaning: md`limite per distanza dall'origine che cresce senza limite, in qualunque direzione` },
    ],
    whenToUse: md`Quando vuoi scrivere la terza condizione in modo corretto, o controllare se un kernel la rispetta.`,
    pitfalls: md`Scendere a zero non basta a dare lo stesso comportamento: il Cauchy scende come $1/x^2$, più lento del gaussiano, e dà più peso ai campioni lontani. Le note lo consigliano per distribuzioni con outlier o code pesanti.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 54 },
      { doc: 'part1', page: 39 },
    ],
  },

  // --- c25 Funzione δ(x) --------------------------------------------------------------------------
  {
    id: 'f-c25',
    name: 'Finestra riscalata δ(x)',
    nameEn: 'Rescaled window δ(x)',
    latex: md`\delta(\mathbf{x})=\frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}}{h}\right)`,
    explain: md`Per studiare l'effetto della larghezza $h$ sulla stima (*window width effect*) definisci $\delta(\mathbf{x})$: il kernel stirato in larghezza (argomento $\mathbf{x}/h$) e riscalato in altezza (fattore $1/V(h)$). Con $V(h) = h^n$ la sua area resta 1 per ogni $h$, e tutta la dipendenza da $h$ finisce dentro $\delta$. Esempio: kernel gaussiano 1-D con $h = 0.5$, il picco vale $\delta(0) = \frac{1}{0.5} \cdot 0.399 \approx 0.798$.`,
    symbols: [
      { s: md`\delta(\mathbf{x})`, meaning: md`finestra riscalata di larghezza $h$ e area unitaria (non la delta di Dirac)` },
      { s: md`V(h)`, meaning: md`volume della finestra, $h^n$` },
      { s: md`\gamma(\mathbf{x}/h)`, meaning: md`kernel allargato di un fattore $h$ in ogni direzione` },
    ],
    whenToUse: md`Quando all'orale devi spiegare come la scelta di $h$ cambia la stima: parli di una sola $\delta$ e poi ne sovrapponi $N$.`,
    pitfalls: md`Non è la delta di Dirac: lo diventa solo nel limite $h \to 0$ (slide p60). La slide usa lo stesso simbolo per i due oggetti. Nella frase *the effect that the window width h has on p(x)* la slide scrive $p(\mathbf{x})$ ma intende la stima $\hat{p}(\mathbf{x})$.`,
    importance: 2,
    blanks: [
      {
        masked: md`\delta(\mathbf{x})=\frac{1}{V(h)}\gamma\left(\boxed{\;?\;}\right)`,
        answer: md`\frac{\mathbf{x}}{h}`,
        distractors: [md`h\,\mathbf{x}`, md`\frac{\mathbf{x}-\mathbf{x}_k}{h}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 55 },
      { doc: 'part1', page: 39 },
    ],
  },

  // --- c26 Media di funzioni δ --------------------------------------------------------------------
  {
    id: 'f-c26',
    name: 'Stima come media di finestre traslate',
    nameEn: 'Estimate as the average of shifted windows',
    latex: md`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\delta(\mathbf{x}-\mathbf{x}_k)`,
    explain: md`Con la $\delta$ appena definita la stima diventa una media (*the estimate as the average*): $N$ copie della stessa finestra riscalata, ciascuna traslata su un campione $\mathbf{x}_k$. Per capire come $h$ cambia la stima ti basta guardare come cambia una sola $\delta$ e poi sovrapporne $N$. Esempio: due campioni in 0 e 1, kernel gaussiano, $h = 1$. In $x = 0.5$ le due campane danno lo stesso contributo: $\hat{p}(0.5) = \tfrac12[\delta(0.5) + \delta(-0.5)] = \tfrac{1}{\sqrt{2\pi}}e^{-1/8} \approx 0.352$.`,
    symbols: [
      { s: md`\delta(\mathbf{x}-\mathbf{x}_k)`, meaning: md`finestra riscalata traslata sul campione $\mathbf{x}_k$ (a $h$ finito non è la delta di Dirac)` },
      { s: md`N`, meaning: md`numero di training samples` },
    ],
    whenToUse: md`Quando disegni la stima come sovrapposizione di campane, una per campione: il cuore della risposta su «how the choice of the width impacts our estimate».`,
    pitfalls: md`Il fattore $1/h^n$ è già dentro $\delta$: davanti alla somma resta solo $1/N$. Scrivere $\frac{1}{N h^n}\sum_k \delta(\cdot)$ conta il volume due volte.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\delta(\boxed{\;?\;})`,
        answer: md`\mathbf{x}-\mathbf{x}_k`,
        distractors: [md`\frac{\mathbf{x}-\mathbf{x}_k}{h}`, md`\mathbf{x}`],
      },
      {
        masked: md`\hat{p}(\mathbf{x})=\boxed{\;?\;}\sum_{k=1}^{N}\delta(\mathbf{x}-\mathbf{x}_k)`,
        answer: md`\frac{1}{N}`,
        distractors: [md`\frac{1}{N h^n}`, md`1`],
      },
    ],
    source: [
      { doc: 'ch2', page: 55 },
      { doc: 'part1', page: 39 },
    ],
  },

  // --- c27 h su ampiezza e larghezza di δ ---------------------------------------------------------
  {
    id: 'f-c27',
    name: 'Picco della finestra riscalata',
    nameEn: 'Peak of the rescaled window',
    latex: md`\delta(\mathbf{0})=\frac{1}{h^n}\gamma(\mathbf{0})`,
    explain: md`Con $V(h) = h^n$ il picco di $\delta$ vale $\gamma(\mathbf{0})/h^n$: in 2-D, se dimezzi $h$ il picco quadruplica. $h$ agisce insieme sull'ampiezza (fattore $1/h^n$) e sulla larghezza (argomento $\mathbf{x}/h$). Con $h$ grande $\delta$ è bassa, larga e varia piano: $\hat{p}$ sovrappone $N$ funzioni larghe e viene molto liscia. Con $h$ piccolo $\delta$ è un picco alto e stretto: $\hat{p}$ diventa una fila di impulsi sui campioni. Per $h \to 0$, $\delta(\mathbf{x} - \mathbf{x}_k)$ tende alla delta di Dirac centrata in $\mathbf{x}_k$.`,
    symbols: [
      { s: md`\delta(\mathbf{0})`, meaning: md`picco della finestra riscalata; cresce come $1/h^n$ quando $h$ diminuisce` },
      { s: md`\gamma(\mathbf{0})`, meaning: md`picco del kernel originale (per il gaussiano 1-D, $1/\sqrt{2\pi} \approx 0.399$)` },
      { s: md`h^n`, meaning: md`volume della finestra: divide il picco` },
    ],
    whenToUse: md`Per spiegare con un numero perché $h$ piccolo produce aghi e $h$ grande una pianura.`,
    pitfalls: md`L'esponente è la dimensione $n$: in 2-D ridurre $h$ di 5 volte alza il picco di 25 volte, non di 5.`,
    importance: 3,
    blanks: [
      {
        masked: md`\delta(\mathbf{0})=\boxed{\;?\;}\gamma(\mathbf{0})`,
        answer: md`\frac{1}{h^n}`,
        distractors: [md`h^n`, md`\frac{1}{N h^n}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 55 },
      { doc: 'ch2', page: 56 },
      { doc: 'part1', page: 39 },
    ],
  },
  {
    id: 'f-c27-2',
    name: 'Area costante della finestra riscalata',
    nameEn: 'Unit area for every window width',
    latex: md`\int_{\Re^n}\delta(\mathbf{x})\,d\mathbf{x}=1\quad \forall h>0`,
    explain: md`Mentre il picco sale come $1/h^n$ e la larghezza scende come $h$, l'area resta 1 per ogni $h > 0$: l'altezza compensa la larghezza. Per questo la stima resta una densità qualunque $h$ tu scelga. Nella figura di slide p56 il volume sotto le tre campane ($h = 1,\ 0.5,\ 0.2$) è sempre 1.`,
    symbols: [
      { s: md`h>0`, meaning: md`larghezza della finestra: l'area di $\delta$ resta 1 per ogni valore` },
      { s: md`\Re^n`, meaning: md`spazio delle feature su cui integri` },
    ],
    whenToUse: md`Insieme al picco $\gamma(\mathbf{0})/h^n$: $h$ cambia la forma, non la massa.`,
    pitfalls: md`Area costante non vuol dire stima invariata: la stessa massa distribuita in modo diverso cambia la forma della stima.`,
    importance: 3,
    blanks: [
      {
        masked: md`\int_{\Re^n}\delta(\mathbf{x})\,d\mathbf{x}=\boxed{\;?\;}\quad \forall h>0`,
        answer: md`1`,
        distractors: [md`h^n`, md`\frac{1}{h^n}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 55 },
      { doc: 'ch2', page: 56 },
      { doc: 'part1', page: 39 },
    ],
  },

  // --- c31 Finestre normali 2-D -------------------------------------------------------------------
  {
    id: 'f-c31',
    name: 'Finestra normale 2-D a simmetria circolare',
    nameEn: '2-D circularly symmetric normal Parzen window',
    latex: md`\delta(\mathbf{x})=\frac{1}{2\pi h^2}\exp\left(-\frac{\|\mathbf{x}\|^2}{2h^2}\right)`,
    explain: md`Applichi $\delta(\mathbf{x}) = \frac{1}{V(h)}\gamma(\mathbf{x}/h)$ alla normale standard bidimensionale $\gamma(\mathbf{u}) = \frac{1}{2\pi} e^{-\Vert\mathbf{u}\Vert^2/2}$ con $V(h) = h^2$. Esce una gaussiana 2-D con deviazione standard $h$ in ogni direzione. Dipende solo dalla distanza dall'origine, quindi le curve di livello sono cerchi (*circularly symmetric*). La slide p56 mostra solo i grafici: questa formula li ricostruisce e ne riproduce le scale verticali.`,
    symbols: [
      { s: md`\frac{1}{2\pi h^2}`, meaning: md`picco della finestra: $1/(2\pi)$ della normale standard 2-D diviso il volume $V(h) = h^2$` },
      { s: md`\|\mathbf{x}\|^2`, meaning: md`quadrato della distanza euclidea dall'origine: la finestra dipende solo da questo (simmetria circolare)` },
      { s: md`h`, meaning: md`larghezza della finestra, qui la deviazione standard della campana in ogni direzione` },
    ],
    whenToUse: md`Quando disegni all'orale una finestra 2-D, per esempio sulle due feature del pesce: una campana rotonda che si stringe e si alza al calare di $h$.`,
    pitfalls: md`In 2-D il fattore è $1/(2\pi h^2)$, non $1/(\sqrt{2\pi}\,h)$ come in 1-D: la normalizzazione dipende dalla dimensione.`,
    importance: 2,
    blanks: [
      {
        masked: md`\delta(\mathbf{x})=\frac{1}{\boxed{\;?\;}}\exp\left(-\frac{\|\mathbf{x}\|^2}{2h^2}\right)`,
        answer: md`2\pi h^2`,
        distractors: [md`\sqrt{2\pi}\,h`, md`2\pi h`],
      },
    ],
    source: [
      { doc: 'ch2', page: 56 },
      { doc: 'part1', page: 39 },
      { doc: 'part1', page: 40 },
    ],
  },
  {
    id: 'f-c31-2',
    name: 'Picchi delle tre finestre della figura',
    nameEn: 'Peaks of the three windows in the figure',
    latex: md`\delta(\mathbf{0})=\frac{1}{2\pi h^2}\approx 0.159,\ 0.637,\ 3.98\quad (h=1,\ 0.5,\ 0.2)`,
    explain: md`Con $h = 1,\ 0.5,\ 0.2$ il picco vale $1/(2\pi) \approx 0.159$, $4/(2\pi) \approx 0.637$ e $25/(2\pi) \approx 3.98$: sono le scale verticali lette sui grafici di slide p56 (0.15, 0.6, 4). Riduci $h$ di un fattore 5 e il picco cresce di 25, perché in 2-D conta $h^2$.`,
    symbols: [
      { s: md`\delta(\mathbf{0})`, meaning: md`altezza della campana nel suo centro` },
      { s: md`h=1,\ 0.5,\ 0.2`, meaning: md`le tre larghezze della figura` },
    ],
    whenToUse: md`Per leggere la figura con i numeri: il volume resta 1, il picco cresce come $1/h^2$.`,
    pitfalls: md`I valori sono ricostruiti dalla formula: la slide mostra solo i tre grafici.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 56 },
      { doc: 'part1', page: 40 },
    ],
  },

  // --- c32 Tre stime sugli stessi cinque campioni -------------------------------------------------
  {
    id: 'f-c32',
    name: 'Tre stime di Parzen sugli stessi cinque campioni',
    nameEn: 'Three Parzen estimates from the same five samples',
    latex: md`\hat{p}(\mathbf{x})=\frac{1}{5}\sum_{k=1}^{5}\delta(\mathbf{x}-\mathbf{x}_k),\qquad \delta(\mathbf{x})=\frac{1}{2\pi h^2}\exp\left(-\frac{\|\mathbf{x}\|^2}{2h^2}\right),\qquad h\in\{1,\ 0.5,\ 0.2\}`,
    explain: md`La figura di slide p57: stessi cinque campioni 2-D, tre valori di $h$. Con $h = 1$ le campane si fondono in due rilievi larghi e bassi e i singoli campioni spariscono: è l'*oversmoothing*. Con $h = 0.5$ vedi cinque campane distinte, le tre vicine in parte sovrapposte. Con $h = 0.2$ restano cinque aghi isolati con densità quasi nulla in mezzo: la stima insegue i campioni (*overfitting*). Stessi dati, stime diverse: con $N = 5$ nessun $h$ è quello giusto.`,
    symbols: [
      { s: md`\mathbf{x}_k,\ k=1,\dots,5`, meaning: md`i cinque campioni 2-D della figura (tre ravvicinati a sinistra, due isolati a destra)` },
      { s: md`h`, meaning: md`larghezza comune delle cinque finestre: 1, 0.5 oppure 0.2` },
      { s: md`\frac{1}{5}`, meaning: md`il fattore $1/N$ con $N = 5$` },
    ],
    whenToUse: md`Per rispondere a «how the choice of the width impacts our estimate» con un disegno: stessi punti, tre larghezze, tre paesaggi.`,
    pitfalls: md`La formula è ricostruita (la slide mostra solo i grafici). Le scale verticali della figura (circa 0.2, 0.6 e 3) tornano con la somma delle cinque finestre senza il fattore $1/5$: non usarle come valori di $\hat{p}$. Le posizioni dei campioni non si leggono con esattezza.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x})=\boxed{\;?\;}\sum_{k=1}^{5}\delta(\mathbf{x}-\mathbf{x}_k)`,
        answer: md`\frac{1}{5}`,
        distractors: [md`\frac{1}{5h^2}`, md`1`],
      },
    ],
    source: [
      { doc: 'ch2', page: 57 },
      { doc: 'part1', page: 40 },
    ],
  },

  // --- c33 Kernel rettangolare --------------------------------------------------------------------
  {
    id: 'f-c33',
    name: 'Kernel rettangolare',
    nameEn: 'Rectangular kernel',
    latex: md`\gamma(x)=\Pi(x)`,
    explain: md`Il caso 1-D della finestra a ipercubo. Dà peso uguale a tutti i campioni dentro la finestra e peso zero a quelli fuori: scelta semplice ma spesso rozza (*simple but often crude*) per stimare una densità (note p40). La stima che produce è a gradini.`,
    symbols: [
      { s: md`\Pi(x)`, meaning: md`funzione rettangolo con supporto $[-1/2, 1/2]$` },
    ],
    whenToUse: md`Come primo esempio di kernel, per collegare le finestre generali al conteggio nell'ipercubo.`,
    pitfalls: md`È una densità valida ma non è continua: viola la seconda condizione per una buona stima (slide p54), e infatti la stima esce a gradini.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 58 },
      { doc: 'part1', page: 40 },
    ],
  },
  {
    id: 'f-c33-2',
    name: 'Funzione rettangolo',
    nameEn: 'Rectangle function',
    latex: md`\Pi(x)=\begin{cases}1, & |x|\le \tfrac{1}{2}\\ 0, & \text{altrove}\end{cases}`,
    explain: md`Altezza 1 sul supporto $[-1/2, 1/2]$, zero altrove: area $1 \cdot 1 = 1$. La slide non scrive la definizione; questa è quella standard, coerente con la condizione $\int \gamma = 1$.`,
    symbols: [
      { s: md`\Pi(x)`, meaning: md`funzione rettangolo: indicatrice dell'intervallo $[-1/2, 1/2]$` },
      { s: md`|x|\le \tfrac{1}{2}`, meaning: md`supporto di larghezza 1 centrato nell'origine` },
    ],
    whenToUse: md`Quando devi calcolare a mano una stima con finestra rettangolare, o verificare che il kernel abbia area 1.`,
    pitfalls: md`Il grafico di slide p58 mette l'etichetta 1/2 accanto all'altezza con supporto $[-1/2, 1/2]$: l'area verrebbe $1/2$, in contrasto con $\int \gamma = 1$. Tieni altezza 1 su $[-1/2, 1/2]$ (oppure altezza 1/2 su $[-1, 1]$).`,
    importance: 2,
    blanks: [
      {
        masked: md`\Pi(x)=\begin{cases}\boxed{\;?\;}, & |x|\le \tfrac{1}{2}\\ 0, & \text{altrove}\end{cases}`,
        answer: md`1`,
        distractors: [md`\tfrac{1}{2}`, md`2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 58 },
      { doc: 'part1', page: 40 },
    ],
  },

  // --- c34 Kernel triangolare ---------------------------------------------------------------------
  {
    id: 'f-c34',
    name: 'Kernel triangolare',
    nameEn: 'Triangular kernel',
    latex: md`\gamma(x)=\Lambda(x)`,
    explain: md`Attenuazione lineare (*linear tapering*): il peso di un campione cala in linea retta con la distanza dal centro, quindi i punti vicini pesano di più. Rispetto al rettangolare produce stime più lisce (note p40): continue, anche se con spigoli nei punti in cui cambia la pendenza.`,
    symbols: [
      { s: md`\Lambda(x)`, meaning: md`funzione triangolo con supporto $[-1, 1]$ e picco 1 nell'origine` },
    ],
    whenToUse: md`Come secondo esempio di kernel: rispetta le tre condizioni per una buona stima, a differenza del rettangolare.`,
    pitfalls: md`È continua ma non derivabile nell'origine e in $\pm 1$: la stima eredita spigoli, a differenza di quella gaussiana.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 58 },
      { doc: 'part1', page: 40 },
    ],
  },
  {
    id: 'f-c34-2',
    name: 'Funzione triangolo',
    nameEn: 'Triangle function',
    latex: md`\Lambda(x)=\begin{cases}1-|x|, & |x|\le 1\\ 0, & \text{altrove}\end{cases}`,
    explain: md`Picco 1 nell'origine, supporto $[-1, 1]$: area $\tfrac12 \cdot 2 \cdot 1 = 1$. La slide non scrive la definizione; questa è quella standard, coerente con il grafico di slide p58.`,
    symbols: [
      { s: md`\Lambda(x)`, meaning: md`funzione triangolo` },
      { s: md`1-|x|`, meaning: md`profilo lineare: vale 1 nell'origine e 0 ai bordi del supporto` },
    ],
    whenToUse: md`Quando calcoli a mano il contributo di un campione con peso decrescente in linea retta.`,
    pitfalls: md`Il supporto è largo 2, non 1 come quello del rettangolo: a parità di $h$ la finestra triangolare copre il doppio.`,
    importance: 2,
    blanks: [
      {
        masked: md`\Lambda(x)=\begin{cases}1-\boxed{\;?\;}, & |x|\le 1\\ 0, & \text{altrove}\end{cases}`,
        answer: md`|x|`,
        distractors: [md`x`, md`x^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 58 },
      { doc: 'part1', page: 40 },
    ],
  },

  // --- c35 Kernel gaussiano -----------------------------------------------------------------------
  {
    id: 'f-c35',
    name: 'Kernel gaussiano (1-D)',
    nameEn: 'Gaussian kernel',
    latex: md`\gamma(x)=\frac{1}{\sqrt{2\pi}}\exp\left(-\frac{x^2}{2}\right)`,
    explain: md`La normale standard, con media 0 e varianza 1. È la risposta a «Which is the most common window function (write the formula)?». Le note (p40-41) lo indicano come il kernel più usato per la sua regolarità (*smoothness*): la stima esce continua e derivabile. Il peso dei campioni cala in modo esponenziale con il quadrato della distanza. Rispetta tutte le condizioni: è una densità, ha il massimo in 0 pari a $1/\sqrt{2\pi} \approx 0.399$, è continuo e tende a 0.`,
    symbols: [
      { s: md`\frac{1}{\sqrt{2\pi}}`, meaning: md`costante di normalizzazione della normale standard (area 1) e valore massimo del kernel` },
      { s: md`x^2/2`, meaning: md`metà del quadrato della distanza dal centro: il peso scende come $e^{-x^2/2}$` },
    ],
    whenToUse: md`Kernel di default per la stima di Parzen; in $n$ dimensioni diventa il kernel a simmetria sferica di slide p65.`,
    pitfalls: md`Senza $1/\sqrt{2\pi}$ l'area vale $\sqrt{2\pi} \approx 2.51$ e la stima non è più una densità. Il supporto è illimitato: ogni campione contribuisce ovunque, anche se poco, e la stima non vale mai esattamente zero.`,
    importance: 3,
    blanks: [
      {
        masked: md`\gamma(x)=\boxed{\;?\;}\exp\left(-\frac{x^2}{2}\right)`,
        answer: md`\frac{1}{\sqrt{2\pi}}`,
        distractors: [md`\frac{1}{2\pi}`, md`\sqrt{2\pi}`],
      },
      {
        masked: md`\gamma(x)=\frac{1}{\sqrt{2\pi}}\exp\left(\boxed{\;?\;}\right)`,
        answer: md`-\frac{x^2}{2}`,
        distractors: [md`-x^2`, md`\frac{x^2}{2}`, md`-\frac{|x|}{2}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 58 },
      { doc: 'part1', page: 40 },
      { doc: 'part1', page: 41 },
    ],
  },
  {
    id: 'f-c35-2',
    name: 'Stima di Parzen con kernel gaussiano (1-D)',
    nameEn: 'Parzen estimate with a Gaussian kernel (1-D)',
    latex: md`\hat{p}(x)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{\sqrt{2\pi}\,h}\exp\left(-\frac{(x-x_k)^2}{2h^2}\right)\quad (n=1)`,
    explain: md`Sostituisci il kernel gaussiano nella formula generale con $n = 1$ e $V(h) = h$. Ogni campione $x_k$ porta una campana normale di media $x_k$ e deviazione standard $h$; la stima è la media delle $N$ campane (*summation of gaussians*). Coincide con la formula di Specht (slide p65) per $n = 1$ e $\sigma = h$. Esempio: campioni $1,\ 2,\ 4$ e $h = 1$, stima in $x = 2$: $\hat{p}(2) = \frac{1}{3\sqrt{2\pi}}\left(e^{-1/2} + 1 + e^{-2}\right) \approx 0.232$.`,
    symbols: [
      { s: md`x_k`, meaning: md`$k$-esimo training sample 1-D, centro della sua campana` },
      { s: md`h`, meaning: md`larghezza del kernel: nella stima fa da deviazione standard di ciascuna campana` },
      { s: md`\frac{1}{\sqrt{2\pi}\,h}`, meaning: md`$\gamma(0)/V(h)$: picco di ciascuna campana, con $V(h) = h$` },
      { s: md`\frac{(x-x_k)^2}{2h^2}`, meaning: md`distanza al quadrato dal campione misurata in unità di $h$, divisa per 2` },
    ],
    whenToUse: md`È la forma da scrivere all'orale quando ti chiedono il kernel più comune dentro la stima. Nel pesce: una campana per ogni salmone misurato, e la somma dà la densità della luminosità.`,
    pitfalls: md`La slide p58 non la scrive: è ottenuta per sostituzione. Il fattore davanti ha $h$ (da $V(h) = h$), l'esponente ha $h^2$ (da $(x/h)^2$): gli errori tipici sono dimenticare $h$ davanti o mettere $h$ al posto di $h^2$ nell'esponente.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(x)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{\sqrt{2\pi}\,h}\exp\left(-\frac{(x-x_k)^2}{\boxed{\;?\;}}\right)`,
        answer: md`2h^2`,
        distractors: [md`2h`, md`2`],
      },
      {
        masked: md`\hat{p}(x)=\frac{1}{N}\sum_{k=1}^{N}\boxed{\;?\;}\exp\left(-\frac{(x-x_k)^2}{2h^2}\right)`,
        answer: md`\frac{1}{\sqrt{2\pi}\,h}`,
        distractors: [md`\frac{1}{\sqrt{2\pi}}`, md`\frac{1}{\sqrt{2\pi}\,h^2}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 58 },
      { doc: 'ch2', page: 53 },
      { doc: 'ch2', page: 65 },
      { doc: 'part1', page: 40 },
    ],
  },
]
