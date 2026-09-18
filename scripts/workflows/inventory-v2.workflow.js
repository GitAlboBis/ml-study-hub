export const meta = {
  name: 'ml-concept-inventory-v3',
  description: 'Inventario esaustivo di concetti, formule, derivazioni, esempi, figure e widget animati per i 50 moduli del corso ML: autore, revisore di completezza, verificatore di formule e widget, piu una seconda verifica matematica per il Cap. 2. Ripristinabile tra sessioni tramite i marcatori di stadio nei file.',
  whenToUse: 'Fase 1 del piano della web app di studio ML (docs/superpowers/plans/2026-09-17-ml-study-app.md)',
  phases: [
    { title: 'Inventario', detail: 'un agente per modulo legge testo e OGNI immagine di pagina e scrive docs/inventory/<id>.json' },
    { title: 'Completezza', detail: 'revisore indipendente: checklist pagina per pagina, poi aggiunge cio che manca' },
    { title: 'Formule e widget', detail: 'ogni formula confrontata simbolo per simbolo con la pagina; widget resi implementabili' },
    { title: 'Cap. 2 seconda verifica', detail: 'solo m03-m10: catene logiche delle derivazioni e coerenza slide/note' },
  ],
}

const ROOT = 'C:/Users/alber/MachineLearning-Study'
const NLM = { ch1: 'nlm_ch1.txt', ch2: 'nlm_ch2.txt', ch3: 'nlm_ch3.txt', ch4: 'nlm_ch4.txt', part1: 'nlm_part1.txt', part2: 'nlm_part2.txt', dl: 'deep_learning_notes.txt' }
const PROF = { melgani: 'Melgani', passerini: 'Passerini', ricci: 'Ricci' }

