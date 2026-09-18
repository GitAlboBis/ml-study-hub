# Guida per gli autori dei contenuti

Chi scrive un modulo legge questa guida per prima. Tutti gli esempi qui sotto vengono da un mini-modulo vero che ha passato il validatore il 2026-09-17 (`PASS _guida: 3 concetti coperti, 1 formule, 1 derivazioni, 1 widget, 15 flashcard, 12 quiz, 5 domande, 3 esercizi`).

L'utente ha chiesto di **non perdere nulla** delle fonti: nessun concetto, informazione, formula o passaggio logico, con cura massima sul Cap. 2. Il validatore controlla che ogni concetto dell'inventario abbia un posto nel modulo; a te resta la parte che nessuno script può fare: che quel posto contenga davvero ciò che dice la fonte.

## 1. Flusso di lavoro

1. Leggi `docs/inventory/<id>.json` (concetti, formule, derivazioni, esempi, figure, widget, esercizi, domande della banca) e, se esiste, `docs/plan/moduli/<id>.md`.
2. Apri con Read le **immagini** delle pagine citate (`_sources/pages/<doc>/pNNN.png`). Le formule delle slide sono immagini: la notazione si controlla lì, non nel testo estratto.
3. Scrivi `src/content/modules/<id>/data.ts` e `src/content/modules/<id>/index.mdx`.
4. Ritaglia le figure (sezione 7).
5. Esegui `npx tsx scripts/validate-module.ts <id>` e correggi finché stampa `PASS`. Non aggirare mai un errore togliendo contenuto: se un concetto non trova posto, il posto va creato.
6. Non toccare altri file. Niente operazioni git.

## 2. Struttura di `index.mdx`

`## Panoramica` → le sezioni **nell'ordine delle slide** → `## Collegamenti` → `## Per l'orale`.

Ogni sezione segue questo ritmo: l'intuizione con un esempio del cast (`docs/plan/cast.md`), la definizione formale, `<Formula>`, `<Widget>`, `<Example>`, e un `<Callout kind="esame">` con ciò che chiedono i docenti. La teoria si scrive per esteso in Markdown: i componenti la arricchiscono, non la sostituiscono.

I titoli `##` e `###` generano gli slug usati dalla copertura (`## La funzione finestra` → `#la-funzione-finestra`). Due titoli uguali ricevono il suffisso `-1`: evita i doppioni. I titoli `####` non valgono come destinazione di copertura.

## 3. Componenti MDX ammessi

Solo questi, con questi attributi obbligatori. Qualsiasi altro componente o elemento HTML (`<div>`, `<br>`, `<sub>`…) fa fallire il validatore: usa Markdown.

| Componente | Attributi obbligatori | A cosa serve |
|---|---|---|
| `<Formula id />` | `id` di `data.formulas` | targa della formula: nome IT/EN, display, legenda dei simboli, quando si usa, trappole, pagina |
| `<Derivation id />` | `id` di `data.derivations` | dimostrazione a passi con il perché di ogni passo |
| `<Figure id />` | `id` di `data.figures` | figura ritagliata dalla fonte, con zoom e rimando alla pagina |
| `<Widget id />` | `id` di `data.widgets` | widget interattivo (se non esiste ancora mostra "in costruzione") |
| `<Example id title>` + `<Step title>` | `id`, `title`; `title` | esempio svolto, un passo alla volta. Gli `id` devono coincidere con `workedExamples` dell'inventario |
| `<Callout kind>` | `kind`: `intuizione`, `attenzione`, `esame`, `suggerimento`, `nota`, `inglese` | riquadro semantico |
| `<Definition term en>` | `term`, `en` | definizione con il termine inglese |
| `<KeyIdea>` | nessuno | idea chiave in evidenza |
| `<Reveal label>` | `label` | contenuto nascosto fino al clic |
| `<Proof title>` | `title` | dimostrazione rigorosa comprimibile |
| `<Check id />` | `id` di `data.quiz` | quiz dentro il testo |
| `<SourceRef doc page />` | `doc` (`part1`, `part2`, `ch1`-`ch4`, `dl`, `examq`), `page={53}` intero ≥ 1 | rimando alla pagina originale |
| `<ModLink to>` | `to`: `moduleId` o `moduleId#slug` | collegamento a un altro modulo |
| `<Term en>` | `en` | termine con il suo inglese |
| `<Columns>` + `<Col title>` | `title` su `Col` | confronto affiancato |

