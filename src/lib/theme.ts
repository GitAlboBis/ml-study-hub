export type ThemeChoice = 'system' | 'light' | 'dark'

/** Stessa chiave dello script in index.html, che applica il tema prima del primo paint. */
const KEY = 'ml-study-theme'

export const readThemeChoice = (): ThemeChoice => {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

/** Salva la scelta e la applica a <html data-theme>. 'system' segue il sistema operativo. */
export function applyThemeChoice(choice: ThemeChoice) {
  try {
    if (choice === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, choice)
  } catch {
    // storage non disponibile: il tema vale per questa sessione
  }
  const dark = choice === 'dark' || (choice === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}
