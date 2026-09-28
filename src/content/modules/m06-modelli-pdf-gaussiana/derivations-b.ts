// Derivazioni del foglio m06 (modelli di pdf e modello gaussiano), seconda metà: der11-der19 dell'inventario.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più servono a seguire i conti
// che la fonte salta (controllati sulle immagini di ch2 p16, p22-31 e part1 p19-26): il testo del perché dice da dove vengono.
// Scostamenti voluti dall'inventario:
// - der16: i passi sono riordinati (equazione caratteristica -> autovalori reali -> ortogonalità -> decomposizione),
//   perché l'ortogonalità con autovettori reali presuppone autovalori reali.
// - der18, ultimo passo dell'inventario: tolto "\quad\text{(der06)}" dal LaTeX, perché è un codice interno che lo
//   studente vedrebbe nella formula; il rimando è nel perché, come link. formula-coverage lo segnala come non
//   ritrovato: la formula c'è, senza l'etichetta.
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivationsB: Derivation[] = [
  // --- der11 La media campionaria è non distorta ---------------------------------------------------------
  {
    id: 'der11',
    title: 'La media campionaria è non distorta',
    goal: md`Dimostrare che la stima ML della media è non distorta (*unbiased*), $E\{\hat{\mathbf{m}}\}=\mathbf{m}$, per ogni numero $N$ di campioni, come afferma la slide 31 («In addition, we have»).`,
    assumptions: md`Campioni di addestramento $X=\{\mathbf{x}_1,\dots,\mathbf{x}_N\}$ iid (*independent and identically distributed*) con media $\mathbf{m}=E\{\mathbf{x}\}$ finita. Per questo risultato basta che i campioni abbiano la stessa distribuzione: non servono né l'indipendenza né la forma gaussiana.`,
    steps: [
      {
        latex: md`\hat{\mathbf{m}}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k`,
        why: md`Stima ML del vettore medio del modello gaussiano (slide 31), ricavata nella dimostrazione [«stima ML di m e Σ nel caso multivariato»](#derivation:der09): è la media aritmetica dei campioni (*sample mean*). È una variabile aleatoria: con un altro insieme di campioni si otterrebbe un'altra stima, quindi ha senso chiederne il valore atteso.`,
      },
      {
        latex: md`E\{\hat{\mathbf{m}}\}=E\left\{\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\right\}=\frac{1}{N}\sum_{k=1}^{N}E\{\mathbf{x}_k\}`,
        why: md`Linearità del valore atteso (*linearity of expectation*): la costante $\frac{1}{N}$ esce e il valore atteso di una somma è la somma dei valori attesi. Per i vettori vale componente per componente.`,
      },
      {
        latex: md`E\{\mathbf{x}_k\}=\mathbf{m}\quad\forall k`,
        why: md`I campioni sono identicamente distribuiti, quindi hanno tutti la stessa media $\mathbf{m}$, quella della pdf da cui sono estratti.`,
      },
      {
        latex: md`E\{\hat{\mathbf{m}}\}=\frac{1}{N}\,N\,\mathbf{m}=\mathbf{m}`,
        why: md`La somma contiene $N$ termini uguali a $\mathbf{m}$ e il fattore $\frac{1}{N}$ li riporta a uno solo.`,
      },
      {
        latex: md`E\{\boldsymbol{\varepsilon}\}=E\{\hat{\mathbf{m}}-\mathbf{m}\}=\mathbf{0}\quad\forall N`,
        why: md`Con l'errore di stima (*estimation error*) $\boldsymbol{\varepsilon}=\hat{\boldsymbol{\theta}}-\boldsymbol{\theta}$ delle note (p. 18), il bias (*bias*) è la media dell'errore, $E\{\boldsymbol{\varepsilon}\}$, e qui è nullo per qualunque $N$, non solo asintoticamente. A maggior ragione vale $\lim_{N\to+\infty}E\{\boldsymbol{\varepsilon}\}=\mathbf{0}$ (note, p. 19): la stima è asintoticamente non distorta (*asymptotically unbiased*), la prima proprietà citata dalla slide 31.`,
      },
    ],
    conclusion: md`$E\{\hat{\mathbf{m}}\}=\mathbf{m}$: la media campionaria non ha errore sistematico, per nessun $N$. Con pochi campioni il suo difetto è solo la dispersione attorno a $\mathbf{m}$, cioè $Cov\{\hat{\mathbf{m}}\}=\frac{1}{N}\Sigma$, calcolata nella dimostrazione [«bias della covarianza ML»](#derivation:der12).`,
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }, { doc: 'part1', page: 18 }, { doc: 'part1', page: 19 }],
  },

  // --- der12 Bias della covarianza ML e stimatore corretto -------------------------------------------------
  {
    id: 'der12',
    title: 'Bias della covarianza ML e stimatore corretto',
    goal: md`Dimostrare che la stima ML della covarianza è distorta, $E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$ (slide 31), e ricavare lo stimatore non distorto elementare (*elementary unbiased estimator*) con $\frac{1}{N-1}$ al posto di $\frac{1}{N}$.`,
    assumptions: md`Campioni $\mathbf{x}_1,\dots,\mathbf{x}_N$ **indipendenti** e identicamente distribuiti, con media $\mathbf{m}$ e covarianza $\Sigma$ finite. La forma gaussiana non serve: il risultato vale per qualunque distribuzione con momenti secondi finiti. A differenza della media, qui l'indipendenza serve: entra nel calcolo della covarianza di $\hat{\mathbf{m}}$.`,
    steps: [
      {
        latex: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t}-\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}`,
        why: md`Le due forme della stima ML della covarianza (slide 31); che coincidano è mostrato in [«equivalenza delle due forme della stima ML della covarianza»](#derivation:der10). Si usa la seconda: separa i termini che dipendono da un solo campione dal termine che contiene la media stimata.`,
      },
      {
        latex: md`E\{\hat{\Sigma}\}=\frac{1}{N}\sum_{k=1}^{N}E\{\mathbf{x}_k\mathbf{x}_k^{t}\}-E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}\}`,
        why: md`Si prende il valore atteso della seconda forma e si usa la linearità del valore atteso: la costante $\frac{1}{N}$ esce, la somma e la differenza si distribuiscono.`,
      },
      {
        latex: md`E\{\mathbf{x}_k\mathbf{x}_k^{t}\}=\Sigma+\mathbf{m}\mathbf{m}^{t}`,
        why: md`È l'identità $\Sigma=E\{\mathbf{x}\mathbf{x}^{t}\}-\mathbf{m}\mathbf{m}^{t}$ della slide 27 (dimostrata in [«equivalenza delle due espressioni di Σ»](#derivation:der04)) letta al contrario. Vale per ogni $k$ perché ogni campione ha la distribuzione di $\mathbf{x}$.`,
      },
      {
        latex: md`\frac{1}{N}\sum_{k=1}^{N}E\{\mathbf{x}_k\mathbf{x}_k^{t}\}=\frac{1}{N}\,N\,(\Sigma+\mathbf{m}\mathbf{m}^{t})=\Sigma+\mathbf{m}\mathbf{m}^{t}`,
        why: md`Primo termine sistemato: $N$ addendi tutti uguali, divisi per $N$.`,
      },
      {
        latex: md`\hat{\mathbf{m}}-\mathbf{m}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k-\frac{1}{N}\,N\,\mathbf{m}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\mathbf{m})`,
        why: md`Per il secondo termine serve la covarianza di $\hat{\mathbf{m}}$. Scrivendo $\mathbf{m}$ come $\frac{1}{N}N\mathbf{m}$, lo scarto della media stimata diventa la media degli scarti dei singoli campioni.`,
      },
      {
        latex: md`Cov\{\hat{\mathbf{m}}\}=E\{(\hat{\mathbf{m}}-\mathbf{m})(\hat{\mathbf{m}}-\mathbf{m})^{t}\}=\frac{1}{N^{2}}\sum_{k=1}^{N}\sum_{l=1}^{N}E\{(\mathbf{x}_k-\mathbf{m})(\mathbf{x}_l-\mathbf{m})^{t}\}`,
        why: md`Definizione di covarianza del vettore aleatorio $\hat{\mathbf{m}}$, la cui media è $\mathbf{m}$ ([«la media campionaria è non distorta»](#derivation:der11)). Si sostituisce lo scarto del passo precedente: il prodotto esterno di due somme è la doppia somma di tutti i prodotti esterni, $\left(\sum_k \mathbf{a}_k\right)\left(\sum_l \mathbf{a}_l\right)^{t}=\sum_k\sum_l \mathbf{a}_k\mathbf{a}_l^{t}$, e il fattore $\frac{1}{N}$ compare due volte.`,
      },
      {
        latex: md`k\ne l:\quad E\{(\mathbf{x}_k-\mathbf{m})(\mathbf{x}_l-\mathbf{m})^{t}\}=E\{\mathbf{x}_k-\mathbf{m}\}\,E\{\mathbf{x}_l-\mathbf{m}\}^{t}=\mathbf{0}\,\mathbf{0}^{t}=\mathbf{0}_{n\times n}`,
        why: md`È qui che serve l'indipendenza: per $k\ne l$ i campioni $\mathbf{x}_k$ e $\mathbf{x}_l$ sono indipendenti, quindi il valore atteso del prodotto si fattorizza nel prodotto dei valori attesi, e ciascuno è la media di uno scarto, cioè zero. Degli $N^{2}$ termini della doppia somma sopravvivono solo gli $N$ con $k=l$.`,
      },
      {
        latex: md`k=l:\quad E\{(\mathbf{x}_k-\mathbf{m})(\mathbf{x}_k-\mathbf{m})^{t}\}=Cov\{\mathbf{x}_k\}=\Sigma`,
        why: md`Definizione di matrice di covarianza (slide 27), uguale per tutti i campioni perché sono identicamente distribuiti.`,
      },
      {
        latex: md`Cov\{\hat{\mathbf{m}}\}=\frac{1}{N^{2}}\sum_{k=1}^{N}Cov\{\mathbf{x}_k\}=\frac{1}{N}\Sigma`,
        why: md`Restano $N$ termini uguali a $\Sigma$ divisi per $N^{2}$. In parole: con campioni indipendenti la covarianza della somma è la somma delle covarianze, e la costante $\frac{1}{N}$ esce al quadrato. In 1-D è la regola nota $var\{\hat{m}\}=\frac{\sigma^{2}}{N}$: la deviazione standard della media cala come $\frac{1}{\sqrt{N}}$.`,
      },
      {
        latex: md`E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}\}=Cov\{\hat{\mathbf{m}}\}+E\{\hat{\mathbf{m}}\}E\{\hat{\mathbf{m}}\}^{t}=\frac{1}{N}\Sigma+\mathbf{m}\mathbf{m}^{t}`,
        why: md`La stessa identità $E\{\mathbf{x}\mathbf{x}^{t}\}=Cov\{\mathbf{x}\}+\mathbf{m}\mathbf{m}^{t}$ applicata al vettore aleatorio $\hat{\mathbf{m}}$, di cui ora si conoscono media ($\mathbf{m}$) e covarianza ($\frac{1}{N}\Sigma$).`,
      },
      {
        latex: md`E\{\hat{\Sigma}\}=\Sigma+\mathbf{m}\mathbf{m}^{t}-\frac{1}{N}\Sigma-\mathbf{m}\mathbf{m}^{t}=\frac{N-1}{N}\Sigma`,
        why: md`Si sostituiscono i due termini nel secondo passo: i termini $\mathbf{m}\mathbf{m}^{t}$ si cancellano e resta $\Sigma$ ridotta di $\frac{1}{N}\Sigma$. È il risultato della slide 31.`,
      },
      {
        latex: md`E\{\hat{\Sigma}\}-\Sigma=-\frac{1}{N}\Sigma`,
        why: md`Il bias è negativo: in media la stima ML sottostima la covarianza. Il motivo è che gli scarti si misurano da $\hat{\mathbf{m}}$, calcolata con gli stessi campioni: la media stimata è il punto che rende minima la somma dei quadrati degli scarti, quindi i campioni le stanno più vicini che alla media vera. La media stimata assorbe parte della variabilità dei dati. Con $N=2$ la stima perde in media metà della varianza.`,
      },
      {
        latex: md`\hat{\Sigma}_{unbiased}=\frac{N}{N-1}\hat{\Sigma}_{ML}=\frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}\ \Rightarrow\ E\{\hat{\Sigma}_{unbiased}\}=\Sigma`,
        why: md`Si moltiplica per il reciproco del fattore di bias, il fattore di correzione $\frac{N}{N-1}$ delle note (p. 26): $E\{\hat{\Sigma}_{unbiased}\}=\frac{N}{N-1}\cdot\frac{N-1}{N}\Sigma=\Sigma$. Il fattore $N$ si semplifica con l'$\frac{1}{N}$ della stima ML e resta la formula della slide 31 con $\frac{1}{N-1}$. Le note precisano che la correzione conta soprattutto con pochi campioni (*small sample sizes*): con $N=2$ raddoppia la stima, con $N=100$ la cambia dell'1%.`,
      },
      {
        latex: md`\lim_{N\to+\infty}\frac{N-1}{N}=1`,
        why: md`Il fattore di bias tende a 1: la stima ML della covarianza è asintoticamente non distorta, come afferma la slide 31, e per $N$ grande le due stime quasi coincidono. In 1-D la versione corretta è la [varianza campionaria corretta](#formula:f-c70-2) $s^{2}$.`,
      },
    ],
    conclusion: md`$E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$: la stima ML della covarianza è distorta per ogni $N$ finito (sottostima di $\frac{1}{N}\Sigma$) ma asintoticamente non distorta. Lo stimatore con $\frac{1}{N-1}$ è non distorto per ogni $N$; la differenza pesa soprattutto con pochi campioni. Nel calcolo è uscito anche $Cov\{\hat{\mathbf{m}}\}=\frac{1}{N}\Sigma$, che serve per efficienza e consistenza della media.`,
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }, { doc: 'ch2', page: 27 }],
  },

  // --- der13 Moda e picco della Rayleigh ------------------------------------------------------------------
  {
    id: 'der13',
    title: 'Moda e picco della Rayleigh',
    goal: md`Spiegare perché nel grafico della slide 23 ogni curva di Rayleigh ha il massimo in $x=\sigma$ con altezza circa $0.607/\sigma$ (integrazione didattica: la slide dà solo la formula e il grafico).`,
    assumptions: md`Pdf di Rayleigh (*Rayleigh pdf*) con parametro $\sigma>0$, definita per $x\ge 0$. Descrive un'ampiezza: per esempio il modulo di un vettore 2-D con componenti gaussiane indipendenti, a media nulla e varianza $\sigma^{2}$.`,
    steps: [
      {
        latex: md`f(x|\sigma)=\frac{x}{\sigma^{2}}\exp\left(-\frac{x^{2}}{2\sigma^{2}}\right)`,
        why: md`Formula della slide 23, $f(x|\sigma)=\frac{x\exp\left(\frac{-x^{2}}{2\sigma^{2}}\right)}{\sigma^{2}}$, riscritta con il fattore $x$ in evidenza: un fattore lineare che cresce per un fattore gaussiano che decresce. In $x=0$ vale 0, infatti tutte le curve del grafico partono dall'origine.`,
      },
      {
        latex: md`\frac{d}{dx}\left[x\,e^{-\frac{x^{2}}{2\sigma^{2}}}\right]=e^{-\frac{x^{2}}{2\sigma^{2}}}+x\left(-\frac{x}{\sigma^{2}}\right)e^{-\frac{x^{2}}{2\sigma^{2}}}`,
        why: md`Derivata del prodotto: derivata di $x$ per l'esponenziale, più $x$ per la derivata dell'esponenziale. Per la regola della catena la derivata di $e^{-x^{2}/(2\sigma^{2})}$ è l'esponenziale stesso per $-\frac{2x}{2\sigma^{2}}=-\frac{x}{\sigma^{2}}$.`,
      },
      {
        latex: md`\frac{df}{dx}=\frac{1}{\sigma^{2}}\exp\left(-\frac{x^{2}}{2\sigma^{2}}\right)\left(1-\frac{x^{2}}{\sigma^{2}}\right)`,
        why: md`Si raccoglie l'esponenziale e si rimette la costante $\frac{1}{\sigma^{2}}$. I due contributi sono visibili: il fattore lineare fa crescere la curva (il termine 1), quello gaussiano la fa scendere (il termine $-\frac{x^{2}}{\sigma^{2}}$).`,
      },
      {
        latex: md`\frac{df}{dx}=0\ \Rightarrow\ x=\sigma`,
        why: md`L'esponenziale non si annulla mai, quindi si annulla la parentesi: $x^{2}=\sigma^{2}$. Si tiene la radice positiva perché $x$ è un'ampiezza, $x\ge 0$.`,
      },
      {
        latex: md`0\le x<\sigma:\ \frac{df}{dx}>0,\qquad x>\sigma:\ \frac{df}{dx}<0`,
        why: md`Il segno della derivata è quello della parentesi $1-\frac{x^{2}}{\sigma^{2}}$: la curva sale fino a $\sigma$ e poi scende. Il punto stazionario è quindi il massimo, cioè la moda (*mode*).`,
      },
      {
        latex: md`f(\sigma|\sigma)=\frac{1}{\sigma}e^{-1/2}=\frac{1}{\sigma\sqrt{e}}\approx\frac{0.607}{\sigma}`,
        why: md`Si sostituisce $x=\sigma$: $\frac{\sigma}{\sigma^{2}}=\frac{1}{\sigma}$ e l'esponente vale $-\frac{\sigma^{2}}{2\sigma^{2}}=-\frac{1}{2}$; $e^{-1/2}=\frac{1}{\sqrt{e}}\approx 0.6065$.`,
      },
      {
        latex: md`\sigma=0.5\to1.21,\quad \sigma=1\to0.61,\quad \sigma=2\to0.30,\quad \sigma=3\to0.20,\quad \sigma=4\to0.15`,
        why: md`Con i cinque valori della legenda si ritrovano i picchi del grafico, nei punti $x=0.5,\,1,\,2,\,3,\,4$. Raddoppiare $\sigma$ sposta il picco al doppio e ne dimezza l'altezza: $\sigma$ è un parametro di scala (*scale parameter*) e l'area sotto la curva resta 1, quindi una curva più larga è anche più bassa.`,
      },
    ],
    conclusion: md`La Rayleigh ha la moda in $x=\sigma$ e il picco alto $\frac{1}{\sigma\sqrt{e}}\approx\frac{0.607}{\sigma}$: al crescere di $\sigma$ la curva si sposta a destra, si abbassa e si allarga, come nel grafico della slide 23.`,
    source: [{ doc: 'ch2', page: 23 }, { doc: 'part1', page: 22 }],
  },

  // --- der14 La log-normale come cambio di variabile ---------------------------------------------------------
  {
    id: 'der14',
    title: 'La log-normale come cambio di variabile di una gaussiana',
    goal: md`Spiegare da dove viene il fattore $\frac{1}{x}$ nella formula log-normale della slide 24 e che cosa sono $\mu$ e $\sigma$, ricavando moda, mediana e media (integrazione didattica: la slide dà solo formula e grafico).`,
    assumptions: md`$x>0$ e il suo logaritmo $y=\ln x$ è gaussiano con media $\mu$ e varianza $\sigma^{2}$. Attenzione: $\mu$ e $\sigma$ sono media e deviazione standard del **logaritmo** di $x$, non di $x$.`,
    steps: [
      {
        latex: md`y=\ln x\sim N(\mu,\sigma^{2}):\quad p_y(y)=\frac{1}{\sigma\sqrt{2\pi}}\exp\left[-\frac{(y-\mu)^{2}}{2\sigma^{2}}\right]`,
        why: md`Definizione: $x$ è log-normale (*log-normal*) se il suo logaritmo è gaussiano. La pdf di $y$ è la gaussiana univariata della slide 22.`,
      },
      {
        latex: md`y=\ln x\ \Rightarrow\ \frac{dy}{dx}=\frac{1}{x}>0\quad (x>0)`,
        why: md`La trasformazione è strettamente crescente su $x>0$, quindi invertibile ($x=e^{y}$), e la sua derivata è positiva: nel passo successivo il valore assoluto non cambia nulla.`,
      },
      {
        latex: md`p_x(x)=p_y(\ln x)\left|\frac{dy}{dx}\right|=p_y(\ln x)\,\frac{1}{x}`,
        why: md`Regola del cambio di variabile per le densità: la probabilità di un intervallino si conserva, $p_x(x)\,dx=p_y(y)\,dy$, quindi si moltiplica per il valore assoluto della derivata della trasformazione. Per $x<1$ un intervallino $dx$ corrisponde a un intervallo di $y$ più largo ($dy=dx/x$) e la densità si amplifica; per $x>1$ succede il contrario.`,
      },
      {
        latex: md`f(x;\mu,\sigma)=\frac{1}{x\sigma\sqrt{2\pi}}\exp\left[-\frac{(\ln x-\mu)^{2}}{2\sigma^{2}}\right],\quad x>0`,
        why: md`Si sostituisce $y=\ln x$ nella gaussiana: è la formula della slide 24, $f(x;\mu,\sigma)=\frac{e^{-(\ln x-\mu)^{2}/(2\sigma^{2})}}{x\sigma\sqrt{2\pi}}$. Il fattore $\frac{1}{x}$ è lo jacobiano (*Jacobian*) del logaritmo.`,
      },
      {
        latex: md`\ln f=-\ln x-\frac{(\ln x-\mu)^{2}}{2\sigma^{2}}+cost\ \Rightarrow\ \frac{d\ln f}{dx}=-\frac{1}{x}-\frac{\ln x-\mu}{\sigma^{2}x}=0\ \Rightarrow\ \ln x=\mu-\sigma^{2}`,
        why: md`La moda si trova annullando la derivata del logaritmo della pdf: il logaritmo è crescente, quindi il punto di massimo è lo stesso e i conti sono più semplici. La derivata di $-\frac{(\ln x-\mu)^{2}}{2\sigma^{2}}$ è $-\frac{2(\ln x-\mu)}{2\sigma^{2}}\cdot\frac{1}{x}$ per la regola della catena. Moltiplicando l'equazione per $-\sigma^{2}x$, che non è zero, resta $\sigma^{2}+\ln x-\mu=0$.`,
      },
      {
        latex: md`P\{x\le e^{\mu}\}=P\{\ln x\le\mu\}=P\{y\le\mu\}=\frac{1}{2}\ \Rightarrow\ x_{mediana}=e^{\mu}`,
        why: md`Mediana (*median*): il logaritmo è crescente e conserva l'ordine, quindi $x\le e^{\mu}$ equivale a $y\le\mu$; la gaussiana è simmetrica attorno alla sua media, che quindi è anche la sua mediana.`,
      },
      {
        latex: md`E\{x\}=E\{e^{y}\}=\int_{-\infty}^{+\infty}e^{y}\,\frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(y-\mu)^{2}}{2\sigma^{2}}}\,dy`,
        why: md`Media (*mean*): $x=e^{y}$, e il valore atteso di una funzione di $y$ si calcola integrando contro la pdf di $y$.`,
      },
      {
        latex: md`y-\frac{(y-\mu)^{2}}{2\sigma^{2}}=-\frac{(y-\mu-\sigma^{2})^{2}}{2\sigma^{2}}+\mu+\frac{\sigma^{2}}{2}`,
        why: md`Completamento del quadrato negli esponenti. Verifica: $-\frac{(y-\mu-\sigma^{2})^{2}}{2\sigma^{2}}=-\frac{(y-\mu)^{2}}{2\sigma^{2}}+(y-\mu)-\frac{\sigma^{2}}{2}$, e aggiungendo $\mu+\frac{\sigma^{2}}{2}$ si ottiene il membro di sinistra.`,
      },
      {
        latex: md`E\{x\}=e^{\mu+\sigma^{2}/2}\int_{-\infty}^{+\infty}\frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(y-\mu-\sigma^{2})^{2}}{2\sigma^{2}}}\,dy=e^{\mu+\sigma^{2}/2}`,
        why: md`La costante $e^{\mu+\sigma^{2}/2}$ esce dall'integrale; resta l'integrale di una pdf gaussiana di media $\mu+\sigma^{2}$ e varianza $\sigma^{2}$, che vale 1.`,
      },
      {
        latex: md`x_{moda}=e^{\mu-\sigma^{2}},\qquad x_{mediana}=e^{\mu},\qquad E\{x\}=e^{\mu+\sigma^{2}/2}`,
        why: md`Le tre misure di posizione messe insieme: $x_{moda}<x_{mediana}<E\{x\}$, il segno di una pdf asimmetrica con la coda a destra. Con $\mu=0$ (il grafico) la mediana è sempre 1, mentre la moda scende verso 0 al crescere di $\sigma$: moda 0.94 per $\sigma=1/4$, 0.78 per $\sigma=1/2$, 0.37 per $\sigma=1$, 0.11 per $\sigma=3/2$. Con $\sigma=10$ la moda è $e^{-100}$, praticamente 0: la curva è schiacciata contro l'asse verticale.`,
      },
      {
        latex: md`f(x_{moda})=\frac{e^{\sigma^{2}/2-\mu}}{\sigma\sqrt{2\pi}}:\quad \mu=0,\ \sigma=\tfrac{1}{4}\to1.65,\ \sigma=\tfrac{1}{2}\to0.90,\ \sigma=1\to0.66,\ \sigma=\tfrac{3}{2}\to0.82`,
        why: md`Altezza dei picchi: con $\ln x=\mu-\sigma^{2}$ il fattore $\frac{1}{x}$ vale $e^{\sigma^{2}-\mu}$ e l'esponenziale vale $e^{-\sigma^{4}/(2\sigma^{2})}=e^{-\sigma^{2}/2}$; il prodotto è $e^{\sigma^{2}/2-\mu}$. I valori coincidono con i picchi del grafico della slide 24. Per $\sigma=1/8$ il picco sarebbe 3.22, oltre il massimo dell'asse (2.0): per questo la curva rosa esce dal riquadro.`,
      },
    ],
    conclusion: md`La log-normale è una gaussiana «vista attraverso» l'esponenziale: il fattore $\frac{1}{x}$ è lo jacobiano del logaritmo, $\mu$ e $\sigma$ sono media e deviazione standard di $\ln x$. La moda $e^{\mu-\sigma^{2}}$, la mediana $e^{\mu}$ e la media $e^{\mu+\sigma^{2}/2}$ spiegano le curve della slide: con $\mu=0$ e $\sigma$ piccolo la curva è stretta e quasi simmetrica attorno a 1, con $\sigma$ grande si schiaccia verso 0 con una lunga coda a destra.`,
    source: [{ doc: 'ch2', page: 24 }, { doc: 'part1', page: 22 }, { doc: 'ch2', page: 22 }],
  },

  // --- der15 Volume 1 della campana ---------------------------------------------------------------------
  {
    id: 'der15',
    title: 'Perché la campana ha volume 1: costante di normalizzazione e autovalori',
    goal: md`Giustificare la frase della slide 28, $p(\mathbf{x})$ come campana di volume unitario (*bell of unitary volume*), e il fattore $\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}$ della slide 26, usando la base ortogonale di autovettori della slide 29 (integrazione didattica: la fonte non lo dimostra).`,
    assumptions: md`$\Sigma$ simmetrica e definita positiva (tutti gli autovalori $\lambda_i>0$), così che $\Sigma^{-1}$ e $|\Sigma|^{1/2}$ esistano. Si usa la decomposizione spettrale $\Sigma=U\Lambda U^{t}$ con $U$ ortogonale, dimostrata in [«autovalori reali e autovettori ortogonali di Σ»](#derivation:der16).`,
    steps: [
      {
        latex: md`\int_{\Re^{n}}p(\mathbf{x})\,d\mathbf{x}=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\int_{\Re^{n}}\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]d\mathbf{x}`,
        why: md`Il volume sotto la campana è l'integrale della pdf su tutto lo spazio delle feature $\Re^{n}$; la costante di normalizzazione non dipende da $\mathbf{x}$ ed esce dall'integrale.`,
      },
      {
        latex: md`\Sigma=U\Lambda U^{t}\ \Rightarrow\ \Sigma^{-1}=(U^{t})^{-1}\Lambda^{-1}U^{-1}=U\Lambda^{-1}U^{t},\qquad \Lambda^{-1}=diag\left(\frac{1}{\lambda_1},\dots,\frac{1}{\lambda_n}\right)`,
        why: md`L'inversa di un prodotto è il prodotto delle inverse in ordine inverso; per una matrice ortogonale $U^{-1}=U^{t}$; l'inversa di una matrice diagonale ha sulla diagonale i reciproci, che esistono perché $\lambda_i>0$. $\Sigma^{-1}$ ha quindi gli stessi autovettori di $\Sigma$ e autovalori $\frac{1}{\lambda_i}$.`,
      },
      {
        latex: md`\mathbf{y}=U^{t}(\mathbf{x}-\mathbf{m}),\qquad |\det U^{t}|=1\ \Rightarrow\ d\mathbf{x}=d\mathbf{y}`,
        why: md`Si passa alle coordinate lungo gli autovettori: traslazione in $\mathbf{m}$ più rotazione. La matrice degli autovettori è ortogonale (base ortogonale, slide 29): da $U^{t}U=I$ segue $(\det U)^{2}=1$, quindi il determinante vale $\pm 1$ e la trasformazione non cambia i volumi. Lo jacobiano vale 1 in valore assoluto e l'integrale su $\Re^{n}$ resta su $\Re^{n}$.`,
      },
      {
        latex: md`(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})=(\mathbf{x}-\mathbf{m})^{t}U\Lambda^{-1}U^{t}(\mathbf{x}-\mathbf{m})=\mathbf{y}^{t}\Lambda^{-1}\mathbf{y}`,
        why: md`Si sostituisce $\Sigma^{-1}=U\Lambda^{-1}U^{t}$ e si riconosce $\mathbf{y}$ a destra e $\mathbf{y}^{t}=(\mathbf{x}-\mathbf{m})^{t}U$ a sinistra.`,
      },
      {
        latex: md`(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})=\sum_{i=1}^{n}\frac{y_i^{2}}{\lambda_i}`,
        why: md`Una forma quadratica con matrice diagonale non ha termini misti: nelle nuove coordinate l'esponente è una somma di quadrati pesati, come nella dimostrazione [«perché gli isolivelli sono ellissi con assi lungo gli autovettori»](#derivation:der07).`,
      },
      {
        latex: md`\int_{-\infty}^{+\infty}e^{-\frac{y^{2}}{2\lambda}}\,dy=\sqrt{\lambda}\int_{-\infty}^{+\infty}e^{-\frac{u^{2}}{2}}\,du=\sqrt{\lambda}\,\sqrt{2\pi}`,
        why: md`Integrale di una gaussiana 1-D non normalizzata di varianza $\lambda$: con $y=\sqrt{\lambda}\,u$ si ha $dy=\sqrt{\lambda}\,du$, e $\int e^{-u^{2}/2}\,du=\sqrt{2\pi}$ è lo stesso fatto che rende unitaria l'area della gaussiana 1-D della slide 22 (il fattore $\frac{1}{\sigma\sqrt{2\pi}}$).`,
      },
      {
        latex: md`\int_{\Re^{n}}\exp\left[-\frac{1}{2}\sum_{i=1}^{n}\frac{y_i^{2}}{\lambda_i}\right]d\mathbf{y}=\prod_{i=1}^{n}\int_{-\infty}^{+\infty}e^{-\frac{y_i^{2}}{2\lambda_i}}\,dy_i=\prod_{i=1}^{n}\sqrt{2\pi\lambda_i}`,
        why: md`L'esponenziale di una somma è il prodotto degli esponenziali, e ogni fattore dipende da una sola coordinata: l'integrale $n$-dimensionale si spezza in $n$ integrali 1-D, ognuno calcolato nel passo precedente con $\lambda=\lambda_i$.`,
      },
      {
        latex: md`|\Sigma|=|U\Lambda U^{t}|=|U|\,|\Lambda|\,|U^{t}|=\prod_{i=1}^{n}\lambda_i\ \Rightarrow\ \prod_{i=1}^{n}\sqrt{2\pi\lambda_i}=(2\pi)^{n/2}|\Sigma|^{1/2}`,
        why: md`Il determinante di un prodotto è il prodotto dei determinanti; $|U|\,|U^{t}|=|UU^{t}|=|I|=1$, e il determinante della matrice diagonale è il prodotto degli autovalori. Il determinante della covarianza è quindi il prodotto delle varianze lungo gli assi dell'ellisse. Poi $\prod_i\sqrt{2\pi\lambda_i}=\sqrt{(2\pi)^{n}\prod_i\lambda_i}$.`,
      },
      {
        latex: md`\int_{\Re^{n}}p(\mathbf{x})\,d\mathbf{x}=\frac{(2\pi)^{n/2}|\Sigma|^{1/2}}{(2\pi)^{n/2}|\Sigma|^{1/2}}=1`,
        why: md`La costante di normalizzazione della slide 26 è esattamente l'inverso dell'integrale dell'esponenziale: il volume vale 1 per qualunque $\mathbf{m}$ e qualunque $\Sigma$ definita positiva. Se un autovalore è zero, $|\Sigma|=0$: la costante non esiste e la pdf non è definita (caso degenere, dati schiacciati su un sottospazio).`,
      },
      {
        latex: md`n=2:\quad \int_{-\infty}^{+\infty}\int_{-\infty}^{+\infty}p(x_1,x_2)\,dx_1\,dx_2=\frac{2\pi\sqrt{\lambda_1\lambda_2}}{2\pi|\Sigma|^{1/2}}=1`,
        why: md`Il caso della campana 2-D della slide 28. Per esempio con $\Sigma=\begin{bmatrix}2&1\\1&2\end{bmatrix}$ gli autovalori sono 3 e 1 e $|\Sigma|=4-1=3=3\cdot 1$.`,
      },
    ],
    conclusion: md`La campana gaussiana ha volume 1 per ogni $\mathbf{m}$ e $\Sigma$ definita positiva: nella base degli autovettori si spezza in $n$ gaussiane 1-D indipendenti di varianze $\lambda_i$, e $(2\pi)^{n/2}|\Sigma|^{1/2}=\prod_i\sqrt{2\pi\lambda_i}$. Conseguenza: l'altezza del picco $p(\mathbf{m})=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}$ scende quando $|\Sigma|$ cresce, perché una campana più larga, a volume fisso, deve essere più bassa.`,
    source: [{ doc: 'ch2', page: 28 }, { doc: 'ch2', page: 26 }, { doc: 'ch2', page: 29 }, { doc: 'part1', page: 24 }],
  },

  // --- der16 Autovalori reali e autovettori ortogonali ---------------------------------------------------------
  // Passi riordinati rispetto all'inventario: prima gli autovalori reali, poi l'ortogonalità (che li presuppone).
  {
    id: 'der16',
    title: 'Autovalori reali e autovettori ortogonali di Σ',
    goal: md`Dimostrare la frase della slide 29, gli autovettori formano una base ortogonale (*orthogonal basis*), e il fatto che gli autovalori sono reali: entrambi sono conseguenze della simmetria di $\Sigma$ enunciata nella slide 27 (integrazione: la fonte non lo dimostra; all'orale Melgani chiede equazione caratteristica, autovalori e autovettori).`,
    assumptions: md`$\Sigma$ matrice $n\times n$ reale e simmetrica, $\Sigma=\Sigma^{t}$ (slide 27). La semidefinitezza positiva non serve qui: serve solo per il segno degli autovalori ([«Σ è simmetrica e semidefinita positiva»](#derivation:der05)).`,
    steps: [
      {
        latex: md`\Sigma\mathbf{e}=\lambda\mathbf{e},\ \mathbf{e}\ne\mathbf{0}\iff(\Sigma-\lambda I)\,\mathbf{e}=\mathbf{0},\ \mathbf{e}\ne\mathbf{0}\iff|\Sigma-\lambda I|=0`,
        why: md`Definizione di autovalore (*eigenvalue*) e autovettore (*eigenvector*), i $\lambda_i$ ed $\mathbf{e}_i$ della slide 29. Un sistema omogeneo ha una soluzione non nulla solo se la sua matrice è singolare: si ottiene l'equazione caratteristica (*characteristic equation*), un polinomio di grado $n$ in $\lambda$ con $n$ radici contate con molteplicità, a priori complesse.`,
      },
      {
        latex: md`\Sigma\mathbf{e}=\lambda\mathbf{e},\ \mathbf{e}\in\mathbb{C}^{n}:\quad \bar{\mathbf{e}}^{t}\Sigma\mathbf{e}=\lambda\,\|\mathbf{e}\|^{2},\qquad \overline{\bar{\mathbf{e}}^{t}\Sigma\mathbf{e}}=\mathbf{e}^{t}\Sigma\bar{\mathbf{e}}=\bar{\mathbf{e}}^{t}\Sigma^{t}\mathbf{e}=\bar{\mathbf{e}}^{t}\Sigma\mathbf{e}\ \Rightarrow\ \lambda\in\Re`,
        why: md`Gli autovalori sono reali. Si ammette un autovettore complesso $\mathbf{e}$ e si moltiplica a sinistra per il coniugato trasposto: $\bar{\mathbf{e}}^{t}\mathbf{e}=\sum_j\vert e_j\vert^{2}=\|\mathbf{e}\|^{2}>0$ è reale. Lo scalare $\bar{\mathbf{e}}^{t}\Sigma\mathbf{e}$ è uguale al proprio coniugato: coniugando, $\Sigma$ reale resta com'è; uno scalare è uguale al proprio trasposto; e $\Sigma^{t}=\Sigma$. Quindi è reale, e anche $\lambda$, rapporto di due reali, lo è. È ciò che rende sensato ordinarli, $\lambda_1\ge\lambda_2\ge\dots\ge\lambda_n$ (slide 29).`,
      },
      {
        latex: md`\Sigma\mathbf{e}_i=\lambda_i\mathbf{e}_i,\qquad \Sigma\mathbf{e}_j=\lambda_j\mathbf{e}_j,\qquad \lambda_i\ne\lambda_j`,
        why: md`Due autovettori di $\Sigma$ associati ad autovalori distinti. Ora gli autovalori sono reali, quindi $\Sigma-\lambda_i I$ è una matrice reale singolare e gli autovettori si possono scegliere reali.`,
      },
      {
        latex: md`\mathbf{e}_j^{t}\Sigma\mathbf{e}_i=\lambda_i\,\mathbf{e}_j^{t}\mathbf{e}_i`,
        why: md`Si moltiplica a sinistra la prima equazione per il vettore riga $\mathbf{e}_j^{t}$: si ottiene uno scalare.`,
      },
      {
        latex: md`\mathbf{e}_j^{t}\Sigma\mathbf{e}_i=(\Sigma^{t}\mathbf{e}_j)^{t}\mathbf{e}_i=(\Sigma\mathbf{e}_j)^{t}\mathbf{e}_i=\lambda_j\,\mathbf{e}_j^{t}\mathbf{e}_i`,
        why: md`Lo stesso scalare calcolato in un altro modo: $\mathbf{e}_j^{t}\Sigma=(\Sigma^{t}\mathbf{e}_j)^{t}$ per la regola della trasposta di un prodotto, e con la simmetria $\Sigma=\Sigma^{t}$ (slide 27) diventa la trasposta di $\Sigma\mathbf{e}_j=\lambda_j\mathbf{e}_j$.`,
      },
      {
        latex: md`(\lambda_i-\lambda_j)\,\mathbf{e}_j^{t}\mathbf{e}_i=0\ \Rightarrow\ \mathbf{e}_j^{t}\mathbf{e}_i=0`,
        why: md`Si sottraggono le due espressioni dello stesso scalare. Se gli autovalori sono diversi il prodotto scalare deve essere nullo: gli autovettori sono perpendicolari. Con autovalori ripetuti (per esempio $\lambda_1=\lambda_2$ in 2-D, isolivelli circolari) ogni vettore del loro sottospazio è autovettore e se ne può scegliere una base ortogonale: in ogni caso si ottiene la base ortogonale della slide 29.`,
      },
      {
        latex: md`\mathbf{e}_i^{t}\mathbf{e}_j=\delta_{ij},\quad U=[\mathbf{e}_1\dots\mathbf{e}_n]\ \Rightarrow\ U^{t}U=I,\qquad \Sigma U=U\Lambda\ \Rightarrow\ \Sigma=U\Lambda U^{t}`,
        why: md`Si normalizzano gli autovettori (lunghezza 1) e si mettono come colonne di $U$: l'elemento $(i,j)$ di $U^{t}U$ è $\mathbf{e}_i^{t}\mathbf{e}_j$, che vale 1 se $i=j$ e 0 altrimenti (delta di Kronecker $\delta_{ij}$). Le $n$ equazioni $\Sigma\mathbf{e}_i=\lambda_i\mathbf{e}_i$ si scrivono insieme $\Sigma U=U\Lambda$ con $\Lambda=diag(\lambda_1,\dots,\lambda_n)$; poiché $U^{-1}=U^{t}$, moltiplicando a destra per $U^{t}$ si ottiene la decomposizione spettrale (*spectral decomposition*) usata per gli isolivelli ellittici e per il volume della campana ([«perché la campana ha volume 1»](#derivation:der15)).`,
      },
      {
        latex: md`n=2:\ \ |\Sigma-\lambda I|=\lambda^{2}-(\sigma_1^{2}+\sigma_2^{2})\lambda+\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2}=0\ \Rightarrow\ \lambda_{1,2}=\frac{\sigma_1^{2}+\sigma_2^{2}\pm\sqrt{(\sigma_1^{2}-\sigma_2^{2})^{2}+4\sigma_{12}^{2}}}{2}`,
        why: md`Controllo diretto in 2-D con $\Sigma=\begin{bmatrix}\sigma_1^{2}&\sigma_{12}\\\sigma_{12}&\sigma_2^{2}\end{bmatrix}$: il determinante è $(\sigma_1^{2}-\lambda)(\sigma_2^{2}-\lambda)-\sigma_{12}^{2}$. Il discriminante $(\sigma_1^{2}+\sigma_2^{2})^{2}-4(\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2})=(\sigma_1^{2}-\sigma_2^{2})^{2}+4\sigma_{12}^{2}$ è una somma di quadrati, quindi mai negativo: radici reali, come dimostrato in generale. Le due radici coincidono solo se $\sigma_1^{2}=\sigma_2^{2}$ e $\sigma_{12}=0$ (isolivelli circolari). La somma delle radici è la traccia, il prodotto è $|\Sigma|$.`,
      },
      {
        latex: md`\Sigma=\begin{bmatrix}2&1\\1&2\end{bmatrix}:\ \lambda_1=3,\ \mathbf{e}_1=\frac{1}{\sqrt{2}}\begin{bmatrix}1\\1\end{bmatrix};\quad \lambda_2=1,\ \mathbf{e}_2=\frac{1}{\sqrt{2}}\begin{bmatrix}1\\-1\end{bmatrix};\quad \mathbf{e}_1^{t}\mathbf{e}_2=\frac{1-1}{2}=0`,
        why: md`Esempio numerico: $\lambda_{1,2}=\frac{4\pm\sqrt{0+4}}{2}=3,\,1$. Verifica: $\Sigma\mathbf{e}_1=\frac{1}{\sqrt{2}}[3\ \,3]^{t}=3\,\mathbf{e}_1$ e $\Sigma\mathbf{e}_2=\frac{1}{\sqrt{2}}[1\ \,{-1}]^{t}=\mathbf{e}_2$. Le feature sono correlate positivamente e l'asse principale dell'ellisse sta a 45°, lungo $\mathbf{e}_1$.`,
      },
    ],
    conclusion: md`Per $\Sigma$ reale e simmetrica gli autovalori sono reali e gli autovettori si possono scegliere ortonormali: $U^{t}U=I$ e $\Sigma=U\Lambda U^{t}$. È la base ortogonale della slide 29, su cui poggiano la forma ellittica degli isolivelli, il volume unitario della campana e la direzione di massima varianza.`,
    source: [{ doc: 'ch2', page: 29 }, { doc: 'ch2', page: 27 }, { doc: 'part1', page: 25 }],
  },

  // --- der17 Direzione di massima varianza ----------------------------------------------------------------
  {
    id: 'der17',
    title: "L'autovettore del massimo autovalore è la direzione di massima varianza",
    goal: md`Dimostrare ciò che le note affermano a parole: il primo autovettore è la direzione lungo cui i dati hanno la varianza più grande (*the direction along which the data has the greatest variance*, p. 24; *direction of maximum variance*, p. 25) e l'ultimo quella di varianza minima (*direction of minimal variance*). Giustifica l'asse principale (*main axis*, *principal axis*) delle slide 28-29 (integrazione: la fonte non lo dimostra; è anche il primo passo della PCA).`,
    assumptions: md`$\mathbf{x}$ vettore aleatorio con media $\mathbf{m}$ e covarianza $\Sigma$ simmetrica e semidefinita positiva, con autovalori ordinati $\lambda_1\ge\dots\ge\lambda_n$ e autovettori ortonormali $\mathbf{e}_1,\dots,\mathbf{e}_n$ ([«autovalori reali e autovettori ortogonali di Σ»](#derivation:der16)). La forma gaussiana non serve.`,
    steps: [
      {
        latex: md`var\{\mathbf{a}^{t}\mathbf{x}\}=E\{(\mathbf{a}^{t}\mathbf{x}-\mathbf{a}^{t}\mathbf{m})^{2}\}=E\{\mathbf{a}^{t}(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\mathbf{a}\}`,
        why: md`$\mathbf{a}^{t}\mathbf{x}$ è la proiezione (scalare) dei dati sulla direzione $\mathbf{a}$ e ha media $\mathbf{a}^{t}\mathbf{m}$. Il quadrato di uno scalare è lo scalare per il suo trasposto: $(\mathbf{a}^{t}(\mathbf{x}-\mathbf{m}))^{2}=\mathbf{a}^{t}(\mathbf{x}-\mathbf{m})\,(\mathbf{x}-\mathbf{m})^{t}\mathbf{a}$.`,
      },
      {
        latex: md`var\{\mathbf{a}^{t}\mathbf{x}\}=\mathbf{a}^{t}\Sigma\,\mathbf{a},\qquad \|\mathbf{a}\|=1`,
        why: md`Il vettore costante $\mathbf{a}$ esce dal valore atteso e resta $E\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\}=\Sigma$: la varianza dei dati proiettati è la forma quadratica di $\Sigma$ ([«Σ è simmetrica e semidefinita positiva»](#derivation:der05)). Il vincolo di norma unitaria è indispensabile: senza, basterebbe allungare $\mathbf{a}$ per far crescere la varianza senza limite, mentre conta solo la direzione.`,
      },
      {
        latex: md`L(\mathbf{a},\lambda)=\mathbf{a}^{t}\Sigma\,\mathbf{a}-\lambda\left(\mathbf{a}^{t}\mathbf{a}-1\right)`,
        why: md`Massimizzazione vincolata: si introduce il moltiplicatore di Lagrange (*Lagrange multiplier*) $\lambda$ per il vincolo $\mathbf{a}^{t}\mathbf{a}=1$.`,
      },
      {
        latex: md`\nabla_{\mathbf{a}}L=2\Sigma\mathbf{a}-2\lambda\mathbf{a}=\mathbf{0}\ \Rightarrow\ \Sigma\mathbf{a}=\lambda\mathbf{a}`,
        why: md`Il gradiente della forma quadratica è $(\Sigma+\Sigma^{t})\mathbf{a}=2\Sigma\mathbf{a}$ perché $\Sigma$ è simmetrica; quello del vincolo è $2\mathbf{a}$. I punti stazionari sono esattamente gli autovettori di $\Sigma$, e il moltiplicatore è il corrispondente autovalore.`,
      },
      {
        latex: md`\mathbf{a}=\mathbf{e}_i\ \Rightarrow\ \mathbf{e}_i^{t}\Sigma\,\mathbf{e}_i=\lambda_i\,\mathbf{e}_i^{t}\mathbf{e}_i=\lambda_i`,
        why: md`Sostituendo un autovettore unitario, la varianza proiettata vale proprio il suo autovalore: ogni autovalore è la varianza dei dati lungo il proprio autovettore.`,
      },
      {
        latex: md`\max_{\|\mathbf{a}\|=1}\mathbf{a}^{t}\Sigma\,\mathbf{a}=\lambda_1\ \ (\mathbf{a}=\mathbf{e}_1),\qquad \min_{\|\mathbf{a}\|=1}\mathbf{a}^{t}\Sigma\,\mathbf{a}=\lambda_n\ \ (\mathbf{a}=\mathbf{e}_n)`,
        why: md`Il vincolo $\|\mathbf{a}\|=1$ è una sfera, chiusa e limitata, quindi massimo e minimo esistono e sono tra i punti stazionari: il massimo è quello con l'autovalore più grande, il minimo quello con il più piccolo. $\mathbf{e}_1$ definisce l'asse principale (direzione di massima varianza), $\mathbf{e}_n$ l'asse più piccolo (*smallest axis*, direzione di minima varianza), come dicono la slide 29 e le note p. 25.`,
      },
      {
        latex: md`\mathbf{a}^{t}\Sigma\,\mathbf{a}=\left(\sum_{i=1}^{n}c_i\mathbf{e}_i\right)^{t}\left(\sum_{j=1}^{n}c_j\lambda_j\mathbf{e}_j\right)=\sum_{i=1}^{n}\sum_{j=1}^{n}c_ic_j\lambda_j\,\mathbf{e}_i^{t}\mathbf{e}_j=\sum_{i=1}^{n}\lambda_ic_i^{2}`,
        why: md`Verifica senza Lagrange. Si scrive $\mathbf{a}$ nella base ortonormale degli autovettori, $\mathbf{a}=\sum_i c_i\mathbf{e}_i$ con $c_i=\mathbf{e}_i^{t}\mathbf{a}$; allora $\Sigma\mathbf{a}=\sum_j c_j\lambda_j\mathbf{e}_j$. Nella doppia somma l'ortonormalità ($\mathbf{e}_i^{t}\mathbf{e}_j=\delta_{ij}$) lascia solo i termini con $i=j$. Allo stesso modo $\|\mathbf{a}\|^{2}=\sum_i c_i^{2}$.`,
      },
      {
        latex: md`\mathbf{a}=\sum_{i=1}^{n}c_i\mathbf{e}_i,\ \sum_{i=1}^{n}c_i^{2}=1\ \Rightarrow\ \lambda_n\le\mathbf{a}^{t}\Sigma\,\mathbf{a}=\sum_{i=1}^{n}\lambda_i c_i^{2}\le\lambda_1`,
        why: md`La varianza proiettata è una media pesata degli autovalori con pesi $c_i^{2}$ che sommano a 1: non supera il più grande e non scende sotto il più piccolo. Gli estremi si raggiungono mettendo tutto il peso su $\mathbf{e}_1$ ($c_1=1$) o su $\mathbf{e}_n$ ($c_n=1$).`,
      },
      {
        latex: md`\lambda_i=var\{\mathbf{e}_i^{t}\mathbf{x}\}\ \Rightarrow\ \sqrt{\lambda_i}=\text{deviazione standard lungo }\mathbf{e}_i\ \Rightarrow\ r\sqrt{\lambda_1}\ge\dots\ge r\sqrt{\lambda_n}`,
        why: md`Collegamento con la forma della campana: l'isolivello a distanza di Mahalanobis $r$ ha semiasse $r\sqrt{\lambda_i}$ lungo $\mathbf{e}_i$ ([«perché gli isolivelli sono ellissi con assi lungo gli autovettori»](#derivation:der07)). L'asse più lungo è quindi proprio la direzione di massima varianza: è per questo che le slide 28-29 chiamano asse principale quello del primo autovettore, e le note dicono che autovalori più grandi danno assi più lunghi (p. 24).`,
      },
    ],
    conclusion: md`La varianza dei dati proiettati su una direzione unitaria $\mathbf{a}$ è $\mathbf{a}^{t}\Sigma\,\mathbf{a}$: è massima, e vale $\lambda_1$, lungo il primo autovettore $\mathbf{e}_1$ (asse principale dell'ellisse), minima, e vale $\lambda_n$, lungo l'ultimo $\mathbf{e}_n$ (asse più piccolo). La stessa idea, applicata a $\hat{\Sigma}$ stimata dai dati, è il primo passo dell'analisi delle componenti principali (*Principal Component Analysis*, PCA).`,
    source: [{ doc: 'ch2', page: 28 }, { doc: 'ch2', page: 29 }, { doc: 'part1', page: 24 }, { doc: 'part1', page: 25 }],
  },

  // --- der18 Indipendenza e covarianza nulla ------------------------------------------------------------------
  {
    id: 'der18',
    title: 'Feature indipendenti ⟹ covarianze nulle; il viceversa solo per la gaussiana',
    goal: md`Giustificare la prima parte della slide 27, feature indipendenti (*independent features*) $\Rightarrow$ $\Sigma$ diagonale, che vale per qualunque distribuzione, e chiarire quando vale l'implicazione inversa (integrazione: la seconda parte della freccia, $\Sigma$ diagonale $\Rightarrow$ fattorizzazione della gaussiana, è la dimostrazione [«con Σ diagonale la gaussiana multivariata si fattorizza»](#derivation:der06)).`,
    assumptions: md`Feature $x_i$, $x_j$ con medie $m_i$, $m_j$ e varianze finite. Nei primi passi la pdf congiunta è qualunque; negli ultimi due il vettore $\mathbf{x}$ è gaussiano nel suo insieme (congiuntamente gaussiano, *jointly Gaussian*).`,
    steps: [
      {
        latex: md`x_i,\ x_j\ \text{indipendenti}\ \Rightarrow\ p(x_i,x_j)=p(x_i)\,p(x_j)`,
        why: md`Definizione di indipendenza (*independence*): la pdf congiunta si fattorizza nel prodotto delle marginali.`,
      },
      {
        latex: md`\sigma_{ij}=\iint(x_i-m_i)(x_j-m_j)\,p(x_i,x_j)\,dx_i\,dx_j`,
        why: md`La covarianza tra le feature $i$ e $j$ è l'elemento fuori diagonale $[\Sigma]_{ij}$ (slide 27). La funzione da mediare dipende solo da $x_i$ e $x_j$, quindi basta la loro pdf congiunta (la marginale di $p(\mathbf{x})$ sulla coppia).`,
      },
      {
        latex: md`\sigma_{ij}=E\{(x_i-m_i)(x_j-m_j)\}=\iint(x_i-m_i)(x_j-m_j)\,p(x_i)\,p(x_j)\,dx_i\,dx_j`,
        why: md`Si sostituisce la fattorizzazione del primo passo.`,
      },
      {
        latex: md`=\int(x_i-m_i)\,p(x_i)\,dx_i\cdot\int(x_j-m_j)\,p(x_j)\,dx_j=(m_i-m_i)(m_j-m_j)=0`,
        why: md`L'integrale doppio di un prodotto di funzioni di variabili separate è il prodotto dei due integrali. Ciascuno è la media dello scarto: $\int x_i\,p(x_i)\,dx_i-m_i\int p(x_i)\,dx_i=m_i-m_i\cdot 1=0$.`,
      },
      {
        latex: md`\Sigma=diag(\sigma_1^{2},\dots,\sigma_n^{2})`,
        why: md`Se le feature sono indipendenti a due a due, tutti gli elementi fuori diagonale sono nulli e sulla diagonale restano le varianze $\sigma_i^{2}$: è la matrice della slide 27. Questa direzione vale per qualunque distribuzione, gaussiana o no.`,
      },
      {
        latex: md`x\sim N(0,1),\ y=x^{2}:\quad \sigma_{xy}=E\{x^{3}\}-E\{x\}\,E\{x^{2}\}=0-0\cdot1=0,\ \text{ma}\ y\ \text{è funzione di}\ x`,
        why: md`Il viceversa in generale è falso. Qui $y$ è completamente determinata da $x$, eppure la covarianza è nulla: $E\{x^{3}\}=0$ perché $x^{3}$ per la pdf gaussiana standard è una funzione dispari (i momenti dispari della gaussiana a media nulla sono zero), ed $E\{x\}=0$. La covarianza misura solo la dipendenza **lineare**; tra $x$ e $x^{2}$ la dipendenza è quadratica e simmetrica, e i contributi positivi e negativi si compensano.`,
      },
      {
        latex: md`P\{y\le1\mid |x|\le1\}=1\ne P\{y\le1\}=P\{|x|\le1\}\approx0.683`,
        why: md`La dipendenza in numeri: sapere che $\vert x\vert\le 1$ rende certo $y\le 1$, mentre senza informazione la probabilità è circa 0.683 (la probabilità che una gaussiana standard cada entro una deviazione standard). Le due variabili non sono indipendenti.`,
      },
      {
        latex: md`\mathbf{x}\sim N(\mathbf{m},\Sigma),\ \Sigma\ \text{diagonale}\ \Rightarrow\ p(\mathbf{x})=\prod_{i=1}^{n}p(x_i)`,
        why: md`Per un vettore congiuntamente gaussiano invece covarianza nulla basta: con $\Sigma$ diagonale la pdf si fattorizza nel prodotto delle gaussiane univariate ([«con Σ diagonale la gaussiana multivariata si fattorizza»](#derivation:der06)). Per questo la freccia della slide 27 si può leggere nei due sensi solo nel modello gaussiano. Serve che il vettore sia gaussiano nel suo insieme: non basta che ogni feature, da sola, abbia una pdf gaussiana.`,
      },
      {
        latex: md`\sigma_{13}=\sigma_{31}=0:\quad (x_1,x_3)\sim N\left(\begin{bmatrix}m_1\\m_3\end{bmatrix},\begin{bmatrix}\sigma_1^{2}&0\\0&\sigma_3^{2}\end{bmatrix}\right)\ \Rightarrow\ p(x_1,x_3)=p(x_1)\,p(x_3)`,
        why: md`L'esempio 3-D della slide 30 (nota: le feature $x_1$ e $x_3$ sono indipendenti). La marginale di un vettore gaussiano su un sottoinsieme di feature è ancora gaussiana, con il sotto-vettore di $\mathbf{m}$ e il blocco corrispondente di $\Sigma$ (risultato noto, integrazione). Con $\sigma_{13}=0$ il blocco $2\times 2$ è diagonale e la coppia si fattorizza, anche se $x_2$ resta correlata con le altre due. Si guarda il blocco di $\Sigma$, non l'elemento di $\Sigma^{-1}$, che in generale non è nullo.`,
      },
    ],
    conclusion: md`Indipendenza $\Rightarrow$ covarianza nulla vale sempre; covarianza nulla $\Rightarrow$ indipendenza vale per feature congiuntamente gaussiane ma non in generale (controesempio $y=x^{2}$). Nel modello gaussiano, quindi, $\Sigma$ diagonale e feature indipendenti sono la stessa cosa, e l'indipendenza di $x_1$ e $x_3$ annotata nella slide 30 equivale alla sola condizione $\sigma_{13}=0$.`,
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }, { doc: 'ch2', page: 30 }, { doc: 'part1', page: 25 }],
  },

  // --- der19 Efficienza e consistenza delle stime ML gaussiane ----------------------------------------------------
  {
    id: 'der19',
    title: 'Bontà delle stime ML gaussiane: efficienza e consistenza',
    goal: md`Rendere esplicita per il modello gaussiano la frase della slide 31, le stime sono asintoticamente non distorte ed efficienti, e consistenti (*asymptotically unbiased and efficient, and consistent*). La fonte la enuncia senza dimostrazione; è collegata alla domanda d'esame «Is Maximum Likelihood Estimation a good estimator?».`,
    assumptions: md`Campioni iid da una gaussiana $N(\mathbf{m},\Sigma)$ con $\Sigma$ definita positiva; stime ML della slide 31. Definizioni delle note (p. 19): bound di Cramér-Rao (*Cramér-Rao bound*) $var\{\varepsilon_i\}\ge[I^{-1}(\boldsymbol{\theta})]_{ii}$ con l'informazione di Fisher (*Fisher information*) $I(\boldsymbol{\theta})$, efficienza asintotica, consistenza $\lim_{N\to+\infty}P\{\|\boldsymbol{\varepsilon}\|<\delta\}=1$.`,
    steps: [
      {
        latex: md`E\{\hat{\mathbf{m}}\}=\mathbf{m},\qquad Cov\{\hat{\mathbf{m}}\}=\frac{1}{N}\Sigma`,
        why: md`Risultati delle dimostrazioni [«la media campionaria è non distorta»](#derivation:der11) e [«bias della covarianza ML»](#derivation:der12): la media campionaria è non distorta per ogni $N$ e la sua covarianza decresce come $\frac{1}{N}$.`,
      },
      {
        latex: md`\ln p(X|\mathbf{m},\Sigma)=\sum_{k=1}^{N}\ln p(\mathbf{x}_k|\mathbf{m},\Sigma)=-\frac{N}{2}\ln\left[(2\pi)^{n}|\Sigma|\right]-\frac{1}{2}\sum_{k=1}^{N}(\mathbf{x}_k-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}_k-\mathbf{m})`,
        why: md`Log-verosimiglianza (*log-likelihood*) dei campioni iid: il logaritmo del prodotto delle pdf è la somma dei logaritmi. Il logaritmo della costante della slide 26 è $-\frac{n}{2}\ln 2\pi-\frac{1}{2}\ln|\Sigma|=-\frac{1}{2}\ln\left[(2\pi)^{n}|\Sigma|\right]$, e compare $N$ volte.`,
      },
      {
        latex: md`\nabla_{\mathbf{m}}\ln p(X|\mathbf{m},\Sigma)=\Sigma^{-1}\sum_{k=1}^{N}(\mathbf{x}_k-\mathbf{m})\ \Rightarrow\ \nabla_{\mathbf{m}}\nabla_{\mathbf{m}}^{t}\ln p(X|\mathbf{m},\Sigma)=-N\,\Sigma^{-1}`,
        why: md`Gradiente della log-verosimiglianza, lo stesso della dimostrazione [«stima ML di m e Σ nel caso multivariato»](#derivation:der09): la derivata di $-\frac{1}{2}(\mathbf{x}_k-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}_k-\mathbf{m})$ rispetto a $\mathbf{m}$ è $\Sigma^{-1}(\mathbf{x}_k-\mathbf{m})$ ($\Sigma^{-1}$ è simmetrica). Derivando ancora rispetto a $\mathbf{m}$ ogni addendo dà $-\Sigma^{-1}$, e gli addendi sono $N$. L'hessiana non dipende dai dati.`,
      },
      {
        latex: md`I(\mathbf{m})=E\left\{\nabla_{\mathbf{m}}\ln p\,[\nabla_{\mathbf{m}}\ln p]^{t}\right\}=\Sigma^{-1}\left[\sum_{k=1}^{N}\sum_{l=1}^{N}E\{(\mathbf{x}_k-\mathbf{m})(\mathbf{x}_l-\mathbf{m})^{t}\}\right]\Sigma^{-1}=\Sigma^{-1}(N\Sigma)\Sigma^{-1}=N\,\Sigma^{-1}`,
        why: md`Informazione di Fisher con la definizione delle note (p. 19), valore atteso del prodotto esterno del gradiente con se stesso. Il gradiente trasposto è $\sum_l(\mathbf{x}_l-\mathbf{m})^{t}\Sigma^{-1}$; nella doppia somma, come per la covarianza di $\hat{\mathbf{m}}$, i termini con $k\ne l$ sono nulli per l'indipendenza e restano $N$ termini uguali a $\Sigma$.`,
      },
      {
        latex: md`I(\mathbf{m})=-E\left\{\nabla_{\mathbf{m}}\nabla_{\mathbf{m}}^{t}\ln p(X|\mathbf{m},\Sigma)\right\}=N\,\Sigma^{-1}\ \Rightarrow\ I^{-1}(\mathbf{m})=\frac{1}{N}\Sigma=Cov\{\hat{\mathbf{m}}\}`,
        why: md`La forma equivalente con l'hessiana dà lo stesso risultato. Il bound di Cramér-Rao per stimatori non distorti è l'inversa dell'informazione di Fisher e coincide con la covarianza di $\hat{\mathbf{m}}$: la media campionaria è efficiente (*efficient*) per ogni $N$, non solo asintoticamente. È il caso previsto dalle note (p. 20): se esiste uno stimatore efficiente e la stima ML è non distorta, la stima ML è quella efficiente. Il bound vale anche con $\Sigma$ incognita, perché la derivata mista rispetto a $\mathbf{m}$ e $\Sigma$ è lineare in $\mathbf{x}_k-\mathbf{m}$ e ha media nulla: i due blocchi dell'informazione di Fisher non si mescolano.`,
      },
      {
        latex: md`var\{\hat{m}_i\}=\frac{\sigma_i^{2}}{N}=\left[I^{-1}(\mathbf{m})\right]_{ii},\quad i=1,\dots,n`,
        why: md`La stessa conclusione nella forma componente per componente delle note, $var\{\varepsilon_i\}\ge[I^{-1}(\boldsymbol{\theta})]_{ii}$: per ogni componente della media la varianza raggiunge il bound con l'uguaglianza.`,
      },
      {
        latex: md`P\{|\hat{m}_i-m_i|\ge\delta\}\le\frac{var\{\hat{m}_i\}}{\delta^{2}}=\frac{\sigma_i^{2}}{N\delta^{2}}\ \xrightarrow[N\to+\infty]{}\ 0\quad\forall\delta>0`,
        why: md`Disuguaglianza di Chebyshev (*Chebyshev's inequality*) su ogni componente, possibile perché $E\{\hat{m}_i\}=m_i$. Uno stimatore non distorto (almeno asintoticamente) con varianza che tende a zero è consistente: è la condizione per la consistenza della slide 16 del capitolo 2 e delle note (p. 19). La fonte la chiama necessaria; il conto con Chebyshev mostra che è anche sufficiente, ed è questo il verso usato qui.`,
      },
      {
        latex: md`P\{\|\hat{\mathbf{m}}-\mathbf{m}\|\ge\delta\}\le\frac{E\{\|\hat{\mathbf{m}}-\mathbf{m}\|^{2}\}}{\delta^{2}}=\frac{\mathrm{tr}(\Sigma)}{N\delta^{2}}\ \Rightarrow\ \lim_{N\to+\infty}P\{\|\hat{\mathbf{m}}-\mathbf{m}\|<\delta\}=1`,
        why: md`La stessa cosa con la norma dell'errore, come nella definizione di consistenza delle note: $E\{\|\hat{\mathbf{m}}-\mathbf{m}\|^{2}\}$ è la somma delle varianze delle componenti, cioè la traccia (*trace*) di $Cov\{\hat{\mathbf{m}}\}=\frac{1}{N}\Sigma$; la disuguaglianza di Markov applicata a $\|\hat{\mathbf{m}}-\mathbf{m}\|^{2}$ fa il resto. La media campionaria è consistente.`,
      },
      {
        latex: md`n=1:\quad \frac{N\hat{\sigma}^{2}}{\sigma^{2}}=\frac{1}{\sigma^{2}}\sum_{k=1}^{N}(x_k-\hat{m})^{2}\sim\chi^{2}_{N-1}\ \Rightarrow\ E\{\hat{\sigma}^{2}\}=\frac{N-1}{N}\sigma^{2},\quad var\{\hat{\sigma}^{2}\}=\frac{2(N-1)}{N^{2}}\sigma^{4}`,
        why: md`Per la varianza ML nel caso 1-D con dati gaussiani (risultato noto, integrazione): la somma dei quadrati degli scarti dalla media stimata, divisa per $\sigma^{2}$, è un chi-quadro con $N-1$ gradi di libertà ([pdf chi-quadro](#formula:f-c17)). Il chi-quadro con $k$ gradi di libertà ha media $k$ e varianza $2k$; dividendo per $\frac{N}{\sigma^{2}}$ la media si scala di $\frac{\sigma^{2}}{N}$ e la varianza di $\frac{\sigma^{4}}{N^{2}}$. Il valore atteso ritrova il fattore di bias $\frac{N-1}{N}$ della dimostrazione [«bias della covarianza ML»](#derivation:der12); un grado di libertà si perde perché gli scarti da $\hat{m}$ sommano a zero.`,
      },
      {
        latex: md`E\{(\hat{\sigma}^{2}-\sigma^{2})^{2}\}=var\{\hat{\sigma}^{2}\}+\left(E\{\hat{\sigma}^{2}\}-\sigma^{2}\right)^{2}=\frac{2(N-1)}{N^{2}}\sigma^{4}+\frac{\sigma^{4}}{N^{2}}=\frac{2N-1}{N^{2}}\sigma^{4}\ \xrightarrow[N\to+\infty]{}\ 0`,
        why: md`Errore quadratico medio (*mean squared error*) = varianza + bias al quadrato, con bias $-\frac{\sigma^{2}}{N}$. Tende a zero: il bias sparisce (stima asintoticamente non distorta) e la varianza sparisce; con la disuguaglianza di Markov $P\{\vert\hat{\sigma}^{2}-\sigma^{2}\vert\ge\delta\}\le\frac{2N-1}{N^{2}}\frac{\sigma^{4}}{\delta^{2}}\to 0$, quindi $\hat{\sigma}^{2}$ è consistente pur essendo distorta.`,
      },
      {
        latex: md`\frac{\partial^{2}\ln p(X|m,\sigma^{2})}{\partial(\sigma^{2})^{2}}=\frac{N}{2\sigma^{4}}-\frac{1}{\sigma^{6}}\sum_{k=1}^{N}(x_k-m)^{2}\ \Rightarrow\ I(\sigma^{2})=-\frac{N}{2\sigma^{4}}+\frac{N\sigma^{2}}{\sigma^{6}}=\frac{N}{2\sigma^{4}}`,
        why: md`Bound di Cramér-Rao per $\sigma^{2}$. Con $\ln p=-\frac{N}{2}\ln(2\pi\sigma^{2})-\frac{1}{2\sigma^{2}}\sum_k(x_k-m)^{2}$, la derivata prima rispetto a $\sigma^{2}$ è $-\frac{N}{2\sigma^{2}}+\frac{1}{2\sigma^{4}}\sum_k(x_k-m)^{2}$ e la seconda è quella scritta. Poiché $E\{(x_k-m)^{2}\}=\sigma^{2}$, l'informazione di Fisher vale $\frac{N}{2\sigma^{4}}$ e il bound è $\frac{2\sigma^{4}}{N}$.`,
      },
      {
        latex: md`\frac{var\{\hat{\sigma}^{2}\}}{2\sigma^{4}/N}=\frac{N-1}{N}\ \xrightarrow[N\to+\infty]{}\ 1,\qquad var\{s^{2}\}=\frac{2\sigma^{4}}{N-1}>\frac{2\sigma^{4}}{N}`,
        why: md`Il rapporto tra la varianza della stima e il bound tende a 1: è la definizione di efficienza asintotica delle note (p. 19), come dice la slide. Per $N$ finito il rapporto è minore di 1 solo perché $\hat{\sigma}^{2}$ è distorta, mentre il bound riguarda gli stimatori non distorti. La [varianza campionaria corretta](#formula:f-c70-2) $s^{2}=\frac{N}{N-1}\hat{\sigma}^{2}$ è non distorta ma ha varianza $\frac{N^{2}}{(N-1)^{2}}\cdot\frac{2(N-1)}{N^{2}}\sigma^{4}=\frac{2\sigma^{4}}{N-1}$, leggermente sopra il bound.`,
      },
    ],
    conclusion: md`Nel modello gaussiano la media ML è non distorta ed efficiente per ogni $N$ ($Cov\{\hat{\mathbf{m}}\}=I^{-1}=\frac{1}{N}\Sigma$) e consistente. La varianza ML è distorta per $N$ finito ma asintoticamente non distorta, asintoticamente efficiente (rapporto con il bound $\frac{N-1}{N}\to 1$) e consistente. Per la covarianza multivariata $\hat{\Sigma}$ valgono le stesse proprietà asintotiche (qui dimostrate solo nel caso 1-D). Ecco perché la risposta a «la stima ML è un buon stimatore?» è sì, in senso asintotico.`,
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }, { doc: 'part1', page: 19 }, { doc: 'part1', page: 20 }, { doc: 'ch2', page: 16 }],
  },
]
