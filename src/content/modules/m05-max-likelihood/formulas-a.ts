// Formule del foglio m05 (stima a massima verosimiglianza), prima metà dei concetti dell'inventario
// nell'ordine del file: c01-c11, c67 (sta tra c11 e c12 nell'inventario) e c12-c34.
// Convenzione condivisa: una voce per ogni stringa LaTeX di concepts[].latex, id "f-<concetto>" per la prima,
// "f-<concetto>-2", "f-<concetto>-3"... per le successive. Il campo latex è copiato dall'inventario
// (verificato sulle immagini di ch2 p.9-19, p.31 e part1 p.20-21) e scripts/formula-coverage.ts lo ritrova.
// importance = examRelevance del concetto. Le formule che la fonte non scrive (integrazioni) lo dicono nel testo.
// I numeri dei cinque salmoni sono quelli dell'esempio svolto dell'inventario: 4.2, 5.1, 3.8, 4.9, 4.5.
import { md } from '../../types'
import type { Formula } from '../../types'

export const formulasA: Formula[] = [
  // --- c02 Definizione della stima ML -----------------------------------------------------------
  {
    id: 'f-c02',
    name: 'Definizione della stima a massima verosimiglianza',
    nameEn: 'Maximum likelihood (ML) estimate',
    latex: md`\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \, p(\mathbf{X} \mid \boldsymbol{\theta})`,
    explain: md`La stima a massima verosimiglianza (*maximum likelihood estimate*, ML) del vettore dei parametri $\boldsymbol{\theta}$ è il valore di $\boldsymbol{\theta}$ che rende massima la funzione di verosimiglianza (*likelihood function*) calcolata sui campioni di training osservati $\mathbf{X} = \{\mathbf{x}_1, \ldots, \mathbf{x}_N\}$. I dati restano fermi, perché sono quelli che hai davvero raccolto; a muoversi è $\boldsymbol{\theta}$, la variabile scritta sotto l'operatore $\arg\max$. Ogni valore di $\boldsymbol{\theta}$ individua una pdf diversa della stessa famiglia, e ciascuna restituisce un valore di likelihood (*each yielding a likelihood value*). La stima ML è la candidata che si accorda meglio con i campioni osservati (*best agrees with the actually observed training samples*). Le note la leggono anche come la scelta che massimizza la probabilità di osservare proprio quei dati sotto il modello (*maximizing the probability of observing the given data under the model*). $\hat{\boldsymbol{\theta}}$ porta il cappello perché è una stima: dipende dai dati, quindi è un vettore aleatorio con il suo bias e la sua varianza. Esempio con il pesce: misuri la luminosità di cinque salmoni e cerchi, fra tutte le gaussiane possibili, quella sotto cui quei cinque valori erano più plausibili.`,
    symbols: [
      { s: md`\hat{\boldsymbol{\theta}}`, meaning: md`stima ML del vettore dei parametri; è funzione dei dati, quindi aleatoria` },
      { s: md`\boldsymbol{\theta}`, meaning: md`vettore degli $r$ parametri del modello, $\boldsymbol{\theta} = (\theta_1, \theta_2, \ldots, \theta_r)$: la variabile della ricerca` },
      { s: md`\mathbf{X}`, meaning: md`insieme degli $N$ campioni di training osservati, $\mathbf{X} = \{\mathbf{x}_1, \mathbf{x}_2, \ldots, \mathbf{x}_N\}$: fissato` },
      { s: md`p(\mathbf{X} \mid \boldsymbol{\theta})`, meaning: md`funzione di likelihood di $\boldsymbol{\theta}$ rispetto ai campioni $\mathbf{X}$: con $\mathbf{X}$ fissato è una funzione di $\boldsymbol{\theta}$` },
      { s: md`\arg\max_{\boldsymbol{\theta}}`, meaning: md`restituisce il punto di massimo (il valore di $\boldsymbol{\theta}$), non il valore massimo della funzione` },
    ],
    whenToUse: md`È la prima formula da scrivere alla domanda d'orale «What is the formula of Maximum Likelihood…?» e il punto di partenza di ogni esercizio di stima: scegli la famiglia $p(\mathbf{x} \mid \boldsymbol{\theta})$, scrivi la likelihood, cerca il suo massimo.`,
    pitfalls: md`Non confondere $\arg\max$ con $\max$: la stima è la posizione del massimo, non la sua altezza. E non leggere $p(\mathbf{X} \mid \boldsymbol{\theta})$ come «probabilità di $\boldsymbol{\theta}$»: in ML $\boldsymbol{\theta}$ è fisso ma ignoto (*fixed but unknown*) e non ha una prior. La probabilità di $\boldsymbol{\theta}$ dati i campioni, $p(\boldsymbol{\theta} \mid \mathbf{X})$, è la posterior della stima bayesiana.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\boldsymbol{\theta}} = \boxed{\;?\;} \, p(\mathbf{X} \mid \boldsymbol{\theta})`,
        answer: md`\arg\max_{\boldsymbol{\theta}}`,
        distractors: [md`\max_{\boldsymbol{\theta}}`, md`\arg\max_{\mathbf{X}}`, md`\arg\min_{\boldsymbol{\theta}}`],
      },
      {
        masked: md`\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \, \boxed{\;?\;}`,
        answer: md`p(\mathbf{X} \mid \boldsymbol{\theta})`,
        distractors: [md`p(\boldsymbol{\theta} \mid \mathbf{X})`, md`p(\boldsymbol{\theta})`, md`p(\mathbf{X})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 17 },
      { doc: 'part1', page: 20 },
    ],
  },

  // --- c03 Likelihood come prodotto sui campioni iid ---------------------------------------------
  {
    id: 'f-c03',
    name: 'Likelihood di campioni iid: prodotto delle pdf',
    nameEn: 'Likelihood function of iid samples',
    latex: md`p(\mathbf{X} \mid \boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
    explain: md`È la funzione di verosimiglianza che la definizione ML massimizza (*the likelihood function based on the observed data X*). Poiché $\mathbf{X} = \{\mathbf{x}_1, \ldots, \mathbf{x}_N\}$ è un vettore di variabili aleatorie iid (*independent and identically distributed*), la densità congiunta dei campioni si scompone nel prodotto delle densità dei singoli campioni. L'indipendenza permette di moltiplicare; l'identica distribuzione permette di usare la stessa $p(\cdot \mid \boldsymbol{\theta})$ in ogni fattore. Letta come funzione di $\boldsymbol{\theta}$ con $\mathbf{X}$ fissato, misura la compatibilità tra un valore dei parametri e i dati (*measure of compatibility/agreement between θ and X*): è alta se la pdf candidata mette densità alta proprio dove i campioni sono caduti. Basta un solo campione in una zona dove la pdf quasi si annulla per schiacciare tutto il prodotto. Nell'esempio della likelihood della fonte, una dozzina di campioni attorno a 3 dà un massimo di circa $1.7 \times 10^{-7}$, sopra l'ultima tacca etichettata del grafico ($1.2 \times 10^{-7}$): numeri minuscoli, che anticipano perché conviene il logaritmo.`,
    symbols: [
      { s: md`p(\mathbf{X} \mid \boldsymbol{\theta})`, meaning: md`likelihood: densità congiunta dei campioni, letta come funzione di $\boldsymbol{\theta}$` },
      { s: md`\prod_{k=1}^{N}`, meaning: md`prodotto sugli $N$ campioni, consentito dall'indipendenza` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo campione di training (vettore di feature)` },
      { s: md`p(\mathbf{x}_k \mid \boldsymbol{\theta})`, meaning: md`pdf del modello valutata nel campione $k$-esimo; è la stessa funzione per ogni $k$ perché i campioni sono identicamente distribuiti` },
      { s: md`N`, meaning: md`numero di campioni iid` },
    ],
    whenToUse: md`Risponde alla domanda d'orale «why we can use the separate products of the probabilities and what the Likelihood describe»: il prodotto viene dall'ipotesi iid, la likelihood misura l'accordo tra $\boldsymbol{\theta}$ e i dati. Negli esercizi è il secondo passo, subito dopo aver scritto $p(\mathbf{x} \mid \boldsymbol{\theta})$. La stessa scomposizione spiega perché ML è veloce nelle reti bayesiane con dati completi.`,
    pitfalls: md`Senza indipendenza il prodotto non vale: campioni correlati, come letture consecutive dello stesso sensore, richiedono la densità congiunta completa. E la likelihood non è una densità in $\boldsymbol{\theta}$: il suo integrale rispetto a $\boldsymbol{\theta}$ in generale non vale 1.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{X} \mid \boldsymbol{\theta}) = \boxed{\;?\;}`,
        answer: md`\prod_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
        distractors: [
          md`\sum_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
          md`\frac{1}{N} \sum_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
          md`\prod_{k=1}^{N} p(\boldsymbol{\theta} \mid \mathbf{x}_k)`,
        ],
      },
    ],
    source: [
      { doc: 'part1', page: 20 },
      { doc: 'ch2', page: 17 },
      { doc: 'ch2', page: 9 },
    ],
  },

  // --- c07 Log-likelihood ----------------------------------------------------------------------
  {
    id: 'f-c07',
    name: 'Log-likelihood',
    nameEn: 'Log-likelihood',
    latex: md`l(\boldsymbol{\theta}) = \ln p(\mathbf{X} \mid \boldsymbol{\theta})`,
    explain: md`Per scopi analitici (*for analytical purposes*) conviene lavorare con il logaritmo della likelihood invece che con la likelihood stessa. La funzione $\ln p(\mathbf{X} \mid \boldsymbol{\theta})$ si chiama log-verosimiglianza (*log-likelihood*); nella slide dell'esempio della likelihood è indicata con $l(\theta)$. I motivi sono tre. La likelihood di $N$ campioni iid è un prodotto di $N$ fattori, scomodo da derivare, e il logaritmo lo trasforma in una somma. Il prodotto è numericamente minuscolo (circa $10^{-7}$ con una dozzina di campioni nell'esempio della fonte, e va in *underflow* con migliaia di campioni), mentre il logaritmo resta in un intervallo gestibile: nella stessa figura il massimo di $l(\theta)$ sta poco sopra $-20$ (circa $-16$) e l'asse di $l(\theta)$ arriva a $-100$. Infine molti modelli, a partire dalla gaussiana, contengono un esponenziale che il logaritmo cancella, lasciando un polinomio nei parametri. Il grafico cambia forma (la campana stretta di $p(\mathbf{X} \mid \theta)$ diventa una curva larga rivolta in basso), ma il picco resta nello stesso $\hat{\theta}$.`,
    symbols: [
      { s: md`l(\boldsymbol{\theta})`, meaning: md`log-likelihood, funzione di $\boldsymbol{\theta}$ (notazione della slide dell'esempio della likelihood)` },
      { s: md`\ln`, meaning: md`logaritmo naturale; definito solo per argomenti positivi` },
      { s: md`p(\mathbf{X} \mid \boldsymbol{\theta})`, meaning: md`likelihood dei campioni osservati` },
    ],
    whenToUse: md`Terzo passo di ogni esercizio ML: dopo aver scritto la likelihood come prodotto, passa al logaritmo prima di derivare.`,
    pitfalls: md`La log-likelihood di dati continui è di solito negativa (logaritmo di un numero minore di 1), ma diventa positiva se le densità superano 1: il suo segno non dice nulla sulla bontà della stima. Conta solo dove sta il massimo.`,
    importance: 3,
    blanks: [
      {
        masked: md`l(\boldsymbol{\theta}) = \boxed{\;?\;}`,
        answer: md`\ln p(\mathbf{X} \mid \boldsymbol{\theta})`,
        distractors: [md`\ln p(\boldsymbol{\theta} \mid \mathbf{X})`, md`-\ln p(\mathbf{X} \mid \boldsymbol{\theta})`, md`e^{p(\mathbf{X} \mid \boldsymbol{\theta})}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 17 },
      { doc: 'part1', page: 20 },
      { doc: 'ch2', page: 10 },
    ],
  },

  // --- c08 Il logaritmo non sposta il massimo ---------------------------------------------------
  {
    id: 'f-c08',
    name: 'Stima ML come massimo della log-likelihood',
    nameEn: 'ML estimate through the log-likelihood',
    latex: md`\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta})`,
    explain: md`Il logaritmo è una funzione monotona crescente (*monotonically increasing*), quindi il $\boldsymbol{\theta}$ che massimizza la log-likelihood massimizza anche la likelihood, e la slide riscrive la definizione ML con $\ln$. Una funzione strettamente crescente conserva l'ordine: se $p(\mathbf{X} \mid \boldsymbol{\theta}_1) > p(\mathbf{X} \mid \boldsymbol{\theta}_2)$, allora anche $\ln p(\mathbf{X} \mid \boldsymbol{\theta}_1) > \ln p(\mathbf{X} \mid \boldsymbol{\theta}_2)$. La classifica delle pdf candidate non cambia, e con lei il vincitore. Cambia il valore del massimo (il logaritmo di un numero minore di 1 è negativo), non la sua posizione. Nell'esempio della likelihood della fonte le curve $p(\mathbf{X} \mid \theta)$ e $l(\theta)$ hanno forme molto diverse ma lo stesso $\hat{\theta} \approx 3$. I passaggi sono nella dimostrazione [«il logaritmo non sposta il massimo»](#derivation:der01).`,
    symbols: [
      { s: md`\hat{\boldsymbol{\theta}}`, meaning: md`stima ML, identica a quella della definizione con la likelihood` },
      { s: md`\ln`, meaning: md`logaritmo naturale, strettamente crescente su $(0, +\infty)$` },
      { s: md`\ln p(\mathbf{X} \mid \boldsymbol{\theta})`, meaning: md`log-likelihood $l(\boldsymbol{\theta})$` },
    ],
    whenToUse: md`All'orale, subito dopo la definizione: giustifica in una frase il passaggio al logaritmo («è monotono crescente, quindi non sposta il massimo»). Negli esercizi è la forma che derivi davvero.`,
    pitfalls: md`Serve $p(\mathbf{X} \mid \boldsymbol{\theta}) > 0$: dove la likelihood è nulla la log-likelihood vale $-\infty$ e quel $\boldsymbol{\theta}$ resta escluso, come prima. Il trucco vale per qualunque trasformazione strettamente crescente; una decrescente trasforma il massimo in un minimo (per questo la *negative log-likelihood* si minimizza).`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \boxed{\;?\;}`,
        answer: md`\ln p(\mathbf{X} \mid \boldsymbol{\theta})`,
        distractors: [md`-\ln p(\mathbf{X} \mid \boldsymbol{\theta})`, md`\ln p(\boldsymbol{\theta} \mid \mathbf{X})`, md`\frac{1}{p(\mathbf{X} \mid \boldsymbol{\theta})}`],
      },
      {
        masked: md`\hat{\boldsymbol{\theta}} = \boxed{\;?\;} \ln p(\mathbf{X} \mid \boldsymbol{\theta})`,
        answer: md`\arg\max_{\boldsymbol{\theta}}`,
        distractors: [md`\arg\min_{\boldsymbol{\theta}}`, md`\max_{\boldsymbol{\theta}}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 17 },
      { doc: 'part1', page: 20 },
      { doc: 'ch2', page: 10 },
    ],
  },
  {
    id: 'f-c08-2',
    name: 'Stima ML con il logaritmo, nella scrittura delle note',
    nameEn: 'ML estimate with the log-likelihood (notes notation)',
    latex: md`\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \ln\big(p(\mathbf{X} \mid \boldsymbol{\theta})\big)`,
    explain: md`È la stessa formula come la scrivono le note del corso, con le parentesi attorno all'argomento del logaritmo. Le note la introducono dopo aver ricordato che massimizzare la log-likelihood produce la stessa stima che massimizzare la likelihood (*maximizing the log-likelihood yields the same parameter estimate as maximizing the likelihood itself*), e subito dopo danno il motivo pratico: la trasformazione semplifica i calcoli, soprattutto con prodotti di probabilità (*products of probabilities*), perché li converte in somme e rende l'ottimizzazione più gestibile (*making the optimization process more manageable*). Con o senza parentesi, le due scritture dicono la stessa cosa.`,
    symbols: [
      { s: md`\ln\big(\cdot\big)`, meaning: md`logaritmo naturale applicato all'intera likelihood` },
      { s: md`\arg\max_{\boldsymbol{\theta}}`, meaning: md`il valore di $\boldsymbol{\theta}$ in cui la funzione è massima` },
      { s: md`\mathbf{X}`, meaning: md`campioni di training osservati, fissati durante la ricerca` },
    ],
    whenToUse: md`Per riconoscerla quando la trovi scritta così nelle note o in un compito: non è una definizione diversa.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \ln\big(\boxed{\;?\;}\big)`,
        answer: md`p(\mathbf{X} \mid \boldsymbol{\theta})`,
        distractors: [md`p(\boldsymbol{\theta} \mid \mathbf{X})`, md`p(\mathbf{x}_1 \mid \boldsymbol{\theta})`, md`\sum_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta})`],
      },
    ],
    source: [
      { doc: 'part1', page: 20 },
      { doc: 'ch2', page: 17 },
    ],
  },

  // --- c09 Dal prodotto alla somma ---------------------------------------------------------------
  {
    id: 'f-c09',
    name: 'La log-likelihood è una somma di contributi',
    nameEn: 'The logarithm converts products into sums',
    latex: md`\ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \ln \prod_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta}) = \sum_{k=1}^{N} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
    explain: md`Unisce il prodotto dei campioni iid con la proprietà $\ln(ab) = \ln a + \ln b$: la log-likelihood di $N$ campioni è la somma dei logaritmi delle pdf dei singoli campioni. È il vantaggio che le note citano esplicitamente: il logaritmo converte i prodotti in somme (*it converts them into sums*). Tre conseguenze pratiche. Una somma si deriva termine a termine, quindi il gradiente totale è la somma dei gradienti dei campioni. Ogni campione contribuisce in modo additivo: aggiungere un campione significa aggiungere un termine. Numericamente non si va in *underflow*, perché si sommano numeri moderati invece di moltiplicare numeri piccoli. La formula non è scritta così nelle pagine della fonte: segue dal prodotto della likelihood e dal passaggio al logaritmo, e il grafico di $l(\theta)$ nella slide dell'esempio della likelihood ne è la versione disegnata. Esempio con lo spam: se $\theta$ è la probabilità che un'email contenga la parola «gratis» e la trovi in 3 email su 10, la log-likelihood è $3 \ln \theta + 7 \ln(1-\theta)$, dieci termini raggruppati in due; il suo massimo è in $\hat{\theta} = 0.3$.`,
    symbols: [
      { s: md`\ln p(\mathbf{x}_k \mid \boldsymbol{\theta})`, meaning: md`contributo del campione $k$-esimo alla log-likelihood` },
      { s: md`\prod_{k=1}^{N}`, meaning: md`prodotto delle pdf dei campioni iid, cioè la likelihood` },
      { s: md`\sum_{k=1}^{N}`, meaning: md`somma dei contributi, uno per campione` },
      { s: md`N`, meaning: md`numero di campioni` },
    ],
    whenToUse: md`In ogni esercizio, prima di derivare: scrivi subito la log-likelihood come somma. All'orale è metà della risposta a «why we can use the separate products of the probabilities».`,
    pitfalls: md`Il logaritmo di una somma non è la somma dei logaritmi: $\ln(a+b) \neq \ln a + \ln b$. La scomposizione funziona perché la likelihood è un prodotto. In una mistura di gaussiane ogni fattore contiene a sua volta una somma, che il logaritmo non spezza: è uno dei motivi per cui lì serve l'algoritmo EM.`,
    importance: 3,
    blanks: [
      {
        masked: md`\ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \ln \prod_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta}) = \boxed{\;?\;}`,
        answer: md`\sum_{k=1}^{N} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
        distractors: [
          md`\prod_{k=1}^{N} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
          md`\ln \sum_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
          md`N \ln p(\mathbf{x}_1 \mid \boldsymbol{\theta})`,
        ],
      },
    ],
    source: [
      { doc: 'part1', page: 20 },
      { doc: 'ch2', page: 9 },
      { doc: 'ch2', page: 10 },
    ],
  },

  // --- c10 Equazioni di verosimiglianza ----------------------------------------------------------
  {
    id: 'f-c10',
    name: 'Equazioni di verosimiglianza: gradiente nullo',
    nameEn: 'Likelihood equations (vector form)',
    latex: md`\nabla_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \sum_{k=1}^{N} \nabla_{\boldsymbol{\theta}} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta}) = \mathbf{0}`,
    explain: md`È il modo in cui si calcola in pratica l'$\arg\max$ della definizione. Se la log-likelihood è derivabile e il massimo cade all'interno dello spazio dei parametri, nella stima ML il gradiente (*gradient*) rispetto a $\boldsymbol{\theta}$ si annulla: è la condizione necessaria di stazionarietà (*stationary point*). Il vettore nullo ha $r$ componenti, quindi ottieni $r$ equazioni, una per parametro, dette equazioni di verosimiglianza (*likelihood equations*). Grazie alla forma a somma della log-likelihood, il gradiente totale è la somma dei gradienti dei singoli campioni. La slide della fonte non la scrive (è un'integrazione), ma l'orale la chiede: «develop the first derivative for a gaussian». L'operatore $\nabla_{\boldsymbol{\theta}}$ è lo stesso che la fonte usa nella matrice di informazione di Fisher. Per la media di una gaussiana il contributo del campione $k$ è $(x_k - m)/\sigma^2$, e la condizione diventa $\sum_k (x_k - m)/\sigma^2 = 0$, da cui la media campionaria. I passaggi generali sono nella dimostrazione [«dal prodotto alla somma e alle equazioni di verosimiglianza»](#derivation:der02).`,
    symbols: [
      { s: md`\nabla_{\boldsymbol{\theta}}`, meaning: md`gradiente rispetto alle $r$ componenti di $\boldsymbol{\theta}$: il vettore delle derivate parziali $\partial / \partial \theta_i$` },
      { s: md`\nabla_{\boldsymbol{\theta}} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})`, meaning: md`contributo del campione $k$-esimo al gradiente (in statistica si chiama *score* del campione)` },
      { s: md`\mathbf{0}`, meaning: md`vettore nullo con $r$ componenti` },
      { s: md`r`, meaning: md`numero di parametri del modello, quindi di equazioni` },
    ],
    whenToUse: md`Ricetta per gli esercizi: 1) scrivi $p(\mathbf{x} \mid \boldsymbol{\theta})$; 2) scrivi la likelihood come prodotto; 3) passa al logaritmo; 4) deriva rispetto a ogni parametro e poni a zero; 5) risolvi e verifica che sia un massimo.`,
    pitfalls: md`Gradiente nullo è condizione necessaria, non sufficiente: il punto può essere un minimo, una sella o un massimo solo locale, e va controllata la derivata seconda. Se il massimo cade sul bordo dello spazio dei parametri la derivata non si annulla affatto (è il caso della distribuzione uniforme su $[0, \theta]$).`,
    importance: 3,
    blanks: [
      {
        masked: md`\nabla_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \sum_{k=1}^{N} \boxed{\;?\;} = \mathbf{0}`,
        answer: md`\nabla_{\boldsymbol{\theta}} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
        distractors: [
          md`\nabla_{\boldsymbol{\theta}} p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
          md`\ln \nabla_{\boldsymbol{\theta}} p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
          md`\nabla_{\mathbf{x}} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
        ],
      },
    ],
    source: [
      { doc: 'ch2', page: 17 },
      { doc: 'ch2', page: 14 },
    ],
  },
  {
    id: 'f-c10-2',
    name: 'Equazioni di verosimiglianza, una per parametro',
    nameEn: 'Likelihood equations (component form)',
    latex: md`\frac{\partial \ln p(\mathbf{X} \mid \boldsymbol{\theta})}{\partial \theta_i} = 0, \quad i = 1, 2, \ldots, r`,
    explain: md`La stessa condizione scritta componente per componente: la derivata parziale della log-likelihood rispetto a ogni parametro $\theta_i$ vale zero. È un sistema di $r$ equazioni in $r$ incognite. Esempio con la gaussiana 1-D e parametri $\theta_1 = m$, $\theta_2 = \sigma^2$: la prima equazione dà $\hat{m} = \frac{1}{N}\sum_k x_k$; la seconda, con $\hat{m}$ al posto di $m$, dà $\hat{\sigma}^2 = \frac{1}{N}\sum_k (x_k - \hat{m})^2$. Qui la prima equazione non contiene $\sigma^2$, quindi si risolve da sola; in generale le equazioni vanno risolte insieme. Le derivate $\partial \ln p(\mathbf{X} \mid \boldsymbol{\theta}) / \partial \theta_i$ sono le stesse che compaiono negli elementi della matrice di Fisher. Integrazione rispetto alla fonte, come la forma vettoriale.`,
    symbols: [
      { s: md`\theta_i`, meaning: md`$i$-esimo parametro del vettore $\boldsymbol{\theta}$` },
      { s: md`\frac{\partial}{\partial \theta_i}`, meaning: md`derivata parziale rispetto a $\theta_i$, con gli altri parametri tenuti fermi` },
      { s: md`r`, meaning: md`numero di parametri, quindi di equazioni` },
    ],
    whenToUse: md`Negli esercizi con più parametri (media e varianza di una gaussiana, i due parametri di una Gamma): scrivi un'equazione per ciascuno.`,
    pitfalls: md`Derivando rispetto a $\sigma$ invece che a $\sigma^2$ ottieni la stessa stima (per l'invarianza di ML), ma conti diversi: decidi prima quale parametro usi e restaci. Con più parametri il controllo del massimo passa dalla matrice hessiana, non dalle singole derivate seconde.`,
    importance: 3,
    blanks: [
      {
        masked: md`\frac{\partial \ln p(\mathbf{X} \mid \boldsymbol{\theta})}{\partial \boxed{\;?\;}} = 0, \quad i = 1, 2, \ldots, r`,
        answer: md`\theta_i`,
        distractors: [md`\mathbf{x}_i`, md`\mathbf{X}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 17 },
      { doc: 'ch2', page: 14 },
    ],
  },

  // --- c11 Verifica del massimo e casi senza forma chiusa ----------------------------------------
  {
    id: 'f-c11',
    name: 'Controllo del massimo: derivata seconda negativa',
    nameEn: 'Second-order check for a maximum',
    latex: md`\left. \frac{\partial^2 \ln p(\mathbf{X} \mid \theta)}{\partial \theta^2} \right|_{\theta = \hat{\theta}} < 0`,
    explain: md`Un punto in cui la derivata prima si annulla può essere un massimo, un minimo o un flesso. Con un solo parametro verifichi che la derivata seconda della log-likelihood, calcolata nel punto stazionario $\hat{\theta}$, sia negativa: lì la curva è concava (*concave*), quindi è un massimo, almeno locale (*local maximum*). Con $r$ parametri la condizione diventa: la matrice hessiana (*Hessian matrix*) delle derivate seconde è definita negativa (*negative definite*) in $\hat{\boldsymbol{\theta}}$. Per la media gaussiana la derivata seconda vale $-N/\sigma^2$ ovunque: la log-likelihood è una parabola rivolta verso il basso e il massimo è unico e globale. Per modelli più complessi, come le misture di gaussiane, le equazioni di verosimiglianza non hanno soluzione in forma chiusa (*closed form*) e la likelihood ha più massimi locali: si usano metodi iterativi, in particolare l'algoritmo EM. Le note avvertono che risolvere il problema ML può andare «from being straightforward to extremely challenging». Integrazione: la slide su ML non scrive la condizione.`,
    symbols: [
      { s: md`\hat{\theta}`, meaning: md`punto stazionario candidato a stima ML (caso scalare)` },
      { s: md`\frac{\partial^2}{\partial \theta^2}`, meaning: md`derivata seconda rispetto al parametro: misura la curvatura della log-likelihood` },
      { s: md`\left. \cdot \right|_{\theta = \hat{\theta}}`, meaning: md`valutazione nel punto $\theta = \hat{\theta}$` },
    ],
    whenToUse: md`Ultimo passo della ricetta negli esercizi: trovato $\hat{\theta}$, mostra che è un massimo. Basta una riga, ma all'orale fa la differenza.`,
    pitfalls: md`Derivata seconda negativa garantisce un massimo locale, non globale. Se la log-likelihood è concava ovunque, come per la media gaussiana, locale e globale coincidono.`,
    importance: 2,
    blanks: [
      {
        masked: md`\left. \frac{\partial^2 \ln p(\mathbf{X} \mid \theta)}{\partial \theta^2} \right|_{\theta = \hat{\theta}} \boxed{\;?\;} 0`,
        answer: md`<`,
        distractors: [md`>`, md`=`],
      },
    ],
    source: [
      { doc: 'ch2', page: 17 },
      { doc: 'part1', page: 47 },
    ],
  },
  {
    id: 'f-c11-2',
    name: 'Massimo sul bordo: distribuzione uniforme su [0, θ]',
    nameEn: 'Maximum on the boundary: uniform distribution on [0, θ]',
    latex: md`p(\mathbf{X} \mid \theta) = \begin{cases} \theta^{-N} & \theta \geq \max_k x_k \\ 0 & \text{altrimenti} \end{cases} \;\Rightarrow\; \hat{\theta} = \max_k x_k, \quad E\{\hat{\theta}\} = \frac{N}{N+1}\,\theta`,
    explain: md`Un caso in cui la derivata non serve (integrazione). Se i campioni sono uniformi su $[0, \theta]$, ognuno ha densità $1/\theta$ purché $\theta$ sia almeno grande quanto lui; la likelihood è quindi $\theta^{-N}$ se $\theta$ supera il campione più grande e $0$ altrimenti, perché un campione fuori dall'intervallo sarebbe impossibile. Per $\theta \geq \max_k x_k$ la funzione $\theta^{-N}$ è decrescente: il massimo sta sul bordo, nel valore più piccolo ammesso, $\hat{\theta} = \max_k x_k$. Lì la derivata non si annulla ($-N\theta^{-N-1} \neq 0$): le equazioni di verosimiglianza non trovano nulla. La stima è distorta con $N$ finito, perché il massimo dei campioni non supera mai $\theta$ e quindi lo sottostima sempre; ma $\frac{N}{N+1} \to 1$, quindi è asintoticamente non distorta. Esempio: un autobus passa ogni $\theta$ minuti e aspetti 3, 7, 4 e 9 minuti in quattro giorni; la stima ML è $\hat{\theta} = 9$, la versione corretta $\frac{N+1}{N}\hat{\theta} = 11.25$. È anche il controesempio classico alle ipotesi di regolarità del teorema sull'efficienza di ML: il supporto della pdf dipende da $\theta$.`,
    symbols: [
      { s: md`\theta`, meaning: md`estremo destro, incognito, dell'intervallo $[0, \theta]$` },
      { s: md`\theta^{-N}`, meaning: md`prodotto degli $N$ fattori $1/\theta$, uno per campione` },
      { s: md`\max_k x_k`, meaning: md`il campione più grande osservato` },
      { s: md`E\{\hat{\theta}\}`, meaning: md`valore atteso della stima sui possibili dataset di $N$ campioni` },
      { s: md`\frac{N}{N+1}`, meaning: md`fattore di distorsione: minore di 1, tende a 1 per $N \to +\infty$` },
    ],
    whenToUse: md`Come controesempio all'orale: quando il supporto dipende dal parametro la stima ML esiste, ma non viene da «derivata uguale a zero» e le ipotesi di regolarità non valgono.`,
    pitfalls: md`Non derivare $\theta^{-N}$ e porre a zero: l'equazione non ha soluzione. E non dimenticare il vincolo $\theta \geq \max_k x_k$, che rende la likelihood nulla a sinistra del campione più grande.`,
    importance: 2,
    blanks: [
      {
        masked: md`p(\mathbf{X} \mid \theta) = \begin{cases} \theta^{-N} & \theta \geq \max_k x_k \\ 0 & \text{altrimenti} \end{cases} \;\Rightarrow\; \hat{\theta} = \boxed{\;?\;}`,
        answer: md`\max_k x_k`,
        distractors: [md`\frac{2}{N} \sum_{k=1}^{N} x_k`, md`\frac{1}{N} \sum_{k=1}^{N} x_k`, md`\min_k x_k`],
      },
    ],
    source: [
      { doc: 'ch2', page: 17 },
      { doc: 'ch2', page: 19 },
    ],
  },

  // --- c67 Invarianza (integrazione) -------------------------------------------------------------
  {
    id: 'f-c67',
    name: 'Invarianza della stima ML',
    nameEn: 'Invariance property of the ML estimate',
    latex: md`\widehat{g(\theta)} = g(\hat{\theta})`,
    explain: md`Se riparametrizzi il modello (*reparametrization*) con una funzione invertibile $g$, la stima ML del nuovo parametro è $g$ applicata alla vecchia stima. Il motivo sta nella definizione: la stima ML è un $\arg\max$, cioè un punto, e cambiando nome al parametro il massimo della likelihood resta nello stesso punto, solo etichettato in modo diverso. Nella pratica: puoi derivare la log-likelihood gaussiana rispetto a $\sigma^2$ invece che a $\sigma$ e poi prendere $\hat{\sigma} = \sqrt{\hat{\sigma}^2}$; per la distribuzione esponenziale la stima del tasso è l'inverso della media campionaria, $\hat{\lambda} = 1/\hat{m}$. La proprietà non è nella fonte (è un'integrazione), ma negli esercizi si usa di continuo.`,
    symbols: [
      { s: md`g(\cdot)`, meaning: md`riparametrizzazione invertibile, per esempio $\sigma^2 \mapsto \sigma$ oppure media $\mapsto$ tasso` },
      { s: md`\widehat{g(\theta)}`, meaning: md`stima ML del parametro trasformato` },
      { s: md`g(\hat{\theta})`, meaning: md`la trasformazione applicata alla stima ML del parametro originale` },
    ],
    whenToUse: md`Quando conviene derivare rispetto a un parametro più comodo ($\sigma^2$ invece di $\sigma$) e poi tornare a quello richiesto.`,
    pitfalls: md`L'invarianza riguarda il valore della stima, non le sue proprietà: se $\hat{\theta}$ è non distorta, $g(\hat{\theta})$ in generale non lo è. La media campionaria è non distorta per la media, ma $1/\hat{m}$ è distorta per il tasso; e $\sqrt{\hat{\sigma}^2}$ è una stima distorta di $\sigma$.`,
    importance: 1,
    blanks: [],
    source: [{ doc: 'ch2', page: 17 }],
  },

  // --- c12 Esempio: una sola osservazione gaussiana ----------------------------------------------
  {
    id: 'f-c12',
    name: 'Likelihood di una sola osservazione gaussiana',
    nameEn: 'Likelihood of a single Gaussian observation with known variance',
    latex: md`p(\mathbf{X} \mid \boldsymbol{\theta}) = p(x_0 \mid m) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[ -\frac{(x_0 - m)^2}{2\sigma^2} \right]`,
    explain: md`È l'esempio della fonte, la stima ML della media di una gaussiana monodimensionale a varianza nota da una sola osservazione (*ML estimation of the mean of a mono-dimensional Gaussian pdf with known variance basing on a single observation*). È il caso più semplice possibile: un solo parametro incognito ($r = 1$, $\boldsymbol{\theta} = m$) e un solo campione ($N = 1$, $\mathbf{X} = \{x_0\}$). Il prodotto della likelihood ha un unico fattore, quindi la likelihood coincide con la pdf gaussiana valutata nell'osservazione. La varianza nota fissa larghezza e altezza della campana; l'unica libertà è la sua posizione $m$. La slide non scrive questa formula, mostra solo la figura con le campane candidate: è la gaussiana 1-D della galleria dei modelli, riportata per completezza. Con i valori che si leggono sulla figura ($x_0 \approx 1$, $\sigma \approx 1$): per $m = 1$ la likelihood vale $1/\sqrt{2\pi} \approx 0.399$, per $m = 0$ vale $0.242$, per $m = -2$ appena $0.0044$.`,
    symbols: [
      { s: md`x_0`, meaning: md`unica osservazione disponibile` },
      { s: md`m`, meaning: md`media incognita della gaussiana, il parametro da stimare` },
      { s: md`\sigma^2`, meaning: md`varianza nota: fissa larghezza e altezza della campana` },
      { s: md`\frac{1}{\sigma\sqrt{2\pi}}`, meaning: md`costante di normalizzazione: fa integrare a 1 la pdf in $x$ e non dipende da $m$` },
      { s: md`\exp\left[\cdot\right]`, meaning: md`esponenziale: vale 1 quando $m = x_0$ e scende allontanandosi` },
    ],
    whenToUse: md`Per l'esempio da portare all'orale quando spieghi la ricerca ML (*ML search*): si disegna in pochi secondi e porta dritto a $\hat{m} = x_0$.`,
    pitfalls: md`La varianza deve essere nota, e la slide lo precisa (*with known variance*). Con un solo campione e $\sigma$ incognita la likelihood nel punto $m = x_0$ vale $1/(\sigma\sqrt{2\pi})$ e cresce senza limite per $\sigma \to 0$: stringendo la campana sull'unica osservazione il massimo non esiste e la stima degenera.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{X} \mid \boldsymbol{\theta}) = p(x_0 \mid m) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[ -\frac{\boxed{\;?\;}}{2\sigma^2} \right]`,
        answer: md`(x_0 - m)^2`,
        distractors: [md`x_0 - m`, md`(x_0 + m)^2`, md`x_0^2 - m^2`],
      },
      {
        masked: md`p(\mathbf{X} \mid \boldsymbol{\theta}) = p(x_0 \mid m) = \boxed{\;?\;} \exp\left[ -\frac{(x_0 - m)^2}{2\sigma^2} \right]`,
        answer: md`\frac{1}{\sigma\sqrt{2\pi}}`,
        distractors: [md`\frac{1}{\sqrt{2\pi}}`, md`\frac{1}{\sigma^2\sqrt{2\pi}}`, md`\frac{1}{2\pi\sigma}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 18 },
      { doc: 'part1', page: 20 },
    ],
  },

  // --- c15 Risultato dell'esempio ---------------------------------------------------------------
  {
    id: 'f-c15',
    name: "Risultato dell'esempio: la stima coincide con l'osservazione",
    nameEn: 'ML estimate of the mean from a single observation',
    latex: md`\Rightarrow \; \hat{m} = x_0`,
    explain: md`È la conclusione scritta a destra della figura della ricerca ML. Fra tutte le gaussiane candidate, a pari larghezza, quella che assegna la likelihood più alta all'osservazione è la campana centrata esattamente su $x_0$, perché il picco di una gaussiana sta nella sua media. Spostando $m$ a destra o a sinistra di $x_0$, la quota letta sulla verticale tratteggiata scende. In formule: la log-likelihood è $-\ln(\sigma\sqrt{2\pi}) - (x_0 - m)^2/(2\sigma^2)$, la sua derivata rispetto a $m$ è $(x_0 - m)/\sigma^2$ e si annulla solo in $m = x_0$; la derivata seconda $-1/\sigma^2$ è negativa, quindi è un massimo. Con un solo campione la stima ML della media è il campione stesso. È non distorta ($E\{x_0\} = m$) ma ha varianza $\sigma^2$, quella di una singola misura: per ridurla servono più campioni. I passaggi sono nella dimostrazione [«l'esempio della fonte svolto analiticamente»](#derivation:der03).`,
    symbols: [
      { s: md`\hat{m}`, meaning: md`stima ML della media` },
      { s: md`x_0`, meaning: md`l'unica osservazione` },
      { s: md`\Rightarrow`, meaning: md`«ne segue»: la slide lo scrive accanto alla figura come esito della ricerca` },
    ],
    whenToUse: md`All'orale, come chiusura dell'esempio disegnato; poi generalizzi a $N$ campioni con la media campionaria.`,
    pitfalls: md`Il risultato non dipende da $\sigma$: la varianza nota serve a rendere il problema ben posto, non entra nella stima.`,
    importance: 3,
    blanks: [
      {
        masked: md`\Rightarrow \; \hat{m} = \boxed{\;?\;}`,
        answer: md`x_0`,
        distractors: [md`0`, md`\frac{x_0}{2}`, md`x_0 - \sigma`],
      },
    ],
    source: [
      { doc: 'ch2', page: 18 },
      { doc: 'part1', page: 20 },
    ],
  },

  // --- c16 La likelihood in m è una campana ----------------------------------------------------
  {
    id: 'f-c16',
    name: 'Likelihood in funzione della media',
    nameEn: 'Likelihood as a function of the mean',
    latex: md`L(m) = p(x_0 \mid m) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[ -\frac{(m - x_0)^2}{2\sigma^2} \right]`,
    explain: md`Lettura della figura della ricerca ML (integrazione interpretativa). I trattini sulla verticale di $x_0$ sono campioni di una funzione di $m$, la likelihood $L(m) = p(x_0 \mid m)$. Nella gaussiana $x$ e $m$ compaiono solo nel quadrato $(x_0 - m)^2 = (m - x_0)^2$, quindi scambiare i ruoli non cambia la forma: come funzione di $m$, con $x_0$ fissato, la likelihood è a sua volta una campana di larghezza $\sigma$ centrata in $x_0$. Riportando le quote dei trattini sopra le medie candidate della figura (circa $-2$, $-1.5$, $0$, $1$, $1.5$) ricostruisci punto per punto questa campana, con il massimo in $m = x_0$. Con $\sigma = 1$ e $x_0 = 1$ le quote sono circa $0.0044$, $0.0175$, $0.242$, $0.399$, $0.352$. Con $N$ campioni la likelihood in $m$ resta una campana, centrata nella media campionaria e larga $\sigma/\sqrt{N}$: si stringe al crescere di $N$, come la curva $p(\mathbf{X} \mid \theta)$ dell'esempio della likelihood della fonte (dimostrazione [«completamento del quadrato»](#derivation:der15)).`,
    symbols: [
      { s: md`L(m)`, meaning: md`likelihood vista come funzione del parametro $m$, con $x_0$ fissato` },
      { s: md`(m - x_0)^2`, meaning: md`quadrato della distanza tra media candidata e osservazione: simmetrico nei due ruoli` },
      { s: md`\sigma`, meaning: md`deviazione standard nota; è anche la larghezza della campana $L(m)$` },
    ],
    whenToUse: md`Quando all'orale ti chiedono che cosa rappresentano i trattini sulla verticale tratteggiata, o di disegnare la likelihood in funzione del parametro.`,
    pitfalls: md`La simmetria tra $x$ e $m$ è speciale della gaussiana a varianza nota. Per un modello qualunque la likelihood in $\theta$ non ha la forma della pdf in $x$: per la parola «gratis» in 3 email su 10, $\theta^{3}(1-\theta)^{7}$ è una curva su $[0, 1]$, mentre la pdf è una distribuzione su due valori.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 18 },
      { doc: 'ch2', page: 10 },
    ],
  },

  // --- c17 Pdf contro likelihood ----------------------------------------------------------------
  {
    id: 'f-c17',
    name: 'Pdf e likelihood: stessa espressione, ruoli scambiati',
    nameEn: 'Pdf versus likelihood',
    latex: md`\int p(x \mid \theta)\, dx = 1 \qquad \text{mentre in generale} \qquad \int p(\mathbf{X} \mid \theta)\, d\theta \neq 1`,
    explain: md`La stessa espressione $p(x \mid \theta)$ si legge in due modi (integrazione concettuale). Come pdf: $\theta$ è fissato, la variabile è $x$ e l'area sotto la curva vale 1; nella figura della ricerca ML sono le cinque campane colorate, funzioni di $x$. Come likelihood: i dati sono fissati, la variabile è $\theta$, e l'integrale rispetto a $\theta$ in generale non vale 1. La likelihood non è quindi una densità di probabilità su $\theta$: non dice quanto è probabile un valore del parametro, ma quanto quel valore è compatibile con i campioni osservati (*measure of compatibility/agreement*). Per questo nella figura l'asse verticale è etichettato *Likelihood*: le quote che contano sono quelle lette sulla verticale di $x_0$ al variare di $m$. Esempio con lo spam: con la parola «gratis» in 3 email su 10, la likelihood $\theta^3 (1-\theta)^7$ integrata su $\theta \in [0, 1]$ vale $1/1320$, non 1.`,
    symbols: [
      { s: md`p(x \mid \theta) \text{ in } x`, meaning: md`pdf: $\theta$ fissato, variabile $x$, area unitaria` },
      { s: md`p(\mathbf{X} \mid \theta) \text{ in } \theta`, meaning: md`likelihood: dati $\mathbf{X}$ fissati, variabile $\theta$; il suo integrale in $\theta$ in generale non vale 1, quindi non è una densità su $\theta$` },
      { s: md`d\theta`, meaning: md`si integra sul parametro, non sui dati` },
    ],
    whenToUse: md`Risponde alla parte «what the Likelihood describe» della domanda d'orale sulla formula di ML.`,
    pitfalls: md`Per la media gaussiana a varianza nota con un solo campione l'integrale in $m$ vale proprio 1, perché la campana in $m$ è normalizzata: è una coincidenza della simmetria, non una regola. Per avere una vera densità su $\theta$ servono una prior e la regola di Bayes, cioè la stima bayesiana.`,
    importance: 3,
    blanks: [
      {
        masked: md`\int p(x \mid \theta)\, dx = 1 \qquad \text{mentre in generale} \qquad \int p(\mathbf{X} \mid \theta)\, \boxed{\;?\;} \neq 1`,
        answer: md`d\theta`,
        distractors: [md`d\mathbf{X}`, md`dx`],
      },
    ],
    source: [
      { doc: 'ch2', page: 18 },
      { doc: 'part1', page: 20 },
      { doc: 'ch2', page: 9 },
    ],
  },

  // --- c18 Media campionaria come stima ML ------------------------------------------------------
  {
    id: 'f-c18',
    name: 'Stima ML della media gaussiana: la media campionaria',
    nameEn: 'ML estimate of the Gaussian mean: sample mean',
    latex: md`\hat{m} = \frac{1}{N} \sum_{k=1}^{N} x_k`,
    explain: md`Generalizza l'esempio della fonte a $N$ campioni iid di una gaussiana 1-D. La log-likelihood è $-N\ln(\sigma\sqrt{2\pi}) - \frac{1}{2\sigma^2}\sum_k (x_k - m)^2$; la sua derivata rispetto a $m$ è $\frac{1}{\sigma^2}\sum_k (x_k - m)$ e si annulla quando $\sum_k (x_k - \hat{m}) = 0$, cioè nella media campionaria (*sample mean*). Per $N = 1$ ritrovi $\hat{m} = x_0$. La varianza $\sigma^2$ si semplifica e non compare nel risultato: la stima della media non dipende da $\sigma$, e resta la stessa anche quando $\sigma^2$ è incognita. La fonte enuncia il risultato in forma vettoriale nella slide sulla stima ML del modello gaussiano, con un «it can be shown that» senza passaggi: lo sviluppo è un'integrazione, richiesta all'orale («develop the first derivative for a gaussian»). Esempio con il pesce: luminosità di cinque salmoni $4.2$, $5.1$, $3.8$, $4.9$, $4.5$; somma $22.5$, quindi $\hat{m} = 22.5/5 = 4.5$. I passaggi sono nella dimostrazione [«derivata prima per una gaussiana con N campioni»](#derivation:der04).`,
    symbols: [
      { s: md`\hat{m}`, meaning: md`stima ML della media` },
      { s: md`x_k`, meaning: md`$k$-esima osservazione scalare` },
      { s: md`N`, meaning: md`numero di campioni iid` },
      { s: md`\frac{1}{N}\sum_{k=1}^{N}`, meaning: md`media aritmetica sui campioni` },
    ],
    whenToUse: md`È la risposta della domanda d'orale «develop the first derivative for a gaussian and explain the meaning of the result», e il risultato da usare negli esercizi sulla media.`,
    pitfalls: md`È la stima ML perché il modello è gaussiano: con altri modelli la stima ML di un parametro di posizione può essere diversa (con la distribuzione di Laplace è la mediana). E si divide per $N$, non per $N-1$: il fattore $N-1$ riguarda la varianza.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{m} = \boxed{\;?\;} \sum_{k=1}^{N} x_k`,
        answer: md`\frac{1}{N}`,
        distractors: [md`\frac{1}{N-1}`, md`\frac{\sigma^2}{N}`, md`N`],
      },
    ],
    source: [
      { doc: 'ch2', page: 18 },
      { doc: 'ch2', page: 31 },
    ],
  },
  {
    id: 'f-c18-2',
    name: 'Stima ML del vettore medio',
    nameEn: 'ML estimate of the mean vector',
    latex: md`\hat{\mathbf{m}} = \frac{1}{N} \sum_{k=1}^{N} \mathbf{x}_k`,
    explain: md`La stessa stima in forma vettoriale, come la scrive la fonte nella slide sulla stima ML del modello gaussiano multivariato (*it can be shown that the ML estimation of the mean vector … leads to*). Con $N$ campioni iid $\mathbf{x}_k$ di $n$ feature, la stima ML del vettore medio è la media campionaria calcolata componente per componente: la $j$-esima componente di $\hat{\mathbf{m}}$ è la media delle $j$-esime feature dei campioni. Geometricamente è il baricentro della nuvola di punti. Esempio con il pesce: tre salmoni descritti da (luminosità, larghezza) $(3, 10)$, $(4, 12)$, $(5, 11)$ danno $\hat{\mathbf{m}} = (4, 11)$. La stessa slide aggiunge che questa stima è non distorta per ogni $N$: $E\{\hat{\mathbf{m}}\} = \mathbf{m}$.`,
    symbols: [
      { s: md`\hat{\mathbf{m}}`, meaning: md`stima ML del vettore medio, con $n$ componenti` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo campione di training, vettore di $n$ feature` },
      { s: md`N`, meaning: md`numero di campioni iid` },
    ],
    whenToUse: md`Nel modello gaussiano multivariato (gaussiane di classe dei classificatori bayesiani), come primo passo prima di stimare la matrice di covarianza.`,
    pitfalls: md`Si divide per il numero di campioni $N$, non per il numero di feature $n$: la media si fa sui campioni, una feature alla volta.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\mathbf{m}} = \boxed{\;?\;} \sum_{k=1}^{N} \mathbf{x}_k`,
        answer: md`\frac{1}{N}`,
        distractors: [md`\frac{1}{n}`, md`\frac{1}{N-1}`],
      },
      {
        masked: md`\hat{\mathbf{m}} = \frac{1}{N} \sum_{k=1}^{N} \boxed{\;?\;}`,
        answer: md`\mathbf{x}_k`,
        distractors: [md`\mathbf{x}_k \mathbf{x}_k^t`, md`\mathbf{x}_k - \hat{\mathbf{m}}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 31 },
      { doc: 'ch2', page: 18 },
    ],
  },

  // --- c19 Significato del risultato ------------------------------------------------------------
  {
    id: 'f-c19',
    name: 'Somma degli scarti nulla: la media è il baricentro',
    nameEn: 'Sum of residuals equal to zero',
    latex: md`\sum_{k=1}^{N} (x_k - \hat{m}) = 0`,
    explain: md`È l'equazione di verosimiglianza della media gaussiana, dopo aver tolto il fattore comune $1/\sigma^2$ (integrazione, per rispondere a «explain the meaning of the result»). Dice che la stima ML della media è il baricentro (*centroid*) dei campioni: il punto rispetto al quale gli scarti (*residuals*) positivi e negativi si compensano esattamente. Un'immagine fisica: ogni campione tira la media verso di sé con una forza proporzionale a $(x_k - m)/\sigma^2$, come una molla, e la stima ML è il punto di equilibrio, dove le forze si annullano. Con i cinque salmoni ($\hat{m} = 4.5$) gli scarti sono $-0.3$, $0.6$, $-0.7$, $0.4$, $0$ e sommano a zero.`,
    symbols: [
      { s: md`x_k - \hat{m}`, meaning: md`scarto (residuo) del campione $k$-esimo dalla stima` },
      { s: md`\hat{m}`, meaning: md`stima ML della media` },
      { s: md`N`, meaning: md`numero di campioni` },
    ],
    whenToUse: md`All'orale, per spiegare il significato del risultato dopo aver sviluppato la derivata prima.`,
    pitfalls: md`Si annulla la somma degli scarti, non dei loro quadrati: la somma dei quadrati non è mai zero (salvo campioni tutti uguali), è minima.`,
    importance: 3,
    blanks: [
      {
        masked: md`\sum_{k=1}^{N} \boxed{\;?\;} = 0`,
        answer: md`(x_k - \hat{m})`,
        distractors: [md`(x_k - \hat{m})^2`, md`x_k`, md`(x_k + \hat{m})`],
      },
    ],
    source: [{ doc: 'ch2', page: 18 }],
  },
  {
    id: 'f-c19-2',
    name: 'ML gaussiana e minimi quadrati',
    nameEn: 'Gaussian ML equals least squares',
    latex: md`\hat{m} = \arg\max_{m} \ln p(\mathbf{X} \mid m) = \arg\min_{m} \sum_{k=1}^{N} (x_k - m)^2`,
    explain: md`Nella log-likelihood gaussiana, $\ln p(\mathbf{X} \mid m) = -N \ln(\sigma\sqrt{2\pi}) - \frac{1}{2\sigma^2}\sum_k (x_k - m)^2$, il primo termine non dipende da $m$ e il secondo è la somma dei quadrati degli scarti moltiplicata per una costante negativa. Massimizzare la log-likelihood equivale quindi a minimizzare la somma dei quadrati degli scarti: con rumore gaussiano ML coincide con i minimi quadrati (*least squares*). Il passaggio da $\arg\max$ ad $\arg\min$ viene dal segno meno davanti alla somma. È il ponte verso la regressione del resto del corso: la *loss* quadratica è ML con un modello di rumore gaussiano. Integrazione rispetto alla fonte.`,
    symbols: [
      { s: md`\arg\max_{m}`, meaning: md`valore di $m$ che massimizza la log-likelihood` },
      { s: md`\arg\min_{m}`, meaning: md`valore di $m$ che minimizza la somma dei quadrati` },
      { s: md`(x_k - m)^2`, meaning: md`quadrato dello scarto del campione $k$-esimo dalla media candidata` },
      { s: md`\sum_{k=1}^{N} (x_k - m)^2`, meaning: md`somma dei quadrati degli scarti (*sum of squared errors*)` },
    ],
    whenToUse: md`Per collegare ML ai minimi quadrati e alle funzioni di costo quadratiche (regressione lineare, reti neurali con *loss* MSE).`,
    pitfalls: md`L'equivalenza vale con rumore gaussiano di varianza costante. Con altri modelli di rumore ML minimizza altre funzioni di costo: con rumore di Laplace, la somma dei valori assoluti degli scarti.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{m} = \arg\max_{m} \ln p(\mathbf{X} \mid m) = \boxed{\;?\;} \sum_{k=1}^{N} (x_k - m)^2`,
        answer: md`\arg\min_{m}`,
        distractors: [md`\arg\max_{m}`, md`\min_{m}`],
      },
    ],
    source: [{ doc: 'ch2', page: 18 }],
  },
  {
    id: 'f-c19-3',
    name: 'Media e varianza della media campionaria',
    nameEn: 'Mean and variance of the sample mean',
    latex: md`E\{\hat{m}\} = m, \qquad \mathrm{var}\{\hat{m}\} = \frac{\sigma^2}{N}`,
    explain: md`Le due proprietà della media campionaria come stimatore (integrazione). Valore atteso: $E\{\hat{m}\} = \frac{1}{N}\sum_k E\{x_k\} = \frac{1}{N} \cdot N m = m$, quindi è non distorta (*unbiased*) per ogni $N$. Varianza: i campioni sono indipendenti, le varianze si sommano, e $\mathrm{var}\{\hat{m}\} = \frac{1}{N^2} \cdot N\sigma^2 = \sigma^2/N$. Per la gaussiana a varianza nota il bound di Cramér-Rao della media vale proprio $\sigma^2/N$ (l'informazione di Fisher è $N/\sigma^2$): la varianza lo raggiunge, quindi la media campionaria è efficiente. È l'esempio concreto del teorema della slide sulle proprietà di ML: esiste una stima efficiente, la stima ML è non distorta, e infatti la stima efficiente è quella ML. Con i cinque salmoni e una deviazione standard nota $\sigma = 0.5$: $\mathrm{var}\{\hat{m}\} = 0.25/5 = 0.05$, cioè una deviazione standard della stima di circa $0.22$. I passaggi sono nella dimostrazione [«la media campionaria gaussiana è non distorta, efficiente e consistente»](#derivation:der06).`,
    symbols: [
      { s: md`E\{\hat{m}\}`, meaning: md`valore atteso della stima sui possibili dataset di $N$ campioni` },
      { s: md`\mathrm{var}\{\hat{m}\}`, meaning: md`varianza della stima: quanto oscilla da un dataset all'altro` },
      { s: md`m`, meaning: md`media vera` },
      { s: md`\sigma^2`, meaning: md`varianza di un singolo campione` },
      { s: md`N`, meaning: md`numero di campioni: la varianza della stima scende come $1/N$` },
    ],
    whenToUse: md`Per dire che la stima ML della media è buona anche a $N$ finito, non solo asintoticamente, e come esempio del teorema sull'efficienza di ML.`,
    pitfalls: md`La varianza scende come $1/N$, la deviazione standard come $1/\sqrt{N}$: per dimezzare l'incertezza servono quattro volte i campioni.`,
    importance: 3,
    blanks: [
      {
        masked: md`E\{\hat{m}\} = m, \qquad \mathrm{var}\{\hat{m}\} = \boxed{\;?\;}`,
        answer: md`\frac{\sigma^2}{N}`,
        distractors: [md`\sigma^2`, md`\frac{\sigma}{\sqrt{N}}`, md`\frac{\sigma^2}{N-1}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 18 },
      { doc: 'ch2', page: 19 },
      { doc: 'ch2', page: 14 },
    ],
  },

  // --- c20 Bound di Cramér-Rao e stima efficiente -------------------------------------------------
  {
    id: 'f-c20',
    name: 'Bound di Cramér-Rao e stima efficiente',
    nameEn: 'Cramér-Rao bound and efficient estimate',
    latex: md`\mathrm{var}\{\varepsilon_i\} \geq [\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}, \quad i = 1, 2, \ldots, r`,
    explain: md`Richiamo necessario per leggere la slide sulle proprietà di ML, che parla di stima efficiente (*efficient estimate*). Il bound di Cramér-Rao (*Cramér-Rao bound*) è un limite inferiore (*lower bound*) alla varianza dell'errore di qualunque stimatore non distorto (*unbiased*), costruito con l'informazione di Fisher (*Fisher information*): nessuno stimatore non distorto fa meglio di $[\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}$ sul parametro $i$-esimo. Una stima è efficiente se è non distorta e raggiunge il bound con l'uguaglianza per ogni $i$ (la nota della slide: *when the bound is reached, the estimator is said efficient*): è la stima non distorta con la varianza più piccola possibile. Non esiste per ogni problema, perché con $N$ finito il bound può non essere raggiungibile; per questo la slide su ML distingue i due casi, esiste oppure non esiste una stima efficiente. Esempio: per la media gaussiana con $N$ campioni l'informazione di Fisher è $N/\sigma^2$, il bound vale $\sigma^2/N$ e la media campionaria lo raggiunge.`,
    symbols: [
      { s: md`\varepsilon_i`, meaning: md`componente $i$-esima dell'errore di stima $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$` },
      { s: md`\mathrm{var}\{\varepsilon_i\}`, meaning: md`varianza dell'errore sul parametro $i$-esimo` },
      { s: md`\mathrm{I}(\boldsymbol{\theta})`, meaning: md`matrice di informazione di Fisher (*Fisher information matrix*), di elementi $E\{\frac{\partial \ln p(\mathbf{X} \mid \boldsymbol{\theta})}{\partial \theta_i} \cdot \frac{\partial \ln p(\mathbf{X} \mid \boldsymbol{\theta})}{\partial \theta_j}\}$` },
      { s: md`[\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}`, meaning: md`elemento diagonale $i$-esimo dell'inversa della matrice di Fisher: il bound per il parametro $i$` },
      { s: md`r`, meaning: md`numero di parametri` },
    ],
    whenToUse: md`Per definire «stima efficiente» prima di enunciare il teorema sull'efficienza di ML, e nella risposta a «How we can describe the goodness of an estimation».`,
    pitfalls: md`Il bound vale per stimatori non distorti: uno stimatore distorto può stare sotto il bound (una costante ha varianza zero). E si prende l'elemento diagonale dell'inversa, non l'inverso dell'elemento diagonale: in generale $[\mathrm{I}^{-1}]_{ii} \neq 1/[\mathrm{I}]_{ii}$.`,
    importance: 2,
    blanks: [
      {
        masked: md`\mathrm{var}\{\varepsilon_i\} \boxed{\;?\;} [\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}, \quad i = 1, 2, \ldots, r`,
        answer: md`\geq`,
        distractors: [md`\leq`, md`=`],
      },
    ],
    source: [
      { doc: 'ch2', page: 19 },
      { doc: 'part1', page: 20 },
      { doc: 'ch2', page: 14 },
    ],
  },

  // --- c24 Asintoticamente non distorta ----------------------------------------------------------
  {
    id: 'f-c24',
    name: 'ML è asintoticamente non distorta',
    nameEn: 'Asymptotically unbiased',
    latex: md`\lim_{N \to +\infty} E\{\boldsymbol{\varepsilon}\} = \mathbf{0} \;\Rightarrow\; \lim_{N \to +\infty} E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}`,
    explain: md`Prima delle tre proprietà asintotiche di ML (*asymptotically unbiased*, in rosso nella slide). Il valore atteso dell'errore di stima tende a zero al crescere del numero di campioni, quindi il valore atteso della stima tende al parametro vero. Le note: *as the sample size approaches infinity, the ML estimate converges in expectation to the true parameter value*. La definizione è quella della slide sulle proprietà asintotiche, qui applicata a ML. Con $N$ finito la stima ML può invece essere distorta: il bias svanisce solo al crescere di $N$. Esempio: la stima ML della varianza gaussiana ha $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2$; con i cinque salmoni sottostima in media del 20 per cento, con 100 campioni dell'1 per cento, e il fattore tende a 1.`,
    symbols: [
      { s: md`\boldsymbol{\varepsilon}`, meaning: md`errore di stima $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$` },
      { s: md`E\{\boldsymbol{\varepsilon}\}`, meaning: md`bias (distorsione) della stima: il valore medio dell'errore` },
      { s: md`\lim_{N \to +\infty}`, meaning: md`limite al crescere del numero di campioni di training` },
      { s: md`\mathbf{0}`, meaning: md`vettore nullo` },
    ],
    whenToUse: md`Nella risposta a «Is Maximum Likelihood Estimation a good estimator?»: elenca le tre proprietà asintotiche con la formula di ciascuna.`,
    pitfalls: md`«Asintoticamente» non vuol dire «sempre»: con pochi campioni ML può essere distorta (varianza e covarianza gaussiane, estremo della distribuzione uniforme). Il bias è $E\{\boldsymbol{\varepsilon}\}$, non $E\{\lVert \boldsymbol{\varepsilon} \rVert\}$.`,
    importance: 3,
    blanks: [
      {
        masked: md`\lim_{N \to +\infty} \boxed{\;?\;} = \mathbf{0} \;\Rightarrow\; \lim_{N \to +\infty} E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}`,
        answer: md`E\{\boldsymbol{\varepsilon}\}`,
        distractors: [md`\mathrm{var}\{\boldsymbol{\varepsilon}\}`, md`P\{\lVert \boldsymbol{\varepsilon} \rVert < \delta\}`],
      },
      {
        masked: md`\lim_{N \to +\infty} E\{\boldsymbol{\varepsilon}\} = \mathbf{0} \;\Rightarrow\; \lim_{N \to +\infty} E\{\hat{\boldsymbol{\theta}}\} = \boxed{\;?\;}`,
        answer: md`\boldsymbol{\theta}`,
        distractors: [md`\mathbf{0}`, md`\hat{\boldsymbol{\theta}}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 19 },
      { doc: 'part1', page: 21 },
      { doc: 'ch2', page: 15 },
    ],
  },

  // --- c25 Asintoticamente efficiente -------------------------------------------------------------
  {
    id: 'f-c25',
    name: 'ML è asintoticamente efficiente',
    nameEn: 'Asymptotically efficient',
    latex: md`\lim_{N \to +\infty} \frac{\mathrm{var}\{\varepsilon_i\}}{[\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1, \quad i = 1, 2, \ldots, r`,
    explain: md`Seconda proprietà asintotica (*asymptotically efficient*, in rosso nella slide). Il rapporto tra la varianza dell'errore sul parametro $i$-esimo e il corrispondente bound di Cramér-Rao tende a 1 per ogni parametro: al crescere di $N$ la stima ML raggiunge la varianza minima possibile. Le note: *the ML estimate achieves the lowest possible variance among all unbiased estimators as the sample size increases*. Varianza e bound tendono entrambi a zero come $1/N$, quindi la proprietà riguarda il loro rapporto, non la loro differenza. Per la media gaussiana il rapporto vale 1 già per ogni $N$ (la media campionaria è efficiente); per altri modelli si avvicina a 1 solo al crescere di $N$. La definizione è quella della slide sulle proprietà asintotiche, qui applicata a ML.`,
    symbols: [
      { s: md`\mathrm{var}\{\varepsilon_i\}`, meaning: md`varianza dell'errore di stima sul parametro $i$-esimo` },
      { s: md`[\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}`, meaning: md`bound di Cramér-Rao per il parametro $i$-esimo: elemento diagonale dell'inversa della matrice di Fisher` },
      { s: md`r`, meaning: md`numero di parametri: la condizione vale per ciascuno` },
    ],
    whenToUse: md`Seconda voce della risposta a «Is Maximum Likelihood Estimation a good estimator?».`,
    pitfalls: md`Non scrivere la differenza $\mathrm{var}\{\varepsilon_i\} - [\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii} \to 0$: è una condizione debole, perché due quantità che tendono a zero hanno differenza che tende a zero anche se una è il doppio dell'altra. La definizione usa il rapporto che tende a 1.`,
    importance: 3,
    blanks: [
      {
        masked: md`\lim_{N \to +\infty} \frac{\mathrm{var}\{\varepsilon_i\}}{[\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}} = \boxed{\;?\;}, \quad i = 1, 2, \ldots, r`,
        answer: md`1`,
        distractors: [md`0`, md`+\infty`],
      },
      {
        masked: md`\lim_{N \to +\infty} \frac{\mathrm{var}\{\varepsilon_i\}}{\boxed{\;?\;}} = 1, \quad i = 1, 2, \ldots, r`,
        answer: md`[\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}`,
        distractors: [md`[\mathrm{I}(\boldsymbol{\theta})]_{ii}`, md`E\{\varepsilon_i\}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 19 },
      { doc: 'part1', page: 21 },
      { doc: 'ch2', page: 15 },
    ],
  },

  // --- c26 Consistente ----------------------------------------------------------------------------
  {
    id: 'f-c26',
    name: 'ML è consistente',
    nameEn: 'Consistent',
    latex: md`\lim_{N \to +\infty} P\{\lVert \boldsymbol{\varepsilon} \rVert < \delta\} = 1 \qquad \forall \delta > 0`,
    explain: md`Terza proprietà asintotica (*consistent*, in rosso nella slide). Per qualunque tolleranza $\delta > 0$, per quanto piccola, la probabilità che la norma dell'errore di stima sia minore di $\delta$ tende a 1 al crescere di $N$: la stima converge in probabilità (*convergence in probability*) al valore vero. Le note: *as the number of observations grows, the ML estimate converges to the true parameter value*. La slide sulle proprietà asintotiche collega la consistenza a due condizioni: stima asintoticamente non distorta e varianza che tende a zero. ML le soddisfa entrambe, perché il bias svanisce e la varianza si comporta come il bound di Cramér-Rao, che scende come $1/N$. Esempio con la media gaussiana ($\sigma = 1$, $\delta = 0.1$): la probabilità che $\hat{m}$ disti meno di $0.1$ da $m$ è circa $0.25$ con $N = 10$, $0.68$ con $N = 100$, $0.998$ con $N = 1000$.`,
    symbols: [
      { s: md`\lVert \boldsymbol{\varepsilon} \rVert`, meaning: md`norma dell'errore di stima: distanza tra stima e parametro vero` },
      { s: md`\delta`, meaning: md`tolleranza arbitraria positiva sull'errore` },
      { s: md`P\{\cdot\}`, meaning: md`probabilità, calcolata sui possibili dataset di $N$ campioni` },
      { s: md`\forall \delta > 0`, meaning: md`la condizione vale per ogni tolleranza, anche piccolissima` },
    ],
    whenToUse: md`Terza voce della risposta a «Is Maximum Likelihood Estimation a good estimator?»; serve anche a spiegare perché con infiniti campioni ML e stima bayesiana coincidono.`,
    pitfalls: md`La slide chiama «asintoticamente non distorta e varianza che tende a zero» condizione necessaria (*necessary condition*); a rigore è sufficiente (l'errore quadratico medio tende a zero e la disuguaglianza di Chebyshev dà la convergenza in probabilità) e non necessaria: si veda la dimostrazione [«condizione sufficiente, non necessaria, per la consistenza»](#derivation:der16). E consistente non vuol dire non distorta: la stima ML della varianza è distorta ma consistente.`,
    importance: 3,
    blanks: [
      {
        masked: md`\lim_{N \to +\infty} P\{\lVert \boldsymbol{\varepsilon} \rVert < \delta\} = \boxed{\;?\;} \qquad \forall \delta > 0`,
        answer: md`1`,
        distractors: [md`0`, md`\delta`],
      },
      {
        masked: md`\lim_{N \to +\infty} P\{\lVert \boldsymbol{\varepsilon} \rVert \boxed{\;?\;} \delta\} = 1 \qquad \forall \delta > 0`,
        answer: md`<`,
        distractors: [md`>`, md`=`],
      },
    ],
    source: [
      { doc: 'ch2', page: 19 },
      { doc: 'part1', page: 21 },
      { doc: 'ch2', page: 16 },
    ],
  },

  // --- c28 Con N finito ML può essere distorta ----------------------------------------------------
  {
    id: 'f-c28',
    name: 'Stima ML della matrice di covarianza',
    nameEn: 'ML estimate of the covariance matrix',
    latex: md`\hat{\Sigma} = \frac{1}{N} \sum_{k=1}^{N} (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t = \frac{1}{N} \sum_{k=1}^{N} \mathbf{x}_k \mathbf{x}_k^t - \hat{\mathbf{m}}\hat{\mathbf{m}}^t`,
    explain: md`La stima ML della matrice di covarianza di una gaussiana multivariata con $N$ campioni iid, come la scrive la fonte nella slide sulla stima ML del modello gaussiano (*it can be shown that*). È la media dei prodotti esterni (*outer products*) degli scarti dalla media stimata: ogni termine $(\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$ è una matrice $n \times n$ con i quadrati degli scarti di ogni feature sulla diagonale e i prodotti incrociati fuori diagonale. La seconda forma è la versione campionaria di $E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$: media dei prodotti meno prodotto delle medie. Le due forme coincidono perché $\frac{1}{N}\sum_k \mathbf{x}_k = \hat{\mathbf{m}}$. Divide per $N$ e usa $\hat{\mathbf{m}}$ al posto di $\mathbf{m}$: per questo con $N$ finito è distorta. Nel caso 1-D diventa $\hat{\sigma}^2 = \frac{1}{N}\sum_k (x_k - \hat{m})^2$; con i cinque salmoni, quadrati degli scarti $0.09$, $0.36$, $0.49$, $0.16$, $0$, somma $1.10$, dà $\hat{\sigma}^2 = 1.10/5 = 0.22$. I passaggi sono nella dimostrazione [«stima ML della varianza gaussiana e suo bias»](#derivation:der05).`,
    symbols: [
      { s: md`\hat{\Sigma}`, meaning: md`stima ML della matrice di covarianza, $n \times n$` },
      { s: md`\hat{\mathbf{m}}`, meaning: md`stima ML del vettore medio (media campionaria)` },
      { s: md`(\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t`, meaning: md`prodotto esterno dello scarto con sé stesso: matrice $n \times n$ di rango 1` },
      { s: md`(\cdot)^t`, meaning: md`trasposta (la fonte la scrive con la $t$ ad apice)` },
      { s: md`\mathbf{x}_k \mathbf{x}_k^t`, meaning: md`prodotto esterno del campione con sé stesso` },
      { s: md`N`, meaning: md`numero di campioni iid` },
    ],
    whenToUse: md`Per stimare la covarianza delle gaussiane di classe, e all'orale come esempio concreto di stima ML distorta a $N$ finito («Is Maximum Likelihood Estimation a good estimator?»).`,
    pitfalls: md`Il prodotto è esterno, $(\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$ (colonna per riga, una matrice), non interno $(\mathbf{x}_k - \hat{\mathbf{m}})^t(\mathbf{x}_k - \hat{\mathbf{m}})$ (riga per colonna, uno scalare). Nella seconda forma si sottrae $\hat{\mathbf{m}}\hat{\mathbf{m}}^t$, non $\hat{\mathbf{m}}^t\hat{\mathbf{m}}$.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\Sigma} = \frac{1}{N} \sum_{k=1}^{N} \boxed{\;?\;}`,
        answer: md`(\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t`,
        distractors: [md`(\mathbf{x}_k - \hat{\mathbf{m}})^t(\mathbf{x}_k - \hat{\mathbf{m}})`, md`\mathbf{x}_k \mathbf{x}_k^t`],
      },
      {
        masked: md`\hat{\Sigma} = \frac{1}{N} \sum_{k=1}^{N} (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t = \frac{1}{N} \sum_{k=1}^{N} \mathbf{x}_k \mathbf{x}_k^t - \boxed{\;?\;}`,
        answer: md`\hat{\mathbf{m}}\hat{\mathbf{m}}^t`,
        distractors: [md`\hat{\mathbf{m}}^t\hat{\mathbf{m}}`, md`\frac{1}{N}\hat{\mathbf{m}}\hat{\mathbf{m}}^t`, md`\hat{\mathbf{m}}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 31 },
      { doc: 'ch2', page: 19 },
    ],
  },
  {
    id: 'f-c28-2',
    name: 'Valori attesi delle stime ML gaussiane',
    nameEn: 'Expected values of the Gaussian ML estimates',
    latex: md`E\{\hat{\mathbf{m}}\} = \mathbf{m}, \qquad E\{\hat{\Sigma}\} = \frac{N-1}{N} \Sigma`,
    explain: md`La fonte aggiunge (*in addition, we have*) i valori attesi delle due stime ML gaussiane. La media è non distorta per ogni $N$. La covarianza no: in media vale $\frac{N-1}{N}\Sigma$, quindi sottostima sistematicamente la covarianza vera. Il motivo è che gli scarti sono misurati da $\hat{\mathbf{m}}$, calcolata sugli stessi campioni e quindi sempre «al centro» di loro: risultano più piccoli degli scarti dalla media vera $\mathbf{m}$. In termini di gradi di libertà (*degrees of freedom*), stimare la media ne consuma uno e restano $N-1$ scarti indipendenti. Il fattore $\frac{N-1}{N}$ tende a 1 per $N \to +\infty$: la stima è asintoticamente non distorta, come promette la slide sulle proprietà di ML, e la stessa slide gaussiana ribadisce che queste stime sono asintoticamente non distorte, efficienti e consistenti (*asymptotically unbiased and efficient, and consistent*). Numeri: con $N = 2$ la stima ML vale in media metà della covarianza vera, con $N = 5$ l'80 per cento, con $N = 50$ il 98 per cento. Sui cinque salmoni la stima ML ($0.22$) e lo stimatore non distorto ($0.275$) stanno nel rapporto $0.8 = 4/5$: su ogni dataset le due stime differiscono proprio per il fattore $\frac{N-1}{N}$, mentre la sottostima di $\Sigma$ vale in media, non dataset per dataset.`,
    symbols: [
      { s: md`E\{\hat{\mathbf{m}}\}`, meaning: md`valore atteso della stima ML del vettore medio` },
      { s: md`E\{\hat{\Sigma}\}`, meaning: md`valore atteso della stima ML della matrice di covarianza` },
      { s: md`\Sigma`, meaning: md`matrice di covarianza vera` },
      { s: md`\frac{N-1}{N}`, meaning: md`fattore di distorsione: minore di 1, tende a 1 per $N \to +\infty$` },
    ],
    whenToUse: md`È l'argomento per «Is Maximum Likelihood Estimation a good estimator?»: buono asintoticamente, non necessariamente con pochi campioni.`,
    pitfalls: md`Il fattore è $\frac{N-1}{N}$, non $\frac{N}{N-1}$: la stima ML sottostima (fattore minore di 1). Per correggerla si moltiplica per $\frac{N}{N-1}$ e si ottiene lo stimatore con $\frac{1}{N-1}$.`,
    importance: 3,
    blanks: [
      {
        masked: md`E\{\hat{\mathbf{m}}\} = \mathbf{m}, \qquad E\{\hat{\Sigma}\} = \boxed{\;?\;} \Sigma`,
        answer: md`\frac{N-1}{N}`,
        distractors: [md`\frac{N}{N-1}`, md`1`, md`\frac{1}{N}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 31 },
      { doc: 'ch2', page: 19 },
    ],
  },
  {
    id: 'f-c28-3',
    name: 'Stimatore non distorto elementare della covarianza',
    nameEn: 'Elementary unbiased estimator of the covariance',
    latex: md`\hat{\Sigma} = \frac{1}{N-1} \sum_{k=1}^{N} (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t`,
    explain: md`La fonte lo chiama stimatore non distorto elementare (*elementary unbiased estimator*) per $\Sigma$. Si ottiene dalla stima ML moltiplicandola per $\frac{N}{N-1}$, che compensa esattamente il fattore del bias: $E\{\hat{\Sigma}\} = \frac{N}{N-1} \cdot \frac{N-1}{N}\Sigma = \Sigma$. Non è la stima ML, che divide per $N$, ma per $N$ grande le due quasi coincidono. In statistica si chiama correzione di Bessel (*Bessel's correction*). Con i cinque salmoni: somma dei quadrati degli scarti $1.10$, stima ML $1.10/5 = 0.22$, stima non distorta $1.10/4 = 0.275$.`,
    symbols: [
      { s: md`\hat{\Sigma}`, meaning: md`qui è lo stimatore non distorto della covarianza (la slide usa lo stesso simbolo della stima ML)` },
      { s: md`\frac{1}{N-1}`, meaning: md`fattore che annulla la distorsione: $N-1$ sono i gradi di libertà rimasti dopo aver stimato la media` },
      { s: md`\hat{\mathbf{m}}`, meaning: md`media campionaria, calcolata sugli stessi campioni` },
    ],
    whenToUse: md`Quando serve una stima della covarianza senza bias con pochi campioni; all'orale, per mostrare che il bias di ML si corregge facilmente.`,
    pitfalls: md`Non chiamarla stima ML: la stima ML è quella con $\frac{1}{N}$. E il fattore $\frac{1}{N-1}$ serve solo perché la media è stimata: se $\mathbf{m}$ fosse nota, $\frac{1}{N}\sum_k (\mathbf{x}_k - \mathbf{m})(\mathbf{x}_k - \mathbf{m})^t$ sarebbe già non distorta.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\Sigma} = \boxed{\;?\;} \sum_{k=1}^{N} (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t`,
        answer: md`\frac{1}{N-1}`,
        distractors: [md`\frac{1}{N}`, md`\frac{1}{N+1}`, md`\frac{N-1}{N}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 31 },
      { doc: 'ch2', page: 19 },
    ],
  },
]
