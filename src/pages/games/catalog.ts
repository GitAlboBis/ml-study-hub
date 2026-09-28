// Il catalogo dei sette giochi: percorso (/giochi/:game), nomi IT/EN, meccanica in una riga, regole, e
// quanto materiale c'è nel campo scelto. La disponibilità si calcola dai dati caricati, così un gioco si
// accende da solo quando arrivano i fogli che lo alimentano.
import type { ModuleData } from '../../content/types'
import { sortPlan } from './logic/conceptSort'
import { levelsOf } from './logic/exerciseGym'
import { MIN_BLANKS } from './logic/fillFormula'
import { matchable, MIN_PAIRS } from './logic/formulaMatch'
import { blanksOf, derivationsOf, exercisesOf, formulasOf, glossaryOf, tfOf } from './pool'
import type { GameScope } from './pool'
import { MIN_TF } from './logic/trueFalse'
import { MIN_TERMS } from './logic/whoAmI'

export const GAME_SLUGS = ['formula-match', 'completa-la-formula', 'riordina-la-dimostrazione', 'vero-falso', 'chi-sono', 'palestra', 'smista-i-concetti'] as const
export type GameSlug = (typeof GAME_SLUGS)[number]

export interface GameInfo {
  slug: GameSlug
  title: string
  en: string
  /** la meccanica in una riga, per l'elenco dei giochi */
  lead: string
  /** le regole, per la testata del gioco */
  rules: string[]
  /** da dove viene il materiale, in parole */
  from: string
}

export const GAMES: readonly GameInfo[] = [
  {
    slug: 'formula-match',
    title: 'Formula Match',
    en: 'Formula memory',
    lead: 'Memory: trova le coppie fra il nome di una formula e la sua scrittura.',
    rules: [
      'Gira due tessere: se il nome e la formula vanno insieme restano scoperte.',
      'Contano le mosse e il tempo: 100 punti a coppia, meno 20 per ogni mossa sprecata.',
      'Frecce per muoverti fra le tessere, Invio o Spazio per girarle.',
    ],
    from: 'le formule dei fogli',
  },
  {
    slug: 'completa-la-formula',
    title: 'Completa la formula',
    en: 'Fill in the formula',
    lead: 'Un pezzo della formula è coperto: scegli quello giusto fra i distrattori.',
    rules: [
      'Leggi il nome della formula e guarda che cosa manca.',
      'Una risposta giusta vale 100 punti, più 20 per ogni giusta di fila prima.',
      'Tasti 1-4 per scegliere, Invio per andare avanti.',
    ],
    from: 'le varianti "completa la formula" delle formule',
  },
  {
    slug: 'riordina-la-dimostrazione',
    title: 'Riordina la dimostrazione',
    en: 'Put the proof in order',
    lead: 'I passaggi di una dimostrazione sono mescolati: rimettili in fila, poi leggi i perché.',
    rules: [
      'Trascina un passaggio per la maniglia, oppure mettici il fuoco e usa le frecce su e giù.',
      'Controlla quando ti sembra giusto: vedi quali passaggi sono fuori posto.',
      '20 punti a passaggio; ogni controllo in più costa 10, ogni aiuto 15.',
    ],
    from: 'le dimostrazioni dei fogli',
  },
  {
    slug: 'vero-falso',
    title: 'Vero/Falso Sprint',
    en: 'True/false sprint',
    lead: 'Sessanta secondi di affermazioni: rispondi vero o falso e tieni viva la combo.',
    rules: [
      'Ogni risposta giusta vale 10 punti per il moltiplicatore: sale di uno ogni tre giuste di fila, fino a ×4.',
      'Una risposta sbagliata azzera la combo e finisce fra gli errori da ripassare.',
      'Tasti V o freccia sinistra per vero, F o freccia destra per falso.',
    ],
    from: 'le domande vero/falso dei quiz',
  },
  {
    slug: 'chi-sono',
    title: 'Chi sono?',
    en: 'Who am I?',
    lead: 'Una definizione del glossario: indovina il termine, in italiano o in inglese.',
    rules: [
      'Scrivi il termine in italiano o in inglese: accenti e maiuscole non contano.',
      'Ogni indizio in più abbassa il valore: 100, 70, 40, 20 punti.',
      'Un tentativo sbagliato apre il prossimo indizio.',
    ],
    from: 'il glossario IT/EN dei fogli',
  },
  {
    slug: 'palestra',
    title: 'Palestra esercizi',
    en: 'Exercise gym',
    lead: 'Esercizi con numeri sempre nuovi, a livelli: tre risolti di fila e sali.',
    rules: [
      'Risolvi l\'esercizio, controlla le risposte o apri la soluzione, poi segna com\'è andata.',
      'Tre risolti di fila fanno salire di livello, due non risolti di fila fanno scendere.',
      'Una serie è di dieci esercizi; la successiva riparte dal livello raggiunto.',
    ],
    from: 'gli esercizi generativi dei fogli',
  },
  {
    slug: 'smista-i-concetti',
    title: 'Smista i concetti',
    en: 'Sort the concepts',
    lead: 'Formule, termini e dimostrazioni da mettere nel docente o nel foglio giusto.',
    rules: [
      'Trascina la carta sul contenitore giusto, oppure premi il suo numero.',
      'Giusta al primo colpo vale 10 punti, al secondo 5.',
      'Con più regioni pronte si smista per docente, dentro una regione per foglio.',
    ],
    from: 'formule, glossario e dimostrazioni dei fogli',
  },
]

