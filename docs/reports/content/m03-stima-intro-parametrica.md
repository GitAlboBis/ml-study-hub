# Revisione del foglio m03-stima-intro-parametrica

Foglio: «Stima statistica: introduzione, stima di PDF e stima parametrica» (Cap. 2, Melgani; ch2 p.1-11, part1 p.12-19).

## Giro 1

Quindici rilievi da tre revisori (copertura, fedeltà delle formule, verifica matematica). Alcuni rilievi si ripetono: quelli sui «5 errori su 100» e quello sulla «Stima ideale» del glossario compaiono più volte. Ogni rilievo è stato controllato sulle immagini delle pagine (part1 p.11, 13, 15, 18, 19; ch2 p.3, 6, 7, 40) e sul testo per pagina.

### Corretti

1. **I «5 errori su 100» e il 95% come fatto** (tre rilievi uguali). part1 p.11 dice «For example, if there are 5 errors out of 100 total classifications, the accuracy would be 95%»: è un esempio di calcolo, non l'errore misurato della retta. Le modifiche:
   - index.mdx, introduzione all'esempio del pesce: la retta «lascia ancora qualche pesce dalla parte sbagliata»; il 95% diventa l'esempio di calcolo delle note, con l'inglese *accuracy*.
   - index.mdx, esempio svolto «Esempio del pesce, ultimo stadio», passo «I gradini precedenti»: stessa riformulazione, detta esplicitamente «esempio di calcolo, non un risultato misurato».
   - exam.ts, domanda or-overfitting: risposta riformulata. Nella checklist «95% di accuratezza» è stato sostituito da «retta … che sbaglia ancora qualche pesce», e c'è una voce nuova: «come si calcola l'accuratezza (esempio delle note: 5 errori su 100 danno il 95%)».
