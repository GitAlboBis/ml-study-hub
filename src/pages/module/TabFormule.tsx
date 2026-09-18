// Scheda Formule: tutte le formule del foglio nella loro targa (FormulaCard), poi le dimostrazioni. Filtro per
// le formule da sapere a memoria e modalità ripasso, che copre tutte le formule insieme: all'orale si parte dal
// nome e dall'uso, e la formula va scritta.
import { useState } from 'react'
import { DerivationCard } from '../../components/content/Derivation'
import { FormulaCard } from '../../components/content/Formula'
import { targetId } from '../../components/content/ModuleContext'
import { BTN_TOGGLE, Icon } from '../../components/content/shared'
import type { ModuleData } from '../../content/types'
import { TAB_H2 } from './ui'

type Filter = 'tutte' | 'memoria'

export default function TabFormule({ data }: { data: ModuleData }) {
  const [filter, setFilter] = useState<Filter>('tutte')
  const [covered, setCovered] = useState(false)
  const byHeart = data.formulas.filter((f) => f.importance === 3)
  const shown = filter === 'memoria' ? byHeart : data.formulas
  const total = data.formulas.length

  if (total === 0 && data.derivations.length === 0) {
    return <p className="m-0 max-w-[var(--measure)] text-muted">Questo foglio non ha formule da mettere in targa.</p>
  }

  return (
    <div className="max-w-[64rem]">
      {total > 0 && (
        <section aria-labelledby="formule-del-foglio">
          <h2 id="formule-del-foglio" className="visually-hidden">
            Formule del foglio
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Quali formule" className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={filter === 'tutte'} onClick={() => setFilter('tutte')} className={BTN_TOGGLE}>
                Tutte <span className="num">{total}</span>
              </button>
              <button type="button" aria-pressed={filter === 'memoria'} onClick={() => setFilter('memoria')} className={BTN_TOGGLE}>
                <Icon name="pin" size={16} />
                Da sapere a memoria <span className="num">{byHeart.length}</span>
              </button>
            </div>
            <button type="button" aria-pressed={covered} onClick={() => setCovered(!covered)} className={`${BTN_TOGGLE} sm:ml-auto`}>
              <Icon name={covered ? 'eye-off' : 'eye'} size={18} />
              Copri tutte per il ripasso
            </button>
          </div>
          <p role="status" className="num m-0 mt-3 text-[length:var(--step--1)] text-muted">
            {shown.length} {shown.length === 1 ? 'formula' : 'formule'} su {total}
          </p>
          {shown.length === 0 && <p className="m-0 mt-4 text-muted">Nessuna formula di questo foglio è segnata da sapere a memoria.</p>}
          {/* la chiave rimonta le targhe quando cambia la modalità ripasso: startHidden vale solo alla nascita */}
          {shown.map((f) => (
            <FormulaCard key={`${f.id}-${covered ? 'coperta' : 'scoperta'}`} formula={f} moduleId={data.id} anchor={targetId('formula', f.id)} startHidden={covered} />
          ))}
        </section>
      )}

      {data.derivations.length > 0 && (
        <section className="mt-12">
          <h2 className={TAB_H2}>Dimostrazioni</h2>
          {data.derivations.map((d) => (
            <DerivationCard key={d.id} derivation={d} anchor={targetId('derivation', d.id)} />
          ))}
        </section>
      )}
    </div>
  )
}
