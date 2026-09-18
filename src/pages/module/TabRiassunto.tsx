// Scheda Riassunto: il foglio in una pagina. Riassunto, legenda dei punti chiave (tasselli numerati, come la
// legenda di una carta), lessico italiano-inglese, fogli da leggere prima e fogli collegati; a margine fonte e
// domande d'orale. È la scheda che si apre quando l'URL non ne nomina una.
import { Link } from 'react-router'
import { ModLink } from '../../components/content/ModLink'
import { Rich } from '../../components/content/Rich'
import { BTN_PRIMARY, Icon } from '../../components/content/shared'
import { getModuleMeta } from '../../content/manifest'
import type { ModuleData } from '../../content/types'
import { SheetMargin } from './SheetMargin'
import { TAB_H2, TAB_H3, WITH_MARGIN } from './ui'

const titleOf = (id: string) => getModuleMeta(id)?.title ?? id

export default function TabRiassunto({ data }: { data: ModuleData }) {
  return (
    <div className={WITH_MARGIN}>
      <div className="grid min-w-0 max-w-[var(--measure)] content-start gap-12">
        <section>
          <h2 className={TAB_H2}>Riassunto</h2>
          <Rich text={data.summary} className="prose mt-4" />
        </section>

        {data.keyPoints.length > 0 && (
          <section>
            <h2 className={TAB_H2}>Legenda del foglio</h2>
            <p className="m-0 mt-2 text-muted">I punti chiave, nell'ordine in cui li incontri nella teoria.</p>
            <ol className="m-0 mt-4 list-none p-0">
              {data.keyPoints.map((point, i) => (
                <li key={i} className="m-0 grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-4 border-t border-border py-3">
                  <span aria-hidden="true" className="num grid size-8 place-items-center border border-border-strong bg-surface-2 text-[length:var(--step--1)]">
                    {i + 1}
                  </span>
                  <Rich text={point} className="pt-0.5" />
                </li>
              ))}
            </ol>
          </section>
        )}

        {data.glossary.length > 0 && (
          <section>
            <table className="w-full border-collapse text-[length:var(--step--1)]">
              <caption className={`${TAB_H2} mb-3 text-left`}>
                Lessico · <span lang="en">Vocabulary</span>
              </caption>
              <thead>
                <tr className="border-b border-border-strong">
                  <th scope="col" className="label py-2 pr-4 text-left">
                    Termine · <span lang="en">term</span>
                  </th>
                  <th scope="col" className="label py-2 text-left">
                    Definizione
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.glossary.map((g) => (
                  <tr key={g.en} className="border-b border-border align-top">
                    <th scope="row" className="w-[38%] py-2.5 pr-4 text-left font-normal">
                      <span className="block font-semibold">{g.term}</span>
                      <span lang="en" className="block text-muted italic">
                        {g.en}
                      </span>
                    </th>
                    <td className="py-2.5">
                      <Rich text={g.def} inline />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(data.prerequisites.length > 0 || data.connections.length > 0) && (
          <section>
            <h2 className={TAB_H2}>Collegamenti</h2>
            {data.prerequisites.length > 0 && (
              <>
                <h3 className={TAB_H3}>Da leggere prima</h3>
                <ul role="list" className="m-0 grid list-none gap-2 p-0">
                  {data.prerequisites.map((id) => (
                    <li key={id} className="m-0">
                      <ModLink to={id}>{titleOf(id)}</ModLink>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {data.connections.length > 0 && (
              <>
                <h3 className={TAB_H3}>Si collega a</h3>
                <ul role="list" className="m-0 grid list-none gap-3 p-0">
                  {data.connections.map((c) => (
                    <li key={c.to} className="m-0">
                      <ModLink to={c.to}>{titleOf(c.to.split('#')[0])}</ModLink>
                      <Rich text={c.why} className="mt-0.5 text-muted" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        <p className="m-0">
          <Link to={`/m/${data.id}/teoria`} className={`${BTN_PRIMARY} no-underline`}>
            Leggi la teoria
            <Icon name="arrow" size={18} />
          </Link>
        </p>
      </div>
      <SheetMargin data={data} />
    </div>
  )
}
