export const meta = {
  name: 'ml-study-phase3-infrastructure',
  description: 'Fase 3 del piano ML Study Hub: infrastruttura dei contenuti (vitest, tipi, RNG, renderer Rich+KaTeX, strumenti figure, store SRS, pipeline MDX, validatore di modulo, registry e router, guida autori) in TDD, poi revisione avversariale su 4 lenti e correzione con gate finale',
  phases: [
    { title: 'Fondamenta', detail: 'Task 3.1 + 3.2: dipendenze di test, Tailwind, contratto dei dati' },
    { title: 'Moduli base', detail: 'Task 3.3, 3.4, 3.6, 3.9 in parallelo (file disgiunti)' },
    { title: 'Validatore e registry', detail: 'catena A: 3.7 validatore poi 3.11 guida autori; catena B: 3.5 pipeline MDX poi 3.8 registry e router' },
    { title: 'Revisione', detail: '4 revisori indipendenti con lenti diverse, ognuno deve riprodurre i difetti' },
    { title: 'Correzioni e gate', detail: 'test di regressione prima della correzione, poi build + test + lint' },
  ],
}

const ROOT = 'C:/Users/alber/MachineLearning-Study'
const PLAN = `${ROOT}/docs/superpowers/plans/2026-09-17-ml-study-app.md`

const CTX = `PROGETTO: ${ROOT} (React 19 + Vite 8 + TypeScript 6, Windows 11, Node 22, Python 3.14 con PyMuPDF e Pillow). E una web app di studio per l'esame orale di Machine Learning: 50 moduli, ognuno con data.ts tipizzato + index.mdx + widget React. Leggi ${ROOT}/CLAUDE.md per il contesto.
PIANO: ${PLAN} (1484 righe). Il tuo task e descritto li con il CODICE ESATTO da usare come base: cerca l'intestazione del task con Grep (es. "### Task 3.3") e leggi quella sezione per intero, piu "## Global Constraints" e la "Mappa dei file" all'inizio.

REGOLE PER TUTTI:
- NIENTE git commit, git add o altre operazioni git: l'utente non li ha chiesti. Ignora gli step "Commit" del piano.
- NON toccare docs/inventory/, _sources/ (tranne dove il task lo dice), docs/plan/: un altro workflow ci sta lavorando in parallelo.
- Crea o modifica SOLO i file elencati nel tuo task. Altri agenti lavorano in parallelo su altri file dello stesso repo: se tsc o il build segnalano errori in file NON tuoi, ignorali e dillo nelle note; correggi solo i tuoi.
- NON eseguire "npm install" a meno che il tuo task lo dica esplicitamente (lo fa solo l'agente Fondamenta): se ti manca una dipendenza, segnalalo nelle note.
- TDD dove il piano prevede test: prima il test che fallisce (eseguilo e verifica che fallisca per il motivo giusto), poi l'implementazione minima, poi il test verde. Comandi: npx vitest run <percorso>, npx tsc -p tsconfig.app.json --noEmit.
- Il codice del piano e un punto di partenza scritto senza poterlo eseguire: se non compila o un test rivela un bug, correggilo e annota la deviazione in deviationsFromPlan. Le INTERFACCE pubbliche (nomi, firme, tipi esportati) pero devono restare quelle del piano, perche gli altri task le usano.
- Per dubbi sulle API delle librerie installate (vitest 5, vite 8, react-router 7.18, zustand 5, marked 18, katex 0.18, @mdx-js/rollup 3, tailwindcss 4) consulta Context7 (tool MCP resolve-library-id + query-docs, da caricare con ToolSearch) invece di andare a memoria.
- Codice in stile del template Vite gia presente (ESM, niente punto e virgola, apici singoli). Commenti e messaggi in italiano come nel piano.
- Output finale: solo il riepilogo strutturato richiesto, onesto: se qualcosa non passa, testsPassed=false e spiega.`

const TASK = {
  type: 'object',
  properties: {
    task: { type: 'string' },
    filesTouched: { type: 'array', items: { type: 'string' } },
    testsPassed: { type: 'boolean' },
    commandsRun: { type: 'array', items: { type: 'string' } },
    deviationsFromPlan: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['task', 'filesTouched', 'testsPassed', 'notes'],
}
const FINDINGS = {
  type: 'object',
  properties: {
    lens: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          file: { type: 'string' },
          severity: { type: 'string', enum: ['critico', 'alto', 'medio', 'basso'] },
          reproduction: { type: 'string', description: 'comando o input concreto che mostra il difetto e output osservato' },
          suggestedFix: { type: 'string' },
        },
        required: ['title', 'file', 'severity', 'reproduction', 'suggestedFix'],
      },
    },
    checkedAndFine: { type: 'array', items: { type: 'string' } },
  },
  required: ['lens', 'findings'],
}

