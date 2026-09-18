# ML Study Hub: piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. In questo progetto il lavoro a scala (Fasi 1, 6, 7, 9) gira con il tool Workflow: un agente per unità di lavoro, revisori indipendenti, cicli fino a esaurimento. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire una web app React/Vite enorme e interattiva che copra il 100% delle 8 fonti del notebook NotebookLM "Machine Learning Oral Exam Question Bank" (Melgani, Passerini, Ricci): riassunti, teoria completa, tutte le formule e dimostrazioni, esempi svolti, figure, un widget animato con esempio reale di ML per ogni concetto, esercizi generati, flashcard, quiz, giochi e simulatore dell'orale.

**Architecture:** SPA statica. Ogni modulo (50) è una cartella con `data.ts` (dati tipizzati: formule, derivazioni, figure, flashcard, quiz, domande d'orale, esercizi generativi, mappa di copertura) e `index.mdx` (teoria narrativa con componenti), più i widget React in `src/widgets/<modulo>/`. Un inventario JSON per modulo (Fase 1) elenca ogni concetto atomico delle fonti con pagina; un validatore impone che ogni concetto sia mappato a un punto preciso dell'app e che ogni formula compili. Contenuti e widget si producono con pipeline multi-agente: autore → validatore → revisori indipendenti → correzione, fino a quando i revisori non trovano più nulla.

**Tech Stack:** React 19, Vite 8, TypeScript 6, React Router 7 (data router), MDX 3 (`@mdx-js/rollup`) con remark-gfm, remark-math, rehype-katex, rehype-slug; KaTeX 0.18; marked (testi `Rich`); Tailwind CSS 4 (`@tailwindcss/vite`) sopra token CSS; motion 13 (`motion/react`); d3 7 (scale, shape, array); zustand 5 (persist); minisearch 7; vitest 5 + Testing Library; Playwright 1.63 (screenshot e smoke); Python 3.14 + PyMuPDF + Pillow (figure e pagine sorgente).

## Global Constraints

- Progetto: `C:\Users\alber\MachineLearning-Study`. Fonti estratte in `_sources/` (git-ignored). I PDF originali non si toccano.
- Lingua: UI e spiegazioni in italiano; ogni termine tecnico con l'inglese alla prima occorrenza, es. "stima a massima verosimiglianza (Maximum Likelihood Estimation, MLE)"; ogni domanda d'orale ha anche `qEn`; glossario IT↔EN.
- Copertura: il 100% dei concetti di `docs/inventory/<id>.json` compare in `coverage` del modulo con destinazioni valide (gate G2). Le pagine di ogni intervallo sono citate da almeno un concetto (gate G1).
- Interattività: ogni concetto è coperto da almeno un widget animato con scenario del cast `docs/plan/cast.md`; eccezioni solo con `noWidgetReason` scritto nell'inventario.
- Formule: trascritte dalle immagini delle pagine con la notazione del docente (vettori `\mathbf`, cappelli, estremi di somme); ogni stringa LaTeX compila con KaTeX `throwOnError: true`.
- Dati dei widget: sintetici, RNG a seed (`createRng`), etichettati "dati sintetici" nella UI.
- Motion: `prefers-reduced-motion` sostituisce le animazioni con stati a passi; animazioni didattiche sempre controllabili (Play, Pausa, Passo, Velocità, Reset); transizioni UI 150-300 ms; nessuna animazione di proprietà di layout nei loop (solo transform/opacity su DOM, canvas per campi densi).
- Accessibilità: contrasto WCAG 2.2 AA in entrambi i temi, focus visibile, widget e flashcard usabili da tastiera, `aria-live="polite"` sui valori numerici che cambiano.
- Temi: chiaro e scuro via token CSS; nei componenti nessun colore letterale.
- Nessun backend: progressi in localStorage (zustand persist) con export/import JSON.
- Disco C: quasi pieno (4,7 GB liberi dopo la pulizia della cache npm del 2026-09-17). Figure e pagine sorgente in WebP; eseguire `Get-PSDrive C` prima di Fase 3.6, 7 e 9; fermarsi sotto 1 GB liberi.
- Dipendenze: solo quelle del Tech Stack. Una dipendenza nuova va motivata nel task.
- Lavoro in git: un commit per task completato, messaggi in inglese convenzionali (`feat:`, `content:`, `widget:`, `fix:`, `docs:`).

---

## Mappa dei file

```
MachineLearning-Study/
  PRODUCT.md                      contesto di prodotto (impeccable)
  DESIGN.md                       sistema visivo (scritto a fine Fase 9 dal documenter)
  docs/
    plan/modules.json             manifest dei 50 moduli con intervalli di pagina (FATTO)
    plan/cast.md                  scenari reali condivisi (FATTO)
    plan/moduli/<id>.md           checklist per modulo generata dall'inventario (Task 1.3)
    inventory/<id>.json           inventario atomico dei concetti (Fase 1)
    reports/                      report di copertura e revisione
    superpowers/plans/            questo piano
  _sources/                       testo, OCR NotebookLM e PNG delle pagine (git-ignored)
  scripts/
    check-inventory.mjs           validatore inventario (FATTO)
    page-coverage.mjs             gate G1: pagine citate
    gen-module-checklists.mjs     inventario -> docs/plan/moduli/*.md
    fig.py                        griglia, ritaglio e pagina intera -> WebP
    build-source-pages.py         _sources/pages -> public/sources/<doc>/pNNN.webp
    validate-module.ts            gate G2-G6 per modulo
    coverage-report.ts            report globale concetti -> app
    snap-widget.mjs               screenshot Playwright di un widget (desktop, mobile, chiaro, scuro)
    bank-check.ts                 gate G7: domande della banca mappate
  public/
    figures/<moduleId>/<figId>.webp
    sources/<doc>/pNNN.webp
  src/
    main.tsx, router.tsx
    styles/tokens.css, base.css, prose.css, katex.css
    content/
      types.ts                    contratto dei dati di modulo
      manifest.ts                 import tipizzato di docs/plan/modules.json
      registry.ts                 loader lazy di data.ts e index.mdx
      exam-bank.ts                domande reali della banca con modulo di appartenenza
      modules/<id>/data.ts
      modules/<id>/index.mdx
    lib/
      rng.ts, rich.ts, srs.ts, slug.ts, format.ts
      ml/                         algoritmi numerici usati dai widget (con test)
      datasets/                   generatori dei dati sintetici del cast
    components/
      content/                    componenti MDX: Formula, Derivation, Figure, Widget, Example, Step, Callout, Definition, KeyIdea, Reveal, Proof, Check, SourceRef, ModLink, Term, Columns, Col
      practice/                   FlashcardDeck, QuizRunner, ExamCard, ExerciseRunner, DerivationOrder
      ui/                         Button, Tabs, Dialog, Tooltip, Kbd, ProgressRing, Badge, CommandPalette
      layout/                     AppShell, Sidebar, TopBar, ModuleHeader, Toc
    widgets/
      types.ts, registry.ts
      kit/                        WidgetFrame, controlli, primitive di plot, hook di animazione
      <moduleId>/<widgetId>.widget.tsx
    pages/
      Home, CourseMap, CoursePage, ModulePage, Formulario, Flashcards, QuizArena, OralSimulator,
      Games (FormulaMatch, FillFormula, ProofOrder, TrueFalseSprint, WhoAmI, ExerciseGym, ConceptSort),
      Glossary, SourceViewer, WidgetLab, Progress, Coverage, Settings
    store/progress.ts
```

---

## Gate di qualità contro la perdita di contenuti

| Gate | Cosa garantisce | Come si verifica |
|---|---|---|
| G0 | Inventario valido: JSON, LaTeX compilabile, ogni concetto con widget | `node scripts/check-inventory.mjs` stampa PASS per 50 moduli |
| G1 | Nessuna pagina saltata | `node scripts/page-coverage.mjs`: ogni pagina di ogni intervallo è citata da almeno un concetto, salvo pagine marcate `vuota` (copertina, indice, solo immagine decorativa) |
| G2 | Ogni concetto dell'inventario ha un posto nell'app | `validate-module.ts`: chiavi di `coverage` = id dei concetti; ogni destinazione esiste |
| G3 | Ogni formula compila e segue la fonte | `validate-module.ts` (KaTeX `throwOnError`) + revisore "fedeltà formule" con le immagini |
| G4 | Pratica sufficiente | `validate-module.ts`: soglie di flashcard, quiz, esercizi, domande d'orale proporzionali ai concetti |
| G5 | Ogni widget dell'inventario esiste e funziona | registry + `snap-widget.mjs` senza errori di console + revisione visiva |
| G6 | Figure presenti | `validate-module.ts`: ogni figura con importanza ≥ 2 dell'inventario ha un file in `public/figures` |
| G7 | Ogni domanda reale della banca è nell'app | `npx tsx scripts/bank-check.ts` |
| G8 | Build pulita | `npm run build`, `npx vitest run`, `npm run lint` senza errori |

---

## Skill per fase

| Fase | Skill | Perché |
|---|---|---|
| 1 Inventario | `workflow-authoring` | orchestrazione multi-agente con revisori |
| 2 Design | `ui-design:impeccable` (init già fatto con PRODUCT.md, poi new-work), `ui-design:ui-ux-pro-max` | direzione visiva, palette e font con dati |
| 3 Infrastruttura | `ui-design:test-driven-development`, `ecc:vite-patterns` | contratti con test prima del codice |
| 4 Kit widget | `ui-design:emil-design-eng`, `ui-design:svg-animations`, `ecc:motion-foundations`, `dataviz`, `ui-design:fixing-motion-performance` | motion con criterio, grafici leggibili, 60 fps |
| 5 Shell | `ui-design:impeccable`, `ui-design:21st-ui-build` + connettori (21st.dev, Magic UI, ui-layouts, shadcn), `ecc:react-patterns`, `ui-design:ux-copy` | componenti da cercare prima di scriverli, microcopy italiana chiara |
| 6 Contenuti | `ui-design:stop-slop`, `ui-design:avoid-ai-writing` | testi italiani chiari, senza riempitivi |
| 7 Widget | `ui-design:svg-animations`, `ecc:motion-patterns`, `ui-design:improve-animations` | animazioni didattiche coerenti |
| 8 Giochi e orale | `ui-design:emil-design-eng`, `ecc:frontend-a11y` | interazioni da tastiera e feedback |
| 9 Revisione | `ui-design:21st-ui-review`, `ui-design:baseline-ui`, `ui-design:fixing-accessibility`, `ui-design:improve-animations`, `ui-design:lighthouse`, `ui-design:verification-before-completion`, `impeccable detect` + finish reviewer + documenter | chiusura verificata nel browser |

Skill da proporre all'utente come comando (invocazione del modello disattivata): `/ui-design:review-animations` dopo la Fase 7, `/ui-design:prototype` per varianti della pagina modulo.

---

## Ordine e parallelismo

```
F0 fondamenta (fatto) ─┬─> F1 inventario (in corso) ─┬─> F6 contenuti ─┬─> F8 giochi/orale ─> F9 revisione ─> F10 consegna
                       ├─> F2 design ─┬─> F4 kit+widget di riferimento ─┴─> F7 widget ──────────┘
                       └─> F3 infrastruttura ────────┴─> F5 shell ─────────────────────────────┘
```

- F2 e F3 partono mentre F1 gira.
- F4 e F5 procedono in parallelo dopo F2 e F3.
- F6 parte dopo F3 con un pilota (m09 Parzen), poi Cap. 2 completo (priorità dell'utente), poi il resto.
- F7 parte dopo i 3 widget di riferimento di F4.

---

## Fase 0: Fondamenta e fonti

Stato: task 0.1-0.4 completati il 2026-09-17.

### Task 0.1: Estrazione delle fonti (FATTO)

**Files:** `_sources/nlm_text/*.txt` (8 fonti da NotebookLM via `nlm source content`), `_sources/src_text/<doc>.txt` (testo per pagina via PyMuPDF), `_sources/pages/<doc>/pNNN.png` (601 pagine renderizzate), `_sources/tools/extract_pages.py`, `_sources/tools/render_pages.py`.

- [x] Scaricare il testo delle 8 fonti del notebook `10fdbe31-2011-4f2e-ac28-f87b60d8318c`.
- [x] Estrarre il testo per pagina da `part1`, `part2`, `ch1`-`ch4`, `dl`, `examq`.
- [x] Renderizzare tutte le pagine in PNG (zoom 1.5-1.6).

### Task 0.2: Scaffold del progetto (FATTO)

- [x] `npx create-vite MachineLearning-Study --template react-ts --no-interactive`.
- [x] Installare: `react-router@7 @mdx-js/react katex zustand motion d3 minisearch marked rehype-slug github-slugger` e in dev `@mdx-js/rollup @mdx-js/mdx remark-math rehype-katex remark-gfm unist-util-visit @types/mdx @types/d3 @types/katex tsx`.

### Task 0.3: Manifest dei moduli e cast (FATTO)

- [x] `docs/plan/modules.json`: 50 moduli (22 Melgani, 14 Passerini, 14 Ricci) con `id`, `course`, `chapter`, `title`, `titleEn`, `sources[{doc,pages:[da,a]}]`.
- [x] `docs/plan/cast.md`: 14 scenari.

### Task 0.4: Validatore dell'inventario (FATTO)

- [x] `scripts/check-inventory.mjs`: JSON valido, caratteri di controllo da escape errati, campi obbligatori, `kind` ammessi, KaTeX su ogni `latex`, ogni concetto coperto da un widget o con `noWidgetReason`, avvisi se < 15 concetti o > 15% senza widget.

### Task 0.5: Git e ignore

**Files:** Modify `.gitignore`

- [ ] **Step 1:** Aggiungere a `.gitignore`:

```
_sources/
.impeccable/review/
playwright-report/
test-results/
```

- [ ] **Step 2:** Verificare che `_sources` non sia tracciato.

Run: `git status --short | grep _sources`
Expected: nessun output

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite react app, module manifest and inventory validator"
```

---

## Fase 1: Inventario atomico dei concetti

### Task 1.1: Workflow di inventario (IN CORSO, run `wf_af66d7eb-250`)

**Files:** Create `docs/inventory/<id>.json` × 50

**Interfaces:**
- Produces: formato inventario (campi `concepts[].id|name|nameEn|kind|sourcePages|detail|latex|symbols|examRelevance|noWidgetReason`, `derivations[]`, `workedExamples[]`, `figures[]`, `widgets[].id|title|concepts|scenario|realExample|storyboard|interactions|visual|aha|formulasShown|challenge|size|tech`, `exercises[]`, `examQuestions[].text|prof|concepts`, `crossLinks[]`, `gaps[]`). Tutte le fasi successive leggono questo formato.

Pipeline per modulo (3 agenti):
1. **Inventario:** legge testo e OGNI immagine di pagina, scompone in concetti atomici, trascrive le formule dalle immagini, progetta i widget, estrae le domande della banca.
2. **Completezza:** revisore indipendente che costruisce la propria checklist pagina per pagina prima di aprire l'inventario, poi aggiunge ciò che manca (`addedBy: "revisore"`).
3. **Formule e widget:** confronta ogni LaTeX con l'immagine della pagina simbolo per simbolo; riscrive i widget vaghi; prefissa gli id dei widget con il prefisso del modulo.

- [ ] **Step 1:** Attendere la notifica di fine workflow.
- [ ] **Step 2:** Verificare G0.

Run: `node scripts/check-inventory.mjs`
Expected: 50 righe `PASS`, exit code 0

- [ ] **Step 3:** Per ogni modulo in `failedIds` rilanciare solo quel modulo con `resumeFromRunId` dopo aver corretto la causa (leggere `journal.jsonl` prima di diagnosticare).

### Task 1.2: Gate G1, copertura delle pagine

**Files:** Create `scripts/page-coverage.mjs`

- [ ] **Step 1: Scrivere lo script**

```js
// scripts/page-coverage.mjs — ogni pagina di ogni intervallo deve essere citata da almeno un concetto
import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve(import.meta.dirname, '..')
const modules = JSON.parse(fs.readFileSync(path.join(root, 'docs/plan/modules.json'), 'utf8'))
const cited = new Map() // "doc:page" -> Set(moduleId)
const expected = new Map()
for (const m of modules) {
  for (const s of m.sources) for (let p = s.pages[0]; p <= s.pages[1]; p++) expected.set(`${s.doc}:${p}`, m.id)
  const file = path.join(root, 'docs/inventory', m.id + '.json')
  if (!fs.existsSync(file)) { console.log(`MANCA inventario ${m.id}`); continue }
  const inv = JSON.parse(fs.readFileSync(file, 'utf8'))
  const refs = [
    ...inv.concepts.flatMap((c) => c.sourcePages),
    ...inv.derivations.flatMap((d) => d.sourcePages ?? []),
    ...inv.workedExamples.flatMap((e) => e.sourcePages ?? []),
    ...inv.figures.map((f) => ({ doc: f.doc, page: f.page })),
    ...(inv.emptyPages ?? []),
  ]
  for (const r of refs) {
    const k = `${r.doc}:${r.page}`
    if (!cited.has(k)) cited.set(k, new Set())
    cited.get(k).add(m.id)
  }
}
const missing = [...expected.keys()].filter((k) => !cited.has(k))
missing.forEach((k) => console.log(`PAGINA NON CITATA ${k} (modulo ${expected.get(k)})`))
console.log(`${expected.size - missing.length}/${expected.size} pagine citate`)
process.exit(missing.length ? 1 : 0)
```

- [ ] **Step 2: Eseguire**

Run: `node scripts/page-coverage.mjs`
Expected: `601/601 pagine citate` circa (conteggio esatto = pagine uniche negli intervalli), exit 0. Le pagine non citate vanno aperte: se hanno contenuto, un agente aggiunge i concetti al modulo indicato; se sono copertina, indice o vuote, si aggiunge `{"doc","page","reason"}` a `emptyPages` dell'inventario.

- [ ] **Step 3: Commit** `git add scripts/page-coverage.mjs docs/inventory && git commit -m "docs: concept inventory for 50 modules with page coverage gate"`

### Task 1.3: Deduplica ai confini e checklist per modulo

**Files:** Create `scripts/gen-module-checklists.mjs`, `docs/plan/moduli/<id>.md` × 50, `docs/reports/inventario.md`

- [ ] **Step 1:** Workflow "confini": per ogni coppia di moduli adiacenti dello stesso corso un agente legge i due inventari e segna i concetti duplicati: il concetto resta nel modulo la cui pagina di slide lo introduce e nell'altro diventa `{"seeAlso": "<moduleId>:<conceptId>"}` (il validatore accetta come copertura un `ModLink`). Verifica anche che gli id dei widget siano unici nel corso.
- [ ] **Step 2:** Scrivere `gen-module-checklists.mjs`, che per ogni inventario produce `docs/plan/moduli/<id>.md` con: overview, tabella dei concetti (id, nome IT/EN, tipo, pagine, rilevanza) con due checkbox (contenuto, widget), elenco widget con storyboard, figure da ritagliare, derivazioni, esempi, domande della banca.
- [ ] **Step 3:** Generare `docs/reports/inventario.md`: totali per modulo e per corso (concetti, formule, widget S/M/L, figure, domande), stima degli agenti delle Fasi 6-7.
- [ ] **Step 4:** Mostrare all'utente il report con i numeri e i widget più ambiziosi per corso.
- [ ] **Step 5: Commit** `git commit -m "docs: per-module checklists and inventory report"`

---

## Fase 2: Direzione di design (impeccable)

### Task 2.1: Direzione visiva scelta con l'utente

**Files:** Create `.impeccable/config.json`, surface brief via `impeccable surface-brief write`

- [ ] **Step 1:** PRODUCT.md esiste (scritto il 2026-09-17 dalle risposte dell'utente). Modalità della superficie principale: **Read** (pagina modulo) con aree **Operate** (giochi, flashcard, simulatore).
- [ ] **Step 2:** Seguire `reference/new-work.md` sezione "Create or replace the visual world": nominare il meccanismo unico, la scena d'uso reale (studio lungo alla scrivania, anche di sera), sette sistemi visivi del mondo dello studente (quaderno di esercizi di analisi, lavagna d'aula con gesso colorato, strumenti di laboratorio e oscilloscopi, tavole di notazione matematica, carte da gioco/flashcard, mappe di sistemi a blocchi, poster scientifici). Almeno tre famiglie materiali diverse.
- [ ] **Step 3:** Eseguire `C:\Users\alber\.claude\plugins\cache\claude-ui-toolchain\ui-design\1.0.1\skills\impeccable\scripts\impeccable.cmd concept-seed --scope direction --mode read` e seguire l'output.
- [ ] **Step 4:** Presentare le direzioni sulla decision page (`impeccable serve-question --start --payload <file>`), aprirla nel browser, attendere la scelta con `--wait --key <key>`.
- [ ] **Step 5:** Scrivere il direction contract (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM con seed key, FINISH) con `impeccable surface-brief write src/pages/ModulePage.tsx <body>`. Rileggerlo e verificare i sei blocchi.
- [ ] **Step 6: Commit** `git commit -m "docs: visual direction contract"`

### Task 2.2: Token di design e tipografia

**Files:** Create `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/prose.css`, `src/styles/katex.css`; Modify `src/main.tsx`, `index.html`, `vite.config.ts`

**Interfaces:**
- Produces: variabili CSS usate da tutti i componenti e widget:
  - superfici e testo: `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--accent`, `--accent-contrast`, `--focus`
  - semantici: `--ok`, `--warn`, `--error`, `--info`
  - corsi: `--course-melgani`, `--course-passerini`, `--course-ricci`
  - viz per ruolo: `--viz-class-1` … `--viz-class-6`, `--viz-sample`, `--viz-estimate`, `--viz-truth`, `--viz-kernel`, `--viz-boundary`, `--viz-grid`, `--viz-highlight`, `--viz-negative`, `--viz-positive`
  - tipografia: `--font-display`, `--font-body`, `--font-mono`, scala `--step--1` … `--step-5`
  - spazi: `--space-1` … `--space-10`; raggi `--radius-s|m|l`; ombre `--shadow-1|2`
  - motion: `--dur-fast: 150ms`, `--dur-base: 240ms`, `--dur-slow: 420ms`, `--ease-out: cubic-bezier(.2,.8,.2,1)`, `--ease-in-out: cubic-bezier(.65,0,.35,1)`
- Tailwind 4 legge i token con `@theme inline { --color-bg: var(--bg); ... }`.

- [ ] **Step 1:** Consultare Context7 (`/websites/tailwindcss`) per `@tailwindcss/vite` e `@theme inline` sulla versione installata.
- [ ] **Step 2:** `npm install tailwindcss @tailwindcss/vite` e aggiungere `tailwind()` ai plugin di Vite.
- [ ] **Step 3:** Scrivere i token dalla direzione scelta: palette completa chiara su `:root`, scura in `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` e in `:root[data-theme="dark"] {…}`. Colori viz verificati per daltonismo (deuteranopia) con la skill `dataviz` (validatore della palette).
- [ ] **Step 4:** `prose.css`: misura di lettura ~68ch, ritmo verticale, stili di `h2/h3`, tabelle con scroll orizzontale nel proprio contenitore, KaTeX display con `overflow-x: auto`.
- [ ] **Step 5:** Font da Google Fonts o `@fontsource` (dipendenza motivata: funzionamento offline). Fallback espliciti.
- [ ] **Step 6: Verifica**

Run: `npm run build`
Expected: build riuscita, CSS con le variabili dei due temi

- [ ] **Step 7: Commit** `git commit -m "feat: design tokens, typography and theme"`

---

## Fase 3: Infrastruttura dei contenuti

### Task 3.1: Test runner

**Files:** Create `vitest.config.ts`; Modify `package.json`

- [ ] **Step 1:** `npm install -D vitest @testing-library/react @testing-library/user-event jsdom`
- [ ] **Step 2:** `vitest.config.ts`:

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'], globals: false },
}))
```

- [ ] **Step 3:** Script in `package.json`: `"test": "vitest run"`, `"validate": "tsx scripts/validate-module.ts"`, `"coverage:concepts": "tsx scripts/coverage-report.ts"`.
- [ ] **Step 4: Commit** `git commit -m "chore: vitest setup"`

### Task 3.2: Contratto dei dati di modulo

**Files:** Create `src/content/types.ts`

**Interfaces:**
- Produces: tutti i tipi sotto. Usati da `data.ts` di ogni modulo, dal validatore, dai componenti MDX, dalle pagine globali e dai giochi.

- [ ] **Step 1: Scrivere il file**

```ts
// src/content/types.ts
export type CourseId = 'melgani' | 'passerini' | 'ricci'
export type DocId = 'part1' | 'part2' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'dl' | 'examq'
export type Prof = 'Melgani' | 'Passerini' | 'Ricci' | 'Assistant'
/** Markdown con matematica KaTeX: $inline$ e $$display$$. */
export type Rich = string
/** LaTeX puro, senza delimitatori $. */
export type Latex = string

export interface PageRef { doc: DocId; page: number }
export interface SourceRange { doc: DocId; pages: [number, number] }

export interface GlossaryEntry { term: string; en: string; def: Rich }
export interface SymbolDef { s: Latex; meaning: Rich }

/** Variante "completa la formula": masked contiene \boxed{\;?\;} al posto di answer. */
export interface FormulaBlank { masked: Latex; answer: Latex; distractors: Latex[] }

export interface Formula {
  id: string
  name: string
  nameEn: string
  latex: Latex
  explain: Rich
  symbols: SymbolDef[]
  whenToUse?: Rich
  pitfalls?: Rich
  /** 3 = da saper scrivere a memoria all'orale */
  importance: 1 | 2 | 3
  blanks: FormulaBlank[]
  source: PageRef[]
}

export interface DerivationStep { latex: Latex; why: Rich }
export interface Derivation {
  id: string
  title: string
  goal: Rich
  assumptions?: Rich
  steps: DerivationStep[]
  conclusion: Rich
  source: PageRef[]
}

export interface Figure { id: string; file: string; caption: Rich; alt: string; source: PageRef }

interface QuizBase { id: string; q: Rich; explanation: Rich; difficulty: 1 | 2 | 3; concepts: string[] }
export type QuizItem =
  | (QuizBase & { type: 'mcq'; options: Rich[]; answer: number })
  | (QuizBase & { type: 'multi'; options: Rich[]; answers: number[] })
  | (QuizBase & { type: 'tf'; answer: boolean })
  | (QuizBase & { type: 'numeric'; answer: number; tolerance: number; unit?: string })

export type FlashcardKind = 'definizione' | 'formula' | 'intuizione' | 'confronto' | 'proprieta' | 'procedura'
export interface Flashcard { id: string; q: Rich; a: Rich; kind: FlashcardKind }

export interface ExamQuestion {
  id: string
  q: Rich
  qEn: string
  prof: Prof
  fromBank: boolean
  /** testo verbatim della banca domande quando fromBank è true */
  bankText?: string
  answer: Rich
  checklist: string[]
  followUps: { q: Rich; a: Rich }[]
}

export interface Rng {
  next(): number
  int(min: number, max: number): number
  float(min: number, max: number, decimals?: number): number
  normal(mu?: number, sigma?: number): number
  pick<T>(xs: readonly T[]): T
  shuffle<T>(xs: readonly T[]): T[]
}
export interface ExerciseAnswer { label: string; value: number; tolerance: number }
export interface ExerciseInstance { prompt: Rich; answers: ExerciseAnswer[]; solution: Rich }
export interface Exercise {
  id: string
  title: string
  difficulty: 1 | 2 | 3
  kind: 'numerico' | 'concettuale' | 'dimostrazione'
  concepts: string[]
  generate: (rng: Rng) => ExerciseInstance
}

export interface WidgetRef { id: string; title: string; concepts: string[] }

/**
 * Destinazioni di copertura:
 * "#slug-titolo" (sezione MDX), "example:<id>", "formula:<id>", "derivation:<id>", "widget:<id>",
 * "figure:<id>", "quiz:<id>", "flashcard:<id>", "exam:<id>", "exercise:<id>", "seeAlso:<moduleId>#<slug>"
 */
export type CoverageTarget = string

export interface ModuleData {
  id: string
  title: string
  titleEn: string
  course: CourseId
  chapter: string
  order: number
  sources: SourceRange[]
  prerequisites: string[]
  estimatedMinutes: number
  summary: Rich
  keyPoints: Rich[]
  glossary: GlossaryEntry[]
  formulas: Formula[]
  derivations: Derivation[]
  figures: Figure[]
  flashcards: Flashcard[]
  quiz: QuizItem[]
  exam: ExamQuestion[]
  exercises: Exercise[]
  widgets: WidgetRef[]
  connections: { to: string; why: Rich }[]
  /** chiave = id del concetto nell'inventario (c01…) */
  coverage: Record<string, CoverageTarget[]>
}

export const defineModule = (m: ModuleData): ModuleData => m
/** Tag per scrivere LaTeX senza raddoppiare i backslash: md`\hat{\mu} = \frac{1}{N}` */
export const md = String.raw
```

- [ ] **Step 2: Verifica**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: nessun errore

- [ ] **Step 3: Commit** `git commit -m "feat: module data contract"`

### Task 3.3: RNG a seed

**Files:** Create `src/lib/rng.ts`, Test `src/lib/rng.test.ts`

**Interfaces:**
- Consumes: `Rng` da `src/content/types.ts`
- Produces: `createRng(seed: number): Rng`

- [ ] **Step 1: Test che fallisce**

```ts
import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('è deterministico per seed', () => {
    const a = createRng(42), b = createRng(42)
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()])
  })
  it('int rispetta gli estremi inclusi', () => {
    const r = createRng(1)
    const xs = Array.from({ length: 2000 }, () => r.int(3, 5))
    expect(Math.min(...xs)).toBe(3)
    expect(Math.max(...xs)).toBe(5)
  })
  it('normal ha media e varianza corrette', () => {
    const r = createRng(7)
    const xs = Array.from({ length: 20000 }, () => r.normal(2, 3))
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length
    const v = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length
    expect(mean).toBeCloseTo(2, 1)
    expect(Math.sqrt(v)).toBeCloseTo(3, 1)
  })
  it('shuffle non perde elementi', () => {
    expect(createRng(3).shuffle([1, 2, 3, 4]).sort()).toEqual([1, 2, 3, 4])
  })
})
```

- [ ] **Step 2:** Run `npx vitest run src/lib/rng.test.ts`. Expected: FAIL, modulo `./rng` non trovato.
- [ ] **Step 3: Implementazione**

```ts
import type { Rng } from '../content/types'

export function createRng(seed: number): Rng {
  let s = seed >>> 0 || 0x9e3779b9
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  let spare: number | null = null
  const normal = (mu = 0, sigma = 1) => {
    if (spare !== null) { const z = spare; spare = null; return mu + sigma * z }
    let u = 0
    while (u === 0) u = next()
    const v = next()
    const r = Math.sqrt(-2 * Math.log(u))
    spare = r * Math.sin(2 * Math.PI * v)
    return mu + sigma * r * Math.cos(2 * Math.PI * v)
  }
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    float: (min, max, decimals) => {
      const x = min + next() * (max - min)
      return decimals === undefined ? x : Number(x.toFixed(decimals))
    },
    normal,
    pick: (xs) => xs[Math.floor(next() * xs.length)],
    shuffle: (xs) => {
      const a = [...xs]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
  }
}
```

- [ ] **Step 4:** Run `npx vitest run src/lib/rng.test.ts`. Expected: 4 PASS.
- [ ] **Step 5: Commit** `git commit -m "feat: seeded rng"`

### Task 3.4: Renderer dei testi Rich (Markdown + KaTeX)

**Files:** Create `src/lib/rich.ts`, `src/components/content/Rich.tsx`, `src/components/content/M.tsx`; Test `src/lib/rich.test.ts`

**Interfaces:**
- Produces: `extractMath(src: Rich): { tex: Latex; display: boolean }[]`, `renderTex(tex: Latex, display: boolean, throwOnError?: boolean): string`, `renderRich(src: Rich, opts?: { inline?: boolean; throwOnError?: boolean }): string`, componenti `<Rich text={…} inline? />` e `<M tex={…} display? />`.

- [ ] **Step 1: Test che fallisce**

```ts
import { describe, expect, it } from 'vitest'
import { extractMath, renderRich, renderTex } from './rich'

describe('rich', () => {
  it('estrae inline e display', () => {
    expect(extractMath('a $x_1$ b $$\\frac{1}{N}$$')).toEqual([
      { tex: '\\frac{1}{N}', display: true },
      { tex: 'x_1', display: false },
    ].sort((p, q) => Number(q.display) - Number(p.display)))
  })
  it('gli underscore nella matematica non diventano corsivo', () => {
    const html = renderRich('stima $\\hat{\\mu}_{ML} = x_1 + x_2$ con **grassetto**')
    expect(html).toContain('katex')
    expect(html).toContain('<strong>grassetto</strong>')
    expect(html).not.toContain('<em>')
  })
  it('throwOnError segnala LaTeX rotto', () => {
    expect(() => renderTex('\\frac{1}', false, true)).toThrow()
  })
})
```

- [ ] **Step 2:** Run `npx vitest run src/lib/rich.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementazione**

```ts
import katex from 'katex'
import { Marked } from 'marked'
import type { Latex, Rich } from '../content/types'

const MATH = /\$\$([\s\S]+?)\$\$|\$((?:\\\$|[^$\n])+?)\$/g
const marked = new Marked({ gfm: true, breaks: false })

export function extractMath(src: Rich): { tex: Latex; display: boolean }[] {
  const out: { tex: Latex; display: boolean }[] = []
  for (const m of src.matchAll(MATH)) out.push({ tex: (m[1] ?? m[2]).trim(), display: m[1] !== undefined })
  return out.sort((p, q) => Number(q.display) - Number(p.display))
}

export function renderTex(tex: Latex, display: boolean, throwOnError = false): string {
  return katex.renderToString(tex, { displayMode: display, throwOnError, strict: 'ignore', output: 'htmlAndMathml' })
}

export function renderRich(src: Rich, opts: { inline?: boolean; throwOnError?: boolean } = {}): string {
  const chunks: string[] = []
  const protectedSrc = src.replace(MATH, (_m, display: string | undefined, inline: string | undefined) => {
    chunks.push(renderTex((display ?? inline ?? '').trim(), display !== undefined, opts.throwOnError))
    return `@@MATH${chunks.length - 1}@@`
  })
  const html = opts.inline ? (marked.parseInline(protectedSrc) as string) : (marked.parse(protectedSrc) as string)
  return html.replace(/@@MATH(\d+)@@/g, (_m, i: string) => chunks[Number(i)])
}
```

```tsx
// src/components/content/Rich.tsx
import { useMemo } from 'react'
import { renderRich } from '../../lib/rich'
import type { Rich as RichText } from '../../content/types'

export function Rich({ text, inline = false, className }: { text: RichText; inline?: boolean; className?: string }) {
  const html = useMemo(() => renderRich(text, { inline }), [text, inline])
  const Tag = inline ? 'span' : 'div'
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
```

```tsx
// src/components/content/M.tsx
import { useMemo } from 'react'
import { renderTex } from '../../lib/rich'

export function M({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(() => renderTex(tex, display), [tex, display])
  return <span className={display ? 'math-display' : 'math-inline'} dangerouslySetInnerHTML={{ __html: html }} />
}
```

- [ ] **Step 4:** Run `npx vitest run src/lib/rich.test.ts`. Expected: 3 PASS.
- [ ] **Step 5: Commit** `git commit -m "feat: rich text renderer with katex"`

### Task 3.5: Pipeline MDX in Vite

**Files:** Modify `vite.config.ts`; Create `src/mdx.d.ts`

- [ ] **Step 1:** `vite.config.ts`:

```ts
import mdx from '@mdx-js/rollup'
import tailwind from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeSlug, [rehypeKatex, { strict: 'ignore' }]],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwind(),
  ],
  build: { chunkSizeWarningLimit: 1500 },
})
```

- [ ] **Step 2:** `src/mdx.d.ts`: `declare module '*.mdx' { import type { MDXProps } from 'mdx/types'; export default function MDXContent(props: MDXProps): JSX.Element }`
- [ ] **Step 3:** Modulo di prova `src/content/modules/_prova/index.mdx` con `$\hat{\mu}$`, `$$\sum_{k=1}^{N}$$` e `<Callout kind="tip">…</Callout>`; importarlo in `App.tsx`.
- [ ] **Step 4:** Run `npm run build`. Expected: build OK; nel bundle HTML KaTeX (`class="katex"`).
- [ ] **Step 5:** Rimuovere `_prova`. **Commit** `git commit -m "feat: mdx pipeline with math"`

### Task 3.6: Strumenti per figure e pagine sorgente

**Files:** Create `scripts/fig.py`, `scripts/build-source-pages.py`

**Interfaces:**
- Produces (CLI usata dagli agenti della Fase 6):
  - `python scripts/fig.py grid <doc> <page>` → `_sources/grid/<doc>-p<page>.png` con griglia 10×10 etichettata (0.0-1.0) sopra la pagina
  - `python scripts/fig.py crop <doc> <page> <x0> <y0> <x1> <y1> <out.webp>` coordinate in frazioni 0-1, render vettoriale a zoom 3, WebP q82, larghezza max 1400 px
  - `python scripts/fig.py full <doc> <page> <out.webp>`

- [ ] **Step 1: `scripts/fig.py`**

```python
import sys, os
import pymupdf
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '_sources', 'tools'))
from extract_pages import SOURCES

