# Resoconto contenuti: m07-stima-bayesiana

Foglio «Stima bayesiana e confronto ML vs Bayes» (Cap. 2, Melgani). Fonti: ch2 p.32-40, part1 p.26-30.

## Giro 1

Correttore del giro 1 (2026-09-25). Ho ricevuto 12 rilievi da tre revisori: uno di copertura, uno di fedeltà delle formule e uno di matematica. Alcuni descrivono lo stesso difetto: il carattere TAB in `\text{vera}` (rilievi 1, 3 e 7) e i conti dell'esempio sulla figura del *Bayesian learning* (rilievi 5 e 9). Ho controllato i rilievi sulle fonti. Sulle immagini ho guardato ch2 p33 e p40 e il ritaglio della figura di ch2 p38. Ho rifatto a mano i conti numerici e ho misurato i picchi della figura in pixel. Tutti e 12 i rilievi sono fondati e li ho applicati tutti. Nessuno è scartato e nessuno resta aperto.

### Rilievi corretti

1. **TAB al posto di `\t` in `\mu_{\text{vera}}`** (medio; rilievi 1, 3 e 7). In `index.mdx`, righe 859 e 909, la sequenza TAB + `ext{vera}` è diventata `\text{vera}`. Ho controllato così:
   - nessun file del foglio contiene più caratteri di controllo;
   - nella pagina renderizzata le formule si leggono «(1−w)(μ0−μvera)» e «Δ=μ0−μvera»;
   - nessun nodo KaTeX contiene più «extvera».
