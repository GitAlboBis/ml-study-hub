import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import Widget, { meta } from './m09-orale-buon-stimatore.widget'
import { ORDER, PIECES, TILES, TRICKS, breaks } from './orale'
import { stubReducedMotion } from './proprieta/testing'

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const byLabel = (label: string) => screen.getByLabelText(label)
const katexErrors = () => document.querySelectorAll('.katex-error').length

/** requestAnimationFrame a mano: i cronometri avanzano solo quando il test fa scorrere i fotogrammi. */
let queue = new Map<number, FrameRequestCallback>()
let nextId = 1
let now = 0
function stubFrames() {
  queue = new Map()
  now = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.set(nextId, cb)
    return nextId++
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => queue.delete(id))
}
function frames(count: number, dt = 16) {
  for (let i = 0; i < count; i++) {
    const run = [...queue.values()]
    queue = new Map()
    now += dt
    act(() => run.forEach((cb) => cb(now)))
  }
}

async function buildChain(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < ORDER.length; i++) {
    const id = ORDER[i]
    await user.click(screen.getByText(TILES[id].text, { selector: 'button' }))
    await user.click(screen.getByLabelText(`Pezzo: ${PIECES[TILES[id].piece].label}`))
    await user.click(screen.getByLabelText(new RegExp(`^Anello ${i + 1}, vuoto`)))
    frames(2)
  }
}

describe('m09-orale-buon-stimatore: il widget', () => {
  beforeEach(() => {
    stubReducedMotion(true)
    stubFrames()
    useProgress.setState({ challenges: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('meta coerente', () => {
    expect(meta.id).toBe('m09-orale-buon-stimatore')
    expect(meta.concepts).toEqual(['c67', 'c44', 'c45', 'c47', 'c49'])
    expect(meta.scenario).toBe('telerilevamento')
  })

  it('si apre con cinque tessere nel mucchio, cinque anelli vuoti e la catena sul terreno', () => {
    render(<Widget />)
    for (const id of ORDER) expect(screen.getByText(TILES[id].text, { selector: 'button' })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot]')).toHaveLength(5)
    expect(document.querySelectorAll('[data-ring]')).toHaveLength(5)
    expect(katexErrors()).toBe(0)
  })

  it('un anello sbagliato conta un errore e la tessera torna nel mucchio', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByText(TILES.bound.text, { selector: 'button' }))
    await user.click(screen.getByLabelText(`Pezzo: ${PIECES.inf.label}`))
    expect(screen.getByText(/Quel pezzo non completa la formula/)).toBeInTheDocument()
    await user.click(screen.getByLabelText(`Pezzo: ${PIECES.sup.label}`))
    await user.click(screen.getByLabelText(/^Anello 1, vuoto/))
    expect(screen.getByText(/Anello sbagliato/)).toBeInTheDocument()
    expect(screen.getByText(TILES.bound.text, { selector: 'button' })).toBeInTheDocument()
  })

  it('i passi dello storyboard aprono le mini-simulazioni e compilano', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    for (let i = 0; i < STEPS_COUNT - 1; i++) {
      await user.click(byLabel('Passo avanti'))
      expect(katexErrors()).toBe(0)
    }
    expect(screen.getByText('Il verdetto in due righe', { selector: 'strong' })).toBeInTheDocument()
  })

  it('sfida: catena senza errori e trabocchetto giuste la superano; il cronometro parla a voce', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await buildChain(user)
    expect(screen.getByText('Il verdetto')).toBeInTheDocument()
    for (let i = 0; i < TRICKS.length; i++) {
      const b = breaks(TRICKS[i])
      const ringGroup = screen.getAllByRole('radiogroup', { name: "Si spezza l'anello" })[i]
      await user.click(within(ringGroup).getByRole('radio', { name: String(b.ring + 1) }))
      const whyGroup = screen.getAllByRole('radiogroup', { name: 'Perché' })[i]
      await user.click(within(whyGroup).getByRole('radio', { name: b.quantity === 'h' ? 'h_N non va a 0' : 'N·h_Nⁿ non va a +∞' }))
    }
    expect(document.querySelector('[data-ring="3"]')!.getAttribute('aria-label')).toMatch(/spezzato/)
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
    expect(useProgress.getState().challenges['m09-orale-buon-stimatore']).toBeDefined()
    await user.click(button('Ripeti a voce: 2 minuti'))
    frames(80, 100)
    const shown = document.querySelector('[data-speak]')?.textContent
    expect(shown).toBe('01:52')
  }, 30000)

  it('con un errore la sfida non passa', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByText(TILES.media.text, { selector: 'button' }))
    await user.click(screen.getByLabelText(`Pezzo: ${PIECES.somma.label}`))
    await buildChain(user)
    await user.click(button('Verifica'))
    expect(screen.getByText('Non ancora.')).toBeInTheDocument()
  }, 30000)
})

const STEPS_COUNT = 7
