// L'apparato a margine del foglio: fonte, termini inglesi e segnale "da orale", come nel contratto del mondo.
// Nella scheda Teoria sta nella colonna destra da 1280 px di contenitore e resta visibile mentre il foglio
// scorre; sotto quella larghezza (`inline`) è un riquadro apribile sopra il testo, così i widget hanno spazio.
import { Link } from 'react-router'
import { Icon } from '../../components/content/shared'
import { Rich } from '../../components/content/Rich'
import type { ModuleData } from '../../content/types'
import { formatRange } from '../../lib/atlas'

const HEAD = 'label m-0 mb-2'
const MAX_ORAL = 4

export function SheetMargin({ data, terms = false, inline = false }: { data: ModuleData; terms?: boolean; inline?: boolean }) {
  const oral = data.exam.slice(0, MAX_ORAL)
  return (
    <aside aria-label="Apparato a margine" className={`grid min-w-0 content-start gap-6 self-start text-[length:var(--step--1)] ${inline ? '' : '@5xl:sticky @5xl:top-20'}`}>
      <section className="border-t border-border-strong pt-2">
        <h2 className={HEAD}>Fonte</h2>
        <ul role="list" className="m-0 grid list-none gap-1 p-0">
          {data.sources.map((r) => (
            <li key={`${r.doc}-${r.pages[0]}`} className="m-0">
              <Link to={`/fonti/${r.doc}/${r.pages[0]}`} className="num">
                {formatRange(r)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {terms && data.glossary.length > 0 && (
        <section className="border-t border-border-strong pt-2">
          <h2 className={HEAD}>
            Termini inglesi · <span lang="en">English terms</span>
          </h2>
          <dl className="m-0 grid gap-2">
            {data.glossary.map((g) => (
              <div key={g.en}>
                <dt lang="en" className="italic">
                  {g.en}
                </dt>
                <dd className="m-0 text-muted">{g.term}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {data.exam.length > 0 && (
        <section className="border border-border-strong bg-surface">
          <h2 className="label m-0 flex items-center gap-2 bg-pin px-3 py-2 text-pin-contrast">
            <Icon name="pin" size={16} />
            Da orale
          </h2>
          <ul role="list" className="m-0 grid list-none gap-3 p-3">
            {oral.map((e) => (
              <li key={e.id} className="m-0">
                <Rich text={e.q} inline />
                <span lang="en" className="mt-0.5 block text-muted italic">
                  {e.qEn}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 border-t border-border px-3 py-2">
            <Link to={`/m/${data.id}/orale`}>
              Allenati sull'orale
              <span className="num text-muted"> · {data.exam.length} {data.exam.length === 1 ? 'domanda' : 'domande'}</span>
            </Link>
          </p>
        </section>
      )}
    </aside>
  )
}
