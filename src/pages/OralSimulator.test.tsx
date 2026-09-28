import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getBankQuestion } from '../content/exam-bank'
import type { ModuleData } from '../content/types'
import { progressKey, useProgress } from '../store/progress'
import OralSimulator from './OralSimulator'
import { buildPool, drawSession } from './oral/logic'

// Un solo foglio pronto, il 09, con una domanda della banca (mel-03) e una libera. Testi senza formule:
// in jsdom il nome accessibile di un elemento con KaTeX (MathML) manda in errore dom-accessibility-api.
const { PARZEN } = vi.hoisted(() => {
  const PARZEN = {
    id: 'm09-parzen-windows',
    course: 'melgani',
    title: 'Finestre di Parzen',
    exam: [
      {
        id: 'or-banca-1',
        q: 'Stima a finestre di Parzen: contesto e proprietà.',
        qEn: 'Parzen window estimation: context and properties.',
        prof: 'Melgani',
        fromBank: true,
        bankText:
          'Parzen Window Estimation: context, properties etc. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Graphical representation of how the counting/interpolation works with  a couple of samples.',
        answer: 'Fisso il volume e conto i campioni.',
        checklist: ['stima di base K su NV', 'kernel gaussiano'],
        followUps: [{ q: 'Perché serve il fattore uno su h alla n?', a: 'Per avere area 1.' }],
      },
      { id: 'or-libera', q: 'Che cosa succede con h molto piccolo?', qEn: 'What happens with a very small h?', prof: 'Melgani', fromBank: false, answer: 'La stima diventa rumorosa.', checklist: [], followUps: [] },
    ],
  }
  return { PARZEN }
})

vi.mock('../content/registry', () => ({
  hasModule: (id: string) => id === 'm09-parzen-windows',
  loadAllModuleData: vi.fn(async () => [PARZEN]),
  loadModuleData: vi.fn(async () => PARZEN),
  loadModuleContent: vi.fn(async () => {
    throw new Error('non serve in questi test')
  }),
}))

const SHEETS = [PARZEN as unknown as ModuleData]
const exams = () => useProgress.getState().exam

function open(path = '/orale') {
  const router = createMemoryRouter(
    [
      { path: '/orale', Component: OralSimulator },
      { path: '/m/:moduleId/:tab?', element: <p>Foglio aperto</p> },
      { path: '/fonti/:doc/:page', element: <p>Fonte aperta</p> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

/** La pagina ha finito di aprire i fogli pronti quando compare il pulsante di estrazione. */
const ready = () => screen.findByRole('button', { name: /^estrai/i })

/** Mock di SpeechRecognition: tiene l'ultima istanza per emettere risultati. */
class FakeRecognition {
  static last: FakeRecognition | null = null
  lang = ''
  continuous = false
  interimResults = false
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn(() => this.onend?.())
  abort = vi.fn()
  constructor() {
    FakeRecognition.last = this
  }
  say(text: string, isFinal: boolean) {
    const result = Object.assign([{ transcript: text }], { isFinal })
    this.onresult?.({ resultIndex: 0, results: [result] })
  }
}

beforeEach(() => {
  useProgress.getState().reset()
  localStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete (window as unknown as Record<string, unknown>).SpeechRecognition
  FakeRecognition.last = null
})

describe('Simulatore dell\'orale: preparazione', () => {
  it('propone parte, domande, quante e tempo, con il numero di domande di ogni scelta', async () => {
    const user = userEvent.setup()
    open()
    await ready()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/orale/i)
    const parts = screen.getByRole('radiogroup', { name: /parte del corso/i })
    expect(within(parts).getByRole('radio', { name: /melgani.*24 domande/i })).toBeChecked()
    expect(within(parts).getByRole('radio', { name: /tutte le regioni.*88 domande/i })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /fogli pronti/i }))
    expect(within(parts).getByRole('radio', { name: /melgani.*2 domande/i })).toBeChecked()
    expect(within(parts).getByRole('radio', { name: /passerini.*nessun foglio pronto/i })).toBeDisabled()
    expect(screen.getByRole('radiogroup', { name: /quante domande/i })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /tempo per risposta/i })).toBeInTheDocument()
  })

  it('legge parte e modalità dall\'indirizzo', async () => {
    open('/orale?parte=ricci&modo=banca')
    await ready()
    expect(screen.getByRole('radio', { name: /ricci.*41 domande/i })).toBeChecked()
  })
})

