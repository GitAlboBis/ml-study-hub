// Formule del foglio m06 (modelli di pdf e modello gaussiano), concetti c01-c36 dell'inventario.
// Convenzione condivisa: una voce per ogni stringa LaTeX di concepts[].latex, id "f-<concetto>" per la prima,
// "f-<concetto>-2", "f-<concetto>-3"... per le successive. Il campo latex è copiato dall'inventario
// (verificato sulle immagini delle pagine ch2 p20-27 e part1 p19-24) e scripts/formula-coverage.ts lo ritrova
// per confronto. importance = examRelevance del concetto. Le formule che la fonte non scrive (integrazioni
// didattiche) lo dicono nel testo.
import { md } from '../../types'
import type { Formula } from '../../types'

export const formulasA: Formula[] = [
  // --- c01 Proprietà asintotiche della stima ML (richiamo di confine) -------------------------------
  {
    id: 'f-c01',
    name: 'Non distorsione asintotica della stima ML',
    nameEn: 'Asymptotic unbiasedness of the ML estimate',
    latex: md`\lim_{N\to+\infty}E\{\boldsymbol{\varepsilon}\}=0\ \Rightarrow\ \lim_{N\to+\infty}E\{\hat{\boldsymbol{\theta}}\}=\boldsymbol{\theta}`,
    explain: md`Prima delle tre proprietà asintotiche (*asymptotic properties*) che le note attribuiscono alla stima a massima verosimiglianza (*Maximum Likelihood*, ML), richiamate in apertura di questa parte: anche quando uno stimatore efficiente non esiste, la stima ML si comporta bene con tanti dati. L'errore di stima (*estimation error*) è $\boldsymbol{\varepsilon}=\hat{\boldsymbol{\theta}}-\boldsymbol{\theta}$, la differenza tra la stima e il vero parametro. Con pochi campioni la stima può essere distorta (*biased*): in media sbaglia di un po'. La non distorsione asintotica (*asymptotic unbiasedness*) chiede solo che l'errore medio sparisca quando il numero di campioni $N$ cresce senza limite; allora il valore atteso della stima coincide con il vero parametro. Esempio che ritroverai nel foglio: la varianza ML di una gaussiana ha valore atteso $\frac{N-1}{N}\sigma^2$, distorto per ogni $N$ finito (con $N=5$ sottostima del 20%) ma con limite $\sigma^2$; i passaggi sono nella dimostrazione [«bias della covarianza ML e stimatore corretto»](#derivation:der12).`,
    symbols: [
      { s: md`\boldsymbol{\varepsilon}`, meaning: md`errore di stima: $\boldsymbol{\varepsilon}=\hat{\boldsymbol{\theta}}-\boldsymbol{\theta}$, differenza tra la stima e il vero parametro` },
      { s: md`\hat{\boldsymbol{\theta}}`, meaning: md`stima del vettore dei parametri calcolata dai campioni: è un vettore aleatorio, perché cambia se cambia il training set` },
      { s: md`\boldsymbol{\theta}`, meaning: md`vero vettore dei parametri, fisso ma incognito` },
      { s: md`N`, meaning: md`numero di campioni di training` },
      { s: md`E\{\cdot\}`, meaning: md`valore atteso, calcolato sulle possibili realizzazioni del training set` },
    ],
    whenToUse: md`Alla domanda della banca «Is Maximum Likelihood Estimation a good estimator?»: la prima cosa da dire è che la ML ha buone proprietà asintotiche, e questa è la prima. Nel foglio le stesse tre proprietà vengono attribuite alle stime ML di media e covarianza della gaussiana ([bontà delle stime ML gaussiane](#derivation:der19)).`,
    pitfalls: md`Asintoticamente non distorta non vuol dire non distorta: per $N$ finito il bias può esserci, e la covarianza ML con il fattore $1/N$ è l'esempio classico. L'implicazione $E\{\boldsymbol{\varepsilon}\}\to 0\Rightarrow E\{\hat{\boldsymbol{\theta}}\}\to\boldsymbol{\theta}$ vale perché $\boldsymbol{\theta}$ è una costante ed esce dal valore atteso.`,
    importance: 3,
    blanks: [
      {
        masked: md`\lim_{N\to+\infty}E\{\boldsymbol{\varepsilon}\}=\boxed{\;?\;}\ \Rightarrow\ \lim_{N\to+\infty}E\{\hat{\boldsymbol{\theta}}\}=\boldsymbol{\theta}`,
        answer: md`0`,
        distractors: [md`1`, md`\boldsymbol{\theta}`],
      },
    ],
    source: [
      { doc: 'part1', page: 21 },
      { doc: 'part1', page: 19 },
      { doc: 'part1', page: 20 },
    ],
  },
  {
    id: 'f-c01-2',
    name: 'Efficienza asintotica della stima ML',
    nameEn: 'Asymptotic efficiency of the ML estimate',
    latex: md`\lim_{N\to+\infty}\frac{var\{\varepsilon_i\}}{\left[I^{-1}(\boldsymbol{\theta})\right]_{ii}}=1,\quad i=1,2,\dots,r`,
    explain: md`Seconda proprietà. La disuguaglianza di Cramér-Rao (*Cramér-Rao bound*) dice che nessuno stimatore non distorto può avere, sulla componente $i$, varianza più piccola di $[I^{-1}(\boldsymbol{\theta})]_{ii}$, l'elemento diagonale dell'inversa della matrice di informazione di Fisher (*Fisher information matrix*). Uno stimatore che raggiunge il bound è efficiente (*efficient*). La stima ML è asintoticamente efficiente (*asymptotically efficient*): al crescere di $N$ il rapporto tra la sua varianza e il bound tende a 1, per ognuna delle $r$ componenti del vettore dei parametri. Le note: «achieves the lowest possible variance among all unbiased estimators as the sample size increases». In parole: con tanti dati nessuno stimatore non distorto fa meglio della ML. Esempio: per la media di una gaussiana 1-D con varianza nota il bound vale $\sigma^2/N$; con $\sigma^2=4$ e $N=100$ è $0.04$, e la media campionaria ha esattamente varianza $0.04$, già per $N$ finito.`,
    symbols: [
      { s: md`var\{\varepsilon_i\}`, meaning: md`varianza dell'errore di stima sulla componente $i$ del vettore dei parametri` },
      { s: md`I(\boldsymbol{\theta})`, meaning: md`matrice di informazione di Fisher, $I(\boldsymbol{\theta})=E\{\nabla_{\theta}\ln[p(\mathbf{X}\vert\boldsymbol{\theta})]\,\nabla_{\theta}\ln[p(\mathbf{X}\vert\boldsymbol{\theta})]^t\}$` },
      { s: md`\left[I^{-1}(\boldsymbol{\theta})\right]_{ii}`, meaning: md`elemento $i$-esimo della diagonale dell'inversa: il bound di Cramér-Rao per la componente $i$` },
      { s: md`r`, meaning: md`numero di componenti del vettore dei parametri $\boldsymbol{\theta}$` },
      { s: md`N`, meaning: md`numero di campioni di training` },
    ],
    whenToUse: md`Seconda voce della risposta a «How we can describe the goodness of an estimation» (domanda della banca): bias, varianza confrontata con il bound di Cramér-Rao, consistenza.`,
    pitfalls: md`Il bound usa l'inversa della matrice di Fisher, poi l'elemento diagonale: $[I^{-1}(\boldsymbol{\theta})]_{ii}$, che coincide con $1/[I(\boldsymbol{\theta})]_{ii}$ solo se $I$ è diagonale. Il confronto vale tra stimatori non distorti: uno stimatore distorto può avere varianza sotto il bound.`,
    importance: 3,
    blanks: [
      {
        masked: md`\lim_{N\to+\infty}\frac{var\{\varepsilon_i\}}{\boxed{\;?\;}}=1,\quad i=1,2,\dots,r`,
        answer: md`\left[I^{-1}(\boldsymbol{\theta})\right]_{ii}`,
        distractors: [md`\left[I(\boldsymbol{\theta})\right]_{ii}`, md`E\{\varepsilon_i\}`],
      },
      {
        masked: md`\lim_{N\to+\infty}\frac{var\{\varepsilon_i\}}{\left[I^{-1}(\boldsymbol{\theta})\right]_{ii}}=\boxed{\;?\;},\quad i=1,2,\dots,r`,
        answer: md`1`,
        distractors: [md`0`, md`+\infty`],
      },
    ],
    source: [
      { doc: 'part1', page: 21 },
      { doc: 'part1', page: 19 },
      { doc: 'part1', page: 20 },
    ],
  },
  {
    id: 'f-c01-3',
    name: 'Consistenza della stima ML',
    nameEn: 'Consistency of the ML estimate',
    latex: md`\lim_{N\to+\infty}P\{\|\boldsymbol{\varepsilon}\|<\delta\}=1\quad\forall\delta>0`,
    explain: md`Terza proprietà: la stima è consistente (*consistent*) se converge in probabilità al vero valore del parametro. Fissata una tolleranza $\delta$ piccola a piacere, la probabilità che l'errore abbia norma sotto $\delta$ tende a 1 quando $N\to+\infty$. Le note indicano come condizioni: lo stimatore deve essere asintoticamente non distorto e la sua varianza deve tendere a zero al crescere di $N$. Concludono che queste tre proprietà spiegano la diffusione della ML, «a preferred method in statistical analysis and machine learning». Esempio: la luminosità media dei salmoni stimata con la media campionaria ha varianza $\sigma^2/N$; con $\sigma=1$ e $N=10\,000$ la deviazione standard dell'errore è $0.01$, quindi la stima cade quasi certamente entro qualche centesimo dal valore vero.`,
    symbols: [
      { s: md`P\{\cdot\}`, meaning: md`probabilità dell'evento tra graffe` },
      { s: md`\|\boldsymbol{\varepsilon}\|`, meaning: md`norma (lunghezza) del vettore errore di stima` },
      { s: md`\delta`, meaning: md`tolleranza positiva arbitraria, piccola quanto si vuole` },
      { s: md`\forall`, meaning: md`«per ogni»` },
    ],
    whenToUse: md`Terza voce della risposta sulla bontà di uno stimatore. È la proprietà più intuitiva: con abbastanza dati la stima ML arriva dove deve.`,
    pitfalls: md`Le note le chiamano «necessary conditions»; in senso stretto non distorsione asintotica più varianza che tende a zero sono condizioni sufficienti (danno la convergenza in media quadratica, che implica quella in probabilità). Consistente non vuol dire precisa per $N$ piccolo.`,
    importance: 3,
    blanks: [
      {
        masked: md`\lim_{N\to+\infty}P\{\|\boldsymbol{\varepsilon}\|<\delta\}=\boxed{\;?\;}\quad\forall\delta>0`,
        answer: md`1`,
        distractors: [md`0`, md`\delta`],
      },
    ],
    source: [
      { doc: 'part1', page: 21 },
      { doc: 'part1', page: 19 },
      { doc: 'part1', page: 20 },
    ],
  },

  // --- c02 Selezione del modello statistico: i tre aspetti ---------------------------------------------
  {
    id: 'f-c02',
    name: 'La pdf di cui scegliere il modello',
    nameEn: 'Statistical model selection for p(x)',
    latex: md`p(\mathbf{x})`,
    explain: md`La stima parametrica funziona solo dopo aver scelto la forma analitica di $p(\mathbf{x})$, la densità di probabilità (*probability density function*, pdf) del vettore di feature. La slide dice che nella scelta del modello statistico (*statistical model selection*) vanno considerati tre aspetti: la natura statistica intrinseca (*intrinsic statistical nature*) del fenomeno fisico analizzato; il rumore (*noise*) introdotto nelle fasi di trasmissione e di acquisizione del segnale, rispettivamente dal mezzo di propagazione (*propagation medium*) e dal sensore (*sensor*); i passi di pre-processing ed estrazione delle feature (*feature extraction*) adottati prima di alimentare il sistema di riconoscimento. Le note aggiungono che scegliere e applicare bene questi passi rende più efficace il modello scelto. Esempio: nell'impianto che separa salmoni e spigole, la luminosità misurata dipende dal pesce, dall'illuminazione, dal rumore della telecamera e dalla normalizzazione dell'immagine.`,
    symbols: [
      { s: md`p(\mathbf{x})`, meaning: md`densità di probabilità del vettore di feature, di cui va scelta la famiglia (gaussiana, Gamma, Rayleigh...)` },
      { s: md`\mathbf{x}`, meaning: md`vettore di feature, per esempio luminosità e larghezza del pesce` },
    ],
    whenToUse: md`Prima di stimare qualunque parametro: la domanda «quale famiglia di pdf?» viene prima di «quali valori dei parametri?».`,
    pitfalls: md`Il dato che arriva al classificatore è fenomeno più rumore, già trasformato dal pre-processing: si modella quello, non il fenomeno «puro». Un logaritmo, un quadrato o una media cambiano la famiglia giusta.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'part1', page: 21 },
      { doc: 'ch2', page: 20 },
    ],
  },

  // --- c08 Pdf gaussiana univariata ---------------------------------------------------------------------
  {
    id: 'f-c08',
    name: 'Pdf gaussiana univariata',
    nameEn: 'Univariate Gaussian pdf',
    latex: md`f(x;\mu,\sigma)=\frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac{(x-\mu)^2}{2\sigma^2}}`,
    explain: md`Primo degli esempi di pdf della slide (*PDF Examples*). Due parametri: la media $\mu$ decide dove sta il centro della campana, la deviazione standard $\sigma$ quanto è larga. È definita su tutto l'asse reale e simmetrica rispetto a $\mu$. L'esponente è meno lo scarto al quadrato $(x-\mu)^2$ diviso $2\sigma^2$: la densità crolla quando $x$ si allontana dal centro di più di qualche $\sigma$. Il fattore $\frac{1}{\sigma\sqrt{2\pi}}$ è l'altezza del picco e rende uguale a 1 l'area sotto la curva. Esempio: luminosità dei salmoni con $\mu=4$ e $\sigma=1$: $f(4)=0.399$, $f(5)=0.399\,e^{-1/2}=0.242$, $f(6)=0.399\,e^{-2}=0.054$. È il caso $n=1$ della [gaussiana multivariata](#formula:f-c26); i passaggi sono nella dimostrazione [«dalla gaussiana multivariata alla univariata»](#derivation:der01).`,
    symbols: [
      { s: md`x`, meaning: md`valore della feature scalare, per esempio la luminosità di un pesce` },
      { s: md`\mu`, meaning: md`media: centro di simmetria e punto di massimo della campana` },
      { s: md`\sigma`, meaning: md`deviazione standard: misura la larghezza; $\sigma^2$ è la varianza (la legenda del grafico dà i parametri come $\mu$ e $\sigma^2$)` },
      { s: md`e`, meaning: md`base dei logaritmi naturali, $e\approx 2.718$` },
      { s: md`f(x;\mu,\sigma)`, meaning: md`valore della pdf in $x$; il punto e virgola separa la variabile dai parametri` },
    ],
    whenToUse: md`Ovunque nel corso: modello di una classe nelle regole di Bayes, kernel gaussiano delle finestre di Parzen, stima ML («develop the first derivative for a gaussian», domanda della banca).`,
    pitfalls: md`Al denominatore c'è $\sigma$, non $\sigma^2$; nell'esponente c'è $2\sigma^2$, non $2\sigma$. Se la legenda dà $\sigma^2=0.2$, nella formula va $\sigma=\sqrt{0.2}\approx0.447$. La pdf può superare 1 (con $\sigma$ piccola il picco sale oltre 1): è una densità, non una probabilità.`,
    importance: 3,
    blanks: [
      {
        masked: md`f(x;\mu,\sigma)=\frac{1}{\boxed{\;?\;}}\,e^{-\frac{(x-\mu)^2}{2\sigma^2}}`,
        answer: md`\sigma\sqrt{2\pi}`,
        distractors: [md`\sigma^{2}\sqrt{2\pi}`, md`\sqrt{2\pi\sigma}`, md`2\pi\sigma`],
      },
      {
        masked: md`f(x;\mu,\sigma)=\frac{1}{\sigma\sqrt{2\pi}}\,e^{\boxed{\;?\;}}`,
        answer: md`-\frac{(x-\mu)^2}{2\sigma^2}`,
        distractors: [md`-\frac{(x-\mu)^2}{2\sigma}`, md`-\frac{(x-\mu)^2}{\sigma^2}`, md`\frac{(x-\mu)^2}{2\sigma^2}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 22 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c09 Gaussiana univariata: grafico ed effetto di μ e σ² ------------------------------------------
  {
    id: 'f-c09',
    name: 'Altezza del picco della gaussiana',
    nameEn: 'Peak height of the Gaussian pdf',
    latex: md`f(\mu;\mu,\sigma)=\frac{1}{\sigma\sqrt{2\pi}}`,
    explain: md`In $x=\mu$ l'esponente vale zero e resta solo la costante: l'altezza del picco è $\frac{1}{\sigma\sqrt{2\pi}}$. Spiega il grafico della slide 22, con quattro curve. $\mu$ trasla la campana senza deformarla; $\sigma^2$ la allarga e, poiché l'area resta 1, il picco si abbassa. Con i valori della legenda: $\sigma^2=0.2$ dà picco $0.892$ (rossa, stretta e alta); $\sigma^2=1$ dà $0.399$ (verde, normale standard); $\sigma^2=5$ dà $0.178$ (blu, larga e bassa); $\mu=-2$, $\sigma^2=0.5$ dà $0.564$ (magenta, centrata in $-2$). Sono i valori che si leggono sul grafico.`,
    symbols: [
      { s: md`f(\mu;\mu,\sigma)`, meaning: md`valore della pdf nel centro $x=\mu$, cioè l'altezza del picco` },
      { s: md`\mu`, meaning: md`media, dove cade il picco` },
      { s: md`\sigma`, meaning: md`deviazione standard` },
    ],
    whenToUse: md`Per leggere o disegnare a mano una gaussiana: il picco scende come $1/\sigma$, quindi raddoppiare la deviazione standard dimezza l'altezza e raddoppia la larghezza.`,
    pitfalls: md`Il picco dipende da $\sigma$, non da $\sigma^2$: quadruplicare la varianza (da 1 a 4) dimezza il picco, non lo divide per quattro.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 22 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c10 Pdf gaussiana generalizzata -----------------------------------------------------------------
  {
    id: 'f-c10',
    name: 'Pdf gaussiana generalizzata',
    nameEn: 'Generalized Gaussian pdf',
    latex: md`f(x;m,b,\beta)=\frac{b\beta}{2\Gamma(1/\beta)}\,e^{-\left[b|x-m|\right]^{\beta}}`,
    explain: md`Secondo esempio della slide 22: una famiglia a tre parametri che contiene la gaussiana come caso particolare. $m$ è la posizione (centro di simmetria e media); $b$ è un parametro di scala inversa: più è grande, più la curva è stretta; $\beta$ è il parametro di forma (*shape parameter*), l'esponente con cui decade la distanza $b\vert x-m\vert$. Con $\beta=2$ si ottiene la gaussiana, con $\beta=1$ la laplaciana, con $\beta$ grande una curva quasi rettangolare. La costante $\frac{b\beta}{2\Gamma(1/\beta)}$ normalizza l'area a 1 e usa la funzione Gamma di Eulero. È definita su tutto l'asse reale e simmetrica rispetto a $m$. Le note la descrivono come «a flexible alternative that can represent various data distributions». Esempio reale: i coefficienti di un'immagine dopo una trasformata wavelet hanno un istogramma più appuntito della gaussiana e con code più pesanti, che un $\beta$ tra 0.5 e 1 segue molto meglio.`,
    symbols: [
      { s: md`m`, meaning: md`posizione: media e centro di simmetria` },
      { s: md`b`, meaning: md`scala inversa: più è grande, più la curva è stretta` },
      { s: md`\beta`, meaning: md`parametro di forma: regola la punta e il peso delle code ($\beta<2$ più appuntita della gaussiana, $\beta>2$ più piatta)` },
      { s: md`\Gamma(\cdot)`, meaning: md`funzione Gamma di Eulero, $\Gamma(z)=\int_0^{+\infty}t^{z-1}e^{-t}\,dt$; per esempio $\Gamma(1/2)=\sqrt{\pi}$ e $\Gamma(1)=1$` },
      { s: md`|x-m|`, meaning: md`distanza di $x$ dal centro, in valore assoluto` },
    ],
    whenToUse: md`Quando i dati sono simmetrici ma non gaussiani: più appuntiti con code pesanti ($\beta<2$) o più piatti ($\beta>2$). Costa un solo parametro in più rispetto alla gaussiana.`,
    pitfalls: md`$b$ non è una deviazione standard: sta al numeratore della costante e moltiplica la distanza, quindi $b$ grande significa campana stretta. La varianza dipende sia da $b$ sia da $\beta$ (vedi la [varianza della gaussiana generalizzata](#formula:f-c11)). L'esponente $\beta$ si applica a tutta la parentesi $[b\vert x-m\vert]$, non al solo modulo.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 22 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c11 Gaussiana generalizzata: effetto di β -------------------------------------------------------
  {
    id: 'f-c11',
    name: 'Varianza della gaussiana generalizzata',
    nameEn: 'Variance of the generalized Gaussian',
    latex: md`var\{x\}=\frac{\Gamma(3/\beta)}{b^{2}\,\Gamma(1/\beta)}`,
    explain: md`Integrazione didattica, non scritta nella slide: la varianza della famiglia dipende da scala e forma insieme. Serve a leggere il grafico della slide 22, che non dichiara $m$ e $b$. Imponendo varianza 1 si ricava $b=\sqrt{\Gamma(3/\beta)/\Gamma(1/\beta)}$ per ogni $\beta$; con quei valori l'altezza del picco $\frac{b\beta}{2\Gamma(1/\beta)}$ vale $0.975$ per $\beta=0.8$, $0.707$ per $\beta=1$, $0.399$ per $\beta=2$ e $0.295$ per $\beta=10$, gli stessi picchi che si leggono sul grafico. Le quattro curve hanno quindi $m=0$ e la stessa varianza, e differiscono solo nella forma: al crescere di $\beta$ la punta si appiattisce e le code si accorciano. Con $\beta=10$ ($b\approx0.56$) la curva è quasi piatta a circa $0.29$ fino a $\vert x\vert\approx1.3$; in $\pm1/b\approx\pm1.78$ vale già $e^{-1}$ del picco (circa $0.11$) e si annulla verso $\pm2.1$. L'uniforme su $[m-1/b,\ m+1/b]$ è solo il limite per $\beta\to\infty$. Controllo: con $\beta=2$ la formula dà $\frac{1}{2b^2}$, la varianza della gaussiana corrispondente.`,
    symbols: [
      { s: md`var\{x\}`, meaning: md`varianza della variabile con pdf gaussiana generalizzata` },
      { s: md`\Gamma(3/\beta),\ \Gamma(1/\beta)`, meaning: md`funzione Gamma di Eulero valutata in $3/\beta$ e in $1/\beta$` },
      { s: md`b`, meaning: md`scala inversa della gaussiana generalizzata` },
      { s: md`\beta`, meaning: md`parametro di forma` },
    ],
    whenToUse: md`Per confrontare curve di forma diversa a parità di varianza, come fa il grafico della slide.`,
    pitfalls: md`Stessa varianza non significa stessa forma: $\beta=0.8$ e $\beta=10$ hanno entrambe varianza 1, ma una è una punta con code lunghe e l'altra quasi un rettangolo.`,
    importance: 1,
    blanks: [],
    source: [
      { doc: 'ch2', page: 22 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c12 Gaussiana generalizzata: casi particolari ----------------------------------------------------
  {
    id: 'f-c12',
    name: 'Caso β = 2: la gaussiana',
    nameEn: 'Special case beta = 2: the Gaussian',
    latex: md`\beta=2:\quad f=\frac{b}{\sqrt{\pi}}\,e^{-b^{2}(x-m)^{2}},\qquad \sigma=\frac{1}{b\sqrt{2}}`,
    explain: md`Con $\beta=2$ il modulo al quadrato diventa un quadrato ordinario e $\Gamma(1/2)=\sqrt{\pi}$, quindi la costante $\frac{2b}{2\sqrt{\pi}}$ si semplifica in $\frac{b}{\sqrt{\pi}}$. Confrontando l'esponente $-b^2(x-m)^2$ con quello della gaussiana, $-\frac{(x-m)^2}{2\sigma^2}$, si legge $b^2=\frac{1}{2\sigma^2}$, cioè $\sigma=\frac{1}{b\sqrt{2}}$; sostituendo, la costante diventa $\frac{1}{\sigma\sqrt{2\pi}}$ e si ritrova esattamente la [gaussiana univariata](#formula:f-c08). Per questo la famiglia si chiama «generalizzata»: la gaussiana ne è un membro. Integrazione verificabile dalla formula della slide; i passaggi sono nella dimostrazione [«casi particolari della gaussiana generalizzata»](#derivation:der02). Esempio: $b=1$ dà una gaussiana con $\sigma=0.707$ e picco $1/\sqrt{\pi}=0.564$.`,
    symbols: [
      { s: md`b`, meaning: md`scala inversa della gaussiana generalizzata` },
      { s: md`m`, meaning: md`centro, che qui coincide con la media $\mu$ della gaussiana` },
      { s: md`\sigma`, meaning: md`deviazione standard della gaussiana che si ottiene` },
    ],
    whenToUse: md`Per collocare la gaussiana dentro la famiglia e rispondere a «che cosa succede per $\beta=2$?».`,
    pitfalls: md`$b$ e $\sigma$ sono inversamente proporzionali: raddoppiare $b$ dimezza $\sigma$.`,
    importance: 1,
    blanks: [],
    source: [{ doc: 'ch2', page: 22 }],
  },
  {
    id: 'f-c12-2',
    name: 'Caso β = 1: la laplaciana',
    nameEn: 'Special case beta = 1: the Laplacian',
    latex: md`\beta=1:\quad f=\frac{b}{2}\,e^{-b|x-m|}`,
    explain: md`Con $\beta=1$ si ha $\Gamma(1)=1$ e resta l'esponenziale del modulo: è la distribuzione di Laplace (*Laplacian*, o doppia esponenziale). Nel grafico è la curva con la cuspide in $x=m$: il modulo non è derivabile in zero, così la pendenza salta da positiva a negativa. Decade come $e^{-b\vert x-m\vert}$, più lentamente della gaussiana che decade come $e^{-b^2(x-m)^2}$: le code sono più pesanti. La varianza vale $2/b^2$; con varianza 1 si ha $b=\sqrt{2}$ e il picco $b/2=0.707$, quello del grafico. Terzo caso notevole, sempre integrazione: per $\beta$ molto grande la pdf tende a una uniforme sull'intervallo $[m-1/b,\ m+1/b]$, di altezza $b/2$.`,
    symbols: [
      { s: md`b`, meaning: md`scala inversa: la pdf decade di un fattore $e$ ogni $1/b$ di distanza dal centro` },
      { s: md`m`, meaning: md`centro della cuspide` },
      { s: md`|x-m|`, meaning: md`distanza dal centro in valore assoluto` },
    ],
    whenToUse: md`Quando i dati hanno un picco netto e molti valori lontani dal centro (per esempio errori di misura con qualche valore anomalo, *outlier*): la laplaciana li considera meno improbabili di quanto faccia la gaussiana.`,
    pitfalls: md`Nella laplaciana compare $b$, non $b^2$: il quadrato appartiene solo al caso $\beta=2$.`,
    importance: 1,
    blanks: [],
    source: [{ doc: 'ch2', page: 22 }],
  },

  // --- c13 Pdf Gamma ---------------------------------------------------------------------------------------
  {
    id: 'f-c13',
    name: 'Pdf Gamma',
    nameEn: 'Gamma pdf',
    latex: md`f(x;k,\theta)=x^{k-1}\frac{e^{-x/\theta}}{\theta^{k}\,\Gamma(k)}\quad\text{for } x>0`,
    explain: md`Terzo esempio (slide 23), definito solo per $x>0$: la slide lo scrive esplicitamente, «for x > 0». Due parametri: $k$ è il parametro di forma (*shape*), $\theta$ quello di scala (*scale*). Il termine $x^{k-1}$ fa partire la curva da zero quando $k>1$; l'esponenziale $e^{-x/\theta}$ la fa decadere; il denominatore $\theta^k\Gamma(k)$ normalizza l'area a 1. Le note la indicano per dati continui non negativi, spesso nella teoria delle code (*queuing theory*). Esempio reale: se i clienti di uno sportello arrivano in modo indipendente, in media uno ogni $\theta=2$ minuti, il tempo d'attesa fino al $k$-esimo arrivo è una Gamma di forma $k$ e scala 2, con media $2k$ minuti. Con $k=1$ è l'esponenziale di media $\theta$.`,
    symbols: [
      { s: md`x`, meaning: md`variabile positiva (tempo d'attesa, durata, intensità)` },
      { s: md`k`, meaning: md`parametro di forma; da non confondere con i gradi di libertà del chi-quadro (slide 24) né con l'indice dei campioni $\mathbf{x}_k$` },
      { s: md`\theta`, meaning: md`parametro di scala; da non confondere con il vettore dei parametri $\theta$ di $p(\mathbf{x}\vert\theta)$ (slide 26)` },
      { s: md`\Gamma(k)`, meaning: md`funzione Gamma di Eulero; per $k$ intero vale $(k-1)!$` },
    ],
    whenToUse: md`Per feature positive e asimmetriche con coda a destra: durate, tempi d'attesa, intensità di un segnale.`,
    pitfalls: md`Due omonimie nella stessa lezione: qui $\theta$ è una scala, non il vettore dei parametri; qui $k$ è una forma, non i gradi di libertà. Il fattore è $x^{k-1}$, non $x^k$, e al denominatore c'è $\theta^k$, non $\theta$.`,
    importance: 1,
    blanks: [],
    source: [
      { doc: 'ch2', page: 23 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c14 Gamma: grafico e ruolo di k e θ --------------------------------------------------------------
  {
    id: 'f-c14',
    name: 'Moda, media e varianza della Gamma',
    nameEn: 'Mode, mean and variance of the Gamma pdf',
    latex: md`x_{moda}=(k-1)\theta,\qquad E\{x\}=k\theta,\qquad var\{x\}=k\theta^{2}`,
    explain: md`Integrazione per leggere il grafico della slide 23 (asse $x$ da 0 a 20). La forma la decide $k$: con $k=1$ la curva è monotona decrescente e parte da $1/\theta$ (la rossa, $k=1$, $\theta=2$, parte da 0.5); con $k>1$ è una campana asimmetrica con coda a destra, sempre più simmetrica al crescere di $k$. $\theta$ stira o comprime l'asse $x$. La verde ($k=2$, $\theta=2$) ha moda 2 e picco 0.184; la blu ($k=3$, $\theta=2$) ha moda 4 e picco 0.135. La magenta ($k=5$, $\theta=1$) e la nera ($k=9$, $\theta=0.5$) hanno anch'esse moda $(k-1)\theta=4$, con picchi 0.195 e 0.279: la varianza $k\theta^2$ scende da 12 (blu) a 5 (magenta) a 2.25 (nera), stessa moda e campane sempre più strette e alte.`,
    symbols: [
      { s: md`x_{moda}`, meaning: md`moda, punto di massimo della pdf (per $k\ge1$)` },
      { s: md`E\{x\}`, meaning: md`media della Gamma` },
      { s: md`var\{x\}`, meaning: md`varianza della Gamma` },
      { s: md`k,\ \theta`, meaning: md`forma e scala` },
    ],
    whenToUse: md`Per scegliere $k$ e $\theta$ a partire da media e varianza osservate (metodo dei momenti): $\theta=var\{x\}/E\{x\}$ e $k=E\{x\}^2/var\{x\}$.`,
    pitfalls: md`La moda $(k-1)\theta$ vale solo per $k\ge1$: per $k<1$ la pdf diverge in $x=0$. Media e moda non coincidono: la coda destra porta la media oltre la moda, $k\theta>(k-1)\theta$.`,
    importance: 1,
    blanks: [],
    source: [
      { doc: 'ch2', page: 23 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c15 Pdf di Rayleigh -----------------------------------------------------------------------------------
  {
    id: 'f-c15',
    name: 'Pdf di Rayleigh',
    nameEn: 'Rayleigh pdf',
    latex: md`f(x|\sigma)=\frac{x\exp\left(\frac{-x^{2}}{2\sigma^{2}}\right)}{\sigma^{2}}`,
    explain: md`Quarto esempio (slide 23), un solo parametro $\sigma$. La slide non scrive il supporto: dalla formula e dal grafico la variabile vive su $x\ge0$. Il fattore $x$ fa partire la curva da zero, la parte gaussiana $\exp(-x^2/(2\sigma^2))$ la fa decadere, il $\sigma^2$ al denominatore normalizza. È la distribuzione del modulo $\sqrt{x_1^2+x_2^2}$ di un vettore con due componenti gaussiane indipendenti, a media nulla e con la stessa deviazione standard $\sigma$. Per questo le note la dicono «commonly applied in radar and communications for modeling scattered signals»: l'eco radar è la somma dei contributi di tanti diffusori, le sue due componenti (in fase e in quadratura) sono gaussiane per il limite centrale e l'ampiezza è Rayleigh.`,
    symbols: [
      { s: md`x`, meaning: md`ampiezza, non negativa` },
      { s: md`\sigma`, meaning: md`parametro di scala: deviazione standard di ciascuna delle due componenti gaussiane sottostanti; coincide con la moda` },
      { s: md`\exp(\cdot)`, meaning: md`esponenziale, $\exp(u)=e^{u}$` },
      { s: md`f(x|\sigma)`, meaning: md`pdf di $x$ dato il parametro $\sigma$ (la barra al posto del punto e virgola è solo una variante di notazione)` },
    ],
    whenToUse: md`Per ampiezze di segnali formati da molti contributi casuali: eco radar, segnali radio in ambienti con molte riflessioni.`,
    pitfalls: md`$\sigma$ non è la deviazione standard di $x$ ma quella delle componenti: la media della Rayleigh è $\sigma\sqrt{\pi/2}\approx1.25\,\sigma$ e la moda è $\sigma$. Il meno nell'esponente sta dentro la frazione, come nella slide.`,
    importance: 1,
    blanks: [],
    source: [
      { doc: 'ch2', page: 23 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c16 Rayleigh: grafico e ruolo di σ ----------------------------------------------------------------
  {
    id: 'f-c16',
    name: 'Moda e picco della Rayleigh',
    nameEn: 'Mode and peak of the Rayleigh pdf',
    latex: md`x_{moda}=\sigma,\qquad f(\sigma|\sigma)=\frac{1}{\sigma\sqrt{e}}`,
    explain: md`Integrazione che spiega il grafico della slide 23: annullando la derivata della pdf si trova che il massimo cade esattamente in $x=\sigma$ e vale $\frac{1}{\sigma\sqrt{e}}\approx\frac{0.607}{\sigma}$. Con i cinque valori della legenda: $\sigma=0.5$ dà picco 1.21 in $x=0.5$ (blu); $\sigma=1$ dà 0.61 in $x=1$ (nera); $\sigma=2$ dà 0.30 in $x=2$ (verde); $\sigma=3$ dà 0.20 in $x=3$ (rossa); $\sigma=4$ dà 0.15 in $x=4$ (magenta). Raddoppiare $\sigma$ sposta la moda al doppio e dimezza l'altezza, così l'area resta 1. Tutte le curve partono da zero e hanno la coda a destra. I passaggi sono nella dimostrazione [«moda e picco della Rayleigh»](#derivation:der13).`,
    symbols: [
      { s: md`x_{moda}`, meaning: md`moda della Rayleigh: coincide con il parametro $\sigma$` },
      { s: md`f(\sigma|\sigma)`, meaning: md`altezza del picco, raggiunta in $x=\sigma$` },
      { s: md`\sqrt{e}`, meaning: md`radice della base dei logaritmi naturali, $\approx1.649$` },
    ],
    whenToUse: md`Per stimare a occhio $\sigma$ da un istogramma di ampiezze: è la posizione del massimo.`,
    pitfalls: md`Il picco scala come $1/\sigma$, non come $1/\sigma^2$, anche se nella formula compare $\sigma^2$: il fattore $x=\sigma$ al numeratore ne compensa uno.`,
    importance: 1,
    blanks: [],
    source: [
      { doc: 'ch2', page: 23 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c17 Pdf chi-quadro ---------------------------------------------------------------------------------
  {
    id: 'f-c17',
    name: 'Pdf chi-quadro',
    nameEn: 'Chi-square pdf',
    latex: md`f(x;k)=\frac{(1/2)^{k/2}}{\Gamma(k/2)}\,x^{k/2-1}e^{-x/2}`,
    explain: md`Quinto esempio (slide 24), un solo parametro: i gradi di libertà (*degrees of freedom*) $k$. È la distribuzione della somma dei quadrati di $k$ variabili gaussiane standard indipendenti (integrazione: la slide dà solo formula e grafico), da cui il legame con il modello gaussiano. Supporto $x\ge0$, con $x>0$ per $k=1$, dove la pdf diverge in zero; media $k$ e varianza $2k$. Le note: «frequently used in hypothesis testing and assessing goodness-of-fit». Aggancio con il resto del foglio: se $\mathbf{x}\sim N(\mathbf{m},\Sigma)$ in $n$ dimensioni, il quadrato della distanza di Mahalanobis $(\mathbf{x}-\mathbf{m})^t\Sigma^{-1}(\mathbf{x}-\mathbf{m})$ è un chi-quadro con $n$ gradi di libertà: così si calcola quale frazione dei campioni cade dentro un'ellisse di isolivello.`,
    symbols: [
      { s: md`k`, meaning: md`gradi di libertà: numero di gaussiane standard al quadrato che si sommano; è diverso dal parametro di forma della Gamma` },
      { s: md`x`, meaning: md`valore della somma dei quadrati, non negativo` },
      { s: md`\Gamma(k/2)`, meaning: md`funzione Gamma di Eulero valutata in $k/2$` },
    ],
    whenToUse: md`Test d'ipotesi, bontà di adattamento (*goodness-of-fit*) di un modello ai dati, soglie sulla distanza di Mahalanobis per scartare campioni anomali.`,
    pitfalls: md`Il $k$ del chi-quadro conta gaussiane sommate, non è la forma della Gamma: il chi-quadro con $k$ gradi di libertà è una Gamma di forma $k/2$ (vedi il [legame con la Gamma](#formula:f-c18)). L'esponente di $x$ è $k/2-1$, non $k-1$.`,
    importance: 1,
    blanks: [],
    source: [
      { doc: 'ch2', page: 24 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c18 Chi-quadro: grafico e legame con la Gamma ---------------------------------------------------------
  {
    id: 'f-c18',
    name: 'Il chi-quadro come caso particolare della Gamma',
    nameEn: 'Chi-square as a special case of the Gamma',
    latex: md`f_{\chi^{2}}(x;k)=f_{\Gamma}\left(x;\tfrac{k}{2},\theta=2\right)`,
    explain: md`Confrontando le formule delle slide 23 e 24 si vede che il chi-quadro con $k$ gradi di libertà è una Gamma con forma $k/2$ e scala $\theta=2$: sostituendo, $\theta^{k/2}=2^{k/2}$ e $\frac{1}{2^{k/2}}=(1/2)^{k/2}$, che è la costante del chi-quadro. Controllo sui grafici: la curva blu del chi-quadro con $k=2$ è l'esponenziale $\frac{1}{2}e^{-x/2}$ che parte da 0.5, identica alla Gamma rossa con $k=1$, $\theta=2$ della slide precedente. Il grafico mostra che al crescere di $k$ la massa si sposta a destra (media $k$, moda $k-2$ per $k\ge2$) e la curva si allarga: con $k=3$ il picco è 0.24 in $x=1$, con $k=4$ è 0.18 in $x=2$, con $k=5$ è 0.15 in $x=3$; con $k=1$ la curva nera diverge per $x\to0$. Passaggi nella dimostrazione [«il chi-quadro è una Gamma con forma k/2 e scala 2»](#derivation:der03).`,
    symbols: [
      { s: md`f_{\chi^{2}}(x;k)`, meaning: md`pdf chi-quadro con $k$ gradi di libertà (slide 24)` },
      { s: md`f_{\Gamma}(x;k',\theta)`, meaning: md`pdf Gamma di forma $k'$ e scala $\theta$ (slide 23); qui $k'=k/2$ e $\theta=2$` },
    ],
    whenToUse: md`Per ricordare una formula sola invece di due, e per ricavare media e varianza del chi-quadro da quelle della Gamma: $k'\theta=k$ e $k'\theta^2=2k$.`,
    pitfalls: md`Attenzione ai due $k$: la forma della Gamma è $k/2$, dove $k$ sono i gradi di libertà del chi-quadro.`,
    importance: 1,
    blanks: [],
    source: [
      { doc: 'ch2', page: 24 },
      { doc: 'ch2', page: 23 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c19 Pdf log-normale ---------------------------------------------------------------------------------
  {
    id: 'f-c19',
    name: 'Pdf log-normale',
    nameEn: 'Log-Normal pdf',
    latex: md`f(x;\mu,\sigma)=\frac{e^{-(\ln x-\mu)^{2}/(2\sigma^{2})}}{x\sigma\sqrt{2\pi}}`,
    explain: md`Sesto esempio (slide 24), definito per $x>0$. Una variabile è log-normale quando il suo logaritmo naturale $\ln x$ è gaussiano con media $\mu$ e deviazione standard $\sigma$. Rispetto alla gaussiana cambiano due cose: nell'esponente c'è $\ln x$ al posto di $x$, e al denominatore compare un fattore $x$ in più, che viene dal cambio di variabile $y=\ln x$ (è la derivata del logaritmo, dimostrazione [«la log-normale come cambio di variabile di una gaussiana»](#derivation:der14)). Le note: «appropriate for modeling variables that are positively skewed, such as financial data». Esempio: i prezzi delle case di una città; il logaritmo del prezzo ha un istogramma a campana, il prezzo ha una lunga coda a destra di case costosissime. Nasce ogni volta che una grandezza è il prodotto di molti fattori positivi indipendenti: il logaritmo trasforma il prodotto in somma e il limite centrale fa il resto.`,
    symbols: [
      { s: md`\mu`, meaning: md`media di $\ln x$ (non di $x$)` },
      { s: md`\sigma`, meaning: md`deviazione standard di $\ln x$ (non di $x$)` },
      { s: md`\ln x`, meaning: md`logaritmo naturale di $x$` },
      { s: md`x`, meaning: md`variabile strettamente positiva` },
    ],
    whenToUse: md`Per feature positive con asimmetria positiva (*positively skewed*): prezzi, redditi, dimensioni, concentrazioni. Trucco pratico: si fa il logaritmo della feature e si usa il modello gaussiano.`,
    pitfalls: md`$\mu$ e $\sigma$ non sono media e deviazione standard di $x$, ma di $\ln x$. Dimenticare il fattore $x$ al denominatore dà una funzione che non integra a 1.`,
    importance: 1,
    blanks: [],
    source: [
      { doc: 'ch2', page: 24 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c20 Log-normale: grafico e ruolo di σ con μ=0 ---------------------------------------------------------
  {
    id: 'f-c20',
    name: 'Moda, mediana e media della log-normale',
    nameEn: 'Mode, median and mean of the Log-Normal pdf',
    latex: md`x_{moda}=e^{\mu-\sigma^{2}},\qquad x_{mediana}=e^{\mu},\qquad E\{x\}=e^{\mu+\sigma^{2}/2}`,
    explain: md`Integrazione che spiega il grafico della slide 24, dove tutte e sei le curve hanno $\mu=0$ (annotazione aggiunta a mano nella legenda). La mediana è $e^{\mu}=1$ per tutte, perché il logaritmo è monotono e la mediana di $\ln x$ è $\mu$. La moda $e^{\mu-\sigma^2}$ invece scivola verso zero al crescere di $\sigma$: 0.98 per $\sigma=1/8$ (magenta, picco 3.2, esce dal grafico), 0.94 per $\sigma=1/4$ (rossa, picco 1.65), 0.78 per $\sigma=1/2$ (gialla, picco 0.90), 0.37 per $\sigma=1$ (verde, picco 0.66), 0.11 per $\sigma=3/2$ (blu, picco 0.82); con $\sigma=10$ (nera) tutta la massa è schiacciata contro $x=0$. La media $e^{\mu+\sigma^2/2}$ supera sempre la mediana, perché la coda destra la tira in alto: con $\sigma=1$ vale $e^{0.5}=1.65$. L'ordine $x_{moda}<x_{mediana}<E\{x\}$ è la firma dell'asimmetria positiva. Passaggi nella dimostrazione [«la log-normale come cambio di variabile di una gaussiana»](#derivation:der14).`,
    symbols: [
      { s: md`x_{moda}`, meaning: md`moda della log-normale` },
      { s: md`x_{mediana}`, meaning: md`mediana: $e^{\mu}$, perché $\ln x$ è monotono e la mediana di $\ln x$ è $\mu$` },
      { s: md`E\{x\}`, meaning: md`media della log-normale, sempre maggiore della mediana` },
      { s: md`\mu,\ \sigma`, meaning: md`media e deviazione standard di $\ln x$` },
    ],
    whenToUse: md`Per leggere un grafico log-normale o rispondere a «perché si dice *positively skewed*?»: la media sta a destra della mediana, che sta a destra della moda.`,
    pitfalls: md`Con $\sigma$ piccola la log-normale sembra una gaussiana centrata in $e^\mu$, ma resta definita solo per $x>0$. La media di $x$ non è $e^\mu$ e non è $\mu$.`,
    importance: 1,
    blanks: [],
    source: [
      { doc: 'ch2', page: 24 },
      { doc: 'part1', page: 22 },
    ],
  },

  // --- c23 Teorema del limite centrale --------------------------------------------------------------------
  {
    id: 'f-c23',
    name: 'Teorema del limite centrale (enunciato del corso)',
    nameEn: 'Central limit theorem',
    latex: md`S_n=\sum_{i=1}^{n}x_i,\quad x_i\ \text{iid},\ var\{S_n\}<\infty\ \Rightarrow\ S_n\ \text{approssimativamente gaussiana}`,
    explain: md`La slide 25 spiega il successo del modello gaussiano, «widely used in numerous applications», con il teorema del limite centrale (*central limit theorem*, CLT), enunciato così: «if the sum of many iid variables has a finite variance, then it will be approximately normally distributed». Tre ingredienti: tante variabili (*many*), indipendenti e identicamente distribuite (*iid*), varianza finita (*finite variance*). L'enunciato non chiede nulla sulla forma delle singole variabili: possono essere uniformi, esponenziali, perfino discrete. La notazione $S_n$ è introdotta qui per scrivere la frase in simboli. Esempio: la larghezza di un salmone dipende da tanti piccoli fattori genetici e ambientali indipendenti che si sommano; per questo il suo istogramma è a campana anche se nessun fattore da solo è gaussiano.`,
    symbols: [
      { s: md`S_n`, meaning: md`somma di $n$ variabili aleatorie (notazione introdotta qui per scrivere l'enunciato)` },
      { s: md`x_i`, meaning: md`$i$-esima variabile sommata` },
      { s: md`\text{iid}`, meaning: md`indipendenti e identicamente distribuite (*independent and identically distributed*)` },
      { s: md`var\{S_n\}`, meaning: md`varianza della somma, che l'enunciato chiede finita` },
      { s: md`n`, meaning: md`numero di variabili sommate («many»)` },
    ],
    whenToUse: md`Alla domanda «perché si usa tanto la gaussiana?»: la risposta del corso è il limite centrale, seguito dalla frase sull'ubiquità: molti processi reali nascono da molte cause indipendenti e danno distribuzioni con varianza finita.`,
    pitfalls: md`L'approssimazione riguarda la somma, non le singole variabili. Con varianza infinita (variabili di Cauchy) la conclusione cade per qualunque $n$; con $n$ piccolo la somma conserva molto della forma originale.`,
    importance: 3,
    blanks: [
      {
        masked: md`S_n=\sum_{i=1}^{n}x_i,\quad x_i\ \text{iid},\ \boxed{\;?\;}\ \Rightarrow\ S_n\ \text{approssimativamente gaussiana}`,
        answer: md`var\{S_n\}<\infty`,
        distractors: [md`E\{S_n\}<\infty`, md`E\{x_i\}=0`, md`var\{S_n\}=0`],
      },
    ],
    source: [
      { doc: 'ch2', page: 25 },
      { doc: 'part1', page: 23 },
    ],
  },
  {
    id: 'f-c23-2',
    name: 'Limite centrale: la somma standardizzata',
    nameEn: 'Central limit theorem: standardized sum converges to N(0,1)',
    latex: md`E\{S_n\}=n\mu,\qquad var\{S_n\}=n\sigma^{2},\qquad \frac{S_n-n\mu}{\sigma\sqrt{n}}\ \xrightarrow[n\to+\infty]{}\ N(0,1)`,
    explain: md`Forma rigorosa, integrazione rispetto alla slide. Se ogni $x_i$ ha media $\mu$ e varianza $\sigma^2$, la somma di $n$ di esse ha media $n\mu$ e varianza $n\sigma^2$: crescono entrambe con $n$, la somma si sposta e si allarga senza fermarsi. Per questo il limite si enuncia sulla somma standardizzata: tolta la media $n\mu$ e divisa per la deviazione standard $\sigma\sqrt{n}$, converge in distribuzione alla normale standard $N(0,1)$ quando $n\to+\infty$. Esempio: somma di $n=12$ uniformi su $[0,1]$, con $\mu=0.5$ e $\sigma^2=1/12$: media 6 e varianza 1, quindi $S_{12}-6$ è già molto vicina a una $N(0,1)$ (un vecchio trucco per generare numeri gaussiani al calcolatore).`,
    symbols: [
      { s: md`\mu,\ \sigma^{2}`, meaning: md`media e varianza della singola variabile $x_i$ (notazione introdotta qui)` },
      { s: md`\sigma\sqrt{n}`, meaning: md`deviazione standard della somma` },
      { s: md`N(0,1)`, meaning: md`gaussiana standard: media 0, varianza 1` },
      { s: md`\xrightarrow[n\to+\infty]{}`, meaning: md`convergenza in distribuzione al crescere di $n$` },
    ],
    whenToUse: md`Quando chiedono il teorema in forma precisa, o perché la media campionaria di tanti campioni è circa gaussiana: dividendo la somma per $n$ si ottiene la media campionaria, con media $\mu$ e varianza $\sigma^2/n$.`,
    pitfalls: md`Si divide per $\sigma\sqrt{n}$, non per $n\sigma$ (che farebbe collassare tutto su zero) né per $n\sigma^2$. La varianza della somma cresce come $n$, la sua deviazione standard come $\sqrt{n}$.`,
    importance: 3,
    blanks: [
      {
        masked: md`E\{S_n\}=n\mu,\qquad var\{S_n\}=n\sigma^{2},\qquad \frac{S_n-n\mu}{\boxed{\;?\;}}\ \xrightarrow[n\to+\infty]{}\ N(0,1)`,
        answer: md`\sigma\sqrt{n}`,
        distractors: [md`n\sigma`, md`\sigma/\sqrt{n}`, md`n\sigma^{2}`],
      },
      {
        masked: md`E\{S_n\}=n\mu,\qquad var\{S_n\}=\boxed{\;?\;},\qquad \frac{S_n-n\mu}{\sigma\sqrt{n}}\ \xrightarrow[n\to+\infty]{}\ N(0,1)`,
        answer: md`n\sigma^{2}`,
        distractors: [md`n^{2}\sigma^{2}`, md`\sigma^{2}/n`],
      },
    ],
    source: [
      { doc: 'ch2', page: 25 },
      { doc: 'part1', page: 23 },
    ],
  },

  // --- c24 Ipotesi del limite centrale -------------------------------------------------------------------
  {
    id: 'f-c24',
    name: 'Varianza della somma di variabili indipendenti',
    nameEn: 'Variance of a sum of independent variables (CLT hypothesis)',
    latex: md`var\{S_n\}=\sum_{i=1}^{n}var\{x_i\}=n\,\sigma^{2}<\infty\iff\sigma^{2}<\infty`,
    explain: md`Logica della condizione sulla varianza (integrazione). Per variabili indipendenti le varianze si sommano, quindi la varianza della somma è $n$ volte quella della singola variabile; per $n$ finito è finita se e solo se lo è $\sigma^2$. La frase della slide, «the sum ... has a finite variance», equivale dunque a chiedere varianza finita a ogni $x_i$. Le tre ipotesi dell'enunciato sono: molte variabili (l'approssimazione migliora con il numero), iid, varianza finita. Se una cade la conclusione non vale: con variabili di Cauchy, che non hanno varianza finita, la media di $n$ campioni ha la stessa distribuzione di un campione solo, per quanto grande sia $n$; con variabili totalmente dipendenti (tutte uguali) la somma è $n\,x_1$ e conserva la forma originale. Con $n=1$ non c'è nessuna gaussianizzazione.`,
    symbols: [
      { s: md`var\{x_i\}=\sigma^{2}`, meaning: md`varianza di ciascuna variabile, uguale per tutte perché identicamente distribuite` },
      { s: md`n`, meaning: md`numero di variabili sommate` },
      { s: md`\iff`, meaning: md`«se e solo se»` },
    ],
    whenToUse: md`Per verificare le ipotesi del limite centrale su un caso concreto e per rispondere a «servono tutte e tre le ipotesi?».`,
    pitfalls: md`La somma delle varianze non richiede l'indipendenza: basta che le covarianze siano nulle; con variabili correlate si aggiungono i termini $2\,cov\{x_i,x_j\}$.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 25 },
      { doc: 'part1', page: 23 },
    ],
  },

  // --- c26 Pdf gaussiana multivariata ---------------------------------------------------------------------
  {
    id: 'f-c26',
    name: 'Pdf gaussiana multivariata',
    nameEn: 'Multivariate Gaussian pdf',
    latex: md`p(\mathbf{x}|\theta)=p(\mathbf{x}|\mathbf{m},\Sigma)=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]`,
    explain: md`La formula del foglio da scrivere a memoria: all'orale Melgani chiede «the formula of the Gaussian curve in a multi dimensional space (with mean vector and covariance matrix)». Il vettore dei parametri $\theta$ è la coppia $(\mathbf{m},\Sigma)$, per questo $p(\mathbf{x}\vert\theta)=p(\mathbf{x}\vert\mathbf{m},\Sigma)$. Ha due pezzi. La costante di normalizzazione $\frac{1}{(2\pi)^{n/2}\vert\Sigma\vert^{1/2}}$ è il valore del picco e rende 1 il volume sotto la campana. L'esponenziale contiene meno un mezzo della forma quadratica $(\mathbf{x}-\mathbf{m})^t\Sigma^{-1}(\mathbf{x}-\mathbf{m})$, il quadrato della distanza di Mahalanobis da $\mathbf{m}$: la densità dipende da $\mathbf{x}$ solo attraverso questa distanza. Nella slide due frecce verdi indicano $\Sigma$ («Covariance matrix») e $\mathbf{m}$ («Mean vector»), una freccia blu dà all'intera espressione il nome $N(\mathbf{m},\Sigma)$. Esempio: salmoni descritti da luminosità e larghezza, $n=2$, con $\vert\Sigma\vert=0.75$: il picco vale $\frac{1}{2\pi\sqrt{0.75}}=0.184$. Con $n=1$ si ritrova la [gaussiana univariata](#formula:f-c08).`,
    symbols: [
      { s: md`\mathbf{x}`, meaning: md`vettore di feature a $n$ dimensioni (colonna $n\times1$)` },
      { s: md`\mathbf{m}`, meaning: md`vettore media, $n$ componenti` },
      { s: md`\Sigma`, meaning: md`matrice di covarianza, $n\times n$` },
      { s: md`|\Sigma|`, meaning: md`determinante della matrice di covarianza` },
      { s: md`\Sigma^{-1}`, meaning: md`inversa della matrice di covarianza` },
      { s: md`n`, meaning: md`numero di feature, cioè la dimensione dello spazio` },
      { s: md`t`, meaning: md`apice di trasposizione nella notazione del docente` },
      { s: md`\theta`, meaning: md`vettore dei parametri della pdf: qui la coppia $(\mathbf{m},\Sigma)$` },
    ],
    whenToUse: md`Ogni volta che una classe è modellata come gaussiana: regole di decisione bayesiane con classi gaussiane, stima ML di $\mathbf{m}$ e $\Sigma$, miscele di gaussiane e algoritmo EM (domande della banca).`,
    pitfalls: md`Nell'esponente c'è l'inversa $\Sigma^{-1}$, non $\Sigma$; il determinante va sotto radice, $\vert\Sigma\vert^{1/2}$; l'esponente di $2\pi$ è $n/2$. L'ordine conta: $(\mathbf{x}-\mathbf{m})^t$ riga a sinistra e $(\mathbf{x}-\mathbf{m})$ colonna a destra danno uno scalare, al contrario si otterrebbe una matrice. La formula richiede $\Sigma$ invertibile, con $\vert\Sigma\vert>0$.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}|\mathbf{m},\Sigma)=\frac{1}{\boxed{\;?\;}}\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]`,
        answer: md`(2\pi)^{n/2}|\Sigma|^{1/2}`,
        distractors: [md`(2\pi)^{n}|\Sigma|^{1/2}`, md`(2\pi)^{n/2}|\Sigma|`, md`(2\pi)^{1/2}|\Sigma|^{n/2}`],
      },
      {
        masked: md`p(\mathbf{x}|\mathbf{m},\Sigma)=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[-\frac{1}{2}\boxed{\;?\;}\right]`,
        answer: md`(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})`,
        distractors: [
          md`(\mathbf{x}-\mathbf{m})^{t}\Sigma(\mathbf{x}-\mathbf{m})`,
          md`(\mathbf{x}-\mathbf{m})\Sigma^{-1}(\mathbf{x}-\mathbf{m})^{t}`,
          md`\|\mathbf{x}-\mathbf{m}\|^{2}`,
        ],
      },
      {
        masked: md`p(\mathbf{x}|\mathbf{m},\Sigma)=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[\boxed{\;?\;}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]`,
        answer: md`-\frac{1}{2}`,
        distractors: [md`\frac{1}{2}`, md`-2`, md`-\frac{n}{2}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 26 },
      { doc: 'part1', page: 23 },
    ],
  },

  // --- c27 Significato dei simboli della gaussiana multivariata --------------------------------------------
  {
    id: 'f-c27',
    name: 'Dimensioni dei simboli della gaussiana multivariata',
    nameEn: 'Dimensions of feature vector, mean vector and covariance matrix',
    latex: md`\mathbf{x}\in\Re^{n},\quad \mathbf{m}\in\Re^{n},\quad \Sigma\in\Re^{n\times n},\quad \theta=(\mathbf{m},\Sigma)`,
    explain: md`Le note elencano i simboli dopo la formula («Where:»): $\mathbf{x}$ è il vettore di feature $n$-dimensionale; $\mathbf{m}$ il vettore media; $\Sigma$ la matrice di covarianza; $\vert\Sigma\vert$ il suo determinante; $(\mathbf{x}-\mathbf{m})^t\Sigma^{-1}(\mathbf{x}-\mathbf{m})$ la distanza di Mahalanobis tra $\mathbf{x}$ e il vettore media. Le dimensioni servono a controllare la formula: $\mathbf{x}$ e $\mathbf{m}$ sono colonne $n\times1$ e $\Sigma$ è $n\times n$, quindi $(\mathbf{x}-\mathbf{m})^t$ ($1\times n$) per $\Sigma^{-1}$ ($n\times n$) per $(\mathbf{x}-\mathbf{m})$ ($n\times1$) dà un numero ($1\times1$), e anche $p(\mathbf{x})$ è un numero. Il vettore dei parametri $\theta$ raccoglie media e covarianza. Esempio: per un pesce descritto da luminosità e larghezza $n=2$, quindi $\mathbf{x}$ e $\mathbf{m}$ hanno 2 componenti e $\Sigma$ è $2\times2$.`,
    symbols: [
      { s: md`\Re^{n}`, meaning: md`spazio dei vettori reali con $n$ componenti` },
      { s: md`\Re^{n\times n}`, meaning: md`spazio delle matrici reali con $n$ righe e $n$ colonne` },
      { s: md`\theta`, meaning: md`vettore dei parametri della gaussiana: la coppia media e covarianza` },
    ],
    whenToUse: md`Per controllare a colpo d'occhio una formula scritta all'orale: se le dimensioni non tornano c'è un errore, per esempio una trasposta dalla parte sbagliata.`,
    pitfalls: md`$\mathbf{x}$ e $\mathbf{m}$ sono colonne: $(\mathbf{x}-\mathbf{m})^t(\mathbf{x}-\mathbf{m})$ è uno scalare (la distanza euclidea al quadrato), mentre $(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^t$ è una matrice $n\times n$, quella che entra nella covarianza.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mathbf{x}\in\Re^{n},\quad \mathbf{m}\in\Re^{n},\quad \Sigma\in\Re^{\boxed{\;?\;}},\quad \theta=(\mathbf{m},\Sigma)`,
        answer: md`n\times n`,
        distractors: [md`n`, md`n\times 1`, md`1\times n`],
      },
      {
        masked: md`\mathbf{x}\in\Re^{n},\quad \mathbf{m}\in\Re^{n},\quad \Sigma\in\Re^{n\times n},\quad \theta=\boxed{\;?\;}`,
        answer: md`(\mathbf{m},\Sigma)`,
        distractors: [md`(\mathbf{m},|\Sigma|)`, md`(\mathbf{x},\mathbf{m})`],
      },
    ],
    source: [
      { doc: 'part1', page: 23 },
      { doc: 'ch2', page: 26 },
    ],
  },

  // --- c28 Notazione N(m, Σ) ------------------------------------------------------------------------------
  {
    id: 'f-c28',
    name: 'Notazione N(m, Σ)',
    nameEn: 'Normal distribution notation N(m, Sigma)',
    latex: md`\mathbf{x}\sim N(\mathbf{m},\Sigma)`,
    explain: md`Scrittura compatta per dire che $\mathbf{x}$ segue una gaussiana multivariata di vettore media $\mathbf{m}$ e matrice di covarianza $\Sigma$. Nella slide 26 la scritta blu $N(\mathbf{m},\Sigma)$ è collegata da una freccia alla parentesi quadra finale della formula: la sigla dà il nome all'intera espressione. Il simbolo $\sim$ si legge «è distribuito come». In una dimensione diventa $N(\mu,\sigma^2)$, e il secondo argomento è la varianza, non la deviazione standard. La notazione sottolinea che bastano $\mathbf{m}$ e $\Sigma$ per individuare la pdf.`,
    symbols: [
      { s: md`\sim`, meaning: md`«è distribuito come»` },
      { s: md`N(\mathbf{m},\Sigma)`, meaning: md`distribuzione normale multivariata di media $\mathbf{m}$ e covarianza $\Sigma$` },
    ],
    whenToUse: md`Per scrivere in fretta le ipotesi di un problema: «le due classi sono $N(\mathbf{m}_1,\Sigma)$ e $N(\mathbf{m}_2,\Sigma)$» dice tutto sul modello.`,
    pitfalls: md`$N(0,4)$ ha varianza 4 e deviazione standard 2: il secondo argomento è la (co)varianza.`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'ch2', page: 26 }],
  },

  // --- c29 Distanza di Mahalanobis ------------------------------------------------------------------------
  {
    id: 'f-c29',
    name: 'Forma quadratica all\'esponente: distanza di Mahalanobis al quadrato',
    nameEn: 'Quadratic form in the exponent (squared Mahalanobis distance)',
    latex: md`(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})`,
    explain: md`Solo le note ne parlano: questa forma quadratica «is the Mahalanobis distance between x and the mean vector»; a rigore ne è il quadrato. Misura quanto $\mathbf{x}$ è lontano da $\mathbf{m}$ in unità di deviazione standard lungo ogni direzione, tenendo conto delle correlazioni tra feature. Con $\Sigma=I$ coincide con la distanza euclidea al quadrato $\Vert\mathbf{x}-\mathbf{m}\Vert^2$; con $\Sigma$ diagonale diventa $\sum_i (x_i-m_i)^2/\sigma_i^2$, cioè ogni scarto viene diviso per la sua deviazione standard prima di essere sommato. Poiché $p(\mathbf{x})$ dipende da $\mathbf{x}$ solo attraverso questa quantità, i punti con lo stesso valore hanno la stessa densità: sono gli isolivelli, ellissi centrate in $\mathbf{m}$.`,
    symbols: [
      { s: md`\mathbf{x}-\mathbf{m}`, meaning: md`vettore scarto dalla media` },
      { s: md`\Sigma^{-1}`, meaning: md`inversa della covarianza: «pesa» ogni direzione con l'inverso della sua varianza` },
      { s: md`t`, meaning: md`trasposizione: $(\mathbf{x}-\mathbf{m})^t$ è un vettore riga` },
    ],
    whenToUse: md`Per spiegare la forma degli isolivelli e per riconoscere la stessa quantità nelle funzioni discriminanti delle classi gaussiane.`,
    pitfalls: md`Non è la distanza euclidea: due punti alla stessa distanza euclidea dalla media possono avere densità molto diverse (esempio numerico nella [distanza di Mahalanobis](#formula:f-c29-2)).`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'part1', page: 23 }],
  },
  {
    id: 'f-c29-2',
    name: 'Distanza di Mahalanobis',
    nameEn: 'Mahalanobis distance',
    latex: md`d_M(\mathbf{x},\mathbf{m})=\sqrt{(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})}`,
    explain: md`La distanza vera e propria è la radice della forma quadratica; la notazione $d_M$ è introdotta qui (le note chiamano distanza direttamente la forma quadratica). Esempio con i salmoni, luminosità e larghezza standardizzate, $\Sigma=\begin{bmatrix}1&0.5\\0.5&1\end{bmatrix}$: correlazione positiva, i pesci più chiari tendono a essere più larghi. Si ha $\vert\Sigma\vert=0.75$ e $\Sigma^{-1}=\frac{1}{0.75}\begin{bmatrix}1&-0.5\\-0.5&1\end{bmatrix}$. Il punto con $\mathbf{x}-\mathbf{m}=(1,1)^t$ va nella direzione della correlazione: $d_M^2=\frac{1-0.5-0.5+1}{0.75}=1.33$, $d_M=1.15$. Il punto con $\mathbf{x}-\mathbf{m}=(1,-1)^t$ va contro la correlazione: $d_M^2=\frac{1+0.5+0.5+1}{0.75}=4$, $d_M=2$. Stessa distanza euclidea $\sqrt{2}=1.41$, ma il secondo pesce è molto più insolito: densità $0.184\,e^{-0.67}=0.094$ contro $0.184\,e^{-2}=0.025$.`,
    symbols: [
      { s: md`d_M(\mathbf{x},\mathbf{m})`, meaning: md`distanza di Mahalanobis tra $\mathbf{x}$ e la media (notazione introdotta qui)` },
      { s: md`\Sigma^{-1}`, meaning: md`inversa della matrice di covarianza` },
    ],
    whenToUse: md`Per classificare o scovare campioni anomali (*outlier*) quando le feature sono correlate o hanno scale diverse: la distanza euclidea sbaglia, quella di Mahalanobis no.`,
    pitfalls: md`Nella pdf compare il quadrato $d_M^2$, senza radice: all'orale conviene dire «distanza di Mahalanobis al quadrato» per la forma all'esponente.`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'part1', page: 23 }],
  },

  // --- c31 Esempio di pdf gaussiana bivariata -----------------------------------------------------------------
  {
    id: 'f-c31',
    name: 'La pdf bivariata come superficie',
    nameEn: 'Bivariate Gaussian pdf as a surface',
    latex: md`p(\mathbf{x})=p(x_1,x_2)`,
    explain: md`Nel caso bivariato ($n=2$) la pdf è una funzione di due variabili, $p(\mathbf{x})=p(x_1,x_2)$, e si disegna come una superficie sopra il piano $(x_1,x_2)$: la quota è la densità. La slide 26 mostra («Example of a bivariate Gaussian pdf») una superficie a rete a forma di campana allungata in diagonale; le note la descrivono come una superficie 3D a campana che rappresenta la distribuzione congiunta (*joint distribution*) di due variabili correlate. L'allungamento obliquo è l'effetto visibile della covarianza non nulla tra $x_1$ e $x_2$: con covarianza zero gli assi della campana sarebbero paralleli agli assi coordinati. Esempio: $x_1$ luminosità e $x_2$ larghezza dei salmoni; se i salmoni più chiari sono anche più larghi, la campana si allunga lungo la bisettrice.`,
    symbols: [
      { s: md`x_1,\ x_2`, meaning: md`le due feature, coordinate del piano di base` },
      { s: md`p(x_1,x_2)`, meaning: md`densità congiunta, quota della superficie` },
    ],
    whenToUse: md`Per disegnare la gaussiana 2-D all'orale: campana con la cima sopra $\mathbf{m}$ e fette orizzontali ellittiche.`,
    pitfalls: md`Sotto la superficie c'è volume 1, ma l'altezza del picco non è 1: dipende da $\vert\Sigma\vert$.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 26 },
      { doc: 'part1', page: 23 },
    ],
  },

  // --- c32 Costante di normalizzazione, ruolo di |Σ| e caso n=1 ------------------------------------------
  {
    id: 'f-c32',
    name: 'Valore della pdf nel massimo',
    nameEn: 'Peak value of the multivariate Gaussian (normalization constant)',
    latex: md`p(\mathbf{m})=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}`,
    explain: md`Integrazione che collega le formule delle slide 22 e 26. In $\mathbf{x}=\mathbf{m}$ la forma quadratica vale zero, l'esponenziale vale 1 e resta solo la costante di normalizzazione: l'altezza del picco, cioè proprio il fattore che rende 1 il volume sotto la campana. $\vert\Sigma\vert$ misura il «volume» della nuvola di punti: se cresce la campana si allarga e il picco si abbassa; se tende a zero (feature perfettamente correlate, oppure una feature con varianza nulla) il picco tende all'infinito e la pdf non è più definita. Per $n=1$ si ha $\Sigma=\sigma^2$, $\vert\Sigma\vert^{1/2}=\sigma$ e si ritrova il picco $\frac{1}{\sigma\sqrt{2\pi}}$ della gaussiana 1-D ([dalla multivariata alla univariata](#derivation:der01)). Esempio: $n=2$ e $\vert\Sigma\vert=0.75$ danno $p(\mathbf{m})=\frac{1}{2\pi\cdot0.866}=0.184$; con $\vert\Sigma\vert=3$ si scende a $\frac{1}{2\pi\cdot1.732}=0.092$.`,
    symbols: [
      { s: md`p(\mathbf{m})`, meaning: md`valore della pdf nel vettore media, il suo massimo` },
      { s: md`n`, meaning: md`numero di feature` },
      { s: md`|\Sigma|`, meaning: md`determinante della covarianza, misura della dispersione complessiva` },
    ],
    whenToUse: md`Per leggere l'altezza di una campana e capire perché la gaussiana diventa degenere quando le feature sono ridondanti.`,
    pitfalls: md`Nell'esponente di $2\pi$ c'è $n/2$, non $n$; il determinante va sotto radice. Più dispersione abbassa il picco, non lo alza.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 26 },
      { doc: 'ch2', page: 22 },
    ],
  },
  {
    id: 'f-c32-2',
    name: 'Determinante di Σ in due dimensioni',
    nameEn: 'Determinant of a 2x2 covariance matrix',
    latex: md`n=2:\quad |\Sigma|=\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2}`,
    explain: md`Con $\Sigma=\begin{bmatrix}\sigma_1^2&\sigma_{12}\\\sigma_{12}&\sigma_2^2\end{bmatrix}$ il determinante è il prodotto della diagonale meno il quadrato della covarianza. Scrivendo $\sigma_{12}=\rho\,\sigma_1\sigma_2$ si ottiene $\vert\Sigma\vert=\sigma_1^2\sigma_2^2(1-\rho^2)$: la correlazione riduce il determinante, cioè il volume della nuvola. Con $\rho=\pm1$ (feature perfettamente correlate) $\vert\Sigma\vert=0$ e la gaussiana degenera su una retta. Esempio: $\sigma_1^2=4$, $\sigma_2^2=1$, $\sigma_{12}=1$ danno $\vert\Sigma\vert=4-1=3$, con $\rho=0.5$.`,
    symbols: [
      { s: md`\sigma_1^{2},\ \sigma_2^{2}`, meaning: md`varianze delle due feature, sulla diagonale di $\Sigma$` },
      { s: md`\sigma_{12}`, meaning: md`covarianza tra la feature 1 e la feature 2, fuori diagonale` },
      { s: md`\rho`, meaning: md`coefficiente di correlazione, $\rho=\sigma_{12}/(\sigma_1\sigma_2)$, compreso tra $-1$ e $1$` },
    ],
    whenToUse: md`Nei conti a mano con due feature: picco, inversa di $\Sigma$ e area delle ellissi passano tutti da qui.`,
    pitfalls: md`Si sottrae $\sigma_{12}^2$, non $\sigma_{12}$. L'inversa $2\times2$ ha lo stesso determinante al denominatore, con la diagonale scambiata e i termini fuori diagonale cambiati di segno.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 26 },
      { doc: 'ch2', page: 22 },
    ],
  },
  {
    id: 'f-c32-3',
    name: 'Il determinante è il prodotto degli autovalori',
    nameEn: 'Determinant of the covariance matrix as the product of its eigenvalues',
    latex: md`|\Sigma|=\prod_{i=1}^{n}\lambda_i`,
    explain: md`In generale $\vert\Sigma\vert$ è il prodotto degli autovalori $\lambda_i$ di $\Sigma$, che sono le varianze lungo gli assi dell'iperellisse, cioè lungo gli autovettori. Per questo la costante di normalizzazione rende 1 il volume: nelle coordinate degli autovettori la campana è un prodotto di $n$ gaussiane 1-D di varianze $\lambda_i$, ciascuna con integrale $\sqrt{2\pi\lambda_i}$, e il prodotto dà $(2\pi)^{n/2}\vert\Sigma\vert^{1/2}$ (dimostrazione [«perché la campana ha volume 1»](#derivation:der15)). Esempio: $\Sigma=\begin{bmatrix}4&1\\1&1\end{bmatrix}$ ha autovalori $\frac{5\pm\sqrt{13}}{2}$, cioè $4.30$ e $0.70$, il cui prodotto è $3=4\cdot1-1^2$.`,
    symbols: [
      { s: md`\lambda_i`, meaning: md`$i$-esimo autovalore di $\Sigma$: varianza lungo il corrispondente autovettore` },
      { s: md`\prod_{i=1}^{n}`, meaning: md`prodotto sugli $n$ autovalori` },
    ],
    whenToUse: md`Per collegare la forma della campana (semiassi delle ellissi proporzionali a $\sqrt{\lambda_i}$) alla sua altezza (determinante).`,
    pitfalls: md`Un solo autovalore nullo annulla il determinante anche se gli altri sono grandi: basta una direzione senza varianza per rendere la gaussiana degenere.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 26 },
      { doc: 'ch2', page: 22 },
    ],
  },
  {
    id: 'f-c32-4',
    name: 'Volume dell\'iperellisse di Mahalanobis',
    nameEn: 'Volume of the Mahalanobis hyperellipse',
    latex: md`V(r)=V_n\,r^{n}\prod_{i=1}^{n}\sqrt{\lambda_i}=V_n\,r^{n}\,|\Sigma|^{1/2},\qquad n=2:\ V(r)=\pi r^{2}|\Sigma|^{1/2}`,
    explain: md`Integrazione che rende preciso il legame tra $\vert\Sigma\vert$ e il volume della nuvola. L'iperellisse dei punti a distanza di Mahalanobis $r$ da $\mathbf{m}$ ha semiassi $r\sqrt{\lambda_i}$ lungo gli autovettori ([perché gli isolivelli sono ellissi](#derivation:der07)); il suo volume è quello della sfera unitaria, $V_n$, stirato di $r\sqrt{\lambda_i}$ in ogni direzione, quindi $V_n\,r^n\prod_i\sqrt{\lambda_i}=V_n\,r^n\vert\Sigma\vert^{1/2}$. In 2-D l'area dell'ellisse è $\pi r^2\vert\Sigma\vert^{1/2}$. Esempio: con $\vert\Sigma\vert=3$ l'ellisse a distanza $r=1$ ha area $\pi\sqrt{3}=5.44$, contro $\pi=3.14$ del cerchio unitario che si ha con $\Sigma=I$.`,
    symbols: [
      { s: md`V(r)`, meaning: md`volume (in 2-D area) dell'iperellisse dei punti con distanza di Mahalanobis minore o uguale a $r$` },
      { s: md`r`, meaning: md`raggio di Mahalanobis dell'isolivello` },
      { s: md`V_n`, meaning: md`volume della sfera di raggio 1 in $n$ dimensioni ($V_2=\pi$, $V_3=4\pi/3$); notazione introdotta qui` },
      { s: md`\lambda_i`, meaning: md`autovalori di $\Sigma$` },
    ],
    whenToUse: md`Per rispondere a «che cosa misura il determinante della covarianza?»: la dispersione complessiva della nuvola, il volume delle sue ellissi.`,
    pitfalls: md`Il volume scala con $\vert\Sigma\vert^{1/2}$, non con $\vert\Sigma\vert$: raddoppiare tutte le varianze moltiplica il volume per $2^{n/2}$, non per $2^n$.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 26 },
      { doc: 'ch2', page: 22 },
    ],
  },

  // --- c33 Media e covarianza definiscono completamente la gaussiana ---------------------------------------
  {
    id: 'f-c33',
    name: 'Numero di parametri della gaussiana multivariata',
    nameEn: 'Number of parameters of the multivariate Gaussian',
    latex: md`\#\,\text{parametri}=n+\frac{n(n+1)}{2}`,
    explain: md`La slide 27: «The parameters defining completely the multivariate Gaussian pdf are the mean vector and the covariance matrix». Note media e covarianza, la pdf è determinata; nient'altro serve. Conteggio (integrazione, non nella fonte): $\mathbf{m}$ ha $n$ componenti; $\Sigma$ ha $n^2$ elementi ma è simmetrica, quindi quelli liberi sono la diagonale ($n$ varianze) più il triangolo superiore ($n(n-1)/2$ covarianze), in tutto $n(n+1)/2$. Esempi: $n=2$ dà $2+3=5$ parametri; $n=10$ dà $10+55=65$; $n=100$ dà $100+5050=5150$. Il numero cresce con il quadrato di $n$: con pochi campioni di training la stima di $\Sigma$ diventa inaffidabile (per avere la covarianza stimata invertibile servono almeno $n+1$ campioni), un aspetto dell'effetto Hughes (*Hughes phenomenon*).`,
    symbols: [
      { s: md`n`, meaning: md`numero di feature` },
      { s: md`\frac{n(n+1)}{2}`, meaning: md`elementi indipendenti di $\Sigma$: $n$ varianze più $n(n-1)/2$ covarianze` },
    ],
    whenToUse: md`Per rispondere a «che cosa definisce una gaussiana?» e per giustificare la riduzione del numero di feature quando i campioni sono pochi.`,
    pitfalls: md`Non $n^2$: la simmetria $\Sigma=\Sigma^t$ dimezza i termini fuori diagonale. E non $n(n-1)/2$: quelle sono solo le covarianze, mancano le $n$ varianze.`,
    importance: 3,
    blanks: [
      {
        masked: md`\#\,\text{parametri}=n+\boxed{\;?\;}`,
        answer: md`\frac{n(n+1)}{2}`,
        distractors: [md`n^{2}`, md`\frac{n(n-1)}{2}`, md`2n`],
      },
    ],
    source: [
      { doc: 'ch2', page: 27 },
      { doc: 'part1', page: 23 },
    ],
  },

  // --- c34 Vettore media --------------------------------------------------------------------------------------
  {
    id: 'f-c34',
    name: 'Vettore media',
    nameEn: 'Mean vector',
    latex: md`\mathbf{m}=E\{\mathbf{x}\}`,
    explain: md`Il vettore media è il valore atteso del vettore di feature. Componente per componente $m_i=E\{x_i\}$: è il vettore delle medie delle singole feature e individua il centro della campana, dove la pdf ha il massimo. Le note: «represents the expected value or central tendency of the data». Per una pdf continua $E\{\mathbf{x}\}=\int\mathbf{x}\,p(\mathbf{x})\,d\mathbf{x}$. Esempio: se i salmoni hanno luminosità media 4 e larghezza media 3, allora $\mathbf{m}=(4,\ 3)^t$. Questa è la definizione; dai campioni si ottiene la stima, che nella stima ML è la media campionaria.`,
    symbols: [
      { s: md`\mathbf{m}`, meaning: md`vettore media, $n$ componenti` },
      { s: md`E\{\cdot\}`, meaning: md`operatore di valore atteso` },
      { s: md`m_i = E\{x_i\}`, meaning: md`media della $i$-esima feature` },
    ],
    whenToUse: md`Insieme alla matrice di covarianza è la risposta a «quali parametri definiscono la gaussiana?».`,
    pitfalls: md`Non confondere $\mathbf{m}=E\{\mathbf{x}\}$, parametro vero e fisso, con $\hat{\mathbf{m}}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k$, stima calcolata dai campioni e quindi aleatoria.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mathbf{m}=\boxed{\;?\;}`,
        answer: md`E\{\mathbf{x}\}`,
        distractors: [md`E\{\mathbf{x}\mathbf{x}^{t}\}`, md`E\{\mathbf{x}-\mathbf{m}\}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 27 },
      { doc: 'part1', page: 23 },
    ],
  },

  // --- c35 Matrice di covarianza: definizione -----------------------------------------------------------------
  {
    id: 'f-c35',
    name: 'Matrice di covarianza: definizione',
    nameEn: 'Covariance matrix: definition',
    latex: md`\Sigma=Cov\{\mathbf{x}\}=E\left\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\right\}`,
    explain: md`La matrice di covarianza è il valore atteso del prodotto esterno (*outer product*) dello scarto dalla media per se stesso. $(\mathbf{x}-\mathbf{m})$ è una colonna $n\times1$ e $(\mathbf{x}-\mathbf{m})^t$ una riga $1\times n$: il prodotto è una matrice $n\times n$, con elemento $(i,j)$ uguale a $(x_i-m_i)(x_j-m_j)$. Il valore atteso mette sulla diagonale le varianze $\sigma_i^2$ e fuori diagonale le covarianze $\sigma_{ij}$. Le note: «describes the variability and relationships between the features of the data». Esempio: una variabile che assume con uguale probabilità i quattro valori $(1,2)$, $(3,4)$, $(3,2)$, $(5,4)$ ha media $(3,3)$ e scarti $(-2,-1)$, $(0,1)$, $(0,-1)$, $(2,1)$; la media dei quattro prodotti esterni è $\Sigma=\begin{bmatrix}2&1\\1&1\end{bmatrix}$. È la risposta alla domanda d'esame «covariance matrix, how it is created, what is cov matrix».`,
    symbols: [
      { s: md`Cov\{\mathbf{x}\}`, meaning: md`operatore di covarianza del vettore aleatorio $\mathbf{x}$` },
      { s: md`(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}`, meaning: md`prodotto esterno dello scarto per se stesso: matrice $n\times n$` },
      { s: md`\sigma_i^{2}`, meaning: md`varianza della feature $i$, elemento $(i,i)$` },
      { s: md`\sigma_{ij}`, meaning: md`covarianza tra le feature $i$ e $j$, elemento $(i,j)$` },
    ],
    whenToUse: md`Per costruire $\Sigma$ a mano da pochi punti e per spiegare la PCA, che parte proprio da qui (autovalori e autovettori di $\Sigma$).`,
    pitfalls: md`$(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^t$ è una matrice; $(\mathbf{x}-\mathbf{m})^t(\mathbf{x}-\mathbf{m})$ è uno scalare, e il suo valore atteso è solo la somma delle varianze. Invertire l'ordine è l'errore più frequente.`,
    importance: 3,
    blanks: [
      {
        masked: md`\Sigma=Cov\{\mathbf{x}\}=E\left\{\boxed{\;?\;}\right\}`,
        answer: md`(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}`,
        distractors: [md`(\mathbf{x}-\mathbf{m})^{t}(\mathbf{x}-\mathbf{m})`, md`\mathbf{x}\mathbf{x}^{t}`, md`(\mathbf{x}-\mathbf{m})^{2}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 27 },
      { doc: 'part1', page: 24 },
    ],
  },

  // --- c36 Forma equivalente della covarianza -----------------------------------------------------------------
  {
    id: 'f-c36',
    name: 'Forma equivalente della covarianza',
    nameEn: 'Equivalent expression of the covariance matrix',
    latex: md`\Sigma=E\left\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\right\}=E\left\{\mathbf{x}\mathbf{x}^{t}\right\}-\mathbf{m}\mathbf{m}^{t}`,
    explain: md`La slide 27 prosegue la catena di uguaglianze: la covarianza è la matrice dei momenti del secondo ordine $E\{\mathbf{x}\mathbf{x}^t\}$ (detta anche matrice di correlazione) meno il prodotto esterno della media con se stessa. È la versione matriciale di $var\{x\}=E\{x^2\}-(E\{x\})^2$. La fonte dà solo il risultato: sviluppando il prodotto si ottengono quattro termini, $E\{\mathbf{x}\mathbf{x}^t\}-\mathbf{m}\mathbf{m}^t-\mathbf{m}\mathbf{m}^t+\mathbf{m}\mathbf{m}^t$, due si cancellano e resta la forma della slide (dimostrazione [«equivalenza delle due forme della covarianza»](#derivation:der04)). Con i quattro punti dell'esempio della definizione: $E\{\mathbf{x}\mathbf{x}^t\}=\begin{bmatrix}11&10\\10&10\end{bmatrix}$, $\mathbf{m}\mathbf{m}^t=\begin{bmatrix}9&9\\9&9\end{bmatrix}$, differenza $\begin{bmatrix}2&1\\1&1\end{bmatrix}$, la stessa $\Sigma$. La stessa struttura ricompare nella seconda forma della stima ML della covarianza.`,
    symbols: [
      { s: md`E\{\mathbf{x}\mathbf{x}^{t}\}`, meaning: md`matrice dei momenti del secondo ordine, non centrati` },
      { s: md`\mathbf{m}\mathbf{m}^{t}`, meaning: md`prodotto esterno della media con se stessa, matrice $n\times n$` },
    ],
    whenToUse: md`Nei conti: spesso è più comodo accumulare le somme di $\mathbf{x}\mathbf{x}^t$ e sottrarre la media alla fine, in una sola passata sui dati.`,
    pitfalls: md`Si sottrae il prodotto esterno $\mathbf{m}\mathbf{m}^t$ ($n\times n$), non il prodotto scalare $\mathbf{m}^t\mathbf{m}$; e il segno è meno. Con numeri grandi e vicini la differenza può perdere precisione numerica.`,
    importance: 3,
    blanks: [
      {
        masked: md`\Sigma=E\left\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\right\}=E\left\{\mathbf{x}\mathbf{x}^{t}\right\}\boxed{\;?\;}`,
        answer: md`-\mathbf{m}\mathbf{m}^{t}`,
        distractors: [md`+\mathbf{m}\mathbf{m}^{t}`, md`-\mathbf{m}^{t}\mathbf{m}`, md`-2\mathbf{m}\mathbf{m}^{t}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 27 },
      { doc: 'part1', page: 24 },
    ],
  },
]
