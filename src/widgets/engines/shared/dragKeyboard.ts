// Logica di DragBins (chip da smistare in contenitori) e Sortable (liste da riordinare): dove sta ogni chip,
// scambi nei contenitori a capienza limitata, esito di uno smistamento o di un ordinamento, e i due automi della
// tastiera. Niente React: il componente traduce gli eventi, qui si decide che cosa succede.
//
// TASTIERA (uguale nei due componenti, WIDGET_GUIDE §6): Invio o Spazio prendono l'elemento che ha il fuoco,
// le frecce scelgono dove va (un contenitore, una posizione nella lista), Invio o Spazio lo posano, Esc annulla e
// rimette tutto com'era. Senza presa le frecce spostano solo il fuoco (un solo arresto del Tab per gruppo).

/** Dove sta ogni chip: l'id del contenitore, oppure null (o assente) se è ancora nel vassoio. */
export type Placement = Readonly<Record<string, string | null>>

/** Un bersaglio della tastiera: un contenitore, o null per il vassoio. */
export type BinTarget = string | null

const isAct = (key: string) => key === 'Enter' || key === ' ' || key === 'Spacebar'

/**
 * Posa `item` in `target`. Se il contenitore ha una capienza (`capacity`) ed è pieno, lo scambio è quello di una
 * casella: il primo occupante va dove stava il chip che arriva (nel vassoio, se veniva da lì).
 */
export function placeItem(placement: Placement, item: string, target: BinTarget, capacity?: Readonly<Record<string, number>>): Placement {
  const from = placement[item] ?? null
  if (from === target) return placement
  const next: Record<string, string | null> = { ...placement, [item]: target }
  const cap = target === null ? undefined : capacity?.[target]
  if (cap !== undefined) {
    const occupants = Object.keys(placement).filter((k) => k !== item && placement[k] === target)
    const over = occupants.length - cap + 1
    for (const o of occupants.slice(0, Math.max(0, over))) next[o] = from
  }
  return next
}

/** I chip di un contenitore (null: il vassoio), nell'ordine dell'elenco degli elementi. */
export function binContents(items: readonly string[], placement: Placement, bin: BinTarget): string[] {
  return items.filter((i) => (placement[i] ?? null) === bin)
}

export interface SortOutcome {
  correct: string[]
  wrong: string[]
  /** ancora nel vassoio */
  missing: string[]
  /** tutti posati */
  done: boolean
  /** tutti posati e tutti giusti */
  allCorrect: boolean
}

/** Esito di uno smistamento contro la soluzione (`answer`: elemento → contenitore giusto). Gli elementi senza soluzione non contano. */
export function sortOutcome(placement: Placement, items: readonly string[], answer: Readonly<Record<string, string>>): SortOutcome {
  const correct: string[] = []
  const wrong: string[] = []
  const missing: string[] = []
  for (const i of items) {
    if (answer[i] === undefined) continue
    const at = placement[i] ?? null
    if (at === null) missing.push(i)
    else if (at === answer[i]) correct.push(i)
    else wrong.push(i)
  }
  const done = missing.length === 0
  return { correct, wrong, missing, done, allCorrect: done && wrong.length === 0 }
}

export interface BinsHold {
  item: string
  target: BinTarget
}

export type BinsKeyResult = { hold: BinsHold | null; drop?: { item: string; target: BinTarget }; cancel?: true }

/**
 * Automa della tastiera dei contenitori. `targets` sono i bersagli in ordine di lettura (il vassoio, se c'è, è
 * null). null se il tasto non riguarda la presa (senza presa le frecce spostano il fuoco: lo fa il componente).
 */
export function binsKey(hold: BinsHold | null, key: string, focused: string, placement: Placement, targets: readonly BinTarget[]): BinsKeyResult | null {
  const n = targets.length
  if (n === 0) return null
  if (hold === null) {
    if (!isAct(key)) return null
    // si propone il contenitore dopo quello in cui il chip sta già: posarlo dov'è non sarebbe una mossa
    const at = targets.indexOf(placement[focused] ?? null)
    return { hold: { item: focused, target: targets[(at + 1) % n] } }
  }
  const at = Math.max(0, targets.indexOf(hold.target))
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return { hold: { ...hold, target: targets[(at + 1) % n] } }
    case 'ArrowLeft':
    case 'ArrowUp':
      return { hold: { ...hold, target: targets[(at - 1 + n) % n] } }
    case 'Home':
      return { hold: { ...hold, target: targets[0] } }
    case 'End':
      return { hold: { ...hold, target: targets[n - 1] } }
    case 'Escape':
      return { hold: null, cancel: true }
    default:
      return isAct(key) ? { hold: null, drop: { item: hold.item, target: hold.target } } : null
  }
}

// ---------------------------------------------------------------------------------------------
// Liste riordinabili
// ---------------------------------------------------------------------------------------------

/** L'ordine con `id` spostato alla posizione `to` (riportata dentro la lista). */
export function moveInOrder(order: readonly string[], id: string, to: number): string[] {
  const from = order.indexOf(id)
  if (from < 0) return [...order]
  const rest = order.filter((o) => o !== id)
  rest.splice(Math.min(Math.max(0, Math.round(to)), rest.length), 0, id)
  return rest
}

