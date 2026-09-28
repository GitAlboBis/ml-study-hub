# Resoconto contenuti: m04-bonta-stimatori

Foglio «Bontà di uno stimatore, bound di Cramér-Rao e proprietà asintotiche» (Cap. 2, Melgani). Fonti: ch2 p.12-16, part1 p.17-21.

## Giro 1

Correttore del giro 1 (2026-09-25). 15 rilievi ricevuti da tre revisori: uno di copertura, due di matematica e fedeltà delle formule. Due coppie descrivono lo stesso difetto: der17 (rilievi 5 e 10) e il rimando di der20 (rilievi 6 e 12). Ho controllato ogni rilievo sulle immagini e sul testo delle pagine: ch2 p10, p14, p17, p19 e p40, part1 p20 e p30. Sono tutti fondati: li ho applicati tutti e non ne ho scartato nessuno.

### Rilievi corretti

1. **ML e Bayes coincidono anche con la prior uniforme; perché si preferisce la ML** (medio). Verificato su ch2 p40 («ML and Bayes solutions are equivalent: in the asymptotic limit of infinite training samples or if the prior p(θ) is uniform», più «Lower computational complexity / Easier interpretability») e su part1 p30 («Uniform Prior … the Bayesian solution reduces to the ML solution»). Corretti:
   - `index.mdx`: callout d'esame della sezione MLE/BE (due casi, i due motivi, rimando alla slide ch2 p40), paragrafo sulla consistenza della ML (secondo caso), Collegamenti (voce m07) e scheletro della risposta in «Per l'orale».
   - `flashcards.ts`: fc-ml-e-bayes-infinito.
   - `formulas-b.ts`: f-c50 `whenToUse`.
   - `data.ts`: keyPoint su MLE/BE e `connections` verso m07. La convenzione riservava `data.ts` all'integratore, ma l'integrazione era chiusa e il compito del correttore autorizza a modificarlo.
2. **Termini tecnici senza l'inglese** (basso). Aggiunti alla prima occorrenza in `index.mdx`: *sample mean*, *systematic error*, *random error*, *regularity conditions*, *identifiable parameters*, *convergence in probability*.
3. **«certain assumptions» del teorema ML/efficienza** (basso). Verificato su part1 p20 e ch2 p19: le assunzioni riguardano solo p(x|θ). In `index.mdx`, punto 7 del quadro delle ipotesi, le condizioni di regolarità ora sono separate dalle due ipotesi esplicite dell'enunciato.
4. **Quattro quiz di `quiz.ts` duplicavano i check** (basso). Gli id restano, perché la coverage di `data.ts` li usa:
   - q-mse-salmoni: bias negativo (−0.2 dm); si chiede la varianza dato l'errore quadratico medio (0.13 − 0.04 = 0.09).
   - q-bound-bilancia: σ = 2 g; si chiede quante pesate servono per dimezzare la deviazione standard minima (16 → 64). Non chiede «quante pesate per una deviazione standard data», perché è già l'angolo di q-quanti-salmoni.
   - q-bound-accoppiato: matrice [[3,1],[1,2]]; si chiede [I⁻¹]₂₂ = 0.6 invece di 1/[I]₂₂ = 0.5.
   - q-ipotesi-cramer-rao: il vero/falso sull'uniforme proposto dal rilievo esiste già (q-uniforme-bound-tf). Il quiz è diventato una mcq diagnostica: quale ipotesi cade con l'uniforme su [0, θ]. Aggiunto il concetto c70.