// copia di docs/plan/modules.json (lo script non ha accesso al filesystem): rigenerare se il manifest cambia
const MODULES = [{"id":"m01-segnali-learning","course":"melgani","chapter":"Cap. 1 · Introduction","title":"Segnali, acquisizione e apprendimento","titleEn":"Signals, acquisition and learning","sources":[{"doc":"ch1","pages":[1,11]},{"doc":"part1","pages":[1,7]}]},{"id":"m02-sistema-ml-design","course":"melgani","chapter":"Cap. 1 · Introduction","title":"Sistema di ML: schema a blocchi, fasi di design ed esempi applicativi","titleEn":"ML system block scheme, design phases, application examples","sources":[{"doc":"ch1","pages":[12,43]},{"doc":"part1","pages":[6,11]}]},{"id":"m03-stima-intro-parametrica","course":"melgani","chapter":"Cap. 2 · Statistical Estimation Theory","title":"Stima statistica: introduzione, stima di PDF e stima parametrica","titleEn":"Statistical estimation intro, PDF estimation, parametric estimation, likelihood","sources":[{"doc":"ch2","pages":[1,11]},{"doc":"part1","pages":[12,19]}]},{"id":"m04-bonta-stimatori","course":"melgani","chapter":"Cap. 2 · Statistical Estimation Theory","title":"Bontà di uno stimatore, bound di Cramér-Rao e proprietà asintotiche","titleEn":"Estimation goodness, Cramér-Rao bound, asymptotic properties","sources":[{"doc":"ch2","pages":[12,16]},{"doc":"part1","pages":[17,21]}]},{"id":"m05-max-likelihood","course":"melgani","chapter":"Cap. 2 · Statistical Estimation Theory","title":"Stima a massima verosimiglianza (ML)","titleEn":"Maximum Likelihood estimation, example, properties, model selection","sources":[{"doc":"ch2","pages":[17,21]},{"doc":"part1","pages":[20,24]}]},{"id":"m06-modelli-pdf-gaussiana","course":"melgani","chapter":"Cap. 2 · Statistical Estimation Theory","title":"Modelli di PDF e modello gaussiano","titleEn":"PDF examples and the Gaussian model (univariate/multivariate)","sources":[{"doc":"ch2","pages":[22,31]},{"doc":"part1","pages":[21,26]}]},{"id":"m07-stima-bayesiana","course":"melgani","chapter":"Cap. 2 · Statistical Estimation Theory","title":"Stima bayesiana e confronto ML vs Bayes","titleEn":"Bayesian estimation, ML versus Bayesian","sources":[{"doc":"ch2","pages":[32,40]},{"doc":"part1","pages":[26,30]}]},{"id":"m08-non-parametrica-knn","course":"melgani","chapter":"Cap. 2 · Statistical Estimation Theory","title":"Stima non parametrica e K-NN","titleEn":"Nonparametric estimation basics and K-NN estimation","sources":[{"doc":"ch2","pages":[41,50]},{"doc":"part1","pages":[30,36]}]},{"id":"m09-parzen-windows","course":"melgani","chapter":"Cap. 2 · Statistical Estimation Theory","title":"Finestre di Parzen (kernel density estimation)","titleEn":"Parzen windows estimation, width effect, kernels, properties","sources":[{"doc":"ch2","pages":[51,66]},{"doc":"part1","pages":[36,45]}]},{"id":"m10-em-dati-incompleti","course":"melgani","chapter":"Cap. 2 · Statistical Estimation Theory","title":"Stima con dati incompleti e algoritmo EM","titleEn":"Estimation with incomplete data, EM algorithm, Gaussian mixture","sources":[{"doc":"ch2","pages":[67,77]},{"doc":"part1","pages":[45,50]}]},{"id":"m11-hughes-feature-selection","course":"melgani","chapter":"Cap. 3 · Feature Reduction","title":"Riduzione delle feature, effetto Hughes e selezione","titleEn":"Feature reduction intro, Hughes effect, feature selection","sources":[{"doc":"ch3","pages":[1,15]},{"doc":"part1","pages":[51,56]}]},{"id":"m12-misure-separabilita","course":"melgani","chapter":"Cap. 3 · Feature Reduction","title":"Misure di separabilità: divergenza, Bhattacharyya, Jeffries-Matusita","titleEn":"Statistical separability measures","sources":[{"doc":"ch3","pages":[15,27]},{"doc":"part1","pages":[56,63]}]},{"id":"m13-strategie-ricerca","course":"melgani","chapter":"Cap. 3 · Feature Reduction","title":"Strategie di ricerca: SFS e SBS","titleEn":"Search strategies, sequential forward/backward selection","sources":[{"doc":"ch3","pages":[28,36]},{"doc":"part1","pages":[63,66]}]},{"id":"m14-pca","course":"melgani","chapter":"Cap. 3 · Feature Reduction","title":"Estrazione di feature e PCA","titleEn":"Feature extraction and Principal Component Analysis","sources":[{"doc":"ch3","pages":[37,49]},{"doc":"part1","pages":[66,71]}]},{"id":"m15-lda","course":"melgani","chapter":"Cap. 3 · Feature Reduction","title":"LDA (Fisher) e confronto PCA vs LDA","titleEn":"Linear Discriminant Analysis, multiclass, PCA vs LDA","sources":[{"doc":"ch3","pages":[50,60]},{"doc":"part1","pages":[71,76]}]},{"id":"m16-mdm-box","course":"melgani","chapter":"Cap. 4 · Supervised Classification","title":"Classificazione supervisionata: MDM e Box classifier","titleEn":"Supervised classification intro, minimum distance to mean, box classifier","sources":[{"doc":"ch4","pages":[1,8]},{"doc":"part1","pages":[77,80]}]},{"id":"m17-bayes-map-ml","course":"melgani","chapter":"Cap. 4 · Supervised Classification","title":"Classificazione bayesiana: criteri MAP e ML","titleEn":"Bayesian classification, MAP and ML criteria","sources":[{"doc":"ch4","pages":[9,15]},{"doc":"part1","pages":[80,84]}]},{"id":"m18-rischio-minimo","course":"melgani","chapter":"Cap. 4 · Supervised Classification","title":"Teoria del rischio minimo","titleEn":"Minimum risk theory","sources":[{"doc":"ch4","pages":[16,22]},{"doc":"part1","pages":[84,87]}]},{"id":"m19-funzioni-discriminanti","course":"melgani","chapter":"Cap. 4 · Supervised Classification","title":"Funzioni discriminanti e casi gaussiani","titleEn":"Discriminant functions, Gaussian cases 1-2-3","sources":[{"doc":"ch4","pages":[23,42]},{"doc":"part1","pages":[87,93]}]},{"id":"m20-alberi-decisione","course":"melgani","chapter":"Cap. 4 · Supervised Classification","title":"Alberi di decisione e CART","titleEn":"Decision trees, CART, impurity, pruning","sources":[{"doc":"ch4","pages":[43,62]},{"doc":"part1","pages":[93,99]}]},{"id":"m21-errore-generalizzazione","course":"melgani","chapter":"Cap. 4 · Supervised Classification","title":"Errore di generalizzazione, funzioni di loss e cross-validation","titleEn":"Generalization error, loss functions, cross-validation","sources":[{"doc":"ch4","pages":[63,67]},{"doc":"part1","pages":[97,102]}]},{"id":"m22-valutazione-accuratezza","course":"melgani","chapter":"Cap. 4 · Supervised Classification","title":"Valutazione dell'accuratezza, ROC e confronto tra classificatori","titleEn":"Accuracy evaluation, confusion matrix, ROC, t-test, McNemar","sources":[{"doc":"ch4","pages":[66,79]},{"doc":"part1","pages":[99,109]}]},{"id":"p01-stima-parametri","course":"passerini","chapter":"ML & Bayesian Parameter Estimation","title":"Stima ML e bayesiana dei parametri, statistiche sufficienti, prior coniugati","titleEn":"ML and Bayesian parameter estimation, sufficient statistics, conjugate priors","sources":[{"doc":"part2","pages":[1,5]}]},{"id":"p02-bernoulli-multinomiale","course":"passerini","chapter":"ML & Bayesian Parameter Estimation","title":"Applicazioni: Bernoulli (Beta) e Multinomiale (Dirichlet)","titleEn":"Bernoulli and Multinomial distributions","sources":[{"doc":"part2","pages":[5,11]}]},{"id":"p03-reti-bayesiane","course":"passerini","chapter":"Bayesian Networks","title":"Reti bayesiane: definizione e indipendenze","titleEn":"Bayesian networks definition","sources":[{"doc":"part2","pages":[11,16]}]},{"id":"p04-d-separazione","course":"passerini","chapter":"Bayesian Networks","title":"d-separazione","titleEn":"d-separation","sources":[{"doc":"part2","pages":[16,24]}]},{"id":"p05-apprendimento-reti","course":"passerini","chapter":"Bayesian Networks","title":"Apprendimento nei modelli grafici: ML, MAP, dati incompleti","titleEn":"Learning in graphical models","sources":[{"doc":"part2","pages":[24,31]}]},{"id":"p06-discriminanti-perceptron","course":"passerini","chapter":"Linear Discriminant Functions","title":"Funzioni discriminanti lineari e perceptron","titleEn":"Linear discriminant functions, linear binary classifier, perceptron","sources":[{"doc":"part2","pages":[31,40]}]},{"id":"p07-regressione-multiclasse","course":"passerini","chapter":"Linear Discriminant Functions","title":"Regressione, classificazione multiclasse e classificatori lineari generativi","titleEn":"Perceptron regression, multiclass classification, generative linear classifiers","sources":[{"doc":"part2","pages":[40,46]}]},{"id":"p08-svm-hard-margin","course":"passerini","chapter":"Support Vector Machines","title":"SVM a margine rigido","titleEn":"Support Vector Machines, hard margin","sources":[{"doc":"part2","pages":[46,55]}]},{"id":"p09-svm-soft-margin","course":"passerini","chapter":"Support Vector Machines","title":"SVM a margine morbido e SVM su larga scala","titleEn":"Soft margin SVM, large scale SVM","sources":[{"doc":"part2","pages":[55,62]}]},{"id":"p10-kernel-trick","course":"passerini","chapter":"Kernel Machines","title":"Kernel trick e kernel validi","titleEn":"Kernel machines intro, kernel trick, valid kernels","sources":[{"doc":"part2","pages":[62,68]}]},{"id":"p11-kernel-machines","course":"passerini","chapter":"Kernel Machines","title":"Kernel machines e kernel per dati strutturati","titleEn":"Kernel machines, SVR, kernels on strings and graphs","sources":[{"doc":"part2","pages":[67,75]}]},{"id":"p12-clustering","course":"passerini","chapter":"Unsupervised Learning","title":"Apprendimento non supervisionato: k-means, GMM, numero di cluster, clustering gerarchico","titleEn":"Unsupervised learning","sources":[{"doc":"part2","pages":[75,84]}]},{"id":"p13-rl-mdp","course":"passerini","chapter":"Reinforcement Learning","title":"Reinforcement learning: decisioni sequenziali e politica ottima","titleEn":"Sequential decision making, MDP, Bellman, value/policy iteration","sources":[{"doc":"part2","pages":[84,93]}]},{"id":"p14-rl-apprendimento","course":"passerini","chapter":"Reinforcement Learning","title":"Reinforcement learning: valutazione e apprendimento della politica","titleEn":"Policy evaluation, TD, SARSA, Q-learning, scaling to large state spaces","sources":[{"doc":"part2","pages":[92,101]}]},{"id":"d01-reti-feedforward","course":"ricci","chapter":"DL 1 · Feedforward Neural Networks","title":"Reti feedforward, funzioni di costo, unità e attivazioni","titleEn":"Feedforward networks, cost functions, unit types, activation functions, architecture design","sources":[{"doc":"dl","pages":[1,15]}]},{"id":"d02-backpropagation","course":"ricci","chapter":"DL 2 · Backpropagation","title":"Discesa del gradiente e backpropagation","titleEn":"Gradient descent and backpropagation","sources":[{"doc":"dl","pages":[16,22]}]},{"id":"d03-ottimizzazione","course":"ricci","chapter":"DL 3 · Optimization","title":"Ottimizzazione: varianti del gradiente e normalizzazione","titleEn":"Types of gradient descent, momentum, AdaGrad, RMSProp, Adam, normalization","sources":[{"doc":"dl","pages":[23,31]}]},{"id":"d04-regolarizzazione","course":"ricci","chapter":"DL 4 · Regularization","title":"Regolarizzazione","titleEn":"Capacity, overfitting, norm penalties, augmentation, noise, early stopping, dropout","sources":[{"doc":"dl","pages":[32,39]}]},{"id":"d05-cnn","course":"ricci","chapter":"DL 5 · Convolutional Neural Networks","title":"Reti convoluzionali e architetture per classificazione","titleEn":"Convolutions, inside a CNN, CNN architectures","sources":[{"doc":"dl","pages":[40,50]}]},{"id":"d06-detection-segmentation","course":"ricci","chapter":"DL 5 · Convolutional Neural Networks","title":"Object detection e instance segmentation","titleEn":"CNN regularisation, object detection, instance segmentation","sources":[{"doc":"dl","pages":[50,55]}]},{"id":"d07-rnn","course":"ricci","chapter":"DL 6 · Recurrent Neural Networks","title":"Reti ricorrenti: RNN, LSTM, GRU","titleEn":"Variable-length sequences, vanilla RNN, LSTM, GRU","sources":[{"doc":"dl","pages":[56,62]}]},{"id":"d08-modelli-sequenziali","course":"ricci","chapter":"DL 7 · Sequence Models","title":"Modelli sequenziali, captioning e attention","titleEn":"Captioning, attention, seq2seq, local attention, GNMT, word embeddings","sources":[{"doc":"dl","pages":[63,75]}]},{"id":"d09-transformers","course":"ricci","chapter":"DL 8 · Transformers","title":"Transformer, ViT e Swin","titleEn":"From RNN to transformers, TCN, conv seq2seq, attention is all you need, ViT, Swin","sources":[{"doc":"dl","pages":[76,85]}]},{"id":"d10-gan","course":"ricci","chapter":"DL 9 · Generative Models","title":"Generative Adversarial Networks","titleEn":"GANs, DCGAN, evaluation (IS, FID), losses, training tricks, GAN zoo","sources":[{"doc":"dl","pages":[86,97]}]},{"id":"d11-autoencoder-vae","course":"ricci","chapter":"DL 9 · Generative Models","title":"Autoencoder, VAE e VQ-VAE","titleEn":"Autoencoders, variational autoencoders, VQ-VAE, GAN vs VAE","sources":[{"doc":"dl","pages":[98,103]}]},{"id":"d12-diffusion","course":"ricci","chapter":"DL 10 · Diffusion Models","title":"Modelli di diffusione","titleEn":"Forward/reverse pass, generative trilemma, score matching, architecture, stable diffusion","sources":[{"doc":"dl","pages":[104,110]}]},{"id":"d13-self-supervised-visione","course":"ricci","chapter":"DL 11 · Large Multi-Modal Models","title":"Apprendimento contrastivo e masked image modelling","titleEn":"Image-only (non-)contrastive learning, masked image modelling","sources":[{"doc":"dl","pages":[111,115]}]},{"id":"d14-clip-llm-multimodali","course":"ricci","chapter":"DL 11 · Large Multi-Modal Models","title":"CLIP e LLM come interfaccia universale","titleEn":"Contrastive language-image pre-training, LLMs as universal interface","sources":[{"doc":"dl","pages":[115,126]}]}]
const DONE = args.done || {}
const RUN1 = args.run1 || {}
const isCh2 = (m) => ['m03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10'].includes(m.id.split('-')[0])
const has = (m, stage) => (DONE[m.id] || []).includes(stage)
const idx = (m) => MODULES.findIndex((x) => x.id === m.id)
const neighbors = (m) => {
  const i = idx(m)
  return [MODULES[i - 1], MODULES[i + 1]].filter(Boolean).filter((n) => n.course === m.course).map((n) => `${n.id} ("${n.title}", fonti ${n.sources.map((s) => s.doc + ' p' + s.pages[0] + '-' + s.pages[1]).join(', ')})`).join('; ')
}
const srcList = (m) => m.sources.map((s) => {
  const pad = (n) => String(n).padStart(3, '0')
  return `- doc "${s.doc}", pagine ${s.pages[0]}-${s.pages[1]}:
    * immagini delle pagine (LEGGILE TUTTE con Read, una per una): ${ROOT}/_sources/pages/${s.doc}/p${pad(s.pages[0])}.png ... p${pad(s.pages[1])}.png
    * testo per pagina (marcatori "===== ${s.doc} PAGE n ====="): ${ROOT}/_sources/src_text/${s.doc}.txt
    * testo OCR NotebookLM (senza numeri di pagina, utile per le slide): ${ROOT}/_sources/nlm_text/${NLM[s.doc]}`
}).join('\n')

