// Derivazioni del foglio m05 (stima a massima verosimiglianza, galleria dei modelli, gaussiana multivariata): der11-der19.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più servono a seguire i conti
// che l'inventario salta: il perché di ciascuno comincia con «Passaggio intermedio», «Controllo» o «Esempio numerico».
// Tutte queste derivazioni sono integrazioni: la fonte (ch2 p17-21, part1 p20-24) enuncia solo i risultati. La notazione
// è quella delle slide e delle note (E{·}, var{·}, I(θ), Σ, |Σ| per il determinante, apice t per la trasposta),
// controllata sulle immagini delle pagine. Ogni passaggio algebrico e ogni numero è stato ricalcolato.
// Nessuna stringa LaTeX dell'inventario è stata ritoccata.
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivationsB: Derivation[] = [
  // --- der11 Isolivelli ellittici della gaussiana 2-D --------------------------------------------------------
  {
    id: 'der11',
    title: 'Perché gli isolivelli sono ellissi con assi lungo gli autovettori e semiassi proporzionali a √λ',
    goal: md`Collegare alla decomposizione spettrale di $\Sigma$ le quattro affermazioni del paragrafo «Shape of a 2-D Gaussian PDF» delle note (p. 24): gli isolivelli (*isolevels*) della campana sono ellissi; i loro assi sono allineati con gli autovettori (*eigenvectors*) di $\Sigma$; l'autovettore dell'autovalore (*eigenvalue*) più grande definisce l'asse maggiore, cioè la direzione di massima varianza; gli autovalori determinano le lunghezze degli assi. La fonte enuncia solo le conclusioni: i passaggi sono un'integrazione.`,
    assumptions: md`Gaussiana bivariata ($n = 2$) con vettore medio $\mathbf{m}$ e matrice di covarianza $\Sigma$ simmetrica e definita positiva, con autovalori ordinati $\lambda_1 \geq \lambda_2 > 0$. Le note dicono «semidefinita positiva», ma la formula della pdf usa $\Sigma^{-1}$ e ha $\vert\Sigma\vert^{1/2}$ al denominatore: serve anche l'invertibilità, cioè autovalori strettamente positivi. Gli autovettori $\mathbf{e}_1, \mathbf{e}_2$ hanno lunghezza 1. La quota $z$ dell'isolivello sta fra 0 e il picco $p(\mathbf{m})$.`,
    steps: [
      {
        latex: md`\ln p(\mathbf{x}) = -\ln\left[ (2\pi)^{n/2} |\Sigma|^{1/2} \right] - \frac{1}{2} (\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m})`,
        why: md`Passaggio intermedio: logaritmo della formula multivariata delle note (p. 23). Il logaritmo di un prodotto è la somma dei logaritmi, e il logaritmo dell'esponenziale è l'esponente. Il primo termine è una costante: tutta la dipendenza da $\mathbf{x}$ sta nella forma quadratica.`,
      },
      {
        latex: md`p(\mathbf{x}) = z \iff (\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m}) = -2 \ln\left[ z\, (2\pi)^{n/2} |\Sigma|^{1/2} \right] = d^2`,
        why: md`Si taglia la campana alla quota $z$ (sezione orizzontale). Si pone il passo precedente uguale a $\ln z$ e si isola la forma quadratica, moltiplicando per $-2$. Il secondo membro non dipende da $\mathbf{x}$: tutti i punti alla stessa quota hanno la stessa distanza di Mahalanobis $d$ da $\mathbf{m}$ (le note chiamano «Mahalanobis distance» la forma quadratica, che a rigore è il suo quadrato $d^2$). Perché sia $d^2 \geq 0$ l'argomento del logaritmo deve essere al più 1, cioè $z \leq p(\mathbf{m})$: sopra il picco non c'è nessuna sezione, al picco la sezione è il solo punto $\mathbf{m}$. Più la quota è bassa, più $d$ è grande.`,
      },
      {
        latex: md`\Sigma = \mathbf{U} \Lambda \mathbf{U}^t, \quad \mathbf{U} = [\mathbf{e}_1 \; \mathbf{e}_2], \quad \mathbf{U}^t \mathbf{U} = \mathbf{I}_2, \quad \Lambda = \mathrm{diag}(\lambda_1, \lambda_2) \;\Rightarrow\; \Sigma^{-1} = \mathbf{U} \Lambda^{-1} \mathbf{U}^t`,
        why: md`$\Sigma$ è simmetrica, quindi per il teorema spettrale ha autovalori reali e autovettori ortonormali ($\Sigma\mathbf{e}_i = \lambda_i\mathbf{e}_i$, $\mathbf{e}_1^t\mathbf{e}_2 = 0$), che si mettono come colonne di $\mathbf{U}$. L'inversa ha gli stessi autovettori e autovalori reciproci $1/\lambda_i$, che esistono perché $\lambda_i > 0$. La matrice degli autovettori si chiama $\mathbf{U}$ e l'identità $2 \times 2$ si chiama $\mathbf{I}_2$ per non confonderle con l'operatore valore atteso $E\{\cdot\}$ e con l'informazione di Fisher $\mathrm{I}(\theta)$, usati nello stesso foglio.`,
      },
      {
        latex: md`\Sigma\, \Sigma^{-1} = \mathbf{U} \Lambda \mathbf{U}^t \mathbf{U} \Lambda^{-1} \mathbf{U}^t = \mathbf{U} \Lambda \Lambda^{-1} \mathbf{U}^t = \mathbf{U} \mathbf{U}^t = \mathbf{I}_2`,
        why: md`Controllo dell'inversa: nel mezzo si usa $\mathbf{U}^t\mathbf{U} = \mathbf{I}_2$, poi $\Lambda\Lambda^{-1} = \mathbf{I}_2$ (matrici diagonali) e alla fine $\mathbf{U}\mathbf{U}^t = \mathbf{I}_2$, che vale anch'essa perché $\mathbf{U}$ è quadrata e la sua inversa è $\mathbf{U}^t$.`,
      },
      {
        latex: md`\mathbf{y} = \mathbf{U}^t (\mathbf{x} - \mathbf{m})`,
        why: md`Cambio di coordinate: si trasla l'origine in $\mathbf{m}$ e si ruotano gli assi sugli autovettori; $y_i$ è la coordinata lungo $\mathbf{e}_i$.`,
      },
      {
        latex: md`y_i = \mathbf{e}_i^t (\mathbf{x} - \mathbf{m}), \qquad \mathbf{x} - \mathbf{m} = \mathbf{U}\mathbf{y} = y_1 \mathbf{e}_1 + y_2 \mathbf{e}_2`,
        why: md`Passaggio intermedio: la riga $i$ di $\mathbf{U}^t$ è $\mathbf{e}_i^t$, quindi $y_i$ è la proiezione dello scarto $\mathbf{x} - \mathbf{m}$ sull'autovettore $\mathbf{e}_i$. Moltiplicando per $\mathbf{U}$ si torna indietro: lo scarto è la combinazione degli autovettori con pesi $y_1, y_2$. Poiché $\mathbf{U}$ è ortogonale, il cambio di coordinate è una rotazione (al più con una riflessione): non cambia né le distanze né le forme delle curve.`,
      },
      {
        latex: md`(\mathbf{x} - \mathbf{m})^t \mathbf{U} \Lambda^{-1} \mathbf{U}^t (\mathbf{x} - \mathbf{m}) = \left[ \mathbf{U}^t (\mathbf{x} - \mathbf{m}) \right]^t \Lambda^{-1} \left[ \mathbf{U}^t (\mathbf{x} - \mathbf{m}) \right]`,
        why: md`Passaggio intermedio: si sostituisce $\Sigma^{-1} = \mathbf{U}\Lambda^{-1}\mathbf{U}^t$ nella forma quadratica e si usa $(\mathbf{A}\mathbf{b})^t = \mathbf{b}^t\mathbf{A}^t$ con $\mathbf{A} = \mathbf{U}^t$: il vettore riga a sinistra è il trasposto di $\mathbf{y}$.`,
      },
      {
        latex: md`(\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m}) = \mathbf{y}^t \Lambda^{-1} \mathbf{y} = \frac{y_1^2}{\lambda_1} + \frac{y_2^2}{\lambda_2}`,
        why: md`Nelle nuove coordinate la forma quadratica è diagonale, perché $\Lambda^{-1}$ ha zeri fuori diagonale: non ci sono termini misti $y_1 y_2$, e ogni coordinata al quadrato è pesata con il reciproco del suo autovalore.`,
      },
      {
        latex: md`\frac{y_1^2}{d^2 \lambda_1} + \frac{y_2^2}{d^2 \lambda_2} = 1`,
        why: md`Si uguaglia la forma quadratica a $d^2$ (secondo passo) e si divide per $d^2 > 0$. È l'equazione canonica $\frac{y_1^2}{a^2} + \frac{y_2^2}{b^2} = 1$ di un'ellisse centrata in $\mathbf{m}$ con assi lungo $\mathbf{e}_1$ ed $\mathbf{e}_2$ (gli autovettori) e semiassi $a = d\sqrt{\lambda_1}$ e $b = d\sqrt{\lambda_2}$: gli autovalori determinano le lunghezze.`,
      },
      {
        latex: md`y_2 = 0 \;\Rightarrow\; y_1 = \pm d\sqrt{\lambda_1}, \qquad y_1 = 0 \;\Rightarrow\; y_2 = \pm d\sqrt{\lambda_2}`,
        why: md`Passaggio intermedio: intersecando l'ellisse con i suoi assi si trovano i quattro vertici $\mathbf{m} \pm d\sqrt{\lambda_1}\,\mathbf{e}_1$ e $\mathbf{m} \pm d\sqrt{\lambda_2}\,\mathbf{e}_2$. Il rapporto fra i semiassi, $\sqrt{\lambda_1/\lambda_2}$, non dipende da $d$: gli isolivelli a quote diverse sono ellissi concentriche con la stessa forma, tanto più grandi quanto più la quota è bassa.`,
      },
      {
        latex: md`\lambda_1 \geq \lambda_2 \;\Rightarrow\; d\sqrt{\lambda_1} \geq d\sqrt{\lambda_2}`,
        why: md`Con gli autovalori ordinati, l'asse lungo $\mathbf{e}_1$ è il più lungo: l'autovettore dell'autovalore massimo definisce l'asse maggiore (*major axis*). Se $\lambda_1 = \lambda_2$ le ellissi sono cerchi: $\Sigma = \lambda\mathbf{I}_2$ e ogni direzione è un autovettore.`,
      },
      {
        latex: md`\mathrm{var}\{\mathbf{e}_i^t \mathbf{x}\} = \mathbf{e}_i^t \Sigma\, \mathbf{e}_i = \lambda_i\, \mathbf{e}_i^t \mathbf{e}_i = \lambda_i`,
        why: md`Perché l'asse maggiore è la direzione di massima varianza (*greatest variance*, note p. 24). La varianza della proiezione $\mathbf{a}^t\mathbf{x}$ è $E\{\mathbf{a}^t(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^t\mathbf{a}\} = \mathbf{a}^t\Sigma\mathbf{a}$; lungo un autovettore di lunghezza 1 vale il suo autovalore. Per una direzione unitaria qualunque $\mathbf{a} = a_1\mathbf{e}_1 + a_2\mathbf{e}_2$, con $a_1^2 + a_2^2 = 1$, si ha $\mathbf{a}^t\Sigma\mathbf{a} = \lambda_1 a_1^2 + \lambda_2 a_2^2 \leq \lambda_1$: il massimo è $\lambda_1$ e si raggiunge in $\mathbf{e}_1$. È lo stesso fatto su cui si basa l'analisi delle componenti principali (*PCA*).`,
      },
      {
        latex: md`\Sigma = \begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}: \quad \lambda_1 = 3, \; \mathbf{e}_1 = \tfrac{1}{\sqrt{2}}(1, 1)^t, \qquad \lambda_2 = 1, \; \mathbf{e}_2 = \tfrac{1}{\sqrt{2}}(1, -1)^t`,
        why: md`Esempio numerico: due feature correlate positivamente, come altezza e peso di una persona in unità opportune. Il polinomio caratteristico $(2 - \lambda)^2 - 1 = 0$ dà $\lambda = 3$ e $\lambda = 1$, e si verifica $\Sigma\mathbf{e}_1 = 3\,\mathbf{e}_1$, $\Sigma\mathbf{e}_2 = \mathbf{e}_2$. L'isolivello con $d = 1$ è un'ellisse inclinata di 45°, con semiasse $\sqrt{3} \approx 1.73$ lungo la bisettrice $x_1 = x_2$ e semiasse 1 lungo l'altra diagonale: i dati si allungano dove le due feature crescono insieme.`,
      },
    ],
    conclusion: md`Gli isolivelli della gaussiana 2-D sono le ellissi $\frac{y_1^2}{d^2\lambda_1} + \frac{y_2^2}{d^2\lambda_2} = 1$ con $y_i = \mathbf{e}_i^t(\mathbf{x} - \mathbf{m})$: centro in $\mathbf{m}$, assi lungo gli autovettori di $\Sigma$, semiassi $d\sqrt{\lambda_1} \geq d\sqrt{\lambda_2}$. L'asse maggiore segue l'autovettore dell'autovalore massimo, che è la direzione di massima varianza. Se $\Sigma$ è diagonale gli autovettori sono gli assi coordinati e le ellissi non sono inclinate; se $\Sigma = \lambda\mathbf{I}_2$ sono cerchi.`,
    source: [{ doc: 'part1', page: 24 }, { doc: 'part1', page: 23 }],
  },

  // --- der12 Dalla formula multivariata alla gaussiana 1-D --------------------------------------------------
  {
    id: 'der12',
    title: 'Dalla formula multivariata alla gaussiana 1-D della galleria (n = 1)',
    goal: md`Verificare che la pdf gaussiana multivariata delle note (p. 23), con $n = 1$, coincide con la $f(x; \mu, \sigma)$ del pannello «Gaussian» della galleria dei modelli (note, p. 22).`,
    assumptions: md`Una sola feature ($n = 1$) con varianza $\sigma^2 > 0$. La galleria chiama la media $\mu$ e usa $\sigma$ come parametro, la formula multivariata usa il vettore medio $\mathbf{m}$ e la matrice di covarianza $\Sigma$: è la stessa famiglia di densità con nomi diversi.`,
    steps: [
      {
        latex: md`n = 1: \quad \mathbf{x} = x, \quad \mathbf{m} = \mu, \quad \Sigma = \sigma^2, \quad |\Sigma| = \sigma^2, \quad \Sigma^{-1} = \frac{1}{\sigma^2}`,
        why: md`In una dimensione il vettore delle feature è uno scalare, il vettore medio è la media e la matrice di covarianza $1 \times 1$ contiene solo la varianza. Determinante e inversa di una matrice $1 \times 1$ sono il suo unico elemento e il suo reciproco.`,
      },
      {
        latex: md`p(x \mid \mu, \sigma^2) = \frac{1}{(2\pi)^{1/2} (\sigma^2)^{1/2}} \exp\left[ -\frac{1}{2} (x - \mu) \frac{1}{\sigma^2} (x - \mu) \right]`,
        why: md`Passaggio intermedio: sostituzione diretta del passo precedente nella formula multivariata, prima di semplificare. La trasposta di uno scalare è lo scalare stesso.`,
      },
      {
        latex: md`(2\pi)^{1/2} |\Sigma|^{1/2} = \sigma\sqrt{2\pi}, \qquad (\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m}) = \frac{(x - \mu)^2}{\sigma^2}`,
        why: md`$(\sigma^2)^{1/2} = \sigma$ perché $\sigma > 0$. La distanza di Mahalanobis al quadrato diventa lo scarto standardizzato al quadrato: in una dimensione la distanza di Mahalanobis è $\vert x - \mu\vert/\sigma$, cioè quante deviazioni standard separano $x$ dalla media.`,
      },
      {
        latex: md`p(x \mid \mu, \sigma^2) = \frac{1}{\sigma\sqrt{2\pi}} \, e^{-\frac{(x-\mu)^2}{2\sigma^2}} = f(x; \mu, \sigma)`,
        why: md`Sostituendo si ottiene esattamente la formula del pannello «Gaussian» ($e^{(\cdot)}$ ed $\exp[\cdot]$ sono la stessa funzione). La gaussiana multivariata è la generalizzazione naturale di quella monodimensionale: lo scarto al quadrato diviso per la varianza diventa la forma quadratica con $\Sigma^{-1}$, e $\sigma$ al denominatore diventa $\vert\Sigma\vert^{1/2}$.`,
      },
      {
        latex: md`p(\mu) = \frac{1}{\sigma\sqrt{2\pi}}: \quad \sigma^2 = 0.2 \Rightarrow 0.892, \quad \sigma^2 = 0.5 \Rightarrow 0.564, \quad \sigma^2 = 1 \Rightarrow 0.399, \quad \sigma^2 = 5 \Rightarrow 0.178`,
        why: md`Controllo sulla figura della galleria: in $x = \mu$ l'esponente è zero e la curva tocca il picco $1/(\sigma\sqrt{2\pi})$. Con le quattro varianze della legenda si ritrovano le altezze delle quattro curve: rossa circa 0.89, magenta circa 0.56 (centrata in $-2$), verde circa 0.40, blu circa 0.18. Più la varianza è grande, più la campana è larga e bassa, perché l'area sotto la curva resta 1.`,
      },
    ],
    conclusion: md`Con $n = 1$ la formula multivariata diventa $p(x \mid \mu, \sigma^2) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$, la gaussiana della galleria. Tutto ciò che vale per il caso multivariato (volume unitario, isolivelli, stima ML di media e covarianza) vale in particolare in una dimensione, dove gli isolivelli si riducono alle coppie di punti $\mu \pm d\,\sigma$.`,
    source: [{ doc: 'part1', page: 23 }, { doc: 'part1', page: 22 }],
  },

  // --- der13 Stima ML del parametro della Rayleigh ----------------------------------------------------------
  {
    id: 'der13',
    title: 'Esercizio tipo: stima ML del parametro della Rayleigh',
    goal: md`Applicare la ricetta della stima a massima verosimiglianza (*Maximum Likelihood*, ML) della slide 17 a un modello non gaussiano della galleria, la Rayleigh, e controllare bias, efficienza e invarianza della stima. Integrazione pensata per la richiesta d'esame di applicare la stima ML a un esercizio (*apply Maximum Likelihood estimation on an exercise*).`,
    assumptions: md`$N$ campioni $x_1, \ldots, x_N \geq 0$ indipendenti e identicamente distribuiti (*iid*) secondo la Rayleigh di parametro $\sigma > 0$ (pannello «Rayleigh» delle note, p. 22): per esempio le ampiezze dell'eco radar diffuso (*scattered signals*, note p. 21). Si stima $\theta = \sigma^2$, trattato come una sola variabile; la stima di $\sigma$ si ricava alla fine.`,
    steps: [
      {
        latex: md`p(x_k \mid \sigma) = \frac{x_k}{\sigma^2} \exp\left( -\frac{x_k^2}{2\sigma^2} \right), \quad x_k \geq 0`,
        why: md`Formula del pannello «Rayleigh» (note p. 22), $f(x \mid \sigma) = x\exp(-x^2/(2\sigma^2))/\sigma^2$, scritta per il campione $k$-esimo. Per $x < 0$ la densità è nulla: un'ampiezza non è mai negativa.`,
      },
      {
        latex: md`p(\mathbf{X} \mid \sigma^2) = \prod_{k=1}^{N} \frac{x_k}{\sigma^2} \exp\left( -\frac{x_k^2}{2\sigma^2} \right) = \left( \prod_{k=1}^{N} x_k \right) (\sigma^2)^{-N} \exp\left( -\frac{1}{2\sigma^2} \sum_{k=1}^{N} x_k^2 \right)`,
        why: md`Passaggio intermedio: per campioni iid la likelihood è il prodotto delle pdf. Le $N$ costanti $1/\sigma^2$ danno $(\sigma^2)^{-N}$ e il prodotto degli esponenziali è l'esponenziale della somma degli esponenti.`,
      },
      {
        latex: md`\ln p(\mathbf{X} \mid \sigma^2) = \sum_{k=1}^{N} \ln x_k - N \ln \sigma^2 - \frac{1}{2\sigma^2} \sum_{k=1}^{N} x_k^2`,
        why: md`Logaritmo del prodotto: $\ln\frac{x_k}{\sigma^2} = \ln x_k - \ln\sigma^2$ per ogni campione. Il termine $\sum_k \ln x_k$ non dipende dal parametro e sparirà nella derivata.`,
      },
      {
        latex: md`\frac{\partial}{\partial \sigma^2} \ln p(\mathbf{X} \mid \sigma^2) = -\frac{N}{\sigma^2} + \frac{1}{2\sigma^4} \sum_{k=1}^{N} x_k^2 = 0`,
        why: md`Si deriva rispetto a $\sigma^2$, più comodo che rispetto a $\sigma$. Con $v = \sigma^2$ e $S = \sum_k x_k^2$: $\frac{d}{dv}(-N\ln v) = -\frac{N}{v}$ e $\frac{d}{dv}\left(-\frac{S}{2v}\right) = \frac{S}{2v^2}$. Poi si pone la derivata uguale a zero (equazione di verosimiglianza, *likelihood equation*).`,
      },
      {
        latex: md`-2N\sigma^2 + \sum_{k=1}^{N} x_k^2 = 0`,
        why: md`Passaggio intermedio: si moltiplicano entrambi i membri per $2\sigma^4 > 0$, il che non cambia le soluzioni.`,
      },
      {
        latex: md`\hat{\sigma}^2 = \frac{1}{2N} \sum_{k=1}^{N} x_k^2`,
        why: md`Risolvendo per $\sigma^2$: la stima è metà del valore quadratico medio dei campioni. È l'unico punto stazionario con $\sigma^2 > 0$ (basta un campione non nullo); il passo seguente verifica che è un massimo.`,
      },
      {
        latex: md`\left. \frac{\partial^2 \ln p(\mathbf{X} \mid \sigma^2)}{\partial (\sigma^2)^2} \right|_{\hat{\sigma}^2} = \frac{N}{\hat{\sigma}^4} - \frac{1}{\hat{\sigma}^6} \sum_{k=1}^{N} x_k^2 = \frac{N}{\hat{\sigma}^4} - \frac{2N}{\hat{\sigma}^4} = -\frac{N}{\hat{\sigma}^4} < 0`,
        why: md`Controllo del secondo ordine: derivando ancora si ha $\frac{N}{\sigma^4} - \frac{1}{\sigma^6}\sum_k x_k^2$; nel punto stazionario si usa $\sum_k x_k^2 = 2N\hat{\sigma}^2$ dal passo precedente. La derivata seconda è negativa, quindi è un massimo. È anche globale: la derivata prima, $\frac{S - 2N\sigma^2}{2\sigma^4}$, è positiva prima di $\hat{\sigma}^2$ e negativa dopo.`,
      },
      {
        latex: md`E\{x_k^2\} = \int_0^{+\infty} x^2 \, \frac{x}{\sigma^2}\, e^{-x^2/(2\sigma^2)}\, dx = \int_0^{+\infty} 2\sigma^2 u\, e^{-u}\, du = 2\sigma^2, \qquad u = \frac{x^2}{2\sigma^2}`,
        why: md`Passaggio intermedio: con la sostituzione $u = x^2/(2\sigma^2)$ si ha $du = \frac{x}{\sigma^2}\,dx$ e $x^2 = 2\sigma^2 u$, e $\int_0^{+\infty} u\,e^{-u}\,du = 1$. Lo stesso risultato viene dalle parentele fra i modelli della galleria: la Rayleigh è il modulo $\sqrt{z_1^2 + z_2^2}$ di due gaussiane indipendenti a media nulla e varianza $\sigma^2$, quindi $E\{x^2\} = E\{z_1^2\} + E\{z_2^2\} = 2\sigma^2$.`,
      },
      {
        latex: md`E\{x_k^2\} = 2\sigma^2 \;\Rightarrow\; E\{\hat{\sigma}^2\} = \frac{1}{2N} \cdot N \cdot 2\sigma^2 = \sigma^2`,
        why: md`Linearità del valore atteso: $N$ termini di media $2\sigma^2$ divisi per $2N$. La stima ML di $\sigma^2$ è non distorta per ogni $N$, non solo asintoticamente; è diverso dalla varianza gaussiana, la cui stima ML ha il fattore $(N-1)/N$ ([«stima ML della varianza gaussiana e suo bias»](#derivation:der05)).`,
      },
      {
        latex: md`E\{x_k^4\} = \int_0^{+\infty} 4\sigma^4 u^2 e^{-u}\, du = 8\sigma^4 \;\Rightarrow\; \mathrm{var}\{x_k^2\} = 8\sigma^4 - (2\sigma^2)^2 = 4\sigma^4`,
        why: md`Passaggio intermedio: stessa sostituzione, con $x^4 = 4\sigma^4 u^2$ e $\int_0^{+\infty} u^2 e^{-u}\,du = 2$; poi varianza uguale a momento secondo meno quadrato della media. Detto altrimenti, $u = x^2/(2\sigma^2)$ è un'esponenziale di media 1 e varianza 1.`,
      },
      {
        latex: md`s_k = \frac{\partial \ln p(x_k \mid \sigma^2)}{\partial \sigma^2} = -\frac{1}{\sigma^2} + \frac{x_k^2}{2\sigma^4}, \qquad \mathrm{var}\{s_k\} = \frac{\mathrm{var}\{x_k^2\}}{4\sigma^8} = \frac{1}{\sigma^4}`,
        why: md`Passaggio intermedio per l'informazione di Fisher (definizione della slide 14). Lo *score* di un campione ha media nulla, $-\frac{1}{\sigma^2} + \frac{2\sigma^2}{2\sigma^4} = 0$, e varianza $\frac{4\sigma^4}{4\sigma^8} = \frac{1}{\sigma^4}$. Per $N$ campioni indipendenti le varianze degli score si sommano: $\mathrm{I}(\sigma^2) = N/\sigma^4$.`,
      },
      {
        latex: md`\mathrm{var}\{\hat{\sigma}^2\} = \frac{\mathrm{var}\{x_k^2\}}{4N} = \frac{4\sigma^4}{4N} = \frac{\sigma^4}{N} = \mathrm{I}^{-1}(\sigma^2), \qquad \mathrm{I}(\sigma^2) = \frac{N}{\sigma^4}`,
        why: md`La varianza di una somma di termini indipendenti è la somma delle varianze, e la costante $\frac{1}{2N}$ esce al quadrato: $\frac{N \cdot \mathrm{var}\{x_k^2\}}{4N^2}$. Il risultato coincide con il bound di Cramér-Rao: la stima è efficiente. È un secondo esempio concreto del teorema della slide 19: la stima ML è non distorta, una stima efficiente esiste, e le due coincidono.`,
      },
      {
        latex: md`\hat{\sigma} = \sqrt{\hat{\sigma}^2} = \sqrt{\frac{1}{2N} \sum_{k=1}^{N} x_k^2}, \qquad E\{\hat{\sigma}\} < \sigma`,
        why: md`Per l'invarianza della stima ML ([«invarianza rispetto alla parametrizzazione»](#formula:f-c67)) la stima di $\sigma$ è la radice della stima di $\sigma^2$: il punto di massimo della likelihood è lo stesso, solo con un'etichetta diversa. La radice però è concava, e per la disuguaglianza di Jensen $E\{\sqrt{\hat{\sigma}^2}\} < \sqrt{E\{\hat{\sigma}^2\}} = \sigma$: l'invarianza conserva il punto di massimo, non la non distorsione.`,
      },
      {
        latex: md`\mathbf{X} = \{1, 2, 2\}: \quad \hat{\sigma}^2 = \frac{1 + 4 + 4}{2 \cdot 3} = 1.5, \qquad \hat{\sigma} = \sqrt{1.5} \approx 1.22`,
        why: md`Esempio numerico con tre ampiezze misurate: la somma dei quadrati è 9, divisa per $2N = 6$.`,
      },
    ],
    conclusion: md`Per la Rayleigh $\hat{\sigma}^2 = \frac{1}{2N}\sum_{k=1}^{N} x_k^2$: non distorta, con varianza $\sigma^4/N$ uguale al bound di Cramér-Rao, quindi efficiente. La stima di $\sigma$ è $\sqrt{\hat{\sigma}^2}$, stima ML per invarianza ma leggermente distorta verso il basso. La ricetta è sempre la stessa: likelihood come prodotto, logaritmo, derivata uguale a zero, controllo del secondo ordine.`,
    source: [{ doc: 'part1', page: 22 }, { doc: 'ch2', page: 17 }, { doc: 'ch2', page: 19 }],
  },

  // --- der14 Stima ML del parametro di una Bernoulli ---------------------------------------------------------
  {
    id: 'der14',
    title: 'Esercizio tipo: stima ML del parametro di una Bernoulli (dati discreti)',
    goal: md`Mostrare la ricetta ML nel caso discreto, dove la likelihood è davvero una probabilità (*maximizing the probability of observing the given data*, note p. 20), e controllare le proprietà della stima. Integrazione che collega alla parte del corso di Passerini sull'apprendimento con dati completi (*ML with complete data*).`,
    assumptions: md`$N$ osservazioni binarie $x_1, \ldots, x_N \in \{0, 1\}$, iid, con $P\{x_k = 1\} = \theta$ e $0 \leq \theta \leq 1$. Esempio: $x_k = 1$ se la parola «offerta» compare nella $k$-esima email di spam. $K$ è il numero di osservazioni uguali a 1.`,
    steps: [
      {
        latex: md`P(x_k \mid \theta) = \theta^{x_k} (1 - \theta)^{1 - x_k} = \begin{cases} \theta & x_k = 1 \\ 1 - \theta & x_k = 0 \end{cases}`,
        why: md`Passaggio intermedio: la scrittura con gli esponenti è un modo compatto di dire «$\theta$ se il campione vale 1, $1 - \theta$ se vale 0», perché una potenza con esponente 0 vale 1.`,
      },
      {
        latex: md`P(\mathbf{X} \mid \theta) = \prod_{k=1}^{N} \theta^{x_k} (1 - \theta)^{1 - x_k} = \theta^{K} (1 - \theta)^{N - K}, \quad K = \sum_{k=1}^{N} x_k`,
        why: md`Ogni campione vale 1 (la parola è presente) o 0. I campioni sono iid, quindi la probabilità del dataset è un prodotto; gli esponenti della stessa base si sommano, $\sum_k x_k = K$ e $\sum_k (1 - x_k) = N - K$. La likelihood dipende dai dati solo attraverso il conteggio $K$.`,
      },
      {
        latex: md`\ln P(\mathbf{X} \mid \theta) = K \ln \theta + (N - K) \ln(1 - \theta)`,
        why: md`Il logaritmo trasforma le potenze in prodotti e il prodotto in somma. Senza di esso, con $N$ grande il valore va in *underflow*: con $N = 2000$, $K = 600$ e $\theta = 0.3$ la likelihood vale circa $10^{-531}$, sotto il più piccolo numero positivo della doppia precisione (circa $5 \cdot 10^{-324}$), e il calcolatore la arrotonda a zero; il logaritmo vale invece circa $-1222$, un numero qualunque.`,
      },
      {
        latex: md`\frac{d}{d\theta} \ln P(\mathbf{X} \mid \theta) = \frac{K}{\theta} - \frac{N - K}{1 - \theta} = 0`,
        why: md`Derivata prima posta a zero, con $\frac{d}{d\theta}\ln(1 - \theta) = -\frac{1}{1 - \theta}$. I due termini tirano $\theta$ in direzioni opposte: gli 1 verso l'alto, gli 0 verso il basso.`,
      },
      {
        latex: md`K(1 - \theta) = (N - K)\theta \;\Rightarrow\; K - K\theta = N\theta - K\theta \;\Rightarrow\; K = N\theta`,
        why: md`Passaggio intermedio: si moltiplicano i due membri per $\theta(1 - \theta) > 0$ (per $0 < \theta < 1$) e il termine $K\theta$ si semplifica.`,
      },
      {
        latex: md`\hat{\theta} = \frac{K}{N}`,
        why: md`La stima ML di una probabilità è la frequenza relativa: il conteggio diviso per il totale. Se la parola compare in 3 delle 10 email di spam, $\hat{\theta} = 0.3$.`,
      },
      {
        latex: md`\frac{d^2}{d\theta^2} \ln P(\mathbf{X} \mid \theta) = -\frac{K}{\theta^2} - \frac{N - K}{(1 - \theta)^2} < 0`,
        why: md`Controllo del secondo ordine: entrambi i termini sono non positivi e almeno uno è strettamente negativo, quindi la log-likelihood è concava su tutto $(0, 1)$. Per $0 < K < N$ il punto stazionario è l'unico massimo globale.`,
      },
      {
        latex: md`K = 0 \;\Rightarrow\; \hat{\theta} = 0, \qquad K = N \;\Rightarrow\; \hat{\theta} = 1`,
        why: md`Casi limite. Se la parola non compare mai ($K = 0$) la log-likelihood $N\ln(1 - \theta)$ è decrescente; se compare sempre ($K = N$), $N\ln\theta$ è crescente. La derivata non si annulla dentro $(0, 1)$ e il massimo cade sul bordo. La formula $K/N$ resta valida ma dà probabilità 0 o 1: con pochi dati si preferisce una stima con prior (MAP, parte di Passerini).`,
      },
      {
        latex: md`E\{K\} = N\theta, \qquad \mathrm{var}\{K\} = N\theta(1 - \theta)`,
        why: md`Passaggio intermedio: ogni $x_k$ ha media $1 \cdot \theta + 0 \cdot (1 - \theta) = \theta$ e, poiché $x_k^2 = x_k$, varianza $E\{x_k^2\} - \theta^2 = \theta(1 - \theta)$. $K$ è la somma di $N$ termini indipendenti (una binomiale): medie e varianze si sommano.`,
      },
      {
        latex: md`s_k = \frac{x_k}{\theta} - \frac{1 - x_k}{1 - \theta} = \frac{x_k - \theta}{\theta(1 - \theta)}, \qquad \mathrm{var}\{s_k\} = \frac{\theta(1 - \theta)}{\theta^2 (1 - \theta)^2} = \frac{1}{\theta(1 - \theta)}`,
        why: md`Passaggio intermedio per l'informazione di Fisher (slide 14): lo score di un campione è lo scarto $x_k - \theta$ diviso per la costante $\theta(1 - \theta)$ (denominatore comune: $x_k(1 - \theta) - (1 - x_k)\theta = x_k - \theta$). Ha media nulla e varianza $\mathrm{var}\{x_k\}/[\theta(1 - \theta)]^2$. Con $N$ campioni indipendenti $\mathrm{I}(\theta) = N/(\theta(1 - \theta))$.`,
      },
      {
        latex: md`E\{\hat{\theta}\} = \theta, \qquad \mathrm{var}\{\hat{\theta}\} = \frac{\theta(1 - \theta)}{N} = \mathrm{I}^{-1}(\theta), \qquad \mathrm{I}(\theta) = \frac{N}{\theta(1 - \theta)}`,
        why: md`Si divide per $N$: $E\{K\}/N = \theta$ e $\mathrm{var}\{K\}/N^2 = \theta(1 - \theta)/N$. La stima è non distorta e la sua varianza coincide con il bound di Cramér-Rao, quindi è efficiente: un altro caso del teorema della slide 19. La varianza è massima per $\theta = 0.5$, dove il dato è più incerto.`,
      },
    ],
    conclusion: md`$\hat{\theta} = K/N$: la stima ML di una probabilità è la frequenza relativa. È non distorta ed efficiente per ogni $N$, ma con pochi dati può valere esattamente 0 o 1 (una parola mai vista avrebbe probabilità nulla): è il motivo per cui, nella parte di Passerini, si introducono le stime con prior (MAP).`,
    source: [{ doc: 'ch2', page: 17 }, { doc: 'part1', page: 20 }, { doc: 'ch2', page: 19 }],
  },

  // --- der15 Completamento del quadrato: la likelihood in m è una campana ---------------------------------------
  {
    id: 'der15',
    title: 'Completamento del quadrato: la likelihood gaussiana in m è una campana centrata nella media campionaria, larga σ/√N',
    goal: md`Mostrare senza derivate che la likelihood di $N$ campioni gaussiani a varianza nota, vista come funzione della media $m$, ha la forma di una campana centrata nella media campionaria $\bar{x}$ con deviazione standard $\sigma/\sqrt{N}$. Generalizza la lettura della figura «ML search» della slide 18 (un solo campione, campana centrata in $x_0$) e spiega perché nella figura della slide 10 la curva $p(\mathbf{X} \mid \theta)$ è molto più stretta delle singole pdf. Integrazione.`,
    assumptions: md`$N$ campioni scalari $x_1, \ldots, x_N$ iid secondo una gaussiana di media $m$ incognita e varianza $\sigma^2$ nota (*known variance*, slide 18).`,
    steps: [
      {
        latex: md`p(\mathbf{X} \mid m) = \prod_{k=1}^{N} \frac{1}{\sigma\sqrt{2\pi}} \exp\left[ -\frac{(x_k - m)^2}{2\sigma^2} \right]`,
        why: md`Passaggio intermedio: per campioni iid la likelihood è il prodotto delle $N$ pdf gaussiane, tutte con la stessa media incognita $m$ e la stessa varianza nota $\sigma^2$.`,
      },
      {
        latex: md`p(\mathbf{X} \mid m) = \left( \frac{1}{\sigma\sqrt{2\pi}} \right)^{N} \exp\left[ -\frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - m)^2 \right]`,
        why: md`Le costanti si moltiplicano e danno la potenza $N$-esima; gli esponenziali si combinano sommando gli esponenti.`,
      },
      {
        latex: md`x_k - m = (x_k - \bar{x}) + (\bar{x} - m), \qquad \bar{x} = \frac{1}{N} \sum_{k=1}^{N} x_k`,
        why: md`Si aggiunge e si toglie la media campionaria $\bar{x}$ in ogni scarto: è il primo passo del completamento del quadrato.`,
      },
      {
        latex: md`\sum_{k=1}^{N} (x_k - m)^2 = \sum_{k=1}^{N} (x_k - \bar{x})^2 + 2(\bar{x} - m) \sum_{k=1}^{N} (x_k - \bar{x}) + N(\bar{x} - m)^2`,
        why: md`Si sviluppa il quadrato del binomio, $(a + b)^2 = a^2 + 2ab + b^2$ con $a = x_k - \bar{x}$ e $b = \bar{x} - m$, e si somma su $k$. Il fattore $\bar{x} - m$ non dipende da $k$: esce dalla somma nel termine misto, e nell'ultimo termine si somma $N$ volte.`,
      },
      {
        latex: md`\sum_{k=1}^{N} (x_k - \bar{x}) = 0 \;\Rightarrow\; \sum_{k=1}^{N} (x_k - m)^2 = \sum_{k=1}^{N} (x_k - \bar{x})^2 + N(m - \bar{x})^2`,
        why: md`La somma degli scarti dalla media campionaria è nulla per definizione di $\bar{x}$: $\sum_k x_k - N\bar{x} = N\bar{x} - N\bar{x} = 0$. Il termine misto sparisce; resta una parte che non dipende da $m$ più $N$ volte il quadrato di $m - \bar{x}$ (il quadrato non cambia scambiando l'ordine della differenza).`,
      },
      {
        latex: md`p(\mathbf{X} \mid m) = C(\mathbf{X}) \exp\left[ -\frac{(m - \bar{x})^2}{2\sigma^2 / N} \right], \qquad C(\mathbf{X}) = \left( \frac{1}{\sigma\sqrt{2\pi}} \right)^{N} \exp\left[ -\frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - \bar{x})^2 \right]`,
        why: md`Si sostituisce nell'esponente e si spezza l'esponenziale in un prodotto; inoltre $\frac{N}{2\sigma^2} = \frac{1}{2\sigma^2/N}$. Tutto ciò che non dipende da $m$ finisce nella costante $C(\mathbf{X})$. Come funzione di $m$ resta un esponenziale con un quadrato, cioè la forma di una gaussiana di centro $\bar{x}$ e varianza $\sigma^2/N$. Non è però una pdf in $m$: la sua area vale $C(\mathbf{X})\sqrt{2\pi\sigma^2/N}$, in generale diversa da 1, perché la likelihood non è una densità nel parametro.`,
      },
      {
        latex: md`\hat{m} = \arg\max_{m} p(\mathbf{X} \mid m) = \bar{x}, \qquad \text{larghezza della campana in } m: \; \frac{\sigma}{\sqrt{N}}`,
        why: md`L'esponente è non positivo e vale zero solo per $m = \bar{x}$: si ritrova la media campionaria senza derivate (confronta [«derivata prima per una gaussiana con N campioni»](#derivation:der04)). Con $N = 1$ si ha $\bar{x} = x_0$ e larghezza $\sigma$: è la campana della figura «ML search» ([«esempio della fonte svolto analiticamente»](#derivation:der03)), dove si legge $\sigma = 1$ e $x_0 = 1$. Al crescere di $N$ la campana si stringe come $1/\sqrt{N}$: nella figura della slide 10, con una dozzina di campioni, $p(\mathbf{X} \mid \theta)$ è larga circa $\sigma/\sqrt{12} \approx 0.29\,\sigma$, molto più stretta delle singole pdf.`,
      },
      {
        latex: md`\ln p(\mathbf{X} \mid m) = \ln C(\mathbf{X}) - \frac{N}{2\sigma^2} (m - \bar{x})^2, \qquad \frac{\partial}{\partial m} \ln p(\mathbf{X} \mid m) = \frac{N}{\sigma^2} (\bar{x} - m)`,
        why: md`Passaggio intermedio: la log-likelihood è una parabola in $m$ rivolta verso il basso, con il vertice in $\bar{x}$ (la curva $l(\theta)$ della slide 10). La sua derivata si annulla solo in $m = \bar{x}$, come si ottiene derivando la forma di partenza.`,
      },
      {
        latex: md`\frac{\partial^2}{\partial m^2} \ln p(\mathbf{X} \mid m) = -\frac{N}{\sigma^2} = -\mathrm{I}(m)`,
        why: md`La curvatura della parabola è l'opposto dell'informazione di Fisher ([«la media campionaria gaussiana è non distorta, efficiente e consistente»](#derivation:der06)): più campioni, parabola più stretta e stima più precisa, con $\mathrm{var}\{\hat{m}\} = \sigma^2/N$ pari al quadrato della larghezza della campana. È anche il motivo per cui una prior gaussiana moltiplicata per questa likelihood dà una posterior gaussiana (domanda d'esame di Passerini, trattata nel foglio sulla stima bayesiana).`,
      },
    ],
    conclusion: md`Come funzione di $m$, $p(\mathbf{X} \mid m) = C(\mathbf{X})\exp\left[-\frac{(m - \bar{x})^2}{2\sigma^2/N}\right]$: una campana centrata in $\bar{x}$, che è quindi la stima ML, con larghezza $\sigma/\sqrt{N}$ che si stringe all'aumentare dei campioni. Non è una densità in $m$, ma la sua larghezza coincide con la deviazione standard della stima, $\sqrt{\mathrm{var}\{\hat{m}\}} = \sigma/\sqrt{N}$.`,
    source: [{ doc: 'ch2', page: 18 }, { doc: 'part1', page: 20 }, { doc: 'ch2', page: 10 }],
  },

  // --- der16 Condizione sufficiente (non necessaria) per la consistenza ------------------------------------------
  {
    id: 'der16',
    title: 'Asintoticamente non distorta e varianza che tende a zero: condizione sufficiente (non necessaria) per la consistenza',
    goal: md`Dimostrare, per un parametro scalare, che una stima asintoticamente non distorta con varianza che tende a zero è consistente. È la condizione che la slide 16 richiama e che rende consistente la stima ML (terza proprietà della slide 19). Chiarisce anche la parola usata dalla slide, «necessary condition»: la condizione è sufficiente, non necessaria. Integrazione.`,
    assumptions: md`Stima scalare $\hat{\theta}$ calcolata da $N$ osservazioni, con errore di stima $\varepsilon = \hat{\theta} - \theta$ (slide 12) di media e varianza finite per ogni $N$. Consistenza (slide 16): $\lim_{N \to +\infty} P\{\vert\varepsilon\vert < \delta\} = 1$ per ogni $\delta > 0$. Nel caso vettoriale la slide usa la norma $\lVert\boldsymbol{\varepsilon}\rVert$: l'estensione è in un passo dedicato.`,
    steps: [
      {
        latex: md`E\{\varepsilon^2\} = \mathrm{var}\{\varepsilon\} + \left( E\{\varepsilon\} \right)^2, \qquad \varepsilon = \hat{\theta} - \theta`,
        why: md`Errore quadratico medio uguale a varianza più bias al quadrato. È l'identità $\mathrm{var}\{\varepsilon\} = E\{(\varepsilon - E\{\varepsilon\})^2\} = E\{\varepsilon^2\} - 2(E\{\varepsilon\})^2 + (E\{\varepsilon\})^2 = E\{\varepsilon^2\} - (E\{\varepsilon\})^2$, applicata all'errore di stima della slide 12.`,
      },
      {
        latex: md`E\{\varepsilon^2\} = \int \varepsilon^2\, p(\varepsilon)\, d\varepsilon \geq \int_{|\varepsilon| \geq \delta} \varepsilon^2\, p(\varepsilon)\, d\varepsilon \geq \delta^2 \int_{|\varepsilon| \geq \delta} p(\varepsilon)\, d\varepsilon = \delta^2\, P\{|\varepsilon| \geq \delta\}`,
        why: md`Passaggio intermedio, che dimostra la disuguaglianza del passo seguente. $p(\varepsilon)$ è la densità dell'errore (per un errore discreto l'integrale diventa una somma). Si scarta la parte dell'integrale dove $\vert\varepsilon\vert < \delta$, che è non negativa; dove $\vert\varepsilon\vert \geq \delta$ vale $\varepsilon^2 \geq \delta^2$.`,
      },
      {
        latex: md`P\{|\varepsilon| \geq \delta\} = P\{\varepsilon^2 \geq \delta^2\} \leq \frac{E\{\varepsilon^2\}}{\delta^2} \qquad \forall \delta > 0`,
        why: md`È la disuguaglianza di Markov applicata alla variabile non negativa $\varepsilon^2$ (forma di Chebyshev): la probabilità di un errore grande è limitata dall'errore quadratico medio. I due eventi coincidono perché $\vert\varepsilon\vert \geq \delta$ equivale a $\varepsilon^2 \geq \delta^2$.`,
      },
      {
        latex: md`\lim_{N \to +\infty} E\{\varepsilon\} = 0 \;\text{ e }\; \lim_{N \to +\infty} \mathrm{var}\{\varepsilon\} = 0 \;\Rightarrow\; \lim_{N \to +\infty} E\{\varepsilon^2\} = 0`,
        why: md`Le due ipotesi della slide 16 (asintoticamente non distorta, varianza che tende a zero) annullano entrambi gli addendi del primo passo.`,
      },
      {
        latex: md`\lim_{N \to +\infty} P\{|\varepsilon| < \delta\} = 1 - \lim_{N \to +\infty} P\{|\varepsilon| \geq \delta\} = 1 \qquad \forall \delta > 0`,
        why: md`Si passa all'evento complementare. Poiché $0 \leq P\{\vert\varepsilon\vert \geq \delta\} \leq E\{\varepsilon^2\}/\delta^2 \to 0$, la probabilità di un errore minore di $\delta$ tende a 1: è la definizione di consistenza della slide 16. Per la stima ML le due ipotesi valgono (il bias svanisce e la varianza segue il bound, che scende come $1/N$: [«traccia della normalità asintotica»](#derivation:der17)), da cui la consistenza elencata nella slide 19.`,
      },
      {
        latex: md`P\{\lVert \boldsymbol{\varepsilon} \rVert \geq \delta\} \leq \frac{E\{\lVert \boldsymbol{\varepsilon} \rVert^2\}}{\delta^2} = \frac{1}{\delta^2} \sum_{i=1}^{r} \left[ \mathrm{var}\{\varepsilon_i\} + \left( E\{\varepsilon_i\} \right)^2 \right]`,
        why: md`Caso vettoriale della slide 16, con $r$ parametri: la stessa disuguaglianza applicata a $\lVert\boldsymbol{\varepsilon}\rVert^2 = \sum_i \varepsilon_i^2$, e il primo passo applicato a ogni componente. Basta che ogni componente dell'errore sia asintoticamente non distorta con varianza che tende a zero.`,
      },
      {
        latex: md`\hat{\theta}_N = \begin{cases} \theta & \text{con probabilità } 1 - 1/N \\ N & \text{con probabilità } 1/N \end{cases} \;\Rightarrow\; P\{|\varepsilon| < \delta\} \geq 1 - \frac{1}{N} \to 1, \quad E\{\varepsilon\} = \frac{N - \theta}{N} \to 1`,
        why: md`Controesempio costruito ad hoc (non nella fonte). Le definizioni guardano solo alla distribuzione dell'errore, e questa stima sbaglia soltanto con probabilità $1/N$: è consistente. Eppure il suo bias, $\frac{1}{N}(N - \theta)$, tende a 1.`,
      },
      {
        latex: md`E\{\varepsilon^2\} = \frac{(N - \theta)^2}{N}, \qquad \mathrm{var}\{\varepsilon\} = \frac{(N - \theta)^2}{N} - \frac{(N - \theta)^2}{N^2} = \frac{(N - \theta)^2 (N - 1)}{N^2} \approx N`,
        why: md`Passaggio intermedio: l'errore vale 0 con probabilità $1 - 1/N$ e $N - \theta$ con probabilità $1/N$. La varianza cresce all'incirca come $N$: entrambe le ipotesi della slide 16 falliscono, ma la stima è consistente. Errori rari ma enormi pesano sulla media e sulla varianza, non sulla probabilità di sbagliare. Quindi la condizione della slide non è necessaria: a rigore è sufficiente.`,
      },
      {
        latex: md`\hat{\theta}_N = \bar{x}_N + N B_N, \quad B_N \in \{0, 1\}, \; P\{B_N = 1\} = \frac{1}{N} \;\Rightarrow\; E\{\varepsilon\} = 1, \quad \mathrm{var}\{\varepsilon\} = \frac{\sigma^2}{N} + N - 1`,
        why: md`Stessa idea con una stima che si può davvero calcolare dai dati, per la media $\theta = m$ di una gaussiana: alla media campionaria $\bar{x}_N$ si aggiunge l'errore $N$ quando esce $B_N = 1$, un lancio di moneta truccata indipendente dai dati. Bias $N \cdot \frac{1}{N} = 1$; varianza $\frac{\sigma^2}{N} + N^2 \cdot \frac{1}{N}\left(1 - \frac{1}{N}\right)$, che diverge. Eppure $P\{\vert\varepsilon\vert < \delta\} \geq \left(1 - \frac{1}{N}\right) P\{\vert\bar{x}_N - m\vert < \delta\} \to 1$: consistente.`,
      },
    ],
    conclusion: md`Asintoticamente non distorta e varianza che tende a zero implicano la consistenza, grazie a $P\{\vert\varepsilon\vert \geq \delta\} \leq E\{\varepsilon^2\}/\delta^2$. Il viceversa è falso: la condizione della slide 16 è sufficiente, non necessaria, anche se la slide la chiama «necessary condition». All'orale conviene presentarla come condizione sufficiente e saperla giustificare con la disuguaglianza di Chebyshev. Per la stima ML entrambe le ipotesi valgono, quindi la stima è consistente.`,
    source: [{ doc: 'ch2', page: 16 }, { doc: 'ch2', page: 19 }, { doc: 'part1', page: 21 }, { doc: 'ch2', page: 12 }],
  },

  // --- der17 Traccia della normalità asintotica della stima ML --------------------------------------------------
  {
    id: 'der17',
    title: 'Traccia: perché ML è asintoticamente non distorta, asintoticamente efficiente e consistente (normalità asintotica)',
    goal: md`Dare il ragionamento dietro alle tre proprietà asintotiche che la slide 19 elenca senza dimostrazione (*asymptotically unbiased*, *asymptotically efficient*, *consistent*), nel caso di un parametro scalare. Usa lo sviluppo di Taylor, la legge dei grandi numeri e il teorema del limite centrale delle note (p. 23). Integrazione utile per rispondere a «Is Maximum Likelihood Estimation a good estimator?».`,
    assumptions: md`Parametro scalare $\theta$; campioni $x_1, \ldots, x_N$ iid generati dal modello $p(x \mid \theta)$ con il valore vero di $\theta$. Modello regolare: sono le ipotesi che la slide 19 lascia implicite (*in certain hypotheses regarding* $p(\mathbf{x} \mid \theta)$), cioè log-likelihood derivabile due volte, supporto di $p(x \mid \theta)$ indipendente da $\theta$, derivata e integrale scambiabili, informazione di Fisher di un campione $\mathrm{I}_1(\theta)$ finita e positiva. $l(\theta) = \ln p(\mathbf{X} \mid \theta)$ è la log-likelihood, come nella figura della slide 10. È una traccia, non una dimostrazione rigorosa: si trascurano i termini di ordine superiore dello sviluppo di Taylor.`,
    steps: [
      {
        latex: md`l'(\theta) = \frac{\partial \ln p(\mathbf{X} \mid \theta)}{\partial \theta} = \sum_{k=1}^{N} s_k(\theta), \qquad s_k(\theta) = \frac{\partial \ln p(x_k \mid \theta)}{\partial \theta}`,
        why: md`La derivata della log-likelihood (lo *score*) è la somma dei contributi dei singoli campioni ([«dal prodotto alla somma e alle equazioni di verosimiglianza»](#derivation:der02)): $N$ variabili aleatorie iid, perché ciascuna dipende da un solo campione.`,
      },
      {
        latex: md`E\{s_k(\theta)\} = \int \frac{\partial p(x \mid \theta)}{\partial \theta}\, dx = \frac{\partial}{\partial \theta} \int p(x \mid \theta)\, dx = \frac{\partial}{\partial \theta}\, 1 = 0`,
        why: md`Si scrive $s_k = \frac{\partial p/\partial\theta}{p}$, quindi nel valore atteso la $p$ al denominatore si semplifica con la densità: $E\{s_k\} = \int \frac{\partial p}{\partial\theta}\,dx$. Sotto le ipotesi di regolarità (supporto indipendente da $\theta$) derivata e integrale si possono scambiare, e l'integrale di una pdf vale 1: lo score ha media nulla nel parametro vero.`,
      },
      {
        latex: md`0 = \frac{\partial}{\partial \theta} \int \frac{\partial \ln p(x \mid \theta)}{\partial \theta}\, p(x \mid \theta)\, dx = E\left\{ \frac{\partial^2 \ln p(x_k \mid \theta)}{\partial \theta^2} \right\} + E\{s_k^2(\theta)\}`,
        why: md`Passaggio intermedio: si deriva ancora la relazione del passo precedente, scritta come $\int \frac{\partial \ln p}{\partial\theta}\,p\,dx = 0$, scambiando di nuovo derivata e integrale. La derivata del prodotto dà due termini: $\frac{\partial^2 \ln p}{\partial\theta^2}\,p$ e $\frac{\partial \ln p}{\partial\theta}\,\frac{\partial p}{\partial\theta} = \left(\frac{\partial \ln p}{\partial\theta}\right)^2 p$, perché $\frac{\partial p}{\partial\theta} = \frac{\partial \ln p}{\partial\theta}\,p$.`,
      },
      {
        latex: md`\mathrm{var}\{s_k(\theta)\} = E\{s_k^2(\theta)\} = -E\left\{ \frac{\partial^2 \ln p(x_k \mid \theta)}{\partial \theta^2} \right\} = \mathrm{I}_1(\theta), \qquad \mathrm{I}(\theta) = N\, \mathrm{I}_1(\theta)`,
        why: md`Poiché lo score ha media nulla, la sua varianza è il momento secondo; il passo precedente la lega a meno il valore atteso della derivata seconda. È l'informazione di Fisher di un campione (definizione della slide 14 con $N = 1$). Per campioni indipendenti le informazioni si sommano (passo seguente).`,
      },
      {
        latex: md`\mathrm{I}(\theta) = E\left\{ \left( \sum_{k=1}^{N} s_k(\theta) \right)^2 \right\} = \sum_{k=1}^{N} E\{s_k^2(\theta)\} + \sum_{k \neq l} E\{s_k(\theta)\}\, E\{s_l(\theta)\} = N\, \mathrm{I}_1(\theta)`,
        why: md`Passaggio intermedio: definizione della slide 14 con un solo parametro, $\mathrm{I}(\theta) = E\{(\partial \ln p(\mathbf{X} \mid \theta)/\partial\theta)^2\}$. Sviluppando il quadrato della somma, i termini misti si fattorizzano per l'indipendenza e sono nulli perché ogni score ha media zero; restano $N$ termini uguali a $\mathrm{I}_1(\theta)$.`,
      },
      {
        latex: md`0 = l'(\hat{\theta}) \approx l'(\theta) + (\hat{\theta} - \theta)\, l''(\theta) \;\Rightarrow\; \hat{\theta} - \theta \approx \frac{l'(\theta) / N}{-l''(\theta) / N}`,
        why: md`La stima ML annulla lo score (equazione di verosimiglianza). Si sviluppa lo score con Taylor al primo ordine attorno al valore vero $\theta$, lecito quando $\hat{\theta}$ è vicino a $\theta$, cioè per $N$ grande. Si risolve per $\hat{\theta} - \theta$ e si divide sopra e sotto per $N$.`,
      },
      {
        latex: md`-\frac{l''(\theta)}{N} = -\frac{1}{N} \sum_{k=1}^{N} \frac{\partial^2 \ln p(x_k \mid \theta)}{\partial \theta^2} \;\xrightarrow{\; N \to \infty \;}\; \mathrm{I}_1(\theta)`,
        why: md`Il denominatore è una media campionaria di $N$ termini iid: per la legge dei grandi numeri (*law of large numbers*) tende al suo valore atteso, che per il quarto passo è $\mathrm{I}_1(\theta) > 0$.`,
      },
      {
        latex: md`\frac{l'(\theta)}{N} = \frac{1}{N} \sum_{k=1}^{N} s_k(\theta) \;\approx\; \mathcal{N}\!\left( 0, \frac{\mathrm{I}_1(\theta)}{N} \right)`,
        why: md`Il numeratore è la media di $N$ variabili iid a media nulla (secondo passo) e varianza finita $\mathrm{I}_1(\theta)$ (quarto passo): per il teorema del limite centrale (*Central Limit Theorem*, note p. 23) è approssimativamente gaussiano con media 0 e varianza $\mathrm{I}_1(\theta)/N$. Qui $\mathcal{N}$ indica la distribuzione gaussiana, da non confondere con il numero di campioni $N$.`,
      },
      {
        latex: md`\hat{\theta} - \theta \approx \frac{1}{\mathrm{I}_1(\theta)} \cdot \frac{l'(\theta)}{N}`,
        why: md`Passaggio intermedio: per $N$ grande il denominatore si sostituisce con il suo limite $\mathrm{I}_1(\theta)$, che è una costante (a rigore serve il lemma di Slutsky). Resta il numeratore gaussiano diviso per una costante.`,
      },
      {
        latex: md`\hat{\theta} - \theta \;\approx\; \mathcal{N}\!\left( 0, \frac{1}{N\, \mathrm{I}_1(\theta)} \right) = \mathcal{N}\!\left( 0, \mathrm{I}^{-1}(\theta) \right)`,
        why: md`Dividendo una gaussiana a media nulla e varianza $\mathrm{I}_1/N$ per la costante $\mathrm{I}_1$ si ottiene media nulla e varianza $\frac{\mathrm{I}_1/N}{\mathrm{I}_1^2} = \frac{1}{N\,\mathrm{I}_1} = \mathrm{I}^{-1}(\theta)$: l'errore della stima ML è asintoticamente gaussiano con la varianza del bound di Cramér-Rao (normalità asintotica, *asymptotic normality*).`,
      },
      {
        latex: md`E\{\varepsilon\} \to 0, \qquad \frac{\mathrm{var}\{\varepsilon\}}{\mathrm{I}^{-1}(\theta)} \to 1, \qquad \mathrm{var}\{\varepsilon\} \approx \frac{1}{N\, \mathrm{I}_1(\theta)} \to 0`,
        why: md`Si leggono le tre proprietà della slide 19: media dell'errore che tende a zero (asintoticamente non distorta, slide 15), rapporto fra varianza e bound che tende a 1 (asintoticamente efficiente, slide 15), bias e varianza che tendono a zero e quindi consistenza ([«condizione sufficiente per la consistenza»](#derivation:der16)). È una traccia per $N$ grande: con $N$ finito le proprietà possono mancare, come per la varianza gaussiana ([«stima ML della varianza gaussiana e suo bias»](#derivation:der05)).`,
      },
      {
        latex: md`s_k = \frac{x_k - m}{\sigma^2}, \quad \mathrm{I}_1(m) = \frac{1}{\sigma^2}, \quad \hat{m} - m = \frac{1}{N} \sum_{k=1}^{N} (x_k - m) \sim \mathcal{N}\!\left( 0, \frac{\sigma^2}{N} \right)`,
        why: md`Controllo sulla media di una gaussiana a varianza nota. La log-likelihood è una parabola, quindi lo sviluppo di Taylor è esatto ($l''(m) = -N/\sigma^2$ costante) e la stima è la media campionaria. L'errore è la media di $N$ gaussiane indipendenti di media zero e varianza $\sigma^2$: è esattamente gaussiano con varianza $\sigma^2/N = \mathrm{I}^{-1}(m)$ per ogni $N$, non solo asintoticamente ([«la media campionaria gaussiana è non distorta, efficiente e consistente»](#derivation:der06)).`,
      },
    ],
    conclusion: md`Per $N$ grande l'errore della stima ML è approssimativamente $\mathcal{N}(0, \mathrm{I}^{-1}(\theta))$: media che tende a zero e varianza che tende al bound di Cramér-Rao, il quale scende come $1/N$. Da qui le tre proprietà della slide 19: asintoticamente non distorta, asintoticamente efficiente, consistente. Le ipotesi di regolarità servono davvero: per l'uniforme su $[0, \theta]$, il cui supporto dipende da $\theta$, lo score di un campione vale $-1/\theta$ e non ha media nulla, il massimo cade sul bordo $\max_k x_k$ e il ragionamento non si applica.`,
    source: [{ doc: 'ch2', page: 19 }, { doc: 'part1', page: 21 }, { doc: 'part1', page: 23 }, { doc: 'ch2', page: 14 }, { doc: 'ch2', page: 15 }],
  },

  // --- der18 Il volume sotto la campana gaussiana vale 1 -----------------------------------------------------------
  {
    id: 'der18',
    title: 'La costante di normalizzazione della gaussiana multivariata: perché il volume sotto la campana vale 1',
    goal: md`Mostrare che la costante $\frac{1}{(2\pi)^{n/2}\vert\Sigma\vert^{1/2}}$ della formula multivariata (note, p. 23) è esattamente quella che rende unitario il volume sotto la campana (*bell-shaped surface with unit volume*, note p. 24). La fonte enuncia il volume unitario senza verificarlo: integrazione.`,
    assumptions: md`$\Sigma$ di dimensione $n \times n$, simmetrica e definita positiva, con decomposizione spettrale $\Sigma = \mathbf{U}\Lambda\mathbf{U}^t$: $\mathbf{U} = [\mathbf{e}_1 \ldots \mathbf{e}_n]$ ortogonale e autovalori $\lambda_1, \ldots, \lambda_n > 0$. Gli integrali sono estesi a tutto lo spazio delle feature. $\vert\cdot\vert$ applicato a una matrice indica il determinante, come nelle note.`,
    steps: [
      {
        latex: md`\int p(\mathbf{x})\, d\mathbf{x} = \frac{1}{(2\pi)^{n/2} |\Sigma|^{1/2}} \int \exp\left[ -\frac{1}{2} (\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m}) \right] d\mathbf{x}`,
        why: md`La costante non dipende da $\mathbf{x}$ ed esce dall'integrale, esteso a tutto lo spazio delle feature.`,
      },
      {
        latex: md`\mathbf{y} = \mathbf{U}^t (\mathbf{x} - \mathbf{m}), \quad \Sigma = \mathbf{U} \Lambda \mathbf{U}^t, \quad |\det \mathbf{U}| = 1 \;\Rightarrow\; d\mathbf{x} = d\mathbf{y}`,
        why: md`Stesso cambio di coordinate della dimostrazione sugli isolivelli ([«isolivelli ellittici»](#derivation:der11)), in $n$ dimensioni: traslazione in $\mathbf{m}$ e rotazione sugli autovettori. La trasformazione inversa è $\mathbf{x} = \mathbf{m} + \mathbf{U}\mathbf{y}$, con matrice jacobiana $\mathbf{U}$; da $\mathbf{U}^t\mathbf{U} = \mathbf{I}$ segue $(\det\mathbf{U})^2 = 1$. Una rotazione non cambia i volumi: lo jacobiano vale 1.`,
      },
      {
        latex: md`(\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m}) = \mathbf{y}^t \Lambda^{-1} \mathbf{y} = \sum_{i=1}^{n} \frac{y_i^2}{\lambda_i}`,
        why: md`Nelle nuove coordinate la forma quadratica è diagonale, come nel caso 2-D: gli autovalori $\lambda_i$ fanno la parte delle varianze lungo gli assi ruotati.`,
      },
      {
        latex: md`\exp\left[ -\frac{1}{2} \sum_{i=1}^{n} \frac{y_i^2}{\lambda_i} \right] = \prod_{i=1}^{n} e^{-y_i^2 / (2\lambda_i)}`,
        why: md`Passaggio intermedio: l'esponenziale di una somma è il prodotto degli esponenziali. Ogni fattore dipende da una sola coordinata $y_i$.`,
      },
      {
        latex: md`\left( \int_{-\infty}^{+\infty} e^{-t^2/2}\, dt \right)^2 = \int_{0}^{2\pi} \int_{0}^{+\infty} e^{-r^2/2}\, r\, dr\, d\varphi = 2\pi \;\Rightarrow\; \int_{-\infty}^{+\infty} e^{-t^2/2}\, dt = \sqrt{2\pi}`,
        why: md`Passaggio intermedio: l'integrale gaussiano. Il quadrato dell'integrale è l'integrale doppio sul piano di $e^{-(t_1^2 + t_2^2)/2}$; in coordinate polari $t_1^2 + t_2^2 = r^2$ e $dt_1\,dt_2 = r\,dr\,d\varphi$, e $\int_0^{+\infty} e^{-r^2/2}\,r\,dr = \left[-e^{-r^2/2}\right]_0^{+\infty} = 1$. L'integrale è positivo, quindi si prende la radice positiva.`,
      },
      {
        latex: md`y_i = \sqrt{\lambda_i}\, t \;\Rightarrow\; \int_{-\infty}^{+\infty} e^{-y_i^2 / (2\lambda_i)}\, dy_i = \sqrt{\lambda_i} \int_{-\infty}^{+\infty} e^{-t^2/2}\, dt = \sqrt{2\pi\lambda_i}`,
        why: md`Passaggio intermedio: cambio di scala $dy_i = \sqrt{\lambda_i}\,dt$, possibile perché $\lambda_i > 0$. È il fattore che rende finita l'area: con $\lambda_i \leq 0$ l'integrale non esisterebbe, ed è il motivo per cui $\Sigma$ deve essere definita positiva.`,
      },
      {
        latex: md`\int \exp\left[ -\sum_{i=1}^{n} \frac{y_i^2}{2\lambda_i} \right] d\mathbf{y} = \prod_{i=1}^{n} \int_{-\infty}^{+\infty} e^{-y_i^2 / (2\lambda_i)}\, dy_i = \prod_{i=1}^{n} \sqrt{2\pi\lambda_i}`,
        why: md`L'integrando è un prodotto di funzioni di una variabile ciascuna, quindi l'integrale multiplo si separa in $n$ integrali monodimensionali; ciascuno vale $\sqrt{2\pi\lambda_i}$ per il passo precedente.`,
      },
      {
        latex: md`|\Sigma| = |\mathbf{U}|\, |\Lambda|\, |\mathbf{U}^t| = |\Lambda| = \prod_{i=1}^{n} \lambda_i`,
        why: md`Passaggio intermedio: il determinante di un prodotto è il prodotto dei determinanti, $\vert\mathbf{U}\vert\,\vert\mathbf{U}^t\vert = \vert\mathbf{U}\mathbf{U}^t\vert = 1$, e il determinante di una matrice diagonale è il prodotto degli elementi diagonali.`,
      },
      {
        latex: md`\prod_{i=1}^{n} \sqrt{2\pi\lambda_i} = (2\pi)^{n/2} \left( \prod_{i=1}^{n} \lambda_i \right)^{1/2} = (2\pi)^{n/2} |\Sigma|^{1/2}`,
        why: md`$n$ fattori $\sqrt{2\pi}$ danno $(2\pi)^{n/2}$, e il prodotto delle radici è la radice del prodotto. Il determinante di una matrice è il prodotto dei suoi autovalori (passo precedente): $\vert\Sigma\vert = \lambda_1\lambda_2 \cdots \lambda_n$.`,
      },
      {
        latex: md`\int p(\mathbf{x})\, d\mathbf{x} = \frac{(2\pi)^{n/2} |\Sigma|^{1/2}}{(2\pi)^{n/2} |\Sigma|^{1/2}} = 1`,
        why: md`La costante della formula compensa esattamente l'integrale dell'esponenziale: il volume sotto la campana è 1 per ogni $\mathbf{m}$ e ogni $\Sigma$ definita positiva. Con $n = 2$ il picco vale $p(\mathbf{m}) = 1/(2\pi\vert\Sigma\vert^{1/2})$: se la campana si allarga ($\vert\Sigma\vert$ cresce) deve abbassarsi. Per esempio con $\Sigma = \mathbf{I}_2$ il picco è $1/(2\pi) \approx 0.159$, con la matrice $\begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}$ (determinante 3) è $1/(2\pi\sqrt{3}) \approx 0.092$.`,
      },
    ],
    conclusion: md`$\int \exp\left[-\frac{1}{2}(\mathbf{x} - \mathbf{m})^t\Sigma^{-1}(\mathbf{x} - \mathbf{m})\right] d\mathbf{x} = (2\pi)^{n/2}\vert\Sigma\vert^{1/2}$, quindi la costante $\frac{1}{(2\pi)^{n/2}\vert\Sigma\vert^{1/2}}$ rende la gaussiana multivariata una densità: volume 1 sotto la campana. Con $n = 1$ si ritrova il fattore $\frac{1}{\sigma\sqrt{2\pi}}$ della gaussiana monodimensionale.`,
    source: [{ doc: 'part1', page: 23 }, { doc: 'part1', page: 24 }],
  },

  // --- der19 Feature indipendenti ⇒ Σ diagonale ----------------------------------------------------------------
  {
    id: 'der19',
    title: 'Feature indipendenti ⇒ covarianze nulle ⇒ Σ diagonale (il viceversa non vale in generale, ma vale per la gaussiana congiunta)',
    goal: md`Dimostrare l'implicazione scritta nelle note (p. 24), «When the features are independent, the covariance matrix is diagonal», e chiarire perché il verso opposto in generale non vale, mentre vale per un vettore congiuntamente gaussiano, dove $\Sigma$ diagonale basta per la fattorizzazione ([«con Σ diagonale la gaussiana si fattorizza»](#derivation:der10)). Integrazione.`,
    assumptions: md`Vettore di feature $\mathbf{x} = (x_1, \ldots, x_n)^t$ con vettore medio $\mathbf{m}$ e varianze finite; $p(x_i, x_j)$ è la densità congiunta di due feature, $p(x_i)$ e $p(x_j)$ sono le marginali. Indipendenza (*independent features*): $p(x_i, x_j) = p(x_i)\,p(x_j)$ per ogni coppia $i \neq j$; per la sola diagonalità di $\Sigma$ basta l'indipendenza a coppie.`,
    steps: [
      {
        latex: md`[\Sigma]_{ij} = E\{(x_i - m_i)(x_j - m_j)\} = \iint (x_i - m_i)(x_j - m_j)\, p(x_i, x_j)\, dx_i\, dx_j, \qquad i \neq j`,
        why: md`Definizione dell'elemento fuori diagonale di $\Sigma = E\{(\mathbf{x} - \mathbf{m})(\mathbf{x} - \mathbf{m})^t\}$ (note p. 24), come valore atteso rispetto alla densità congiunta delle due feature: è la covarianza fra $x_i$ e $x_j$.`,
      },
      {
        latex: md`p(x_i, x_j) = p(x_i)\, p(x_j) \;\Rightarrow\; [\Sigma]_{ij} = \int (x_i - m_i)\, p(x_i)\, dx_i \cdot \int (x_j - m_j)\, p(x_j)\, dx_j`,
        why: md`Con feature indipendenti la densità congiunta si fattorizza nel prodotto delle marginali; l'integrando diventa il prodotto di una funzione di $x_i$ e di una funzione di $x_j$, e l'integrale doppio si separa nel prodotto di due integrali semplici.`,
      },
      {
        latex: md`[\Sigma]_{ij} = (E\{x_i\} - m_i)(E\{x_j\} - m_j) = 0 \cdot 0 = 0, \qquad i \neq j`,
        why: md`Ogni fattore è il valore atteso dello scarto dalla propria media, che è nullo perché $E\{x_i\} = m_i$: tutte le covarianze sono zero e $\Sigma$ è diagonale.`,
      },
      {
        latex: md`\Sigma = \begin{bmatrix} \sigma_1^2 & 0 & \cdots & 0 \\ 0 & \sigma_2^2 & \cdots & 0 \\ \cdots & \cdots & \cdots & \cdots \\ 0 & 0 & \cdots & \sigma_n^2 \end{bmatrix}`,
        why: md`È la matrice delle note (p. 24): zeri fuori diagonale e, sulla diagonale, $[\Sigma]_{ii} = E\{(x_i - m_i)^2\} = \sigma_i^2$, la varianza della $i$-esima feature.`,
      },
      {
        latex: md`\mathrm{cov}\{x, y\} = E\{(x - E\{x\})(y - E\{y\})\} = E\{xy\} - E\{x\}\, E\{y\}`,
        why: md`Passaggio intermedio per il verso opposto: si sviluppa il prodotto e si usa la linearità del valore atteso. È la versione scalare di $\Sigma = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$ delle note.`,
      },
      {
        latex: md`x \sim \mathcal{N}(0, 1), \; y = x^2 \;\Rightarrow\; \mathrm{cov}\{x, y\} = E\{x^3\} - E\{x\}\, E\{x^2\} = 0 - 0 \cdot 1 = 0`,
        why: md`Il viceversa non vale in generale: $y$ è funzione di $x$ (dipendenza totale), eppure la covarianza è nulla, perché i momenti dispari di una gaussiana a media nulla sono zero (si integra una funzione dispari contro una densità pari). Covarianza nulla significa assenza di legame lineare, non indipendenza.`,
      },
      {
        latex: md`P\{y > 1 \mid |x| > 1\} = 1 \neq P\{y > 1\} = P\{|x| > 1\} \approx 0.317`,
        why: md`Controllo che $x$ e $y$ sono davvero dipendenti: sapere che $\vert x\vert > 1$ rende certo $y > 1$, mentre senza informazioni $y > 1$ ha probabilità $2(1 - \Phi(1)) \approx 0.317$, con $\Phi$ la funzione di ripartizione della gaussiana standard. La coppia $(x, y)$ non è congiuntamente gaussiana: $y$ non è mai negativa.`,
      },
      {
        latex: md`\Sigma = \mathrm{diag}(\sigma_1^2, \ldots, \sigma_n^2) \;\Rightarrow\; (\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m}) = \sum_{i=1}^{n} \frac{(x_i - m_i)^2}{\sigma_i^2}, \qquad |\Sigma|^{1/2} = \prod_{i=1}^{n} \sigma_i`,
        why: md`Passaggio intermedio per il caso gaussiano: l'inversa di una matrice diagonale ha sulla diagonale i reciproci, e il determinante è il prodotto degli elementi diagonali. L'esponenziale della somma diventa un prodotto di esponenziali, uno per feature.`,
      },
      {
        latex: md`\mathbf{x} \text{ gaussiano}, \; \Sigma \text{ diagonale} \;\Rightarrow\; p(\mathbf{x}) = p(x_1)\, p(x_2) \ldots p(x_n)`,
        why: md`Per un vettore congiuntamente gaussiano (la sua pdf è la formula multivariata; non basta che ogni feature sia gaussiana da sola) $\Sigma$ diagonale basta per l'indipendenza: con il passo precedente la formula multivariata si fattorizza nel prodotto delle marginali $\frac{1}{\sigma_i\sqrt{2\pi}}e^{-(x_i - m_i)^2/(2\sigma_i^2)}$. Per questo nelle note «independent» e «diagonal» vanno insieme.`,
      },
    ],
    conclusion: md`Feature indipendenti implicano sempre $\Sigma$ diagonale. Il contrario in generale non vale: covarianza nulla vuol dire soltanto assenza di legame lineare. Vale invece per un vettore congiuntamente gaussiano, il caso che interessa le note; non è però un privilegio esclusivo della gaussiana (per esempio due variabili binarie incorrelate sono anche indipendenti, perché con due soli valori la covarianza nulla basta a fattorizzare la congiunta). In pratica, assumere $\Sigma$ diagonale in un classificatore gaussiano (l'ipotesi del *naive Bayes* gaussiano) riduce i parametri della covarianza da $n(n+1)/2$ a $n$, al prezzo di ignorare le correlazioni fra feature come altezza e peso.`,
    source: [{ doc: 'part1', page: 24 }],
  },
]
