// Widget di prova: esiste solo per src/widgets/registry.test.ts, che ha bisogno di un file vero da far trovare
// a import.meta.glob. La cartella comincia con "_": il registry lo carica per id ma non lo elenca tra i widget.
import type { WidgetMeta } from '../types'

// oxlint-disable-next-line react/only-export-components -- `meta` è parte del contratto dei file *.widget.tsx (src/widgets/types.ts)
export const meta: WidgetMeta = {
  id: 'prova',
  moduleId: '_test',
  title: 'Widget di prova',
  concepts: [],
  scenario: 'fonte',
  scenarioNote: 'Nessuno scenario: serve ai test del registry',
  size: 'S',
}

export default function Prova() {
  return (
    <figure className="m-0 border border-border-strong bg-surface p-4">
      <figcaption className="label">{meta.title}</figcaption>
      <p className="num m-0 mt-2 text-muted">{meta.id}</p>
    </figure>
  )
}
