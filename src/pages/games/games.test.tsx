import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as registry from '../../content/registry'
import { createRng } from '../../lib/rng'
import { usePreferences } from '../../store/preferences'
import { progressKey, useProgress } from '../../store/progress'
import ConceptSort from './ConceptSort'
import ExerciseGym from './ExerciseGym'
import FillFormula from './FillFormula'
import FormulaMatch from './FormulaMatch'
import Game from './Game'
import GamesHub from './GamesHub'
import type { GameProps } from './kit'
import { newSort } from './logic/conceptSort'
import { newFill } from './logic/fillFormula'
import { newMatch } from './logic/formulaMatch'
import { newSprint } from './logic/trueFalse'
import { newWho } from './logic/whoAmI'
import { ALL_SCOPE, blanksOf, formulasOf, glossaryOf, tfOf } from './pool'
import ProofOrder from './ProofOrder'
import { FAKE_MODULES } from './testData'
import TrueFalseSprint from './TrueFalseSprint'
import WhoAmI from './WhoAmI'

// Quattro fogli finti in tre regioni al posto dei dati veri: le pagine devono funzionare con quelli che ci sono.
vi.mock('../../content/registry', async () => {
  const { FAKE_MODULES: modules } = await import('./testData')
  return {
    hasModule: (id: string) => modules.some((m) => m.id === id),
    loadAllModuleData: vi.fn(async () => modules),
    loadModuleData: vi.fn(async (id: string) => {
      const m = modules.find((x) => x.id === id)
      if (!m) throw new Error(`Modulo non trovato: ${id}`)
      return m
    }),
    loadModuleContent: vi.fn(async () => {
      throw new Error('non serve in questi test')
    }),
  }
})

const SLOW = { timeout: 15_000 }

/** Un testo spezzato fra più elementi (la cifra in mono e l'unità): cerca lo span che lo contiene tutto. */
const spanText = (text: string) => (_: string, el: Element | null) => el?.tagName === 'SPAN' && el.textContent === text

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Le pagine vere con le loro rotte (quelle che l'integratore collega in src/router.tsx). */
function openPage(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/giochi', Component: GamesHub },
      { path: '/giochi/:game', Component: Game },
      { path: '/m/:moduleId/:tab?', element: <p>Foglio</p> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

/** Un gioco da solo, con i fogli finti e un seed fisso. */
function play(View: ComponentType<GameProps>, seed = 1, props: Partial<GameProps> = {}) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <View modules={FAKE_MODULES} scope={ALL_SCOPE} seed={seed} {...props} /> },
      { path: '/giochi', element: <p>Hub</p> },
      { path: '/m/:moduleId/:tab?', element: <p>Foglio</p> },
    ],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  useProgress.getState().reset()
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('hub dei giochi', () => {
  it('elenca i sette giochi con il materiale del campo', async () => {
    openPage('/giochi')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Giochi/)
    const list = screen.getByRole('list', { name: 'Giochi' })
    await within(list).findByText(spanText('6 formule'), {}, SLOW)
    const links = within(list).getAllByRole('link')
    expect(links).toHaveLength(7)
    expect(links[0]).toHaveAttribute('href', '/giochi/formula-match')
    expect(within(list).getByText(spanText('7 affermazioni'))).toBeInTheDocument()
    expect(within(list).getByText(spanText('3 docenti'))).toBeInTheDocument()
    expect(screen.getByText('4 di 50')).toBeInTheDocument()
    expect(screen.getByText('7 di 7')).toBeInTheDocument()
  })

  it('il filtro per regione va nell\'URL, passa ai giochi e spegne quelli senza materiale', async () => {
    const user = userEvent.setup()
    const router = openPage('/giochi')
    const list = screen.getByRole('list', { name: 'Giochi' })
    await within(list).findByText(spanText('6 formule'), {}, SLOW)
    await user.click(screen.getByRole('radio', { name: 'Passerini' }))
    expect(router.state.location.search).toBe('?corso=passerini')
    expect(within(list).getAllByRole('link')[0]).toHaveAttribute('href', '/giochi/formula-match?corso=passerini')
    expect(within(list).getAllByText('In attesa di fogli').length).toBeGreaterThan(0)
    expect(within(list).getByText(/Servono almeno 5 affermazioni vero\/falso, e nei fogli pronti di questo campo per ora ce ne sono 2/)).toBeInTheDocument()
  })

  it('il filtro per regione è quello di tutte le pagine: «Tutte le regioni», tasselli, scelta a inchiostro (regressione)', async () => {
    openPage('/giochi')
    await screen.findByText(spanText('6 formule'), {}, SLOW)
    const group = screen.getByRole('radiogroup', { name: 'Regione' })
    expect(within(group).getByRole('radio', { name: 'Tutte le regioni' })).toBeChecked()
    expect(within(group).queryByRole('radio', { name: /atlante/ })).toBeNull()
    for (const radio of within(group).getAllByRole('radio')) expect(radio.closest('label')!.className).toContain('has-[:checked]:bg-accent')
  })

  it('nel menu dei fogli quelli non pronti si vedono ma non si scelgono', async () => {
    const user = userEvent.setup()
    const router = openPage('/giochi')
    await screen.findByText(spanText('6 formule'), {}, SLOW)
    const select = screen.getByRole('combobox', { name: 'Foglio' })
    expect(within(select).getByRole('option', { name: /09 · Finestre di Parzen/ })).toBeEnabled()
    expect(within(select).getByRole('option', { name: /01 · Segnali.*in preparazione/ })).toBeDisabled()
    await user.selectOptions(select, 'm09-parzen-windows')
    expect(router.state.location.search).toBe('?corso=melgani&foglio=m09-parzen-windows')
  })
})

