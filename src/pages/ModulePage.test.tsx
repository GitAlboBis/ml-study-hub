import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { MDXProps } from 'mdx/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineModule, md } from '../content/types'
import type { ModuleData } from '../content/types'
import { routes } from '../router'
import { useProgress } from '../store/progress'

// ---------------------------------------------------------------------------------------------
// Un foglio finto: la pagina deve funzionare con qualsiasi modulo, non con il contenuto vero di m09
// ---------------------------------------------------------------------------------------------

const ID = 'm09-parzen-windows'

const data: ModuleData = defineModule({
  id: ID,
  title: 'Finestre di Parzen',
  titleEn: 'Parzen windows',
  course: 'melgani',
  chapter: 'Cap. 2 · Statistical Estimation Theory',
  order: 9,
  sources: [
    { doc: 'ch2', pages: [51, 53] },
    { doc: 'part1', pages: [36, 37] },
  ],
  prerequisites: ['m08-non-parametrica-knn'],
  estimatedMinutes: 45,
  summary: md`Ogni campione porta una **finestra**: la somma delle finestre è la stima $\hat{p}(\mathbf{x})$.`,
  keyPoints: ['Il volume è fisso, il conteggio varia.', md`La larghezza $h$ governa il compromesso tra bias e varianza.`],
  glossary: [{ term: 'funzione finestra', en: 'window function', def: 'Vale 1 dentro l\'ipercubo e 0 fuori.' }],
  formulas: [
    {
      id: 'f1',
      name: 'Stima a finestre di Parzen',
      nameEn: 'Parzen windows estimate',
      latex: md`\hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \frac{1}{h^{n}} \gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)`,
      explain: 'Somma di finestre.',
      symbols: [],
      importance: 3,
      blanks: [],
      source: [{ doc: 'ch2', page: 53 }],
    },
    {
      id: 'f2',
      name: 'Volume della finestra',
      nameEn: 'Window volume',
      latex: md`V = h^{n}`,
      explain: 'Ipercubo di lato h.',
      symbols: [],
      importance: 1,
      blanks: [],
      source: [{ doc: 'part1', page: 36 }],
    },
  ],
  derivations: [
    {
      id: 'der1',
      title: 'La stima integra a 1',
      goal: 'Mostrare che è una densità.',
      steps: [{ latex: md`\int \hat{p} = 1`, why: 'Ogni finestra integra a 1.' }],
      conclusion: 'È una densità.',
      source: [{ doc: 'part1', page: 37 }],
    },
  ],
  figures: [],
  flashcards: [],
  quiz: [],
  exam: [
    {
      id: 'e1',
      q: 'Che effetto ha la larghezza della finestra sulla stima?',
      qEn: 'What is the effect of the window width on the estimate?',
      prof: 'Melgani',
      fromBank: true,
      bankText: 'Effect of h on Parzen estimation',
      answer: 'Con h piccolo picchi, con h grande pianura.',
      checklist: ['bias', 'varianza'],
      followUps: [],
    },
  ],
  exercises: [],
  widgets: [
    { id: 'w-somma-kernel', title: 'Somma dei kernel', concepts: ['c01', 'c02'] },
    { id: 'w-effetto-h', title: 'Effetto di h', concepts: ['c03'] },
  ],
  connections: [{ to: 'm08-non-parametrica-knn', why: 'Stesso schema: volume fisso contro conteggio fisso.' }],
  coverage: {},
})

/** La "nota illustrativa" compilata: titoli con id (rehype-slug) e un componente del foglio. */
function FakeTheory({ components }: MDXProps) {
  const Formula = components?.Formula as ComponentType<{ id: string }>
  return (
    <>
      <h2 id="stima-a-finestre">Stima a finestre</h2>
      <p>Il volume è fisso.</p>
      <Formula id="f1" />
      <h3 id="scelta-di-h">Scelta di h</h3>
      <p>Il compromesso.</p>
      <h2 id="kernel-gaussiano">Kernel gaussiano</h2>
      <p>Una finestra liscia.</p>
    </>
  )
}

vi.mock('../content/registry', () => ({
  hasModule: (id: string) => id === 'm09-parzen-windows',
  loadModuleData: vi.fn(async (id: string) => {
    if (id === 'm09-parzen-windows') return data
    throw new Error(`Modulo non trovato: ${id}`)
  }),
  loadModuleContent: vi.fn(async () => FakeTheory),
  loadAllModuleData: vi.fn(async () => [data]),
}))

