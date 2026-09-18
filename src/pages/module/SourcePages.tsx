// Le pagine delle fonti di un foglio: una miniatura per ogni pagina degli intervalli (public/sources/<doc>/pNNN.webp),
// che apre il viewer /fonti/:doc/:page. La usano la scheda Fonti e il foglio che non ha ancora contenuti:
// le fonti ci sono sempre, nel manifest.
import { Link } from 'react-router'
import type { SourceRange } from '../../content/types'
import { DOCS, formatRange, pageLabel, pagesOf, sourcePageUrl } from '../../lib/atlas'
import { TAB_H2 } from './ui'

export function SourcePages({ sources }: { sources: SourceRange[] }) {
  return (
    <div className="grid gap-12">
      {sources.map((range) => (
        <section key={`${range.doc}-${range.pages[0]}`}>
          <h2 className={TAB_H2}>{DOCS[range.doc].long}</h2>
          <p className="num m-0 mt-1 text-[length:var(--step--1)] text-muted">{formatRange(range)}</p>
          <ol className="m-0 mt-4 grid list-none grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3 p-0">
            {pagesOf(range).map((page) => (
              <li key={page} className="m-0">
                <Link
                  to={`/fonti/${range.doc}/${page}`}
                  className="group block border border-border bg-surface text-text no-underline transition-[border-color] duration-[var(--dur-fast)] ease-out hover:border-border-strong"
                >
                  <span className="block bg-surface-2">
                    <img src={sourcePageUrl(range.doc, page)} alt="" loading="lazy" decoding="async" className="mx-auto h-36 w-full object-contain" />
                  </span>
                  <span className="flex items-center justify-between gap-2 border-t border-border px-2 py-1.5 group-hover:border-border-strong">
                    <span className="num text-[length:var(--step--1)]">
                      <span className="visually-hidden">{DOCS[range.doc].short},</span> {pageLabel(range.doc, page)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
