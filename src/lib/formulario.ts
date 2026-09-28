// Il formulario dell'atlante: le formule di tutti i fogli pronti, con il foglio da cui vengono. Funzioni pure per
// la pagina /formulario: raccolta nell'ordine del manifest, ricerca per nome (italiano e inglese) e per simbolo,
// filtri per regione, foglio e importanza con i conteggi di ciascun filtro, raggruppamento per regione e foglio.
import { manifest } from '../content/manifest'
import type { CourseId, Formula, ModuleData } from '../content/types'
import { REGION_ORDER, sheetNumber } from './atlas'
import { foldText } from './glossary'

export type Importance = Formula['importance']
export const IMPORTANCE_LEVELS: readonly Importance[] = [3, 2, 1]

export interface FormulaEntry {
  /** `<moduleId>:<formulaId>`: unico in tutto l'atlante */
  key: string
  formula: Formula
  moduleId: string
  course: CourseId
  /** numero del foglio, "09" */
  number: string
  title: string
  titleEn: string
}

const manifestIndex = new Map(manifest.map((m, i) => [m.id, i]))
const orderOf = (id: string) => manifestIndex.get(id) ?? Number.MAX_SAFE_INTEGER

export function collectFormulas(modules: readonly ModuleData[]): FormulaEntry[] {
  return [...modules]
    .sort((a, b) => orderOf(a.id) - orderOf(b.id))
    .flatMap((data) =>
      data.formulas.map((formula) => ({
        key: `${data.id}:${formula.id}`,
        formula,
        moduleId: data.id,
        course: data.course,
        number: sheetNumber(data.id) ?? '··',
        title: data.title,
        titleEn: data.titleEn,
      })),
    )
}

/** Id DOM di una formula nel formulario: lo stesso id di formula può esistere in due fogli. */
export const formulaAnchor = (moduleId: string, formulaId: string) => `formula:${moduleId}:${formulaId}`

// ---------------------------------------------------------------------------------------------
// Ricerca
// ---------------------------------------------------------------------------------------------

// lettere greche (e qualche operatore) scritte come caratteri: diventano il nome del comando LaTeX
const UNICODE_TEX: Record<string, string> = {
  α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'epsilon', ϵ: 'epsilon', ζ: 'zeta', η: 'eta', θ: 'theta', ϑ: 'theta',
  ι: 'iota', κ: 'kappa', λ: 'lambda', μ: 'mu', ν: 'nu', ξ: 'xi', π: 'pi', ϖ: 'pi', ρ: 'rho', ϱ: 'rho', σ: 'sigma', ς: 'sigma',
  τ: 'tau', υ: 'upsilon', φ: 'phi', ϕ: 'phi', χ: 'chi', ψ: 'psi', ω: 'omega',
  '∑': 'sum', '∏': 'prod', '∫': 'int', '∞': 'infty', '√': 'sqrt', '∂': 'partial', '∇': 'nabla', '≈': 'approx', '≠': 'neq', '≤': 'leq', '≥': 'geq',
}

// varianti che chi cerca non distingue
const CANONICAL: Record<string, string> = { varepsilon: 'epsilon', varphi: 'phi', vartheta: 'theta', varsigma: 'sigma', varrho: 'rho', varpi: 'pi', le: 'leq', ge: 'geq', ne: 'neq' }

// comandi di impaginazione: non sono simboli e non devono rispondere alla ricerca
const LAYOUT = new Set([
  'mathbf', 'mathrm', 'mathit', 'mathsf', 'mathtt', 'mathcal', 'mathbb', 'boldsymbol', 'bm', 'text', 'textrm', 'textit', 'textbf', 'operatorname',
  'left', 'right', 'big', 'bigl', 'bigr', 'bigg', 'biggl', 'biggr', 'frac', 'dfrac', 'tfrac', 'displaystyle', 'limits', 'quad', 'qquad', 'boxed', 'begin', 'end',
])

const command = (name: string) => {
  const lower = name.toLowerCase()
  return CANONICAL[lower] ?? lower
}

const withUnicodeNames = (text: string) => text.replace(/./gu, (ch) => (UNICODE_TEX[ch.toLowerCase()] ? ` ${UNICODE_TEX[ch.toLowerCase()]} ` : ch))

