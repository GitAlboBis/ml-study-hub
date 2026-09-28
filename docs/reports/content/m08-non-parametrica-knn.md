# Resoconto contenuti: m08-non-parametrica-knn

Foglio «Stima non parametrica e K-NN» (Cap. 2, Melgani). Fonti: ch2 p.41-50, part1 p.30-36.

## Giro 1

Correttore del giro 1 (2026-09-25). Ho ricevuto 24 rilievi da tre revisori: copertura, fedeltà delle formule e matematica. Due coppie descrivono lo stesso difetto: la valle della bimodale (rilievi 14 e 23) ed es05 con $N = 1$ (rilievi 16 e 21). Ho controllato i rilievi sulle immagini di ch2 p44, p45, p46, p49, p50 e p76 e sul testo di part1 p32-33. Tutti i conti li ho rifatti con node. Per gli esercizi ho scritto tre script di controllo, nello scratchpad e non nel repo:
- tolleranze su 1000 seed;
- per ogni risposta, la presenza nella soluzione di un valore accettato;
- unicità del picco più alto, con un calcolo a forza bruta indipendente.

Tutti i rilievi sono fondati e li ho applicati tutti. Nessuno è scartato e nessuno resta aperto.

### Rilievi corretti

1. **Esempio della superficie K-NN di slide 49 senza numeri** (medio). In `index.mdx` l'esempio ha tre passi nuovi, con $N = 30$ come i punti della figura e unità arbitrarie, perché la slide non ha scala:
   - zona fitta: $r_5 = 0.5$, $V \simeq 0.785$, $\hat{p} \simeq 0.21$;
   - zona rada: $r_5 = 1.2$, $V \simeq 4.52$, $\hat{p} \simeq 0.037$;
   - risultato: il rapporto $(1.2/0.5)^2 = 5.76$, circa 6, spiega picchi e altopiano.

   Nella pagina l'esempio ha ora 7 passi e si legge correttamente.
2. **Rimando alla fonte per i colori di slide p45** (basso). Verificato sull'immagine: i colori sono quelli di ch2 p45. La frase sui colori ora rimanda a `ch2` p45. Il rimando a part1 p32 è passato in fondo alla colonna di Parzen, dopo le precisazioni delle note.
3. **Riga K-NN della figura di slide p46** (basso). Misurata sull'immagine:
   - riga K-NN: il bordo passa per il $K$-esimo vicino (con $N = 4$ il cerchio passa per il 2° campione);
   - riga di Parzen: i raggi 73, 36, 24, 18 e 6 px scalano come $1/\sqrt{N}$.

   In `derivations.ts` (der08) «schizzo qualitativo, da non leggere in scala» è diventato: la riga di Parzen non è in scala, la riga K-NN è esatta. Ora coincide con `index.mdx` e f-c32-3.
4. **Due convenzioni per i riferimenti alle fonti** (basso). Nel testo visibile di `quiz.ts`, `flashcards.ts`, `formulas-b.ts` e `glossary.ts` i codici dei documenti sono diventati la forma dell'MDX: «slide pNN» per ch2, «note pNN» per part1, «figura di slide pNN». I codici `ch2`/`part1` restano solo nei commenti del codice, che lo studente non vede.
5. **Glossa attribuita alle note** (basso). Verificato su part1 p33: «fixed and set a priori». In `index.mdx` la citazione ora è separata dal commento: «Le note: … stabilito a priori (*fixed and set a priori*). In pratica lo scegli prima di guardare il punto $\mathbf{x}^*$, e resta lo stesso in ogni punto.»
6. **Commento di `exam.ts`** (basso). Le domande fuori banca sono 7 su 14, e il commento ora dice «più sette domande».
7. **«Dove p(x*) = 0 il volume non tende a zero»** (medio). Il controesempio è giusto: all'estremo sinistro del triangolo di slide p50 la massa di $[x^*, x^*+r]$ vale $r^2/3$, quindi $r_K \simeq \sqrt{3K_N/N} \to 0$. Ho ristretto la frase ai punti a distanza positiva dal supporto e aggiunto il caso del bordo in tre posti:
   - f-c68, nelle trappole;
   - der02, nell'ultimo passo, con il conto del triangolo;
   - der09, nell'ultimo passo.
