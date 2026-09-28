// Figure del foglio m03 (stima statistica: introduzione, stima di pdf, stima parametrica), ritagli in
// public/figures/m03-stima-intro-parametrica/<id>.webp prodotti con scripts/fig.py (render vettoriale dal PDF originale).
// Tutte le 11 figure dell'inventario, nessun ritocco ai pixel: ogni ritaglio contiene la figura intera con le sue
// etichette e nessun testo della slide o delle note intorno (bordi controllati: nessun pixel scuro sui 3 px di bordo).
// - fig01-fig07 (importanza >= 2): le figure da mostrare nel testo. fig10 conserva il titolo della slide perché nelle
//   note è parte dell'immagine incollata.
// - fig08, fig09, fig10, fig11 (importanza 1) sono le copie ridotte, nelle note, di figure già mostrate dalle slide
//   (fig02, fig03, fig06, fig04): restano qui come riferimento alla fonte; l'MDX non ha bisogno di mostrarle.
// - fig01 include la legenda Salmon / Sea bass, che nella pagina sta fuori dal riquadro del grafico.
// - Le didascalie non citano id interni: lo studente non li vede.
import { md } from '../../types'
import type { Figure } from '../../types'

export const figures: Figure[] = [
  {
    id: 'fig01',
    file: 'figures/m03-stima-intro-parametrica/fig01.webp',
    caption: md`Lo spazio delle feature 2-D (*2D feature space*) dell'esempio dei pesci, nelle note del corso: luminosità (*lightness*) in ascissa e larghezza (*width*) in ordinata, salmoni (*salmon*) in blu e spigole (*sea bass*) in giallo. Il confine di decisione rosso di un classificatore altamente non lineare (*highly nonlinear classifier*) serpeggia attorno ai singoli campioni e lascia ogni punto di training dalla parte della sua classe. Il messaggio da ricordare: un modello molto flessibile migliora l'adattamento (*fit*) ai dati di training ma rischia l'*overfitting*, cioè di imparare anche il rumore di feature ed etichette e di memorizzare i campioni invece di generalizzare a dati nuovi (*new, unseen data*). Serve un compromesso tra complessità del modello e capacità di generalizzazione (*generalization capability*).`,
    alt: 'Grafico a dispersione su sfondo sfumato dal grigio scuro all\'azzurro. Asse orizzontale Lightness con tacche 2, 4, 6, 8, 10; asse verticale Width con tacche 14, 18, 22. Punti blu (Salmon) concentrati a sinistra e in basso, punti gialli (Sea bass), più numerosi, a destra e in alto; le due nuvole si mescolano nella fascia centrale. Una curva rossa molto tortuosa scende dall\'alto verso il basso zigzagando tra i punti, così che tutti i blu restano da una parte e tutti i gialli dall\'altra. Legenda a destra: pallino blu Salmon, pallino giallo Sea bass.',
    source: { doc: 'part1', page: 12 },
  },
  {
    id: 'fig02',
    file: 'figures/m03-stima-intro-parametrica/fig02.webp',
    caption: md`L'oggetto che il capitolo vuole stimare: la densità di probabilità $p(\mathbf{x})$ disegnata come superficie sopra il piano delle feature $(x_1, x_2)$ (slide p2). Più «montagne» a campana, di altezza, larghezza e orientamento diversi, si sovrappongono in parte. La distribuzione statistica (*statistical distribution*) di un segnale stocastico è una funzione definita su tutto lo spazio delle feature, e l'obiettivo del Cap. 2 è ricostruirla a partire da un insieme finito di osservazioni (*samples*). La slide non commenta i colori: si possono leggere come le densità di classi diverse, che nelle zone di sovrapposizione si contendono gli stessi punti.`,
    alt: 'Grafico 3-D in prospettiva dentro una scatola a fil di ferro: sul piano orizzontale gli assi x1 e x2, in verticale l\'asse p(x). Quattro superfici a campana disegnate a reticolo, parzialmente sovrapposte: una rossa, alta e larga, a sinistra; una grigio chiaro in primo piano al centro; una grigio scuro, stretta, sullo sfondo; una marrone, più bassa e allungata, a destra.',
    source: { doc: 'ch2', page: 2 },
  },
  {
    id: 'fig03',
    file: 'figures/m03-stima-intro-parametrica/fig03.webp',
    caption: md`Lo schema a blocchi di un sistema di riconoscimento (slide p3), ripreso dal Cap. 1: *Physical World* → *Acquisition* → *Pre-processing* → *Feature Extraction* → *Recognition* → *Post-recognition* → *Decision*. Le tre manine rosse e il fumetto del docente («*Statistical estimation can be necessary here*») indicano i tre stadi in cui può servire la stima statistica: il pre-processing (normalizzazione dei dati, riduzione del rumore, gestione dei valori mancanti), l'estrazione delle feature (feature ricavate dalle proprietà statistiche dei dati) e il riconoscimento (apprendere le distribuzioni di probabilità per riconoscere i pattern). Nessuna manina su acquisizione, post-riconoscimento e decisione.`,
    alt: 'Diagramma a blocchi. A sinistra un riquadro azzurro Physical World con una grossa freccia rossa verso il blocco rosso Acquisition; da lì una colonna di blocchi verdi collegati da frecce verso il basso: Pre-processing, Feature Extraction, Recognition, Post-recognition, e in fondo il blocco azzurro Decision. Accanto a Pre-processing, Feature Extraction e Recognition tre manine rosse puntano verso i blocchi. A destra un docente disegnato davanti a una lavagna verde, con il fumetto: Statistical estimation can be necessary here.',
    source: { doc: 'ch2', page: 3 },
  },
  {
    id: 'fig04',
    file: 'figures/m03-stima-intro-parametrica/fig04.webp',
    caption: md`La pipeline di un sistema di decisione statistico (*statistical decision system pipeline*, slide p4). La sorgente di informazione (*Information Source*) produce i dati, che entrano nello spazio delle osservazioni (*Observation Space*): l'insieme di tutte le osservazioni possibili, grezze e spesso rumorose. Il blocco di modellazione statistica e stima (*Statistical Modeling & Estimation*) costruisce un modello delle distribuzioni di quello spazio (la freccia rossa curva torna verso l'ellisse); il progettista sceglie se farlo con un approccio parametrico o non parametrico (*Parametric/Nonparametric*), secondo quanto sa della sorgente. Il modello alimenta l'uscita (*Output*): classificazione (*classification*), rivelazione (*detection*) o predizione (*prediction*).`,
    alt: 'Diagramma di flusso. In alto a sinistra un blocco azzurro Information Source, con una linea che scende in un\'ellisse verde Observation Space. A destra dell\'ellisse un blocco rosso Statistical Modeling & Estimation, da cui una freccia rossa curva torna verso l\'ellisse. In alto a destra la sagoma di un progettista con il casco, accanto alla scritta Parametric/Nonparametric, da cui una linea con freccia entra nel blocco rosso. Dal blocco rosso una linea scende alla scritta blu Output, che si dirama in tre frecce verso le parole rosse Classification, Detection e Prediction.',
    source: { doc: 'ch2', page: 4 },
  },
  {
    id: 'fig05',
    file: 'figures/m03-stima-intro-parametrica/fig05.webp',
    caption: md`La tassonomia degli approcci alla stima di pdf (*PDF estimation approaches*, slide p8). Il ramo parametrico (*parametric*) assume nota la forma della densità (gaussiana, Gamma, Rayleigh) e stima soltanto un vettore di parametri $\boldsymbol{\theta} = (\theta_1, \dots, \theta_r)$: è il caso della sorgente parzialmente nota. Il ramo non parametrico (*nonparametric*) non assume alcuna forma e lascia parlare i dati: *K-Nearest Neighbors*, finestre di Parzen (*Parzen windows*) e approssimazione con funzioni ortogonali (*orthogonal function approximation*), quest'ultima citata nel corso solo qui. È il caso del segnale completamente ignoto, in cui si stima un'intera funzione. Da ricordare per l'orale: la scelta dipende da quanto si sa della forma della densità.`,
    alt: 'Albero gerarchico. In cima un blocco verde Approaches che si divide in due blocchi rossi, Parametric a sinistra e Nonparametric a destra. Sotto Parametric tre blocchi blu: Gaussian, Gamma e Rayleigh. Sotto Nonparametric tre blocchi azzurri: K-Nearest Neighbors, Parzen Windows e Orthogonal Function Approximation.',
    source: { doc: 'ch2', page: 8 },
  },
  {
    id: 'fig06',
    file: 'figures/m03-stima-intro-parametrica/fig06.webp',
    caption: md`L'esempio classico di funzione di verosimiglianza (*likelihood function: example*, slide p10, figura del manuale di Duda, Hart e Stork). In alto: dodici campioni di training 1-D (pallini rossi, tra circa 1.9 e 4.8) e quattro delle infinite pdf candidate $p(x\mid\theta)$, gaussiane con varianza nota ($\sigma = 1$) e media $\theta$ incognita (circa 2.5, 3, 3.5 e 5); quella centrata in 5 lascia quasi tutti i campioni nella coda. Al centro: la verosimiglianza $p(\mathbf{X}\mid\theta)$ in funzione di $\theta$, una campana stretta con massimo di circa $1.5\times 10^{-7}$ in $\hat{\theta} \approx 3.1$, la media dei campioni. In basso: la log-verosimiglianza $l(\theta)$, un arco parabolico con il massimo nello stesso $\hat{\theta}$ (circa $\ln(1.5\times 10^{-7}) \approx -15.7$). Da ricordare: in alto l'ascissa è $x$ (pdf con $\theta$ fissato, area 1); al centro e in basso è $\theta$ con i campioni fissati, e la verosimiglianza come funzione di $\theta$ non è una densità. Il logaritmo, monotono crescente, non sposta il massimo e porta valori minuscoli come $10^{-7}$ su una scala trattabile.`,
    alt: 'Tre grafici impilati con la stessa scala orizzontale da 0 a 7. In alto, sull\'asse x, pallini rossi raggruppati tra 2 e 5 (dieci macchie visibili, due delle quali coprono coppie di campioni quasi sovrapposti) e sopra quattro campane tratteggiate identiche, centrate più o meno in 2.5, 3, 3.5 e 5. Al centro, asse verticale p(X dato theta) con tacche 0.4, 0.8 e 1.2 per 10 alla meno 7, asse orizzontale theta: una campana stretta e alta, nulla fuori dall\'intervallo da 2 a 4, con il picco sopra la tacca 1.2; una freccia etichettata theta cappello indica il massimo poco oltre 3. In basso, asse verticale l(theta) con tacche da meno 20 a meno 100: un arco concavo che parte da circa meno 75, raggiunge il massimo vicino a meno 16 nello stesso theta cappello (freccia) e scende sotto meno 100 verso theta uguale a 7.',
    source: { doc: 'ch2', page: 10 },
  },
  {
    id: 'fig07',
    file: 'figures/m03-stima-intro-parametrica/fig07.webp',
    caption: md`Le due procedure principali di stima dei parametri (*estimation procedures*, slide p11). Nella stima a massima verosimiglianza (*Maximum Likelihood Estimation*, MLE) il vettore $\boldsymbol{\theta}$ è fisso ma incognito (*fixed but unknown*) e la stima migliore è quella che massimizza la probabilità di ottenere i campioni effettivamente osservati (con dati continui, la loro densità $p(\mathbf{X}\mid\boldsymbol{\theta})$). Nella stima bayesiana (*Bayesian Estimation*, BE) i parametri sono variabili aleatorie con una distribuzione a priori nota (*prior*); l'osservazione dei campioni la converte, con il teorema di Bayes, in una densità a posteriori (*posterior density*). Stessa verosimiglianza, due modi opposti di intendere $\boldsymbol{\theta}$: un numero da trovare oppure una variabile aleatoria da aggiornare.`,
    alt: 'Albero con la radice Main Procedures in un riquadro rosso sfumato, da cui due frecce rosse scendono ai blocchi blu Maximum Likelihood Estimation, a sinistra, e Bayesian Estimation, a destra. Sotto ciascun blocco una freccia nera porta a una pergamena con testo rosso. A sinistra: theta è visto come un vettore di quantità fisse ma incognite, e la stima migliore è quella che massimizza la probabilità di ottenere i campioni effettivamente osservati. A destra: i parametri sono variabili aleatorie con una distribuzione a priori nota, che l\'osservazione dei campioni converte in una densità a posteriori.',
    source: { doc: 'ch2', page: 11 },
  },
  {
    id: 'fig08',
    file: 'figures/m03-stima-intro-parametrica/fig08.webp',
    caption: md`La figura della densità $p(\mathbf{x})$ sul piano delle feature $(x_1, x_2)$ come compare nelle note del corso (p13), a risoluzione minore della slide: più campane sovrapposte, cioè la distribuzione statistica che il capitolo vuole stimare dai campioni osservati. Nelle note segue la frase sull'obiettivo del capitolo: stimare la distribuzione statistica (*statistical distribution*) di un segnale stocastico da un insieme di osservazioni.`,
    alt: 'Versione ridotta del grafico 3-D di p(x) sopra il piano x1, x2: dentro una scatola a fil di ferro quattro campane a reticolo parzialmente sovrapposte, una rossa a sinistra, una grigio chiaro in primo piano, una grigio scuro stretta sullo sfondo e una marrone bassa a destra.',
    source: { doc: 'part1', page: 13 },
  },
  {
    id: 'fig09',
    file: 'figures/m03-stima-intro-parametrica/fig09.webp',
    caption: md`Lo schema a blocchi del sistema di riconoscimento come compare nelle note (p14), senza il fumetto del docente: le tre manine rosse segnano *Pre-processing*, *Feature Extraction* e *Recognition*, i tre stadi in cui la stima statistica può servire. Nelle note la figura chiude l'elenco che spiega il ruolo della stima in ciascuno dei tre stadi.`,
    alt: 'Versione ridotta del diagramma a blocchi: Physical World, una freccia rossa verso Acquisition, poi in colonna Pre-processing, Feature Extraction, Recognition, Post-recognition e Decision; tre manine rosse accanto a Pre-processing, Feature Extraction e Recognition.',
    source: { doc: 'part1', page: 14 },
  },
  {
    id: 'fig10',
    file: 'figures/m03-stima-intro-parametrica/fig10.webp',
    caption: md`La slide dell'esempio di verosimiglianza riprodotta nelle note (p17), con il suo titolo, subito dopo la definizione della funzione di verosimiglianza $p(\mathbf{X}\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})$: in alto campioni e pdf candidate in funzione di $x$, poi la verosimiglianza $p(\mathbf{X}\mid\theta)$ e la log-verosimiglianza $l(\theta)$ in funzione di $\theta$, con il massimo nello stesso $\hat{\theta}$. È la stessa figura della slide, a risoluzione minore.`,
    alt: 'Versione ridotta della slide Likelihood Function: Example, con il titolo in blu: in alto pallini rossi sull\'asse x e quattro gaussiane tratteggiate; al centro la verosimiglianza p(X dato theta), una campana stretta con il massimo in theta cappello vicino a 3; in basso la log-verosimiglianza l(theta), un arco concavo con il massimo nello stesso punto.',
    source: { doc: 'part1', page: 17 },
  },
  {
    id: 'fig11',
    file: 'figures/m03-stima-intro-parametrica/fig11.webp',
    caption: md`La pipeline del sistema di decisione statistico come compare nelle note (p14), introdotta dalla frase «*An overview of a machine learning or statistical decision system pipeline is the following*»: *Information Source* → *Observation Space* ↔ *Statistical Modeling & Estimation* (con la scelta *Parametric/Nonparametric* del progettista) → *Output* → *Classification*, *Detection*, *Prediction*. Sotto la figura le note definiscono i blocchi uno per uno.`,
    alt: 'Versione ridotta del diagramma di flusso: Information Source entra nell\'ellisse verde Observation Space; il blocco rosso Statistical Modeling & Estimation, con la freccia curva verso l\'ellisse e il progettista con la scritta Parametric/Nonparametric in alto a destra; sotto, Output che si dirama in Classification, Detection e Prediction.',
    source: { doc: 'part1', page: 14 },
  },
]
