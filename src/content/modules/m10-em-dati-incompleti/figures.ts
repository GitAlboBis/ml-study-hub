// Figure del foglio m10 (stima con dati incompleti, algoritmo EM), ritagli in public/figures/m10-em-dati-incompleti/<id>.webp
// prodotti con scripts/fig.py (render vettoriale dal PDF originale). Tutte le 9 figure dell'inventario sono ritagliate e
// descritte qui; l'autore della teoria sceglie quali mostrare nell'MDX.
// Scelte sui ritagli, senza toccare il contenuto delle figure:
// - fig03 (freccia rossa, importanza 1): da sola non dice nulla, quindi il ritaglio comprende le due formule di Q che la
//   freccia collega; resta fuori la riga «That is, we define the so-called conditional expectation».
// - fig04: tra la pergamena e le due formule E-step/M-step c'è la riga «EM can thus be formalized into the following two
//   steps», inclusa perché sta in mezzo alla figura descritta dall'inventario.
// - fig09: nelle note le due immagini (equazioni EM della slide 76, figura dell'esempio della slide 77) sono separate da
//   un paragrafo di testo; sono state ritagliate a parte e riunite in un solo WebP (Pillow), una sopra l'altra, con una
//   sottile linea grigia in mezzo che non appartiene alla fonte.
// - fig02 è decorativa (importanza 1); fig07, fig08, fig09 sono le copie, nelle note, di figure già nelle slide.
// - Le didascalie non citano id interni: lo studente non li vede.
import { md } from '../../types'
import type { Figure } from '../../types'

