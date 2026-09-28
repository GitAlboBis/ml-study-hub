import { describe, expect, it } from 'vitest'
import { manifest } from '../content/manifest'
import type { ModuleManifestEntry } from '../content/manifest'
import type { ModuleProgress } from '../store/progress'
import {
  boundsOf,
  buildEdges,
  edgePath,
  fitCamera,
  formatMinutes,
  layoutAtlas,
  NODE_H,
  NODE_W,
  neighborsOf,
  nextSheetIn,
  orthoRoute,
  panBy,
  relationsOf,
  revealBox,
  lastStopIn,
  roundedPath,
  tallyCourse,
  ZOOM,
  zoomAt,
} from './courseMap'
import type { Box, GraphNode, SheetLinks } from './courseMap'

const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const entry = (id: string, course: ModuleManifestEntry['course'], chapter: string): ModuleManifestEntry => ({
  id,
  course,
  chapter,
  title: id,
  titleEn: id,
  sources: [{ doc: 'ch1', pages: [1, 2] }],
})

const progress = (status: ModuleProgress['status'], lastVisited = 0, lastSection: string | null = null): ModuleProgress => ({
  status,
  sections: lastSection ? [lastSection] : [],
  lastSection,
  lastVisited,
})

// ---------------------------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------------------------

describe('layout del quadro', () => {
  const layout = layoutAtlas()

  it('ha un nodo per ogni foglio del manifest, con il suo numero, e nessun nodo si sovrappone a un altro', () => {
    expect(layout.nodes.map((n) => n.id)).toEqual(manifest.map((m) => m.id))
    expect(layout.nodes.find((n) => n.id === 'm09-parzen-windows')?.number).toBe('09')
    for (const n of layout.nodes) {
      expect(n.w).toBe(NODE_W)
      expect(n.h).toBe(NODE_H)
    }
    for (let i = 0; i < layout.nodes.length; i++)
      for (let j = i + 1; j < layout.nodes.length; j++) expect(overlap(layout.nodes[i], layout.nodes[j]), `${layout.nodes[i].id} su ${layout.nodes[j].id}`).toBe(false)
  })

  it('è deterministico: due calcoli danno lo stesso quadro', () => {
    expect(layoutAtlas()).toEqual(layout)
  })

  it('le regioni sono fasce una sotto l\'altra, nell\'ordine Melgani, Passerini, Ricci, dentro il mondo', () => {
    expect(layout.regions.map((r) => r.course)).toEqual(['melgani', 'passerini', 'ricci'])
    for (let i = 1; i < layout.regions.length; i++) expect(layout.regions[i].y).toBeGreaterThan(layout.regions[i - 1].y + layout.regions[i - 1].h)
    for (const n of layout.nodes) {
      const band = layout.regions.find((r) => r.course === n.course)!
      expect(n.y).toBeGreaterThanOrEqual(band.y)
      expect(n.y + n.h).toBeLessThanOrEqual(band.y + band.h)
      expect(n.x + n.w).toBeLessThanOrEqual(layout.width)
      expect(n.y + n.h).toBeLessThanOrEqual(layout.height)
    }
    expect(layout.regions.find((r) => r.course === 'melgani')).toMatchObject({ first: '01', last: '22' })
  })

  it('ogni capitolo è un blocco di colonne: i capitoli di una riga vanno da sinistra a destra nell\'ordine del manifest', () => {
    const cap1 = layout.nodes.filter((n) => n.chapter === 'Cap. 1 · Introduction')
    const cap2 = layout.nodes.filter((n) => n.chapter === 'Cap. 2 · Statistical Estimation Theory')
    expect(Math.max(...cap1.map((n) => n.x + n.w))).toBeLessThan(Math.min(...cap2.map((n) => n.x)))
    // ogni capitolo ha la sua etichetta, sopra i suoi fogli
    const label = layout.chapters.find((c) => c.chapter === 'Cap. 2 · Statistical Estimation Theory')!
    expect(label.count).toBe(8)
    for (const n of cap2) {
      expect(n.y).toBeGreaterThanOrEqual(label.y + label.h)
      expect(n.x).toBeGreaterThanOrEqual(label.x)
      expect(n.x + n.w).toBeLessThanOrEqual(label.x + label.w)
    }
  })

  it('dentro il capitolo i fogli si leggono per righe: da sinistra a destra, poi a capo, al massimo tre righe', () => {
    const cap2 = layout.nodes.filter((n) => n.chapter === 'Cap. 2 · Statistical Estimation Theory')
    // 8 fogli: tre colonne, tre righe (03 04 05 / 06 07 08 / 09 10)
    expect(cap2.map((n) => [n.row, n.col])).toEqual([
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1],
    ])
    expect(new Set(cap2.filter((n) => n.row === 1).map((n) => n.y)).size).toBe(1)
    expect(cap2[1].x).toBeGreaterThan(cap2[0].x)
    expect(cap2[3].y).toBeGreaterThan(cap2[0].y)
    expect(Math.max(...layout.nodes.map((n) => n.row))).toBeLessThanOrEqual(2)
  })

  it('una regione troppo larga va a capo per capitoli, con righe bilanciate', () => {
    const ricci = layout.nodes.filter((n) => n.course === 'ricci')
    const band = layout.regions.find((r) => r.course === 'ricci')!
    // 11 capitoli di Ricci: due righe di capitoli (6 e 5), la seconda sotto la prima
    const lines = [...new Set(layout.chapters.filter((c) => c.course === 'ricci').map((c) => c.y))]
    expect(lines).toHaveLength(2)
    expect(layout.chapters.filter((c) => c.course === 'ricci' && c.y === lines[0])).toHaveLength(6)
    expect(ricci.at(-1)!.y).toBeGreaterThan(ricci[0].y)
    expect(band.w).toBeLessThanOrEqual(layout.width)
  })

  it('funziona con qualsiasi elenco di fogli, anche con una sola regione', () => {
    const small = layoutAtlas([entry('a', 'passerini', 'X'), entry('b', 'passerini', 'X'), entry('c', 'passerini', 'Y')])
    expect(small.regions.map((r) => r.course)).toEqual(['passerini'])
    expect(small.nodes.map((n) => n.number)).toEqual(['01', '02', '03'])
    expect(small.chapters.map((c) => c.chapter)).toEqual(['X', 'Y'])
  })
})

