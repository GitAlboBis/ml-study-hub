import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineModule, md } from '../content/types'
import type { CourseId, Formula, ModuleData } from '../content/types'
import Formulario from './Formulario'

// ---------------------------------------------------------------------------------------------
// Tre fogli finti in due regioni: la pagina deve funzionare con qualunque insieme di fogli pronti
// ---------------------------------------------------------------------------------------------

const registry = vi.hoisted(() => ({ modules: [] as { id: string }[], broken: [] as string[] }))

vi.mock('../content/registry', () => ({
  hasModule: (id: string) => registry.modules.some((m) => m.id === id) || registry.broken.includes(id),
  loadModuleData: vi.fn(async (id: string) => {
    const found = registry.modules.find((m) => m.id === id)
    if (!found || registry.broken.includes(id)) throw new Error(`non caricato: ${id}`)
    return found
  }),
  loadModuleContent: vi.fn(async () => {
    throw new Error('non serve in questi test')
  }),
  loadAllModuleData: vi.fn(async () => registry.modules),
}))

const formula = (over: Partial<Formula> & Pick<Formula, 'id' | 'name' | 'nameEn' | 'latex' | 'importance'>): Formula => ({
  explain: 'Spiegazione.',
  symbols: [],
  blanks: [],
  source: [{ doc: 'ch2', page: 53 }],
  ...over,
})

const sheet = (id: string, course: CourseId, title: string, formulas: Formula[]): ModuleData =>
  defineModule({
    id,
    title,
    titleEn: `${title} (EN)`,
    course,
    chapter: '',
    order: 0,
    sources: [],
    prerequisites: [],
    estimatedMinutes: 0,
    summary: '',
    keyPoints: [],
    glossary: [],
    formulas,
    derivations: [],
    figures: [],
    flashcards: [],
    quiz: [],
    exam: [],
    exercises: [],
    widgets: [],
    connections: [],
    coverage: {},
  })

const parzen = sheet('m09-parzen-windows', 'melgani', 'Finestre di Parzen', [
  formula({
    id: 'f1',
    name: 'Stima a finestre di Parzen',
    nameEn: 'Parzen windows estimate',
    latex: md`\hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \frac{1}{h^{n}} \gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)`,
    importance: 3,
    symbols: [{ s: md`\gamma(\cdot)`, meaning: 'funzione finestra' }],
    whenToUse: 'Quando la forma della densità è ignota.',
    pitfalls: 'Dimenticare il fattore di volume.',
  }),
  formula({ id: 'f2', name: 'Volume della finestra', nameEn: 'Window volume', latex: md`V = h^{n}`, importance: 1, source: [{ doc: 'part1', page: 36 }] }),
])
const ml = sheet('m05-max-likelihood', 'melgani', 'Massima verosimiglianza', [
  formula({ id: 'f3', name: 'Stima ML della varianza', nameEn: 'ML variance estimate', latex: md`\hat{\sigma}^2 = \frac{1}{N}\sum_{k=1}^{N} (x_k - \hat{\mu})^2`, importance: 3 }),
])
const svm = sheet('p08-svm-hard-margin', 'passerini', 'SVM a margine rigido', [
  formula({ id: 'f4', name: 'Margine geometrico', nameEn: 'Geometric margin', latex: md`\rho = \frac{2}{\Vert \mathbf{w} \Vert}`, importance: 2 }),
])

