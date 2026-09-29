// Lo slider di un parametro del preset (ParamSpec): lineare, logaritmico a valori tondi o intero, con gli agganci
// della slide. Sotto c'è lo Slider del kit, che scorre sull'INDICE dell'elenco di paramValues: ogni tacca è un
// numero leggibile e la formula viva mostra esattamente il valore usato nel calcolo (come h in density1d).
//
// L'etichetta del preset è Rich ("Numero di campioni $N$"): la formula finale diventa il simbolo davanti
// all'etichetta, il resto le parole del nome accessibile; il termine inglese va fra parentesi, come
// "Larghezza della finestra (bandwidth)" in density1d.
//
// MOTO. Nessuno: il terreno segue subito la mano (WIDGET_GUIDE §4).
import { useId, useMemo } from 'react'
import { Slider } from '../../kit/Slider'
import { formatParam, nearestParamIndex, paramValues } from './params'
import { splitRichLabel } from './presetTools'
import type { ParamSpec } from './types'

export interface ParamSliderProps {
  spec: ParamSpec
  /** il valore corrente, uno di quelli dell'elenco (altrimenti lo slider mostra il più vicino) */
  value: number
  onChange: (value: number) => void
  /** id dell'input; predefinito uno generato */
  id?: string
  disabled?: boolean
}

export function ParamSlider({ spec, value, onChange, id, disabled = false }: ParamSliderProps) {
  const auto = useId()
  const values = useMemo(() => paramValues(spec), [spec])
  const index = nearestParamIndex(spec, values, value)
  const { text, tex } = splitRichLabel(spec.label)
  const label = spec.en !== undefined ? `${text} (${spec.en})` : text
  return (
    <Slider
      id={id ?? `${auto}-${spec.id}`}
      label={label}
      latex={tex}
      min={0}
      max={Math.max(0, values.length - 1)}
      step={1}
      value={index}
      disabled={disabled}
      unit={spec.unit}
      onChange={(i) => {
        const v = values[Math.round(i)]
        if (v !== undefined && v !== value) onChange(v)
      }}
      format={(i) => formatParam(spec, values[Math.round(i)] ?? value)}
    />
  )
}
