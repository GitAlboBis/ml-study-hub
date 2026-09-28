// Derivazioni del foglio m07 (stima bayesiana), seconda parte: der08-der13 dell'inventario.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più rendono espliciti i conti
// che la fonte salta; notazione controllata sulle immagini di part1 p26-30 e ch2 p34-40.
// der08-der10: pagina di confine con il modello gaussiano (part1 p26), le note danno i risultati senza passaggi.
// der11-der13: passaggi ricostruiti dal verificatore, non scritti nelle fonti, a partire dalle equazioni di slide p37 e p39.
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivationsB: Derivation[] = [
  // --- der08 Le due forme della stima ML della covarianza -----------------------------------------------
  {
    id: 'der08',
    title: 'Le due forme della stima ML della covarianza coincidono',
    goal: md`Mostrare l'uguaglianza che le note (part1 p26) scrivono senza passaggi: la media dei prodotti esterni (*outer products*) degli scarti dalla media stimata è uguale alla media dei prodotti esterni dei campioni meno $\hat{\mathbf{m}}\hat{\mathbf{m}}^t$.`,
    assumptions: md`$N$ campioni $\mathbf{x}_1,\dots,\mathbf{x}_N \in \Re^n$, scritti come vettori colonna, e la stima ML del vettore medio $\hat{\mathbf{m}}$. L'uguaglianza è un'identità algebrica: vale per qualunque insieme di campioni, senza ipotesi sulla loro distribuzione.`,
    steps: [
      {
        latex: md`\hat{\mathbf{m}}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k`,
        why: md`Stima ML del vettore medio (prima riga di part1 p26): la media aritmetica dei campioni. Serve due volte: per definire gli scarti e, alla fine, per far sparire i termini misti.`,
      },
      {
        latex: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t`,
        why: md`Definizione della stima ML della matrice di covarianza, prima forma delle note. Ogni addendo è un prodotto esterno: un vettore colonna $n \times 1$ per un vettore riga $1 \times n$ dà una matrice $n \times n$.`,
      },
      {
        latex: md`(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t=\mathbf{x}_k\mathbf{x}_k^t-\mathbf{x}_k\hat{\mathbf{m}}^t-\hat{\mathbf{m}}\mathbf{x}_k^t+\hat{\mathbf{m}}\hat{\mathbf{m}}^t`,
        why: md`Un addendo alla volta. La trasposta di una differenza è la differenza delle trasposte, $(\mathbf{x}_k-\hat{\mathbf{m}})^t=\mathbf{x}_k^t-\hat{\mathbf{m}}^t$; poi si applica la proprietà distributiva. Il prodotto di matrici non è commutativo: i due termini misti $\mathbf{x}_k\hat{\mathbf{m}}^t$ e $\hat{\mathbf{m}}\mathbf{x}_k^t$ sono uno il trasposto dell'altro, in generale diversi, e restano separati. In una dimensione diventerebbero insieme $-2x_k\hat{m}$.`,
      },
      {
        latex: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^t-\Big(\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\Big)\hat{\mathbf{m}}^t-\hat{\mathbf{m}}\Big(\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\Big)^t+\hat{\mathbf{m}}\hat{\mathbf{m}}^t`,
        why: md`Si somma su $k$ e si divide per $N$, termine per termine. $\hat{\mathbf{m}}$ non dipende da $k$ ed esce dalla sommatoria: a destra nel secondo termine, a sinistra nel terzo (l'ordine dei fattori va rispettato). Nel terzo si usa $\sum_k \mathbf{x}_k^t = \left(\sum_k \mathbf{x}_k\right)^t$. L'ultimo termine è costante: $\frac{1}{N}\sum_{k=1}^{N}\hat{\mathbf{m}}\hat{\mathbf{m}}^t=\frac{1}{N}\cdot N\,\hat{\mathbf{m}}\hat{\mathbf{m}}^t=\hat{\mathbf{m}}\hat{\mathbf{m}}^t$.`,
      },
      {
        latex: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^t-\hat{\mathbf{m}}\hat{\mathbf{m}}^t-\hat{\mathbf{m}}\hat{\mathbf{m}}^t+\hat{\mathbf{m}}\hat{\mathbf{m}}^t=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^t-\hat{\mathbf{m}}\hat{\mathbf{m}}^t`,
        why: md`Le due parentesi sono proprio $\hat{\mathbf{m}}$: i due termini misti valgono entrambi $-\hat{\mathbf{m}}\hat{\mathbf{m}}^t$, uno si cancella con $+\hat{\mathbf{m}}\hat{\mathbf{m}}^t$ e resta la seconda forma delle note. Nelle note l'ultimo termine ha un unico cappello largo sopra «mm» con l'apice $t$: va letto $\hat{\mathbf{m}}\hat{\mathbf{m}}^t$.`,
      },
      {
        latex: md`n=1:\qquad\hat{\sigma}^2=\frac{1}{N}\sum_{k=1}^{N}(x_k-\hat{m})^2=\frac{1}{N}\sum_{k=1}^{N}x_k^2-\hat{m}^2`,
        why: md`In una dimensione i prodotti esterni diventano quadrati: la varianza stimata è la media dei quadrati meno il quadrato della media.`,
      },
      {
        latex: md`x=1,2,6,\;\;\hat{m}=3:\qquad\frac{(-2)^2+(-1)^2+3^2}{3}=\frac{14}{3},\qquad\frac{1^2+2^2+6^2}{3}-3^2=\frac{41}{3}-\frac{27}{3}=\frac{14}{3}`,
        why: md`Controllo numerico con tre campioni scalari: le due forme danno lo stesso valore, $14/3 \approx 4.67$.`,
      },
    ],
    conclusion: md`Le due forme sono la stessa matrice: $\hat{\Sigma}=\frac{1}{N}\sum_{k}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t=\frac{1}{N}\sum_{k}\mathbf{x}_k\mathbf{x}_k^t-\hat{\mathbf{m}}\hat{\mathbf{m}}^t$. La seconda permette di aggiornare la stima campione dopo campione accumulando solo $\sum_k \mathbf{x}_k$ e $\sum_k \mathbf{x}_k\mathbf{x}_k^t$ (al calcolatore, con valori grandi e dispersione piccola, la sottrazione perde cifre significative e si preferisce la prima). Separa inoltre i prodotti dei singoli campioni dal prodotto delle medie stimate: è il punto di partenza della dimostrazione [«perché la stima ML della covarianza è distorta»](#derivation:der10).`,
    source: [{ doc: 'part1', page: 26 }],
  },

  // --- der09 Dal fattore (N-1)/N allo stimatore non distorto --------------------------------------------
  {
    id: 'der09',
    title: 'Dal fattore (N−1)/N allo stimatore non distorto della covarianza',
    goal: md`Mostrare perché moltiplicare la stima ML della covarianza per $N/(N-1)$ la rende non distorta (*unbiased*), e che il risultato è la formula con $\frac{1}{N-1}$ delle note (part1 p26).`,
    assumptions: md`Campioni iid con vettore medio $\mathbf{m}$ e matrice di covarianza $\Sigma$; $N \ge 2$, perché si divide per $N-1$; $N$ è fissato, non aleatorio. Si parte dal valore atteso $E\{\hat{\Sigma}\}$ che le note enunciano, dimostrato in [«perché la stima ML della covarianza è distorta»](#derivation:der10).`,
    steps: [
      {
        latex: md`E\{\hat{\Sigma}\}=\frac{N-1}{N}\,\Sigma`,
        why: md`Valore atteso della stima ML riportato nelle note. In media la stima sottostima $\Sigma$, perché gli scarti sono calcolati rispetto alla media stimata $\hat{\mathbf{m}}$, che sta più vicina ai campioni della media vera $\mathbf{m}$.`,
      },
      {
        latex: md`b(\hat{\Sigma})=E\{\hat{\Sigma}\}-\Sigma=\frac{N-1}{N}\,\Sigma-\Sigma=-\frac{1}{N}\,\Sigma`,
        why: md`Il bias è il valore atteso meno il valore vero (modulo sulla bontà degli stimatori). È diverso da zero per ogni $N$ finito, quindi la stima ML è distorta; tende a zero per $N \to \infty$, quindi è asintoticamente non distorta (*asymptotically unbiased*). Sulla diagonale: ogni varianza $\sigma_j^2$ è sottostimata in media di $\sigma_j^2/N$.`,
      },
      {
        latex: md`E\{a\,\hat{\Sigma}\}=a\,E\{\hat{\Sigma}\}\qquad(a\ \text{costante})`,
        why: md`Linearità del valore atteso: una costante esce dal valore atteso. Il bias qui è un fattore moltiplicativo, quindi si corregge moltiplicando per il suo inverso, $a = N/(N-1)$.`,
      },
      {
        latex: md`E\Big\{\frac{N}{N-1}\hat{\Sigma}\Big\}=\frac{N}{N-1}\cdot\frac{N-1}{N}\,\Sigma=\Sigma`,
        why: md`Con $a = N/(N-1)$ il fattore di bias si cancella: lo stimatore corretto ha valore atteso $\Sigma$ per ogni $N \ge 2$, cioè è non distorto.`,
      },
      {
        latex: md`\frac{N}{N-1}\cdot\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t=\frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t`,
        why: md`Si semplifica $N$: lo stimatore corretto divide la somma dei prodotti esterni per $N-1$ invece che per $N$. È la formula delle note, che per lo stimatore corretto usano di nuovo il simbolo $\hat{\Sigma}$. In una dimensione è la varianza campionaria con $N-1$ della statistica (correzione di Bessel, *Bessel's correction*).`,
      },
      {
        latex: md`N=2:\ \frac{2}{1}=2,\qquad N=5:\ \frac{5}{4}=1.25,\qquad N=100:\ \frac{100}{99}\approx 1.0101,\qquad\lim_{N\to\infty}\frac{N}{N-1}=1`,
        why: md`Perché le note dicono «especially for small sample sizes» e «particularly when $N$ is small»: con due campioni la stima ML va raddoppiata, con cinque aumentata del 25%, con cento dell'1% circa. Per $N$ grande le due versioni coincidono quasi del tutto.`,
      },
      {
        latex: md`x=1,2,6:\qquad\frac{1}{3}\sum_{k=1}^{3}(x_k-\hat{m})^2=\frac{14}{3}\approx 4.67,\qquad\frac{1}{2}\sum_{k=1}^{3}(x_k-\hat{m})^2=\frac{14}{2}=7`,
        why: md`Esempio con tre campioni scalari: $\hat{m} = 3$ e la somma dei quadrati degli scarti vale 14. La versione ML dà $14/3$, quella corretta $7$: con così pochi dati il fattore $3/2$ pesa molto.`,
      },
    ],
    conclusion: md`Lo stimatore elementare non distorto è $\frac{1}{N-1}\sum_{k}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t$, cioè la stima ML moltiplicata per $N/(N-1)$. Non distorto non vuol dire migliore in ogni senso (osservazione non nelle fonti): per dati gaussiani in una dimensione la versione ML, pur distorta, ha errore quadratico medio più basso, $\frac{2N-1}{N^2}\sigma^4$ contro $\frac{2}{N-1}\sigma^4$, perché ha meno varianza. Le note scelgono la correzione per avere il valore atteso giusto quando i campioni sono pochi.`,
    source: [{ doc: 'part1', page: 26 }],
  },

  // --- der10 Perché E{Sigma_hat} = (N-1)/N Sigma --------------------------------------------------------
  {
    id: 'der10',
    title: 'Perché E{Σ̂} = ((N−1)/N)·Σ: da dove nasce la sottostima',
    goal: md`Dimostrare il valore atteso della stima ML della covarianza, che le note (part1 p26) riportano senza dimostrazione, e quindi da dove nasce il fattore di correzione $N/(N-1)$. Passaggi ricostruiti, non scritti nelle fonti.`,
    assumptions: md`Campioni $\mathbf{x}_1,\dots,\mathbf{x}_N$ indipendenti e identicamente distribuiti (*iid*) con vettore medio $\mathbf{m}$ e matrice di covarianza $\Sigma$ finiti. Non serve che siano gaussiani: il risultato vale per qualunque distribuzione con momenti del secondo ordine finiti.`,
    steps: [
      {
        latex: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^t-\hat{\mathbf{m}}\hat{\mathbf{m}}^t`,
        why: md`Seconda forma della stima ML riportata nelle note, dimostrata in [«le due forme della stima ML della covarianza coincidono»](#derivation:der08). Conviene perché separa i prodotti dei singoli campioni dal prodotto delle medie stimate: basta calcolare il valore atteso di ciascuno dei due pezzi.`,
      },
      {
        latex: md`E\{\hat{\Sigma}\}=\frac{1}{N}\sum_{k=1}^{N}E\{\mathbf{x}_k\mathbf{x}_k^t\}-E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^t\}`,
        why: md`Linearità del valore atteso, elemento per elemento della matrice: il valore atteso di una somma è la somma dei valori attesi e le costanti escono.`,
      },
      {
        latex: md`\Sigma=E\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^t\}=E\{\mathbf{x}\mathbf{x}^t\}-E\{\mathbf{x}\}\,\mathbf{m}^t-\mathbf{m}\,E\{\mathbf{x}\}^t+\mathbf{m}\mathbf{m}^t=E\{\mathbf{x}\mathbf{x}^t\}-\mathbf{m}\mathbf{m}^t`,
        why: md`Definizione di matrice di covarianza. Si sviluppa il prodotto come nelle due forme della stima e si usa $E\{\mathbf{x}\} = \mathbf{m}$: i due termini misti valgono $-\mathbf{m}\mathbf{m}^t$ e uno si cancella con $+\mathbf{m}\mathbf{m}^t$. È la versione «vera» della stessa identità: covarianza uguale a momento secondo meno prodotto delle medie.`,
      },
      {
        latex: md`E\{\mathbf{x}_k\mathbf{x}_k^t\}=\Sigma+\mathbf{m}\mathbf{m}^t`,
        why: md`L'identità del passo precedente letta al contrario. Vale per ogni campione, perché tutti vengono dalla stessa densità.`,
      },
      {
        latex: md`E\{\hat{\mathbf{m}}\}=\frac{1}{N}\sum_{k=1}^{N}E\{\mathbf{x}_k\}=\frac{1}{N}\cdot N\,\mathbf{m}=\mathbf{m}`,
        why: md`Linearità del valore atteso: la stima della media è non distorta, come dicono le note ($E\{\hat{\mathbf{m}}\} = \mathbf{m}$).`,
      },
      {
        latex: md`\hat{\mathbf{m}}-\mathbf{m}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\mathbf{m})\;\Rightarrow\;\mathrm{Cov}(\hat{\mathbf{m}})=\frac{1}{N^2}\sum_{k=1}^{N}\sum_{j=1}^{N}E\{(\mathbf{x}_k-\mathbf{m})(\mathbf{x}_j-\mathbf{m})^t\}`,
        why: md`Per la covarianza della media stimata si scrive il suo scarto come media degli scarti dei campioni. Il prodotto esterno di due somme è la somma doppia dei prodotti esterni di tutte le coppie $(k, j)$.`,
      },
      {
        latex: md`k\neq j:\qquad E\{(\mathbf{x}_k-\mathbf{m})(\mathbf{x}_j-\mathbf{m})^t\}=E\{\mathbf{x}_k-\mathbf{m}\}\,E\{\mathbf{x}_j-\mathbf{m}\}^t=\mathbf{0}`,
        why: md`Campioni indipendenti: il valore atteso del prodotto è il prodotto dei valori attesi, e ogni scarto ha media nulla. Delle $N^2$ coppie sopravvivono solo le $N$ con $k = j$, ognuna uguale a $\mathrm{Cov}(\mathbf{x}_k) = \Sigma$.`,
      },
      {
        latex: md`\mathrm{Cov}(\hat{\mathbf{m}})=\frac{1}{N^2}\sum_{k=1}^{N}\mathrm{Cov}(\mathbf{x}_k)=\frac{1}{N}\Sigma`,
        why: md`Le covarianze incrociate sono nulle, quindi la covarianza della somma è la somma delle covarianze; il fattore $1/N^2$ per $N$ termini uguali a $\Sigma$ lascia $\Sigma/N$. La media stimata è tanto meno dispersa quanto più $N$ è grande.`,
      },
      {
        latex: md`E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^t\}=\mathrm{Cov}(\hat{\mathbf{m}})+E\{\hat{\mathbf{m}}\}E\{\hat{\mathbf{m}}\}^t=\frac{1}{N}\Sigma+\mathbf{m}\mathbf{m}^t`,
        why: md`Stessa identità della definizione di covarianza (momento secondo uguale a covarianza più prodotto delle medie), applicata alla variabile aleatoria $\hat{\mathbf{m}}$, con $E\{\hat{\mathbf{m}}\} = \mathbf{m}$.`,
      },
      {
        latex: md`E\{\hat{\Sigma}\}=\frac{1}{N}\cdot N\left(\Sigma+\mathbf{m}\mathbf{m}^t\right)-\left(\frac{1}{N}\Sigma+\mathbf{m}\mathbf{m}^t\right)`,
        why: md`Si sostituiscono i due valori attesi nella scrittura per linearità: gli $N$ addendi della somma sono tutti uguali a $\Sigma+\mathbf{m}\mathbf{m}^t$.`,
      },
      {
        latex: md`E\{\hat{\Sigma}\}=\left(\Sigma+\mathbf{m}\mathbf{m}^t\right)-\left(\frac{1}{N}\Sigma+\mathbf{m}\mathbf{m}^t\right)=\frac{N-1}{N}\,\Sigma`,
        why: md`Il termine $\mathbf{m}\mathbf{m}^t$ si cancella e resta $\Sigma(1 - 1/N)$. Il pezzo mancante, $\Sigma/N$, è esattamente la covarianza di $\hat{\mathbf{m}}$: la sottostima è l'incertezza della media stimata, che la formula ML non conta. Moltiplicando per $N/(N-1)$ si ottiene lo stimatore non distorto ([«dal fattore (N−1)/N allo stimatore non distorto»](#derivation:der09)).`,
      },
      {
        latex: md`\sum_{k=1}^{N}(\mathbf{x}_k-\mathbf{m})(\mathbf{x}_k-\mathbf{m})^t=\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t+N(\hat{\mathbf{m}}-\mathbf{m})(\hat{\mathbf{m}}-\mathbf{m})^t`,
        why: md`Seconda strada, che rende esatta la frase «$\hat{\mathbf{m}}$ sta più vicina ai campioni della media vera». Si scrive $\mathbf{x}_k-\mathbf{m}=(\mathbf{x}_k-\hat{\mathbf{m}})+(\hat{\mathbf{m}}-\mathbf{m})$ e si sviluppa: i termini misti contengono $\sum_k(\mathbf{x}_k-\hat{\mathbf{m}})=N\hat{\mathbf{m}}-N\hat{\mathbf{m}}=\mathbf{0}$ e spariscono. La somma dei prodotti esterni degli scarti dalla media stimata è quindi sempre più piccola di quella dalla media vera, di un termine semidefinito positivo.`,
      },
      {
        latex: md`N\Sigma=N\,E\{\hat{\Sigma}\}+N\cdot\frac{1}{N}\Sigma\;\Rightarrow\;E\{\hat{\Sigma}\}=\frac{N-1}{N}\,\Sigma`,
        why: md`Valore atteso dei due lati: a sinistra ci sono $N$ termini di media $\Sigma$; a destra la prima somma vale $N\hat{\Sigma}$ e l'ultimo termine ha media $N\,\mathrm{Cov}(\hat{\mathbf{m}}) = \Sigma$. Stesso risultato. Gli $N$ scarti $\mathbf{x}_k-\hat{\mathbf{m}}$ hanno somma zero, quindi solo $N-1$ sono liberi: sono i gradi di libertà (*degrees of freedom*) che compaiono al denominatore dello stimatore non distorto.`,
      },
      {
        latex: md`N=1:\qquad\hat{\mathbf{m}}=\mathbf{x}_1,\qquad\hat{\Sigma}=\mathbf{0}=\frac{1-1}{1}\,\Sigma`,
        why: md`Controllo sul caso estremo: con un solo campione la media stimata coincide con il campione, lo scarto è nullo e la stima ML della covarianza vale zero qualunque sia $\Sigma$. La formula lo prevede.`,
      },
    ],
    conclusion: md`$E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$: la stima ML sottostima la covarianza della quantità $\Sigma/N$, che è la covarianza della media stimata. La stima della media invece è non distorta, $E\{\hat{\mathbf{m}}\} = \mathbf{m}$. Il fattore $N/(N-1)$ delle note compensa esattamente la sottostima.`,
    source: [{ doc: 'part1', page: 26 }],
  },

  // --- der11 Casi limite in sigma0^2 e sigma^2 ----------------------------------------------------------
  {
    id: 'der11',
    title: 'Casi limite in σ₀² e σ²: prior dogmatico, prior vago, dati senza rumore o molto rumorosi',
    goal: md`Ricavare dalle equazioni della slide p37 i casi limite nei parametri $\sigma_0^2$ e $\sigma^2$, che la fonte non tratta, e mostrare quale ipotesi ($\sigma_0^2 > 0$) serve perché valgano il limite $N \to \infty$ delle note e l'equivalenza asintotica tra ML e Bayes della slide p40. Passaggi ricostruiti, non scritti nelle fonti.`,
    assumptions: md`Caso gaussiano univariato delle slide p36-37: $p(\mathbf{x}\,|\,\mu) \sim N(\mu, \sigma^2)$ con $\sigma^2$ nota, prior $p(\mu) \sim N(\mu_0, \sigma_0^2)$, $N$ campioni indipendenti con media campionaria $\bar{X}$. Ogni limite in un parametro si prende con $N$ e gli altri parametri fissati.`,
    steps: [
      {
        latex: md`\mu_N=\left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X}+\left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0,\qquad\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}`,
        why: md`Le due equazioni della slide p37 (e delle note, part1 p28), ricavate in [«identificazione di μN e σN²»](#derivation:der04). Tutti i casi limite si leggono da qui.`,
      },
      {
        latex: md`\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}=\frac{N}{N+\sigma^2/\sigma_0^2},\qquad\frac{\sigma^2}{N\sigma_0^2+\sigma^2}=\frac{\sigma^2/\sigma_0^2}{N+\sigma^2/\sigma_0^2},\qquad\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}=\frac{\sigma^2}{N+\sigma^2/\sigma_0^2}`,
        why: md`Si dividono numeratore e denominatore per $\sigma_0^2 > 0$. Nei pesi $\sigma^2$ e $\sigma_0^2$ entrano solo attraverso il rapporto $\sigma^2/\sigma_0^2$.`,
      },
      {
        latex: md`\mu_N=\frac{N}{N+n_0}\,\bar{X}+\frac{n_0}{N+n_0}\,\mu_0,\qquad\sigma_N^2=\frac{\sigma^2}{N+n_0},\qquad n_0=\frac{\sigma^2}{\sigma_0^2}`,
        why: md`Si chiama $n_0$ il rapporto: il prior pesa come $n_0$ campioni virtuali di valore $\mu_0$ ([«il prior vale come campioni virtuali»](#formula:f-c60)). Ogni caso limite si riduce a $n_0 \to \infty$ oppure $n_0 \to 0$; fa eccezione $\sigma_N^2$, dove conta anche la scala $\sigma^2$ al numeratore.`,
      },
      {
        latex: md`\sigma_0^2\to 0\;\Rightarrow\;n_0\to\infty\;\Rightarrow\;\mu_N\to\mu_0,\qquad\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}\to 0`,
        why: md`Prior dogmatico: sei certo di $\mu_0$ prima di vedere i dati. Il peso del prior $n_0/(N+n_0)$ tende a 1 per qualunque $N$ fissato; nella varianza il numeratore tende a 0 e il denominatore a $\sigma^2 > 0$. Il prior è già una delta su $\mu_0$ e i dati non spostano mai la stima. Con le precisioni: $1/\sigma_N^2 = N/\sigma^2 + 1/\sigma_0^2 \to \infty$.`,
      },
      {
        latex: md`\sigma_0^2\to\infty\;\Rightarrow\;n_0\to 0\;\Rightarrow\;\mu_N\to\bar{X},\qquad\sigma_N^2\to\frac{\sigma^2}{N}\quad(N\ge 1)`,
        why: md`Prior vago: il peso del prior tende a 0 e $\mu_N$ coincide con la stima ML $\bar{X}$ per ogni $N \ge 1$. Resta però $\sigma_N^2 = \sigma^2/N$, l'incertezza della media campionaria. È il prior uniforme della slide p40 ([«perché ML e Bayes coincidono»](#derivation:der07)). Con $N = 0$ invece $\mu_N = \mu_0$ e $\sigma_N^2 = \sigma_0^2 \to \infty$: senza dati e con un prior vago non sai nulla.`,
      },
      {
        latex: md`\sigma^2\to 0\;(N\ge 1)\;\Rightarrow\;n_0\to 0\;\Rightarrow\;\mu_N\to\bar{X},\qquad\sigma_N^2=\frac{\sigma^2}{N+n_0}\to 0`,
        why: md`Dati senza rumore: ogni campione ha precisione $1/\sigma^2 \to \infty$ e domina il prior, per quanto stretto. La posterior diventa una delta su $\bar{X}$ già con $N = 1$: senza rumore un'osservazione è il valore di $\mu$.`,
      },
      {
        latex: md`\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}=\frac{\sigma_0^2}{1+N\sigma_0^2/\sigma^2}`,
        why: md`Per il caso opposto conviene la forma originale della slide, divisa sopra e sotto per $\sigma^2$: il limite per $\sigma^2 \to \infty$ si legge subito, perché $N\sigma_0^2/\sigma^2 \to 0$.`,
      },
      {
        latex: md`\sigma^2\to\infty\;\Rightarrow\;\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\to 1\;\Rightarrow\;\mu_N\to\mu_0,\qquad\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}\to\sigma_0^2`,
        why: md`Dati molto rumorosi, con $N$ fissato: i campioni non portano informazione. Il peso del prior tende a 1 e $\sigma_N^2$ tende a $\sigma_0^2$: la posterior coincide con il prior, come nel caso $N = 0$ delle note.`,
      },
      {
        latex: md`\mu_N-\bar{X}=\frac{n_0}{N+n_0}\left(\mu_0-\bar{X}\right)`,
        why: md`Per il limite $N \to \infty$ delle note si guarda la distanza tra media a posteriori e media campionaria: si sottrae $\bar{X} = \frac{N+n_0}{N+n_0}\bar{X}$ dalla forma con $n_0$ e resta solo il termine del prior.`,
      },
      {
        latex: md`\sigma_0^2>0:\;\lim_{N\to\infty}\left(\mu_N-\bar{X}\right)=0;\qquad\sigma_0^2=0:\;\mu_N=\mu_0\;\;\forall N`,
        why: md`Con $\sigma_0^2 > 0$ fissato, $n_0$ è un numero finito e il fattore $n_0/(N+n_0)$ tende a 0, mentre $\vert\mu_0 - \bar{X}\vert$ resta limitata perché $\bar{X}$ tende alla media vera (legge dei grandi numeri). Con $\sigma_0^2 = 0$ esatto il prior è una delta e $\mu_N = \mu_0$ per ogni $N$. I due limiti non si scambiano. Sulla stessa quantità $\mu_N - \bar{X}$: $\lim_{N\to\infty}\lim_{\sigma_0^2\to 0}(\mu_N - \bar{X}) = \lim_{N\to\infty}(\mu_0 - \bar{X}) = \mu_0 - \mu_{\text{vera}}$ (con $\mu_{\text{vera}}$ la media vera dei dati; quasi certamente, per la legge dei grandi numeri), diverso da 0 appena il prior non è centrato sul valore vero; invece $\lim_{\sigma_0^2\to 0}\lim_{N\to\infty}(\mu_N - \bar{X}) = \lim_{\sigma_0^2\to 0} 0 = 0$. È l'ipotesi sottintesa nelle frasi delle note «μN converges to the sample mean» e «Both methods will converge to the true parameter values».`,
      },
      {
        latex: md`\begin{array}{l|c|c}\text{caso}&\mu_N&\sigma_N^2\\\hline N=0&\mu_0&\sigma_0^2\\N\to\infty\;(\sigma_0^2>0)&\bar{X}&0\\\sigma_0^2\to 0&\mu_0&0\\\sigma_0^2\to\infty\;(N\ge 1)&\bar{X}&\sigma^2/N\\\sigma^2\to 0\;(N\ge 1)&\bar{X}&0\\\sigma^2\to\infty&\mu_0&\sigma_0^2\end{array}`,
        why: md`Riepilogo con i due casi delle note in testa. Il prior vince ($\mu_N \to \mu_0$) quando il suo peso $n_0/(N+n_0)$ tende a 1: nessun dato, prior dogmatico, dati molto rumorosi. I dati vincono ($\mu_N \to \bar{X}$) quando il peso tende a 0: infiniti campioni, prior vago, dati senza rumore.`,
      },
    ],
    conclusion: md`Nella media a posteriori il prior pesa $n_0/(N+n_0)$, con $n_0 = \sigma^2/\sigma_0^2$. Il peso tende a 1 con prior dogmatico o dati molto rumorosi (la posterior resta il prior), a 0 con prior vago o dati senza rumore (la media a posteriori diventa la stima ML $\bar{X}$). Il limite $N \to \infty$ delle note e l'equivalenza asintotica della slide p40 richiedono $\sigma_0^2 > 0$, cioè un prior che non escluda il limite di $\bar{X}$; se i dati vengono davvero dal modello, quel limite è il valore vero.`,
    source: [
      { doc: 'ch2', page: 37 }, { doc: 'part1', page: 28 }, { doc: 'part1', page: 29 }, { doc: 'ch2', page: 40 }, { doc: 'part1', page: 30 },
    ],
  },

  // --- der12 Bias, varianza ed errore quadratico medio di mu_N ------------------------------------------
  {
    id: 'der12',
    title: 'Perché la media a posteriori converge al valore vero: bias, varianza ed errore quadratico medio di μN',
    goal: md`Dimostrare nell'esempio gaussiano l'affermazione delle note (part1 p30) secondo cui ML e Bayes convergono ai valori veri dei parametri (*they are consistent estimators*), e ricavare l'errore quadratico medio di $\mu_N$, che dice quando con pochi dati conviene Bayes. Passaggi ricostruiti, non scritti nelle fonti.`,
    assumptions: md`Si guarda $\mu_N$ come stimatore, cioè come funzione dei campioni: la media vera $\mu_{\text{vera}}$ è fissa, i campioni sono iid da $N(\mu_{\text{vera}}, \sigma^2)$, e $\mu_0$, $\sigma_0^2$, $\sigma^2 > 0$ sono costanti; $N \ge 1$. È il punto di vista del modulo sulla bontà degli stimatori applicato a uno stimatore bayesiano.`,
    steps: [
      {
        latex: md`\mu_N=w\,\bar{X}+(1-w)\,\mu_0,\qquad w=\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\in[0,1)`,
        why: md`Prima equazione della slide p37, con i due pesi che sommano a 1 ([«identificazione di μN e σN²»](#derivation:der04)). $w$ dipende solo da $N$, $\sigma^2$ e $\sigma_0^2$, non dai valori dei campioni: per lo stimatore è una costante. $w < 1$ perché $\sigma^2 > 0$; $w = 0$ solo con $\sigma_0^2 = 0$.`,
      },
      {
        latex: md`E\{\bar{X}\}=\mu_{\text{vera}},\qquad\mathrm{var}\{\bar{X}\}=\frac{\sigma^2}{N}`,
        why: md`La media campionaria è non distorta (linearità del valore atteso) e, per l'indipendenza dei campioni, la varianza della somma è la somma delle varianze: $\frac{1}{N^2}\cdot N\sigma^2 = \sigma^2/N$. $\bar{X}$ è anche la stima ML di $\mu$, quindi il suo errore quadratico medio, $\sigma^2/N$, è il termine di confronto.`,
      },
      {
        latex: md`E\{\mu_N\}=w\,\mu_{\text{vera}}+(1-w)\,\mu_0\;\Rightarrow\;b=E\{\mu_N\}-\mu_{\text{vera}}=(1-w)\,\Delta,\qquad\Delta=\mu_0-\mu_{\text{vera}}`,
        why: md`Linearità del valore atteso; $\mu_0$ è una costante. Il bias è $w\mu_{\text{vera}} + (1-w)\mu_0 - \mu_{\text{vera}} = (1-w)(\mu_0 - \mu_{\text{vera}})$. Per $N$ finito $\mu_N$ è distorta verso $\mu_0$: il bias è la frazione $(1-w)$ della distanza $\Delta$ tra la media del prior e la media vera, nullo solo se il prior è centrato sul valore vero.`,
      },
      {
        latex: md`\mathrm{var}\{\mu_N\}=w^2\,\mathrm{var}\{\bar{X}\}=w^2\,\frac{\sigma^2}{N}`,
        why: md`$\mathrm{var}\{aY+c\} = a^2\,\mathrm{var}\{Y\}$: il termine costante $(1-w)\mu_0$ non contribuisce alla varianza, e il fattore $w < 1$ la riduce rispetto a ML. È il compromesso bias-varianza (*bias-variance trade-off*): Bayes accetta un po' di bias in cambio di meno varianza.`,
      },
      {
        latex: md`E\{(\mu_N-\mu_{\text{vera}})^2\}=E\{(\mu_N-E\{\mu_N\})^2\}+2\,b\,E\{\mu_N-E\{\mu_N\}\}+b^2`,
        why: md`Si aggiunge e si toglie $E\{\mu_N\}$: $\mu_N - \mu_{\text{vera}} = (\mu_N - E\{\mu_N\}) + b$, poi si sviluppa il quadrato; $b$ è una costante ed esce dal valore atteso. Il termine centrale è nullo perché $E\{\mu_N - E\{\mu_N\}\} = 0$.`,
      },
      {
        latex: md`E\{(\mu_N-\mu_{\text{vera}})^2\}=\mathrm{var}\{\mu_N\}+b^2=w^2\,\frac{\sigma^2}{N}+(1-w)^2\Delta^2`,
        why: md`Scomposizione dell'errore quadratico medio (*mean squared error*, MSE) in varianza più bias al quadrato (modulo sulla bontà degli stimatori). È la formula dell'errore di Bayes nel widget [«quando conviene Bayes»](#widget:m07-pochi-dati-prior-e-intervalli); per ML ($w = 1$, nessun bias) vale $\sigma^2/N$.`,
      },
      {
        latex: md`\frac{w^2\sigma^2}{N}+(1-w)^2\Delta^2<\frac{\sigma^2}{N}\;\Longleftrightarrow\;(1-w)^2\Delta^2<(1-w)(1+w)\frac{\sigma^2}{N}\;\Longleftrightarrow\;\Delta^2<\frac{1+w}{1-w}\cdot\frac{\sigma^2}{N}`,
        why: md`Quando Bayes batte ML? Si porta $w^2\sigma^2/N$ a destra, si scompone $1 - w^2 = (1-w)(1+w)$ e si divide per $(1-w)^2 > 0$.`,
      },
      {
        latex: md`1-w=\frac{n_0}{N+n_0},\quad 1+w=\frac{2N+n_0}{N+n_0}\;\Rightarrow\;\frac{1+w}{1-w}\cdot\frac{\sigma^2}{N}=\frac{2N+n_0}{n_0}\cdot\frac{\sigma^2}{N}=\frac{2\sigma^2}{n_0}+\frac{\sigma^2}{N}=2\sigma_0^2+\frac{\sigma^2}{N}`,
        why: md`Con i campioni virtuali: $w = N/(N+n_0)$ con $n_0 = \sigma^2/\sigma_0^2$, quindi $\sigma^2/n_0 = \sigma_0^2$.`,
      },
      {
        latex: md`E\{(\mu_N-\mu_{\text{vera}})^2\}<\frac{\sigma^2}{N}\;\Longleftrightarrow\;(1-w)^2\Delta^2<(1-w^2)\frac{\sigma^2}{N}\;\Longleftrightarrow\;\Delta^2<2\sigma_0^2+\frac{\sigma^2}{N}`,
        why: md`I due passi precedenti in una riga. Bayes vince quando il prior è centrato abbastanza bene rispetto alla propria incertezza dichiarata $\sigma_0^2$: è il vantaggio «Incorporating Prior Knowledge» delle note (part1 p30), che vale solo con un prior buono. Con $\sigma_0^2 = 0$ ($w = 0$) l'errore è $\Delta^2$ e la condizione diventa $\Delta^2 < \sigma^2/N$: un prior dogmatico conviene solo se è quasi esatto.`,
      },
      {
        latex: md`\sigma=30,\;\sigma_0=20,\;N=5:\qquad n_0=2.25,\quad w=\frac{5}{7.25}\approx 0.69,\quad 2\sigma_0^2+\frac{\sigma^2}{N}=800+180=980\;\Rightarrow\;\vert\Delta\vert<31.3`,
        why: md`Esempio numerico. La varianza di Bayes è $w^2\cdot 180 \approx 85.6$ contro i $180$ di ML. Con $\Delta = 10$ il bias al quadrato è $(1-w)^2\cdot 100 \approx 9.6$ e l'errore di Bayes è circa $95.2$, poco più della metà di quello di ML; con $\Delta = 40$ il bias al quadrato sale a circa $154.1$, l'errore a circa $239.7$, e vince ML.`,
      },
      {
        latex: md`P\{\vert\mu_N-\mu_{\text{vera}}\vert>\varepsilon\}\le\frac{E\{(\mu_N-\mu_{\text{vera}})^2\}}{\varepsilon^2}`,
        why: md`Disuguaglianza di Chebyshev (la disuguaglianza di Markov applicata al quadrato dell'errore): se l'errore quadratico medio tende a zero, la probabilità di sbagliare di più di un qualunque $\varepsilon > 0$ tende a zero. È la consistenza (*consistency*).`,
      },
      {
        latex: md`N\to\infty\;(\sigma_0^2>0):\quad w\to 1,\quad b\to 0,\quad\mathrm{var}\{\mu_N\}\to 0\;\Rightarrow\;\mu_N\to\mu_{\text{vera}}`,
        why: md`$w = N/(N+n_0) \to 1$ perché $n_0$ è finito. Bias e varianza tendono a zero, quindi l'errore quadratico medio tende a zero e, per la disuguaglianza precedente, $\mu_N$ converge al valore vero: asintoticamente non distorta e con varianza che si annulla, la condizione sufficiente per la consistenza dei moduli sulla bontà degli stimatori e sulla massima verosimiglianza. Anche $\bar{X}$ converge a $\mu_{\text{vera}}$, quindi le due stime coincidono nel limite: è l'equivalenza asintotica della slide p40. Serve $\sigma_0^2 > 0$, altrimenti $w = 0$ per ogni $N$ ([«casi limite in σ₀² e σ²»](#derivation:der11)).`,
      },
    ],
    conclusion: md`Per $N$ finito la media a posteriori è distorta verso $\mu_0$ ma ha varianza più bassa della stima ML: $E\{(\mu_N-\mu_{\text{vera}})^2\} = w^2\frac{\sigma^2}{N} + (1-w)^2\Delta^2$, minore di $\sigma^2/N$ se e solo se $\Delta^2 < 2\sigma_0^2 + \sigma^2/N$. Per $N \to \infty$, con $\sigma_0^2 > 0$, bias e varianza si annullano: $\mu_N$ è consistente, come dicono le note, e coincide asintoticamente con la stima ML.`,
    source: [
      { doc: 'part1', page: 30 }, { doc: 'part1', page: 28 }, { doc: 'part1', page: 29 }, { doc: 'ch2', page: 37 }, { doc: 'ch2', page: 40 },
    ],
  },

  // --- der13 La densità predittiva come media pesata di densità -----------------------------------------
  {
    id: 'der13',
    title: 'La densità predittiva è una media pesata di densità: area 1, media e varianza σ² + σN²',
    goal: md`Dare contenuto formale alla lettura delle note (part1 p27), secondo cui l'integrale della formula chiave è un'operazione di media (*averaging operation*) in cui il primo termine è «weighted» dal secondo. Mostrare che $p(\mathbf{x}\,|\,\boldsymbol{X})$ è una densità valida per qualunque modello $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ e ricavarne media e varianza senza calcolare l'integrale gaussiano, ritrovando la frase delle note (part1 p29) sulla varianza che incorpora «both the inherent variance σ² and the uncertainty in the estimate of μ». Passaggi ricostruiti, non scritti nelle fonti.`,
    assumptions: md`Un modello $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ che sia una densità in $\mathbf{x}$ per ogni $\boldsymbol{\theta}$ e una posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ valida (non negativa, area 1). Per media e varianza $\mathbf{x}$ è scalare, come nell'esempio gaussiano (in più dimensioni vale lo stesso ragionamento con le matrici di covarianza), e i momenti che compaiono sono finiti. Nel caso gaussiano $\boldsymbol{\theta} = \mu$, $p(\mathbf{x}\,|\,\mu) \sim N(\mu, \sigma^2)$ e $p(\mu\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma_N^2)$.`,
    steps: [
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}\approx\sum_{i}p(\mathbf{x}\,|\,\boldsymbol{\theta}_i)\,w_i,\qquad w_i=p(\boldsymbol{\theta}_i\,|\,\boldsymbol{X})\,\Delta\boldsymbol{\theta}`,
        why: md`La formula chiave (slide p34) letta come fanno le note: un integrale è una forma continua di somma (*a continuous form of summation*). Si divide lo spazio dei parametri in celle di volume $\Delta\boldsymbol{\theta}$: ogni modello $p(\mathbf{x}\,|\,\boldsymbol{\theta}_i)$ entra con un peso $w_i \ge 0$, e i pesi hanno somma circa 1 perché la posterior ha area 1. È una media pesata dei modelli, con i pesi dati dalla posterior.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})\ge 0`,
        why: md`L'integranda è il prodotto di due densità, quindi non negativa, e lo è anche il suo integrale: primo requisito di una densità.`,
      },
      {
        latex: md`\int p(\mathbf{x}\,|\,\boldsymbol{X})\,\mathrm{d}\mathbf{x}=\int\left[\int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}\right]\mathrm{d}\mathbf{x}=\int\left[\int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,\mathrm{d}\mathbf{x}\right]p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
        why: md`Si integra in $\mathbf{x}$ la formula chiave e si scambia l'ordine delle integrazioni: è lecito perché l'integranda è non negativa (teorema di Tonelli). $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ non dipende da $\mathbf{x}$ ed esce dall'integrale interno.`,
      },
      {
        latex: md`\int p(\mathbf{x}\,|\,\boldsymbol{X})\,\mathrm{d}\mathbf{x}=\int 1\cdot p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}=1`,
        why: md`Per ogni $\boldsymbol{\theta}$, $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è una densità in $\mathbf{x}$ e ha area 1; resta l'area della posterior, che vale 1. Una media di densità con pesi non negativi di somma 1 è ancora una densità (una miscela, *mixture*): è il senso preciso di «average p(x|θ) over all possible values of θ» della slide p35.`,
      },
      {
        latex: md`E\{\mathbf{x}\,|\,\boldsymbol{X}\}=\int\mathbf{x}\,p(\mathbf{x}\,|\,\boldsymbol{X})\,\mathrm{d}\mathbf{x}=\int E\{\mathbf{x}\,|\,\boldsymbol{\theta}\}\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
        why: md`Stesso scambio degli integrali applicato a $\mathbf{x}\,p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$: l'integrale interno $\int\mathbf{x}\,p(\mathbf{x}\,|\,\boldsymbol{\theta})\,\mathrm{d}\mathbf{x}$ è la media del modello, $E\{\mathbf{x}\,|\,\boldsymbol{\theta}\}$. Qui $\mathbf{x}$ può essere negativo e lo scambio lo garantisce il teorema di Fubini, se le medie esistono. La media della predittiva è la media, pesata dalla posterior, delle medie dei singoli modelli.`,
      },
      {
        latex: md`E\{\mathbf{x}\,|\,\boldsymbol{X}\}=\int\mu\,p(\mu\,|\,\boldsymbol{X})\,\mathrm{d}\mu=\mu_N`,
        why: md`Nel caso gaussiano $E\{\mathbf{x}\,|\,\mu\} = \mu$, quindi la media della predittiva è la media della posterior $N(\mu_N, \sigma_N^2)$, cioè $\mu_N$: ritrova il centro di $N(\mu_N, \sigma^2 + \sigma_N^2)$ della slide p39 senza completare il quadrato.`,
      },
      {
        latex: md`\mathrm{var}\{\mathbf{x}\,|\,\boldsymbol{X}\}=E\{\mathbf{x}^2\,|\,\boldsymbol{X}\}-\left(E\{\mathbf{x}\,|\,\boldsymbol{X}\}\right)^2`,
        why: md`Per la varianza si parte dalla solita identità: momento secondo meno quadrato della media.`,
      },
      {
        latex: md`E\{\mathbf{x}^2\,|\,\boldsymbol{X}\}=\int E\{\mathbf{x}^2\,|\,\boldsymbol{\theta}\}\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}=\int\left(\mathrm{var}\{\mathbf{x}\,|\,\boldsymbol{\theta}\}+E\{\mathbf{x}\,|\,\boldsymbol{\theta}\}^2\right)p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
        why: md`Stesso scambio degli integrali applicato a $\mathbf{x}^2$ (integranda non negativa: basta Tonelli), poi la stessa identità scritta per il singolo modello: $E\{\mathbf{x}^2\,|\,\boldsymbol{\theta}\} = \mathrm{var}\{\mathbf{x}\,|\,\boldsymbol{\theta}\} + E\{\mathbf{x}\,|\,\boldsymbol{\theta}\}^2$.`,
      },
      {
        latex: md`\int E\{\mathbf{x}\,|\,\boldsymbol{\theta}\}^2\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}-\left(E\{\mathbf{x}\,|\,\boldsymbol{X}\}\right)^2=\int\left(E\{\mathbf{x}\,|\,\boldsymbol{\theta}\}-E\{\mathbf{x}\,|\,\boldsymbol{X}\}\right)^2p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
        why: md`Si sviluppa il quadrato a destra. Il doppio prodotto vale $-2\,E\{\mathbf{x}\,|\,\boldsymbol{X}\}\int E\{\mathbf{x}\,|\,\boldsymbol{\theta}\}\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta} = -2\left(E\{\mathbf{x}\,|\,\boldsymbol{X}\}\right)^2$ per la formula della media appena ricavata, e l'ultimo termine vale $+\left(E\{\mathbf{x}\,|\,\boldsymbol{X}\}\right)^2$ perché la posterior ha area 1: la somma è il lato sinistro. È di nuovo momento secondo meno quadrato della media, questa volta per la media del modello vista come funzione di $\boldsymbol{\theta}$ distribuito secondo la posterior.`,
      },
      {
        latex: md`\mathrm{var}\{\mathbf{x}\,|\,\boldsymbol{X}\}=\int\mathrm{var}\{\mathbf{x}\,|\,\boldsymbol{\theta}\}\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}+\int\left(E\{\mathbf{x}\,|\,\boldsymbol{\theta}\}-E\{\mathbf{x}\,|\,\boldsymbol{X}\}\right)^2p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
        why: md`Legge della varianza totale (*law of total variance*): si mettono insieme i tre passi precedenti. Il primo termine è la variabilità media dei dati dato il parametro; il secondo è quanto le medie dei modelli si disperdono sotto la posterior.`,
      },
      {
        latex: md`\mathrm{var}\{\mathbf{x}\,|\,\boldsymbol{X}\}=\sigma^2+\int(\mu-\mu_N)^2\,p(\mu\,|\,\boldsymbol{X})\,\mathrm{d}\mu=\sigma^2+\sigma_N^2`,
        why: md`Nel caso gaussiano $\mathrm{var}\{\mathbf{x}\,|\,\mu\} = \sigma^2$ non dipende da $\mu$ ed esce dal primo integrale, che vale 1. Con $E\{\mathbf{x}\,|\,\mu\} = \mu$ ed $E\{\mathbf{x}\,|\,\boldsymbol{X}\} = \mu_N$ il secondo integrale è la varianza della posterior, $\sigma_N^2$. È la lettura delle note: varianza intrinseca $\sigma^2$ più incertezza sulla stima di $\mu$.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})\sim N(\mu_N,\;\sigma^2+\sigma_N^2)`,
        why: md`Media e varianza coincidono con quelle della conclusione della slide p39. La scomposizione però dà solo i due momenti, e vale per qualunque modello; che la predittiva sia anche gaussiana richiede il calcolo dell'integrale ([«densità predittiva gaussiana»](#derivation:der06)) oppure l'argomento $\mathbf{x} = \mu + \varepsilon$, con $\varepsilon \sim N(0, \sigma^2)$ indipendente da $\mu$: somma di due gaussiane indipendenti.`,
      },
    ],
    conclusion: md`La densità predittiva è una miscela dei modelli pesata dalla posterior. Per qualunque $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ ha area 1, media uguale alla media a posteriori delle medie dei modelli, e varianza uguale alla varianza media dei dati più la dispersione delle medie dei modelli. Nel caso gaussiano la media è $\mu_N$ e la varianza $\sigma^2 + \sigma_N^2$: rumore dei dati più incertezza sul parametro. Per $N \to \infty$ si ha $\sigma_N^2 \to 0$ e la predittiva si riduce al modello con la media stimata.`,
    source: [
      { doc: 'ch2', page: 34 }, { doc: 'ch2', page: 35 }, { doc: 'part1', page: 27 }, { doc: 'part1', page: 29 }, { doc: 'ch2', page: 39 },
    ],
  },
]