// ---------------------------------------------------------------------------------------------
// Archi
// ---------------------------------------------------------------------------------------------

describe('archi del quadro', () => {
  const entries = [
    entry('a1', 'melgani', 'A'),
    entry('a2', 'melgani', 'A'),
    entry('a3', 'melgani', 'A'),
    entry('b1', 'melgani', 'B'),
    entry('p1', 'passerini', 'P'),
  ]
  const sheets: SheetLinks[] = [
    {
      id: 'a3',
      prerequisites: ['a1', 'b1', 'a3', 'fantasma'],
      connections: [
        { to: 'a1', why: 'stessa stima' },
        { to: 'p1', why: 'ponte verso Passerini' },
        { to: 'fantasma', why: 'non esiste' },
      ],
    },
    { id: 'p1', prerequisites: [], connections: [{ to: 'a3', why: 'ritorno' }] },
  ]
  const edges = buildEdges(entries, sheets)
  const find = (from: string, to: string) => edges.find((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from))

  it('i prerequisiti vanno dal foglio richiesto al foglio che lo richiede', () => {
    expect(find('a1', 'a3')).toMatchObject({ from: 'a1', to: 'a3', kind: 'prerequisito' })
    expect(find('b1', 'a3')).toMatchObject({ from: 'b1', to: 'a3', kind: 'prerequisito' })
  })

  it('un collegamento sulla stessa coppia di un prerequisito non raddoppia l\'arco: ne porta il perché', () => {
    expect(edges.filter((e) => [e.from, e.to].sort().join() === 'a1,a3')).toHaveLength(1)
    expect(find('a1', 'a3')?.why).toBe('stessa stima')
  })

  it('i collegamenti dichiarati da tutte e due le parti diventano un solo arco', () => {
    const bridge = edges.filter((e) => e.kind === 'collegamento')
    expect(bridge).toHaveLength(1)
    expect(bridge[0]).toMatchObject({ from: 'a3', to: 'p1', why: 'ponte verso Passerini' })
  })

  it('ignora gli id che non sono nel manifest e gli archi di un foglio verso se stesso', () => {
    expect(edges.some((e) => e.from === 'fantasma' || e.to === 'fantasma')).toBe(false)
    expect(edges.some((e) => e.from === e.to)).toBe(false)
  })

  it('l\'ordine di studio unisce i fogli consecutivi di uno stesso capitolo, mai tra capitoli diversi', () => {
    const seq = edges.filter((e) => e.kind === 'sequenza')
    expect(seq.map((e) => `${e.from}>${e.to}`)).toEqual(['a1>a2', 'a2>a3'])
  })

  it('senza fogli pronti restano solo gli archi dell\'ordine di studio', () => {
    const only = buildEdges(entries, [])
    expect(only.every((e) => e.kind === 'sequenza')).toBe(true)
    expect(only).toHaveLength(2)
  })

  it('un arco dei dati sulla stessa coppia prende il posto dell\'ordine di studio', () => {
    const withPrereq = buildEdges(entries, [{ id: 'a2', prerequisites: ['a1'], connections: [] }])
    expect(withPrereq.filter((e) => e.kind === 'sequenza').map((e) => `${e.from}>${e.to}`)).toEqual(['a2>a3'])
  })

  it('gli archi hanno id unici e i prerequisiti stanno in fondo, così si disegnano sopra', () => {
    expect(new Set(edges.map((e) => e.id)).size).toBe(edges.length)
    const kinds = edges.map((e) => e.kind)
    expect(kinds.lastIndexOf('sequenza')).toBeLessThan(kinds.indexOf('collegamento'))
    expect(kinds.lastIndexOf('collegamento')).toBeLessThan(kinds.indexOf('prerequisito'))
  })

  it('relationsOf dice che cosa un foglio richiede, a che cosa serve e con che cosa è collegato', () => {
    expect(relationsOf('a3', edges)).toEqual({
      requires: [
        { id: 'a1', why: 'stessa stima' },
        { id: 'b1', why: null },
      ],
      unlocks: [],
      related: [{ id: 'p1', why: 'ponte verso Passerini' }],
    })
    expect(relationsOf('a1', edges).unlocks).toEqual([{ id: 'a3', why: 'stessa stima' }])
    expect(relationsOf('p1', edges).related.map((r) => r.id)).toEqual(['a3'])
  })

  it('neighborsOf dà i vicini di un foglio, ordine di studio compreso', () => {
    expect([...neighborsOf('a3', edges)].sort()).toEqual(['a1', 'a2', 'b1', 'p1'])
    expect([...neighborsOf('a2', edges)].sort()).toEqual(['a1', 'a3'])
  })
})

