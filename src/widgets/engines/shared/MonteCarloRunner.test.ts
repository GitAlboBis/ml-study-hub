import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Rng } from '../../../content/types'
import { createMonteCarlo, summarize, useMonteCarlo } from './MonteCarloRunner'
import type { MonteCarloPort } from './MonteCarloRunner'
import { replicaSeed, runMonteCarloBatch } from './monteCarloWorker'
import type { MonteCarloBatchRequest } from './monteCarloWorker'

/** una replica: la media di 5 normali standard, come uno stimatore su un training set di 5 campioni */
const meanOf5 = (rng: Rng) => (rng.normal() + rng.normal() + rng.normal() + rng.normal() + rng.normal()) / 5

describe('replicaSeed', () => {
  it('semi diversi per repliche diverse, sempre gli stessi per lo stesso seme', () => {
    const seeds = Array.from({ length: 1000 }, (_, i) => replicaSeed(7, i))
    expect(new Set(seeds).size).toBe(1000)
    expect(replicaSeed(7, 3)).toBe(replicaSeed(7, 3))
    expect(replicaSeed(8, 3)).not.toBe(replicaSeed(7, 3))
    for (const s of seeds) expect(Number.isInteger(s) && s >= 0 && s < 2 ** 32).toBe(true)
  })
})

describe('createMonteCarlo', () => {
  it('a lotti per fotogramma entro il budget, fino al totale chiesto, poi si ferma', () => {
    let t = 0
    // ogni replica "costa" 1 ms: con un budget di 4 ms un fotogramma ne fa 4
    const mc = createMonteCarlo({ seed: 1, budgetMs: 4, now: () => t, replicate: (rng) => ((t += 1), meanOf5(rng)) })
    mc.run(10)
    expect(mc.snapshot()).toMatchObject({ count: 0, target: 10, running: true })
    expect(mc.step()).toBe(4)
    expect(mc.step()).toBe(4)
    expect(mc.step()).toBe(2)
    expect(mc.snapshot()).toMatchObject({ count: 10, running: false })
    expect(mc.step()).toBe(0)
  })

  it('almeno una replica per fotogramma anche se una sola supera il budget', () => {
    let t = 0
    const mc = createMonteCarlo({ seed: 1, budgetMs: 1, now: () => t, replicate: () => (t += 50) })
    mc.run(3)
    expect(mc.step()).toBe(1)
  })

  it('i risultati non dipendono dai lotti: la replica i usa sempre il suo seme', () => {
    const a = createMonteCarlo({ seed: 42, maxPerFrame: 1, replicate: meanOf5 })
    const b = createMonteCarlo({ seed: 42, maxPerFrame: 1000, replicate: meanOf5 })
    a.run(50)
    b.run(50)
    while (a.step() > 0);
    while (b.step() > 0);
    expect(a.results).toEqual(b.results)
    expect(a.results).toHaveLength(50)
  })

  it('stop si ferma a ciò che ha, reset svuota (anche con un seme nuovo), run si somma', () => {
    const mc = createMonteCarlo({ seed: 3, maxPerFrame: 5, replicate: meanOf5 })
    mc.run(100)
    mc.step()
    mc.stop()
    expect(mc.snapshot()).toMatchObject({ count: 5, target: 5, running: false })
    const first = mc.results[0]
    mc.run(1)
    mc.run(2)
    expect(mc.snapshot().target).toBe(8)
    mc.reset(4)
    expect(mc.snapshot()).toMatchObject({ count: 0, target: 0, running: false, seed: 4 })
    mc.run(1)
    mc.step()
    expect(mc.results[0]).not.toBe(first)
  })

  it('pubblica a ogni fotogramma, oppure solo alla fine (stati a passi)', () => {
    const listener = vi.fn()
    const mc = createMonteCarlo({ seed: 1, maxPerFrame: 2, replicate: meanOf5 })
    mc.subscribe(listener)
    mc.run(6)
    listener.mockClear()
    mc.step()
    expect(listener).toHaveBeenCalledTimes(1)
    mc.configure({ publishAtEnd: true })
    listener.mockClear()
    mc.step()
    expect(listener).not.toHaveBeenCalled()
    mc.step()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(mc.snapshot().count).toBe(6)
  })

  it('il tetto al totale', () => {
    const mc = createMonteCarlo({ seed: 1, maxTotal: 10, replicate: meanOf5 })
    mc.run(50)
    expect(mc.snapshot().target).toBe(10)
  })
})

/**
 * Un worker finto: tiene le richieste in coda e le consegna quando il test lo dice (deliver), calcolandole con lo
 * stesso protocollo del worker vero. `clock` fa da orologio del worker: ogni replica costa `msPerReplica`.
 */
