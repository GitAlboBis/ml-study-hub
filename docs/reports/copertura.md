# Copertura dei concetti

Generato da `npx tsx scripts/coverage-report.ts` il 2026-09-24 alle 17:18. Non si modifica a mano: si rigenera.

**Concetti coperti: 71/71 (100%)** su 1 foglio pronto di 50. Buchi: 0. Rimandi in attesa: 2.

Un concetto dell'inventario è coperto se la sua voce di `coverage` porta ad almeno una destinazione che esiste. Le colonne contano i concetti con almeno una destinazione di quel tipo: **teoria** (sezione ## o ###, esempio svolto, figura), **formula** (formula o dimostrazione), **widget**, **pratica** (quiz, flashcard, domanda d'orale, esercizio), **rimandi** (`seeAlso` verso un foglio pronto). "Widget con il file" conta i widget del foglio (`data.widgets`) che hanno già il loro `src/widgets/<cartella>/<id>.widget.tsx`.

## Fogli pronti

| Foglio | Concetti | Coperti | Teoria | Formula | Widget | Pratica | Rimandi | Widget con il file |
|---|---|---|---|---|---|---|---|---|
| 09 · Finestre di Parzen (kernel density estimation) (`m09-parzen-windows`) | 71 | 71 (100%) | 71 | 54 | 70 | 71 | 0 | 28/28 |
| **Totale** | 71 | 71 (100%) | 71 | 54 | 70 | 71 | 0 | 28/28 |

## Buchi

Nessun buco: ogni concetto dei fogli pronti ha almeno una destinazione che esiste.

## Rimandi in attesa

Rimandi `seeAlso` verso fogli non ancora pronti: si verificano quando il foglio arriva.

- 09 · Finestre di Parzen (kernel density estimation) (`m09-parzen-windows`) · `c03` Coda del K-NN: stime della densità bimodale per N = 16, 256, ∞ → `seeAlso:m08-non-parametrica-knn`
- 09 · Finestre di Parzen (kernel density estimation) (`m09-parzen-windows`) · `c68` Transizione: stima con dati incompleti (confine con m10) → `seeAlso:m10-em-dati-incompleti`

## Concetti senza widget

Ammessi solo con un motivo scritto nell'inventario (`noWidgetReason`).

### 09 · Finestre di Parzen (kernel density estimation) (`m09-parzen-windows`)

- `c68` Transizione: stima con dati incompleti (confine con m10): motivo: Frase di transizione che appartiene al modulo adiacente m10 (dati incompleti ed EM): i widget dedicati stanno in quel modulo.

## Fogli in preparazione