8. **«58% di dispersione per qualunque N»** (basso). Con $K = 5$ la dispersione relativa $\sqrt{(N-K+1)/(N(K-2))}$ vale 45% a $N = 10$, 52% a $N = 20$, 57% a $N = 100$ e tende a 58%. Ho corretto le sei righe citate: `checks.ts` (chk-14), `flashcards.ts`, `index.mdx`, `exam.ts` (due punti) ed `exercises.ts` (leggiK, anche il 45% di $P_K$). La stessa frase era anche in un punto chiave di `data.ts` e l'ho corretta lì. In `index.mdx` ora ci sono i valori a $N = 10$ e $N = 100$.
9. **Distrattore $p(X\vert\theta)$ nel completamento di f-c04** (basso). È stato sostituito con $\mathcal{N}(\theta;\, \mu_0, \sigma_0^2)$, un prior non piatto che sposta il massimo.
10. **Distrattore $K-1$ nel completamento di f-c39** (basso). Ora è $K+1$, sbagliato senza ambiguità.
11. **«piu» e «probabilita» dentro `\text{}`** (basso). In der04 e der09 ora si legge «più» e «probabilità». Di conseguenza `formula-coverage` segnala 2/120 formule non ritrovate: sono proprio questi due passi. Ho verificato con uno script che, a parte l'accento, coincidono carattere per carattere con l'inventario. L'eccezione è annotata accanto all'import delle derivazioni in `data.ts` e nel commento in testa a `derivations.ts`.
12. **Refusi di slide 76 non segnalati in or-banca-2** (basso). Verificato sull'immagine di ch2 p76:
   - nell'equazione dei prior il numeratore è $P_j^{[k]}$;
   - nell'equazione di $\Sigma_i$ la gaussiana dentro il peso usa $\mathbf{m}_i^{[k+1]}$.

   Dopo le equazioni di aggiornamento ho aggiunto un paragrafo che li dichiara refusi, come fa il foglio m10. Il paragrafo linka `/m/m10-em-dati-incompleti/teoria#le-equazioni-em-per-la-mistura-di-gaussiane`: nella pagina l'ancora esiste, verificato.
13. **Esempio del salmone incoerente** (basso). In f-c15 la regione ora è $R = [4.55,\ 5.05]$, larga $V = 0.5$, come in f-c17, f-c20 e f-c22.
14. **Valle della bimodale in $x \approx 2.4$** (basso; rilievi 14 e 23). Misurato sull'immagine (47 px per unità): il triangolo va da 0.53 a 2.49 e il rettangolo da 3.02 a 3.53. In `index.mdx` ora c'è: «nella valle tra il triangolo e il rettangolo (la densità vera è nulla su $(2.5, 3)$)», con i minimi letti sull'immagine: verso 2.3 per $N = 16$, verso 2.6-2.8 per $N = 256$.
15. **$\mathbf{x}^* = 3.1$ in grassetto per uno scalare** (basso). In `index.mdx`, risposta d'orale sul K-NN con esempio numerico, ora c'è $x^* = 3.1$.
16. **es05 con $N = 1$** (basso; rilievi 16 e 21). `m` va ora da 2 a 20. Nella soluzione (d) ho aggiunto che il cerchio sta dentro il quadrato ($r \le 0.5$) e perché con $N = 1$ non varrebbe.
17. **es06 ed es09: posizione del picco più alto non unica** (critico). Nuova funzione `piccoUnico`: la larghezza minima dei gruppi di $K$ campioni consecutivi deve essere unica. es06 rigenera campioni e $K$ finché lo è per entrambi i $K$; es09 aggiunge la condizione al ciclo che già scartava i punti angolosi sopra un campione. Il controllo indipendente su 1000 seed, con stima K-NN a forza bruta sui punti medi di tutte le coppie, dà 0 parità e 0 risposte diverse in es06 ed es09. Sul caso del rilievo ({2.3, 2.6, 2.9, 4, 4.3, 5, 6.3, 7}) il controllo trova le tre cuspidi a pari altezza, quindi le parità le riconosce.
18. **Tolleranze assolute minime troppo larghe** (medio). Il minimo assoluto di `tol` ora non supera mai il 2% del valore. Per un valore esattamente nullo resta il minimo assoluto. Tre altri interventi:
   - le soluzioni di es01, es11 ed es14 scrivono i valori piccoli con 3-4 cifre significative (`sci`), così il numero della soluzione rientra nella tolleranza;
   - es11 chiede le distanze con almeno tre cifre significative, calcolate con la formula;
   - es16 usa $V \ge \sigma$: con $V = \sigma/2$ il bias scende sotto 0.001 e l'errore delle tavole della normale ne è una frazione troppo grande. La tolleranza del bias è ora $\max(0.0001,\ 5\%)$.

   Scansione di 1000 seed dopo la correzione: oltre il 5% restano solo risposte discrete (interi, codici 0/1/2, posizioni sulla griglia a 0.05 con tolleranza 0.006). Fa eccezione la soglia intera di es16, al 10%, che dipende dal quadrato del bias. In nessuna istanza manca, nella soluzione, un valore accettato. I casi del rilievo ora hanno una tolleranza entro il 2%: es11 (d) seed 99, es01 seed 193, es14 seed 300, es15 seed 45, es20 seed 120. Fanno eccezione es22 (f) seed 1, al 3% (la sua tolleranza relativa), e il bias di es16, al 5%.
