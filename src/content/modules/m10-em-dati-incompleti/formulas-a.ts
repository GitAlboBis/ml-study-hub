// Formule del foglio m10 (stima con dati incompleti e algoritmo EM), concetti c01-c34 dell'inventario.
// Convenzione condivisa: una voce per ogni stringa LaTeX di concepts[].latex, id "f-<concetto>" per la prima,
// "f-<concetto>-2", "f-<concetto>-3"... per le successive. Il campo latex è copiato dall'inventario
// (verificato sulle immagini di ch2 p67-73 e part1 p46-49) e scripts/formula-coverage.ts lo ritrova per confronto.
// importance = examRelevance del concetto. Le formule ricostruite (non scritte nella fonte) lo dicono nel testo.
// Concetti c01-c34 senza LaTeX nell'inventario (nessuna voce): c01-c05, c12-c17, c20, c22, c24, c28, c29, c32.
// Esempio numerico ricorrente (cast "pesce"): luminosità, salmone P1 = 0.6, m1 = 3, spigola P2 = 0.4, m2 = 6,
// varianze 1; pesci di luminosità 3, 4, 6 -> p = 0.241, 0.167, 0.162; posterior del salmone 0.99, 0.87, 0.02.
import { md } from '../../types'
import type { Formula } from '../../types'

