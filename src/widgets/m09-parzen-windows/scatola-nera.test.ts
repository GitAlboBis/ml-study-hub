import { describe, expect, it } from 'vitest'
import { linspace, trapz } from '../../lib/ml/stats'
import {
  GRID,
  H_DEFAULT,
  N_DEFAULT,
  N_STEPS,
  SEED_DEFAULT,
  TRUTHS,
  crossover,
  drawSamples,
  dropOf,
  excessZone,
  gaussCurve,
  gaussFit,
  machineErrors,
  parzenCurve,
  truthPdf,
  windowCount,
  winnersAt,
} from './scatola-nera'

describe('scatola-nera: le quattro densità vere', () => {
  it('ognuna, troncata a [0, 9] kWh/m², ha area 1', () => {
    const xs = linspace(0, 9, 4001)
    // i salti della uniforme costano qualche decimillesimo ai trapezi
    for (const t of TRUTHS) expect(trapz(xs, xs.map(truthPdf(t.id))), t.id).toBeCloseTo(1, 2)
  })

  it('la bimodale ha le giornate nuvolose attorno a 2 e le serene attorno a 6.5 (inventario)', () => {
    const p = truthPdf('bimodale')
    expect(p(2)).toBeGreaterThan(p(4.3))
    expect(p(6.5)).toBeGreaterThan(p(4.3))
    expect(p(6.5)).toBeGreaterThan(p(5))
  })

  it('i campioni stanno nel dominio, hanno due decimali e il prefisso non cambia quando N cresce', () => {
    for (const t of TRUTHS) {
      const s = drawSamples(t.id, SEED_DEFAULT, 200)
      expect(s).toHaveLength(200)
      for (const v of s) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(9)
        expect(Number(v.toFixed(2))).toBe(v)
      }
      expect(drawSamples(t.id, SEED_DEFAULT, 30)).toEqual(s.slice(0, 30))
      expect(drawSamples(t.id, SEED_DEFAULT + 1, 30)).not.toEqual(s.slice(0, 30))
    }
  })
})

describe('scatola-nera: le due macchine', () => {
  it('il modello parametrico stima media e varianza a massima verosimiglianza (con 1/N)', () => {
    expect(gaussFit([1, 2, 3, 6])).toEqual({ mu: 3, s2: (4 + 1 + 0 + 9) / 4 })
  })

  it('entrambe le curve sono densità sul dominio', () => {
    const s = drawSamples('bimodale', SEED_DEFAULT, N_DEFAULT)
    expect(trapz(GRID, gaussCurve(gaussFit(s)))).toBeCloseTo(1, 1)
    expect(trapz(GRID, parzenCurve(s, H_DEFAULT))).toBeCloseTo(1, 1)
  })

  it('con i dati iniziali (N = 30, h = 0.6): la gaussiana vince sulla gaussiana e sull\'asimmetrica, Parzen sulle altre due', () => {
    const w = winnersAt(N_DEFAULT, H_DEFAULT, SEED_DEFAULT)
    expect(w.gaussiana.winner).toBe('gauss')
    expect(w.bimodale.winner).toBe('parzen')
    expect(w.asimmetrica.winner).toBe('gauss')
    expect(w.unitri.winner).toBe('parzen')
  })

  it('sulla bimodale la gaussiana mette il picco nella valle: la zona di eccesso sta fra i due modi', () => {
    const s = drawSamples('bimodale', SEED_DEFAULT, N_DEFAULT)
    const g = gaussCurve(gaussFit(s))
    const p = GRID.map(truthPdf('bimodale'))
    const zone = excessZone(GRID, g, p)
    expect(zone).not.toBeNull()
    expect(zone![0]).toBeGreaterThan(2.5)
    expect(zone![1]).toBeLessThan(6)
  })

  it('la gaussiana vera non ha una zona di eccesso vistosa con molti dati', () => {
    const s = drawSamples('gaussiana', SEED_DEFAULT, 1000)
    expect(excessZone(GRID, gaussCurve(gaussFit(s)), GRID.map(truthPdf('gaussiana')))).toBeNull()
  })
})

describe('scatola-nera: la sfida è tarata', () => {
  it('asimmetrica, dati iniziali, h = 0.6: Parzen vince per ogni N da 150 in su, non prima', () => {
    const c = crossover('asimmetrica', H_DEFAULT, SEED_DEFAULT)
    expect(c.n).toBe(150)
    const i = N_STEPS.indexOf(150)
    expect(c.table[i - 1].errors.parzen).toBeGreaterThan(c.table[i - 1].errors.gauss)
    for (const row of c.table.slice(i)) expect(row.errors.parzen).toBeLessThan(row.errors.gauss)
  })

  it('con la densità gaussiana vera il modello parametrico non viene battuto per sempre', () => {
    expect(crossover('gaussiana', H_DEFAULT, SEED_DEFAULT).n).toBeNull()
  })

  it('la tabella della verifica usa gli stessi campioni dello slider (prefisso)', () => {
    const c = crossover('asimmetrica', H_DEFAULT, SEED_DEFAULT)
    const direct = machineErrors(drawSamples('asimmetrica', SEED_DEFAULT, 70), H_DEFAULT, 'asimmetrica')
    expect(c.table.find((r) => r.n === 70)!.errors.parzen).toBeCloseTo(direct.parzen, 12)
  })
})

describe('scatola-nera: dettagli del racconto', () => {
  it('la caduta porta a terra tutti i campioni a fine passo', () => {
    for (let k = 0; k < 30; k++) expect(dropOf(1, k, 30)).toBe(1)
    expect(dropOf(0, 0, 30)).toBe(0)
  })

  it('il conteggio K nella finestra di lato h', () => {
    expect(windowCount(4, [3.2, 3.8, 4.25, 5], 1)).toBe(2)
    expect(windowCount(4, [3.5, 4.5], 1)).toBe(2)
  })
})
