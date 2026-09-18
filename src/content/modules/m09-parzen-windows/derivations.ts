// Derivazioni del foglio m09 (finestre di Parzen): der01-der12 dell'inventario.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più servono a seguire i conti
// che la fonte salta (controllati sulle immagini di ch2 p43-66 e part1 p36-45): il testo del perché dice da dove vengono.
// In der07 i passi dell'inventario sono riordinati: la catena bias -> varianza -> Chebyshev viene prima degli esempi.
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivations: Derivation[] = [
  // --- der01 Dal conteggio K/(NV) alla stima di Parzen generale ---------------------------------------
  {
    id: 'der01',
    title: 'Dalla stima di base K/(NV) alla stima di Parzen generale',
    goal: md`Ricavare la stima di Parzen $\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)$ partendo dal conteggio dei campioni che cadono in un ipercubo centrato sul punto di stima.`,
    assumptions: md`$N$ campioni di addestramento (*training samples*) $\mathbf{x}_1,\dots,\mathbf{x}_N \in \Re^n$, estratti in modo indipendente dalla pdf ignota $p(\mathbf{x})$, che si suppone continua. La regione $R$ attorno al punto di stima $\mathbf{x}^*$ è, per ora, un ipercubo di lato $h$.`,
    steps: [
      {
        latex: md`P_R=P\{\mathbf{x}\in R\}=\int_R p(\mathbf{x})\,d\mathbf{x}\approx p(\mathbf{x}^*)\,V`,
        why: md`Punto di partenza dei metodi non parametrici (modulo m08, slide p43): $P_R$ è la probabilità che un campione cada nella regione $R$ che contiene $\mathbf{x}^*$. Se $p$ è continua e $R$ è piccola, $p$ è quasi costante in $R$ e l'integrale vale circa $p(\mathbf{x}^*)$ per il volume $V$ di $R$. La slide scrive $=$ nell'ultimo passaggio, ma è un'approssimazione.`,
      },
      {
        latex: md`\hat{P}_R=\frac{K}{N}`,
        why: md`Su $N$ campioni ne cadono $K$ in $R$: la frequenza relativa è una stima consistente di $P_R$ (legge dei grandi numeri, *law of large numbers*, slide p43).`,
      },
      {
        latex: md`\hat{p}(\mathbf{x}^*)=\frac{K}{NV}`,
        why: md`Si divide la stima di $P_R$ per il volume (slide p44). Il metodo di Parzen fissa la regione, quindi $V$, e calcola $K$ dai campioni; il K-NN fa il contrario, fissa $K$ e misura $V$ (slide p45).`,
      },
      {
        latex: md`V=h^n`,
        why: md`Ipotesi temporanea (slide p51): $R$ è un ipercubo $n$-dimensionale (*n-dimensional hypercube*) di lato $h$ centrato su $\mathbf{x}^*$. Il volume di un ipercubo è il lato elevato alla dimensione.`,
      },
      {
        latex: md`\gamma(\mathbf{u})=\begin{cases}1, & \mathbf{u}\ \text{nell'ipercubo unitario}\\ 0, & \text{altrimenti}\end{cases}`,
        why: md`Per scrivere $K$ in forma analitica serve una funzione che valga 1 dentro e 0 fuori: la funzione finestra (*window function*) di slide p51. «Unitario» vuol dire centrato nell'origine con lato 1, cioè $\vert u_j\vert \le 1/2$ per ogni $j = 1,\dots,n$. La slide dice solo «belongs to the hypercube»: la precisazione viene da Duda-Hart.`,
      },
      {
        latex: md`\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)=1\iff \left|x_{k,j}-x^*_j\right|\le\frac{h}{2}\quad \forall j=1,\dots,n`,
        why: md`Test di appartenenza (slide p51). Sottrarre $\mathbf{x}^*$ porta il centro dell'ipercubo nell'origine, dividere per $h$ porta il lato a 1. Il campione $\mathbf{x}_k$ sta in $R$ se ogni sua coordinata $x_{k,j}$ dista dalla coordinata $x^*_j$ al più metà lato; altrimenti la finestra vale 0.`,
      },
      {
        latex: md`K=\sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)`,
        why: md`Ogni campione dentro la finestra aggiunge 1, ogni campione fuori aggiunge 0: la somma è il conteggio $K$ (*number of samples*, slide p52).`,
      },
      {
        latex: md`\hat{p}(\mathbf{x}^*)=\frac{1}{N h^n}\sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)`,
        why: md`Si sostituiscono $K$ e $V = h^n$ nella stima di base e si porta $1/h^n$ dentro la somma: ogni addendo è il contributo di un solo campione.`,
      },
      {
        latex: md`\gamma(-\mathbf{u})=\gamma(\mathbf{u})`,
        why: md`L'ipercubo unitario è simmetrico rispetto all'origine, perché $\vert -u_j\vert = \vert u_j\vert$: si può scambiare l'ordine della differenza nell'argomento.`,
      },
      {
        latex: md`\hat{p}(\mathbf{x}^*)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}^*-\mathbf{x}_k}{h}\right)`,
        why: md`Stessa somma, letta al contrario: ogni addendo è ora una funzione rettangolare centrata sul campione $\mathbf{x}_k$ e valutata in $\mathbf{x}^*$. La stima è una collezione di contributi rettangolari (*collection of contributions coming from rectangular functions*), uno per campione, ed equivale a un semplice conteggio (*simple count*) dei campioni nell'ipercubo (slide p52).`,
      },
      {
        latex: md`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)`,
        why: md`Il punto $\mathbf{x}^*$ era qualunque: con $\mathbf{x}$ al suo posto la stima diventa una funzione su tutto lo spazio delle feature, somma di $N$ scatole di lato $h$ e altezza $1/(N h^n)$ centrate sui campioni. In 1-D è un istogramma con il bin centrato sul punto di stima invece che fisso.`,
      },
      {
        latex: md`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)`,
        why: md`Invece della sola finestra a ipercubo si ammette una classe più generale di funzioni finestra (*a more general class of window functions*, slide p52), e il volume diventa $V(h)$. La stima è una media di funzioni di $\mathbf{x}$ e dei campioni (*an average of functions*, slide p53): ogni campione contribuisce secondo la sua distanza da $\mathbf{x}$ e la finestra lavora da interpolatore (*interpolation*). $\gamma(\cdot)$ si chiama finestra di Parzen (*Parzen window*) o kernel, $h$ larghezza della finestra (*width of the window*). Perché la stima resti una densità servono $\gamma \ge 0$, area 1 e $V(h) = h^n$ ([«la stima è una densità»](#derivation:der02)).`,
      },
    ],
    conclusion: md`Con la finestra a ipercubo la stima conta i campioni nel cubo di lato $h$ centrato in $\mathbf{x}$ e divide per $N h^n$. Con una finestra liscia, per esempio gaussiana, diventa una somma di colline centrate sui campioni, senza gli spigoli dei rettangoli: $\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)$.`,
    source: [
      { doc: 'ch2', page: 43 }, { doc: 'ch2', page: 44 }, { doc: 'ch2', page: 51 }, { doc: 'ch2', page: 52 }, { doc: 'ch2', page: 53 },
      { doc: 'part1', page: 36 }, { doc: 'part1', page: 37 }, { doc: 'part1', page: 38 },
    ],
  },

  // --- der02 La stima è una densità legittima ---------------------------------------------------------
  {
    id: 'der02',
    title: 'La stima di Parzen è una densità legittima se lo è il kernel e V = hⁿ',
    goal: md`Mostrare che $\hat{p}(\mathbf{x}) \ge 0$ e $\int_{\Re^n}\hat{p}(\mathbf{x})\,d\mathbf{x} = 1$ quando il kernel è una densità e $V = h^n$. La slide p54 dice «it follows at once»: qui i conti per esteso.`,
    assumptions: md`Kernel non negativo e di area 1 (condizioni di slide p54); $V(h) = h^n$ con $h > 0$; campioni $\mathbf{x}_1,\dots,\mathbf{x}_N$ qualsiasi, fissati.`,
    steps: [
      {
        latex: md`\gamma(\mathbf{u})\ge 0,\qquad \int_{\Re^n}\gamma(\mathbf{u})\,d\mathbf{u}=1`,
        why: md`Ipotesi: la finestra è essa stessa una funzione di densità (*the window function itself be a density function*, slide p54).`,
      },
      {
        latex: md`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)\ge 0`,
        why: md`Ogni addendo è un valore di $\gamma$, non negativo, moltiplicato per il coefficiente positivo $1/(N h^n)$: la non negatività (*nonnegative*) passa subito alla stima.`,
      },
      {
        latex: md`\int_{\Re^n}\hat{p}(\mathbf{x})\,d\mathbf{x}=\frac{1}{N}\sum_{k=1}^{N}\int_{\Re^n}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)d\mathbf{x}`,
        why: md`Linearità dell'integrale: la somma finita e il fattore $1/N$ escono, e si integra un kernel alla volta.`,
      },
      {
        latex: md`\mathbf{x}=\mathbf{x}_k+h\,\mathbf{u},\qquad \frac{\partial\mathbf{x}}{\partial\mathbf{u}}=h\,\mathbf{I}_n,\qquad \left|\det\left(h\,\mathbf{I}_n\right)\right|=h^n`,
        why: md`Nel $k$-esimo integrale si cambia variabile: $\mathbf{u}$ misura la distanza da $\mathbf{x}_k$ in unità di $h$. La trasformazione è una traslazione più una dilatazione di fattore $h$ lungo tutte le $n$ coordinate, quindi la matrice jacobiana è $h$ volte l'identità, con determinante $h^n$. Con $h > 0$, quando $\mathbf{x}$ percorre $\Re^n$ anche $\mathbf{u}$ percorre $\Re^n$.`,
      },
      {
        latex: md`\mathbf{u}=\frac{\mathbf{x}-\mathbf{x}_k}{h}\ \Rightarrow\ d\mathbf{x}=h^n\,d\mathbf{u}`,
        why: md`Il differenziale si trasforma con il valore assoluto del determinante jacobiano: in $n$ dimensioni una dilatazione di fattore $h$ moltiplica i volumi per $h^n$.`,
      },
      {
        latex: md`\int_{\Re^n}\frac{1}{h^n}\gamma(\mathbf{u})\,h^n\,d\mathbf{u}=\int_{\Re^n}\gamma(\mathbf{u})\,d\mathbf{u}=1`,
        why: md`Il fattore $1/V = 1/h^n$ cancella esattamente lo jacobiano $h^n$: ecco perché serve mantenere la relazione $V = h^n$ (*if we maintain the relation*, slide p54). Resta l'integrale del kernel, che vale 1 per ipotesi.`,
      },
      {
        latex: md`\int_{\Re^n}\hat{p}(\mathbf{x})\,d\mathbf{x}=\frac{1}{N}\cdot N\cdot 1=1`,
        why: md`Media di $N$ integrali tutti uguali a 1: l'area della stima (*integrate to one*) è 1 per qualunque $h$ e qualunque insieme di campioni.`,
      },
      {
        latex: md`V(h)\neq h^n\ \Rightarrow\ \int_{\Re^n}\hat{p}(\mathbf{x})\,d\mathbf{x}=\frac{h^n}{V(h)}\neq 1`,
        why: md`Controprova: rifacendo i passi con un volume qualsiasi, lo jacobiano $h^n$ non si cancella più e l'area diventa $h^n/V(h)$. La stima resterebbe non negativa, ma non integrerebbe a 1.`,
      },
    ],
    conclusion: md`Se il kernel è una densità e $V = h^n$, anche $\hat{p}(\mathbf{x})$ è una densità legittima (*legitimate density function*) per ogni $h > 0$ e ogni insieme di campioni. Le altre tre condizioni di slide p54 (massimo nell'origine, continuità, decadimento a zero) non servono a questo: servono a ottenere una stima «buona».`,
    source: [{ doc: 'ch2', page: 53 }, { doc: 'ch2', page: 54 }, { doc: 'part1', page: 38 }, { doc: 'part1', page: 39 }],
  },

  // --- der03 Effetto di h sulla finestra riscalata -----------------------------------------------------
  {
    id: 'der03',
    title: 'Effetto di h su δ(x): ampiezza, larghezza, area e limite di Dirac',
    goal: md`Capire come $h$ deforma la finestra riscalata $\delta(\mathbf{x})$ (altezza, larghezza, area) e verificare i valori di picco della figura di slide p56.`,
    assumptions: md`Kernel $\gamma$ che è una densità e $V(h) = h^n$ ([«la stima è una densità»](#derivation:der02)). Per il controllo numerico: finestra normale 2-D a simmetria circolare, come nella figura di slide p56.`,
    steps: [
      {
        latex: md`\delta(\mathbf{x})=\frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}}{h}\right),\qquad \hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\delta(\mathbf{x}-\mathbf{x}_k)`,
        why: md`Definizione di slide p55: $\delta$ è il kernel riscalato in larghezza e in altezza, e la stima è la media di $N$ copie di $\delta$ traslate sui campioni. Per capire l'effetto di $h$ su $\hat{p}$ basta quindi studiare $\delta$. Attenzione al simbolo: qui $\delta$ non è la delta di Dirac, lo diventa solo nel limite $h \to 0$ (ultimo passo).`,
      },
      {
        latex: md`\delta(\mathbf{x})=\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)`,
        why: md`Definizione di slide p55 con $V(h) = h^n$.`,
      },
      {
        latex: md`\delta(\mathbf{0})=\frac{\gamma(\mathbf{0})}{h^n}`,
        why: md`Ampiezza: il valore nell'origine scala come $1/h^n$. In 2-D dimezzare $h$ quadruplica il picco.`,
      },
      {
        latex: md`\gamma\left(\frac{\mathbf{x}}{h}\right)\approx 0\quad \text{per } \|\mathbf{x}\|\gg h`,
        why: md`Larghezza: $\gamma(\mathbf{x}/h)$ è $\gamma$ stirata di un fattore $h$, più larga se $h > 1$ e più stretta se $h < 1$. Il kernel si spegne quando il suo argomento è grande (decadimento a zero, slide p54), cioè quando $\|\mathbf{x}\|$ supera di molto $h$: la larghezza efficace della finestra è proporzionale a $h$.`,
      },
      {
        latex: md`\mathbf{u}=\frac{\mathbf{x}}{h}\ \Rightarrow\ \int_{\Re^n}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)d\mathbf{x}=\int_{\Re^n}\frac{1}{h^n}\gamma(\mathbf{u})\,h^n\,d\mathbf{u}`,
        why: md`Stesso cambio di variabile di [«la stima è una densità»](#derivation:der02), senza traslazione: $d\mathbf{x} = h^n\,d\mathbf{u}$.`,
      },
      {
        latex: md`\int_{\Re^n}\delta(\mathbf{x})\,d\mathbf{x}=\int_{\Re^n}\gamma(\mathbf{u})\,d\mathbf{u}=1\quad \forall h`,
        why: md`Area: lo jacobiano $h^n$ cancella $1/h^n$. Ampiezza e larghezza cambiano insieme in modo da conservare l'area: $h$ scambia larghezza con altezza.`,
      },
      {
        latex: md`\gamma(\mathbf{x})=\frac{1}{2\pi}e^{-\|\mathbf{x}\|^2/2}\ \Rightarrow\ \delta(\mathbf{x})=\frac{1}{2\pi h^2}\exp\left(-\frac{\|\mathbf{x}\|^2}{2h^2}\right)`,
        why: md`Caso della slide p56: $n = 2$ e kernel normale standard a simmetria circolare (*circularly symmetric normal Parzen windows*). Riscalata, $\delta$ è una gaussiana 2-D di media nulla e deviazione standard $h$ lungo ogni asse.`,
      },
      {
        latex: md`\gamma(\mathbf{x})=\frac{1}{2\pi}e^{-\|\mathbf{x}\|^2/2}\ (n=2)\ \Rightarrow\ \delta(\mathbf{0})=\frac{1}{2\pi h^2}=0.159,\ 0.637,\ 3.98\ \ (h=1,\,0.5,\,0.2)`,
        why: md`Verifica numerica: $1/(2\pi) = 0.159$, $1/(2\pi \cdot 0.25) = 0.637$, $1/(2\pi \cdot 0.04) = 3.98$. I tre valori tornano con le scale verticali $0.15$, $0.6$ e $4$ dei tre grafici di slide p56.`,
      },
      {
        latex: md`h\to 0:\quad \delta(\mathbf{x}-\mathbf{x}_k)\to \text{delta di Dirac in } \mathbf{x}_k,\qquad \hat{p}(\mathbf{x})\to\frac{1}{N}\sum_{k=1}^{N}\delta_{\text{Dirac}}(\mathbf{x}-\mathbf{x}_k)`,
        why: md`Casi limite. Con $h$ piccolissimo ogni finestra diventa un impulso di area 1 sul suo campione e la stima è un insieme di impulsi (massima variabilità). Con $h$ molto grande la stima è una sola funzione larga e piatta (massimo smoothing).`,
      },
    ],
    conclusion: md`$h$ regola insieme ampiezza ($\propto 1/h^n$) e larghezza ($\propto h$) della finestra e ne conserva l'area. Con $h$ grande hai colline larghe e basse che si fondono: stima troppo liscia (*oversmoothing*) che perde i dettagli. Con $h$ piccolo hai aghi alti e stretti sui campioni: stima molto variabile che insegue il rumore (*overfitting*). Più campioni hai, più puoi ridurre $h$ (part1 p39).`,
    source: [{ doc: 'ch2', page: 55 }, { doc: 'ch2', page: 56 }, { doc: 'part1', page: 39 }],
  },

  // --- der04 Media della stima = convoluzione (bias) ---------------------------------------------------
  {
    id: 'der04',
    title: 'La media della stima è la convoluzione tra pdf vera e kernel (bias)',
    goal: md`Dimostrare che $E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})*\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$ a partire dall'ipotesi di campioni i.i.d., e leggere il risultato come distorsione (*bias*).`,
    assumptions: md`Campioni $\mathbf{x}_1,\dots,\mathbf{x}_N$ indipendenti e identicamente distribuiti (*i.i.d.*) secondo la pdf ignota $p(\mathbf{x})$. Il punto $\mathbf{x}$, la larghezza $h$ e il kernel sono fissati: l'unica aleatorietà sta nei campioni. $V(h) = h^n$.`,
    steps: [
      {
        latex: md`E\{\hat{p}(\mathbf{x})\}=E\left\{\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)\right\}`,
        why: md`Si applica il valore atteso alla definizione della stima ([«dal conteggio alla stima di Parzen»](#derivation:der01)). $\hat{p}(\mathbf{x})$ è una variabile aleatoria perché dipende dai training samples $\mathbf{x}_k$.`,
      },
      {
        latex: md`=\frac{1}{N}\sum_{k=1}^{N}E\left\{\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)\right\}`,
        why: md`Linearità del valore atteso: la somma finita e il fattore $1/N$ escono.`,
      },
      {
        latex: md`=E\left\{\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_1}{h}\right)\right\}`,
        why: md`I campioni sono identicamente distribuiti: gli $N$ valori attesi sono uguali, e la media di $N$ termini uguali è il termine stesso. L'indipendenza qui non serve ancora: servirà per la varianza ([«bound sulla varianza»](#derivation:der06)).`,
      },
      {
        latex: md`=\int_{\Re^n}\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}-\mathbf{v}}{h}\right)p(\mathbf{v})\,d\mathbf{v}`,
        why: md`Definizione di valore atteso di una funzione di $\mathbf{x}_1$, che ha densità $p$: si integra la funzione pesandola con la densità, con $\mathbf{v}$ come variabile d'integrazione.`,
      },
      {
        latex: md`\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}-\mathbf{v}}{h}\right)=\delta(\mathbf{x}-\mathbf{v}),\qquad (f*g)(\mathbf{x})=\int_{\Re^n}f(\mathbf{v})\,g(\mathbf{x}-\mathbf{v})\,d\mathbf{v}`,
        why: md`Due ingredienti. A sinistra: la funzione dentro l'integrale è la finestra riscalata $\delta$ di slide p55 valutata in $\mathbf{x}-\mathbf{v}$. A destra: la definizione di convoluzione (*convolution*) tra due funzioni.`,
      },
      {
        latex: md`=\int_{\Re^n}\delta(\mathbf{x}-\mathbf{v})\,p(\mathbf{v})\,d\mathbf{v}=p(\mathbf{x})*\frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)`,
        why: md`L'integrale ha esattamente la forma della convoluzione, con $f = p$ e $g = \delta$. La media della stima è la pdf vera filtrata dal kernel: una versione sfocata (*blurred*) di $p$ (slide p60).`,
      },
      {
        latex: md`E\{\hat{p}(\mathbf{x})\}-p(\mathbf{x})=\int_{\Re^n}\delta(\mathbf{x}-\mathbf{v})\,\big(p(\mathbf{v})-p(\mathbf{x})\big)\,d\mathbf{v}`,
        why: md`Si scrive $p(\mathbf{x})=\int_{\Re^n}\delta(\mathbf{x}-\mathbf{v})\,p(\mathbf{x})\,d\mathbf{v}$, lecito perché $\delta$ ha area 1 ([«effetto di h sulla finestra»](#derivation:der03)), e si sottrae. Il bias in $\mathbf{x}$ è una media pesata delle differenze tra $p$ nei punti vicini e $p$ in $\mathbf{x}$. Su un picco di $p$ le differenze sono negative e la stima in media sottostima; in una valle sovrastima.`,
      },
      {
        latex: md`E\{\hat{p}(\mathbf{x})\}-p(\mathbf{x})\neq 0\ \text{in generale, e non dipende da } N`,
        why: md`Le differenze si compensano solo in casi particolari, per esempio $p$ costante (o lineare, con kernel simmetrico) in tutta la zona in cui la finestra pesa: in generale la stima è distorta. $N$ non compare nel risultato: a $h$ fisso, più campioni non riducono il bias.`,
      },
    ],
    conclusion: md`La media della stima è la pdf vera sfocata dal kernel (*«The estimate mean is a blurred version of the true p(x)!»*, slide p60): a $h$ fisso la stima di Parzen è distorta (*biased*) e resta tale per ogni $N$. Kernel più largo, più sfocatura e più bias; kernel più stretto, meno bias ma più varianza (part1 p42).`,
    source: [{ doc: 'ch2', page: 60 }, { doc: 'part1', page: 42 }],
  },

  // --- der05 Non distorsione asintotica ----------------------------------------------------------------
  {
    id: 'der05',
    title: 'Non distorsione asintotica: h_N → 0 trasforma il kernel in una delta di Dirac',
    goal: md`Mostrare che $\lim_{N\to+\infty}E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})$ se la larghezza $h_N$ tende a 0 quando $N\to+\infty$ (*asymptotically unbiased*). La slide p60 dà l'implicazione con la delta di Dirac; qui si esplicitano le ipotesi e si rifà la dimostrazione anche senza delta, con un cambio di variabile.`,
    assumptions: md`Campioni i.i.d. ([«la media della stima è una convoluzione»](#derivation:der04)). $p$ continua nel punto $\mathbf{x}$ e limitata ($\sup p < +\infty$). Kernel non negativo, di area 1, che decade abbastanza in fretta: $\|\mathbf{u}\|^n\gamma(\mathbf{u})\to 0$ per $\|\mathbf{u}\|\to+\infty$. È un'ipotesi più forte del decadimento a zero di slide p54, che chiede solo $\gamma(\mathbf{x})\to 0$: qui $\gamma$ deve scendere più in fretta di $\|\mathbf{u}\|^{-n}$ (in 1-D è l'ipotesi $\vert u\vert\,\gamma(u)\to 0$ del teorema di Parzen). $V = h_N^n$.`,
    steps: [
      {
        latex: md`h=h_N,\qquad \lim_{N\to+\infty}h_N=0`,
        why: md`La larghezza si sceglie in funzione del numero di campioni e si fa tendere a zero (*if the kernel width is chosen opportunely*, slide p60).`,
      },
      {
        latex: md`E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})*\frac{1}{h_N^n}\gamma\left(\frac{\mathbf{x}}{h_N}\right)`,
        why: md`Il risultato di [«la media della stima è una convoluzione»](#derivation:der04) vale per ogni $N$ con $h = h_N$: la media della stima è $p$ convoluta con il kernel riscalato. Resta da capire che cosa diventa il kernel riscalato quando $h_N \to 0$.`,
      },
      {
        latex: md`\int_{\Re^n}\frac{1}{h_N^n}\gamma\left(\frac{\mathbf{x}}{h_N}\right)d\mathbf{x}=1\ \ \forall N,\qquad \frac{\gamma(\mathbf{0})}{h_N^n}\to+\infty`,
        why: md`Il kernel riscalato conserva area 1 ([«effetto di h sulla finestra»](#derivation:der03)) mentre si stringe, e il suo picco cresce senza limite (con $\gamma(\mathbf{0}) > 0$, garantito dal massimo nell'origine).`,
      },
      {
        latex: md`\mathbf{x}\neq\mathbf{0}:\quad \frac{1}{h_N^n}\gamma\left(\frac{\mathbf{x}}{h_N}\right)=\frac{\|\mathbf{u}\|^n\gamma(\mathbf{u})}{\|\mathbf{x}\|^n}\bigg|_{\mathbf{u}=\mathbf{x}/h_N}\xrightarrow[N\to+\infty]{}0`,
        why: md`Fuori dall'origine il kernel riscalato si spegne. Con $\mathbf{u} = \mathbf{x}/h_N$ si ha $\|\mathbf{u}\|\to+\infty$ e $1/h_N^n = \|\mathbf{u}\|^n/\|\mathbf{x}\|^n$: il limite è zero se $\|\mathbf{u}\|^n\gamma(\mathbf{u})\to 0$, ipotesi più forte del decadimento a zero di slide p54: $\gamma$ deve scendere più in fretta di $\|\mathbf{u}\|^{-n}$. Insieme al passo precedente (area 1, picco che diverge) è ciò che fa del limite una delta di Dirac.`,
      },
      {
        latex: md`\lim_{N\to+\infty}\left\{\frac{1}{h_N^n}\gamma\left(\frac{\mathbf{x}}{h_N}\right)\right\}=\delta(\mathbf{x})`,
        why: md`Una famiglia di funzioni non negative, di area 1, che si concentra nell'origine tende alla delta di Dirac (limite nel senso delle distribuzioni): è la formula di slide p60.`,
      },
      {
        latex: md`\lim_{N\to+\infty}E\{\hat{p}(\mathbf{x})\}=p(\mathbf{x})*\delta(\mathbf{x})=\int_{\Re^n}\delta(\mathbf{x}-\mathbf{v})\,p(\mathbf{v})\,d\mathbf{v}=p(\mathbf{x})`,
        why: md`Proprietà di campionamento della delta, valida perché $p$ è continua in $\mathbf{x}$: la sfocatura scompare e la media della stima coincide con la pdf vera. È la freccia verde di slide p60: la stima è asintoticamente non distorta.`,
      },
      {
        latex: md`\mathbf{u}=\frac{\mathbf{x}-\mathbf{v}}{h_N}\ \Rightarrow\ \mathbf{v}=\mathbf{x}-h_N\mathbf{u},\qquad d\mathbf{v}=h_N^n\,d\mathbf{u}`,
        why: md`Verifica senza delta di Dirac. Si parte dall'integrale di [«la media della stima è una convoluzione»](#derivation:der04) con $h = h_N$ e si cambia variabile: $\mathbf{u}$ misura la distanza dal punto di stima in unità di $h_N$. Il segno meno inverte l'orientamento, ma nel differenziale entra il valore assoluto dello jacobiano, $h_N^n$.`,
      },
      {
        latex: md`E\{\hat{p}(\mathbf{x})\}=\int_{\Re^n}\frac{1}{h_N^n}\gamma\left(\frac{\mathbf{x}-\mathbf{v}}{h_N}\right)p(\mathbf{v})\,d\mathbf{v}=\int_{\Re^n}\gamma(\mathbf{u})\,p(\mathbf{x}-h_N\mathbf{u})\,d\mathbf{u}`,
        why: md`Il fattore $1/h_N^n$ si cancella con lo jacobiano, come in [«la stima è una densità»](#derivation:der02): la media della stima è una media dei valori di $p$ nei punti $\mathbf{x}-h_N\mathbf{u}$, pesata dal kernel.`,
      },
      {
        latex: md`\left|\gamma(\mathbf{u})\,p(\mathbf{x}-h_N\mathbf{u})\right|\le\sup(p)\,\gamma(\mathbf{u}),\qquad \int_{\Re^n}\sup(p)\,\gamma(\mathbf{u})\,d\mathbf{u}=\sup(p)<+\infty`,
        why: md`L'integranda è maggiorata, per ogni $N$, da una funzione integrabile che non dipende da $N$: si può portare il limite dentro l'integrale (convergenza dominata). È qui che serve $p$ limitata.`,
      },
      {
        latex: md`\lim_{N\to+\infty}\int_{\Re^n}\gamma(\mathbf{u})\,p(\mathbf{x}-h_N\mathbf{u})\,d\mathbf{u}=p(\mathbf{x})\int_{\Re^n}\gamma(\mathbf{u})\,d\mathbf{u}=p(\mathbf{x})`,
        why: md`Per $h_N \to 0$ si ha $p(\mathbf{x}-h_N\mathbf{u}) \to p(\mathbf{x})$ per ogni $\mathbf{u}$, perché $p$ è continua in $\mathbf{x}$ (qui serve la continuità). $p(\mathbf{x})$ esce dall'integrale e resta $\int\gamma = 1$ (qui serve l'area unitaria del kernel). Stesso risultato del passo con la delta di Dirac.`,
      },
    ],
    conclusion: md`Se $h_N \to 0$ per $N\to+\infty$ la stima di Parzen è asintoticamente non distorta in ogni punto in cui $p$ è continua. Occhio al simbolo: a slide p55 $\delta$ è la finestra riscalata, a slide p60 la delta di Dirac, e le due letture si incontrano proprio in questo limite. Nei punti di discontinuità di $p$ (per esempio i lati del rettangolo della densità bimodale di slide p63) il limite è una media dei valori ai due lati pesata dal kernel, non $p(\mathbf{x})$.`,
    source: [{ doc: 'ch2', page: 60 }, { doc: 'part1', page: 42 }, { doc: 'ch2', page: 54 }],
  },

  // --- der06 Bound sulla varianza ----------------------------------------------------------------------
  {
    id: 'der06',
    title: 'Bound sulla varianza della stima di Parzen',
    goal: md`Ricavare il bound $E\left\{\left(\hat{p}(\mathbf{x})-\bar{\hat{p}}(\mathbf{x})\right)^2\right\}\le\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$ di slide p61. La slide dà solo il risultato («it can be shown»): i passaggi seguono Duda-Hart.`,
    assumptions: md`Campioni indipendenti e identicamente distribuiti; kernel non negativo e limitato ($\sup\gamma < +\infty$); $V = h_N^n$. Il simbolo con barra e cappello $\bar{\hat{p}}(\mathbf{x})$ è la media della stima, $E\{\hat{p}(\mathbf{x})\}$ ([«la media della stima è una convoluzione»](#derivation:der04)): la slide non lo definisce, la lettura viene da Duda-Hart. Il bound vale per ogni $N$ finito.`,
    steps: [
      {
        latex: md`E\left\{\left(\hat{p}(\mathbf{x})-\bar{\hat{p}}(\mathbf{x})\right)^2\right\}=\operatorname{var}\{\hat{p}(\mathbf{x})\},\qquad \bar{\hat{p}}(\mathbf{x})=E\{\hat{p}(\mathbf{x})\}`,
        why: md`Il membro sinistro del bound di slide p61 è per definizione la varianza della stima (*estimate variance*): lo scarto quadratico medio dalla sua media.`,
      },
      {
        latex: md`\hat{p}(\mathbf{x})=\sum_{k=1}^{N}z_k,\qquad z_k=\frac{1}{N h_N^n}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h_N}\right)`,
        why: md`La stima è una somma di $N$ funzioni di variabili aleatorie statisticamente indipendenti, i campioni (*the sum of functions of statistically independent random variables*, slide p61). Il fattore $1/(N h_N^n)$ entra in ogni addendo $z_k$.`,
      },
      {
        latex: md`\operatorname{var}\{\hat{p}(\mathbf{x})\}=\sum_{k=1}^{N}\operatorname{var}\{z_k\}=N\operatorname{var}\{z_1\}`,
        why: md`La varianza di una somma di variabili indipendenti è la somma delle varianze; le $z_k$ sono identicamente distribuite, quindi gli $N$ termini sono uguali.`,
      },
      {
        latex: md`\operatorname{var}\{z_1\}=E\{z_1^2\}-\left(E\{z_1\}\right)^2,\qquad E\{z_1\}=\frac{\bar{\hat{p}}(\mathbf{x})}{N}`,
        why: md`Definizione di varianza: momento secondo meno quadrato della media. La media di un addendo è $1/N$ della media della stima ([«la media della stima è una convoluzione»](#derivation:der04)).`,
      },
      {
        latex: md`\operatorname{var}\{\hat{p}(\mathbf{x})\}=N\left(E\{z_1^2\}-\frac{\bar{\hat{p}}^2(\mathbf{x})}{N^2}\right)`,
        why: md`Si mette il passo precedente nel terzo, $\operatorname{var}\{\hat{p}(\mathbf{x})\} = N\operatorname{var}\{z_1\}$, con $\left(E\{z_1\}\right)^2 = \bar{\hat{p}}^2(\mathbf{x})/N^2$.`,
      },
      {
        latex: md`\operatorname{var}\{\hat{p}(\mathbf{x})\}=N\,E\{z_1^2\}-\frac{1}{N}\bar{\hat{p}}^2(\mathbf{x})\le N\,E\{z_1^2\}`,
        why: md`Si moltiplica per $N$ e si scarta il termine negativo $-\bar{\hat{p}}^2(\mathbf{x})/N$: da qui in poi è una maggiorazione, non più un'uguaglianza.`,
      },
      {
        latex: md`E\{z_1^2\}=\int_{\Re^n}\frac{1}{N^2 h_N^{2n}}\gamma^2\left(\frac{\mathbf{x}-\mathbf{v}}{h_N}\right)p(\mathbf{v})\,d\mathbf{v}`,
        why: md`Momento secondo di $z_1$ come integrale rispetto alla densità $p(\mathbf{v})$ del campione, come nel quarto passo di [«la media della stima è una convoluzione»](#derivation:der04): $z_1^2$ contiene $1/(N^2 h_N^{2n})$ e il kernel al quadrato.`,
      },
      {
        latex: md`N\,E\{z_1^2\}=\frac{1}{N h_N^n}\int_{\Re^n}\frac{1}{h_N^n}\gamma^2\left(\frac{\mathbf{x}-\mathbf{v}}{h_N}\right)p(\mathbf{v})\,d\mathbf{v}`,
        why: md`Si moltiplica per $N$ e si spezza $\frac{1}{N h_N^{2n}}$ in $\frac{1}{N h_N^n}\cdot\frac{1}{h_N^n}$: fuori dall'integrale resta $1/(N h_N^n)$, dentro un kernel riscalato (al quadrato).`,
      },
      {
        latex: md`\gamma^2(\cdot)\le\sup(\gamma(\cdot))\,\gamma(\cdot)\ \Rightarrow\ \operatorname{var}\{\hat{p}(\mathbf{x})\}\le\frac{\sup(\gamma(\cdot))}{N h_N^n}\int_{\Re^n}\frac{1}{h_N^n}\gamma\left(\frac{\mathbf{x}-\mathbf{v}}{h_N}\right)p(\mathbf{v})\,d\mathbf{v}=\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}`,
        why: md`Poiché $0 \le \gamma \le \sup\gamma$, uno dei due fattori $\gamma$ si maggiora con il suo estremo superiore. L'integrale che resta è la media della stima, cioè la convoluzione di [«la media della stima è una convoluzione»](#derivation:der04) con $h = h_N$.`,
      },
      {
        latex: md`E\left\{\left(\hat{p}(\mathbf{x})-\bar{\hat{p}}(\mathbf{x})\right)^2\right\}\le\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}`,
        why: md`Con il primo passo si torna alla forma di slide p61.`,
      },
    ],
    conclusion: md`La varianza è piccola solo se $N h_N^n$ è grande. Il bound dipende da tre cose (part1 p42-43): $\sup(\gamma)$, cioè quanto può pesare un solo campione; il numero di campioni $N$; il volume della finestra $h_N^n$. Il prodotto $N h_N^n\,p(\mathbf{x})$ è circa il numero atteso di campioni nella finestra: finestre strette con pochi campioni danno stime molto variabili. La proporzionalità inversa vale per il bound, non per la varianza esatta.`,
    source: [{ doc: 'ch2', page: 61 }, { doc: 'part1', page: 42 }, { doc: 'part1', page: 43 }],
  },

  // --- der07 Consistenza --------------------------------------------------------------------------------
  {
    id: 'der07',
    title: 'Consistenza: le due condizioni su h_N e la verifica degli esempi',
    goal: md`Collegare bias e varianza alle condizioni $\lim_{N\to+\infty}h_N=0$ e $\lim_{N\to+\infty}N h_N^n=+\infty$ di slide p61, mostrare che bastano per la consistenza e controllare le leggi $h_N$ usate negli esempi delle slide.`,
    assumptions: md`Campioni i.i.d.; $p$ continua in $\mathbf{x}$ e limitata ([«non distorsione asintotica»](#derivation:der05)); kernel non negativo, limitato, di area 1 ([«bound sulla varianza»](#derivation:der06)). Consistenza nel senso dei moduli m03-m04: $\lim_{N\to+\infty}P\{|\hat{p}(\mathbf{x})-p(\mathbf{x})|<\delta\}=1$ per ogni $\delta>0$. Qui $\delta$ è una tolleranza positiva, non la finestra di slide p55 né la delta di Dirac.`,
    steps: [
      {
        latex: md`\hat{p}(\mathbf{x})-p(\mathbf{x})=\left(\hat{p}(\mathbf{x})-\bar{\hat{p}}(\mathbf{x})\right)+\left(\bar{\hat{p}}(\mathbf{x})-p(\mathbf{x})\right)`,
        why: md`L'errore della stima in $\mathbf{x}$ si spezza aggiungendo e togliendo la media della stima $\bar{\hat{p}}(\mathbf{x}) = E\{\hat{p}(\mathbf{x})\}$. Il primo pezzo è aleatorio (fluttuazione attorno alla media), il secondo è un numero fisso (la distorsione).`,
      },
      {
        latex: md`E\{(\hat{p}(\mathbf{x})-p(\mathbf{x}))^2\}=E\{(\hat{p}(\mathbf{x})-\bar{\hat{p}}(\mathbf{x}))^2\}+2\left(\bar{\hat{p}}(\mathbf{x})-p(\mathbf{x})\right)E\{\hat{p}(\mathbf{x})-\bar{\hat{p}}(\mathbf{x})\}+\left(\bar{\hat{p}}(\mathbf{x})-p(\mathbf{x})\right)^2`,
        why: md`Si eleva al quadrato con $(a+b)^2 = a^2 + 2ab + b^2$ e si prende il valore atteso. Il termine $\bar{\hat{p}}(\mathbf{x})-p(\mathbf{x})$ non dipende dai campioni (fissato $\mathbf{x}$ è un numero), quindi esce dal valore atteso.`,
      },
      {
        latex: md`E\{\hat{p}(\mathbf{x})-\bar{\hat{p}}(\mathbf{x})\}=E\{\hat{p}(\mathbf{x})\}-\bar{\hat{p}}(\mathbf{x})=0`,
        why: md`Il doppio prodotto si annulla: per definizione di media, lo scarto medio dalla media è zero. Restano solo varianza e bias al quadrato.`,
      },
      {
        latex: md`E\{(\hat{p}(\mathbf{x})-p(\mathbf{x}))^2\}=\left(E\{\hat{p}(\mathbf{x})\}-p(\mathbf{x})\right)^2+E\{(\hat{p}(\mathbf{x})-\bar{\hat{p}}(\mathbf{x}))^2\}`,
        why: md`Scomposizione dell'errore quadratico medio (*mean squared error*) in bias al quadrato più varianza (modulo m04): la stima converge in media quadratica se entrambi i termini vanno a zero.`,
      },
      {
        latex: md`h_N\to 0\ \Rightarrow\ E\{\hat{p}(\mathbf{x})\}\to p(\mathbf{x})\ \Rightarrow\ \text{bias}^2\to 0`,
        why: md`Prima condizione: è la non distorsione asintotica di [«non distorsione asintotica»](#derivation:der05) (*the window width shrinks to eliminate bias*, part1 p43).`,
      },
      {
        latex: md`N h_N^n\to+\infty\ \Rightarrow\ \frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}\to 0\ \Rightarrow\ \text{varianza}\to 0`,
        why: md`Seconda condizione: il denominatore del bound di [«bound sulla varianza»](#derivation:der06) diverge, mentre il numeratore resta limitato perché $\sup\gamma$ è finito e $\bar{\hat{p}}(\mathbf{x}) \to p(\mathbf{x})$.`,
      },
      {
        latex: md`P\{|\hat{p}(\mathbf{x})-p(\mathbf{x})|\ge\delta\}=P\{(\hat{p}(\mathbf{x})-p(\mathbf{x}))^2\ge\delta^2\}`,
        why: md`Verso la definizione di consistenza: l'evento «errore di almeno $\delta$» coincide con l'evento «errore al quadrato di almeno $\delta^2$».`,
      },
      {
        latex: md`P\{|\hat{p}(\mathbf{x})-p(\mathbf{x})|\ge\delta\}\le\frac{E\{(\hat{p}(\mathbf{x})-p(\mathbf{x}))^2\}}{\delta^2}\xrightarrow[N\to+\infty]{}0\quad\Longrightarrow\quad\lim_{N\to+\infty}P\{|\hat{p}(\mathbf{x})-p(\mathbf{x})|<\delta\}=1\quad\forall\,\delta>0`,
        why: md`Disuguaglianza di Chebyshev (Markov applicata a $(\hat{p}-p)^2$): se l'errore quadratico medio tende a zero, la probabilità di sbagliare di almeno $\delta$ tende a zero. Si ritrova la definizione di stima consistente dei moduli m03-m04, $\lim P\{\vert\varepsilon\vert < \delta\} = 1$ con $\varepsilon = \hat{p}(\mathbf{x}) - p(\mathbf{x})$: le due condizioni di slide p61 sono sufficienti per la consistenza nel senso del corso.`,
      },
      {
        latex: md`h_N=\frac{1}{\sqrt[2n]{N}}=N^{-1/(2n)}\to 0,\qquad N h_N^n=N\cdot N^{-1/2}=\sqrt{N}\to+\infty`,
        why: md`L'esempio del riquadro di slide p61 soddisfa entrambe le condizioni in qualunque dimensione $n$: $h_N^n = N^{-n/(2n)} = N^{-1/2}$.`,
      },
      {
        latex: md`n=1,\ h_N=\frac{h_1}{\sqrt{N}}:\qquad N h_N=h_1\sqrt{N}\to+\infty`,
        why: md`La legge degli esempi 1-D delle slide p62-63 è l'esempio precedente con $n = 1$, a meno della costante $h_1$: soddisfa le condizioni.`,
      },
      {
        latex: md`n=2,\ h_N=\frac{h_1}{N}:\qquad N h_N^2=\frac{h_1^2}{N}\to 0`,
        why: md`Controllo critico: la legge $h_1/N$ scritta sulla slide p64 per il caso 2-D NON soddisfa la seconda condizione. La figura è tratta da Duda-Hart, che usa $h_1$ diviso la radice quadrata del numero di campioni (attenzione: Duda-Hart chiama $n$ il numero di campioni, cioè la $N$ di Melgani, e $d$ la dimensione, cioè la $n$ di Melgani). Da segnalare come refuso o semplificazione della slide.`,
      },
      {
        latex: md`n=2,\ h_N=\frac{h_1}{\sqrt{N}}:\qquad N h_N^2=h_1^2\ \text{costante}`,
        why: md`Anche la legge di Duda-Hart, portata in 2-D, sta sul bordo: $N h_N^2$ non diverge e il bound sulla varianza non si annulla. Con $n = 2$ serve una legge più lenta.`,
      },
      {
        latex: md`n=2,\ h_N=\frac{h_1}{\sqrt[4]{N}}:\qquad h_N\to 0,\qquad N h_N^2=h_1^2\sqrt{N}\to+\infty`,
        why: md`Correzione costruttiva: in 2-D la legge dell'esempio di slide p61 ($h_N \propto N^{-1/(2n)}$ con $n = 2$) soddisfa entrambe le condizioni, a differenza di $h_1/N$ ($N h_N^2 \to 0$) e di $h_1/\sqrt{N}$ ($N h_N^2$ costante). Legge ricostruita, non scritta nella fonte.`,
      },
    ],
    conclusion: md`Le due condizioni di slide p61 bastano per la consistenza: $h_N \to 0$ spegne il bias, $N h_N^n \to +\infty$ spegne la varianza, e per Chebyshev l'errore va a zero in probabilità. $h_N$ deve scendere, ma non troppo in fretta: se si stringe troppo in fretta (*shrinks too quickly*) la stima resta molto variabile, se troppo piano (*too slowly*) resta sfocata (part1 p43). La legge $h_1/\sqrt{N}$ degli esempi 1-D rispetta le condizioni; la legge $h_1/N$ scritta sulla slide p64 per il caso 2-D no.`,
    source: [{ doc: 'ch2', page: 61 }, { doc: 'ch2', page: 62 }, { doc: 'ch2', page: 64 }, { doc: 'part1', page: 43 }],
  },

  // --- der08 Kernel gaussiano sferico di Specht --------------------------------------------------------
  {
    id: 'der08',
    title: 'Dalla formula generale al kernel gaussiano a simmetria sferica (Specht)',
    goal: md`Ottenere la formula di slide p65 sostituendo nella stima generale un kernel normale standard $n$-dimensionale, con larghezza $h = \sigma$.`,
    assumptions: md`Stima generale di [«dal conteggio alla stima di Parzen»](#derivation:der01) con $V(h) = h^n$. Kernel gaussiano a simmetria sferica (*Gaussian kernel with spherical symmetry*): densità normale standard in $n$ dimensioni ([«dal kernel 1-D al kernel n-D»](#derivation:der12)). La larghezza è la deviazione standard $\sigma$ del kernel, uguale lungo tutte le feature.`,
    steps: [
      {
        latex: md`\gamma(\mathbf{u})=\frac{1}{(2\pi)^{n/2}}\exp\left(-\frac{\|\mathbf{u}\|^2}{2}\right)`,
        why: md`Kernel: densità normale standard in $n$ dimensioni (media nulla, covarianza identità). Dipende da $\mathbf{u}$ solo attraverso la norma, quindi ha simmetria sferica.`,
      },
      {
        latex: md`h=\sigma,\qquad V(h)=\sigma^n`,
        why: md`La deviazione standard $\sigma$ fa da larghezza $h$; il volume di normalizzazione è $\sigma^n$.`,
      },
      {
        latex: md`\left\|\frac{\mathbf{x}-\mathbf{x}_k}{\sigma}\right\|^2=\frac{\|\mathbf{x}-\mathbf{x}_k\|^2}{\sigma^2}`,
        why: md`Con $\sigma > 0$ la norma di un vettore diviso per $\sigma$ è la norma divisa per $\sigma$; al quadrato compare $\sigma^2$.`,
      },
      {
        latex: md`\frac{1}{\sigma^n}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{\sigma}\right)=\frac{1}{\sigma^n(2\pi)^{n/2}}\exp\left(-\frac{\|\mathbf{x}-\mathbf{x}_k\|^2}{2\sigma^2}\right)`,
        why: md`Si sostituisce l'argomento $(\mathbf{x}-\mathbf{x}_k)/\sigma$ nel kernel e si divide per il volume $\sigma^n$.`,
      },
      {
        latex: md`\sigma^n(2\pi)^{n/2}=(2\pi\sigma^2)^{n/2}`,
        why: md`Si raccolgono le costanti di normalizzazione in un'unica potenza: $\sigma^n = (\sigma^2)^{n/2}$, e il prodotto di due potenze con lo stesso esponente $n/2$ è la potenza del prodotto.`,
      },
      {
        latex: md`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\|\mathbf{x}-\mathbf{x}_k\|^2}{2\sigma^2}\right)`,
        why: md`Media sugli $N$ campioni: è la formula di slide p65 (metodo di Specht, *Specht method*).`,
      },
      {
        latex: md`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\mathcal{N}(\mathbf{x};\,\mathbf{x}_k,\,\sigma^2\mathbf{I})`,
        why: md`Lettura: ogni addendo è una densità normale centrata su $\mathbf{x}_k$ con covarianza $\sigma^2\mathbf{I}$. La stima è una mistura di $N$ gaussiane con pesi uguali $1/N$ e un solo parametro libero, $\sigma$ (*the only hyperparameter*, part1 p45). Siccome $\sigma$ è la stessa lungo tutte le feature, le feature vanno normalizzate prima della stima (*to normalize them*, slide p65).`,
      },
      {
        latex: md`\sigma_k=\frac{1}{L}\sum_{l=1}^{L}\|\mathbf{x}_k-\mathbf{y}_l\|\ \Rightarrow\ \hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma_k^2)^{n/2}}\exp\left(-\frac{\|\mathbf{x}-\mathbf{x}_k\|^2}{2\sigma_k^2}\right)`,
        why: md`Variante adattiva (*adaptive way*, slide p65-66): ogni campione $\mathbf{x}_k$ riceve la sua $\sigma_k$, distanza euclidea media dai suoi $L$ vicini più prossimi $\mathbf{y}_1,\dots,\mathbf{y}_L$. Dove i campioni sono densi $\sigma_k$ è piccola, dove sono radi è grande. La fonte definisce $\sigma_k$ ma non riscrive la stima: questa forma si ottiene mettendo $\sigma_k$ al posto di $\sigma$ nel $k$-esimo addendo. Ogni addendo resta una densità, quindi anche la stima.`,
      },
    ],
    conclusion: md`La stima di Specht è una mistura di $N$ gaussiane sferiche con pesi uguali, centrate sui campioni. $\sigma$ è il parametro di smoothing: troppo grande sfoca la stima (*under-fitting*), troppo piccola la riduce a picchi sui campioni (*over-fitting*). Si implementa con le reti neurali probabilistiche (*Probabilistic Neural Networks*, PNN, part1 p45).`,
    source: [{ doc: 'ch2', page: 65 }, { doc: 'ch2', page: 66 }, { doc: 'part1', page: 44 }, { doc: 'part1', page: 45 }],
  },

  // --- der09 I sei kernel sono densità -------------------------------------------------------------------
  {
    id: 'der09',
    title: 'Verifica: i sei kernel delle slide sono densità valide (area 1) e loro estremo superiore',
    goal: md`Controllare che ciascuno dei sei kernel delle slide p58-59 soddisfi $\int\gamma = 1$ (condizione di slide p54) e calcolarne l'estremo superiore $\sup(\gamma)$, che entra nel bound sulla varianza ([«bound sulla varianza»](#derivation:der06)). Verifica non presente nella fonte.`,
    assumptions: md`Definizioni standard: $\Pi(x) = 1$ per $\vert x\vert \le 1/2$ e 0 altrove; $\Lambda(x) = 1-\vert x\vert$ per $\vert x\vert \le 1$ e 0 altrove. Tutti e sei i kernel sono non negativi, come si vede dalle formule.`,
    steps: [
      {
        latex: md`\int\Pi(x)\,dx=1\cdot 1=1,\qquad \sup=1`,
        why: md`Rettangolo di base 1 (da $-1/2$ a $1/2$) e altezza 1. Con l'altezza $1/2$ suggerita dall'etichetta del grafico di slide p58 l'area sarebbe $1/2$: l'etichetta va letta con cautela.`,
      },
      {
        latex: md`\int\Lambda(x)\,dx=\tfrac{1}{2}\cdot 2\cdot 1=1,\qquad \sup=1`,
        why: md`Triangolo di base 2 (da $-1$ a $1$) e altezza 1, come nel grafico della slide: area uguale a metà base per altezza.`,
      },
      {
        latex: md`\left(\int_{-\infty}^{+\infty}e^{-x^2/2}\,dx\right)^2=\int_{0}^{2\pi}\!\!\int_{0}^{+\infty}e^{-r^2/2}\,r\,dr\,d\theta=2\pi`,
        why: md`Integrale gaussiano. Il quadrato dell'integrale è un integrale doppio sul piano; in coordinate polari $e^{-x^2/2}e^{-y^2/2}=e^{-r^2/2}$, e il fattore $r$ dello jacobiano rende la primitiva elementare: $\int_0^{+\infty}e^{-r^2/2}r\,dr = 1$. Quindi $\int e^{-x^2/2}\,dx = \sqrt{2\pi}$.`,
      },
      {
        latex: md`\int\frac{1}{\sqrt{2\pi}}e^{-x^2/2}dx=1,\qquad \sup=\frac{1}{\sqrt{2\pi}}\approx 0.399`,
        why: md`È la densità normale standard: il fattore $1/\sqrt{2\pi}$ è la costante di normalizzazione. Il massimo è nell'origine.`,
      },
      {
        latex: md`\int\tfrac{1}{2}e^{-|x|}dx=\tfrac{1}{2}\cdot 2\int_0^{+\infty}e^{-x}dx=1,\qquad \sup=\tfrac{1}{2}`,
        why: md`Funzione pari: due volte l'integrale sul semiasse positivo, che vale 1; il fattore $1/2$ normalizza.`,
      },
      {
        latex: md`\int\frac{1}{\pi}\frac{dx}{1+x^2}=\frac{1}{\pi}\Big[\arctan x\Big]_{-\infty}^{+\infty}=1,\qquad \sup=\frac{1}{\pi}\approx 0.318`,
        why: md`La primitiva è l'arcotangente, che va da $-\pi/2$ a $\pi/2$ e varia quindi di $\pi$: il fattore $1/\pi$ normalizza.`,
      },
      {
        latex: md`\int_{-\infty}^{+\infty}\frac{\sin^2 u}{u^2}\,du=\int_{-\infty}^{+\infty}\frac{\sin 2u}{u}\,du=\int_{-\infty}^{+\infty}\frac{\sin t}{t}\,dt=\pi`,
        why: md`Integrale notevole di $\text{sinc}^2$. Per parti, con $-1/u$ primitiva di $1/u^2$: il termine di bordo $-\sin^2 u/u$ si annulla agli estremi e la derivata di $\sin^2 u$ è $\sin 2u$. Con $t = 2u$ resta l'integrale di Dirichlet, che vale $\pi$.`,
      },
      {
        latex: md`\int\frac{1}{2\pi}\left(\frac{\sin(x/2)}{x/2}\right)^2dx=\frac{1}{2\pi}\cdot 2\int\left(\frac{\sin u}{u}\right)^2du=\frac{1}{2\pi}\cdot 2\pi=1,\qquad \sup=\frac{1}{2\pi}\approx 0.159`,
        why: md`Sostituzione $u = x/2$ ($dx = 2\,du$) e integrale del passo precedente, che vale $\pi$: il fattore $1/(2\pi)$ normalizza. Il massimo è nell'origine, dove $\sin(x/2)/(x/2) \to 1$.`,
      },
      {
        latex: md`\Pi:\ \text{discontinuo in } x=\pm\tfrac{1}{2};\qquad \Lambda,\ \text{gaussiano},\ \text{esponenziale},\ \text{Cauchy},\ \text{sinc}^2:\ \text{continui};\qquad \text{tutti: massimo in } x=0,\ \gamma(x)\to 0`,
        why: md`Controllo delle tre condizioni per una stima «buona» di slide p54. Tutti raggiungono il massimo nell'origine e tendono a zero; il rettangolare non è continuo e dà stime a gradini. L'esponenziale è continuo ma ha una cuspide nell'origine; il Cauchy scende come $1/(\pi x^2)$, con code pesanti (*heavy tails*); il $\text{sinc}^2$ tocca lo zero e risale in lobi laterali.`,
      },
    ],
    conclusion: md`Tutti e sei i kernel sono densità: con $V = h^n$ danno stime che integrano a 1 ([«la stima è una densità»](#derivation:der02)). Estremi superiori: $1$ per rettangolare e triangolare, $1/\sqrt{2\pi} \approx 0.399$ per il gaussiano, $1/2$ per l'esponenziale, $1/\pi \approx 0.318$ per il Cauchy, $1/(2\pi) \approx 0.159$ per il $\text{sinc}^2$. Il grafico del rettangolare di slide p58 porta l'etichetta 1/2 accanto all'altezza: con supporto $[-1/2, 1/2]$ l'area sarebbe $1/2$, quindi quell'etichetta non è l'altezza di una densità.`,
    source: [{ doc: 'ch2', page: 58 }, { doc: 'ch2', page: 59 }, { doc: 'ch2', page: 54 }, { doc: 'part1', page: 40 }, { doc: 'part1', page: 41 }],
  },

  // --- der10 Leggi a potenza consistenti -------------------------------------------------------------------
  {
    id: 'der10',
    title: 'Quali leggi di potenza h_N = h_1·N^(−a) sono consistenti: l\'intervallo 0 < a < 1/n',
    goal: md`Tradurre le due condizioni di consistenza di slide p61 in un vincolo sull'esponente $a$ della legge $h_N = h_1 N^{-a}$, e collocare rispetto a quel vincolo l'esempio di Melgani e le leggi scritte sulle figure.`,
    assumptions: md`Legge a potenza $h_N = h_1 N^{-a}$ con $h_1 > 0$ (la larghezza usata con un solo campione) ed esponente reale $a$. Le condizioni sono quelle di slide p61. I passaggi sono una verifica ricostruita, non scritta nella fonte: rendono precisa la frase delle note «$h_N$ shrinks too quickly / too slowly» (part1 p43).`,
    steps: [
      {
        latex: md`h_N=h_1\,N^{-a},\qquad h_1>0`,
        why: md`Si considera la famiglia delle leggi a potenza, a cui appartengono sia l'esempio di slide p61 sia le leggi delle figure p62-64.`,
      },
      {
        latex: md`\lim_{N\to+\infty}h_N=0\iff a>0`,
        why: md`Prima condizione (toglie il bias): una potenza negativa di $N$ tende a zero se e solo se l'esponente $a$ è positivo. Con $a = 0$ ($h$ costante) la finestra non si chiude mai e la sfocatura resta.`,
      },
      {
        latex: md`N\left(h_1N^{-a}\right)^n=N\,h_1^n\,N^{-an}`,
        why: md`Si sostituisce la legge nel prodotto $N h_N^n$: la potenza di un prodotto è il prodotto delle potenze.`,
      },
      {
        latex: md`N h_N^n=h_1^n\,N^{\,1-an}`,
        why: md`Si sommano gli esponenti di $N$. Il prodotto $N h_N^n$, moltiplicato per $p(\mathbf{x})$, è circa il numero atteso di campioni nella finestra e compare al denominatore del bound sulla varianza ([«bound sulla varianza»](#derivation:der06)).`,
      },
      {
        latex: md`\lim_{N\to+\infty}N h_N^n=+\infty\iff 1-an>0\iff a<\frac{1}{n}`,
        why: md`Seconda condizione (toglie la varianza): la potenza $N^{1-an}$ diverge se e solo se l'esponente $1 - an$ è positivo. Se $a \ge 1/n$ la finestra si stringe più in fretta di quanto arrivino nuovi campioni: il numero atteso di campioni al suo interno resta costante ($a = 1/n$) o va a zero ($a > 1/n$).`,
      },
      {
        latex: md`0<a<\frac{1}{n}`,
        why: md`Le due condizioni insieme: $h_N$ deve andare a zero, ma più lentamente di $N^{-1/n}$.`,
      },
      {
        latex: md`n=1:\ 0<a<1,\qquad n=2:\ 0<a<\tfrac{1}{2},\qquad n=10:\ 0<a<\tfrac{1}{10}`,
        why: md`L'intervallo valido si restringe al crescere della dimensione $n$: in alta dimensione la finestra può chiudersi solo molto lentamente.`,
      },
      {
        latex: md`a=\frac{1}{2n}\ \Rightarrow\ N h_N^n=h_1^n\sqrt{N}\to+\infty`,
        why: md`L'esempio del riquadro di slide p61 sceglie il punto medio dell'intervallo: $N h_N^n$ cresce come $\sqrt{N}$ in qualunque dimensione.`,
      },
      {
        latex: md`n=1,\ a=\tfrac{1}{2}:\ \text{valida}\qquad n=2,\ a=1:\ N h_N^2=\frac{h_1^2}{N}\to 0\qquad n=2,\ a=\tfrac{1}{2}:\ N h_N^2=h_1^2\ \text{costante}`,
        why: md`Controllo delle figure: la legge $h_1/\sqrt{N}$ delle slide p62-63 ($n = 1$) è valida. La legge $h_1/N$ scritta sulla slide p64 ($n = 2$) è fuori dall'intervallo: si stringe troppo in fretta (*shrinks too quickly*) e la varianza resta alta. Anche $h_1/\sqrt{N}$ in 2-D sarebbe sul bordo, con $N h_N^2$ costante e varianza che non si annulla.`,
      },
    ],
    conclusion: md`Una legge $h_N = h_1 N^{-a}$ è consistente se e solo se $0 < a < 1/n$. Con $a$ troppo piccolo (al limite $a = 0$, $h$ costante) la finestra si chiude troppo piano e resta il bias; con $a \ge 1/n$ la finestra non raccoglie abbastanza campioni e la varianza non scende. L'esempio di Melgani, $a = 1/(2n)$, sta a metà dell'intervallo.`,
    source: [{ doc: 'ch2', page: 61 }, { doc: 'part1', page: 43 }, { doc: 'ch2', page: 62 }, { doc: 'ch2', page: 64 }],
  },

  // --- der11 Sfocatura in forma chiusa (gaussiana * gaussiana) -------------------------------------------
  {
    id: 'der11',
    title: 'Sfocatura in forma chiusa: pdf vera gaussiana e kernel gaussiano',
    goal: md`Rendere quantitativa la frase «The estimate mean is a blurred version of the true $p(\mathbf{x})$!» di slide p60 nel caso 1-D in cui pdf vera e kernel sono entrambi gaussiani: la media della stima è ancora una gaussiana, con varianza aumentata di $h^2$.`,
    assumptions: md`Caso 1-D. Pdf vera normale $\mathcal{N}(\mu,\sigma^2)$, kernel normale standard riscalato con larghezza $h$. Attenzione ai simboli: qui $\sigma$ è la deviazione standard della pdf vera e la larghezza del kernel si chiama $h$; nella formula di Specht (slide p65, [«il kernel gaussiano sferico»](#derivation:der08)) $\sigma$ è invece la larghezza del kernel. Esempio costruito, non presente nella fonte.`,
    steps: [
      {
        latex: md`p(x)=\mathcal{N}(x;\mu,\sigma^2),\qquad \frac{1}{h}\gamma\left(\frac{x}{h}\right)=\mathcal{N}(x;0,h^2)`,
        why: md`Ipotesi dell'esempio: densità vera normale e kernel normale standard. Riscalato con larghezza $h$, il kernel è una normale di media nulla e deviazione standard $h$.`,
      },
      {
        latex: md`E\{\hat{p}(x)\}=\mathcal{N}(x;\mu,\sigma^2)*\mathcal{N}(x;0,h^2)`,
        why: md`È il risultato di slide p60 ([«la media della stima è una convoluzione»](#derivation:der04)) applicato a questo caso: la media della stima è la convoluzione tra pdf vera e kernel riscalato.`,
      },
      {
        latex: md`f_{X+hZ}(x)=\int_{-\infty}^{+\infty}p(v)\,\frac{1}{h}\gamma\left(\frac{x-v}{h}\right)dv`,
        why: md`Densità di una somma: fissato $X = v$, la variabile $v + hZ$ è normale di media $v$ e deviazione standard $h$, con densità $\frac{1}{h}\gamma\left(\frac{x-v}{h}\right)$. Si media su $v$ con peso $p(v)$ e si ottiene la convoluzione del passo precedente.`,
      },
      {
        latex: md`X\sim p,\ Z\sim\gamma\ \text{indipendenti}\ \Rightarrow\ X+hZ\ \text{ha densità}\ \ p(x)*\frac{1}{h}\gamma\left(\frac{x}{h}\right)`,
        why: md`Interpretazione probabilistica della convoluzione: la media della stima è la densità del dato vero «sporcato» da un rumore indipendente di scala $h$. Ecco che cosa vuol dire sfocatura.`,
      },
      {
        latex: md`X+hZ\sim\mathcal{N}(\mu,\ \sigma^2+h^2)`,
        why: md`La somma di due gaussiane indipendenti è gaussiana, con media somma delle medie ($\mu + 0$) e varianza somma delle varianze ($\sigma^2 + h^2$).`,
      },
      {
        latex: md`E\{\hat{p}(x)\}=\frac{1}{\sqrt{2\pi(\sigma^2+h^2)}}\exp\left(-\frac{(x-\mu)^2}{2(\sigma^2+h^2)}\right)`,
        why: md`Forma esplicita: stessa media $\mu$, ma campana più larga e più bassa di quella vera.`,
      },
      {
        latex: md`\frac{E\{\hat{p}(\mu)\}}{p(\mu)}=\frac{\sigma}{\sqrt{\sigma^2+h^2}}<1`,
        why: md`Misura del bias nel punto di massimo: il picco si abbassa del fattore $\sigma/\sqrt{\sigma^2+h^2}$. Il rapporto non dipende da $N$: a $h$ fisso, raccogliere più campioni non toglie la sfocatura.`,
      },
      {
        latex: md`\sigma=1:\quad h=1\ \Rightarrow\ \frac{1}{\sqrt{2}}\approx 0.707,\qquad h=0.5\ \Rightarrow\ \frac{1}{\sqrt{1.25}}\approx 0.894`,
        why: md`Numeri: con pdf vera normale standard e $h = 1$ il picco medio della stima è il 71% di quello vero; con $h = 0.5$ è l'89%. Per qualunque $N$.`,
      },
      {
        latex: md`h\to 0\ \Rightarrow\ \sigma^2+h^2\to\sigma^2\ \Rightarrow\ E\{\hat{p}(x)\}\to p(x)`,
        why: md`Non distorsione asintotica in forma chiusa: quando la finestra si chiude la varianza aggiunta $h^2$ sparisce e la media della stima torna a coincidere con la pdf vera (slide p60, $h_N \to 0$).`,
      },
    ],
    conclusion: md`Con pdf vera e kernel gaussiani la media della stima è $\mathcal{N}(\mu, \sigma^2 + h^2)$: stessa posizione, campana più larga e più bassa. Il bias è il prezzo della larghezza $h$ e sparisce solo se $h \to 0$ ([«non distorsione asintotica»](#derivation:der05)), qualunque sia $N$.`,
    source: [{ doc: 'ch2', page: 60 }, { doc: 'part1', page: 42 }],
  },

  // --- der12 Dal gaussiano 1-D al kernel sferico n-D -----------------------------------------------------
  {
    id: 'der12',
    title: 'Dal kernel gaussiano 1-D di slide p58 al kernel sferico n-D di slide p65: prodotto di n campane',
    goal: md`Colmare il salto tra i kernel scalari delle slide p58-59 e la formula $n$-dimensionale di slide p65: il kernel a simmetria sferica è il prodotto di $n$ kernel gaussiani 1-D, soddisfa tutte le condizioni di slide p54 e ha estremo superiore $(2\pi)^{-n/2}$.`,
    assumptions: md`Kernel gaussiano scalare di slide p58 (densità normale standard), una copia per feature. Ponte ricostruito, non scritto nella fonte.`,
    steps: [
      {
        latex: md`\gamma_1(u)=\frac{1}{\sqrt{2\pi}}\exp\left(-\frac{u^2}{2}\right)`,
        why: md`Punto di partenza: il kernel gaussiano scalare di slide p58, densità normale standard.`,
      },
      {
        latex: md`\gamma(\mathbf{u})=\prod_{j=1}^{n}\gamma_1(u_j)=\frac{1}{(2\pi)^{n/2}}\exp\left(-\frac{1}{2}\sum_{j=1}^{n}u_j^2\right)`,
        why: md`In $n$ dimensioni si prende il prodotto di $n$ copie, una per feature: è la densità di $n$ variabili normali standard indipendenti. Il prodotto di $n$ fattori $1/\sqrt{2\pi}$ dà $1/(2\pi)^{n/2}$, e il prodotto di esponenziali è l'esponenziale della somma.`,
      },
      {
        latex: md`\sum_{j=1}^{n}u_j^2=\|\mathbf{u}\|^2\ \Rightarrow\ \gamma(\mathbf{u})=\frac{1}{(2\pi)^{n/2}}\exp\left(-\frac{\|\mathbf{u}\|^2}{2}\right)`,
        why: md`La somma dei quadrati delle componenti è il quadrato della norma euclidea: il kernel dipende da $\mathbf{u}$ solo attraverso la norma, quindi le curve di livello sono ipersfere. Ecco che cosa vuol dire simmetria sferica (*spherical symmetry*).`,
      },
      {
        latex: md`\gamma(\mathbf{u})\ge 0\quad \forall\,\mathbf{u}\in\Re^n,\qquad \int_{\Re^n}\gamma(\mathbf{u})\,d\mathbf{u}=\prod_{j=1}^{n}\int_{-\infty}^{+\infty}\gamma_1(u_j)\,du_j=1`,
        why: md`Verifica delle due condizioni di densità di slide p54: la non negatività è evidente; l'integrale su $\Re^n$ di un prodotto di funzioni di una variabile si fattorizza (teorema di Fubini) in $n$ integrali scalari, ciascuno uguale a 1 ([«i sei kernel sono densità»](#derivation:der09)).`,
      },
      {
        latex: md`\sup(\gamma(\cdot))=\gamma(\mathbf{0})=\frac{1}{(2\pi)^{n/2}},\qquad \lim_{\|\mathbf{u}\|\to+\infty}\gamma(\mathbf{u})=0`,
        why: md`Verifica delle tre condizioni per una stima «buona»: massimo nell'origine (l'esponente si annulla solo lì), continuità (composizione di funzioni continue), decadimento a zero al crescere della norma. Il massimo è anche l'estremo superiore che entra nel bound sulla varianza.`,
      },
      {
        latex: md`\mathbf{u}=\frac{\mathbf{x}-\mathbf{x}_k}{\sigma},\ V(h)=\sigma^n\ \Rightarrow\ \frac{1}{\sigma^n}\gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{\sigma}\right)=\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\|\mathbf{x}-\mathbf{x}_k\|^2}{2\sigma^2}\right)`,
        why: md`Con l'argomento centrato sul campione e riscalato con $\sigma$, diviso per il volume $V = \sigma^n$, si ottiene esattamente l'addendo della formula di Specht di slide p65 (stessa algebra di [«il kernel gaussiano sferico»](#derivation:der08)).`,
      },
      {
        latex: md`E\left\{\left(\hat{p}(\mathbf{x})-\bar{\hat{p}}(\mathbf{x})\right)^2\right\}\le\frac{\bar{\hat{p}}(\mathbf{x})}{(2\pi)^{n/2}\,N\,\sigma^n}`,
        why: md`Il bound di slide p61 specializzato al kernel sferico ($h_N = \sigma$, $\sup(\gamma) = (2\pi)^{-n/2}$). Il denominatore vale $N\left(\sqrt{2\pi}\,\sigma\right)^n$: con finestre strette ($\sigma < 0.4$ in unità normalizzate, cioè $\sqrt{2\pi}\,\sigma < 1$) cala geometricamente al crescere di $n$.`,
      },
      {
        latex: md`\sigma=0.2:\qquad \left(\sqrt{2\pi}\,\sigma\right)^n\approx 0.501\ \ (n=1),\qquad \approx 0.001\ \ (n=10)`,
        why: md`Numeri indicativi, perché anche $\bar{\hat{p}}(\mathbf{x})$ cambia con $n$: a parità di $N$ e di media della stima, passare da 1 a 10 feature moltiplica il bound per circa 500. Per tenere lo stesso bound servono circa 500 volte più campioni.`,
      },
    ],
    conclusion: md`Il kernel sferico di Specht è il prodotto di $n$ kernel gaussiani 1-D: soddisfa le due condizioni di densità e le tre di una stima «buona» di slide p54, e con il suo estremo superiore $(2\pi)^{-n/2}$ il bound sulla varianza diventa $\bar{\hat{p}}(\mathbf{x})/\left((2\pi)^{n/2}N\sigma^n\right)$. Con finestre strette il denominatore cala al crescere di $n$: in alta dimensione servono molti più campioni.`,
    source: [{ doc: 'ch2', page: 58 }, { doc: 'ch2', page: 54 }, { doc: 'ch2', page: 65 }, { doc: 'ch2', page: 61 }, { doc: 'part1', page: 44 }],
  },
]
