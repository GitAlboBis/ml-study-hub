import { act, cleanup, render, renderHook } from '@testing-library/react'
import { jsx } from 'react/jsx-runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnimationFrame } from './useAnimationFrame'
import { useReducedMotion } from './useReducedMotion'
import { useStoryboard } from './useStoryboard'
import type { StoryboardOptions, StoryboardStep } from './useStoryboard'
import { WidgetFrame } from './WidgetFrame'
import type { WidgetMeta } from '../types'

// ---------------------------------------------------------------------------------------------
// Attrezzi di prova
// ---------------------------------------------------------------------------------------------

/** jsdom non ha matchMedia: questa finta risponde a prefers-reduced-motion e il test la cambia a runtime. */
function stubReducedMotion(initial: boolean) {
  let matches = initial
  const listeners = new Set<() => void>()
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query === '(prefers-reduced-motion: reduce)' && matches
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, fn: () => void) => void listeners.add(fn),
    removeEventListener: (_type: string, fn: () => void) => void listeners.delete(fn),
    addListener: (fn: () => void) => void listeners.add(fn),
    removeListener: (fn: () => void) => void listeners.delete(fn),
    dispatchEvent: () => true,
  }))
  return {
    set(value: boolean) {
      matches = value
      for (const fn of [...listeners]) fn()
    },
    listeners: () => listeners.size,
  }
}

/**
 * requestAnimationFrame simulato: i fotogrammi scattano solo quando il test lo chiede, all'istante che
 * il test decide. L'orologio non parte da zero, come performance.now() in una pagina già aperta.
 */
function stubFrames() {
  let now = 1000
  let nextId = 1
  const pending = new Map<number, FrameRequestCallback>()
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    pending.set(nextId, cb)
    return nextId++
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => void pending.delete(id))
  return {
    /** Fa passare `ms` e poi scatta un fotogramma. */
    frame(ms: number) {
      now += ms
      const due = [...pending.values()]
      pending.clear()
      act(() => {
        for (const cb of due) cb(now)
      })
    },
    /** Il tempo passa senza fotogrammi: scheda nascosta oppure thread bloccato. */
    wait(ms: number) {
      now += ms
    },
    pending: () => pending.size,
  }
}

/** Nasconde o mostra la scheda come fa il browser: document.hidden più l'evento visibilitychange. */
function setTabHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') })
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  // tolte le proprietà del test, tornano i getter del prototipo (scheda visibile)
  Reflect.deleteProperty(document, 'hidden')
  Reflect.deleteProperty(document, 'visibilityState')
})

// ---------------------------------------------------------------------------------------------
// useReducedMotion
// ---------------------------------------------------------------------------------------------

describe('useReducedMotion', () => {
  it('senza matchMedia (jsdom, browser vecchi) vale false', () => {
    expect(renderHook(() => useReducedMotion()).result.current).toBe(false)
  })

  it('legge la preferenza di sistema', () => {
    stubReducedMotion(true)
    expect(renderHook(() => useReducedMotion()).result.current).toBe(true)
  })

  it('segue la preferenza quando cambia a pagina aperta e smette di ascoltare allo smontaggio', () => {
    const media = stubReducedMotion(false)
    const { result, unmount } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => media.set(true))
    expect(result.current).toBe(true)
    unmount()
    expect(media.listeners()).toBe(0)
  })
})

// ---------------------------------------------------------------------------------------------
// useAnimationFrame
// ---------------------------------------------------------------------------------------------

