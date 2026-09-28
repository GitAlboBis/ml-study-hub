// Figure del foglio m04 (bontà di uno stimatore, bound di Cramér-Rao, proprietà asintotiche): ritagli in
// public/figures/m04-bonta-stimatori/<id>.webp prodotti con scripts/fig.py (render dal PDF originale), tutte e 5 le
// figure dell'inventario, nell'ordine dell'inventario.
// - fig01 e fig02 sono le copie, nelle note (part1 p17 e p20), delle figure delle slide ch2 p10 e p18: la fonte
//   indicata è la pagina da cui viene il ritaglio; i valori letti sulle slide (più nitide) sono nell'inventario.
// - fig04: sopra la freccia verde spunta un puntino del testo «ossia» nascosto sotto la freccia nel PDF originale;
//   è nella slide stessa e non è stato ritoccato.
// - Le didascalie non citano id interni (figNN, derNN, cNN): lo studente non li vede.
import { md } from '../../types'
import type { Figure } from '../../types'

export const figures: Figure[] = [
  {
    id: 'fig01',
    file: 'figures/m04-bonta-stimatori/fig01.webp',
    caption: md`«Likelihood Function: Example» (slide p10 del Cap. 2, riportata nelle note). In alto una dozzina di campioni 1-D e quattro gaussiane candidate $p(x|\theta)$ con medie diverse; al centro la verosimiglianza (*likelihood*) $p(\mathbf{X}|\theta)=\prod_{k=1}^{N}p(\mathbf{x}_k|\theta)$ in funzione di $\theta$, con un picco stretto in $\hat{\theta}\approx 3.1$ e valori dell'ordine di $10^{-7}$; in basso la log-verosimiglianza (*log-likelihood*) $l(\theta)=\ln p(\mathbf{X}|\theta)$, concava, con il massimo attorno a $-16$ nello stesso $\hat{\theta}$. Da ricordare: la likelihood è una funzione di $\theta$ con i dati fissati, misura la compatibilità (*agreement*) tra parametri e campioni, e il logaritmo, monotono crescente, non sposta il massimo. I due pannelli sono coerenti: $\ln(1.7\times10^{-7})\approx-15.6$.`,
    alt: 'Tre pannelli impilati. In alto: asse x da 1 a 7 con una dozzina di pallini rossi tra circa 2 e 5 e quattro campane tratteggiate con medie diverse, l\'ultima centrata attorno a 5. Al centro: asse verticale p(X|theta) con tacche 0.4, 0.8 e 1.2 per 10 alla -7, asse orizzontale theta da 1 a 7, un picco stretto poco oltre 3 con una freccia etichettata theta cappello. In basso: asse verticale l(theta) da -20 a -100, una curva concava larga con il massimo sopra la stessa freccia theta cappello, che attraversa -80 attorno a theta = 6.3 e scende verso -100.',
    source: { doc: 'part1', page: 17 },
  },
  {
    id: 'fig02',
    file: 'figures/m04-bonta-stimatori/fig02.webp',
    caption: md`La ricerca a massima verosimiglianza (*ML search*) della media di una gaussiana 1-D con varianza nota, da una sola osservazione $x_0$ (slide p18 del Cap. 2, riportata nelle note). Si fa scorrere la media $m$ delle candidate (medie $-2$, $-1.5$, $0$, $1$, $1.5$, $\sigma\approx1$) e si legge l'altezza di ciascuna curva sulla linea tratteggiata in $x_0$: quella altezza è la likelihood $p(x_0|m)$. Vince la curva centrata proprio su $x_0$, da cui $\hat{m}=x_0$. Le tacche sulla linea valgono, rispetto al massimo, circa $1$, $0.88$, $0.61$, $0.04$ e $0.01$: la likelihood cala con la distanza $\vert x_0-m\vert$.`,
    alt: 'Cinque campane della stessa forma e colori diversi (viola, rossa, blu, verde, magenta) su un asse orizzontale da -6 a 6, con i massimi rispettivamente in -2, -1.5, 0, 1 e 1.5. Titolo Likelihood in alto, linea verticale continua in 0 e linea verticale tratteggiata in x0 vicino a 1, con tacche dove incontra ciascuna curva: la più alta coincide con il picco della curva verde. A sinistra una freccia a due punte con la scritta ML search, a destra la scritta implica m cappello uguale a x0; in basso a destra l\'etichetta x0 collegata da una freccia curva alla base della linea tratteggiata.',
    source: { doc: 'part1', page: 20 },
  },
  {
    id: 'fig03',
    file: 'figures/m04-bonta-stimatori/fig03.webp',
    caption: md`La nota a margine della slide sul bound di Cramér-Rao (*Cramér-Rao bound*): quando la varianza di uno stimatore non polarizzato (*unbiased*) raggiunge il bound, lo stimatore si dice efficiente (*efficient*). In formula la disuguaglianza diventa un'uguaglianza per ogni parametro, $\operatorname{var}\{\varepsilon_i\}=[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}$ per $i=1,2,\ldots,r$: nessuno stimatore unbiased può fare meglio. È l'unica definizione di stimatore efficiente nelle slide.`,
    alt: 'Nota scritta in diagonale, inclinata di circa 30 gradi verso l\'alto: Nota in rosso, poi in nero When the bound is reached, the estimator is said, e in fondo la parola efficient in rosso.',
    source: { doc: 'ch2', page: 14 },
  },
  {
    id: 'fig04',
    file: 'figures/m04-bonta-stimatori/fig04.webp',
    caption: md`La definizione di stima non polarizzata (*unbiased estimate*) della slide p13: errore a media nulla, $E\{\boldsymbol{\varepsilon}\}=0$, e stima centrata sul valore vero, $E\{\hat{\boldsymbol{\theta}}\}=\boldsymbol{\theta}$. Sotto la freccia verde il PDF nasconde la parola «ossia»: le due scritture sono equivalenti, perché con $\boldsymbol{\varepsilon}=\hat{\boldsymbol{\theta}}-\boldsymbol{\theta}$ e $\boldsymbol{\theta}$ fisso si ha $E\{\boldsymbol{\varepsilon}\}=E\{\hat{\boldsymbol{\theta}}\}-\boldsymbol{\theta}$.`,
    alt: 'Due formule collegate da una grossa freccia verde che punta a destra: a sinistra E di epsilon in grassetto uguale a 0, a destra E di theta cappello uguale a theta.',
    source: { doc: 'ch2', page: 13 },
  },
  {
    id: 'fig05',
    file: 'figures/m04-bonta-stimatori/fig05.webp',
    caption: md`La definizione di stima asintoticamente non polarizzata (*asymptotically unbiased*) della slide p15: la stessa freccia verde della slide p13, con i limiti per $N\to+\infty$ davanti ai due valori attesi, $\lim_{N\to+\infty}E\{\boldsymbol{\varepsilon}\}=\mathbf{0}$ e $\lim_{N\to+\infty}E\{\hat{\boldsymbol{\theta}}\}=\boldsymbol{\theta}$. Anche qui sotto la freccia c'è «ossia»: equivalenza. Da ricordare: la distorsione (*bias*) può esserci a $N$ finito purché sparisca con molti campioni; uno stimatore unbiased lo è anche asintoticamente, non il contrario.`,
    alt: 'Due formule collegate da una grossa freccia verde che punta a destra: a sinistra il limite per N che tende a più infinito di E di epsilon uguale al vettore nullo in grassetto, a destra il limite per N che tende a più infinito di E di theta cappello uguale a theta.',
    source: { doc: 'ch2', page: 15 },
  },
]
