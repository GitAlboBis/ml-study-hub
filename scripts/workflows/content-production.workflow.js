export const meta = {
  name: 'ml-content-production',
  description: 'Produzione dei contenuti dei fogli (teoria MDX, formule, derivazioni, figure, pratica), integrazione con il validatore, poi revisori indipendenti (copertura, fedelta delle formule, logica e numeri) e correttore a giri fino a esaurimento. Ripristinabile con i marcatori in docs/production/<id>/.',
  whenToUse: 'Fase 6 del piano: args da node scripts/production-args.mjs <moduli>',
  phases: [
    { title: 'Pezzi', detail: 'teoria, formule A e B, derivazioni, figure, pratica 1 e 2, in parallelo per modulo' },
    { title: 'Integrazione', detail: 'data.ts, copertura, validatore PASS, formula-coverage, tsc' },
    { title: 'Revisione', detail: 'copertura sulle pagine, fedelta delle formule, logica e numeri; poi correttore; a giri' },
  ],
}

const ROOT = 'C:/Users/alber/MachineLearning-Study'
const MODS = (args && args.modules) || []
const CH2 = (m) => /^m(0[3-9]|10)-/.test(m.id)
const PROF = { melgani: 'Melgani', passerini: 'Passerini', ricci: 'Ricci' }
const MAX_ROUNDS = (m) => (args && args.maxRounds) || (CH2(m) ? 3 : 2)
const has = (m, stage) => (m.done || []).includes(stage)
const pages = (m) => m.sources.map((s) => `${s.doc} p.${s.pages[0]}-${s.pages[1]}`).join(' e ')
const pad = (n) => String(n).padStart(3, '0')
const imgs = (m) => m.sources.map((s) => `${ROOT}/_sources/pages/${s.doc}/p${pad(s.pages[0])}.png ... p${pad(s.pages[1])}.png`).join(' ; ')
const marker = (m, stage) => `ULTIMO PASSO (serve a riprendere il lavoro se la sessione si interrompe): SOLO se il tuo pezzo e completo e verificato, scrivi il file ${ROOT}/docs/production/${m.id}/${stage}.done con una riga di riepilogo (crea la cartella se manca). Se non e completo, NON scriverlo e dillo nelle note.`

const CTX = `PROGETTO: ${ROOT} (React 19 + Vite 8 + TypeScript 6 + MDX 3 + KaTeX, Windows 11, Node 22, Python 3.14 con PyMuPDF e Pillow). Web app di studio per l'esame orale di Machine Learning (Universita di Trento). Hai gia CLAUDE.md nel contesto; leggi docs/STATO.md solo se ti serve.
RICHIESTE DELL'UTENTE (vincolanti): non perdere NULLA delle fonti (concetti, informazioni, formule, passaggi logici), massima cura sul Cap. 2; spiegazioni in italiano con ogni termine tecnico anche in inglese; ogni concetto con un widget interattivo (i widget li scrive un altro workflow: tu li citi per id).
REGOLE PER TUTTI:
- NIENTE operazioni git. NON eseguire npm install ne npm run build (lo fa la sessione principale: agenti in parallelo si pestano dist/). Il server di sviluppo e gia acceso sulla porta 5173 (della sessione principale: non avviarne altri); per vedere una pagina usa node ${ROOT}/scripts/snap.mjs <percorso> <file.png> [--width 390 --dark --full] e apri il PNG con Read. Metti i PNG nello scratchpad, non nel repo.
- Scrivi SOLO i file del tuo compito. Altri agenti lavorano in parallelo sullo stesso repo (anche su altri moduli): errori di tsc in file non tuoi vanno ignorati e riferiti nelle note. Non toccare docs/inventory/.
- Se trovi gia i file del tuo compito (un tentativo precedente interrotto dal limite di sessione): NON ricominciare da zero, leggili, verificali e completali.
- Il JSON dell'inventario e grande: non leggerlo tutto con Read, estrai con node -e solo le parti che ti servono.
- Output finale: solo il riepilogo strutturato richiesto, onesto (ok=false se qualcosa non passa).`

