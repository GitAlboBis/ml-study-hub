export const meta = {
  name: 'ml-widget-engines-build',
  description: 'Costruzione dei motori parametrici dei widget (docs/plan/engines.md): un costruttore per motore con il widget di riferimento e la guida del preset, poi un revisore per motore con screenshot e un correttore',
  whenToUse: 'Dopo l architettura dei motori; args: { engines: [{ name, purpose, reference, widgets }] } da docs/plan/widget-map.json',
  phases: [
    { title: 'Base comune', detail: 'src/widgets/engines/shared/: tipi, maniglie e segni, matematica; revisore e correttore' },
    { title: 'Costruzione', detail: 'motore, test, widget di riferimento, guida del preset' },
    { title: 'Revisione', detail: 'un revisore per motore: API contro le specifiche dei widget coperti, screenshot, moto, accessibilita' },
    { title: 'Correzione', detail: 'applica i rilievi dimostrati' },
  ],
}

const ROOT = 'C:/Users/alber/MachineLearning-Study'
const ENGINES = (args && args.engines) || []
const DONE = new Set((args && args.done) || [])

const CTX = `PROGETTO: ${ROOT} (React 19 + Vite 8 + TypeScript 6 + Tailwind 4 + motion 13 da 'motion/react' + d3 7, Windows 11, Node 22). Web app di studio per l'esame orale di Machine Learning. Ogni concetto delle fonti ha un widget interattivo animato con un esempio reale di ML; le specifiche sono negli inventari ${ROOT}/docs/inventory/<moduleId>.json (campo widgets; estrai con node -e, non leggere tutto il JSON). Hai gia CLAUDE.md nel contesto.
ARCHITETTURA DEI MOTORI: ${ROOT}/docs/plan/engines.md e ${ROOT}/docs/plan/widget-map.json. Un motore e una cartella src/widgets/engines/<nome>/ come density1d: types.ts (tipi del preset), logica pura .ts con test, componente che riceve meta e preset e costruisce tutto nel WidgetFrame, index.ts come API pubblica. Nel motore NESSUN testo di un widget: tutto cio che e proprio del widget sta nel preset. Un widget su motore e src/widgets/<moduleId>/<widgetId>.widget.tsx (meta + default che rende il motore con il preset) piu <widgetId>.preset.ts e il test.
LEGGI PRIMA: ${ROOT}/docs/WIDGET_GUIDE.md (tutto), src/widgets/types.ts, src/widgets/registry.ts, tutto src/widgets/kit/ e src/widgets/kit/plot/, src/widgets/engines/density1d/ (il modello di motore gia costruito e revisionato), src/lib/ml/*, src/lib/datasets/*, docs/plan/cast.md, ${ROOT}/docs/DESIGN-NOTES.md. Widget di riferimento scritti a mano: src/widgets/m09-parzen-windows/m09-somma-dei-kernel.widget.tsx, src/widgets/m08-non-parametrica-knn/m08-cella-che-si-espande.widget.tsx, src/widgets/m03-stima-intro-parametrica/m03-campioni-che-rivelano-la-pdf.widget.tsx.
MONDO VISIVO: "Atlante in falso colore", ogni widget un terreno vivo. NESSUN colore letterale: solo token (var(--token) in SVG e style, utility dei token in className; colori per ruolo in src/widgets/kit/plot/colors.ts e marks.ts). Angoli vivi, niente gradienti, niente vetro, niente emoji come icone.
SKILL: prima del moto invoca con il tool Skill "ui-design:emil-design-eng" e "ui-design:svg-animations"; prima dei grafici "dataviz". Per le API di motion, d3, Testing Library usa Context7 (ToolSearch "context7"), non la memoria.
REGOLE:
- NIENTE operazioni git. NON eseguire npm install ne npm run build. NON modificare src/widgets/kit/ ne src/widgets/engines/shared/ (usali; se manca qualcosa, crealo dentro il tuo motore e dillo nelle note: lo si promuove dopo), ne i motori di altri, ne src/content/modules/, ne docs/inventory/, ne i widget gia costruiti di m09 (se ti serve la loro logica, copiala nel motore). Chi estende density1d non deve rompere i preset esistenti: npx vitest run src/widgets/m09-parzen-windows src/widgets/engines/density1d deve restare verde. Altri agenti lavorano in parallelo: errori in file non tuoi vanno ignorati e riferiti.
- Se trovi gia file del tuo compito (tentativo precedente interrotto): leggili, verificali e completali, non ricominciare.
- TDD per la logica: test che fallisce per il motivo giusto, implementazione, test verde. Comandi: npx vitest run <cartella> ; npx tsc -p tsconfig.app.json --noEmit ; npx oxlint <cartella>. vitest ha globals:false; matcher DOM con import '@testing-library/jest-dom/vitest'.
- Il server di sviluppo e acceso sulla porta 5173 (della sessione principale: non avviarne altri). Verifica visiva obbligatoria: node ${ROOT}/scripts/snap.mjs lab/<widgetId> <scratchpad>/a.png --width 1280 --height 900 e poi --width 390 --height 844, e --dark; per vedere un'animazione a meta usa --click "Riproduci" --wait 2500 (o il nome accessibile del pulsante). Apri i PNG con Read, leggi gli errori di console che lo script stampa, correggi cio che vedi.
- Accessibilita: tastiera ovunque, focus visibile, nomi accessibili, aria-live="polite" sui valori che si fermano (non a ogni frame), prefers-reduced-motion = stati a passi, bersagli >= 40px, nessun significato affidato al solo colore. Animazioni didattiche sempre controllabili (Play, Pausa, Passo, Velocita, Reset); niente animazione di proprieta di layout nei loop; niente setState per frame su tutto l'albero; canvas per i campi densi.
- Lezioni del pilota: opzioni lunghe dei Segmented vanno a capo o si accorciano; chiavi React uniche; il widget funziona a 390px; formule vive nella notazione del docente copiata dal latex dei concetti.
- Codice: ESM, niente punto e virgola, apici singoli, commenti in italiano come nei file esistenti.
- Output finale: solo il riepilogo strutturato richiesto, onesto.`

