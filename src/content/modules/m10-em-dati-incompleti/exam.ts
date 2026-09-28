// Domande d'orale del modulo m10 (stima con dati incompleti, algoritmo EM, mistura di gaussiane):
// le tredici della banca d'esame collegate a queste pagine (testo verbatim in bankText), poi otto domande
// sulle parti più chieste. Le risposte sono in prima persona, come le direbbe lo studente.
import { md } from '../../types'
import type { ExamQuestion } from '../../types'

export const exam: ExamQuestion[] = [
  // --- banca d'esame ---
  {
    id: 'or-banca-1',
    q: md`Che cos'è l'algoritmo EM e come funziona? Spiega la formula e i due passi. Poi l'esempio della mistura di gaussiane (*Multi Gaussian*) risolta con EM. Infine il K-NN, con un esempio.`,
    qEn: 'What is the EM algorithm and how does it work? Explain the formula and both steps. Then the multi-Gaussian (mixture) example for EM. Finally K-NN and a K-NN example.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'What is an EM algorithm and how does it work? Explain formula and both steps. Then Multi Gaussian example for EM algorithm. KNN and KNN example.',
    answer: md`**Contesto.** Finora ho stimato modelli che dipendono solo da variabili osservabili. In molti casi reali il modello dipende anche da variabili latenti non osservate (*unobserved latent variables*): l'etichetta del modo che ha generato un campione, oppure il valore di una feature che non è stato misurato. Non voglio buttare questa informazione parziale, e con dati incompleti uso l'approccio parametrico: una forma nota della pdf con un vettore di parametri $\boldsymbol{\theta}$. L'algoritmo EM (*Expectation-Maximization*) è la soluzione a questa classe di problemi: un metodo iterativo di stima a massima verosimiglianza con variabili latenti.

**Formulazione.** Il criterio resta quello ML:

$$\boldsymbol{\theta}^{*} = \arg\max \; l(\boldsymbol{\theta} | \mathbf{X}), \qquad l(\boldsymbol{\theta} | \mathbf{X}) = p(\mathbf{X} | \boldsymbol{\theta}) = \prod_{i=1}^{N} p(\mathbf{x}_i | \boldsymbol{\theta})$$

Secondo la forma di $p(\mathbf{X}|\boldsymbol{\theta})$ il problema è facile o difficile. Faccio due ipotesi: $\mathbf{X}$ è osservato ed è il dataset incompleto (*incomplete dataset*); esiste un dataset completo $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$, dove $\mathbf{Y}$ sono i dati mancanti. La densità congiunta è

$$p(\mathbf{Z} | \boldsymbol{\theta}) = p(\mathbf{X}, \mathbf{Y} | \boldsymbol{\theta}) = p(\mathbf{Y} | \mathbf{X}, \boldsymbol{\theta}) \cdot p(\mathbf{X} | \boldsymbol{\theta})$$

La verosimiglianza dei dati completi $l(\boldsymbol{\theta}|\mathbf{Z}) = p(\mathbf{X}, \mathbf{Y}|\boldsymbol{\theta})$ sarebbe facile da massimizzare ma non la posso calcolare; quella dei dati incompleti $l(\boldsymbol{\theta}|\mathbf{X}) = p(\mathbf{X}|\boldsymbol{\theta})$ la posso calcolare ma è difficile da massimizzare.

**La formula.** EM calcola il valore atteso di $\log p(\mathbf{X}, \mathbf{Y}|\boldsymbol{\theta})$ rispetto a $\mathbf{y}$, dati $\mathbf{X}$ e una stima corrente di $\boldsymbol{\theta}$. È l'aspettazione condizionata (*conditional expectation*):

$$Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{ \log p(\mathbf{X}, \mathbf{Y} | \boldsymbol{\theta}) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\} = \int \log p(\mathbf{X}, \mathbf{y} | \boldsymbol{\theta}) \, p(\mathbf{y} | \mathbf{X}, \boldsymbol{\theta}^{(k)}) \, d\mathbf{y}$$

I due argomenti hanno ruoli diversi: $\boldsymbol{\theta}^{(k)}$ è fisso e decide i pesi della media, $\boldsymbol{\theta}$ è la variabile libera. Dopo l'integrazione $\mathbf{Y}$ sparisce: la media toglie l'incertezza sulle latenti.

**I due passi.** Scelgo $\boldsymbol{\theta}^{(0)}$ a caso o con conoscenza a priori, poi alterno:

$$\text{E-step:} \quad Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{ \log p(\mathbf{X}, \mathbf{Y} | \boldsymbol{\theta}) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\}, \qquad \text{M-step:} \quad \boldsymbol{\theta}^{(k+1)} = \arg\max \; Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$$

Nell'E-step tratto le latenti come se fossero osservate, pesandole con la loro distribuzione sotto la stima corrente; nell'M-step rifaccio una stima ML su quella verosimiglianza attesa. I parametri dell'M-step fanno partire un nuovo E-step, e mi fermo quando $\boldsymbol{\theta}$ non cambia più in modo significativo. La log-verosimiglianza non scende mai, $l(\boldsymbol{\theta}^{(i+1)}) \ge l(\boldsymbol{\theta}^{(i)})$, ma non ho garanzia di arrivare al massimo globale: posso fermarmi su un massimo locale o su un punto di sella.

**Esempio multi-gaussiano.** Ho $N$ osservazioni i.i.d. in uno spazio a $n$ dimensioni, estratte da

$$p(\mathbf{x}) = \sum_{i=1}^{M} P_i \, p(\mathbf{x} | \mathbf{m}_i, \Sigma_i), \qquad \boldsymbol{\theta} = [P_1, \ldots, P_M; \; \mathbf{m}_1, \ldots, \mathbf{m}_M; \; \Sigma_1, \ldots, \Sigma_M]$$

Voglio stimare ciascun modo. È un problema con dati incompleti per tre motivi: osservo solo l'intera $p(\mathbf{x})$ e non i singoli modi; non so a quale modo appartiene ogni campione; so solo che i modi nascosti si sommano. Qui $\mathbf{Y}$ è il vettore binario che dice quale modo ha generato ciascun campione. L'E-step calcola per ogni campione e ogni modo la probabilità a posteriori

$$P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = \frac{P_i^{[k]} \, p(\mathbf{x}_j | \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j | \boldsymbol{\theta}^{[k]})}$$

e l'M-step aggiorna

$$P_i^{[k+1]} = \frac{1}{N} \sum_{j=1}^{N} P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}), \qquad \mathbf{m}_i^{[k+1]} = \frac{\sum_{j} P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, \mathbf{x}_j}{\sum_{j} P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}, \qquad \Sigma_i^{[k+1]} = \frac{\sum_{j} P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, (\mathbf{x}_j - \mathbf{m}_i^{[k+1]})(\mathbf{x}_j - \mathbf{m}_i^{[k+1]})^{t}}{\sum_{j} P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}$$

Con numeri: sei luminosità di pesci $\{2, 3, 4, 5, 7, 8\}$, $M = 2$, partenza $P = (0.5, 0.5)$, $m = (3, 6)$, $\sigma^2 = (1, 1)$. Per $x = 4$ la posterior del modo 1 è $\frac{0.12099}{0.12099 + 0.02700} = 0.8176$. Dopo una iterazione ottengo $P = (0.498, 0.502)$, $m = (3.062, 6.592)$, $\sigma^2 = (0.851, 1.860)$, e la log-verosimiglianza sale da $-13.258$ a $-12.327$.

**K-NN.** È una stima non parametrica: fisso $K$, allargo una cella attorno a $\mathbf{x}^*$ finché contiene $K$ campioni e ne misuro il volume:

$$\hat{p}(\mathbf{x}^*) = \frac{K}{N \, V_K(\mathbf{x}^*)}$$

È consistente se $K_N \to +\infty$ e $K_N / N \to 0$, per esempio $K = \sqrt{N}$. Con $K$ piccolo la stima è frastagliata, con $K$ grande è troppo liscia. Come classificatore: fra i $K$ vicini di $\mathbf{x}$, $K_i$ sono della classe $\omega_i$; da $\hat{p}(\mathbf{x}|\omega_i) = \frac{K_i}{N_i V}$ e $\hat{P}(\omega_i) = \frac{N_i}{N}$ ricavo $\hat{P}(\omega_i|\mathbf{x}) = \frac{K_i}{K}$ e scelgo la classe più rappresentata. Esempio: $K = 5$, fra i vicini 3 salmoni e 2 spigole, classifico salmone con posterior stimata $3/5$.`,
    checklist: [
      'contesto: variabili latenti, dati incompleti, approccio parametrico, EM come stima ML iterativa',
      md`$\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$, densità congiunta, verosimiglianza completa e incompleta`,
      md`formula di $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ come aspettazione e come integrale, ruolo dei due argomenti`,
      'E-step e M-step, inizializzazione, criterio di arresto',
      'monotonia della log-verosimiglianza e nessuna garanzia di massimo globale',
      'mistura: formula, vettore θ, tre motivi di incompletezza, posterior e le tre equazioni di aggiornamento',
      md`K-NN: $\hat{p} = K/(N V_K)$, consistenza, classificatore con un esempio`,
    ],
    followUps: [
      {
        q: md`Perché per la mistura non basta annullare la derivata della log-verosimiglianza?`,
        a: md`Perché $\ln l = \sum_j \ln \sum_i P_i \, p(\mathbf{x}_j|\mathbf{m}_i, \Sigma_i)$ contiene il logaritmo di una somma. Annullando la derivata rispetto a $\mathbf{m}_i$ ottengo una media pesata dalle posterior, che però dipendono da tutto $\boldsymbol{\theta}$: un'equazione implicita, senza forma chiusa. EM la risolve fissando le posterior nell'E-step e aggiornando i parametri nell'M-step.`,
      },
      {
        q: md`Che cosa succede nell'E-step se due componenti partono identiche?`,
        a: md`Ogni campione riceve posterior $1/2$ da entrambe, l'M-step dà a entrambe media e varianza globali e l'algoritmo resta fermo lì: è un punto stazionario, di solito un punto di sella. Per questo inizializzo le componenti diverse o riparto da più punti.`,
      },
      {
        q: md`Il K-NN potrebbe stimare i modi della mistura?`,
        a: md`No. Stima la $p(\mathbf{x})$ complessiva e non restituisce $P_i$, $\mathbf{m}_i$, $\Sigma_i$. Ignora anche l'informazione a priori che la forma è una somma di gaussiane, e per questo le note lo definiscono sub-ottimo in questo problema.`,
      },
    ],
  },
  {
    id: 'or-banca-2',
    q: md`Apprendimento non supervisionato (tutto quello che sai), più il kernel gaussiano legato alla distanza. All'orale: spiega meglio il meccanismo di EM per la mistura di gaussiane e come si legge il risultato; poi che cosa sono i kernel e quando si usano.`,
    qEn: 'Unsupervised learning (everything you know), plus the Gaussian kernel and its link with distance. Then: explain the mechanism of EM for the Gaussian mixture and how to read the result; finally, what kernels are and when we use them.',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Unsupervised learning (everything I knew) + gaussian kernel related to gaussian distance (he said something during lessons, nothing in slides about that). During the oral part he asked me to explain better the mechanism of EM used for gaussian mixture and to explain the result then he asked me what are kernels and when we use them',
    answer: md`**Apprendimento non supervisionato.** Ho solo gli input, senza etichette: le etichette costano o non so nemmeno come assegnarle. Cerco una struttura nei dati, di solito raggruppando gli esempi simili (*clustering*). Il k-means rappresenta ogni cluster con la sua media $\boldsymbol{\mu}_i$: inizializzo le medie, assegno ogni esempio alla media più vicina, ricalcolo le medie, ripeto finché non cambiano. Devo scegliere $k$ e la distanza (euclidea, Minkowski, similarità del coseno). La qualità si misura con la somma degli errori quadratici (*sum-of-squared errors*)

$$E = \sum_{i=1}^{k} \sum_{\mathbf{x} \in D_i} \Vert \mathbf{x} - \boldsymbol{\mu}_i \Vert^2$$

e $k$ si sceglie con il metodo del gomito (*elbow*) o con la silhouette media. Il clustering gerarchico costruisce invece un dendrogramma, dal basso (agglomerativo, fondendo la coppia di cluster più simile con distanza minima, massima, media o fra centroidi) o dall'alto (divisivo).

**Meccanismo di EM per la mistura.** La mistura modella i dati come $p(\mathbf{x}) = \sum_{i=1}^{M} P_i \, p(\mathbf{x}|\mathbf{m}_i, \Sigma_i)$. Se sapessi quale gaussiana ha generato ciascun esempio farei una stima ML per gruppo. Non lo so: l'appartenenza è una variabile latente, un vettore binario per esempio. Parto da una stima $\boldsymbol{\theta}^{[0]}$ e alterno due passi.

- E-step: calcolo per ogni esempio la probabilità di appartenere a ciascuna gaussiana, cioè il valore atteso dell'indicatore binario:

$$P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = \frac{P_i^{[k]} \, p(\mathbf{x}_j | \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{\sum_{l=1}^{M} P_l^{[k]} \, p(\mathbf{x}_j | \mathbf{m}_l^{[k]}, \Sigma_l^{[k]})}$$

- M-step: rifaccio le stime ML con gli esempi pesati da queste probabilità: prior come frazione media, media pesata, covarianza pesata attorno alla nuova media.

Formalmente l'M-step massimizza $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\{\log p(\mathbf{X}, \mathbf{Y}|\boldsymbol{\theta}) \mid \mathbf{X}, \boldsymbol{\theta}^{(k)}\}$, e la log-verosimiglianza dei dati non scende mai.

**Come leggo il risultato.** Ottengo un modello generativo: per ogni cluster un peso $P_i$ (quanta parte dei dati spiega), un centro $\mathbf{m}_i$ e una forma $\Sigma_i$ (ellissi orientate, mentre il k-means vede solo sfere attorno alle medie). Ogni esempio ha un'assegnazione morbida (*soft assignment*), le sue posterior: un punto fra due cluster può valere $0.6$ e $0.4$. Se mi serve una partizione assegno il punto al cluster con posterior massima. Il risultato è un punto stazionario della verosimiglianza, di solito un massimo locale ma può essere un punto di sella (slide 75 di Melgani): dipende dall'inizializzazione, e conviene ripartire più volte. Il k-means è il caso limite con covarianze $\sigma^2 I$ uguali e $\sigma \to 0$: le posterior diventano 0 o 1.

**Kernel gaussiano e distanza.**

$$k_\sigma(\mathbf{x}, \mathbf{x}') = \exp\left(-\frac{\Vert \mathbf{x} - \mathbf{x}' \Vert^2}{2\sigma^2}\right)$$

dipende solo dalla distanza euclidea: vale 1 se i punti coincidono e scende a zero quando si allontanano, con $\sigma$ a fissare la scala di «vicino». È la stessa forma delle componenti di una mistura con $\Sigma = \sigma^2 I$ e del kernel di Parzen a simmetria sferica. Poiché $\sigma$ è una sola per tutte le direzioni, normalizzo prima le feature. $\sigma$ piccolo rende l'influenza molto locale (*overfitting*), $\sigma$ grande la allarga fino a un comportamento quasi lineare (*underfitting*).

**Che cosa sono i kernel e quando li uso.** Un kernel è una funzione di similarità che corrisponde a un prodotto scalare in uno spazio delle feature, $k(\mathbf{x}, \mathbf{x}') = \phi(\mathbf{x})^T \phi(\mathbf{x}')$. È valido se la matrice di Gram è semidefinita positiva per ogni insieme di punti. Lo uso quando un algoritmo dipende dai dati solo attraverso prodotti scalari (SVM nel duale, percettrone, k-means nello spazio delle feature): con il *kernel trick* sostituisco il prodotto scalare con $k$ e ottengo confini non lineari senza calcolare $\phi$. Il gaussiano ha uno spazio delle feature a dimensione infinita ed è universale. Esistono kernel anche per sequenze, alberi e grafi.`,
    checklist: [
      'setting non supervisionato e clustering',
      'k-means: algoritmo, scelta di k e della distanza, criterio SSE',
      'mistura di gaussiane: appartenenza latente, E-step con le posterior, M-step con le stime pesate',
      'lettura del risultato: pesi, medie, covarianze, assegnazione morbida, punto stazionario (di solito massimo locale)',
      md`kernel gaussiano come funzione della distanza euclidea, ruolo di $\sigma$ e normalizzazione`,
      'kernel come prodotto scalare in uno spazio delle feature, kernel trick, quando si usano',
    ],
    followUps: [
      {
        q: md`Che differenza c'è fra l'assegnazione del k-means e quella del GMM?`,
        a: md`Il k-means assegna ogni esempio a un solo cluster (assegnazione dura). Il GMM dà a ogni esempio una probabilità per cluster: un punto sul confine contribuisce a entrambe le medie. Con $\Sigma_i = \sigma^2 I$ comune e $\sigma \to 0$ le posterior diventano 0 o 1 e il GMM si riduce al k-means.`,
      },
      {
        q: md`Perché il kernel gaussiano richiede feature normalizzate?`,
        a: md`Perché usa una sola $\sigma$ in tutte le direzioni: una feature con una scala numerica più grande dominerebbe $\Vert\mathbf{x} - \mathbf{x}'\Vert^2$ e le «sfere» del kernel ignorerebbero le altre.`,
      },
      {
        q: md`Come scelgo il numero di gaussiane?`,
        a: md`Come per il k-means: provo diversi valori e guardo dove la curva dell'errore (o della verosimiglianza) smette di migliorare, oppure la silhouette media. La verosimiglianza da sola cresce sempre con più componenti, quindi non basta.`,
      },
    ],
  },
  {
    id: 'or-banca-3',
    q: md`Apprendimento non supervisionato. Qual è la formula dell'algoritmo EM, in particolare l'M-step per la mistura di gaussiane? (Lo studente aveva scritto l'E-step ma non l'M-step.)`,
    qEn: "Unsupervised learning: what is the formula of the EM algorithm, in particular the M-step for the Gaussian mixture model? (The student had written the E-step formula but not the M-step one.)",
    prof: 'Passerini',
    fromBank: true,
    bankText: "Unsupervised learning Q: what's the formula of the EM-algo, M-step for the Gaussian mixture model (because I wrote the e step formula but not the m step one)",
    answer: md`**Formula generale.** EM massimizza la verosimiglianza dei dati osservati alternando

$$\text{E-step:} \quad Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{ \log p(\mathbf{X}, \mathbf{Y} | \boldsymbol{\theta}) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\}, \qquad \text{M-step:} \quad \boldsymbol{\theta}^{(k+1)} = \arg\max \; Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$$

**E-step della mistura.** Con $p(\mathbf{x}) = \sum_{i=1}^{M} P_i \, p(\mathbf{x}|\mathbf{m}_i, \Sigma_i)$ la variabile latente è l'indicatore $y_{ji}$ (vale 1 se $\mathbf{x}_j$ viene dal modo $i$). Il suo valore atteso è la posterior del modo:

$$P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = \frac{P_i^{[k]} \, p(\mathbf{x}_j | \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j | \boldsymbol{\theta}^{[k]})}, \qquad p(\mathbf{x}_j | \boldsymbol{\theta}^{[k]}) = \sum_{l=1}^{M} P_l^{[k]} \, p(\mathbf{x}_j | \mathbf{m}_l^{[k]}, \Sigma_l^{[k]})$$

Il log della congiunta è lineare negli indicatori, quindi Q si ottiene sostituendo gli indicatori con le posterior:

$$Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{[k]}) = \sum_{j=1}^{N} \sum_{i=1}^{M} P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \left[ \ln P_i + \ln p(\mathbf{x}_j | \mathbf{m}_i, \Sigma_i) \right]$$

**M-step: le tre equazioni.** Le posterior sono numeri fissi, e Q si separa in un termine per i prior e uno per ciascun modo.

$$P_i^{[k+1]} = \frac{1}{N} \sum_{j=1}^{N} \frac{P_i^{[k]} \, p(\mathbf{x}_j | \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j | \boldsymbol{\theta}^{[k]})}$$

$$\mathbf{m}_i^{[k+1]} = \frac{\sum_{j=1}^{N} P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, \mathbf{x}_j}{\sum_{j=1}^{N} P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}, \qquad \Sigma_i^{[k+1]} = \frac{\sum_{j=1}^{N} P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \, (\mathbf{x}_j - \mathbf{m}_i^{[k+1]})(\mathbf{x}_j - \mathbf{m}_i^{[k+1]})^{t}}{\sum_{j=1}^{N} P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}$$

**Da dove vengono.** Per i prior massimizzo $\sum_j \sum_i P(i|\mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \ln P_i$ con il vincolo $\sum_i P_i = 1$: con il moltiplicatore di Lagrange ottengo $P_i = \frac{1}{\lambda}\sum_j P(i|\mathbf{x}_j, \boldsymbol{\theta}^{[k]})$ e, sommando sui modi, $\lambda = N$ perché le posterior di ogni campione sommano a 1. Per la media annullo $\sum_j P(i|\mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \Sigma_i^{-1}(\mathbf{x}_j - \mathbf{m}_i)$; per la covarianza derivo rispetto a $\Sigma_i^{-1}$. I passaggi sono nella dimostrazione [«come si ricavano le tre equazioni EM»](#derivation:der05).

**Come le ricordo.** Sono le stime ML di una gaussiana (frequenza relativa, media campionaria, covarianza campionaria) in cui ogni campione conta in proporzione alla sua posterior. Se le posterior fossero 0 o 1 (etichette note) ritroverei $\hat{P}_i = N_i/N$ e la media e la covarianza di ciascun gruppo. Le tre equazioni usano tutte le posterior calcolate con $\boldsymbol{\theta}^{[k]}$; aggiorno le medie prima delle covarianze, perché gli scarti usano $\mathbf{m}_i^{[k+1]}$.

**Esempio.** Sei luminosità $\{2, 3, 4, 5, 7, 8\}$, partenza $P = (0.5, 0.5)$, $m = (3, 6)$, $\sigma^2 = (1, 1)$. Le posterior del modo 1 sono $0.9994, 0.9890, 0.8176, 0.1824, 0.0006, 0.0000$, con somma $2.989$: quindi $P_1 = 2.989/6 = 0.498$, $m_1 = 3.062$, $\sigma_1^2 = 0.851$; per il modo 2 $m_2 = 6.592$, $\sigma_2^2 = 1.860$.`,
    checklist: [
      md`E-step: posterior del modo con il denominatore $p(\mathbf{x}_j|\boldsymbol{\theta}^{[k]})$`,
      md`Q della mistura come somma pesata di $\ln P_i + \ln p(\mathbf{x}_j|\mathbf{m}_i, \Sigma_i)$`,
      'le tre equazioni dell’M-step scritte per intero',
      md`vincolo $\sum_i P_i = 1$ e moltiplicatore di Lagrange ($\lambda = N$)`,
      'lettura come stime ML pesate e caso limite con etichette note',
      md`ordine: medie prima delle covarianze, posterior tutte calcolate con $\boldsymbol{\theta}^{[k]}$`,
    ],
    followUps: [
      {
        q: md`Nella slide l'equazione della covarianza usa $\mathbf{m}_i^{[k+1]}$ anche dentro la gaussiana del peso. È giusto?`,
        a: md`È un refuso: il peso dev'essere la stessa posterior dell'E-step, calcolata con $\mathbf{m}_i^{[k]}$ e $\Sigma_i^{[k]}$. Con $\mathbf{m}_i^{[k+1]}$ nel numeratore e $p(\mathbf{x}_j|\boldsymbol{\theta}^{[k]})$ nel denominatore i pesi non sommano più a 1 sui modi. Vicino alla convergenza le due forme danno quasi lo stesso numero. Nella stessa slide anche $P_j^{[k]}$ nella prima equazione è un refuso per $P_i^{[k]}$.`,
      },
      {
        q: md`Perché il prior aggiornato è una media e non una somma?`,
        a: md`Perché $\sum_j P(i|\mathbf{x}_j, \boldsymbol{\theta}^{[k]})$ è il numero «morbido» di campioni del modo $i$: diviso per $N$ diventa una frazione. Sommando sui modi ottengo $N/N = 1$, quindi i nuovi prior rispettano il vincolo da soli.`,
      },
      {
        q: md`Se tengo le varianze fisse e aggiorno solo le medie, EM funziona ancora?`,
        a: md`Sì: Q si massimizza solo rispetto alle medie e la log-verosimiglianza continua a non scendere. È il caso dell'esempio di Passerini con $k$ gaussiane 1-D di varianza nota, dove l'M-step è solo la media pesata.`,
      },
    ],
  },
  {
    id: 'or-banca-4',
    q: md`Reti bayesiane: formalizzazione (DAG, indipendenze locali, i casi del criterio di d-separazione, criterio generale e indipendenze globali) e apprendimento dei parametri (ML con dati completi, MAP con conoscenza a priori, EM con dati incompleti).`,
    qEn: 'Bayesian networks: formalization (DAG, local independencies, the cases of the d-separation criterion, general d-separation criterion and global independencies) and parameter learning (ML with complete data, MAP with prior knowledge, EM with incomplete data).',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Bayesian networks: formalization (DAG, local independencies, various case of d-separation criterion, general d-separation criterion and global independencies) and learning of the parameters (ML with complete data, MAP with prior knowledge, EM with incomplete data)',
    answer: md`**Formalizzazione.** Una rete bayesiana è una coppia $(G, p)$: $G$ è un grafo orientato aciclico (*directed acyclic graph*, DAG) con un nodo per variabile, $p$ è una distribuzione congiunta che si fattorizza secondo $G$:

$$p(x_1, \ldots, x_m) = \prod_{i=1}^{m} p(x_i \mid Pa_{x_i})$$

Ogni nodo porta la distribuzione condizionata dai genitori (CPD), una tabella (CPT) se le variabili sono discrete.

**Indipendenze locali.** Ogni variabile è indipendente dai suoi non discendenti dati i genitori: $I_\ell(G) = \{x_i \perp \mathrm{NonDesc}_{x_i} \mid Pa_{x_i}\}$. Se $p$ le soddisfa, $G$ è una I-map di $p$, e $p$ si fattorizza secondo $G$ se e solo se $G$ è una sua I-map.

**Casi della d-separazione.**
- *Tail-to-tail* $a \leftarrow c \rightarrow b$: $a$ e $b$ dipendenti, indipendenti se osservo $c$.
- *Head-to-tail* $a \rightarrow c \rightarrow b$: dipendenti, indipendenti dato $c$.
- *Head-to-head* $a \rightarrow c \leftarrow b$: indipendenti finché non osservo $c$ o un suo discendente; se lo osservo diventano dipendenti (*explaining away*).

**Criterio generale e indipendenze globali.** $A$ e $B$ sono d-separati da $C$ se ogni cammino fra loro è bloccato: da un nodo tail-to-tail o head-to-tail che sta in $C$, oppure da un nodo head-to-head che non sta in $C$ e non ha discendenti in $C$. Il grafo codifica le indipendenze globali $I(G) = \{(A \perp B \mid C) : \mathrm{dsep}_G(A; B \mid C)\}$.

**ML con dati completi.** Con esempi i.i.d. la verosimiglianza si fattorizza per esempio e per nodo:

$$p(D \mid \boldsymbol{\theta}) = \prod_{l=1}^{N} \prod_{i=1}^{m} p(x_i(l) \mid pa_i(l), \boldsymbol{\theta}_{X_i \mid Pa_i})$$

Ogni CPD ha parametri disgiunti, quindi la stimo da sola; ogni colonna di una CPT è una multinomiale e la sua stima ML è la frequenza relativa $\theta_{x \mid \mathbf{u}} = \frac{N_{\mathbf{u},x}}{\sum_x N_{\mathbf{u},x}}$. Problema: le configurazioni mai viste ricevono probabilità zero.

**MAP con conoscenza a priori.** Con la prior coniugata, la Dirichlet, i parametri $\alpha_{x|\mathbf{u}}$ fanno da pseudo-conteggi:

$$\theta_{x \mid \mathbf{u}} = \frac{N_{\mathbf{u},x} + \alpha_{x \mid \mathbf{u}}}{\sum_x \left( N_{\mathbf{u},x} + \alpha_{x \mid \mathbf{u}} \right)}$$

**EM con dati incompleti.** Se in alcuni esempi mancano dei valori non posso contare. È lo schema di questo capitolo: i valori mancanti sono $\mathbf{Y}$, il dataset completo è $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$. Inizializzo $\boldsymbol{\theta}$ (a caso o dai soli esempi completi). Nell'E-step calcolo i conteggi attesi con l'inferenza sulla rete corrente:

$$E_{p(\mathbf{X} \mid D, \boldsymbol{\theta})}[N_{ijk}] = \sum_{l=1}^{N} p\left(X_i(l) = x_k, Pa_i(l) = pa_j \mid \mathbf{X}_l, \boldsymbol{\theta}\right)$$

Per un esempio completo il contributo è esatto, 0 oppure 1. Nell'M-step rifaccio la stima ML (o MAP) con i conteggi attesi al posto di quelli veri. È esattamente il $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ di Melgani: il log della verosimiglianza completa è lineare nei conteggi, quindi il suo valore atteso si ottiene sostituendo i conteggi con i loro valori attesi, come nella mistura si sostituisce l'indicatore del modo con la posterior. La verosimiglianza non scende mai e l'algoritmo converge a un punto stazionario, di solito un ottimo locale (può essere anche un punto di sella).`,
    checklist: [
      md`coppia $(G, p)$ e fattorizzazione $\prod_i p(x_i \mid Pa_{x_i})$`,
      'indipendenze locali e I-map',
      'tre casi base della d-separazione con explaining away',
      'criterio generale e indipendenze globali',
      'ML con dati completi: CPD disgiunte, frequenza relativa',
      'MAP con Dirichlet e pseudo-conteggi',
      'EM: conteggi attesi con l’inferenza (E), stima ML con i conteggi attesi (M), ottimo locale',
    ],
    followUps: [
      {
        q: md`Perché con dati completi posso stimare ogni CPT separatamente?`,
        a: md`Perché la log-verosimiglianza è una somma di termini, ciascuno con i soli parametri di una CPD: i parametri sono disgiunti e ogni termine si massimizza da solo.`,
      },
      {
        q: md`Che legame c'è fra i conteggi attesi e la posterior della mistura di gaussiane?`,
        a: md`La mistura è una rete con un nodo nascosto (il modo) e un nodo osservato $\mathbf{x}$. Il conteggio atteso del modo $i$ sul campione $j$ è $P(i|\mathbf{x}_j, \boldsymbol{\theta})$, e l'aggiornamento del prior $P_i = \frac{1}{N}\sum_j P(i|\mathbf{x}_j, \boldsymbol{\theta})$ è la frequenza relativa dei conteggi attesi.`,
      },
      {
        q: md`EM garantisce l'ottimo globale nella rete bayesiana?`,
        a: md`No: si ferma in un punto stazionario della verosimiglianza (o della posterior con MAP), di solito un ottimo locale ma talvolta una sella. Dipende dall'inizializzazione, come nella mistura.`,
      },
    ],
  },
  {
    id: 'or-banca-5',
    q: md`SVM a margine rigido o morbido (a scelta) e apprendimento delle reti bayesiane. Domande successive: iperpiano canonico, perché si usano le condizioni KKT, perché la soluzione del duale coincide con quella del primale, CPD disgiunte nelle reti bayesiane, EM nelle reti bayesiane.`,
    qEn: 'Hard or soft margin SVM (choose one) and learning Bayesian networks. Follow-ups: canonical hyperplane, why we use KKT, why the dual solution equals the primal one, disjoint CPDs in BNs, EM in BNs.',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Hard or soft margin svm (choose one) + Learning bayesian network. Questions afterwards: canonical hyperplane, why do we use kkt, why solution of dual is equal to primal, disjoint cpd in BN, explain E-M in BN',
    answer: md`**SVM a margine rigido.** Cerco l'iperplano $f(\mathbf{x}) = \mathbf{w}^T\mathbf{x} + w_0$ che separa le classi $y \in \{-1, +1\}$ con il margine più grande: la soluzione dipende solo dai vettori di supporto e ha garanzie di generalizzazione.

**Iperplano canonico.** $(\mathbf{w}, w_0)$ e $(c\mathbf{w}, cw_0)$ descrivono lo stesso iperplano, quindi fisso la scala imponendo che il margine di confidenza valga 1: $\min_i y_i(\mathbf{w}^T\mathbf{x}_i + w_0) = 1$. Allora il margine geometrico è $1/\Vert\mathbf{w}\Vert$ per lato e massimizzarlo equivale a

$$\min_{\mathbf{w}, w_0} \frac{1}{2}\Vert\mathbf{w}\Vert^2 \quad \text{s.t.} \quad y_i(\mathbf{w}^T\mathbf{x}_i + w_0) \ge 1 \quad \forall i$$

**Perché le KKT.** È un problema vincolato con disuguaglianze. Scrivo la lagrangiana $L = \frac{1}{2}\Vert\mathbf{w}\Vert^2 - \sum_i \alpha_i [y_i(\mathbf{w}^T\mathbf{x}_i + w_0) - 1]$ con $\alpha_i \ge 0$. Le condizioni KKT (stazionarietà, ammissibilità primale e duale, complementarità $\alpha_i[y_i(\mathbf{w}^T\mathbf{x}_i + w_0) - 1] = 0$) caratterizzano l'ottimo: per un problema convesso con vincoli affini sono necessarie e sufficienti. Dalla stazionarietà ottengo $\mathbf{w} = \sum_i \alpha_i y_i \mathbf{x}_i$ e $\sum_i \alpha_i y_i = 0$; dalla complementarità, $\alpha_i > 0$ solo per i punti sul margine, i vettori di supporto.

**Duale e perché coincide con il primale.** Sostituendo:

$$\max_{\boldsymbol{\alpha}} \sum_i \alpha_i - \frac{1}{2}\sum_{i,j} \alpha_i \alpha_j y_i y_j \mathbf{x}_i^T\mathbf{x}_j \quad \text{s.t.} \quad \alpha_i \ge 0, \; \sum_i \alpha_i y_i = 0$$

L'obiettivo primale è quadratico convesso, i vincoli sono lineari e, con dati separabili, ammissibili: vale la dualità forte, il salto di dualità è zero e il duale dà la stessa soluzione. Il duale dipende dai dati solo tramite prodotti scalari, e lì entrano i kernel.

**Apprendimento delle reti bayesiane e CPD disgiunte.** Con dati completi e i.i.d.

$$p(D|\boldsymbol{\theta}) = \prod_{l=1}^{N}\prod_{i=1}^{m} p(x_i(l) \mid pa_i(l), \boldsymbol{\theta}_{X_i|Pa_i})$$

I parametri delle diverse CPD sono disgiunti: il logaritmo diventa una somma di termini, uno per CPD, e ognuno si massimizza da solo. Per una CPT la stima ML è la frequenza relativa $N_{\mathbf{u},x}/\sum_x N_{\mathbf{u},x}$; con prior di Dirichlet (MAP) aggiungo pseudo-conteggi $\alpha_{x|\mathbf{u}}$.

**EM nelle reti bayesiane.** Con dati mancanti non posso contare. Inizializzo $\boldsymbol{\theta}$; nell'E-step uso l'inferenza sulla rete corrente per calcolare i conteggi attesi $E[N_{ijk}] = \sum_l p(X_i(l) = x_k, Pa_i(l) = pa_j \mid \mathbf{X}_l, \boldsymbol{\theta})$ (per esempi completi valgono 0 o 1); nell'M-step stimo i parametri con i conteggi attesi; ripeto finché i parametri non cambiano più. È l'EM generale: il log della verosimiglianza completa è lineare nei conteggi, quindi $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ si ottiene sostituendo i conteggi con i loro valori attesi. Converge a un punto stazionario, di solito un ottimo locale.`,
    checklist: [
      'problema primale del margine rigido',
      'iperplano canonico: scala fissata con margine di confidenza 1, margine geometrico 1/‖w‖',
      'lagrangiana e condizioni KKT, vettori di supporto dalla complementarità',
      'duale, dualità forte per problema convesso con vincoli lineari, prodotti scalari e kernel',
      'CPD disgiunte: la log-verosimiglianza si separa per CPD, frequenze relative',
      'EM nelle reti: conteggi attesi con l’inferenza, M-step con i conteggi attesi, ottimo locale',
    ],
    followUps: [
      {
        q: md`E con il margine morbido che cosa cambia?`,
        a: md`Aggiungo variabili di scarto $\xi_i \ge 0$: vincoli $y_i(\mathbf{w}^T\mathbf{x}_i + w_0) \ge 1 - \xi_i$ e obiettivo $\frac{1}{2}\Vert\mathbf{w}\Vert^2 + C\sum_i \xi_i$. Nel duale cambia solo il vincolo, $0 \le \alpha_i \le C$.`,
      },
      {
        q: md`Perché EM nelle reti bayesiane usa l'inferenza?`,
        a: md`Per calcolare la distribuzione dei valori mancanti dati quelli osservati e i parametri correnti, cioè la $p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})$ che pesa l'aspettazione di Q. In una rete bayesiana questa posterior si ottiene proprio con l'inferenza.`,
      },
    ],
  },
  {
    id: 'or-banca-6',
    q: md`Il problema dei dati mancanti nelle reti bayesiane.`,
    qEn: 'The problem of missing data in Bayesian networks.',
    prof: 'Passerini',
    fromBank: true,
    bankText: '- Problem of missing data in Bayesian Networks',
    answer: md`**Il problema.** Nei dati reali non tutte le variabili sono osservate in ogni esempio: mancano valori di alcune feature, oppure esistono variabili che non si osservano mai (nascoste). Con dati completi la stima dei parametri è un conteggio: la frequenza relativa $N_{\mathbf{u},x}/\sum_x N_{\mathbf{u},x}$ per ML, più gli pseudo-conteggi per MAP. Se un valore manca non so in quale casella della CPT contare quell'esempio. Integrare esattamente su tutte le configurazioni mancanti (approccio bayesiano completo) è di solito intrattabile, quindi servono metodi approssimati.

**Soluzioni ingenue.** Scartare gli esempi incompleti butta informazione, e il principio è usare tutta l'informazione disponibile, anche parziale. Sostituire il valore mancante con un valore fisso (per esempio il più probabile) finge una certezza che non ho.

**EM.** È la risposta di questo capitolo: tratto i valori mancanti come variabili latenti $\mathbf{Y}$, con $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$ dataset completo, e massimizzo la verosimiglianza dei soli dati osservati $l(\boldsymbol{\theta}|\mathbf{X}) = p(\mathbf{X}|\boldsymbol{\theta})$.

- Inizializzazione: $\boldsymbol{\theta}^{(0)}$ a caso o stimato sugli esempi completi.
- E-step: con l'inferenza sulla rete corrente calcolo la distribuzione dei valori mancanti di ogni esempio, dati quelli osservati, e da lì i conteggi attesi $E[N_{ijk}] = \sum_l p(X_i(l) = x_k, Pa_i(l) = pa_j \mid \mathbf{X}_l, \boldsymbol{\theta})$. Un esempio incompleto viene «diviso» fra le configurazioni compatibili, in proporzione alla loro probabilità.
- M-step: stimo le CPT con i conteggi attesi, come se fossero conteggi veri (ML o MAP).
- Ripeto finché i parametri non cambiano più.

Formalmente l'E-step costruisce $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\{\log p(\mathbf{X}, \mathbf{Y}|\boldsymbol{\theta}) \mid \mathbf{X}, \boldsymbol{\theta}^{(k)}\}$ e l'M-step la massimizza. La verosimiglianza dei dati osservati non scende mai, ma l'algoritmo converge a un punto stazionario, di solito un ottimo locale e talvolta un punto di sella, quindi l'inizializzazione conta.

**Esempio.** Nell'esempio di Melgani con quattro punti 2-D, uno dei quali senza $x_1$, EM non inventa il valore: usa la sua distribuzione. Da $\boldsymbol{\theta}^0 = (0, 0, 1, 1)$ la prima iterazione dà $\mu_1 = (0 + 1 + 2 + 0)/4 = 0.75$ e $\mu_2 = 2$; al limite $\boldsymbol{\mu} = (1, 2)$, $\Sigma = \mathrm{diag}(0.667, 2)$. Scartando il punto incompleto avrei $\mu_2 = 1.33$: perderei l'informazione $x_2 = 4$.

**Ipotesi implicita.** EM ignora il meccanismo che fa mancare i dati: funziona bene se la probabilità che un valore manchi non dipende dal valore stesso.`,
    checklist: [
      'perché i dati mancanti bloccano il conteggio delle statistiche sufficienti',
      'soluzioni ingenue: scartare o imputare, e i loro limiti',
      md`EM: valori mancanti come latenti, $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$`,
      'E-step con l’inferenza e conteggi attesi, M-step con i conteggi attesi',
      'monotonia e punto stazionario (di solito ottimo locale, talvolta sella), importanza dell’inizializzazione',
      'un esempio numerico o concreto',
    ],
    followUps: [
      {
        q: md`Per un esempio completamente osservato, quanto vale il conteggio atteso?`,
        a: md`È esatto: 1 per la configurazione osservata, 0 per le altre. L'inferenza serve solo per gli esempi con valori mancanti.`,
      },
      {
        q: md`Che differenza c'è fra una variabile nascosta e un valore mancante?`,
        a: md`Una variabile nascosta non è mai osservata (come il modo nella mistura di gaussiane); un valore mancante manca solo in alcuni esempi. EM li tratta allo stesso modo: sono entrambi parte di $\mathbf{Y}$.`,
      },
    ],
  },
  {
    id: 'or-banca-7',
    q: md`Qual è la formula della massima verosimiglianza, perché possiamo usare il prodotto delle singole probabilità e che cosa descrive la verosimiglianza? Come si descrive la bontà di una stima? La stima ML è un buon stimatore? È migliore o no della stima bayesiana, e perché? Poi un esercizio di stima ML. Infine: in quale caso ML e stima bayesiana coincidono?`,
    qEn: 'What is the formula of maximum likelihood, why can we use the product of the separate probabilities and what does the likelihood describe? How do we describe the goodness of an estimate? Is the ML estimator a good one? Is it better than Bayesian estimation, and why? Then an ML exercise. Finally: in which case do ML and Bayesian estimation coincide?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'What is the formula of Maximum Likelihood, why we can use the separate products of the probabilities and what the Likelihood describe. How we can describe the goodness of an estimation and Is Maximum Likelihood Estimation a good estimator? Is it better or not with respect to the Bayesian Estimation? Why? Then he asked me to apply Maximum Likelihood estimation on an exercise. Last question was: In which case ML and Bayesian are the same?',
    answer: md`**Formula.** Ho $N$ campioni $\mathbf{X} = \{\mathbf{x}_1, \ldots, \mathbf{x}_N\}$ e una pdf di forma nota $p(\mathbf{x}|\boldsymbol{\theta})$. La stima ML è

$$\boldsymbol{\theta}^{*} = \arg\max \; l(\boldsymbol{\theta} | \mathbf{X}), \qquad l(\boldsymbol{\theta} | \mathbf{X}) = p(\mathbf{X} | \boldsymbol{\theta}) = \prod_{i=1}^{N} p(\mathbf{x}_i | \boldsymbol{\theta})$$

**Perché il prodotto.** I campioni sono i.i.d.: indipendenti, quindi la densità congiunta è il prodotto delle marginali; identicamente distribuiti, quindi ogni fattore usa la stessa $p(\cdot|\boldsymbol{\theta})$. Di solito massimizzo il logaritmo, che trasforma il prodotto in somma e ha lo stesso punto di massimo.

**Che cosa descrive.** La verosimiglianza è la densità dei dati letta come funzione di $\boldsymbol{\theta}$, con i dati fissi: dice quanto ogni valore dei parametri rende plausibili i campioni osservati. Non è una densità su $\boldsymbol{\theta}$.

**Bontà di una stima.** Lo stimatore è una variabile aleatoria perché dipende dai campioni. Guardo il bias $E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}$, la varianza, l'errore quadratico medio che li somma, e la consistenza (la stima converge in probabilità al valore vero per $N \to \infty$). Uno stimatore non distorto è efficiente se raggiunge il limite di Cramér-Rao, la varianza minima possibile.

**ML è buono?** Asintoticamente sì: è non distorto, consistente, efficiente e gaussiano per $N \to \infty$. A $N$ finito può essere distorto: la varianza ML della gaussiana, con $1/N$, ha media $\frac{N-1}{N}\sigma^2$.

**ML contro bayesiano.** La stima bayesiana tratta $\boldsymbol{\theta}$ come variabile aleatoria con una prior $p(\boldsymbol{\theta})$, calcola la posterior $p(\boldsymbol{\theta}|\mathbf{X}) \propto p(\mathbf{X}|\boldsymbol{\theta})\,p(\boldsymbol{\theta})$ e stima $p(\mathbf{x}|\mathbf{X}) = \int p(\mathbf{x}|\boldsymbol{\theta})\,p(\boldsymbol{\theta}|\mathbf{X})\,d\boldsymbol{\theta}$. Con pochi campioni e una prior buona è migliore, perché usa informazione in più e tiene conto dell'incertezza su $\boldsymbol{\theta}$. ML è più semplice da calcolare e non dipende da una prior che potrebbe essere sbagliata; con molti campioni le due stime si avvicinano, e per questo in pratica si usa spesso ML.

**Esercizio.** Gaussiana 1-D con varianza nota e campioni $\{4.8, 5.1, 5.4, 4.9, 5.3\}$ (lunghezze di salmoni in dm). Annullo la derivata di $\sum_i \ln p(x_i|\mu)$: $\sum_i (x_i - \mu)/\sigma^2 = 0$, quindi $\hat{\mu} = \frac{1}{N}\sum_i x_i = 25.5/5 = 5.1$. Se stimo anche la varianza, la sua stima ML è $\frac{1}{N}\sum_i (x_i - \hat{\mu})^2 = (0.09 + 0 + 0.09 + 0.04 + 0.04)/5 = 0.26/5 = 0.052$.

**Quando coincidono.** Quando la prior è piatta (uniforme su un intervallo che contiene il massimo): la posterior è proporzionale alla verosimiglianza e il suo massimo è la stima ML. E asintoticamente, per $N \to \infty$: la verosimiglianza domina la prior, la posterior si stringe attorno a $\hat{\boldsymbol{\theta}}_{ML}$ e $p(\mathbf{x}|\mathbf{X}) \to p(\mathbf{x}|\hat{\boldsymbol{\theta}}_{ML})$.

**Legame con EM.** EM resta una stima ML: nella mistura di gaussiane $\ln l$ contiene il logaritmo di una somma e non ha soluzione in forma chiusa, quindi il massimo si cerca in modo iterativo.`,
    checklist: [
      'formula ML con argmax e prodotto sui campioni',
      'i.i.d.: indipendenza per il prodotto, stessa distribuzione per lo stesso fattore',
      'verosimiglianza come funzione di θ con dati fissi',
      'bias, varianza, consistenza, efficienza (Cramér-Rao)',
      'proprietà asintotiche di ML e distorsione a N finito',
      'confronto con la stima bayesiana (prior, posterior, pochi campioni)',
      'esercizio svolto con numeri',
      'coincidenza con prior piatta e per N → ∞',
    ],
    followUps: [
      {
        q: md`Perché passare al logaritmo non cambia la stima?`,
        a: md`Il logaritmo è strettamente crescente: se $l(\boldsymbol{\theta}_1) > l(\boldsymbol{\theta}_2)$ allora $\ln l(\boldsymbol{\theta}_1) > \ln l(\boldsymbol{\theta}_2)$, quindi il punto di massimo è lo stesso. In più evita l'underflow del prodotto di tante densità piccole.`,
      },
      {
        q: md`Quando la stima ML non ha forma chiusa, che cosa si fa?`,
        a: md`Si usano tecniche iterative. EM è una di queste: per la mistura di gaussiane alterna il calcolo delle posterior dei modi e le stime ML pesate, facendo crescere la verosimiglianza a ogni passo.`,
      },
    ],
  },
  {
    id: 'or-banca-8',
    q: md`Come funziona il criterio a minimo rischio? Confrontalo con la classificazione MAP e ML. Qual è il migliore? Poi scrivi la gaussiana in uno spazio a più dimensioni (con vettore media e matrice di covarianza).`,
    qEn: 'How does the minimum risk criterion work? Compare it with MAP and ML classification. Which one is the best? Then write the multivariate Gaussian (with mean vector and covariance matrix).',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'How does the Minimum risk criterium work, comparison with MAP and ML classification. Which is the best one (minimum risk). He also asked me the formula of the Gaussian curve in a multi dimensional space (with mean vector and covariance matrix).',
    answer: md`**Idea.** MAP e ML minimizzano la probabilità d'errore senza badare a quanto costa ciascun errore. Il minimo rischio porta nella decisione i costi delle azioni: ho azioni $\alpha_1, \ldots, \alpha_R$, classi $\omega_1, \ldots, \omega_C$ e costi $\lambda(\alpha_i|\omega_j) = \lambda_{ij} \ge 0$.

**Rischio condizionato.** Per ogni $\mathbf{x}$ calcolo il costo atteso di ogni azione

$$R(\alpha_i | \mathbf{x}) = \sum_{j=1}^{C} \lambda(\alpha_i | \omega_j) \, P(\omega_j | \mathbf{x})$$

e scelgo l'azione con rischio minimo. Il rischio complessivo che ottengo è il rischio di Bayes, il minimo raggiungibile.

**Due classi.** Scelgo $\alpha_1$ se $R(\alpha_1|\mathbf{x}) \le R(\alpha_2|\mathbf{x})$; con Bayes e $\lambda_{21} > \lambda_{11}$:

$$\frac{p(\mathbf{x}|\omega_1)}{p(\mathbf{x}|\omega_2)} \ge \frac{P(\omega_2)}{P(\omega_1)} \, \frac{\lambda_{12} - \lambda_{22}}{\lambda_{21} - \lambda_{11}}$$

**Confronto.** Con costi 0-1 ($\lambda_{ii} = 0$, $\lambda_{ij} = 1$) il rischio condizionato è $1 - P(\omega_i|\mathbf{x})$ e il minimo rischio diventa MAP, soglia $P(\omega_2)/P(\omega_1)$. Se anche le prior sono uguali diventa ML, soglia 1. Esempio: allarme incendio, dove un falso allarme costa $10^3$ e un incendio non segnalato $10^6$: chiamo i pompieri già con $P(\text{incendio}|\mathbf{x}) \ge 1/1001$, mentre MAP chiamerebbe solo sopra $0.5$.

**Il migliore.** Il minimo rischio, perché è il più generale e contiene gli altri due come casi particolari. Chiede però di conoscere costi, prior e pdf delle classi; e non minimizza la probabilità d'errore, accetta errori economici per evitarne di costosi.

**Gaussiana multivariata.** In $n$ dimensioni, con vettore media $\mathbf{m}$ e matrice di covarianza $\Sigma$ (simmetrica, definita positiva):

$$p(\mathbf{x} | \mathbf{m}, \Sigma) = \frac{1}{(2\pi)^{n/2} \, |\Sigma|^{1/2}} \exp\left\{ -\frac{1}{2} (\mathbf{x} - \mathbf{m})^{t} \, \Sigma^{-1} (\mathbf{x} - \mathbf{m}) \right\}$$

L'esponente è metà del quadrato della distanza di Mahalanobis: le curve di livello sono ellissi centrate in $\mathbf{m}$, con assi lungo gli autovettori di $\Sigma$. Il fattore davanti fa integrare la densità a 1.

**Legame con questo capitolo.** È la densità di ciascun modo della mistura, $p(\mathbf{x}|\mathbf{m}_i, \Sigma_i)$. La posterior del modo che EM calcola nell'E-step è la stessa $P(\omega|\mathbf{x})$ del rischio condizionato, con i prior $P_i$ al posto delle prior di classe: assegnare un campione al modo con posterior massima è il criterio MAP.`,
    checklist: [
      md`azioni, classi, costi $\lambda(\alpha_i \mid \omega_j)$`,
      'rischio condizionato e regola di decisione, rischio di Bayes',
      'caso a due classi con rapporto di verosimiglianza e soglia',
      'MAP con costi 0-1, ML con prior uguali, il minimo rischio è il più generale',
      md`formula della gaussiana multivariata con $(2\pi)^{n/2}$, $|\Sigma|^{1/2}$ e forma quadratica`,
      'lettura: distanza di Mahalanobis, ellissi, normalizzazione',
    ],
    followUps: [
      {
        q: md`Che cosa diventa la gaussiana se $\Sigma = \sigma^2 I$?`,
        a: md`$|\Sigma|^{1/2} = \sigma^n$ e la forma quadratica diventa $\Vert\mathbf{x} - \mathbf{m}\Vert^2/\sigma^2$: curve di livello circolari, come nel kernel di Parzen a simmetria sferica e nel caso limite della mistura che porta al k-means.`,
      },
      {
        q: md`Quanti parametri ha una gaussiana in $n$ dimensioni?`,
        a: md`$n$ per la media e $n(n+1)/2$ per la covarianza, che è simmetrica. Una mistura di $M$ modi ne ha in tutto $(M - 1) + Mn + Mn(n+1)/2$.`,
      },
    ],
  },
  {
    id: 'or-banca-9',
    q: md`Finestre di Parzen: contesto generale (che cosa vogliamo fare, perché è una stima non parametrica), kernel gaussiano a simmetria sferica con formula e disegno. Come influisce la scelta della larghezza? È una buona stima (bias, varianza, caratteristiche della larghezza per una stima consistente)?`,
    qEn: 'Parzen windows: general context (what we want to do, why it is a non-parametric estimation), the Gaussian kernel with spherical symmetry with formula and a drawing. How does the choice of the width affect the estimate? Is it a good estimate (bias, variance, conditions on the width for a consistent estimate)?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Parzen Windows: general context (what we want to do, why they are non parametric estimation), gaussian kernel with spherical symmetry with formula and some drawing to represent it, How the choice of the width impacts our estimate? Is it a good estimate? (Bias, variance and consideration about the characteristics of the width to have a consistent estimate)',
    answer: md`**Contesto.** Voglio la pdf $p(\mathbf{x})$ senza assumerne la forma: nessuna famiglia parametrica, quindi nessun vettore di parametri. Lavoro sui campioni: fisso una regione di volume $V = h^n$ attorno al punto, conto i campioni con una funzione finestra $\gamma$ e stimo

$$\hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \frac{1}{h^{n}} \, \gamma\left( \frac{\mathbf{x} - \mathbf{x}_k}{h} \right)$$

Se $\gamma$ è una densità lo è anche la stima.

**Kernel gaussiano a simmetria sferica** (metodo di Specht):

$$\hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \frac{1}{(2\pi\sigma^2)^{n/2}} \exp\left( -\frac{\Vert \mathbf{x} - \mathbf{x}_k \Vert^2}{2\sigma^2} \right)$$

$\Vert\mathbf{x} - \mathbf{x}_k\Vert$ è la distanza euclidea fra il punto e il campione di training: tutti i punti alla stessa distanza da $\mathbf{x}_k$ ricevono lo stesso contributo, da cui le curve di livello ipersferiche. Il kernel assume che tutte le feature abbiano la stessa varianza: per questo le normalizzo prima, e poi l'unico iperparametro da tarare è $\sigma$.

**Disegno.** Nel piano delle feature una campana con cerchi concentrici su ogni campione, tutte uguali; la stima è la loro somma divisa per $N$, alta dove i campioni si addensano. In 1-D: una gaussiana di area $1/N$ su ogni campione e la curva somma sopra.

**Effetto della larghezza.** Se $\sigma$ è troppo grande il kernel sovra-liscia i dati (*over-smoothing*, *underfitting*): due mode vicine si fondono in una. Se è troppo piccolo la stima è molto variabile, un picco su ogni campione (*overfitting*). Posso anche adattare la larghezza: $\sigma_k$ diverso per ogni campione, pari alla distanza euclidea media dai suoi $L$ vicini più prossimi,

$$\sigma_k = \frac{1}{L} \sum_{l=1}^{L} \Vert \mathbf{x}_k - \mathbf{y}_l \Vert$$

piccolo dove i campioni sono fitti (pochi vuoti da riempire), grande dove sono radi (più incertezza). Il metodo di Specht si implementa come rete neurale probabilistica (*Probabilistic Neural Network*, PNN): un'unità gaussiana per campione, una somma per classe, la classe con densità maggiore in uscita.

**È una buona stima?** La media della stima è una convoluzione, $E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$: una versione sfocata di $p$, distorta a larghezza finita e asintoticamente non distorta se $h_N \to 0$. La varianza è limitata da $\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$ e va a zero se $N h_N^n \to +\infty$. La stima è consistente se valgono insieme

$$\lim_{N \to +\infty} h_N = 0, \qquad \lim_{N \to +\infty} N h_N^n = +\infty$$

per esempio $h_N = 1/\sqrt[2n]{N}$.

**Legame con EM.** Parzen stima la $p(\mathbf{x})$ complessiva; se so che i dati sono una mistura di gaussiane e voglio i singoli modi, le note lo definiscono sub-ottimo e uso l'approccio parametrico con EM.`,
    checklist: [
      md`contesto non parametrico e formula generale con $1/h^n$`,
      md`formula di Specht con $(2\pi\sigma^2)^{n/2}$ e distanza euclidea`,
      'uguale varianza delle feature, normalizzazione, σ unico iperparametro',
      'disegno delle campane sferiche e della loro somma',
      md`σ troppo grande (over-smoothing) e troppo piccolo (overfitting), $\sigma_k$ adattivo dagli L vicini`,
      'bias come convoluzione, bound sulla varianza, condizioni di consistenza con un esempio',
    ],
    followUps: [
      {
        q: md`Quanto vale $\sigma_k$ per un campione con vicini a distanza $1$, $2$ e $3$ se $L = 3$?`,
        a: md`$\sigma_k = (1 + 2 + 3)/3 = 2$. Se i vicini fossero a $0.1$, $0.2$ e $0.3$ varrebbe $0.2$: una zona densa riceve una campana stretta.`,
      },
      {
        q: md`Che cos'è una PNN?`,
        a: md`La stima di Parzen con kernel gaussiano disegnata come rete: uno strato con un'unità gaussiana per ogni campione di training, uno strato che somma le unità di ciascuna classe e un'uscita che sceglie la classe con densità stimata maggiore.`,
      },
    ],
  },
  {
    id: 'or-banca-10',
    q: md`Stima a finestre di Parzen: contesto e proprietà. Qual è la funzione finestra più comune (scrivi la formula)? Parzen è un buon stimatore (bias e varianza)? Mostra con un disegno come funzionano conteggio e interpolazione con una coppia di campioni.`,
    qEn: 'Parzen window estimation: context and properties. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Show graphically how counting and interpolation work with a couple of samples.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Parzen Window Estimation: context, properties etc. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Graphical representation of how the counting/interpolation works with  a couple of samples.',
    answer: md`**Contesto.** Stima non parametrica: parto da $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$ e fisso la regione, un ipercubo di lato $h$ e volume $V = h^n$. Conto i campioni con la finestra $\gamma$, che vale 1 dentro l'ipercubo unitario e 0 fuori:

$$K = \sum_{k=1}^{N} \gamma\left( \frac{\mathbf{x}_k - \mathbf{x}^*}{h} \right) \quad \Rightarrow \quad \hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \frac{1}{h^{n}} \, \gamma\left( \frac{\mathbf{x} - \mathbf{x}_k}{h} \right)$$

**Proprietà.** Se $\gamma \ge 0$ e integra a 1 anche la stima è una densità. Un kernel buono ha il massimo nell'origine, è continuo e va a zero lontano.

**Finestra più comune.** Il kernel gaussiano; in $n$ dimensioni con simmetria sferica

$$\hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \frac{1}{(2\pi\sigma^2)^{n/2}} \exp\left( -\frac{\Vert \mathbf{x} - \mathbf{x}_k \Vert^2}{2\sigma^2} \right)$$

Dipende solo dalla distanza euclidea dal campione, è liscio e si adatta a molti tipi di densità. Richiede feature normalizzate, perché $\sigma$ è la stessa in tutte le direzioni; si può rendere adattivo con $\sigma_k$ pari alla distanza media dai $L$ vicini.

**È un buon stimatore?** Con campioni i.i.d. $E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$: distorto a $h$ finito, asintoticamente non distorto con $h_N \to 0$. La varianza è al più $\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$. Con $h_N \to 0$ e $N h_N^n \to +\infty$ la stima è consistente. A $N$ finito resta il compromesso: $h$ grande sfoca, $h$ piccolo insegue il rumore.

**Disegno con due campioni.** Metto $x_1$ e $x_2$ sull'asse. Conteggio: su ogni campione un rettangolo di base $h$ e altezza $\frac{1}{2h}$; la somma è una scaletta che vale $0$, $\frac{1}{2h}$ oppure $\frac{1}{h}$ dove i rettangoli si sovrappongono. Interpolazione: al posto dei rettangoli due campane gaussiane di area $1/2$; la somma è liscia, con una gobba sola se i campioni sono vicini rispetto a $\sigma$ e due se sono lontani. L'area resta 1 in entrambi i casi.

**Legame con EM.** Con una somma di due gaussiane ho già una mistura: Parzen mette una componente fissa su ogni campione, EM stima poche componenti con peso, centro e forma liberi.`,
    checklist: [
      md`contesto: $\hat{p} = K/(NV)$ con regione fissa e funzione finestra`,
      'formula generale e condizioni sul kernel',
      'kernel gaussiano scritto per esteso',
      'bias come convoluzione, bound sulla varianza, consistenza',
      'disegno: scaletta dei rettangoli e curva liscia delle gaussiane',
    ],
    followUps: [
      {
        q: md`Con due campioni, quando la stima gaussiana 1-D ha una sola gobba?`,
        a: md`Quando la distanza fra i campioni è al più $2\sigma$: le due campane si fondono. Oltre $2\sigma$ compaiono due massimi.`,
      },
      {
        q: md`A $h$ fisso, più campioni migliorano la stima?`,
        a: md`Riducono la varianza ma non il bias: la media della stima è la convoluzione con il kernel e non dipende da $N$.`,
      },
    ],
  },
  {
    id: 'or-banca-11',
    q: md`Spiega la stima ML, sviluppa la derivata prima per una gaussiana e spiega il significato del risultato.`,
    qEn: 'Explain ML estimation, develop the first derivative for a Gaussian and explain the meaning of the result.',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Explain ML estimation, develop the first derivative for a gaussian and explain the meaning of the result.',
    answer: md`**Stima ML.** Assumo una forma nota $p(\mathbf{x}|\boldsymbol{\theta})$ e cerco i parametri che rendono più plausibili i campioni i.i.d.:

$$\boldsymbol{\theta}^{*} = \arg\max \; l(\boldsymbol{\theta} | \mathbf{X}), \qquad l(\boldsymbol{\theta} | \mathbf{X}) = \prod_{j=1}^{N} p(\mathbf{x}_j | \boldsymbol{\theta})$$

Massimizzo il logaritmo, che ha lo stesso punto di massimo, e annullo il gradiente.

**Derivata per una gaussiana.** Con $p(\mathbf{x}|\mathbf{m}, \Sigma)$ gaussiana multivariata:

$$\ln p(\mathbf{x}_j | \mathbf{m}, \Sigma) = -\frac{n}{2}\ln(2\pi) - \frac{1}{2}\ln|\Sigma| - \frac{1}{2}(\mathbf{x}_j - \mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}_j - \mathbf{m})$$

Rispetto alla media:

$$\nabla_{\mathbf{m}} \sum_{j=1}^{N} \ln p(\mathbf{x}_j | \mathbf{m}, \Sigma) = \sum_{j=1}^{N} \Sigma^{-1}(\mathbf{x}_j - \mathbf{m}) = \mathbf{0} \quad \Rightarrow \quad \hat{\mathbf{m}} = \frac{1}{N}\sum_{j=1}^{N} \mathbf{x}_j$$

Annullando la derivata rispetto a $\Sigma^{-1}$ ottengo $\hat{\Sigma} = \frac{1}{N}\sum_j (\mathbf{x}_j - \hat{\mathbf{m}})(\mathbf{x}_j - \hat{\mathbf{m}})^{t}$.

**Significato.** La stima ML della media è la media campionaria e quella della covarianza è la covarianza campionaria con $1/N$: il logaritmo cancella l'esponenziale e l'equazione è lineare nella media, quindi ho una soluzione in forma chiusa. La media è non distorta; la covarianza ha media $\frac{N-1}{N}\Sigma$, quindi è distorta a $N$ finito ma asintoticamente non distorta. Esempio 1-D: luminosità $\{3, 4, 5, 8\}$ danno $\hat{m} = 5$ e $\hat{\sigma}^2 = (4 + 1 + 0 + 9)/4 = 3.5$.

**Il caso difficile: la mistura.** Se $p(\mathbf{x}) = \sum_i P_i\,p(\mathbf{x}|\mathbf{m}_i, \Sigma_i)$, la log-verosimiglianza è $\sum_j \ln \sum_i P_i\,p(\mathbf{x}_j|\mathbf{m}_i, \Sigma_i)$: il logaritmo di una somma non cancella nulla. La stessa derivata diventa

$$\frac{\partial \ln l}{\partial \mathbf{m}_i} = \sum_{j=1}^{N} \frac{P_i \, p(\mathbf{x}_j | \mathbf{m}_i, \Sigma_i)}{\sum_{l=1}^{M} P_l \, p(\mathbf{x}_j | \mathbf{m}_l, \Sigma_l)} \; \Sigma_i^{-1}(\mathbf{x}_j - \mathbf{m}_i) = \mathbf{0}$$

e dà $\mathbf{m}_i$ come media pesata dalle posterior dei modi, che però dipendono a loro volta da $\mathbf{m}_i$: un'equazione implicita. È il motivo per cui serve EM, che fissa le posterior e aggiorna la media, poi ricalcola le posterior. Con etichette note le posterior valgono 0 o 1 e ritrovo la media campionaria di ciascun modo.`,
    checklist: [
      'definizione ML con prodotto sui campioni i.i.d. e passaggio al logaritmo',
      'log della gaussiana multivariata scritto per esteso',
      'gradiente rispetto alla media posto a zero e soluzione come media campionaria',
      'covarianza ML con 1/N e sua distorsione',
      'significato: forma chiusa perché il log cancella l’esponenziale',
      'estensione alla mistura: equazione implicita e motivazione di EM',
    ],
    followUps: [
      {
        q: md`La stima ML della media è efficiente?`,
        a: md`Sì: per la gaussiana la media campionaria è non distorta e ha varianza $\sigma^2/N$, che è esattamente il limite di Cramér-Rao.`,
      },
      {
        q: md`Nella mistura, che cosa impedisce di risolvere l'equazione della media?`,
        a: md`I pesi $P(i|\mathbf{x}_j, \boldsymbol{\theta})$ dipendono da $\mathbf{m}_i$ stesso e dagli altri parametri: le equazioni sono accoppiate e non lineari. EM le spezza: calcola i pesi con la stima vecchia, poi risolve per la media come se fossero costanti.`,
      },
    ],
  },
  {
    id: 'or-banca-12',
    q: md`Spiega la stima non parametrica: che cosa vuol dire non parametrica e perché si usa. Spiega il K-NN e le finestre di Parzen. Tendono alla soluzione ottima?`,
    qEn: 'Explain non-parametric estimation: what non-parametric means and why we use it. Explain both K-NN and Parzen windows. Do they tend to the optimal solution?',
    prof: 'Melgani',
    fromBank: true,
    bankText: 'Explain non-parametric estimation, what non-parametric means and why we use it, explain both KNN and Parzen windows, do they tend to the optimal solution?',
    answer: md`**Che cosa vuol dire.** Nella stima parametrica fisso la forma della pdf e stimo un vettore di parametri. Nella non parametrica non assumo nessuna forma funzionale: stimo la pdf direttamente dai campioni.

**Perché si usa.** Quando non conosco la forma della densità, oppure quando i modelli parametrici disponibili la approssimano male (una densità multimodale non è una gaussiana). Il prezzo è più calcolo, perché si usano tutti i campioni, e più dati per una stima affidabile.

**Principio comune.** La probabilità che un campione cada in una regione $R$ di volume $V$ attorno a $\mathbf{x}^*$ è $P_R \simeq p(\mathbf{x}^*)V$; la stimo con la frequenza relativa $K/N$, quindi

$$\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$$

$R$ deve essere abbastanza grande da contenere molti campioni e abbastanza piccola perché $p$ vi sia quasi costante. Dei due parametri $K$ e $V$ ne fisso uno.

**K-NN.** Fisso $K$ e allargo la cella finché contiene $K$ campioni: $\hat{p}(\mathbf{x}^*) = \frac{K}{N\,V_K(\mathbf{x}^*)}$. $K$ piccolo dà una stima frastagliata, $K$ grande una stima piatta. La stima ha code pesanti e non integra a 1.

**Parzen.** Fisso la regione, un ipercubo di volume $V = h^n$, e conto con la funzione finestra: $\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_k \frac{1}{h^n}\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$. Con il kernel gaussiano la stima è liscia; $h$ grande sovra-liscia, $h$ piccolo segue il rumore.

**Tendono alla soluzione ottima?** Sì, asintoticamente, se la regione si restringe e contiene sempre più campioni: le condizioni generali sono $V_N \to 0$, $K_N \to +\infty$, $K_N/N \to 0$. Per il K-NN, $K_N \to +\infty$ e $K_N/N \to 0$ (per esempio $K = \sqrt{N}$); per Parzen, $h_N \to 0$ e $N h_N^n \to +\infty$ (per esempio $h_N = 1/\sqrt[2n]{N}$). Allora le stime convergono alla pdf vera e un classificatore di Bayes costruito su di esse tende a quello ottimo. A $N$ finito il comportamento è difficile da prevedere e dipende dalla scelta di $K$ o di $h$.

**Quando invece conviene il parametrico.** Con dati incompleti, per esempio una mistura di gaussiane di cui voglio i singoli modi, le note dicono che l'approccio non parametrico è sub-ottimo: ignora l'informazione a priori sulla struttura (una somma di gaussiane) e stima solo la $p(\mathbf{x})$ complessiva. Lì uso il modello parametrico e lo stimo con EM.`,
    checklist: [
      'definizione: nessuna forma funzionale, stima dai campioni',
      'quando serve e che prezzo ha',
      md`principio comune $\hat{p} = K/(NV)$ e dilemma sulla dimensione di R`,
      'K-NN: K fisso, V misurato, comportamento al variare di K',
      'Parzen: V fisso, conteggio con la finestra, effetto di h',
      'condizioni di consistenza di entrambi, convergenza al classificatore ottimo',
      'con dati incompleti il non parametrico è sub-ottimo',
    ],
    followUps: [
      {
        q: md`Con $K = \sqrt{N}$ e $N = 10\,000$, quanti vicini uso e che frazione dei campioni è?`,
        a: md`$K = 100$ vicini, cioè $K/N = 0.01$: $K$ cresce e la frazione va a zero, come chiedono le due condizioni.`,
      },
      {
        q: md`Perché il K-NN non integra a 1?`,
        a: md`Lontano dai dati il volume della cella cresce come la distanza (in 1-D $V = 2r$), quindi la stima decresce come $1/\vert x \vert$ e il suo integrale diverge.`,
      },
    ],
  },
  {
    id: 'or-banca-13',
    q: md`Apprendimento non supervisionato: tutto il capitolo.`,
    qEn: 'Unsupervised learning: the entire chapter.',
    prof: 'Passerini',
    fromBank: true,
    bankText: 'Unsupervised learning: entire chapter',
    answer: md`**Setting.** Nell'apprendimento supervisionato servono esempi etichettati, che costano o che non so etichettare. Nel non supervisionato ho solo gli input e cerco una struttura: di solito raggruppo gli esempi simili (*clustering*).

**k-means.** Ogni cluster $D_i$ è rappresentato dalla sua media $\boldsymbol{\mu}_i$. Inizializzo $\boldsymbol{\mu}_1, \ldots, \boldsymbol{\mu}_k$; poi alterno assegnazione (ogni esempio alla media più vicina) e aggiornamento (ricalcolo delle medie) finché le medie non cambiano. Scelte da fare: $k$ e la distanza (euclidea; Minkowski $d(\mathbf{x}, \mathbf{x}') = (\sum_i \vert x_i - x'_i \vert^p)^{1/p}$, con $p = 2$ euclidea e $p = 1$ Manhattan; similarità del coseno $\frac{\mathbf{x}^T\mathbf{x}'}{\Vert\mathbf{x}\Vert\,\Vert\mathbf{x}'\Vert}$). Si può applicare anche in uno spazio delle feature con i kernel.

**Qualità.** Senza verità di riferimento uso la somma degli errori quadratici $E = \sum_{i=1}^{k}\sum_{\mathbf{x} \in D_i} \Vert\mathbf{x} - \boldsymbol{\mu}_i\Vert^2$: più bassa vuol dire cluster più compatti.

**Mistura di gaussiane (GMM).** Modello i dati come $p(\mathbf{x}) = \sum_{i=1}^{M} P_i\,p(\mathbf{x}|\mathbf{m}_i, \Sigma_i)$ con numero di gaussiane noto. Ogni esempio appartiene a un cluster con una certa probabilità (assegnazione morbida). L'appartenenza è latente: indicatori binari $y_{ji}$ (Passerini li chiama $z_{ij}$). La stima ML diretta non si fa perché le assegnazioni sono ignote; uso EM.

- E-step: valore atteso degli indicatori, cioè la posterior $P(i|\mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = \frac{P_i^{[k]}\,p(\mathbf{x}_j|\mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{\sum_l P_l^{[k]}\,p(\mathbf{x}_j|\mathbf{m}_l^{[k]}, \Sigma_l^{[k]})}$.
- M-step: prior, medie e covarianze come stime ML pesate dalle posterior, per esempio $\mathbf{m}_i^{[k+1]} = \frac{\sum_j P(i|\mathbf{x}_j, \boldsymbol{\theta}^{[k]})\,\mathbf{x}_j}{\sum_j P(i|\mathbf{x}_j, \boldsymbol{\theta}^{[k]})}$.
- Ripeto finché parametri o verosimiglianza non cambiano oltre una soglia.

In forma generale l'E-step calcola $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\{\ln p(\mathbf{X}, \mathbf{Y}|\boldsymbol{\theta}) \mid \mathbf{X}, \boldsymbol{\theta}^{(k)}\}$ e l'M-step la massimizza; la verosimiglianza non scende mai, ma l'algoritmo converge a un punto stazionario, di solito un massimo locale ma può essere un punto di sella (slide 75 di Melgani).

**Due casi limite.** Con $\Sigma_i = \sigma^2 I$ comune e $\sigma \to 0$ le posterior diventano 0 o 1 e l'M-step delle medie è quello del k-means: il k-means è la versione ad assegnazione dura. Con covarianze libere, invece, una componente che si stringe su un solo esempio fa tendere la verosimiglianza a $+\infty$: sono soluzioni degeneri, che evito con una varianza minima o ripartendo da un'altra inizializzazione.

**Numero di cluster.** Più cluster modellano meglio ma rischiano l'overfitting. Metodo del gomito (*elbow*): tracciare l'SSE al variare di $k$ e scegliere dove il miglioramento crolla; può essere ambiguo. Silhouette media: per ogni esempio $a_i$ è la distanza media dal proprio cluster, $b_i$ la minima distanza media da un altro cluster, $s_i = \frac{b_i - a_i}{\max(a_i, b_i)}$; scelgo il $k$ che massimizza la media.

**Clustering gerarchico.** Costruisce una gerarchia rappresentata da un dendrogramma. Divisivo: parto da un cluster unico e divido. Agglomerativo: parto da $n$ cluster singoli e fondo la coppia più simile finché arrivo a $k$ cluster o a una soglia. Distanze fra cluster: minima (*single linkage*, catene allungate), massima (*complete linkage*, cluster compatti), media (più robusta ma costosa), fra centroidi. La variante *stepwise optimal* fonde la coppia che peggiora meno il criterio di qualità.`,
    checklist: [
      'setting non supervisionato e clustering',
      'k-means: algoritmo, scelta di k e della distanza',
      'criterio SSE',
      'GMM con EM: posterior nell’E-step, stime pesate nell’M-step, punto stazionario (di solito massimo locale)',
      'casi limite: k-means come σ → 0, verosimiglianza illimitata',
      'scelta del numero di cluster: gomito e silhouette',
      'clustering gerarchico: agglomerativo e divisivo, dendrogramma, distanze fra cluster',
    ],
    followUps: [
      {
        q: md`Il k-means converge sempre allo stesso risultato?`,
        a: md`No: converge perché l'SSE non aumenta mai, ma a un minimo locale che dipende dalle medie iniziali. Come per EM, conviene ripartire da più inizializzazioni.`,
      },
      {
        q: md`Perché la verosimiglianza della mistura può andare a infinito?`,
        a: md`Se centro un modo su un esempio e ne restringo la varianza, il termine di quell'esempio cresce come $\ln\frac{P_i}{(2\pi\sigma^2)^{n/2}}$, mentre gli altri esempi restano spiegati dalle altre componenti. Il massimo globale non esiste: la soluzione utile è un massimo locale non degenere.`,
      },
    ],
  },

  // --- domande sulle parti più chieste ---
  {
    id: 'or-perche-incompleti',
    q: md`Perché la stima dei parametri di una mistura di gaussiane è un problema con dati incompleti? Che cosa sono $\mathbf{X}$, $\mathbf{Y}$ e $\mathbf{Z}$?`,
    qEn: 'Why is estimating the parameters of a Gaussian mixture an incomplete-data problem? What are X, Y and Z?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Il problema.** Ho $N$ osservazioni i.i.d. da $p(\mathbf{x}) = \sum_{i=1}^{M} P_i\,p(\mathbf{x}|\mathbf{m}_i, \Sigma_i)$ e voglio stimare la distribuzione di ciascun modo, cioè $\boldsymbol{\theta} = [P_1, \ldots, P_M; \mathbf{m}_1, \ldots, \mathbf{m}_M; \Sigma_1, \ldots, \Sigma_M]$.

**Tre motivi di incompletezza.**
1. Ho solo le osservazioni dell'intera $p(\mathbf{x})$, non quelle dei singoli modi: i campioni arrivano mescolati.
2. Non so a quale modo è associato ogni campione, quindi non so quali campioni usare per stimare ciascun modo.
3. So solo che fra i modi nascosti c'è una relazione di tipo somma.

Il terzo punto è anche l'informazione a priori che rende il problema parametrico: so che la forma è una somma pesata di gaussiane.

**X, Y, Z.** $\mathbf{X}$ sono i dati osservati, il dataset incompleto: tutte le feature di tutti i campioni. $\mathbf{Y}$ sono i dati mancanti: per ogni campione un vettore binario lungo $M$ con un solo 1 nella posizione del modo che lo ha generato. $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$ è il dataset completo, che non ho ma su cui EM ragiona.

**Che cosa cambierebbe con Y noto.** La log-verosimiglianza completa si separerebbe per modo,

$$\ln p(\mathbf{X}, \mathbf{Y}|\boldsymbol{\theta}) = \sum_{j=1}^{N}\sum_{i=1}^{M} y_{ji}\left[\ln P_i + \ln p(\mathbf{x}_j|\mathbf{m}_i, \Sigma_i)\right]$$

e avrei stime ML in forma chiusa: $\hat{P}_i = N_i/N$, media e covarianza campionarie dei campioni di ciascun modo. Con $\mathbf{Y}$ ignoto la verosimiglianza dei soli dati osservati ha il logaritmo di una somma e non si separa. EM sostituisce ogni $y_{ji}$ con il suo valore atteso, la posterior del modo.

**Esempio.** Luminosità di pesci senza etichetta di specie: un istogramma a due gobbe. Nella zona dove le gobbe si sovrappongono non so dire a occhio se un pesce è salmone o spigola; EM gli assegna una probabilità per ciascuna specie.`,
    checklist: [
      'obiettivo: stimare ciascun modo, vettore θ',
      'i tre motivi della slide',
      'X incompleto, Y vettore binario di appartenenza, Z = (X, Y)',
      'con Y noto: log-verosimiglianza separabile e stime in forma chiusa',
      md`EM sostituisce $y_{ji}$ con la posterior`,
    ],
    followUps: [
      {
        q: md`Quante configurazioni possibili ha $\mathbf{Y}$ con $N$ campioni e $M$ modi?`,
        a: md`$M^N$: ogni campione può venire da uno qualunque degli $M$ modi. Con 10 campioni e 3 modi sono $59\,049$ configurazioni, per questo non si enumerano e si lavora con le posterior di ogni campione.`,
      },
      {
        q: md`Anche una feature mancante è un dato incompleto nello stesso senso?`,
        a: md`Sì: nell'esempio dei quattro punti $\mathbf{Y}$ è il valore $x_1$ mancante del quarto punto. EM tratta l'etichetta nascosta e la feature mancante allo stesso modo, come parte di $\mathbf{Y}$.`,
      },
    ],
  },
  {
    id: 'or-q-due-argomenti',
    q: md`Scrivi $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ e spiega che cosa fanno i suoi due argomenti. Perché Q non dipende più dalle variabili latenti?`,
    qEn: 'Write Q(θ, θ^(k)) and explain what its two arguments do. Why does Q no longer depend on the latent variables?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Definizione.** EM calcola il valore atteso del log della densità congiunta rispetto a $\mathbf{y}$, dati $\mathbf{X}$ e la stima corrente:

$$Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{ \log p(\mathbf{X}, \mathbf{Y} | \boldsymbol{\theta}) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\} = \int \log p(\mathbf{X}, \mathbf{y} | \boldsymbol{\theta}) \, p(\mathbf{y} | \mathbf{X}, \boldsymbol{\theta}^{(k)}) \, d\mathbf{y}$$

Nella prima forma $\mathbf{Y}$ è la variabile aleatoria, nell'integrale $\mathbf{y}$ è la variabile di integrazione. Se $\mathbf{Y}$ è discreta, come nella mistura, l'integrale diventa una somma sui modi.

**I due argomenti.** $\boldsymbol{\theta}^{(k)}$ è la stima corrente, un numero noto: fissa la legge $p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})$ con cui peso i valori possibili dei dati mancanti. $\boldsymbol{\theta}$ è la variabile libera: compare solo dentro il logaritmo ed è ciò che l'M-step muove. La barra «$| \, \mathbf{X}, \boldsymbol{\theta}^{(k)}$» non vuol dire condizionare su $\boldsymbol{\theta}^{(k)}$ come su un evento (la stima è ML, $\boldsymbol{\theta}$ non è aleatorio): vuol dire che la media si calcola con i parametri correnti.

**Perché Y sparisce.** Integro su tutti i valori di $\mathbf{y}$: il risultato è una funzione deterministica del solo $\boldsymbol{\theta}$, con $\boldsymbol{\theta}^{(k)}$ come costante. È il senso delle note: mediando su $\mathbf{Y}$ tolgo l'incertezza legata alle variabili non osservate.

**Nella mistura.** Il log della congiunta è lineare negli indicatori $y_{ji}$, quindi

$$Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{[k]}) = \sum_{j=1}^{N}\sum_{i=1}^{M} P(i|\mathbf{x}_j, \boldsymbol{\theta}^{[k]})\left[\ln P_i + \ln p(\mathbf{x}_j|\mathbf{m}_i, \Sigma_i)\right]$$

Le posterior sono calcolate con $\boldsymbol{\theta}^{[k]}$ e restano ferme; nell'M-step si muovono solo $P_i$, $\mathbf{m}_i$, $\Sigma_i$ dentro il logaritmo.

**Esempio numerico.** Un campione $x = 4$, modi con $P = (0.5, 0.5)$, $m = (3, 6)$, $\sigma^2 = (1, 1)$: i pesi sono $0.8176$ e $0.1824$. Se provo due $\boldsymbol{\theta}$ diversi nell'M-step, i pesi restano $0.8176$ e $0.1824$; cambiano solo i logaritmi.`,
    checklist: [
      'Q come aspettazione condizionata e come integrale',
      'Y maiuscola variabile aleatoria, y minuscola variabile di integrazione',
      md`$\boldsymbol{\theta}^{(k)}$ fissa i pesi, $\boldsymbol{\theta}$ è la variabile libera dell’M-step`,
      'la barra non condiziona su un θ aleatorio: la stima resta ML',
      'dopo l’integrazione Q dipende solo da θ',
      'forma di Q nella mistura con le posterior',
    ],
    followUps: [
      {
        q: md`Perché si media il logaritmo e non la verosimiglianza?`,
        a: md`Perché il log della congiunta, nella mistura, è lineare negli indicatori: la media si calcola sostituendo gli indicatori con le posterior e Q si separa per modo. Il riquadro della slide parla di «expected likelihood», ma la formula e le note usano il logaritmo.`,
      },
      {
        q: md`Nella figura della slide 74, che cosa sono i due assi orizzontali?`,
        a: md`I due argomenti di Q: su un asse le tacche $\theta^1, \theta^3$, sull'altro $\theta^0, \theta^2, \theta^4$, con Q in verticale. La spezzata rossa sul pavimento ha quattro tratti e ognuno finisce su una tacca con un nome nuovo: ogni tratto è un'iterazione di EM. Tengo fermo un argomento sulla stima corrente e salto al massimo di Q lungo l'altro asse (M-step); il punto trovato diventa l'argomento fisso del tratto successivo, disegnato lungo l'altro asse. Da $\theta^0$ trovo $\theta^1$, da $\theta^1$ trovo $\theta^2$, fino a $\theta^4$: quattro stime successive. Gli assi si possono alternare perché nel disegno Q è simmetrica nei due argomenti, come precisa la didascalia di Duda-Hart-Stork (in generale non lo è). Nei punti di arrivo dei gradini Q non scende; fra un gradino e l'altro la linea rossa sulla superficie può attraversare una valle, perché l'M-step salta direttamente al massimo della sezione invece di seguire la pendenza.`,
      },
    ],
  },
  {
    id: 'or-convergenza',
    q: md`EM converge? Dimostra che la log-verosimiglianza non diminuisce mai. EM trova sempre la stima ML?`,
    qEn: 'Does EM converge? Prove that the log-likelihood never decreases. Does EM always find the ML estimate?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Enunciato.** La slide dice che la successione $\{\boldsymbol{\theta}^{[k]}\}$ generata da EM fa crescere a ogni iterazione la log-verosimiglianza: $l(\boldsymbol{\theta}^{(i+1)}) \ge l(\boldsymbol{\theta}^{(i)})$. La fonte scrive «it can be shown»; la dimostrazione standard è questa.

**Dimostrazione.** Dalla regola del prodotto $p(\mathbf{X}, \mathbf{y}|\boldsymbol{\theta}) = p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta})\,p(\mathbf{X}|\boldsymbol{\theta})$ ricavo, per ogni $\mathbf{y}$,

