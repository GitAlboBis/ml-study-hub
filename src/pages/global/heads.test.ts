// Le testate delle pagine globali sono una sola testata: stessa squadratura, titolo e letture alla stessa misura.
// Regressione: il titolo era a --step-5 in copertina, flashcard, quiz, formulario, glossario, giochi e orale e a
// --step-4 in mappa, progressi, copertura, impostazioni e nel singolo gioco; le cifre della testata a --step-1 in
// flashcard e quiz e a --step--1 altrove; la squadratura (TICKS) copiata in otto file.
// Controllo sul sorgente (letto da Vite come testo): le misure sono classi, e jsdom non calcola gli stili.
import { describe, expect, it } from 'vitest'
import { HEAD_READINGS, PAGE_TITLE } from './ui'

const SOURCES = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}'], { query: '?raw', import: 'default', eager: true })
/** Il testo di un file, per percorso relativo a src/. */
const read = (file: string) => {
  const src = SOURCES[`/src/${file}`]
  if (src === undefined) throw new Error(`File non trovato: ${file}`)
  return src
}

/** I file che disegnano la testata di una pagina globale. */
const HEADS = [
  'pages/Home.tsx',
  'pages/CourseMap.tsx',
  'pages/CoursePage.tsx',
  'pages/OralSimulator.tsx',
  'pages/games/GamesHub.tsx',
  'pages/games/Game.tsx',
  'pages/global/PageHead.tsx', // progressi, copertura, impostazioni
  'pages/practice/parts.tsx', // flashcard, quiz
  'pages/reference/parts.tsx', // formulario, glossario
]

describe('testate delle pagine globali', () => {
  it('la squadratura della cornice (TICKS) è definita una volta sola, in global/ui.ts', () => {
    const owners = Object.entries(SOURCES)
      .filter(([, src]) => /\bconst TICKS\b/.test(src))
      .map(([file]) => file.replace('/src/', ''))
    expect(owners).toEqual(['pages/global/ui.ts'])
  })

  it('ogni titolo di pagina (h1 della testata) usa la misura comune PAGE_TITLE, a --step-5', () => {
    expect(PAGE_TITLE).toContain('text-[length:var(--step-5)]')
    for (const file of HEADS) {
      // gli h1 delle testate: i messaggi d'errore ("Questo gioco non esiste") non sono il nome di una pagina
      const heads = [...read(file).matchAll(/<header[\s\S]*?<\/header>/g)].map((m) => m[0])
      const h1s = heads.flatMap((head) => [...head.matchAll(/<h1[\s\S]*?<\/h1>/g)].map((m) => m[0]))
      expect(h1s.length, file).toBeGreaterThan(0)
      for (const h1 of h1s) {
        // la sola eccezione è la riga compatta dell'orale durante la prova, che deve lasciare la domanda nel primo schermo
        expect(/\{PAGE_TITLE\}|\$\{PAGE_TITLE\}|PAGE_TITLE_COMPACT/.test(h1), `${file}: ${h1.slice(0, 120)}`).toBe(true)
        expect(h1, file).not.toMatch(/text-\[length:var\(--step-[345]\)\][^"]*uppercase/)
      }
    }
  })

  it('le letture della testata (dl) usano HEAD_READINGS: etichette e cifre a --step--1 ovunque', () => {
    expect(HEAD_READINGS).toContain('text-[length:var(--step--1)]')
    for (const file of HEADS) {
      for (const [head] of read(file).matchAll(/<header[\s\S]*?<\/header>/g)) {
        if (!head.includes('<dl')) continue
        expect(head, file).toMatch(/<dl className=\{HEAD_READINGS\}|<dl className=\{`\$\{HEAD_READINGS\}/)
        // le cifre non tornano grandi dentro la testata
        expect(head, file).not.toMatch(/<dd[^>]*text-\[length:var\(--step-[0-9]\)\]/)
      }
    }
  })
})
