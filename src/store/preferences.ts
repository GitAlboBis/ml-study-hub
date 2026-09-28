// Preferenze dell'app, separate dai progressi (non finiscono nei backup): riduci movimento, dimensione del
// testo. Salvate in localStorage e applicate a <html> a ogni cambio e all'import di questo modulo: main.tsx lo
// importa una volta perché valgano da subito, non solo dopo aver aperto /impostazioni.
// Qui c'è anche il tema come store esterno (useThemeChoice): la scelta la salva e la applica src/lib/theme.ts,
// questo modulo la legge e la tiene aggiornata osservando <html data-theme>, così un interruttore del tema in
// un punto qualsiasi dell'app si vede anche negli altri.
import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { readThemeChoice } from '../lib/theme'
import type { ThemeChoice } from '../lib/theme'

export const PREFERENCES_KEY = 'ml-study-preferences-v1'
const PREFERENCES_VERSION = 1

export const TEXT_SIZES = ['normale', 'grande', 'molto-grande'] as const
export type TextSize = (typeof TEXT_SIZES)[number]

/** Scala della radice del documento: tipografia, spazi e reticolo sono in rem e seguono. */
export const TEXT_SCALE: Record<TextSize, string> = { normale: '', grande: '112.5%', 'molto-grande': '125%' }

export interface Preferences {
  /** meno movimento anche se il sistema non lo chiede: si somma a prefers-reduced-motion, non lo sostituisce */
  reduceMotion: boolean
  textSize: TextSize
}

export interface PreferencesActions {
  setReduceMotion(on: boolean): void
  setTextSize(size: TextSize): void
  resetPreferences(): void
}

export const defaultPreferences = (): Preferences => ({ reduceMotion: false, textSize: 'normale' })

// ---------------------------------------------------------------------------------------------
// Applicazione al documento
// ---------------------------------------------------------------------------------------------

export const MOTION_STYLE_ID = 'ml-study-motion'
// Stessa regola di base.css per prefers-reduced-motion, agganciata all'attributo. Sta qui e non in un foglio di
// stile perché nasca con la preferenza: chi sposta la regola in base.css può togliere ensureMotionStyle.
const MOTION_CSS = `html[data-motion='ridotto'] *, html[data-motion='ridotto'] *::before, html[data-motion='ridotto'] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}`

function ensureMotionStyle(doc: Document) {
  if (doc.getElementById(MOTION_STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = MOTION_STYLE_ID
  style.textContent = MOTION_CSS
  doc.head.append(style)
}

/** Applica le preferenze a `root` (di norma <html>): dimensione del testo in linea e data-motion. */
export function applyPreferences(p: Preferences, root: HTMLElement = document.documentElement) {
  root.style.fontSize = TEXT_SCALE[p.textSize]
  if (p.reduceMotion) {
    ensureMotionStyle(root.ownerDocument)
    root.dataset.motion = 'ridotto'
  } else delete root.dataset.motion
}

// ---------------------------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------------------------

/** localStorage che non lancia: bloccato o pieno, le preferenze valgono per la sessione. */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // storage non disponibile o pieno
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // idem
    }
  },
}

/** Tiene solo i campi noti e validi di un salvataggio; il resto torna al predefinito. */
function readPreferences(value: unknown): Preferences {
  const d = defaultPreferences()
  if (typeof value !== 'object' || value === null) return d
  const o = value as Record<string, unknown>
  return {
    reduceMotion: typeof o.reduceMotion === 'boolean' ? o.reduceMotion : d.reduceMotion,
    textSize: TEXT_SIZES.find((s) => s === o.textSize) ?? d.textSize,
  }
}

export const usePreferences = create<Preferences & PreferencesActions>()(
  persist(
    (set) => ({
      ...defaultPreferences(),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setTextSize: (textSize) => set({ textSize }),
      resetPreferences: () => set(defaultPreferences()),
    }),
    {
      name: PREFERENCES_KEY,
      version: PREFERENCES_VERSION,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (s): Preferences => ({ reduceMotion: s.reduceMotion, textSize: s.textSize }),
      merge: (persisted, current) => ({ ...current, ...readPreferences(persisted) }),
    },
  ),
)

if (typeof document !== 'undefined') {
  // l'idratazione da localStorage è sincrona: qui lo stato è già quello salvato
  applyPreferences(usePreferences.getState())
  usePreferences.subscribe((s, prev) => {
    if (s.reduceMotion !== prev.reduceMotion || s.textSize !== prev.textSize) applyPreferences(s)
  })
}

// ---------------------------------------------------------------------------------------------
// Tema come store esterno
// ---------------------------------------------------------------------------------------------

/**
 * Avvisa quando il tema cambia: applyThemeChoice riscrive sempre <html data-theme> (anche con lo stesso valore,
 * e un MutationObserver lo vede comunque), e l'evento storage copre le altre schede del browser.
 */
export function subscribeThemeChoice(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  window.addEventListener('storage', onChange)
  return () => {
    observer.disconnect()
    window.removeEventListener('storage', onChange)
  }
}

/** La scelta del tema (giorno, notte, sistema), aggiornata ovunque venga cambiata. Si cambia con applyThemeChoice. */
export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribeThemeChoice, readThemeChoice, (): ThemeChoice => 'system')
}