def render(doc, page, clip=None, zoom=3.0):
    d = pymupdf.open(SOURCES[doc]); p = d[page - 1]
    r = p.rect
    rect = None if clip is None else pymupdf.Rect(r.x0 + clip[0] * r.width, r.y0 + clip[1] * r.height, r.x0 + clip[2] * r.width, r.y0 + clip[3] * r.height)
    pix = p.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=rect)
    return Image.frombytes('RGB', (pix.width, pix.height), pix.samples)

def save_webp(img, out):
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    if img.width > 1400:
        img = img.resize((1400, round(img.height * 1400 / img.width)), Image.LANCZOS)
    img.save(out, 'WEBP', quality=82, method=6)
    print(f'{out} {img.width}x{img.height} {os.path.getsize(out)//1024}KB')

cmd = sys.argv[1]
if cmd == 'grid':
    doc, page = sys.argv[2], int(sys.argv[3])
    img = render(doc, page, zoom=1.5); dr = ImageDraw.Draw(img)
    for i in range(1, 10):
        x = img.width * i / 10; y = img.height * i / 10
        dr.line([(x, 0), (x, img.height)], fill=(255, 0, 0), width=1)
        dr.line([(0, y), (img.width, y)], fill=(255, 0, 0), width=1)
        dr.text((x + 2, 2), f'{i/10:.1f}', fill=(255, 0, 0)); dr.text((2, y + 2), f'{i/10:.1f}', fill=(255, 0, 0))
    out = f'_sources/grid/{doc}-p{page}.png'; os.makedirs('_sources/grid', exist_ok=True); img.save(out); print(out)
