export const meta = {
  name: 'ml-widgets-production',
  description: 'Produzione dei widget dei fogli: lotti di widget per modulo (preset dei motori o widget su misura), ognuno implementato, verificato con screenshot, revisionato da un revisore indipendente e corretto. Ripristinabile con i marcatori docs/production/<modulo>/w-<widgetId>.done',
  whenToUse: 'Fase 7 del piano, dopo i motori; args: { modules: [{ id, title, widgets: [{ id, engine }] }] }',
  phases: [
    { title: 'Implementazione', detail: 'un agente per lotto: preset o widget su misura, test, screenshot' },
    { title: 'Revisione', detail: 'revisore indipendente per lotto: matematica, storyboard, screenshot nei due temi e a 390px, tastiera' },
    { title: 'Correzione', detail: 'applica i rilievi dimostrati' },
  ],
}

const ROOT = 'C:/Users/alber/MachineLearning-Study'
const MODS = (args && args.modules) || []
const PER_ENGINE = (args && args.perEngineBatch) || 6
const PER_CUSTOM = (args && args.perCustomBatch) || 3

const CTX = `PROGETTO: ${ROOT} (React 19 + Vite 8 + TypeScript 6 + Tailwind 4 + motion 13 da 'motion/react' + d3 7, Windows 11, Node 22). Web app di studio per l'esame orale di Machine Learning (Universita di Trento). L'utente vuole per OGNI concetto un widget interattivo e ANIMATO con un esempio REALE di machine learning, fedele alla specifica dell'inventario. Hai gia CLAUDE.md nel contesto.
LEGGI PRIMA: ${ROOT}/docs/WIDGET_GUIDE.md (tutto), ${ROOT}/docs/plan/engines.md, e la guida del motore che usi in ${ROOT}/docs/engines/<motore>.md; src/widgets/types.ts, src/widgets/registry.ts, src/widgets/kit/ e kit/plot/ (elenco e i pezzi che usi), src/lib/ml/*, src/lib/datasets/*, docs/plan/cast.md. Widget di riferimento: src/widgets/m09-parzen-windows/m09-somma-dei-kernel.widget.tsx (motore density1d), src/widgets/m08-non-parametrica-knn/m08-cella-che-si-espande.widget.tsx e src/widgets/m03-stima-intro-parametrica/m03-campioni-che-rivelano-la-pdf.widget.tsx (scritti a mano), e il widget di riferimento del motore che usi (in docs/engines/<motore>.md). Quello e il livello di qualita richiesto.
SPECIFICA di un widget: node -e "const i=require('${ROOT}/docs/inventory/<moduleId>.json'); const w=i.widgets.find(w=>w.id==='<id>'); console.log(JSON.stringify(w,null,1)); for (const c of i.concepts.filter(c=>w.concepts.includes(c.id))) console.log(JSON.stringify({id:c.id,name:c.name,nameEn:c.nameEn,detail:c.detail,latex:c.latex,symbols:c.symbols}))" (storyboard, interactions, visual, aha, formulasShown, challenge, e il latex dei concetti: la notazione delle formule vive si copia da li).
MONDO VISIVO: "Atlante in falso colore", ogni widget un terreno vivo. NESSUN colore letterale: solo token (var(--token) in SVG e style, utility dei token in className; colori per ruolo in src/widgets/kit/plot/colors.ts e marks.ts). Angoli vivi, niente gradienti, niente vetro, niente emoji come icone.
SKILL: prima di scrivere il moto invoca con il tool Skill "ui-design:emil-design-eng" e "ui-design:svg-animations"; prima dei grafici "dataviz". Per le API di motion, d3, Testing Library usa Context7 (ToolSearch "context7").
CONTRATTO: src/widgets/<moduleId>/<widgetId>.widget.tsx esporta "meta" (WidgetMeta annotato, meta.id = nome del file, concepts = concetti dell'inventario, scenario = chiave del cast, scenarioNote, size) e il componente di default; con un motore: <widgetId>.preset.ts accanto; logica non banale in un .ts accanto con test; test del widget <widgetId>.test.tsx (rendering, tastiera, stato dopo N passi, valore della formula viva, criterio della sfida). Ogni widget: scenario reale del cast con badge "dati sintetici"; animazione didattica controllabile (Play, Pausa, Passo, Velocita, Reset) e a passi con reduced motion; formula viva con i valori sostituiti nella notazione del docente; valori in Readout; sfida (Challenge) con criterio calcolato; tastiera completa; funziona a 390px.
REGOLE:
- NIENTE operazioni git. NON eseguire npm install ne npm run build. NON modificare src/widgets/kit/ ne i motori (src/widgets/engines/): se un motore non basta per un widget, scrivi il widget su misura con il kit (eventualmente riusando pezzi del motore importandoli dal suo index.ts) e dillo nelle note. NON toccare src/content/modules/ ne docs/inventory/. Altri agenti lavorano in parallelo sullo stesso repo (anche nella stessa cartella di modulo): scrivi solo i file dei TUOI widget; errori in file non tuoi vanno ignorati e riferiti.
- Se trovi gia file dei tuoi widget (tentativo precedente interrotto): leggili, verificali e completali, non ricominciare.
- Verifica per ogni widget: npx vitest run src/widgets/<moduleId>/<widgetId> ; npx tsc -p tsconfig.app.json --noEmit ; npx oxlint src/widgets/<moduleId>. Poi la verifica visiva (il server di sviluppo e acceso sulla porta 5173 della sessione principale: non avviarne altri): node ${ROOT}/scripts/snap.mjs lab/<widgetId> <scratchpad>/<id>-d.png --width 1280 --height 900 ; lo stesso con --width 390 --height 844 ; con --dark ; e a meta animazione con --click "<nome accessibile del pulsante Play>" --wait 2500. Apri i PNG con Read, leggi gli errori di console che lo script stampa e correggi cio che vedi (sovrapposizioni, testo tagliato, grafico vuoto, formula rotta, scorrimento orizzontale).
- Accessibilita: tastiera ovunque, focus visibile, nomi accessibili, aria-live="polite" sui valori che si fermano (non a ogni frame), bersagli >= 40px, nessun significato affidato al solo colore. Niente animazioni di proprieta di layout nei loop, niente setState per frame su tutto l'albero, canvas per i campi densi. Opzioni lunghe dei Segmented da accorciare; chiavi React uniche.
- Codice: ESM, niente punto e virgola, apici singoli, commenti in italiano come nei file esistenti.
- Output finale: solo il riepilogo strutturato richiesto, onesto (ok=false se qualcosa non passa; in skipped i widget non finiti con il motivo).`

