// Manifest dei 50 moduli: l'unica fonte è docs/plan/modules.json (lo leggono anche gli script dei gate).
// L'import JSON diretto funziona con tsc (moduleResolution "bundler"), Vite, vitest e tsx.
import modules from '../../docs/plan/modules.json'
import type { CourseId, SourceRange } from './types'

/** Metadati di un modulo noti prima che esista il suo data.ts. L'ordine dell'array è l'ordine di studio. */
export interface ModuleManifestEntry {
  id: string
  course: CourseId
  chapter: string
  title: string
  titleEn: string
  sources: SourceRange[]
}

// Dal JSON TypeScript ricava `course: string` e `pages: number[]`: il cast li restringe al contratto,
// e registry.test.ts verifica sui dati veri che il contratto sia rispettato.
export const manifest = modules as ModuleManifestEntry[]

const byId = new Map(manifest.map((m) => [m.id, m]))

export const getModuleMeta = (id: string): ModuleManifestEntry | undefined => byId.get(id)

export const modulesByCourse = (course: CourseId): ModuleManifestEntry[] => manifest.filter((m) => m.course === course)