const task = (label, phase, body) => agent(`${CTX}\n\nIL TUO TASK\n${body}`, { label, phase, schema: TASK })

phase('Fondamenta')
const base = await task('3.1+3.2 fondamenta', 'Fondamenta', `Task 3.1 (Test runner) e Task 3.2 (Contratto dei dati di modulo), piu l'installazione di Tailwind prevista dal Task 2.2 step 2 (SOLO l'installazione).
1. Controlla lo spazio su disco (PowerShell: Get-PSDrive C). Se i GB liberi sono meno di 2, fermati e riferiscilo.
2. Sei l'UNICO agente autorizzato a eseguire npm install. Esegui, dalla cartella del progetto: npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom   e poi   npm install tailwindcss @tailwindcss/vite
3. Crea vitest.config.ts come da piano (mergeConfig con vite.config). Aggiungi a package.json gli script "test", "validate", "coverage:concepts" come da piano. NON modificare ancora vite.config.ts (lo fara il Task 3.5).
4. Crea src/content/types.ts ESATTAMENTE con le interfacce del Task 3.2 (e il contratto di tutto il progetto). Verifica con npx tsc -p tsconfig.app.json --noEmit: nessun errore nei tuoi file. Se tsconfig ha opzioni che rendono invalido il codice del piano (es. erasableSyntaxOnly, verbatimModuleSyntax), adatta il codice, non il tsconfig.
5. Scrivi un test minimo src/content/types.test.ts che usa defineModule e md (md\`\\hat{\\mu}\` deve restituire la stringa con un solo backslash) ed eseguilo: deve passare. Questo prova che vitest funziona.`)
if (!base || !base.testsPassed) log(`ATTENZIONE Fondamenta: ${base ? base.notes : 'agente fallito'}`)

phase('Moduli base')
const stageB = await parallel([
  () => task('3.3 rng', 'Moduli base', `Task 3.3 (RNG a seed): src/lib/rng.ts e src/lib/rng.test.ts. Oltre ai 4 test del piano aggiungi: float con decimals rispetta estremi e arrotondamento; pick non esce mai dall'array; due seed diversi danno sequenze diverse; seed 0 funziona.`),
  () => task('3.4 rich', 'Moduli base', `Task 3.4 (Renderer dei testi Rich: Markdown + KaTeX): src/lib/rich.ts, src/lib/rich.test.ts, src/components/content/Rich.tsx, src/components/content/M.tsx. ATTENZIONE: il primo test del piano ("estrae inline e display") ha un'aspettativa contorta: riscrivilo in modo chiaro mantenendo il comportamento documentato (extractMath restituisce prima i display poi gli inline). Aggiungi test per: "\\$" escapato nel testo (es. "costa 5\\$") che non apre matematica; $$ su piu righe; "<" e ">" dentro la matematica ($a < b$) che non rompono l'HTML; pipe dentro la matematica in una tabella GFM; grassetto e liste attorno alla matematica; renderRich con inline:true non produce <p>. Il CSS di KaTeX va importato una sola volta (import 'katex/dist/katex.min.css' in Rich.tsx o M.tsx NON va bene per i test jsdom se rompe vitest: in quel caso lascia l'import a src/main.tsx e annotalo nelle note, senza modificare main.tsx).`),
  () => task('3.6 figure', 'Moduli base', `Task 3.6 (Strumenti per figure e pagine sorgente): scripts/fig.py e scripts/build-source-pages.py. Le fonti sono in ${ROOT}/_sources (tools/extract_pages.py definisce SOURCES con i percorsi dei PDF originali; pages/<doc>/pNNN.png sono le pagine renderizzate). Esegui la verifica dello step 2 (crop di ch2 pagina 55) e APRI il WebP prodotto con Read per controllare che si veda il grafico; poi elimina public/figures/_test. Prova anche "grid" e "full" e apri i risultati. Poi scrivi build-source-pages.py ed eseguilo su TUTTE le pagine: controlla Get-PSDrive C prima e dopo, stampa i MB totali di public/sources (atteso < 70 MB; se supera 120 MB abbassa larghezza o qualita e rigenera). Gli script devono funzionare lanciati dalla radice del progetto con "python scripts/...". Gestisci gli errori d'uso con un messaggio chiaro (argomenti mancanti, doc inesistente, pagina fuori intervallo).`),
  () => task('3.9 srs+store', 'Moduli base', `Task 3.9 (Store dei progressi e SRS): src/lib/srs.ts, src/lib/srs.test.ts, src/store/progress.ts, src/store/progress.test.ts. Per lo store definisci con precisione i tipi dello stato (modules, flashcards, quiz, exam, challenges, bookmarks, notes, streak) e le azioni elencate nel piano; persist con chiave "ml-study-progress-v1", version: 1 e una funzione migrate; storage dentro try/catch (se localStorage non e disponibile o lancia, lo stato resta in memoria senza errori). importJson deve VALIDARE la forma del JSON e rifiutare input non validi senza corrompere lo stato (restituisci un risultato o lancia un errore chiaro: scegli e documenta). lo streak conta i giorni consecutivi di studio: passa "now" come parametro alle azioni che ne hanno bisogno, per poterle testare. Test: gradeCard aggiorna la carta; exportJson -> reset -> importJson ripristina lo stesso stato; reset svuota; JSON corrotto rifiutato; streak su giorni consecutivi e con un buco.`),
])
const okB = stageB.filter(Boolean)
if (okB.length < 4) log(`ATTENZIONE Moduli base: ${4 - okB.length} agenti falliti`)