`id`, `to`, `doc` e `kind` devono essere stringhe letterali (`id="parzen"`), non espressioni.

Esempio verificato:

```mdx
## La funzione finestra

<Definition term="Funzione finestra" en="window function">
Vale 1 dentro l'ipercubo unitario centrato nell'origine e 0 fuori: $\gamma(\mathbf{u}) = 1$ se $\vert u_j \vert \le 1/2$ per ogni $j$.
</Definition>

<Callout kind="intuizione">
Ogni campione porta con sé una piccola collina: sommandole si ottiene il terreno della densità.
</Callout>

## La stima

<Formula id="parzen" />

<Widget id="guida-somma-dei-kernel" />

<Derivation id="der01" />

<Example id="ex01" title="Tre campioni, finestra rettangolare">
<Step title="Conta i campioni nella finestra">
Con $h = 2$ e $x = 2$ la finestra copre $[1, 3]$: cadono dentro i campioni 1 e 2.
</Step>
<Step title="Applica la formula">
$$\hat{p}(2) = \frac{1}{3} \cdot \frac{2}{2} = \frac{1}{3}$$
</Step>
</Example>

<Check id="q-num" />

| $h$ | effetto |
|---|---|
| piccolo | picchi (*overfitting*) |
| grande | pianura (*over-smoothing*) |

Il metodo gemello è il <ModLink to="m08-non-parametrica-knn">K-NN</ModLink>. <SourceRef doc="ch2" page={52} />
```

### Regole di scrittura MDX

- Matematica: `$…$` in linea, `$$…$$` in display (anche su più righe). Dentro la matematica `<` e `>` vanno bene.
- Fuori dalla matematica `{` e `<` sono sintassi MDX: evitali o scrivi `\{` e `&lt;`.
- Nelle tabelle GFM il carattere `|` chiude la cella anche dentro la matematica: usa `\vert` o `\mid`.
- Un `$` di valuta si scrive `\$`.
- Lascia una riga vuota prima e dopo i componenti a blocco e dentro `<Step>` tra testo e `$$…$$`.

## 4. Regole di `data.ts`

```ts
import { defineModule, md } from '../../types'
import type { Flashcard, QuizItem } from '../../types'   // i soli tipi con "import type"

export default defineModule({ id: '<id del modulo>', … })
```

- **LaTeX sempre dentro `` md`…` ``** (è `String.raw`): un solo backslash per comando, `\theta`, `\frac`, `\nu`, `\beta` restano intatti. In una stringa normale `'\theta'` diventa un TAB più `heta`.
- Dentro `md` l'interpolazione `${…}` funziona e serve agli esercizi generativi. Attenzione al caso insidioso: una formula in linea che **inizia con una graffa**, come `` md`${\bf x}$` ``, viene letta da JavaScript come interpolazione. Riscrivila (`$\mathbf{x}$`) o metti uno spazio (`$ {…}$`). Il backtick non si può scrivere dentro `md`.
- `Latex` = LaTeX puro senza `$` (campi `latex`, `masked`, `answer`, `distractors`, `symbols[].s`, `steps[].latex`). `Rich` = Markdown con `$…$` (tutti gli altri testi). Ogni formula viene compilata con KaTeX in modalità severa: un errore di LaTeX è un errore del validatore, con il campo esatto.
- Id in kebab-case, unici per lista. `coverage` ha **una chiave per ogni concetto dell'inventario e nessuna in più**.
- Ogni `source` cita pagine reali: `{ doc: 'ch2', page: 53 }`.