19. **f-c71 e f-c71-2 abbinati al contrario** (medio). Verificato su ch2 p44: «enough large» = campioni sufficienti; «enough small» = pdf poco variabile. Ora f-c71 ($N$ fisso, $V \to 0$) dà contenuto a «enough large» e f-c71-2 ($V$ fisso, $N \to \infty$) a «enough small», come or-casi-limite ed es22. Il campo «quando si usa» di f-c71 rimanda all'altra richiesta della slide.
20. **«posterior» per $p(x\vert X)$** (medio). Ho corretto l'opzione giusta del quiz q-ml-punto-bayes-distribuzione e la flashcard fc-ml-punto-bayes-curva. Ora distinguono la posterior $p(\theta\vert X)$ sui parametri dalla densità predittiva $p(x\vert X)$. La spiegazione del quiz dice anche che la frase di slide p40 inverte l'ordine, come l'avvertenza nel testo.
21. **Fascia 0.30-0.50 per $N = 256$** (basso). La dispersione è relativa a $E\{\hat{p}\}$: nel centro $E\{\hat{p}\} \simeq 1.067 \cdot 0.40 \simeq 0.43$ e $\sigma \simeq 0.11$. La fascia a una deviazione standard è quindi 0.32-0.54. Ho corretto `index.mdx` (esempio sulla fiducia in un numero K-NN) ed `exam.ts` (or-figura-n-crescente).
22. **es15: $N_{\min}$ «sotto ε» con quoziente intero** (basso). Il testo ora chiede il più piccolo $N$ che porta il maggiorante «a non più di ε». Con questa richiesta $N_{\min} = \lceil q \rceil$ e $N \ge q$ sono corretti anche quando $q$ è intero.

### Rilievi scartati

Nessuno.

### Rilievi irrisolti

Nessuno. Resta un effetto noto del rilievo 11: `formula-coverage` stampa `MANCANO 2/120`. Le due formule sono presenti, verificate a mano, e differiscono dall'inventario solo per l'accento. Il rimedio definitivo è correggere «piu» e «probabilita» nell'inventario, in una fase in cui sia consentito toccarlo.

Note:
- **Pagina non trovata.** Il primo revisore aveva visto «Pagina non trovata» su `/m/m08-non-parametrica-knn`. Oggi la scheda Teoria si carica: 104 titoli, 0 errori KaTeX, nessun errore di console.
- **tsc.** L'unico errore di `tsc` è in `src/components/layout/_tmp.test.tsx` (`require`), che non è un file del foglio.
- **Forme residue.** Nei `.ts` restano le forme «slide 46» e «(note, p. 32)». Non sono codici di documento e non le ho uniformate.