const TASK = {
  type: 'object',
  properties: {
    task: { type: 'string' },
    ok: { type: 'boolean' },
    filesTouched: { type: 'array', items: { type: 'string' } },
    presetApi: { type: 'string', description: 'l API del preset in forma compatta: campi, strati, fasi, formule, sfide' },
    limits: { type: 'string', description: 'cosa il motore non sa fare e quali widget coperti potrebbero richiedere un estensione' },
    notes: { type: 'string' },
  },
  required: ['task', 'ok', 'filesTouched', 'presetApi', 'limits', 'notes'],
}
const FINDINGS = {
  type: 'object',
  properties: {
    lens: { type: 'string' },
    findings: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, file: { type: 'string' }, severity: { type: 'string', enum: ['critico', 'alto', 'medio', 'basso'] }, evidence: { type: 'string' }, fix: { type: 'string' } }, required: ['title', 'file', 'severity', 'evidence', 'fix'] } },
    fine: { type: 'array', items: { type: 'string' } },
  },
  required: ['lens', 'findings'],
}
const FIX = {
  type: 'object',
  properties: { fixed: { type: 'array', items: { type: 'string' } }, discarded: { type: 'array', items: { type: 'string' } }, unresolved: { type: 'array', items: { type: 'string' } }, gate: { type: 'string' }, ok: { type: 'boolean' } },
  required: ['fixed', 'discarded', 'unresolved', 'gate', 'ok'],
}

// Limite di agenti contemporanei (args.max). Quando scatta il limite di sessione il lavoro degli agenti in volo si
// perde: meno agenti in volo = meno lavoro perso. La coda è in ordine di richiesta, quindi rispetta le priorità.
const MAX = (args && args.max) || 10
let active = 0
const waiting = []
const acquire = () => (active < MAX ? (active++, Promise.resolve()) : new Promise((r) => waiting.push(r)))
const release = () => { const next = waiting.shift(); if (next) next(); else active-- }
let failures = 0
const halted = () => failures >= 3
const run = async (label, phase, body, schema = TASK) => {
  await acquire()
  let r
  try {
    if (halted()) return null
    r = await agent(`${CTX}\n\n${body}`, { label, phase, schema })
  } finally { release() }
  if (!r) { failures++; log(`Agente fallito: ${label}`) }
  return r
}
const wl = (e) => (e.widgets ? e.widgets.join(', ') : `quelli elencati da: node -e "console.log(require('${ROOT}/docs/plan/widget-map.json').engines['${e.name}'].widgets.join(', '))"`)

