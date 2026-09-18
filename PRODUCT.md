# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript (scelta dell'utente: "Progetto React/Vite", preferito a un Artifact o a una cartella HTML statica). Contenuti in MDX con matematica KaTeX. Progetto locale in `C:\Users\alber\MachineLearning-Study`, avviato con `npm run dev`.

## Users

Uno studente universitario (l'utente stesso) che prepara l'esame orale di Machine Learning dell'Università di Trento: parte Melgani (Cap. 1-4), parte Passerini (note Part 2) e parte Deep Learning (prof.ssa Ricci). Studia in italiano, ma l'esame e i materiali sono in inglese.

## Product Purpose

Una web app di studio enorme e interattiva che trasforma tutte le fonti del notebook NotebookLM "Machine Learning Oral Exam Question Bank" in moduli con riassunti, teoria completa, formule, esempi svolti, immagini, widget animati, esercizi, flashcard, quiz e simulazione dell'orale. Successo: nessun concetto, informazione, formula o passaggio logico delle fonti viene perso, e ogni concetto ha qualcosa di interattivo che lo rende più facile da capire.

## Positioning

Non è un riassunto generico di machine learning: è costruita pagina per pagina sulle slide e sulle note del corso, con la notazione dei docenti, i rimandi alla pagina originale e le domande reali della banca d'esame orale.

## Operating Context

- Studio individuale su PC, a sessioni lunghe, in preparazione a un esame orale in cui si chiedono formule, dimostrazioni, grafici da disegnare e confronti.
- Fonti: `Machine Learning I - Part 1.pdf` (note Melgani), `Machine Learning I - Part 2.pdf` (note Passerini), `Machine Learning-Chapter-1..4.pdf` (slide Melgani), `Deep_Learning_FullNotes.pdf` (note Ricci), `Machine Learning exam questions.docx.pdf` (banca domande orali).
- La banca domande indica cosa chiedono i docenti: formule scritte a mano, disegni (Parzen, PCA vs LDA, ROC, LSTM), dimostrazioni (MAP come minimizzazione dell'errore, duale SVM), confronti (ML vs Bayes, SFS vs PCA, KNN vs Parzen).

## Capabilities and Constraints

- Lingua: spiegazioni in italiano, ogni termine tecnico e ogni domanda d'esame anche in inglese, glossario IT↔EN.
- Contenuti: tutte e tre le parti del corso (circa 50 moduli).
- Ogni concetto deve avere un'interazione animata con un esempio reale di machine learning (richiesta esplicita dell'utente, con esempi: PDF, K-NN, Parzen Windows).
- Tempo non vincolante: l'utente preferisce che il lavoro richieda più tempo piuttosto che perdere concetti.
- I dati nei widget sono sintetici ma realistici e vanno dichiarati come tali.

## Evidence on Hand

- Testo estratto: `_sources/src_text/*.txt` (per pagina), `_sources/nlm_text/*.txt` (NotebookLM).
- Immagini delle pagine: `_sources/pages/<doc>/pNNN.png`.
- Manifest dei moduli: `docs/plan/modules.json`. Inventario dei concetti: `docs/inventory/*.json`.
- Nessun dato d'uso, nessuna testimonianza: non inventarne.

## Product Principles

1. Completezza verificabile: ogni concetto della fonte è tracciato fino al punto dell'app che lo copre.
2. Fedeltà alla notazione del docente: le formule sono trascritte dalle pagine originali, con rimando alla pagina.
3. Capire facendo: ogni concetto si tocca, si anima e si mette alla prova con un esempio reale.
4. Allenamento all'orale: formule da scrivere, dimostrazioni da ricostruire, domande reali da ripetere ad alta voce.
5. Bilingue dove serve: si studia in italiano, si risponde in inglese.

## Accessibility & Inclusion

Uso prolungato: testo leggibile a lungo, tema chiaro e scuro, animazioni che rispettano `prefers-reduced-motion`, navigazione da tastiera per flashcard, quiz e widget.