Formula con le varianti "completa la formula" (importanza 3 = da sapere a memoria all'orale, richiede almeno un `blank`; ogni blank ha `\boxed{\;?\;}` al posto della risposta e almeno 2 distrattori diversi dalla risposta):

```ts
{
  id: 'parzen',
  name: 'Stima a finestre di Parzen',
  nameEn: 'Parzen windows estimate',
  latex: md`\hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \frac{1}{h^{n}} \, \gamma\!\left( \frac{\mathbf{x} - \mathbf{x}_k}{h} \right)`,
  explain: md`Ogni campione porta una finestra di volume $h^n$; la media delle finestre è la stima.`,
  symbols: [
    { s: md`\gamma(\cdot)`, meaning: 'funzione finestra (*window function*)' },
    { s: md`h`, meaning: 'larghezza della finestra' },
  ],
  whenToUse: md`Quando la forma della densità è ignota.`,
  pitfalls: md`Dimenticare il fattore $1/h^n$: senza, la stima non integra a 1.`,
  importance: 3,
  blanks: [{
    masked: md`\hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \boxed{\;?\;} \, \gamma\!\left( \frac{\mathbf{x} - \mathbf{x}_k}{h} \right)`,
    answer: md`\frac{1}{h^{n}}`,
    distractors: [md`h^{n}`, md`\frac{1}{N}`],
  }],
  source: [{ doc: 'ch2', page: 53 }],
}
```

Derivazione (almeno 3 passi, ognuno con il suo perché; gli `id` coincidono con `derivations` dell'inventario):

```ts
{
  id: 'der01',
  title: 'La stima integra a 1',
  goal: md`Mostrare che $\int \hat{p}(\mathbf{x})\,d\mathbf{x} = 1$.`,
  steps: [
    { latex: md`\int \hat{p}(\mathbf{x})\,d\mathbf{x} = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{h^n} \int \gamma\!\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right) d\mathbf{x}`, why: 'Linearità: integrale e somma si scambiano.' },
    { latex: md`\mathbf{u} = \frac{\mathbf{x}-\mathbf{x}_k}{h} \;\Rightarrow\; d\mathbf{x} = h^n\, d\mathbf{u}`, why: md`Cambio di variabile in $n$ dimensioni.` },
    { latex: md`\frac{1}{N}\sum_{k=1}^{N} \int \gamma(\mathbf{u})\, d\mathbf{u} = \frac{1}{N} \cdot N = 1`, why: 'Ogni finestra integra a 1 per ipotesi.' },
  ],
  conclusion: md`La stima è una densità per ogni $h > 0$.`,
  source: [{ doc: 'part1', page: 38 }],
}
```

I quattro tipi di quiz:

```ts
{ id: 'q-mcq', type: 'mcq', q: md`Quanto vale il volume della finestra in $n$ dimensioni?`, options: [md`$h^n$`, md`$n h$`, md`$h/n$`], answer: 0, explanation: md`L'ipercubo di lato $h$ ha volume $h^n$.`, difficulty: 1, concepts: ['c01'] },
{ id: 'q-multi', type: 'multi', q: md`Quali sono kernel validi?`, options: ['rettangolare', 'gaussiano', 'una funzione negativa'], answers: [0, 1], explanation: md`Un kernel è non negativo e integra a 1.`, difficulty: 2, concepts: ['c01'] },
{ id: 'q-tf', type: 'tf', q: md`Con $h \to 0$ la stima diventa una somma di impulsi.`, answer: true, explanation: md`Ogni finestra si stringe attorno al suo campione.`, difficulty: 1, concepts: ['c02'] },
{ id: 'q-num', type: 'numeric', q: md`Campioni in 1, 2 e 4, finestra rettangolare con $h = 2$: quanto vale $\hat{p}(2)$?`, answer: 0.3333, tolerance: 0.01, explanation: md`Cadono nella finestra 1 e 2: $\frac{1}{3}\cdot\frac{2}{2}$.`, difficulty: 2, concepts: ['c02'] },
```

Domanda d'orale presa dalla banca (`bankText` è il testo **verbatim** dell'inventario; il validatore confronta i primi 60 caratteri):

```ts
{
  id: 'or-banca',
  q: md`Spiega le finestre di Parzen e disegna l'effetto della larghezza.`,
  qEn: 'Explain Parzen windows and draw the effect of the window width.',
  prof: 'Melgani',
  fromBank: true,
  bankText: 'Explain Parzen windows and draw the effect of the window width.',
  answer: md`Parto dal volume fissato $V = h^n$ e conto i campioni che cadono nella finestra.`,
  checklist: ['formula della stima', 'ruolo di h', 'disegno con h piccolo e grande'],   // almeno 3 punti
  followUps: [{ q: md`E se $h \to 0$?`, a: 'Una somma di impulsi sui campioni.' }],
}
```

Esercizio generativo (il validatore lo esegue con 20 seed: niente `NaN`, niente eccezioni, tolleranza > 0, LaTeX valido per ogni seed; usa solo `rng`, mai `Math.random`):

```ts
{
  id: 'es01', title: 'Stima in un punto', difficulty: 1, kind: 'numerico', concepts: ['c02'],
  generate: (rng) => {
    const h = rng.pick([1, 2, 4])
    const inside = rng.int(1, 3)
    return {
      prompt: md`Con $N = 3$, $h = ${h}$ e ${inside} campioni nella finestra rettangolare, quanto vale $\hat{p}(x)$?`,
      answers: [{ label: 'p̂(x)', value: inside / (3 * h), tolerance: 0.005 }],
      solution: md`$\hat{p}(x) = \frac{${inside}}{3 \cdot ${h}}$`,
    }
  },
}
```

Copertura:

```ts
coverage: {
  c01: ['#la-funzione-finestra', 'widget:guida-somma-dei-kernel', 'quiz:q-mcq'],
  c02: ['#la-stima', 'formula:parzen', 'derivation:der01', 'example:ex01', 'widget:guida-somma-dei-kernel', 'exam:or-banca'],
  c03: ['#una-nota-storica'],   // ha noWidgetReason nell'inventario, quindi non serve un widget
}
```

Destinazioni ammesse: `#slug` (titolo `##` o `###` di questo modulo), `example:<id>`, `formula:<id>`, `derivation:<id>`, `widget:<id>`, `figure:<id>`, `quiz:<id>`, `flashcard:<id>`, `exam:<id>`, `exercise:<id>`, `seeAlso:<altroModulo>#<slug>` (solo verso un altro modulo). Per ogni concetto servono: una sezione di teoria (`#`, `example:` o `seeAlso:`); un widget (`widget:` o `seeAlso:`) a meno che l'inventario abbia `noWidgetReason`; se il concetto è di tipo `formula`, anche `formula:` o `derivation:`.

Devono inoltre comparire: **tutti** i widget dell'inventario in `data.widgets` (stessi id), **tutte** le derivazioni in `data.derivations` (stessi id), **tutti** gli esempi svolti come `<Example id>` (stessi id), **tutte** le domande della banca come `exam` con `fromBank: true`, e almeno tante figure quante sono le figure dell'inventario con importanza ≥ 2.

## 5. Stile

- Italiano, frasi brevi. Termine inglese tra parentesi e in corsivo alla prima occorrenza: «stima a massima verosimiglianza (*Maximum Likelihood estimation*, ML)».
- Notazione identica a quella del docente (vettori in `\mathbf`, cappelli, pedici, estremi delle somme).
- Nessun riempitivo: niente «è importante notare che», niente riassunti che ripetono il paragrafo. Ogni frase porta un'informazione della fonte o un'intuizione che aiuta a capirla.
- Gli esempi hanno numeri veri e il risultato. Le dimostrazioni hanno tutti i passaggi che la fonte riporta, più quelli che servono a seguirla.
- Le risposte d'orale sono in prima persona, come le direbbe lo studente, e toccano tutti i punti della `checklist`.
- Il corsivo è riservato ai termini inglesi e all'intuizione; il grassetto ai termini che si definiscono.

### Rimandi interni

Gli id (`der04`, `f-c56-3`, `ex02`, `fig07`, `c12`…) sono per te e per il validatore, **mai per lo studente**: nel testo visibile scrivi il nome della cosa. Per rimandare a un elemento del foglio usa un link Markdown verso la sua ancora, che è `<tipo>:<id>`:

```md
I passaggi sono nella dimostrazione [«la media della stima è una convoluzione»](#derivation:der04).
Vale solo sotto la condizione [«la legge stampata non è consistente»](#formula:f-c56-3).
```

Tipi: `formula`, `derivation`, `figure`, `widget`, `example`, `quiz`, `exercise`, `exam`, `flashcard`. Se l'elemento è nella scheda aperta il link ci scorre, altrimenti apre la scheda Teoria del foglio. Il validatore segnala sia un codice interno scritto nel testo sia un rimando a un elemento che non esiste.

## 6. Soglie di pratica

Con `n` = numero di concetti dell'inventario:

| Lista | Minimo |
|---|---|
| `flashcards` | max(15, 60% di n) |
| `quiz` | max(12, 50% di n), con almeno un `tf` |
| `exam` | domande della banca + 4 |
| `exercises` | max(3, esercizi dell'inventario) |
| `glossary` | 10 |

Le soglie sono un pavimento, non un obiettivo: se un modulo ha 70 concetti, 35 quiz scritti bene valgono più di 35 variazioni della stessa domanda. Distribuisci la pratica su tutti i concetti (campo `concepts`).

## 7. Figure

```bash
python scripts/fig.py grid ch2 55                                   # griglia 10x10 sulla pagina, in _sources/grid/
python scripts/fig.py crop ch2 55 0.05 0.2 0.95 0.9 public/figures/<id>/<figId>.webp   # coordinate in frazioni 0-1
python scripts/fig.py full ch2 57 public/figures/<id>/<figId>.webp
```

Apri sempre il WebP prodotto con Read per controllare il ritaglio. In `data.figures`: `{ id, file: 'figures/<id>/<figId>.webp', caption, alt, source: { doc, page } }`. `alt` è obbligatorio e descrive ciò che si vede (assi, curve, messaggio), non «grafico».

## Errori frequenti del validatore

| Messaggio | Causa e rimedio |
|---|---|
| `copertura: concetto c12 "…" non mappato` | manca la chiave in `coverage`: trova dove il concetto è spiegato e mappalo; se non è spiegato, scrivilo |
| `copertura: c12 -> destinazione inesistente #titolo` | lo slug non corrisponde a un titolo `##`/`###`: controlla accenti e punteggiatura (lo slug toglie la punteggiatura e mette i trattini) |
| `copertura: … non ha un widget` | aggiungi `widget:<id>` di un widget dell'inventario che copre quel concetto |
| `formula … : KaTeX -> …` | LaTeX non valido: quasi sempre una graffa mancante o un comando non supportato da KaTeX |
| `…: $ spaiato (formula non chiusa, a capo dentro $…$, oppure un dollaro da scrivere \$)` | una formula in linea non può andare a capo; un `$` di valuta si scrive `\$` |
| `MDX non compila (riga N…)` | una `{` o un `<` fuori dalla matematica, o una riga vuota mancante attorno a un componente |
| `MDX riga N: componente non ammesso <X>` | usa solo i componenti della sezione 3 |
| `esempio svolto dell'inventario senza <Example id="ex03">` | ogni `workedExamples[].id` deve comparire come `<Example id>` |
| `banca: domanda non inclusa -> "…"` | copia il testo della domanda dall'inventario in `bankText`, senza ritoccarlo |
| `exercise es02 [seed 3, 7]: …` | il generatore produce `NaN`, divide per zero o scrive LaTeX rotto per alcuni seed |
| `pratica: quiz 9 < 12` | sotto soglia: aggiungi domande su concetti ancora scoperti |
| `figure fig02: file mancante` | il ritaglio non è stato salvato in `public/<file>` |