const CAST = `CAST DI SCENARI REALI (riusali per coerenza in tutta l'app; i dati nei widget saranno sintetici ma realistici e dichiarati come tali). Tabella completa: ${ROOT}/docs/plan/cast.md
- "pesce": impianto di confezionamento pesce, salmone vs spigola, feature luminosita/larghezza/lunghezza (esempio del Cap. 1 di Melgani)
- "telerilevamento": immagini multispettrali/iperspettrali da satellite o drone (UAV), classi acqua/vegetazione/suolo/urbano, centinaia di bande (effetto Hughes)
- "medicina": ECG e patologie cardiache, COVID-19 da radiografia, test diagnostici con falsi positivi/negativi e costi asimmetrici
- "spam": filtro email spam/ham con parole e conteggi (Bernoulli, multinomiale, naive Bayes)
- "cifre": riconoscimento cifre scritte a mano (immagini 8x8 o 28x28 stile MNIST)
- "sensori": letture di sensori IoT, temperature, rilevamento anomalie, stima di densita
- "energia": previsione della radiazione solare / consumo energetico (regressione)
- "case": prezzi delle case per regressione
- "banca": credit scoring e frodi con carte di credito (costi degli errori, ROC)
- "incendio": allarme antincendio e chiamata ai vigili del fuoco (esempio del rischio minimo del corso)
- "robot": robot/agente in una griglia, videogiochi Atari (reinforcement learning)
- "traduzione": frasi italiano->inglese, sentiment di recensioni, didascalie di immagini (sequenze, attention, transformer)
- "immagini": generazione e classificazione di immagini (volti, oggetti, auto a guida autonoma per detection/segmentazione)
- "fonte": esempio applicativo citato direttamente nella fonte (batimetria, radar GPR, agricoltura, biometria...)`