| Foglio | Inventario | Concetti | Widget |
|---|---|---|---|
| 01 · Segnali, acquisizione e apprendimento (`m01-segnali-learning`) | stadi: inventario, completezza, formule | 82 | 30 |
| 02 · Sistema di ML: schema a blocchi, fasi di design ed esempi applicativi (`m02-sistema-ml-design`) | stadi: inventario, completezza, formule | 79 | 37 |
| 03 · Stima statistica: introduzione, stima di PDF e stima parametrica (`m03-stima-intro-parametrica`) | stadi: inventario, completezza, formule, formule2 | 79 | 31 |
| 04 · Bontà di uno stimatore, bound di Cramér-Rao e proprietà asintotiche (`m04-bonta-stimatori`) | stadi: inventario, completezza, formule, formule2 | 70 | 25 |
| 05 · Stima a massima verosimiglianza (ML) (`m05-max-likelihood`) | stadi: inventario, completezza, formule, formule2 | 69 | 28 |
| 06 · Modelli di PDF e modello gaussiano (`m06-modelli-pdf-gaussiana`) | stadi: inventario, completezza, formule, formule2 | 71 | 24 |
| 07 · Stima bayesiana e confronto ML vs Bayes (`m07-stima-bayesiana`) | stadi: inventario, completezza, formule, formule2 | 61 | 21 |
| 08 · Stima non parametrica e K-NN (`m08-non-parametrica-knn`) | stadi: inventario, completezza, formule, formule2 | 71 | 33 |
| 10 · Stima con dati incompleti e algoritmo EM (`m10-em-dati-incompleti`) | stadi: inventario, completezza, formule, formule2 | 67 | 23 |
| 11 · Riduzione delle feature, effetto Hughes e selezione (`m11-hughes-feature-selection`) | stadi: inventario, completezza, formule | 72 | 21 |
| 12 · Misure di separabilità: divergenza, Bhattacharyya, Jeffries-Matusita (`m12-misure-separabilita`) | stadi: inventario, completezza, formule | 70 | 25 |
| 13 · Strategie di ricerca: SFS e SBS (`m13-strategie-ricerca`) | stadi: inventario, completezza, formule | 52 | 17 |
| 14 · Estrazione di feature e PCA (`m14-pca`) | stadi: inventario, completezza, formule | 59 | 21 |
| 15 · LDA (Fisher) e confronto PCA vs LDA (`m15-lda`) | stadi: inventario, completezza, formule | 71 | 20 |
| 16 · Classificazione supervisionata: MDM e Box classifier (`m16-mdm-box`) | stadi: inventario, completezza, formule | 72 | 26 |
| 17 · Classificazione bayesiana: criteri MAP e ML (`m17-bayes-map-ml`) | stadi: inventario, completezza, formule | 71 | 24 |
| 18 · Teoria del rischio minimo (`m18-rischio-minimo`) | stadi: inventario, completezza | 68 | 24 |
| 19 · Funzioni discriminanti e casi gaussiani (`m19-funzioni-discriminanti`) | stadi: inventario, completezza | 66 | 23 |
| 20 · Alberi di decisione e CART (`m20-alberi-decisione`) | stadi: inventario | 81 | 29 |
| 21 · Errore di generalizzazione, funzioni di loss e cross-validation (`m21-errore-generalizzazione`) | stadi: inventario | 79 | 28 |
| 22 · Valutazione dell'accuratezza, ROC e confronto tra classificatori (`m22-valutazione-accuratezza`) | assente | — | — |
| 23 · Stima ML e bayesiana dei parametri, statistiche sufficienti, prior coniugati (`p01-stima-parametri`) | assente | — | — |
| 24 · Applicazioni: Bernoulli (Beta) e Multinomiale (Dirichlet) (`p02-bernoulli-multinomiale`) | assente | — | — |
| 25 · Reti bayesiane: definizione e indipendenze (`p03-reti-bayesiane`) | assente | — | — |
| 26 · d-separazione (`p04-d-separazione`) | assente | — | — |
| 27 · Apprendimento nei modelli grafici: ML, MAP, dati incompleti (`p05-apprendimento-reti`) | assente | — | — |
| 28 · Funzioni discriminanti lineari e perceptron (`p06-discriminanti-perceptron`) | assente | — | — |
| 29 · Regressione, classificazione multiclasse e classificatori lineari generativi (`p07-regressione-multiclasse`) | assente | — | — |
| 30 · SVM a margine rigido (`p08-svm-hard-margin`) | assente | — | — |
| 31 · SVM a margine morbido e SVM su larga scala (`p09-svm-soft-margin`) | assente | — | — |
| 32 · Kernel trick e kernel validi (`p10-kernel-trick`) | assente | — | — |
| 33 · Kernel machines e kernel per dati strutturati (`p11-kernel-machines`) | assente | — | — |
| 34 · Apprendimento non supervisionato: k-means, GMM, numero di cluster, clustering gerarchico (`p12-clustering`) | assente | — | — |
| 35 · Reinforcement learning: decisioni sequenziali e politica ottima (`p13-rl-mdp`) | assente | — | — |
| 36 · Reinforcement learning: valutazione e apprendimento della politica (`p14-rl-apprendimento`) | assente | — | — |
| 37 · Reti feedforward, funzioni di costo, unità e attivazioni (`d01-reti-feedforward`) | assente | — | — |
| 38 · Discesa del gradiente e backpropagation (`d02-backpropagation`) | assente | — | — |
| 39 · Ottimizzazione: varianti del gradiente e normalizzazione (`d03-ottimizzazione`) | assente | — | — |
| 40 · Regolarizzazione (`d04-regolarizzazione`) | assente | — | — |
| 41 · Reti convoluzionali e architetture per classificazione (`d05-cnn`) | assente | — | — |
| 42 · Object detection e instance segmentation (`d06-detection-segmentation`) | assente | — | — |
| 43 · Reti ricorrenti: RNN, LSTM, GRU (`d07-rnn`) | assente | — | — |
| 44 · Modelli sequenziali, captioning e attention (`d08-modelli-sequenziali`) | assente | — | — |
| 45 · Transformer, ViT e Swin (`d09-transformers`) | assente | — | — |
| 46 · Generative Adversarial Networks (`d10-gan`) | assente | — | — |
| 47 · Autoencoder, VAE e VQ-VAE (`d11-autoencoder-vae`) | assente | — | — |
| 48 · Modelli di diffusione (`d12-diffusion`) | assente | — | — |
| 49 · Apprendimento contrastivo e masked image modelling (`d13-self-supervised-visione`) | assente | — | — |
| 50 · CLIP e LLM come interfaccia universale (`d14-clip-llm-multimodali`) | assente | — | — |
