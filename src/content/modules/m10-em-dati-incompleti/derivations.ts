// Derivazioni del foglio m10 (stima con dati incompleti, algoritmo EM): der01-der09 dell'inventario.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più servono a seguire i conti
// che la fonte salta (controllati sulle immagini di ch2 p67-77 e part1 p45-50) e sono stati ricalcolati.
// Unica eccezione alla copia letterale: der08, ultimo passo dell'inventario, conteneva nel LaTeX il codice interno
// dell'esempio svolto ("dati di ex03"), che sarebbe stato visibile allo studente: qui è riscritto senza il codice
// (stessi numeri). formula-coverage lo segnalerà come "non ritrovato": è presente, riscritto.
// Numeri verificati con uno script: esempio dei quattro punti (theta^1..theta^6, limite 1 e 2/3), esempio delle sei
// luminosità (posterior, N_1 = 2.989, gradiente 0.18533 anche con differenze finite, m^[1] = (3.062, 6.592)).
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivations: Derivation[] = [
  // --- der01 Dalla ML alla log-verosimiglianza della mistura --------------------------------------------
  {
    id: 'der01',
    title: 'Dalla ML alla log-verosimiglianza della mistura: perché non esiste una soluzione analitica',
    goal: md`Mostrare che, mettendo la mistura di gaussiane nel problema di stima a massima verosimiglianza (*Maximum Likelihood*, ML) della slide p70, la condizione di massimo diventa un'equazione implicita nei parametri: è il caso difficile (*hard*) che motiva l'algoritmo EM. La slide dice solo *it is not possible to find an analytical solution*: i passi dopo il logaritmo sono lo sviluppo di quella frase.`,
    assumptions: md`$N$ osservazioni $\mathbf{x}_1,\dots,\mathbf{x}_N$ indipendenti e identicamente distribuite (*i.i.d.*) in uno spazio $n$-dimensionale, estratte da una mistura di $M$ modi gaussiani (slide p68). Le covarianze $\Sigma_i$ sono simmetriche e definite positive, i prior $P_i$ positivi, e si cerca un massimo interno, dove le derivate si annullano. I campioni sono indicizzati con $j$ perché $i$ numera i modi: la slide p70 usa $i$ per i campioni, dalla slide p76 i campioni diventano $j$.`,
    steps: [
      {
        latex: md`\boldsymbol{\theta}^{*} = \arg\max \; l(\boldsymbol{\theta} | \mathbf{X}), \qquad l(\boldsymbol{\theta} | \mathbf{X}) = p(\mathbf{X} \,|\, \boldsymbol{\theta}) = \prod_{j=1}^{N} p(\mathbf{x}_j \,|\, \boldsymbol{\theta})`,
        why: md`Richiamo della slide p70 (note part1 p47): la stima ML è il $\boldsymbol{\theta}$ che rende massima la verosimiglianza (*likelihood*) dei dati osservati. Con campioni i.i.d. la densità congiunta di $\mathbf{X}$ è il prodotto delle densità dei singoli campioni.`,
      },
      {
        latex: md`p(\mathbf{x}_j \,|\, \boldsymbol{\theta}) = \sum_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)`,
        why: md`Ogni fattore è la mistura della slide p68: il campione può venire da uno qualunque degli $M$ modi, quindi la sua densità è la somma delle densità dei modi pesate dalle probabilità a priori (*prior probability*) $P_i$.`,
      },
      {
        latex: md`p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) = \frac{1}{(2\pi)^{n/2} \, |\Sigma_i|^{1/2}} \exp\left\{ -\frac{1}{2} (\mathbf{x}_j - \mathbf{m}_i)^{t} \, \Sigma_i^{-1} (\mathbf{x}_j - \mathbf{m}_i) \right\}`,
        why: md`Ogni componente è una gaussiana $n$-dimensionale con vettore media (*mean vector*) $\mathbf{m}_i$ e matrice di covarianza (*covariance matrix*) $\Sigma_i$. L'apice $t$ indica il trasposto, come nelle slide.`,
      },
      {
        latex: md`M = 1: \quad \ln l = \sum_{j=1}^{N} \left[ -\frac{n}{2} \ln(2\pi) - \frac{1}{2} \ln |\Sigma| - \frac{1}{2} (\mathbf{x}_j - \mathbf{m})^{t} \Sigma^{-1} (\mathbf{x}_j - \mathbf{m}) \right] \;\Rightarrow\; \hat{\mathbf{m}} = \frac{1}{N} \sum_{j=1}^{N} \mathbf{x}_j`,
        why: md`Caso facile (*easy*), per confronto. Con una sola gaussiana il logaritmo arriva fino all'esponenziale e lo cancella: la log-verosimiglianza è una somma di forme quadratiche, il gradiente rispetto a $\mathbf{m}$ è $\sum_j \Sigma^{-1}(\mathbf{x}_j - \mathbf{m})$ e annullarlo dà in forma chiusa la media campionaria. È la frase della slide p70: *Depending on the form of p(X|θ), the ML estimation problem can be easy or hard*.`,
      },
      {
        latex: md`\ln l(\boldsymbol{\theta} | \mathbf{X}) = \sum_{j=1}^{N} \ln \left[ \sum_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`,
        why: md`Con la mistura si passa ancora al logaritmo: è crescente, quindi il punto di massimo non cambia, e il prodotto sui campioni diventa una somma. Ma dentro resta il logaritmo di una somma (*log of a sum*): non si spezza, e il logaritmo non raggiunge più gli esponenziali delle gaussiane.`,
      },
      {
        latex: md`\frac{\partial}{\partial \mathbf{m}_i} \ln \left[ \sum_{l=1}^{M} P_l \, p(\mathbf{x}_j \,|\, \mathbf{m}_l, \Sigma_l) \right] = \frac{P_i \, \dfrac{\partial}{\partial \mathbf{m}_i} p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)}{\sum_{l=1}^{M} P_l \, p(\mathbf{x}_j \,|\, \mathbf{m}_l, \Sigma_l)}`,
        why: md`Derivata del logaritmo di una funzione, $(\ln f)' = f'/f$: la somma intera resta a denominatore, mentre al numeratore sopravvive solo il termine del modo $i$, l'unico che contiene $\mathbf{m}_i$. L'indice della somma diventa $l$ per non confonderlo con il modo $i$ fissato.`,
      },
      {
        latex: md`\frac{\partial}{\partial \mathbf{m}_i} p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) = p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \, \Sigma_i^{-1} (\mathbf{x}_j - \mathbf{m}_i)`,
        why: md`La derivata dell'esponenziale è l'esponenziale stesso (cioè la gaussiana) per la derivata dell'esponente. Con $\Sigma_i^{-1}$ simmetrica, $\frac{\partial}{\partial \mathbf{m}}\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right] = \Sigma^{-1}(\mathbf{x}-\mathbf{m})$.`,
      },
      {
        latex: md`\frac{\partial \ln l}{\partial \mathbf{m}_i} = \sum_{j=1}^{N} \frac{P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)}{\sum_{l=1}^{M} P_l \, p(\mathbf{x}_j \,|\, \mathbf{m}_l, \Sigma_l)} \; \Sigma_i^{-1} (\mathbf{x}_j - \mathbf{m}_i) = \mathbf{0}`,
        why: md`Si mettono insieme i due passi precedenti, si somma sui campioni e si annulla il gradiente: è la condizione di massimo rispetto alla media del modo $i$. Il rapporto davanti a $\Sigma_i^{-1}(\mathbf{x}_j - \mathbf{m}_i)$ è la frazione della densità in $\mathbf{x}_j$ dovuta al modo $i$.`,
      },
      {
        latex: md`\sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}) \, (\mathbf{x}_j - \mathbf{m}_i) = \mathbf{0} \;\Rightarrow\; \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}) \, \mathbf{x}_j = \mathbf{m}_i \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta})`,
        why: md`Quel rapporto si chiama $P(i|\mathbf{x}_j, \boldsymbol{\theta})$: per il teorema di Bayes è la probabilità a posteriori (*posterior probability*) che $\mathbf{x}_j$ venga dal modo $i$. Si moltiplica a sinistra per $\Sigma_i$, che è invertibile, e si porta $\mathbf{m}_i$ fuori dalla somma.`,
      },
      {
        latex: md`\mathbf{m}_i = \frac{\sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}) \, \mathbf{x}_j}{\sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta})}, \qquad P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}) = \frac{P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)}{\sum_{l=1}^{M} P_l \, p(\mathbf{x}_j \,|\, \mathbf{m}_l, \Sigma_l)}`,
        why: md`In apparenza $\mathbf{m}_i$ è la media dei campioni pesata dalle posterior. Ma i pesi dipendono da tutto $\boldsymbol{\theta}$, $\mathbf{m}_i$ compreso: $\mathbf{m}_i$ sta a sinistra e anche dentro i pesi a destra. L'equazione è implicita, e lo stesso vale per $\Sigma_i$ e $P_i$: non esiste una forma chiusa (*it is not possible to find an analytical solution*, slide p70).`,
      },
      {
        latex: md`\mathbf{m}_i^{[k+1]} = \frac{\sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, \mathbf{x}_j}{\sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}`,
        why: md`L'equazione implicita suggerisce uno schema iterativo a punto fisso (*fixed-point iteration*): si calcolano i pesi con la stima corrente $\boldsymbol{\theta}^{[k]}$ e se ne ricava una media nuova, poi si ripete. È esattamente l'aggiornamento EM delle medie della slide p76 ([«come si ricavano le tre equazioni EM»](#derivation:der05)).`,
      },
    ],
    conclusion: md`Per la mistura la log-verosimiglianza è una somma di logaritmi di somme: annullare il gradiente dà una media pesata con pesi che dipendono dai parametri incogniti, cioè un'equazione implicita senza soluzione analitica. Bisogna ricorrere a tecniche più elaborate (*more elaborate techniques*, slide p70), e l'algoritmo EM è una di queste: trasforma l'iterazione a punto fisso in un metodo che non fa mai scendere la verosimiglianza.`,
    source: [{ doc: 'ch2', page: 68 }, { doc: 'ch2', page: 70 }, { doc: 'part1', page: 47 }, { doc: 'ch2', page: 76 }],
  },

  // --- der02 Dataset completo e le due verosimiglianze ---------------------------------------------------
  {
    id: 'der02',
    title: 'Dataset completo, densità congiunta e le due verosimiglianze',
    goal: md`Costruire la formulazione del problema con dati incompleti: dal dataset completo $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$ alla verosimiglianza dei dati completi e a quella dei dati incompleti, e vedere perché nella mistura la prima sarebbe facile da massimizzare.`,
    assumptions: md`Ipotesi della slide p71: $\mathbf{X}$ è osservato e generato da una distribuzione (dataset incompleto, *incomplete dataset*); esiste un dataset completo (*complete dataset*) che contiene anche i dati mancanti (*missing data*) $\mathbf{Y}$. Nella seconda parte, per la mistura: $\mathbf{Y} = \{\mathbf{y}_1,\dots,\mathbf{y}_N\}$, dove $\mathbf{y}_j$ è il vettore binario che indica da quale modo gaussiano viene $\mathbf{x}_j$ (note part1 p47), e le coppie $(\mathbf{x}_j, \mathbf{y}_j)$ sono i.i.d.`,
    steps: [
      {
        latex: md`\mathbf{Z} = (\mathbf{X}, \mathbf{Y})`,
        why: md`Ipotesi della slide p71: accanto ai dati osservati $\mathbf{X}$ si postula l'esistenza dei dati mancanti $\mathbf{Y}$; insieme formano il dataset completo $\mathbf{Z}$. Nelle note (part1 p47) $\mathbf{Y}$ è detto *missing or latent data*: spesso è una variabile latente (*latent variable*), che non si osserva mai.`,
      },
      {
        latex: md`p(\mathbf{Z} \,|\, \boldsymbol{\theta}) = p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = p(\mathbf{Y} | \mathbf{X}, \boldsymbol{\theta}) \cdot p(\mathbf{X} \,|\, \boldsymbol{\theta})`,
        why: md`Densità congiunta (*joint density function*) della slide p71: regola del prodotto applicata alla coppia $(\mathbf{X}, \mathbf{Y})$, congiunta = condizionata di $\mathbf{Y}$ dato $\mathbf{X}$ per marginale di $\mathbf{X}$. Il primo fattore, $p(\mathbf{Y}|\mathbf{X}, \boldsymbol{\theta})$, è quello con cui l'E-step medierà.`,
      },
      {
        latex: md`l(\boldsymbol{\theta} | \mathbf{Z}) = p(\mathbf{Z} \,|\, \boldsymbol{\theta}) = p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta})`,
        why: md`Verosimiglianza dei dati completi (*complete-data likelihood*): la densità congiunta letta come funzione di $\boldsymbol{\theta}$. Contiene sia $\mathbf{X}$ sia $\mathbf{Y}$, quindi è più informativa (*more informative*, note part1 p47). Nella slide l'ultimo $\theta$ non è in grassetto: refuso tipografico senza conseguenze.`,
      },
      {
        latex: md`l(\boldsymbol{\theta} | \mathbf{X}) = p(\mathbf{X} \,|\, \boldsymbol{\theta}) = \int p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}) \, d\mathbf{y}`,
        why: md`Verosimiglianza dei dati incompleti (*incomplete-data likelihood*): è l'unica che si può calcolare, perché usa solo $\mathbf{X}$. Si ottiene dalla congiunta marginalizzando (integrando) sui dati mancanti. La slide scrive solo $l(\boldsymbol{\theta}|\mathbf{X}) = p(\mathbf{X}|\boldsymbol{\theta})$: il legame con l'integrale segue dal passo precedente, integrando entrambi i membri in $\mathbf{y}$. Se $\mathbf{Y}$ è discreta l'integrale è una somma.`,
      },
      {
        latex: md`\mathbf{y}_j = (y_{j1}, \dots, y_{jM})^{t}, \qquad y_{ji} \in \{0, 1\}, \qquad \sum_{i=1}^{M} y_{ji} = 1`,
        why: md`Nella mistura il dato mancante di ogni campione è l'etichetta del suo modo, scritta come vettore binario con un solo 1 (codifica *one-hot*): $y_{ji} = 1$ se $\mathbf{x}_j$ viene dal modo $i$, 0 altrimenti (*a binary vector that indicates which Gaussian mode each sample belongs to*, part1 p47).`,
      },
      {
        latex: md`p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = \prod_{j=1}^{N} p(\mathbf{x}_j, \mathbf{y}_j \,|\, \boldsymbol{\theta})`,
        why: md`Le coppie campione-etichetta sono indipendenti: la congiunta dell'intero dataset è il prodotto delle congiunte dei singoli campioni.`,
      },
      {
        latex: md`p(\mathbf{x}_j, \mathbf{y}_j \,|\, \boldsymbol{\theta}) = \prod_{i=1}^{M} \left[ P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]^{y_{ji}}`,
        why: md`Probabilità di scegliere il modo $i$ ($P_i$) per densità di $\mathbf{x}_j$ in quel modo. L'esponente $y_{ji}$ seleziona il solo modo attivo: gli altri fattori sono elevati alla 0 e valgono 1. I dettagli sono in [«la mistura come modello a variabile latente»](#derivation:der07).`,
      },
      {
        latex: md`\ln p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = \sum_{j=1}^{N} \sum_{i=1}^{M} y_{ji} \left[ \ln P_i + \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`,
        why: md`Il logaritmo trasforma il prodotto sui campioni in una somma e le potenze $y_{ji}$ in coefficienti. Non resta nessun logaritmo di una somma: ogni campione contribuisce con il log di una sola gaussiana, quella del suo modo. Per questo le note (part1 p47) dicono *If we knew the values of Y, we could solve the ML estimation problem directly*: con $\mathbf{Y}$ noto la massimizzazione si fa modo per modo ([«se Y fosse noto»](#derivation:der09)).`,
      },
      {
        latex: md`\ln l(\boldsymbol{\theta} | \mathbf{X}) = \ln \sum_{\mathbf{Y}} p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = \sum_{j=1}^{N} \ln \left[ \sum_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`,
        why: md`La verosimiglianza incompleta, invece, è la marginale: sommando la congiunta su tutti i valori delle etichette torna la mistura, con il logaritmo di una somma per ogni campione ([«perché non esiste una soluzione analitica»](#derivation:der01)). È la funzione *more challenging to maximize because of the missing data* delle note (part1 p48).`,
      },
    ],
    conclusion: md`Il problema con dati incompleti ha due verosimiglianze. Quella dei dati completi, $l(\boldsymbol{\theta}|\mathbf{Z})$, è più informativa e nella mistura facile da massimizzare, ma contiene $\mathbf{Y}$, che non si osserva. Quella dei dati incompleti, $l(\boldsymbol{\theta}|\mathbf{X})$, si calcola ma è difficile da massimizzare. EM sfrutta la prima senza conoscere $\mathbf{Y}$: ne prende il valore atteso rispetto a $\mathbf{Y}$, dati $\mathbf{X}$ e la stima corrente.`,
    source: [{ doc: 'ch2', page: 71 }, { doc: 'part1', page: 47 }, { doc: 'part1', page: 48 }],
  },

  // --- der03 Q: dal valore atteso all'integrale, fino alla mistura ---------------------------------------
  {
    id: 'der03',
    title: "Dall'aspettazione condizionata alla forma integrale di Q, fino al caso discreto della mistura",
    goal: md`Esplicitare il passaggio indicato dalla freccia rossa della slide p72, da $Q$ come valore atteso a $Q$ come integrale, e specializzarlo alla mistura, dove $\mathbf{Y}$ è discreta (etichette di modo): lì l'E-step si riduce a calcolare le probabilità a posteriori dei modi.`,
    assumptions: md`Dataset completo $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$ con $\mathbf{X}$ osservato ([«le due verosimiglianze»](#derivation:der02)). $\boldsymbol{\theta}^{(k)}$ è la stima corrente, un valore numerico noto; $\boldsymbol{\theta}$ è la variabile libera. Nella seconda parte: mistura di $M$ gaussiane con etichette one-hot $\mathbf{y}_j$ e coppie $(\mathbf{x}_j, \mathbf{y}_j)$ indipendenti. Le slide p72-73 scrivono l'iterazione tra tonde, $(k)$, la slide p76 tra quadre, $[k]$: è lo stesso indice.`,
    steps: [
      {
        latex: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{ \log\left( p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) \right) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\}`,
        why: md`Definizione della slide p72: l'algoritmo EM calcola il valore atteso di $\log p(\mathbf{X},\mathbf{Y}|\boldsymbol{\theta})$ rispetto a $\mathbf{y}$ (*w.r.t. y*), dati $\mathbf{X}$ e una stima corrente di $\boldsymbol{\theta}$ (*given X and a current estimate of θ*). Si chiama aspettazione condizionata (*conditional expectation*).`,
      },
      {
        latex: md`\mathbf{Y} \sim p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})`,
        why: md`L'unica quantità aleatoria è $\mathbf{Y}$: $\mathbf{X}$ è osservato e $\boldsymbol{\theta}^{(k)}$ è un numero noto. La legge con cui mediare è quindi la densità di $\mathbf{Y}$ condizionata a $\mathbf{X}$, calcolata con i parametri correnti.`,
      },
      {
        latex: md`p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) = \frac{p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}^{(k)})}{p(\mathbf{X} \,|\, \boldsymbol{\theta}^{(k)})}`,
        why: md`È il fattore $p(\mathbf{Y}|\mathbf{X}, \boldsymbol{\theta})$ della densità congiunta della slide p71, ricavato dalla stessa fattorizzazione e valutato in $\boldsymbol{\theta}^{(k)}$. Con la stima corrente tutte le densità sono funzioni note: questa legge si può calcolare.`,
      },
      {
        latex: md`E\left\{ g(\mathbf{Y}) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\} = \int g(\mathbf{y}) \, p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) \, d\mathbf{y}`,
        why: md`Definizione di valore atteso condizionato di una funzione $g$ di $\mathbf{Y}$: l'integrale di $g$ pesato dalla densità condizionata.`,
      },
      {
        latex: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \int \log\left( p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}) \right) p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) \, d\mathbf{y}`,
        why: md`Si sostituisce $g(\mathbf{y}) = \log p(\mathbf{X}, \mathbf{y}|\boldsymbol{\theta})$: è la seconda formula della slide p72, quella sotto la freccia rossa. I due argomenti di $Q$ hanno ruoli diversi: il peso contiene $\boldsymbol{\theta}^{(k)}$ (fisso), il logaritmo contiene $\boldsymbol{\theta}$ (libero, sarà massimizzato nell'M-step). Mediare su $\mathbf{Y}$ rimuove l'incertezza dovuta alle variabili non osservate (*removes the uncertainty*, note part1 p48).`,
      },
      {
        latex: md`\mathbf{Y} \text{ discreta:} \quad Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \sum_{\mathbf{Y}} \log\left( p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) \right) P(\mathbf{Y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})`,
        why: md`Nella mistura $\mathbf{Y}$ prende un numero finito di valori, un modo per ogni campione: l'integrale diventa una somma su tutte le configurazioni di etichette. Sono $M^N$, troppe per calcolarle una per una: i passi seguenti riducono il conto a $N \cdot M$ termini.`,
      },
      {
        latex: md`P(\mathbf{Y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) = \frac{\prod_{j=1}^{N} p(\mathbf{x}_j, \mathbf{y}_j \,|\, \boldsymbol{\theta}^{(k)})}{\prod_{j=1}^{N} p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{(k)})} = \prod_{j=1}^{N} P(\mathbf{y}_j \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{(k)})`,
        why: md`Le coppie $(\mathbf{x}_j, \mathbf{y}_j)$ sono indipendenti: congiunta e marginale si fattorizzano sui campioni, e il rapporto si spezza campione per campione. L'etichetta di $\mathbf{x}_j$ dipende quindi dal solo $\mathbf{x}_j$: condizionare su tutto $\mathbf{X}$ equivale a condizionare su $\mathbf{x}_j$.`,
      },
      {
        latex: md`\ln p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = \sum_{j=1}^{N} \sum_{i=1}^{M} y_{ji} \left[ \ln P_i + \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right] \;\Rightarrow\; Q = \sum_{j=1}^{N} \sum_{i=1}^{M} E\{ y_{ji} \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]} \} \left[ \ln P_i + \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`,
        why: md`Nella mistura il log della congiunta è lineare negli indicatori binari $y_{ji}$ (ultimo passo di [«le due verosimiglianze»](#derivation:der02)). Il valore atteso è lineare: passa dentro le somme e agisce solo sugli $y_{ji}$, perché le parentesi quadre non contengono variabili latenti. Per il passo precedente il valore atteso di $y_{ji}$ è condizionato al solo $\mathbf{x}_j$.`,
      },
      {
        latex: md`E\{ y_{ji} \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]} \} = 1 \cdot P(y_{ji} = 1 \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) + 0 \cdot P(y_{ji} = 0 \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})`,
        why: md`Il valore atteso di una variabile che vale 0 o 1 è la probabilità che valga 1. Qui è la probabilità che $\mathbf{x}_j$ venga dal modo $i$, data la stima corrente: la probabilità a posteriori del modo (*posterior probability*, detta anche *responsibility*).`,
      },
      {
        latex: md`P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = \frac{P_i^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{\sum_{l=1}^{M} P_l^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_l^{[k]}, \Sigma_l^{[k]})}`,
        why: md`Teorema di Bayes con i parametri correnti: prior del modo per densità del campione in quel modo, diviso la mistura corrente valutata in $\mathbf{x}_j$. Sono numeri che si calcolano una volta per iterazione: è tutto il lavoro dell'E-step. È il rapporto che compare in tutte le equazioni della slide p76.`,
      },
      {
        latex: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{[k]}) = \sum_{j=1}^{N} \sum_{i=1}^{M} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \left[ \ln P_i + \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`,
        why: md`Risultato: l'integrale della slide p72 è diventato una somma sui modi per ciascun campione, pesata dalla posterior del modo $i$ dato $\mathbf{x}_j$; la parentesi è $\log p(\mathbf{x}_j, y_{ji} = 1|\boldsymbol{\theta}) = \ln P_i + \ln p(\mathbf{x}_j|\mathbf{m}_i,\Sigma_i)$. È la $Q$ che l'M-step massimizza per ottenere le equazioni della slide p76 ([«come si ricavano le tre equazioni EM»](#derivation:der05)).`,
      },
    ],
    conclusion: md`$Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ è la log-verosimiglianza dei dati completi mediata sulla legge dei dati mancanti calcolata con la stima corrente. Nella mistura la media si fa sostituendo ogni indicatore $y_{ji}$ con la posterior $P(i|\mathbf{x}_j, \boldsymbol{\theta}^{[k]})$: l'E-step calcola $N \cdot M$ posterior, l'M-step massimizza una somma pesata di log di singole gaussiane, senza logaritmi di somme.`,
    source: [{ doc: 'ch2', page: 72 }, { doc: 'part1', page: 48 }, { doc: 'ch2', page: 76 }],
  },

  // --- der04 Monotonia di EM -------------------------------------------------------------------------------
  {
    id: 'der04',
    title: 'Perché EM non fa mai scendere la log-verosimiglianza',
    goal: md`Dimostrare la disuguaglianza della slide p74, $l(\boldsymbol{\theta}^{(i+1)}) \ge l(\boldsymbol{\theta}^{(i)})$. La fonte dice solo *It can be shown* (slide) e *it can be proven* (note part1 p49): questa è la dimostrazione standard, riportata come approfondimento per l'orale.`,
    assumptions: md`Modello qualunque con variabili latenti $\mathbf{y}$ (se $\mathbf{Y}$ è discreta gli integrali diventano somme). $l(\boldsymbol{\theta}) = \ln p(\mathbf{X}|\boldsymbol{\theta})$ è la log-verosimiglianza dei dati osservati (*log-likelihood function*). Si integra dove $p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)}) > 0$. L'M-step sceglie $\boldsymbol{\theta}^{(k+1)}$ con $Q(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) \ge Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$. La slide scrive l'iterazione con $i$, qui si usa $k$ come nella definizione di $Q$.`,
    steps: [
      {
        latex: md`p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}) = p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}) \cdot p(\mathbf{X} \,|\, \boldsymbol{\theta})`,
        why: md`Punto di partenza: la fattorizzazione della densità congiunta della slide p71, scritta per un valore qualunque $\mathbf{y}$ dei dati mancanti.`,
      },
      {
        latex: md`\ln p(\mathbf{X} \,|\, \boldsymbol{\theta}) = \ln p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}) - \ln p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta})`,
        why: md`Si prende il logaritmo (il prodotto diventa una somma) e si isola $\ln p(\mathbf{X}|\boldsymbol{\theta})$. L'identità vale per qualunque $\mathbf{y}$.`,
      },
      {
        latex: md`\int \ln p(\mathbf{X} \,|\, \boldsymbol{\theta}) \, p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) \, d\mathbf{y} = \ln p(\mathbf{X} \,|\, \boldsymbol{\theta}) \int p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) \, d\mathbf{y} = \ln p(\mathbf{X} \,|\, \boldsymbol{\theta})`,
        why: md`Si moltiplicano entrambi i membri per $p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})$ e si integra in $\mathbf{y}$, cioè si prende il valore atteso con la legge dell'E-step. Il membro sinistro non dipende da $\mathbf{y}$ ed esce dall'integrale; la densità integra a 1, quindi resta invariato.`,
      },
      {
        latex: md`l(\boldsymbol{\theta}) = \ln p(\mathbf{X} \,|\, \boldsymbol{\theta}) = Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}), \qquad H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \int \ln p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}) \, p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) \, d\mathbf{y}`,
        why: md`A destra il primo termine mediato è esattamente la forma integrale di $Q$ della slide p72; il secondo si chiama $H$. La log-verosimiglianza è la differenza dei due, per ogni $\boldsymbol{\theta}$ e ogni stima corrente $\boldsymbol{\theta}^{(k)}$.`,
      },
      {
        latex: md`l(\boldsymbol{\theta}^{(k+1)}) - l(\boldsymbol{\theta}^{(k)}) = \left[ Q(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) \right] - \left[ H(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) \right]`,
        why: md`Si scrive l'identità del passo precedente in $\boldsymbol{\theta}^{(k+1)}$ e in $\boldsymbol{\theta}^{(k)}$, con lo stesso secondo argomento $\boldsymbol{\theta}^{(k)}$, e si sottrae. Basta ora mostrare che la prima parentesi è $\ge 0$ e la seconda $\le 0$.`,
      },
      {
        latex: md`Q(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) \ge Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})`,
        why: md`È l'M-step della slide p73: $\boldsymbol{\theta}^{(k+1)} = \arg\max Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ vale almeno quanto $Q$ in qualunque altro punto, in particolare nel punto vecchio $\boldsymbol{\theta}^{(k)}$. La prima parentesi è non negativa.`,
      },
      {
        latex: md`E\{ \ln r(\mathbf{Y}) \} \le \ln E\{ r(\mathbf{Y}) \}`,
        why: md`Disuguaglianza di Jensen (*Jensen's inequality*) per una funzione concava: la media dei logaritmi è al più il logaritmo della media. Il logaritmo è concavo, e $r$ è una qualunque funzione positiva della variabile aleatoria $\mathbf{Y}$.`,
      },
      {
        latex: md`H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) = \int \ln \frac{p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta})}{p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})} \, p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) \, d\mathbf{y} \;\le\; \ln \int p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}) \, d\mathbf{y} = \ln 1 = 0`,
        why: md`Le due $H$ hanno lo stesso peso $p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})$, quindi la differenza dei log diventa il log di un rapporto. Si applica Jensen con $r = p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta})/p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})$ e valore atteso sotto $p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})$: nel valore atteso del rapporto il denominatore si semplifica con il peso e resta l'integrale di una densità, che vale 1. $H(\cdot, \boldsymbol{\theta}^{(k)})$ è massima quando i due argomenti coincidono: con $\boldsymbol{\theta} = \boldsymbol{\theta}^{(k+1)}$ la seconda parentesi è non positiva.`,
      },
      {
        latex: md`H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \int p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) \ln \frac{p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})}{p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta})} \, d\mathbf{y} = D_{KL}\big( p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) \,\big\|\, p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}) \big) \ge 0`,
        why: md`Lo stesso risultato letto con un nome noto: cambiata di segno, la differenza è la divergenza di Kullback-Leibler (*Kullback-Leibler divergence*) tra la legge dei dati mancanti con i parametri vecchi e quella con i parametri nuovi. È sempre non negativa e si annulla solo se le due leggi coincidono.`,
      },
      {
        latex: md`l(\boldsymbol{\theta}^{(k+1)}) - l(\boldsymbol{\theta}^{(k)}) = \underbrace{\left[ Q(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) \right]}_{\ge 0 \text{ (M-step)}} + \underbrace{\left[ H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) \right]}_{\ge 0 \text{ (Jensen)}}`,
        why: md`Si riscrive la differenza del quinto passo portando dentro il segno meno della seconda parentesi: l'incremento della log-verosimiglianza è la somma di due contributi non negativi.`,
      },
      {
        latex: md`l(\boldsymbol{\theta}^{(k+1)}) - l(\boldsymbol{\theta}^{(k)}) \ge 0 \quad \Longrightarrow \quad l(\boldsymbol{\theta}^{(k+1)}) \ge l(\boldsymbol{\theta}^{(k)})`,
        why: md`La log-verosimiglianza dei dati osservati non può scendere. L'uguaglianza richiede che entrambe le parentesi siano nulle; accade in particolare quando $\boldsymbol{\theta}^{(k+1)} = \boldsymbol{\theta}^{(k)}$, cioè in un punto fisso di EM, che è un punto stazionario di $l$ ([«punto fisso di EM = punto stazionario»](#derivation:der08)): un massimo globale, un massimo locale o un punto di sella, come avverte la slide p75. La dimostrazione non usa né la forma gaussiana né l'ipotesi i.i.d.: vale per qualunque modello con variabili latenti, purché l'M-step non faccia diminuire $Q$ (basta anche solo aumentarla, sesto passo).`,
      },
    ],
    conclusion: md`La successione $\{\boldsymbol{\theta}^{[k]}\}$ prodotta da EM fa crescere (o lasciare uguale) a ogni iterazione la log-verosimiglianza dei dati osservati: $l(\boldsymbol{\theta}^{(k+1)}) \ge l(\boldsymbol{\theta}^{(k)})$. Il merito è dell'M-step, che fa salire $Q$, e della disuguaglianza di Jensen, che garantisce che $H$ non possa compensare scendendo. La crescita monotona non garantisce il massimo globale (slide p75): EM può fermarsi in un massimo locale o in un punto di sella.`,
    source: [{ doc: 'ch2', page: 74 }, { doc: 'part1', page: 49 }, { doc: 'ch2', page: 71 }, { doc: 'ch2', page: 72 }],
  },

  // --- der05 Le tre equazioni EM della mistura -------------------------------------------------------------
  {
    id: 'der05',
    title: 'Come si ricavano le tre equazioni EM della mistura di gaussiane',
    goal: md`Ricavare gli aggiornamenti di $P_i$, $\mathbf{m}_i$ e $\Sigma_i$ della slide p76 applicando E-step e M-step alla mistura. La fonte dice solo *it can be shown that the EM equations ... are*: la derivazione è quella standard, riportata come approfondimento perché all'orale si chiede di spiegare le formule.`,
    assumptions: md`Mistura di $M$ gaussiane $n$-dimensionali (slide p68) con parametri $\boldsymbol{\theta} = [P_1,\dots,P_M;\ \mathbf{m}_1,\dots,\mathbf{m}_M;\ \Sigma_1,\dots,\Sigma_M]$, prior con $\sum_i P_i = 1$ e covarianze simmetriche definite positive. Etichette one-hot, coppie $(\mathbf{x}_j, \mathbf{y}_j)$ i.i.d., $Q$ nella forma discreta di [«dalla definizione di Q al caso discreto della mistura»](#derivation:der03). Per brevità nei commenti $w_{ij} = P(i|\mathbf{x}_j, \boldsymbol{\theta}^{[k]})$.`,
    steps: [
      {
        latex: md`p(\mathbf{x}_j, y_j = i \,|\, \boldsymbol{\theta}) = P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)`,
        why: md`Modello generativo della mistura: prima si sceglie il modo $i$ con probabilità $P_i$, poi si estrae $\mathbf{x}_j$ dalla gaussiana $i$. La congiunta campione-etichetta è il prodotto dei due fattori.`,
      },
      {
        latex: md`P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = \frac{P_i^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]})}, \qquad p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]}) = \sum_{l=1}^{M} P_l^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_l^{[k]}, \Sigma_l^{[k]})`,
        why: md`E-step: per il teorema di Bayes la distribuzione dell'etichetta nascosta, dati $\mathbf{x}_j$ e i parametri correnti, è la posterior del modo. Il denominatore è la mistura corrente valutata in $\mathbf{x}_j$. È il rapporto che compare in tutte e tre le equazioni della slide p76.`,
      },
      {
        latex: md`\sum_{i=1}^{M} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = \frac{\sum_{i=1}^{M} P_i^{[k]} \, p(\mathbf{x}_j \,|\, \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j \,|\, \boldsymbol{\theta}^{[k]})} = 1`,
        why: md`Sommando i numeratori su tutti i modi si ottiene proprio il denominatore: per ogni campione le posterior formano una distribuzione sui modi. Servirà per trovare il moltiplicatore di Lagrange.`,
      },
      {
        latex: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{[k]}) = \sum_{j=1}^{N} \sum_{i=1}^{M} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \left[ \ln P_i + \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`,
        why: md`Si scrive $Q$ come media, con queste posterior, del log della congiunta (ultimo passo di [«dalla definizione di Q al caso discreto della mistura»](#derivation:der03)). I pesi sono numeri fissi: $Q$ dipende da $\boldsymbol{\theta}$ solo attraverso $\ln P_i$ e il log delle gaussiane.`,
      },
      {
        latex: md`Q = \sum_{i=1}^{M} \Big( \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \Big) \ln P_i + \sum_{i=1}^{M} \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)`,
        why: md`Si scambia l'ordine delle somme e si separa: un pezzo contiene solo i prior, gli altri $M$ pezzi solo la media e la covarianza di un modo ciascuno. Si possono massimizzare uno alla volta.`,
      },
      {
        latex: md`\frac{\partial}{\partial P_i} \left[ Q + \lambda \left( 1 - \sum_{l=1}^{M} P_l \right) \right] = \frac{1}{P_i} \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) - \lambda = 0`,
        why: md`M-step per i prior: si massimizza rispetto a $P_i$ con il vincolo che i prior sommino a 1, introducendo un moltiplicatore di Lagrange (*Lagrange multiplier*) $\lambda$ e annullando la derivata. Il vincolo $P_i \ge 0$ non serve imporlo: la soluzione che esce è già non negativa.`,
      },
      {
        latex: md`P_i = \frac{1}{\lambda} \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})`,
        why: md`Si isola $P_i$ nell'equazione precedente.`,
      },
      {
        latex: md`\sum_{i=1}^{M} P_i = 1 \;\Rightarrow\; \lambda = \sum_{j=1}^{N} \sum_{i=1}^{M} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = N \;\Rightarrow\; P_i^{[k+1]} = \frac{1}{N} \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})`,
        why: md`Si somma su $i$ e si impone il vincolo: per il terzo passo ogni campione porta posterior che sommano a 1 sui modi, quindi la somma doppia vale $N$ e $\lambda = N$. Il nuovo prior è la media delle posterior del modo: è la prima equazione della slide p76. La slide scrive al numeratore $P_j^{[k]}$ con pedice $j$: è un refuso per $P_i^{[k]}$, come nelle altre due equazioni.`,
      },
      {
        latex: md`\ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) = -\frac{n}{2} \ln(2\pi) - \frac{1}{2} \ln |\Sigma_i| - \frac{1}{2} (\mathbf{x}_j - \mathbf{m}_i)^{t} \Sigma_i^{-1} (\mathbf{x}_j - \mathbf{m}_i)`,
        why: md`Per gli altri parametri serve il log della gaussiana multivariata $n$-dimensionale: un termine costante, un termine nel determinante e la forma quadratica.`,
      },
      {
        latex: md`\frac{\partial}{\partial \mathbf{m}_i} \left[ -\frac{1}{2} (\mathbf{x}_j - \mathbf{m}_i)^{t} \Sigma_i^{-1} (\mathbf{x}_j - \mathbf{m}_i) \right] = \Sigma_i^{-1} (\mathbf{x}_j - \mathbf{m}_i)`,
        why: md`Regola $\frac{\partial}{\partial \mathbf{a}}\,\mathbf{a}^{t} A \mathbf{a} = 2A\mathbf{a}$ per $A$ simmetrica, con $\mathbf{a} = \mathbf{x}_j - \mathbf{m}_i$: la derivata interna rispetto a $\mathbf{m}_i$ vale $-1$ e cancella il segno meno davanti. Gli altri termini non contengono $\mathbf{m}_i$.`,
      },
      {
        latex: md`\frac{\partial Q}{\partial \mathbf{m}_i} = \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, \Sigma_i^{-1} (\mathbf{x}_j - \mathbf{m}_i) = \mathbf{0} \;\Rightarrow\; \mathbf{m}_i^{[k+1]} = \frac{\sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, \mathbf{x}_j}{\sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}`,
        why: md`M-step per le medie. Si moltiplica a sinistra per $\Sigma_i$, che è invertibile: resta $\sum_j w_{ij}(\mathbf{x}_j - \mathbf{m}_i) = \mathbf{0}$, cioè $\sum_j w_{ij}\mathbf{x}_j = \mathbf{m}_i \sum_j w_{ij}$. La nuova media è la media dei campioni pesata dalle posterior: è la seconda equazione della slide p76. Qui, a differenza della ML diretta ([«perché non esiste una soluzione analitica»](#derivation:der01)), i pesi sono numeri fissi calcolati nell'E-step: la soluzione è esplicita.`,
      },
      {
        latex: md`-\frac{1}{2} \ln |\Sigma_i| - \frac{1}{2} (\mathbf{x}_j - \mathbf{m}_i)^{t} \Sigma_i^{-1} (\mathbf{x}_j - \mathbf{m}_i) = \frac{1}{2} \ln |\Sigma_i^{-1}| - \frac{1}{2} \operatorname{tr}\left( \Sigma_i^{-1} (\mathbf{x}_j - \mathbf{m}_i)(\mathbf{x}_j - \mathbf{m}_i)^{t} \right)`,
        why: md`Per le covarianze conviene usare come variabile la matrice inversa $\Sigma_i^{-1}$ (matrice di precisione). Due riscritture: $|\Sigma_i^{-1}| = 1/|\Sigma_i|$, e la forma quadratica è uno scalare, quindi uguale alla sua traccia, che è invariante per permutazione ciclica: $\mathbf{a}^{t}A\mathbf{a} = \operatorname{tr}(A\mathbf{a}\mathbf{a}^{t})$.`,
      },
      {
        latex: md`\frac{\partial}{\partial A} \ln |A| = A^{-1}, \qquad \frac{\partial}{\partial A} \operatorname{tr}(A B) = B^{t} \qquad (A = \Sigma_i^{-1} \text{ simmetrica})`,
        why: md`Due regole di derivazione matriciale. In generale $\frac{\partial}{\partial A}\ln|A| = (A^{-1})^{t}$, che per $A$ simmetrica è $A^{-1} = \Sigma_i$. Con $B = (\mathbf{x}_j - \mathbf{m}_i)(\mathbf{x}_j - \mathbf{m}_i)^{t}$, simmetrica, anche $B^{t} = B$.`,
      },
      {
        latex: md`\frac{\partial Q}{\partial \Sigma_i^{-1}} = \frac{1}{2} \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \left[ \Sigma_i - (\mathbf{x}_j - \mathbf{m}_i)(\mathbf{x}_j - \mathbf{m}_i)^{t} \right] = \mathbf{0}`,
        why: md`M-step per le covarianze: si applicano le due regole a ciascun termine del pezzo del modo $i$, pesato da $w_{ij}$. La derivata del log-determinante dà $\Sigma_i$, quella della traccia il prodotto esterno degli scarti (*outer product*).`,
      },
      {
        latex: md`\Sigma_i \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, (\mathbf{x}_j - \mathbf{m}_i)(\mathbf{x}_j - \mathbf{m}_i)^{t}`,
        why: md`$\Sigma_i$ non dipende da $j$ ed esce dalla somma; si porta il secondo termine a destra.`,
      },
      {
        latex: md`\Sigma_i^{[k+1]} = \frac{\sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, (\mathbf{x}_j - \mathbf{m}_i^{[k+1]})(\mathbf{x}_j - \mathbf{m}_i^{[k+1]})^{t}}{\sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}`,
        why: md`Si divide per la somma dei pesi: la nuova covarianza è la media pesata dei prodotti esterni degli scarti, calcolati rispetto alla media appena aggiornata $\mathbf{m}_i^{[k+1]}$, perché le condizioni di stazionarietà valgono insieme. È la terza equazione. Nella slide anche la gaussiana dentro il peso è scritta con $\mathbf{m}_i^{[k+1]}$: così i pesi non sarebbero più posterior (non sommerebbero a 1 sui modi); nella derivazione standard i pesi restano quelli dell'E-step. Il punto trovato è davvero il massimo di $Q$: la media ottima non dipende da $\Sigma_i$ (l'equazione delle medie, dopo la moltiplicazione per $\Sigma_i$, non la contiene), e fissata quella $Q$ è concava in $\Sigma_i^{-1}$ (log-determinante concavo meno un termine lineare); anche il pezzo dei prior è concavo (somma di logaritmi). $\Sigma_i^{[k+1]}$ è simmetrica e semidefinita positiva; è invertibile solo se i campioni con peso non trascurabile non stanno tutti in un sottospazio di dimensione minore di $n$ (servono almeno $n + 1$ punti in posizione generale), altrimenti si cade nel caso degenere del [collasso di una componente](#formula:f-c67).`,
      },
    ],
    conclusion: md`Le tre equazioni della slide p76 sono le stime ML di prior, media e covarianza di ciascun modo, pesate dalle posterior dell'E-step: il prior è la frazione «morbida» di campioni del modo, la media e la covarianza sono media e covarianza campionarie pesate. Tutte usano lo stesso rapporto $P_i^{[k]} p(\mathbf{x}_j|\mathbf{m}_i^{[k]}, \Sigma_i^{[k]})/p(\mathbf{x}_j|\boldsymbol{\theta}^{[k]})$, e la covarianza usa la media già aggiornata.`,
    source: [{ doc: 'ch2', page: 76 }, { doc: 'part1', page: 50 }, { doc: 'ch2', page: 68 }],
  },

  // --- der06 EM a mano sui quattro punti ---------------------------------------------------------------------
  {
    id: 'der06',
    title: "EM a mano sull'esempio dei quattro punti con x1 mancante",
    goal: md`Ricostruire i conti che producono le ellissi 0, 1, 2, 3 della figura della slide p77. La slide non riporta né i dati né i risultati: i punti si leggono dal grafico e il modello è quello dell'esempio classico di Duda, Hart e Stork (*Pattern Classification*), da cui la figura proviene.`,
    assumptions: md`Gaussiana 2-D a covarianza diagonale con parametri $\boldsymbol{\theta} = (\mu_1, \mu_2, \sigma_1^2, \sigma_2^2)^{t}$ e stima iniziale $\boldsymbol{\theta}^{0} = (0, 0, 1, 1)^{t}$ (il cerchio «0» centrato nell'origine). Qui il dato mancante (*missing feature*) è una coordinata del quarto punto, non un'etichetta di modo: EM tratta il valore mancante come una variabile latente (*treating the missing values as latent variables*, note part1 p50). Nella funzione $Q$ l'indice $k$ numera i punti; nelle ricorsioni l'apice numera le iterazioni.`,
    steps: [
      {
        latex: md`D = \{ (0, 2)^{t}, \; (1, 0)^{t}, \; (2, 2)^{t}, \; (*, 4)^{t} \}, \qquad \boldsymbol{\theta} = (\mu_1, \mu_2, \sigma_1^2, \sigma_2^2)^{t}, \qquad \boldsymbol{\theta}^{0} = (0, 0, 1, 1)^{t}`,
        why: md`Dati letti dalla figura: tre punti completi (i pallini rossi) e un quarto punto di cui si conosce solo $x_2 = 4$ (la retta rossa orizzontale: $x_1$ può stare ovunque). L'asterisco indica il valore mancante $x_{41}$.`,
      },
      {
        latex: md`\ln p(\mathbf{x} \,|\, \boldsymbol{\theta}) = -\ln(2\pi\sigma_1\sigma_2) - \frac{(x_1 - \mu_1)^2}{2\sigma_1^2} - \frac{(x_2 - \mu_2)^2}{2\sigma_2^2}`,
        why: md`Con covarianza diagonale la gaussiana 2-D è il prodotto di due gaussiane 1-D indipendenti: $|\Sigma|^{1/2} = \sigma_1\sigma_2$ e la forma quadratica si separa nelle due coordinate.`,
      },
      {
        latex: md`Q(\boldsymbol{\theta}; \boldsymbol{\theta}^{0}) = \sum_{k=1}^{3} \ln p(\mathbf{x}_k \,|\, \boldsymbol{\theta}) + \int_{-\infty}^{+\infty} \ln p\big( (x_{41}, 4)^{t} \,\big|\, \boldsymbol{\theta} \big) \; p(x_{41} \,|\, \boldsymbol{\theta}^{0}; x_{42} = 4) \, dx_{41}`,
        why: md`E-step: i tre punti completi entrano con la loro log-densità, come nella ML ordinaria; per il quarto si prende il valore atteso rispetto al valore mancante $x_{41}$, condizionato a ciò che si sa ($x_{42} = 4$) e alla stima corrente. È la forma integrale di $Q$ della slide p72 con $\mathbf{y} = x_{41}$.`,
      },
      {
        latex: md`p(x_{41} \,|\, \boldsymbol{\theta}^{0}; x_{42} = 4) = \frac{p\big( (x_{41}, 4)^{t} \,\big|\, \boldsymbol{\theta}^{0} \big)}{\int_{-\infty}^{+\infty} p\big( (x'_{41}, 4)^{t} \,\big|\, \boldsymbol{\theta}^{0} \big) \, dx'_{41}}`,
        why: md`Densità condizionata del valore mancante: la congiunta con la coordinata nota fissata a 4, normalizzata sull'unica coordinata libera.`,
      },
      {
        latex: md`p(x_{41} \,|\, \boldsymbol{\theta}^{0}; x_{42} = 4) = \mathcal{N}(\mu_1^{0}, \sigma_1^{2,0}) = \mathcal{N}(0, 1) \;\Rightarrow\; E[x_{41}] = 0, \quad E[(x_{41} - \mu_1)^2] = 1 + \mu_1^2`,
        why: md`Con covarianza diagonale $x_1$ e $x_2$ sono indipendenti: il fattore in $x_2$ si semplifica tra numeratore e denominatore, sapere $x_{42} = 4$ non dice nulla su $x_{41}$, e la sua densità è la marginale gaussiana corrente $\mathcal{N}(0, 1)$. Di questa servono solo i primi due momenti.`,
      },
      {
        latex: md`E[(x_{41} - \mu_1)^2] = \operatorname{Var}[x_{41}] + \big( E[x_{41}] - \mu_1 \big)^2 = 1 + (0 - \mu_1)^2 = 1 + \mu_1^2`,
        why: md`Da dove viene $1 + \mu_1^2$: il momento secondo attorno a un punto qualunque $\mu_1$ è la varianza più il quadrato della distanza tra la media e quel punto.`,
      },
      {
        latex: md`Q(\boldsymbol{\theta}; \boldsymbol{\theta}^{0}) = \sum_{k=1}^{3} \ln p(\mathbf{x}_k \,|\, \boldsymbol{\theta}) - \frac{1 + \mu_1^2}{2\sigma_1^2} - \frac{(4 - \mu_2)^2}{2\sigma_2^2} - \ln(2\pi\sigma_1\sigma_2)`,
        why: md`Si sostituisce il log della gaussiana del secondo passo nell'integrale e si integra termine per termine: il termine in $x_{41}$ diventa $(1 + \mu_1^2)/(2\sigma_1^2)$, quello in $x_{42}$ è deterministico, la costante $-\ln(2\pi\sigma_1\sigma_2)$ esce moltiplicata per l'area 1 della densità. $Q$ è ora una funzione esplicita di $\boldsymbol{\theta}$.`,
      },
      {
        latex: md`\frac{\partial Q}{\partial \mu_1} = \frac{1}{\sigma_1^2} \left[ \sum_{k=1}^{3} (x_{k1} - \mu_1) - \mu_1 \right] = \frac{(0 + 1 + 2) - 4\mu_1}{\sigma_1^2} = 0`,
        why: md`M-step per $\mu_1$. I tre punti completi danno i soliti scarti $x_{k1} - \mu_1$; il termine $-(1 + \mu_1^2)/(2\sigma_1^2)$ ha derivata $-\mu_1/\sigma_1^2$, cioè si comporta come uno scarto $0 - \mu_1$: il valore mancante è sostituito dal suo valore atteso $E[x_{41}] = 0$.`,
      },
      {
        latex: md`\mu_1^{1} = \frac{0 + 1 + 2 + 0}{4} = 0.75, \qquad \mu_2^{1} = \frac{2 + 0 + 2 + 4}{4} = 2.0`,
        why: md`Le medie nuove sono medie aritmetiche su quattro valori, con il valore mancante sostituito dal suo valore atteso (0). Per $x_2$ si usano tutti e quattro i valori osservati, compreso $x_{42} = 4$.`,
      },
      {
        latex: md`\frac{\partial Q}{\partial \sigma_1^2} = -\frac{4}{2\sigma_1^2} + \frac{1}{2\sigma_1^4} \left[ \sum_{k=1}^{3} (x_{k1} - \mu_1)^2 + 1 + \mu_1^2 \right] = 0 \;\Rightarrow\; \sigma_1^2 = \frac{1}{4} \left[ \sum_{k=1}^{3} (x_{k1} - \mu_1)^2 + 1 + \mu_1^2 \right]`,
        why: md`M-step per $\sigma_1^2$. Ognuno dei quattro termini contiene $-\ln\sigma_1 = -\frac{1}{2}\ln\sigma_1^2$, da cui $-4/(2\sigma_1^2)$; i termini quadratici danno $+S/(2\sigma_1^4)$, con $S$ la somma tra parentesi. Annullando, $\sigma_1^2 = S/4$.`,
      },
      {
        latex: md`\sigma_1^{2,1} = \frac{0.5625 + 0.0625 + 1.5625 + (1 + 0.5625)}{4} = 0.938, \qquad \sigma_2^{2,1} = \frac{0 + 4 + 0 + 4}{4} = 2.0`,
        why: md`Con $\mu_1 = 0.75$: $(0 - 0.75)^2 = 0.5625$, $(1 - 0.75)^2 = 0.0625$, $(2 - 0.75)^2 = 1.5625$. Per il punto incompleto il quadrato dello scarto è sostituito dal suo valore atteso, varianza corrente (1) più scarto quadratico tra media vecchia e media nuova ($0.75^2 = 0.5625$). La somma è $3.75$ e $3.75/4 = 0.9375$. Per $x_2$ gli scarti da 2 sono $0, -2, 0, 2$. È l'ellisse «1» della figura.`,
      },
      {
        latex: md`E[x_{41}] = \mu_1^{k}, \qquad E[(x_{41} - \mu_1)^2] = \sigma_1^{2,k} + (\mu_1^{k} - \mu_1)^2`,
        why: md`All'iterazione generica il valore mancante ha densità $\mathcal{N}(\mu_1^{k}, \sigma_1^{2,k})$, per la stessa indipendenza: i due momenti si calcolano come al sesto passo, con la stima corrente al posto di quella iniziale.`,
      },
      {
        latex: md`\mu_1^{k+1} = \frac{3 + \mu_1^{k}}{4}, \qquad \sigma_1^{2,k+1} = \frac{1}{4} \left[ \sum_{j=1}^{3} (x_{j1} - \mu_1^{k+1})^2 + \sigma_1^{2,k} + (\mu_1^{k} - \mu_1^{k+1})^2 \right]`,
        why: md`Ripetendo E e M la struttura non cambia e si ottiene una ricorsione semplice: $0 + 1 + 2 = 3$ più il valore atteso $\mu_1^{k}$ del dato mancante. Le stime di $\mu_2$ e $\sigma_2^2$ restano $2.0$: $x_2$ è osservato per tutti e quattro i punti.`,
      },
      {
        latex: md`\mu_1^{2} = \frac{3 + 0.75}{4} = 0.9375, \qquad \sigma_1^{2,2} = \frac{0.8789 + 0.0039 + 1.1289 + 0.9375 + 0.0352}{4} = \frac{2.9844}{4} = 0.746`,
        why: md`Seconda iterazione fatta per esteso: scarti dei tre punti da $0.9375$ al quadrato ($0.8789$, $0.0039$, $1.1289$), varianza precedente $0.9375$, scarto tra media vecchia e nuova $(0.75 - 0.9375)^2 = 0.0352$.`,
      },
      {
        latex: md`\boldsymbol{\theta}^{2} = (0.938, 2.0, 0.746, 2.0)^{t}, \quad \boldsymbol{\theta}^{3} = (0.984, 2.0, 0.687, 2.0)^{t}, \quad \ldots \quad \boldsymbol{\mu} = (1.0, 2.0)^{t}, \;\; \Sigma = \begin{pmatrix} 0.667 & 0 \\ 0 & 2.0 \end{pmatrix}`,
        why: md`Iterando: $\boldsymbol{\theta}^{3}$ ha $\mu_1 = 0.9844$ e $\sigma_1^2 = 0.6873$, $\boldsymbol{\theta}^{4}$ ha $\mu_1 = 0.9961$ e $\sigma_1^2 = 0.6719$. Già dopo tre iterazioni si è vicini al limite: per questo le ellissi 2 e 3 della figura quasi coincidono, centrate in $(1, 2)$ e allungate lungo $x_2$.`,
      },
      {
        latex: md`\mu_1 = \frac{3 + \mu_1}{4} \;\Rightarrow\; \mu_1 = 1, \qquad \sigma_1^2 = \frac{(0 - 1)^2 + (1 - 1)^2 + (2 - 1)^2 + \sigma_1^2 + 0}{4} = \frac{2 + \sigma_1^2}{4} \;\Rightarrow\; \sigma_1^2 = \frac{2}{3}`,
        why: md`Il limite è il punto fisso della ricorsione: si pone $\mu_1^{k+1} = \mu_1^{k}$ e $\sigma_1^{2,k+1} = \sigma_1^{2,k}$. Al punto fisso lo scarto tra media vecchia e nuova è 0, e $4\sigma_1^2 = 2 + \sigma_1^2$ dà $\sigma_1^2 = 2/3 = 0.667$. La convergenza è asintotica: per $\mu_1$ la distanza dal limite si riduce esattamente a un quarto a ogni passo, perché $\mu_1^{k+1} - 1 = (\mu_1^{k} - 1)/4$, e il limite non si raggiunge in un numero finito di iterazioni.`,
      },
      {
        latex: md`\text{senza il quarto punto:} \quad \mu_2 = \frac{2 + 0 + 2}{3} = 1.333, \qquad \sigma_2^2 = \frac{(2 - \tfrac{4}{3})^2 + (0 - \tfrac{4}{3})^2 + (2 - \tfrac{4}{3})^2}{3} = \frac{8}{9} = 0.889`,
        why: md`Confronto con l'alternativa di scartare il punto incompleto. Per $x_1$ si ottiene lo stesso risultato del limite di EM ($\mu_1 = 1$, $\sigma_1^2 = 2/3$), ma per $x_2$ si perde l'informazione $x_{42} = 4$: media più bassa e varianza più piccola. È il principio delle note (part1 p46): usare tutta l'informazione disponibile, anche se parziale.`,
      },
    ],
    conclusion: md`EM non inventa il valore mancante: a ogni iterazione lo sostituisce con i suoi momenti attesi (media e momento secondo) sotto la stima corrente. Si ottiene $\boldsymbol{\theta}^{1} = (0.75, 2.0, 0.938, 2.0)^{t}$, poi $(0.938, 2.0, 0.746, 2.0)^{t}$ e $(0.984, 2.0, 0.687, 2.0)^{t}$, con limite $\boldsymbol{\mu} = (1, 2)^{t}$ e $\Sigma = \mathrm{diag}(0.667, 2.0)$. Il testo di riferimento dice che l'algoritmo converge in tre iterazioni; il calcolo esatto mostra che dopo tre iterazioni si è solo molto vicini al limite, e le ellissi 2 e 3 sono quasi sovrapposte.`,
    source: [{ doc: 'ch2', page: 77 }, { doc: 'part1', page: 50 }],
  },

  // --- der07 La mistura come modello a variabile latente ------------------------------------------------------
  {
    id: 'der07',
    title: 'La mistura di gaussiane come modello a variabile latente',
    goal: md`Mostrare che, introducendo il vettore binario di appartenenza $\mathbf{y}_j$ delle note (part1 p47), la mistura della slide p68 si ottiene marginalizzando la congiunta dei dati completi della slide p71, e perché il log della verosimiglianza incompleta non si separa per componente. È un'integrazione: la fonte afferma il legame ma non scrive i passaggi.`,
    assumptions: md`Mistura di $M$ gaussiane (slide p68). Per ogni campione un'etichetta nascosta one-hot $\mathbf{y}_j$ (*a binary vector that indicates which Gaussian mode each sample belongs to*, part1 p47); coppie $(\mathbf{x}_j, \mathbf{y}_j)$ i.i.d.`,
    steps: [
      {
        latex: md`\mathbf{y}_j \in \{ \mathbf{e}_1, \dots, \mathbf{e}_M \}, \qquad y_{ji} = 1 \iff \mathbf{x}_j \text{ viene dal modo } i`,
        why: md`$\mathbf{e}_i$ è il vettore con 1 in posizione $i$ e 0 altrove: $\mathbf{y}_j$ può assumere solo $M$ valori, uno per modo. È l'informazione che manca: *we do not know the specific component (mode) responsible for generating each observation* (part1 p47).`,
      },
      {
        latex: md`P(y_{ji} = 1 \,|\, \boldsymbol{\theta}) = P_i, \qquad p(\mathbf{x}_j \,|\, y_{ji} = 1, \boldsymbol{\theta}) = p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)`,
        why: md`Modello generativo (*generative model*): il prior $P_i$ è la probabilità che un campione venga dal modo $i$; dato il modo, il campione è gaussiano con i parametri di quel modo. Così i prior della slide p68 ricevono un significato probabilistico preciso, e i vincoli $\sum_i P_i = 1$, $P_i \ge 0$ sono quelli di una distribuzione sui modi.`,
      },
      {
        latex: md`p(\mathbf{x}_j, \mathbf{y}_j \,|\, \boldsymbol{\theta}) = \prod_{i=1}^{M} \left[ P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]^{y_{ji}}`,
        why: md`Congiunta = probabilità del modo per densità condizionata al modo. Il prodotto con esponente $y_{ji}$ è un modo compatto di scriverla per tutti i valori possibili di $\mathbf{y}_j$ insieme.`,
      },
      {
        latex: md`\mathbf{y}_j = \mathbf{e}_i \;\Rightarrow\; p(\mathbf{x}_j, \mathbf{y}_j \,|\, \boldsymbol{\theta}) = \left[ P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]^{1} \prod_{l \neq i} \left[ P_l \, p(\mathbf{x}_j \,|\, \mathbf{m}_l, \Sigma_l) \right]^{0} = P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)`,
        why: md`Verifica: con $y_j$ one-hot l'esponente $y_{ji}$ seleziona un solo fattore del prodotto, gli altri sono elevati alla 0 e valgono 1. La congiunta completa del campione è prior per gaussiana del modo attivo.`,
      },
      {
        latex: md`p(\mathbf{x}_j \,|\, \boldsymbol{\theta}) = \sum_{\mathbf{y}_j} p(\mathbf{x}_j, \mathbf{y}_j \,|\, \boldsymbol{\theta}) = \sum_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)`,
        why: md`La densità dei soli dati osservati si ottiene sommando la congiunta sugli $M$ valori possibili di $\mathbf{y}_j$ (marginalizzazione, *marginalization*): ritorna esattamente la mistura della slide p68. È il caso discreto di $p(\mathbf{X}|\boldsymbol{\theta}) = \int p(\mathbf{X}, \mathbf{y}|\boldsymbol{\theta})\,d\mathbf{y}$.`,
      },
      {
        latex: md`p(\mathbf{x}_j \,|\, \boldsymbol{\theta}) = \sum_{i=1}^{M} P(y_{ji} = 1 \,|\, \boldsymbol{\theta}) \, p(\mathbf{x}_j \,|\, y_{ji} = 1, \boldsymbol{\theta}) = \sum_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)`,
        why: md`Stesso risultato letto come teorema della probabilità totale (*law of total probability*): la mistura è una media delle densità dei modi pesata dalle probabilità dei modi. È la «relazione di tipo somma» tra i modi nascosti della slide p69.`,
      },
      {
        latex: md`P(y_{ji} = 1 \,|\, \mathbf{x}_j, \boldsymbol{\theta}) = \frac{p(\mathbf{x}_j, y_{ji} = 1 \,|\, \boldsymbol{\theta})}{p(\mathbf{x}_j \,|\, \boldsymbol{\theta})} = \frac{P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)}{\sum_{l=1}^{M} P_l \, p(\mathbf{x}_j \,|\, \mathbf{m}_l, \Sigma_l)}`,
        why: md`Conseguenza diretta, con il teorema di Bayes: la probabilità a posteriori dell'etichetta dato il campione è congiunta diviso marginale. Calcolata con i parametri correnti è il peso dell'E-step di EM (slide p76).`,
      },
      {
        latex: md`p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = \prod_{j=1}^{N} \prod_{i=1}^{M} \left[ P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]^{y_{ji}}`,
        why: md`Per coppie i.i.d. la congiunta dell'intero dataset completo è il prodotto delle congiunte dei singoli campioni.`,
      },
      {
        latex: md`l(\boldsymbol{\theta} \,|\, \mathbf{X}) = \prod_{j=1}^{N} \sum_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i), \qquad \ln p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = \sum_{j=1}^{N} \sum_{i=1}^{M} y_{ji} \left[ \ln P_i + \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`,
        why: md`A sinistra la verosimiglianza incompleta: un prodotto di somme. A destra il log della verosimiglianza completa: una somma di termini separati per modo e lineare negli $y_{ji}$. Se $\mathbf{Y}$ fosse noto la ML si risolverebbe modo per modo (*If we knew the values of Y, we could solve the ML estimation problem directly*, part1 p47).`,
      },
      {
        latex: md`\ln l(\boldsymbol{\theta} \,|\, \mathbf{X}) = \sum_{j=1}^{N} \ln \sum_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \;\ne\; \sum_{j=1}^{N} \sum_{i=1}^{M} \ln \left[ P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`,
        why: md`Il logaritmo del prodotto di somme diventa una somma di logaritmi di somme, e il logaritmo di una somma non si spezza nella somma dei logaritmi: la verosimiglianza incompleta non si separa per componente. È la radice della difficoltà di [«perché non esiste una soluzione analitica»](#derivation:der01).`,
      },
    ],
    conclusion: md`La mistura di gaussiane è un modello a variabile latente: si ottiene dalla congiunta dei dati completi $p(\mathbf{x}_j, \mathbf{y}_j|\boldsymbol{\theta})$ sommando sull'etichetta nascosta. I prior sono le probabilità dell'etichetta, le componenti le densità condizionate all'etichetta, le posterior le probabilità dell'etichetta dopo aver visto il campione. La versione completa è separabile e facile, quella incompleta no: è lo schema che EM sfrutta.`,
    source: [{ doc: 'ch2', page: 68 }, { doc: 'ch2', page: 71 }, { doc: 'part1', page: 47 }, { doc: 'ch2', page: 69 }],
  },

  // --- der08 Punto fisso = punto stazionario; medie come passo di gradiente ----------------------------------
  {
    id: 'der08',
    title: "Punto fisso di EM = punto stazionario di l; l'aggiornamento delle medie come passo di gradiente",
    goal: md`Giustificare tre affermazioni che la fonte fa senza dimostrarle: che fermarsi quando *the parameters θ no longer change significantly* (note part1 p49) significa trovarsi in un punto stazionario della log-verosimiglianza (massimo locale o sella, slide p75); che il minorante costruito con $Q$ è tangente a $l$ nel punto corrente; in che senso preciso EM *relies on gradient ascent-like updates* (note part1 p50).`,
    assumptions: md`Le identità di [«perché EM non fa mai scendere la log-verosimiglianza»](#derivation:der04): $l(\boldsymbol{\theta}) = Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ e $H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) \le H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$. Densità differenziabili in $\boldsymbol{\theta}$ e $\boldsymbol{\theta}^{(k)}$ interno allo spazio dei parametri (non sul bordo, per esempio nessun prior nullo). Nella seconda parte: mistura di gaussiane con le equazioni EM della slide p76.`,
    steps: [
      {
        latex: md`l(\boldsymbol{\theta}) - \Big[ l(\boldsymbol{\theta}^{(k)}) + Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) \Big] = H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) \;\ge\; 0`,
        why: md`Si scrive la scomposizione $l = Q - H$ in $\boldsymbol{\theta}$ e in $\boldsymbol{\theta}^{(k)}$ e si sottrae: la distanza tra $l$ e la funzione tra parentesi quadre è esattamente la differenza dei termini $H$, che per la disuguaglianza di Jensen è non negativa e vale 0 per $\boldsymbol{\theta} = \boldsymbol{\theta}^{(k)}$.`,
      },
      {
        latex: md`l(\boldsymbol{\theta}) \;\ge\; l(\boldsymbol{\theta}^{(k)}) + Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}), \qquad \text{con uguaglianza per } \boldsymbol{\theta} = \boldsymbol{\theta}^{(k)}`,
        why: md`Lettura geometrica: $Q(\cdot, \boldsymbol{\theta}^{(k)})$ più una costante è un minorante (*lower bound*) di $l$ che la tocca nel punto corrente. EM massimizza il minorante invece della funzione vera, che è difficile.`,
      },
      {
        latex: md`l(\boldsymbol{\theta}^{(k+1)}) \;\ge\; l(\boldsymbol{\theta}^{(k)}) + \underbrace{Q(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})}_{\ge 0 \text{ (M-step)}} \;\ge\; l(\boldsymbol{\theta}^{(k)})`,
        why: md`La monotonia della slide p74 in una riga: si valuta il minorante in $\boldsymbol{\theta}^{(k+1)}$, dove l'M-step lo ha reso massimo e quindi almeno pari al suo valore in $\boldsymbol{\theta}^{(k)}$, cioè $l(\boldsymbol{\theta}^{(k)})$. Ogni iterazione costruisce un nuovo minorante nel punto raggiunto e lo scala: è la salita a gradini della figura della slide p74.`,
      },
      {
        latex: md`D(\boldsymbol{\theta}) = l(\boldsymbol{\theta}) - Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - \big[ l(\boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) \big] \ge 0, \qquad D(\boldsymbol{\theta}^{(k)}) = 0 \;\Rightarrow\; \nabla D(\boldsymbol{\theta}^{(k)}) = \mathbf{0}`,
        why: md`$D$ è la distanza del primo passo: è differenziabile, non negativa e nulla in $\boldsymbol{\theta}^{(k)}$, quindi ha lì un minimo; in un minimo interno il gradiente si annulla.`,
      },
      {
        latex: md`\nabla_{\boldsymbol{\theta}} \, l(\boldsymbol{\theta}) \Big|_{\boldsymbol{\theta} = \boldsymbol{\theta}^{(k)}} = \nabla_{\boldsymbol{\theta}} \, Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) \Big|_{\boldsymbol{\theta} = \boldsymbol{\theta}^{(k)}}`,
        why: md`$D$ è $l$ meno $Q(\cdot, \boldsymbol{\theta}^{(k)})$ più una costante: gradiente nullo di $D$ vuol dire gradienti uguali di $l$ e di $Q$ nel punto corrente. Il minorante non si limita a toccare $l$: le è tangente.`,
      },
      {
        latex: md`\boldsymbol{\theta}^{(k+1)} = \boldsymbol{\theta}^{(k)} \;\Rightarrow\; \nabla_{\boldsymbol{\theta}} \, Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) \Big|_{\boldsymbol{\theta} = \boldsymbol{\theta}^{(k)}} = \mathbf{0} \;\Rightarrow\; \nabla_{\boldsymbol{\theta}} \, l(\boldsymbol{\theta}^{(k)}) = \mathbf{0}`,
        why: md`Se EM si ferma, $\boldsymbol{\theta}^{(k)}$ è il massimo di $Q(\cdot, \boldsymbol{\theta}^{(k)})$, quindi (punto interno) il gradiente di $Q$ si annulla lì; per il passo precedente si annulla anche il gradiente di $l$. Un punto fisso di EM è un punto stazionario della log-verosimiglianza: massimo globale, massimo locale o punto di sella (slide p75). Per i prior, vincolati a sommare a 1, vale lo stesso ragionamento con il gradiente della lagrangiana. È la giustificazione del [criterio di arresto](#formula:f-c37) delle note, e il motivo per cui la loro frase *This ensures that the likelihood has reached a local maximum* è troppo forte.`,
      },
      {
        latex: md`N_i^{[k]} = \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}), \qquad \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, \mathbf{x}_j = N_i^{[k]} \, \mathbf{m}_i^{[k+1]}`,
        why: md`Seconda parte, la mistura. $N_i^{[k]}$ è il numero «morbido» (*soft count*) di campioni del modo $i$: la somma delle sue posterior. La seconda uguaglianza è l'equazione EM delle medie della slide p76 moltiplicata per il denominatore.`,
      },
      {
        latex: md`\frac{\partial \ln l}{\partial \mathbf{m}_i} \bigg|_{\boldsymbol{\theta}^{[k]}} = \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, (\Sigma_i^{[k]})^{-1} (\mathbf{x}_j - \mathbf{m}_i^{[k]}) = (\Sigma_i^{[k]})^{-1} \, N_i^{[k]} \big( \mathbf{m}_i^{[k+1]} - \mathbf{m}_i^{[k]} \big), \qquad N_i^{[k]} = \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})`,
        why: md`Gradiente della log-verosimiglianza incompleta rispetto alla media del modo $i$ (calcolato in [«perché non esiste una soluzione analitica»](#derivation:der01)), valutato nella stima corrente. Si porta $(\Sigma_i^{[k]})^{-1}$ fuori dalla somma: resta $\sum_j w_{ij}\mathbf{x}_j - N_i^{[k]}\mathbf{m}_i^{[k]} = N_i^{[k]}\mathbf{m}_i^{[k+1]} - N_i^{[k]}\mathbf{m}_i^{[k]}$ per il passo precedente.`,
      },
      {
        latex: md`\mathbf{m}_i^{[k+1]} = \mathbf{m}_i^{[k]} + \frac{\Sigma_i^{[k]}}{N_i^{[k]}} \, \frac{\partial \ln l}{\partial \mathbf{m}_i} \bigg|_{\boldsymbol{\theta}^{[k]}}`,
        why: md`Si moltiplica a sinistra per $\Sigma_i^{[k]}/N_i^{[k]}$ e si isola $\mathbf{m}_i^{[k+1]}$. L'aggiornamento EM della media è esattamente un passo di salita del gradiente (*gradient ascent*) della log-verosimiglianza, con «matrice di passo» $\Sigma_i/N_i$ fissata dal modello: è definita positiva, quindi il passo va sempre in salita. È il contenuto preciso della frase delle note *EM relies on gradient ascent-like updates*: come la salita del gradiente, EM migliora localmente e dipende dal punto di partenza; a differenza di essa non ha un *learning rate* da tarare, e il passo si adatta alla forma ($\Sigma_i$) e alla massa ($N_i$) di ogni modo.`,
      },
      {
        latex: md`m_1^{[1]} = 3 + \frac{1}{2.989} \cdot 0.1853 = 3.062 \qquad (\text{dati: } X = \{2, 3, 4, 5, 7, 8\}, \; P = (0.5, 0.5), \; m = (3, 6), \; \sigma^2 = (1, 1))`,
        why: md`Verifica numerica sul caso 1-D dell'[esempio delle sei luminosità](#example:ex03), modo 1. Le posterior del modo 1 sono $0.9994, 0.9890, 0.8176, 0.1824, 0.0006, 0.0000$: sommano a $N_1 = 2.989$, e moltiplicate per gli scarti $x_j - 3 = -1, 0, 1, 2, 4, 5$ danno la derivata di $\ln l$ rispetto a $m_1$, $0.1853$ (controllata anche con differenze finite). Con $\sigma_1^2 = 1$ il passo di gradiente dà $3.062$, esattamente la media EM $m_1^{[1]}$ dell'esempio.`,
      },
      {
        latex: md`m_2^{[1]} = 6 + \frac{1}{3.011} \cdot 1.7818 = 6.592`,
        why: md`Stessa verifica per il modo 2: posterior complementari a 1, $N_2 = 6 - 2.989 = 3.011$, scarti $x_j - 6 = -4, -3, -2, -1, 1, 2$, derivata $1.7818$. Il passo porta la media a $6.592$, di nuovo la media EM. Il modo 2 si sposta di più perché i punti 7 e 8, che gli appartengono quasi del tutto, stanno a destra della media iniziale.`,
      },
    ],
    conclusion: md`Il minorante $Q(\cdot, \boldsymbol{\theta}^{(k)})$ + costante è tangente a $l$ nel punto corrente. Ne seguono due fatti: se i parametri smettono di cambiare, il gradiente di $l$ è nullo, quindi EM si è fermato in un punto stazionario (massimo globale, locale o sella), non necessariamente in un massimo; e nella mistura l'aggiornamento delle medie è un passo di salita del gradiente con passo $\Sigma_i/N_i$ scelto dal modello, senza parametri da tarare.`,
    source: [{ doc: 'ch2', page: 74 }, { doc: 'ch2', page: 75 }, { doc: 'part1', page: 49 }, { doc: 'part1', page: 50 }, { doc: 'ch2', page: 76 }],
  },

  // --- der09 Se Y fosse noto ------------------------------------------------------------------------------------
  {
    id: 'der09',
    title: 'Se Y fosse noto: la ML dei dati completi in forma chiusa, e perché EM la imita sostituendo le etichette con la loro media',
    goal: md`Dimostrare per la mistura l'affermazione delle note (part1 p47) *If we knew the values of Y, we could solve the ML estimation problem directly*, e mostrare che le equazioni EM della slide p76 sono le stesse formule con le etichette $y_{ji}$ sostituite dalle posterior. È un'integrazione: la fonte afferma, non ricava.`,
    assumptions: md`Mistura di $M$ gaussiane con etichette one-hot $y_{ji}$ note (il caso ipotetico delle note), campioni i.i.d. Ogni modo ha almeno un campione, $N_i \ge 1$; perché $\hat{\Sigma}_i$ sia invertibile servono almeno $n + 1$ campioni del modo non tutti in un sottospazio di dimensione minore di $n$.`,
    steps: [
      {
        latex: md`\ln p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = \sum_{j=1}^{N} \sum_{i=1}^{M} y_{ji} \left[ \ln P_i + \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`,
        why: md`Log-verosimiglianza dei dati completi della mistura, ricavata in [«le due verosimiglianze»](#derivation:der02) e in [«la mistura come modello a variabile latente»](#derivation:der07).`,
      },
      {
        latex: md`\ln l(\boldsymbol{\theta} \,|\, \mathbf{Z}) = \sum_{i=1}^{M} \Big( \sum_{j=1}^{N} y_{ji} \Big) \ln P_i + \sum_{i=1}^{M} \sum_{j=1}^{N} y_{ji} \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)`,
        why: md`Si riordina: un termine con i soli prior e $M$ termini separati, uno per modo, ciascuno con i soli campioni che hanno $y_{ji} = 1$. Non compare nessun logaritmo di una somma.`,
      },
      {
        latex: md`\frac{\partial}{\partial P_i} \left[ \sum_{l=1}^{M} N_l \ln P_l + \lambda \left( 1 - \sum_{l=1}^{M} P_l \right) \right] = \frac{N_i}{P_i} - \lambda = 0 \;\Rightarrow\; P_i = \frac{N_i}{\lambda}, \qquad \sum_{i=1}^{M} N_i = N \;\Rightarrow\; \lambda = N`,
        why: md`Primo termine, con $N_i = \sum_j y_{ji}$ numero di campioni del modo $i$ e il vincolo $\sum_i P_i = 1$ imposto con un moltiplicatore di Lagrange, come per le equazioni EM. Ogni $\mathbf{y}_j$ one-hot contiene un solo 1, quindi $\sum_i N_i = \sum_j \sum_i y_{ji} = N$.`,
      },
      {
        latex: md`\hat{P}_i = \frac{1}{N} \sum_{j=1}^{N} y_{ji} = \frac{N_i}{N}, \qquad N_i = \sum_{j=1}^{N} y_{ji}`,
        why: md`Il prior stimato è la frazione di campioni del modo: la stima intuitiva, qui ottenuta come ML.`,
      },
      {
        latex: md`\frac{\partial}{\partial \mathbf{m}_i} \sum_{j=1}^{N} y_{ji} \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) = \sum_{j=1}^{N} y_{ji} \, \Sigma_i^{-1} (\mathbf{x}_j - \mathbf{m}_i) = \mathbf{0}`,
        why: md`Termine del modo $i$: è la log-verosimiglianza di una sola gaussiana calcolata sui campioni del modo. La derivata della forma quadratica è la stessa di [«come si ricavano le tre equazioni EM»](#derivation:der05); moltiplicando per $\Sigma_i$ resta $\sum_j y_{ji}(\mathbf{x}_j - \mathbf{m}_i) = \mathbf{0}$.`,
      },
      {
        latex: md`\hat{\mathbf{m}}_i = \frac{1}{N_i} \sum_{j=1}^{N} y_{ji} \, \mathbf{x}_j, \qquad \hat{\Sigma}_i = \frac{1}{N_i} \sum_{j=1}^{N} y_{ji} \, (\mathbf{x}_j - \hat{\mathbf{m}}_i)(\mathbf{x}_j - \hat{\mathbf{m}}_i)^{t}`,
        why: md`La ML di una gaussiana sui propri campioni è la media e la covarianza campionarie, con $1/N_i$, come nel modulo sulla stima ML della gaussiana: forma chiusa, niente iterazioni. La covarianza si ricava come in [«come si ricavano le tre equazioni EM»](#derivation:der05), con $y_{ji}$ al posto delle posterior. È il *solve the ML estimation problem directly* delle note.`,
      },
      {
        latex: md`E\{ y_{ji} \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]} \} = P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})`,
        why: md`Ma $\mathbf{Y}$ non si osserva. Il suo sostituto migliore, data la stima corrente, è il valore atteso: per un indicatore 0/1 è la probabilità a posteriori del modo ([«dalla definizione di Q al caso discreto della mistura»](#derivation:der03)).`,
      },
      {
        latex: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{[k]}) = E\{ \ln l(\boldsymbol{\theta} \,|\, \mathbf{Z}) \,|\, \mathbf{X}, \boldsymbol{\theta}^{[k]} \} = \ln l(\boldsymbol{\theta} \,|\, \mathbf{Z}) \Big|_{\, y_{ji} \,\to\, P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}`,
        why: md`Il log dei dati completi è lineare negli $y_{ji}$ e i coefficienti non contengono variabili latenti: il valore atteso dell'E-step si ottiene sostituendo ogni $y_{ji}$ con il suo valore atteso. È il senso preciso della slide p73: l'E-step calcola il valore atteso *by including the latent variables as if they were observed*.`,
      },
      {
        latex: md`\begin{aligned} N_i^{[k]} &= \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}), \qquad P_i^{[k+1]} = \frac{N_i^{[k]}}{N}, \qquad \mathbf{m}_i^{[k+1]} = \frac{1}{N_i^{[k]}} \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, \mathbf{x}_j \\ \Sigma_i^{[k+1]} &= \frac{1}{N_i^{[k]}} \sum_{j=1}^{N} P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, (\mathbf{x}_j - \mathbf{m}_i^{[k+1]})(\mathbf{x}_j - \mathbf{m}_i^{[k+1]})^{t} \end{aligned}`,
        why: md`Massimizzare $Q$ porta allora alle formule dei passi precedenti con $y_{ji}$ sostituito dalla posterior e $N_i$ dal conteggio morbido $N_i^{[k]}$: sono esattamente le tre equazioni della slide p76.`,
      },
      {
        latex: md`\hat{P}_i = \frac{N_i}{N}, \qquad \hat{\mathbf{m}}_i = \frac{1}{N_i} \sum_{\mathbf{x}_j \in \text{modo } i} \mathbf{x}_j, \qquad \hat{\Sigma}_i = \frac{1}{N_i} \sum_{\mathbf{x}_j \in \text{modo } i} (\mathbf{x}_j - \hat{\mathbf{m}}_i)(\mathbf{x}_j - \hat{\mathbf{m}}_i)^{t}`,
        why: md`Caso limite: se ogni posterior vale 0 o 1 (campione assegnato con certezza a un modo), le equazioni EM tornano alle stime con etichette note. Con covarianze $\sigma^2 I$ e $\sigma \to 0$ le posterior diventano proprio 0/1, con il modo più vicino al campione: è il [limite k-means](#formula:f-c67-2).`,
      },
    ],
    conclusion: md`Con le etichette note la ML della mistura si risolve in forma chiusa, modo per modo: frazione di campioni, media e covarianza campionarie. EM fa la stessa cosa senza etichette: nell'E-step sostituisce ogni etichetta con la sua probabilità a posteriori, nell'M-step applica le formule dei dati completi con questi pesi «morbidi». Poiché le posterior dipendono dai parametri, si itera.`,
    source: [{ doc: 'part1', page: 47 }, { doc: 'ch2', page: 71 }, { doc: 'ch2', page: 76 }, { doc: 'ch2', page: 73 }],
  },
]