elif cmd == 'crop':
    doc, page = sys.argv[2], int(sys.argv[3]); x0, y0, x1, y1 = map(float, sys.argv[4:8])
    save_webp(render(doc, page, (x0, y0, x1, y1)), sys.argv[8])
elif cmd == 'full':
    save_webp(render(sys.argv[2], int(sys.argv[3]), zoom=2.0), sys.argv[4])
```

- [ ] **Step 2: Verifica**

Run: `python scripts/fig.py crop ch2 55 0.05 0.2 0.95 0.9 public/figures/_test/w.webp`
Expected: stampa percorso, dimensioni e KB; aprendo il file con Read si vede il grafico dell'effetto della larghezza della finestra. Poi eliminare `public/figures/_test`.

- [ ] **Step 3: `scripts/build-source-pages.py`**: per ogni PNG in `_sources/pages/<doc>/`, ridimensiona a larghezza 1000 e salva `public/sources/<doc>/pNNN.webp` q70. Stampa i MB totali. Controllare `Get-PSDrive C` prima e dopo (atteso < 70 MB).
- [ ] **Step 4: Commit** `git commit -m "feat: figure cropping and source page tooling"`

### Task 3.7: Validatore di modulo (gate G2, G3, G4, G6)

**Files:** Create `scripts/validate-module.ts`, `src/content/manifest.ts`

**Interfaces:**
- Consumes: `ModuleData`, `extractMath`, `renderTex`, `createRng`, `docs/inventory/<id>.json`, `docs/plan/modules.json`
- Produces: CLI `npx tsx scripts/validate-module.ts <moduleId>` → stampa `PASS <id>` oppure `FAIL <id>` con elenco errori, exit code 0/1. Gli agenti della Fase 6 la eseguono fino al PASS.

- [ ] **Step 1: Scrivere il validatore**

```ts
// scripts/validate-module.ts
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { compile } from '@mdx-js/mdx'
import GithubSlugger from 'github-slugger'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { visit } from 'unist-util-visit'
import type { ModuleData } from '../src/content/types'
import { extractMath, renderTex } from '../src/lib/rich'
import { createRng } from '../src/lib/rng'

