import '@testing-library/jest-dom/vitest'
import { evaluate } from '@mdx-js/mdx'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { MemoryRouter } from 'react-router'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineModule, md } from '../../content/types'
import type { ModuleData } from '../../content/types'
import { progressKey, useProgress } from '../../store/progress'
import { useAnimationFrame } from '../../widgets/kit/useAnimationFrame'
import { loadWidget } from '../../widgets/registry'
import type { WidgetMeta } from '../../widgets/types'
import { Callout } from './Callout'
import { Check } from './Check'
import { Col, Columns } from './Columns'
import { Definition } from './Definition'
import { Derivation } from './Derivation'
import { Example, Step } from './Example'
import { Figure } from './Figure'
import { Formula } from './Formula'
import { KeyIdea } from './KeyIdea'
import { mdxComponents } from './mdxComponents'
import { ModLink } from './ModLink'
import { ModuleContext, targetId, useModule } from './ModuleContext'
import { Proof } from './Proof'
import { Reveal } from './Reveal'
import { SourceRef } from './SourceRef'
import { Term } from './Term'
import { Widget } from './Widget'

// Il registry resta quello vero: loadWidget è solo avvolto in una spia, così un test può fargli fallire
// un caricamento (chunk che non arriva) o restituire un widget che si rompe, cose che su disco non esistono.
vi.mock('../../widgets/registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../widgets/registry')>()
  return { ...actual, loadWidget: vi.fn(actual.loadWidget) }
})

// ---------------------------------------------------------------------------------------------
// Attrezzi di prova
// ---------------------------------------------------------------------------------------------

const MODULE_ID = 'm09-parzen-windows'

const data: ModuleData = defineModule({
  id: MODULE_ID,
  title: 'Finestre di Parzen',
  titleEn: 'Parzen windows',
  course: 'melgani',
  chapter: 'Cap. 2 · Statistical Estimation Theory',
  order: 9,
  sources: [{ doc: 'ch2', pages: [50, 60] }],
  prerequisites: [],
  estimatedMinutes: 40,
  summary: 'Riassunto',
  keyPoints: [],
  glossary: [{ term: 'funzione finestra', en: 'Window function', def: md`Vale 1 dentro l'ipercubo di lato $h$ e 0 fuori.` }],
  formulas: [
    {
      id: 'f1',
      name: 'Stima a finestre di Parzen',
      nameEn: 'Parzen windows estimate',
      latex: md`\hat{p}(\mathbf{x}) = \frac{1}{N} \sum_{k=1}^{N} \frac{1}{h^{n}} \, \gamma\!\left( \frac{\mathbf{x} - \mathbf{x}_k}{h} \right)`,
      explain: md`Ogni campione porta una finestra di volume $h^n$.`,
      symbols: [
        { s: md`\gamma(\cdot)`, meaning: 'funzione finestra (*window function*)' },
        { s: md`h`, meaning: 'larghezza della finestra' },
      ],
      whenToUse: 'Quando la forma della densità è ignota.',
      pitfalls: md`Dimenticare il fattore $1/h^n$.`,
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
      source: [{ doc: 'part1', page: 38 }],
    },
  ],
  derivations: [
    {
      id: 'der01',
      title: 'La stima integra a 1',
      goal: md`Mostrare che $\int \hat{p}(\mathbf{x})\,d\mathbf{x} = 1$.`,
      assumptions: 'La finestra integra a 1.',
      steps: [
        { latex: md`\int \hat{p}(\mathbf{x})\,d\mathbf{x} = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{h^n} \int \gamma\, d\mathbf{x}`, why: 'Linearità: integrale e somma si scambiano.' },
        { latex: md`\mathbf{u} = \frac{\mathbf{x}-\mathbf{x}_k}{h}`, why: 'Cambio di variabile in n dimensioni.' },
        { latex: md`\frac{1}{N} \cdot N = 1`, why: 'Ogni finestra integra a 1 per ipotesi.' },
      ],
      conclusion: 'La stima è una densità per ogni h positivo.',
      source: [{ doc: 'part1', page: 38 }],
    },
  ],
  figures: [
    {
      id: 'fig01',
      file: 'figures/m09-parzen-windows/fig01.webp',
      caption: md`Effetto di $h$ sulla stima.`,
      alt: 'Tre stime di densità con h piccolo, medio e grande',
      source: { doc: 'ch2', page: 55 },
    },
  ],
  flashcards: [],
  quiz: [
    { id: 'q-mcq', type: 'mcq', q: 'Quanto vale il volume della finestra?', options: [md`$h^n$`, md`$n h$`, md`$h/n$`], answer: 0, explanation: 'Un ipercubo di lato h ha volume h alla n.', difficulty: 1, concepts: ['c01'] },
    { id: 'q-multi', type: 'multi', q: 'Quali sono kernel validi?', options: ['rettangolare', 'gaussiano', 'una funzione negativa'], answers: [0, 1], explanation: 'Un kernel è non negativo e integra a 1.', difficulty: 2, concepts: ['c01'] },
    { id: 'q-tf', type: 'tf', q: 'Con h che tende a 0 la stima diventa una somma di impulsi.', answer: true, explanation: 'Ogni finestra si stringe attorno al suo campione.', difficulty: 1, concepts: ['c02'] },
    { id: 'q-num', type: 'numeric', q: 'Quanto vale la stima in 2?', answer: 0.3333, tolerance: 0.01, unit: 'm⁻¹', explanation: 'Cadono nella finestra due campioni.', difficulty: 2, concepts: ['c02'] },
  ],
  exam: [],
  exercises: [],
  widgets: [{ id: 'w-futuro', title: 'Somma dei kernel', concepts: ['c01', 'c02'] }],
  connections: [],
  coverage: {},
})

