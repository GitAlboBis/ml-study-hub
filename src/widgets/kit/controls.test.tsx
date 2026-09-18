import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import katex from 'katex'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../store/progress'
import type { WidgetMeta } from '../types'
import { Challenge } from './Challenge'
import type { ChallengeStatus } from './Challenge'
import { decimalsOf, fixed, formatValue, snapToStep } from './format'
import { LiveFormula } from './LiveFormula'
import { NumberField } from './NumberField'
import { PlayControls } from './PlayControls'
import { Readout } from './Readout'
import { Segmented } from './Segmented'
import { Slider } from './Slider'
import { StepCaption } from './StepCaption'
import { Toggle } from './Toggle'
import type { Storyboard } from './useStoryboard'
import { WidgetFrame } from './WidgetFrame'

// ---------------------------------------------------------------------------------------------
// Attrezzi di prova
// ---------------------------------------------------------------------------------------------

const META: WidgetMeta = {
  id: 'parzen-somma-kernel',
  moduleId: 'm09-parzen-windows',
  title: 'Somma dei kernel di Parzen',
  concepts: ['c01'],
  scenario: 'sensori',
  scenarioNote: 'Letture di temperatura di un sensore in serra',
  size: 'M',
}

/** jsdom non ha matchMedia: questa finta risponde solo a prefers-reduced-motion. */
function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' && matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }))
}

/** jsdom non ha la Web Animations API: la finta registra le chiamate e l'elemento su cui arrivano. */
function stubAnimate() {
  const calls: { el: Element; keyframes: Keyframe[]; options: KeyframeAnimationOptions }[] = []
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    writable: true,
    value: function animate(this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
      calls.push({ el: this, keyframes, options })
      return { currentTime: 0, cancel: () => {} }
    },
  })
  return calls
}

/** Storyboard finto: PlayControls lo riceve già pronto, qui contano solo le chiamate. */
function fakeStoryboard(over: Partial<Storyboard> = {}) {
  let progressReads = 0
  const sb: Storyboard = {
    index: 1,
    step: { id: 'kernel', label: 'Nasce un kernel per campione' },
    get progress() {
      progressReads++
      return 0.4
    },
    playing: false,
    speed: 1,
    play: vi.fn(),
    pause: vi.fn(),
    toggle: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    goto: vi.fn(),
    reset: vi.fn(),
    setSpeed: vi.fn(),
    ...over,
  }
  return { sb, progressReads: () => progressReads }
}

const STEPS = [
  { id: 'campioni', label: 'I campioni sul nastro' },
  { id: 'kernel', label: 'Nasce un kernel per campione' },
  { id: 'somma', label: 'I kernel si sommano' },
  { id: 'normalizza', label: 'La somma si normalizza' },
  { id: 'confronto', label: 'Confronto con la densità vera' },
]

beforeEach(() => {
  localStorage.clear()
  useProgress.getState().reset()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete (Element.prototype as { animate?: unknown }).animate
})

// ---------------------------------------------------------------------------------------------
// format
// ---------------------------------------------------------------------------------------------

describe('format', () => {
  it('fixed scrive i decimali fissi con il punto e non produce "-0.00"', () => {
    expect(fixed(2)(0.5)).toBe('0.50')
    expect(fixed(0)(41.6)).toBe('42')
    expect(fixed(2)(-0.001)).toBe('0.00')
    expect(fixed(1)(-1.25)).toBe('-1.3')
  })

  it('formatValue lascia passare le stringhe e nomina i valori non finiti', () => {
    expect(formatValue(0.5)).toBe('0.50')
    expect(formatValue(7, fixed(0))).toBe('7')
    expect(formatValue('salmone')).toBe('salmone')
    expect(formatValue(Number.NaN)).toBe('—')
    expect(formatValue(Number.POSITIVE_INFINITY)).toBe('∞')
    expect(formatValue(Number.NEGATIVE_INFINITY)).toBe('-∞')
  })

  it('decimalsOf conta i decimali che servono, anche con la notazione esponenziale', () => {
    expect(decimalsOf(1)).toBe(0)
    expect(decimalsOf(0.05)).toBe(2)
    expect(decimalsOf(1e-3)).toBe(3)
    expect(decimalsOf(0.1 + 0.2)).toBe(1)
  })

  it('snapToStep riporta sulla griglia dentro gli estremi, senza rumore in virgola mobile', () => {
    expect(snapToStep(0.1 + 0.2, 0, 1, 0.1)).toBe(0.3)
    expect(snapToStep(0.52, 0.05, 2, 0.05)).toBe(0.5)
    expect(snapToStep(9, 0, 2, 0.05)).toBe(2)
    expect(snapToStep(-3, 0.05, 2, 0.05)).toBe(0.05)
    // max fuori griglia: l'ultimo valore raggiungibile è quello sotto max
    expect(snapToStep(1, 0, 1, 0.3)).toBe(0.9)
    expect(snapToStep(1, 0, 1, 0.4)).toBe(0.8)
  })
})

