# Stato dei lavori

Aggiornare questo file a ogni fase chiusa o workflow lanciato. Date e ore assolute (Europe/Rome).

## Come riprendere in 2 minuti

1. `node scripts/inventory-status.mjs` → quali moduli hanno quali stadi dell'inventario.
2. `npm run build && npx vitest run && npm run lint` → salute del codice.
3. Inventario interrotto? `node scripts/inventory-status.mjs --args` e togliere `modules` (lo script li ha già dentro); aggiungere `"lanes": 4`; lanciare `scripts/workflows/inventory-v2.workflow.js` con quegli `args`. Salta da solo gli stadi già marcati `done`.
4. `npm run dev` e aprire `/lab/_tavola` per il riferimento visivo.

## Limite di sessione: cosa abbiamo imparato (2026-09-17)

- Due finestre di utilizzo sono finite a metà lavoro (11:41 account A, circa 12:45 account B; reset alle 16:40). Un agente di inventario costa circa 0,4 M token (legge 20-40 immagini di pagina); 10 agenti in parallelo più un secondo workflow esauriscono una finestra in circa un'ora. Su questo account gira anche la sessione "Portfolio", che consuma la stessa finestra.
- Quando scatta il limite si perde il lavoro degli agenti in volo. Contromisure già attive: marcatori di stadio nei file (`stages.<nome> = "done"`), 4 corsie invece di 10, stop automatico al secondo fallimento, stadi che ripartono dal file lasciato a metà invece che da zero, priorità ai moduli del pilota.
- Stima grezza per l'inventario completo: circa 160 agenti ≈ 60 M token, cioè una decina di finestre. La Fase 7 del piano (un widget su misura per ogni gruppo di concetti: circa 25 widget × 50 moduli) non è sostenibile così com'è: va ripensata a **famiglie di widget parametrici** (vedi "Decisioni aperte").

## Fatto

- **Fase 0**: fonti in `_sources/` (8 fonti NotebookLM, testo per pagina, 601 PNG), scaffold, `modules.json` (50 moduli), `cast.md`, `PRODUCT.md`, piano.
- **Fase 1, in corso**: primo stadio completo e valido per `m01`-`m10` (Cap. 1 e tutto il Cap. 2): 59-80 concetti e 20-34 widget per modulo. Bozze della primissima esecuzione in `_sources/inventory-run1/` (terza opinione per i revisori). Validatore con copertura delle pagine; `inventory-status.mjs`, `page-coverage.mjs`, `wf-status.mjs`.
- **Fase 3, Task 3.1-3.9**: vitest, `src/content/types.ts`, `rng`, `rich` (+ `Rich`, `M`), `fig.py` e `build-source-pages.py` (601 pagine WebP in `public/sources`, 38 MB), `srs` + store dei progressi, pipeline MDX, `validate-module.ts` (+ test), `manifest`, `registry`, `router` con tutte le rotte e pagina segnaposto. Verificato il 2026-09-17 alle 16:57: build ✓, 199 test ✓, tsc ✓, lint ✓. Gli agenti hanno corretto difetti veri del codice del piano (per esempio `\$` letto come formula, `float(0.01, 1, 1)` che restituiva 0): le deviazioni sono nei commenti dei file.
- **Fase 3, Task 3.11**: `docs/CONTENT_GUIDE.md`, scritta dal comportamento reale del validatore; gli esempi vengono da un mini-modulo vero che ha dato PASS (fixture poi rimosse).
- **Fase 2, Task 2.1**: direzione scelta dall'utente, **Atlante in falso colore**. Contratto in `.impeccable/surfaces/src-pages-modulepage-tsx.md`, lavoro preparatorio in `docs/plan/design-direction.md`.
- **Fase 2, Task 2.2**: token (`src/styles/`), caratteri locali (Sofia Sans, Condensed, Extra Condensed, Overpass Mono), tema giorno/notte, palette dei grafici validata per daltonismo, pagina `/lab/_tavola`, `ThemeToggle`, `src/widgets/kit/plot/marks.ts`. Prove e regole in `docs/DESIGN-NOTES.md`. Verificato nel browser a 1440 e 375 px nei due temi.