const ROOT = path.resolve(import.meta.dirname, '..')
const id = process.argv[2]
const modules: { id: string; sources: { doc: string; pages: [number, number] }[] }[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/plan/modules.json'), 'utf8'))
const errors: string[] = []
const err = (m: string) => errors.push(m)

const COMPONENTS: Record<string, string[]> = {
  Formula: ['id'], Derivation: ['id'], Figure: ['id'], Widget: ['id'], Example: ['id', 'title'], Step: ['title'],
  Callout: ['kind'], Definition: ['term', 'en'], KeyIdea: [], Reveal: ['label'], Proof: ['title'], Check: ['id'],
  SourceRef: ['doc', 'page'], ModLink: ['to'], Term: ['en'], Columns: [], Col: ['title'],
}

const dir = path.join(ROOT, 'src/content/modules', id)
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/inventory', `${id}.json`), 'utf8'))
const data: ModuleData = (await import(pathToFileURL(path.join(dir, 'data.ts')).href)).default

// 1. identità
if (data.id !== id) err(`data.id deve essere ${id}`)

// 2. KaTeX su ogni Latex e su ogni $…$ dentro i Rich
const tex = (t: string, where: string, display = true) => {
  try { renderTex(t, display, true) } catch (e) { err(`${where}: KaTeX -> ${String((e as Error).message).slice(0, 160)}`) }
}
const rich = (t: string | undefined, where: string) => {
  if (!t) return
  for (const s of extractMath(t)) tex(s.tex, where, s.display)
  if ((t.match(/\$/g)?.length ?? 0) % 2 !== 0) err(`${where}: numero dispari di $`)
}
rich(data.summary, 'summary')
data.keyPoints.forEach((k, i) => rich(k, `keyPoints[${i}]`))
data.glossary.forEach((g, i) => rich(g.def, `glossary[${i}]`))
data.formulas.forEach((f) => {
  tex(f.latex, `formula ${f.id}`); rich(f.explain, `formula ${f.id}.explain`); rich(f.whenToUse, `formula ${f.id}.whenToUse`); rich(f.pitfalls, `formula ${f.id}.pitfalls`)
  f.symbols.forEach((s, i) => { tex(s.s, `formula ${f.id}.symbols[${i}]`, false); rich(s.meaning, `formula ${f.id}.symbols[${i}].meaning`) })
  f.blanks.forEach((b, i) => { tex(b.masked, `formula ${f.id}.blanks[${i}].masked`); tex(b.answer, `formula ${f.id}.blanks[${i}].answer`); b.distractors.forEach((d, j) => tex(d, `formula ${f.id}.blanks[${i}].distractors[${j}]`)) })
  if (f.importance === 3 && f.blanks.length === 0) err(`formula ${f.id}: importanza 3 richiede almeno un blank`)
})
data.derivations.forEach((d) => { rich(d.goal, `derivation ${d.id}.goal`); rich(d.conclusion, `derivation ${d.id}.conclusion`); d.steps.forEach((s, i) => { tex(s.latex, `derivation ${d.id}.steps[${i}]`); rich(s.why, `derivation ${d.id}.steps[${i}].why`) }); if (d.steps.length < 3) err(`derivation ${d.id}: meno di 3 passaggi`) })
data.flashcards.forEach((c) => { rich(c.q, `flashcard ${c.id}.q`); rich(c.a, `flashcard ${c.id}.a`) })
data.quiz.forEach((q) => {
  rich(q.q, `quiz ${q.id}`); rich(q.explanation, `quiz ${q.id}.explanation`)
  if (q.type === 'mcq') { q.options.forEach((o, i) => rich(o, `quiz ${q.id}.options[${i}]`)); if (q.answer < 0 || q.answer >= q.options.length) err(`quiz ${q.id}: answer fuori range`) }
  if (q.type === 'multi') { q.options.forEach((o, i) => rich(o, `quiz ${q.id}.options[${i}]`)); if (!q.answers.length || q.answers.some((a) => a < 0 || a >= q.options.length)) err(`quiz ${q.id}: answers non validi`) }
  if (q.type === 'numeric' && !(q.tolerance > 0)) err(`quiz ${q.id}: tolerance deve essere > 0`)
})
data.exam.forEach((e) => { rich(e.q, `exam ${e.id}`); rich(e.answer, `exam ${e.id}.answer`); if (!e.qEn) err(`exam ${e.id}: manca qEn`); if (e.checklist.length < 3) err(`exam ${e.id}: checklist < 3 punti`); e.followUps.forEach((f, i) => { rich(f.q, `exam ${e.id}.followUps[${i}].q`); rich(f.a, `exam ${e.id}.followUps[${i}].a`) }) })

// 3. unicità degli id
for (const [name, list] of Object.entries({ formulas: data.formulas, derivations: data.derivations, figures: data.figures, flashcards: data.flashcards, quiz: data.quiz, exam: data.exam, exercises: data.exercises, widgets: data.widgets })) {
  const seen = new Set<string>()
  for (const x of list as { id: string }[]) { if (seen.has(x.id)) err(`${name}: id duplicato ${x.id}`); seen.add(x.id) }
}

// 4. esercizi generativi
for (const ex of data.exercises) {
  for (let seed = 1; seed <= 20; seed++) {
    try {
      const inst = ex.generate(createRng(seed))
      rich(inst.prompt, `exercise ${ex.id} seed ${seed}.prompt`); rich(inst.solution, `exercise ${ex.id} seed ${seed}.solution`)
      if (!inst.answers.length || inst.answers.some((a) => !Number.isFinite(a.value) || !(a.tolerance > 0))) err(`exercise ${ex.id} seed ${seed}: risposte non finite o tolleranza nulla`)
    } catch (e) { err(`exercise ${ex.id} seed ${seed}: eccezione ${(e as Error).message}`) }
  }
}

// 5. figure
data.figures.forEach((f) => { if (!fs.existsSync(path.join(ROOT, 'public', f.file))) err(`figure ${f.id}: file mancante public/${f.file}`); rich(f.caption, `figure ${f.id}.caption`) })
const invFigures = inventory.figures.filter((f: { importance: number }) => f.importance >= 2).length
if (data.figures.length < invFigures) err(`figure: ${data.figures.length} < ${invFigures} figure con importanza >= 2 nell'inventario`)

// 6. MDX: compilazione, componenti ammessi, riferimenti, titoli
const mdxSrc = fs.readFileSync(path.join(dir, 'index.mdx'), 'utf8')
const slugs = new Set<string>()
const exampleIds = new Set<string>()
const refs = { Formula: data.formulas, Derivation: data.derivations, Figure: data.figures, Widget: data.widgets, Check: data.quiz }
const moduleIds = new Set(modules.map((m) => m.id))
const collect = () => (tree: any) => {
  const slugger = new GithubSlugger()
  visit(tree, 'heading', (h: any) => { if (h.depth <= 3) slugs.add(slugger.slug(h.children.map((c: any) => c.value ?? '').join(''))) })
  visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (n: any) => {
    const req = COMPONENTS[n.name]
    if (!req) { err(`MDX: componente non ammesso <${n.name}>`); return }
    const attrs = Object.fromEntries(n.attributes.filter((a: any) => a.type === 'mdxJsxAttribute').map((a: any) => [a.name, a.value]))
    for (const r of req) if (attrs[r] === undefined) err(`MDX: <${n.name}> senza attributo ${r}`)
    const list = (refs as Record<string, { id: string }[]>)[n.name]
    if (list && !list.some((x) => x.id === attrs.id)) err(`MDX: <${n.name} id="${attrs.id}"> non esiste in data.ts`)
    if (n.name === 'Example') exampleIds.add(String(attrs.id))
    if (n.name === 'ModLink' && !moduleIds.has(String(attrs.to).split('#')[0])) err(`MDX: ModLink verso modulo inesistente ${attrs.to}`)
  })
}
const file = await compile(mdxSrc, { remarkPlugins: [remarkGfm, remarkMath, collect], rehypePlugins: [rehypeSlug, [rehypeKatex, { strict: 'ignore' }]] }).catch((e) => { err(`MDX non compila: ${e.message}`); return null })
file?.messages.forEach((m) => err(`MDX/KaTeX riga ${m.line}: ${m.reason}`))
if (String(file ?? '').includes('katex-error')) err('MDX: formula con katex-error')

// 7. copertura (G2)
const valid = (t: string) => {
  const [kind, ref] = t.startsWith('#') ? ['#', t.slice(1)] : [t.slice(0, t.indexOf(':')), t.slice(t.indexOf(':') + 1)]
  switch (kind) {
    case '#': return slugs.has(ref)
    case 'example': return exampleIds.has(ref)
    case 'formula': return data.formulas.some((x) => x.id === ref)
    case 'derivation': return data.derivations.some((x) => x.id === ref)
    case 'widget': return data.widgets.some((x) => x.id === ref)
    case 'figure': return data.figures.some((x) => x.id === ref)
    case 'quiz': return data.quiz.some((x) => x.id === ref)
    case 'flashcard': return data.flashcards.some((x) => x.id === ref)
    case 'exam': return data.exam.some((x) => x.id === ref)
    case 'exercise': return data.exercises.some((x) => x.id === ref)
    case 'seeAlso': return moduleIds.has(ref.split('#')[0])
    default: return false
  }
}
for (const c of inventory.concepts as { id: string; name: string; kind: string; noWidgetReason?: string }[]) {
  const targets = data.coverage[c.id]
  if (!targets?.length) { err(`copertura: concetto ${c.id} "${c.name}" non mappato`); continue }
  targets.filter((t) => !valid(t)).forEach((t) => err(`copertura: ${c.id} -> destinazione inesistente ${t}`))
  if (!targets.some((t) => t.startsWith('#') || t.startsWith('example:') || t.startsWith('seeAlso:'))) err(`copertura: ${c.id} "${c.name}" non ha una sezione di teoria`)
  if (!c.noWidgetReason && !targets.some((t) => t.startsWith('widget:') || t.startsWith('seeAlso:'))) err(`copertura: ${c.id} "${c.name}" non ha un widget`)
  if (c.kind === 'formula' && !targets.some((t) => t.startsWith('formula:') || t.startsWith('derivation:') || t.startsWith('seeAlso:'))) err(`copertura: formula ${c.id} "${c.name}" senza Formula o Derivation`)
}
for (const w of inventory.widgets as { id: string }[]) if (!data.widgets.some((x) => x.id === w.id)) err(`widget dell'inventario assente da data.widgets: ${w.id}`)
for (const d of inventory.derivations as { id: string; title: string }[]) if (!Object.values(data.coverage).flat().includes(`derivation:${d.id}`) && !data.derivations.some((x) => x.id === d.id)) err(`derivazione dell'inventario non presente: ${d.id} "${d.title}"`)
for (const e of inventory.workedExamples as { id: string; title: string }[]) if (!exampleIds.has(e.id)) err(`esempio svolto dell'inventario senza <Example id="${e.id}">: "${e.title}"`)

