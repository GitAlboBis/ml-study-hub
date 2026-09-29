// Le formule vive di un preset (`formulas`), sotto la didascalia del passo: etichetta di cornice e LiveFormula, con
// la notazione del docente e i numeri esatti del calcolo. Solo la prima formula con segnaposto annuncia i suoi valori
// ai lettori di schermo (le altre announce={false}), come vuole WIDGET_GUIDE §6: più regioni che parlano insieme
// sarebbero rumore.
import { LiveFormula } from '../../kit/LiveFormula'
import { firstLiveFormula, formulaTexOf } from './presetTools'
import type { EngineFormula } from './types'

export interface FormulaListProps<Ctx> {
  formulas: readonly EngineFormula<Ctx>[]
  /** il contesto in cui risolvere le formule che sono funzioni (N, il kernel…) */
  ctx: Ctx
  /** i valori del motore (formulaValues): quelli che \val{nome} scrive */
  values: Readonly<Record<string, number | string | undefined>>
  /** false: nessuna formula annuncia (i valori li annuncia già un Readout) */
  announce?: boolean
}

export function FormulaList<Ctx>({ formulas, ctx, values, announce = true }: FormulaListProps<Ctx>) {
  const first = announce ? firstLiveFormula(formulas, ctx) : -1
  return (
    <div className="grid gap-4">
      {formulas.map((f, i) => (
        <div key={f.id} data-formula={f.id} className="grid min-w-0 gap-1">
          {f.label !== undefined ? <span className="label">{f.label}</span> : null}
          <LiveFormula tex={formulaTexOf(f, ctx)} values={values} announce={i === first} />
        </div>
      ))}
    </div>
  )
}
