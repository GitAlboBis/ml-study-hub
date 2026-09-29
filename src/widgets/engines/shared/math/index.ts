// Matematica comune dei motori (src/widgets/engines/shared/math): logica pura e testata, nessun React.
// Moduli:
// - types       Vec2, Vec3, Mat2, Mat3, Gaussian, WeightedGauss1 (più Vec e Mat di src/lib/ml/stats)
// - special     erf/erfc precisi, φ, Φ, coda, Φ⁻¹, gamma incompleta, chi-quadro, cdf e quantili Beta, binomiale, logSumExp, sezione aurea, bisezione, gradiente e Hessiana numerici
// - linalg      vettori e matrici n × n, det, inversa, Cholesky, 2 × 2 in forma chiusa ed ellissi, Jacobi fino a n = 200 (anche a lotti), sbiancamento, autovalori generalizzati, polinomio caratteristico
// - scatter     medie, covarianze, S_i, S_W, S_B, S_T, Fisher, LDA, PCA con ricostruzione
// - gauss       densità gaussiane, Mahalanobis, campionamento, condizionata, livelli; divergenza, Bhattacharyya, JM, Chernoff, bound, errore di Bayes 1-D esatto, multiclasse, misure su griglia (anche dai logaritmi)
// - grid        griglie di nodi, carte delle etichette (convenzione di BoundaryCanvas), integrali, marching squares
// - nonparam2d  finestre e celle K-NN nelle tre norme, Parzen gaussiano (σ unica o adattiva) e a finestra, griglie di densità, leggi h_N e consistenza, aghi spuri
// - classify2d  soglia, retta, MDM, Box, gaussiano/Bayes, K-NN, Parzen, perceptron; decisioni, carte, valutazione, geometria delle frontiere
// - perceptron  perceptron n-D a campione singolo e batch
// - em          EM per misture 1-D e 2-D (anche con dati mancanti), Q e minorante, collasso, k-means
// - project3d   camera orbitale, proiezione, clic sul pavimento, superfici e poligoni con l'algoritmo del pittore, ellissoidi
export * from './types'
export * from './special'
export * from './linalg'
export * from './scatter'
export * from './gauss'
export * from './grid'
export * from './nonparam2d'
export * from './classify2d'
export * from './perceptron'
export * from './em'
export * from './project3d'
