// L'indice della copertura (src/content/coverage-index.json, generato da scripts/build-coverage-index.ts) e i titoli
// veri delle sezioni della teoria (src/content/search-sections.json, generato da scripts/build-search-index.ts per
// la ricerca). Si importano come testo e si leggono con JSON.parse: è più veloce da analizzare di un letterale JS e
// TypeScript non deve dedurre il tipo di centinaia di KB di JSON. Sta in un file a sé perché i test lo sostituiscano.
// L'indice delle sezioni è facoltativo: un glob che non trova il file dà {} e i nomi si ricavano dagli slug.
import raw from '../content/coverage-index.json?raw'
import type { CoverageIndex, SectionTitles } from './coverage'

export const coverageIndex = JSON.parse(raw) as CoverageIndex

const sectionFiles = import.meta.glob<string>('../content/search-sections.json', { query: '?raw', import: 'default', eager: true })

function readTitles(): Map<string, string> {
  const titles = new Map<string, string>()
  try {
    const text = Object.values(sectionFiles)[0]
    const parsed = text ? (JSON.parse(text) as { modules?: Record<string, { slug?: unknown; title?: unknown }[]> }) : {}
    for (const [id, sections] of Object.entries(parsed.modules ?? {})) {
      if (!Array.isArray(sections)) continue
      for (const s of sections) if (typeof s.slug === 'string' && typeof s.title === 'string') titles.set(`${id}#${s.slug}`, s.title)
    }
  } catch {
    // indice illeggibile: restano i nomi ricavati dagli slug
  }
  return titles
}

const titles = readTitles()
const sheetsWithSections = new Set([...titles.keys()].map((k) => k.slice(0, k.indexOf('#'))))

/**
 * Titolo vero della sezione `slug` del foglio `moduleId`, in Markdown con matematica. `known`: l'indice ha le sezioni
 * di quel foglio, quindi uno slug che manca è una destinazione rotta (come in scripts/coverage-report.ts).
 */
export const sectionTitle: SectionTitles = Object.assign((moduleId: string, slug: string) => titles.get(`${moduleId}#${slug}`), {
  known: (moduleId: string) => sheetsWithSections.has(moduleId),
})