const CONV = (m) => {
  const INV = `${ROOT}/docs/inventory/${m.id}.json`
  const MOD = `${ROOT}/src/content/modules/${m.id}`
  const derFiles = m.splitDerivations ? `derivations-a.ts ("export const derivationsA: Derivation[]", derivazioni ${m.derivationsA.join(', ')}) e derivations-b.ts ("export const derivationsB: Derivation[]", derivazioni ${m.derivationsB.join(', ')})` : `derivations.ts ("export const derivations: Derivation[]")`
  return `FOGLIO ${m.id} - "${m.title}"${m.titleEn ? ` (${m.titleEn})` : ""} - ${m.chapter}, prof. ${PROF[m.course]}.
Leggi prima ${ROOT}/docs/CONTENT_GUIDE.md (formato, regole MDX, md\`...\`, esempi verificati, rimandi interni) e src/content/types.ts. Foglio di riferimento gia completo e revisionato, da usare come modello di livello e di forma (non di contenuto): ${ROOT}/src/content/modules/m09-parzen-windows/ (guarda un paio di voci per file, non leggerlo tutto).
Inventario completo e verificato: ${INV} (${m.n.concepts} concetti, ${m.n.latex} stringhe LaTeX nei concetti, ${m.n.derivations} derivazioni, ${m.n.examples} esempi svolti, ${m.n.figures} figure di cui ${m.n.figuresImp2} con importanza >= 2, ${m.n.widgets} widget, ${m.n.exercises} esercizi, ${m.n.bank} domande della banca). Estrai con node -e, per esempio: node -e "const i=require('${INV}'); for (const c of i.concepts) console.log(c.id, c.kind, c.name, '|', c.nameEn)".
Pagine delle fonti: ${pages(m)}; immagini ${imgs(m)}; testo per pagina in ${ROOT}/_sources/src_text/<doc>.txt (marcatori "===== <doc> PAGE n ====="). Le formule delle slide sono immagini: la notazione si controlla sulle immagini.
Il foglio e scritto da piu agenti in parallelo, ognuno nei SUOI file dentro ${MOD}/. CONVENZIONI CONDIVISE (vincolanti, servono a far combaciare i pezzi):
- Formule: UNA voce Formula per OGNI stringa LaTeX di OGNI concetto dell'inventario (concepts[].latex), con id "f-<idConcetto>" per la prima, "f-<idConcetto>-2", "f-<idConcetto>-3"... per le successive. La LaTeX si copia dall'inventario (verificata sulle immagini) e si ritocca solo per un errore evidente, da annotare nelle note. importance = examRelevance del concetto (1-3). File: formulas-a.ts (concetti da ${m.formulasA[0]} a ${m.formulasA[1]}, nell'ordine dell'inventario) con "export const formulasA: Formula[]" e formulas-b.ts (da ${m.formulasB[0]} a ${m.formulasB[1]}) con "export const formulasB: Formula[]". Se un concetto non ha latex, niente voce.
- Derivazioni: id dell'inventario (der01...), tutti i passi dell'inventario con il loro perche, piu i passi intermedi che servono a seguirle. File ${derFiles}.
- Figure: id dell'inventario (fig01...), file "figures/${m.id}/<idFigura>.webp" in public/. File figures.ts ("export const figures: Figure[]"). Vengono ritagliate TUTTE le figure dell'inventario.
- Esempi svolti: id dell'inventario (ex01...), scritti come <Example id title> con <Step> nell'MDX.
- Widget: id dell'inventario, <Widget id="..."/> nell'MDX vicino al concetto che coprono (molti widget sono ancora in costruzione: la pagina mostra un segnaposto, va bene).
- Quiz dentro il testo: id "chk-01", "chk-02"... nel file checks.ts ("export const checks: QuizItem[]"), scritti dall'autore della teoria; gli altri quiz in quiz.ts con id "q-..." ("export const quiz: QuizItem[]").
- Pratica: flashcards.ts ("export const flashcards: Flashcard[]", id "fc-..."), quiz.ts, glossary.ts ("export const glossary: GlossaryEntry[]"), exam.ts ("export const exam: ExamQuestion[]", domande della banca con id "or-banca-1"..., le altre "or-..."), exercises.ts ("export const exercises: Exercise[]", id dell'inventario es01...).
- Ogni file importa da '../../types' (md, e i tipi con import type). data.ts lo scrive SOLO l'integratore.
- Nel testo visibile MAI codici interni (der04, f-c12-2, ex03, fig07, c12, es05): si scrive il nome della cosa e, se serve, un link [nome](#derivation:der04) (sezione "Rimandi interni" della guida).`
}

