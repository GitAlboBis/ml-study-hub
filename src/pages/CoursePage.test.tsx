import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { modulesByCourse } from '../content/manifest'
import { defineModule } from '../content/types'
import type { ModuleData } from '../content/types'
import { useProgress } from '../store/progress'
import CoursePage from './CoursePage'

// ---------------------------------------------------------------------------------------------
// Fogli pronti finti: la pagina deve funzionare con 1 foglio pronto come con 50
// ---------------------------------------------------------------------------------------------

const sheet = (id: string, estimatedMinutes: number): ModuleData =>
  defineModule({
    id,
    title: id,
    titleEn: id,
    course: 'melgani',
    chapter: 'Cap. 2 · Statistical Estimation Theory',
    order: 1,
    sources: [],
    prerequisites: [],
    estimatedMinutes,
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
  })

const READY: Record<string, ModuleData> = {
  'm09-parzen-windows': sheet('m09-parzen-windows', 180),
  'm10-em-dati-incompleti': sheet('m10-em-dati-incompleti', 45),
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

function openCourse(course: string) {
  const router = createMemoryRouter(
    [
      { path: '/corso/:course', Component: CoursePage },
      { path: '/m/:moduleId/:tab?', element: <p>Foglio aperto</p> },
      { path: '/mappa', element: <p>Mappa</p> },
    ],
    { initialEntries: [`/corso/${course}`] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const chapters = () => screen.getByRole('region', { name: 'Capitoli e fogli' })
const rowOf = (id: string) => chapters().querySelector<HTMLElement>(`[data-sheet="${id}"]`)!

beforeEach(() => {
  useProgress.getState().reset()
  localStorage.clear()
})
afterEach(cleanup)

describe('pagina di una regione', () => {
  it('ha la testata della regione e tutti i suoi capitoli con tutti i fogli, in ordine', () => {
    openCourse('melgani')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Melgani/)
    expect(document.title).toMatch(/Regione Melgani/)
    const headings = within(chapters()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    // il capitolo in italiano, con l'inglese delle fonti accanto (regressione: c'era solo l'inglese)
    expect(headings).toEqual([
      'Cap. 1 · Introduzione Introduction',
      'Cap. 2 · Teoria della stima statistica Statistical Estimation Theory',
      'Cap. 3 · Riduzione delle feature Feature Reduction',
      'Cap. 4 · Classificazione supervisionata Supervised Classification',
    ])
    expect(within(chapters()).getByText('Statistical Estimation Theory')).toHaveAttribute('lang', 'en')
    const sheets = within(chapters()).getAllByRole('link', { name: /^Foglio \d\d/ })
    expect(sheets.map((a) => a.getAttribute('href'))).toEqual(modulesByCourse('melgani').map((m) => `/m/${m.id}`))
  })

  it('le fonti nella testata sono bersagli alti almeno 40 px (regressione: 48x17 px)', () => {
    openCourse('ricci')
    const header = screen.getByRole('banner')
    const source = within(header).getByRole('link', { name: /Note DL/ })
    expect(source).toHaveAttribute('href', '/fonti/dl/1')
    expect(source).toHaveClass('min-h-10', 'inline-flex', 'items-center')
  })

  it('ogni foglio ha titolo italiano e inglese e le pagine delle fonti', () => {
    openCourse('melgani')
    const row = rowOf('m09-parzen-windows')
    expect(within(row).getByRole('link', { name: /^Foglio 09 · Finestre di Parzen/ })).toHaveAttribute('href', '/m/m09-parzen-windows')
    expect(within(row).getByText('Parzen windows estimation, width effect, kernels, properties')).toHaveAttribute('lang', 'en')
    expect(within(row).getByRole('link', { name: /Cap\. 2 · slide 51–66/ })).toHaveAttribute('href', '/fonti/ch2/51')
    expect(within(row).getByRole('link', { name: /Note 1 · pp\. 36–45/ })).toHaveAttribute('href', '/fonti/part1/36')
  })

  it('i fogli pronti mostrano stato e minuti stimati, gli altri dicono che sono in preparazione', async () => {
    useProgress.getState().setModuleStatus('m09-parzen-windows', 'in-corso')
    openCourse('melgani')
    const ready = rowOf('m09-parzen-windows')
    expect(within(ready).getByText('Rilievo in corso')).toBeInTheDocument()
    expect(await within(ready).findByText('≈ 3 h')).toBeInTheDocument()
    expect(await within(rowOf('m10-em-dati-incompleti')).findByText('≈ 45 min')).toBeInTheDocument()
    expect(within(rowOf('m01-segnali-learning')).getByText('In preparazione')).toBeInTheDocument()
  })

  it('il progresso della regione conta fogli pronti e stati del rilievo, e il tempo dei fogli pronti', async () => {
    useProgress.getState().setModuleStatus('m09-parzen-windows', 'completato')
    useProgress.getState().setModuleStatus('m03-stima-intro-parametrica', 'da-ripassare')
    openCourse('melgani')
    const progress = screen.getByRole('region', { name: 'Rilievo della regione' })
    const value = (label: string) => within(progress).getByText(label).nextElementSibling
    expect(value('Fogli pronti')).toHaveTextContent('2 di 22')
    expect(value('Rilevati')).toHaveTextContent('1')
    expect(value('Da ripassare')).toHaveTextContent('1')
    // solo i fogli pronti sono "da rilevare": gli altri 19 sono in preparazione (m03 ha già uno stato, conta lì)
    expect(value('Da rilevare')).toHaveTextContent('1')
    expect(value('In preparazione')).toHaveTextContent('19')
    expect(await within(progress).findByText(/3 h 45 min/)).toBeInTheDocument()
  })

  it('una regione senza fogli pronti non ha niente "da rilevare": sono tutti in preparazione (regressione)', () => {
    openCourse('ricci')
    const progress = screen.getByRole('region', { name: 'Rilievo della regione' })
    const value = (label: string) => within(progress).getByText(label).nextElementSibling
    expect(value('Fogli pronti')).toHaveTextContent('0 di 14')
    expect(value('Da rilevare')).toHaveTextContent('0')
    expect(value('In preparazione')).toHaveTextContent('14')
  })

  it('"Riprendi" porta alla sezione in cui ti eri fermato, solo se è in questa regione', () => {
    useProgress.getState().markSection('m09-parzen-windows', 'scelta-di-h', 1000)
    useProgress.getState().markSection('p01-stima-parametri', 'prior', 2000)
    openCourse('melgani')
    const resume = screen.getByRole('link', { name: /^Riprendi/ })
    expect(resume).toHaveAttribute('href', '/m/m09-parzen-windows/teoria#scelta-di-h')
    expect(screen.getByText(/Ti eri fermato alla sezione/)).toHaveTextContent('«Scelta di h»')
    expect(rowOf('m09-parzen-windows')).toHaveTextContent(/Ti sei fermato qui/)
  })

  it('senza letture nella regione propone da dove partire', () => {
    useProgress.getState().markSection('p01-stima-parametri', 'prior', 2000)
    openCourse('melgani')
    expect(screen.queryByRole('link', { name: /^Riprendi/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Comincia dal foglio 09/ })).toHaveAttribute('href', '/m/m09-parzen-windows')
  })

  it('una regione senza fogli pronti lo dice e manda alle fonti', () => {
    openCourse('ricci')
    expect(screen.getByText(/Nessun foglio di questa regione è ancora pronto/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /pagine delle fonti/ })).toHaveAttribute('href', '/fonti/dl/1')
    expect(within(rowOf('d01-reti-feedforward')).getByText('In preparazione')).toBeInTheDocument()
  })

  it('porta alla mappa filtrata sulla regione e alle altre due regioni', () => {
    openCourse('passerini')
    expect(screen.getByRole('link', { name: /collegamenti sulla mappa/ })).toHaveAttribute('href', '/mappa?regione=passerini')
    const others = screen.getByRole('navigation', { name: 'Altre regioni' })
    expect(within(others).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/corso/melgani', '/corso/ricci'])
  })

  it('una regione che non esiste lo dice e offre le tre regioni', () => {
    openCourse('boh')
    expect(screen.getByRole('heading', { level: 1, name: 'Regione sconosciuta' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Melgani|Passerini|Ricci/ })).toHaveLength(3)
  })
})
