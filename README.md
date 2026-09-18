# ML Study Hub · Atlante di Machine Learning

Web app di studio per l'esame orale di Machine Learning dell'Università di Trento (parte Melgani, Cap. 1-4; parte Passerini; Deep Learning di Ricci). Ogni modulo del corso è un "foglio" di un atlante: teoria completa con le formule dei docenti, un widget animato con un esempio reale per ogni concetto, esempi svolti, figure delle slide, flashcard con ripetizione dilazionata, quiz, esercizi generati e simulatore dell'orale. Spiegazioni in italiano, ogni termine tecnico anche in inglese.

## Avvio

Serve Node 22 o successivo.

```bash
npm install
npm run dev
```

Poi apri http://localhost:5173. Il foglio pronto per primo è `/m/m09-parzen-windows`.

```bash
npm run build && npm run preview   # versione di produzione
npx vitest run                     # test
npm run lint
```

## Stato

Il lavoro procede per fasi: vedi [docs/STATO.md](docs/STATO.md) per cosa è fatto e cosa manca, e [docs/superpowers/plans/2026-09-17-ml-study-app.md](docs/superpowers/plans/2026-09-17-ml-study-app.md) per il piano completo.

## Struttura

| Cartella | Contenuto |
|---|---|
| `docs/plan/` | i 50 moduli con gli intervalli di pagina delle fonti, gli scenari dei widget, la direzione di design |
| `docs/inventory/` | inventario atomico di ogni modulo: concetti, formule, derivazioni, esempi, figure, widget, domande della banca |
| `src/content/modules/<id>/` | i contenuti di un foglio: `index.mdx` (teoria) e `data.ts` (formule, derivazioni, pratica, copertura) |
| `src/widgets/` | kit dei widget, motori riusabili e widget di ogni foglio |
| `src/components/`, `src/pages/` | shell dell'atlante, componenti dei contenuti e della pratica, pagine |
| `src/lib/ml/`, `src/lib/datasets/` | algoritmi numerici e dati sintetici usati dai widget |
| `public/sources/`, `public/figures/` | pagine delle fonti in WebP e figure ritagliate |
| `scripts/` | validatori (inventario, modulo, formule, pagine), strumenti per figure e screenshot, workflow multi-agente |

## Controlli di completezza

```bash
node scripts/inventory-status.mjs                  # stato dell'inventario per modulo
node scripts/check-inventory.mjs <id>              # inventario valido e pagine delle fonti tutte citate
npx tsx scripts/validate-module.ts <id>            # ogni concetto dell'inventario ha un posto nel foglio
npx tsx scripts/formula-coverage.ts <id>           # ogni formula dell'inventario è arrivata nel foglio
node scripts/snap.mjs <percorso> <file.png>        # screenshot con Chrome headless (serve npm run dev)
```

Le fonti estratte (`_sources/`: testo e immagini delle pagine dei PDF del corso) non sono nel repository.
