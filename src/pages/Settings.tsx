// Impostazioni (/impostazioni): tema (giorno, notte, sistema), dimensione del testo con l'anteprima di un
// paragrafo vero del foglio, riduci movimento (si somma a prefers-reduced-motion) e le informazioni sull'app.
// Il tema passa dalla stessa API dell'interruttore della barra in alto (src/lib/theme.ts) e la pagina lo legge
// con useThemeChoice, quindi resta allineata anche se lo cambi dalla barra. Le altre preferenze vivono nello
// store src/store/preferences.ts, che le applica a <html>.
// Lingua dei termini: nessuna opzione. I termini inglesi nell'app sono scritti nel testo (e nei cartigli di <Term>),
// non passano da un interruttore; e all'orale servono entrambi. La pagina lo dice invece di offrire un finto comando.
// Connettori consultati (Magic UI "animated theme toggler", "switch"; ui-layouts "toggle"): temi con rivelazione a
// cerchio e interruttori a pillola. Qui i controlli sono quelli del foglio: tasselli a radio nativi (Segmented) e
// una casella quadrata; dal "theme toggler" si tiene solo l'idea che tutti i lettori del tema restino in sincronia.
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Rich } from '../components/content/Rich'
import { BTN_SECONDARY, Icon } from '../components/content/shared'
import { Kbd } from '../components/practice/parts'
import { manifest } from '../content/manifest'
import { hasModule } from '../content/registry'
import type { DocId } from '../content/types'
import { DOCS, REGION_ORDER, REGIONS } from '../lib/atlas'
import { applyThemeChoice } from '../lib/theme'
import type { ThemeChoice } from '../lib/theme'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { usePreferences, useThemeChoice } from '../store/preferences'
import type { TextSize } from '../store/preferences'
import { Segmented } from '../widgets/kit/Segmented'
import { useReducedMotion } from '../widgets/kit/useReducedMotion'
import { PageHead, SectionHead } from './global/PageHead'
import { PAGE } from './global/ui'

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Giorno' },
  { value: 'dark', label: 'Notte' },
  { value: 'system', label: 'Sistema' },
]

const SIZES: { value: TextSize; label: string }[] = [
  { value: 'normale', label: 'Normale' },
  { value: 'grande', label: 'Grande' },
  { value: 'molto-grande', label: 'Molto grande' },
]

const PREVIEW = String.raw`La stima di Parzen mette una finestra su ogni campione e le somma: $\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{h^{n}}\,\gamma\!\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)$. Con $h$ piccolo la stima è un arcipelago di picchi, con $h$ grande una pianura liscia (*oversmoothing*).`

/** Una riga di impostazione: a sinistra che cosa fa, a destra il comando. */
function Row({ title, en, hint, children }: { title: string; en: string; hint: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-x-10 gap-y-3 border-t border-border py-5 @3xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div>
        <h3 className="m-0 font-label text-[length:var(--step-1)] leading-snug font-bold">
          {title}{' '}
          <span lang="en" className="font-body text-[length:var(--step--1)] font-normal text-muted italic">
            {en}
          </span>
        </h3>
        <p className="m-0 mt-1 text-[length:var(--step--1)] text-muted">{hint}</p>
      </div>
      <div className="min-w-0 self-center">{children}</div>
    </div>
  )
}

function Appearance() {
  const uid = useId()
  const theme = useThemeChoice()
  const textSize = usePreferences((s) => s.textSize)
  const setTextSize = usePreferences((s) => s.setTextSize)

  return (
    <section aria-labelledby={`${uid}-aspetto`} className="mt-12">
      <SectionHead id={`${uid}-aspetto`} title="Aspetto" en="Appearance" />
      <Row title="Tema" en="Theme" hint="Giorno è la carta da rilievo, Notte l'acqua profonda. Sistema segue il tema del computer e cambia con lui.">
        <Segmented id={`${uid}-tema`} label="Tema" hideLabel options={THEMES} value={theme} onChange={applyThemeChoice} />
      </Row>
      <Row title="Dimensione del testo" en="Text size" hint="Scala tutto l'atlante: testo, formule, margini e widget crescono insieme, il reticolo del foglio resta lo stesso.">
        <Segmented id={`${uid}-testo`} label="Dimensione del testo" hideLabel options={SIZES} value={textSize} onChange={setTextSize} />
        <section aria-labelledby={`${uid}-anteprima`} className="mt-4 border border-border-strong bg-surface">
          <h4 id={`${uid}-anteprima`} className="label m-0 border-b border-border-strong px-4 py-2 text-text">
            Anteprima
          </h4>
          <div className="prose max-w-[var(--measure)] px-4 py-3">
            <Rich text={PREVIEW} />
          </div>
        </section>
      </Row>
    </section>
  )
}