5. **der17, ultimo passo: picco letto a 1.1·10⁻⁷** (medio; rilievo 10 uguale). Verificato su ch2 p10: il picco supera nettamente la tacca 1.2·10⁻⁷ (≈ 1.65·10⁻⁷). Il passo ora usa l(θ̂) ≈ −15.6 ⇒ p(X|θ̂) ≈ 1.7·10⁻⁷. Spiega anche perché il −16 arrotondato va bene per la parabola ma non per l'altezza: e^0.4 ≈ 1.5.
6. **der20: rimando al «secondo passo» di der06** (basso; rilievo 12 uguale). Ora dice «il passo … in cui lo score ha media nulla (il quarto)». Il rimando al secondo passo di der09 era corretto ed è rimasto.
7. **Grassetto di θ nella formula elemento per elemento** (basso). Verificato su ch2 p14: la θ di [I(θ)]_ij e i θ_i, θ_j sono in tondo, la θ dentro p(X|θ) è in grassetto. Frase corretta in `index.mdx`.
8. **f-c05: «le slide scrivono ln in corsivo»** (basso). Verificato su ch2 p14 (forma compatta in corsivo, forma elemento per elemento in tondo) e su ch2 p17 (in tondo). La legenda del simbolo in `formulas-a.ts` ora distingue i due casi.
9. **Mediana: rapporto varianza/bound «resta π/2 per ogni N»** (medio). Ricalcolato con un'integrazione numerica della densità della statistica d'ordine centrale. Rapporto: 1 con N ≤ 2, 1.346 con N = 3, 1.434 con N = 5, 1.509 con N = 11, 1.544 con N = 25, 1.564 con N = 101. Con σ = 2 e N = 25 la varianza esatta è 0.247. Con N = 63 è 0.0991: i «circa 63 pesci» restano corretti. Corretti:
   - `index.mdx`: ex03, passo «Mediana campionaria», e callout della cella frigorifera. Il passo «Quanti pesci per un bound di 0.1» ha ora il controllo esatto.
   - `quiz.ts`: q-perche-rapporto.
   - `data.ts`: due keyPoint.
   - `derivations-b.ts`: der16, controesempio 2.
   - `formulas-a.ts`: f-c29-3 `pitfalls` (0.247 esatto, 0.251 asintotico).
10. (Uguale al rilievo 5.)
11. **Controesempio con uno «stimatore» che contiene il θ vero** (medio). Nella conclusione di der07 (`derivations-a.ts`) ora c'è x̄ + Z_N, con estrazione casuale indipendente dai dati: bias 1, varianza σ²/N + N − 1, P{|ε| ≥ δ} ≤ P{|x̄ − m| ≥ δ} + 1/N → 0.
12. (Uguale al rilievo 6.)
13. **Attraversamento di −80: 6.3 contro 6.4** (basso). Verificato su ch2 p10: l'incrocio cade a ≈ 6.2-6.3. In ex01 ora si legge: la parabola dà 3.1 + √(64/6) ≈ 6.4, il grafico circa 6.3.
14. **«La likelihood non integra a 1» detto in assoluto** (basso). «In generale», con il controesempio della singola osservazione gaussiana, in `index.mdx`. Stessa correzione in `formulas-a.ts`, f-c01-2 e f-c02 `pitfalls`, dove l'affermazione era assoluta.
15. **Errore quadratico medio confrontato con il bias** (basso). Ora dice «non scende sotto il quadrato del bias» (`index.mdx`, callout della riflettanza nel vicino infrarosso).

### Rilievi scartati

Nessuno.

### Irrisolti

Nessuno. Nota per chi scrive i widget: se m04-pavimento-di-cramer-rao disegna la mediana con un rapporto fisso π/2, a N piccolo sovrastima la varianza. Il rapporto esatto vale 1.35 con N = 3 e 1.54 con N = 25.

### Verifiche

- `npx tsx scripts/validate-module.ts m04-bonta-stimatori` dà PASS: 70 concetti, 56 formule, 22 derivazioni, 25 widget, 69 flashcard, 85 quiz, 15 domande, 21 esercizi.
- `npx tsx scripts/formula-coverage.ts m04-bonta-stimatori` segnala 1 formula su 199: c05.latex[1]. L'ho controllata a mano ed è presente. La LaTeX dell'inventario chiude con l'annotazione `(\text{gaussiana con } \sigma \text{ nota; integrazione, der17})`, che contiene un codice interno. f-c05-2 la riporta identica senza «; integrazione, der17». La stessa parabola è il terzo passo di der17.
- `npx tsc -p tsconfig.app.json --noEmit` non dà errori.
- `node scripts/snap.mjs m/m04-bonta-stimatori/teoria` non dà errori di console. Nella pagina: 1787 nodi KaTeX, 0 `.katex-error`, 5 figure su 5 caricate.

## Giro 2

Correttore del giro 2 (2026-09-25). Ho ricevuto 15 rilievi da tre revisori: uno di copertura, uno di fedeltà delle formule e uno di matematica. Molti descrivono lo stesso difetto: la mediana «cresce con N» compare in cinque rilievi (1, 9, 10, 11 e 12), l'esercizio sulle case in tre (4, 8 e 14). Ho controllato ogni rilievo sulle immagini ch2 p12, p13, p14, p16 e p17 e part1 p20 e p21, e ho rifatto i conti. Sono tutti fondati: li ho applicati tutti e non ne ho scartato nessuno. In due punti la correzione è diversa da quella proposta, e la voce spiega perché.

