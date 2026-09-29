// La replica della vetrina (la media di N letture di un sensore con rumore σ, per ogni N della griglia), in un file
// puro: la usano il componente sul thread principale e il worker (vetrina.worker.ts), con gli stessi numeri.
import type { Rng } from '../../content/types'

export const NS = [2, 5, 10, 20, 50, 100, 200, 500]

/** Parametri clonabili della replica: arrivano al worker con ogni lotto. */
export interface VetrinaParams {
  sigma: number
}

export function vetrinaReplica(rng: Rng, _index: number, p: VetrinaParams): number[] {
  return NS.map((k) => {
    let sum = 0
    for (let i = 0; i < k; i++) sum += rng.normal(0, p.sigma)
    return sum / k
  })
}