describe('Simulatore dell\'orale: estrazione', () => {
  it('con lo stesso seme estrae le stesse domande, nello stesso ordine', async () => {
    const user = userEvent.setup()
    const expected = drawSession(buildPool('banca', 'melgani', SHEETS), [], 3, 42, Date.now()).map((i) => i.question.qEn)
    open('/orale?seme=42')
    await ready()
    await user.click(screen.getByRole('radio', { name: /^3$/ }))
    await user.click(screen.getByRole('button', { name: /^estrai/i }))
    const seen: string[] = []
    for (let n = 0; n < 3; n++) {
      expect(screen.getByRole('heading', { name: new RegExp(`domanda ${n + 1} di 3`, 'i') })).toBeInTheDocument()
      seen.push(expected.find((t) => screen.queryByText(t) !== null) ?? '(nessuna)')
      await user.click(screen.getByRole('button', { name: /salta/i }))
    }
    expect(seen).toEqual(expected)
    expect(screen.getByRole('heading', { name: /esito della prova/i })).toBeInTheDocument()
    // il seme dell'indirizzo rende la prova ripetibile, e la pagina lo dice
    expect(screen.getByText(/seme 42/i)).toBeInTheDocument()
  })
})

describe('Simulatore dell\'orale: una domanda', () => {
  async function tryBankQuestion(user: ReturnType<typeof userEvent.setup>, id: string) {
    const board = screen.getByRole('group', { name: /quadro della banca/i })
    await user.click(within(board).getByRole('button', { name: new RegExp(`^${id}\\b`) }))
    await user.click(screen.getByRole('button', { name: /prova questa domanda/i }))
  }

  it('il cronometro avanza sulla scala del tempo e avvisa quando il tempo consigliato è passato', async () => {
    open('/orale')
    await ready()
    const user = userEvent.setup()
    await tryBankQuestion(user, 'mel-01')
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: /avvia il cronometro/i }))
    act(() => vi.advanceTimersByTime(65_000))
    expect(screen.getByRole('timer')).toHaveTextContent('1:05')
    expect(screen.getByText(/3:55 rimasti/)).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(4 * 60_000))
    expect(screen.getByText(/tempo consigliato superato/i)).toBeInTheDocument()
  })

  it('una domanda della banca senza foglio pronto mostra i fogli di riferimento e registra il voto', async () => {
    const user = userEvent.setup()
    open('/orale')
    await ready()
    await tryBankQuestion(user, 'mel-01')
    // la riga EN è la domanda in inglese (textEn), non il resoconto verbatim dello studente
    expect(screen.getByText(getBankQuestion('mel-01')!.textEn)).toHaveAttribute('lang', 'en')
    await user.click(screen.getByRole('button', { name: /rivela i fogli di riferimento/i }))
    const refs = screen.getByRole('list', { name: /fogli di riferimento/i })
    expect(within(refs).getByText(/errore di generalizzazione/i)).toBeInTheDocument()
    expect(within(refs).getAllByText(/in preparazione/i).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /buona/i }))
    expect(exams()).toHaveLength(1)
    expect(exams()[0]).toMatchObject({ key: progressKey('m21-errore-generalizzazione', 'banca-mel-01'), score: 2 })
    await user.click(screen.getByRole('button', { name: /vedi l'esito/i }))
    const summary = screen.getByRole('region', { name: /esito della prova/i })
    expect(within(summary).getByText(/voto 2 su 3/i)).toBeInTheDocument()
  })

  it('una domanda della banca con il foglio pronto usa la domanda del foglio, con traccia e risposta modello', async () => {
    const user = userEvent.setup()
    open('/orale')
    await ready()
    await tryBankQuestion(user, 'mel-03')
    expect(screen.getByText(/stima a finestre di parzen: contesto e proprietà/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /rivela traccia e risposta/i }))
    expect(screen.getByText(/fisso il volume/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /completa/i }))
    expect(exams()[0]).toMatchObject({ key: progressKey('m09-parzen-windows', 'or-banca-1'), score: 3 })
  })

  it('senza Web Speech API lo dice e resta il cronometro', async () => {
    const user = userEvent.setup()
    open('/orale')
    await ready()
    await tryBankQuestion(user, 'mel-01')
    expect(screen.getByText(/questo browser non trascrive la voce/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rispondi ad alta voce/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /avvia il cronometro/i })).toBeInTheDocument()
  })

  it('con la Web Speech API trascrive la risposta, avvia il cronometro e si ferma alla rivelazione', async () => {
    ;(window as unknown as Record<string, unknown>).SpeechRecognition = FakeRecognition
    const user = userEvent.setup()
    open('/orale')
    await ready()
    await tryBankQuestion(user, 'mel-01')
    await user.click(screen.getByRole('button', { name: /rispondi ad alta voce/i }))
    const rec = FakeRecognition.last!
    expect(rec.start).toHaveBeenCalled()
    expect(rec.lang).toBe('en-US')
    expect(screen.getByRole('button', { name: /pausa/i })).toBeInTheDocument()
    act(() => rec.say('The generalization error is the expected loss', true))
    expect(screen.getByText(/the generalization error is the expected loss/i)).toBeInTheDocument()
    expect(screen.getByText(/7 parole/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /rivela i fogli di riferimento/i }))
    await waitFor(() => expect(rec.stop).toHaveBeenCalled())
    // la trascrizione resta per il confronto con i fogli
    expect(screen.getByText(/the generalization error is the expected loss/i)).toBeInTheDocument()
  })
})