/** I componenti di contenuto vivono dentro il contesto del modulo e dentro un router (SourceRef e ModLink sono link). */
function Sheet({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <ModuleContext value={data}>{children}</ModuleContext>
    </MemoryRouter>
  )
}
const renderInSheet = (ui: ReactNode) => render(<Sheet>{ui}</Sheet>)

beforeEach(() => useProgress.getState().reset())
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** React scrive in console gli errori di render anche quando qualcuno li prende: nei test che li provocano si tace. */
const silenceConsoleError = () => vi.spyOn(console, 'error').mockImplementation(() => {})

// ---------------------------------------------------------------------------------------------
// Contesto del modulo
// ---------------------------------------------------------------------------------------------

describe('ModuleContext', () => {
  it('useModule fuori dal contesto spiega come rimediare', () => {
    silenceConsoleError()
    const Probe = () => <p>{useModule().title}</p>
    expect(() => render(<Probe />)).toThrow(/ModuleContext/)
  })

  it('targetId produce la stessa stringa delle destinazioni di copertura', () => {
    expect(targetId('formula', 'f1')).toBe('formula:f1')
  })
})

// ---------------------------------------------------------------------------------------------
// Formula
// ---------------------------------------------------------------------------------------------

describe('<Formula>', () => {
  it('mostra nome italiano, nome inglese e la formula resa con KaTeX', () => {
    const { container } = renderInSheet(<Formula id="f1" />)
    expect(screen.getByRole('heading', { name: 'Stima a finestre di Parzen' })).toBeInTheDocument()
    const en = screen.getByText('Parzen windows estimate')
    expect(en).toHaveAttribute('lang', 'en')
    expect(container.querySelector('.katex-display')).not.toBeNull()
  })

  it('porta legenda dei simboli, quando si usa, trappole e pagina della fonte', () => {
    renderInSheet(<Formula id="f1" />)
    expect(screen.getByText('Legenda dei simboli')).toBeInTheDocument()
    expect(screen.getByText('larghezza della finestra')).toBeInTheDocument()
    expect(screen.getByText('Quando la forma della densità è ignota.')).toBeInTheDocument()
    expect(screen.getByText('Trappole')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cap\. 2.*slide 53/ })).toHaveAttribute('href', '/fonti/ch2/53')
  })

  it('segnala con lo spillo le formule da sapere a memoria, e solo quelle', () => {
    const { unmount } = renderInSheet(<Formula id="f1" />)
    expect(screen.getByText('Da sapere a memoria')).toBeInTheDocument()
    unmount()
    renderInSheet(<Formula id="f2" />)
    expect(screen.queryByText('Da sapere a memoria')).toBeNull()
  })

  it('"Nascondi per ripasso" toglie formula e legenda, e il pulsante le riporta', async () => {
    const user = userEvent.setup()
    const { container } = renderInSheet(<Formula id="f1" />)
    const toggle = screen.getByRole('button', { name: 'Nascondi per ripasso' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('.katex-display')).toBeNull()
    expect(screen.queryByText('larghezza della finestra')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Stima a finestre di Parzen' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mostra la formula' }))
    expect(container.querySelector('.katex-display')).not.toBeNull()
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('lo spillo appunta la formula tra i segnalibri dei progressi', async () => {
    const user = userEvent.setup()
    renderInSheet(<Formula id="f1" />)
    const pin = screen.getByRole('button', { name: "Appunta sull'indice" })
    await user.click(pin)
    expect(useProgress.getState().bookmarks).toEqual([`formula:${MODULE_ID}:f1`])
    expect(pin).toHaveAttribute('aria-pressed', 'true')
  })

  it('è la destinazione "formula:<id>" della copertura', () => {
    const { container } = renderInSheet(<Formula id="f1" />)
    expect(container.querySelector('[id="formula:f1"]')).not.toBeNull()
  })

  it('un id che non esiste nel modulo si vede, invece di sparire', () => {
    renderInSheet(<Formula id="manca" />)
    expect(screen.getByRole('alert')).toHaveTextContent('manca')
  })
})

// ---------------------------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------------------------