export const isGameSlug = (slug: string | undefined): slug is GameSlug => (GAME_SLUGS as readonly string[]).includes(slug ?? '')

export const gameInfo = (slug: GameSlug): GameInfo => GAMES.find((g) => g.slug === slug)!

export interface Availability {
  /** quanto materiale c'è nel campo */
  count: number
  /** l'unità di count, già accordata: "coppie", "formula" */
  unit: string
  playable: boolean
  /** perché non si può giocare, in una frase; null se si può */
  reason: string | null
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** `what` con l'articolo quando min è 1 ("una dimostrazione…"), senza numero altrimenti ("formule diverse"). */
function need(count: number, min: number, one: string, many: string, what: string): Availability {
  const unit = plural(count, one, many)
  if (count >= min) return { count, unit, playable: true, reason: null }
  const ask = min === 1 ? `Serve almeno ${what}` : `Servono almeno ${min} ${what}`
  const have = count === 0 ? 'non ce ne sono ancora' : `per ora ${count === 1 ? "ce n'è 1" : `ce ne sono ${count}`}`
  return { count, unit, playable: false, reason: `${ask}, e nei fogli pronti di questo campo ${have}.` }
}

/** Il materiale di un gioco nei fogli del campo (già filtrati con inScope). */
export function availability(slug: GameSlug, modules: readonly ModuleData[], scope: GameScope): Availability {
  switch (slug) {
    case 'formula-match':
      return need(matchable(formulasOf(modules)).length, MIN_PAIRS, 'formula', 'formule', 'formule diverse')
    case 'completa-la-formula':
      return need(blanksOf(modules).length, MIN_BLANKS, 'formula da completare', 'formule da completare', 'formule da completare')
    case 'riordina-la-dimostrazione':
      return need(derivationsOf(modules).length, 1, 'dimostrazione', 'dimostrazioni', 'una dimostrazione di tre passaggi o più')
    case 'vero-falso':
      return need(tfOf(modules).length, MIN_TF, 'affermazione', 'affermazioni', 'affermazioni vero/falso')
    case 'chi-sono':
      return need(glossaryOf(modules).length, MIN_TERMS, 'termine', 'termini', 'termini di glossario')
    case 'palestra': {
      const pool = exercisesOf(modules)
      const levels = levelsOf(pool).length
      const a = need(pool.length, 1, 'esercizio', 'esercizi', 'un esercizio')
      return a.playable ? { ...a, unit: `${a.unit} su ${levels} ${plural(levels, 'livello', 'livelli')}` } : a
    }
    case 'smista-i-concetti': {
      const plan = sortPlan(modules, scope)
      if (!plan.ok) return { count: 0, unit: 'contenitori', playable: false, reason: plan.reason }
      const count = plan.bins.length
      return { count, unit: plan.mode === 'docente' ? 'docenti' : 'fogli', playable: true, reason: null }
    }
  }
}