describe('Simulatore dell\'orale: quadro e registro', () => {
  it('le frecce spostano la scelta sul quadro della banca', async () => {
    const user = userEvent.setup()
    open('/orale')
    await ready()
    const board = screen.getByRole('group', { name: /quadro della banca/i })
    const first = within(board).getByRole('button', { name: /^mel-01\b/ })
    first.focus()
    await user.keyboard('{ArrowRight}')
    const second = within(board).getByRole('button', { name: /^mel-02\b/ })
    expect(second).toHaveFocus()
    expect(second).toHaveAttribute('aria-pressed', 'true')
    expect(first).toHaveAttribute('tabindex', '-1')
  })

  it('il registro mostra le simulazioni fatte, anche quelle dai fogli', async () => {
    act(() => {
      useProgress.getState().recordExam({ key: progressKey('m09-parzen-windows', 'or-libera'), score: 1, seconds: 90 }, Date.UTC(2026, 8, 20, 10))
      useProgress.getState().recordExam({ key: progressKey('m21-errore-generalizzazione', 'banca-mel-01'), score: 3 }, Date.UTC(2026, 8, 21, 10))
    })
    open('/orale')
    await ready()
    const log = screen.getByRole('list', { name: /ultime simulazioni/i })
    const items = within(log).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent(/errore di generalizzazione/i)
    expect(items[0]).toHaveTextContent(/3 su 3/)
    expect(items[1]).toHaveTextContent(/h molto piccolo/i)
    expect(items[1]).toHaveTextContent('1:30')
  })
})

// ---------------------------------------------------------------------------------------------
// Regressioni dalla revisione
// ---------------------------------------------------------------------------------------------

