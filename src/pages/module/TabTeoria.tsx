// Scheda Teoria: la nota illustrativa (index.mdx del modulo) con i componenti del foglio, dentro il contesto del
// modulo che la pagina ha già aperto. A sinistra l'indice del foglio che segue la lettura, a destra l'apparato a
// margine con fonte, termini inglesi e domande d'orale. Un link a una sezione (/m/:id/teoria#slug) vi porta
// appena la nota è pronta: il browser non può farlo da solo, perché la nota arriva dopo la pagina.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MDXContent } from 'mdx/types'
import { useLocation } from 'react-router'
import { mdxComponents } from '../../components/content/mdxComponents'
import { HATCH } from '../../components/content/shared'
import { collectHeadings } from '../../components/layout/reading'
import type { TocHeading } from '../../components/layout/reading'
import { Toc } from '../../components/layout/Toc'
import { loadModuleContent } from '../../content/registry'
import type { ModuleData } from '../../content/types'
import { SheetMargin } from './SheetMargin'

type ContentState = { id: string; status: 'loading' | 'missing' } | { id: string; status: 'ready'; Content: MDXContent }

export default function TabTeoria({ data }: { data: ModuleData }) {
  const [state, setState] = useState<ContentState>({ id: data.id, status: 'loading' })
  const current: ContentState = state.id === data.id ? state : { id: data.id, status: 'loading' }
  const article = useRef<HTMLElement>(null)
  const [headings, setHeadings] = useState<TocHeading[]>([])
  const { hash } = useLocation()

  useEffect(() => {
    let alive = true
    loadModuleContent(data.id).then(
      (Content) => alive && setState({ id: data.id, status: 'ready', Content }),
      () => alive && setState({ id: data.id, status: 'missing' }),
    )
    return () => {
      alive = false
    }
  }, [data.id])

  const ready = current.status === 'ready'
  // i titoli si leggono dal DOM della nota appena resa; poi, se l'URL punta a una sezione, ci si va
  useLayoutEffect(() => {
    if (!ready || !article.current) return
    setHeadings(collectHeadings(article.current))
  }, [ready, data.id])

  useEffect(() => {
    if (!ready || !hash) return
    let target: HTMLElement | null = null
    try {
      target = document.getElementById(decodeURIComponent(hash.slice(1)))
    } catch {
      // hash malformato: si resta dove si è
    }
    target?.scrollIntoView?.()
  }, [ready, hash])

  return (
    // Tre colonne (indice, nota, margine) solo da 1280 px di contenitore: sotto, il margine diventa un riquadro
    // apribile sopra la nota e i widget si prendono tutta la larghezza della colonna.
    <div className="grid gap-8 @5xl:grid-cols-[13rem_minmax(0,1fr)] @5xl:gap-10 @7xl:grid-cols-[13rem_minmax(0,1fr)_15rem]">
      {ready ? <Toc moduleId={data.id} headings={headings} /> : <div className="hidden @5xl:block" />}
      <div className="grid min-w-0 content-start gap-8">
      <details className="group border border-border-strong bg-surface @7xl:hidden">
        <summary className="label flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 [&::-webkit-details-marker]:hidden">
          Fonte e termini inglesi
          <span aria-hidden="true" className="num transition-transform duration-[var(--dur-fast)] group-open:rotate-45">+</span>
        </summary>
        <div className="border-t border-border px-4 pb-4">
          <SheetMargin data={data} terms inline />
        </div>
      </details>
      <article ref={article} className="prose min-w-0">
        {current.status === 'ready' && <current.Content components={mdxComponents} />}
        {current.status === 'loading' && (
          <p role="status" className="label">
            Apro la nota illustrativa…
          </p>
        )}
        {current.status === 'missing' && (
          <div className={`grid min-h-48 content-end border border-border p-5 ${HATCH}`}>
            <p className="m-0 justify-self-start bg-surface px-2">La nota illustrativa di questo foglio è in preparazione. Intanto trovi il riassunto, le formule e le pagine delle fonti nelle altre schede.</p>
          </div>
        )}
      </article>
      </div>
      <div className="hidden @7xl:block">
        <SheetMargin data={data} terms />
      </div>
    </div>
  )
}