function open(path = '/formulario') {
  const router = createMemoryRouter(
    [
      { path: '/formulario', element: <Formulario /> },
      { path: '/m/:moduleId/:tab?', element: <p>Foglio aperto</p> },
      { path: '/fonti/:doc/:page', element: <p>Fonte aperta</p> },
      { path: '/', element: <p>Copertina</p> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const main = () => screen.getByRole('main')
const status = () => screen.getByRole('status', { name: 'Risultati' })
const shownNames = () => screen.queryAllByRole('heading', { level: 4 }).filter((h) => !h.closest('[hidden]')).map((h) => h.textContent)

const scrollIntoView = Element.prototype.scrollIntoView

beforeEach(() => {
  registry.modules = [svm, parzen, ml]
  registry.broken = []
  localStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('data-theme')
  Element.prototype.scrollIntoView = scrollIntoView
})

describe('formulario', () => {
  it('raccoglie le formule dei fogli pronti per regione e foglio, con i nomi nelle due lingue', async () => {
    open()
    expect(await screen.findByRole('heading', { level: 1, name: /Formulario/ })).toBeInTheDocument()
    await screen.findByRole('heading', { level: 4, name: 'Stima a finestre di Parzen' })
    expect(screen.getByRole('heading', { level: 2, name: 'Melgani' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Passerini' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /Foglio 09.*Finestre di Parzen/ })).toBeInTheDocument()
    // ordine del manifest: m05 prima di m09, Melgani prima di Passerini
    expect(shownNames()).toEqual(['Stima ML della varianza', 'Stima a finestre di Parzen', 'Volume della finestra', 'Margine geometrico'])
    expect(screen.getByText('Parzen windows estimate')).toHaveAttribute('lang', 'en')
    // una formula in display per riga: la legenda dei simboli si monta solo quando la si apre
    expect(main().querySelectorAll('.katex-display').length).toBe(4)
    expect(status()).toHaveTextContent('4 formule su 4')
    await waitFor(() => expect(document.title).toMatch(/^Formulario/))
  })

  it('ogni formula porta la pagina della fonte e il collegamento alla formula nel suo foglio', async () => {
    open()
    const card = (await screen.findByRole('heading', { level: 4, name: 'Volume della finestra' })).closest('[data-formula]') as HTMLElement
    expect(within(card).getByRole('link', { name: /Note 1.*p\. 36/ })).toHaveAttribute('href', '/fonti/part1/36')
    expect(within(card).getByRole('link', { name: /Nel foglio 09.*Volume della finestra/ })).toHaveAttribute('href', '/m/m09-parzen-windows/formule#formula:f2')
    expect(card.querySelector('[id="formula:m09-parzen-windows:f2"]')).not.toBeNull()
    const f1 = screen.getByRole('heading', { level: 4, name: 'Stima a finestre di Parzen' }).closest('[data-formula]') as HTMLElement
    await userEvent.setup().click(within(f1).getByRole('button', { name: /Spiegazione e simboli/ }))
    expect(within(f1).getByText('Legenda dei simboli')).toBeInTheDocument()
    expect(within(f1).getByText('Quando si usa')).toBeInTheDocument()
    expect(within(f1).getByText('Trappole')).toBeInTheDocument()
  })

  it('i fogli non ancora pronti si vedono come terreno da rilevare, senza errori', async () => {
    open()
    await screen.findByRole('heading', { level: 2, name: 'Melgani' })
    const ricci = screen.getByRole('region', { name: 'Ricci' })
    expect(ricci).toHaveTextContent(/Nessun foglio di Ricci è ancora pronto/)
    expect(ricci).toHaveTextContent('37–50')
    expect(screen.getByRole('region', { name: 'Melgani' })).toHaveTextContent(/Ancora in preparazione: fogli 01–04, 06–08, 10–22/)
  })

  it('filtra per regione, per foglio e per importanza, e dice quante formule restano', async () => {
    const user = userEvent.setup()
    open()
    await screen.findByRole('heading', { level: 4, name: 'Margine geometrico' })

    await user.click(screen.getByRole('radio', { name: /^Passerini/ }))
    expect(screen.getByRole('radio', { name: /^Passerini/ })).toBeChecked()
    expect(shownNames()).toEqual(['Margine geometrico'])
    await waitFor(() => expect(status()).toHaveTextContent('1 formula su 4'))

    await user.click(screen.getByRole('radio', { name: /^Tutte le regioni/ }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Foglio' }), 'm09-parzen-windows')
    expect(shownNames()).toEqual(['Stima a finestre di Parzen', 'Volume della finestra'])

    await user.selectOptions(screen.getByRole('combobox', { name: 'Foglio' }), '')
    await user.click(screen.getByRole('button', { name: /^A memoria/ }))
    expect(shownNames()).toEqual(['Stima ML della varianza', 'Stima a finestre di Parzen'])
    // il conteggio di ogni regione tiene conto dell'importanza scelta
    expect(screen.getByRole('radio', { name: /^Passerini/ })).toHaveAccessibleName(/Passerini.*0/)
  })

  it('cerca per nome in italiano o in inglese e per simbolo', async () => {
    const user = userEvent.setup()
    open()
    const search = await screen.findByRole('searchbox', { name: 'Cerca una formula' })
    await user.type(search, 'margin')
    expect(shownNames()).toEqual(['Margine geometrico'])
    await user.clear(search)
    await user.type(search, 'σ')
    expect(shownNames()).toEqual(['Stima ML della varianza'])
    await user.click(screen.getByRole('button', { name: 'Svuota la ricerca' }))
    expect(search).toHaveValue('')
    expect(search).toHaveFocus()
    expect(shownNames()).toHaveLength(4)
  })

  it('senza risultati lo dice e permette di azzerare i filtri', async () => {
    const user = userEvent.setup()
    open()
    const search = await screen.findByRole('searchbox', { name: 'Cerca una formula' })
    await user.type(search, 'zzz')
    expect(shownNames()).toEqual([])
    expect(screen.getByText(/Nessuna formula risponde a «zzz»/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Ripassa/ })).toBeNull()
    await user.click(within(main()).getAllByRole('button', { name: 'Azzera i filtri' })[0])
    expect(search).toHaveValue('')
    expect(shownNames()).toHaveLength(4)
  })

  it('legge i filtri iniziali dall\'indirizzo', async () => {
    open('/formulario?foglio=p08-svm-hard-margin')
    await screen.findByRole('heading', { level: 4, name: 'Margine geometrico' })
    expect(shownNames()).toEqual(['Margine geometrico'])
    cleanup()
    open('/formulario?q=parzen&importanza=3')
    await screen.findByRole('heading', { level: 4, name: 'Stima a finestre di Parzen' })
    expect(shownNames()).toEqual(['Stima a finestre di Parzen'])
    expect(screen.getByRole('searchbox', { name: 'Cerca una formula' })).toHaveValue('parzen')
  })

  it('porta alla formula indicata nell\'ancora dell\'indirizzo', async () => {
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    open('/formulario#formula:m09-parzen-windows:f2')
    await screen.findByRole('heading', { level: 4, name: 'Volume della finestra' })
    await waitFor(() => expect(scroll).toHaveBeenCalled())
    expect(scroll.mock.contexts.at(-1)).toHaveAttribute('id', 'formula:m09-parzen-windows:f2')
  })
})

describe('modalità ripasso', () => {
  it('copre la formula: Spazio la scopre e poi passa alla successiva, le frecce scorrono, Esc torna all\'elenco', async () => {
    const user = userEvent.setup()
    open()
    await screen.findByRole('heading', { level: 4, name: 'Margine geometrico' })
    await user.click(screen.getByRole('button', { name: /^Ripassa queste 4/ }))

    const review = screen.getByRole('region', { name: 'Ripasso delle formule' })
    expect(review).toHaveFocus()
    expect(within(review).getByText('Formula 1 di 4')).toBeInTheDocument()
    expect(within(review).getByRole('heading', { name: 'Stima ML della varianza' })).toBeInTheDocument()
    expect(within(review).getByText('ML variance estimate')).toHaveAttribute('lang', 'en')
    // coperta: la formula non c'è ancora
    expect(review.querySelector('.katex-display')).toBeNull()

    await user.keyboard(' ')
    expect(review.querySelector('.katex-display')).not.toBeNull()
    expect(within(review).getByText(/Scoperte 1/)).toBeInTheDocument()

    await user.keyboard(' ')
    expect(within(review).getByText('Formula 2 di 4')).toBeInTheDocument()
    expect(review.querySelector('.katex-display')).toBeNull()

    await user.keyboard('{ArrowRight}')
    expect(within(review).getByText('Formula 3 di 4')).toBeInTheDocument()
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(within(review).getByText('Formula 1 di 4')).toBeInTheDocument()
    // la prima era già stata scoperta
    expect(review.querySelector('.katex-display')).not.toBeNull()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: 'Ripasso delle formule' })).toBeNull()
    expect(screen.getByRole('button', { name: /^Ripassa queste 4/ })).toHaveFocus()
  })

  it('ripassa solo le formule filtrate; il pulsante scopre anche con il mouse e il giro finisce con un riepilogo', async () => {
    const user = userEvent.setup()
    open()
    await screen.findByRole('heading', { level: 4, name: 'Margine geometrico' })
    await user.click(screen.getByRole('button', { name: /^A memoria/ }))
    await user.click(screen.getByRole('button', { name: /^Ripassa queste 2/ }))
    const review = screen.getByRole('region', { name: 'Ripasso delle formule' })
    expect(within(review).getByText('Formula 1 di 2')).toBeInTheDocument()

    await user.click(within(review).getByRole('button', { name: 'Scopri la formula' }))
    expect(review.querySelector('.katex-display')).not.toBeNull()
    expect(review).toHaveFocus()
    await user.click(within(review).getByRole('button', { name: 'Successiva' }))
    expect(within(review).getByText('Formula 2 di 2')).toBeInTheDocument()
    await user.keyboard('  ')
    expect(within(review).getByText(/Giro finito/)).toBeInTheDocument()
    expect(within(review).getByRole('button', { name: 'Ricomincia il giro' })).toHaveFocus()
    await user.click(within(review).getByRole('button', { name: 'Ricomincia il giro' }))
    expect(within(review).getByText('Formula 1 di 2')).toBeInTheDocument()
    expect(review.querySelector('.katex-display')).toBeNull()
  })

  it('Mescola riparte dalla prima; Spazio su un pulsante fa il lavoro del pulsante', async () => {
    const user = userEvent.setup()
    open()
    await screen.findByRole('heading', { level: 4, name: 'Margine geometrico' })
    await user.click(screen.getByRole('button', { name: /^Ripassa queste 4/ }))
    const review = screen.getByRole('region', { name: 'Ripasso delle formule' })
    await user.click(within(review).getByRole('button', { name: 'Mescola' }))
    expect(within(review).getByRole('button', { name: 'Mescola' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(review).getByText('Formula 1 di 4')).toBeInTheDocument()
    // con il fuoco su un pulsante Spazio lo preme, e basta: non scopre e non avanza due volte
    within(review).getByRole('button', { name: 'Successiva' }).focus()
    await user.keyboard(' ')
    expect(within(review).getByText('Formula 2 di 4')).toBeInTheDocument()
  })
})

describe('stati della pagina', () => {
  it('senza fogli pronti con formule spiega che il formulario si riempie con i fogli', async () => {
    registry.modules = []
    open()
    expect(await screen.findByText(/nessun foglio pronto ha ancora formule/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Ripassa/ })).toBeNull()
    expect(screen.getByRole('region', { name: 'Ricci' })).toHaveTextContent('37–50')
  })

  it('un foglio che non si carica non ferma gli altri e si può riprovare', async () => {
    registry.broken = ['m05-max-likelihood']
    const user = userEvent.setup()
    open()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Foglio 05.*non si è caricato/)
    expect(shownNames()).toEqual(['Stima a finestre di Parzen', 'Volume della finestra', 'Margine geometrico'])
    registry.broken = []
    await user.click(within(alert).getByRole('button', { name: 'Riprova' }))
    await screen.findByRole('heading', { level: 4, name: 'Stima ML della varianza' })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('«Azzera i filtri» sparisce premendolo: il fuoco torna nel campo di ricerca', async () => {
    const user = userEvent.setup()
    open()
    const search = await screen.findByRole('searchbox', { name: 'Cerca una formula' })
    await user.click(screen.getByRole('radio', { name: /^Melgani/ }))
    await user.click(screen.getByRole('button', { name: 'Azzera i filtri' }))
    expect(search).toHaveFocus()
  })

  it('il conteggio si annuncia una volta, a scrittura ferma, non una per lettera', async () => {
    const user = userEvent.setup()
    open()
    const search = await screen.findByRole('searchbox', { name: 'Cerca una formula' })
    const live = status()
    const seen: string[] = []
    const observer = new MutationObserver(() => {
      const text = live.textContent ?? ''
      if (seen.at(-1) !== text) seen.push(text)
    })
    observer.observe(live, { childList: true, subtree: true, characterData: true })
    await user.type(search, 'margine')
    await waitFor(() => expect(live).toHaveTextContent('1 formula su 4'))
    observer.disconnect()
    expect(seen).toEqual(['1 formula su 4'])
  })

  it('il filtro per regione è quello di tutte le pagine; il ripasso dice che cosa ripassa', async () => {
    open()
    await screen.findByRole('heading', { level: 4, name: 'Margine geometrico' })
    const group = screen.getByRole('radiogroup', { name: 'Regione' })
    expect(within(group).getByRole('radio', { name: 'Tutte le regioni 4' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Ripassa queste 4 formule' })).toBeInTheDocument()
  })

  it('è un prontuario: righe compatte, spiegazione e simboli a scomparsa, indice dei fogli già a larghezza media', async () => {
    const user = userEvent.setup()
    open()
    const f1 = (await screen.findByRole('heading', { level: 4, name: 'Stima a finestre di Parzen' })).closest('[data-formula]') as HTMLElement
    expect(within(f1).queryByText('Legenda dei simboli')).toBeNull()
    await user.click(within(f1).getByRole('button', { name: /Spiegazione e simboli/ }))
    expect(within(f1).getByText('Legenda dei simboli')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Indice del formulario' })).toHaveClass('@4xl:block')
    // la colonna delle formule arriva al bordo dei filtri
    expect(f1.closest('.grid.content-start')).not.toHaveClass('max-w-[64rem]')
  })

  it('stampa: il pulsante apre la stampa, e la pagina si stampa col tema chiaro', async () => {
    const user = userEvent.setup()
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    open()
    await screen.findByRole('heading', { level: 4, name: 'Margine geometrico' })
    await user.click(screen.getByRole('button', { name: 'Stampa' }))
    expect(print).toHaveBeenCalled()
    expect(document.querySelector('style[data-print-sheet]')?.textContent).toMatch(/@media print/)
    document.documentElement.dataset.theme = 'dark'
    act(() => {
      window.dispatchEvent(new Event('beforeprint'))
    })
    expect(document.documentElement.dataset.theme).toBe('light')
    act(() => {
      window.dispatchEvent(new Event('afterprint'))
    })
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
