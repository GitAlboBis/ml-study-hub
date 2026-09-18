// Widget di riferimento del foglio m09 (Task 4.7, punto 3): la stima di Parzen come somma di kernel.
// È un'istanza del motore density1d: tutto ciò che è proprio di questo widget (salmoni, verità, storyboard,
// formule, sfida, terminologia) sta nel preset accanto, m09-somma-dei-kernel.preset.ts.
import { DensityExplorer } from '../engines/density1d'
import type { WidgetMeta } from '../types'
import { preset } from './m09-somma-dei-kernel.preset'

export const meta: WidgetMeta = {
  id: 'm09-somma-dei-kernel',
  moduleId: 'm09-parzen-windows',
  title: 'La somma dei kernel in tempo reale',
  concepts: ['c15', 'c17', 'c18', 'c26'],
  scenario: 'pesce',
  scenarioNote: "Luminosità di 12 salmoni misurata dalla telecamera dell'impianto di confezionamento",
  size: 'L',
}

export default function M09SommaDeiKernel() {
  return <DensityExplorer meta={meta} preset={preset} />
}