const TASK = {
  type: 'object',
  properties: {
    task: { type: 'string' },
    ok: { type: 'boolean' },
    done: { type: 'array', items: { type: 'string' }, description: 'id dei widget completati e verificati (test, tsc, screenshot)' },
    skipped: { type: 'array', items: { type: 'string' } },
    filesTouched: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['task', 'ok', 'done', 'filesTouched', 'notes'],
}
const FINDINGS = {
  type: 'object',
  properties: {
    lens: { type: 'string' },
    findings: { type: 'array', items: { type: 'object', properties: { widget: { type: 'string' }, title: { type: 'string' }, file: { type: 'string' }, severity: { type: 'string', enum: ['critico', 'alto', 'medio', 'basso'] }, evidence: { type: 'string' }, fix: { type: 'string' } }, required: ['widget', 'title', 'file', 'severity', 'evidence', 'fix'] } },
    fine: { type: 'array', items: { type: 'string' } },
  },
  required: ['lens', 'findings'],
}
const FIX = {
  type: 'object',
  properties: { fixed: { type: 'array', items: { type: 'string' } }, discarded: { type: 'array', items: { type: 'string' } }, unresolved: { type: 'array', items: { type: 'string' } }, gate: { type: 'string' }, ok: { type: 'boolean' } },
  required: ['fixed', 'discarded', 'unresolved', 'gate', 'ok'],
}

let failures = 0
const halted = () => failures >= 3
const run = async (label, phase, body, schema = TASK, opts = {}) => {
  if (halted()) return null
  const r = await agent(`${CTX}\n\n${body}`, { label, phase, schema, ...opts })
  if (!r) { failures++; log(`Agente fallito: ${label}`) }
  return r
}

// lotti: widget dello stesso motore insieme; i su misura in lotti piu piccoli
const batchesOf = (m) => {
  const todo = m.widgets.filter((w) => !(m.done || []).includes(`w-${w.id}`) && !(m.built || []).includes(w.id))
  const byEngine = {}
  for (const w of todo) (byEngine[w.engine || 'custom'] = byEngine[w.engine || 'custom'] || []).push(w)
  const out = []
  for (const [engine, ws] of Object.entries(byEngine)) {
    const size = engine === 'custom' ? PER_CUSTOM : PER_ENGINE
    for (let i = 0; i < ws.length; i += size) out.push({ module: m, engine, widgets: ws.slice(i, i + size) })
  }
  return out
}
const describeBatch = (b) => b.widgets.map((w) => `${w.id}${w.engine ? ` (motore ${w.engine})` : ' (su misura)'}`).join(', ')
const markerRule = (b) => `ULTIMO PASSO: per ogni widget completato e verificato (test verdi, tsc senza errori nei tuoi file, screenshot controllati), scrivi il file ${ROOT}/docs/production/${b.module.id}/w-<widgetId>.done con una riga di riepilogo (crea la cartella se manca). Non scriverlo per i widget non finiti.`

const implement = (b, i) => run(`widget:${b.module.id.split('-')[0]}-${i + 1}`, 'Implementazione', `IL TUO COMPITO: implementare i widget del foglio ${b.module.id} ("${b.module.title}") elencati qui sotto, nell'ordine, in src/widgets/${b.module.id}/.
WIDGET DEL TUO LOTTO: ${describeBatch(b)}
Per ognuno leggi la specifica completa nell'inventario ${ROOT}/docs/inventory/${b.module.id}.json e i concetti coperti con detail e latex. Con un motore: scrivi il preset seguendo docs/engines/<motore>.md; se il motore non rende fedelmente lo storyboard, le interazioni o la sfida, scrivi il widget su misura (dillo nelle note). Meglio pochi widget veri e completi che molti abbozzati: se non riesci a finirli tutti, riporta in skipped quelli che restano, con il motivo.
${markerRule(b)}`)

const reviewB = (b, impl, i) => run(`revisione:${b.module.id.split('-')[0]}-${i + 1}`, 'Revisione', `SEI IL REVISORE INDIPENDENTE di un lotto di widget del foglio ${b.module.id}: ${b.widgets.map((w) => w.id).join(', ')} (in src/widgets/${b.module.id}/). NON modificare i file del progetto; file temporanei solo nello scratchpad. Ogni difetto va DIMOSTRATO (screenshot aperto con Read, test temporaneo, comando) con l'output osservato; niente gusti personali.
Esito dell'implementatore: ${impl ? `completati ${impl.done.join(', ') || 'nessuno'}; saltati ${(impl.skipped || []).join('; ') || 'nessuno'}; note: ${String(impl.notes).slice(0, 800)}` : 'implementatore fallito: controlla quali file esistono'}
Per OGNI widget del lotto:
1. FEDELTA: confronta con la specifica dell'inventario (storyboard passo per passo, interazioni con i loro range, visual, formula viva, sfida, scenario reale): manca un passo, un'interazione, uno strato, la sfida? E un difetto alto.
2. MATEMATICA: la formula viva e nella notazione del docente (latex dei concetti)? I numeri mostrati sono giusti (ricalcola con node alcuni valori dalla logica)? Il criterio della sfida e corretto?
3. SCREENSHOT: node ${ROOT}/scripts/snap.mjs lab/<id> <scratchpad>/<id>.png a 1280x900 e a 390x844, giorno e --dark, e a meta animazione (--click sul pulsante Play e --wait 2500): leggibilita, sovrapposizioni, testo tagliato, grafico vuoto, scorrimento orizzontale, errori di console stampati dallo script.
4. TASTIERA E MOTO: Tab arriva a tutti i controlli con focus visibile; reduced motion (--reduced) mostra stati a passi; niente animazioni di layout nei loop.
Gravita: critico = widget rotto o matematica sbagliata; alto = parte della specifica mancante o travisata; medio = leggibilita, tastiera, 390px; basso = stile. Se un widget del lotto non esiste, e un difetto critico con fix "implementarlo".`, FINDINGS, { effort: 'medium' })

const fixB = (b, findings, i) => run(`correzioni:${b.module.id.split('-')[0]}-${i + 1}`, 'Correzione', `SEI IL CORRETTORE di un lotto di widget del foglio ${b.module.id}: ${describeBatch(b)}. Per ogni rilievo: verificalo (se non si riproduce, scartalo spiegando perche), correggi, test di regressione dove ha senso, ricontrolla con gli screenshot. Se un widget del lotto manca del tutto, implementalo. Alla fine esegui e riporta l'output reale di: npx vitest run src/widgets/${b.module.id} ; npx tsc -p tsconfig.app.json --noEmit ; npx oxlint src/widgets/${b.module.id} ; e gli screenshot dei widget corretti senza errori di console.
${markerRule(b)}

RILIEVI (${findings.length}):
${JSON.stringify(findings, null, 1)}`, FIX)

const all = MODS.flatMap((m) => batchesOf(m))
log(`Widget: ${all.reduce((s, b) => s + b.widgets.length, 0)} da produrre in ${all.length} lotti su ${MODS.length} fogli`)
const results = await pipeline(
  all,
  (b, _, i) => implement(b, i),
  (impl, b, i) => reviewB(b, impl, i).then((r) => ({ impl, r })),
  ({ impl, r }, b, i) => {
    const findings = r ? r.findings : []
    const base = { module: b.module.id, widgets: b.widgets.map((w) => w.id), done: impl ? impl.done : [], skipped: impl ? impl.skipped : ['implementatore fallito'], reviewFailed: !r }
    if (!r) return base
    if (!findings.length) return { ...base, findings: 0 }
    return fixB(b, findings, i).then((f) => ({ ...base, findings: findings.length, fixed: f && f.fixed.length, unresolved: f && f.unresolved, ok: f && f.ok }))
  },
)
return { halted: halted(), failures, batches: results.filter(Boolean) }
