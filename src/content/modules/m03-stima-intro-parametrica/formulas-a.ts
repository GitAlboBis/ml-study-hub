// Formule del foglio m03 (stima statistica: introduzione, stima di pdf, stima parametrica), concetti c01-c40.
// Convenzione condivisa: una voce per ogni stringa LaTeX di concepts[].latex, id "f-<concetto>" per la prima,
// "f-<concetto>-2", "f-<concetto>-3"... per le successive. Il campo latex è copiato dall'inventario
// (verificato sulle immagini delle pagine) e scripts/formula-coverage.ts lo ritrova per confronto.
// importance = examRelevance del concetto. Tra c01 e c40 hanno LaTeX solo c06-c10, c12-c14, c16-c17, c34-c35, c37.
// L'esempio del canale PAM (part1 p.12-13) è solo a parole nelle note: le formule esplicite, le soglie e la
// probabilità d'errore sono integrazioni dell'inventario, e il testo lo dice.
import { md } from '../../types'
import type { Formula } from '../../types'

export const formulasA: Formula[] = [
  // --- c06 PAM: simbolo -> ampiezza ----------------------------------------------------------------
  {
    id: 'f-c06',
    name: 'Mappa PAM: ogni simbolo diventa un\'ampiezza',
    nameEn: 'PAM (Pulse Amplitude Modulation): symbol-to-amplitude map',
    latex: md`\text{Yes}\mapsto 0.25,\qquad \text{Maybe}\mapsto 0.5,\qquad \text{No}\mapsto 0.75`,
    explain: md`Una sorgente discreta emette tre tipi di informazione: Yes, No e Maybe. Per attraversare il canale di comunicazione (*communication channel*) l'informazione va trasformata in segnale: lo fa un dispositivo di modulazione d'ampiezza degli impulsi (*Pulse Amplitude Modulation*, PAM), che associa a ogni simbolo un impulso rettangolare (*rectangular pulse*) di durata $1T$. L'informazione sta tutta nell'ampiezza, cioè nell'altezza, dell'impulso: $0.25$, $0.5$ oppure $0.75$. Le note elencano le tre ampiezze; l'abbinamento con i simboli si ricava dalla regola del ricevitore scritta subito dopo. È l'esempio con cui la slide 5 illustra i segnali deterministici rumorosi (*noisy deterministic signals*): la sorgente è completamente nota, il rumore entra solo durante la trasmissione.`,
    symbols: [
      { s: md`\text{Yes},\ \text{Maybe},\ \text{No}`, meaning: md`i tre simboli emessi dalla sorgente discreta` },
      { s: md`0.25,\ 0.5,\ 0.75`, meaning: md`ampiezze (altezze) degli impulsi rettangolari: portano l'informazione` },
      { s: md`\mapsto`, meaning: md`«viene trasmesso come»: l'associazione simbolo → ampiezza fatta dal modulatore` },
      { s: md`T`, meaning: md`durata di ciascun impulso (periodo di simbolo)` },
    ],
    whenToUse: md`Quando racconti l'esempio con cui le note aprono la teoria della stima: prima il sistema ideale, poi lo stesso sistema con il rumore. Il canale ideale è nel widget [«Yes, Maybe, No: il canale PAM senza rumore»](#widget:m03-pam-canale-ideale).`,
    pitfalls: md`I livelli distano $0.25$ l'uno dall'altro: è questa distanza, confrontata con la dispersione del rumore, a decidere quanto spesso il ricevitore sbaglierà. Non confondere i livelli con le soglie di decisione ($0.375$ e $0.625$), che cadono a metà fra i livelli.`,
    importance: 1,
    blanks: [
      {
        masked: md`\text{Yes}\mapsto 0.25,\qquad \text{Maybe}\mapsto \boxed{\;?\;},\qquad \text{No}\mapsto 0.75`,
        answer: md`0.5`,
        distractors: [md`0.375`, md`0.625`, md`1`],
      },
    ],
    source: [
      { doc: 'part1', page: 12 },
      { doc: 'ch2', page: 5 },
    ],
  },

  // --- c07 Campionatore e classificatore ideale ---------------------------------------------------
  {
    id: 'f-c07',
    name: 'Classificatore ideale a valori esatti',
    nameEn: 'Straightforward classifier model (ideal system)',
    latex: md`\hat{s}(Y_s)=\begin{cases}\text{Yes} & Y_s = 0.25\\ \text{Maybe} & Y_s = 0.5\\ \text{No} & Y_s = 0.75\end{cases}`,
    explain: md`Al ricevitore un campionatore (*sampler*) preleva un valore da ogni impulso: è il valore campionato $Y_s$. Senza rumore $Y_s$ coincide esattamente con l'ampiezza trasmessa, quindi il classificatore è immediato (*straightforward*): legge il valore e lo riconverte nel simbolo, $0.25$ → Yes, $0.5$ → Maybe, $0.75$ → No. Non c'è niente da stimare né da decidere in condizioni d'incertezza: ogni valore possibile corrisponde a un solo simbolo.`,
    symbols: [
      { s: md`Y_s`, meaning: md`valore campionato al ricevitore (*sampled value*)` },
      { s: md`\hat{s}(Y_s)`, meaning: md`simbolo deciso dal classificatore a partire da $Y_s$; il cappello indica una decisione presa dai dati` },
    ],
    whenToUse: md`Come punto di partenza del ragionamento: è il classificatore che funziona solo nel sistema ideale e che il rumore costringe ad abbandonare.`,
    pitfalls: md`La regola usa uguaglianze esatte: basta che $Y_s$ valga $0.26$ perché nessun caso si applichi. Per questo, appena entra il rumore gaussiano, il classificatore smette di funzionare e va sostituito da uno a soglie.`,
    importance: 1,
    blanks: [
      {
        masked: md`\hat{s}(Y_s)=\begin{cases}\text{Yes} & Y_s = 0.25\\ \text{Maybe} & Y_s = 0.5\\ \boxed{\;?\;} & Y_s = 0.75\end{cases}`,
        answer: md`\text{No}`,
        distractors: [md`\text{Yes}`, md`\text{Maybe}`],
      },
    ],
    source: [{ doc: 'part1', page: 12 }],
  },
  {
    id: 'f-c07-2',
    name: 'Istanti di campionamento a metà impulso',
    nameEn: 'Sampling instants “every x.5T”',
    latex: md`t_j = (j + 0.5)\,T,\qquad j = 0, 1, 2, \dots`,
    explain: md`Le note dicono che il campionatore preleva un campione «ogni x.5T» (*samples every x.5T*). La lettura naturale è $0.5T,\ 1.5T,\ 2.5T, \dots$: un campione al centro di ogni impulso, che dura $T$. Al centro l'impulso è lontano dai fronti di salita e di discesa, dove si passa da un simbolo al successivo, quindi il valore letto è proprio l'ampiezza del simbolo in corso. La formula è questa interpretazione scritta in simboli: la fonte non la riporta.`,
    symbols: [
      { s: md`t_j`, meaning: md`istante del $j$-esimo campionamento` },
      { s: md`j`, meaning: md`indice dell'impulso, a partire da $0$` },
      { s: md`T`, meaning: md`durata di un impulso (periodo di simbolo)` },
      { s: md`0.5\,T`, meaning: md`mezzo periodo: sposta il campione dal bordo al centro dell'impulso` },
    ],
    whenToUse: md`Se all'orale ti chiedono come si ottiene $Y_s$ dal segnale continuo: un campione per simbolo, al centro dell'impulso.`,
    pitfalls: md`L'espressione «x.5T» delle note è ambigua; questa è una lettura, dichiarata come tale. Campionare sul bordo, a $t = jT$, mescolerebbe due simboli consecutivi.`,
    importance: 1,
    blanks: [
      {
        masked: md`t_j = (j + \boxed{\;?\;})\,T,\qquad j = 0, 1, 2, \dots`,
        answer: md`0.5`,
        distractors: [md`0`, md`1`, md`0.25`],
      },
    ],
    source: [{ doc: 'part1', page: 12 }],
  },

  // --- c08 Ys come variabile aleatoria discreta ----------------------------------------------------
  {
    id: 'f-c08',
    name: 'Probabilità a priori uniformi dei tre valori campionati',
    nameEn: 'Prior probability of each sampled value: 1/3',
    latex: md`P(Y_s = 0.25) = P(Y_s = 0.5) = P(Y_s = 0.75) = \frac{1}{3}`,
    explain: md`Il valore campionato $Y_s$ è una variabile aleatoria discreta (*discrete random variable*): prima di riceverlo non sai quale simbolo arriverà, ma sai che $Y_s$ può valere solo $0.25$, $0.5$ o $0.75$. Assumendo un sistema ideale, le note danno a ciascun valore probabilità a priori (*prior probability*) $1/3$. Dietro c'è l'ipotesi che la sorgente emetta i tre simboli con la stessa frequenza: nel canale ideale ogni simbolo produce sempre lo stesso valore, quindi le probabilità dei valori sono quelle dei simboli.`,
    symbols: [
      { s: md`Y_s`, meaning: md`valore campionato: variabile aleatoria discreta con tre valori possibili` },
      { s: md`P(Y_s = a)`, meaning: md`probabilità (una massa, non una densità) che il valore campionato sia $a$` },
      { s: md`\tfrac{1}{3}`, meaning: md`probabilità a priori di ciascun valore: tre valori equiprobabili, che sommano a $1$` },
    ],
    whenToUse: md`Quando descrivi il canale ideale in termini probabilistici: masse di probabilità concentrate su tre punti, nessuna incertezza sul legame tra valore e simbolo.`,
    pitfalls: md`Qui $P$ è una probabilità vera e propria, perché $Y_s$ è discreta. Con il rumore il segnale ricevuto diventa continuo e ha una densità: la probabilità di un singolo valore esatto diventa $0$.`,
    importance: 1,
    blanks: [
      {
        masked: md`P(Y_s = 0.25) = P(Y_s = 0.5) = P(Y_s = 0.75) = \boxed{\;?\;}`,
        answer: md`\frac{1}{3}`,
        distractors: [md`1`, md`\frac{1}{2}`, md`0.25`],
      },
    ],
    source: [{ doc: 'part1', page: 12 }],
  },
  {
    id: 'f-c08-2',
    name: 'Probabilità condizionata nel canale ideale: 1 oppure 0',
    nameEn: 'Conditional probability of Ys given Yes',
    latex: md`P(Y_s \mid \text{Yes}) = \begin{cases} 1 & Y_s = 0.25\\ 0 & \text{altrimenti}\end{cases}`,
    explain: md`Se è stato trasmesso Yes, nel sistema ideale il ricevitore legge con certezza $0.25$: la probabilità condizionata (*conditional probability*) di $Y_s$ dato Yes vale $1$ in $0.25$ e $0$ altrove. Lo stesso principio vale per gli altri simboli: $P(Y_s \mid \text{Maybe})$ è concentrata in $0.5$, $P(Y_s \mid \text{No})$ in $0.75$. Le distribuzioni condizionate sono impulsi, e l'impulso di un simbolo non si sovrappone a quello di un altro: non c'è incertezza da modellare, quindi il classificatore a valori esatti non sbaglia mai.`,
    symbols: [
      { s: md`P(Y_s \mid \text{Yes})`, meaning: md`probabilità del valore campionato sapendo che è stato trasmesso Yes` },
      { s: md`\text{altrimenti}`, meaning: md`qualunque altro valore di $Y_s$, cioè $0.5$ o $0.75$ (*otherwise*)` },
    ],
    whenToUse: md`Per contrasto con il canale rumoroso: lì la stessa condizionata diventa una densità gaussiana centrata in $0.25$, e le tre campane si sovrappongono.`,
    pitfalls: md`Non confondere la condizionata ($1$ in $0.25$) con il prior ($1/3$ per ciascun valore): la prima dice che cosa leggi se sai il simbolo, il secondo quanto è probabile ciascun valore prima di sapere qualsiasi cosa.`,
    importance: 1,
    blanks: [
      {
        masked: md`P(Y_s \mid \text{Yes}) = \begin{cases} \boxed{\;?\;} & Y_s = 0.25\\ 0 & \text{altrimenti}\end{cases}`,
        answer: md`1`,
        distractors: [md`\frac{1}{3}`, md`0.25`],
      },
    ],
    source: [{ doc: 'part1', page: 12 }],
  },
  {
    id: 'f-c08-3',
    name: 'Probabilità totale nel canale ideale',
    nameEn: 'Total probability theorem in the ideal channel',
    latex: md`P(Y_s = 0.25) = \sum_{s \in \{\text{Yes},\,\text{Maybe},\,\text{No}\}} P(Y_s = 0.25\mid s)\,P(s) = P(\text{Yes})`,
    explain: md`La formula non è nelle note: lega il prior dei valori campionati a quello dei simboli con il teorema della probabilità totale (*total probability theorem*). Si somma su tutti i simboli la probabilità di leggere $0.25$ dato quel simbolo, pesata con la probabilità del simbolo. Nel canale ideale solo Yes produce $0.25$ (condizionata $1$), gli altri danno $0$, quindi resta $P(\text{Yes})$. Con simboli equiprobabili si ritrova $1/3$. Con prior diversi, per esempio $0.5$, $0.3$ e $0.2$, cambierebbero le $P(Y_s)$ ma non le condizionate.`,
    symbols: [
      { s: md`s`, meaning: md`simbolo trasmesso: Yes, Maybe o No` },
      { s: md`P(s)`, meaning: md`probabilità a priori che la sorgente emetta il simbolo $s$` },
      { s: md`P(Y_s = 0.25 \mid s)`, meaning: md`probabilità di leggere $0.25$ quando è stato trasmesso $s$: $1$ per Yes, $0$ per gli altri` },
    ],
    whenToUse: md`Per spiegare da dove viene l'$1/3$ delle note: è l'ipotesi di simboli equiprobabili, trasportata sui valori dal canale ideale.`,
    pitfalls: md`L'uguaglianza finale vale solo nel canale ideale. Con il rumore ogni simbolo contribuisce un po' a ogni valore ricevuto, e la somma pesata delle condizionate diventa la mistura di gaussiane della densità del segnale ricevuto. Nel canale rumoroso, inoltre, prior diversi spostano le soglie di decisione ([«Soglie del canale PAM con prior diversi»](#derivation:der08)).`,
    importance: 1,
    blanks: [
      {
        masked: md`P(Y_s = 0.25) = \sum_{s \in \{\text{Yes},\,\text{Maybe},\,\text{No}\}} P(Y_s = 0.25\mid s)\,\boxed{\;?\;} = P(\text{Yes})`,
        answer: md`P(s)`,
        distractors: [md`P(s \mid Y_s = 0.25)`, md`P(Y_s = 0.25 \mid s)`],
      },
    ],
    source: [{ doc: 'part1', page: 12 }],
  },

  // --- c09 Canale reale: rumore gaussiano additivo --------------------------------------------------
  {
    id: 'f-c09',
    name: 'Canale con rumore additivo',
    nameEn: 'Additive noise channel: received = transmitted + noise',
    latex: md`y = x + n`,
    explain: md`Nella pratica un sistema ideale non esiste: il rumore di canale (*channel noise*) distorce il segnale trasmesso. Le note assumono un rumore gaussiano additivo (*additive Gaussian noise*): il segnale ricevuto $y$ è la somma del segnale trasmesso $x$ e del rumore $n$. «Additivo» significa che il rumore si somma al segnale senza dipendere dal suo valore: ogni simbolo viene spostato di una quantità aleatoria, con la stessa legge per tutti. Esempio: trasmetti Yes ($x = 0.25$), il rumore vale $n = 0.07$, ricevi $y = 0.32$.`,
    symbols: [
      { s: md`x`, meaning: md`segnale trasmesso, uno scalare: l'ampiezza PAM $0.25$, $0.5$ o $0.75$` },
      { s: md`n`, meaning: md`rumore di canale, variabile aleatoria continua gaussiana, indipendente da $x$` },
      { s: md`y`, meaning: md`segnale ricevuto: variabile aleatoria continua` },
    ],
    whenToUse: md`È il modello del canale reale nell'esempio delle note, e il motivo per cui serve la statistica: da qui in poi il ricevitore ragiona su densità, non su valori esatti. Si vede in azione nel widget [«Arriva il rumore: da tre valori a una densità»](#widget:m03-pam-rumore-gaussiano).`,
    pitfalls: md`Conflitto di notazione. Qui $x$ è uno scalare e $n$ è il rumore; dalla slide 7 in poi $\mathbf{x}$ in grassetto è il vettore delle feature e $n$ è il numero di feature. Inoltre si sommano i segnali, non le densità: le densità si combinano per convoluzione.`,
    importance: 2,
    blanks: [
      {
        masked: md`y = \boxed{\;?\;}`,
        answer: md`x + n`,
        distractors: [md`x \cdot n`, md`x * n`, md`x`],
      },
    ],
    source: [{ doc: 'part1', page: 13 }],
  },
  {
    id: 'f-c09-2',
    name: 'Rumore gaussiano a media nulla',
    nameEn: 'Zero-mean Gaussian noise',
    latex: md`n \sim \mathcal{N}(0, \sigma_n^2)`,
    explain: md`Le note dicono solo che il rumore segue una distribuzione gaussiana (*Gaussian distribution*), senza darne media e varianza. La media nulla è implicita: le note dicono che la densità di $y$ dato Yes è centrata attorno a $0.25$, il valore trasmesso, e questo succede solo se il rumore in media non sposta il segnale. La varianza $\sigma_n^2$ resta un parametro libero: fissa quanto sono larghe le campane attorno ai tre livelli, e quindi quanto spesso il ricevitore sbaglia.`,
    symbols: [
      { s: md`\sim`, meaning: md`«è distribuito come»` },
      { s: md`\mathcal{N}(\mu, \sigma^2)`, meaning: md`distribuzione gaussiana (normale) di media $\mu$ e varianza $\sigma^2$` },
      { s: md`0`, meaning: md`media del rumore: in media il segnale non viene spostato` },
      { s: md`\sigma_n^2`, meaning: md`varianza del rumore, non specificata nelle note` },
    ],
    whenToUse: md`Quando scrivi le densità condizionate del segnale ricevuto: ognuna è questa gaussiana traslata sul livello del simbolo.`,
    pitfalls: md`La formula esplicita è un'integrazione: le note non scrivono né $0$ né $\sigma_n^2$. Se il rumore avesse media diversa da zero, tutte e tre le campane sarebbero spostate della stessa quantità e le soglie andrebbero spostate con loro.`,
    importance: 2,
    blanks: [
      {
        masked: md`n \sim \mathcal{N}(\boxed{\;?\;}, \sigma_n^2)`,
        answer: md`0`,
        distractors: [md`0.25`, md`\sigma_n`, md`1`],
      },
    ],
    source: [{ doc: 'part1', page: 13 }],
  },

  // --- c10 Il classificatore a valori esatti non funziona più -------------------------------------
  {
    id: 'f-c10',
    name: 'Il valore ricevuto non coincide più con quello trasmesso',
    nameEn: 'The received values deviate from the nominal ones',
    latex: md`y = x + n \ne x`,
    explain: md`Con il rumore il classificatore di prima, basato sui valori esatti $0.25$, $0.5$ e $0.75$, non funziona più: i valori ricevuti si discostano (*deviate*) da quelli nominali. Il rumore è continuo, quindi la probabilità che valga esattamente $0$ è nulla: con probabilità $1$ il ricevitore legge un numero diverso da tutti e tre i livelli, e la regola «se $y = 0.25$ allora Yes» non scatta mai. È il passaggio che obbliga ad abbandonare il ragionamento per valori esatti e a descrivere il segnale ricevuto in termini statistici.`,
    symbols: [
      { s: md`x`, meaning: md`ampiezza trasmessa (valore nominale)` },
      { s: md`n`, meaning: md`rumore gaussiano, continuo` },
      { s: md`y`, meaning: md`valore ricevuto` },
      { s: md`\ne`, meaning: md`«diverso da»: vale con probabilità $1$, perché $P(n = 0) = 0$ per un rumore continuo` },
    ],
    whenToUse: md`Per motivare il passaggio dal sistema ideale al classificatore a soglie basato sulla verosimiglianza (*likelihood*).`,
    pitfalls: md`Non basta arrotondare al livello più vicino «perché il rumore è piccolo»: se il rumore sposta $0.25$ oltre metà strada verso $0.5$, anche l'arrotondamento sbaglia. Qualunque regola ha una probabilità d'errore, e per calcolarla servono le densità.`,
    importance: 1,
    blanks: [],
    source: [{ doc: 'part1', page: 13 }],
  },

  // --- c12 Convoluzione -----------------------------------------------------------------------------
  {
    id: 'f-c12',
    name: 'La densità del segnale ricevuto è una convoluzione',
    nameEn: 'Convolution of Px and Pn',
    latex: md`P_y = P_x * P_n`,
    explain: md`Conosci la distribuzione di $x$ e quella di $n$. $x$ è discreta (tre valori), $n$ è continua (gaussiana), quindi la loro somma $y$ è continua: $y$ ha una densità di probabilità (*probability density function*, PDF), mentre $x$ aveva una distribuzione di probabilità (*probability distribution*). Poiché $x$ e $n$ sono indipendenti, la densità di $y$ è la convoluzione della distribuzione di $x$ con la densità di $n$. Con tre impulsi da $1/3$ convolti con una campana si ottiene la campana copiata su ciascun livello con peso $1/3$.`,
    symbols: [
      { s: md`P_x`, meaning: md`distribuzione di probabilità (discreta) del segnale trasmesso: tre masse da $1/3$` },
      { s: md`P_n`, meaning: md`densità di probabilità del rumore gaussiano` },
      { s: md`P_y`, meaning: md`densità di probabilità del segnale ricevuto` },
      { s: md`*`, meaning: md`operatore di convoluzione (*convolution*)` },
    ],
    whenToUse: md`Quando all'orale devi dire come si passa dalle leggi di $x$ e $n$ a quella di $y$: variabili indipendenti che si sommano hanno densità che si convolvono. È il cuore dell'esempio [«Canale PAM reale»](#example:ex02).`,
    pitfalls: md`Due errori frequenti. Scrivere $P_y = P_x \cdot P_n$ (il prodotto vale per la densità congiunta di variabili indipendenti, non per la loro somma). Dimenticare l'ipotesi di indipendenza, senza la quale la convoluzione non vale. Le note usano la $P$ maiuscola per tutte e tre le leggi, anche per le due densità.`,
    importance: 2,
    blanks: [
      {
        masked: md`P_y = \boxed{\;?\;}`,
        answer: md`P_x * P_n`,
        distractors: [md`P_x \cdot P_n`, md`P_x + P_n`, md`P_x`],
      },
    ],
    source: [{ doc: 'part1', page: 13 }],
  },
  {
    id: 'f-c12-2',
    name: 'Densità del segnale ricevuto come mistura di tre gaussiane',
    nameEn: 'Density of y as a mixture of shifted noise densities',
    latex: md`p_y(y) = \sum_{i=1}^{3} P_x(a_i)\,p_n(y - a_i) = \frac{1}{3}\sum_{i=1}^{3} p_n(y - a_i),\qquad a_i \in \{0.25,\ 0.5,\ 0.75\}`,
    explain: md`È la convoluzione delle note scritta per esteso. Se è stato trasmesso il livello $a_i$, $y = a_i + n$ è il rumore traslato di $a_i$, con densità $p_n(y - a_i)$. Il teorema della probabilità totale somma queste densità pesandole con la probabilità di ciascun livello, $1/3$. Il risultato è una mistura di tre campane identiche centrate in $0.25$, $0.5$ e $0.75$. Integra a $1$: tre campane di area $1$ pesate $1/3$. Esempio con $\sigma_n = 0.1$: in $y = 0.3$ le tre campane valgono circa $3.52$, $0.54$ e $0.0002$, quindi $p_y(0.3) \approx 1.35$.`,
    symbols: [
      { s: md`a_i`, meaning: md`i tre livelli di ampiezza: $0.25$, $0.5$, $0.75$` },
      { s: md`P_x(a_i)`, meaning: md`probabilità a priori del livello $a_i$, qui $1/3$` },
      { s: md`p_n(y - a_i)`, meaning: md`densità del rumore valutata in $y - a_i$: la campana del rumore spostata sul livello $a_i$` },
      { s: md`p_y(y)`, meaning: md`densità del segnale ricevuto (la $P_y$ delle note)` },
    ],
    whenToUse: md`Quando devi disegnare la densità del segnale ricevuto: tre gobbe, tanto più separate quanto più $\sigma_n$ è piccola rispetto alla distanza $0.25$ tra i livelli. I passaggi completi sono nella dimostrazione [«Canale PAM con rumore: dalla somma alla mistura di gaussiane e alle soglie»](#derivation:der02); si vede nel widget [«Convoluzione e soglie»](#widget:m03-pam-convoluzione-soglie).`,
    pitfalls: md`Il segno è $y - a_i$, non $y + a_i$: la campana va centrata sul livello. Con prior diversi il fattore $1/3$ non si raccoglie più: ogni campana ha il suo peso $P_x(a_i)$. I valori della densità possono superare $1$: è una densità, non una probabilità.`,
    importance: 2,
    blanks: [
      {
        masked: md`p_y(y) = \frac{1}{3}\sum_{i=1}^{3} p_n(\boxed{\;?\;}),\qquad a_i \in \{0.25,\ 0.5,\ 0.75\}`,
        answer: md`y - a_i`,
        distractors: [md`y + a_i`, md`a_i`, md`y \cdot a_i`],
      },
    ],
    source: [{ doc: 'part1', page: 13 }],
  },

  // --- c13 Densità condizionata p(y|Yes) -----------------------------------------------------------
  {
    id: 'f-c13',
    name: 'Densità condizionata del segnale ricevuto dato Yes',
    nameEn: 'Conditional distribution of y given Yes',
    latex: md`p(y \mid \text{Yes}) = \frac{1}{\sqrt{2\pi}\,\sigma_n}\exp\!\left(-\frac{(y - 0.25)^2}{2\sigma_n^2}\right)`,
    explain: md`Le note lo dicono a parole: la distribuzione condizionata di $y$ dato Yes è una gaussiana centrata attorno a $0.25$, con una dispersione (*spread*) fissata dal rumore. Il motivo: se sai che è partito Yes, $x = 0.25$ è una costante e $y = 0.25 + n$ è il rumore traslato di $0.25$. Allo stesso modo $p(y \mid \text{Maybe})$ è centrata in $0.5$ e $p(y \mid \text{No})$ in $0.75$, tutte con la stessa $\sigma_n$. Con $\sigma_n = 0.1$ il picco vale $1/(\sqrt{2\pi}\cdot 0.1) \approx 3.99$. Sono queste densità condizionate, conosciute o stimate, a permettere di piazzare le soglie: è il primo punto del corso in cui compaiono.`,
    symbols: [
      { s: md`p(y \mid \text{Yes})`, meaning: md`densità del segnale ricevuto sapendo che è stato trasmesso Yes: la verosimiglianza (*likelihood*) del simbolo Yes` },
      { s: md`0.25`, meaning: md`media della campana: il livello PAM di Yes` },
      { s: md`\sigma_n`, meaning: md`deviazione standard del rumore: fissa la larghezza della campana` },
      { s: md`\frac{1}{\sqrt{2\pi}\,\sigma_n}`, meaning: md`costante di normalizzazione: fa integrare la campana a $1$` },
    ],
    whenToUse: md`Per confrontare i tre simboli dato un valore ricevuto: si valutano le tre campane nello stesso $y$ e si sceglie la più alta.`,
    pitfalls: md`La formula è un'esplicitazione dell'inventario, fondata su rumore a media nulla e indipendente da $x$. Nel canale ideale la stessa condizionata era un impulso; qui è una campana, e le campane di simboli vicini si sovrappongono: da quella sovrapposizione nascono gli errori.`,
    importance: 2,
    blanks: [
      {
        masked: md`p(y \mid \text{Yes}) = \frac{1}{\sqrt{2\pi}\,\sigma_n}\exp\!\left(-\frac{(y - \boxed{\;?\;})^2}{2\sigma_n^2}\right)`,
        answer: md`0.25`,
        distractors: [md`0`, md`0.5`, md`0.375`],
      },
      {
        masked: md`p(y \mid \text{Yes}) = \frac{1}{\boxed{\;?\;}}\exp\!\left(-\frac{(y - 0.25)^2}{2\sigma_n^2}\right)`,
        answer: md`\sqrt{2\pi}\,\sigma_n`,
        distractors: [md`2\pi\sigma_n^2`, md`\sqrt{2\pi}\,\sigma_n^2`, md`\sqrt{2\pi\sigma_n}`],
      },
    ],
    source: [{ doc: 'part1', page: 13 }],
  },

  // --- c14 Classificatore a soglie -------------------------------------------------------------------
  {
    id: 'f-c14',
    name: 'Regola di decisione a massima verosimiglianza',
    nameEn: 'Maximum likelihood decision rule',
    latex: md`\hat{s}(y) = \arg\max_{s \in \{\text{Yes},\,\text{Maybe},\,\text{No}\}} p(y \mid s)`,
    explain: md`Le note dicono che nel canale rumoroso si classifica il segnale ricevuto in base alla verosimiglianza (*likelihood*) che appartenga a una delle tre categorie. In simboli: si valutano le tre densità condizionate nel valore ricevuto $y$ e si sceglie il simbolo con la densità più alta. Su un asse monodimensionale il vincitore cambia solo dove due campane adiacenti si incrociano: quei punti sono le soglie di decisione (*decision thresholds*), e il modello a soglie (*threshold-based model*) è il modo pratico di applicare questa regola. Esempio con $\sigma_n = 0.1$: ricevi $y = 0.3$, le tre verosimiglianze valgono circa $3.52$, $0.54$ e $0.0002$, decidi Yes.`,
    symbols: [
      { s: md`\hat{s}(y)`, meaning: md`simbolo deciso dal ricevitore dopo aver osservato $y$` },
      { s: md`p(y \mid s)`, meaning: md`densità condizionata del segnale ricevuto dato il simbolo $s$: la verosimiglianza di $s$` },
      { s: md`\arg\max_s`, meaning: md`restituisce il simbolo $s$ che rende massima l'espressione, non il valore massimo` },
    ],
    whenToUse: md`Quando ti chiedono come si adatta il classificatore al rumore. È la stessa idea che tornerà nella stima a massima verosimiglianza: scegliere ciò che rende più probabili i dati osservati.`,
    pitfalls: md`Questa regola ignora i prior: è ottima (errore minimo) solo con simboli equiprobabili, come nelle note. Con prior diversi la regola migliore pesa ogni verosimiglianza con il suo prior, $\arg\max_s P(s)\,p(y \mid s)$ (regola MAP), e le soglie si spostano ([«Soglie del canale PAM con prior diversi»](#derivation:der08)).`,
    importance: 2,
    blanks: [
      {
        masked: md`\hat{s}(y) = \boxed{\;?\;}_{s \in \{\text{Yes},\,\text{Maybe},\,\text{No}\}}\, p(y \mid s)`,
        answer: md`\arg\max`,
        distractors: [md`\arg\min`, md`\max`, md`\sum`],
      },
    ],
    source: [{ doc: 'part1', page: 13 }],
  },
  {
    id: 'f-c14-2',
    name: 'Soglie di decisione a metà tra i livelli',
    nameEn: 'Decision thresholds (equal priors, equal variance)',
    latex: md`y < 0.375 \Rightarrow \text{Yes},\qquad 0.375 \le y < 0.625 \Rightarrow \text{Maybe},\qquad y \ge 0.625 \Rightarrow \text{No}`,
    explain: md`Le note non danno i valori delle soglie. Li fissano le ipotesi dell'esempio: prior uguali ($1/3$) e stessa varianza per le tre campane. Due gaussiane con la stessa $\sigma_n$ si incrociano a metà tra i loro centri: $(0.25 + 0.5)/2 = 0.375$ e $(0.5 + 0.75)/2 = 0.625$. L'asse si divide così in tre regioni di decisione. La probabilità d'errore vale $P_e = \frac{4}{3}\,Q(0.125/\sigma_n)$: i simboli estremi sbagliano da un lato solo, quello centrale da entrambi. Con $\sigma_n = 0.05$ l'errore è circa $0.83\%$, con $\sigma_n = 0.1$ circa $14.1\%$.`,
    symbols: [
      { s: md`0.375,\ 0.625`, meaning: md`soglie di decisione: punti medi tra livelli adiacenti, dove le campane si incrociano` },
      { s: md`\Rightarrow`, meaning: md`«si decide»: il simbolo assegnato a quella regione dell'asse` },
      { s: md`Q(z)`, meaning: md`coda della gaussiana standard: probabilità che una normale standard superi $z$` },
      { s: md`0.125`, meaning: md`distanza tra un livello e la soglia più vicina, metà della spaziatura $0.25$` },
    ],
    whenToUse: md`Per rendere concreto il modello a soglie delle note, con numeri e probabilità d'errore. Nel widget [«Convoluzione e soglie»](#widget:m03-pam-convoluzione-soglie) puoi muovere $\sigma_n$ e i prior.`,
    pitfalls: md`Valori, regioni e probabilità d'errore sono integrazioni coerenti con le ipotesi dell'esempio: le note non li riportano. Le soglie a metà strada sono ottime solo con prior uguali e stessa varianza. Con prior diversi la soglia tra due livelli $a_1 < a_2$ si sposta di $\frac{\sigma_n^2}{a_2 - a_1}\ln\frac{P_1}{P_2}$ verso il simbolo meno probabile. Esempio: con prior $0.5$, $0.3$, $0.2$ e $\sigma_n = 0.1$, la prima soglia passa da $0.375$ a circa $0.395$.`,
    importance: 2,
    blanks: [
      {
        masked: md`y < \boxed{\;?\;} \Rightarrow \text{Yes},\qquad 0.375 \le y < 0.625 \Rightarrow \text{Maybe},\qquad y \ge 0.625 \Rightarrow \text{No}`,
        answer: md`0.375`,
        distractors: [md`0.25`, md`0.5`, md`0.3`],
      },
    ],
    source: [{ doc: 'part1', page: 13 }],
  },

  // --- c16 Obiettivo del Capitolo 2 ---------------------------------------------------------------------
  {
    id: 'f-c16',
    name: 'La distribuzione statistica da stimare',
    nameEn: 'Statistical distribution of a stochastic signal',
    latex: md`p(\mathbf{x})`,
    explain: md`L'obiettivo del Capitolo 2 è studiare metodi e algoritmi per stimare la distribuzione statistica (*estimating the statistical distribution*) di un segnale stocastico a partire da un insieme di osservazioni disponibili (*samples*). L'oggetto da stimare è $p(\mathbf{x})$: la densità che dice quanto sono probabili le diverse configurazioni delle feature. Le note aggiungono il perché: stimando bene queste distribuzioni si capiscono meglio le caratteristiche dei dati e migliorano le prestazioni dei modelli di machine learning. Nel canale PAM la distribuzione in gioco era quella del segnale ricevuto $y$; con il pesce può essere la densità congiunta di luminosità e larghezza dei salmoni.`,
    symbols: [
      { s: md`p(\mathbf{x})`, meaning: md`distribuzione statistica (densità di probabilità) del segnale stocastico: è ciò che il capitolo insegna a stimare` },
      { s: md`\mathbf{x}`, meaning: md`osservazione del segnale, in generale un vettore di feature (grassetto)` },
    ],
    whenToUse: md`In apertura dell'orale sul Cap. 2: che cosa si stima (una pdf), da che cosa (campioni osservati) e perché (capire i dati, migliorare i modelli).`,
    pitfalls: md`Il capitolo stima distribuzioni, non singoli valori: anche quando si stimano parametri, come nei metodi parametrici, lo scopo è ricostruire $p(\mathbf{x})$.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 2 },
      { doc: 'part1', page: 13 },
    ],
  },

  // --- c17 Figura: p(x) sopra il piano (x1, x2) --------------------------------------------------------
  {
    id: 'f-c17',
    name: 'Densità sopra il piano delle feature',
    nameEn: 'p(x) over the (x1, x2) feature plane',
    latex: md`p(\mathbf{x}),\qquad \mathbf{x} = (x_1, x_2)`,
    explain: md`La slide 2 disegna $p(\mathbf{x})$ come una superficie sopra il piano orizzontale delle feature $x_1, x_2$: più «montagne» a campana di forma, altezza e orientamento diversi (rossa, grigio chiaro, grigio scuro, marrone), in parte sovrapposte ([figura delle superfici di densità](#figure:fig02)). Il messaggio: la distribuzione da stimare è una funzione definita su tutto lo spazio delle feature. La fonte non commenta i colori; una lettura naturale è che in un problema con più classi ogni classe abbia la sua montagna, e che le montagne si sovrappongano.`,
    symbols: [
      { s: md`x_1,\ x_2`, meaning: md`le due feature, assi del piano orizzontale` },
      { s: md`\mathbf{x} = (x_1, x_2)`, meaning: md`un punto del piano delle feature` },
      { s: md`p(\mathbf{x})`, meaning: md`altezza della superficie: valore della densità nel punto $\mathbf{x}$ (asse verticale)` },
    ],
    whenToUse: md`Per dare un'immagine mentale della pdf in due dimensioni prima di parlare di stima. Il widget [«Le montagne di densità sopra il piano delle feature»](#widget:m03-superfici-densita-2d) la fa ruotare.`,
    pitfalls: md`L'altezza non è una probabilità: una probabilità è il volume sotto la superficie sopra una regione del piano, e il volume totale sotto una densità vale $1$ (proprietà generale delle pdf, non scritta nella slide).`,
    importance: 1,
    blanks: [],
    source: [
      { doc: 'ch2', page: 2 },
      { doc: 'part1', page: 13 },
    ],
  },

  // --- c34 Vettore delle feature e pdf incognita ---------------------------------------------------
  {
    id: 'f-c34',
    name: 'Vettore delle feature',
    nameEn: 'Vector of n features',
    latex: md`\mathbf{x} = (x_1, x_2, \dots, x_n)`,
    explain: md`È la prima riga dell'impostazione del problema di stima della pdf (*PDF estimation*): un'osservazione è un vettore di $n$ feature, e $n$ è la dimensione dello spazio delle feature. Nel pesce, con luminosità e larghezza, $n = 2$ e $\mathbf{x} = (x_1, x_2)$.`,
    symbols: [
      { s: md`\mathbf{x}`, meaning: md`vettore delle feature: una singola osservazione (in grassetto perché è un vettore)` },
      { s: md`x_j`, meaning: md`$j$-esima feature, uno scalare` },
      { s: md`n`, meaning: md`numero di feature, cioè la dimensione di $\mathbf{x}$` },
    ],
    whenToUse: md`All'inizio di ogni risposta sulla stima di pdf: definisci $\mathbf{x}$ e la sua dimensione $n$ prima di parlare di campioni.`,
    pitfalls: md`$n$ minuscolo è il numero di feature, $N$ maiuscolo il numero di campioni: scambiarli è l'errore più comune in questo capitolo. Nell'esempio PAM $n$ indicava il rumore e $x$ uno scalare: da qui in poi la notazione cambia.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mathbf{x} = (x_1, x_2, \dots, \boxed{\;?\;})`,
        answer: md`x_n`,
        distractors: [md`x_N`, md`\mathbf{x}_N`, md`\mathbf{x}_n`],
      },
    ],
    source: [
      { doc: 'ch2', page: 7 },
      { doc: 'part1', page: 16 },
    ],
  },
  {
    id: 'f-c34-2',
    name: 'pdf vera e incognita',
    nameEn: 'Unknown pdf p(x)',
    latex: md`p(\mathbf{x})`,
    explain: md`Il vettore delle feature ha una densità di probabilità incognita (*unknown pdf*, in rosso nella slide): $p(\mathbf{x})$. È la densità congiunta delle $n$ feature. Esiste, perché i dati vengono generati da qualche meccanismo, ma chi progetta il sistema non la conosce. Tutto il problema della stima nasce da qui: si vorrebbe usare $p(\mathbf{x})$, per esempio in un classificatore, ma si hanno solo dei campioni.`,
    symbols: [
      { s: md`p(\mathbf{x})`, meaning: md`pdf vera (*true pdf*) del vettore delle feature: esiste ma è incognita` },
      { s: md`\mathbf{x}`, meaning: md`vettore delle $n$ feature` },
    ],
    whenToUse: md`Per distinguere subito ciò che è vero e incognito ($p$, senza cappello) da ciò che si calcola dai dati ($\hat{p}$, con il cappello).`,
    pitfalls: md`Senza cappello è sempre la pdf vera: se scrivi $p(\mathbf{x})$ intendendo la stima, all'orale il docente ti ferma. La pdf vera non si calcola mai direttamente: se ne costruisce una stima dai campioni.`,
    importance: 3,
    blanks: [
      {
        masked: md`\text{pdf vera e incognita del vettore delle feature: }\ \boxed{\;?\;}`,
        answer: md`p(\mathbf{x})`,
        distractors: [md`\hat{p}(\mathbf{x})`, md`p(\mathbf{X})`, md`p(\hat{\mathbf{x}})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 7 },
      { doc: 'part1', page: 16 },
    ],
  },

  // --- c35 Insieme di training iid ------------------------------------------------------------------
  {
    id: 'f-c35',
    name: 'Insieme dei campioni di training',
    nameEn: 'Finite set of N training samples',
    latex: md`\mathbf{X} = \{\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_N\}`,
    explain: md`L'unica informazione disponibile sulla pdf incognita è un insieme finito $\mathbf{X}$ di $N$ campioni (osservazioni) estratti da quella pdf. La slide li chiama campioni di training (*training samples*). Ogni elemento è un vettore di $n$ feature: $\mathbf{X}$ contiene in tutto $N$ vettori, cioè $N \cdot n$ numeri. Nel pesce: $N = 200$ salmoni misurati, ciascuno con $n = 2$ feature.`,
    symbols: [
      { s: md`\mathbf{X}`, meaning: md`insieme dei campioni di training (maiuscolo e in grassetto)` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo campione: un vettore di $n$ feature` },
      { s: md`N`, meaning: md`numero di campioni di training` },
    ],
    whenToUse: md`Subito dopo aver definito $\mathbf{x}$ e $p(\mathbf{x})$: è il «materiale» da cui ogni stimatore parte.`,
    pitfalls: md`$\mathbf{x}_k$ (pedice $k$, grassetto) è un campione intero; $x_j$ (pedice $j$, non grassetto) è una sua componente. $N$ conta i campioni, $n$ le feature. La slide 9 chiama $\mathbf{X}$ anche «vettore di variabili aleatorie iid»: è lo stesso oggetto, senza conseguenze pratiche.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mathbf{X} = \{\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_{\boxed{\;?\;}}\}`,
        answer: md`N`,
        distractors: [md`n`, md`k`, md`\infty`],
      },
    ],
    source: [
      { doc: 'ch2', page: 7 },
      { doc: 'part1', page: 16 },
    ],
  },
  {
    id: 'f-c35-2',
    name: 'Campioni indipendenti e identicamente distribuiti',
    nameEn: 'Independent and identically distributed (iid) samples',
    latex: md`\mathbf{x}_k \sim p(\mathbf{x}),\qquad k = 1, \dots, N\quad \text{(iid)}`,
    explain: md`I campioni sono indipendenti e identicamente distribuiti (*independent and identically distributed*, iid, in rosso nella slide). Identicamente distribuiti: ogni $\mathbf{x}_k$ è estratto dalla stessa pdf $p(\mathbf{x})$, quella che vuoi stimare. Indipendenti: il valore di un campione non dà informazioni sugli altri. L'indipendenza è ciò che, più avanti, permette di scrivere la densità congiunta dei campioni come prodotto delle densità dei singoli campioni, cioè la verosimiglianza ([«Dalla densità congiunta dei campioni iid alla verosimiglianza come prodotto»](#derivation:der01)).`,
    symbols: [
      { s: md`\mathbf{x}_k \sim p(\mathbf{x})`, meaning: md`il $k$-esimo campione è estratto dalla pdf $p(\mathbf{x})$` },
      { s: md`k`, meaning: md`indice del campione, da $1$ a $N$` },
      { s: md`\text{iid}`, meaning: md`indipendenti e identicamente distribuiti` },
    ],
    whenToUse: md`Ogni volta che scrivi la verosimiglianza come prodotto: l'ipotesi iid va dichiarata prima. Il widget [«iid per davvero?»](#widget:m03-ipotesi-iid-alla-prova) mostra che cosa cambia con campioni correlati.`,
    pitfalls: md`Le note avvertono che nei casi reali l'ipotesi iid è raramente vera, per le dipendenze tra i dati (misure consecutive nel tempo, pesci dello stesso lotto): la si assume per semplificare i calcoli. Indipendenti non vuol dire identicamente distribuiti: sono due richieste distinte.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mathbf{x}_k \sim \boxed{\;?\;},\qquad k = 1, \dots, N\quad \text{(iid)}`,
        answer: md`p(\mathbf{x})`,
        distractors: [md`\hat{p}(\mathbf{x})`, md`p(\mathbf{x}_k \mid \mathbf{x}_{k-1})`, md`p_k(\mathbf{x})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 7 },
      { doc: 'part1', page: 16 },
    ],
  },

  // --- c37 Obiettivo della stima di pdf ---------------------------------------------------------------
  {
    id: 'f-c37',
    name: 'Stima della pdf',
    nameEn: 'Estimate of the pdf',
    latex: md`\hat{p}(\mathbf{x})`,
    explain: md`La stima (*estimate*) della pdf si indica con il cappello: $\hat{p}(\mathbf{x})$. In tutto il corso il cappello segna una quantità calcolata dai dati: $\hat{p}$ è la stima della densità, più avanti $\hat{\boldsymbol{\theta}}$ sarà la stima dei parametri. A differenza di $p(\mathbf{x})$, che è fissa e incognita, $\hat{p}(\mathbf{x})$ è una funzione che puoi calcolare e valutare in qualunque punto $\mathbf{x}$.`,
    symbols: [
      { s: md`\hat{p}(\mathbf{x})`, meaning: md`stima della pdf ottenuta dai campioni $\mathbf{X}$` },
      { s: md`\hat{\ }`, meaning: md`cappello: indica una quantità stimata dai dati` },
    ],
    whenToUse: md`Ogni volta che parli del risultato di un metodo di stima, parametrico (un modello con i parametri stimati) o non parametrico (K-NN, finestre di Parzen).`,
    pitfalls: md`Il cappello va sulla $p$, non sulla $\mathbf{x}$: $p(\hat{\mathbf{x}})$ non ha senso qui, perché il punto $\mathbf{x}$ in cui valuti la densità non è stimato.`,
    importance: 3,
    blanks: [
      {
        masked: md`\text{stima della pdf ottenuta dai campioni } \mathbf{X}:\ \boxed{\;?\;}`,
        answer: md`\hat{p}(\mathbf{x})`,
        distractors: [md`p(\mathbf{x})`, md`p(\hat{\mathbf{x}})`, md`\hat{p}(\mathbf{X})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 7 },
      { doc: 'part1', page: 16 },
    ],
  },
  {
    id: 'f-c37-2',
    name: 'Obiettivo: una stima il più vicina possibile alla pdf vera',
    nameEn: 'Objective: an estimate as close as possible to the true pdf',
    latex: md`\hat{p}(\mathbf{x}) \approx p(\mathbf{x})`,
    explain: md`È il riquadro verde della slide 7, quello indicato dalla manina. Obiettivo (*Objective*): determinare una stima $\hat{p}(\mathbf{x})$ sulla base dei campioni disponibili $\mathbf{X}$ che sia il più vicina possibile (*as close as possible*) alla pdf vera $p(\mathbf{x})$. Le note lo ripetono con altre parole: si vuole un modello di densità che rifletta accuratamente la distribuzione che ha generato i dati.`,
    symbols: [
      { s: md`\hat{p}(\mathbf{x})`, meaning: md`stima della pdf, costruita dai campioni` },
      { s: md`p(\mathbf{x})`, meaning: md`pdf vera, incognita` },
      { s: md`\approx`, meaning: md`«il più vicina possibile a»: la stima non sarà mai esattamente uguale alla pdf vera` },
    ],
    whenToUse: md`È la frase da dire quando ti chiedono qual è lo scopo della stima di pdf. Il widget [«Un campione alla volta: la pdf nascosta dietro il sipario»](#widget:m03-campioni-che-rivelano-la-pdf) mostra la stima che si avvicina alla pdf vera man mano che arrivano campioni.`,
    pitfalls: md`In queste pagine la fonte non dice come misurare la «vicinanza» tra stima e pdf vera: la qualità di uno stimatore verrà giudicata con bias, varianza e consistenza. Con $N$ finito l'uguaglianza esatta non si ottiene mai.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x}) \approx \boxed{\;?\;}`,
        answer: md`p(\mathbf{x})`,
        distractors: [md`p(\mathbf{X})`, md`\hat{p}(\mathbf{X})`, md`\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k`],
      },
    ],
    source: [
      { doc: 'ch2', page: 7 },
      { doc: 'part1', page: 16 },
    ],
  },
  {
    id: 'f-c37-3',
    name: 'La stima dipende dai campioni',
    nameEn: 'The estimate is a function of the training set',
    latex: md`\hat{p}(\mathbf{x}) = \hat{p}(\mathbf{x};\,\mathbf{X})`,
    explain: md`La stima è costruita «sulla base dei campioni disponibili $\mathbf{X}$» (*on the basis of the available samples X*): è una funzione dei campioni. La notazione con il punto e virgola lo rende esplicito: $\mathbf{x}$ è il punto in cui valuti la densità, $\mathbf{X}$ è l'insieme di training da cui l'hai calcolata. Cambia l'insieme di training, per esempio un altro giorno di pesca con altri 200 salmoni, e cambia la stima. Poiché i campioni sono aleatori, anche la stima lo è: è per questo che se ne studiano bias e varianza.`,
    symbols: [
      { s: md`\mathbf{x}`, meaning: md`punto in cui valuti la stima (argomento della funzione)` },
      { s: md`\mathbf{X}`, meaning: md`insieme di training usato per costruire la stima` },
      { s: md`;`, meaning: md`separa l'argomento ($\mathbf{x}$) da ciò da cui la funzione dipende ($\mathbf{X}$)` },
    ],
    whenToUse: md`Per collegare l'obiettivo della stima alla valutazione degli stimatori: una stima che dipende da dati aleatori è essa stessa aleatoria. Il widget [«Un altro giorno di pesca, un'altra stima»](#widget:m03-stima-che-cambia-col-training-set) lo fa vedere.`,
    pitfalls: md`La stima dipende da tutti i campioni, non da uno solo, ed è calcolabile senza conoscere $p(\mathbf{x})$: una «stima» che usa la pdf vera non è una stima. La notazione con il punto e virgola non è nella slide: esplicita la frase «on the basis of the available samples».`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{p}(\mathbf{x}) = \hat{p}(\mathbf{x};\,\boxed{\;?\;})`,
        answer: md`\mathbf{X}`,
        distractors: [md`\mathbf{x}_k`, md`p(\mathbf{x})`, md`n`],
      },
    ],
    source: [
      { doc: 'ch2', page: 7 },
      { doc: 'part1', page: 16 },
    ],
  },
]