// IntersectionObserver finto: il test decide quando un titolo entra nella fascia di lettura
class FakeObserver {
  static all: FakeObserver[] = []
  targets: Element[] = []
  callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    FakeObserver.all.push(this)
  }
  observe(el: Element) {
    this.targets.push(el)
  }
  unobserve() {}
  disconnect() {
    this.targets = []
  }
  takeRecords() {
    return []
  }
}

function enter(el: Element) {
  const observer = FakeObserver.all.find((o) => o.targets.includes(el))
  if (!observer) throw new Error(`nessun observer su #${el.id}`)
  const entry = { target: el, isIntersecting: true, boundingClientRect: { top: 40 }, rootBounds: { top: 0, bottom: 300 } } as unknown as IntersectionObserverEntry
  act(() => observer.callback([entry], observer as unknown as IntersectionObserver))
}

function openSheet(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

const tabs = () => screen.getByRole('navigation', { name: 'Schede del foglio' })
// le schede sono chunk lazy e i widget si cercano nel registry: in jsdom il primo caricamento supera il secondo
const SLOW = { timeout: 20_000 }
vi.setConfig({ testTimeout: 60_000 })

beforeEach(() => {
  useProgress.getState().reset()
  localStorage.clear()
  FakeObserver.all = []
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('testata del foglio', () => {
  it('mostra numero del foglio, titoli italiano e inglese, capitolo e fonti', async () => {
    openSheet(`/m/${ID}`)
    expect(await screen.findByRole('heading', { level: 1, name: 'Finestre di Parzen' }, SLOW)).toBeInTheDocument()
    const header = screen.getByRole('heading', { level: 1 }).closest('header')!
    expect(header).toHaveTextContent(/Foglio\s*09/)
    expect(within(header).getByText('Parzen windows')).toHaveAttribute('lang', 'en')
    expect(within(header).getByText(/Cap\. 2 · Statistical Estimation Theory/)).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: /Cap\. 2 · slide 51–53/ })).toHaveAttribute('href', '/fonti/ch2/51')
    expect(within(header).getByRole('link', { name: /Note 1 · pp\. 36–37/ })).toHaveAttribute('href', '/fonti/part1/36')
    await waitFor(() => expect(document.title).toBe('Foglio 09 · Finestre di Parzen · ML Study Hub'), SLOW)
  })

  it('lo stato del rilievo si cambia dalla testata e va nei progressi', async () => {
    const user = userEvent.setup()
    openSheet(`/m/${ID}`)
    const select = await screen.findByRole('combobox', { name: 'Stato del rilievo' }, SLOW)
    expect(select).toHaveValue('da-iniziare')
    await user.selectOptions(select, 'Rilevato')
    expect(useProgress.getState().modules[ID]?.status).toBe('completato')
  })
})

describe('schede', () => {
  it('sono nove collegamenti con URL propri; la scheda aperta ha aria-current', async () => {
    openSheet(`/m/${ID}`)
    const links = within(await screen.findByRole('navigation', { name: 'Schede del foglio' }, SLOW)).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      ['riassunto', 'teoria', 'formule', 'laboratorio', 'esercizi', 'flashcard', 'quiz', 'orale', 'fonti'].map((t) => `/m/${ID}/${t}`),
    )
    // senza scheda nell'URL si apre il riassunto
    expect(links[0]).toHaveAttribute('aria-current', 'page')
    expect(links.filter((a) => a.hasAttribute('aria-current'))).toHaveLength(1)
  })

  it('un clic su una scheda cambia URL e contenuto', async () => {
    const user = userEvent.setup()
    const router = openSheet(`/m/${ID}/riassunto`)
    await screen.findByRole('navigation', { name: 'Schede del foglio' }, SLOW)
    await user.click(within(tabs()).getByRole('link', { name: /Formule/ }))
    expect(router.state.location.pathname).toBe(`/m/${ID}/formule`)
    await waitFor(() => expect(within(tabs()).getByRole('link', { name: /Formule/ })).toHaveAttribute('aria-current', 'page'), SLOW)
    expect(await screen.findByRole('heading', { name: 'Stima a finestre di Parzen' }, SLOW)).toBeInTheDocument()
  })
})

