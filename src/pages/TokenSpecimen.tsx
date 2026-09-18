// Tavola dei segni convenzionali: il riferimento visivo del mondo "Atlante in falso colore".
// Mostra i token così come li usano componenti e widget, nei due temi. Rotta: /lab/_tavola
import { ThemeToggle } from '../components/layout/ThemeToggle'
import { Rich } from '../components/content/Rich'
import { CLASS_SYMBOL_NAMES, classSymbolPath, classVar, fieldVar } from '../widgets/kit/plot/marks'

const COURSES = [
  { id: 'melgani', name: 'Melgani', what: 'Cap. 1-4 · stima, feature, classificazione', sheets: 'Fogli 01-22' },
  { id: 'passerini', name: 'Passerini', what: 'Bayes, reti, SVM, kernel, clustering, RL', sheets: 'Fogli 23-36' },
  { id: 'ricci', name: 'Ricci', what: 'Deep learning: reti, CNN, RNN, transformer, generativi', sheets: 'Fogli 37-50' },
] as const

const ROLES = [
  ['--viz-sample', 'campione', 'un punto del training set'],
  ['--viz-estimate', 'stima', 'ciò che stiamo costruendo: p̂(x)'],
  ['--viz-truth', 'verità a terra', 'la densità vera p(x), tratteggiata'],
  ['--viz-kernel', 'kernel', 'il contributo di un singolo campione'],
  ['--viz-boundary', 'confine', 'frontiera di decisione'],
  ['--viz-highlight', 'in evidenza', 'ciò che la legenda accende'],
] as const

const LETTERING = [
  { cls: 'font-display text-[length:var(--step-5)] leading-none font-extrabold uppercase', text: 'Foglio 09', role: 'Numero del foglio · extra condensato, maiuscolo' },
  { cls: 'font-label text-[length:var(--step-3)] font-bold', text: 'Finestre di Parzen', role: 'Titolo del foglio e delle sezioni · condensato' },
  { cls: 'font-body text-[length:var(--step-1)] italic', text: 'Parzen windows estimation', role: "Termine inglese e intuizione · corsivo, come l'idrografia sulle carte" },
  { cls: 'font-body text-[length:var(--step-0)]', text: 'Ogni campione porta con sé una piccola collina: sommandole tutte si ottiene il terreno della densità.', role: 'Nota illustrativa · testo di lettura' },
  { cls: 'label', text: 'Legenda · Fonte · Da orale', role: 'Etichette di cornice e di legenda · condensato maiuscolo spaziato' },
  { cls: 'num text-[length:var(--step--1)]', text: 'x = 2.40   h = 0.50   p̂(x) = 0.1837', role: 'Letture e coordinate · mono della segnaletica stradale' },
] as const

const PROSE = String.raw`La stima a finestre di Parzen (*Parzen windows estimation*) fissa il volume $V = h^n$ e conta quanti campioni cadono nella finestra centrata in $\mathbf{x}$. Con una funzione finestra $\gamma(\cdot)$ qualsiasi la stima diventa

$$\hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \frac{1}{h^{n}} \, \gamma\!\left( \frac{\mathbf{x} - \mathbf{x}_k}{h} \right)$$

Se $h$ è **troppo piccolo** il terreno è un arcipelago di picchi (*overfitting*); se è **troppo grande** diventa una pianura che nasconde i modi (*over-smoothing*).`

function Swatch({ fill, ink, children }: { fill: string; ink?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-24 flex-col justify-end border border-border-strong p-3" style={{ background: fill, color: ink ?? 'var(--text)' }}>
      {children}
    </div>
  )
}

function Ramp({ prefix, caption }: { prefix: string; caption: string }) {
  return (
    <figure className="m-0">
      <div className="flex h-10 border border-border-strong" role="img" aria-label={caption}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex-1" style={{ background: `var(--${prefix}-${i + 1})` }} />
        ))}
      </div>
      <figcaption className="label mt-2">{caption}</figcaption>
    </figure>
  )
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="border-t border-border-strong pt-4 font-label text-[length:var(--step-3)] font-bold">{children}</h2>
)