const TASK = {
  type: 'object',
  properties: {
    task: { type: 'string' },
    ok: { type: 'boolean' },
    filesTouched: { type: 'array', items: { type: 'string' } },
    counts: { type: 'string', description: 'quanti elementi hai scritto, per tipo' },
    skipped: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['task', 'ok', 'filesTouched', 'counts', 'notes'],
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
          evidence: { type: 'string', description: 'pagina della fonte e cosa dice, contro cosa dice il foglio' },
          fix: { type: 'string' },
        },
        required: ['title', 'file', 'severity', 'evidence', 'fix'],
      },
    },
    fine: { type: 'array', items: { type: 'string' } },
  },
  required: ['lens', 'findings'],
}
const FIX = {
  type: 'object',
  properties: {
    fixed: { type: 'array', items: { type: 'string' } },
    discarded: { type: 'array', items: { type: 'string' } },
    unresolved: { type: 'array', items: { type: 'string' } },
    gate: { type: 'string', description: 'output reale dei comandi di verifica' },
    ok: { type: 'boolean' },
  },
  required: ['fixed', 'discarded', 'unresolved', 'gate', 'ok'],
}

let failures = 0
const halted = () => failures >= 3
const run = async (label, phase, body, schema = TASK) => {
  if (halted()) return null
  const r = await agent(`${CTX}\n\n${body}`, { label, phase, schema })
  if (!r) {
    failures++
    log(`Agente fallito: ${label}${halted() ? ' - terzo fallimento: probabile limite di sessione, non lancio altri agenti' : ''}`)
  }
  return r
}
const brief = (r) => (r ? `${r.task} -> ${r.ok ? 'ok' : 'NON ok'}. ${r.counts || ''}. Note: ${String(r.notes).slice(0, 900)}` : 'agente fallito o saltato: controlla tu lo stato dei file')
const verifyKatex = (m, file) => `Verifica che ogni stringa compili: scrivi nello scratchpad un piccolo script .ts eseguito con npx tsx che importa ${ROOT}/src/content/modules/${m.id}/${file} e rende ogni LaTeX con katex.renderToString(..., { throwOnError: true }) (per i testi Rich usa extractMath di src/lib/rich.ts); poi npx tsc -p tsconfig.app.json --noEmit e controlla che non ci siano errori nei tuoi file.`

