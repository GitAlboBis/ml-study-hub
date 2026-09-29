import { describe, expect, it } from 'vitest'
import {
  angleDelta,
  angleFromCenter,
  binEdges,
  clampOrdered,
  clipLineToBox,
  knobKey,
  lineThrough,
  nearestParam,
  pointerAngle,
  snapAngle,
  snapValue,
  sliderKey,
  wrapAngle,
} from './handleMath'

describe('angoli della manopola', () => {
  it('wrapAngle riporta nel periodo, anche i negativi e il rumore in virgola mobile', () => {
    expect(wrapAngle(370)).toBe(10)
    expect(wrapAngle(-30)).toBe(330)
    expect(wrapAngle(360)).toBe(0)
    expect(wrapAngle(359.9999999999999)).toBe(0)
    // una retta: θ e θ + 180° sono la stessa direzione
    expect(wrapAngle(200, 180)).toBe(20)
    expect(wrapAngle(-10, 180)).toBe(170)
    // periodo che parte da -90
    expect(wrapAngle(100, 180, -90)).toBe(-80)
  })

  it('angleDelta dà la distanza più breve con segno', () => {
    expect(angleDelta(350, 10)).toBe(20)
    expect(angleDelta(10, 350)).toBe(-20)
    expect(angleDelta(0, 180)).toBe(180)
    expect(angleDelta(170, 10, 180)).toBe(20)
  })

  it('angleFromCenter usa coordinate matematiche: y in su, antiorario', () => {
    expect(angleFromCenter(1, 0)).toBe(0)
    expect(angleFromCenter(0, 1)).toBe(90)
    expect(angleFromCenter(-1, 0)).toBe(180)
    expect(angleFromCenter(0, -1)).toBe(270)
    expect(angleFromCenter(1, 1)).toBeCloseTo(45, 12)
  })

  it('snapAngle aggancia alla griglia del passo', () => {
    expect(snapAngle(44, 5)).toBe(45)
    expect(snapAngle(0.3, 1)).toBe(0)
    expect(snapAngle(22.4, 7.5)).toBe(22.5)
  })

  it('knobKey: frecce, Maiusc, Inizio/Fine; giro completo che si richiude', () => {
    const full = { min: 0, max: 360, step: 1 }
    expect(knobKey(10, 'ArrowRight', false, full)).toBe(11)
    expect(knobKey(10, 'ArrowUp', false, full)).toBe(11)
    expect(knobKey(10, 'ArrowLeft', false, full)).toBe(9)
    expect(knobKey(0, 'ArrowLeft', false, full)).toBe(359)
    expect(knobKey(359, 'ArrowRight', false, full)).toBe(0)
    expect(knobKey(10, 'ArrowRight', true, full)).toBe(25)
    expect(knobKey(10, 'PageUp', false, full)).toBe(25)
    expect(knobKey(10, 'Home', false, full)).toBe(0)
    expect(knobKey(10, 'End', false, full)).toBe(359)
    expect(knobKey(10, 'a', false, full)).toBeNull()
  })

  it('knobKey assiale: θ e θ + 180° coincidono, il valore resta in [0, 180)', () => {
    const axial = { min: 0, max: 180, step: 5 }
    expect(knobKey(175, 'ArrowRight', false, axial)).toBe(0)
    expect(knobKey(0, 'ArrowLeft', false, axial)).toBe(175)
    expect(knobKey(90, 'ArrowRight', true, axial)).toBe(105)
  })

  it('knobKey limitato: senza giro completo si ferma agli estremi', () => {
    const bounded = { min: -45, max: 45, step: 1, wrap: false }
    expect(knobKey(45, 'ArrowRight', false, bounded)).toBe(45)
    expect(knobKey(-45, 'ArrowLeft', false, bounded)).toBe(-45)
    expect(knobKey(0, 'End', false, bounded)).toBe(45)
  })

  it('pointerAngle: il puntatore sulla manopola diventa un angolo agganciato, piegato o limitato', () => {
    // angolo 135° in coordinate matematiche: dx = -1, dy = +1
    expect(pointerAngle(-1, 1, { min: 0, max: 360, step: 1 })).toBe(135)
    // assiale: 135° + 180° = 315° si legge 135°
    expect(pointerAngle(1, -1, { min: 0, max: 180, step: 1 })).toBe(135)
    // limitato a [-45, 45]: 100° è più vicino a 45 che a -45
    expect(pointerAngle(Math.cos((100 * Math.PI) / 180), Math.sin((100 * Math.PI) / 180), { min: -45, max: 45, step: 1, wrap: false })).toBe(45)
    // 300° = -60°: più vicino a -45
    expect(pointerAngle(Math.cos((300 * Math.PI) / 180), Math.sin((300 * Math.PI) / 180), { min: -45, max: 45, step: 1, wrap: false })).toBe(-45)
    // dentro l'intervallo limitato, -30° resta -30°
    expect(pointerAngle(Math.cos((-30 * Math.PI) / 180), Math.sin((-30 * Math.PI) / 180), { min: -45, max: 45, step: 1, wrap: false })).toBe(-30)
  })
})

