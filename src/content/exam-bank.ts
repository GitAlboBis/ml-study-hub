// Banca delle domande d'orale: il documento "Questions Learning Exam" (_sources/nlm_text/exam_questions.txt,
// pagine in /fonti/examq/1-6) scomposto in domande atomiche. Il testo inglese `text` è VERBATIM, refusi
// compresi ("Huges", "wight", "Vanila"); i ritorni a capo della fonte sono diventati spazi. È un resoconto di
// studente, spesso in prima persona ("I told him…"): non è la domanda da mostrare come tale. La traduzione
// italiana `textIt` e la domanda inglese `textEn` sono nostre e riformulano il resoconto come domanda, in
// seconda persona; `textEn` è testo semplice (la riga EN della scheda d'orale), `textIt` è Markdown con KaTeX.
//
// Come è stata scomposta (82 resoconti nella fonte → 88 domande):
// - Melgani: 20 paragrafi. Il paragrafo 14 è un elenco di cinque argomenti, uno per riga (errore di
//   generalizzazione, loss, cross-validation, matrice di confusione, ROC): diventa mel-14a…mel-14e.
//   La domanda mel-20 è dell'assistente (prof 'Assistant').
// - Passerini: 21 paragrafi. Due contengono due argomenti distinti, ognuno con le sue domande: il 7
//   (SVM non lineari; kernel machines) e il 15 (soft SVM; apprendimento non supervisionato).
// - Deep Learning (Ricci): 41 voci numerate. La voce 42 della fonte è vuota.
// Un resoconto che racconta una sola prova con più domande di seguito ("Then he asked…", "Questions: - …")
// resta una domanda sola: è ciò che il docente ha chiesto in quella prova.
//
// moduleIds: i fogli in cui sta la risposta, il principale per primo (dai titoli di docs/plan/modules.json e
// dalle examQuestions degli inventari in docs/inventory). La copertura (gate G7, scripts/bank-check.ts) cerca
// negli ExamQuestion di questi fogli un bankText che corrisponda: vedi coversBankQuestion qui sotto.
import { md } from './types'
import type { Prof, Rich } from './types'

export type BankPart = 'Melgani' | 'Passerini' | 'Deep Learning'
export const BANK_PARTS: readonly BankPart[] = ['Melgani', 'Passerini', 'Deep Learning']

export interface BankQuestion {
  /** 'mel-03', 'pas-07b', 'dl-29': parte, numero del resoconto nella fonte, lettera se il resoconto è diviso */
  id: string
  /** testo verbatim della banca, in inglese: il resoconto dello studente, da mostrare come "resoconto originale" */
  text: string
  /** la domanda in italiano (Markdown con KaTeX) */
  textIt: Rich
  /** la stessa domanda in inglese, in seconda persona, testo semplice: la riga EN delle schede */
  textEn: string
  prof: Prof
  part: BankPart
  /** fogli in cui sta la risposta, il principale per primo */
  moduleIds: string[]
  /** pagina del documento examq */
  page: number
  /** nota su un difetto o un'ambiguità della fonte */
  note?: string
}