describe('pagina di un gioco', () => {
  it('un percorso che non è un gioco lo dice e propone i sette', async () => {
    openPage('/giochi/tombola')
    expect(screen.getByRole('heading', { level: 1, name: 'Questo gioco non esiste' })).toBeInTheDocument()
    expect(screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/giochi/'))).toHaveLength(7)
  })

  it('con poco materiale spiega perché e allarga il campo fino a poter giocare', async () => {
    const user = userEvent.setup()
    const router = openPage('/giochi/vero-falso?foglio=p10-kernel-trick')
    expect(await screen.findByRole('heading', { name: "Qui non c'è ancora abbastanza materiale" }, SLOW)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Gioca su tutta la regione Passerini/ }))
    expect(router.state.location.search).toBe('?corso=passerini')
    await user.click(await screen.findByRole('button', { name: /Gioca su tutto l'atlante/ }))
    expect(router.state.location.search).toBe('')
    expect(await screen.findByRole('heading', { name: 'Pronto per lo sprint?' }, SLOW)).toBeInTheDocument()
  })

  it('carica il gioco giusto con le sue regole', async () => {
    openPage('/giochi/formula-match')
    expect(screen.getByRole('heading', { level: 1, name: 'Formula Match' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Come si gioca' })).toBeInTheDocument()
    const tiles = await screen.findByRole('list', { name: 'Tessere' }, SLOW)
    expect(within(tiles).getAllByRole('button')).toHaveLength(12)
  })
})

describe('Formula Match', () => {
  const layout = () => newMatch(formulasOf(FAKE_MODULES), createRng(1))
  const pairIdx = (p: number) =>
    layout()
      .cards.map((c, i) => [c, i] as const)
      .filter(([c]) => c.pair === p)
      .map(([, i]) => i)

  it('da tastiera: frecce fra le tessere, Invio le gira, sbaglio e coppie fino alla vittoria', async () => {
    const user = userEvent.setup()
    play(FormulaMatch)
    const tiles = within(screen.getByRole('list', { name: 'Tessere' })).getAllByRole('button')
    tiles[0].focus()
    await user.keyboard('{ArrowRight}')
    expect(tiles[1]).toHaveFocus()
    await user.keyboard('{End}')
    expect(tiles[11]).toHaveFocus()

    // uno sbaglio: la prima tessera della coppia 0 con una della coppia 1
    await user.click(tiles[pairIdx(0)[0]])
    await user.click(tiles[pairIdx(1)[0]])
    expect(screen.getByRole('status')).toHaveTextContent(/non fa coppia/)
    expect(screen.getAllByText('Non fa coppia')).toHaveLength(2)

    // la prima tessera della coppia 0 è ancora scoperta dallo sbaglio: si gira prima l'altra
    for (let p = 0; p < 6; p++) {
      const [a, b] = pairIdx(p)
      tiles[b].focus()
      await user.keyboard('{Enter}')
      tiles[a].focus()
      await user.keyboard('{Enter}')
    }
    const end = await screen.findByRole('heading', { name: 'Tutte le coppie trovate' })
    expect(end).toHaveFocus()
    expect(screen.getByText('7 (minimo 6)')).toBeInTheDocument()
    expect(screen.getByText('Le formule della partita')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Gioca ancora' }))
    expect(within(screen.getByRole('list', { name: 'Tessere' })).getAllByRole('button')[0]).toHaveFocus()
  })

  it('con riduci movimento le tessere non ruotano', async () => {
    // jsdom non ha matchMedia: lo si aggiunge solo per questo test
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener: () => {}, removeEventListener: () => {} }),
    })
    try {
      const user = userEvent.setup()
      play(FormulaMatch)
      const tiles = within(screen.getByRole('list', { name: 'Tessere' })).getAllByRole('button')
      await user.click(tiles[0])
      expect(tiles[0]).toHaveAccessibleName(/^Tessera 1: /)
      expect(document.body.innerHTML).not.toContain('rotateY(180deg)')
    } finally {
      Reflect.deleteProperty(window, 'matchMedia')
    }
  })
})

describe('Completa la formula', () => {
  it('tasti 1-4 per scegliere, esito, Avanti e fine partita con le formule da ripassare', async () => {
    const user = userEvent.setup()
    play(FillFormula)
    const rounds = newFill(blanksOf(FAKE_MODULES), createRng(1)).rounds
    await user.keyboard(String(rounds[0].answer + 1))
    expect(screen.getByText('Giusta: +100 punti.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Opzione \d, giusta/ })).toBeInTheDocument()
    // il fuoco passa su "Avanti": Invio prosegue
    await waitFor(() => expect(screen.getByRole('button', { name: 'Avanti' })).toHaveFocus())
    await user.keyboard('{Enter}')
    // seconda domanda: una scelta sbagliata
    const wrong = (rounds[1].answer + 1) % rounds[1].options.length
    await user.click(screen.getByRole('button', { name: `Opzione ${wrong + 1}` }))
    expect(screen.getByText('Non è questo il pezzo: ecco la formula intera.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Vedi il risultato' }))
    expect(screen.getByRole('heading', { name: 'Formule completate' })).toBeInTheDocument()
    expect(screen.getByText('Da ripassare')).toBeInTheDocument()
    expect(screen.getByText('1 di 2')).toBeInTheDocument()
  })
})

describe('Riordina la dimostrazione', () => {
  it('sposta i passaggi da tastiera, controlla, chiede un aiuto e alla fine mostra i perché', async () => {
    const user = userEvent.setup()
    play(ProofOrder)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Dimostrazione' }), 'm09-parzen-windows:der01')
    expect(screen.getByRole('heading', { name: 'Dal conteggio alla stima' })).toBeInTheDocument()

    const handle = screen.getByRole('button', { name: /^Passaggio in posizione 1 di 4/ })
    handle.focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByText('Passaggio spostato in posizione 2 di 4.')).toBeInTheDocument()
    // il fuoco segue il passaggio spostato
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/^Passaggio in posizione 2 di 4/))

    await user.click(screen.getByRole('button', { name: "Controlla l'ordine" }))
    expect(screen.getAllByText(/Al posto giusto|Fuori posto/).length).toBeGreaterThan(0)
    // ogni aiuto sistema almeno un passaggio: con quattro passaggi ne bastano tre
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: /Un aiuto/ }))
    await user.click(screen.getByRole('button', { name: "Controlla l'ordine" }))
    expect(await screen.findByRole('heading', { name: 'Dimostrazione in ordine' })).toBeInTheDocument()
    expect(screen.getByText('I perché, passo per passo')).toBeInTheDocument()
    expect(screen.getByText('Si divide per il volume.')).toBeInTheDocument()
  })
})

