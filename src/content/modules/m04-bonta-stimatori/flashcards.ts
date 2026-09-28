// Flashcard del modulo m04 (bontà di uno stimatore, bound di Cramér-Rao, proprietà asintotiche).
// Coprono i 70 concetti dell'inventario nell'ordine delle fonti (part1 p17-21, ch2 p12-16) più le integrazioni dichiarate.
import { md } from '../../types'
import type { Flashcard } from '../../types'

export const flashcards: Flashcard[] = [
  // --- stima parametrica, likelihood, MLE e BE (part1 p17-18) ---
  {
    id: 'fc-modello-parametrico',
    kind: 'definizione',
    q: md`Che cosa si assume nella stima parametrica (*parametric estimation*) e su che cosa si giudica la bontà della stima?`,
    a: md`Il modello della pdf $p(\mathbf{x})$ dipende da $r$ parametri (*parameters*), raccolti nel vettore dei parametri (*parameter vector*) $\boldsymbol{\theta} = (\theta_1, \theta_2, \ldots, \theta_r)$; la dipendenza si scrive $p(\mathbf{x}|\boldsymbol{\theta})$. Il training set $\mathbf{X} = \{\mathbf{x}_1, \ldots, \mathbf{x}_N\}$ è un vettore di variabili aleatorie iid. La bontà (*goodness*) riguarda la stima $\hat{\boldsymbol{\theta}}$ di $\boldsymbol{\theta}$ ricavata da $\mathbf{X}$.`,
  },
  {
    id: 'fc-likelihood-prodotto',
    kind: 'formula',
    q: md`Scrivi la funzione di verosimiglianza (*likelihood function*) per $N$ campioni iid. Di che cosa è funzione?`,
    a: md`$$p(\mathbf{X}|\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k|\boldsymbol{\theta})$$

È funzione di $\boldsymbol{\theta}$ con i dati $\mathbf{X}$ fissati: dice quanto è verosimile ogni vettore $\boldsymbol{\theta}$ rispetto al training set osservato. La stessa quantità entra nella matrice di Fisher e nella stima ML.`,
  },
  {
    id: 'fc-perche-prodotto',
    kind: 'proprieta',
    q: md`Perché la likelihood si può scrivere come prodotto delle densità dei singoli campioni? Dove servono «independent» e «identically distributed»?`,
    a: md`Le note: poiché i campioni sono indipendenti, la probabilità complessiva è il prodotto delle probabilità dei singoli campioni. Con la regola della catena la densità congiunta è $p(\mathbf{x}_1|\boldsymbol{\theta})\, p(\mathbf{x}_2|\mathbf{x}_1, \boldsymbol{\theta}) \cdots$

- l'**indipendenza** toglie il condizionamento sui campioni precedenti;
- l'**identica distribuzione** rende ogni fattore la stessa funzione $p(\cdot|\boldsymbol{\theta})$.

Controesempio: una misura duplicata ($\mathbf{x}_2 \equiv \mathbf{x}_1$) darebbe $p(\mathbf{x}_1|\boldsymbol{\theta})^2$, che non è la densità congiunta.`,
  },
  {
    id: 'fc-cosa-descrive-likelihood',
    kind: 'definizione',
    q: md`Che cosa descrive la likelihood? (domanda d'orale «what the Likelihood describe»)`,
    a: md`Una misura di compatibilità o accordo (*measure of the compatibility or agreement*) tra i parametri del modello $\boldsymbol{\theta}$ e i campioni osservati $\mathbf{X}$: quanto bene il modello scelto «spiega» (*explain*) i campioni di training. Analizzandola individuo i parametri che più verosimilmente hanno generato i dati, ed è per questo che le note la chiamano fondamentale per l'inferenza statistica.`,
  },
  {
    id: 'fc-figura-tre-pannelli',
    kind: 'intuizione',
    q: md`Che cosa mostrano i tre pannelli della figura «Likelihood Function: Example» (part1 p17, slide ch2 p10)?`,
    a: md`- **Alto**: una dozzina di campioni sull'asse $x$ (tra circa 1.9 e 4.8) e quattro gaussiane candidate tratteggiate con medie diverse; quella centrata attorno a 5 spiega male i dati.
- **Centro**: $p(\mathbf{X}|\theta)$ in funzione di $\theta$, picco stretto in $\hat{\theta} \approx 3.1$, ordinate dell'ordine di $10^{-7}$.
- **Basso**: la log-likelihood $l(\theta)$, concava, tra $-20$ e $-100$, con il massimo nello stesso $\hat{\theta}$.

Messaggio: la likelihood è funzione di $\theta$ e non di $x$, il suo massimo dà la stima e il logaritmo non sposta il massimo.`,
  },
  {
    id: 'fc-numeri-minuscoli',
    kind: 'intuizione',
    q: md`Perché nel pannello centrale della figura della likelihood le ordinate valgono circa $10^{-7}$, mentre il pannello basso va da $-20$ a $-100$?`,
    a: md`La likelihood è un prodotto di una dozzina di densità, ognuna minore di 1: il risultato è minuscolo (il picco arriva a circa $1.7 \times 10^{-7}$). Il logaritmo trasforma il prodotto in una somma di numeri di grandezza normale: $\ln(1.7 \times 10^{-7}) \approx -15.6$, coerente con il massimo di $l(\theta) \approx -16$ letto nel pannello basso.`,
  },
  {
    id: 'fc-mle-theta-fisso',
    kind: 'definizione',
    q: md`Nella stima a massima verosimiglianza (*Maximum Likelihood Estimation*, MLE) come si tratta il vettore $\boldsymbol{\theta}$, e quale stima si sceglie?`,
    a: md`$\boldsymbol{\theta}$ è un insieme di quantità fisse ma ignote (*fixed but unknown*). La stima migliore è quella che massimizza la likelihood di ottenere i campioni effettivamente osservati. In questa visione ($\boldsymbol{\theta}$ costante, $\mathbf{X}$ aleatorio) hanno senso bias, varianza e bound di Cramér-Rao.`,
  },
  {
    id: 'fc-be-theta-aleatorio',
    kind: 'definizione',
    q: md`Come funziona la stima bayesiana (*Bayesian Estimation*, BE) secondo le note?`,
    a: md`Tratta i parametri come variabili aleatorie con una distribuzione a priori (*prior*) nota. Quando osservo i campioni, il teorema di Bayes aggiorna la prior e dà una densità a posteriori (*posterior density*). Così incorporo conoscenze o convinzioni a priori e le combino con l'informazione dei dati, per una stima più informata.`,
  },
  {
    id: 'fc-mle-contro-be',
    kind: 'confronto',
    q: md`Quali sono le due differenze chiave tra MLE e BE elencate nelle note?`,
    a: md`- **Natura dei parametri** (*nature of parameters*): nella MLE $\boldsymbol{\theta}$ è una costante da stimare; nella BE è una variabile aleatoria, che riflette l'incertezza e integra la conoscenza a priori.
- **Obiettivo** (*objective*): la MLE ottimizza una funzione obiettivo basata solo sui dati osservati, per trovare i parametri che massimizzano la likelihood; la BE combina campioni e prior in una densità a posteriori, cioè una descrizione probabilistica completa dell'incertezza sul parametro.

Conclusione delle note: scelgo il metodo in base al contesto del problema e alla natura dei dati.`,
  },
  // --- la stima è aleatoria, errore, stima ideale (ch2 p12, part1 p18) ---
  {
    id: 'fc-stima-funzione-dei-dati',
    kind: 'formula',
    q: md`Primo punto della slide «Estimation Goodness»: da che cosa dipende la stima, e che cosa ne segue?`,
    a: md`$$\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\mathbf{X})$$

La stima dipende dal vettore delle osservazioni (*observation vector*) $\mathbf{X}$. Quindi è un vettore aleatorio (*random vector*): se cambia il training set, cambia anche la stima. Qualunque procedura (ML, bayesiana, media campionaria) è una regola che trasforma $\mathbf{X}$ in un valore.`,
  },
  {
    id: 'fc-rispetto-a-cosa-media',
    kind: 'definizione',
    q: md`Rispetto a che cosa si calcolano $E\{\cdot\}$, $\operatorname{var}\{\cdot\}$ e $P\{\cdot\}$ nelle slide 13-16? (la fonte lo sottintende)`,
    a: md`Sui possibili training set di $N$ campioni, pesati con la likelihood nel $\boldsymbol{\theta}$ vero:

$$E\{\hat{\boldsymbol{\theta}}\} = \int \hat{\boldsymbol{\theta}}(\mathbf{X})\, p(\mathbf{X}|\boldsymbol{\theta})\, d\mathbf{X}$$

Conseguenze: bias, varianza, bound e $P\{\|\boldsymbol{\varepsilon}\| < \delta\}$ non dipendono dal training set che ho in mano, ma solo da $\boldsymbol{\theta}$ e da $N$; per questo ha senso farne il limite per $N \to +\infty$. E $\boldsymbol{\theta}$ esce dal valore atteso perché è una costante.`,
  },
  {
    id: 'fc-errore-di-stima',
    kind: 'formula',
    q: md`Come si definisce l'errore di stima (*estimation error*) $\boldsymbol{\varepsilon}$?`,
    a: md`$$\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta} = \boldsymbol{\varepsilon}(\mathbf{X}, \boldsymbol{\theta}) = [\hat{\theta}_i - \theta_i : i = 1, 2, \ldots, r]$$

Differenza tra valore stimato e valore vero, una componente per parametro. Dipende da $\mathbf{X}$ e da $\boldsymbol{\theta}$; poiché $\mathbf{X}$ è aleatorio, anche $\boldsymbol{\varepsilon}$ è un vettore aleatorio.`,
  },
  {
    id: 'fc-stima-ideale',
    kind: 'definizione',
    q: md`Quali due requisiti deve soddisfare ogni errore $\varepsilon_i$ per avere una stima ideale (*ideal estimate*)?`,
    a: md`Deve essere non polarizzato (*unbiased*) e senza varianza (*no variance*):

$$E\{\varepsilon_i\} = 0, \qquad \operatorname{var}\{\varepsilon_i\} = 0 \qquad (i = 1, \ldots, r)$$

Sono i due assi di giudizio: errore sistematico ed errore casuale. Insieme equivalgono a $E\{\varepsilon_i^2\} = 0$, cioè $\hat{\theta}_i = \theta_i$ con probabilità 1.`,
  },
  {
    id: 'fc-ideale-come-riferimento',
    kind: 'intuizione',
    q: md`La stima ideale si può ottenere nella pratica? A che cosa serve allora?`,
    a: md`Le note: ottenere insieme assenza di bias e varianza nulla può essere difficile (*challenging*), ma i due criteri sono riferimenti fondamentali (*fundamental benchmarks*) per valutare i metodi. Con $N$ finito uno stimatore unbiased di un modello regolare, con informazione di Fisher finita, ha varianza almeno pari al bound di Cramér-Rao, che è positivo. Solo uno stimatore biased può avere varianza nulla: al limite quello costante, che però ha un bias qualsiasi.`,
  },
  {
    id: 'fc-bias',
    kind: 'definizione',
    q: md`Che cos'è il bias (*bias*) di un errore di stima?`,
    a: md`Il suo valor medio (*mean value*). Poiché $\boldsymbol{\theta}$ è costante:

$$E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}$$

È l'errore sistematico che resta anche mediando su infiniti training set della stessa dimensione $N$. In generale dipende da $\boldsymbol{\theta}$ e da $N$.`,
  },
  {
    id: 'fc-unbiased',
    kind: 'formula',
    q: md`Quando una stima si dice non polarizzata (*unbiased*)? Come si legge la freccia verde della slide 13?`,
    a: md`$$E\{\boldsymbol{\varepsilon}\} = 0 \;\Longrightarrow\; E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$$

In media lo stimatore produce il valore corretto del parametro. Nel livello di testo del PDF, sotto la freccia, c'è la parola «ossia»: le due scritture sono equivalenti, perché $E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}$.`,
  },
  {
    id: 'fc-varianza-errore',
    kind: 'formula',
    q: md`Scrivi la varianza dell'errore di stima come nella slide 13. Che cosa indica la barra?`,
    a: md`$$\operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \bar{\hat{\theta}}_i)^2\} \qquad (i = 1, 2, \ldots, r)$$

$\bar{\hat{\theta}}_i = E\{\hat{\theta}_i\}$ è il valor medio della stima, non il valore vero. La varianza misura la dispersione della stima al variare del training set: l'errore casuale.`,
  },
  {
    id: 'fc-varianza-errore-uguale-varianza-stima',
    kind: 'proprieta',
    q: md`Perché $\operatorname{var}\{\varepsilon_i\} = \operatorname{var}\{\hat{\theta}_i\}$? Quando coincide con $E\{(\hat{\theta}_i - \theta_i)^2\}$?`,
    a: md`$\theta_i$ è una costante: sottrarla non cambia la dispersione. Infatti $\varepsilon_i - E\{\varepsilon_i\} = \hat{\theta}_i - \bar{\hat{\theta}}_i$. La varianza misura quanto la stima oscilla attorno alla propria media; quanto quella media dista dal vero lo misura il bias. Solo per uno stimatore unbiased ($E\{\hat{\theta}_i\} = \theta_i$) la varianza diventa l'errore quadratico medio $E\{(\hat{\theta}_i - \theta_i)^2\}$.`,
  },
  {
    id: 'fc-errore-quadratico-medio',
    kind: 'formula',
    q: md`Come si scompone l'errore quadratico medio (*mean squared error*) sul parametro $i$? (integrazione, non è nelle slide)`,
    a: md`$$E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + (E\{\varepsilon_i\})^2$$

Aggiungo e tolgo $\bar{\hat{\theta}}_i$ dentro $(\hat{\theta}_i - \theta_i)^2$: il termine incrociato si annulla perché $E\{\hat{\theta}_i - \bar{\hat{\theta}}_i\} = 0$. L'errore è nullo solo se bias e varianza sono entrambi nulli: ecco perché la slide 12 chiede le due condizioni insieme.`,
  },
  {
    id: 'fc-serve-un-riferimento',
    kind: 'intuizione',
    q: md`Ho calcolato la varianza del mio stimatore. Perché la slide 13 dice che non basta?`,
    a: md`Un numero da solo non dice se la varianza è «piccola». Serve un metro assoluto: un limite inferiore teorico, valido per ogni stimatore unbiased. Per valutare la bontà della varianza la slide chiede di riferirla al bound di Cramér-Rao (*Cramér-Rao bound*).`,
  },
  // --- bound di Cramér-Rao e informazione di Fisher (ch2 p14, part1 p19) ---
  {
    id: 'fc-cramer-rao-parole',
    kind: 'definizione',
    q: md`Che cosa esprime il bound di Cramér-Rao, detto a parole come nella slide 14?`,
    a: md`Un limite inferiore (*lower bound*) sulla varianza di uno stimatore statistico **unbiased**, basato sull'informazione di Fisher (*Fisher information*). Nessuno stimatore non polarizzato può scendere sotto questo limite, qualunque regola usi.`,
  },
  {
    id: 'fc-disuguaglianza-cramer-rao',
    kind: 'formula',
    q: md`Scrivi la disuguaglianza di Cramér-Rao (*Cramér-Rao inequality*). Da che cosa dipende il membro destro?`,
    a: md`$$\operatorname{var}\{\varepsilon_i\} \geq [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}, \qquad i = 1, 2, \ldots, r$$

Il membro destro è l'elemento diagonale $i$-esimo dell'**inversa** della matrice di Fisher. Dipende solo dal modello $p(\mathbf{X}|\boldsymbol{\theta})$, dal valore di $\boldsymbol{\theta}$ e da $N$, non dallo stimatore.`,
  },
  {
    id: 'fc-bound-solo-unbiased',
    kind: 'proprieta',
    q: md`Uno stimatore ha varianza sotto il bound di Cramér-Rao. È una contraddizione?`,
    a: md`No, se è biased: il bound riguarda solo gli stimatori non polarizzati («unbiased» è in rosso nella slide). Caso estremo: lo stimatore costante ha varianza zero e bias arbitrario. Esempio con numeri: la ridge a un parametro con $\lambda = 16$ ha varianza 24.5 contro un bound di 133. Per questo il confronto con il bound ha senso solo dopo aver verificato l'assenza di bias, almeno asintotica.`,
  },
  {
    id: 'fc-bound-stimatori-biased',
    kind: 'formula',
    q: md`Quale forma prende il bound per uno stimatore scalare con bias $b(\theta)$? (integrazione)`,
    a: md`Se $E\{\hat{\theta}\} = \theta + b(\theta)$:

$$\operatorname{var}\{\varepsilon\} \geq \frac{(1 + \partial b/\partial \theta)^2}{I(\theta)}$$

Con $b = 0$ torna il bound della slide. Uno stimatore che restringe la stima verso lo zero ha $\partial b/\partial \theta$ tra $-1$ e $0$, quindi un limite più basso: la ridge, con $b = -\lambda\theta/(S + \lambda)$, lo raggiunge esattamente.`,
  },
  {
    id: 'fc-fisher-concetto',
    kind: 'intuizione',
    q: md`Che cosa misura l'informazione di Fisher, intuitivamente?`,
    a: md`Quanta informazione le osservazioni $\mathbf{X}$ portano sul parametro: quanto la log-likelihood è sensibile a piccole variazioni di $\theta$. Nel caso scalare:

$$I(\theta) = E\left\{\left(\frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta}\right)^2\right\}$$

Log-likelihood appuntita: molta informazione, bound piccolo. Log-likelihood piatta: poca informazione, bound alto.`,
  },
  {
    id: 'fc-matrice-fisher-compatta',
    kind: 'formula',
    q: md`Scrivi la matrice di informazione di Fisher (*Fisher information matrix*) nella forma compatta della slide 14. Quanto è grande?`,
    a: md`$$\mathbf{I}(\boldsymbol{\theta}) = E\{\nabla_{\boldsymbol{\theta}} \ln[p(\mathbf{X}|\boldsymbol{\theta})]\, \nabla_{\boldsymbol{\theta}} \ln[p(\mathbf{X}|\boldsymbol{\theta})]^{t}\}$$

Valore atteso del prodotto esterno tra il gradiente della log-likelihood (vettore colonna $r \times 1$) e il suo trasposto: una matrice $r \times r$. Il valore atteso è preso su $\mathbf{X}$ distribuito come $p(\mathbf{X}|\boldsymbol{\theta})$.`,
  },
  {
    id: 'fc-matrice-fisher-elemento',
    kind: 'formula',
    q: md`Scrivi l'elemento $(i, j)$ della matrice di Fisher.`,
    a: md`$$[\mathbf{I}(\boldsymbol{\theta})]_{ij} = E\left\{ \frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial \theta_i} \cdot \frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial \theta_j} \right\}$$

È la forma compatta scritta componente per componente: l'elemento $(i, j)$ del prodotto esterno $\nabla \ln p\, (\nabla \ln p)^t$ è il prodotto delle derivate parziali $i$ e $j$. Sulla diagonale c'è il valore atteso del quadrato della derivata rispetto a $\theta_i$.`,
  },
  {
    id: 'fc-struttura-fisher',
    kind: 'proprieta',
    q: md`Quali proprietà strutturali ha la matrice di Fisher, e quale suo elemento entra nel bound?`,
    a: md`È $r \times r$, simmetrica ($[\mathbf{I}]_{ij} = [\mathbf{I}]_{ji}$) e con diagonale non negativa (valori attesi di quadrati). Nel bound entra l'elemento diagonale dell'**inversa**, $[\mathbf{I}^{-1}]_{ii}$, non l'inverso dell'elemento diagonale:

$$[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii} \geq \frac{1}{[\mathbf{I}(\boldsymbol{\theta})]_{ii}}$$

Coincidono solo se la riga $i$ ha zeri fuori diagonale. Con $r = 1$ il bound è $1/I(\theta)$.`,
  },
  {
    id: 'fc-diagonale-inversa-case',
    kind: 'confronto',
    q: md`Diagonale dell'inversa o inverso della diagonale: quanto cambia il bound sull'intercetta di una regressione dei prezzi delle case?`,
    a: md`$1/[\mathbf{I}]_{ii}$ è il bound se tutti gli altri parametri fossero noti; doverli stimare insieme (parametri accoppiati) può solo alzarlo. Con prezzo $= a_0 + b_0 \cdot$ superficie, $\sigma = 20$ k€, $N = 50$, $\bar{x} = 100$ m², $s_x = 30$ m²:

- ignorando l'accoppiamento: $\sigma^2/N = 8$ (k€)²;
- bound corretto: $\frac{\sigma^2}{N}\left(1 + \frac{\bar{x}^2}{s_x^2}\right) \approx 96.9$ (k€)², oltre dodici volte tanto.

Centrando la superficie ($\bar{x} = 0$) la matrice diventa diagonale e il bound torna a 8.`,
  },
  {
    id: 'fc-stimatore-efficiente',
    kind: 'definizione',
    q: md`Quando uno stimatore si dice efficiente (*efficient*)?`,
    a: md`Quando raggiunge il bound (la nota scritta in diagonale sulla slide 14: «When the bound is reached, the estimator is said efficient»):

$$\operatorname{var}\{\varepsilon_i\} = [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}, \qquad i = 1, \ldots, r$$

È unbiased e ha la minima varianza possibile tra gli stimatori unbiased: ottimo in termini di efficienza statistica.`,
  },
  {
    id: 'fc-bound-media-gaussiana',
    kind: 'procedura',
    q: md`Calcola il bound di Cramér-Rao per la media $m$ di una gaussiana con $\sigma^2$ nota, da $N$ campioni iid. La media campionaria è efficiente?`,
    a: md`1. Log-likelihood: $\ln p(\mathbf{X}|m) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_k (x_k - m)^2$.
2. Score: $\frac{\partial \ln p}{\partial m} = \frac{1}{\sigma^2}\sum_k (x_k - m)$.
3. Informazione: $I(m) = E\{\text{score}^2\} = \frac{N\sigma^2}{\sigma^4} = \frac{N}{\sigma^2}$.
4. Bound: $\operatorname{var}\{\varepsilon\} \geq \sigma^2/N$.

La media campionaria è unbiased con varianza $\sigma^2/N$: raggiunge il bound, quindi è efficiente. (Integrazione: la fonte non dà esempi numerici.)`,
  },
  {
    id: 'fc-score-media-nulla',
    kind: 'proprieta',
    q: md`Perché lo score (derivata della log-likelihood) ha media nulla nel $\theta$ vero, e che cosa ne segue per $I(\theta)$?`,
    a: md`Sotto condizioni di regolarità (supporto indipendente da $\theta$, scambio tra derivata e integrale):

$$E\{s\} = \int \frac{\partial p(\mathbf{X}|\theta)}{\partial \theta}\, d\mathbf{X} = \frac{\partial}{\partial \theta}\int p(\mathbf{X}|\theta)\, d\mathbf{X} = \frac{\partial}{\partial \theta} 1 = 0$$

Quindi $I(\theta) = E\{s^2\}$ è la varianza dello score (nel caso vettoriale, la sua matrice di covarianza).`,
  },
  {
    id: 'fc-fisher-cresce-con-n',
    kind: 'proprieta',
    q: md`Con $N$ campioni iid, come cresce l'informazione di Fisher e come scende il bound?`,
    a: md`$$\mathbf{I}_N(\boldsymbol{\theta}) = N\, \mathbf{I}_1(\boldsymbol{\theta}) \;\Longrightarrow\; [\mathbf{I}_N^{-1}]_{ii} = \frac{1}{N}[\mathbf{I}_1^{-1}]_{ii}$$

La log-likelihood è una somma, lo score è la somma di $N$ score indipendenti a media nulla: i termini incrociati hanno media zero e restano $N$ termini uguali. Più campioni, più informazione, bound che scende come $1/N$.`,
  },
  {
    id: 'fc-fisher-curvatura',
    kind: 'formula',
    q: md`Scrivi la forma dell'informazione di Fisher con la derivata seconda e calcolala per la Bernoulli (filtro antispam). (integrazione)`,
    a: md`$$I(\theta) = -E\left\{ \frac{\partial^2 \ln p(\mathbf{X}|\theta)}{\partial \theta^2} \right\}$$

Vale sotto regolarità: più la log-likelihood è curva attorno al massimo, più informazione. Bernoulli con $k$ spam su $N$ email: $\ln p = k\ln\theta + (N-k)\ln(1-\theta)$, quindi $I(\theta) = \frac{N}{\theta} + \frac{N}{1-\theta} = \frac{N}{\theta(1-\theta)}$.`,
  },
  {
    id: 'fc-log-likelihood-parabola',
    kind: 'intuizione',
    q: md`Per una gaussiana con $\sigma$ nota, che forma ha la log-likelihood della media e che cosa c'entra con il bound?`,
    a: md`È una parabola:

$$l(\theta) = l(\hat{\theta}) - \frac{N(\theta - \hat{\theta})^2}{2\sigma^2}$$

La sua curvatura è $N/\sigma^2 = I(\theta)$ e il picco della likelihood è una gaussiana larga $\sigma/\sqrt{N}$, cioè la radice del bound. Nella figura delle note ($N = 12$, $\sigma \approx 1$) la larghezza è circa 0.29.`,
  },
  // --- proprietà asintotiche (ch2 p15-16, part1 p19-20) ---
  {
    id: 'fc-stimatori-reali',
    kind: 'intuizione',
    q: md`Perché la slide 15 passa dalle proprietà a $N$ finito a quelle asintotiche?`,
    a: md`Perché spesso le stime usate nei problemi reali vengono da stimatori polarizzati (*biased*) e inefficienti (*inefficient*). Unbiased ed efficient sono criteri troppo severi per essere l'unico metro: si guarda allora il comportamento per grandi insiemi di osservazioni (*for large sets of observations*).`,
  },
  {
    id: 'fc-due-fattori-qualita',
    kind: 'proprieta',
    q: md`Da quali due fattori dipende la qualità di uno stimatore secondo le note?`,
    a: md`Dal numero di campioni di training e dalla loro qualità intrinseca (*intrinsic quality*). Il numero limitato di campioni può ridurre molto l'efficacia di uno stimatore; ma aumentare $N$ non rimedia a campioni rumorosi, etichettati male o non rappresentativi.`,
  },
  {
    id: 'fc-infiniti-campioni',
    kind: 'intuizione',
    q: md`Perché, per valutare e confrontare gli stimatori, le note assumono un numero infinito di campioni?`,
    a: md`Per togliere l'effetto della scarsità di dati e giudicare la regola di stima in sé. È la ragione del limite $N \to +\infty$ in tutte le definizioni che seguono: uno stimatore è detto buono se ha buone proprietà asintotiche (*asymptotic properties*).`,
  },
  {
    id: 'fc-asintoticamente-unbiased',
    kind: 'formula',
    q: md`Quando una stima è asintoticamente non polarizzata (*asymptotically unbiased*)?`,
    a: md`$$\lim_{N \to +\infty} E\{\boldsymbol{\varepsilon}\} = \mathbf{0} \;\Longrightarrow\; \lim_{N \to +\infty} E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$$

Al crescere di $N$ il valore atteso dello stimatore si avvicina al valore vero. Ogni stimatore unbiased lo è anche asintoticamente; il viceversa non vale.`,
  },
  {
    id: 'fc-asintoticamente-efficiente',
    kind: 'formula',
    q: md`Quando una stima è asintoticamente efficiente (*asymptotically efficient*)? Perché si usa un rapporto?`,
    a: md`$$\lim_{N \to +\infty} \frac{\operatorname{var}\{\varepsilon_i\}}{[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1, \qquad i = 1, 2, \ldots, r$$

Varianza e bound tendono entrambi a zero: la loro differenza andrebbe a zero per quasi ogni stimatore. Il rapporto controlla che ci vadano con la stessa velocità, cioè che lo stimatore raggiunga il bound nel limite di campioni numerosi.`,
  },
  {
    id: 'fc-consistente',
    kind: 'formula',
    q: md`Quando una stima è consistente (*consistent*)?`,
    a: md`Quando converge al valore vero per $N \to +\infty$:

$$\lim_{N \to +\infty} P\{\|\boldsymbol{\varepsilon}\| < \delta\} = 1 \qquad \forall \delta > 0$$

Raccogliendo sempre più campioni, la stima finisce arbitrariamente vicina al vero con probabilità che tende a 1.`,
  },
  {
    id: 'fc-leggere-la-consistenza',
    kind: 'procedura',
    q: md`Leggi simbolo per simbolo la formula della consistenza.`,
    a: md`- $\|\boldsymbol{\varepsilon}\|$: norma dell'errore; con $r = 1$ è $\vert\hat{\theta} - \theta\vert$.
- $\delta$: tolleranza positiva scelta a piacere, anche piccolissima.
- $P\{\|\boldsymbol{\varepsilon}\| < \delta\}$: probabilità, sui training set di $N$ campioni, che la stima cada entro $\delta$ dal vero.
- limite 1 **per ogni** $\delta$: basta prendere $N$ abbastanza grande.

In statistica si chiama convergenza in probabilità (*convergence in probability*); la fonte dice solo «converges to the true value».`,
  },
  {
    id: 'fc-condizione-consistenza',
    kind: 'proprieta',
    q: md`Qual è la condizione per la consistenza secondo la slide 16? Che cosa va precisato all'orale?`,
    a: md`La slide la chiama condizione necessaria (*necessary condition*; le note: «necessary conditions»): la stima dev'essere asintoticamente unbiased e con varianza che tende a zero per $N \to +\infty$:

$$\lim_{N \to +\infty} E\{\boldsymbol{\varepsilon}\} = \mathbf{0}, \qquad \lim_{N \to +\infty} \operatorname{var}\{\varepsilon_i\} = 0$$

Nella statistica standard queste due condizioni insieme sono **sufficienti** (disuguaglianza di Chebyshev) e, a rigore, non strettamente necessarie. Riporto la frase del docente e so mostrare perché bastano.`,
  },
  {
    id: 'fc-chebyshev-consistenza',
    kind: 'procedura',
    q: md`Mostra in tre passi che bias → 0 e varianza → 0 portano alla consistenza.`,
    a: md`1. Chebyshev (Markov su $\varepsilon_i^2$): $P\{\vert\varepsilon_i\vert \geq \delta\} \leq \frac{E\{\varepsilon_i^2\}}{\delta^2}$.
2. Scomposizione: $E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + (E\{\varepsilon_i\})^2 \to 0$.
3. Quindi $P\{\vert\varepsilon_i\vert \geq \delta\} \to 0$ e $P\{\vert\varepsilon_i\vert < \delta\} \to 1$ per ogni $\delta > 0$.

Nel caso vettoriale uso $E\{\|\boldsymbol{\varepsilon}\|^2\} = \sum_i E\{\varepsilon_i^2\}$. Serve che la varianza esista finita, almeno per $N$ grande.`,
  },
  {
    id: 'fc-fiducia-grandi-dataset',
    kind: 'intuizione',
    q: md`Che cosa guadagno, secondo le note, se le proprietà asintotiche sono soddisfatte?`,
    a: md`Più fiducia nell'affidabilità (*reliability*) e nell'accuratezza (*accuracy*) degli stimatori quando li applico a grandi insiemi di dati.`,
  },
  {
    id: 'fc-pagella-proprieta',
    kind: 'confronto',
    q: md`Riassumi le cinque proprietà di uno stimatore: quali valgono a $N$ finito e quali per $N \to +\infty$?`,
    a: md`- **$N$ finito**: unbiased ($E\{\boldsymbol{\varepsilon}\} = 0$); efficient (unbiased e varianza uguale al bound).
- **$N \to +\infty$**: asymptotically unbiased (bias → 0); asymptotically efficient (varianza/bound → 1); consistent ($P\{\|\boldsymbol{\varepsilon}\| < \delta\} \to 1$ per ogni $\delta$).

Ogni proprietà a $N$ finito implica la sua versione asintotica, non il viceversa. Schema per l'orale: stima aleatoria, errore, bias e varianza, Cramér-Rao ed efficienza, proprietà asintotiche, la ML le ha tutte e tre.`,
  },
  {
    id: 'fc-controesempi-proprieta',
    kind: 'confronto',
    q: md`Dai un controesempio per ciascuna implicazione falsa tra le proprietà, sulla media $m$ di una gaussiana. (integrazione)`,
    a: md`- unbiased non implica consistente: $\hat{m} = x_1$ (varianza $\sigma^2$ per ogni $N$);
- consistente non implica asintoticamente efficiente: la mediana campionaria (varianza/bound → $\pi/2 \approx 1.57$);
- varianza → 0 non basta senza bias → 0: $\hat{m} = \bar{x} + c$ converge a $m + c$;
- asintoticamente unbiased non implica unbiased: la varianza ML, con fattore $(N-1)/N$.`,
  },
  {
    id: 'fc-covarianza-ml-biased',
    kind: 'formula',
    q: md`Qual è l'esempio del corso (ch2 p31) di stima biased ma asintoticamente unbiased?`,
    a: md`La covarianza ML di una gaussiana da $N$ campioni iid:

$$E\{\hat{\mathbf{m}}\} = \mathbf{m}, \qquad E\{\hat{\Sigma}\} = \frac{N-1}{N}\,\Sigma$$

Il bias $-\Sigma/N$ tende a zero. Lo stimatore elementare unbiased usa $\frac{1}{N-1}$ al posto di $\frac{1}{N}$. La slide dichiara le stime ML di media e covarianza «asymptotically unbiased and efficient, and consistent».`,
  },
  {
    id: 'fc-varianza-ml-rapporto',
    kind: 'procedura',
    q: md`Stima ML della varianza di una gaussiana con $\sigma^2 = 4$ e $N = 5$: valore atteso, varianza, bound e rapporto. Perché il rapporto è sotto 1?`,
    a: md`- $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2 = 3.2$ (bias $-0.8$);
- $\operatorname{var}\{\hat{\sigma}^2\} = \frac{2(N-1)}{N^2}\sigma^4 = 5.12$;
- bound $2\sigma^4/N = 6.4$; rapporto $\frac{N-1}{N} = 0.8$.

Il rapporto scende sotto 1 perché lo stimatore è biased e il bound vale per gli unbiased. Per $N \to +\infty$ il rapporto tende a 1: asintoticamente efficiente, oltre che asintoticamente unbiased e consistente.`,
  },
  // --- stima ML (part1 p20-21, slide ch2 p17-19) ---
  {
    id: 'fc-definizione-ml',
    kind: 'formula',
    q: md`Scrivi la stima a massima verosimiglianza (ML) nelle due forme delle note.`,
    a: md`$$\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X}|\boldsymbol{\theta}) = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X}|\boldsymbol{\theta})$$

È il valore di $\boldsymbol{\theta}$ che massimizza la likelihood costruita sui dati osservati. Le due forme danno lo stesso punto perché il logaritmo è monotono crescente.`,
  },
  {
    id: 'fc-variare-theta',
    kind: 'intuizione',
    q: md`Che cosa succede, intuitivamente, quando faccio variare $\boldsymbol{\theta}$ nella likelihood?`,
    a: md`Ogni $\boldsymbol{\theta}$ genera una pdf diversa, con il suo valore di likelihood sui dati. La stima ML è il $\boldsymbol{\theta}$ che si accorda più strettamente (*most closely aligns*) con i campioni osservati: quello che rende massima la probabilità di osservare proprio quei dati sotto il modello.`,
  },
  {
    id: 'fc-log-likelihood',
    kind: 'proprieta',
    q: md`Perché si lavora con la log-likelihood (*log-likelihood*)? Due motivi.`,
    a: md`1. Il logaritmo è monotono crescente: $p(\mathbf{X}|\boldsymbol{\theta}_1) > p(\mathbf{X}|\boldsymbol{\theta}_2) \iff \ln p(\mathbf{X}|\boldsymbol{\theta}_1) > \ln p(\mathbf{X}|\boldsymbol{\theta}_2)$, quindi il massimo non si sposta.
2. Trasforma i prodotti in somme (*analytical purposes*):

$$\ln p(\mathbf{X}|\boldsymbol{\theta}) = \sum_{k=1}^{N} \ln p(\mathbf{x}_k|\boldsymbol{\theta})$$

Si deriva termine a termine e si evitano i valori minuscoli del prodotto.`,
  },
  {
    id: 'fc-ml-singola-osservazione',
    kind: 'procedura',
    q: md`Stima ML della media di una gaussiana 1-D con varianza nota da una sola osservazione $x_0$: ricava il risultato e leggi la figura.`,
    a: md`$\ln p(x_0|m) = -\ln(\sqrt{2\pi}\,\sigma) - \frac{(x_0 - m)^2}{2\sigma^2}$; la derivata $\frac{x_0 - m}{\sigma^2} = 0$ dà $\hat{m} = x_0$, e la derivata seconda $-1/\sigma^2$ conferma il massimo.

Nella figura («ML search») cinque gaussiane, centrate in $-2$, $-1.5$, $0$, $1$, $1.5$, scorrono lungo l'asse; le tacche sulla linea tratteggiata in $x_0$ danno la likelihood di ciascuna. Vince la curva centrata su $x_0$: $\hat{m} = x_0$. La stima è unbiased con varianza $\sigma^2$, pari al bound con $N = 1$: è efficiente.`,
  },
  {
    id: 'fc-ml-stimatore-efficiente',
    kind: 'proprieta',
    q: md`Che legame c'è tra stima ML ed efficienza (part1 p20, slide ch2 p19)?`,
    a: md`Sotto certe ipotesi su $p(\mathbf{x}|\boldsymbol{\theta})$ (condizioni di regolarità, che la fonte non precisa): **se esiste uno stimatore efficiente e la stima ML è unbiased, allora la stima ML è proprio lo stimatore efficiente.**

Idea: il bound è raggiunto solo se lo score vale $a(\theta)(\hat{\theta}_{eff} - \theta)$; lo score si annulla nella stima ML, quindi $\hat{\theta}_{ML} = \hat{\theta}_{eff}$.`,
  },
  {
    id: 'fc-ml-tre-proprieta',
    kind: 'proprieta',
    q: md`La stima ML è un buon stimatore anche quando uno stimatore efficiente non esiste?`,
    a: md`Sì, nel senso asintotico. La stima ML è:

- **asintoticamente unbiased**: converge in valore atteso al valore vero;
- **asintoticamente efficiente**: raggiunge la varianza più bassa tra gli stimatori unbiased al crescere di $N$;
- **consistente**: converge al valore vero al crescere delle osservazioni.

Ipotesi sottintese: campioni iid, modello corretto, regolarità, parametri identificabili. Queste proprietà spiegano perché la ML è così usata nei problemi reali e nel machine learning.`,
  },
  {
    id: 'fc-ml-esponenziale',
    kind: 'confronto',
    q: md`Tempi tra allarmi esponenziali: confronta la ML del tasso $\lambda$ e la ML del tempo medio $\tau = 1/\lambda$. (integrazione)`,
    a: md`- $\hat{\tau}_{ML} = \bar{x}$: unbiased, varianza $\tau^2/N$ uguale al bound, efficiente per ogni $N$.
- $\hat{\lambda}_{ML} = N/\sum_k x_k$: $E\{\hat{\lambda}_{ML}\} = \frac{N}{N-1}\lambda$ (biased) e rapporto varianza/bound $\frac{N^3}{(N-1)^2(N-2)}$, maggiore di 1. Per $\lambda$ uno stimatore efficiente non esiste, ma la ML è asintoticamente unbiased, asintoticamente efficiente e consistente.

Con $\lambda = 2$ e $N = 10$: $E \approx 2.22$ e rapporto $\approx 1.54$; con $N = 100$: $E \approx 2.02$ e rapporto $\approx 1.04$.`,
  },
  {
    id: 'fc-ml-e-bayes-infinito',
    kind: 'intuizione',
    q: md`Che cosa c'entra la consistenza della ML con la domanda «in which case ML and Bayesian are the same?»`,
    a: md`Nel limite di infiniti campioni l'informazione dei dati domina quella della prior, purché la prior non escluda il valore vero: anche la soluzione bayesiana si concentra sul valore a cui converge la ML. Con $N \to +\infty$ le due stime diventano equivalenti. È solo il primo dei due casi della slide ch2 p40: il secondo è la prior $p(\boldsymbol{\theta})$ uniforme, cioè nessuna conoscenza a priori, con cui la prior non sposta la posterior e la soluzione bayesiana si riduce a quella ML anche con pochi dati. Con pochi dati e una prior informativa, invece, la prior conta e le stime differiscono. In pratica la ML è spesso preferita per la complessità di calcolo più bassa e l'interpretabilità più facile.`,
  },
  // --- scelta del modello statistico (part1 p21) ---
  {
    id: 'fc-tre-aspetti-modello',
    kind: 'procedura',
    q: md`Quali tre aspetti considero quando scelgo un modello statistico per $p(\mathbf{x})$?`,
    a: md`1. **Natura statistica intrinseca del fenomeno** (*intrinsic statistical nature of the phenomenon*): le caratteristiche fisiche di ciò che misuro.
2. **Caratteristiche del rumore** (*noise characteristics*): rumore di trasmissione e acquisizione, dal mezzo di propagazione o dai sensori.
3. **Pre-processing ed estrazione delle feature** (*pre-processing and feature extraction*): le trasformazioni prima del sistema di riconoscimento.

Scegliere e applicare bene questi passi migliora l'efficacia del modello scelto.`,
  },
  {
    id: 'fc-natura-fenomeno',
    kind: 'intuizione',
    q: md`Perché la natura fisica del fenomeno orienta la scelta del modello? Fai un esempio.`,
    a: md`La forma della distribuzione nasce dalla fisica di ciò che misuro. Una grandezza solo positiva (un tempo di attesa, un'ampiezza) si adatta male alla gaussiana, che dà probabilità ai valori negativi, e porta verso Gamma o Rayleigh; una somma di molti contributi piccoli porta verso la gaussiana; l'ampiezza di un segnale radar diffuso porta verso Rayleigh.`,
  },
  {
    id: 'fc-rumore-passivo-attivo',
    kind: 'definizione',
    q: md`Da dove può provenire il rumore da valutare nella scelta del modello?`,
    a: md`Il rumore entra nelle fasi di trasmissione e di acquisizione del segnale. Secondo le note proviene dal mezzo di propagazione (*propagation medium*, «passive») o dai sensori (*sensors*, «active»), e incide molto sulle prestazioni del modello. La slide ch2 p20 scrive «(passive/active)» riferito alle due fasi: l'abbinamento esatto è ambiguo.`,
  },
  {
    id: 'fc-preprocessing-cambia-distribuzione',
    kind: 'intuizione',
    q: md`Perché il pre-processing e l'estrazione delle feature influenzano la scelta del modello?`,
    a: md`Ogni trasformazione applicata ai dati prima del sistema di riconoscimento cambia la forma della loro distribuzione. Il logaritmo rende gaussiana una grandezza log-normale; una media di molti pixel si avvicina a una gaussiana; un rapporto tra bande cambia supporto e asimmetria.`,
  },
  {
    id: 'fc-sei-modelli',
    kind: 'confronto',
    q: md`Quali sono i sei modelli statistici più usati secondo le note, e a che cosa serve ciascuno?`,
    a: md`- **Gaussiano** (*Gaussian*): dati che seguono una distribuzione normale.
- **Gaussiano generalizzato** (*Generalized Gaussian*): alternativa flessibile per varie distribuzioni.
- **Gamma**: dati continui non negativi, teoria delle code (*queuing theory*).
- **Rayleigh**: radar e comunicazioni, segnali diffusi (*scattered signals*).
- **Chi-quadrato** (*Chi-square*): test di ipotesi e bontà di adattamento (*goodness-of-fit*).
- **Log-Normale** (*Log-Normal*): variabili con asimmetria positiva (*positively skewed*), come i dati finanziari.`,
  },
  {
    id: 'fc-gaussiana-generalizzata',
    kind: 'definizione',
    q: md`Che cosa aggiunge il modello gaussiano generalizzato rispetto alla gaussiana?`,
    a: md`Un parametro di forma: al variare di questo passa da distribuzioni appuntite con code pesanti a distribuzioni quasi piatte, e contiene la gaussiana come caso particolare. Per questo le note lo chiamano un'alternativa flessibile che può rappresentare varie distribuzioni di dati.`,
  },
  {
    id: 'fc-modelli-per-dati-positivi',
    kind: 'confronto',
    q: md`Tra i sei modelli, quali si usano per grandezze non negative e con quale uso tipico?`,
    a: md`Gamma (dati continui non negativi, code d'attesa), Rayleigh (ampiezze di segnali radar diffusi), Chi-quadrato (statistiche di test, bontà di adattamento), Log-Normale (grandezze con asimmetria positiva, come prezzi e redditi). Gaussiana e gaussiana generalizzata invece coprono tutta la retta reale.`,
  },
  // --- terminologia, ipotesi, controesempi (integrazioni) ---
  {
    id: 'fc-estimate-estimator',
    kind: 'confronto',
    q: md`«Estimate» o «estimator»: le slide e le note li distinguono?`,
    a: md`No: le slide dicono quasi sempre *estimate* («An estimate is said unbiased»), le note quasi sempre *estimator*, e la slide 15 li usa entrambi. A rigore lo stimatore (*estimator*) è la regola $\hat{\boldsymbol{\theta}}(\cdot)$, la stima (*estimate*) è il valore $\hat{\boldsymbol{\theta}}(\mathbf{X})$ su un training set. Unbiased, efficient e consistent sono proprietà della regola, perché si definiscono mediando su tutti i possibili $\mathbf{X}$.`,
  },
  {
    id: 'fc-due-estimation-error',
    kind: 'confronto',
    q: md`«Estimation error» in questo modulo e nel Cap. 4: stessa cosa?`,
    a: md`No.

- Qui: il vettore aleatorio $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$, distanza tra i parametri stimati di una pdf e quelli veri.
- Cap. 4 (errore di generalizzazione): la parte dell'errore dovuta all'apprendimento da un training set limitato invece che dall'intera popolazione, contrapposta all'errore di approssimazione dello spazio delle ipotesi.

Sono parenti (entrambi nascono dal training set finito e calano con $N$), ma riguardano oggetti diversi.`,
  },
  {
    id: 'fc-ipotesi-dei-risultati',
    kind: 'procedura',
    q: md`Elenca le ipotesi sotto cui valgono i risultati principali del modulo.`,
    a: md`- **Likelihood come prodotto**: campioni iid.
- **Bias e varianza**: $\boldsymbol{\theta}$ fisso ma ignoto, $N$ fissato, medie sui training set.
- **Cramér-Rao**: stimatore unbiased per ogni $\boldsymbol{\theta}$, regolarità di $p(\mathbf{X}|\boldsymbol{\theta})$ (supporto indipendente da $\boldsymbol{\theta}$, scambio derivata-integrale), matrice di Fisher invertibile.
- **Consistenza via bias e varianza**: varianza finita.
- **Proprietà asintotiche della ML**: iid, modello corretto, regolarità, parametri identificabili. Se il modello è sbagliato non c'è un valore vero a cui convergere: per questo la scelta del modello viene prima della stima.`,
  },
  {
    id: 'fc-uniforme-bound-violato',
    kind: 'intuizione',
    q: md`Campioni uniformi su $[0, \theta]$: perché uno stimatore unbiased può stare sotto il «bound» di Cramér-Rao? (integrazione)`,
    a: md`La stima ML è $M = \max_k x_k$, biased: $E\{M\} = \frac{N}{N+1}\theta$. Corretta, $\tilde{\theta} = \frac{N+1}{N}M$ è unbiased con varianza $\frac{\theta^2}{N(N+2)}$. La formula della slide applicata alla cieca dà un «bound» $\theta^2/N^2$, più grande. Nessuna contraddizione: il supporto dipende da $\theta$, lo scambio tra derivata e integrale non è lecito e lo score $-N/\theta$ non ha media nulla. Segnale: la varianza scende come $1/N^2$, più in fretta di qualunque bound regolare.`,
  },
  {
    id: 'fc-ridge-sotto-il-bound',
    kind: 'intuizione',
    q: md`Perché nei problemi reali si scelgono apposta stimatori biased? L'esempio della ridge a un parametro. (integrazione)`,
    a: md`Con $y_k = \theta x_k + n_k$ e $S = \sum_k x_k^2$, i minimi quadrati sono unbiased ed efficienti (varianza $\sigma^2/S$). La ridge $\hat{\theta}_\lambda = \frac{S}{S+\lambda}\hat{\theta}_0$ è biased ma ha varianza $\frac{\sigma^2 S}{(S+\lambda)^2}$, sotto il bound. Con $\lambda^* = \sigma^2/\theta^2$ l'errore quadratico medio scende a $\frac{\sigma^2}{S + \lambda^*}$. Nell'esempio delle case: 57.1 contro 133.3. Per $N \to +\infty$ il fattore $S/(S+\lambda)$ tende a 1 e i due stimatori si equivalgono.`,
  },
]