phase('Validatore e registry')
const stageC = await parallel([
  () => task('3.7 validatore', 'Validatore e registry', `Task 3.7 (Validatore di modulo, gate G2 G3 G4 G6): scripts/validate-module.ts. NON creare src/content/manifest.ts (lo crea il Task 3.8). Parti dal codice del piano, che non e mai stato eseguito: fallo funzionare davvero con "npx tsx scripts/validate-module.ts <id>". Esegui lo step 2 sul serio: crea il modulo finto src/content/modules/_fixture/ (data.ts + index.mdx) e docs/inventory/_fixture.json (questo e l'UNICO file che puoi creare in docs/inventory, e lo devi rimuovere alla fine) con 2-3 concetti, e dimostra: (a) FAIL leggibile quando manca la copertura di un concetto; (b) FAIL per LaTeX rotto in una formula e dentro un Rich; (c) FAIL per componente MDX non ammesso e per <Formula id> inesistente; (d) FAIL per destinazione di copertura inesistente; (e) FAIL per domanda della banca non inclusa; (f) PASS quando tutto e completo. Trasforma questi casi in un test automatico scripts/validate-module.test.ts che lancia il validatore come processo su fixture temporanee (il vitest.config include gia scripts/**/*.test.ts) e ripulisce sempre, anche se fallisce. Nota: data.ts importa da '../../types' e puo contenere funzioni (exercises.generate): l'import dinamico via tsx deve funzionare su Windows (pathToFileURL). Alla fine rimuovi tutte le fixture e verifica che docs/inventory non contenga _fixture.json.`)
    .then((v) => task('3.11 guida autori', 'Validatore e registry', `Task 3.11 (Guida per gli autori dei contenuti): docs/CONTENT_GUIDE.md, con TUTTI i 7 punti del piano. La leggeranno 50 agenti autori: deve essere precisa, breve dove puo, con esempi copiabili. Leggi prima src/content/types.ts, scripts/validate-module.ts (il comportamento REALE del validatore, comprese le soglie di pratica e i formati delle destinazioni di copertura), scripts/fig.py, la tabella dei componenti MDX del Task 3.10 del piano, docs/plan/cast.md e un inventario reale come esempio di input: ${ROOT}/_sources/inventory-run1/m08-non-parametrica-knn.json. Il mini-modulo di esempio del punto 7 deve essere VERO: crealo come fixture temporanea (src/content/modules/_guida/ + docs/inventory/_guida.json), fallo passare con "npx tsx scripts/validate-module.ts _guida", incolla nella guida il contenuto che ha passato, poi rimuovi le fixture. Aggiungi una sezione "Errori frequenti del validatore e come correggerli". Esito del task precedente (validatore): ${v ? v.notes : 'agente fallito, controlla tu stesso lo stato di scripts/validate-module.ts'}`)
      .then((g) => [v, g])),
  () => task('3.5 pipeline MDX', 'Validatore e registry', `Task 3.5 (Pipeline MDX in Vite): vite.config.ts (con mdx + react + tailwind come da piano), src/mdx.d.ts, modulo di prova temporaneo. Per il modulo di prova serve un componente Callout minimale: NON creare src/components/content/Callout.tsx (lo fara il Task 3.10): definiscilo inline nel file di prova e passalo con MDXProvider o come prop components. Verifica con "npm run build" che il bundle contenga HTML KaTeX (class="katex") e, se tsc -b fallisce per file di altri agenti, verifica almeno con "npx vite build". Verifica anche "npx vitest run" (vitest.config fa merge di vite.config: i test esistenti devono continuare a passare con il plugin mdx attivo). Poi rimuovi il modulo di prova e ripristina App.tsx.`)
    .then((m) => task('3.8 registry+router', 'Validatore e registry', `Task 3.8 (Registry dei moduli e router): src/content/manifest.ts (import tipizzato di docs/plan/modules.json con getModuleMeta e modulesByCourse; serve resolveJsonModule o import con ?raw: scegli cio che funziona con tsc e vite), src/content/registry.ts, src/router.tsx, src/main.tsx, src/content/registry.test.ts. Le pagine vere arrivano in Fase 5: per ora crea UNA pagina segnaposto src/pages/Placeholder.tsx (titolo della rotta + parametri) e usa route lazy che la caricano, con TUTTE le rotte elencate nel piano, cosi che la Fase 5 debba solo sostituire i lazy import. Usa Context7 per la sintassi di createBrowserRouter/lazy/RouterProvider della versione installata di react-router. main.tsx: RouterProvider + import 'katex/dist/katex.min.css'. Rimuovi App.tsx/App.css e gli asset demo del template solo se non servono piu. Verifica: npx vitest run src/content, npx tsc -p tsconfig.app.json --noEmit, npm run build. Esito del task precedente (pipeline MDX): ${m ? m.notes : 'agente fallito, controlla tu stesso vite.config.ts'}`)
      .then((r) => [m, r])),
])

