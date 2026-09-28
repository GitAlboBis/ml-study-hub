// Figure del foglio m06 (modelli di pdf e modello gaussiano), ritagli in public/figures/m06-modelli-pdf-gaussiana/<id>.webp.
// Come sono stati prodotti (render dal PDF originale con le funzioni render/save_webp di scripts/fig.py):
// - ch2 p.22-24, 27, 28, 30, 31: `fig.py crop` normale (zoom 3), tranne fig01 a zoom 4, la risoluzione nativa
//   dell'immagine incorporata nella slide.
// - part1 (note): le figure sono immagini raster incorporate, ritagliate a zoom pari alla risoluzione nativa
//   (5.23 per p.22, 4.16 per p.23, 5.68 per p.25) e poi ridotte a 1400 px di larghezza da save_webp.
// Interventi sui ritagli, tutti senza toccare il contenuto delle figure:
// - fig08: sbiancata la scritta rossa della slide «Example of a bivariate Gaussian pdf», a sinistra della superficie
//   (è testo della slide, non della figura, e il ritaglio non poteva escluderla senza tagliare la formula).
// - fig13: sbiancato il sottotitolo blu «Example of a 3-D Gaussian Distribution», che sta alla stessa altezza
//   dell'etichetta x3; la nota obliqua su x1 e x3 resta perché fa parte del messaggio della figura.
// - fig12: le due figure di part1 p.25 (campana affettata in alto, nuvola 3-D al centro) sono separate da testo nella
//   pagina; il WebP le impila con uno spazio bianco al posto del testo.
// - fig14: corpo della slide senza la barra del titolo, il logo e il piè di pagina.
// Particolari della fonte lasciati come sono: in fig01 e fig07 l'ultima etichetta dell'asse x della gaussiana (5) è
// tagliata già nell'immagine originale e c'è un puntino isolato in alto a destra; la superficie di fig08/fig09 è
// un'immagine a bassa risoluzione nella fonte; nella curva log-normale sigma=1/8 il picco esce dalla scala.
// fig09 e fig12 (importanza 1) sono le copie, nelle note, di figure delle slide (fig08; fig11 e fig13): restano qui
// come riferimento alle pagine delle note. fig07 è la griglia delle note che riunisce fig01-fig06.
// Le didascalie non citano id interni (figNN, cNN, derNN): lo studente non li vede.
import { md } from '../../types'
import type { Figure } from '../../types'

