// Figure del foglio m09 (finestre di Parzen), ritagli in public/figures/m09-parzen-windows/<id>.webp prodotti con
// scripts/fig.py (render vettoriale dal PDF originale).
// Interventi sui ritagli, tutti senza toccare il contenuto delle figure:
// - fig09, fig10, fig11: sbiancati pochi pixel colorati lungo il bordo superiore (coda del sottotitolo blu della slide,
//   frammento del logo), che il ritaglio non poteva escludere senza tagliare le etichette h_N.
// Scelte del correttore dei contenuti:
// - fig01, fig12, fig13, fig14 dell'inventario (importanza 1) non sono qui: sono le copie ridotte, nelle note, di
//   figure già mostrate dalle slide (fig16; fig03-fig05; fig05-fig06; fig09-fig11). I WebP restano in public/.
// - fig02, fig07, fig08 sono ritagli di formule e testo delle slide, già scritti in KaTeX nel foglio: restano qui
//   come riferimento alla fonte (e per il conteggio delle figure con importanza >= 2), ma l'MDX non le mostra.
// - Le didascalie non citano id interni (figNN, derNN): lo studente non li vede.
import { md } from '../../types'
import type { Figure } from '../../types'

export const figures: Figure[] = [
  {
    id: 'fig02',
    file: 'figures/m09-parzen-windows/fig02.webp',
    caption: md`La funzione finestra (*window function*) della slide p51: $\gamma(\mathbf{x})$ vale 1 se $\mathbf{x}$ cade nell'ipercubo e 0 altrimenti. Valutata in $(\mathbf{x}_k-\mathbf{x}^*)/h$ diventa un test di appartenenza del campione $\mathbf{x}_k$ alla regione $R$; sommata su tutti i campioni dà il conteggio $K$ in forma analitica. L'ipercubo sottinteso è quello unitario centrato nell'origine.`,
    alt: 'Formula con graffa: gamma di x in grassetto vale 1 se x appartiene all\'ipercubo (if x belongs to the hypercube), 0 altrimenti (otherwise).',
    source: { doc: 'ch2', page: 51 },
  },
  {
    id: 'fig03',
    file: 'figures/m09-parzen-windows/fig03.webp',
    caption: md`Finestre normali 2-D a simmetria circolare $\delta(\mathbf{x})$ per $h = 1, 0.5, 0.2$ sul quadrato $[-2, 2]^2$ (slide p56). Quando $h$ cala la campana si stringe e il picco sale come $1/(2\pi h^2)$: $0.159$, $0.637$ e $3.98$, in accordo con le scale verticali $0.15$, $0.6$ e $4$. L'area sotto ogni superficie resta 1: $h$ scambia larghezza con altezza.`,
    alt: 'Tre superfici 3-D a reticolo grigio affiancate, etichettate h = 1, h = 0.5 e h = 0.2, con base da -2 a 2 su entrambi gli assi e asse verticale delta di x. La prima è una campana larga con massimo vicino a 0.15; la seconda è più stretta, con massimo vicino a 0.6; la terza è un ago sottile che arriva a 4 su una base piatta.',
    source: { doc: 'ch2', page: 56 },
  },
  {
    id: 'fig04',
    file: 'figures/m09-parzen-windows/fig04.webp',
    caption: md`Tre stime di Parzen costruite sugli stessi cinque campioni 2-D con $h = 1, 0.5, 0.2$ (slide p57, figura di Duda-Hart). Con $h = 1$ le finestre si fondono in una superficie ondulata che nasconde i singoli campioni (*oversmoothing*); con $h = 0.5$ si distinguono cinque picchi; con $h = 0.2$ restano cinque aghi isolati e la stima insegue i campioni. Le scale verticali (circa $0.2$, $0.6$ e $3$) sono riscalate nella figura originale: non leggerle come valori di $\hat{p}(\mathbf{x})$.`,
    alt: 'Tre superfici 3-D affiancate su una base da 0 a 10 per 0 a 8, etichettate h = 1, h = 0.5 e h = 0.2, asse verticale p di x. Con h = 1 una superficie ondulata con due o tre gobbe larghe; con h = 0.5 cinque picchi separati, tre dei quali ravvicinati a sinistra; con h = 0.2 cinque aghi sottili su un piano piatto.',
    source: { doc: 'ch2', page: 57 },
  },
  {
    id: 'fig05',
    file: 'figures/m09-parzen-windows/fig05.webp',
    caption: md`Grafici dei kernel rettangolare $\Pi(x)$, triangolare $\Lambda(x)$ e gaussiano della slide p58. Il rettangolo ha supporto $[-1/2, 1/2]$, ma l'etichetta 1/2 accanto al lato superiore non torna con $\int\gamma = 1$: la $\Pi$ standard ha altezza 1. Il triangolo va da $-1$ a $1$ con vertice 1; la gaussiana è liscia e non si annulla mai.`,
    alt: 'Tre piccoli grafici uno sotto l\'altro, con asse verticale gamma di x. In alto un rettangolo tra -1/2 e 1/2 con l\'etichetta 1/2 vicino al lato superiore; al centro un triangolo con base da -1 a 1 e vertice a quota 1; in basso una campana simmetrica con code che si avvicinano all\'asse.',
    source: { doc: 'ch2', page: 58 },
  },
  {
    id: 'fig06',
    file: 'figures/m09-parzen-windows/fig06.webp',
    caption: md`Grafici dei kernel esponenziale, di Cauchy e $\text{sinc}^2$ della slide p59. L'esponenziale $\frac{1}{2}e^{-\vert x\vert}$ ha una cuspide con picco $1/2$ nell'origine; il Cauchy è una campana bassa (picco $1/\pi \approx 0.318$) con code pesanti che scendono come $1/x^2$; il $\text{sinc}^2$ ha un lobo centrale (picco $1/(2\pi)$) e lobi laterali che toccano lo zero. Tutti hanno area 1; le oscillazioni del $\text{sinc}^2$ spiegano perché nella stima di densità si usa poco.`,
    alt: 'Tre piccoli grafici uno sotto l\'altro, con asse verticale gamma di x. In alto una cuspide appuntita nell\'origine con etichetta 1/2 e code che scendono ai lati; al centro una campana bassa e larga; in basso un lobo centrale alto con piccoli lobi laterali che toccano l\'asse.',
    source: { doc: 'ch2', page: 59 },
  },
  {
    id: 'fig07',
    file: 'figures/m09-parzen-windows/fig07.webp',
    caption: md`Lo schema del bias della slide p60. In alto la media della stima come convoluzione, $E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})*\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$, con l'avvertenza della mano: la media della stima è una versione sfocata (*blurred*) della pdf vera. In basso l'implicazione della freccia verde: se $h_N \to 0$ il kernel riscalato tende alla delta di Dirac e $\lim_{N\to+\infty}E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})$. Da ricordare: a $h$ fisso la stima è distorta per ogni $N$; la distorsione sparisce solo se la finestra si chiude.`,
    alt: 'In alto la formula: valore atteso di p cappello di x uguale a p di x convoluto con 1 su h alla n per gamma di x su h. Sotto, una mano rossa indica la frase The estimate mean is a blurred version of the true p(x)!, con blurred in rosso. Poi il testo sulla non distorsione asintotica, con asymptotically unbiased in rosso, e in fondo una freccia verde tra il limite del kernel riscalato, uguale a delta di x, e il limite del valore atteso della stima, uguale a p di x.',
    source: { doc: 'ch2', page: 60 },
  },
  {
    id: 'fig08',
    file: 'figures/m09-parzen-windows/fig08.webp',
    caption: md`Le due condizioni di consistenza della slide p61, $\lim_{N\to+\infty}h_N=0$ e $\lim_{N\to+\infty}N h_N^n=+\infty$, con il riquadro a pergamena dell'esempio $h_N = 1/\sqrt[2n]{N}$. Con questa legge $N h_N^n = \sqrt{N}$: la finestra si chiude, e il bias sparisce, ma il numero atteso di campioni al suo interno, circa $N h_N^n\,p(\mathbf{x})$, cresce e la varianza si spegne, in qualunque dimensione $n$.`,
    alt: 'Due limiti affiancati: il limite per N che tende a più infinito di h con N uguale a 0, e il limite di N per h con N alla n uguale a più infinito. Sotto, a destra, un riquadro rosso a forma di pergamena con la scritta Example, una freccia verde e la formula h con N uguale a 1 fratto la radice 2n-esima di N.',
    source: { doc: 'ch2', page: 61 },
  },
  {
    id: 'fig09',
    file: 'figures/m09-parzen-windows/fig09.webp',
    caption: md`Stime di Parzen di una densità normale 1-D (slide p62): righe $N = 1, 10, 100, \infty$, colonne $h_N = h_1/\sqrt{N}$ con $h_1 = 1, 0.5, 0.1$. Con $N = 1$ la stima è la sola finestra centrata sull'unico campione. Con $h_1 = 0.1$ e pochi campioni la stima è rumorosa, con $h_1 = 1$ è liscia già a $N = 10$. Per $N = \infty$ le tre colonne coincidono con la gaussiana vera: la legge $h_1/\sqrt{N}$ rispetta le condizioni di consistenza e $h_1$ pesa solo a $N$ finito. Ogni pannello è una sola realizzazione della stima, non la sua media; il kernel non è dichiarato, ma la riga $N = 1$ fa pensare a un kernel gaussiano.`,
    alt: 'Griglia di 12 grafici in 4 righe (N=1, N=10, N=100, N=∞) e 3 colonne (h con N uguale a 1, 0.5 e 0.1 fratto radice di N), asse orizzontale da -2 a 2 circa. Riga N=1: una campana larga, una più stretta e un ago sottile, tutti a sinistra dello zero. Righe N=10 e N=100: campane lisce nelle prime due colonne, curve frastagliate con molti picchi nella terza. Riga N=∞: tre campane identiche centrate in zero.',
    source: { doc: 'ch2', page: 62 },
  },
  {
    id: 'fig10',
    file: 'figures/m09-parzen-windows/fig10.webp',
    caption: md`Stime di Parzen della densità bimodale 1-D, un triangolo più un rettangolo (slide p63): righe $N = 1, 16, 256, \infty$, colonne $h_N = h_1/\sqrt{N}$ con $h_1 = 1, 0.5, 0.1$. Con $h_1 = 1$ i due modi compaiono già a $N = 16$ ma gli spigoli del rettangolo si arrotondano; con $h_1 = 0.1$ la stima resta frastagliata anche a $N = 256$. Per $N = \infty$ ogni colonna ricostruisce triangolo e rettangolo. Confrontala con le stime K-NN della stessa densità (slide p50), nella sezione sul confronto tra Parzen e K-NN.`,
    alt: 'Griglia di 12 grafici in 4 righe (N=1, N=16, N=256, N=∞) e 3 colonne (h con N uguale a 1, 0.5 e 0.1 fratto radice di N), asse orizzontale da 0 a 4 e verticale fino a 1. Riga N=1: una gobba larga, una più stretta e un picco stretto vicino a 1.5. Righe N=16 e N=256: due gruppi di picchi vicino a 1.5 e a 3.3, lisci nella prima colonna e sempre più frastagliati verso la terza. Riga N=∞: in ogni colonna un triangolo tra circa 0.5 e 2.5 e un rettangolo tra circa 3 e 3.5.',
    source: { doc: 'ch2', page: 63 },
  },
  {
    id: 'fig11',
    file: 'figures/m09-parzen-windows/fig11.webp',
    caption: md`Stime di Parzen di una densità normale 2-D (slide p64): righe $N = 1, 10, 100, \infty$, colonne etichettate $h_N = 1/N, 0.5/N, 0.1/N$. Il messaggio è quello del caso 1-D: finestre piccole danno superfici a spilli, finestre grandi superfici lisce, e per $N = \infty$ tutte coincidono con la campana vera. Attenzione all'etichetta: con $n = 2$ la legge $h_1/N$ dà $N h_N^2 = h_1^2/N \to 0$ e viola la seconda condizione di consistenza. La figura viene da Duda-Hart, che usa $h_1/\sqrt{N}$: probabile refuso della slide.`,
    alt: 'Griglia di 12 superfici 3-D in 4 righe (N=1, N=10, N=100, N=∞) e 3 colonne etichettate h con N uguale a 1 fratto N, 0.5 fratto N e 0.1 fratto N, su una base da -2 a 2. Riga N=1: una cupola larga, una campana spostata verso un angolo, una campana più stretta. Righe N=10 e N=100: superfici con molte gobbe, sempre più irte di spilli verso destra. Riga N=∞: tre campane lisce identiche.',
    source: { doc: 'ch2', page: 64 },
  },
  {
    id: 'fig15',
    file: 'figures/m09-parzen-windows/fig15.webp',
    caption: md`«Illustration of Parzen versus K-NN estimation concepts» (slide p46, modulo m08). Riga alta, Parzen con $V = 1/\sqrt{N}$: il cerchio si restringe al crescere di $N$ in modo deterministico, qualunque sia la posizione dei campioni, e il numero di campioni catturati è casuale (può essere zero). Riga bassa, K-NN con $K = \sqrt{N}$: il cerchio si allarga o si stringe fino a contenere esattamente $K$ campioni. Parzen fissa il volume e conta; il K-NN fissa il conteggio e misura il volume. $V = 1/\sqrt{N}$ è l'esempio $h_N = 1/\sqrt[2n]{N}$ della slide p61, perché $h_N^n = 1/\sqrt{N}$.`,
    alt: 'Due righe di cinque riquadri quadrati con punti neri (i campioni) e un cerchio rosso centrato; le colonne sono N=1, N=4, N=9, N=16 e, dopo dei puntini, N=100. Riga alta, etichetta V uguale a 1 fratto radice di N: il cerchio passa da grande a minuscolo. Riga bassa, etichetta K uguale a radice di N: il raggio del cerchio cambia per racchiudere 1, 2, 3, 4 e 10 punti.',
    source: { doc: 'ch2', page: 46 },
  },
  {
    id: 'fig16',
    file: 'figures/m09-parzen-windows/fig16.webp',
    caption: md`Stime K-NN di due densità 1-D (slide p50, modulo m08): una gaussiana e la bimodale triangolo più rettangolo, per $N = 1, 16, 256, \infty$. Le stime sono appuntite e le code scendono lentamente senza toccare lo zero; per $N = \infty$ coincidono con le densità vere. La colonna destra usa la stessa densità della griglia di Parzen della slide p63, più avanti nel foglio: confronto diretto tra i due metodi. Le note la riportano in piccolo in cima a part1 p36.`,
    alt: 'Griglia di otto grafici in due colonne e quattro righe etichettate N=1, N=16, N=256 e N=∞, asse orizzontale da 0 a 4 e verticale fino a 1. Colonna sinistra: curve con picchi aguzzi e code alte che per N=∞ diventano una campana centrata in 2. Colonna destra: picchi aguzzi vicino a 1.3 e a 3.3 che per N=∞ diventano un triangolo tra circa 0.5 e 2.5 e un rettangolo tra 3 e 3.5.',
    source: { doc: 'ch2', page: 50 },
  },
]
