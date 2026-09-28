// Derivazioni del foglio m05 (stima a massima verosimiglianza): der01-der10 dell'inventario.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più servono a seguire i conti
// che la fonte salta (controllati sulle immagini di ch2 p9-19, ch2 p26-31 e part1 p20-24) e sono ricalcolati a mano.
// Le pagine del modulo non contengono derivazioni analitiche (gap dell'inventario): der02-der07 sono integrazioni
// dichiarate che portano ai risultati enunciati dalla fonte (slide p17-19 e p31, note p20-24).
// Le derivazioni der11-der19 stanno in derivations-b.ts.
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivationsA: Derivation[] = [
  // --- der01 Il logaritmo non sposta il massimo ---------------------------------------------------------------------
  {
    id: 'der01',
    title: 'Il logaritmo non sposta il massimo: stesso arg max per likelihood e log-likelihood',
    goal: md`Giustificare il passaggio della slide p17 da $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta})$ a $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta})$ usando solo la monotonia del logaritmo (*the logarithm is monotonically increasing*).`,
    assumptions: md`La likelihood $p(\mathbf{X} \mid \boldsymbol{\theta})$ è positiva per i valori di $\boldsymbol{\theta}$ che si confrontano, così il logaritmo è definito; un $\boldsymbol{\theta}$ con likelihood nulla non può essere il massimo e si scarta. $\boldsymbol{\theta}$ può essere un vettore di $r$ parametri: l'argomento non usa derivate rispetto a $\boldsymbol{\theta}$.`,
    steps: [
      {
        latex: md`p(\mathbf{X} \mid \boldsymbol{\theta}_1) > p(\mathbf{X} \mid \boldsymbol{\theta}_2) > 0`,
        why: md`Si prendono due candidati qualsiasi $\boldsymbol{\theta}_1$ e $\boldsymbol{\theta}_2$ con likelihood positiva, il primo migliore del secondo. Nella figura *ML search* (slide p18) sono due campane candidate, e la likelihood è l'altezza di ciascuna sulla verticale dell'osservazione.`,
      },
      {
        latex: md`\frac{d}{du} \ln u = \frac{1}{u} > 0 \quad \text{per } u > 0`,
        why: md`Il logaritmo naturale ha derivata $1/u$, positiva su tutto il suo dominio: è strettamente crescente, *monotonically increasing* nella slide p17.`,
      },
      {
        latex: md`\ln u_1 - \ln u_2 = \frac{u_1 - u_2}{\xi} > 0, \qquad u_1 > u_2 > 0, \;\; \xi \in (u_2, u_1)`,
        why: md`Dalla derivata positiva alla monotonia. Per il teorema di Lagrange (*mean value theorem*) la differenza dei logaritmi è la derivata $1/\xi$, calcolata in un punto intermedio $\xi$, per la differenza degli argomenti: entrambi i fattori sono positivi.`,
      },
      {
        latex: md`\ln p(\mathbf{X} \mid \boldsymbol{\theta}_1) > \ln p(\mathbf{X} \mid \boldsymbol{\theta}_2)`,
        why: md`Si applica il passo precedente con $u_1 = p(\mathbf{X} \mid \boldsymbol{\theta}_1)$ e $u_2 = p(\mathbf{X} \mid \boldsymbol{\theta}_2)$. Una funzione strettamente crescente conserva l'ordine: il candidato migliore per la likelihood resta migliore per la log-likelihood (*log-likelihood*).`,
      },
      {
        latex: md`\ln p(\mathbf{X} \mid \boldsymbol{\theta}_1) > \ln p(\mathbf{X} \mid \boldsymbol{\theta}_2) \;\Rightarrow\; e^{\ln p(\mathbf{X} \mid \boldsymbol{\theta}_1)} > e^{\ln p(\mathbf{X} \mid \boldsymbol{\theta}_2)} \;\Rightarrow\; p(\mathbf{X} \mid \boldsymbol{\theta}_1) > p(\mathbf{X} \mid \boldsymbol{\theta}_2)`,
        why: md`Vale anche il viceversa: l'esponenziale, inversa del logaritmo, è anch'esso strettamente crescente. E poiché il logaritmo è iniettivo, due likelihood uguali hanno logaritmi uguali: l'ordine si conserva nei due versi, pareggi compresi.`,
      },
      {
        latex: md`p(\mathbf{X} \mid \hat{\boldsymbol{\theta}}) \geq p(\mathbf{X} \mid \boldsymbol{\theta}) \;\; \forall \boldsymbol{\theta} \iff \ln p(\mathbf{X} \mid \hat{\boldsymbol{\theta}}) \geq \ln p(\mathbf{X} \mid \boldsymbol{\theta}) \;\; \forall \boldsymbol{\theta}`,
        why: md`Si confronta $\hat{\boldsymbol{\theta}}$ con ogni altro $\boldsymbol{\theta}$: per i due passi precedenti ogni disuguaglianza tra likelihood vale se e solo se vale la stessa tra log-likelihood. Essere massimo globale per una funzione equivale quindi a esserlo per l'altra.`,
      },
      {
        latex: md`\arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta}) = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta})`,
        why: md`I due problemi di massimo hanno lo stesso insieme di soluzioni: è la seconda definizione della slide p17, che le note (p20) scrivono $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \ln\big(p(\mathbf{X} \mid \boldsymbol{\theta})\big)$. Cambia il valore del massimo, non il punto in cui viene raggiunto.`,
      },
      {
        latex: md`\max_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \ln \max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta})`,
        why: md`L'altezza del picco cambia, perché passa per il logaritmo; la sua posizione no. Per la stima serve solo la posizione.`,
      },
      {
        latex: md`\arg\max_{\boldsymbol{\theta}} \left[ a \ln p(\mathbf{X} \mid \boldsymbol{\theta}) + b \right] = \arg\max_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta}), \qquad a > 0, \;\; a, b \text{ indipendenti da } \boldsymbol{\theta}`,
        why: md`Lo stesso argomento vale per qualunque trasformazione strettamente crescente, anche $u \mapsto a u + b$ con $a > 0$. Per questo nei conti si possono togliere dalla log-likelihood le costanti additive e i fattori positivi che non dipendono da $\boldsymbol{\theta}$, come $-N\ln(\sigma\sqrt{2\pi})$ nella [derivata prima per la gaussiana](#derivation:der04).`,
      },
    ],
    conclusion: md`Per qualunque training set likelihood e log-likelihood hanno lo stesso punto di massimo: si può lavorare con il logaritmo, che per scopi analitici (*for analytical purposes*) trasforma i prodotti in somme ed elimina gli esponenziali. Con i numeri della figura *ML search* ($\sigma = 1$, $x_0 = 1$), le likelihood $0.2420$, $0.3989$, $0.3521$ delle campane centrate in $m = 0$, $1$, $1.5$ diventano log-likelihood $-1.419$, $-0.919$, $-1.044$: l'ordine è lo stesso e vince sempre $m = 1 = x_0$. C'è anche un motivo numerico (integrazione): il prodotto di 1000 densità che valgono $0.3$ è circa $10^{-523}$, sotto il più piccolo numero positivo della doppia precisione (circa $5 \cdot 10^{-324}$; i numeri normalizzati arrivano a circa $2 \cdot 10^{-308}$), mentre la somma dei loro logaritmi vale $-1204$, un numero qualunque. Si può provare nel [widget sul logaritmo](#widget:m05-log-likelihood-prodotti-somme).`,
    source: [{ doc: 'ch2', page: 17 }, { doc: 'part1', page: 20 }],
  },

  // --- der02 Dal prodotto alla somma e alle equazioni di verosimiglianza ----------------------------------------------
  {
    id: 'der02',
    title: 'Dal prodotto alla somma e alle equazioni di verosimiglianza',
    goal: md`Mostrare come la likelihood di $N$ campioni iid diventa una somma di log-densità e come da questa si ottiene la condizione operativa «gradiente uguale a zero», cioè le equazioni di verosimiglianza (*likelihood equations*).`,
    assumptions: md`$\mathbf{X} = \{\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_N\}$ è un insieme di campioni iid (slide p9). Il modello $p(\mathbf{x} \mid \boldsymbol{\theta})$ dipende da $r$ parametri, $\boldsymbol{\theta} = (\theta_1, \dots, \theta_r)$, ed è positivo e derivabile rispetto a $\boldsymbol{\theta}$. Il massimo cade all'interno dello spazio dei parametri, non sul suo bordo. La fonte scrive solo l'arg max: i passi con il gradiente sono un'integrazione.`,
    steps: [
      {
        latex: md`p(\mathbf{X} \mid \boldsymbol{\theta}) = p(\mathbf{x}_1, \mathbf{x}_2, \ldots, \mathbf{x}_N \mid \boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
        why: md`I campioni sono indipendenti, quindi la densità congiunta (*joint density*) è il prodotto delle marginali; sono identicamente distribuiti, quindi ogni fattore usa la stessa $p(\cdot \mid \boldsymbol{\theta})$. È la funzione di verosimiglianza (*likelihood function*) della slide p9, che le note (p20) descrivono come *the likelihood function based on the observed data*.`,
      },
      {
        latex: md`\ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \ln \prod_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
        why: md`Si applica il logaritmo ai due membri, lecito perché la likelihood dei candidati che interessano è positiva. Che massimizzare il logaritmo dia lo stesso $\hat{\boldsymbol{\theta}}$ è garantito dalla monotonia ([«il logaritmo non sposta il massimo»](#derivation:der01)).`,
      },
      {
        latex: md`\ln(a\,b) = \ln a + \ln b \;\Rightarrow\; \ln(a_1 a_2 \cdots a_N) = \ln a_1 + \ln a_2 + \cdots + \ln a_N`,
        why: md`Proprietà del logaritmo applicata $N - 1$ volte, un fattore alla volta, con $a_k = p(\mathbf{x}_k \mid \boldsymbol{\theta}) > 0$.`,
      },
      {
        latex: md`\ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \sum_{k=1}^{N} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
        why: md`Il prodotto diventa una somma: *it converts them into sums* (note p20). La log-likelihood è la somma dei contributi dei singoli campioni: ogni campione aggiunge il suo termine.`,
      },
      {
        latex: md`\nabla_{\boldsymbol{\theta}} = \left( \frac{\partial}{\partial \theta_1}, \frac{\partial}{\partial \theta_2}, \ldots, \frac{\partial}{\partial \theta_r} \right)^t`,
        why: md`Il gradiente rispetto al vettore dei parametri raccoglie le $r$ derivate parziali. È lo stesso operatore $\nabla_{\boldsymbol{\theta}}$ che la slide p14 usa nella matrice di informazione di Fisher.`,
      },
      {
        latex: md`\nabla_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \sum_{k=1}^{N} \nabla_{\boldsymbol{\theta}} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})`,
        why: md`Il gradiente è un operatore lineare: il gradiente di una somma è la somma dei gradienti. Ogni campione contribuisce separatamente e non serve la regola del prodotto.`,
      },
      {
        latex: md`\frac{\partial}{\partial \theta_i} \prod_{k=1}^{N} p(\mathbf{x}_k \mid \boldsymbol{\theta}) = \sum_{k=1}^{N} \frac{\partial p(\mathbf{x}_k \mid \boldsymbol{\theta})}{\partial \theta_i} \prod_{j \neq k} p(\mathbf{x}_j \mid \boldsymbol{\theta})`,
        why: md`Confronto: senza logaritmo la derivata della likelihood richiede la regola del prodotto (*product rule*), con $N$ addendi di $N - 1$ fattori ciascuno. È il motivo pratico per cui la slide p17 consiglia la log-likelihood *for analytical purposes*.`,
      },
      {
        latex: md`\frac{\partial p(\mathbf{X} \mid \boldsymbol{\theta})}{\partial \theta_i} = p(\mathbf{X} \mid \boldsymbol{\theta}) \, \frac{\partial \ln p(\mathbf{X} \mid \boldsymbol{\theta})}{\partial \theta_i}`,
        why: md`Derivata del logaritmo con la regola della catena (*chain rule*): $\frac{\partial \ln p}{\partial \theta_i} = \frac{1}{p}\frac{\partial p}{\partial \theta_i}$. Dividendo il passo precedente per la likelihood si ritrova proprio la somma del gradiente. Poiché $p(\mathbf{X} \mid \boldsymbol{\theta}) > 0$, la derivata della likelihood si annulla esattamente dove si annulla quella della log-likelihood: le due funzioni hanno gli stessi punti stazionari.`,
      },
      {
        latex: md`\left. \nabla_{\boldsymbol{\theta}} \ln p(\mathbf{X} \mid \boldsymbol{\theta}) \right|_{\boldsymbol{\theta} = \hat{\boldsymbol{\theta}}} = \mathbf{0}`,
        why: md`Condizione necessaria per un massimo interno di una funzione derivabile: tutte le derivate parziali sono nulle nel punto $\hat{\boldsymbol{\theta}}$. È il modo operativo di calcolare l'arg max della slide p17.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{X} \mid \boldsymbol{\theta})}{\partial \theta_i} = \sum_{k=1}^{N} \frac{\partial \ln p(\mathbf{x}_k \mid \boldsymbol{\theta})}{\partial \theta_i} = 0, \quad i = 1, 2, \ldots, r`,
        why: md`Il vettore nullo scritto componente per componente: $r$ equazioni nelle $r$ incognite $\theta_1, \dots, \theta_r$, le equazioni di verosimiglianza. Per la gaussiana 1-D con varianza nota ($r = 1$) c'è una sola equazione ([«derivata prima per la gaussiana»](#derivation:der04)); con media e varianza incognite ($r = 2$) sono due ([«stima ML della varianza»](#derivation:der05)).`,
      },
      {
        latex: md`\left. \frac{\partial^2 \ln p(\mathbf{X} \mid \theta)}{\partial \theta^2} \right|_{\theta = \hat{\theta}} < 0`,
        why: md`Gradiente nullo è condizione necessaria, non sufficiente: il punto stazionario potrebbe essere un minimo, una sella o un massimo solo locale. Con un parametro si controlla che la derivata seconda in $\hat{\theta}$ sia negativa; con $r$ parametri, che la matrice hessiana (*Hessian matrix*) delle derivate seconde sia definita negativa. Per modelli complessi, come le misture di gaussiane, le equazioni non hanno soluzione in forma chiusa (*closed form*) e la likelihood ha più massimi locali: si usano metodi iterativi come l'algoritmo EM. Se il massimo cade sul bordo dello spazio dei parametri, la derivata non si annulla affatto: per l'uniforme su $[0, \theta]$ la stima è $\hat{\theta} = \max_k x_k$, trovata senza derivate.`,
      },
    ],
    conclusion: md`La ricetta per gli esercizi: 1) scrivi $p(\mathbf{x} \mid \boldsymbol{\theta})$; 2) scrivi la likelihood come prodotto sugli $N$ campioni iid; 3) passa al logaritmo, che trasforma il prodotto in somma; 4) deriva rispetto a ogni parametro e poni a zero, ottenendo le $r$ equazioni di verosimiglianza; 5) risolvi e controlla che il punto trovato sia un massimo. La stessa ricetta è applicata alla Rayleigh in [«stima ML del parametro della Rayleigh»](#derivation:der13) e alla Bernoulli in [«stima ML di una Bernoulli»](#derivation:der14).`,
    source: [{ doc: 'part1', page: 20 }, { doc: 'ch2', page: 17 }, { doc: 'ch2', page: 9 }, { doc: 'ch2', page: 14 }],
  },

  // --- der03 Una sola osservazione: m̂ = x0 --------------------------------------------------------------------------
  {
    id: 'der03',
    title: 'Esempio della fonte svolto analiticamente: una sola osservazione, m̂ = x0',
    goal: md`Ottenere con la derivata prima il risultato che la slide p18 mostra solo graficamente: con una gaussiana 1-D a varianza nota e una sola osservazione $x_0$, la stima ML della media è $\hat{m} = x_0$.`,
    assumptions: md`Gaussiana monodimensionale (*mono-dimensional Gaussian pdf*) con varianza $\sigma^2 > 0$ nota (*known variance*) e media $m$ incognita: il parametro è $\theta = m$. Una sola osservazione (*single observation*) $x_0$, quindi $N = 1$ e $\mathbf{X} = \{x_0\}$. La figura non riporta numeri: dal grafico si leggono $\sigma = 1$ e $x_0 \approx 1$.`,
    steps: [
      {
        latex: md`p(x_0 \mid m) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[ -\frac{(x_0 - m)^2}{2\sigma^2} \right]`,
        why: md`Con $N = 1$ la likelihood è la pdf gaussiana valutata nell'unica osservazione. La variabile è $m$: $\sigma$ è nota e $x_0$ è fissato dai dati.`,
      },
      {
        latex: md`L(m) = p(x_0 \mid m) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[ -\frac{(m - x_0)^2}{2\sigma^2} \right]`,
        why: md`Poiché $(x_0 - m)^2 = (m - x_0)^2$, letta come funzione di $m$ la likelihood è una campana centrata in $x_0$ con la stessa larghezza $\sigma$. È ciò che mostra la figura: ogni candidata della *ML search* è una campana traslata lungo l'asse, e il trattino sulla verticale tratteggiata in $x_0$ ne segna l'altezza $p(x_0 \mid m)$.`,
      },
      {
        latex: md`\ln p(x_0 \mid m) = -\ln\left(\sigma\sqrt{2\pi}\right) - \frac{(x_0 - m)^2}{2\sigma^2}`,
        why: md`Il logaritmo del prodotto è la somma dei logaritmi: $\ln \frac{1}{\sigma\sqrt{2\pi}} = -\ln(\sigma\sqrt{2\pi})$, e il logaritmo dell'esponenziale è il suo argomento. Resta una costante che non dipende da $m$ più una parabola in $m$.`,
      },
      {
        latex: md`\frac{\partial}{\partial m} \left[ -\frac{(x_0 - m)^2}{2\sigma^2} \right] = -\frac{2(x_0 - m) \cdot (-1)}{2\sigma^2}`,
        why: md`Regola della catena: la derivata di $(x_0 - m)^2$ è $2(x_0 - m)$ per la derivata interna di $x_0 - m$ rispetto a $m$, che vale $-1$. La costante $-\ln(\sigma\sqrt{2\pi})$ ha derivata nulla.`,
      },
      {
        latex: md`\frac{\partial}{\partial m} \ln p(x_0 \mid m) = \frac{x_0 - m}{\sigma^2}`,
        why: md`Si semplificano il 2 e i due segni meno. La derivata è positiva per $m < x_0$ e negativa per $m > x_0$: la log-likelihood sale finché la campana si avvicina all'osservazione e scende dopo.`,
      },
      {
        latex: md`\frac{x_0 - \hat{m}}{\sigma^2} = 0 \;\Rightarrow\; \hat{m} = x_0`,
        why: md`Si annulla la derivata prima (equazione di verosimiglianza). Poiché $\sigma^2$ è positiva e finita, l'unica soluzione è $\hat{m} = x_0$: è il risultato $\Rightarrow \hat{m} = x_0$ scritto nella slide p18.`,
      },
      {
        latex: md`\frac{\partial^2}{\partial m^2} \ln p(x_0 \mid m) = -\frac{1}{\sigma^2} < 0`,
        why: md`La derivata seconda è negativa per ogni $m$: la log-likelihood è una parabola rivolta verso il basso, quindi il punto stazionario è l'unico massimo globale.`,
      },
      {
        latex: md`p(x_0 \mid \hat{m}) = \frac{1}{\sigma\sqrt{2\pi}} = 0.3989 \;>\; p(x_0 \mid 1.5) = 0.3521 \;>\; p(x_0 \mid 0) = 0.2420 \qquad (\sigma = 1, \; x_0 = 1)`,
        why: md`Controllo numerico sulla figura. La candidata centrata sull'osservazione ha esponenziale uguale a 1 e raggiunge l'altezza massima $1/\sqrt{2\pi}$. Le altre perdono il fattore $\exp[-(x_0 - m)^2/2]$: $0.8825$ per lo scarto $0.5$, $0.6065$ per lo scarto 1, appena $0.0439$ e $0.0111$ per le campane centrate in $-1.5$ e $-2$ (likelihood $0.0175$ e $0.0044$).`,
      },
      {
        latex: md`\lim_{\sigma \to 0^+} p(x_0 \mid m = x_0, \sigma) = \lim_{\sigma \to 0^+} \frac{1}{\sigma\sqrt{2\pi}} = +\infty`,
        why: md`Perché la slide fissa la varianza: se anche $\sigma$ fosse incognita, con una sola osservazione la campana centrata in $x_0$ potrebbe stringersi senza limite e la likelihood crescerebbe all'infinito. Il massimo non esisterebbe (stima degenere $\hat{\sigma} = 0$): per stimare anche la varianza servono almeno due campioni distinti ([«stima ML della varianza»](#derivation:der05)).`,
      },
    ],
    conclusion: md`Con una sola osservazione e varianza nota, la stima ML della media è l'osservazione stessa: $\hat{m} = x_0$. La *ML search* della figura trasla la campana lungo l'asse finché il suo picco cade su $x_0$, e la derivata conferma che quello è l'unico massimo. Con $N$ campioni la stessa ricerca porta alla media campionaria ([«derivata prima per la gaussiana»](#derivation:der04)); il caso numerico completo è nell'esempio [«ML search con una sola osservazione»](#example:ex01).`,
    source: [{ doc: 'ch2', page: 18 }, { doc: 'part1', page: 20 }],
  },

  // --- der04 Derivata prima per una gaussiana con N campioni ---------------------------------------------------------
  {
    id: 'der04',
    title: 'Derivata prima per una gaussiana con N campioni: la media campionaria',
    goal: md`Sviluppare la derivata prima della log-likelihood gaussiana rispetto alla media, come chiede la domanda d'orale *develop the first derivative for a gaussian and explain the meaning of the result*, e ottenere $\hat{m} = \frac{1}{N}\sum_{k=1}^{N} x_k$.`,
    assumptions: md`$N$ campioni $x_1, \dots, x_N$ iid da una gaussiana monodimensionale con media $m$ incognita e varianza $\sigma^2 > 0$ nota. Unico parametro $\theta = m$. È la generalizzazione dell'esempio della slide p18 da una a $N$ osservazioni; il risultato è quello che la slide p31 enuncia senza dimostrazione.`,
    steps: [
      {
        latex: md`p(\mathbf{X} \mid m) = \prod_{k=1}^{N} \frac{1}{\sigma\sqrt{2\pi}} \exp\left[ -\frac{(x_k - m)^2}{2\sigma^2} \right]`,
        why: md`Likelihood di $N$ campioni iid: prodotto di $N$ gaussiane con la stessa media incognita $m$ e la stessa varianza nota $\sigma^2$, ciascuna valutata nel suo campione.`,
      },
      {
        latex: md`p(\mathbf{X} \mid m) = \frac{1}{\left(\sigma\sqrt{2\pi}\right)^{N}} \exp\left[ -\frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - m)^2 \right]`,
        why: md`Il prodotto di $N$ costanti uguali $1/(\sigma\sqrt{2\pi})$ è la loro potenza $N$-esima; il prodotto di esponenziali è l'esponenziale della somma degli esponenti, $e^{a}e^{b} = e^{a+b}$.`,
      },
      {
        latex: md`\ln p(\mathbf{X} \mid m) = -N \ln\left(\sigma\sqrt{2\pi}\right) - \frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - m)^2`,
        why: md`Il logaritmo trasforma il prodotto in somma: $N$ volte il logaritmo della costante di normalizzazione, $\ln(\sigma\sqrt{2\pi})^{-N} = -N\ln(\sigma\sqrt{2\pi})$, più la somma degli esponenti. Solo il secondo termine dipende da $m$.`,
      },
      {
        latex: md`\frac{\partial}{\partial m} (x_k - m)^2 = 2(x_k - m) \cdot (-1) = -2(x_k - m)`,
        why: md`Derivata di un addendo con la regola della catena: la derivata interna di $x_k - m$ rispetto a $m$ vale $-1$.`,
      },
      {
        latex: md`\frac{\partial}{\partial m} \ln p(\mathbf{X} \mid m) = \frac{1}{\sigma^2} \sum_{k=1}^{N} (x_k - m)`,
        why: md`Si deriva termine a termine rispetto a $m$: la costante sparisce e ogni addendo dà $-\frac{1}{2\sigma^2} \cdot (-2)(x_k - m) = \frac{x_k - m}{\sigma^2}$. Lettura fisica: ogni campione tira la stima verso di sé con una forza proporzionale al suo scarto, come una molla ([widget delle molle](#widget:m05-derivata-nulla-molle)).`,
      },
      {
        latex: md`\sum_{k=1}^{N} (x_k - \hat{m}) = 0 \;\Rightarrow\; \sum_{k=1}^{N} x_k - N\hat{m} = 0`,
        why: md`Si pone la derivata a zero e si moltiplica per $\sigma^2 > 0$: la varianza nota esce di scena. La somma degli scarti dalla stima deve essere nulla (le molle si bilanciano); poi si spezza la somma, perché $\sum_{k=1}^{N} \hat{m} = N\hat{m}$.`,
      },
      {
        latex: md`\hat{m} = \frac{1}{N} \sum_{k=1}^{N} x_k`,
        why: md`Si risolve per $\hat{m}$: è la media campionaria (*sample mean*), la stessa formula che la fonte enuncia nella slide p31 per il vettore medio. Per $N = 1$ si ritrova $\hat{m} = x_0$ della slide p18.`,
      },
      {
        latex: md`\frac{\partial^2}{\partial m^2} \ln p(\mathbf{X} \mid m) = -\frac{N}{\sigma^2} < 0`,
        why: md`Derivata seconda negativa e costante: la log-likelihood è una parabola concava in $m$, quindi il massimo è unico e globale.`,
      },
      {
        latex: md`\arg\max_{m} \ln p(\mathbf{X} \mid m) = \arg\min_{m} \sum_{k=1}^{N} (x_k - m)^2`,
        why: md`Significato del risultato (*explain the meaning of the result*): nella log-likelihood l'unico termine che dipende da $m$ è la somma dei quadrati degli scarti, con il segno meno e il fattore positivo $\frac{1}{2\sigma^2}$. Massimizzare l'una equivale a minimizzare l'altra: con rumore gaussiano la stima ML coincide con i minimi quadrati (*least squares*), e $\hat{m}$ è il baricentro dei campioni.`,
      },
      {
        latex: md`\sum_{k=1}^{N} (x_k - m)^2 = \sum_{k=1}^{N} (x_k - \hat{m})^2 + N(\hat{m} - m)^2`,
        why: md`La stessa conclusione senza derivate. Si scrive $x_k - m = (x_k - \hat{m}) + (\hat{m} - m)$ e si sviluppa il quadrato; il doppio prodotto $2(\hat{m} - m)\sum_{k}(x_k - \hat{m})$ è nullo perché gli scarti da $\hat{m}$ sommano a zero. Il primo addendo non dipende da $m$, il secondo è minimo (zero) solo per $m = \hat{m}$. Ne segue anche che la likelihood, come funzione di $m$, è una campana centrata in $\hat{m}$ e larga $\sigma/\sqrt{N}$ ([«completamento del quadrato»](#derivation:der15)).`,
      },
      {
        latex: md`\nabla_{\mathbf{m}} \ln p(\mathbf{X} \mid \mathbf{m}) = \Sigma^{-1} \sum_{k=1}^{N} (\mathbf{x}_k - \mathbf{m}) = \mathbf{0} \;\Rightarrow\; \hat{\mathbf{m}} = \frac{1}{N} \sum_{k=1}^{N} \mathbf{x}_k`,
        why: md`Lo stesso conto in $n$ dimensioni, con la gaussiana multivariata (note p23) e $\Sigma$ nota. Nella log-likelihood compare $-\frac{1}{2}\sum_{k}(\mathbf{x}_k - \mathbf{m})^t \Sigma^{-1} (\mathbf{x}_k - \mathbf{m})$, il cui gradiente rispetto a $\mathbf{m}$ è $\Sigma^{-1}\sum_{k}(\mathbf{x}_k - \mathbf{m})$ perché $\Sigma^{-1}$ è simmetrica. Moltiplicando a sinistra per $\Sigma$ resta $\sum_{k}\mathbf{x}_k - N\mathbf{m} = \mathbf{0}$: è la stima del vettore medio della slide p31.`,
      },
    ],
    conclusion: md`Per una gaussiana con varianza nota la derivata prima della log-likelihood è $\frac{1}{\sigma^2}\sum_{k}(x_k - m)$; annullarla dà $\hat{m} = \frac{1}{N}\sum_{k=1}^{N} x_k$, la media campionaria, unico massimo perché la derivata seconda vale $-N/\sigma^2$. Significato: gli scarti dalla stima si compensano, ML coincide con i minimi quadrati e, come mostra la [verifica delle proprietà della media campionaria](#derivation:der06), la stima è non distorta ed efficiente. Con le luminosità di cinque salmoni $4.2$, $5.1$, $3.8$, $4.9$, $4.5$: $\hat{m} = 22.5/5 = 4.5$, e gli scarti $-0.3$, $0.6$, $-0.7$, $0.4$, $0$ sommano a zero.`,
    source: [{ doc: 'ch2', page: 18 }, { doc: 'ch2', page: 31 }, { doc: 'part1', page: 20 }, { doc: 'part1', page: 23 }],
  },

  // --- der05 Stima ML della varianza gaussiana e suo bias ------------------------------------------------------------
  {
    id: 'der05',
    title: 'Stima ML della varianza gaussiana e suo bias: (N-1)/N',
    goal: md`Mostrare con un esempio concreto che la stima ML può essere distorta con $N$ finito ma è asintoticamente non distorta: è il caso scalare della relazione $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$ della slide p31.`,
    assumptions: md`$N \geq 2$ campioni iid da una gaussiana monodimensionale con media $m$ e varianza $\sigma^2$ entrambe incognite: $\boldsymbol{\theta} = (m, \sigma^2)$, $r = 2$. Si deriva rispetto alla varianza $\sigma^2$ trattata come variabile, non rispetto alla deviazione standard $\sigma$. Nella seconda parte (il bias) $m$ e $\sigma^2$ indicano i valori veri, e $\hat{m}$, $\hat{\sigma}^2$ sono variabili aleatorie perché dipendono dai campioni.`,
    steps: [
      {
        latex: md`-N \ln\left(\sigma\sqrt{2\pi}\right) = -\frac{N}{2} \ln(2\pi) - \frac{N}{2} \ln \sigma^2`,
        why: md`Si riscrive la costante della [log-likelihood a varianza nota](#derivation:der04) in funzione di $\sigma^2$: $\ln(\sigma\sqrt{2\pi}) = \ln\sigma + \frac{1}{2}\ln(2\pi)$ e $\ln\sigma = \frac{1}{2}\ln\sigma^2$. Ora la costante dipende da un parametro incognito e non si può più scartare.`,
      },
      {
        latex: md`\ln p(\mathbf{X} \mid m, \sigma^2) = -\frac{N}{2} \ln(2\pi) - \frac{N}{2} \ln \sigma^2 - \frac{1}{2\sigma^2} \sum_{k=1}^{N} (x_k - m)^2`,
        why: md`Log-likelihood gaussiana con entrambi i parametri incogniti, scritta in funzione di $\sigma^2$ (si deriva rispetto alla varianza, non alla deviazione standard).`,
      },
      {
        latex: md`\frac{\partial}{\partial m} \ln p(\mathbf{X} \mid m, \sigma^2) = \frac{1}{\sigma^2} \sum_{k=1}^{N} (x_k - m) = 0 \;\Rightarrow\; \hat{m} = \frac{1}{N} \sum_{k=1}^{N} x_k`,
        why: md`Prima equazione di verosimiglianza: è identica al caso a varianza nota, perché il fattore $1/\sigma^2 > 0$ si toglie. La stima della media non dipende da $\sigma^2$ e si risolve per prima.`,
      },
      {
        latex: md`\frac{\partial}{\partial v} \ln v = \frac{1}{v}, \qquad \frac{\partial}{\partial v} \frac{1}{v} = -\frac{1}{v^2}, \qquad v = \sigma^2`,
        why: md`Le due derivate che servono, con la varianza chiamata $v$ per ricordare che la variabile è $\sigma^2$ e non $\sigma$.`,
      },
      {
        latex: md`\frac{\partial}{\partial \sigma^2} \ln p(\mathbf{X} \mid m, \sigma^2) = -\frac{N}{2\sigma^2} + \frac{1}{2\sigma^4} \sum_{k=1}^{N} (x_k - m)^2`,
        why: md`Derivata rispetto a $\sigma^2$: il termine $-\frac{N}{2}\ln\sigma^2$ dà $-\frac{N}{2\sigma^2}$, il termine con $\frac{1}{\sigma^2}$ dà $+\frac{1}{2\sigma^4}$ per la somma dei quadrati, e $-\frac{N}{2}\ln(2\pi)$ è costante.`,
      },
      {
        latex: md`-\frac{N}{2\hat{\sigma}^2} + \frac{1}{2\hat{\sigma}^4} \sum_{k=1}^{N} (x_k - \hat{m})^2 = 0 \;\Rightarrow\; -N\hat{\sigma}^2 + \sum_{k=1}^{N} (x_k - \hat{m})^2 = 0`,
        why: md`Seconda equazione di verosimiglianza, con $m$ già sostituita dalla sua stima $\hat{m}$ (l'equazione per $m$ non dipende da $\sigma^2$). Si moltiplica per $2\hat{\sigma}^4 > 0$.`,
      },
      {
        latex: md`\hat{\sigma}^2 = \frac{1}{N} \sum_{k=1}^{N} (x_k - \hat{m})^2`,
        why: md`Si risolve per $\hat{\sigma}^2$: è la varianza campionaria con $1/N$. Serve $\hat{\sigma}^2 > 0$, cioè almeno due campioni distinti: con $N = 1$ si otterrebbe $\hat{\sigma}^2 = 0$ e la likelihood crescerebbe senza limite, ed è il motivo per cui l'esempio della slide p18 fissa la varianza.`,
      },
      {
        latex: md`\frac{\partial^2 \ln p}{\partial m^2} = -\frac{N}{\sigma^2}, \quad \frac{\partial^2 \ln p}{\partial m \, \partial \sigma^2} = -\frac{1}{\sigma^4} \sum_{k=1}^{N} (x_k - m), \quad \frac{\partial^2 \ln p}{\partial (\sigma^2)^2} = \frac{N}{2\sigma^4} - \frac{1}{\sigma^6} \sum_{k=1}^{N} (x_k - m)^2`,
        why: md`Derivate seconde per il controllo del massimo: si deriva di nuovo ciascuna derivata prima. Per la terza, con $S = \sum_{k}(x_k - m)^2$: $\frac{\partial}{\partial v}\left(-\frac{N}{2v}\right) = \frac{N}{2v^2}$ e $\frac{\partial}{\partial v}\frac{S}{2v^2} = -\frac{S}{v^3}$.`,
      },
      {
        latex: md`\left. \frac{\partial^2 \ln p}{\partial m^2} \right|_{(\hat{m}, \hat{\sigma}^2)} = -\frac{N}{\hat{\sigma}^2}, \quad \left. \frac{\partial^2 \ln p}{\partial m \, \partial \sigma^2} \right|_{(\hat{m}, \hat{\sigma}^2)} = -\frac{1}{\hat{\sigma}^4} \sum_{k=1}^{N} (x_k - \hat{m}) = 0, \quad \left. \frac{\partial^2 \ln p}{\partial (\sigma^2)^2} \right|_{(\hat{m}, \hat{\sigma}^2)} = \frac{N}{2\hat{\sigma}^4} - \frac{N\hat{\sigma}^2}{\hat{\sigma}^6} = -\frac{N}{2\hat{\sigma}^4}`,
        why: md`Controllo del secondo ordine nel punto stazionario: il termine misto è nullo perché la somma degli scarti da $\hat{m}$ è zero; nel terzo elemento si usa $\sum_{k}(x_k - \hat{m})^2 = N\hat{\sigma}^2$.`,
      },
      {
        latex: md`\mathbf{H} = \begin{bmatrix} -\frac{N}{\hat{\sigma}^2} & 0 \\ 0 & -\frac{N}{2\hat{\sigma}^4} \end{bmatrix}`,
        why: md`La matrice hessiana è diagonale con elementi negativi, quindi definita negativa: $(\hat{m}, \hat{\sigma}^2)$ è un massimo. Fin qui la stima; da qui in poi si calcola quanto vale in media.`,
      },
      {
        latex: md`x_k - \hat{m} = (x_k - m) - (\hat{m} - m)`,
        why: md`Ora $m$ è la media vera. Si aggiunge e si toglie $m$ per separare lo scarto del campione dalla media vera e l'errore della stima della media.`,
      },
      {
        latex: md`\sum_{k=1}^{N} (x_k - \hat{m})^2 = \sum_{k=1}^{N} (x_k - m)^2 - 2(\hat{m} - m) \sum_{k=1}^{N} (x_k - m) + N(\hat{m} - m)^2`,
        why: md`Si sviluppa $(a - b)^2 = a^2 - 2ab + b^2$ con $b = \hat{m} - m$, che non dipende da $k$: nel doppio prodotto esce dalla somma, nell'ultimo termine si somma $N$ volte.`,
      },
      {
        latex: md`\sum_{k=1}^{N} (x_k - m) = N\hat{m} - Nm = N(\hat{m} - m)`,
        why: md`Per la definizione di media campionaria, $\sum_{k} x_k = N\hat{m}$.`,
      },
      {
        latex: md`\sum_{k=1}^{N} (x_k - \hat{m})^2 = \sum_{k=1}^{N} (x_k - m)^2 - N(\hat{m} - m)^2`,
        why: md`Identità algebrica: sostituendo il passo precedente, $-2(\hat{m} - m) \cdot N(\hat{m} - m) + N(\hat{m} - m)^2 = -N(\hat{m} - m)^2$. Gli scarti misurati da $\hat{m}$ sono in totale più piccoli di quelli misurati dalla media vera, perché $\hat{m}$ è proprio il valore che minimizza la somma dei quadrati.`,
      },
      {
        latex: md`E\{(x_k - m)^2\} = \sigma^2, \qquad E\{(\hat{m} - m)^2\} = \mathrm{var}\{\hat{m}\} = \frac{\sigma^2}{N}`,
        why: md`Il primo è la definizione di varianza di un campione. Il secondo è la varianza della media campionaria, perché $E\{\hat{m}\} = m$ e $\mathrm{var}\{\hat{m}\} = \sigma^2/N$ ([«proprietà della media campionaria»](#derivation:der06)).`,
      },
      {
        latex: md`E\left\{ \sum_{k=1}^{N} (x_k - \hat{m})^2 \right\} = N\sigma^2 - N \cdot \frac{\sigma^2}{N} = (N-1)\sigma^2`,
        why: md`Si prende il valore atteso, che è lineare: ogni $(x_k - m)^2$ ha media $\sigma^2$, mentre $(\hat{m} - m)^2$ ha media $\mathrm{var}\{\hat{m}\} = \sigma^2/N$.`,
      },
      {
        latex: md`E\{\hat{\sigma}^2\} = \frac{N-1}{N} \sigma^2`,
        why: md`Dividendo per $N$: la stima ML sottostima la varianza del fattore $(N-1)/N$, perché gli scarti sono misurati da $\hat{m}$, che insegue i campioni. È il caso scalare della formula $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$ della slide p31.`,
      },
      {
        latex: md`E\{\hat{\sigma}^2\} - \sigma^2 = \frac{N-1}{N}\sigma^2 - \sigma^2 = -\frac{\sigma^2}{N}`,
        why: md`Il bias (*bias*), cioè il valore medio dell'errore di stima (slide p13), è negativo per ogni $N$ finito: la stima ML della varianza è distorta (*biased*) e in media sottostima.`,
      },
      {
        latex: md`\lim_{N \to +\infty} E\{\hat{\sigma}^2\} = \sigma^2`,
        why: md`Il fattore $(N-1)/N$ tende a 1 e il bias $-\sigma^2/N$ svanisce: la stima è asintoticamente non distorta (*asymptotically unbiased*), come afferma la slide p19 sulle proprietà di ML.`,
      },
      {
        latex: md`E\left\{ \frac{1}{N-1} \sum_{k=1}^{N} (x_k - \hat{m})^2 \right\} = \frac{(N-1)\sigma^2}{N-1} = \sigma^2`,
        why: md`Correggendo il denominatore si ottiene lo stimatore non distorto elementare (*elementary unbiased estimator*) della slide p31, con $\frac{1}{N-1}$ al posto di $\frac{1}{N}$. Non è la stima ML. Il $-1$ conta il grado di libertà speso per stimare $\hat{m}$: gli $N$ scarti da $\hat{m}$ sommano a zero, quindi solo $N - 1$ sono liberi.`,
      },
    ],
    conclusion: md`La stima ML della varianza gaussiana è $\hat{\sigma}^2 = \frac{1}{N}\sum_{k}(x_k - \hat{m})^2$, con valore atteso $\frac{N-1}{N}\sigma^2$: distorta con $N$ finito, asintoticamente non distorta. È l'argomento per rispondere a *Is Maximum Likelihood Estimation a good estimator?*: buona al crescere di $N$, non necessariamente con pochi campioni. Con i cinque salmoni di luminosità $4.2$, $5.1$, $3.8$, $4.9$, $4.5$: somma dei quadrati degli scarti $1.10$, stima ML $1.10/5 = 0.22$, stimatore non distorto $1.10/4 = 0.275$; il rapporto $0.8$ è proprio $(N-1)/N = 4/5$. Con 100 campioni la sottostima media scende all'1% ([«media e varianza ML da cinque salmoni»](#example:ex02)).`,
    source: [{ doc: 'ch2', page: 19 }, { doc: 'ch2', page: 31 }, { doc: 'ch2', page: 13 }, { doc: 'part1', page: 21 }],
  },

  // --- der06 La media campionaria è non distorta, efficiente e consistente --------------------------------------------
  {
    id: 'der06',
    title: 'La media campionaria gaussiana è non distorta, efficiente e consistente',
    goal: md`Verificare sull'esempio più semplice le proprietà elencate nella slide p19 (*ML Estimation: Properties*): qui esiste una stima efficiente, la stima ML è non distorta, e infatti la stima ML coincide con la stima efficiente.`,
    assumptions: md`$N$ campioni $x_1, \dots, x_N$ iid da una gaussiana con media vera $m$ e varianza nota $\sigma^2$. La stima è la media campionaria, ottenuta come stima ML nella [derivata prima per la gaussiana](#derivation:der04). Si usano le definizioni del modulo precedente: errore di stima (slide p12), non distorsione (slide p13), bound di Cramér-Rao e informazione di Fisher (slide p14), efficienza asintotica (slide p15), consistenza (slide p16).`,
    steps: [
      {
        latex: md`\hat{m} = \frac{1}{N} \sum_{k=1}^{N} x_k, \qquad \varepsilon = \hat{m} - m`,
        why: md`La stima dipende dai campioni, quindi è una variabile aleatoria (*the estimate is a random vector*, slide p12): ha una media e una varianza, ed è su queste che la si giudica. $\varepsilon$ è l'errore di stima (*estimation error*).`,
      },
      {
        latex: md`E\{\hat{m}\} = \frac{1}{N} \sum_{k=1}^{N} E\{x_k\} = m`,
        why: md`Linearità del valore atteso e campioni identicamente distribuiti con media $m$: $\frac{1}{N} \cdot Nm = m$. Quindi $E\{\varepsilon\} = 0$: la stima è non distorta (*unbiased*) per ogni $N$, non solo asintoticamente.`,
      },
      {
        latex: md`\mathrm{var}\{\hat{m}\} = \frac{1}{N^2} \sum_{k=1}^{N} \mathrm{var}\{x_k\} = \frac{\sigma^2}{N}`,
        why: md`Si usa $\mathrm{var}\{aY\} = a^2\,\mathrm{var}\{Y\}$ con $a = 1/N$, che esce al quadrato. I campioni sono indipendenti, quindi la varianza della somma è la somma delle $N$ varianze $\sigma^2$. Poiché $m$ è una costante, $\mathrm{var}\{\varepsilon\} = \mathrm{var}\{\hat{m}\}$.`,
      },
      {
        latex: md`E\left\{ \left[ \sum_{k=1}^{N} (x_k - m) \right]^2 \right\} = \sum_{k=1}^{N} \sum_{l=1}^{N} E\{(x_k - m)(x_l - m)\} = \sum_{k=1}^{N} E\{(x_k - m)^2\} = N\sigma^2`,
        why: md`Il conto che serve per l'informazione di Fisher. Il quadrato di una somma è la doppia somma dei prodotti. Per $k \neq l$ i campioni sono indipendenti: il valore atteso del prodotto è il prodotto dei valori attesi, entrambi nulli. Restano gli $N$ termini con $k = l$, ognuno uguale a $\sigma^2$.`,
      },
      {
        latex: md`\mathrm{I}(m) = E\left\{ \left[ \frac{\partial \ln p(\mathbf{X} \mid m)}{\partial m} \right]^2 \right\} = E\left\{ \left[ \frac{1}{\sigma^2} \sum_{k=1}^{N} (x_k - m) \right]^2 \right\} = \frac{N}{\sigma^2}`,
        why: md`Informazione di Fisher (*Fisher information*, definizione della slide p14 con $r = 1$) calcolata con la derivata prima della [log-likelihood gaussiana](#derivation:der04): il valore atteso del quadrato della somma di $N$ scarti indipendenti a media nulla è $N\sigma^2$, diviso per $\sigma^4$.`,
      },
      {
        latex: md`\mathrm{var}\{\hat{m}\} = \frac{\sigma^2}{N} = \mathrm{I}^{-1}(m)`,
        why: md`La varianza della stima coincide con il bound di Cramér-Rao: la media campionaria è efficiente (*efficient*). Poiché è anche la stima ML ed è non distorta, è un esempio concreto del teorema della slide p19: [«la stima efficiente, se esiste, è quella ML»](#derivation:der07).`,
      },
      {
        latex: md`\frac{\mathrm{var}\{\varepsilon\}}{\mathrm{I}^{-1}(m)} = \frac{\sigma^2/N}{\sigma^2/N} = 1 \quad \forall N`,
        why: md`Il rapporto della definizione di efficienza asintotica (*asymptotically efficient*, slide p15) vale 1 per ogni $N$ finito, quindi anche al limite: una stima efficiente è anche asintoticamente efficiente.`,
      },
      {
        latex: md`P\{|\hat{m} - E\{\hat{m}\}| \geq \delta\} \leq \frac{\mathrm{var}\{\hat{m}\}}{\delta^2} \quad \forall \delta > 0`,
        why: md`Disuguaglianza di Chebyshev (*Chebyshev's inequality*): vale per qualunque variabile aleatoria con varianza finita e limita la probabilità di allontanarsi dalla propria media di almeno $\delta$.`,
      },
      {
        latex: md`P\{|\hat{m} - m| < \delta\} \geq 1 - \frac{\sigma^2}{N\delta^2} \;\xrightarrow{\; N \to +\infty \;}\; 1`,
        why: md`Si sostituiscono $E\{\hat{m}\} = m$ e $\mathrm{var}\{\hat{m}\} = \sigma^2/N$, e si passa all'evento complementare, $P\{|\hat{m} - m| < \delta\} = 1 - P\{|\hat{m} - m| \geq \delta\}$. La probabilità di un errore minore di $\delta$ tende a 1 per ogni $\delta > 0$: è la definizione di consistenza (*consistent*) della slide p16.`,
      },
      {
        latex: md`\lim_{N \to +\infty} E\{\hat{m}\} = m, \qquad \lim_{N \to +\infty} \mathrm{var}\{\hat{m}\} = \lim_{N \to +\infty} \frac{\sigma^2}{N} = 0`,
        why: md`È la coppia «asintoticamente non distorta e varianza che tende a zero» che la slide p16 chiama condizione necessaria (*necessary condition*) per la consistenza. Il passo di Chebyshev mostra che qui basta a garantirla: in generale è una condizione sufficiente, non necessaria ([«condizione sufficiente per la consistenza»](#derivation:der16)).`,
      },
    ],
    conclusion: md`La media campionaria gaussiana è non distorta per ogni $N$, ha varianza $\sigma^2/N$ uguale al bound di Cramér-Rao (quindi è efficiente e asintoticamente efficiente) ed è consistente. Qui la stima efficiente esiste e coincide con la stima ML, come prevede la slide p19. Esempio con la luminosità dei salmoni, $\sigma^2 = 0.25$ e $N = 25$: $\mathrm{var}\{\hat{m}\} = 0.01$, deviazione standard $0.1$; per $\delta = 0.3$ Chebyshev garantisce $P\{|\hat{m} - m| < 0.3\} \geq 1 - \frac{0.25}{25 \cdot 0.09} = 0.889$, che con $N = 100$ sale a $0.972$.`,
    source: [
      { doc: 'ch2', page: 19 },
      { doc: 'part1', page: 21 },
      { doc: 'ch2', page: 12 },
      { doc: 'ch2', page: 13 },
      { doc: 'ch2', page: 14 },
      { doc: 'ch2', page: 15 },
      { doc: 'ch2', page: 16 },
    ],
  },

  // --- der07 La stima efficiente, se esiste, è quella ML --------------------------------------------------------------
  {
    id: 'der07',
    title: 'Perché la stima efficiente, se esiste, è quella ML (traccia della dimostrazione)',
    goal: md`Dare il ragionamento dietro l'*it can be shown that* della slide p19, nel caso di un parametro scalare: se esiste una stima efficiente, annullare la derivata della log-likelihood porta proprio a lei, quindi la stima ML è la stima efficiente. È un'integrazione: la fonte enuncia il risultato senza dimostrarlo.`,
    assumptions: md`Un solo parametro $\theta$. Le ipotesi su $p(\mathbf{x} \mid \theta)$ che la slide non elenca (*in certain hypotheses regarding p(x|θ)*) sono le condizioni di regolarità del bound di Cramér-Rao: densità positiva e derivabile in $\theta$, supporto che non dipende da $\theta$, derivata e integrale scambiabili, informazione di Fisher finita e positiva. Esiste una stima efficiente $\hat{\theta}_{eff}(\mathbf{X})$: non distorta, con varianza uguale al bound $\mathrm{I}^{-1}(\theta)$ per ogni valore di $\theta$. Il massimo della likelihood è interno allo spazio dei parametri.`,
    steps: [
      {
        latex: md`s(\theta) = \frac{\partial \ln p(\mathbf{X} \mid \theta)}{\partial \theta}, \qquad E\{s(\theta)\} = \int \frac{\partial p(\mathbf{X} \mid \theta)}{\partial \theta}\, d\mathbf{X} = \frac{\partial}{\partial \theta} \int p(\mathbf{X} \mid \theta)\, d\mathbf{X} = \frac{\partial 1}{\partial \theta} = 0`,
        why: md`La derivata della log-likelihood si chiama *score*. Ha media nulla: nel valore atteso $p \cdot \frac{\partial \ln p}{\partial \theta} = \frac{\partial p}{\partial \theta}$, la derivata esce dall'integrale (ipotesi di regolarità) e l'integrale di una densità vale 1 per ogni $\theta$.`,
      },
      {
        latex: md`E\{(\hat{\theta}_{eff} - \theta)\, s(\theta)\} = \int \hat{\theta}_{eff}(\mathbf{X})\, \frac{\partial p(\mathbf{X} \mid \theta)}{\partial \theta}\, d\mathbf{X} - \theta\, E\{s(\theta)\} = \frac{\partial}{\partial \theta} E\{\hat{\theta}_{eff}\} = \frac{\partial \theta}{\partial \theta} = 1`,
        why: md`Si parte dalla non distorsione, $E\{\hat{\theta}_{eff}\} = \int \hat{\theta}_{eff}(\mathbf{X})\, p(\mathbf{X} \mid \theta)\, d\mathbf{X} = \theta$ per ogni $\theta$, e la si deriva: la stima dipende dai dati e non da $\theta$, quindi la derivata tocca solo la densità. Il termine $\theta\,E\{s\}$ è nullo per il passo precedente.`,
      },
      {
        latex: md`1 = \left( E\{(\hat{\theta}_{eff} - \theta)\, s(\theta)\} \right)^2 \leq E\{(\hat{\theta}_{eff} - \theta)^2\}\; E\{s^2(\theta)\} = \mathrm{var}\{\varepsilon\}\, \mathrm{I}(\theta)`,
        why: md`Disuguaglianza di Cauchy-Schwarz (*Cauchy-Schwarz inequality*) $(E\{UV\})^2 \leq E\{U^2\}\,E\{V^2\}$, con $U$ l'errore di stima e $V$ lo score. Il primo fattore è la varianza dell'errore (la stima è non distorta), il secondo è l'informazione di Fisher della slide p14. Dividendo per $\mathrm{I}(\theta)$ si ottiene il bound $\mathrm{var}\{\varepsilon\} \geq \mathrm{I}^{-1}(\theta)$; tutti i passaggi sono nello [«schizzo della dimostrazione del bound»](/m/m04-bonta-stimatori/teoria#derivation:der09) del foglio sulla bontà degli stimatori.`,
      },
      {
        latex: md`\mathrm{var}\{\varepsilon\} = \mathrm{I}^{-1}(\theta) \iff s(\theta) = a(\theta)\,\left[ \hat{\theta}_{eff}(\mathbf{X}) - \theta \right]`,
        why: md`In Cauchy-Schwarz vale l'uguaglianza solo quando le due variabili sono proporzionali. La stima efficiente raggiunge il bound per definizione, quindi lo score deve essere un multiplo dell'errore, con un coefficiente $a(\theta)$ che può dipendere da $\theta$ ma non dai dati.`,
      },
      {
        latex: md`1 = E\{(\hat{\theta}_{eff} - \theta)\, a(\theta)\, (\hat{\theta}_{eff} - \theta)\} = a(\theta)\, \mathrm{var}\{\varepsilon\} = \frac{a(\theta)}{\mathrm{I}(\theta)} \;\Rightarrow\; a(\theta) = \mathrm{I}(\theta)`,
        why: md`Si sostituisce la forma proporzionale nell'identità $E\{(\hat{\theta}_{eff} - \theta)\,s\} = 1$ e si usa $\mathrm{var}\{\varepsilon\} = \mathrm{I}^{-1}(\theta)$: la costante di proporzionalità è l'informazione di Fisher.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{X} \mid \theta)}{\partial \theta} = \mathrm{I}(\theta) \left[ \hat{\theta}_{eff}(\mathbf{X}) - \theta \right] \quad \forall \theta`,
        why: md`È il punto di arrivo dei passi precedenti: il bound di Cramér-Rao nasce da una disuguaglianza di Cauchy-Schwarz tra la derivata della log-likelihood e l'errore di stima, e l'uguaglianza (stima efficiente) vale se e solo se le due quantità sono proporzionali; sotto le ipotesi di regolarità la costante di proporzionalità è l'informazione di Fisher. L'identità vale per ogni valore di $\theta$, non solo per quello vero.`,
      },
      {
        latex: md`\left. \frac{\partial \ln p(\mathbf{X} \mid \theta)}{\partial \theta} \right|_{\theta = \hat{\theta}_{ML}} = 0`,
        why: md`La stima ML, se il massimo è interno, annulla la derivata prima della log-likelihood: è l'equazione di verosimiglianza ([«dal prodotto alla somma e alle equazioni di verosimiglianza»](#derivation:der02)).`,
      },
      {
        latex: md`\mathrm{I}(\hat{\theta}_{ML}) \left[ \hat{\theta}_{eff}(\mathbf{X}) - \hat{\theta}_{ML} \right] = 0`,
        why: md`Poiché l'identità vale per ogni $\theta$, la si valuta nel punto $\theta = \hat{\theta}_{ML}$: il membro sinistro è zero per il passo precedente.`,
      },
      {
        latex: md`\mathrm{I}(\theta) > 0 \;\Rightarrow\; \hat{\theta}_{ML} = \hat{\theta}_{eff}(\mathbf{X})`,
        why: md`L'informazione di Fisher è positiva, quindi deve annullarsi la parentesi: la stima ML coincide con la stima efficiente. Le *certain hypotheses regarding p(x|θ)* della slide sono le condizioni di regolarità usate nei primi passi. La non distorsione di ML richiesta dalla slide è coerente con il risultato: una stima efficiente è non distorta per definizione, e qui la stima ML è proprio lei.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{X} \mid \theta)}{\partial \theta} = \mathrm{I}(\theta)\,\left[ \hat{\theta}_{eff}(\mathbf{X}) - \theta \right] \; \begin{cases} > 0, & \theta < \hat{\theta}_{eff}(\mathbf{X}) \\ < 0, & \theta > \hat{\theta}_{eff}(\mathbf{X}) \end{cases}`,
        why: md`Il punto stazionario è anche il massimo globale: la log-likelihood cresce finché $\theta$ è sotto $\hat{\theta}_{eff}$ e decresce dopo. Quindi l'arg max della slide p17 cade proprio su $\hat{\theta}_{eff}(\mathbf{X})$, e non ci sono altri punti stazionari tra cui scegliere.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{X} \mid m)}{\partial m} = \frac{1}{\sigma^2} \sum_{k=1}^{N} (x_k - m) = \frac{N}{\sigma^2}\,(\hat{m} - m) = \mathrm{I}(m)\,(\hat{m} - m)`,
        why: md`Controllo sulla gaussiana a varianza nota: lo score della [derivata prima per la gaussiana](#derivation:der04) ha esattamente la forma dell'identità, perché $\sum_{k} x_k = N\hat{m}$, con $\mathrm{I}(m) = N/\sigma^2$ e stima efficiente $\hat{m}$ ([«proprietà della media campionaria»](#derivation:der06)).`,
      },
    ],
    conclusion: md`Se una stima efficiente esiste, lo score è $\mathrm{I}(\theta)\,[\hat{\theta}_{eff}(\mathbf{X}) - \theta]$ e si annulla solo in $\theta = \hat{\theta}_{eff}(\mathbf{X})$, che è anche il massimo della likelihood: la stima ML è la stima efficiente, e non serve cercare altrove lo stimatore ottimo. Spesso però con $N$ finito una stima efficiente non esiste: con media incognita nessuno stimatore non distorto della varianza gaussiana raggiunge il suo bound $2\sigma^4/N$, e la [stima ML della varianza](#derivation:der05) è addirittura distorta. Restano le proprietà asintotiche della slide p19, spiegate in [«perché ML ha le tre proprietà asintotiche»](#derivation:der17).`,
    source: [{ doc: 'ch2', page: 19 }, { doc: 'part1', page: 20 }, { doc: 'ch2', page: 14 }],
  },

  // --- der08 Le due forme della matrice di covarianza -----------------------------------------------------------------
  {
    id: 'der08',
    title: 'Le due forme della matrice di covarianza',
    goal: md`Dimostrare l'uguaglianza $E\{(\mathbf{x} - \mathbf{m})(\mathbf{x} - \mathbf{m})^t\} = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$ scritta nelle note (p24) e nella slide p27, e la sua versione campionaria usata nella stima ML della covarianza (slide p31).`,
    assumptions: md`$\mathbf{x} = (x_1, \dots, x_n)^t$ è un vettore aleatorio di feature (vettore colonna) con vettore medio $\mathbf{m} = E\{\mathbf{x}\}$ e momenti secondi finiti. L'apice $t$ indica il trasposto. Il valore atteso di una matrice si calcola elemento per elemento, quindi è lineare e commuta con la trasposizione.`,
    steps: [
      {
        latex: md`\Sigma = E\{(\mathbf{x} - \mathbf{m})(\mathbf{x} - \mathbf{m})^t\}`,
        why: md`Definizione della matrice di covarianza (*covariance matrix*) $\Sigma = \mathrm{Cov}\{\mathbf{x}\}$ come valore atteso del prodotto esterno (*outer product*) degli scarti: una colonna $n \times 1$ per una riga $1 \times n$ dà una matrice $n \times n$.`,
      },
      {
        latex: md`[\Sigma]_{ij} = E\{(x_i - m_i)(x_j - m_j)\}, \qquad [\Sigma]_{ii} = \sigma_i^2`,
        why: md`L'elemento $(i, j)$ del prodotto esterno $\mathbf{u}\mathbf{v}^t$ è $u_i v_j$. Sulla diagonale ci sono le varianze delle singole feature, fuori diagonale le covarianze tra coppie di feature: *it captures both the variance of each feature and the covariance between different features* (note p24).`,
      },
      {
        latex: md`\Sigma = E\{\mathbf{x}\mathbf{x}^t - \mathbf{x}\mathbf{m}^t - \mathbf{m}\mathbf{x}^t + \mathbf{m}\mathbf{m}^t\}`,
        why: md`Si sviluppa il prodotto con la proprietà distributiva rispettando l'ordine dei fattori, perché sono vettori: il prodotto tra matrici non è commutativo, e $\mathbf{x}\mathbf{m}^t$ è in generale diversa da $\mathbf{m}\mathbf{x}^t$ (una è la trasposta dell'altra).`,
      },
      {
        latex: md`\Sigma = E\{\mathbf{x}\mathbf{x}^t\} - E\{\mathbf{x}\}\mathbf{m}^t - \mathbf{m}E\{\mathbf{x}^t\} + \mathbf{m}\mathbf{m}^t`,
        why: md`Linearità del valore atteso: la media di una somma è la somma delle medie. $\mathbf{m}$ è un vettore deterministico e si porta fuori dall'operatore $E$, a destra o a sinistra secondo la sua posizione.`,
      },
      {
        latex: md`E\{\mathbf{x}^t\} = \left( E\{\mathbf{x}\} \right)^t = \mathbf{m}^t`,
        why: md`Il valore atteso agisce elemento per elemento, quindi trasporre prima o dopo è lo stesso.`,
      },
      {
        latex: md`\Sigma = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t - \mathbf{m}\mathbf{m}^t + \mathbf{m}\mathbf{m}^t`,
        why: md`Si sostituisce $E\{\mathbf{x}\} = \mathbf{m}$, la definizione del vettore medio (*mean vector*).`,
      },
      {
        latex: md`\Sigma = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t`,
        why: md`Due dei tre termini $\mathbf{m}\mathbf{m}^t$ si elidono: resta la seconda forma, «media dei prodotti meno prodotto delle medie», versione matriciale di $\mathrm{var} = E\{x^2\} - (E\{x\})^2$.`,
      },
      {
        latex: md`n = 1: \quad \sigma^2 = E\{(x - m)^2\} = E\{x^2\} - m^2`,
        why: md`Con una sola feature la matrice diventa un numero: si ritrova la formula scalare della varianza.`,
      },
      {
        latex: md`[\Sigma]_{ij} = E\{x_i x_j\} - m_i m_j`,
        why: md`La stessa identità letta elemento per elemento: la covarianza di due feature è la media del loro prodotto meno il prodotto delle loro medie.`,
      },
      {
        latex: md`\frac{1}{N} \sum_{k=1}^{N} (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t = \frac{1}{N} \sum_{k=1}^{N} \mathbf{x}_k \mathbf{x}_k^t - \hat{\mathbf{m}} \left( \frac{1}{N} \sum_{k=1}^{N} \mathbf{x}_k \right)^t - \left( \frac{1}{N} \sum_{k=1}^{N} \mathbf{x}_k \right) \hat{\mathbf{m}}^t + \hat{\mathbf{m}}\hat{\mathbf{m}}^t`,
        why: md`Versione campionaria: al posto del valore atteso c'è la media aritmetica sui campioni, al posto di $\mathbf{m}$ la stima $\hat{\mathbf{m}}$. Si sviluppa il prodotto come prima e si porta $\hat{\mathbf{m}}$, che non dipende da $k$, fuori dalla somma.`,
      },
      {
        latex: md`\hat{\Sigma} = \frac{1}{N} \sum_{k=1}^{N} (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t = \frac{1}{N} \sum_{k=1}^{N} \mathbf{x}_k \mathbf{x}_k^t - \hat{\mathbf{m}}\hat{\mathbf{m}}^t`,
        why: md`Poiché $\frac{1}{N}\sum_{k}\mathbf{x}_k = \hat{\mathbf{m}}$, i due termini centrali valgono $-\hat{\mathbf{m}}\hat{\mathbf{m}}^t$ ciascuno, e uno dei due si elide con $+\hat{\mathbf{m}}\hat{\mathbf{m}}^t$: sono le due forme della stima ML della covarianza nella slide p31.`,
      },
    ],
    conclusion: md`La covarianza è «media dei prodotti esterni meno prodotto esterno delle medie», $\Sigma = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$, e lo stesso vale per la stima campionaria. Con quattro salmoni (luminosità, larghezza) $(4, 9)$, $(5, 11)$, $(4, 10)$, $(5, 12)$ e $\mathbf{m} = (4.5, 10.5)^t$: la prima forma dà $\Sigma_{11} = 0.25$, $\Sigma_{22} = 1.25$, $\Sigma_{12} = 0.5$; la seconda dà $20.5 - 20.25$, $111.5 - 110.25$ e $47.75 - 47.25$, cioè gli stessi numeri ([«le due formule della covarianza sugli stessi dati»](#example:ex07)).`,
    source: [{ doc: 'part1', page: 24 }, { doc: 'ch2', page: 27 }, { doc: 'ch2', page: 31 }],
  },

  // --- der09 Σ simmetrica e semidefinita positiva ---------------------------------------------------------------------
  {
    id: 'der09',
    title: 'Σ è simmetrica e semidefinita positiva, quindi ha autovalori non negativi',
    goal: md`Giustificare le due proprietà elencate nelle note (p24) e nella slide p27, $\Sigma = \Sigma^t$ e $\Sigma$ semidefinita positiva, e il legame «semidefinita positiva, quindi autovalori non negativi, quindi varianza mai negativa».`,
    assumptions: md`$\Sigma = E\{(\mathbf{x} - \mathbf{m})(\mathbf{x} - \mathbf{m})^t\}$ come nelle [due forme della matrice di covarianza](#derivation:der08). $\mathbf{a} \in \Re^n$ è un vettore costante qualsiasi, cioè una direzione su cui proiettare i dati; $\mathbf{e}_i$ e $\lambda_i$ sono gli autovettori (*eigenvectors*) e gli autovalori (*eigenvalues*) di $\Sigma$.`,
    steps: [
      {
        latex: md`(\mathbf{u}\mathbf{v}^t)^t = \mathbf{v}\mathbf{u}^t, \qquad (E\{A\})^t = E\{A^t\}`,
        why: md`Due regole: il trasposto di un prodotto inverte l'ordine dei fattori, ciascuno trasposto; il valore atteso agisce elemento per elemento, quindi commuta con la trasposizione.`,
      },
      {
        latex: md`\Sigma^t = E\{[(\mathbf{x} - \mathbf{m})(\mathbf{x} - \mathbf{m})^t]^t\} = E\{(\mathbf{x} - \mathbf{m})(\mathbf{x} - \mathbf{m})^t\} = \Sigma`,
        why: md`Si applicano le due regole con $\mathbf{u} = \mathbf{v} = \mathbf{x} - \mathbf{m}$: il prodotto esterno di un vettore con sé stesso è uguale al suo trasposto, quindi $\Sigma$ è simmetrica (*symmetric*).`,
      },
      {
        latex: md`[\Sigma]_{ij} = E\{(x_i - m_i)(x_j - m_j)\} = E\{(x_j - m_j)(x_i - m_i)\} = [\Sigma]_{ji}`,
        why: md`Lo stesso fatto elemento per elemento: il prodotto di due numeri commuta, quindi la covarianza tra $x_i$ e $x_j$ è quella tra $x_j$ e $x_i$.`,
      },
      {
        latex: md`(\mathbf{x} - \mathbf{m})^t \mathbf{a} = \mathbf{a}^t (\mathbf{x} - \mathbf{m}) = \sum_{i=1}^{n} a_i (x_i - m_i)`,
        why: md`$\mathbf{a}^t(\mathbf{x} - \mathbf{m})$ è un prodotto scalare, cioè un numero, e un numero è uguale al suo trasposto.`,
      },
      {
        latex: md`\mathbf{a}^t \Sigma \mathbf{a} = E\{\mathbf{a}^t (\mathbf{x} - \mathbf{m})(\mathbf{x} - \mathbf{m})^t \mathbf{a}\} = E\{[\mathbf{a}^t (\mathbf{x} - \mathbf{m})]^2\}`,
        why: md`Si porta il vettore costante $\mathbf{a}$ dentro il valore atteso (linearità) e si usa il passo precedente: il prodotto è lo scalare $\mathbf{a}^t(\mathbf{x} - \mathbf{m})$ per sé stesso, cioè il suo quadrato.`,
      },
      {
        latex: md`E\{\mathbf{a}^t \mathbf{x}\} = \mathbf{a}^t \mathbf{m} \;\Rightarrow\; \mathbf{a}^t (\mathbf{x} - \mathbf{m}) = \mathbf{a}^t \mathbf{x} - E\{\mathbf{a}^t \mathbf{x}\}`,
        why: md`La proiezione $\mathbf{a}^t\mathbf{x}$ dei dati sulla direzione $\mathbf{a}$ è una variabile aleatoria scalare con media $\mathbf{a}^t\mathbf{m}$: $\mathbf{a}^t(\mathbf{x} - \mathbf{m})$ è il suo scarto dalla media.`,
      },
      {
        latex: md`\mathbf{a}^t \Sigma \mathbf{a} = \mathrm{var}\{\mathbf{a}^t \mathbf{x}\} \geq 0 \quad \forall \mathbf{a}`,
        why: md`Il valore atteso del quadrato dello scarto dalla media è la varianza, e il valore atteso di un quadrato non può essere negativo: è la varianza dei dati proiettati sulla direzione $\mathbf{a}$. $\mathbf{a}^t\Sigma\mathbf{a} \geq 0$ per ogni $\mathbf{a}$ è la definizione di matrice semidefinita positiva (*positive semi-definite*). Il verso logico è questo: $\Sigma$ è semidefinita positiva perché ogni varianza è non negativa per costruzione; le note (*this ensures that the variance is always non-negative*) leggono la stessa equivalenza nell'altro verso.`,
      },
      {
        latex: md`\mathbf{a} = \mathbf{u}_i \;\Rightarrow\; \mathbf{u}_i^t \Sigma \mathbf{u}_i = [\Sigma]_{ii} = \sigma_i^2 = \mathrm{var}\{x_i\} \geq 0`,
        why: md`Caso particolare: con $\mathbf{u}_i$, il vettore con 1 in posizione $i$ e 0 altrove, la proiezione è la feature $x_i$ stessa, e si ritrovano le varianze sulla diagonale.`,
      },
      {
        latex: md`\Sigma = \Sigma^t \;\Rightarrow\; \Sigma = \sum_{i=1}^{n} \lambda_i\, \mathbf{e}_i \mathbf{e}_i^t, \qquad \lambda_i \in \Re, \qquad \mathbf{e}_i^t \mathbf{e}_j = \begin{cases} 1, & i = j \\ 0, & i \neq j \end{cases}`,
        why: md`Teorema spettrale (*spectral theorem*): una matrice reale simmetrica ha autovalori reali e una base ortonormale di autovettori. Ecco perché la simmetria viene prima: garantisce che gli autovalori siano numeri reali, di cui ha senso chiedere il segno.`,
      },
      {
        latex: md`\Sigma \mathbf{e}_i = \lambda_i \mathbf{e}_i, \;\; \mathbf{e}_i^t \mathbf{e}_i = 1 \;\Rightarrow\; \lambda_i = \mathbf{e}_i^t \Sigma \mathbf{e}_i \geq 0`,
        why: md`Si sceglie come direzione un autovettore normalizzato: $\mathbf{e}_i^t\Sigma\mathbf{e}_i = \lambda_i\,\mathbf{e}_i^t\mathbf{e}_i = \lambda_i$. Ogni autovalore è la varianza dei dati lungo il suo autovettore, quindi è non negativo: *all its eigenvalues are non-negative. This ensures that the variance is always non-negative* (note p24).`,
      },
      {
        latex: md`\mathbf{a}^t \Sigma \mathbf{a} = \sum_{i=1}^{n} \lambda_i \left( \mathbf{e}_i^t \mathbf{a} \right)^2 \geq 0 \quad \text{se } \lambda_i \geq 0 \;\; \forall i`,
        why: md`Il viceversa, con la scomposizione spettrale: $\mathbf{a}^t(\lambda_i\mathbf{e}_i\mathbf{e}_i^t)\mathbf{a} = \lambda_i(\mathbf{e}_i^t\mathbf{a})^2$. Se tutti gli autovalori sono non negativi, ogni forma quadratica lo è. Per una matrice simmetrica «semidefinita positiva» e «autovalori non negativi» sono quindi la stessa cosa: è il *meaning* delle note.`,
      },
      {
        latex: md`|\Sigma| = \prod_{i=1}^{n} \lambda_i \geq 0`,
        why: md`Il determinante è il prodotto degli autovalori. Se un autovalore è nullo, lungo il suo autovettore i dati non variano: la combinazione lineare $\mathbf{e}_i^t\mathbf{x}$ è costante, cioè una feature si ricava esattamente dalle altre. Allora $|\Sigma| = 0$, $\Sigma^{-1}$ non esiste e la formula della gaussiana multivariata perde senso. Per quella formula serve $\Sigma$ definita positiva, con tutti gli autovalori strettamente positivi.`,
      },
    ],
    conclusion: md`$\Sigma$ è simmetrica perché la covarianza tra due feature non dipende dall'ordine, ed è semidefinita positiva perché $\mathbf{a}^t\Sigma\mathbf{a}$ è la varianza dei dati proiettati sulla direzione $\mathbf{a}$. Gli autovalori sono le varianze lungo gli autovettori e quindi non sono mai negativi; l'autovettore dell'autovalore più grande è la direzione di massima varianza, che diventa l'asse maggiore delle ellissi di isolivello ([«isolivelli ellittici»](#derivation:der11)). Con la covarianza dei quattro salmoni, $\Sigma_{11} = 0.25$, $\Sigma_{12} = 0.5$, $\Sigma_{22} = 1.25$: autovalori $(1.5 \pm \sqrt{2})/2$, cioè $1.457$ e $0.043$, entrambi positivi, con prodotto $0.0625 = |\Sigma|$; lungo $\mathbf{a} = (1, -1)^t$ la varianza è $0.25 - 2 \cdot 0.5 + 1.25 = 0.5$. Si può esplorare nel [widget delle proiezioni](#widget:m05-semidefinita-positiva-proiezioni).`,
    source: [{ doc: 'part1', page: 24 }, { doc: 'ch2', page: 27 }],
  },

  // --- der10 Σ diagonale: la gaussiana multivariata si fattorizza ----------------------------------------------------
  {
    id: 'der10',
    title: 'Con Σ diagonale la gaussiana multivariata si fattorizza',
    goal: md`Ricavare $p(\mathbf{x}) = p(x_1)\,p(x_2) \ldots p(x_n)$ dalla formula della gaussiana multivariata quando le feature sono indipendenti e $\Sigma$ è diagonale, come affermano le note (p24) e la slide p27.`,
    assumptions: md`$\mathbf{x}$ segue la gaussiana multivariata $N(\mathbf{m}, \Sigma)$ delle note (p23). Le feature sono indipendenti, quindi $\Sigma$ è diagonale con le varianze $\sigma_i^2 > 0$ sulla diagonale; il perché di questa implicazione è in [«feature indipendenti, covarianze nulle»](#derivation:der19).`,
    steps: [
      {
        latex: md`p(\mathbf{x} \mid \theta) = p(\mathbf{x} \mid \mathbf{m}, \Sigma) = \frac{1}{(2\pi)^{n/2} |\Sigma|^{1/2}} \exp\left[ -\frac{1}{2} (\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m}) \right]`,
        why: md`Punto di partenza: la pdf gaussiana multivariata (*multivariate Gaussian pdf*), con la costante di normalizzazione e la forma quadratica all'esponente.`,
      },
      {
        latex: md`\Sigma = \mathrm{diag}(\sigma_1^2, \ldots, \sigma_n^2) \;\Rightarrow\; |\Sigma| = \prod_{i=1}^{n} \sigma_i^2, \quad \Sigma^{-1} = \mathrm{diag}\left( \frac{1}{\sigma_1^2}, \ldots, \frac{1}{\sigma_n^2} \right)`,
        why: md`Per una matrice diagonale il determinante è il prodotto degli elementi diagonali e l'inversa si ottiene invertendo ciascun elemento: il prodotto $\Sigma\,\Sigma^{-1}$ ha $\sigma_i^2 \cdot \frac{1}{\sigma_i^2} = 1$ sulla diagonale e zero altrove.`,
      },
      {
        latex: md`\Sigma^{-1} (\mathbf{x} - \mathbf{m}) = \left( \frac{x_1 - m_1}{\sigma_1^2}, \ldots, \frac{x_n - m_n}{\sigma_n^2} \right)^t`,
        why: md`Una matrice diagonale per un vettore moltiplica ogni componente per il suo elemento diagonale.`,
      },
      {
        latex: md`(\mathbf{x} - \mathbf{m})^t \Sigma^{-1} (\mathbf{x} - \mathbf{m}) = \sum_{i=1}^{n} \frac{(x_i - m_i)^2}{\sigma_i^2}`,
        why: md`Il prodotto scalare di $(\mathbf{x} - \mathbf{m})^t$ con il vettore del passo precedente somma i termini $(x_i - m_i) \cdot \frac{x_i - m_i}{\sigma_i^2}$: con $\Sigma^{-1}$ diagonale la forma quadratica perde tutti i termini misti e resta la somma degli scarti standardizzati al quadrato.`,
      },
      {
        latex: md`(2\pi)^{n/2} |\Sigma|^{1/2} = \prod_{i=1}^{n} \sigma_i \sqrt{2\pi}`,
        why: md`La radice del determinante è il prodotto delle deviazioni standard, $\left(\prod_{i}\sigma_i^2\right)^{1/2} = \prod_{i}\sigma_i$, e $(2\pi)^{n/2} = (\sqrt{2\pi})^n$ si distribuisce in $n$ fattori $\sqrt{2\pi}$, uno per feature.`,
      },
      {
        latex: md`\exp\left[ -\frac{1}{2} \sum_{i=1}^{n} \frac{(x_i - m_i)^2}{\sigma_i^2} \right] = \prod_{i=1}^{n} \exp\left[ -\frac{(x_i - m_i)^2}{2\sigma_i^2} \right]`,
        why: md`L'esponenziale di una somma è il prodotto degli esponenziali, $e^{a+b} = e^a e^b$.`,
      },
      {
        latex: md`p(\mathbf{x}) = \prod_{i=1}^{n} \frac{1}{\sigma_i \sqrt{2\pi}} \exp\left[ -\frac{(x_i - m_i)^2}{2\sigma_i^2} \right]`,
        why: md`Si raggruppano costante ed esponenziale di ogni feature: il reciproco di un prodotto è il prodotto dei reciproci, quindi ogni feature riceve il suo fattore $\frac{1}{\sigma_i\sqrt{2\pi}}$ e il suo esponenziale.`,
      },
      {
        latex: md`p(x_j) = \int p(\mathbf{x}) \prod_{i \neq j} dx_i = \frac{1}{\sigma_j \sqrt{2\pi}} \exp\left[ -\frac{(x_j - m_j)^2}{2\sigma_j^2} \right] \prod_{i \neq j} \int_{-\infty}^{+\infty} \frac{1}{\sigma_i \sqrt{2\pi}} \exp\left[ -\frac{(x_i - m_i)^2}{2\sigma_i^2} \right] dx_i`,
        why: md`Resta da vedere che ogni fattore è davvero la marginale (*marginal*) della sua feature. Per ottenere $p(x_j)$ si integrano via le altre variabili; poiché la densità è un prodotto di fattori che dipendono ciascuno da una sola variabile, l'integrale multiplo si spezza in integrali monodimensionali.`,
      },
      {
        latex: md`\int_{-\infty}^{+\infty} \frac{1}{\sigma_i \sqrt{2\pi}} \exp\left[ -\frac{(x_i - m_i)^2}{2\sigma_i^2} \right] dx_i = 1 \;\Rightarrow\; p(x_j) = \frac{1}{\sigma_j \sqrt{2\pi}} \exp\left[ -\frac{(x_j - m_j)^2}{2\sigma_j^2} \right]`,
        why: md`Ogni gaussiana 1-D integra a 1, quindi gli altri fattori spariscono: la marginale di $x_j$ è la gaussiana monodimensionale della galleria dei modelli, con media $m_j$ e varianza $\sigma_j^2$.`,
      },
      {
        latex: md`p(\mathbf{x}) = p(x_1)\, p(x_2) \ldots p(x_n)`,
        why: md`Ogni fattore del prodotto è la marginale della sua feature: la densità congiunta è il prodotto delle marginali, che è la definizione di indipendenza (*each feature is distributed independently of the others*, note p24). Per la gaussiana vale quindi anche il viceversa: covarianze nulle implicano indipendenza, cosa falsa per distribuzioni qualsiasi.`,
      },
    ],
    conclusion: md`Con $\Sigma$ diagonale la costante di normalizzazione e l'esponenziale si spezzano in $n$ fattori, uno per feature, e ciascun fattore è la gaussiana monodimensionale di quella feature: $p(\mathbf{x}) = p(x_1)\,p(x_2) \ldots p(x_n)$. In 2-D gli isolivelli diventano ellissi con gli assi paralleli agli assi coordinati. Controllo numerico con due feature dei salmoni, luminosità ($m_1 = 4.5$, $\sigma_1 = 0.5$) e larghezza ($m_2 = 10$, $\sigma_2 = 2$), nel punto $(5, 12)$: $p(x_1)\,p(x_2) = 0.4839 \cdot 0.1210 = 0.05855$, uguale al valore della formula multivariata $\frac{1}{2\pi} e^{-1} = 0.05855$ ([«la formula multivariata coincide con il prodotto delle gaussiane 1-D»](#example:ex05)).`,
    source: [{ doc: 'part1', page: 24 }, { doc: 'part1', page: 23 }, { doc: 'ch2', page: 26 }, { doc: 'ch2', page: 27 }],
  },
]
