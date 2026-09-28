// Glossario IT/EN del modulo m06 (modelli di pdf e modello gaussiano). Le definizioni non ripetono il
// termine: il gioco «Chi sono?» le mostra e chiede di indovinarlo.
import { md } from '../../types'
import type { GlossaryEntry } from '../../types'

export const glossary: GlossaryEntry[] = [
  // --- scelta del modello ---
  { term: 'Selezione del modello statistico', en: 'statistical model selection', def: md`Scelta della forma analitica di $p(\mathbf{x})$ prima di stimarne i parametri. Guardo tre aspetti: la natura statistica del fenomeno, il rumore di trasmissione e acquisizione, il pre-processing e l'estrazione delle feature.` },
  { term: 'Modello parametrico', en: 'parametric model', def: md`Famiglia di pdf determinata del tutto da un numero finito di parametri, per esempio $\mathbf{m}$ e $\Sigma$: scelta la famiglia, stimare la densità vuol dire stimare pochi numeri.` },
  { term: 'Mezzo di propagazione', en: 'propagation medium', def: md`Ciò che il segnale attraversa tra la sorgente e il sensore (aria, acqua, terreno). Nella slide 20 introduce rumore nella fase di trasmissione; le note lo associano al rilevamento passivo.` },
  { term: 'Estrazione delle feature', en: 'feature extraction', def: md`Passo che trasforma il segnale grezzo nelle grandezze date al classificatore. Cambia la distribuzione: il logaritmo di una log-normale è gaussiano, il quadrato di una Rayleigh è un'esponenziale.` },

  // --- le sei pdf ---
  { term: 'Pdf gaussiana (normale)', en: 'Gaussian (normal) pdf', def: md`Campana simmetrica $\frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac{(x-\mu)^2}{2\sigma^2}}$, definita su tutto l'asse reale: $\mu$ la sposta, $\sigma^2$ la allarga e ne abbassa il picco.` },
  { term: 'Gaussiana generalizzata', en: 'Generalized Gaussian', def: md`Famiglia simmetrica a tre parametri, $\frac{b\beta}{2\Gamma(1/\beta)}\,e^{-\left[b|x-m|\right]^{\beta}}$: contiene la laplaciana ($\beta=1$), la normale ($\beta=2$) e tende all'uniforme per $\beta\to+\infty$.` },
  { term: 'Parametro di forma', en: 'shape parameter', def: md`Parametro che cambia il profilo della curva e non solo la sua posizione o la sua scala: $\beta$ nella gaussiana generalizzata, $k$ nella Gamma.` },
  { term: 'Parametro di scala', en: 'scale parameter', def: md`Parametro che stira o comprime l'asse $x$ senza cambiare il profilo della curva, come $\theta$ nella Gamma o $\sigma$ nella Rayleigh.` },
  { term: 'Laplaciana', en: 'Laplacian, double exponential', def: md`Pdf $\frac{b}{2}\,e^{-b|x-m|}$ con una cuspide nel centro e code più pesanti della normale: è la gaussiana generalizzata con $\beta=1$.` },
  { term: 'Distribuzione Gamma', en: 'Gamma distribution', def: md`Pdf $x^{k-1}\frac{e^{-x/\theta}}{\theta^{k}\Gamma(k)}$ per $x>0$, con moda $(k-1)\theta$, media $k\theta$ e varianza $k\theta^2$. Descrive tempi d'attesa, per esempio nella teoria delle code.` },
  { term: 'Funzione Gamma di Eulero', en: 'Euler Gamma function', def: md`Estensione del fattoriale ai reali positivi: per $k$ intero vale $(k-1)!$, e $\Gamma(1/2)=\sqrt{\pi}$. Compare nelle costanti di normalizzazione di gaussiana generalizzata, Gamma e chi-quadro.` },
  { term: 'Distribuzione di Rayleigh', en: 'Rayleigh distribution', def: md`Pdf $\frac{x}{\sigma^{2}}\exp\left(\frac{-x^{2}}{2\sigma^{2}}\right)$ per $x\ge 0$: modulo di un vettore con due componenti gaussiane indipendenti a media nulla. Moda in $x=\sigma$, picco $\frac{1}{\sigma\sqrt{e}}$; usata per le ampiezze dei segnali radar diffusi.` },
  { term: 'Distribuzione chi-quadro', en: 'Chi-square distribution', def: md`Pdf della somma dei quadrati di $k$ gaussiane standard indipendenti, $\frac{(1/2)^{k/2}}{\Gamma(k/2)}\,x^{k/2-1}e^{-x/2}$: è una Gamma di forma $k/2$ e scala 2. Si usa nei test d'ipotesi e di *goodness-of-fit*.` },
  { term: 'Funzione di ripartizione', en: 'cumulative distribution function (CDF)', def: md`$F(x)=P(X\le x)=\int_{-\infty}^{x}p(t)\,dt$: la sua derivata è la pdf. Per la gaussiana standard si indica con $\Phi$; derivando $P(z^{2}\le x)=2\Phi(\sqrt{x})-1$ si ottiene il chi-quadro con un grado di libertà.` },
  { term: 'Gradi di libertà', en: 'degrees of freedom', def: md`Il parametro $k$ del chi-quadro: numero di gaussiane standard al quadrato che si sommano. Media $k$, varianza $2k$.` },
  { term: 'Distribuzione log-normale', en: 'Log-Normal distribution', def: md`Pdf di una variabile positiva il cui logaritmo è gaussiano con media $\mu$ e deviazione standard $\sigma$: $\frac{e^{-(\ln x-\mu)^{2}/(2\sigma^{2})}}{x\sigma\sqrt{2\pi}}$. Mediana $e^{\mu}$, media $e^{\mu+\sigma^2/2}$.` },
  { term: 'Asimmetria positiva', en: 'positive skewness, positively skewed', def: md`Forma di una distribuzione con la coda lunga a destra: la media supera la mediana e la mediana supera la moda. Tipica di Gamma, Rayleigh, chi-quadro e log-normale, e dei dati finanziari.` },
  { term: 'Moda', en: 'mode', def: md`Punto in cui la pdf raggiunge il massimo: $\mu$ per la normale, $\sigma$ per la Rayleigh, $(k-1)\theta$ per la Gamma, $e^{\mu-\sigma^2}$ per la log-normale.` },

  // --- limite centrale ---
  { term: 'Teorema del limite centrale', en: 'Central Limit Theorem (CLT)', def: md`Risultato per cui la somma di molte variabili iid con varianza finita è approssimativamente normale, qualunque sia la forma delle singole variabili. Spiega la diffusione del modello gaussiano.` },
  { term: 'Variabili iid', en: 'independent and identically distributed (iid) variables', def: md`Variabili aleatorie indipendenti tra loro e con la stessa distribuzione. Ipotesi del limite centrale e della stima ML: la verosimiglianza diventa un prodotto.` },

  // --- gaussiana multivariata ---
  { term: 'Gaussiana multivariata', en: 'multivariate Gaussian pdf', def: md`Pdf $\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]$ di un vettore di $n$ feature, indicata con $N(\mathbf{m},\Sigma)$.` },
  { term: 'Vettore media', en: 'mean vector', def: md`$\mathbf{m}=E\{\mathbf{x}\}$: il vettore dei valori attesi delle singole feature, tendenza centrale dei dati e centro della campana.` },
  { term: 'Matrice di covarianza', en: 'covariance matrix', def: md`$\Sigma=E\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\}=E\{\mathbf{x}\mathbf{x}^{t}\}-\mathbf{m}\mathbf{m}^{t}$: matrice $n\times n$ simmetrica e semidefinita positiva, con le varianze sulla diagonale.` },
  { term: 'Covarianza', en: 'covariance', def: md`$\sigma_{ij}=E\{(x_i-m_i)(x_j-m_j)\}$: dice se due feature crescono insieme (positiva), in verso opposto (negativa) o senza legame lineare (nulla).` },
  { term: 'Coefficiente di correlazione', en: 'correlation coefficient', def: md`$\rho=\frac{\sigma_{12}}{\sigma_1\sigma_2}$, numero puro tra $-1$ e $1$. Con $|\rho|=1$ le feature sono linearmente dipendenti e $|\Sigma|=\sigma_1^2\sigma_2^2(1-\rho^2)$ si annulla.` },
  { term: 'Determinante della covarianza', en: 'determinant of the covariance matrix', def: md`$|\Sigma|=\prod_i\lambda_i$: misura il volume della nuvola di dati. Compare come $|\Sigma|^{1/2}$ nella costante di normalizzazione; se vale 0 la gaussiana non è definita.` },
  { term: 'Distanza di Mahalanobis', en: 'Mahalanobis distance', def: md`$\sqrt{(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})}$: distanza dalla media misurata in deviazioni standard lungo ogni direzione. Le note chiamano così la forma quadratica stessa; con $\Sigma=I$ torna la distanza euclidea.` },
  { term: 'Forma quadratica', en: 'quadratic form', def: md`Espressione scalare $\mathbf{a}^{t}A\,\mathbf{a}$. Nell'esponente della gaussiana vale $(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})$; con $\mathbf{a}^{t}\Sigma\,\mathbf{a}$ dà la varianza dei dati lungo $\mathbf{a}$.` },

  // --- proprietà di Σ e geometria ---
  { term: 'Matrice simmetrica', en: 'symmetric matrix', def: md`Matrice uguale alla sua trasposta, $\Sigma=\Sigma^{t}$. Ha autovalori reali e autovettori ortogonali, e $n(n+1)/2$ elementi indipendenti.` },
  { term: 'Semidefinita positiva', en: 'positive semidefinite', def: md`Proprietà di una matrice simmetrica con $\mathbf{a}^{t}\Sigma\,\mathbf{a}\ge 0$ per ogni $\mathbf{a}$, equivalente ad autovalori non negativi. Per $\Sigma$ dice che nessuna direzione ha varianza negativa.` },
  { term: 'Definita positiva', en: 'positive definite', def: md`Condizione più forte: $\mathbf{a}^{t}\Sigma\,\mathbf{a}>0$ per ogni $\mathbf{a}\ne\mathbf{0}$, cioè tutti gli autovalori strettamente positivi. Serve perché $\Sigma^{-1}$ esista e la pdf gaussiana sia definita.` },
  { term: 'Feature indipendenti', en: 'independent features', def: md`Feature con pdf congiunta uguale al prodotto delle marginali, $p(\mathbf{x})=p(x_1)\dots p(x_n)$. Implicano $\Sigma$ diagonale; nel modello gaussiano vale anche il viceversa.` },
  { term: 'Isolivello', en: 'isolevel, contour', def: md`Insieme dei punti con la stessa densità, $p(\mathbf{x})=c$: fetta orizzontale della campana. Per la gaussiana è un'ellisse (in 2-D) centrata in $\mathbf{m}$, alla stessa distanza di Mahalanobis dalla media.` },
  { term: 'Iperellisse', en: 'hyperellipse', def: md`Superficie $\sum_i y_i^2/\lambda_i=r^2$ in $\Re^{n}$, con gli assi lungo gli autovettori di $\Sigma$ e semiassi $r\sqrt{\lambda_i}$. Per $n=3$ è un ellissoide.` },
  { term: 'Autovalore', en: 'eigenvalue', def: md`Numero $\lambda$ con $\Sigma\,\mathbf{e}=\lambda\,\mathbf{e}$, radice di $\det(\Sigma-\lambda I)=0$. Per la covarianza è la varianza dei dati lungo la direzione $\mathbf{e}$; la sua radice fissa la lunghezza dell'asse dell'ellisse.` },
  { term: 'Autovettore', en: 'eigenvector', def: md`Direzione $\mathbf{e}$ che $\Sigma$ allunga senza ruotarla, $\Sigma\,\mathbf{e}=\lambda\,\mathbf{e}$. Per la covarianza dà la direzione di un asse degli isolivelli.` },
  { term: 'Equazione caratteristica', en: 'characteristic equation', def: md`$\det(\Sigma-\lambda I)=0$: in 2-D è $\lambda^{2}-(\sigma_1^{2}+\sigma_2^{2})\lambda+(\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2})=0$ e le sue radici sono gli autovalori.` },
  { term: 'Traccia', en: 'trace', def: md`Somma degli elementi sulla diagonale, $tr(\Sigma)=\sum_i\sigma_i^{2}=\sum_i\lambda_i$: per la covarianza è la varianza totale. Uno scalare è la traccia di sé stesso e $tr(ABC)=tr(CAB)$: è il trucco per derivare la log-verosimiglianza rispetto a $\Sigma$.` },
  { term: 'Ellissoide', en: 'ellipsoid', def: md`Iperellisse in tre dimensioni: la forma degli isolivelli di una gaussiana 3-D, con tre assi lungo gli autovettori di $\Sigma$; le sue ombre sulle pareti del cubo della slide 30 sono ellissi.` },
  { term: 'Base ortogonale', en: 'orthogonal basis', def: md`Insieme di $n$ vettori a due a due perpendicolari che genera $\Re^{n}$. Gli autovettori di $\Sigma$ ne formano una: $\Sigma=U\Lambda U^{t}$ con $U^{t}U=I$.` },
  { term: 'Asse principale', en: 'principal axis, main axis, major axis', def: md`Asse dell'ellisse diretto dall'autovettore del massimo autovalore: direzione di massima varianza dei dati, prima componente principale della PCA.` },

  // --- stima ML e Bayes ---
  { term: 'Media campionaria', en: 'sample mean', def: md`$\hat{\mathbf{m}}=\frac{1}{N}\sum_{k}\mathbf{x}_k$: stima ML del vettore media di una gaussiana, non distorta per ogni $N$, con covarianza $\Sigma/N$.` },
  { term: 'Stimatore distorto', en: 'biased estimator', def: md`Stimatore il cui valore atteso differisce dal parametro vero. La covarianza ML ha $E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$: sottostima la variabilità, ma il fattore tende a 1.` },
  { term: 'Stimatore non distorto elementare', en: 'elementary unbiased estimator', def: md`$\frac{1}{N-1}\sum_k(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}$: stessa somma della stima ML con $N-1$ al posto di $N$, valore atteso esattamente $\Sigma$. Richiede $N\ge 2$.` },
  { term: 'Fattore di correzione', en: 'correction factor', def: md`Il moltiplicatore $\frac{N}{N-1}$ che trasforma la covarianza ML nella versione non distorta. Pesa con pochi campioni (2 con $N=2$) ed è quasi 1 con molti.` },
  { term: 'Stima bayesiana', en: 'Bayesian estimation, Bayesian learning', def: md`Approccio che tratta $\boldsymbol{\theta}$ come variabile aleatoria: parte da una densità a priori e, osservati i dati, la aggiorna con il teorema di Bayes. Il risultato è una distribuzione, non un punto.` },
  { term: 'Distribuzione a priori', en: 'prior distribution', def: md`$p(\boldsymbol{\theta})$: ciò che so o assumo sul parametro prima di osservare i dati.` },
  { term: 'Densità a posteriori', en: 'posterior probability density', def: md`$p(\boldsymbol{\theta}|X)$: distribuzione del parametro aggiornata dopo aver visto i dati di training $X$.` },
  { term: 'Forma della densità nota', en: 'Known Density Form', def: md`Prima ipotesi della stima bayesiana: la forma funzionale di $p(\mathbf{x}|\boldsymbol{\theta})$ è nota, i valori di $\boldsymbol{\theta}$ no.` },
]