const SCHEMA_DOC = `FORMATO DEL FILE (JSON valido, UTF-8). Nelle stringhe JSON ogni backslash del LaTeX va raddoppiato: "\\\\hat{\\\\theta}", "\\\\frac{1}{N}". ATTENZIONE: \\t \\f \\b \\r \\n singoli diventano caratteri di controllo e rovinano \\theta, \\frac, \\beta, \\right, \\nu: il validatore li segnala.
{
  "moduleId": "<id>",
  "title": "<titolo IT>",
  "stages": {"inventario": "done"},
  "pagesReviewed": [{"doc": "ch2", "from": 51, "to": 66}],
  "overview": "3-5 frasi: di cosa parla il modulo e perche conta per l'esame",
  "concepts": [{
    "id": "c01",
    "name": "nome in italiano",
    "nameEn": "termine inglese esatto come nelle slide/note",
    "kind": "definizione|formula|teorema|proprieta|algoritmo|procedura|esempio|confronto|osservazione|figura|applicazione",
    "sourcePages": [{"doc": "ch2", "page": 53}, {"doc": "part1", "page": 38}],
    "detail": "cosa dice ESATTAMENTE la fonte, in italiano con i termini EN tra parentesi: ipotesi, condizioni, casi limite, interpretazione. 2-8 frasi. Niente parafrasi vaghe.",
    "latex": ["ogni formula trascritta ESATTAMENTE dall'immagine della pagina, con la notazione del docente (vettori in \\\\mathbf, cappelli, pedici, estremi delle sommatorie)"],
    "symbols": [{"s": "\\\\gamma(\\\\cdot)", "meaning": "funzione finestra di Parzen (kernel)"}],
    "examRelevance": 3,
    "noWidgetReason": "SOLO se nessuna interazione ha senso (es. nota storica); altrimenti ometti il campo"
  }],
  "derivations": [{"id": "der01", "title": "...", "sourcePages": [{"doc": "part1", "page": 22}], "goal": "cosa si dimostra", "steps": ["passaggio LaTeX 1", "passaggio LaTeX 2"], "stepWhy": ["perche passo 1", "perche passo 2"], "concepts": ["c05"]}],
  "workedExamples": [{"id": "ex01", "title": "...", "sourcePages": [{"doc": "ch2", "page": 18}], "description": "testo completo dell'esempio della fonte, con tutti i dati numerici e il risultato", "concepts": ["c02"]}],
  "figures": [{"id": "fig01", "doc": "ch2", "page": 55, "description": "cosa mostra il grafico/diagramma", "region": "posizione nella pagina (es. meta inferiore, grafico a destra)", "concepts": ["c07"], "importance": 3}],
  "widgets": [{
    "id": "kebab-case-unico-nel-corso con prefisso del modulo (es. m09-somma-dei-kernel)",
    "title": "titolo in italiano",
    "concepts": ["c03", "c04"],
    "scenario": "chiave del cast (pesce, telerilevamento, ...)",
    "realExample": "esempio concreto di machine learning: che dati, che feature, che obiettivo, perche serve questo concetto",
    "storyboard": ["fotogramma/stato 1 dell'animazione", "stato 2", "..."],
    "interactions": ["slider h da 0.05 a 3", "clic sul grafico per aggiungere un campione", "pulsante Play/Passo"],
    "visual": "cosa si disegna: assi, curve, punti, colori per ruolo, valori numerici live, formula con i valori sostituiti in tempo reale",
    "aha": "l'intuizione che lo studente conquista giocandoci",
    "formulasShown": ["latex mostrato live"],
    "challenge": "mini-sfida o gioco interno (es. trova h che minimizza l'errore, prevedi dove si spostera il confine)",
    "size": "S|M|L",
    "tech": "svg+motion | canvas2d | html+motion"
  }],
  "exercises": [{"id": "es01", "title": "...", "type": "numerico|concettuale|dimostrazione", "description": "testo dell'esercizio; per i numerici indica quali parametri si possono randomizzare e come si calcola la soluzione", "concepts": ["c02"]}],
  "examQuestions": [{"text": "testo VERBATIM della domanda dalla banca domande d'esame", "prof": "Melgani|Passerini|Ricci|Assistant", "concepts": ["c01"]}],
  "crossLinks": [{"moduleId": "m05-max-likelihood", "why": "..."}],
  "emptyPages": [{"doc": "ch2", "page": 1, "reason": "copertina del capitolo"}],
  "gaps": ["parti illeggibili, ambigue o contraddittorie tra slide e note, con pagina"]
}
REGOLA DELLE PAGINE (la impone il validatore): OGNI pagina dei tuoi intervalli deve essere citata in sourcePages di almeno un concetto/derivazione/esempio o in una figura. Solo se una pagina non ha davvero contenuto proprio (copertina, indice, oppure contiene SOLO materiale che appartiene al modulo adiacente) va elencata in "emptyPages" con il motivo preciso. Nel dubbio, il contenuto si inventaria: meglio un doppione (si deduplica dopo) che un buco.`

