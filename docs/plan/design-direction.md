# Direzione di design: lavoro preparatorio (Fase 2, Task 2.1)

Flusso `ui-design:impeccable` → `reference/new-work.md`, sezione "Create or replace the visual world". Seed del dado: `d584af00` (scope direction, mode read). Build path: code-led (nessuna generazione di immagini disponibile senza spendere crediti dell'utente).

## Risposte dell'utente (2026-09-17)

- Scena d'uso: **ovunque** → tema chiaro e scuro entrambi di prima classe, mobile di prima classe (non solo per la pratica).
- Motivazione: **tutto quanto** → sfida e punteggi (serie, record, combo) insieme a un progresso calmo e visibile.
- Sembrerebbe sbagliato: **una dashboard SaaS** e **un PDF impaginato**. Non ha escluso né l'energia da gioco né le animazioni.

## Meccanismo, scena, mondo

- Meccanismo unico: ogni concetto delle slide del docente diventa qualcosa che si tocca, con la formula che cambia i suoi numeri mentre trascini un campione.
- Scena reale: studente di ingegneria/informatica di Trento che prepara un orale alla lavagna; studia alla scrivania, in biblioteca, in autobus.
- Il rut da evitare: la piattaforma di corsi a card con anelli di progresso, e il suo opposto prevedibile, l'articolo accademico in stile LaTeX. Entrambi esclusi anche dall'utente.

## Sette candidati radicati, ordinati per risonanza (prima del dado)

1. Banco di misura: oscilloscopi, analizzatori, pannelli con manopole (strumenti).
2. Tavole a colori dei manuali: le figure sature di Bishop e Duda-Hart-Stork (grafica scientifica a stampa).
3. Mappa della metropolitana e segnaletica: il corso come rete di linee e stazioni (programmi di identità e orientamento).
4. Lavagna d'aula con gessi colorati (superfici dell'aula).
5. **Atlante in falso colore**: compositi da satellite e carte tematiche di classificazione, il mondo di ricerca di Melgani (immagini scientifiche e cartografia). ← assegnato dal dado
6. Sala giochi: display a punteggio, combo, record (schermi di gioco).
7. Quaderno a quadretti con evidenziatori (cartoleria).

## Verdetti sugli sfidanti del catalogo

| Sfidante | Verdetto | Cosa resta alla direzione assegnata |
|---|---|---|
| Piega curva (origami) | declinato | Un solo reticolo governa tutto il foglio |
| Bordo iridescente (nubi) | declinato: è il look da PDF escluso | Testo acromatico, colore solo dove c'è il fenomeno |
| Identità a seme (generativa) | competitivo sull'identificazione | carta completa |
| Edizione a binario centrale | declinato: è il PDF impaginato | Apparato nel margine, agganciato alla riga |
| Spettro a righe (emissione) | competitivo sull'identificazione | carta completa |
| Banco di montaggio (pellicola) | declinato | Il punto in cui ti sei fermato è marcato fisicamente, ciò che rimandi resta in vista |

## Perché l'atlante regge tutto il corso

In machine learning quasi tutto è già una mappa: isolinee delle densità (Cap. 2), regioni di decisione e confini (Cap. 4, SVM), feature map (CNN), loss landscape e discesa del gradiente (ottimizzazione), attention map (transformer), gridworld (RL), spazio latente (VAE, GAN). La pagina di scelta è in `.impeccable/decision-round1.json`.

## Esito

In attesa della scelta dell'utente sulla pagina di decisione (round 1). Dopo la scelta: direction contract nel surface brief di `src/pages/ModulePage.tsx`, poi Task 2.2 (token e tipografia).
