// Flashcard del foglio m07 (stima bayesiana e confronto ML contro Bayes): formule, definizioni, confronti,
// intuizioni, proprietà e procedure. Coprono tutti i 61 concetti dell'inventario, nell'ordine delle fonti
// (ch2 p32-40, part1 p26-30); le pagine di confine (stime ML gaussiane, stima non parametrica) sono in fondo.
import { md } from '../../types'
import type { Flashcard } from '../../types'

export const flashcards: Flashcard[] = [
  // --- due modi di vedere il parametro ---
  {
    id: 'fc-stima-bayesiana',
    kind: 'definizione',
    q: md`Che cos'è la stima bayesiana e con quali altri nomi compare nelle fonti?`,
    a: md`È la seconda procedura di stima parametrica dopo la massima verosimiglianza (*Maximum Likelihood*, ML). La slide p32 la chiama *Bayesian estimation* o *Bayesian learning* e dice che è «conceptually different» da ML; le note la abbreviano **BE**. Invece di cercare un solo valore di $\boldsymbol{\theta}$, parti da una distribuzione su $\boldsymbol{\theta}$ e la aggiorni con i dati di training.`,
  },
  {
    id: 'fc-theta-fisso-o-aleatorio',
    kind: 'confronto',
    q: md`Come trattano il vettore dei parametri $\boldsymbol{\theta}$ la stima ML e la stima bayesiana?`,
    a: md`- **ML**: $\boldsymbol{\theta}$ è fisso ma ignoto (*fixed but unknown*). Cerchi la singola stima migliore, quella che massimizza la verosimiglianza dei dati; su $\boldsymbol{\theta}$ non c'è alcuna distribuzione.
- **Bayes**: $\boldsymbol{\theta}$ è una variabile aleatoria (*random variable*) con una sua distribuzione. Il prior descrive ciò che sai prima dei dati; i dati lo trasformano in una posterior.`,
  },
  {
    id: 'fc-dal-prior-alla-posterior',
    kind: 'definizione',
    q: md`Che ruolo hanno i dati di training nella stima bayesiana, secondo la slide p32?`,
    a: md`Convertono la distribuzione a priori su $\boldsymbol{\theta}$ in una densità di probabilità a posteriori (*posterior probability density*) con il teorema di Bayes. Lo schema è

$$p(\boldsymbol{\theta}) \;\xrightarrow{\text{osservo } \boldsymbol{X}}\; p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$$

Qui apprendere significa aggiornare una distribuzione su $\boldsymbol{\theta}$.`,
  },
  {
    id: 'fc-quando-si-applica',
    kind: 'proprieta',
    q: md`A quali problemi si può applicare la stima bayesiana?`,
    a: md`A ogni situazione in cui la densità ignota si può parametrizzare (*can be parameterized*): serve un modello $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ descritto da un vettore di parametri. Se la forma funzionale è ignota, o nessun modello parametrico approssima bene i dati, si passa alla stima non parametrica.`,
  },
  {
    id: 'fc-tre-ipotesi',
    kind: 'definizione',
    q: md`Quali sono le tre ipotesi di base della stima bayesiana (slide p33)?`,
    a: md`1. **Forma della densità nota** (*Known Density Form*): conosci la forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$, non il valore esatto di $\boldsymbol{\theta}$. È la stessa ipotesi di ML.
2. **Conoscenza a priori** (*Prior Knowledge*): ciò che sai all'inizio su $\boldsymbol{\theta}$ sta in una densità a priori nota $p(\boldsymbol{\theta})$.
3. **Campioni indipendenti** (*Independently Drawn Samples*): il resto della conoscenza sta in $\boldsymbol{X} = \{\mathbf{x}_1, \ldots, \mathbf{x}_N\}$, estratti indipendentemente secondo la densità ignota $p(\mathbf{x})$.`,
  },
  {
    id: 'fc-posterior-piccata',
    kind: 'intuizione',
    q: md`Che forma speri che abbia la densità a posteriori $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$, e che cosa significa?`,
    a: md`Speri che sia molto piccata (*sharply peaked*) attorno al valore vero di $\boldsymbol{\theta}$. Le note: un picco stretto riflette una forte convinzione (*strong belief*) in un valore preciso del parametro dopo aver visto i dati. Con un picco strettissimo la posterior si comporta quasi come una stima puntuale.`,
  },
  {
    id: 'fc-obiettivo',
    kind: 'definizione',
    q: md`Qual è l'obiettivo finale della stima bayesiana?`,
    a: md`Calcolare $p(\mathbf{x}\,|\,\boldsymbol{X})$, il più vicina possibile alla densità vera e ignota $p(\mathbf{x})$. Le slide la chiamano densità desiderata (*desired probability density*), le note densità predittiva (*predictive distribution*): la probabilità di una nuova osservazione $\mathbf{x}$ dati i campioni $\boldsymbol{X}$. La posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ ti serve per arrivarci.`,
  },
  // --- verso la formula chiave ---
  {
    id: 'fc-tre-passaggi',
    kind: 'procedura',
    q: md`Quali sono i tre passaggi della slide p34 che portano alla formula chiave?`,
    a: md`1. Marginalizzi su $\boldsymbol{\theta}$: $p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}, \boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$.
2. Fattorizzi la congiunta: $p(\mathbf{x}, \boldsymbol{\theta}\,|\,\boldsymbol{X}) = p(\mathbf{x}\,|\,\boldsymbol{\theta}, \boldsymbol{X})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$.
3. Togli $\boldsymbol{X}$ dal primo fattore, perché noto $\boldsymbol{\theta}$ la distribuzione di $\mathbf{x}$ è completamente nota: $p(\mathbf{x}\,|\,\boldsymbol{\theta}, \boldsymbol{X}) = p(\mathbf{x}\,|\,\boldsymbol{\theta})$.

Risultato: $p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$.`,
  },
  {
    id: 'fc-marginalizzazione',
    kind: 'formula',
    q: md`Scrivi il primo passaggio della slide p34. Su quale dominio si integra?`,
    a: md`$$p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}, \boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$$

Introduci $\boldsymbol{\theta}$ nella congiunta e lo elimini integrando (marginalizzazione). La nota a margine precisa: «The integration extends over the entire parameter space». Se $\boldsymbol{\theta}$ è un vettore è un integrale multiplo su tutte le componenti, e questo pesa sul costo computazionale.`,
  },
  {
    id: 'fc-secondo-passaggio',
    kind: 'proprieta',
    q: md`La slide p34 introduce il secondo passaggio con «By using Bayes theorem». Quale identità usi davvero?`,
    a: md`La regola del prodotto delle probabilità, con tutto condizionato a $\boldsymbol{X}$:

$$p(\mathbf{x}, \boldsymbol{\theta}\,|\,\boldsymbol{X}) = p(\mathbf{x}\,|\,\boldsymbol{\theta}, \boldsymbol{X})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$$

Il secondo fattore è già la posterior del parametro. La formula di Bayes vera e propria arriva alla slide p35, per calcolare $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$.`,
  },
  {
    id: 'fc-togliere-x',
    kind: 'proprieta',
    q: md`Perché puoi scrivere $p(\mathbf{x}\,|\,\boldsymbol{\theta}, \boldsymbol{X}) = p(\mathbf{x}\,|\,\boldsymbol{\theta})$?`,
    a: md`Per la prima ipotesi la forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota: fissato $\boldsymbol{\theta}$, la distribuzione di $\mathbf{x}$ è completamente nota e i campioni $\boldsymbol{X}$ non aggiungono nulla. È un'indipendenza condizionata tra la nuova osservazione e i campioni di training, dato $\boldsymbol{\theta}$. Le note: «we can remove $\boldsymbol{X}$ from the first density».`,
  },
  {
    id: 'fc-formula-chiave',
    kind: 'formula',
    q: md`Scrivi la formula chiave della stima bayesiana (quella rossa col diamante, slide p34).`,
    a: md`$$p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$$

La densità desiderata è l'integrale su $\boldsymbol{\theta}$ del modello di forma nota $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ per la posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$. Tutta la difficoltà si sposta sul calcolo della posterior.`,
  },
  {
    id: 'fc-media-pesata',
    kind: 'intuizione',
    q: md`Come si legge l'integrale della formula chiave (slide p35 e note p27)?`,
    a: md`Come una media. Non conosci il valore esatto di $\boldsymbol{\theta}$, quindi fai la media di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ su tutti i valori possibili di $\boldsymbol{\theta}$ (*to average $p(\mathbf{x}|\boldsymbol{\theta})$ over all possible values of $\boldsymbol{\theta}$*). Un integrale è la forma continua di una somma, e una somma pesata è una media: ogni modello $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ pesa quanto la sua credibilità a posteriori $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$. ML invece sceglie un solo $\boldsymbol{\theta}$.`,
  },
  {
    id: 'fc-canale-posterior',
    kind: 'proprieta',
    q: md`Attraverso che cosa i campioni $\boldsymbol{X}$ influenzano $p(\mathbf{x}\,|\,\boldsymbol{X})$? Che cosa ne segue?`,
    a: md`Solo attraverso la posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$: nella formula chiave $\boldsymbol{X}$ compare solo lì, perché $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ ha forma nota e non dipende dai dati. Ne segue, slide p35: «the basic problem in Bayesian learning is to compute the posterior density $p(\boldsymbol{\theta}|\boldsymbol{X})$». Le note la chiamano la sfida chiave (*key challenge*).`,
  },
  // --- come si calcola la posterior ---
  {
    id: 'fc-bayes-posterior',
    kind: 'formula',
    q: md`Scrivi la posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ con la formula di Bayes, anche nella forma con $p(\boldsymbol{X})$ delle note.`,
    a: md`$$p(\boldsymbol{\theta}\,|\,\boldsymbol{X}) = \frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{p(\boldsymbol{X})} = \frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}}$$

Verosimiglianza per prior, diviso la normalizzazione. Così la posterior dipende solo da quantità note: il prior (ipotesi 2) e la verosimiglianza (ipotesi 1 e 3).`,
  },
  {
    id: 'fc-denominatore',
    kind: 'proprieta',
    q: md`Che cosa rappresenta il denominatore $p(\boldsymbol{X}) = \int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}$, e da che cosa dipende?`,
    a: md`È la marginale dei campioni, ottenuta integrando via $\boldsymbol{\theta}$: le due scritture delle note coincidono per marginalizzazione. Non dipende da $\boldsymbol{\theta}$, dipende solo dai dati. Per la posterior è una costante che le dà area 1; nell'esempio gaussiano diventa il fattore $\alpha$.`,
  },
  {
    id: 'fc-produttoria',
    kind: 'formula',
    q: md`Come si scrive $p(\boldsymbol{X}\,|\,\boldsymbol{\theta})$ e quale ipotesi lo permette?`,
    a: md`$$p(\boldsymbol{X}\,|\,\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\,|\,\boldsymbol{\theta})$$

La terza ipotesi: i campioni sono estratti indipendentemente, quindi la densità congiunta dato $\boldsymbol{\theta}$ è il prodotto delle densità dei singoli campioni. È la stessa fattorizzazione con cui ML costruisce la verosimiglianza; qui il prodotto va poi moltiplicato per il prior.`,
  },
  // --- il caso gaussiano univariato ---
  {
    id: 'fc-esempio-gaussiano-ipotesi',
    kind: 'definizione',
    q: md`Quali sono le ipotesi dell'esempio gaussiano univariato (slide p36)?`,
    a: md`- $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è una gaussiana univariata e in $\boldsymbol{\theta} = [\mu, \sigma^2]$ l'unico parametro ignoto è $\mu$: quindi $p(\mathbf{x}\,|\,\mu) \sim N(\mu, \sigma^2)$ con $\sigma^2$ nota.
- Prior gaussiano sulla media: $p(\mu) \sim N(\mu_0, \sigma_0^2)$, con parametri noti a priori (*a priori known*).

Si calcolano la posterior $p(\mu\,|\,\boldsymbol{X})$ e la densità desiderata $p(\mathbf{x}\,|\,\boldsymbol{X})$.`,
  },
  {
    id: 'fc-significato-prior',
    kind: 'intuizione',
    q: md`Che cosa esprimono $\mu_0$ e $\sigma_0^2$ nel prior $p(\mu) \sim N(\mu_0, \sigma_0^2)$?`,
    a: md`$\mu_0$ è la media a priori (*prior mean*): il valore di $\mu$ che ritieni più plausibile prima dei dati. $\sigma_0^2$ è la varianza a priori (*prior variance*): quanto sei incerto su quel valore. Esempio: dallo storico dell'impianto di pesce ti aspetti una luminosità media dei salmoni attorno a $10$ con varianza $9$; un $\sigma_0^2$ piccolo direbbe «ne sono quasi sicuro».`,
  },
  {
    id: 'fc-fattore-alfa',
    kind: 'formula',
    q: md`Come si scrive la posterior della media nella slide p36, e che cos'è $\alpha$?`,
    a: md`$$p(\mu\,|\,\boldsymbol{X}) = \alpha \prod_{k=1}^{N} p(\mathbf{x}_k\,|\,\mu)\,p(\mu)$$

$\alpha$ è il fattore di normalizzazione (*normalization factor*): l'inverso del denominatore di Bayes, $\alpha = 1 / \int p(\boldsymbol{X}\,|\,\mu)\,p(\mu)\,\mathrm{d}\mu$. Non dipende da $\mu$ ma dipende dai campioni, per questo può assorbire anche termini come $\sum_k \mathbf{x}_k^2$.`,
  },
  {
    id: 'fc-forma-esponenziale',
    kind: 'formula',
    q: md`Scrivi la forma esponenziale della posterior della slide p37. Che cosa contiene $\alpha''$?`,
    a: md`$$p(\mu\,|\,\boldsymbol{X}) = \alpha'' \exp\left\{-\frac{1}{2}\left[\left(\frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}\right)\mu^2 - 2\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k + \frac{\mu_0}{\sigma_0^2}\right)\mu\right]\right\}$$

$\alpha''$ è una costante (*Constant*): raccoglie tutti i fattori che non dipendono da $\mu$, cioè le costanti $1/(\sqrt{2\pi}\sigma)$ e $1/(\sqrt{2\pi}\sigma_0)$ e i termini con $\sum_k \mathbf{x}_k^2$ e con $\mu_0^2$.`,
  },
  {
    id: 'fc-posterior-gaussiana-perche',
    kind: 'proprieta',
    q: md`Perché nell'esempio anche la posterior $p(\mu\,|\,\boldsymbol{X})$ è gaussiana? (domanda di Passerini)`,
    a: md`Il prodotto di gaussiane in $\mu$ è l'esponenziale di una somma di parabole in $\mu$, cioè l'esponenziale di una parabola. Il coefficiente di $\mu^2$ vale $-\frac{1}{2}\left(\frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}\right) < 0$, quindi la campana è integrabile: $p(\mu\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma_N^2)$ per ogni $N$. Vale con $\sigma^2$ nota e prior gaussiano: il prior gaussiano è coniugato (*conjugate*) alla verosimiglianza gaussiana. Con un prior uniforme su un intervallo otterresti una gaussiana troncata.`,
  },
  {
    id: 'fc-media-a-posteriori',
    kind: 'formula',
    q: md`Scrivi la media a posteriori $\mu_N$ dell'esempio gaussiano.`,
    a: md`$$\mu_N = \left(\frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\right)\bar{X} + \left(\frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\right)\mu_0$$

Combinazione lineare della media campionaria $\bar{X}$ e della media a priori $\mu_0$. I due pesi sono non negativi e sommano a 1, quindi $\mu_N$ cade sempre tra $\mu_0$ e $\bar{X}$. Il peso dei dati cresce con $N$ e con $\sigma_0^2$; quello del prior cresce con $\sigma^2$.`,
  },
  {
    id: 'fc-varianza-a-posteriori',
    kind: 'formula',
    q: md`Scrivi la varianza a posteriori $\sigma_N^2$, anche nella forma con le precisioni.`,
    a: md`$$\sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2 + \sigma^2} \qquad\Longleftrightarrow\qquad \frac{1}{\sigma_N^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}$$

Le precisioni si sommano: la seconda forma si legge dal coefficiente di $\mu^2$ nella forma esponenziale. $\sigma_N^2$ non dipende dai valori dei campioni, solo da $N$, $\sigma^2$ e $\sigma_0^2$; cala con $N$ e per $N$ grande vale circa $\sigma^2/N$.`,
  },
  {
    id: 'fc-media-pesata-precisioni',
    kind: 'formula',
    q: md`Riscrivi $\mu_N$ come media pesata con le precisioni. Come ci arrivi?`,
    a: md`$$\mu_N = \frac{\frac{N}{\sigma^2}\bar{X} + \frac{1}{\sigma_0^2}\mu_0}{\frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}}$$

Dividi numeratore e denominatore di ciascun peso della slide p37 per $\sigma_0^2\sigma^2$. $N/\sigma^2$ è la precisione della media campionaria (la sua varianza è $\sigma^2/N$), $1/\sigma_0^2$ quella del prior: vince la fonte meno incerta. La fonte non scrive questa forma.`,
  },
  {
    id: 'fc-media-campionaria',
    kind: 'definizione',
    q: md`Che cos'è $\bar{X}$ nella formula di $\mu_N$ e da dove nasce?`,
    a: md`È la media campionaria (*sample mean*), cerchiata in verde nella slide p37:

$$\bar{X} = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k$$

Nasce dal termine $\frac{1}{\sigma^2}\sum_k \mathbf{x}_k$ della forma esponenziale, riscritto $\frac{N}{\sigma^2}\bar{X}$. I campioni entrano nella posterior solo attraverso $\bar{X}$ e $N$, e $\bar{X}$ coincide con la stima ML della media. Non confonderla con l'insieme dei campioni $\boldsymbol{X}$.`,
  },
  {
    id: 'fc-prior-piu-dati',
    kind: 'intuizione',
    q: md`Che cosa mostrano le due equazioni di $\mu_N$ e $\sigma_N^2$, secondo la nota della slide p37?`,
    a: md`Come l'informazione a priori (*prior information*, cioè $\mu_0$ e $\sigma_0^2$) si combina con l'informazione empirica dei campioni (*empirical information*, cioè $\bar{X}$ e $N$) per dare la densità a posteriori. Esempio in cardiologia: prior sulla frequenza a riposo di un paziente $N(70, 4)$, 4 letture con $\sigma^2 = 16$ e media 76. I pesi sono $16/32$ ai dati e $16/32$ al prior, quindi $\mu_N = 73$.`,
  },
  {
    id: 'fc-nessun-campione',
    kind: 'proprieta',
    q: md`Che cosa succede alla posterior se $N = 0$?`,
    a: md`Il peso dei dati $\frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}$ vale 0, quindi $\mu_N = \mu_0$: le note dicono che è l'unica informazione che hai. Inoltre $\sigma_N^2 = \sigma_0^2$, quindi la posterior coincide con il prior. Le note scrivono solo $\mu_N = \mu_0$; la varianza è un'esplicitazione.`,
  },
  {
    id: 'fc-infiniti-campioni',
    kind: 'proprieta',
    q: md`Che cosa succede a $\mu_N$ quando $N \to \infty$, e sotto quale condizione?`,
    a: md`Con $\sigma_0^2 > 0$ il peso dei dati tende a 1 e quello del prior a 0: $\mu_N \to \bar{X}$, perché l'informazione dei dati domina il prior (*the information from the data dominates the prior*). A rigore $\mu_N - \bar{X} = \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}(\mu_0 - \bar{X}) \to 0$, e $\bar{X}$ tende alla media vera. Con $\sigma_0^2 = 0$ (prior dogmatico) resteresti a $\mu_N = \mu_0$ per ogni $N$.`,
  },
  {
    id: 'fc-delta-di-dirac',
    kind: 'proprieta',
    q: md`A che cosa converge la posterior $p(\mu\,|\,\boldsymbol{X})$ per $N \to +\infty$?`,
    a: md`A una delta di Dirac centrata nella media campionaria:

$$\sigma_N^2 \to 0, \qquad p(\mu\,|\,\boldsymbol{X}) \;\xrightarrow{\;N\to+\infty\;}\; \delta(\mu - \bar{X})$$

Tutta la massa di probabilità finisce su un solo valore di $\mu$: certezza, come una stima puntuale. Il centro $\bar{X}$ si sposta con $N$; formalmente la posterior si concentra sulla media vera. Serve $\sigma_0^2 > 0$.`,
  },
  {
    id: 'fc-bayesian-learning',
    kind: 'definizione',
    q: md`Che cosa si chiama *Bayesian learning* alla slide p38? E alla slide p32?`,
    a: md`Slide p38: al crescere di $N$ la posterior diventa sempre più piccata e tende a una delta di Dirac per $N \to \infty$; questo comportamento è detto **Bayesian learning**. Le note: più dati osservi, più la posterior diventa certa sul valore vero di $\mu$. Slide p32: lo stesso termine è sinonimo di stima bayesiana. Occhio al doppio uso.`,
  },
  {
    id: 'fc-figura-posterior',
    kind: 'intuizione',
    q: md`Descrivi la figura della slide p38 con le posterior $p(\mu\,|\,\mathbf{x}_1, \ldots, \mathbf{x}_N)$.`,
    a: md`Cinque curve sullo stesso asse $\mu$ (da $-4$ a $4$), per $N = 1, 5, 10, 20, 30$. Con $N = 1$ la campana è larga e bassa, centrata attorno a $-1.2$; con $N = 30$ è la più alta e stretta, appena a destra di 0. Il picco cresce e la larghezza cala con $N$; il centro si sposta perché segue la media campionaria. La fonte non dà i parametri: le altezze misurate danno $1/\sigma_N^2 \approx N + 0.25$, cioè $\sigma = 1$ e $\sigma_0 = 2$.`,
  },
  {
    id: 'fc-influenza-prior',
    kind: 'intuizione',
    q: md`Due analisti con prior gaussiani diversi osservano gli stessi dati. Che cosa succede al crescere di $N$?`,
    a: md`Le loro posterior diventano praticamente identiche. Il peso del prior in $\mu_N$ è

$$\frac{\sigma^2}{N\sigma_0^2 + \sigma^2} \;\xrightarrow{\;N\to\infty\;}\; 0$$

e cala come $1/N$. Le note: la posterior si stringe attorno a $\bar{X}$ e l'influenza del prior diminuisce (*the influence of the prior diminishes*). Vale se nessuno dei due ha $\sigma_0^2 = 0$.`,
  },
  // --- la densità predittiva ---
  {
    id: 'fc-predittiva-integrale',
    kind: 'formula',
    q: md`Nell'esempio gaussiano, quale integrale dà la densità desiderata? Scrivilo con le gaussiane esplicite.`,
    a: md`$$p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}\,|\,\mu)\,p(\mu\,|\,\boldsymbol{X})\,\mathrm{d}\mu$$

$$= \int \frac{1}{\sqrt{2\pi}\sigma}\exp\left[-\frac{1}{2}\left(\frac{\mathbf{x} - \mu}{\sigma}\right)^2\right] \frac{1}{\sqrt{2\pi}\sigma_N}\exp\left[-\frac{1}{2}\left(\frac{\mu - \mu_N}{\sigma_N}\right)^2\right]\mathrm{d}\mu$$

È la formula chiave con $\boldsymbol{\theta} = \mu$. In $\mu$ l'integranda è il prodotto di due campane: una centrata in $\mathbf{x}$ con deviazione standard $\sigma$, l'altra in $\mu_N$ con $\sigma_N$.`,
  },
  {
    id: 'fc-predittiva-con-f',
    kind: 'formula',
    q: md`Che cosa si ottiene integrando (terzo rigo della slide p39)?`,
    a: md`$$p(\mathbf{x}\,|\,\boldsymbol{X}) = \frac{1}{2\pi\,\sigma\sigma_N}\exp\left[-\frac{1}{2}\frac{(\mathbf{x} - \mu_N)^2}{\sigma^2 + \sigma_N^2}\right] f(\sigma, \sigma_N)$$

Completando il quadrato in $\mu$, la dipendenza da $\mathbf{x}$ esce dall'integrale; ciò che resta dentro è raccolto in $f(\sigma, \sigma_N)$. Come funzione di $\mathbf{x}$ è una gaussiana di media $\mu_N$ e varianza $\sigma^2 + \sigma_N^2$.`,
  },
  {
    id: 'fc-fattore-f',
    kind: 'proprieta',
    q: md`Che cos'è $f(\sigma, \sigma_N)$ nella slide p39 e quanto vale?`,
    a: md`La fonte non lo definisce: il nome dice solo che dipende da $\sigma$ e $\sigma_N$ e non da $\mathbf{x}$. È l'integrale gaussiano in $\mu$ che avanza dopo il completamento del quadrato, e vale

$$f(\sigma, \sigma_N) = \sqrt{2\pi}\,\frac{\sigma\sigma_N}{\sqrt{\sigma^2 + \sigma_N^2}}$$

(ricostruito dal testo di Duda, Hart e Stork). Con il fattore $\frac{1}{2\pi\sigma\sigma_N}$ dà la normalizzazione $\frac{1}{\sqrt{2\pi(\sigma^2 + \sigma_N^2)}}$: cambia la costante, non la forma.`,
  },
  {
    id: 'fc-predittiva-gaussiana',
    kind: 'formula',
    q: md`Che distribuzione ha la densità predittiva nell'esempio gaussiano?`,
    a: md`$$p(\mathbf{x}\,|\,\boldsymbol{X}) \sim N(\mu_N,\; \sigma^2 + \sigma_N^2)$$

Stessa forma del modello $p(\mathbf{x}\,|\,\mu)$, ma centrata sulla media a posteriori e con varianza maggiorata. È gaussiana perché $\mu$ è un parametro di posizione con varianza $\sigma^2$ fissa: $\mathbf{x} = \mu + \varepsilon$ con $\varepsilon \sim N(0, \sigma^2)$ indipendente, e la somma di due gaussiane indipendenti è gaussiana.`,
  },
  {
    id: 'fc-mu-uguale-mu-n',
    kind: 'intuizione',
    q: md`Come leggi la frase della slide p39 «and thus $\mu = \mu_N$ since $p(\mathbf{x}|\mu) \sim N(\mu, \sigma^2)$»?`,
    a: md`Confronti $p(\mathbf{x}\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma^2 + \sigma_N^2)$ con il modello $N(\mu, \sigma^2)$: il valore che inferisci per la media ignota è $\mu_N$. La posterior gaussiana è simmetrica e unimodale, quindi $\mu_N$ ne è media, moda e mediana. L'identificazione riguarda solo la media: per $N$ finito la predittiva ha varianza $\sigma^2 + \sigma_N^2$, non $\sigma^2$.`,
  },
  {
    id: 'fc-due-varianze',
    kind: 'intuizione',
    q: md`Perché la varianza predittiva è $\sigma^2 + \sigma_N^2$ e non solo $\sigma^2$?`,
    a: md`$$\underbrace{\sigma^2}_{\text{varianza intrinseca}} + \underbrace{\sigma_N^2}_{\text{incertezza su }\mu}$$

$\sigma^2$ è la variabilità propria dei dati (*inherent variance*): resterebbe anche conoscendo $\mu$ esattamente. $\sigma_N^2$ è l'incertezza residua sulla stima di $\mu$, che si annulla per $N \to \infty$. Con pochi campioni la predittiva è più larga del modello *plug-in* $N(\hat{\mu}, \sigma^2)$; con molti coincidono.`,
  },
  {
    id: 'fc-posterior-contro-predittiva',
    kind: 'confronto',
    q: md`Non confondere: che differenza c'è tra $p(\mu\,|\,\boldsymbol{X})$ e $p(\mathbf{x}\,|\,\boldsymbol{X})$ nell'esempio gaussiano?`,
    a: md`- **Posterior** $p(\mu\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma_N^2)$: densità sul parametro. Misura quanto sei incerto su $\mu$; per $N \to \infty$ diventa una delta.
- **Predittiva** $p(\mathbf{x}\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma^2 + \sigma_N^2)$: densità su una nuova osservazione. Per $N \to \infty$ tende a $N(\bar{X}, \sigma^2)$, mai a una delta, perché resta la variabilità dei dati $\sigma^2$.`,
  },
  {
    id: 'fc-riepilogo-esempio',
    kind: 'procedura',
    q: md`Riassumi in quattro punti il caso gaussiano, come nelle note (p29).`,
    a: md`1. La stima bayesiana aggiorna la convinzione (*belief*) sulla media ignota combinando informazione a priori e dati osservati.
2. La posterior che ne esce è gaussiana, $N(\mu_N, \sigma_N^2)$.
3. Al crescere di $N$ la posterior diventa più certa, cioè più stretta (*sharper*).
4. La predittiva $N(\mu_N, \sigma^2 + \sigma_N^2)$ riflette sia la variabilità dei dati sia l'incertezza rimasta sulla media.`,
  },
  {
    id: 'fc-procedura-numerica',
    kind: 'procedura',
    q: md`Hai $\sigma^2$, un prior $N(\mu_0, \sigma_0^2)$ e $N$ misure. In che ordine calcoli posterior e predittiva?`,
    a: md`1. Media campionaria $\bar{X} = \frac{1}{N}\sum_k \mathbf{x}_k$.
2. Denominatore comune $N\sigma_0^2 + \sigma^2$ e peso dei dati $w = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}$.
3. $\mu_N = w\bar{X} + (1 - w)\mu_0$.
4. $\sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2 + \sigma^2}$; controllo: $1/\sigma_N^2 = N/\sigma^2 + 1/\sigma_0^2$.
5. Predittiva $N(\mu_N, \sigma^2 + \sigma_N^2)$.

Esempio: $\sigma^2 = 10$, $\sigma_0^2 = 5$, $N = 2$ danno $w = 10/20 = 0.5$ e $\sigma_N^2 = 50/20 = 2.5$.`,
  },
  {
    id: 'fc-campioni-virtuali',
    kind: 'intuizione',
    q: md`In che senso il prior gaussiano «vale» un certo numero di campioni?`,
    a: md`Dividendo i pesi di $\mu_N$ per $\sigma_0^2$:

$$\mu_N = \frac{N\,\bar{X} + n_0\,\mu_0}{N + n_0}, \qquad n_0 = \frac{\sigma^2}{\sigma_0^2}, \qquad \sigma_N^2 = \frac{\sigma^2}{N + n_0}$$

È la media di $N$ campioni reali e di $n_0$ campioni virtuali tutti uguali a $\mu_0$. Prior sicuro ($\sigma_0$ piccolo): tanti campioni virtuali. Prior vago: pochi, e con $\sigma_0 \to \infty$ nessuno. Con $N = n_0$, $\mu_N$ sta a metà tra $\mu_0$ e $\bar{X}$. Rilettura non scritta nella fonte; Passerini usa la stessa idea con i pseudo-conteggi.`,
  },
  {
    id: 'fc-casi-limite-parametri',
    kind: 'proprieta',
    q: md`Che cosa danno le formule di $\mu_N$ e $\sigma_N^2$ nei casi limite dei parametri $\sigma_0^2$ e $\sigma^2$?`,
    a: md`- Prior dogmatico, $\sigma_0^2 \to 0$: $\mu_N \to \mu_0$, $\sigma_N^2 \to 0$. I dati non contano mai.
- Prior vago, $\sigma_0^2 \to \infty$: $\mu_N \to \bar{X}$, $\sigma_N^2 \to \sigma^2/N$. È il prior uniforme.
- Dati senza rumore, $\sigma^2 \to 0$ con $N \ge 1$: $\mu_N \to \bar{X}$, $\sigma_N^2 \to 0$.
- Dati molto rumorosi, $\sigma^2 \to \infty$ con $N$ fisso: $\mu_N \to \mu_0$, $\sigma_N^2 \to \sigma_0^2$.

Casi ricavati dalle equazioni della slide p37, non scritti nella fonte.`,
  },
  // --- ML contro Bayes ---
  {
    id: 'fc-punto-contro-distribuzione',
    kind: 'confronto',
    q: md`Che cosa stimano ML e l'approccio bayesiano, secondo la slide p40?`,
    a: md`- **ML** stima un punto (*point*) nello spazio dei parametri: la stima deterministica che massimizza la verosimiglianza.
- **Bayes** stima una distribuzione (*distribution*) $p(\mathbf{x}\,|\,\boldsymbol{X})$, da cui si inferisce $\boldsymbol{\theta}$; le note aggiungono che il risultato è una posterior che riflette dati e convinzioni a priori.

Nell'esempio gaussiano: da $N(\mu_N, \sigma^2 + \sigma_N^2)$ leggi $\mu = \mu_N$.`,
  },
  {
    id: 'fc-quando-coincidono',
    kind: 'confronto',
    q: md`In quali due casi le soluzioni ML e bayesiana sono equivalenti (slide p40)?`,
    a: md`1. Nel limite asintotico di infiniti campioni di training (*infinite training samples*): entrambi convergono ai valori veri, sono stimatori consistenti. Nell'esempio gaussiano $\mu_N \to \bar{X}$ e $\sigma_N^2 \to 0$.
2. Se il prior $p(\boldsymbol{\theta})$ è uniforme: non assumi conoscenza a priori, la posterior è proporzionale alla sola verosimiglianza e il suo massimo coincide con la stima ML.`,
  },
  {
    id: 'fc-condizioni-equivalenza',
    kind: 'proprieta',
    q: md`Quali condizioni implicite servono all'equivalenza asintotica tra ML e Bayes? E quali alla convergenza di entrambe ai valori veri?`,
    a: md`Perché le due soluzioni coincidano basta un prior che non escluda il limite della stima ML: densità positiva attorno a esso, nell'esempio gaussiano $\sigma_0^2 > 0$. Lì $\mu_N - \bar{X} = \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}(\mu_0 - \bar{X}) \to 0$ qualunque sia la distribuzione dei dati, purché $\bar{X}$ converga. Con un prior dogmatico ($\sigma_0^2 = 0$) $\mu_N = \mu_0$ per ogni $N$ e l'equivalenza cade: i limiti $N \to \infty$ e $\sigma_0^2 \to 0$ non si possono scambiare. Perché entrambe convergano ai valori veri (consistenza) serve in più che i campioni vengano davvero dal modello $p(\mathbf{x}\,|\,\boldsymbol{\theta})$: con un modello sbagliato le due stime coincidono al limite, ma nel modello un valore vero del parametro non esiste.`,
  },
  {
    id: 'fc-prior-uniforme',
    kind: 'proprieta',
    q: md`Perché con un prior uniforme la soluzione bayesiana si riduce a quella ML? Che cosa va precisato?`,
    a: md`Con $p(\boldsymbol{\theta})$ costante la posterior è $p(\boldsymbol{\theta}\,|\,\boldsymbol{X}) \propto p(\boldsymbol{X}\,|\,\boldsymbol{\theta})$: il suo massimo (stima MAP, termine di Passerini) è la stima ML. Le note: il prior non influenza la posterior. Precisazioni: un prior uniforme su tutta la retta non è normalizzabile (prior improprio), va inteso come limite di prior sempre più larghi ($\sigma_0^2 \to \infty$ nell'esempio); e la predittiva mantiene varianza $\sigma^2 + \sigma^2/N$, quindi coincide con il *plug-in* ML solo per $N$ grande.`,
  },
  {
    id: 'fc-perche-ml-in-pratica',
    kind: 'confronto',
    q: md`Perché in pratica si preferisce spesso ML alla stima bayesiana?`,
    a: md`Per due motivi della slide p40:
- **Minore complessità computazionale** (*lower computational complexity*): ML è un problema di massimo, spesso in forma chiusa; Bayes richiede di calcolare intere distribuzioni e di integrarle, come la normalizzazione della posterior e l'integrale su tutto lo spazio dei parametri.
- **Interpretabilità più facile** (*easier interpretability*): un solo valore dei parametri è più facile da capire e usare, soprattutto per una predizione diretta.`,
  },
  {
    id: 'fc-vantaggi-bayes',
    kind: 'confronto',
    q: md`Quali vantaggi della stima bayesiana riportano le note (p30)?`,
    a: md`- **Incorporare conoscenza a priori** (*incorporating prior knowledge*): integra il parere di un esperto (*expert opinion*) o la conoscenza del dominio; utile quando i dati sono scarsi.
- **Quantificare l'incertezza** (*uncertainty quantification*): dà l'intera posterior, non solo un punto, quindi puoi misurare la fiducia nella stima e fare affermazioni probabilistiche, come gli intervalli di credibilità.

Nelle slide di Melgani questi vantaggi non compaiono.`,
  },
  {
    id: 'fc-intervallo-credibilita',
    kind: 'procedura',
    q: md`Come costruisci un intervallo di credibilità al 95% per $\mu$ nell'esempio gaussiano?`,
    a: md`La posterior è $N(\mu_N, \sigma_N^2)$, quindi $\mu$ cade con probabilità 0.95 in

$$\mu_N \pm 1.96\,\sigma_N$$

Esempio dei salmoni: $\sigma^2 = 4$, prior $N(10, 9)$, $N = 4$ e $\bar{X} = 12.5$ danno $\mu_N = 12.25$ e $\sigma_N^2 = 0.9$, quindi circa $[10.39,\ 14.11]$. ML ti dà solo il punto $12.5$.`,
  },
  {
    id: 'fc-risposta-orale-ml-bayes',
    kind: 'confronto',
    q: md`Domanda di Melgani: «ML è un buon stimatore? È meglio o peggio della stima bayesiana? Perché?» Che schema segui?`,
    a: md`1. Bontà di uno stimatore: distorsione, varianza, consistenza. La stima ML della media è non distorta e consistente; quella della covarianza è distorta ma asintoticamente non distorta.
2. Visioni diverse: ML tratta $\boldsymbol{\theta}$ come fisso e stima un punto; Bayes lo tratta come aleatorio e stima una distribuzione.
3. Coincidono con infiniti campioni o con prior uniforme.
4. In pratica si preferisce ML per costo e interpretabilità; Bayes conviene con pochi dati e buona conoscenza a priori, e quantifica l'incertezza.`,
  },
  // --- pagine di confine: stime ML gaussiane (part1 p26) ---
  {
    id: 'fc-stime-ml-gaussiane',
    kind: 'formula',
    q: md`Scrivi le stime ML del vettore medio e della matrice di covarianza di una gaussiana, con $N$ campioni iid.`,
    a: md`$$\hat{\mathbf{m}} = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k$$

$$\hat{\Sigma} = \frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^t - \hat{\mathbf{m}}\hat{\mathbf{m}}^t$$

Media campionaria e media dei prodotti esterni degli scarti.`,
  },
  {
    id: 'fc-seconda-forma-covarianza',
    kind: 'procedura',
    q: md`Come passi dalla prima alla seconda forma di $\hat{\Sigma}$?`,
    a: md`Sviluppi il prodotto: $(\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t = \mathbf{x}_k\mathbf{x}_k^t - \mathbf{x}_k\hat{\mathbf{m}}^t - \hat{\mathbf{m}}\mathbf{x}_k^t + \hat{\mathbf{m}}\hat{\mathbf{m}}^t$. Fai la media su $k$ e usi $\frac{1}{N}\sum_k \mathbf{x}_k = \hat{\mathbf{m}}$: i due termini misti valgono $-\hat{\mathbf{m}}\hat{\mathbf{m}}^t$ ciascuno, l'ultimo $+\hat{\mathbf{m}}\hat{\mathbf{m}}^t$. Resta $\frac{1}{N}\sum_k \mathbf{x}_k\mathbf{x}_k^t - \hat{\mathbf{m}}\hat{\mathbf{m}}^t$. In 1-D con $\{2, 4, 9\}$: $\frac{101}{3} - 25 = \frac{26}{3}$, come la media degli scarti al quadrato $\frac{9 + 1 + 16}{3}$.`,
  },
  {
    id: 'fc-proprieta-stime-ml',
    kind: 'proprieta',
    q: md`Quali proprietà delle stime ML gaussiane elencano le note (p26)?`,
    a: md`- **Asintoticamente non distorte** (*asymptotically unbiased*): al crescere di $N$ si avvicinano ai valori veri di $\mathbf{m}$ e $\Sigma$.
- **Efficienti** (*efficient*): varianza minima tra gli stimatori non distorti.
- **Consistenti** (*consistent*): per $N \to +\infty$, $\hat{\mathbf{m}} \to \mathbf{m}$ e $\hat{\Sigma} \to \Sigma$.

Attenzione: la definizione delle note per «asintoticamente non distorte» descrive in realtà la consistenza; e $\hat{\Sigma}$ con $1/N$ è efficiente solo in senso asintotico, perché per $N$ finito è distorta.`,
  },
  {
    id: 'fc-bias-covarianza',
    kind: 'formula',
    q: md`Quanto valgono i valori attesi delle stime ML gaussiane, e come si corregge la covarianza?`,
    a: md`$$E\{\hat{\mathbf{m}}\} = \mathbf{m}, \qquad E\{\hat{\Sigma}\} = \frac{N-1}{N}\,\Sigma$$

La media è non distorta; la covarianza in media sottostima $\Sigma$. Lo stimatore non distorto elementare (*elementary unbiased estimator*) moltiplica per $N/(N-1)$:

$$\hat{\Sigma} = \frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$$

La correzione conta soprattutto con $N$ piccolo.`,
  },
  // --- pagina di confine: stima non parametrica (part1 p30) ---
  {
    id: 'fc-verso-non-parametrica',
    kind: 'definizione',
    q: md`Quando serve la stima non parametrica, che chiude la pagina 30 delle note?`,
    a: md`Quando manca conoscenza a priori sulla distribuzione dei dati, o quando i modelli parametrici non la approssimano bene. I metodi parametrici assumono una forma funzionale precisa (per esempio gaussiana o di Poisson); i non parametrici fanno meno assunzioni e si basano direttamente sui dati. È il caso in cui la stima bayesiana, che richiede una densità parametrizzabile, non si applica.`,
  },
]