const markStage = (stage) => `ULTIMO PASSO OBBLIGATORIO (serve a riprendere il lavoro se la sessione si interrompe): solo dopo che il validatore stampa PASS, imposta nel JSON il campo di primo livello "stages" aggiungendo "${stage}": "done" SENZA rimuovere gli altri stadi gia presenti (es. {"inventario": "done", "${stage}": "done"}), poi riesegui il validatore e conferma che stampa ancora PASS. Non impostare il marcatore se il lavoro non e davvero completo. NOTA: un tentativo precedente di questo stesso stadio puo essere stato interrotto a meta dal limite di sessione: nel file possono gia esserci oggetti con "addedBy". Trattali come parte dell'inventario da verificare, non come prova che lo stadio sia concluso: il tuo controllo copre comunque TUTTE le pagine.`

const inventoryPrompt = (m) => `Sei un esperto di machine learning e didattica. Stai costruendo l'INVENTARIO COMPLETO di un modulo di una web app di studio per l'esame orale di Machine Learning (Universita di Trento, prof. ${PROF[m.course]}). L'utente ha chiesto esplicitamente di NON PERDERE NESSUN CONCETTO, INFORMAZIONE, FORMULA MATEMATICA O PASSAGGIO LOGICO ("non devi perdere nulla, soprattutto sul chapter 2 che spiega tanta matematica e formule"; "meglio metterci piu tempo ma non perdere nessun concetto"), e di avere qualcosa di INTERATTIVO E ANIMATO CON ESEMPI REALI DI MACHINE LEARNING PER OGNI CONCETTO. Non avere fretta: la completezza conta piu della velocita.

MODULO: ${m.id} - "${m.title}" (${m.titleEn}) - ${m.chapter}
Moduli adiacenti (le pagine di confine possono sovrapporsi; includi tutto cio che sta nelle tue pagine, il deduplicato si fa dopo): ${neighbors(m) || 'nessuno'}

FONTI DA LEGGERE:
${srcList(m)}
- Banca domande d'esame orale (reali, raccolte dagli studenti): ${ROOT}/_sources/nlm_text/exam_questions.txt (immagini: ${ROOT}/_sources/pages/examq/p001.png ... p006.png)

METODO OBBLIGATORIO:
1. Leggi il testo delle tue pagine dai file di testo (usa Grep/Read con offset sui marcatori di pagina).
2. Poi apri CON Read OGNI immagine PNG di OGNI pagina del tuo intervallo, per tutte le fonti, nessuna esclusa. Le formule nelle slide sono immagini e nel testo estratto mancano o sono corrotte: la trascrizione LaTeX deve venire dalle immagini.
3. Scomponi in modo ATOMICO: ogni definizione, ogni formula, ogni ipotesi, ogni proprieta, ogni passo di algoritmo, ogni osservazione, ogni esempio numerico, ogni grafico con il suo messaggio, ogni confronto, ogni nota a margine o parola evidenziata diventa un concetto separato. Un modulo tipico ha 30-90 concetti. Se slide e note dicono cose diverse o complementari, includi entrambe.
4. Trascrivi TUTTE le formule, anche intermedie, e ogni dimostrazione/derivazione passo per passo in "derivations", con il "perche" di ogni passaggio (stepWhy ha la stessa lunghezza di steps).
5. Per ogni concetto progetta interattivita: widget animati con un esempio reale di ML. Un widget puo coprire 1-4 concetti strettamente legati, ma OGNI concetto deve comparire in almeno un widget (usa noWidgetReason solo in casi rarissimi). Lo storyboard deve essere concreto: cosa si muove, in che ordine, cosa cambia quando l'utente agisce, quali numeri e formule si aggiornano. Esempi di livello atteso: per la PDF, un widget in cui le misure di luminosita dei salmoni cadono una a una su un asse e si accumulano in un istogramma che converge alla densita, con l'area sotto la curva evidenziata tra a e b che da la probabilita; per K-NN, un punto trascinabile nel piano delle feature del pesce con la sfera che si espande fino a contenere k campioni e la stima k/(N V) calcolata live; per Parzen, i kernel gaussiani che nascono su ogni campione e si sommano in tempo reale mentre si trascina lo slider h, con i casi sovra/sotto-smoothing.
6. Seleziona le figure utili (grafici, schemi, diagrammi) con pagina e posizione.
7. Estrai VERBATIM tutte le domande della banca d'esame pertinenti a questo modulo.
8. ${CAST}

${SCHEMA_DOC}

SCRIVI il file ${ROOT}/docs/inventory/${m.id}.json con il tool Write (crea solo questo file, non toccarne altri; se il file esiste gia da un tentativo interrotto NON buttarlo: leggilo, verifica pagina per pagina cio che contiene contro le immagini, correggi e completa tutto cio che manca, cosi il lavoro gia fatto non va perso).
POI esegui: node ${ROOT}/scripts/check-inventory.mjs ${m.id}
Correggi e riesegui finche stampa PASS. Considera anche gli avvisi "!".
${markStage('inventario')}

Il tuo output finale e solo il riepilogo strutturato richiesto.`

