// Formule del foglio m06 (modelli di pdf e modello gaussiano), seconda metà: concetti c37-c71 dell'inventario.
// Convenzione condivisa con formulas-a.ts: una voce per ogni stringa LaTeX di concepts[].latex, id "f-<concetto>"
// per la prima, "f-<concetto>-2", "f-<concetto>-3"... per le successive. Il campo latex è copiato dall'inventario
// (verificato sulle immagini delle pagine ch2 p27-31 e part1 p23-26) e non è ritoccato: scripts/formula-coverage.ts
// lo ritrova per confronto. importance = examRelevance del concetto; le voci di importanza 3 hanno almeno un blank.
// Le formule che la fonte non scrive (integrazioni didattiche dell'inventario) lo dicono nel testo.
// Concetti senza LaTeX nell'inventario, quindi senza voce: c54 (esempio 3-D, solo figura) e c65 (stima bayesiana).
// Esempi numerici ricorrenti: Σ = [[3,1],[1,3]] (autovalori 4 e 2), tre salmoni (2,1), (4,3), (6,2).
import { md } from '../../types'
import type { Formula } from '../../types'

export const formulasB: Formula[] = [
  // --- c37 Contenuto di Σ: varianze sulla diagonale, covarianze fuori --------------------------------
  {
    id: 'f-c37',
    name: 'Diagonale di Σ: la varianza di ogni feature',
    nameEn: 'Diagonal of Σ: variance of each feature',
    latex: md`[\Sigma]_{ii}=\sigma_i^{2}=E\{(x_i-m_i)^{2}\}`,
    explain: md`L'elemento $(i,i)$ della matrice di covarianza (*covariance matrix*) è la varianza (*variance*) della $i$-esima feature: il valore atteso dello scarto quadratico di $x_i$ dalla sua media $m_i$. Misura quanto quella sola feature si allarga attorno al suo centro. Con il pesce del Cap. 1: se $x_1$ è la luminosità del salmone e $\sigma_1^2 = 4$, la luminosità oscilla attorno alla media con deviazione standard (*standard deviation*) $\sigma_1 = 2$. Le note dicono che $\Sigma$ contiene sia la varianza di ogni feature sia la covarianza tra feature diverse («both the variance of each feature and the covariance between different features»): la diagonale è la prima metà della frase.`,
    symbols: [
      { s: md`[\Sigma]_{ii}`, meaning: md`elemento sulla riga $i$ e sulla colonna $i$ di $\Sigma$` },
      { s: md`\sigma_i^{2}`, meaning: md`varianza della $i$-esima feature` },
      { s: md`x_i`, meaning: md`componente $i$ del vettore delle feature $\mathbf{x}$` },
      { s: md`m_i`, meaning: md`componente $i$ del vettore media $\mathbf{m}$, cioè $E\{x_i\}$` },
      { s: md`E\{\cdot\}`, meaning: md`valore atteso (*expected value*)` },
    ],
    whenToUse: md`Quando all'orale ti chiedono che cosa c'è dentro $\Sigma$ (domanda tipica di Melgani sulla PCA: «what is cov matrix»): sulla diagonale le varianze, fuori diagonale le covarianze.`,
    pitfalls: md`Sulla diagonale ci sono le varianze $\sigma_i^2$, non le deviazioni standard $\sigma_i$. Sono sempre $\ge 0$: una diagonale con un elemento negativo non è quella di una matrice di covarianza.`,
    importance: 3,
    blanks: [{
      masked: md`[\Sigma]_{ii}=\boxed{\;?\;}=E\{(x_i-m_i)^{2}\}`,
      answer: md`\sigma_i^{2}`,
      distractors: [md`\sigma_i`, md`\sigma_{ij}`, md`m_i^{2}`],
    }],
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }],
  },
  {
    id: 'f-c37-2',
    name: 'Fuori diagonale: la covarianza tra due feature',
    nameEn: 'Off-diagonal of Σ: covariance between features',
    latex: md`[\Sigma]_{ij}=\sigma_{ij}=E\{(x_i-m_i)(x_j-m_j)\}`,
    explain: md`L'elemento $(i,j)$ con $i \ne j$ è la covarianza (*covariance*) tra la feature $i$ e la feature $j$: il valore atteso del prodotto dei due scarti dalle rispettive medie. Il segno dice come si muovono insieme. Positiva: quando $x_i$ supera la sua media, di solito anche $x_j$ supera la sua (salmoni più luminosi tendono a essere più larghi). Negativa: una cresce quando l'altra cala. Nulla: le due feature sono incorrelate (*uncorrelated*). Per $i = j$ la stessa formula ridà la varianza della diagonale.`,
    symbols: [
      { s: md`\sigma_{ij}`, meaning: md`covarianza tra le feature $i$ e $j$ (stesso valore di $\sigma_{ji}$)` },
      { s: md`(x_i-m_i)(x_j-m_j)`, meaning: md`prodotto dei due scarti: positivo se hanno lo stesso segno, negativo se hanno segni opposti` },
    ],
    whenToUse: md`Per leggere la forma della campana: la covarianza fuori diagonale è ciò che inclina le ellissi degli isolivelli rispetto agli assi $x_1$, $x_2$. Normalizzata diventa il [coefficiente di correlazione](#formula:f-c69-2).`,
    pitfalls: md`Il valore di $\sigma_{ij}$ dipende dalle unità di misura: una covarianza «grande» non vuol dire correlazione forte. Per confrontare coppie diverse usa $\rho = \sigma_{ij}/(\sigma_i\sigma_j)$. Covarianza nulla non vuol dire indipendenza, salvo nel modello gaussiano.`,
    importance: 3,
    blanks: [{
      masked: md`[\Sigma]_{ij}=\sigma_{ij}=E\{(x_i-m_i)\boxed{\;?\;}\}`,
      answer: md`(x_j-m_j)`,
      distractors: [md`(x_i-m_i)`, md`(x_j-m_i)`, md`x_j`],
    }],
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }],
  },

  // --- c38 Simmetria ---------------------------------------------------------------------------------
  {
    id: 'f-c38',
    name: 'Σ è simmetrica',
    nameEn: 'Covariance matrix is symmetric',
    latex: md`\Sigma=\Sigma^{t}`,
    explain: md`Prima delle proprietà della matrice di covarianza (*properties of the covariance matrix*): è simmetrica (*symmetric*). Il motivo è elementare: $\sigma_{ij} = E\{(x_i-m_i)(x_j-m_j)\}$ e $\sigma_{ji}$ contengono lo stesso prodotto di due scalari, che commuta. Tre conseguenze che userai subito dopo: gli elementi liberi sono $n(n+1)/2$ e non $n^2$ (con $n = 2$ sono tre: $\sigma_1^2$, $\sigma_2^2$, $\sigma_{12}$; con $n = 3$ sono sei); gli autovalori sono reali; gli autovettori si possono scegliere ortogonali. I passaggi sono nelle dimostrazioni [«Σ è simmetrica e semidefinita positiva»](#derivation:der05) e [«autovalori reali e autovettori ortogonali di Σ»](#derivation:der16).`,
    symbols: [
      { s: md`\Sigma^{t}`, meaning: md`trasposta di $\Sigma$ (la slide indica la trasposizione con l'apice $t$)` },
    ],
    whenToUse: md`Quando elenchi le proprietà di $\Sigma$ (slide 27, «Properties of the covariance matrix») e quando giustifichi il numero di parametri della gaussiana, $n + n(n+1)/2$.`,
    pitfalls: md`Simmetrica non vuol dire diagonale: la diagonale arriva solo con feature incorrelate. E $\Sigma = \Sigma^t$ non riguarda l'inversa: in generale $\Sigma^{-1} \ne \Sigma$ (anche $\Sigma^{-1}$ però è simmetrica).`,
    importance: 3,
    blanks: [{
      masked: md`\Sigma=\boxed{\;?\;}`,
      answer: md`\Sigma^{t}`,
      distractors: [md`\Sigma^{-1}`, md`-\Sigma^{t}`, md`\Sigma^{2}`],
    }],
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }],
  },

  // --- c39 Semidefinita positiva ---------------------------------------------------------------------
  {
    id: 'f-c39',
    name: 'Σ è semidefinita positiva: la varianza di ogni proiezione',
    nameEn: 'Covariance matrix is positive semidefinite',
    latex: md`\mathbf{a}^{t}\Sigma\,\mathbf{a}=var\{\mathbf{a}^{t}\mathbf{x}\}\ge 0\quad\forall\,\mathbf{a}\in\Re^{n}`,
    explain: md`Seconda proprietà: $\Sigma$ è semidefinita positiva (*positive semidefinite*). Il significato è concreto. Scegli una direzione $\mathbf{a}$ e proietta ogni campione su di essa: ottieni lo scalare $y = \mathbf{a}^t\mathbf{x}$. La sua varianza è proprio la forma quadratica $\mathbf{a}^t\Sigma\,\mathbf{a}$, e una varianza non può essere negativa. Le note lo dicono così: tutti gli autovalori sono non negativi, e questo assicura che la varianza sia sempre non negativa. Esempio: con $\Sigma = \begin{bmatrix}3&1\\1&3\end{bmatrix}$ e $\mathbf{a} = (1,-1)/\sqrt{2}$ trovi $\mathbf{a}^t\Sigma\,\mathbf{a} = \tfrac{1}{2}(3-1-1+3) = 2$; con $\mathbf{a} = (1,0)$ ritrovi $\sigma_1^2 = 3$.`,
    symbols: [
      { s: md`\mathbf{a}`, meaning: md`vettore qualsiasi di $\Re^n$: la direzione su cui proietti i dati` },
      { s: md`\mathbf{a}^{t}\mathbf{x}`, meaning: md`proiezione (uno scalare) del vettore delle feature sulla direzione $\mathbf{a}$` },
      { s: md`var\{\cdot\}`, meaning: md`varianza` },
      { s: md`\Re^{n}`, meaning: md`spazio delle feature a $n$ dimensioni (la slide scrive $\Re$ per i numeri reali)` },
    ],
    whenToUse: md`Quando ti chiedono perché gli autovalori di $\Sigma$ non sono negativi, o che cosa rappresenta $\mathbf{a}^t\Sigma\,\mathbf{a}$: è il punto di partenza della PCA. Dimostrazione: [«Σ è simmetrica e semidefinita positiva»](#derivation:der05).`,
    pitfalls: md`Semidefinita ($\ge 0$) non basta alla gaussiana: se una direzione ha varianza zero, $|\Sigma| = 0$, $\Sigma^{-1}$ non esiste e la pdf non è definita. La formula multivariata richiede $\Sigma$ definita positiva (*positive definite*): $\mathbf{a}^t\Sigma\,\mathbf{a} > 0$ per ogni $\mathbf{a} \ne \mathbf{0}$.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mathbf{a}^{t}\Sigma\,\mathbf{a}=var\{\mathbf{a}^{t}\mathbf{x}\}\boxed{\;?\;}\quad\forall\,\mathbf{a}\in\Re^{n}`,
        answer: md`\ge 0`,
        distractors: [md`> 0`, md`\le 0`, md`= 1`],
      },
      {
        masked: md`\mathbf{a}^{t}\Sigma\,\mathbf{a}=\boxed{\;?\;}\ge 0\quad\forall\,\mathbf{a}\in\Re^{n}`,
        answer: md`var\{\mathbf{a}^{t}\mathbf{x}\}`,
        distractors: [md`E\{\mathbf{a}^{t}\mathbf{x}\}`, md`\|\mathbf{a}\|^{2}`, md`var\{\mathbf{x}\}`],
      },
    ],
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }],
  },
  {
    id: 'f-c39-2',
    name: 'Semidefinita positiva se e solo se gli autovalori non sono negativi',
    nameEn: 'Positive semidefinite if and only if all eigenvalues are non-negative',
    latex: md`\mathbf{a}=\sum_{i=1}^{n}c_i\mathbf{e}_i\ \Rightarrow\ \mathbf{a}^{t}\Sigma\,\mathbf{a}=\sum_{i=1}^{n}\lambda_i c_i^{2}\ge0\ \ \forall\mathbf{a}\iff\lambda_i\ge0\ \ \forall i`,
    explain: md`Collega le due letture della semidefinitezza: quella della slide (forma quadratica mai negativa) e quella delle note (autovalori non negativi). Il passaggio non è scritto nella fonte. Scrivi $\mathbf{a}$ nella base ortonormale degli autovettori $\mathbf{e}_i$ di $\Sigma$, con componenti $c_i$. Poiché $\Sigma\mathbf{e}_i = \lambda_i\mathbf{e}_i$ ed $\mathbf{e}_i^t\mathbf{e}_j = 0$ per $i \ne j$, i termini misti spariscono e resta una somma di quadrati pesati dagli autovalori. Se ogni $\lambda_i \ge 0$ la somma non è mai negativa; viceversa, scegliendo $\mathbf{a} = \mathbf{e}_i$ ottieni $\mathbf{a}^t\Sigma\,\mathbf{a} = \lambda_i$, che deve essere $\ge 0$. Esempio: $\Sigma = \begin{bmatrix}3&1\\1&3\end{bmatrix}$ ha autovalori $4$ e $2$; per $\mathbf{a} = (1,0)$ le componenti sono $c_1 = c_2 = 1/\sqrt{2}$ e la somma vale $4\cdot\tfrac{1}{2} + 2\cdot\tfrac{1}{2} = 3 = \sigma_1^2$.`,
    symbols: [
      { s: md`c_i`, meaning: md`componente di $\mathbf{a}$ lungo l'autovettore unitario $\mathbf{e}_i$: $c_i = \mathbf{e}_i^t\mathbf{a}$` },
      { s: md`\mathbf{e}_i`, meaning: md`autovettore di $\Sigma$ di lunghezza 1` },
      { s: md`\lambda_i`, meaning: md`autovalore associato a $\mathbf{e}_i$` },
      { s: md`\iff`, meaning: md`se e solo se` },
    ],
    whenToUse: md`Quando all'orale devi giustificare la frase delle note «positive semi-definite, meaning all its eigenvalues are non-negative», oppure mostrare che la varianza proiettata sta sempre tra $\lambda_n$ e $\lambda_1$. I passaggi completi sono in [«l'autovettore del massimo autovalore è la direzione di massima varianza»](#derivation:der17).`,
    pitfalls: md`Serve una base ortonormale: con autovettori non ortogonali i termini misti non si cancellano. È la simmetria di $\Sigma$ a garantirla. Nella somma i pesi sono $c_i^2$, non $c_i$: per questo il segno delle componenti non conta.`,
    importance: 3,
    blanks: [{
      masked: md`\mathbf{a}=\sum_{i=1}^{n}c_i\mathbf{e}_i\ \Rightarrow\ \mathbf{a}^{t}\Sigma\,\mathbf{a}=\sum_{i=1}^{n}\boxed{\;?\;}\ge0\ \ \forall\mathbf{a}\iff\lambda_i\ge0\ \ \forall i`,
      answer: md`\lambda_i c_i^{2}`,
      distractors: [md`\lambda_i c_i`, md`\lambda_i^{2} c_i^{2}`, md`c_i^{2}`],
    }],
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }],
  },

  // --- c40 Feature indipendenti: Σ diagonale ---------------------------------------------------------
  {
    id: 'f-c40',
    name: 'Feature indipendenti: Σ diagonale',
    nameEn: 'Independent features: diagonal covariance matrix',
    latex: md`\Sigma=\begin{bmatrix}\sigma_1^{2}&0&\dots&0\\0&\sigma_2^{2}&\dots&0\\\dots&\dots&\dots&\dots\\0&0&\dots&\sigma_n^{2}\end{bmatrix}`,
    explain: md`Terza voce della slide 27, «For independent features»: tutte le covarianze fuori diagonale sono zero e restano solo le varianze $\sigma_1^2, \dots, \sigma_n^2$ sulla diagonale. Le note: quando le feature sono indipendenti la matrice è diagonale (*diagonal*) e gli elementi fuori diagonale, che rappresentano le covarianze, sono nulli; $\sigma_i^2$ è la varianza della $i$-esima feature. Geometricamente gli isolivelli sono ellissi con gli assi paralleli agli assi coordinati. Caso ancora più particolare: $\Sigma = \sigma^2 I$, varianze tutte uguali e isolivelli circolari (simmetria sferica, quella del kernel gaussiano di Parzen).`,
    symbols: [
      { s: md`\sigma_i^{2}`, meaning: md`varianza della $i$-esima feature` },
      { s: md`\dots`, meaning: md`puntini della slide: la matrice continua con lo stesso schema fino alla riga e alla colonna $n$` },
    ],
    whenToUse: md`Quando parli di feature indipendenti, del naive Bayes gaussiano o della gaussiana a simmetria sferica. I parametri da stimare scendono da $n + n(n+1)/2$ a $2n$.`,
    pitfalls: md`L'implicazione della slide va da «indipendenti» a «diagonale» e vale per qualunque distribuzione ([«feature indipendenti ⟹ covarianze nulle»](#derivation:der18)). Il viceversa (diagonale ⟹ indipendenti) vale solo per la gaussiana: in generale covarianza nulla vuol dire soltanto incorrelate.`,
    importance: 3,
    blanks: [
      {
        masked: md`\Sigma=\begin{bmatrix}\sigma_1^{2}&\boxed{\;?\;}&\dots&0\\0&\sigma_2^{2}&\dots&0\\\dots&\dots&\dots&\dots\\0&0&\dots&\sigma_n^{2}\end{bmatrix}`,
        answer: md`0`,
        distractors: [md`1`, md`\sigma_1\sigma_2`, md`\sigma_1^{2}\sigma_2^{2}`],
      },
      {
        masked: md`\Sigma=\begin{bmatrix}\sigma_1^{2}&0&\dots&0\\0&\boxed{\;?\;}&\dots&0\\\dots&\dots&\dots&\dots\\0&0&\dots&\sigma_n^{2}\end{bmatrix}`,
        answer: md`\sigma_2^{2}`,
        distractors: [md`\sigma_2`, md`1`, md`\sigma_1\sigma_2`],
      },
    ],
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }],
  },

  // --- c41 Feature indipendenti: congiunta = prodotto -------------------------------------------------
  {
    id: 'f-c41',
    name: 'Feature indipendenti: la congiunta è il prodotto delle marginali',
    nameEn: 'Independent features: p(x) = p(x1) p(x2) … p(xn)',
    latex: md`p(\mathbf{x})=p(x_1)\,p(x_2)\dots p(x_n)`,
    explain: md`Nella slide una freccia verde porta dalla $\Sigma$ diagonale a questa fattorizzazione. Le note: per feature indipendenti la pdf gaussiana multivariata si semplifica nel prodotto delle singole gaussiane univariate, cioè ogni feature è distribuita indipendentemente dalle altre. È la definizione stessa di indipendenza: la densità congiunta (*joint density*) è il prodotto delle marginali (*marginal densities*). Con il pesce: se luminosità e larghezza fossero indipendenti, la densità di un salmone luminoso e largo sarebbe il prodotto delle due densità separate.`,
    symbols: [
      { s: md`p(\mathbf{x})`, meaning: md`pdf congiunta del vettore delle feature` },
      { s: md`p(x_i)`, meaning: md`pdf marginale (univariata) della $i$-esima feature` },
    ],
    whenToUse: md`Quando giustifichi il classificatore naive Bayes o spieghi perché con feature indipendenti basta stimare $n$ densità univariate invece di una densità in $n$ dimensioni.`,
    pitfalls: md`Nel modello gaussiano la freccia si può invertire ($\Sigma$ diagonale $\iff$ fattorizzazione); per una distribuzione qualunque no: covarianze nulle non bastano a scrivere la congiunta come prodotto (vedi il [controesempio con $y = x^2$](#formula:f-c71-3)).`,
    importance: 3,
    blanks: [{
      masked: md`p(\mathbf{x})=\boxed{\;?\;}`,
      answer: md`p(x_1)\,p(x_2)\dots p(x_n)`,
      distractors: [md`p(x_1)+p(x_2)+\dots+p(x_n)`, md`\frac{1}{n}\sum_{i=1}^{n}p(x_i)`, md`p(x_1|x_2,\dots,x_n)`],
    }],
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }],
  },
  {
    id: 'f-c41-2',
    name: 'Gaussiana con Σ diagonale: prodotto di n gaussiane 1-D',
    nameEn: 'Diagonal-covariance Gaussian as a product of univariate Gaussians',
    latex: md`p(\mathbf{x})=\prod_{i=1}^{n}\frac{1}{\sigma_i\sqrt{2\pi}}\exp\left[-\frac{(x_i-m_i)^{2}}{2\sigma_i^{2}}\right]`,
    explain: md`È la fattorizzazione scritta per esteso. Metti la $\Sigma$ diagonale nella [formula multivariata](#formula:f-c26): il determinante diventa $|\Sigma| = \prod_i \sigma_i^2$, quindi $(2\pi)^{n/2}|\Sigma|^{1/2} = \prod_i \sigma_i\sqrt{2\pi}$; l'inversa è $\mathrm{diag}(1/\sigma_1^2, \dots, 1/\sigma_n^2)$, quindi la distanza di Mahalanobis diventa $\sum_i (x_i-m_i)^2/\sigma_i^2$. L'esponenziale di una somma è il prodotto degli esponenziali: restano $n$ gaussiane univariate, ognuna con la sua media $m_i$ e la sua varianza $\sigma_i^2$. Passaggi in [«con Σ diagonale la gaussiana multivariata si fattorizza»](#derivation:der06).`,
    symbols: [
      { s: md`m_i`, meaning: md`media della $i$-esima feature` },
      { s: md`\sigma_i`, meaning: md`deviazione standard della $i$-esima feature` },
      { s: md`\prod_{i=1}^{n}`, meaning: md`prodotto sulle $n$ feature` },
    ],
    whenToUse: md`Per il naive Bayes gaussiano e ogni volta che ti serve la densità di feature indipendenti. Parametri da stimare: $2n$ (medie e varianze) invece di $n + n(n+1)/2$; con $n = 10$ sono 20 contro 65.`,
    pitfalls: md`Davanti a ogni fattore c'è $1/(\sigma_i\sqrt{2\pi})$, con la deviazione standard e non la varianza; nell'esponente invece c'è $2\sigma_i^2$.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x})=\prod_{i=1}^{n}\frac{1}{\boxed{\;?\;}}\exp\left[-\frac{(x_i-m_i)^{2}}{2\sigma_i^{2}}\right]`,
        answer: md`\sigma_i\sqrt{2\pi}`,
        distractors: [md`\sigma_i^{2}\sqrt{2\pi}`, md`\sqrt{\sigma_i}\,2\pi`, md`(2\pi)^{n/2}\sigma_i`],
      },
      {
        masked: md`p(\mathbf{x})=\prod_{i=1}^{n}\frac{1}{\sigma_i\sqrt{2\pi}}\exp\left[-\frac{(x_i-m_i)^{2}}{\boxed{\;?\;}}\right]`,
        answer: md`2\sigma_i^{2}`,
        distractors: [md`\sigma_i^{2}`, md`2\sigma_i`, md`\sigma_i`],
      },
    ],
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }],
  },

  // --- c42 Campana di volume unitario -----------------------------------------------------------------
  {
    id: 'f-c42',
    name: 'La campana ha volume 1',
    nameEn: 'A bell of unitary volume',
    latex: md`\int_{-\infty}^{+\infty}\int_{-\infty}^{+\infty}p(x_1,x_2)\,dx_1\,dx_2=1`,
    explain: md`Slide 28, «Shape of a 2-D Gaussian PDF»: $p(\mathbf{x})$ si può vedere come una campana di volume unitario (*bell of unitary volume*). È la versione in due dimensioni dell'area 1 sotto una pdf 1-D: l'integrale doppio su tutto il piano vale 1 qualunque siano $\mathbf{m}$ e $\Sigma$. A garantirlo è la costante di normalizzazione, che per $n = 2$ vale $1/(2\pi|\Sigma|^{1/2})$: se la campana si stringe ($|\Sigma|$ piccolo) diventa più alta, se si allarga si abbassa. Con $\Sigma = \begin{bmatrix}3&1\\1&3\end{bmatrix}$ il picco vale $1/(2\pi\sqrt{8}) \approx 0.056$; dividendo $\Sigma$ per 4 la campana si stringe di metà in ogni direzione e il picco diventa quattro volte più alto, $\approx 0.225$.`,
    symbols: [
      { s: md`p(x_1,x_2)`, meaning: md`pdf congiunta delle due feature: l'altezza della campana sopra il punto $(x_1,x_2)$` },
      { s: md`dx_1\,dx_2`, meaning: md`elemento d'area del piano: l'integrale doppio misura un volume` },
    ],
    whenToUse: md`Quando descrivi la forma della gaussiana 2-D o spieghi il ruolo della costante davanti all'esponenziale. Perché il volume vale proprio 1: [«perché la campana ha volume 1»](#derivation:der15).`,
    pitfalls: md`Vale 1 il volume, non il picco: l'altezza massima $p(\mathbf{m})$ può superare 1 (è una densità, non una probabilità), come l'etichetta $z = 3$ nella figura della slide.`,
    importance: 2,
    blanks: [{
      masked: md`\int_{-\infty}^{+\infty}\int_{-\infty}^{+\infty}p(x_1,x_2)\,dx_1\,dx_2=\boxed{\;?\;}`,
      answer: md`1`,
      distractors: [md`p(\mathbf{m})`, md`2\pi|\Sigma|^{1/2}`, md`|\Sigma|`],
    }],
    source: [{ doc: 'ch2', page: 28 }, { doc: 'part1', page: 24 }],
  },

  // --- c43 Isolivelli: ellissi ------------------------------------------------------------------------
  {
    id: 'f-c43',
    name: 'Isolivello: distanza di Mahalanobis costante',
    nameEn: 'Isolevel equation: constant Mahalanobis distance',
    latex: md`p(\mathbf{x})=c\iff(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})=r^{2},\qquad r^{2}=-2\ln\left[c\,(2\pi)^{n/2}|\Sigma|^{1/2}\right]`,
    explain: md`Taglia la campana con un piano orizzontale a quota $c$: i punti del taglio sono quelli con $p(\mathbf{x}) = c$, gli isolivelli (*isolevels*). Prendi il logaritmo della formula gaussiana: l'unica parte che dipende da $\mathbf{x}$ è la forma quadratica all'esponente. Fissare la quota equivale quindi a fissare la distanza di Mahalanobis da $\mathbf{m}$ al valore $r$ (l'espressione di $r^2$ non è sulla slide: si ricava isolando l'esponente). L'equazione $(\mathbf{x}-\mathbf{m})^t\Sigma^{-1}(\mathbf{x}-\mathbf{m}) = r^2$ descrive un'ellisse centrata in $\mathbf{m}$: la slide dice che le fette orizzontali sono ellissi (*ellipses*), le note che rappresentano regioni a densità di probabilità costante. Cambiando $c$ cambia solo $r$: le ellissi sono concentriche, con la stessa orientazione e lo stesso rapporto tra gli assi. Passaggi in [«perché gli isolivelli sono ellissi con assi lungo gli autovettori»](#derivation:der07).`,
    symbols: [
      { s: md`c`, meaning: md`quota del taglio orizzontale: valore costante della densità sull'isolivello` },
      { s: md`r`, meaning: md`distanza di Mahalanobis comune a tutti i punti dell'isolivello` },
      { s: md`\Sigma^{-1}`, meaning: md`inversa della matrice di covarianza` },
      { s: md`|\Sigma|`, meaning: md`determinante della matrice di covarianza` },
    ],
    whenToUse: md`Quando disegni le curve di livello della gaussiana 2-D e devi dire perché sono ellissi e non cerchi. Da provare nel widget [«affetta la campana»](#widget:m06-affetta-la-campana).`,
    pitfalls: md`Nella forma quadratica c'è $\Sigma^{-1}$, non $\Sigma$. Le ellissi sono cerchi solo se $\Sigma = \sigma^2 I$. E $r$ è una distanza di Mahalanobis, non euclidea: due punti dello stesso isolivello possono stare a distanze euclidee diverse da $\mathbf{m}$.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x})=c\iff(\mathbf{x}-\mathbf{m})^{t}\boxed{\;?\;}(\mathbf{x}-\mathbf{m})=r^{2},\qquad r^{2}=-2\ln\left[c\,(2\pi)^{n/2}|\Sigma|^{1/2}\right]`,
        answer: md`\Sigma^{-1}`,
        distractors: [md`\Sigma`, md`I`, md`|\Sigma|`],
      },
      {
        masked: md`p(\mathbf{x})=c\iff(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})=r^{2},\qquad r^{2}=\boxed{\;?\;}`,
        answer: md`-2\ln\left[c\,(2\pi)^{n/2}|\Sigma|^{1/2}\right]`,
        distractors: [md`2\ln\left[c\,(2\pi)^{n/2}|\Sigma|^{1/2}\right]`, md`-2\ln c`, md`-\frac{1}{2}\ln\left[c\,(2\pi)^{n/2}|\Sigma|^{1/2}\right]`],
      },
    ],
    source: [{ doc: 'ch2', page: 28 }, { doc: 'part1', page: 24 }],
  },
  {
    id: 'f-c43-2',
    name: 'Quote possibili di un isolivello',
    nameEn: 'An isolevel exists only for 0 < c ≤ p(m)',
    latex: md`r^{2}\ge0\iff 0<c\le p(\mathbf{m})=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}`,
    explain: md`Condizione ricavata dalla formula, non scritta sulla slide. Poiché $r^2 \ge 0$, l'argomento del logaritmo nell'equazione dell'isolivello non può superare 1: la quota $c$ non può superare il picco $p(\mathbf{m})$, che è la costante di normalizzazione. Tre casi. Con $c = p(\mathbf{m})$ hai $r = 0$ e l'ellisse degenera nel punto $\mathbf{m}$: è l'etichetta $z = 3$ della figura, attaccata al punto nero centrale. Con $c$ che scende l'ellisse si allarga. Con $c \to 0$ hai $r \to \infty$: la campana non tocca mai il piano. Esempio: con $n = 2$ e $|\Sigma| = 8$ il picco vale $1/(2\pi\sqrt{8}) \approx 0.056$, e a quota $0.1$ non esiste nessun isolivello.`,
    symbols: [
      { s: md`p(\mathbf{m})`, meaning: md`valore della pdf nella media: la quota del picco` },
      { s: md`(2\pi)^{n/2}|\Sigma|^{1/2}`, meaning: md`inverso della quota del picco` },
    ],
    whenToUse: md`Quando leggi la figura della slide 28 (perché $z = 3$ è un punto e non un'ellisse) o calcoli il raggio di un isolivello a una quota data.`,
    pitfalls: md`L'isolivello alla quota del picco non è un'ellisse ma un punto. E $c$ è una densità: il limite superiore è $p(\mathbf{m})$, che può essere maggiore di 1, non 1.`,
    importance: 3,
    blanks: [{
      masked: md`r^{2}\ge0\iff 0<c\le \boxed{\;?\;}=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}`,
      answer: md`p(\mathbf{m})`,
      distractors: [md`1`, md`p(\mathbf{0})`, md`\frac{1}{2\pi}`],
    }],
    source: [{ doc: 'ch2', page: 28 }, { doc: 'part1', page: 24 }],
  },

  // --- c44 Assi diretti dagli autovettori --------------------------------------------------------------
  {
    id: 'f-c44',
    name: 'Autovettori di Σ: le direzioni degli assi',
    nameEn: 'Eigenvector equation: ellipse axes directed by the eigenvectors of Σ',
    latex: md`\Sigma\,\mathbf{e}=\lambda\,\mathbf{e}`,
    explain: md`La slide 28: le ellissi hanno gli assi diretti dagli autovettori (*eigenvectors*) di $\Sigma$ (nella slide manca la parola «of»); le note: gli assi sono allineati lungo gli autovettori. Un autovettore $\mathbf{e}$ è una direzione che $\Sigma$ non ruota: la allunga o la accorcia soltanto, del fattore $\lambda$, l'autovalore (*eigenvalue*). Nella figura di destra gli assi $\mathbf{e}_1$ ed $\mathbf{e}_2$ sono ruotati rispetto a $x_1$ e $x_2$: la rotazione è l'effetto della covarianza non nulla. Esempio: $\Sigma = \begin{bmatrix}3&1\\1&3\end{bmatrix}$ ha $\mathbf{e}_1 = (1,1)/\sqrt{2}$ con $\lambda_1 = 4$ ed $\mathbf{e}_2 = (1,-1)/\sqrt{2}$ con $\lambda_2 = 2$: le ellissi sono inclinate di 45 gradi. Con $\Sigma$ diagonale gli autovettori sono gli assi coordinati e le ellissi non sono inclinate.`,
    symbols: [
      { s: md`\mathbf{e}`, meaning: md`autovettore di $\Sigma$: direzione di un asse dell'ellisse` },
      { s: md`\lambda`, meaning: md`autovalore associato: varianza dei dati lungo $\mathbf{e}$ (con $\mathbf{e}$ di lunghezza 1)` },
    ],
    whenToUse: md`Nella domanda sulla PCA, quando Melgani chiede della «characteristic equation, eigenvalues/vectors», e ogni volta che disegni gli isolivelli. Widget: [«autovalori e autovettori: gli assi dell'ellisse»](#widget:m06-autovettori-assi-ellisse).`,
    pitfalls: md`Un autovettore è definito a meno di un fattore: $\mathbf{e}$ e $-\mathbf{e}$ indicano lo stesso asse. Per leggere $\lambda$ come varianza lungo quella direzione serve $\|\mathbf{e}\| = 1$.`,
    importance: 3,
    blanks: [{
      masked: md`\Sigma\,\mathbf{e}=\boxed{\;?\;}`,
      answer: md`\lambda\,\mathbf{e}`,
      distractors: [md`\lambda`, md`\mathbf{0}`, md`\lambda^{2}\,\mathbf{e}`],
    }],
    source: [{ doc: 'ch2', page: 28 }, { doc: 'part1', page: 24 }],
  },
  {
    id: 'f-c44-2',
    name: 'Equazione caratteristica',
    nameEn: 'Characteristic equation',
    latex: md`\det(\Sigma-\lambda I)=0`,
    explain: md`Da $\Sigma\mathbf{e} = \lambda\mathbf{e}$ ottieni $(\Sigma - \lambda I)\mathbf{e} = \mathbf{0}$. Un vettore non nullo che la risolva esiste solo se la matrice $\Sigma - \lambda I$ è singolare, cioè se il suo determinante è zero: è l'equazione caratteristica (*characteristic equation*), le cui radici sono gli autovalori. Trovato $\lambda_i$, l'autovettore si ricava da $(\Sigma - \lambda_i I)\mathbf{e}_i = \mathbf{0}$. Per $n = 2$ è un polinomio di secondo grado con i coefficienti dati da traccia (*trace*) e determinante: $\lambda^2 - (\sigma_1^2+\sigma_2^2)\lambda + (\sigma_1^2\sigma_2^2 - \sigma_{12}^2) = 0$. Con $\Sigma = \begin{bmatrix}3&1\\1&3\end{bmatrix}$ diventa $\lambda^2 - 6\lambda + 8 = 0$, quindi $\lambda_1 = 4$ e $\lambda_2 = 2$.`,
    symbols: [
      { s: md`I`, meaning: md`matrice identità $n \times n$` },
      { s: md`\det(\cdot)`, meaning: md`determinante` },
      { s: md`\lambda`, meaning: md`incognita: gli autovalori sono le radici del polinomio caratteristico` },
    ],
    whenToUse: md`Quando ti chiedono come si calcolano in pratica autovalori e autovettori della matrice di covarianza (domanda d'orale sulla PCA). La soluzione generale in 2-D, con l'angolo di rotazione dell'ellisse, è in [«perché gli isolivelli sono ellissi con assi lungo gli autovettori»](#derivation:der07).`,
    pitfalls: md`Si sottrae $\lambda I$, non lo scalare $\lambda$ da ogni elemento: cambia solo la diagonale. Il polinomio ha grado $n$, quindi gli autovalori sono $n$, contati con la loro molteplicità.`,
    importance: 3,
    blanks: [{
      masked: md`\det(\Sigma-\boxed{\;?\;})=0`,
      answer: md`\lambda I`,
      distractors: [md`\lambda`, md`I`, md`\lambda\Sigma`],
    }],
    source: [{ doc: 'ch2', page: 28 }, { doc: 'part1', page: 24 }],
  },

  // --- c45 Asse principale ------------------------------------------------------------------------------
  {
    id: 'f-c45',
    name: 'Asse principale: la direzione di massima varianza',
    nameEn: 'Main axis: eigenvector of the largest eigenvalue',
    latex: md`\lambda_1=\max_{\|\mathbf{a}\|=1}\mathbf{a}^{t}\Sigma\,\mathbf{a},\qquad \mathbf{e}_1=\arg\max_{\|\mathbf{a}\|=1}\mathbf{a}^{t}\Sigma\,\mathbf{a}`,
    explain: md`La slide 28: l'autovettore del massimo autovalore definisce l'asse principale dell'ellisse (*main axis*; le note dicono *major axis*). Le note aggiungono il perché: è la direzione lungo cui i dati hanno la varianza maggiore. La formula lo rende preciso. Tra tutte le direzioni di lunghezza 1, la varianza della proiezione $\mathbf{a}^t\Sigma\,\mathbf{a}$ è massima per $\mathbf{a} = \mathbf{e}_1$, e il massimo vale $\lambda_1$. È la prima componente principale della PCA. Con $\Sigma = \begin{bmatrix}3&1\\1&3\end{bmatrix}$ la proiezione su $(1,1)/\sqrt{2}$ ha varianza 4, quella su un asse coordinato solo 3.`,
    symbols: [
      { s: md`\|\mathbf{a}\|=1`, meaning: md`vincolo: si confrontano direzioni, non lunghezze` },
      { s: md`\arg\max`, meaning: md`il punto che realizza il massimo (qui una direzione), non il valore del massimo` },
      { s: md`\lambda_1`, meaning: md`massimo autovalore di $\Sigma$` },
      { s: md`\mathbf{e}_1`, meaning: md`autovettore associato a $\lambda_1$: l'asse principale` },
    ],
    whenToUse: md`Quando ti chiedono che cosa rappresenta il primo autovettore, o all'inizio della spiegazione della PCA. Dimostrazione con i moltiplicatori di Lagrange: [«l'autovettore del massimo autovalore è la direzione di massima varianza»](#derivation:der17).`,
    pitfalls: md`Senza il vincolo $\|\mathbf{a}\| = 1$ il massimo non esiste: basta allungare $\mathbf{a}$ per far crescere $\mathbf{a}^t\Sigma\,\mathbf{a}$ senza limite. L'asse principale è il più lungo dell'ellisse, non quello più vicino all'asse $x_1$.`,
    importance: 3,
    blanks: [{
      masked: md`\lambda_1=\max_{\|\mathbf{a}\|=1}\boxed{\;?\;},\qquad \mathbf{e}_1=\arg\max_{\|\mathbf{a}\|=1}\mathbf{a}^{t}\Sigma\,\mathbf{a}`,
      answer: md`\mathbf{a}^{t}\Sigma\,\mathbf{a}`,
      distractors: [md`\mathbf{a}^{t}\Sigma^{-1}\mathbf{a}`, md`\mathbf{a}^{t}\mathbf{a}`, md`\mathbf{a}^{t}\mathbf{m}`],
    }],
    source: [{ doc: 'ch2', page: 28 }, { doc: 'part1', page: 24 }],
  },

  // --- c46 Autovalori e lunghezza degli assi -----------------------------------------------------------------
  {
    id: 'f-c46',
    name: 'Lunghezza dei semiassi: la radice degli autovalori',
    nameEn: 'Semi-axis lengths from the eigenvalues',
    latex: md`a_i=r\sqrt{\lambda_i}`,
    explain: md`Solo nelle note: la grandezza degli autovalori determina la lunghezza degli assi, e autovalori maggiori danno assi più lunghi. La relazione esatta, ricavata dall'equazione dell'isolivello: sull'isolivello di distanza di Mahalanobis $r$ il semiasse lungo $\mathbf{e}_i$ misura $r\sqrt{\lambda_i}$. La lunghezza va quindi con la radice dell'autovalore, cioè con la deviazione standard lungo quella direzione. Con $\lambda_1 = 4$, $\lambda_2 = 2$ e $r = 1$ i semiassi sono $2$ e $\sqrt{2} \approx 1.41$. Il rapporto tra gli assi, $\sqrt{\lambda_1/\lambda_2}$, non dipende da $r$: tutte le ellissi hanno la stessa forma. Con $\lambda_1 = \lambda_2$ l'ellisse è un cerchio.`,
    symbols: [
      { s: md`a_i`, meaning: md`semiasse dell'ellisse lungo l'autovettore $\mathbf{e}_i$ (una lunghezza, da non confondere con il vettore $\mathbf{a}$)` },
      { s: md`r`, meaning: md`distanza di Mahalanobis dell'isolivello` },
      { s: md`\sqrt{\lambda_i}`, meaning: md`deviazione standard dei dati lungo $\mathbf{e}_i$` },
    ],
    whenToUse: md`Quando disegni un isolivello con i numeri: centro in $\mathbf{m}$, assi lungo gli autovettori, semiassi $r\sqrt{\lambda_i}$. Si legge sull'[equazione dell'iperellisse negli assi degli autovettori](#formula:f-c52-2).`,
    pitfalls: md`Il semiasse è proporzionale a $\sqrt{\lambda_i}$, non a $\lambda_i$: raddoppiare un autovalore allunga l'asse di un fattore $\sqrt{2}$, non del doppio.`,
    importance: 2,
    blanks: [{
      masked: md`a_i=r\boxed{\;?\;}`,
      answer: md`\sqrt{\lambda_i}`,
      distractors: [md`\lambda_i`, md`\frac{1}{\sqrt{\lambda_i}}`, md`\lambda_i^{2}`],
    }],
    source: [{ doc: 'part1', page: 24 }],
  },

  // --- c47 Figura: campana affettata e curve di livello ------------------------------------------------------
  {
    id: 'f-c47',
    name: 'Asse verticale della figura: la quota z = P(x)',
    nameEn: 'Vertical axis of the sliced bell: z = P(x)',
    latex: md`z=P(\mathbf{x})`,
    explain: md`Nella figura di sinistra della slide 28 l'asse verticale è etichettato $z = P(\mathbf{x})$: la quota della superficie sopra il punto $(x_1, x_2)$ è il valore della pdf (la figura scrive $P$ maiuscola, ma è la stessa densità $p$). Le linee orizzontali tracciate sulla campana sono le fette a quota costante. La figura di destra le guarda dall'alto: tre ellissi concentriche con etichette $z = 2$, $z = 0.5$, $z = 0.01$ dall'interno all'esterno, e l'etichetta $z = 3$ attaccata al punto nero centrale, la media, dove la campana raggiunge la quota massima. Due rette per il centro portano le etichette $\mathbf{e}_1$ (lungo l'allungamento) ed $\mathbf{e}_2$ (perpendicolare). Figura: [«campana affettata e curve di livello»](#figure:fig11).`,
    symbols: [
      { s: md`z`, meaning: md`quota: valore della pdf nel punto` },
      { s: md`P(\mathbf{x})`, meaning: md`la pdf $p(\mathbf{x})$ con la notazione della figura` },
    ],
    whenToUse: md`Quando all'orale ridisegni la figura: a sinistra la campana con le fette, a destra le ellissi con quote decrescenti verso l'esterno e gli assi $\mathbf{e}_1$, $\mathbf{e}_2$.`,
    pitfalls: md`Le ellissi disegnate sono tre, non quattro: $z = 3$ non è un'ellisse ma il punto del picco. Quota alta vuol dire ellisse piccola, vicina alla media.`,
    importance: 3,
    blanks: [{
      masked: md`z=\boxed{\;?\;}`,
      answer: md`P(\mathbf{x})`,
      distractors: [md`\mathbf{x}`, md`\ln P(\mathbf{x})`, md`(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})`],
    }],
    source: [{ doc: 'ch2', page: 28 }, { doc: 'part1', page: 25 }],
  },
  {
    id: 'f-c47-2',
    name: 'Raggio di Mahalanobis degli isolivelli della figura',
    nameEn: 'Mahalanobis radius of the contour at height z',
    latex: md`z_{max}=P(\mathbf{m})=3,\qquad r(z)=\sqrt{2\ln\frac{z_{max}}{z}}`,
    explain: md`Integrazione che rende quantitativa la figura. Lungo un isolivello di raggio $r$ la pdf vale $z = z_{max}\,e^{-r^2/2}$, con $z_{max} = P(\mathbf{m})$; risolvendo per $r$ ottieni la formula. Con il picco $z_{max} = 3$ della figura: $z = 2$ dà $r = \sqrt{2\ln 1.5} \approx 0.90$, $z = 0.5$ dà $r = \sqrt{2\ln 6} \approx 1.89$, $z = 0.01$ dà $r = \sqrt{2\ln 300} \approx 3.38$. Per allargare l'ellisse servono cali di quota sempre più grandi: da $z = 2$ a $z = 0.5$ il raggio cresce di circa 1, da $0.5$ a $0.01$ (una quota cinquanta volte più bassa) solo di 1.5. La slide non dà $\mathbf{m}$ né $\Sigma$: i valori di $z$ sono illustrativi, ma coerenti tra loro. Conti completi nell'esempio [«isolivelli di una gaussiana 2-D»](#example:ex07).`,
    symbols: [
      { s: md`z_{max}`, meaning: md`quota del picco, raggiunta nella media $\mathbf{m}$` },
      { s: md`r(z)`, meaning: md`raggio di Mahalanobis dell'ellisse di quota $z$` },
      { s: md`P(\mathbf{m})`, meaning: md`valore della pdf nella media` },
    ],
    whenToUse: md`Per verificare la figura o per un esercizio numerico sugli isolivelli: data la quota trovi $r$, e poi i semiassi $r\sqrt{\lambda_i}$.`,
    pitfalls: md`Nel logaritmo c'è il rapporto $z_{max}/z$, non $1/z$: senza la quota del picco il raggio dipenderebbe dalle unità di misura. La formula vale per $0 < z \le z_{max}$.`,
    importance: 3,
    blanks: [{
      masked: md`z_{max}=P(\mathbf{m})=3,\qquad r(z)=\sqrt{2\ln\frac{\boxed{\;?\;}}{z}}`,
      answer: md`z_{max}`,
      distractors: [md`1`, md`2\pi`, md`|\Sigma|^{1/2}`],
    }],
    source: [{ doc: 'ch2', page: 28 }, { doc: 'part1', page: 25 }],
  },

  // --- c48 Autovalori e autovettori in n dimensioni ----------------------------------------------------------
  {
    id: 'f-c48',
    name: 'Autovalori e autovettori di Σ in n dimensioni',
    nameEn: 'Eigenvalues and eigenvectors of Σ in n dimensions',
    latex: md`\lambda_1,\lambda_2,\dots,\lambda_n;\qquad \mathbf{e}_1,\mathbf{e}_2,\dots,\mathbf{e}_n`,
    explain: md`Slide 29, «Shape of a n-D Gaussian PDF»: le osservazioni fatte in 2-D si generalizzano a $n$ dimensioni. Siano $\lambda_1, \dots, \lambda_n$ gli autovalori di $\Sigma$ ed $\mathbf{e}_1, \dots, \mathbf{e}_n$ gli autovettori corrispondenti. Una matrice $n \times n$ simmetrica ha esattamente $n$ autovalori reali (contati con la loro molteplicità) e $n$ autovettori, uno per ogni asse dell'iperellisse. Con il pesce descritto da luminosità, larghezza e lunghezza ($n = 3$) sono tre autovalori e tre assi.`,
    symbols: [
      { s: md`\lambda_i`, meaning: md`$i$-esimo autovalore di $\Sigma$` },
      { s: md`\mathbf{e}_i`, meaning: md`$i$-esimo autovettore di $\Sigma$, associato a $\lambda_i$` },
    ],
    whenToUse: md`All'inizio della spiegazione della forma della gaussiana in $n$ dimensioni e della PCA: fissa la notazione prima di dire ordinamento, positività e ortogonalità.`,
    pitfalls: md`L'indice degli autovalori non è l'indice delle feature: $\lambda_1$ non è la varianza di $x_1$ (lo è solo se $\Sigma$ è diagonale e $x_1$ è la feature con varianza maggiore).`,
    importance: 3,
    blanks: [{
      masked: md`\lambda_1,\lambda_2,\dots,\boxed{\;?\;};\qquad \mathbf{e}_1,\mathbf{e}_2,\dots,\mathbf{e}_n`,
      answer: md`\lambda_n`,
      distractors: [md`\lambda_{n^{2}}`, md`\lambda_{N}`, md`\lambda_{n-1}`],
    }],
    source: [{ doc: 'ch2', page: 29 }, { doc: 'part1', page: 25 }],
  },
  {
    id: 'f-c48-2',
    name: 'Le n equazioni agli autovettori',
    nameEn: 'Eigen-equations of the covariance matrix',
    latex: md`\Sigma\,\mathbf{e}_i=\lambda_i\,\mathbf{e}_i,\quad i=1,\dots,n`,
    explain: md`Ogni coppia autovalore-autovettore soddisfa $\Sigma\mathbf{e}_i = \lambda_i\mathbf{e}_i$. Messe una accanto all'altra, le $n$ equazioni diventano una sola equazione matriciale, $\Sigma U = U\Lambda$, da cui nasce la [decomposizione spettrale](#formula:f-c51-2) $\Sigma = U\Lambda U^t$. Letta sui dati: lungo $\mathbf{e}_i$ la matrice di covarianza agisce come il solo numero $\lambda_i$, che è la varianza dei dati in quella direzione.`,
    symbols: [
      { s: md`\mathbf{e}_i`, meaning: md`autovettore di $\Sigma$` },
      { s: md`\lambda_i`, meaning: md`autovalore associato a $\mathbf{e}_i$` },
    ],
    whenToUse: md`Quando passi dalla definizione degli autovettori alla decomposizione spettrale e al cambio di coordinate che rende incorrelate le feature (PCA).`,
    pitfalls: md`Ogni autovettore va con il suo autovalore: scambiare gli indici scambia gli assi dell'ellisse.`,
    importance: 3,
    blanks: [{
      masked: md`\Sigma\,\mathbf{e}_i=\boxed{\;?\;},\quad i=1,\dots,n`,
      answer: md`\lambda_i\,\mathbf{e}_i`,
      distractors: [md`\lambda_i`, md`\lambda_i^{2}\,\mathbf{e}_i`, md`\mathbf{e}_i^{t}\Sigma`],
    }],
    source: [{ doc: 'ch2', page: 29 }, { doc: 'part1', page: 25 }],
  },

  // --- c49 Ordinamento degli autovalori ----------------------------------------------------------------------
  {
    id: 'f-c49',
    name: 'Autovalori in ordine decrescente',
    nameEn: 'Eigenvalue ordering convention',
    latex: md`\lambda_1\ge\lambda_2\ge\dots\ge\lambda_n`,
    explain: md`Per convenzione (*by convention*) autovalori e autovettori si numerano in modo che $\lambda_1 \ge \lambda_2 \ge \dots \ge \lambda_n$. Così $\mathbf{e}_1$ è sempre la direzione di massima varianza ed $\mathbf{e}_n$ quella di minima, qualunque sia la matrice. È la stessa convenzione della PCA: le prime componenti sono quelle da tenere.`,
    symbols: [
      { s: md`\lambda_1`, meaning: md`autovalore più grande` },
      { s: md`\lambda_n`, meaning: md`autovalore più piccolo` },
    ],
    whenToUse: md`Ogni volta che dici «il primo autovettore» o «l'ultimo autovettore»: la numerazione ha senso solo con questa convenzione.`,
    pitfalls: md`Fuori dalle slide: non tutte le librerie di calcolo restituiscono gli autovalori in ordine decrescente (alcune li danno crescenti). Prima di leggere $\mathbf{e}_1$ come asse principale, ordina. Gli uguali sono ammessi: la disuguaglianza non è stretta.`,
    importance: 2,
    blanks: [{
      masked: md`\lambda_1\boxed{\;?\;}\lambda_2\ge\dots\ge\lambda_n`,
      answer: md`\ge`,
      distractors: [md`\le`, md`>`],
    }],
    source: [{ doc: 'ch2', page: 29 }, { doc: 'part1', page: 25 }],
  },

  // --- c50 Autovalori positivi -------------------------------------------------------------------------------
  {
    id: 'f-c50',
    name: 'Ogni autovalore è una varianza',
    nameEn: 'Each eigenvalue is the variance along its eigenvector',
    latex: md`\lambda_i=\mathbf{e}_i^{t}\Sigma\,\mathbf{e}_i=var\{\mathbf{e}_i^{t}\mathbf{x}\}\ge 0`,
    explain: md`La slide 29: poiché $\Sigma$ è simmetrica e semidefinita positiva, gli autovalori assumono valori positivi (*will take positive values*); le note scrivono non negativi (*non-negative*). La formula dice perché. Moltiplica $\Sigma\mathbf{e}_i = \lambda_i\mathbf{e}_i$ a sinistra per $\mathbf{e}_i^t$, con $\|\mathbf{e}_i\| = 1$: ottieni $\lambda_i = \mathbf{e}_i^t\Sigma\,\mathbf{e}_i$, che è la varianza dei dati proiettati su $\mathbf{e}_i$, quindi non negativa. Lo zero corrisponde a una direzione lungo cui i dati non variano affatto: allora $|\Sigma| = 0$ e la pdf gaussiana non è definita. Quando la gaussiana esiste, gli autovalori sono strettamente positivi, come dice la slide.`,
    symbols: [
      { s: md`\mathbf{e}_i^{t}\mathbf{x}`, meaning: md`proiezione del vettore delle feature sull'autovettore unitario $\mathbf{e}_i$` },
      { s: md`var\{\cdot\}`, meaning: md`varianza` },
    ],
    whenToUse: md`Quando spieghi la catena logica della slide 29: la simmetria dà autovalori reali e autovettori ortogonali, la semidefinitezza dà autovalori $\ge 0$. Dimostrazione: [«Σ è simmetrica e semidefinita positiva»](#derivation:der05).`,
    pitfalls: md`Serve $\|\mathbf{e}_i\| = 1$: con un autovettore di lunghezza 2 la forma quadratica vale $4\lambda_i$. E la varianza lungo $\mathbf{e}_i$ non è la varianza di una feature $x_i$, salvo per $\Sigma$ diagonale.`,
    importance: 2,
    blanks: [{
      masked: md`\lambda_i=\mathbf{e}_i^{t}\Sigma\,\mathbf{e}_i=\boxed{\;?\;}\ge 0`,
      answer: md`var\{\mathbf{e}_i^{t}\mathbf{x}\}`,
      distractors: [md`E\{\mathbf{e}_i^{t}\mathbf{x}\}`, md`\sqrt{var\{\mathbf{e}_i^{t}\mathbf{x}\}}`, md`var\{x_i\}`],
    }],
    source: [{ doc: 'ch2', page: 29 }, { doc: 'part1', page: 25 }],
  },

  // --- c51 Base ortogonale di autovettori ------------------------------------------------------------------------
  {
    id: 'f-c51',
    name: 'Autovettori ortogonali',
    nameEn: 'The eigenvectors form an orthogonal basis',
    latex: md`\mathbf{e}_i^{t}\mathbf{e}_j=0\quad(i\ne j)`,
    explain: md`La slide 29: gli autovettori formano una base ortogonale (*orthogonal basis*); le note: sono mutuamente perpendicolari. È una conseguenza della simmetria di $\Sigma$. Con autovalori distinti l'ortogonalità è obbligata: lo scalare $\mathbf{e}_j^t\Sigma\mathbf{e}_i$ vale sia $\lambda_i\,\mathbf{e}_j^t\mathbf{e}_i$ sia $\lambda_j\,\mathbf{e}_j^t\mathbf{e}_i$, e con $\lambda_i \ne \lambda_j$ l'unica possibilità è $\mathbf{e}_j^t\mathbf{e}_i = 0$. Con autovalori ripetuti (isolivelli circolari) ogni direzione del loro sottospazio è un autovettore e se ne scelgono di perpendicolari. Per questo nella figura della slide 28 gli assi $\mathbf{e}_1$ ed $\mathbf{e}_2$ sono perpendicolari.`,
    symbols: [
      { s: md`\mathbf{e}_i^{t}\mathbf{e}_j`, meaning: md`prodotto scalare tra due autovettori` },
    ],
    whenToUse: md`Quando ti chiedono perché gli assi delle ellissi sono perpendicolari o perché la PCA è una rotazione degli assi. Dimostrazione: [«autovalori reali e autovettori ortogonali di Σ»](#derivation:der16).`,
    pitfalls: md`L'ortogonalità viene dalla simmetria, non dalla semidefinitezza: una matrice non simmetrica può avere autovettori obliqui.`,
    importance: 3,
    blanks: [{
      masked: md`\mathbf{e}_i^{t}\mathbf{e}_j=\boxed{\;?\;}\quad(i\ne j)`,
      answer: md`0`,
      distractors: [md`1`, md`\lambda_i`, md`-1`],
    }],
    source: [{ doc: 'ch2', page: 29 }, { doc: 'part1', page: 25 }],
  },
  {
    id: 'f-c51-2',
    name: 'Decomposizione spettrale di Σ',
    nameEn: 'Spectral decomposition of the covariance matrix',
    latex: md`\Sigma=U\Lambda U^{t},\qquad U=[\mathbf{e}_1\ \dots\ \mathbf{e}_n],\quad U^{t}U=I,\quad \Lambda=diag(\lambda_1,\dots,\lambda_n)`,
    explain: md`Normalizza gli autovettori a lunghezza 1 e mettili come colonne di una matrice $U$. Poiché sono ortonormali, $U^tU = I$: $U$ è una rotazione (al più con una riflessione) e $U^{-1} = U^t$. Le $n$ equazioni $\Sigma\mathbf{e}_i = \lambda_i\mathbf{e}_i$ diventano $\Sigma U = U\Lambda$, cioè $\Sigma = U\Lambda U^t$. Conseguenze: $\Sigma^{-1} = U\Lambda^{-1}U^t$; $|\Sigma| = \prod_i \lambda_i$; nelle coordinate ruotate $\mathbf{y} = U^t(\mathbf{x} - \mathbf{m})$ le feature sono incorrelate, con covarianza $\Lambda$ diagonale. Esempio: per $\Sigma = \begin{bmatrix}3&1\\1&3\end{bmatrix}$ hai $U = \frac{1}{\sqrt{2}}\begin{bmatrix}1&1\\1&-1\end{bmatrix}$ e $\Lambda = \mathrm{diag}(4, 2)$. La lettera $U$ è una scelta di queste note (la slide non la usa): evita la confusione con l'operatore di valore atteso $E\{\cdot\}$.`,
    symbols: [
      { s: md`U`, meaning: md`matrice ortogonale che ha per colonne gli autovettori unitari (notazione introdotta qui, non l'operatore $E\{\cdot\}$)` },
      { s: md`\Lambda`, meaning: md`matrice diagonale degli autovalori` },
      { s: md`diag(\cdot)`, meaning: md`matrice diagonale con gli elementi indicati` },
      { s: md`I`, meaning: md`matrice identità` },
    ],
    whenToUse: md`Quando colleghi la gaussiana alla PCA (cambio di base sugli autovettori) o ti servono in fretta inversa e determinante di $\Sigma$. È il secondo passo di [«perché gli isolivelli sono ellissi con assi lungo gli autovettori»](#derivation:der07).`,
    pitfalls: md`L'ordine conta: $\Sigma = U\Lambda U^t$, non $U^t\Lambda U$. Con la seconda metteresti gli autovettori sulle righe e otterresti un'altra matrice.`,
    importance: 3,
    blanks: [{
      masked: md`\Sigma=\boxed{\;?\;},\qquad U=[\mathbf{e}_1\ \dots\ \mathbf{e}_n],\quad U^{t}U=I,\quad \Lambda=diag(\lambda_1,\dots,\lambda_n)`,
      answer: md`U\Lambda U^{t}`,
      distractors: [md`U^{t}\Lambda U`, md`U\Lambda U`, md`\Lambda U U^{t}`],
    }],
    source: [{ doc: 'ch2', page: 29 }, { doc: 'part1', page: 25 }],
  },

  // --- c52 Iperellissi in n-D --------------------------------------------------------------------------------
  {
    id: 'f-c52',
    name: 'Isolivello in n dimensioni',
    nameEn: 'Isolevel set of p(x) in R^n',
    latex: md`\{\mathbf{x}\in\Re^{n}:\ p(\mathbf{x})=c\}`,
    explain: md`La slide 29: gli isolivelli di $p(\mathbf{x})$ sono iperellissi (*hyperellipses*) in $\Re^n$, con le direzioni degli assi governate dagli autovettori; le note: superfici ellittiche in dimensione superiore. L'isolivello è l'insieme dei punti in cui la densità vale la stessa costante $c$: in 2-D un'ellisse, in 3-D un ellissoide (*ellipsoid*; la forma della nuvola della slide 30), oltre un iperellissoide che non si disegna ma si tratta con la stessa equazione.`,
    symbols: [
      { s: md`c`, meaning: md`quota dell'isolivello: valore costante della pdf` },
      { s: md`\Re^{n}`, meaning: md`spazio delle feature a $n$ dimensioni` },
    ],
    whenToUse: md`Quando generalizzi la forma della gaussiana da 2 a $n$ dimensioni, per esempio con le centinaia di bande di un'immagine iperspettrale.`,
    pitfalls: md`In $n$ dimensioni l'isolivello non è una curva ma una superficie di dimensione $n - 1$.`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'ch2', page: 29 }, { doc: 'part1', page: 25 }],
  },
  {
    id: 'f-c52-2',
    name: 'Iperellisse negli assi degli autovettori',
    nameEn: 'Hyperellipse equation in eigenvector coordinates',
    latex: md`\sum_{i=1}^{n}\frac{y_i^{2}}{\lambda_i}=r^{2},\qquad y_i=\mathbf{e}_i^{t}(\mathbf{x}-\mathbf{m})`,
    explain: md`Sposta l'origine in $\mathbf{m}$ e ruota gli assi sugli autovettori: la nuova coordinata $y_i$ è la componente di $\mathbf{x} - \mathbf{m}$ lungo $\mathbf{e}_i$. In queste coordinate $\Sigma^{-1}$ diventa diagonale, $\Lambda^{-1}$, e la distanza di Mahalanobis perde i termini misti: resta una somma di quadrati, ciascuno diviso per il suo autovalore. Dividendo per $r^2$ ottieni la forma canonica $\sum_i y_i^2/(r\sqrt{\lambda_i})^2 = 1$: un iperellisse con semiassi $r\sqrt{\lambda_i}$ lungo gli autovettori. Passaggi in [«perché gli isolivelli sono ellissi con assi lungo gli autovettori»](#derivation:der07).`,
    symbols: [
      { s: md`y_i`, meaning: md`coordinata di $\mathbf{x} - \mathbf{m}$ lungo l'autovettore unitario $\mathbf{e}_i$` },
      { s: md`\lambda_i`, meaning: md`autovalore: varianza dei dati lungo $\mathbf{e}_i$` },
      { s: md`r`, meaning: md`distanza di Mahalanobis dell'isolivello` },
    ],
    whenToUse: md`Quando devi dimostrare che gli isolivelli sono (iper)ellissi e ricavare le lunghezze degli assi.`,
    pitfalls: md`Al denominatore ci sono gli autovalori $\lambda_i$, non le varianze $\sigma_i^2$ delle feature originali: coincidono solo se $\Sigma$ è diagonale.`,
    importance: 2,
    blanks: [{
      masked: md`\sum_{i=1}^{n}\frac{y_i^{2}}{\boxed{\;?\;}}=r^{2},\qquad y_i=\mathbf{e}_i^{t}(\mathbf{x}-\mathbf{m})`,
      answer: md`\lambda_i`,
      distractors: [md`\lambda_i^{2}`, md`\sqrt{\lambda_i}`, md`\sigma_i^{2}`],
    }],
    source: [{ doc: 'ch2', page: 29 }, { doc: 'part1', page: 25 }],
  },

  // --- c53 Asse principale e asse più piccolo ----------------------------------------------------------------
  {
    id: 'f-c53',
    name: 'Dal primo all\'ultimo autovettore: semiassi decrescenti',
    nameEn: 'The first eigenvector defines the principal axis, the last one the smallest axis',
    latex: md`r\sqrt{\lambda_1}\ge r\sqrt{\lambda_2}\ge\dots\ge r\sqrt{\lambda_n}`,
    explain: md`La slide 29: il primo autovettore definisce l'asse principale (*principal axis*), l'ultimo l'asse più piccolo (*smallest axis*). Le note precisano: il primo, associato al massimo autovalore, è la direzione di massima varianza; l'ultimo, associato al minimo, quella di minima varianza. Con l'ordinamento $\lambda_1 \ge \dots \ge \lambda_n$ e i semiassi $r\sqrt{\lambda_i}$, gli assi dell'iperellisse risultano in ordine decrescente di lunghezza.`,
    symbols: [
      { s: md`r\sqrt{\lambda_i}`, meaning: md`semiasse lungo $\mathbf{e}_i$ sull'isolivello di raggio di Mahalanobis $r$` },
    ],
    whenToUse: md`Nella PCA: le direzioni con semiassi piccoli portano poca varianza e sono le prime da scartare quando riduci la dimensione.`,
    pitfalls: md`Un semiasse molto più piccolo degli altri segnala una $\Sigma$ quasi singolare: $\lambda_n \approx 0$, $|\Sigma| \approx 0$ e l'inversa numericamente instabile.`,
    importance: 2,
    blanks: [{
      masked: md`r\sqrt{\lambda_1}\ge r\sqrt{\lambda_2}\ge\dots\ge \boxed{\;?\;}`,
      answer: md`r\sqrt{\lambda_n}`,
      distractors: [md`r\sqrt{\lambda_1}`, md`r\lambda_n`, md`\frac{r}{\sqrt{\lambda_n}}`],
    }],
    source: [{ doc: 'ch2', page: 29 }, { doc: 'part1', page: 25 }],
  },

  // --- c55 Esempio 3-D: x1 e x3 indipendenti -----------------------------------------------------------------
  {
    id: 'f-c55',
    name: 'Esempio 3-D: x1 e x3 indipendenti',
    nameEn: 'In this example, features x1 and x3 are independent',
    latex: md`\sigma_{13}=\sigma_{31}=0\ \Rightarrow\ p(x_1,x_3)=p(x_1)\,p(x_3)`,
    explain: md`Annotazione della slide 30: nell'esempio le feature $x_1$ e $x_3$ sono indipendenti («In this example, the features x1 and x3 are independent!»). Si vede dalla figura: l'ellisse proiettata sulla parete $(x_1, x_3)$ ha gli assi paralleli agli assi $x_1$ e $x_3$ disegnati, quindi la covarianza $\sigma_{13}$ è nulla. La coppia $(x_1, x_3)$ di una gaussiana è ancora gaussiana, con covarianza $\begin{bmatrix}\sigma_1^2&\sigma_{13}\\\sigma_{13}&\sigma_3^2\end{bmatrix}$: se questa è diagonale, la sua pdf si fattorizza. Le altre due ombre sono inclinate: quelle coppie sono correlate. Nella matrice $3 \times 3$ gli elementi $(1,3)$ e $(3,1)$ valgono zero. Esempio svolto: [«gaussiana 3-D con x1 e x3 indipendenti»](#example:ex08).`,
    symbols: [
      { s: md`\sigma_{13}`, meaning: md`covarianza tra $x_1$ e $x_3$ (elemento $(1,3)$ di $\Sigma$)` },
      { s: md`p(x_1,x_3)`, meaning: md`pdf marginale della coppia $(x_1, x_3)$` },
    ],
    whenToUse: md`Quando commenti la figura della nuvola 3-D ([«gaussiana 3-D nel cubo»](#figure:fig13)): dall'inclinazione di ogni ombra leggi il segno della covarianza di quella coppia.`,
    pitfalls: md`Nel disegno prospettico l'asse $x_1$ è obliquo: l'ellisse della parete sinistra va confrontata con l'asse $x_1$ disegnato, non con il bordo della slide. E l'indipendenza riguarda la coppia $(x_1, x_3)$ presa da sola (marginale), non condizionata a $x_2$.`,
    importance: 2,
    blanks: [{
      masked: md`\sigma_{13}=\sigma_{31}=\boxed{\;?\;}\ \Rightarrow\ p(x_1,x_3)=p(x_1)\,p(x_3)`,
      answer: md`0`,
      distractors: [md`1`, md`\sigma_1\sigma_3`],
    }],
    source: [{ doc: 'ch2', page: 30 }, { doc: 'part1', page: 25 }],
  },
  {
    id: 'f-c55-2',
    name: 'Covarianza nulla non vuol dire elemento nullo dell\'inversa',
    nameEn: 'Zero covariance does not imply a zero entry of the inverse covariance',
    latex: md`\sigma_{13}=0\ \not\Rightarrow\ \left[\Sigma^{-1}\right]_{13}=0`,
    explain: md`Precisazione che non è sulla slide. $\sigma_{13} = 0$ dice che $x_1$ e $x_3$ sono indipendenti prese da sole (indipendenza marginale). Non dice che restino indipendenti una volta noto $x_2$ (indipendenza condizionata, *conditional independence*): per una gaussiana questa richiede l'elemento $(1,3)$ nullo nell'inversa $\Sigma^{-1}$. Esempio: $\Sigma = \begin{bmatrix}1&0.6&0\\0.6&1&0.5\\0&0.5&1\end{bmatrix}$ ha $\sigma_{13} = 0$, ma $|\Sigma| = 0.39$ e $[\Sigma^{-1}]_{13} = 0.3/0.39 \approx 0.77$. Qui $x_1$ e $x_3$ sono entrambe legate a $x_2$: prese da sole sono indipendenti, ma se conosci $x_2$ diventano dipendenti.`,
    symbols: [
      { s: md`\left[\Sigma^{-1}\right]_{13}`, meaning: md`elemento $(1,3)$ dell'inversa della covarianza: nullo se e solo se $x_1$ e $x_3$ sono indipendenti dato $x_2$ (caso gaussiano)` },
      { s: md`\not\Rightarrow`, meaning: md`non implica` },
    ],
    whenToUse: md`Se all'orale ti chiedono che cosa vuol dire esattamente «indipendenti» nella nota della slide 30: indipendenza a coppie (marginale), letta su $\Sigma$; l'indipendenza condizionata si legge su $\Sigma^{-1}$ (ti servirà con le reti bayesiane).`,
    pitfalls: md`Non confondere $\Sigma$ con $\Sigma^{-1}$: gli zeri dell'una non sono gli zeri dell'altra, salvo quando la matrice è diagonale.`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'ch2', page: 30 }, { doc: 'part1', page: 25 }],
  },

  // --- c56 Stima ML: impostazione con N campioni iid ---------------------------------------------------------
  {
    id: 'f-c56',
    name: 'Training set di N campioni iid',
    nameEn: 'Set of N iid training samples',
    latex: md`\boldsymbol{X}=\{\mathbf{x}_1,\mathbf{x}_2,\dots,\mathbf{x}_N\}`,
    explain: md`La slide 31 apre la stima dei parametri della gaussiana: si dispone di $N$ campioni di training indipendenti e identicamente distribuiti (*independent and identically distributed*, iid), raccolti nell'insieme $\boldsymbol{X}$. Con il pesce: $N$ salmoni misurati, e ogni $\mathbf{x}_k$ è il vettore (luminosità, larghezza) del $k$-esimo. «Identicamente distribuiti» vuol dire che vengono tutti dalla stessa gaussiana $N(\mathbf{m}, \Sigma)$ da stimare; «indipendenti», che la misura di un pesce non dice nulla su quella degli altri.`,
    symbols: [
      { s: md`\boldsymbol{X}`, meaning: md`insieme dei campioni di training` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo campione: un vettore di $n$ feature` },
      { s: md`N`, meaning: md`numero di campioni (da non confondere con la dimensione $n$)` },
    ],
    whenToUse: md`Prima di scrivere qualsiasi stima: dichiara i dati e l'ipotesi iid, che è quella che permette di fattorizzare la verosimiglianza.`,
    pitfalls: md`$N$ (numero di campioni) e $n$ (numero di feature) sono cose diverse: $\hat{\mathbf{m}}$ ha $n$ componenti ed è una media su $N$ campioni.`,
    importance: 3,
    blanks: [{
      masked: md`\boldsymbol{X}=\{\mathbf{x}_1,\mathbf{x}_2,\dots,\boxed{\;?\;}\}`,
      answer: md`\mathbf{x}_N`,
      distractors: [md`\mathbf{x}_n`, md`\mathbf{m}`, md`\mathbf{x}_{N-1}`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 25 }],
  },
  {
    id: 'f-c56-2',
    name: 'Log-verosimiglianza di campioni iid',
    nameEn: 'Log-likelihood of N iid samples',
    latex: md`\ln p(\boldsymbol{X}|\mathbf{m},\Sigma)=\sum_{k=1}^{N}\ln p(\mathbf{x}_k|\mathbf{m},\Sigma)`,
    explain: md`Per l'indipendenza, la verosimiglianza (*likelihood*) dell'intero training set è il prodotto delle densità dei singoli campioni; il logaritmo trasforma il prodotto in una somma e, essendo crescente, non sposta il massimo. La slide scrive soltanto «it can be shown» e dà il risultato: la dimostrazione consiste nell'annullare il gradiente di questa somma rispetto a $\mathbf{m}$ e a $\Sigma$. Passaggi in [«stima ML di m e Σ nel caso multivariato»](#derivation:der09) e, per una sola feature, in [«stima ML di media e varianza di una gaussiana 1-D»](#derivation:der08).`,
    symbols: [
      { s: md`p(\mathbf{x}_k|\mathbf{m},\Sigma)`, meaning: md`densità gaussiana del $k$-esimo campione, vista come funzione dei parametri` },
      { s: md`\ln`, meaning: md`logaritmo naturale` },
    ],
    whenToUse: md`Alla domanda d'esame «why we can use the separate products of the probabilities»: la risposta è l'ipotesi iid.`,
    pitfalls: md`Senza indipendenza la congiunta non si fattorizza e la somma dei logaritmi non vale. Il logaritmo di una somma non è la somma dei logaritmi: si passa al logaritmo dopo aver scritto il prodotto.`,
    importance: 3,
    blanks: [{
      masked: md`\ln p(\boldsymbol{X}|\mathbf{m},\Sigma)=\boxed{\;?\;}`,
      answer: md`\sum_{k=1}^{N}\ln p(\mathbf{x}_k|\mathbf{m},\Sigma)`,
      distractors: [md`\prod_{k=1}^{N}\ln p(\mathbf{x}_k|\mathbf{m},\Sigma)`, md`\ln\sum_{k=1}^{N}p(\mathbf{x}_k|\mathbf{m},\Sigma)`, md`\sum_{k=1}^{N}p(\mathbf{x}_k|\mathbf{m},\Sigma)`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 25 }],
  },

  // --- c57 Stima ML della media ------------------------------------------------------------------------------
  {
    id: 'f-c57',
    name: 'Stima ML del vettore media',
    nameEn: 'ML estimate of the mean vector (sample mean)',
    latex: md`\hat{\mathbf{m}}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k`,
    explain: md`La stima a massima verosimiglianza (*Maximum Likelihood*, ML) del vettore media è la media aritmetica dei campioni, componente per componente. Il significato viene dalla derivata: il gradiente della log-verosimiglianza rispetto a $\mathbf{m}$ è $\Sigma^{-1}\sum_k(\mathbf{x}_k - \mathbf{m})$, e si annulla quando gli scarti dei campioni si bilanciano, cioè nel baricentro dei dati. Il risultato non dipende da $\Sigma$. Esempio con tre salmoni (luminosità, larghezza): $(2,1)$, $(4,3)$, $(6,2)$ danno $\hat{\mathbf{m}} = (4, 2)$.`,
    symbols: [
      { s: md`\hat{\mathbf{m}}`, meaning: md`stima ML del vettore media: un vettore di $n$ componenti` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo campione di training` },
      { s: md`N`, meaning: md`numero di campioni` },
    ],
    whenToUse: md`Nella domanda «develop the first derivative for a gaussian and explain the meaning of the result», e nel passo M dell'algoritmo EM per le misture di gaussiane, dove diventa una media pesata.`,
    pitfalls: md`Si divide per $N$ (campioni), non per $n$ (feature). E il cappello conta: $\hat{\mathbf{m}}$ è una stima che cambia con il training set, $\mathbf{m}$ è il valore vero, fisso.`,
    importance: 3,
    blanks: [{
      masked: md`\hat{\mathbf{m}}=\boxed{\;?\;}\sum_{k=1}^{N}\mathbf{x}_k`,
      answer: md`\frac{1}{N}`,
      distractors: [md`\frac{1}{N-1}`, md`\frac{1}{n}`, md`N`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }],
  },

  // --- c58 Stima ML della covarianza -------------------------------------------------------------------------
  {
    id: 'f-c58',
    name: 'Stima ML della matrice di covarianza',
    nameEn: 'ML estimate of the covariance matrix',
    latex: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}`,
    explain: md`È la [definizione di $\Sigma$](#formula:f-c35) con due sostituzioni: il valore atteso diventa la media sui campioni e la media vera $\mathbf{m}$ diventa la sua stima $\hat{\mathbf{m}}$. Ogni addendo è il prodotto esterno (*outer product*) di uno scarto con se stesso, una matrice $n \times n$ di rango 1; il fattore davanti è $1/N$. Con i tre salmoni $(2,1)$, $(4,3)$, $(6,2)$ e $\hat{\mathbf{m}} = (4,2)$ gli scarti sono $(-2,-1)$, $(0,1)$, $(2,0)$; la somma dei prodotti esterni è $\begin{bmatrix}8&2\\2&2\end{bmatrix}$ e $\hat{\Sigma} = \frac{1}{3}\begin{bmatrix}8&2\\2&2\end{bmatrix} \approx \begin{bmatrix}2.67&0.67\\0.67&0.67\end{bmatrix}$. Passaggi della derivazione: [«stima ML di m e Σ nel caso multivariato»](#derivation:der09).`,
    symbols: [
      { s: md`\hat{\Sigma}`, meaning: md`stima ML della matrice di covarianza` },
      { s: md`(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}`, meaning: md`prodotto esterno dello scarto: colonna per riga, una matrice $n \times n$` },
    ],
    whenToUse: md`Ogni volta che adatti una gaussiana ai dati di una classe (classificatore bayesiano gaussiano) e nel passo M dell'algoritmo EM.`,
    pitfalls: md`Colonna per riga, $(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t$, dà una matrice; riga per colonna darebbe uno scalare. Il fattore ML è $1/N$ e la stima è distorta: $1/(N-1)$ è lo stimatore corretto, non quello ML.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\Sigma}=\boxed{\;?\;}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}`,
        answer: md`\frac{1}{N}`,
        distractors: [md`\frac{1}{N-1}`, md`\frac{1}{n}`, md`\frac{N-1}{N}`],
      },
      {
        masked: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}\boxed{\;?\;}`,
        answer: md`(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}`,
        distractors: [md`(\mathbf{x}_k-\hat{\mathbf{m}})^{t}(\mathbf{x}_k-\hat{\mathbf{m}})`, md`\mathbf{x}_k\mathbf{x}_k^{t}`, md`(\mathbf{x}_k-\hat{\mathbf{m}})^{2}`],
      },
    ],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }],
  },
  {
    id: 'f-c58-2',
    name: 'Rango della covarianza stimata',
    nameEn: 'Rank of the estimated covariance: at most min(n, N-1)',
    latex: md`\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})=\mathbf{0}\ \Rightarrow\ \mathrm{rank}(\hat{\Sigma})\le\min(n,\,N-1)`,
    explain: md`Integrazione, non scritta nella slide. Gli $N$ scarti $\mathbf{x}_k - \hat{\mathbf{m}}$ hanno somma zero (è la definizione di $\hat{\mathbf{m}}$), quindi sono linearmente dipendenti e generano uno spazio di dimensione al più $N - 1$. $\hat{\Sigma}$ è una somma di prodotti esterni di questi vettori, quindi il suo rango è al più $\min(n, N-1)$. Per avere $|\hat{\Sigma}| > 0$, cioè una gaussiana stimata che esista, servono almeno $n + 1$ campioni in posizione generale (in 2-D: non tutti sulla stessa retta). Esempio: due salmoni $(2,1)$ e $(4,3)$ danno $\hat{\mathbf{m}} = (3,2)$ e $\hat{\Sigma} = \begin{bmatrix}1&1\\1&1\end{bmatrix}$, di rango 1 e determinante 0. Con $N = 1$, $\hat{\Sigma}$ è la matrice nulla.`,
    symbols: [
      { s: md`\mathrm{rank}(\cdot)`, meaning: md`rango: numero di colonne linearmente indipendenti` },
      { s: md`\mathbf{0}`, meaning: md`vettore nullo` },
    ],
    whenToUse: md`Quando ti chiedono quanti campioni servono per stimare una gaussiana in $n$ dimensioni, o perché con molte feature e pochi campioni (immagini iperspettrali, effetto Hughes) la covarianza stimata non si inverte.`,
    pitfalls: md`$N \ge n + 1$ è necessario, non sufficiente: campioni allineati danno comunque una $\hat{\Sigma}$ singolare.`,
    importance: 3,
    blanks: [{
      masked: md`\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})=\mathbf{0}\ \Rightarrow\ \mathrm{rank}(\hat{\Sigma})\le\min(n,\,\boxed{\;?\;})`,
      answer: md`N-1`,
      distractors: [md`N-2`, md`n-1`, md`1`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }],
  },

  // --- c59 Forma equivalente della covarianza ML --------------------------------------------------------------
  {
    id: 'f-c59',
    name: 'Forma equivalente della covarianza ML',
    nameEn: 'Equivalent form of the ML covariance estimate',
    latex: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t}-\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}`,
    explain: md`La slide prosegue l'uguaglianza: la stima è anche la media dei prodotti esterni $\mathbf{x}_k\mathbf{x}_k^t$ meno il prodotto esterno della media stimata. È la versione campionaria di $\Sigma = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$ ([forma equivalente della covarianza](#formula:f-c36)). Utile nel calcolo: in una sola passata sui dati accumuli $\sum_k \mathbf{x}_k$ e $\sum_k \mathbf{x}_k\mathbf{x}_k^t$. Controllo con i tre salmoni: $\frac{1}{3}\sum_k\mathbf{x}_k\mathbf{x}_k^t = \frac{1}{3}\begin{bmatrix}56&26\\26&14\end{bmatrix}$ e $\hat{\mathbf{m}}\hat{\mathbf{m}}^t = \begin{bmatrix}16&8\\8&4\end{bmatrix}$: la differenza è di nuovo $\frac{1}{3}\begin{bmatrix}8&2\\2&2\end{bmatrix}$. Passaggi in [«equivalenza delle due forme della stima ML della covarianza»](#derivation:der10).`,
    symbols: [
      { s: md`\mathbf{x}_k\mathbf{x}_k^{t}`, meaning: md`prodotto esterno del campione con se stesso (momento del secondo ordine)` },
      { s: md`\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}`, meaning: md`prodotto esterno della media stimata: una matrice $n \times n$` },
    ],
    whenToUse: md`Nei conti a mano con pochi campioni e quando i dati arrivano uno alla volta: bastano due somme accumulate.`,
    pitfalls: md`Il termine sottratto è $\hat{\mathbf{m}}\hat{\mathbf{m}}^t$ (una matrice), non $\hat{\mathbf{m}}^t\hat{\mathbf{m}}$ (uno scalare). Nota di calcolo numerico, fuori dalle slide: se la media è grande rispetto alla dispersione, la sottrazione tra due numeri quasi uguali perde cifre significative e la prima forma è più stabile.`,
    importance: 3,
    blanks: [{
      masked: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t}-\boxed{\;?\;}`,
      answer: md`\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}`,
      distractors: [md`\hat{\mathbf{m}}^{t}\hat{\mathbf{m}}`, md`2\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}`, md`\mathbf{m}\mathbf{m}^{t}`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }],
  },

  // --- c60 Proprietà delle stime ML gaussiane ----------------------------------------------------------------
  {
    id: 'f-c60',
    name: 'Consistenza: le stime convergono ai valori veri',
    nameEn: 'Consistency of the Gaussian ML estimates',
    latex: md`N\to+\infty:\quad \hat{\mathbf{m}}\to\mathbf{m},\quad \hat{\Sigma}\to\Sigma`,
    explain: md`La slide 31: queste stime sono asintoticamente non distorte (*asymptotically unbiased*), efficienti (*efficient*) e consistenti (*consistent*). Le note le spiegano una per una. Asintoticamente non distorte: al crescere di $N$ le stime si avvicinano ai veri $\mathbf{m}$ e $\Sigma$. Efficienti: raggiungono la minima varianza possibile per stimatori non distorti. Consistenti: per $N \to +\infty$ le stime $\hat{\mathbf{m}}$ e $\hat{\Sigma}$ convergono ai valori veri, ed è ciò che dice questa formula. Sono le proprietà generali della stima ML applicate alla gaussiana.`,
    symbols: [
      { s: md`N\to+\infty`, meaning: md`numero di campioni che cresce senza limite` },
      { s: md`\hat{\mathbf{m}}\to\mathbf{m}`, meaning: md`la stima converge (in probabilità) al valore vero` },
    ],
    whenToUse: md`Alla domanda «Is Maximum Likelihood Estimation a good estimator?»: elenca le tre proprietà e precisa quali valgono per ogni $N$ e quali solo al limite. Widget: [«asintoticamente non distorte, efficienti, consistenti»](#widget:m06-proprieta-asintotiche-stime).`,
    pitfalls: md`La media campionaria è non distorta ed efficiente per ogni $N$; la covarianza ML è distorta per $N$ finito e diventa non distorta solo al limite. Dire «le stime ML sono non distorte» senza «asintoticamente» è sbagliato per $\hat{\Sigma}$.`,
    importance: 3,
    blanks: [{
      masked: md`N\to\boxed{\;?\;}:\quad \hat{\mathbf{m}}\to\mathbf{m},\quad \hat{\Sigma}\to\Sigma`,
      answer: md`+\infty`,
      distractors: [md`n`, md`0`, md`1`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }, { doc: 'part1', page: 19 }],
  },
  {
    id: 'f-c60-2',
    name: 'Covarianza ML asintoticamente non distorta',
    nameEn: 'The ML covariance estimate is asymptotically unbiased',
    latex: md`\lim_{N\to+\infty}E\{\hat{\Sigma}\}=\Sigma`,
    explain: md`Il valore atteso della covarianza ML è $\frac{N-1}{N}\Sigma$: per $N$ finito sottostima, ma il fattore tende a 1 e il bias sparisce al limite. È il significato di «asintoticamente non distorta». Con $N = 10$ la stima vale in media il 90% della covarianza vera, con $N = 100$ il 99%. Per la media il problema non si pone: $E\{\hat{\mathbf{m}}\} = \mathbf{m}$ per ogni $N$.`,
    symbols: [
      { s: md`E\{\hat{\Sigma}\}`, meaning: md`valore atteso della stima, calcolato su tutti i possibili training set di $N$ campioni` },
      { s: md`\lim_{N\to+\infty}`, meaning: md`limite per numero di campioni infinito` },
    ],
    whenToUse: md`Per distinguere all'orale «non distorto» da «asintoticamente non distorto», con la covarianza come esempio del secondo caso.`,
    pitfalls: md`Asintoticamente non distorto non vuol dire non distorto: con pochi campioni il bias c'è, e si corregge con il fattore $N/(N-1)$.`,
    importance: 3,
    blanks: [{
      masked: md`\lim_{N\to+\infty}E\{\hat{\Sigma}\}=\boxed{\;?\;}`,
      answer: md`\Sigma`,
      distractors: [md`\frac{N-1}{N}\Sigma`, md`\mathbf{0}`, md`\hat{\Sigma}`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }, { doc: 'part1', page: 19 }],
  },
  {
    id: 'f-c60-3',
    name: 'Covarianza della media campionaria: Σ/N',
    nameEn: 'Covariance of the sample mean shrinks as 1/N',
    latex: md`Cov\{\hat{\mathbf{m}}\}=\frac{1}{N}\Sigma,\qquad \lim_{N\to+\infty}\frac{1}{N}\Sigma=0`,
    explain: md`Le note (pagina 19) danno le condizioni necessarie di consistenza: lo stimatore deve essere asintoticamente non distorto e la sua varianza deve tendere a zero. Per la media campionaria si verificano in modo esplicito: è non distorta per ogni $N$ e la sua covarianza vale $\Sigma/N$, che si annulla per $N \to +\infty$. Esempio: se la luminosità dei salmoni ha varianza 4, la media su 100 pesci ha varianza $0.04$, cioè deviazione standard $0.2$. Inoltre $\Sigma/N$ coincide con il limite di Cramér-Rao (l'inverso dell'informazione di Fisher $N\Sigma^{-1}$), quindi $\hat{\mathbf{m}}$ è efficiente per ogni $N$. Il valore $\Sigma/N$ si ricava in [«bias della covarianza ML e stimatore corretto»](#derivation:der12); efficienza e consistenza in [«bontà delle stime ML gaussiane»](#derivation:der19).`,
    symbols: [
      { s: md`Cov\{\hat{\mathbf{m}}\}`, meaning: md`matrice di covarianza dello stimatore $\hat{\mathbf{m}}$ al variare del training set` },
      { s: md`\frac{1}{N}\Sigma`, meaning: md`covarianza di un singolo campione divisa per $N$` },
    ],
    whenToUse: md`Quando devi mostrare, e non solo affermare, che la media campionaria è consistente ed efficiente.`,
    pitfalls: md`Serve l'indipendenza dei campioni: con campioni correlati i termini misti $E\{(\mathbf{x}_k-\mathbf{m})(\mathbf{x}_l-\mathbf{m})^t\}$ non si annullano e la covarianza non scende come $1/N$. La deviazione standard della media scende come $1/\sqrt{N}$, non come $1/N$.`,
    importance: 3,
    blanks: [{
      masked: md`Cov\{\hat{\mathbf{m}}\}=\boxed{\;?\;}\Sigma,\qquad \lim_{N\to+\infty}\frac{1}{N}\Sigma=0`,
      answer: md`\frac{1}{N}`,
      distractors: [md`\frac{1}{N^{2}}`, md`\frac{N-1}{N}`, md`\frac{1}{\sqrt{N}}`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }, { doc: 'part1', page: 19 }],
  },

  // --- c61 Media campionaria non distorta --------------------------------------------------------------------
  {
    id: 'f-c61',
    name: 'La media campionaria è non distorta',
    nameEn: 'Expected value of the ML mean estimate',
    latex: md`E\{\hat{\mathbf{m}}\}=\mathbf{m}`,
    explain: md`La slide («In addition, we have») e le note («The expected values of the ML estimates are») danno $E\{\hat{\mathbf{m}}\} = \mathbf{m}$: in media, su tutti i possibili training set, la media campionaria cade sulla media vera, per qualunque $N$. È quindi non distorta (*unbiased*) anche con pochi campioni. La prova è una riga, per linearità del valore atteso: $E\{\frac{1}{N}\sum_k\mathbf{x}_k\} = \frac{1}{N}\sum_k E\{\mathbf{x}_k\} = \frac{1}{N}\,N\mathbf{m} = \mathbf{m}$ ([«la media campionaria è non distorta»](#derivation:der11)).`,
    symbols: [
      { s: md`E\{\hat{\mathbf{m}}\}`, meaning: md`valore atteso della stima al variare del training set` },
      { s: md`\mathbf{m}`, meaning: md`vettore media vero` },
    ],
    whenToUse: md`Quando confronti le due stime ML della gaussiana: la media è a posto per ogni $N$, la covarianza no.`,
    pitfalls: md`Per questo risultato non servono né l'indipendenza né la gaussianità: basta che ogni campione abbia media $\mathbf{m}$. L'indipendenza serve invece per la covarianza della stima.`,
    importance: 3,
    blanks: [{
      masked: md`E\{\hat{\mathbf{m}}\}=\boxed{\;?\;}`,
      answer: md`\mathbf{m}`,
      distractors: [md`\frac{N-1}{N}\mathbf{m}`, md`\hat{\mathbf{m}}`, md`\mathbf{0}`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }],
  },

  // --- c62 Covarianza ML distorta ----------------------------------------------------------------------------
  {
    id: 'f-c62',
    name: 'La covarianza ML è distorta',
    nameEn: 'Expected value of the ML covariance estimate',
    latex: md`E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma`,
    explain: md`In media la stima ML della covarianza è più piccola di quella vera di un fattore $(N-1)/N$: è distorta (*biased*) e sottostima la variabilità. Il motivo: gli scarti sono misurati da $\hat{\mathbf{m}}$, calcolata sugli stessi dati, che sta loro più vicina della media vera $\mathbf{m}$. In formule, $E\{\hat{\Sigma}\} = (\Sigma + \mathbf{m}\mathbf{m}^t) - (\frac{1}{N}\Sigma + \mathbf{m}\mathbf{m}^t)$: il termine $\frac{1}{N}\Sigma$ è la covarianza della media campionaria, che si porta via un pezzo di varianza. Casi limite: con $N = 1$ la stima è sempre la matrice nulla; con $N \to +\infty$ il fattore tende a 1. Passaggi in [«bias della covarianza ML e stimatore corretto»](#derivation:der12).`,
    symbols: [
      { s: md`E\{\hat{\Sigma}\}`, meaning: md`valore atteso della stima ML della covarianza su tutti i training set di $N$ campioni` },
      { s: md`\frac{N-1}{N}`, meaning: md`fattore di bias: minore di 1, tende a 1 per $N \to +\infty$` },
    ],
    whenToUse: md`Quando ti chiedono se la ML è un buon stimatore: è l'esempio classico di stima ML distorta ma asintoticamente non distorta. Widget: [«1/N o 1/(N-1)? Il bias della varianza ML»](#widget:m06-bias-covarianza-ml).`,
    pitfalls: md`Il fattore è $(N-1)/N$, minore di 1: la ML sottostima, non sovrastima. Servono campioni indipendenti e identicamente distribuiti con covarianza finita; la gaussianità invece non serve.`,
    importance: 3,
    blanks: [{
      masked: md`E\{\hat{\Sigma}\}=\boxed{\;?\;}\Sigma`,
      answer: md`\frac{N-1}{N}`,
      distractors: [md`\frac{N}{N-1}`, md`1`, md`\frac{1}{N}`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }],
  },

  // --- c63 Stimatore non distorto elementare -----------------------------------------------------------------
  {
    id: 'f-c63',
    name: 'Stimatore non distorto elementare di Σ',
    nameEn: 'Elementary unbiased estimator for Σ',
    latex: md`\hat{\Sigma}=\frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}`,
    explain: md`La slide: uno stimatore non distorto elementare (*elementary unbiased estimator*) si ottiene dividendo la stessa somma di prodotti esterni per $N - 1$ invece che per $N$. Il suo valore atteso è esattamente $\Sigma$. Non è più la stima ML: si rinuncia alla massima verosimiglianza per togliere il bias. Con i tre salmoni la somma dei prodotti esterni è $\begin{bmatrix}8&2\\2&2\end{bmatrix}$: la ML la divide per 3, questo stimatore per 2 e dà $\begin{bmatrix}4&1\\1&1\end{bmatrix}$.`,
    symbols: [
      { s: md`\hat{\Sigma}`, meaning: md`in questa formula: lo stimatore corretto con $1/(N-1)$ (la slide riusa il simbolo della stima ML)` },
      { s: md`N-1`, meaning: md`gradi di libertà rimasti dopo aver stimato la media dagli stessi dati` },
    ],
    whenToUse: md`Con pochi campioni, quando ti serve una stima della covarianza che in media sia giusta.`,
    pitfalls: md`La slide usa lo stesso simbolo $\hat{\Sigma}$ per due stimatori diversi: all'orale distinguili, per esempio con $\hat{\Sigma}_{ML}$ e $\hat{\Sigma}_{unbiased}$. Richiede $N \ge 2$.`,
    importance: 3,
    blanks: [{
      masked: md`\hat{\Sigma}=\boxed{\;?\;}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}`,
      answer: md`\frac{1}{N-1}`,
      distractors: [md`\frac{1}{N}`, md`\frac{N}{N-1}`, md`\frac{1}{N+1}`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }],
  },

  // --- c64 Fattore di correzione -----------------------------------------------------------------------------
  {
    id: 'f-c64',
    name: 'Fattore di correzione N/(N-1)',
    nameEn: 'Correction factor N/(N-1) for small samples',
    latex: md`\hat{\Sigma}_{unbiased}=\frac{N}{N-1}\,\hat{\Sigma}_{ML}`,
    explain: md`Le note spiegano il passaggio: per ottenere lo stimatore non distorto elementare, soprattutto con pochi campioni (*especially for small sample sizes*), si moltiplica la stima ML per $N/(N-1)$. Il fattore compensa esattamente il bias: $E\{\hat{\Sigma}_{unbiased}\} = \frac{N}{N-1}\cdot\frac{N-1}{N}\Sigma = \Sigma$. Ordini di grandezza: con $N = 2$ la ML vale in media metà del vero e la correzione raddoppia la stima; con $N = 10$ la correzione è dell'11%; con $N = 100$ dell'1%. Conta con pochi dati ed è irrilevante con molti.`,
    symbols: [
      { s: md`\hat{\Sigma}_{unbiased}`, meaning: md`stimatore corretto, con fattore $1/(N-1)$` },
      { s: md`\hat{\Sigma}_{ML}`, meaning: md`stima a massima verosimiglianza, con fattore $1/N$` },
    ],
    whenToUse: md`Per passare da uno stimatore all'altro senza rifare la somma, e per spiegare perché con molti campioni la differenza non conta.`,
    pitfalls: md`Il fattore di correzione è $N/(N-1)$, l'inverso del fattore di bias $(N-1)/N$: non confonderli.`,
    importance: 2,
    blanks: [{
      masked: md`\hat{\Sigma}_{unbiased}=\boxed{\;?\;}\,\hat{\Sigma}_{ML}`,
      answer: md`\frac{N}{N-1}`,
      distractors: [md`\frac{N-1}{N}`, md`\frac{1}{N-1}`, md`N-1`],
    }],
    source: [{ doc: 'part1', page: 26 }],
  },

  // --- c66 Visione ML: θ fisso ma incognito -------------------------------------------------------------------
  {
    id: 'f-c66',
    name: 'Visione ML: θ fisso ma incognito',
    nameEn: 'ML estimation: the parameter vector is fixed but unknown',
    latex: md`\hat{\boldsymbol{\theta}}=\arg\max_{\boldsymbol{\theta}}\,p(X|\boldsymbol{\theta})`,
    explain: md`Le note, all'inizio della stima bayesiana (*Bayesian estimation*), riassumono il punto di vista ML: il vettore dei parametri $\boldsymbol{\theta}$ è una quantità fissa (*fixed*) ma incognita. L'obiettivo è trovare la singola stima migliore, quella che massimizza la verosimiglianza di osservare i dati disponibili. Il risultato è un punto, non una distribuzione: per la gaussiana $\boldsymbol{\theta} = (\mathbf{m}, \Sigma)$ e il punto è $(\hat{\mathbf{m}}, \hat{\Sigma})$.`,
    symbols: [
      { s: md`\hat{\boldsymbol{\theta}}`, meaning: md`stima ML: il valore dei parametri che massimizza la verosimiglianza` },
      { s: md`p(X|\boldsymbol{\theta})`, meaning: md`verosimiglianza (*likelihood*) dei dati $X$ in funzione di $\boldsymbol{\theta}$` },
      { s: md`\arg\max_{\boldsymbol{\theta}}`, meaning: md`il valore di $\boldsymbol{\theta}$ che realizza il massimo` },
    ],
    whenToUse: md`Quando confronti ML e stima bayesiana (domanda d'esame: la ML è migliore o no rispetto alla stima bayesiana?).`,
    pitfalls: md`Si massimizza $p(X|\boldsymbol{\theta})$, la probabilità dei dati dati i parametri, non $p(\boldsymbol{\theta}|X)$: quella è la densità a posteriori dell'approccio bayesiano.`,
    importance: 2,
    blanks: [{
      masked: md`\hat{\boldsymbol{\theta}}=\arg\max_{\boldsymbol{\theta}}\,\boxed{\;?\;}`,
      answer: md`p(X|\boldsymbol{\theta})`,
      distractors: [md`p(\boldsymbol{\theta}|X)`, md`p(\boldsymbol{\theta})`, md`p(X)`],
    }],
    source: [{ doc: 'part1', page: 26 }],
  },

  // --- c67 Visione bayesiana: dalla prior alla posterior -----------------------------------------------------
  {
    id: 'f-c67',
    name: 'Visione bayesiana: dalla prior alla posterior',
    nameEn: 'Bayesian estimation: from the prior to the posterior density',
    latex: md`p(\boldsymbol{\theta})\ \longrightarrow\ p(\boldsymbol{\theta}|X)`,
    explain: md`Nella stima bayesiana, detta anche apprendimento bayesiano (*Bayesian learning*), il parametro $\boldsymbol{\theta}$ è una variabile aleatoria (*random variable*) con una sua distribuzione. La densità a priori (*prior*) $p(\boldsymbol{\theta})$ riassume ciò che si sa o si assume sul parametro prima di qualunque osservazione. Osservato il training set $X$, il teorema di Bayes la aggiorna nella densità a posteriori (*posterior probability density*) $p(\boldsymbol{\theta}|X)$. La freccia della formula è questo aggiornamento; il calcolo è nel foglio sulla stima bayesiana.`,
    symbols: [
      { s: md`p(\boldsymbol{\theta})`, meaning: md`densità a priori del parametro` },
      { s: md`p(\boldsymbol{\theta}|X)`, meaning: md`densità a posteriori del parametro dopo aver visto i dati $X$` },
      { s: md`\longrightarrow`, meaning: md`aggiornamento con il teorema di Bayes` },
    ],
    whenToUse: md`Per aprire il confronto tra ML e stima bayesiana: nel bayesiano il risultato è una distribuzione su $\boldsymbol{\theta}$, non un solo valore. Widget: [«θ fisso o θ aleatorio?»](#widget:m06-theta-fisso-o-aleatorio).`,
    pitfalls: md`La freccia non è un'uguaglianza: la posterior dipende dai dati attraverso la verosimiglianza e in generale è diversa dalla prior.`,
    importance: 2,
    blanks: [{
      masked: md`p(\boldsymbol{\theta})\ \longrightarrow\ \boxed{\;?\;}`,
      answer: md`p(\boldsymbol{\theta}|X)`,
      distractors: [md`p(X|\boldsymbol{\theta})`, md`\hat{\boldsymbol{\theta}}`, md`p(X)`],
    }],
    source: [{ doc: 'part1', page: 26 }],
  },

  // --- c68 Forma della densità nota ---------------------------------------------------------------------------
  {
    id: 'f-c68',
    name: 'Forma della densità nota',
    nameEn: 'Known density form p(x|θ)',
    latex: md`p(\mathbf{x}|\boldsymbol{\theta})`,
    explain: md`Le note: la stima bayesiana si applica in ogni situazione in cui la densità incognita si può parametrizzare. Prima ipotesi fondamentale (*Known Density Form*): la forma funzionale della verosimiglianza $p(\mathbf{x}|\boldsymbol{\theta})$ è nota, mentre i valori specifici del vettore $\boldsymbol{\theta}$ non sono noti con precisione. È la stessa premessa della stima parametrica di questo foglio: scegli la famiglia (per esempio gaussiana, con $\boldsymbol{\theta} = (\mathbf{m}, \Sigma)$) e stimi i parametri. L'elenco delle ipotesi continua nel foglio sulla stima bayesiana.`,
    symbols: [
      { s: md`p(\mathbf{x}|\boldsymbol{\theta})`, meaning: md`densità dei dati: forma nota, parametri $\boldsymbol{\theta}$ da stimare` },
      { s: md`\boldsymbol{\theta}`, meaning: md`vettore dei parametri` },
    ],
    whenToUse: md`Per dire quando si può usare la stima bayesiana (e anche la ML): solo se la famiglia della densità è fissata a priori.`,
    pitfalls: md`Se la forma scelta è sbagliata (dati bimodali modellati con una sola gaussiana), né la ML né la stima bayesiana lo correggono: stimano bene i parametri di un modello sbagliato. Per forme ignote servono i metodi non parametrici.`,
    importance: 2,
    blanks: [],
    source: [{ doc: 'part1', page: 26 }],
  },

  // --- c69 Σ 2x2 e coefficiente di correlazione ---------------------------------------------------------------
  {
    id: 'f-c69',
    name: 'Σ in due dimensioni con il coefficiente di correlazione',
    nameEn: '2×2 covariance matrix with the correlation coefficient',
    latex: md`\Sigma=\begin{bmatrix}\sigma_1^{2}&\sigma_{12}\\\sigma_{12}&\sigma_2^{2}\end{bmatrix}=\begin{bmatrix}\sigma_1^{2}&\rho\,\sigma_1\sigma_2\\\rho\,\sigma_1\sigma_2&\sigma_2^{2}\end{bmatrix}`,
    explain: md`Integrazione che rende operativo il termine correlazione delle note: $\Sigma$ descrive la variabilità e la correlazione tra le dimensioni dei dati («the variability and correlation between the different dimensions of the data»). Con due feature la matrice ha sulla diagonale le varianze $\sigma_1^2$ e $\sigma_2^2$ e fuori diagonale la covarianza $\sigma_{12}$, che si scrive anche $\rho\,\sigma_1\sigma_2$. Esempio con il pesce: luminosità con $\sigma_1 = 2$, larghezza con $\sigma_2 = 1$, correlazione $\rho = 0.5$, quindi $\Sigma = \begin{bmatrix}4&1\\1&1\end{bmatrix}$. Tre numeri descrivono tutta la forma della campana: due larghezze e un'inclinazione.`,
    symbols: [
      { s: md`\sigma_1^{2},\ \sigma_2^{2}`, meaning: md`varianze delle due feature` },
      { s: md`\sigma_{12}`, meaning: md`covarianza tra la feature 1 e la feature 2` },
      { s: md`\rho`, meaning: md`coefficiente di correlazione (notazione introdotta qui)` },
    ],
    whenToUse: md`In ogni esercizio o disegno 2-D: fissati $\sigma_1$, $\sigma_2$ e $\rho$ scrivi subito $\Sigma$. È la parametrizzazione usata dai widget di questo foglio, per esempio [«una campana di volume 1»](#widget:m06-volume-unitario).`,
    pitfalls: md`Fuori diagonale c'è $\rho\,\sigma_1\sigma_2$, con le deviazioni standard; non $\rho\,\sigma_1^2\sigma_2^2$.`,
    importance: 3,
    blanks: [{
      masked: md`\Sigma=\begin{bmatrix}\sigma_1^{2}&\sigma_{12}\\\sigma_{12}&\sigma_2^{2}\end{bmatrix}=\begin{bmatrix}\sigma_1^{2}&\boxed{\;?\;}\\\rho\,\sigma_1\sigma_2&\sigma_2^{2}\end{bmatrix}`,
      answer: md`\rho\,\sigma_1\sigma_2`,
      distractors: [md`\rho\,\sigma_1^{2}\sigma_2^{2}`, md`\rho`, md`\sigma_1\sigma_2`],
    }],
    source: [{ doc: 'part1', page: 23 }, { doc: 'part1', page: 24 }, { doc: 'ch2', page: 27 }],
  },
  {
    id: 'f-c69-2',
    name: 'Coefficiente di correlazione',
    nameEn: 'Correlation coefficient',
    latex: md`\rho=\frac{\sigma_{12}}{\sigma_1\sigma_2},\qquad -1\le\rho\le 1`,
    explain: md`Il coefficiente di correlazione (*correlation coefficient*) è la covarianza divisa per le due deviazioni standard: un numero puro, senza unità, tra $-1$ e $1$. Con $\rho > 0$ le due feature crescono insieme e l'ellisse è inclinata verso l'alto a destra, come nelle figure delle slide 26 e 28. Con $\rho < 0$ una cresce quando l'altra cala. Con $\rho = 0$, $\Sigma$ è diagonale e, per la gaussiana, le feature sono indipendenti. Con $\sigma_{12} = 1$, $\sigma_1 = 2$ e $\sigma_2 = 1$ ottieni $\rho = 0.5$. Il vincolo $|\rho| \le 1$, cioè $\sigma_{12}^2 \le \sigma_1^2\sigma_2^2$, è la semidefinitezza positiva in due dimensioni.`,
    symbols: [
      { s: md`\rho`, meaning: md`coefficiente di correlazione` },
      { s: md`\sigma_1,\ \sigma_2`, meaning: md`deviazioni standard delle due feature` },
      { s: md`\sigma_{12}`, meaning: md`covarianza tra le due feature` },
    ],
    whenToUse: md`Quando devi confrontare la dipendenza tra coppie di feature con unità diverse (luminosità e larghezza): la covarianza non si confronta, $\rho$ sì.`,
    pitfalls: md`$\rho$ misura solo la dipendenza lineare: $\rho = 0$ non esclude una dipendenza non lineare, salvo nel modello gaussiano.`,
    importance: 3,
    blanks: [{
      masked: md`\rho=\frac{\sigma_{12}}{\boxed{\;?\;}},\qquad -1\le\rho\le 1`,
      answer: md`\sigma_1\sigma_2`,
      distractors: [md`\sigma_1^{2}\sigma_2^{2}`, md`\sigma_1+\sigma_2`, md`\sqrt{\sigma_1\sigma_2}`],
    }],
    source: [{ doc: 'part1', page: 23 }, { doc: 'part1', page: 24 }, { doc: 'ch2', page: 27 }],
  },
  {
    id: 'f-c69-3',
    name: 'Determinante della Σ 2×2',
    nameEn: 'Determinant of the 2×2 covariance matrix',
    latex: md`|\Sigma|=\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2}=\sigma_1^{2}\sigma_2^{2}(1-\rho^{2})`,
    explain: md`Il determinante di $\Sigma$ in due dimensioni è il prodotto delle varianze meno il quadrato della covarianza, cioè $\sigma_1^2\sigma_2^2(1 - \rho^2)$. Misura quanto è grande l'ellisse: $|\Sigma|^{1/2}$ entra nella costante di normalizzazione e nell'area delle regioni a densità costante. Più le feature sono correlate, più l'ellisse si schiaccia e il determinante cala. Con $|\rho| = 1$ si annulla: le feature sono linearmente dipendenti, $\Sigma$ non è invertibile e la pdf non è definita. Esempio: $\Sigma = \begin{bmatrix}4&1\\1&1\end{bmatrix}$ ha $|\Sigma| = 4 - 1 = 3 = 4\cdot 1\cdot(1 - 0.25)$.`,
    symbols: [
      { s: md`|\Sigma|`, meaning: md`determinante della matrice di covarianza` },
      { s: md`1-\rho^{2}`, meaning: md`fattore che riduce il determinante al crescere della correlazione` },
    ],
    whenToUse: md`Nei conti 2-D della costante di normalizzazione $1/(2\pi|\Sigma|^{1/2})$ e per spiegare perché con feature perfettamente correlate la gaussiana degenera.`,
    pitfalls: md`Si sottrae $\sigma_{12}^2$, il quadrato della covarianza, non $\sigma_{12}$. Il fattore è $1 - \rho^2$, non $1 - \rho$: il segno della correlazione non conta.`,
    importance: 3,
    blanks: [{
      masked: md`|\Sigma|=\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2}=\sigma_1^{2}\sigma_2^{2}\boxed{\;?\;}`,
      answer: md`(1-\rho^{2})`,
      distractors: [md`(1-\rho)`, md`(1+\rho^{2})`, md`\rho^{2}`],
    }],
    source: [{ doc: 'part1', page: 23 }, { doc: 'part1', page: 24 }, { doc: 'ch2', page: 27 }],
  },

  // --- c70 Caso n = 1: media e varianza ML e varianza corretta -----------------------------------------------
  {
    id: 'f-c70',
    name: 'Caso n = 1: media e varianza ML',
    nameEn: 'Univariate case: ML sample mean and ML sample variance',
    latex: md`\hat{m}=\frac{1}{N}\sum_{k=1}^{N}x_k,\qquad \hat{\sigma}^{2}=\frac{1}{N}\sum_{k=1}^{N}(x_k-\hat{m})^{2}=\frac{1}{N}\sum_{k=1}^{N}x_k^{2}-\hat{m}^{2}`,
    explain: md`La slide 31 specializzata a una sola feature ($n = 1$: $x_k$ scalari, $\Sigma = \sigma^2$). La media ML è la media aritmetica; la varianza ML è la media degli scarti quadratici dalla media stimata, con fattore $1/N$, uguale alla media dei quadrati meno il quadrato della media. Si ottengono annullando le due derivate della log-verosimiglianza: $\frac{\partial \ln p}{\partial m} = \frac{1}{\sigma^2}\sum_k(x_k - m) = 0$ e $\frac{\partial \ln p}{\partial \sigma^2} = -\frac{N}{2\sigma^2} + \frac{1}{2\sigma^4}\sum_k(x_k - m)^2 = 0$. Esempio: luminosità di tre salmoni $2, 4, 6$; $\hat{m} = 4$ e $\hat{\sigma}^2 = (4 + 0 + 4)/3 \approx 2.67$, che con la seconda forma diventa $(4 + 16 + 36)/3 - 16 \approx 2.67$. Passaggi in [«stima ML di media e varianza di una gaussiana 1-D»](#derivation:der08).`,
    symbols: [
      { s: md`\hat{m}`, meaning: md`media campionaria (stima ML della media)` },
      { s: md`\hat{\sigma}^{2}`, meaning: md`stima ML della varianza (fattore $1/N$)` },
      { s: md`x_k`, meaning: md`$k$-esimo campione (uno scalare)` },
    ],
    whenToUse: md`È la risposta alla domanda d'esame «develop the first derivative for a gaussian and explain the meaning of the result»: la media stimata bilancia gli scarti, la varianza stimata è lo scarto quadratico medio.`,
    pitfalls: md`Nella varianza ML gli scarti sono presi da $\hat{m}$, non dalla media vera, e il fattore è $1/N$. Nella seconda forma si sottrae $\hat{m}^2$, non $\hat{m}$.`,
    importance: 3,
    blanks: [{
      masked: md`\hat{m}=\frac{1}{N}\sum_{k=1}^{N}x_k,\qquad \hat{\sigma}^{2}=\frac{1}{N}\sum_{k=1}^{N}(x_k-\hat{m})^{2}=\frac{1}{N}\sum_{k=1}^{N}x_k^{2}-\boxed{\;?\;}`,
      answer: md`\hat{m}^{2}`,
      distractors: [md`\hat{m}`, md`2\hat{m}^{2}`, md`\frac{1}{N}\hat{m}^{2}`],
    }],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }],
  },
  {
    id: 'f-c70-2',
    name: 'Caso n = 1: bias della varianza ML e varianza corretta',
    nameEn: 'Univariate case: bias of the ML variance and unbiased sample variance',
    latex: md`E\{\hat{\sigma}^{2}\}=\frac{N-1}{N}\sigma^{2},\qquad s^{2}=\frac{1}{N-1}\sum_{k=1}^{N}(x_k-\hat{m})^{2},\qquad E\{s^{2}\}=\sigma^{2}`,
    explain: md`Il valore atteso della varianza ML è $\frac{N-1}{N}\sigma^2$: sottostima, come la covarianza ML in più dimensioni. Dividendo per $N - 1$ invece che per $N$ ottieni la varianza campionaria corretta $s^2$, non distorta. Con i tre salmoni di luminosità $2, 4, 6$: $\hat{\sigma}^2 = 8/3 \approx 2.67$ e $s^2 = 8/2 = 4$. È il caso scalare della slide 31.`,
    symbols: [
      { s: md`s^{2}`, meaning: md`varianza campionaria corretta, con fattore $1/(N-1)$ (notazione introdotta qui)` },
      { s: md`\sigma^{2}`, meaning: md`varianza vera` },
      { s: md`E\{\hat{\sigma}^{2}\}`, meaning: md`valore atteso della varianza ML su tutti i training set di $N$ campioni` },
    ],
    whenToUse: md`Per la domanda «Is Maximum Likelihood Estimation a good estimator?» in una dimensione: la media ML è non distorta, la varianza ML no.`,
    pitfalls: md`$s^2$ è non distorta ma non è la stima ML: non confonderle quando ti chiedono la derivata della log-verosimiglianza, che porta al fattore $1/N$.`,
    importance: 3,
    blanks: [
      {
        masked: md`E\{\hat{\sigma}^{2}\}=\frac{N-1}{N}\sigma^{2},\qquad s^{2}=\boxed{\;?\;}\sum_{k=1}^{N}(x_k-\hat{m})^{2},\qquad E\{s^{2}\}=\sigma^{2}`,
        answer: md`\frac{1}{N-1}`,
        distractors: [md`\frac{1}{N}`, md`\frac{N}{N-1}`, md`\frac{1}{N+1}`],
      },
      {
        masked: md`E\{\hat{\sigma}^{2}\}=\boxed{\;?\;},\qquad s^{2}=\frac{1}{N-1}\sum_{k=1}^{N}(x_k-\hat{m})^{2},\qquad E\{s^{2}\}=\sigma^{2}`,
        answer: md`\frac{N-1}{N}\sigma^{2}`,
        distractors: [md`\sigma^{2}`, md`\frac{N}{N-1}\sigma^{2}`, md`\frac{\sigma^{2}}{N}`],
      },
    ],
    source: [{ doc: 'ch2', page: 31 }, { doc: 'part1', page: 26 }],
  },

  // --- c71 Indipendenza e covarianza nulla -------------------------------------------------------------------
  {
    id: 'f-c71',
    name: 'Indipendenza implica covarianza nulla',
    nameEn: 'Independent features have zero covariance',
    latex: md`x_i,x_j\ \text{indipendenti}\ \Rightarrow\ \sigma_{ij}=E\{x_i-m_i\}\,E\{x_j-m_j\}=0`,
    explain: md`Integrazione che chiarisce la logica della slide 27. Se $x_i$ e $x_j$ sono indipendenti, la loro densità congiunta è il prodotto delle marginali; allora il valore atteso del prodotto degli scarti si spezza nel prodotto dei due valori attesi, e ciascuno è la media di uno scarto dalla propria media, cioè zero. Questa direzione vale per qualunque distribuzione, gaussiana o no. Passaggi in [«feature indipendenti ⟹ covarianze nulle; il viceversa solo per la gaussiana»](#derivation:der18).`,
    symbols: [
      { s: md`\sigma_{ij}`, meaning: md`covarianza tra le feature $i$ e $j$ (elemento fuori diagonale di $\Sigma$)` },
      { s: md`E\{x_i-m_i\}`, meaning: md`media dello scarto dalla media: vale sempre zero` },
    ],
    whenToUse: md`Per giustificare la freccia della slide 27: feature indipendenti $\Rightarrow$ $\Sigma$ diagonale.`,
    pitfalls: md`La fattorizzazione $E\{(x_i-m_i)(x_j-m_j)\} = E\{x_i-m_i\}\,E\{x_j-m_j\}$ vale per variabili indipendenti: non è una regola generale del valore atteso.`,
    importance: 2,
    blanks: [{
      masked: md`x_i,x_j\ \text{indipendenti}\ \Rightarrow\ \sigma_{ij}=\boxed{\;?\;}=0`,
      answer: md`E\{x_i-m_i\}\,E\{x_j-m_j\}`,
      distractors: [md`E\{x_i\}\,E\{x_j\}`, md`\sigma_i\sigma_j`, md`E\{(x_i-m_i)^{2}\}`],
    }],
    source: [{ doc: 'ch2', page: 27 }, { doc: 'part1', page: 24 }],
  },
  {
    id: 'f-c71-2',
    name: 'Nel modello gaussiano covarianza nulla implica indipendenza',
    nameEn: 'For jointly Gaussian features zero covariance implies independence',
    latex: md`\mathbf{x}\sim N(\mathbf{m},\Sigma),\ \sigma_{ij}=0\ \Rightarrow\ x_i,x_j\ \text{indipendenti}`,
    explain: md`Il viceversa vale nel modello gaussiano. Se $\mathbf{x}$ è congiuntamente gaussiano e $\sigma_{ij} = 0$, la coppia $(x_i, x_j)$ ha una gaussiana bivariata con covarianza diagonale, e la sua pdf si fattorizza nel prodotto delle due marginali ([«con Σ diagonale la gaussiana multivariata si fattorizza»](#derivation:der06)). Nella gaussiana quindi «$\Sigma$ diagonale», «feature incorrelate» e «feature indipendenti» sono la stessa cosa: per questo la slide 30 può dedurre l'indipendenza di $x_1$ e $x_3$ dalla sola forma di un'ombra ellittica.`,
    symbols: [
      { s: md`N(\mathbf{m},\Sigma)`, meaning: md`gaussiana multivariata con media $\mathbf{m}$ e covarianza $\Sigma$` },
      { s: md`\sim`, meaning: md`«è distribuito come»` },
    ],
    whenToUse: md`Nel commento alla slide 30 e ogni volta che usi l'indipendenza in un modello gaussiano (naive Bayes, $\Sigma$ diagonale).`,
    pitfalls: md`Serve che il vettore sia congiuntamente gaussiano: due variabili ciascuna gaussiana, ma non congiuntamente gaussiane, possono essere incorrelate e dipendenti (fatto noto, fuori dalle slide). È un'indipendenza a coppie, non condizionata alle altre feature.`,
    importance: 2,
    blanks: [{
      masked: md`\mathbf{x}\sim N(\mathbf{m},\Sigma),\ \boxed{\;?\;}\ \Rightarrow\ x_i,x_j\ \text{indipendenti}`,
      answer: md`\sigma_{ij}=0`,
      distractors: [md`\sigma_{ij}=1`, md`\sigma_i=\sigma_j`, md`m_i=m_j`],
    }],
    source: [{ doc: 'ch2', page: 27 }, { doc: 'ch2', page: 30 }, { doc: 'part1', page: 24 }],
  },
  {
    id: 'f-c71-3',
    name: 'Controesempio: incorrelate ma dipendenti',
    nameEn: 'Counterexample: uncorrelated but dependent',
    latex: md`x\sim N(0,1),\ y=x^{2}:\quad \sigma_{xy}=E\{x^{3}\}-E\{x\}E\{x^{2}\}=0`,
    explain: md`Fuori dal modello gaussiano il viceversa è falso. Prendi $x$ gaussiana standard e $y = x^2$: $y$ è una funzione di $x$, quindi le due variabili sono dipendenti nel modo più forte possibile. Eppure la covarianza è $E\{xy\} - E\{x\}E\{y\} = E\{x^3\} - 0\cdot 1 = 0$, perché i momenti dispari di una gaussiana a media nulla sono zero. La coppia $(x, y)$ non è congiuntamente gaussiana ($y \ge 0$ sempre), e la fattorizzazione non vale.`,
    symbols: [
      { s: md`\sigma_{xy}`, meaning: md`covarianza tra $x$ e $y$` },
      { s: md`E\{x^{3}\}`, meaning: md`momento del terzo ordine: zero per una distribuzione simmetrica attorno a 0` },
      { s: md`N(0,1)`, meaning: md`gaussiana standard: media 0, varianza 1` },
    ],
    whenToUse: md`Quando ti chiedono se covarianza nulla implica indipendenza: rispondi «solo per la gaussiana» e porta questo esempio.`,
    pitfalls: md`Covarianza zero vuol dire solo assenza di dipendenza lineare: qui la dipendenza è quadratica e la covarianza non la vede.`,
    importance: 2,
    blanks: [{
      masked: md`x\sim N(0,1),\ y=x^{2}:\quad \sigma_{xy}=\boxed{\;?\;}-E\{x\}E\{x^{2}\}=0`,
      answer: md`E\{x^{3}\}`,
      distractors: [md`E\{x^{2}\}`, md`E\{x^{4}\}`],
    }],
    source: [{ doc: 'ch2', page: 27 }, { doc: 'ch2', page: 30 }, { doc: 'part1', page: 24 }],
  },
]