function Motion() {
  const uid = useId()
  const reduceMotion = usePreferences((s) => s.reduceMotion)
  const setReduceMotion = usePreferences((s) => s.setReduceMotion)
  const system = useReducedMotion()

  return (
    <section aria-labelledby={`${uid}-movimento`} className="mt-14">
      <SectionHead id={`${uid}-movimento`} title="Movimento" en="Motion" />
      <Row
        title="Riduci il movimento"
        en="Reduce motion"
        hint="Toglie transizioni e animazioni dell'interfaccia: le tinte non salgono, i passi compaiono e basta. Si somma all'impostazione del sistema, non la sostituisce."
      >
        <label className="group flex max-w-[var(--measure)] cursor-pointer items-start gap-3">
          <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} aria-describedby={`${uid}-nota`} className="peer visually-hidden" />
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center border-2 border-border-strong bg-surface text-transparent transition-[background-color,color] duration-[var(--dur-fast)] ease-out group-hover:bg-surface-2 peer-checked:bg-accent peer-checked:text-accent-contrast peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
          >
            <Icon name="check" size={18} />
          </span>
          <span className="grid gap-0.5 pt-0.5">
            <span className="font-label font-bold">Riduci il movimento nell'app</span>
            <span id={`${uid}-nota`} className="text-[length:var(--step--1)] text-muted">
              {system
                ? "Il sistema chiede già meno movimento: l'atlante lo rispetta in ogni caso, con o senza questa casella."
                : 'Il sistema non chiede di ridurre il movimento: questa casella basta per l\'atlante.'}
            </span>
          </span>
        </label>
      </Row>
    </section>
  )
}

function About() {
  const uid = useId()
  const ready = manifest.filter((m) => hasModule(m.id)).length

  return (
    <section aria-labelledby={`${uid}-info`} className="mt-14">
      <SectionHead id={`${uid}-info`} title="Informazioni sull'app" en="About" />
      <dl className="m-0 mt-2 grid gap-x-10 @3xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] [&>dd]:m-0 [&>dd]:pb-4 [&>dt]:pt-4 @3xl:[&>dd]:border-t @3xl:[&>dd]:border-border @3xl:[&>dd]:pt-4 [&>dt]:border-t [&>dt]:border-border">
        <dt className="label">Che cos'è</dt>
        <dd>
          <strong>ML Study Hub</strong>, un atlante di Machine Learning in cinquanta fogli per l'esame orale dell'Università di Trento, costruito pagina per pagina sulle slide e sulle note del corso.
        </dd>

        <dt className="label">Regioni</dt>
        <dd>
          <ul role="list" className="m-0 grid list-none gap-1 p-0">
            {REGION_ORDER.map((c) => (
              <li key={c} className="m-0">
                <strong>{REGIONS[c].name}</strong> <span className="text-muted">· {REGIONS[c].what}</span>
              </li>
            ))}
          </ul>
        </dd>

        <dt className="label">Fogli pronti</dt>
        <dd>
          <span className="num">
            {ready} di {manifest.length}
          </span>
          . Gli altri arrivano man mano: la <Link to="/copertura">Copertura</Link> mostra concetto per concetto dove l'atlante spiega ogni pagina delle fonti.
        </dd>

        <dt className="label">Fonti</dt>
        <dd>
          {/* una fonte per riga: il collegamento è alto almeno 40 px, così le righe non si toccano */}
          <ul role="list" className="m-0 grid list-none p-0">
            {(Object.keys(DOCS) as DocId[]).map((d) => (
              <li key={d} className="m-0 flex flex-wrap items-center gap-x-2">
                <Link to={`/fonti/${d}/1`} className="inline-flex min-h-10 items-center">
                  {DOCS[d].long}
                </Link>
                <span className="num text-[length:var(--step--1)] text-muted">· {DOCS[d].pages} pagine</span>
              </li>
            ))}
          </ul>
        </dd>

        <dt className="label">Lingua</dt>
        <dd>Spiegazioni in italiano; ogni termine tecnico e ogni domanda d'orale anche in inglese, sempre visibili, perché all'orale servono entrambi.</dd>

        <dt className="label">Scorciatoie</dt>
        <dd>
          <ul role="list" className="m-0 grid list-none gap-1.5 p-0">
            <li className="m-0">
              <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> <span className="text-muted">(su Mac</span> <Kbd>⌘</Kbd> <Kbd>K</Kbd><span className="text-muted">)</span> cerca nell'atlante
            </li>
            <li className="m-0">
              <Kbd>←</Kbd> <Kbd>→</Kbd> sfogliano le pagine delle fonti
            </li>
          </ul>
        </dd>

        <dt className="label">I tuoi dati</dt>
        <dd>
          Progressi e impostazioni restano in questo browser: nessun account, nessun server. Per salvarli o spostarli su un altro computer usa il backup in <Link to="/progressi">Progressi</Link>.
        </dd>
      </dl>
    </section>
  )
}

export default function Settings() {
  useDocumentTitle('Impostazioni')
  const resetPreferences = usePreferences((s) => s.resetPreferences)
  const [message, setMessage] = useState('')

  return (
    <main className={PAGE}>
      <PageHead title="Impostazioni" en="Settings" lead="Come si legge l'atlante su questo computer: tema, dimensione del testo, movimento. Le scelte si salvano da sole e valgono solo qui." />

      <Appearance />
      <Motion />

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          className={BTN_SECONDARY}
          onClick={() => {
            applyThemeChoice('system')
            resetPreferences()
            setMessage('Impostazioni predefinite ripristinate: tema del sistema, testo normale, movimento del sistema.')
          }}
        >
          <Icon name="reset" size={18} />
          Ripristina le impostazioni predefinite
        </button>
        <p role="status" aria-live="polite" className="m-0 text-[length:var(--step--1)] text-muted">
          {message}
        </p>
      </div>

      <About />
    </main>
  )
}
