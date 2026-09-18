// Registry dei widget: trova i file src/widgets/<moduleId>/<widgetId>.widget.tsx e li carica lazy per id,
// un chunk per widget. import.meta.glob è di Vite: questo file si usa nell'app e nei test (vitest), non negli script tsx.
import type { WidgetModule } from './types'

type WidgetLoader = () => Promise<WidgetModule>

export interface WidgetRegistry {
  /** Vero per ogni widget che si può caricare, anche se privato. */
  widgetExists(id: string): boolean
  /** Gli id dei widget dell'app, nell'ordine dei percorsi. I widget privati non ci sono mai. */
  widgetIds(): string[]
  /** Il modulo del widget (meta e componente), oppure null se l'id non ha un file. Rifiuta se il chunk non si carica. */
  loadWidget(id: string): Promise<WidgetModule | null>
}

// Un "_" davanti alla cartella o al nome del file segna un widget privato (una prova per i test, una bozza):
// si carica per id come gli altri, ma non è un widget dell'app e non entra negli elenchi, quindi nemmeno
// nei conteggi che li confrontano con l'inventario.
const isPrivate = (folder: string, id: string) => folder.startsWith('_') || id.startsWith('_')

/** Costruisce un registry dai loader di import.meta.glob, con chiavi "./<cartella>/<id>.widget.tsx". */
export function createWidgetRegistry(loaders: Record<string, WidgetLoader>): WidgetRegistry {
  const byId = new Map<string, { path: string; load: WidgetLoader }>()
  const publicIds: string[] = []
  for (const [path, load] of Object.entries(loaders)) {
    const parts = path.split('/')
    const id = (parts.at(-1) ?? '').replace('.widget.tsx', '')
    const other = byId.get(id)
    // <Widget id>, /lab/:widgetId e le sfide nei progressi usano il solo id: due file con lo stesso id si nasconderebbero a vicenda.
    if (other) throw new Error(`Due widget hanno lo stesso id "${id}": ${other.path} e ${path}`)
    byId.set(id, { path, load })
    if (!isPrivate(parts.at(-2) ?? '', id)) publicIds.push(id)
  }
  return {
    widgetExists: (id) => byId.has(id),
    widgetIds: () => [...publicIds],
    loadWidget: async (id) => (await byId.get(id)?.load()) ?? null,
  }
}

// Due glob, perché i widget privati non devono finire nel bundle: in produzione il secondo resta in un ramo morto,
// i suoi chunk non vengono emessi e per quegli id widgetExists è falso. I pattern negativi del primo sono
// gli stessi "_" di isPrivate; che i due glob insieme vedano ogni file lo controlla registry.test.ts.
const appLoaders = import.meta.glob<WidgetModule>(['./*/*.widget.tsx', '!./_*/*', '!./*/_*'])
const privateLoaders = import.meta.env.PROD ? {} : import.meta.glob<WidgetModule>(['./_*/*.widget.tsx', './*/_*.widget.tsx'])

export const { widgetExists, widgetIds, loadWidget } = createWidgetRegistry({ ...appLoaders, ...privateLoaders })
