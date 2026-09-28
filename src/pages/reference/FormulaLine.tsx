// Una riga del prontuario (il formulario globale): nome italiano e inglese, importanza, la formula, la fonte e il
// rimando alla stessa formula nella scheda Formule del foglio. Spiegazione, legenda dei simboli, "quando si usa" e
// trappole stanno sotto "Spiegazione e simboli" e si montano solo quando si aprono: con cinquanta fogli il
// formulario resta un prontuario da scorrere, non una pila di targhe intere (che restano nella scheda del foglio).
// In stampa esce il prontuario: nome, formula e fonte.
import { useId } from 'react'
import { Link } from 'react-router'
import { SymbolLegend, UsageNotes } from '../../components/content/Formula'
import { M } from '../../components/content/M'
import { targetId } from '../../components/content/ModuleContext'
import { Rich } from '../../components/content/Rich'
import { BTN_TOGGLE, Disclosure, FLOW, Icon } from '../../components/content/shared'
import { SourceRef } from '../../components/content/SourceRef'
import { formulaAnchor } from '../../lib/formulario'
import type { FormulaEntry } from '../../lib/formulario'
import { useProgress } from '../../store/progress'
import { ImportanceMark } from './parts'
import { IMPORTANCE_INFO, SHEET_LINK } from './ui'

export function FormulaLine({ entry }: { entry: FormulaEntry }) {
  const { formula, moduleId } = entry
  const titleId = useId()
  const bookmark = `formula:${moduleId}:${formula.id}`
  const pinned = useProgress((s) => s.bookmarks.includes(bookmark))
  const toggleBookmark = useProgress((s) => s.toggleBookmark)
  const details = formula.explain.trim() !== '' || formula.symbols.length > 0 || Boolean(formula.whenToUse) || Boolean(formula.pitfalls)
  const importance = IMPORTANCE_INFO[formula.importance]

  return (
    <article id={formulaAnchor(moduleId, formula.id)} aria-labelledby={titleId} className="@container scroll-mt-6 border border-border-strong bg-surface">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 px-4 pt-3">
        <div className="min-w-0">
          <h4 id={titleId} className="m-0 font-label text-[length:var(--step-1)] leading-snug font-bold">
            {formula.name}
          </h4>
          <p lang="en" className="m-0 text-[length:var(--step--1)] text-muted italic">
            {formula.nameEn}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span title={importance.long} className={`label flex min-h-8 items-center gap-1.5 px-2 ${formula.importance === 3 ? 'bg-pin text-pin-contrast' : 'text-muted'}`}>
            <ImportanceMark value={formula.importance} />
            {importance.short}
            <span className="visually-hidden">: {importance.long}</span>
          </span>
          <button
            type="button"
            aria-pressed={pinned}
            aria-label="Appunta sull'indice"
            title={pinned ? "Togli dall'indice" : "Appunta sull'indice"}
            onClick={() => toggleBookmark(bookmark)}
            className={`${BTN_TOGGLE} min-w-11 px-0 print:hidden`}
          >
            <Icon name="pin" size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto px-4 text-[length:var(--step-1)]">
        <M tex={formula.latex} display />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-2">
        {formula.source.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">Fonte</span>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {formula.source.map((s) => (
                <li key={`${s.doc}-${s.page}`} className="m-0">
                  <SourceRef doc={s.doc} page={s.page} />
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link to={`/m/${moduleId}/formule#${targetId('formula', formula.id)}`} className={`${SHEET_LINK} ml-auto print:hidden`}>
          Nel foglio {entry.number}
          <span className="visually-hidden">: {formula.name}</span>
          <Icon name="arrow" size={16} />
        </Link>
      </div>

      {details && (
        <Disclosure className="border-t border-border print:hidden" summary={<span className="label text-text">Spiegazione e simboli</span>} panelClassName="border-t border-border">
          <div className="grid gap-4 p-4">
            {formula.explain.trim() !== '' && <Rich text={formula.explain} className={`${FLOW} max-w-[var(--measure)]`} />}
            {formula.symbols.length > 0 && (
              <div>
                <SymbolLegend symbols={formula.symbols} />
              </div>
            )}
          </div>
          <UsageNotes formula={formula} className="border-t border-border" />
        </Disclosure>
      )}
    </article>
  )
}