describe('<Derivation>', () => {
  it('mostra solo il primo passo e rivela il secondo al clic', async () => {
    const user = userEvent.setup()
    renderInSheet(<Derivation id="der01" />)
    expect(screen.getByRole('heading', { name: 'La stima integra a 1' })).toBeInTheDocument()
    expect(screen.getByText('Linearità: integrale e somma si scambiano.')).toBeInTheDocument()
    expect(screen.queryByText('Cambio di variabile in n dimensioni.')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Passo 1 di 3')

    await user.click(screen.getByRole('button', { name: 'Passo successivo' }))
    expect(screen.getByText('Cambio di variabile in n dimensioni.')).toBeInTheDocument()
    expect(screen.queryByText('Ogni finestra integra a 1 per ipotesi.')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Passo 2 di 3')
  })

  it('la conclusione arriva solo con l\'ultimo passo, poi si può ricominciare', async () => {
    const user = userEvent.setup()
    renderInSheet(<Derivation id="der01" />)
    expect(screen.queryByText('La stima è una densità per ogni h positivo.')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Passo successivo' }))
    await user.click(screen.getByRole('button', { name: 'Passo successivo' }))
    expect(screen.getByText('La stima è una densità per ogni h positivo.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Passo successivo' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Ricomincia' }))
    expect(screen.queryByText('Cambio di variabile in n dimensioni.')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Passo 1 di 3')
  })

  it('"Mostra tutti i passi" li apre in un colpo', async () => {
    const user = userEvent.setup()
    renderInSheet(<Derivation id="der01" />)
    await user.click(screen.getByRole('button', { name: 'Mostra tutti i passi' }))
    expect(screen.getByText('Ogni finestra integra a 1 per ipotesi.')).toBeInTheDocument()
    expect(screen.getByText('La stima è una densità per ogni h positivo.')).toBeInTheDocument()
  })

  it('in modalità "prova tu" il passo che viene dà il perché come indizio e tiene coperta la formula', async () => {
    const user = userEvent.setup()
    const { container } = renderInSheet(<Derivation id="der01" />)
    expect(container.querySelectorAll('.katex-display')).toHaveLength(1)

    const tryIt = screen.getByRole('button', { name: 'Prova tu' })
    await user.click(tryIt)
    expect(tryIt).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Cambio di variabile in n dimensioni.')).toBeInTheDocument()
    expect(container.querySelectorAll('.katex-display')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Confronta il passo 2' }))
    expect(container.querySelectorAll('.katex-display')).toHaveLength(2)
    expect(screen.getByText('Ogni finestra integra a 1 per ipotesi.')).toBeInTheDocument()
    expect(container.querySelectorAll('.katex-display')).toHaveLength(2)
  })

  it('si comanda da tastiera', async () => {
    const user = userEvent.setup()
    renderInSheet(<Derivation id="der01" />)
    screen.getByRole('button', { name: 'Passo successivo' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Cambio di variabile in n dimensioni.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Passo successivo' })).toHaveFocus()
  })
})

// ---------------------------------------------------------------------------------------------
// Example e Step
// ---------------------------------------------------------------------------------------------

describe('<Example> e <Step>', () => {
  const example = (
    <Example id="ex01" title="Tre campioni, finestra rettangolare">
      <p>Campioni in 1, 2 e 4.</p>
      <Step title="Conta i campioni nella finestra">Cadono dentro i campioni 1 e 2.</Step>
      <Step title="Applica la formula">Un terzo.</Step>
    </Example>
  )

  it('rivela i passi uno alla volta; il testo fuori dai passi si vede subito', async () => {
    const user = userEvent.setup()
    renderInSheet(example)
    expect(screen.getByRole('heading', { name: 'Tre campioni, finestra rettangolare' })).toBeInTheDocument()
    expect(screen.getByText('Campioni in 1, 2 e 4.')).toBeInTheDocument()
    expect(screen.getByText('Conta i campioni nella finestra')).toBeInTheDocument()
    expect(screen.queryByText('Applica la formula')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Passo successivo' }))
    expect(screen.getByText('Applica la formula')).toBeInTheDocument()
    expect(screen.getByText('Un terzo.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Passo 2 di 2')
  })

  it('è la destinazione "example:<id>" della copertura', () => {
    const { container } = renderInSheet(example)
    expect(container.querySelector('[id="example:ex01"]')).not.toBeNull()
  })

  it('uno Step fuori da un Example si legge comunque', () => {
    renderInSheet(<Step title="Passo sciolto">Contenuto.</Step>)
    expect(screen.getByText('Passo sciolto')).toBeInTheDocument()
    expect(screen.getByText('Contenuto.')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------------------------
// Check
// ---------------------------------------------------------------------------------------------

describe('<Check>', () => {
  it('segnala la risposta giusta, mostra la spiegazione e la registra nei progressi', async () => {
    const user = userEvent.setup()
    renderInSheet(<Check id="q-mcq" />)
    expect(screen.getByText('Quanto vale il volume della finestra?')).toBeInTheDocument()
    const options = screen.getAllByRole('radio')
    expect(options).toHaveLength(3)

    await user.click(options[0])
    await user.click(screen.getByRole('button', { name: 'Controlla' }))
    expect(screen.getByRole('status')).toHaveTextContent('Risposta corretta')
    expect(screen.getByText('Un ipercubo di lato h ha volume h alla n.')).toBeInTheDocument()
    expect(useProgress.getState().quiz[progressKey(MODULE_ID, 'q-mcq')]).toMatchObject({ attempts: 1, correct: 1, lastCorrect: true })
  })

  it('segnala la risposta sbagliata e lascia riprovare', async () => {
    const user = userEvent.setup()
    renderInSheet(<Check id="q-mcq" />)
    await user.click(screen.getAllByRole('radio')[1])
    await user.click(screen.getByRole('button', { name: 'Controlla' }))
    expect(screen.getByRole('status')).toHaveTextContent('Risposta sbagliata')
    expect(useProgress.getState().quiz[progressKey(MODULE_ID, 'q-mcq')]).toMatchObject({ attempts: 1, correct: 0, lastCorrect: false })

    await user.click(screen.getByRole('button', { name: 'Riprova' }))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(screen.getAllByRole('radio').every((r) => !(r as HTMLInputElement).checked)).toBe(true)
  })

  it('senza una risposta non registra nulla e dice che cosa manca', async () => {
    const user = userEvent.setup()
    renderInSheet(<Check id="q-mcq" />)
    await user.click(screen.getByRole('button', { name: 'Controlla' }))
    expect(screen.getByRole('status')).toHaveTextContent('Scegli una risposta')
    expect(useProgress.getState().quiz).toEqual({})
  })

  it('a risposta multipla è giusta solo la scelta esatta', async () => {
    const user = userEvent.setup()
    renderInSheet(<Check id="q-multi" />)
    const boxes = screen.getAllByRole('checkbox')
    await user.click(boxes[0])
    await user.click(screen.getByRole('button', { name: 'Controlla' }))
    expect(screen.getByRole('status')).toHaveTextContent('Risposta sbagliata')

    await user.click(screen.getByRole('button', { name: 'Riprova' }))
    await user.click(screen.getAllByRole('checkbox')[0])
    await user.click(screen.getAllByRole('checkbox')[1])
    await user.click(screen.getByRole('button', { name: 'Controlla' }))
    expect(screen.getByRole('status')).toHaveTextContent('Risposta corretta')
  })

  it('vero o falso', async () => {
    const user = userEvent.setup()
    renderInSheet(<Check id="q-tf" />)
    await user.click(screen.getByRole('radio', { name: 'Vero' }))
    await user.click(screen.getByRole('button', { name: 'Controlla' }))
    expect(screen.getByRole('status')).toHaveTextContent('Risposta corretta')
  })

  it('numerica: accetta la virgola decimale e la tolleranza', async () => {
    const user = userEvent.setup()
    renderInSheet(<Check id="q-num" />)
    await user.type(screen.getByRole('textbox', { name: /La tua risposta/ }), '0,33')
    await user.click(screen.getByRole('button', { name: 'Controlla' }))
    expect(screen.getByRole('status')).toHaveTextContent('Risposta corretta')
  })

  it('numerica: un testo che non è un numero non conta come tentativo', async () => {
    const user = userEvent.setup()
    renderInSheet(<Check id="q-num" />)
    await user.type(screen.getByRole('textbox', { name: /La tua risposta/ }), 'un terzo')
    await user.click(screen.getByRole('button', { name: 'Controlla' }))
    expect(screen.getByRole('status')).toHaveTextContent('Scrivi un numero')
    expect(useProgress.getState().quiz).toEqual({})
  })
})

// ---------------------------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------------------------

describe('<Widget>', () => {
  it('un widget che non esiste ancora mostra la scheda "in costruzione" con titolo e concetti', async () => {
    renderInSheet(<Widget id="w-futuro" />)
    expect(await screen.findByText(/in costruzione/i)).toBeInTheDocument()
    expect(screen.getByText('Somma dei kernel')).toBeInTheDocument()
    expect(screen.getByText('c01')).toBeInTheDocument()
    expect(screen.getByText('c02')).toBeInTheDocument()
  })

  it('un id sconosciuto anche al modulo mostra comunque la scheda, con l\'id', async () => {
    renderInSheet(<Widget id="inesistente" />)
    expect(await screen.findByText(/in costruzione/i)).toBeInTheDocument()
    expect(screen.getByText('inesistente')).toBeInTheDocument()
  })

  it('carica e monta un widget che esiste', async () => {
    renderInSheet(<Widget id="prova" />)
    expect(await screen.findByText('Widget di prova')).toBeInTheDocument()
    expect(screen.queryByText(/in costruzione/i)).toBeNull()
  })

  it('è la destinazione "widget:<id>" della copertura', () => {
    const { container } = renderInSheet(<Widget id="w-futuro" />)
    expect(container.querySelector('[id="widget:w-futuro"]')).not.toBeNull()
  })

  it('se il chunk non arriva lo dice, e "Riprova" lo ricarica', async () => {
    const user = userEvent.setup()
    vi.mocked(loadWidget).mockRejectedValueOnce(new Error('chunk non caricato'))
    renderInSheet(<Widget id="prova" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('non si è caricato')

    await user.click(screen.getByRole('button', { name: 'Riprova' }))
    expect(await screen.findByText('Widget di prova')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('un widget che si rompe resta dentro la sua cornice: il resto del foglio si legge ancora', async () => {
    silenceConsoleError()
    const user = userEvent.setup()
    let broken = true
    const Fragile = () => {
      if (broken) throw new Error('widget rotto')
      return <p>Widget riparato</p>
    }
    const meta: WidgetMeta = { id: 'fragile', moduleId: MODULE_ID, title: 'Fragile', concepts: [], scenario: 'fonte', scenarioNote: 'finto', size: 'S' }
    vi.mocked(loadWidget).mockResolvedValueOnce({ meta, default: Fragile })
    renderInSheet(
      <>
        <p>Testo del foglio</p>
        <Widget id="fragile" />
      </>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('si è fermato')
    expect(screen.getByText('Testo del foglio')).toBeInTheDocument()

    broken = false
    await user.click(screen.getByRole('button', { name: 'Riprova' }))
    expect(screen.getByText('Widget riparato')).toBeInTheDocument()
  })

  it('aspetta di essere vicino alla finestra prima di caricare il chunk', async () => {
    let notify: (entries: { isIntersecting: boolean }[]) => void = () => {}
    const disconnect = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          notify = callback
        }
        observe() {}
        disconnect = disconnect
      },
    )
    vi.mocked(loadWidget).mockClear()
    renderInSheet(<Widget id="prova" />)
    expect(screen.getByRole('status')).toHaveTextContent('Carico il widget')
    expect(loadWidget).not.toHaveBeenCalled()

    act(() => notify([{ isIntersecting: true }]))
    expect(await screen.findByText('Widget di prova')).toBeInTheDocument()
    expect(disconnect).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------------------------
// Figure
// ---------------------------------------------------------------------------------------------

describe('<Figure>', () => {
  it('mostra l\'immagine lazy con testo alternativo, didascalia e rimando alla pagina', () => {
    renderInSheet(<Figure id="fig01" />)
    const img = screen.getByRole('img', { name: 'Tre stime di densità con h piccolo, medio e grande' })
    expect(img).toHaveAttribute('src', '/figures/m09-parzen-windows/fig01.webp')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(screen.getByText(/Effetto di/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cap\. 2.*slide 55/ })).toHaveAttribute('href', '/fonti/ch2/55')
  })

  it('lo zoom apre un dialogo con la figura e "Chiudi" riporta il fuoco al pulsante', async () => {
    const user = userEvent.setup()
    renderInSheet(<Figure id="fig01" />)
    expect(screen.queryByRole('dialog')).toBeNull()
    const zoom = screen.getByRole('button', { name: 'Ingrandisci la figura' })
    await user.click(zoom)
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', '/figures/m09-parzen-windows/fig01.webp')

    await user.click(within(dialog).getByRole('button', { name: 'Chiudi' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(zoom).toHaveFocus()
  })
})

// ---------------------------------------------------------------------------------------------
// Riquadri
// ---------------------------------------------------------------------------------------------

describe('<Callout>', () => {
  it.each([
    ['intuizione', 'Intuizione'],
    ['attenzione', 'Attenzione'],
    ['esame', 'Da orale'],
    ['suggerimento', 'Suggerimento'],
    ['nota', 'Nota'],
    ['inglese', 'In inglese'],
  ] as const)('kind="%s" porta l\'etichetta "%s"', (kind, label) => {
    render(<Callout kind={kind}>Corpo del riquadro.</Callout>)
    const note = screen.getByRole('note')
    expect(within(note).getByText(label)).toBeInTheDocument()
    expect(within(note).getByText('Corpo del riquadro.')).toBeInTheDocument()
  })

  it('mostra il titolo quando c\'è', () => {
    render(<Callout kind="attenzione" title="Il fattore di scala">Corpo.</Callout>)
    expect(screen.getByText('Il fattore di scala')).toBeInTheDocument()
  })

  it('non disegna bordi laterali colorati', () => {
    render(<Callout kind="attenzione">Corpo.</Callout>)
    expect(screen.getByRole('note').className).not.toMatch(/border-[lrse]-/)
  })

  it('un kind fuori elenco (l\'MDX non è tipizzato) ricade su "nota"', () => {
    render(<Callout kind={'boh' as 'nota'}>Corpo.</Callout>)
    expect(within(screen.getByRole('note')).getByText('Nota')).toBeInTheDocument()
  })
})

describe('<Definition>, <KeyIdea>', () => {
  it('Definition porta il termine, il suo inglese e il corpo', () => {
    render(<Definition term="Funzione finestra" en="window function">Vale 1 dentro l'ipercubo.</Definition>)
    expect(screen.getByText('Funzione finestra').tagName).toBe('DFN')
    expect(screen.getByText('window function')).toHaveAttribute('lang', 'en')
    expect(screen.getByText("Vale 1 dentro l'ipercubo.")).toBeInTheDocument()
  })

  it('KeyIdea mette in evidenza il contenuto con la sua etichetta', () => {
    render(<KeyIdea>Il volume si fissa, il conteggio varia.</KeyIdea>)
    expect(screen.getByText('Idea chiave')).toBeInTheDocument()
    expect(screen.getByText('Il volume si fissa, il conteggio varia.')).toBeInTheDocument()
  })
})

describe('<Reveal> e <Proof>', () => {
  it('Reveal tiene nascosto il contenuto finché non si clicca', async () => {
    const user = userEvent.setup()
    render(<Reveal label="Mostra la risposta">Un terzo.</Reveal>)
    const button = screen.getByRole('button', { name: 'Mostra la risposta' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Un terzo.')).toBeNull()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Un terzo.')).toBeVisible()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Un terzo.')).not.toBeVisible()
  })

  it('Proof è chiusa all\'inizio e si apre sul titolo', async () => {
    const user = userEvent.setup()
    render(<Proof title="MAP minimizza l'errore">Per ogni x si sceglie la classe con posterior massima.</Proof>)
    const button = screen.getByRole('button', { name: /MAP minimizza l'errore/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await user.click(button)
    expect(screen.getByText('Per ogni x si sceglie la classe con posterior massima.')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------------------------
// Apparato: fonti, collegamenti, termini
// ---------------------------------------------------------------------------------------------

describe('<SourceRef>', () => {
  it('le slide si citano per numero di slide e aprono la pagina originale', () => {
    renderInSheet(<SourceRef doc="ch2" page={53} />)
    const link = screen.getByRole('link', { name: /Fonte.*Cap\. 2.*slide 53/ })
    expect(link).toHaveAttribute('href', '/fonti/ch2/53')
  })

  it('le note si citano per pagina', () => {
    renderInSheet(<SourceRef doc="part1" page={38} />)
    expect(screen.getByRole('link', { name: /Note.*p\. 38/ })).toHaveAttribute('href', '/fonti/part1/38')
  })
})

describe('<ModLink>', () => {
  it('porta a un altro modulo', () => {
    renderInSheet(<ModLink to="m08-non-parametrica-knn">K-NN</ModLink>)
    expect(screen.getByRole('link', { name: /K-NN/ })).toHaveAttribute('href', '/m/m08-non-parametrica-knn')
  })

  it('con "#slug" porta alla sezione di teoria di quel modulo', () => {
    renderInSheet(<ModLink to="m08-non-parametrica-knn#scelta-di-k">la scelta di k</ModLink>)
    expect(screen.getByRole('link', { name: /la scelta di k/ })).toHaveAttribute('href', '/m/m08-non-parametrica-knn/teoria#scelta-di-k')
  })

  it('senza modulo resta nel foglio corrente', () => {
    renderInSheet(<ModLink to="#la-stima">la stima</ModLink>)
    expect(screen.getByRole('link', { name: /la stima/ })).toHaveAttribute('href', `/m/${MODULE_ID}/teoria#la-stima`)
  })

  it('dice a quale foglio porta', () => {
    renderInSheet(<ModLink to="m08-non-parametrica-knn">K-NN</ModLink>)
    expect(screen.getByRole('link')).toHaveAccessibleName(/foglio 08/i)
  })
})

describe('<Term>', () => {
  it('al fuoco mostra il termine inglese e la definizione del glossario; Esc la chiude', async () => {
    const user = userEvent.setup()
    renderInSheet(<p>La <Term en="window function">funzione finestra</Term> conta i campioni.</p>)
    expect(screen.queryByRole('tooltip')).toBeNull()

    await user.tab()
    const term = screen.getByRole('button', { name: 'funzione finestra' })
    expect(term).toHaveFocus()
    const tip = screen.getByRole('tooltip')
    expect(within(tip).getByText('window function')).toHaveAttribute('lang', 'en')
    expect(tip).toHaveTextContent("Vale 1 dentro l'ipercubo")
    expect(term).toHaveAttribute('aria-describedby', tip.id)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('al tocco si apre e si richiude', async () => {
    const user = userEvent.setup()
    renderInSheet(<p><Term en="smoothing parameter">parametro di lisciamento</Term></p>)
    const term = screen.getByRole('button', { name: 'parametro di lisciamento' })
    await user.click(term)
    expect(screen.getByRole('tooltip')).toHaveTextContent('smoothing parameter')
    await user.click(term)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})

describe('<Columns> e <Col>', () => {
  it('affianca le colonne, ognuna con il suo titolo', () => {
    render(
      <Columns>
        <Col title="K-NN">Fissa k, lascia variare il volume.</Col>
        <Col title="Parzen">Fissa il volume, lascia variare k.</Col>
      </Columns>,
    )
    expect(screen.getByRole('heading', { name: 'K-NN' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Parzen' })).toBeInTheDocument()
    expect(screen.getByText('Fissa il volume, lascia variare k.')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------------------------
// Mappa per MDX
// ---------------------------------------------------------------------------------------------

describe('mdxComponents', () => {
  it('espone tutti e soli i componenti della whitelist di scripts/validate-module.ts', () => {
    const whitelist = ['Formula', 'Derivation', 'Figure', 'Widget', 'Example', 'Step', 'Callout', 'Definition', 'KeyIdea', 'Reveal', 'Proof', 'Check', 'SourceRef', 'ModLink', 'Term', 'Columns', 'Col']
    expect(Object.keys(mdxComponents).toSorted()).toEqual(whitelist.toSorted())
    for (const name of whitelist) expect(typeof mdxComponents[name as keyof typeof mdxComponents], name).toBe('function')
  })
})

// ---------------------------------------------------------------------------------------------
// Dentro un MDX vero: gli stessi plugin di vite.config.ts, l'esempio di docs/CONTENT_GUIDE.md
// ---------------------------------------------------------------------------------------------

describe('i componenti dentro un MDX compilato', () => {
  const source = md`## La funzione finestra

<Definition term="Funzione finestra" en="window function">
Vale 1 dentro l'ipercubo unitario e 0 fuori: $\gamma(\mathbf{u}) = 1$ se $\vert u_j \vert \le 1/2$.
</Definition>

<Callout kind="intuizione">
Ogni campione porta con sé una piccola collina.
</Callout>

## La stima

<Formula id="f1" />

<Widget id="w-futuro" />

<Derivation id="der01" />

<Example id="ex01" title="Tre campioni, finestra rettangolare">
Campioni in 1, 2 e 4.

<Step title="Conta i campioni nella finestra">
Con $h = 2$ la finestra copre $[1, 3]$.
</Step>
<Step title="Applica la formula">
$$\hat{p}(2) = \frac{1}{3}$$
</Step>
</Example>

<Check id="q-num" />

Il metodo gemello è il <ModLink to="m08-non-parametrica-knn">K-NN</ModLink>, con la sua <Term en="window function">funzione finestra</Term>. <SourceRef doc="ch2" page={52} />
`

  it("si montano dalla mappa mdxComponents, i passi di Example si contano e l'apparato in linea resta nel paragrafo", async () => {
    const user = userEvent.setup()
    const { default: Content } = await evaluate(source, {
      ...jsxRuntime,
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeSlug, [rehypeKatex, { strict: 'ignore' }]],
    })
    const { container } = renderInSheet(<Content components={mdxComponents} />)

    expect(screen.getByRole('heading', { level: 2, name: 'La stima' })).toHaveAttribute('id', 'la-stima')
    expect(screen.getByText('Funzione finestra').tagName).toBe('DFN')
    expect(screen.getByRole('heading', { name: 'Stima a finestre di Parzen' })).toBeInTheDocument()
    expect(await screen.findByText(/in costruzione/i)).toBeInTheDocument()

    // Example riconosce i suoi Step anche passando da MDX: il secondo arriva al clic
    const example = container.querySelector('[id="example:ex01"]') as HTMLElement
    expect(within(example).getByText('Campioni in 1, 2 e 4.')).toBeInTheDocument()
    expect(within(example).getByText('Conta i campioni nella finestra')).toBeInTheDocument()
    expect(within(example).queryByText('Applica la formula')).toBeNull()
    await user.click(within(example).getByRole('button', { name: 'Passo successivo' }))
    expect(within(example).getByText('Applica la formula')).toBeInTheDocument()

    // ModLink, Term e SourceRef sono contenuto in linea: restano dentro il paragrafo che li cita
    const paragraph = screen.getByText(/Il metodo gemello/)
    expect(paragraph.tagName).toBe('P')
    expect(within(paragraph).getByRole('link', { name: /K-NN/ })).toBeInTheDocument()
    expect(within(paragraph).getByRole('button', { name: 'funzione finestra' })).toBeInTheDocument()
    expect(within(paragraph).getByRole('link', { name: /slide 52/ })).toHaveAttribute('href', '/fonti/ch2/52')
  })
})

// ---------------------------------------------------------------------------------------------
// Regressioni della revisione del kit (2026-09-18)
// ---------------------------------------------------------------------------------------------

describe('<Widget>: "Riprova" non perde il fuoco', () => {
  it('se il chunk manca ancora il fuoco va sul nuovo Riprova; quando arriva, sul riquadro del widget', async () => {
    const user = userEvent.setup()
    vi.mocked(loadWidget).mockRejectedValueOnce(new Error('uno')).mockRejectedValueOnce(new Error('due'))
    const { container } = renderInSheet(<Widget id="prova" />)
    await screen.findByRole('alert')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Riprova' })).toHaveFocus()

    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Riprova' })).toHaveFocus())

    await user.keyboard('{Enter}')
    expect(await screen.findByText('Widget di prova')).toBeInTheDocument()
    const holder = container.querySelector('[id="widget:prova"]')
    expect(holder).toHaveFocus()
    expect(document.activeElement).not.toBe(document.body)
  })

  it('un widget che si rompe di nuovo dopo Riprova rimette il fuoco sul Riprova; riparato, sul riquadro', async () => {
    silenceConsoleError()
    const user = userEvent.setup()
    let broken = true
    const Fragile = () => {
      if (broken) throw new Error('widget rotto')
      return <p>Widget riparato</p>
    }
    const meta: WidgetMeta = { id: 'fragile', moduleId: MODULE_ID, title: 'Fragile', concepts: [], scenario: 'fonte', scenarioNote: 'finto', size: 'S' }
    vi.mocked(loadWidget).mockResolvedValueOnce({ meta, default: Fragile })
    const { container } = renderInSheet(<Widget id="fragile" />)
    await screen.findByRole('alert')
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Riprova' })).toHaveFocus()

    broken = false
    await user.keyboard('{Enter}')
    expect(screen.getByText('Widget riparato')).toBeInTheDocument()
    expect(container.querySelector('[id="widget:fragile"]')).toHaveFocus()
  })
})

describe('<Check>: Invio nel campo numerico', () => {
  it('manda la risposta e porta il fuoco sul pulsante, che diventa Riprova, invece di lasciarlo su un campo disabilitato', async () => {
    const user = userEvent.setup()
    renderInSheet(<Check id="q-num" />)
    await user.tab()
    const field = screen.getByRole('textbox', { name: /La tua risposta/ })
    expect(field).toHaveFocus()
    await user.keyboard('0,33{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('Risposta corretta')
    expect(field).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Riprova' })).toHaveFocus()
  })
})

describe('<SourceRef> nel margine delle cornici', () => {
  it('da solo nel margine "Fonte" è un bersaglio alto almeno 40 px (min-h-10); in linea nel testo resta un tassello', () => {
    const { unmount } = renderInSheet(<Formula id="f1" />)
    expect(screen.getByRole('link', { name: /Cap\. 2.*slide 53/ })).toHaveClass('min-h-10')
    unmount()
    const derivation = renderInSheet(<Derivation id="der01" />)
    expect(screen.getByRole('link', { name: /Note 1.*p\. 38/ })).toHaveClass('min-h-10')
    derivation.unmount()
    const figure = renderInSheet(<Figure id="fig01" />)
    expect(screen.getByRole('link', { name: /Cap\. 2.*slide 55/ })).toHaveClass('min-h-10')
    figure.unmount()
    renderInSheet(<SourceRef doc="ch2" page={53} />)
    expect(screen.getByRole('link', { name: /Cap\. 2.*slide 53/ })).not.toHaveClass('min-h-10')
  })
})

describe('<Widget>: animazioni ferme fuori dalla vista', () => {
  it('un widget che anima nel suo corpo si ferma quando il suo riquadro esce dalla vista', async () => {
    const pending = new Map<number, FrameRequestCallback>()
    let nextId = 1
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      pending.set(nextId, cb)
      return nextId++
    })
    vi.stubGlobal('cancelAnimationFrame', (n: number) => void pending.delete(n))
    let now = 1000
    const frame = () =>
      act(() => {
        now += 16
        const due = [...pending.values()]
        pending.clear()
        for (const cb of due) cb(now)
      })
    const observers: { cb: (entries: { target: Element; isIntersecting: boolean }[]) => void; targets: Set<Element> }[] = []
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        targets = new Set<Element>()
        cb: (entries: { target: Element; isIntersecting: boolean }[]) => void
        constructor(cb: (entries: { target: Element; isIntersecting: boolean }[]) => void) {
          this.cb = cb
          observers.push(this)
        }
        observe(el: Element) {
          this.targets.add(el)
        }
        unobserve(el: Element) {
          this.targets.delete(el)
        }
        disconnect() {
          this.targets.clear()
        }
      },
    )
    const show = (el: Element, visible: boolean) =>
      act(() => {
        for (const o of observers) if (o.targets.has(el)) o.cb([{ target: el, isIntersecting: visible }])
      })

    const onFrame = vi.fn()
    const Animated = () => {
      useAnimationFrame(onFrame, true)
      return <p>Widget animato</p>
    }
    const meta: WidgetMeta = { id: 'animato', moduleId: MODULE_ID, title: 'Animato', concepts: [], scenario: 'fonte', scenarioNote: 'finto', size: 'S' }
    vi.mocked(loadWidget).mockResolvedValueOnce({ meta, default: Animated })
    const { container } = renderInSheet(<Widget id="animato" />)
    const holder = container.querySelector('[id="widget:animato"]') as Element
    show(holder, true)
    expect(await screen.findByText('Widget animato')).toBeInTheDocument()
    frame()
    expect(onFrame).toHaveBeenCalledTimes(1)
    show(holder, false)
    frame()
    frame()
    expect(onFrame).toHaveBeenCalledTimes(1)
    show(holder, true)
    frame()
    expect(onFrame).toHaveBeenCalledTimes(2)
  })
})