// 8. domande della banca e soglie di pratica (G4)
for (const q of inventory.examQuestions as { text: string }[]) {
  const key = q.text.slice(0, 60)
  if (!data.exam.some((e) => e.fromBank && e.bankText?.startsWith(key))) err(`banca: domanda non inclusa -> "${key}…"`)
}
const n = inventory.concepts.length
const min = { flashcards: Math.max(15, Math.ceil(n * 0.6)), quiz: Math.max(12, Math.ceil(n * 0.5)), exam: inventory.examQuestions.length + 4, exercises: Math.max(3, inventory.exercises.length), glossary: 10 }
for (const [k, v] of Object.entries(min)) if ((data as unknown as Record<string, unknown[]>)[k].length < v) err(`pratica: ${k} ${(data as unknown as Record<string, unknown[]>)[k].length} < ${v}`)
if (!data.quiz.some((q) => q.type === 'tf')) err('pratica: serve almeno un quiz vero/falso (gioco Sprint)')

if (errors.length) { console.log(`FAIL ${id}: ${errors.length} errori`); errors.slice(0, 120).forEach((e) => console.log('  - ' + e)); process.exit(1) }
console.log(`PASS ${id}: ${n} concetti coperti, ${data.formulas.length} formule, ${data.derivations.length} derivazioni, ${data.widgets.length} widget, ${data.flashcards.length} flashcard, ${data.quiz.length} quiz, ${data.exam.length} domande, ${data.exercises.length} esercizi`)
```

- [ ] **Step 2:** Creare un modulo finto minimo `src/content/modules/_fixture/` con un inventario finto `docs/inventory/_fixture.json` (2 concetti) e verificare che il validatore dia FAIL con messaggi leggibili quando manca una copertura e PASS quando è completo. Poi rimuovere i file di fixture.

Run: `npx tsx scripts/validate-module.ts _fixture`
Expected: prima `FAIL _fixture` con "copertura: concetto c02 … non mappato", dopo la correzione `PASS _fixture`

- [ ] **Step 3: Commit** `git commit -m "feat: module validator enforcing concept coverage"`

### Task 3.8: Registry dei moduli e router

**Files:** Create `src/content/manifest.ts`, `src/content/registry.ts`, `src/router.tsx`; Modify `src/main.tsx`

**Interfaces:**
- Produces:
  - `manifest: ModuleManifestEntry[]` (tipizzato da `docs/plan/modules.json`), `getModuleMeta(id)`, `modulesByCourse(course)`
  - `loadModuleData(id: string): Promise<ModuleData>`, `loadModuleContent(id: string): Promise<MDXContent>`, `loadAllModuleData(): Promise<ModuleData[]>`
  - rotte: `/`, `/mappa`, `/corso/:course`, `/m/:moduleId/:tab?` (tab: `riassunto|teoria|formule|laboratorio|esercizi|flashcard|quiz|orale|fonti`), `/formulario`, `/flashcard`, `/quiz`, `/orale`, `/giochi`, `/giochi/:game`, `/glossario`, `/fonti/:doc/:page`, `/lab/:widgetId`, `/progressi`, `/copertura`, `/impostazioni`

- [ ] **Step 1:** `registry.ts`:

```ts
import type { MDXContent } from 'mdx/types'
import type { ModuleData } from './types'
import { manifest } from './manifest'

const dataLoaders = import.meta.glob<{ default: ModuleData }>('./modules/*/data.ts')
const mdxLoaders = import.meta.glob<{ default: MDXContent }>('./modules/*/index.mdx')

export const hasModule = (id: string) => `./modules/${id}/data.ts` in dataLoaders
export async function loadModuleData(id: string) { return (await dataLoaders[`./modules/${id}/data.ts`]()).default }
export async function loadModuleContent(id: string) { return (await mdxLoaders[`./modules/${id}/index.mdx`]()).default }
export async function loadAllModuleData() { return Promise.all(manifest.filter((m) => hasModule(m.id)).map((m) => loadModuleData(m.id))) }
```

- [ ] **Step 2:** `router.tsx` con `createBrowserRouter` e `lazy` per ogni pagina (Context7 `/websites/reactrouter` per la sintassi `lazy` della 7.18). `main.tsx` usa `RouterProvider` da `react-router/dom`.
- [ ] **Step 3:** Test `src/content/registry.test.ts`: `manifest` ha 50 voci con id unici e ogni `course` valido.
- [ ] **Step 4:** Run `npx vitest run src/content`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat: module registry and routes"`

### Task 3.9: Store dei progressi e SRS

**Files:** Create `src/lib/srs.ts`, `src/store/progress.ts`; Test `src/lib/srs.test.ts`, `src/store/progress.test.ts`

**Interfaces:**
- Produces:
  - `interface SrsCard { ef: number; interval: number; reps: number; due: number }`, `review(card: SrsCard | undefined, grade: 1 | 3 | 4 | 5, now: number): SrsCard`, `isDue(card: SrsCard | undefined, now: number): boolean`
  - `useProgress` (zustand persist, chiave `ml-study-progress-v1`) con stato `modules`, `flashcards`, `quiz`, `exam`, `challenges`, `bookmarks`, `notes`, `streak` e azioni `markSection(moduleId, slug)`, `setModuleStatus(moduleId, status)`, `gradeCard(key, grade)`, `recordQuiz(key, correct)`, `recordExam(entry)`, `completeChallenge(widgetId)`, `toggleBookmark(target)`, `setNote(target, text)`, `exportJson(): string`, `importJson(json: string): void`, `reset()`

- [ ] **Step 1: Test SRS**

```ts
import { describe, expect, it } from 'vitest'
import { isDue, review } from './srs'
const DAY = 86_400_000

describe('srs', () => {
  it('prima risposta buona: 1 giorno', () => {
    const c = review(undefined, 4, 0)
    expect(c.interval).toBe(1); expect(c.due).toBe(DAY); expect(c.reps).toBe(1)
  })
  it('seconda risposta buona: 6 giorni', () => {
    expect(review(review(undefined, 4, 0), 4, DAY).interval).toBe(6)
  })
  it('errore azzera le ripetizioni e abbassa ef senza scendere sotto 1.3', () => {
    let c = review(undefined, 5, 0)
    for (let i = 0; i < 10; i++) c = review(c, 1, 0)
    expect(c.reps).toBe(0); expect(c.ef).toBeGreaterThanOrEqual(1.3)
  })
  it('isDue', () => { expect(isDue(undefined, 0)).toBe(true); expect(isDue(review(undefined, 5, 0), 0)).toBe(false) })
})
```

- [ ] **Step 2:** Run `npx vitest run src/lib/srs.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementazione**

```ts
export interface SrsCard { ef: number; interval: number; reps: number; due: number }
const DAY = 86_400_000

export function review(card: SrsCard | undefined, grade: 1 | 3 | 4 | 5, now: number): SrsCard {
  const c = card ?? { ef: 2.5, interval: 0, reps: 0, due: now }
  if (grade < 3) return { ef: Math.max(1.3, c.ef - 0.2), interval: 1, reps: 0, due: now + DAY }
  const reps = c.reps + 1
  const interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(c.interval * c.ef)
  const ef = Math.max(1.3, c.ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)))
  return { ef, interval, reps, due: now + interval * DAY }
}

export const isDue = (card: SrsCard | undefined, now: number) => !card || card.due <= now
```

- [ ] **Step 4:** Implementare `progress.ts` con `persist` e `createJSONStorage(() => localStorage)` dentro try/catch (storage non disponibile = stato in memoria). Test: `gradeCard` aggiorna la carta; `exportJson` → `importJson` ripristina lo stesso stato; `reset` svuota.
- [ ] **Step 5:** Run `npx vitest run src/lib/srs.test.ts src/store`. Expected: PASS.
- [ ] **Step 6: Commit** `git commit -m "feat: progress store with sm-2 spaced repetition"`

### Task 3.10: Componenti MDX di contenuto

**Files:** Create in `src/components/content/`: `ModuleContext.tsx`, `Formula.tsx`, `Derivation.tsx`, `Figure.tsx`, `Widget.tsx`, `Example.tsx` (+ `Step`), `Callout.tsx`, `Definition.tsx`, `KeyIdea.tsx`, `Reveal.tsx`, `Proof.tsx`, `Check.tsx`, `SourceRef.tsx`, `ModLink.tsx`, `Term.tsx`, `Columns.tsx` (+ `Col`), `mdxComponents.ts`; Test `src/components/content/content.test.tsx`

**Interfaces:**
- Consumes: `ModuleData`, `Rich`, `M`, `useProgress`, `loadWidget`
- Produces (API per gli autori MDX, identica alla whitelist del validatore):

| Componente | Props | Rendering |
|---|---|---|
| `<Formula id />` | `id: string` | scheda con nome IT/EN, formula display, legenda simboli, "quando si usa", trappole, pagina sorgente, pulsante "nascondi per ripasso" |
| `<Derivation id />` | `id: string` | dimostrazione a passi con rivelazione progressiva, "perché" di ogni passo, modalità "prova tu" |
| `<Figure id />` | `id: string` | immagine WebP lazy, didascalia Rich, zoom in dialog, link alla pagina originale |
| `<Widget id />` | `id: string` | carica lazy il widget; se non esiste ancora mostra la scheda "in costruzione" con titolo e concetti |
| `<Example id title>` | `id, title: string; children` | esempio svolto; i figli `<Step title>` si rivelano uno alla volta |
| `<Callout kind title?>` | `kind: 'intuizione' \| 'attenzione' \| 'esame' \| 'suggerimento' \| 'nota' \| 'inglese'` | riquadro semantico |
| `<Definition term en>` | `term, en: string; children` | definizione con termine inglese |
| `<KeyIdea>` | `children` | idea chiave in evidenza |
| `<Reveal label>` | `label: string; children` | contenuto nascosto finché non si clicca |
| `<Proof title>` | `title: string; children` | dimostrazione rigorosa comprimibile |
| `<Check id />` | `id: string` | quiz inline preso da `data.quiz` |
| `<SourceRef doc page />` | `doc: DocId; page: number` | chip "Slide 53 / Note p. 38" che apre la pagina originale |
| `<ModLink to>` | `to: string` (`moduleId` o `moduleId#slug`); `children` | link interno |
| `<Term en>` | `en: string; children` | termine con tooltip inglese e definizione dal glossario |
| `<Columns>` / `<Col title>` | `children` / `title: string; children` | confronto affiancato che diventa una colonna su mobile |

- [ ] **Step 1:** Test di rendering: `<Formula id="f1" />` dentro `ModuleContext` con dati finti mostra nome e KaTeX; `<Derivation>` mostra solo il primo passo e rivela il secondo al clic; `<Check>` segnala risposta giusta/sbagliata; `<Widget id="inesistente">` mostra "in costruzione".
- [ ] **Step 2:** Run `npx vitest run src/components/content`. Expected: FAIL.
- [ ] **Step 3:** Implementare i componenti con i token della Fase 2 (prima di scrivere `Tabs`, `Dialog`, `Tooltip` cercare nei connettori: Magic UI `searchRegistryItems`, ui-layouts `search_components`, 21st.dev `search`; annotare nel commit cosa si è usato e perché).
- [ ] **Step 4:** Run `npx vitest run src/components/content`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat: mdx content components"`

### Task 3.11: Guida per gli autori dei contenuti

**Files:** Create `docs/CONTENT_GUIDE.md`