const build = (e) => run(`motore:${e.name}`, 'Costruzione', `IL TUO COMPITO: costruire il motore "${e.name}"${e.purpose ? ` (${e.purpose})` : ''}.
Sezione del motore in docs/plan/engines.md: leggila per intera (cerca "${e.name}"). Widget che il motore deve poter rendere FEDELMENTE (id; la cartella del modulo e quella il cui id inizia con il prefisso, es. m06- -> src/widgets/m06-modelli-pdf-gaussiana/): ${wl(e)}.
1. Leggi le specifiche COMPLETE (storyboard, interactions, visual, formulasShown, challenge) di TUTTI i widget coperti (non solo del riferimento): l'API del preset deve bastare a ognuno senza perdere cio che lo rende unico. Dove l'architettura non basta, estendila e scrivilo nelle note.
2. Costruisci src/widgets/engines/${e.name}/ (types.ts, logica pura con test, componente, index.ts). Storyboard a fasi configurabile con PlayControls, formule vive (LiveFormula con \\val), Readout, Challenge con criterio calcolato da una funzione del preset, strati attivabili, scenario del cast con dati sintetici a seed (src/lib/rng.ts e src/lib/datasets; se servono generatori nuovi, mettili nel motore).
3. Implementa il widget di riferimento ${e.reference} sul motore (widget, preset, test), fedele alla sua specifica dell'inventario: e la prova che il motore vale e il modello per chi scrivera gli altri preset.
4. Scrivi la guida del preset in ${ROOT}/docs/engines/${e.name}.md (come la sezione 13 di WIDGET_GUIDE.md per density1d): quando usarlo, campi del preset, fasi dello storyboard, formule, sfide, esempio commentato del riferimento, limiti, controllo finale.
5. Verifica: npx vitest run src/widgets/engines/${e.name} src/widgets/${'<cartella del riferimento>'} ; tsc ; oxlint ; screenshot del riferimento a 1280 e 390 px, giorno e notte, e a meta animazione.
Scrivi alla fine ${ROOT}/docs/production/_engines/${e.name}.done con una riga di riepilogo, SOLO se tutto passa.`)

const review = (e, b) => run(`revisione:${e.name}`, 'Revisione', `SEI IL REVISORE INDIPENDENTE del motore "${e.name}" appena costruito (src/widgets/engines/${e.name}/, guida docs/engines/${e.name}.md, riferimento ${e.reference}). NON modificare i file del progetto; file temporanei solo nello scratchpad. Ogni difetto va DIMOSTRATO (test temporaneo, comando, screenshot aperto con Read) con l'output osservato.
Esito del costruttore: ${b ? `API: ${String(b.presetApi).slice(0, 1500)}. Limiti dichiarati: ${String(b.limits).slice(0, 800)}` : 'costruttore fallito: controlla lo stato dei file'}
LENTI (tutte):
1. ESPRESSIVITA: per almeno 6 dei widget coperti (${wl(e)}), scegliendo quelli piu lontani dal riferimento, leggi la specifica completa nell'inventario e prova a scrivere (nello scratchpad) lo scheletro del preset: se qualcosa dello storyboard, delle interazioni, della formula viva o della sfida non si puo esprimere, e un difetto alto.
2. CORRETTEZZA: la matematica del motore (calcola a mano o con node alcuni valori e confrontali con la logica), dati deterministici per seed, niente NaN.
3. MOTO E PRESTAZIONI (skill "ui-design:fixing-motion-performance"): niente proprieta di layout animate nei loop, niente setState per frame su tutto l'albero, requestAnimationFrame ripuliti (monta e smonta 30 volte), canvas nitidi con devicePixelRatio.
4. ACCESSIBILITA (skill "ui-design:fixing-accessibility"): solo tastiera, focus, nomi, aria-live, reduced motion a passi, 390px.
5. MONDO VISIVO: screenshot del riferimento a 1280 e 390 px nei due temi (scripts/snap.mjs): leggibilita, gerarchia, colori per ruolo, nessun colore letterale (Grep di #hex, rgb(, hsl( nel motore).`, FINDINGS)

