# Note di design (provvisorie)

Il `DESIGN.md` definitivo si scrive a fine build, dal mondo costruito (regola di `ui-design:impeccable`). Qui si tengono le decisioni già prese e le prove, perché servono a chi costruisce componenti e widget.

- Direzione scelta dall'utente il 2026-09-17: **Atlante in falso colore**. Contratto: `.impeccable/surfaces/src-pages-modulepage-tsx.md`. Lavoro preparatorio e verdetti: `docs/plan/design-direction.md`.
- Riferimento vivo: rotta `/lab/_tavola` (Tavola dei segni convenzionali): palette, classi con forma, ruoli, rampe, lettering, prosa con formule, stati, nei due temi.
- Token: `src/styles/tokens.css`. Tailwind 4 non porta la sua palette (`--color-*: initial`): esistono solo i colori del mondo. `base.css` è in `@layer base` e `prose.css` in `@layer components`, così le utility vincono; `katex.css` resta fuori dai layer per poter correggere `katex.min.css`.
- Tema: attributo `data-theme` su `<html>`, impostato prima del primo paint da `index.html` (chiave `ml-study-theme` in localStorage, altrimenti il sistema). API in `src/lib/theme.ts`.

## Regole del mondo

1. Un solo reticolo governa il foglio: testo, formule e widget si registrano sulle stesse colonne.
2. La prosa è acromatica. Il falso colore vive in mappe, legenda e cornice, mai dietro il testo corrente.
3. L'apparato (pagina della fonte, termine inglese, segnale "da orale") sta nel margine, agganciato alla sua riga; su schermi stretti rientra sotto il paragrafo.
4. Azioni a inchiostro (pulsanti pieni blu-notte di giorno, chiari di notte). Lo **spillo** ocra segna la posizione e ciò che è in evidenza. Il rosso NON è un colore di stato dell'interfaccia: è vegetazione (classe 1, regione Melgani). Errore e successo usano i token di stato, sempre con icona ed etichetta.
5. Angoli vivi su cornici e tasselli; raggio solo sui piccoli controlli. Elevazione: bordo per le cornici, ombra solo per ciò che si sovrappone.
6. Lettering: una superfamiglia (Sofia Sans, Condensed, Extra Condensed). La classe dell'informazione si codifica con larghezza, maiuscolo, corsivo e spaziatura; il corsivo è riservato a intuizione e termini inglesi. Cifre e coordinate in Overpass Mono (classe `.num`). Caratteri ospitati in locale (`@fontsource`), l'app si usa anche senza rete.
7. Identità di classe mai solo con il colore: ogni classe ha anche una forma del marcatore (`src/widgets/kit/plot/marks.ts`).

## Palette dei grafici: prove

Calcolata con `validate_palette.js` della skill `dataviz` (OKLab, simulazione Machado 2009), separatamente per i due temi.

| Tema | Superficie | Classi 1-6 | Coppie tutte (1-4) | Adiacenti (1-6) | Contrasto minimo |
|---|---|---|---|---|---|
| Giorno | `#F3F5F1` | `#EC5258 #004FB1 #835600 #009F8C #682DAC #D14693` | ΔE daltonici 10,2 · visione normale 21,9 | ΔE 13,2 · 22,3 | 3,02:1 |
| Notte | `#0E2344` | `#CC323E #1069DA #C38300 #018E7D #8851D1 #E356A2` | ΔE 9,5 · 18,2 | ΔE 11,6 · 18,9 | 3,02:1 |

- Nei piani 2D (scatter, regioni) qualsiasi coppia può toccarsi: con il solo colore reggono **4 classi**. Blu e viola collassano per i deuteranopi (ΔE 1,0), quindi la 5 e la 6 contano sulla forma del marcatore: mai una sesta classe distinta solo dal colore.
- L'ocra dei segni di giorno è scura (`#835600`) perché un giallo non raggiunge 3:1 sulla carta; l'ocra piena `#F2B632` resta per campi e spillo, dove il testo è a inchiostro (9,2:1).
- Rampa sequenziale a una tinta (hue 215, batimetria), 7 passi, ΔL ≥ 0,06, estremo chiaro ≥ 2:1 sulla superficie; di notte la rampa si ribalta. Rampa divergente blu ← grigio neutro → rosso.
- Testo: tutti i token di testo ≥ 4,5:1 su `--bg`, `--surface` e `--surface-2` nei due temi (minimo 4,50 per `--text-faint` su `--surface-2` di giorno).

## Verifiche fatte nel browser (2026-09-17)

`/lab/_tavola` a 1440 px giorno e notte e a 375 px: nessuno scorrimento orizzontale, console pulita, formule KaTeX a 1,08em sul testo a 18 px. Corretto un difetto: `.label` batteva le utility di Tailwind (stato selezionato dell'interruttore tema illeggibile), risolto con i layer CSS.

## Da decidere sul pilota (m09)

- Leggibilità di Sofia Sans su sessioni lunghe, nei due temi, con molta matematica in linea.
- Densità della cornice del foglio su mobile.
