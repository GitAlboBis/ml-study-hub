// Modulo m06: modelli di pdf e modello gaussiano (univariato e multivariato). Fonti: ch2 p22-31 e note part1 p21-26
// (la teoria richiama anche ch2 p19-21 e part1 p19-20, pagine condivise con i moduli sulla stima ML e sulla bontà
// degli stimatori). Questo file unisce i pezzi scritti a parte (formule, derivazioni, figure, pratica) e dichiara la
// copertura: ogni concetto dell'inventario (docs/inventory/m06-modelli-pdf-gaussiana.json) punta ai posti del foglio
// che lo spiegano. La copertura è generata da theory-map.json (sezioni, esempi, formule, check), dagli id delle
// formule f-<concetto>, dai campi concepts dell'inventario (derivazioni, widget, esempi, figure mostrate nel MDX,
// esercizi), dai campi concepts dei quiz, dai concetti delle domande della banca e da una mappa scritta a mano per
// le sette domande d'orale proprie; poi è stata scritta qui come letterale.
//
// Formule dell'inventario (npx tsx scripts/formula-coverage.ts m06-modelli-pdf-gaussiana): 194/195 ritrovate alla lettera.
// L'unica non ritrovata è il passo 6 della derivazione der18, che nell'inventario termina con l'etichetta interna
// \text{(der06)}: in derivations-b.ts il passo è identico senza l'etichetta, e il rimando a der06 sta nel suo "perché"
// come link [«con Σ diagonale la gaussiana multivariata si fattorizza»](#derivation:der06). Controllato a mano: presente.
//
// Ritocchi dell'integrazione per il telefono (390 px), senza togliere contenuto: nella didascalia di fig08 un
// \allowbreak tra la costante e l'esponenziale lascia andare a capo la formula in linea; nell'esercizio es10 la
// gaussiana generalizzata e la sua varianza sono passate da una formula in display (più larga dello schermo) a due
// formule in linea nella stessa frase.
import { defineModule, md } from '../../types'
import { checks } from './checks'
import { derivationsA } from './derivations-a'
import { derivationsB } from './derivations-b'
import { exam } from './exam'
import { exercises } from './exercises'
import { figures } from './figures'
import { flashcards } from './flashcards'
import { formulasA } from './formulas-a'
import { formulasB } from './formulas-b'
import { glossary } from './glossary'
import { quiz } from './quiz'