### Rilievi corretti

1. **Mediana: il rapporto varianza/bound non «cresce con N»** (medio; rilievi 1, 9, 10, 11, 12). Ricalcolato con un'integrazione numerica della statistica d'ordine centrale per N dispari e con un Monte Carlo da 200-400 mila prove per N pari. Rapporto: N = 3 → 1.346, N = 4 → 1.19, N = 5 → 1.434, N = 6 → 1.28, N = 20 → 1.47, N = 25 → 1.544, N = 26 → 1.49, N = 63 → 1.560. Il rapporto oscilla tra N pari e dispari e tende a π/2. I valori puntuali del foglio (1.35, 1.54, 0.247, 0.099) erano giusti. Corretti:
   - `index.mdx`: callout della cella frigorifera («si avvicina a π/2 al crescere di N, non in modo monotono») e passo «Mediana campionaria» di ex03, che ora cita 1.19 con N = 4, 1.43 con N = 5 e 1.47 con N = 20 e spiega che con N pari la mediana è la media dei due valori centrali.
   - `derivations-b.ts`: der16, controesempio 2.
   - `data.ts`: keyPoint sull'efficienza, ora «con un rapporto varianza/bound che tende a π/2».
2. **Cinque coppie quasi identiche tra `checks.ts` e `quiz.ts`** (basso). Ho cambiato il conto, non solo i numeri. Gli id restano, perché la coverage di `data.ts` li usa.
   - q-probabilita-consistenza: ora chiede il più piccolo N con P ≥ 0.95 (σ = 2, δ = 0.5, z = 1.96): N ≥ 61.5, quindi 62.
   - q-ml-search: ora chiede la σ ricavata dalle tacche (tacca blu = 0.61 di quella verde, distanza 1): σ ≈ 1.0. La spiegazione aggiunge la tacca della curva rossa, e^{-3.125} ≈ 0.04. Misura sulla figura di part1 p20: tacca blu alta 125 px, tacca verde 205 px, rapporto 0.61.
   - q-modello-radar: ora è un caso di pre-processing. Il logaritmo dell'intensità radar viene mediato su finestre 7×7: la feature è quasi gaussiana. Il logaritmo toglie la non negatività (escono Rayleigh, Gamma e Chi-quadrato), e la media di 49 valori fa il resto per il teorema del limite centrale. Il quiz resta legato al Rayleigh del segnale grezzo. Aggiunto alla coverage di c55 e c57.
   - q-log-stesso-massimo-tf: ora è un vero/falso sul valore del massimo («anche il valore del massimo resta lo stesso» → falso, 1.7·10⁻⁷ contro −15.6).
   - q-varianza-e-mse-tf: diverso dalla proposta. «Errore quadratico medio noto e bias noto → varianza» è già il conto di q-mse-salmoni, riscritto nel giro 1: avrei creato un nuovo doppione. Ora è un quiz numerico che mette alla prova, con i numeri, la trappola di chk-06. Quattro training set equiprobabili danno 4.2, 4.6, 4.4 e 4.8, con valore vero 4.0. La varianza attorno alla media della stima vale 0.05; attorno al vero verrebbe 0.30 = 0.05 + 0.5², cioè l'errore quadratico medio. Aggiunto alla coverage di c17.