// ---------------------------------------------------------------------------------------------------
// Pezzi
// ---------------------------------------------------------------------------------------------------
const pieces = (m) => {
  const MOD = `${ROOT}/src/content/modules/${m.id}`
  const n = m.n.concepts
  const list = [
    ['teoria', `IL TUO PEZZO: ${MOD}/index.mdx, ${MOD}/checks.ts e ${MOD}/theory-map.json.
Invoca prima con il tool Skill "ui-design:stop-slop" (testo italiano chiaro, niente riempitivi).
index.mdx segue la sezione 2 della guida: ## Panoramica, poi una sezione (## o ###) per ogni gruppo di concetti NELL'ORDINE DELLE SLIDE, integrate con le note dove le note aggiungono, poi ## Collegamenti, ## Per l'orale. Ogni concetto dell'inventario va SPIEGATO per esteso nel testo (non solo nominato): ipotesi, condizioni, casi limite, interpretazione, con i numeri degli esempi; il detail dell'inventario e il minimo, non il massimo. Apri le immagini delle pagine mentre scrivi. Metti <Formula id="f-..."/> per ogni formula (tutte, con gli id della convenzione), <Derivation id/> per ogni derivazione, <Figure id/> per ogni figura dell'inventario, <Widget id/> per ognuno dei ${m.n.widgets} widget vicino al suo concetto, <Example id title> con i <Step> per ognuno dei ${m.n.examples} esempi svolti (dati e risultati completi dalla fonte), <Callout kind="esame"> con cio che chiedono i docenti (domande della banca), <Definition>, <Term en>, <SourceRef doc page> nei punti chiave, <ModLink> ai fogli collegati (crossLinks dell'inventario). Scrivi almeno ${Math.max(10, Math.round(n / 7))} quiz dentro il testo in checks.ts (id chk-NN), ognuno con <Check id/> nel punto giusto.
theory-map.json: { "<idConcetto>": ["#slug-della-sezione", "example:ex03", ...], ... } con OGNI concetto dell'inventario mappato almeno alla sezione in cui e spiegato (slug di GitHub: minuscole, spazi in trattini, punteggiatura tolta; controllalo con github-slugger). Serve all'integratore per la copertura.
Verifica che l'MDX compili con @mdx-js/mdx (compile con remark-gfm e remark-math; se require non funziona con ESM, usa un piccolo script .mjs nello scratchpad) e che checks.ts compili (npx tsc -p tsconfig.app.json --noEmit).`],
    ['formule-a', `IL TUO PEZZO: ${MOD}/formulas-a.ts con le formule dei concetti da ${m.formulasA[0]} a ${m.formulasA[1]} (una voce per ogni stringa LaTeX, secondo la convenzione). Ogni Formula: name e nameEn, latex dall'inventario, explain (cosa dice e perche, in italiano chiaro), symbols (OGNI simbolo non ovvio, con il significato), whenToUse, pitfalls dove ha senso, importance, source (pagine del concetto), e per importance 3 almeno un blank "completa la formula" con \\boxed{\\;?\\;} e 2-3 distrattori plausibili ma SBAGLIATI (errori tipici: fattore mancante, esponente sbagliato, segno). Apri le immagini delle pagine citate per scrivere explain e symbols con la notazione esatta. ${verifyKatex(m, 'formulas-a.ts')}`],
    ['formule-b', `IL TUO PEZZO: ${MOD}/formulas-b.ts con le formule dei concetti da ${m.formulasB[0]} a ${m.formulasB[1]} (una voce per ogni stringa LaTeX, secondo la convenzione). Ogni Formula: name e nameEn, latex dall'inventario, explain, symbols (ogni simbolo non ovvio), whenToUse, pitfalls dove ha senso, importance, source, e per importance 3 almeno un blank con \\boxed{\\;?\\;} e 2-3 distrattori plausibili ma sbagliati. Apri le immagini delle pagine citate. ${verifyKatex(m, 'formulas-b.ts')}`],
    ['derivazioni-a', `IL TUO PEZZO: ${MOD}/${m.splitDerivations ? 'derivations-a.ts' : 'derivations.ts'} con le derivazioni ${m.derivationsA.join(', ')}. Tutti i passi dell'inventario con il perche di ognuno; dove un passaggio salta dei conti, aggiungi i passi intermedi (e il loro perche) controllando le immagini delle pagine, soprattutto le note (part1/part2), che spesso contengono i passaggi che le slide saltano. Ricalcola tu ogni passaggio algebrico. goal, assumptions (ipotesi), conclusion, source. ${verifyKatex(m, m.splitDerivations ? 'derivations-a.ts' : 'derivations.ts')}`],
    ...(m.splitDerivations ? [['derivazioni-b', `IL TUO PEZZO: ${MOD}/derivations-b.ts con le derivazioni ${m.derivationsB.join(', ')}. Tutti i passi dell'inventario con il perche di ognuno; dove un passaggio salta dei conti, aggiungi i passi intermedi (e il loro perche) controllando le immagini delle pagine, soprattutto le note. Ricalcola tu ogni passaggio algebrico. goal, assumptions (ipotesi), conclusion, source. ${verifyKatex(m, 'derivations-b.ts')}`]] : []),
    ['figure', `IL TUO PEZZO: ${MOD}/figures.ts e i ritagli di TUTTE le ${m.n.figures} figure dell'inventario. Controlla prima lo spazio su disco (PowerShell Get-PSDrive C; fermati sotto 1 GB). Per ogni figura: python scripts/fig.py grid <doc> <pagina> per vedere le coordinate, poi python scripts/fig.py crop <doc> <pagina> x0 y0 x1 y1 public/figures/${m.id}/<idFigura>.webp, e APRI il WebP con Read per controllare che il ritaglio contenga tutta la figura con le sue etichette e niente testo della slide intorno (rifallo finche non e pulito). caption (Rich: cosa mostra e il messaggio da ricordare, con i termini EN), alt (descrizione di cio che si vede: assi, curve, messaggio), source. Verifica con npx tsc -p tsconfig.app.json --noEmit.`],
    ['pratica-1', `IL TUO PEZZO: ${MOD}/flashcards.ts, ${MOD}/quiz.ts, ${MOD}/glossary.ts. Invoca prima con il tool Skill "ui-design:stop-slop".
Soglie (sezione 6 della guida, con ${n} concetti): flashcard >= ${Math.max(20, Math.round(n * 0.7))}; quiz in quiz.ts >= ${Math.max(20, Math.round(n * 0.45))} (l'autore della teoria ne scrive altri in checks.ts), di tutti e quattro i tipi (mcq, multi, tf, numeric), con almeno 5 vero/falso e almeno 4 numerici con numeri realistici; glossario >= 25 voci IT/EN. Distribuisci la pratica su TUTTI i concetti (campo concepts dei quiz; le flashcard coprono formule, definizioni, confronti, intuizioni, procedure). Ogni risposta corretta dev'essere DAVVERO l'unica corretta: ricontrolla ogni mcq/multi/tf sulla fonte. Per i numerici ricalcola tu il risultato con node. ${verifyKatex(m, 'flashcards.ts, quiz.ts e glossary.ts')}`],
    ['pratica-2', `IL TUO PEZZO: ${MOD}/exam.ts e ${MOD}/exercises.ts. Invoca prima con il tool Skill "ui-design:stop-slop".
exam: le ${m.n.bank} domande della banca dell'inventario con fromBank: true e bankText VERBATIM dall'inventario (id or-banca-1..${m.n.bank}), piu almeno ${Math.max(4, Math.round(n / 12))} domande d'orale tue sulle parti piu chieste; ognuna con qEn, prof, risposta modello in prima persona come la direbbe lo studente (completa: formule, ipotesi, intuizione, esempio), checklist di almeno 3 punti, domande di approfondimento con risposta.
exercises: TUTTI i ${m.n.exercises} esercizi dell'inventario (id es01...), generativi con rng (mai Math.random): parametri random realistici, soluzione passo passo con i numeri, nessun NaN per nessun seed, tolleranze sensate; i concettuali e le dimostrazioni hanno comunque una risposta numerica o una scelta verificabile quando possibile, altrimenti una soluzione completa. Verificali con uno script tsx nello scratchpad su 20 seed (prompt, answers, solution: niente NaN, LaTeX che compila). ${verifyKatex(m, 'exam.ts ed exercises.ts')}`],
  ]
  return list.map(([key, body]) => ({ key, body: `${CONV(m)}\n\n${body}\n${marker(m, key)}` }))
}