describe('Vero/Falso Sprint', () => {
  it('Via, risposte con V e F, errori da ripassare e risposte registrate nei progressi', async () => {
    const user = userEvent.setup()
    play(TrueFalseSprint)
    const queue = newSprint(tfOf(FAKE_MODULES), createRng(1)).queue
    // al primo caricamento il fuoco resta dov'è: la pagina non scorre oltre le regole
    expect(screen.getByRole('button', { name: /Via/ })).not.toHaveFocus()
    await user.click(screen.getByRole('button', { name: /Via/ }))
    expect(screen.getByRole('heading', { name: 'Affermazione 1' })).toBeInTheDocument()
    // la prima sbagliata, le altre giuste
    for (let i = 0; i < queue.length; i++) {
      const right = queue[i].item.answer
      const given = i === 0 ? !right : right
      await user.keyboard(given ? 'v' : 'f')
    }
    expect(await screen.findByRole('heading', { name: 'Affermazioni finite' })).toBeInTheDocument()
    expect(screen.getByText(`${queue.length - 1} su ${queue.length}`)).toBeInTheDocument()
    expect(screen.getByText('Da ripassare')).toBeInTheDocument()
    const quiz = useProgress.getState().quiz
    expect(Object.keys(quiz)).toHaveLength(queue.length)
    expect(quiz[progressKey(queue[0].moduleId, queue[0].item.id)]).toMatchObject({ attempts: 1, correct: 0 })

    await user.click(screen.getByRole('button', { name: 'Rigioca gli errori' }))
    expect(screen.getByRole('heading', { name: 'Ripasso degli errori' })).toBeInTheDocument()
    // il pulsante premuto è sparito: il fuoco va su "Via"
    expect(screen.getByRole('button', { name: /Via/ })).toHaveFocus()
    expect(screen.getByText(/1 affermazione in ordine casuale/)).toBeInTheDocument()
  })

  it('tasti arrivati prima di un render contano ciascuno una volta', async () => {
    const user = userEvent.setup()
    play(TrueFalseSprint)
    await user.click(screen.getByRole('button', { name: /Via/ }))
    act(() => {
      for (const key of ['v', 'f', 'v']) window.dispatchEvent(new KeyboardEvent('keydown', { key }))
    })
    expect(screen.getByRole('heading', { name: 'Affermazione 4' })).toBeInTheDocument()
    const quiz = useProgress.getState().quiz
    expect(Object.keys(quiz)).toHaveLength(3)
    expect(Object.values(quiz).every((q) => q.attempts === 1)).toBe(true)
  })

  it('allo scadere dei 60 secondi lo sprint finisce da solo', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date', 'requestAnimationFrame'] })
    play(TrueFalseSprint)
    fireEvent.click(screen.getByRole('button', { name: /Via/ }))
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(screen.getByText('30')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(31_000)
    })
    expect(screen.getByRole('heading', { name: 'Tempo scaduto' })).toBeInTheDocument()
    expect(screen.getByText('Nessuna risposta data in tempo. Riprova: bastano V e F.')).toBeInTheDocument()
  })
})

