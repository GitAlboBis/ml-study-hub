# Resoconto contenuti: m06-modelli-pdf-gaussiana

## Giro 1

Correttore del foglio, 2026-09-25. 19 rilievi da tre revisori (copertura delle fonti, fedeltà delle formule, secondo revisore matematico). Alcuni erano doppi: il TAB in `90^{\circ}` è stato segnalato tre volte, il fattore x della Rayleigh tre volte. Restano 15 correzioni distinte, tutte applicate. Ogni rilievo è stato controllato sulle immagini delle pagine (ch2 p22, p23, p30, p31) o rifacendo i conti.

### Corretti

1. **TAB al posto di `\c` in `90^{\circ}`** (3 rilievi): in `derivations-a.ts`, derivazione sugli isolivelli ellittici, passo su $\tan(2\varphi)$. Il `TAB+rc` è diventato `\circ`. Una scansione dei caratteri di controllo sul modulo ora non trova nulla.
2. **Plateau della gaussiana generalizzata con β = 10**: verificato sul grafico della slide ch2 p22 e ricalcolato con b = 0.5608. f vale 0.283 in |x| = 1.3, 0.247 in 1.5, 0.110 in 1/b = 1.78 e 0.002 in 2.1. Corretto in tutti e cinque i punti: `index.mdx` (testo sotto la figura e passo β = 10 dell'esempio svolto), `derivations-a.ts` (passo β → ∞), `formulas-a.ts` (spiegazione della varianza della famiglia), `figures.ts` (didascalia e alt della figura della gaussiana generalizzata). Il testo ora dice: quasi piatta a circa 0.29 fino a |x| ≈ 1.3, circa 0.11 (cioè $e^{-1}$ del picco) in ±1/b ≈ ±1.78, nulla verso ±2.1. L'uniforme su $[m-1/b, m+1/b]$ è solo il limite per β → ∞.
3. **Mahalanobis «coincide con la distanza euclidea al quadrato»**: in `index.mdx` ora si legge «Con Σ = I la distanza di Mahalanobis coincide con quella euclidea, e la forma quadratica con la distanza euclidea al quadrato».
4. **Rayleigh, il fattore x «è la lunghezza della circonferenza»** (3 rilievi): in `index.mdx` ora si legge «viene dalla circonferenza di raggio x, lunga 2πx: il 2π si semplifica con la costante 1/(2πσ²) della gaussiana 2-D e resta x/σ²».
5. **Callout iniziale, «con due medie campionarie»**: ora si legge «con la media campionaria dei vettori e con la media dei prodotti esterni degli scarti (slide 31)».
6. **Alt della figura 3-D della slide 30**: l'ellisse sulla parete (x1, x3) ora è «larga, con l'asse maggiore allineato all'asse x1 disegnato (obliqua solo per la prospettiva)». Verificato sull'immagine: l'asse maggiore e l'asse x1 hanno pendenza quasi uguale, circa −0.3 in pixel.
7. **Termini senza inglese**: aggiunti traccia (*trace*) in `index.mdx`, `derivations-a.ts`, `derivations-b.ts`, `formulas-b.ts` ed `exam.ts`; funzione di ripartizione (*cumulative distribution function* o CDF) in `derivations-a.ts`; ellissoidi (*ellipsoids*) in `index.mdx` ed ellissoide (*ellipsoid*) in `formulas-b.ts`. Nel glossario ci sono tre voci nuove: «Traccia», «Ellissoide», «Funzione di ripartizione».
8. **Blank del limite centrale (f-c23)**: il distrattore «x_i gaussiane» rendeva vera l'implicazione. Al suo posto c'è $E\{x_i\}=0$, che è falso come condizione sufficiente: esistono variabili a media nulla con varianza infinita.
9. **Blank dei semiassi (f-c53)**: il distrattore $0$ completava una catena vera. Al suo posto c'è $\frac{r}{\sqrt{\lambda_n}}$, dimensionalmente sbagliato.
10. **Blank sul rango di Σ̂ (f-c58-2)**: i distrattori $N$ e $N+1$ davano limiti veri, anche se più deboli. Al loro posto ci sono $N-2$ e $1$, entrambi falsi in generale. Resta $n-1$.
11. **f-c24, trappola che si contraddice**: ora si legge «La somma delle varianze non richiede l'indipendenza: basta che le covarianze siano nulle; con variabili correlate si aggiungono i termini 2cov{x_i,x_j}».
12. **Matrici scritte come liste Python**: in `index.mdx` la Σ delle bande spettrali, la tabella dei tre salmoni (7 matrici) e la stima corretta $\frac{3}{2}\hat{\Sigma}_{ML}$ ora usano `bmatrix`. Nella tabella ho provato prima `smallmatrix`, come proponeva il rilievo, ma la fotografia la mostrava schiacciata e illeggibile, quindi anche lì c'è `bmatrix`. I valori sono stati ricontrollati.
13. **Esercizio «ML contro Bayes» (es17), prior piatto**: la soluzione ora dice che con σ0² → ∞ la posterior ha media e moda in X̄ e varianza σ_N² → σ²/N, che non va a zero. La stima puntuale coincide con la ML anche per N finito, ma la posterior non è un picco.
14. **Esercizio «Costruire Σ 2×2» (es19), manca Σ⁻¹**: aggiunta la parte (c), i tre elementi di $\Sigma^{-1}=\frac{1}{|\Sigma|}\begin{bmatrix}\sigma_2^2&-\sigma_{12}\\-\sigma_{12}&\sigma_1^2\end{bmatrix}$, con tre risposte numeriche, la matrice nella soluzione e il controllo $\Sigma\Sigma^{-1}=I$. Le parti che seguono sono state rinominate da (d) a (f).
15. **q-supporto-positivo**: la domanda ora chiede quali modelli «assegnano densità nulla a ogni valore negativo di x (sono definiti solo per x ≥ 0)». Nella spiegazione c'è l'esempio del chi-quadro con k = 2, che vale 0.5 in x = 0.

### Scartati

Nessuno. Tutti i rilievi hanno trovato conferma sulle immagini o nei conti.

### Irrisolti

Nessuno. formula-coverage segnala una sola formula, il passo di der18 «Σ diagonale ⇒ p(x) = ∏ p(x_i)». Ho controllato a mano: il passo c'è in `derivations-b.ts`, con la stessa LaTeX tranne il `\text{(der06)}` finale dell'inventario. Quel codice interno è stato tolto di proposito e sostituito da un link alla derivazione nel perché del passo.

### Gate

- `npx tsx scripts/validate-module.ts m06-modelli-pdf-gaussiana`: `PASS m06-modelli-pdf-gaussiana: 71 concetti coperti, 87 formule, 19 derivazioni, 24 widget, 72 flashcard, 85 quiz, 17 domande, 21 esercizi`
- `npx tsx scripts/formula-coverage.ts m06-modelli-pdf-gaussiana`: 1/195 segnalata (der18.steps[5]), verificata a mano come presente.
- `npx tsc -p tsconfig.app.json --noEmit`: nessun errore.
- `node scripts/snap.mjs m/m06-modelli-pdf-gaussiana/teoria`: nessun errore di console e 0 `.katex-error` nella pagina. La tabella dei tre salmoni e la Σ in linea sono state controllate sulla fotografia.
