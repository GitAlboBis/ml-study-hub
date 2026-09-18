# ML Study Hub

Web app React/Vite di studio per l'esame orale di Machine Learning (Università di Trento: Melgani Cap. 1-4, Passerini, Deep Learning di Ricci), costruita dal notebook NotebookLM "Machine Learning Oral Exam Question Bank" dell'utente.

## Da dove ripartire (leggere per primi)

1. `docs/STATO.md`: cosa è fatto, cosa gira, prossimo passo. Va aggiornato a ogni fase chiusa.
2. `docs/superpowers/plans/2026-09-17-ml-study-app.md`: il piano completo (11 fasi, gate G0-G8, contratti di codice).
3. `PRODUCT.md`: contesto di prodotto. `docs/plan/modules.json`: i 50 moduli con gli intervalli di pagina. `docs/plan/cast.md`: scenari reali dei widget.

Il lavoro passa spesso da una sessione all'altra e da un account all'altro (limiti di sessione). Lo stato vive nei file del repo, non nella conversazione: non fidarsi della memoria della chat, rileggere `docs/STATO.md`.

## Richieste dell'utente, non negoziabili

- Non perdere nulla: nessun concetto, informazione, formula matematica o passaggio logico delle 8 fonti. Massima cura sul Cap. 2 (Statistical Estimation Theory), il più denso di matematica.
- Ogni concetto ha qualcosa di interattivo e animato con un esempio reale di machine learning (modelli di riferimento: PDF, K-NN, Parzen Windows).
- App enorme: immagini, giochi interattivi, riassunti, esempi. Meglio metterci più tempo che tagliare.
- Spiegazioni in italiano, ogni termine tecnico e ogni domanda d'orale anche in inglese. Tutte e tre le parti del corso. Progetto React/Vite locale.
- Usare le skill di design (`ui-design:*`) e i workflow multi-agente con revisori indipendenti.

## Regole operative

- Fonti estratte in `_sources/` (git-ignored): testo per pagina, OCR NotebookLM, PNG di ogni pagina. I PDF originali non si toccano. Le formule delle slide sono immagini: si trascrivono dai PNG, non dal testo estratto.
- Disco C: quasi pieno. Controllare lo spazio prima di installare browser di test, generare figure o fare build; fermarsi sotto 1 GB liberi. Figure e pagine in WebP.
- Inventario (Fase 1): `node scripts/inventory-status.mjs` mostra lo stato per modulo. Per riprendere un workflow interrotto: `node scripts/inventory-status.mjs --args` produce gli `args` da passare a `scripts/workflows/inventory-v2.workflow.js` (salta gli stadi già marcati `done` nei file).
- Gate: `node scripts/check-inventory.mjs [id]` (G0 + pagine citate), `node scripts/page-coverage.mjs` (G1). Gli altri gate sono nel piano.
- Niente `npx shadcn init`: i componenti presi dai connettori si adattano ai token CSS del progetto.
- Commit: solo se l'utente li chiede.