const run1Note = (m) => RUN1[m.id] ? `
TERZA OPINIONE DISPONIBILE: esiste una bozza INDIPENDENTE dello stesso modulo, scritta da un altro agente in un'esecuzione precedente poi interrotta${RUN1[m.id] === 'parziale' ? ' (PARZIALE: e stata troncata, i concetti ci sono ma i widget mancano)' : ''}: ${ROOT}/_sources/inventory-run1/${m.id}.json. Aprila SOLO DOPO aver finito il tuo confronto (punti 1-2): ogni concetto, formula, derivazione, esempio numerico, figura, domanda d'esame o idea di widget presente li ma assente (o piu povero) nel file attuale va verificato sulla pagina citata e, se corretto, integrato. Non copiare alla cieca: la bozza puo contenere errori. Non modificare quel file.` : ''

const critiquePrompt = (m) => `Sei il REVISORE DI COMPLETEZZA, indipendente e severo, dell'inventario di un modulo di una web app di studio per l'esame orale di Machine Learning (prof. ${PROF[m.course]}). L'utente ha chiesto di non perdere NULLA: nessun concetto, nessuna formula, nessun passaggio logico, nessun esempio. E vuole un widget interattivo animato con esempio reale di ML per ogni concetto. Non avere fretta.

MODULO: ${m.id} - "${m.title}" - ${m.chapter}
Moduli adiacenti: ${neighbors(m) || 'nessuno'}

FONTI:
${srcList(m)}
- Banca domande d'esame: ${ROOT}/_sources/nlm_text/exam_questions.txt

INVENTARIO DA REVISIONARE: ${ROOT}/docs/inventory/${m.id}.json

METODO OBBLIGATORIO:
1. PRIMA di aprire l'inventario, apri con Read OGNI immagine di OGNI pagina delle fonti e costruisci la tua checklist pagina per pagina: ogni definizione, formula (anche intermedia), ipotesi, proprieta, passo di algoritmo, osservazione, esempio numerico, grafico, confronto, nota a margine, parola evidenziata in rosso nelle slide.
2. Poi apri l'inventario e confronta voce per voce. Cerca: concetti mancanti; dettagli vaghi o imprecisi; formule mancanti, incomplete o trascritte male; derivazioni senza passaggi o senza il perche; esempi numerici senza dati; figure importanti non elencate; domande d'esame pertinenti non estratte; concetti senza widget; widget generici o con storyboard vago; pagine finite in emptyPages che invece hanno contenuto.
3. MODIFICA il file JSON in place (Read + Edit, oppure riscrivilo con Write): aggiungi i concetti mancanti con id nuovi in coda, correggi i dettagli, aggiungi formule/derivazioni/esempi/figure/domande, crea o migliora i widget perche ogni concetto sia coperto. Aggiungi "addedBy": "revisore" agli oggetti che aggiungi.
4. Esegui node ${ROOT}/scripts/check-inventory.mjs ${m.id} finche stampa PASS.${run1Note(m)}

${CAST}

${SCHEMA_DOC}

${markStage('completezza')}
Non toccare altri file. Il tuo output finale e solo il riepilogo strutturato richiesto, con in notes l'elenco sintetico di cosa hai aggiunto o corretto.`

