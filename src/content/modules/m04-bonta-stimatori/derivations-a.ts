// Derivazioni del foglio m04 (bontà di uno stimatore, bound di Cramér-Rao, proprietà asintotiche): der01-der11 dell'inventario.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più servono a seguire i conti
// che la fonte salta (controllati sulle immagini di ch2 p12-16, ch2 p31 e part1 p17-21) e sono ricalcolati a mano.
// Le derivazioni der12-der22 stanno in derivations-b.ts.
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivationsA: Derivation[] = [
  // --- der01 Da E{ε} = 0 a E{θ̂} = θ ------------------------------------------------------------------
  {
    id: 'der01',
    title: 'Da E{ε} = 0 a E{θ̂} = θ: la freccia della slide e la definizione di bias',
    goal: md`Mostrare perché un errore di stima a media nulla, $E\{\boldsymbol{\varepsilon}\} = \mathbf{0}$, equivale a una stima centrata sul valore vero, $E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$, e riconoscere nel valor medio dell'errore il bias (*bias of an estimation error*). La slide p13 collega le due scritture con una freccia: qui il passaggio per esteso.`,
    assumptions: md`Il vettore dei parametri $\boldsymbol{\theta} = (\theta_1, \dots, \theta_r)$ è fisso ma ignoto (*fixed but unknown*, la visione della stima ML): è una costante, non una variabile aleatoria. Il training set $\mathbf{X} = \{\mathbf{x}_1, \dots, \mathbf{x}_N\}$ è aleatorio con densità $p(\mathbf{X}|\boldsymbol{\theta})$ e la stima $\hat{\boldsymbol{\theta}}(\mathbf{X})$ ha valore atteso finito. $E\{\cdot\}$ è la media su tutti i training set possibili di $N$ campioni, con $\boldsymbol{\theta}$ vero e $N$ fissati.`,
    steps: [
      {
        latex: md`\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\mathbf{X})`,
        why: md`La stima dipende dal vettore delle osservazioni (*the estimate of the vector of parameters depends on the observation vector X*, slide p12). Se cambia il training set cambia anche la stima: $\hat{\boldsymbol{\theta}}$ è un vettore aleatorio (*random vector*, note p18).`,
      },
      {
        latex: md`\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}}(\mathbf{X}) - \boldsymbol{\theta}`,
        why: md`Definizione dell'errore di stima (*estimation error*) di slide p12, che la slide scrive anche $\boldsymbol{\varepsilon}(\mathbf{X}, \boldsymbol{\theta}) = [\hat{\theta}_i - \theta_i : i = 1, 2, \dots, r]$. È aleatorio perché lo è la stima; il valore vero $\boldsymbol{\theta}$ è fisso.`,
      },
      {
        latex: md`E\{\hat{\boldsymbol{\theta}}\} = \int \hat{\boldsymbol{\theta}}(\mathbf{X})\, p(\mathbf{X}|\boldsymbol{\theta})\, d\mathbf{X}, \qquad E\{\boldsymbol{\theta}\} = \boldsymbol{\theta} \int p(\mathbf{X}|\boldsymbol{\theta})\, d\mathbf{X} = \boldsymbol{\theta}`,
        why: md`Che cosa vuol dire il valore atteso, lasciato implicito dalla fonte: si media la stima su tutti i training set, pesati con la loro densità $p(\mathbf{X}|\boldsymbol{\theta})$. Una costante esce dall'integrale e l'integrale di una densità vale 1: il valore atteso di una costante è la costante stessa.`,
      },
      {
        latex: md`E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}} - \boldsymbol{\theta}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}`,
        why: md`Linearità del valore atteso: il valore atteso di una differenza è la differenza dei valori attesi. Per il passo precedente $E\{\boldsymbol{\theta}\} = \boldsymbol{\theta}$, perché il valore vero è una costante deterministica.`,
      },
      {
        latex: md`\text{bias} = E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}`,
        why: md`La slide p13 definisce il bias come valor medio dell'errore di stima (*the bias of an estimation error is its mean value*). Per il passo precedente è la distanza, con segno, tra il centro della nuvola delle stime e il valore vero.`,
      },
      {
        latex: md`E\{\varepsilon_i\} = E\{\hat{\theta}_i\} - \theta_i, \qquad i = 1, 2, \dots, r`,
        why: md`Componente per componente: il valore atteso di un vettore è il vettore dei valori attesi. Il vettore nullo richiede che ogni componente sia nulla, cioè che ogni parametro $\theta_i$ abbia il proprio errore a media nulla, come chiede la stima ideale di slide p12.`,
      },
      {
        latex: md`E\{\boldsymbol{\varepsilon}\} = \mathbf{0} \iff E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}`,
        why: md`Si pone il bias uguale al vettore nullo e si porta $\boldsymbol{\theta}$ a destra; il passaggio si inverte, quindi vale nei due versi. La freccia della slide va letta «ossia»: nel livello di testo del PDF, sotto la freccia, c'è proprio questa parola. È la definizione di stima non polarizzata (*unbiased*): mediando su tutti i training set, la stima dà il valore vero.`,
      },
      {
        latex: md`E\{\hat{m}\} = E\left\{ \frac{1}{N} \sum_{k=1}^{N} x_k \right\} = \frac{1}{N} \sum_{k=1}^{N} E\{x_k\} = \frac{1}{N} \cdot N m = m`,
        why: md`Esempio: la media campionaria (*sample mean*) di $N$ campioni con media $m$ è non polarizzata per ogni $N$, per la sola linearità del valore atteso. Un esempio polarizzato è la stima ML della varianza, con bias $-\sigma^2/N$ ([«la stima ML della varianza è biased ma asintoticamente buona»](#derivation:der11)).`,
      },
    ],
    conclusion: md`Il bias è $E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}$ e la stima è non polarizzata (*unbiased*) se e solo se $E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$: le due scritture di slide p13 sono la stessa condizione. «Unbiased» non vuol dire che una singola stima sia giusta: vuol dire che le stime, al variare del training set, sono centrate sul vero. Lo stesso passaggio con $\lim_{N \to +\infty}$ davanti dà la stima asintoticamente non polarizzata di slide p15.`,
    source: [{ doc: 'ch2', page: 12 }, { doc: 'ch2', page: 13 }, { doc: 'part1', page: 18 }],
  },

  // --- der02 var{ε_i} = var{θ̂_i} ---------------------------------------------------------------------
  {
    id: 'der02',
    title: 'Perché nella varianza compare la media della stima: var{ε_i} = var{θ̂_i}',
    goal: md`Giustificare la formula di slide p13, $\operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \bar{\hat{\theta}}_i)^2\}$, in cui lo scarto è preso rispetto al valor medio della stima ($\hat{\theta}_i$ con la barra) e non rispetto al valore vero $\theta_i$.`,
    assumptions: md`Come nella [«freccia della slide e definizione di bias»](#derivation:der01): $\theta_i$ fisso, stima $\hat{\theta}_i(\mathbf{X})$ aleatoria con varianza finita, valori attesi sui training set. La slide guarda un parametro alla volta ($i = 1, 2, \dots, r$): la varianza di ogni componente, non la matrice di covarianza dell'intero vettore.`,
    steps: [
      {
        latex: md`\operatorname{var}\{\varepsilon_i\} = E\{(\varepsilon_i - E\{\varepsilon_i\})^2\}`,
        why: md`Definizione generale di varianza (*variance*) di una variabile aleatoria: valore atteso del quadrato dello scarto dalla propria media. Qui la variabile è l'errore di stima $\varepsilon_i = \hat{\theta}_i - \theta_i$ (*variance of the estimation error*).`,
      },
      {
        latex: md`E\{\varepsilon_i\} = E\{\hat{\theta}_i\} - \theta_i`,
        why: md`Media dell'errore, cioè il bias della componente $i$ ([«freccia della slide e definizione di bias»](#derivation:der01)).`,
      },
      {
        latex: md`\varepsilon_i - E\{\varepsilon_i\} = (\hat{\theta}_i - \theta_i) - (E\{\hat{\theta}_i\} - \theta_i) = \hat{\theta}_i - \bar{\hat{\theta}}_i, \qquad \bar{\hat{\theta}}_i = E\{\hat{\theta}_i\}`,
        why: md`Si sostituiscono l'errore e la sua media: $\theta_i$ compare con segni opposti e si cancella. Sottrarre una costante sposta una variabile aleatoria ma non ne cambia la dispersione. Resta lo scarto della stima dalla sua media, che la slide scrive $\bar{\hat{\theta}}_i$.`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \bar{\hat{\theta}}_i)^2\} = \operatorname{var}\{\hat{\theta}_i\}`,
        why: md`Si sostituisce nella definizione: è esattamente la formula di slide p13 (e note p19). La varianza dell'errore è la varianza della stima: misura quanto le stime si sparpagliano attorno al loro centro, non attorno al vero.`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon_i\} = E\{\varepsilon_i^2\} - (E\{\varepsilon_i\})^2`,
        why: md`Forma equivalente, sviluppando il quadrato del primo passo: $E\{\varepsilon_i^2\} - 2E\{\varepsilon_i\}\,E\{\varepsilon_i\} + (E\{\varepsilon_i\})^2$. Varianza ed errore quadratico medio differiscono esattamente per il quadrato del bias ([«errore quadratico medio = varianza + bias²»](#derivation:der03)).`,
      },
      {
        latex: md`E\{\hat{\theta}_i\} = \theta_i \;\Longrightarrow\; \operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \theta_i)^2\} = E\{\varepsilon_i^2\}`,
        why: md`Solo se lo stimatore è non polarizzato la media della stima coincide con il vero ($\bar{\hat{\theta}}_i = \theta_i$) e la varianza coincide con l'errore quadratico medio. Se c'è bias, $E\{\varepsilon_i^2\}$ è più grande della varianza.`,
      },
      {
        latex: md`\hat{\theta} = \hat{m} + 1: \qquad \operatorname{var}\{\varepsilon\} = \operatorname{var}\{\hat{m}\} = \frac{\sigma^2}{N}, \qquad E\{\varepsilon^2\} = \frac{\sigma^2}{N} + 1`,
        why: md`Esempio: si stima la media $m$ con la media campionaria più 1. La costante non cambia la varianza, $\sigma^2/N$ come per la media campionaria ([«bound per la media di una gaussiana»](#derivation:der05)), ma introduce un bias pari a 1 che la varianza non vede. Per questo la varianza da sola non basta a giudicare uno stimatore: va letta insieme al bias.`,
      },
    ],
    conclusion: md`La varianza dell'errore di stima è la varianza della stima attorno alla propria media: $\operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \bar{\hat{\theta}}_i)^2\} = \operatorname{var}\{\hat{\theta}_i\}$. Misura la dispersione, non la distanza dal vero, e coincide con l'errore quadratico medio solo per stimatori non polarizzati. Per dire se questa varianza è piccola serve un riferimento: il bound di Cramér-Rao (slide p13).`,
    source: [{ doc: 'ch2', page: 13 }, { doc: 'part1', page: 18 }, { doc: 'part1', page: 19 }],
  },

  // --- der03 MSE = varianza + bias² ---------------------------------------------------------------------
  {
    id: 'der03',
    title: 'Errore quadratico medio = varianza + bias²',
    goal: md`Mostrare perché la stima ideale di slide p12 chiede insieme errore non polarizzato e varianza nulla: l'errore quadratico medio (*mean squared error*, MSE) è la somma della varianza e del quadrato del bias. Integrazione: la scomposizione non è nelle slide, è il passaggio logico che lega le due condizioni.`,
    assumptions: md`Parametro $\theta_i$ fisso, stima $\hat{\theta}_i$ con varianza finita e media $\bar{\hat{\theta}}_i = E\{\hat{\theta}_i\}$; valori attesi sui training set.`,
    steps: [
      {
        latex: md`E\{\varepsilon_i^2\} = E\{(\hat{\theta}_i - \theta_i)^2\}`,
        why: md`Si misura l'errore complessivo con il valore atteso del quadrato dell'errore, che pesa allo stesso modo errori per eccesso e per difetto.`,
      },
      {
        latex: md`\hat{\theta}_i - \theta_i = (\hat{\theta}_i - \bar{\hat{\theta}}_i) + (\bar{\hat{\theta}}_i - \theta_i)`,
        why: md`Si aggiunge e si toglie la media della stima. Il primo addendo è la fluttuazione casuale della stima attorno al suo centro; il secondo è il bias, una costante che non dipende dal training set.`,
      },
      {
        latex: md`(\hat{\theta}_i - \theta_i)^2 = (\hat{\theta}_i - \bar{\hat{\theta}}_i)^2 + 2(\hat{\theta}_i - \bar{\hat{\theta}}_i)(\bar{\hat{\theta}}_i - \theta_i) + (\bar{\hat{\theta}}_i - \theta_i)^2`,
        why: md`Quadrato di un binomio, $(a + b)^2 = a^2 + 2ab + b^2$, con $a$ la fluttuazione e $b$ il bias.`,
      },
      {
        latex: md`E\{\varepsilon_i^2\} = E\{(\hat{\theta}_i - \bar{\hat{\theta}}_i)^2\} + 2(\bar{\hat{\theta}}_i - \theta_i)\,E\{\hat{\theta}_i - \bar{\hat{\theta}}_i\} + (\bar{\hat{\theta}}_i - \theta_i)^2`,
        why: md`Valore atteso dei due membri e linearità. Il bias è una costante: nel doppio prodotto esce dal valore atteso, e il valore atteso del suo quadrato è il quadrato stesso.`,
      },
      {
        latex: md`E\{\hat{\theta}_i - \bar{\hat{\theta}}_i\} = E\{\hat{\theta}_i\} - \bar{\hat{\theta}}_i = 0`,
        why: md`Lo scarto di una variabile dalla propria media ha valore atteso nullo: il doppio prodotto sparisce.`,
      },
      {
        latex: md`E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + (E\{\varepsilon_i\})^2`,
        why: md`Il primo addendo rimasto è la varianza dell'errore di slide p13 ([«la varianza dell'errore è la varianza della stima»](#derivation:der02)); l'ultimo è il quadrato del bias, perché $E\{\varepsilon_i\} = \bar{\hat{\theta}}_i - \theta_i$.`,
      },
      {
        latex: md`E\{\|\boldsymbol{\varepsilon}\|^2\} = \sum_{i=1}^{r} E\{\varepsilon_i^2\} = \sum_{i=1}^{r} \operatorname{var}\{\varepsilon_i\} + \|E\{\boldsymbol{\varepsilon}\}\|^2`,
        why: md`Per l'intero vettore dei parametri si sommano le $r$ componenti: la norma al quadrato è la somma dei quadrati. Questa forma serve per la consistenza ([«bias e varianza che tendono a zero danno la consistenza»](#derivation:der07)).`,
      },
      {
        latex: md`E\{\varepsilon_i\} = 0 \;\text{e}\; \operatorname{var}\{\varepsilon_i\} = 0 \;\iff\; E\{\varepsilon_i^2\} = 0`,
        why: md`Varianza e bias al quadrato sono due addendi non negativi: la loro somma è zero se e solo se lo sono entrambi. L'errore complessivo si annulla soltanto con le due condizioni della stima ideale insieme; una sola non basta.`,
      },
      {
        latex: md`\hat{\theta}_i = c: \qquad \operatorname{var}\{\varepsilon_i\} = 0, \qquad E\{\varepsilon_i^2\} = (c - \theta_i)^2`,
        why: md`Controesempio: uno stimatore costante, che ignora i dati, ha varianza zero ma il suo errore è tutto bias, grande quanto la distanza di $c$ dal vero. All'opposto la media campionaria ha bias zero ed errore quadratico medio $\sigma^2/N$, tutto varianza. In pratica le due condizioni sono difficili da ottenere insieme e servono da riferimento (*fundamental benchmarks*, note p18).`,
      },
    ],
    conclusion: md`$E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + (E\{\varepsilon_i\})^2$: l'errore quadratico medio è varianza più bias al quadrato. La stima ideale di slide p12 ($E\{\varepsilon_i\} = 0$ e $\operatorname{var}\{\varepsilon_i\} = 0$) è esattamente la stima con errore quadratico medio nullo. Attenzione all'omonimia: questa coppia bias/varianza riguarda la stima di un parametro; nella scomposizione dell'errore di generalizzazione «estimation error» indica un'altra cosa.`,
    source: [{ doc: 'ch2', page: 12 }, { doc: 'ch2', page: 13 }, { doc: 'part1', page: 18 }],
  },

  // --- der04 Matrice di Fisher: forma compatta ed elemento (i, j) ----------------------------------------
  {
    id: 'der04',
    title: 'Dalla forma compatta della matrice di Fisher alla definizione elemento per elemento',
    goal: md`Collegare le due scritture della matrice di informazione di Fisher (*Fisher information matrix*) di slide p14, la forma compatta con il gradiente e la definizione dell'elemento $(i, j)$, e ricavarne le proprietà strutturali: dimensione $r \times r$, simmetria, diagonale non negativa, matrice semidefinita positiva, somma sui campioni.`,
    assumptions: md`Modello $p(\mathbf{X}|\boldsymbol{\theta})$ con $r$ parametri $\boldsymbol{\theta} = (\theta_1, \dots, \theta_r)$, positivo e derivabile rispetto a ogni $\theta_i$. Il valore atteso è sui training set distribuiti come $p(\mathbf{X}|\boldsymbol{\theta})$, con lo stesso $\boldsymbol{\theta}$ in cui si calcolano le derivate. Nell'ultimo passo, campioni iid.`,
    steps: [
      {
        latex: md`\mathbf{I}(\boldsymbol{\theta}) = E\left\{ \nabla_{\boldsymbol{\theta}} \ln[p(\mathbf{X}|\boldsymbol{\theta})]\, \nabla_{\boldsymbol{\theta}} \ln[p(\mathbf{X}|\boldsymbol{\theta})]^{t} \right\}`,
        why: md`Forma compatta di slide p14 (e note p19): valore atteso del prodotto tra il gradiente della log-likelihood e il suo trasposto.`,
      },
      {
        latex: md`\nabla_{\boldsymbol{\theta}} \ln p(\mathbf{X}|\boldsymbol{\theta}) = \left[ \frac{\partial \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_1}, \ldots, \frac{\partial \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_r} \right]^{t}`,
        why: md`Il gradiente rispetto a $\boldsymbol{\theta}$ è il vettore colonna $r \times 1$ delle derivate parziali della log-likelihood; l'apice $t$ indica la trasposizione. Ogni componente dice quanto cresce la log-likelihood muovendo un solo parametro.`,
      },
      {
        latex: md`\nabla_{\boldsymbol{\theta}} \ln p\,(\nabla_{\boldsymbol{\theta}} \ln p)^{t} = \begin{bmatrix} \left( \frac{\partial \ln p}{\partial \theta_1} \right)^2 & \cdots & \frac{\partial \ln p}{\partial \theta_1} \frac{\partial \ln p}{\partial \theta_r} \\ \vdots & \ddots & \vdots \\ \frac{\partial \ln p}{\partial \theta_r} \frac{\partial \ln p}{\partial \theta_1} & \cdots & \left( \frac{\partial \ln p}{\partial \theta_r} \right)^2 \end{bmatrix}`,
        why: md`Colonna ($r \times 1$) per riga ($1 \times r$): il prodotto esterno (*outer product*) è una matrice $r \times r$, non un numero. Per brevità $\ln p$ sta per $\ln p(\mathbf{X}|\boldsymbol{\theta})$.`,
      },
      {
        latex: md`\left[ \nabla_{\boldsymbol{\theta}} \ln p \,(\nabla_{\boldsymbol{\theta}} \ln p)^{t} \right]_{ij} = \frac{\partial \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_i} \cdot \frac{\partial \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_j}`,
        why: md`L'elemento $(i, j)$ del prodotto esterno è il prodotto della componente $i$ per la componente $j$ del gradiente.`,
      },
      {
        latex: md`E\{\mathbf{A}\}_{ij} = E\{A_{ij}\} = \int A_{ij}(\mathbf{X})\, p(\mathbf{X}|\boldsymbol{\theta})\, d\mathbf{X}`,
        why: md`Il valore atteso di una matrice aleatoria $\mathbf{A}$ si calcola elemento per elemento.`,
      },
      {
        latex: md`[\mathbf{I}(\boldsymbol{\theta})]_{ij} = E\left\{ \frac{\partial \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_i} \cdot \frac{\partial \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_j} \right\}`,
        why: md`Si applica il passo precedente al prodotto esterno: si ottiene la seconda formula di slide p14, la definizione elemento per elemento.`,
      },
      {
        latex: md`[\mathbf{I}(\boldsymbol{\theta})]_{ij} = [\mathbf{I}(\boldsymbol{\theta})]_{ji}, \qquad [\mathbf{I}(\boldsymbol{\theta})]_{ii} = E\left\{ \left( \frac{\partial \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_i} \right)^2 \right\} \geq 0`,
        why: md`Il prodotto di due numeri è commutativo, quindi scambiare $i$ e $j$ non cambia nulla: la matrice è simmetrica. Sulla diagonale ($i = j$) ci sono valori attesi di quadrati, quindi numeri non negativi.`,
      },
      {
        latex: md`\mathbf{a}^{t}\, \mathbf{I}(\boldsymbol{\theta})\, \mathbf{a} = E\left\{ \left( \mathbf{a}^{t} \nabla_{\boldsymbol{\theta}} \ln p(\mathbf{X}|\boldsymbol{\theta}) \right)^2 \right\} \geq 0 \qquad \forall \mathbf{a} \in \Re^r`,
        why: md`Più in generale la matrice è semidefinita positiva: $\mathbf{a}^t \nabla_{\boldsymbol{\theta}} \ln p$ è un numero e $\mathbf{a}^t (\nabla_{\boldsymbol{\theta}} \ln p)(\nabla_{\boldsymbol{\theta}} \ln p)^t \mathbf{a}$ è il suo quadrato. Il bound usa l'inversa $\mathbf{I}^{-1}(\boldsymbol{\theta})$, che esiste quando la matrice è definita positiva, cioè quando nessuna direzione dei parametri è priva di informazione. Un parametro che non entra nel modello darebbe una riga e una colonna di zeri, e la matrice non sarebbe invertibile.`,
      },
      {
        latex: md`\ln p(\mathbf{X}|\boldsymbol{\theta}) = \sum_{k=1}^{N} \ln p(\mathbf{x}_k|\boldsymbol{\theta}) \;\Longrightarrow\; \nabla_{\boldsymbol{\theta}} \ln p(\mathbf{X}|\boldsymbol{\theta}) = \sum_{k=1}^{N} \nabla_{\boldsymbol{\theta}} \ln p(\mathbf{x}_k|\boldsymbol{\theta})`,
        why: md`Con campioni iid la likelihood è un prodotto (note p17), il logaritmo lo trasforma in somma e il gradiente si calcola campione per campione: è il punto di partenza di tutti i calcoli pratici del bound. Sviluppando il prodotto esterno di questa somma, i termini misti tra campioni diversi hanno media nulla e la matrice di $N$ campioni è $N$ volte quella di un campione ([«l'informazione di Fisher cresce come N»](#derivation:der06)).`,
      },
    ],
    conclusion: md`$[\mathbf{I}(\boldsymbol{\theta})]_{ij} = E\left\{ \frac{\partial \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_i} \cdot \frac{\partial \ln p(\mathbf{X}|\boldsymbol{\theta})}{\partial \theta_j} \right\}$ è l'elemento $(i, j)$ della forma compatta. La matrice è $r \times r$, simmetrica, con diagonale non negativa e semidefinita positiva. Il bound di Cramér-Rao usa l'elemento diagonale dell'inversa, $[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}$, che con parametri accoppiati è diverso da $1/[\mathbf{I}(\boldsymbol{\theta})]_{ii}$ ([«perché il bound usa la diagonale dell'inversa»](#derivation:der14)).`,
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 17 }, { doc: 'part1', page: 19 }],
  },

  // --- der05 Bound per la media di una gaussiana ----------------------------------------------------------
  {
    id: 'der05',
    title: 'Bound di Cramér-Rao per la media di una gaussiana ed efficienza della media campionaria',
    goal: md`Applicare le formule di slide p14 al caso più semplice, un solo parametro ($r = 1$): ricavare il bound $\sigma^2/N$ per la media di una gaussiana e verificare che la media campionaria lo raggiunge, cioè è uno stimatore efficiente (*efficient estimator*). Integrazione: l'esempio non è nelle slide.`,
    assumptions: md`$N$ campioni $x_1, \dots, x_N$ iid da una gaussiana monodimensionale con media $m$ incognita e varianza $\sigma^2$ nota. Unico parametro $\theta = m$: la matrice di Fisher è un numero.`,
    steps: [
      {
        latex: md`p(x_k|m) = \frac{1}{\sqrt{2\pi}\,\sigma} \exp\left( -\frac{(x_k - m)^2}{2\sigma^2} \right), \qquad \theta = m, \; \sigma \text{ nota}`,
        why: md`Modello gaussiano monodimensionale con un solo parametro incognito, la media.`,
      },
      {
        latex: md`p(\mathbf{X}|m) = \prod_{k=1}^{N} p(x_k|m) = \frac{1}{(2\pi\sigma^2)^{N/2}} \exp\left( -\frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - m)^2 \right)`,
        why: md`Campioni iid: la likelihood è il prodotto delle densità (note p17). Il prodotto di $N$ fattori $1/(\sqrt{2\pi}\,\sigma)$ dà $(2\pi\sigma^2)^{-N/2}$; il prodotto di esponenziali è l'esponenziale della somma degli esponenti.`,
      },
      {
        latex: md`\ln p(\mathbf{X}|m) = \sum_{k=1}^{N} \ln p(x_k|m) = -\frac{N}{2} \ln(2\pi\sigma^2) - \frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - m)^2`,
        why: md`Il logaritmo trasforma il prodotto in somma: $\ln (2\pi\sigma^2)^{-N/2} = -\frac{N}{2}\ln(2\pi\sigma^2)$, e il logaritmo di un esponenziale è il suo argomento.`,
      },
      {
        latex: md`\frac{\partial}{\partial m}\left[ -\frac{(x_k - m)^2}{2\sigma^2} \right] = -\frac{2(x_k - m)\cdot(-1)}{2\sigma^2} = \frac{x_k - m}{\sigma^2}`,
        why: md`Derivata di un addendo con la regola della catena: la derivata interna di $x_k - m$ rispetto a $m$ vale $-1$. Il termine $-\frac{N}{2}\ln(2\pi\sigma^2)$ non dipende da $m$ e sparisce.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{X}|m)}{\partial m} = \frac{1}{\sigma^2} \sum_{k=1}^{N} (x_k - m)`,
        why: md`Somma delle derivate dei singoli addendi. È la derivata della log-likelihood rispetto al parametro (lo *score*), la quantità che compare dentro la matrice di Fisher.`,
      },
      {
        latex: md`E\{(x_k - m)(x_l - m)\} = \begin{cases} \sigma^2, & k = l \\ E\{x_k - m\}\, E\{x_l - m\} = 0, & k \neq l \end{cases}`,
        why: md`Il valore atteso che serve nel passo successivo. Con $k = l$ è la varianza di un campione. Con $k \neq l$ i campioni sono indipendenti: il valore atteso del prodotto è il prodotto dei valori attesi, ognuno nullo.`,
      },
      {
        latex: md`I(m) = E\left\{ \left( \frac{1}{\sigma^2} \sum_{k=1}^{N} (x_k - m) \right)^2 \right\} = \frac{1}{\sigma^4} \sum_{k=1}^{N} \sum_{l=1}^{N} E\{(x_k - m)(x_l - m)\} = \frac{N\sigma^2}{\sigma^4} = \frac{N}{\sigma^2}`,
        why: md`Definizione di slide p14 con $i = j$ e $r = 1$: valore atteso del quadrato dello score. Il quadrato della somma è la doppia somma dei prodotti; per il passo precedente restano solo gli $N$ termini con $k = l$, ognuno uguale a $\sigma^2$.`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon\} \geq I^{-1}(m) = \frac{\sigma^2}{N}`,
        why: md`Con $r = 1$ l'inversa della matrice di Fisher è il reciproco del numero $I(m)$. Il bound scende come $1/N$ e cresce con il rumore $\sigma^2$.`,
      },
      {
        latex: md`\hat{m} = \frac{1}{N} \sum_{k=1}^{N} x_k: \qquad E\{\hat{m}\} = m, \qquad \operatorname{var}\{\hat{m}\} = \frac{1}{N^2} \sum_{k=1}^{N} \sigma^2 = \frac{\sigma^2}{N}`,
        why: md`La media campionaria è non polarizzata per la linearità del valore atteso. Per la varianza: $\operatorname{var}\{aY\} = a^2 \operatorname{var}\{Y\}$ con $a = 1/N$ e, per variabili indipendenti, la varianza della somma è la somma delle varianze.`,
      },
      {
        latex: md`\frac{\operatorname{var}\{\hat{m}\}}{I^{-1}(m)} = \frac{\sigma^2/N}{\sigma^2/N} = 1`,
        why: md`La varianza della media campionaria coincide con il bound per ogni $N$: il bound è raggiunto e lo stimatore è efficiente (*when the bound is reached, the estimator is said efficient*, nota a margine di slide p14). Nessuno stimatore non polarizzato di $m$ fa meglio.`,
      },
      {
        latex: md`\sum_{k=1}^{N} (x_k - m) = 0 \iff \sum_{k=1}^{N} x_k - N m = 0`,
        why: md`Si annulla lo score: il fattore $1/\sigma^2$ è positivo e si può togliere, e la somma di $N$ volte $m$ è $Nm$.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{X}|m)}{\partial m} = 0 \;\Longrightarrow\; \hat{m}_{ML} = \frac{1}{N} \sum_{k=1}^{N} x_k`,
        why: md`Si risolve rispetto a $m$: la stima a massima verosimiglianza è proprio la media campionaria. La derivata seconda vale $-N/\sigma^2 < 0$, quindi è un massimo. È un caso concreto dell'enunciato delle note (p20): se esiste uno stimatore efficiente e la stima ML è non polarizzata, la stima ML è quello efficiente.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{X}|m)}{\partial m} = \frac{1}{\sigma^2}\left( \sum_{k=1}^{N} x_k - N m \right) = \frac{N}{\sigma^2}\,(\hat{m} - m) = I(m)\,(\hat{m} - m)`,
        why: md`Lo score si riscrive come informazione di Fisher per (stima meno vero), perché $\sum_k x_k = N\hat{m}$. È la forma che rende possibile l'uguaglianza nel bound ([«schizzo della dimostrazione del bound»](#derivation:der09)): quando lo score ha questa forma, lo stimatore che vi compare è efficiente.`,
      },
    ],
    conclusion: md`Per la media di una gaussiana con varianza nota $I(m) = N/\sigma^2$ e il bound vale $\sigma^2/N$. La media campionaria, che è anche la stima ML, è non polarizzata e ha varianza esattamente $\sigma^2/N$: è efficiente. Con $\sigma = 2$ e $N = 16$ nessuno stimatore non polarizzato ha deviazione standard sotto $\sqrt{4/16} = 0.5$; per dimezzarla servono quattro volte i campioni, $N = 64$.`,
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 17 }, { doc: 'part1', page: 19 }, { doc: 'part1', page: 20 }],
  },

  // --- der06 I_N = N I_1 ----------------------------------------------------------------------------------
  {
    id: 'der06',
    title: "Con campioni iid l'informazione di Fisher cresce come N e il bound scende come 1/N",
    goal: md`Spiegare perché più campioni vogliono dire più informazione e un bound più basso: con campioni iid l'informazione di $N$ campioni è $N$ volte quella di un campione, $I_N(\theta) = N\, I_1(\theta)$. Integrazione: il risultato non è nelle slide, ma spiega il fattore $1/N$ di tutti i bound del modulo.`,
    assumptions: md`Campioni $x_1, \dots, x_N$ indipendenti e identicamente distribuiti con densità $p(x|\theta)$. Condizioni di regolarità: $p(x|\theta)$ derivabile in $\theta$, supporto che non dipende da $\theta$, derivata e integrale scambiabili (le «certe ipotesi» su $p(\mathbf{x}|\boldsymbol{\theta})$ a cui alludono le note, p20). I valori attesi si calcolano nello stesso $\theta$ in cui si deriva.`,
    steps: [
      {
        latex: md`\ln p(\mathbf{X}|\theta) = \sum_{k=1}^{N} \ln p(x_k|\theta), \qquad s_k = \frac{\partial \ln p(x_k|\theta)}{\partial \theta}`,
        why: md`Dalla likelihood prodotto delle note (p17): la log-likelihood totale è la somma dei contributi dei singoli campioni. $s_k$ è lo *score* del campione $k$, la derivata del suo logaritmo.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} = \sum_{k=1}^{N} s_k`,
        why: md`La derivata di una somma è la somma delle derivate: lo score totale è la somma degli score dei campioni.`,
      },
      {
        latex: md`\frac{\partial \ln p(x|\theta)}{\partial \theta} = \frac{1}{p(x|\theta)}\, \frac{\partial p(x|\theta)}{\partial \theta}`,
        why: md`Derivata del logaritmo con la regola della catena (derivata logaritmica). Moltiplicata per $p(x|\theta)$ restituisce la derivata della densità: è il trucco del passo successivo.`,
      },
      {
        latex: md`E\{s_k\} = \int \frac{\partial \ln p(x|\theta)}{\partial \theta}\, p(x|\theta)\, dx = \int \frac{\partial p(x|\theta)}{\partial \theta}\, dx = \frac{\partial}{\partial \theta} \int p(x|\theta)\, dx = 0`,
        why: md`Valore atteso dello score: nell'integrale la densità si semplifica grazie al passo precedente. Per le condizioni di regolarità la derivata esce dall'integrale; l'integrale di una densità vale 1 per ogni $\theta$ e la derivata di una costante è zero. Ogni score ha media nulla.`,
      },
      {
        latex: md`\left( \sum_{k=1}^{N} s_k \right)^2 = \sum_{k=1}^{N} s_k^2 + \sum_{k \neq l} s_k\, s_l`,
        why: md`Quadrato di una somma: i termini con lo stesso indice più tutti i prodotti tra indici diversi.`,
      },
      {
        latex: md`I_1(\theta) = E\{s_k^2\} = E\left\{ \left( \frac{\partial \ln p(x|\theta)}{\partial \theta} \right)^2 \right\}`,
        why: md`Informazione di Fisher di un solo campione. È la stessa per ogni $k$ perché i campioni sono identicamente distribuiti.`,
      },
      {
        latex: md`I_N(\theta) = E\left\{ \left( \sum_{k=1}^{N} s_k \right)^2 \right\} = \sum_{k=1}^{N} E\{s_k^2\} + \sum_{k \neq l} E\{s_k\} E\{s_l\} = N\, I_1(\theta)`,
        why: md`Definizione di slide p14 con $r = 1$, applicata allo score totale. Per l'indipendenza $E\{s_k s_l\} = E\{s_k\}\,E\{s_l\}$ quando $k \neq l$, e questo prodotto è zero perché ogni score ha media nulla; restano $N$ termini uguali a $I_1(\theta)$.`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon\} \geq \frac{1}{N\, I_1(\theta)}`,
        why: md`Con $r = 1$ il bound di Cramér-Rao è il reciproco dell'informazione, quindi è inversamente proporzionale a $N$: raddoppiare i campioni dimezza il bound, cioè il limite inferiore della varianza di ogni stimatore non polarizzato (lo raggiunge solo uno stimatore efficiente, se esiste).`,
      },
      {
        latex: md`\mathbf{I}_N(\boldsymbol{\theta}) = E\left\{ \left( \sum_{k=1}^{N} \mathbf{s}_k \right) \left( \sum_{l=1}^{N} \mathbf{s}_l \right)^{t} \right\} = \sum_{k=1}^{N} E\{\mathbf{s}_k \mathbf{s}_k^{t}\} + \sum_{k \neq l} E\{\mathbf{s}_k\}\, E\{\mathbf{s}_l\}^{t} = N\, \mathbf{I}_1(\boldsymbol{\theta}) \;\Longrightarrow\; [\mathbf{I}_N^{-1}(\boldsymbol{\theta})]_{ii} = \frac{1}{N}\, [\mathbf{I}_1^{-1}(\boldsymbol{\theta})]_{ii}`,
        why: md`Caso vettoriale, usato dai risultati con più parametri. Qui $\mathbf{s}_k$ è il gradiente della log-likelihood del campione $k$: ha media nulla componente per componente (stesso argomento del passo sulla media dello score), e per l'indipendenza i prodotti esterni misti si fattorizzano e si annullano. L'inversa di $N\,\mathbf{I}_1$ è $\mathbf{I}_1^{-1}/N$, perché il loro prodotto è la matrice identità: ogni elemento diagonale del bound scende come $1/N$.`,
      },
      {
        latex: md`\text{gaussiana: } I_1(m) = \frac{1}{\sigma^2} \;\Rightarrow\; I_N(m) = \frac{N}{\sigma^2}, \qquad \text{Bernoulli: } I_1(\theta) = \frac{1}{\theta(1-\theta)} \;\Rightarrow\; I_N(\theta) = \frac{N}{\theta(1-\theta)}`,
        why: md`Due controlli. Per la media di una gaussiana $s_k = (x_k - m)/\sigma^2$ ha varianza $\sigma^2/\sigma^4 = 1/\sigma^2$, e si ritrova $N/\sigma^2$ ([«bound per la media di una gaussiana»](#derivation:der05)). Per una Bernoulli (un'email è spam con probabilità $\theta$, $x_k \in \{0, 1\}$) lo score è $s_k = x_k/\theta - (1 - x_k)/(1 - \theta)$ e $E\{s_k^2\} = \theta \cdot \frac{1}{\theta^2} + (1 - \theta) \cdot \frac{1}{(1-\theta)^2} = \frac{1}{\theta} + \frac{1}{1-\theta}$.`,
      },
    ],
    conclusion: md`Con campioni iid lo score totale è la somma di $N$ score indipendenti a media nulla, e le loro varianze si sommano: $I_N(\theta) = N\, I_1(\theta)$ e $\operatorname{var}\{\varepsilon\} \geq 1/(N\, I_1(\theta))$. Nel caso vettoriale $\mathbf{I}_N = N\,\mathbf{I}_1$ e ogni bound $[\mathbf{I}_N^{-1}]_{ii}$ scende come $1/N$. Per questo la qualità della stima dipende dal numero di campioni (note p19): la deviazione standard minima scende solo come $1/\sqrt{N}$, quindi per dimezzarla servono quattro volte i campioni.`,
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 17 }, { doc: 'part1', page: 19 }],
  },

  // --- der07 Bias -> 0 e varianza -> 0 danno la consistenza ------------------------------------------------
  {
    id: 'der07',
    title: 'Bias → 0 e varianza → 0 portano alla consistenza (disuguaglianza di Chebyshev)',
    goal: md`Legare le due condizioni di slide p16 (stima asintoticamente non polarizzata, varianza che tende a zero) alla definizione di consistenza, $\lim_{N \to +\infty} P\{\|\boldsymbol{\varepsilon}\| < \delta\} = 1$ per ogni $\delta > 0$. La fonte le chiama condizione necessaria (*necessary condition*); qui si dimostra che insieme bastano a garantire la consistenza. Integrazione: la dimostrazione non è nelle slide.`,
    assumptions: md`Per ogni $N$ la stima $\hat{\boldsymbol{\theta}}$, calcolata su $N$ campioni, ha errore $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$ con varianza finita; bias e varianza sono funzioni di $N$. $\|\cdot\|$ è la norma euclidea.`,
    steps: [
      {
        latex: md`P\{Y \geq a\} \leq \frac{E\{Y\}}{a}, \qquad Y \geq 0, \; a > 0`,
        why: md`Disuguaglianza di Markov (*Markov's inequality*) per una variabile aleatoria non negativa: una variabile con media piccola non può essere grande con probabilità alta.`,
      },
      {
        latex: md`E\{Y\} = \int_0^{+\infty} y\, p_Y(y)\, dy \geq \int_a^{+\infty} y\, p_Y(y)\, dy \geq a \int_a^{+\infty} p_Y(y)\, dy = a\, P\{Y \geq a\}`,
        why: md`Dimostrazione in una riga: si butta via la parte d'integrale tra $0$ e $a$, che è non negativa, e dove $y \geq a$ si sostituisce $y$ con $a$, che è più piccolo. Dividendo per $a$ si ottiene la disuguaglianza del passo precedente.`,
      },
      {
        latex: md`P\{|\varepsilon_i| \geq \delta\} = P\{\varepsilon_i^2 \geq \delta^2\} \leq \frac{E\{\varepsilon_i^2\}}{\delta^2}`,
        why: md`Si applica Markov a $Y = \varepsilon_i^2$ con $a = \delta^2$. Gli eventi $|\varepsilon_i| \geq \delta$ ed $\varepsilon_i^2 \geq \delta^2$ coincidono, perché il quadrato è crescente sui numeri non negativi. È la disuguaglianza di Chebyshev (*Chebyshev's inequality*) scritta con l'errore quadratico medio: la probabilità di un errore grande è limitata dall'errore quadratico medio.`,
      },
      {
        latex: md`E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + (E\{\varepsilon_i\})^2`,
        why: md`Scomposizione dell'errore quadratico medio in varianza più bias al quadrato ([«errore quadratico medio = varianza + bias²»](#derivation:der03)).`,
      },
      {
        latex: md`\lim_{N \to +\infty} E\{\varepsilon_i\} = 0 \;\text{e}\; \lim_{N \to +\infty} \operatorname{var}\{\varepsilon_i\} = 0 \;\Longrightarrow\; \lim_{N \to +\infty} E\{\varepsilon_i^2\} = 0`,
        why: md`Se lo stimatore è asintoticamente non polarizzato (slide p15) e la sua varianza tende a zero (slide p16), tendono a zero entrambi gli addendi: la varianza e il quadrato del bias.`,
      },
      {
        latex: md`0 \leq P\{|\varepsilon_i| \geq \delta\} \leq \frac{E\{\varepsilon_i^2\}}{\delta^2} \;\longrightarrow\; 0`,
        why: md`Con $\delta$ fisso il limite superiore tende a zero, e una probabilità non è mai negativa: per il teorema del confronto (*squeeze theorem*) anche $P\{|\varepsilon_i| \geq \delta\}$ tende a zero.`,
      },
      {
        latex: md`\lim_{N \to +\infty} P\{|\varepsilon_i| < \delta\} = 1 - \lim_{N \to +\infty} P\{|\varepsilon_i| \geq \delta\} = 1 \qquad \forall \delta > 0`,
        why: md`Evento complementare: $P\{|\varepsilon_i| < \delta\} = 1 - P\{|\varepsilon_i| \geq \delta\}$. La probabilità di stare entro $\delta$ dal vero tende a 1 qualunque sia $\delta$, anche piccolissimo.`,
      },
      {
        latex: md`P\{\|\boldsymbol{\varepsilon}\| \geq \delta\} \leq \frac{E\{\|\boldsymbol{\varepsilon}\|^2\}}{\delta^2} = \frac{1}{\delta^2} \sum_{i=1}^{r} E\{\varepsilon_i^2\} \;\longrightarrow\; 0`,
        why: md`Nel caso vettoriale si applica Markov a $\|\boldsymbol{\varepsilon}\|^2$, che è la somma dei quadrati delle componenti. Se ogni parametro ha bias e varianza che tendono a zero, la somma di $r$ termini che tendono a zero tende a zero.`,
      },
      {
        latex: md`\lim_{N \to +\infty} P\{\|\boldsymbol{\varepsilon}\| < \delta\} = 1 \qquad \forall \delta > 0`,
        why: md`Passando al complementare come nel caso scalare si ottiene la definizione di stima consistente (*consistent*) di slide p16: la stima converge al valore vero, in probabilità, quando $N \to +\infty$.`,
      },
      {
        latex: md`\hat{m} = \frac{1}{N} \sum_{k=1}^{N} x_k: \qquad P\{|\hat{m} - m| \geq \delta\} \leq \frac{\sigma^2}{N \delta^2}`,
        why: md`Esempio: la media campionaria ha bias zero e varianza $\sigma^2/N$ ([«bound per la media di una gaussiana»](#derivation:der05)). Con $\sigma = 1$, $\delta = 0.1$ e $N = 1000$ la probabilità di sbagliare di almeno $0.1$ è al più $1/(1000 \cdot 0.01) = 0.1$; con $N = 10000$ è al più $0.01$.`,
      },
    ],
    conclusion: md`Bias e varianza che tendono a zero fanno tendere a zero l'errore quadratico medio, e questo, per la disuguaglianza di Chebyshev, dà la consistenza. In senso stretto la condizione di slide p16 è sufficiente ma non necessaria. Controesempio, per la media $m$ di una gaussiana con $\sigma$ nota e $N \geq 2$: lo stimatore $\hat{m} = \bar{x} + Z_N$, con $Z_N = N$ se $|x_1 - x_2| > \sqrt{2}\,\sigma\, z_{1-1/(2N)}$ e $Z_N = 0$ altrimenti, dove $z_{1-1/(2N)}$ è il quantile di livello $1 - 1/(2N)$ della normale standard. È una vera funzione del training set: usa solo i dati e $\sigma$, non il valore vero, e nessun sorteggio esterno. La differenza $x_1 - x_2$ è gaussiana con media 0 e varianza $2\sigma^2$, qualunque sia $m$, quindi $P\{Z_N = N\} = 2\,(1 - \Phi(z_{1-1/(2N)})) = 1/N$. Inoltre è scorrelata da $\bar{x}$ ($\operatorname{cov}\{x_1 - x_2, \bar{x}\} = \sigma^2/N - \sigma^2/N = 0$) e, essendo le due congiuntamente gaussiane, ne è indipendente. Lo stimatore è consistente, perché $P\{|\varepsilon| \geq \delta\} \leq P\{|\bar{x} - m| \geq \delta\} + P\{Z_N \neq 0\} = P\{|\bar{x} - m| \geq \delta\} + 1/N \to 0$, ma ha bias $E\{Z_N\} = N \cdot 1/N = 1$ e varianza $\sigma^2/N + N^2 \cdot \frac{1}{N}\left(1 - \frac{1}{N}\right) = \sigma^2/N + N - 1$, che diverge. Gli stessi numeri si ottengono estraendo $Z_N$ con un sorteggio indipendente dai dati, ma allora lo stimatore è randomizzato (*randomized estimator*): non è funzione del solo $\mathbf{X}$. All'orale conviene dare la condizione come la dà il docente e, se richiesto, aggiungere questa precisazione ([«legami tra le proprietà»](#derivation:der16)).`,
    source: [{ doc: 'ch2', page: 15 }, { doc: 'ch2', page: 16 }, { doc: 'part1', page: 19 }],
  },

  // --- der08 ML della media da una sola osservazione --------------------------------------------------------
  {
    id: 'der08',
    title: 'Stima ML della media di una gaussiana 1-D da una sola osservazione: m̂ = x₀',
    goal: md`Ricavare con i conti il risultato che la figura delle note (p20) mostra con la «ML search»: con una sola osservazione $x_0$ e varianza nota, la stima a massima verosimiglianza della media è $\hat{m} = x_0$. In coda si verifica che la stima è non polarizzata ed efficiente.`,
    assumptions: md`Gaussiana monodimensionale (*mono-dimensional Gaussian pdf*) con varianza $\sigma^2$ nota (*known variance*) e media $m$ incognita; una sola osservazione (*single observation*) $x_0$, quindi $N = 1$.`,
    steps: [
      {
        latex: md`\hat{m} = \arg\max_{m}\, p(x_0|m)`,
        why: md`Definizione di stima ML delle note (p20) con $\boldsymbol{\theta} = m$ e $\mathbf{X} = \{x_0\}$: tra tutte le gaussiane con varianza $\sigma^2$ si cerca quella che rende più verosimile l'osservazione.`,
      },
      {
        latex: md`p(x_0|m) = \frac{1}{\sqrt{2\pi}\,\sigma} \exp\left( -\frac{(x_0 - m)^2}{2\sigma^2} \right)`,
        why: md`Con una sola osservazione la likelihood è la densità gaussiana valutata in $x_0$ e vista come funzione della media $m$. Nella figura, spostare $m$ (la «ML search») cambia l'altezza della curva sulla linea tratteggiata in $x_0$: ogni curva dà un valore di likelihood.`,
      },
      {
        latex: md`p(x_0|m) \leq \frac{1}{\sqrt{2\pi}\,\sigma} = p(x_0|x_0)`,
        why: md`Lettura senza derivate: l'esponenziale di un numero non positivo vale al più 1, e vale 1 solo se l'esponente è zero, cioè se $m = x_0$. L'altezza massima sulla linea tratteggiata si ha con la gaussiana centrata sull'osservazione.`,
      },
      {
        latex: md`\ln p(x_0|m) = -\ln(\sqrt{2\pi}\,\sigma) - \frac{(x_0 - m)^2}{2\sigma^2}`,
        why: md`Si passa alla log-likelihood: il logaritmo è monotono crescente e non sposta il massimo ([«log-likelihood e prodotti che diventano somme»](#derivation:der10)).`,
      },
      {
        latex: md`\frac{\partial}{\partial m}\left[ -\frac{(x_0 - m)^2}{2\sigma^2} \right] = -\frac{2(x_0 - m)\cdot(-1)}{2\sigma^2} = \frac{x_0 - m}{\sigma^2}`,
        why: md`Il primo termine della log-likelihood non dipende da $m$. Nel secondo si deriva il quadrato con la regola della catena: la derivata interna di $x_0 - m$ rispetto a $m$ è $-1$.`,
      },
      {
        latex: md`\frac{\partial \ln p(x_0|m)}{\partial m} = \frac{x_0 - m}{\sigma^2} = 0`,
        why: md`Condizione di massimo: derivata prima rispetto a $m$ uguale a zero.`,
      },
      {
        latex: md`\hat{m} = x_0`,
        why: md`$\sigma^2 > 0$, quindi deve annullarsi il numeratore: l'unica soluzione è $m = x_0$. La gaussiana più verosimile è quella centrata sull'osservazione stessa ($\Rightarrow \hat{m} = x_0$ nella figura, dove $x_0$ vale circa 1 e la curva verde, centrata in 1, è la più alta sulla linea tratteggiata).`,
      },
      {
        latex: md`\frac{\partial^2 \ln p(x_0|m)}{\partial m^2} = -\frac{1}{\sigma^2} < 0`,
        why: md`La derivata seconda è negativa per ogni $m$: la log-likelihood è una parabola rivolta verso il basso e il punto stazionario è il massimo globale.`,
      },
      {
        latex: md`E\{\hat{m}\} = E\{x_0\} = m, \qquad \operatorname{var}\{\hat{m}\} = \operatorname{var}\{x_0\} = \sigma^2 = I^{-1}(m)\big|_{N=1}`,
        why: md`Controllo di bontà con gli strumenti del modulo (non è nella fonte): la stima è non polarizzata perché $x_0$ ha media $m$. L'informazione di Fisher di un campione è $1/\sigma^2$, l'opposto della derivata seconda del passo precedente, quindi il bound per $N = 1$ è $\sigma^2$: la varianza della stima lo raggiunge, ed è lo stimatore efficiente, in accordo con il teorema delle note (p20) su ML ed efficienza.`,
      },
      {
        latex: md`N \text{ osservazioni: } \hat{m} = \frac{1}{N} \sum_{k=1}^{N} x_k, \qquad \operatorname{var}\{\hat{m}\} = \frac{\sigma^2}{N}`,
        why: md`Con $N$ osservazioni lo stesso ragionamento dà la media campionaria, sempre efficiente, con varianza che scende come $1/N$ ([«bound per la media di una gaussiana»](#derivation:der05)). Con una sola osservazione la stima è giusta in media ma si porta dietro tutta la varianza del rumore, $\sigma^2$.`,
      },
    ],
    conclusion: md`Con una sola osservazione la stima ML della media è l'osservazione stessa, $\hat{m} = x_0$: la gaussiana più verosimile è quella centrata sul dato. La stima è non polarizzata ed efficiente, con varianza $\sigma^2$ uguale al bound per $N = 1$.`,
    source: [{ doc: 'part1', page: 20 }],
  },

  // --- der09 Schizzo della dimostrazione del bound e legame con la ML --------------------------------------
  {
    id: 'der09',
    title: 'Schizzo della dimostrazione del bound nel caso scalare e legame con la stima ML',
    goal: md`Dare l'idea del perché vale $\operatorname{var}\{\varepsilon\} \geq 1/I(\theta)$ per uno stimatore non polarizzato e del perché, quando il bound è raggiunto, lo stimatore efficiente coincide con quello ML. La fonte enuncia entrambi i fatti (slide p14, note p20) senza dimostrarli: integrazione.`,
    assumptions: md`Un solo parametro ($r = 1$). Stimatore $\hat{\theta}(\mathbf{X})$ non polarizzato per ogni valore di $\theta$. Condizioni di regolarità su $p(\mathbf{X}|\theta)$ (le *certain assumptions regarding the probability distribution* delle note, p20): densità positiva e derivabile in $\theta$, supporto che non dipende da $\theta$, derivata e integrale scambiabili. Se il supporto dipende da $\theta$, come per l'uniforme su $[0, \theta]$, il bound può cadere ([«quando le ipotesi di regolarità cadono»](#derivation:der20)).`,
    steps: [
      {
        latex: md`E\{\hat{\theta}\} = \int \hat{\theta}(\mathbf{X})\, p(\mathbf{X}|\theta)\, d\mathbf{X} = \theta`,
        why: md`Ipotesi del bound: lo stimatore è non polarizzato per ogni valore di $\theta$. Il valore atteso è un integrale sui training set.`,
      },
      {
        latex: md`\int \hat{\theta}(\mathbf{X})\, \frac{\partial p(\mathbf{X}|\theta)}{\partial \theta}\, d\mathbf{X} = 1`,
        why: md`Si derivano i due membri rispetto a $\theta$. A destra la derivata di $\theta$ è 1. A sinistra la derivata entra nell'integrale (condizione di regolarità) e tocca solo la densità: $\hat{\theta}(\mathbf{X})$ è una funzione dei dati e non dipende da $\theta$.`,
      },
      {
        latex: md`\frac{\partial p(\mathbf{X}|\theta)}{\partial \theta} = p(\mathbf{X}|\theta)\, \frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} \;\Longrightarrow\; E\left\{ \hat{\theta}\, \frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} \right\} = 1`,
        why: md`Identità della derivata logaritmica: la derivata di $p$ è $p$ per la derivata di $\ln p$. Compare lo *score*, la derivata della log-likelihood che sta nella matrice di Fisher, e l'integrale diventa un valore atteso.`,
      },
      {
        latex: md`E\left\{ \frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} \right\} = 0 \;\Longrightarrow\; E\left\{ (\hat{\theta} - \theta)\, \frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} \right\} = 1`,
        why: md`Lo score ha media nulla ([«l'informazione di Fisher cresce come N»](#derivation:der06)), quindi si può sottrarre $\theta$ dentro il valore atteso senza cambiare il risultato.`,
      },
      {
        latex: md`E\left\{ (\hat{\theta} - \theta)\, s \right\} = E\{\hat{\theta}\, s\} - \theta\, E\{s\} = 1 - \theta \cdot 0 = 1, \qquad s = \frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta}`,
        why: md`Il passo precedente per esteso: linearità del valore atteso, $\theta$ costante che esce, media dello score nulla.`,
      },
      {
        latex: md`E\{(U - tV)^2\} = E\{U^2\} - 2t\, E\{UV\} + t^2 E\{V^2\} \geq 0 \;\; \forall t \in \Re \;\Longrightarrow\; (E\{UV\})^2 \leq E\{U^2\}\, E\{V^2\}`,
        why: md`Disuguaglianza di Cauchy-Schwarz (*Cauchy-Schwarz inequality*) per variabili aleatorie. Il valore atteso di un quadrato non è mai negativo, per nessun $t$: la parabola in $t$ non ha due radici reali distinte, quindi il suo discriminante $4(E\{UV\})^2 - 4E\{U^2\}\,E\{V^2\}$ è minore o uguale a zero.`,
      },
      {
        latex: md`1 = \left( E\left\{ (\hat{\theta} - \theta)\, \frac{\partial \ln p}{\partial \theta} \right\} \right)^2 \leq E\{(\hat{\theta} - \theta)^2\}\; E\left\{ \left( \frac{\partial \ln p}{\partial \theta} \right)^2 \right\} = \operatorname{var}\{\varepsilon\}\, I(\theta)`,
        why: md`Cauchy-Schwarz con $U = \hat{\theta} - \theta$, l'errore di stima, e $V = s$, lo score. Il primo fattore è la varianza dell'errore, perché lo stimatore è non polarizzato ed $E\{\varepsilon^2\} = \operatorname{var}\{\varepsilon\}$; il secondo è l'informazione di Fisher di slide p14 con $r = 1$.`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon\} \geq \frac{1}{I(\theta)}`,
        why: md`Si divide per $I(\theta) > 0$: è la disuguaglianza di Cramér-Rao nel caso $r = 1$. Nel caso vettoriale al posto di $1/I(\theta)$ compare l'elemento diagonale dell'inversa, $[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}$.`,
      },
      {
        latex: md`\text{uguaglianza} \iff \frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} = a(\theta)\,(\hat{\theta}_{eff}(\mathbf{X}) - \theta)`,
        why: md`In Cauchy-Schwarz vale l'uguaglianza solo se il discriminante è zero, cioè se esiste un $t$ con $E\{(U - tV)^2\} = 0$: le due variabili sono proporzionali. Uno stimatore efficiente esiste solo se lo score ha questa forma, con un coefficiente $a(\theta)$ che può dipendere da $\theta$ ma non dai dati.`,
      },
      {
        latex: md`1 = E\{(\hat{\theta}_{eff} - \theta)\, s\} = a(\theta)\, \operatorname{var}\{\varepsilon\}, \qquad I(\theta) = E\{s^2\} = a^2(\theta)\, \operatorname{var}\{\varepsilon\} \;\Longrightarrow\; a(\theta) = I(\theta), \quad \operatorname{var}\{\varepsilon\} = \frac{1}{I(\theta)}`,
        why: md`Si sostituisce la forma proporzionale nell'identità $E\{(\hat{\theta} - \theta)\, s\} = 1$ e nella definizione dell'informazione. Dividendo la seconda uguaglianza per la prima si trova il coefficiente, $a(\theta) = I(\theta)$, e la varianza è esattamente il bound. Controllo: per la media di una gaussiana lo score è $\frac{N}{\sigma^2}(\hat{m} - m)$ e $N/\sigma^2 = I(m)$ ([«bound per la media di una gaussiana»](#derivation:der05)).`,
      },
      {
        latex: md`\left. \frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} \right|_{\theta = \hat{\theta}_{ML}} = I(\hat{\theta}_{ML})\,\big(\hat{\theta}_{eff}(\mathbf{X}) - \hat{\theta}_{ML}\big)`,
        why: md`La forma proporzionale vale per ogni valore di $\theta$, quindi si può valutare anche nel punto $\theta = \hat{\theta}_{ML}$, con $a(\theta) = I(\theta)$.`,
      },
      {
        latex: md`\left. \frac{\partial \ln p(\mathbf{X}|\theta)}{\partial \theta} \right|_{\theta = \hat{\theta}_{ML}} = 0 \;\Longrightarrow\; \hat{\theta}_{ML} = \hat{\theta}_{eff}`,
        why: md`La stima ML annulla lo score (condizione di massimo). Se $I(\hat{\theta}_{ML}) > 0$ deve annullarsi il fattore a destra del passo precedente: annullare lo score dà proprio lo stimatore efficiente. È l'enunciato delle note (p20): se esiste uno stimatore efficiente, la stima ML è quello efficiente. Serve che il massimo sia un punto stazionario interno allo spazio dei parametri: l'ipotesi *the ML estimate is unbiased* dell'enunciato esclude i casi con il massimo sul bordo (per esempio media vincolata a $m \geq 0$, dove la ML è $\max(\bar{x}, 0)$, che è polarizzata).`,
      },
    ],
    conclusion: md`Per uno stimatore non polarizzato, Cauchy-Schwarz tra errore e score dà $1 \leq \operatorname{var}\{\varepsilon\}\, I(\theta)$, cioè il bound di Cramér-Rao. L'uguaglianza vale solo se lo score è proporzionale all'errore, $\frac{\partial \ln p}{\partial \theta} = I(\theta)\,(\hat{\theta}_{eff} - \theta)$. In quel caso annullare lo score, cioè cercare la stima ML, dà proprio lo stimatore efficiente: se uno stimatore efficiente esiste, è la stima ML.`,
    source: [{ doc: 'ch2', page: 14 }, { doc: 'part1', page: 19 }, { doc: 'part1', page: 20 }],
  },

  // --- der10 Log-likelihood: stesso massimo, prodotti che diventano somme ------------------------------------
  {
    id: 'der10',
    title: 'Massimizzare la log-likelihood equivale a massimizzare la likelihood; i prodotti diventano somme',
    goal: md`Giustificare la seconda scrittura della stima ML delle note (p20), $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X}|\boldsymbol{\theta})$, e il vantaggio pratico del logaritmo, che trasforma i prodotti di probabilità in somme (*converts them into sums*).`,
    assumptions: md`Likelihood $p(\mathbf{X}|\boldsymbol{\theta}) > 0$ per i valori di $\boldsymbol{\theta}$ considerati, così che il logaritmo sia definito. Per la fattorizzazione, campioni iid; per la condizione con il gradiente, likelihood derivabile e massimo in un punto interno.`,
    steps: [
      {
        latex: md`\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}}\, p(\mathbf{X}|\boldsymbol{\theta})`,
        why: md`Definizione di stima a massima verosimiglianza (*maximum likelihood estimate*) delle note (p20): il valore di $\boldsymbol{\theta}$ che si accorda meglio con i campioni osservati (*most closely aligns with the observed training samples*).`,
      },
      {
        latex: md`p(\mathbf{X}|\boldsymbol{\theta}_1) > p(\mathbf{X}|\boldsymbol{\theta}_2) \iff \ln p(\mathbf{X}|\boldsymbol{\theta}_1) > \ln p(\mathbf{X}|\boldsymbol{\theta}_2)`,
        why: md`Il logaritmo naturale è strettamente crescente sui positivi (*monotonically increasing function*): conserva l'ordinamento dei valori della likelihood.`,
      },
      {
        latex: md`p(\mathbf{X}|\hat{\boldsymbol{\theta}}) \geq p(\mathbf{X}|\boldsymbol{\theta}) \;\; \forall \boldsymbol{\theta} \iff \ln p(\mathbf{X}|\hat{\boldsymbol{\theta}}) \geq \ln p(\mathbf{X}|\boldsymbol{\theta}) \;\; \forall \boldsymbol{\theta}`,
        why: md`Essere il massimo vuol dire battere tutti gli altri valori di $\boldsymbol{\theta}$; per il passo precedente ogni disuguaglianza si conserva passando ai logaritmi, nei due versi.`,
      },
      {
        latex: md`\arg\max_{\boldsymbol{\theta}} p(\mathbf{X}|\boldsymbol{\theta}) = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X}|\boldsymbol{\theta})`,
        why: md`Quindi il punto di massimo è lo stesso: massimizzare la log-likelihood (*log-likelihood*) dà la stessa stima che massimizzare la likelihood (note p20). Cambia il valore del massimo, non la sua posizione: nella figura a tre pannelli (note p17) il picco di $p(\mathbf{X}|\theta)$ e quello di $l(\theta)$ cadono nello stesso $\hat{\theta}$.`,
      },
      {
        latex: md`\ln p(\mathbf{X}|\boldsymbol{\theta}) = \ln \prod_{k=1}^{N} p(\mathbf{x}_k|\boldsymbol{\theta}) = \sum_{k=1}^{N} \ln p(\mathbf{x}_k|\boldsymbol{\theta})`,
        why: md`Proprietà del logaritmo di un prodotto, applicata alla likelihood per campioni iid (note p17): il prodotto di $N$ fattori diventa una somma di $N$ termini.`,
      },
      {
        latex: md`\nabla_{\boldsymbol{\theta}} \ln p(\mathbf{X}|\boldsymbol{\theta}) = \frac{\nabla_{\boldsymbol{\theta}}\, p(\mathbf{X}|\boldsymbol{\theta})}{p(\mathbf{X}|\boldsymbol{\theta})}`,
        why: md`Regola della catena: il gradiente della log-likelihood è quello della likelihood diviso per un numero positivo. I due gradienti si annullano negli stessi punti, quindi coincidono anche i punti stazionari.`,
      },
      {
        latex: md`\nabla_{\boldsymbol{\theta}} \ln p(\mathbf{X}|\boldsymbol{\theta}) = \sum_{k=1}^{N} \nabla_{\boldsymbol{\theta}} \ln p(\mathbf{x}_k|\boldsymbol{\theta}) = \mathbf{0}`,
        why: md`La condizione di massimo diventa una somma di gradienti, uno per campione, facili da calcolare termine a termine: derivare una somma è molto più semplice che derivare un prodotto di $N$ fattori con la regola del prodotto. È il vantaggio analitico citato dalle note (*for analytical purposes*).`,
      },
      {
        latex: md`\ln \prod_{k=1}^{N} \frac{1}{\sqrt{2\pi}\,\sigma}\, e^{-\frac{(x_k - m)^2}{2\sigma^2}} = -\frac{N}{2} \ln(2\pi\sigma^2) - \frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - m)^2`,
        why: md`Esempio con la gaussiana: il logaritmo cancella anche l'esponenziale e la log-likelihood diventa un polinomio di secondo grado in $m$, una parabola rivolta verso il basso come nel terzo pannello della figura (note p17). Massimizzarla è un problema di minimi quadrati ([«bound per la media di una gaussiana»](#derivation:der05)).`,
      },
      {
        latex: md`\prod_{k=1}^{1000} 0.1 = 10^{-1000}, \qquad \sum_{k=1}^{1000} \ln 0.1 = 1000 \cdot (-2.3026) \approx -2302.6`,
        why: md`Vantaggio numerico (non è nella fonte): un prodotto di tante probabilità minori di 1 diventa piccolissimo. Nella figura delle note la likelihood è già dell'ordine di $10^{-7}$ con una dozzina di campioni; con 1000 campioni il prodotto scende sotto il più piccolo numero rappresentabile in doppia precisione (circa $10^{-308}$) e per il computer diventa 0. La somma dei logaritmi resta un numero maneggevole.`,
      },
    ],
    conclusion: md`Il logaritmo è strettamente crescente, quindi $\arg\max_{\boldsymbol{\theta}} p(\mathbf{X}|\boldsymbol{\theta}) = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X}|\boldsymbol{\theta})$: stessa stima, conti più semplici. Con campioni iid la log-likelihood è una somma di $N$ termini e la condizione di massimo $\sum_{k=1}^{N} \nabla_{\boldsymbol{\theta}} \ln p(\mathbf{x}_k|\boldsymbol{\theta}) = \mathbf{0}$ si deriva campione per campione.`,
    source: [{ doc: 'part1', page: 17 }, { doc: 'part1', page: 20 }],
  },

  // --- der11 Varianza ML: biased ma asintoticamente buona -----------------------------------------------------
  {
    id: 'der11',
    title: 'La stima ML della varianza è biased ma asintoticamente unbiased, asintoticamente efficiente e consistente',
    goal: md`Vedere all'opera le tre proprietà asintotiche (slide p15-16) su uno stimatore che il corso stesso indica come polarizzato: la slide p31 del Cap. 2 enuncia che la covarianza stimata con ML ha valore atteso $\frac{N-1}{N}\Sigma$. Qui il caso scalare con tutti i conti. Integrazione: i passaggi non sono nelle slide.`,
    assumptions: md`$N \geq 2$ campioni $x_1, \dots, x_N$ iid da una gaussiana monodimensionale con media $m$ e varianza $\sigma^2$ entrambe incognite: $\boldsymbol{\theta} = (m, \sigma^2)$. Si studia la stima della varianza, con errore $\varepsilon = \hat{\sigma}^2 - \sigma^2$.`,
    steps: [
      {
        latex: md`\hat{\sigma}^2 = \frac{1}{N} \sum_{k=1}^{N} (x_k - \hat{m})^2, \qquad \hat{m} = \frac{1}{N} \sum_{k=1}^{N} x_k`,
        why: md`Stime ML di media e varianza di una gaussiana monodimensionale: caso scalare delle formule di slide p31 del Cap. 2, $\hat{\mathbf{m}} = \frac{1}{N}\sum_{k} \mathbf{x}_k$ e $\hat{\Sigma} = \frac{1}{N}\sum_{k} (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$. Nella varianza compare la media stimata $\hat{m}$, non la media vera $m$, che è ignota.`,
      },
      {
        latex: md`x_k - \hat{m} = (x_k - m) - (\hat{m} - m), \qquad \sum_{k=1}^{N} (x_k - m) = N(\hat{m} - m)`,
        why: md`Ogni scarto dalla media campionaria si scrive come scarto dalla media vera meno l'errore della media. La somma degli scarti dalla media vera vale $\sum_k x_k - Nm = N\hat{m} - Nm$.`,
      },
      {
        latex: md`\sum_{k=1}^{N} (x_k - \hat{m})^2 = \sum_{k=1}^{N} (x_k - m)^2 - 2(\hat{m} - m) \sum_{k=1}^{N} (x_k - m) + N(\hat{m} - m)^2`,
        why: md`Si eleva al quadrato lo scarto del passo precedente e si somma su $k$. Il termine $\hat{m} - m$ non dipende da $k$: nel doppio prodotto esce dalla somma, e il suo quadrato sommato $N$ volte dà $N(\hat{m} - m)^2$.`,
      },
      {
        latex: md`\sum_{k=1}^{N} (x_k - \hat{m})^2 = \sum_{k=1}^{N} (x_k - m)^2 - N(\hat{m} - m)^2`,
        why: md`Nel doppio prodotto si sostituisce $\sum_k (x_k - m) = N(\hat{m} - m)$: vale $-2N(\hat{m} - m)^2$, che sommato a $+N(\hat{m} - m)^2$ lascia $-N(\hat{m} - m)^2$. Gli scarti dalla media campionaria sono in totale più piccoli di quelli dalla media vera: $\hat{m}$ è il punto che rende minima la somma dei quadrati.`,
      },
      {
        latex: md`E\left\{ \sum_{k=1}^{N} (x_k - m)^2 \right\} = N\sigma^2, \qquad E\{N(\hat{m} - m)^2\} = N \operatorname{var}\{\hat{m}\} = N\, \frac{\sigma^2}{N} = \sigma^2`,
        why: md`I due valori attesi che servono. Ogni $(x_k - m)^2$ ha media $\sigma^2$ per definizione di varianza. $\hat{m}$ è non polarizzata con varianza $\sigma^2/N$ ([«bound per la media di una gaussiana»](#derivation:der05)), quindi $E\{(\hat{m} - m)^2\} = \sigma^2/N$.`,
      },
      {
        latex: md`E\{\hat{\sigma}^2\} = \frac{1}{N} \left( N\sigma^2 - N\,\frac{\sigma^2}{N} \right) = \frac{N-1}{N}\, \sigma^2`,
        why: md`Si divide per $N$ l'identità sulla somma dei quadrati e si prende il valore atteso con il passo precedente: si ritrova il fattore di slide p31, $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$. Stimare la media dagli stessi dati «consuma» un grado di libertà.`,
      },
      {
        latex: md`E\{\varepsilon\} = E\{\hat{\sigma}^2\} - \sigma^2 = -\frac{\sigma^2}{N} \neq 0, \qquad \lim_{N \to +\infty} E\{\varepsilon\} = 0`,
        why: md`Il bias è diverso da zero per ogni $N$ finito: la stima è polarizzata (*biased*) e in media sottostima la varianza. Ma il bias tende a zero: la stima è asintoticamente non polarizzata (*asymptotically unbiased*, slide p15).`,
      },
      {
        latex: md`\tilde{\sigma}^2 = \frac{1}{N-1} \sum_{k=1}^{N} (x_k - \hat{m})^2 = \frac{N}{N-1}\, \hat{\sigma}^2 \;\Longrightarrow\; E\{\tilde{\sigma}^2\} = \frac{N}{N-1} \cdot \frac{N-1}{N}\, \sigma^2 = \sigma^2`,
        why: md`Correzione: moltiplicando per $\frac{N}{N-1}$ si cancella il fattore del bias. È lo stimatore non polarizzato elementare (*elementary unbiased estimator*) di slide p31, con $\frac{1}{N-1}$ al posto di $\frac{1}{N}$.`,
      },
      {
        latex: md`\frac{N \hat{\sigma}^2}{\sigma^2} \sim \chi^2_{N-1} \;\Longrightarrow\; \operatorname{var}\{\hat{\sigma}^2\} = \frac{2(N-1)}{N^2}\, \sigma^4`,
        why: md`Per dati gaussiani la somma degli scarti quadratici dalla media campionaria, divisa per $\sigma^2$, è una chi-quadrato con $N - 1$ gradi di libertà (teorema di Cochran): gli $N$ scarti sommano a zero, quindi uno è determinato dagli altri. Una chi-quadrato con $\nu$ gradi di libertà ha media $\nu$ e varianza $2\nu$. Controllo: la media $N - 1$ ridà $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2$.`,
      },
      {
        latex: md`\operatorname{var}\{\hat{\sigma}^2\} = \operatorname{var}\left\{ \frac{\sigma^2}{N} \cdot \frac{N\hat{\sigma}^2}{\sigma^2} \right\} = \frac{\sigma^4}{N^2} \cdot 2(N - 1) = \operatorname{var}\{\varepsilon\}`,
        why: md`Il passaggio sottinteso del passo precedente: $\operatorname{var}\{aY\} = a^2 \operatorname{var}\{Y\}$ con $a = \sigma^2/N$ e $\operatorname{var}\{Y\} = 2(N-1)$. La varianza dell'errore è quella della stima, perché $\sigma^2$ è una costante ([«la varianza dell'errore è la varianza della stima»](#derivation:der02)).`,
      },
      {
        latex: md`[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{\sigma^2 \sigma^2} = \frac{2\sigma^4}{N}`,
        why: md`Elemento diagonale dell'inversa della matrice di Fisher per il parametro $\sigma^2$ ([«matrice di Fisher 2×2 per una gaussiana»](#derivation:der12)): la matrice è diagonale, con elemento $N/(2\sigma^4)$ per $\sigma^2$, e l'inversa si ottiene invertendo la diagonale.`,
      },
      {
        latex: md`\frac{\operatorname{var}\{\varepsilon\}}{[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{\sigma^2 \sigma^2}} = \frac{N-1}{N} \;\longrightarrow\; 1`,
        why: md`Rapporto di slide p15: $\frac{2(N-1)\sigma^4/N^2}{2\sigma^4/N} = \frac{N-1}{N}$. A $N$ finito è minore di 1, cioè la varianza sta sotto il bound: nessuna contraddizione, il bound vale per stimatori non polarizzati e questo è polarizzato. Il rapporto tende a 1: la stima è asintoticamente efficiente (*asymptotically efficient*). Con $N = 5$ e $\sigma^2 = 4$: varianza $5.12$, bound $6.4$, rapporto $0.8$.`,
      },
      {
        latex: md`E\{\varepsilon^2\} = \frac{2(N-1)}{N^2}\, \sigma^4 + \frac{\sigma^4}{N^2} = \frac{2N - 1}{N^2}\, \sigma^4 \;\longrightarrow\; 0`,
        why: md`Errore quadratico medio come varianza più bias al quadrato ([«errore quadratico medio = varianza + bias²»](#derivation:der03)), con bias $-\sigma^2/N$ e quindi bias al quadrato $\sigma^4/N^2$. Tende a zero come $2\sigma^4/N$.`,
      },
      {
        latex: md`\lim_{N \to +\infty} E\{\varepsilon\} = 0, \quad \lim_{N \to +\infty} \operatorname{var}\{\varepsilon\} = 0 \;\Longrightarrow\; \lim_{N \to +\infty} P\{|\varepsilon| < \delta\} = 1`,
        why: md`Bias e varianza tendono entrambi a zero (la varianza come $2\sigma^4/N$), quindi per la disuguaglianza di Chebyshev lo stimatore è consistente ([«bias e varianza che tendono a zero danno la consistenza»](#derivation:der07)). Sono le tre proprietà che la slide p31 attribuisce alle stime ML della gaussiana e che le note (p21) attribuiscono alla stima ML in generale.`,
      },
      {
        latex: md`\operatorname{var}\{\tilde{\sigma}^2\} = \frac{N^2}{(N-1)^2} \cdot \frac{2(N-1)}{N^2}\, \sigma^4 = \frac{2\sigma^4}{N-1} > \frac{2\sigma^4}{N}, \qquad E\{\varepsilon^2\} = \frac{2N-1}{N^2}\, \sigma^4 < \frac{2\sigma^4}{N-1}`,
        why: md`Confronto con la versione corretta. $\tilde{\sigma}^2$ è non polarizzata ma la sua varianza sta sopra il bound: a $N$ finito non è efficiente (lo è asintoticamente, rapporto $\frac{N}{N-1} \to 1$). E il suo errore quadratico medio, tutto varianza, supera quello della stima ML, perché $(2N - 1)(N - 1) = 2N^2 - 3N + 1 < 2N^2$. Con $N = 5$ e $\sigma^2 = 4$: $5.76$ per la ML contro $8$ per la versione corretta. Togliere il bias costa più varianza di quanta se ne risparmi: è lo stesso meccanismo della ridge ([«uno stimatore biased sotto il bound»](#derivation:der18)).`,
      },
      {
        latex: md`E\{\hat{\sigma}^2\} = \psi(\sigma^2) = \frac{N-1}{N}\, \sigma^2 \;\Longrightarrow\; \operatorname{var}\{\hat{\sigma}^2\} \geq \left( \frac{\partial \psi}{\partial \sigma^2} \right)^2 [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{\sigma^2 \sigma^2} = \frac{(N-1)^2}{N^2} \cdot \frac{2\sigma^4}{N}, \qquad \frac{2(N-1)\sigma^4 / N^2}{2(N-1)^2 \sigma^4 / N^3} = \frac{N}{N-1} \geq 1`,
        why: md`Controllo di coerenza: per uno stimatore con valore atteso $\psi(\theta)$ invece di $\theta$ il bound va moltiplicato per il quadrato della derivata di $\psi$ (stessa dimostrazione dello [«schizzo della dimostrazione del bound»](#derivation:der09), con $d\psi/d\theta$ al posto di 1 dopo la derivazione). Qui $\psi$ non dipende da $m$ e la matrice di Fisher è diagonale, quindi conta solo l'elemento di $\sigma^2$. Rispetto al bound della propria classe di bias il rapporto è $\frac{N}{N-1} \geq 1$: il valore $\frac{N-1}{N}$ del rapporto precedente non viola nulla, confronta soltanto uno stimatore polarizzato con il bound dei non polarizzati. Con $N = 5$ e $\sigma^2 = 4$: bound corretto $4.096$, varianza $5.12$, rapporto $1.25$.`,
      },
    ],
    conclusion: md`La stima ML della varianza, $\hat{\sigma}^2 = \frac{1}{N}\sum_{k}(x_k - \hat{m})^2$, ha $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2$: è polarizzata per ogni $N$ finito, ma il bias $-\sigma^2/N$ tende a zero (asintoticamente non polarizzata), il rapporto varianza/bound $\frac{N-1}{N}$ tende a 1 (asintoticamente efficiente) e bias e varianza tendono a zero (consistente). È il caso concreto della slide p15: gli stimatori dei problemi reali sono spesso polarizzati e non efficienti (*biased and inefficient*) a $N$ finito, e si giudicano dal comportamento per $N \to +\infty$.`,
    source: [
      { doc: 'ch2', page: 15 }, { doc: 'ch2', page: 16 }, { doc: 'ch2', page: 31 },
      { doc: 'part1', page: 19 }, { doc: 'part1', page: 21 },
    ],
  },
]