2. **Cramér-Rao: l'ipotesi di non polarizzazione presentata come sottintesa** (index.mdx). part1 p.19 scrive «unbiased» in grassetto. Ora il testo dice che le note *dichiarano* che il bound vale per stimatori non polarizzati e *sottintendono* solo le condizioni di regolarità (*regularity conditions*).
3. **Termini tecnici senza inglese** (index.mdx). L'inglese in corsivo è stato aggiunto alla prima occorrenza di: mistura (*mixture*), probabilità d'errore (*error probability*), regola della catena (*chain rule*), media campionaria (*sample mean*), teorema di Bayes (*Bayes' theorem*), prior uniforme (*uniform prior*), errore quadratico medio (*mean squared error*, MSE), condizioni di regolarità (*regularity conditions*), prodotto esterno (*outer product*), convergenza in probabilità (*convergence in probability*).
4. **Glossario oltre la fonte**:
   - «Pre-elaborazione»: «richiede una stima statistica» è diventato «la stima statistica aiuta» (part1 p.13 dice *helps*, ch2 p.3 dice *can be necessary here*), con l'esempio di media e deviazione standard per normalizzare.
   - «Campionatore»: gli istanti $t_j = (j+0.5)T$ sono ora presentati come lettura di «every x.5T».
   - «Stima ideale»: «irraggiungibile» è diventato «difficile da ottenere (*may be challenging*)», come in part1 p.18. Questo rilievo compariva due volte.
   Per coerenza sono state corrette anche le altre affermazioni:
   - exam.ts, domanda or-canale-pam: «every x.5T» presentato come lettura.
   - exercises.ts, soluzione dell'esercizio sul sistema PAM: stessa correzione.
   - flashcards.ts, flashcard sulla stima nel pre-processing: ora dice «normalizzare a media nulla e varianza unitaria». Una normalizzazione min-max su un intervallo noto non stima nulla.
5. **Due referenti diversi per «as we have understood before»**. ch2 p.6 non dice a che cosa rimandi, e neppure part1 p.15 («as discussed earlier»). Una sola formulazione prudente sostituisce le due versioni: «la slide non dice a che cosa rimandi; negli appunti il discorso che precede è l'esempio PAM, e più in generale il Capitolo 1». La modifica è in index.mdx (sezione del canale PAM e sezione «La stima della pdf al centro del corso»), in data.ts (collegamento con m01) e nella flashcard fc-focus-del-corso.
6. **Blank di Bayes in f-c62 con un distrattore vero**. $p(\boldsymbol\theta\mid\mathbf X)\,p(\mathbf X)$ è uguale a $p(\mathbf X\mid\boldsymbol\theta)\,p(\boldsymbol\theta)$, quindi rendeva la formula un'identità vera. È stato sostituito con $\frac{p(\mathbf X\mid\boldsymbol\theta)}{p(\boldsymbol\theta)}$, che è sbagliato.
7. **Blank di f-c58 con il distrattore $\theta$**. Per la media gaussiana con $\sigma$ nota, $\int\mathcal N(x;\theta,\sigma^2)\,d\theta = 1$, quindi il distrattore dava una formula vera. È stato sostituito con $\sigma$: l'integrale in $\sigma$ diverge. Nei pitfalls è stata aggiunta la nota sulla famiglia di posizione (*location family*): la coincidenza vale per un singolo $p(x\mid\theta)$, non vale per un parametro di scala e non vale per la verosimiglianza di $N \ge 2$ campioni (circa $1.07\times10^{-7}$ nell'esempio).
8. **Grassetto di X e x nelle citazioni** (index.mdx). Nel riquadro della slide 7, `$X$` è diventato `$\mathbf{X}$`. Nella citazione della slide 40, `$p(x\mid X)$` è diventato `$p(\mathbf{x}\mid\mathbf{X})$`, come nelle immagini di ch2 p.7 e p.40.
9. **Domanda or-banca-9 (MAP e ML): «uguaglianza solo per prior uguali»**. Era falso. Ora la risposta dice che l'uguaglianza vale quando le due regole decidono allo stesso modo quasi ovunque: con prior uguali, oppure con classi che non si sovrappongono. L'esempio è il PAM ideale, che ha errore nullo con prior qualunque.
10. **Domanda or-canale-pam: «nel caso reale non me le dà nessuno»**. part1 p.13 dice «we know the distribution of both x … and n»: nell'esempio le densità sono note e si ottengono per convoluzione. La risposta ora lo dice, e spiega che vanno stimate quando non sono note (per esempio con $\sigma_n$ incognita o con la forma del rumore ignota). Anche la voce della checklist è stata aggiornata.
11. **Alla slide 6 era attribuito un motivo che non dà**. La fonte (ch2 p.6, part1 p.15) dà un solo motivo: le categorie 2 e 3 sono le più comuni nelle applicazioni reali. «Non resta una densità da stimare» ora è presentato come lettura del foglio, non come motivo della slide, in questi punti:
    - index.mdx, dopo la sezione sul fuoco del corso e nell'elenco delle tre categorie;
    - formulas-b.ts, spiegazione di f-c78;
    - flashcards.ts, fc-focus-del-corso;
    - quiz.ts, spiegazione di q-focus-del-capitolo.

### Scartati

Nessuno: tutti i rilievi sono risultati corretti sulle immagini delle fonti.

### Irrisolti

Nessuno. Non ci sono concetti nuovi nella teoria, quindi la copertura in data.ts non è cambiata. La descrizione dell'esempio svolto ex04 nell'inventario (docs/inventory/m03-stima-intro-parametrica.json) contiene ancora il 95% come fatto. Il foglio non la copia più, e l'inventario non è stato toccato perché è fuori dal compito.

### Verifiche

- `npx tsx scripts/validate-module.ts m03-stima-intro-parametrica`: PASS (79 concetti coperti, 60 formule, 8 derivazioni, 31 widget, 77 flashcard, 105 quiz, 19 domande, 21 esercizi).
- `npx tsx scripts/formula-coverage.ts m03-stima-intro-parametrica`: OK, 128/128 formule ritrovate.
- `npx tsc -p tsconfig.app.json --noEmit`: nessun errore.
- `node scripts/snap.mjs` sulle schede teoria, formule, orale, flashcard, quiz ed esercizi: nessun errore in console e nessun `.katex-error`. Nella scheda teoria compaiono i testi nuovi.