const fidelityPrompt = (m) => `Sei il VERIFICATORE FINALE dell'inventario di un modulo di una web app di studio per l'esame orale di Machine Learning (prof. ${PROF[m.course]}). Due aspetti, entrambi obbligatori. Non avere fretta: l'utente tiene soprattutto alle formule matematiche e logiche.

MODULO: ${m.id} - "${m.title}" - ${m.chapter}
FONTI:
${srcList(m)}
INVENTARIO: ${ROOT}/docs/inventory/${m.id}.json

A) FEDELTA DELLE FORMULE. Per ogni concetto, derivazione ed esempio con LaTeX, apri l'immagine della pagina citata in sourcePages e confronta simbolo per simbolo: pedici e apici, estremi di somme/integrali/produttorie, cappelli e tilde, vettori in grassetto, trasposte, inverse, determinanti, segni, fattori 1/2 e 1/N, logaritmi, parentesi, condizioni (argmax/argmin, "per ogni", vincoli). Correggi ogni discrepanza. Scorri anche TUTTE le pagine del range cercando formule presenti nell'immagine ma assenti dall'inventario, e aggiungile (con "addedBy": "verificatore"). Se una formula della fonte contiene un evidente refuso, trascrivila corretta e annota la discrepanza in "gaps".

B) QUALITA DELL'INTERATTIVITA. L'utente vuole per OGNI concetto qualcosa di interattivo e animato con un esempio reale di machine learning. Rileggi tutti i widget: ognuno deve avere uno scenario reale concreto, uno storyboard di animazione passo per passo implementabile senza ambiguita (cosa si muove, trigger, durate indicative, cosa si aggiorna), interazioni precise con range dei parametri, formule live con valori sostituiti e una mini-sfida. Riscrivi quelli vaghi. Verifica che ogni concetto sia coperto; se un widget copre troppi concetti eterogenei, dividilo. Gli id dei widget devono iniziare con il prefisso del modulo ("${m.id.split('-')[0]}-") per essere unici in tutto il corso: rinomina se serve. Il campo "scenario" deve essere una chiave del cast.

${CAST}

${SCHEMA_DOC}

Modifica il file in place e poi esegui node ${ROOT}/scripts/check-inventory.mjs ${m.id} finche stampa PASS.
${markStage('formule')}
Non toccare altri file. Output finale: solo il riepilogo strutturato richiesto.`

const logicPrompt = (m) => `Sei il SECONDO VERIFICATORE MATEMATICO, indipendente, di un modulo del Cap. 2 (Statistical Estimation Theory, prof. Melgani): il capitolo con piu matematica, su cui l'utente ha chiesto la massima cura ("non devi perdere nulla, soprattutto sul chapter 2 che spiega tanta matematica e formule"). Un primo verificatore ha gia confrontato le formule con le immagini: tu guardi da un'angolazione diversa, la LOGICA.

MODULO: ${m.id} - "${m.title}"
FONTI:
${srcList(m)}
INVENTARIO: ${ROOT}/docs/inventory/${m.id}.json

COSA VERIFICARE (apri le immagini delle pagine: slide ch2 E note part1, che spesso contengono i passaggi che le slide saltano):
1. CATENE LOGICHE: per ogni derivazione, ogni passaggio segue dal precedente? Mancano passaggi intermedi che le note riportano (derivate, logaritmi, scambi somma/derivata, completamento del quadrato, integrali)? Aggiungili con il loro "perche". Ricalcola tu stesso i passaggi algebrici: se trovi un errore di segno o di fattore, correggilo confrontando con la pagina.
2. IPOTESI E CONDIZIONI: ogni risultato ha scritte le ipotesi sotto cui vale (iid, N grande, regione piccola, p continua, prior noto, stimatore non polarizzato...) e i casi limite (N->inf, h->0, K->inf, sigma->0)?
3. COERENZA DEI SIMBOLI: lo stesso simbolo ha lo stesso significato in tutto il modulo e coincide con la notazione del docente? "symbols" e compilato per ogni formula non banale?
4. SLIDE vs NOTE: dove le due fonti scrivono la stessa formula in modo diverso, l'inventario riporta la versione delle slide come principale e annota la variante in "detail" o in "gaps"?
5. ESEMPI NUMERICI: rifai i conti degli esempi svolti; i risultati tornano? Tutti i dati numerici della fonte sono riportati?
6. DERIVAZIONI ASSENTI: ogni risultato che la fonte dimostra (anche a parole) ha una voce in "derivations"? Ogni risultato che all'orale si chiede di dimostrare (vedi ${ROOT}/_sources/nlm_text/exam_questions.txt) ce l'ha?
Aggiungi "addedBy": "verificatore-logica" a cio che aggiungi. Non rimuovere contenuti corretti.

${SCHEMA_DOC}

Modifica il file in place e poi esegui node ${ROOT}/scripts/check-inventory.mjs ${m.id} finche stampa PASS.
${markStage('formule2')}
Non toccare altri file. Output finale: solo il riepilogo strutturato richiesto.`