export const examBank: BankQuestion[] = [
  // --- Melgani (con una domanda dell'assistente) ---
  {
    id: 'mel-01',
    text: 'Generalization Error (and then Empirical error): I told him the contest of the gen. error like the matrix  with the costs of each action and stuff. Regarding formulas, he asked me only the gen.error formula without the demonstration and he asked me to explain it. That was pretty much it.',
    textIt: "Errore di generalizzazione (e poi errore empirico): inquadralo nel suo contesto, con la matrice dei costi di ogni azione. Scrivi la formula dell'errore di generalizzazione, senza dimostrazione, e spiegala.",
    textEn: "Generalization error (and then empirical error): place it in its context, with the matrix of the costs of each action. Write the formula of the generalization error, without the proof, and explain it.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m21-errore-generalizzazione', 'm18-rischio-minimo'],
    page: 1,
  },
  {
    id: 'mel-02',
    text: 'Meanings of divergence measure and feature selection: He asked about feature selection and difference between extraction then we focused on divergence measure and Matusita distance and formulas. Then We talked about SFS and divergence matrix',
    textIt: "Significato delle misure di divergenza e selezione delle feature: che cos'è la selezione e in che cosa differisce dall'estrazione? Poi la divergenza e la distanza di Matusita, con le formule; infine la SFS e la matrice delle divergenze.",
    textEn: "Meaning of divergence measures and feature selection: what is feature selection and how does it differ from feature extraction? Then divergence and the Matusita distance, with their formulas; finally SFS and the divergence matrix.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m12-misure-separabilita', 'm11-hughes-feature-selection', 'm13-strategie-ricerca', 'm14-pca', 'm02-sistema-ml-design'],
    page: 1,
  },
  {
    id: 'mel-03',
    text: 'Parzen Window Estimation: context, properties etc. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Graphical representation of how the counting/interpolation works with  a couple of samples.',
    textIt: "Stima a finestre di Parzen: contesto e proprietà. Qual è la funzione finestra più comune (scrivi la formula)? Parzen è un buon stimatore (bias e varianza)? Mostra con un disegno come funzionano il conteggio e l'interpolazione con un paio di campioni.",
    textEn: "Parzen window estimation: context and properties. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias and variance)? Show with a drawing how counting and interpolation work with a couple of samples.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m09-parzen-windows', 'm08-non-parametrica-knn', 'm04-bonta-stimatori', 'm03-stima-intro-parametrica', 'm06-modelli-pdf-gaussiana', 'm10-em-dati-incompleti'],
    page: 1,
  },
  {
    id: 'mel-04',
    text: 'Design phase of an ML system, difference between supervised and unsupervised classification, some examples of loss functions (for regression), cross-validation (k-fold, leave-one-out), confusion matrix (two-class/multi-class, accuracy, precision, recall). What can we do when the model has low accuracy?',
    textIt: "Fasi di progetto di un sistema di ML; differenza tra classificazione supervisionata e non supervisionata; esempi di funzioni di *loss* per la regressione; *cross-validation* (k-fold, leave-one-out); matrice di confusione (a due classi e multiclasse, *accuracy*, *precision*, *recall*). Che cosa si può fare quando il modello ha un'accuratezza bassa?",
    textEn: "Design phases of an ML system; difference between supervised and unsupervised classification; examples of loss functions for regression; cross-validation (k-fold, leave-one-out); confusion matrix (two-class and multi-class, accuracy, precision, recall). What can you do when the model has low accuracy?",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m02-sistema-ml-design', 'm01-segnali-learning', 'm16-mdm-box', 'm21-errore-generalizzazione', 'm22-valutazione-accuratezza', 'm11-hughes-feature-selection', 'm03-stima-intro-parametrica'],
    page: 1,
  },
  {
    id: 'mel-05',
    text: 'K-NN estimation, how does it works, we draw a graph for example and asked how is the distribution, what does it mean overfit and oversmooth. Then he asked how the K-NN classifier works and made an example. Last question what are the difference with parzen window',
    textIt: 'Stima K-NN: come funziona? Disegna un grafico di esempio e descrivi la distribuzione; che cosa vogliono dire *overfit* e *oversmooth*? Come funziona il classificatore K-NN (con un esempio)? Infine: quali sono le differenze con le finestre di Parzen?',
    textEn: "K-NN estimation: how does it work? Draw an example graph and describe the distribution; what do overfitting and oversmoothing mean? How does the K-NN classifier work (with an example)? Finally: what are the differences with Parzen windows?",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m08-non-parametrica-knn', 'm16-mdm-box', 'm09-parzen-windows', 'm03-stima-intro-parametrica', 'm02-sistema-ml-design', 'm04-bonta-stimatori'],
    page: 1,
  },
  {
    id: 'mel-06',
    text: 'Asked me to explain PCA. When I started explaining he asked about covariance matrix, how it is created, what is cov matrix and etc. Then also some detailed questions about characteristic equation, eigenvalues/vectors. Lastly, main differences between sfs and pca.',
    textIt: "Spiega la PCA. La matrice di covarianza: che cos'è e come si costruisce? Poi domande di dettaglio sull'equazione caratteristica, sugli autovalori e sugli autovettori. Infine le differenze principali tra SFS e PCA.",
    textEn: "Explain PCA. The covariance matrix: what is it and how is it built? Then detailed questions on the characteristic equation, eigenvalues and eigenvectors. Finally, the main differences between SFS and PCA.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m14-pca', 'm06-modelli-pdf-gaussiana', 'm13-strategie-ricerca', 'm11-hughes-feature-selection', 'm05-max-likelihood'],
    page: 1,
  },
  {
    id: 'mel-07',
    text: 'What is an EM algorithm and how does it work? Explain formula and both steps. Then Multi Gaussian example for EM algorithm. KNN and KNN example.',
    textIt: "Che cos'è l'algoritmo EM e come funziona? Spiega la formula e i due passi, poi l'esempio della miscela di gaussiane. Infine il K-NN, con un esempio.",
    textEn: "What is the EM algorithm and how does it work? Explain the formula and both steps, then the Gaussian mixture example. Finally K-NN, with an example.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m10-em-dati-incompleti', 'm08-non-parametrica-knn', 'm16-mdm-box', 'm06-modelli-pdf-gaussiana'],
    page: 1,
  },
  {
    id: 'mel-08',
    text: 'How does the Minimum risk criterium work, comparison with MAP and ML classification. Which is the best one (minimum risk). He also asked me the formula of the Gaussian curve in a multi dimensional space (with mean vector and covariance matrix).',
    textIt: 'Come funziona il criterio del rischio minimo? Confrontalo con la classificazione MAP e ML: qual è il migliore (il rischio minimo)? Scrivi anche la gaussiana in più dimensioni, con il vettore delle medie e la matrice di covarianza.',
    textEn: "How does the minimum risk criterion work? Compare it with MAP and ML classification: which one is the best (minimum risk)? Also write the multivariate Gaussian, with the mean vector and the covariance matrix.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m18-rischio-minimo', 'm17-bayes-map-ml', 'm06-modelli-pdf-gaussiana', 'm05-max-likelihood', 'm10-em-dati-incompleti'],
    page: 1,
  },
  {
    id: 'mel-09',
    text: 'What is the formula of Maximum Likelihood, why we can use the separate products of the probabilities and what the Likelihood describe. How we can describe the goodness of an estimation and Is Maximum Likelihood Estimation a good estimator? Is it better or not with respect to the Bayesian Estimation? Why? Then he asked me to apply Maximum Likelihood estimation on an exercise. Last question was: In which case ML and Bayesian are the same?',
    textIt: 'Scrivi la formula della massima verosimiglianza: perché si può usare il prodotto delle singole probabilità e che cosa descrive la verosimiglianza? Come si misura la bontà di una stima? La stima ML è un buon stimatore? È migliore o no della stima bayesiana, e perché? Poi applica la stima ML a un esercizio. Ultima domanda: in quale caso ML e stima bayesiana coincidono?',
    textEn: "Write the maximum likelihood formula: why can you use the product of the individual probabilities, and what does the likelihood describe? How do you measure the goodness of an estimate? Is the ML estimate a good estimator? Is it better than Bayesian estimation or not, and why? Then apply ML estimation to an exercise. Last question: in which case do ML and Bayesian estimation coincide?",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m05-max-likelihood', 'm03-stima-intro-parametrica', 'm04-bonta-stimatori', 'm07-stima-bayesiana', 'm06-modelli-pdf-gaussiana', 'm08-non-parametrica-knn', 'm10-em-dati-incompleti'],
    page: 1,
  },
  {
    id: 'mel-10',
    text: 'Parzen Windows: general context (what we want to do, why they are non parametric estimation), gaussian kernel with spherical symmetry with formula and some drawing to represent it, How the choice of the width impacts our estimate? Is it a good estimate? (Bias, variance and consideration about the characteristics of the width to have a consistent estimate)',
    textIt: 'Finestre di Parzen: contesto generale (che cosa vogliamo fare, perché è una stima non parametrica), kernel gaussiano a simmetria sferica con formula e disegno, effetto della scelta della larghezza sulla stima. È una buona stima? (Bias, varianza e condizioni sulla larghezza per avere una stima consistente.)',
    textEn: "Parzen windows: general context (what the goal is, why it is a non-parametric estimation), the spherically symmetric Gaussian kernel with formula and drawing, and the effect of the window width on the estimate. Is it a good estimate? (Bias, variance and the conditions on the width for a consistent estimate.)",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m09-parzen-windows', 'm08-non-parametrica-knn', 'm04-bonta-stimatori', 'm03-stima-intro-parametrica', 'm06-modelli-pdf-gaussiana', 'm10-em-dati-incompleti'],
    page: 2,
  },
  {
    id: 'mel-11',
    text: 'MAP criterion: comparison and main differences between ML. Example of how priors change the threshold compared to ML criterion. Proof of MAP as error minimization. At the end of the day is better MAP or ML and why? Why MAP could not be the best one? (Linked to approximation error)',
    textIt: "Criterio MAP: confronto e differenze principali con il criterio ML. Mostra con un esempio come le probabilità a priori spostano la soglia rispetto al ML. Dimostra che il MAP minimizza l'errore. Alla fine è meglio il MAP o il ML, e perché? Perché il MAP potrebbe non essere il migliore? (È legato all'errore di approssimazione.)",
    textEn: "MAP criterion: comparison and main differences with the ML criterion. Show with an example how the priors shift the threshold with respect to ML. Prove that MAP minimizes the error. In the end, is MAP or ML better, and why? Why might MAP not be the best? (It is linked to the approximation error.)",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m17-bayes-map-ml', 'm21-errore-generalizzazione', 'm03-stima-intro-parametrica'],
    page: 2,
  },
  {
    id: 'mel-12',
    text: 'Asked me about feature selection. While talking about different separability measures he wanted to know in depth about Jeffrey-Matusita, the formula and its graphical meaning, how to compute it when we have 3 classes (average) and how it can be expressed as the Bhattacharyya distance (he only wanted the final result,not the full demonstration). Then we talked about search strategies (both SFS and SBS), and if the result of SFS and SBS can be the same.',
    textIt: 'Selezione delle feature. Fra le misure di separabilità, la distanza di Jeffries-Matusita in dettaglio: formula e significato grafico, come si calcola con 3 classi (media) e come si esprime con la distanza di Bhattacharyya (solo il risultato finale, non la dimostrazione). Poi le strategie di ricerca, SFS e SBS: possono dare lo stesso risultato?',
    textEn: "Feature selection. Among the separability measures, the Jeffries-Matusita distance in detail: formula and graphical meaning, how to compute it with 3 classes (average) and how to express it through the Bhattacharyya distance (only the final result, not the proof). Then the search strategies, SFS and SBS: can they give the same result?",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m12-misure-separabilita', 'm13-strategie-ricerca', 'm11-hughes-feature-selection'],
    page: 2,
  },
  {
    id: 'mel-13',
    text: 'LDA: what is it? Is it a supervised method or unsupervised method? Is PCA supervised or unsupervised? Define the principal formulas. Specify if the means in the formula are projections of means of classes or means of the projection of points on the chosen direction: are these two objects the same? Make clear the dependence of the formula on projection direction, also by defining scatter matrices (and what characteristics of the data do these represent?). How changes the framework with multiple classes and what do the C-1 eigenvectors found represent? Write the solution for the binary classification case. Finally, he asked me to make a graphical example in a 2D feature space where PCA and LDA produced a much equivalent result, and one where the result was much different (similar to the one on slides).',
    textIt: md`LDA: che cos'è? È un metodo supervisionato o non supervisionato? E la PCA? Scrivi le formule principali. Le medie nella formula sono le proiezioni delle medie delle classi o le medie delle proiezioni dei punti sulla direzione scelta: sono la stessa cosa? Rendi esplicita la dipendenza della formula dalla direzione di proiezione, anche definendo le matrici di *scatter* (quali caratteristiche dei dati rappresentano?). Come cambia il quadro con più classi e che cosa rappresentano i $C-1$ autovettori trovati? Scrivi la soluzione nel caso binario. Infine disegna un esempio in uno spazio 2D in cui PCA e LDA danno quasi lo stesso risultato e uno in cui danno risultati molto diversi (come quello delle slide).`,
    textEn: "LDA: what is it? Is it a supervised or an unsupervised method? And PCA? Write the main formulas. Are the means in the formula the projections of the class means or the means of the points projected on the chosen direction: are they the same thing? Make the dependence of the formula on the projection direction explicit, also by defining the scatter matrices (which characteristics of the data do they represent?). How does the framework change with more classes, and what do the C − 1 eigenvectors represent? Write the solution for the binary case. Finally, draw an example in a 2D feature space where PCA and LDA give almost the same result and one where they give very different results (like the one in the slides).",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m15-lda', 'm14-pca', 'm01-segnali-learning', 'm11-hughes-feature-selection', 'm16-mdm-box'],
    page: 2,
  },
  {
    id: 'mel-14a',
    text: 'Generalization error (Approximation error - Estimation error) - (Trained machine) - Target space/ hypothesis space - Empirical risk',
    textIt: 'Errore di generalizzazione (errore di approssimazione ed errore di stima), la macchina addestrata, spazio obiettivo e spazio delle ipotesi, rischio empirico.',
    textEn: "Generalization error (approximation error and estimation error), the trained machine, target space and hypothesis space, empirical risk.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m21-errore-generalizzazione', 'm02-sistema-ml-design', 'm04-bonta-stimatori'],
    page: 2,
  },
  {
    id: 'mel-14b',
    text: 'Loss function (correlation coefficient - MSE - RMSE-absolute error)',
    textIt: 'Funzioni di *loss*: coefficiente di correlazione, MSE, RMSE, errore assoluto.',
    textEn: "Loss functions: correlation coefficient, MSE, RMSE, absolute error.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m21-errore-generalizzazione', 'm02-sistema-ml-design', 'm04-bonta-stimatori'],
    page: 2,
  },
  {
    id: 'mel-14c',
    text: 'Cross validation (exhaustive / non-exhaustive(k-fold) /nested(kxl))',
    textIt: md`*Cross-validation*: esaustiva, non esaustiva (k-fold), annidata ($k \times l$).`,
    textEn: "Cross-validation: exhaustive, non-exhaustive (k-fold), nested (k × l).",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m21-errore-generalizzazione'],
    page: 2,
  },
  {
    id: 'mel-14d',
    text: 'matrix (binary and multi-class classifiers)  + examples + common derivations (accuracy/precision/sensitivity/f-one-score) + graphical  explanation',
    textIt: 'Matrice di confusione (classificatori binari e multiclasse), con esempi, le misure che se ne ricavano (*accuracy*, *precision*, *sensitivity*, *F1-score*) e la loro spiegazione grafica.',
    textEn: "Confusion matrix (binary and multi-class classifiers), with examples, the measures derived from it (accuracy, precision, sensitivity, F1-score) and their graphical explanation.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m22-valutazione-accuratezza'],
    page: 2,
    note: 'Nella fonte la riga comincia con «matrix»: si parla della matrice di confusione (confusion matrix).',
  },
  {
    id: 'mel-14e',
    text: 'ROC + graphical explanation - examples - AUC',
    textIt: 'Curva ROC: spiegazione grafica, esempi, AUC.',
    textEn: "ROC curve: graphical explanation, examples, AUC.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m22-valutazione-accuratezza'],
    page: 2,
  },
  {
    id: 'mel-15',
    text: 'Block scheme/Design phases of an ML system, describe all the blocks and phases with examples (in particular at the beginning of data acquisition and feature extraction, which is the best feature in terms of discrimination, cit. of LDA). Then speaking about the selection (cit. of overfitting), the training and the evaluation of the model (cit. of k-fold), we reach the probabilities regarding the binary classifier  (cit. of MAP). At the end, what can we do when the model has low accuracy or in general if a final user wants to reduce the probability of false alarm and the probability of missed alarm?',
    textIt: "Schema a blocchi e fasi di progetto di un sistema di ML: descrivi tutti i blocchi e le fasi con esempi (in particolare acquisizione dei dati ed estrazione delle feature: qual è la feature migliore per discriminare, cenno alla LDA). Poi la selezione (cenno all'*overfitting*), l'addestramento e la valutazione del modello (cenno al k-fold), fino alle probabilità del classificatore binario (cenno al MAP). Infine: che cosa si può fare quando il modello ha un'accuratezza bassa, o se l'utente finale vuole ridurre la probabilità di falso allarme e quella di mancato allarme?",
    textEn: "Block scheme and design phases of an ML system: describe all the blocks and phases with examples (in particular data acquisition and feature extraction: which feature discriminates best, a mention of LDA). Then selection (a mention of overfitting), training and evaluation of the model (a mention of k-fold), up to the probabilities of the binary classifier (a mention of MAP). Finally: what can you do when the model has low accuracy, or when the end user wants to reduce the probability of false alarm and that of missed alarm?",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m02-sistema-ml-design', 'm15-lda', 'm21-errore-generalizzazione', 'm17-bayes-map-ml', 'm18-rischio-minimo', 'm22-valutazione-accuratezza', 'm11-hughes-feature-selection', 'm14-pca', 'm01-segnali-learning', 'm03-stima-intro-parametrica', 'm05-max-likelihood', 'm16-mdm-box'],
    page: 2,
  },
  {
    id: 'mel-16',
    text: 'Feature reduction, Huges effect and Huges graph. Fast geometrical explanation of the curse of dimensionality.',
    textIt: 'Riduzione delle feature, effetto di Hughes e il suo grafico. Spiegazione geometrica rapida della maledizione della dimensionalità (*curse of dimensionality*).',
    textEn: "Feature reduction, the Hughes effect and its graph. A quick geometric explanation of the curse of dimensionality.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m11-hughes-feature-selection', 'm08-non-parametrica-knn', 'm02-sistema-ml-design'],
    page: 2,
  },
  {
    id: 'mel-17',
    text: 'LDA: What is it? Definition of between-class distance and within-class distance. Definition of best case for two distributions, following the two criteria (Compact classes (as impulses) distant one from the other). Formula for Fisher Linear Discriminant, both with distances and Scatter Matrices. Which is the formula for the w maximizing the Generalized Rayleigh ratio? Citation of LDA in multiclass case. When are the results of LDA and PCA the same?',
    textIt: md`LDA: che cos'è? Definisci la distanza fra le classi e quella dentro le classi. Qual è il caso migliore per due distribuzioni secondo i due criteri (classi compatte, come impulsi, e lontane tra loro)? Scrivi il discriminante lineare di Fisher, sia con le distanze sia con le matrici di *scatter*. Qual è il $\mathbf{w}$ che massimizza il quoziente di Rayleigh generalizzato? Un cenno alla LDA multiclasse. Quando LDA e PCA danno lo stesso risultato?`,
    textEn: "LDA: what is it? Define the between-class and the within-class distance. What is the best case for two distributions according to the two criteria (compact classes, like impulses, far from each other)? Write the Fisher linear discriminant, both with the distances and with the scatter matrices. Which w maximizes the generalized Rayleigh quotient? A mention of multi-class LDA. When do LDA and PCA give the same result?",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m15-lda', 'm14-pca'],
    page: 2,
  },
  {
    id: 'mel-18',
    text: 'Explain non-parametric estimation, what non-parametric means and why we use it, explain both KNN and Parzen windows, do they tend to the optimal solution? Explain ML estimation, develop the first derivative for a gaussian and explain the meaning of the result. Explain box classifier',
    textIt: 'Spiega la stima non parametrica: che cosa significa e perché si usa. Spiega K-NN e finestre di Parzen: tendono alla soluzione ottima? Poi la stima ML: sviluppa la derivata prima per una gaussiana e spiega il significato del risultato. Infine il *box classifier*.',
    textEn: "Explain non-parametric estimation: what it means and why it is used. Explain K-NN and Parzen windows: do they tend to the optimal solution? Then ML estimation: develop the first derivative for a Gaussian and explain the meaning of the result. Finally the box classifier.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m08-non-parametrica-knn', 'm09-parzen-windows', 'm05-max-likelihood', 'm16-mdm-box', 'm04-bonta-stimatori', 'm06-modelli-pdf-gaussiana', 'm03-stima-intro-parametrica', 'm07-stima-bayesiana', 'm10-em-dati-incompleti'],
    page: 2,
  },
  {
    id: 'mel-19',
    text: 'Discuss minimum risk theory (with all formulas of MAP and ML too) + discuss ROC curves',
    textIt: 'Discuti la teoria del rischio minimo (con tutte le formule, anche quelle di MAP e ML) e le curve ROC.',
    textEn: "Discuss minimum risk theory (with all the formulas, including those of MAP and ML) and ROC curves.",
    prof: 'Melgani',
    part: 'Melgani',
    moduleIds: ['m18-rischio-minimo', 'm17-bayes-map-ml', 'm22-valutazione-accuratezza'],
    page: 3,
  },
  {
    id: 'mel-20',
    text: '(Assistant) “Minimum risk theory: tell me about it.” I explained the general concept and then i drew the table of α1,α2... ω1,ω2... λ(α1|ωi) ecc with the example of the fire and the call to firefighters. He stopped me here and asked me what is, given this table, the rule we use to choose an action (R(α1)><R(α2)  → p(α1|x)/p(α2|x)><...) and to write it passing through the demonstration if i wanted. Then “What happens if the risks are unknown or equal?” (we have the MAP criterion). Then he asked me what is the ROC curve.',
    textIt: md`(Assistente) «Teoria del rischio minimo: me ne parli.» Il concetto generale, poi la tabella delle azioni $\alpha_1, \alpha_2, \dots$, delle classi $\omega_1, \omega_2, \dots$ e dei costi $\lambda(\alpha_i \mid \omega_j)$, con l'esempio dell'incendio e della chiamata ai pompieri. Data la tabella, qual è la regola per scegliere un'azione ($R(\alpha_1) \gtrless R(\alpha_2)$, riscritta come confronto fra probabilità a posteriori)? Scrivila, con la dimostrazione se vuoi. Che cosa succede se i costi sono ignoti o tutti uguali (si ottiene il criterio MAP)? Infine: che cos'è la curva ROC?`,
    textEn: "(Assistant) “Minimum risk theory: tell me about it.” The general concept, then the table of actions α1, α2, …, classes ω1, ω2, … and costs λ(αi | ωj), with the example of the fire and the call to the firefighters. Given the table, what is the rule for choosing an action (R(α1) ≷ R(α2), rewritten as a comparison of posterior probabilities)? Write it, with the proof if you wish. What happens if the costs are unknown or all equal (you get the MAP criterion)? Finally: what is the ROC curve?",
    prof: 'Assistant',
    part: 'Melgani',
    moduleIds: ['m18-rischio-minimo', 'm17-bayes-map-ml', 'm22-valutazione-accuratezza'],
    page: 3,
  },

  // --- Passerini ---
  {
    id: 'pas-01',
    text: 'Linear functions for both classification and regression: discriminant functions, classification concept, functional/geometric margin, perceptron, loss function for classification, gradient descent, regression, matrix inversion problem, pseudoinverse, loss function for regression.',
    textIt: "Funzioni lineari per la classificazione e per la regressione: funzioni discriminanti, il concetto di classificazione, margine funzionale e geometrico, perceptron, funzione di *loss* per la classificazione, discesa del gradiente, regressione, il problema dell'inversione della matrice, pseudoinversa, funzione di *loss* per la regressione.",
    textEn: "Linear functions for classification and regression: discriminant functions, the concept of classification, functional and geometric margin, perceptron, loss function for classification, gradient descent, regression, the matrix inversion problem, pseudoinverse, loss function for regression.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p06-discriminanti-perceptron', 'p07-regressione-multiclasse'],
    page: 3,
  },
  {
    id: 'pas-02',
    text: 'Bayesian networks: formalization (DAG, local independencies, various case of d-separation criterion, general d-separation criterion and global independencies) and learning of the parameters (ML with complete data, MAP with prior knowledge, EM with incomplete data)',
    textIt: 'Reti bayesiane: formalizzazione (DAG, indipendenze locali, i vari casi del criterio di d-separazione, criterio generale di d-separazione e indipendenze globali) e apprendimento dei parametri (ML con dati completi, MAP con conoscenza a priori, EM con dati incompleti).',
    textEn: "Bayesian networks: formalization (DAG, local independencies, the cases of the d-separation criterion, the general d-separation criterion and global independencies) and parameter learning (ML with complete data, MAP with prior knowledge, EM with incomplete data).",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p03-reti-bayesiane', 'p04-d-separazione', 'p05-apprendimento-reti', 'm10-em-dati-incompleti', 'm03-stima-intro-parametrica', 'm05-max-likelihood', 'm07-stima-bayesiana'],
    page: 3,
  },
  {
    id: 'pas-03',
    text: 'Reinforcement learning: general concepts, Bellman equations, algorithms for learning only the policy and for learning the policy along with the environment',
    textIt: "*Reinforcement learning*: concetti generali, equazioni di Bellman, algoritmi che apprendono solo la politica e algoritmi che apprendono la politica insieme all'ambiente.",
    textEn: "Reinforcement learning: general concepts, Bellman equations, algorithms that learn only the policy and algorithms that learn the policy together with the environment.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p13-rl-mdp', 'p14-rl-apprendimento', 'm01-segnali-learning'],
    page: 3,
  },
  {
    id: 'pas-04',
    text: 'Unsupervised learning: entire chapter',
    textIt: 'Apprendimento non supervisionato: tutto il capitolo.',
    textEn: "Unsupervised learning: the whole chapter.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p12-clustering', 'm10-em-dati-incompleti', 'm01-segnali-learning'],
    page: 3,
  },
  {
    id: 'pas-05',
    text: 'Kernels and kernel machines: entire chapter and link to the dual problem, write the dual derivation and show that features appears only in dot products',
    textIt: 'Kernel e *kernel machines*: tutto il capitolo e il legame con il problema duale. Scrivi la derivazione del duale e mostra che le feature compaiono solo nei prodotti scalari.',
    textEn: "Kernels and kernel machines: the whole chapter and the link with the dual problem. Write the derivation of the dual and show that the features appear only in dot products.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p10-kernel-trick', 'p11-kernel-machines', 'p08-svm-hard-margin'],
    page: 3,
  },
  {
    id: 'pas-06',
    text: 'Perceptron for classification and regression: entire chapter with proofs, feature mapping and kernel perceptron',
    textIt: 'Perceptron per la classificazione e per la regressione: tutto il capitolo con le dimostrazioni, la *feature mapping* e il *kernel perceptron*.',
    textEn: "Perceptron for classification and regression: the whole chapter with the proofs, feature mapping and the kernel perceptron.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p06-discriminanti-perceptron', 'p07-regressione-multiclasse', 'p10-kernel-trick', 'p11-kernel-machines'],
    page: 3,
  },
  {
    id: 'pas-07a',
    text: 'Non-linear SVM and Kernel machines. Concept of feature map, example (homogeneous polynomial map), revisiting soft-margin SVM using feature maps, SVR definition and proof for Non-Linear soft margin SVM for classification, advantages of using feature maps; question: rule of constant C in soft-margin SVM (what happens if C=0 and if C->+infinity).',
    textIt: md`SVM non lineari e *kernel machines*. Il concetto di *feature map*, un esempio (la mappa polinomiale omogenea), la SVM a margine morbido rivista con le *feature map*, la definizione di SVR e la dimostrazione per la SVM non lineare a margine morbido in classificazione, i vantaggi delle *feature map*. Domanda: il ruolo della costante $C$ nella SVM a margine morbido (che cosa succede con $C = 0$ e con $C \to +\infty$)?`,
    textEn: "Non-linear SVMs and kernel machines. The concept of feature map, an example (the homogeneous polynomial map), the soft-margin SVM revisited with feature maps, the definition of SVR and the proof for the non-linear soft-margin SVM in classification, the advantages of feature maps. Question: the role of the constant C in the soft-margin SVM (what happens with C = 0 and with C → +∞)?",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p11-kernel-machines', 'p10-kernel-trick', 'p09-svm-soft-margin'],
    page: 3,
  },
  {
    id: 'pas-07b',
    text: 'Kernel machines, how kernels are related to feature maps, similarity with dot product, example (equivalence between homogeneous polynomial feature map and homogeneous polynomial kernel), definition of valid kernels and positive definite matrices, reason behind validity-preserving operators, list of operators (with examples), using kernels on non-vectorized objects: Spectrum Kernel for strings and WL-Kernel for graphs (just a quick explanation, no analysis of WL-Test).',
    textIt: "*Kernel machines*: come i kernel si legano alle *feature map*, l'analogia con il prodotto scalare, un esempio (equivalenza fra *feature map* polinomiale omogenea e kernel polinomiale omogeneo), definizione di kernel valido e di matrice definita positiva, perché certe operazioni conservano la validità, l'elenco delle operazioni (con esempi), i kernel su oggetti non vettoriali: lo *spectrum kernel* per le stringhe e il kernel WL per i grafi (solo una spiegazione rapida, senza analisi del test WL).",
    textEn: "Kernel machines: how kernels relate to feature maps, the analogy with the dot product, an example (equivalence between the homogeneous polynomial feature map and the homogeneous polynomial kernel), the definition of a valid kernel and of a positive definite matrix, why some operations preserve validity, the list of operations (with examples), kernels on non-vectorial objects: the spectrum kernel for strings and the WL kernel for graphs (only a quick explanation, no analysis of the WL test).",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p10-kernel-trick', 'p11-kernel-machines'],
    page: 3,
  },
  {
    id: 'pas-08',
    text: 'Learning Parameters  (ML with complete data, MAP), SVM (Hard Margin, Lagrangian, Soft Margin), NonLinear,  Kernel Machine, Perceptron)',
    textIt: 'Apprendimento dei parametri (ML con dati completi, MAP), SVM (margine rigido, lagrangiana, margine morbido), il caso non lineare, le *kernel machines*, il perceptron.',
    textEn: "Parameter learning (ML with complete data, MAP), SVM (hard margin, Lagrangian, soft margin), the non-linear case, kernel machines, the perceptron.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p05-apprendimento-reti', 'p01-stima-parametri', 'p08-svm-hard-margin', 'p09-svm-soft-margin', 'p10-kernel-trick', 'p11-kernel-machines', 'p06-discriminanti-perceptron', 'm05-max-likelihood'],
    page: 3,
  },
  {
    id: 'pas-09',
    text: 'Non-linear machines (non-linear SVM, SV regression, kernel machines)',
    textIt: 'Macchine non lineari: SVM non lineare, *SV regression*, *kernel machines*.',
    textEn: "Non-linear machines: non-linear SVM, SV regression, kernel machines.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p11-kernel-machines', 'p10-kernel-trick', 'p09-svm-soft-margin'],
    page: 3,
  },
  {
    id: 'pas-10',
    text: 'SVM (when should we opt for primal or dual formulation)',
    textIt: 'SVM: quando conviene la formulazione primale e quando la duale?',
    textEn: "SVM: when is the primal formulation preferable, and when the dual?",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p08-svm-hard-margin', 'p09-svm-soft-margin', 'p10-kernel-trick'],
    page: 4,
  },
  {
    id: 'pas-11',
    text: 'Unsupervised learning (everything I knew) + gaussian kernel related to gaussian distance (he said something during lessons, nothing in slides about that). During the oral part he asked me to explain better the mechanism of EM used for gaussian mixture and to explain the result then he asked me what are kernels and when we use them',
    textIt: "Apprendimento non supervisionato (tutto quello che sai), più il legame fra kernel gaussiano e distanza gaussiana (detto a lezione, non c'è nelle slide). All'orale: spiega meglio il meccanismo dell'EM per la miscela di gaussiane e il suo risultato; poi, che cosa sono i kernel e quando si usano?",
    textEn: "Unsupervised learning (everything you know), plus the link between the Gaussian kernel and the Gaussian distance (mentioned in class, not in the slides). At the oral: explain in more depth the mechanism of EM for the Gaussian mixture and its result; then, what are kernels and when are they used?",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p12-clustering', 'm10-em-dati-incompleti', 'p10-kernel-trick', 'p11-kernel-machines', 'm06-modelli-pdf-gaussiana', 'm01-segnali-learning'],
    page: 4,
  },
  {
    id: 'pas-12',
    text: "He asked me to formulaize everything about linear regression for perceptron and linear classification for perceptron and svm. I wrote all the equations till i reached the soft case for svm so i stopped as i took too much time. He did not ask me any questions and that's all",
    textIt: 'Scrivi in formule tutto sulla regressione lineare con il perceptron e sulla classificazione lineare con perceptron e SVM. (Lo studente è arrivato fino alla SVM a margine morbido e si è fermato per il tempo; nessuna domanda dopo.)',
    textEn: "Write in formulas everything about linear regression with the perceptron and linear classification with the perceptron and SVM. (The student got as far as the soft-margin SVM and stopped for lack of time; no questions afterwards.)",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p06-discriminanti-perceptron', 'p07-regressione-multiclasse', 'p08-svm-hard-margin', 'p09-svm-soft-margin'],
    page: 4,
  },
  {
    id: 'pas-13',
    text: 'asked to talk about linear models and during the oral he asked me to explain what I wrote',
    textIt: "Parla dei modelli lineari; all'orale spiega quello che hai scritto.",
    textEn: "Talk about linear models; at the oral, explain what you wrote.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p06-discriminanti-perceptron', 'p07-regressione-multiclasse'],
    page: 4,
  },
  {
    id: 'pas-14',
    text: 'Linear Classifiers. Questions: (1) when do we use (and why) primal or dual (2) meaning of adapting learning rate',
    textIt: 'Classificatori lineari. Domande: (1) quando si usa il primale e quando il duale, e perché? (2) Che significato ha adattare il *learning rate*?',
    textEn: "Linear classifiers. Questions: (1) when do you use the primal and when the dual, and why? (2) What does adapting the learning rate mean?",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p06-discriminanti-perceptron', 'p08-svm-hard-margin', 'p09-svm-soft-margin'],
    page: 4,
  },
  {
    id: 'pas-15a',
    text: 'soft SVM Q: why do we use kkt approach and why can we say that the solutions of primal and dual formulations are the same?',
    textIt: "SVM a margine morbido. Domanda: perché si usa l'approccio KKT e perché si può dire che le soluzioni del primale e del duale coincidono?",
    textEn: "Soft-margin SVM. Question: why is the KKT approach used, and why can you say that the solutions of the primal and of the dual coincide?",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p09-svm-soft-margin', 'p08-svm-hard-margin'],
    page: 4,
  },
  {
    id: 'pas-15b',
    text: "Unsupervised learning Q: what's the formula of the EM-algo, M-step for the Gaussian mixture model (because I wrote the e step formula but not the m step one)",
    textIt: "Apprendimento non supervisionato. Domanda: qual è la formula dell'algoritmo EM, in particolare il passo M per la miscela di gaussiane? (Lo studente aveva scritto il passo E ma non il passo M.)",
    textEn: "Unsupervised learning. Question: what is the formula of the EM algorithm, in particular the M-step for the Gaussian mixture? (The student had written the E-step but not the M-step.)",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p12-clustering', 'm10-em-dati-incompleti', 'm06-modelli-pdf-gaussiana'],
    page: 4,
  },
  {
    id: 'pas-16',
    text: 'Unsupervised learning (everything I knew) + scheme of a perceptron and regression for perceptron',
    textIt: 'Apprendimento non supervisionato (tutto quello che sai), più lo schema del perceptron e la regressione con il perceptron.',
    textEn: "Unsupervised learning (everything you know), plus the scheme of the perceptron and regression with the perceptron.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p12-clustering', 'p06-discriminanti-perceptron', 'p07-regressione-multiclasse'],
    page: 4,
  },
  {
    id: 'pas-17',
    text: 'Hard or soft margin svm (choose one) + Learning bayesian network. Questions afterwards: canonical hyperplane, why do we use kkt, why solution of dual is equal to primal, disjoint cpd in BN, explain E-M in BN',
    textIt: "SVM a margine rigido o morbido (a scelta), più l'apprendimento nelle reti bayesiane. Domande dopo: l'iperpiano canonico, perché si usano le KKT, perché la soluzione del duale coincide con quella del primale, le CPD disgiunte nelle reti bayesiane, l'EM nelle reti bayesiane.",
    textEn: "Hard- or soft-margin SVM (your choice), plus learning in Bayesian networks. Follow-up questions: the canonical hyperplane, why KKT conditions are used, why the dual solution coincides with the primal one, disjoint CPDs in Bayesian networks, EM in Bayesian networks.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p08-svm-hard-margin', 'p09-svm-soft-margin', 'p05-apprendimento-reti', 'm10-em-dati-incompleti'],
    page: 4,
  },
  {
    id: 'pas-18',
    text: 'Reinforcement learning in a known environment. Be extremely careful with the cost of Bellman equation outside and inside the algorithm, difference between the arrow <- and equal = in his algorithms',
    textIt: md`*Reinforcement learning* con ambiente noto. Attenzione al costo dell'equazione di Bellman fuori e dentro l'algoritmo, e alla differenza fra la freccia $\leftarrow$ e l'uguale $=$ nei suoi algoritmi.`,
    textEn: "Reinforcement learning with a known environment. Pay attention to the cost of the Bellman equation outside and inside the algorithm, and to the difference between the arrow ← and the equals sign = in its algorithms.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p13-rl-mdp', 'p14-rl-apprendimento', 'm01-segnali-learning'],
    page: 4,
  },
  {
    id: 'pas-19',
    text: 'Kernel machines + Bayesian networks  Question: how can you demonstrate that a kernel is valid? Is it easy to demonstrate that a kernel is positive definite?',
    textIt: '*Kernel machines* e reti bayesiane. Domanda: come si dimostra che un kernel è valido? È facile dimostrare che un kernel è definito positivo?',
    textEn: "Kernel machines and Bayesian networks. Question: how do you prove that a kernel is valid? Is it easy to prove that a kernel is positive definite?",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p10-kernel-trick', 'p11-kernel-machines', 'p03-reti-bayesiane', 'p04-d-separazione', 'p05-apprendimento-reti'],
    page: 4,
  },
  {
    id: 'pas-20',
    text: 'Regression (perceptron + svm) + a tricky question on the pseudoinverse and in which topic it is used and how. He wanted me to talk about principal component analysis',
    textIt: 'Regressione (perceptron e SVM), più una domanda insidiosa sulla pseudoinversa: in quale argomento si usa, e come? Poi la PCA (analisi delle componenti principali).',
    textEn: "Regression (perceptron and SVM), plus a tricky question on the pseudoinverse: in which topic is it used, and how? Then PCA (principal component analysis).",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p07-regressione-multiclasse', 'p11-kernel-machines', 'm14-pca'],
    page: 4,
  },
  {
    id: 'pas-21',
    text: 'Perceptron (All) + Parameter estimation Questions: - Problem with analytical solution for perceptron regression - Example of estimation of Gaussian parameters: why do we obtain a Gaussian also as posterior? - How to use parameter estimation in Bayesian Networks - Why ML is fast in Bayesian Network (CDP independence) - Problem of missing data in Bayesian Networks',
    textIt: 'Perceptron (tutto) e stima dei parametri. Domande: il problema della soluzione analitica per la regressione con il perceptron; esempio di stima dei parametri di una gaussiana: perché anche la posteriori è gaussiana? Come si usa la stima dei parametri nelle reti bayesiane? Perché la stima ML è veloce nelle reti bayesiane (indipendenza delle CPD)? Il problema dei dati mancanti nelle reti bayesiane.',
    textEn: "Perceptron (all of it) and parameter estimation. Questions: the problem of the analytical solution for regression with the perceptron; the example of estimating the parameters of a Gaussian: why is the posterior Gaussian too? How is parameter estimation used in Bayesian networks? Why is ML estimation fast in Bayesian networks (independence of the CPDs)? The problem of missing data in Bayesian networks.",
    prof: 'Passerini',
    part: 'Passerini',
    moduleIds: ['p06-discriminanti-perceptron', 'p07-regressione-multiclasse', 'p01-stima-parametri', 'p05-apprendimento-reti', 'm07-stima-bayesiana', 'm05-max-likelihood', 'm10-em-dati-incompleti', 'm03-stima-intro-parametrica', 'm04-bonta-stimatori', 'm06-modelli-pdf-gaussiana'],
    page: 4,
  },

  // --- Deep Learning (Ricci): elenco numerato 1-41, il 42 è vuoto nella fonte ---
  {
    id: 'dl-01',
    text: 'Weight Decay',
    textIt: 'Il *weight decay*.',
    textEn: "Weight decay.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d04-regolarizzazione'],
    page: 5,
  },
  {
    id: 'dl-02',
    text: 'L1 regularization',
    textIt: 'La regolarizzazione L1.',
    textEn: "L1 regularization.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d04-regolarizzazione'],
    page: 5,
  },
  {
    id: 'dl-03',
    text: 'L2 regularization',
    textIt: 'La regolarizzazione L2.',
    textEn: "L2 regularization.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d04-regolarizzazione'],
    page: 5,
  },
  {
    id: 'dl-04',
    text: 'what is momentum, write down in formula what is alpha,epsilon',
    textIt: md`Che cos'è il *momentum*? Scrivi la formula e spiega che cosa sono $\alpha$ ed $\epsilon$.`,
    textEn: "What is momentum? Write the formula and explain what α and ε are.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d03-ottimizzazione'],
    page: 5,
  },
  {
    id: 'dl-05',
    text: 'Activation function and their diagram along with explanation all which we studied',
    textIt: 'Le funzioni di attivazione studiate: di ognuna il grafico e la spiegazione.',
    textEn: "The activation functions you studied: for each one, its graph and an explanation.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d01-reti-feedforward'],
    page: 5,
  },
  {
    id: 'dl-06',
    text: 'Update wight decay formula and explanation',
    textIt: "La formula dell'aggiornamento con *weight decay*, con la spiegazione.",
    textEn: "The weight decay update formula, with its explanation.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d04-regolarizzazione'],
    page: 5,
  },
  {
    id: 'dl-07',
    text: 'Regularization formula and explanation',
    textIt: 'La formula della regolarizzazione, con la spiegazione.',
    textEn: "The regularization formula, with its explanation.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d04-regolarizzazione'],
    page: 5,
  },
  {
    id: 'dl-08',
    text: 'Empirical loss formula and explanation',
    textIt: 'La formula della *loss* empirica, con la spiegazione.',
    textEn: "The empirical loss formula, with its explanation.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d01-reti-feedforward', 'd02-backpropagation'],
    page: 5,
  },
  {
    id: 'dl-09',
    text: 'Difference between Momentum and gradient descent',
    textIt: 'Differenza fra *momentum* e discesa del gradiente.',
    textEn: "Difference between momentum and gradient descent.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d03-ottimizzazione'],
    page: 5,
  },
  {
    id: 'dl-10',
    text: 'Softmax unit',
    textIt: "L'unità *softmax*.",
    textEn: "The softmax unit.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d01-reti-feedforward'],
    page: 5,
  },
  {
    id: 'dl-11',
    text: 'Difference between batch normalization and layer normalization,write down and how do we compute sigma based on formula',
    textIt: md`Differenza fra *batch normalization* e *layer normalization*: scrivile e mostra come si calcola $\sigma$ dalla formula.`,
    textEn: "Difference between batch normalization and layer normalization: write them down and show how σ is computed from the formula.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d03-ottimizzazione'],
    page: 5,
  },
  {
    id: 'dl-12',
    text: 'Instance normalization',
    textIt: "L'*instance normalization*.",
    textEn: "Instance normalization.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d03-ottimizzazione'],
    page: 5,
  },
  {
    id: 'dl-13',
    text: 'Convolutional layers, what are the parameters, when I implement which hyperparameters I need to set ?',
    textIt: 'Layer convoluzionali: quali sono i parametri? Quando ne implemento uno, quali iperparametri devo fissare?',
    textEn: "Convolutional layers: what are the parameters? When you implement one, which hyperparameters do you need to set?",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d05-cnn'],
    page: 5,
  },
  {
    id: 'dl-14',
    text: 'Inception score googlenet and draw it',
    textIt: 'Il modulo Inception di GoogLeNet: disegnalo.',
    textEn: "The Inception module of GoogLeNet: draw it.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d05-cnn', 'd10-gan'],
    page: 5,
    note: "Nella fonte «Inception score» sta accanto a GoogLeNet e si chiede di disegnarlo: il disegno è quello del modulo Inception. L'Inception Score dei GAN è la domanda 29.",
  },
  {
    id: 'dl-15',
    text: 'LSTM, how is the structure?',
    textIt: "La LSTM: com'è fatta la sua struttura?",
    textEn: "The LSTM: what does its structure look like?",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d07-rnn'],
    page: 5,
  },
  {
    id: 'dl-16',
    text: 'Why and when to use sigmoid and tanh in LSTM, GRU and Vanilla.',
    textIt: 'Perché e quando si usano la sigmoide e la tanh nella LSTM, nella GRU e nella RNN vanilla?',
    textEn: "Why and when are the sigmoid and tanh used in the LSTM, the GRU and the vanilla RNN?",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d07-rnn'],
    page: 5,
  },
  {
    id: 'dl-17',
    text: 'Resnet and draw it',
    textIt: 'ResNet: disegnala.',
    textEn: "ResNet: draw it.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d05-cnn'],
    page: 5,
  },
  {
    id: 'dl-18',
    text: 'Adagrad, difference between adam and Adagrad',
    textIt: 'AdaGrad: in che cosa differisce da Adam?',
    textEn: "AdaGrad: how does it differ from Adam?",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d03-ottimizzazione'],
    page: 5,
  },
  {
    id: 'dl-19',
    text: 'Conditional Gan and draw figure',
    textIt: 'Il GAN condizionale: disegna lo schema.',
    textEn: "The conditional GAN: draw its scheme.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d10-gan'],
    page: 5,
  },
  {
    id: 'dl-20',
    text: 'RNN samples, give the example',
    textIt: 'Esempi di RNN (*RNN samples*): fanne uno.',
    textEn: "RNN examples (RNN samples): give one.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d07-rnn', 'd08-modelli-sequenziali'],
    page: 5,
  },
  {
    id: 'dl-21',
    text: 'difference between vanilla RNN and GRU ?',
    textIt: 'Differenza fra RNN vanilla e GRU.',
    textEn: "Difference between the vanilla RNN and the GRU.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d07-rnn'],
    page: 5,
  },
  {
    id: 'dl-22',
    text: 'Pixel RNN',
    textIt: 'PixelRNN.',
    textEn: "PixelRNN.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d07-rnn', 'd11-autoencoder-vae'],
    page: 5,
    note: 'PixelRNN non compare nelle note del corso usate qui: si lega alle RNN e ai modelli generativi.',
  },
  {
    id: 'dl-23',
    text: 'Vanila Gradient descent and draw figure',
    textIt: 'La discesa del gradiente vanilla: disegna la figura.',
    textEn: "Vanilla gradient descent: draw the figure.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d02-backpropagation', 'd03-ottimizzazione'],
    page: 5,
  },
  {
    id: 'dl-24',
    text: 'how do I design network for semantic segmentation ?',
    textIt: 'Come progetto una rete per la segmentazione semantica?',
    textEn: "How do you design a network for semantic segmentation?",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d06-detection-segmentation', 'd05-cnn', 'm01-segnali-learning', 'm02-sistema-ml-design'],
    page: 5,
    note: 'Le note del corso non hanno una sezione sulla segmentazione semantica: gli appigli sono la FCN di Mask R-CNN e la U-Net.',
  },
  {
    id: 'dl-25',
    text: 'difference between autoencoder and variational autoencoders, in terms of latent space',
    textIt: 'Differenza fra autoencoder e autoencoder variazionale, dal punto di vista dello spazio latente.',
    textEn: "Difference between an autoencoder and a variational autoencoder, from the point of view of the latent space.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d11-autoencoder-vae'],
    page: 5,
  },
  {
    id: 'dl-26',
    text: 'Training GAN and explain the formula also write down',
    textIt: "L'addestramento dei GAN: scrivi la formula e spiegala.",
    textEn: "GAN training: write the formula and explain it.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d10-gan'],
    page: 5,
  },
  {
    id: 'dl-27',
    text: 'overfitting in GAN',
    textIt: "L'*overfitting* nei GAN.",
    textEn: "Overfitting in GANs.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d10-gan'],
    page: 5,
  },
  {
    id: 'dl-28',
    text: 'loss of the GAN',
    textIt: 'La *loss* dei GAN.',
    textEn: "The GAN loss.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d10-gan'],
    page: 5,
  },
  {
    id: 'dl-29',
    text: 'What are the Inception Score and the Frechet Score?',
    textIt: "Che cosa sono l'Inception Score e la Fréchet Inception Distance?",
    textEn: "What are the Inception Score and the Fréchet Inception Distance?",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d10-gan'],
    page: 5,
  },
  {
    id: 'dl-30',
    text: 'GAN label information ?',
    textIt: 'GAN e informazione di etichetta (*label*).',
    textEn: "GANs and label information.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d10-gan'],
    page: 5,
  },
  {
    id: 'dl-31',
    text: 'Why GANs call adversarial ?',
    textIt: 'Perché i GAN si chiamano avversari?',
    textEn: "Why are GANs called adversarial?",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d10-gan'],
    page: 5,
  },
  {
    id: 'dl-32',
    text: 'cycle gan',
    textIt: 'CycleGAN.',
    textEn: "CycleGAN.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d10-gan'],
    page: 5,
  },
  {
    id: 'dl-33',
    text: 'how do we measure GAN ? how to we produce good quality GAN ?',
    textIt: 'Come si valuta un GAN? Come si ottiene un GAN di buona qualità?',
    textEn: "How do you evaluate a GAN? How do you obtain a good-quality GAN?",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d10-gan'],
    page: 6,
  },
  {
    id: 'dl-34',
    text: 'Also she was asking xyz network use which optimization algorithm and why',
    textIt: 'Quale algoritmo di ottimizzazione usa una certa rete, e perché?',
    textEn: "Which optimization algorithm does a given network use, and why?",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d03-ottimizzazione', 'd05-cnn'],
    page: 6,
  },
  {
    id: 'dl-35',
    text: 'RCNN, fast RCNN and faster RCNN and brief explanation of mask RCNN',
    textIt: 'R-CNN, Fast R-CNN e Faster R-CNN, più una breve spiegazione di Mask R-CNN.',
    textEn: "R-CNN, Fast R-CNN and Faster R-CNN, plus a brief explanation of Mask R-CNN.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d06-detection-segmentation', 'm02-sistema-ml-design'],
    page: 6,
  },
  {
    id: 'dl-36',
    text: 'ADAM optimization algorithm, besides the concept she wants you to know all hyperparameters and what they are for.',
    textIt: "L'algoritmo di ottimizzazione Adam: oltre all'idea, tutti gli iperparametri e a che cosa servono.",
    textEn: "The Adam optimization algorithm: besides the idea, all its hyperparameters and what they are for.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d03-ottimizzazione'],
    page: 6,
  },
  {
    id: 'dl-37',
    text: 'Attention model for image captioning. Local vs global attention and how to implement them.',
    textIt: "Il modello di *attention* per l'*image captioning*. *Attention* locale e globale, e come si implementano.",
    textEn: "The attention model for image captioning. Local and global attention, and how they are implemented.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d08-modelli-sequenziali', 'm01-segnali-learning', 'm02-sistema-ml-design'],
    page: 6,
  },
  {
    id: 'dl-38',
    text: 'Transformers: the whole encoder structure and self attention explained. How can you use a transformer for classifying images?',
    textIt: "Transformer: tutta la struttura dell'encoder e la *self-attention*. Come si usa un transformer per classificare immagini?",
    textEn: "Transformers: the whole encoder structure and self-attention. How can you use a transformer to classify images?",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d09-transformers'],
    page: 6,
  },
  {
    id: 'dl-39',
    text: 'Draw LSTM structure and explain how it captures the same concept of the residual connections in ResNet (answer: the gradient descent passes through the internal memory cell that has no activation, so the vanishing gradient problem is not so severe)',
    textIt: 'Disegna la struttura della LSTM e spiega come cattura la stessa idea delle connessioni residue di ResNet (risposta: il gradiente passa per la cella di memoria interna, che non ha attivazione, quindi il problema del gradiente che svanisce è meno grave).',
    textEn: "Draw the structure of the LSTM and explain how it captures the same idea as the residual connections of ResNet (answer: the gradient flows through the internal memory cell, which has no activation, so the vanishing gradient problem is less severe).",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d07-rnn', 'd05-cnn'],
    page: 6,
  },
  {
    id: 'dl-40',
    text: 'Reinforcement learning: the general idea of the architecture for Atari Games; Markov Decision Process; Expected Cumulative Reward; Value function; Q learning and Deep Q Learning; REINFORCE algorithm',
    textIt: "*Reinforcement learning*: l'idea generale dell'architettura per i giochi Atari; processo decisionale di Markov; ricompensa cumulativa attesa; funzione valore; Q-learning e Deep Q-learning; l'algoritmo REINFORCE.",
    textEn: "Reinforcement learning: the general idea of the architecture for Atari games; Markov decision process; expected cumulative reward; value function; Q-learning and deep Q-learning; the REINFORCE algorithm.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['p13-rl-mdp', 'p14-rl-apprendimento', 'm01-segnali-learning'],
    page: 6,
    note: 'Atari, Deep Q-learning e REINFORCE non compaiono nelle fonti del corso: la base (MDP, Bellman, Q-learning) è nei fogli di Passerini.',
  },
  {
    id: 'dl-41',
    text: 'Sequence models, Transformer (draw the architecture and explain in detail from the input through the computation of self attention to the output) + How CNNs works (with convolution formula), what we have seen about CNNs in Sequence models',
    textIt: "Modelli sequenziali e Transformer: disegna l'architettura e spiegala nel dettaglio, dall'input al calcolo della *self-attention* fino all'output. Poi come funzionano le CNN (con la formula della convoluzione) e che cosa abbiamo visto sulle CNN nei modelli sequenziali.",
    textEn: "Sequence models and Transformers: draw the architecture and explain it in detail, from the input through the computation of self-attention to the output. Then how CNNs work (with the convolution formula) and what the course covered about CNNs in sequence models.",
    prof: 'Ricci',
    part: 'Deep Learning',
    moduleIds: ['d09-transformers', 'd08-modelli-sequenziali', 'd05-cnn'],
    page: 6,
  },
]