phase('Revisione')
const REVIEW_CTX = `${CTX}\n\nSEI UN REVISORE INDIPENDENTE E SCETTICO della Fase 3 appena implementata. NON modificare i file del progetto (puoi creare file temporanei SOLO sotto ${ROOT}/.review-tmp/<tua-lente>/ oppure fixture con prefisso "_rev" che DEVI rimuovere alla fine). Ogni difetto che riporti deve essere RIPRODOTTO: un comando o un input concreto e l'output osservato. Niente difetti ipotetici, niente questioni di stile. Se un'area e a posto, scrivilo in checkedAndFine.`
const reviews = await parallel([
  () => agent(`${REVIEW_CTX}\n\nLENTE: IL VALIDATORE SI PUO INGANNARE? scripts/validate-module.ts e il gate che deve garantire all'utente che NESSUN concetto delle fonti vada perso. Costruisci moduli finti (_rev*) che dovrebbero fallire e verifica se invece passano: concetto mappato a uno slug di titolo che non esiste nell'MDX; concetto di tipo formula senza Formula ne Derivation; coverage con chiavi in piu o in meno rispetto all'inventario; concetto senza widget e senza noWidgetReason; widget dell'inventario assente; derivazione o esempio svolto dell'inventario assenti; domanda della banca assente o con bankText diverso; LaTeX rotto in ogni campo Rich possibile (options dei quiz, followUps, caption, symbols.meaning, why dei passi); numero dispari di $; esercizio generativo che lancia o restituisce NaN solo per alcuni seed; figura dichiarata ma file mancante; MDX con katex-error; titoli duplicati (slug con suffisso -1). Verifica anche i falsi positivi: un modulo corretto con "$" escapato, tabelle, <ModLink to="id#slug">, seeAlso deve PASSARE.`, { label: 'revisione:validatore', phase: 'Revisione', schema: FINDINGS }),
  () => agent(`${REVIEW_CTX}\n\nLENTE: RENDERER DELLE FORMULE. src/lib/rich.ts, Rich.tsx, M.tsx e la pipeline MDX (vite.config.ts con remark-math + rehype-katex). L'utente tiene soprattutto alle formule matematiche. Prova con script tsx temporanei: formule lunghe del corso (gaussiana multivariata con \\mathbf{\\Sigma}^{-1}, \\begin{cases}, \\begin{aligned}, \\underset{\\theta}{\\arg\\max}, \\prod_{k=1}^{N}, \\boxed{\\;?\\;}, \\text{...} con accenti italiani, \\operatorname), "$" escapato, valuta "5$ e 6$", matematica dentro grassetto/liste/tabelle GFM con "|" e "\\vert", "<" e "&" dentro la matematica, asterischi e underscore multipli dentro la matematica, $$ multi-riga con righe vuote, backtick con $ dentro. Confronta il comportamento di renderRich (runtime) con quello della pipeline MDX (build) sugli stessi input: se divergono in modo che un autore possa scrivere qualcosa che funziona in uno e non nell'altro, e un difetto. Controlla anche che md\`...\` (String.raw) in data.ts gestisca \\n, \\t, \\f, \\b dentro il LaTeX (\\nu, \\theta, \\frac, \\beta) e cosa succede con "\${" e con il backtick.`, { label: 'revisione:formule', phase: 'Revisione', schema: FINDINGS }),
  () => agent(`${REVIEW_CTX}\n\nLENTE: STATO, SRS, RNG, REGISTRY, ROUTER. src/lib/srs.ts (SM-2: intervalli 1, 6, poi interval*ef; ef minimo 1.3; voto < 3 azzera), src/store/progress.ts (persistenza: localStorage assente, pieno, JSON corrotto gia salvato, versione futura; importJson con input malevolo o parziale; azioni idempotenti; streak a cavallo di mezzanotte e del cambio ora), src/lib/rng.ts (distribuzione uniforme di int agli estremi, normal senza NaN, shuffle senza bias evidente, determinismo), src/content/registry.ts e manifest.ts (chiavi di import.meta.glob coerenti con i percorsi reali, modulo inesistente gestito senza eccezione non catturata), src/router.tsx (tutte le rotte del piano presenti, lazy funzionante, rotta sconosciuta gestita). Scrivi test temporanei ed eseguili.`, { label: 'revisione:stato', phase: 'Revisione', schema: FINDINGS }),
  () => agent(`${REVIEW_CTX}\n\nLENTE: SALUTE DEL PROGETTO. Esegui e riporta l'esito reale di: npm run build, npx vitest run, npm run lint, npx tsc -p tsconfig.app.json --noEmit, npx tsx scripts/validate-module.ts (senza argomenti: deve dare un messaggio d'uso, non uno stack trace), python scripts/fig.py (senza argomenti), node scripts/check-inventory.mjs. Controlla: tipi "any" evitabili e cast pericolosi nei file nuovi; coerenza tra src/content/types.ts e il piano (Task 3.2) e tra i componenti ammessi dal validatore e la tabella del Task 3.10; che docs/CONTENT_GUIDE.md descriva il comportamento REALE del validatore (prova l'esempio della guida: deve passare); residui di fixture (_fixture, _guida, _prova, _test) rimasti nel repo; dimensione di public/sources; package.json (script, dipendenze non previste dal Tech Stack del piano); file del template Vite rimasti inutilizzati; .gitignore.`, { label: 'revisione:salute', phase: 'Revisione', schema: FINDINGS }),
])
const findings = reviews.filter(Boolean).flatMap((r) => r.findings.map((f) => ({ ...f, lens: r.lens })))
log(`Revisione: ${findings.length} difetti riprodotti da ${reviews.filter(Boolean).length}/4 revisori`)