export const formulasA: Formula[] = [
  // --- c06 Due forme di dato incompleto -------------------------------------------------------------
  {
    id: 'f-c06',
    name: 'Dati osservati più dati mancanti: le due forme di dato incompleto',
    nameEn: 'Complete dataset Z = (X, Y): hidden mode membership vs missing feature values',
    latex: md`\mathbf{Z} = (\mathbf{X}, \mathbf{Y})`,
    explain: md`La fonte chiama «dati incompleti» (*incomplete data*) due situazioni diverse, e questa coppia le mette sotto lo stesso tetto. **Feature mancanti** (*missing feature values*): alcuni campioni hanno un valore non misurato, come il punto dell'esempio finale a cui manca la componente $x_1$ (le note: *certain features may be missing from some samples*). **Appartenenza nascosta** (*hidden mode membership*): ogni campione è misurato per intero, ma non sai quale modo della mistura lo ha generato. In entrambi i casi chiami $\mathbf{Y}$ ciò che manca e $\mathbf{Z}$ la versione completa dei dati: per questo lo stesso algoritmo EM risolve i due problemi. Esempio col pesce: sul nastro misuri la luminosità di ogni pesce ($\mathbf{X}$), ma nessuno ti dice se era un salmone o una spigola ($\mathbf{Y}$ è l'etichetta nascosta); se invece un sensore si guasta e non registra la larghezza di un pesce, $\mathbf{Y}$ è quella larghezza.`,
    symbols: [
      { s: md`\mathbf{X}`, meaning: md`dati osservati: il dataset incompleto (*incomplete dataset*)` },
      { s: md`\mathbf{Y}`, meaning: md`dati mancanti o latenti: etichette di modo nascoste oppure valori di feature non misurati` },
      { s: md`\mathbf{Z}`, meaning: md`dataset completo (*complete dataset*), mai disponibile per intero` },
    ],
    whenToUse: md`Quando all'orale ti chiedono che cosa si intende per dati incompleti: nomini le due forme e mostri che entrambe si scrivono come $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$, così la stessa macchina (EM) le tratta tutte e due.`,
    pitfalls: md`$\mathbf{Y}$ non è un parametro: i parametri stanno in $\boldsymbol{\theta}$ e sono costanti ignote, $\mathbf{Y}$ è una quantità aleatoria che accompagna ogni campione. Nella mistura «dato incompleto» non vuol dire che manchino misure: manca l'etichetta del modo.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'part1', page: 46 },
      { doc: 'part1', page: 47 },
      { doc: 'part1', page: 50 },
      { doc: 'ch2', page: 69 },
      { doc: 'ch2', page: 77 },
    ],
  },

  // --- c07 N osservazioni i.i.d. ----------------------------------------------------------------------
  {
    id: 'f-c07',
    name: 'N osservazioni i.i.d. in uno spazio n-dimensionale',
    nameEn: 'N i.i.d. observations defined in an n-dimensional space',
    latex: md`\mathbf{x}_i \quad (i = 1, 2, \ldots, N)`,
    explain: md`Punto di partenza dell'esempio (slide 68): hai $N$ osservazioni $\mathbf{x}_i$, vettori di uno spazio $X$ a $n$ dimensioni, indipendenti e identicamente distribuite (*independent and identically distributed*, i.i.d.). Identicamente distribuite: escono tutte dalla stessa $p(\mathbf{x})$. Indipendenti: un campione non dice nulla sugli altri. È l'ipotesi che più avanti permette di scrivere la verosimiglianza come prodotto sui campioni. Esempio: $N = 500$ pesci passati sul nastro, per ognuno $n = 2$ feature (luminosità e larghezza), quindi ogni $\mathbf{x}_i$ è un vettore di $\mathbb{R}^2$.`,
    symbols: [
      { s: md`\mathbf{x}_i`, meaning: md`$i$-esima osservazione, un vettore di $n$ feature` },
      { s: md`N`, meaning: md`numero di osservazioni i.i.d.` },
      { s: md`n`, meaning: md`dimensione dello spazio delle feature` },
      { s: md`X`, meaning: md`lo spazio delle feature; più avanti $\mathbf{X}$ in grassetto indica l'insieme dei dati osservati` },
    ],
    whenToUse: md`Per aprire la formulazione dell'esempio: prima dici che cosa osservi, poi da quale modello lo supponi generato (la mistura di gaussiane).`,
    pitfalls: md`Non confondere $N$ (quanti campioni) con $n$ (quante feature). L'indice $i$ qui numera i campioni, ma nella stessa slide numera anche i modi ($P_i$, $\mathbf{m}_i$, $\Sigma_i$); dalla slide 76 i campioni passano all'indice $j$ e $i$ resta ai modi. In questo foglio, quando campioni e modi compaiono insieme, i campioni usano $j$.`,
    importance: 2,
    blanks: [],
    source: [
      { doc: 'ch2', page: 68 },
      { doc: 'part1', page: 46 },
    ],
  },

  // --- c08 Mistura di M modi gaussiani ------------------------------------------------------------
  {
    id: 'f-c08',
    name: 'Mistura di M modi gaussiani',
    nameEn: 'Mixture of M Gaussian modes (Gaussian Mixture Model)',
    latex: md`p(\mathbf{x}) = \sum_{i=1}^{M} P_i \, p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i)`,
    explain: md`Supponi che le osservazioni vengano da una densità $p(\mathbf{x})$ fatta di $M$ campane gaussiane (*mixture of M Gaussian modes*): ogni termine della somma è un modo (*mode*) o componente (*mixture component*), con il suo vettore media e la sua matrice di covarianza, pesato dalla sua probabilità a priori $P_i$. Le note lo chiamano modello a mistura di gaussiane (*Gaussian Mixture Model*, GMM). Leggila come una ricetta per generare i dati: scegli un modo con probabilità $P_i$, poi estrai $\mathbf{x}$ dalla gaussiana di quel modo. Esempio col pesce, una sola feature (luminosità) e $M = 2$: salmone con $P_1 = 0.6$, $m_1 = 3$, $\sigma_1^2 = 1$; spigola con $P_2 = 0.4$, $m_2 = 6$, $\sigma_2^2 = 1$. In $x = 4$ le due campane valgono $0.242$ e $0.054$, quindi $p(4) = 0.6 \cdot 0.242 + 0.4 \cdot 0.054 = 0.145 + 0.022 = 0.167$. La forma del modello è nota; EM ne stima i parametri.`,
    symbols: [
      { s: md`p(\mathbf{x})`, meaning: md`densità complessiva dei dati: l'unica di cui osservi i campioni` },
      { s: md`M`, meaning: md`numero di modi (componenti) gaussiani della mistura` },
      { s: md`P_i`, meaning: md`probabilità a priori del modo $i$, il suo peso nella mistura (*mixing weight*)` },
      { s: md`p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i)`, meaning: md`densità gaussiana del modo $i$, con vettore media $\mathbf{m}_i$ e matrice di covarianza $\Sigma_i$` },
      { s: md`\sum_{i=1}^{M}`, meaning: md`la «relazione di tipo somma» tra i modi nascosti (slide 69): è tutto ciò che sai su come si combinano` },
    ],
    whenToUse: md`È la formula da cui parte l'esempio «Multi Gaussian» chiesto all'orale: la scrivi subito, poi spieghi perché stimarne i parametri è un problema con dati incompleti. Torna nel denominatore di tutte le equazioni EM, valutata con i parametri correnti ([«la mistura corrente valutata nel campione»](#formula:f-c47)).`,
    pitfalls: md`Senza i pesi $P_i$ (che sommano a 1) la somma di $M$ gaussiane integrerebbe a $M$ e non sarebbe una densità. La mistura non è nemmeno una gaussiana di media $\sum_i P_i \mathbf{m}_i$: può avere più picchi. Le note scrivono la stessa formula con un punto di moltiplicazione e senza grassetto, $p(x) = \sum_{i=1}^{M} P_i \cdot p(x \,|\, m_i, \Sigma_i)$: il contenuto è identico.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}) = \sum_{i=1}^{M} \boxed{\;?\;} \, p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i)`,
        answer: md`P_i`,
        distractors: [md`\frac{1}{M}`, md`\frac{1}{N}`, md`P(i \,|\, \mathbf{x})`],
      },
      {
        masked: md`p(\mathbf{x}) = \boxed{\;?\;} P_i \, p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i)`,
        answer: md`\sum_{i=1}^{M}`,
        distractors: [md`\prod_{i=1}^{M}`, md`\sum_{i=1}^{N}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 68 },
      { doc: 'part1', page: 46 },
    ],
  },

  // --- c09 Parametri del modo i e densità di componente -----------------------------------------
  {
    id: 'f-c09',
    name: 'I tre parametri di ogni modo',
    nameEn: 'Prior probability, mean vector and covariance matrix of the i-th mixture component',
    latex: md`P_i, \; \mathbf{m}_i, \; \Sigma_i`,
    explain: md`Ogni modo $i$ della mistura è descritto da tre quantità (slide 68: *the prior probability, the mean vector and the covariance matrix of the i-th mixture component, respectively*). $P_i$ dice quale frazione dei campioni proviene in media dal modo $i$; $\mathbf{m}_i$ dice dove sta il centro della campana; $\Sigma_i$ ne dà la forma e l'orientamento, cioè quanto è larga lungo ogni asse e quanto sono correlate le feature. Le note aggiungono un quarto punto: $p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i)$ rappresenta la distribuzione gaussiana (*represents the Gaussian distribution*). Esempio col pesce in due feature (luminosità, larghezza): per i salmoni $P_1 = 0.6$, $\mathbf{m}_1 = (3, 2)^t$ e $\Sigma_1 = \mathrm{diag}(1, 0.25)$, cioè luminosità più variabile della larghezza e nessuna correlazione tra le due.`,
    symbols: [
      { s: md`P_i`, meaning: md`probabilità a priori del modo $i$ (*prior probability*)` },
      { s: md`\mathbf{m}_i`, meaning: md`vettore media del modo $i$ (*mean vector*), con $n$ componenti` },
      { s: md`\Sigma_i`, meaning: md`matrice di covarianza del modo $i$ (*covariance matrix*), $n \times n$, simmetrica e definita positiva` },
    ],
    whenToUse: md`Subito dopo la formula della mistura, per dire che cosa si deve stimare. Sono gli stessi tre oggetti che l'M-step aggiorna con le equazioni EM ([«come si ricavano le tre equazioni EM»](#derivation:der05)).`,
    pitfalls: md`$P_i$ è la probabilità del modo prima di guardare il campione; dopo averlo visto diventa la probabilità a posteriori del modo, il termine ricorrente delle equazioni EM. $\Sigma_i$ è la covarianza, non la sua inversa: l'inversa compare solo nell'esponente della gaussiana.`,
    importance: 3,
    blanks: [
      {
        masked: md`P_i, \; \mathbf{m}_i, \; \boxed{\;?\;}`,
        answer: md`\Sigma_i`,
        distractors: [md`\Sigma_i^{-1}`, md`|\Sigma_i|`, md`\mathbf{x}_i`],
      },
      {
        masked: md`\boxed{\;?\;}, \; \mathbf{m}_i, \; \Sigma_i`,
        answer: md`P_i`,
        distractors: [md`P(i \,|\, \mathbf{x}_j)`, md`p(\mathbf{x}_i)`],
      },
    ],
    source: [
      { doc: 'ch2', page: 68 },
      { doc: 'part1', page: 46 },
    ],
  },
  {
    id: 'f-c09-2',
    name: 'Densità gaussiana del modo i (richiamo)',
    nameEn: 'Multivariate Gaussian density of the i-th mode',
    latex: md`p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i) = \frac{1}{(2\pi)^{n/2} \, |\Sigma_i|^{1/2}} \exp\left\{ -\frac{1}{2} (\mathbf{x} - \mathbf{m}_i)^{t} \, \Sigma_i^{-1} (\mathbf{x} - \mathbf{m}_i) \right\}`,
    explain: md`È la forma esplicita di ogni componente della mistura: la gaussiana multivariata in $n$ dimensioni con media $\mathbf{m}_i$ e covarianza $\Sigma_i$. Le pagine dell'EM non la riscrivono (le note dicono solo che $p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i)$ *represents the Gaussian distribution*): è quella del modello gaussiano (slide 26 del capitolo), riportata qui perché serve a calcolare a mano le equazioni EM. Leggila in due pezzi. L'esponente contiene la distanza di Mahalanobis al quadrato $(\mathbf{x} - \mathbf{m}_i)^t \Sigma_i^{-1} (\mathbf{x} - \mathbf{m}_i)$, che misura quanto il campione è lontano dal centro tenendo conto della forma della campana. Il fattore davanti, $1/((2\pi)^{n/2} \vert\Sigma_i\vert^{1/2})$, fa integrare la densità a 1. Esempio: il salmone con $\mathbf{m}_1 = (3, 2)^t$ e $\Sigma_1 = \mathrm{diag}(1, 0.25)$, valutato nel pesce $\mathbf{x} = (4, 2)^t$: la distanza al quadrato vale $1^2/1 + 0^2/0.25 = 1$ e $\vert\Sigma_1\vert^{1/2} = 0.5$, quindi $p = e^{-1/2}/(2\pi \cdot 0.5) \approx 0.193$. In una dimensione ($n = 1$, $\Sigma_i = \sigma_i^2$) diventa $\frac{1}{\sqrt{2\pi}\,\sigma_i} e^{-(x - m_i)^2/(2\sigma_i^2)}$: con $m_1 = 3$, $\sigma_1 = 1$ e $x = 4$ vale $0.242$.`,
    symbols: [
      { s: md`n`, meaning: md`dimensione dello spazio delle feature` },
      { s: md`|\Sigma_i|`, meaning: md`determinante della matrice di covarianza del modo $i$` },
      { s: md`\Sigma_i^{-1}`, meaning: md`inversa della matrice di covarianza` },
      { s: md`(\mathbf{x} - \mathbf{m}_i)^{t}`, meaning: md`scarto dal centro, trasposto (la slide indica la trasposta con l'apice $t$)` },
      { s: md`(\mathbf{x} - \mathbf{m}_i)^{t} \, \Sigma_i^{-1} (\mathbf{x} - \mathbf{m}_i)`, meaning: md`distanza di Mahalanobis al quadrato dal centro del modo` },
    ],
    whenToUse: md`Quando devi calcolare i valori $p(\mathbf{x}_j \,|\, \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})$ che entrano nell'E-step e nelle equazioni EM. All'orale può servire scriverla per intero se ti chiedono l'esempio della mistura.`,
    pitfalls: md`Tre errori tipici: la radice sul determinante ($\vert\Sigma_i\vert^{1/2}$, non $\vert\Sigma_i\vert$); l'inversa nell'esponente ($\Sigma_i^{-1}$, non $\Sigma_i$); il fattore $-\frac{1}{2}$ davanti alla forma quadratica. L'esponente di $2\pi$ è $n/2$: vale $1/2$ solo in una dimensione.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i) = \frac{1}{(2\pi)^{n/2} \, \boxed{\;?\;}} \exp\left\{ -\frac{1}{2} (\mathbf{x} - \mathbf{m}_i)^{t} \, \Sigma_i^{-1} (\mathbf{x} - \mathbf{m}_i) \right\}`,
        answer: md`|\Sigma_i|^{1/2}`,
        distractors: [md`|\Sigma_i|`, md`|\Sigma_i|^{-1/2}`, md`|\Sigma_i|^{n/2}`],
      },
      {
        masked: md`p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i) = \frac{1}{(2\pi)^{n/2} \, |\Sigma_i|^{1/2}} \exp\left\{ -\frac{1}{2} (\mathbf{x} - \mathbf{m}_i)^{t} \, \boxed{\;?\;} (\mathbf{x} - \mathbf{m}_i) \right\}`,
        answer: md`\Sigma_i^{-1}`,
        distractors: [md`\Sigma_i`, md`|\Sigma_i|^{-1}`],
      },
      {
        masked: md`p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i) = \frac{1}{\boxed{\;?\;} \, |\Sigma_i|^{1/2}} \exp\left\{ -\frac{1}{2} (\mathbf{x} - \mathbf{m}_i)^{t} \, \Sigma_i^{-1} (\mathbf{x} - \mathbf{m}_i) \right\}`,
        answer: md`(2\pi)^{n/2}`,
        distractors: [md`(2\pi)^{1/2}`, md`(2\pi)^{n}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 68 },
      { doc: 'part1', page: 46 },
      { doc: 'ch2', page: 26 },
    ],
  },

  // --- c10 Vincoli sulle probabilità a priori -------------------------------------------------------
  {
    id: 'f-c10',
    name: 'Vincoli sui pesi della mistura',
    nameEn: 'Prior probabilities (mixing weights) are non-negative and sum to one',
    latex: md`\sum_{i=1}^{M} P_i = 1, \qquad P_i \ge 0`,
    explain: md`I $P_i$ sono le probabilità a priori di $M$ eventi che si escludono a vicenda e coprono tutti i casi: ogni campione viene da uno e un solo modo. Per questo sono non negativi e sommano a 1. Le note (p49) li chiamano pesi della mistura (*mixing weights*). La slide non scrive il vincolo, che è implicito nella parola *prior probability*; è ciò che fa integrare la mistura a 1: $\int p(\mathbf{x})\,d\mathbf{x} = \sum_i P_i \int p(\mathbf{x} \,|\, \mathbf{m}_i, \Sigma_i)\,d\mathbf{x} = \sum_i P_i = 1$. Col pesce: $P_1 = 0.6$ (salmoni) e $P_2 = 0.4$ (spigole) dicono che il nastro porta in media 60 salmoni ogni 100 pesci.`,
    symbols: [
      { s: md`P_i`, meaning: md`peso del modo $i$: probabilità che un campione estratto a caso venga dal modo $i$` },
      { s: md`M`, meaning: md`numero di modi della mistura` },
    ],
    whenToUse: md`Quando ricavi l'aggiornamento EM delle probabilità a priori: massimizzando con questo vincolo (un moltiplicatore di Lagrange) compare il fattore $1/N$ ([«come si ricavano le tre equazioni EM»](#derivation:der05)). Serve anche a controllare un risultato numerico: i nuovi pesi $P_i^{[k+1]}$ devono sommare a 1.`,
    pitfalls: md`Non basta $0 \le P_i \le 1$ per ciascun modo: serve anche la somma uguale a 1. Senza vincolo la verosimiglianza crescerebbe senza limite gonfiando tutti i $P_i$: la densità di ogni campione, $\sum_i P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)$, è lineare e crescente nei pesi, e la verosimiglianza, prodotto di $N$ di questi fattori (un polinomio di grado $N$ nei $P_i$), cresce con loro.`,
    importance: 2,
    blanks: [
      {
        masked: md`\sum_{i=1}^{M} P_i = \boxed{\;?\;}, \qquad P_i \ge 0`,
        answer: md`1`,
        distractors: [md`M`, md`\frac{1}{M}`, md`N`],
      },
    ],
    source: [
      { doc: 'ch2', page: 68 },
      { doc: 'part1', page: 46 },
      { doc: 'part1', page: 49 },
    ],
  },

  // --- c11 Vettore dei parametri ----------------------------------------------------------------------
  {
    id: 'f-c11',
    name: 'Vettore dei parametri della mistura',
    nameEn: 'Vector of parameters to be estimated',
    latex: md`\theta = [P_1, P_2, \ldots, P_M; \; \mathbf{m}_1, \mathbf{m}_2, \ldots, \mathbf{m}_M; \; \Sigma_1, \Sigma_2, \ldots, \Sigma_M]`,
    explain: md`Tutte le incognite del problema finiscono in un solo vettore (slide 68): le $M$ probabilità a priori, gli $M$ vettori media e le $M$ matrici di covarianza. Le note elencano i tre gruppi di parametri di interesse: il contributo di ogni modo alla mistura (*the contribution of each Gaussian mode to the overall mixture*), la media di ogni modo, la matrice di covarianza di ogni modo. La forma del modello è nota (mistura di gaussiane), i valori di $\theta$ no: il problema resta una stima parametrica, ed è $\theta$ che EM aggiorna a ogni iterazione, $\theta^{(0)}, \theta^{(1)}, \ldots$. Per farti un'idea di quanti numeri contiene (conteggio aggiunto qui, non nella slide): con $M = 2$ modi e $n = 2$ feature (luminosità e larghezza del pesce) hai 2 pesi, $2 \cdot 2 = 4$ componenti delle medie e $2 \cdot 3 = 6$ elementi distinti delle covarianze, perché ogni $\Sigma_i$ è simmetrica e ha $n(n+1)/2 = 3$ valori liberi. Totale 12 numeri, 11 liberi perché i pesi sommano a 1.`,
    symbols: [
      { s: md`\theta`, meaning: md`vettore di tutti i parametri della mistura da stimare` },
      { s: md`P_1, \ldots, P_M`, meaning: md`probabilità a priori (pesi) dei modi` },
      { s: md`\mathbf{m}_1, \ldots, \mathbf{m}_M`, meaning: md`vettori media dei modi` },
      { s: md`\Sigma_1, \ldots, \Sigma_M`, meaning: md`matrici di covarianza dei modi` },
    ],
    whenToUse: md`Dopo la formula della mistura, per dichiarare l'obiettivo: stimare $\theta$, cioè la distribuzione di ciascun modo gaussiano.`,
    pitfalls: md`I campioni $\mathbf{x}_j$ e le etichette dei modi non fanno parte di $\theta$: i primi sono dati osservati, le seconde sono variabili latenti. Nella slide 68 (e nelle note p46) $\theta$ non è in grassetto, dalla slide 70 in poi sì: è lo stesso oggetto.`,
    importance: 3,
    blanks: [
      {
        masked: md`\theta = [P_1, P_2, \ldots, P_M; \; \mathbf{m}_1, \mathbf{m}_2, \ldots, \mathbf{m}_M; \; \boxed{\;?\;}]`,
        answer: md`\Sigma_1, \Sigma_2, \ldots, \Sigma_M`,
        distractors: [md`\mathbf{x}_1, \mathbf{x}_2, \ldots, \mathbf{x}_N`, md`\Sigma_1^{-1}, \Sigma_2^{-1}, \ldots, \Sigma_M^{-1}`, md`\mathbf{y}_1, \mathbf{y}_2, \ldots, \mathbf{y}_N`],
      },
      {
        masked: md`\theta = [\boxed{\;?\;}; \; \mathbf{m}_1, \mathbf{m}_2, \ldots, \mathbf{m}_M; \; \Sigma_1, \Sigma_2, \ldots, \Sigma_M]`,
        answer: md`P_1, P_2, \ldots, P_M`,
        distractors: [md`p(\mathbf{x}_1), p(\mathbf{x}_2), \ldots, p(\mathbf{x}_N)`, md`P(1 \,|\, \mathbf{x}_j), \ldots, P(M \,|\, \mathbf{x}_j)`],
      },
    ],
    source: [
      { doc: 'ch2', page: 68 },
      { doc: 'part1', page: 46 },
    ],
  },

  // --- c18 Problema ML ----------------------------------------------------------------------------------
  {
    id: 'f-c18',
    name: 'Problema di stima a massima verosimiglianza',
    nameEn: 'ML estimation problem',
    latex: md`\boldsymbol{\theta}^{*} = \arg\max \; l(\boldsymbol{\theta} | \mathbf{X})`,
    explain: md`La slide «Problem Formulation» riparte dalla massima verosimiglianza (*Maximum Likelihood*, ML): la stima ottima $\boldsymbol{\theta}^*$ è il vettore di parametri che rende massima la verosimiglianza $l(\boldsymbol{\theta} \,|\, \mathbf{X})$ dei dati osservati. EM non cambia questo criterio: resta una stima ML, cambia solo il modo di cercarne il massimo quando non esiste una soluzione analitica. Esempio: tre pesci di luminosità 3, 4 e 6, e una mistura con salmone ($P_1 = 0.6$, $m_1 = 3$) e spigola ($P_2 = 0.4$, $m_2 = 6$), varianze 1. La verosimiglianza vale $0.241 \cdot 0.167 \cdot 0.162 \approx 0.0065$; ML cerca i pesi, le medie e le varianze che rendono questo numero il più grande possibile.`,
    symbols: [
      { s: md`\boldsymbol{\theta}^{*}`, meaning: md`stima a massima verosimiglianza dei parametri` },
      { s: md`l(\boldsymbol{\theta} | \mathbf{X})`, meaning: md`verosimiglianza (*likelihood*): funzione dei parametri a dati osservati fissati` },
      { s: md`\mathbf{X}`, meaning: md`dati osservati, le $N$ osservazioni` },
      { s: md`\arg\max`, meaning: md`restituisce il punto in cui la funzione è massima, non il valore massimo` },
    ],
    whenToUse: md`All'inizio della formulazione di EM: dici che l'obiettivo resta la ML e che il problema è come calcolarla quando la forma di $p(\mathbf{X} \,|\, \boldsymbol{\theta})$ la rende difficile.`,
    pitfalls: md`$\arg\max$ restituisce $\boldsymbol{\theta}$, non il valore di $l$. La barra in $l(\boldsymbol{\theta} \,|\, \mathbf{X})$ non è un condizionamento su $\boldsymbol{\theta}$, che in ML non è aleatorio: dice che $l$ è funzione dei parametri con i dati fissati. Massimizzare $l$ o $\ln l$ dà lo stesso $\boldsymbol{\theta}^*$, perché il logaritmo è crescente.`,
    importance: 3,
    blanks: [
      {
        masked: md`\boldsymbol{\theta}^{*} = \boxed{\;?\;} \; l(\boldsymbol{\theta} | \mathbf{X})`,
        answer: md`\arg\max`,
        distractors: [md`\arg\min`, md`\max`],
      },
    ],
    source: [
      { doc: 'ch2', page: 70 },
      { doc: 'part1', page: 47 },
    ],
  },
  {
    id: 'f-c18-2',
    name: "Problema ML con la variabile sotto l'argmax (note)",
    nameEn: 'ML estimation problem, argmax over θ',
    latex: md`\theta^{*} = \underset{\theta}{\operatorname{argmax}} \; l(\theta | X)`,
    explain: md`È la stessa formula nelle note (p47): la variabile rispetto a cui si massimizza, $\theta$, compare sotto l'argmax, e nessun simbolo è in grassetto. Leggila così: fra tutti i valori possibili dei parametri scegli quello che rende più probabili i dati che hai visto. Le note la introducono con un contrasto: il modello non parametrico ignorerebbe la struttura nota (è una mistura di gaussiane), mentre usando questa informazione a priori il problema diventa parametrico (*when prior information is used, the estimation problem becomes parametric*). È questa $l(\theta \,|\, X)$, la verosimiglianza dei dati osservati dati i parametri, che si vuole massimizzare.`,
    symbols: [
      { s: md`\theta^{*}`, meaning: md`stima a massima verosimiglianza` },
      { s: md`\underset{\theta}{\operatorname{argmax}}`, meaning: md`punto di massimo, cercato variando $\theta$` },
      { s: md`l(\theta | X)`, meaning: md`verosimiglianza dei dati osservati $X$ dati i parametri $\theta$` },
    ],
    whenToUse: md`Quando vuoi rendere esplicito su quale variabile si massimizza: tra poco, nell'M-step, la funzione da massimizzare avrà due argomenti e solo uno varia.`,
    pitfalls: md`Non è la stima MAP: si massimizza $l(\theta \,|\, X) = p(X \,|\, \theta)$, non la posterior $p(\theta \,|\, X)$, e nessuna prior su $\theta$ entra nel criterio. Non è nemmeno la verosimiglianza dei dati completi: quella contiene i dati mancanti e non si può calcolare.`,
    importance: 3,
    blanks: [
      {
        masked: md`\theta^{*} = \underset{\theta}{\operatorname{argmax}} \; \boxed{\;?\;}`,
        answer: md`l(\theta | X)`,
        distractors: [md`p(\theta | X)`, md`l(\theta | Z)`],
      },
    ],
    source: [
      { doc: 'part1', page: 47 },
      { doc: 'ch2', page: 70 },
    ],
  },

  // --- c19 Verosimiglianza come prodotto ---------------------------------------------------------------
  {
    id: 'f-c19',
    name: 'Verosimiglianza come prodotto sui campioni i.i.d.',
    nameEn: 'Likelihood function for i.i.d. samples',
    latex: md`l(\boldsymbol{\theta} | \mathbf{X}) = p(\mathbf{X} \,|\, \boldsymbol{\theta}) = \prod_{i=1}^{N} p(\mathbf{x}_i \,|\, \boldsymbol{\theta})`,
    explain: md`La verosimiglianza dei dati osservati è la densità congiunta di tutti gli $N$ campioni, letta come funzione di $\boldsymbol{\theta}$ (le note: *the likelihood of the observed data X given the parameters θ*). Poiché i campioni sono i.i.d., la congiunta si fattorizza: indipendenti, quindi prodotto delle densità dei singoli; identicamente distribuiti, quindi la stessa $p(\cdot \,|\, \boldsymbol{\theta})$ per tutti. Nella mistura ogni fattore $p(\mathbf{x}_i \,|\, \boldsymbol{\theta})$ è a sua volta la somma sugli $M$ modi. Esempio: tre pesci di luminosità 3, 4 e 6, salmone ($P_1 = 0.6$, $m_1 = 3$) e spigola ($P_2 = 0.4$, $m_2 = 6$), varianze 1. Allora $p(3) = 0.241$, $p(4) = 0.167$, $p(6) = 0.162$, quindi $l = 0.241 \cdot 0.167 \cdot 0.162 \approx 0.0065$ e $\ln l \approx -5.03$.`,
    symbols: [
      { s: md`\mathbf{X}`, meaning: md`insieme delle $N$ osservazioni $\mathbf{x}_1, \ldots, \mathbf{x}_N$` },
      { s: md`p(\mathbf{X} \,|\, \boldsymbol{\theta})`, meaning: md`densità congiunta dei dati osservati` },
      { s: md`p(\mathbf{x}_i \,|\, \boldsymbol{\theta})`, meaning: md`densità del modello valutata nel campione $i$-esimo` },
      { s: md`\prod_{i=1}^{N}`, meaning: md`prodotto sugli $N$ campioni: conseguenza dell'ipotesi i.i.d.` },
    ],
    whenToUse: md`Ogni volta che scrivi la ML: prima il prodotto, poi il logaritmo che lo trasforma in somma. Per la mistura, sostituendo ogni fattore arrivi al [logaritmo di una somma](#formula:f-c21).`,
    pitfalls: md`Il prodotto vale solo se i campioni sono indipendenti. Qui l'indice $i$ numera i campioni; quando compaiono anche i modi (dalla slide 76) i campioni passano all'indice $j$. Con molti campioni il prodotto di numeri piccoli va a zero nel calcolatore: in pratica si lavora sempre con $\ln l$.`,
    importance: 3,
    blanks: [
      {
        masked: md`l(\boldsymbol{\theta} | \mathbf{X}) = p(\mathbf{X} \,|\, \boldsymbol{\theta}) = \boxed{\;?\;}`,
        answer: md`\prod_{i=1}^{N} p(\mathbf{x}_i \,|\, \boldsymbol{\theta})`,
        distractors: [md`\sum_{i=1}^{N} p(\mathbf{x}_i \,|\, \boldsymbol{\theta})`, md`\prod_{i=1}^{N} p(\boldsymbol{\theta} \,|\, \mathbf{x}_i)`, md`\prod_{i=1}^{M} p(\mathbf{x}_i \,|\, \boldsymbol{\theta})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 70 },
      { doc: 'part1', page: 47 },
    ],
  },

  // --- c21 Log-verosimiglianza della mistura ---------------------------------------------------------
  {
    id: 'f-c21',
    name: 'Log-verosimiglianza della mistura: il logaritmo di una somma',
    nameEn: 'Log-likelihood of a Gaussian mixture (log of a sum)',
    latex: md`\ln l(\boldsymbol{\theta} | \mathbf{X}) = \sum_{j=1}^{N} \ln \left[ \sum_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`,
    explain: md`Questa formula non è scritta nella fonte: la ottieni mettendo la mistura della slide 68 dentro la verosimiglianza della slide 70 e passando al logaritmo. Il prodotto sui campioni diventa una somma su $j$, ma dentro ogni logaritmo resta la somma sui modi. Con una sola gaussiana il logaritmo cancellerebbe l'esponenziale e annullare le derivate darebbe media e covarianza campionarie in forma chiusa. Qui no: annullando la derivata rispetto a $\mathbf{m}_i$ compaiono le probabilità a posteriori dei modi, che dipendono da tutto $\boldsymbol{\theta}$. Ottieni equazioni accoppiate e implicite, senza soluzione analitica (le note: *an analytical solution is often not feasible*): per questo serve un metodo iterativo come EM. Esempio: per il pesce di luminosità 4, con salmone ($P_1 = 0.6$, $m_1 = 3$) e spigola ($P_2 = 0.4$, $m_2 = 6$), varianze 1, il termine vale $\ln(0.6 \cdot 0.242 + 0.4 \cdot 0.054) = \ln 0.167 \approx -1.79$.`,
    symbols: [
      { s: md`\ln l(\boldsymbol{\theta} | \mathbf{X})`, meaning: md`log-verosimiglianza dei dati osservati` },
      { s: md`j`, meaning: md`indice dei campioni, da 1 a $N$` },
      { s: md`i`, meaning: md`indice dei modi, da 1 a $M$` },
      { s: md`\ln \left[ \sum_{i=1}^{M} \cdots \right]`, meaning: md`logaritmo di una somma: non si separa modo per modo, ed è la causa dell'assenza di una soluzione in forma chiusa` },
    ],
    whenToUse: md`Quando all'orale ti chiedono perché la ML diretta della mistura è difficile e serve EM. I passaggi sono nella dimostrazione [«dalla ML alla log-verosimiglianza della mistura»](#derivation:der01).`,
    pitfalls: md`L'errore classico è portare il logaritmo dentro la somma: $\sum_i P_i \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)$ è un'altra funzione. Per il pesce di luminosità 4 vale $0.6 \ln 0.242 + 0.4 \ln 0.054 \approx -2.02$, non $-1.79$: per la concavità del logaritmo sta sempre sotto. Un logaritmo che separa i modi è proprio ciò che EM recupera introducendo le variabili latenti.`,
    importance: 2,
    blanks: [
      {
        masked: md`\ln l(\boldsymbol{\theta} | \mathbf{X}) = \sum_{j=1}^{N} \boxed{\;?\;}`,
        answer: md`\ln \left[ \sum_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`,
        distractors: [md`\sum_{i=1}^{M} P_i \, \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i)`, md`\ln \left[ \prod_{i=1}^{M} P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]`],
      },
    ],
    source: [
      { doc: 'ch2', page: 70 },
      { doc: 'ch2', page: 68 },
      { doc: 'part1', page: 47 },
    ],
  },

  // --- c23 Dataset completo --------------------------------------------------------------------------
  {
    id: 'f-c23',
    name: 'Dataset completo',
    nameEn: 'Complete dataset Z = (X, Y), Y missing data',
    latex: md`\mathbf{Z} = (\mathbf{X}, \mathbf{Y})`,
    explain: md`Seconda ipotesi della formulazione (slide 71): esiste un dataset completo (*complete dataset*) $\mathbf{Z}$, ottenuto affiancando ai dati osservati $\mathbf{X}$ le quantità $\mathbf{Y}$ che non hai potuto osservare, i dati mancanti (*missing data*; le note: *missing or latent data*). $\mathbf{Z}$ non è disponibile, ma è l'oggetto su cui EM ragiona: se lo avessi, la stima ML sarebbe facile. Nella mistura $\mathbf{Y}$ contiene, per ogni campione $\mathbf{x}_j$, un vettore binario lungo $M$ con un solo 1 nella posizione del modo che lo ha generato. Esempio col pesce: luminosità $x_j = 4$ e $\mathbf{y}_j = (1, 0)$ se è un salmone, $(0, 1)$ se è una spigola.`,
    symbols: [
      { s: md`\mathbf{Z}`, meaning: md`dataset completo` },
      { s: md`\mathbf{X}`, meaning: md`dati osservati: il dataset incompleto della prima ipotesi` },
      { s: md`\mathbf{Y}`, meaning: md`dati mancanti o latenti (*missing data*)` },
    ],
    whenToUse: md`Quando imposti la formulazione di EM: prima ipotesi ($\mathbf{X}$ osservato), seconda ipotesi (esiste $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$), poi la densità congiunta e le due verosimiglianze ([«dataset completo, densità congiunta e le due verosimiglianze»](#derivation:der02)).`,
    pitfalls: md`$\mathbf{Z}$ è un'ipotesi di lavoro, non un dato: nessun passo di EM usa i valori veri di $\mathbf{Y}$, solo la loro distribuzione dati $\mathbf{X}$ e la stima corrente. $\mathbf{Y}$ non va confuso con i parametri $\boldsymbol{\theta}$.`,
    importance: 3,
    blanks: [
      {
        masked: md`\mathbf{Z} = (\mathbf{X}, \boxed{\;?\;})`,
        answer: md`\mathbf{Y}`,
        distractors: [md`\boldsymbol{\theta}`, md`\boldsymbol{\theta}^{(k)}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 71 },
      { doc: 'part1', page: 47 },
    ],
  },

  // --- c25 Densità congiunta --------------------------------------------------------------------------
  {
    id: 'f-c25',
    name: 'Densità congiunta dei dati completi',
    nameEn: 'Joint density function of the complete data',
    latex: md`p(\mathbf{Z} \,|\, \boldsymbol{\theta}) = p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = p(\mathbf{Y} | \mathbf{X}, \boldsymbol{\theta}) \cdot p(\mathbf{X} \,|\, \boldsymbol{\theta})`,
    explain: md`È la regola del prodotto applicata alla coppia $(\mathbf{X}, \mathbf{Y})$: la densità dei dati completi (*joint density function*) si scompone nella densità dei dati mancanti condizionata a quelli osservati per la densità dei dati osservati. Vale per qualsiasi coppia di variabili aleatorie, senza ipotesi sul modello. Il primo fattore, $p(\mathbf{Y} \,|\, \mathbf{X}, \boldsymbol{\theta})$, è quello che l'E-step userà, valutato nella stima corrente $\boldsymbol{\theta}^{(k)}$, per mediare su $\mathbf{Y}$. Esempio col pesce di luminosità 4, salmone ($P_1 = 0.6$, $m_1 = 3$) e spigola ($P_2 = 0.4$, $m_2 = 6$), varianze 1: la congiunta $p(x = 4, \text{salmone}) = 0.145$ si scompone in $p(\text{salmone} \,|\, x = 4) \cdot p(x = 4) = 0.871 \cdot 0.167$.`,
    symbols: [
      { s: md`p(\mathbf{Z} \,|\, \boldsymbol{\theta})`, meaning: md`densità dei dati completi, uguale alla congiunta $p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta})$` },
      { s: md`p(\mathbf{Y} | \mathbf{X}, \boldsymbol{\theta})`, meaning: md`densità condizionata dei dati mancanti dati quelli osservati e i parametri` },
      { s: md`p(\mathbf{X} \,|\, \boldsymbol{\theta})`, meaning: md`densità dei soli dati osservati, cioè la verosimiglianza dei dati incompleti` },
    ],
    whenToUse: md`Nella formulazione del problema (slide 71) e nella dimostrazione che EM non fa scendere la log-verosimiglianza: passando al logaritmo e isolando $\ln p(\mathbf{X} \,|\, \boldsymbol{\theta})$ ottieni il primo passo ([«perché EM non fa mai scendere la log-verosimiglianza»](#derivation:der04)).`,
    pitfalls: md`L'ordine dei condizionamenti conta: il fattore è $p(\mathbf{Y} \,|\, \mathbf{X}, \boldsymbol{\theta})$, non $p(\mathbf{X} \,|\, \mathbf{Y}, \boldsymbol{\theta})$ (anche quella scomposizione è vera, ma allora l'altro fattore è $p(\mathbf{Y} \,|\, \boldsymbol{\theta})$). Scrivere $p(\mathbf{Y} \,|\, \boldsymbol{\theta})\,p(\mathbf{X} \,|\, \boldsymbol{\theta})$ supporrebbe $\mathbf{X}$ e $\mathbf{Y}$ indipendenti: osservare un pesce non direbbe nulla sul suo modo.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{Z} \,|\, \boldsymbol{\theta}) = p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = \boxed{\;?\;} \cdot p(\mathbf{X} \,|\, \boldsymbol{\theta})`,
        answer: md`p(\mathbf{Y} | \mathbf{X}, \boldsymbol{\theta})`,
        distractors: [md`p(\mathbf{Y} \,|\, \boldsymbol{\theta})`, md`p(\mathbf{X} \,|\, \mathbf{Y}, \boldsymbol{\theta})`, md`p(\mathbf{Y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 71 },
      { doc: 'part1', page: 47 },
    ],
  },

  // --- c26 Verosimiglianza dei dati completi -----------------------------------------------------------
  {
    id: 'f-c26',
    name: 'Verosimiglianza dei dati completi',
    nameEn: 'Complete-data likelihood',
    latex: md`l(\boldsymbol{\theta} | \mathbf{Z}) = p(\mathbf{Z} \,|\, \boldsymbol{\theta}) = p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta})`,
    explain: md`Se conoscessi anche $\mathbf{Y}$, la verosimiglianza sarebbe la densità congiunta dei dati completi letta come funzione di $\boldsymbol{\theta}$ (*complete-data likelihood*). Le note: contiene sia i dati osservati sia quelli mancanti ed è quindi più informativa; *if we knew the values of Y, we could solve the ML estimation problem directly*. Nella mistura, con le etichette note, il logaritmo della congiunta si separa: $\ln p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) = \sum_j \sum_i y_{ji} \left[ \ln P_i + \ln p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]$, dove $y_{ji}$, componente $i$ del vettore binario di appartenenza del campione $j$, vale 1 se $\mathbf{x}_j$ viene dal modo $i$ e 0 altrimenti. La ML si risolve allora modo per modo in forma chiusa: ogni modo prende la media e la covarianza campionarie dei suoi campioni, e $P_i$ è la frazione di campioni del modo. Esempio: un pesce di luminosità 4 che sai essere un salmone ($P_1 = 0.6$, $m_1 = 3$, varianza 1) contribuisce con $\ln 0.6 + \ln 0.242 = -0.51 - 1.42 = -1.93$: nessun logaritmo di una somma.`,
    symbols: [
      { s: md`l(\boldsymbol{\theta} | \mathbf{Z})`, meaning: md`verosimiglianza dei dati completi` },
      { s: md`p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta})`, meaning: md`densità congiunta di dati osservati e dati mancanti` },
    ],
    whenToUse: md`Per spiegare l'idea di EM: la verosimiglianza facile esiste ma non si può calcolare perché $\mathbf{Y}$ è ignoto, e EM ne prende la media ([«se Y fosse noto: la ML dei dati completi in forma chiusa»](#derivation:der09)).`,
    pitfalls: md`Sui dati reali non è calcolabile: contiene $\mathbf{Y}$. EM non la massimizza mai direttamente, massimizza il suo valore atteso $Q$.`,
    importance: 3,
    blanks: [
      {
        masked: md`l(\boldsymbol{\theta} | \mathbf{Z}) = p(\mathbf{Z} \,|\, \boldsymbol{\theta}) = \boxed{\;?\;}`,
        answer: md`p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta})`,
        distractors: [md`p(\mathbf{X} \,|\, \boldsymbol{\theta})`, md`p(\mathbf{Y} \,|\, \mathbf{X}, \boldsymbol{\theta})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 71 },
      { doc: 'part1', page: 47 },
    ],
  },

  // --- c27 Verosimiglianza dei dati incompleti ---------------------------------------------------------
  {
    id: 'f-c27',
    name: 'Verosimiglianza dei dati incompleti',
    nameEn: 'Incomplete-data likelihood',
    latex: md`l(\boldsymbol{\theta} | \mathbf{X}) = p(\mathbf{X} \,|\, \boldsymbol{\theta})`,
    explain: md`Poiché $\mathbf{Y}$ non si osserva, resta la verosimiglianza dei soli dati osservati (*incomplete-data likelihood*): la stessa $l(\boldsymbol{\theta} \,|\, \mathbf{X})$ del problema ML di partenza. Le note: è basata solo su $\mathbf{X}$ ed è *more challenging to maximize because of the missing data*. È l'unica verosimiglianza calcolabile ed è quella che si vuole massimizzare. Il legame con la congiunta, che la slide non scrive, è la marginalizzazione $p(\mathbf{X} \,|\, \boldsymbol{\theta}) = \int p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta})\,d\mathbf{y}$: nella mistura l'integrale è una somma sui modi e ridà esattamente la formula della mistura ([«la mistura come modello a variabile latente»](#formula:f-c65)). Esempio: per il pesce di luminosità 4, $p(x = 4 \,|\, \boldsymbol{\theta}) = p(4, \text{salmone}) + p(4, \text{spigola}) = 0.145 + 0.022 = 0.167$.`,
    symbols: [
      { s: md`l(\boldsymbol{\theta} | \mathbf{X})`, meaning: md`verosimiglianza dei soli dati osservati` },
      { s: md`p(\mathbf{X} \,|\, \boldsymbol{\theta})`, meaning: md`densità dei dati osservati: marginale della congiunta rispetto ai dati mancanti` },
    ],
    whenToUse: md`Quando confronti le due verosimiglianze: quella dei dati completi è facile ma incalcolabile, questa è calcolabile ma difficile da massimizzare. EM la fa crescere lavorando, in media, sull'altra.`,
    pitfalls: md`È la stessa funzione della slide 70: EM non cambia l'obiettivo. La garanzia di salita di EM riguarda questa log-verosimiglianza dei dati osservati, non $Q$.`,
    importance: 3,
    blanks: [
      {
        masked: md`l(\boldsymbol{\theta} | \mathbf{X}) = \boxed{\;?\;}`,
        answer: md`p(\mathbf{X} \,|\, \boldsymbol{\theta})`,
        distractors: [md`p(\boldsymbol{\theta} \,|\, \mathbf{X})`, md`p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 71 },
      { doc: 'part1', page: 47 },
      { doc: 'part1', page: 48 },
    ],
  },

  // --- c30 Aspettazione condizionata Q -----------------------------------------------------------------
  {
    id: 'f-c30',
    name: 'Aspettazione condizionata Q',
    nameEn: 'Conditional expectation Q(θ, θ^(k))',
    latex: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{ \log\left( p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) \right) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\}`,
    explain: md`EM calcola il valore atteso del logaritmo della verosimiglianza dei dati completi, $\log p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta})$, rispetto ai dati mancanti, dati $\mathbf{X}$ e una stima corrente di $\boldsymbol{\theta}$ (slide 72: *w.r.t. y, given X and a current estimate of θ*). Il risultato si chiama aspettazione condizionata (*conditional expectation*). Il ragionamento: $\log p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta})$ sarebbe facile da massimizzare ma contiene $\mathbf{Y}$, che non conosci; allora lo sostituisci con la sua media su tutti i valori possibili di $\mathbf{Y}$, pesati con quanto sono plausibili alla luce dei dati e dell'ultima stima $\boldsymbol{\theta}^{(k)}$. Le note: mediando su $\mathbf{Y}$ si rimuove l'incertezza legata alle variabili non osservate (*it effectively removes the uncertainty*), e Q diventa una funzione deterministica di $\boldsymbol{\theta}$, con $\boldsymbol{\theta}^{(k)}$ fisso. Nella mistura, dove $\mathbf{Y}$ è discreto, diventa $Q = \sum_j \sum_i P(i \,|\, \mathbf{x}_j, \boldsymbol{\theta}^{(k)}) \ln \left[ P_i \, p(\mathbf{x}_j \,|\, \mathbf{m}_i, \Sigma_i) \right]$ ([«dall'aspettazione condizionata alla forma integrale di Q»](#derivation:der03)).`,
    symbols: [
      { s: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})`, meaning: md`aspettazione condizionata del logaritmo della verosimiglianza dei dati completi` },
      { s: md`\boldsymbol{\theta}`, meaning: md`primo argomento: la variabile libera rispetto a cui Q verrà massimizzata` },
      { s: md`\boldsymbol{\theta}^{(k)}`, meaning: md`secondo argomento: stima corrente dei parametri all'iterazione $k$, fissata` },
      { s: md`E\{ \cdot \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)} \}`, meaning: md`valore atteso rispetto ai dati mancanti $\mathbf{Y}$, calcolato con la legge $p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})$` },
      { s: md`\log`, meaning: md`logaritmo naturale (la base non cambia il punto di massimo)` },
    ],
    whenToUse: md`È la formula centrale di EM, da scrivere e spiegare all'orale (*Explain formula*): che cosa si media, rispetto a che cosa, con quali pesi, e che ruolo hanno i due argomenti.`,
    pitfalls: md`$\boldsymbol{\theta}$ non è una variabile aleatoria (la stima è ML, non bayesiana): la barra $\vert\, \mathbf{X}, \boldsymbol{\theta}^{(k)}$ vuol dire che la media sui dati mancanti si calcola con la legge $p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})$, non che si condiziona su un evento. I due argomenti non sono intercambiabili: $Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta})$ è un'altra cosa. Il logaritmo sta dentro la media: $E\{\log p\}$, non $\log E\{p\}$.`,
    importance: 3,
    blanks: [
      {
        masked: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{ \boxed{\;?\;} \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\}`,
        answer: md`\log\left( p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) \right)`,
        distractors: [md`\log\left( p(\mathbf{X} \,|\, \boldsymbol{\theta}) \right)`, md`p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta})`, md`\log\left( p(\mathbf{Y} \,|\, \mathbf{X}, \boldsymbol{\theta}) \right)`],
      },
      {
        masked: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{ \log\left( p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) \right) \;\middle|\; \boxed{\;?\;} \right\}`,
        answer: md`\mathbf{X}, \boldsymbol{\theta}^{(k)}`,
        distractors: [md`\mathbf{X}, \boldsymbol{\theta}`, md`\mathbf{Y}, \boldsymbol{\theta}^{(k)}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 72 },
      { doc: 'part1', page: 48 },
    ],
  },

  // --- c31 Forma integrale di Q ------------------------------------------------------------------------
  {
    id: 'f-c31',
    name: 'Q scritta come integrale sui dati mancanti',
    nameEn: 'Conditional expectation written as an integral over y',
    latex: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \int \log\left( p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}) \right) p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) \, d\mathbf{y}`,
    explain: md`È la definizione di Q resa esplicita (nella slide la collega una freccia rossa): l'aspettazione è l'integrale, su tutti i valori $\mathbf{y}$ dei dati mancanti, di $\log p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta})$ pesato dalla densità condizionata $p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})$. Qui si vedono bene i ruoli dei due argomenti: il peso usa la stima vecchia $\boldsymbol{\theta}^{(k)}$ (numeri noti), il logaritmo usa l'incognita $\boldsymbol{\theta}$. Per $\mathbf{Y}$ discreto, come nella mistura, l'integrale diventa una somma sugli $M$ modi e il peso diventa la probabilità a posteriori del modo. Esempio con un solo pesce di luminosità 4, salmone ($P_1 = 0.6$, $m_1 = 3$) e spigola ($P_2 = 0.4$, $m_2 = 6$), varianze 1, valutando in $\boldsymbol{\theta} = \boldsymbol{\theta}^{(k)}$: i pesi sono $0.871$ e $0.129$, i logaritmi delle congiunte $\ln 0.145 = -1.93$ e $\ln 0.0216 = -3.84$, quindi $Q = 0.871 \cdot (-1.93) + 0.129 \cdot (-3.84) \approx -2.18$, un po' sotto $\ln p(4) = -1.79$.`,
    symbols: [
      { s: md`\int \cdots \, d\mathbf{y}`, meaning: md`somma (integrale) su tutti i valori possibili dei dati mancanti` },
      { s: md`\mathbf{y}`, meaning: md`variabile di integrazione: un valore possibile dei dati mancanti (minuscola, mentre $\mathbf{Y}$ maiuscola è la variabile aleatoria)` },
      { s: md`p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})`, meaning: md`densità dei dati mancanti dati quelli osservati e la stima corrente: il peso della media` },
      { s: md`\log\left( p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}) \right)`, meaning: md`log-verosimiglianza dei dati completi se i dati mancanti valessero $\mathbf{y}$` },
    ],
    whenToUse: md`Per mostrare all'orale che cosa si calcola davvero nell'E-step, e per passare al caso discreto della mistura, dove i pesi sono le probabilità a posteriori dei modi ([«il termine ricorrente delle equazioni EM»](#formula:f-c46)).`,
    pitfalls: md`Nel peso ci va $\boldsymbol{\theta}^{(k)}$, non $\boldsymbol{\theta}$: con $\boldsymbol{\theta}$ anche nel peso la funzione cambierebbe e la dimostrazione di monotonia non varrebbe più. Il peso è condizionato ai dati osservati, $p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})$, non è la sola prior $p(\mathbf{y} \,|\, \boldsymbol{\theta}^{(k)})$.`,
    importance: 3,
    blanks: [
      {
        masked: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \int \log\left( p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}) \right) \boxed{\;?\;} \, d\mathbf{y}`,
        answer: md`p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})`,
        distractors: [md`p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta})`, md`p(\mathbf{X} \,|\, \mathbf{y}, \boldsymbol{\theta}^{(k)})`, md`p(\mathbf{y} \,|\, \boldsymbol{\theta}^{(k)})`],
      },
      {
        masked: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \int \log\left( \boxed{\;?\;} \right) p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)}) \, d\mathbf{y}`,
        answer: md`p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta})`,
        distractors: [md`p(\mathbf{X}, \mathbf{y} \,|\, \boldsymbol{\theta}^{(k)})`, md`p(\mathbf{X} \,|\, \boldsymbol{\theta})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 72 },
      { doc: 'part1', page: 48 },
    ],
  },

  // --- c33 E-step ---------------------------------------------------------------------------------------
  {
    id: 'f-c33',
    name: 'E-step: passo di aspettazione',
    nameEn: 'Expectation (E) step',
    latex: md`\text{E-step:} \quad Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{ \log\left( p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) \right) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\}`,
    explain: md`È il primo dei due passi in cui la slide 73 formalizza EM. Con i parametri fermi alla stima corrente $\boldsymbol{\theta}^{(k)}$, calcoli la distribuzione dei dati latenti dati quelli osservati e con essa la funzione $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$. Il riquadro verde: l'E-step *computes an expectation of the likelihood by including the latent variables as if they were observed*. Le note: calcola il valore atteso della log-verosimiglianza dei dati completi rispetto alle latenti non osservate, che *are treated as if we had knowledge of their distribution based on the current estimate of the model parameters*. Nella mistura l'E-step si riduce a calcolare, per ogni campione e ogni modo, la probabilità a posteriori del modo. Per il pesce di luminosità 4, con salmone ($P_1 = 0.6$, $m_1 = 3$) e spigola ($P_2 = 0.4$, $m_2 = 6$), varianze 1, vale $0.145 / 0.167 = 0.87$ per il salmone e $0.13$ per la spigola: le latenti non vengono fissate a 0 o 1, ricevono una probabilità.`,
    symbols: [
      { s: md`\text{E-step}`, meaning: md`passo di aspettazione (*expectation step*)` },
      { s: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})`, meaning: md`la funzione costruita in questo passo, poi massimizzata nell'M-step` },
      { s: md`E\{ \cdot \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)} \}`, meaning: md`valore atteso rispetto ai dati mancanti $\mathbf{Y}$, calcolato con la legge $p(\mathbf{y} \,|\, \mathbf{X}, \boldsymbol{\theta}^{(k)})$ fissata dalla stima corrente` },
      { s: md`\boldsymbol{\theta}^{(k)}`, meaning: md`stima dei parametri all'iterazione $k$, ferma durante l'E-step` },
    ],
    whenToUse: md`Quando descrivi l'algoritmo: E-step e M-step si alternano, e i parametri trovati dall'M-step fanno partire un nuovo E-step (*the process is repeated*).`,
    pitfalls: md`Il riquadro verde parla di *expectation of the likelihood*, ma la formula (e le note: *expected value of the complete-data log-likelihood*) mostra che la media è presa sul logaritmo della verosimiglianza dei dati completi, non sulla verosimiglianza. Nell'E-step non si aggiorna nessun parametro.`,
    importance: 3,
    blanks: [
      {
        masked: md`\text{E-step:} \quad \boxed{\;?\;} = E\left\{ \log\left( p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) \right) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\}`,
        answer: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})`,
        distractors: [md`Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta})`, md`l(\boldsymbol{\theta} | \mathbf{X})`, md`\boldsymbol{\theta}^{(k+1)}`],
      },
      {
        masked: md`\text{E-step:} \quad Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \boxed{\;?\;}\left\{ \log\left( p(\mathbf{X}, \mathbf{Y} \,|\, \boldsymbol{\theta}) \right) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)} \right\}`,
        answer: md`E`,
        distractors: [md`\max`, md`\arg\max`],
      },
    ],
    source: [
      { doc: 'ch2', page: 73 },
      { doc: 'part1', page: 48 },
      { doc: 'part1', page: 49 },
    ],
  },

  // --- c34 M-step ---------------------------------------------------------------------------------------
  {
    id: 'f-c34',
    name: 'M-step: passo di massimizzazione',
    nameEn: 'Maximization (M) step',
    latex: md`\text{M-step:} \quad \boldsymbol{\theta}^{(k+1)} = \arg\max \; Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})`,
    explain: md`Il secondo passo: con Q costruita nell'E-step, quindi con i pesi dei dati latenti fermi, scegli come nuova stima il $\boldsymbol{\theta}$ che massimizza Q. Riquadro verde: l'M-step *computes the maximum likelihood estimates of the parameters by maximizing the expected likelihood found on the E step*; i parametri trovati fanno partire un nuovo E-step e il processo si ripete. Le note: le nuove stime si adattano meglio ai dati osservati, date le ipotesi fatte sulle latenti. È un passo facile perché Q è una media pesata di logaritmi di singole gaussiane, e ogni modo si massimizza separatamente in forma chiusa. Nella mistura ne escono le tre equazioni EM: probabilità a priori, medie e covarianze calcolate come stime ML pesate dalle probabilità a posteriori ([«come si ricavano le tre equazioni EM»](#derivation:der05)). Esempio col pesce: se le probabilità a posteriori del salmone per i pesci di luminosità 3, 4 e 6 sono $0.99$, $0.87$ e $0.02$, la nuova media del salmone è $(0.99 \cdot 3 + 0.87 \cdot 4 + 0.02 \cdot 6) / (0.99 + 0.87 + 0.02) \approx 3.49$.`,
    symbols: [
      { s: md`\text{M-step}`, meaning: md`passo di massimizzazione (*maximization step*)` },
      { s: md`\boldsymbol{\theta}^{(k+1)}`, meaning: md`nuova stima dei parametri: il massimo di Q rispetto al primo argomento` },
      { s: md`\arg\max`, meaning: md`si massimizza rispetto a $\boldsymbol{\theta}$, con $\boldsymbol{\theta}^{(k)}$ fisso` },
    ],
    whenToUse: md`Per completare la descrizione dell'algoritmo. Per la mistura, subito dopo scrivi le equazioni di aggiornamento, per esempio [quella delle medie](#formula:f-c49).`,
    pitfalls: md`A rigore l'M-step massimizza Q (la log-verosimiglianza attesa dei dati completi), non direttamente la verosimiglianza dei dati osservati, anche se le note lo semplificano così (*maximize the likelihood of the observed data*): è la [dimostrazione di monotonia](#derivation:der04) a garantire che anche quest'ultima non scenda. Il massimo è rispetto al primo argomento: $\boldsymbol{\theta}^{(k)}$ resta fisso.`,
    importance: 3,
    blanks: [
      {
        masked: md`\text{M-step:} \quad \boldsymbol{\theta}^{(k+1)} = \boxed{\;?\;} \; Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})`,
        answer: md`\arg\max`,
        distractors: [md`\arg\min`, md`E`],
      },
      {
        masked: md`\text{M-step:} \quad \boldsymbol{\theta}^{(k+1)} = \arg\max \; \boxed{\;?\;}`,
        answer: md`Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})`,
        distractors: [md`l(\boldsymbol{\theta} | \mathbf{Z})`, md`Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 73 },
      { doc: 'part1', page: 48 },
      { doc: 'part1', page: 49 },
    ],
  },
  {
    id: 'f-c34-2',
    name: "M-step con la variabile sotto l'argmax (note)",
    nameEn: 'M-step, argmax over θ',
    latex: md`\theta^{(k+1)} = \underset{\theta}{\operatorname{argmax}} \; Q(\theta, \theta^{(k)})`,
    explain: md`La stessa formula nelle note (p48), con la variabile di massimizzazione $\theta$ scritta sotto l'argmax: si varia $\theta$, mentre $\theta^{(k)}$ è una costante nota che fissa i pesi della media. Le note: una volta calcolata $Q(\theta, \theta^{(k)})$ nell'E-step, si aggiornano i parametri massimizzando questa log-verosimiglianza attesa rispetto a $\theta$; è il passo in cui si regolano i parametri per aumentare la verosimiglianza dei dati (*to adjust the parameters to increase the likelihood of the data*), e i parametri aggiornati fanno partire un nuovo E-step. Si ottiene così la sequenza $\theta^{(0)}, \theta^{(1)}, \theta^{(2)}, \ldots$, che si ferma quando i parametri non cambiano più in modo significativo tra un'iterazione e l'altra.`,
    symbols: [
      { s: md`\theta^{(k+1)}`, meaning: md`nuova stima dei parametri` },
      { s: md`\underset{\theta}{\operatorname{argmax}}`, meaning: md`massimo cercato variando il primo argomento $\theta$` },
      { s: md`\theta^{(k)}`, meaning: md`stima corrente, fissa durante la massimizzazione` },
    ],
    whenToUse: md`Quando vuoi mostrare all'orale che hai chiaro su quale argomento si massimizza.`,
    pitfalls: md`Massimizzare rispetto a $\theta^{(k)}$, o su entrambi gli argomenti insieme, non è EM. Le note scrivono $\theta$ senza grassetto, la slide in grassetto: è lo stesso vettore.`,
    importance: 3,
    blanks: [
      {
        masked: md`\theta^{(k+1)} = \underset{\boxed{\;?\;}}{\operatorname{argmax}} \; Q(\theta, \theta^{(k)})`,
        answer: md`\theta`,
        distractors: [md`\theta^{(k)}`, md`Y`],
      },
      {
        masked: md`\theta^{(k+1)} = \underset{\theta}{\operatorname{argmax}} \; Q(\theta, \boxed{\;?\;})`,
        answer: md`\theta^{(k)}`,
        distractors: [md`\theta^{(k+1)}`, md`\theta^{*}`],
      },
    ],
    source: [
      { doc: 'part1', page: 48 },
      { doc: 'ch2', page: 73 },
      { doc: 'part1', page: 49 },
    ],
  },
]