export default defineModule({
  id: 'm06-modelli-pdf-gaussiana',
  title: 'Modelli di PDF e modello gaussiano',
  titleEn: 'PDF examples and the Gaussian model (univariate/multivariate)',
  course: 'melgani',
  chapter: 'Cap. 2 · Statistical Estimation Theory',
  order: 6,
  sources: [
    { doc: 'ch2', pages: [22, 31] },
    { doc: 'part1', pages: [21, 26] },
  ],
  prerequisites: ['m03-stima-intro-parametrica', 'm04-bonta-stimatori', 'm05-max-likelihood'],
  // teoria lunga (75 titoli, 19 derivazioni, 8 esempi svolti, 87 formule) più 24 widget e la pratica
  estimatedMinutes: 200,
  summary: md`La stima parametrica presuppone la forma di $p(\mathbf{x}|\boldsymbol{\theta})$, e la slide 20 la fa scegliere guardando tre aspetti: la natura statistica del fenomeno, il rumore di trasmissione e di acquisizione introdotto dal mezzo di propagazione e dal sensore, il pre-processing con l'estrazione delle feature; la scelta non è banale (*model selection is not a trivial task*). Le slide 22-24 (*PDF examples*) danno sei famiglie con formula e grafico: gaussiana, gaussiana generalizzata $f(x;m,b,\beta)=\frac{b\beta}{2\Gamma(1/\beta)}\,e^{-\left[b|x-m|\right]^{\beta}}$ (con $\beta=2$ la gaussiana, con $\beta=1$ la laplaciana, con $\beta$ grande quasi uniforme), Gamma, Rayleigh, chi-quadro (una Gamma con forma $k/2$ e scala 2) e log-normale, che si distinguono per supporto, simmetria e numero di parametri. Il modello gaussiano è usatissimo per il teorema del limite centrale: se la somma di molte variabili iid ha varianza finita, è approssimativamente normale, e molti processi reali nascono da tante cause indipendenti. In $n$ dimensioni la pdf è $p(\mathbf{x}|\mathbf{m},\Sigma)=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]$, indicata con $N(\mathbf{m},\Sigma)$, e la forma quadratica all'esponente è il quadrato della distanza di Mahalanobis dalla media. Due parametri la definiscono per intero: il vettore media $\mathbf{m}=E\{\mathbf{x}\}$ e la matrice di covarianza $\Sigma=E\left\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\right\}=E\left\{\mathbf{x}\mathbf{x}^{t}\right\}-\mathbf{m}\mathbf{m}^{t}$, con le varianze sulla diagonale e le covarianze fuori, simmetrica, semidefinita positiva e diagonale per feature indipendenti, nel qual caso $p(\mathbf{x})=p(x_1)\,p(x_2)\dots p(x_n)$. La campana ha volume unitario e i suoi isolivelli sono ellissi (iperellissi in $n$-D) a distanza di Mahalanobis costante, con gli assi lungo gli autovettori di $\Sigma$ ($\Sigma\,\mathbf{e}_i=\lambda_i\,\mathbf{e}_i$), semiassi $r\sqrt{\lambda_i}$ e asse principale lungo l'autovettore del massimo autovalore; gli autovettori formano una base ortogonale e per convenzione $\lambda_1\ge\lambda_2\ge\dots\ge\lambda_n$. Nell'esempio 3-D della slide 30 l'ombra non inclinata sulla parete $(x_1, x_3)$ dice che $x_1$ e $x_3$ sono indipendenti: per una gaussiana covarianza nulla e indipendenza coincidono. Da $N$ campioni iid la stima ML dà $\hat{\mathbf{m}}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k$ e $\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}$, stime asintoticamente non distorte, efficienti e consistenti. $E\{\hat{\mathbf{m}}\}=\mathbf{m}$ per ogni $N$, mentre $E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$: lo stimatore non distorto elementare divide per $N-1$, cioè moltiplica la stima ML per $N/(N-1)$, e la correzione conta soprattutto con pochi campioni. In fondo alle note la stima bayesiana tratta $\boldsymbol{\theta}$ come variabile aleatoria con una prior aggiornata in posterior, invece che come quantità fissa ma incognita come fa la ML.`,
  keyPoints: [
    md`Tre aspetti per scegliere il modello di $p(\mathbf{x})$: natura statistica del fenomeno, rumore introdotto rispettivamente dal mezzo di propagazione (trasmissione) e dal sensore (acquisizione), pre-processing ed estrazione delle feature. La ML sceglie i parametri, non la famiglia.`,
    md`Sei famiglie: gaussiana e gaussiana generalizzata su tutto l'asse e simmetriche; Gamma, Rayleigh, chi-quadro e log-normale su $x \ge 0$ o $x > 0$, con la coda a destra. Il chi-quadro con $k$ gradi di libertà è una Gamma con forma $k/2$ e scala 2.`,
    md`Gaussiana generalizzata: $\beta = 2$ gaussiana, $\beta = 1$ laplaciana, $\beta \to \infty$ uniforme su $[m - 1/b,\ m + 1/b]$. Rayleigh: moda in $x = \sigma$ e picco $1/(\sigma\sqrt{e})$. Log-normale: $\ln x$ è gaussiano con parametri $\mu$ e $\sigma$, mediana $e^{\mu}$, moda $e^{\mu - \sigma^2}$.`,
    md`Limite centrale: la somma di molte variabili iid con varianza finita è approssimativamente normale; in forma rigorosa $\frac{S_n - n\mu}{\sigma\sqrt{n}} \to N(0,1)$. Servono molte variabili, iid e varianza finita (Cauchy è il controesempio).`,
    md`Formula da scrivere all'orale: $p(\mathbf{x}|\mathbf{m},\Sigma)=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]$, con $\mathbf{x}$ e $\mathbf{m}$ vettori $n \times 1$ e $\Sigma$ matrice $n \times n$. Con $n = 1$ ritrovi $\frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}$.`,
    md`L'esponente contiene il quadrato della distanza di Mahalanobis $d_M(\mathbf{x},\mathbf{m})=\sqrt{(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})}$: misura la distanza in deviazioni standard tenendo conto delle correlazioni e con $\Sigma = I$ diventa l'euclidea.`,
    md`$\mathbf{m}=E\{\mathbf{x}\}$ e $\Sigma=E\left\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\right\}=E\left\{\mathbf{x}\mathbf{x}^{t}\right\}-\mathbf{m}\mathbf{m}^{t}$: varianze $\sigma_i^2$ sulla diagonale, covarianze $\sigma_{ij}$ fuori. In 2-D $\sigma_{12} = \rho\,\sigma_1\sigma_2$ con $-1 \le \rho \le 1$ e $|\Sigma| = \sigma_1^2\sigma_2^2(1-\rho^2)$. I parametri da stimare sono $n + n(n+1)/2$.`,
    md`Proprietà di $\Sigma$: simmetrica, $\Sigma = \Sigma^{t}$; semidefinita positiva, perché $\mathbf{a}^{t}\Sigma\,\mathbf{a} = var\{\mathbf{a}^{t}\mathbf{x}\} \ge 0$, cioè autovalori non negativi. Perché la pdf esista serve $\Sigma$ definita positiva, con $|\Sigma| > 0$.`,
    md`Feature indipendenti: $\Sigma$ diagonale e $p(\mathbf{x}) = \prod_{i=1}^{n} \frac{1}{\sigma_i\sqrt{2\pi}}\exp\left[-\frac{(x_i-m_i)^2}{2\sigma_i^2}\right]$. L'indipendenza implica sempre covarianza nulla; il viceversa vale solo per la gaussiana (controesempio $y = x^2$).`,
    md`Forma 2-D: campana di volume unitario; isolivelli ellissi $(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m}) = r^2$ con gli assi lungo gli autovettori, soluzioni di $\det(\Sigma - \lambda I) = 0$, e semiassi $r\sqrt{\lambda_i}$. L'autovettore del massimo autovalore è l'asse principale, la direzione di massima varianza.`,
    md`Forma $n$-D: $\lambda_1 \ge \lambda_2 \ge \dots \ge \lambda_n$, autovalori positivi (a rigore non negativi), autovettori in base ortogonale con $\Sigma = U\Lambda U^{t}$, isolivelli iperellissi; il primo autovettore dà l'asse principale, l'ultimo l'asse più piccolo.`,
    md`Figura della slide 28: $z = 3$ è il picco, cioè il punto $\mathbf{m}$; le tre ellissi sono $z = 2$, $0.5$, $0.01$. Slide 30: $x_1$ e $x_3$ sono indipendenti perché $\sigma_{13} = 0$; è indipendenza marginale, non condizionata a $x_2$.`,
    md`Stime ML da $N$ campioni iid: $\hat{\mathbf{m}}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k$ e $\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t}-\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}$. Il rango di $\hat{\Sigma}$ non supera $N - 1$: servono almeno $n + 1$ campioni per invertirla.`,
    md`Derivata prima in 1-D (domanda d'esame): $\frac{\partial \ln L}{\partial m} = \frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k - m) = 0$ dà la media campionaria, il punto in cui gli scarti si bilanciano; la derivata seconda $-N/\sigma^2$ conferma il massimo.`,
    md`Bias: $E\{\hat{\mathbf{m}}\}=\mathbf{m}$, mentre $E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$; lo stimatore corretto è $\frac{N}{N-1}\hat{\Sigma}_{ML}$, con $\frac{1}{N-1}$ davanti alla somma. Le stime ML sono asintoticamente non distorte, efficienti e consistenti. Per la ML $\boldsymbol{\theta}$ è fisso ma incognito; per Bayes è una variabile aleatoria, con una prior che diventa posterior.`,
  ],
  glossary,
  formulas: [...formulasA, ...formulasB],
  // der18, passo 6: formula dell'inventario senza l'etichetta \text{(der06)}, sostituita da un link nel perché (vedi in cima)
  derivations: [...derivationsA, ...derivationsB],
  figures,
  flashcards,
  // i check dentro il testo (<Check id="chk-…">) stanno in data.quiz come gli altri quiz
  quiz: [...checks, ...quiz],
  exam,
  exercises,
  widgets: [
    { id: 'm06-catena-acquisizione-modello', title: 'Dalla scena al modello: chi decide la forma di p(x)?', concepts: ['c02', 'c03', 'c04', 'c05'] },
    { id: 'm06-indovina-il-modello', title: 'Indovina il modello: sei istogrammi, sei famiglie', concepts: ['c06', 'c07', 'c21'] },
    { id: 'm06-gaussiana-mu-sigma', title: 'La campana del salmone: μ sposta, σ² allarga', concepts: ['c08', 'c09'] },
    { id: 'm06-gaussiana-generalizzata-beta', title: 'β: da Laplace alla gaussiana fino al rettangolo', concepts: ['c10', 'c11', 'c12'] },
    { id: 'm06-gamma-attesa-k-eventi', title: 'Gamma: aspettando il k-esimo evento', concepts: ['c13', 'c14'] },
    { id: 'm06-rayleigh-eco-radar', title: "Rayleigh: l'ampiezza di un'eco radar", concepts: ['c15', 'c16'] },
    { id: 'm06-chi-quadro-somma-quadrati', title: 'Chi-quadro: sommare k quadrati di gaussiane', concepts: ['c17', 'c18'] },
    { id: 'm06-log-normale-prezzi-case', title: 'Log-normale: quando è il logaritmo a essere gaussiano', concepts: ['c19', 'c20'] },
    { id: 'm06-limite-centrale-somma-cause', title: 'Teorema del limite centrale: molte cause, una campana', concepts: ['c22', 'c23', 'c24', 'c25'] },
    { id: 'm06-formula-viva-bivariata', title: 'La formula viva della gaussiana multivariata', concepts: ['c26', 'c27', 'c28', 'c33'] },
    { id: 'm06-volume-unitario', title: 'Una campana di volume 1', concepts: ['c31', 'c32', 'c42', 'c69'] },
    { id: 'm06-mahalanobis-contro-euclidea', title: 'Distanza di Mahalanobis contro distanza euclidea', concepts: ['c29', 'c30'] },
    { id: 'm06-costruisci-la-covarianza', title: 'Costruisci Σ un campione alla volta', concepts: ['c34', 'c35', 'c36', 'c37', 'c69'] },
    { id: 'm06-varianza-proiezione-psd', title: 'Simmetrica e semidefinita positiva: nessuna direzione ha varianza negativa', concepts: ['c38', 'c39', 'c50'] },
    { id: 'm06-feature-indipendenti-prodotto', title: 'Feature indipendenti: la congiunta è il prodotto', concepts: ['c40', 'c41', 'c71'] },
    { id: 'm06-affetta-la-campana', title: 'Affetta la campana: gli isolivelli sono ellissi', concepts: ['c43', 'c47'] },
    { id: 'm06-autovettori-assi-ellisse', title: "Autovalori e autovettori: gli assi dell'ellisse", concepts: ['c44', 'c45', 'c46'] },
    { id: 'm06-spettro-autovalori-nd', title: 'n dimensioni: spettro degli autovalori e base ortogonale', concepts: ['c48', 'c49', 'c51'] },
    { id: 'm06-nuvola-3d-proiezioni', title: 'Gaussiana 3-D: nuvola, ellissoide e ombre sui muri', concepts: ['c52', 'c53', 'c54', 'c55'] },
    { id: 'm06-stima-ml-campione-per-campione', title: 'Stima ML della gaussiana, un pesce alla volta', concepts: ['c56', 'c57', 'c58', 'c59'] },
    { id: 'm06-derivata-log-verosimiglianza', title: 'La derivata che si annulla: perché la stima ML è la media', concepts: ['c57', 'c70'] },
    { id: 'm06-bias-covarianza-ml', title: '1/N o 1/(N-1)? Il bias della varianza ML', concepts: ['c61', 'c62', 'c63', 'c64', 'c70'] },
    { id: 'm06-proprieta-asintotiche-stime', title: 'Asintoticamente non distorte, efficienti, consistenti', concepts: ['c01', 'c60'] },
    { id: 'm06-theta-fisso-o-aleatorio', title: 'θ fisso o θ aleatorio? Anteprima della stima bayesiana', concepts: ['c65', 'c66', 'c67', 'c68'] },
  ],
  connections: [
    { to: 'm03-stima-intro-parametrica', why: md`La stima parametrica presuppone la forma di $p(\mathbf{x}|\boldsymbol{\theta})$: qui trovi il catalogo delle forme (sei famiglie di pdf) e il caso gaussiano, con i criteri per scegliere il modello.` },
    { to: 'm04-bonta-stimatori', why: md`Bias, efficienza, bound di Cramér-Rao e proprietà asintotiche sono definiti lì; qui li applichi a $\hat{\mathbf{m}}$ e $\hat{\Sigma}$: la media campionaria è non distorta ed efficiente, la covarianza ML ha bias $\frac{N-1}{N}$ e si corregge con $\frac{N}{N-1}$.` },
    { to: 'm05-max-likelihood', why: md`La pagina 21 delle note è condivisa: proprietà asintotiche della ML e selezione del modello statistico (slide 19-21). Le stime di $\mathbf{m}$ e $\Sigma$ di questo foglio sono la ML applicata al modello gaussiano, con la derivata prima della log-verosimiglianza annullata.` },
    { to: 'm07-stima-bayesiana', why: md`La pagina 26 delle note è condivisa: $\boldsymbol{\theta}$ fisso ma incognito per la ML, variabile aleatoria con prior e posterior per Bayes. Nel foglio successivo stimi la media di una gaussiana con una prior gaussiana.` },
    { to: 'm09-parzen-windows', why: md`Il kernel più usato è gaussiano: la simmetria sferica corrisponde a $\Sigma = h^2 I$, caso particolare di covarianza diagonale con isolivelli circolari.` },
    { to: 'm10-em-dati-incompleti', why: md`Nella mistura di gaussiane il passo M usa versioni pesate delle stime ML $\hat{\mathbf{m}}$ e $\hat{\Sigma}$ di questo foglio; con pesi 0 e 1 ritrovi le formule della slide 31.` },
    { to: 'm11-hughes-feature-selection', why: md`I parametri della gaussiana sono $n + n(n+1)/2$ e crescono con il quadrato delle feature: con pochi campioni $\hat{\Sigma}$ è inaffidabile o singolare (rango al più $N - 1$), una delle cause dell'effetto Hughes.` },
    { to: 'm12-misure-separabilita', why: md`Divergenza, Bhattacharyya e Jeffries-Matusita hanno forma chiusa per classi gaussiane e usano $\mathbf{m}$, $\Sigma$, il determinante e l'inversa della covarianza.` },
    { to: 'm14-pca', why: md`La PCA è la decomposizione in autovalori e autovettori della matrice di covarianza: asse principale, ordinamento $\lambda_1 \ge \dots \ge \lambda_n$ e base ortogonale sono gli stessi concetti delle slide 28-29.` },
    { to: 'm15-lda', why: md`Le matrici di scatter sono covarianze non normalizzate e ne condividono le proprietà: simmetria, semidefinitezza positiva, autovettori ortogonali.` },
    { to: 'm16-mdm-box', why: md`La distanza dalla media del classificatore a minima distanza (MDM) è il caso euclideo, con $\Sigma = I$, della distanza di Mahalanobis.` },
    { to: 'm19-funzioni-discriminanti', why: md`Le funzioni discriminanti dei casi gaussiani 1, 2 e 3 nascono dal logaritmo della pdf multivariata: forma quadratica, determinante di $\Sigma$, covarianze diagonali o uguali tra le classi.` },
    { to: 'p01-stima-parametri', why: md`Passerini riprende la stima ML e bayesiana dei parametri di una gaussiana, con statistiche sufficienti e prior coniugati: la posterior della media resta gaussiana.` },
    { to: 'p12-clustering', why: md`I *Gaussian Mixture Model* usano la pdf gaussiana multivariata e le stime di media e covarianza per ogni cluster.` },
  ],
  coverage: {
    c01: ['#il-punto-di-partenza-le-proprietà-asintotiche-della-stima-ml', '#le-proprietà-delle-stime', 'formula:f-c01', 'formula:f-c01-2', 'formula:f-c01-3', 'derivation:der19', 'widget:m06-proprieta-asintotiche-stime', 'quiz:chk-01', 'quiz:q-proprieta-asintotiche-ml', 'exam:or-banca-4', 'exam:or-stima-ml-gaussiana', 'exercise:es17', 'exercise:es21'],
    c02: ['#la-scelta-del-modello-statistico', 'formula:f-c02', 'widget:m06-catena-acquisizione-modello', 'quiz:chk-02', 'quiz:q-tre-aspetti-selezione', 'exam:or-scelta-modello', 'exercise:es09'],
    c03: ['#primo-aspetto-la-natura-statistica-del-fenomeno', 'widget:m06-catena-acquisizione-modello', 'quiz:chk-02', 'quiz:q-preprocessing-radar', 'quiz:q-tre-aspetti-selezione', 'exam:or-scelta-modello', 'exercise:es09'],
    c04: ['#secondo-aspetto-il-rumore-di-trasmissione-e-di-acquisizione', 'widget:m06-catena-acquisizione-modello', 'quiz:chk-02', 'quiz:q-rumore-mezzo-sensore', 'quiz:q-tre-aspetti-selezione', 'exam:or-scelta-modello', 'exercise:es09'],
    c05: ['#terzo-aspetto-pre-processing-ed-estrazione-delle-feature', 'widget:m06-catena-acquisizione-modello', 'quiz:chk-02', 'quiz:q-preprocessing-radar', 'quiz:q-tre-aspetti-selezione', 'exam:or-scelta-modello', 'exercise:es09'],
    c06: ['#i-modelli-statistici-più-diffusi', 'widget:m06-indovina-il-modello', 'figure:fig07', 'quiz:chk-07', 'quiz:q-sei-modelli', 'quiz:q-uso-gamma', 'exam:or-scelta-modello', 'exercise:es09'],
    c07: ['#scegliere-il-modello-non-è-banale', 'widget:m06-indovina-il-modello', 'quiz:q-selezione-non-banale', 'exam:or-scelta-modello', 'exercise:es09'],
    c08: ['#la-gaussiana', 'example:ex01', 'formula:f-c08', 'derivation:der01', 'widget:m06-gaussiana-mu-sigma', 'figure:fig01', 'quiz:chk-03', 'quiz:q-picco-gaussiana-salmone', 'exam:or-banca-7', 'exam:or-scelta-modello', 'exercise:es01'],
    c09: ['#la-gaussiana', 'example:ex01', 'formula:f-c09', 'widget:m06-gaussiana-mu-sigma', 'figure:fig01', 'quiz:chk-03', 'quiz:q-effetto-varianza', 'quiz:q-picco-gaussiana-salmone', 'exercise:es01'],
    c10: ['#la-gaussiana-generalizzata', 'example:ex02', 'formula:f-c10', 'derivation:der02', 'widget:m06-gaussiana-generalizzata-beta', 'figure:fig02', 'quiz:chk-04', 'quiz:q-gg-beta-uno', 'quiz:q-tre-parametri', 'exam:or-scelta-modello', 'exercise:es10'],
    c11: ['#la-gaussiana-generalizzata', 'example:ex02', 'formula:f-c11', 'derivation:der02', 'widget:m06-gaussiana-generalizzata-beta', 'figure:fig02', 'quiz:chk-04', 'quiz:q-gg-casi-particolari', 'exercise:es10'],
    c12: ['#la-gaussiana-generalizzata', 'example:ex02', 'formula:f-c12', 'formula:f-c12-2', 'derivation:der02', 'widget:m06-gaussiana-generalizzata-beta', 'figure:fig02', 'quiz:chk-04', 'quiz:q-gg-beta-uno', 'quiz:q-gg-casi-particolari', 'exam:or-scelta-modello', 'exercise:es10'],
    c13: ['#la-gamma', 'example:ex03', 'formula:f-c13', 'derivation:der03', 'widget:m06-gamma-attesa-k-eventi', 'figure:fig03', 'quiz:chk-05', 'quiz:q-gamma-varianza', 'exam:or-scelta-modello', 'exercise:es11'],
    c14: ['#la-gamma', 'example:ex03', 'formula:f-c14', 'widget:m06-gamma-attesa-k-eventi', 'figure:fig03', 'quiz:q-gamma-varianza', 'exercise:es11'],
    c15: ['#la-rayleigh', 'example:ex04', 'formula:f-c15', 'derivation:der13', 'widget:m06-rayleigh-eco-radar', 'figure:fig04', 'quiz:q-rayleigh-picco', 'exam:or-scelta-modello', 'exercise:es11'],
    c16: ['#la-rayleigh', 'example:ex04', 'formula:f-c16', 'derivation:der13', 'widget:m06-rayleigh-eco-radar', 'figure:fig04', 'quiz:q-rayleigh-picco', 'exercise:es11'],
    c17: ['#il-chi-quadro', 'example:ex05', 'formula:f-c17', 'derivation:der03', 'widget:m06-chi-quadro-somma-quadrati', 'figure:fig05', 'quiz:chk-05', 'quiz:q-chi-quadro-gamma', 'exam:or-scelta-modello', 'exercise:es11'],
    c18: ['#il-chi-quadro', 'example:ex05', 'formula:f-c18', 'derivation:der03', 'widget:m06-chi-quadro-somma-quadrati', 'figure:fig05', 'quiz:chk-05', 'quiz:q-chi-quadro-gamma', 'quiz:q-chi-quadro-k2', 'exam:or-scelta-modello', 'exercise:es11'],
    c19: ['#la-log-normale', 'example:ex06', 'formula:f-c19', 'derivation:der14', 'widget:m06-log-normale-prezzi-case', 'figure:fig06', 'quiz:chk-06', 'quiz:q-log-normale-media', 'quiz:q-log-normale-parametri', 'exam:or-scelta-modello', 'exercise:es12'],
    c20: ['#la-log-normale', 'example:ex06', 'formula:f-c20', 'derivation:der14', 'widget:m06-log-normale-prezzi-case', 'figure:fig06', 'quiz:chk-06', 'quiz:q-log-normale-media', 'exercise:es12'],
    c21: ['#sei-modelli-a-confronto', 'widget:m06-indovina-il-modello', 'figure:fig07', 'quiz:chk-07', 'quiz:q-supporto-positivo', 'quiz:q-tre-parametri', 'exam:or-scelta-modello', 'exercise:es09'],
    c22: ['#il-modello-gaussiano-e-il-limite-centrale', '#un-modello-parametrico-usato-ovunque', 'widget:m06-limite-centrale-somma-cause', 'quiz:q-modello-parametrico', 'exam:or-limite-centrale', 'exercise:es13'],
    c23: ['#il-teorema-del-limite-centrale', 'formula:f-c23', 'formula:f-c23-2', 'widget:m06-limite-centrale-somma-cause', 'quiz:chk-08', 'quiz:q-limite-centrale-enunciato', 'quiz:q-limite-centrale-varianza', 'exam:or-limite-centrale', 'exercise:es13'],
    c24: ['#le-tre-ipotesi-del-teorema', 'formula:f-c24', 'widget:m06-limite-centrale-somma-cause', 'quiz:chk-08', 'quiz:q-limite-centrale-cauchy', 'quiz:q-limite-centrale-varianza', 'exam:or-limite-centrale', 'exercise:es13'],
    c25: ['#perché-la-gaussiana-è-ovunque', 'widget:m06-limite-centrale-somma-cause', 'quiz:chk-08', 'quiz:q-ubiquita', 'exam:or-limite-centrale', 'exercise:es13'],
    c26: ['#la-gaussiana-multivariata', '#la-formula', '#la-formula-della-gaussiana-in-più-dimensioni', 'formula:f-c26', 'derivation:der01', 'derivation:der15', 'widget:m06-formula-viva-bivariata', 'figure:fig08', 'quiz:q-costante-normalizzazione', 'exam:or-banca-1', 'exam:or-banca-5', 'exam:or-banca-6', 'exam:or-banca-7', 'exam:or-banca-10', 'exam:or-mahalanobis', 'exercise:es02'],
    c27: ['#i-simboli-e-la-notazione-compatta', 'formula:f-c27', 'widget:m06-formula-viva-bivariata', 'quiz:chk-09', 'quiz:q-dimensioni-simboli', 'exam:or-banca-1', 'exercise:es02'],
    c28: ['#i-simboli-e-la-notazione-compatta', 'formula:f-c28', 'widget:m06-formula-viva-bivariata', 'figure:fig08', 'quiz:q-notazione-normale'],
    c29: ['#la-distanza-di-mahalanobis-allesponente', 'formula:f-c29', 'formula:f-c29-2', 'widget:m06-mahalanobis-contro-euclidea', 'quiz:chk-09', 'quiz:q-mahalanobis-numerico', 'quiz:q-mahalanobis-quadrato', 'exam:or-banca-10', 'exam:or-forma-gaussiana', 'exam:or-mahalanobis', 'exercise:es02', 'exercise:es08', 'exercise:es18'],
    c30: ['#che-cosa-rappresentano-media-e-covarianza', 'widget:m06-mahalanobis-contro-euclidea', 'quiz:q-campana-diagonale', 'exam:or-mahalanobis', 'exercise:es08'],
    c31: ['#lesempio-bivariato', 'formula:f-c31', 'widget:m06-volume-unitario', 'figure:fig08', 'figure:fig09', 'quiz:q-campana-diagonale'],
    c32: ['#la-costante-di-normalizzazione-e-il-determinante', 'formula:f-c32', 'formula:f-c32-2', 'formula:f-c32-3', 'formula:f-c32-4', 'derivation:der01', 'derivation:der15', 'widget:m06-volume-unitario', 'quiz:chk-11', 'quiz:q-costante-normalizzazione', 'quiz:q-picco-bivariata', 'exercise:es02', 'exercise:es18', 'exercise:es19'],
    c33: ['#due-parametri-definiscono-tutto', 'formula:f-c33', 'widget:m06-formula-viva-bivariata', 'quiz:chk-10', 'quiz:q-numero-parametri'],
    c34: ['#il-vettore-media', 'formula:f-c34', 'widget:m06-costruisci-la-covarianza', 'quiz:q-covarianza-forma', 'exam:or-banca-1', 'exam:or-covarianza'],
    c35: ['#la-matrice-di-covarianza', '#matrice-di-covarianza-e-autovettori-nella-pca', 'formula:f-c35', 'derivation:der04', 'widget:m06-costruisci-la-covarianza', 'quiz:q-covarianza-forma', 'quiz:q-varianza-dai-momenti', 'exam:or-banca-1', 'exam:or-banca-2', 'exam:or-covarianza'],
    c36: ['#la-matrice-di-covarianza', 'formula:f-c36', 'derivation:der04', 'widget:m06-costruisci-la-covarianza', 'quiz:q-covarianza-forma', 'quiz:q-varianza-dai-momenti', 'exam:or-banca-2', 'exam:or-covarianza', 'exercise:es06'],
    c37: ['#varianze-sulla-diagonale-covarianze-fuori', 'formula:f-c37', 'formula:f-c37-2', 'widget:m06-costruisci-la-covarianza', 'quiz:chk-11', 'quiz:q-leggere-covarianza', 'exam:or-banca-2', 'exam:or-covarianza', 'exercise:es19'],
    c38: ['#prima-proprietà-la-simmetria', 'formula:f-c38', 'derivation:der05', 'derivation:der16', 'widget:m06-varianza-proiezione-psd', 'quiz:chk-10', 'quiz:chk-12', 'quiz:q-matrici-valide', 'quiz:q-numero-parametri', 'quiz:q-simmetria', 'exam:or-banca-2', 'exam:or-covarianza', 'exercise:es06'],
    c39: ['#seconda-proprietà-semidefinita-positiva', 'formula:f-c39', 'formula:f-c39-2', 'derivation:der05', 'derivation:der17', 'widget:m06-varianza-proiezione-psd', 'quiz:chk-12', 'quiz:q-matrici-valide', 'quiz:q-semidefinita-significato', 'exam:or-banca-2', 'exam:or-covarianza', 'exercise:es06', 'exercise:es20'],
    c40: ['#feature-indipendenti-la-matrice-diagonale', '#il-kernel-gaussiano-di-parzen', 'example:ex08', 'formula:f-c40', 'derivation:der06', 'derivation:der18', 'widget:m06-feature-indipendenti-prodotto', 'figure:fig10', 'quiz:chk-13', 'quiz:q-covarianza-nulla-indipendenza', 'quiz:q-fattorizzazione', 'exam:or-banca-6', 'exam:or-covarianza', 'exam:or-indipendenza', 'exercise:es07'],
    c41: ['#la-pdf-congiunta-diventa-un-prodotto', 'formula:f-c41', 'formula:f-c41-2', 'derivation:der06', 'derivation:der18', 'widget:m06-feature-indipendenti-prodotto', 'figure:fig10', 'quiz:chk-13', 'quiz:q-fattorizzazione', 'exam:or-covarianza', 'exam:or-indipendenza', 'exercise:es07'],
    c42: ['#la-forma-di-una-gaussiana-2-d', '#una-campana-di-volume-unitario', 'formula:f-c42', 'derivation:der15', 'widget:m06-volume-unitario', 'figure:fig11', 'quiz:q-volume-unitario', 'exam:or-forma-gaussiana'],
    c43: ['#gli-isolivelli-sono-ellissi', 'example:ex07', 'formula:f-c43', 'formula:f-c43-2', 'derivation:der07', 'widget:m06-affetta-la-campana', 'figure:fig11', 'quiz:chk-15', 'quiz:q-isolivelli', 'quiz:q-raggio-isolivello', 'exam:or-forma-gaussiana', 'exam:or-mahalanobis', 'exercise:es08', 'exercise:es18'],
    c44: ['#gli-assi-seguono-gli-autovettori', '#matrice-di-covarianza-e-autovettori-nella-pca', 'example:ex07', 'formula:f-c44', 'formula:f-c44-2', 'derivation:der07', 'widget:m06-autovettori-assi-ellisse', 'figure:fig11', 'quiz:chk-14', 'quiz:q-assi-ellisse', 'quiz:q-autovalore-massimo', 'exam:or-banca-2', 'exam:or-forma-gaussiana', 'exercise:es04', 'exercise:es19'],
    c45: ['#lasse-principale-e-la-massima-varianza', 'example:ex07', 'formula:f-c45', 'derivation:der07', 'derivation:der17', 'widget:m06-autovettori-assi-ellisse', 'figure:fig11', 'quiz:chk-14', 'quiz:q-assi-ellisse', 'exam:or-forma-gaussiana', 'exercise:es04', 'exercise:es20'],
    c46: ['#gli-autovalori-fissano-la-lunghezza-degli-assi', 'formula:f-c46', 'derivation:der07', 'widget:m06-autovettori-assi-ellisse', 'quiz:chk-14', 'quiz:q-assi-ellisse', 'exam:or-forma-gaussiana', 'exercise:es04'],
    c47: ['#la-figura-della-slide-28', 'example:ex07', 'formula:f-c47', 'formula:f-c47-2', 'widget:m06-affetta-la-campana', 'figure:fig11', 'figure:fig12', 'quiz:chk-15', 'quiz:q-raggio-isolivello', 'exam:or-forma-gaussiana', 'exercise:es15', 'exercise:es18'],
    c48: ['#la-forma-di-una-gaussiana-n-d', '#autovalori-e-autovettori-in-n-dimensioni', 'formula:f-c48', 'formula:f-c48-2', 'derivation:der16', 'widget:m06-spettro-autovalori-nd', 'quiz:q-autovalore-massimo', 'exam:or-banca-2', 'exam:or-forma-gaussiana', 'exercise:es04'],
    c49: ['#lordinamento-degli-autovalori', 'formula:f-c49', 'derivation:der16', 'derivation:der17', 'widget:m06-spettro-autovalori-nd', 'quiz:q-ultimo-autovettore', 'exam:or-forma-gaussiana', 'exercise:es04'],
    c50: ['#autovalori-positivi', 'formula:f-c50', 'derivation:der05', 'derivation:der16', 'widget:m06-varianza-proiezione-psd', 'quiz:chk-12', 'quiz:q-autovalori-positivi', 'quiz:q-semidefinita-significato', 'exam:or-covarianza', 'exercise:es06'],
    c51: ['#gli-autovettori-formano-una-base-ortogonale', 'formula:f-c51', 'formula:f-c51-2', 'derivation:der15', 'derivation:der16', 'widget:m06-spettro-autovalori-nd', 'quiz:q-base-ortogonale', 'exam:or-banca-2', 'exam:or-forma-gaussiana', 'exercise:es20'],
    c52: ['#gli-isolivelli-sono-iperellissi', 'formula:f-c52', 'formula:f-c52-2', 'derivation:der07', 'widget:m06-nuvola-3d-proiezioni', 'quiz:q-iperellissi', 'exam:or-forma-gaussiana', 'exercise:es15'],
    c53: ['#asse-principale-e-asse-più-piccolo', 'formula:f-c53', 'derivation:der07', 'derivation:der17', 'widget:m06-nuvola-3d-proiezioni', 'quiz:q-ultimo-autovettore', 'exam:or-forma-gaussiana', 'exercise:es15', 'exercise:es20'],
    c54: ['#un-esempio-in-tre-dimensioni', '#la-nuvola-e-le-sue-ombre', 'example:ex08', 'widget:m06-nuvola-3d-proiezioni', 'figure:fig12', 'figure:fig13', 'quiz:chk-16', 'quiz:q-indipendenza-3d', 'exam:or-forma-gaussiana', 'exercise:es15'],
    c55: ['#perché-x1-e-x3-sono-indipendenti', 'example:ex08', 'formula:f-c55', 'formula:f-c55-2', 'derivation:der18', 'widget:m06-nuvola-3d-proiezioni', 'figure:fig13', 'quiz:chk-16', 'quiz:q-indipendenza-3d', 'quiz:q-indipendenza-condizionata', 'exam:or-indipendenza', 'exercise:es15'],
    c56: ['#la-stima-ml-della-gaussiana', '#limpostazione-n-campioni-iid', 'formula:f-c56', 'formula:f-c56-2', 'derivation:der08', 'derivation:der09', 'widget:m06-stima-ml-campione-per-campione', 'quiz:q-ipotesi-iid', 'exam:or-banca-3', 'exam:or-banca-4', 'exam:or-stima-ml-gaussiana', 'exercise:es14'],
    c57: ['#la-stima-del-vettore-media', '#la-derivata-prima-per-una-gaussiana', 'formula:f-c57', 'derivation:der08', 'derivation:der09', 'widget:m06-derivata-log-verosimiglianza', 'widget:m06-stima-ml-campione-per-campione', 'figure:fig14', 'quiz:chk-17', 'quiz:q-varianza-ml-salmoni', 'exam:or-banca-3', 'exam:or-banca-4', 'exam:or-banca-5', 'exam:or-banca-8', 'exam:or-banca-9', 'exam:or-banca-10', 'exam:or-stima-ml-gaussiana', 'exercise:es03', 'exercise:es14'],
    c58: ['#la-stima-della-matrice-di-covarianza', '#lem-con-le-gaussiane', 'formula:f-c58', 'formula:f-c58-2', 'derivation:der08', 'derivation:der09', 'derivation:der10', 'widget:m06-stima-ml-campione-per-campione', 'figure:fig14', 'quiz:chk-17', 'quiz:q-covarianza-ml-2d', 'quiz:q-rango-covarianza-ml', 'exam:or-banca-2', 'exam:or-banca-3', 'exam:or-banca-5', 'exam:or-banca-9', 'exam:or-banca-10', 'exam:or-stima-ml-gaussiana', 'exercise:es03', 'exercise:es14'],
    c59: ['#la-seconda-forma-della-stima', 'formula:f-c59', 'derivation:der10', 'widget:m06-stima-ml-campione-per-campione', 'figure:fig14', 'quiz:q-covarianza-ml-2d', 'quiz:q-seconda-forma-vantaggio', 'exam:or-stima-ml-gaussiana', 'exercise:es03'],
    c60: ['#le-proprietà-delle-stime', '#la-stima-ml-è-un-buon-stimatore', 'formula:f-c60', 'formula:f-c60-2', 'formula:f-c60-3', 'derivation:der12', 'derivation:der19', 'widget:m06-proprieta-asintotiche-stime', 'quiz:chk-18', 'quiz:q-proprieta-stime-gaussiane', 'exam:or-banca-4', 'exam:or-stima-ml-gaussiana', 'exercise:es16', 'exercise:es21'],
    c61: ['#la-media-campionaria-è-non-distorta', 'formula:f-c61', 'derivation:der11', 'derivation:der19', 'widget:m06-bias-covarianza-ml', 'figure:fig14', 'quiz:chk-18', 'quiz:q-ipotesi-media-non-distorta', 'quiz:q-proprieta-stime-gaussiane', 'exam:or-stima-ml-gaussiana', 'exercise:es16', 'exercise:es21'],
    c62: ['#la-covarianza-ml-è-distorta', 'formula:f-c62', 'derivation:der12', 'derivation:der19', 'widget:m06-bias-covarianza-ml', 'figure:fig14', 'quiz:chk-18', 'quiz:chk-19', 'quiz:q-bias-varianza-ml', 'quiz:q-proprieta-asintotiche-ml', 'quiz:q-proprieta-stime-gaussiane', 'exam:or-banca-4', 'exam:or-stima-ml-gaussiana', 'exercise:es05', 'exercise:es16', 'exercise:es21'],
    c63: ['#lo-stimatore-non-distorto-elementare', 'formula:f-c63', 'derivation:der12', 'widget:m06-bias-covarianza-ml', 'figure:fig14', 'quiz:chk-19', 'quiz:q-varianza-corretta-salmoni', 'exam:or-stima-ml-gaussiana', 'exercise:es03', 'exercise:es05', 'exercise:es16'],
    c64: ['#lo-stimatore-non-distorto-elementare', 'formula:f-c64', 'derivation:der12', 'widget:m06-bias-covarianza-ml', 'quiz:chk-19', 'quiz:q-fattore-correzione', 'quiz:q-varianza-corretta-salmoni', 'exam:or-stima-ml-gaussiana', 'exercise:es05', 'exercise:es16'],
    c65: ['#verso-la-stima-bayesiana', '#theta-fisso-o-theta-aleatorio', 'widget:m06-theta-fisso-o-aleatorio', 'quiz:chk-20', 'quiz:q-ml-contro-bayes', 'exam:or-banca-4', 'exercise:es17'],
    c66: ['#theta-fisso-o-theta-aleatorio', 'formula:f-c66', 'widget:m06-theta-fisso-o-aleatorio', 'quiz:chk-20', 'quiz:q-ml-contro-bayes', 'exam:or-banca-4', 'exercise:es17'],
    c67: ['#theta-fisso-o-theta-aleatorio', '#stima-dei-parametri-di-una-gaussiana-con-passerini', 'formula:f-c67', 'widget:m06-theta-fisso-o-aleatorio', 'quiz:chk-20', 'quiz:q-ml-contro-bayes', 'exam:or-banca-4', 'exam:or-banca-8', 'exercise:es17'],
    c68: ['#la-prima-ipotesi-forma-della-densità-nota', 'formula:f-c68', 'widget:m06-theta-fisso-o-aleatorio', 'quiz:chk-20', 'quiz:q-forma-densita-nota', 'exercise:es17'],
    c69: ['#due-feature-e-il-coefficiente-di-correlazione', 'formula:f-c69', 'formula:f-c69-2', 'formula:f-c69-3', 'widget:m06-costruisci-la-covarianza', 'widget:m06-volume-unitario', 'quiz:chk-11', 'quiz:q-coefficiente-correlazione', 'quiz:q-leggere-covarianza', 'quiz:q-matrici-valide', 'quiz:q-picco-bivariata', 'exam:or-covarianza', 'exercise:es19'],
    c70: ['#la-derivata-prima-nel-caso-a-una-dimensione', '#la-derivata-prima-per-una-gaussiana', 'formula:f-c70', 'formula:f-c70-2', 'derivation:der08', 'derivation:der19', 'widget:m06-bias-covarianza-ml', 'widget:m06-derivata-log-verosimiglianza', 'quiz:chk-17', 'quiz:q-varianza-corretta-salmoni', 'quiz:q-varianza-ml-salmoni', 'exam:or-stima-ml-gaussiana', 'exercise:es14', 'exercise:es16', 'exercise:es21'],
    c71: ['#indipendenza-e-covarianza-nulla', 'formula:f-c71', 'formula:f-c71-2', 'formula:f-c71-3', 'derivation:der18', 'widget:m06-feature-indipendenti-prodotto', 'quiz:chk-13', 'quiz:q-controesempio-x-quadro', 'quiz:q-covarianza-nulla-indipendenza', 'exam:or-indipendenza'],
  },
})