const byId = new Map(examBank.map((q) => [q.id, q]))

export const getBankQuestion = (id: string): BankQuestion | undefined => byId.get(id)

/** Il resoconto della fonte da cui viene una domanda: 'mel-14c' → 'mel-14'. */
export const reportOf = (id: string) => id.replace(/[a-z]$/, '')

// ---------------------------------------------------------------------------------------------
// Confronto fra il bankText di un ExamQuestion e la banca
// ---------------------------------------------------------------------------------------------

/** Quanti caratteri normalizzati identificano una domanda della banca. */
export const BANK_KEY_LENGTH = 60

/** Forma di confronto: Unicode NFKC, minuscole, virgolette tipografiche dritte, spazi compressi. */
export function normalizeBankText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u0060]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** I primi 60 caratteri normalizzati di un testo. */
export const bankKey = (text: string) => normalizeBankText(text).slice(0, BANK_KEY_LENGTH)

const isWordChar = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c)

/**
 * Il bankText copre la domanda se ne contiene i primi 60 caratteri normalizzati: è lo stesso testo, oppure
 * un brano più lungo della fonte che la include (un paragrafo intero copre tutte le sue parti). La chiave
 * deve cadere su parole intere, così una domanda breve ("L1 regularization") non si ritrova dentro un'altra parola.
 */
