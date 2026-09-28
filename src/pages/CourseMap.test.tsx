import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { manifest } from '../content/manifest'
import { defineModule } from '../content/types'
import type { ModuleData } from '../content/types'
import { useProgress } from '../store/progress'
import CourseMap from './CourseMap'

// ---------------------------------------------------------------------------------------------
// Due fogli pronti finti: la mappa deve funzionare con qualsiasi insieme di fogli pronti
// ---------------------------------------------------------------------------------------------

const sheet = (id: string, extra: Partial<ModuleData>): ModuleData =>
  defineModule({
    id,
    title: id,
    titleEn: id,
    course: 'melgani',
    chapter: 'Cap. 2 · Statistical Estimation Theory',
    order: 1,
    sources: [],
    prerequisites: [],
    estimatedMinutes: 60,
    summary: '',
    keyPoints: [],
    glossary: [],
    formulas: [],
    derivations: [],
    figures: [],
    flashcards: [],
    quiz: [],
    exam: [],
    exercises: [],
    widgets: [],
    connections: [],
    coverage: {},
    ...extra,
  })

const READY: Record<string, ModuleData> = {
  'm08-non-parametrica-knn': sheet('m08-non-parametrica-knn', { prerequisites: ['m03-stima-intro-parametrica'] }),
  'm09-parzen-windows': sheet('m09-parzen-windows', {
    prerequisites: ['m08-non-parametrica-knn'],
    connections: [
      { to: 'm10-em-dati-incompleti', why: 'Mistura di gaussiane.' },
      { to: 'p12-clustering', why: 'Anche il clustering stima densità.' },
    ],
  }),
}

vi.mock('../content/registry', () => ({
  hasModule: (id: string) => id in READY,
  loadModuleData: vi.fn(async (id: string) => {
    if (id in READY) return READY[id]
    throw new Error(`Modulo non trovato: ${id}`)
  }),
  loadModuleContent: vi.fn(),
  loadAllModuleData: vi.fn(async () => Object.values(READY)),
}))

