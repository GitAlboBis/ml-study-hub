// Flashcard del modulo m06 (modelli di pdf e modello gaussiano): formule, definizioni, confronti,
// intuizioni, proprietà e procedure. Coprono tutti i 71 concetti dell'inventario, nell'ordine delle
// slide (ch2 p20-31) e delle note (part1 p21-26).
import { md } from '../../types'
import type { Flashcard } from '../../types'

export const flashcards: Flashcard[] = [
  // --- confine con la stima ML e scelta del modello ---
  {
    id: 'fc-proprieta-asintotiche-ml',
    kind: 'proprieta',
    q: md`Anche quando uno stimatore efficiente non esiste, quali tre proprietà asintotiche ha la stima ML? Scrivile in formula.`,
    a: md`- **Non distorsione asintotica** (*asymptotic unbiasedness*): $\lim_{N\to+\infty}E\{\boldsymbol{\varepsilon}\}=0$, cioè $\lim_{N\to+\infty}E\{\hat{\boldsymbol{\theta}}\}=\boldsymbol{\theta}$.
- **Efficienza asintotica** (*asymptotic efficiency*): $\lim_{N\to+\infty}\frac{var\{\varepsilon_i\}}{[I^{-1}(\boldsymbol{\theta})]_{ii}}=1$, la varianza raggiunge il bound di Cramér-Rao.
- **Consistenza** (*consistency*): $\lim_{N\to+\infty}P\{\|\boldsymbol{\varepsilon}\|<\delta\}=1$ per ogni $\delta>0$.

Le note chiudono così: per queste proprietà la ML è «a preferred method in statistical analysis and machine learning». Le stesse tre proprietà valgono per le stime ML della gaussiana.`,
  },
  {
    id: 'fc-tre-aspetti-selezione',
    kind: 'procedura',
    q: md`Nella scelta del modello statistico per $p(\mathbf{x})$ (*statistical model selection*), quali tre aspetti considero?`,
    a: md`1. La **natura statistica intrinseca** del fenomeno fisico che analizzo (*intrinsic statistical nature of the physical phenomenon*).
2. Il **rumore** introdotto nelle fasi di trasmissione e di acquisizione del segnale, dal mezzo di propagazione e dal sensore (*noise*).
3. I passi di **pre-processing e feature extraction** adottati prima di dare i dati al sistema di riconoscimento.

Le note aggiungono che scegliere e applicare bene questi passi rende più efficace il modello scelto.`,
  },
  {
    id: 'fc-natura-fenomeno',
    kind: 'intuizione',
    q: md`Come suggerisce la famiglia di pdf il primo aspetto, la natura statistica del fenomeno? Fai tre esempi.`,
    a: md`Parto dal meccanismo fisico che genera il dato:
- l'ampiezza di un'eco radar prodotta da molti diffusori è per natura **Rayleigh**;
- una durata o un tempo d'attesa è positivo e asimmetrico: **Gamma**;
- una grandezza che nasce da un prodotto di tanti fattori è **log-normale**.

Le note: capire le caratteristiche fondamentali del fenomeno è essenziale per scegliere un modello appropriato.`,
  },
  {
    id: 'fc-rumore-trasmissione-acquisizione',
    kind: 'definizione',
    q: md`Che cosa dice esattamente la slide sul secondo aspetto, il rumore? E come lo riformulano le note?`,
    a: md`Slide (ch2 p20): «the noise introduced during the (passive/active) signal transmission and acquisition phases by the propagation medium and the sensor, respectively». Il «respectively» associa la **trasmissione** al **mezzo di propagazione** e l'**acquisizione** al **sensore**; passive/active qualifica il tipo di rilevamento.

Le note riformulano: il rumore viene dal mezzo di propagazione (*passive*) o dai sensori (*active*) e pesa sulle prestazioni del modello. In pratica osservo fenomeno più rumore: la pdf da modellare è quella del segnale già disturbato.`,
  },
  {
    id: 'fc-preprocessing-cambia-pdf',
    kind: 'intuizione',
    q: md`Perché il pre-processing e l'estrazione delle feature (*feature extraction*) cambiano il modello da scegliere? Fai tre esempi.`,
    a: md`Ogni trasformazione del dato ne cambia la distribuzione:
- il **quadrato** di un'ampiezza Rayleigh è un'esponenziale;
- la **media** di molti valori si avvicina a una gaussiana (limite centrale);
- il **logaritmo** di una log-normale è gaussiano.

Quindi scelgo la famiglia guardando la feature che entra davvero nel classificatore, non il segnale grezzo.`,
  },
  {
    id: 'fc-sei-modelli',
    kind: 'definizione',
    q: md`Quali sono i sei modelli statistici popolari della slide 21 e a che cosa servono secondo le note?`,
    a: md`- **Gaussiano** (*Gaussian*): dati che seguono una distribuzione normale.
- **Gaussiano generalizzato** (*Generalized Gaussian*): alternativa flessibile che rappresenta varie distribuzioni.
- **Gamma**: dati continui non negativi, spesso nella teoria delle code (*queuing theory*).
- **Rayleigh**: radar e comunicazioni, per segnali diffusi (*scattered signals*).
- **Chi-quadro** (*Chi-square*): test d'ipotesi e bontà di adattamento (*goodness-of-fit*).
- **Log-normale** (*Log-Normal*): variabili con asimmetria positiva (*positively skewed*), come i dati finanziari.`,
  },
  {
    id: 'fc-selezione-non-banale',
    kind: 'intuizione',
    q: md`«Model selection is not a trivial task»: perché scegliere la famiglia è difficile e perché conta tanto?`,
    a: md`Famiglie diverse possono adattarsi quasi ugualmente bene agli stessi dati (per esempio Gamma e log-normale su dati positivi asimmetrici). Se però la famiglia è sbagliata, la stima dei parametri perde senso, per quanto buono sia lo stimatore: la ML trova il miglior $\boldsymbol{\theta}$ **dentro** la famiglia scelta. Le note: scegliere il modello giusto è vitale per catturare con accuratezza i processi sottostanti.`,
  },

  // --- le sei pdf ---
  {
    id: 'fc-gaussiana-univariata',
    kind: 'formula',
    q: md`Scrivi la pdf gaussiana univariata come nella slide 22 e dì che cosa fanno i due parametri.`,
    a: md`$$f(x;\mu,\sigma)=\frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

$\mu$ è la media, cioè il centro della campana; $\sigma$ è la deviazione standard ($\sigma^2$ la varianza, come nella legenda). La curva è definita su tutto l'asse reale e simmetrica rispetto a $\mu$. Il fattore $\frac{1}{\sigma\sqrt{2\pi}}$ è l'altezza del picco e rende l'area uguale a 1.`,
  },
  {
    id: 'fc-gaussiana-mu-sigma-grafico',
    kind: 'intuizione',
    q: md`Nel grafico «Gaussian» della slide 22, che effetto hanno $\mu$ e $\sigma^2$? Quanto valgono i picchi delle quattro curve?`,
    a: md`$\mu$ **trasla** la campana senza deformarla; $\sigma^2$ ne regola la **larghezza** e, poiché l'area resta 1, il picco $f(\mu;\mu,\sigma)=\frac{1}{\sigma\sqrt{2\pi}}$ si abbassa quando $\sigma$ cresce.

- $\mu=0,\ \sigma^2=0.2$: picco $\approx 0.89$ (stretta e alta);
- $\mu=0,\ \sigma^2=1$: picco $\approx 0.40$ (normale standard);
- $\mu=0,\ \sigma^2=5$: picco $\approx 0.18$ (larga e bassa);
- $\mu=-2,\ \sigma^2=0.5$: picco $\approx 0.56$ in $x=-2$.`,
  },
  {
    id: 'fc-gaussiana-generalizzata',
    kind: 'formula',
    q: md`Scrivi la pdf gaussiana generalizzata e spiega i suoi tre parametri.`,
    a: md`$$f(x;m,b,\beta)=\frac{b\beta}{2\Gamma(1/\beta)}\,e^{-\left[b|x-m|\right]^{\beta}}$$

- $m$: posizione, centro di simmetria;
- $b$: scala inversa, con $b$ grande la curva è stretta;
- $\beta$: parametro di forma (*shape parameter*), regola la punta e il peso delle code.

$\Gamma(\cdot)$ è la funzione Gamma di Eulero; il fattore davanti normalizza l'area a 1. Definita su tutto l'asse reale, simmetrica rispetto a $m$.`,
  },
  {
    id: 'fc-beta-forma',
    kind: 'intuizione',
    q: md`Nel grafico «Generalized Gaussian» ci sono le curve $\beta=0.8,\ 1,\ 2,\ 10$. Come cambia la forma al crescere di $\beta$?`,
    a: md`Al crescere di $\beta$ la punta si appiattisce e le code si accorciano:
- $\beta=0.8$: punta acutissima (picco $\approx 0.97$) e code pesanti;
- $\beta=1$: cuspide (picco $\approx 0.71$);
- $\beta=2$: campana liscia (picco $\approx 0.40$, la normale standard);
- $\beta=10$: profilo quasi rettangolare, piatto a $\approx 0.29$ e poi caduta ripida.

La slide non dà $m$ e $b$: dai picchi si deduce $m=0$ e varianza $var\{x\}=\frac{\Gamma(3/\beta)}{b^{2}\,\Gamma(1/\beta)}=1$ per tutte.`,
  },
  {
    id: 'fc-gg-casi-particolari',
    kind: 'proprieta',
    q: md`Quali casi particolari contiene la gaussiana generalizzata?`,
    a: md`- $\beta=2$: la **gaussiana**, $f=\frac{b}{\sqrt{\pi}}\,e^{-b^{2}(x-m)^{2}}$ con $\sigma=\frac{1}{b\sqrt{2}}$;
- $\beta=1$: la **laplaciana** (doppia esponenziale), $f=\frac{b}{2}\,e^{-b|x-m|}$;
- $\beta\to+\infty$: tende alla **uniforme** su $[m-1/b,\ m+1/b]$.

Da qui il nome: la gaussiana è un membro della famiglia, e $\beta$ modella dati più piccati ($\beta<2$) o più piatti ($\beta>2$).`,
  },
  {
    id: 'fc-gamma',
    kind: 'formula',
    q: md`Scrivi la pdf Gamma come nella slide 23. Su quale supporto è definita e che ruolo hanno $k$ e $\theta$?`,
    a: md`$$f(x;k,\theta)=x^{k-1}\frac{e^{-x/\theta}}{\theta^{k}\,\Gamma(k)}\quad\text{for } x>0$$

$k$ è il parametro di **forma** (*shape*), $\theta$ quello di **scala** (*scale*). Il termine $x^{k-1}$ fa partire la curva da zero (per $k>1$), $e^{-x/\theta}$ la fa decadere, $\theta^{k}\Gamma(k)$ normalizza. Con $k=1$ è l'esponenziale di media $\theta$. Attenzione: questo $\theta$ non è il vettore dei parametri di $p(\mathbf{x}|\boldsymbol{\theta})$.`,
  },
  {
    id: 'fc-gamma-grafico',
    kind: 'proprieta',
    q: md`Moda, media e varianza della Gamma. Che cosa mostrano le tre curve del grafico con moda in $x=4$?`,
    a: md`$$x_{moda}=(k-1)\theta,\qquad E\{x\}=k\theta,\qquad var\{x\}=k\theta^{2}$$

(la moda vale per $k\ge 1$). Le curve $(k=3,\theta=2)$, $(k=5,\theta=1)$ e $(k=9,\theta=0.5)$ hanno tutte moda 4 ma varianze 12, 5 e 2.25: più $k$ è grande, più la campana è stretta e simmetrica. $k$ decide la forma ($k=1$ monotona decrescente, $k>1$ campana con coda a destra), $\theta$ stira l'asse $x$.`,
  },
  {
    id: 'fc-rayleigh',
    kind: 'formula',
    q: md`Scrivi la pdf di Rayleigh. Da dove nasce questa distribuzione?`,
    a: md`$$f(x|\sigma)=\frac{x\exp\left(\frac{-x^{2}}{2\sigma^{2}}\right)}{\sigma^{2}},\qquad x\ge 0$$

Un solo parametro, $\sigma$. È la distribuzione del **modulo** di un vettore a due componenti gaussiane indipendenti, a media nulla e con la stessa $\sigma$: per questo descrive l'ampiezza di segnali diffusi in radar e comunicazioni. Il fattore $x$ fa partire la curva da zero, la parte gaussiana la fa decadere.`,
  },
  {
    id: 'fc-rayleigh-moda',
    kind: 'proprieta',
    q: md`Dove ha il massimo una Rayleigh e quanto vale? Che cosa succede se raddoppio $\sigma$?`,
    a: md`Annullo la derivata di $x\,e^{-x^2/(2\sigma^2)}$: il massimo cade in $x_{moda}=\sigma$ e vale

$$f(\sigma|\sigma)=\frac{1}{\sigma\sqrt{e}}\approx\frac{0.607}{\sigma}$$

Nel grafico: $\sigma=0.5$ dà picco $1.21$, $\sigma=1$ dà $0.61$, $\sigma=4$ dà $0.15$. Raddoppiare $\sigma$ sposta la moda al doppio e dimezza l'altezza.`,
  },
  {
    id: 'fc-chi-quadro',
    kind: 'formula',
    q: md`Scrivi la pdf chi-quadro della slide 24. Che significato ha $k$?`,
    a: md`$$f(x;k)=\frac{(1/2)^{k/2}}{\Gamma(k/2)}\,x^{k/2-1}e^{-x/2},\qquad x\ge 0$$

$k$ sono i **gradi di libertà** (*degrees of freedom*): il chi-quadro è la distribuzione della somma dei quadrati di $k$ gaussiane standard indipendenti. Per $k=1$ la pdf diverge in $x=0$. Media $k$, varianza $2k$, moda $k-2$ per $k\ge 2$.`,
  },
  {
    id: 'fc-chi-quadro-gamma',
    kind: 'confronto',
    q: md`Che legame c'è tra il chi-quadro della slide 24 e la Gamma della slide 23?`,
    a: md`Il chi-quadro con $k$ gradi di libertà è una Gamma di forma $k/2$ e scala $\theta=2$:

$$f_{\chi^{2}}(x;k)=f_{\Gamma}\left(x;\tfrac{k}{2},\theta=2\right)$$

Basta sostituire $k'=k/2$ e $\theta=2$ nella formula della Gamma. Verifica sui grafici: il chi-quadro $k=2$ (blu, parte da 0.5) coincide con la Gamma $k=1,\ \theta=2$ (rossa); il chi-quadro $k=4$ coincide con la Gamma $k=2,\ \theta=2$. I due $k$ sono parametri diversi.`,
  },
  {
    id: 'fc-log-normale',
    kind: 'formula',
    q: md`Scrivi la pdf log-normale. Che cosa sono davvero $\mu$ e $\sigma$? Da dove viene il fattore $1/x$?`,
    a: md`$$f(x;\mu,\sigma)=\frac{e^{-(\ln x-\mu)^{2}/(2\sigma^{2})}}{x\sigma\sqrt{2\pi}},\qquad x>0$$

$x$ è log-normale se $\ln x$ è gaussiano con media $\mu$ e deviazione standard $\sigma$: $\mu$ e $\sigma$ appartengono a $\ln x$, **non** a $x$. Il fattore $1/x$ viene dal cambio di variabile $y=\ln x$, con $dy/dx=1/x$. Adatta a variabili con asimmetria positiva, come i dati finanziari.`,
  },
  {
    id: 'fc-log-normale-grafico',
    kind: 'proprieta',
    q: md`Moda, mediana e media della log-normale. Come cambia il grafico della slide 24 ($\mu=0$) al crescere di $\sigma$?`,
    a: md`$$x_{moda}=e^{\mu-\sigma^{2}},\qquad x_{mediana}=e^{\mu},\qquad E\{x\}=e^{\mu+\sigma^{2}/2}$$

Moda, mediana e media stanno in quest'ordine: coda a destra. Con $\mu=0$ la mediana vale sempre 1. Con $\sigma$ piccola ($1/8$, $1/4$) la curva è una campana stretta quasi simmetrica attorno a 1 (il picco di $\sigma=1/8$, circa 3.2, esce dal grafico); al crescere di $\sigma$ la moda $e^{-\sigma^{2}}$ scivola verso 0 e la coda destra si allunga; con $\sigma=10$ la massa è schiacciata contro $x=0$.`,
  },
  {
    id: 'fc-confronto-sei-modelli',
    kind: 'confronto',
    q: md`Confronta i sei modelli per supporto, simmetria e numero di parametri.`,
    a: md`- **Tutto l'asse reale, simmetriche**: gaussiana (2 parametri: $\mu,\sigma$) e gaussiana generalizzata (3: $m,b,\beta$).
- **Solo $x$ positivi, asimmetriche con coda a destra**: Gamma (2: $k,\theta$), Rayleigh (1: $\sigma$), chi-quadro (1: $k$), log-normale (2: $\mu,\sigma$).

Sono tutti modelli parametrici: scelta la famiglia, stimo pochi numeri. Una famiglia con supporto sbagliato, per esempio una gaussiana su dati positivi vicini a zero, dà probabilità a valori impossibili.`,
  },

  // --- modello gaussiano e limite centrale ---
  {
    id: 'fc-modello-parametrico',
    kind: 'definizione',
    q: md`La slide 25 dice che il modello gaussiano è «a parametric model widely used in numerous applications». Che cosa vuol dire parametrico, e perché è così usato?`,
    a: md`**Parametrico** vuol dire che la pdf è determinata del tutto da un numero finito di parametri: media e varianza in 1-D, vettore media e matrice di covarianza in $n$-D. Il successo si spiega con il **teorema del limite centrale** (*central limit theorem*, CLT): le note dicono che la sua popolarità è «largely due» al CLT.`,
  },
  {
    id: 'fc-limite-centrale',
    kind: 'formula',
    q: md`Enuncia il teorema del limite centrale come nella slide 25, poi nella forma rigorosa.`,
    a: md`Slide: «if the sum of many iid variables has a finite variance, then it will be approximately normally distributed».

$$S_n=\sum_{i=1}^{n}x_i,\quad x_i\ \text{iid},\ var\{S_n\}<\infty\ \Rightarrow\ S_n\ \text{approssimativamente gaussiana}$$

Forma rigorosa: media e varianza della somma crescono con $n$, quindi il limite riguarda la somma standardizzata:

$$E\{S_n\}=n\mu,\qquad var\{S_n\}=n\sigma^{2},\qquad \frac{S_n-n\mu}{\sigma\sqrt{n}}\ \xrightarrow[n\to+\infty]{}\ N(0,1)$$

La forma delle singole $x_i$ può essere qualunque.`,
  },
  {
    id: 'fc-limite-centrale-ipotesi',
    kind: 'proprieta',
    q: md`Quali sono le tre ipotesi del limite centrale e che cosa succede se ne cade una?`,
    a: md`1. **Molte** variabili (*many*): con $n=1$ la somma ha la forma della singola variabile.
2. **iid**: indipendenti e identicamente distribuite; con variabili del tutto dipendenti la somma conserva la forma originale.
3. **Varianza finita** (*finite variance*): con variabili di Cauchy (varianza infinita) la somma non diventa gaussiana per nessun $n$.

Per variabili indipendenti le varianze si sommano:

$$var\{S_n\}=\sum_{i=1}^{n}var\{x_i\}=n\,\sigma^{2}<\infty\iff\sigma^{2}<\infty$$

quindi la condizione della slide sulla somma equivale a chiedere varianza finita a ogni $x_i$.`,
  },
  {
    id: 'fc-ubiquita-gaussiana',
    kind: 'intuizione',
    q: md`Come spiega la slide 25 l'ubiquità (*ubiquity*) della pdf gaussiana?`,
    a: md`«Many real processes take origin from many independent causes and yield distributions with finite variance». Un fenomeno reale è spesso la somma di tanti piccoli effetti indipendenti: per il limite centrale la somma è quasi gaussiana. Esempio: la lunghezza di un salmone dipende da genetica, cibo, temperatura dell'acqua, età, e ogni fattore sposta un po' il risultato. Per questo le note citano la gaussiana in signal processing, machine learning, economia e ingegneria.`,
  },

  // --- gaussiana multivariata ---
  {
    id: 'fc-gaussiana-multivariata',
    kind: 'formula',
    q: md`Scrivi la pdf gaussiana multivariata come nella slide 26 (la chiede Melgani all'orale).`,
    a: md`$$p(\mathbf{x}|\theta)=p(\mathbf{x}|\mathbf{m},\Sigma)=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]$$

Due pezzi: la costante di normalizzazione $\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}$ e l'esponenziale di meno un mezzo della forma quadratica. Il vettore dei parametri è $\theta=(\mathbf{m},\Sigma)$. Serve $\Sigma$ invertibile con $|\Sigma|>0$.`,
  },
  {
    id: 'fc-simboli-multivariata',
    kind: 'definizione',
    q: md`Nella gaussiana multivariata, che cosa sono $\mathbf{x}$, $\mathbf{m}$, $\Sigma$, $|\Sigma|$ e che dimensioni hanno?`,
    a: md`- $\mathbf{x}\in\Re^{n}$: vettore di feature $n$-dimensionale (colonna $n\times 1$);
- $\mathbf{m}\in\Re^{n}$: vettore media (*mean vector*);
- $\Sigma\in\Re^{n\times n}$: matrice di covarianza (*covariance matrix*);
- $|\Sigma|$: determinante della matrice di covarianza, uno scalare;
- $(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})$: scalare, che le note chiamano distanza di Mahalanobis.

Anche $p(\mathbf{x})$ è uno scalare.`,
  },
  {
    id: 'fc-notazione-normale',
    kind: 'definizione',
    q: md`Che cosa significa $\mathbf{x}\sim N(\mathbf{m},\Sigma)$ e come si scrive in una dimensione?`,
    a: md`$\mathbf{x}$ segue una gaussiana multivariata con vettore media $\mathbf{m}$ e matrice di covarianza $\Sigma$. Nella slide 26 la sigla blu $N(\mathbf{m},\Sigma)$ ha una freccia che punta all'intera formula: la notazione dà il nome all'espressione e ricorda che bastano $\mathbf{m}$ e $\Sigma$. In 1-D diventa $N(\mu,\sigma^{2})$: il secondo argomento è la **varianza**.`,
  },
  {
    id: 'fc-mahalanobis',
    kind: 'definizione',
    q: md`Che cos'è la distanza di Mahalanobis e che legame ha con la forma quadratica all'esponente?`,
    a: md`$$d_M(\mathbf{x},\mathbf{m})=\sqrt{(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})}$$

Le note chiamano «Mahalanobis distance» la forma quadratica stessa; a rigore la forma quadratica è il **quadrato** della distanza. Misura quanto $\mathbf{x}$ dista dalla media in unità di deviazione standard lungo ogni direzione, tenendo conto delle correlazioni. $p(\mathbf{x})$ dipende da $\mathbf{x}$ solo attraverso questa quantità: punti con la stessa $d_M$ hanno la stessa densità.`,
  },
  {
    id: 'fc-mahalanobis-vs-euclidea',
    kind: 'confronto',
    q: md`Distanza di Mahalanobis contro distanza euclidea: quando coincidono e quando no? Fai un esempio.`,
    a: md`Con $\Sigma=I$ la forma quadratica diventa $\|\mathbf{x}-\mathbf{m}\|^2$: la distanza di Mahalanobis coincide con l'euclidea. Altrimenti pesa ogni direzione con l'inverso della varianza.

Esempio: $\mathbf{m}=(0,0)$, $\Sigma=diag(9,1)$. Il punto $(3,0)$ e il punto $(0,3)$ hanno la stessa distanza euclidea, 3. In Mahalanobis il primo vale $\sqrt{9/9}=1$ (sta nella direzione in cui i dati variano molto), il secondo $\sqrt{9/1}=3$: è molto più improbabile.`,
  },
  {
    id: 'fc-parametri-interpretazione',
    kind: 'intuizione',
    q: md`Che cosa rappresentano $\mathbf{m}$ e $\Sigma$ nella campana? Che cosa mostra la gaussiana bivariata della slide 26?`,
    a: md`Le note: $\mathbf{m}$ rappresenta la **tendenza centrale** (*central tendency*) dei dati, $\Sigma$ cattura la **variabilità e la correlazione** tra le dimensioni. In geometria $\mathbf{m}$ è il punto più alto della campana, $\Sigma$ ne decide larghezza, allungamento e orientazione.

La slide 26 mostra la superficie $p(\mathbf{x})=p(x_1,x_2)$: una campana allungata in diagonale. L'allungamento obliquo è l'effetto della covarianza non nulla tra $x_1$ e $x_2$, cioè di due variabili correlate.`,
  },
  {
    id: 'fc-costante-normalizzazione',
    kind: 'proprieta',
    q: md`Che ruolo ha la costante $\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}$? Come si comporta al variare di $|\Sigma|$?`,
    a: md`È l'altezza del picco, raggiunta in $\mathbf{x}=\mathbf{m}$:

$$p(\mathbf{m})=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}$$

e rende 1 il volume sotto la campana. $|\Sigma|=\prod_{i=1}^{n}\lambda_i$ misura il «volume» della nuvola: se cresce, la campana si allarga e il picco si abbassa; se tende a 0 (feature perfettamente correlate, o una feature con varianza nulla) il picco va all'infinito e la pdf non è più definita. Per $n=2$: $|\Sigma|=\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2}$.`,
  },
  {
    id: 'fc-da-multivariata-a-univariata',
    kind: 'procedura',
    q: md`Come ottengo la gaussiana univariata della slide 22 dalla multivariata della slide 26?`,
    a: md`Pongo $n=1$: $\mathbf{x}=x$, $\mathbf{m}=\mu$, $\Sigma=\sigma^{2}$.
1. $(2\pi)^{n/2}=\sqrt{2\pi}$ e $|\Sigma|^{1/2}=\sigma$: la costante diventa $\frac{1}{\sigma\sqrt{2\pi}}$.
2. $\Sigma^{-1}=1/\sigma^{2}$: la forma quadratica diventa $\frac{(x-\mu)^2}{\sigma^2}$.
3. Risultato: $\frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac{(x-\mu)^2}{2\sigma^2}}$.

I passaggi completi sono nella dimostrazione [«dalla gaussiana multivariata alla univariata»](#derivation:der01).`,
  },
  {
    id: 'fc-numero-parametri',
    kind: 'formula',
    q: md`Quanti numeri servono per definire una gaussiana in $n$ dimensioni? Quanti con $n=10$?`,
    a: md`La slide 27: media e covarianza definiscono **completamente** la gaussiana. Conto $n$ numeri per $\mathbf{m}$ e $n(n+1)/2$ per $\Sigma$, che è simmetrica:

$$\#\,\text{parametri}=n+\frac{n(n+1)}{2}$$

Con $n=10$: $10+55=65$. Il numero cresce con il quadrato di $n$: per questo con poche osservazioni e tante feature la stima diventa inaffidabile (effetto Hughes).`,
  },

  // --- vettore media e matrice di covarianza ---
  {
    id: 'fc-vettore-media',
    kind: 'definizione',
    q: md`Come è definito il vettore media?`,
    a: md`$$\mathbf{m}=E\{\mathbf{x}\}$$

Componente per componente $m_i=E\{x_i\}$: è il vettore delle medie delle singole feature. Le note: rappresenta il valore atteso, la tendenza centrale dei dati. È il centro della campana.`,
  },
  {
    id: 'fc-covarianza-definizione',
    kind: 'definizione',
    q: md`Come è definita la matrice di covarianza e perché il risultato è una matrice $n\times n$?`,
    a: md`$$\Sigma=Cov\{\mathbf{x}\}=E\left\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\right\}$$

È il valore atteso del prodotto esterno dello scarto dalla media per se stesso: $(\mathbf{x}-\mathbf{m})$ è una colonna $n\times 1$, $(\mathbf{x}-\mathbf{m})^{t}$ una riga $1\times n$, il prodotto una matrice $n\times n$. Le note: descrive la variabilità e le relazioni tra le feature.`,
  },
  {
    id: 'fc-covarianza-forma-equivalente',
    kind: 'formula',
    q: md`Scrivi la seconda forma della covarianza della slide 27 e ricavala.`,
    a: md`$$\Sigma=E\left\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\right\}=E\left\{\mathbf{x}\mathbf{x}^{t}\right\}-\mathbf{m}\mathbf{m}^{t}$$

Sviluppo il prodotto: $\mathbf{x}\mathbf{x}^{t}-\mathbf{x}\mathbf{m}^{t}-\mathbf{m}\mathbf{x}^{t}+\mathbf{m}\mathbf{m}^{t}$. Per linearità del valore atteso, con $E\{\mathbf{x}\}=\mathbf{m}$, i due termini misti valgono $-\mathbf{m}\mathbf{m}^{t}$ ciascuno. Resta $E\{\mathbf{x}\mathbf{x}^{t}\}-\mathbf{m}\mathbf{m}^{t}$: è la versione matriciale di $var\{x\}=E\{x^2\}-(E\{x\})^2$.`,
  },
  {
    id: 'fc-elementi-covarianza',
    kind: 'proprieta',
    q: md`Che cosa c'è sulla diagonale di $\Sigma$ e che cosa fuori?`,
    a: md`$$[\Sigma]_{ii}=\sigma_i^{2}=E\{(x_i-m_i)^{2}\},\qquad [\Sigma]_{ij}=\sigma_{ij}=E\{(x_i-m_i)(x_j-m_j)\}$$

Sulla diagonale le **varianze** delle singole feature; fuori diagonale le **covarianze** tra coppie di feature: positive se crescono insieme, negative se una cresce quando l'altra cala, nulle se sono incorrelate. Le note: $\Sigma$ «captures both the variance of each feature and the covariance between different features».`,
  },
  {
    id: 'fc-covarianza-2x2',
    kind: 'formula',
    q: md`Scrivi $\Sigma$ in due dimensioni con il coefficiente di correlazione $\rho$, e il suo determinante.`,
    a: md`$$\Sigma=\begin{bmatrix}\sigma_1^{2}&\sigma_{12}\\\sigma_{12}&\sigma_2^{2}\end{bmatrix}=\begin{bmatrix}\sigma_1^{2}&\rho\,\sigma_1\sigma_2\\\rho\,\sigma_1\sigma_2&\sigma_2^{2}\end{bmatrix},\qquad \rho=\frac{\sigma_{12}}{\sigma_1\sigma_2}$$

$$|\Sigma|=\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2}=\sigma_1^{2}\sigma_2^{2}(1-\rho^{2})$$

$-1\le\rho\le 1$. Con $\rho>0$ l'ellisse sale verso destra, con $\rho<0$ scende, con $\rho=0$ ha gli assi paralleli agli assi coordinati. Con $|\rho|=1$ il determinante si annulla e la pdf non è definita.`,
  },
  {
    id: 'fc-simmetria-covarianza',
    kind: 'proprieta',
    q: md`Perché $\Sigma$ è simmetrica e che conseguenze ha?`,
    a: md`$\Sigma=\Sigma^{t}$ perché $\sigma_{ij}=E\{(x_i-m_i)(x_j-m_j)\}=\sigma_{ji}$: il prodotto di due numeri non dipende dall'ordine. Conseguenze:
- gli elementi indipendenti sono $n(n+1)/2$, non $n^2$;
- gli autovalori sono reali e gli autovettori si possono scegliere ortogonali ([dimostrazione](#derivation:der16)).`,
  },
  {
    id: 'fc-semidefinita-positiva',
    kind: 'proprieta',
    q: md`Che cosa vuol dire che $\Sigma$ è semidefinita positiva (*positive semidefinite*) e perché è vero?`,
    a: md`Per ogni vettore $\mathbf{a}$:

$$\mathbf{a}^{t}\Sigma\,\mathbf{a}=var\{\mathbf{a}^{t}\mathbf{x}\}\ge 0\quad\forall\,\mathbf{a}\in\Re^{n}$$

$\mathbf{a}^{t}\Sigma\mathbf{a}$ è la varianza dei dati proiettati sulla direzione $\mathbf{a}$, e una varianza non è mai negativa. Le note: significa che tutti gli autovalori sono non negativi. Per l'esistenza della pdf serve di più: $\Sigma$ **definita** positiva, cioè autovalori strettamente positivi, altrimenti $|\Sigma|=0$ e $\Sigma^{-1}$ non esiste.`,
  },
  {
    id: 'fc-feature-indipendenti-diagonale',
    kind: 'proprieta',
    q: md`Com'è fatta $\Sigma$ se le feature sono indipendenti?`,
    a: md`$$\Sigma=\begin{bmatrix}\sigma_1^{2}&0&\dots&0\\0&\sigma_2^{2}&\dots&0\\\dots&\dots&\dots&\dots\\0&0&\dots&\sigma_n^{2}\end{bmatrix}$$

Diagonale: le varianze $\sigma_i^2$ sulla diagonale, covarianze nulle fuori. Questa direzione (indipendenti $\Rightarrow$ diagonale) vale per qualunque distribuzione. Caso ancora più particolare, usato poi da Parzen: $\Sigma=\sigma^{2}I$, simmetria sferica.`,
  },
  {
    id: 'fc-fattorizzazione-prodotto',
    kind: 'formula',
    q: md`Con feature indipendenti, a che cosa si riduce la gaussiana multivariata?`,
    a: md`Al prodotto delle univariate (freccia verde della slide 27):

$$p(\mathbf{x})=p(x_1)\,p(x_2)\dots p(x_n)=\prod_{i=1}^{n}\frac{1}{\sigma_i\sqrt{2\pi}}\exp\left[-\frac{(x_i-m_i)^{2}}{2\sigma_i^{2}}\right]$$

Con $\Sigma$ diagonale $|\Sigma|=\prod_i\sigma_i^2$ e la forma quadratica è $\sum_i (x_i-m_i)^2/\sigma_i^2$: l'esponenziale di una somma è il prodotto degli esponenziali. È l'ipotesi del classificatore naive Bayes gaussiano.`,
  },
  {
    id: 'fc-indipendenza-covarianza-nulla',
    kind: 'confronto',
    q: md`Indipendenza e covarianza nulla: quale implica quale?`,
    a: md`1. **Indipendenti $\Rightarrow$ covarianza nulla**, per qualunque distribuzione: $\sigma_{ij}=E\{x_i-m_i\}\,E\{x_j-m_j\}=0$.
2. **Covarianza nulla $\Rightarrow$ indipendenti**: falso in generale. Controesempio: $x\sim N(0,1)$, $y=x^{2}$ hanno $\sigma_{xy}=E\{x^{3}\}-E\{x\}E\{x^{2}\}=0$, ma $y$ è funzione di $x$.
3. Vero se il vettore è **congiuntamente gaussiano**: con $\Sigma$ diagonale la pdf si fattorizza.

Nel modello gaussiano «$\Sigma$ diagonale», «incorrelate» e «indipendenti» dicono la stessa cosa.`,
  },

  // --- forma della gaussiana 2-D e n-D ---
  {
    id: 'fc-volume-unitario',
    kind: 'proprieta',
    q: md`Che cosa vuol dire che la gaussiana 2-D è una «bell of unitary volume»?`,
    a: md`$$\int_{-\infty}^{+\infty}\int_{-\infty}^{+\infty}p(x_1,x_2)\,dx_1\,dx_2=1$$

Il volume sotto la campana vale 1 per qualunque $\mathbf{m}$ e $\Sigma$: è la versione 2-D dell'area unitaria di una pdf 1-D. Lo garantisce la costante di normalizzazione: una campana più larga è anche più bassa.`,
  },
  {
    id: 'fc-isolivelli-ellissi',
    kind: 'proprieta',
    q: md`Perché le fette orizzontali della campana (gli isolivelli, *isolevels*) sono ellissi? Per quali quote esistono?`,
    a: md`Tagliare a quota $c$ significa prendere i punti con $p(\mathbf{x})=c$, cioè con la stessa distanza di Mahalanobis da $\mathbf{m}$:

$$(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})=r^{2},\qquad r^{2}=-2\ln\left[c\,(2\pi)^{n/2}|\Sigma|^{1/2}\right]$$

È l'equazione di un'ellisse centrata in $\mathbf{m}$. Le ellissi sono concentriche, con la stessa orientazione e lo stesso rapporto tra gli assi. Esistono solo per $0<c\le p(\mathbf{m})$: alla quota del picco l'ellisse degenera nel punto $\mathbf{m}$, per $c\to 0$ si allarga senza limite.`,
  },
  {
    id: 'fc-assi-autovettori',
    kind: 'procedura',
    q: md`Come trovo le direzioni degli assi delle ellissi?`,
    a: md`Sono gli **autovettori** di $\Sigma$ (la slide 28: «directed by the eigenvectors»). Risolvo l'equazione caratteristica per gli autovalori, poi il sistema per gli autovettori:

$$\det(\Sigma-\lambda I)=0,\qquad \Sigma\,\mathbf{e}=\lambda\,\mathbf{e}$$

Nella figura gli assi $\mathbf{e}_1$ ed $\mathbf{e}_2$ sono ruotati rispetto a $x_1, x_2$: la rotazione è l'effetto della covarianza non nulla.`,
  },
  {
    id: 'fc-asse-principale',
    kind: 'proprieta',
    q: md`Quale autovettore definisce l'asse principale dell'ellisse e che significato ha?`,
    a: md`Quello del **massimo autovalore** definisce l'asse principale (*main axis*; le note: *major axis*). Indica la direzione in cui i dati hanno la varianza maggiore:

$$\lambda_1=\max_{\|\mathbf{a}\|=1}\mathbf{a}^{t}\Sigma\,\mathbf{a},\qquad \mathbf{e}_1=\arg\max_{\|\mathbf{a}\|=1}\mathbf{a}^{t}\Sigma\,\mathbf{a}$$

È la prima componente principale della PCA. La dimostrazione usa i moltiplicatori di Lagrange ([massima varianza lungo il primo autovettore](#derivation:der17)).`,
  },
  {
    id: 'fc-lunghezza-assi',
    kind: 'formula',
    q: md`Quanto sono lunghi gli assi dell'ellisse?`,
    a: md`Sull'isolivello di distanza di Mahalanobis $r$ il semiasse lungo $\mathbf{e}_i$ vale

$$a_i=r\sqrt{\lambda_i}$$

Le lunghezze vanno con la **radice** dell'autovalore, cioè con la deviazione standard lungo quella direzione. Le note: autovalori più grandi, assi più lunghi. Il rapporto tra gli assi è $\sqrt{\lambda_1/\lambda_2}$ e non dipende dalla quota. Se $\lambda_1=\lambda_2$ l'ellisse è un cerchio.`,
  },
  {
    id: 'fc-figura-quote-z',
    kind: 'intuizione',
    q: md`Nella vista dall'alto della slide 28 ci sono le etichette $z=3$, $2$, $0.5$, $0.01$. Quante ellissi ci sono e che cosa dicono le quote?`,
    a: md`Le ellissi sono **tre** ($z=2$ la più interna, poi $0.5$, poi $0.01$); $z=3$ etichetta il punto nero centrale, cioè $\mathbf{m}$, dove la campana raggiunge il massimo. Quota alta, ellisse piccola; quota bassa, ellisse grande; stesso centro e stessa orientazione lungo $\mathbf{e}_1$, $\mathbf{e}_2$. Con $z_{max}=3$ il raggio di Mahalanobis della quota $z$ è

$$r(z)=\sqrt{2\ln\frac{z_{max}}{z}}$$

e vale $0.90$, $1.89$, $3.38$. Il disegno è qualitativo: le proporzioni disegnate non coincidono con quelle calcolate.`,
  },
  {
    id: 'fc-nd-autovalori-autovettori',
    kind: 'definizione',
    q: md`Come si generalizzano a $n$ dimensioni le osservazioni sulla forma della gaussiana 2-D?`,
    a: md`Chiamo $\lambda_1,\lambda_2,\dots,\lambda_n$ gli autovalori di $\Sigma$ ed $\mathbf{e}_1,\mathbf{e}_2,\dots,\mathbf{e}_n$ gli autovettori corrispondenti:

$$\Sigma\,\mathbf{e}_i=\lambda_i\,\mathbf{e}_i,\quad i=1,\dots,n$$

Una matrice $n\times n$ simmetrica ha $n$ autovalori reali e $n$ autovettori. Gli isolivelli diventano iperellissi con gli assi lungo gli $\mathbf{e}_i$ e lunghezze proporzionali a $\sqrt{\lambda_i}$.`,
  },
  {
    id: 'fc-ordinamento-autovalori',
    kind: 'definizione',
    q: md`Quale convenzione di ordinamento si usa per autovalori e autovettori?`,
    a: md`$$\lambda_1\ge\lambda_2\ge\dots\ge\lambda_n$$

con gli autovettori nello stesso ordine. Così $\mathbf{e}_1$ è sempre la direzione di massima varianza ed $\mathbf{e}_n$ quella di minima. La PCA usa la stessa convenzione per decidere quali componenti tenere.`,
  },
  {
    id: 'fc-autovalori-positivi',
    kind: 'proprieta',
    q: md`La slide 29 dice che gli autovalori di $\Sigma$ «will take positive values», le note dicono «non-negative». Chi ha ragione?`,
    a: md`Dalla semidefinitezza segue $\lambda_i\ge 0$, come nelle note:

$$\lambda_i=\mathbf{e}_i^{t}\Sigma\,\mathbf{e}_i=var\{\mathbf{e}_i^{t}\mathbf{x}\}\ge 0$$

Ogni autovalore è la varianza dei dati lungo il suo autovettore. $\lambda_i=0$ vuol dire una direzione in cui i dati non variano: allora $|\Sigma|=0$ e la gaussiana non esiste. Quando la pdf è definita gli autovalori sono quindi strettamente positivi, come dice la slide.`,
  },
  {
    id: 'fc-base-ortogonale',
    kind: 'proprieta',
    q: md`Perché gli autovettori di $\Sigma$ formano una base ortogonale e che cosa ci guadagno?`,
    a: md`Per la simmetria di $\Sigma$: autovettori di autovalori distinti sono per forza ortogonali, con autovalori ripetuti si possono scegliere ortogonali. Normalizzati e messi in colonna:

$$\Sigma=U\Lambda U^{t},\qquad U=[\mathbf{e}_1\ \dots\ \mathbf{e}_n],\quad U^{t}U=I,\quad \Lambda=diag(\lambda_1,\dots,\lambda_n)$$

Gli autovettori definiscono un nuovo sistema di assi, ruotato, in cui le feature sono incorrelate e la covarianza è diagonale.`,
  },
  {
    id: 'fc-iperellissi',
    kind: 'proprieta',
    q: md`Che forma hanno gli isolivelli in $n$ dimensioni? Scrivine l'equazione negli assi degli autovettori.`,
    a: md`Sono **iperellissi** (*hyperellipses*) in $\Re^{n}$, con gli assi diretti dagli autovettori; per $n=3$ sono ellissoidi. Con $y_i=\mathbf{e}_i^{t}(\mathbf{x}-\mathbf{m})$, coordinata lungo l'autovettore $i$:

$$\sum_{i=1}^{n}\frac{y_i^{2}}{\lambda_i}=r^{2}$$

I semiassi valgono $r\sqrt{\lambda_i}$.`,
  },
  {
    id: 'fc-primo-ultimo-autovettore',
    kind: 'confronto',
    q: md`Primo e ultimo autovettore: che asse definiscono?`,
    a: md`- Il **primo** ($\mathbf{e}_1$, autovalore massimo) definisce l'asse principale (*principal axis*): direzione di massima varianza.
- L'**ultimo** ($\mathbf{e}_n$, autovalore minimo) determina l'asse più piccolo (*smallest axis*): direzione di minima varianza.

Con l'ordinamento convenzionale i semiassi sono in ordine decrescente: $r\sqrt{\lambda_1}\ge r\sqrt{\lambda_2}\ge\dots\ge r\sqrt{\lambda_n}$.`,
  },
  {
    id: 'fc-autovalori-2x2',
    kind: 'procedura',
    q: md`Procedura: trova autovalori, autovettori e assi dell'ellisse per $\Sigma=\begin{bmatrix}3&1\\1&3\end{bmatrix}$.`,
    a: md`1. Equazione caratteristica: $\det(\Sigma-\lambda I)=(3-\lambda)^2-1=0$, quindi $\lambda_1=4$, $\lambda_2=2$.
2. Autovettori: per $\lambda_1=4$, $(3-4)e_1+e_2=0$ dà $\mathbf{e}_1=\frac{1}{\sqrt{2}}(1,1)$; per $\lambda_2=2$, $\mathbf{e}_2=\frac{1}{\sqrt{2}}(1,-1)$. Sono ortogonali.
3. Assi: l'asse principale va lungo la bisettrice $(1,1)$; i semiassi valgono $2r$ e $\sqrt{2}\,r$, rapporto $\sqrt{2}$.

Covarianza positiva, ellisse inclinata verso l'alto a destra.`,
  },

  // --- esempio 3-D ---
  {
    id: 'fc-esempio-3d',
    kind: 'intuizione',
    q: md`Che cosa mostra l'esempio di gaussiana 3-D della slide 30?`,
    a: md`Una nuvola di punti campionati da una gaussiana in $(x_1,x_2,x_3)$ dentro un cubo. Sulle tre facce sono proiettate le distribuzioni a coppie, disegnate come ellissi concentriche a tre toni di grigio: pavimento $(x_1,x_2)$, parete sinistra $(x_1,x_3)$, parete destra $(x_2,x_3)$. La nuvola è densa vicino a $\mathbf{m}$ e si dirada verso l'esterno. Gli isolivelli in 3-D sono ellissoidi e le loro ombre sono ellissi.`,
  },
  {
    id: 'fc-x1-x3-indipendenti',
    kind: 'intuizione',
    q: md`Nota della slide 30: «In this example, the features $x_1$ and $x_3$ are independent!». Da che cosa lo capisco?`,
    a: md`L'ellisse proiettata sul piano $(x_1,x_3)$ ha gli assi paralleli agli assi coordinati: la covarianza $\sigma_{13}$ è nulla. Per una gaussiana covarianza nulla vuol dire indipendenza:

$$\sigma_{13}=\sigma_{31}=0\ \Rightarrow\ p(x_1,x_3)=p(x_1)\,p(x_3)$$

Le altre due proiezioni sono inclinate: quelle coppie sono correlate. È un'indipendenza a coppie, non condizionata a $x_2$: $\sigma_{13}=0\ \not\Rightarrow\ [\Sigma^{-1}]_{13}=0$.`,
  },

  // --- stima ML della gaussiana ---
  {
    id: 'fc-stima-ml-impostazione',
    kind: 'procedura',
    q: md`Come si imposta la stima ML dei parametri di una gaussiana multivariata?`,
    a: md`Ho $N$ campioni iid $\boldsymbol{X}=\{\mathbf{x}_1,\mathbf{x}_2,\dots,\mathbf{x}_N\}$. Grazie all'ipotesi iid la verosimiglianza è il prodotto delle densità e la log-verosimiglianza una somma:

$$\ln p(\boldsymbol{X}|\mathbf{m},\Sigma)=\sum_{k=1}^{N}\ln p(\mathbf{x}_k|\mathbf{m},\Sigma)$$

Annullo il gradiente rispetto a $\mathbf{m}$ e a $\Sigma$. La slide dice solo «it can be shown»; i passaggi sono nella dimostrazione [«stima ML di m e Σ nel caso multivariato»](#derivation:der09).`,
  },
  {
    id: 'fc-media-ml',
    kind: 'formula',
    q: md`Scrivi la stima ML del vettore media e spiega il significato del risultato.`,
    a: md`$$\hat{\mathbf{m}}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k$$

È la **media campionaria** (*sample mean*). La derivata della log-verosimiglianza rispetto a $\mathbf{m}$ è proporzionale alla somma degli scarti $\sum_k(\mathbf{x}_k-\mathbf{m})$: si annulla quando gli scarti si bilanciano, cioè nel baricentro dei dati. La stima non dipende da $\Sigma$.`,
  },
  {
    id: 'fc-derivata-prima-gaussiana',
    kind: 'procedura',
    q: md`«Develop the first derivative for a gaussian and explain the meaning of the result»: come la sviluppo in 1-D?`,
    a: md`1. Log-verosimiglianza di $N$ campioni iid: $\ln L=-\frac{N}{2}\ln(2\pi\sigma^{2})-\frac{1}{2\sigma^{2}}\sum_k(x_k-m)^2$.
2. Derivata rispetto a $m$: $\frac{1}{\sigma^{2}}\sum_k(x_k-m)=0$, quindi $\hat{m}=\frac{1}{N}\sum_k x_k$.
3. Derivata rispetto a $\sigma^2$: $-\frac{N}{2\sigma^{2}}+\frac{1}{2\sigma^{4}}\sum_k(x_k-m)^2=0$, quindi $\hat{\sigma}^{2}=\frac{1}{N}\sum_k(x_k-\hat{m})^2$.

Significato: la media ML è il punto in cui gli scarti positivi e negativi si compensano; la varianza ML è lo scarto quadratico medio. Dettagli nella dimostrazione [«la derivata prima per una gaussiana 1-D»](#derivation:der08).`,
  },
  {
    id: 'fc-covarianza-ml',
    kind: 'formula',
    q: md`Scrivi la stima ML della matrice di covarianza. Quanti campioni servono perché sia invertibile?`,
    a: md`$$\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}$$

È la definizione di $\Sigma$ con il valore atteso sostituito dalla media sui campioni e $\mathbf{m}$ da $\hat{\mathbf{m}}$; il fattore è $1/N$. Gli scarti hanno somma nulla, quindi

$$\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})=\mathbf{0}\ \Rightarrow\ \mathrm{rank}(\hat{\Sigma})\le\min(n,\,N-1)$$

Servono almeno $n+1$ campioni in posizione generale; con $N=1$ la stima è la matrice nulla.`,
  },
  {
    id: 'fc-covarianza-ml-seconda-forma',
    kind: 'formula',
    q: md`Scrivi la seconda forma della stima ML della covarianza (slide 31). A che cosa serve?`,
    a: md`$$\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t}-\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}$$

È la versione campionaria di $\Sigma=E\{\mathbf{x}\mathbf{x}^{t}\}-\mathbf{m}\mathbf{m}^{t}$. Nel calcolo basta accumulare $\sum_k\mathbf{x}_k$ e $\sum_k\mathbf{x}_k\mathbf{x}_k^{t}$ in una sola passata sui dati.`,
  },
  {
    id: 'fc-proprieta-stime-gaussiane',
    kind: 'proprieta',
    q: md`Che proprietà hanno le stime ML di $\mathbf{m}$ e $\Sigma$ (slide 31)? Dove serve una precisazione?`,
    a: md`La slide: «asymptotically unbiased and efficient, and consistent». Per $N\to+\infty$: $\hat{\mathbf{m}}\to\mathbf{m}$ e $\hat{\Sigma}\to\Sigma$.

Precisazione: $\hat{\mathbf{m}}$ è non distorta ed efficiente per **ogni** $N$, con $Cov\{\hat{\mathbf{m}}\}=\frac{1}{N}\Sigma\to 0$; $\hat{\Sigma}$ è distorta per $N$ finito, quindi per lei le proprietà valgono solo al limite: $\lim_{N\to+\infty}E\{\hat{\Sigma}\}=\Sigma$.`,
  },
  {
    id: 'fc-media-non-distorta',
    kind: 'formula',
    q: md`Quanto vale $E\{\hat{\mathbf{m}}\}$? Quali ipotesi servono?`,
    a: md`$$E\{\hat{\mathbf{m}}\}=\mathbf{m}$$

Per linearità: $E\{\frac{1}{N}\sum_k\mathbf{x}_k\}=\frac{1}{N}\sum_k E\{\mathbf{x}_k\}=\frac{1}{N}N\mathbf{m}$. Vale per ogni $N$, anche con pochi campioni. Basta che ogni campione abbia media $\mathbf{m}$: non servono né l'indipendenza né la gaussianità.`,
  },
  {
    id: 'fc-covarianza-distorta',
    kind: 'formula',
    q: md`Quanto vale $E\{\hat{\Sigma}\}$ per la stima ML? Perché è più piccola del vero?`,
    a: md`$$E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$$

La stima ML è **distorta** (*biased*): in media sottostima la variabilità. Gli scarti sono misurati da $\hat{\mathbf{m}}$, calcolata sugli stessi dati e quindi più vicina a loro della vera $\mathbf{m}$. Nel conto entra $Cov\{\hat{\mathbf{m}}\}=\Sigma/N$. Il fattore tende a 1 per $N\to\infty$; con $N=1$ il valore atteso è la matrice nulla.`,
  },
  {
    id: 'fc-stimatore-corretto',
    kind: 'formula',
    q: md`Scrivi lo stimatore non distorto elementare di $\Sigma$ (*elementary unbiased estimator*).`,
    a: md`$$\hat{\Sigma}=\frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}$$

Stessa somma della ML, divisa per $N-1$: il valore atteso è esattamente $\Sigma$. Non è più la stima ML. La slide lo indica con lo stesso simbolo $\hat{\Sigma}$ ma è un altro stimatore. Richiede $N\ge 2$.`,
  },
  {
    id: 'fc-fattore-correzione',
    kind: 'intuizione',
    q: md`Quando conta il fattore di correzione $\frac{N}{N-1}$?`,
    a: md`$$\hat{\Sigma}_{unbiased}=\frac{N}{N-1}\,\hat{\Sigma}_{ML}$$

Le note: la correzione serve «especially for small sample sizes». Con $N=2$ la stima ML vale in media metà del vero, con $N=10$ il 90%, con $N=100$ il 99%. Con pochi dati la differenza pesa, con molti è trascurabile.`,
  },
  {
    id: 'fc-caso-univariato-ml',
    kind: 'formula',
    q: md`Specializza a una feature ($n=1$) le formule della slide 31: media, varianza ML e varianza corretta.`,
    a: md`$$\hat{m}=\frac{1}{N}\sum_{k=1}^{N}x_k,\qquad \hat{\sigma}^{2}=\frac{1}{N}\sum_{k=1}^{N}(x_k-\hat{m})^{2}=\frac{1}{N}\sum_{k=1}^{N}x_k^{2}-\hat{m}^{2}$$

$$E\{\hat{\sigma}^{2}\}=\frac{N-1}{N}\sigma^{2},\qquad s^{2}=\frac{1}{N-1}\sum_{k=1}^{N}(x_k-\hat{m})^{2},\qquad E\{s^{2}\}=\sigma^{2}$$

Esempio: lunghezze di salmone 62, 70, 68, 75, 65 cm danno $\hat{m}=68$, $\hat{\sigma}^2=19.6$, $s^2=24.5$.`,
  },

  // --- anteprima della stima bayesiana ---
  {
    id: 'fc-ml-contro-bayes',
    kind: 'confronto',
    q: md`Stima ML e stima bayesiana (*Bayesian learning*): come trattano il parametro $\boldsymbol{\theta}$?`,
    a: md`- **ML**: $\boldsymbol{\theta}$ è una quantità **fissa ma incognita**. Cerco la singola stima migliore, quella che massimizza la verosimiglianza: $\hat{\boldsymbol{\theta}}=\arg\max_{\boldsymbol{\theta}}\,p(X|\boldsymbol{\theta})$. Il risultato è un punto.
- **Bayes**: $\boldsymbol{\theta}$ è una **variabile aleatoria** con una distribuzione a priori (*prior*) che riflette ciò che so prima dei dati. Osservati i dati, il teorema di Bayes la aggiorna nella densità a posteriori (*posterior*): $p(\boldsymbol{\theta})\ \longrightarrow\ p(\boldsymbol{\theta}|X)$. Il risultato è una distribuzione.`,
  },
  {
    id: 'fc-forma-densita-nota',
    kind: 'definizione',
    q: md`Quando si applica la stima bayesiana e qual è la sua prima ipotesi?`,
    a: md`Le note: si applica in ogni situazione in cui la densità incognita si può parametrizzare. Prima ipotesi, forma della densità nota (*Known Density Form*): la forma funzionale di $p(\mathbf{x}|\boldsymbol{\theta})$ è assunta nota, i valori di $\boldsymbol{\theta}$ no. È la stessa premessa della stima parametrica: scelgo la famiglia (per esempio gaussiana) e stimo i parametri. Le altre ipotesi continuano nel modulo sulla stima bayesiana.`,
  },
]
