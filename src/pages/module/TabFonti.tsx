// Scheda Fonti: le pagine originali degli intervalli del foglio, in miniatura (vedi SourcePages).
import type { ModuleData } from '../../content/types'
import { SourcePages } from './SourcePages'

export default function TabFonti({ data }: { data: ModuleData }) {
  return <SourcePages sources={data.sources} />
}