describe('Chi sono?', () => {
  it('indovina scrivendo, apre indizi sbagliando, sceglie fra quattro e si arrende', async () => {
    const user = userEvent.setup()
    play(WhoAmI)
    const rounds = newWho(glossaryOf(FAKE_MODULES), createRng(1)).rounds
    const field = screen.getByRole('textbox', { name: /Scrivi il termine/ })

    await user.type(field, `${rounds[0].entry.item.term}{Enter}`)
    expect(screen.getByText(/Giusto: \+100 punti\./)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Avanti' }))

    await user.type(screen.getByRole('textbox', { name: /Scrivi il termine/ }), 'niente di simile{Enter}')
    expect(screen.getByText('Indizio 2 · Iniziali')).toBeInTheDocument()
    expect(screen.getByText(/Non è «niente di simile»/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Un altro indizio/ }))
    expect(screen.getByText('Indizio 3 · In inglese')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Un altro indizio/ }))
    const group = screen.getByRole('group', { name: 'Scegli il termine' })
    const option = within(group)
      .getAllByRole('button')
      .find((b) => b.querySelector('span')?.textContent === rounds[1].entry.item.term)
    await user.click(option!)
    expect(screen.getByText(/Giusto: \+20 punti\./)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Avanti' }))

    await user.click(screen.getByRole('button', { name: 'Mi arrendo' }))
    expect(screen.getByText(/Questa volta no\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Avanti' })).toHaveFocus()
  })
})

describe('Palestra esercizi', () => {
  it('sceglie il livello, sale dopo tre risolti e chiude la serie dopo dieci', async () => {
    const user = userEvent.setup()
    play(ExerciseGym)
    expect(screen.getByRole('radio', { name: '1 · base' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /Comincia la serie/ }))
    expect(screen.getByRole('heading', { name: 'Esercizio 1 di 10' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Doppio facile' })).toBeInTheDocument()
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: 'Risolto' }))
    expect(screen.getByText('Livello 2: tre risolti di fila, si sale.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Doppio medio' })).toBeInTheDocument()
    for (let i = 0; i < 7; i++) await user.click(screen.getByRole('button', { name: 'Non risolto' }))
    expect(screen.getByRole('heading', { name: 'Serie finita' })).toBeInTheDocument()
    expect(screen.getByText('3 di 10')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: "Un'altra serie" }))
    expect(screen.getByRole('heading', { name: 'Esercizio 1 di 10' })).toBeInTheDocument()
  })
})

