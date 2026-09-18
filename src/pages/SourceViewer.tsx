// Viewer delle fonti (/fonti/:doc/:page): la pagina originale in WebP (public/sources/<doc>/pNNN.webp), avanti e
// indietro con i collegamenti o con le frecce della tastiera, salto a una pagina, e l'elenco dei fogli che citano
// quella pagina nel loro intervallo di fonti (dal manifest). Documento e pagina li verifica la pagina stessa.
import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BTN_PRIMARY, BTN_SECONDARY, HATCH, Icon } from '../components/content/shared'
import type { DocId } from '../content/types'
import { DOCS, isDocId, modulesCitingPage, pageLabel, sheetNumber, sourcePageUrl } from '../lib/atlas'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const NAV_LINK = `${BTN_SECONDARY} no-underline`

/** Le frecce sfogliano, tranne quando il fuoco è in un campo che le usa per sé. */
const typingIn = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

function NotFound({ doc, page }: { doc: string; page: string }) {
  useDocumentTitle('Pagina della fonte non trovata')
  return (
    <main className="mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <div className={`grid min-h-32 content-end border-2 border-border-strong p-5 ${HATCH}`}>
        <h1 className="m-0 justify-self-start bg-surface px-2 font-label text-[length:var(--step-3)] font-bold">Pagina della fonte non trovata</h1>
      </div>
      <p className="m-0 mt-6 max-w-[var(--measure)] text-muted">
        {isDocId(doc)
          ? `${DOCS[doc].long} ha ${DOCS[doc].pages} pagine: la pagina «${page}» non c'è.`
          : `Non esiste un documento «${doc}» tra le fonti del corso.`}{' '}
        Apri una delle fonti dalla prima pagina:
      </p>
      <ul role="list" className="m-0 mt-4 grid list-none gap-2 p-0">
        {(Object.keys(DOCS) as DocId[]).map((d) => (
          <li key={d} className="m-0">
            <Link to={`/fonti/${d}/1`}>{DOCS[d].long}</Link> <span className="num text-[length:var(--step--1)] text-muted">· {DOCS[d].pages} pagine</span>
          </li>
        ))}
      </ul>
    </main>
  )
}

function Viewer({ doc, page }: { doc: DocId; page: number }) {
  const info = DOCS[doc]
  const navigate = useNavigate()
  const inputId = useId()
  const [target, setTarget] = useState(String(page))
  const [shownPage, setShownPage] = useState(page)
  const [wide, setWide] = useState(false)
  const label = pageLabel(doc, page)
  const citing = modulesCitingPage(doc, page)
  const prev = page > 1 ? page - 1 : null
  const next = page < info.pages ? page + 1 : null
  useDocumentTitle(`${info.short} · ${label}`)

  // cambiando pagina il campo "vai a" segue la pagina aperta
  if (shownPage !== page) {
    setShownPage(page)
    setTarget(String(page))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || typingIn(e.target)) return
      const to = e.key === 'ArrowLeft' ? prev : e.key === 'ArrowRight' ? next : null
      if (to === null) return
      e.preventDefault()
      navigate(`/fonti/${doc}/${to}`)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [doc, prev, next, navigate])

  const go = () => {
    const n = Math.round(Number(target))
    if (Number.isFinite(n) && n >= 1 && n <= info.pages && n !== page) navigate(`/fonti/${doc}/${n}`)
  }

  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b-2 border-border-strong pb-4">
        <div className="min-w-0">
          <h1 className="m-0 font-label text-[length:var(--step-3)] leading-tight font-bold">{info.long}</h1>
        </div>
        <p className="num m-0 text-[length:var(--step-1)]" aria-live="polite">
          <span className="text-muted">{info.short} ·</span> {info.slides ? 'slide' : 'pagina'} {page} <span className="text-muted">di {info.pages}</span>
        </p>
      </header>

      <div className="mt-6 grid gap-8 @4xl:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0">
          <nav aria-label="Sfoglia la fonte" className="flex flex-wrap items-center gap-3">
            {prev !== null ? (
              <Link to={`/fonti/${doc}/${prev}`} className={NAV_LINK}>
                <Icon name="arrow" size={18} className="rotate-180" />
                Precedente
              </Link>
            ) : (
              <span aria-hidden="true" className={`${BTN_SECONDARY} pointer-events-none opacity-40`}>
                <Icon name="arrow" size={18} className="rotate-180" />
                Precedente
              </span>
            )}
            {next !== null ? (
              <Link to={`/fonti/${doc}/${next}`} className={NAV_LINK}>
                Successiva
                <Icon name="arrow" size={18} />
              </Link>
            ) : (
              <span aria-hidden="true" className={`${BTN_SECONDARY} pointer-events-none opacity-40`}>
                Successiva
                <Icon name="arrow" size={18} />
              </span>
            )}
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                go()
              }}
            >
              <label htmlFor={inputId} className="label">
                Vai alla pagina
              </label>
              <input
                id={inputId}
                type="number"
                inputMode="numeric"
                min={1}
                max={info.pages}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="num min-h-10 w-20 border border-border-strong bg-surface px-2 text-text"
              />
              <button type="submit" className={`${BTN_PRIMARY} min-h-10`}>
                Vai
              </button>
            </form>
            <button type="button" aria-pressed={wide} onClick={() => setWide(!wide)} className={`${BTN_SECONDARY} min-h-10 @4xl:ml-auto`}>
              <Icon name="zoom" size={18} />
              A tutta larghezza
            </button>
          </nav>
          <p className="m-0 mt-2 text-[length:var(--step--1)] text-muted">Le frecce ← e → della tastiera sfogliano le pagine.</p>

          <figure className="m-0 mt-4 border border-border-strong bg-surface-2">
            <img
              key={`${doc}-${page}`}
              src={sourcePageUrl(doc, page)}
              alt={`${info.long}, ${label}`}
              decoding="async"
              className={`mx-auto h-auto w-auto ${wide ? 'max-w-full' : 'max-h-[78dvh] max-w-full'}`}
            />
          </figure>
        </div>

        <section aria-labelledby="citata" className="self-start border-t-2 border-border-strong pt-3 @4xl:sticky @4xl:top-20">
          <h2 id="citata" className="label m-0">
            Citata nei fogli
          </h2>
          {citing.length === 0 ? (
            <p className="m-0 mt-2 text-[length:var(--step--1)] text-muted">Nessun foglio cita questa pagina nel suo intervallo di fonti.</p>
          ) : (
            <ul role="list" className="m-0 mt-2 grid list-none gap-2 p-0">
              {citing.map((m) => (
                <li key={m.id} className="m-0">
                  <Link to={`/m/${m.id}/fonti`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 text-[length:var(--step--1)]">
                    <span className="num">
                      <span className="visually-hidden">Foglio</span> {sheetNumber(m.id)}
                    </span>{' '}
                    <span>{m.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default function SourceViewer() {
  const { doc = '', page = '' } = useParams()
  const n = Number(page)
  if (!isDocId(doc) || !/^\d+$/.test(page) || n < 1 || n > DOCS[doc].pages) return <NotFound doc={doc} page={page} />
  return <Viewer doc={doc} page={n} />
}
