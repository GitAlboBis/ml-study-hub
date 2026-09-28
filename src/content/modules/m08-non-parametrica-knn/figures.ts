// Figure del foglio m08 (stima non parametrica e K-NN), ritagli in public/figures/m08-non-parametrica-knn/<id>.webp
// prodotti con scripts/fig.py (render vettoriale dal PDF originale). Ci sono tutte e dieci le figure dell'inventario.
// Interventi sui ritagli, tutti senza toccare il contenuto delle figure:
// - fig05, fig06, fig09, fig10 sono ritagli composti: due zone della stessa pagina, rese alla stessa scala con il
//   render di fig.py e unite su fondo bianco (in verticale fig05, fig06, fig10; affiancate fig09), per lasciare
//   fuori il testo della slide o delle note che nella pagina le separa. Le didascalie lo dichiarano.
// - fig01 e fig08 escludono il sottotitolo blu «Illustration of Parzen versus K-NN estimation concepts», che la
//   didascalia riporta; fig02 esclude la nota ruotata della slide p48, riportata nella didascalia.
// - fig07 è la slide p47 intera (senza titolo e piè di pagina), come chiede l'inventario: la freccia rossa verso
//   l'esempio K(N) = √N fa parte della figura.
// - fig08: sul bordo sinistro resta una linea verticale quasi invisibile (grigio 247), il bordo dell'immagine
//   incollata nelle note.
// - fig08, fig09, fig10 sono le copie ridotte, nelle note del corso, di figure delle slide (fig01; fig02 e fig03;
//   fig04). Restano qui perché l'inventario le elenca; l'MDX può mostrare solo le versioni delle slide.
// - Le didascalie non citano id interni: lo studente non li vede.
import { md } from '../../types'
import type { Figure } from '../../types'