describe('soglie e aggancio', () => {
  it('binEdges: i bordi dei bin', () => {
    expect(binEdges(0, 0.5, 4)).toEqual([0, 0.5, 1, 1.5, 2])
    expect(binEdges(1.2, 0.1, 3)).toEqual([1.2, 1.3, 1.4, 1.5])
  })

  it('snapValue: sempre al bordo più vicino, oppure solo entro un raggio', () => {
    const edges = [0, 0.5, 1, 1.5, 2]
    expect(snapValue(0.7, { snaps: edges })).toBe(0.5)
    expect(snapValue(0.8, { snaps: edges })).toBe(1)
    expect(snapValue(0.7, { snaps: edges, radius: 0.1 })).toBe(0.7)
    expect(snapValue(0.93, { snaps: edges, radius: 0.1 })).toBe(1)
    // senza bordi: griglia del passo
    expect(snapValue(0.26, { step: 0.1, min: 0 })).toBe(0.3)
  })

  it('sliderKey: con i bordi le frecce vanno al bordo successivo, non restano ferme', () => {
    const opts = { min: 0, max: 2, step: 0.2, snaps: [0, 0.5, 1, 1.5, 2] }
    expect(sliderKey(1, 'ArrowRight', false, opts)).toBe(1.5)
    expect(sliderKey(1, 'ArrowLeft', false, opts)).toBe(0.5)
    // da un valore fra due bordi: al bordo in quella direzione
    expect(sliderKey(0.7, 'ArrowRight', false, opts)).toBe(1)
    expect(sliderKey(0.7, 'ArrowLeft', false, opts)).toBe(0.5)
    expect(sliderKey(2, 'ArrowRight', false, opts)).toBe(2)
    expect(sliderKey(1, 'Home', false, opts)).toBe(0)
    expect(sliderKey(1, 'End', false, opts)).toBe(2)
    // Maiusc: cinque bordi (qui si ferma all'estremo)
    expect(sliderKey(0, 'ArrowRight', true, opts)).toBe(2)
  })

  it('sliderKey senza bordi: passo, Maiusc = dieci passi, estremi', () => {
    const opts = { min: 0, max: 10, step: 0.1 }
    expect(sliderKey(1, 'ArrowRight', false, opts)).toBe(1.1)
    expect(sliderKey(1, 'ArrowUp', false, opts)).toBe(1.1)
    expect(sliderKey(1, 'ArrowDown', false, opts)).toBe(0.9)
    expect(sliderKey(1, 'ArrowRight', true, opts)).toBe(2)
    expect(sliderKey(1, 'PageUp', false, opts)).toBe(2)
    expect(sliderKey(9.95, 'ArrowRight', false, opts)).toBe(10)
    expect(sliderKey(1, 'Tab', false, opts)).toBeNull()
  })

  it('clampOrdered: confini ordinati con distanza minima, dentro i limiti', () => {
    expect(clampOrdered([1, 2, 3], 1, 2.5, 0.2, 0, 4)).toEqual([1, 2.5, 3])
    expect(clampOrdered([1, 2, 3], 1, 2.95, 0.2, 0, 4)).toEqual([1, 2.8, 3])
    expect(clampOrdered([1, 2, 3], 1, 0.5, 0.2, 0, 4)).toEqual([1, 1.2, 3])
    expect(clampOrdered([1, 2, 3], 0, -1, 0.2, 0, 4)).toEqual([0, 2, 3])
    expect(clampOrdered([1, 2, 3], 2, 9, 0.2, 0, 4)).toEqual([1, 2, 4])
  })
})

describe('curve e rette', () => {
  it('nearestParam trova il parametro del punto più vicino su una curva', () => {
    // cerchio di raggio 100 centrato nell'origine, t in gradi
    const at = (t: number) => [100 * Math.cos((t * Math.PI) / 180), 100 * Math.sin((t * Math.PI) / 180)] as const
    expect(nearestParam(at, 0, 360, 0, 150)).toBeCloseTo(90, 2)
    expect(nearestParam(at, 0, 360, -70, -70)).toBeCloseTo(225, 2)
    // parabola y = x², dal punto (0, 5): i due rami sono equidistanti, fuori dall'intervallo [0, 3] resta il ramo destro
    const par = (t: number) => [t, t * t] as const
    const t = nearestParam(par, 0, 3, 0, 5)
    expect(t).toBeCloseTo(Math.sqrt(4.5), 3)
  })

  it('lineThrough: forma normale w·x + b = 0 con w unitario, e angolo della retta', () => {
    const l = lineThrough([0, 1], [2, 1])
    expect(l).not.toBeNull()
    expect(l!.w[0]).toBeCloseTo(0, 12)
    expect(l!.w[1]).toBeCloseTo(1, 12)
    expect(l!.b).toBeCloseTo(-1, 12)
    expect(l!.angle).toBeCloseTo(0, 12)
    const d = lineThrough([0, 0], [1, 1])!
    // punto (1, 0) sul lato negativo, (0, 1) sul positivo: w punta a sinistra della direzione p → q
    const side = (pt: readonly [number, number]) => d.w[0] * pt[0] + d.w[1] * pt[1] + d.b
    expect(side([1, 0])).toBeLessThan(0)
    expect(side([0, 1])).toBeGreaterThan(0)
    expect(d.angle).toBeCloseTo(45, 12)
    expect(lineThrough([1, 1], [1, 1])).toBeNull()
  })

  it('clipLineToBox: la retta intera ritagliata sul rettangolo del grafico', () => {
    const seg = clipLineToBox([0, 0], [1, 1], [-2, 2], [-1, 1])
    expect(seg).not.toBeNull()
    const [a, b] = seg!
    expect(a[0]).toBeCloseTo(-1, 12)
    expect(a[1]).toBeCloseTo(-1, 12)
    expect(b[0]).toBeCloseTo(1, 12)
    expect(b[1]).toBeCloseTo(1, 12)
    // verticale
    const v = clipLineToBox([0.5, 0], [0.5, 3], [0, 1], [0, 10])!
    expect(v[0]).toEqual([0.5, 0])
    expect(v[1]).toEqual([0.5, 10])
    // fuori dal rettangolo
    expect(clipLineToBox([0, 5], [1, 5], [0, 1], [0, 1])).toBeNull()
  })
})
