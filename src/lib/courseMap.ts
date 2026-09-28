// Il quadro d'unione come grafo (/mappa) e i conti della pagina di una regione (/corso/:course).
// Funzioni pure sul manifest e sui data.ts dei fogli pronti: nessun componente qui, così si provano da sole.
//
// Layout deterministico, niente fisica: le regioni sono fasce una sotto l'altra (Melgani, Passerini, Ricci);
// dentro una fascia i capitoli sono blocchi di colonne da sinistra a destra nell'ordine del manifest, e una
// fascia troppo larga va a capo per capitoli; dentro un capitolo i fogli si leggono per righe, come un testo
// (da sinistra a destra, poi a capo), al massimo MAX_ROWS righe. Così lo stesso foglio sta sempre nello stesso posto.
import { manifest } from '../content/manifest'
import type { ModuleManifestEntry } from '../content/manifest'
import type { CourseId, ModuleData, Rich } from '../content/types'
import type { ModuleProgress, ModuleStatus } from '../store/progress'
import { lastStop, REGION_ORDER } from './atlas'
import type { Stop } from './atlas'

// ---------------------------------------------------------------------------------------------
// Misure del mondo (px a zoom 100%)
// ---------------------------------------------------------------------------------------------

export const NODE_W = 176
export const NODE_H = 68
const COL_GAP = 20 // tra le colonne di uno stesso capitolo
const ROW_GAP = 28 // tra le righe di fogli
const CHAPTER_GAP = 52 // tra i capitoli: il corridoio in cui passano gli archi
const MAX_ROWS = 3 // oltre, il capitolo prende un'altra colonna
const MAX_LINE = 1900 // oltre, i capitoli della regione vanno a capo
const TAB_H = 60 // cartiglio della regione: alto abbastanza da leggersi anche a quadro intero
const TAB_GAP = 16
const LABEL_H = 44 // etichetta del capitolo, due righe
const LINE_GAP = 40 // tra due righe di capitoli della stessa regione
const BAND_GAP = 64 // tra le regioni
const PAD = 40 // margine del mondo

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface GraphNode extends Box {
  id: string
  course: CourseId
  chapter: string
  /** numero del foglio, "01"… */
  number: string
  /** posto nel manifest */
  index: number
  row: number
  col: number
}

/** Il riquadro dell'etichetta di un capitolo: largo quanto le sue colonne, sopra i suoi fogli. */
export interface ChapterFrame extends Box {
  course: CourseId
  chapter: string
  count: number
}

/** La fascia di una regione, dal cartiglio all'ultima riga di fogli. */
export interface RegionFrame extends Box {
  course: CourseId
  /** numero del primo e dell'ultimo foglio */
  first: string
  last: string
}