3. **Termini tecnici senza l'inglese** (basso). In `index.mdx` ho aggiunto l'inglese alla prima occorrenza di: *joint density*, *curvature*, *standard deviation*, *Bayes' theorem*, *expected value*, *least squares*, *covariance matrix*, *outer product*, *sample median*, *order statistic*, *method of moments estimator*, *cumulative distribution function*, *law of large numbers*, *central limit theorem*, *shape parameter*. Quando la prima occorrenza è il titolo di un passo, l'inglese va nel testo del passo.
4. **es16 genera case impossibili** (medio; rilievi 4, 8, 14). Verificato: con il seed 1 dava x̄ = 0 m². Il generatore ora usa `xbar = rng.int(60, 150)` e `sx = rng.int(15, min(40, floor(xbar/2)))`, quindi x̄ ≥ 2·s_x e il fattore 1 + x̄²/s_x² vale almeno 5. Ho controllato 500 seed: nessun caso fuori range, fattore minimo 5.000. Il caso centrato resta nella domanda (d) come ipotesi («perché non cambia se centri la superficie?»).
5. **«0.16 è ottima con 25 salmoni e pessima con 2500» senza σ** (basso). `index.mdx`, «Perché serve un riferimento»: ora la frase dichiara σ = 2. Con 25 salmoni il bound vale 4/25 = 0.16, con 2500 vale 0.0016.
6. **Blank di f-c43: anche `\exp` era giusto** (medio). Verificato su ch2 p17: conta solo la monotonia crescente, e exp è strettamente crescente. In `formulas-b.ts` il distrattore ora è `1 -`: l'arg max di 1 − p è l'arg min di p. Il blank di f-c05 resta com'è: lì l(θ) è definita come ln p, e `\exp` è davvero sbagliato.
7. **«Varianza minima raggiungibile» per il bound** (medio). Verificato su ch2 p14: il bound è un «lower bound on the variance of an unbiased statistical estimator». La nota a margine «When the bound is reached…» dice che non sempre si raggiunge. Corretti tutti i punti segnalati:
   - `formulas-a.ts`, legenda di f-c22: ora dice «limite inferiore alla varianza di ogni stimatore unbiased del parametro i (lo raggiunge solo uno stimatore efficiente, se esiste)».
   - `derivations-a.ts`: der06, passo 8.
   - `index.mdx`: «Perché serve un riferimento» e la frase «il bound scende come 1/N».
   - `formulas-b.ts`: l'explain della forma con la curvatura.
   - `quiz.ts`: q-perche-cramer-rao.
   - `flashcards.ts`: fc-serve-un-riferimento.

   In es02 di `exercises.ts` resta «deviazione standard minima raggiungibile». Lì si parla della media di una gaussiana, e la media campionaria raggiunge davvero il bound: la frase è corretta.
8. (Uguale al rilievo 4.)
9. (Uguale al rilievo 1.)
10. (Uguale al rilievo 1.)
11. (Uguale al rilievo 1.)
12. (Uguale al rilievo 1.)
13. **Controesempio di der07: un sorteggio esterno chiamato «calcolabile dal training set»** (basso). Nella conclusione di der07 (`derivations-a.ts`) ora c'è una vera funzione dei dati, con σ nota e N ≥ 2: Z_N = N se |x₁ − x₂| > √2·σ·z_{1−1/(2N)}, altrimenti 0.
    - x₁ − x₂ ~ N(0, 2σ²) non dipende da m, quindi P{Z_N = N} = 1/N.
    - x₁ − x₂ e x̄ sono scorrelate e congiuntamente gaussiane, quindi indipendenti.
    - Ne seguono bias 1, varianza σ²/N + N − 1 e P{|ε| ≥ δ} ≤ P{|x̄ − m| ≥ δ} + 1/N → 0.

    La conclusione dice anche che, con un sorteggio esterno, lo stimatore sarebbe randomizzato (*randomized estimator*). der16, controesempio 4, usa ancora l'estrazione casuale: ho aggiunto che lo stimatore è randomizzato e un rimando a der07. Il Reveal di `index.mdx` la chiamava già estrazione casuale e non l'ho toccato.
14. (Uguale al rilievo 4.)
15. **«ε_i = 0 con probabilità 1» letto come «per qualunque training set»** (basso). Ora si legge «su tutti i training set tranne, al più, un insieme di probabilità nulla», in `index.mdx` (stima ideale) e nell'explain di f-c13 in `formulas-a.ts`.

### Rilievi scartati

Nessuno.

### Irrisolti

Nessuno. Nota per chi scrive il widget m04-pavimento-di-cramer-rao: se disegna la mediana a N piccolo, il rapporto con il bound non è monotono (1.35 con N = 3, 1.19 con N = 4, 1.43 con N = 5).

### Verifiche

- `npx tsx scripts/validate-module.ts m04-bonta-stimatori` dà PASS: 70 concetti, 56 formule, 22 derivazioni, 25 widget, 69 flashcard, 85 quiz, 15 domande, 21 esercizi.
- `npx tsx scripts/formula-coverage.ts m04-bonta-stimatori` segnala 1 formula su 199, c05.latex[1], come nel giro 1. L'ho controllata a mano: f-c05-2 la riporta identica, senza l'annotazione «; integrazione, der17» dell'inventario.
- `npx tsc -p tsconfig.app.json --noEmit` non dà errori.
- `node scripts/snap.mjs m/m04-bonta-stimatori/teoria` non dà errori di console. Nella pagina: 1791 nodi KaTeX, 0 `.katex-error`, 5 figure su 5 caricate. Ho controllato a vista la sezione «Perché serve un riferimento».