describe('Riassunto', () => {
  it('ha riassunto, punti chiave, lessico con l\'inglese, collegamenti e il margine con fonti e domande d\'orale', async () => {
    openSheet(`/m/${ID}`)
    expect(await screen.findByText(/la somma delle finestre è la stima/, {}, SLOW)).toBeInTheDocument()
    expect(screen.getByText('Il volume è fisso, il conteggio varia.')).toBeInTheDocument()
    const lexicon = screen.getByRole('table', { name: /Lessico/ })
    expect(within(lexicon).getByText('window function')).toHaveAttribute('lang', 'en')
    const main = screen.getByRole('main')
    expect(within(main).getAllByRole('link', { name: /foglio 08/i }).map((a) => a.getAttribute('href'))).toContain('/m/m08-non-parametrica-knn')
    expect(within(main).getByText('Stesso schema: volume fisso contro conteggio fisso.')).toBeInTheDocument()
    const margin = screen.getByRole('complementary', { name: 'Apparato a margine' })
    expect(within(margin).getByText('What is the effect of the window width on the estimate?')).toHaveAttribute('lang', 'en')
    expect(within(margin).getByRole('link', { name: /orale/i })).toHaveAttribute('href', `/m/${ID}/orale`)
  })
})

describe('Formule', () => {
  it('elenca tutte le formule e le dimostrazioni, con filtro e modalità ripasso', async () => {
    const user = userEvent.setup()
    openSheet(`/m/${ID}/formule`)
    expect(await screen.findByRole('heading', { name: 'Stima a finestre di Parzen' }, SLOW)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Volume della finestra' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'La stima integra a 1' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Da sapere a memoria/ }))
    expect(screen.queryByRole('heading', { name: 'Volume della finestra' })).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('1 formula su 2')

    await user.click(screen.getByRole('button', { name: /Copri tutte/ }))
    expect(screen.getByText(/Formula coperta/)).toBeInTheDocument()
  })
})

describe('Laboratorio', () => {
  it('mostra tutti i widget del modulo, anche quelli in costruzione, e li filtra per concetto', async () => {
    const user = userEvent.setup()
    openSheet(`/m/${ID}/laboratorio`)
    // i due widget non esistono ancora su disco: schede "in costruzione" con titolo e concetti
    expect(await screen.findByRole('heading', { name: 'Somma dei kernel' }, SLOW)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Effetto di h' }, SLOW)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /A tutta pagina/ })[0]).toHaveAttribute('href', '/lab/w-somma-kernel')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Concetto' }), 'c03')
    expect(screen.queryByRole('heading', { name: 'Somma dei kernel' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Effetto di h' })).toBeInTheDocument()
    expect(screen.getByText('1 widget su 2', { selector: '[role=status]' })).toBeInTheDocument()
  })
})

describe('Fonti', () => {
  it('mostra una miniatura per ogni pagina degli intervalli, che apre il viewer', async () => {
    openSheet(`/m/${ID}/fonti`)
    const main = await screen.findByRole('main')
    const first = await within(main).findByRole('link', { name: /Cap\. 2, slide 51/ }, SLOW)
    expect(first).toHaveAttribute('href', '/fonti/ch2/51')
    expect(first.querySelector('img')).toHaveAttribute('src', '/sources/ch2/p051.webp')
    const thumbs = within(main).getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/fonti/') && a.querySelector('img'))
    expect(thumbs).toHaveLength(5)
  })
})

describe('Teoria', () => {
  it('rende la nota illustrativa con i componenti del foglio e un indice che segue la lettura', async () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver)
    openSheet(`/m/${ID}/teoria`)
    const h3 = await screen.findByRole('heading', { level: 3, name: 'Scelta di h' }, SLOW)
    // <Formula id="f1" /> è arrivato dal contesto del modulo
    expect(screen.getByRole('heading', { name: 'Stima a finestre di Parzen' })).toBeInTheDocument()

    const toc = screen.getByRole('navigation', { name: 'Indice del foglio' })
    const entries = within(toc).getAllByRole('link')
    expect(entries.map((a) => a.getAttribute('href'))).toEqual(['#stima-a-finestre', '#scelta-di-h', '#kernel-gaussiano'])

    enter(h3)
    expect(within(toc).getByRole('link', { name: /Scelta di h/ })).toHaveAttribute('aria-current', 'location')
    const progress = useProgress.getState().modules[ID]
    expect(progress?.lastSection).toBe('scelta-di-h')
    expect(progress?.status).toBe('in-corso')
  })
})

describe('foglio senza contenuti', () => {
  it('mostra la testata dal manifest, dice che il foglio è in preparazione e offre le pagine delle fonti', async () => {
    openSheet('/m/m10-em-dati-incompleti/formule')
    expect(await screen.findByRole('heading', { level: 1, name: 'Stima con dati incompleti e algoritmo EM' }, SLOW)).toBeInTheDocument()
    expect(screen.getByText(/in preparazione/)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Schede del foglio' })).toBeNull()
    expect(within(screen.getByRole('main')).getByRole('link', { name: /Cap\. 2, slide 67/ })).toHaveAttribute('href', '/fonti/ch2/67')
  })
})