export default function TokenSpecimen() {
  return (
    <main className="mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pb-24">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b-2 border-border-strong py-6">
        <div>
          <p className="m-0 font-display text-[length:var(--step-5)] leading-[0.85] font-extrabold uppercase">Tavola</p>
          <h1 className="mt-3 font-label text-[length:var(--step-3)] font-bold">Segni convenzionali</h1>
          <p className="m-0 text-[length:var(--step-1)] text-muted italic">Conventional signs</p>
        </div>
        <ThemeToggle />
      </header>

      <section className="mt-16 grid gap-6">
        <H2>Le tre regioni dell'atlante</H2>
        <div className="grid gap-0 md:grid-cols-3">
          {COURSES.map((c) => (
            <Swatch key={c.id} fill={`var(--course-${c.id})`} ink={`var(--course-${c.id}-ink)`}>
              <span className="font-display text-[length:var(--step-4)] leading-none font-extrabold uppercase">{c.name}</span>
              <span className="mt-2 text-[length:var(--step--1)]">{c.what}</span>
              <span className="num mt-1 text-[length:var(--step--1)]">{c.sheets}</span>
            </Swatch>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-6">
        <H2>Classi: colore e forma, sempre insieme</H2>
        <div className="grid grid-cols-2 gap-0 sm:grid-cols-3 lg:grid-cols-6">
          {CLASS_SYMBOL_NAMES.map((shape, i) => (
            <Swatch key={shape} fill={fieldVar(i)}>
              <svg viewBox="-16 -16 32 32" width="40" height="40" aria-hidden="true" className="mb-auto">
                <path d={classSymbolPath(i, 220)} fill={classVar(i)} stroke="var(--surface)" strokeWidth="1.5" />
              </svg>
              <span className="label" style={{ color: 'inherit' }}>
                Classe {i + 1} · {shape}
              </span>
            </Swatch>
          ))}
        </div>
        <p className="m-0 max-w-[var(--measure)] text-muted">
          I colori delle classi sono calcolati e verificati per daltonismo nei due temi. Nei piani a due dimensioni le classi 1-4 si distinguono
          a coppie anche senza il colore rosso-verde; la 5 e la 6 contano sulla forma. I campi pieni portano sempre confini ed etichette a inchiostro.
        </p>
      </section>

      <section className="mt-16 grid gap-6">
        <H2>Ruoli nei grafici</H2>
        <ul className="m-0 grid list-none gap-x-8 gap-y-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map(([token, name, what]) => (
            <li key={token} className="flex items-center gap-3">
              <svg width="44" height="14" aria-hidden="true">
                <line x1="0" y1="7" x2="44" y2="7" stroke={`var(${token})`} strokeWidth="3" strokeDasharray={token === '--viz-truth' ? '6 4' : undefined} />
              </svg>
              <span>
                <strong>{name}</strong> <span className="text-muted">· {what}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="grid gap-6 md:grid-cols-2">
          <Ramp prefix="viz-seq" caption="Rampa sequenziale a una tinta · poco → tanto" />
          <Ramp prefix="viz-div" caption="Rampa divergente · negativo ← neutro → positivo" />
        </div>
      </section>

      <section className="mt-16 grid gap-6">
        <H2>Lettering cartografico</H2>
        <dl className="m-0 grid gap-6">
          {LETTERING.map((l) => (
            <div key={l.role} className="grid gap-1 border-b border-border pb-4">
              <dd className={`m-0 ${l.cls}`}>{l.text}</dd>
              <dt className="label">{l.role}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16 grid gap-6">
        <H2>Nota illustrativa</H2>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <Rich text={PROSE} className="prose" />
          <aside className="grid content-start gap-3 text-[length:var(--step--1)]" aria-label="Apparato a margine">
            <p className="label m-0">Margine</p>
            <p className="m-0 border-t border-border pt-2">
              <span className="label">Fonte</span> <span className="num">ch2 · p. 53</span>
            </p>
            <p className="m-0 border-t border-border pt-2">
              <span className="label">EN</span> <em>window function, smoothing parameter</em>
            </p>
            <p className="m-0 border-t border-border bg-pin px-2 py-2 text-pin-contrast">
              <span className="label" style={{ color: 'inherit' }}>
                Da orale
              </span>{' '}
              Disegna l'effetto di h sulla stima.
            </p>
          </aside>
        </div>
      </section>

      <section className="mt-16 grid gap-6">
        <H2>Stato</H2>
        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['ok', 'Risposta corretta', 'M4 12.5l5 5L20 6.5'],
              ['warn', 'Quasi: manca un fattore 1/N', 'M12 4v10M12 18.5v.5'],
              ['error', 'Risposta sbagliata', 'M6 6l12 12M18 6L6 18'],
              ['info', 'Dati sintetici', 'M12 10v8M12 6v.5'],
            ] as const
          ).map(([kind, text, d]) => (
            <p key={kind} className="m-0 flex items-center gap-3 border border-border p-3" style={{ background: `var(--${kind}-bg)` }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={`var(--${kind})`} strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
                <path d={d} />
              </svg>
              {text}
            </p>
          ))}
        </div>
      </section>
    </main>
  )
}