function fakeWorker<P>(replicate: (rng: Rng, i: number, p: P) => number, msPerReplica = 10) {
  const sent: MonteCarloBatchRequest<P>[] = []
  let t = 0
  const port: MonteCarloPort & { terminated: boolean } = {
    onmessage: null,
    onerror: null,
    terminated: false,
    postMessage: (m) => void sent.push(m as MonteCarloBatchRequest<P>),
    terminate() {
      port.terminated = true
    },
  }
  const deliver = () => {
    const req = sent.shift()
    if (req === undefined) throw new Error('nessuna richiesta in coda')
    port.onmessage?.({ data: runMonteCarloBatch((rng, i, p: P) => ((t += msPerReplica), replicate(rng, i, p)), req, () => t) } as MessageEvent)
    return req
  }
  return { port, sent, deliver }
}

const meanOfN = (rng: Rng, _i: number, p: { n: number }) => {
  let s = 0
  for (let k = 0; k < p.n; k++) s += rng.normal()
  return s / p.n
}

describe('createMonteCarlo con un worker', () => {
  it('sempre nel worker: un lotto alla volta, di misura adattata alla durata cercata, con gli stessi numeri del thread principale', () => {
    const w = fakeWorker(meanOfN, 10)
    const created = vi.fn(() => w.port)
    const mc = createMonteCarlo({ seed: 11, replicate: (rng, i) => meanOfN(rng, i, { n: 5 }), worker: { create: created, params: { n: 5 }, mode: 'always', batchMs: 100 } })
    mc.run(30)
    expect(mc.step()).toBe(0)
    expect(created).toHaveBeenCalledTimes(1)
    expect(w.sent[0]).toMatchObject({ type: 'mc-batch', seed: 11, from: 0, count: 1, params: { n: 5 } })
    // un lotto in volo: i fotogrammi dopo non ne chiedono un altro
    mc.step()
    expect(w.sent).toHaveLength(1)
    w.deliver()
    expect(mc.snapshot()).toMatchObject({ count: 1, running: true, inWorker: true })
    // 10 ms a replica e 100 ms cercati per lotto: il prossimo lotto ne chiede 10
    mc.step()
    expect(w.sent[0]).toMatchObject({ from: 1, count: 10 })
    w.deliver()
    mc.step()
    // l'ultimo lotto chiede solo ciò che manca al totale
    expect(w.sent[0]).toMatchObject({ from: 11, count: 10 })
    w.deliver()
    mc.step()
    expect(w.sent[0]).toMatchObject({ from: 21, count: 9 })
    w.deliver()
    expect(mc.snapshot()).toMatchObject({ count: 30, running: false })
    const local = createMonteCarlo({ seed: 11, replicate: (rng, i) => meanOfN(rng, i, { n: 5 }) })
    local.run(30)
    while (local.step() > 0);
    expect(mc.results).toEqual(local.results)
    expect(created).toHaveBeenCalledTimes(1)
  })

  it('auto: passa al worker quando una replica supera la soglia (50 ms)', () => {
    let t = 0
    const w = fakeWorker(meanOfN)
    const mc = createMonteCarlo({ seed: 2, now: () => t, replicate: (rng, i) => ((t += 80), meanOfN(rng, i, { n: 3 })), worker: { create: () => w.port, params: { n: 3 } } })
    mc.run(5)
    expect(mc.step()).toBe(1)
    expect(mc.snapshot().inWorker).toBe(true)
    expect(mc.step()).toBe(0)
    expect(w.sent[0]).toMatchObject({ from: 1 })
  })

  it('auto: le repliche svelte restano sul thread principale e il worker non nasce', () => {
    let t = 0
    const created = vi.fn()
    const mc = createMonteCarlo({ seed: 2, now: () => t, replicate: (rng) => ((t += 1), rng.next()), worker: { create: created, params: {} } })
    mc.run(5)
    while (mc.step() > 0);
    expect(mc.snapshot()).toMatchObject({ count: 5, inWorker: false })
    expect(created).not.toHaveBeenCalled()
  })

  it('le risposte arrivate dopo stop o reset si scartano; i parametri nuovi viaggiano con il lotto dopo', () => {
    const w = fakeWorker(meanOfN)
    const mc = createMonteCarlo({ seed: 5, replicate: (rng, i) => meanOfN(rng, i, { n: 2 }), worker: { create: () => w.port, params: { n: 2 }, mode: 'always' } })
    mc.run(10)
    mc.step()
    mc.stop()
    w.deliver()
    expect(mc.snapshot()).toMatchObject({ count: 0, running: false })
    mc.run(10)
    mc.step()
    mc.reset(6)
    w.deliver()
    expect(mc.snapshot().count).toBe(0)
    mc.configure({ params: { n: 4 } })
    mc.run(1)
    mc.step()
    expect(w.sent[0]).toMatchObject({ seed: 6, from: 0, params: { n: 4 } })
  })

  it('un errore del worker lo spegne: il calcolo continua sul thread principale', () => {
    const w = fakeWorker(meanOfN)
    const mc = createMonteCarlo({ seed: 5, replicate: (rng, i) => meanOfN(rng, i, { n: 2 }), worker: { create: () => w.port, params: { n: 2 }, mode: 'always' } })
    mc.run(3)
    mc.step()
    w.port.onerror?.({ message: 'worker non caricato' } as ErrorEvent)
    expect(w.port.terminated).toBe(true)
    expect(mc.snapshot().inWorker).toBe(false)
    while (mc.step() > 0);
    expect(mc.snapshot().count).toBe(3)
  })

  it('auto: dopo un errore del worker le repliche lente restano sul thread principale', () => {
    let t = 0
    const w = fakeWorker(meanOfN)
    const created = vi.fn(() => w.port)
    const mc = createMonteCarlo({ seed: 2, now: () => t, replicate: (rng, i) => ((t += 80), meanOfN(rng, i, { n: 3 })), worker: { create: created, params: { n: 3 } } })
    mc.run(4)
    mc.step()
    mc.step()
    w.port.onerror?.({ message: 'worker non caricato' } as ErrorEvent)
    while (mc.step() > 0);
    expect(mc.snapshot()).toMatchObject({ count: 4, inWorker: false })
    expect(created).toHaveBeenCalledTimes(1)
  })

  it('dispose chiude il worker', () => {
    const w = fakeWorker(meanOfN)
    const mc = createMonteCarlo({ seed: 5, replicate: (rng, i) => meanOfN(rng, i, { n: 2 }), worker: { create: () => w.port, params: { n: 2 }, mode: 'always' } })
    mc.run(3)
    mc.step()
    mc.dispose()
    expect(w.port.terminated).toBe(true)
  })
})