// ---------------------------------------------------------------------------------------------------
// Integrazione, revisione, correzione
// ---------------------------------------------------------------------------------------------------
const integratePrompt = (m, results) => `${CONV(m)}

SEI L'INTEGRATORE del foglio ${m.id}. Gli altri pezzi sono stati scritti da agenti in parallelo; esiti:
${results.map(brief).join('\n')}

1. Controlla che ci siano tutti i file dei pezzi (index.mdx, checks.ts, theory-map.json, formulas-a.ts, formulas-b.ts, ${m.splitDerivations ? 'derivations-a.ts, derivations-b.ts' : 'derivations.ts'}, figures.ts, flashcards.ts, quiz.ts, glossary.ts, exam.ts, exercises.ts). Se un pezzo manca o e incompleto (agente fallito), SCRIVILO tu seguendo le convenzioni.
2. Scrivi src/content/modules/${m.id}/data.ts con defineModule, come quello di m09: id, title, titleEn, course, chapter, order (posizione nel manifest, da 1), sources dal manifest (docs/plan/modules.json); prerequisites e connections dai crossLinks dell'inventario (solo id di moduli del manifest); estimatedMinutes realistico; summary (6-10 frasi dense, con le formule chiave) e keyPoints (8-15) scritti da te dopo aver letto index.mdx; glossary, formulas ([...formulasA, ...formulasB]), derivations${m.splitDerivations ? ' ([...derivationsA, ...derivationsB])' : ''}, figures, flashcards, quiz ([...checks, ...quiz]), exam, exercises importati dai file dei pezzi; widgets: TUTTI i ${m.n.widgets} widget dell'inventario come { id, title, concepts }; coverage.
3. coverage: generala con uno script nello scratchpad a partire da theory-map.json (sezioni ed esempi), dagli id f-<concetto> delle formule, dalle derivazioni (campo concepts dell'inventario), dai widget (concepts dell'inventario), dalle figure mostrate nell'MDX, dagli esercizi, dai quiz (campo concepts) e dalle domande d'esame; scrivila come letterale in data.ts. Ogni concetto deve avere una sezione di teoria, un widget (salvo noWidgetReason) e, se e di tipo formula, formula o derivazione.
4. Esegui npx tsx scripts/validate-module.ts ${m.id} e correggi finche stampa PASS, correggendo il file giusto (anche quelli degli altri pezzi): se manca contenuto, SCRIVILO, non togliere mai nulla per far passare il validatore. Poi npx tsx scripts/formula-coverage.ts ${m.id}: per ogni formula dell'inventario non ritrovata, aggiungila dove manca o verifica a mano che sia presente in forma equivalente (e annotalo in data.ts accanto alla formula).
5. npx tsc -p tsconfig.app.json --noEmit senza errori nei file del foglio. Poi guarda la pagina: node ${ROOT}/scripts/snap.mjs m/${m.id}/teoria <scratchpad>/teoria.png --full --wait 4000 e node ${ROOT}/scripts/snap.mjs m/${m.id}/riassunto <scratchpad>/riassunto.png; apri i PNG con Read (se il PNG e altissimo, guardane dei pezzi con --scroll "<selettore>"): niente formule rotte in rosso, niente errori di console stampati dallo script. Correggi cio che vedi.
${marker(m, 'integrazione')}`

