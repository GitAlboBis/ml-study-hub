// Derivazioni del foglio m03 (stima statistica: introduzione, stima di PDF, stima parametrica): der01-der08 dell'inventario.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più servono a seguire i conti
// che la fonte salta (controllati sulle immagini di ch2 p9-11, p13-14, p16, p19, p34-40 e part1 p12-19): il perché
// dice da dove vengono. Nessun LaTeX dell'inventario è stato ritoccato; tutti i numeri sono stati ricalcolati.
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivations: Derivation[] = [
  // --- der01 Dai campioni iid alla verosimiglianza come prodotto ---------------------------------------
  {
    id: 'der01',
    title: 'Dalla densità congiunta dei campioni iid alla verosimiglianza come prodotto',
    goal: md`Giustificare la formula $p(\mathbf{X}\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})$ e chiarire perché si legge come funzione di $\boldsymbol{\theta}$. È la domanda d'esame *why we can use the separate products of the probabilities and what the Likelihood describe*.`,
    assumptions: md`Il modello di $p(\mathbf{x})$ dipende da $r$ parametri raccolti nel vettore dei parametri (*parameter vector*) $\boldsymbol{\theta} = (\theta_1, \theta_2, \dots, \theta_r)$, e la dipendenza si scrive $p(\mathbf{x}\mid\boldsymbol{\theta})$ (slide 9). L'insieme di training $\mathbf{X} = \{\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_N\}$ è formato da $N$ campioni indipendenti e identicamente distribuiti (*independent and identically distributed*, iid) estratti dalla stessa pdf. Le note avvertono che l'ipotesi iid è raramente vera nei casi reali, per le dipendenze tra i dati, ma si assume per semplificare i calcoli.`,
    steps: [
      {
        latex: md`p(\mathbf{X}\mid\boldsymbol{\theta}) = p(\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_N\mid\boldsymbol{\theta})`,
        why: md`$\mathbf{X}$ è l'insieme di tutti i campioni di training (*training samples*): per un dato valore dei parametri la sua densità è la densità congiunta (*joint density*) degli $N$ vettori aleatori. La slide 9 chiama $\mathbf{X}$ «a vector of iid random variables», anche se nella slide 7 l'aveva introdotto come insieme: per la densità non cambia nulla.`,
      },
      {
        latex: md`p(\mathbf{x}_1, \dots, \mathbf{x}_N\mid\boldsymbol{\theta}) = p(\mathbf{x}_1\mid\boldsymbol{\theta})\,p(\mathbf{x}_2\mid\mathbf{x}_1, \boldsymbol{\theta})\cdots p(\mathbf{x}_N\mid\mathbf{x}_1, \dots, \mathbf{x}_{N-1}, \boldsymbol{\theta})`,
        why: md`Passo intermedio che le note saltano: la regola della catena (*chain rule*) vale per qualunque densità congiunta, senza ipotesi. Ogni fattore è la densità di un campione condizionata ai campioni estratti prima.`,
      },
      {
        latex: md`p(\mathbf{x}_k\mid\mathbf{x}_1, \dots, \mathbf{x}_{k-1}, \boldsymbol{\theta}) = p_k(\mathbf{x}_k\mid\boldsymbol{\theta}),\qquad k = 2, \dots, N`,
        why: md`Indipendenza (la «i» di iid): conoscere i campioni già estratti non cambia la densità del $k$-esimo, quindi il condizionamento ai campioni precedenti sparisce. Il pedice $k$ di $p_k$ ricorda che, per ora, ogni campione potrebbe avere una densità diversa.`,
      },
      {
        latex: md`p(\mathbf{x}_1, \dots, \mathbf{x}_N\mid\boldsymbol{\theta}) = p_1(\mathbf{x}_1\mid\boldsymbol{\theta})\,p_2(\mathbf{x}_2\mid\boldsymbol{\theta})\cdots p_N(\mathbf{x}_N\mid\boldsymbol{\theta})`,
        why: md`Sostituendo nella regola della catena, la densità congiunta di variabili indipendenti si fattorizza nel prodotto delle densità marginali (*marginal densities*). È il passaggio che le note riassumono con «since the samples are independent, the overall probability can be expressed as the product».`,
      },
      {
        latex: md`p_1(\cdot\mid\boldsymbol{\theta}) = p_2(\cdot\mid\boldsymbol{\theta}) = \dots = p_N(\cdot\mid\boldsymbol{\theta}) = p(\cdot\mid\boldsymbol{\theta})`,
        why: md`Identica distribuzione (la «id» di iid): tutti i campioni vengono dalla stessa pdf, quindi ogni fattore è la stessa funzione $p(\cdot\mid\boldsymbol{\theta})$ del modello, valutata in un campione diverso.`,
      },
      {
        latex: md`p(\mathbf{X}\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})`,
        why: md`Scrittura compatta con la produttoria: è la funzione di verosimiglianza (*likelihood function*) della slide 9 e delle note.`,
      },
      {
        latex: md`\int p(\mathbf{X}\mid\boldsymbol{\theta})\,d\mathbf{X} = 1\ \ \text{per ogni}\ \boldsymbol{\theta},\qquad \int p(\mathbf{X}\mid\boldsymbol{\theta})\,d\boldsymbol{\theta} \ne 1\ \ \text{in generale}`,
        why: md`Passo aggiunto per distinguere le due letture della stessa espressione. Con $\boldsymbol{\theta}$ fissato e $\mathbf{X}$ variabile è una densità: integra a 1 sui campioni. Con $\mathbf{X}$ fissato e $\boldsymbol{\theta}$ variabile non lo è: nell'esempio gaussiano della slide 10 l'area sotto la campana di $p(\mathbf{X}\mid\theta)$ vale circa $1.5\times 10^{-7}\cdot\sqrt{2\pi/12} \approx 1.1\times 10^{-7}$. Per questo si parla di verosimiglianza di $\boldsymbol{\theta}$ e non di probabilità di $\boldsymbol{\theta}$.`,
      },
      {
        latex: md`\mathbf{X}\ \text{fissato},\ \boldsymbol{\theta}\ \text{variabile}:\qquad \boldsymbol{\theta}\ \longmapsto\ p(\mathbf{X}\mid\boldsymbol{\theta})`,
        why: md`I campioni osservati sono numeri fissati; l'unica cosa che può variare è $\boldsymbol{\theta}$. Letta così la funzione definisce la verosimiglianza di $\boldsymbol{\theta}$ rispetto all'insieme $\mathbf{X}$: una misura di compatibilità/accordo (*measure of compatibility/agreement*) tra $\boldsymbol{\theta}$ e $\mathbf{X}$ (slide 9), cioè di quanto bene il modello scelto «spiega» i campioni di training (note). Analizzandola si trovano i parametri che più probabilmente hanno generato i campioni osservati.`,
      },
      {
        latex: md`l(\boldsymbol{\theta}) = \ln p(\mathbf{X}\mid\boldsymbol{\theta}) = \sum_{k=1}^{N}\ln p(\mathbf{x}_k\mid\boldsymbol{\theta})`,
        why: md`Conseguenza immediata della fattorizzazione: il logaritmo di un prodotto è la somma dei logaritmi. È il ponte verso la log-verosimiglianza (*log-likelihood*) $l(\boldsymbol{\theta})$ del pannello inferiore della slide 10, che la stima a massima verosimiglianza userà. Il logaritmo è monotono crescente, quindi non sposta il massimo, e trasforma un prodotto di $N$ fattori, numericamente minuscolo (circa $10^{-7}$ con soli 12 campioni nella slide 10), in una somma che si deriva termine per termine.`,
      },
      {
        latex: md`p(\mathbf{x}_1, \mathbf{x}_2\mid\boldsymbol{\theta}) = p(\mathbf{x}_1\mid\boldsymbol{\theta})\,p(\mathbf{x}_2\mid\mathbf{x}_1, \boldsymbol{\theta}) \ne p(\mathbf{x}_1\mid\boldsymbol{\theta})\,p(\mathbf{x}_2\mid\boldsymbol{\theta})\quad \text{se i campioni sono dipendenti}`,
        why: md`Controprova del ruolo dell'ipotesi: senza indipendenza la regola della catena lascia densità condizionate ai campioni precedenti e il prodotto delle marginali non è più la densità congiunta (dati correlati, come misure successive nel tempo: è ciò che mostra il widget [«iid per davvero?»](#widget:m03-ipotesi-iid-alla-prova)). L'indipendenza richiesta è quella per $\boldsymbol{\theta}$ fissato (indipendenza condizionata a $\boldsymbol{\theta}$). È la lettura giusta anche nella stima bayesiana (slide 33, *drawn independently*), dove $\boldsymbol{\theta}$ è aleatorio e i campioni, marginalmente, non sono indipendenti: osservarne uno informa su $\boldsymbol{\theta}$ e quindi sugli altri.`,
      },
    ],
    conclusion: md`Con campioni iid la densità dell'intero insieme di training è il prodotto delle densità dei singoli campioni, tutte date dallo stesso modello: $p(\mathbf{X}\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})$. Letta con $\mathbf{X}$ fissato è la verosimiglianza (*likelihood*) di $\boldsymbol{\theta}$ rispetto ai campioni: misura quanto i parametri sono compatibili con i dati, cioè quanto bene il modello «spiega» i campioni. La stima a massima verosimiglianza sceglie il $\boldsymbol{\theta}$ che la rende massima, di solito lavorando sul suo logaritmo.`,
    source: [
      { doc: 'ch2', page: 9 },
      { doc: 'part1', page: 16 },
      { doc: 'part1', page: 17 },
    ],
  },

  // --- der02 Canale PAM con rumore: convoluzione, soglie, probabilità d'errore --------------------------
  {
    id: 'der02',
    title: 'Canale PAM con rumore: da y = x + n alla mistura di gaussiane, alle soglie e alla probabilità d\'errore',
    goal: md`Esplicitare i passaggi che le note danno a parole (densità condizionate gaussiane, densità di $y$ come convoluzione, soglie di decisione) e ricavare soglie e probabilità d'errore. I valori numerici delle soglie e la probabilità d'errore non sono nelle note: sono un'integrazione coerente con le ipotesi dell'esempio (prior $1/3$, stessa varianza).`,
    assumptions: md`Sorgente discreta con tre simboli equiprobabili, Yes, Maybe e No, trasmessi con impulsi PAM (*Pulse Amplitude Modulation*) di ampiezza $0.25$, $0.5$ e $0.75$. Rumore additivo gaussiano (*additive Gaussian noise*) $n$ con media nulla e deviazione standard $\sigma_n$ (le note non specificano né la media né la varianza), indipendente dal segnale trasmesso $x$. Il ricevitore osserva un campione $y$ per impulso.`,
    steps: [
      {
        latex: md`y = x + n`,
        why: md`Modello del canale reale dato dalle note: un sistema ideale non esiste, perché il rumore del canale (*channel noise*) distorce il segnale trasmesso. Con rumore additivo il segnale ricevuto $y$ è la somma del segnale trasmesso $x$ e del rumore $n$.`,
      },
      {
        latex: md`P_x(a) = \frac{1}{3}\ \ \text{per}\ a \in \{0.25,\ 0.5,\ 0.75\},\qquad p_n(n) = \frac{1}{\sqrt{2\pi}\,\sigma_n}\exp\!\left(-\frac{n^2}{2\sigma_n^2}\right)`,
        why: md`Ciò che si conosce: $x$ è una variabile aleatoria discreta con tre valori equiprobabili (prior $1/3$, come nel canale ideale), $n$ è continua e gaussiana, con media nulla sottintesa.`,
      },
      {
        latex: md`P\{y \le t\mid x = a\} = P\{a + n \le t\} = P\{n \le t - a\}`,
        why: md`Passo intermedio: fissato il simbolo trasmesso, $y \le t$ equivale a $n \le t - a$. Poiché $x$ e $n$ sono indipendenti, sapere che $x = a$ non cambia la legge del rumore: la funzione di ripartizione (*cumulative distribution function*) di $y$ dato $x = a$ è quella di $n$ traslata di $a$.`,
      },
      {
        latex: md`p(y\mid x = a) = p_n(y - a) = \frac{1}{\sqrt{2\pi}\,\sigma_n}\exp\!\left(-\frac{(y-a)^2}{2\sigma_n^2}\right)`,
        why: md`Derivando rispetto a $t$ si ottiene la densità condizionata: il rumore traslato della costante $a$, cioè una gaussiana centrata in $a$ con la stessa larghezza $\sigma_n$. Per Yes, $a = 0.25$: è l'esempio delle note, una gaussiana centrata attorno a 0.25 con dispersione (*spread*) fissata dal rumore.`,
      },
      {
        latex: md`p_y(y) = \sum_{a} P_x(a)\,p(y\mid x = a) = \sum_{a} P_x(a)\,p_n(y - a) = (P_x * p_n)(y)`,
        why: md`Teorema della probabilità totale (*law of total probability*) sui tre valori di $x$, più l'indipendenza tra $x$ e $n$ usata nel passo precedente. La somma pesata delle densità traslate è esattamente la convoluzione tra la distribuzione discreta di $x$ e la densità di $n$: nelle note, $P_y$ è la convoluzione di $P_x$ e $P_n$ (*convolution of Px and Pn*).`,
      },
      {
        latex: md`p_y(y) = \frac{1}{3}\left[p_n(y - 0.25) + p_n(y - 0.5) + p_n(y - 0.75)\right]`,
        why: md`Con prior uguali la densità di $y$ è una mistura di tre campane identiche centrate sui tre livelli: convolvere tre impulsi di massa $1/3$ con una campana significa copiare la campana su ciascun livello e pesarla $1/3$.`,
      },
      {
        latex: md`\int_{-\infty}^{+\infty} p_y(y)\,dy = \frac{1}{3}\,(1 + 1 + 1) = 1`,
        why: md`Controllo: ogni campana traslata integra a 1, quindi $p_y$ è una vera densità. Discreta più continua dà continua: $y$ ha una funzione di densità di probabilità (*probability density function*, PDF), mentre $x$ aveva solo una distribuzione di probabilità (*probability distribution*) con tre masse. Il classificatore a valori esatti non funziona più, perché $P\{y = 0.25\} = 0$.`,
      },
      {
        latex: md`\hat{s}(y) = \arg\max_{s \in \{\text{Yes},\,\text{Maybe},\,\text{No}\}} p(y \mid s)`,
        why: md`Nel canale rumoroso le note sostituiscono il classificatore a valori esatti con un modello a soglie (*threshold-based model*), che classifica il segnale ricevuto in base alla verosimiglianza (*likelihood*) di appartenere a ciascuna delle tre categorie. In simboli: si sceglie il simbolo con la densità condizionata più alta nel valore osservato $y$.`,
      },
      {
        latex: md`p(y\mid\text{Yes}) = p(y\mid\text{Maybe}) \iff (y - 0.25)^2 = (y - 0.5)^2 \iff y = 0.375;\qquad p(y\mid\text{Maybe}) = p(y\mid\text{No}) \iff y = 0.625`,
        why: md`Il vincitore dell'arg max cambia dove due campane adiacenti si incrociano. Con la stessa varianza i fattori davanti agli esponenziali sono uguali e basta confrontare gli esponenti: $(y-0.25)^2 - (y-0.5)^2 = 0.25\,(2y - 0.75)$ si annulla in $y = 0.375$, e allo stesso modo il confine tra Maybe e No è $0.625$. Con prior uguali le soglie di decisione (*decision thresholds*) cadono a metà tra i livelli. I numeri sono un'integrazione: le note non danno i valori delle soglie.`,
      },
      {
        latex: md`y < 0.375 \Rightarrow \text{Yes},\qquad 0.375 \le y < 0.625 \Rightarrow \text{Maybe},\qquad y \ge 0.625 \Rightarrow \text{No}`,
        why: md`La regola a soglie che ne segue: tre intervalli sull'asse di $y$, uno per simbolo. Le soglie sono solo il modo pratico di applicare l'arg max su un asse monodimensionale.`,
      },
      {
        latex: md`P(e\mid\text{Yes}) = P\{n > 0.125\} = Q\!\left(\frac{0.125}{\sigma_n}\right),\qquad P(e\mid\text{Maybe}) = P\{|n| > 0.125\} = 2\,Q\!\left(\frac{0.125}{\sigma_n}\right),\qquad P(e\mid\text{No}) = P\{n < -0.125\} = Q\!\left(\frac{0.125}{\sigma_n}\right)`,
        why: md`Passo intermedio. Ogni livello dista $0.125$ dalla soglia più vicina. Yes ($0.25$) sbaglia solo se il rumore lo spinge oltre $0.375$, No ($0.75$) solo se lo spinge sotto $0.625$; Maybe ($0.5$) sbaglia da entrambi i lati. $Q(z) = \int_{z}^{+\infty}\frac{1}{\sqrt{2\pi}}e^{-u^2/2}\,du$ è la coda della gaussiana standard: $P\{n > c\} = Q(c/\sigma_n)$ e, per simmetria, $P\{n < -c\} = Q(c/\sigma_n)$.`,
      },
      {
        latex: md`P_e = \frac{1}{3}\left[Q\!\left(\frac{0.125}{\sigma_n}\right) + 2\,Q\!\left(\frac{0.125}{\sigma_n}\right) + Q\!\left(\frac{0.125}{\sigma_n}\right)\right] = \frac{4}{3}\,Q\!\left(\frac{0.125}{\sigma_n}\right)`,
        why: md`Probabilità d'errore media: $P_e = \sum_s P(s)\,P(e\mid s)$ con i tre prior uguali a $1/3$. Integrazione (non è nelle note): mostra quantitativamente come il rumore determina l'errore.`,
      },
      {
        latex: md`\sigma_n \to 0:\ P_e \to 0;\qquad \sigma_n \to +\infty:\ P_e \to \frac{4}{3}\cdot\frac{1}{2} = \frac{2}{3};\qquad \sigma_n = 0.05:\ P_e = \frac{4}{3}\,Q(2.5) \approx 0.83\%;\qquad \sigma_n = 0.1:\ P_e = \frac{4}{3}\,Q(1.25) \approx 14.1\%`,
        why: md`Controllo dei casi limite. Senza rumore si torna al sistema ideale (errore nullo); con rumore enorme $Q(0) = 1/2$ e $P_e = 2/3$, l'errore di chi tira a indovinare tra tre simboli equiprobabili ($1 - 1/3$). I due valori intermedi, con $Q(2.5) \approx 0.0062$ e $Q(1.25) \approx 0.106$, mostrano quanto in fretta l'errore cresce: raddoppiando $\sigma_n$ si passa da meno dell'1% a circa il 14%. Le soglie a metà strada valgono solo con prior uguali: con prior diversi si spostano ([«soglie con prior diversi»](#derivation:der08)).`,
      },
    ],
    conclusion: md`Il rumore trasforma i tre valori esatti in tre campane: $y$ ha una densità, mistura (e convoluzione) di tre gaussiane centrate sui livelli. Con prior uguali e stessa varianza le soglie a massima verosimiglianza cadono a metà strada, $0.375$ e $0.625$, e la probabilità d'errore $P_e = \frac{4}{3}\,Q(0.125/\sigma_n)$ cresce con $\sigma_n$ da $0$ (canale ideale) a $2/3$ (tirare a indovinare). Conoscere, o stimare, le densità condizionate $p(y\mid s)$ è ciò che permette di piazzare le soglie: è il primo motivo per cui serve la stima statistica.`,
    source: [
      { doc: 'part1', page: 12 },
      { doc: 'part1', page: 13 },
    ],
  },

  // --- der03 I tre pannelli della slide 10: campana e parabola ------------------------------------------
  {
    id: 'der03',
    title: 'Perché nella figura la verosimiglianza è una campana stretta e la log-verosimiglianza una parabola (gaussiana con varianza nota)',
    goal: md`Spiegare con i calcoli i tre pannelli della slide 10 (*Likelihood Function: Example*): la forma di $p(\mathbf{X}\mid\theta)$, la forma di $l(\theta)$, il massimo comune $\hat{\theta}$ uguale alla media campionaria e gli ordini di grandezza. La slide non riporta calcoli: la derivazione è un'integrazione (la trattazione ufficiale arriva con la stima a massima verosimiglianza e il modello gaussiano), e i numeri sono letti dalla figura.`,
    assumptions: md`Modello gaussiano monodimensionale con media incognita $\theta$ (unico parametro, $r = 1$) e deviazione standard nota $\sigma$. Dalla figura: $N = 12$ campioni (i pallini rossi, tra circa 1.9 e 4.8) e $\sigma = 1$ (larghezza delle gaussiane tratteggiate). Campioni iid, quindi la verosimiglianza è il prodotto delle densità ([«verosimiglianza come prodotto»](#derivation:der01)).`,
    steps: [
      {
        latex: md`p(x\mid\theta) = \frac{1}{\sqrt{2\pi}\,\sigma}\exp\!\left(-\frac{(x-\theta)^2}{2\sigma^2}\right)`,
        why: md`Modello dell'esempio: gaussiana monodimensionale con media incognita $\theta$ e deviazione standard nota. Le quattro curve tratteggiate del pannello superiore (centrate circa in 2.5, 3, 3.5 e 5, tutte con $\sigma \approx 1$) sono quattro delle infinite pdf candidate $p(x\mid\theta)$; quella centrata in 5 lascia quasi tutti i campioni nella coda.`,
      },
      {
        latex: md`p(\mathbf{X}\mid\theta) = \prod_{k=1}^{N}\frac{1}{\sqrt{2\pi}\,\sigma}\exp\!\left(-\frac{(x_k-\theta)^2}{2\sigma^2}\right) = (2\pi\sigma^2)^{-N/2}\exp\!\left(-\frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k-\theta)^2\right)`,
        why: md`La verosimiglianza è il prodotto delle densità dei campioni (formula della slide 9). Gli $N$ fattori costanti danno $\left(\frac{1}{\sqrt{2\pi}\,\sigma}\right)^N = (2\pi\sigma^2)^{-N/2}$; il prodotto di esponenziali è l'esponenziale della somma degli esponenti.`,
      },
      {
        latex: md`l(\theta) = \ln p(\mathbf{X}\mid\theta) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k-\theta)^2`,
        why: md`Il logaritmo naturale trasforma il prodotto in somma: $\ln (2\pi\sigma^2)^{-N/2} = -\frac{N}{2}\ln(2\pi\sigma^2)$ e $\ln e^{u} = u$. Resta una costante meno una somma di quadrati: tutta la dipendenza da $\theta$ sta nella somma.`,
      },
      {
        latex: md`\sum_{k=1}^{N}(x_k-\theta)^2 = \sum_{k=1}^{N}\left[(x_k-\bar{x}) + (\bar{x}-\theta)\right]^2 = \sum_{k=1}^{N}(x_k-\bar{x})^2 + 2(\bar{x}-\theta)\sum_{k=1}^{N}(x_k-\bar{x}) + N(\bar{x}-\theta)^2`,
        why: md`Passo intermedio: si aggiunge e si toglie la media campionaria (*sample mean*) $\bar{x}$ dentro ogni quadrato e si sviluppa il quadrato del binomio. Il fattore $(\bar{x}-\theta)$ non dipende da $k$ ed esce dalla somma.`,
      },
      {
        latex: md`\sum_{k=1}^{N}(x_k-\bar{x}) = \sum_{k=1}^{N}x_k - N\bar{x} = N\bar{x} - N\bar{x} = 0`,
        why: md`La somma degli scarti dalla media è zero per definizione di media: il doppio prodotto si annulla.`,
      },
      {
        latex: md`\sum_{k=1}^{N}(x_k-\theta)^2 = \sum_{k=1}^{N}(x_k-\bar{x})^2 + N(\theta-\bar{x})^2,\qquad \bar{x} = \frac{1}{N}\sum_{k=1}^{N}x_k`,
        why: md`Resta l'identità: la somma dei quadrati degli scarti dalla media, che non dipende da $\theta$, più $N$ volte il quadrato della distanza tra $\theta$ e la media campionaria. Poiché $(\bar{x}-\theta)^2 = (\theta-\bar{x})^2$ l'ordine della differenza non conta.`,
      },
      {
        latex: md`l(\theta) = l(\bar{x}) - \frac{N}{2\sigma^2}(\theta-\bar{x})^2`,
        why: md`Sostituendo nella log-verosimiglianza, i termini che non dipendono da $\theta$ formano $l(\bar{x}) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k-\bar{x})^2$, il valore in $\theta = \bar{x}$. La log-verosimiglianza è una parabola concava in $\theta$ con vertice nella media campionaria e curvatura $N/\sigma^2$: è l'arco del pannello inferiore.`,
      },
      {
        latex: md`p(\mathbf{X}\mid\theta) = p(\mathbf{X}\mid\bar{x})\,\exp\!\left(-\frac{(\theta-\bar{x})^2}{2\,\sigma^2/N}\right)`,
        why: md`Esponenziando, con $e^{l(\bar{x})} = p(\mathbf{X}\mid\bar{x})$: come funzione di $\theta$ la verosimiglianza è una campana gaussiana centrata nella media campionaria con varianza $\sigma^2/N$, cioè larghezza $\sigma/\sqrt{N}$. È il picco stretto del pannello centrale, che si restringe al crescere di $N$. È una campana in $\theta$ ma non una densità: la sua area non vale 1.`,
      },
      {
        latex: md`\frac{dl(\theta)}{d\theta} = \frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k-\theta) = \frac{N}{\sigma^2}\,(\bar{x}-\theta) = 0 \iff \theta = \bar{x}`,
        why: md`Stesso risultato per l'altra strada, quella che userà la stima a massima verosimiglianza: si annulla la derivata della log-verosimiglianza, con $\sum_{k}(x_k-\theta) = N\bar{x} - N\theta$. La derivata seconda, $-N/\sigma^2$, è negativa: è un massimo.`,
      },
      {
        latex: md`\hat{\theta} = \arg\max_{\theta} p(\mathbf{X}\mid\theta) = \arg\max_{\theta} l(\theta) = \bar{x} \approx 3.1`,
        why: md`Il logaritmo è monotono crescente, quindi i due massimi coincidono: la freccia $\hat{\theta}$ è alla stessa ascissa nei due pannelli. Nella figura $\hat{\theta} \approx 3.1$, pari alla media dei pallini rossi (misurata sull'immagine: 3.13).`,
      },
      {
        latex: md`l(\hat{\theta}) \approx -\frac{12}{2}\ln(2\pi) - \frac{9.4}{2} \approx -15.7,\qquad p(\mathbf{X}\mid\hat{\theta}) = e^{-15.7} \approx 1.5\times 10^{-7}`,
        why: md`Controllo numerico con i valori letti dalla figura: $N = 12$ e $\sigma = 1$, quindi $\ln(2\pi\sigma^2) = \ln(2\pi)$; i 12 campioni misurati sull'immagine (1.87, 2.08, 2.30, 2.34, 2.54, 2.88, 3.37, 3.66, 3.70, 3.89, 4.14, 4.78) hanno media 3.13 e somma dei quadrati degli scarti circa $9.4$. Il primo termine vale $-6\ln(2\pi) \approx -11.03$, il secondo $-4.7$. Il risultato coincide con il picco di circa $1.5\times 10^{-7}$ del pannello centrale e con il massimo poco sopra $-20$ del pannello inferiore: ecco perché le due scale sono così diverse.`,
      },
      {
        latex: md`\frac{\sigma}{\sqrt{N}} = \frac{1}{\sqrt{12}} \approx 0.29,\qquad 2\sqrt{2\ln 2}\;\frac{\sigma}{\sqrt{N}} \approx 0.68`,
        why: md`Larghezza del picco centrale: la deviazione standard della campana in $\theta$ e la sua larghezza a metà altezza (*full width at half maximum*). Fuori da $\bar{x} \pm 3\sigma/\sqrt{N}$, circa da 2.3 a 4.0, la verosimiglianza è praticamente nulla, come nel pannello centrale; la misura sull'immagine dà proprio 0.68 a metà altezza.`,
      },
      {
        latex: md`-\frac{d^2 l(\theta)}{d\theta^2} = \frac{N}{\sigma^2} = 12\qquad (\text{misura sul pannello inferiore: } 2\times 6.06 \approx 12.1)`,
        why: md`La curvatura della parabola dice quanto è stretta la verosimiglianza. Verifica indipendente sul pannello inferiore: interpolando la curva con una parabola si ottengono vertice in $\theta = 3.12$, massimo $-15.6$ e coefficiente del termine quadratico $6.06$, contro $3.13$, $-15.73$ e $N/(2\sigma^2) = 6$ previsti dal modello: il pannello inferiore conferma da solo $N = 12$ e $\sigma = 1$. Valori del modello utili per leggere la figura: $l(0) \approx -74.5$, $l(1) \approx -42.9$, $l(2) \approx -23.4$, $l(5) \approx -36.7$, $l(7) \approx -105.6$. La stessa quantità $N/\sigma^2$ ritorna come informazione di Fisher ([«informazione di Fisher e bound di Cramér-Rao»](#derivation:der05)).`,
      },
    ],
    conclusion: md`Per la gaussiana con varianza nota la log-verosimiglianza è una parabola concava in $\theta$ con vertice nella media campionaria e curvatura $N/\sigma^2$; la verosimiglianza, suo esponenziale, è una campana larga $\sigma/\sqrt{N}$ attorno allo stesso punto. I due pannelli hanno quindi lo stesso massimo $\hat{\theta} = \bar{x} \approx 3.1$ ma scale diversissime, circa $1.5\times 10^{-7}$ contro circa $-15.7$. Con più campioni il picco si stringe e la parabola si incurva di più.`,
    source: [
      { doc: 'ch2', page: 10 },
      { doc: 'part1', page: 17 },
    ],
  },

  // --- der04 Non polarizzazione e varianza dell'errore --------------------------------------------------
  {
    id: 'der04',
    title: 'Non polarizzazione: da E{ε} = 0 a E{θ̂} = θ, e significato della varianza dell\'errore',
    goal: md`Mostrare l'implicazione $E\{\boldsymbol{\varepsilon}\} = 0 \Rightarrow E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$ scritta nelle note e chiarire perché nella formula della varianza compare la media della stima. L'ultima parte, la scomposizione dell'errore quadratico medio, è un'integrazione standard: spiega perché la stima ideale richiede sia bias nullo sia varianza nulla.`,
    assumptions: md`Il parametro vero $\boldsymbol{\theta} = (\theta_1, \dots, \theta_r)$ è una costante, fissa ma incognita. La stima dipende dall'insieme di training $\mathbf{X}$, estratto a caso. $E\{\cdot\}$ è il valore atteso rispetto alla distribuzione dei campioni.`,
    steps: [
      {
        latex: md`\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\mathbf{X})`,
        why: md`La stima dipende dal vettore delle osservazioni (note, sezione *Estimation Goodness*): se l'insieme dei campioni di training cambia, cambia anche la stima. Quindi $\hat{\boldsymbol{\theta}}$ è essa stessa un vettore aleatorio (*random vector*), con una sua media e una sua varianza.`,
      },
      {
        latex: md`\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}}(\mathbf{X}) - \boldsymbol{\theta}`,
        why: md`Definizione dell'errore di stima (*estimation error*): differenza tra valore stimato e valore vero, componente per componente $\varepsilon_i = \hat{\theta}_i - \theta_i$ con $i = 1, 2, \dots, r$ (le note scrivono anche $\boldsymbol{\varepsilon} = \boldsymbol{\varepsilon}(\mathbf{X}, \boldsymbol{\theta})$). La stima è aleatoria e il parametro vero è una costante: l'errore è aleatorio.`,
      },
      {
        latex: md`E\{\boldsymbol{\varepsilon}\} = E\{\hat{\boldsymbol{\theta}}\} - E\{\boldsymbol{\theta}\} = E\{\hat{\boldsymbol{\theta}}\} - \boldsymbol{\theta}`,
        why: md`Linearità del valore atteso; il valore atteso di una costante è la costante stessa. La media dell'errore di stima si chiama bias.`,
      },
      {
        latex: md`E\{\boldsymbol{\varepsilon}\} = 0 \iff E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}`,
        why: md`È l'implicazione delle note e della slide 13: errore a media nulla equivale a stimatore che in media restituisce il valore vero, cioè non polarizzato (*unbiased*). La freccia vale nei due versi, perché i due membri differiscono per la costante $\boldsymbol{\theta}$.`,
      },
      {
        latex: md`\varepsilon_i - E\{\varepsilon_i\} = (\hat{\theta}_i - \theta_i) - (E\{\hat{\theta}_i\} - \theta_i) = \hat{\theta}_i - E\{\hat{\theta}_i\} = \hat{\theta}_i - \overline{\hat{\theta}}_i`,
        why: md`Passaggio sottinteso nella formula della varianza: nello scarto dell'errore dalla propria media la costante $\theta_i$ compare due volte con segno opposto e si elide. Lo scarto dell'errore è quindi lo scarto della stima dalla sua media $\overline{\hat{\theta}}_i = E\{\hat{\theta}_i\}$, il simbolo con cappello e barra delle note e della slide 13.`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon_i\} = E\left\{\left(\varepsilon_i - E\{\varepsilon_i\}\right)^2\right\} = E\left\{\left(\hat{\theta}_i - \overline{\hat{\theta}}_i\right)^2\right\} = \operatorname{var}\{\hat{\theta}_i\}`,
        why: md`Definizione di varianza applicata all'errore: sottrarre la costante $\theta_i$ non cambia la dispersione, quindi la varianza dell'errore coincide con la varianza della stima attorno alla propria media. Ecco perché nella formula del docente compare $\overline{\hat{\theta}}_i$ e non $\theta_i$: la varianza misura quanto la stima oscilla da un insieme di training all'altro, non quanto dista dal valore vero.`,
      },
      {
        latex: md`E\{\varepsilon_i^2\} = E\left\{\left[(\varepsilon_i - E\{\varepsilon_i\}) + E\{\varepsilon_i\}\right]^2\right\} = E\left\{(\varepsilon_i - E\{\varepsilon_i\})^2\right\} + 2\,E\{\varepsilon_i\}\,\underbrace{E\left\{\varepsilon_i - E\{\varepsilon_i\}\right\}}_{=\,0} + \left(E\{\varepsilon_i\}\right)^2`,
        why: md`Integrazione standard per collegare i due criteri: si aggiunge e si toglie la media dell'errore e si sviluppa il quadrato. $E\{\varepsilon_i\}$ è una costante ed esce dal valore atteso; il doppio prodotto si annulla perché lo scarto dalla media ha media nulla.`,
      },
      {
        latex: md`E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + \left(E\{\varepsilon_i\}\right)^2`,
        why: md`L'errore quadratico medio (*mean squared error*) è varianza più bias al quadrato.`,
      },
      {
        latex: md`E\{\varepsilon_i^2\} = 0 \iff \operatorname{var}\{\varepsilon_i\} = 0\ \ \text{e}\ \ E\{\varepsilon_i\} = 0`,
        why: md`I due termini sono non negativi, quindi la somma è nulla solo se lo sono entrambi. Sono i due criteri che le note chiedono per una stima ideale (*ideal estimate*) di ogni parametro $\theta_i$: non polarizzazione (*unbiasedness*) e varianza nulla (*no variance*). In pratica raggiungerli entrambi è difficile, ma restano i riferimenti per valutare la bontà di un metodo di stima.`,
      },
      {
        latex: md`\hat{\theta} = c\ \ (\text{costante}):\qquad \operatorname{var}\{\varepsilon\} = 0,\qquad E\{\varepsilon\} = c - \theta \ne 0\ \ (\text{se } c \ne \theta)`,
        why: md`Perché servono entrambi i criteri: uno stimatore che ignora i dati e restituisce sempre la stessa costante $c$ ha varianza nulla ma è polarizzato.`,
      },
      {
        latex: md`\hat{\theta} = x_1:\qquad E\{\varepsilon\} = E\{x_1\} - \theta = 0,\qquad \operatorname{var}\{\varepsilon\} = \sigma^2\ \ \text{per ogni}\ N`,
        why: md`Viceversa lo stimatore «solo il primo campione», per la media $\theta$ di una pdf con varianza $\sigma^2$, è non polarizzato ma ha varianza $\sigma^2$ che non cala con $N$; la media campionaria, per confronto, ha $E\{\bar{x}\} = \theta$ e varianza $\sigma^2/N$. Nessuno dei due criteri da solo garantisce un errore quadratico medio piccolo.`,
      },
    ],
    conclusion: md`Un errore a media nulla equivale a uno stimatore che in media restituisce il valore vero: $E\{\boldsymbol{\varepsilon}\} = 0 \iff E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$ (stimatore non polarizzato). La varianza dell'errore è la varianza della stima attorno alla propria media: per questo nella formula compare $\overline{\hat{\theta}}_i$. Poiché $E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + (E\{\varepsilon_i\})^2$, l'errore quadratico medio si annulla solo se si annullano entrambi i termini: sono i due criteri della stima ideale, e nessuno dei due basta da solo.`,
    source: [
      { doc: 'part1', page: 18 },
      { doc: 'part1', page: 19 },
      { doc: 'ch2', page: 13 },
    ],
  },

  // --- der05 Informazione di Fisher e bound di Cramér-Rao -----------------------------------------------
  {
    id: 'der05',
    title: 'Dalla definizione matriciale dell\'informazione di Fisher all\'elemento ij, con l\'esempio della media gaussiana',
    goal: md`Collegare le due scritture della matrice di informazione di Fisher date nelle note e mostrare su un caso concreto (integrazione: la media di una gaussiana con varianza nota, il modello della slide 10) come si calcola il bound di Cramér-Rao e che cosa vuol dire stimatore efficiente (*efficient estimator*).`,
    assumptions: md`Vettore dei parametri $\boldsymbol{\theta}$ con $r$ componenti. Stimatore non polarizzato: il bound vale per gli stimatori *unbiased*. Condizioni di regolarità sottintese nelle note: il supporto di $p(\mathbf{x}\mid\boldsymbol{\theta})$ non dipende da $\boldsymbol{\theta}$, la densità è derivabile in $\boldsymbol{\theta}$ e si possono scambiare derivata e integrale. Campioni iid. Nell'esempio: gaussiana monodimensionale di media incognita $\theta$ e varianza nota $\sigma^2$.`,
    steps: [
      {
        latex: md`\nabla_{\boldsymbol{\theta}}\ln p(\mathbf{X}\mid\boldsymbol{\theta}) = \left[\frac{\partial\ln p(\mathbf{X}\mid\boldsymbol{\theta})}{\partial\theta_1}, \dots, \frac{\partial\ln p(\mathbf{X}\mid\boldsymbol{\theta})}{\partial\theta_r}\right]^{t}`,
        why: md`Il gradiente (*gradient*) della log-verosimiglianza rispetto a $\boldsymbol{\theta}$ è un vettore colonna con $r$ componenti, una derivata parziale per parametro; l'apice $t$ indica il trasposto.`,
      },
      {
        latex: md`\mathbf{I}(\boldsymbol{\theta}) = E\left\{\nabla_{\boldsymbol{\theta}}\ln\left[p(\mathbf{X}\mid\boldsymbol{\theta})\right]\;\nabla_{\boldsymbol{\theta}}\ln\left[p(\mathbf{X}\mid\boldsymbol{\theta})\right]^{t}\right\}`,
        why: md`Definizione delle note e della slide 14: la matrice di informazione di Fisher (*Fisher information matrix*) è il valore atteso del prodotto esterno (colonna per riga) del gradiente per il suo trasposto. Il risultato è una matrice $r \times r$; il valore atteso è sui campioni $\mathbf{X}$, a $\boldsymbol{\theta}$ fissato.`,
      },
      {
        latex: md`\left[\mathbf{I}(\boldsymbol{\theta})\right]_{ij} = E\left\{\frac{\partial\ln\left[p(\mathbf{X}\mid\boldsymbol{\theta})\right]}{\partial\theta_i}\cdot\frac{\partial\ln\left[p(\mathbf{X}\mid\boldsymbol{\theta})\right]}{\partial\theta_j}\right\}`,
        why: md`L'elemento in riga $i$ e colonna $j$ del prodotto esterno è il prodotto della $i$-esima e della $j$-esima derivata parziale: è la seconda scrittura delle note. Più la log-verosimiglianza è sensibile a $\boldsymbol{\theta}$ (derivate grandi), più informazione i dati portano sui parametri.`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon_i\} \ge \left[\mathbf{I}^{-1}(\boldsymbol{\theta})\right]_{ii}`,
        why: md`Disuguaglianza di Cramér-Rao (*Cramér-Rao inequality*), per $i = 1, 2, \dots, r$ e stimatori non polarizzati: la varianza dell'errore sul parametro $i$-esimo non scende sotto l'$i$-esimo elemento diagonale dell'inversa della matrice di Fisher. Con $r = 1$ la matrice è un numero e il bound è $1/I(\theta)$.`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon_i\} = \left[\mathbf{I}^{-1}(\boldsymbol{\theta})\right]_{ii}\ \Rightarrow\ \text{stimatore efficiente}`,
        why: md`Nota delle note e della slide 14: quando la varianza raggiunge il bound lo stimatore si dice efficiente (*efficient*). Ha la minima varianza possibile tra gli stimatori non polarizzati: è ottimo in termini di efficienza statistica.`,
      },
      {
        latex: md`\frac{\partial \ln p(\mathbf{x}\mid\boldsymbol{\theta})}{\partial\theta_i} = \frac{1}{p(\mathbf{x}\mid\boldsymbol{\theta})}\,\frac{\partial p(\mathbf{x}\mid\boldsymbol{\theta})}{\partial\theta_i}`,
        why: md`Da qui un'integrazione standard, non scritta nelle note, che mostra come si calcola la matrice. Primo attrezzo: la derivata del logaritmo è la derivata della funzione divisa per la funzione. La derivata della log-verosimiglianza di un campione si chiama *score*.`,
      },
      {
        latex: md`E\left\{\frac{\partial \ln p(\mathbf{x}\mid\boldsymbol{\theta})}{\partial\theta_i}\right\} = \int \frac{\partial p(\mathbf{x}\mid\boldsymbol{\theta})}{\partial\theta_i}\,d\mathbf{x} = \frac{\partial}{\partial\theta_i}\int p(\mathbf{x}\mid\boldsymbol{\theta})\,d\mathbf{x} = \frac{\partial}{\partial\theta_i}\,1 = 0`,
        why: md`Nel valore atteso $E\{g(\mathbf{x})\} = \int g(\mathbf{x})\,p(\mathbf{x}\mid\boldsymbol{\theta})\,d\mathbf{x}$ il fattore $1/p$ del passo precedente si semplifica con la densità. Lo scambio tra derivata e integrale è lecito sotto le condizioni di regolarità delle ipotesi: sono le stesse, sottintese nelle note, sotto cui vale il bound. Risultato: lo *score* ha media nulla.`,
      },
      {
        latex: md`\left[\mathbf{I}(\boldsymbol{\theta})\right]_{ij} = \sum_{k=1}^{N}\sum_{l=1}^{N}E\left\{\frac{\partial \ln p(\mathbf{x}_k\mid\boldsymbol{\theta})}{\partial\theta_i}\cdot\frac{\partial \ln p(\mathbf{x}_l\mid\boldsymbol{\theta})}{\partial\theta_j}\right\}`,
        why: md`Con campioni iid la log-verosimiglianza è una somma ([«verosimiglianza come prodotto»](#derivation:der01)): ogni derivata parziale è una somma di $N$ termini, uno per campione, e il prodotto di due somme è la doppia somma.`,
      },
      {
        latex: md`\ln p(\mathbf{X}\mid\boldsymbol{\theta}) = \sum_{k=1}^{N}\ln p(\mathbf{x}_k\mid\boldsymbol{\theta})\ \Rightarrow\ \mathbf{I}(\boldsymbol{\theta}) = N\,\mathbf{I}_1(\boldsymbol{\theta}),\qquad \left[\mathbf{I}_1(\boldsymbol{\theta})\right]_{ij} = E\left\{\frac{\partial \ln p(\mathbf{x}\mid\boldsymbol{\theta})}{\partial\theta_i}\cdot\frac{\partial \ln p(\mathbf{x}\mid\boldsymbol{\theta})}{\partial\theta_j}\right\}`,
        why: md`Nella doppia somma i termini con $k \ne l$ riguardano campioni indipendenti: il valore atteso del prodotto è il prodotto dei valori attesi, entrambi nulli per il passo sullo *score*. Restano gli $N$ termini con $k = l$, tutti uguali perché i campioni hanno la stessa pdf. $\mathbf{I}_1$ è l'informazione di un solo campione: l'informazione cresce linearmente con $N$ e il bound cala come $1/N$.`,
      },
      {
        latex: md`\frac{\partial\ln p(\mathbf{X}\mid\theta)}{\partial\theta} = \frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k - \theta)`,
        why: md`Esempio (caso $r = 1$, gaussiana con varianza nota): si deriva la log-verosimiglianza $l(\theta) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k-\theta)^2$ ([«i tre pannelli della slide 10»](#derivation:der03)). La costante sparisce e $\frac{d}{d\theta}(x_k-\theta)^2 = -2(x_k-\theta)$.`,
      },
      {
        latex: md`E\left\{\left(\sum_{k=1}^{N}(x_k-\theta)\right)^{2}\right\} = \sum_{k=1}^{N}E\left\{(x_k-\theta)^2\right\} + \sum_{k\ne l}E\{x_k-\theta\}\,E\{x_l-\theta\} = N\sigma^2 + 0`,
        why: md`Il quadrato della somma si sviluppa in termini diagonali ($k = l$) e incrociati ($k \ne l$). I diagonali danno $N$ volte la varianza $\sigma^2$, perché $E\{x_k\} = \theta$; gli incrociati si fattorizzano per l'indipendenza e sono nulli perché ogni scarto $x_k - \theta$ ha media zero.`,
      },
      {
        latex: md`I(\theta) = \frac{1}{\sigma^4}E\left\{\left(\sum_{k=1}^{N}(x_k-\theta)\right)^{2}\right\} = \frac{N\sigma^2}{\sigma^4} = \frac{N}{\sigma^2}`,
        why: md`Con $r = 1$ l'informazione di Fisher è il valore atteso del quadrato dello *score*, e il fattore $1/\sigma^2$ al quadrato dà $1/\sigma^4$. L'informazione cresce linearmente con $N$ e cala con il rumore; per un solo campione $I_1(\theta) = 1/\sigma^2$.`,
      },
      {
        latex: md`\operatorname{var}\{\bar{x}\} = \operatorname{var}\left\{\frac{1}{N}\sum_{k=1}^{N}x_k\right\} = \frac{1}{N^2}\sum_{k=1}^{N}\operatorname{var}\{x_k\} = \frac{N\sigma^2}{N^2} = \frac{\sigma^2}{N}`,
        why: md`Varianza della media campionaria: una costante esce dalla varianza al quadrato e, per campioni indipendenti, la varianza della somma è la somma delle varianze.`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon\} \ge \frac{\sigma^2}{N},\qquad \operatorname{var}\{\bar{x}\} = \frac{\sigma^2}{N}`,
        why: md`Il bound di Cramér-Rao è $[I(\theta)]^{-1} = \sigma^2/N$, e la media campionaria, che è non polarizzata, ha esattamente questa varianza: raggiunge il bound, quindi è uno stimatore efficiente. Nessuno stimatore non polarizzato della media può fare meglio.`,
      },
      {
        latex: md`-\frac{\partial^2 \ln p(\mathbf{X}\mid\theta)}{\partial\theta^2} = \frac{N}{\sigma^2} = I(\theta)\qquad\Rightarrow\qquad \sqrt{\frac{\sigma^2}{N}} = \frac{1}{\sqrt{12}} \approx 0.289\quad (N = 12,\ \sigma = 1)`,
        why: md`Forma equivalente $I(\theta) = -E\left\{\frac{\partial^2 \ln p(\mathbf{X}\mid\theta)}{\partial\theta^2}\right\}$ (integrazione standard, valida sotto le stesse condizioni di regolarità): per la gaussiana la derivata seconda è la costante $-N/\sigma^2$, cioè la curvatura della parabola del pannello inferiore della slide 10 (misurata: 12.1). Nell'esempio il bound vale $1/12$ e la sua radice, $0.289$, è proprio la larghezza della campana del pannello centrale: più la log-verosimiglianza è curva, più la verosimiglianza è stretta e più precisa può essere la stima.`,
      },
      {
        latex: md`\hat{\theta}_{ML} = \bar{x}:\qquad E\{\bar{x}\} = \theta,\qquad \operatorname{var}\{\bar{x}\} = \frac{\sigma^2}{N} = \left[I(\theta)\right]^{-1}`,
        why: md`Risposta alla domanda d'esame *Is Maximum Likelihood Estimation a good estimator?* sull'esempio della slide 10: la stima ML è la media campionaria, non polarizzata ed efficiente. La slide 19 generalizza: sotto certe ipotesi su $p(\mathbf{x}\mid\boldsymbol{\theta})$, se esiste uno stimatore efficiente e la stima ML è non polarizzata, lo stimatore efficiente è quello ML; anche quando non esiste, la stima ML è asintoticamente non polarizzata, asintoticamente efficiente e consistente.`,
      },
    ],
    conclusion: md`La matrice di Fisher si scrive come valore atteso del prodotto esterno del gradiente della log-verosimiglianza oppure elemento per elemento; con campioni iid vale $N$ volte l'informazione di un solo campione. Per la media di una gaussiana con varianza nota $I(\theta) = N/\sigma^2$, il bound di Cramér-Rao è $\sigma^2/N$ e la media campionaria, cioè la stima ML, lo raggiunge: è efficiente. Nella slide 10 la radice del bound, $1/\sqrt{12} \approx 0.29$, è la larghezza della campana della verosimiglianza.`,
    source: [
      { doc: 'part1', page: 19 },
      { doc: 'ch2', page: 14 },
      { doc: 'ch2', page: 10 },
      { doc: 'ch2', page: 19 },
    ],
  },

  // --- der06 Proprietà asintotiche e consistenza ---------------------------------------------------------
  {
    id: 'der06',
    title: 'Non polarizzazione asintotica e varianza che tende a zero implicano la consistenza',
    goal: md`Giustificare con la disuguaglianza di Chebyshev il legame, enunciato dalle note senza dimostrazione, tra le due proprietà asintotiche (non polarizzazione asintotica e varianza che tende a zero) e la consistenza. La dimostrazione è un'integrazione (argomento standard).`,
    assumptions: md`Errore di stima $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$ con $r$ componenti ($r$ fisso, non cresce con $N$). Le due proprietà delle note: non polarizzazione asintotica (*asymptotic unbiasedness*), $\lim_{N\to+\infty} E\{\boldsymbol{\varepsilon}\} = 0$, e varianza che tende a zero, $\lim_{N\to+\infty}\operatorname{var}\{\varepsilon_i\} = 0$. Definizione di consistenza delle note: $\lim_{N\to+\infty} P\{\lVert\boldsymbol{\varepsilon}\rVert < \delta\} = 1$ per ogni $\delta > 0$.`,
    steps: [
      {
        latex: md`E\{Z\} \ge E\left\{Z\,\mathbf{1}_{\{Z \ge a\}}\right\} \ge a\,P\{Z \ge a\}\qquad (Z \ge 0,\ a > 0)`,
        why: md`Attrezzo di partenza, la disuguaglianza di Markov (*Markov inequality*): per una variabile non negativa, togliere i casi in cui $Z < a$ non fa crescere la media, e nei casi rimasti $Z$ vale almeno $a$ ($\mathbf{1}_{\{Z \ge a\}}$ vale 1 quando l'evento accade e 0 altrimenti). Quindi $P\{Z \ge a\} \le E\{Z\}/a$.`,
      },
      {
        latex: md`P\{|\varepsilon_i| \ge \delta\} \le \frac{E\{\varepsilon_i^2\}}{\delta^2}`,
        why: md`Disuguaglianza di Chebyshev (*Chebyshev inequality*) nella forma con l'errore quadratico medio: è Markov con $Z = \varepsilon_i^2$ e $a = \delta^2$, perché $\vert\varepsilon_i\vert \ge \delta \iff \varepsilon_i^2 \ge \delta^2$. La probabilità di un errore grande è limitata dall'errore quadratico medio.`,
      },
      {
        latex: md`E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + \left(E\{\varepsilon_i\}\right)^2`,
        why: md`Scomposizione dell'errore quadratico medio in varianza più bias al quadrato ([«non polarizzazione e varianza dell'errore»](#derivation:der04)).`,
      },
      {
        latex: md`\lim_{N\to+\infty}E\{\varepsilon_i\} = 0,\quad \lim_{N\to+\infty}\operatorname{var}\{\varepsilon_i\} = 0 \;\Rightarrow\; \lim_{N\to+\infty}E\{\varepsilon_i^2\} = 0`,
        why: md`Le due condizioni enunciate dalle note e dalla slide 16: se bias e varianza tendono entrambi a zero, anche l'errore quadratico medio tende a zero. Basta la non polarizzazione asintotica, non serve quella esatta per ogni $N$.`,
      },
      {
        latex: md`P\{|\varepsilon_i| < \delta\} = 1 - P\{|\varepsilon_i| \ge \delta\} \ge 1 - \frac{E\{\varepsilon_i^2\}}{\delta^2}`,
        why: md`Passo intermedio: evento complementare più Chebyshev. Il membro destro dipende da $N$ solo attraverso l'errore quadratico medio.`,
      },
      {
        latex: md`\lim_{N\to+\infty}P\{|\varepsilon_i| < \delta\} = 1 \qquad \forall\,\delta > 0`,
        why: md`Per ogni $\delta$ fissato il membro destro tende a 1, e una probabilità non supera 1: la probabilità di stare entro $\delta$ dal valore vero tende a 1. È la definizione di consistenza (*consistent estimator*) componente per componente, cioè la convergenza in probabilità (*convergence in probability*).`,
      },
      {
        latex: md`P\{\lVert\boldsymbol{\varepsilon}\rVert \ge \delta\} \le \frac{E\{\lVert\boldsymbol{\varepsilon}\rVert^2\}}{\delta^2} = \frac{1}{\delta^2}\sum_{i=1}^{r}E\{\varepsilon_i^2\} \xrightarrow[N\to+\infty]{} 0`,
        why: md`Stesso argomento applicato direttamente alla norma che compare nella definizione delle note: la norma al quadrato è la somma dei quadrati delle $r$ componenti, quindi basta che ciascuna abbia errore quadratico medio che tende a zero (serve che $r$ sia fisso). Passando al complementare, $\lim_{N\to+\infty}P\{\lVert\boldsymbol{\varepsilon}\rVert < \delta\} = 1$ per ogni $\delta > 0$.`,
      },
      {
        latex: md`\hat{\theta}_N = \bar{x} + N\,B_N,\quad P\{B_N = 1\} = \frac{1}{N} = 1 - P\{B_N = 0\}:\qquad E\{\varepsilon\} = 1\ \ \forall N,\qquad P\{|\varepsilon| \ge \delta\} \le \frac{1}{N} + P\{|\bar{x}-\theta| \ge \delta\} \to 0`,
        why: md`Perché, a rigore, le condizioni sono sufficienti e non necessarie. $B_N$ è una variabile di Bernoulli indipendente dai campioni: con probabilità $1/N$ lo stimatore sbaglia di $N$ unità. Il bias è $E\{\bar{x}-\theta\} + N\cdot\frac{1}{N} = 1$. Se $B_N = 0$ l'errore è $\bar{x}-\theta$, quindi un errore di almeno $\delta$ richiede $B_N = 1$ oppure $\vert\bar{x}-\theta\vert \ge \delta$: la probabilità è al più la somma, che tende a zero perché la media campionaria è consistente. L'evento raro diventa sempre più raro: lo stimatore è consistente pur avendo bias 1 per ogni $N$.`,
      },
      {
        latex: md`\operatorname{var}\{\varepsilon\} = \operatorname{var}\{\bar{x}\} + N^2\operatorname{var}\{B_N\} = \frac{\sigma^2}{N} + N^2\cdot\frac{1}{N}\left(1-\frac{1}{N}\right) = \frac{\sigma^2}{N} + N - 1 \xrightarrow[N\to+\infty]{} +\infty`,
        why: md`Varianza del controesempio: le due parti sono indipendenti e la varianza di una Bernoulli di parametro $1/N$ è $\frac{1}{N}\left(1-\frac{1}{N}\right)$. La varianza esplode, eppure lo stimatore è consistente. All'orale si riporta la formulazione del docente (*necessary conditions*); la precisazione serve solo se richiesta.`,
      },
    ],
    conclusion: md`Se bias e varianza dell'errore tendono a zero per $N \to +\infty$, tende a zero l'errore quadratico medio e, per Chebyshev, $\lim_{N\to+\infty}P\{\lVert\boldsymbol{\varepsilon}\rVert < \delta\} = 1$ per ogni $\delta > 0$: lo stimatore è consistente. Le note e la slide 16 le chiamano condizioni necessarie; a rigore sono sufficienti, come mostra lo stimatore consistente con bias costante uguale a 1.`,
    source: [
      { doc: 'part1', page: 19 },
      { doc: 'ch2', page: 16 },
    ],
  },

  // --- der07 Da Bayes ai due casi di equivalenza con ML --------------------------------------------------
  {
    id: 'der07',
    title: 'Dal teorema di Bayes ai due casi in cui ML e Bayes coincidono (prior uniforme, N → ∞)',
    goal: md`Esplicitare il meccanismo della slide 11, in cui l'osservazione dei campioni trasforma il prior in una densità a posteriori (*posterior density*), e giustificare le due condizioni di equivalenza tra ML e Bayes della slide 40, chieste all'orale insieme agli argomenti di questo foglio. I passaggi sono un'integrazione; l'esempio usa il modello della slide 10 (gaussiana con varianza nota) e il posterior gaussiano delle slide 37-39, sviluppato nel foglio sulla stima bayesiana.`,
    assumptions: md`Stima bayesiana (*Bayesian Estimation*, BE): i parametri sono variabili aleatorie con una distribuzione a priori (*prior distribution*) $p(\boldsymbol{\theta})$ nota. Campioni iid dato $\boldsymbol{\theta}$, quindi $p(\mathbf{X}\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})$. Nell'esempio: $p(x\mid\theta) = \mathcal{N}(\theta, \sigma^2)$ con $\sigma^2$ nota e prior gaussiano $\mathcal{N}(\mu_0, \sigma_0^2)$; le slide 37-39 chiamano $\mu$ la media incognita, qui è $\theta$.`,
    steps: [
      {
        latex: md`p(\boldsymbol{\theta}\mid\mathbf{X}) = \frac{p(\mathbf{X}\mid\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{p(\mathbf{X})},\qquad p(\mathbf{X}) = \int p(\mathbf{X}\mid\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,d\boldsymbol{\theta}`,
        why: md`Teorema di Bayes (*Bayes' theorem*) applicato ai parametri: è il meccanismo che le note descrivono a parole (quando i campioni sono osservati, il prior viene aggiornato in una densità a posteriori). Il denominatore non dipende da $\boldsymbol{\theta}$: è solo la costante che rende unitaria l'area del posterior.`,
      },
      {
        latex: md`p(\boldsymbol{\theta}\mid\mathbf{X}) \propto p(\mathbf{X}\mid\boldsymbol{\theta})\,p(\boldsymbol{\theta}) = \left[\prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})\right] p(\boldsymbol{\theta})`,
        why: md`Il posterior è proporzionale al prodotto tra la verosimiglianza della slide 9 e il prior: i dati entrano nella stima bayesiana solo attraverso la stessa $p(\mathbf{X}\mid\boldsymbol{\theta})$ usata dalla stima ML.`,
      },
      {
        latex: md`p(\boldsymbol{\theta}) = c\ \Rightarrow\ p(\boldsymbol{\theta}\mid\mathbf{X}) \propto p(\mathbf{X}\mid\boldsymbol{\theta})\ \Rightarrow\ \arg\max_{\boldsymbol{\theta}}\, p(\boldsymbol{\theta}\mid\mathbf{X}) = \hat{\boldsymbol{\theta}}_{ML}`,
        why: md`Primo caso della slide 40: se il prior è uniforme (costante) sparisce dalla proporzionalità; il posterior ha la stessa forma della verosimiglianza e il suo massimo è la stima ML. Se lo spazio dei parametri è illimitato una densità costante non integra a 1 (prior improprio, *improper prior*): va letta come limite di un prior sempre più largo, come nel passo sui limiti più avanti.`,
      },
      {
        latex: md`p(\mathbf{X}\mid\theta) \propto \exp\!\left(-\frac{(\theta-\bar{x})^2}{2\,\sigma^2/N}\right),\qquad p(\theta) = \mathcal{N}(\mu_0, \sigma_0^2)`,
        why: md`Esempio della slide 10: con gaussiana di varianza nota la verosimiglianza, in funzione di $\theta$, è una campana centrata nella media campionaria con varianza $\sigma^2/N$ ([«i tre pannelli della slide 10»](#derivation:der03)). Come prior si prende una gaussiana di media $\mu_0$ e varianza $\sigma_0^2$.`,
      },
      {
        latex: md`\frac{N(\theta-\bar{x})^2}{\sigma^2} + \frac{(\theta-\mu_0)^2}{\sigma_0^2} = \left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)\theta^2 - 2\left(\frac{N\bar{x}}{\sigma^2}+\frac{\mu_0}{\sigma_0^2}\right)\theta + \frac{N\bar{x}^2}{\sigma^2} + \frac{\mu_0^2}{\sigma_0^2}`,
        why: md`Passo intermedio: si sviluppano i quadrati dei due esponenti (a meno del fattore $-\frac{1}{2}$) e si raccolgono i termini in $\theta^2$ e in $\theta$. Gli ultimi due termini non dipendono da $\theta$.`,
      },
      {
        latex: md`p(\theta\mid\mathbf{X}) \propto \exp\!\left(-\frac{N(\theta-\bar{x})^2}{2\sigma^2}\right)\exp\!\left(-\frac{(\theta-\mu_0)^2}{2\sigma_0^2}\right) = \exp\!\left(-\frac{1}{2}\left[\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)\theta^2 - 2\left(\frac{N\bar{x}}{\sigma^2}+\frac{\mu_0}{\sigma_0^2}\right)\theta\right] + \text{cost.}\right)`,
        why: md`Si moltiplicano le due campane in $\theta$: il prodotto di esponenziali è l'esponenziale della somma degli esponenti, e tutto ciò che non dipende da $\theta$ finisce nella costante di normalizzazione (la $\alpha''$ della slide 37). La slide scrive $\frac{1}{\sigma^2}\sum_{k=1}^{N}x_k$, che è lo stesso $\frac{N\bar{x}}{\sigma^2}$.`,
      },
      {
        latex: md`-\frac{(\theta-\mu_N)^2}{2\sigma_N^2} = -\frac{1}{2}\left[\frac{1}{\sigma_N^2}\,\theta^2 - 2\,\frac{\mu_N}{\sigma_N^2}\,\theta\right] - \frac{\mu_N^2}{2\sigma_N^2}`,
        why: md`Completamento del quadrato (*completing the square*): l'esponente di una gaussiana di media $\mu_N$ e varianza $\sigma_N^2$, sviluppato, ha la stessa forma dell'esponente del passo precedente, a meno di una costante.`,
      },
      {
        latex: md`\frac{1}{\sigma_N^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2},\qquad \frac{\mu_N}{\sigma_N^2} = \frac{N\bar{x}}{\sigma^2} + \frac{\mu_0}{\sigma_0^2}\qquad\Rightarrow\qquad p(\theta\mid\mathbf{X}) \propto \exp\!\left(-\frac{(\theta-\mu_N)^2}{2\sigma_N^2}\right)`,
        why: md`Confrontando i coefficienti di $\theta^2$ e di $\theta$ si leggono l'inverso della varianza e la media del posterior. Ecco perché il posterior è ancora gaussiano (domanda di Passerini *why do we obtain a Gaussian also as posterior?*): il prodotto di esponenziali di quadratiche è l'esponenziale di una quadratica, concava perché il coefficiente di $\theta^2$ è positivo e preceduto dal segno meno. Le precisioni (inversi delle varianze) si sommano: il posterior è più stretto sia del prior sia della verosimiglianza.`,
      },
      {
        latex: md`\sigma_N^2 = \left(\frac{N\sigma_0^2 + \sigma^2}{\sigma^2\,\sigma_0^2}\right)^{-1},\qquad \mu_N = \sigma_N^2\left(\frac{N\bar{x}}{\sigma^2} + \frac{\mu_0}{\sigma_0^2}\right) = \frac{N\sigma_0^2\,\bar{x} + \sigma^2\mu_0}{N\sigma_0^2 + \sigma^2}`,
        why: md`Si risolvono le due equazioni: denominatore comune per la precisione, poi si moltiplica per $\sigma_N^2$ per avere la media. È il conto che la slide 37 riassume con *after some calculations*.`,
      },
      {
        latex: md`p(\theta\mid\mathbf{X}) = \mathcal{N}(\mu_N, \sigma_N^2),\qquad \mu_N = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\,\bar{x} + \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\,\mu_0,\qquad \sigma_N^2 = \frac{\sigma_0^2\,\sigma^2}{N\sigma_0^2 + \sigma^2}`,
        why: md`Formule della slide 37. La media a posteriori è una media pesata tra media campionaria e media del prior, con pesi che sommano a 1 e dipendono da $N$ e dalle due varianze: la slide osserva che queste equazioni mostrano come l'informazione a priori si combina con quella empirica dei campioni.`,
      },
      {
        latex: md`\lim_{N\to+\infty}\mu_N = \bar{x} = \hat{\theta}_{ML},\qquad \lim_{N\to+\infty}\sigma_N^2 = 0;\qquad \lim_{\sigma_0\to+\infty}\mu_N = \bar{x}`,
        why: md`Secondo caso della slide 40: per $N \to +\infty$ il peso della media campionaria tende a 1 (la differenza $\mu_N - \bar{x} = \frac{\sigma^2(\mu_0-\bar{x})}{N\sigma_0^2+\sigma^2}$ tende a zero) e il posterior si stringe fino a un impulso centrato sulla stima ML: il prior non conta più. Anche un prior sempre più largo ($\sigma_0 \to +\infty$, cioè tendente all'uniforme) porta la media a $\bar{x}$: i due casi della slide sono i due modi di rendere trascurabile il prior.`,
      },
      {
        latex: md`p(x\mid\mathbf{X}) = \int p(x\mid\theta)\,p(\theta\mid\mathbf{X})\,d\theta = \mathcal{N}\!\left(\mu_N,\ \sigma^2 + \sigma_N^2\right)`,
        why: md`Per Melgani lo scopo della stima bayesiana non è un punto ma la densità $p(\mathbf{x}\mid\mathbf{X})$ (slide 34 e 40): si media il modello su tutti i valori di $\theta$ pesati dal posterior. Scorciatoia per il risultato della slide 39: dato $\mathbf{X}$ si può scrivere $x = \theta + w$ con $\theta \sim \mathcal{N}(\mu_N, \sigma_N^2)$ e $w \sim \mathcal{N}(0, \sigma^2)$ indipendenti, e la somma di gaussiane indipendenti è gaussiana con medie e varianze sommate. La varianza in più, $\sigma_N^2$, è l'incertezza residua su $\theta$.`,
      },
      {
        latex: md`\sigma_0\to+\infty:\quad p(x\mid\mathbf{X}) = \mathcal{N}\!\left(\bar{x},\ \sigma^2\left(1+\frac{1}{N}\right)\right)\quad\text{contro}\quad p(x\mid\hat{\theta}_{ML}) = \mathcal{N}(\bar{x},\ \sigma^2)`,
        why: md`Precisazione sulla slide 40: in questo esempio gaussiano, con prior uniforme, coincidono le stime del parametro (massimo e media del posterior valgono $\bar{x} = \hat{\theta}_{ML}$, perché il posterior è una gaussiana simmetrica; in generale coincide solo il massimo), ma la densità bayesiana resta più larga di quella ML per il termine $\sigma_N^2 = \sigma^2/N$ (con $N = 12$ e $\sigma = 1$: varianza $1.083$ invece di $1$). Le due densità coincidono esattamente solo quando anche $\sigma_N^2 \to 0$, cioè per $N \to +\infty$: il prior uniforme rende uguali i punti stimati, gli infiniti campioni rendono uguali anche le densità.`,
      },
    ],
    conclusion: md`Il posterior è verosimiglianza per prior, normalizzato. Il prior smette di contare nei due casi della slide 40: se è uniforme, il posterior ha la forma della verosimiglianza e lo stesso massimo; se i campioni sono infiniti, la verosimiglianza, sempre più stretta, domina qualunque prior che non escluda il valore vero. Nell'esempio gaussiano $\mu_N \to \bar{x} = \hat{\theta}_{ML}$ e $\sigma_N^2 \to 0$. In pratica la stima ML viene spesso preferita per la minore complessità computazionale (*computational complexity*) e la maggiore interpretabilità (*interpretability*).`,
    source: [
      { doc: 'ch2', page: 11 },
      { doc: 'part1', page: 17 },
      { doc: 'part1', page: 18 },
      { doc: 'ch2', page: 34 },
      { doc: 'ch2', page: 37 },
      { doc: 'ch2', page: 39 },
      { doc: 'ch2', page: 40 },
    ],
  },

  // --- der08 Soglie PAM con prior diversi (MAP contro ML) ------------------------------------------------
  {
    id: 'der08',
    title: 'Soglie del canale PAM con prior diversi: dove si sposta la soglia rispetto al criterio ML',
    goal: md`Le note dicono che nel canale rumoroso si classifica in base alla verosimiglianza (*based on the likelihood*) e fissano prior uguali ($1/3$); la domanda d'esame sul criterio MAP chiede *how priors change the threshold compared to ML criterion*. Qui si ricava dove cade la soglia tra due livelli adiacenti quando i prior sono diversi. È un'integrazione: né le note né le slide di queste pagine contengono la formula, e la regola MAP è trattata nel foglio sulla classificazione bayesiana.`,
    assumptions: md`Canale PAM rumoroso delle note: livelli $0.25$, $0.5$, $0.75$ per Yes, Maybe, No; rumore gaussiano a media nulla, con la stessa $\sigma_n$ per tutti i simboli e indipendente da $x$. Notazione: $a_1 < a_2$ due livelli adiacenti (per esempio $0.25$ e $0.5$ per Yes e Maybe), $P_1$ e $P_2$ i loro prior, $t_{12}$ la soglia tra i due. Nel widget [«Convoluzione e soglie»](#widget:m03-pam-convoluzione-soglie) la soglia si chiama $t_1$; non va confusa con gli istanti di campionamento del ricevitore.`,
    steps: [
      {
        latex: md`P(s\mid y) = \frac{P(s)\,p(y\mid s)}{p_y(y)},\qquad p_y(y) = \sum_{s} P(s)\,p(y\mid s)`,
        why: md`Teorema di Bayes sui simboli: la probabilità a posteriori (*posterior probability*) del simbolo $s$ dopo aver osservato $y$. Il denominatore è la densità di $y$, la stessa mistura del canale rumoroso, ora con prior qualunque.`,
      },
      {
        latex: md`\hat{s}(y) = \arg\max_{s \in \{\text{Yes},\,\text{Maybe},\,\text{No}\}} P(s)\,p(y\mid s)`,
        why: md`Regola MAP (*maximum a posteriori*): si sceglie il simbolo con probabilità a posteriori massima; il denominatore $p_y(y)$ è lo stesso per tutti i simboli e si può ignorare. Con prior tutti uguali $P(s)$ esce dall'arg max e la regola torna quella a massima verosimiglianza delle note ([«canale PAM con rumore»](#derivation:der02)).`,
      },
      {
        latex: md`P_1\,\frac{1}{\sqrt{2\pi}\,\sigma_n}\exp\!\left(-\frac{(t_{12}-a_1)^2}{2\sigma_n^2}\right) = P_2\,\frac{1}{\sqrt{2\pi}\,\sigma_n}\exp\!\left(-\frac{(t_{12}-a_2)^2}{2\sigma_n^2}\right)`,
        why: md`La soglia tra due simboli adiacenti è il punto in cui le due verosimiglianze pesate dai prior si eguagliano: lì cambia il vincitore dell'arg max. Poiché $\sigma_n$ è la stessa per tutti i simboli, il fattore $\frac{1}{\sqrt{2\pi}\,\sigma_n}$ è identico nei due membri e si semplifica.`,
      },
      {
        latex: md`\ln P_1 - \frac{(t_{12}-a_1)^2}{2\sigma_n^2} = \ln P_2 - \frac{(t_{12}-a_2)^2}{2\sigma_n^2}`,
        why: md`Logaritmo naturale dei due membri (funzione monotona, quindi conserva l'uguaglianza): $\ln(P\,e^{u}) = \ln P + u$ e gli esponenziali spariscono.`,
      },
      {
        latex: md`(t_{12}-a_2)^2 - (t_{12}-a_1)^2 = 2\sigma_n^2\ln\frac{P_2}{P_1}`,
        why: md`Si moltiplica per $2\sigma_n^2$ e si portano i quadrati da una parte e i logaritmi dall'altra, con $\ln P_2 - \ln P_1 = \ln\frac{P_2}{P_1}$.`,
      },
      {
        latex: md`(a_1 - a_2)\,(2t_{12} - a_1 - a_2) = 2\sigma_n^2\ln\frac{P_2}{P_1}`,
        why: md`Differenza di quadrati $A^2 - B^2 = (A - B)(A + B)$ con $A = t_{12} - a_2$ e $B = t_{12} - a_1$: $A - B = a_1 - a_2$ e $A + B = 2t_{12} - a_1 - a_2$. I termini in $t_{12}^2$ si elidono: l'equazione è lineare e la soglia è unica, conseguenza della stessa varianza per i due simboli.`,
      },
      {
        latex: md`2t_{12} - a_1 - a_2 = \frac{2\sigma_n^2}{a_1 - a_2}\,\ln\frac{P_2}{P_1} = \frac{2\sigma_n^2}{a_2 - a_1}\,\ln\frac{P_1}{P_2}`,
        why: md`Passo intermedio: si divide per $a_1 - a_2$, che è negativo. Cambiare segno al denominatore equivale a invertire il rapporto nel logaritmo, perché $\ln\frac{P_2}{P_1} = -\ln\frac{P_1}{P_2}$.`,
      },
      {
        latex: md`t_{12} = \frac{a_1 + a_2}{2} + \frac{\sigma_n^2}{a_2 - a_1}\,\ln\frac{P_1}{P_2}`,
        why: md`Si isola $t_{12}$. Primo termine: il punto medio, cioè la soglia ML. Secondo termine: lo spostamento dovuto ai prior, verso il livello del simbolo meno probabile. Se $P_1 > P_2$ il logaritmo è positivo, la soglia va verso $a_2$ e la regione del simbolo 1 si allarga.`,
      },
      {
        latex: md`a_1 = 0.25,\ a_2 = 0.5:\quad t_{12} = 0.375 + 4\sigma_n^2\ln\frac{P(\text{Yes})}{P(\text{Maybe})};\qquad \sigma_n = 0.1,\ P(\text{Yes}) = 0.5,\ P(\text{Maybe}) = 0.3:\ \ t_{12} = 0.375 + 0.04\ln\frac{5}{3} \approx 0.395`,
        why: md`Caso numerico sul canale delle note (integrazione): $a_2 - a_1 = 0.25$, quindi $\frac{\sigma_n^2}{0.25} = 4\sigma_n^2 = 0.04$ con $\sigma_n = 0.1$, e $\ln\frac{5}{3} \approx 0.511$: la soglia sale di circa $0.020$. È la formula mostrata nel widget [«Convoluzione e soglie»](#widget:m03-pam-convoluzione-soglie).`,
      },
      {
        latex: md`P(\text{No}) = 0.2:\quad t_{23} = 0.625 + 0.04\ln\frac{0.3}{0.2} \approx 0.641;\qquad P_e^{MAP} \approx 13.2\%\quad\text{contro}\quad P_e^{ML} \approx 13.7\%\ \ (\text{soglie } 0.375,\ 0.625)`,
        why: md`Con prior $0.5$, $0.3$, $0.2$ per Yes, Maybe, No e $\sigma_n = 0.1$ anche la seconda soglia sale, verso il livello di No, meno probabile. L'errore medio $P_e = \sum_s P(s)\,P(e\mid s)$ scende dal 13.7% delle soglie ML a metà strada al 13.2% delle soglie MAP; una ricerca a griglia della coppia di soglie che minimizza l'errore ritrova 0.395 e 0.641: le soglie MAP sono quelle a errore minimo.`,
      },
      {
        latex: md`P_1 = P_2 \Rightarrow t_{12} = \frac{a_1+a_2}{2};\qquad \sigma_n \to 0 \Rightarrow t_{12} \to \frac{a_1+a_2}{2};\qquad \frac{\sigma_n^2}{a_2-a_1}\ \text{grande} \Rightarrow \text{il prior domina}`,
        why: md`Casi limite. Con prior uguali MAP e ML coincidono (soglie $0.375$ e $0.625$ delle note). Con poco rumore i dati sono così affidabili che il prior non conta. Con molto rumore rispetto alla distanza tra i livelli lo spostamento cresce e, con tre simboli, la regione del simbolo centrale poco probabile può restringersi fino a sparire: quando $t_{12} \ge t_{23}$ quel simbolo non viene mai deciso. Stessa logica del confronto tra ML e Bayes ([«quando ML e Bayes coincidono»](#derivation:der07)): il prior pesa tanto più quanto meno i dati sono informativi.`,
      },
    ],
    conclusion: md`La soglia MAP tra due livelli adiacenti è $t_{12} = \frac{a_1 + a_2}{2} + \frac{\sigma_n^2}{a_2 - a_1}\ln\frac{P_1}{P_2}$: il punto medio (soglia ML) più uno spostamento verso il simbolo meno probabile, proporzionale alla varianza del rumore e al logaritmo del rapporto tra i prior. Con prior uguali, o senza rumore, torna la soglia ML a metà strada.`,
    source: [
      { doc: 'part1', page: 13 },
      { doc: 'part1', page: 12 },
    ],
  },
]