export const figures: Figure[] = [
  {
    id: 'fig01',
    file: 'figures/m08-non-parametrica-knn/fig01.webp',
    caption: md`Parzen contro K-NN al crescere di $N$ (*Illustration of Parzen versus K-NN estimation concepts*, slide p46). I campioni sono gli stessi nelle due righe e si accumulano da un riquadro all'altro; il punto di stima è il centro di ogni riquadro. Riga alta, Parzen: il volume segue una legge fissata, $V = 1/\sqrt{N}$, e il cerchio si restringe qualunque sia la posizione dei campioni; il conteggio $K$ è casuale (1, 0, 1, 1, 1: con $N = 4$ nessun campione cade dentro e la stima vale zero). Riga bassa, K-NN: si fissa $K = \sqrt{N}$ e il cerchio si allarga fino al $K$-esimo vicino (*nearest neighbor*), sul quale passa il bordo (1, 2, 3, 4 e 10 campioni). Da ricordare: la formula è la stessa, $\hat{p}(\mathbf{x}^*) = K/(NV)$; Parzen fissa $V$ e conta $K$, il K-NN fissa $K$ e misura $V$. Con le leggi dichiarate, in entrambe le righe la regione si restringe mentre il numero di campioni che contiene cresce in proporzione a $\sqrt{N}$ (in media, per Parzen): sono le condizioni generali di convergenza $V_N \to 0$, $K_N \to +\infty$, $K_N/N \to 0$. Con $K = \sqrt{N}$ il volume K-NN vale circa $1/(\sqrt{N}\,p(\mathbf{x}^*))$: la stessa legge di Parzen, con una costante decisa dai dati ([il volume della cella K-NN con $K = \sqrt{N}$](#derivation:der08)). Attenzione al disegno della riga alta: lì è il raggio, non l'area, a scalare come $1/\sqrt{N}$, e per questo il conteggio resta fermo a 0 o 1 invece di crescere.`,
    alt: 'Due righe di cinque riquadri quadrati con punti neri (i campioni) e un cerchio rosso al centro; le colonne sono N=1, N=4, N=9, N=16 e, dopo tre puntini, N=100. Riga alta, etichetta V uguale a 1 fratto radice di N: il cerchio passa da quasi tutto il riquadro a un cerchietto minuscolo, e contiene al più un campione. Riga bassa, etichetta K uguale a radice di N: il cerchio resta grande e il suo bordo passa per un campione, racchiudendone 1, 2, 3, 4 e 10.',
    source: { doc: 'ch2', page: 46 },
  },
  {
    id: 'fig02',
    file: 'figures/m08-non-parametrica-knn/fig02.webp',
    caption: md`Stima K-NN in uno spazio delle feature 1-D (*Example of K-NN estimation in a 1-D feature space*, slide p48) sugli stessi otto campioni, i punti rossi sull'asse $x$. La curva rossa, $K = 3$, ha picchi alti e stretti dove i campioni sono fitti; la curva nera, $K = 5$, è più bassa e più liscia: $K$ grande smussa la stima, $K$ piccolo la rende sensibile ai singoli campioni. In 1-D la cella è un segmento di lunghezza $2r_K(x)$ e la stima vale $\hat{p}(x) = K/(2N\,r_K(x))$. La nota della slide (*The discontinuities in the slopes in the estimates generally occur away from the positions of the points themselves*): cuspidi e angoli cadono nei punti medi tra campioni, dove cambia il $K$-esimo vicino, non sui campioni. La stima resta continua, è la pendenza a saltare ([forma 1-D della stima K-NN e posizione delle discontinuità](#derivation:der04)). Lontano dai dati le curve scendono come $1/\vert x\vert$: code lente, e l'integrale della stima su tutto l'asse diverge.`,
    alt: 'Grafico con asse verticale p(x) e asse orizzontale x, con otto punti rossi sull\'asse x distribuiti in modo irregolare. Una curva rossa etichettata 3 con un picco aguzzo a sinistra, un picco più alto al centro e diversi dentini; una curva nera etichettata 5 più bassa, con angoli meno marcati. Entrambe sono fatte di archi raccordati da spigoli e ai due lati scendono lentamente senza toccare lo zero.',
    source: { doc: 'ch2', page: 48 },
  },
  {
    id: 'fig03',
    file: 'figures/m08-non-parametrica-knn/fig03.webp',
    caption: md`Stima K-NN in uno spazio delle feature 2-D con $K = 5$ (*Example of K-NN estimation in a 2-D feature space*, slide p49). Sotto, una trentina di campioni rossi nel piano $(x_1, x_2)$; sopra, la superficie $\hat{p}(\mathbf{x}) = 5/(N\pi\,r_5^2(\mathbf{x}))$: la cella è un cerchio con raggio pari alla distanza dal quinto vicino. La superficie ha picchi sulle zone dense e creste angolose dove cambia il quinto vicino, e lontano dai dati si abbassa lentamente senza annullarsi. È il caso 1-D in due dimensioni: stima spigolosa che si adatta alla densità locale dei campioni.`,
    alt: 'Superficie 3-D grigia a reticolo dentro un cubo in prospettiva, asse verticale p(x) con lo 0 segnato, assi x1 e x2 sul piano di base. Sul piano di base una trentina di punti rossi sparsi, più fitti al centro e verso destra. La superficie è quasi piatta ai bordi e si alza in due picchi aguzzi principali e in molte creste più basse sopra le zone dove i punti sono più densi.',
    source: { doc: 'ch2', page: 49 },
  },
  {
    id: 'fig04',
    file: 'figures/m08-non-parametrica-knn/fig04.webp',
    caption: md`Stime K-NN di due densità 1-D (*Several K-NN estimates of two 1-D densities: a Gaussian and a bimodal distribution*, slide p50), per $N = 1, 16, 256, \infty$. Colonna sinistra: una gaussiana (dall'immagine, media 2 e deviazione standard circa 1). Colonna destra: una bimodale fatta di un triangolo tra 0.5 e 2.5 e di un rettangolo tra 3 e 3.5. Con $N = 1$, quindi $K = 1$, la stima è un solo spillo iperbolico $1/(2\vert x - x_1\vert)$ sull'unico campione. Con $N = 16$ e $N = 256$ la stima è a spilli (*spiky*), supera il massimo vero e non scende a zero nella valle né ai bordi: sono le code lente del K-NN. Per $N = \infty$ ogni colonna coincide con la densità vera: la consistenza vista a occhio. La convergenza è lenta, e sui bordi verticali del rettangolo, dove $p(x)$ è discontinua, non è garantita. La slide non dichiara $K$: nel testo di Duda-Hart-Stork, da cui viene la figura, $K = \sqrt{N}$ (quindi 1, 4, 16). Da confrontare con le stime di Parzen della stessa bimodale (slide p63, foglio sulle finestre di Parzen).`,
    alt: 'Griglia di otto grafici in due colonne e quattro righe etichettate N=1, N=16, N=256 e N=∞, asse orizzontale da 0 a 4 e verticale fino a 1. Riga N=1: in ciascuna colonna una curva che sale verso un asintoto e esce dal bordo superiore, vicino a x=3.4 a sinistra e a x=1.3 a destra. Righe N=16 e N=256: curve frastagliate con picchi aguzzi, a sinistra sparsi attorno al centro, a destra concentrati vicino a 1.3 e a 3.3, con code che non toccano lo zero. Riga N=∞: a sinistra una campana liscia centrata in 2; a destra un triangolo tra 0.5 e 2.5 e un rettangolo tra 3 e 3.5.',
    source: { doc: 'ch2', page: 50 },
  },
  {
    id: 'fig05',
    file: 'figures/m08-non-parametrica-knn/fig05.webp',
    caption: md`Le due formule dei concetti di base (*Basic Concepts*, slide p43) con i richiami grafici della slide. In alto la probabilità che un campione cada nella regione $R$, $P_R = P\{\mathbf{x}\in R\} = \int_R p(\mathbf{x})\,d\mathbf{x} = p(\mathbf{x}^*)\,V$, con la $V$ cerchiata in verde e la freccia verso «Volume of R». L'ultimo passaggio vale se $p(\mathbf{x})$ è continua e $R$ è abbastanza piccola da renderla quasi costante: la slide scrive un uguale, ma è un'approssimazione. In basso la frequenza relativa (*relative frequency*) $\hat{P}_R = K/N$ e la freccia rossa verso la legge dei grandi numeri (*Law of large numbers*): $\lim_{N\to+\infty} P\{\vert\hat{P}_R - P_R\vert < \delta\} = 1$ per ogni $\delta > 0$, cioè $K/N$ è una stima consistente di $P_R$. Dividendo per $V$ nasce la stima $K/(NV)$ ([dalla probabilità di una regione alla stima K/(NV)](#derivation:der01)). Ritaglio composto: nella slide le due formule sono separate da due punti elenco.`,
    alt: 'Due formule una sotto l\'altra. In alto: P con R uguale a P di x appartenente a R, uguale all\'integrale su R di p(x) dx, uguale a p(x*) per V; la V è cerchiata in verde e una freccia verde la collega alla scritta Volume of R. In basso: P cappello con R uguale a K fratto N, e il limite per N che tende a più infinito della probabilità che il modulo di P cappello meno P sia minore di delta, uguale a 1 per ogni delta positivo; una freccia rossa curva parte dalla scritta rossa Law of large numbers e punta alla formula del limite.',
    source: { doc: 'ch2', page: 43 },
  },
  {
    id: 'fig06',
    file: 'figures/m08-non-parametrica-knn/fig06.webp',
    caption: md`La stima della pdf (*PDF Estimation*, slide p44), $\hat{p}(\mathbf{x}^*) = \hat{P}_R/V = K/(NV)$, e le due osservazioni con l'omino verde perplesso che nella slide segnala il dilemma. $R$ deve essere abbastanza grande (*enough large*) da contenere abbastanza campioni per la legge dei grandi numeri, e insieme abbastanza piccola (*enough small*) da limitare la variabilità di $p(\mathbf{x})$ al suo interno. Le due richieste tirano in versi opposti: $R$ troppo piccola rende la stima sensibile al rumore (varianza alta), $R$ troppo grande non segue le variazioni locali della pdf (bias alto) ([bias e varianza di K/(NV)](#derivation:der07)). Il K-NN e Parzen sciolgono il dilemma in due modi: il primo fissa $K$, il secondo fissa $V$. Ritaglio composto: la formula e le osservazioni sono unite senza il titoletto «Observations».`,
    alt: 'In alto la formula: p cappello di x* uguale a P cappello con R fratto V, uguale a K fratto N per V. Sotto, due punti elenco: R should be enough large to contain a number of training samples that is sufficient for applying the law of large numbers, con enough large in rosso; At the same time, it should be enough small to limit the variability of p(x) within it, con enough small in rosso. A sinistra un omino verde stilizzato che si gratta la testa, con un punto interrogativo.',
    source: { doc: 'ch2', page: 44 },
  },
  {
    id: 'fig07',
    file: 'figures/m08-non-parametrica-knn/fig07.webp',
    caption: md`La slide riassuntiva della stima K-NN (*K-NN Estimation*, slide p47). Ipotesi (*Hypotheses*): $K$ fissato a priori e una forma della cella scelta a priori, per esempio l'ipersfera. Metodologia (*Methodology*): la cella centrata in $\mathbf{x}^*$ si espande fino a contenere $K$ campioni di training; il volume che ne risulta è $V_K(\mathbf{x}^*)$ e la stima vale $\hat{p}(\mathbf{x}^*) = K/(N\,V_K(\mathbf{x}^*))$. Se $K$ è una funzione di $N$, la condizione necessaria e sufficiente per una stima consistente in ogni punto in cui $p(\mathbf{x})$ è continua è $\lim_{N\to+\infty} K_N = +\infty$ e $\lim_{N\to+\infty} K_N/N = 0$. La freccia rossa porta all'esempio $K(N) = \sqrt{N}$, che le soddisfa entrambe perché $\sqrt{N}/N = 1/\sqrt{N} \to 0$. La prima condizione rende affidabile il conteggio (la varianza sparisce), la seconda fa restringere la cella attorno a $\mathbf{x}^*$ (il bias sparisce). La slide la enuncia senza dimostrazione, con «It can be shown» ([perché servono le due condizioni](#derivation:der02)).`,
    alt: 'Testo della slide in due blocchi. Hypotheses: il numero K è fissato a priori; una forma della cella centrata in x* è scelta a priori (per esempio ipersfera), con shape in rosso. Methodology: il metodo espande la cella fino a contenere K campioni di training (frase in rosso); V con K di x* è il volume risultante; la stima p cappello di x* vale K fratto N per V con K di x*; se K è scelto in funzione di N (in rosso) la condizione per la consistenza è il limite di K con N uguale a più infinito e il limite di K con N fratto N uguale a 0. Una freccia rossa parte dal secondo limite e porta alla scritta Example: K(N) uguale a radice di N.',
    source: { doc: 'ch2', page: 47 },
  },
  {
    id: 'fig08',
    file: 'figures/m08-non-parametrica-knn/fig08.webp',
    caption: md`La copia, nelle note del corso (p. 33), della figura Parzen contro K-NN della slide p46: riga $V = 1/\sqrt{N}$ (Parzen, volume fissato e conteggio casuale), riga $K = \sqrt{N}$ (K-NN, conteggio fissato e volume misurato), colonne $N = 1, 4, 9, 16, \dots, 100$. Le note non la commentano; la lettura è quella della versione della slide.`,
    alt: 'Versione più piccola della stessa figura della slide: due righe di cinque riquadri con punti neri e un cerchio rosso centrato, colonne N=1, N=4, N=9, N=16 e N=100 separate da tre puntini. Nella riga V uguale a 1 fratto radice di N il cerchio si rimpicciolisce fino a un punto; nella riga K uguale a radice di N resta ampio e passa per un campione.',
    source: { doc: 'part1', page: 33 },
  },
  {
    id: 'fig09',
    file: 'figures/m08-non-parametrica-knn/fig09.webp',
    caption: md`Le copie, nelle note del corso (p. 35), dei due esempi K-NN delle slide p48 e p49: a sinistra la stima 1-D con $K = 3$ (rossa) e $K = 5$ (nera), a destra la superficie 2-D con $K = 5$. Nelle note ciascuna è seguita da un commento. Per la 1-D: le discontinuità di pendenza cadono lontano dai campioni perché le celle del K-NN non variano in modo liscio; più precisamente, la pendenza salta nei punti medi tra campioni, dove cambia il $K$-esimo vicino. Per la 2-D: con $K = 5$ la stima è più liscia ma rischia l'underfitting se $K$ è troppo grande; in dimensioni più alte il volume dell'intorno cresce in modo esponenziale e la scelta di $K$ diventa ancora più critica. Le note dicono che la stima «fa la media» dei 5 vicini: è impreciso, il K-NN misura il volume della cella che li contiene. Ritaglio composto: le due immagini sono affiancate, senza il testo che nelle note le separa.`,
    alt: 'Due immagini affiancate. A sinistra un grafico con asse p(x) e asse x, otto punti rossi sull\'asse x, una curva rossa etichettata 3 con picchi aguzzi e una curva nera etichettata 5 più bassa e liscia. A destra una superficie 3-D grigia a reticolo sopra un piano con una trentina di punti rossi, assi p(x), x1 e x2, con picchi sopra le zone dense.',
    source: { doc: 'part1', page: 35 },
  },
  {
    id: 'fig10',
    file: 'figures/m08-non-parametrica-knn/fig10.webp',
    caption: md`Due immagini delle note del corso (p. 36), unite in un solo ritaglio. In alto la copia della griglia della slide p50: stime K-NN di una gaussiana e di una bimodale per $N = 1, 16, 256, \infty$. Le note la descrivono così: con $N = 16$ i due picchi della bimodale cominciano ad apparire ma c'è rumore, con $N = 256$ la forma bimodale è più chiara, per $N = \infty$ la stima mostra due picchi distinti, coerente con la distribuzione vera. In basso la funzione finestra (*window function*) con cui comincia la stima di Parzen: $\gamma(\mathbf{x})$ vale 1 se $\mathbf{x}$ appartiene all'ipercubo (*hypercube*) e 0 altrimenti. La fonte lo dice solo a parole; per l'ipercubo di lato 1 centrato nell'origine la forma esplicita è $\gamma(\mathbf{u}) = 1$ se $\vert u_j\vert \le 1/2$ per ogni $j = 1, \dots, n$, e $0$ altrimenti.`,
    alt: 'In alto una griglia piccola di otto grafici in due colonne e quattro righe (N=1, N=16, N=256, N=∞): a sinistra curve frastagliate che per N=∞ diventano una campana, a destra picchi vicino a 1.3 e a 3.3 che per N=∞ diventano un triangolo e un rettangolo. In basso la formula: gamma di x in grassetto uguale, con una graffa, a 1 se x belongs to the hypercube e a 0 otherwise.',
    source: { doc: 'part1', page: 36 },
  },
]