export interface GraphLayout {
  nodes: GraphNode[]
  chapters: ChapterFrame[]
  regions: RegionFrame[]
  width: number
  height: number
  /** altezza del cartiglio della regione, in cima alla fascia */
  tabHeight: number
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function layoutAtlas(entries: readonly ModuleManifestEntry[] = manifest): GraphLayout {
  const nodes: GraphNode[] = []
  const chapters: ChapterFrame[] = []
  const regions: RegionFrame[] = []
  let y = PAD
  let width = 0

  for (const course of REGION_ORDER) {
    // i capitoli sono corse consecutive dello stesso capitolo, come in chaptersOf
    const groups: { chapter: string; items: { meta: ModuleManifestEntry; index: number }[] }[] = []
    entries.forEach((meta, index) => {
      if (meta.course !== course) return
      const last = groups.at(-1)
      if (last && last.chapter === meta.chapter) last.items.push({ meta, index })
      else groups.push({ chapter: meta.chapter, items: [{ meta, index }] })
    })
    if (groups.length === 0) continue

    const blocks = groups.map((g) => {
      const cols = Math.ceil(g.items.length / MAX_ROWS)
      const rows = Math.ceil(g.items.length / cols)
      return { ...g, cols, w: cols * NODE_W + (cols - 1) * COL_GAP, h: rows * NODE_H + (rows - 1) * ROW_GAP }
    })
    const total = blocks.reduce((s, b) => s + b.w, 0) + (blocks.length - 1) * CHAPTER_GAP
    // righe di capitoli bilanciate per numero (6 e 5, non 7 e 4)
    const perLine = Math.ceil(blocks.length / Math.max(1, Math.ceil(total / MAX_LINE)))

    const top = y
    let lineY = top + TAB_H + TAB_GAP
    let bandW = 0
    for (let l = 0; l < blocks.length; l += perLine) {
      const line = blocks.slice(l, l + perLine)
      let x = PAD
      for (const b of line) {
        chapters.push({ course, chapter: b.chapter, count: b.items.length, x, y: lineY, w: b.w, h: LABEL_H })
        b.items.forEach(({ meta, index }, j) => {
          const row = Math.floor(j / b.cols)
          const col = j % b.cols
          nodes.push({
            id: meta.id,
            course,
            chapter: meta.chapter,
            number: pad2(index + 1),
            index,
            row,
            col,
            x: x + col * (NODE_W + COL_GAP),
            y: lineY + LABEL_H + row * (NODE_H + ROW_GAP),
            w: NODE_W,
            h: NODE_H,
          })
        })
        x += b.w + CHAPTER_GAP
      }
      bandW = Math.max(bandW, x - CHAPTER_GAP - PAD)
      lineY += LABEL_H + Math.max(...line.map((b) => b.h)) + LINE_GAP
    }
    const h = lineY - LINE_GAP - top
    const first = groups[0].items[0].index
    const last = groups.at(-1)!.items.at(-1)!.index
    regions.push({ course, x: PAD, y: top, w: bandW, h, first: pad2(first + 1), last: pad2(last + 1) })
    width = Math.max(width, PAD + bandW + PAD)
    y = top + h + BAND_GAP
  }

  nodes.sort((a, b) => a.index - b.index)
  return { nodes, chapters, regions, width, height: y - BAND_GAP + PAD, tabHeight: TAB_H }
}

// ---------------------------------------------------------------------------------------------
// Archi
// ---------------------------------------------------------------------------------------------

/**
 * - `sequenza`: l'ordine di studio, tra fogli consecutivi dello stesso capitolo;
 * - `collegamento`: le `connections` dei data.ts, senza verso;
 * - `prerequisito`: dal foglio richiesto al foglio che lo richiede.
 */
export type EdgeKind = 'sequenza' | 'collegamento' | 'prerequisito'

export interface GraphEdge {
  id: string
  from: string
  to: string
  kind: EdgeKind
  /** il perché del collegamento, dai data.ts; null se nessun foglio lo dice */
  why: Rich | null
}

/** Quello che serve di un data.ts per tracciare gli archi. */
export type SheetLinks = Pick<ModuleData, 'id' | 'prerequisites' | 'connections'>

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

/**
 * Gli archi del quadro: prerequisiti e collegamenti dei fogli pronti più l'ordine di studio dentro ogni capitolo.
 * Una coppia di fogli ha al più un arco: il prerequisito vince sul collegamento (e ne prende il perché),
 * un arco dei dati vince sull'ordine di studio. Id fuori dal manifest e anelli si ignorano.
 * L'ordine del risultato è l'ordine di disegno: sequenza sotto, prerequisiti sopra.
 */
export function buildEdges(entries: readonly ModuleManifestEntry[], sheets: readonly SheetLinks[]): GraphEdge[] {
  const known = new Set(entries.map((e) => e.id))
  const prereqs = new Map<string, GraphEdge>()
  const links = new Map<string, GraphEdge>()

  for (const s of sheets) {
    if (!known.has(s.id)) continue
    for (const p of s.prerequisites) {
      const key = pairKey(p, s.id)
      if (!known.has(p) || p === s.id || prereqs.has(key)) continue
      prereqs.set(key, { id: `prerequisito:${p}>${s.id}`, from: p, to: s.id, kind: 'prerequisito', why: null })
    }
  }
  for (const s of sheets) {
    if (!known.has(s.id)) continue
    for (const c of s.connections) {
      if (!known.has(c.to) || c.to === s.id) continue
      const key = pairKey(s.id, c.to)
      const existing = prereqs.get(key) ?? links.get(key)
      if (existing) {
        existing.why ??= c.why
        continue
      }
      links.set(key, { id: `collegamento:${s.id}>${c.to}`, from: s.id, to: c.to, kind: 'collegamento', why: c.why })
    }
  }

  const sequence: GraphEdge[] = []
  for (let i = 1; i < entries.length; i++) {
    const a = entries[i - 1]
    const b = entries[i]
    if (a.course !== b.course || a.chapter !== b.chapter) continue
    const key = pairKey(a.id, b.id)
    if (prereqs.has(key) || links.has(key)) continue
    sequence.push({ id: `sequenza:${a.id}>${b.id}`, from: a.id, to: b.id, kind: 'sequenza', why: null })
  }
  return [...sequence, ...links.values(), ...prereqs.values()]
}

export interface Relation {
  id: string
  why: Rich | null
}

export interface Relations {
  /** i prerequisiti del foglio */
  requires: Relation[]
  /** i fogli che lo richiedono */
  unlocks: Relation[]
  /** i collegamenti, in tutte e due le direzioni */
  related: Relation[]
}

export function relationsOf(id: string, edges: readonly GraphEdge[]): Relations {
  const out: Relations = { requires: [], unlocks: [], related: [] }
  for (const e of edges) {
    if (e.kind === 'prerequisito' && e.to === id) out.requires.push({ id: e.from, why: e.why })
    else if (e.kind === 'prerequisito' && e.from === id) out.unlocks.push({ id: e.to, why: e.why })
    else if (e.kind === 'collegamento' && (e.from === id || e.to === id)) out.related.push({ id: e.from === id ? e.to : e.from, why: e.why })
  }
  return out
}

/** I fogli uniti a `id` da un arco qualsiasi, ordine di studio compreso. */
export function neighborsOf(id: string, edges: readonly GraphEdge[]): Set<string> {
  const out = new Set<string>()
  for (const e of edges) {
    if (e.from === id) out.add(e.to)
    else if (e.to === id) out.add(e.from)
  }
  return out
}

// ---------------------------------------------------------------------------------------------
// Tracciato degli archi (SVG, coordinate del mondo)
// ---------------------------------------------------------------------------------------------

const r1 = (n: number) => Math.round(n * 10) / 10
const curve = (x0: number, y0: number, c1x: number, c1y: number, c2x: number, c2y: number, x1: number, y1: number) =>
  `M${r1(x0)} ${r1(y0)}C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${r1(x1)} ${r1(y1)}`

/**
 * Una curva dal bordo di `a` al bordo di `b`, scelta per restare il più possibile nei corridoi tra i fogli:
 * - stessa riga, vicini: da un fianco all'altro; lontani: un arco sopra la riga;
 * - stessa colonna, righe vicine: dal bordo inferiore al superiore; righe saltate: nel corridoio a sinistra;
 * - altrimenti dal bordo inferiore (o superiore) al bordo opposto, con tangenti verticali.
 */
export function edgePath(a: Box, b: Box): string {
  const acx = a.x + a.w / 2
  const acy = a.y + a.h / 2
  const bcx = b.x + b.w / 2
  const bcy = b.y + b.h / 2

  if (Math.abs(acy - bcy) < (a.h + b.h) / 4) {
    const right = bcx > acx
    const x0 = right ? a.x + a.w : a.x
    const x1 = right ? b.x : b.x + b.w
    if (Math.abs(x1 - x0) <= CHAPTER_GAP + 1) {
      const c = (x1 - x0) / 2
      return curve(x0, acy, x0 + c, acy, x1 - c, bcy, x1, bcy)
    }
    const lift = Math.min(a.y, b.y) - 36
    return curve(acx, a.y, acx, lift, bcx, lift, bcx, b.y)
  }

  const down = bcy > acy
  const y0 = down ? a.y + a.h : a.y
  const y1 = down ? b.y : b.y + b.h
  if (Math.abs(acx - bcx) < (a.w + b.w) / 4 && Math.abs(y1 - y0) > ROW_GAP + 1) {
    const bulge = Math.min(CHAPTER_GAP * 0.6, 20 + Math.abs(y1 - y0) / 8)
    return curve(a.x, acy, a.x - bulge, acy, b.x - bulge, bcy, b.x, bcy)
  }
  const c = Math.max(12, Math.abs(y1 - y0) / 2) * (down ? 1 : -1)
  return curve(acx, y0, acx, y0 + c, bcx, y1 - c, bcx, y1)
}

export interface Point {
  x: number
  y: number
}

/** Distanza fra due corsie parallele dello stesso corridoio. */
const LANE = 3

/** La cima della riga di capitoli di un foglio (l'etichetta del capitolo): uguale per i fogli della stessa riga. */
const lineTopOf = (n: GraphNode) => n.y - n.row * (NODE_H + ROW_GAP) - LABEL_H

/**
 * Il percorso a gomiti di un arco dei dati (prerequisito, collegamento) fra due fogli della stessa riga di capitoli,
 * tutto nello spazio libero: esce dal bordo inferiore di `a`, corre nel corridoio sotto la sua riga, sale o scende nel
 * corridoio a sinistra della colonna di `b` e arriva sul bordo di `b` (dall'alto se `b` sta più in basso, da sotto
 * altrimenti). Così gli archi non attraversano le righe dei fogli e non si ammassano in un fascio fra due righe.
 * `lane` (−2…2) sposta di qualche pixel le corsie, perché gli archi che condividono un corridoio restino distinti.
 * null quando i due fogli stanno in righe di capitoli diverse (un'altra regione): lì resta la curva di edgePath.
 */
export function orthoRoute(a: GraphNode, b: GraphNode, lane = 0): Point[] | null {
  if (lineTopOf(a) !== lineTopOf(b)) return null
  const off = lane * LANE
  const ax = a.x + a.w / 2 + off
  const bx = b.x + b.w / 2 + off
  const below = b.y > a.y
  // il corridoio sotto la riga di a; per b quello sopra (se sta più in basso) o sotto la sua riga
  const ya = a.y + a.h + ROW_GAP / 2 + off
  const yb = below ? b.y - ROW_GAP / 2 + off : b.y + b.h + ROW_GAP / 2 + off
  const end = below ? b.y : b.y + b.h
  if (ya === yb) return [{ x: ax, y: a.y + a.h }, { x: ax, y: ya }, { x: bx, y: ya }, { x: bx, y: end }]
  // il corridoio verticale a sinistra della colonna di b: fra due colonne, o fra due capitoli
  const xc = b.x - COL_GAP / 2 + off
  return [
    { x: ax, y: a.y + a.h },
    { x: ax, y: ya },
    { x: xc, y: ya },
    { x: xc, y: yb },
    { x: bx, y: yb },
    { x: bx, y: end },
  ]
}

/** Una spezzata con i gomiti smussati (raggio `r`, ridotto sui tratti corti): il tracciato SVG di un arco a gomiti. */
export function roundedPath(points: readonly Point[], r = 6): string {
  const pts = points.filter((p, i) => i === 0 || p.x !== points[i - 1].x || p.y !== points[i - 1].y)
  let d = `M${r1(pts[0].x)} ${r1(pts[0].y)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [p, c, n] = [pts[i - 1], pts[i], pts[i + 1]]
    const lin = Math.hypot(c.x - p.x, c.y - p.y)
    const lout = Math.hypot(n.x - c.x, n.y - c.y)
    const k = Math.min(r, lin / 2, lout / 2)
    const ax = c.x - ((c.x - p.x) / lin) * k
    const ay = c.y - ((c.y - p.y) / lin) * k
    const bx = c.x + ((n.x - c.x) / lout) * k
    const by = c.y + ((n.y - c.y) / lout) * k
    d += `L${r1(ax)} ${r1(ay)}Q${r1(c.x)} ${r1(c.y)} ${r1(bx)} ${r1(by)}`
  }
  const last = pts.at(-1)!
  return `${d}L${r1(last.x)} ${r1(last.y)}`
}

// ---------------------------------------------------------------------------------------------
// Camera: schermo = mondo × k + (x, y)
// ---------------------------------------------------------------------------------------------

export interface Camera {
  x: number
  y: number
  k: number
}

export interface Size {
  w: number
  h: number
}

export const ZOOM = { min: 0.2, max: 2, step: 1.25 } as const

const clampK = (k: number) => Math.min(ZOOM.max, Math.max(ZOOM.min, k))

/** La camera che fa stare `box` nella vista, centrato, senza ingrandire oltre il 100%. */
export function fitCamera(box: Box, view: Size, pad = 32): Camera {
  const k = clampK(Math.min(Math.max(1, view.w - 2 * pad) / Math.max(1, box.w), Math.max(1, view.h - 2 * pad) / Math.max(1, box.h), 1))
  return { k, x: (view.w - box.w * k) / 2 - box.x * k, y: (view.h - box.h * k) / 2 - box.y * k }
}

/** Zoom di un fattore attorno al punto (px, py) della vista, che resta fermo. */
export function zoomAt(cam: Camera, factor: number, px: number, py: number): Camera {
  const k = clampK(cam.k * factor)
  const wx = (px - cam.x) / cam.k
  const wy = (py - cam.y) / cam.k
  return { k, x: px - wx * k, y: py - wy * k }
}

export const panBy = (cam: Camera, dx: number, dy: number): Camera => ({ x: cam.x + dx, y: cam.y + dy, k: cam.k })

/** Sposta la camera del minimo necessario perché `box` (mondo) sia tutto nella vista, con un margine. */
export function revealBox(cam: Camera, box: Box, view: Size, margin = 24): Camera {
  const shift = (start: number, size: number, limit: number) => {
    const a = start * cam.k
    const b = (start + size) * cam.k
    if (a < margin) return margin - a
    if (b > limit - margin) return Math.max(limit - margin - b, margin - a)
    return 0
  }
  const dx = shift(box.x + cam.x / cam.k, box.w, view.w)
  const dy = shift(box.y + cam.y / cam.k, box.h, view.h)
  return dx === 0 && dy === 0 ? cam : panBy(cam, dx, dy)
}

export function boundsOf(boxes: readonly Box[]): Box {
  if (boxes.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y }
}

// ---------------------------------------------------------------------------------------------
// Pagina di una regione
// ---------------------------------------------------------------------------------------------

export interface CourseTally {
  total: number
  ready: number
  /** i fogli per stato del rilievo: "da rilevare" conta solo i fogli pronti */
  byStatus: Record<ModuleStatus, number>
  /** fogli non ancora pronti che non hai mai aperto (come sheetsByStatus di Progressi) */
  preparing: number
}

export function tallyCourse(
  course: CourseId,
  isReady: (id: string) => boolean,
  modules: Record<string, ModuleProgress>,
  entries: readonly ModuleManifestEntry[] = manifest,
): CourseTally {
  const sheets = entries.filter((m) => m.course === course)
  const byStatus: Record<ModuleStatus, number> = { 'da-iniziare': 0, 'in-corso': 0, completato: 0, 'da-ripassare': 0 }
  let preparing = 0
  for (const s of sheets) {
    const status = modules[s.id]?.status ?? 'da-iniziare'
    // un foglio in preparazione non si può ancora rilevare: non è "da rilevare", è terreno non ancora pronto
    if (status === 'da-iniziare' && !isReady(s.id)) preparing += 1
    else byStatus[status] += 1
  }
  return { total: sheets.length, ready: sheets.filter((s) => isReady(s.id)).length, byStatus, preparing }
}

/** Lo spillo della sola regione: il suo foglio letto per ultimo. */
export function lastStopIn(course: CourseId, modules: Record<string, ModuleProgress>, entries: readonly ModuleManifestEntry[] = manifest): Stop | null {
  const ids = new Set(entries.filter((m) => m.course === course).map((m) => m.id))
  return lastStop(Object.fromEntries(Object.entries(modules).filter(([id]) => ids.has(id))))
}

/** Da dove partire in una regione: il primo foglio pronto non ancora rilevato, poi il primo pronto, poi il primo. */
export function nextSheetIn(
  course: CourseId,
  isReady: (id: string) => boolean,
  modules: Record<string, ModuleProgress>,
  entries: readonly ModuleManifestEntry[] = manifest,
): ModuleManifestEntry | null {
  const sheets = entries.filter((m) => m.course === course)
  return sheets.find((s) => isReady(s.id) && modules[s.id]?.status !== 'completato') ?? sheets.find((s) => isReady(s.id)) ?? sheets[0] ?? null
}

/** "45 min", "3 h", "2 h 30 min". */
export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}
