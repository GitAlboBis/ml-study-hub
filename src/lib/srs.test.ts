import { describe, expect, it } from 'vitest'
import { isDue, review } from './srs'

const DAY = 86_400_000

describe('srs', () => {
  it('prima risposta buona: 1 giorno', () => {
    const c = review(undefined, 4, 0)
    expect(c.interval).toBe(1)
    expect(c.due).toBe(DAY)
    expect(c.reps).toBe(1)
  })

  it('seconda risposta buona: 6 giorni', () => {
    expect(review(review(undefined, 4, 0), 4, DAY).interval).toBe(6)
  })

  it('dalla terza risposta buona l’intervallo cresce con il fattore di facilità', () => {
    let c = review(undefined, 4, 0)
    c = review(c, 4, c.due)
    c = review(c, 4, c.due)
    expect(c.ef).toBeCloseTo(2.5)
    expect(c.interval).toBe(15)
    expect(c.reps).toBe(3)
  })

  it('la scadenza parte dal momento del ripasso, non dalla scadenza precedente', () => {
    const now = 10 * DAY + 1234
    const c = review(review(undefined, 4, 0), 4, now)
    expect(c.due).toBe(now + 6 * DAY)
  })

  it('voto 5 alza ef, voto 3 lo abbassa', () => {
    expect(review(undefined, 5, 0).ef).toBeCloseTo(2.6)
    expect(review(undefined, 3, 0).ef).toBeCloseTo(2.36)
  })

  it('errore azzera le ripetizioni e abbassa ef senza scendere sotto 1.3', () => {
    let c = review(undefined, 5, 0)
    for (let i = 0; i < 10; i++) c = review(c, 1, 0)
    expect(c.reps).toBe(0)
    expect(c.ef).toBeGreaterThanOrEqual(1.3)
  })

  it('dopo un errore la carta torna domani e la sequenza riparte da 1 giorno', () => {
    let c = review(undefined, 4, 0)
    c = review(c, 4, c.due)
    c = review(c, 1, 20 * DAY)
    expect(c.interval).toBe(1)
    expect(c.due).toBe(21 * DAY)
    expect(review(c, 4, c.due).interval).toBe(1)
  })

  it('non modifica la carta ricevuta', () => {
    const c = review(undefined, 4, 0)
    const copia = { ...c }
    review(c, 5, DAY)
    expect(c).toEqual(copia)
  })

  it('isDue', () => {
    expect(isDue(undefined, 0)).toBe(true)
    expect(isDue(review(undefined, 5, 0), 0)).toBe(false)
  })

  it('isDue: una carta è in scadenza dal suo istante di scadenza in poi', () => {
    const c = review(undefined, 4, 0)
    expect(isDue(c, DAY - 1)).toBe(false)
    expect(isDue(c, DAY)).toBe(true)
  })
})