2. **Termini tecnici senza l'inglese** (medio). In `index.mdx` il corsivo dell'italiano «*marginalizzazione*» è diventato «marginalizzazione, *marginalization*». Ho aggiunto l'inglese in corsivo alla prima occorrenza di questi termini:
   - *product rule*, *conditional independence*, *truncated Gaussian*;
   - *precision* (nel riquadro d'esame di Passerini, che è la prima occorrenza, e dove le precisioni sono definite);
   - *posterior mean* e *posterior variance*, all'inizio della sezione «Media e varianza a posteriori»;
   - *convex combination*, *law of large numbers*, *Dirac delta function*, *completing the square*, *law of total variance*;
   - *likelihood*, alla prima occorrenza di «verosimiglianza» da sola, e *log-likelihood*.

   Nello stesso giro ho aggiunto tre glosse che il rilievo non chiedeva: *joint density*, *linear combination* e *numerical underflow* (per «sotto la precisione della macchina»).
3. **Distrattore di f-c56 che al limite vale Σ** (medio). In `formulas-b.ts` il distrattore $\frac{N-1}{N}\Sigma$ è diventato $\Sigma+\mathbf{m}\mathbf{m}^t$. È sicuramente sbagliato ed è il limite di $\frac{1}{N}\sum_k\mathbf{x}_k\mathbf{x}_k^t$: la confusione è plausibile con la seconda forma di $\hat{\Sigma}$. Il fattore $(N-1)/N$ resta la trappola del completamento sul valore atteso (f-c57-2).
4. **Conti dell'esempio «Leggere la figura del Bayesian learning»** (medio/basso; rilievi 5 e 9). I conti $2\pi\cdot0.44^2 = 1.22$ e $2\pi\cdot0.91^2 = 5.20$ sono esatti. In `index.mdx`:
   - la serie è diventata $1/\sigma_N^2 \approx 1.22, 5.20, 10.3, 20.4, 30.4$;
   - «con errore sotto l'1%» è diventato: entro pochi per cento, con lo scarto massimo di circa il 3% per $N = 1$ (con $0.445$ al posto di $0.44$ verrebbe $1.24$) e sotto l'1% da $N = 5$ in poi.

   Ho misurato il ritaglio fig01: la tacca «1» sta 327 px sopra la base e il centro della linea del picco per $N = 1$ vale $0.445$. Le letture dei due revisori (0.437 e 0.45) stanno ai due lati di questo valore. In `figures.ts` la didascalia di fig01 ora dice «circa 0.44», come l'MDX, f-c36, quiz ed exam. La conclusione $\sigma = 1$, $\sigma_0 = 2$ non cambia.
5. **Completamenti con la risposta scritta nel titolo** (basso). In `formulas-b.ts` ho reso neutri i titoli, che restano informativi:
   - f-c32 ora è «Caso limite N = 0: la media a posteriori senza campioni»;
   - f-c33 ora è «Caso limite N → ∞: la media a posteriori con infiniti campioni»;
   - f-c34 ora è «La varianza a posteriori al crescere di N».

   Ho aggiornato anche i rispettivi `nameEn`. Il primo completamento di f-c34 ora dichiara il limite: $N\to\infty\Rightarrow\sigma_N^2\to\boxed{?}$. Così il distrattore $\sigma_0^2$ (giusto solo per $\sigma^2\to\infty$) è sicuramente sbagliato. Nel foglio nessun rimando citava i vecchi titoli.
6. **der07: «coincide con ML ogni volta che la posterior collassa, o ha il massimo, sulla stima ML»** (medio). Verificato su ch2 p40: la slide enuncia solo i due casi. In `derivations-a.ts` il perché del secondo passo ora distingue due situazioni:
   - se la posterior collassa sulla stima ML, la densità coincide con il *plug-in* ML;
   - se la posterior ha solo il massimo in $\hat{\boldsymbol{\theta}}_{ML}$ (prior uniforme, $N$ finito), coincide la stima del parametro ma non la densità.

   Ho riscritto nello stesso senso anche la conclusione di der07, che diceva «coincidono quando la posterior si concentra sulla stima ML» anche per il prior uniforme.
7. **es11, variante «varianza del rumore ignota» con due risposte** (medio). Verificato su ch2 p33 (ipotesi 2: «initial knowledge about θ … contained in a known a priori density p(θ)»). In `exercises.ts` il testo della variante ora dice che la libreria spettrale dà anche un prior noto sulla varianza del rumore. Il codice resta 0. La spiegazione aggiunge che senza quel prior la risposta sarebbe 2.
8. **Sensore: con 9 letture σN vale esattamente 0.1** (basso). In `index.mdx` il testo ora dice «101 letture con il primo sensore e 10 con il secondo». Aggiunge che con 9 letture la precisione vale $9/0.09 = 100$ esatto, cioè $\sigma_N = 0.1$ °C e non meno.
9. **«μN = X̄ per ogni N» con prior uniforme** (basso). In `index.mdx` il testo ora dice «$\mu_N \to \bar{X}$ per ogni $N \ge 1$». Ho portato la stessa condizione in due altri punti:
   - la risposta d'orale «In which case ML and Bayesian are the same?» di «Per l'orale»;
   - la spiegazione di f-c49 in `formulas-b.ts`, che nella pagina sta proprio sopra questa frase.

### Rilievi scartati

Nessuno.

### Rilievi irrisolti

Nessuno.

### Verifiche

- `npx tsx scripts/validate-module.ts m07-stima-bayesiana`: `PASS m07-stima-bayesiana: 61 concetti coperti, 56 formule, 13 derivazioni, 21 widget, 57 flashcard, 70 quiz, 13 domande, 18 esercizi`.
- `npx tsx scripts/formula-coverage.ts m07-stima-bayesiana`: `OK m07-stima-bayesiana: 128/128 formule ritrovate`.
- `npx tsc -p tsconfig.app.json --noEmit`: nessun errore (exit 0).
- `node scripts/snap.mjs m/m07-stima-bayesiana/teoria …`: la pagina si carica senza errori di console. Ha 2133 nodi KaTeX, 0 `.katex-error` e nessun «extvera». Dopo «Mostra tutti i passi», il testo corretto dell'esempio del *Bayesian learning* compare nella pagina.

## Giro 2

Correttore del giro 2 (2026-09-25). Ho ricevuto 16 rilievi da tre revisori: uno di copertura, uno di fedeltà delle formule e un secondo revisore matematico. Alcuni descrivono lo stesso difetto:
- i titoli dei completamenti che contengono la risposta (rilievi 3, 6 e 11);
- «per ogni N» senza $N \ge 1$ in `checks.ts` e `derivations-a.ts` (rilievi 7 e 14).

Ho controllato i rilievi sulle immagini:
- part1 p26: proprietà delle stime, *correction factor*, *efficient*;
- ch2 p33 e part1 p27: le tre ipotesi, con «drawn independently according to the unknown probability density p(x)» e la $\boldsymbol{X}$ in corsivo grassetto;
- ch2 p37: i pesi di $\mu_N$;
- ch2 p40 e part1 p30: le due condizioni di equivalenza e la frase «Both methods will converge to the true parameter values».

Ho rifatto a mano i conti dei distrattori. Per ogni formula ho stampato titolo, titolo inglese, completamento e distrattori con uno script che importa `formulas-a.ts` e `formulas-b.ts`. Tutti e 16 i rilievi sono fondati e li ho applicati tutti. Nessuno è scartato e nessuno resta aperto.

### Rilievi corretti

1. **Termini tecnici senza l'inglese** (medio). In `index.mdx` ho aggiunto il corsivo inglese alla prima occorrenza di questi termini:
   - *multivariate Gaussian*, *mean vector* e *covariance matrix* (r. 28);
   - *expected value* (r. 65) e *correction factor* (r. 88);
   - *point estimate* (r. 183) e *mixture* (r. 253);
   - *vague prior* (r. 418);
   - *virtual samples* (r. 452, nella prima frase che definisce i campioni virtuali; il titolo della sezione non cambia perché la sua ancora è citata in `data.ts` e `theory-map.json`);
   - *pseudo-counts* (r. 456) e *dogmatic prior* (r. 582);
   - *location parameter* (r. 632) e *improper prior* (r. 875);
   - *mean squared error*, MSE (r. 914).
2. **es11, variante «6 immagini in giorni diversi, su laghi lontani»** (medio). Verificato su ch2 p33 e part1 p27: la terza ipotesi chiede campioni indipendenti tratti dalla stessa densità $p(\mathbf{x})$. In `exercises.ts` la variante ora dice «sparsi in punti lontani tra loro dello stesso lago, nella stessa immagine, tutti in acqua aperta e omogenea», con codice 0. La spiegazione aggiunge che con laghi e giorni diversi la risposta sarebbe 3. Nel testo della domanda l'opzione 3 ora recita «campioni estratti indipendentemente dalla densità ignota $p(\mathbf{x})$», come la slide.
3. **Completamenti con la risposta nel titolo** (basso; rilievi 3, 6 e 11). Ho tolto la formula da `name` e `nameEn`. I titoli restano informativi, e la formula resta visibile nella scheda.
   - In `formulas-a.ts`, i `nameEn` di f-c06 («Known density form»), f-c08 («Independently drawn samples»), f-c09 («Posterior density of the parameter»), f-c10 («Desired (predictive) density given the samples»), f-c22 («… the parameter vector, only the mean unknown»), f-c23 («Data model: Gaussian with unknown mean») e f-c24 («Gaussian prior on the mean»).
   - Sempre in `formulas-a.ts`, f-c21 ora è «Verosimiglianza di campioni indipendenti» / «Likelihood of independently drawn samples».
   - In `formulas-b.ts`, i `nameEn` di f-c36, f-c38, f-c42, f-c47, f-c60 e f-c61-5.
   - Sempre in `formulas-b.ts`, i `name` di f-c57-2 («… il fattore di bias»), f-c58-2 («Correzione del bias della covarianza ML», anche in inglese) e f-c60-2 («Varianza a posteriori con i campioni virtuali»).
   - f-c43: il rilievo segnalava solo il `nameEn`, ma anche il `name` conteneva «and thus μ = μN». Ora sono «La media inferita dalla densità stimata» / «The mean inferred from the estimated density (end of slide p39)».
   - f-c34-2 ora è «Il limite della posterior per N → ∞». Nel secondo completamento il distrattore $N(\mu_0,\sigma_0^2)$ doppiava $p(\mu)$: al suo posto c'è $\delta(\mu-\mu_0)$, una delta dalla forma giusta e dal centro sbagliato.
   - Nello stesso giro ho corretto due casi che nessun rilievo segnalava. f-c19-2 aveva $p(X)$, la risposta, nel titolo: ora è «Posterior: il denominatore nella forma delle note». f-c11 diceva «marginalization over θ» con risposta $\mathrm{d}\boldsymbol{\theta}$: ora dice «over the parameter», come l'italiano.
4. **Distrattore $(\mathbf{x}_k-\mathbf{m})^t$ di f-c55 che dà un'identità vera** (medio). Verificato: $\sum_k(\mathbf{x}_k-\hat{\mathbf{m}}) = \mathbf{0}$, quindi qualunque $(\mathbf{x}_k-\mathbf{c})^t$ dà la stessa $\hat{\Sigma}$. Il distrattore ora è $(\hat{\mathbf{m}}-\mathbf{x}_k)^t$, che dà $-\hat{\Sigma}$.
5. **Distrattore $\sigma_0^2$ di f-c37 che rende vero il limite** (medio). Verificato: ogni numeratore che non dipende da $N$ va a zero. Il distrattore ora è $N\sigma^2$, che tende a $\sigma^2/\sigma_0^2 \neq 0$. Resta $N\sigma_0^2$, che tende a 1.
6. **«per ogni N» senza $N \ge 1$** (basso; rilievi 7 e 14). Ho scritto «per ogni $N \ge 1$» in `checks.ts` (spiegazione di chk-18) e in `derivations-a.ts` (ultimo passo di der07).
7. **$\mathbf{X}$ invece di $\boldsymbol{X}$ in or-banca-1** (basso). In `exam.ts` le due occorrenze ora usano `\boldsymbol{X}`. Nel foglio non resta alcun `\mathbf{X}`.
8. **Equivalenza e consistenza confuse** (medio). Verificato su part1 p30: la frase delle note unisce due affermazioni. Il controesempio del revisore è giusto: $\mu_N-\bar{X} = \frac{n_0}{N+n_0}(\mu_0-\bar{X}) \to 0$ per qualunque distribuzione con media finita.
   - `index.mdx` (r. 859-864) ora distingue le due affermazioni in due punti. Per l'equivalenza basta un prior che non escluda il limite della stima ML ($\sigma_0^2>0$), qualunque sia la distribuzione dei dati. Per la consistenza servono in più dati generati davvero dal modello; se il modello è sbagliato le due stime coincidono al limite, ma un valore vero del parametro non esiste.
   - In `flashcards.ts`, fc-condizioni-equivalenza ha la domanda estesa alle due condizioni e la risposta riscritta nello stesso senso.
   - Per coerenza ho ritoccato anche `derivations-a.ts` (der07, passo dell'equivalenza asintotica) e la conclusione di der11 in `derivations-b.ts`: il prior non deve escludere il limite di $\bar{X}$, che è il valore vero se i dati vengono dal modello.
   - chk-20 era già corretto.
9. **es11, variante «nessuna libreria spettrale, nessun esperto»** (medio). Verificato su part1 p30: l'assenza di conoscenza si esprime con un prior uniforme, che è noto, quindi anche 0 era difendibile. La variante ora dice che il prior viene costruito con media e varianza degli stessi 6 pixel. È una violazione netta della seconda ipotesi, codice 2: il prior non è fissato prima delle osservazioni (part1 p27: «before considering any observations»; `index.mdx` r. 161: il prior «non si stima dai campioni»). La spiegazione aggiunge che i dati verrebbero usati due volte e che il caso «nessuno sa nulla» si tratta con il prior uniforme.
10. **«Efficienti» senza riserve nella risposta d'orale sulla covarianza ML** (medio). Verificato su part1 p26. In `exam.ts` la risposta di or-covarianza-ml ora precisa, in prima persona, che l'efficienza vale in senso stretto per $\hat{\mathbf{m}}$. Per $\hat{\Sigma}$ con $1/N$, distorta a $N$ finito, vale solo in senso asintotico. Ho aggiunto la stessa voce alla checklist.
11. **La lettera $w$ con due significati** (basso). In der05 (`derivations-a.ts`) ora $w = N\sigma_0^2/(N\sigma_0^2+\sigma^2)$ è il peso dei dati, come nel resto del foglio. Il passo scrive $\mu_N-\bar{X} = (1-w)(\mu_0-\bar{X})$ e chiama $1-w$ il peso del prior. Nel foglio nessun'altra formula usa $w$ per il peso del prior.
12. **«Il massimo della posterior cade sul bordo del supporto» detto in generale** (basso). In `index.mdx` (precisazione 2 del riquadro sul prior uniforme) e in der07 il testo ora dice che il massimo della posterior non coincide con $\hat{\boldsymbol{\theta}}_{ML}$. Nel caso gaussiano, con verosimiglianza unimodale, cade sull'estremo del supporto più vicino a $\bar{X}$. Con più massimi può cadere su un massimo locale interno.
13. **der11: limiti confrontati su quantità diverse** (basso). In `derivations-b.ts` ora i due ordini dei limiti si confrontano sulla stessa quantità. Da una parte $\lim_N\lim_{\sigma_0^2\to0}(\mu_N-\bar{X}) = \mu_0-\mu_{\text{vera}}$, quasi certamente, con $\mu_{\text{vera}}$ definita nel passo. Dall'altra $\lim_{\sigma_0^2\to0}\lim_N(\mu_N-\bar{X}) = 0$.

### Rilievi scartati

Nessuno.

### Rilievi irrisolti

Nessuno.

### Verifiche

- `npx tsx scripts/validate-module.ts m07-stima-bayesiana`: `PASS m07-stima-bayesiana: 61 concetti coperti, 56 formule, 13 derivazioni, 21 widget, 57 flashcard, 70 quiz, 13 domande, 18 esercizi`.
- `npx tsx scripts/formula-coverage.ts m07-stima-bayesiana`: `OK m07-stima-bayesiana: 128/128 formule ritrovate`.
- `npx tsc -p tsconfig.app.json --noEmit`: nessun errore nei file del foglio. L'unico errore sta in un file di un altro agente: `src/pages/Coverage.test.tsx(190,11): error TS2304: Cannot find name 'waitFor'`.
- `node scripts/snap.mjs m/m07-stima-bayesiana/teoria …`: la pagina si carica senza errori di console, con 2137 nodi KaTeX e 0 `.katex-error`. Ho aperto tutte le 15 dimostrazioni: diventano 2864 nodi KaTeX, sempre con 0 errori. I 14 termini inglesi e i testi nuovi di der05, der07 e der11 compaiono nella pagina, e il testo non contiene caratteri di controllo.
- Un incidente durante il lavoro. Una prima sostituzione fatta da shell ha tolto le barre rovesciate da tre stringhe nuove di `derivations-a.ts`: `\b` e `\t` sono diventati caratteri di controllo. L'ho riparata subito con uno script da file. Il controllo finale non trova caratteri di controllo in nessun file del foglio.
