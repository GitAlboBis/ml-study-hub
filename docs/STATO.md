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

- **Git** (2026-09-18): repository privato https://github.com/GitAlboBis/ml-study-hub creato su richiesta dell'utente, 9 commit per argomento su `main`, push fatto. Da qui: un commit e un push per ogni fase chiusa.

## In corso (sessione del 2026-09-24)

L'utente ha chiesto di continuare fino alla fine senza fermarsi: il pilota è considerato approvato e la decisione sui widget è presa (motori parametrici condivisi più widget su misura dove un motore perderebbe la specifica). Workflow lanciati, tutti ripristinabili:

- **Inventario** del resto dei moduli (run `wf_579fb0c5-124`, `scripts/workflows/inventory-v2.workflow.js`, 5 corsie): m17 → m22, poi Passerini, poi Ricci. Riprendere con `node scripts/inventory-status.mjs --args` (togliere `modules`, aggiungere `"lanes": 5`).
- **Contenuti del Cap. 2** (run `wf_4ed47038-00d`, `scripts/workflows/content-production.workflow.js`): m03, m04, m05, m06, m07, m08, m10. Per foglio: 8-9 pezzi in parallelo (teoria, formule A/B, derivazioni A/B, figure, pratica 1/2), integratore con validatore PASS, poi giri di revisione (copertura, fedeltà formule, logica e numeri) + correttore fino a esaurimento (max 3 giri nel Cap. 2, 2 altrove). Marcatori in `docs/production/<id>/<stadio>.done`, resoconti in `docs/reports/content/<id>.md`. Args: `node scripts/production-args.mjs <prefissi>`; stato: `node scripts/production-args.mjs --status`.
- **Architettura dei motori dei widget** (run `wf_c1d05d76-dbf`): catalogo dei widget di m01-m16, architetto, critico. Produce `docs/plan/engines.md` e `docs/plan/widget-map.json`.

- **Motori dei widget** (run `wf_2895428c-753`, `scripts/workflows/engines-build.workflow.js`): prima la base comune `src/widgets/engines/shared/` (tipi, maniglie e segni, matematica; revisore e correttore), poi i 20 motori di `docs/plan/engines.md` in pipeline (costruttore con widget di riferimento e guida `docs/engines/<nome>.md` → revisore → correttore). Marcatori in `docs/production/_engines/`. Per riprendere: args `{ engines: [{ name, reference }], sharedDone: true, done: [motori finiti] }`.
- **Pagine globali** (run `wf_766c360d-2f0`, `scripts/workflows/app-pages.workflow.js`).

Workflow pronti, da lanciare in quest'ordine:
- `scripts/workflows/widgets-production.workflow.js` (args: `node scripts/production-args.mjs --widgets <prefissi>`): lotti di widget per foglio, implementazione → revisione → correzione; marcatori `docs/production/<id>/w-<widgetId>.done`.

Il server di sviluppo della sessione principale resta acceso sulla porta 5173: gli agenti fotografano con `scripts/snap.mjs` ma non lo avviano.

## Prossimi passi, nell'ordine

1. Motori dei widget (dopo l'architettura), poi widget del Cap. 2, poi degli altri fogli man mano che hanno contenuti e inventario.
2. Contenuti di m01, m02, m11-m22, poi Passerini, poi Ricci (stessa pipeline dei contenuti), appena i loro inventari sono completi.
3. Pagine globali (workflow `app-pages`).
4. Seconda architettura dei motori per Passerini e Ricci quando i loro inventari sono pronti.
5. Fase 9: gate automatici su tutti i fogli, revisioni di accessibilità, moto, design (impeccable finish review, `DESIGN.md`), verifica nel browser; Fase 10: README e consegna.

## Decisioni prese

- **Architettura dei widget** (2026-09-24): motori parametrici condivisi (`src/widgets/engines/<nome>/`, un preset per widget) più widget su misura dove un motore perderebbe lo storyboard, le interazioni o la sfida della specifica. Mappa in `docs/plan/widget-map.json`.

## Decisioni aperte (da portare all'utente)

- Nessuna al momento. Il deploy (per esempio Vercel) si chiede all'utente solo alla consegna.