## Giro 2

Venti rilievi da tre revisori (copertura, fedeltà delle formule, secondo revisore matematico). Molti si ripetono: il distrattore del blank sulla probabilità totale compare tre volte, la condizione della slide 19 e il distrattore del prior uniforme due volte ciascuno. Restano sedici problemi distinti. Ognuno è stato controllato sulle immagini delle pagine: part1 p.12 e p.19, ch2 p.19, p.40, p.72-73, part2 p.27. Per le slide del Capitolo 1 sono stati controllati i titoli delle pagine 21-43 nel testo per pagina. I generatori degli esercizi sono stati ricalcolati con uno script tsx su 1000 seed.

### Corretti

1. **Prior uniforme: è falso che la media a posteriori valga sempre la stima ML** (critico). ch2 p.40 dice solo che le soluzioni sono equivalenti. Da $p(\theta\mid\mathbf X)\propto p(\mathbf X\mid\theta)$ segue soltanto che l'arg max coincide. Controesempio: Bernoulli con prior uniforme e 0 spam su 5 email. La ML vale 0, il MAP 0, la media a posteriori 1/7. Le modifiche:
   - index.mdx, sezione «Quando ML e Bayes coincidono»: con prior uniforme coincide il massimo del posterior (MAP, *maximum a posteriori*). La media a posteriori (*posterior mean*) coincide solo se il posterior è simmetrico attorno al massimo, come nell'esempio gaussiano con prior piatto su tutta la retta. Il testo ora riporta il controesempio Bernoulli, $(k+1)/(N+2)$ contro $k/N$, legato al filtro antispam della sezione precedente, e ricorda che un prior uniforme su un intervallo limitato tronca il posterior.
   - formulas-b.ts, f-c79-2: `nameEn` diventa «Uniform prior: the posterior maximum (MAP) coincides with the ML estimate». Nei `pitfalls` ci sono la distinzione tra MAP e media a posteriori e il controesempio.
   - formulas-b.ts, f-c79-3 (`pitfalls`); flashcards.ts, fc-densita-bayesiana-vs-ml; quiz.ts, q-densita-bayesiana-prior-piatto-tf: «le stime del parametro» diventa «il massimo del posterior (MAP) e la stima ML».
   - derivations.ts, der07: il passo era già corretto, perché l'esempio è gaussiano. Ora dice esplicitamente che massimo e media coincidono perché il posterior è una gaussiana simmetrica, e che in generale coincide solo il massimo.
