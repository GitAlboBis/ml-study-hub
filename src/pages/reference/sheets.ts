// I fogli ancora in preparazione, per le pagine di consultazione (formulario, glossario): quali sono e come
// scriverli in poco spazio ("01–08, 10–22"). Solo funzioni pure sul manifest.
import { manifest } from '../../content/manifest'
import type { ModuleManifestEntry } from '../../content/manifest'
import type { CourseId } from '../../content/types'
import { sheetNumber } from '../../lib/atlas'

/** I fogli (di una regione, o di tutto l'atlante) che non sono tra quelli pronti. */
export const pendingSheets = (course: CourseId | null, ready: ReadonlySet<string>): ModuleManifestEntry[] =>
  manifest.filter((m) => (course === null || m.course === course) && !ready.has(m.id))

/** I numeri dei fogli come intervalli: "01–03, 05, 07–08". */
export function sheetRanges(ids: readonly string[]): string {
  const numbers = ids
    .map((id) => sheetNumber(id))
    .filter((n): n is string => n !== null)
    .map(Number)
    .sort((a, b) => a - b)
  const pad = (n: number) => String(n).padStart(2, '0')
  const parts: string[] = []
  let start = numbers[0]
  numbers.forEach((n, i) => {
    const next = numbers[i + 1]
    if (next === n + 1) return
    parts.push(start === n ? pad(n) : `${pad(start)}–${pad(n)}`)
    start = next
  })
  return parts.join(', ')
}