const lenses = (m) => {
  const MOD = `${ROOT}/src/content/modules/${m.id}`
  return [
    ['copertura', `SEI IL REVISORE DI COPERTURA, indipendente e severo. PRIMA di aprire il foglio, apri con Read OGNI immagine delle pagine ${pages(m)} e fai la tua checklist pagina per pagina (definizioni, formule, ipotesi, proprieta, passi, osservazioni, esempi numerici, grafici, confronti, parole evidenziate, note a margine). Poi leggi ${MOD}/index.mdx e i file .ts e cerca: concetti presenti solo di nome, dettagli persi, spiegazioni vaghe o sbagliate, esempi senza numeri o senza risultato, dimostrazioni senza passaggi, formule senza legenda dei simboli, figure mancanti o mal ritagliate (apri i WebP in public/figures/${m.id}/), domande d'orale con risposte deboli o incomplete, termini inglesi mancanti, codici interni visibili nel testo, italiano da riempitivo. NON modificare i file.`],
    ['formule', `SEI IL REVISORE DELLA FEDELTA DELLE FORMULE${CH2(m) ? ' (primo di due, come richiesto dall utente per il Cap. 2)' : ''}. Per ogni latex in formulas-a.ts, formulas-b.ts, derivations*.ts, checks.ts, quiz.ts, flashcards.ts, exam.ts, exercises.ts e per ogni $...$ di index.mdx, apri l'immagine della pagina citata e confronta simbolo per simbolo (pedici, apici, estremi di somme e integrali, cappelli, grassetti, trasposte, inverse, fattori, segni, condizioni). Esegui anche npx tsx scripts/formula-coverage.ts ${m.id} e controlla ogni formula segnalata. Controlla che i blank e i distrattori siano corretti (il distrattore non deve essere anch'esso giusto) e che le legende dei simboli dicano il vero. NON modificare i file.`],
    ['logica', `SEI IL ${CH2(m) ? 'SECONDO REVISORE MATEMATICO' : 'REVISORE DI LOGICA E NUMERI'}. Ricalcola tu (con node quando servono conti): i passaggi delle derivazioni (errori di segno e di fattore, passi che non seguono, ipotesi mancanti), i numeri degli esempi svolti e dei quiz numerici, le soluzioni degli esercizi generativi su 5 seed (esegui generate con createRng di src/lib/rng.ts), le risposte corrette di mcq, multi e tf (sono davvero corrette? ci sono piu risposte giuste?), la coerenza tra flashcard, risposte d'orale e fonte. Controlla che le ipotesi di ogni risultato siano scritte e che le affermazioni della teoria siano vere. NON modificare i file.`],
  ]
}

const reviewPrompt = (m, lensBody, round, prior) => `${CONV(m)}

${lensBody}
${round > 1 ? `\nQUESTO E IL GIRO ${round} DI REVISIONE. Nei giri precedenti un correttore ha gia gestito questi rilievi (corretti o scartati con motivo): NON ripeterli se sono stati davvero sistemati; segnala invece quelli sistemati male e tutto cio che nessuno ha ancora visto.\n${prior}` : ''}
Riporta solo difetti DIMOSTRATI (pagina della fonte e riga del foglio). Gravita: critico = contenuto sbagliato o risposta corretta sbagliata; alto = concetto, formula, passaggio o esempio della fonte mancante o travisato; medio = spiegazione incompleta o ambigua, legenda mancante, figura tagliata male; basso = stile. In "fine" elenca cio che hai controllato e trovato giusto.`