$$\ln p(\mathbf{X}|\boldsymbol{\theta}) = \ln p(\mathbf{X}, \mathbf{y}|\boldsymbol{\theta}) - \ln p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta})$$

Medio entrambi i membri con $p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})$; il membro sinistro non dipende da $\mathbf{y}$:

$$l(\boldsymbol{\theta}) = Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}), \qquad H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \int \ln p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta})\,p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})\,d\mathbf{y}$$

Scrivo l'identità in $\boldsymbol{\theta}^{(k+1)}$ e in $\boldsymbol{\theta}^{(k)}$ e sottraggo:

$$l(\boldsymbol{\theta}^{(k+1)}) - l(\boldsymbol{\theta}^{(k)}) = \left[Q(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})\right] - \left[H(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})\right]$$

La prima parentesi è $\ge 0$ per l'M-step: $\boldsymbol{\theta}^{(k+1)}$ massimizza $Q(\cdot, \boldsymbol{\theta}^{(k)})$. La seconda è $\le 0$ per la disuguaglianza di Jensen (il logaritmo è concavo):

$$H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) = \int \ln\frac{p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta})}{p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})}\,p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})\,d\mathbf{y} \le \ln \int p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta})\,d\mathbf{y} = 0$$

Quindi la differenza è $\ge 0$. La dimostrazione completa è in [«perché EM non fa mai scendere la log-verosimiglianza»](#derivation:der04).

**Lettura con il minorante.** Equivale a dire che $l(\boldsymbol{\theta}^{(k)}) + Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$ sta sotto $l(\boldsymbol{\theta})$ e la tocca in $\boldsymbol{\theta}^{(k)}$: l'M-step sale sul minorante e $l$, che sta sopra, sale almeno altrettanto. Basterebbe anche aumentare Q senza massimizzarla.

**Trova la stima ML?** No. La slide 75 dice che non è garantito arrivare al massimo globale di $L(\boldsymbol{\theta})$, cioè alla stima ML. La log-verosimiglianza può avere più picchi ed EM, come una salita del gradiente, dipende dal punto di partenza: può fermarsi su un massimo locale o su un punto di sella (la slide scrive «local minima», gergo dell'ottimizzazione; le note correttamente «local maximum»). Esempio di sella: due componenti inizializzate identiche restano identiche per sempre. Per la mistura con covarianze libere il massimo globale non esiste nemmeno: una componente che collassa su un campione manda $l$ a $+\infty$. Nonostante questo EM si è dimostrato particolarmente efficace nella stima delle misture; in pratica inizializzo con conoscenza a priori o riparto da più punti e tengo la soluzione a verosimiglianza più alta.

**Numeri.** Sulle sei luminosità $\{2, 3, 4, 5, 7, 8\}$ la log-verosimiglianza passa da $-13.258$ a $-12.327$, poi $-12.309$, $-12.291$: sempre in salita, con passi sempre più piccoli.`,
    checklist: [
      md`enunciato $l(\boldsymbol{\theta}^{(i+1)}) \ge l(\boldsymbol{\theta}^{(i)})$`,
      'scomposizione l = Q − H dalla regola del prodotto',
      'termine Q non negativo per l’M-step',
      'termine H non positivo per Jensen',
      'lettura come minorante che tocca l nella stima corrente',
      'nessuna garanzia di massimo globale: massimi locali, selle, dipendenza dall’inizializzazione',
      'rimedi pratici',
    ],
    followUps: [
      {
        q: md`Quando vale l'uguaglianza $l(\boldsymbol{\theta}^{(k+1)}) = l(\boldsymbol{\theta}^{(k)})$?`,
        a: md`Quando l'M-step non trova niente di meglio di $\boldsymbol{\theta}^{(k)}$ e il termine di Jensen è nullo, cioè $p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k+1)}) = p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})$. In un punto fisso il gradiente di $l$ è nullo: sono in un punto stazionario, massimo locale o sella.`,
      },
      {
        q: md`La monotonia garantisce che i parametri convergano?`,
        a: md`No: riguarda i valori $l(\boldsymbol{\theta}^{(k)})$. Se $l$ è limitata superiormente la successione dei valori converge, ma per la mistura con covarianze libere $l$ non è limitata.`,
      },
    ],
  },
  {
    id: 'or-posterior-modo',
    q: md`Nelle tre equazioni EM della mistura compare sempre lo stesso rapporto. Che cos'è e che cosa rappresenta?`,
    qEn: 'The same ratio appears in all three EM equations of the Gaussian mixture. What is it and what does it represent?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Il rapporto.**

$$P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = \frac{P_i^{[k]} \, p(\mathbf{x}_j | \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j | \boldsymbol{\theta}^{[k]})}, \qquad p(\mathbf{x}_j | \boldsymbol{\theta}^{[k]}) = \sum_{l=1}^{M} P_l^{[k]} \, p(\mathbf{x}_j | \mathbf{m}_l^{[k]}, \Sigma_l^{[k]})$$

Per il teorema di Bayes è la probabilità a posteriori che il campione $\mathbf{x}_j$ sia stato generato dal modo $i$, calcolata con i parametri correnti: prior del modo per verosimiglianza del modo, diviso l'evidenza. In letteratura si chiama responsabilità (*responsibility*); la fonte non le dà un nome.

**Proprietà.** Vale fra 0 e 1 e, per ogni campione, somma a 1 sui modi, perché il denominatore è la somma dei numeratori. Geometricamente il numeratore è l'altezza della campana pesata del modo $i$ in $\mathbf{x}_j$, il denominatore l'altezza della curva somma nello stesso punto.

**Che cosa rappresenta per EM.** È il risultato dell'E-step: la distribuzione $p(\mathbf{y}|\mathbf{X}, \boldsymbol{\theta}^{(k)})$ della slide 72 per la mistura. Se $y_{ji}$ è l'indicatore binario del modo, il suo valore atteso è

$$E\{y_{ji} | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}\} = 1 \cdot P(y_{ji} = 1 | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) + 0 \cdot P(y_{ji} = 0 | \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = P(i | \mathbf{x}_j, \boldsymbol{\theta}^{[k]})$$

Quindi l'E-step sostituisce l'etichetta sconosciuta con la sua media: è l'assegnazione morbida delle note, «assigning probabilities to the latent variables». Nell'M-step ogni campione conta per il modo $i$ in proporzione a questa probabilità.

**Esempio.** Frequenza cardiaca a riposo: sani con $P = 0.8$, $m = 65$, $\sigma = 8$; aritmici con $P = 0.2$, $m = 95$, $\sigma = 12$. Un paziente a 80 bpm: $N(80|65, 8^2) = 0.008598$ e $N(80|95, 12^2) = 0.015221$. I numeratori sono $0.006879$ e $0.003044$, l'evidenza $0.009923$, le posterior $0.693$ (sani) e $0.307$. La verosimiglianza favorisce gli aritmici (80 dista $1.25$ deviazioni standard da loro e $1.875$ dai sani), ma il prior $0.8$ ribalta la posterior.`,
    checklist: [
      'formula della posterior con numeratore e denominatore',
      'teorema di Bayes: prior per verosimiglianza diviso evidenza',
      'valori fra 0 e 1, somma a 1 sui modi',
      'valore atteso dell’indicatore binario: è l’E-step',
      'ruolo di peso nelle tre equazioni dell’M-step',
      'esempio numerico',
    ],
    followUps: [
      {
        q: md`Se assegno ogni campione al modo con posterior massima, che criterio sto usando?`,
        a: md`Il criterio MAP: scelgo il modo che massimizza $P_i\,p(\mathbf{x}_j|\mathbf{m}_i, \Sigma_i)$. I prior stimati da EM spostano i confini fra i modi come le prior di classe spostano la soglia MAP rispetto a ML.`,
      },
      {
        q: md`Che cosa succede alle posterior se le varianze dei modi tendono a zero con la stessa $\sigma$?`,
        a: md`Diventano 0 o 1: vince il modo con la media più vicina, qualunque siano i prior purché positivi. È il limite che trasforma EM nel k-means.`,
      },
    ],
  },
  {
    id: 'or-dato-mancante',
    q: md`Come tratta EM una feature mancante? Spiega l'esempio dei quattro punti, uno senza il valore di $x_1$.`,
    qEn: 'How does EM handle a missing feature value? Explain the example with four data points, one of which is missing the value of x1.',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Idea.** Il valore mancante è la variabile latente. EM non lo indovina: ne usa la distribuzione, dati il valore osservato e la stima corrente.

**Dati e modello.** I punti sono $(0, 2)$, $(1, 0)$, $(2, 2)$ e $(*, 4)$: del quarto conosco solo $x_2 = 4$ e nella figura è la retta rossa orizzontale. Stimo una gaussiana 2-D a covarianza diagonale, $\boldsymbol{\theta} = (\mu_1, \mu_2, \sigma_1^2, \sigma_2^2)$, partendo da $\boldsymbol{\theta}^0 = (0, 0, 1, 1)$, il cerchio «0» della figura.

**E-step.** I tre punti completi entrano con il loro log-densità; per il quarto integro sul valore mancante:

$$Q(\boldsymbol{\theta}; \boldsymbol{\theta}^{0}) = \sum_{k=1}^{3} \ln p(\mathbf{x}_k | \boldsymbol{\theta}) + \int_{-\infty}^{+\infty} \ln p\big((x_{41}, 4)^{t} | \boldsymbol{\theta}\big)\,p(x_{41} | \boldsymbol{\theta}^{0}; x_{42} = 4)\,dx_{41}$$

Con covarianza diagonale $x_1$ e $x_2$ sono indipendenti, quindi $x_{41}$ segue la marginale corrente $N(0, 1)$: $E[x_{41}] = 0$, $E[(x_{41} - \mu_1)^2] = 1 + \mu_1^2$, e

$$Q(\boldsymbol{\theta}; \boldsymbol{\theta}^{0}) = \sum_{k=1}^{3} \ln p(\mathbf{x}_k | \boldsymbol{\theta}) - \frac{1 + \mu_1^2}{2\sigma_1^2} - \frac{(4 - \mu_2)^2}{2\sigma_2^2} - \ln(2\pi\sigma_1\sigma_2)$$

**M-step.** $\mu_1 = (0 + 1 + 2 + 0)/4 = 0.75$, $\mu_2 = (2 + 0 + 2 + 4)/4 = 2$, $\sigma_1^2 = [0.5625 + 0.0625 + 1.5625 + (1 + 0.5625)]/4 = 0.938$, $\sigma_2^2 = (0 + 4 + 0 + 4)/4 = 2$. Quindi $\boldsymbol{\theta}^1 = (0.75, 2, 0.938, 2)$.

**Iterazioni.** $\mu_1 \leftarrow (3 + \mu_1)/4$ ha punto fisso 1: $\boldsymbol{\theta}^2 = (0.938, 2, 0.746, 2)$, $\boldsymbol{\theta}^3 = (0.984, 2, 0.687, 2)$, e al limite $\boldsymbol{\mu} = (1, 2)$, $\Sigma = \mathrm{diag}(0.667, 2)$: il centro e gli assi delle ellissi 2 e 3. Le ellissi sono i contorni a una deviazione standard delle stime successive.

**Lettura.** $\mu_2$ e $\sigma_2^2$ non cambiano dopo la prima iterazione, perché $x_2$ è osservato in tutti i punti. Il limite di $x_1$ coincide con la stima ML sui tre valori noti: con covarianza diagonale il quarto punto non porta informazione su $x_1$. Scartando il punto incompleto avrei $\mu_2 = 1.33$ e $\sigma_2^2 = 0.89$, perdendo l'informazione $x_2 = 4$. Con una covarianza piena, invece, la correlazione permetterebbe di prevedere $x_{41}$ da $x_{42}$.`,
    checklist: [
      'il valore mancante come variabile latente, usato con la sua distribuzione',
      md`dati, modello a covarianza diagonale e $\boldsymbol{\theta}^0$`,
      'E-step con l’integrale sul valore mancante e i due momenti',
      'M-step con i numeri della prima iterazione',
      'ricorsione e limite μ = (1, 2), Σ = diag(0.667, 2)',
      'confronto con lo scarto del punto incompleto',
    ],
    followUps: [
      {
        q: md`Perché al limite $\sigma_1^2 = 2/3$?`,
        a: md`Al punto fisso $\mu_1 = 1$ e $\sigma_1^2 = [\sum_{j=1}^{3}(x_{j1} - 1)^2 + \sigma_1^2]/4$, cioè $4\sigma_1^2 = 2 + \sigma_1^2$ e $\sigma_1^2 = 2/3$: la varianza ML dei tre valori noti.`,
      },
      {
        q: md`E se sostituissi $x_{41}$ con la media corrente e basta?`,
        a: md`Il contributo del quarto punto a $\sigma_1^2$ perderebbe il termine $\sigma_1^{2}$ corrente: sottostimerei la varianza. EM usa $E[(x_{41} - \mu_1)^2] = \sigma_1^{2,k} + (\mu_1^k - \mu_1)^2$, che conserva l'incertezza sul valore mancante.`,
      },
    ],
  },
  {
    id: 'or-parametrico',
    q: md`Perché con dati incompleti si usa l'approccio parametrico? Perché un Parzen o un K-NN sarebbero sub-ottimi per la mistura?`,
    qEn: 'Why is the parametric approach used with incomplete data? Why would Parzen or K-NN be sub-optimal for the mixture problem?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Il principio.** Con variabili latenti potrei ignorarle, ma la pratica statistica preferisce usare tutta l'informazione disponibile, anche parziale. Per compensare ciò che non osservo mi serve un modello dalla struttura nota: una forma funzionale della pdf con un vettore di parametri $\boldsymbol{\theta}$. Per questo, con dati incompleti, si usa tipicamente l'approccio parametrico.

**Perché il non parametrico è sub-ottimo.** Le note dicono che potrei assumere un modello non parametrico, ma l'approccio è sub-ottimo perché non sfrutta l'informazione a priori sulla struttura del modello, cioè che è una mistura di gaussiane. Ignorandola la stima è meno efficiente e meno accurata. In concreto un Parzen o un K-NN:
- stimano solo la $p(\mathbf{x})$ complessiva, mentre l'obiettivo è la distribuzione di ciascun modo ($P_i$, $\mathbf{m}_i$, $\Sigma_i$);
- non danno posterior di appartenenza, quindi nessun clustering;
- devono conservare tutti i campioni: $N \cdot n$ numeri più la larghezza, contro $(M - 1) + Mn + Mn(n+1)/2$ parametri della mistura;
- per la stessa precisione chiedono più dati, perché devono ricostruire dai campioni una forma che il modello conosce già.

Quando uso l'informazione a priori il problema diventa parametrico, e lo risolvo con EM.

**Quando il vantaggio svanisce.** Se il modello è sbagliato (i dati non sono davvero una somma di gaussiane, o $M$ è scelto male) il parametrico dà una stima distorta che più dati non correggono, mentre Parzen e K-NN restano consistenti. Il vantaggio del parametrico vale solo se la struttura assunta è giusta.

**Esempio.** Con $N = 1000$ campioni in $n = 2$ dimensioni un Parzen conserva $2000$ coordinate più $\sigma$; una mistura di $M = 3$ gaussiane ha $2 + 6 + 9 = 17$ parametri e mi dice anche a quale modo appartiene ogni campione.`,
    checklist: [
      'principio: usare tutta l’informazione disponibile, anche parziale',
      'serve una struttura nota per compensare ciò che manca',
      'non parametrico sub-ottimo: ignora la struttura, stima solo p(x) complessiva',
      'confronto concreto (modi, posterior, memoria, dati necessari)',
      'il vantaggio svanisce se il modello è sbagliato',
    ],
    followUps: [
      {
        q: md`Che cosa succede a un Parzen se i due modi della mistura sono molto vicini?`,
        a: md`Con $\sigma$ grande li fonde in una gobba sola; con $\sigma$ piccola li separa ma diventa rumoroso. In nessun caso restituisce i parametri dei due modi, che EM stima direttamente.`,
      },
      {
        q: md`Posso usare un Parzen per inizializzare EM?`,
        a: md`Sì, come conoscenza a priori: i massimi della stima di Parzen suggeriscono medie iniziali ragionevoli per le componenti, e riducono il rischio di partire in un bacino sbagliato.`,
      },
    ],
  },
  {
    id: 'or-degenerazione-kmeans',
    q: md`Che cosa succede alla mistura di gaussiane quando una varianza tende a zero? E quando tutte le varianze tendono a zero insieme?`,
    qEn: 'What happens to the Gaussian mixture when one variance tends to zero? And when all variances tend to zero together?',
    prof: 'Passerini',
    fromBank: false,
    answer: md`**Una componente che collassa.** Centro il modo $i$ su un campione, $\mathbf{m}_i = \mathbf{x}_j$, con $\Sigma_i = \sigma^2 I$, e tengo gli altri modi fissi con pesi positivi. Il termine di quel campione vale almeno $\ln\frac{P_i}{(2\pi\sigma^2)^{n/2}}$, mentre gli altri campioni restano spiegati dagli altri modi:

$$\ln l(\boldsymbol{\theta} | \mathbf{X}) \;\ge\; \ln \frac{P_i}{(2\pi\sigma^2)^{n/2}} + \sum_{r \neq j} \ln \sum_{l \neq i} P_l\,p(\mathbf{x}_r | \mathbf{m}_l, \Sigma_l) \;\xrightarrow[\sigma \to 0]{}\; +\infty$$

Ogni disuguaglianza toglie da una somma un termine non negativo: per $\mathbf{x}_j$ tengo solo il modo $i$, per gli altri campioni solo gli altri modi, che non dipendono da $\sigma$.

La verosimiglianza non è limitata: il «massimo globale di $L(\boldsymbol{\theta})$» della slide 75 non esiste nemmeno. Sono soluzioni degeneri, una campana su un solo punto, prive di significato. La monotonia della slide 74 non protegge: se EM parte vicino a una di queste, ogni passo fa salire $l$ proprio verso la degenerazione, fino a una $\Sigma_i$ singolare. Rimedi: imporre un minimo alle varianze (per esempio $\Sigma_i + \varepsilon I$) o ripartire da un'altra inizializzazione. La stima utile è un massimo locale non degenere.

Numeri: con $n = 1$ e $P_i = 0.5$ il termine agganciato vale $\ln\frac{0.5}{\sqrt{2\pi}\,\sigma}$, cioè $2.99$ per $\sigma = 0.01$ e $5.30$ per $\sigma = 0.001$: cresce senza limite.

**Tutte le varianze insieme: il k-means.** Con $\Sigma_i = \sigma^2 I$ uguale e fissa per tutti i modi i fattori di normalizzazione si semplificano:

$$P(i | \mathbf{x}_j, \boldsymbol{\theta}) = \frac{P_i \exp\left(-\Vert\mathbf{x}_j - \mathbf{m}_i\Vert^2 / 2\sigma^2\right)}{\sum_{l=1}^{M} P_l \exp\left(-\Vert\mathbf{x}_j - \mathbf{m}_l\Vert^2 / 2\sigma^2\right)} \;\xrightarrow[\sigma \to 0]{}\; \begin{cases} 1 & \text{modo con la media più vicina} \\ 0 & \text{altrimenti} \end{cases}$$

Ogni campione va al modo con la media più vicina, e i prior non contano più purché positivi. L'M-step delle medie diventa la media dei campioni assegnati: EM si riduce al k-means, con assegnazione dura. Esempio: $x = 4$, medie $3$ e $6$, prior uguali: con $\sigma = 1$ la posterior del primo modo è $0.818$, con $\sigma = 0.25$ è praticamente $1$.

**Confronto con le etichette note.** È il caso simmetrico delle etichette note: lì le posterior valevano 0 o 1 perché conoscevo $\mathbf{Y}$, qui lo diventano perché le campane sono strettissime.`,
    checklist: [
      'costruzione: modo centrato su un campione con σ → 0',
      'verosimiglianza illimitata, massimo globale inesistente, soluzioni degeneri',
      'la monotonia non protegge; rimedi: varianza minima o nuova inizializzazione',
      md`caso $\Sigma_i = \sigma^2 I$ comune: posterior 0 o 1, prior irrilevanti`,
      'limite k-means con esempio',
    ],
    followUps: [
      {
        q: md`Perché serve che gli altri modi abbiano peso positivo?`,
        a: md`Perché devono spiegare i campioni diversi da $\mathbf{x}_j$: se il modo che collassa fosse l'unico, gli altri campioni avrebbero densità che va a zero più in fretta di quanto cresce il termine di $\mathbf{x}_j$, e la verosimiglianza non divergerebbe.`,
      },
      {
        q: md`Il k-means ha lo stesso problema di degenerazione?`,
        a: md`No, perché non stima varianze: minimizza l'SSE, che è limitato inferiormente da zero. Può però finire in minimi locali e dipende dall'inizializzazione.`,
      },
    ],
  },
  {
    id: 'or-em-gradiente',
    q: md`Le note dicono che EM «relies on gradient ascent-like updates». In che senso EM somiglia a una salita del gradiente, e in che cosa è diverso?`,
    qEn: 'The notes say that EM relies on gradient ascent-like updates. In what sense is EM similar to gradient ascent, and how is it different?',
    prof: 'Melgani',
    fromBank: false,
    answer: md`**Il contesto della frase.** Le note spiegano così perché EM può non arrivare al massimo globale: la log-verosimiglianza può avere più picchi, ed EM fa aggiornamenti simili a una salita del gradiente, sensibili al punto di partenza.

**Che cosa ha in comune.** Migliora localmente: da ogni $\boldsymbol{\theta}^{(0)}$ sale fino alla cima del proprio bacino di attrazione, quindi il risultato dipende dall'inizializzazione. Per le medie della mistura l'analogia è esatta. Nel punto corrente Q e $l$ hanno lo stesso gradiente, perché $l - Q$ ha lì un minimo; con $N_i^{[k]} = \sum_j P(i|\mathbf{x}_j, \boldsymbol{\theta}^{[k]})$:

$$\frac{\partial \ln l}{\partial \mathbf{m}_i}\bigg|_{\boldsymbol{\theta}^{[k]}} = (\Sigma_i^{[k]})^{-1}\,N_i^{[k]}\,\big(\mathbf{m}_i^{[k+1]} - \mathbf{m}_i^{[k]}\big) \quad \Rightarrow \quad \mathbf{m}_i^{[k+1]} = \mathbf{m}_i^{[k]} + \frac{\Sigma_i^{[k]}}{N_i^{[k]}}\,\frac{\partial \ln l}{\partial \mathbf{m}_i}\bigg|_{\boldsymbol{\theta}^{[k]}}$$

L'aggiornamento EM della media è un passo di salita del gradiente.

**In che cosa è diverso.** EM non calcola gradienti e non ha un passo (*learning rate*) da tarare: l'M-step massimizza Q esattamente, spesso in forma chiusa come nelle equazioni della slide 76. La «matrice di passo» $\Sigma_i/N_i$ è fissata dal modello ed è sempre definita positiva, quindi il passo va sempre in salita. Nella figura di Duda-Hart-Stork ripresa nella slide 74 ogni M-step salta direttamente al massimo di Q lungo una sezione, cosa che una ricerca per gradiente potrebbe non trovare.

**Verifica con numeri.** Sulle sei luminosità $\{2, 3, 4, 5, 7, 8\}$ con $P = (0.5, 0.5)$, $m = (3, 6)$, $\sigma^2 = (1, 1)$: $\partial \ln l/\partial m_1 = 0.1853$ e $N_1 = 2.989$, quindi $m_1^{[1]} = 3 + 0.1853/2.989 = 3.062$, esattamente la media pesata dell'M-step.

**Conseguenza.** In un punto fisso di EM ($\boldsymbol{\theta}^{(k+1)} = \boldsymbol{\theta}^{(k)}$) il gradiente di Q è nullo, quindi anche quello di $l$: EM si ferma in punti stazionari, massimi locali o selle. Il criterio pratico «i parametri non cambiano più» segnala proprio questo.`,
    checklist: [
      'contesto: più picchi e dipendenza dal punto di partenza',
      'gradienti di Q e l coincidono nel punto corrente',
      md`aggiornamento della media come passo di gradiente con matrice $\Sigma_i/N_i$`,
      'differenze: niente learning rate, massimo esatto di Q, passo sempre in salita',
      'verifica numerica',
      'punto fisso = punto stazionario',
    ],
    followUps: [
      {
        q: md`Che cosa rappresenta $N_i^{[k]}$?`,
        a: md`Il numero «morbido» di campioni attribuiti al modo $i$. Più campioni ha il modo, più piccolo è il passo $\Sigma_i/N_i$: la media di un modo ben popolato si sposta poco per ogni unità di gradiente.`,
      },
      {
        q: md`Perché nel punto corrente Q e $l$ hanno lo stesso gradiente?`,
        a: md`Perché $l(\boldsymbol{\theta}) - Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ differisce da $H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ per una costante: è non negativo e nullo in $\boldsymbol{\theta}^{(k)}$, quindi lì ha un minimo e gradiente nullo.`,
      },
    ],
  },
]