const fixIt = (e, findings) => run(`correzioni:${e.name}`, 'Correzione', `SEI IL CORRETTORE del motore "${e.name}". Per ogni rilievo: riproducilo (se non si riproduce, scartalo spiegando perche), scrivi un test di regressione che fallisce, correggi, test verde. Se un rilievo di espressivita richiede di estendere l'API del preset, estendila senza rompere il riferimento e aggiorna docs/engines/${e.name}.md. Alla fine esegui e riporta l'output reale di: npx vitest run src/widgets/engines/${e.name} src/widgets ; npx tsc -p tsconfig.app.json --noEmit ; npx oxlint src/widgets ; screenshot del riferimento a 1280 e 390 px senza errori di console.\n\nRILIEVI (${findings.length}):\n${JSON.stringify(findings, null, 1)}`, FIX)

// ---------------------------------------------------------------------------------------------------
// Fase 0: la base comune src/widgets/engines/shared/ (tre costruttori su file disgiunti, un revisore, un correttore)
// ---------------------------------------------------------------------------------------------------
const SHARED = [
  ['shared-tipi-e-grafici', `Tipi e cornice comuni: src/widgets/engines/shared/types.ts (ParamSpec, EngineStep, EngineFormula, CommonChallenge, EngineTerm, BasePreset con tabs e insights, esattamente come nella "Parte comune" di docs/plan/engines.md, commentati), presetContract.ts (il test generico presetContract(preset, valueNames) della regola 8: ogni \\val{} esiste, ogni testo compila con KaTeX throwOnError, strati iniziali offerti, parametri iniziali nel loro intervallo, sfida non superata dallo stato iniziale; esportalo per i test dei preset), twins.ts (twinsDiffer della regola 13), ChallengeRunner.tsx (rende le sfide comuni custom/find/predict/sort/compute sopra il Challenge del kit), TabStrip.tsx, InsightLamps.tsx, ParamChart.tsx (grandezza contro parametro, scala log, cursore del valore corrente, curve teoriche, punti Monte Carlo con barre d'errore, costruzione punto per punto), LinkedPanels.tsx, Gauge.tsx e Thermometer.tsx, SciCounter.tsx, MonteCarloRunner.ts (repliche a lotti per fotogramma con useAnimationFrame, fermabili, a seed).`],
  ['shared-maniglie-e-segni', `Maniglie e segni comuni in src/widgets/engines/shared/: Knob.tsx (manopola angolare con tastiera, opzione θ e θ+180° identici), HandleOnCurve.tsx e LineHandles.tsx, Threshold.tsx (verticale o orizzontale, aggancio ai bordi dei bin, tastiera), Ellipse.tsx (da m e Σ, livelli in σ, maniglie opzionali di rotazione e assi), MatrixGrid.tsx (numeri o frazioni esatte, colormap divergente con i token, hover di cella e della simmetrica, celle che volano e si sommano), DragBins.tsx e Sortable.tsx (chip in contenitori, liste riordinabili con FLIP, tastiera completa: Invio prende, frecce scelgono, Invio posa), Flight.tsx (segni che volano da un Plot a un altro), Sketch.tsx (disegno a mano libera di una curva e punteggio di somiglianza; guarda la logica di disegno di src/widgets/m03-stima-intro-parametrica/ e copiala, non modificarla), Stem.tsx, Violin.tsx, Ribbon.tsx. Tutti con usePlot() dove stanno dentro un Plot, tastiera e nomi accessibili, test.`],
  ['shared-matematica', `Logica numerica comune, pura e testata, in src/widgets/engines/shared/math/: gaussiane (densita 1D e nD, misure fra due gaussiane: divergenza, Bhattacharyya, Jeffries-Matusita, Chernoff, errore di Bayes 1D esatto), algebra lineare simmetrica (2x2 e nxn: prodotto, inversa, determinante, autovalori e autovettori con Jacobi fino a n = 200, sbiancamento), classificatori 2D (soglia, retta, MDM, box, gaussiano/Bayes con prior e costi, K-NN, Parzen 2D, perceptron; funzione predict e campo delle regioni su griglia), stima non parametrica 2D (Parzen gaussiano sferico, K-NN con raggio; guarda src/widgets/m09-parzen-windows/griglia-normale-2d.ts e sigma-adattiva.ts: copia la logica, non modificare quei file), EM per misture gaussiane 1D e 2D (passo E, passo M, log-verosimiglianza, k-means come limite), proiezione 3D con algoritmo del pittore (camera orbitale, mesh di superfici z = f(x, y), ordinamento delle facce). Riusa src/lib/ml/ (stats.ts, nonparam.ts) importandolo, senza modificarlo. Ogni funzione con test su valori noti calcolati a mano o con node.`],
]
const sharedPhase = async () => {
  if (args && args.sharedDone) return { skipped: true }
  const built = await parallel(SHARED.map(([key, body]) => () => run(`base:${key}`, 'Base comune', `IL TUO COMPITO: una parte della base comune dei motori, src/widgets/engines/shared/ (leggi in docs/plan/engines.md la "Parte comune a tutti i motori" e la tabella "Pezzi che mancano al kit"). Tre agenti lavorano in parallelo su file disgiunti della stessa cartella: scrivi SOLO i tuoi file; index.ts di shared lo scrive chi ha i tipi (shared-tipi-e-grafici) ed esporta anche i file degli altri: se quando finisci un tuo file non e esportato, dillo nelle note (non riscrivere index.ts se non sei quell'agente). La base deve servire a TUTTI i 20 motori elencati in engines.md: guarda come la usano le sezioni dei motori prima di fissare le API.\n${body}\nScrivi alla fine ${ROOT}/docs/production/_engines/${key}.done con una riga di riepilogo, SOLO se test, tsc e oxlint passano.`)))
  const rev = await run('base:revisione', 'Base comune', `SEI IL REVISORE INDIPENDENTE della base comune dei motori src/widgets/engines/shared/, appena scritta da tre agenti in parallelo. NON modificare i file del progetto (scratchpad per i temporanei). Controlla con prove (test temporanei, node, comandi): (1) index.ts esporta tutto e i tre pezzi combaciano (tipi usati in modo coerente); (2) la matematica e giusta su valori noti (misure fra gaussiane, Jacobi, EM, classificatori, proiezione 3D); (3) le API bastano ai motori di docs/plan/engines.md (prendi 6 sezioni di motori diverse e controlla che trovino cio che servono); (4) accessibilita e tastiera delle maniglie (skill "ui-design:fixing-accessibility"); (5) niente colori letterali, niente animazioni di layout nei loop, listener e requestAnimationFrame ripuliti. Esiti dei costruttori: ${built.map((b, i) => `${SHARED[i][0]}: ${b ? `${b.ok ? 'ok' : 'NON ok'}; ${String(b.presetApi).slice(0, 600)}; note ${String(b.notes).slice(0, 500)}` : 'fallito'}`).join(' | ')}`, FINDINGS)
  if (!rev) return { built: built.map((b) => b && b.ok), reviewFailed: true }
  const findings = rev.findings
  const fix = findings.length ? await run('base:correzioni', 'Base comune', `SEI IL CORRETTORE della base comune src/widgets/engines/shared/. Per ogni rilievo: riproducilo (se non si riproduce scartalo spiegando perche), test di regressione che fallisce, correzione, test verde. Completa cio che i costruttori non hanno finito (vedi le loro note). Alla fine: npx vitest run src/widgets/engines/shared ; npx tsc -p tsconfig.app.json --noEmit ; npx oxlint src/widgets/engines/shared. Riporta l'output reale.\n\nRILIEVI (${findings.length}):\n${JSON.stringify(findings, null, 1)}`, FIX) : null
  return { built: built.map((b) => b && b.ok), findings: findings.length, fix: fix && fix.ok }
}
phase('Base comune')
const shared = await sharedPhase()
log(`Base comune: ${JSON.stringify(shared)}`)

const results = await pipeline(
  ENGINES.filter((e) => !DONE.has(e.name)),
  (e) => build(e),
  (b, e) => review(e, b).then((r) => ({ b, r })),
  ({ b, r }, e) => {
    if (!r) return { engine: e.name, ok: !!(b && b.ok), reviewFailed: true }
    const findings = r.findings
    if (!findings.length) return { engine: e.name, ok: !!(b && b.ok), findings: 0 }
    return fixIt(e, findings).then((f) => ({ engine: e.name, ok: !!(b && b.ok && f && f.ok), findings: findings.length, fixed: f && f.fixed.length, unresolved: f && f.unresolved, api: b && String(b.presetApi).slice(0, 600) }))
  },
)
return { halted: halted(), engines: results.filter(Boolean) }