const fixPrompt = (m, findings, round) => `${CONV(m)}

SEI IL CORRETTORE DEL FOGLIO ${m.id} (giro ${round}). Applica TUTTI i rilievi qui sotto verificandoli sulle immagini delle pagine (scarta solo quelli sbagliati, spiegando perche). Aggiungi cio che manca, non togliere contenuto corretto. Se aggiungi concetti alla teoria, aggiorna la coverage in data.ts.
Alla fine: npx tsx scripts/validate-module.ts ${m.id} deve stampare PASS; npx tsx scripts/formula-coverage.ts ${m.id} deve stampare OK oppure ogni formula segnalata deve essere verificata a mano come presente; npx tsc -p tsconfig.app.json --noEmit senza errori nei file del foglio; node ${ROOT}/scripts/snap.mjs m/${m.id}/teoria <scratchpad>/t.png senza errori di console. Riporta l'output reale in gate.
Scrivi anche il resoconto ${ROOT}/docs/reports/content/${m.id}.md: aggiungi in coda una sezione "## Giro ${round}" con i rilievi corretti, scartati (con motivo) e irrisolti (crea il file e la cartella se mancano).
${marker(m, `revisione-${round}`)}

RILIEVI (${findings.length}):
${JSON.stringify(findings, null, 1)}`

const MATERIAL = new Set(['critico', 'alto', 'medio'])

const produce = async (m) => {
  const out = { id: m.id }
  // 1. pezzi
  const todo = pieces(m).filter((p) => !has(m, p.key))
  const res = await parallel(todo.map((p) => () => run(`${p.key}:${m.id}`, 'Pezzi', p.body)))
  out.pieces = res.map((r, i) => ({ key: todo[i].key, ok: !!(r && r.ok), counts: r && r.counts }))
  if (halted()) return { ...out, stopped: 'pezzi' }
  // 2. integrazione
  if (!has(m, 'integrazione')) {
    const integ = await run(`integrazione:${m.id}`, 'Integrazione', integratePrompt(m, res))
    out.integration = integ && { ok: integ.ok, counts: integ.counts, notes: String(integ.notes).slice(0, 600) }
    if (!integ) return { ...out, stopped: 'integrazione' }
  }
  // 3. giri di revisione fino a esaurimento
  const handled = []
  out.rounds = []
  for (let round = 1; round <= MAX_ROUNDS(m); round++) {
    if (has(m, `revisione-${round}`)) { out.rounds.push({ round, skipped: true }); continue }
    if (halted()) return { ...out, stopped: `revisione-${round}` }
    const prior = handled.length ? JSON.stringify(handled.slice(-80)) : ''
    const revs = await parallel(lenses(m).map(([lens, body]) => () => run(`rev-${lens}-${round}:${m.id}`, 'Revisione', reviewPrompt(m, body, round, prior), FINDINGS)))
    // un revisore fallito (limite di sessione) non vale come "nessun rilievo": il giro si rifa alla ripresa
    if (revs.some((r) => !r)) return { ...out, stopped: `revisione-${round}` }
    const findings = revs.flatMap((r) => r.findings.map((f) => ({ ...f, lens: r.lens })))
    const material = findings.filter((f) => MATERIAL.has(f.severity))
    log(`${m.id} giro ${round}: ${findings.length} rilievi, ${material.length} materiali`)
    if (!findings.length) { out.rounds.push({ round, findings: 0, clean: true }); break }
    const fix = await run(`correzioni-${round}:${m.id}`, 'Revisione', fixPrompt(m, findings, round), FIX)
    out.rounds.push({ round, findings: findings.length, material: material.length, fixed: fix && fix.fixed.length, unresolved: fix && fix.unresolved, ok: fix && fix.ok, gate: fix && String(fix.gate).slice(0, 500) })
    if (!fix) return { ...out, stopped: `correzioni-${round}` }
    handled.push(...findings.map((f) => ({ title: f.title, file: f.file, severity: f.severity })))
    if (!material.length) break
  }
  return { ...out, complete: true }
}

log(`Produzione contenuti: ${MODS.map((m) => m.id.split('-')[0]).join(', ')} (giri massimi: Cap. 2 = 3, altri = 2)`)
const results = await parallel(MODS.map((m) => () => produce(m)))
return { halted: halted(), failures, results: results.filter(Boolean) }