/** Posizione d'arrivo di un elemento trascinato: quanti centri degli ALTRI elementi stanno prima del puntatore. */
export function dropIndex(mids: readonly number[], at: number): number {
  let k = 0
  for (const m of mids) if (m < at) k++
  return k
}

/** Rettangolo di un elemento misurato a inizio gesto (bastano i quattro lati di un DOMRect). */
export interface FlowBox {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * Posizione d'arrivo in una lista orizzontale che va a capo (a 390 px una pipeline di cinque blocchi occupa due
 * righe): quanti degli ALTRI elementi, in ordine di lettura, stanno prima del puntatore. Prima vuol dire su una riga
 * tutta sopra il puntatore, oppure sulla sua riga con il centro a sinistra. Con una sola riga coincide con dropIndex.
 */
export function dropIndexFlow(boxes: readonly FlowBox[], px: number, py: number): number {
  let k = 0
  for (const b of boxes) {
    if (b.bottom < py) k++
    else if (b.top <= py && (b.left + b.right) / 2 < px) k++
  }
  return k
}

/**
 * Dove disegnare la linea d'arrivo per l'indice `index` di dropIndexFlow: una verticale alta quanto l'elemento, 4 px
 * prima dell'elemento che verrà dopo, oppure 4 px dopo quello che verrà prima quando il puntatore sta ancora sulla
 * sua riga (in fondo alla riga e in testa alla successiva l'indice è lo stesso: decide la riga del puntatore).
 */
export function flowMarkAt(boxes: readonly FlowBox[], index: number, py: number): { x: number; y: number; h: number } {
  const n = boxes.length
  if (n === 0) return { x: 0, y: 0, h: 0 }
  const i = Math.min(Math.max(0, Math.round(index)), n)
  if (i > 0 && (i === n || py < boxes[i].top)) {
    const b = boxes[i - 1]
    return { x: b.right + 4, y: b.top, h: b.bottom - b.top }
  }
  const b = boxes[i]
  return { x: b.left - 4, y: b.top, h: b.bottom - b.top }
}

export interface SortHold {
  item: string
  /** l'ordine prima della presa: Esc lo rimette */
  origin: readonly string[]
}

export type SortKeyResult = { hold: SortHold | null; order: readonly string[]; focus?: string; dropped?: string; cancel?: true }

/** Automa della tastiera di una lista: con la presa l'elemento si sposta nella lista, senza si sposta il fuoco. */
export function sortKey(hold: SortHold | null, key: string, focused: string, order: readonly string[], orientation: 'vertical' | 'horizontal'): SortKeyResult | null {
  const prev = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
  const next = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
  const last = order.length - 1
  if (hold === null) {
    const i = order.indexOf(focused)
    if (isAct(key)) return { hold: { item: focused, origin: order }, order }
    if (key === prev) return { hold: null, order, focus: order[Math.max(0, i - 1)] }
    if (key === next) return { hold: null, order, focus: order[Math.min(last, i + 1)] }
    if (key === 'Home') return { hold: null, order, focus: order[0] }
    if (key === 'End') return { hold: null, order, focus: order[last] }
    return null
  }
  const i = order.indexOf(hold.item)
  if (key === prev) return { hold, order: moveInOrder(order, hold.item, i - 1) }
  if (key === next) return { hold, order: moveInOrder(order, hold.item, i + 1) }
  if (key === 'Home') return { hold, order: moveInOrder(order, hold.item, 0) }
  if (key === 'End') return { hold, order: moveInOrder(order, hold.item, last) }
  if (key === 'Escape') return { hold: null, order: hold.origin, cancel: true }
  if (isAct(key)) return { hold: null, order, dropped: hold.item }
  return null
}

/** Esito di un ordinamento contro quello giusto: posizioni esatte e chi è fuori posto. */
export function orderOutcome(order: readonly string[], answer: readonly string[]): { correct: number; total: number; allCorrect: boolean; wrong: string[] } {
  const wrong = order.filter((id, i) => answer[i] !== id)
  const total = answer.length
  const correct = order.length - wrong.length
  return { correct, total, allCorrect: wrong.length === 0 && order.length === total, wrong }
}

// ---------------------------------------------------------------------------------------------
// Nomi parlati
// ---------------------------------------------------------------------------------------------

/** Comandi TeX che decorano un simbolo senza dargli un nome: si tacciono. */
const SILENT = new Set(['hat', 'bar', 'tilde', 'vec', 'mathbf', 'mathrm', 'mathit', 'boldsymbol', 'text', 'operatorname', 'left', 'right', 'displaystyle', 'mathcal'])

/**
 * Il testo di un'etichetta Rich (Markdown con $…$) da dare come nome accessibile: senza marcatura Markdown e con
 * la formula letta per nomi ("$\hat{\theta}_{ML}$" → "theta ML"). Un nome con MathML dentro si legge male
 * ("σ2"): chi ha una formula importante passa comunque un `speak` scritto a mano.
 */
export function speakable(rich: string): string {
  const out = rich.replace(/\$([^$]*)\$/g, (_m, tex: string) =>
    tex
      .replace(/\\([a-zA-Z]+)/g, (_c, name: string) => (SILENT.has(name) ? ' ' : ` ${name} `))
      .replace(/[{}^_\\]/g, ' '),
  )
  return out
    .replace(/[*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