- **Pilota m09 (2026-09-18, run `wf_3cdae6d2-9cf`, 21 agenti, circa 7,6 M token, 2 h 20 min)**: foglio completo e verificato.
  - Contenuti: `src/content/modules/m09-parzen-windows/` (teoria MDX, 84 formule, 12 derivazioni, 12 figure, 71 flashcard, 73 quiz, 10 domande d'orale, 16 esercizi generativi, glossario). Validatore PASS, `formula-coverage` 166/166. Tre revisori indipendenti (copertura, formule, logica) hanno trovato 22 difetti, corretti.
  - Widget: tutti i 28 di m09, più i riferimenti K-NN (`m08-cella-che-si-espande`) e PDF (`m03-campioni-che-rivelano-la-pdf`). Motore riusabile `src/widgets/engines/density1d/`. Guida `docs/WIDGET_GUIDE.md`.
  - Pagine: shell con indice dell'atlante, copertina, pagina modulo con 9 schede, laboratorio `/lab/:id`, visore delle fonti, componenti di pratica (flashcard SRS, quiz, esercizi, orale).
  - Kit rivisto da due revisori (accessibilità; motion e prestazioni): 22 correzioni.
  - Correzioni fatte dopo, nel thread principale: codici interni visibili (`der04`) diventati rimandi `[nome](#derivation:der04)` e nuovo controllo nel validatore; formule vive che allargavano la pagina su mobile (regola globale `.math-display`); opzioni lunghe dei Segmented; chiavi React duplicate; widget a tutta colonna e margine apribile sotto i 1280 px di contenitore; intestazione compatta su mobile; codici dei widget nel Laboratorio; tre figure delle slide in blocchi apribili; timeout dei test a 30 s.
  - Verifica visiva: `node scripts/snap.mjs <percorso senza / iniziale> <file.png> [--dark --width 390 --scroll sel --eval js]` (Chrome headless, niente Playwright). Screenshot in `.impeccable/review/`. Attenzione: in Git Bash un percorso che inizia con `/m/` diventa `M:/`.
  - Gate alle 12:48: build ✓, 1.371 test ✓, lint ✓.

## In corso

- **Inventario** (run `wf_3a16f9a2-230`, lanciato il 2026-09-18 alle 12:50): 3 corsie, prima il resto del Cap. 2 (m03 → m05 → m06 → m07 → m10), poi Cap. 1 e gli altri. Completi finora: m04, m08, m09.

## Prossimi passi, nell'ordine

1. **Mostrare il pilota all'utente** e raccogliere le sue osservazioni (Task 6.1, step 1) prima di produrre gli altri 49 fogli.
2. Finire l'inventario (Cap. 2 per primo).
3. Contenuti e widget del resto del Cap. 2 con la stessa pipeline del pilota (`scripts/workflows/pilot-m09.workflow.js`, ramo contenuti + ramo widget, parametrizzati per modulo).
4. Revisione finale del design (finish review di impeccable, `DESIGN.md`) quando ci sono almeno 3-4 fogli.
5. Revisori avversariali della Fase 3 (`scripts/workflows/phase3-infrastructure.workflow.js`, solo la parte di revisione).

## Decisioni aperte (da portare all'utente)

- **Commit git**: il piano li prevede per task, l'utente non li ha ancora chiesti. Consigliati come punti di ripristino.
- **Architettura dei widget**: circa 1.200 widget scritti a mano non sono sostenibili con i limiti di utilizzo. Proposta: 40-60 "motori" parametrici (esploratore di densità, di confini di decisione, di discesa del gradiente, di reti bayesiane, gridworld, mappe di attenzione…) configurati dall'inventario, così ogni concetto ha comunque la sua istanza animata con scenario, storyboard, formule vive e sfida, e restano scritti a mano solo i widget che lo meritano. Da decidere dopo aver visto il pilota.