/** Parole della ricerca: lettere greche e comandi LaTeX diventano il loro nome, tutto il resto si piega. */
export function searchTokens(query: string): string[] {
  const text = withUnicodeNames(query).replace(/\\([a-zA-Z]+)/g, (_, name: string) => ` ${command(name)} `)
  return foldText(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

interface SearchIndex {
  /** nome italiano e inglese piegati */
  text: string
  /** parole dei nomi, per le ricerche di una lettera sola ("k" in "K-NN") */
  textWords: Set<string>
  /** comandi LaTeX (sigma, hat, sum…) e parole dentro \text{…} */
  words: Set<string>
  /** i simboli di una lettera o cifra della formula e della legenda */
  letters: Set<string>
}

const TEXT_IN_TEX = /\\(?:text|textrm|textit|textbf|mathrm|operatorname)\s*\{([^{}]*)\}/g

function indexTex(latex: string, into: Pick<SearchIndex, 'words' | 'letters'>) {
  let rest = latex.replace(TEXT_IN_TEX, (_, inner: string) => {
    for (const w of foldText(inner).split(/[^a-z0-9]+/)) if (w) (w.length === 1 ? into.letters : into.words).add(w)
    return ' '
  })
  rest = rest.replace(/\\([a-zA-Z]+)/g, (_, name: string) => {
    const c = command(name)
    if (!LAYOUT.has(c)) into.words.add(c)
    return ' '
  })
  // fuori dai comandi, in matematica ogni lettera è un simbolo: "xy" è x per y
  for (const ch of withUnicodeNames(rest).toLowerCase()) if (/[a-z0-9]/.test(ch)) into.letters.add(ch)
  for (const run of rest.matchAll(/[0-9]+/g)) into.words.add(run[0])
}

const indexCache = new WeakMap<Formula, SearchIndex>()

function indexOf(formula: Formula): SearchIndex {
  const cached = indexCache.get(formula)
  if (cached) return cached
  const text = foldText(`${formula.name} ${formula.nameEn}`)
  const index: SearchIndex = { text, textWords: new Set(text.split(/[^a-z0-9]+/).filter(Boolean)), words: new Set(), letters: new Set() }
  indexTex(formula.latex, index)
  for (const sym of formula.symbols) indexTex(sym.s, index)
  indexCache.set(formula, index)
  return index
}

function tokenMatches(token: string, index: SearchIndex): boolean {
  // una lettera sola cerca un simbolo, non un pezzo di parola
  if (token.length === 1) return index.letters.has(token) || index.textWords.has(token)
  if (index.text.includes(token)) return true
  if (index.words.has(token)) return true
  if (token.length >= 3) for (const w of index.words) if (w.startsWith(token)) return true
  return false
}

const matches = (entry: FormulaEntry, tokens: readonly string[]) => tokens.every((t) => tokenMatches(t, indexOf(entry.formula)))

// ---------------------------------------------------------------------------------------------
// Filtri e conteggi
// ---------------------------------------------------------------------------------------------

export interface FormulaFilters {
  query: string
  course: CourseId | null
  moduleId: string | null
  importance: Importance | null
}

export const NO_FILTERS: FormulaFilters = { query: '', course: null, moduleId: null, importance: null }

export function filterFormulas(entries: readonly FormulaEntry[], filters: FormulaFilters): FormulaEntry[] {
  const tokens = searchTokens(filters.query)
  return entries.filter(
    (e) =>
      (!filters.course || e.course === filters.course) &&
      (!filters.moduleId || e.moduleId === filters.moduleId) &&
      (!filters.importance || e.formula.importance === filters.importance) &&
      matches(e, tokens),
  )
}

export interface FormulaFacets {
  /** tutte le formule, senza filtri */
  total: number
  course: Record<CourseId, number>
  importance: Record<Importance, number>
  modules: Record<string, number>
}

/** Quante formule darebbe ogni scelta di un filtro, con gli altri filtri come sono. */
export function formulaFacets(entries: readonly FormulaEntry[], filters: FormulaFilters): FormulaFacets {
  const tokens = searchTokens(filters.query)
  const facets: FormulaFacets = { total: entries.length, course: { melgani: 0, passerini: 0, ricci: 0 }, importance: { 1: 0, 2: 0, 3: 0 }, modules: {} }
  for (const e of entries) {
    if (!matches(e, tokens)) continue
    const course = !filters.course || e.course === filters.course
    const sheet = !filters.moduleId || e.moduleId === filters.moduleId
    const importance = !filters.importance || e.formula.importance === filters.importance
    if (sheet && importance) facets.course[e.course]++
    if (course && sheet) facets.importance[e.formula.importance]++
    if (course && importance) facets.modules[e.moduleId] = (facets.modules[e.moduleId] ?? 0) + 1
  }
  return facets
}

// ---------------------------------------------------------------------------------------------
// Raggruppamento
// ---------------------------------------------------------------------------------------------

export interface SheetGroup {
  moduleId: string
  number: string
  title: string
  titleEn: string
  entries: FormulaEntry[]
}

export interface RegionGroup {
  course: CourseId
  sheets: SheetGroup[]
  count: number
}

/** Regioni nell'ordine dell'atlante, fogli e formule nell'ordine in cui arrivano (quello del manifest). */
export function groupFormulas(entries: readonly FormulaEntry[]): RegionGroup[] {
  return REGION_ORDER.flatMap((course) => {
    const sheets: SheetGroup[] = []
    for (const e of entries) {
      if (e.course !== course) continue
      const last = sheets.at(-1)
      if (last && last.moduleId === e.moduleId) last.entries.push(e)
      else sheets.push({ moduleId: e.moduleId, number: e.number, title: e.title, titleEn: e.titleEn, entries: [e] })
    }
    return sheets.length > 0 ? [{ course, sheets, count: sheets.reduce((n, s) => n + s.entries.length, 0) }] : []
  })
}