describe('Simulatore dell\'orale: regressioni', () => {
  async function tryBank(user: ReturnType<typeof userEvent.setup>, id: string) {
    const board = screen.getByRole('group', { name: /quadro della banca/i })
    await user.click(within(board).getByRole('button', { name: new RegExp(`^${id}\\b`) }))
    await user.click(screen.getByRole('button', { name: /prova questa domanda/i }))
  }

  it('«Prepara un\'altra prova» porta il fuoco sul titolo della preparazione', async () => {
    const user = userEvent.setup()
    open()
    await ready()
    await tryBank(user, 'mel-01')
    await user.click(screen.getByRole('button', { name: /termina la prova/i }))
    await user.click(screen.getByRole('button', { name: /prepara un'altra prova/i }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /prepara la prova/i })).toHaveFocus())
  })

  it('?seme= ripete l\'estrazione anche dopo aver provato delle domande: lo storico non la cambia', async () => {
    const user = userEvent.setup()
    const pool = buildPool('banca', 'melgani', SHEETS)
    const expected = drawSession(pool, [], 3, 424242, Date.now())
    // le tre domande che il seme estrae sono già state provate e andate benissimo: con i pesi dello storico
    // l'estrazione cambierebbe, con il seme deve restare la stessa
    act(() => {
      for (const item of expected) for (let k = 0; k < 4; k++) useProgress.getState().recordExam({ key: item.keys[0], score: 3 }, Date.now() - k * 1000)
    })
    open('/orale?seme=424242')
    await ready()
    await user.click(screen.getByRole('radio', { name: /^3$/ }))
    await user.click(screen.getByRole('button', { name: /^estrai/i }))
    for (let n = 0; n < 3; n++) {
      expect(screen.getByText(expected[n].question.qEn)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /salta/i }))
    }
    expect(screen.getByText(/seme 424242/i)).toBeInTheDocument()
  })

  it('senza ?seme= il numero dell\'estrazione non compare: non basterebbe a ripeterla', async () => {
    const user = userEvent.setup()
    open()
    await ready()
    await user.click(screen.getByRole('button', { name: /^estrai/i }))
    expect(screen.queryByText(/estrazione n\./i)).not.toBeInTheDocument()
    expect(screen.queryByText(/seme \d/i)).not.toBeInTheDocument()
  })

  it('«Rifai la domanda» riapre la domanda anche nella barra della prova: niente voto vecchio nell\'esito', async () => {
    const user = userEvent.setup()
    open()
    await ready()
    await tryBank(user, 'mel-01')
    await user.click(screen.getByRole('button', { name: /rivela i fogli di riferimento/i }))
    await user.click(screen.getByRole('button', { name: /buona/i }))
    expect(screen.getByText(/voto registrato nello storico/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /rifai la domanda/i }))
    expect(screen.queryByText(/voto registrato nello storico/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /salta e vedi l'esito/i }))
    const summary = screen.getByRole('region', { name: /esito della prova/i })
    expect(within(summary).queryByText(/voto 2 su 3/i)).not.toBeInTheDocument()
    expect(within(summary).getByText(/saltata/i)).toBeInTheDocument()
  })

  it('la riga EN è la domanda in inglese; il resoconto dello studente sta a parte', async () => {
    const user = userEvent.setup()
    open()
    await ready()
    // nel quadro della banca (mel-01 è scelta all'inizio)
    const bank = getBankQuestion('mel-01')!
    expect(screen.getByText(bank.textEn)).toHaveAttribute('lang', 'en')
    expect(screen.getByText(/resoconto originale/i)).toBeInTheDocument()
    // e nella scheda d'orale
    await tryBank(user, 'mel-01')
    expect(screen.getByText(bank.textEn)).toHaveAttribute('lang', 'en')
    expect(screen.getAllByText(/resoconto originale/i).length).toBeGreaterThan(0)
  })

  it('il quadro della banca non annuncia due volte la domanda scelta: la scheda sotto non è una regione live', async () => {
    open()
    await ready()
    const detail = screen.getByText(/^Domanda mel-01$/).closest('p')!
    expect(detail).not.toHaveAttribute('aria-live')
  })

  it('la parte che mescola le tre regioni si chiama «Tutte le regioni», come nelle altre pagine (regressione: «Mista»)', async () => {
    open()
    const parts = await screen.findByRole('radiogroup', { name: 'Parte del corso' })
    expect(within(parts).getByRole('radio', { name: /^Tutte le regioni/ })).toBeInTheDocument()
    expect(within(parts).queryByRole('radio', { name: /^Mista/ })).toBeNull()
  })

  it('la regione Ricci si chiama Ricci, come nel resto dell\'atlante', async () => {
    open()
    await ready()
    const board = screen.getByRole('group', { name: /quadro della banca/i })
    expect(within(board).queryByText(/Ricci · Deep Learning/)).not.toBeInTheDocument()
    expect(within(board).getByRole('button', { name: /^dl-01, Ricci:/ })).toBeInTheDocument()
  })

  it('un foglio che non si carica non svuota l\'orale: lo dice e si può riprovare', async () => {
    const registry = await import('../content/registry')
    vi.mocked(registry.loadAllModuleData).mockRejectedValueOnce(new Error('chunk non arrivato'))
    vi.mocked(registry.loadModuleData).mockRejectedValueOnce(new Error('chunk non arrivato'))
    open()
    expect(await screen.findByText(/Foglio 09 non si è caricato/)).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /riprova/i }))
    await waitFor(() => expect(screen.queryByText(/Foglio 09 non si è caricato/)).not.toBeInTheDocument())
    expect(screen.getByText('1 di 50')).toBeInTheDocument()
  })
})
