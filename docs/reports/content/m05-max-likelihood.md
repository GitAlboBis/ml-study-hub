# Resoconto contenuti: m05-max-likelihood

Foglio «Stima a massima verosimiglianza (ML)» (Cap. 2, Melgani). Fonti: ch2 p.17-21, part1 p.20-24.

## Giro 1

Correttore del giro 1 (2026-09-25). 12 rilievi ricevuti da tre revisori: uno di copertura, uno di fedeltà delle formule, uno di matematica. Due coppie descrivono lo stesso difetto: le condizioni delle trasformazioni verso chi-quadro e Rayleigh (rilievi 4 e 11) e il grafico di ch2 p10 (rilievi 1 e 7, uno per p(X|θ), l'altro per l(θ)). Ho controllato ogni rilievo sulle immagini delle pagine: ch2 p10 (pannelli ingranditi), p26, p28 (ellissi ingrandite) e p40, ch4 p13, part1 p23 e p24. Sono fondati tutti e 12. Ne ho applicati 11. Il rilievo 8 chiede di modificare l'inventario, che questo compito non può toccare: il foglio è già corretto e la formula è verificata a mano.

### Rilievi corretti

1. **Picco della likelihood di ch2 p10** (basso). Verificato sul pannello centrale ingrandito: le tacche sono ogni 0.2·10⁻⁷ e la cima della curva sta circa 50 px sopra la tacca di 1.2·10⁻⁷, cioè a ≈1.7·10⁻⁷. Corretti:
   - `index.mdx`: sezione sulla log-likelihood, «è minuscola»;
   - `formulas-a.ts`: spiegazione di f-c03.
   Il testo ora dice «circa 1.7·10⁻⁷, sopra l'ultima tacca etichettata del grafico (1.2·10⁻⁷)». f-c07, le flashcard e la domanda d'orale dicevano già «circa 10⁻⁷» e sono rimaste così.
2. **Segno della correlazione nella gaussiana bivariata** (basso). Verificato su part1 p23 e ch2 p26: la rete in prospettiva non mostra il segno, e le note dicono solo «two correlated variables». In `index.mdx`, sezione «La gaussiana bivariata», ho tolto «al crescere di una tende a crescere l'altra» e ho scritto che dalla figura il segno della covarianza non si ricava. Aggiunto il rimando a ch2 p26.
3. **ML contro Bayes: che cosa stima la bayesiana secondo la slide** (basso). Verificato su ch2 p40: «estimates a distribution p(x|X) from which θ is inferred». Allineati alla slide, con la posterior come strumento di calcolo:
   - `index.mdx`: colonna «Bayesiana» del confronto;
   - `glossary.ts`: voce «Stima bayesiana»;
   - `flashcards.ts`: fc-ml-contro-bayesiana, che aveva la stessa formulazione.
4. **Condizioni per chi-quadro e Rayleigh** (basso, medio nel rilievo 11). Il quadrato è una chi-quadro con 1 grado di libertà solo se la gaussiana è standard. Il modulo è una Rayleigh solo se le due gaussiane sono indipendenti, a media nulla e con la stessa varianza. Corretti:
   - `index.mdx`: elenco del terzo aspetto della scelta del modello (con la nota: con varianza σ² serve dividere per σ²) e voce sulla Rayleigh nella sezione chi-quadro/Gamma;
   - `exam.ts`: follow-up di or-banca-13, or-scelta-modello (terzo aspetto) e la frase «Quasi tutti nascono dalla gaussiana»;
   - `flashcards.ts`: fc-preprocessing-cambia-pdf;
   - `glossary.ts`: «Estrazione delle feature» e «Modello di Rayleigh»;
   - `checks.ts`: spiegazione di chk-15;
   - `exercises.ts`: la motivazione «georadar» e il «Metodo» dell'esercizio sulla scelta del modello.
5. **es11, istanza degenere con il punto sulla media** (basso). In `exercises.ts`, se a1 = a2 = 0 allora a2 viene riestratto da {−2, −1, 1, 2}. Verificato con tsx su 2000 seed: nessuna istanza con distanza di Mahalanobis nulla. Con il seed 7, che prima era degenere, ora la distanza vale 1.
6. **z = 3 nella slide 28 è il picco, non un'ellisse** (medio). Verificato sull'ingrandimento di ch2 p28: le ellissi sono tre (z = 2, 0.5, 0.01) e «z=3» sta accanto al punto nero centrale. Riscritti:
   - `formulas-b.ts`: spiegazione di f-c63 (il picco è dove d² = 0);
   - `index.mdx`: sezione «Gli isolivelli sono ellissi».
   Ora il foglio è coerente con la dimostrazione sugli isolivelli, dove al picco la sezione è il solo punto m.
7. **Valori di l(θ) nel grafico di ch2 p10** (basso). Verificato sul pannello inferiore ingrandito: il massimo sta poco sopra la tacca −20, a circa −16, e la curva scende sotto −100 verso θ = 7. Corretti:
   - `index.mdx`: stessa frase del rilievo 1;
   - `formulas-a.ts`: spiegazione di f-c07.
9. **Frasi sulle slide 26 e 28 senza quelle pagine tra le fonti** (basso). Pagine aggiunte alle fonti:
   - `formulas-b.ts`: ch2 p26 in f-c49; ch2 p28 in f-c62, f-c63, f-c64 e f-c65. Nelle spiegazioni la slide ora è citata con il suo numero.
   - `index.mdx`: `<SourceRef doc="ch2" page={26} />` nelle sezioni «La gaussiana multivariata» e «La gaussiana bivariata». `<SourceRef doc="ch2" page={28} />` nelle sezioni sulla campana di volume unitario, sugli isolivelli, sugli autovettori e sull'asse maggiore; la sezione sugli autovettori ha anche il rimando a part1 p24.
10. **Quiz sul teorema di efficienza in contrasto con la derivazione** (medio). In `quiz.ts`, q-teorema-efficienza, il distrattore «Se esiste una stima efficiente, la stima ML è sempre non distorta» è vero sotto le condizioni di regolarità: segue dalla derivazione sulla stima efficiente. L'ho sostituito con «Se la stima ML è non distorta, allora è efficiente», che è falso. Controesempio, messo nella spiegazione: con un solo campione da una laplaciana (b/2)e^(−b|x−m|), la stima ML di m è il campione stesso. È non distorta, ma la sua varianza 2/b² è il doppio del bound 1/b² (lo score è b·sign(x−m), quindi I = b²). La spiegazione ora dice anche che, sotto regolarità, la direzione opposta vale, con il rimando alla derivazione.
11. (vedi 4)
12. **Soglia di underflow: 10⁻³⁰⁸ presentato come minimo rappresentabile** (basso). Uniformato a «più piccolo numero positivo della doppia precisione circa 5·10⁻³²⁴; i numeri normalizzati arrivano a circa 2·10⁻³⁰⁸», come già diceva der14. Corretti:
    - `derivations-a.ts`: conclusione di der01;
    - `index.mdx`: esempio sulla Bernoulli;
    - `flashcards.ts`: fc-prodotti-in-somme;
    - `exam.ts`: «Perché il logaritmo»;
    - `quiz.ts`: spiegazione di q-vantaggi-log. Qui «migliaia di fattori minori di 1» è diventato «fattori piccoli»: mille fattori da 0.3 danno 10⁻⁵²³.
    - `exercises.ts`: es06, dove log₁₀ L con 10000 email è sempre sotto −324 (caso peggiore θ = 0.05: circa −862). Nel generatore sull'underflow la domanda resta «sotto 10⁻³⁰⁸», ma la soluzione ora spiega che 10⁻³⁰⁸ è il minimo normalizzato: sotto si perdono cifre, sotto 5·10⁻³²⁴ il prodotto diventa zero.
    Le conclusioni numeriche (10⁻⁵²³, 10⁻¹³²⁶, 10⁻⁵³¹) restano valide e le ho ricontrollate.

### Rilievi scartati

Nessuno.

### Rilievi irrisolti

8. **formula-coverage segnala c69.latex[1]** (basso). La slide ch4 p13 scrive davvero «∀ i = 1, 2, ..., C», come f-c69-2. È l'inventario ad aver perso il ∀. Non ho tolto il quantificatore dal foglio. Il compito vieta di toccare `docs/inventory/`, quindi la correzione di c69.latex[1] (aggiungere `\forall\,` prima di i) spetta a chi può modificare l'inventario. Come chiede l'intestazione di `scripts/formula-coverage.ts`, l'eccezione era già annotata in `data.ts` (intestazione e commento vicino alle formule). Ho verificato a mano che la formula è presente.

### Gate

- `npx tsx scripts/validate-module.ts m05-max-likelihood`: `PASS m05-max-likelihood: 69 concetti coperti, 59 formule, 19 derivazioni, 28 widget, 78 flashcard, 86 quiz, 23 domande, 19 esercizi`.
- `npx tsx scripts/formula-coverage.ts m05-max-likelihood`: `MANCANO 1/167: c69.latex[1]`. La formula è presente in f-c69-2 con il ∀ della slide (vedi rilievo 8).
- `npx tsc -p tsconfig.app.json --noEmit`: 0 errori.
- `node scripts/snap.mjs m/m05-max-likelihood/teoria …`: nessun errore di console. Con `--wait 15000` la pagina carica 102 titoli e contiene i tre testi nuovi controllati (etichetta z = 3, 1.7·10⁻⁷, segno della covarianza).

## Giro 2

Correttore del giro 2 (2026-09-25). 10 rilievi da tre revisori: uno di copertura, uno di fedeltà delle formule, uno di matematica. I rilievi 6 e 9 descrivono lo stesso difetto (q-eco-radar senza «stessa varianza»). Ho verificato ogni rilievo sulle immagini: ch2 p19, part1 p21 e p22, part2 p9, p11 e p27. Sono fondati tutti e 10 e li ho applicati tutti. Non ho aggiunto concetti alla teoria, quindi la coverage in `data.ts` non cambia.

### Rilievi corretti

1. **«In certain hypotheses» esteso a tutte le proprietà** (medio). Nella slide ch2 p19 la frase precede solo il primo punto, il teorema sulla stima efficiente. Corretti:
   - `index.mdx`, sezione «ML sceglie i parametri, non la famiglia»: due paragrafi distinti. Il primo dice che la slide premette la frase solo al teorema e che quelle ipotesi sono le condizioni di regolarità della sezione «Le ipotesi sottintese». Il secondo presenta come integrazione dichiarata il presupposto del modello corretto (*correctly specified* / *misspecified*).
   - `exam.ts`, or-scelta-modello: stessa separazione.
2. **Termini inglesi mancanti nella teoria** (medio). In `index.mdx`, alla prima occorrenza, ho aggiunto: *stationary point condition*, *Fisher information matrix*, *saddle point*, *local maximum*, *Hessian matrix*, *negative definite*, *closed form*, `<Term en="invariance property of ML">` con *reparametrization* (nel paragrafo, non nel titolo, per non cambiare l'ancora `#invarianza-rispetto-alla-parametrizzazione` usata da `data.ts`), *centroid*, *support*, *convergence in probability*, *Chebyshev's inequality*, *asymptotic normality*, *law of large numbers*, *Central Limit Theorem*, *generalized variance*, *outer product*, *eigenvalues* (nel riquadro d'esame e con `<Term>` nella sezione sulla simmetria), *positive definite*, *characteristic equation* (nel titolo del passo), *sufficient statistics*, *conjugate prior(s)*.
3. **Corrispondenza note/slide nel riquadro iniziale** (basso). Verificato su part1 p21 e p22: la galleria comincia a p22. `index.mdx` riga 14 ora dice «pagine 22-24 → slide 22-28; la pagina 21 riprende le slide 19-21 (proprietà asintotiche, tre aspetti, elenco dei modelli)».
4. **Frase fissa nella soluzione di es19** (basso). In `exercises.ts` ho tolto la frase sulla simulazione e la parentesi con σ = 1.5 e N = 10. Al loro posto c'è un riepilogo che usa solo i valori dell'istanza: varianza σ⁴/N uguale al bound, rapporto E{σ̂}/σ, bias. Controllato con i seed 2 e 7: σ = 2, N = 10 → 1.6, 0.9876, −0.0248; σ = 0.5, N = 5 → 0.0125.
5. **Attribuzione della precisazione su Mahalanobis** (basso). In `formulas-b.ts` (f-c51, explain) il testo ora dice che il nome compare solo nelle note (p23), non nella slide 26, e che «è il quadrato» è una precisazione del foglio. In `index.mdx` la frase dopo la citazione delle note ora dice «Il nome "distanza di Mahalanobis" compare solo nelle note». Nel paragrafo «A rigore…» ho aggiunto che si tratta di una precisazione del foglio.
6. e 9. **Condizioni gaussiane → Rayleigh** (basso). `quiz.ts`, testo di q-eco-radar: «indipendenti, a media nulla e con la stessa varianza». `formulas-b.ts`, whenToUse di f-c38: stesse tre condizioni. In più ho aggiunto le condizioni nell'esempio SAR di `index.mdx` («parti da componenti gaussiane (indipendenti, a media nulla e con la stessa varianza)»).
7. **«Il viceversa vale solo per la gaussiana»** (medio). Controesempio verificato: per due Bernoulli, cov = P(1,1) − pq = 0 fa fattorizzare la congiunta. `derivations-b.ts` der19: il titolo ora è «il viceversa non vale in generale, ma vale per la gaussiana congiunta»; il goal dice «in generale non vale, vale per un vettore congiuntamente gaussiano»; la conclusione cita la gaussiana congiunta e l'esempio delle variabili binarie. `exam.ts` riga 1010: «in generale non vale; vale per un vettore congiuntamente gaussiano». Per coerenza ho corretto anche `formulas-b.ts` (pitfalls della covarianza): «salvo casi particolari, il più importante dei quali…» al posto di «salvo per».
8. **(K+1)/(N+2) presentato come MAP con α = 1** (medio). Verificato su part2 p9 (Dirichlet ∝ ∏θ^{α−1}), p11 (valore atteso a posteriori (N_k+α_k)/(N+α)) e p27 (la stessa formula, chiamata «MAP estimate»). In `exam.ts` ho corretto tre punti:
   - nella risposta sulle reti bayesiane, subito dopo la formula MAP: la precisazione che è la media a posteriori; il MAP in senso stretto è (N_k+α_k−1)/(N+α−r) e con α = 1 ridà ML; la formula delle note è un MAP esatto solo se gli α sono letti come puri pseudo-conteggi (prior ∝ ∏θ^α);
   - negli esempi 13/42 ≈ 0.31 e 1/62 ≈ 0.016: «la formula delle note dà…», con il rimando alla regola di Laplace e il valore del MAP con prior uniforme (0.30 e 0);
   - nella risposta sulla Bernoulli: (K+1)/(N+2) è la regola di Laplace, cioè la media a posteriori con prior uniforme, e il MAP di una Beta(2, 2). Con prior uniforme il MAP coincide con K/N.
   
   Ora il testo concorda con index.mdx:620, f-c68-2 e il glossario («prior uniforme ⇒ MAP = ML»). Tutte le nuove stringhe LaTeX passano `katex.renderToString` con `throwOnError`.
10. **Luminosità negative in es01** (basso). In `exercises.ts` il prompt ora dice che la luminosità è «già centrata sul valore di riferimento della linea (scarto dalla luminosità media, in unità arbitrarie: per questo può essere negativa)». Non ho spostato gli intervalli, così il ramo che riproduce i valori della slide (x₀ = 1, medie da −2 a 1.5) resta fedele alla figura «ML search».

### Rilievi scartati

Nessuno.

### Rilievi irrisolti

Nessuno nuovo. Resta quello del giro 1 su c69.latex[1] dell'inventario (manca il ∀ della slide ch4 p13). Il foglio è corretto e la formula è verificata a mano in f-c69-2.

### Gate

- `npx tsx scripts/validate-module.ts m05-max-likelihood`: `PASS m05-max-likelihood: 69 concetti coperti, 59 formule, 19 derivazioni, 28 widget, 78 flashcard, 86 quiz, 23 domande, 19 esercizi`.
- `npx tsx scripts/formula-coverage.ts m05-max-likelihood`: `MANCANO 1/167: c69.latex[1]`. La formula è presente in f-c69-2 con il ∀ della slide.
- `npx tsc -p tsconfig.app.json --noEmit`: nessun errore nei file del foglio. L'unico errore è in un file di un altro agente: `src/pages/Formulario.test.tsx(345,11): error TS6133: 'user' is declared but its value is never read`.
- `node scripts/snap.mjs m/m05-max-likelihood/teoria …`: nessun errore di console, altezza della pagina 154917 px. Con `--wait 15000` e `--eval` ho verificato che la teoria contiene i testi nuovi, tutti presenti (true): «correctly specified model», «Hessian matrix», «Le pagine 22-24», «eigenvalues», «proprietà di invarianza», «outer product», «conjugate prior», «characteristic equation».
