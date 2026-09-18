// Contratto condiviso dai generatori dei dataset del cast (docs/plan/cast.md).
// Ogni dataset è sintetico, esce da un RNG a seed (createRng) e dichiara qui feature, unità e classi,
// così i widget scrivono assi, legende e il badge "dati sintetici" senza stringhe sparse nel codice.
import type { Rng } from '../../content/types'

/** Chiavi degli scenari del cast: le stesse di docs/plan/cast.md e di ScenarioId in src/widgets/types.ts */
export type DatasetScenario =
  | 'pesce' | 'telerilevamento' | 'medicina' | 'spam' | 'cifre' | 'sensori' | 'energia'
  | 'case' | 'banca' | 'incendio' | 'robot' | 'traduzione' | 'immagini' | 'fonte'

/** Nome da mostrare, in italiano e in inglese (ogni termine tecnico compare in entrambe le lingue) */
export interface BilingualLabel { it: string; en: string }

/**
 * Metadati di un dataset. F sono le chiavi delle feature (senza accenti, usate nel codice),
 * C i nomi delle classi, nell'ordine dell'indice y: classNames[y] è l'etichetta del campione.
 */
export interface DatasetMeta<F extends string = string, C extends string = string> {
  scenario: DatasetScenario
  /**
   * chiavi di tutte le feature che il generatore sa produrre, nell'ordine di default.
   * Le colonne di x sono quelle scelte con le opzioni del generatore (fish: `features`, sensors: `quantity`)
   */
  featureNames: readonly F[]
  /** nome leggibile di ogni feature (con accenti) e termine inglese */
  featureLabels: Readonly<Record<F, BilingualLabel>>
  /** unità di misura di ogni feature, pronta per l'etichetta dell'asse: "cm", "°C", "scala 0-10" */
  units: Readonly<Record<F, string>>
  /** intervallo utile per gli assi: contiene in pratica tutti i campioni delle classi normali */
  ranges: Readonly<Record<F, readonly [number, number]>>
  /** nomi delle classi: classNames[y] */
  classNames: readonly C[]
  classLabels: Readonly<Record<C, BilingualLabel>>
  /** scenario reale a cui i dati si ispirano; dice sempre che i dati sono sintetici */
  description: string
  /** sempre true: la UI lo usa per il badge "dati sintetici" */
  synthetic: true
}

/** Campione etichettato: x segue l'ordine delle feature richieste, y è l'indice di label in classNames */
export interface Sample<C extends string = string, Y extends number = number> {
  x: number[]
  y: Y
  label: C
}

/**
 * Forma comune dei generatori: stesso seed e stesse opzioni, stessi campioni.
 * Il generatore consuma l'rng: per riavere gli stessi campioni si riparte da createRng(seed).
 */
export type DatasetGenerator<S extends Sample, O> = (rng: Rng, opts?: O) => S[]

/** Densità vera da cui escono i campioni, valutata in un punto dello spazio delle feature */
export type Density = (x: number[]) => number
/** Densità vera di un dataset a una sola feature: si passa direttamente a xs.map(p) */
export type Density1D = (x: number) => number