describe('Smista i concetti', () => {
  it('con tre regioni smista per docente: numeri o clic, sbaglio che lascia la carta, fine partita', async () => {
    const user = userEvent.setup()
    play(ConceptSort)
    const state = newSort(FAKE_MODULES, ALL_SCOPE, createRng(1))!
    expect(screen.getByRole('heading', { name: 'Di quale docente è?' })).toBeInTheDocument()
    const bins = within(screen.getByRole('list', { name: 'Contenitori' })).getAllByRole('button')
    expect(bins).toHaveLength(3)

    const first = state.cards[0]
    const wrong = state.bins.findIndex((b) => b.id !== first.bin)
    await user.keyboard(String(wrong + 1))
    expect(screen.getByText(new RegExp(`No: «${escape(first.text)}» non sta in`))).toBeInTheDocument()
    await user.click(bins[state.bins.findIndex((b) => b.id === first.bin)])
    expect(screen.getByText(new RegExp(`Giusto: «${escape(first.text)}» sta in`))).toBeInTheDocument()

    for (const card of state.cards.slice(1)) await user.keyboard(String(state.bins.findIndex((b) => b.id === card.bin) + 1))
    expect(screen.getByRole('heading', { name: 'Tutto smistato' })).toBeInTheDocument()
    expect(screen.getByText('Dove stava ogni carta')).toBeInTheDocument()
    expect(screen.getByText(`${state.cards.length - 1} di ${state.cards.length}`)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------------------------
// Regressioni dalla revisione delle pagine globali (accessibilità, tastiera, caricamento)
// ---------------------------------------------------------------------------------------------

describe('regressioni dei giochi', () => {
  it('Completa la formula: la colonna del round non si allarga con la formula (traccia minmax(0,1fr), cornice min-w-0)', () => {
    play(FillFormula)
    const section = screen.getByRole('region', { name: newFill(blanksOf(FAKE_MODULES), createRng(1)).rounds[0].formula.name })
    expect(section).toHaveClass('min-w-0')
    expect(section.parentElement).toHaveClass('grid-cols-[minmax(0,1fr)]')
  })

  it('Completa la formula: dopo «Avanti» il fuoco va sul titolo della formula nuova', async () => {
    const user = userEvent.setup()
    play(FillFormula)
    const rounds = newFill(blanksOf(FAKE_MODULES), createRng(1)).rounds
    await user.keyboard(String(rounds[0].answer + 1))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Avanti' })).toHaveFocus())
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: rounds[1].formula.name })).toHaveFocus())
  })

  it('Riordina la dimostrazione: dopo Fine la maniglia spostata viene portata nello schermo', async () => {
    const user = userEvent.setup()
    const scroll = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, writable: true, value: scroll })
    try {
      play(ProofOrder)
      await user.selectOptions(screen.getByRole('combobox', { name: 'Dimostrazione' }), 'm09-parzen-windows:der01')
      screen.getByRole('button', { name: /^Passaggio in posizione 1 di 4/ }).focus()
      await user.keyboard('{End}')
      await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/^Passaggio in posizione 4 di 4/))
      await waitFor(() => expect(scroll.mock.contexts).toContain(document.activeElement))
    } finally {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
    }
  })

  it('Riordina la dimostrazione: due spostamenti di fila nella stessa posizione vengono annunciati tutti e due', async () => {
    const user = userEvent.setup()
    play(ProofOrder)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Dimostrazione' }), 'm09-parzen-windows:der01')
    screen.getByRole('button', { name: /^Passaggio in posizione 1 di 4/ }).focus()
    await user.keyboard('{ArrowDown}')
    const first = screen.getByText('Passaggio spostato in posizione 2 di 4.')
    // si torna su e si riscende: stessa frase, ma dev'essere un annuncio nuovo (nodo nuovo nella regione live)
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/^Passaggio in posizione 2 di 4/))
    await user.keyboard('{ArrowUp}')
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/^Passaggio in posizione 1 di 4/))
    await user.keyboard('{ArrowDown}')
    expect(screen.getByText('Passaggio spostato in posizione 2 di 4.')).not.toBe(first)
  })

  it('Chi sono?: il terzo «Un altro indizio» porta il fuoco sul primo dei quattro nomi', async () => {
    const user = userEvent.setup()
    play(WhoAmI)
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: /Un altro indizio/ }))
    const group = screen.getByRole('group', { name: 'Scegli il termine' })
    await waitFor(() => expect(within(group).getAllByRole('button')[0]).toHaveFocus())
  })

  it('Chi sono?: dopo un indizio il pulsante resta nello schermo', async () => {
    const user = userEvent.setup()
    const scroll = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, writable: true, value: scroll })
    try {
      play(WhoAmI)
      const more = screen.getByRole('button', { name: /Un altro indizio/ })
      await user.click(more)
      await waitFor(() => expect(scroll.mock.contexts).toContain(screen.getByRole('button', { name: /Un altro indizio/ })))
    } finally {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
    }
  })

  it('Palestra: «Comincia la serie» porta il fuoco sul titolo del primo esercizio', async () => {
    const user = userEvent.setup()
    play(ExerciseGym)
    await user.click(screen.getByRole('button', { name: /Comincia la serie/ }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Esercizio 1 di 10' })).toHaveFocus())
  })

  it('Vero/Falso: due esiti uguali di fila sono due annunci (nodo nuovo nella regione di stato)', async () => {
    const user = userEvent.setup()
    play(TrueFalseSprint)
    const queue = newSprint(tfOf(FAKE_MODULES), createRng(1)).queue
    await user.click(screen.getByRole('button', { name: /Via/ }))
    await user.keyboard(queue[0].item.answer ? 'v' : 'f')
    const first = screen.getByText(/^Giusta, \+/)
    await user.keyboard(queue[1].item.answer ? 'v' : 'f')
    const second = screen.getByText(/^Giusta, \+/)
    expect(second).not.toBe(first)
  })

  it('«Riduci il movimento» delle impostazioni vale anche nei giochi: le tessere non ruotano', async () => {
    usePreferences.getState().setReduceMotion(true)
    try {
      const user = userEvent.setup()
      play(FormulaMatch)
      const tiles = within(screen.getByRole('list', { name: 'Tessere' })).getAllByRole('button')
      await user.click(tiles[0])
      expect(document.body.innerHTML).not.toContain('rotateY(180deg)')
    } finally {
      usePreferences.getState().setReduceMotion(false)
    }
  })

  it('la riga «da quale foglio» è un bersaglio alto almeno 40 px', () => {
    play(WhoAmI)
    const link = screen.getAllByRole('link').find((a) => a.textContent?.startsWith('Foglio '))
    expect(link).toHaveClass('min-h-10', 'inline-flex', 'items-center')
  })

  it('un foglio che non si carica non fa sparire gli altri: il campo resta con quelli arrivati e lo dice', async () => {
    const failing = FAKE_MODULES[1].id
    vi.mocked(registry.loadAllModuleData).mockRejectedValue(new Error('un chunk non è arrivato'))
    vi.mocked(registry.loadModuleData).mockImplementation(async (id: string) => {
      if (id === failing) throw new Error('chunk non arrivato')
      const m = FAKE_MODULES.find((x) => x.id === id)
      if (!m) throw new Error(`Modulo non trovato: ${id}`)
      return m
    })
    try {
      openPage('/giochi')
      expect(await screen.findByText(`${FAKE_MODULES.length - 1} di 50`, {}, SLOW)).toBeInTheDocument()
      expect(screen.getByText(/Foglio 09 non si è caricato: i giochi usano gli altri fogli pronti/)).toBeInTheDocument()
      expect(screen.queryByText(/Non sono riuscito a leggere i fogli/)).not.toBeInTheDocument()
    } finally {
      vi.mocked(registry.loadAllModuleData).mockResolvedValue(FAKE_MODULES)
      vi.mocked(registry.loadModuleData).mockImplementation(async (id: string) => {
        const m = FAKE_MODULES.find((x) => x.id === id)
        if (!m) throw new Error(`Modulo non trovato: ${id}`)
        return m
      })
    }
  })
})
