// Figure del foglio m05 (stima a massima verosimiglianza), ritagli in public/figures/m05-max-likelihood/<id>.webp.
// Come sono stati prodotti (render dal PDF originale con le funzioni di scripts/fig.py):
// - fig01 (slide vettoriale, Cap. 2 p.18): `fig.py crop` normale.
// - fig02-fig10 (note, part1 p.20-24): nelle note le figure sono immagini raster incorporate; il render di `fig.py crop`
//   (zoom 3) le avrebbe sotto-campionate, quindi sono state ritagliate con le stesse funzioni render/save_webp di fig.py
//   a zoom pari alla risoluzione nativa (5 per p.22, 4.2 per p.20 e p.23, 4 per p.24). I sei pannelli di p.22 sono
//   separati lungo le colonne bianche fra un grafico e l'altro, ognuno con titolo, legenda e formula.
// Particolari della fonte lasciati come sono: in fig03 l'ultima etichetta dell'asse (5) è tagliata già nell'immagine
// originale e c'è un puntino isolato in alto a destra; in fig09 alcuni punti neri sparsi sulla rete vengono dalla fonte.
// fig02 è la copia, nelle note, della figura della slide (fig01): resta qui come riferimento alla pagina delle note.
// Le didascalie non citano id interni (figNN, cNN, derNN): lo studente non li vede.
import { md } from '../../types'
import type { Figure } from '../../types'