describe('useAnimationFrame', () => {
  /** Monta l'hook con un callback che annota le chiamate come coppie [dtMs, tMs]. */
  function mount(active = true) {
    const calls: [number, number][] = []
    const cb = (dtMs: number, tMs: number) => {
      calls.push([dtMs, tMs])
    }
    const hook = renderHook((props: { active: boolean }) => useAnimationFrame(cb, props.active), { initialProps: { active } })
    return { calls, ...hook }
  }

  it('passa al callback il tempo dal fotogramma precedente e il tempo attivo accumulato', () => {
    const frames = stubFrames()
    const { calls } = mount()
    frames.frame(16)
    frames.frame(16)
    frames.frame(20)
    expect(calls).toEqual([[0, 0], [16, 16], [20, 36]])
  })

  it('da spento non chiede fotogrammi', () => {
    const frames = stubFrames()
    mount(false)
    expect(frames.pending()).toBe(0)
  })

  it('quando active passa a false annulla il fotogramma in attesa', () => {
    const frames = stubFrames()
    const { calls, rerender } = mount()
    frames.frame(16)
    rerender({ active: false })
    expect(frames.pending()).toBe(0)
    frames.frame(16)
    expect(calls).toEqual([[0, 0]])
  })

  it('dopo una pausa il tempo attivo riprende da dove era, senza contare la pausa', () => {
    const frames = stubFrames()
    const { calls, rerender } = mount()
    frames.frame(16)
    frames.frame(16)
    rerender({ active: false })
    frames.wait(5000)
    rerender({ active: true })
    frames.frame(16)
    frames.frame(16)
    expect(calls).toEqual([[0, 0], [16, 16], [0, 16], [16, 32]])
  })

  it('chiama sempre l’ultimo callback ricevuto, senza far ripartire il ciclo', () => {
    const frames = stubFrames()
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook((props: { cb: (dtMs: number, tMs: number) => void }) => useAnimationFrame(props.cb, true), {
      initialProps: { cb: first },
    })
    frames.frame(16)
    rerender({ cb: second })
    expect(frames.pending()).toBe(1)
    frames.frame(16)
    expect(first).toHaveBeenCalledTimes(1)
    // dt = 16 e non 0: il fotogramma di riferimento non è stato rifatto
    expect(second.mock.calls).toEqual([[16, 16]])
  })

  it('a scheda nascosta si ferma e al ritorno riprende senza salto di tempo', () => {
    const frames = stubFrames()
    const { calls } = mount()
    frames.frame(16)
    frames.frame(16)
    setTabHidden(true)
    expect(frames.pending()).toBe(0)
    frames.wait(60_000)
    setTabHidden(false)
    expect(frames.pending()).toBe(1)
    frames.frame(16)
    frames.frame(16)
    expect(calls).toEqual([[0, 0], [16, 16], [0, 16], [16, 32]])
  })

  it('montato a scheda nascosta aspetta che torni visibile', () => {
    const frames = stubFrames()
    setTabHidden(true)
    mount()
    expect(frames.pending()).toBe(0)
    setTabHidden(false)
    expect(frames.pending()).toBe(1)
  })

  it('un fotogramma in forte ritardo conta al massimo 100 ms', () => {
    const frames = stubFrames()
    const { calls } = mount()
    frames.frame(16)
    frames.wait(3000)
    frames.frame(16)
    expect(calls).toEqual([[0, 0], [100, 100]])
  })

  it('allo smontaggio annulla il fotogramma e smette di ascoltare la visibilità', () => {
    const frames = stubFrames()
    const { unmount } = mount()
    unmount()
    expect(frames.pending()).toBe(0)
    setTabHidden(true)
    setTabHidden(false)
    expect(frames.pending()).toBe(0)
  })
})

// ---------------------------------------------------------------------------------------------
// useStoryboard
// ---------------------------------------------------------------------------------------------