export const figures: Figure[] = [
  {
    id: 'fig01',
    file: 'figures/m10-em-dati-incompleti/fig01.webp',
    caption: md`La superficie accanto alla formula della mistura di $M$ modi gaussiani (*mixture of M Gaussian modes*, slide p68), $p(\mathbf{x})=\sum_{i=1}^{M}P_i\,p(\mathbf{x}\mid\mathbf{m}_i,\Sigma_i)$: una densità bidimensionale fatta di quattro campane gaussiane (*Gaussian modes*) di colore diverso, dentro un riquadro prospettico. Ogni campana ha un peso $P_i$ (*prior probability*), che ne fissa il volume, una posizione $\mathbf{m}_i$ (*mean vector*) e una forma $\Sigma_i$ (*covariance matrix*): a parità di peso, una campana larga come quella marrone è anche bassa. Da ricordare: $p(\mathbf{x})$ è la somma dei modi, e dove le campane si sovrappongono non si può dire a occhio da quale modo venga un campione. È proprio l'informazione che manca e che rende il problema un problema con dati incompleti (*incomplete data*).`,
    alt: 'Superficie 3-D a reticolo dentro un riquadro prospettico: quattro campane sovrapposte su un piano, una rossa alta a sinistra, una grigio chiaro in primo piano, una grigio scuro più stretta sullo sfondo e una marrone larga e bassa a destra.',
    source: { doc: 'ch2', page: 68 },
  },
  {
    id: 'fig02',
    file: 'figures/m10-em-dati-incompleti/fig02.webp',
    caption: md`L'omino perplesso della slide p69, accanto ai tre motivi per cui stimare i modi della mistura è un problema con dati incompleti (*incomplete data*): abbiamo solo le osservazioni associate a tutta $p(\mathbf{x})$ e non quelle dei singoli modi; non sappiamo a quale modo è associato ogni campione (*which are the samples to use for the estimation of each mode?*); sappiamo solo che tra i modi nascosti (*hidden modes*) c'è una relazione di tipo somma. La figura è decorativa: il suo punto interrogativo è la domanda del secondo motivo, cioè l'associazione campione-modo che manca e che diventerà la variabile latente (*latent variable*).`,
    alt: 'Omino verde stilizzato, in piedi, che si gratta la testa con una mano, con un punto interrogativo sopra la testa.',
    source: { doc: 'ch2', page: 69 },
  },
  {
    id: 'fig03',
    file: 'figures/m10-em-dati-incompleti/fig03.webp',
    caption: md`Le due scritture dell'aspettazione condizionata (*conditional expectation*) della slide p72, unite dalla freccia rossa. In alto la definizione, $Q(\boldsymbol{\theta},\boldsymbol{\theta}^{(k)})=E\{\log p(\mathbf{X},\mathbf{Y}\mid\boldsymbol{\theta})\mid\mathbf{X},\boldsymbol{\theta}^{(k)}\}$; in basso la sua forma esplicita: l'integrale, su tutti i valori $\mathbf{y}$ dei dati mancanti, di $\log p(\mathbf{X},\mathbf{y}\mid\boldsymbol{\theta})$ pesato con $p(\mathbf{y}\mid\mathbf{X},\boldsymbol{\theta}^{(k)})$. La freccia si legge «cioè»: la condizione $\mid\mathbf{X},\boldsymbol{\theta}^{(k)}$ vuol dire che la media sui dati mancanti si calcola con la legge fissata dalla stima corrente. Il peso usa $\boldsymbol{\theta}^{(k)}$, fermo; il logaritmo usa $\boldsymbol{\theta}$, la variabile da ottimizzare. $\mathbf{Y}$ maiuscola è la variabile aleatoria, $\mathbf{y}$ minuscola la variabile di integrazione; per la mistura, dove $\mathbf{Y}$ è discreta, l'integrale diventa una somma sui modi. I passaggi sono in [«Dall'aspettazione condizionata alla forma integrale di Q»](#derivation:der03).`,
    alt: 'Due formule una sotto l\'altra, unite da una freccia rossa verso il basso. In alto: Q di theta e theta^(k) uguale al valore atteso di log p(X, Y | theta) dati X e theta^(k). In basso: Q di theta e theta^(k) uguale all\'integrale di log p(X, y | theta) per p(y | X, theta^(k)) in dy.',
    source: { doc: 'ch2', page: 72 },
  },
  {
    id: 'fig04',
    file: 'figures/m10-em-dati-incompleti/fig04.webp',
    caption: md`La pergamena verde della slide p73 descrive EM a parole: l'algoritmo alterna un passo di aspettazione (*expectation (E) step*), che calcola il valore atteso della verosimiglianza includendo le variabili latenti come se fossero osservate, e un passo di massimizzazione (*maximization (M) step*), che trova le stime a massima verosimiglianza dei parametri massimizzando la verosimiglianza attesa dell'E-step; i parametri trovati nell'M-step avviano un nuovo E-step e il processo si ripete (*the process is repeated*). Sotto, la forma compatta: E-step $Q(\boldsymbol{\theta},\boldsymbol{\theta}^{(k)})=E\{\log p(\mathbf{X},\mathbf{Y}\mid\boldsymbol{\theta})\mid\mathbf{X},\boldsymbol{\theta}^{(k)}\}$ e M-step $\boldsymbol{\theta}^{(k+1)}=\arg\max_{\boldsymbol{\theta}} Q(\boldsymbol{\theta},\boldsymbol{\theta}^{(k)})$ (la slide non scrive $\boldsymbol{\theta}$ sotto arg max). Nell'E-step i parametri restano fermi a $\boldsymbol{\theta}^{(k)}$ e si calcola la distribuzione delle latenti; nell'M-step quella distribuzione resta ferma e si muovono i parametri. Attenzione alla lettura: la pergamena parla di «expectation of the likelihood», ma la formula fa la media del logaritmo della verosimiglianza dei dati completi (*complete-data log-likelihood*).`,
    alt: 'Riquadro verde a forma di pergamena con un testo inglese in grassetto: EM alternates between performing an expectation (E) step e a maximization (M) step, con expectation (E) step, maximization (M) step e process is repeated in rosso. Sotto, la frase EM can thus be formalized into the following two steps e due righe con etichette blu: E-step con la formula di Q, M-step con theta^(k+1) uguale ad arg max di Q.',
    source: { doc: 'ch2', page: 73 },
  },
  {
    id: 'fig05',
    file: 'figures/m10-em-dati-incompleti/fig05.webp',
    caption: md`La figura della convergenza di EM (*Convergence of EM Algorithm*, slide p74, dal testo di Duda-Hart-Stork). La superficie grigia è $Q(\cdot,\cdot)$ in funzione dei suoi due argomenti: sull'asse $\theta$ ci sono le tacche $\theta^1$ e $\theta^3$, sull'altro asse orizzontale $\theta^0$, $\theta^2$ e $\theta^4$. La linea rossa spessa sale sulla superficie fino alla cresta; la sua proiezione sul pavimento è una spezzata a gradini di quattro tratti, paralleli a turno ai due assi, e ogni tratto finisce su una tacca con un nome nuovo: ogni tratto è un'iterazione di EM. Con un argomento fermo sulla stima corrente (E-step) si massimizza $Q$ lungo l'altro asse (M-step), e il punto trovato diventa l'argomento fisso del tratto successivo: da $\theta^0$ fisso si trova $\theta^1$, poi da $\theta^1$ fisso si trova $\theta^2$, fino a $\theta^4$. Gli assi possono alternarsi perché nel disegno $Q$ è simmetrica nei due argomenti (in generale non lo è, precisa la didascalia di Duda-Hart-Stork). Ogni M-step salta direttamente al massimo della sezione, non avanza a piccoli passi come una salita del gradiente (*gradient ascent*): contano i valori agli estremi dei tratti, non la linea disegnata in mezzo, che nel primo tratto attraversa un avvallamento. Da ricordare: a ogni iterazione la log-verosimiglianza (*log-likelihood*) non scende, $l(\boldsymbol{\theta}^{(i+1)})\ge l(\boldsymbol{\theta}^{(i)})$, e i gradini si accorciano verso un massimo che può essere solo locale. La figura mostra salire $Q$, mentre la disuguaglianza riguarda $l$: il legame è nella dimostrazione [«Perché EM non fa mai scendere la log-verosimiglianza»](#derivation:der04).`,
    alt: 'Superficie 3-D grigia a maglia con asse verticale Q(·,·) e due assi orizzontali: uno etichettato theta con le tacche theta^1 e theta^3, l\'altro con le tacche theta^0, theta^2 e theta^4. Una linea rossa spessa parte da sinistra, scende in un avvallamento e poi sale fino alla cresta della superficie; sotto, sul pavimento, la sua proiezione rossa sottile è una spezzata a gradini.',
    source: { doc: 'ch2', page: 74 },
  },
  {
    id: 'fig06',
    file: 'figures/m10-em-dati-incompleti/fig06.webp',
    caption: md`L'esempio della slide p77 (*Example with four data points, one of which is missing the value of the x1 component*), dal testo di Duda-Hart-Stork. Nel piano $(x_1, x_2)$ ci sono tre punti rossi completi, $(0, 2)$, $(1, 0)$ e $(2, 2)$; del quarto punto si conosce solo $x_2 = 4$, per questo è disegnato come l'intera retta rossa orizzontale su cui potrebbe trovarsi. Le ellissi numerate sono i contorni a una deviazione standard della gaussiana stimata alle iterazioni successive: la 0 è il cerchio di raggio 1 centrato nell'origine (la stima iniziale, varianze unitarie), la 1 è già spostata verso i dati, la 2 e la 3 quasi coincidono attorno a $(1, 2)$, allungate lungo $x_2$. Il modello è una gaussiana 2-D a covarianza diagonale e il valore mancante di $x_1$ è la variabile latente (*latent variable*). Da ricordare: bastano poche iterazioni, e il punto incompleto contribuisce comunque alla stima con la coordinata nota; scartarlo farebbe perdere l'informazione $x_2 = 4$ (la media di $x_2$ scenderebbe da 2 a 1.33). I conti sono in [«EM a mano sull'esempio dei quattro punti»](#derivation:der06).`,
    alt: 'Piano cartesiano con assi x1 e x2, tacche 0, 1 e 2 su x1 e 4 su x2. Tre punti rossi in (0, 2), (1, 0) e (2, 2) e una retta rossa orizzontale all\'altezza x2 = 4. Un cerchio grigio chiaro etichettato 0 centrato nell\'origine, un\'ellisse grigia etichettata 1 e due ellissi scure quasi sovrapposte etichettate 2 e 3, allungate in verticale e centrate circa in (1, 2).',
    source: { doc: 'ch2', page: 77 },
  },
  {
    id: 'fig07',
    file: 'figures/m10-em-dati-incompleti/fig07.webp',
    caption: md`La stessa superficie della mistura di quattro gaussiane della slide p68, come la riportano le note (part1 p46) sotto l'elenco dei simboli: $P_i$ probabilità a priori del modo (*prior probability*), $\mathbf{m}_i$ vettore media (*mean vector*), $\Sigma_i$ matrice di covarianza (*covariance matrix*), $p(\mathbf{x}\mid\mathbf{m}_i,\Sigma_i)$ densità gaussiana del modo. Più avanti le note chiamano questo modello *Gaussian Mixture Model* (GMM). Il messaggio è lo stesso della slide: $p(\mathbf{x})$ è una somma di campane con pesi, posizioni e forme diverse, e i campioni non dicono da quale campana vengono.`,
    alt: 'Superficie 3-D a reticolo in un riquadro prospettico, identica a quella della slide: quattro campane sovrapposte, una rossa alta a sinistra, una grigio chiaro davanti, una grigio scuro stretta sullo sfondo e una marrone larga e bassa a destra.',
    source: { doc: 'part1', page: 46 },
  },
  {
    id: 'fig08',
    file: 'figures/m10-em-dati-incompleti/fig08.webp',
    caption: md`La superficie $Q(\cdot,\cdot)$ con la salita a gradini della slide p74, riportata nelle note (part1 p49) sotto la disuguaglianza $l(\boldsymbol{\theta}^{(i+1)})\ge l(\boldsymbol{\theta}^{(i)})$. Le note la commentano così: al procedere di EM la verosimiglianza dei dati osservati, date le stime correnti, aumenta sempre o resta uguale, ed è uno dei punti di forza dell'algoritmo, che fa progressi a ogni passo. Subito dopo avvertono che la convergenza al massimo globale (*global maximum*) non è garantita: EM può fermarsi in un massimo locale (*local maximum*) o in un punto di sella (*saddle point*), perché la log-verosimiglianza può avere più picchi e aggiornamenti simili a una salita del gradiente dipendono dal punto di partenza.`,
    alt: 'Versione ridotta della figura della slide: superficie grigia a maglia con asse verticale Q(·,·), tacche theta^0, theta^2 e theta^4 su un asse orizzontale e theta^1, theta^3 sull\'asse theta; una linea rossa spessa sale sulla superficie fino alla cresta e la sua proiezione sul pavimento è una spezzata a gradini.',
    source: { doc: 'part1', page: 49 },
  },
  {
    id: 'fig09',
    file: 'figures/m10-em-dati-incompleti/fig09.webp',
    caption: md`Le due immagini della pagina di note part1 p50, che lì sono separate da un paragrafo e qui sono riunite una sopra l'altra. In alto le tre equazioni EM della mistura di gaussiane (*EM equations for a Gaussian mixture*), copiate dalla slide p76: il nuovo prior $P_i^{[k+1]}$ è la media, sugli $N$ campioni, della probabilità a posteriori del modo $i$; la nuova media $\mathbf{m}_i^{[k+1]}$ e la nuova covarianza $\Sigma_i^{[k+1]}$ sono medie dei campioni e dei prodotti esterni degli scarti, pesate con la stessa posterior e normalizzate dalla somma dei pesi. L'immagine conserva due refusi della slide: nella prima equazione il prior al numeratore è scritto $P_j^{[k]}$ invece di $P_i^{[k]}$; nel peso dell'equazione di $\Sigma_i$ la gaussiana è valutata in $\mathbf{m}_i^{[k+1]}$ invece che in $\mathbf{m}_i^{[k]}$. Gli scarti $(\mathbf{x}_j-\mathbf{m}_i^{[k+1]})$, invece, usano giustamente la media appena aggiornata: le medie si aggiornano prima delle covarianze. In basso la figura dell'esempio dei quattro punti con $x_1$ mancante (slide p77): retta rossa $x_2 = 4$ per il punto incompleto ed ellissi da 0 a 3 delle iterazioni successive.`,
    alt: 'In alto tre formule: P_i^[k+1] uguale a 1 su N per la somma su j di P_j^[k] p(x_j | m_i^[k], Sigma_i^[k]) fratto p(x_j | theta^[k]); a destra m_i^[k+1] come rapporto tra la somma pesata degli x_j e la somma dei pesi; sotto Sigma_i^[k+1] come somma pesata dei prodotti (x_j − m_i^[k+1])(x_j − m_i^[k+1])^t divisa per la somma dei pesi. Sotto una sottile linea grigia, la figura dell\'esempio: assi x1 e x2, tre punti rossi, una retta rossa orizzontale all\'altezza 4 ed ellissi numerate da 0 a 3.',
    source: { doc: 'part1', page: 50 },
  },
]
