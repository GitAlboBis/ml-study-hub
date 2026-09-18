---
version: 1
slug: "src-pages-modulepage-tsx"
primary_target: "src/pages/ModulePage.tsx"
related_targets: ["src/components/layout/AppShell.tsx","src/pages/Home.tsx","src/pages/CourseMap.tsx"]
---

# Surface brief: pagina modulo (`/m/:moduleId/:tab?`)

## Scope and visitor mode

Pagina di un modulo di studio (50 moduli). Modalità **Read**: il visitatore deve capire un concetto. Le aree di pratica collegate (giochi, flashcard, quiz, simulatore d'orale) sono **Operate** dentro lo stesso mondo.

## Audience, job, content, constraints

- Chi: lo studente che prepara l'orale di Machine Learning (Trento). Studia ovunque: scrivania, biblioteca, autobus. Tema chiaro e scuro e mobile sono tutti di prima classe.
- Lavoro: capire ogni concetto delle slide e saperlo ridire all'orale con formula, disegno e dimostrazione.
- Contenuto: teoria MDX con formule KaTeX, widget animati con esempi reali, figure ritagliate dalle fonti, esempi svolti, domande reali della banca.
- Motivazione: sfida e punteggi insieme a un progresso calmo e visibile (risposta dell'utente: "tutto quanto").
- Sembrerebbe sbagliato: una dashboard SaaS; un PDF impaginato.
- Vincoli: nessun concetto perso; WCAG 2.2 AA nei due temi; `prefers-reduced-motion`; tastiera ovunque; dati sintetici dichiarati.

## Direction contract

**THESIS.** L'app è un atlante: ogni modulo è un foglio, ogni concetto un terreno vivo in falso colore che risponde alla mano, e la formula è la legenda numerica di quel terreno. Rifiuta la griglia di card con anelli di progresso e la colonna bianca da articolo LaTeX.

**OWN-WORLD.** Carta da rilievo fredda `#F3F5F1` e inchiostro blu-notte `#0B1D3A`; falso colore a campi pieni: rosso vegetazione `#D7263D`, verde-acqua `#19B5A5`, ocra suolo `#F2B632`. Di notte il fondo diventa acqua profonda e i campi si accendono. Cornice del foglio con tacche e coordinate, legenda a tasselli quadrati, isolinee sottili, spilli; nessun raggio sulle cornici. Lettering cartografico in una sola superfamiglia: la classe dell'informazione si codifica con larghezza, maiuscolo, corsivo e spaziatura (il corsivo è riservato all'intuizione, come l'idrografia sulle carte); cifre e coordinate in un mono da strumentazione di bordo. Rilanci ereditati: un solo reticolo governa testo, formule e widget; la prosa resta acromatica e il colore vive solo in mappe, legenda e cornice; l'apparato (pagina della fonte, termine inglese, segnale "da orale") sta nel margine agganciato alla sua riga; il punto in cui ti sei fermato è uno spillo sul foglio e ciò che rimandi resta appuntato sull'indice dell'atlante.

**STORY.** Lo studente apre un foglio e capisce dal terreno che cosa fa il concetto prima di leggere; legge la nota illustrativa con la formula agganciata al terreno; poi fa il rilievo sul campo (quiz, flashcard, orale) e vede il foglio segnato come rilevato nell'indice dell'atlante.

**FIRST VIEWPORT.** Desktop 1440: cornice alta circa 72 px con "FOGLIO 09" in maiuscolo extra condensato (numero a circa 96 px che sborda nella cornice), titolo italiano a 40 px e titolo inglese in corsivo sotto; a destra le coordinate del foglio (capitolo, pagine della fonte) e lo stato del rilievo. Sotto, legenda a sinistra (3 colonne su 12) con tasselli colorati che fanno da indice; a destra (9 su 12) il terreno vivo alto circa 56vh, a campi pieni, con isolinee animate e cursore-quota; sotto il terreno la formula viva con i valori e i cursori; il margine destro porta fonte, termine inglese e segnale d'orale. Azione primaria: Play/Passo, ancorata in basso a sinistra del terreno. Mobile 390: cornice compatta, terreno a tutta larghezza alto 60vh, legenda in un foglio a scomparsa dal basso, margine che rientra in linea sotto il paragrafo.

**FORM.** Atlante in falso colore (compositi satellitari e carte tematiche di classificazione), posizione 5 della lista ordinata, seed `d584af00`, build code-led. Interazione firma, "legenda viva": passare o mettere a fuoco un tassello accende il suo territorio nel terreno e i suoi simboli nella formula; il cursore-quota legge coordinate e valore nel margine. Grammatica del moto: le isolinee si tracciano, le tinte ipsometriche salgono a bande, gli spilli cadono e si smorzano una volta sola; con reduced motion tutto procede a passi.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment

Trascini lo slider `h` e il terreno di Parzen passa da un arcipelago di picchi a una pianura liscia, mentre nella formula i numeri cambiano e in legenda si accende "over-smoothing".

## Unresolved decisions

- Verifica di leggibilità della superfamiglia scelta per il testo lungo (si decide sul pilota m09 nel browser, nei due temi).
- Palette categorica dei grafici a 6 classi: da validare per daltonismo con la skill `dataviz` prima di fissare `--viz-class-*`.