// ---------------------------------------------------------------------------------------------
// Geometria degli archi
// ---------------------------------------------------------------------------------------------

describe('tracciato degli archi', () => {
  const box = (col: number, row: number): Box => ({ x: col * 200, y: row * 100, w: NODE_W, h: NODE_H })
  const numbers = (d: string) => d.match(/-?\d+(\.\d+)?/g)!.map(Number)

  it('è una curva che parte e arriva sul bordo dei due fogli', () => {
    const d = edgePath(box(0, 0), box(3, 0))
    expect(d).toMatch(/^M[\d.-]+ [\d.-]+C/)
  })

  it('tra fogli vicini sulla stessa riga va da un fianco all\'altro', () => {
    const [x0, y0, , , , , x1, y1] = numbers(edgePath(box(0, 0), box(1, 0)))
    expect(x0).toBe(NODE_W)
    expect(x1).toBe(200)
    expect(y0).toBe(NODE_H / 2)
    expect(y1).toBe(NODE_H / 2)
  })

  it('sulla stessa colonna, saltando righe, passa nel corridoio a sinistra invece di attraversare i fogli', () => {
    const [x0, , c1x, , c2x, , x1] = numbers(edgePath(box(0, 0), box(0, 3)))
    expect(x0).toBe(0)
    expect(x1).toBe(0)
    expect(c1x).toBeLessThan(0)
    expect(c2x).toBeLessThan(0)
  })

  it('verso una riga più in basso scende dal bordo inferiore al bordo superiore', () => {
    const [, y0, , , , , , y1] = numbers(edgePath(box(2, 0), box(0, 1)))
    expect(y0).toBe(NODE_H)
    expect(y1).toBe(100)
  })
})