export function coversBankQuestion(bankText: string, question: Pick<BankQuestion, 'text'>): boolean {
  const hay = normalizeBankText(bankText)
  const full = normalizeBankText(question.text)
  const key = full.slice(0, BANK_KEY_LENGTH)
  if (key === '') return false
  // la fine della chiave è un confine di parola solo se la chiave è tutta la domanda: altrimenti il taglio
  // a 60 caratteri può cadere a metà di una parola
  const whole = key.length === full.length
  for (let at = hay.indexOf(key); at !== -1; at = hay.indexOf(key, at + 1)) {
    const startOk = !isWordChar(hay[at - 1]) || !isWordChar(key[0])
    const endOk = !whole || !isWordChar(hay[at + key.length]) || !isWordChar(key.at(-1))
    if (startOk && endOk) return true
  }
  return false
}

/** Il bankText è solo un pezzo della domanda (per esempio l'ultima frase): la copre in parte. */
export function isFragmentOf(bankText: string, question: Pick<BankQuestion, 'text'>): boolean {
  const key = bankKey(bankText)
  return key.length >= 12 && !coversBankQuestion(bankText, question) && normalizeBankText(question.text).includes(key)
}

/** Le domande della banca che un bankText copre, nell'ordine della banca. */
export const bankQuestionsCoveredBy = (bankText: string): BankQuestion[] => examBank.filter((q) => coversBankQuestion(bankText, q))