describe('summarize', () => {
  it('media, varianza corretta, errore standard e intervallo al 95%', () => {
    const s = summarize([1, 2, 3, 4])
    expect(s.n).toBe(4)
    expect(s.mean).toBe(2.5)
    expect(s.variance).toBeCloseTo(5 / 3, 12)
    expect(s.sem).toBeCloseTo(Math.sqrt(5 / 3) / 2, 12)
    expect(s.lo).toBeCloseTo(2.5 - 1.96 * s.sem, 12)
    expect(s.hi).toBeCloseTo(2.5 + 1.96 * s.sem, 12)
  })
  it('un campione vuoto dà NaN, uno solo varianza NaN', () => {
    expect(Number.isNaN(summarize([]).mean)).toBe(true)
    expect(Number.isNaN(summarize([3]).variance)).toBe(true)
  })
  it('le medie di 5 normali standard hanno varianza vicina a 1/5 (2000 repliche)', () => {
    // orologio fermo: il fotogramma non esce mai dal budget, quindi un solo step() fa tutte le 2000 repliche anche su
    // una macchina carica (con performance.now vero ne faceva quante ne stavano in 8 ms, e la varianza ballava)
    const mc = createMonteCarlo({ seed: 11, maxPerFrame: 5000, now: () => 0, replicate: meanOf5 })
    mc.run(2000)
    mc.step()
    expect(mc.results).toHaveLength(2000)
    const s = summarize(mc.results)
    expect(s.mean).toBeCloseTo(0, 1)
    expect(s.variance).toBeGreaterThan(0.18)
    expect(s.variance).toBeLessThan(0.22)
  })
})

describe('useMonteCarlo', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('gira con i fotogrammi, si ferma da solo e riparte da capo quando cambia resetKey', () => {
    let queue: FrameRequestCallback[] = []
    let now = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => queue.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
    const frame = () => {
      now += 16
      const q = queue
      queue = []
      act(() => q.forEach((cb) => cb(now)))
    }
    const { result, rerender } = renderHook(({ k }) => useMonteCarlo({ seed: 5, maxPerFrame: 10, replicate: meanOf5, resetKey: k }), { initialProps: { k: 'a' } })
    expect(result.current.running).toBe(false)
    act(() => result.current.run(25))
    expect(result.current.running).toBe(true)
    frame()
    frame()
    expect(result.current.count).toBe(20)
    frame()
    expect(result.current.count).toBe(25)
    expect(result.current.running).toBe(false)
    expect(result.current.results).toHaveLength(25)
    rerender({ k: 'b' })
    expect(result.current.count).toBe(0)
  })
})