// Qui i timer sono quelli finti di vitest, che simulano anche requestAnimationFrame: un fotogramma
// ogni 16 ms. Il primo fotogramma dopo play() fa solo da riferimento, quindi un passo di 1000 ms
// finisce tra 1000 e 1032 ms dopo il play: i test guardano 50 ms prima e 50 ms dopo il confine.
describe('useStoryboard', () => {
  const STEPS: StoryboardStep[] = [
    { id: 'campioni', label: 'Le misure cadono sul nastro', durationMs: 1000 },
    { id: 'kernel', label: 'Nasce un kernel per campione', durationMs: 2000 },
    { id: 'somma', label: 'I kernel si sommano', durationMs: 500 },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    cleanup() // smonta con i timer ancora finti: il fotogramma in attesa va annullato lì
    vi.useRealTimers()
  })

  /**
   * Monta lo storyboard come farebbe un widget distratto: passi e opzioni ricreati a ogni render.
   * `renders()` conta i render del componente che possiede l'hook.
   */
  function mount(opts?: StoryboardOptions, steps: StoryboardStep[] = STEPS) {
    let renders = 0
    const hook = renderHook(
      (props: { steps: StoryboardStep[] }) => {
        renders++
        return useStoryboard(
          props.steps.map((step) => ({ ...step })),
          opts ? { ...opts } : undefined,
        )
      },
      { initialProps: { steps } },
    )
    return { ...hook, sb: () => hook.result.current, renders: () => renders }
  }
  const advance = (ms: number) => {
    act(() => {
      vi.advanceTimersByTime(ms)
    })
  }
  /**
   * Come advance(), ma un fotogramma (16 ms) per act: dentro un solo act React accorpa gli aggiornamenti
   * di tutti i fotogrammi in un render, e i test sul numero di render non vedrebbero nulla.
   */
  const advanceFrameByFrame = (ms: number) => {
    for (let t = 0; t < ms; t += 16) advance(16)
  }

  it('parte fermo sul primo passo, a velocità 1', () => {
    const { sb } = mount()
    expect(sb().index).toBe(0)
    expect(sb().step).toMatchObject({ id: 'campioni', label: 'Le misure cadono sul nastro' })
    expect(sb().progress).toBe(0)
    expect(sb().playing).toBe(false)
    expect(sb().speed).toBe(1)
    advance(5000)
    expect(sb().index).toBe(0)
  })

  it('dopo play() e la durata del passo l’indice passa a 1', () => {
    const { sb } = mount()
    act(() => sb().play())
    expect(sb().playing).toBe(true)
    advance(950)
    expect(sb().index).toBe(0)
    advance(100)
    expect(sb().index).toBe(1)
    expect(sb().step.id).toBe('kernel')
  })

  it('autoplay parte da solo', () => {
    const { sb } = mount({ autoplay: true })
    expect(sb().playing).toBe(true)
    advance(1050)
    expect(sb().index).toBe(1)
  })

  it('pause() ferma il tempo e play() riprende dal punto in cui era', () => {
    const { sb } = mount()
    act(() => sb().play())
    advance(600)
    act(() => sb().pause())
    expect(sb().playing).toBe(false)
    advance(10_000)
    expect(sb().index).toBe(0)
    act(() => sb().play())
    advance(300)
    expect(sb().index).toBe(0)
    advance(200)
    expect(sb().index).toBe(1)
  })

  it('toggle() alterna play e pausa', () => {
    const { sb } = mount()
    act(() => sb().toggle())
    expect(sb().playing).toBe(true)
    act(() => sb().toggle())
    expect(sb().playing).toBe(false)
  })

  it('senza loop si ferma alla fine dell’ultimo passo, con progress a 1', () => {
    const { sb } = mount()
    act(() => sb().play())
    advance(3700)
    expect(sb().index).toBe(2)
    expect(sb().playing).toBe(false)
    expect(sb().progress).toBe(1)
  })

  it('play() a storyboard finito ricomincia dal primo passo', () => {
    const { sb } = mount()
    act(() => sb().play())
    advance(3700)
    act(() => sb().play())
    expect(sb().index).toBe(0)
    expect(sb().progress).toBe(0)
    expect(sb().playing).toBe(true)
  })

  it('con loop dopo l’ultimo passo torna a 0 e continua', () => {
    const { sb } = mount({ loop: true })
    act(() => sb().play())
    advance(3400)
    expect(sb().index).toBe(2)
    advance(200)
    expect(sb().index).toBe(0)
    expect(sb().playing).toBe(true)
  })

  it('speed: 2 dimezza i tempi', () => {
    const { sb } = mount({ speed: 2 })
    expect(sb().speed).toBe(2)
    act(() => sb().play())
    advance(450)
    expect(sb().index).toBe(0)
    advance(100)
    expect(sb().index).toBe(1)
  })

  it('setSpeed() cambia la velocità in corsa', () => {
    const { sb } = mount()
    act(() => sb().play())
    act(() => sb().setSpeed(0.5))
    expect(sb().speed).toBe(0.5)
    advance(1900)
    expect(sb().index).toBe(0)
    advance(200)
    expect(sb().index).toBe(1)
  })

  it('setSpeed() ignora i valori senza senso', () => {
    const { sb } = mount()
    for (const bad of [0, -2, Number.NaN, Number.POSITIVE_INFINITY]) act(() => sb().setSpeed(bad))
    expect(sb().speed).toBe(1)
  })

  it('prev() non scende sotto 0, next() non supera l’ultimo passo, goto() resta nei limiti', () => {
    const { sb } = mount()
    act(() => sb().prev())
    expect(sb().index).toBe(0)
    for (let i = 0; i < 5; i++) act(() => sb().next())
    expect(sb().index).toBe(2)
    act(() => sb().goto(1))
    expect(sb().index).toBe(1)
    act(() => sb().goto(99))
    expect(sb().index).toBe(2)
    act(() => sb().goto(-5))
    expect(sb().index).toBe(0)
    act(() => sb().goto(1.9))
    expect(sb().index).toBe(1)
    act(() => sb().goto(Number.NaN))
    expect(sb().index).toBe(1)
  })

  it('next() fa ripartire da zero il tempo del nuovo passo', () => {
    const { sb } = mount()
    act(() => sb().play())
    advance(500)
    act(() => sb().next())
    expect(sb().index).toBe(1)
    expect(sb().progress).toBe(0)
    advance(1950)
    expect(sb().index).toBe(1)
    advance(100)
    expect(sb().index).toBe(2)
  })

  it('reset() torna al primo passo e si ferma', () => {
    const { sb } = mount()
    act(() => sb().play())
    advance(1500)
    expect(sb().index).toBe(1)
    act(() => sb().reset())
    expect(sb().index).toBe(0)
    expect(sb().progress).toBe(0)
    expect(sb().playing).toBe(false)
    advance(5000)
    expect(sb().index).toBe(0)
  })

  it('chi legge progress lo vede salire da 0 a 1 dentro il passo, un render per fotogramma', () => {
    const { sb, renders } = mount()
    expect(sb().progress).toBe(0)
    act(() => sb().play())
    const before = renders()
    advanceFrameByFrame(512)
    expect(sb().progress).toBeCloseTo(0.5, 1)
    expect(renders() - before).toBeGreaterThan(25)
  })

  it('chi non legge progress non viene ri-renderizzato a ogni fotogramma, solo al cambio di passo', () => {
    const { sb, renders } = mount()
    act(() => sb().play())
    const before = renders()
    advanceFrameByFrame(944) // una sessantina di fotogrammi dentro il primo passo
    expect(renders()).toBe(before)
    advanceFrameByFrame(112)
    expect(sb().index).toBe(1)
    expect(renders()).toBe(before + 1)
  })

  it('onFrame riceve progress e indice a ogni fotogramma senza passare da React', () => {
    const seen: [number, number][] = []
    const { sb, renders } = mount({
      onFrame: (progress, index) => {
        seen.push([progress, index])
      },
    })
    expect(seen).toEqual([[0, 0]]) // stato iniziale, per chi disegna a mano
    act(() => sb().play())
    const before = renders()
    advanceFrameByFrame(512)
    expect(renders()).toBe(before)
    expect(seen.length).toBeGreaterThan(25)
    expect(seen.at(-1)?.[0]).toBeCloseTo(0.5, 1)
    expect(seen.at(-1)?.[1]).toBe(0)
    act(() => sb().goto(2))
    expect(seen.at(-1)).toEqual([0, 2])
  })

  it('a scheda nascosta il tempo dello storyboard non scorre', () => {
    const { sb } = mount()
    act(() => sb().play())
    advance(500)
    setTabHidden(true)
    advance(10_000)
    expect(sb().index).toBe(0)
    setTabHidden(false)
    advance(450)
    expect(sb().index).toBe(0)
    advance(150)
    expect(sb().index).toBe(1)
  })

  it('un nuovo render con gli stessi passi non tocca indice e tempo', () => {
    const { sb, rerender } = mount()
    act(() => sb().play())
    advance(600)
    rerender({ steps: STEPS })
    advance(350)
    expect(sb().index).toBe(0)
    advance(100)
    expect(sb().index).toBe(1)
  })

  it('sotto StrictMode (effetti montati due volte, come nell’app) il tempo scorre una volta sola', () => {
    const { result } = renderHook(() => useStoryboard(STEPS, { autoplay: true }), { reactStrictMode: true })
    advance(950)
    expect(result.current.index).toBe(0)
    advance(100)
    expect(result.current.index).toBe(1)
  })

  it('se i passi diminuiscono l’indice resta dentro l’elenco', () => {
    const { sb, rerender } = mount()
    act(() => sb().goto(2))
    rerender({ steps: STEPS.slice(0, 2) })
    expect(sb().index).toBe(1)
    expect(sb().step.id).toBe('kernel')
  })

  it('senza passi resta fermo e non lancia', () => {
    const { sb } = mount(undefined, [])
    expect(sb().index).toBe(0)
    expect(sb().step).toEqual({ id: '', label: '' })
    act(() => sb().play())
    expect(sb().playing).toBe(false)
  })

  it('passi di durata zero con loop non bloccano il fotogramma', () => {
    const zero: StoryboardStep[] = [
      { id: 'a', label: 'A', durationMs: 0 },
      { id: 'b', label: 'B', durationMs: 0 },
    ]
    const { sb } = mount({ loop: true }, zero)
    act(() => sb().play())
    advance(100)
    expect(sb().playing).toBe(true)
    expect(sb().progress).toBe(1)
  })

  describe('con prefers-reduced-motion', () => {
    beforeEach(() => {
      stubReducedMotion(true)
    })

    it('autoplay è ignorato e progress vale subito 1', () => {
      const { sb } = mount({ autoplay: true })
      expect(sb().playing).toBe(false)
      expect(sb().progress).toBe(1)
      advance(5000)
      expect(sb().index).toBe(0)
    })

    it('progress salta a 1 a ogni passo', () => {
      const { sb } = mount()
      act(() => sb().next())
      expect([sb().index, sb().progress]).toEqual([1, 1])
      act(() => sb().goto(2))
      expect([sb().index, sb().progress]).toEqual([2, 1])
      act(() => sb().reset())
      expect([sb().index, sb().progress]).toEqual([0, 1])
    })

    it('play() chiesto dall’utente scorre i passi come diapositive: stati finali, nessun render per fotogramma', () => {
      const { sb, renders } = mount()
      expect(sb().progress).toBe(1) // progress è letto: senza reduced motion costerebbe un render per fotogramma
      act(() => sb().play())
      const before = renders()
      advanceFrameByFrame(512)
      expect([sb().index, sb().progress]).toEqual([0, 1])
      expect(renders()).toBe(before)
      advance(600)
      expect([sb().index, sb().progress]).toEqual([1, 1])
    })

    it('onFrame riceve 1 a ogni passo', () => {
      const seen: [number, number][] = []
      const { sb } = mount({
        onFrame: (progress, index) => {
          seen.push([progress, index])
        },
      })
      act(() => sb().next())
      expect(seen).toEqual([
        [1, 0],
        [1, 1],
      ])
    })
  })

  it('se la preferenza di movimento ridotto arriva a pagina aperta, progress passa a 1', () => {
    const media = stubReducedMotion(false)
    const { sb } = mount()
    expect(sb().progress).toBe(0)
    act(() => media.set(true))
    expect(sb().progress).toBe(1)
  })
})