describe('archi dei dati a gomiti (regressione: il fascio di archi di Melgani attraversava le righe dei fogli)', () => {
  const layout = layoutAtlas()
  const lineOf = (n: GraphNode) => n.y - n.row * (NODE_H + 28) - 44
  /** Un segmento orizzontale o verticale entra nell'interno di un riquadro? */
  const crosses = (p: { x: number; y: number }, q: { x: number; y: number }, b: Box) => {
    const [x0, x1] = [Math.min(p.x, q.x), Math.max(p.x, q.x)]
    const [y0, y1] = [Math.min(p.y, q.y), Math.max(p.y, q.y)]
    return x0 < b.x + b.w && x1 > b.x && y0 < b.y + b.h && y1 > b.y
  }

  it('fra due fogli della stessa riga di capitoli non attraversa nessun foglio: corre nei corridoi fra righe e colonne', () => {
    const melgani = layout.nodes.filter((n) => n.course === 'melgani')
    let routes = 0
    for (const a of melgani) {
      for (const b of melgani) {
        if (a === b || lineOf(a) !== lineOf(b)) continue
        for (const lane of [-2, 0, 2]) {
          const pts = orthoRoute(a, b, lane)!
          expect(pts, `${a.id} > ${b.id}`).not.toBeNull()
          routes += 1
          // parte dal bordo di a, arriva sul bordo di b
          expect(pts[0].x).toBeGreaterThan(a.x)
          expect(pts[0].x).toBeLessThan(a.x + a.w)
          expect(pts[0].y).toBe(a.y + a.h)
          const end = pts.at(-1)!
          expect(end.x).toBeGreaterThan(b.x)
          expect(end.x).toBeLessThan(b.x + b.w)
          expect([b.y, b.y + b.h]).toContain(end.y)
          for (let i = 1; i < pts.length; i++) {
            // solo tratti orizzontali o verticali
            expect(pts[i].x === pts[i - 1].x || pts[i].y === pts[i - 1].y).toBe(true)
            for (const n of layout.nodes) {
              if (n === a || n === b) continue
              expect(crosses(pts[i - 1], pts[i], n), `${a.id} > ${b.id} passa sul foglio ${n.id}`).toBe(false)
            }
          }
          // i tratti di mezzo stanno fuori anche da a e da b
          for (let i = 2; i < pts.length - 1; i++) {
            expect(crosses(pts[i - 1], pts[i], a) || crosses(pts[i - 1], pts[i], b)).toBe(false)
          }
        }
      }
    }
    expect(routes).toBeGreaterThan(100)
  })

  it('fra righe di capitoli diverse lascia il tracciato curvo (null)', () => {
    const a = layout.nodes.find((n) => n.course === 'melgani')!
    const b = layout.nodes.find((n) => n.course === 'passerini')!
    expect(orthoRoute(a, b)).toBeNull()
  })

  it('roundedPath smussa i gomiti e finisce sull\'ultimo punto', () => {
    const d = roundedPath([{ x: 0, y: 0 }, { x: 0, y: 20 }, { x: 30, y: 20 }, { x: 30, y: 5 }])
    expect(d).toMatch(/^M0 0L0 14Q0 20 6 20L24 20Q30 20 30 14L30 5$/)
  })
})

// ---------------------------------------------------------------------------------------------
// Camera: zoom e spostamento
// ---------------------------------------------------------------------------------------------

describe('camera', () => {
  const world: Box = { x: 0, y: 0, w: 2000, h: 1000 }
  const view = { w: 1000, h: 800 }

  it('fitCamera fa stare il riquadro nella vista, centrato', () => {
    const cam = fitCamera(world, view, 0)
    expect(cam.k).toBeCloseTo(0.5)
    expect(cam.x).toBeCloseTo(0)
    expect(cam.y).toBeCloseTo((800 - 500) / 2)
  })

  it('fitCamera non ingrandisce oltre il 100% un riquadro piccolo', () => {
    expect(fitCamera({ x: 0, y: 0, w: 100, h: 50 }, view).k).toBe(1)
  })

  it('zoomAt tiene fermo il punto sotto il cursore e rispetta i limiti', () => {
    const cam = { x: 10, y: 20, k: 1 }
    const next = zoomAt(cam, 2, 300, 200)
    // il punto del mondo sotto (300, 200) resta lì
    const before = { x: (300 - cam.x) / cam.k, y: (200 - cam.y) / cam.k }
    expect(before.x * next.k + next.x).toBeCloseTo(300)
    expect(before.y * next.k + next.y).toBeCloseTo(200)
    expect(zoomAt(cam, 100, 0, 0).k).toBe(ZOOM.max)
    expect(zoomAt(cam, 0.001, 0, 0).k).toBe(ZOOM.min)
  })

  it('panBy sposta la vista', () => {
    expect(panBy({ x: 0, y: 0, k: 0.5 }, 30, -20)).toEqual({ x: 30, y: -20, k: 0.5 })
  })

  it('revealBox sposta il minimo necessario per mostrare un riquadro, e niente se è già visibile', () => {
    const cam = { x: 0, y: 0, k: 1 }
    expect(revealBox(cam, { x: 100, y: 100, w: 50, h: 50 }, view)).toEqual(cam)
    const moved = revealBox(cam, { x: 1500, y: 100, w: 100, h: 50 }, view, 20)
    expect(moved.x).toBe(1000 - 1600 - 20)
    expect(moved.y).toBe(0)
  })

  it('boundsOf racchiude tutti i riquadri', () => {
    expect(boundsOf([{ x: 10, y: 20, w: 5, h: 5 }, { x: -5, y: 0, w: 10, h: 40 }])).toEqual({ x: -5, y: 0, w: 20, h: 40 })
  })
})