2. **EM descritto come imputazione del valore atteso** (exercises.ts, es18, alto). ch2 p.72-73: il passo E calcola $Q(\boldsymbol\theta,\boldsymbol\theta^{(k)}) = E\{\log p(\mathbf X,\mathbf Y\mid\boldsymbol\theta)\mid\mathbf X,\boldsymbol\theta^{(k)}\}$, e il passo M prende $\arg\max Q$. La soluzione ora riporta le due formule. Per la gaussiana bivariata dello scenario spiega che servono le statistiche sufficienti attese ($E\{x_m\mid x_o\}$, $E\{x_m^2\mid x_o\}$, $E\{x_m x_o\mid x_o\}$), e che con la sola media condizionata varianza e covarianza escono sottostimate.
3. **Blank della probabilità totale (f-c08-3) con un distrattore vero** (tre rilievi uguali). Con $P(Y_s = 0.25)$ al posto di $P(s)$, nel canale ideale di part1 p.12 la catena resta vera. Il distrattore è stato sostituito con $P(Y_s = 0.25\mid s)$, che dà $1 \ne P(\text{Yes})$. Resta l'altro distrattore, $P(s\mid Y_s = 0.25)$, che dà anch'esso 1.
4. **Blank dello stimatore efficiente (f-c72): «≤» equivale a «=»** per uno stimatore non polarizzato. I distrattori ora sono «>» e «<», entrambi falsi per uno stimatore efficiente. C'è anche un secondo blank sul membro destro, con risposta $[\mathbf I^{-1}(\boldsymbol\theta)]_{ii}$ e distrattori $[\mathbf I(\boldsymbol\theta)]_{ii}$, $0$ ed $E\{\varepsilon_i\}$.
5. **Legenda del bound di Cramér-Rao (f-c70)**. «La minima varianza raggiungibile» diventa «limite inferiore alla varianza di uno stimatore non polarizzato di $\theta_i$ (non sempre raggiunto)», come in part1 p.19 («lower limit on the variance of an unbiased statistical estimator»).
6. **Condizione «in certain hypotheses regarding p(x|θ)» della slide 19** (due rilievi). Verificata sull'immagine di ch2 p.19 e aggiunta in:
   - index.mdx, callout d'esame della sezione per l'orale;
   - exam.ts, or-banca-1: risposta e voce della checklist;
   - data.ts, collegamento con m05.
   der05 la riportava già.
7. **MAP nelle reti bayesiane** (exam.ts, or-banca-10 e or-banca-8). part2 p.27 chiama MAP la formula $\frac{N_{u,x}+\alpha_{x\mid u}}{\sum_x(N_{u,x}+\alpha_{x\mid u})}$, con gli $\alpha$ come pseudo-conteggi («imaginary observations»). Ora la risposta la presenta come stima MAP delle note di Passerini. Aggiunge che, se gli $\alpha$ sono i parametri della Dirichlet, la stessa formula è la media a posteriori e la moda vale $\frac{N_{ijk}+\alpha_{ijk}-1}{N_{ij}+\alpha_{ij}-K}$, e consiglia di usare all'orale la convenzione del docente. Riporta anche l'effetto di $\alpha$ piccoli e grandi descritto in part2 p.27. La stessa correzione è stata fatta in or-banca-8, che chiamava la formula «media a posteriori».
8. **Distrattore $p(\mathbf X\mid\boldsymbol\theta)$ nel blank del prior uniforme (f-c79-2)** (due rilievi). Il posterior $\propto p(\mathbf X\mid\boldsymbol\theta)^2$ ha lo stesso arg max, quindi l'implicazione era vera. Il distrattore è stato sostituito con $\delta(\boldsymbol\theta-\boldsymbol\theta_0)$, che porta il massimo in $\boldsymbol\theta_0$.
9. **es19 accettava la risposta ML** (circa 41% delle istanze). Nel caso non-slide il generatore ora estrae $N \in [1, 30]$ e $\sigma_0 \in [0.1, 2]$ finché il peso dei dati sta fra 0.2 e 0.9 e $|\mu_0-\bar x| \ge 1$. Così $|\mu_N-\bar x| \ge 0.1$ e $|w-1| \ge 0.1$, molto oltre le tolleranze. Su 1000 seed la risposta $\mu_N = \bar x$ è accettata 0 volte, e così $w = 1$. I numeri della slide (1 caso su 4) restano.
10. **es21 accettava lo scambio delle due varianze** (circa 58%). La differenza relativa fra $\sigma^2+\sigma_N^2$ e $\sigma^2(1+1/N)$ vale $1/(N(N\sigma_0^2/\sigma^2+1))$. Il generatore ora estrae $N \in [2, 20]$ e $\sigma_0 \in \{0.1, 0.2, 0.3, 0.5, 1\}$ finché questa differenza supera il 3%, sei volte la tolleranza. Su 1000 seed lo scambio è accettato 0 volte. Anche $\sigma_N^2$ confuso con $\sigma^2/N$ non passa mai: lo scarto minimo è 12.5 volte la tolleranza.
11. **es09 accettava 102 invece di 103**. La tolleranza del numero minimo di campioni scende da 1.01 a 0.1, e il testo chiede «il minimo numero intero». Su 1000 seed ceil−1 non è mai accettato.
12. **«Circa 30 slide di esempi»**. part1 p.12 dice 30, ma nel PDF ch1 (43 pagine) dopo la slide 20 ne restano 23: la 21 «Application Domains» e le 22-43 di esempi, da UAV Image Analysis a COVID-19 Detection. Titoli verificati nel testo per pagina. Le modifiche:
    - index.mdx, riga del promemoria: il 30 è attribuito alle note e sono elencati alcuni esempi;
    - index.mdx, collegamento con m02;
    - data.ts, collegamento con m02;
    - quiz.ts, q-nota-trenta-slide: opzione corretta «slide di esempi applicativi (21-43)», e la spiegazione dà il conteggio del PDF.
    Nota: le slide 22-43 sono 22 slide di esempi, non 22 esempi distinti (UAV occupa 3 slide, Biometry 2, Underground Storage Tanks 4). Per questo il testo dice «slide», non «esempi».
