// Derivazioni del foglio m06 (modelli di pdf e modello gaussiano): der01-der10 dell'inventario.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più servono a seguire i conti
// che la fonte salta e sono ricalcolati a mano (controllo sulle immagini di ch2 p22-31 e part1 p21-26).
// La fonte non contiene dimostrazioni: le slide danno solo i risultati (p31: «It can be shown») e le note part1
// p21-26 li ripetono a parole senza passaggi. Tutte e dieci le derivazioni sono quindi integrazioni dichiarate che
// portano ai risultati enunciati dalla fonte.
// Le derivazioni der11-der19 stanno in derivations-b.ts.
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivationsA: Derivation[] = [
  // --- der01 Dalla gaussiana multivariata alla univariata ----------------------------------------------------------
  {
    id: 'der01',
    title: 'Dalla gaussiana multivariata alla univariata (n = 1)',
    goal: md`Mostrare che la pdf gaussiana multivariata (*multivariate Gaussian pdf*) della slide p26, con $n = 1$, restituisce esattamente la gaussiana univariata $f(x;\mu,\sigma)$ della slide p22. È un'integrazione didattica: la fonte dà le due formule in due slide diverse e con due notazioni diverse ($\mu, \sigma$ nella p22, $\mathbf{m}, \Sigma$ nella p26), senza collegarle.`,
    assumptions: md`Una sola feature: $\mathbf{x} = x \in \Re$, con media $\mu$ e varianza $\sigma^2 > 0$. La formula multivariata richiede $\Sigma$ invertibile, cioè $\vert\Sigma\vert > 0$: in una dimensione vuol dire proprio $\sigma^2 > 0$. Si prende $\sigma > 0$ (la deviazione standard è la radice positiva della varianza).`,
    steps: [
      {
        latex: md`p(\mathbf{x}|\mathbf{m},\Sigma)=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]`,
        why: md`Si parte dalla formula generale della slide p26, dove $\boldsymbol{\theta} = (\mathbf{m}, \Sigma)$ e la pdf si indica con $N(\mathbf{m}, \Sigma)$: $\mathbf{x}$ è il vettore delle feature a $n$ componenti, $\mathbf{m}$ il vettore media (*mean vector*), $\Sigma$ la matrice di covarianza (*covariance matrix*) e $\vert\Sigma\vert$ il suo determinante (note p23).`,
      },
      {
        latex: md`n=1:\quad \mathbf{x}\to x,\quad \mathbf{m}\to\mu,\quad \Sigma\to\sigma^{2},\quad |\Sigma|^{1/2}=\sigma,\quad \Sigma^{-1}=\frac{1}{\sigma^{2}}`,
        why: md`In una dimensione il vettore è uno scalare e la matrice di covarianza è una matrice $1\times 1$ che contiene solo la varianza $\sigma^2 = E\{(x-\mu)^2\}$. Il determinante di una matrice $1\times 1$ è il suo unico elemento, quindi $\vert\Sigma\vert = \sigma^2$ e $\vert\Sigma\vert^{1/2} = \sqrt{\sigma^2} = \sigma$ (radice positiva, perché $\sigma > 0$). L'inversa di un numero non nullo è il suo reciproco.`,
      },
      {
        latex: md`(2\pi)^{n/2}|\Sigma|^{1/2}\Big|_{n=1}=(2\pi)^{1/2}\,\sigma=\sigma\sqrt{2\pi}`,
        why: md`La costante di normalizzazione: con $n = 1$ l'esponente di $2\pi$ è $1/2$, cioè una radice quadrata.`,
      },
      {
        latex: md`(\mathbf{x}-\mathbf{m})^{t}\ \to\ (x-\mu)^{t}=x-\mu`,
        why: md`Il trasposto di uno scalare è lo scalare stesso: in una dimensione la trasposizione non ha effetto e il prodotto «riga per matrice per colonna» diventa un prodotto di tre numeri.`,
      },
      {
        latex: md`(x-\mu)\,\frac{1}{\sigma^{2}}\,(x-\mu)=\frac{(x-\mu)^{2}}{\sigma^{2}}`,
        why: md`La forma quadratica all'esponente, che le note p23 chiamano distanza di Mahalanobis (*Mahalanobis distance*; a rigore è il suo quadrato), diventa lo scarto al quadrato diviso la varianza: in 1-D è lo scarto dalla media misurato in deviazioni standard, al quadrato. Per esempio con $\mu = 0$ e $\sigma = 2$ il punto $x = 3$ dista $1.5$ deviazioni standard e la forma vale $1.5^2 = 2.25$.`,
      },
      {
        latex: md`-\frac{1}{2}\cdot\frac{(x-\mu)^{2}}{\sigma^{2}}=-\frac{(x-\mu)^{2}}{2\sigma^{2}}`,
        why: md`Il fattore $-\frac{1}{2}$ davanti alla forma quadratica si porta al denominatore: è l'esponente della gaussiana 1-D.`,
      },
      {
        latex: md`p(x)=\frac{1}{(2\pi)^{1/2}\sigma}\exp\left[-\frac{(x-\mu)^{2}}{2\sigma^{2}}\right]=\frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac{(x-\mu)^{2}}{2\sigma^{2}}}`,
        why: md`Sostituendo costante ed esponente si ritrova lettera per lettera la formula $f(x;\mu,\sigma)$ della slide p22: la gaussiana 1-D è il caso particolare $n = 1$ della multivariata.`,
      },
      {
        latex: md`p(\mu)=\frac{1}{\sigma\sqrt{2\pi}}:\quad \sigma^{2}=0.2\to0.892,\quad \sigma^{2}=0.5\to0.564,\quad \sigma^{2}=1\to0.399,\quad \sigma^{2}=5\to0.178`,
        why: md`Controllo sul grafico della slide p22. In $x = \mu$ l'esponenziale vale $e^0 = 1$ e resta solo la costante, che è quindi l'altezza del picco. Con le varianze della legenda si ottengono le altezze delle quattro curve: rossa circa $0.89$, magenta circa $0.56$ (centrata in $\mu = -2$), verde circa $0.40$, blu circa $0.18$. Varianza più grande, campana più larga e più bassa: l'area resta 1.`,
      },
    ],
    conclusion: md`La gaussiana univariata è la multivariata con $n = 1$: $\Sigma$ diventa $\sigma^2$, il determinante diventa la varianza, la distanza di Mahalanobis diventa lo scarto standardizzato al quadrato. Letta al contrario, la multivariata generalizza la 1-D sostituendo il quadrato dello scarto con una forma quadratica e la varianza con una matrice. Tutto ciò che vale per la multivariata (normalizzazione, isolivelli, stime ML) si specializza alla 1-D mettendo $\sigma^2$ al posto di $\Sigma$. Si può giocare con $\mu$ e $\sigma^2$ nel [widget della campana](#widget:m06-gaussiana-mu-sigma).`,
    source: [{ doc: 'ch2', page: 26 }, { doc: 'ch2', page: 22 }, { doc: 'part1', page: 23 }],
  },

  // --- der02 Gaussiana generalizzata: beta = 2 e beta = 1 ----------------------------------------------------------
  {
    id: 'der02',
    title: 'Casi particolari della gaussiana generalizzata: β = 2 e β = 1',
    goal: md`Verificare dalla formula della slide p22 che il parametro di forma (*shape parameter*) $\beta = 2$ dà la gaussiana e $\beta = 1$ la laplaciana (*Laplacian*), e che le quattro curve del grafico ($\beta = 0.8, 1, 2, 10$) hanno centro $m = 0$ e varianza unitaria. È un'integrazione didattica: la slide mostra solo le curve etichettate, senza dire quanto valgono $m$ e $b$.`,
    assumptions: md`$m \in \Re$ è il centro di simmetria, $b > 0$ un parametro di scala inversa ($b$ grande, curva stretta), $\beta > 0$ il parametro di forma. $\Gamma$ è la funzione Gamma di Eulero, $\Gamma(z) = \int_0^{+\infty} t^{z-1}e^{-t}\,dt$, con $\Gamma(1) = 1$, $\Gamma(1/2) = \sqrt{\pi}$ e $\Gamma(z+1) = z\,\Gamma(z)$.`,
    steps: [
      {
        latex: md`f(x;m,b,\beta)=\frac{b\beta}{2\Gamma(1/\beta)}\,e^{-\left[b|x-m|\right]^{\beta}}`,
        why: md`Formula della slide p22. La pdf dipende da $x$ solo attraverso $\vert x - m\vert$: è simmetrica rispetto a $m$ ed è definita su tutto l'asse reale.`,
      },
      {
        latex: md`\int_{-\infty}^{+\infty}e^{-\left[b|x-m|\right]^{\beta}}dx=2\int_{0}^{+\infty}e^{-(bu)^{\beta}}du=\frac{2}{b\beta}\int_{0}^{+\infty}t^{1/\beta-1}e^{-t}\,dt=\frac{2\,\Gamma(1/\beta)}{b\beta}`,
        why: md`Da dove viene la costante. Per simmetria si integra sulla metà destra, $u = x - m \ge 0$, e si raddoppia. Con la sostituzione $t = (bu)^{\beta}$, cioè $u = t^{1/\beta}/b$ e $du = \frac{1}{b\beta}\,t^{1/\beta-1}\,dt$, resta la definizione di $\Gamma(1/\beta)$. Il reciproco del risultato è proprio $\frac{b\beta}{2\Gamma(1/\beta)}$: la curva ha area 1 per ogni $b$ e ogni $\beta$.`,
      },
      {
        latex: md`\beta=2,\ \Gamma(1/2)=\sqrt{\pi}\ \Rightarrow\ f=\frac{2b}{2\sqrt{\pi}}\,e^{-b^{2}(x-m)^{2}}=\frac{b}{\sqrt{\pi}}\,e^{-b^{2}(x-m)^{2}}`,
        why: md`Con $\beta = 2$ il modulo al quadrato diventa un quadrato ordinario, $\left[b\vert x-m\vert\right]^2 = b^2(x-m)^2$, e $\Gamma(1/2) = \sqrt{\pi}$.`,
      },
      {
        latex: md`b^{2}=\frac{1}{2\sigma^{2}}\ \Rightarrow\ b=\frac{1}{\sigma\sqrt{2}}\ \Rightarrow\ f=\frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac{(x-m)^{2}}{2\sigma^{2}}}`,
        why: md`Si confronta l'esponente con quello della gaussiana: $b^2(x-m)^2 = \frac{(x-m)^2}{2\sigma^2}$ identifica $b$ in funzione di $\sigma$. Allora la costante diventa $\frac{b}{\sqrt{\pi}} = \frac{1}{\sigma\sqrt{2}\sqrt{\pi}} = \frac{1}{\sigma\sqrt{2\pi}}$, quella della gaussiana: coincidenza esatta, con $m$ al posto di $\mu$. La gaussiana è un membro della famiglia, da cui il nome «generalizzata».`,
      },
      {
        latex: md`\beta=1,\ \Gamma(1)=1\ \Rightarrow\ f=\frac{b}{2}\,e^{-b|x-m|}`,
        why: md`Con $\beta = 1$ resta l'esponenziale del modulo: è la laplaciana, o doppia esponenziale. Il modulo non è derivabile in $x = m$, e infatti la curva $\beta = 1$ del grafico ha una cuspide nel centro.`,
      },
      {
        latex: md`var\{x\}=2\,\frac{b\beta}{2\Gamma(1/\beta)}\int_{0}^{+\infty}u^{2}e^{-(bu)^{\beta}}du=\frac{b\beta}{\Gamma(1/\beta)}\cdot\frac{\Gamma(3/\beta)}{b^{3}\beta}`,
        why: md`Per simmetria la media è $m$, quindi la varianza è il momento secondo di $u = x - m$, calcolato come sopra su metà asse e raddoppiato. Con la stessa sostituzione $t = (bu)^\beta$ si ha $u^2\,du = \frac{1}{b^3\beta}\,t^{3/\beta-1}\,dt$, e l'integrale vale $\frac{\Gamma(3/\beta)}{b^3\beta}$.`,
      },
      {
        latex: md`var\{x\}=\frac{\Gamma(3/\beta)}{b^{2}\,\Gamma(1/\beta)}=1\ \Rightarrow\ b=\sqrt{\frac{\Gamma(3/\beta)}{\Gamma(1/\beta)}}`,
        why: md`Semplificando $b\beta$ si ottiene la varianza della famiglia, che dipende da $b$ e da $\beta$. Imponendo varianza 1 si ricava il valore di $b$ per ogni $\beta$. Controllo con $\beta = 2$: $\Gamma(3/2)/\Gamma(1/2) = 1/2$, quindi $var\{x\} = \frac{1}{2b^2} = \sigma^2$, la stessa relazione del passo sulla gaussiana. Con $\beta = 1$: $var\{x\} = \Gamma(3)/b^2 = 2/b^2$.`,
      },
      {
        latex: md`\beta=0.8\to b\approx2.209,\quad \beta=1\to b=\sqrt{2}\approx1.414,\quad \beta=2\to b=\tfrac{1}{\sqrt{2}}\approx0.707,\quad \beta=10\to b\approx0.561`,
        why: md`Valori numerici della formula precedente, con $\Gamma(1.25) \approx 0.9064$ e $\Gamma(3.75) \approx 4.4230$ per $\beta = 0.8$, $\Gamma(3) = 2$ e $\Gamma(1) = 1$ per $\beta = 1$, $\Gamma(0.1) \approx 9.5135$ e $\Gamma(0.3) \approx 2.9916$ per $\beta = 10$.`,
      },
      {
        latex: md`f(m)=\frac{b\beta}{2\Gamma(1/\beta)}:\quad \beta=0.8\to0.975,\quad \beta=1\to0.707,\quad \beta=2\to0.399,\quad \beta=10\to0.295`,
        why: md`Con quei valori di $b$ l'altezza del picco ($x = m$, dove l'esponenziale vale 1) coincide con quella letta sul grafico per tutte e quattro le curve: circa $0.97$, $0.71$, $0.40$, $0.29$. Conferma che la slide usa $m = 0$ e varianza unitaria; la curva $\beta = 2$ è la gaussiana standard, con picco $1/\sqrt{2\pi}$.`,
      },
      {
        latex: md`\beta\to+\infty:\quad e^{-\left[b|x-m|\right]^{\beta}}\to\begin{cases}1, & |x-m|<1/b\\ 0, & |x-m|>1/b\end{cases}\qquad\Rightarrow\qquad f\to\frac{b}{2}\ \text{su}\ \left[m-\tfrac{1}{b},\,m+\tfrac{1}{b}\right]`,
        why: md`Il terzo caso particolare. Se $b\vert x-m\vert < 1$ la sua potenza $\beta$-esima tende a 0 e l'esponenziale a 1; se $b\vert x-m\vert > 1$ la potenza esplode e l'esponenziale va a 0. Poiché $\Gamma(1/\beta) \approx \beta$ per $\beta$ grande, la costante tende a $b/2$: la pdf diventa uniforme su un intervallo di ampiezza $2/b$. Con varianza unitaria $b \to 1/\sqrt{3}$, cioè uniforme su $[-\sqrt{3}, \sqrt{3}]$ con altezza $1/(2\sqrt{3}) \approx 0.289$. La curva $\beta = 10$ ci è già vicina ma non ancora al limite: quasi piatta a circa $0.29$ fino a $\vert x\vert \approx 1.3$, poi una caduta ripida; in $\pm 1/b \approx \pm 1.78$ vale già $e^{-1}$ del picco (circa $0.11$) e si annulla verso $\pm 2.1$. L'intervallo $[m-1/b,\ m+1/b]$ con i fianchi verticali vale solo nel limite $\beta \to +\infty$.`,
      },
    ],
    conclusion: md`Un solo parametro regola la forma: $\beta$ piccolo, punta acuta e code pesanti ($\beta = 0.8$, picco $0.97$); $\beta = 1$, laplaciana con cuspide; $\beta = 2$, gaussiana; $\beta$ grande, profilo quasi rettangolare. A parità di varianza, quindi, $\beta < 2$ modella dati più piccati della gaussiana e $\beta > 2$ dati più piatti. Si può far scorrere $\beta$ nel [widget sulla gaussiana generalizzata](#widget:m06-gaussiana-generalizzata-beta).`,
    source: [{ doc: 'ch2', page: 22 }, { doc: 'part1', page: 22 }],
  },

  // --- der03 Chi-quadro come Gamma -----------------------------------------------------------------------------------
  {
    id: 'der03',
    title: 'Il chi-quadro è una Gamma con forma k/2 e scala 2',
    goal: md`Collegare le formule della Gamma (slide p23) e del chi-quadro (*Chi-Square*, slide p24): mostrare che $f_{\chi^2}(x;k) = f_\Gamma\left(x;\tfrac{k}{2},\theta=2\right)$. È un'integrazione didattica: le due slide non si citano a vicenda.`,
    assumptions: md`$x > 0$. Il chi-quadro ha un solo parametro, i gradi di libertà (*degrees of freedom*) $k = 1, 2, 3, \dots$. La Gamma ha un parametro di forma e un parametro di scala $\theta > 0$: nella slide p23 la forma si chiama $k$, come i gradi di libertà, quindi qui la si rinomina $k'$ per non confondere le due cose.`,
    steps: [
      {
        latex: md`f_{\Gamma}(x;k',\theta)=x^{k'-1}\frac{e^{-x/\theta}}{\theta^{k'}\,\Gamma(k')}`,
        why: md`Formula della Gamma della slide p23 («for $x > 0$»), con il parametro di forma rinominato $k'$.`,
      },
      {
        latex: md`k'=\frac{k}{2},\ \theta=2\ \Rightarrow\ f_{\Gamma}=x^{k/2-1}\frac{e^{-x/2}}{2^{k/2}\,\Gamma(k/2)}`,
        why: md`Si sostituiscono forma $k/2$ e scala $2$: l'esponente di $x$ diventa $k/2 - 1$, l'esponenziale $e^{-x/2}$, la costante $2^{k/2}\,\Gamma(k/2)$.`,
      },
      {
        latex: md`\frac{1}{2^{k/2}}=(1/2)^{k/2}\ \Rightarrow\ f_{\Gamma}=\frac{(1/2)^{k/2}}{\Gamma(k/2)}\,x^{k/2-1}e^{-x/2}=f_{\chi^{2}}(x;k)`,
        why: md`Riscrivendo la costante si ottiene lettera per lettera la formula del chi-quadro della slide p24.`,
      },
      {
        latex: md`f_{\chi^{2}}(x;2)=\frac{1/2}{\Gamma(1)}\,x^{0}\,e^{-x/2}=\frac{1}{2}\,e^{-x/2}=f_{\Gamma}(x;1,2)`,
        why: md`Controllo sui grafici: il chi-quadro con $k = 2$ (curva blu della slide p24) e la Gamma con forma 1 e $\theta = 2$ (curva rossa della slide p23) sono la stessa esponenziale decrescente, che parte da $0.5$ in $x = 0$.`,
      },
      {
        latex: md`E\{x\}=k'\theta=k,\qquad var\{x\}=k'\theta^{2}=2k,\qquad \text{moda}=(k'-1)\theta=k-2\quad (k\ge2)`,
        why: md`Le proprietà della Gamma (media $k'\theta$, varianza $k'\theta^2$, moda $(k'-1)\theta$ per $k' \ge 1$) passano al chi-quadro. Al crescere di $k$ la massa si sposta a destra e la curva si allarga: nella slide p24 la moda è in $x = 1$ per $k = 3$, in $x = 2$ per $k = 4$, in $x = 3$ per $k = 5$. La stessa formula spiega la Gamma della slide p23: le curve con forma 2, 3, 5, 9 e scala 2, 2, 1, 0.5 hanno la moda in 2, 4, 4, 4.`,
      },
      {
        latex: md`z\sim N(0,1):\quad f_{z^{2}}(x)=\frac{d}{dx}P\{z^{2}\le x\}=\frac{d}{dx}\left[2\Phi(\sqrt{x})-1\right]=\frac{e^{-x/2}}{\sqrt{2\pi x}}=\frac{(1/2)^{1/2}}{\Gamma(1/2)}\,x^{-1/2}e^{-x/2}=f_{\chi^{2}}(x;1)`,
        why: md`Perché il chi-quadro sta vicino alla gaussiana (integrazione: la slide non lo dice). Se $z$ è gaussiana standard, $z^2 \le x$ equivale a $-\sqrt{x} \le z \le \sqrt{x}$, con probabilità $2\Phi(\sqrt{x}) - 1$ ($\Phi$ è la funzione di ripartizione, *cumulative distribution function* o CDF, della gaussiana standard). Derivando, con $\frac{d}{dx}\sqrt{x} = \frac{1}{2\sqrt{x}}$, si ottiene la pdf del quadrato: è il chi-quadro con $k = 1$, che diverge in $x = 0$ come la curva nera della slide p24. In generale il chi-quadro con $k$ gradi di libertà è la distribuzione della somma dei quadrati di $k$ gaussiane standard indipendenti.`,
      },
    ],
    conclusion: md`Il chi-quadro con $k$ gradi di libertà è una Gamma con forma $k/2$ e scala 2: $f_{\chi^2}(x;k) = f_\Gamma\left(x;\tfrac{k}{2},\theta=2\right)$. Per questo ne eredita supporto, asimmetria e proprietà (media $k$, varianza $2k$), e i grafici delle due slide si sovrappongono nel caso $k = 2$. Si può provare a sommare quadrati di gaussiane nel [widget sul chi-quadro](#widget:m06-chi-quadro-somma-quadrati).`,
    source: [{ doc: 'ch2', page: 23 }, { doc: 'ch2', page: 24 }, { doc: 'part1', page: 22 }],
  },

  // --- der04 Sigma = E{xx^t} - mm^t ---------------------------------------------------------------------------------
  {
    id: 'der04',
    title: 'Equivalenza Σ = E{(x − m)(x − m)ᵗ} = E{xxᵗ} − mmᵗ',
    goal: md`Dimostrare la seconda uguaglianza della definizione di matrice di covarianza della slide p27, ripresa nelle note p24: $\Sigma = E\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^t\} = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$. La fonte la scrive senza passaggi.`,
    assumptions: md`$\mathbf{x}$ è un vettore aleatorio in $\Re^n$ con momenti secondi finiti; $\mathbf{m} = E\{\mathbf{x}\}$ è un vettore deterministico, cioè una costante. Il valore atteso di una matrice aleatoria si calcola elemento per elemento, quindi è lineare e fa uscire le costanti, anche quando moltiplicano a destra o a sinistra.`,
    steps: [
      {
        latex: md`\Sigma=E\left\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\right\}`,
        why: md`Definizione di matrice di covarianza, $\Sigma = Cov\{\mathbf{x}\}$ (slide p27): il valore atteso del prodotto esterno (*outer product*) dello scarto dalla media con se stesso. Un vettore colonna $n\times 1$ per un vettore riga $1\times n$ dà una matrice $n\times n$.`,
      },
      {
        latex: md`(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}=(\mathbf{x}-\mathbf{m})(\mathbf{x}^{t}-\mathbf{m}^{t})`,
        why: md`La trasposta di una differenza è la differenza delle trasposte.`,
      },
      {
        latex: md`=E\left\{\mathbf{x}\mathbf{x}^{t}-\mathbf{x}\mathbf{m}^{t}-\mathbf{m}\mathbf{x}^{t}+\mathbf{m}\mathbf{m}^{t}\right\}`,
        why: md`Si sviluppa il prodotto con la proprietà distributiva: quattro prodotti esterni. Attenzione: $\mathbf{x}\mathbf{m}^t$ e $\mathbf{m}\mathbf{x}^t$ non sono uguali, sono l'uno il trasposto dell'altro.`,
      },
      {
        latex: md`=E\{\mathbf{x}\mathbf{x}^{t}\}-E\{\mathbf{x}\}\mathbf{m}^{t}-\mathbf{m}E\{\mathbf{x}\}^{t}+\mathbf{m}\mathbf{m}^{t}`,
        why: md`Il valore atteso è lineare e $\mathbf{m}$ è deterministico, quindi esce dall'operatore: $E\{\mathbf{x}\mathbf{m}^t\} = E\{\mathbf{x}\}\mathbf{m}^t$, $E\{\mathbf{m}\mathbf{x}^t\} = \mathbf{m}\,E\{\mathbf{x}^t\} = \mathbf{m}\,E\{\mathbf{x}\}^t$, e il valore atteso di una costante è la costante.`,
      },
      {
        latex: md`=E\{\mathbf{x}\mathbf{x}^{t}\}-\mathbf{m}\mathbf{m}^{t}-\mathbf{m}\mathbf{m}^{t}+\mathbf{m}\mathbf{m}^{t}`,
        why: md`Si usa la definizione di vettore media, $\mathbf{m} = E\{\mathbf{x}\}$ (slide p27).`,
      },
      {
        latex: md`=E\{\mathbf{x}\mathbf{x}^{t}\}-\mathbf{m}\mathbf{m}^{t}`,
        why: md`Due dei tre termini uguali si cancellano: resta il momento del secondo ordine $E\{\mathbf{x}\mathbf{x}^t\}$ meno il prodotto esterno della media con se stessa.`,
      },
      {
        latex: md`[\Sigma]_{ij}=E\{x_ix_j\}-m_im_j,\qquad [\Sigma]_{ii}=\sigma_i^{2}=E\{x_i^{2}\}-m_i^{2}`,
        why: md`Letta elemento per elemento, perché $[\mathbf{x}\mathbf{x}^t]_{ij} = x_i x_j$. Fuori dalla diagonale è la covarianza tra due feature, $E\{x_ix_j\} - m_im_j$; sulla diagonale è la formula scalare della varianza, «media dei quadrati meno quadrato della media». Le note p24: $\Sigma$ contiene la varianza di ogni feature e la covarianza tra feature diverse.`,
      },
    ],
    conclusion: md`$\Sigma = E\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^t\} = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$: è la versione matriciale di $var\{x\} = E\{x^2\} - (E\{x\})^2$. Esempio: $\mathbf{x}$ vale $(0,0)$, $(2,0)$, $(0,2)$, $(2,2)$ con probabilità $1/4$ ciascuno. Allora $\mathbf{m} = (1,1)$, $E\{\mathbf{x}\mathbf{x}^t\} = \begin{bmatrix}2&1\\1&2\end{bmatrix}$ e $\mathbf{m}\mathbf{m}^t = \begin{bmatrix}1&1\\1&1\end{bmatrix}$, quindi $\Sigma = I$. Con la definizione si ottiene lo stesso: gli scarti $(\pm1, \pm1)$ danno prodotti esterni la cui media è $I$. La stessa cancellazione, con le medie campionarie al posto dei valori attesi, dà la [seconda forma della stima ML](#derivation:der10). Si può costruire $\Sigma$ un campione alla volta nel [widget sulla covarianza](#widget:m06-costruisci-la-covarianza).`,
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }],
  },

  // --- der05 Sigma simmetrica e semidefinita positiva ---------------------------------------------------------------
  {
    id: 'der05',
    title: 'Σ è simmetrica e semidefinita positiva; gli autovalori sono varianze',
    goal: md`Giustificare le due proprietà della matrice di covarianza che la slide p27 enuncia soltanto, la simmetria (*symmetric*, $\Sigma = \Sigma^t$) e la semidefinitezza positiva (*positive semidefinite*), e la conseguenza sugli autovalori della slide p29. È un'integrazione didattica.`,
    assumptions: md`Come nella [forma equivalente della covarianza](#derivation:der04): $\mathbf{x}$ aleatorio in $\Re^n$ con momenti secondi finiti, $\mathbf{m} = E\{\mathbf{x}\}$ costante. $\mathbf{a} \in \Re^n$ è un vettore deterministico qualsiasi. Per gli autovalori: $\mathbf{e}_i$ è un autovettore di lunghezza 1; che autovalori e autovettori di una matrice simmetrica siano reali è dimostrato in [«Autovalori reali e autovettori ortogonali di Σ»](#derivation:der16).`,
    steps: [
      {
        latex: md`\left(\mathbf{u}\mathbf{u}^{t}\right)^{t}=\left(\mathbf{u}^{t}\right)^{t}\mathbf{u}^{t}=\mathbf{u}\mathbf{u}^{t},\qquad \mathbf{u}=\mathbf{x}-\mathbf{m}`,
        why: md`La trasposta di un prodotto è il prodotto delle trasposte in ordine inverso, $(AB)^t = B^tA^t$, e trasporre due volte riporta al punto di partenza. Il prodotto esterno di un vettore con se stesso è quindi simmetrico per ogni realizzazione di $\mathbf{x}$.`,
      },
      {
        latex: md`\Sigma^{t}=\left(E\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\}\right)^{t}=E\left\{\left((\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\right)^{t}\right\}=E\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\}=\Sigma`,
        why: md`La trasposizione commuta con il valore atteso (sposta solo gli elementi, e il valore atteso si calcola elemento per elemento); dentro resta il prodotto esterno, che per il passo precedente è simmetrico.`,
      },
      {
        latex: md`[\Sigma]_{ij}=E\{(x_i-m_i)(x_j-m_j)\}=E\{(x_j-m_j)(x_i-m_i)\}=[\Sigma]_{ji}`,
        why: md`La stessa cosa vista elemento per elemento: il prodotto di due scalari è commutativo, quindi la covarianza tra $x_i$ e $x_j$ è la covarianza tra $x_j$ e $x_i$.`,
      },
      {
        latex: md`\mathbf{a}^{t}(\mathbf{x}-\mathbf{m})=(\mathbf{x}-\mathbf{m})^{t}\mathbf{a}=\sum_{i=1}^{n}a_i\,(x_i-m_i)`,
        why: md`È un numero (prodotto scalare), e uno scalare coincide con il suo trasposto: il suo quadrato si può scrivere come $\mathbf{a}^t(\mathbf{x}-\mathbf{m})\,(\mathbf{x}-\mathbf{m})^t\mathbf{a}$.`,
      },
      {
        latex: md`\mathbf{a}^{t}\Sigma\,\mathbf{a}=E\{\mathbf{a}^{t}(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\mathbf{a}\}=E\left\{\left(\mathbf{a}^{t}(\mathbf{x}-\mathbf{m})\right)^{2}\right\}\ge 0`,
        why: md`$\mathbf{a}$ è costante ed entra nel valore atteso; per il passo precedente il contenuto è un quadrato, e il valore atteso di una quantità mai negativa non è negativo. $\mathbf{a}^t\Sigma\mathbf{a} \ge 0$ per ogni $\mathbf{a}$ è la definizione di matrice semidefinita positiva.`,
      },
      {
        latex: md`y=\mathbf{a}^{t}\mathbf{x}\ \Rightarrow\ var\{y\}=\mathbf{a}^{t}\Sigma\,\mathbf{a}`,
        why: md`Significato del quadrato: $y = \mathbf{a}^t\mathbf{x}$ è la proiezione dei dati sulla direzione $\mathbf{a}$, con media $E\{y\} = \mathbf{a}^t\mathbf{m}$, e $\mathbf{a}^t(\mathbf{x}-\mathbf{m}) = y - E\{y\}$ è il suo scarto. La forma quadratica è quindi la varianza della proiezione: la semidefinitezza dice che nessuna direzione ha varianza negativa (note p24: «This ensures that the variance is always non-negative»). Con $\mathbf{a}$ uguale al versore dell'asse $i$ si ritrova $var\{x_i\} = [\Sigma]_{ii} \ge 0$.`,
      },
      {
        latex: md`\mathbf{a}^{t}\Sigma\,\mathbf{a}=0\iff \mathbf{a}^{t}(\mathbf{x}-\mathbf{m})=0\ \text{quasi certamente}`,
        why: md`Quando vale l'uguaglianza: il valore atteso di un quadrato è nullo solo se il quadrato è nullo quasi certamente, cioè se i dati stanno tutti sull'iperpiano $\mathbf{a}^t(\mathbf{x}-\mathbf{m}) = 0$ e lungo $\mathbf{a}$ non variano affatto. In quel caso $\Sigma$ è singolare, $\vert\Sigma\vert = 0$, e la gaussiana della slide p26 non è definita. Se invece $\mathbf{a}^t\Sigma\mathbf{a} > 0$ per ogni $\mathbf{a} \ne \mathbf{0}$, $\Sigma$ è definita positiva.`,
      },
      {
        latex: md`\Sigma\mathbf{e}_i=\lambda_i\mathbf{e}_i,\ \|\mathbf{e}_i\|=1\ \Rightarrow\ \lambda_i=\mathbf{e}_i^{t}\Sigma\,\mathbf{e}_i=var\{\mathbf{e}_i^{t}\mathbf{x}\}\ge 0`,
        why: md`Si sceglie come direzione un autovettore unitario: $\mathbf{e}_i^t\Sigma\mathbf{e}_i = \mathbf{e}_i^t(\lambda_i\mathbf{e}_i) = \lambda_i\|\mathbf{e}_i\|^2 = \lambda_i$. Ogni autovalore è la varianza dei dati proiettati sul suo autovettore, quindi non è negativo; è strettamente positivo se i dati variano davvero lungo quella direzione.`,
      },
      {
        latex: md`\lambda_i>0\ \ \forall i\iff\Sigma\ \text{definita positiva}\iff|\Sigma|=\prod_{i=1}^{n}\lambda_i>0`,
        why: md`Mette d'accordo slide e note. La slide p29 dice che gli autovalori «will take positive values», le note p25 «non-negative»: a rigore la semidefinitezza dà $\lambda_i \ge 0$, e $\lambda_i = 0$ corrisponde a una direzione senza variabilità. Ma la gaussiana esiste solo con $\Sigma$ invertibile, e il determinante è il prodotto degli autovalori (da $\Sigma = U\Lambda U^t$ con $U$ ortogonale, $\vert U\vert^2 = 1$): quando la pdf è definita gli autovalori sono strettamente positivi, come dice la slide.`,
      },
    ],
    conclusion: md`$\Sigma$ è simmetrica perché è la media di prodotti esterni simmetrici, ed è semidefinita positiva perché $\mathbf{a}^t\Sigma\mathbf{a}$ è la varianza dei dati proiettati su $\mathbf{a}$. Di conseguenza ogni autovalore è una varianza: quella lungo il suo autovettore. Esempio con $\Sigma = \begin{bmatrix}2&1\\1&2\end{bmatrix}$: per $\mathbf{a} = (1,-1)$ si ha $\mathbf{a}^t\Sigma\mathbf{a} = 2 - 1 - 1 + 2 = 2 \ge 0$, e per l'autovettore unitario $\mathbf{e}_2 = (1,-1)/\sqrt{2}$ si ottiene $1$, che è proprio l'autovalore $\lambda_2$. Si può ruotare la direzione di proiezione nel [widget sulla varianza delle proiezioni](#widget:m06-varianza-proiezione-psd).`,
    source: [{ doc: 'ch2', page: 27 }, { doc: 'ch2', page: 29 }, { doc: 'part1', page: 24 }, { doc: 'part1', page: 25 }],
  },

  // --- der06 Sigma diagonale: la gaussiana si fattorizza ------------------------------------------------------------
  {
    id: 'der06',
    title: 'Con Σ diagonale la gaussiana multivariata si fattorizza',
    goal: md`Dimostrare la freccia della slide p27: con $\Sigma$ diagonale la pdf gaussiana multivariata diventa il prodotto delle univariate, $p(\mathbf{x}) = p(x_1)\,p(x_2)\dots p(x_n)$.`,
    assumptions: md`$\mathbf{x} \sim N(\mathbf{m}, \Sigma)$ con $\Sigma = diag(\sigma_1^2,\dots,\sigma_n^2)$ e $\sigma_i^2 > 0$: le covarianze tra feature diverse sono nulle. L'altra metà della freccia, «feature indipendenti implicano $\Sigma$ diagonale», vale per qualunque distribuzione ed è in [«Feature indipendenti ⟹ covarianze nulle»](#derivation:der18).`,
    steps: [
      {
        latex: md`\Sigma=diag(\sigma_1^{2},\dots,\sigma_n^{2})\ \Rightarrow\ |\Sigma|=\prod_{i=1}^{n}\sigma_i^{2},\quad \Sigma^{-1}=diag\left(\frac{1}{\sigma_1^{2}},\dots,\frac{1}{\sigma_n^{2}}\right)`,
        why: md`Per una matrice diagonale il determinante è il prodotto degli elementi diagonali e l'inversa è la diagonale dei reciproci: il prodotto $\Sigma\,\Sigma^{-1} = diag(\sigma_i^2/\sigma_i^2) = I$ lo conferma.`,
      },
      {
        latex: md`\Sigma^{-1}(\mathbf{x}-\mathbf{m})=\begin{bmatrix}(x_1-m_1)/\sigma_1^{2}\\ \vdots\\ (x_n-m_n)/\sigma_n^{2}\end{bmatrix}`,
        why: md`Una matrice diagonale agisce su ogni componente separatamente: la $i$-esima componente dello scarto viene divisa per $\sigma_i^2$ e non si mescola con le altre.`,
      },
      {
        latex: md`(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})=\sum_{i=1}^{n}\frac{(x_i-m_i)^{2}}{\sigma_i^{2}}`,
        why: md`Moltiplicando a sinistra per $(\mathbf{x}-\mathbf{m})^t$ si ottiene una somma di quadrati normalizzati: mancano tutti i termini misti $(x_i-m_i)(x_j-m_j)$, che sarebbero pesati dagli elementi fuori diagonale di $\Sigma^{-1}$, qui nulli. La distanza di Mahalanobis diventa la somma degli scarti standardizzati al quadrato.`,
      },
      {
        latex: md`|\Sigma|^{1/2}=\prod_{i=1}^{n}\sigma_i,\qquad (2\pi)^{n/2}=\prod_{i=1}^{n}(2\pi)^{1/2}`,
        why: md`La radice di un prodotto è il prodotto delle radici (con $\sigma_i > 0$), e $(2\pi)^{n/2}$ è il prodotto di $n$ copie di $\sqrt{2\pi}$.`,
      },
      {
        latex: md`(2\pi)^{n/2}|\Sigma|^{1/2}=\prod_{i=1}^{n}\sqrt{2\pi}\,\sigma_i`,
        why: md`Mettendo insieme i due prodotti, anche la costante di normalizzazione si spezza in $n$ fattori, uno per feature.`,
      },
      {
        latex: md`p(\mathbf{x})=\frac{1}{\prod_{i}\sqrt{2\pi}\,\sigma_i}\exp\left[-\frac{1}{2}\sum_{i=1}^{n}\frac{(x_i-m_i)^{2}}{\sigma_i^{2}}\right]`,
        why: md`Si sostituiscono costante e forma quadratica nella formula multivariata della slide p26.`,
      },
      {
        latex: md`\exp\left[-\frac{1}{2}\sum_{i=1}^{n}\frac{(x_i-m_i)^{2}}{\sigma_i^{2}}\right]=\prod_{i=1}^{n}\exp\left[-\frac{(x_i-m_i)^{2}}{2\sigma_i^{2}}\right]`,
        why: md`L'esponenziale di una somma è il prodotto degli esponenziali, $e^{a+b} = e^a e^b$.`,
      },
      {
        latex: md`p(\mathbf{x})=\prod_{i=1}^{n}\frac{1}{\sigma_i\sqrt{2\pi}}\exp\left[-\frac{(x_i-m_i)^{2}}{2\sigma_i^{2}}\right]=p(x_1)\,p(x_2)\dots p(x_n)`,
        why: md`Si accoppia ogni fattore della costante con il suo esponenziale: ogni fattore è una gaussiana univariata nella sola $x_i$, con media $m_i$ e varianza $\sigma_i^2$. La pdf congiunta è il prodotto di funzioni di una variabile ciascuna: è la definizione di indipendenza (note p24: «each feature is distributed independently of the others»).`,
      },
      {
        latex: md`\int\!\cdots\!\int p(\mathbf{x})\,dx_2\cdots dx_n=\frac{1}{\sigma_1\sqrt{2\pi}}e^{-\frac{(x_1-m_1)^{2}}{2\sigma_1^{2}}}\prod_{i=2}^{n}\underbrace{\int\frac{1}{\sigma_i\sqrt{2\pi}}e^{-\frac{(x_i-m_i)^{2}}{2\sigma_i^{2}}}dx_i}_{=1}=p(x_1)`,
        why: md`I fattori sono davvero le marginali: integrando via le altre variabili ogni altro fattore dà 1 (è una densità), e resta la gaussiana di $x_1$. Lo stesso vale per ogni $i$. Quindi il $p(x_i)$ della slide è la marginale di $x_i$, una gaussiana $N(m_i, \sigma_i^2)$.`,
      },
    ],
    conclusion: md`Con $\Sigma$ diagonale la gaussiana multivariata è il prodotto di $n$ gaussiane univariate, una per feature: le feature sono indipendenti. Per la gaussiana, quindi, covarianze nulle e indipendenza sono la stessa cosa; per una distribuzione qualsiasi le covarianze nulle non bastano. Controllo numerico con $n = 2$, $\mathbf{m} = \mathbf{0}$, $\sigma_1 = 1$, $\sigma_2 = 2$: $p(\mathbf{0}) = \frac{1}{2\pi\cdot 2} \approx 0.0796$, uguale a $0.3989 \cdot 0.1995$. Le ellissi di isolivello hanno gli assi allineati agli assi coordinati. È anche il caso delle feature $x_1$ e $x_3$ della gaussiana 3-D della slide p30, che la slide dichiara indipendenti. Si può provare nel [widget sulle feature indipendenti](#widget:m06-feature-indipendenti-prodotto).`,
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }],
  },

  // --- der07 Isolivelli: ellissi con assi lungo gli autovettori -----------------------------------------------------
  {
    id: 'der07',
    title: 'Perché gli isolivelli sono ellissi con assi lungo gli autovettori',
    goal: md`Ricavare forma, orientazione e lunghezza degli assi degli isolivelli (*isolevels*) della gaussiana, che le slide p28-29 e le note p24-25 enunciano senza dimostrazione: sono ellissi (iperellissi, *hyperellipses*, in $\Re^n$) con gli assi diretti dagli autovettori di $\Sigma$; l'autovettore del massimo autovalore dà l'asse principale, quello del minimo l'asse più piccolo; gli autovalori fissano le lunghezze degli assi. Nel caso 2-D si calcolano autovalori e autovettori con l'equazione caratteristica.`,
    assumptions: md`$\Sigma$ simmetrica e definita positiva, cioè tutti gli autovalori $\lambda_i > 0$: serve perché la pdf esista ([«Σ è simmetrica e semidefinita positiva»](#derivation:der05)). Autovalori reali e autovettori ortonormali sono dimostrati in [«Autovalori reali e autovettori ortogonali di Σ»](#derivation:der16). La quota $c$ dell'isolivello sta tra 0 e il valore di picco $p(\mathbf{m}) = \frac{1}{(2\pi)^{n/2}\vert\Sigma\vert^{1/2}}$.`,
    steps: [
      {
        latex: md`p(\mathbf{x})=c\iff\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]=c\,(2\pi)^{n/2}|\Sigma|^{1/2}`,
        why: md`Un isolivello è la sezione orizzontale della campana alla quota $c$ (slide p28). Si moltiplicano i due membri per il denominatore della costante di normalizzazione.`,
      },
      {
        latex: md`p(\mathbf{x})=c\iff(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})=-2\ln\left[c\,(2\pi)^{n/2}|\Sigma|^{1/2}\right]=r^{2}`,
        why: md`Si prende il logaritmo e si moltiplica per $-2$: fissare la quota della pdf equivale a fissare il valore della forma quadratica. L'isolivello è l'insieme dei punti a distanza di Mahalanobis $r$ dalla media. Serve $c \le p(\mathbf{m})$ perché $r^2 \ge 0$: con $c = p(\mathbf{m})$ si ha $r = 0$ e l'isolivello si riduce al punto $\mathbf{m}$ (il pallino nero $z = 3$ della figura, il picco); più $c$ è bassa, più $r$ è grande e l'ellisse è ampia.`,
      },
      {
        latex: md`\Sigma=U\Lambda U^{t},\quad U=[\mathbf{e}_1\dots\mathbf{e}_n],\quad U^{t}U=I,\quad \Lambda=diag(\lambda_1,\dots,\lambda_n)`,
        why: md`Teorema spettrale: $\Sigma$ è simmetrica, quindi si diagonalizza con una matrice ortogonale di autovettori (slide p29: gli autovettori formano una base ortogonale, *orthogonal basis*). Le colonne di $U$ sono gli autovettori unitari, e $U^tU = I$ dice che sono di lunghezza 1 e a due a due perpendicolari. La scrittura equivale a $\Sigma U = U\Lambda$, cioè $\Sigma\mathbf{e}_i = \lambda_i\mathbf{e}_i$ colonna per colonna. Per convenzione $\lambda_1 \ge \lambda_2 \ge \dots \ge \lambda_n$ (slide p29).`,
      },
      {
        latex: md`\Sigma^{-1}=U\Lambda^{-1}U^{t}`,
        why: md`L'inversa ha gli stessi autovettori e autovalori reciproci. Infatti $U^{-1} = U^t$ perché $U^tU = I$, quindi $(U\Lambda U^t)^{-1} = (U^t)^{-1}\Lambda^{-1}U^{-1} = U\Lambda^{-1}U^t$; verifica: $U\Lambda U^t\,U\Lambda^{-1}U^t = U\Lambda\Lambda^{-1}U^t = UU^t = I$. $\Lambda^{-1} = diag(1/\lambda_1,\dots,1/\lambda_n)$ esiste solo se ogni $\lambda_i > 0$, cioè se $\Sigma$ è definita positiva.`,
      },
      {
        latex: md`\mathbf{y}=U^{t}(\mathbf{x}-\mathbf{m})\iff\mathbf{x}=\mathbf{m}+U\mathbf{y}=\mathbf{m}+\sum_{i=1}^{n}y_i\,\mathbf{e}_i,\qquad y_i=\mathbf{e}_i^{t}(\mathbf{x}-\mathbf{m})`,
        why: md`Nuove coordinate: $y_i$ è la componente dello scarto $\mathbf{x}-\mathbf{m}$ lungo l'autovettore $\mathbf{e}_i$. Geometricamente è una traslazione dell'origine in $\mathbf{m}$ seguita da una rotazione degli assi sugli autovettori; $U$ ortogonale conserva lunghezze e angoli ($\|\mathbf{y}\| = \|\mathbf{x}-\mathbf{m}\|$), quindi le figure non si deformano.`,
      },
      {
        latex: md`\mathbf{y}=U^{t}(\mathbf{x}-\mathbf{m})\ \Rightarrow\ (\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})=\mathbf{y}^{t}\Lambda^{-1}\mathbf{y}=\sum_{i=1}^{n}\frac{y_i^{2}}{\lambda_i}`,
        why: md`Si sostituisce l'inversa: $(\mathbf{x}-\mathbf{m})^tU\Lambda^{-1}U^t(\mathbf{x}-\mathbf{m}) = \left(U^t(\mathbf{x}-\mathbf{m})\right)^t\Lambda^{-1}\left(U^t(\mathbf{x}-\mathbf{m})\right) = \mathbf{y}^t\Lambda^{-1}\mathbf{y}$. $\Lambda^{-1}$ è diagonale, quindi nelle coordinate lungo gli autovettori spariscono i termini misti, come per la [Σ diagonale](#derivation:der06).`,
      },
      {
        latex: md`\sum_{i=1}^{n}\frac{y_i^{2}}{\left(r\sqrt{\lambda_i}\right)^{2}}=1`,
        why: md`Si divide $\sum_i y_i^2/\lambda_i = r^2$ per $r^2$: è l'equazione canonica di un'ellisse (un'iperellisse in $\Re^n$) centrata in $\mathbf{m}$, con gli assi lungo gli autovettori e semiassi $r\sqrt{\lambda_i}$. Autovalore maggiore, asse più lungo: $\lambda_1$ dà l'asse principale (*main axis*, slide p28; *principal axis*, slide p29), $\lambda_n$ l'asse più piccolo (*smallest axis*).`,
      },
      {
        latex: md`\mathbf{x}=\mathbf{m}\pm r\sqrt{\lambda_i}\,\mathbf{e}_i\ \Rightarrow\ (\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})=r^{2}\lambda_i\,\mathbf{e}_i^{t}\Sigma^{-1}\mathbf{e}_i=r^{2}\lambda_i\cdot\frac{1}{\lambda_i}=r^{2}`,
        why: md`Verifica diretta sui vertici: i punti a distanza $r\sqrt{\lambda_i}$ da $\mathbf{m}$ lungo $\pm\mathbf{e}_i$ stanno sull'isolivello, perché $\Sigma^{-1}\mathbf{e}_i = \mathbf{e}_i/\lambda_i$ e $\mathbf{e}_i^t\mathbf{e}_i = 1$. Il rapporto tra gli assi, $\sqrt{\lambda_1/\lambda_2}$, non dipende dalla quota: gli isolivelli sono ellissi concentriche con la stessa forma e lo stesso orientamento, scalate da $r$.`,
      },
      {
        latex: md`\Sigma=\begin{bmatrix}\sigma_1^{2}&\sigma_{12}\\ \sigma_{12}&\sigma_2^{2}\end{bmatrix},\qquad \det(\Sigma-\lambda I)=(\sigma_1^{2}-\lambda)(\sigma_2^{2}-\lambda)-\sigma_{12}^{2}`,
        why: md`Caso 2-D, quello della figura della slide p28 e delle domande d'orale (*characteristic equation, eigenvalues/vectors*). $\Sigma$ ha le varianze sulla diagonale e la covarianza $\sigma_{12}$ fuori. Gli autovalori annullano il determinante di $\Sigma - \lambda I$: determinante $2\times 2$, prodotto della diagonale meno prodotto dell'antidiagonale.`,
      },
      {
        latex: md`n=2:\quad \det(\Sigma-\lambda I)=\lambda^{2}-(\sigma_1^{2}+\sigma_2^{2})\lambda+(\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2})=0`,
        why: md`Sviluppando il prodotto si ottiene l'equazione caratteristica (*characteristic equation*), di secondo grado in $\lambda$. Il coefficiente di $\lambda$ è la traccia (*trace*) cambiata di segno e il termine noto è $\vert\Sigma\vert$: quindi $\lambda_1 + \lambda_2 = \sigma_1^2 + \sigma_2^2$ e $\lambda_1\lambda_2 = \vert\Sigma\vert$.`,
      },
      {
        latex: md`\Delta=(\sigma_1^{2}+\sigma_2^{2})^{2}-4(\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2})=(\sigma_1^{2}-\sigma_2^{2})^{2}+4\sigma_{12}^{2}\ge0`,
        why: md`Il discriminante: sviluppando $(\sigma_1^2+\sigma_2^2)^2 - 4\sigma_1^2\sigma_2^2 = (\sigma_1^2-\sigma_2^2)^2$ resta una somma di quadrati. Gli autovalori sono sempre reali, come deve essere per una matrice simmetrica; sono coincidenti solo se $\sigma_1^2 = \sigma_2^2$ e $\sigma_{12} = 0$ (isolivelli circolari).`,
      },
      {
        latex: md`\lambda_{1,2}=\frac{\sigma_1^{2}+\sigma_2^{2}}{2}\pm\sqrt{\left(\frac{\sigma_1^{2}-\sigma_2^{2}}{2}\right)^{2}+\sigma_{12}^{2}},\qquad \tan(2\varphi)=\frac{2\sigma_{12}}{\sigma_1^{2}-\sigma_2^{2}}`,
        why: md`Formula risolutiva, con $\sqrt{\Delta}/2 = \sqrt{\left(\frac{\sigma_1^2-\sigma_2^2}{2}\right)^2 + \sigma_{12}^2}$; accanto, l'angolo $\varphi$ dell'asse principale rispetto a $x_1$. Attenzione: $\tan(2\varphi)$ fissa $\varphi$ solo a meno di $90^{\circ}$, quindi da sola non dice quale dei due assi è il principale. Con covarianza nulla $\tan(2\varphi) = 0$ e l'ellisse è allineata agli assi coordinati, con l'asse principale lungo $x_1$ se $\sigma_1^2 > \sigma_2^2$ ($\varphi = 0$) e lungo $x_2$ se $\sigma_1^2 < \sigma_2^2$ ($\varphi = 90^{\circ}$). Con $\sigma_1^2 = \sigma_2^2$ e $\sigma_{12} \ne 0$ il denominatore si annulla e $\varphi = \pm 45^{\circ}$, con il segno di $\sigma_{12}$. Il ramo giusto si sceglie con l'autovettore, nel passo successivo.`,
      },
      {
        latex: md`(\Sigma-\lambda_i I)\,\mathbf{e}_i=\mathbf{0}:\quad (\sigma_1^{2}-\lambda_i)\,e_{i1}+\sigma_{12}\,e_{i2}=0\ \Rightarrow\ \mathbf{e}_i\propto\begin{bmatrix}\sigma_{12}\\\lambda_i-\sigma_1^{2}\end{bmatrix}\ (\sigma_{12}\ne0),\qquad \tan\varphi=\frac{\lambda_1-\sigma_1^{2}}{\sigma_{12}}`,
        why: md`Per ogni autovalore si risolve il sistema omogeneo $(\Sigma - \lambda_i I)\mathbf{e}_i = \mathbf{0}$. Basta la prima riga, perché la seconda è proporzionale (il determinante è nullo); poi si normalizza a lunghezza 1. La pendenza dell'autovettore di $\lambda_1$ dà l'angolo dell'asse principale senza ambiguità. Se $\sigma_{12} = 0$ la matrice è già diagonale e gli autovettori sono gli assi coordinati. Un esempio completo è nell'[esercizio su autovalori, autovettori ed ellisse](#exercise:es04).`,
      },
      {
        latex: md`t=\tan\varphi=\frac{\lambda_1-\sigma_1^{2}}{\sigma_{12}}:\qquad \frac{2t}{1-t^{2}}=\frac{2\sigma_{12}}{\sigma_1^{2}-\sigma_2^{2}}\iff(\lambda_1-\sigma_1^{2})(\lambda_1-\sigma_2^{2})=\sigma_{12}^{2}`,
        why: md`Le due formule dell'angolo sono coerenti. Con $\tan(2\varphi) = \frac{2t}{1-t^2}$, l'uguaglianza diventa $\sigma_{12}t^2 + (\sigma_1^2-\sigma_2^2)\,t - \sigma_{12} = 0$; moltiplicando per $\sigma_{12}$ e chiamando $d = \sigma_{12}t = \lambda_1 - \sigma_1^2$ si ottiene $d\,(d + \sigma_1^2 - \sigma_2^2) = \sigma_{12}^2$, cioè l'equazione caratteristica calcolata in $\lambda_1$, che è vera.`,
      },
      {
        latex: md`\Sigma=\begin{bmatrix}2&1\\1&2\end{bmatrix}:\quad \lambda_{1,2}=2\pm1,\quad \mathbf{e}_1=\tfrac{1}{\sqrt{2}}\begin{bmatrix}1\\1\end{bmatrix},\quad \mathbf{e}_2=\tfrac{1}{\sqrt{2}}\begin{bmatrix}1\\-1\end{bmatrix},\quad \varphi=45^{\circ},\quad r\sqrt{3}\ :\ r`,
        why: md`Numeri: $\sigma_1^2 = \sigma_2^2 = 2$ e $\sigma_{12} = 1$, quindi l'equazione caratteristica è $\lambda^2 - 4\lambda + 3 = 0$ e $\lambda = 2 \pm \sqrt{0 + 1}$, cioè $3$ e $1$. Gli autovettori sono $(\sigma_{12}, \lambda_i - \sigma_1^2)$, cioè $(1, 1)$ e $(1, -1)$, normalizzati: perpendicolari, $\mathbf{e}_1^t\mathbf{e}_2 = 0$. $\tan\varphi = 1$ dà $\varphi = 45^{\circ}$, e $\tan(2\varphi)$ non è definita perché $\sigma_1^2 = \sigma_2^2$. Semiassi $r\sqrt{3}$ lungo la bisettrice e $r$ lungo l'altra diagonale. Controlli: $\lambda_1 + \lambda_2 = 4$ è la traccia, $\lambda_1\lambda_2 = 3 = 4 - 1 = \vert\Sigma\vert$.`,
      },
    ],
    conclusion: md`Nelle coordinate lungo gli autovettori la forma quadratica perde i termini misti, e l'isolivello diventa $\sum_i y_i^2/(r\sqrt{\lambda_i})^2 = 1$: un'iperellisse centrata in $\mathbf{m}$, con gli assi lungo gli autovettori e semiassi proporzionali alla radice degli autovalori. Il primo autovettore dà l'asse principale, direzione di massima varianza; l'ultimo dà l'asse più piccolo. In 2-D autovalori e autovettori escono dall'equazione caratteristica $\lambda^2 - (\sigma_1^2+\sigma_2^2)\lambda + \vert\Sigma\vert = 0$. Si possono trascinare gli elementi di $\Sigma$ nel [widget sugli assi dell'ellisse](#widget:m06-autovettori-assi-ellisse).`,
    source: [{ doc: 'ch2', page: 28 }, { doc: 'ch2', page: 29 }, { doc: 'part1', page: 24 }, { doc: 'part1', page: 25 }],
  },

  // --- der08 Stima ML 1-D: la derivata prima -------------------------------------------------------------------------
  {
    id: 'der08',
    title: 'Stima ML di media e varianza di una gaussiana 1-D: la derivata prima',
    goal: md`Sviluppare la derivata prima (*first derivative*) della log-verosimiglianza (*log-likelihood*) per una gaussiana 1-D e interpretare il risultato. È una domanda d'esame reale (Melgani: «develop the first derivative for a gaussian and explain the meaning of the result»); la slide p31 dice solo «It can be shown».`,
    assumptions: md`$N$ campioni di addestramento $X = \{x_1,\dots,x_N\}$ indipendenti e identicamente distribuiti (*iid*) secondo $N(m, \sigma^2)$, con $m$ e $\sigma^2$ ignoti: il vettore dei parametri è $\boldsymbol{\theta} = (m, \sigma^2)$. I campioni non sono tutti uguali, altrimenti la varianza stimata sarebbe 0.`,
    steps: [
      {
        latex: md`p(X|m,\sigma^{2})=\prod_{k=1}^{N}p(x_k|m,\sigma^{2})=\prod_{k=1}^{N}\frac{1}{\sigma\sqrt{2\pi}}\exp\left[-\frac{(x_k-m)^{2}}{2\sigma^{2}}\right]`,
        why: md`I campioni sono iid: per l'indipendenza la densità congiunta è il prodotto delle densità dei singoli campioni, e per l'identica distribuzione ogni fattore è la stessa gaussiana della slide p22. Come funzione dei parametri, a campioni fissati, è la verosimiglianza (*likelihood*).`,
      },
      {
        latex: md`\ln p(X|m,\sigma^{2})=\sum_{k=1}^{N}\ln p(x_k|m,\sigma^{2})=\sum_{k=1}^{N}\left[-\ln\left(\sigma\sqrt{2\pi}\right)-\frac{(x_k-m)^{2}}{2\sigma^{2}}\right]`,
        why: md`Il logaritmo è strettamente crescente, quindi ha lo stesso punto di massimo, e trasforma il prodotto in somma. Per ogni addendo $\ln\left(a\,e^{b}\right) = \ln a + b$: il logaritmo della costante $\frac{1}{\sigma\sqrt{2\pi}}$ è $-\ln(\sigma\sqrt{2\pi})$ e il logaritmo di un esponenziale è il suo esponente.`,
      },
      {
        latex: md`\ln p(X|m,\sigma^{2})=-\frac{N}{2}\ln(2\pi\sigma^{2})-\frac{1}{2\sigma^{2}}\sum_{k=1}^{N}(x_k-m)^{2}`,
        why: md`Il termine costante si ripete $N$ volte: $N\ln(\sigma\sqrt{2\pi}) = N\ln\left((2\pi\sigma^2)^{1/2}\right) = \frac{N}{2}\ln(2\pi\sigma^2)$. Il fattore $\frac{1}{2\sigma^2}$ non dipende da $k$ ed esce dalla sommatoria.`,
      },
      {
        latex: md`\frac{\partial}{\partial m}\left[-\frac{(x_k-m)^{2}}{2\sigma^{2}}\right]=-\frac{2(x_k-m)\cdot(-1)}{2\sigma^{2}}=\frac{x_k-m}{\sigma^{2}}`,
        why: md`Regola della catena sul singolo addendo: la derivata del quadrato è due volte la base per la derivata interna, che vale $-1$ perché $m$ compare con il segno meno. I due segni meno si annullano e il 2 si semplifica.`,
      },
      {
        latex: md`\frac{\partial}{\partial m}\ln p(X|m,\sigma^{2})=\frac{1}{\sigma^{2}}\sum_{k=1}^{N}(x_k-m)`,
        why: md`Si deriva la log-verosimiglianza rispetto a $m$: il primo termine non dipende da $m$ e sparisce; la derivata di una somma finita è la somma delle derivate, e resta la somma degli scarti divisa per $\sigma^2$.`,
      },
      {
        latex: md`\frac{\partial}{\partial m}\ln p(X|m,\sigma^{2})=\frac{1}{\sigma^{2}}\left(\sum_{k=1}^{N}x_k-Nm\right)=\frac{N}{\sigma^{2}}\left(\bar{x}-m\right),\qquad \bar{x}=\frac{1}{N}\sum_{k=1}^{N}x_k`,
        why: md`Significato della derivata: $\sum_k m = Nm$, quindi la derivata è proporzionale alla distanza tra la media dei dati $\bar{x}$ e il valore candidato $m$. È positiva se $m$ sta a sinistra di $\bar{x}$ (conviene aumentare $m$), negativa se sta a destra (conviene diminuirlo). La pendenza $N/\sigma^2$ cresce con $N$: più dati, più la verosimiglianza «punta» deciso verso $\bar{x}$.`,
      },
      {
        latex: md`\sum_{k=1}^{N}(x_k-\hat{m})=0\ \Rightarrow\ \sum_{k=1}^{N}x_k-N\hat{m}=0\ \Rightarrow\ \hat{m}=\frac{1}{N}\sum_{k=1}^{N}x_k`,
        why: md`Condizione necessaria di massimo: derivata nulla (e $\sigma^2 > 0$ si semplifica). Gli scarti positivi e negativi devono bilanciarsi, e questo accade nel baricentro dei dati: la stima ML della media è la media campionaria, qualunque sia $\sigma^2$.`,
      },
      {
        latex: md`\sum_{k=1}^{N}(x_k-m)^{2}=\sum_{k=1}^{N}(x_k-\hat{m})^{2}+N(\hat{m}-m)^{2}\ \Rightarrow\ \ln p(X|m,\sigma^{2})=cost-\frac{N}{2\sigma^{2}}(m-\hat{m})^{2}`,
        why: md`Lo stesso risultato visto dall'alto. Si scrive $x_k - m = (x_k - \hat{m}) + (\hat{m} - m)$ e si sviluppa il quadrato: il doppio prodotto $2(\hat{m}-m)\sum_k(x_k-\hat{m})$ è nullo per il passo precedente. Come funzione di $m$ (con $cost$ che raccoglie i termini senza $m$) la log-verosimiglianza è una parabola rivolta verso il basso con il vertice in $\hat{m}$.`,
      },
      {
        latex: md`\frac{\partial^{2}}{\partial m^{2}}\ln p(X|m,\sigma^{2})=-\frac{N}{\sigma^{2}}<0`,
        why: md`La derivata seconda è negativa: il punto stazionario è davvero un massimo, anzi l'unico, perché la parabola è concava. La curvatura $N/\sigma^2$ è l'informazione portata dai dati su $m$: il suo inverso $\sigma^2/N$ è proprio la varianza della media campionaria, il legame con l'efficienza discusso in [«Bontà delle stime ML gaussiane»](#derivation:der19).`,
      },
      {
        latex: md`\frac{\partial}{\partial\sigma^{2}}\ln p(X|m,\sigma^{2})=-\frac{N}{2\sigma^{2}}+\frac{1}{2\sigma^{4}}\sum_{k=1}^{N}(x_k-m)^{2}`,
        why: md`Si deriva rispetto alla varianza trattata come un'unica variabile $v = \sigma^2$: la derivata di $-\frac{N}{2}\ln(2\pi v)$ è $-\frac{N}{2v}$, quella di $-\frac{S}{2v}$ è $\frac{S}{2v^2}$, con $S = \sum_k (x_k-m)^2$ somma dei quadrati degli scarti.`,
      },
      {
        latex: md`-\frac{N}{2\hat{\sigma}^{2}}+\frac{1}{2\hat{\sigma}^{4}}\sum_{k=1}^{N}(x_k-\hat{m})^{2}=0\ \Rightarrow\ -N\hat{\sigma}^{2}+\sum_{k=1}^{N}(x_k-\hat{m})^{2}=0\ \Rightarrow\ \hat{\sigma}^{2}=\frac{1}{N}\sum_{k=1}^{N}(x_k-\hat{m})^{2}`,
        why: md`Si annulla la derivata e si moltiplica per $2\hat{\sigma}^4 > 0$. Al posto di $m$ si mette $\hat{m}$: è lecito perché la condizione su $m$ non contiene $\sigma^2$, quindi il punto stazionario congiunto si ottiene risolvendo prima in $m$ e poi in $\sigma^2$. Il risultato è la varianza campionaria con fattore $1/N$: il caso $n = 1$ della stima ML della covarianza della slide p31.`,
      },
      {
        latex: md`\frac{\partial}{\partial\sigma}\ln p(X|m,\sigma^{2})=-\frac{N}{\sigma}+\frac{1}{\sigma^{3}}\sum_{k=1}^{N}(x_k-m)^{2}=0\ \Rightarrow\ \hat{\sigma}^{2}=\frac{1}{N}\sum_{k=1}^{N}(x_k-\hat{m})^{2}`,
        why: md`Controllo: derivando rispetto a $\sigma$ invece che a $\sigma^2$ non cambia nulla. Da $\ln p = -N\ln\sigma - \frac{N}{2}\ln(2\pi) - \frac{S}{2\sigma^2}$ si ottiene $-\frac{N}{\sigma} + \frac{S}{\sigma^3}$, che è la derivata rispetto a $\sigma^2$ moltiplicata per $2\sigma > 0$ (regola della catena): stessi zeri. La stima ML di $\sigma$ è $\hat{\sigma} = \sqrt{\hat{\sigma}^2}$.`,
      },
      {
        latex: md`\frac{\partial^{2}\ln p}{\partial m\,\partial\sigma^{2}}\Big|_{\hat{m},\hat{\sigma}^{2}}=-\frac{1}{\hat{\sigma}^{4}}\sum_{k=1}^{N}(x_k-\hat{m})=0,\qquad \frac{\partial^{2}\ln p}{\partial(\sigma^{2})^{2}}\Big|_{\hat{m},\hat{\sigma}^{2}}=\frac{N}{2\hat{\sigma}^{4}}-\frac{1}{\hat{\sigma}^{6}}\sum_{k=1}^{N}(x_k-\hat{m})^{2}=-\frac{N}{2\hat{\sigma}^{4}}<0`,
        why: md`Controllo del secondo ordine nel punto trovato. La derivata mista si annulla, perché gli scarti dalla media stimata hanno somma nulla. Nella derivata seconda in $\sigma^2$ si usa $\sum_k (x_k-\hat{m})^2 = N\hat{\sigma}^2$: $\frac{N}{2\hat{\sigma}^4} - \frac{N}{\hat{\sigma}^4} = -\frac{N}{2\hat{\sigma}^4}$. Con la derivata seconda in $m$ già negativa, l'hessiana è diagonale con elementi negativi e il punto è un massimo congiunto. Serve che i campioni non siano tutti uguali: altrimenti $\hat{\sigma}^2 = 0$ e la verosimiglianza non ha un massimo finito.`,
      },
      {
        latex: md`\hat{\sigma}^{2}=\frac{1}{N}\sum_{k=1}^{N}(x_k-\hat{m})^{2}=\frac{1}{N}\sum_{k=1}^{N}x_k^{2}-\hat{m}^{2}`,
        why: md`Forma equivalente, il caso $n = 1$ della seconda uguaglianza della slide p31: sviluppando il quadrato, $\frac{1}{N}\sum_k x_k^2 - 2\hat{m}\cdot\frac{1}{N}\sum_k x_k + \hat{m}^2 = \frac{1}{N}\sum_k x_k^2 - \hat{m}^2$ (media dei quadrati meno quadrato della media).`,
      },
    ],
    conclusion: md`Annullare la derivata prima della log-verosimiglianza gaussiana dà due risultati. La stima ML della media è la media aritmetica dei campioni, indipendente da $\sigma^2$: la derivata è $\frac{N}{\sigma^2}(\bar{x} - m)$ e si annulla solo nel baricentro. La stima ML della varianza è la media degli scarti quadratici dalla media stimata, con fattore $1/N$. Esempio con i campioni $1, 2, 3, 6$: $\hat{m} = 3$, scarti $-2, -1, 0, 3$ (somma nulla), $\hat{\sigma}^2 = (4+1+0+9)/4 = 3.5$, e anche $(1+4+9+36)/4 - 9 = 3.5$. La varianza ML è distorta, $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2$, e si corregge dividendo per $N - 1$ (qui $14/3 \approx 4.67$): i passaggi sono in [«Bias della covarianza ML e stimatore corretto»](#derivation:der12). Si può veder annullarsi la derivata nel [widget sulla derivata della log-verosimiglianza](#widget:m06-derivata-log-verosimiglianza).`,
    source: [{ doc: 'ch2', page: 31 }, { doc: 'ch2', page: 22 }, { doc: 'part1', page: 25 }, { doc: 'part1', page: 26 }],
  },

  // --- der09 Stima ML multivariata di m e Sigma --------------------------------------------------------------------
  {
    id: 'der09',
    title: 'Stima ML di m e Σ nel caso multivariato',
    goal: md`Ricavare le due formule della slide p31, $\hat{\mathbf{m}} = \frac{1}{N}\sum_k\mathbf{x}_k$ e $\hat{\Sigma} = \frac{1}{N}\sum_k(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t$, annullando il gradiente della log-verosimiglianza. È un'integrazione: la slide dice «It can be shown», le note p25-26 danno solo il risultato.`,
    assumptions: md`$N$ campioni iid $X = \{\mathbf{x}_1,\dots,\mathbf{x}_N\}$ da $N(\mathbf{m}, \Sigma)$ in $\Re^n$, con $\Sigma$ simmetrica e definita positiva (quindi invertibile). Tre identità di calcolo matriciale, ricavate nei passi: per $A$ simmetrica $\nabla_{\mathbf{u}}(\mathbf{u}^tA\mathbf{u}) = 2A\mathbf{u}$; per $B$ invertibile $\frac{\partial\ln\vert B\vert}{\partial B} = (B^{-1})^t$ e $\frac{\partial\,tr(BS)}{\partial B} = S^t$. Perché la stima di $\Sigma$ sia invertibile servono $N \ge n+1$ campioni non contenuti in un sottospazio affine di dimensione minore.`,
    steps: [
      {
        latex: md`\ln p(X|\mathbf{m},\Sigma)=\sum_{k=1}^{N}\ln\left\{\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[-\frac{1}{2}(\mathbf{x}_k-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}_k-\mathbf{m})\right]\right\}`,
        why: md`Campioni iid: la verosimiglianza è il prodotto delle $N$ pdf della slide p26, e il logaritmo lo trasforma in una somma.`,
      },
      {
        latex: md`\ln p(X|\mathbf{m},\Sigma)=-\frac{Nn}{2}\ln(2\pi)-\frac{N}{2}\ln|\Sigma|-\frac{1}{2}\sum_{k=1}^{N}(\mathbf{x}_k-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}_k-\mathbf{m})`,
        why: md`Il logaritmo della costante vale $-\frac{n}{2}\ln(2\pi) - \frac{1}{2}\ln\vert\Sigma\vert$ e si ripete $N$ volte; il logaritmo dell'esponenziale è il suo esponente. Con $n = 1$ si ritrova la log-verosimiglianza della [derivata prima 1-D](#derivation:der08).`,
      },
      {
        latex: md`\frac{\partial}{\partial u_j}\left(\mathbf{u}^{t}A\mathbf{u}\right)=\frac{\partial}{\partial u_j}\sum_{i,l}u_iA_{il}u_l=\sum_{l}A_{jl}u_l+\sum_{i}u_iA_{ij}=\left[(A+A^{t})\mathbf{u}\right]_j`,
        why: md`Da dove viene l'identità del gradiente di una forma quadratica. Si scrive la forma come doppia somma e si deriva il prodotto $u_iu_l$: contribuiscono i termini con $i = j$ e quelli con $l = j$. Quindi $\nabla_{\mathbf{u}}(\mathbf{u}^tA\mathbf{u}) = (A + A^t)\mathbf{u}$, che per $A$ simmetrica vale $2A\mathbf{u}$: è l'analogo di $\frac{d}{du}(au^2) = 2au$.`,
      },
      {
        latex: md`\nabla_{\mathbf{m}}\left[(\mathbf{x}_k-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}_k-\mathbf{m})\right]=-2\,\Sigma^{-1}(\mathbf{x}_k-\mathbf{m})`,
        why: md`Si applica l'identità con $\mathbf{u} = \mathbf{x}_k - \mathbf{m}$ e $A = \Sigma^{-1}$, simmetrica perché inversa di una matrice simmetrica: $(\Sigma^{-1})^t = (\Sigma^t)^{-1} = \Sigma^{-1}$. La derivata di $\mathbf{u}$ rispetto a $\mathbf{m}$ è $-I$, da cui il segno meno.`,
      },
      {
        latex: md`\nabla_{\mathbf{m}}\ln p(X|\mathbf{m},\Sigma)=\sum_{k=1}^{N}\Sigma^{-1}(\mathbf{x}_k-\mathbf{m})=\Sigma^{-1}\sum_{k=1}^{N}(\mathbf{x}_k-\mathbf{m})`,
        why: md`I primi due termini della log-verosimiglianza non dipendono da $\mathbf{m}$. Il gradiente di una somma è la somma dei gradienti, e il fattore $-\frac{1}{2}$ davanti alla somma moltiplica il $-2$ del passo precedente: segno meno e fattore 2 si compensano. $\Sigma^{-1}$ non dipende da $k$ ed esce dalla somma.`,
      },
      {
        latex: md`\Sigma^{-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})=\mathbf{0}\ \Rightarrow\ \hat{\mathbf{m}}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k`,
        why: md`$\Sigma^{-1}$ è invertibile, quindi il gradiente si annulla solo se la somma degli scarti è il vettore nullo: $\sum_k\mathbf{x}_k = N\hat{\mathbf{m}}$, di nuovo la media campionaria (*sample mean*), componente per componente. La soluzione non dipende da $\Sigma$, ed è un massimo per ogni $\Sigma$: come nel caso 1-D, $\sum_k(\mathbf{x}_k-\mathbf{m})^t\Sigma^{-1}(\mathbf{x}_k-\mathbf{m}) = \sum_k(\mathbf{x}_k-\hat{\mathbf{m}})^t\Sigma^{-1}(\mathbf{x}_k-\hat{\mathbf{m}}) + N(\hat{\mathbf{m}}-\mathbf{m})^t\Sigma^{-1}(\hat{\mathbf{m}}-\mathbf{m})$ (il doppio prodotto contiene la somma nulla degli scarti), e l'ultimo termine è $\ge 0$ perché $\Sigma^{-1}$ è definita positiva. Per questo nel seguito si può fissare $\mathbf{m} = \hat{\mathbf{m}}$ e massimizzare solo rispetto a $\Sigma$.`,
      },
      {
        latex: md`(\mathbf{x}_k-\hat{\mathbf{m}})^{t}\Sigma^{-1}(\mathbf{x}_k-\hat{\mathbf{m}})=tr\left[(\mathbf{x}_k-\hat{\mathbf{m}})^{t}\Sigma^{-1}(\mathbf{x}_k-\hat{\mathbf{m}})\right]=tr\left[\Sigma^{-1}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}\right]`,
        why: md`Il trucco della traccia: uno scalare coincide con la propria traccia (matrice $1\times 1$), e la traccia è invariante per permutazione ciclica, $tr(ABC) = tr(CAB)$. Qui $A = (\mathbf{x}_k-\hat{\mathbf{m}})^t$, $B = \Sigma^{-1}$, $C = \mathbf{x}_k-\hat{\mathbf{m}}$: il vettore colonna passa davanti e compare il prodotto esterno.`,
      },
      {
        latex: md`\sum_{k=1}^{N}tr\left[\Sigma^{-1}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}\right]=tr\left[\Sigma^{-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}\right]=tr\left(\Sigma^{-1}S\right)`,
        why: md`Per linearità della traccia e del prodotto matriciale la somma entra: i prodotti esterni si sommano nella matrice $S$, $n\times n$ e simmetrica (*scatter matrix*, matrice di dispersione).`,
      },
      {
        latex: md`\ln p=cost+\frac{N}{2}\ln|\Sigma^{-1}|-\frac{1}{2}tr\left(\Sigma^{-1}S\right),\qquad S=\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}`,
        why: md`Si riscrive la somma delle forme quadratiche come traccia e si usa che il determinante dell'inversa è il reciproco del determinante: $-\frac{N}{2}\ln\vert\Sigma\vert = \frac{N}{2}\ln\vert\Sigma^{-1}\vert$. La costante è $-\frac{Nn}{2}\ln(2\pi)$. Ora $\Sigma$ compare solo tramite $B = \Sigma^{-1}$.`,
      },
      {
        latex: md`\frac{\partial\ln|B|}{\partial B_{ij}}=\frac{C_{ij}}{|B|}=\left[(B^{-1})^{t}\right]_{ij},\qquad \frac{\partial\,tr(BS)}{\partial B_{ij}}=\frac{\partial}{\partial B_{ij}}\sum_{i',j'}B_{i'j'}S_{j'i'}=S_{ji}`,
        why: md`Le due identità, elemento per elemento. Sviluppando il determinante lungo la riga $i$ (Laplace), $\vert B\vert = \sum_j B_{ij}C_{ij}$ con $C_{ij}$ cofattore, che non contiene $B_{ij}$: la derivata di $\vert B\vert$ è $C_{ij}$, e dividendo per $\vert B\vert$ si ottiene l'elemento $ji$ dell'inversa, perché $B^{-1} = C^t/\vert B\vert$. La traccia di $BS$ è la somma dei prodotti $B_{i'j'}S_{j'i'}$: la derivata rispetto a $B_{ij}$ è $S_{ji}$. In forma matriciale: $(B^{-1})^t$ e $S^t$.`,
      },
      {
        latex: md`\frac{\partial\ln p}{\partial\Sigma^{-1}}=\frac{N}{2}\Sigma-\frac{1}{2}S=0`,
        why: md`Si deriva rispetto a $B = \Sigma^{-1}$ con le due identità: $(B^{-1})^t = \Sigma^t = \Sigma$ e $S^t = S$. Derivare rispetto a $\Sigma^{-1}$ invece che rispetto a $\Sigma$ è lecito: l'inversione è una corrispondenza biunivoca tra matrici definite positive, quindi il punto di massimo è lo stesso (invarianza della ML rispetto alla parametrizzazione). Le identità restano valide tenendo conto della simmetria: con $B_{ij} = B_{ji}$ la derivata rispetto a un elemento fuori diagonale somma i due contributi uguali, e il gradiente si annulla negli stessi punti, perché $S$ e $\Sigma$ sono simmetriche.`,
      },
      {
        latex: md`\hat{\Sigma}=\frac{1}{N}S=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}`,
        why: md`Risolvendo $N\Sigma = S$ si ottiene la formula della slide p31, con il fattore $1/N$. La soluzione è accettabile ($\hat{\Sigma}$ definita positiva, $\ln\vert\hat{\Sigma}\vert$ finito) solo se $N \ge n+1$ e i campioni non stanno in un sottospazio affine di dimensione minore: gli $N$ scarti hanno somma nulla, quindi il [rango di $\hat{\Sigma}$ è al più $\min(n, N-1)$](#formula:f-c58-2). Altrimenti la verosimiglianza cresce senza limite e il massimo non esiste.`,
      },
      {
        latex: md`\ln p(X|\hat{\mathbf{m}},\Sigma)-\ln p(X|\hat{\mathbf{m}},\hat{\Sigma})=\frac{N}{2}\sum_{i=1}^{n}\left(\ln\mu_i-\mu_i+1\right)\le0,\qquad \mu_i\ \text{autovalori di}\ \Sigma^{-1}\hat{\Sigma}`,
        why: md`Controllo che sia un massimo globale, senza hessiane. Con $S = N\hat{\Sigma}$ la differenza vale $\frac{N}{2}\left[\ln\vert\Sigma^{-1}\hat{\Sigma}\vert - tr(\Sigma^{-1}\hat{\Sigma}) + n\right]$, perché $\ln p(X\vert\hat{\mathbf{m}},\hat{\Sigma}) = cost - \frac{N}{2}\ln\vert\hat{\Sigma}\vert - \frac{N}{2}n$. Determinante e traccia sono prodotto e somma degli autovalori $\mu_i > 0$ di $\Sigma^{-1}\hat{\Sigma}$ (positivi perché la matrice è simile a $\Sigma^{-1/2}\hat{\Sigma}\,\Sigma^{-1/2}$, definita positiva). Poiché $\ln\mu \le \mu - 1$, con l'uguale solo per $\mu = 1$, ogni termine è $\le 0$: il massimo è raggiunto solo per $\Sigma = \hat{\Sigma}$. Insieme al passo sulla media, $(\hat{\mathbf{m}}, \hat{\Sigma})$ è il massimo globale congiunto.`,
      },
    ],
    conclusion: md`Le stime ML della gaussiana multivariata sono la media campionaria e la covarianza campionaria con fattore $1/N$, cioè le definizioni di $\mathbf{m} = E\{\mathbf{x}\}$ e $\Sigma = E\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^t\}$ con il valore atteso sostituito dalla media sui campioni. Con $n = 1$ diventano $\hat{m}$ e $\hat{\sigma}^2$ della [derivata prima 1-D](#derivation:der08). La stima di $\Sigma$ è distorta per $N$ finito, $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$ (slide p31): i passaggi sono in [«Bias della covarianza ML e stimatore corretto»](#derivation:der12). Si può aggiungere un campione alla volta nel [widget sulla stima ML](#widget:m06-stima-ml-campione-per-campione).`,
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 25 }, { doc: 'part1', page: 26 }],
  },

  // --- der10 Le due forme della stima ML della covarianza ----------------------------------------------------------
  {
    id: 'der10',
    title: 'Equivalenza delle due forme della stima ML della covarianza',
    goal: md`Dimostrare la seconda uguaglianza della slide p31, ripresa nelle note p26: $\frac{1}{N}\sum_k(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t = \frac{1}{N}\sum_k\mathbf{x}_k\mathbf{x}_k^t - \hat{\mathbf{m}}\hat{\mathbf{m}}^t$.`,
    assumptions: md`$\hat{\mathbf{m}} = \frac{1}{N}\sum_k\mathbf{x}_k$ è la media campionaria. È un'identità algebrica: vale per qualunque insieme di campioni, senza ipotesi probabilistiche.`,
    steps: [
      {
        latex: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}`,
        why: md`Si parte dalla prima forma della slide p31, quella che esce dalla [stima ML multivariata](#derivation:der09).`,
      },
      {
        latex: md`(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}=\mathbf{x}_k\mathbf{x}_k^{t}-\mathbf{x}_k\hat{\mathbf{m}}^{t}-\hat{\mathbf{m}}\mathbf{x}_k^{t}+\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}`,
        why: md`Si sviluppa il singolo prodotto esterno: trasposta della differenza, poi proprietà distributiva, come nella [forma equivalente della covarianza](#derivation:der04).`,
      },
      {
        latex: md`\frac{1}{N}\sum_{k=1}^{N}\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}=\frac{1}{N}\cdot N\,\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}=\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}`,
        why: md`L'ultimo termine non dipende da $k$: la somma di $N$ copie uguali divisa per $N$ lo lascia invariato.`,
      },
      {
        latex: md`=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t}-\left(\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\right)\hat{\mathbf{m}}^{t}-\hat{\mathbf{m}}\left(\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\right)^{t}+\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}`,
        why: md`Si porta la media $\frac{1}{N}\sum_k$ dentro ogni termine: $\hat{\mathbf{m}}$ non dipende da $k$ ed esce dalla sommatoria, a destra nel secondo termine e a sinistra nel terzo.`,
      },
      {
        latex: md`=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t}-\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}-\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}+\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}`,
        why: md`La media dei campioni è per definizione la media stimata $\hat{\mathbf{m}}$.`,
      },
      {
        latex: md`=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t}-\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}`,
        why: md`Due dei tre termini uguali si cancellano. È la stessa cancellazione della [forma equivalente della covarianza](#derivation:der04): questa è la versione campionaria di $\Sigma = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$, con il valore atteso sostituito dalla media sui campioni e $\mathbf{m}$ da $\hat{\mathbf{m}}$.`,
      },
      {
        latex: md`n=1:\quad \hat{\sigma}^{2}=\frac{1}{N}\sum_{k=1}^{N}(x_k-\hat{m})^{2}=\frac{1}{N}\sum_{k=1}^{N}x_k^{2}-\hat{m}^{2}`,
        why: md`Con una sola feature l'identità diventa la regola «media dei quadrati meno quadrato della media» per la varianza campionaria ML.`,
      },
      {
        latex: md`\mathbf{x}_k\in\left\{\begin{bmatrix}1\\2\end{bmatrix},\begin{bmatrix}3\\2\end{bmatrix},\begin{bmatrix}2\\5\end{bmatrix},\begin{bmatrix}2\\3\end{bmatrix}\right\}:\quad \frac{1}{4}\begin{bmatrix}18&24\\24&42\end{bmatrix}-\begin{bmatrix}4&6\\6&9\end{bmatrix}=\frac{1}{4}\begin{bmatrix}2&0\\0&6\end{bmatrix}=\begin{bmatrix}0.5&0\\0&1.5\end{bmatrix}`,
        why: md`Controllo numerico con quattro campioni 2-D. $\hat{\mathbf{m}} = (2, 3)$, e la somma dei prodotti esterni $\mathbf{x}_k\mathbf{x}_k^t$ dà la prima matrice. Con la prima forma gli scarti sono $(-1,-1)$, $(1,-1)$, $(0,2)$, $(0,0)$, i loro prodotti esterni sommano a $\begin{bmatrix}2&0\\0&6\end{bmatrix}$, e diviso 4 si ottiene lo stesso risultato.`,
      },
    ],
    conclusion: md`Le due forme della slide p31 sono la stessa matrice: la covarianza ML è la media dei prodotti esterni $\mathbf{x}_k\mathbf{x}_k^t$ meno il prodotto esterno della media stimata. La seconda forma si aggiorna con due somme correnti ($\sum_k\mathbf{x}_k$ e $\sum_k\mathbf{x}_k\mathbf{x}_k^t$) senza ripassare i dati. Però sottrae due numeri grandi e vicini, quindi in virgola mobile può perdere cifre significative quando la media è grande rispetto alla dispersione (osservazione numerica, non della fonte). Si possono confrontare le due forme nel [widget sulla stima ML](#widget:m06-stima-ml-campione-per-campione).`,
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }],
  },
]
