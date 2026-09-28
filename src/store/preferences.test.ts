import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyThemeChoice } from '../lib/theme'
import { applyPreferences, defaultPreferences, MOTION_STYLE_ID, PREFERENCES_KEY, useThemeChoice, usePreferences } from './preferences'

const html = document.documentElement

beforeEach(() => {
  // jsdom non ha matchMedia: il tema "sistema" la interroga
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }))
  localStorage.clear()
  usePreferences.getState().resetPreferences()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('preferenze dell\'app', () => {
  it('partono dai valori predefiniti: movimento del sistema e testo normale', () => {
    expect(defaultPreferences()).toEqual({ reduceMotion: false, textSize: 'normale' })
    expect(usePreferences.getState()).toMatchObject(defaultPreferences())
    expect(html.style.fontSize).toBe('')
    expect(html.dataset.motion).toBeUndefined()
  })

  it('la dimensione del testo scala la radice del documento, quindi tutto il reticolo in rem', () => {
    act(() => usePreferences.getState().setTextSize('grande'))
    expect(html.style.fontSize).toBe('112.5%')
    act(() => usePreferences.getState().setTextSize('molto-grande'))
    expect(html.style.fontSize).toBe('125%')
    act(() => usePreferences.getState().setTextSize('normale'))
    expect(html.style.fontSize).toBe('')
  })

  it('riduci movimento segna <html> e aggiunge una sola volta la regola che spegne transizioni e animazioni', () => {
    act(() => usePreferences.getState().setReduceMotion(true))
    expect(html.dataset.motion).toBe('ridotto')
    const style = document.getElementById(MOTION_STYLE_ID)
    expect(style?.textContent).toMatch(/\[data-motion='ridotto'\][\s\S]*transition-duration/)
    act(() => usePreferences.getState().setReduceMotion(false))
    act(() => usePreferences.getState().setReduceMotion(true))
    expect(document.querySelectorAll(`#${MOTION_STYLE_ID}`)).toHaveLength(1)
    act(() => usePreferences.getState().setReduceMotion(false))
    expect(html.dataset.motion).toBeUndefined()
  })

  it('si salvano in localStorage e un valore salvato non valido torna al predefinito', async () => {
    act(() => usePreferences.getState().setTextSize('molto-grande'))
    expect(JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}').state).toEqual({ reduceMotion: false, textSize: 'molto-grande' })
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ state: { reduceMotion: 'sì', textSize: 'enorme' }, version: 1 }))
    await act(() => usePreferences.persist.rehydrate())
    expect(usePreferences.getState()).toMatchObject(defaultPreferences())
  })

  it('applyPreferences funziona anche su un elemento qualsiasi (niente stato globale nascosto)', () => {
    const root = document.createElement('div')
    applyPreferences({ reduceMotion: true, textSize: 'grande' }, root)
    expect(root.style.fontSize).toBe('112.5%')
    expect(root.dataset.motion).toBe('ridotto')
  })
})

describe('useThemeChoice', () => {
  it('segue il tema scelto da qualunque parte dell\'app (anche dall\'interruttore della barra)', async () => {
    const { result } = renderHook(() => useThemeChoice())
    expect(result.current).toBe('system')
    act(() => applyThemeChoice('dark'))
    await waitFor(() => expect(result.current).toBe('dark'))
    act(() => applyThemeChoice('system'))
    await waitFor(() => expect(result.current).toBe('system'))
  })
})
