import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createFrameChannel, useFrameChannel } from './frameChannel'

describe('createFrameChannel', () => {
  it('avvisa solo quando cambia qualcosa', () => {
    const ch = createFrameChannel()
    const l = vi.fn()
    const off = ch.subscribe(l)
    ch.set(0, 0)
    expect(l).not.toHaveBeenCalled()
    ch.set(0.5, 0)
    ch.set(0.5, 1)
    expect(l).toHaveBeenCalledTimes(2)
    expect(ch.get()).toEqual({ progress: 0.5, index: 1 })
    off()
    ch.set(1, 1)
    expect(l).toHaveBeenCalledTimes(2)
  })
})

describe('useFrameChannel', () => {
  it('a storyboard fermo un passo appena raggiunto mostra il suo stato finale; in riproduzione il tempo vero', () => {
    const ch = createFrameChannel()
    const { result, rerender } = renderHook(({ playing }) => useFrameChannel(ch, playing), { initialProps: { playing: false } })
    expect(result.current).toEqual({ index: 0, progress: 1 })
    rerender({ playing: true })
    expect(result.current).toEqual({ index: 0, progress: 0 })
    act(() => ch.set(0.4, 0))
    expect(result.current.progress).toBe(0.4)
    // pausa a metà passo: resta dov'era
    rerender({ playing: false })
    expect(result.current.progress).toBe(0.4)
  })
})