// ---------------------------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------------------------

function SliderHarness({ initial = 0.5, onChange }: { initial?: number; onChange?: (v: number) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <Slider
      id="h"
      label="Larghezza della finestra"
      latex="h"
      min={0.05}
      max={2}
      step={0.05}
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange?.(v)
      }}
    />
  )
}

describe('Slider', () => {
  it('è un input range nativo con nome, estremi e aria-valuetext formattato', () => {
    render(<SliderHarness />)
    const slider = screen.getByRole('slider', { name: /larghezza della finestra/i })
    expect(slider).toHaveAttribute('type', 'range')
    expect(slider).toHaveAttribute('id', 'h')
    expect(slider).toHaveAttribute('min', '0.05')
    expect(slider).toHaveAttribute('max', '2')
    expect(slider).toHaveAttribute('step', '0.05')
    expect(slider).toHaveValue('0.5')
    expect(slider).toHaveAttribute('aria-valuetext', '0.50')
  })

  it('risponde alle frecce di un passo alla volta', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SliderHarness onChange={onChange} />)
    const slider = screen.getByRole('slider')
    slider.focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith(0.55)
    await user.keyboard('{ArrowUp}')
    expect(onChange).toHaveBeenLastCalledWith(0.6)
    await user.keyboard('{ArrowLeft}{ArrowDown}')
    expect(onChange).toHaveBeenLastCalledWith(0.5)
    expect(slider).toHaveAttribute('aria-valuetext', '0.50')
  })

  it('PageUp e PageDown saltano di un decimo della scala, Home e End vanno agli estremi', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SliderHarness onChange={onChange} />)
    screen.getByRole('slider').focus()
    await user.keyboard('{PageUp}')
    expect(onChange).toHaveBeenLastCalledWith(0.7)
    await user.keyboard('{PageDown}{PageDown}')
    expect(onChange).toHaveBeenLastCalledWith(0.3)
    await user.keyboard('{End}')
    expect(onChange).toHaveBeenLastCalledWith(2)
    await user.keyboard('{Home}')
    expect(onChange).toHaveBeenLastCalledWith(0.05)
  })

  it('agli estremi non chiama onChange e non accumula errori in virgola mobile', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SliderHarness initial={2} onChange={onChange} />)
    screen.getByRole('slider').focus()
    await user.keyboard('{ArrowRight}{End}')
    expect(onChange).not.toHaveBeenCalled()
    await user.keyboard('{Home}{ArrowRight}{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith(0.15)
  })

  it('mostra il valore con il formato e l unità scelti', () => {
    render(<Slider id="t" label="Temperatura" min={-10} max={40} step={0.5} value={-2.5} onChange={() => {}} format={fixed(1)} unit="°C" />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '−2.5 °C')
    expect(screen.getByText('−2.5')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------------------------
// LiveFormula
// ---------------------------------------------------------------------------------------------

describe('LiveFormula', () => {
  it('sostituisce \\val{h} con il valore formattato a due decimali', () => {
    const { container } = render(<LiveFormula tex={String.raw`V = 2\,\val{h}`} values={{ h: 0.5 }} />)
    const live = container.querySelector('.katex-html [data-val]')
    expect(live).not.toBeNull()
    expect(live).toHaveTextContent('0.50')
    expect(container.querySelector('.katex-mathml')).toHaveTextContent('0.50')
    expect(container.querySelector('.katex-error')).toBeNull()
    expect(container).not.toHaveTextContent('\\val')
  })

  it('\\val[d]{nome} sceglie i decimali; stringhe, negativi e non finiti entrano senza rompere KaTeX', () => {
    const { container } = render(
      <LiveFormula
        tex={String.raw`\frac{\val[0]{k}/\val[0]{N}}{\val[3]{V}} \quad \val{cls} \quad \val{d} \quad \val{r}`}
        values={{ k: 5, N: 40, V: 0.12345, cls: 'salmone_1', d: -1.5, r: Number.POSITIVE_INFINITY }}
      />,
    )
    // KaTeX mette nel DOM il denominatore prima del numeratore: l'ordine giusto è quello dei segnaposto (data-val)
    const texts = [...container.querySelectorAll<HTMLElement>('.katex-html [data-val]')]
      .sort((a, b) => Number(a.dataset.val) - Number(b.dataset.val))
      .map((el) => el.textContent)
    expect(texts).toEqual(['5', '40', '0.123', 'salmone_1', '−1.50', '∞'])
    expect(container.querySelector('.katex-error')).toBeNull()
  })

  it('un nome senza valore si vede come trattino, non come errore', () => {
    const { container } = render(<LiveFormula tex={String.raw`x = \val{manca}`} values={{}} />)
    expect(container.querySelector('.katex-html [data-val]')).toHaveTextContent('—')
    expect(container.querySelector('.katex-error')).toBeNull()
  })

  it('non ri-renderizza KaTeX se il valore formattato non cambia', () => {
    const spy = vi.spyOn(katex, 'renderToString')
    const tex = String.raw`\hat p(x) = \val{memo}`
    const { rerender } = render(<LiveFormula tex={tex} values={{ memo: 0.123 }} />)
    const afterMount = spy.mock.calls.length
    expect(afterMount).toBeGreaterThan(0)
    // stessi due decimali: oggetto nuovo, valore grezzo diverso, nessun lavoro per KaTeX
    rerender(<LiveFormula tex={tex} values={{ memo: 0.1234 }} />)
    rerender(<LiveFormula tex={tex} values={{ memo: 0.1249 }} />)
    expect(spy.mock.calls.length).toBe(afterMount)
    rerender(<LiveFormula tex={tex} values={{ memo: 0.2 }} />)
    expect(spy.mock.calls.length).toBe(afterMount + 1)
    // tornare a un valore già visto non costa un altro render (cache per valore formattato)
    rerender(<LiveFormula tex={tex} values={{ memo: 0.123 }} />)
    expect(spy.mock.calls.length).toBe(afterMount + 1)
  })

  it('fa lampeggiare in sola opacity, per 240 ms, soltanto i numeri cambiati', () => {
    const calls = stubAnimate()
    const tex = String.raw`\val{a} + \val{b} = \val{s}`
    const { rerender } = render(<LiveFormula tex={tex} values={{ a: 1, b: 2, s: 3 }} />)
    expect(calls).toHaveLength(0) // al montaggio niente lampeggia

    rerender(<LiveFormula tex={tex} values={{ a: 1, b: 2.5, s: 3.5 }} />)
    expect(calls.map((c) => c.el.textContent)).toEqual(['2.50', '3.50'])
    for (const c of calls) {
      expect(c.options.duration).toBe(240)
      for (const frame of c.keyframes) expect(Object.keys(frame)).toEqual(['opacity'])
      expect(c.keyframes.at(-1)).toEqual({ opacity: 1 })
    }
  })

  it('con prefers-reduced-motion i numeri cambiano senza lampeggiare', () => {
    stubReducedMotion(true)
    const calls = stubAnimate()
    const tex = String.raw`q = \val{q}`
    const { rerender, container } = render(<LiveFormula tex={tex} values={{ q: 1 }} />)
    rerender(<LiveFormula tex={tex} values={{ q: 2 }} />)
    expect(container.querySelector('.katex-html [data-val]')).toHaveTextContent('2.00')
    expect(calls).toHaveLength(0)
  })

  it('annuncia i valori solo quando si fermano (aria-live polite)', () => {
    vi.useFakeTimers()
    const tex = String.raw`h = \val{h}`
    const { rerender } = render(<LiveFormula tex={tex} values={{ h: 0.5 }} />)
    const live = screen.getByText('h = 0.50')
    expect(live.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite')
    rerender(<LiveFormula tex={tex} values={{ h: 0.6 }} />)
    rerender(<LiveFormula tex={tex} values={{ h: 0.7 }} />)
    expect(screen.queryByText('h = 0.70')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(screen.getByText('h = 0.70')).toBeInTheDocument()
    expect(screen.queryByText('h = 0.60')).toBeNull()
  })
})

// ---------------------------------------------------------------------------------------------
// PlayControls
// ---------------------------------------------------------------------------------------------

describe('PlayControls', () => {
  it('Spazio sul pulsante Play chiama toggle una volta sola', async () => {
    const user = userEvent.setup()
    const { sb } = fakeStoryboard()
    render(<PlayControls sb={sb} steps={STEPS} />)
    screen.getByRole('button', { name: 'Play' }).focus()
    await user.keyboard(' ')
    expect(sb.toggle).toHaveBeenCalledTimes(1)
  })

  it('le frecce fanno un passo avanti o indietro da qualsiasi pulsante del gruppo', async () => {
    const user = userEvent.setup()
    const { sb } = fakeStoryboard()
    render(<PlayControls sb={sb} steps={STEPS} />)
    screen.getByRole('button', { name: 'Play' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(sb.next).toHaveBeenCalledTimes(1)
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(sb.prev).toHaveBeenCalledTimes(2)
    expect(sb.toggle).not.toHaveBeenCalled()
  })

  it('i pulsanti di passo chiamano next e prev; in riproduzione il pulsante diventa Pausa', async () => {
    const user = userEvent.setup()
    const { sb } = fakeStoryboard({ playing: true })
    render(<PlayControls sb={sb} steps={STEPS} />)
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Pausa' }))
    expect(sb.toggle).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Passo avanti' }))
    await user.click(screen.getByRole('button', { name: 'Passo indietro' }))
    expect(sb.next).toHaveBeenCalledTimes(1)
    expect(sb.prev).toHaveBeenCalledTimes(1)
  })

  it('la velocità è un gruppo di radio 0.5× / 1× / 2× e le sue frecce non muovono lo storyboard', async () => {
    const user = userEvent.setup()
    const { sb } = fakeStoryboard()
    render(<PlayControls sb={sb} steps={STEPS} />)
    const group = screen.getByRole('radiogroup', { name: 'Velocità' })
    expect(within(group).getByRole('radio', { name: '1×' })).toBeChecked()
    await user.click(within(group).getByRole('radio', { name: '2×' }))
    expect(sb.setSpeed).toHaveBeenLastCalledWith(2)
    await user.keyboard('{ArrowLeft}')
    expect(sb.next).not.toHaveBeenCalled()
    expect(sb.prev).not.toHaveBeenCalled()
  })

  it('l indicatore mostra il passo corrente, segna la tacca e salta al passo cliccato', async () => {
    const user = userEvent.setup()
    const { sb } = fakeStoryboard()
    render(<PlayControls sb={sb} steps={STEPS} />)
    expect(screen.getByText('02/05')).toBeInTheDocument()
    const ticks = screen.getAllByRole('button', { name: /^Vai al passo/ })
    expect(ticks).toHaveLength(5)
    expect(ticks[1]).toHaveAttribute('aria-current', 'step')
    expect(ticks[0]).not.toHaveAttribute('aria-current')
    // le tacche non allungano il giro del Tab: da tastiera si usano i pulsanti di passo e le frecce
    for (const t of ticks) expect(t).toHaveAttribute('tabindex', '-1')
    await user.click(ticks[3])
    expect(sb.goto).toHaveBeenLastCalledWith(3)
  })

  it('non legge sb.progress: leggerlo iscriverebbe il widget a un render per fotogramma', () => {
    const { sb, progressReads } = fakeStoryboard()
    render(<PlayControls sb={sb} steps={STEPS} />)
    expect(progressReads()).toBe(0)
  })

  it('senza l elenco dei passi mostra solo il numero del passo', () => {
    const { sb } = fakeStoryboard()
    render(<PlayControls sb={sb} />)
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /^Vai al passo/ })).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------------------------
// Toggle, Segmented, NumberField, Readout, StepCaption
// ---------------------------------------------------------------------------------------------

describe('Toggle', () => {
  it('è un interruttore nativo: clic e Spazio lo commutano', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    function Harness() {
      const [on, setOn] = useState(false)
      return (
        <Toggle
          id="vera"
          label="Mostra la densità vera"
          checked={on}
          onChange={(v) => {
            setOn(v)
            onChange(v)
          }}
        />
      )
    }
    render(<Harness />)
    const sw = screen.getByRole('switch', { name: 'Mostra la densità vera' })
    expect(sw).not.toBeChecked()
    await user.click(sw)
    expect(onChange).toHaveBeenLastCalledWith(true)
    expect(sw).toBeChecked()
    sw.focus()
    await user.keyboard(' ')
    expect(onChange).toHaveBeenLastCalledWith(false)
  })
})

describe('Segmented', () => {
  const OPTIONS = [
    { value: 'rettangolare', label: 'Rettangolare' },
    { value: 'gaussiano', label: 'Gaussiano' },
    { value: 'triangolare', label: 'Triangolare' },
  ] as const
  type Kernel = (typeof OPTIONS)[number]['value']

  it('è un gruppo di radio: clic e frecce scelgono il valore', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn<(v: Kernel) => void>()
    function Harness() {
      const [k, setK] = useState<Kernel>('gaussiano')
      return (
        <Segmented
          id="kernel"
          label="Kernel"
          options={OPTIONS}
          value={k}
          onChange={(v) => {
            setK(v)
            onChange(v)
          }}
        />
      )
    }
    render(<Harness />)
    const group = screen.getByRole('radiogroup', { name: 'Kernel' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
    expect(within(group).getByRole('radio', { name: 'Gaussiano' })).toBeChecked()
    await user.click(within(group).getByRole('radio', { name: 'Rettangolare' }))
    expect(onChange).toHaveBeenLastCalledWith('rettangolare')
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith('triangolare')
    expect(within(group).getByRole('radio', { name: 'Triangolare' })).toBeChecked()
  })
})

describe('NumberField', () => {
  function Harness({ onChange }: { onChange: (v: number) => void }) {
    const [n, setN] = useState(20)
    return (
      <NumberField
        id="n"
        label="Numero di campioni"
        min={5}
        max={200}
        step={5}
        value={n}
        onChange={(v) => {
          setN(v)
          onChange(v)
        }}
      />
    )
  }

  it('accetta cifre da tastiera, le riporta negli estremi e sulla griglia dei passi', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const field = screen.getByRole('spinbutton', { name: 'Numero di campioni' })
    expect(field).toHaveValue(20)
    await user.clear(field)
    expect(onChange).not.toHaveBeenCalled() // campo vuoto: si aspetta un numero
    await user.type(field, '47')
    expect(onChange).toHaveBeenLastCalledWith(45)
    expect(field).toHaveValue(47) // mentre si scrive resta ciò che si è scritto
    await user.tab()
    expect(field).toHaveValue(45) // all'uscita compare il valore accettato
    await user.clear(field)
    await user.type(field, '900')
    expect(onChange).toHaveBeenLastCalledWith(200)
  })

  it('frecce e pulsanti più e meno muovono di un passo e si fermano agli estremi', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const field = screen.getByRole('spinbutton')
    field.focus()
    await user.keyboard('{ArrowUp}')
    expect(onChange).toHaveBeenLastCalledWith(25)
    await user.click(screen.getByRole('button', { name: 'Diminuisci Numero di campioni' }))
    await user.click(screen.getByRole('button', { name: 'Diminuisci Numero di campioni' }))
    expect(onChange).toHaveBeenLastCalledWith(15)
    await user.click(screen.getByRole('button', { name: 'Aumenta Numero di campioni' }))
    expect(onChange).toHaveBeenLastCalledWith(20)
    field.focus()
    await user.keyboard('{Home}')
    expect(onChange).toHaveBeenLastCalledWith(5)
    expect(screen.getByRole('button', { name: 'Diminuisci Numero di campioni' })).toBeDisabled()
  })
})

describe('Readout', () => {
  it('mostra subito il valore e lo annuncia (aria-live polite) solo quando si ferma', () => {
    vi.useFakeTimers()
    const { rerender } = render(<Readout label="Stima" value={0.1837} format={fixed(4)} />)
    const out = screen.getByRole('status')
    expect(out).toHaveAttribute('aria-live', 'polite')
    expect(within(out).getByText('0.1837')).toBeInTheDocument()
    expect(within(out).getByText('Stima: 0.1837')).toBeInTheDocument()

    rerender(<Readout label="Stima" value={0.25} format={fixed(4)} />)
    expect(within(out).getByText('0.2500')).toBeInTheDocument()
    expect(within(out).getByText('Stima: 0.1837')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(within(out).getByText('Stima: 0.2500')).toBeInTheDocument()
  })

  it('formato predefinito a due decimali, stringhe lasciate come sono, unità accanto', () => {
    render(
      <>
        <Readout label="Errore" value={-0.5} unit="cm" />
        <Readout label="Classe" value="spigola" />
      </>,
    )
    expect(screen.getByText('−0.50')).toBeInTheDocument()
    expect(screen.getByText('Errore: −0.50 cm')).toBeInTheDocument()
    expect(screen.getByText('spigola')).toBeInTheDocument()
  })
})

describe('StepCaption', () => {
  it('dice a che passo siamo, con la sua etichetta, in una regione aria-live', () => {
    render(<StepCaption index={1} total={5} label="Nasce un kernel per campione" text="Ogni campione porta una collina di larghezza $h$." />)
    const caption = screen.getByText('Nasce un kernel per campione').closest('[aria-live]')
    expect(caption).toHaveAttribute('aria-live', 'polite')
    expect(caption).toHaveTextContent('Passo 2 di 5')
    expect(caption).toHaveTextContent('Ogni campione porta una collina')
    expect(caption?.querySelector('.katex')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------------------------
// Challenge
// ---------------------------------------------------------------------------------------------

describe('Challenge', () => {
  it('Verifica chiama onCheck; finché lo stato non è ok non registra nulla', async () => {
    const user = userEvent.setup()
    const onCheck = vi.fn()
    const { rerender } = render(<Challenge widgetId="w-prova" prompt="Trova $h$ che minimizza l'errore." status="idle" onCheck={onCheck} />)
    expect(screen.getByText(/che minimizza/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Verifica' }))
    expect(onCheck).toHaveBeenCalledTimes(1)
    rerender(<Challenge widgetId="w-prova" prompt="Trova $h$ che minimizza l'errore." status="ko" onCheck={onCheck} />)
    expect(screen.getByRole('status')).toHaveTextContent('Non ancora')
    expect(useProgress.getState().challenges).toEqual({})
  })

  it('con stato ok registra il completamento una volta, con l id del widget del WidgetFrame', () => {
    const { rerender } = render(
      <WidgetFrame meta={META} challenge={<Challenge prompt="Trova h." status="idle" onCheck={() => {}} />}>
        <svg />
      </WidgetFrame>,
    )
    expect(useProgress.getState().challenges[META.id]).toBeUndefined()
    rerender(
      <WidgetFrame meta={META} challenge={<Challenge prompt="Trova h." status="ok" onCheck={() => {}} />}>
        <svg />
      </WidgetFrame>,
    )
    const at = useProgress.getState().challenges[META.id]
    expect(at).toBeTypeOf('number')
    expect(screen.getByRole('status')).toHaveTextContent('Sfida superata')
    // un altro giro idle → ok non sposta la data del primo completamento
    rerender(
      <WidgetFrame meta={META} challenge={<Challenge prompt="Trova h." status="idle" onCheck={() => {}} />}>
        <svg />
      </WidgetFrame>,
    )
    rerender(
      <WidgetFrame meta={META} challenge={<Challenge prompt="Trova h." status="ok" onCheck={() => {}} />}>
        <svg />
      </WidgetFrame>,
    )
    expect(useProgress.getState().challenges[META.id]).toBe(at)
  })

  it('l indizio si apre a richiesta con un pulsante che dichiara il suo stato', async () => {
    const user = userEvent.setup()
    render(<Challenge widgetId="w-prova" prompt="Trova h." hint="Guarda dove l'errore smette di scendere." status="ko" onCheck={() => {}} />)
    const toggle = screen.getByRole('button', { name: 'Indizio' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/smette di scendere/)).toBeNull()
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/smette di scendere/)).toBeInTheDocument()
  })

  it('una sfida già superata in passato lo dice', () => {
    useProgress.getState().completeChallenge('w-prova', new Date(2026, 8, 14, 10).getTime())
    render(<Challenge widgetId="w-prova" prompt="Trova h." status="idle" onCheck={() => {}} />)
    expect(screen.getByText(/già superata/i)).toHaveTextContent('14/09/2026')
  })
})

// ---------------------------------------------------------------------------------------------
// WidgetFrame
// ---------------------------------------------------------------------------------------------

describe('WidgetFrame', () => {
  it('ha titolo, scenario con la dicitura "dati sintetici", area visuale, comandi, didascalia e sfida', () => {
    render(
      <WidgetFrame
        meta={META}
        controls={<button type="button">Un comando</button>}
        transport={<button type="button">Un trasporto</button>}
        caption={<p>Una didascalia</p>}
        challenge={<p>Una sfida</p>}
      >
        <svg data-testid="terreno" />
      </WidgetFrame>,
    )
    const frame = screen.getByRole('region', { name: META.title })
    expect(frame).toHaveAttribute('data-widget', META.id)
    expect(within(frame).getByRole('heading', { name: META.title })).toBeInTheDocument()
    expect(within(frame).getByText(/dati sintetici/i)).toBeInTheDocument()
    expect(within(frame).getByText(/sensori/i)).toBeInTheDocument()
    expect(within(frame).getByText(META.scenarioNote)).toBeInTheDocument()
    expect(within(frame).getByTestId('terreno')).toBeInTheDocument()
    expect(within(within(frame).getByRole('group', { name: 'Comandi' })).getByRole('button', { name: 'Un comando' })).toBeInTheDocument()
    expect(within(frame).getByRole('button', { name: 'Un trasporto' })).toBeInTheDocument()
    expect(within(frame).getByText('Una didascalia')).toBeInTheDocument()
    expect(within(frame).getByText('Una sfida')).toBeInTheDocument()
  })

  it('l area visuale rispetta il rapporto chiesto', () => {
    render(
      <WidgetFrame meta={META} aspect={2}>
        <svg data-testid="terreno" />
      </WidgetFrame>,
    )
    expect(screen.getByTestId('terreno').parentElement).toHaveStyle({ aspectRatio: '2' })
  })

  it('senza comandi, didascalia o sfida non lascia riquadri vuoti', () => {
    render(
      <WidgetFrame meta={META}>
        <svg />
      </WidgetFrame>,
    )
    expect(screen.queryByRole('group', { name: 'Comandi' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull()
  })

  it('Reset compare solo se c è onReset e lo chiama', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    render(
      <WidgetFrame meta={META} onReset={onReset}>
        <svg />
      </WidgetFrame>,
    )
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('schermo intero: dove manca l API del browser il riquadro si espande sulla pagina ed Esc lo chiude', async () => {
    const user = userEvent.setup()
    render(
      <WidgetFrame meta={META}>
        <svg />
      </WidgetFrame>,
    )
    const frame = screen.getByRole('region', { name: META.title })
    const button = screen.getByRole('button', { name: 'Schermo intero' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(frame).toHaveAttribute('data-expanded', 'true')
    expect(document.documentElement.style.overflow).toBe('hidden')
    await user.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(frame).not.toHaveAttribute('data-expanded')
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('schermo intero: se il browser ha l API la usa, e segue fullscreenchange', async () => {
    const user = userEvent.setup()
    render(
      <WidgetFrame meta={META}>
        <svg />
      </WidgetFrame>,
    )
    const frame = screen.getByRole('region', { name: META.title })
    let current: Element | null = null
    const request = vi.fn(() => {
      current = frame
      document.dispatchEvent(new Event('fullscreenchange'))
      return Promise.resolve()
    })
    const exit = vi.fn(() => {
      current = null
      document.dispatchEvent(new Event('fullscreenchange'))
      return Promise.resolve()
    })
    Object.defineProperty(frame, 'requestFullscreen', { configurable: true, value: request })
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, get: () => true })
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => current })
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit })
    try {
      const button = screen.getByRole('button', { name: 'Schermo intero' })
      await user.click(button)
      expect(request).toHaveBeenCalledTimes(1)
      expect(button).toHaveAttribute('aria-pressed', 'true')
      await user.click(button)
      expect(exit).toHaveBeenCalledTimes(1)
      expect(button).toHaveAttribute('aria-pressed', 'false')
    } finally {
      for (const key of ['fullscreenEnabled', 'fullscreenElement', 'exitFullscreen'] as const) {
        delete (document as unknown as Record<string, unknown>)[key]
      }
    }
  })
})

// ---------------------------------------------------------------------------------------------
// Regressioni della revisione del kit (2026-09-18)
// ---------------------------------------------------------------------------------------------

/** Classi da filetto laterale (border-l, border-l-2…): nel mondo dell'atlante non esistono bordi colorati a sinistra. */
const LEFT_RULE = /(^|\s)border-l(-\d+)?(\s|$)/

/** Registra ogni cambiamento dentro una regione viva, come la vedrebbe un lettore di schermo. */
function watch(region: Element) {
  let seen = 0
  const observer = new MutationObserver((records) => {
    seen += records.length
  })
  observer.observe(region, { subtree: true, childList: true, characterData: true, attributes: true })
  return () => {
    seen += observer.takeRecords().length
    observer.disconnect()
    return seen
  }
}

describe('Challenge: ogni verifica si sente', () => {
  function Harness({ hint }: { hint?: string }) {
    const [status, setStatus] = useState<ChallengeStatus>('idle')
    return <Challenge widgetId="w-prova" prompt="Trova h." hint={hint} status={status} onCheck={() => setStatus('ko')} />
  }

  it('un secondo Verifica ancora sbagliato riscrive la regione di stato, quindi viene annunciato di nuovo', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const verify = screen.getByRole('button', { name: 'Verifica' })
    await user.click(verify)
    const region = screen.getByRole('status')
    expect(region).toHaveTextContent('Non ancora')
    const stop = watch(region)
    await user.click(verify)
    expect(stop()).toBeGreaterThan(0)
    expect(region).toHaveTextContent('Non ancora')
  })

  it("aprire l'indizio non tocca l'esito già annunciato", async () => {
    const user = userEvent.setup()
    render(<Harness hint="Guarda dove l'errore smette di scendere." />)
    await user.click(screen.getByRole('button', { name: 'Verifica' }))
    const region = screen.getByRole('status')
    const before = region.textContent
    const stop = watch(region)
    await user.click(screen.getByRole('button', { name: 'Indizio' }))
    expect(stop()).toBe(0)
    expect(region.textContent).toBe(before)
  })

  it("l'indizio aperto non porta un filetto colorato a sinistra", async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness hint="Guarda dove l'errore smette di scendere." />)
    await user.click(screen.getByRole('button', { name: 'Indizio' }))
    expect(screen.getByText(/smette di scendere/)).toBeVisible()
    for (const el of container.querySelectorAll('*')) expect(el.getAttribute('class') ?? '').not.toMatch(LEFT_RULE)
  })
})

describe('Readout in evidenza', () => {
  it('lo dice con lo spillo e a parole, non con il solo colore di un filetto a sinistra', () => {
    const { container, rerender } = render(<Readout label="Stima" value={0.2} />)
    expect(container.querySelector('[data-pin]')).toBeNull()
    expect(screen.getByRole('status')).not.toHaveTextContent(/in evidenza/)
    rerender(<Readout label="Stima" value={0.2} pinned />)
    const pin = container.querySelector('[data-pin]')
    expect(pin).not.toBeNull()
    expect(pin).toHaveClass('bg-pin')
    expect(screen.getByRole('status')).toHaveTextContent(/in evidenza/)
    for (const el of container.querySelectorAll('*')) expect(el.getAttribute('class') ?? '').not.toMatch(LEFT_RULE)
  })
})

describe('PlayControls: bersagli', () => {
  it('le tacche dei passi sono alte 40 px, anche se il segno resta sottile', () => {
    const { sb } = fakeStoryboard()
    render(<PlayControls sb={sb} steps={STEPS} />)
    for (const t of screen.getAllByRole('button', { name: /^Vai al passo/ })) {
      expect(t).toHaveClass('h-10')
      expect(t).not.toHaveClass('h-6')
    }
  })
})

describe('WidgetFrame: schermo intero di ripiego', () => {
  it('il resto della pagina diventa inerte, il Tab resta nel riquadro e all uscita il fuoco torna al pulsante', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">prima</button>
        <WidgetFrame meta={META} controls={<button type="button">comando</button>}>
          <svg />
        </WidgetFrame>
        <button type="button">sotto il riquadro</button>
      </>,
    )
    const frame = screen.getByRole('region', { name: META.title })
    const toggle = screen.getByRole('button', { name: 'Schermo intero' })
    await user.click(toggle)
    expect(frame).toHaveAttribute('data-expanded', 'true')

    // i lettori di schermo e il Tab non devono arrivare ai contenuti coperti dal riquadro
    for (const name of ['prima', 'sotto il riquadro']) expect(screen.getByRole('button', { name, hidden: true }).closest('[inert]')).not.toBeNull()
    expect(frame.closest('[inert]')).toBeNull()
    for (let i = 0; i < 4; i++) {
      await user.tab()
      expect(frame.contains(document.activeElement)).toBe(true)
    }
    await user.tab({ shift: true })
    expect(frame.contains(document.activeElement)).toBe(true)

    screen.getByRole('button', { name: 'comando' }).focus()
    await user.keyboard('{Escape}')
    expect(frame).not.toHaveAttribute('data-expanded')
    expect(document.querySelector('[inert]')).toBeNull()
    expect(toggle).toHaveFocus()
  })
})
