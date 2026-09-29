import { describe, expect, it } from 'vitest'
import type { Rng } from '../../../content/types'
import { createRng } from '../../../lib/rng'
import { replicaSeed, runMonteCarloBatch, serveMonteCarlo } from './monteCarloWorker'
import type { MonteCarloBatchReply, MonteCarloBatchRequest, MonteCarloWorkerScope } from './monteCarloWorker'

/** la media di n normali di deviazione standard sigma: i parametri arrivano come dati, non per chiusura */
const meanOf = (rng: Rng, _i: number, p: { n: number; sigma: number }) => {
  let s = 0
  for (let k = 0; k < p.n; k++) s += rng.normal(0, p.sigma)
  return s / p.n
}

const request = (over: Partial<MonteCarloBatchRequest<{ n: number; sigma: number }>> = {}): MonteCarloBatchRequest<{ n: number; sigma: number }> => ({
  type: 'mc-batch',
  job: 1,
  seed: 9,
  from: 0,
  count: 4,
  params: { n: 5, sigma: 2 },
  ...over,
})

describe('runMonteCarloBatch', () => {
  it('fa le repliche da `from` con il seme di ciascuna: gli stessi numeri del calcolo sul thread principale', () => {
    const reply = runMonteCarloBatch(meanOf, request({ from: 3, count: 4 }))
    expect(reply).toMatchObject({ type: 'mc-batch', job: 1, seed: 9, from: 3 })
    if (reply.type !== 'mc-batch') throw new Error('atteso un lotto')
    const local = [3, 4, 5, 6].map((i) => meanOf(createRng(replicaSeed(9, i)), i, { n: 5, sigma: 2 }))
    expect(reply.results).toEqual(local)
  })

  it('misura il tempo del lotto con l\'orologio dato', () => {
    let t = 0
    const reply = runMonteCarloBatch((rng) => ((t += 7), rng.next()), request({ count: 3 }), () => t)
    expect(reply.type === 'mc-batch' && reply.ms).toBe(21)
  })

  it('un errore nella replica diventa una risposta di errore, non un worker morto', () => {
    const reply = runMonteCarloBatch(() => {
      throw new Error('matrice singolare')
    }, request({ job: 4 }))
    expect(reply).toEqual({ type: 'mc-error', job: 4, message: 'matrice singolare' })
  })
})

describe('serveMonteCarlo', () => {
  it('nel file del worker: risponde a ogni richiesta di lotto e ignora gli altri messaggi', () => {
    const sent: unknown[] = []
    const scope: MonteCarloWorkerScope = { onmessage: null, postMessage: (m) => void sent.push(m) }
    serveMonteCarlo(meanOf, scope)
    scope.onmessage?.({ data: { type: 'altro' } } as MessageEvent)
    expect(sent).toHaveLength(0)
    scope.onmessage?.({ data: request({ count: 2 }) } as MessageEvent)
    expect(sent).toHaveLength(1)
    const reply = sent[0] as MonteCarloBatchReply<number>
    expect(reply.type === 'mc-batch' && reply.results).toHaveLength(2)
  })
})