- [ ] **Step 1:** Scrivere la guida che gli agenti della Fase 6 leggono per prima. Contenuto obbligatorio:
  1. Flusso: leggere `docs/plan/moduli/<id>.md` e `docs/inventory/<id>.json`, aprire le immagini delle pagine, scrivere `data.ts` e `index.mdx`, ritagliare le figure con `scripts/fig.py`, eseguire `npx tsx scripts/validate-module.ts <id>` fino a PASS.
  2. Struttura di `index.mdx`: `## Panoramica` → sezioni nell'ordine delle slide → `## Collegamenti` → `## Per l'orale`. Ogni sezione: intuizione con esempio del cast, definizione formale, `<Formula>`, `<Widget>`, `<Example>`, `<Callout kind="esame">` con cosa chiedono i docenti.
  3. Regole MDX: solo i componenti della tabella del Task 3.10; `{` e `<` fuori dalla matematica vanno evitati o scritti `\{`, `&lt;`; dentro le tabelle GFM usare `\vert` o `\mid` al posto di `|`.
  4. Regole `data.ts`: `import { defineModule, md } from '../../types'`; LaTeX sempre con `` md`...` ``; niente `${` dentro `md`; id kebab-case; `coverage` con una voce per ogni concetto dell'inventario.
  5. Stile italiano: frasi brevi, termine inglese tra parentesi alla prima occorrenza, notazione identica alle slide, nessun riempitivo (skill `stop-slop`); risposte d'orale in prima persona come le direbbe lo studente, con i punti che il docente si aspetta.
  6. Soglie di pratica del validatore e tipi di quiz (`mcq`, `multi`, `tf`, `numeric`).
  7. Esempio completo di un mini-modulo (una formula, una derivazione di 3 passi, un esempio, due flashcard, un quiz per tipo, una domanda d'orale, un esercizio generativo, la copertura).
- [ ] **Step 2: Commit** `git commit -m "docs: content authoring guide"`

---

## Fase 4: Kit dei widget, libreria ML e widget di riferimento

### Task 4.1: Contratto e registry dei widget

**Files:** Create `src/widgets/types.ts`, `src/widgets/registry.ts`; Test `src/widgets/registry.test.ts`

**Interfaces:**
- Produces:

```ts
// src/widgets/types.ts
import type { ComponentType } from 'react'
export type ScenarioId = 'pesce' | 'telerilevamento' | 'medicina' | 'spam' | 'cifre' | 'sensori' | 'energia' | 'case' | 'banca' | 'incendio' | 'robot' | 'traduzione' | 'immagini' | 'fonte'
export interface WidgetMeta {
  id: string
  moduleId: string
  title: string
  /** id dei concetti dell'inventario coperti */
  concepts: string[]
  scenario: ScenarioId
  /** frase breve mostrata nel badge, es. "Salmone vs spigola: luminosità misurata sul nastro" */
  scenarioNote: string
  size: 'S' | 'M' | 'L'
}
export interface WidgetModule { meta: WidgetMeta; default: ComponentType }
```

```ts
// src/widgets/registry.ts
import type { WidgetModule } from './types'
const loaders = import.meta.glob<WidgetModule>('./*/*.widget.tsx')
const byId = new Map(Object.entries(loaders).map(([p, l]) => [p.split('/').pop()!.replace('.widget.tsx', ''), l]))
export const widgetExists = (id: string) => byId.has(id)
export const widgetIds = () => [...byId.keys()]
export async function loadWidget(id: string): Promise<WidgetModule | null> { const l = byId.get(id); return l ? l() : null }
```

- File dei widget: `src/widgets/<moduleId>/<widgetId>.widget.tsx`, che esporta `meta` e il componente di default.

- [ ] **Step 1:** Test: con un widget di prova `src/widgets/_test/prova.widget.tsx` `widgetExists('prova')` è true e `loadWidget('prova')` restituisce `meta.id === 'prova'`.
- [ ] **Step 2:** Run `npx vitest run src/widgets/registry.test.ts`: FAIL, poi implementare, poi PASS.
- [ ] **Step 3: Commit** `git commit -m "feat: widget contract and registry"`

### Task 4.2: Hook di animazione e storyboard

**Files:** Create `src/widgets/kit/useStoryboard.ts`, `src/widgets/kit/useAnimationFrame.ts`, `src/widgets/kit/useReducedMotion.ts`; Test `src/widgets/kit/useStoryboard.test.ts`

**Interfaces:**
- Produces:
  - `useReducedMotion(): boolean`
  - `useAnimationFrame(cb: (dtMs: number, tMs: number) => void, active: boolean): void` (si ferma quando la scheda è nascosta)
  - `useStoryboard(steps: { id: string; label: string; durationMs: number }[], opts?: { autoplay?: boolean; loop?: boolean; speed?: number }): { index: number; step: { id: string; label: string }; progress: number; playing: boolean; speed: number; play(): void; pause(): void; toggle(): void; next(): void; prev(): void; goto(i: number): void; reset(): void; setSpeed(s: number): void }`. Con reduced motion `autoplay` è ignorato e `progress` salta a 1 a ogni passo.

- [ ] **Step 1:** Test con timer finti: dopo `play()` e l'avanzamento di `durationMs` l'indice passa a 1; `pause()` ferma; `loop` torna a 0; `speed: 2` dimezza i tempi; `prev()` non scende sotto 0.
- [ ] **Step 2:** FAIL → implementazione con `requestAnimationFrame` → PASS.
- [ ] **Step 3: Commit** `git commit -m "feat: storyboard and animation hooks"`

### Task 4.3: WidgetFrame e controlli

**Files:** Create in `src/widgets/kit/`: `WidgetFrame.tsx`, `PlayControls.tsx`, `Slider.tsx`, `Toggle.tsx`, `Segmented.tsx`, `NumberField.tsx`, `Readout.tsx`, `LiveFormula.tsx`, `Challenge.tsx`, `StepCaption.tsx`; Test `src/widgets/kit/controls.test.tsx`

**Interfaces:**
- Produces:
  - `<WidgetFrame meta={WidgetMeta} controls?={ReactNode} caption?={ReactNode} challenge?={ReactNode} onReset?={() => void} aspect?={number}>{visual}</WidgetFrame>`: titolo, badge scenario con "dati sintetici", area visuale, pannello controlli (sotto su mobile, a destra da 1024 px), caption del passo, sfida, pulsante schermo intero, reset.
  - `<PlayControls sb={ReturnType<typeof useStoryboard>} />`: Play/Pausa (Spazio), Passo avanti/indietro (frecce), velocità 0.5×/1×/2×, indicatore dei passi.
  - `<Slider id label latex? min max step value onChange format? />`: tastiera (frecce, PageUp/Down, Home/End), `aria-valuetext`.
  - `<LiveFormula tex values />`: `tex` contiene `\val{nome}`; ogni segnaposto viene sostituito con `values[nome]` formattato e i numeri cambiati lampeggiano (solo opacity, 240 ms).
  - `<Readout label value format? />` con `aria-live="polite"`.
  - `<Challenge prompt={Rich} status={'idle' | 'ok' | 'ko'} hint?={Rich} onCheck={() => void} />`: registra il completamento in `useProgress.completeChallenge`.

- [ ] **Step 1:** Prima di scrivere i controlli, cercare nei connettori (Magic UI, ui-layouts, 21st.dev) slider, segmented control e player controls; adattare ai token o scrivere da zero, annotando la scelta.
- [ ] **Step 2:** Test: `Slider` risponde alle frecce; `LiveFormula` sostituisce `\val{h}` con `0.50`; `PlayControls` con Spazio chiama `toggle`.
- [ ] **Step 3:** FAIL → implementazione → PASS (`npx vitest run src/widgets/kit`).
- [ ] **Step 4: Commit** `git commit -m "feat: widget frame and controls"`

### Task 4.4: Primitive di visualizzazione

**Files:** Create in `src/widgets/kit/plot/`: `Plot.tsx` (contesto con scale d3), `Axis.tsx`, `Grid.tsx`, `LinePath.tsx`, `AreaPath.tsx`, `Dots.tsx` (punti trascinabili), `Histogram.tsx`, `Bars.tsx`, `Arrow.tsx`, `Ellipse2D.tsx`, `FieldCanvas.tsx` (campo scalare 2D su canvas con colormap), `BoundaryCanvas.tsx` (regioni di decisione), `Contours.tsx`, `Matrix.tsx` (heatmap numerica), `GraphView.tsx` (DAG per reti bayesiane e reti neurali), `TreeView.tsx`, `GridWorld.tsx`, `ImageGrid.tsx` (pixel di cifre e feature map), `SequenceTokens.tsx` (token con pesi di attenzione); `colors.ts`; Test `src/widgets/kit/plot/plot.test.tsx`

**Interfaces:**
- Produces:
  - `<Plot width height xDomain yDomain margin? x?='linear' y?='linear' ariaLabel>`: SVG responsive (`viewBox`), fornisce `usePlot(): { x: ScaleLinear; y: ScaleLinear; innerWidth; innerHeight }`.
  - `<LinePath data={[number, number][]} role="estimate" | "truth" | "kernel" | "boundary" | "accent" dashed? animate? />`: se `animate` il tracciato si disegna con `pathLength` (motion), disattivato con reduced motion.
  - `<Dots data={{ x: number; y: number; cls?: number; id?: string }[]} draggable? onDrag?={(id, x, y) => void} r? />`
  - `<FieldCanvas fn={(x: number, y: number) => number} xDomain yDomain resolution? colormap='sequential' | 'diverging' />`
  - `<BoundaryCanvas classify={(x, y) => number} xDomain yDomain resolution? />`
  - `<GraphView nodes={{ id; label; x; y; state? }[]} edges={{ from; to; active?; weight? }[]} onNodeClick? />`
  - `<GridWorld rows cols cells={{ r; c; kind: 'vuota' | 'muro' | 'obiettivo' | 'trappola'; value?; policy?: 'N' | 'S' | 'E' | 'O' }[]} agent? />`
  - `vizColor(role: VizRole): string` legge le variabili CSS; `classColor(i: number)`.
- Tutte le primitive leggono i colori dai token (`--viz-*`) e si ridisegnano al cambio tema.

- [ ] **Step 1:** Consultare la skill `dataviz` (forma, palette, etichette) e Context7 `d3-scale`.
- [ ] **Step 2:** Test: `Plot` mappa il dominio sugli estremi dell'area interna; `Histogram` con 10 valori e 5 bin disegna 5 rettangoli; `Dots` trascinabile chiama `onDrag` con coordinate nel dominio.
- [ ] **Step 3:** FAIL → implementazione → PASS.
- [ ] **Step 4:** Pagina `/lab/_kit` che mostra tutte le primitive in entrambi i temi; verifica nel browser a 1280 e 390 px.
- [ ] **Step 5: Commit** `git commit -m "feat: visualization primitives"`

### Task 4.5: Libreria numerica ML

**Files:** Create in `src/lib/ml/` un file per area con test accanto: `stats.ts` (pdf normale uni/multivariata 2D, beta, dirichlet, gamma, campionamento, media, varianza, covarianza, istogramma, integrazione trapezoidale), `linalg.ts` (matrici piccole: prodotto, trasposta, determinante, inversa, autovalori/autovettori simmetrici con Jacobi, pseudoinversa), `estimation.ts` (stime ML gaussiane, stima bayesiana della media, bias/varianza/MSE Monte Carlo, bound di Cramér-Rao per la media gaussiana), `nonparam.ts` (K-NN density, Parzen con kernel rettangolare/gaussiano/triangolare/Epanechnikov, classificatore K-NN), `em.ts` (EM per GMM 1D e 2D, log-verosimiglianza), `separability.ts` (divergenza, Bhattacharyya, Jeffries-Matusita per gaussiane), `featsel.ts` (SFS, SBS con criterio fornito), `pca.ts`, `lda.ts` (binaria e multiclasse, scatter matrices), `classify.ts` (MDM, box, MAP, ML, rischio minimo, discriminanti gaussiani nei 3 casi), `tree.ts` (CART con Gini, entropia, errore di classificazione, twoing, potatura costo-complessità), `metrics.ts` (matrice di confusione, accuracy, precision, recall, F1, kappa, ROC, AUC, t-test appaiato, McNemar, k-fold, leave-one-out), `bayesnet.ts` (fattorizzazione, inferenza per enumerazione, d-separazione con Bayes-ball, stima ML/MAP dei CPT, EM con dati mancanti), `linear.ts` (perceptron, perceptron per regressione, minimi quadrati, pseudoinversa, one-vs-all, one-vs-one), `svm.ts` (SMO semplificato hard/soft margin, vettori di supporto, margine, SVR ε-insensitive), `kernels.ts` (lineare, polinomiale, RBF, verifica semidefinita positiva della Gram, spectrum kernel su stringhe, WL su grafi piccoli), `cluster.ts` (k-means, k-means++, GMM, silhouette/elbow/BIC, clustering gerarchico single/complete/average con dendrogramma), `rl.ts` (MDP a griglia, value iteration, policy iteration, policy evaluation iterativa, TD(0), SARSA, Q-learning, ε-greedy), `nn.ts` (MLP piccolo con forward/backward, attivazioni e derivate, softmax, cross-entropy, ottimizzatori SGD/momentum/Nesterov/AdaGrad/RMSProp/Adam, batch/layer/instance/group norm, dropout, L1/L2), `conv.ts` (convoluzione 2D con stride/padding/dilation, pooling, calcolo delle dimensioni di output e parametri, receptive field, IoU, NMS), `seq.ts` (RNN/LSTM/GRU a una cella con gate espliciti, attention additiva/moltiplicativa, self-attention scaled dot-product, positional encoding sinusoidale, multi-head), `generative.ts` (GAN 1D giocattolo con discriminatore logistico, loss minimax/non saturante/Wasserstein, KL gaussiana del VAE, reparametrization trick, quantizzazione VQ, schedule di diffusione β, q(x_t|x_0), passo di denoising DDPM su 1D/2D), `contrastive.ts` (InfoNCE, similarità coseno, matrice di logits CLIP con temperatura).

**Interfaces:**
- Produces: funzioni pure tipizzate, input e output numerici semplici (`number[]`, `number[][]`, `{ x: number[]; y: number }`), nessuna dipendenza da React.

- [ ] **Step 1:** Per ogni file: prima i test con valori noti. Esempi obbligatori:

```ts
// src/lib/ml/stats.test.ts
import { describe, expect, it } from 'vitest'
import { normalPdf, trapz, linspace } from './stats'
describe('stats', () => {
  it('la pdf normale integra a 1', () => {
    const xs = linspace(-10, 10, 4001)
    expect(trapz(xs, xs.map((x) => normalPdf(x, 0, 1)))).toBeCloseTo(1, 4)
  })
})
```

```ts
// src/lib/ml/nonparam.test.ts
import { describe, expect, it } from 'vitest'
import { parzen1d, knnDensity1d } from './nonparam'
import { trapz, linspace } from './stats'
describe('nonparam', () => {
  it('Parzen gaussiano integra a 1 per ogni h', () => {
    const samples = [0, 1, 1.5, 4]
    const xs = linspace(-20, 25, 9001)
    for (const h of [0.1, 0.5, 2]) expect(trapz(xs, xs.map((x) => parzen1d(x, samples, h, 'gaussiano')))).toBeCloseTo(1, 3)
  })
  it('K-NN: p(x) = k / (N V) con V = 2 r_k in 1D', () => {
    expect(knnDensity1d(0, [-1, 1, 3, 10], 2)).toBeCloseTo(2 / (4 * 2), 6)
  })
})
```

```ts
// src/lib/ml/pca.test.ts
import { describe, expect, it } from 'vitest'
import { pca } from './pca'
describe('pca', () => {
  it('prima componente lungo la diagonale per dati su y = x', () => {
    const { components, explained } = pca([[1, 1], [2, 2], [3, 3.1], [4, 3.9]])
    expect(Math.abs(components[0][0])).toBeCloseTo(Math.SQRT1_2, 1)
    expect(explained[0]).toBeGreaterThan(0.99)
  })
})
```

```ts
// src/lib/ml/rl.test.ts
import { describe, expect, it } from 'vitest'
import { valueIteration, gridMdp } from './rl'
describe('rl', () => {
  it('value iteration converge e la politica va verso l obiettivo', () => {
    const mdp = gridMdp({ rows: 1, cols: 3, goal: [0, 2], stepReward: -1, gamma: 0.9 })
    const { V, policy } = valueIteration(mdp, 1e-6)
    expect(policy['0,0']).toBe('E')
    expect(V['0,1']).toBeGreaterThan(V['0,0'])
  })
})
```

- [ ] **Step 2:** Run `npx vitest run src/lib/ml`: FAIL → implementare file per file → PASS.
- [ ] **Step 3:** Workflow consigliato: un agente per file (24) con revisore indipendente che scrive test aggiuntivi sui casi limite; i test del revisore devono passare.
- [ ] **Step 4: Commit** un commit per file: `git commit -m "feat(ml): <area>"`

### Task 4.6: Generatori dei dataset del cast

**Files:** Create in `src/lib/datasets/`: `fish.ts`, `remoteSensing.ts`, `medical.ts`, `spam.ts`, `digits.ts`, `sensors.ts`, `energy.ts`, `housing.ts`, `credit.ts`, `fire.ts`, `gridworlds.ts`, `sentences.ts`, `images.ts`; Test `datasets.test.ts`

**Interfaces:**
- Produces: `fishDataset(rng: Rng, opts?: { n?: number; features?: ('luminosita' | 'larghezza' | 'lunghezza')[] }): { x: number[]; y: 0 | 1; label: 'salmone' | 'spigola' }[]` e analoghi con nomi di feature in italiano, unità di misura realistiche (cm, riflettanza 0-1, bpm, €) e metadati `{ featureNames, units, classNames, description }`.
- `digits.ts`: 10 prototipi 8×8 disegnati a mano + rumore e deformazioni, niente download.

- [ ] **Step 1:** Test: determinismo per seed, forme corrette, classi bilanciate secondo `opts`.
- [ ] **Step 2:** FAIL → implementazione → PASS.
- [ ] **Step 3: Commit** `git commit -m "feat: synthetic datasets for the scenario cast"`

### Task 4.7: Tre widget di riferimento (gold standard)

**Files:** Create `src/widgets/m03-stima-intro-parametrica/<id PDF>.widget.tsx`, `src/widgets/m08-non-parametrica-knn/<id K-NN>.widget.tsx`, `src/widgets/m09-parzen-windows/<id somma kernel>.widget.tsx` (id esatti presi dall'inventario); `docs/WIDGET_GUIDE.md`

**Interfaces:**
- Consumes: kit (Task 4.2-4.4), `src/lib/ml`, `src/lib/datasets`, `WidgetMeta`
- Produces: tre esempi canonici citati in `docs/WIDGET_GUIDE.md`, che tutti gli agenti della Fase 7 leggono.

Specifica minima (l'inventario può arricchirla):
1. **PDF, dal campione alla densità (m03):** le misure di luminosità dei salmoni cadono una a una sul nastro e si impilano in un istogramma normalizzato; slider numero di campioni e larghezza dei bin; la curva vera appare e l'istogramma converge; trascinando due maniglie a e b l'area sotto la curva si colora e `LiveFormula` mostra $P(a \le x \le b) = \int_a^b p(x)\,dx$ con il valore; sfida: "sposta a e b per ottenere una probabilità di 0,5".
2. **K-NN (m08):** piano luminosità/larghezza con salmoni e spigole; punto x trascinabile; la sfera (cerchio) cresce animata fino a contenere k campioni, i vicini si accendono in ordine di distanza; `LiveFormula` $\hat p(\mathbf{x}) = \frac{k/N}{V}$ con valori; curva/heatmap della stima per k scelto; modalità classificatore (voto dei k vicini) e confronto k=1 (overfitting) vs k grande (oversmoothing); sfida: "trova k che classifica bene il pesce misterioso".
3. **Parzen (m09):** campioni di un sensore sull'asse; per ogni campione nasce un kernel gaussiano (animazione di crescita), poi i kernel si sommano e si normalizzano in $\hat p(x) = \frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\gamma\!\left(\frac{x - x_k}{h}\right)$; slider h con casi sovra e sotto-smoothing evidenziati; selettore del kernel (rettangolare, gaussiano, triangolare); clic per aggiungere campioni; confronto con la densità vera e indicatore di errore; sfida: "trova h che minimizza l'errore".

- [ ] **Step 1:** Invocare `ui-design:emil-design-eng` e `ui-design:svg-animations`; consultare Context7 per `motion` (`motion/react`, `animate`, `useMotionValue`) sulla versione installata.
- [ ] **Step 2:** Implementare i tre widget, ciascuno con test della logica (stato dopo N passi, valore della formula live).
- [ ] **Step 3:** Script `scripts/snap-widget.mjs` (Playwright: `npm install -D playwright` e `npx playwright install chromium` dopo aver controllato lo spazio su disco): apre `/lab/<id>` a 1280×800 e 390×844, temi chiaro e scuro, cattura prima e dopo 3 secondi di Play e dopo un'interazione scriptata, raccoglie gli errori di console; salva in `docs/reports/widgets/<id>/`.
- [ ] **Step 4:** Revisione con `ui-design:improve-animations` e `ui-design:fixing-motion-performance`; correggere.
- [ ] **Step 5:** Scrivere `docs/WIDGET_GUIDE.md`: contratto file e `meta`, uso del kit, regole di motion (durate, easing, reduced motion, niente animazioni di layout nei loop), colori per ruolo, accessibilità, struttura dello storyboard, formule live, sfide, test richiesti, comando di screenshot, i tre esempi commentati.
- [ ] **Step 6: Commit** `git commit -m "feat: reference widgets and widget guide"`

---

## Fase 5: Shell dell'app e pagine globali

Prima di ogni componente nuovo: cercare nei connettori (21st.dev `search`, Magic UI `searchRegistryItems`, ui-layouts `search_components`, shadcn `search_items_in_registries`) e annotare nel commit cosa si è trovato e perché lo si usa o no. Il progetto non usa shadcn: si adatta il codice ai token, senza `npx shadcn init`.

### Task 5.1: AppShell, sidebar e barra superiore

**Files:** Create `src/components/layout/AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `ThemeToggle.tsx`, `src/components/ui/CommandPalette.tsx`; Test `layout.test.tsx`

- [ ] **Step 1:** Test: la sidebar elenca 3 corsi e 50 moduli raggruppati per capitolo; `Ctrl+K` apre la palette; il toggle tema imposta `data-theme` su `<html>` e lo ricorda.
- [ ] **Step 2:** FAIL → implementazione (sidebar comprimibile, indicatori di progresso per modulo, drawer su mobile, skip link) → PASS.
- [ ] **Step 3: Commit** `git commit -m "feat: app shell"`

### Task 5.2: Pagina modulo

**Files:** Create `src/pages/ModulePage.tsx`, `src/components/layout/ModuleHeader.tsx`, `Toc.tsx`, `src/pages/module/Tab*.tsx` (Riassunto, Teoria, Formule, Laboratorio, Esercizi, Flashcard, Quiz, Orale, Fonti)

**Interfaces:**
- Consumes: `loadModuleData`, `loadModuleContent`, `mdxComponents`, `useProgress`, pratica (Task 5.4-5.6)

- [ ] **Step 1:** Test: `/m/m09-parzen-windows` mostra titolo IT ed EN, capitolo, chip delle fonti, 9 tab; `/m/.../formule` elenca tutte le formule; la TOC segue i titoli H2/H3 e la lettura delle sezioni aggiorna `markSection`.
- [ ] **Step 2:** FAIL → implementazione → PASS. Tab Laboratorio: griglia di tutti i widget del modulo con filtro per concetto. Tab Fonti: miniature delle pagine dell'intervallo con apertura nel viewer.
- [ ] **Step 3:** Verifica nel browser su un modulo reale (dopo il pilota di Fase 6).
- [ ] **Step 4: Commit** `git commit -m "feat: module page"`

### Task 5.3: Home, mappa del corso e pagine corso

**Files:** Create `src/pages/Home.tsx`, `CourseMap.tsx`, `CoursePage.tsx`

- [ ] **Step 1:** Home: "Riprendi da dove eri", flashcard in scadenza, domanda d'orale del giorno, progresso per corso, argomenti deboli (quiz con errori).
- [ ] **Step 2:** Mappa: grafo interattivo dei 50 moduli (prerequisiti e `connections`), colori per corso, stato di studio, zoom e clic per aprire.
- [ ] **Step 3:** Test di rendering e navigazione. **Commit** `git commit -m "feat: home and course map"`

### Task 5.4: Flashcard con ripetizione dilazionata

**Files:** Create `src/components/practice/FlashcardDeck.tsx`, `src/pages/Flashcards.tsx`

- [ ] **Step 1:** Test: flip con Spazio, voti 1/2/3/4 da tastiera mappati a `review` (1, 3, 4, 5), coda delle carte in scadenza per modulo/corso/tutte, sessione che termina con riepilogo.
- [ ] **Step 2:** FAIL → implementazione (animazione di flip 3D solo transform, reduced motion = dissolvenza) → PASS.
- [ ] **Step 3: Commit** `git commit -m "feat: spaced repetition flashcards"`

### Task 5.5: Quiz

**Files:** Create `src/components/practice/QuizRunner.tsx`, `src/pages/QuizArena.tsx`

- [ ] **Step 1:** Test: i 4 tipi (`mcq`, `multi`, `tf`, `numeric` con tolleranza), feedback immediato con spiegazione, modalità esame a tempo senza feedback fino alla fine, ripasso degli errori, registrazione in `recordQuiz`.
- [ ] **Step 2:** FAIL → implementazione → PASS. **Commit** `git commit -m "feat: quiz arena"`

### Task 5.6: Esercizi generativi

**Files:** Create `src/components/practice/ExerciseRunner.tsx`

- [ ] **Step 1:** Test: con seed fisso il prompt è stabile; "Nuovo esercizio" cambia seed; più risposte numeriche con tolleranza; "Mostra soluzione" rivela i passaggi.
- [ ] **Step 2:** FAIL → implementazione → PASS. **Commit** `git commit -m "feat: generated exercises"`

### Task 5.7: Formulario, glossario, ricerca, fonti, copertura, progressi, impostazioni

**Files:** Create `src/pages/Formulario.tsx`, `Glossary.tsx`, `SourceViewer.tsx`, `Coverage.tsx`, `Progress.tsx`, `Settings.tsx`, `src/lib/search.ts`

- [ ] **Step 1:** Formulario: tutte le formule di tutti i moduli, filtri corso/modulo/importanza, ricerca, modalità ripasso (formula nascosta finché non si clicca), stampa pulita.
- [ ] **Step 2:** Glossario IT↔EN unificato con deduplica per termine inglese.
- [ ] **Step 3:** Ricerca `minisearch` su titoli, sezioni, formule (nome e simboli), glossario, flashcard, domande; risultati nella palette `Ctrl+K`.
- [ ] **Step 4:** Viewer fonti `/fonti/:doc/:page`: pagina WebP, frecce avanti/indietro, elenco dei moduli e concetti che citano quella pagina.
- [ ] **Step 5:** Copertura `/copertura`: per ogni modulo, concetti dell'inventario con link alle destinazioni della `coverage` (la prova visibile che nulla è stato perso).
- [ ] **Step 6:** Progressi: moduli studiati, carte, accuratezza quiz per modulo, simulazioni d'orale, sfide dei widget completate; export/import JSON; reset con conferma.
- [ ] **Step 7:** Test di rendering per ciascuna pagina. **Commit** `git commit -m "feat: global study pages"`

---

## Fase 6: Produzione dei contenuti (50 moduli)

### Task 6.1: Workflow di produzione per modulo

**Files:** Create `src/content/modules/<id>/data.ts`, `src/content/modules/<id>/index.mdx`, `public/figures/<id>/*.webp` per ogni modulo

**Interfaces:**
- Consumes: `docs/CONTENT_GUIDE.md`, `docs/plan/moduli/<id>.md`, `docs/inventory/<id>.json`, `_sources/*`, `scripts/fig.py`, `scripts/validate-module.ts`
- Produces: moduli che passano G2, G3, G4, G6

Pipeline per modulo:
1. **Autore:** legge guida, checklist, inventario, testo e tutte le immagini delle pagine; scrive `data.ts` e `index.mdx`; ritaglia le figure verificandole con Read; esegue il validatore fino a PASS. Ritorna `{ moduleId, pass, counts }`.
2. **Revisore di copertura** (indipendente): rilegge le pagine e l'inventario, apre il modulo e cerca: concetti presenti solo di nome, dettagli persi, esempi senza numeri, dimostrazioni senza passaggi, formule senza legenda, domande d'orale con risposte deboli. Ritorna un elenco strutturato `findings[]` con pagina, cosa manca, dove va messo.
3. **Revisore di fedeltà formule** (per tutti i moduli, doppio per m03-m10 come richiesto dall'utente): confronta ogni `latex` di `data.ts` e ogni `$…$` dell'MDX con l'immagine della pagina citata.
4. **Correttore:** applica tutti i findings, riesegue il validatore.
5. **Ciclo fino a esaurimento:** i passi 2-4 si ripetono finché due revisori consecutivi non restituiscono findings materiali (massimo 4 giri; i findings residui vanno nel report).

Ordine di esecuzione:
- [ ] **Step 1: Pilota** su `m09-parzen-windows`. Leggere il risultato di persona, aprire la pagina nel browser, correggere guida, validatore e prompt. Mostrare il pilota all'utente.
- [ ] **Step 2: Cap. 2 completo** (`m03`-`m10`), priorità dell'utente, con doppio revisore di fedeltà formule.
- [ ] **Step 3: Melgani restante** (`m01`, `m02`, `m11`-`m22`).
- [ ] **Step 4: Passerini** (`p01`-`p14`).
- [ ] **Step 5: Ricci** (`d01`-`d14`).
- [ ] **Step 6:** Verifica aggregata.

Run: `for id in $(node -e "require('./docs/plan/modules.json').forEach(m=>console.log(m.id))"); do npx tsx scripts/validate-module.ts $id || echo "KO $id"; done`
Expected: 50 righe `PASS`, nessun `KO`

- [ ] **Step 7: Commit** per modulo: `git commit -m "content: <moduleId>"`

### Task 6.2: Report di copertura globale

**Files:** Create `scripts/coverage-report.ts`, `docs/reports/copertura.md`

- [ ] **Step 1:** Lo script unisce inventari e `coverage` di tutti i moduli: concetti totali, coperti da teoria, da formula, da widget, da pratica; elenco di eventuali buchi (atteso vuoto).
- [ ] **Step 2:** Run `npx tsx scripts/coverage-report.ts`. Expected: "Concetti coperti: N/N (100%)".
- [ ] **Step 3: Commit** `git commit -m "docs: global coverage report"`

---

## Fase 7: Produzione dei widget (tutti i concetti)

### Task 7.1: Workflow di produzione per widget

**Files:** Create `src/widgets/<moduleId>/<widgetId>.widget.tsx` (+ `<widgetId>.test.ts` per la logica) per ogni widget dell'inventario

**Interfaces:**
- Consumes: `docs/WIDGET_GUIDE.md`, inventario (storyboard, interazioni, visual, aha, formule, sfida), kit, `src/lib/ml`, `src/lib/datasets`, `data.ts` del modulo (formule e testi coerenti)
- Produces: widget che passano G5

Pipeline per widget:
1. **Implementatore:** legge guida, i 3 widget di riferimento e la specifica dall'inventario; implementa; scrive i test della logica; esegue `npx vitest run src/widgets/<moduleId>` e `npx tsc -p tsconfig.app.json --noEmit`; esegue `node scripts/snap-widget.mjs <widgetId>`; apre gli screenshot con Read e corregge ciò che vede.
2. **Revisore:** con gli screenshot e il codice valuta: correttezza matematica (formule live coerenti con la fonte), fedeltà allo storyboard, leggibilità nei due temi e a 390 px, reduced motion, tastiera, prestazioni (nessun re-render per frame di tutto l'albero, canvas per campi densi). Restituisce findings.
3. **Correttore:** applica e ricattura.
4. Ciclo massimo 2 giri; findings residui nel report `docs/reports/widgets.md`.

- [ ] **Step 1:** Controllare lo spazio su disco (`Get-PSDrive C`), almeno 1,5 GB liberi.
- [ ] **Step 2:** Lanciare un workflow per corso (Melgani, poi Passerini, poi Ricci), widget di un modulo in parallelo, moduli in pipeline.
- [ ] **Step 3:** Verifica G5.

Run: `npx tsx scripts/widget-check.ts` (confronta `widgetIds()` con tutti gli id degli inventari e cerca screenshot con errori di console)
Expected: "Widget implementati: N/N, errori console: 0"

- [ ] **Step 4:** Suggerire all'utente `/ui-design:review-animations` sui moduli del Cap. 2.
- [ ] **Step 5: Commit** per modulo: `git commit -m "widget: <moduleId>"`

---

## Fase 8: Giochi, simulatore d'orale e integrazione

### Task 8.1: Banca domande d'esame

**Files:** Create `src/content/exam-bank.ts`, `scripts/bank-check.ts`

- [ ] **Step 1:** Un agente scompone `_sources/nlm_text/exam_questions.txt` in domande atomiche verbatim con `{ id, text, prof, part: 'Melgani' | 'Passerini' | 'Deep Learning', moduleIds[] }`.
- [ ] **Step 2:** `bank-check.ts`: ogni domanda della banca ha almeno un `ExamQuestion` con `bankText` corrispondente in uno dei moduli indicati.

Run: `npx tsx scripts/bank-check.ts`
Expected: "Domande della banca coperte: N/N"

- [ ] **Step 3: Commit** `git commit -m "content: exam question bank mapping"`

### Task 8.2: Simulatore dell'orale

**Files:** Create `src/pages/OralSimulator.tsx`, `src/components/practice/ExamCard.tsx`

- [ ] **Step 1:** Flusso: scegli parte (Melgani, Passerini, Ricci, mista) e modalità (solo domande reali della banca, tutte); estrazione casuale pesata sulle domande meno ripassate; timer; testo in italiano e in inglese; "Rispondi ad alta voce" (Web Speech API se disponibile, trascrizione mostrata, altrimenti solo timer); rivela la checklist dei punti attesi e la risposta modello; autovalutazione 0-3; domande di approfondimento; storico in `recordExam`.
- [ ] **Step 2:** Test: estrazione deterministica con seed, timer, registrazione del voto.
- [ ] **Step 3: Commit** `git commit -m "feat: oral exam simulator"`

### Task 8.3: Giochi

**Files:** Create in `src/pages/games/`: `FormulaMatch.tsx`, `FillFormula.tsx`, `ProofOrder.tsx`, `TrueFalseSprint.tsx`, `WhoAmI.tsx`, `ExerciseGym.tsx`, `ConceptSort.tsx`, `GamesHub.tsx`; Test `games.test.tsx`

| Gioco | Dati | Meccanica |
|---|---|---|
| Formula Match | `formulas` | memory: coppie nome ↔ formula, tempo e mosse |
| Completa la formula | `formulas[].blanks` | scegli il pezzo mancante tra i distrattori |
| Riordina la dimostrazione | `derivations[].steps` | trascina i passaggi nell'ordine giusto, poi leggi i "perché" |
| Vero/Falso Sprint | `quiz` di tipo `tf` | 60 secondi, combo, errori da ripassare |
| Chi sono? | `glossary` | definizione → termine IT/EN con indizi progressivi |
| Palestra esercizi | `exercises` | esercizi numerici infiniti con livelli |
| Smista i concetti | moduli e prof | trascina concetti nel docente/modulo giusto |

- [ ] **Step 1:** Test per ogni gioco con dati finti: vittoria, errore, punteggio, tastiera.
- [ ] **Step 2:** FAIL → implementazione → PASS. Ogni gioco filtra per corso e modulo.
- [ ] **Step 3: Commit** `git commit -m "feat: study games"`

### Task 8.4: Integrazione globale dei contenuti

- [ ] **Step 1:** Workflow "coerenza": un agente per corso verifica terminologia IT/EN uniforme, formule duplicate tra moduli con notazione diversa (allineare alla fonte, segnalare nelle note), `connections` e prerequisiti bidirezionali, `ModLink` validi.
- [ ] **Step 2:** Rigenerare indice di ricerca e glossario unificato.
- [ ] **Step 3:** `npm run build`. Expected: OK.
- [ ] **Step 4: Commit** `git commit -m "content: cross-module consistency pass"`

---

## Fase 9: Revisione, verifica e rifinitura

### Task 9.1: Gate automatici

- [ ] **Step 1:** `node scripts/check-inventory.mjs` → 50 PASS (G0)
- [ ] **Step 2:** `node scripts/page-coverage.mjs` → tutte le pagine citate (G1)
- [ ] **Step 3:** validatore su 50 moduli → 50 PASS (G2, G3, G4, G6)
- [ ] **Step 4:** `npx tsx scripts/widget-check.ts` → 100% widget, 0 errori console (G5)
- [ ] **Step 5:** `npx tsx scripts/bank-check.ts` → 100% domande (G7)
- [ ] **Step 6:** `npm run build && npx vitest run && npm run lint` → tutto verde (G8)

### Task 9.2: Revisioni di qualità con le skill

- [ ] **Step 1:** `impeccable detect --json src` una volta; correggere i problemi meccanici.
- [ ] **Step 2:** `ui-design:fixing-accessibility` su shell, pagina modulo, flashcard, quiz, simulatore e 10 widget campione.
- [ ] **Step 3:** `ui-design:improve-animations` e `ui-design:fixing-motion-performance` sui widget del Cap. 2 e su 10 widget campione per corso.
- [ ] **Step 4:** `ui-design:21st-ui-review` o `ui-design:baseline-ui` su shell e pagine globali.
- [ ] **Step 5:** `ui-design:lighthouse` sulla build di produzione (`npm run build && npm run preview`), obiettivo Performance ≥ 90 su Home e pagina modulo, Accessibility ≥ 95.
- [ ] **Step 6:** Screenshot desktop e mobile in `.impeccable/review/`, poi finish reviewer di impeccable con direction contract e screenshot; applicare la disposizione (fix/rebuild/recapture/ship) come da `reference/new-work.md` sezione 7; documenter per `DESIGN.md` e `.impeccable/design.json`.
- [ ] **Step 7:** `ui-design:verification-before-completion`: percorso reale nel browser (Home → modulo m09 → Teoria → widget Parzen → Flashcard → Quiz → Orale → Formulario → Fonti) su desktop e mobile, entrambi i temi, con console pulita.
- [ ] **Step 8: Commit** `git commit -m "fix: review findings"`

---

## Fase 10: Consegna

### Task 10.1: Documentazione e passaggio all'utente

**Files:** Modify `README.md`

- [ ] **Step 1:** README in italiano: requisiti (Node 22+), `npm install`, `npm run dev`, `npm run build && npm run preview`, struttura delle cartelle, come rigenerare figure e pagine sorgente, come aggiungere un modulo, come eseguire i gate.
- [ ] **Step 2:** Riepilogo finale all'utente: numeri reali (moduli, concetti, formule, widget, flashcard, quiz, domande), percorso consigliato di studio, link al report di copertura.
- [ ] **Step 3:** Chiedere all'utente se vuole il deploy (es. Vercel) prima di farlo.
- [ ] **Step 4: Commit** `git commit -m "docs: readme and handoff"`

---

## Self-review del piano

- **Copertura dei requisiti dell'utente:** notebook NotebookLM usato (Task 0.1); tutte le fonti e tutte le parti (manifest a 50 moduli); nulla perso (G0-G7, pagina Copertura); formule e logica (fedeltà formule doppia per il Cap. 2, derivazioni, gioco Riordina la dimostrazione); immagini (figure ritagliate + viewer delle pagine originali); giochi (Task 8.3); riassunti (tab Riassunto, `summary`, `keyPoints`); esempi (`<Example>`, esercizi generativi); interattività animata con esempi reali per ogni concetto (inventario con widget per concetto, gate di copertura `widget:`, Fase 7); React/Vite (Stack); italiano con termini inglesi (Global Constraints); piano per fasi e task (questo documento).
- **Placeholder:** gli id esatti dei widget di riferimento e le checklist per modulo dipendono dall'inventario della Fase 1 e sono generati dal Task 1.3, non lasciati in sospeso.
- **Coerenza dei tipi:** `ModuleData`, `WidgetMeta`, `coverage` e la whitelist dei componenti MDX coincidono tra Task 3.2, 3.7, 3.10 e 4.1.
