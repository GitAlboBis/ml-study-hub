// Smista i concetti: una carta alla volta (il nome di una formula, un termine del glossario, il titolo di
// una dimostrazione) va messa nel contenitore giusto. Con più regioni pronte i contenitori sono i docenti,
// dentro una regione sono i fogli (al massimo quattro); con un solo foglio non c'è niente da smistare.
// Giusta al primo colpo vale 10, al secondo 5, dopo 0; lo sbaglio lascia la carta in mano.
import { getModuleMeta } from '../../../content/manifest'
import type { CourseId, ModuleData, Rng } from '../../../content/types'
import { REGION_ORDER, REGIONS, sheetNumber } from '../../../lib/atlas'
import { normalize } from '../pool'
import type { GameScope } from '../pool'

export const SORT_CARDS = 12
export const MAX_BINS = 4

export type SortMode = 'docente' | 'foglio'
export type CardKind = 'formula' | 'termine' | 'dimostrazione'

export interface SortBin {
  id: string
  /** nome breve: "Melgani", "Foglio 09" */
  label: string
  /** riga sotto: di che cosa parla la regione, o il titolo del foglio */
  detail: string
  /** la regione, per il campo di colore */
  course: CourseId
}

export interface SortCard {
  id: string
  text: string
  en: string | null
  kind: CardKind
  /** il contenitore giusto */
  bin: string
  /** il foglio da cui viene */
  moduleId: string
}

export type SortPlan = { ok: true; mode: SortMode; bins: SortBin[] } | { ok: false; reason: string }

/** Le carte di un foglio: nomi delle formule, termini del glossario, titoli delle dimostrazioni. */
function cardsOf(m: ModuleData, bin: string): SortCard[] {
  return [
    ...m.formulas.map((f): SortCard => ({ id: `${m.id}:f:${f.id}`, text: f.name, en: f.nameEn || null, kind: 'formula', bin, moduleId: m.id })),
    ...m.glossary.map((g, i): SortCard => ({ id: `${m.id}:g:${i}`, text: g.term, en: g.en || null, kind: 'termine', bin, moduleId: m.id })),
    ...m.derivations.map((d): SortCard => ({ id: `${m.id}:d:${d.id}`, text: d.title, en: null, kind: 'dimostrazione', bin, moduleId: m.id })),
  ]
}

const hasCards = (m: ModuleData) => m.formulas.length + m.glossary.length + m.derivations.length > 0

/** Quali contenitori si possono usare nel campo scelto, o perché non si può giocare. */
export function sortPlan(modules: readonly ModuleData[], scope: GameScope): SortPlan {
  if (scope.moduleId) {
    return { ok: false, reason: "Con un solo foglio non c'è niente da smistare: scegli una regione o tutto l'atlante." }
  }
  const ready = modules.filter(hasCards)
  const courses = REGION_ORDER.filter((c) => ready.some((m) => m.course === c))
  if (scope.course === 'tutti' && courses.length >= 2) {
    return { ok: true, mode: 'docente', bins: courses.map((c) => ({ id: c, label: REGIONS[c].name, detail: REGIONS[c].what, course: c })) }
  }
  if (ready.length >= 2) {
    return {
      ok: true,
      mode: 'foglio',
      bins: ready.map((m) => ({ id: m.id, label: `Foglio ${sheetNumber(m.id) ?? '??'}`, detail: getModuleMeta(m.id)?.title ?? m.title, course: m.course })),
    }
  }
  if (scope.course !== 'tutti') {
    const where = `Nella regione ${REGIONS[scope.course].name}`
    return {
      ok: false,
      reason: ready.length === 0 ? `${where} non c'è ancora nessun foglio pronto.` : `${where} c'è un solo foglio pronto: scegli tutto l'atlante, o torna quando ne arrivano altri.`,
    }
  }
  return { ok: false, reason: "Servono almeno due fogli pronti, e per ora ce n'è uno solo: torna quando ne arrivano altri." }
}

export interface SortPlacement {
  card: SortCard
  /** tentativi sbagliati prima di quello giusto */
  misses: number
  points: number
}

export interface SortState {
  mode: SortMode
  bins: SortBin[]
  cards: SortCard[]
  /** carta in mano */
  index: number
  placed: SortPlacement[]
  /** tentativi sbagliati sulla carta in mano */
  tries: number
  mistakes: number
  score: number
  /** ultimo tentativo, per l'esito annunciato */
  last: { cardId: string; bin: string; correct: boolean } | null
}

export function newSort(modules: readonly ModuleData[], scope: GameScope, rng: Rng, count = SORT_CARDS): SortState | null {
  const plan = sortPlan(modules, scope)
  if (!plan.ok) return null
  // nel modo "foglio" al massimo quattro fogli a caso, poi di nuovo nell'ordine dell'atlante
  const order = new Map(plan.bins.map((b, i) => [b.id, i]))
  const bins = plan.mode === 'foglio' ? rng.shuffle(plan.bins).slice(0, MAX_BINS).sort((a, b) => order.get(a.id)! - order.get(b.id)!) : plan.bins
  const byBin = new Map(bins.map((b) => [b.id, [] as SortCard[]]))
  for (const m of modules) {
    const bin = plan.mode === 'docente' ? m.course : m.id
    byBin.get(bin)?.push(...cardsOf(m, bin))
  }
  // un testo che sta in due contenitori (lo stesso termine in due fogli) non si può smistare: via
  const binsOfText = new Map<string, Set<string>>()
  for (const [bin, cards] of byBin) for (const c of cards) binsOfText.set(normalize(c.text), (binsOfText.get(normalize(c.text)) ?? new Set()).add(bin))
  const per = Math.ceil(count / bins.length)
  const hand: SortCard[] = []
  for (const [, cards] of byBin) {
    const seen = new Set<string>()
    const unique = cards.filter((c) => {
      const k = normalize(c.text)
      if (k === '' || seen.has(k) || (binsOfText.get(k)?.size ?? 0) > 1) return false
      seen.add(k)
      return true
    })
    hand.push(...rng.shuffle(unique).slice(0, per))
  }
  const cards = rng.shuffle(hand).slice(0, count)
  return { mode: plan.mode, bins, cards, index: 0, placed: [], tries: 0, mistakes: 0, score: 0, last: null }
}

export const currentCard = (s: SortState): SortCard | undefined => s.cards[s.index]

/** Punti di una carta messa a posto dopo `misses` tentativi sbagliati. */
export const sortPoints = (misses: number) => (misses === 0 ? 10 : misses === 1 ? 5 : 0)

/** Mette la carta in mano nel contenitore `bin`. */
export function place(s: SortState, bin: string): SortState {
  const card = currentCard(s)
  if (!card || !s.bins.some((b) => b.id === bin)) return s
  if (card.bin !== bin) return { ...s, tries: s.tries + 1, mistakes: s.mistakes + 1, last: { cardId: card.id, bin, correct: false } }
  const points = sortPoints(s.tries)
  return {
    ...s,
    index: s.index + 1,
    placed: [...s.placed, { card, misses: s.tries, points }],
    tries: 0,
    score: s.score + points,
    last: { cardId: card.id, bin, correct: true },
  }
}

export const sortOver = (s: SortState) => s.index >= s.cards.length
