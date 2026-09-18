// Loader lazy dei moduli: ogni data.ts e ogni index.mdx diventa un chunk separato del bundle.
// import.meta.glob è di Vite: questo file si usa nell'app e nei test (vitest), non negli script tsx.
import type { MDXContent } from 'mdx/types'
import { manifest } from './manifest'
import type { ModuleData } from './types'

const dataLoaders = import.meta.glob<{ default: ModuleData }>('./modules/*/data.ts')
const mdxLoaders = import.meta.glob<{ default: MDXContent }>('./modules/*/index.mdx')

async function load<T>(loaders: Record<string, () => Promise<{ default: T }>>, id: string, file: string): Promise<T> {
  const loader = loaders[`./modules/${id}/${file}`]
  if (!loader) throw new Error(`Modulo non trovato: src/content/modules/${id}/${file}`)
  return (await loader()).default
}

export const hasModule = (id: string) => `./modules/${id}/data.ts` in dataLoaders

export const loadModuleData = (id: string): Promise<ModuleData> => load(dataLoaders, id, 'data.ts')

export const loadModuleContent = (id: string): Promise<MDXContent> => load(mdxLoaders, id, 'index.mdx')

/** I moduli già scritti, nell'ordine del manifest. */
export const loadAllModuleData = (): Promise<ModuleData[]> =>
  Promise.all(manifest.filter((m) => hasModule(m.id)).map((m) => loadModuleData(m.id)))