phase('Correzioni e gate')
const fix = await agent(`${CTX}\n\nSEI IL CORRETTORE della Fase 3. Quattro revisori indipendenti hanno riportato i difetti qui sotto, ciascuno con una riproduzione. Per OGNI difetto: 1) riproducilo; se non si riproduce, scartalo e scrivi perche; 2) scrivi PRIMA un test di regressione che fallisce; 3) correggi; 4) test verde. Non indebolire mai il validatore per far passare qualcosa: nel dubbio deve essere PIU severo, perche protegge la richiesta dell'utente di non perdere nessun concetto. Se una correzione cambia il comportamento descritto in docs/CONTENT_GUIDE.md, aggiorna la guida. Alla fine esegui il gate completo e riporta l'output reale: npm run build && npx vitest run && npm run lint. Rimuovi ${ROOT}/.review-tmp e ogni fixture residua (_rev*, _fixture, _guida, _prova).\n\nDIFETTI (${findings.length}):\n${JSON.stringify(findings, null, 1)}`, {
  label: 'correzioni+gate',
  phase: 'Correzioni e gate',
  schema: {
    type: 'object',
    properties: {
      fixed: { type: 'array', items: { type: 'string' } },
      discarded: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, why: { type: 'string' } }, required: ['title', 'why'] } },
      unresolved: { type: 'array', items: { type: 'string' } },
      gate: { type: 'object', properties: { build: { type: 'boolean' }, tests: { type: 'boolean' }, lint: { type: 'boolean' }, testCount: { type: 'number' }, output: { type: 'string' } }, required: ['build', 'tests', 'lint', 'output'] },
      notes: { type: 'string' },
    },
    required: ['fixed', 'discarded', 'unresolved', 'gate', 'notes'],
  },
})

return { base, stageB, stageC, findingsCount: findings.length, findings: findings.map((f) => `[${f.severity}] ${f.lens}: ${f.title} (${f.file})`), fix }
