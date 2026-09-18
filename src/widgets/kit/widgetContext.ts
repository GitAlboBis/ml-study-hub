// Il WidgetFrame mette a disposizione di ciò che contiene i dati del widget (meta). Serve a Challenge,
// che registra il completamento con l'id del widget senza che ogni autore debba ripassarglielo.
// Sta in un file a parte perché i file dei componenti esportano solo componenti.
import { createContext, useContext } from 'react'
import type { RefObject } from 'react'
import type { WidgetMeta } from '../types'

export const WidgetMetaContext = createContext<WidgetMeta | null>(null)

/** `meta` del widget in cui ci si trova; null fuori da un WidgetFrame. */
export const useWidgetMeta = (): WidgetMeta | null => useContext(WidgetMetaContext)

/**
 * L'elemento che contiene il widget: il riquadro di <Widget> nel foglio (che avvolge il componente del widget, e
 * quindi anche gli hook chiamati nel suo corpo) e, più vicino, la sezione del WidgetFrame. useAnimationFrame lo
 * guarda con un IntersectionObserver: fuori dalla vista, o in un pannello chiuso, le animazioni si fermano.
 */
export const WidgetElementContext = createContext<RefObject<Element | null> | null>(null)
