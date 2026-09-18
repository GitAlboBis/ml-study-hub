# Cast degli scenari reali

Ogni widget usa uno di questi scenari, così lo studente ritrova gli stessi "personaggi" in tutto il corso. I dati sono sintetici ma realistici, generati con RNG a seed, e la UI li etichetta come "dati sintetici ispirati a …".

| Chiave | Scenario | Feature tipiche | Dove torna utile |
|---|---|---|---|
| `pesce` | Impianto di confezionamento pesce: salmone vs spigola (esempio del Cap. 1 di Melgani) | luminosità, larghezza, lunghezza | PDF, ML, Bayes, K-NN, Parzen, MAP/ML, discriminanti, MDM/box |
| `telerilevamento` | Immagini multispettrali e iperspettrali da satellite o drone (UAV) | riflettanza per banda, centinaia di bande | effetto Hughes, selezione feature, separabilità, PCA/LDA, EM |
| `medicina` | ECG e patologie cardiache, COVID-19 da radiografia, test diagnostici | frequenza cardiaca, intervalli, score del test | rischio minimo, ROC, matrice di confusione, reti bayesiane |
| `spam` | Filtro email spam/ham | presenza e conteggio di parole | Bernoulli, multinomiale, Beta/Dirichlet, naive Bayes |
| `cifre` | Cifre scritte a mano (8×8 o 28×28 stile MNIST) | pixel | PCA, K-NN, CNN, autoencoder, VAE, GAN |
| `sensori` | Letture di sensori IoT, temperature, anomalie | valore, tempo | stima di densità, dati incompleti, EM |
| `energia` | Previsione della radiazione solare o del consumo | ora, nuvolosità, temperatura | regressione, loss, cross-validation, RNN |
| `case` | Prezzi delle case | superficie, stanze, zona | regressione lineare, pseudoinversa, SVR |
| `banca` | Credit scoring e frodi con carta | reddito, importo, frequenza | costi asimmetrici, ROC/AUC, SVM, alberi |
| `incendio` | Allarme antincendio e chiamata ai vigili del fuoco (esempio di rischio minimo del corso) | lettura del sensore di fumo | rischio minimo, matrice dei costi |
| `robot` | Robot o agente in una griglia, giochi Atari | stato, azione, ricompensa | MDP, Bellman, value/policy iteration, Q-learning, DQN |
| `traduzione` | Frasi italiano→inglese, sentiment di recensioni, didascalie di immagini | token, embedding | RNN, attention, seq2seq, transformer, CLIP |
| `immagini` | Classificazione, detection e segmentazione (guida autonoma), generazione di volti e oggetti | pixel, box, maschere | CNN, R-CNN, GAN, diffusione, ViT |
| `fonte` | Esempio applicativo citato direttamente nella fonte (batimetria, radar GPR, agricoltura, biometria…) | come nella fonte | Cap. 1 e casi specifici |
