# Resoconto di revisione: m10-em-dati-incompleti

Foglio «Stima con dati incompleti e algoritmo EM» (Cap. 2, Melgani; slide ch2 p67-77, note part1 p45-50).

## Giro 1

Correttore del giro 1. Ho controllato ogni rilievo sulle immagini delle pagine: ch2 p69, p70, p71, p72, p73, p74, p75, p76 e p77. Ho applicato tutti i 14 rilievi. Alcuni erano doppioni: 2, 6 e 12 riguardano la stessa nota sul grassetto, 3 e 11 la stessa frase sul massimo locale.

### Rilievi corretti

1. **Termini inglesi alla prima occorrenza (index.mdx).** Ho aggiunto l'inglese in corsivo per:
   - *log-likelihood*, nella panoramica;
   - *log-likelihood function*, sulla slide p74;
   - *current estimate of θ*, frase in rosso della slide p72, con «stima corrente» in grassetto;
   - *posterior probabilities*;
   - *fixed-point equation* e *fixed point*;
   - *Lagrange multiplier*, *product rule*, *marginalization*, *stationary point*, *generalized EM*, *basin of attraction*, *evidence*, *outer products*, *smoothness* e *hyperparameter*.

   Nei tre motivi dell'incompletezza ho aggiunto le tre frasi in rosso della slide p69, verificate sull'immagine: «observations associated with the whole p(x)», «which are the samples to use for the estimation of each mode?» e «relationship of the summation type between the different (hidden) modes». In più ho messo *local maximum* e *saddle point* nel riquadro dell'idea chiave, dove i due termini compaiono per la prima volta.
2. **Grassetto di θ (rilievi 2, 6 e 12).** Le immagini lo confermano: θ è in grassetto nella disuguaglianza di p74 e nei denominatori p(x_j|θ^[k]) di p76, mentre non lo è nel testo di p70, p72, p74 e p75. Ho corretto tre punti:
   - f-c52 in formulas-b.ts;
   - il punto 5 dei refusi in index.mdx;
   - fc-refusi-notazione in flashcards.ts.

   Il testo corretto dice: «in grassetto nelle formule delle slide 70-74 e 76; non nella slide 68, nel testo delle slide 70, 72, 74 e 75, né nella figura di p74». Ho aggiunto l'unica eccezione dentro una formula: l'ultimo θ di p(X,Y|θ) a p71, già segnalato come refuso nel foglio. Ho anche precisato «nelle formule» nella nota di index.mdx sul vettore dei parametri.
3. **«Il punto finale è un massimo locale» (rilievi 3 e 11).** Ora il testo parla di un punto stazionario, di solito un massimo locale ma talvolta una sella (slide p75), e dice che la log-verosimiglianza «non scende mai (cresce o resta uguale)». Punti corretti:
   - index.mdx, passo «Ripeti e fermati» dell'esempio svolto della mistura;
   - fc-procedura-gmm;
   - or-banca-2, or-banca-6 e or-banca-13, testo e checklist.

   Per coerenza ho allineato anche altre risposte sulle reti bayesiane: or-banca-4, con la sua domanda di seguito sull'ottimo globale, e or-banca-5. Nella chiusura delle note (index.mdx) e in fc-conclusione-em la frase «massimo locale» resta, ma ora è attribuita alle note.
4. **Esercizio sul conteggio dei parametri (es05) con n = 1.** La frase sulle covarianze diagonali compare solo quando n > 1. Con n = 1 la soluzione dice che covarianza piena e diagonale coincidono e che i parametri delle covarianze restano M. Verificato con i semi 1, 2 e 3: con il seme 1 esce M = 5, n = 1.
5. **es01: il verdetto sulla verosimiglianza.** Il verdetto ora cita le due densità N1 e N2. Le distanze in deviazioni standard compaiono solo quando la più piccola non coincide con il modo vincente. In quel caso una nota spiega che la campana del modo vincente è più stretta, quindi più alta, e compensa la distanza maggiore. La spiegazione è sempre vera: se N_X ≥ N_Y e z_X > z_Y, allora σ_X < σ_Y. Verificato con i semi 5 e 11 del rilievo. Sui semi 1-500 la nota compare 72 volte, senza mai NaN né undefined.
6. **f-c35, distrattore \hat{Y}.** L'ho sostituito con \mathbf{Y}, i valori veri e mai noti delle latenti.
7. **Legende di f-c26 e f-c36.** In f-c26 ho tolto y_ji dalla legenda e ho spostato la sua definizione nella spiegazione, dove compare la formula della congiunta con y_ji. In f-c36 ho tolto M dalla legenda; la spiegazione dice già che M va fissato prima di inizializzare.
8. **f-c56-2.** Nella legenda ora μ1 e μ2 sono le medie delle coordinate x_1 e x_2 della gaussiana 2D (una sola gaussiana, non una mistura). σ1² e σ2² sono le varianze di x_1 e x_2.
9. **Lettura della figura a gradini (ch2 p74).** Verificata sull'immagine: la spezzata ha quattro tratti, e ogni tratto termina su una tacca nuova (θ¹ e θ³ su un asse, θ² e θ⁴ sull'altro). La didascalia di Duda-Hart-Stork, già citata nel foglio, dice che θ¹ è l'ottimo con θ⁰ fisso, poi θ¹ resta fisso e si trova θ², e che la simmetria di Q vale solo nel disegno. Ho riscritto la lettura: ogni tratto è un'iterazione di EM (argomento fermo = E-step, massimo di Q lungo l'altro asse = M-step), e gli assi si alternano grazie alla simmetria di Q nel disegno. Punti corretti:
   - index.mdx: il paragrafo «Leggi i gradini così» e l'osservazione 2, completata con il resto della didascalia;
   - f-c41: spiegazione, legenda e uso;
   - fc-figura-gradini;
   - la didascalia di fig05;
   - la domanda di seguito di or-q-due-argomenti;
   - la spiegazione di q-figura-gradini.
10. **«Le derivate sono lineari nei parametri».** In index.mdx, nel paragrafo sul caso facile, e nella spiegazione di q-log-somma ora il testo dice: la derivata rispetto alla media è lineare in m, quella rispetto alla covarianza non lo è ma si risolve lo stesso in forma chiusa. In index.mdx ho aggiunto le due stime campionarie esplicite.
11. **f-c10, «verosimiglianza lineare nei pesi».** Ora il testo dice che è lineare e crescente la densità di ogni campione. La verosimiglianza è un prodotto di N fattori di questo tipo, cioè un polinomio di grado N nei P_i, e cresce con loro.

### Rilievi scartati

Nessuno. I 14 rilievi sono tutti confermati dalle immagini o dai conti.

### Rilievi irrisolti

Nessuno.

### Note

- Non ho aggiunto concetti alla teoria, quindi la coverage in data.ts non cambia.
- `formula-coverage` segnala come mancante la formula del passo 5 di der08 (m_1^[1] = 3 + 0.1853/2.989 = 3.062). La formula è presente in derivations.ts. L'unica differenza è la parentesi: «dati:» al posto di «dati di ex03:», per non mostrare un codice interno nel testo. Verificato a mano.
- La nota del primo revisore su «Pagina non trovata» non vale più: la pagina teoria si carica, con 0 errori KaTeX e 0 errori di console.