function openMap(path = '/mappa') {
  const router = createMemoryRouter(
    [
      { path: '/mappa', Component: CourseMap },
      { path: '/m/:moduleId', element: <p>Foglio aperto</p> },
      { path: '/corso/:course', element: <p>Regione aperta</p> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

/** Schermo stretto o largo: la mappa legge (min-width: 48rem). */
function screenWidth(wide: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('min-width') ? wide : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }))
}

const graph = () => screen.getByRole('group', { name: /Grafo dei fogli/ })
const nodeOf = (id: string) => within(graph()).getAllByRole('link').find((a) => a.getAttribute('href') === `/m/${id}`)!
const world = () => graph().querySelector<HTMLElement>('[data-world]')!
/** Gli archi arrivano dopo il caricamento dei data.ts: si aspetta che il quadro li abbia disegnati. */
const edgesLoaded = () => waitFor(() => expect(screen.getByRole('status', { name: 'Stato del quadro' })).not.toHaveTextContent(/Leggo/))

beforeEach(() => {
  useProgress.getState().reset()
  localStorage.clear()
  screenWidth(true)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('quadro d\'unione: il grafo', () => {
  it('ha un nodo per ciascuno dei 50 fogli, ognuno è un collegamento al suo foglio', () => {
    openMap()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Quadro d'unione/)
    const links = within(graph()).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(manifest.map((m) => `/m/${m.id}`))
  })

  it('ogni nodo dice numero, titolo, regione, se è pronto e lo stato del rilievo dai progressi', () => {
    useProgress.getState().setModuleStatus('m09-parzen-windows', 'completato')
    openMap()
    expect(nodeOf('m09-parzen-windows')).toHaveAccessibleName(/^Foglio 09 · Finestre di Parzen.*Melgani.*pronto, Rilevato/)
    expect(nodeOf('m01-segnali-learning')).toHaveAccessibleName(/Foglio 01 .*in preparazione/)
  })

  it('gli archi vengono dai data.ts dei fogli pronti: prerequisiti e collegamenti, anche verso altre regioni', async () => {
    openMap()
    await edgesLoaded()
    expect(nodeOf('m09-parzen-windows')).toHaveAccessibleName(/richiede il foglio 08/)
    expect(nodeOf('m09-parzen-windows')).toHaveAccessibleName(/collegato ai fogli 10, 34/)
    expect(nodeOf('m03-stima-intro-parametrica')).toHaveAccessibleName(/serve per il foglio 08/)
    expect(world().querySelectorAll('[data-edge-kind="prerequisito"]')).toHaveLength(2)
    expect(world().querySelectorAll('[data-edge-kind="collegamento"]')).toHaveLength(2)
    // l'ordine di studio dentro i capitoli c'è anche senza data.ts
    expect(world().querySelector('[data-edge="sequenza:m01-segnali-learning>m02-sistema-ml-design"]')).not.toBeNull()
  })

  it('al passaggio evidenzia il foglio e i suoi vicini e mostra il cartiglio del foglio', async () => {
    const user = userEvent.setup()
    openMap()
    await edgesLoaded()
    await user.hover(nodeOf('m09-parzen-windows'))
    expect(nodeOf('m09-parzen-windows')).toHaveAttribute('data-state', 'active')
    expect(nodeOf('m08-non-parametrica-knn')).toHaveAttribute('data-state', 'near')
    expect(nodeOf('p12-clustering')).toHaveAttribute('data-state', 'near')
    expect(nodeOf('d01-reti-feedforward')).toHaveAttribute('data-state', 'dim')
    const cartouche = screen.getByTestId('cartiglio')
    expect(within(cartouche).getByText('Finestre di Parzen (kernel density estimation)')).toBeInTheDocument()
    expect(within(cartouche).getByText('Richiede')).toBeInTheDocument()
    await user.unhover(nodeOf('m09-parzen-windows'))
    expect(nodeOf('d01-reti-feedforward')).not.toHaveAttribute('data-state', 'dim')
  })

  it('un foglio raggiunto con la tastiera si accende come al passaggio', async () => {
    openMap()
    await edgesLoaded()
    act(() => nodeOf('m08-non-parametrica-knn').focus())
    expect(nodeOf('m08-non-parametrica-knn')).toHaveAttribute('data-state', 'active')
    expect(nodeOf('m09-parzen-windows')).toHaveAttribute('data-state', 'near')
    expect(within(screen.getByTestId('cartiglio')).getByText('Stima non parametrica e K-NN')).toBeInTheDocument()
    act(() => nodeOf('m08-non-parametrica-knn').blur())
    expect(screen.queryByTestId('cartiglio')).toBeNull()
  })

  it('trascinare sposta il quadro e il rilascio sopra un foglio non lo apre', async () => {
    const user = userEvent.setup()
    const router = openMap()
    const node = nodeOf('m09-parzen-windows')
    const before = world().style.transform
    await user.pointer([
      { keys: '[MouseLeft>]', target: node, coords: { clientX: 10, clientY: 10 } },
      { target: node, coords: { clientX: 90, clientY: 50 } },
      { keys: '[/MouseLeft]', target: node, coords: { clientX: 90, clientY: 50 } },
    ])
    expect(world().style.transform).not.toBe(before)
    expect(router.state.location.pathname).toBe('/mappa')
  })

  it('zoom con + e -, spostamento con le frecce, 0 rimette tutto il quadro in vista', async () => {
    const user = userEvent.setup()
    openMap()
    const zoom = screen.getByRole('status', { name: 'Zoom' })
    const start = zoom.textContent
    const transform = world().style.transform
    graph().focus()
    await user.keyboard('+')
    expect(zoom.textContent).not.toBe(start)
    expect(parseInt(zoom.textContent!)).toBeGreaterThan(parseInt(start!))
    await user.keyboard('{ArrowLeft}')
    expect(world().style.transform).not.toBe(transform)
    await user.keyboard('0')
    expect(zoom.textContent).toBe(start)
    expect(world().style.transform).toBe(transform)
    await user.keyboard('-')
    expect(parseInt(zoom.textContent!)).toBeLessThan(parseInt(start!))
  })

  it('i pulsanti di zoom fanno lo stesso', async () => {
    const user = userEvent.setup()
    openMap()
    const zoom = screen.getByRole('status', { name: 'Zoom' })
    const start = parseInt(zoom.textContent!)
    await user.click(screen.getByRole('button', { name: 'Ingrandisci' }))
    expect(parseInt(zoom.textContent!)).toBeGreaterThan(start)
    await user.click(screen.getByRole('button', { name: /Tutto il quadro/ }))
    expect(parseInt(zoom.textContent!)).toBe(start)
  })

  it('clic o Invio su un nodo aprono il foglio', async () => {
    const user = userEvent.setup()
    const router = openMap()
    await user.click(nodeOf('m09-parzen-windows'))
    expect(router.state.location.pathname).toBe('/m/m09-parzen-windows')

    const again = openMapAgain()
    nodeOf('m08-non-parametrica-knn').focus()
    await user.keyboard('{Enter}')
    expect(again.state.location.pathname).toBe('/m/m08-non-parametrica-knn')
  })

  it('il filtro per regione lascia attivi solo i suoi fogli e finisce nell\'indirizzo', async () => {
    const user = userEvent.setup()
    const router = openMap()
    const regions = screen.getByRole('radiogroup', { name: 'Regione' })
    await user.click(within(regions).getByRole('radio', { name: 'Passerini' }))
    expect(within(regions).getByRole('radio', { name: 'Passerini' })).toBeChecked()
    expect(router.state.location.search).toBe('?regione=passerini')
    expect(nodeOf('m09-parzen-windows')).toHaveAttribute('inert')
    expect(nodeOf('p12-clustering')).not.toHaveAttribute('inert')
    expect(screen.getByRole('status', { name: 'Stato del quadro' })).toHaveTextContent(/Passerini: 14 fogli/)
  })

  it('il filtro per regione è quello comune: «Tutte le regioni», scelta a inchiostro; il tassello Ricci resta visibile (regressione)', async () => {
    const user = userEvent.setup()
    openMap('/mappa?regione=ricci')
    const regions = screen.getByRole('radiogroup', { name: 'Regione' })
    expect(within(regions).getByRole('radio', { name: 'Ricci' })).toBeChecked()
    expect(within(regions).queryByRole('button')).toBeNull()
    for (const radio of within(regions).getAllByRole('radio')) {
      expect(radio.closest('label')!.className).toContain('has-[:checked]:bg-accent')
      expect(radio.closest('label')!.className).not.toContain('bg-pin')
    }
    await user.click(within(regions).getByRole('radio', { name: 'Tutte le regioni' }))
    expect(screen.getByRole('status', { name: 'Stato del quadro' })).toHaveTextContent(/Tutte le regioni: 50 fogli/)
  })

  it('le regioni nella testata sono bersagli alti almeno 40 px (regressione: 21 px)', () => {
    openMap()
    const header = screen.getByRole('banner')
    for (const name of ['Melgani', 'Passerini', 'Ricci']) expect(within(header).getByRole('link', { name })).toHaveClass('inline-flex', 'min-h-10', 'items-center')
  })

  it('i campioni degli archi nei tasti della legenda prendono il colore del tasto: leggibili anche premuti, nei due temi (regressione)', () => {
    openMap()
    for (const name of [/Ordine di studio/, /Prerequisito/, /Collegamento/]) {
      const sample = screen.getByRole('button', { name }).querySelector('svg')!
      for (const path of sample.querySelectorAll('path')) {
        const paint = path.getAttribute('stroke') ?? path.getAttribute('fill')
        expect(paint, String(name)).toBe('currentColor')
      }
    }
    // i tre tipi si distinguono per il disegno, non per la tinta: pieno, freccia, tratteggio
    expect(screen.getByRole('button', { name: /Collegamento/ }).querySelector('[stroke-dasharray]')).not.toBeNull()
    expect(screen.getByRole('button', { name: /Prerequisito/ }).querySelectorAll('path')).toHaveLength(2)
  })

  it('i titoli dei fogli compaiono solo quando sono leggibili: sotto l\'86% di zoom il nodo mostra solo numero e stato (regressione: 9-10 px)', async () => {
    const user = userEvent.setup()
    openMap()
    const zoom = screen.getByRole('status', { name: 'Zoom' })
    graph().focus()
    let seenMiddle = false
    while (parseInt(zoom.textContent!) < 86) {
      const pct = parseInt(zoom.textContent!)
      if (pct >= 65) {
        seenMiddle = true
        expect(world()).toHaveAttribute('data-lod', 'far')
      }
      await user.keyboard('+')
    }
    expect(world()).toHaveAttribute('data-lod', 'near')
    // fra il 65% e l'86% i titoli prima si vedevano, a 9-10 px reali
    expect(seenMiddle).toBe(true)
  })

  it('a riposo gli archi dei dati restano attenuati sotto l\'ordine di studio; il foglio acceso li ripassa (regressione: groviglio)', async () => {
    const user = userEvent.setup()
    openMap()
    await edgesLoaded()
    const rest = world().querySelector('[data-edge-kind="prerequisito"]')!
    expect(Number(rest.getAttribute('opacity'))).toBeLessThan(1)
    expect(world().querySelector('[data-edge-kind="sequenza"]')).toHaveAttribute('opacity', '1')
    await user.hover(nodeOf('m09-parzen-windows'))
    expect(world().querySelector('[data-edge-on="prerequisito:m08-non-parametrica-knn>m09-parzen-windows"]')).not.toBeNull()
  })

  it('gli archi dei dati fra fogli della stessa riga di capitoli corrono a gomiti nei corridoi, non attraverso le righe', async () => {
    openMap()
    await edgesLoaded()
    const knn = world().querySelector('[data-edge="prerequisito:m08-non-parametrica-knn>m09-parzen-windows"]')!
    // tratti diritti (L) con i gomiti smussati (Q), non una curva di Bézier (C)
    expect(knn.getAttribute('d')).toMatch(/^M[\d. ]+L/)
    expect(knn.getAttribute('d')).not.toContain('C')
    // verso un'altra regione resta la curva
    expect(world().querySelector('[data-edge^="collegamento:m09-parzen-windows>p12"]')!.getAttribute('d')).toContain('C')
  })

  it('la legenda accende e spegne i tipi di arco', async () => {
    const user = userEvent.setup()
    openMap()
    await edgesLoaded()
    const toggle = screen.getByRole('button', { name: /Collegamento/ })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(world().querySelectorAll('[data-edge-kind="collegamento"]')).toHaveLength(0)
  })
})

describe('quadro d\'unione: l\'elenco', () => {
  it('su schermo stretto diventa un elenco per capitoli, con i collegamenti di ogni foglio', async () => {
    screenWidth(false)
    openMap()
    expect(screen.queryByRole('group', { name: /Grafo dei fogli/ })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Cap. 2 · Teoria della stima statistica Statistical Estimation Theory' })).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Fogli di Cap. 2 · Teoria della stima statistica' })
    await edgesLoaded()
    const row = list.querySelector<HTMLElement>('[data-sheet="m09-parzen-windows"]')!
    expect(within(row).getAllByRole('link')[0]).toHaveAccessibleName(/^Foglio 09 · Finestre di Parzen/)
    expect(within(row).getByRole('link', { name: /Foglio 08/ })).toHaveAttribute('href', '/m/m08-non-parametrica-knn')
    expect(within(row).getByRole('link', { name: /Foglio 34/ })).toHaveAttribute('href', '/m/p12-clustering')
  })

  it('nell\'elenco i collegamenti sono una riga di numeri, non una fila di titoli a tutta larghezza (regressione: 14.253 px)', async () => {
    screenWidth(false)
    openMap()
    await edgesLoaded()
    const row = screen.getByRole('list', { name: 'Fogli di Cap. 2 · Teoria della stima statistica' }).querySelector<HTMLElement>('[data-sheet="m09-parzen-windows"]')!
    const knn = within(row).getByRole('link', { name: /Foglio 08 · Stima non parametrica/ })
    // a vista solo il numero sul campo della regione; il nome intero resta per chi ascolta e nel suggerimento
    expect(knn).toHaveTextContent(/^08$/)
    expect(knn).toHaveAttribute('title', expect.stringMatching(/Stima non parametrica/))
    expect(knn).toHaveClass('min-h-10', 'min-w-10')
  })

  it('su schermo largo l\'elenco si sceglie dalla vista e resta nell\'indirizzo', async () => {
    const user = userEvent.setup()
    const router = openMap()
    await user.click(screen.getByRole('button', { name: 'Elenco' }))
    expect(router.state.location.search).toBe('?vista=elenco')
    expect(screen.queryByRole('group', { name: /Grafo dei fogli/ })).toBeNull()
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(10)
  })
})

/** Un secondo router, dopo aver smontato il primo: per provare anche il tasto Invio da capo. */
function openMapAgain() {
  cleanup()
  return openMap()
}
