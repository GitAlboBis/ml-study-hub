// Contratto dei widget: ogni file src/widgets/<moduleId>/<widgetId>.widget.tsx esporta `meta` (WidgetMeta)
// e, come default, il componente. Il registry (registry.ts) li trova e li carica per id.
import type { ComponentType } from 'react'

/** Chiavi degli scenari reali del cast (docs/plan/cast.md), nello stesso ordine. */
export const SCENARIO_IDS = [
  'pesce',
  'telerilevamento',
  'medicina',
  'spam',
  'cifre',
  'sensori',
  'energia',
  'case',
  'banca',
  'incendio',
  'robot',
  'traduzione',
  'immagini',
  'fonte',
] as const
export type ScenarioId = (typeof SCENARIO_IDS)[number]

/** Ingombro del widget nel foglio: S sta in colonna con il testo, M prende la colonna larga, L tutta la larghezza. */
export const WIDGET_SIZES = ['S', 'M', 'L'] as const
export type WidgetSize = (typeof WIDGET_SIZES)[number]

export interface WidgetMeta {
  /** uguale al nome del file senza ".widget.tsx"; unico in tutta l'app, non solo nel modulo */
  id: string
  /** uguale al nome della cartella: l'id del modulo nel manifest */
  moduleId: string
  title: string
  /** id dei concetti dell'inventario coperti */
  concepts: string[]
  scenario: ScenarioId
  /** frase breve mostrata nel badge, es. "Salmone vs spigola: luminosità misurata sul nastro" */
  scenarioNote: string
  size: WidgetSize
}

/** Ciò che esporta un file *.widget.tsx. */
export interface WidgetModule {
  meta: WidgetMeta
  default: ComponentType
}
