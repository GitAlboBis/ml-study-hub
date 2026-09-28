// Derivazioni del foglio m04 (bontà di uno stimatore, bound di Cramér-Rao, proprietà asintotiche): der12-der22.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più servono a seguire i conti
// che l'inventario salta: il perché di ciascuno dice «Passaggio intermedio» o «Controllo». Tranne der19 (che esplicita
// una frase delle note, part1 p17), sono integrazioni non presenti nella fonte (ch2 p12-16, part1 p17-21) e il goal lo
// dice. La notazione è quella delle slide (var{ε_i}, [I⁻¹(θ)]_ii, E{·}), controllata sulle immagini delle pagine.
// Ogni passaggio algebrico è stato ricalcolato; i numeri coincidono con quelli degli esempi svolti dell'inventario.
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivationsB: Derivation[] = [
  // --- der12 Matrice di Fisher 2×2 per una gaussiana con θ = (m, σ²) --------------------------------------
  {
    id: 'der12',
    title: 'Matrice di Fisher 2×2 per una gaussiana con θ = (m, σ²)',
    goal: md`Applicare la definizione elemento per elemento della matrice di Fisher (slide 14) al caso $r = 2$, con media e varianza entrambe incognite, e leggere sulla diagonale dell'inversa i due bound di Cramér-Rao. Esempio non presente nella fonte.`,
    assumptions: md`$N$ campioni scalari $x_1, \ldots, x_N$ indipendenti e identicamente distribuiti (*iid*) secondo $\mathcal{N}(m, \sigma^2)$. Il vettore dei parametri è $\boldsymbol{\theta} = (\theta_1, \theta_2) = (m, \sigma^2)$: il secondo parametro è la varianza, non la deviazione standard, e si deriva rispetto a $\sigma^2$ come a una variabile sola. Servono tre momenti centrali della gaussiana: $E\{(x_k - m)^2\} = \sigma^2$, $E\{(x_k - m)^3\} = 0$, $E\{(x_k - m)^4\} = 3\sigma^4$.`,
    steps: [
      {
        latex: md`\ln p(\mathbf{X}|\boldsymbol{\theta}) = -\frac{N}{2} \ln(2\pi) - \frac{N}{2} \ln \sigma^2 - \frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - m)^2`,
        why: md`Log-likelihood di $N$ campioni gaussiani iid con entrambi i parametri incogniti, $\theta_1 = m$ e $\theta_2 = \sigma^2$. Il logaritmo trasforma il prodotto delle densità in una somma, e $\ln(2\pi\sigma^2)$ si spezza in $\ln(2\pi) + \ln\sigma^2$ per isolare il parametro $\sigma^2$.`,
      },
      {
        latex: md`\frac{\partial \ln p}{\partial m} = \frac{1}{\sigma^2} \sum_{k=1}^{N} (x_k - m), \qquad \frac{\partial \ln p}{\partial \sigma^2} = -\frac{N}{2\sigma^2} + \frac{1}{2\sigma^4} \sum_{k=1}^{N} (x_k - m)^2`,
        why: md`Le due componenti del gradiente della log-likelihood (lo *score*). Rispetto a $m$ si deriva $(x_k - m)^2$, che dà $-2(x_k - m)$; rispetto a $\sigma^2$ si derivano $-\frac{N}{2}\ln v$ e $-\frac{1}{2v}\sum_k (x_k - m)^2$ con $v = \sigma^2$, che danno $-\frac{N}{2v}$ e $+\frac{1}{2v^2}\sum_k (x_k - m)^2$.`,
      },
      {
        latex: md`\frac{\partial \ln p}{\partial \sigma^2} = \frac{Q - N\sigma^2}{2\sigma^4}, \qquad Q = \sum_{k=1}^{N} (x_k - m)^2, \qquad E\{Q\} = N\sigma^2`,
        why: md`Passaggio intermedio: si porta la seconda componente sul denominatore comune $2\sigma^4$. $Q$ è la somma dei quadrati degli scarti dalla media vera; ogni addendo ha valore atteso $\sigma^2$, quindi anche questa componente dello score ha media nulla, come deve in un modello regolare.`,
      },
      {
        latex: md`[\mathbf{I}]_{11} = E\left\{ \left( \frac{\partial \ln p}{\partial m} \right)^2 \right\} = \frac{N}{\sigma^2}`,
        why: md`Stesso calcolo di [«bound per la media di una gaussiana»](#derivation:der05): sviluppando il quadrato della somma, i termini misti $E\{(x_k - m)(x_l - m)\}$ con $k \neq l$ si annullano per l'indipendenza e restano $N$ termini uguali a $\sigma^2$, divisi per $\sigma^4$.`,
      },
      {
        latex: md`\operatorname{var}\{Q\} = \sum_{k=1}^{N} \operatorname{var}\{(x_k - m)^2\} = N \left( E\{(x_k - m)^4\} - \sigma^4 \right) = N (3\sigma^4 - \sigma^4) = 2N\sigma^4`,
        why: md`Passaggio intermedio: la varianza di una somma di termini indipendenti è la somma delle varianze, e la varianza di $(x_k - m)^2$ è il momento quarto meno il quadrato del momento secondo. Il momento quarto della gaussiana è $3\sigma^4$. È lo stesso risultato che si legge dicendo che $Q/\sigma^2$ è una chi-quadrato (*chi-square*) con $N$ gradi di libertà, di media $N$ e varianza $2N$.`,
      },
      {
        latex: md`[\mathbf{I}]_{22} = E\left\{ \left( \frac{Q - N\sigma^2}{2\sigma^4} \right)^2 \right\} = \frac{\operatorname{var}\{Q\}}{4\sigma^8} = \frac{2N\sigma^4}{4\sigma^8} = \frac{N}{2\sigma^4}, \qquad Q = \sum_{k=1}^{N} (x_k - m)^2`,
        why: md`Poiché $E\{Q\} = N\sigma^2$, il valore atteso di $(Q - N\sigma^2)^2$ è per definizione $\operatorname{var}\{Q\}$; il quadrato di $2\sigma^4$ dà $4\sigma^8$ al denominatore e con il passo precedente resta $N/(2\sigma^4)$.`,
      },
      {
        latex: md`E\left\{ \sum_{k=1}^{N} (x_k - m) \sum_{l=1}^{N} (x_l - m)^2 \right\} = \sum_{k=1}^{N} E\{(x_k - m)^3\} + \sum_{k \neq l} E\{x_k - m\}\, E\{(x_l - m)^2\} = 0 + 0`,
        why: md`Passaggio intermedio per l'elemento fuori diagonale: con $k = l$ compare il momento centrale terzo, nullo per la simmetria della gaussiana; con $k \neq l$ il valore atteso si fattorizza per l'indipendenza e $E\{x_k - m\} = 0$.`,
      },
      {
        latex: md`[\mathbf{I}]_{12} = [\mathbf{I}]_{21} = E\left\{ \frac{1}{\sigma^2} \sum_{k=1}^{N} (x_k - m) \cdot \frac{Q - N\sigma^2}{2\sigma^4} \right\} = 0`,
        why: md`Si sviluppa il prodotto delle due componenti dello score: il pezzo con $Q$ è nullo per il passo precedente, il pezzo con $-N\sigma^2$ è nullo perché la somma degli scarti ha media zero. I momenti centrali dispari di una gaussiana sono nulli. La matrice è simmetrica, quindi $[\mathbf{I}]_{21} = [\mathbf{I}]_{12}$.`,
      },
      {
        latex: md`-E\left\{ \frac{\partial^2 \ln p}{\partial m^2} \right\} = \frac{N}{\sigma^2}, \qquad -E\left\{ \frac{\partial^2 \ln p}{\partial (\sigma^2)^2} \right\} = -\frac{N}{2\sigma^4} + \frac{E\{Q\}}{\sigma^6} = \frac{N}{2\sigma^4}, \qquad -E\left\{ \frac{\partial^2 \ln p}{\partial m\, \partial \sigma^2} \right\} = \frac{1}{\sigma^4} \sum_{k=1}^{N} E\{x_k - m\} = 0`,
        why: md`Controllo con la forma dell'informazione basata sulla curvatura, dimostrata in [«le due forme dell'informazione di Fisher»](#derivation:der13). Le derivate seconde sono $-N/\sigma^2$, $\frac{N}{2\sigma^4} - \frac{Q}{\sigma^6}$ e $-\frac{1}{\sigma^4}\sum_k (x_k - m)$: si ritrovano gli stessi tre elementi con conti più brevi, senza momenti quarti.`,
      },
      {
        latex: md`\mathbf{I}(\boldsymbol{\theta}) = \begin{bmatrix} N/\sigma^2 & 0 \\ 0 & N/(2\sigma^4) \end{bmatrix}, \qquad \mathbf{I}^{-1}(\boldsymbol{\theta}) = \begin{bmatrix} \sigma^2/N & 0 \\ 0 & 2\sigma^4/N \end{bmatrix}`,
        why: md`La matrice è diagonale, quindi l'inversa si ottiene invertendo gli elementi diagonali. In generale bisogna invertire l'intera matrice ([«perché il bound usa l'elemento diagonale dell'inversa»](#derivation:der14)).`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon_m\} \geq \frac{\sigma^2}{N}, \qquad \operatorname{var}\{\varepsilon_{\sigma^2}\} \geq \frac{2\sigma^4}{N}`,
        why: md`Si leggono i due bound sulla diagonale dell'inversa, come chiede la disuguaglianza della slide 14: $\varepsilon_m$ è l'errore sulla media, $\varepsilon_{\sigma^2}$ quello sulla varianza. Poiché la matrice è diagonale, stimare anche $\sigma^2$ non costa nulla alla stima di $m$: il bound sulla media resta $\sigma^2/N$, lo stesso di quando $\sigma$ è nota.`,
      },
    ],
    conclusion: md`Per una gaussiana con media e varianza incognite $\mathbf{I}(\boldsymbol{\theta})$ è diagonale, con elementi $N/\sigma^2$ e $N/(2\sigma^4)$: nessuno stimatore unbiased della media scende sotto $\sigma^2/N$ e nessuno stimatore unbiased della varianza scende sotto $2\sigma^4/N$. La media campionaria tocca il primo bound. La varianza campionaria con $1/(N-1)$ è unbiased ma ha varianza $2\sigma^4/(N-1)$: sta sopra il secondo bound per ogni $N$ finito, e il rapporto $N/(N-1)$ tende a 1, quindi è asintoticamente efficiente.`,
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },

  // --- der13 Le due forme dell'informazione di Fisher ----------------------------------------------------
  {
    id: 'der13',
    title: "Le due forme dell'informazione di Fisher: quadrato della pendenza e curvatura",
    goal: md`Mostrare, nel caso scalare, che il valore atteso del quadrato dello *score* (la definizione della slide 14 con $i = j$) coincide con l'opposto del valore atteso della derivata seconda della log-likelihood. È ciò che giustifica la lettura «log-likelihood appuntita = molta informazione». Non presente nella fonte.`,
    assumptions: md`Caso scalare ($r = 1$). Condizioni di regolarità (*regularity conditions*): il supporto di $p(\mathbf{X}|\theta)$ non dipende da $\theta$, la densità è derivabile due volte in $\theta$ e si possono scambiare derivata e integrale. Per un modello discreto, come la Bernoulli degli ultimi passi, gli integrali diventano somme. Per i due controlli servono campioni iid.`,
    steps: [
      {
        latex: md`\int p(\mathbf{X}|\theta)\, d\mathbf{X} = 1 \;\Longrightarrow\; \int \frac{\partial p(\mathbf{X}|\theta)}{\partial \theta}\, d\mathbf{X} = 0`,
        why: md`Una densità integra a 1 per ogni valore di $\theta$: la funzione di $\theta$ a sinistra è costante e la sua derivata è zero. Scambiando derivata e integrale (condizione di regolarità) si ottiene l'integrale della derivata.`,
      },
      {
        latex: md`\frac{\partial p(\mathbf{X}|\theta)}{\partial \theta} = p(\mathbf{X}|\theta)\, s, \quad s = \frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} \;\Longrightarrow\; E\{s\} = \int s\, p(\mathbf{X}|\theta)\, d\mathbf{X} = 0`,
        why: md`Identità della derivata logaritmica (*log-derivative trick*): $\partial \ln p / \partial \theta = (\partial p / \partial \theta) / p$, quindi $\partial p / \partial \theta = p\, s$. Sostituita nel passo precedente, l'integrale diventa il valore atteso dello score $s$: nel $\theta$ vero lo score ha media nulla.`,
      },
      {
        latex: md`\frac{\partial}{\partial \theta} \int s\, p(\mathbf{X}|\theta)\, d\mathbf{X} = \int \frac{\partial s}{\partial \theta}\, p(\mathbf{X}|\theta)\, d\mathbf{X} + \int s\, \frac{\partial p(\mathbf{X}|\theta)}{\partial \theta}\, d\mathbf{X} = 0`,
        why: md`L'identità $E\{s\} = 0$ vale per ogni $\theta$, quindi si può derivare una seconda volta rispetto a $\theta$: sotto il segno di integrale si applica la regola del prodotto a $s \cdot p$.`,
      },
      {
        latex: md`\frac{\partial s}{\partial \theta} = \frac{\partial^2 \ln p(\mathbf{X}|\theta)}{\partial \theta^2}, \qquad \int s\, \frac{\partial p(\mathbf{X}|\theta)}{\partial \theta}\, d\mathbf{X} = \int s \cdot s\, p(\mathbf{X}|\theta)\, d\mathbf{X} = E\{s^2\}`,
        why: md`Passaggio intermedio: la derivata dello score è la derivata seconda della log-likelihood; nel secondo integrale si riusa l'identità della derivata logaritmica, $\partial p / \partial \theta = s\, p$, e compare $s^2$ pesato con la densità.`,
      },
      {
        latex: md`E\left\{ \frac{\partial^2 \ln p(\mathbf{X}|\theta)}{\partial \theta^2} \right\} + E\{s^2\} = 0`,
        why: md`Si sostituiscono i due integrali del passo precedente: il primo è il valore atteso della curvatura della log-likelihood, il secondo il valore atteso del quadrato dello score.`,
      },
      {
        latex: md`I(\theta) = E\{s^2\} = -E\left\{ \frac{\partial^2 \ln p(\mathbf{X}|\theta)}{\partial \theta^2} \right\}`,
        why: md`Le due scritture dell'informazione di Fisher coincidono. La slide 14 usa la prima (valore atteso del prodotto delle derivate prime, qui con $i = j$). La seconda, con la curvatura, di solito richiede meno conti e dà la lettura geometrica: una log-likelihood appuntita attorno al massimo, cioè con curvatura grande, porta molta informazione.`,
      },
      {
        latex: md`[\mathbf{I}(\boldsymbol{\theta})]_{ij} = E\left\{ \frac{\partial \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_i} \cdot \frac{\partial \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_j} \right\} = -E\left\{ \frac{\partial^2 \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_i\, \partial \theta_j} \right\}`,
        why: md`Caso vettoriale, con lo stesso ragionamento: si parte da $E\{\partial \ln p / \partial \theta_i\} = 0$ e si deriva rispetto a $\theta_j$. Elemento per elemento si ottiene la forma matriciale $\mathbf{I}(\boldsymbol{\theta}) = -E\{\nabla_{\boldsymbol{\theta}} \nabla_{\boldsymbol{\theta}}^{t} \ln p(\mathbf{X}|\boldsymbol{\theta})\}$: la matrice di Fisher è l'opposto del valore atteso della matrice hessiana (*Hessian*) della log-likelihood.`,
      },
      {
        latex: md`\text{gaussiana, } \theta = m: \quad \frac{\partial^2 \ln p(\mathbf{X}|m)}{\partial m^2} = -\frac{N}{\sigma^2} \;\Longrightarrow\; I(m) = \frac{N}{\sigma^2}`,
        why: md`Controllo con la gaussiana di varianza nota ([«bound per la media di una gaussiana»](#derivation:der05)): la derivata rispetto a $m$ dello score $\frac{1}{\sigma^2}\sum_k (x_k - m)$ è $-N/\sigma^2$, la stessa per ogni training set. Il valore atteso non cambia nulla e si ritrova $I(m) = N/\sigma^2$.`,
      },
      {
        latex: md`p(x|\theta) = \theta^{x} (1-\theta)^{1-x}, \; x \in \{0, 1\}, \qquad k = \sum_{j=1}^{N} x_j, \qquad E\{k\} = N\theta, \qquad \operatorname{var}\{k\} = N\theta(1-\theta)`,
        why: md`Passaggio intermedio: modello di Bernoulli per $N$ email etichettate, con $x_j = 1$ se la $j$-esima è spam; $\theta$ è la probabilità di spam e $k$ il numero di email spam. La likelihood è $\theta^k (1-\theta)^{N-k}$: dipende dai dati solo tramite $k$, che ha distribuzione binomiale.`,
      },
      {
        latex: md`\text{Bernoulli: } \ln p(\mathbf{X}|\theta) = k \ln \theta + (N-k) \ln(1-\theta), \quad -E\left\{ -\frac{k}{\theta^2} - \frac{N-k}{(1-\theta)^2} \right\} = \frac{N}{\theta} + \frac{N}{1-\theta} = \frac{N}{\theta(1-\theta)}`,
        why: md`Si deriva due volte: la derivata prima è $\frac{k}{\theta} - \frac{N-k}{1-\theta}$, la seconda è quella tra parentesi graffe. Qui la curvatura dipende dai dati tramite $k$, e solo il suo valore atteso, con $E\{k\} = N\theta$, dà l'informazione $N/(\theta(1-\theta))$ usata nell'esercizio [«filtro antispam»](#exercise:es10).`,
      },
      {
        latex: md`s = \frac{k}{\theta} - \frac{N-k}{1-\theta} = \frac{k - N\theta}{\theta(1-\theta)} \;\Longrightarrow\; E\{s^2\} = \frac{\operatorname{var}\{k\}}{\theta^2(1-\theta)^2} = \frac{N\theta(1-\theta)}{\theta^2(1-\theta)^2} = \frac{N}{\theta(1-\theta)}`,
        why: md`Controllo con la prima forma: lo score della Bernoulli è proporzionale a $k - N\theta$, che ha media nulla e varianza binomiale $N\theta(1-\theta)$. Il valore atteso del quadrato dello score coincide con quello della curvatura, come dimostrato. Il bound $\theta(1-\theta)/N$ è raggiunto dalla frazione di spam osservata $k/N$, che è unbiased e ha proprio questa varianza.`,
      },
    ],
    conclusion: md`Sotto le condizioni di regolarità $I(\theta) = E\{s^2\} = -E\{\partial^2 \ln p / \partial \theta^2\}$, e nel caso vettoriale $[\mathbf{I}]_{ij}$ è l'opposto del valore atteso della derivata seconda mista. L'informazione di Fisher misura quanto è appuntita, in media, la log-likelihood attorno al parametro vero: più è appuntita, più è basso il bound di Cramér-Rao. Se il supporto dipende da $\theta$ il primo passo cade e le due forme non valgono più ([«quando le ipotesi di regolarità cadono»](#derivation:der20)).`,
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },

  // --- der14 Diagonale dell'inversa: caso 2×2 e regressione ----------------------------------------------
  {
    id: 'der14',
    title: "Perché il bound usa l'elemento diagonale dell'inversa: caso 2 × 2 con parametri accoppiati",
    goal: md`Mostrare che $[\mathbf{I}^{-1}]_{11} \geq 1/[\mathbf{I}]_{11}$ per una matrice di Fisher $2 \times 2$ e calcolare il bound sull'intercetta di una regressione lineare, dove i termini fuori diagonale non sono nulli. Completa la [«matrice di Fisher 2×2 per una gaussiana»](#derivation:der12), in cui la matrice è diagonale. Non presente nella fonte.`,
    assumptions: md`Matrice di Fisher simmetrica ([«dalla forma compatta alla definizione elemento per elemento»](#derivation:der04)) e definita positiva, quindi invertibile. Per la regressione: $N$ coppie $(x_k, y_k)$ con le $x_k$ fissate (non aleatorie) e non tutte uguali, rumore $n_k$ gaussiano iid di media nulla e varianza $\sigma^2$ nota; i parametri incogniti sono l'intercetta $a_0$ e la pendenza $b_0$. Le lettere $a$, $b$, $c$ del primo passo indicano gli elementi della matrice, non i parametri della retta.`,
    steps: [
      {
        latex: md`\mathbf{I} = \begin{bmatrix} a & c \\ c & b \end{bmatrix}, \qquad a > 0, \; b > 0, \; ab - c^2 > 0`,
        why: md`Matrice di Fisher per $r = 2$: simmetrica e definita positiva, quindi con elementi diagonali positivi e determinante positivo.`,
      },
      {
        latex: md`\mathbf{I}^{-1} = \frac{1}{ab - c^2} \begin{bmatrix} b & -c \\ -c & a \end{bmatrix}`,
        why: md`Formula dell'inversa di una matrice $2 \times 2$: si scambiano gli elementi diagonali, si cambia segno a quelli fuori diagonale e si divide per il determinante $ab - c^2$.`,
      },
      {
        latex: md`[\mathbf{I}^{-1}]_{11} = \frac{b}{ab - c^2} = \frac{1}{a - c^2/b} \geq \frac{1}{a} = \frac{1}{[\mathbf{I}]_{11}}`,
        why: md`Si dividono numeratore e denominatore per $b$. Poiché $c^2/b \geq 0$ il denominatore diminuisce: il bound vero è maggiore o uguale a quello che si otterrebbe ignorando l'accoppiamento (*coupling*) tra i parametri. Vale l'uguaglianza solo se $c = 0$, cioè con matrice diagonale come nella gaussiana con media e varianza incognite. Il caso con un numero qualsiasi di parametri è nella [«dimostrazione con Cauchy-Schwarz»](#derivation:der22).`,
      },
      {
        latex: md`\ln p(\mathbf{Y}|a_0, b_0) = -\frac{N}{2} \ln(2\pi\sigma^2) - \frac{1}{2\sigma^2} \sum_{k=1}^{N} (y_k - a_0 - b_0 x_k)^2, \qquad \frac{\partial \ln p}{\partial a_0} = \frac{1}{\sigma^2} \sum_{k=1}^{N} n_k, \qquad \frac{\partial \ln p}{\partial b_0} = \frac{1}{\sigma^2} \sum_{k=1}^{N} x_k n_k`,
        why: md`Passaggio intermedio: ogni $y_k$ è gaussiano con media $a_0 + b_0 x_k$ e varianza $\sigma^2$, e i campioni sono indipendenti. Si deriva il quadrato rispetto ai due parametri e, nei parametri veri, $y_k - a_0 - b_0 x_k = n_k$: le due componenti dello score sono somme pesate del rumore.`,
      },
      {
        latex: md`y_k = a_0 + b_0 x_k + n_k, \; n_k \sim \mathcal{N}(0, \sigma^2): \qquad \mathbf{I}(a_0, b_0) = \frac{1}{\sigma^2} \begin{bmatrix} N & \sum_k x_k \\ \sum_k x_k & \sum_k x_k^2 \end{bmatrix}`,
        why: md`Si applica la definizione della slide 14 alle due componenti dello score. Con $E\{n_k n_l\} = \sigma^2$ se $k = l$ e $0$ altrimenti: $[\mathbf{I}]_{11} = N\sigma^2/\sigma^4$, $[\mathbf{I}]_{12} = \sigma^2 \sum_k x_k/\sigma^4$, $[\mathbf{I}]_{22} = \sigma^2 \sum_k x_k^2/\sigma^4$. L'elemento fuori diagonale è nullo solo se $\sum_k x_k = 0$, cioè se la feature è centrata.`,
      },
      {
        latex: md`\sum_{k=1}^{N} x_k = N \bar{x}, \qquad \sum_{k=1}^{N} x_k^2 = N (s_x^2 + \bar{x}^2), \qquad \bar{x} = \frac{1}{N} \sum_{k=1}^{N} x_k`,
        why: md`Passaggio intermedio: la varianza empirica delle $x$ è la media dei quadrati meno il quadrato della media, $s_x^2 = \frac{1}{N}\sum_k x_k^2 - \bar{x}^2$; basta rigirarla.`,
      },
      {
        latex: md`\det \mathbf{I} = \frac{1}{\sigma^4} \left[ N \sum_{k} x_k^2 - \left( \sum_{k} x_k \right)^2 \right] = \frac{N^2 s_x^2}{\sigma^4}, \qquad [\mathbf{I}^{-1}]_{11} = \frac{[\mathbf{I}]_{22}}{\det \mathbf{I}}, \qquad [\mathbf{I}^{-1}]_{22} = \frac{[\mathbf{I}]_{11}}{\det \mathbf{I}}`,
        why: md`Si applica la formula dell'inversa $2 \times 2$ del secondo passo. Con le due somme del passo precedente $N\sum_k x_k^2 - (\sum_k x_k)^2 = N^2(s_x^2 + \bar{x}^2) - N^2 \bar{x}^2 = N^2 s_x^2$: il determinante dipende solo dalla dispersione delle $x$, non da dove sta l'origine. Si annulla se tutte le $x_k$ sono uguali ($s_x = 0$): la matrice non è invertibile e intercetta e pendenza non si possono distinguere.`,
      },
      {
        latex: md`[\mathbf{I}^{-1}]_{11} = \frac{\sigma^2}{N} \left( 1 + \frac{\bar{x}^2}{s_x^2} \right), \qquad [\mathbf{I}^{-1}]_{22} = \frac{\sigma^2}{N s_x^2}, \qquad s_x^2 = \frac{1}{N} \sum_{k=1}^{N} (x_k - \bar{x})^2`,
        why: md`Si sostituiscono le due somme: $[\mathbf{I}^{-1}]_{11} = \frac{N(s_x^2 + \bar{x}^2)/\sigma^2}{N^2 s_x^2/\sigma^4}$ e $[\mathbf{I}^{-1}]_{22} = \frac{N/\sigma^2}{N^2 s_x^2/\sigma^4}$. Il bound sull'intercetta cresce quando la feature non è centrata; centrando i dati ($\bar{x} = 0$) la matrice diventa diagonale e il bound torna $\sigma^2/N$. Il bound sulla pendenza non dipende dal centraggio.`,
      },
      {
        latex: md`x_k \in \{1, 2, 3\}: \quad \bar{x} = 2, \; s_x^2 = \frac{2}{3}, \qquad [\mathbf{I}^{-1}]_{11} = \frac{\sigma^2}{3} \left( 1 + \frac{4}{2/3} \right) = \frac{7\sigma^2}{3}, \qquad \frac{1}{[\mathbf{I}]_{11}} = \frac{\sigma^2}{3}`,
        why: md`Controllo numerico con tre punti: ignorare l'accoppiamento sottostimerebbe il bound sull'intercetta di un fattore 7. Con le stesse distanze ma centrate, $x_k \in \{-1, 0, 1\}$, il bound torna $\sigma^2/3$. La stima ai minimi quadrati (*least squares*), che con rumore gaussiano coincide con la ML, è unbiased e ha proprio queste varianze: raggiunge il bound ed è efficiente.`,
      },
    ],
    conclusion: md`Il bound su un parametro si legge sulla diagonale dell'inversa della matrice di Fisher, non come inverso dell'elemento diagonale: $[\mathbf{I}^{-1}]_{11} = 1/(a - c^2/b) \geq 1/a$. Nella regressione il bound sull'intercetta è $\frac{\sigma^2}{N}(1 + \bar{x}^2/s_x^2)$, che si riduce a $\sigma^2/N$ solo con la feature centrata. È il conto del widget [«diagonale dell'inversa»](#widget:m04-diagonale-dell-inversa) e dell'esempio [«prezzi delle case»](#example:ex07).`,
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },

  // --- der15 Tempi esponenziali: tasso e tempo medio -----------------------------------------------------
  {
    id: 'der15',
    title: 'Tempi esponenziali: la ML del tempo medio è efficiente, la ML del tasso è biased ma asintoticamente buona',
    goal: md`Verificare su un caso concreto le due affermazioni delle note sulla stima ML. Se lo stimatore efficiente esiste e la ML è unbiased, la ML è lo stimatore efficiente (parametro $\tau$, tempo medio); se non esiste, la ML ha comunque le tre proprietà asintotiche (parametro $\lambda = 1/\tau$, tasso). Sono i conti dietro il widget [«quando la ML è lo stimatore efficiente»](#widget:m04-ml-raggiunge-il-bound), l'esempio [«tasso di allarmi di una rete di sensori»](#example:ex06) e l'esercizio [«tasso di anomalie di un sensore»](#exercise:es14). Non presente nella fonte.`,
    assumptions: md`$N$ tempi $x_1, \ldots, x_N \geq 0$ tra eventi consecutivi, iid con densità esponenziale. Modello regolare: il supporto $[0, +\infty)$ non dipende dal parametro. I momenti di $\hat{\lambda}_{ML}$ esistono solo per $N$ abbastanza grande: la media per $N > 1$, la varianza per $N > 2$.`,
    steps: [
      {
        latex: md`p(x|\lambda) = \lambda e^{-\lambda x}, \; x \geq 0 \;\Longrightarrow\; \ln p(\mathbf{X}|\lambda) = N \ln \lambda - \lambda \sum_{k=1}^{N} x_k`,
        why: md`Modello esponenziale per i tempi tra due eventi consecutivi (allarmi, anomalie, arrivi): $\lambda$ è il numero medio di eventi per unità di tempo. Con campioni iid la log-likelihood è la somma dei logaritmi $\ln\lambda - \lambda x_k$.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{X}|\lambda)}{\partial \lambda} = \frac{N}{\lambda} - \sum_{k=1}^{N} x_k = 0 \;\Longrightarrow\; \hat{\lambda}_{ML} = \frac{N}{\sum_{k=1}^{N} x_k}`,
        why: md`Condizione di massimo: la stima ML del tasso è il reciproco della media dei tempi osservati, $1/\bar{x}$. È un massimo perché la derivata seconda, $-N/\lambda^2$, è negativa.`,
      },
      {
        latex: md`T = \sum_{k=1}^{N} x_k \sim \text{Gamma}(N, \lambda): \qquad E\{T^{-1}\} = \int_0^{+\infty} \frac{1}{t}\, \frac{\lambda^N t^{N-1} e^{-\lambda t}}{(N-1)!}\, dt = \frac{\lambda^N}{(N-1)!} \cdot \frac{(N-2)!}{\lambda^{N-1}} = \frac{\lambda}{N-1}, \qquad E\{T^{-2}\} = \frac{\lambda^N}{(N-1)!} \cdot \frac{(N-3)!}{\lambda^{N-2}} = \frac{\lambda^2}{(N-1)(N-2)}`,
        why: md`Passaggio intermedio: la somma $T$ di $N$ tempi esponenziali iid ha densità Gamma (di Erlang) $\lambda^N t^{N-1} e^{-\lambda t}/(N-1)!$, come si vede moltiplicando le $N$ funzioni generatrici dei momenti $\lambda/(\lambda - s)$. I due integrali si calcolano con $\int_0^{+\infty} t^n e^{-\lambda t}\, dt = n!/\lambda^{n+1}$, con $n = N-2$ e $n = N-3$: il primo richiede $N > 1$, il secondo $N > 2$.`,
      },
      {
        latex: md`E\{\hat{\lambda}_{ML}\} = \frac{N}{N-1}\, \lambda, \qquad \operatorname{var}\{\hat{\lambda}_{ML}\} = \frac{N^2 \lambda^2}{(N-1)^2 (N-2)} \quad (N > 2)`,
        why: md`Con $\hat{\lambda}_{ML} = N/T$: $E\{\hat{\lambda}_{ML}\} = N\,E\{1/T\}$ e $\operatorname{var}\{\hat{\lambda}_{ML}\} = N^2 (E\{1/T^2\} - (E\{1/T\})^2) = N^2 \lambda^2 \left[ \frac{1}{(N-1)(N-2)} - \frac{1}{(N-1)^2} \right]$; la parentesi quadra vale $\frac{(N-1) - (N-2)}{(N-1)^2 (N-2)} = \frac{1}{(N-1)^2 (N-2)}$. La stima è biased per ogni $N$ finito: sovrastima il tasso di un fattore $N/(N-1)$.`,
      },
      {
        latex: md`I(\lambda) = \frac{N}{\lambda^2} \;\Longrightarrow\; I^{-1}(\lambda) = \frac{\lambda^2}{N}`,
        why: md`Lo score di un campione, $1/\lambda - x$, ha media nulla e varianza $\operatorname{var}\{x\} = 1/\lambda^2$; per l'additività ([«l'informazione cresce come N»](#derivation:der06)) l'informazione di $N$ campioni è $N/\lambda^2$. Stesso risultato con la curvatura: $-\partial^2 \ln p / \partial \lambda^2 = N/\lambda^2$.`,
      },
      {
        latex: md`\lim_{N \to +\infty} E\{\hat{\lambda}_{ML}\} = \lambda, \qquad \lim_{N \to +\infty} \frac{\operatorname{var}\{\hat{\lambda}_{ML}\}}{\lambda^2/N} = \lim_{N \to +\infty} \frac{N^3}{(N-1)^2 (N-2)} = 1, \qquad \lim_{N \to +\infty} \operatorname{var}\{\hat{\lambda}_{ML}\} = 0`,
        why: md`Il bias tende a zero (asintoticamente unbiased), il rapporto con il bound tende a 1 (asintoticamente efficiente), la varianza tende a zero e quindi la stima è consistente per [«bias e varianza che svaniscono danno la consistenza»](#derivation:der07): sono le tre proprietà che le note attribuiscono alla ML. Con $N = 100$ il rapporto vale $10^6/(99^2 \cdot 98) \approx 1.041$.`,
      },
      {
        latex: md`p(x|\tau) = \frac{1}{\tau} e^{-x/\tau}: \qquad \frac{\partial \ln p(\mathbf{X}|\tau)}{\partial \tau} = \frac{N}{\tau^2} \left( \bar{x} - \tau \right) = 0 \;\Longrightarrow\; \hat{\tau}_{ML} = \bar{x} = \frac{1}{N} \sum_{k=1}^{N} x_k`,
        why: md`Stesso modello parametrizzato con il tempo medio $\tau = 1/\lambda$: $\ln p(\mathbf{X}|\tau) = -N\ln\tau - \frac{1}{\tau}\sum_k x_k$, e la derivata $-\frac{N}{\tau} + \frac{N\bar{x}}{\tau^2}$ ha la forma $a(\tau)(\hat{\tau} - \tau)$ richiesta dalla condizione di uguaglianza nel bound ([«schizzo della dimostrazione del bound»](#derivation:der09)), con $a(\tau) = N/\tau^2$. Annullarla dà la media campionaria.`,
      },
      {
        latex: md`E\{\hat{\tau}_{ML}\} = \tau, \qquad \operatorname{var}\{\hat{\tau}_{ML}\} = \frac{\tau^2}{N} = I^{-1}(\tau), \qquad I(\tau) = \frac{N}{\tau^2}`,
        why: md`La media campionaria è unbiased e la sua varianza è $\operatorname{var}\{x\}/N = \tau^2/N$, perché un'esponenziale di media $\tau$ ha varianza $\tau^2$: coincide con il bound. Il coefficiente $a(\tau)$ del passo precedente è proprio $I(\tau)$. Lo stimatore efficiente esiste, la ML è unbiased, ed è proprio la ML, come dicono le note.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{X}|\lambda)}{\partial \lambda} = -N \left( \bar{x} - \frac{1}{\lambda} \right) \neq a(\lambda)\, (\hat{\lambda}(\mathbf{X}) - \lambda), \qquad \operatorname{var}\left\{ \frac{N-1}{\sum_k x_k} \right\} = \frac{\lambda^2}{N-2} > \frac{\lambda^2}{N}`,
        why: md`Per il tasso $\lambda$ lo score non ha la forma $a(\lambda)(\hat{\lambda}(\mathbf{X}) - \lambda)$ con $\hat{\lambda}$ funzione dei soli dati. Servirebbe $\hat{\lambda}(\mathbf{X}) = \lambda + \frac{N}{a(\lambda)}\left(\frac{1}{\lambda} - \bar{x}\right)$: perché non dipenda da $\lambda$, il coefficiente di $\bar{x}$ deve essere una costante $\beta$, ma allora resta il termine $\lambda + \beta/\lambda$, che dipende da $\lambda$. Uno stimatore efficiente non esiste. Anche correggendo il bias con il fattore $(N-1)/N$, lo stimatore unbiased $(N-1)/\sum_k x_k$ ha varianza $(N-1)^2 \operatorname{var}\{1/T\} = \lambda^2/(N-2)$, che resta sopra il bound per ogni $N$ finito.`,
      },
      {
        latex: md`\hat{\lambda}_{ML} = \frac{1}{\hat{\tau}_{ML}}`,
        why: md`Le due stime ML contengono la stessa informazione: il reciproco della stima del tempo medio è la stima del tasso, perché la ML non dipende da come si parametrizza il modello. Eppure una è efficiente e l'altra no: l'efficienza a $N$ finito dipende dalla parametrizzazione, le proprietà asintotiche della ML no.`,
      },
    ],
    conclusion: md`Con i tempi esponenziali si vedono entrambe le frasi delle note. Per il tempo medio lo score ha la forma $a(\tau)(\bar{x} - \tau)$: la ML $\bar{x}$ è unbiased e ha varianza $\tau^2/N$, pari al bound, quindi è lo stimatore efficiente. Per il tasso nessuno stimatore è efficiente: la ML $N/\sum_k x_k$ è biased e sta sopra il bound con pochi dati, ma è asintoticamente unbiased, asintoticamente efficiente e consistente.`,
    source: [
      { doc: 'part1', page: 20 }, { doc: 'part1', page: 21 },
      { doc: 'ch2', page: 14 }, { doc: 'ch2', page: 15 }, { doc: 'ch2', page: 19 },
    ],
  },

  // --- der16 Legami tra le proprietà ---------------------------------------------------------------------
  {
    id: 'der16',
    title: 'Legami tra le proprietà: tre implicazioni vere e quattro controesempi',
    goal: md`Ordinare le proprietà delle slide 13-16: quali implicano quali, e un controesempio per ogni implicazione falsa. L'ultimo controesempio mostra perché, a rigore, le due condizioni della slide 16 sono sufficienti e non necessarie. Non presente nella fonte.`,
    assumptions: md`Salvo dove detto, campioni $x_1, \ldots, x_N$ iid gaussiani di media $m$ incognita e varianza $\sigma^2$ nota; si stima $m$ e l'errore è $\varepsilon = \hat{m} - m$. Per il terzo passo: modello regolare con campioni iid e informazione di un campione $\mathbf{I}_1(\boldsymbol{\theta})$ finita e invertibile. $\Phi$ è la funzione di distribuzione della gaussiana standard.`,
    steps: [
      {
        latex: md`E\{\boldsymbol{\varepsilon}\} = \mathbf{0} \;\; \forall N \;\Longrightarrow\; \lim_{N \to +\infty} E\{\boldsymbol{\varepsilon}\} = \mathbf{0}`,
        why: md`Se il bias è nullo per ogni $N$, lo è anche al limite: unbiased implica asintoticamente unbiased (*asymptotically unbiased*). Il viceversa è falso: la stima ML della covarianza ha media $\frac{N-1}{N}\Sigma$, biased per ogni $N$ ma con bias che svanisce ([«la stima ML della varianza»](#derivation:der11)).`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon_i\} = [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii} \;\; \forall N \;\Longrightarrow\; \lim_{N \to +\infty} \frac{\operatorname{var}\{\varepsilon_i\}}{[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1`,
        why: md`Se la varianza coincide con il bound per ogni $N$, il rapporto vale sempre 1: efficiente implica asintoticamente efficiente (*asymptotically efficient*). Anche qui il viceversa è falso: per la ML del tasso esponenziale il rapporto è $N^3/((N-1)^2(N-2))$, maggiore di 1 per ogni $N$ ma con limite 1 ([«tempi esponenziali»](#derivation:der15)).`,
      },
      {
        latex: md`\lim_{N \to +\infty} \frac{\operatorname{var}\{\varepsilon_i\}}{[\mathbf{I}_N^{-1}(\boldsymbol{\theta})]_{ii}} = 1, \quad [\mathbf{I}_N^{-1}(\boldsymbol{\theta})]_{ii} = \frac{1}{N} [\mathbf{I}_1^{-1}(\boldsymbol{\theta})]_{ii} \to 0 \;\Longrightarrow\; \operatorname{var}\{\varepsilon_i\} \to 0; \qquad \text{con } \lim_{N \to +\infty} E\{\boldsymbol{\varepsilon}\} = \mathbf{0}: \;\; \lim_{N \to +\infty} P\{\|\boldsymbol{\varepsilon}\| < \delta\} = 1`,
        why: md`Con campioni iid l'informazione cresce come $N$ (ultimo passo di [«l'informazione cresce come N»](#derivation:der06)), quindi il bound tende a zero. Se il rapporto con il bound tende a 1, anche la varianza tende a zero; se in più il bias tende a zero, lo stimatore è consistente. Entrambe le premesse compaiono nella formula perché, senza una delle due, l'implicazione non vale (terzo controesempio).`,
      },
      {
        latex: md`P\{|\varepsilon_i| \geq \delta\} \leq \frac{\operatorname{var}\{\varepsilon_i\} + (E\{\varepsilon_i\})^2}{\delta^2} \;\longrightarrow\; 0 \qquad \forall \delta > 0`,
        why: md`Passaggio intermedio, dalla catena di [«bias e varianza che svaniscono danno la consistenza»](#derivation:der07): la disuguaglianza di Markov sul quadrato dell'errore e la scomposizione errore quadratico medio = varianza + bias² danno un limite superiore che tende a zero. Nel caso vettoriale basta sommare sulle componenti.`,
      },
      {
        latex: md`\hat{m} = x_1: \qquad E\{\hat{m}\} = m, \quad \operatorname{var}\{\hat{m}\} = \sigma^2, \quad P\{|\varepsilon| < \delta\} = 2\Phi(\delta/\sigma) - 1 < 1 \;\; \forall N`,
        why: md`Controesempio 1: il primo campione è unbiased ma ignora gli altri dati; la sua varianza non cala e la probabilità di stare entro $\delta$ resta ferma sotto 1. Con $\sigma = 1$ e $\delta = 0.5$ vale $2\Phi(0.5) - 1 \approx 0.38$ per ogni $N$, mentre per la media campionaria con $N = 100$ vale $2\Phi(5) - 1 \approx 1$. Unbiased non implica consistente (*consistent*).`,
      },
      {
        latex: md`\hat{m} = \operatorname{mediana}\{x_k\}: \qquad \operatorname{var}\{\hat{m}\} \approx \frac{\pi \sigma^2}{2N} \to 0, \qquad \frac{\operatorname{var}\{\hat{m}\}}{\sigma^2/N} \to \frac{\pi}{2} \neq 1`,
        why: md`Controesempio 2: la mediana campionaria è unbiased (per la simmetria della gaussiana) e consistente, ma il rapporto tra la sua varianza e il bound, che vale 1 con $N \leq 2$ e circa 1.54 con $N = 25$, tende a $\pi/2 \approx 1.57$, non a 1. Non cresce in modo monotono: con $N$ pari la mediana è la media dei due valori centrali e il rapporto è più basso (circa 1.19 con $N = 4$ contro 1.35 con $N = 3$ e 1.43 con $N = 5$). Al limite, per la stessa precisione della media servono circa il 57% di campioni in più. Consistente non implica asintoticamente efficiente. La varianza viene dalla formula asintotica della mediana, $1/(4N\,p(m)^2)$ con $p(m) = 1/(\sqrt{2\pi}\,\sigma)$.`,
      },
      {
        latex: md`\hat{m} = \bar{x} + c: \qquad \operatorname{var}\{\hat{m}\} = \frac{\sigma^2}{N} \to 0, \quad E\{\varepsilon\} = c \;\Longrightarrow\; \lim_{N \to +\infty} P\{|\varepsilon| < \delta\} = 0 \;\; \text{per } \delta < |c|`,
        why: md`Controesempio 3: uno strumento con offset costante $c$. La varianza tende a zero, e il suo rapporto con il bound vale 1 per ogni $N$, ma il bias no: la stima converge a $m + c$. Senza la premessa sul bias il terzo passo cade: servono entrambe le condizioni della slide 16. Lo stimatore non è nemmeno efficiente, perché l'efficienza si definisce tra gli stimatori unbiased.`,
      },
      {
        latex: md`\hat{m}_N = \begin{cases} \bar{x} & \text{con probabilità } 1 - 1/N \\ N^2 & \text{con probabilità } 1/N \end{cases} \qquad P\{|\varepsilon| \geq \delta\} \leq P\{|\bar{x} - m| \geq \delta\} + \frac{1}{N} \to 0, \qquad E\{\hat{m}_N\} = \left( 1 - \frac{1}{N} \right) m + N \to +\infty`,
        why: md`Controesempio 4, costruito apposta con un'estrazione casuale indipendente dai dati (è uno stimatore randomizzato, *randomized estimator*; la conclusione di [«bias e varianza che svaniscono danno la consistenza»](#derivation:der07) mostra come ottenere lo stesso effetto con una vera funzione dei dati): lo stimatore è consistente, perché l'evento anomalo ha probabilità $1/N$ che svanisce (la probabilità di un'unione è al più la somma delle probabilità), ma il suo valore atteso diverge, e con esso bias e varianza. Quindi bias → 0 e varianza → 0 sono condizioni sufficienti per la consistenza, non strettamente necessarie. La slide 16 e le note le chiamano «necessary condition»: all'esame si riporta la formulazione del docente, sapendo che a rigore è una condizione sufficiente.`,
      },
      {
        latex: md`\text{unbiased} \nRightarrow \text{consistent}, \qquad \text{consistent} \nRightarrow \text{asymptotically efficient}, \qquad \operatorname{var}\{\varepsilon\} \to 0 \nRightarrow \text{consistent}, \qquad \text{consistent} \nRightarrow \lim_{N \to +\infty} E\{\varepsilon\} = 0`,
        why: md`Riepilogo dei quattro controesempi, nell'ordine. Insieme ai primi tre passi danno la mappa completa delle cinque proprietà del widget [«la pagella dello stimatore»](#widget:m04-pagella-dello-stimatore).`,
      },
    ],
    conclusion: md`Implicazioni vere: unbiased ⇒ asintoticamente unbiased; efficiente ⇒ asintoticamente efficiente; asintoticamente unbiased con varianza che tende a zero ⇒ consistente (con campioni iid l'efficienza asintotica garantisce la varianza che tende a zero). Implicazioni false, ognuna con il suo controesempio: unbiased ⇏ consistente (primo campione), consistente ⇏ asintoticamente efficiente (mediana), varianza → 0 ⇏ consistente (offset), consistente ⇏ asintoticamente unbiased (stimatore con evento raro).`,
    source: [
      { doc: 'ch2', page: 13 }, { doc: 'ch2', page: 15 }, { doc: 'ch2', page: 16 },
      { doc: 'part1', page: 18 }, { doc: 'part1', page: 19 },
    ],
  },

  // --- der17 La log-likelihood della figura è una parabola -----------------------------------------------
  {
    id: 'der17',
    title: 'La log-likelihood della figura è una parabola e il picco della likelihood è largo σ/√N',
    goal: md`Spiegare i numeri dei tre pannelli della figura «Likelihood Function: Example» (gaussiana con $\sigma$ nota, $\theta$ = media) e collegare la forma della log-likelihood all'informazione di Fisher: la curvatura del pannello basso è $N/\sigma^2$ e la larghezza del picco del pannello centrale è la radice del bound di Cramér-Rao. Non presente nella fonte.`,
    assumptions: md`$N$ campioni scalari iid da una gaussiana di varianza $\sigma^2$ nota e media $\theta$ incognita, come nella figura delle note (part1 p17). I valori numerici degli ultimi due passi sono letti a occhio dalla figura: $N = 12$ punti, $\sigma = 1$, picco in $\hat{\theta} \approx 3.1$, massimo della log-likelihood circa $-16$.`,
    steps: [
      {
        latex: md`l(\theta) = \ln p(\mathbf{X}|\theta) = \sum_{k=1}^{N} \ln p(x_k|\theta) = -\frac{N}{2} \ln(2\pi\sigma^2) - \frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - \theta)^2`,
        why: md`Campioni iid gaussiani con varianza nota: il logaritmo trasforma il prodotto della likelihood in una somma ([«il logaritmo trasforma i prodotti in somme»](#formula:f-c44)); ogni addendo è $-\frac{1}{2}\ln(2\pi\sigma^2) - \frac{(x_k - \theta)^2}{2\sigma^2}$.`,
      },
      {
        latex: md`\sum_{k=1}^{N} (x_k - \theta)^2 = \sum_{k=1}^{N} (x_k - \bar{x})^2 + N(\bar{x} - \theta)^2, \qquad \bar{x} = \frac{1}{N} \sum_{k=1}^{N} x_k`,
        why: md`Si aggiunge e si toglie la media campionaria dentro ogni scarto: $(x_k - \theta)^2 = (x_k - \bar{x})^2 + 2(x_k - \bar{x})(\bar{x} - \theta) + (\bar{x} - \theta)^2$. Sommando su $k$ il termine misto si annulla, perché $\sum_k (x_k - \bar{x}) = 0$.`,
      },
      {
        latex: md`l(\theta) = l(\hat{\theta}) - \frac{N(\theta - \hat{\theta})^2}{2\sigma^2}, \qquad \hat{\theta} = \bar{x}`,
        why: md`Sostituendo, $l(\theta) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_k (x_k - \bar{x})^2 - \frac{N(\bar{x} - \theta)^2}{2\sigma^2}$: i primi due addendi non dipendono da $\theta$ e valgono $l(\hat{\theta})$. La log-likelihood è una parabola rivolta verso il basso con il vertice nella media campionaria, che è quindi la stima ML. È la curva del pannello basso.`,
      },
      {
        latex: md`p(\mathbf{X}|\theta) = p(\mathbf{X}|\hat{\theta})\, \exp\left( -\frac{(\theta - \hat{\theta})^2}{2\sigma^2/N} \right)`,
        why: md`Esponenziale del passo precedente: vista come funzione di $\theta$, la likelihood è una campana di forma gaussiana centrata in $\hat{\theta}$ con deviazione standard $\sigma/\sqrt{N}$. È il picco stretto del pannello centrale. Non è una densità in $\theta$: la sua area in generale non vale 1.`,
      },
      {
        latex: md`-\frac{\partial^2 l(\theta)}{\partial \theta^2} = \frac{N}{\sigma^2} = I(\theta) \;\Longrightarrow\; \frac{\sigma}{\sqrt{N}} = \sqrt{I^{-1}(\theta)}`,
        why: md`La curvatura della log-likelihood è l'informazione di Fisher nella forma con la derivata seconda ([«le due forme dell'informazione di Fisher»](#derivation:der13)); qui non dipende nemmeno dai dati. La larghezza del picco della likelihood è la radice del bound di Cramér-Rao. Più campioni: parabola più appuntita, picco più stretto, bound più basso.`,
      },
      {
        latex: md`N = 12, \; \sigma = 1, \; \hat{\theta} = 3.1, \; l(\hat{\theta}) \approx -16: \qquad l(0) \approx -16 - 6 \cdot 3.1^2 \approx -74, \qquad l(7) \approx -16 - 6 \cdot 3.9^2 \approx -107, \qquad \frac{\sigma}{\sqrt{N}} \approx 0.29`,
        why: md`Controllo numerico con i valori letti dalla figura: $N/(2\sigma^2) = 6$, quindi la parabola dà circa $-74$ in $\theta = 0$ e scende sotto $-100$ prima di $\theta = 7$ (attraversa $-100$ vicino a $\theta \approx 6.8$), come nel grafico. Il picco centrale, largo circa $\pm 3 \cdot 0.29$ attorno a 3.1, va da 2.2 a 4 circa.`,
      },
      {
        latex: md`l(\hat{\theta}) \approx -15.6 \;\Longrightarrow\; p(\mathbf{X}|\hat{\theta}) = e^{l(\hat{\theta})} \approx e^{-15.6} \approx 1.7 \cdot 10^{-7}`,
        why: md`Controllo sull'altezza del picco centrale. Letto con più cura, il massimo del pannello basso vale circa $-15.6$ e il suo esponenziale è circa $1.7 \cdot 10^{-7}$: il picco del pannello centrale supera infatti l'ultima tacca, $1.2 \cdot 10^{-7}$. Il valore arrotondato $-16$ dei passi precedenti basta per la forma della parabola, ma non per l'altezza del picco: $e^{-16} \approx 1.1 \cdot 10^{-7}$ starebbe sotto quella tacca, perché l'esponenziale amplifica uno scarto di 0.4 in un fattore $e^{0.4} \approx 1.5$. Una likelihood così piccola è normale: è il prodotto di 12 densità, ciascuna minore di 1. Anche per questo si lavora con il logaritmo.`,
      },
    ],
    conclusion: md`Per una gaussiana con $\sigma$ nota $l(\theta) = l(\hat{\theta}) - \frac{N(\theta - \hat{\theta})^2}{2\sigma^2}$: una parabola con il vertice nella media campionaria e curvatura $N/\sigma^2 = I(\theta)$. La likelihood è una campana larga $\sigma/\sqrt{N}$, la radice del bound di Cramér-Rao. I tre pannelli della figura raccontano la stessa cosa da tre lati: dove stanno i campioni, quanto è stretta la likelihood, quanto è appuntita la log-likelihood. Si esplora nel widget [«i tre pannelli della likelihood»](#widget:m04-tre-pannelli-likelihood).`,
    source: [{ doc: 'part1', page: 17 }, { doc: 'ch2', page: 14 }],
  },

  // --- der18 Ridge a un parametro sotto il bound ---------------------------------------------------------
  {
    id: 'der18',
    title: 'Uno stimatore biased sotto il bound: ridge a un parametro',
    goal: md`Mostrare con i passaggi perché uno stimatore biased può avere varianza inferiore al bound di Cramér-Rao senza contraddizione, perché conviene usarlo con pochi dati e perché il vantaggio svanisce per $N \to +\infty$. Sono i conti del widget [«sotto il pavimento si può»](#widget:m04-sotto-il-pavimento) e dell'esempio [«sovrapprezzo per stanza»](#example:ex08). Non presente nella fonte.`,
    assumptions: md`Regressione per l'origine (*regression through the origin*) con un solo parametro $\theta$. Le $x_k$ sono fissate e non tutte nulle ($S > 0$), il rumore $n_k$ è gaussiano iid di media nulla e varianza $\sigma^2$ nota. Lo stimatore ridge usa un coefficiente di regolarizzazione $\lambda > 0$ fissato, che non dipende dai dati.`,
    steps: [
      {
        latex: md`y_k = \theta x_k + n_k, \quad n_k \sim \mathcal{N}(0, \sigma^2) \text{ iid}, \qquad S = \sum_{k=1}^{N} x_k^2`,
        why: md`Regressione per l'origine con rumore gaussiano di varianza nota; le $x_k$ sono fissate (non aleatorie), l'aleatorietà sta nel rumore. $S$ misura quanta «leva» hanno i dati sul parametro e cresce con $N$.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{Y}|\theta)}{\partial \theta} = \frac{1}{\sigma^2} \sum_{k=1}^{N} x_k (y_k - \theta x_k) \;\Longrightarrow\; I(\theta) = \frac{S}{\sigma^2}, \qquad \operatorname{var}\{\varepsilon\} \geq \frac{\sigma^2}{S}`,
        why: md`Score della log-likelihood: nel parametro vero vale $\frac{1}{\sigma^2}\sum_k x_k n_k$ e il valore atteso del suo quadrato è $\frac{1}{\sigma^4}\sum_k x_k^2 \sigma^2 = S/\sigma^2$ (stesso calcolo di [«bound per la media di una gaussiana»](#derivation:der05), con i pesi $x_k$). Il bound $\sigma^2/S$ vale per gli stimatori unbiased.`,
      },
      {
        latex: md`\hat{\theta}_0 = \frac{\sum_k x_k (\theta x_k + n_k)}{S} = \theta + \frac{\sum_k x_k n_k}{S}`,
        why: md`Passaggio intermedio: si sostituisce il modello nella stima ai minimi quadrati. L'errore di stima è una somma pesata del rumore, con media nulla e varianza $\sum_k x_k^2 \sigma^2 / S^2 = \sigma^2/S$.`,
      },
      {
        latex: md`\hat{\theta}_0 = \frac{\sum_k x_k y_k}{S}: \qquad E\{\hat{\theta}_0\} = \theta, \qquad \operatorname{var}\{\hat{\theta}_0\} = \frac{\sigma^2}{S}`,
        why: md`La stima ai minimi quadrati, che qui coincide con la ML (annulla lo score), è unbiased e ha varianza uguale al bound: è lo stimatore efficiente.`,
      },
      {
        latex: md`\hat{\theta}_{\lambda} = \frac{\sum_k x_k y_k}{S + \lambda} = \frac{S}{S + \lambda}\, \hat{\theta}_0`,
        why: md`La ridge aggiunge $\lambda$ al denominatore: è la stima ai minimi quadrati moltiplicata per un fattore minore di 1 (*shrinkage* verso zero).`,
      },
      {
        latex: md`E\{\varepsilon\} = E\{\hat{\theta}_{\lambda}\} - \theta = -\frac{\lambda\, \theta}{S + \lambda}, \qquad \operatorname{var}\{\varepsilon\} = \frac{\sigma^2 S}{(S + \lambda)^2} < \frac{\sigma^2}{S} \quad (\lambda > 0)`,
        why: md`Il fattore $S/(S + \lambda)$ introduce un bias proporzionale a $\theta$ (la stima viene tirata verso zero) e moltiplica la varianza per il quadrato dello stesso fattore: $\frac{S^2}{(S+\lambda)^2}\cdot\frac{\sigma^2}{S}$. Per ogni $\lambda > 0$ la varianza sta sotto il bound. Nessuna contraddizione: il bound vale solo per stimatori unbiased, e questo non lo è.`,
      },
      {
        latex: md`E\{\varepsilon^2\} = \frac{\lambda^2 \theta^2 + \sigma^2 S}{(S + \lambda)^2}, \qquad \frac{d}{d\lambda} E\{\varepsilon^2\} = \frac{2S(\lambda \theta^2 - \sigma^2)}{(S + \lambda)^3} = 0 \;\Longrightarrow\; \lambda^{*} = \frac{\sigma^2}{\theta^2}`,
        why: md`Errore quadratico medio = varianza + bias² ([«errore quadratico medio = varianza + bias²»](#derivation:der03)). Derivando il quoziente, il numeratore è $2\lambda\theta^2(S + \lambda)^2 - 2(S + \lambda)(\lambda^2\theta^2 + \sigma^2 S) = 2(S + \lambda)\, S\, (\lambda\theta^2 - \sigma^2)$. Il minimo è in $\lambda^* = \sigma^2/\theta^2$, che non dipende né da $S$ né da $N$: la derivata è negativa prima e positiva dopo.`,
      },
      {
        latex: md`E\{\varepsilon^2\}\big|_{\lambda^{*}} = \frac{\sigma^2}{S + \lambda^{*}} < \frac{\sigma^2}{S}, \qquad \frac{S}{S + \lambda^{*}} \to 1 \;\text{ per } S \propto N \to +\infty`,
        why: md`Sostituendo $\lambda^*\theta^2 = \sigma^2$ il numeratore diventa $\lambda^*\sigma^2 + \sigma^2 S = \sigma^2(S + \lambda^*)$: l'errore quadratico medio ottimo è minore del bound. Al crescere di $N$, $S$ cresce e il guadagno $S/(S + \lambda^*)$ tende a 1: con tanti dati il vantaggio del bias svanisce, in accordo con il fatto che uno stimatore si giudica dalle sue proprietà asintotiche. In pratica $\lambda^*$ dipende dal $\theta$ ignoto e si sceglie sui dati, per esempio con la *cross-validation*.`,
      },
      {
        latex: md`\sigma^2 = 1, \; \theta = 1, \; S = 4: \qquad \lambda^{*} = 1, \quad E\{\varepsilon\} = -0.2, \quad \operatorname{var}\{\varepsilon\} = 0.16, \quad E\{\varepsilon^2\} = 0.16 + 0.04 = 0.2 < \frac{\sigma^2}{S} = 0.25`,
        why: md`Controllo numerico: la ridge ottima sbaglia in media di $-0.2$ ma ha varianza $4/25$; il suo errore quadratico medio è il 20% più basso di quello della stima efficiente unbiased.`,
      },
      {
        latex: md`E\{\hat{\theta}\} = \theta + b(\theta) \;\Longrightarrow\; \operatorname{var}\{\varepsilon\} \geq \frac{(1 + \partial b/\partial \theta)^2}{I(\theta)}; \qquad b = -\frac{\lambda \theta}{S + \lambda}: \quad \frac{(S/(S + \lambda))^2}{S/\sigma^2} = \frac{\sigma^2 S}{(S + \lambda)^2}`,
        why: md`Versione del bound per stimatori biased: si ottiene come nello [«schizzo della dimostrazione del bound»](#derivation:der09) partendo da $E\{\hat{\theta}\} = \theta + b(\theta)$, e derivando compare $1 + \partial b/\partial\theta$ al posto di 1, sotto le stesse condizioni di regolarità. Per la ridge $1 + \partial b/\partial\theta = S/(S + \lambda)$ e il limite coincide con la sua varianza: la ridge raggiunge il bound della sua classe di bias. Ecco perché scendere sotto $\sigma^2/S$ non è una contraddizione.`,
      },
    ],
    conclusion: md`La ridge $\hat{\theta}_\lambda = \frac{S}{S + \lambda}\hat{\theta}_0$ ha varianza $\frac{\sigma^2 S}{(S + \lambda)^2}$, sotto il bound $\sigma^2/S$ degli stimatori unbiased, al prezzo di un bias $-\frac{\lambda\theta}{S + \lambda}$. Con $\lambda^* = \sigma^2/\theta^2$ anche l'errore quadratico medio scende sotto il bound, ma il guadagno svanisce per $N \to +\infty$. È uno dei motivi per cui nei problemi reali si usano spesso stimatori biased (slide 15).`,
    source: [{ doc: 'ch2', page: 14 }, { doc: 'ch2', page: 15 }, { doc: 'part1', page: 19 }],
  },

  // --- der19 Perché la likelihood è un prodotto ----------------------------------------------------------
  {
    id: 'der19',
    title: 'Perché la likelihood è un prodotto: dalla densità congiunta ai fattori, e dove servono «independent» e «identically distributed»',
    goal: md`Esplicitare i passaggi che le note riassumono in una frase («Since the samples are independent, the overall probability can be expressed as the product of the individual probabilities»): è la risposta alla domanda d'esame «why we can use the separate products of the probabilities». Si mostra in quale passo serve l'indipendenza e in quale l'identica distribuzione, e che cosa succede se l'indipendenza cade.`,
    assumptions: md`Nessuna ipotesi per i primi due passi. Poi, una alla volta, le due ipotesi iid delle note (part1 p17): campioni indipendenti (*independent*) dato $\boldsymbol{\theta}$, e identicamente distribuiti (*identically distributed*) secondo lo stesso modello $p(\mathbf{x}|\boldsymbol{\theta})$.`,
    steps: [
      {
        latex: md`p(\mathbf{X}|\boldsymbol{\theta}) = p(\mathbf{x}_1, \mathbf{x}_2, \ldots, \mathbf{x}_N|\boldsymbol{\theta})`,
        why: md`La likelihood è, per definizione, la densità congiunta di tutti i campioni del training set, vista come funzione di $\boldsymbol{\theta}$ a dati fissati.`,
      },
      {
        latex: md`p(\mathbf{x}_1, \ldots, \mathbf{x}_N|\boldsymbol{\theta}) = p(\mathbf{x}_1|\boldsymbol{\theta})\, p(\mathbf{x}_2|\mathbf{x}_1, \boldsymbol{\theta}) \cdots p(\mathbf{x}_N|\mathbf{x}_1, \ldots, \mathbf{x}_{N-1}, \boldsymbol{\theta})`,
        why: md`Regola del prodotto (*chain rule*) delle densità condizionate, applicata un campione alla volta: vale sempre, senza alcuna ipotesi sui campioni.`,
      },
      {
        latex: md`p(\mathbf{x}_k|\mathbf{x}_1, \ldots, \mathbf{x}_{k-1}, \boldsymbol{\theta}) = p_k(\mathbf{x}_k|\boldsymbol{\theta})`,
        why: md`Ipotesi «independent»: noto $\boldsymbol{\theta}$, conoscere i campioni precedenti non dice nulla sul $k$-esimo, quindi il condizionamento sugli altri campioni cade. È qui, e solo qui, che serve l'indipendenza. Per due campioni è la definizione stessa: $p(\mathbf{x}_1, \mathbf{x}_2|\boldsymbol{\theta}) = p(\mathbf{x}_1|\boldsymbol{\theta})\,p(\mathbf{x}_2|\boldsymbol{\theta})$ equivale a $p(\mathbf{x}_2|\mathbf{x}_1, \boldsymbol{\theta}) = p(\mathbf{x}_2|\boldsymbol{\theta})$. È un'indipendenza condizionata a $\boldsymbol{\theta}$: nella stima bayesiana, dove $\boldsymbol{\theta}$ è aleatorio, i campioni non sono indipendenti tra loro se non si fissa $\boldsymbol{\theta}$.`,
      },
      {
        latex: md`p(\mathbf{x}_1, \ldots, \mathbf{x}_N|\boldsymbol{\theta}) = \prod_{k=1}^{N} p_k(\mathbf{x}_k|\boldsymbol{\theta})`,
        why: md`Passaggio intermedio: con la sola indipendenza la catena del secondo passo diventa un prodotto di densità marginali, una per campione, che potrebbero ancora essere diverse tra loro (per esempio misure prese con sensori diversi).`,
      },
      {
        latex: md`p_k(\mathbf{x}|\boldsymbol{\theta}) = p(\mathbf{x}|\boldsymbol{\theta}) \qquad \forall k = 1, 2, \ldots, N`,
        why: md`Ipotesi «identically distributed»: tutti i campioni sono generati dallo stesso modello con lo stesso $\boldsymbol{\theta}$, quindi i fattori sono la stessa funzione $p$ valutata in punti diversi. Senza questa ipotesi si avrebbe ancora un prodotto, ma di densità $p_k$ diverse tra loro.`,
      },
      {
        latex: md`p(\mathbf{X}|\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k|\boldsymbol{\theta})`,
        why: md`È la formula delle note (part1 p17): la likelihood di campioni iid è la produttoria della densità del modello valutata nei singoli campioni, come funzione di $\boldsymbol{\theta}$ a dati fissati.`,
      },
      {
        latex: md`\ln p(\mathbf{X}|\boldsymbol{\theta}) = \sum_{k=1}^{N} \ln p(\mathbf{x}_k|\boldsymbol{\theta}), \qquad \mathbf{I}_N(\boldsymbol{\theta}) = N\, \mathbf{I}_1(\boldsymbol{\theta})`,
        why: md`Due conseguenze usate in tutto il modulo, che cadono insieme all'ipotesi iid: la log-likelihood è una somma ([«il logaritmo trasforma i prodotti in somme»](#formula:f-c44)) e l'informazione di Fisher cresce in proporzione a $N$ ([«l'informazione cresce come N»](#derivation:der06)).`,
      },
      {
        latex: md`\mathbf{x}_2 \equiv \mathbf{x}_1 \;(\text{misura duplicata}): \qquad p(\mathbf{x}_1|\boldsymbol{\theta})\, p(\mathbf{x}_2|\boldsymbol{\theta}) = p(\mathbf{x}_1|\boldsymbol{\theta})^2 \neq p(\mathbf{x}_1, \mathbf{x}_2|\boldsymbol{\theta})`,
        why: md`Controesempio: se il secondo campione è una copia del primo non porta informazione nuova, ma il prodotto lo conta due volte. La densità congiunta vera è concentrata su $\mathbf{x}_2 = \mathbf{x}_1$ (dato il primo, il secondo è certo), mentre il prodotto tratta la copia come una seconda misura indipendente.`,
      },
      {
        latex: md`\text{ogni campione duplicato}: \quad \prod_{k=1}^{N} p(x_k|\theta)^2 = e^{2\, l(\theta)}, \qquad -\frac{\partial^2\, 2\, l(\theta)}{\partial \theta^2} = \frac{2N}{\sigma^2} \;\Longrightarrow\; \frac{\sigma}{\sqrt{2N}} \;\text{invece di}\; \frac{\sigma}{\sqrt{N}}`,
        why: md`Conto con la gaussiana di varianza nota ([«la log-likelihood della figura è una parabola»](#derivation:der17)): se ogni campione compare due volte la log-likelihood raddoppia, la curvatura pure, e il picco della likelihood si stringe di un fattore $\sqrt{2}$, come se i campioni fossero $2N$. La stima ML non cambia (il vertice resta $\bar{x}$), ma l'incertezza viene sottovalutata. Si prova nel widget [«la likelihood come prodotto»](#widget:m04-likelihood-come-prodotto), con l'interruttore delle misure duplicate.`,
      },
    ],
    conclusion: md`La likelihood è la densità congiunta del training set. La regola del prodotto la scrive sempre come catena di condizionate; l'indipendenza toglie i condizionamenti, l'identica distribuzione rende uguali i fattori: $p(\mathbf{X}|\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k|\boldsymbol{\theta})$. Se l'indipendenza cade, per esempio con misure duplicate, il prodotto conta due volte la stessa informazione e la stima sembra più precisa di quanto sia.`,
    source: [{ doc: 'part1', page: 17 }],
  },

  // --- der20 Uniforme su [0, θ]: le ipotesi di regolarità cadono ------------------------------------------
  {
    id: 'der20',
    title: 'Quando le ipotesi di regolarità cadono: uniforme su [0, θ], stimatore unbiased sotto il bound formale',
    goal: md`Mostrare con un caso concreto che la disuguaglianza della slide 14 richiede, oltre all'assenza di bias, le condizioni di regolarità che la fonte sottintende, e individuare il passo esatto della dimostrazione che cade. In più: un esempio di stima ML che non si ottiene annullando la derivata, biased ma asintoticamente unbiased e consistente. Non presente nella fonte; i numeri sono nell'esempio [«fondo scala di un sensore»](#example:ex09).`,
    assumptions: md`Campioni $x_1, \ldots, x_N$ iid uniformi su $[0, \theta]$ con $\theta > 0$ incognito. È un modello non regolare: il supporto dipende dal parametro. Si applica comunque, in modo meccanico, la formula della slide 14, per vedere che cosa succede.`,
    steps: [
      {
        latex: md`p(x|\theta) = \frac{1}{\theta} \;\; (0 \leq x \leq \theta) \;\Longrightarrow\; p(\mathbf{X}|\theta) = \prod_{k=1}^{N} p(x_k|\theta) = \begin{cases} \theta^{-N} & \theta \geq M \\ 0 & \theta < M \end{cases} \qquad M = \max_{k} x_k`,
        why: md`Campioni iid uniformi su $[0, \theta]$: la likelihood è il prodotto delle densità ([«perché la likelihood è un prodotto»](#derivation:der19)). Ogni fattore vale $1/\theta$ se $x_k \leq \theta$ e 0 altrimenti, quindi il prodotto è diverso da zero solo se tutti i campioni stanno nel supporto, cioè se $\theta$ è almeno pari al campione più grande $M$. Il supporto dipende da $\theta$: è l'ipotesi di regolarità che cade.`,
      },
      {
        latex: md`\hat{\theta}_{ML} = \arg\max_{\theta \geq M} \theta^{-N} = M`,
        why: md`Per $\theta \geq M$ la likelihood è strettamente decrescente, quindi il massimo sta sul bordo $\theta = M$. La derivata $-N\theta^{-N-1}$ non si annulla mai: qui la stima ML non si trova con la condizione di gradiente nullo ([«log-likelihood e likelihood hanno lo stesso massimo»](#derivation:der10)).`,
      },
      {
        latex: md`P\{M \leq t\} = \prod_{k=1}^{N} P\{x_k \leq t\} = \left( \frac{t}{\theta} \right)^N \;\Longrightarrow\; p_M(t) = \frac{N t^{N-1}}{\theta^N}, \qquad 0 \leq t \leq \theta`,
        why: md`Il massimo è sotto $t$ solo se lo sono tutti i campioni; per l'indipendenza le probabilità si moltiplicano, e ognuna vale $t/\theta$. Derivando la funzione di distribuzione rispetto a $t$ si ottiene la densità di $M$.`,
      },
      {
        latex: md`E\{M\} = \int_0^{\theta} t\, \frac{N t^{N-1}}{\theta^N}\, dt = \frac{N}{N+1}\, \theta, \qquad E\{M^2\} = \frac{N}{N+2}\, \theta^2, \qquad \operatorname{var}\{M\} = \frac{N \theta^2}{(N+1)^2 (N+2)}`,
        why: md`Integrali di potenze: $\int_0^\theta t^N\, dt = \theta^{N+1}/(N+1)$ e $\int_0^\theta t^{N+1}\, dt = \theta^{N+2}/(N+2)$. La varianza segue da $E\{M^2\} - (E\{M\})^2 = N\theta^2\, \frac{(N+1)^2 - N(N+2)}{(N+1)^2 (N+2)}$, e il numeratore della frazione vale 1. La stima ML è biased per ogni $N$ finito (sottostima sempre, perché il massimo non può superare $\theta$), con bias $-\theta/(N+1)$ che tende a zero: è asintoticamente unbiased.`,
      },
      {
        latex: md`P\{|M - \theta| < \delta\} = P\{M > \theta - \delta\} = 1 - \left( 1 - \frac{\delta}{\theta} \right)^N \;\longrightarrow\; 1 \qquad \forall\, 0 < \delta < \theta`,
        why: md`Verifica diretta della definizione di consistenza della slide 16, senza passare da Chebyshev: poiché $M \leq \theta$ sempre, stare entro $\delta$ significa $M > \theta - \delta$, e la probabilità del contrario è $((\theta - \delta)/\theta)^N$, che tende a zero. La stima ML è consistente. Per $\delta \geq \theta$ la probabilità vale già 1.`,
      },
      {
        latex: md`\tilde{\theta} = \frac{N+1}{N}\, M: \qquad E\{\tilde{\theta}\} = \theta, \qquad \operatorname{var}\{\tilde{\theta}\} = \frac{(N+1)^2}{N^2} \cdot \frac{N \theta^2}{(N+1)^2 (N+2)} = \frac{\theta^2}{N(N+2)}`,
        why: md`Si corregge il bias con il fattore $(N + 1)/N$: lo stimatore è unbiased per ogni $N$ e per ogni $\theta$, cioè rispetta la sola ipotesi che la slide 14 nomina. La varianza si moltiplica per il quadrato del fattore.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} = \frac{\partial}{\partial \theta} (-N \ln \theta) = -\frac{N}{\theta} \;\Longrightarrow\; E\left\{ \left( \frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} \right)^2 \right\} = \frac{N^2}{\theta^2}, \qquad \text{bound formale} = \frac{\theta^2}{N^2}`,
        why: md`Applicazione meccanica della formula della slide 14, con $r = 1$ e $i = j$, nella zona $\theta \geq M$ dove la likelihood è positiva. Lo score non dipende dai dati e vale sempre $-N/\theta$: la sua media non è zero, a differenza di quanto accade nei modelli regolari ([«l'informazione cresce come N»](#derivation:der06), [«le due forme dell'informazione di Fisher»](#derivation:der13)).`,
      },
      {
        latex: md`\operatorname{var}\{\tilde{\theta}\} = \frac{\theta^2}{N(N+2)} < \frac{\theta^2}{N^2} \qquad \forall N \geq 1`,
        why: md`Lo stimatore unbiased sta sotto il bound formale per ogni $N$, perché $N(N+2) > N^2$: qui la disuguaglianza di Cramér-Rao non vale. In più la varianza scende come $1/N^2$, mentre con campioni iid ogni bound regolare scende solo come $1/N$. Con $N = 10$: $\theta^2/120 \approx 0.0083\,\theta^2$ contro $\theta^2/100$.`,
      },
      {
        latex: md`\frac{\partial}{\partial \theta} \int_0^{\theta} p(x|\theta)\, dx = p(\theta|\theta) + \int_0^{\theta} \frac{\partial p(x|\theta)}{\partial \theta}\, dx = \frac{1}{\theta} - \frac{1}{\theta} = 0 \;\Longrightarrow\; \int_0^{\theta} \frac{\partial p(x|\theta)}{\partial \theta}\, dx = -\frac{1}{\theta} \neq 0`,
        why: md`Il punto esatto in cui la dimostrazione cade: l'estremo di integrazione dipende da $\theta$, quindi derivando compare un termine di bordo (regola di Leibniz, *Leibniz integral rule*), e non è vero che l'integrale di $\partial p/\partial\theta$ è zero. Saltano il passo di [«l'informazione cresce come N»](#derivation:der06) in cui lo score ha media nulla (il quarto), il secondo passo dello [«schizzo della dimostrazione del bound»](#derivation:der09) e tutte [«le due forme dell'informazione di Fisher»](#derivation:der13). Sono le condizioni di regolarità (*regularity conditions*) che la fonte sottintende: supporto indipendente da $\theta$ e scambio lecito tra derivata e integrale.`,
      },
      {
        latex: md`E\{(M - \theta)^2\} = \frac{N \theta^2}{(N+1)^2 (N+2)} + \frac{\theta^2}{(N+1)^2} = \frac{2\theta^2}{(N+1)(N+2)} > \frac{\theta^2}{N(N+2)} = \operatorname{var}\{\tilde{\theta}\} \quad (N \geq 2)`,
        why: md`Confronto finale tra i due stimatori con l'errore quadratico medio, varianza + bias²: la somma vale $\theta^2\frac{N + N + 2}{(N+1)^2(N+2)}$. Qui correggere il bias conviene: lo stimatore corretto sbaglia meno della ML per ogni $N \geq 2$ (per $N = 1$ i due valori coincidono), circa la metà per $N$ grande.`,
      },
    ],
    conclusion: md`Per l'uniforme su $[0, \theta]$ la stima ML è il massimo campionario: biased, con $E\{\max_k x_k\} = \frac{N}{N+1}\theta$, asintoticamente unbiased e consistente, trovata sul bordo e non annullando la derivata. Lo stimatore corretto $\frac{N+1}{N}\max_k x_k$ è unbiased con varianza $\frac{\theta^2}{N(N+2)}$, sotto il bound formale $\theta^2/N^2$. Il bound di Cramér-Rao richiede, oltre all'assenza di bias, le condizioni di regolarità: supporto che non dipende da $\theta$ e scambio tra derivata e integrale.`,
    source: [{ doc: 'ch2', page: 14 }, { doc: 'ch2', page: 16 }, { doc: 'part1', page: 19 }],
  },

  // --- der21 Perché la ML ha le tre proprietà asintotiche -------------------------------------------------
  {
    id: 'der21',
    title: 'Perché la ML ha le tre proprietà asintotiche: schizzo con lo sviluppo di Taylor dello score',
    goal: md`Dare l'idea del perché la stima ML possiede le tre proprietà asintotiche che le note elencano senza dimostrazione (part1 p20-21, slide ch2 p19). È uno schizzo nel caso scalare, non una dimostrazione rigorosa. Non presente nella fonte.`,
    assumptions: md`Caso scalare. Campioni iid, modello $p(x|\theta)$ corretto (i dati vengono davvero da quel modello), condizioni di regolarità, $\theta$ vero interno allo spazio dei parametri, informazione di un campione $I_1(\theta)$ finita e positiva. $s_k(\theta) = \partial \ln p(x_k|\theta)/\partial\theta$ è lo score del campione $k$ e l'apice indica la derivata rispetto a $\theta$.`,
    steps: [
      {
        latex: md`s_N(\theta) = \frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} = \sum_{k=1}^{N} s_k(\theta), \qquad s_N(\hat{\theta}_{ML}) = 0`,
        why: md`Lo score totale è la somma degli score dei singoli campioni ([«l'informazione cresce come N»](#derivation:der06)) e la stima ML lo annulla ([«log-likelihood e likelihood hanno lo stesso massimo»](#derivation:der10)), purché il massimo sia un punto stazionario interno.`,
      },
      {
        latex: md`0 = s_N(\hat{\theta}_{ML}) \approx s_N(\theta) + (\hat{\theta}_{ML} - \theta)\, s_N'(\theta)`,
        why: md`Sviluppo di Taylor al primo ordine dello score attorno al $\theta$ vero. È il passo non rigoroso dello schizzo: l'approssimazione è buona solo se $\hat{\theta}_{ML}$ è già vicina a $\theta$, cosa che nelle dimostrazioni complete si prova a parte.`,
      },
      {
        latex: md`\hat{\theta}_{ML} - \theta \approx \frac{\frac{1}{N} \sum_{k=1}^{N} s_k(\theta)}{-\frac{1}{N} \sum_{k=1}^{N} s_k'(\theta)}`,
        why: md`Si risolve rispetto all'errore di stima, $\hat{\theta}_{ML} - \theta \approx -s_N(\theta)/s_N'(\theta)$, e si dividono numeratore e denominatore per $N$, per far comparire due medie campionarie di termini iid.`,
      },
      {
        latex: md`-\frac{1}{N} \sum_{k=1}^{N} s_k'(\theta) \;\longrightarrow\; -E\{s_k'(\theta)\} = I_1(\theta)`,
        why: md`Legge dei grandi numeri (*law of large numbers*): la media di $N$ termini iid tende al loro valore atteso, che è l'informazione di Fisher di un campione nella forma con la curvatura ([«le due forme dell'informazione di Fisher»](#derivation:der13)).`,
      },
      {
        latex: md`E\left\{ \frac{1}{N} \sum_{k=1}^{N} s_k(\theta) \right\} = 0, \qquad \operatorname{var}\left\{ \frac{1}{N} \sum_{k=1}^{N} s_k(\theta) \right\} = \frac{I_1(\theta)}{N}`,
        why: md`Ogni score ha media nulla e varianza $I_1(\theta)$ ([«l'informazione cresce come N»](#derivation:der06)); per l'indipendenza la varianza della media è la varianza del singolo termine divisa per $N$.`,
      },
      {
        latex: md`E\{\hat{\theta}_{ML} - \theta\} \approx 0, \qquad \operatorname{var}\{\hat{\theta}_{ML}\} \approx \frac{I_1(\theta)/N}{I_1(\theta)^2} = \frac{1}{N\, I_1(\theta)} = I_N^{-1}(\theta)`,
        why: md`Per $N$ grande il denominatore è quasi la costante $I_1(\theta)$: l'errore è circa il numeratore diviso per $I_1(\theta)$, quindi eredita media nulla (asintoticamente unbiased) e una varianza pari a quella del numeratore divisa per $I_1(\theta)^2$, che coincide con il bound di Cramér-Rao di $N$ campioni.`,
      },
      {
        latex: md`\lim_{N \to +\infty} \frac{\operatorname{var}\{\varepsilon\}}{I_N^{-1}(\theta)} = 1, \qquad \lim_{N \to +\infty} \operatorname{var}\{\varepsilon\} = 0 \;\Longrightarrow\; \lim_{N \to +\infty} P\{|\varepsilon| < \delta\} = 1`,
        why: md`Sono le tre proprietà delle note (part1 p21): il rapporto con il bound tende a 1 (asintoticamente efficiente) e, poiché bias e varianza tendono a zero, la stima è consistente per [«bias e varianza che svaniscono danno la consistenza»](#derivation:der07).`,
      },
      {
        latex: md`\sqrt{N}\, (\hat{\theta}_{ML} - \theta) \;\xrightarrow{\;d\;}\; \mathcal{N}\!\left( 0, \frac{1}{I_1(\theta)} \right)`,
        why: md`Il teorema del limite centrale (*central limit theorem*) dice di più: il numeratore moltiplicato per $\sqrt{N}$ tende in distribuzione a una gaussiana di media nulla e varianza $I_1(\theta)$; dividendo per il denominatore, che tende alla costante $I_1(\theta)$, l'errore riscalato tende a una gaussiana di varianza $1/I_1(\theta)$. Per $N$ grande la stima ML è circa gaussiana, centrata nel vero, con varianza pari al bound.`,
      },
      {
        latex: md`\text{esponenziale: } I_1(\lambda) = \frac{1}{\lambda^2} \;\Longrightarrow\; \operatorname{var}\{\hat{\lambda}_{ML}\} \approx \frac{\lambda^2}{N}; \qquad \text{valore esatto: } \frac{N^2 \lambda^2}{(N-1)^2 (N-2)} = \frac{\lambda^2}{N} \cdot \frac{N^3}{(N-1)^2 (N-2)}`,
        why: md`Controllo con un caso in cui la varianza esatta è nota ([«tempi esponenziali»](#derivation:der15)): il fattore di correzione tende a 1, come previsto dallo schizzo; con $N = 100$ vale 1.041 ([«tasso di allarmi di una rete di sensori»](#example:ex06)). Il bias esatto $\lambda/(N-1)$ è di ordine $1/N$: è ciò che lo schizzo al primo ordine trascura.`,
      },
    ],
    conclusion: md`Vicino al vero, l'errore della stima ML è circa la media degli score divisa per l'informazione di un campione. La legge dei grandi numeri e il limite centrale danno bias che svanisce e varianza circa $1/(N I_1(\theta))$, quindi rapporto con il bound che tende a 1 e consistenza: le tre proprietà asintotiche delle note. Le ipotesi contano: con un supporto che dipende da $\theta$ ([«quando le ipotesi di regolarità cadono»](#derivation:der20)) il primo passo non vale e la varianza della ML scende addirittura come $1/N^2$.`,
    source: [
      { doc: 'part1', page: 20 }, { doc: 'part1', page: 21 },
      { doc: 'ch2', page: 15 }, { doc: 'ch2', page: 16 }, { doc: 'ch2', page: 19 },
    ],
  },

  // --- der22 [I⁻¹]_ii ≥ 1/[I]_ii con Cauchy-Schwarz -------------------------------------------------------
  {
    id: 'der22',
    title: '[I⁻¹]_ii ≥ 1/[I]_ii per qualunque numero di parametri: dimostrazione con Cauchy-Schwarz',
    goal: md`Estendere a qualunque numero $r$ di parametri la disuguaglianza $[\mathbf{I}^{-1}]_{ii} \geq 1/[\mathbf{I}]_{ii}$, che [«perché il bound usa l'elemento diagonale dell'inversa»](#derivation:der14) dimostra solo nel caso $2 \times 2$. Interpretazione: $1/[\mathbf{I}]_{ii}$ è il bound che si avrebbe se tutti gli altri parametri fossero noti; doverli stimare insieme può solo alzarlo. Non presente nella fonte.`,
    assumptions: md`Matrice di Fisher $r \times r$ simmetrica ([«dalla forma compatta alla definizione elemento per elemento»](#derivation:der04)) e definita positiva ($\mathbf{I} \succ 0$), quindi invertibile. $\mathbf{e}_i$ è l'$i$-esimo vettore della base canonica: 1 nella posizione $i$, 0 altrove.`,
    steps: [
      {
        latex: md`\mathbf{I} = \mathbf{I}^{t} \succ 0 \;\Longrightarrow\; \exists\, \mathbf{I}^{1/2} \succ 0: \quad \mathbf{I} = \mathbf{I}^{1/2}\, \mathbf{I}^{1/2}, \qquad \mathbf{I}^{-1} = \mathbf{I}^{-1/2}\, \mathbf{I}^{-1/2}`,
        why: md`Ipotesi: matrice di Fisher simmetrica e definita positiva. Una matrice così ha una radice quadrata simmetrica e definita positiva, e la radice dell'inversa $\mathbf{I}^{-1/2}$ è l'inversa della radice.`,
      },
      {
        latex: md`\mathbf{I} = \mathbf{U} \boldsymbol{\Lambda} \mathbf{U}^{t}, \qquad \mathbf{I}^{1/2} = \mathbf{U} \boldsymbol{\Lambda}^{1/2} \mathbf{U}^{t}, \qquad \mathbf{I}^{-1/2} = \mathbf{U} \boldsymbol{\Lambda}^{-1/2} \mathbf{U}^{t}`,
        why: md`Passaggio intermedio: costruzione della radice con la decomposizione spettrale. $\mathbf{U}$ è ortogonale (colonne = autovettori, $\mathbf{U}^t\mathbf{U}$ è la matrice identità) e $\boldsymbol{\Lambda}$ è diagonale con gli autovalori, tutti positivi: si prende la radice di ciascuno. Le due matrici ottenute sono simmetriche, $\mathbf{I}^{1/2}\mathbf{I}^{1/2} = \mathbf{U}\boldsymbol{\Lambda}\mathbf{U}^t$ e $\mathbf{I}^{1/2}\mathbf{I}^{-1/2}$ è l'identità.`,
      },
      {
        latex: md`1 = \mathbf{e}_i^{t}\, \mathbf{e}_i = \mathbf{e}_i^{t}\, \mathbf{I}^{1/2}\, \mathbf{I}^{-1/2}\, \mathbf{e}_i = (\mathbf{I}^{1/2} \mathbf{e}_i)^{t}\, (\mathbf{I}^{-1/2} \mathbf{e}_i)`,
        why: md`Si inserisce l'identità scritta come prodotto delle due radici e si usa la simmetria di $\mathbf{I}^{1/2}$: $\mathbf{e}_i^t \mathbf{I}^{1/2} = (\mathbf{I}^{1/2}\mathbf{e}_i)^t$.`,
      },
      {
        latex: md`1 = \left[ (\mathbf{I}^{1/2} \mathbf{e}_i)^{t}\, (\mathbf{I}^{-1/2} \mathbf{e}_i) \right]^2 \leq \|\mathbf{I}^{1/2} \mathbf{e}_i\|^2\, \|\mathbf{I}^{-1/2} \mathbf{e}_i\|^2 = (\mathbf{e}_i^{t}\, \mathbf{I}\, \mathbf{e}_i)\, (\mathbf{e}_i^{t}\, \mathbf{I}^{-1}\, \mathbf{e}_i) = [\mathbf{I}]_{ii}\, [\mathbf{I}^{-1}]_{ii}`,
        why: md`Disuguaglianza di Cauchy-Schwarz tra due vettori, $(\mathbf{u}^t\mathbf{v})^2 \leq \|\mathbf{u}\|^2 \|\mathbf{v}\|^2$. Le norme al quadrato sono forme quadratiche, per esempio $\|\mathbf{I}^{1/2}\mathbf{e}_i\|^2 = \mathbf{e}_i^t \mathbf{I}^{1/2}\mathbf{I}^{1/2}\mathbf{e}_i$, e la forma $\mathbf{e}_i^t \mathbf{A}\, \mathbf{e}_i$ estrae l'elemento diagonale $(i, i)$ della matrice $\mathbf{A}$.`,
      },
      {
        latex: md`[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii} \geq \frac{1}{[\mathbf{I}(\boldsymbol{\theta})]_{ii}}, \qquad \text{uguaglianza} \iff \mathbf{I}\, \mathbf{e}_i = [\mathbf{I}]_{ii}\, \mathbf{e}_i \iff [\mathbf{I}]_{ij} = 0 \;\; \forall j \neq i`,
        why: md`Si divide per $[\mathbf{I}]_{ii} > 0$. In Cauchy-Schwarz vale l'uguaglianza solo se i due vettori sono paralleli: $\mathbf{I}^{1/2}\mathbf{e}_i = \alpha\, \mathbf{I}^{-1/2}\mathbf{e}_i$, cioè, moltiplicando per $\mathbf{I}^{1/2}$, $\mathbf{I}\mathbf{e}_i = \alpha\,\mathbf{e}_i$: $\mathbf{e}_i$ è un autovettore di $\mathbf{I}$, con $\alpha = [\mathbf{I}]_{ii}$. Poiché $\mathbf{I}\mathbf{e}_i$ è la colonna $i$ della matrice, la colonna (e per simmetria la riga) $i$ ha zeri fuori diagonale: il parametro $i$ è disaccoppiato dagli altri. Con $r = 2$ si ritrova la condizione $c = 0$ del caso $2 \times 2$.`,
      },
      {
        latex: md`\mathbf{I} = \begin{bmatrix} a & \mathbf{c}^{t} \\ \mathbf{c} & \mathbf{B} \end{bmatrix} \;\Longrightarrow\; [\mathbf{I}^{-1}]_{11} = \frac{1}{a - \mathbf{c}^{t} \mathbf{B}^{-1} \mathbf{c}} \geq \frac{1}{a}`,
        why: md`Seconda lettura, con i parametri riordinati in modo che $\theta_i$ sia il primo: $a = [\mathbf{I}]_{ii}$, il vettore $\mathbf{c}$ raccoglie gli accoppiamenti con gli altri parametri e $\mathbf{B}$ è la matrice di Fisher degli altri parametri, anch'essa definita positiva. La formula dell'inversa a blocchi (complemento di Schur, *Schur complement*) dà il primo elemento dell'inversa; poiché $\mathbf{c}^t\mathbf{B}^{-1}\mathbf{c} \geq 0$, l'informazione efficace su $\theta_i$ è $a$ meno una quota «rubata» dagli altri parametri. Con $r = 2$ è esattamente $1/(a - c^2/b)$.`,
      },
      {
        latex: md`\text{solo } \theta_i \text{ incognito } (r = 1): \qquad \operatorname{var}\{\varepsilon_i\} \geq \frac{1}{[\mathbf{I}(\boldsymbol{\theta})]_{ii}}`,
        why: md`Se gli altri parametri fossero noti il problema avrebbe un solo parametro, con informazione di Fisher uguale all'elemento diagonale $[\mathbf{I}]_{ii}$ (definizione della slide 14 con $i = j$). Il confronto con i passi precedenti dice che non conoscere gli altri parametri non può mai abbassare il bound su $\theta_i$. Nel widget [«diagonale dell'inversa»](#widget:m04-diagonale-dell-inversa) è l'«ombra» dell'ellisse di incertezza sull'asse $\theta_i$, legata a $[\mathbf{I}^{-1}]_{ii}$, contro la sua «fetta» a parametri fissati, legata a $1/[\mathbf{I}]_{ii}$.`,
      },
    ],
    conclusion: md`Per ogni $r$ e ogni $i$: $[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii} \geq 1/[\mathbf{I}(\boldsymbol{\theta})]_{ii}$, con uguaglianza solo se $\theta_i$ è disaccoppiato dagli altri parametri. Per questo la disuguaglianza della slide 14 usa l'elemento diagonale dell'inversa: invertire il solo elemento diagonale darebbe un bound troppo ottimista ogni volta che i parametri sono accoppiati.`,
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }],
  },
]