// ---------------------------------------------------------------------------------------------
// Pagina corso
// ---------------------------------------------------------------------------------------------

describe('pagina corso', () => {
  it('tallyCourse conta fogli, fogli pronti e stati del rilievo della sola regione', () => {
    const tally = tallyCourse('melgani', (id) => id === 'm09-parzen-windows', {
      'm09-parzen-windows': progress('completato'),
      'm03-stima-intro-parametrica': progress('in-corso'),
      'p01-stima-parametri': progress('completato'),
    })
    expect(tally.total).toBe(22)
    expect(tally.ready).toBe(1)
    // "da rilevare" conta solo i fogli pronti; i non pronti mai aperti sono "in preparazione", come in Progressi
    expect(tally.byStatus).toEqual({ 'da-iniziare': 0, 'in-corso': 1, completato: 1, 'da-ripassare': 0 })
    expect(tally.preparing).toBe(20)
  })

  it('tallyCourse: i fogli in preparazione non sono "da rilevare" (regressione: Ricci diceva "0 di 14 pronti · Da rilevare 14")', () => {
    const none = tallyCourse('ricci', () => false, {})
    expect(none.ready).toBe(0)
    expect(none.byStatus['da-iniziare']).toBe(0)
    expect(none.preparing).toBe(14)
    const one = tallyCourse('melgani', (id) => id === 'm09-parzen-windows', {})
    expect(one.byStatus['da-iniziare']).toBe(1)
    expect(one.preparing).toBe(21)
    // ogni foglio sta in una sola voce
    const sum = Object.values(one.byStatus).reduce((a, b) => a + b, 0) + one.preparing
    expect(sum).toBe(one.total)
  })

  it('lastStopIn è lo spillo della sola regione', () => {
    const modules = {
      'm09-parzen-windows': progress('in-corso', 100, 'scelta-di-h'),
      'p01-stima-parametri': progress('in-corso', 200, 'prior'),
    }
    expect(lastStopIn('melgani', modules)).toEqual({ moduleId: 'm09-parzen-windows', section: 'scelta-di-h', at: 100 })
    expect(lastStopIn('passerini', modules)?.moduleId).toBe('p01-stima-parametri')
    expect(lastStopIn('ricci', modules)).toBeNull()
  })

  it('nextSheetIn propone il primo foglio pronto non rilevato, altrimenti il primo della regione', () => {
    const ready = (id: string) => id === 'm09-parzen-windows' || id === 'm10-em-dati-incompleti'
    expect(nextSheetIn('melgani', ready, {})?.id).toBe('m09-parzen-windows')
    expect(nextSheetIn('melgani', ready, { 'm09-parzen-windows': progress('completato') })?.id).toBe('m10-em-dati-incompleti')
    expect(nextSheetIn('ricci', ready, {})?.id).toBe('d01-reti-feedforward')
  })

  it('formatMinutes scrive i tempi di studio', () => {
    expect(formatMinutes(45)).toBe('45 min')
    expect(formatMinutes(60)).toBe('1 h')
    expect(formatMinutes(180)).toBe('3 h')
    expect(formatMinutes(150)).toBe('2 h 30 min')
  })
})