export const figures: Figure[] = [
  {
    id: 'fig01',
    file: 'figures/m06-modelli-pdf-gaussiana/fig01.webp',
    caption: md`La pdf gaussiana univariata (*Gaussian pdf*), primo degli esempi di pdf (*PDF Examples*): $f(x;\mu,\sigma) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$. Quattro curve: rossa $\mu = 0,\ \sigma^2 = 0.2$ (stretta e alta, picco $\approx 0.89$), verde $\mu = 0,\ \sigma^2 = 1$ (la normale standard, picco $\approx 0.40$), blu $\mu = 0,\ \sigma^2 = 5$ (larga e bassa, picco $\approx 0.18$), magenta $\mu = -2,\ \sigma^2 = 0.5$ (centrata in $-2$, picco $\approx 0.56$). Da ricordare: la media $\mu$ trasla la campana senza deformarla; la varianza $\sigma^2$ ne regola la larghezza e, poiché l'area resta 1, l'altezza del picco $1/(\sigma\sqrt{2\pi})$ scende quando $\sigma$ cresce. Attenzione alla notazione: la legenda dà la varianza $\sigma^2$, la formula è scritta con la deviazione standard $\sigma$.`,
    alt: "Grafico con asse orizzontale da -5 a 5 e asse verticale da 0 a 1, titolo Gaussian. Quattro campane: rossa centrata in 0, stretta, con picco vicino a 0.89; verde centrata in 0 con picco 0.4; blu centrata in 0, larga e bassa, con picco vicino a 0.18; magenta centrata in -2 con picco vicino a 0.56. In alto a destra la legenda con mu e sigma quadro di ogni curva; sotto il grafico la formula f(x; mu, sigma) = 1 su sigma per radice di 2 pi, per e alla meno (x meno mu) al quadrato su 2 sigma quadro.",
    source: { doc: 'ch2', page: 22 },
  },
  {
    id: 'fig02',
    file: 'figures/m06-modelli-pdf-gaussiana/fig02.webp',
    caption: md`La gaussiana generalizzata (*Generalized Gaussian*): $f(x;m,b,\beta) = \frac{b\beta}{2\Gamma(1/\beta)} e^{-[b\vert x-m\vert]^{\beta}}$, con posizione $m$, scala inversa $b$ e parametro di forma (*shape parameter*) $\beta$; $\Gamma$ è la funzione Gamma di Eulero. Le quattro curve, tutte centrate in 0, vanno da $\beta = 0.8$ (punta acutissima, picco $\approx 0.97$, code pesanti) a $\beta = 1$ (cuspide, picco $\approx 0.71$), $\beta = 2$ (campana liscia, picco $\approx 0.40$) e $\beta = 10$ (profilo quasi rettangolare: quasi piatto a $\approx 0.29$ fino a $\vert x \vert \approx 1.3$, poi fianchi ripidi che scendono a $\approx 0.11$ in $\pm 1.78$ e a zero verso $\pm 2.1$). Da ricordare: al crescere di $\beta$ la punta si appiattisce e le code si accorciano. Dalla formula si ricava che $\beta = 2$ ridà la gaussiana, $\beta = 1$ la laplaciana (*Laplacian*) e $\beta$ molto grande tende all'uniforme: per questo si chiama «generalizzata». La slide non dichiara $m$ e $b$: dai picchi si deduce $m = 0$ e varianza unitaria per tutte le curve.`,
    alt: "Grafico con asse orizzontale da -3 a 3 e asse verticale da 0 a 1, titolo Generalized Gaussian. Quattro curve nere simmetriche centrate in 0: beta = 0.8 con una punta sottilissima che arriva quasi a 1; beta = 1 con una cuspide a circa 0.7; beta = 2 con una campana liscia a circa 0.4; beta = 10 con un profilo quasi piatto a circa 0.29 fino a circa 1.3 in valore assoluto, poi fianchi ripidi che arrivano a zero verso -2.1 e 2.1. Sotto, la formula f(x; m, b, beta) = b beta su 2 Gamma(1/beta), per e alla meno [b |x - m|] alla beta.",
    source: { doc: 'ch2', page: 22 },
  },
  {
    id: 'fig03',
    file: 'figures/m06-modelli-pdf-gaussiana/fig03.webp',
    caption: md`La pdf Gamma (*Gamma pdf*): $f(x;k,\theta) = x^{k-1}\frac{e^{-x/\theta}}{\theta^{k}\Gamma(k)}$ per $x > 0$, con parametro di forma (*shape*) $k$ e di scala (*scale*) $\theta$. Cinque curve: rossa $k = 1,\ \theta = 2$ (esponenziale decrescente che parte da $0.5$), verde $k = 2,\ \theta = 2$ (moda in $x = 2$, picco $\approx 0.18$), poi blu $k = 3,\ \theta = 2$, magenta $k = 5,\ \theta = 1$ e nera $k = 9,\ \theta = 0.5$, tutte con moda $(k-1)\theta = 4$ ma con picchi $\approx 0.135$, $0.195$ e $0.28$. Da ricordare: $k$ decide la forma (con $k = 1$ la curva è monotona decrescente, con $k > 1$ è una campana asimmetrica con la coda a destra, sempre più simmetrica al crescere di $k$), $\theta$ stira o comprime l'asse $x$; le tre curve con la stessa moda hanno varianze $k\theta^2$ diverse, $12$, $5$ e $2.25$. Vive solo su $x$ positivi: adatta a dati continui non negativi, come i tempi d'attesa della teoria delle code (*queuing theory*).`,
    alt: "Grafico con asse orizzontale da 0 a 20 e asse verticale da 0 a 0.5, titolo Gamma. Una curva rossa parte da 0.5 in x = 0 e decresce; una verde sale da zero fino a un picco di circa 0.18 in x = 2; una blu, una magenta e una nera hanno tutte il massimo in x = 4, con altezze crescenti di circa 0.135, 0.195 e 0.28, e la nera è la più stretta. Tutte hanno una coda verso destra. Legenda con i valori di k e theta; sotto, la formula f(x; k, theta) = x alla k meno 1 per e alla meno x su theta, diviso theta alla k per Gamma(k), per x maggiore di 0.",
    source: { doc: 'ch2', page: 23 },
  },
  {
    id: 'fig04',
    file: 'figures/m06-modelli-pdf-gaussiana/fig04.webp',
    caption: md`La pdf di Rayleigh (*Rayleigh pdf*): $f(x\vert\sigma) = \frac{x\exp\left(\frac{-x^2}{2\sigma^2}\right)}{\sigma^2}$, con un solo parametro $\sigma$, definita per $x \ge 0$ (la slide non scrive il supporto). Cinque curve per $\sigma = 0.5, 1, 2, 3, 4$: tutte partono da 0, salgono e scendono con una coda a destra. Da ricordare: la moda cade esattamente in $x = \sigma$ e il picco vale $1/(\sigma\sqrt{e}) \approx 0.607/\sigma$ (circa $1.21$ per $\sigma = 0.5$, $0.61$ per $\sigma = 1$, $0.15$ per $\sigma = 4$): raddoppiare $\sigma$ sposta la moda al doppio e dimezza l'altezza. È la distribuzione del modulo di un vettore con due componenti gaussiane indipendenti, a media nulla e con la stessa $\sigma$: per questo si usa in radar e comunicazioni per i segnali diffusi (*scattered signals*).`,
    alt: "Grafico con asse orizzontale x da 0 a 10 e asse verticale da 0 a 1.2, titolo Rayleigh. Cinque curve che partono da zero: blu (sigma 0.5) con un picco alto e stretto di circa 1.2 in x = 0.5; nera (sigma 1) con picco 0.6 in x = 1; verde (sigma 2) con picco 0.3 in x = 2; rossa (sigma 3) con picco 0.2 in x = 3; magenta (sigma 4), la più piatta, con picco 0.15 in x = 4. Sotto, la formula f(x | sigma) = x per exp(meno x quadro su 2 sigma quadro), diviso sigma quadro.",
    source: { doc: 'ch2', page: 23 },
  },
  {
    id: 'fig05',
    file: 'figures/m06-modelli-pdf-gaussiana/fig05.webp',
    caption: md`La pdf chi-quadro (*Chi-Square pdf*): $f(x;k) = \frac{(1/2)^{k/2}}{\Gamma(k/2)} x^{k/2-1} e^{-x/2}$, con un solo parametro, i gradi di libertà (*degrees of freedom*) $k$: è la distribuzione della somma dei quadrati di $k$ gaussiane standard indipendenti. Cinque curve: $k = 1$ (nera, diverge per $x \to 0$), $k = 2$ (blu, esponenziale che parte da $0.5$), $k = 3$ (verde, moda in $x = 1$, picco $\approx 0.24$), $k = 4$ (rossa, moda in $x = 2$, picco $\approx 0.18$), $k = 5$ (magenta, moda in $x = 3$, picco $\approx 0.15$). Da ricordare: al crescere di $k$ la massa si sposta a destra (media $k$, moda $k-2$ per $k \ge 2$) e la curva si allarga. Confrontando le formule, il chi-quadro con $k$ gradi di libertà è una Gamma di forma $k/2$ e scala $\theta = 2$: la curva blu $k = 2$ coincide con la Gamma rossa $k = 1,\ \theta = 2$ della slide precedente. Si usa nei test d'ipotesi e di bontà di adattamento (*goodness-of-fit*).`,
    alt: "Grafico con asse orizzontale da 0 a 8 e asse verticale da 0 a 1, titolo Chi-Square. La curva nera (k = 1) scende dall'alto vicino a x = 0; la blu (k = 2) parte da 0.5 e decresce; la verde (k = 3), la rossa (k = 4) e la magenta (k = 5) partono da zero e hanno picchi sempre più bassi e più a destra, circa 0.24 in x = 1, 0.18 in x = 2 e 0.15 in x = 3. Sotto, la formula f(x; k) = (1/2) alla k/2 su Gamma(k/2), per x alla k/2 meno 1, per e alla meno x/2.",
    source: { doc: 'ch2', page: 24 },
  },
  {
    id: 'fig06',
    file: 'figures/m06-modelli-pdf-gaussiana/fig06.webp',
    caption: md`La pdf log-normale (*Log-Normal pdf*): $f(x;\mu,\sigma) = \frac{e^{-(\ln x-\mu)^2/(2\sigma^2)}}{x\sigma\sqrt{2\pi}}$ per $x > 0$. Una variabile è log-normale quando il suo logaritmo è gaussiano: $\mu$ e $\sigma$ sono media e deviazione standard di $\ln x$, non di $x$. Sei curve, tutte con $\mu = 0$ (annotazione aggiunta nella legenda): $\sigma = 10$ (nera, massa schiacciata contro $x = 0$), $\sigma = 3/2$ (blu, picco $\approx 0.82$ vicino a $x \approx 0.1$), $\sigma = 1$ (verde, $\approx 0.66$ in $x \approx 0.37$), $\sigma = 1/2$ (gialla, $\approx 0.90$ in $x \approx 0.78$), $\sigma = 1/4$ (rossa, $\approx 1.65$ in $x \approx 0.94$), $\sigma = 1/8$ (magenta, picco $\approx 3.2$ che esce dal grafico, tagliato a 2). Da ricordare: con $\sigma$ piccola la curva è una campana stretta quasi simmetrica attorno alla mediana $e^{\mu} = 1$; al crescere di $\sigma$ la moda $e^{\mu-\sigma^2}$ scivola verso 0 e la coda destra si allunga. È l'asimmetria positiva (*positively skewed*) tipica dei dati finanziari.`,
    alt: "Grafico con asse orizzontale x da 0 a 3 e asse verticale da 0 a 2, titolo Log-Normal, legenda con sei valori di sigma e l'annotazione mu = 0. La curva nera sale verticalmente accanto a x = 0 e poi resta quasi a zero; la blu ha un picco di circa 0.8 vicino a x = 0.1; la verde un picco di circa 0.65 vicino a x = 0.4; la gialla circa 0.9 vicino a x = 0.8; la rossa un picco stretto di circa 1.65 vicino a x = 0.95; la magenta è un ago vicino a x = 1 che esce dal bordo superiore. Tutte hanno la coda verso destra. Sotto, la formula f(x; mu, sigma) = e alla meno (ln x meno mu) al quadrato su 2 sigma quadro, diviso x sigma radice di 2 pi.",
    source: { doc: 'ch2', page: 24 },
  },
  {
    id: 'fig07',
    file: 'figures/m06-modelli-pdf-gaussiana/fig07.webp',
    caption: md`Nelle note del corso i sei esempi di pdf delle slide sono riuniti in una griglia di tre righe per due colonne: gaussiana (*Gaussian*), gaussiana generalizzata (*Generalized Gaussian*), Gamma, Rayleigh, chi-quadro (*Chi-Square*) e log-normale (*Log-Normal*), ognuna con il suo grafico e la sua formula. Letti insieme mostrano le differenze che guidano la scelta del modello (*model selection*): gaussiana e gaussiana generalizzata sono definite su tutto l'asse reale e sono simmetriche; Gamma, Rayleigh, chi-quadro e log-normale vivono solo su $x$ positivi e sono asimmetriche con la coda a destra. Numero di parametri: 2 ($\mu, \sigma$), 3 ($m, b, \beta$), 2 ($k, \theta$), 1 ($\sigma$), 1 ($k$), 2 ($\mu, \sigma$). Sono tutti modelli parametrici: scelta la famiglia, stimare $p(x)$ vuol dire stimare pochi numeri. Subito sotto le note avvertono che scegliere il modello non è banale (*Model selection is not a trivial task*).`,
    alt: "Sei grafici su tre righe e due colonne, ciascuno con titolo e formula sotto. Prima riga: Gaussian, quattro campane colorate su x da -5 a 5; Generalized Gaussian, quattro curve nere da punta acuta a profilo quasi rettangolare, beta = 0.8, 1, 2, 10. Seconda riga: Gamma, cinque curve su x da 0 a 20; Rayleigh, cinque curve per sigma da 0.5 a 4 su x da 0 a 10. Terza riga: Chi-Square, cinque curve per k da 1 a 5 su x da 0 a 8; Log-Normal, sei curve con mu = 0 e sigma da 10 a 1/8 su x da 0 a 3.",
    source: { doc: 'part1', page: 22 },
  },
  {
    id: 'fig08',
    file: 'figures/m06-modelli-pdf-gaussiana/fig08.webp',
    caption: md`La pdf gaussiana multivariata (*multivariate Gaussian pdf*) come la scrive la slide: $p(\mathbf{x}\vert\theta) = p(\mathbf{x}\vert\mathbf{m},\Sigma) = \frac{1}{(2\pi)^{n/2}\vert\Sigma\vert^{1/2}}\allowbreak\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]$. Il vettore dei parametri $\theta$ è la coppia $(\mathbf{m},\Sigma)$. Le frecce verdi nominano i due parametri: la matrice di covarianza (*covariance matrix*) $\Sigma$, indicata in $p(\mathbf{x}\vert\mathbf{m},\Sigma)$, e il vettore media (*mean vector*) $\mathbf{m}$, indicato nello scarto $(\mathbf{x}-\mathbf{m})$ dell'esponente; la freccia blu dà all'intera espressione il nome compatto $N(\mathbf{m},\Sigma)$. Sotto, l'esempio di pdf gaussiana bivariata (*bivariate Gaussian pdf*): una superficie a rete sopra il piano $(x_1, x_2)$ con quota $p(\mathbf{x}) = p(x_1, x_2)$, una campana con il colmo allungato in diagonale. Da ricordare: bastano $\mathbf{m}$ (dove sta il picco) e $\Sigma$ (larghezza e orientamento) per individuare la pdf; l'allungamento obliquo della campana è l'effetto di una covarianza non nulla tra $x_1$ e $x_2$.`,
    alt: "In alto la formula della gaussiana multivariata: p(x | theta) = p(x | m, Sigma) = 1 su (2 pi) alla n/2 per il determinante di Sigma alla 1/2, per exp di meno un mezzo (x meno m) trasposto per Sigma inversa per (x meno m). Una freccia verde scende dalla Sigma di p(x | m, Sigma) verso la scritta Covariance matrix; un'altra scende dalla m dell'esponente verso la scritta Mean vector; una freccia blu curva sale dalla scritta N(m, Sigma), in basso a destra, fino alla parentesi quadra finale. In basso al centro una superficie a rete in prospettiva, con asse verticale p(x) = p(x1, x2) e assi x1 e x2 alla base: una campana con il colmo allungato in diagonale.",
    source: { doc: 'ch2', page: 26 },
  },
  {
    id: 'fig09',
    file: 'figures/m06-modelli-pdf-gaussiana/fig09.webp',
    caption: md`La stessa superficie della slide, nelle note del corso subito dopo l'elenco dei simboli della formula: nel caso bivariato (*bivariate Gaussian distribution*) la pdf forma una superficie 3-D a campana (*3D bell-shaped surface*) che rappresenta la distribuzione congiunta di due variabili correlate. La quota è $p(\mathbf{x}) = p(x_1, x_2)$ sopra il piano $(x_1, x_2)$; il colmo allungato in diagonale è il segno della correlazione tra $x_1$ e $x_2$.`,
    alt: "Superficie a rete in prospettiva con asse verticale p(x) = p(x1, x2) e assi x1 e x2 alla base: una campana con il colmo allungato in diagonale che scende verso un bordo piatto. È la copia, nelle note, della figura della slide.",
    source: { doc: 'part1', page: 23 },
  },
  {
    id: 'fig10',
    file: 'figures/m06-modelli-pdf-gaussiana/fig10.webp',
    caption: md`Per feature indipendenti (*independent features*) la matrice di covarianza è diagonale: le varianze $\sigma_1^2, \sigma_2^2, \dots, \sigma_n^2$ stanno sulla diagonale e tutte le covarianze fuori diagonale sono zero. La freccia porta alla conseguenza sulla pdf: $p(\mathbf{x}) = p(x_1)\,p(x_2) \cdots p(x_n)$, la congiunta è il prodotto delle gaussiane univariate delle singole feature. Da ricordare: l'implicazione «feature indipendenti $\Rightarrow$ $\Sigma$ diagonale» vale per qualunque distribuzione; il viceversa (covarianze nulle $\Rightarrow$ indipendenza) vale per il modello gaussiano, non in generale. È l'ipotesi alla base del classificatore naive Bayes gaussiano.`,
    alt: "A sinistra la matrice Sigma n per n con sigma1 quadro, sigma2 quadro, fino a sigman quadro sulla diagonale e zeri in tutte le altre posizioni; puntini indicano gli elementi omessi. Al centro una freccia verde acqua verso destra. A destra la formula p(x) = p(x1) p(x2) ... p(xn).",
    source: { doc: 'ch2', page: 27 },
  },
  {
    id: 'fig11',
    file: 'figures/m06-modelli-pdf-gaussiana/fig11.webp',
    caption: md`La forma di una pdf gaussiana 2-D (*Shape of a 2-D Gaussian PDF*). A sinistra la campana $z = P(\mathbf{x})$ sopra il piano $(x_1, x_2)$, di volume unitario (*bell of unitary volume*), tagliata da fette orizzontali (la figura scrive $P$ maiuscola per la stessa $p(\mathbf{x})$). A destra la vista dall'alto: le fette sono curve di livello (*isolevels*) ellittiche, tre ellissi concentriche etichettate dall'interno $z = 2$, $z = 0.5$ e $z = 0.01$. L'etichetta $z = 3$ non è un'ellisse ma il punto nero centrale: la media $\mathbf{m}$, dove la campana ha la quota massima e l'isolivello si riduce a un punto. Gli assi delle ellissi sono diretti dagli autovettori (*eigenvectors*) $\mathbf{e}_1$ ed $\mathbf{e}_2$ della matrice di covarianza, ruotati rispetto a $x_1, x_2$ perché la covarianza non è nulla; $\mathbf{e}_1$, l'autovettore del massimo autovalore, dà l'asse principale (*main axis*), la direzione di massima varianza. Da ricordare: quota alta vuol dire ellisse piccola vicino alla media, quota bassa ellisse grande; tutte condividono centro, orientazione e rapporto tra gli assi. Le quote sono illustrative ma coerenti: con picco 3 i raggi di Mahalanobis delle tre ellissi valgono $r = \sqrt{2\ln(3/z)}$, cioè circa $0.90$, $1.89$ e $3.38$.`,
    alt: "Due disegni affiancati. A sinistra una campana 3-D con asse verticale z = P(x) e assi x1 e x2 alla base, percorsa da molte fette orizzontali; due curve nere spesse ne tracciano il profilo e una freccetta sulla superficie indica la discesa. A destra, nel piano x1-x2, tre ellissi concentriche inclinate verso l'alto a destra, con le etichette z = 2 vicino alla più interna, z = 0.5 vicino alla seconda e z = 0.01 fuori dalla più esterna; al centro un punto nero etichettato z = 3. Due rette perpendicolari passano per il centro: e1 lungo l'asse maggiore, con freccia in alto a destra, ed e2 con freccia in alto a sinistra.",
    source: { doc: 'ch2', page: 28 },
  },
  {
    id: 'fig12',
    file: 'figures/m06-modelli-pdf-gaussiana/fig12.webp',
    caption: md`Le figure delle slide sulla forma della gaussiana come compaiono nella stessa pagina delle note del corso: in alto la campana 2-D affettata e le sue curve di livello ellittiche (il punto centrale $z = 3$, poi le ellissi $z = 2$, $0.5$, $0.01$) con gli assi $\mathbf{e}_1$, $\mathbf{e}_2$; sotto l'esempio di distribuzione gaussiana 3-D (*3-D gaussian distribution*), la nuvola di punti nel cubo con le ombre ellittiche sulle tre facce. Nella pagina le separa il testo che generalizza al caso $n$-dimensionale: gli isolivelli di $p(\mathbf{x})$ in $\mathbb{R}^n$ sono iperellissi (*hyperellipses*) con gli assi lungo gli autovettori di $\Sigma$; il primo autovettore (massimo autovalore) dà l'asse principale (*principal axis*), la direzione di massima varianza, l'ultimo (minimo autovalore) l'asse più corto (*smallest axis*), la direzione di minima varianza.`,
    alt: "Due immagini una sopra l'altra. In alto: a sinistra la campana 3-D z = P(x) affettata da piani orizzontali, a destra tre ellissi concentriche inclinate con le quote z = 2, 0.5, 0.01, il punto centrale z = 3 e le rette e1 ed e2. In basso: un cubo in prospettiva con assi x1, x2, x3, una nuvola di punti neri al centro e, sul pavimento e sulle due pareti di fondo, ellissi concentriche in tre toni di grigio.",
    source: { doc: 'part1', page: 25 },
  },
  {
    id: 'fig13',
    file: 'figures/m06-modelli-pdf-gaussiana/fig13.webp',
    caption: md`Esempio di distribuzione gaussiana 3-D (*Example of a 3-D Gaussian Distribution*): una nuvola di punti campionati da una gaussiana in tre dimensioni, dentro un cubo con assi $x_1$ (verso sinistra), $x_2$ (verso destra) e $x_3$ (verticale). Sulle facce sono proiettate le marginali a coppie, disegnate come ellissi concentriche in tre toni di grigio: sul pavimento il piano $(x_1, x_2)$, sulla parete sinistra $(x_1, x_3)$, sulla parete destra $(x_2, x_3)$. La nuvola è più densa vicino alla media e si dirada verso l'esterno: in 3-D gli isolivelli sono ellissoidi e le loro ombre sono ellissi. La nota obliqua dice che in questo esempio le feature $x_1$ e $x_3$ sono indipendenti (*the features x1 and x3 are independent*): l'ellisse sulla parete $(x_1, x_3)$ ha l'asse maggiore quasi parallelo all'asse $x_1$ disegnato, cioè $\sigma_{13} = 0$, e per una gaussiana covarianza nulla equivale a indipendenza. Le altre due ombre sono inclinate rispetto ai loro assi: quelle coppie di feature sono correlate.`,
    alt: "Cubo in prospettiva con asse verticale x3, asse x1 che scende verso sinistra e asse x2 verso destra. Al centro una fitta nuvola di punti neri, più densa nel mezzo. Sul pavimento un'ellisse allungata e orizzontale, sulla parete sinistra un'ellisse larga, con l'asse maggiore allineato all'asse x1 disegnato (obliqua solo per la prospettiva), sulla parete destra un'ellisse stretta e quasi verticale: ognuna formata da tre anelli concentrici in grigio chiaro, medio e scuro. In basso a sinistra una nota obliqua: Nota (in rosso): In this example, the features x1 and x3 are independent!",
    source: { doc: 'ch2', page: 30 },
  },
  {
    id: 'fig14',
    file: 'figures/m06-modelli-pdf-gaussiana/fig14.webp',
    caption: md`La slide riassuntiva della stima a massima verosimiglianza (*ML estimation*) della gaussiana multivariata, dati $N$ campioni di addestramento iid. La media campionaria $\hat{\mathbf{m}} = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k$ stima il vettore media; la covarianza stimata ha due forme equivalenti, $\hat{\Sigma} = \frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t} = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t} - \hat{\mathbf{m}}\hat{\mathbf{m}}^{t}$. Le stime sono asintoticamente non distorte (*asymptotically unbiased*), efficienti (*efficient*) e consistenti (*consistent*). I valori attesi dicono dove sta il bias: $E\{\hat{\mathbf{m}}\} = \mathbf{m}$ (media non distorta per ogni $N$), mentre $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$ (la covarianza ML sottostima quella vera e il fattore tende a 1 solo per $N \to \infty$). In fondo lo stimatore non distorto elementare (*elementary unbiased estimator*) di $\Sigma$, con $\frac{1}{N-1}$ al posto di $\frac{1}{N}$. Da ricordare: la slide usa lo stesso simbolo $\hat{\Sigma}$ per due stimatori diversi, quello ML (con $1/N$, distorto) e quello corretto (con $1/(N-1)$, non distorto, che richiede $N \ge 2$).`,
    alt: "Slide di testo con formule. Primo punto: It can be shown that the ML estimation of the mean vector and the covariance matrix of a multivariate Gaussian pdf, given a set of N iid training samples X = {x1, x2, ..., xN}, leads to; seguono m cappello = 1/N per la somma degli xk e Sigma cappello = 1/N per la somma di (xk meno m cappello)(xk meno m cappello) trasposto = 1/N per la somma di xk per xk trasposto, meno m cappello per m cappello trasposto. Secondo punto: Such estimates are asymptotically unbiased and efficient, and consistent, con le proprietà in rosso. Terzo: In addition, we have: E{m cappello} = m, E{Sigma cappello} = (N meno 1)/N per Sigma. Quarto: An elementary unbiased estimator for Sigma is, con sotto Sigma cappello = 1/(N meno 1) per la somma di (xk meno m cappello)(xk meno m cappello) trasposto.",
    source: { doc: 'ch2', page: 31 },
  },
]