const RESULT = {
  type: 'object',
  properties: {
    moduleId: { type: 'string' },
    concepts: { type: 'number' },
    formulas: { type: 'number' },
    derivations: { type: 'number' },
    widgets: { type: 'number' },
    figures: { type: 'number' },
    examQuestions: { type: 'number' },
    added: { type: 'number' },
    fixed: { type: 'number' },
    checkPassed: { type: 'boolean' },
    stageMarked: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['moduleId', 'concepts', 'widgets', 'checkPassed', 'stageMarked', 'notes'],
}

const SKIP = { skipped: true }

// Concorrenza bassa e priorita esplicita: quando scatta il limite di sessione si perde il lavoro degli agenti in volo,
// quindi poche corsie e, in testa, i moduli che servono al pilota (m09, m08, m03), poi il resto del Cap. 2, poi gli altri.
const LANES = args.lanes || 4
const PRIORITY = args.priority || ['m09-parzen-windows', 'm08-non-parametrica-knn', 'm03-stima-intro-parametrica']
const ONLY = args.only ? new Set(args.only) : null
const rank = (m) => { const p = PRIORITY.indexOf(m.id); return p >= 0 ? p : PRIORITY.length + (isCh2(m) ? 0 : 1) }
const stagesOf = (m) => [
  ['inventario', 'Inventario', inventoryPrompt, 'inventario', 'first'],
  ['completezza', 'Completezza', critiquePrompt, 'completezza', 'critic'],
  ['formule', 'Formule e widget', fidelityPrompt, 'formule-widget', 'fidelity'],
  ...(isCh2(m) ? [['formule2', 'Cap. 2 seconda verifica', logicPrompt, 'logica', 'logic']] : []),
]
const todo = MODULES
  .filter((m) => !ONLY || ONLY.has(m.id))
  .filter((m) => stagesOf(m).some(([stage]) => !has(m, stage)))
  .sort((a, b) => rank(a) - rank(b) || idx(a) - idx(b))
log(`Inventario: ${todo.length} moduli da lavorare su ${MODULES.length}, ${LANES} corsie, ordine: ${todo.slice(0, 6).map((m) => m.id.split('-')[0]).join(', ')}...`)

let failures = 0
const halted = () => failures >= 2
const runModule = async (m) => {
  const acc = {}
  for (const [stage, phase, prompt, label, key] of stagesOf(m)) {
    if (has(m, stage)) { acc[key] = SKIP; continue }
    if (halted()) return { ...acc, stoppedBefore: stage }
    const r = await agent(prompt(m), { label: `${label}:${m.id}`, phase, schema: RESULT })
    if (!r) {
      failures++
      log(`Agente fallito: ${m.id} / ${stage}${halted() ? ' - secondo fallimento, probabile limite di sessione: non lancio altri agenti' : ''}`)
      return { ...acc, failedAt: stage }
    }
    acc[key] = r
  }
  return { ...acc, complete: true }
}
const queue = [...todo]
const results = {}
const lane = async () => { while (queue.length && !halted()) { const m = queue.shift(); results[m.id] = await runModule(m) } }
await parallel(Array.from({ length: LANES }, () => lane))

const last = (r) => [r.logic, r.fidelity, r.critic, r.first].find((x) => x && !x.skipped)
const summary = todo.map((m) => {
  const r = results[m.id]
  if (!r) return { id: m.id, notStarted: true }
  const f = last(r) || {}
  return { id: m.id, complete: !!r.complete, failedAt: r.failedAt, stoppedBefore: r.stoppedBefore, concepts: f.concepts, widgets: f.widgets, figures: f.figures, derivations: f.derivations, exam: f.examQuestions, criticAdded: r.critic?.added, criticFixed: r.critic?.fixed, fidelityAdded: r.fidelity?.added, fidelityFixed: r.fidelity?.fixed, logicAdded: r.logic?.added, logicFixed: r.logic?.fixed, notes: f.notes }
})
const completed = summary.filter((x) => x.complete).map((x) => x.id)
const pending = summary.filter((x) => !x.complete).map((x) => x.id)
log(`Completi in questa esecuzione: ${completed.length}. Da riprendere: ${pending.length} (node scripts/inventory-status.mjs --args per gli args)`)
return { completed, pending, haltedByFailures: halted(), summary: summary.filter((x) => !x.notStarted) }