// ---------------------------------------------------------------------------------------------
// Regressioni della revisione del kit (2026-09-18)
// ---------------------------------------------------------------------------------------------

describe('useReducedMotion: una sola media query', () => {
  it('non crea una MediaQueryList a ogni render', () => {
    const matchMedia = vi.fn((query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }))
    vi.stubGlobal('matchMedia', matchMedia)
    const { result, rerender } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    matchMedia.mockClear()
    for (let i = 0; i < 100; i++) rerender()
    expect(matchMedia).not.toHaveBeenCalled()
  })
})

/** IntersectionObserver finto: il test decide quando un elemento entra o esce dalla vista. */
function stubIntersection() {
  const observers: { cb: IntersectionObserverCallback; targets: Set<Element> }[] = []
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      cb: IntersectionObserverCallback
      targets = new Set<Element>()
      constructor(cb: IntersectionObserverCallback) {
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
  return {
    set(el: Element, visible: boolean) {
      act(() => {
        for (const o of observers) {
          if (o.targets.has(el)) o.cb([{ target: el, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 } as unknown as IntersectionObserverEntry], o as unknown as IntersectionObserver)
        }
      })
    },
    observed: () => observers.reduce((n, o) => n + o.targets.size, 0),
  }
}

describe('useAnimationFrame fuori dalla vista', () => {
  it('con un elemento da guardare si ferma quando esce dalla vista e riparte senza salti quando rientra', () => {
    const frames = stubFrames()
    const io = stubIntersection()
    const el = document.createElement('div')
    document.body.append(el)
    const calls: [number, number][] = []
    const { unmount } = renderHook(() => useAnimationFrame((dt, t) => void calls.push([dt, t]), true, { current: el }))
    frames.frame(16)
    frames.frame(16)
    expect(calls).toEqual([[0, 0], [16, 16]])
    io.set(el, false)
    expect(frames.pending()).toBe(0)
    frames.frame(16)
    frames.wait(5000)
    frames.frame(16)
    expect(calls).toHaveLength(2)
    io.set(el, true)
    frames.frame(16)
    frames.frame(16)
    expect(calls.slice(2)).toEqual([[0, 16], [16, 32]])
    unmount()
    expect(io.observed()).toBe(0)
    el.remove()
  })

  it('dentro un WidgetFrame si ferma quando il widget esce dalla vista (o sta in un pannello chiuso)', () => {
    const frames = stubFrames()
    const io = stubIntersection()
    const onFrame = vi.fn()
    function Ticker() {
      useAnimationFrame(onFrame, true)
      return null
    }
    const meta: WidgetMeta = { id: 'w-prova', moduleId: 'm09-parzen-windows', title: 'Prova', concepts: [], scenario: 'fonte', scenarioNote: 'finto', size: 'S' }
    // jsx() è ciò in cui si compila <WidgetFrame meta={meta} controls={<Ticker />}><svg /></WidgetFrame> (questo file è .ts)
    const { container } = render(jsx(WidgetFrame, { meta, controls: jsx(Ticker, {}), children: jsx('svg', {}) }))
    frames.frame(16)
    expect(onFrame).toHaveBeenCalledTimes(1)
    const section = container.querySelector('section') as HTMLElement
    io.set(section, false)
    frames.frame(16)
    frames.frame(16)
    expect(onFrame).toHaveBeenCalledTimes(1)
    expect(frames.pending()).toBe(0)
    io.set(section, true)
    frames.frame(16)
    expect(onFrame).toHaveBeenCalledTimes(2)
  })
})