13. **PAM: «conoscere, e quindi stimare»** (index.mdx). Diventa: per decidere servono le distribuzioni; nell'esempio delle note sono note (leggi di $x$ e di $n$, part1 p.13); quando non lo sono vanno stimate dai dati.
14. **Termini senza inglese** (index.mdx). Aggiunti alla prima occorrenza: classificatore lineare (*linear classifier*), pendenza (*slope*), intercetta (*intercept*), teorema della probabilità totale (*total probability theorem*), densità congiunta (*joint density*), densità marginali (*marginal densities*), funzione costo o funzione obiettivo (*cost or objective function*), disuguaglianza di Chebyshev (*Chebyshev inequality*). *linear classifier*, *slope*, *intercept* e *cost or objective function* sono le parole delle note (part1 p.11 e p.18); gli altri sono i termini inglesi standard. La densità congiunta compare già alla sezione sul problema della stima: lì c'è la prima occorrenza con l'inglese, ripetuto nel paragrafo che risponde alla domanda d'orale sul prodotto.
15. **«Melgani apre spesso con la verosimiglianza»**: senza fonte. Diventa «Una domanda della banca di Melgani parte dalla verosimiglianza».
16. **q-definizione-consistenza**: la spiegazione ora tratta anche l'opzione con limite 0. L'errore finirebbe quasi certamente oltre ogni tolleranza, il contrario della consistenza.

### Scartati

Nessuno: tutti i rilievi sono risultati corretti sulle immagini delle fonti.

### Irrisolti

Nessuno. La teoria non ha concetti nuovi, quindi la copertura in data.ts non cambia. Rispetto ai fix proposti ci sono due scostamenti:
- nel blank di f-c72 non è stato usato il distrattore $1/N$ proposto, perché per $\sigma = 1$ coincide con il bound della media gaussiana; al suo posto $E\{\varepsilon_i\}$;
- nel blank di f-c08-3 non è stato usato $\frac{1}{3}$, come suggerito dal revisore stesso.

### Verifiche

- `npx tsx scripts/validate-module.ts m03-stima-intro-parametrica`: PASS (79 concetti coperti, 60 formule, 8 derivazioni, 31 widget, 77 flashcard, 105 quiz, 19 domande, 21 esercizi).
- `npx tsx scripts/formula-coverage.ts m03-stima-intro-parametrica`: OK, 128/128 formule ritrovate.
- `npx tsc -p tsconfig.app.json --noEmit`: nessun errore.
- Script tsx su 1000 seed per es09, es19 ed es21: le risposte sbagliate descritte nei rilievi non sono mai accettate, e nessun valore è NaN.
- `node scripts/snap.mjs` sulle schede teoria, formule, orale, quiz, esercizi, flashcard e riassunto: nessun errore in console e 0 `.katex-error`. Nella scheda teoria compaiono tutti i testi nuovi.