export const figures: Figure[] = [
  {
    id: 'fig01',
    file: 'figures/m05-max-likelihood/fig01.webp',
    caption: md`La figura *ML search* della slide «ML Estimation: Example»: stima ML della media $m$ di una gaussiana 1-D (*mono-dimensional Gaussian pdf*) a varianza nota, a partire da una sola osservazione $x_0$. Le cinque campane sono candidate con la stessa forma (la varianza è nota; a occhio $\sigma \approx 1$) e medie diverse, circa $-2, -1.5, 0, 1, 1.5$: la doppia freccia dice che cercare il massimo della verosimiglianza significa far scorrere la campana lungo l'asse, cioè variare $m$. La likelihood di ogni candidata è la quota a cui la sua curva taglia la verticale tratteggiata in $x_0$ (i trattini, da leggere sull'asse *Likelihood*): quasi zero per le campane lontane, intermedia per quelle vicine, massima per quella centrata esattamente su $x_0$. Riportando ogni trattino sopra la media della sua candidata si ottiene la likelihood come funzione del parametro, $L(m) = p(x_0 \mid m)$: un'altra campana di larghezza $\sigma$, centrata in $x_0$. Da ricordare: $\hat{m} = x_0$, con un solo campione la stima ML della media è il campione stesso. La slide non dà numeri: $\sigma$, $x_0$ e le medie sono letti dalla figura.`,
    alt: 'Grafico con asse orizzontale da -6 a 6 e asse verticale, etichettato Likelihood, che passa per lo zero. Cinque campane gaussiane di uguale forma, viola, rossa, blu, verde e magenta, centrate circa in -2, -1.5, 0, 1 e 1.5. Da x0 (circa 1), indicato da una freccia curva con etichetta x0, sale una linea verticale tratteggiata; su di essa piccoli trattini orizzontali segnano dove la attraversa ciascuna campana, il più alto sul picco della campana verde e l\'ultimo quasi sull\'asse. A sinistra la scritta in grassetto ML search con una doppia freccia orizzontale; a destra la conclusione: implica m cappello uguale a x0.',
    source: { doc: 'ch2', page: 18 },
  },
  {
    id: 'fig02',
    file: 'figures/m05-max-likelihood/fig02.webp',
    caption: md`La stessa figura *ML search* nelle note del corso, subito dopo la frase che introduce l'esempio: stima ML della media $m$ di una gaussiana 1-D (*mono-dimensional Gaussian probability density function*) con varianza nota e una sola osservazione $x_0$. Si legge come la versione della slide: le campane candidate, tutte della stessa forma, scorrono lungo l'asse (*ML search*); la likelihood di ciascuna è la quota letta sulla verticale tratteggiata in $x_0$; vince la campana centrata su $x_0$, quindi $\hat{m} = x_0$.`,
    alt: 'Copia della figura della slide: asse orizzontale da -6 a 6, asse verticale Likelihood nello zero, cinque campane di uguale forma (viola, rossa, blu, verde, magenta) centrate circa in -2, -1.5, 0, 1 e 1.5, una verticale tratteggiata in x0 (circa 1) con i trattini delle quote di ciascuna campana, la scritta ML search con una doppia freccia a sinistra e la conclusione m cappello uguale a x0 a destra.',
    source: { doc: 'part1', page: 20 },
  },
  {
    id: 'fig03',
    file: 'figures/m05-max-likelihood/fig03.webp',
    caption: md`Pannello *Gaussian* della galleria di modelli delle note (*examples of these models*): $f(x;\mu,\sigma) = \frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac{(x-\mu)^2}{2\sigma^2}}$ con quattro scelte dei parametri. Con $\mu = 0$ e varianza $\sigma^2 = 0.2, 1, 5$ la campana resta centrata e si allarga abbassandosi (picchi circa $0.89$, $0.40$, $0.18$); con $\mu = -2$ e $\sigma^2 = 0.5$ si sposta a sinistra (picco circa $0.56$). Da ricordare: la media $\mu$ (*mean*) fissa la posizione, la varianza $\sigma^2$ (*variance*) la larghezza, e siccome l'area resta 1 il picco vale $1/(\sigma\sqrt{2\pi})$. Le note lo indicano per dati distribuiti normalmente (*ideal for data that follows a normal distribution*): modello simmetrico, definito su tutta la retta reale, con due parametri.`,
    alt: 'Pannello intitolato Gaussian con quattro campane su un asse orizzontale da -5 a 5 e verticale da 0 a 1. Legenda: mu 0 e sigma quadro 0.2 (rossa, stretta e alta, picco vicino a 0.9), mu 0 e sigma quadro 1.0 (verde, picco 0.4), mu 0 e sigma quadro 5.0 (blu, larga e bassa, picco sotto 0.2), mu -2 e sigma quadro 0.5 (magenta, centrata in -2, picco vicino a 0.56). Sotto il grafico la formula: f(x; mu, sigma) uguale a 1 su sigma per radice di 2 pi, per e alla meno (x meno mu) al quadrato su 2 sigma quadro.',
    source: { doc: 'part1', page: 22 },
  },
  {
    id: 'fig04',
    file: 'figures/m05-max-likelihood/fig04.webp',
    caption: md`Pannello *Generalized Gaussian*: $f(x;m,b,\beta) = \frac{b\beta}{2\Gamma(1/\beta)}\,e^{-\left[b\vert x-m\vert\right]^{\beta}}$, con $m$ posizione, $b$ parametro di scala (inverso della larghezza) e $\beta$ parametro di forma (*shape parameter*); $\Gamma$ è la funzione Gamma di Eulero. Le quattro curve sono centrate in zero e hanno la stessa varianza (unitaria, a giudicare dai picchi): $\beta = 0.8$ è una cuspide con picco vicino a 1 e code pesanti (*heavy tails*), $\beta = 1$ è la laplaciana (picco circa $0.71$), $\beta = 2$ la gaussiana (picco circa $0.40$), $\beta = 10$ quasi un rettangolo alto circa $0.3$. Da ricordare: un parametro di forma in più rende la famiglia flessibile (*a flexible alternative that can represent various data distributions*); con $\beta = 2$ si torna alla gaussiana e per $\beta \to \infty$ la curva tende all'uniforme.`,
    alt: 'Pannello intitolato Generalized Gaussian con quattro curve nere centrate in zero su un asse orizzontale da -3 a 3 e verticale da 0 a 1, ciascuna con la sua etichetta: beta = 0.8 è una cuspide stretta che arriva quasi a 1, beta = 1 una cuspide più bassa vicino a 0.7, beta = 2 una campana con picco 0.4, beta = 10 una curva piatta a quota 0.3 tra circa -1.7 e 1.7 con fianchi ripidi. Sotto il grafico la formula: f(x; m, b, beta) uguale a b beta su 2 Gamma di 1 su beta, per e alla meno [b per il valore assoluto di x meno m] alla beta.',
    source: { doc: 'part1', page: 22 },
  },
  {
    id: 'fig05',
    file: 'figures/m05-max-likelihood/fig05.webp',
    caption: md`Pannello *Gamma*: $f(x;k,\theta) = x^{k-1}\,\frac{e^{-x/\theta}}{\theta^{k}\,\Gamma(k)}$ per $x > 0$, con $k$ parametro di forma (*shape*) e $\theta$ parametro di scala (*scale*). Attenzione: qui $\theta$ è la scala della Gamma, non il vettore dei parametri della stima ML. Con $k = 1$ e $\theta = 2$ è un'esponenziale che parte da $1/\theta = 0.5$; con $k = 2$ e $k = 3$ (sempre $\theta = 2$) compare una gobba che si sposta a destra e si allarga; le curve $k = 5, \theta = 1$ e $k = 9, \theta = 0.5$ hanno la stessa moda $(k-1)\theta = 4$ di $k = 3, \theta = 2$ ma sono via via più strette, alte e simmetriche. Da ricordare: è un modello per dati continui non negativi e asimmetrici (*non-negative continuous data*), usato per esempio nella teoria delle code (*queuing theory*); media $k\theta$, varianza $k\theta^2$.`,
    alt: 'Pannello intitolato Gamma con cinque curve su un asse orizzontale da 0 a 20 e verticale da 0 a 0.5. Legenda: k = 1 e theta = 2.0 (rossa, decresce da 0.5 come un\'esponenziale), k = 2 e theta = 2.0 (verde, gobba con picco circa 0.18 in x = 2), k = 3 e theta = 2.0 (blu, gobba larga con picco circa 0.135 in x = 4), k = 5 e theta = 1.0 (magenta, picco circa 0.2 in x = 4), k = 9 e theta = 0.5 (nera, la più alta e stretta, picco circa 0.28 in x = 4). Sotto il grafico la formula: f(x; k, theta) uguale a x alla k meno 1 per e alla meno x su theta, diviso theta alla k per Gamma di k, for x > 0.',
    source: { doc: 'part1', page: 22 },
  },
  {
    id: 'fig06',
    file: 'figures/m05-max-likelihood/fig06.webp',
    caption: md`Pannello *Rayleigh*: $f(x\mid\sigma) = \frac{x\exp\left(\frac{-x^2}{2\sigma^2}\right)}{\sigma^2}$ per $x \ge 0$, con un solo parametro di scala $\sigma$. Le cinque curve ($\sigma = 0.5, 1, 2, 3, 4$) partono tutte da zero, salgono a una moda che cade in $x = \sigma$ e scendono con una coda lunga a destra: più $\sigma$ è grande, più la curva è larga e bassa (il picco vale $1/(\sigma\sqrt{e})$, circa $1.2$ per $\sigma = 0.5$ e $0.15$ per $\sigma = 4$). Da ricordare: è la pdf del modulo di un vettore con due componenti gaussiane indipendenti a media nulla e uguale $\sigma$; per questo si usa in radar e telecomunicazioni per l'ampiezza dei segnali diffusi (*scattered signals*).`,
    alt: 'Pannello intitolato Rayleigh con cinque curve su un asse orizzontale x da 0 a 10 e verticale da 0 a 1.2. Legenda: sigma = 0.5 (blu, picco stretto circa 1.2 vicino a x = 0.5), sigma = 1.0 (nera, picco circa 0.6 in x = 1), sigma = 2.0 (verde, picco circa 0.3 in x = 2), sigma = 3.0 (rossa, picco circa 0.2 in x = 3), sigma = 4.0 (magenta, bassa e larga, picco circa 0.15 in x = 4). Tutte partono da zero nell\'origine. Sotto il grafico la formula: f(x dato sigma) uguale a x per exp di meno x quadro su 2 sigma quadro, diviso sigma quadro.',
    source: { doc: 'part1', page: 22 },
  },
  {
    id: 'fig07',
    file: 'figures/m05-max-likelihood/fig07.webp',
    caption: md`Pannello *Chi-Square*: $f(x;k) = \frac{(1/2)^{k/2}}{\Gamma(k/2)}\,x^{k/2-1}e^{-x/2}$ per $x \ge 0$, con un solo parametro $k$, i gradi di libertà (*degrees of freedom*). Con $k = 1$ la curva diverge in zero, con $k = 2$ è un'esponenziale che parte da $0.5$; per $k \ge 3$ compare una gobba con moda in $x = k - 2$, che si abbassa e scivola a destra al crescere di $k$. Da ricordare: è la pdf della somma dei quadrati di $k$ gaussiane standard indipendenti (media $k$, varianza $2k$), coincide con una Gamma di forma $k/2$ e scala 2, e si usa nei test d'ipotesi e di bontà dell'adattamento (*hypothesis testing*, *goodness-of-fit*).`,
    alt: 'Pannello intitolato Chi-Square con cinque curve su un asse orizzontale da 0 a 8 e verticale da 0 a 1. Legenda: k = 1 (nera, esce dal grafico verso l\'alto vicino a zero e poi decresce), k = 2 (blu, decresce da 0.5), k = 3 (verde, picco circa 0.24 in x = 1), k = 4 (rossa, picco circa 0.18 in x = 2), k = 5 (magenta, picco circa 0.15 in x = 3). Sotto il grafico la formula: f(x; k) uguale a (1/2) alla k/2 su Gamma di k/2, per x alla k/2 meno 1, per e alla meno x/2.',
    source: { doc: 'part1', page: 22 },
  },
  {
    id: 'fig08',
    file: 'figures/m05-max-likelihood/fig08.webp',
    caption: md`Pannello *Log-Normal*: $f(x;\mu,\sigma) = \frac{e^{-(\ln x-\mu)^2/(2\sigma^2)}}{x\sigma\sqrt{2\pi}}$ per $x > 0$, dove $\mu$ e $\sigma$ sono media e deviazione standard di $\ln x$, non di $x$ ($x$ è log-normale se $\ln x$ è gaussiana). Tutte le curve hanno $\mu = 0$: con $\sigma = 10$ la massa è schiacciata contro l'asse verticale, con $\sigma = 3/2$ e $\sigma = 1$ la curva è molto asimmetrica, e al calare di $\sigma$ ($1/2$, $1/4$, $1/8$) diventa stretta e quasi simmetrica attorno a $e^{\mu} = 1$; la curva $\sigma = 1/8$ esce dal riquadro (il suo picco è circa $3.2$). Da ricordare: modello per variabili positive con asimmetria a destra (*positively skewed*), come i dati finanziari (*financial data*); moda $e^{\mu-\sigma^2}$, mediana $e^{\mu}$.`,
    alt: 'Pannello intitolato Log-Normal con sei curve su un asse orizzontale x da 0 a 3 e verticale da 0 a 2, con mu = 0 scritto accanto alla legenda. sigma = 10 (nera, altissima vicino a zero e poi quasi piatta), sigma = 3/2 (blu, picco circa 0.8 vicino a x = 0.1), sigma = 1 (verde, picco circa 0.65 vicino a 0.4), sigma = 1/2 (gialla, picco circa 0.9 vicino a 0.8), sigma = 1/4 (rossa, picco circa 1.65 vicino a 0.95), sigma = 1/8 (magenta, stretta attorno a 1, esce dal bordo superiore). Sotto il grafico la formula: f(x; mu, sigma) uguale a e alla meno (ln x meno mu) al quadrato su 2 sigma quadro, diviso x sigma per radice di 2 pi.',
    source: { doc: 'part1', page: 22 },
  },
  {
    id: 'fig09',
    file: 'figures/m05-max-likelihood/fig09.webp',
    caption: md`Gaussiana bivariata (*bivariate Gaussian distribution*): con due feature la pdf $p(\mathbf{x}) = p(x_1, x_2)$ è una superficie a campana sopra il piano $(x_1, x_2)$ (*3D bell-shaped surface*), e l'altezza in ogni punto è la densità congiunta (*joint distribution*). La campana non è a simmetria circolare: appare allungata in una direzione obliqua rispetto agli assi, segno che le due variabili sono correlate (*correlated variables*). Da ricordare: il volume sotto la superficie vale 1 (*unit volume*), come l'area sotto una pdf 1-D; le sezioni orizzontali sono ellissi di isolivello (*isolevels*) con gli assi lungo gli autovettori di $\Sigma$; più la campana è larga (più grande $\vert\Sigma\vert$), più è bassa, perché il picco vale $1/(2\pi\vert\Sigma\vert^{1/2})$.`,
    alt: 'Superficie 3-D disegnata come una rete di linee nere su fondo bianco: una campana con un solo picco, più ripida da un lato, che si appiattisce verso i bordi della griglia. In basso a sinistra una terna di assi: x1 orizzontale verso destra, x2 obliquo verso il fondo, asse verticale etichettato p(x) = p(x1, x2).',
    source: { doc: 'part1', page: 23 },
  },
  {
    id: 'fig10',
    file: 'figures/m05-max-likelihood/fig10.webp',
    caption: md`La matrice di covarianza (*covariance matrix*) nel caso di feature indipendenti (*independent features*): $\Sigma$ è diagonale (*diagonal*), con le varianze $\sigma_1^2, \sigma_2^2, \dots, \sigma_n^2$ delle singole feature sulla diagonale e zero fuori, perché gli elementi fuori diagonale sono le covarianze. Da ricordare: in questo caso la gaussiana multivariata si fattorizza nel prodotto delle marginali, $p(\mathbf{x}) = p(x_1)\,p(x_2)\cdots p(x_n)$, e le ellissi di isolivello hanno gli assi paralleli agli assi delle coordinate. L'indipendenza implica covarianze nulle; il viceversa vale per variabili congiuntamente gaussiane, non in generale.`,
    alt: 'Formula: Sigma uguale a una matrice n per n tra parentesi quadre, con sigma 1 quadro, sigma 2 quadro e, in fondo, sigma n quadro sulla diagonale principale e zeri in tutte le altre posizioni; la terza riga e la terza colonna sono fatte di puntini.',
    source: { doc: 'part1', page: 24 },
  },
]
